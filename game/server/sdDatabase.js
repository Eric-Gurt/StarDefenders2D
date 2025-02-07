/*

	Implementing the most simple database possible - just a serializable JS object

	Not ready.

	This should implement:
	 - Movement from server to server
	 - Ability to start new worlds, automatically assign free expedition_worker servers
	 - Account management
	 - Saving/restoring player items
	 - Letting players respawn with losing only portion of their score on death
	 - Base movement between servers (with steering wheel)
	 - Assist player and help him/her find server where his/her character is

	 Note: /db command currently does not edit remote databases, nor does it introduce permission levels

	 TODO: Implement logging

	 TODO: Implement permissions logic
*/

/* global sdServerToServerProtocol, globalThis */

import fs from 'fs';

import sdWorld from '../sdWorld.js';
import sdWeather from '../entities/sdWeather.js';
import sdBlock from '../entities/sdBlock.js';
import sdModeration from './sdModeration.js';

class sdDatabase
{
	static GenerateHash( length )
	{
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-+:;[]{},.|!@#$%^&*() ';
		var charactersLength = characters.length;
		
		for ( var i = 0; i < length; i++ )
		result += characters.charAt( ~~( Math.random() * charactersLength ) );
		
		return result;
	}
	static init_class()
	{
		// Must be JSON-able. Following is an example of use + some basic structure
		sdDatabase.data = 
		{
			// Top-level properties will be saved to separate files. For example to allow translations to be copied from server to server
	
			// .sample_row property might be later implemented as source of default values, either when making new rows in tables or whenever getting values from tables (less data to save if new accounts are as empty as possible)
	
			players: 
			{
				database_key_wipe_version: 2, // If this changes - whole database is getting cleared on startup. In this case it is referred to "players" object
				
				next_uid: 0, // Auto-increment
		
				sample_row:
				{
					uid: 'PLAYER_SAMPLE',
					password: sdDatabase.GenerateHash( 32 ),
					
					current_server: 'https://www.gevanni.com:3000', // Will assist with figuring out where player is. Needs to be updated whenever character dies or moves to another server
					current_access_token: sdDatabase.GenerateHash( 16 ), // Clients will use these on secondary servers after they successfully authentuicated on main server
					
					entity_snapshot: {}, // Updated every time settings are changed. Not sure why it is for, perhaps to display user avatar. Would be good to have just color palette, helmet/body/legs model IDs and nickname
					settings_snapshot: {}, // Updated every time settings are changed
					
					registration_time: Date.now(),
					last_activity_time: Date.now(), // If user is offline for too long he would start losing credits. When out of credits - user is removed and items are given away. But depending on server config it might just move user to archieve instead, which is not implemented
					
					mothership_storage_per_game_mode:
					{
						expedition: 
						[
					
						],
						sandbox:
						[
							// List of entity snapshots basically or even groups of entities (in case of inter-planetary escape?). Can be sent/received to/from mothership in LRTP.
							// Most probably these entities could be given away to other players randomly if account gets abondoned
							/*{
								_class: 'sdCrystal',
								other_props: '...'
							}*/
						]
					},
					
					characters:
					{
						// List of arrays of snapshots of created characters, perhaps. UID could be a biometry number. Each character includes not just sdCharacter but sdStatusEffect-s, sdGun-s at very least.
						/*
						
						213781:
						{
							world_uid: 12, // Where is this character now?
							snapshots: 
							[
								{ _class: 'sdCharacter' ... },
								{ _class: 'sdGun' ... },
								{ _class: 'sdGun' ... }
							]
						}

						*/
					},
					last_character_creation_time: Date.now(), // Some rate limiting because biometry can overlap in theory, with very small chance though
					
					known_ips: {}, // Maybe will be used for banning. { IP: time }
					browser_fingerprints: {}, // Same as IPs
					
					credits: 0,
					
					kills: 0,
					deaths: 0,
					
					missions_complete: 0,
					missions_failed: 0,
					
					//karma: 0, // Automatic bans from reporting
					//karma_banned_times: 0, // Increases ban duration
					
					recent_mission_results: [], // [ 0, 1, 0, 0, 0, 1, 1, 1 ], // Perhaps to measure skill?
					
					mob_kills: {
						//sdOverlord: 1,
						//sdVirus: 5
					},
					
					friends: [], // [ 0, 1, 2 ], // UIDs
					
					owned_presets: [] // [ 0, 1, 2 ] // Will be used to delete non-permanent presets (such as base presets for reference or construction drones)
				},
				
				table: 
				{
					// Keys are UIDs
				}
			},
			
			world:
			{
				database_key_wipe_version: 2, // If this changes - whole database is getting cleared on startup. In this case it is referred to "world" object
				
				next_uid: 0, // Auto-increment
				
				sample_row:
				{
					uid: 'WORLD_SAMPLE',
					name: 'Expedition on Mars', // It is possible to generate random planet names
					
					current_server: null,// 'https://www.gevanni.com:3000', // Where this world is currently bound to? If it is unbound - current_server should be null
					
					last_active: Date.now(), // If inactive for too long - gets removed
					
					world_snapshot: {}, // Just so servers can go into hibernation mode whenever everyone disconnects. Perhaps this can be a zip string? Zip strings are ~1 mb in size
					
					seed_properties:
					{
						mobs_damage_scale: 1,
						mobs_count_factor: 1,
						crystals_count_factor: 1,
						crystals_value_factor: 1,
						allowed_events: 
						[ 
							sdWeather.EVENT_ERTHALS 
						],
						terrain_kinds: 
						[  
							{ 
								material: sdBlock.MATERIAL_GROUND,
								hp_mult: 1
							},
							{ 
								material: sdBlock.MATERIAL_ROCK,
								hp_mult: 1
							},
							{ 
								material: sdBlock.MATERIAL_SAND,
								hp_mult: 1
							}
						],
						terrain_contents:
						[
							{
								class: 'sdVirus',
								hp_mult: 1,
								spawn_chance: 0.1
							},
							{
								class: 'sdCrystal',
								spawn_chance: 0.1
							}
						]
					}
				},
				
				table: 
				{
					// Keys are UIDs
				}
			},
			
			servers:
			{
				database_key_wipe_version: 2, // If this changes - whole database is getting cleared on startup. In this case it is referred to "servers" object
				
				// next_uid not used because keys are server URLs, perhaps
				
				sample_row: 
				{
					url: 'https://www.gevanni.com:3000',
					current_world: 'WORLD_SAMPLE',
					game_mode: 'sandbox',
					last_ping: Date.now(), // Do not use secondary servers as world hosters if they've been offline for long enough
					online: 0 // Server will be able to tell if it is being played on. If not - it will be possible to use it for world hosting
				},

				table: 
				{
					// Keys are URLs, perhaps
				}
			},

			// These can be used in singpleplayer as well as by construction drones in shape of blueprints
			presets:
			{
				database_key_wipe_version: 2, // If this changes - whole database is getting cleared on startup. In this case it is referred to "presets" object
				
				next_uid: 0, // Auto-increment
		
				sample_row:
				{
					origin_x: 0,
					origin_y: 0,
					snapshot_entities: [],

					owned_by_uid: 'PLAYER_SAMPLE',

					is_permanent: true // Admins could edit these to build SD universe. is_permanent should be false in case of preset being related to player - in this case it would be removed together with player who made it
				},
		
				table: 
				{
					/*mothership:
					{
						origin_x: 0,
						origin_y: 0,
						snapshot_entities: [],

						owned_by_uid: 'PLAYER_SAMPLE',

						is_permanent: true // Admins could edit these to build SD universe. is_permanent should be false in case of preset being related to player - in this case it would be removed together with player who made it
					}*/
				}
			},
			
			translations:
			{
				database_key_wipe_version: 2, // If this changes - whole database is getting cleared on startup. In this case it is referred to "translations" object
				
				unapproved_uids: null, // Limit count of suggestions
				
				time_to_live: 1000 * 60 * 60 * 24 * 4, // 4 days
				
				outdated_translations: null, // Those are asking to be disapproved so onThink will delete them
		
				sample_row:
				{
					first_use: Date.now(), // When translation was added
					last_use: Date.now(), // When translation was used last time
					use_count: 0, // How many times translation was used
					approved: false, // Approved translations are permanent. Unapproved translations expire. Game does not really know which lines are to be translated so all translations are approved manually
					
					// Same languages as in sdWorld.server_config.supported_languages
					en: '?',//'Welcome to Star Defenders!',
					//ua: 'Ласкаво прошу до Зоряних Захисників!'
				},

				table: {
					// UID is English text basically, string in case of translations being strings, array.join('/') in case of translations being array of strings
				}
			},
			
			moderation:
			{
				database_key_wipe_version: 2, // If this changes - whole database is getting cleared on startup. In this case it is referred to "presets" object
				
				activity_logs:
				{
					next_uid: 0, // Auto-increment
			
					time_to_live: 1000 * 60 * 60 * 24 * 4, // 4 days
			
					sample_row: 
					{
						initiator: 'user#123', // Hash or user_uid
						initiator_server: 'local', // Or remote secondary server
						action: 'user#123 modifies sdDatabase.data.translations.Welcome to star defenders!.ua = "Ласкаво прошу до Зоряних Захисників!"',
						category: '?',
						
						time: Date.now() // Used to auto-remove
					},
		
					table:
					{
					}
				},
				
				database_permissions: // Only for non-superusers
				{
					sample_row: // Or maybe hash? Or maybe 'user#123' which will auto-evalute into nickname? Probably user pointer is much better approach.
					{
						read: [ 'translations' ], // Or '*' instead of array
						write: [ 'translations.table' ], // Or '*' instead of array
						execute: [ 'translations' ] // Or '*' instead of array // We might build-in command eval macros at some point? For example to let admins ban certain players, remove some kind of spam
					},
					
					table:
					{
						// For now, keys are hashes. But only because we don't have registration implemented
					}
				},
				
				failed_logins: // If login attempt fails and IP of user does not match as well - that is getting logged there
				{
					time_to_live: 1000 * 60 * 60 * 12 * 2, // 2 days
					
					sample_row:
					{
						tries: 1, // Tries should only count unique password attempts
						tried_passwords: {}, // If there is too many different passwords - it is a sign of bruteforcing. Same passwords won't count
						attempts_from_ips: {}, // Used in table_by_player_uid only - if there is too many failed attempts from unknown IPs we just ban all of them
						time: Date.now(), // 2 days
					},
			
					table_by_ip:
					{
						// Key is IP
					},
			
					table_by_player_uid:
					{
						// Key is player UID - can be useful to detect distributed bruteforce attacks
					}
				},
				
				bans:
				{
					next_uid: 0,
			
					sample_row:
					{
						uid: 0, // Will be same in both tables
						reason_public: 'Killing new players',
						reason_private: 'This user has been given way too many chances, do not unban',
						until: Date.now() + 1000 * 60 * 60 * 24 * 7
					},
			
					table_by_ip:
					{
						// Key is IP
					},
			
					table_by_user_uid:
					{
						// Key is user_uid/hash
					},
			
					table_by_challenge:
					{
						// Key is challenge result
					}
				}
			}
		};
		
		sdDatabase.is_local = ( !sdWorld.server_config.database_server );
		
		sdDatabase.permissions_cache = new Map();
		// Test
		/*if ( sdDatabase.is_local )
		{
			console.warn( 'Filling database with test data' );
			for ( let i = 0; i < 1000; i++ )
			{
				let sample_player = sdDatabase.data.players.sample_row;
				let TRANSLATION_SAMPLE = sdDatabase.data.translations.sample_row_1;

				if ( Object.keys( sdDatabase.data.players.table ).length < 1000 )
				sdDatabase.data.players.table[ sdDatabase.data.players.next_uid++ ] = JSON.parse( JSON.stringify( sample_player ) );

				if ( Object.keys( sdDatabase.data.translations.table ).length < 1000 )
				sdDatabase.data.translations.table[ 'TRANSLATION_SAMPLE_AUTO_' + i ] = JSON.parse( JSON.stringify( TRANSLATION_SAMPLE ) );
			}
		}*/
		
		sdDatabase.think_delay = 1000 * 60;
		
		// Load/recreate
		if ( sdDatabase.is_local )
		{
			let keys = Object.keys( sdDatabase.data );
			
			for ( let i = 0; i < keys.length; i++ )
			{
				let key = keys[ i ];
				
				let sub_database_file_path = sdWorld.database_data_path_const.split( '<KEY>' ).join( key );
				
				if ( globalThis.file_exists( sub_database_file_path ) )
				{
					let potential = JSON.parse( fs.readFileSync( sub_database_file_path ) );
					
					if ( potential.database_key_wipe_version === sdDatabase.data[ key ].database_key_wipe_version )
					{
						//sdDatabase.data[ key ] = Object.assign( sdDatabase.data[ key ], potential );
						sdDatabase.data[ key ] = sdDatabase.RecursiveObjectAssign( sdDatabase.data[ key ], potential );
						
						// Remove next line after July 2023 - it patches old object snapshots for them to be observable in /db editor
						sdDatabase.data[ key ] = sdDatabase.SanitizeUnderscores( sdDatabase.data[ key ] );
					}
					else
					{
						let new_path = sub_database_file_path.split( '.v' ).join( '_OLD_' + potential.database_key_wipe_version + '.v' );
						
						trace( 'Warning: Re-creating new database file in order to store sdDatabase.data.' + key + ' property value due to .database_key_wipe_version mismatch! Old database will be moved to ' + new_path );
						
						fs.rename( sub_database_file_path, new_path, ( err )=>
						{
							if ( err )
							throw new Error( 'Error: Unable to rename old database!' );
							
							sdDatabase.Save( key );
						});
					}
				}
				else
				{
					trace( 'Database (key: '+key+') is set to be stored on this server but did not exist before. Creating new file in order to store sdDatabase.data.' + key + ' property value.' );
					sdDatabase.Save( key );
				}
			}
			
			delete sdDatabase.data.moderation.bans.sample_row.reason; // No longer used
			
			setTimeout( sdDatabase.onThink, 0 ); // Do first one instantly just to check if there is nothing that will crash server
		}
		else
		{
			sdDatabase.data = null;
		}
	}
	static RecursiveObjectAssign( missing_values, current_values )
	{
		//missing_values = Object.assign( missing_values, current_values );
		
		//for ( let p in missing_values )
		for ( let p in current_values )
		{
			if ( missing_values[ p ] instanceof Object && current_values[ p ] instanceof Object )
			{
				missing_values[ p ] = sdDatabase.RecursiveObjectAssign( missing_values[ p ], current_values[ p ] );
			}
			else
			{
				missing_values[ p ] = current_values[ p ];
			}
		}
		
		return missing_values;
	}
	static LogActivity( initiator_hash_or_user_uid, initiator_server, action, category )
	{
		let activity_logs = sdDatabase.data.moderation.activity_logs;

		let row = Object.assign( {}, activity_logs.sample_row );

		row.initiator = initiator_hash_or_user_uid;
		row.initiator_server = initiator_server;
		row.action = action;
		row.category = category;

		activity_logs.table[ activity_logs.next_uid++ ] = row;
	}
	static onThink()
	{
		let time = Date.now();
		
		// Translations cleanup + reporting outdated translations
		{
			let outdated_translations = [];
			
			let unapproved_uids = [];
			
			let table = sdDatabase.data.translations.table;
			let time_to_live = sdDatabase.data.translations.time_to_live;
			
			if ( typeof time_to_live !== 'number' )
			throw new Error();
		
			if ( table.__proto__ !== Object.prototype )
			throw new Error();
			
			for ( let p in table )
			{
				let row = table[ p ];
				
				if ( row instanceof Object ) // In case someone would try to make property there
				{
					if ( !row.approved )
					{
						if ( time > row.last_use + time_to_live )
						delete table[ p ];
						else
						unapproved_uids.push( p );
					}
					else
					{
						if ( time > row.last_use + 1000 * 60 * 60 * 24 * 30 ) // Never used for a month
						outdated_translations.push( p );
					}
				}
				else
				delete table[ p ];
			}
			if ( outdated_translations.length > 0 )
			sdDatabase.data.translations.outdated_translations = outdated_translations;
			else
			sdDatabase.data.translations.outdated_translations = null;
		
			if ( unapproved_uids.length > 0 )
			sdDatabase.data.translations.unapproved_uids = unapproved_uids;
			else
			sdDatabase.data.translations.unapproved_uids = null;
		}
		
		// Moderation logs cleanup
		{
			let table = sdDatabase.data.moderation.activity_logs.table;
			let time_to_live = sdDatabase.data.moderation.activity_logs.time_to_live;
			
			if ( typeof time_to_live !== 'number' )
			throw new Error();
		
			if ( table.__proto__ !== Object.prototype )
			throw new Error();
			
			for ( let p in table )
			{
				let row = table[ p ];

				if ( row instanceof Object ) // In case someone would try to make property there
				{
					if ( time > row.time + time_to_live )
					delete table[ p ];
				}
				else
				delete table[ p ];
			}
		}
		
		// Failed logins cleanup
		{
			let time_to_live = sdDatabase.data.moderation.failed_logins.time_to_live;
			
			if ( typeof time_to_live !== 'number' )
			throw new Error();
			
			for ( let t = 0; t < 2; t++ )
			{
				let table = ( t === 0 ) ? 
						sdDatabase.data.moderation.failed_logins.table_by_ip : 
						sdDatabase.data.moderation.failed_logins.table_by_player_uid;
		
				if ( table.__proto__ !== Object.prototype )
				throw new Error();

				for ( let p in table )
				{
					let row = table[ p ];

					if ( row instanceof Object ) // In case someone would try to make property there
					{
						if ( time > row.time + time_to_live )
						delete table[ p ];
					}
					else
					delete table[ p ];
				}
			}
		}
		
		// Outdated users cleanup
		{
			let table = sdDatabase.data.players.table;
			let time_to_live_empty = 1000 * 60 * 60 * 24 * 7; // 7 weeks just so they could be banned too
			let time_to_live_important = 1000 * 60 * 60 * 24 * 30 * 6; // 6 months
			
			for ( let p in table )
			{
				let row = table[ p ];

				if ( row instanceof Object ) // In case someone would try to make property there
				{
					let is_empty = ( 
						row.mothership_storage_per_game_mode.expedition.length === 0 && 
						row.mothership_storage_per_game_mode.sandbox.length === 0
					);
					
					if ( time > row.last_activity_time + ( is_empty ? time_to_live_empty : time_to_live_important ) )
					delete table[ p ];
				}
				else
				delete table[ p ];
			}
		}
		
		let delta = Date.now() - time;
		
		if ( delta > 50 )
		{
			console.warn( 'Warning: Slow database onThink! Took ' + delta + 'ms' );
		}
		
		setTimeout( sdDatabase.onThink, sdDatabase.think_delay );
	}
	static Save( key='*' )
	{
		let promises = [];
		
		if ( sdDatabase.is_local )
		{
			if ( key === '*' )
			{
				let keys = Object.keys( sdDatabase.data );

				for ( let i = 0; i < keys.length; i++ )
				{
					let key = keys[ i ];

					promises.push( ...sdDatabase.Save( key ) );
				}

				return promises;
			}

			if ( sdDatabase.data[ key ] === undefined )
			throw new Error( 'sdDatabase.data.' + key + ' does not exist - unable to perform saving (it won\'t be loaded anyway unless this property exists on example structure at sdDatabase.js file)');

	
			let sub_database_file_path = sdWorld.database_data_path_const.split( '<KEY>' ).join( key );
			
			let promise = new Promise( ( resolve, reject )=>{ 
				
				fs.writeFile( sub_database_file_path + 'bac.v', JSON.stringify( sdDatabase.data[ key ] ), ( err )=>{

					if ( err )
					{
						console.warn( 'Unable to save database to a backup file ' + sub_database_file_path + 'bac.v' );
					}
					else
					fs.rename( sub_database_file_path + 'bac.v', sub_database_file_path, ( err )=>
					{
						if ( err )
						{
							console.warn( 'Unable to move saved database from a backup file to ' + sub_database_file_path );
						}
						else
						resolve();
					});

				});
			});
			
			promises.push( promise );
			
		}
		
		return promises;
	}
	static Exec( array_of_request_objects, callback=null, initiator_server='?' ) // In order to stack requests it receives arrays of objects instead of just object for array_of_request_objects
	{
		if ( sdDatabase.is_local )
		{
			const allowed_methods = new Set();
			allowed_methods.add( 'DBEditorCommand' );
			allowed_methods.add( 'DBTranslate' );
			allowed_methods.add( 'DBManageSavedItems' );
			allowed_methods.add( 'DBLogIP' );
			allowed_methods.add( 'DBBanUnbanByHash' );
			//allowed_methods.add( 'DBReportHash' );
			
			
			for ( let i = 0; i < array_of_request_objects.length; i++ )
			{
				let request_object = array_of_request_objects[ i ];
				
				let method_arguments = request_object;
				let method = method_arguments.shift(); // Gets first value and removes it from method_arguments
				
				if ( allowed_methods.has( method ) )
				{
					//trace( 'Executing database request: ', method_arguments );
					
					sdWorld.world_has_unsaved_changes = true;

					let responses = [];

					sdDatabase[ method ]( responses, initiator_server, ...method_arguments );

					if ( callback )
					{
						//trace( 'Giving database responses', responses );

						callback( responses );
					}
				}
				else
				{
					debugger; // Method is not allowed by the allowed_methods Set. Would never happen otherwise
					callback( null );
				}
			}
		}
		else
		{
			sdServerToServerProtocol.SendData( 
				sdWorld.server_config.database_server, 
				{
					action: 'db',
					request: array_of_request_objects
				}, 
				( response=null )=>
				{
					if ( response === null )
					{
						trace( 'Error with database request (might be a connection issue or an unsupported method call)', array_of_request_objects );
						return;
					}

					if ( callback )
					callback( response );
				}
			);
		}
	}
	
	
	/*static HandleCommandFromAdmin( socket, initiator_hash_or_user_uid, type, path_parts, new_value=null )
	{
		sdDatabase.Exec( 
			[ 
				[ 'DBEditorCommand', initiator_hash_or_user_uid, type, path_parts, new_value ] 
			], 
			( responses )=>
			{
				// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server
				
				for ( let i = 0; i < responses.length; i++ )
				{
					let response = responses[ i ];

					socket.emit( response[ 0 ], response[ 1 ] );
				}
			},
			'localhost'
		);
	}*/
	
