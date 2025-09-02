import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdQuickie from './sdQuickie.js';
import sdAsp from './sdAsp.js';
import sdCrystal from './sdCrystal.js';
import sdBG from './sdBG.js';
import sdBlock from './sdBlock.js';
import sdCube from './sdCube.js';
import sdJunk from './sdJunk.js';
import sdLost from './sdLost.js';
import sdStorage from './sdStorage.js';
import sdAsteroid from './sdAsteroid.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdWeather from './sdWeather.js';

import sdTask from './sdTask.js';
import sdFactions from './sdFactions.js';


import sdRenderer from '../client/sdRenderer.js';


class sdRift extends sdEntity
{
	static init_class()
	{
		sdRift.img_rift_anim = sdWorld.CreateImageFromFile( 'rift_anim' );
		sdRift.img_em_anomaly = sdWorld.CreateImageFromFile( 'em_anomaly' );
		sdRift.portals = 0;
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdRift.TYPE_UNSET = 0;
		sdRift.TYPE_CRYSTALLIZED_PORTAL = 1; // Crystal asps and quickies
		sdRift.TYPE_CUBE_PORTAL = 2; // Cubes
		sdRift.TYPE_ASTEROID_PORTAL = 3; // Asteroid Portal
		sdRift.TYPE_DIMENSIONAL_TEAR = 4; // "Black hole" / dimensional tear
		sdRift.TYPE_COUNCIL_PORTAL = 5; // Council portal, from failing the portal machine task
		sdRift.TYPE_ELECTROMAGNETIC_ANOMALY = 6; // Electromagnetic anomaly, drains matter on contact with objects that contain matter
		
		sdRift.scale_by_type = [
			1, // 0
			1, // 1
			1.3, // 2
			1, // 3
			2, // 4
			1.3, // 5
			1 // 6
		];
	}
	get hitbox_x1() { return -15 * ( sdRift.scale_by_type[ this.type ] || 1 ); }
	get hitbox_x2() { return 15 * ( sdRift.scale_by_type[ this.type ] || 1 ); }
	get hitbox_y1() { return -15 * ( sdRift.scale_by_type[ this.type ] || 1 ); }
	get hitbox_y2() { return 15 * ( sdRift.scale_by_type[ this.type ] || 1 ); }

	get hard_collision()
	{ return false; }
	
