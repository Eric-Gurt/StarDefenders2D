/*

	Whenever you will start new server instance, server_config.js file will be made using this file as template. Class sdServerConfigShort specifically, but you can add methods from sdServerConfigFull to server_config.js too

*/
class sdServerConfigShort
{
	// This file should contain one object (for example class like this one), it will be interpreted using basic eval method and automatically assigned to global variable sdWorld.server_config
			
	// If this all looks scary and you are using NetBeans - use "Ctrl + -" and "Ctrl + *" to hide big methods.
	
	static game_title = 'Star Defenders';
	
	static allowed_s2s_protocol_ips = [
		'127.0.0.1',
		'::1',
		'::ffff:127.0.0.1'
	];
		
	static notify_about_failed_s2s_attempts = true;
	
	static log_s2s_messages = false;
	
	static enable_bounds_move = false;
		
	static apply_censorship = true;
		
	// Check file sdServerConfig.js for more stuff to alter in server logic
}


class sdServerConfigFull extends sdServerConfigShort
{
	// ...
	
	
	static GetHitAllowed( bullet_or_sword, target )
	{
		// Cancel damage from bullet_or_sword towards target. ( bullet_or_sword._owner || bullet_or_sword._dangerous_from ) is a possible owner (can be null)
			
		return true;
	}
	
	static GetSocketScore( socket )
	{
		// Alternates return value of socket.GetScore() which is used for leaderboard
			
		return socket.character ? socket.character._score : 0;
	}
		
	static onDamage( target, initiator, dmg, headshot )
	{
		// Player (initiator, can be null in case of self-damage) damaged another player (target)
		
		if ( initiator )
		if ( initiator.is( sdCharacter ) )
		if ( initiator._socket )
		if ( sdWorld.time >= target._non_innocent_until ) // Check if victim is innocent
		initiator._non_innocent_until = sdWorld.time + 1000 * 30;
	}
	static onKill( target, initiator=null )
	{
		// Player (initiator) killed another player (target)
		
		// Check if initiator exists, is a sdCharacter and has player behind him
		if ( initiator )
		if ( initiator.is( sdCharacter ) )
		if ( initiator._socket )
		if ( !target._ai_enabled ) // Make sure not a real player is being killed
		if ( sdWorld.time < initiator._non_innocent_until ) // Attacker is not innocent
		{
			if ( initiator._socket.ffa_warning === 0 )
			initiator._socket.SDServiceMessage( 'Your respawn rate was temporarily decreased' );

			initiator._socket.SyncFFAWarning();
			initiator._socket.ffa_warning += 1;
			initiator._socket.respawn_block_until = sdWorld.time + initiator._socket.ffa_warning * 5000;
		}
	}
			
	static GetAllowedWorldEvents()
	{
		return undefined; // Return array of allowed event IDs or "undefined" to allow them all
	}
	static GetDisallowedWorldEvents()
	{
		return []; // Return array of disallowed event IDs. Has higher priority over GetAllowedWorldEvents() and can be used to allow any new events that will be added to the game with updates
	}
	static GetAllowedWorldEventCount()
	{
		return 6; // Return number of allowed events to happen during planet day
	}
	static GetEventSpeed()
	{
		return 30 * 60 * 3 * ( 3 / 2 ); // Return max possible time until next event rolls
	}		
	static onExtraWorldLogic( GSPEED )
	{
	}
			
	static ResetScoreOnDeath( character_entity )
	{
		return true;
	}
			
	static onDisconnect( character_entity, reason ) // reason can be either 'disconnected' (connection lost) or 'manual' (player right clicked on himself or pressed Space while dead)
	{
		// Player lost control over sdCharacter (does not include full death case). Note that in case of reason being 'manual' player will get damage equal to his .hea (health) value.
		
	}
			