	static GetDatabasePermissionsFor( initiator_hash_or_user_uid )
	{
		let permissions = sdDatabase.data.moderation.database_permissions.table[ initiator_hash_or_user_uid ];
		
		// Old way (still relevant?)
		if ( !permissions )
		{
			let my_admin_row = null;
			
			if ( initiator_hash_or_user_uid !== null )
			for ( let a = 0; a < sdModeration.data.admins.length; a++ )
			if ( sdModeration.data.admins[ a ].my_hash === initiator_hash_or_user_uid )
			//if ( sdModeration.data.admins[ a ].access_level === 0 )
			{
				my_admin_row = sdModeration.data.admins[ a ];
				break;
			}
			
			if ( my_admin_row )
			if ( my_admin_row.access_level === 0 )
			{
				permissions = {};
				
				for ( let p in sdDatabase.data.moderation.database_permissions.sample_row )
				{
					if ( sdDatabase.data.moderation.database_permissions.sample_row[ p ] instanceof Array )
					permissions[ p ] = '*';
					else
					permissions[ p ] = sdDatabase.data.moderation.database_permissions.sample_row[ p ];
				}
			}
		}
	
		return permissions || null;
	}
	static MakeSureUserExists( uid )
	{
		let user = sdDatabase.data.players.table[ uid ];
		
		let t = Date.now();
		
		if ( !user )
		{
			user = JSON.parse( JSON.stringify( sdDatabase.data.players.sample_row ) );
			
			sdDatabase.data.players.table[ uid ] = user;
			
			user.uid = '?';
			user.password = '?';
			user.current_server = '?';
			user.current_access_token = '?';
			
			user.registration_time = t;
			user.last_activity_time = t;
			user.last_character_creation_time = t;
		}
		else
		{
			user.last_activity_time = t;
		}
		
		return user;
	}
	static SanitizeUnderscores( obj ) // _hea -> !hea
	{
		if ( typeof obj === 'object' && obj !== null )
		{
			if ( obj instanceof Array )
			{
				obj = obj.slice();
				
				for ( let i = 0; i < obj.length; i++ )
				obj[ i ] = sdDatabase.SanitizeUnderscores( obj[ i ] );
			}
			else
			{
				obj = Object.assign( {}, obj );

				let props = Object.keys( obj );

				for ( let i = 0; i < props.length; i++ )
				{
					let prop = props[ i ];

					if ( prop.charAt( 0 ) === '_' )
					{
						obj[ '!' + prop.substring( 1 ) ] = sdDatabase.SanitizeUnderscores( obj[ prop ] );
						delete obj[ prop ];
					}
					else
					obj[ prop ] = sdDatabase.SanitizeUnderscores( obj[ prop ] );
				}
			}
		}
		
		return obj;
	}
	static DesanitizeUnderscores( obj ) // !hea -> _hea
	{
		if ( typeof obj === 'object' && obj !== null )
		{
			if ( obj instanceof Array )
			{
				obj = obj.slice();
				
				for ( let i = 0; i < obj.length; i++ )
				obj[ i ] = sdDatabase.DesanitizeUnderscores( obj[ i ] );
			}
			else
			{
				obj = Object.assign( {}, obj );

				let props = Object.keys( obj );

				for ( let i = 0; i < props.length; i++ )
				{
					let prop = props[ i ];

					if ( prop.charAt( 0 ) === '!' )
					{
						obj[ '_' + prop.substring( 1 ) ] = sdDatabase.DesanitizeUnderscores( obj[ prop ] );
						delete obj[ prop ];
					}
					else
					obj[ prop ] = sdDatabase.DesanitizeUnderscores( obj[ prop ] );
				}
			}
		}
		
		return obj;
	}
	
