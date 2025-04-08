
/* global Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdGib from './sdGib.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdCube from './sdCube.js';
import sdBubbleShield from './sdBubbleShield.js';
class sdEnemyMech extends sdEntity
{
	static init_class()
	{
		sdEnemyMech.img_mech_idle = sdWorld.CreateImageFromFile( 'fmech2' );

		sdEnemyMech.img_mech = sdWorld.CreateImageFromFile( 'fmech2_sheet' );
		sdEnemyMech.img_glow = sdWorld.CreateImageFromFile( 'hit_glow' );

		//sdEnemyMech.img_mech_boost = sdWorld.CreateImageFromFile( 'fmech2_boost' );
		//sdEnemyMech.img_mech_broken = sdWorld.CreateImageFromFile( 'fmech2_broken' );

		sdEnemyMech.img_mech_mg = sdWorld.CreateImageFromFile( 'fmech_lmg2' );
		sdEnemyMech.img_mech_rc = sdWorld.CreateImageFromFile( 'rail_cannon' );
		
		sdEnemyMech.mechs = [];
		
		sdEnemyMech.death_duration = 30;
		sdEnemyMech.post_death_ttl = 120;
		
		sdEnemyMech.attack_range = 375;
		
		// These exist because square brackets make JavaScript create new array instances and add extra work for garbage collector - thus we make arrays just once and reuse them
		sdEnemyMech.reusable_vision_blocking_entities_array = [ this.name ];
		sdEnemyMech.reusable_vision_block_ignored_entities_array = [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ]; // Used by sdSetrDestroyer as well
		
		sdEnemyMech.current_boss = null;
		sdEnemyMech.current_boss_is_low_health = false;
		sdEnemyMech.current_boss_reusable_vision_blocking_entities_array = null;
		sdEnemyMech.current_boss_reusable_vision_block_ignored_entities_array = null;
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -14; }
	get hitbox_x2() { return 14; }
	get hitbox_y1() { return this.hea > 0 ? -38 : -26; }
	get hitbox_y2() { return 18; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._shield_ent = null; // Magic property name
		
		this._regen_timeout = 0;
		
		//this._hmax = 15000; // Was 6000 but even 12000 is easy
		this._hmax = 6000; // EG: It feels like a sponge boss unfortunately. Maybe it needs to become more complex mechanics-wise and much more rare in order to have high hitpoints. Meanwhile I'm raising his damage instead
		this.hea = this._hmax;

		this._ai_team = 5;
		this.tilt = 0;
		
		this._time_until_full_remove = 30 * 5 + Math.random() * 30 * 5; // 5-10 seconds to get removed

		//this.death_anim = 0;
		
		this._current_target = null; // Now used in case of players engaging without meeting CanAttackEnt conditions
		this._follow_target = null;
		
		//this._last_stand_on = null;
		//this._last_jump = sdWorld.time;
		//this._last_bite = sdWorld.time;
		
		this._move_dir_x = 0;
		this._move_dir_y = 0;
		this._move_dir_speed_scale = 1;
		this._move_dir_timer = 0;
		
		this._attack_timer = 0;
		this._rocket_attack_timer = 0;
		this._rail_attack_timer = 0; // Rail cannon used when the mech targets a turret to destroy it almost instantly
		//this.attack_anim = 0;
		//this._aggressive_mode = false; // Causes dodging and faster movement
		this._bullets = 75;
		this._rockets = 4;
		
		this.side = 1;
		
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		//this.matter_max = 5120; // It is much stronger than a basic worm yet it only dropped 1280 matter crystal shards
		//this.matter = this.matter_max;
		
		this._last_damage = 0; // Sound flood prevention
		
		this.lmg_an = 0; // Rotate angle for LMG firing
		
		this._last_seen_player = 0;
		this._last_patience_warning = 0;

		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
		
		sdEnemyMech.mechs.push( this );
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( character.hea > 0 )
		{
			if ( this._last_seen_player < sdWorld.time - 1000 * 60 * 5 ) // Once per 5 minutes
			sdSound.PlaySound({ name:'enemy_mech_alert', x:this.x, y:this.y, volume:2 });
		
			this._last_seen_player = sdWorld.time;
		}
	}
	
	// boss_entity is expected to have .CanAttackEnt( e ) method. Used by sdSetrDestroyer and Dreadnout too. It should be best to not copy classes if only small part of them is being changed, at least let's reuse functions. But class extension should be still better (like in sdCharacter and sdPlayerDrone case, all classes might even inherit typical sdBoss class)
	static BossLikeTargetScan( boss_entity, attack_range, reusable_vision_blocking_entities_array, reusable_vision_block_ignored_entities_array )
	{
		let is_low_health = ( ( boss_entity.hea || boss_entity._hea || 0 ) < ( boss_entity.hmax || boss_entity._hmax || 0 ) / 3 );
		
		sdEnemyMech.current_boss = boss_entity;
		sdEnemyMech.current_boss_is_low_health = is_low_health;
		sdEnemyMech.current_boss_reusable_vision_blocking_entities_array = reusable_vision_blocking_entities_array;
		sdEnemyMech.current_boss_reusable_vision_block_ignored_entities_array = reusable_vision_block_ignored_entities_array;
		
		//let targets = boss_entity.GetAnythingNearCache( boss_entity.x, boss_entity.y, attack_range, null, sdCom.com_faction_attack_classes, true, sdEnemyMech.BossLikeTargetScan_Filter );
		let targets = boss_entity.GetAnythingNearCache( boss_entity.x, boss_entity.y, attack_range, null, null, true, sdEnemyMech.BossLikeTargetScan_Filter );
		
		sdEnemyMech.current_boss = null;
		
		return targets;
	}
	static BossLikeTargetScan_Filter( e ) // Preventing dynamic function creation. Though maybe that isn't better than looking up global objects and properties
	{
		if ( sdCom.com_faction_attack_classes.indexOf( e.GetClass() ) !== -1 )
		if ( ( e.hea || e._hea || 0 ) > 0 || e.is( sdCube ) )
		{
			let boss_entity = sdEnemyMech.current_boss;
			
			if ( boss_entity.CanAttackEnt( e ) )
			{
				let is_low_health = sdEnemyMech.current_boss_is_low_health;
				let reusable_vision_blocking_entities_array = sdEnemyMech.current_boss_reusable_vision_blocking_entities_array;
				let reusable_vision_block_ignored_entities_array = sdEnemyMech.current_boss_reusable_vision_block_ignored_entities_array;

				//let line_of_sight = sdWorld.CheckLineOfSight( boss_entity.x, boss_entity.y, e.x, e.y, e, reusable_vision_blocking_entities_array, reusable_vision_block_ignored_entities_array );
				let line_of_sight = boss_entity.CheckLineOfSightAngularCache( e, reusable_vision_blocking_entities_array, reusable_vision_block_ignored_entities_array );
				let sight_blocking_entity = sdWorld.last_hit_entity;

				if ( line_of_sight )
				{
					return true;
				}
				else
				{
					if ( sight_blocking_entity && sight_blocking_entity.is( sdBlock ) && ( sight_blocking_entity.material === sdBlock.MATERIAL_TRAPSHIELD || sight_blocking_entity.material === sdBlock.MATERIAL_SHARP || sight_blocking_entity.texture_id === sdBlock.TEXTURE_ID_CAGE ) ) // Target shield blocks and trap blocks aswell
					{
						//targets.push( sight_blocking_entity );
						return true; // Should be ok to target not the shield but entity behind it?
					}
					else
					if ( is_low_health && e.is( sdCharacter ) && e._ai_team !== boss_entity._ai_team && boss_entity.CanAttackEnt( e ) ) // Highly wanted by sdEnemyMechs in this case
					{
						return true;
					}
				}
			}
		}

		return false;
	}
	
	/*GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}*/
	GetBleedEffectDamageMultiplier()
	{
		return sdEffect.TYPE_GLOW_HIT;
	}
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/
	CanAttackEnt( ent )
	{
		//if ( ent.GetClass() !== 'sdCharacter' )
		if ( !ent.is( sdCharacter ) )
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
		return this._follow_target;

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
	GetHitDamageMultiplier( x, y )
	{
		if ( this.hea > 0 )
		{
			let di_to_head = sdWorld.Dist2D( x, y, this.x + this._hitbox_x2 * this.side, this.y + this.hitbox_y1 + 15 );
			// let di_to_body = sdWorld.Dist2D( x, y, this.x, this.y );

			if ( di_to_head < 16 )
			return 3;
		}
	
		return 1;
	}
	Damage( dmg, initiator=null, headshot=false )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( initiator._is_being_removed )
		initiator = null;
	
		// Shield logic, add to other entities if they will use shields
		// Also import sdBubbleShield if it's not imported
		if ( sdBubbleShield.DidShieldProtectFromDamage( this, dmg, initiator ) )
		return;



		if ( headshot )
		this.Impulse( -dmg * this.side, 0 ); // Too large impulse caused mech to move too much into a direction

		dmg = Math.abs( dmg );
		
		let old_hp = this.hea;
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		let hurt_sound = false;
		
		if ( this.hea > 0 )
		{
			if ( Math.ceil( this.hea / this._hmax * 10 ) !== Math.ceil( old_hp / this._hmax * 10 ) )
			{
				sdSound.PlaySound({ name:'enemy_mech_hurt', x:this.x, y:this.y, volume:3, pitch: 0.7 });
				hurt_sound = true;
			}
			
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
			}
			
			//if ( this.hea <= 400 )
			//sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
		}
	
		if ( initiator )
		{
			if ( initiator.is( sdCharacter ) )
			if ( initiator._ai_team !== this._ai_team ) // Only target non-teammates
			{
				if ( initiator._my_hash && initiator.build_tool_level < 10 && !hurt_sound )
				{
					// Do not attack new players back unless they deal enough damage to Mech
					
					if ( this._last_patience_warning < sdWorld.time - 1000 * 5 ) // Once per 5 seconds
					{
						sdSound.PlaySound({ name:'enemy_mech_warning', x:this.x, y:this.y, volume:2 });

						this._last_patience_warning = sdWorld.time;
					}
				}
				else
				this._current_target = initiator;
			}

			if ( !initiator.is( sdEnemyMech ) )
			this._follow_target = initiator;
		}
		
		this._regen_timeout = Math.max( this._regen_timeout, 30 * 60 );
		
		if ( this.hea <= 0 && was_alive )
		{	
			sdSound.PlaySound({ name:'enemy_mech_death3', x:this.x, y:this.y, volume:2 });
			
			sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
			//this.death_anim = 1;
			//if ( initiator )
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_BOSS );

			sdWorld.SpawnGib( this.x - (6 * this.side ), this.y + this._hitbox_y1, this.sx + Math.random() * 1 - Math.random() * 1, this.sy + Math.random() * 1 - Math.random() * 1, this.side, sdGib.CLASS_VELOX_MECH_HEAD , this.filter, null );
			sdWorld.SpawnGib( this.x + (12 * this.side ), this.y + this._hitbox_y2 + 6, this.sx + Math.random() * 1 - Math.random() * 1, this.sy + Math.random() * 2, this.side, sdGib.CLASS_VELOX_MECH_PARTS , this.filter, null );
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
								if ( random_value > 0.88 ) // ( random value < 0.08 ) couldn't occur because if it's below 0.5 it drops BT upgrade instead 
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_FMECH_MINIGUN });
								else
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_RAIL_CANNON });
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

							//let random_value = Math.random();

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

						if ( this._attack_timer <= 3 )
						{
							if ( this.x > closest.x )
							this.side = 1;
							else
							this.side = -1;
						}

						this._move_dir_x = Math.cos( an_desired );
						this._move_dir_y = Math.sin( an_desired );
						this._move_dir_speed_scale = 10;
						
						if ( closest_di_real < sdEnemyMech.attack_range ) // close enough to dodge obstacles
						{
							let an = Math.random() * Math.PI * 2;

							this._move_dir_x = Math.cos( an );
							this._move_dir_y = Math.sin( an );
							this._move_dir_speed_scale = 1;

							if ( !sdWorld.CheckLineOfSight( this.x, this.y, closest.x, closest.y, this, sdCom.com_visibility_ignored_classes, null ) )
							{
								for ( let ideas = Math.max( 5, 40 / sdEnemyMech.mechs_counter ); ideas > 0; ideas-- )
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
					this._attack_timer = 2;

					//let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 800 );
					//let targets_raw = sdWorld.GetCharactersNear( this.x, this.y, null, null, 800 );
					
					//let array_of_enemies = sdCom.com_faction_attack_classes;
					//array_of_enemies.push( 'sdCube' ); No
					/*let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, sdEnemyMech.attack_range, null, sdCom.com_faction_attack_classes );

					let targets = [];

					for ( let i = 0; i < targets_raw.length; i++ )
					//if ( array_of_enemies.indexOf( targets_raw[ i ].GetClass() ) !== -1 ) This was already tested for in sdWorld.GetAnythingNear
					{
						if ( this.CanAttackEnt( targets_raw[ i ] ) )
						if ( sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], sdEnemyMech.reusable_vision_blocking_entities_array, sdEnemyMech.reusable_vision_block_ignored_entities_array ) )
							targets.push( targets_raw[ i ] );
						else
						if ( !sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], sdEnemyMech.reusable_vision_blocking_entities_array, sdEnemyMech.reusable_vision_block_ignored_entities_array ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.is( sdBlock ) && ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_TRAPSHIELD || sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP ) ) // Target shield blocks and trap blocks aswell
						targets.push( sdWorld.last_hit_entity );
						else
						{
							if ( this.hea < ( this._hmax / 3 ) )
							if ( targets_raw[ i ].is( sdCharacter ) && targets_raw[ i ]._ai_team !== this._ai_team && this.CanAttackEnt( targets_raw[ i ] ) ) // Highly wanted by sdEnemyMechs in this case
							{
								targets.push( targets_raw[ i ] );
							}
						}
					}

					sdWorld.shuffleArray( targets );*/
					
					let targets = sdEnemyMech.BossLikeTargetScan( this, sdEnemyMech.attack_range, sdEnemyMech.reusable_vision_blocking_entities_array, sdEnemyMech.reusable_vision_block_ignored_entities_array );
					
					for ( let i = 0; i < targets.length; i++ )
					{
						this._follow_target = targets[ i ];

						if ( this._alert_intensity < 45 )// Delay attack
						break;

						//this.attack_anim = 15;

						let an = Math.atan2( 
								targets[ i ].y + ( targets[ i ]._hitbox_y1 + targets[ i ]._hitbox_y2 ) / 2 - this.y, 
								targets[ i ].x + ( targets[ i ]._hitbox_x1 + targets[ i ]._hitbox_x2 ) / 2 - this.x 
						) + ( Math.random() * 2 - 1 ) * 0.05;

						this.lmg_an = an * 100;


						let bullet_obj = new sdBullet({ x: this.x, y: this.y });
						bullet_obj._owner = this;
						bullet_obj.sx = Math.cos( an );
						bullet_obj.sy = Math.sin( an );
						bullet_obj.x += bullet_obj.sx * 5;
						bullet_obj.y += bullet_obj.sy * 5;

						bullet_obj.sx *= 15;
						bullet_obj.sy *= 15;
						
						bullet_obj.time_left = 60;

						//bullet_obj._rail = true;

						//bullet_obj._damage = 25;
						bullet_obj._damage = 75;
						bullet_obj.color = '#ffaa00';

						sdEntity.entities.push( bullet_obj );

						this._bullets--;

						if ( this._bullets <= 0 )
						{
							this._bullets = 75;
							this._attack_timer = 30 * 4;
							this.lmg_an = Math.PI / 2 * 100;
						}

						//sdSound.PlaySound({ name:'gun_pistol', pitch: 1, x:this.x, y:this.y, volume:0.3 });
						sdSound.PlaySound({ name:'enemy_mech_attack4', x:this.x, y:this.y, volume:1, pitch: 1 });

						if ( targets[ i ].GetClass() === 'sdTurret' || targets[ i ].GetClass() === 'sdCube' || targets[ i ].GetClass() === 'sdBlock' ) // Turrets, trap/shield blocks and cubes get the special treatment
						if ( this._rail_attack_timer <= 0 )
						{
							an = Math.atan2( targets[ i ].y - ( this.y ), targets[ i ].x - this.x ); // Pinpoint accurate against turrets
							let bullet_obj = new sdBullet({ x: this.x, y: this.y });
							bullet_obj._owner = this;
							bullet_obj.sx = Math.cos( an );
							bullet_obj.sy = Math.sin( an );
							//bullet_obj.x += bullet_obj.sx * 5;
							//bullet_obj.y += bullet_obj.sy * 5;

							bullet_obj.sx *= 16;
							bullet_obj.sy *= 16;
						
							bullet_obj.time_left = 60;

							bullet_obj._rail = true;
							bullet_obj._rail_circled = true;
							
							bullet_obj._emp = true; // Disable turrets
							bullet_obj._emp_mult = 6; // 5 * 6 = 30 seconds of disabling a turret

							bullet_obj._damage = 50;
							bullet_obj.color = '#ff0000';

							sdEntity.entities.push( bullet_obj );
							this._rail_attack_timer = 10;
							sdSound.PlaySound({ name:'gun_railgun', pitch: 0.5, x:this.x, y:this.y, volume:0.5 });
						}
						break;
					}

					if ( this._rocket_attack_timer <= 0 )
					if ( this.hea < ( this._hmax / 2 ) ) // Second phase of the mech, rocket launcher can fire now
					for ( let i = 0; i < targets.length; i++ )
					{
						if ( this._alert_intensity < 45 )// Delay attack
						break;

						this._rocket_attack_timer = 6;

						let an = Math.atan2( 
								targets[ i ].y + ( targets[ i ]._hitbox_y1 + targets[ i ]._hitbox_y2 ) / 2 - this.y, 
								targets[ i ].x + ( targets[ i ]._hitbox_x1 + targets[ i ]._hitbox_x2 ) / 2 - this.x 
						) + ( Math.random() * 2 - 1 ) * 0.1;

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

						sdEntity.entities.push( bullet_obj );

						this._rockets--;

						if ( this._rockets <= 0 )
						{
							this._rockets = 4;
							this._rocket_attack_timer = 60;
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
					if ( this._rail_attack_timer > 0)
					this._rail_attack_timer -= GSPEED;

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

						let v = this.hea < this._hmax / 2 ? 0.10 : 0.045;
				
						this.sx += this._move_dir_x * this._move_dir_speed_scale * ( v ) * GSPEED;
						this.sy += this._move_dir_y * this._move_dir_speed_scale * ( v ) * GSPEED;
					}
				}
			}
		
			//if ( this.attack_anim > 0 )
			//this.attack_anim = Math.max( 0, this.attack_anim - GSPEED );
		
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
					let e = new sdEffect({ type: sdEffect.TYPE_SMOKE, x:this.x, y:this.y - 24, sx: -Math.random() + Math.random(), sy:-1 * Math.random() * 5, scale:1, radius:0.5, color:sdEffect.GetSmokeColor( sdEffect.smoke_colors ) });
					sdEntity.entities.push( e );
			}
		}
			
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	static IsTargetFriendly( ent ) // It targets players and turrets regardless
	{
	
		return false;
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Velox Flying Mech", 0, -30 );
		
		this.DrawHealthBar( ctx, undefined, 10 );
	}
	Draw( ctx, attached )
	{
	
		ctx.rotate( this.tilt / 100 );
		ctx.filter = this.filter;
		if ( this.side === 1 )
		ctx.scale( 1, 1 );
		else	
		ctx.scale( -1, 1 );

		let xx = this.hea <= 0;

		if ( this.hea > 0 )
		{
			ctx.blend_mode = THREE.AdditiveBlending;
			ctx.globalAlpha = Math.sin( ( sdWorld.time % 1000 ) / 1000 * Math.PI );

			ctx.drawImageFilterCache( sdEnemyMech.img_glow, - 16 + this.hitbox_x2, - 16 + this.hitbox_y1 + 15, 32, 32 );

			ctx.blend_mode = THREE.NormalBlending;
			ctx.globalAlpha = 1;
		}

		ctx.drawImageFilterCache( sdEnemyMech.img_mech, xx * 64, 0, 64,96, - 32, - 48, 64, 96 );

		ctx.filter = 'none';
		if ( this.side === 1 )
		{
			ctx.rotate( this.lmg_an / 100 );
			ctx.scale( 1, -1 );
		}
		else
		{
			ctx.rotate( -this.lmg_an / 100 );
			ctx.scale( -1, 1 );
		}
		ctx.drawImageFilterCache( sdEnemyMech.img_mech_mg, - 16, - 16, 32, 32 );
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_filter = null;
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		//sdEnemyMech.mechs_counter--;
		this.onRemoveAsFakeEntity();
		
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
	onRemoveAsFakeEntity()
	{
		//sdOverlord.overlord_tot--;
		
		let i = sdEnemyMech.mechs.indexOf( this );
		
		if ( i !== -1 )
		sdEnemyMech.mechs.splice( i, 1 );

	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdEnemyMech.init_class();

export default sdEnemyMech;
