
/* global Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdCrystal from './sdCrystal.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdCube from './sdCube.js';
import sdDrone from './sdDrone.js';
import sdGib from './sdGib.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';

class sdStalker extends sdEntity
{
	static init_class()
	{
		sdStalker.img_stalker = sdWorld.CreateImageFromFile( 'sdStalker' );
		
		sdStalker.img_light = sdWorld.CreateImageFromFile( 'lens_flare' );
		
		sdStalker.stalker_counter = 0;
		
		sdStalker.attack_range = 425;
		sdStalker.seek_range = 750;
		
		sdStalker.reusable_vision_blocking_entities_array = [ this.name ];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -44 }
	get hitbox_x2() { return 44 }
	get hitbox_y1() { return -19; }
	get hitbox_y2() { return 19; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( observer_character )
		{
			let px = Math.max( observer_character.x + observer_character._hitbox_x1, Math.min( this.x, observer_character.x + observer_character._hitbox_x2 ) );
			let py = Math.max( observer_character.y + observer_character._hitbox_y1, Math.min( this.y, observer_character.y + observer_character._hitbox_y2 ) );

			if ( sdWorld.Dist2D( px, py, this.x, this.y ) < 192 && sdWorld.CheckLineOfSight( observer_character.x, observer_character.y, this.x, this.y, this, sdCom.com_visibility_ignored_classes, null ) )
			return true;
		}
		
		return ( this.alpha > 0 );
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._regen_timeout = 0;
		
		this._hmax = 10000;
		this.hea = this._hmax;

		this.tilt = 0;
		this._light_an = 0 // Client-sided
		
		this.look_x = this.x;
		this.look_y = this.y;
		
		this._time_until_full_remove = 1;
		
		this._current_target = null; // Now used in case of players engaging without meeting CanAttackEnt conditions
		
		this._move_dir_x = 0; // Keep these from 0 to 1 in order to have line of sight checks not scale with speed
		this._move_dir_y = 0;
		this._move_dir_speed_scale = 1;
		
		this._move_dir_timer = 0;
		
		this._attack_timer = 0;
		this._laser_timer = 0;
		this._bfg_timer = 0;
		this._possession_attack_timer = 500;
		this._charged = false;
		
		this._ai_team = 11;
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		this._last_damage = 0; // Sound flood prevention
		
		this.alpha = 100;

		sdStalker.stalker_counter++;
		
		this._last_seen_player = 0;
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( character.hea > 0 )
		{
			if ( this._last_seen_player < sdWorld.time - 1000 * 60 * 5 ) // Once per 5 minutes
			sdSound.PlaySound({ name:'enemy_mech_alert', x:this.x, y:this.y, volume:1.5, pitch:2 });
		
			this._last_seen_player = sdWorld.time;
		}
	}
	PossessClone( entity, count, drone )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( entity._is_being_removed )
		return;
	
		if ( entity.GetClass() !== 'sdCharacter' )
		return;
	
		if ( entity._ai_team === this._ai_team ) // Don't make clones of clones
		return;

		for ( let i = 0; i < count; i++ )
		{
			let character_entity = new sdCharacter({ x:this.x, y:this.y + 16, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
			sdEntity.entities.push( character_entity );
		
			character_entity.hea = 1000;
			character_entity.hmax = 1000;
		
			character_entity.title = entity.title;
			character_entity.helmet = entity.helmet;
			character_entity.body = entity.body;
			character_entity.legs = entity.legs;
			character_entity._voice = {
				wordgap: 0,
				pitch: 25,
				speed: 100,
				variant: 'clone',
				voice: 'en'
			};
			character_entity.sd_filter = entity.sd_filter;
		
			character_entity._ai_team = 11;
			character_entity._ai_level = 10;
			character_entity._ai_stay_near_entity = this;
			character_entity._ai_stay_distance = 256;
		
			character_entity._matter_regeneration = 20; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity.matter = 600;
			character_entity.matter_max = 600; // Let player leech matter off the bodies
			character_entity.s = entity.s;
			
			character_entity._chat_color = '#ff0000';
	
			let x,y;
			let tr = 100;
			do
			{
				x = this.x + 256 - ( Math.random() * 256 );
				if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
				x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

				if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
				x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );

				y = this.y + 256 - ( Math.random() * ( 256 ) );
				if ( y < sdWorld.world_bounds.y1 + 32 )
				y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

				if ( y > sdWorld.world_bounds.y2 - 32 )
				y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns
			
				if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
				if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, character_entity, sdCom.com_visibility_ignored_classes, null ) )
				//if ( sdBaseShieldingUnit.IsMobSpawnAllowed( x, y ) )
				{
					character_entity.x = x;
					character_entity.y = y;
					sdSound.PlaySound({ name:'teleport', x:x, y:y, volume:1 });
					
					sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT });
					
					sdCrystal.Zap( this, character_entity, '#00FFFF' );
					sdCrystal.Zap( character_entity, this, '#00FFFF' );
					
					sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_GLOW_HIT, color:'#00ffff', scale:2, radius:5 });
					
					character_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS }); // Permanent
					
					let gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_STALKER_RIFLE });
					sdEntity.entities.push( gun );
					
					gun.fire_mode = Math.random() > 0.5 ? 1 : 2;
					
					setTimeout(()=> {
						if ( !character_entity._is_being_removed )
						{
							sdSound.PlaySound({ name:'council_teleport', x:character_entity.x, y:character_entity.y }); // We desperately need more sound effects
							sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT });
							
							for( let i = 0; i < character_entity._inventory.length; i++ ) // Prevent loot from being stolen and disappearing
							{
								let item = character_entity._inventory[ i ];

								if ( i !== character_entity.gun_slot )
								character_entity.DropWeapon( i );
							}
							
							character_entity.remove();
							character_entity._broken = false;
						}	
					}, 1000 * 20 );
					
					if ( drone )
					{
						let bullet_obj = new sdBullet({ x: this.x, y: this.y });
					
						bullet_obj._homing = true;
						bullet_obj._homing_mult = 0.1;
						bullet_obj.ac = 0.03;
						bullet_obj._bouncy = true;
						bullet_obj._owner = this;
						bullet_obj._for_ai_target = character_entity;

						bullet_obj._damage = 1;
						bullet_obj.explosion_radius = 20;
						bullet_obj.model = 'stalker_target';
						bullet_obj.color = sdEffect.default_explosion_color;
						bullet_obj.time_left = Number.MAX_SAFE_INTEGER;
						bullet_obj._hea = 100;

						sdEntity.entities.push( bullet_obj )
					}
					break;
				}

				tr--;
				if ( tr < 0 )
				{
					character_entity.remove();
					character_entity._broken = false;
					break;
				}
			} while( true );
		}
	}
	Boost( x, y, speed )
	{
		let an = ( Math.atan2( x - this.x, y - this.y ) )
		
		this.sx = Math.sin ( an ) * speed;
		this.sy = Math.cos ( an ) * speed;
	}
	CanAttackEnt( ent )
	{
		if ( ent.GetClass() !== 'sdCharacter' )
		{
			if ( typeof ent._ai_team !== 'undefined' ) // Does a potential target belong to a faction?
			{
				if ( ent._ai_team !== this._ai_team && ( ( ent._hea || ent.hea || -1 ) > 0 ) ) // Is this not a friendly faction? And is this close enough? (And is it alive?)
				return true; // Target it
			}
			else
			return true; // Target it
		}
		else
		{
			if ( ( ent === this._current_target && ent._ai_team !== this._ai_team ) || ent.build_tool_level >= 10  )
			return true;
			else
			{
				if ( ( ( ent.build_tool_level >= 15 && ent._ai_team === 0 ) && ent._ai_team !== this._ai_team ) || ( ent._ai_enabled !== sdCharacter.AI_MODEL_NONE && ent._ai_team !== this._ai_team ) )
				{
					this._current_target = ent; // Don't stop targetting if the player has below 800 matter mid fight
					return true; // Only players have mercy from mechs
				}
			}
		}
		
		return false;
	}

	GetRandomEntityNearby() // Scans random area on map for potential entities
	{
		if ( this._current_target ) 
		return this._current_target; // If there is already a target it follows, it should stick to it.
		
		let e = sdEntity.GetRandomEntity();
		
		if ( e )
		if ( sdCom.com_faction_attack_classes.indexOf( e.GetClass() ) !== -1 )
		if ( e.IsVisible( this ) )
		if ( e.IsTargetable( this ) )
		{
			return e;
		}
		
		return null;
	}
	GetRandomTarget()
	{
		let ent = sdEntity.GetRandomActiveEntity();
		let array_of_enemies = sdCom.com_faction_attack_classes;
		if ( ent )
		if ( array_of_enemies.indexOf( ent.GetClass() ) !== -1 ) // If line of sight check found a potential target class inside that array
			{
				if ( typeof ent._ai_team !== 'undefined' ) // Does a potential target belong to a faction?
				{
					if ( ent._ai_team !== this._ai_team && ( sdWorld.Dist2D( this.x, this.y, ent.x, ent.y ) < sdStalker.attack_range ) )
					return ent; // Target it
				}
				else
				return ent; // Target it
			}
		return null;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		if ( initiator )
		{
			
			if ( initiator._ai_team !== this._ai_team ) // Only target players
			this._current_target = initiator;

			if ( initiator.GetClass() !== 'sdStalker' )
			{
				if ( initiator.GetClass() === 'sdCharacter' )
				if ( initiator._ai_team !== this._ai_team )
				this._current_target = initiator;
			}
		}
		dmg = Math.abs( dmg );
		
		let old_hp = this.hea;
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea > 0 )
		{
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
			}
			if ( this.hea < this._hmax / 3 )
			{
				this.Boost ( this.look_x, this.look_y, 7 )
				// Needs sound effect
			}
		}
		
		this._regen_timeout = Math.max( this._regen_timeout, 30 * 10 ); // Looks familiar?
		
		if ( this.hea <= 0 && was_alive )
		{	
			sdSound.PlaySound({ name:'enemy_mech_death3', x:this.x, y:this.y, volume:2 , pitch:2 });
			
			sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
			
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_BOSS );
			sdWorld.SendEffect({ 
				x: this.x,
				y: this.y,
				radius: 70, 
				damage_scale: 1, 
				type: sdEffect.TYPE_EXPLOSION,
				owner: this,
				can_hit_owner: true,
				color: '#00FFFF',
				no_smoke: true,
				shrapnel: true
			});
			sdWorld.SendEffect({ type: sdEffect.TYPE_LENS_FLARE, x:this.x, y:this.y, sx:0, sy:0, scale:2, radius:25, color:'#00FFFF' });
		}
		
		this.alpha = Math.max( this.alpha, 50 );
	}
	
	get mass() { return 300; }
	Impulse( x, y )
	{
		this.sx += x / ( this.mass );
		this.sy += y / ( this.mass );
	}

	onThink( GSPEED ) // Class-specific, if needed
	{		
		if ( this.hea <= 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;

			if ( sdWorld.is_server )
			{
				if ( this.hea <= 0 )
				this._time_until_full_remove -= GSPEED;

				if ( this._time_until_full_remove <= 0 )
				{
					let r = Math.random();
					let shards = 2 + Math.round( Math.random() * 3 );
			
					if ( r < 0.45 )
					{
						let x = this.x;
						let y = this.y;
						let sx = this.sx;
						let sy = this.sy;

						setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

							let random_value = Math.random();

							let gun;

							{
								if ( random_value > 0.80 )
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_STALKER_CANNON });
								else
								gun = new sdGun({ x:x, y:y, class:Math.random() > 0.5 ? sdGun.CLASS_STALKER_BEAM : sdGun.CLASS_STALKER_CLONER });
							}

							gun.sx = sx;
							gun.sy = sy;
							sdEntity.entities.push( gun );

						}, 500 );
					}
					while ( shards > 0 )
					{
						let x = this.x;
						let y = this.y;
						let sx = this.sx;
						let sy = this.sy;

						setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

							let random_value = Math.random();

							let gun;

							gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_METAL_SHARD });

							gun.sx = sx + Math.random() - Math.random();
							gun.sy = sy + Math.random() - Math.random();
							sdEntity.entities.push( gun );

						}, 500 );
						shards--;
					}
					this.remove();
					return;
				}
			}
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.88, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.88, GSPEED );
			
			if ( sdWorld.is_server )
			{
				if ( !this._current_target || this._current_target._is_being_removed )
				{
					this._current_target = null;
					this._current_target = this.GetRandomEntityNearby();
				}
				
				if ( this._current_target )
				{
					this.look_x = sdWorld.MorphWithTimeScale( this.look_x, this._current_target.x + ( ( this._current_target._hitbox_x1 + this._current_target._hitbox_x2 ) / 2 ), 0.95, GSPEED * 2 );
					this.look_y = sdWorld.MorphWithTimeScale( this.look_y, this._current_target.y + ( ( this._current_target._hitbox_y1 + this._current_target._hitbox_y2 ) / 2 ), 0.98, GSPEED * 2 );
					let an = Math.atan2( this.look_y - this.y, Math.abs( this.look_x - this.x ));
					this.tilt = an * 100;
				}
				else
				{
					this._current_target = this.GetRandomEntityNearby();
				}
				if ( !this._current_target ) // Still no target?
				{
					this._current_target =  this.GetRandomTarget();
				}
				
				if ( sdWorld.time > this._last_damage + 1000 * 10 ) // 10 Seconds to go invisible after damage, if damaged enough
				this.alpha = Math.max( this.alpha - GSPEED * 3, 0 );
				else
				if ( this.hea <= this._hmax * 0.9 ) // Remove cloak
				this.alpha = Math.min( this.alpha + GSPEED * 3, 100 ); 
				else
				this.alpha = Math.max( this.alpha - GSPEED * 3, 0 );

				if ( this._regen_timeout <= 0 )
				if ( this.hea < this._hmax ) 
				this.hea += GSPEED * 10; // Give them health regen if not taking damage over min
			
				if ( this._regen_timeout > 0 )
				this._regen_timeout -= GSPEED;
			
				if ( this._move_dir_timer <= 0 )
				{
					this._move_dir_timer = 5;

					let closest = null;
					
					let closest_di = Infinity;
					let closest_di_real = Infinity;

					{
						let target;
						this._current_target = this.GetRandomEntityNearby();
						
						if ( this._current_target )
						target = this._current_target;
						if ( target )
						{
							let has_hp = false; // Is the potential target alive?
							if ( typeof target._hea !== 'undefined' )
							if ( target._hea > 0 )
							has_hp = true;

							if ( typeof target.hea !== 'undefined' )
							if ( target.hea > 0 )
							has_hp = true;

							if ( has_hp )
							{
								let di = sdWorld.Dist2D( this.x, this.y, target.x, target.y );
								let di_real = di;
							
								if ( di < closest_di )
								{
									closest_di = di;
									closest_di_real = di_real;
									closest = target;
									this._current_target = target;
								}
							}
						}
					}

					if ( closest )
					{
						// Get closer
						let an_desired = Math.atan2( closest.y - this.y, closest.x - this.x ) - 0.5 + Math.random();

						this._move_dir_x = Math.cos( an_desired );
						this._move_dir_y = Math.sin( an_desired );
						this._move_dir_speed_scale = 10;
						
						if ( closest_di_real < sdStalker.seek_range ) // close enough to dodge obstacles
						{
							let an = Math.random() * Math.PI * 2;

							this._move_dir_x = Math.cos( an );
							this._move_dir_y = Math.sin( an );
							this._move_dir_speed_scale = 1;

							if ( !sdWorld.CheckLineOfSight( this.x, this.y, closest.x, closest.y, this, sdCom.com_visibility_ignored_classes, null ) )
							{
								for ( let ideas = Math.max( 5, 40 / sdStalker.stalker_counter ); ideas > 0; ideas-- )
								{
									var a1 = Math.random() * Math.PI * 2;
									var r1 = Math.random() * 200;

									var a2 = Math.random() * Math.PI * 2;
									var r2 = Math.random() * 200;

									if ( sdWorld.CheckLineOfSight( this.x, this.y, this.x + Math.cos( a1 ) * r1, this.y + Math.sin( a1 ) * r1, this, sdCom.com_visibility_ignored_classes, null ) )
									{
										if ( sdWorld.CheckLineOfSight( closest.x, closest.y, this.x + Math.cos( a1 ) * r1, this.y + Math.sin( a1 ) * r1, this, sdCom.com_visibility_ignored_classes, null ) )
										{
											// Can attack from position 1

											this._move_dir_x = Math.cos( a1 );
											this._move_dir_y = Math.sin( a1 );
											this._move_dir_speed_scale = 8;

											this._move_dir_timer = r1 * 5;

											break;
										}
										else
										{
											if ( sdWorld.CheckLineOfSight( this.x + Math.cos( a1 ) * r1, 
																		   this.y + Math.sin( a1 ) * r1, 
																		   this.x + Math.cos( a1 ) * r1 + Math.cos( a2 ) * r2, 
																		   this.y + Math.sin( a1 ) * r1 + Math.sin( a2 ) * r2, this, sdCom.com_visibility_ignored_classes, null ) )
											{
												if ( sdWorld.CheckLineOfSight( closest.x, closest.y, 
																			   this.x + Math.cos( a1 ) * r1 + Math.cos( a2 ) * r2, 
																			   this.y + Math.sin( a1 ) * r1 + Math.sin( a2 ) * r2, this, sdCom.com_visibility_ignored_classes, null ) )
												{
													// Can attack from position 2, but will move to position 1 still

													this._move_dir_x = Math.cos( a1 );
													this._move_dir_y = Math.sin( a1 );
													this._move_dir_speed_scale = 8;

													this._move_dir_timer = r1 * 5;
													
													break;
												}
											}
										}
									}
								}
							}
						}
					}
					else
					{
						let an = Math.random() * Math.PI * 2;

						this._move_dir_x = Math.cos( an );
						this._move_dir_y = Math.sin( an );
						this._move_dir_speed_scale = 1;
					}
				}
				else
				this._move_dir_timer -= GSPEED;
			}
		
			let v = 0.05;
				
			if ( 
					this.y > sdWorld.world_bounds.y1 + 200 &&
					sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_x * 50, this.y + this._move_dir_y * 50, this, sdCom.com_visibility_ignored_classes, null ) &&  // Can move forward
				( 
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_x * 200, this.y + this._move_dir_y * 200, this, sdCom.com_visibility_ignored_classes, null ) || // something is in front in distance
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x - this._move_dir_x * 100, this.y - this._move_dir_y * 100, this, sdCom.com_visibility_ignored_classes, null ) || // allow retreat from wall behind
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x - this._move_dir_y * 100, this.y + this._move_dir_x * 100, this, sdCom.com_visibility_ignored_classes, null ) || // side
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_y * 100, this.y - this._move_dir_x * 100, this, sdCom.com_visibility_ignored_classes, null ) // side
				   ) )
			{
				
				this.sx += this._move_dir_x * this._move_dir_speed_scale * ( v ) * GSPEED;
				this.sy += this._move_dir_y * this._move_dir_speed_scale * ( v ) * GSPEED;
			}
			else
			{
				this._move_dir_timer = 0;
				this.sy += 0.1 * GSPEED;
			}
			
			if ( sdWorld.is_server && this.IsVisible() )
			{
				let targets = [];
				if ( this._current_target )
				targets.push( this._current_target )
			
				if ( this._attack_timer <= 0 )
				{
					this._attack_timer = 3;
					if ( this._possession_attack_timer <= 0 )
					{
						// if ( this._current_target && !this._current_target._is_being_removed )
						// this.PossessClone( this._current_target, 1 );
					
						let nears = sdWorld.GetAnythingNear( this.x, this.y, 386 );
						let count = 3;
						for ( let i = 0; i < nears.length; i++ )
						{
							let e = nears[ i ];
							if ( !e._is_being_removed )
							{
								if ( e.GetClass() === 'sdCharacter' && count > 0 )
								{
									this.PossessClone( e, 1 + Math.round( Math.random() ), Math.random() > 0.5 );
									count--;
								}
							}
						}
						this._possession_attack_timer = 500;
					}

					if ( this._laser_timer <= 0 )
					for ( let i = 0; i < targets.length; i++ )
					{
						if ( !this._charged )
						this._current_target = targets[ i ];
					
						if ( sdWorld.Dist2D( this.x, this.y, targets[ i ].x, targets[ i ].y ) > sdStalker.attack_range )
						break;

						if ( this._alert_intensity < 45 )// Delay attack
						break;

						this._laser_timer = 1;
						let dx = ( targets[ i ].sx || 0 );
						let dy = ( targets[ i ].sy || 0 );
						
						let an = Math.atan2( 
							targets[ i ].y + ( targets[ i ]._hitbox_y1 + targets[ i ]._hitbox_y2 ) / 2 - this.y - dy * 3, 
							targets[ i ].x + ( targets[ i ]._hitbox_x1 + targets[ i ]._hitbox_x2 ) / 2 - this.x - dx * 3 
						)
						setTimeout( ()=> {
							let bullet_obj = new sdBullet({ x: this.x, y: this.y });
							bullet_obj._owner = this;
							bullet_obj.sx = Math.cos( an );
							bullet_obj.sy = Math.sin( an );

							bullet_obj.sx *= 15;
							bullet_obj.sy *= 15;

							bullet_obj._damage = 15;
							bullet_obj.color = '#00FFFF';
							bullet_obj._rail = true;
							bullet_obj._rail_alt = true;
						
							bullet_obj._custom_target_reaction = ( bullet, target_entity )=>
							{
								if ( target_entity.IsPlayerClass() )
								{
									target_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, ttl: 15 * 20 });
								}
							}
						
							sdEntity.entities.push( bullet_obj );
						
							//sdSound.PlaySound({ name:'alien_laser1', x:this.x, y:this.y, volume:2, pitch: 0.2 });
						}, 200 )

						break;
					}
					
					if ( this._bfg_timer <= 0 && !this._charged )
					{
						this._bfg_timer = 50 
						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:this.x, y:this.y, volume: 1.5, pitch: 0.75 });
						this._charged = true;
					}
					
					if ( this._bfg_timer <= 0 && this._charged )
					for ( let i = 0; i < targets.length; i++ )
					{
						//this._current_target = targets[ i ]; // Don't change target if its charging
						
						if ( sdWorld.Dist2D( this.x, this.y, targets[ i ].x, targets[ i ].y ) > sdStalker.attack_range )
						break;
					
						if ( this._alert_intensity < 45 ) // Delay attack
						break;

						this._bfg_timer = 50;
						this._charged = false;
						
						let an = Math.atan2( this.look_y - this.y, this.look_x - this.x )

						let bullet_obj = new sdBullet({ x: this.x, y: this.y });
						bullet_obj._owner = this;
						bullet_obj.sx = Math.cos( an );
						bullet_obj.sy = Math.sin( an );

						bullet_obj.sx *= 20;
						bullet_obj.sy *= 20;
						
						bullet_obj.x += bullet_obj.sx * 1.5;
						bullet_obj.y += bullet_obj.sy * 1.5;

						bullet_obj._damage = 700;
						bullet_obj.color = '#FF0000';
						bullet_obj.model = 'ball_large'
						
						bullet_obj._custom_detonation_logic = ( bullet )=>
						{
							if ( bullet._owner )
							{
								sdWorld.SendEffect({ 
									x:bullet.x, 
									y:bullet.y, 
									radius:48,
									damage_scale: 5,
									type:sdEffect.TYPE_EXPLOSION, 
									owner:bullet._owner,
									color:'#FF0000',
									shrapnel: true
								});

								let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 48 );

								for ( let i = 0; i < nears.length; i++ )
								{
									if ( nears[ i ].IsPlayerClass() )
									{
										nears[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, ttl: 15 * 20 });
									}
								}
							}
						} 

						sdEntity.entities.push( bullet_obj );
						
						sdSound.PlaySound({ name:'alien_laser1', x:this.x, y:this.y, volume:1, pitch: 0.2 });
						
						break;
					}

					if ( targets.length === 0 ) // lower seek rate when no targets around
					this._attack_timer = 25 + Math.random() * 10;
					else
					{
						if ( this._alert_intensity === 0 )
						{
							this._alert_intensity = 0.001;
						}
					}
				}
				else
				{
					this._attack_timer -= GSPEED;
					
					if ( this._laser_timer > 0 )
					this._laser_timer -= GSPEED;
				
					if ( this._possession_attack_timer > 0 )
					this._possession_attack_timer -= GSPEED;
				
					if ( this._bfg_timer > 0 )
					this._bfg_timer -= GSPEED;
				
					if ( this._laser_timer > 0 )
					{
						let an_desired;
						if ( this._move_dir_timer <= 0 )
						if ( !this._current_target )
						{
							an_desired = Math.random() * Math.PI * 2;
							this._move_dir_x = Math.cos( an_desired );
							this._move_dir_y = Math.sin( an_desired );
							this._move_dir_speed_scale = 10;
						}

						let v = 0.035;
				
						this.sx += this._move_dir_x * this._move_dir_speed_scale * ( v ) * GSPEED;
						this.sy += this._move_dir_y * this._move_dir_speed_scale * ( v ) * GSPEED;
					}
				}
			}
			this.PhysWakeUp();
		}
		
		if ( this._alert_intensity > 0 )
		if ( this._alert_intensity < 45 )
		{
			this._alert_intensity += GSPEED;
		}
			
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}

	static IsTargetFriendly( ent ) // It targets players and turrets regardless
	{
		return false;
	}
	get title()
	{
		return 'Stalker';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.alpha > 0 )
		{
			sdEntity.Tooltip( ctx, this.title, 0, -16 );
		
			this.DrawHealthBar( ctx, undefined, 10 );
		}
	}
	Draw( ctx, attached )
	{
		let side =  ( this.look_x > this.x ) ? 1 : -1;
		ctx.scale( side, 1 );

		ctx.rotate( this.tilt / 100 );
		let xx = this.hea <= this._hmax / 3;

		ctx.globalAlpha = this.alpha / 100;
		ctx.drawImageFilterCache( sdStalker.img_stalker, xx * 96, 0, 96, 48, - 48, - 24, 96, 48);
		
		if ( this.hea > 0 )
		{	
	
			ctx.blend_mode = THREE.AdditiveBlending;
			ctx.globalAlpha = Math.sin( ( sdWorld.time % 1000 ) / 1000 * Math.PI );
			
			if ( this.hea < this._hmax / 3 )
			{
				ctx.sd_color_mult_r = 1;
				ctx.sd_color_mult_g = 0;
				ctx.sd_color_mult_b = 0;
			}
			else
			ctx.sd_color_mult_r = 0;
		
			ctx.apply_shading = false;
			ctx.drawImageFilterCache( sdStalker.img_light, -14, -32, 64, 64 );

			ctx.blend_mode = THREE.NormalBlending;
			ctx.sd_color_mult_r = 1;
			ctx.sd_color_mult_g = 1;
			ctx.sd_color_mult_b = 1;
			ctx.globalAlpha = 1;
			
		}
	}
	onRemove() // Class-specific, if needed
	{
		sdStalker.stalker_counter--;
		
		if ( this._broken )
		{
			//sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
			sdWorld.DropShards( this.x, this.y, 0, 0, 
				Math.floor( Math.max( 0, 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				5120 / 40
			);
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdStalker.init_class();

export default sdStalker;