	//IsBGEntity() // 1 for BG entities, should handle collisions separately
	//{ return 1; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null ) // Not that much useful since it cannot be damaged by anything but matter it contains.
	{
		if ( !sdWorld.is_server )
		return;
	}
	constructor( params )
	{
		super( params );
		
		let num = Math.random(); // Maybe better to rework portal spawning this way
		
		
		let portal_type = ( num < 0.2 ) ? sdRift.TYPE_DIMENSIONAL_TEAR : ( num < 0.4 ) ? sdRift.TYPE_ASTEROID_PORTAL : ( num < 0.7 ) ? sdRift.TYPE_CUBE_PORTAL : sdRift.TYPE_CRYSTALLIZED_PORTAL; // Portal chances since they're no longer determined in sdWeather
		
		this.type = params.type || portal_type; // Default is the weakest variation of the rift ( Note: params.type as 0 will be defaulted to 1, implement typeof check here if 0 value is needed )
		// this.type needs to be placed before hmax and hea so council portals can actually last long enough. Otherwise it disappears in a minute or so
		this.hmax = this.type === sdRift.TYPE_ELECTROMAGNETIC_ANOMALY ? 1800 * 5 : this.type === sdRift.TYPE_DIMENSIONAL_TEAR ? 5120 : 1800 * 30; // Dimensional tears are closable with normal crystals now, while everything else disappears on it's own
		this.hea = this.hmax;
		this._regen_timeout = 0;
		//this._cooldown = 0;
		this._matter_crystal_max = 20480;
		this.matter_crystal = 0; // Named differently to prevent matter absorption from entities that emit matter
		this._spawn_timer = params._spawn_timer || 30 * 60; // Either defined by spawn or 60 seconds
		this._spawn_timer_cd = this._spawn_timer; // Countdown/cooldown for spawn timer
		this._teleport_timer = this.type === sdRift.TYPE_ELECTROMAGNETIC_ANOMALY ? ( 30 * 60 * 1 ) : ( 30 * 60 * 10 ); // Time for the portal to switch location
		this._time_until_teleport = this._teleport_timer;
		this._rotate_timer = 10; // Timer for rotation sprite index
		this.frame = 0; // Rotation sprite index
		this.scale = 1; // Portal scaling when it's about to be destroyed/removed
		this.teleport_alpha = 0; // Alpha/transparency ( divided by 60 in draw code ) when portal is about to change location
		this._tear_range = 48; // It starts out weak so players have a chance to close it, then grows stronger over time

		this._consumed_guns_snapshots = [];
		//this._pull_entities = []; // For dimensional tear

		/*if ( this.type === sdRift.TYPE_CRYSTALLIZED_PORTAL )
		this.filter = 'hue-rotate(' + 75 + 'deg)';
		if ( this.type === sdRift.TYPE_CUBE_PORTAL )
		this.filter = 'none';*/

		if ( this.type !== sdRift.TYPE_COUNCIL_PORTAL && this.type !== sdRift.TYPE_ELECTROMAGNETIC_ANOMALY ) // Council portals don't count towards other portal types so they don't prevent spawning of those other portals
		sdRift.portals++;
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_consumed_guns_snapshots' );
	}
	GetFilterColor()
	{
		/*if ( this.type === sdRift.TYPE_CRYSTALLIZED_PORTAL )
		this.filter = 'hue-rotate(' + 75 + 'deg)';
		if ( this.type === sdRift.TYPE_CUBE_PORTAL )
		this.filter = 'none';*/
	
		if ( this.type === sdRift.TYPE_CRYSTALLIZED_PORTAL )
		return 'hue-rotate(' + 75 + 'deg)';
	
		if ( this.type === sdRift.TYPE_CUBE_PORTAL )
		return 'none';

		if ( this.type === sdRift.TYPE_ASTEROID_PORTAL )
		return 'hue-rotate(' + 180 + 'deg)';

		if ( this.type === sdRift.TYPE_DIMENSIONAL_TEAR )
		return 'saturate(0.1) brightness(0.4)';

		if ( this.type === sdRift.TYPE_COUNCIL_PORTAL )
		return 'brightness(2) saturate(0.1)';
	
			if ( this.type === sdRift.TYPE_ELECTROMAGNETIC_ANOMALY )
		return 'none';

	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._rotate_timer > 0 ) // Sprite animation handling
			this._rotate_timer -= GSPEED;
			else
			{
				this.frame++;
				
				if ( this.frame > 6 )
				this.frame = 0;
			
				this._rotate_timer = 10 * this.scale;
			}

