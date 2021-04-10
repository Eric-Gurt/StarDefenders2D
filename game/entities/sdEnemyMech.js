
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';

class sdEnemyMech extends sdEntity
{
	static init_class()
	{
		sdEnemyMech.img_mech_idle = sdWorld.CreateImageFromFile( 'fmech' );
		sdEnemyMech.img_mech_boost = sdWorld.CreateImageFromFile( 'fmech_boost' );
		sdEnemyMech.img_mech_broken = sdWorld.CreateImageFromFile( 'fmech_broken' );
		
		sdEnemyMech.mechs_counter = 0;
		
		sdEnemyMech.death_duration = 30;
		sdEnemyMech.post_death_ttl = 120;
		
		sdEnemyMech.attack_range = 375;
		
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -18; }
	get hitbox_x2() { return 18; }
	get hitbox_y1() { return -24; }
	get hitbox_y2() { return 28; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.regen_timeout = 0;
		
		this._hmax = 6000;
		this.hea = this._hmax;

		this.tilt = 0;
		
		//this.death_anim = 0;
		
		//this._current_target = null;
		
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
		this._bullets = 100;
		this._rockets = 4;
		
		this.side = 1;
		
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		this.matter_max = 1280;
		this.matter = this.matter_max;
		
		sdEnemyMech.mechs_counter++;
		
		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( character.hea > 0 )
		{
			
		}
	}*/
	/*GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}*/
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea > 0 )
		{
			sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
			if ( this.hea <= 400 )
			sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
		}
		
		//this.regen_timeout = Math.max( this.regen_timeout, 60 );
		
		if ( this.hea <= 0 && was_alive )
		{	sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			{
				initiator._score += 50;
			}
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

							var x = that.x + that.hitbox_x1 + Math.random() * ( that.hitbox_x2 - that.hitbox_x1 );
							var y = that.y + that.hitbox_y1 + Math.random() * ( that.hitbox_y2 - that.hitbox_y1 );
							
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
		
		if ( this.hea < -2500 ) // It gets destroyed halfway through explosion
		{
			let r = Math.random();
			
			if ( r < 0.25 )
			{
				let x = this.x;
				let y = this.y;
				let sx = this.sx;
				let sy = this.sy;

				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let random_value = Math.random();

					let gun;

					if ( random_value < 0.35 )
					{
						/*
						if ( random_value < 0.25 )
						gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_RAIL_CANNON });
						else
						*/
						gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
					}
					else
					gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_RAIL_CANNON });

					gun.sx = sx;
					gun.sy = sy;
					sdEntity.entities.push( gun );
				
				}, 500 );
			}
			this.remove();
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
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.hea <= 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;
			this.tilt = sdWorld.MorphWithTimeScale( this.tilt, 0, 0.93, GSPEED );
		
