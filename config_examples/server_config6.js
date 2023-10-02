
(()=> // This wrapping is needed to allow let variables
{
	
	let GameState = {
		warmup: true,
		
		forced_start_timer_activated: false,
		forced_start_timer: 0,
		
		started: false,
		time_since_started: 0, // Used to remove walls inbetween bases
		
		is_in_final_sequence: false, // When one of bases was destroyed
		is_in_final_sequence_timer: 0
	};
	let GameState_initial = Object.assign( {}, GameState );
	
	let base_health = 2000;
	let respawn_cost = 20;
	let warmup_end_duration = 5; // Seconds
	
	let time_until_shields_are_disabled = 60 * 2.5; // 2.5 minutes
	let time_until_next_secret_storage = 0;
	
	
	let welcome_caption1 = null;
	let welcome_caption2 = null;
	let force_start_button = null;
	let preparation_shields = [];
	
	let wish_to_abort_game = 0;
	
	let bases = [ null, null ];
	let rtps = [ null, null ];
	let last_respawns = [ 0, 0 ];
	
	// Triple the score
	for ( let p in sdEntity )
	if ( p.indexOf( 'SCORE_REWARD_' ) === 0 )
	if ( p !== 'SCORE_REWARD_SCORE_SHARD' )
	sdEntity[ p ] *= 3;
	
	let UpdatePlayerCharacterProperties = ( socket )=>
	{
		//let socket = character._socket;
		let is_blue = ( socket.character.cc_id === 1 );
		let is_red = ( socket.character.cc_id === 2 );
		
		socket.cc_id = socket.character.cc_id;

		sdWorld.ApplyPlayerSettingsToPlayer( socket.character, socket.character._save_file, socket );
							
		socket.character.title = ( is_red ? '[RED] ' : is_blue ? '[BLUE] ' : '[SPEC] ' ) + socket.character.title.split('[RED] ').join('').split('[BLUE] ').join('');
	};
	
	let ConvertSpectatorIntoCharacterFor = ( socket )=>
	{
		if ( !GameState.warmup )
		if ( socket.cc_id === 1 || socket.cc_id === 2 )
		{
			let base = bases[ socket.cc_id - 1 ];
			
			if ( base.hea > respawn_cost )
			base.DamageWithEffect( respawn_cost );
			else
			return null;
		}
		
		
		let new_character = new sdCharacter({ x:0, y:0 });
		sdEntity.entities.push( new_character );

		let exectuter_character = socket.character;
		let executer_socket = socket;

		exectuter_character._socket = null;

		new_character._socket = executer_socket;
		executer_socket.character = new_character;

		new_character.title = exectuter_character.title;
		new_character.title_censored = exectuter_character.title_censored;

		new_character._save_file = exectuter_character._save_file;
		new_character._my_hash = exectuter_character._my_hash;

		executer_socket.emit('SET sdWorld.my_entity', new_character._net_id, { reliable: true, runs: 100 } );

		new_character.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		exectuter_character.remove();

		if ( socket.cc_id === 1 || socket.cc_id === 2 )
		new_character.cc_id = socket.cc_id;
	
		UpdatePlayerCharacterProperties( socket );
		
		{
			let character_entity = new_character;
			let guns;
			
			if ( GameState.warmup )
			guns = [ sdGun.CLASS_POPCORN ];
			else
			{
				guns = [ sdGun.CLASS_SWORD, sdGun.CLASS_BUILD_TOOL, sdGun.CLASS_MEDIKIT, sdGun.CLASS_CABLE_TOOL, sdGun.CLASS_PISTOL ];

				new_character.InstallUpgrade( 'upgrade_jetpack' );
				new_character.InstallUpgrade( 'upgrade_hook' );
				
				//new_character.build_tool_level = 5;
				//new_character._score = 100;
				//new_character.onScoreChange();
				//sdWorld.GiveScoreToPlayerEntity( 100, null, false, new_character );
				new_character._matter_capacity_boosters = new_character._matter_capacity_boosters_max;
			}
		
			for ( var i = 0; i < guns.length; i++ )
			{
				let gun = new sdGun({ x:character_entity.x, y:character_entity.y, class: guns[ i ] });
				sdEntity.entities.push( gun );

				character_entity.onMovementInRange( gun );
			}
		}
		
		return new_character;
	};
	
	let last_think_time = sdWorld.time;
	
	let RebuildWorld = ()=>
	{
		for ( let i = 0; i < sdEntity.entities.length; i++ )
		{
			let e = sdEntity.entities[ i ];
			
			if ( e._socket )
			e._socket.auto_spawn = true;
			
			if ( !e.IsGlobalEntity() )
			{
				e.remove();
				e._broken = false;
			}
		}
		
		preparation_shields = [];

		sdWorld.ChangeWorldBounds( 0,0,0,0 ); // Erase everything from previous round?

		if ( GameState.warmup )
		{
			let w = 20;
			let h = 5;

			sdWorld.world_bounds.x1 = -w * 16;
			sdWorld.world_bounds.x2 = w * 16;
			sdWorld.world_bounds.y1 = -h * 16;
			sdWorld.world_bounds.y2 = h * 16;

			let e;

			welcome_caption1 = new sdCaption({ x:0, y:-32, type:0 });
			sdEntity.entities.push( welcome_caption1 );

			welcome_caption2 = new sdCaption({ x:0, y:-32 + 16, type:0 });
			sdEntity.entities.push( welcome_caption2 );

			force_start_button = new sdWorld.entity_classes.sdButton({ x:0, y:32 + 16, type:0 });
			sdEntity.entities.push( force_start_button );

			for ( let x = sdWorld.world_bounds.x1; x < sdWorld.world_bounds.x2; x += 32 )
			{
				sdEntity.entities.push( new sdBlock({ x: x, y: sdWorld.world_bounds.y2 - 16, width: 32, height: 16, material: sdBlock.MATERIAL_WALL, texture_id: sdBlock.TEXTURE_ID_WALL, hue: ( x < -64 ) ? 0 : 145, filter: ( x >= -64 && x < 64 ) ? 'saturate(0)' : '' }) );
				sdEntity.entities.push( new sdBG({ x: x, y: sdWorld.world_bounds.y2 - 32, width: 32, height: 16, material: sdBG.MATERIAL_PLATFORMS, texture_id: sdBG.TEXTURE_PLATFORMS, br:200 }) );
			}
			
			for ( let s = -1; s <= 1; s += 2 )
			{
				let t = new sdTheatre({ x: 200 * s, y: 16 })
				sdEntity.entities.push( t );

				t.service = 'none';
				t.video = '';
				t.channel = null;

				t.program_name = 'PONG';

				let program = sdTheatre.programs[ t.program_name ];

				if ( program.ProgramStarted )
				program.ProgramStarted( t, program );
			}
		}
		else
		{
			let base_width = 20;

			let w = 30 + base_width;
			let h = 40;

			let underground = 20;

			sdWorld.ChangeWorldBounds( -w * 16, -h * 16, w * 16, h * 16 + underground * 16 );

			for ( let i = 0; i < sdEntity.entities.length; i++ )
			{
				let e = sdEntity.entities[ i ];

				if ( !e.IsGlobalEntity() )
				if ( e.x + e._hitbox_x2 > w * 16 - base_width * 16 || e.x + e._hitbox_x1 < -w * 16 + base_width * 16 )
				if ( e.y < 0 )
				{
					e.remove();
					e._broken = false;
				}
			}

			for ( let i = 0; i < base_width; i += 2 )
			{
				for ( let y = 0; y <= 160; y += 16 )
				if ( y === 0 || y === 160 || i === 0 || i === base_width - 2 )
				{
					let e = new sdBlock({ x: -w * 16 + i * 16, y: -16 - y, width: 32, height: 16, material: sdBlock.MATERIAL_WALL, texture_id: sdBlock.TEXTURE_ID_WALL });
					sdEntity.entities.push( e );
					
					let e2 = new sdBlock({ x: w * 16 - ( i + 2 ) * 16, y: -16 - y, width: 32, height: 16, material: sdBlock.MATERIAL_WALL, texture_id: sdBlock.TEXTURE_ID_WALL, hue: 145 });
					sdEntity.entities.push( e2 );
					
					e.Damage( e._hea - 1 );
					e2.Damage( e2._hea - 1 );
				}
				
				//sdEntity.entities.push( new sdBlock({ x: -w * 16 + i * 16, y: -16 - 320, width: 32, height: 16, material: sdBlock.MATERIAL_WALL, texture_id: sdBlock.TEXTURE_ID_GLASS }) );
				//sdEntity.entities.push( new sdBlock({ x: w * 16 - ( i + 2 ) * 16, y: -16 - 320, width: 32, height: 16, material: sdBlock.MATERIAL_WALL, texture_id: sdBlock.TEXTURE_ID_GLASS }) );
			}
			
			let base_id = 0;
			for ( let side = -1; side <= 1; side += 2, base_id++ )
			{
				let e = new sdCommandCentre({ x:w*16*side - base_width*16*0.2*side, y:-32 });
				sdEntity.entities.push( e );
				
				e.hmax = base_health;
				e.hea = base_health;
				
				e.biometry = '...';//( base_id === 0 ) ? 'BLUE' : 'RED';
				
				//let lost_ent = sdLost.CreateLostCopy( e, 'Base', sdLost.FILTER_NONE );
				//lost_ent.s = true;
				//lost_ent.d[ 1 ][ 0 ] = ;
				
				//e.remove();
				//e._broken = false;
				
				let e2 = new sdRescueTeleport({ x:e.x - 32 * side, y: e.y, type:sdRescueTeleport.TYPE_INFINITE_RANGE });
				sdEntity.entities.push( e2 );
				e2.allowed = true;
				e2.matter = e2._matter_max;
				e2.delay = 0;
				
				let lost_ent = sdLost.CreateLostCopy( e2, 'Reinforcement teleport', sdLost.FILTER_NONE );
				//lost_ent.s = true;
				//lost_ent.d[ 1 ][ 0 ] = ;
				
				e2.remove();
				e2._broken = false;
				
				//bases[ base_id ] = lost_ent;
				bases[ base_id ] = e;
				rtps[ base_id ] = lost_ent;
				
				for ( let i = 0; i < 6; i++ )
				{
					let params = { x:e.x - (64+i*16) * side, y: e.y, type:sdCrystal.TYPE_CRYSTAL_ARTIFICIAL, tag:'deep' };
					
					setTimeout( ()=>
					{
						let e2 = new sdCrystal( params );
						sdEntity.entities.push( e2 );
						
						let r = Math.pow( Math.random(), 2 );
						
						e2.matter_max = e2.matter = 40 * Math.pow( 2, Math.floor( r * 11 ) );
						//e2.matter_max = e2.matter = 40 * Math.pow( 2, Math.floor( 11 ) );
						
						sdWorld.SendEffect({ x:e2.x, y:e2.y, type:sdEffect.TYPE_TELEPORT });
						sdSound.PlaySound({ name:'teleport', x:e2.x, y:e2.y, volume:0.5 });
						
					}, 1000 * i );
				}
			}
			
			preparation_shields.push( new sdBlock({ hue:78, x: 30*16 - 32, y: sdWorld.world_bounds.y1, width: 32, height: 32 - sdWorld.world_bounds.y1, material: sdBlock.MATERIAL_BUGGED_CHUNK }) );
			preparation_shields.push( new sdBlock({ hue:78, x: 30*16 - 32, y: 0, width: sdWorld.world_bounds.x2 - ( 30*16 - 32 ), height: 32, material: sdBlock.MATERIAL_BUGGED_CHUNK }) );
			
			preparation_shields.push( new sdBlock({ hue:78, x: -30*16, y: sdWorld.world_bounds.y1, width: 32, height: 32 - sdWorld.world_bounds.y1, material: sdBlock.MATERIAL_BUGGED_CHUNK }) );
			preparation_shields.push( new sdBlock({ hue:78, x: sdWorld.world_bounds.x1, y: 0, width: -30*16 - sdWorld.world_bounds.x1, height: 32, material: sdBlock.MATERIAL_BUGGED_CHUNK }) );
			
			for ( let i = 0; i < preparation_shields.length; i++ )
			{
				let e = preparation_shields[ i ];
				e._hmax = e._hea = 1000000000;
				sdEntity.entities.push( e );
			}
		}
	};
	
	class sdServerConfigShort
	{
		// This file should contain one object (for example class like this one), it will be interpreted using basic eval method and automatically assigned to global variable sdWorld.server_config

		// If this all looks scary and you are using NetBeans - use "Ctrl + -" and "Ctrl + *" to hide big methods.

		static port = 2053;
		
		static password = ''; // Restrict connection access by asking players for password?
		static only_admins_can_spectate = true;

		static make_server_public = ( this.password === '' ); // By default it is public if password was not set. Public means server will send its' URL to www.gevanni.com to be potentially listed in servers list in future. Sent URL is told by first browser that has successfully connected to this server.

		static game_title = 'Star Defenders: Base vs base';

		static allowed_s2s_protocol_ips = [
			'127.0.0.1',
			'::1',
			'::ffff:127.0.0.1'
		];

		static database_server = null; // Example: 'https://www.gevanni.com:3000'; // Remote database_server must allow current server's IP in list above. Set as null if this server should have its' own database

		static notify_about_failed_s2s_attempts = true; // Trying to figure out why messages aren't sent from server to server? Set it to true
		static log_s2s_messages = false; // Trying to figure out why messages aren't sent from server to server? Set it to true

		static skip_arrival_sequence = true; // Skipping it will prevent players from spawning together pretty much. It is useful during tests though.

		// Setting both 'enable_bounds_move' and 'aggressive_hibernation' will enable open world support
		static enable_bounds_move = false;
		static aggressive_hibernation = false; // Offscreen groups of entities (sometimes whole bases) will be put to sleep until something tries to access these areas

		static apply_censorship = true; // Censorship file is not included

		static backup_interval_seconds = 1000 * 60 * 60 * 24;

		static supported_languages = [ 'en', 'ua', 'hr' ];

		// Check file sdServerConfig.js for more stuff to alter in server logic
		
		
		static allow_private_storage = false;
		static allowed_base_shielding_unit_types = [ sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE ];
		static allow_rescue_teleports = false;
		
		static LinkPlayerMatterCapacityToScore( character )
		{
			return true;
		}
		
		/*static GetLineOfSightMode( character )
		{
			return false;
		}*/
		
		static GetHitAllowed( bullet_or_sword, target )
		{
			// Cancel damage from bullet_or_sword towards target. ( bullet_or_sword._owner || bullet_or_sword._dangerous_from ) is a possible owner (can be null)

			if ( GameState.warmup )
			{
				if ( bullet_or_sword.is( sdGun ) )
				return true;
				
				if ( target.is( sdCaption ) )
				return false;
			
				if ( target.is( sdBlock ) )
				return false;
			
				if ( target.is( sdWorld.entity_classes.sdButton ) )
				return false;
			}

			if ( GameState.is_in_final_sequence )
			return false;

			// Prevent healing dead players without sockets on them
			if ( target.is( sdCharacter ) )
			{
				if ( target.hea <= 0 )
				if ( !target._socket )
				if ( bullet_or_sword.is( sdBullet ) )
				if ( bullet_or_sword._owner )
				{
					if ( bullet_or_sword._damage <= 0 )
					{
						if ( bullet_or_sword._owner.cc_id === target.cc_id )
						{
							sdWorld.SendEffect({ x:target.x, y:target.y, type:sdEffect.TYPE_TELEPORT });
							sdSound.PlaySound({ name:'teleport', x:target.x, y:target.y, volume:0.5 });

							target.remove();
							target._broken = false;
							
							if ( bullet_or_sword._owner._socket )
							bullet_or_sword._owner._socket.score++;
						
							if ( bullet_or_sword._owner.cc_id === 1 || bullet_or_sword._owner.cc_id === 2 )
							{
								bases[ bullet_or_sword._owner.cc_id - 1 ].hea += respawn_cost;
								bases[ bullet_or_sword._owner.cc_id - 1 ]._update_version++;
							}
						}
						else
						{
							target.Damage( 999999, bullet_or_sword._owner );
						}

						return false;
					}
				}
			}
			else
			{
				/*let base_id = bases.indexOf( target );
				if ( base_id !== -1 )
				return true;*/
			
				let rtp_id = rtps.indexOf( target );
				if ( rtp_id !== -1 )
				return false;
			
				if ( preparation_shields.indexOf( target ) !== -1 )
				return false;
			}

			return true;
		}

		static GetSocketScore( socket )
		{
			// Alternates return value of socket.GetScore() which is used for leaderboard

			return socket.score;
			//return socket.character ? socket.character._score : 0;
		}
		
		static onKill( target, initiator=null )
		{
			// Player (initiator) killed another player (target)
			
			if ( initiator && initiator.is( sdCharacter ) && initiator._my_hash !== undefined )
			{
				if ( initiator.cc_id === target.cc_id )
				{
					if ( initiator._socket )
					initiator._socket.score--;
				}
				else
				if ( initiator._socket )
				{
					initiator._socket.score++;
				}
				else
				if ( target._socket )
				target._socket.score--;
			}
			else
			{
				if ( target._socket )
				target._socket.score--;
			}
			
			target._last_attacker_until = sdWorld.time + 5000;
			//target.GiveScoreToLastAttacker( Math.min( 3, target._score ) );
			target.GiveScoreToLastAttacker( ~~( target._score * 0.25 ) );
			target._score = 0;
		}
		

		static GetEventSpeed()
		{
			return 30 * 60 * 2;
		}
		static EntitySaveAllowedTest( entity )
		{
			return false;
		}
		
		static onBeforeSnapshotLoad()
		{
			// Do something before shapshot is loaded. It is earliest available stage of logic - you can edit or alter shop contents here
			
			for ( let i = 0; i < sdShop.options.length; i++ )
			{
				if ( sdShop.options[ i ]._class === 'sdCommandCentre' ) // It currently bugs the cc_id of player...
				{
					sdShop.options.splice( i, 1 );
					i--;
					continue;
				}
			}

			sdWorld.no_respawn_areas = [];
		}
		static GetAllowedWorldEvents()
		{
			return GameState.warmup ? [] : undefined; // Return array of allowed event IDs or "undefined" to allow them all
		}
		static onAfterSnapshotLoad()
		{
			// World exists and players are ready to connect
			
			RebuildWorld();
		}
		static InitialSnapshotLoadAttempt()
		{
			// Do not load
		}
		static PlayerSpawnPointSeeker( character_entity, socket )
		{
			// This method wakes up sdDeepSleep areas beacause all of them might be hibernated. It should damage perfrormance in long term, paying attention to player spawn lags needs to be done

			character_entity.x = 0;
			character_entity.y = 0;
			//socket.SDServiceMessage( 'PlayerSpawnPointSeeker called' );
		}
		static onReconnect( character_entity, player_settings )
		{
			// Player was reconnected. Alternatively onRespawn can be called

			UpdatePlayerCharacterProperties( character_entity._socket );
		}
		static ModifyReconnectRestartAttempt( player_settings, socket ) // This happens after password/ban/JS challenge checks, though occasionally banned players will be able to join for a short period of time (especially if database is on a network resource or database server is not responding)
		{
			socket.forced_entity = 'sdPlayerSpectator';
			
			if ( socket.score === undefined )
			socket.score = 0;
		
			if ( socket.cc_id === undefined )
			{
				//socket.cc_id = Math.random() < 0.5 ? 1 : 2;
				
				let players_per_team = [ 0, 0 ];
				
				for ( let i = 0; i < sockets.length; i++ )
				{
					let socket2 = sockets[ i ];
					if ( socket2.character )
					if ( socket2.cc_id === 1 || socket2.cc_id === 2 )
					players_per_team[ socket2.cc_id - 1 ]++;
				}
				
				if ( players_per_team[ 0 ] < players_per_team[ 1 ] )
				socket.cc_id = 1;
				else
				if ( players_per_team[ 0 ] > players_per_team[ 1 ] )
				socket.cc_id = 2;
				else
				socket.cc_id = Math.random() < 0.5 ? 1 : 2;
			}
		
			socket.last_out_of_respawns_announcement_time = 0;
			
			socket.SDServiceMessage( 'Welcome to base vs base Star Defenders server!' );
			
			// socket.forced_entity = 'sdPlayerSpectator'; // Forcing player to play as specific class of entity
			// socket.forced_entity_params // Entity spawn params, x and y are added to these

			// player_settings.hero_name // Name of a newly connected character. Can be altered too

			// player_settings.full_reset = true; // Whether player wants to connect to existing character with a same hash or a new one. You can alter this value if you want to force player spectating after he died, for example

			// socket.my_hash // Player's hash, one he will try to be assigned to. Private string used for both player UID and password

			// socket.ip_accurate // Current IP address of a connection. Can be both IPv4 and IPv6

			// socket.challenge_result // Browser fingerprint string, looks something like this: '11218x0qwjw90,en-us,uk,jp,cn'

			// socket.SDServiceMessage( 'Server will be reset very soon and private storage will be disabled - make sure to migrate all of your items to other servers' ); // Startup notification demo

			// socket.emit( 'BACK_TO_MENU', 2000 ); // Send player back to menu, with delay

			// By editing player_settings you can alter character looks completely

			return true; // true to allow connection. false to reject. Make sure to fire some socket.SDServiceMessage call prior to returning false which will be telling player why join attempt was rejected
		}
		static IsEntitySpawnAllowed( player_settings, socket ) // You can disallow entity spawning with this one. It will still let players connect to their existing characters as long as they are alive
		{
			//socket.SDServiceMessage( 'IsEntitySpawnAllowed called' );
			
			//player_settings
			
			//return false;
			return true;
		}
		
		static GiveStarterRespawnItems( character_entity, player_settings )
		{
			/*let guns = [ sdGun.CLASS_BUILD_TOOL, sdGun.CLASS_MEDIKIT, sdGun.CLASS_CABLE_TOOL, sdGun.CLASS_PISTOL ];
			
			if ( character_entity.is( sdCharacter ) )
			for ( var i = 0; i < guns.length; i++ )
			{
				let gun = new sdGun({ x:character_entity.x, y:character_entity.y, class: guns[ i ] });
				sdEntity.entities.push( gun );

				character_entity.onMovementInRange( gun );
			}*/
		}

		static ModifyTerrainEntity( ent ) // ent can be sdBlock or sdBG
		{
			ent.hue = 0;
			ent.br = 300;
			ent.filter = 'saturate(0)';
			
			if ( ent.is( sdBlock ) )
			{
				if ( ent._plants )
				for ( let i = 0; i < ent._plants.length; i++ )
				{
					let e = sdEntity.entities_by_net_id_cache_map.get( ent._plants[ i ] );
					if ( e )
					{
						e.hue = 0;
						e.br = 300;
						e.filter = 'saturate(0)';
					}
				}
			}
			else
			{
				ent.br *= 0.5;
			}
		}
		
		
		static InstallBackupAndServerShutdownLogic()
		{
			sdWorld.SaveSnapshot = (a,b)=>{b(null);};
			sdWorld.PreventSnapshotSaving = ()=>{};
			sdWorld.SaveSnapshotAutoPath = (a,b)=>{b(null);};

			sdWorld.onBeforeTurnOff = ()=>{
				
				process.exit(1);
				
			};

			process.on( 'SIGTERM', sdWorld.onBeforeTurnOff );
			process.on( 'SIGINT', sdWorld.onBeforeTurnOff );
		}
		
		static onExtraWorldLogic( GSPEED )
		{
			let dt = sdWorld.time - last_think_time;
			last_think_time = sdWorld.time;

			if ( GameState.warmup )
			{
				//let players_joined = 0;
				let players_per_team = [ 0, 0 ];
				
				sdWeather.only_instance._quake_scheduled_amount = 0;
				sdWeather.only_instance.quake_intensity = 0;
				sdWeather.only_instance._asteroid_spam_amount = 0;
				sdWeather.only_instance._invasion = false;
				sdWeather.only_instance._rain_amount = 0;
				sdWeather.only_instance.raining_intensity = 0;
				sdWeather.only_instance.air = 1;
				
				for ( let i = 0; i < sdCharacter.characters.length; i++ )
				{
					var ent = sdCharacter.characters[ i ];
					
					if ( !ent._socket )
					if ( ent.hea > 0 )
					ent.Damage( ent.hea + 1, null, false, false );
				}

				for ( let i = 0; i < sockets.length; i++ )
				{
					let socket = sockets[ i ];
					
					if ( socket.character && socket.character._is_being_removed )
					{
						socket.character._socket = null;
						socket.character = null;
					}

					if ( socket.auto_spawn )
					{
						if ( !socket.character )
						socket.Respawn( socket.last_player_settings );

						socket.auto_spawn = false;
					}

					if ( socket.character )
					if ( !socket.character._is_being_removed && socket.character.hea > 0 )
					{
						if ( socket.character.is( sdPlayerSpectator ) )
						{
							let char = ConvertSpectatorIntoCharacterFor( socket );
							char.x = -60 + Math.random() * 120;
						}

						// Update character's team
						if ( socket.character.is( sdCharacter ) )
						{
							let is_blue = ( socket.character.x < -64 );
							let is_red = ( socket.character.x > 64 );

							let new_cc = is_red ? 2 : is_blue ? 1 : 0;

							if ( new_cc !== socket.character.cc_id )
							{
								socket.character.cc_id = new_cc;

								sdWorld.SendSound({ name:'pop', x:socket.character.x, y:socket.character.y, pitch:1, volume:0.5 });

								socket.cc_id = new_cc; // Socket should also know team?

								UpdatePlayerCharacterProperties( socket );
							}

							if ( is_red || is_blue )
							players_per_team[ is_red ? 1 : 0 ]++;
						}
					}
				}

				if ( welcome_caption1 )
				{
					let t = 'This is a waiting room. Press button to start the countdown ( '+players_per_team[ 0 ]+' red players, '+players_per_team[ 1 ]+' blue players )';
					if ( t !== welcome_caption1.text )
					{
						welcome_caption1.text = t;
						welcome_caption1._update_version++;
					}
				}

				if ( force_start_button )
				if ( !force_start_button._is_being_removed )
				if ( force_start_button.activated )
				GameState.forced_start_timer_activated = true;

				if ( GameState.forced_start_timer_activated )
				GameState.forced_start_timer += dt;

				if ( welcome_caption2 )
				{
					let t = 'Make sure to pick your side! Middle area is for spectators';

					if ( GameState.forced_start_timer_activated )
					t = 'Game starts in ' + Math.max( 0, warmup_end_duration - Math.floor( GameState.forced_start_timer / 1000 ) ) + '...';

					if ( t !== welcome_caption2.text )
					{
						sdWorld.SendSound({ name:'reload3', x:0, y:0, pitch:4, volume:0.25 });

						welcome_caption2.text = t;
						welcome_caption2._update_version++;
					}
				}

				if ( GameState.forced_start_timer >= warmup_end_duration * 1000 && ( players_per_team[ 0 ] > 0 || players_per_team[ 1 ] > 0 ) )
				{
					sdWorld.SendSound({ name:'reload3', x:0, y:0, volume:0.5 });

					GameState.warmup = false;
					GameState.started = true;
					RebuildWorld();
				}
			}
			else
			{
				if ( GameState.is_in_final_sequence )
				{
					GameState.is_in_final_sequence_timer += dt;

					if ( GameState.is_in_final_sequence_timer > 8000 )
					{
						// Reset game
						GameState = Object.assign( {}, GameState_initial );
						RebuildWorld();
					}
				}
				else
				{
					let old_time_since_started = GameState.time_since_started;
					GameState.time_since_started += dt;
					
					let announce_time_left_until_shields_disabled = ( Math.floor( old_time_since_started / 1000 ) !== Math.floor( GameState.time_since_started / 1000 ) );
					
					let playing_players_total = 0;
					
					for ( let i = 0; i < sockets.length; i++ )
					{
						let socket = sockets[ i ];

						if ( socket.character && socket.character._is_being_removed )
						{
							socket.character._socket = null;
							socket.character = null;
						}

						if ( socket.auto_spawn )
						{
							if ( !socket.character )
							socket.Respawn( socket.last_player_settings );

							socket.auto_spawn = false;
						}

						if ( socket.cc_id === 1 || socket.cc_id === 2 )
						{
							if ( socket.character )
							{
								if ( announce_time_left_until_shields_disabled )
								if ( GameState.time_since_started < ( time_until_shields_are_disabled + 3 ) * 1000 )
								{
									if ( GameState.time_since_started >= time_until_shields_are_disabled * 1000 )
									{
										socket.SDServiceMessage( 'Shields are disabled!' );

										while ( preparation_shields.length > 0 )
										{
											let e = preparation_shields.shift();
											e.remove();
											e._broken = false;
										}
									}
									else
									socket.SDServiceMessage( 'It is time to build (B key) your base in order to protect your Command Centre! Time left until shields are disabled: ' + Math.floor( time_until_shields_are_disabled - GameState.time_since_started / 1000 ) + ' seconds' );
								}
								
								if ( socket.character.is( sdPlayerSpectator ) )
								{
									if ( sdWorld.time > last_respawns[ socket.cc_id - 1 ] + 3000 )
									{
										let char = ConvertSpectatorIntoCharacterFor( socket );

										if ( char )
										{
											last_respawns[ socket.cc_id - 1 ] = sdWorld.time;
										
											char.x = rtps[ socket.cc_id - 1 ].x - 12 + Math.random() * 24;
											char.y = rtps[ socket.cc_id - 1 ].y - rtps[ socket.cc_id - 1 ]._hitbox_y1;

											sdWorld.SendEffect({ x:char.x, y:char.y, type:sdEffect.TYPE_TELEPORT });
											sdSound.PlaySound({ name:'teleport', x:char.x, y:char.y, volume:0.5 });
										}
										else
										{
											if ( sdWorld.time > socket.last_out_of_respawns_announcement_time + 5000 )
											{
												socket.last_out_of_respawns_announcement_time = sdWorld.time;
												socket.SDServiceMessage( 'Your team is out of respawn points. Try healing downed teammates!' );
											}
										}
									}
								}
								else
								{
									playing_players_total++;
								}
							}
						}
					}

					for ( let base_id = 0; base_id < 2; base_id++ )
					{
						let e = bases[ base_id ];
						
						e._regen_timeout = 99999; // Remove regen logic
						
						let title = ( ( base_id === 0 ) ? 'BLUE' : 'RED' ) + ', ' + Math.floor( e.hea / respawn_cost - 0.0001 ) + ' respawns left';
						if ( title !== e.biometry )
						{
							e.biometry = title;
							e._update_version++;
						}
						
						if ( e.hea <= 0 || e._is_being_removed )
						{
							GameState.is_in_final_sequence = true;

							for ( let i = 0; i < sockets.length; i++ )
							{
								let socket = sockets[ i ];
								socket.SDServiceMessage( ( base_id === 0 ) ? 'Red team wins!' : 'Blue team wins!' );
							}
							
							;
							sdSound.PlaySound({ name:'alien_energy_power_charge1', x:e.x, y:e.y, volume:2, pitch:1 });

							let that = e;
							for ( let i = 0; i < 40; i++ )
							{
								let an = Math.random() * Math.PI * 2;
								let d = ( i === 0 ) ? 0 : Math.random() * 400;
								let r = ( ( i === 0 ) ? 50 : ( 10 + Math.random() * 20 ) ) * 5;

								setTimeout( ()=>
								{
									//if ( !that._is_being_removed || i === 0 )
									{
										var a = Math.random() * 2 * Math.PI;
										var s = Math.random() * 10;

										var k = 1;

										var x = that.x + that._hitbox_x1 + Math.random() * ( that._hitbox_x2 - that._hitbox_x1 );
										var y = that.y + that._hitbox_y1 + Math.random() * ( that._hitbox_y2 - that._hitbox_y1 );

										//that.sx -= Math.sin( an ) * d * r * 0.005;
										//that.sy -= Math.cos( an ) * d * r * 0.005;

										sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: that.sx*k + Math.sin(a)*s, sy: that.sy*k + Math.cos(a)*s });
										sdWorld.SendEffect({ 
											x: that.x + Math.sin( an ) * d, 
											y: that.y + Math.cos( an ) * d, 
											radius: r, 
											damage_scale: 1, 
											type: sdEffect.TYPE_EXPLOSION,
											owner: that,
											can_hit_owner: false,
											color: sdEffect.default_explosion_color 
										});
									}
								}, i * 150 );
							}

							break;
						}
					}
					
					for ( let i = 0; i < sdCom.all_nodes.length; i++ )
					{
						let e = sdCom.all_nodes[ i ];
						
						if ( e._cc_id === 0 )
						{
							if ( e.subscribers.length === 1 )
							{
								let biometry = e.subscribers[ 0 ];
								
								let team = 0;
								
								for ( let i2 = 0; i2 < sdCharacter.characters.length; i2++ )
								if ( sdCharacter.characters[ i2 ].biometry === biometry )
								{
									team = sdCharacter.characters[ i2 ].cc_id;
									break;
								}
								
								e._cc_id = team;
							}
						}
						else
						{
							let old_len = e.subscribers.length;
							e.subscribers.length = 0;
							for ( let i2 = 0; i2 < sdCharacter.characters.length; i2++ )
							//if ( !sdCharacter.characters[ i2 ]._is_being_removed )
							if ( sdCharacter.characters[ i2 ].cc_id === e._cc_id )
							e.subscribers.push( sdCharacter.characters[ i2 ].biometry );
					
							if ( old_len !== e.subscribers.length )
							e._update_version++;
						}
					}
					
					time_until_next_secret_storage -= dt;
					if ( time_until_next_secret_storage < 0 )
					{
						time_until_next_secret_storage = 1000 * 60 * 5;
						
						let e = new sdStorage({ x:0, y:0 });
						sdEntity.entities.push( e );
						
						if ( sdWeather.SetRandomSpawnLocation( e ) )
						{
							e.onBuilt();
							e.stored_names[ 0 ] = '?';
							let r = Math.random();
							
							if ( r < 0.9 )
							e._stored_items[ 0 ] = { _class:'sdGun', x:0, y:0, class:Math.floor( Math.random() * sdGun.classes.length ) };
							else
							{
								let r2 = Math.random();
								if ( r2 < 0.25 )
								e._stored_items[ 0 ] = { _class:'sdCube', x:0, y:0, kind: sdCube.KIND_YELLOW };
								else
								if ( r2 < 0.5 )
								e._stored_items[ 0 ] = { _class:'sdOctopus', x:0, y:0 };
								else
								if ( r2 < 0.75 )
								e._stored_items[ 0 ] = { _class:'sdFaceCrab', x:0, y:0 };
								else
								e._stored_items[ 0 ] = { _class:'sdEnemyMech', x:0, y:0 };
							}
					
							e._hmax = e._hea = 30;
							
							e.filter = 'invert(1) hue-rotate('+Math.round(Math.random()*360/30)*30+'deg)';
						}
						else
						{
							e.remove();
							e._broken = false;
						}
					}
					
					// Make BSUs skip few levels
					for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
					{
						let e = sdBaseShieldingUnit.all_shield_units[ i ];
						
						while ( e.level % 5 !== 0 )
						e.level++;
					}
					
					if ( playing_players_total <= 0 )
					{
						wish_to_abort_game += dt;
						
						if ( wish_to_abort_game > 30000 )
						{
							wish_to_abort_game = 0;
							
							// Abort game
							GameState = Object.assign( {}, GameState_initial );
							RebuildWorld();
						}
					}
					else
					{
						wish_to_abort_game = 0;
					}
				}
			}
		}
	}
	
	return sdServerConfigShort;

})();