			if ( this.type === sdRift.TYPE_DIMENSIONAL_TEAR ) // Black portal / Black hole attack
			{
				this._tear_range = Math.min( 192, this._tear_range + ( 4 * GSPEED / ( 30 * 60 ) ) ); // It expands range by 4 every minute? Should have max power after 32 minutes.
				// This way it can't really go away on it's own easily, but doesn't become too annoying for players from the start.
				
				/*this._pull_entities = [];
				let ents = sdWorld.GetAnythingNear( this.x, this.y, 192 );
				for ( let i = 0; i < ents.length; i++ )
				this._pull_entities.push( ents[ i ] );*/
				
				//let range = this._tear_range;

				let pull_entities = this.GetAnythingNearCache( this.x, this.y, 192 );

				//Set task for players to remove the dimensional tear
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be closed
				if ( sdWorld.sockets[ i ].character )
				{
					
					let potential_description;
					switch( 2 ) // switch ( ~~( Math.random() * 2 ) )
					{
						case 0: potential_description = 'We have a dimensional tear on the planet. Close it down before it\'s influence grows too much. Intel claims you can put enough crystals in there to close it.'; break;
						case 1: potential_description = 'Dimensional tear appeared - you need to close it by putting crystals inside it. If we wait for too long it\'s force will grow stronger.'; break;
						case 2: potential_description = 'A dimensional tear appeared on this planet. It should be closed down before it destroys large chunks of the planet. We can close it by putting crystals inside it.'; break;
					}
					// Tried multiple descriptions here - they just override each other in interface of the player - flicker so to speak, so I've just set it to old description - Booraz149
				
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'DESTROY-'+this._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: this,
						mission: sdTask.MISSION_DESTROY_ENTITY,
						difficulty: 1 * sdTask.GetTaskDifficultyScaler(),		
						title: 'Close the dimensional tear',
						description: potential_description
					});
				}

				if ( pull_entities.length > 0 )
				for ( let i = 0; i < pull_entities.length; i++ )
				{
					let e = pull_entities[ i ];
					if ( !e._is_being_removed )
					if ( sdWorld.Dist2D( e.x, e.y, this.x, this.y ) <= this._tear_range )
					{
						let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
						let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
						if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, e._is_bg_entity !== 0 ? this : e ) ) // Ignored entity has effect on which layer raycast would be happening, so as fallback it will ignore portal
						{
							let dx = ( xx - this.x );
							let dy = ( yy - this.y );

							let di = sdWorld.Dist2D_Vector( dx, dy );

							if ( di < 1 )
							continue;

							let strength_damage_scale = Math.max( 0, Math.min( 1, 1 - di / this._tear_range ) ) / 4;

							let strength = strength_damage_scale * 10 * GSPEED / di;

							let can_move = false;

							if ( typeof e.sx !== 'undefined' )
							if ( typeof e.sy !== 'undefined' )
							{
								can_move = true;

								e.sx -= dx * strength;
								e.sy -= dy * strength;
							}

							if ( e.is( sdBaseShieldingUnit ) )
							if ( e.enabled )
							{
								can_move = false;
							}

							e.PhysWakeUp();

							if ( e.is( sdCharacter ) )
							if ( !e._god )
							{
								e.stability = Math.max( -1, e.stability - strength );

								/* EG: I don't think players like this
								if ( e.gun_slot !== 9 )
								if ( sdWorld.Dist2D_Vector( e.sx, e.sy ) > 10 )
								e.DropWeapon( e.gun_slot );*/
							}

							if ( e.IsPlayerClass() )
							e.ApplyServerSidePositionAndVelocity( true, dx * strength, dy * strength );

							if ( e.is( sdBG ) )
							{
								if ( Math.random() < 0.01 )
								e.DamageWithEffect( 16 * strength_damage_scale );
							}
							else
							if ( e.is( sdGun ) )
							{
								if ( di < 20 )
								if ( !e._held_by )
								if ( !e._is_being_removed )
								{
									this._consumed_guns_snapshots.push( e.GetSnapshot( globalThis.GetFrame(), true ) );
									
									//if ( e.class === sdGun.CLASS_CRYSTAL_SHARD || e.class === sdGun.CLASS_SCORE_SHARD )
									e.remove();
								}
							}
							else
							if ( !e.is( sdCrystal ) || !e.is_anticrystal ) // Otherwise anticrystals get removed without touching the rift // EG: Not sure if we want to damage other kinds of crystals though
							if ( typeof e._hea !== 'undefined' || typeof e.hea !== 'undefined' )
							{
								//if ( e.is( sdBlock ) )

								if ( di < 20 || !can_move )
								{
									e.DamageWithEffect( 8 * strength_damage_scale );

									if ( !e._is_being_removed )
									if ( ( e._hea || e.hea ) <= 0 )
									if ( e._hitbox_x2 - e._hitbox_x1 < 32 )
									if ( e._hitbox_y2 - e._hitbox_y1 < 32 )
									{
										e.remove();

										if ( e.is( sdStorage ) )
										{
											// Make it drop crystals
										}
										else
										e._broken = false;
									}
								}
							}
						}
					}
				}
			}
			
			if ( this._spawn_timer_cd > 0 ) // Spawn entity timer
			this._spawn_timer_cd -= GSPEED;
		
			if ( this._regen_timeout > 0 && this.matter_crystal < this.hea ) // If overcharged - lose ability to regen back up
			this._regen_timeout -= GSPEED;
			else
			{
				let max_size = Math.min( 1, this._tear_range / 64 ); // If it grows to max power, it will need 15k matter to shut down
				if ( this.hea < ( this.hmax * max_size )  && this.type === sdRift.TYPE_DIMENSIONAL_TEAR ) // Only dimensional tear regenerates health when crystals are not put in it for a while
				{
					this.hea = Math.min( this.hea + GSPEED, this.hmax * max_size );
				}
			}
			if ( this._spawn_timer_cd <= 0 ) // Spawn an entity
			if ( this.CanMoveWithoutOverlap( this.x, this.y, 0 ) )
			if ( this.type !== sdRift.TYPE_DIMENSIONAL_TEAR && this.type !== sdRift.TYPE_ELECTROMAGNETIC_ANOMALY ) // Black portals / Black holes do not spawn things, aswell as the anomalies
			{
				sdSound.PlaySound({ name:'rift_spawn1', x:this.x, y:this.y, volume:2 });
				
				// Delaying to match sound
				setTimeout( ()=>
				{

					if ( this.type === sdRift.TYPE_CRYSTALLIZED_PORTAL ) // Quickies and Asps
					{
						let spawn_type = Math.random();
						if ( spawn_type < 0.333 )
						{
							if ( sdAsp.asps_tot < 25 || sdWorld.server_config.aggressive_hibernation ) // Same amount as in sdWeather
							{
								let asp = new sdAsp({ 
									x:this.x,
									y:this.y,
									_tier: 2,
									filter: 'invert(1) sepia(1) saturate(100) hue-rotate(270deg) opacity(0.45)',
									crystal_worth: 160
								});
								sdEntity.entities.push( asp );
								sdWorld.UpdateHashPosition( asp, false ); // Prevent intersection with other ones
							}
						}
						else
						if ( sdQuickie.quickies_tot < 25 || sdWorld.server_config.aggressive_hibernation )
						{
							let quickie = new sdQuickie({ 
								x:this.x,
								y:this.y,
								_tier:2
							});
							//let quickie_filter = {};
							//let quickie_filter = sdWorld.CreateSDFilter();
								//sdWorld.ReplaceColorInSDFilter_v2( quickie_filter, '#000000', '#ff00ff' ) // Pink, stronger quickies
							//quickie.sd_filter = quickie_filter;
							quickie.filter = 'invert(1) sepia(1) saturate(100) hue-rotate(270deg) opacity(0.45)';
							sdEntity.entities.push( quickie );
							sdWorld.UpdateHashPosition( quickie, false ); // Prevent intersection with other ones
						}
					}
					if ( this.type === sdRift.TYPE_CUBE_PORTAL ) // Cube portal
					{
						if ( sdCube.alive_cube_counter < sdCube.GetMaxAllowedCubesOfKind( 0 ) || sdWorld.server_config.aggressive_hibernation ) // 20
						{
							let cube = new sdCube({ 
								x:this.x,
								y:this.y,
								kind: sdCube.GetRandomKind()/*( ( sdCube.alive_huge_cube_counter < sdWorld.GetPlayingPlayersCount() ) && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.1 ) ) ?
										 1 : ( sdCube.alive_white_cube_counter < 1 && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.04 ) ) ? 
										 2 : ( sdCube.alive_pink_cube_counter < 2 && ( sdCube.alive_cube_counter >= 1 && Math.random() < 0.14 ) ) ? 3 : 0*/ // _kind = 1 -> is_huge = true , _kind = 2 -> is_white = true , _kind = 3 -> is_pink = true
							});
							cube.sy += ( 10 - ( Math.random() * 20 ) );
							cube.sx += ( 10 - ( Math.random() * 20 ) );

							sdEntity.entities.push( cube );

							if ( !cube.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
							{
								cube.remove();
							}
							else
							sdWorld.UpdateHashPosition( cube, false ); // Prevent inersection with other ones
						}
					}
					if ( this.type === sdRift.TYPE_ASTEROID_PORTAL ) // Asteroid portal, always creates asteroids which explode on impact
					{
						{
							let asteroid = new sdAsteroid({ 
								x:this.x,
								y:this.y
							});
							asteroid._type = 0;
							asteroid.sy += ( 10 - ( Math.random() * 20 ) );
							asteroid.sx += ( 10 - ( Math.random() * 20 ) );

							sdEntity.entities.push( asteroid );

							/*if ( !asteroid.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
							{
								asteroid.remove();
							}
							else
							sdWorld.UpdateHashPosition( asteroid, false ); // Prevent inersection with other ones*/
						}
					}
				}, 1223 );

				if ( this.type === sdRift.TYPE_COUNCIL_PORTAL )
				{
					let ais = 0;
					for ( var i = 0; i < sdCharacter.characters.length; i++ )
					{
						if ( sdCharacter.characters[ i ].hea > 0 )
						if ( !sdCharacter.characters[ i ]._is_being_removed )
						if ( sdCharacter.characters[ i ]._ai_team === 3 )
						{
							ais++;
							//console.log( 'AI count:' + ais );
						}
					}
					{

						let councils = 0;
						let councils_tot = 1;

						let left_side = ( Math.random() < 0.5 );

						while ( councils < councils_tot && ais < 6 )
						{

							let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

							sdEntity.entities.push( character_entity );
							character_entity.s = 110;
							{
								let x,y;
								{
									x = this.x;
									y = this.y;
									
									{
										character_entity.x = x;
										character_entity.y = y;

										sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_COUNCIL );
										sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });

										const logic = ()=>
										{
											if ( character_entity.hea <= 0 )
											if ( !character_entity._is_being_removed )
											{
												sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
												sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
												character_entity.remove();
											}


											if ( character_entity._is_being_removed )
											clearInterval( logic, 1000 );
										};
										setInterval( logic, 1000 );
	
										break;
									}
								}
							}
							councils++;
							ais++;
						}
					}
				}

				//this._spawn_timer_cd = ( this.type === sdRift.TYPE_ASTEROID_PORTAL ? 0.25 : 1 ) * this._spawn_timer * Math.max( 0.1, this.hea / this.hmax ); // Reset spawn timer countdown, depending on HP left off the portal
				this._spawn_timer_cd = ( this.type === sdRift.TYPE_COUNCIL_PORTAL ? 0.35 : this.type === sdRift.TYPE_ASTEROID_PORTAL ? 0.25 : 1 ) * this._spawn_timer * Math.max( 0.1, Math.pow( Math.random(), 0.5 ) ); // Reset spawn timer countdown, but randomly while prioritizing longer spawns to prevent farming or not feeding any crystals to portal for too long
			}
			
			if ( this.matter_crystal > 0 ) // Has the rift drained any matter?
			{
				this.hea = Math.max( this.hea - ( GSPEED * 3 ), 0 ); // Shrink
				this.matter_crystal -= GSPEED * 3;
			}
			
			if ( this.type !== sdRift.TYPE_DIMENSIONAL_TEAR ) // All but dimensional tears disappear over time
			this.hea = Math.max( this.hea - GSPEED, 0 );
		
			if ( this._time_until_teleport > 0 )
			{
				this._time_until_teleport -= GSPEED;
				this.teleport_alpha = Math.min( this.teleport_alpha + GSPEED, 60 );
			}
			else
			if ( this._time_until_teleport <= 0 )
			this.teleport_alpha = Math.max( this.teleport_alpha - GSPEED, 0 );
	
			if ( this.teleport_alpha <= 0 && this._time_until_teleport <= 0 ) // Relocate the portal
			{
				sdWeather.SetRandomSpawnLocation( this );
				/*
				let x,y,i;
				let tr = 1000;
				do
				{
					tr--;
					x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
					y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

					if ( this.CanMoveWithoutOverlap( x, y, 0 ) )
					if ( !this.CanMoveWithoutOverlap( x, y + 24, 0 ) )
					if ( sdWorld.last_hit_entity )
					if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
					if ( !sdWorld.CheckWallExistsBox( 
						x + this._hitbox_x1 - 16, 
						y + this._hitbox_y1 - 16, 
						x + this._hitbox_x2 + 16, 
						y + this._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
					{
						this.x = x;
						this.y = y;
					}
				}  while( tr > 0 );*/
				
				
				this._time_until_teleport = this._teleport_timer;
			}

			if ( this.hea <= 0 )
			{
				this.scale -= 0.0025 / GSPEED;
			}
			if ( this.scale <= 0 )
			{
				//let r = Math.random();

				if ( this.type === sdRift.TYPE_DIMENSIONAL_TEAR ) // Dimensional tears drop score, others don't since they disappear over time
				{
					let x = this.x;
					let y = this.y;
					//let sx = this.sx;
					//let sy = this.sy;

					setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

						let gun;
						gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
						gun.extra = 1;

						//gun.sx = sx;
						//gun.sy = sy;
						sdEntity.entities.push( gun );
						
						
						while ( this._consumed_guns_snapshots.length > 0 )
						{
							let snapshot = this._consumed_guns_snapshots.shift();
							try
							{
								let ent = sdEntity.GetObjectFromSnapshot( snapshot );
								ent.x = this.x;
								ent.y = this.y;
								ent.sx = 0 + Math.random() * 8 - 4;
								ent.sy = 0 + Math.random() * 8 - 4;
								ent.ttl = sdGun.disowned_guns_ttl;
								ent._held_by = null;
								sdEntity.entities.push( ent );

								sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs
							}
							catch ( e )
							{
								trace( 'Rift can\'t drop consumed weapon', snapshot );
							}
						}

					}, 500 );
				}
				this.remove();
				return;
			}
		}
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.teleport_alpha < 55 ) // Prevent crystal feeding if it's spawning or dissapearing
		return;

		if ( this.type === sdRift.TYPE_COUNCIL_PORTAL ) // No feeding for council portals
		return;

		/*if ( this.type === sdRift.TYPE_DIMENSIONAL_TEAR ) // Black portal deals damage / vacuums stuff inside
		{
			from_entity.DamageWithEffect( 0.25 );
			if ( typeof from_entity.sx !== 'undefined' )
			from_entity.sx -= ( from_entity.x - this.x ) / 40;
			if ( typeof from_entity.sy !== 'undefined' )
			from_entity.sy -= ( from_entity.y - this.y ) / 40;
		}*/
		if ( this.type === sdRift.TYPE_DIMENSIONAL_TEAR ) // Only black portals can be fed crystals now, others disappear over time
		{
			if ( from_entity.is( sdCrystal ) )
			if ( from_entity.held_by === null ) // Prevent crystals which are stored in a crate
			{
				if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
				{
					sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2 });
					this.matter_crystal = Math.min( this._matter_crystal_max, this.matter_crystal + from_entity.matter_max * ( from_entity.matter_regen / 100 ) ); // Drain the crystal for it's max value and destroy it
					this._regen_timeout = Math.max( 30 * 60, this._regen_timeout + ( from_entity.matter_max * ( from_entity.matter_regen / 100 ) * 10 ) ); // Regen depends on how much matter did it get fed with
					//this._update_version++;
					from_entity.remove();
				}
			}

			if ( from_entity.is( sdLost ) )
			{
				if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
				{
					sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2 });

					this.matter_crystal = Math.min( this._matter_crystal_max, this.matter_crystal + from_entity._matter_max ); // Lost entities are drained from it's matter capacity.
					this._regen_timeout = Math.max( 30 * 60, this._regen_timeout + ( from_entity._matter_max * 10 ) ); // Regen depends on how much matter did it get fed with
					//this._update_version++;
					from_entity.remove();
				}
			}
		}
		
		if ( this.type === sdRift.TYPE_ELECTROMAGNETIC_ANOMALY && !from_entity._is_being_removed )
		{
			if ( from_entity.is( sdJunk ) )
			{
				if ( from_entity.type === sdJunk.TYPE_ALIEN_BATTERY ) // Is it an alien battery?
				{
					sdWorld.SendEffect({ 
						x:this.x, 
						y:this.y, 
						radius:32,
						damage_scale: 0.01, // Just a decoration effect
						type:sdEffect.TYPE_EXPLOSION, 
						owner:this,
						color:'#33FFFF',
						no_smoke: true,
						shrapnel: true
					});
					from_entity.remove();
				
					this.remove();
				}
			}
			else
			if ( typeof from_entity.matter !== 'undefined' ) // Can the entity be drained of matter?
			{
				from_entity.matter = Math.max( 0, from_entity.matter - 60 );
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:32,
					damage_scale: 0.01, // Just a decoration effect
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:'#33FFFF' ,
					no_smoke: true,
					shrapnel: true
				});
				//Relocate the anomaly
				this.teleport_alpha = 0;
				this._time_until_teleport = 0;
			}
		}

		/*if ( from_entity.is( sdJunk ) )
		if ( from_entity.type === 1 ) // Is it an alien battery?
		if ( this.type !== 2 && this.type !== 4 ) // The portal is not a "cube" one?
		{
			this.type = 2;
			//this.GetFilterColor();
			this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating
			//this._update_version++;

			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius:30,
				damage_scale: 0.01, // Just a decoration effect
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this,
				color:'#33FFFF' 
			});

			from_entity.remove();
		}*/
	}
	get title()
	{
		//if ( this.matter_crystal < this.hea )
		return 'Dimensional portal';
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		let frame = this.frame;
		
		ctx.filter = this.GetFilterColor(); // this.filter;
		
		if ( !sdShop.isDrawing )
		{
			ctx.globalAlpha = this.teleport_alpha / 60;
			
			let s = 0.75 * this.scale + ( 0.25 * this.hea / this.hmax );
			
			s *= ( sdRift.scale_by_type[ this.type ] || 1 );
			
			ctx.scale( s, s );
		}
		if ( this.type !== sdRift.TYPE_ELECTROMAGNETIC_ANOMALY )
		ctx.drawImageFilterCache( sdRift.img_rift_anim, frame * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		else // Lots of alpha altering, is this performance heavy? - Booraz149
		{
			let alpha_mult = this.teleport_alpha / 60; // This fixes the fade in/out animation when teleporting
			if ( sdWorld.time % 10000 <= 5000 )
			ctx.globalAlpha = 0.45 + ( this.teleport_alpha / 60 ) * ( 0.35 * ( sdWorld.time % 5000 ) / 5000 );
			else
			ctx.globalAlpha = 0.8 - ( this.teleport_alpha / 60 ) * ( 0.35 * ( sdWorld.time % 5000 ) / 5000 );
		
			ctx.globalAlpha = ctx.globalAlpha * alpha_mult;
			ctx.drawImageFilterCache( sdRift.img_em_anomaly, 0, 0, 32, 32, - 16, - 16, 32, 32 );
			
			
			if ( sdWorld.time % 6400 <= 3200 )
			ctx.globalAlpha = ( this.teleport_alpha / 60 ) * ( 0.35 * ( sdWorld.time % 3200 ) / 3200 );
			else
			ctx.globalAlpha = 0.35 - ( ( this.teleport_alpha / 60 ) * ( 0.35 * ( sdWorld.time % 3200 ) / 3200 ) );
		
			ctx.scale( ( 0.8 * ( sdWorld.time % 6400 ) / 3200 ), ( 0.8 * ( sdWorld.time % 6400 ) / 3200 ) );
			ctx.globalAlpha = ctx.globalAlpha * alpha_mult;
			ctx.drawImageFilterCache( sdRift.img_em_anomaly, 0, 0, 32, 32, - 16, - 16, 32, 32 );
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.type !== sdRift.TYPE_ELECTROMAGNETIC_ANOMALY )
		{
			if ( this.matter_crystal < this.hea )
			sdEntity.Tooltip( ctx, "Dimensional portal", 0, 0 );
			else
			sdEntity.Tooltip( ctx, "Dimensional portal (overcharged)", 0, 0 ); // Lets players know it has enough matter to destroy itself
		}
		else
		if ( this.matter_crystal < this.hea )
		sdEntity.Tooltip( ctx, "Electromagnetic anomaly", 0, 0 );
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this.type !== sdRift.TYPE_COUNCIL_PORTAL && this.type !== sdRift.TYPE_ELECTROMAGNETIC_ANOMALY ) // Council portals don't count towards other portal types so they don't prevent spawning of those other portals
		sdRift.portals--;
		//this.onRemoveAsFakeEntity();

		if ( this._broken )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:30,
			damage_scale: 0.01, // Just a decoration effect
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this,
			color:'#FFFFFF',
			no_smoke: true,
			shrapnel: true
		});
	}
	onRemoveAsFakeEntity()
	{
	}
}
//sdRift.init_class();

export default sdRift;
