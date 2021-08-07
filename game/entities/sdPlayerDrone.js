
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
//import sdMatterAmplifier from './sdMatterAmplifier.js';
//import sdCrystalCombiner from './sdCrystalCombiner.js';
import sdArea from './sdArea.js';

class sdPlayerDrone extends sdCharacter
{
	static init_class()
	{
		//sdPlayerDrone.img_player_drone = sdWorld.CreateImageFromFile( 'drone_robot2' );
		sdPlayerDrone.img_glow = sdWorld.CreateImageFromFile( 'hit_glow' );
		
		sdPlayerDrone.drone_helmets = [
			null, // 0
			null, // 1
			sdWorld.CreateImageFromFile( 'drone_robot' ), // 2
			sdWorld.CreateImageFromFile( 'drone_robot3' ), // 3
			sdWorld.CreateImageFromFile( 'drone_robot4' ), // 4
			sdWorld.CreateImageFromFile( 'drone_robot5' ), // 5
			sdWorld.CreateImageFromFile( 'drone_robot6' ), // 6
			sdWorld.CreateImageFromFile( 'drone_robot7' ), // 7
			sdWorld.CreateImageFromFile( 'drone_robot8' ), // 8
			sdWorld.CreateImageFromFile( 'drone_robot9' ), // 9
			sdWorld.CreateImageFromFile( 'drone_robot10' ), // 10
			sdWorld.CreateImageFromFile( 'drone_robot11' ), // 11
		];
		
		sdPlayerDrone.fake_bullet = {
			is: ( v )=>
			{
				return v === sdBullet;
			}
		};
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 6; }
	get hitbox_y1() { return -6; }
	get hitbox_y2() { return 6; }
	
	/*get hard_collision() // For world geometry where players can walk
	{ return true; }*/
	
	get hard_collision() // For world geometry where players can walk
	{ return ( !this.driver_of ); }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.regen_timeout = 0;
		
		this.hmax = 100;
		this.hea = this.hmax;
		
		this.matter_max = 100;
		this.matter = 0;
		
		this._jetpack_allowed = true; // For position correction tests
		
		this.an = 0;
		
		this.pain_anim = 0;
		
		this.grabbed = null;
		
		this._sd_filter_for_drone = null;
		
		this.gun_slot = 1;
		
