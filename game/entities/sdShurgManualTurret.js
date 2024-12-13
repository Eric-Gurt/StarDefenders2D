
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';

import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';
import sdFactions from './sdFactions.js';

class sdShurgManualTurret extends sdEntity
{
	static init_class()
	{

		sdShurgManualTurret.img_vehicle = sdWorld.CreateImageFromFile( 'sdShurgManualTurret' );
		sdShurgManualTurret.img_pistol = sdWorld.CreateImageFromFile( 'shurg_pistol' );

		
		sdShurgManualTurret.slot_hints = [
			'Entered slot 1: Driver, turret operator' // sdShurgManualTurret
		];
		
		//sdShurgManualTurret.TYPE_HOVER = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get hitbox_x1() { return -11; }
	get hitbox_x2() { return 11; }
	get hitbox_y1() { return -18; }
	get hitbox_y2() { return 18; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	VehicleHidesLegs()
	{
		return false;
	}
	
	Impact( vel ) // fall damage basically
	{
		if ( vel > 10 )
		this.DamageWithEffect( ( vel - 3 ) * 15 ); // Less impact damage than other types of hover
	}
	
	constructor( params )
	{
		super( params );
		
		//this._is_cable_priority = true;
		
		this.sx = 0;
		this.sy = 0;

		//this.type = params.type || 0;
		
		this.hmax = 400; // Maybe it doesn't feel like 1000 hp entity compared to other health amounts
		this.hea = this.hmax;
		
		this.guns = ( params.guns !== undefined ) ? params.guns : 1;
		this._tilt = 0;
		
		this.nick = '';
		this.nick_censored = 0;
		
		this._bullets = 50;

		this._bullets_reload = 0;
		
		this._regen_timeout = 0;
		
		this._ai_team = 9; // 9 is AI team for Shurgs
		
		
		this._last_damage = 0; // Sound flood prevention
		
		// 6 slots
		this.driver0 = null; // movement and guns
		
		//EnforceChangeLog( this, 'driver0' );
		
		this.matter = 1500; // Not that players can spawn it anyway
		this.matter_max = 1500;
		
		this._spawn_with_pilot = params.spawn_with_pilot || false; // Spawn with a Shurg humanoid?
	}
	
	
	IsVehicle()
	{
		return true;
	}
	GetDriverSlotsCount()
	{
		return 1;
	}
	GetDriverSlotHint( best_slot )
	{
		return 'Entered slot 1';
	}
	onAfterDriverAdded( best_slot )
	{
		sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1, pitch:0.75 });
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator !== this ) // Only self-healing is allowed
		dmg = Math.abs( dmg );
		
		let old_hea = this.hea;
		
		this.hea -= dmg;
		
