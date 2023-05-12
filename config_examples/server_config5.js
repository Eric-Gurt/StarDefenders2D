(()=> // This wrapping is needed to allow let variables
{
	let penalty_per_kill = 1000 * 60 * 20; // 20 minutes

	let respawn_blocks = []; // { ips:[], my_hashes:[], fingerprints:[], until:sdWorld.time + 1000 * 60 * 30 };
	let last_block_until = 0;

	let known_characters = [];
	let unique_players_online = 0;
	
	let debug_mode = globalThis.isWin;

	function BlockRespawn( ips, my_hashes, fingerprints, duration=penalty_per_kill )
	{
		respawn_blocks.push({ ips:ips, my_hashes:my_hashes, fingerprints:fingerprints, until:sdWorld.time + duration });
	}

	function AppendBlockInfo( block, ip, my_hash, fingerprint )
	{
		if ( block.ips.indexOf( ip ) === -1 )
		block.ips.push( ip );

		if ( block.my_hashes.indexOf( my_hash ) === -1 )
		block.my_hashes.push( my_hash );

		if ( block.fingerprints.indexOf( fingerprint ) === -1 )
		block.fingerprints.push( fingerprint );

		last_block_until = block.until;
	}

	function CanRespawn( ip, my_hash, fingerprint )
	{
		for ( let i = 0; i < respawn_blocks.length; i++ )
		{
			let block = respawn_blocks[ i ];

			if ( sdWorld.time > block.until )
			{
				respawn_blocks.splice( i, 1 );
				i--;
				continue;
			}

			if ( block.ips.indexOf( ip ) !== -1 )
			{
				AppendBlockInfo( block, ip, my_hash, fingerprint );
				return false;
			}

			if ( block.my_hashes.indexOf( my_hash ) !== -1 )
			{
				AppendBlockInfo( block, ip, my_hash, fingerprint );
				return false;
			}

			if ( block.fingerprints.indexOf( fingerprint ) !== -1 )
			{
				AppendBlockInfo( block, ip, my_hash, fingerprint );
				return false;
			}
		}
		return true;
	}

	class sdServerConfigShort
	{
		// This file should contain one object (for example class like this one), it will be interpreted using basic eval method and automatically assigned to global variable sdWorld.server_config

		// If this all looks scary and you are using NetBeans - use "Ctrl + -" and "Ctrl + *" to hide big methods.

		static port = 2053;

		static password = ''; // Restrict connection access by asking players for password?
		static only_admins_can_spectate = true;

		static make_server_public = ( this.password === '' ); // By default it is public if password was not set. Public means server will send its' URL to www.gevanni.com to be potentially listed in servers list in future. Sent URL is told by first browser that has successfully connected to this server.

		static game_title = 'Star Defenders: Fragile bases';

		static allowed_s2s_protocol_ips = [
			'127.0.0.1',
			'::1',
			'::ffff:127.0.0.1'
		];

		static database_server = null; // Example: 'https://www.gevanni.com:3000'; // Remote database_server must allow current server's IP in list above. Set as null if this server should have its' own database

		static notify_about_failed_s2s_attempts = false; // Trying to figure out why messages aren't sent from server to server? Set it to true
		static log_s2s_messages = false; // Trying to figure out why messages aren't sent from server to server? Set it to true

		static skip_arrival_sequence = false; // Skipping it will prevent players from spawning together pretty much. It is useful during tests though.

		// Setting both 'enable_bounds_move' and 'aggressive_hibernation' will enable open world support
		static enable_bounds_move = true;
		static aggressive_hibernation = true; // Offscreen groups of entities (sometimes whole bases) will be put to sleep until something tries to access these areas

		static apply_censorship = true; // Censorship file is not included

		static supported_languages = [ 'en', 'ua', 'hr' ];

		// Check file sdServerConfig.js for more stuff to alter in server logic

		static open_world_max_distance_from_zero_coordinates_x = 10000; // Greater values work just fine, but do you really want this on your server? It can only cause lags.
		static open_world_max_distance_from_zero_coordinates_y_min_soft = -1000; // Greater values work just fine, but do you really want this on your server? It can only cause lags.
		static open_world_max_distance_from_zero_coordinates_y_min = -1000; // Greater values work just fine, but do you really want this on your server? It can only cause lags.
		static open_world_max_distance_from_zero_coordinates_y_max = 40000; // Greater values work just fine, but do you really want this on your server? It can only cause lags.

		static allowed_base_shielding_unit_types = [ sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE ];
		static allow_private_storage = false;
		static allow_rescue_teleports = false;
		static allow_private_storage_access = false;
		static com_node_hack_success_rate = 0; // 0.05; // 0 - never works, 1 - works always // Overriden later
		static allowed_player_spawn_classes = [ 'sdCharacter' ];
		

		/*static ModifyTerrainEntity( ent ) // ent can be sdBlock or sdBG
		{
			if ( ent.is( sdBlock ) || ent.is( sdBG ) )
			{
				ent.br *= 4;
				ent.filter = 'saturate(0.3)';
				ent.hue = 180;
				
				if ( ent._plants )
				for ( let i = 0; i < ent._plants.length; i++ )
				{
					let e = sdEntity.entities_by_net_id_cache_map.get( ent._plants[ i ] );
					if ( e )
					{
						e.br *= 4;
						e.filter = 'saturate(0.3)';
						e.hue = 180;
					}
				}
			}
		}*/

		static GetHitAllowed( bullet_or_sword, target )
		{
			if ( bullet_or_sword._admin_picker )
			return true;
		
			if ( debug_mode )
			return true;
			
			// Cancel damage from bullet_or_sword towards target. ( bullet_or_sword._owner || bullet_or_sword._dangerous_from ) is a possible owner (can be null)

			let shield = ( target._shielded && !target._shielded._is_being_removed && target._shielded.enabled );

			let owner = ( bullet_or_sword._owner || bullet_or_sword._dangerous_from );
				
			if ( shield || ( target.IsPlayerClass() && owner && owner.IsPlayerClass() && owner !== target && target._my_hash !== undefined && owner._my_hash !== undefined ) )
			if ( !( target.IsPlayerClass() && target._user_data.hittable ) )
			if ( unique_players_online < 4 || ( target.IsPlayerClass() && target._key_states.GetKey( 'Mouse1' ) ) ) // Allow attacking ones who can attack, or if at least 4 players play
			{
				if ( owner )
				{
					let v = {
						x: -bullet_or_sword.sx * 0.02,
						y: -bullet_or_sword.sy * 0.02
					};
					
					v.x += Math.random() - 0.5;
					v.y += Math.random() - 0.5;
					
					sdWorld.SendEffect({ x:bullet_or_sword.x, y:bullet_or_sword.y, type:sdEffect.TYPE_HEARTS, sx:v.x, sy:v.y });
					
					if ( owner._socket )
					owner._socket.SDServiceMessage( 'Overnight raiding is boring and lame. Try doing this when at least 4 real people are online (only {1} detected)', [ unique_players_online ] );
				}
				
				return false;
			}

			return true;
		}

		static onKill( target, initiator=null )
		{
			if ( target )
			if ( target.IsPlayerClass() )
			if ( target._my_hash !== undefined )
			{
				if ( target._user_data.crime_counter > 0 )
				{
					if ( initiator )
					if ( initiator.IsPlayerClass() )
					if ( initiator._socket )
					{
						let sockets = target._socket ? [ target._socket ] : [];
						
						for ( let i = 0; i < known_characters.length; i++ )
						{
							if ( known_characters[ i ].character === target )
							if ( sockets.indexOf( known_characters[ i ].socket ) === -1 )
							sockets.push( known_characters[ i ].socket );
						}
						
						let blocks = [];
						
						for ( let i = 0; i < sockets.length; i++ )
						{
							let ip = sockets[ i ].ip_accurate;
							let my_hash = sockets[ i ].my_hash;
							let fingerprint = sockets[ i ].challenge_result;
							for ( let i2 = 0; i2 < respawn_blocks.length; i2++ )
							{
								let block = respawn_blocks[ i2 ];

								if ( block.ips.indexOf( ip ) !== -1 )
								blocks.push( block );
								else
								if ( block.my_hashes.indexOf( my_hash ) !== -1 )
								blocks.push( block );
								else
								if ( block.fingerprints.indexOf( fingerprint ) !== -1 )
								blocks.push( block );
							}
						}
						
						for ( let i = 0; i < sdWorld.sockets.length; i++ )
						{
							let kick = false;
							
							for ( let i2 = 0; i2 < blocks.length; i2++ )
							{
								let block = blocks[ i2 ];
								
								if ( block.ips.indexOf( sdWorld.sockets[ i ].ip_accurate ) !== -1 ||
									 block.my_hashes.indexOf( sdWorld.sockets[ i ].my_hash ) !== -1 ||
									 block.fingerprints.indexOf( sdWorld.sockets[ i ].challenge_result ) !== -1 )
								kick = true;
							}
							
							let admin_row = sdModeration.GetAdminRow( sdWorld.sockets[ i ] );
							
							//admin_row = null; // Hack
							
							if ( kick )
							{
								if ( !admin_row )
								{
									let socket = sdWorld.sockets[ i ];
									let character = socket.character;
									
									setTimeout( ()=>
									{
										if ( character && !character._is_being_removed )
										character._my_hash = undefined; // Remove possibility for same socket to reconnect into his other tabs
									
										socket.disconnect();
									}, 3000 );
								}
								else
								{
									sdWorld.sockets[ i ].SDServiceMessage( 'Disconnection cancelled due to admin rights' );
								}
							}
						}
						
						initiator._socket.SDServiceMessage( 'Nice! You\'ve killed a criminal star defender! You are not getting any penalties for that. Criminal gets {1} seconds timeout', [ target._user_data.crime_counter * penalty_per_kill ] );
					}
				}
				else
				{
					if ( initiator )
					if ( initiator.IsPlayerClass() )
					if ( initiator._my_hash !== undefined )
					{
						initiator._user_data.crime_counter++;

						let duration = initiator._user_data.crime_counter * penalty_per_kill;

						let sockets = initiator._socket ? [ initiator._socket ] : [];

						{
							for ( let i = 0; i < known_characters.length; i++ )
							if ( known_characters[ i ].character === initiator )
							if ( sockets.indexOf( known_characters[ i ].socket ) === -1 )
							sockets.push( known_characters[ i ].socket );
						}

						for ( let i = 0; i < sockets.length; i++ )
						if ( sockets[ i ] )
						BlockRespawn( [ sockets[ i ].ip_accurate ], [ sockets[ i ].my_hash ], [ sockets[ i ].challenge_result ], duration );

						if ( initiator._socket )
						{
							if ( initiator._user_data.crime_counter <= 1 )
							initiator._socket.SDServiceMessage( 'Uh-oh, you are now a real criminal star defender. You\'ll be forgiven in {1} seconds', [ Math.ceil( duration / 1000 ) ] );
							else
							initiator._socket.SDServiceMessage( 'Going all in I see! :D You\'ll be forgiven in {1} seconds', [ Math.ceil( duration / 1000 ) ] );
						}
					}
				}
			}
		}

		static onRespawn( character_entity, player_settings, give_items=true )
		{
			if ( !character_entity.is( sdPlayerSpectator ) )
			{
				known_characters.push({ character: character_entity, socket:character_entity._socket, name:character_entity.title, name_censored:character_entity.title_censored, score:character_entity._score, last_active:sdWorld.time });

				character_entity._user_data.crime_counter = 0; // Added with each crime, reset if no respawn_blocks are found
				
				character_entity._user_data.hittable = true;
				
				if ( give_items )
				sdWorld.server_config.GiveStarterRespawnItems( character_entity, player_settings );
			}
		}

		static onExtraWorldLogic( GSPEED )
		{
			for ( let i = 0; i < known_characters.length; i++ )
			{
				let character = known_characters[ i ].character;

				if ( !character._is_being_removed )
				if ( character._user_data.crime_counter > 0 )
				{
					if ( character._socket )
					{
						let socket = character._socket;
						if ( CanRespawn( socket.ip_accurate, socket.my_hash, socket.challenge_result ) )
						{
							character._user_data.crime_counter = 0;
							character._socket.SDServiceMessage( 'Good news, you\'ve been lucky to be forgiven for your star defender crimes :D' );
						}
					}
					/*character._user_data.crime_counter = Math.max( 0, character._user_data.crime_counter - GSPEED );

					if ( character._user_data.crime_counter <= 0 )
					{
						if ( character._socket )
						character._socket.SDServiceMessage( 'Good news, you\'ve been lucky to be forgiven for your star defender crimes :D' );
					}*/
				}
			}
		}

		static onReconnect( character_entity, player_settings )
		{
			let found = false;
			
			for ( let i = 0; i < known_characters.length; i++ )
			{
				if ( known_characters[ i ].character === character_entity )
				{
					found = true;
					
					//known_characters[ i ].name = character_entity.title;
					//known_characters[ i ].name_censored = character_entity.title_censored;
					//known_characters[ i ].score = character_entity._score;
					break;
				}
			}
			if ( !found )
			{
				sdWorld.server_config.onRespawn( character_entity, player_settings, false );
			}
		}
		static ModifyReconnectRestartAttempt( player_settings, socket ) // This happens after password/ban/JS challenge checks, though occasionally banned players will be able to join for a short period of time (especially if database is on a network resource or database server is not responding)
		{
			// socket.forced_entity = 'sdPlayerSpectator'; // Forcing player to play as specific class of entity
			// socket.forced_entity_params // Entity spawn params, x and y are added to these

			// player_settings.hero_name // Name of a newly connected character. Can be altered too

			// player_settings.full_reset = true; // Whether player wants to connect to existing character with a same hash or a new one. You can alter this value if you want to force player spectating after he died, for example

			// socket.my_hash // Player's hash, one he will try to be assigned to. Private string used for both player UID and password

			// socket.ip_accurate // Current IP address of a connection. Can be both IPv4 and IPv6

			// socket.challenge_result // Browser fingerprint string, looks something like this: '11218x0qwjw90,en-us,uk,jp,cn'

			// socket.SDServiceMessage( 'Server will be reset very soon and private storage will be disabled - make sure to migrate all of your items to other servers' ); // Startup notification demo

			// By editing player_settings you can alter character looks completely

			if ( player_settings.hero_name === 'Star Defender' )
			{
				let w = sdDictionaryWords.GetRandomWord();
				
				if ( w.indexOf( 'er' ) === w.length - 2 )
				player_settings.hero_name = 'Star ' + w.substring( 0, 1 ).toUpperCase() + w.substring( 1 );
				else
				player_settings.hero_name = w.substring( 0, 1 ).toUpperCase() + w.substring( 1 ) + ' Defender';
			}
			else
			for ( let i = 0; i < known_characters.length; i++ )
			{
				if ( known_characters[ i ]._socket || known_characters[ i ].build_tool_level < 10 )
				if ( known_characters[ i ].name.trim() === player_settings.hero_name.trim() )
				{
					socket.SDServiceMessage( 'Your name is not unique, unfortunately. Respawn was rejected' );
					socket.emit( 'BACK_TO_MENU', 3500 );
					return false;
				}
			}

			if ( player_settings.full_reset )
			{
				player_settings.full_reset = false;
			}

			socket.SDServiceMessage( 'Raiding is allowed on this server, though at the cost of automatic bans if you\'ll die' );

			return true; // true to allow connection. false to reject. Make sure to fire some socket.SDServiceMessage call prior to returning false which will be telling player why join attempt was rejected
		}

		static IsEntitySpawnAllowed( player_settings, socket ) // You can disallow entity spawning with this one. It will still let players connect to their existing characters as long as they are alive
		{
			if ( CanRespawn( socket.ip_accurate, socket.my_hash, socket.challenge_result ) )
			{
				socket.forced_entity = null;
			}
			else
			{
				socket.forced_entity = 'sdPlayerSpectator';
				socket.SDServiceMessage( 'No more fun allowed :P You\'d have to wait {1} seconds', [ Math.ceil( ( last_block_until - sdWorld.time ) / 1000 ) ] );
			}

			return true;
		}


		static UpdateLeaderBoard()
		{
			//let sockets = sdWorld.sockets;
			sdWorld.leaders.length = 0;
			
			let unique_players_online_set1 = new Set();
			let unique_players_online_set2 = new Set();
			let unique_players_online_set3 = new Set();

			for ( let i = 0; i < known_characters.length; i++ )
			{
				// Hide disconnected players
				if ( known_characters[ i ].character && known_characters[ i ].character._socket && !known_characters[ i ].character._is_being_removed )
				{
					known_characters[ i ].last_active = sdWorld.time;
				}
				else
				{
					if ( sdWorld.time > known_characters[ i ].last_active + 1000 * 60 * 30 )
					{
						known_characters[ i ].character._user_data.hittable = false;
						
						known_characters.splice( i, 1 );
						i--;
						continue;
					}
				}
				
				if ( known_characters[ i ].character && !known_characters[ i ].character._is_being_removed )
				{
					// Disallow name changes
					known_characters[ i ].character.title = known_characters[ i ].name;
					known_characters[ i ].character.title_censored = known_characters[ i ].name_censored;
					
					known_characters[ i ].score = known_characters[ i ].character._score;
				}
				
				unique_players_online_set1.add( known_characters[ i ].socket.ip_accurate );
				unique_players_online_set2.add( known_characters[ i ].socket.my_hash );
				unique_players_online_set3.add( known_characters[ i ].socket.challenge_result );

				if ( known_characters[ i ].character.build_tool_level > 5 ) // Hide low level players
				sdWorld.leaders.push({ name:known_characters[ i ].name, name_censored:known_characters[ i ].name_censored, score:known_characters[ i ].score, here:1 });
			}
			
			unique_players_online = Math.min( unique_players_online_set1.size, unique_players_online_set2.size, unique_players_online_set3.size );


			sdWorld.server_config.com_node_hack_success_rate = ( unique_players_online < 4 ) ? 0 : 0.1;

			/*for ( let i2 = 0; i2 < sockets.length; i2++ )
			if ( 
					sockets[ i2 ].character && 
					( !sdWorld.server_config.only_admins_can_spectate || !sockets[ i2 ].character.is( sdPlayerSpectator ) ) && 
					!sockets[ i2 ].character._is_being_removed 
			)
			sdWorld.leaders.push({ name:sockets[ i2 ].character.title, name_censored:sockets[ i2 ].character.title_censored, score:sockets[ i2 ].GetScore(), here:1 });*/
		}
	}
	
	return sdServerConfigShort;

})();