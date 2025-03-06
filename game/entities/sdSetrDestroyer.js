
/* global Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdCube from './sdCube.js';
import sdDrone from './sdDrone.js';
import sdGib from './sdGib.js';
import sdEnemyMech from './sdEnemyMech.js';

class sdSetrDestroyer extends sdEntity
{
	static init_class()
	{
		sdSetrDestroyer.img_destroyer = sdWorld.CreateImageFromFile( 'sdSetrDestroyer' );

		sdSetrDestroyer.img_destroyer_drone = sdWorld.CreateImageFromFile( 'setr_drone' );
		sdSetrDestroyer.img_destroyer_drone_broken = sdWorld.CreateImageFromFile( 'setr_drone_destroyed' );
		
		sdSetrDestroyer.destroyer_counter = 0;
		
		sdSetrDestroyer.death_duration = 30;
		sdSetrDestroyer.post_death_ttl = 120;
		
		sdSetrDestroyer.attack_range = 425;
		
		sdSetrDestroyer.reusable_vision_blocking_entities_array = [ this.name ];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.hea > 0 ? -44 : -22; }
	get hitbox_x2() { return this.hea > 0 ? 44 : 22; }
	get hitbox_y1() { return -24; }
	get hitbox_y2() { return 24; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._regen_timeout = 0;
		
		this._hmax = 15000;
		this.hea = this._hmax;

		this._ai_team = 7;
		this.tilt = 0;
		
		this._time_until_full_remove = 30 * 5 + Math.random() * 30 * 5; // 5-10 seconds to get removed
		
		this._current_target = null; // Now used in case of players engaging without meeting CanAttackEnt conditions
		this._follow_target = null;
		
		
		this._move_dir_x = 0; // Keep these from 0 to 1 in order to have line of sight checks not scale with speed
		this._move_dir_y = 0;
		this._move_dir_speed_scale = 1;
		
		this._move_dir_timer = 0;
		
		this._attack_timer = 0;
		this._rocket_attack_timer = 0;
		this._projectile_attack_timer = 0; // 2nd phase attack timer
		//this.attack_anim = 0;
		//this._aggressive_mode = false; // Causes dodging and faster movement
		//this._bullets = 150;
		this._rockets = 6;
		// For homing
		this.look_x = 0;
		this.look_y = 0;
		this.side = 1;
		
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		//this.matter_max = 5120; // It is much stronger than a basic worm yet it only dropped 1280 matter crystal shards
		//this.matter = this.matter_max;
		
		this._last_damage = 0; // Sound flood prevention
		
		sdSetrDestroyer.destroyer_counter++;
		
		
		this._last_seen_player = 0;

		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
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
	/*GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}*/
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/
	FireDirectionalProjectiles( diagonal = ( this.hea % 2000 < 1000 ) ? true: false ) // Fire 4 projectiles, up, left, down and right or diagonally, depends on parameter
	{
		if ( !sdWorld.is_server )
		return;

		let bullet_obj1 = new sdBullet({ x: this.x, y: this.y });
					bullet_obj1._owner = this;
					bullet_obj1.sx = -1;
					bullet_obj1.sy = diagonal ? -1 : 0;
					//bullet_obj1.x += bullet_obj1.sx * 5;
					//bullet_obj1.y += bullet_obj1.sy * 5;

					bullet_obj1.sx *= 11;
					bullet_obj1.sy *= 11;

					bullet_obj1.explosion_radius = 10; 
					bullet_obj1.model = 'ball';
					bullet_obj1._damage= 5;
					bullet_obj1.color ='#0000c8';
					bullet_obj1._dirt_mult = 1;
					bullet_obj1._no_explosion_smoke = true; 
		
					sdEntity.entities.push( bullet_obj1 );

		let bullet_obj2 = new sdBullet({ x: this.x, y: this.y });
					bullet_obj2._owner = this;
					bullet_obj2.sx = diagonal ? -1 : 0;
					bullet_obj2.sy = 1;
					//bullet_obj2.x += bullet_obj2.sx * 5;
					//bullet_obj2.y += bullet_obj2.sy * 5;

					bullet_obj2.sx *= 11;
					bullet_obj2.sy *= 11;

					bullet_obj2.explosion_radius = 10; 
					bullet_obj2.model = 'ball';
					bullet_obj2._damage= 5;
					bullet_obj2.color ='#0000c8';
					bullet_obj2._dirt_mult = 1;
					bullet_obj2._no_explosion_smoke = true; 
		
					sdEntity.entities.push( bullet_obj2 );

		let bullet_obj3 = new sdBullet({ x: this.x, y: this.y });
					bullet_obj3._owner = this;
					bullet_obj3.sx = 1;
					bullet_obj3.sy = diagonal ? -1 : 0;
					//bullet_obj3.x += bullet_obj3.sx * 5;
					//bullet_obj3.y += bullet_obj3.sy * 5;

					bullet_obj3.sx *= 11;
					bullet_obj3.sy *= 11;

					bullet_obj3.explosion_radius = 10; 
					bullet_obj3.model = 'ball';
					bullet_obj3._damage= 5;
					bullet_obj3.color ='#0000c8';
					bullet_obj3._dirt_mult = 1;
					bullet_obj3._no_explosion_smoke = true; 

					sdEntity.entities.push( bullet_obj3 );

		let bullet_obj4 = new sdBullet({ x: this.x, y: this.y });
					bullet_obj4._owner = this;
					bullet_obj4.sx = diagonal ? 1 : 0;
					bullet_obj4.sy = -1;
					//bullet_obj4.x += bullet_obj4.sx * 5;
					//bullet_obj4.y += bullet_obj4.sy * 5;

					bullet_obj4.sx *= 11;
					bullet_obj4.sy *= 11;

					bullet_obj4.explosion_radius = 10; 
					bullet_obj4.model = 'ball';
					bullet_obj4._damage= 5;
					bullet_obj4.color ='#0000c8';
					bullet_obj4._dirt_mult = 1;
					bullet_obj4._no_explosion_smoke = true; 
		
					sdEntity.entities.push( bullet_obj4 );
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
				if ( ( ( ent.build_tool_level >= 10 && ent._ai_team === 0 ) && ent._ai_team !== this._ai_team ) || ( ent._ai_enabled !== sdCharacter.AI_MODEL_NONE && ent._ai_team !== this._ai_team ) )
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
		if ( this._follow_target ) 
		return this._follow_target; // If there is already a target it follows, it should stick to it.

		/*let x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
		let y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );
		
		let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 256, null, [ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdTurret' , 'sdCube', 'sdDrone', 'sdCommandCentre', 'sdSetrDestroyer', 'sdOverlord', 'sdSpider' ] );
		for ( let i = 0; i < targets_raw.length; i++ )
		{
			i = Math.round( Math.random() * targets_raw.length ); // Randomize it
			return targets_raw[ i ];
		}*/
		
		
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
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		//if ( dmg <= 10 ) // This is unneeded since this thing gives like 20 score when destroyed
		//return;
		if ( initiator )
		{
			if ( initiator.GetClass() === 'sdCharacter' )
			if ( initiator._ai_team === 0 ) // Only target players
			this._current_target = initiator;

			if ( initiator.GetClass() !== 'sdSetrDestroyer' )
			this._follow_target = initiator;
		}

		dmg = Math.abs( dmg );
		
		let old_hp = this.hea;
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea > 0 )
		{
			if ( Math.ceil( this.hea / this._hmax * 10 ) !== Math.ceil( old_hp / this._hmax * 10 ) )
			{
				sdSound.PlaySound({ name:'enemy_mech_hurt', x:this.x, y:this.y, volume:3, pitch:2 });

				let drone = new sdDrone({ x: this.x, y: this.y, type: sdDrone.DRONE_SETR, _ai_team: this._ai_team }); // We do a little trolling

				drone.sx = ( Math.random() - Math.random() ) * 10;
				drone.sy = ( Math.random() - Math.random() ) * 10;

				// Make sure drone has any speed when deployed so drones don't get stuck into each other
				if ( Math.abs( drone.sx ) < 0.5 )
				drone.sx *= 10;
				if ( Math.abs( drone.sy ) < 0.5 )
				drone.sy *= 10;

				drone._ignore_collisions_with = this; // Make sure it can pass through the destroyer 

				sdEntity.entities.push( drone );

				//sdSound.PlaySound({ name:'gun_spark', x:this.x, y:this.y, volume:1.25, pitch:0.1 });
			}
			
			
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
			}
			
			//if ( this.hea <= 400 )
			//sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
		}
		
		this._regen_timeout = Math.max( this._regen_timeout, 30 * 60 );
		
		if ( this.hea <= 0 && was_alive )
		{	
			sdSound.PlaySound({ name:'enemy_mech_death3', x:this.x, y:this.y, volume:2 , pitch:2 });
			
			sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
			//this.death_anim = 1;
			
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_BOSS );

			sdWorld.SpawnGib( this.x - 30, this.y + 11, this.sx  - Math.random() * 1, this.sy + Math.random() * 1 , this.side, sdGib.CLASS_SETR_DESTROYER_PARTS , null, null, 100, this, 0 );
			sdWorld.SpawnGib( this.x - 30, this.y - 11, this.sx  - Math.random() * 1, this.sy - Math.random() * 1 , this.side, sdGib.CLASS_SETR_DESTROYER_PARTS , null, null, 100, this, 1 );
			sdWorld.SpawnGib( this.x + 30, this.y + 11, this.sx  + Math.random() * 1, this.sy + Math.random() * 1 , this.side, sdGib.CLASS_SETR_DESTROYER_PARTS , null, null, 100, this, 2 );
			sdWorld.SpawnGib( this.x + 30, this.y - 11, this.sx  + Math.random() * 1, this.sy - Math.random() * 1 , this.side, sdGib.CLASS_SETR_DESTROYER_PARTS , null, null, 100, this, 3 );
		
			let that = this;
			for ( var i = 0; i < 20; i++ )
			{
				let an = Math.random() * Math.PI * 2;
				let d = ( i === 0 ) ? 0 : Math.random() * 20;
				let r = ( i === 0 ) ? 50 : ( 10 + Math.random() * 20 );

				setTimeout( ()=>
				{
					if ( !that._is_being_removed || i === 0 )
					{
						var a = Math.random() * 2 * Math.PI;
						var s = Math.random() * 10;

						var k = 1;

						var x = that.x + that._hitbox_x1 + Math.random() * ( that._hitbox_x2 - that._hitbox_x1 );
						var y = that.y + that._hitbox_y1 + Math.random() * ( that._hitbox_y2 - that._hitbox_y1 );

						that.sx -= Math.sin( an ) * d * r * 0.005;
						that.sy -= Math.cos( an ) * d * r * 0.005;

						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: that.sx*k + Math.sin(a)*s, sy: that.sy*k + Math.cos(a)*s });
						sdWorld.SendEffect({ 
							x: that.x + Math.sin( an ) * d, 
							y: that.y + Math.cos( an ) * d, 
							radius: r, 
							damage_scale: 1, 
							type: sdEffect.TYPE_EXPLOSION,
							owner: that,
							can_hit_owner: true,
							color: sdEffect.default_explosion_color 
						});
					}
				}, i * 150 );
			}
		}
			
		//if ( this.hea < -this._hmax / 80 * 100 )
		//this.remove();
	}
	
	get mass() { return 400; }
	Impulse( x, y )
	{
		this.sx += x / ( this.mass );
		this.sy += y / ( this.mass );
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.hea <= 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;
			this.tilt = sdWorld.MorphWithTimeScale( this.tilt, 0, 0.93, GSPEED );
			if ( sdWorld.is_server )
			{
				if ( this.hea <= 0 )
				this._time_until_full_remove -= GSPEED;

				if ( this._time_until_full_remove <= 0 )
				{
					let r = Math.random();
					let shards = 2 + Math.round( Math.random() * 3);
			
					if ( r < 0.35 )
					{
						let x = this.x;
						let y = this.y;
						let sx = this.sx;
						let sy = this.sy;

						setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

							let random_value = Math.random();

							let gun;

							//if ( random_value < 0.45 )
							//gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
							//else
							{
								if ( random_value > 0.80 )
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_SETR_ROCKET });
								else
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_SETR_PLASMA_SHOTGUN });
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
			
			//this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
			
			if ( sdWorld.is_server )
			{
				if ( !this._follow_target || this._follow_target._is_being_removed )
				{
					this._follow_target = null;
				
					//this._follow_target = this.GetRandomEntityNearby();
				}

				if ( this._regen_timeout <= 0 )
				if ( this.hea < this._hmax ) 
				this.hea += GSPEED; // Give them health regen if not taking damage over min
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
						this._follow_target = this.GetRandomEntityNearby();
						if ( this._follow_target )
						target = this._follow_target;
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
							
								//if ( sdEnemyMech.IsTargetFriendly( sdEntity.entities[ i ] ) )
								//di += 1000;
							
								if ( di < closest_di )
								{
									closest_di = di;
									closest_di_real = di_real;
									closest = target;
									this._follow_target = target;
								}
							}
						}
					}

					if ( closest )
					{
						// Get closer
						let an_desired = Math.atan2( closest.y - this.y, closest.x - this.x ) - 0.5 + Math.random();

						if ( this.x > closest.x )
						this.side = 1;
						else
						this.side = -1;

						this._move_dir_x = Math.cos( an_desired );
						this._move_dir_y = Math.sin( an_desired );
						this._move_dir_speed_scale = 10;
						
						if ( closest_di_real < sdSetrDestroyer.attack_range ) // close enough to dodge obstacles
						{
							let an = Math.random() * Math.PI * 2;

							this._move_dir_x = Math.cos( an );
							this._move_dir_y = Math.sin( an );
							this._move_dir_speed_scale = 1;

							if ( !sdWorld.CheckLineOfSight( this.x, this.y, closest.x, closest.y, this, sdCom.com_visibility_ignored_classes, null ) )
							{
								for ( let ideas = Math.max( 5, 40 / sdSetrDestroyer.destroyer_counter ); ideas > 0; ideas-- )
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

											//sdWorld.SendEffect({ x:this.x + Math.cos( a1 ) * r1, y:this.y + Math.sin( a1 ) * r1, type:sdEffect.TYPE_WALL_HIT });
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
							else
							{

								//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });
							
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
				this.tilt = sdWorld.MorphWithTimeScale( this.tilt, this._move_dir_x * this._move_dir_speed_scale * 2, 0.93, GSPEED );
			}
			else
			{
				this._move_dir_timer = 0;
				this.sy += 0.1 * GSPEED;
			}
			
			if ( sdWorld.is_server )
			{
				if ( this._attack_timer <= 0 )
				{
					this._attack_timer = 3;
					if ( this._projectile_attack_timer <= 0 )
					{
						if ( this.hea < ( this._hmax / 2 ) )
						{
							this.FireDirectionalProjectiles();
							this._projectile_attack_timer = 4.5;
						}
					}
					//let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 800 );
					//let targets_raw = sdWorld.GetCharactersNear( this.x, this.y, null, null, 800 );
					/*let array_of_enemies = sdCom.com_faction_attack_classes;
					array_of_enemies.push( 'sdCube' ); No
					let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, sdSetrDestroyer.attack_range, null, array_of_enemies );

					let targets = [];

					for ( let i = 0; i < targets_raw.length; i++ )
					if ( array_of_enemies.indexOf( targets_raw[ i ].GetClass() ) !== -1 )
					{
						if ( this.CanAttackEnt( targets_raw[ i ] ) )
						if ( sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], [ 'sdSetrDestroyer' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) )
							targets.push( targets_raw[ i ] );
						else
						if ( !sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], [ 'sdSetrDestroyer' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_TRAPSHIELD || sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP ) ) // Target shield blocks and trap blocks aswell
						targets.push( sdWorld.last_hit_entity );
						else
						{
							if ( this.hea < ( this._hmax / 3 ) )
							if ( targets_raw[ i ].GetClass() === 'sdCharacter' && targets_raw[ i ]._ai_team !== this._ai_team && this.CanAttackEnt( targets_raw[ i ] ) ) // Highly wanted by sdSetrDestroyers in this case
							{
								targets.push( targets_raw[ i ] );
							}
						}
					}

					sdWorld.shuffleArray( targets );*/
					
					let targets = sdEnemyMech.BossLikeTargetScan( this, sdSetrDestroyer.attack_range, sdSetrDestroyer.reusable_vision_blocking_entities_array, sdEnemyMech.reusable_vision_block_ignored_entities_array );

					if ( this._rocket_attack_timer <= 0 )
					//if ( this.hea < ( this._hmax / 2 ) ) // Second phase of the mech, rocket launcher can fire now
					for ( let i = 0; i < targets.length; i++ )
					{
						this._follow_target = targets[ i ];


						if ( this._alert_intensity < 45 )// Delay attack
						break;

						this._rocket_attack_timer = 6;

						
						
						let dx = ( targets[ i ].sx || 0 );
						let dy = ( targets[ i ].sy || 0 );

						//let an = Math.atan2( targets[ i ].y - this.y - dy * 3, targets[ i ].x - this.x  - dx * 3 ) + ( Math.random() * 2 - 1 ) * 0.1;
						
						let an = Math.atan2( 
								targets[ i ].y + ( targets[ i ]._hitbox_y1 + targets[ i ]._hitbox_y2 ) / 2 - this.y - dy * 3, 
								targets[ i ].x + ( targets[ i ]._hitbox_x1 + targets[ i ]._hitbox_x2 ) / 2 - this.x - dx * 3 
						) + ( Math.random() * 2 - 1 ) * 0.1;

						this.look_x = targets[ i ].x + ( targets[ i ]._hitbox_x1 + targets[ i ]._hitbox_x2 ) / 2 + ( dx * 3 );
						this.look_y = targets[ i ].y + ( targets[ i ]._hitbox_y1 + targets[ i ]._hitbox_y2 ) / 2 + ( dy * 3 ); // Homing coordinates are updated only when firing so players can still dodge them
						let bullet_obj = new sdBullet({ x: this.x, y: this.y });
						bullet_obj._owner = this;
						bullet_obj.sx = Math.cos( an );
						bullet_obj.sy = Math.sin( an );
						//bullet_obj.x += bullet_obj.sx * 5;
						//bullet_obj.y += bullet_obj.sy * 5;

						bullet_obj.sx *= 15;
						bullet_obj.sy *= 15;
					
						bullet_obj.model = 'rocket_proj';

						bullet_obj._damage = 10 * 2;
						bullet_obj.explosion_radius = 10 * 1.5;
						bullet_obj.color = '#7acaff';
						bullet_obj._homing = true;
						bullet_obj._homing_mult = 0.04;
						bullet_obj.ac = 0.12;

						sdEntity.entities.push( bullet_obj );

						this._rockets--;

						if ( this._rockets <= 0 )
						{
							this._rockets = 6;
							this._rocket_attack_timer = 30;
						}

						//sdSound.PlaySound({ name:'gun_rocket', x:this.x, y:this.y, volume:1, pitch:0.5 });
						sdSound.PlaySound({ name:'enemy_mech_attack4', x:this.x, y:this.y, volume:2, pitch: 0.2 });

						break;
					}

					if ( targets.length === 0 ) // lower seek rate when no targets around
					this._attack_timer = 25 + Math.random() * 10;
					else
					{
						if ( this._alert_intensity === 0 )
						{
							this._alert_intensity = 0.0001;
							//sdSound.PlaySound({ name:'cube_alert2', pitch: 1, x:this.x, y:this.y, volume:1 });
						}
					}
				}
				else
				{
					this._attack_timer -= GSPEED;
					if ( this._rocket_attack_timer > 0)
					this._rocket_attack_timer -= GSPEED;
					if ( this._projectile_attack_timer > 0)
					this._projectile_attack_timer -= GSPEED;

					//if ( this.hea < this._hmax / 2 )
					{
						let an_desired;
						if ( this._move_dir_timer <= 0 )
						if ( !this._follow_target )
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

		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( this.hea < this._hmax / 5 )
			{
					let e = new sdEffect({ type: sdEffect.TYPE_SMOKE, x:this.x, y:this.y, sx: -Math.random() + Math.random(), sy:-1 * Math.random() * 5, scale:1, radius:0.5, color:sdEffect.GetSmokeColor( sdEffect.smoke_colors ) });
					sdEntity.entities.push( e );
			}
		}
			
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	static IsTargetFriendly( ent ) // It targets players and turrets regardless
	{
	
		return false;
	}
	
	get title()
	{
		return 'Setr Destroyer';
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, this.title, 0, -30 );
		
		this.DrawHealthBar( ctx, undefined, 10 );
	}
	Draw( ctx, attached )
	{
	
		ctx.rotate( this.tilt / 100 );
		let xx = this.hea <= 0;
		ctx.drawImageFilterCache( sdSetrDestroyer.img_destroyer, xx * 96, 0, 96, 64, - 48, - 32, 96, 64);

		ctx.filter = 'none';
		ctx.globalAlpha = 1;
		ctx.sd_filter = null;
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdSetrDestroyer.destroyer_counter--;
		
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
			//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
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
//sdSetrDestroyer.init_class();

export default sdSetrDestroyer;