	static onReconnect( character_entity, player_settings )
	{
		// Player was reconnected. Alternatively onRespawn can be called
		
	}
	static onRespawn( character_entity, player_settings )
	{
		// Player just fully respawned. Best moment to give him guns for example. Alternatively onReconnect can be called
		
		let instructor_entity = null;
		
		// Spawn starter items based off what player wants to spawn with
		let guns = [ sdGun.CLASS_BUILD_TOOL ];
		if ( player_settings.start_with1 )
		guns.push( sdGun.CLASS_PISTOL );
		else
		if ( player_settings.start_with2 )
		guns.push( sdGun.CLASS_SWORD );
		else
		if ( player_settings.start_with3 )
		guns.push( sdGun.CLASS_SHOVEL );

		if ( character_entity.is( sdCharacter ) )
		for ( var i = 0; i < sdGun.classes.length; i++ )
		if ( guns.indexOf( i ) !== -1 )
		{
			let gun = new sdGun({ x:character_entity.x, y:character_entity.y, class: i });
			sdEntity.entities.push( gun );

			if ( i !== sdGun.CLASS_BUILD_TOOL )
			character_entity.gun_slot = sdGun.classes[ i ].slot;
		}
			
		// Track early damage and save this kind of info for later
		const EarlyDamageTaken = ( character_entity, dmg, initiator )=>
		{
			if ( dmg > 0 )
			if ( initiator )
			if ( initiator !== instructor_entity )
			if ( instructor_entity )
			if ( !instructor_entity._is_being_removed )
			{
				if ( instructor_entity._ai )
				instructor_entity._ai.target = initiator;
			}
			
			if ( character_entity.hea - dmg <= 30 )
			{
				/*sdWorld.no_respawn_areas.push({
					x: character_entity.x,
					y: character_entity.y,
					radius:150,
					until: sdWorld.time + 1000 * 60 // 1 minute at area
				});*/

				if ( initiator )
				{
					sdWorld.no_respawn_areas.push({
						x: character_entity.x,
						y: character_entity.y,
						entity: initiator,
						radius:250,
						until: sdWorld.time + 1000 * 60 * 5 // 5 minutes around entity that damaged
					});
				}

				character_entity.removeEventListener( 'DAMAGE', EarlyDamageTaken );
			}
		};
		character_entity.addEventListener( 'DAMAGE', EarlyDamageTaken );
		
		// Disable starter damage tracking after while
		setTimeout( ()=>
		{
			character_entity.removeEventListener( 'DAMAGE', EarlyDamageTaken );
		}, 5000 );
		
		// Instructor, obviously
		if ( player_settings.hints2 )
		{
			let intro_offset = 0;
			let intro_to_speak = [];
			
			switch ( ~~( Math.random() * 4 ) )
			{
				case 0: intro_to_speak.push( 'Welcome to Star Defenders!' ); break;
				case 1: intro_to_speak.push( 'Welcome to Star Defenders, ' + character_entity.title + '!' ); break;
				case 2: intro_to_speak.push( 'Hi.' ); break;
				case 3: intro_to_speak.push( 'Hello.' ); break;
			}
			
			switch ( ~~( Math.random() * 17 ) )
			{
				case 0: intro_to_speak.push( ...[ 
					'Try not to die, lol.' 
				] ); break;
				
				case 1: intro_to_speak.push( ...[ 
					'Everything wants to kill us here.',
					'You will probably not survive.',
					(~~(1 + Math.random() * 100)) + ' expeditors before you did not survive.',
					'If I was you I\'d go back to Mothership before it is too late.'
				] ); break;
				
				case 2: intro_to_speak.push( ...[ 
					'This is a sandbox-type of game where you can play and interact with other players.',
					'You can move around by pressing W, S, A and D keys.',
					'You can look around and aim by moving your mouse.',
					'You can press Left Mouse button to fire.',
					'Attacks require a resource called Matter.',
					'Matter can be found in underground crystals.',
					'You can try digging ground in order to find crystals, but finding them is not guaranteed.',
					'Sometimes you might encounter enemies and other players.',
					'You can interact with other players by sending proximity chat messages.',
					'Press Enter key to start typing chat messages. Press Enter key again to send them.',
					'You can switch active device by pressing keys from 1 to 9.',
					'Each device uses its\' own slot represented with number.',
					'Slot 9 is a Build tool. Press 9 Key in order to activate build mode.',
					'Once you have selected slot 9, you can press Right Mouse button in order to enter build selection menu.',
					'You can also press B key to open build selection menu directly.',
					'In that menu you will find placeable entities such as walls and weapons as well as upgrades.',
					'On respawn you will lose all your upgrades.',
					'Jetpack ability can be activated by pressing W or Space mid-air.',
					'Grappling hook ability can be activated with Mouse Wheel click or C key.',
					'Ghosting ability can be activated by pressing E key.',
					'Defibrillator can revive passed out players.',
					'You can throw held items by pressing V key.',
					'You can aim at background-level walls by holding Shift key.',
					'And finally, you can disable these hints at start screen.',	
					'Good luck!'
				] ); break;
				
				case 3: intro_to_speak.push( ...[  
					'Read some manual on how to survive here.',
					'I\'m sick of all this.'
				] ); break;
				
				case 4: intro_to_speak.push( ...[  
					'Ask someone for help, I\'m not payed high enough to instruct newbies and risk my life.'
				] ); break;
				
				case 5: intro_to_speak.push( ...[  
					'...and so I tell to that previous guy: "We are under the acid rain, let\'s hide!"',
					'And then he starts digging me with his shovel!',
					'I did not like it.',
					'So, smash random keys on keyboard and you\'ll figure this out.',
					'I believe in you!'
				] ); break;
				
				case 6: intro_to_speak.push( ...[  
					'Damn, so much as changed.',
					'Have you tried patting slugs?',
					'I\'ve never felt anything as dissapointing.',
					'I\'ll wait for you on Mothership.',
					'You know, where people actually survive.'
				] ); break;
				
				case 7: intro_to_speak.push( ...[  
					'Lol you will die here.'
				] ); break;
				
				case 8: intro_to_speak.push( ...[  
					'So you should build long-range teleport and then do some tasks.',
					'Good luck!'
				] ); break;
				
				case 9: intro_to_speak.push( ...[  
					'Be smarter than dozen of previous guys and build Rescue Teleport.',
					'We also call them RTPs.',
					'Good luck!'
				] ); break;
				
				case 10: intro_to_speak.push( ...[  
					'Watch out for raiders.',
					'Build base 3 big blocks wide and install some Base Shielding Unit.',
					'Also add some doors, connect them via Cable Management Tool to Communication Node.',
					'It will prevent other people from getting into your base.',
					'Also get glowing crystals and put them into Matter Amplifiers.',
					'Get score for doing tasks and then upgrade Matter Amplifiers.',
					'Good luck!'
				] ); break;
				
				case 11: intro_to_speak.push( ...[  
					'Sorry, this is my last day at this job.',
					'I won\'t give you any advice today.',
					'You are a big guy.',
					'Good luck!'
				] ); break;
				
				case 12: intro_to_speak.push( ...[  
					'Just hire somebody to do job for you, lol, you are not going to make it.',
					'You\'ll probably die just like that Rescue Teleport-less noob.'
				] ); break;
				
				case 13: intro_to_speak.push( ...[  
					'Octopuses can eat your guns including your build tool.'
				] ); break;
				
				case 14: intro_to_speak.push( ...[  
					'Crystal crabs can eat plants to recover their regeneration rate.'
				] ); break;
				
				case 15: intro_to_speak.push( ...[  
					'Watch out for Cubes, they protect this land.',
					'They even protect crystals. Luckily, not the matter.',
					'Good luck!'
				] ); break;
				
				case 16: intro_to_speak.push( ...[  
					'Some creatures really want our matter.'
				] ); break;
				
			}
				
			let my_character_entity = character_entity;
			
			
			
			instructor_entity = new sdCharacter({ x:my_character_entity.x + 32, y:my_character_entity.y - 32 });
			instructor_entity._ai_enabled = sdCharacter.AI_MODEL_TEAMMATE;//sdCharacter.AI_MODEL_INSTRUCTOR;
			instructor_entity._ai_gun_slot = sdGun.classes[ sdGun.CLASS_RAILGUN ].slot;
			instructor_entity._allow_despawn = false;
			instructor_entity._ai_level = 10;
			instructor_entity._matter_regeneration = 1;
			instructor_entity._matter_regeneration_multiplier = 10;
			
			let instructor_gun = new sdGun({ x:instructor_entity.x, y:instructor_entity.y, class:sdGun.CLASS_RAILGUN });
			
			let instructor_settings = {"hero_name":"Instructor","color_bright":"#7aadff","color_dark":"#25668e","color_bright3":"#7aadff","color_dark3":"#25668e","color_visor":"#ffffff","color_suit":"#000000","color_shoes":"#303954","color_skin":"#51709a","voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"color_suit2":"#000000","color_dark2":"#25668e"};

			instructor_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( instructor_settings );
			instructor_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( instructor_settings );
			instructor_entity.title = instructor_settings.hero_name;
			//instructor_entity.matter = 1;
			instructor_entity.matter_max = 1;
			let instructor_interval0 = setInterval( ()=>
			{
				if ( instructor_entity.hea <= 0 || instructor_entity._is_being_removed )
				instructor_gun.remove();
				
				if ( my_character_entity._is_being_removed || 
					 instructor_entity._is_being_removed || 
					 my_character_entity._socket === null || 
					 ( instructor_entity.hea <= 0 && sdWorld.Dist2D( instructor_entity.x, instructor_entity.y, my_character_entity.x, my_character_entity.y ) > 800 ) )
				{
					instructor_gun.remove();
					instructor_entity.remove();
					clearInterval( instructor_interval0 );
					return;
				}
				
				//instructor_entity.gun_slot = sdGun.classes[ sdGun.CLASS_RAILGUN ].slot;
				
				instructor_entity._key_states.SetKey( 'KeyA', 0 );
				instructor_entity._key_states.SetKey( 'KeyD', 0 );
				instructor_entity._key_states.SetKey( 'KeyW', 0 );
				
				if ( instructor_entity.x < my_character_entity.x - 32 )
				instructor_entity._key_states.SetKey( 'KeyD', 1 );
			
				if ( instructor_entity.x > my_character_entity.x + 32 )
				instructor_entity._key_states.SetKey( 'KeyA', 1 );
			
				if ( my_character_entity.stands )
				if ( instructor_entity.y > my_character_entity.y + 8 )
				instructor_entity._key_states.SetKey( 'KeyW', 1 );
			
				/*if ( instructor_entity._ai && instructor_entity._ai.target )
				{
				}
				else
				{
					instructor_entity.look_x = my_character_entity.x;
					instructor_entity.look_y = my_character_entity.y;
				}*/
		
				instructor_entity.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				
			}, 100 );
			let instructor_interval = setInterval( ()=>
			{
				if ( instructor_entity && instructor_entity.hea > 0 && !instructor_entity._is_being_removed )
				{
					/*if ( my_character_entity.hea > 0 && !my_character_entity._dying )
					if ( sdWeather.only_instance )
					if ( sdWeather.only_instance.raining_intensity > 0 )
					if ( sdWeather.only_instance._rain_amount > 0 )
					if ( sdWeather.only_instance.TraceDamagePossibleHere( my_character_entity.x, my_character_entity.y ) )
					{
						if ( my_character_entity.matter > 5 )
						instructor_entity.Say( 'Looks like we are under the acid rain, try to find shelter or dig under the ground to hide from it.', false );
						else
						instructor_entity.Say( 'Looks like we are under the acid rain, try to find shelter or water.', false );
					
						return;
					}*/

					if ( intro_to_speak[ intro_offset ] )
					{
						instructor_entity.Say( intro_to_speak[ intro_offset ], false );
					}
					intro_offset++;
				}
				
				if ( !instructor_entity._ai || !instructor_entity._ai.target || instructor_entity._ai.target._is_being_removed )
				if ( intro_offset > intro_to_speak.length || instructor_entity._is_being_removed )
				{
					clearInterval( instructor_interval );
					
					sdWorld.SendEffect({ x:instructor_entity.x + (instructor_entity.hitbox_x1+instructor_entity.hitbox_x2)/2, y:instructor_entity.y + (instructor_entity.hitbox_y1+instructor_entity.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });
					
					sdSound.PlaySound({ name:'teleport', x:instructor_entity.x, y:instructor_entity.y, volume:0.5 });
						
					instructor_entity.remove();
				}
				
			}, 5500 );
			
			
			sdEntity.entities.push( instructor_entity );
			sdEntity.entities.push( instructor_gun );
			
			if ( Math.random() < 0.25 )
			{
				let instructor_gun2 = new sdGun({ x:instructor_entity.x, y:instructor_entity.y, class:sdGun.CLASS_EMERGENCY_INSTRUCTOR });
				sdEntity.entities.push( instructor_gun2 );
			}
		}
	}
	static EntitySaveAllowedTest( entity )
	{
		// This method should return false in cases when specific entities should never be saved in snapshots (for example during reboot). Can be used to not save players for FFA servers especially if reboots are frequent
			
		return true;
	}
	static onBeforeSnapshotLoad()
	{
		// Do something before shapshot is loaded. It is earliest available stage of logic - you can edit or alter shop contents here
			
		sdWorld.no_respawn_areas = [];
	}
	static onAfterSnapshotLoad()
	{
		// World exists and players are ready to connect
		
		// In case of new server these will be 0. This will define initial world bounds:
		if ( sdWorld.world_bounds.x1 === 0 )
		if ( sdWorld.world_bounds.x2 === 0 )
		if ( sdWorld.world_bounds.y1 === 0 )
		if ( sdWorld.world_bounds.y2 === 0 )
		{
			console.log( 'Reinitializing world bounds' );
			sdWorld.ChangeWorldBounds( -16 * Math.round( 4000 / 16 ), -16 * Math.round( 2000 / 16 ), 16 * Math.round( 4000 / 16 ), 16 * Math.round( 2000 / 16 ) );
		}
			
		const world_edge_think_rate = 500;
			
		// Setup a logic for world bounds shifter
		setInterval( ()=>
		{
			if ( !sdWorld.server_config.enable_bounds_move )
			return;
		
			let x1 = sdWorld.world_bounds.x1;
			let y1 = sdWorld.world_bounds.y1;
			let x2 = sdWorld.world_bounds.x2;
			let y2 = sdWorld.world_bounds.y2;

			// Locked decrease for removal of old parts
			let x1_locked = false;
			let y1_locked = false;
			let x2_locked = false;
			let y2_locked = false;

			let x1_locked_by = [];
			let y1_locked_by = [];
			let x2_locked_by = [];
			let y2_locked_by = [];

			let edge_cursious = []; // -1
			let edge_cursious_ent = [];

			let sockets = sdWorld.sockets;
			let no_respawn_areas = sdWorld.no_respawn_areas;

			function TellReason()
			{
				for ( var i = 0; i < edge_cursious_ent.length; i++ )
				{
					if ( edge_cursious_ent[ i ]._socket )
					{
						let blocking_by = [];

						switch ( edge_cursious[ i ] )
						{
							case 0: for ( var i2 = 0; i2 < x1_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( x1_locked_by[ i2 ]._net_id ) ); break;
							case 1: for ( var i2 = 0; i2 < x2_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( x2_locked_by[ i2 ]._net_id ) ); break;
							case 2: for ( var i2 = 0; i2 < y1_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( y1_locked_by[ i2 ]._net_id ) ); break;
							case 3: for ( var i2 = 0; i2 < y2_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( y2_locked_by[ i2 ]._net_id ) ); break;
						}

						for ( var i2 = 0; i2 < blocking_by.length; i2++ )
						{
							let count = 1;
							for ( var i3 = i2 + 1; i3 < blocking_by.length; i3++ )
							{
								if ( blocking_by[ i2 ] === blocking_by[ i3 ] )
								{
									count++;
									blocking_by.splice( i3, 1 );
									i3--;
									continue;
								}
							}
							if ( count > 1 )
							{
								blocking_by[ i2 ] = blocking_by[ i2 ] + ' x' + count;
							}
						}

						if ( blocking_by.length === 1 )
						edge_cursious_ent[ i ]._socket.SDServiceMessage( 'World can not be extended past this point - ' + blocking_by.join(', ') + ' is at the opposite edge of playable area' );
						else
						edge_cursious_ent[ i ]._socket.SDServiceMessage( 'World can not be extended past this point - ' + blocking_by.join(', ') + ' are at the opposite edge of playable area' );
					}
				}
			}

			let top_matter = 0;


			for ( let i = 0; i < no_respawn_areas.length; i++ )
			{
				if ( sdWorld.time > no_respawn_areas[ i ].until )
				{
					no_respawn_areas.splice( i, 1 );
					i--;
					continue;
				}

				if ( no_respawn_areas[ i ].entity )
				{
					if ( no_respawn_areas[ i ].entity._is_being_removed )
					{
						no_respawn_areas.splice( i, 1 );
						i--;
						continue;
					}

					no_respawn_areas[ i ].x = no_respawn_areas[ i ].entity.x;
					no_respawn_areas[ i ].y = no_respawn_areas[ i ].entity.y;
				}
			}

			for ( let i = 0; i < sockets.length; i++ )
			{
				var ent = sockets[ i ].character;
				if ( ent !== null )
				if ( ent.hea > 0 )
				if ( !ent._is_being_removed )
				{
					if ( ent.matter > top_matter )
					top_matter = ent.matter;

					if ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 > 4000 )
					{
						if ( ent.x < sdWorld.world_bounds.x1 + 2000 )
						{
							x1_locked = true;
							x1_locked_by.push( ent );
						}

						if ( ent.x > sdWorld.world_bounds.x2 - 2000 )
						{
							x2_locked = true;
							x2_locked_by.push( ent );
						}
					}


					if ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 > 2000 )
					{
						if ( ent.y < sdWorld.world_bounds.y1 + 1000 )
						{
							y1_locked = true;
							y1_locked_by.push( ent );
						}

						if ( ent.y > sdWorld.world_bounds.y2 - 1000 )
						{
							y2_locked = true;
							y2_locked_by.push( ent );
						}
					}
					/*
					if ( ent.y < ( sdWorld.world_bounds.y1 + sdWorld.world_bounds.y2 ) / 2 )
					y1_locked = true;
					else
					y2_locked = true;*/

					if ( ent.x > sdWorld.world_bounds.x2 - 16 * 40 )
					{
						x2 += 16 * 5;

						if ( ent.x > sdWorld.world_bounds.x2 - 32 )
						{
							edge_cursious.push( 0 );
							edge_cursious_ent.push( ent );
						}
					}

					if ( ent.x < sdWorld.world_bounds.x1 + 16 * 40 )
					{
						x1 -= 16 * 5;
						if ( ent.x < sdWorld.world_bounds.x1 + 32 )
						{
							edge_cursious.push( 1 );
							edge_cursious_ent.push( ent );
						}
					}

					if ( ent.y > sdWorld.world_bounds.y2 - 16 * 40 )
					{
						y2 += 16 * 5;
						if ( ent.y > sdWorld.world_bounds.y2 - 32 )
						{
							edge_cursious.push( 2 );
							edge_cursious_ent.push( ent );
						}
					}

					if ( ent.y < sdWorld.world_bounds.y1 + 16 * 40 )
					{
						y1 -= 16 * 5;
						if ( ent.y < sdWorld.world_bounds.y1 + 32 )
						{
							edge_cursious.push( 3 );
							edge_cursious_ent.push( ent );
						}
					}
				}
			}

			for ( let i = 0; i < sdCommandCentre.centres.length; i++ )
			{
				var ent = sdCommandCentre.centres[ i ];

				if ( top_matter >= sdCharacter.matter_required_to_destroy_command_center )
				if ( ent.self_destruct_on < sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near - 1000 * 5 )
				{
					ent.self_destruct_on = Math.min( ent.self_destruct_on + world_edge_think_rate * 2, sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near );
				}

				if ( ent.x < sdWorld.world_bounds.x1 + 1000 )
				{
					x1_locked = true;
					x1_locked_by.push( ent );
				}
				if ( ent.x > sdWorld.world_bounds.x2 - 1000 )
				{
					x2_locked = true;
					x2_locked_by.push( ent );
				}

				if ( ent.y < sdWorld.world_bounds.y1 + 1000 )
				{
					y1_locked = true;
					y1_locked_by.push( ent );
				}
				if ( ent.y > sdWorld.world_bounds.y2 - 1000 )
				{
					y2_locked = true;
					y2_locked_by.push( ent );
				}
			}

			if ( sdWorld.world_bounds.x1 !== x1 ||
				 sdWorld.world_bounds.y1 !== y1 ||
				 sdWorld.world_bounds.x2 !== x2 ||
				 sdWorld.world_bounds.y2 !== y2 )
			{
				let min_width = 3200 * 2; // % 16
				let min_height = 1600 * 2; // % 16

				if ( x2 - x1 > min_width )
				{
					if ( x1_locked && x2_locked )
					{
						x1 = sdWorld.world_bounds.x1;
						x2 = sdWorld.world_bounds.x2;
						//return; 
					}
					else
					{
						if ( x1_locked )
						x2 = x1 + min_width;
						else
						x1 = x2 - min_width;
					}
				}

				if ( y2 - y1 > min_height )
				{
					if ( y1_locked && y2_locked )
					{
						y1 = sdWorld.world_bounds.y1;
						y2 = sdWorld.world_bounds.y2;
						//return;
					}
					else
					{
						if ( y1_locked )
						y2 = y1 + min_height;
						else
						y1 = y2 - min_height;
					}
				}

				if ( sdWorld.world_bounds.x1 !== x1 ||
					 sdWorld.world_bounds.y1 !== y1 ||
					 sdWorld.world_bounds.x2 !== x2 ||
					 sdWorld.world_bounds.y2 !== y2 )
				sdWorld.ChangeWorldBounds( x1, y1, x2, y2 );
				else
				TellReason();
			}
			else
			{
				TellReason();
			}

		}, world_edge_think_rate );
	}
	static PlayerSpawnPointSeeker( character_entity, socket )
	{
		//const sdBaseShieldingUnit = sdWorld.entity_classes.sdBaseShieldingUnit;
		//const sdBlock = sdWorld.entity_classes.sdBlock;
		
		let x,y,bad_areas_near,i;
		let tr = 0;
		let max_tr = 10000;
		do
		{
			x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
			y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

			if ( socket.command_centre )
			{
				if ( socket.command_centre._is_being_removed )
				{
					socket.command_centre = null;
					socket.SDServiceMessage( 'Command Centre no longer exists' );
				}
				else
				{
					if ( tr < max_tr * 0.05 )
					{
						x = socket.command_centre.x - 100 + Math.random() * 200;
						y = socket.command_centre.y - 100 + Math.random() * 200;
					}
					else
					if ( tr < max_tr * 0.1 )
					{
						x = socket.command_centre.x - 500 + Math.random() * 1000;
						y = socket.command_centre.y - 500 + Math.random() * 1000;
					}
					else
					if ( tr < max_tr * 0.15 )
					{
						x = socket.command_centre.x - 500 + Math.random() * 1000;
						y = socket.command_centre.y - 500 + Math.random() * 1000;
					}
				}
			}

			bad_areas_near = 0;

			for ( i = 0; i < sdWorld.no_respawn_areas.length; i++ )
			if ( sdWorld.inDist2D_Boolean( x, y, sdWorld.no_respawn_areas[ i ].x, sdWorld.no_respawn_areas[ i ].y, sdWorld.no_respawn_areas[ i ].radius ) )
			{
				bad_areas_near++;
				break;
			}
			
			let bsu_nearby = false;
			for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
			{
				let e = sdBaseShieldingUnit.all_shield_units[ i ];
				if ( e.enabled )
				if ( sdWorld.inDist2D_Boolean( x, y, e.x, e.y, sdBaseShieldingUnit.protect_distance ) )
				{
					bsu_nearby = true;
					break;
				}
			}
			
			sdWorld.last_hit_entity = null;

			let can_stand_here = character_entity.CanMoveWithoutOverlap( x, y, 0 ) && !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 );
			
			let ground_ent = sdWorld.last_hit_entity;
			
			// Note: socket.command_centre is no longer used (CC no longer goes there)


			if ( !bsu_nearby )
			// Dedicated first 60% of attempts to spawn somewhere where there is no early damage
			if ( tr > max_tr * 0.6 || bad_areas_near === 0 )
			// Dedicated first 80% of attempts to spawn somewhere where can stand and there is no water
			if ( tr > max_tr * 0.8 || ( can_stand_here && !sdWorld.CheckWallExistsBox( 
					x + character_entity._hitbox_x1 - 16, 
					y + character_entity._hitbox_y1 - 16, 
					x + character_entity._hitbox_x2 + 16, 
					y + character_entity._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) ) )
			// Dedicated first 40% of attempts to spawn somewhere where ground exists
			if ( tr > max_tr * 0.4 || socket.command_centre || ( ground_ent !== null && ( ground_ent.is( sdBlock ) && ground_ent.material === sdBlock.MATERIAL_GROUND ) ) ) // Only spawn on ground (or near CC)
			{
				character_entity.x = x;
				character_entity.y = y;

				//sdWorld.UpdateHashPosition( ent, false );

				if ( socket.command_centre )
				{
					if ( Math.abs( socket.command_centre.x - x ) <= 200 && Math.abs( socket.command_centre.y - y ) <= 200 )
					{
						socket.respawn_block_until = sdWorld.time + 1000 * 10; // Not too frequently
					}
					else
					if ( Math.abs( socket.command_centre.x - x ) <= 500 && Math.abs( socket.command_centre.y - y ) <= 500 )
					{
						socket.respawn_block_until = sdWorld.time + 1000 * 10; // Not too frequently

						socket.SDServiceMessage( 'Unable to respawn too close to Command Centre (possibly due to recent spawnkills near Command Center)' );
					}
					else
					socket.SDServiceMessage( 'Unable to respawn near Command Centre (possibly due to recent spawnkills near Command Center)' );
				}

				break;
			}

			tr++;
			if ( tr > max_tr )
			{
				character_entity.x = x;
				character_entity.y = y;
				break;
			}
		} while( true );
	}
}

export { sdServerConfigShort, sdServerConfigFull };