	static GetBan( ip=null, _my_hash=null, challenge=null ) // null if no ban
	{
		let t = Date.now();
		
		let ban = null;
		
		if ( ip !== null && sdDatabase.data.moderation.bans.table_by_ip[ ip ] )
		ban = sdDatabase.data.moderation.bans.table_by_ip[ ip ];
		else
		if ( _my_hash !== null && sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ] )
		ban = sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ];
		else
		if ( challenge !== null && sdDatabase.data.moderation.bans.table_by_challenge[ challenge ] )
		ban = sdDatabase.data.moderation.bans.table_by_challenge[ challenge ];

		let ip_parts = ip ? ip.split(':').join('.').split('.') : null;
		
		// Subnet bans
		if ( !ban )
		if ( ip_parts )
		for ( let i = 0; i < ip_parts.length - 1; i++ )
		{
			let wild_card_ip_length = ip_parts.slice( 0, ip_parts.length - 1 - i ).join('.').length;
			let wild_card_ip = ip.substring( 0, wild_card_ip_length + 1 ) + '*';
			
			if ( sdDatabase.data.moderation.bans.table_by_ip[ wild_card_ip ] )
			ban = sdDatabase.data.moderation.bans.table_by_ip[ wild_card_ip ];
		}
		
		if ( ban )
		{
			if ( ban.until === undefined )
			ban.until = 0;
		
			if ( ban.until !== 0 && t > ban.until )
			{
				if ( sdDatabase.data.moderation.bans.table_by_ip[ ip ] === null )
				delete sdDatabase.data.moderation.bans.table_by_ip[ ip ];
			
				if ( sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ] === null )
				delete sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ];
			
				if ( sdDatabase.data.moderation.bans.table_by_challenge[ challenge ] === null )
				delete sdDatabase.data.moderation.bans.table_by_challenge[ challenge ];
			
				ban = null;
			}
			else
			{
				// Clone bans
				if ( ip !== null )
				if ( _my_hash !== null )
				{
					if ( sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ] )
					{
						if ( !sdDatabase.data.moderation.bans.table_by_ip[ ip ] )
						sdDatabase.data.moderation.bans.table_by_ip[ ip ] = ban;
					
						if ( !sdDatabase.data.moderation.bans.table_by_challenge[ challenge ] )
						sdDatabase.data.moderation.bans.table_by_challenge[ challenge ] = ban;
					}

					if ( sdDatabase.data.moderation.bans.table_by_ip[ ip ] )
					{
						if ( !sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ] )
						sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ] = ban;
					
						if ( !sdDatabase.data.moderation.bans.table_by_challenge[ challenge ] )
						sdDatabase.data.moderation.bans.table_by_challenge[ challenge ] = ban;
					}
					// Do not spread bans from challenge, perhaps it can be faked
					/*if ( sdDatabase.data.moderation.bans.table_by_challenge[ challenge ] )
					{
						if ( !sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ] )
						sdDatabase.data.moderation.bans.table_by_user_uid[ _my_hash ] = ban;
					
						if ( !sdDatabase.data.moderation.bans.table_by_ip[ ip ] )
						sdDatabase.data.moderation.bans.table_by_ip[ ip ] = ban;
					}*/
				}

				return ban;
			}
		}
		return null;
	}
	/*static DBReportHash( responses=[], initiator_server, _my_hash, hash_to_report, reason )
	{
		let my_user = sdDatabase.MakeSureUserExists( _my_hash );
		
		let reported_user = sdDatabase.data.players.table[ hash_to_report ];
		
		if ( reported_user )
		{
			let reason_public = 'User was reported way too many times';
			let reason_private = 'User was reported way too many times (' + reason + ')';
			
			sdDatabase.DBBanUnbanByHash( responses, initiator_server, _my_hash, 'BAN', hash_to_report, reason_public, reason_private, 1000 * 60 * 60 * 24 * 3 );
			
			responses.push([ 'REPORTED', 1 ]);
		}
		
		return responses;
	}*/
	static DBLogIP( responses=[], initiator_server, _my_hash, ip, browser_finger_print=null )
	{
		let user = sdDatabase.MakeSureUserExists( _my_hash );
		
		if ( !user.browser_fingerprints )
		user.browser_fingerprints = {};
		
		let t = Date.now();
		
		user.known_ips[ ip ] = t;
		
		if ( browser_finger_print !== null )
		user.browser_fingerprints[ browser_finger_print ] = t;
		
		for ( let ip in user.known_ips )
		{
			if ( user.known_ips[ ip ] < 1000 * 60 * 60 * 24 * 30 )
			delete user.known_ips[ ip ];
			
			// TODO: Apply IP-range merging here if too many subnet hits (at lest 3?)
		}
		for ( let print in user.browser_fingerprints )
		{
			if ( user.browser_fingerprints[ print ] < 1000 * 60 * 60 * 24 * 30 )
			delete user.browser_fingerprints[ print ];
		}
		
		let ban = sdDatabase.GetBan( ip, _my_hash, browser_finger_print );
		if ( ban )
		responses.push([ 'BANNED', ban.reason_public, ban.until, ban.uid ]);
		
		
		return responses;
	}
	static DBManageSavedItems( responses=[], initiator_server, initiator_hash_or_user_uid, operation, group_title, snapshots=[], relative_x=0, relative_y=0, issue_long_timeout=true )
	{
		if ( !sdWorld.server_config.allow_private_storage )
		{
			responses.push([ 'DENY_WITH_SERVICE_MESSAGE', 'Access Error: Feature is disabled on server' ]);
			return responses;
		}
		
		let user = sdDatabase.MakeSureUserExists( initiator_hash_or_user_uid );
		
		if ( !user )
		{
			responses.push([ 'DENY_WITH_SERVICE_MESSAGE', 'Access Error: User could not be made or found' ]);
			return responses;
		}
		
		let ban = sdDatabase.GetBan( null, initiator_hash_or_user_uid );
		if ( ban )
		{
			responses.push([ 'DENY_WITH_SERVICE_MESSAGE', 'Access Error: Banned' ]);
			return responses;
		}
		
		let items = user.mothership_storage_per_game_mode.sandbox;
		
		if ( operation === 'SAVE' )
		{
			if ( ( items.length >= 10 && sdWorld.server_config.keep_favourite_weapon_on_death === false ) || ( sdWorld.server_config.keep_favourite_weapon_on_death && items.length >= 10 && group_title!== 'Recovered weapon' ) )
			{
				responses.push([ 'DENY_WITH_SERVICE_MESSAGE', 'Too many item groups' ]);
				return responses;
			}
			
			for ( let i = 0; i < items.length; i++ )
			if ( items[ i ].title === group_title )
			{
				responses.push([ 'DENY_WITH_SERVICE_MESSAGE', 'Item group with same name already exists' ]);
				return responses;
			}
			
			items.push({
				title: group_title,
				snapshots: sdDatabase.SanitizeUnderscores( snapshots ),
				relative_x: relative_x,
				relative_y: relative_y,
				available_after: sdWorld.time + ( issue_long_timeout ? ( 1000 * 60 * 60 ) : ( 1000 * 2 ) )
			});
			
			responses.push([ 'SUCCESS' ]);
		}
		else
		if ( operation === 'GET' )
		{
			for ( let i = 0; i < items.length; i++ )
			if ( items[ i ].title === group_title )
			{
				if ( sdWorld.time >= items[ i ].available_after )
				{
					responses.push([ 'GET_RESULT', sdDatabase.DesanitizeUnderscores( items[ i ].snapshots ), items[ i ].relative_x, items[ i ].relative_y ]);
					items.splice( i, 1 );
				}
				return responses;
			}
		}
		else
		if ( operation === 'LIST' )
		{
			for ( let i = 0; i < items.length; i++ )
			responses.push([ 'LIST_RESULT', { title: items[ i ].title, available_after: ( items[ i ].available_after - sdWorld.time ), items: items[ i ].snapshots.length } ]);
		}
		
		return responses;
	}
	static DBTranslate( responses=[], initiator_server, initiator_hash_or_user_uid, lang, str_array )
	{
		let table = sdDatabase.data.translations.table;
		
		for ( let i = 0; i < str_array.length; i++ )
		{
			let en = str_array[ i ];
			
			let row = table[ en ];
			
			if ( row )
			{
				if ( row.approved )
				{
					let translated = row[ lang ];
					if ( translated !== undefined )
					if ( translated !== 'SPECIFY' )
					responses.push( [ en, translated ] );
				}
			
				row.last_use = Date.now();
				row.use_count++;
			}
			else
			{
				let unapproved_uids = sdDatabase.data.translations.unapproved_uids || [];
				
				if ( unapproved_uids.length < 1000 )
				{
					row = Object.assign( {}, sdDatabase.data.translations.sample_row );
					row.first_use = Date.now();
					row.last_use = Date.now();
					row.use_count = 1;

					for ( let i2 = 0; i2 < sdWorld.server_config.supported_languages.length; i2++ )
					row[ sdWorld.server_config.supported_languages[ i2 ] ] = 'SPECIFY';

					row.en = en;

					table[ en ] = row;
					
					if ( sdDatabase.data.translations.unapproved_uids === null )
					sdDatabase.data.translations.unapproved_uids = [ en ];
					else
					sdDatabase.data.translations.unapproved_uids.push( en );
				}
			}
		}
		
		if ( responses.length > 0 )
		responses.unshift( lang );

		return responses;
	}
	static DBBanUnbanByHash( responses=[], initiator_server, initiator_hash_or_user_uid, operation, target_hash_or_ban_uid, reason_public, reason_private, duration )
	{
		// S2S protocol already prevents unauthorized server - perhaps as long as all servers have legitimate admins it will work just fine
		/*let permissions = sdDatabase.GetDatabasePermissionsFor( initiator_hash_or_user_uid );
		if ( !permissions )
		{
			responses.push([ 'SERVICE_MESSAGE', 'Access Error: No permissions according to sdDatabase.GetDatabasePermissionsFor' ]);
			return responses;
		}
		
		if ( permissions.execute === '*' || permissions.execute.indexOf( 'moderation' ) !== -1 || permissions.execute.indexOf( 'moderation.bans' ) !== -1 )
		{
		}
		else
		{
			responses.push([ 'SERVICE_MESSAGE', 'Access Error: Not enough permissions according to sdDatabase.GetDatabasePermissionsFor result' ]);
			return responses;
		}*/
		
		if ( operation === 'list_bans' )
		{
			for ( let hash in sdDatabase.data.moderation.bans.table_by_user_uid )
			{
				let ban_object = sdDatabase.data.moderation.bans.table_by_user_uid[ hash ];
				
				//responses.push( ban_object );
				responses.push({
					uid: ban_object.uid,
					reason_private: ban_object.reason_private,
					until: ban_object.until,
					expired: ( Date.now() > ban_object.until ) ? 1 : 0
				});
			}
		}
		else
		{
			let anything_done = false;

			if ( operation === 'ban' )
			{
				let target_hash = target_hash_or_ban_uid;

				if ( sdDatabase.data.moderation.bans.table_by_user_uid[ target_hash ] )
				{
					responses.push([ 'SERVICE_MESSAGE', 'Error: Target player has active ban. Try cancelling previous one first?' ]);
					return responses;
				}


				let player_row = sdDatabase.data.players.table[ target_hash ];

				let ips = [];
				let browser_fingerprints = [];

				if ( player_row )
				{
					let known_ips = player_row.known_ips;

					for ( let ip in known_ips )
					ips.push( ip );
				
					for ( let browser_fingerprint in player_row.browser_fingerprints )
					browser_fingerprints.push( browser_fingerprint );
				}
				else
				{
					responses.push([ 'SERVICE_MESSAGE', 'Error: Target player row was not found' ]);
					return responses;
				}

				let ban_object = JSON.parse( JSON.stringify( sdDatabase.data.moderation.bans.sample_row ) );
				ban_object.uid = sdDatabase.data.moderation.bans.next_uid++;
				ban_object.reason_public = reason_public;
				ban_object.reason_private = reason_private;
				ban_object.until = Date.now() + duration;

				for ( let i = 0; i < ips.length; i++ )
				sdDatabase.data.moderation.bans.table_by_ip[ ips[ i ] ] = ban_object;

				sdDatabase.data.moderation.bans.table_by_user_uid[ target_hash ] = ban_object;
				
				for ( let i = 0; i < browser_fingerprints.length; i++ )
				sdDatabase.data.moderation.bans.table_by_challenge[ browser_fingerprints[ i ] ] = ban_object;
			
				anything_done = true;
			}
			else
			if ( operation === 'unban' )
			{
				let ban_uid = target_hash_or_ban_uid;

				for ( let ip in sdDatabase.data.moderation.bans.table_by_ip )
				{
					let ban_object = sdDatabase.data.moderation.bans.table_by_ip[ ip ];
					if ( ban_object.uid === ban_uid )
					{
						delete sdDatabase.data.moderation.bans.table_by_ip[ ip ];
						anything_done = true;
					}
				}

				for ( let hash in sdDatabase.data.moderation.bans.table_by_user_uid )
				{
					let ban_object = sdDatabase.data.moderation.bans.table_by_user_uid[ hash ];
					if ( ban_object.uid === ban_uid )
					{
						delete sdDatabase.data.moderation.bans.table_by_user_uid[ hash ];
						anything_done = true;
					}
				}

				for ( let hash in sdDatabase.data.moderation.bans.table_by_challenge )
				{
					let ban_object = sdDatabase.data.moderation.bans.table_by_challenge[ hash ];
					if ( ban_object.uid === ban_uid )
					{
						delete sdDatabase.data.moderation.bans.table_by_challenge[ hash ];
						anything_done = true;
					}
				}
			}

			if ( anything_done )
			sdDatabase.LogActivity( initiator_hash_or_user_uid, initiator_server, ( operation === 'ban' ) ? 'Ban (' + duration + ')' : 'Unban' + ' operation issued: ' + reason_private, 'Bans' );
			else
			{
				responses.push([ 'SERVICE_MESSAGE', 'Warning: Nothing was done - likely ban does not exist' ]);
			}
		}
		
		return responses;
	}
	static DBEditorCommand( responses=[], initiator_server, initiator_hash_or_user_uid, type, path_parts, new_value=null ) // All command handler's arguments should start with "responses" array they will return, then "initiator_server", then "initiator_hash_or_user_uid", everything else is optional and specific to case
	{
		let previous_ptr = null;
		let ptr = sdDatabase;
		
		//path_parts = sdDatabase.DesanitizeUnderscores( path_parts );
		//new_value = sdDatabase.DesanitizeUnderscores( new_value );
		
		if ( path_parts instanceof Array )
		{
		}
		else
		{
			debugger;
			return responses;
		}
		
		let permissions = sdDatabase.GetDatabasePermissionsFor( initiator_hash_or_user_uid );
		if ( !permissions )
		{
			responses.push([ 'SERVICE_MESSAGE', 'Access Error: No permissions according to sdDatabase.GetDatabasePermissionsFor' ]);
			return responses;
		}
		
		let path_str = path_parts.join( '.' );
		
		if ( type === 'DB_SCAN' || type === 'DB_SEARCH' )
		{
			// Read
			if ( permissions.read === '*' )
			{
			}
			else
			{
				let denied = true;
				
				if ( path_str === 'sdDatabase.data' )
				{
					denied = false;
				}
				else
				for ( let i = 0; i < permissions.read.length; i++ )
				{
					let allowed = 'sdDatabase.data.' + permissions.read[ i ];
					
					if ( path_str.indexOf( allowed ) === 0 )
					{
						denied = false;
						break;
					}
				}
				
				if ( denied )
				{
					responses.push([ 'SERVICE_MESSAGE', 'Access Error: You have no read permissions at this location' ]);
					responses.push([ 'DB_SCAN_RESULT', [ path_parts, { _access_denied: 1 } ] ]);
					return responses;
				}
			}
		}
		else
		if ( type === 'DB_RENAME_PROP' || type === 'DB_SET_VALUE' )
		{
			// Write
			if ( permissions.write === '*' )
			{
			}
			else
			{
				let denied = true;
				
				for ( let i = 0; i < permissions.write.length; i++ )
				{
					let allowed = 'sdDatabase.data.' + permissions.write[ i ];
					
					if ( path_str.indexOf( allowed ) === 0 )
					{
						denied = false;
						break;
					}
				}
				
				if ( denied )
				{
					responses.push([ 'SERVICE_MESSAGE', 'Access Error: You have no write permissions at this location' ]);
					return responses;
				}
			}
			
			/*let activity_logs = sdDatabase.data.moderation.activity_logs;
			
			let row = Object.assign( {}, activity_logs.sample_row );
			
			row.initiator = initiator_hash_or_user_uid;
			row.initiator_server = initiator_server;
			row.action = 'Write operation ' + type + ' at ' + path_parts.join('.') + ' with value ' + JSON.stringify( new_value );
			
			activity_logs.table[ activity_logs.next_uid++ ] = row;*/
			sdDatabase.LogActivity( initiator_hash_or_user_uid, initiator_server, 'Write operation ' + type + ' at ' + path_parts.join('.') + ' with value ' + JSON.stringify( new_value ), 'Data base editing' );
		}
		else
		{
			responses.push([ 'SERVICE_MESSAGE', 'Server Error: Unable to understand whether operation "'+type+'" is read-related or write-related' ]);
			return responses;
		}
		

		for ( let i = 1; i < path_parts.length; i++ )
		{
			let prop = path_parts[ i ];

			if ( ptr.hasOwnProperty( prop ) || prop === '' )
			{
				previous_ptr = ptr;
				
				ptr = ptr[ prop ];
			}
			else
			{
				//debugger;
				
				// Tell about non existent property?
				//socket.emit( 'DB_SCAN_RESULT', [ path_parts, '#PROP_DELETED' ] );
				responses.push([ 'DB_SCAN_RESULT', [ path_parts, '#PROP_DELETED' ] ]);
				return responses;
			}
		}
		
		if ( type === 'DB_SCAN' || type === 'DB_SEARCH' )
		{
			if ( ptr === null || typeof ptr === 'number' || typeof ptr === 'string' || typeof ptr === 'boolean' )
			{
				//socket.emit( 'DB_SCAN_RESULT', [ path_parts, ptr ] );
				responses.push([ 'DB_SCAN_RESULT', [ path_parts, ptr ] ]);
				//debugger; // Never happens
			}
			else
			{
				let keys = Object.keys( ptr );
				let obj = {};
				let results = 0;
				
				let is_searching = ( type === 'DB_SEARCH' );
				
				let search_key;
				let search_key_regexp = null;
				let search_json_substring;
				let max_results;
				
				if ( is_searching )
				{
					search_key = new_value[ 0 ];
					search_json_substring = new_value[ 1 ];
					max_results = new_value[ 2 ];
					
					if ( search_key.indexOf( '*' ) !== -1 )
					search_key_regexp = (new RegExp('^' + search_key.replace(/([.+?^=!:${}()|\[\]\/\\])/g, "\\$1").split('*').join('(.*)') + '$'));
				}

				for ( let i = 0; i < keys.length; i++ )
				{
					let key_of_cur = keys[ i ];
					let value = ptr[ key_of_cur ];

					if ( 
							(
								is_searching 
								&&
								(
									search_key === '' 
									|| 
									( 
										key_of_cur === search_key ||
										( search_key_regexp && search_key_regexp.test( key_of_cur ) )
									) 
								)
								&&
								(
									search_json_substring === ''
									||
									(
										JSON.stringify( value ).indexOf( search_json_substring ) !== -1
									)
								)
								&&
								results < max_results
							)
							||
							(
								!is_searching 
								&&
								( i < 4 || i >= keys.length - 4 || keys.length < 64 )
							)
						)
					{
						if ( value === null || typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' )
						obj[ key_of_cur ] = value;
						else
						{
							if ( key_of_cur.charAt( 0 ) === '_' )
							throw new Error();

							obj[ key_of_cur ] = 
							{
								_is_array: ( value instanceof Array ), // JSON arrays won't store extra keys
								_path: path_parts.concat( key_of_cur ),
								//_synced: false,
								_pending: false,
								//_expanded: false,
								//_properties_change_pending: {}
							};
						}
						
						results++;
					}
					else
					if ( !is_searching )
					{
						if ( i < keys.length - 4 - 1 )
						i = keys.length - 4 - 1;
					}
				}

				if ( results < keys.length )
				{
					obj._partial = 1;
				}
				
				obj._rows_count = keys.length;
				obj._results_count = results;
				
				if ( is_searching )
				obj._clear_old_properties = 1;

				obj._synced = true;

				//socket.emit( 'DB_SCAN_RESULT', [ path_parts, obj ] );
				responses.push([ 'DB_SCAN_RESULT', [ path_parts, obj ] ]);
			}
		}
		else
		if ( type === 'DB_RENAME_PROP' )
		{
			let prop = path_parts[ path_parts.length - 1 ];
			let value = ( prop === '' ) ? null : previous_ptr[ prop ];
			
			if ( prop !== '' )
			delete previous_ptr[ prop ];
			
			if ( new_value !== '' )
			previous_ptr[ new_value ] = value;
			
			if ( prop !== '' )
			sdDatabase.DBEditorCommand( responses, initiator_server, initiator_hash_or_user_uid, 'DB_SCAN', path_parts.slice( 0, -1 ).concat( prop ) );
			
			if ( new_value !== '' )
			sdDatabase.DBEditorCommand( responses, initiator_server, initiator_hash_or_user_uid, 'DB_SCAN', path_parts.slice( 0, -1 ).concat( new_value ) );
		}
		else
		if ( type === 'DB_SET_VALUE' )
		{
			let prop = path_parts[ path_parts.length - 1 ];
			
			function ReconvertSomeObjectsToArrays( new_value )
			{
				for ( let p in new_value )
				if ( p.charAt( 0 ) !== '_' )
				{
					if ( new_value[ p ] instanceof Object )
					new_value[ p ] = ReconvertSomeObjectsToArrays( new_value[ p ] );
				}
				
				if ( new_value instanceof Object )
				{
					if ( new_value._is_array )
					{
						let new_array = [];
						
						for ( let p in new_value )
						if ( p.charAt( 0 ) !== '_' )
						new_array[ parseInt( p ) ] = new_value[ p ];
						
						new_value = new_array;
					}
				}
				
				return new_value;
			}
			
			new_value = ReconvertSomeObjectsToArrays( new_value );
			
			for ( let p in new_value )
			if ( p.charAt( 0 ) === '_' )
			delete new_value[ p ];
			
			previous_ptr[ prop ] = new_value;
			
			sdDatabase.DBEditorCommand( responses, initiator_server, initiator_hash_or_user_uid, 'DB_SCAN', path_parts );
		}
		
		return responses;
	}
}

export default sdDatabase;