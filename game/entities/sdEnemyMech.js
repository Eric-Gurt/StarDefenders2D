
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

class sdEnemyMech extends sdEntity
{
	static init_class()
	{
		sdEnemyMech.img_mech_idle = sdWorld.CreateImageFromFile( 'fmech2' );

		sdEnemyMech.img_mech = sdWorld.CreateImageFromFile( 'fmech2_sheet' );

		//sdEnemyMech.img_mech_boost = sdWorld.CreateImageFromFile( 'fmech2_boost' );
		//sdEnemyMech.img_mech_broken = sdWorld.CreateImageFromFile( 'fmech2_broken' );

		sdEnemyMech.img_mech_mg = sdWorld.CreateImageFromFile( 'fmech_lmg2' );
		sdEnemyMech.img_mech_rc = sdWorld.CreateImageFromFile( 'rail_cannon' );
		
		sdEnemyMech.mechs_counter = 0;
		
		sdEnemyMech.death_duration = 30;
		sdEnemyMech.post_death_ttl = 120;
		
		sdEnemyMech.attack_range = 375;
		
	
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
		
		this._regen_timeout = 0;
		
		this._hmax = 15000; // Was 6000 but even 12000 is too easy if you have anything in slot 7
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
		this._move_dir_timer = 0;
		
		this._attack_timer = 0;
		this._rocket_attack_timer = 0;
		this._rail_attack_timer = 0; // Rail cannon used when the mech targets a turret to destroy it almost instantly
		this.attack_anim = 0;
		//this._aggressive_mode = false; // Causes dodging and faster movement
		this._bullets = 150;
		this._rockets = 4;
		
		this.side = 1;
		
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		this.matter_max = 5120; // It is much stronger than a basic worm yet it only dropped 1280 matter crystal shards
		this.matter = this.matter_max;
		
		this._last_damage = 0; // Sound flood prevention
		
		sdEnemyMech.mechs_counter++;
		
		this.lmg_an = 0; // Rotate angle for LMG firing
		
		this._last_seen_player = 0;

		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
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
		if ( ( ent === this._current_target && ent._ai_team !== this._ai_team ) || ent.build_tool_level > 0 )
		return true;
		else
		{
			if ( ( ( ent.matter >= 800 && ent._ai_team === 0 ) && ent._ai_team !== this._ai_team ) || ( ent._ai_enabled !== sdCharacter.AI_MODEL_NONE && ent._ai_team !== this._ai_team ) )
			{
				this._current_target = ent; // Don't stop targetting if the player has below 800 matter mid fight
				return true; // Only players have mercy from mechs
			}
		}
	}
	GetRandomEntityNearby() // Scans random area on map for potential entities
	{
		if ( this._follow_target ) 
		return this._follow_target;

		let x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
		let y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );
		