		if ( this.hea > this.hmax )
		this.hea = this.hmax;
	
	
		if ( dmg > 0 )
		{
			if ( initiator && this.driver0 ) // AI piloted turrets inherit humanoid targetting rules
			{
				if ( this.driver0._ai )
				this.driver0.AICheckInitiator( initiator );
			}
			
			if ( this.hea <= 0 )
			{
				const break_at_hp = -400;

				if ( old_hea > 0 )
				if ( this.matter > 25 )
				{
					sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });

					for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
					if ( this[ 'driver' + i ] )
					{
						let driver = this[ 'driver' + i ];

						this.ExcludeDriver( this[ 'driver' + i ], true );

						if ( this.hea <= break_at_hp )
						{
							if ( !driver._is_being_removed )
							driver.DamageWithEffect( 400 );
						}
					}

					let that = this;
					for ( var i = 0; i < 5; i++ )
					{
						let an = Math.random() * Math.PI * 2;
						let d = ( i === 0 ) ? 0 : Math.random() * 10;
						let r = ( i === 0 ) ? 50 : ( 10 + Math.random() * 10 );

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
									can_hit_owner: false,
									color: sdEffect.default_explosion_color 
								});
							}
						}, i * 150 );
					}
				}

				if ( this.hea <= break_at_hp )
				this.remove();
			}
			else
			{
				if ( this.hea <= 100 && old_hea > 100 )
				sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1, pitch: 0.75 });
			}

			this._regen_timeout = 90;

			
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
			}
		}
	}
	
	get mass() { 
		return 250;
	}
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._spawn_with_pilot === true ) // Should this vehicle spawn with a pilot?
			{
				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

				sdEntity.entities.push( character_entity );
				
				sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_SHURG );
				character_entity._potential_vehicle = this;
				character_entity._key_states.SetKey( 'KeyE', 1 );
				
				this._spawn_with_pilot = false;
			}
			
			
		}
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this.hea > 0 )
			if ( this.hea < this.hmax )
			{
				const regen_amount = ( this.driver0 ) ? GSPEED / 3 : GSPEED;
				
				//this.hea = Math.min( this.hea + regen_amount, this.hmax );
				
				if ( this.matter > regen_amount * 0.15 )
				{
					this.matter -= regen_amount * 0.15;
					this.DamageWithEffect( -regen_amount, this );
				}
			}
		}
		
		this.MatterGlow( 0.001, 0, GSPEED ); // 0 radius means only towards cables
		
		if ( this.driver0 && this.hea > 0 )
		{
			let cost = ( ( sdWorld.Dist2D_Vector_pow2( this.driver0.act_x, this.driver0.act_y ) > 0 ) ? GSPEED : GSPEED * 0.01 ) * this.mass / 1000;
			
			if ( this.driver0._ai )
			cost = 0; // AI should have no cost for piloting, or it will stop driving in a minute or two
			
			if ( this.matter >= cost )
			{
				this.matter -= cost;
				
				//let ai_driver = this.driver0._ai;
				
				let di = Math.max( 1, sdWorld.Dist2D_Vector( this.driver0.act_x, this.driver0.act_y ) );
				
				let speed_cap = 4; // Speed cap

				let force = 0.15;

				this.sy += sdWorld.gravity * 0.2 * GSPEED;
			
				let x_force = this.driver0.act_x / di * force;
				let y_force = this.driver0.act_y / di * ( force * 1.5 ); 
				
				
				if ( Math.abs( this.sx + x_force * GSPEED ) < speed_cap ) // Horizontal speed cap
				this.sx += x_force * GSPEED;
				
				 
				if ( ( this.sy > -speed_cap || y_force > 0 ) || ( this.sy < speed_cap || y_force < 0 ) ) // Cap vertical speed
				this.sy += y_force * GSPEED;

				this._tilt = sdWorld.MorphWithTimeScale( this._tilt, ( this.driver0.act_x ) * Math.PI / 8 * 100, 0.93, GSPEED );

				if ( this.driver0.act_x === 0 )
				if ( Math.abs( this._tilt ) < 1 )
				this._tilt = ( this._tilt > 0 ? 1 : -1 );

				if ( x_force !== 0 || y_force !== 0 )
				this.PhysWakeUp();
			}
			else
			{
				//this.matter = 0;

				this.sy += sdWorld.gravity * GSPEED;

				this._tilt = sdWorld.MorphWithTimeScale( this._tilt, 0, 0.93, GSPEED );
				
				if ( this.driver0._socket )
				this.driver0._socket.SDServiceMessage( 'Vehicle is out of matter' );
			}
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
			this._tilt = sdWorld.MorphWithTimeScale( this._tilt, 0, 0.93, GSPEED );
			
			if ( Math.abs( this._tilt ) < 1 )
			this._tilt = ( this._tilt > 0 ? 1 : -1 );
		}
		
		if ( this.guns )
		if ( sdWorld.is_server && this.hea > 0 )
		{
			if ( this._bullets_reload > 0 )
			this._bullets_reload -= GSPEED;
		
			if ( this._rockets_reload > 0 )
			this._rockets_reload -= GSPEED;

			if ( this.driver0 && this._bullets_reload <= 0 )
			{
				if ( this.driver0._key_states.GetKey( 'Mouse1' ) )
				{
					sdSound.PlaySound({ name:'tzyrg_fire', x:this.x, y:this.y, volume:1.25, pitch:2 });
					// Attack fires 4 projectiles, akin to 2 shurg pistols but with slightly higher damage
					
					let bullet_obj = new sdBullet({ x: this.x, y: this.y - 2 });

					bullet_obj._owner = this.driver0;
					bullet_obj._owner2 = this;

					let an = this.driver0.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.03;

					bullet_obj.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj.x += bullet_obj.sx * 4;
					bullet_obj.y += bullet_obj.sy * 4;

					bullet_obj.sx *= 16;
					bullet_obj.sy *= 16;
					
					bullet_obj.sx += this.sx;
					bullet_obj.sy += this.sy;

					bullet_obj._damage = 24;

					bullet_obj.color = '#004400';

					bullet_obj._rail = false;
					bullet_obj._affected_by_gravity = true;
					

					//bullet_obj._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj._armor_penetration_level = 0;
				
					//2nd bullet
				
					let bullet_obj2 = new sdBullet({ x: this.x, y: this.y - 2 });

					bullet_obj2._owner = this.driver0;
					bullet_obj2._owner2 = this;
					
					an = this.driver0.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.03; // Refresh spread

					bullet_obj2.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj2.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj2.x += bullet_obj2.sx * 4;
					bullet_obj2.y += bullet_obj2.sy * 4;

					bullet_obj2.sx *= 15;
					bullet_obj2.sy *= 15;
					
					bullet_obj2.sx += this.sx;
					bullet_obj2.sy += this.sy;

					bullet_obj2._damage = 24;

					bullet_obj2.color = '#004400';

					bullet_obj2._rail = false;
					bullet_obj2._affected_by_gravity = true;
					
					//bullet_obj2._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj2._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj2._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj2._armor_penetration_level = 0;
					
					//3rd bullet
					
					let bullet_obj3 = new sdBullet({ x: this.x, y: this.y + 6 });

					bullet_obj3._owner = this.driver0;
					bullet_obj3._owner2 = this;
					
					an = this.driver0.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.03; // Refresh spread

					bullet_obj3.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj3.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj3.x += bullet_obj3.sx * 4;
					bullet_obj3.y += bullet_obj3.sy * 4;

					bullet_obj3.sx *= 15;
					bullet_obj3.sy *= 15;
					
					bullet_obj3.sx += this.sx;
					bullet_obj3.sy += this.sy;

					bullet_obj3._damage = 24;

					bullet_obj3.color = '#004400';

					bullet_obj3._rail = false;
					bullet_obj3._affected_by_gravity = true;
					
					//bullet_obj3._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj3._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj3._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj3._armor_penetration_level = 0;
					
					//4th bullet
					
					let bullet_obj4 = new sdBullet({ x: this.x, y: this.y + 6 });

					bullet_obj4._owner = this.driver0;
					bullet_obj4._owner2 = this;
					
					an = this.driver0.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.03; // Refresh spread

					bullet_obj4.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj4.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj4.x += bullet_obj4.sx * 4;
					bullet_obj4.y += bullet_obj4.sy * 4;

					bullet_obj4.sx *= 15;
					bullet_obj4.sy *= 15;
					
					bullet_obj4.sx += this.sx;
					bullet_obj4.sy += this.sy;

					bullet_obj4._damage = 24;

					bullet_obj4.color = '#004400';

					bullet_obj4._rail = false;
					bullet_obj4._affected_by_gravity = true;
					

					//bullet_obj4._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj4._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj4._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj4._armor_penetration_level = 0;

					let cost = ( sdGun.GetProjectileCost( bullet_obj, 1, 0 ) ) * 2; 
					
					if ( this.driver0._ai )
					cost = cost / 3;
					
					if ( this.matter >= cost )
					{
						this.matter -= cost;

						sdEntity.entities.push( bullet_obj );
						sdEntity.entities.push( bullet_obj2 );
						sdEntity.entities.push( bullet_obj3 );
						sdEntity.entities.push( bullet_obj4 );

						this._bullets_reload = 7;

						this._bullets--;
					}
					else
					{
						bullet_obj.onRemoveAsFakeEntity();
						bullet_obj._remove();
						
						bullet_obj2.onRemoveAsFakeEntity();
						bullet_obj2._remove();
						
						bullet_obj3.onRemoveAsFakeEntity();
						bullet_obj3._remove();
						
						bullet_obj4.onRemoveAsFakeEntity();
						bullet_obj4._remove();
						
						if ( this.driver0._socket )
						this.driver0._socket.SDServiceMessage( 'Out of matter' );
					
						sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1, pitch: 0.75 });
						this._bullets_reload = 30;
					}
				}

				if ( this._bullets <= 0 || ( this._bullets < 50 && this.driver0._key_states.GetKey( 'KeyR' ) ) )
				{
					sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:1, pitch:0.6 });
					this._bullets = 50;
					this._bullets_reload = 60;
				}
			}
		}
		
		sdWorld.last_hit_entity = null;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 5 );
	}
	
	get friction_remain()
	{ return /*this.type === 3 ? 0.6 :*/ this.driver0 ? 0.95 : 0.8; } // I don't know if Hoverbike is needed in this case
	
	get description()
	{
		return `Flying vehicle, uses matter instead of fuel.`;
	}

	get title()
	{
		return "Shurg manual turret";
	}

	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea <= 0 )
		return;
	
		if ( this.nick !== '' )
		sdEntity.Tooltip( ctx, this.nick );
		else
		sdEntity.Tooltip( ctx, this.title );
		/* if ( this.type === 1 )
		sdEntity.Tooltip( ctx, "Fighter Hover" );
		else
		if ( this.type === 2 )
		sdEntity.Tooltip( ctx, "Tank SD-7" );
		else
		if ( this.type === 3 )
		sdEntity.Tooltip( ctx, "Hoverbike" );
		else
		sdEntity.Tooltip( ctx, "Hover" ); */
		
		let w = 20;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 5 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );

		ctx.fillStyle = '#00ffff';
		ctx.fillRect( 1 - w / 2, 1 - 20 + 2, ( w - 2 ) * Math.max( 0, this.matter / this.matter_max ), 1 );
	}
	Draw( ctx, attached )
	{
		if ( this.driver0 )
		ctx.apply_shading = false;
		
		if ( sdShop.isDrawing )
		{
			ctx.scale( 0.5, 0.5 );
		}
		
		ctx.rotate( this._tilt / 100 );

		let xx; // Let it be undefined first
		//let yy = 0;

		let image = sdShurgManualTurret.img_vehicle;

		let width = 48;

		
		if ( this._tilt > 0 )
		{
			ctx.scale( -1, 1 );
		}
		
		const DrawDrivers = ()=>
		{
			for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
			{
				if ( this[ 'driver' + i ] )
				{
					ctx.save();
					{
						let old_x = this[ 'driver' + i ].look_x;
						let old_y = this[ 'driver' + i ].look_y;
						
						this[ 'driver' + i ]._side = 1;
						this[ 'driver' + i ].look_x = this[ 'driver' + i ].x + 100;
						this[ 'driver' + i ].look_y = this[ 'driver' + i ].y;

						ctx.scale( -1, 1 );

						ctx.translate( 1, -1 );

						this[ 'driver' + i ].Draw( ctx, true );

						this[ 'driver' + i ].look_x = old_x;
						this[ 'driver' + i ].look_y = old_y;
					}
					ctx.restore();
				}
			}
		};
		
		//if ( this.type !== sdShurgManualTurret.TYPE_BIKE )
		DrawDrivers();
		
		//ctx.filter = this.filter;
		
		let can_boost = !!this.driver0;
		
		if ( !sdShop.isDrawing )
		if ( this.matter <= 1 )
		if ( this.hea > 0 )
		{
			ctx.filter += 'brightness(0.1)';
			can_boost = false;
		}
		
		/*let DelayedDrawGun = ()=>
		{
		};*/
		
		if ( this.hea > 0 )
		{
			xx = can_boost ? 1 : 0;
			
		}
		else
		xx = 2;
		ctx.drawImageFilterCache( image, xx * width, 0, width, 48, - width/2, -16, width,48 );
		
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		
		//DelayedDrawGun();
		
		if ( this.guns )
		{
			var i;
				
				i = 0;
				if ( this[ 'driver' + i ])
				{
					ctx.save();

					ctx.translate( -6, -2 );
					ctx.scale( 1, -1 );

					ctx.rotate( ( ( this._tilt > 0 ) ? Math.PI : 0 ) + Math.sign( this._tilt ) * ( -this._tilt / 100 + Math.atan2( this[ 'driver' + i ].look_y - this.y, this[ 'driver' + i ].look_x - this.x ) ) );

					ctx.drawImageFilterCache( sdShurgManualTurret.img_pistol, - 16, - 16, 32,32 );
					
					ctx.restore();
					
					ctx.save();
					
					ctx.translate( -6, 6 );
					ctx.scale( 1, -1 );
					
					ctx.rotate( ( ( this._tilt > 0 ) ? Math.PI : 0 ) + Math.sign( this._tilt ) * ( -this._tilt / 100 + Math.atan2( this[ 'driver' + i ].look_y - this.y, this[ 'driver' + i ].look_x - this.x ) ) );
					
					ctx.drawImageFilterCache( sdShurgManualTurret.img_pistol, - 16, - 16, 32,32 );

					ctx.restore();
				}
		}
	
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onBeforeRemove()
	{
		if ( sdWorld.is_server )
		debugger;
	}*/
	onRemove() // Class-specific, if needed
	{
		/*if ( this._broken || sdLongRangeTeleport.teleported_items.has( this ) || !sdWorld.is_server )
		{
			this.ExcludeAllDrivers();
		}*/
		
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		}
		/*else
		{
			this.RemoveAllDrivers();
		}*/
	}
	
}
//sdShurgManualTurret.init_class();

export default sdShurgManualTurret;
