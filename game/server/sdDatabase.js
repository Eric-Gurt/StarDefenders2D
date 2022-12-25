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

*/

/* global sdServerToServerProtocol */

import fs from 'fs';

import sdWorld from '../sdWorld.js';
import sdWeather from '../entities/sdWeather.js';

class sdDatabase
{
	static GenerateHash( length )
	{
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
			players: 
			{
				next_uid: 0, // Auto-increment
		
				'PLAYER_SAMPLE': // UID
				{
					uid: 'PLAYER_SAMPLE',
					password: sdDatabase.GenerateHash( 64 ),
					
					entity_snapshot: {}, // Updated every time settings are changed. Not sure why it is for, perhaps to display user avatar. Would be good to have just color palette, helmet/body/legs model IDs and nickname
					settings_snapshot: {}, // Updated every time settings are changed
					
					last_active: Date.now(), // If user is offline for too long he would start losing credits. When out of credits - user is removed and items are given away.
					
					current_server: 'https://www.gevanni.com:3000', // Will assist with figuring out where player is. Needs to be updated whenever character dies or moves to another server
					
					mothership_storage: 
					[
						// List of entity snapshots basically or even groups of entities (in case of inter-planetary escape?). Can be sent/received to/from mothership in LRTP.
						// Most probably these entities could be given away to other players randomly if account gets abondoned
						{
							_class: 'sdCrystal',
							other_props: '...'
						}
					],
					credits: 0,
					
					kills: 0,
					deaths: 0,
					
					missions_complete: 0,
					missions_failed: 0,
					
					recent_mission_results: [ 0, 1, 0, 0, 0, 1, 1, 1 ], // Perhaps to measure skill?
					
					mob_kills: {
						sdOverlord: 1,
						sdVirus: 5
					},
					
					friends: [ 0, 1, 2 ], // UIDs
					
					owned_presets: [ 0, 1, 2 ] // Will be used to delete non-permanent presets (such as base presets for reference or construction drones)
				}
			},
			
			world:
			{
				next_uid: 0, // Auto-increment
				
				'WORLD_SAMPLE':
				{
					uid: 'WORLD_SAMPLE',
					name: 'Expedition on Mars', // It is possible to generate random planet names
					
					current_server: 'https://www.gevanni.com:3000', // Where this world is currently bound to? If it is unbound - current_server should be null
					
					last_active: Date.now(), // If inactive for too long - gets removed
					
					world_snapshot: {}, // Just so servers can go into hibernation mode whenever everyone disconnects. Perhaps this can be a zip string? Zip strings are ~1 mb in side
					
					
					
					seed_properties:
					{
						mobs_damage_scale: 1,
						mobs_count_factor: 1,
						crystals_count_factor: 1,
						crystals_value_factor: 1,
						allowed_events: [ sdWeather.EVENT_ERTHALS ]
					}
				}
			},
			
			servers:
			{
				'https://www.gevanni.com:3000': 
				{
					current_world: 'WORLD_SAMPLE',
					type: 'permanent',
					player_can_join: true
				},
		
				'https://www.gevanni.com:3001': 
				{
					current_world: 'WORLD_SAMPLE2',
					type: 'expedition_worker',
					player_can_join: false // It just means only database request can make them join
				},
		
				'https://www.gevanni.com:3002': 
				{
					current_world: 'WORLD_SAMPLE3',
					type: 'expedition_worker',
					player_can_join: false // It just means only database request can make them join
				},
		
				'https://www.gevanni.com:3003': 
				{
					current_world: 'WORLD_SAMPLE4',
					type: 'expedition_worker',
					player_can_join: false // It just means only database request can make them join
				}
			},

			// These can be used in singpleplayer as well as by construction drones in shape of blueprints
			presets:
			{
				next_uid: 0, // Auto-increment
				
				mothership:
				{
					origin_x: 0,
					origin_y: 0,
					entities: [],
					
					owned_by_uid: 'PLAYER_SAMPLE',
					
					is_permanent: true // Admins could edit these to build SD universe. is_permanent should be false in case of preset being related to player - in this case it would be removed together with player who made it
				}
			},
			
			translations:
			{
				unapproved_uids: [], // Limit count of suggestions
				
				'TRANSLATION_SAMPLE_1': // UID is either string hash or English line itself, whatever is shorter
				{
					first_use: 0, // When translation was added
					last_use: 0, // When translation was used last time
					use_count: 0, // How many times translation was used
					approved: 0, // Approved translations are permanent. Unapproved translations expire. Game does not really know which lines are to be translated so all translations are approved manually
					
					// Same languages as in sdWorld.server_config.supported_languages
					en: 'Welcome to Star Defenders!',
					ua: 'Ласкаво прошу до Зоряних Захисників!'
				},
				'TRANSLATION_SAMPLE_2': // String contains HTML tags, in this case it is not just strings but arrays of strings (HTML elements are inserted in between)
				{
					first_use: 0, // When translation was added
					last_use: 0, // When translation was used last time
					use_count: 0, // How many times translation was used
					approved: 0, // Approved translations are permanent. Unapproved translations expire. Game does not really know which lines are to be translated so all translations are approved manually
					
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
				}
			}
		};
		
		sdDatabase.is_local = ( sdWorld.server_config.database_server === null );
		
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

					sdDatabase.data[ key ] = Object.assign( sdDatabase.data[ key ], potential );
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
	static Exec( request_object, callback=null ) // Maybe in order to stack requests will be able to pass arrays of objects instead of just object for request_object
	{
		if ( sdDatabase.is_local )
		{
			let request_object_array;
			
			if ( request_object instanceof Array )
			request_object_array = request_object;
			else
			request_object_array = [ request_object ];
			
			for ( let i = 0; i < request_object_array.length; i++ )
			{
				trace( 'Fakely executing database request: ', request_object_array[ i ] );
				
				if ( callback )
				callback( 'Fake response' );
			}
		}
		else
		{
			sdServerToServerProtocol.SendData( 
				sdWorld.server_config.database_server, 
				{
					action: 'db',
					request: request_object
				}, 
				( response=null )=>
				{
					if ( callback )
					callback( response );
				}
			);
		}
	}
}

export default sdDatabase;