		let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 256, null, [ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdTurret' , 'sdCube', 'sdDrone', 'sdCommandCentre', 'sdSetrDestroyer', 'sdOverlord', 'sdSpider' ] );
		for ( let i = 0; i < targets_raw.length; i++ )
		{
			i = Math.round( Math.random() * targets_raw.length ); // Randomize it
			return targets_raw[ i ];
		}
		return null;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( initiator._is_being_removed )
		initiator = null;
	
		if ( initiator )
		{
			if ( initiator.GetClass() === 'sdCharacter' )
			if ( initiator._ai_team === 0 ) // Only target players
			this._current_target = initiator;

			if ( initiator.GetClass() !== 'sdEnemyMech' )
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
				sdSound.PlaySound({ name:'enemy_mech_hurt', x:this.x, y:this.y, volume:3, pitch: 0.7 });
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
			sdSound.PlaySound({ name:'enemy_mech_death3', x:this.x, y:this.y, volume:2 });
			
			sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
			//this.death_anim = 1;
			//if ( initiator )
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_BOSS );

			sdWorld.SpawnGib( this.x - (6 * this.side ), this.y + this._hitbox_y1, this.sx + Math.random() * 1 - Math.random() * 1, this.sy + Math.random() * 1 - Math.random() * 1, this.side, sdGib.CLASS_VELOX_MECH_HEAD , this.filter, null )
			sdWorld.SpawnGib( this.x + (12 * this.side ), this.y + this._hitbox_y2 + 6, this.sx + Math.random() * 1 - Math.random() * 1, this.sy + Math.random() * 2, this.side, sdGib.CLASS_VELOX_MECH_PARTS , this.filter, null )
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
								if ( random_value > 0.92 ) // ( random value < 0.08 ) couldn't occur because if it's below 0.5 it drops BT upgrade instead 
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
			
			this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
			
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

						this._move_dir_x = Math.cos( an_desired ) * 10;
						this._move_dir_y = Math.sin( an_desired ) * 10;
						
						if ( closest_di_real < sdEnemyMech.attack_range ) // close enough to dodge obstacles
						{
							let an = Math.random() * Math.PI * 2;

							this._move_dir_x = Math.cos( an );
							this._move_dir_y = Math.sin( an );

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

											this._move_dir_x = Math.cos( a1 ) * 8;
											this._move_dir_y = Math.sin( a1 ) * 8;

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

													this._move_dir_x = Math.cos( a1 ) * 8;
													this._move_dir_y = Math.sin( a1 ) * 8;

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
				
				this.sx += this._move_dir_x * ( v ) * GSPEED;
				this.sy += this._move_dir_y * ( v ) * GSPEED;
				this.tilt = sdWorld.MorphWithTimeScale( this.tilt, this._move_dir_x * 2, 0.93, GSPEED );
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

					//let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 800 );
					//let targets_raw = sdWorld.GetCharactersNear( this.x, this.y, null, null, 800 );
					let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, sdEnemyMech.attack_range, null, [ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdTurret' , 'sdCube', 'sdDrone', 'sdCommandCentre', 'sdSetrDestroyer', 'sdOverlord', 'sdSpider' ] );

					let targets = [];

					for ( let i = 0; i < targets_raw.length; i++ )
					if ( ( targets_raw[ i ].GetClass() === 'sdCharacter' && targets_raw[ i ]._ai_team !== this._ai_team && targets_raw[ i ].hea > 0 && this.CanAttackEnt( targets_raw[ i ] )  ) ||
						 ( targets_raw[ i ].GetClass() === 'sdTurret' ) ||
						 ( targets_raw[ i ].GetClass() === 'sdOverlord' ) ||
						 ( targets_raw[ i ].GetClass() === 'sdSetrDestroyer' ) ||
						 ( targets_raw[ i ].GetClass() === 'sdSpider' ) ||
						 ( targets_raw[ i ].GetClass() === 'sdPlayerOverlord' ) ||
						( targets_raw[ i ].GetClass() === 'sdCommandCentre' ) ||
						 ( targets_raw[ i ].GetClass() === 'sdCube' && targets_raw[ i ].hea > 0 ) ||
						 ( targets_raw[ i ].GetClass() === 'sdCube' && this.hea < ( this._hmax / 3 ) ) ||
						 ( targets_raw[ i ].GetClass() === 'sdDrone' && targets_raw[ i ]._ai_team !== this._ai_team && targets_raw[ i ]._hea > 0 ) )
					{
						if ( sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], [ 'sdEnemyMech' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer' ] ) )
							targets.push( targets_raw[ i ] );
						else
						if ( !sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], [ 'sdEnemyMech' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer' ] ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_TRAPSHIELD || sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP ) ) // Target shield blocks and trap blocks aswell
						targets.push( sdWorld.last_hit_entity );
						else
						{
							if ( this.hea < ( this._hmax / 3 ) )
							if ( targets_raw[ i ].GetClass() === 'sdCharacter' && targets_raw[ i ]._ai_team !== this._ai_team && this.CanAttackEnt( targets_raw[ i ] ) ) // Highly wanted by sdEnemyMechs in this case
							{
								targets.push( targets_raw[ i ] );
							}
						}
					}

					sdWorld.shuffleArray( targets );

					for ( let i = 0; i < targets.length; i++ )
					{

						this._follow_target = targets[ i ];

						if ( this._alert_intensity < 45 )// Delay attack
						break;

						this.attack_anim = 15;

						let an = Math.atan2( targets[ i ].y - this.y, targets[ i ].x - this.x ) + ( Math.random() * 2 - 1 ) * 0.05;

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

						bullet_obj._damage = 20;
						bullet_obj.color = '#ffaa00';

						sdEntity.entities.push( bullet_obj );

						this._bullets--;

						if ( this._bullets <= 0 )
						{
							this._bullets = 100;
							this._attack_timer = 60;
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

						let an = Math.atan2( targets[ i ].y - ( this.y + 16 ), targets[ i ].x - this.x ) + ( Math.random() * 2 - 1 ) * 0.1;

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
							this._move_dir_x = Math.cos( an_desired ) * 10;
							this._move_dir_y = Math.sin( an_desired ) * 10;
						}

						let v = this.hea < this._hmax / 2 ? 0.10 : 0.045;
				
						this.sx += this._move_dir_x * ( v ) * GSPEED;
						this.sy += this._move_dir_y * ( v ) * GSPEED;
					}
				}
			}
		
			if ( this.attack_anim > 0 )
			this.attack_anim = Math.max( 0, this.attack_anim - GSPEED );
		
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
		sdEnemyMech.mechs_counter--;
		
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
			//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
			sdWorld.DropShards( this.x, this.y, 0, 0, 
				Math.floor( Math.max( 0, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 40
			);
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdEnemyMech.init_class();

export default sdEnemyMech;