/*
			if ( this.death_anim < sdEnemyMech.death_duration + sdEnemyMech.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
			
*/
			this.MatterGlow( 0.01, 30, GSPEED );
			/*var x = this.x;
			var y = this.y;
			for ( var xx = -1; xx <= 1; xx++ )
			for ( var yy = -1; yy <= 1; yy++ )
			{
				var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
				for ( var i = 0; i < arr.length; i++ )
				if ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' )
				if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 30 ) >= 0 )
				if ( arr[ i ] !== this )
				{
					this.TransferMatter( arr[ i ], 0.01, GSPEED );
				}
			}*/
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.88, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.88, GSPEED );
			
			this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
			
			if ( sdWorld.is_server )
			{
				if ( this._move_dir_timer <= 0 )
				{
					this._move_dir_timer = 5;

					let closest = null;
					let closest_di = Infinity;
					let closest_di_real = Infinity;

					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					{
						if ( sdWorld.sockets[ i ].character )
						if ( sdWorld.sockets[ i ].character.hea > 0 )
						if ( !sdWorld.sockets[ i ].character._is_being_removed )
						{
							let di = sdWorld.Dist2D( this.x, this.y, sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y );
							let di_real = di;
							
							//if ( sdEnemyMech.IsTargetFriendly( sdWorld.sockets[ i ].character ) )
							//di += 1000;
							
							if ( di < closest_di )
							{
								closest_di = di;
								closest_di_real = di_real;
								closest = sdWorld.sockets[ i ].character;
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

											this._move_dir_x = Math.cos( a1 );
											this._move_dir_y = Math.sin( a1 );

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
					let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, sdEnemyMech.attack_range, null, [ 'sdCharacter', 'sdTurret' ] );

					let targets = [];

					for ( let i = 0; i < targets_raw.length; i++ )
					if ( ( targets_raw[ i ].GetClass() === 'sdCharacter' && targets_raw[ i ].hea > 0 ) ||
						 ( targets_raw[ i ].GetClass() === 'sdTurret' ) )
					{
						if ( sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], [ 'sdEnemyMech' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer' ] ) )
							targets.push( targets_raw[ i ] );
						else
						{
							if ( this.hea < 2000 )
							if ( targets_raw[ i ].GetClass() === 'sdCharacter' ) // Highly wanted by sdEnemyMechs in this case
							{
								targets.push( targets_raw[ i ] );
							}
						}
					}

					sdWorld.shuffleArray( targets );

					for ( let i = 0; i < targets.length; i++ )
					{
						if ( this._alert_intensity < 45 )// Delay attack
						break;

						this.attack_anim = 15;

						let an = Math.atan2( targets[ i ].y - this.y, targets[ i ].x - this.x ) + ( Math.random() * 2 - 1 ) * 0.05;

						let bullet_obj = new sdBullet({ x: this.x, y: this.y });
						bullet_obj._owner = this;
						bullet_obj.sx = Math.cos( an );
						bullet_obj.sy = Math.sin( an );
						//bullet_obj.x += bullet_obj.sx * 5;
						//bullet_obj.y += bullet_obj.sy * 5;

						bullet_obj.sx *= 15;
						bullet_obj.sy *= 15;
						
						bullet_obj.time_left = 60;

						//bullet_obj._rail = true;

						bullet_obj._damage = 10;
						bullet_obj.color = '#ffaa00';

						sdEntity.entities.push( bullet_obj );

						this._bullets--;

						if ( this._bullets <= 0 )
						{
							this._bullets = 100;
							this._attack_timer = 60;
						}

						sdSound.PlaySound({ name:'gun_pistol', pitch: 1, x:this.x, y:this.y, volume:0.5 });

						if ( targets[ i ].GetClass() === 'sdTurret' ) // Turrets get the special treatment
						if ( this._rail_attack_timer <= 0 )
						{
						an = Math.atan2( targets[ i ].y - ( this.y - 16 ), targets[ i ].x - this.x ); // Pinpoint accurate against turrets
							let bullet_obj = new sdBullet({ x: this.x, y: this.y - 16 });
							bullet_obj._owner = this;
							bullet_obj.sx = Math.cos( an );
							bullet_obj.sy = Math.sin( an );
							//bullet_obj.x += bullet_obj.sx * 5;
							//bullet_obj.y += bullet_obj.sy * 5;

							bullet_obj.sx *= 16;
							bullet_obj.sy *= 16;
						
							bullet_obj.time_left = 60;

							bullet_obj._rail = true;

							bullet_obj._damage = 600;
							bullet_obj.color = '#ff0000';

							sdEntity.entities.push( bullet_obj );
							this._rail_attack_timer = 20;
							sdSound.PlaySound({ name:'gun_railgun', pitch: 0.5, x:this.x, y:this.y, volume:0.5 });
						}
						break;
					}

					if ( this._rocket_attack_timer <= 0 )
					if ( this.hea < 3500 ) // Second phase of the mech, rocket launcher can fire now
					for ( let i = 0; i < targets.length; i++ )
					{
						if ( this._alert_intensity < 45 )// Delay attack
						break;

						this._rocket_attack_timer = 6;

						let an = Math.atan2( targets[ i ].y - ( this.y + 16 ), targets[ i ].x - this.x ) + ( Math.random() * 2 - 1 ) * 0.1;

						let bullet_obj = new sdBullet({ x: this.x, y: this.y + 16 });
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

						sdSound.PlaySound({ name:'gun_rocket', x:this.x, y:this.y, volume:1, pitch:0.5 });

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
		sdEntity.Tooltip( ctx, "Flying Mech" );
	}
	Draw( ctx, attached )
	{
	
		ctx.rotate( this.tilt / 100 );
		ctx.filter = this.filter;
		if ( this.side === 1 )
		ctx.scale( 1, 1 );
		else	
		ctx.scale( -1, 1 );
		
		if ( this.hea > 0 )
		ctx.drawImageFilterCache( sdEnemyMech.img_mech_boost, - 32, - 32, 64, 64 );
		else
		ctx.drawImageFilterCache( sdEnemyMech.img_mech_broken, - 32, - 32, 64, 64 );
		
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
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdEnemyMech.init_class();

export default sdEnemyMech;