		this._beep_delay = 0;
		this._beep_charge = 0;
	}
	
	CanSelfDestruct()
	{
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
	
		//dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		if ( was_alive )
		if ( this.hea - dmg <= 0 )
		{
			if ( this.AttemptTeleportOut() )
			return;
		}
		
		if ( !was_alive )
		if ( dmg < 0 )
		this.hea = 0;
		
		this.hea -= dmg;
		
		this.hea = Math.min( this.hea, this.hmax ); // Prevent overhealing
		
		if ( this.hea > 0 )
		{
			if ( this.pain_anim <= 0 )
			{
				if ( this.helmet === 8 )
				sdSound.PlaySound({ name:'cube_hurt', pitch: 1, x:this.x, y:this.y, volume:0.66 });
				else
				sdSound.PlaySound({ name:'spider_hurtC', x:this.x, y:this.y, volume: 1, pitch:1 });
			}
		
			this.pain_anim = 5;
			
			this.death_anim = 0;
		}
		
		this.regen_timeout = Math.max( this.regen_timeout, 60 );
		
		if ( this.hea <= 0 && was_alive )
		{
			if ( this.helmet === 8 )
			sdSound.PlaySound({ name:'cube_offline', pitch:1, x:this.x, y:this.y, volume:1.5 });
			else
			sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:2 });
				
			if ( this.driver_of )
			this.driver_of.ExcludeDriver( this );

			if ( sdWorld.server_config.onKill )
			sdWorld.server_config.onKill( this, initiator );
		}
		
		if ( this.hea < -200 )
		{
			//if ( this._broken )
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	
			this.remove();
		}
		
		//if ( this.hea < -this.hmax / 80 * 100 )
		//this.remove();
	}
	
	get mass() { return 50; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	TogglePlayerGhosting() // part of ManagePlayerVehicleEntrance()
	{
		// Disabled
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._god )
		if ( this._socket )
		{
			this.hea = this.hmax; // Hack
			this._nature_damage = 0; // Hack
			this._player_damage = 0; // Hack
		}
		
		const matter_cost_4 = ( Math.abs( 100 * this._damage_mult * ( this.power_ef > 0 ? 2.5 : 1 ) ) * 1 + 30 ) * sdWorld.damage_to_matter;
		const matter_cost_5 = 100;
		const matter_cost_7 = 1;
		
		
		if ( this.matter >= matter_cost_5 && this.gun_slot === 5 )
		{
			if ( this._beep_charge < 90 )
			this._beep_charge += GSPEED;

			this._beep_delay -= GSPEED;
			if ( this._beep_delay <= 0 )
			{
				sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.25, pitch: 1.1 });
				this._beep_delay = 60 - 40 * ( this._beep_charge / 90 );
			}

			if ( this._beep_charge >= 90 )
			if ( this.hea <= 0 )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:40, // 80 was too much?
					damage_scale: 10 * ( this._damage_mult ), // 5 was too deadly on relatively far range
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:'#FF6633' 
				});
				this.remove();
				return;
			}
		}
		else
		this._beep_charge = 0;

		
		
		if ( this.hea <= 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;
		
			this.MatterGlow( 0.01, 30, GSPEED );
			
			this.an += this.sx * 20 * GSPEED;
			
			this.death_anim += GSPEED;
			if ( this.death_anim > sdCharacter.disowned_body_ttl )
			{
				this.remove();
			}
		}
		else
		{
			this.ManagePlayerVehicleEntrance();
			
			if ( this._key_states.GetKey( 'KeyV' ) )
			this.MatterGlow( 0.1, 30, GSPEED );
		
			if ( this.regen_timeout <= 0 )
			{
				if ( this.hea < this.hmax )
				{
					this.hea = Math.min( this.hea + GSPEED, this.hmax );
				}
			}
			else
			{
				this.regen_timeout = Math.max( this.regen_timeout - GSPEED, 0 );
			}


			if ( this.pain_anim > 0 )
			this.pain_anim = Math.max( 0, this.pain_anim - GSPEED );

			//this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			//this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.95, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.95, GSPEED );
			
			this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
			
		
			let v = 0.4;
				
			this.act_x = this._key_states.GetKey( 'KeyD' ) - this._key_states.GetKey( 'KeyA' );
			this.act_y = this._key_states.GetKey( 'KeyS' ) - ( ( this._key_states.GetKey( 'KeyW' ) || this._key_states.GetKey( 'Space' ) ) ? 1 : 0 );
			
			let di = sdWorld.Dist2D_Vector( this.act_x, this.act_y );
			if ( di > 1 )
			{
				v = v / di * 1;
			}

			this.sx += this.act_x * v * GSPEED;
			this.sy += this.act_y * v * GSPEED;
			
			this.an = ( -Math.PI/2 - Math.atan2( this.look_x - this.x, this.look_y - this.y ) ) * 100;
			
			let old_gun_slot = this.gun_slot;
			
			if ( this._key_states.GetKey( 'Digit1' ) )
			this.gun_slot = 1;
			else
			if ( this._key_states.GetKey( 'Digit4' ) )
			this.gun_slot = 4;
			else
			if ( this._key_states.GetKey( 'Digit5' ) )
			this.gun_slot = 5;
			else
			if ( this._key_states.GetKey( 'Digit7' ) )
			this.gun_slot = 7;
	
			if ( old_gun_slot !== this.gun_slot )
			{
				if ( this._socket )
				sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:0.7 }, [ this._socket ] );
			}
			
			if ( this.fire_anim <= 0 )
			{
				if ( !this.driver_of )
				if ( this._key_states.GetKey( 'Mouse1' ) )
				{	
					let mode = 1;
					
					if ( ( this.gun_slot === 4 ) && this.matter >= matter_cost_4 )
					mode = 4;
					else
					if ( ( this.gun_slot === 5 ) && this.matter >= matter_cost_5 )
					mode = 5;
					else
					if ( ( this.gun_slot === 7 ) && this.matter >= matter_cost_7 )
					mode = 7;
			
					if ( mode === 5 )
					{
						if ( !this._is_being_removed )
						{
							this.Damage( this.hea + 1 );
							return;
						}
					}
					
					let power = ( mode === 4 ) ? 10 : 1;
					
					if ( mode !== 1 )
					this.matter -= matter_cost_4;

					if ( mode === 4 )
					{
						if ( this.helmet === 8 )
						sdSound.PlaySound({ name:'cube_attack', pitch: 0.5, x:this.x, y:this.y, volume:0.5 });
						else
						sdSound.PlaySound({ name:'cube_attack', x:this.x, y:this.y, volume:0.66, pitch:2 });
					}
					else
					if ( mode === 7 )
					sdSound.PlaySound({ name: sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].sound, x:this.x, y:this.y, volume:0.66, pitch:sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].sound_pitch });
					else
					{
						if ( this.helmet === 8 )
						sdSound.PlaySound({ name:'cube_attack', pitch: 1, x:this.x, y:this.y, volume:0.5 });
						else
						sdSound.PlaySound({ name:'cube_attack', x:this.x, y:this.y, volume:0.33, pitch:3 });
					}
					
					if ( mode === 7 )
					this.fire_anim = 15;
					else
					this.fire_anim = 5 * power;

					if ( sdWorld.is_server )
					{
						let dx = -Math.cos( this.an / 100 );
						let dy = -Math.sin( this.an / 100 );
						
						let bullet_obj = new sdBullet({ x: this.x + dx * 5, y: this.y + dy * 5 });

						bullet_obj._owner = this;

						bullet_obj.sx = dx * 12;
						bullet_obj.sy = dy * 12;

						bullet_obj._damage = 10 * power * ( ( this.power_ef > 0 ) ? 2.5 : 1 ) * this._damage_mult;

						
						if ( mode === 7 )
						{
							//bullet_obj.time_left = 2;
							//bullet_obj._damage = 1;
							
							Object.assign( bullet_obj, sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].projectile_properties );
						}
						else
						if ( mode === 4 )
						{
							bullet_obj.color = '#aaaa55';
							bullet_obj.time_left = 12;
							bullet_obj._rail = true;
						}
						else
						{
							bullet_obj.color = '#223355';
							bullet_obj.time_left = 8;
							bullet_obj._rail = true;
						}

						sdEntity.entities.push( bullet_obj );
					}
				}
				
				if ( sdWorld.is_server || this === sdWorld.my_entity )
				{
					if ( this._key_states.GetKey( 'Mouse3' ) && ( !this.grabbed || ( this.grabbed && sdWorld.inDist2D_Boolean( this.x, this.y, this.grabbed.x, this.grabbed.y, 400 ) ) ) )
					{
						if ( this.grabbed )
						if ( this.grabbed._is_being_removed )
						this.grabbed = null;
				
						if ( this.grabbed === null )
						{
							if ( sdWorld.inDist2D_Boolean( this.look_x, this.look_y, this.x, this.y, 400 ) )
							{
								let nears = sdWorld.GetAnythingNear( this.look_x, this.look_y, 16, null, null );
								for ( let i = 0; i < nears.length; i++ )
								{
									if ( nears[ i ] !== this )
									if ( nears[ i ]._hiberstate === sdEntity.HIBERSTATE_HIBERNATED || nears[ i ]._hiberstate === sdEntity.HIBERSTATE_ACTIVE )
									if ( this._god || sdWorld.CheckLineOfSight( this.x, this.y, nears[ i ].x + ( nears[ i ]._hitbox_x1 + nears[ i ]._hitbox_x2 ) / 2, nears[ i ].y + ( nears[ i ]._hitbox_y1 + nears[ i ]._hitbox_y2 ) / 2, this, null, [ 'sdBlock', 'sdDoor' ] ) )
									if ( this._god || sdArea.CheckPointDamageAllowed( nears[ i ].x + ( nears[ i ]._hitbox_x1 + nears[ i ]._hitbox_x2 ) / 2, nears[ i ].y + ( nears[ i ]._hitbox_y1 + nears[ i ]._hitbox_y2 ) / 2 ) )
									{
										if ( typeof nears[ i ].sx !== 'undefined' && typeof nears[ i ].sy !== 'undefined' )
										{
											sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:0.5, pitch:2 });

											this.grabbed = nears[ i ];
											this.grabbed.PhysWakeUp();
											this.grabbed.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

											break;
										}
										else
										{
											if ( nears[ i ].is( sdWorld.entity_classes.sdMatterAmplifier ) || nears[ i ].is( sdWorld.entity_classes.sdCrystalCombiner ) )
											{
												sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:0.5, pitch:2 });

												this.grabbed = nears[ i ];
												
												nears[ i ].onMovementInRange( sdPlayerDrone.fake_bullet );
												
												break;
											}
										}
									}
								}
							}
						}
						else
						if ( typeof this.grabbed.sx !== 'undefined' && typeof this.grabbed.sy !== 'undefined' ) // Amplifier and combiner tests
						{
							let xx = this.look_x - this.x;
							let yy = this.look_y - this.y;
							let di_look = sdWorld.Dist2D_Vector( xx, yy );
							if ( di_look > 200 )
							{
								xx = xx / di_look * 200;
								yy = yy / di_look * 200;
								this.look_x = this.x + xx;
								this.look_y = this.y + yy;
							}



							let p = 1.5;

							let dx = ( this.look_x - this.grabbed.x ) + ( this.sx - this.grabbed.sx ) * 10;
							let dy = ( this.look_y - this.grabbed.y ) + ( this.sy - this.grabbed.sy ) * 10;

							let di = sdWorld.Dist2D_Vector( dx, dy );

							if ( di > 10 )
							{
								dx /= di / 10;
								dy /= di / 10;
							}

							this.grabbed.Impulse( dx * p, 
												  dy * p );
						}
					}
					else
					{
						if ( this.grabbed )
						{
							sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:2, pitch:0.5 });
							this.grabbed = null;
						}
					}
				}
			}
			else
			{
				this.fire_anim = Math.max( this.fire_anim - GSPEED * ( ( this.stim_ef > 0 ) ? 2 : 1 ), 0 );
			}
			
			this.PhysWakeUp();
		}
		
		this.HandlePlayerPowerups( GSPEED );
		
		if ( this.driver_of )
		this.PositionUpdateAsDriver();
		else
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.IsVehicle() )
		{
			this._potential_vehicle = from_entity;
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_WALL_HIT;
	}
	GetBleedEffectFilter()
	{
		return '';
	}
	
	Draw( ctx, attached )
	{
		if ( !attached )
		if ( this.hea > 0 )	
		if ( this.grabbed )
		{
			ctx.save();
			ctx.blend_mode = THREE.AdditiveBlending;
			
			ctx.filter = 'none';
			ctx.globalAlpha = 0.5;
			
			ctx.drawImageFilterCache( sdPlayerDrone.img_glow, - 16, - 16, 32, 32 );
			
			ctx.translate( this.grabbed.x + ( this.grabbed._hitbox_x1 + this.grabbed._hitbox_x2 ) / 2 - this.x, this.grabbed.y + ( this.grabbed._hitbox_y1 + this.grabbed._hitbox_y2 ) / 2 - this.y );
			
			ctx.drawImageFilterCache( sdPlayerDrone.img_glow, - 16, - 16, 32, 32 );
			
			ctx.globalAlpha = 1;
			ctx.blend_mode = THREE.NormalBlending;
			ctx.restore();
		}
		
		if ( this.driver_of && !attached )
		return;

		if ( this.helmet !== 8 )
		{
			if ( this.driver_of )
			{
				ctx.scale( -1, 1 );
			}
			else
			{
				ctx.rotate( this.an / 100 );

				if ( this.look_x - this.x > 0 )
				ctx.scale( 1, -1 );
			}
		}
		
		//ctx.rotate( Math.atan2( this.look_x - this.x, this.look_y - this.y ) );
		
		if ( this.hea > 0 )
		{
			/*if ( this.pain_anim > 0 )
			{
				ctx.filter = 'none';
				ctx.drawImageFilterCache( sdDrone.img_drone_robot_hurt, - 16, - 16, 32, 32 );
			}
			else*/
			{
				if ( this.sd_filter )
				if ( this._sd_filter_for_drone === null )
				{
					this._sd_filter_for_drone = sdWorld.CreateSDFilter();

					sdWorld.ReplaceColorInSDFilter_v2( this._sd_filter_for_drone, '37a3ff', sdWorld.GetColorOfSDFilter( this.sd_filter, 'ff0000' ) );
					sdWorld.ReplaceColorInSDFilter_v2( this._sd_filter_for_drone, '1665a8', sdWorld.MultiplyHexColor( sdWorld.GetColorOfSDFilter( this.sd_filter, 'ff0000' ), 0.66 ) );
					
					sdWorld.ReplaceColorInSDFilter_v2( this._sd_filter_for_drone, '464646', sdWorld.GetColorOfSDFilter( this.sd_filter, '800080' ) );
					sdWorld.ReplaceColorInSDFilter_v2( this._sd_filter_for_drone, '000000', sdWorld.GetColorOfSDFilter( this.sd_filter, 'c0c0c0' ) );
				}
				ctx.sd_filter = this._sd_filter_for_drone;
				
				if ( this.pain_anim > 0 )
				ctx.filter = 'sepia(1) hue-rotate(-40deg) saturate(5)';
				else
				if ( this.fire_anim > 2 )
				ctx.filter = 'brightness(1.5)';
				else
				if ( this.gun_slot === 5 )
				{
					ctx.filter = 'sepia(1) hue-rotate(-40deg) saturate(5) brightness(' + ((sdWorld.time%1000<500)?1.5:0.5) + ')';
				}
				else
				if ( this.grabbed )
				ctx.filter = 'brightness(3)';
				else
				ctx.filter = 'none';
			
				ctx.drawImageFilterCache( sdPlayerDrone.drone_helmets[ this.helmet ] || sdDrone.img_drone_robot, - 16, - 16, 32, 32 );
			}
		}
		else
		{
			if ( this.helmet === 8 )
			{
				ctx.filter = 'saturate(0) brightness(0.5)';
				ctx.drawImageFilterCache( sdPlayerDrone.drone_helmets[ this.helmet ] || sdDrone.img_drone_robot, - 16, - 16, 32, 32 );
			}
			else
			ctx.drawImageFilterCache( sdDrone.img_drone_robot_destroyed, - 16, - 16, 32, 32 );
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_filter = null;
	}
	
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdPlayerDrone.init_class();

export default sdPlayerDrone;