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
					
					known_ips: {}, // Maybe will be used for banning
					
					credits: 0,
					
					kills: 0,
					deaths: 0,
					
					missions_complete: 0,
					missions_failed: 0,
					
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
				
				unapproved_uids: [], // Limit count of suggestions
		
				sample_row_1:
				{
					first_use: Date.now(), // When translation was added
					last_use: Date.now(), // When translation was used last time
					use_count: 0, // How many times translation was used
					approved: false, // Approved translations are permanent. Unapproved translations expire. Game does not really know which lines are to be translated so all translations are approved manually
					
					// Same languages as in sdWorld.server_config.supported_languages
					en: 'Welcome to Star Defenders!',
					ua: 'Ласкаво прошу до Зоряних Захисників!'
				},
				sample_row_2: // String contains HTML tags, in this case it is not just strings but arrays of strings (HTML elements are inserted in between)
				{
					first_use: Date.now(), // When translation was added
					last_use: Date.now(), // When translation was used last time
					use_count: 0, // How many times translation was used
					approved: false, // Approved translations are permanent. Unapproved translations expire. Game does not really know which lines are to be translated so all translations are approved manually
					
					// Same languages as in sdWorld.server_config.supported_languages
					en: 
					[
						"",
						"Open update &amp; patch log on github",
						"",
						"",
						"21 January 2021: First public release!"
					],
					ua: 
					[
						"",
						"Історія оновлень на github",
						"",
						"",
						"21 Січня 2021: Перший публічний реліз!"
					]
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
			
					sample_row: 
					{
						initiator: 'user#123',
						action: 'user#123 modifies sdDatabase.data.translations.Welcome to star defenders!.ua = "Ласкаво прошу до Зоряних Захисників!"'
					},
		
					table:
					{
					}
				},
				
				database_permissions: // Only non-superuser
				{
					sample_row: // Or maybe hash? Or maybe 'user#123' which will auto-evalute into nickname? Probably user pointer is much better approach.
					{
						read: [ 'players', 'translations', 'moderation.activity_logs' ],
						write: [ 'translations.table' ],
						execute: [ 'players', 'translations' ] // We might build-in command eval macros at some point? For example to let admins ban certain players, remove some kind of spam
					},
					
					table:
					{
					}
				},
				
				failed_logins: // If login attempt fails and IP of user does not match as well - that is getting logged there
				{
					sample_row:
					{
						tries: 1, // Tries should only count unique password attempts
						tried_passwords: {}, // If there is too many different passwords - it is a sign of bruteforcing
						expite_on: Date.now() + 1000 * 60 * 60 * 12 * 2, // 2 days
						attempts_from_ips: {} // Used in table2 only - if there is too many failed attempts from unknown IPs we just ban all of them
					},
			
					table:
					{
						// Key is IP
					},
			
					table2:
					{
						// Key is player UID - can be useful to detect distributed bruteforce attacks
					}
				}
			}
		};
		
		sdDatabase.is_local = ( !sdWorld.server_config.database_server );
		
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
						sdDatabase.data[ key ] = Object.assign( sdDatabase.data[ key ], potential );
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
		}
		else
		{
			sdDatabase.data = null;
		}
	}
	static Save( key='*' )
	{
		if ( key === '*' )
		{
			let keys = Object.keys( sdDatabase.data );
			
			for ( let i = 0; i < keys.length; i++ )
			{
				let key = keys[ i ];
				
				sdDatabase.Save( key );
			}
			
			return;
		}
		
		if ( sdDatabase.data[ key ] === undefined )
		throw new Error( 'sdDatabase.data.' + key + ' does not exist - unable to perform saving (it won\'t be loaded anyway unless this property exists on example structure at sdDatabase.js file)');
	
		if ( sdDatabase.is_local )
		{
			let sub_database_file_path = sdWorld.database_data_path_const.split( '<KEY>' ).join( key );
				
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
				});

			});
			
		}
	}
	static Exec( array_of_request_objects, callback=null ) // In order to stack requests it receives arrays of objects instead of just object for array_of_request_objects
	{
		if ( sdDatabase.is_local )
		{
			const allowed_methods = new Set();
			allowed_methods.add( 'DBEditorCommand' );
			
			for ( let i = 0; i < array_of_request_objects.length; i++ )
			{
				let request_object = array_of_request_objects[ i ];
				
				let method_arguments = request_object;
				let method = method_arguments.shift(); // Gets first value
				
				if ( allowed_methods.has( method ) )
				{
					//trace( 'Executing database request: ', method_arguments );

					let responses = [];

					sdDatabase[ method ]( responses, ...method_arguments.slice( 1 ) );

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
					if ( callback )
					callback( response );
				}
			);
		}
	}
	
	
	static HandleCommandFromAdmin( socket, type, path_parts, new_value=null )
	{
		sdDatabase.Exec( 
			[ 
				[ 'DBEditorCommand', type, path_parts, new_value ] 
			], 
			( responses )=>
			{
				// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server
				
				for ( let i = 0; i < responses.length; i++ )
				{
					let response = responses[ i ];

					socket.emit( response[ 0 ], response[ 1 ] );
				}
			}
		);
	}

	static DBEditorCommand( responses=[], type, path_parts, new_value=null ) // All command handler's arguments should start with responses array they will return, everything else is optional and specific to case
	{
		let previous_ptr = null;
		let ptr = sdDatabase;
		
		if ( path_parts instanceof Array )
		{
		}
		else
		{
			debugger;
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
								_synced: false,
								_pending: false,
								_expanded: false,
								_properties_change_pending: {}
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
			sdDatabase.DBEditorCommand( responses, 'DB_SCAN', path_parts.slice( 0, -1 ).concat( prop ) );
			
			if ( new_value !== '' )
			sdDatabase.DBEditorCommand( responses, 'DB_SCAN', path_parts.slice( 0, -1 ).concat( new_value ) );
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
			
			sdDatabase.DBEditorCommand( responses, 'DB_SCAN', path_parts );
		}
		
		return responses;
	}
}

export default sdDatabase;