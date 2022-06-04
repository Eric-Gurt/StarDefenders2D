class sdServerConfig
{
	// This file should contain one object (for example class like this one), it will be interpreted using basic eval method and automatically assigned to global variable sdWorld.server_config
			
	// If this all looks scary and you are using NetBeans - use "Ctrl + -" and "Ctrl + *" to hide big methods.
	
	static game_title = 'Star Defenders: Test area';
	
	static backgroundColor = '#333300';
	
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
		return []; // Return array of allowed event IDs or "undefined" to allow them all
	}
	static GetDisallowedWorldEvents()
	{
		return []; // Return array of disallowed event IDs. Has higher priority over GetAllowedWorldEvents() and can be used to allow any new events that will be added to the game with updates
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
			if ( character_entity.hea - dmg <= 30 )
			{
				sdWorld.no_respawn_areas.push({
					x: character_entity.x,
					y: character_entity.y,
					radius:150,
					until: sdWorld.time + 1000 * 60 // 1 minute at area
				});

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
			sdWorld.ChangeWorldBounds( -16 * 30, -16 * 30, 16 * 30, 16 * 30 );
		}
			
		const world_edge_think_rate = 500;
	}
	static PlayerSpawnPointSeeker( character_entity, socket )
	{
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
			
			let can_stand_here = character_entity.CanMoveWithoutOverlap( x, y, 0 ) && !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 );
			
			let ground_ent = sdWorld.last_hit_entity;

			if ( tr > max_tr * 0.6 || bad_areas_near === 0 )
			if ( tr > max_tr * 0.8 || ( can_stand_here && !sdWorld.CheckWallExistsBox( 
					x + character_entity._hitbox_x1 - 16, 
					y + character_entity._hitbox_y1 - 16, 
					x + character_entity._hitbox_x2 + 16, 
					y + character_entity._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) ) )
			if ( tr > max_tr * 0.4 || socket.command_centre || ground_ent === null || ( ground_ent.GetClass() === 'sdBlock' && ground_ent.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
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