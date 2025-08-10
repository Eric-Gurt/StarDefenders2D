
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
import sdJunk from './sdJunk.js';
import sdEnemyMech from './sdEnemyMech.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdStatusEffect from './sdStatusEffect.js';

class sdCouncilIncinerator extends sdEntity
{
	static init_class()
	{
		sdCouncilIncinerator.img_incinerator = sdWorld.CreateImageFromFile( 'sdCouncilIncinerator' );

		
		sdCouncilIncinerator.incinerator_counter = 0;
		
		sdCouncilIncinerator.death_duration = 30;
		sdCouncilIncinerator.post_death_ttl = 120;
		
		sdCouncilIncinerator.attack_range = 425;
		
		sdCouncilIncinerator.reusable_vision_blocking_entities_array = [ this.name ];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -23; }
	get hitbox_x2() { return 23; }
	get hitbox_y1() { return -23; }
	get hitbox_y2() { return 23; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._regen_timeout = 0;
		
		this._hmax = 18000;
		this.hea = this._hmax;

		this._ai_team = 3;
		this.tilt = 0;
		
		
		this.left_attack_anim = 0; // Left "turret" attack visual
		this.right_attack_anim = 0; // Right "turret" attack visual
		this.incinerator_attack_anim = 0; // Incinerate attack visual
		
		this._time_until_full_remove = 30 * 5 + Math.random() * 30 * 5; // 5-10 seconds to get removed
		
		this._current_target = null; // Now used in case of players engaging without meeting CanAttackEnt conditions
		this._follow_target = null;
		
		
		this._move_dir_x = 0; // Keep these from 0 to 1 in order to have line of sight checks not scale with speed
		this._move_dir_y = 0;
		this._move_dir_speed_scale = 1;
		
		this._move_dir_timer = 0;
		
		this._attack_timer = 0; // For target scan
		
		this._left_attack_timer = 0;
		this._right_attack_timer = 0;
		this._incinerate_attack_timer = 30 * 30;
		this._next_drone_spawn = 90; // Drones will stay near the incinerator and repair it
		this._current_minions_count = 0; // Minion counter
		
		//this.attack_anim = 0;
		//this._aggressive_mode = false; // Causes dodging and faster movement
		//this._bullets = 150;
		// For homing

		
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		//this.matter_max = 5120; // It is much stronger than a basic worm yet it only dropped 1280 matter crystal shards
		//this.matter = this.matter_max;
		
		this._last_damage = 0; // Sound flood prevention
		
		sdCouncilIncinerator.incinerator_counter++;
		
		
		this._last_seen_player = 0;
		

		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( character.hea > 0 )
		{
			if ( this._last_seen_player < sdWorld.time - 1000 * 60 * 5 ) // Once per 5 minutes
			sdSound.PlaySound({ name:'enemy_mech_alert', x:this.x, y:this.y, volume:1.5, pitch:4 });
		
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
			if ( ( ent === this._current_target && ent._ai_team !== this._ai_team ) || ent.build_tool_level >= 15  )
			return true;
			else
			{
				if ( ( ( ent.build_tool_level >= 15 && ent._ai_team === 0 ) && ent._ai_team !== this._ai_team ) || ( ent._ai_enabled !== sdCharacter.AI_MODEL_NONE && ent._ai_team !== this._ai_team ) )
				{
					this._current_target = ent;
					return true; // Only players have mercy from incinerators
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
		
		let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 256, null, [ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdTurret' , 'sdCube', 'sdDrone', 'sdCommandCentre', 'sdCouncilIncinerator', 'sdOverlord', 'sdSpider' ] );
		for ( let i = 0; i < targets_raw.length; i++ )
		{
			i = Math.round( Math.random() * targets_raw.length ); // Randomize it
			return targets_raw[ i ];
		}*/
		
		
		let e = sdEntity.GetRandomEntity();
		
		if ( e )
		if ( sdCom.com_faction_attack_classes.indexOf( e.GetClass() ) !== -1 || e.is( sdBaseShieldingUnit ) ) // It should also attack bases
		if ( e.IsVisible( this ) )
		if ( e.IsTargetable( this ) )
		{
			return e;
		}
		
		return null;
	}
	IsEnemy( target )
	{
		// Trying to stop it from destroying whole ground within the area
		if ( target.is( sdBlock ) )
		{
			if ( !target._natural )
			{
				return true;
			}
			
			// Allow attacking dirt in between target and this boss
			if ( this._current_target )
			if ( this._current_target.IsPlayerClass() )
			{
				if ( sdWorld.inDist2D_Boolean( ( this.x + this._current_target.x ) / 2, ( this.y + this._current_target.y ) / 2, target.x+target.width/2, target.y+target.height/2, sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) / 2 ) )
				{
					return true;
				}
			}
		}
		
		if ( target.GetClass() !== 'sdCharacter' && target.GetClass() !== 'sdDrone' &&
			 target.GetClass() !== 'sdJunk' && target.GetClass() !== 'sdSandWorm' &&
			 target.GetClass() !== 'sdCouncilMachine' && target.GetClass() !== 'sdCouncilIncinerator' )
		return true;
		else
		{
			if ( target.GetClass() === 'sdCharacter' || target.GetClass() === 'sdDrone' )
			if ( target._ai_team !== this._ai_team )
			return true;
			if ( target.GetClass() === 'sdSandWorm' )
			{				// TODO : add AI team to council worm without breaking regular worms
				if ( target.kind !== 3 ) // This should do it?
				return true;
			}
		
			if ( target.GetClass() === 'sdJunk' )
			if ( target.type !== sdJunk.TYPE_COUNCIL_BOMB )
			return true;
		}
		
		return false;
	}
	IncinerationAttack(){
		let attack_entities = sdWorld.GetAnythingNear( this.x, this.y, 192 );
	
		if ( attack_entities.length > 0 )
		for ( let i = 0; i < attack_entities.length; i++ )
		{
			let e = attack_entities[ i ];
			if ( !e._is_being_removed )
			{
				if ( e.IsTargetable( this ) && this.IsEnemy( e ) ) // Don't set other council stuff on fire
				{
					{
						let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
						let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
						if ( !sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, this ) )
						{
							if ( sdWorld.last_hit_entity )
							{
								if ( e === sdWorld.last_hit_entity ) 
								{
									let temp = 300;
									
									if ( typeof e.hea !== 'undefined' )
									temp = e.hea * 25; // Scale temperature with health
									if ( typeof e._hea !== 'undefined' )
									temp = e._hea * 25; // Scale temperature with health
								
									e.DamageWithEffect( 10, this );
									e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t:temp, initiator: this }); // Set enemy on fire
									sdWorld.SendEffect({ x:this.x, y:this.y, x2:e.x, y2:e.y , type:sdEffect.TYPE_BEAM, color:'#ff0000' });
									//this.incinerator_attack_anim = 30;
								}
							}
						}
					}
				}
			}
		}
		
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius: 16, 
			damage_scale: 0,
			type:sdEffect.TYPE_EXPLOSION,
			armor_penetration_level: 0,
			owner:this,
			color:'#ff0000'
		});
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

			if ( initiator.GetClass() !== 'sdCouncilIncinerator' )
			this._follow_target = initiator;
		}

		dmg = Math.abs( dmg );
		
		if ( this.incinerator_attack_anim > 0 )
		dmg = dmg * 2; // 2x damage recieved while in ignition phase
		
		let old_hp = this.hea;
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea > 0 )
		{
			/*if ( Math.ceil( this.hea / this._hmax * 10 ) !== Math.ceil( old_hp / this._hmax * 10 ) )
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
			}*/
			
			
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:Math.min( 1, dmg / 200 ) });
			}
			
			//if ( this.hea <= 400 )
			//sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
		}
		
		this._regen_timeout = Math.max( this._regen_timeout, 30 * 60 );
		
		if ( this.hea <= 0 && was_alive )
		{	
			//sdSound.PlaySound({ name:'enemy_mech_death3', x:this.x, y:this.y, volume:2 , pitch:2 });
			
			sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
			//this.death_anim = 1;
			
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_BOSS );
		
			let that = this;
			for ( var i = 0; i < 3; i++ )
			{
				let an = Math.random() * Math.PI * 2;
				let d = ( i === 0 ) ? 0 : Math.random() * 3;
				let r = ( i === 0 ) ? 30 : ( 5 + Math.random() * 3 );

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
	
	get mass() { return 200; }
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
			this.tilt += ( this.sx / 3 ) * GSPEED;
			if ( sdWorld.is_server )
			{
				if ( this.hea <= 0 )
				this._time_until_full_remove -= GSPEED;

				if ( this._time_until_full_remove <= 0 )
				{
					let r = Math.random();
					let shards = 2 + Math.round( Math.random() * 3 );
			
					if ( r < 0.1 ) // 10% chance
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
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_COUNCIL_IMMOLATOR });
							}

							gun.sx = sx;
							gun.sy = sy;
							sdEntity.entities.push( gun );

						}, 500 );
					}
					r = Math.random(); // Reroll RNG
					if ( r < 0.03 ) // 3% chance to drop Exalted core
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
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_EXALTED_CORE });
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
				
				if ( this._next_drone_spawn > 0 )
				this._next_drone_spawn -= GSPEED;
				else
				if ( this._current_minions_count < 3 )
				{	
					this._next_drone_spawn = 450 + ( Math.random() * 150 ); // 15 - 20 seconds
					
					let drone_type = ( this.hea <= this._hmax / 2 ) ? sdDrone.DRONE_COUNCIL : sdDrone.DRONE_COUNCIL_ATTACK; // If it has enough health, spawn attack drones, else spawn healers
					
					let drone = new sdDrone({ x: this.x - 96 + ( Math.random() * 192 ), y: this.y - 96 + ( Math.random() * 192 ), type: drone_type, _ai_team: this._ai_team, minion_of: this }); // We do a little trolling
					sdEntity.entities.push( drone );

					// Make sure drone has any speed when deployed so drones don't get stuck into each other
					if ( Math.abs( drone.sx ) < 0.5 )
					drone.sx *= -0.1;
					if ( Math.abs( drone.sy ) < 0.5 )
					drone.sy *= 0.1;

					//drone._ignore_collisions_with = this; // Make sure it can pass through the immolator


					if ( drone.CanMoveWithoutOverlap( drone.x, drone.y, 0 ) && sdWorld.CheckLineOfSight( this.x, this.y, drone.x, drone.y, this, sdCom.com_visibility_ignored_classes, null ) )
					{
						sdSound.PlaySound({ name:'teleport', x:drone.x, y:drone.y, volume:0.5 });
						sdWorld.SendEffect({ x:drone.x, y:drone.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(170deg)' });

						sdWorld.UpdateHashPosition( drone, false );
						//this._current_minions_count++; // Bad - increase minion count from sdDrone instead
						if ( drone.type === sdDrone.DRONE_COUNCIL )
						drone.SetTarget( this ); // Make sure drones stay near the immolator
					}
					else
					{
						drone.remove(); // Otherwise they get stuck in walls or spawn through walls
						drone._broken = false;
					}
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


						this._move_dir_x = Math.cos( an_desired );
						this._move_dir_y = Math.sin( an_desired );
						this._move_dir_speed_scale = ( this.hea < this._hmax / 2 ) ? 10 : 5;
						
						if ( closest_di_real < sdCouncilIncinerator.attack_range ) // close enough to dodge obstacles
						{
							let an = Math.random() * Math.PI * 2;

							this._move_dir_x = Math.cos( an );
							this._move_dir_y = Math.sin( an );
							this._move_dir_speed_scale =  ( this.hea < this._hmax / 2 ) ? 1 : 0.5;

							if ( !sdWorld.CheckLineOfSight( this.x, this.y, closest.x, closest.y, this, sdCom.com_visibility_ignored_classes, null ) )
							{
								for ( let ideas = Math.max( 5, 40 / sdCouncilIncinerator.incinerator_counter ); ideas > 0; ideas-- )
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
											this._move_dir_speed_scale =  ( this.hea < this._hmax / 2 ) ? 8 : 4;

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
													this._move_dir_speed_scale =  ( this.hea < this._hmax / 2 ) ? 8 : 4;

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
						this._move_dir_speed_scale =  ( this.hea < this._hmax / 2 ) ? 1 : 0.5;
					}
				}
				else
				this._move_dir_timer -= GSPEED;
			}
		
			let v = 0.05;
			if ( this.incinerator_attack_anim > 0 ) // Slow down the entity during incinerator attack
			v *= ( this.incinerator_attack_anim / 90 );
				
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
			
			if ( sdWorld.is_server )
			{
				
				this.tilt += GSPEED;
				
				if ( this._incinerate_attack_timer <= 0 )
				{
					this.incinerator_attack_anim = 150; // 5 seconds allows some damage to be dealt vs the incinerator
					this._incinerate_attack_timer = 30 * 30; // 30 seconds
					sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, volume:2, pitch:2 });
				}
				else
				this._incinerate_attack_timer -= GSPEED;
			
				if ( this.incinerator_attack_anim > 0 )
				{
					this.incinerator_attack_anim = Math.max( 0, this.incinerator_attack_anim - GSPEED );
					if ( this.incinerator_attack_anim <= 30 && ( ( Math.round( this.incinerator_attack_anim % 10 ) === 1 ) ) ) // Should happen 3 times, at 21, 11 and 1
					this.IncinerationAttack();
				}
				else
				if ( this.incinerator_attack_anim > 0 )
				this.incinerator_attack_anim -= GSPEED;
			
				// Move around
				{
					let an_desired;
					if ( this._move_dir_timer <= 0 )
					//if ( !this._follow_target )
					{
						an_desired = Math.random() * Math.PI * 2;
						this._move_dir_x = Math.cos( an_desired );
						this._move_dir_y = Math.sin( an_desired );
						this._move_dir_speed_scale =  ( this.hea < this._hmax / 2 ) ? 4 : 2;
						
						this._move_dir_timer = 10 + ( Math.random() * 20 );
					}

					let v = 0.1;
					
					if ( this.incinerator_attack_anim > 0 ) // Slow down the entity during incinerator attack
					v *= ( this.incinerator_attack_anim / 150 );
				
					this.sx += this._move_dir_x * this._move_dir_speed_scale * ( v ) * GSPEED;
					this.sy += this._move_dir_y * this._move_dir_speed_scale * ( v ) * GSPEED;
				}
			
				
				if ( this.tilt > 3600 )
				this.tilt -= 3600;
				if ( this._attack_timer <= 0 )
				{
					this._attack_timer = 3;

				

					//sdWorld.shuffleArray( targets );
					
					let targets = sdEnemyMech.BossLikeTargetScan( this, sdCouncilIncinerator.attack_range, sdCouncilIncinerator.reusable_vision_blocking_entities_array, sdEnemyMech.reusable_vision_block_ignored_entities_array );

					sdWorld.shuffleArray( targets );
					
					if ( this._left_attack_timer <= 0 )
					for ( let i = 0; i < targets.length; i++ )
					{
						this._follow_target = targets[ i ];


						if ( this._alert_intensity < 25 )// Delay attack
						break;

						if ( sdWorld.CheckLineOfSight( this.x - 20, this.y, targets[ i ].x, targets[ i ].y, sdCouncilIncinerator.reusable_vision_blocking_entities_array, sdEnemyMech.reusable_vision_block_ignored_entities_array ) ) // Can attack from left side?
						{

							this._left_attack_timer = 10;
						
							this.left_attack_anim = 6;

						
						
							let dx = ( targets[ i ].sx || 0 );
							let dy = ( targets[ i ].sy || 0 );

							let an = Math.atan2( targets[ i ].y - this.y - dy * 3, targets[ i ].x - ( this.x - 20 )  - dx * 3 );

							let bullet_obj = new sdBullet({ x: this.x - 20, y: this.y });
							bullet_obj._owner = this;
							bullet_obj.sx = Math.cos( an );
							bullet_obj.sy = Math.sin( an );
							//bullet_obj.x += bullet_obj.sx * 5;
							//bullet_obj.y += bullet_obj.sy * 5;

							bullet_obj.sx *= 24;
							bullet_obj.sy *= 24;
					

							bullet_obj._damage = 30;
							bullet_obj.color = 'ffff00';

							sdEntity.entities.push( bullet_obj );


							//sdSound.PlaySound({ name:'gun_rocket', x:this.x, y:this.y, volume:1, pitch:0.5 });
							sdSound.PlaySound({ name:'cube_attack', x:this.x, y:this.y, volume:1, pitch: 1.5 });

							break;
						}
					}
					
					if ( this._right_attack_timer <= 0 )
					for ( let i = 0; i < targets.length; i++ )
					{
						this._follow_target = targets[ i ];


						if ( this._alert_intensity < 25 )// Delay attack
						break;
						
						if ( sdWorld.CheckLineOfSight( this.x + 20, this.y, targets[ i ].x, targets[ i ].y, sdCouncilIncinerator.reusable_vision_blocking_entities_array, sdEnemyMech.reusable_vision_block_ignored_entities_array ) ) // Can attack from right side?
						{

							this._right_attack_timer = 10;
						
							this.right_attack_anim = 6;

						
						
							let dx = ( targets[ i ].sx || 0 );
							let dy = ( targets[ i ].sy || 0 );

							let an = Math.atan2( targets[ i ].y - this.y - dy * 3, targets[ i ].x - ( this.x + 20 )  - dx * 3 );

							let bullet_obj = new sdBullet({ x: this.x + 20, y: this.y });
							bullet_obj._owner = this;
							bullet_obj.sx = Math.cos( an );
							bullet_obj.sy = Math.sin( an );
							//bullet_obj.x += bullet_obj.sx * 5;
							//bullet_obj.y += bullet_obj.sy * 5;

							bullet_obj.sx *= 24;
							bullet_obj.sy *= 24;
					

							bullet_obj._damage = 30;
							bullet_obj.color = 'ffff00';

							sdEntity.entities.push( bullet_obj );


							//sdSound.PlaySound({ name:'gun_rocket', x:this.x, y:this.y, volume:1, pitch:0.5 });
							sdSound.PlaySound({ name:'cube_attack', x:this.x, y:this.y, volume:1, pitch: 1.5 });

							break;
						}
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
					this._left_attack_timer -= GSPEED;
					this.left_attack_anim -= GSPEED;
					
					this._right_attack_timer -= GSPEED;
					this.right_attack_anim -= GSPEED;
					//if ( this.hea < this._hmax / 2 )
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
		return 'Council Incinerator';
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, this.title, 0, -30 );
		
		this.DrawHealthBar( ctx, undefined, 10 );
	}
	Draw( ctx, attached )
	{
	
		let xx = this.hea > 0 ? 4 : 6;
		ctx.rotate( this.tilt / 100 );
		ctx.drawImageFilterCache( sdCouncilIncinerator.img_incinerator, xx * 48, 0, 48, 48, - 24, - 24, 48, 48);
		
		ctx.rotate( - this.tilt / 100 );
		xx = this.hea > 0 ? 0 : 5;
		ctx.drawImageFilterCache( sdCouncilIncinerator.img_incinerator, xx * 48, 0, 48, 48, - 24, - 24, 48, 48 );
		
		if ( this.hea > 0 )
		{
			if ( this.left_attack_anim > 0 )
			{
				xx = 1;
				ctx.drawImageFilterCache( sdCouncilIncinerator.img_incinerator, xx * 48, 0, 48, 48, - 24, - 24, 48, 48 );
			}
	
			if ( this.right_attack_anim > 0 )
			{
				xx = 2;
				ctx.drawImageFilterCache( sdCouncilIncinerator.img_incinerator, xx * 48, 0, 48, 48, - 24, - 24, 48, 48 );
			}
		
			if ( this.incinerator_attack_anim > 0 )
			{
				xx = 3;
				ctx.drawImageFilterCache( sdCouncilIncinerator.img_incinerator, xx * 48, 0, 48, 48, - 24, - 24, 48, 48 );
			}
		}

		
		
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
		sdCouncilIncinerator.incinerator_counter--;
		
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
//sdCouncilIncinerator.init_class();

export default sdCouncilIncinerator;
