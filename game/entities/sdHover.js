
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';

import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';

class sdHover extends sdEntity
{
	static init_class()
	{
		sdHover.img_hover = sdWorld.CreateImageFromFile( 'hover_sprite' );

		sdHover.img_f_hover = sdWorld.CreateImageFromFile( 'f_hover_sprite' );
		sdHover.img_tank_hover = sdWorld.CreateImageFromFile( 'tank_sprite' ); // image by lazyrain

		sdHover.img_hoverbike = sdWorld.CreateImageFromFile( 'sdHoverBike' );

		/*sdHover.img_hover = sdWorld.CreateImageFromFile( 'hover' );
		sdHover.img_hover_boost = sdWorld.CreateImageFromFile( 'hover_boost' );
		sdHover.img_hover_broken = sdWorld.CreateImageFromFile( 'hover_broken' );

		sdHover.img_f_hover = sdWorld.CreateImageFromFile( 'f_hover' );
		sdHover.img_f_hover_boost = sdWorld.CreateImageFromFile( 'f_hover_boost' );
		sdHover.img_f_hover_broken = sdWorld.CreateImageFromFile( 'f_hover_broken' );
		
		sdHover.img_tank_hover = sdWorld.CreateImageFromFile( 'tank' ); // image by lazyrain
		sdHover.img_tank_hover_boost = sdWorld.CreateImageFromFile( 'tank_hover_boost' ); // image by lazyrain
		sdHover.img_tank_hover_broken = sdWorld.CreateImageFromFile( 'tank_destroyed' );
		sdHover.img_tank_with_turret = sdWorld.CreateImageFromFile( 'tank_with_turret' ); // image by lazyrain
		sdHover.img_tank_hover_driver2= sdWorld.CreateImageFromFile( 'tank_hover_driver2' ); // image by lazyrain

		sdHover.img_hoverbike = sdWorld.CreateImageFromFile( 'hoverbike' );
		sdHover.img_hoverbike_boost = sdWorld.CreateImageFromFile( 'hoverbike_boost' );
		sdHover.img_hoverbike_broken = sdWorld.CreateImageFromFile( 'hoverbike_broken' );*/

		sdHover.img_hover_mg = sdWorld.CreateImageFromFile( 'hover_mg' );
		sdHover.img_hover_rl = sdWorld.CreateImageFromFile( 'hover_rl' );

		sdHover.img_f_hover_mg = sdWorld.CreateImageFromFile( 'f_hover_railgun' );
		sdHover.img_f_hover_rl = sdWorld.CreateImageFromFile( 'f_hover_rl' );


		sdHover.img_tank_turret = sdWorld.CreateImageFromFile( 'tank_turret' );
		sdHover.img_tank_rl = sdWorld.CreateImageFromFile( 'tank_railgun' );
		
		sdHover.slot_hints = [
			'Entered slot 1: Driver',
			'Entered slot 2: Minigun operator',
			'Entered slot 3: Rocket launcher operator',
			'Entered slot 4: Passenger',
			'Entered slot 5: Passenger',
			'Entered slot 6: Passenger',
			'Entered slot 1: Driver, minigun operator' // sdHoverBike
		];
		
		sdHover.TYPE_HOVER = 0;
		sdHover.TYPE_FIGHTER_HOVER = 1;
		sdHover.TYPE_TANK = 2;
		sdHover.TYPE_BIKE = 3;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get hitbox_x1() { return this.type === 3 ? -10 : this.type === 2 ? -27 : -26 }
	get hitbox_x2() { return this.type === 3 ? 10 : this.type === 2 ? 27 : 26 }
	get hitbox_y1() { return this.type === 3 ? -4 : this.type === 2 ? -12 : -9 }
	get hitbox_y2() { return this.type === 3 ? 6 : this.type === 2 ? 12 : 10 }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdCharacter' ];
	}*/
	
	/*GetRocketDamageScale() // Mostly defines damage from rockets multiplier so far
	{
		return 3;
	}*/

	VehicleHidesLegs()
	{
		if ( this.type === sdHover.TYPE_BIKE )
		return false;

		return true;
	}
	
	Impact( vel ) // fall damage basically
	{
		if ( vel > 5 )
		{
			if ( this.type === sdHover.TYPE_BIKE )
			this.DamageWithEffect( ( vel - 3 ) * 15 ); // Less impact damage than other types of hover
			else
			this.DamageWithEffect( ( vel - 3 ) * 45 );
		}
	}
	
	constructor( params )
	{
		super( params );
		
		//this._is_cable_priority = true;
		
		this.sx = 0;
		this.sy = 0;

		this.type = params.type || 0;
		
		this.hmax = ( this.type === 1 ? 1200 : this.type === 2 ? 2400 : this.type === 3 ? 300 : 600 ) * 4;
		this.hea = this.hmax;
		
		this.guns = ( params.guns !== undefined ) ? params.guns : 1;
		this.doors_locked = false; // Magic property which vehicles use
		
		this._tilt = 0;
		
		this.nick = '';
		this.nick_censored = 0;
		
		/*if ( this.type === 2 )
		this._bullets = 200;
		else*/
		this._bullets = ( this.type === 3 ? 100 : this.type === 2 ? 200 : 300 );

		this._bullets_reload = 0;
		
		if ( this.type === 2 )
		this._rockets = 1;
		else
		this._rockets = 2;

		this._rockets_reload = 0;
		
		this._regen_timeout = 0;
		
		this.filter = params.filter || 'none';
		
		this._last_damage = 0; // Sound flood prevention
		
		// 6 slots
		this.driver0 = null; // movement and minigun if this type equals to 3
		this.driver1 = null; // minigun
		this.driver2 = null; // rockets
		this.driver3 = null; // passenger
		this.driver4 = null; // passenger
		this.driver5 = null; // passenger
		
		//EnforceChangeLog( this, 'driver0' );
		
		this.matter = 300; // Should be less than Hover cost
		this.matter_max = ( this.type === sdHover.TYPE_FIGHTER_HOVER ? 2000 :
			this.type === sdHover.TYPE_TANK ? 12000 :
			this.type === sdHover.TYPE_BIKE ? 400 :
			1000
		);
	}
	
	
	IsVehicle()
	{
		return true;
	}
	GetDriverSlotsCount()
	{
		if ( this.type === sdHover.TYPE_BIKE )
		return 1;
	
		return 6;
	}
	GetDriverSlotHint( best_slot )
	{
		if ( this.type === 3 )
		return ( this.guns ) ? sdHover.slot_hints[ 6 ] : 'Entered slot 1';
		else
		return ( this.guns ) ? sdHover.slot_hints[ best_slot ] : 'Entered slot ' + ( best_slot + 1 );
	}
	onAfterDriverAdded( best_slot )
	{
		if ( this.type === 3 && best_slot === 0 )
		sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1, pitch:2 });
		else
		if ( best_slot === 0 )
		sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1 });
	}
	/*AddDriver( c, force=false )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( !force )// && !c._god )
		if ( this.doors_locked )
		{
			if ( c._socket )
			c._socket.SDServiceMessage( 'Doors are locked' );
		
			return;
		}
	
		var best_slot = -1;
		
		let driver_slots_total = this.GetDriverSlotsCount();
		
		for ( var i = 0; i < driver_slots_total; i++ )
		if ( this[ 'driver' + i ] === null )
		{
			best_slot = i;
			break;
		}
		
		if ( best_slot >= 0 )
		{
			this[ 'driver' + best_slot ] = c;
			
			c.driver_of = this;

			if ( c._socket && this.type === 3 )
			{
				c._socket.SDServiceMessage( ( this.guns ) ? sdHover.slot_hints[ 6 ] : 'Entered slot 1' );
			}
			else
			{
				if ( c._socket )
				c._socket.SDServiceMessage( ( this.guns ) ? sdHover.slot_hints[ best_slot ] : 'Entered slot ' + ( best_slot + 1 ) );
			}
			
			if ( this.type === 3 && best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1, pitch:2 });
			else
			if ( best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1 });
		}
		else
		{
			if ( c._socket )
			c._socket.SDServiceMessage( 'All slots are occupied' );
		}
	}
	ExcludeDriver( c, force=false )
	{
		if ( !force )
		if ( !sdWorld.is_server )
		return;

		if ( !force )//&& !c._god )
		if ( this.doors_locked )
		{
			if ( c._socket )
			c._socket.SDServiceMessage( 'Doors are locked' );
		
			return;
		}
		
		for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
		{
			if ( this[ 'driver' + i ] === c )
			{
				this[ 'driver' + i ] = null;
				c.driver_of = null;

				// To prevent the teleport exploit
				if ( this.type === 3 )
				c.x = this.x;
				else
				c.x = this.x + ( i / ( this.GetDriverSlotsCount() - 1 ) ) * ( this._hitbox_x2 - this._hitbox_x1 );
				
				if ( c.CanMoveWithoutOverlap( c.x, this.y + this._hitbox_y1 - c._hitbox_y2, 0 ) )
				c.y = this.y + this._hitbox_y1 - c._hitbox_y2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this._hitbox_x1 - c._hitbox_x2, c.y, 0 ) )
				c.x = this.x + this._hitbox_x1 - c._hitbox_x2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this._hitbox_x2 - c._hitbox_x1, c.y, 0 ) )
				c.x = this.x + this._hitbox_x2 - c._hitbox_x1;
				else
				if ( c.CanMoveWithoutOverlap( this.x, c.y + this._hitbox_y2 - c._hitbox_y1, 0 ) )
				c.y = this.y + this._hitbox_y2 - c._hitbox_y1;
		
				c.PhysWakeUp();
				
				if ( c._socket )
				c._socket.SDServiceMessage( 'Leaving vehicle' );
		
				return;
			}
		}
		
		if ( c._socket )
		c._socket.SDServiceMessage( 'Error: Attempted leaving vehicle in which character is not located.' );
	}*/
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
				sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
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
		return this.type === sdHover.TYPE_BIKE ? 150 : 
			   this.type === sdHover.TYPE_TANK ? 2000 : 
			   this.type === sdHover.TYPE_FIGHTER_HOVER ? 1200 : 
			   500; 
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
			
			if ( this.matter >= cost )
			{
				this.matter -= cost;
				
				let di = Math.max( 1, sdWorld.Dist2D_Vector( this.driver0.act_x, this.driver0.act_y ) );

				let force = 0.2;

				this.sy += sdWorld.gravity * 0.2 * GSPEED;
			
				let x_force = this.driver0.act_x / di * force;
				let y_force = this.driver0.act_y / di * force; 

				this.sx += x_force * GSPEED;
				this.sy += y_force * GSPEED;

				this._tilt = sdWorld.MorphWithTimeScale( this._tilt, ( this.driver0.act_x ) * Math.PI / 4 * 100, 0.93, GSPEED );

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

			if ( this.driver0 && this.type === 3 && this._bullets_reload <= 0 )
			{
				if ( this.driver0._key_states.GetKey( 'Mouse1' ) )
				{
					sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:1.5 });

					let bullet_obj = new sdBullet({ x: this.x, y: this.y });

					bullet_obj._owner = this.driver0;
					bullet_obj._owner2 = this;

					let an = this.driver0.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.05;

					bullet_obj.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj.x += bullet_obj.sx * 5;
					bullet_obj.y += 5 + bullet_obj.sy * 5;

					bullet_obj.sx *= 15;
					bullet_obj.sy *= 15;
					
					bullet_obj.sx += this.sx;
					bullet_obj.sy += this.sy;

					bullet_obj._damage = 13.5 * 2;

					bullet_obj.color = '#ffaa00';

					bullet_obj._rail = false;
					

					//bullet_obj._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj._armor_penetration_level = 0;

					let cost = sdGun.GetProjectileCost( bullet_obj, 1, 0 );
					
					if ( this.matter >= cost )
					{
						this.matter -= cost;

						sdEntity.entities.push( bullet_obj );

						this._bullets_reload = 1.5;

						this._bullets--;
					}
					else
					{
						bullet_obj.onRemoveAsFakeEntity();
						bullet_obj._remove();
						
						if ( this.driver0._socket )
						this.driver0._socket.SDServiceMessage( 'Out of matter' );
					
						sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
						this._bullets_reload = 30;
					}
				}

				if ( this._bullets <= 0 || ( this._bullets < 300 && this.driver0._key_states.GetKey( 'KeyR' ) ) )
				{
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:1, pitch:0.6 });
					this._bullets = 100;
					this._bullets_reload = 60;
				}
			}
		
			if ( this.driver1 )
			if ( this._bullets_reload <= 0 )
			{
				if ( this.driver1._key_states.GetKey( 'Mouse1' ) )
				{
					if ( this.type === 1 )
					sdSound.PlaySound({ name:'cube_attack', x:this.x, y:this.y, volume:0.33, pitch:1.5 });
					else
					if ( this.type === 2 )
					sdSound.PlaySound({ name:'cube_attack', x:this.x, y:this.y, volume:0.33, pitch:0.5 });
					else
					sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:1.5 });

					let bullet_obj = new sdBullet({ x: this.x, y: this.y });

					bullet_obj._owner = this.driver1;
					bullet_obj._owner2 = this;

					let an;
					if ( this.type === 1 )
					an = this.driver1.GetLookAngle();
					else
					if ( this.type === 2 )
					an = this.driver1.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.07;
					else
					an = this.driver1.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.05;

					bullet_obj.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj.x += bullet_obj.sx * 5;
					bullet_obj.y += bullet_obj.sy * 5;

					bullet_obj.sx *= 15;
					bullet_obj.sy *= 15;

					if ( this.type === 1 )
					bullet_obj._damage = 23 * 2;
					else
					if ( this.type === 2 )
					bullet_obj._damage = 16 * 2;
					else
					bullet_obj._damage = 13.5 * 2;

					if ( this.type === 1 )
					bullet_obj.color = '#800000';
					else
					if ( this.type === 2 )
					bullet_obj.color = '#ff0000';
					else
					bullet_obj.color = '#ffaa00';

					if ( this.type === 1 )
					bullet_obj._rail = true;
					else
					if ( this.type === 2 )
					bullet_obj._rail = true;
					else
					bullet_obj._rail = false;
				
				
					
					if ( !bullet_obj._rail )
					{
						bullet_obj.sx += this.sx;
						bullet_obj.sy += this.sy;
					}
					

					if ( this.type === 2 )
					bullet_obj.explosion_radius = 7 * 1.5;
					else
					bullet_obj.explosion_radius = null;
					
					//bullet_obj._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj._armor_penetration_level = 0;
				
					let cost = sdGun.GetProjectileCost( bullet_obj, 1, 0 );
					
					if ( this.matter >= cost )
					{
						this.matter -= cost;
						
						sdEntity.entities.push( bullet_obj );

						if ( this.type === 2 )
						this._bullets_reload = 2;
						else
						this._bullets_reload = 1.5;

						this._bullets--;
					}
					else
					{
						bullet_obj.onRemoveAsFakeEntity();
						bullet_obj._remove();
						
						if ( this.driver1._socket )
						this.driver1._socket.SDServiceMessage( 'Out of matter' );
					
						sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
						this._bullets_reload = 30;
					}
				}

				if ( this._bullets <= 0 || ( this._bullets < 300 && this.driver1._key_states.GetKey( 'KeyR' ) ) )
				{
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:1, pitch:0.6 });
					this._bullets = 300;
					this._bullets_reload = 60;
				}
			}
			
		
			if ( this.driver2 )
			if ( this._rockets_reload <= 0 )
			{
				if ( this.driver2._key_states.GetKey( 'Mouse1' ) )
				{
					if ( this.type === 2 )
					sdSound.PlaySound({ name:'gun_sniper', x:this.x, y:this.y, volume:1, pitch:0.5 });
					else
					sdSound.PlaySound({ name:'gun_rocket', x:this.x, y:this.y, volume:1, pitch:0.5 });

					let bullet_obj = new sdBullet({ x: this.x, y: this.y });

					bullet_obj._owner = this.driver2;
					bullet_obj._owner2 = this;

					let an;
					if ( this.type === 1 )
					an = this.driver2.GetLookAngle();
					else
					if ( this.type === 2 )
					an = this.driver2.GetLookAngle();
					else
					an = this.driver2.GetLookAngle() + ( Math.random() * 2 - 1 ) * 0.05;

					bullet_obj.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj.x += bullet_obj.sx * 5;
					bullet_obj.y += bullet_obj.sy * 5;

					bullet_obj.sx *= 15;
					bullet_obj.sy *= 15;

					if ( this.type === 1 )
					bullet_obj.model = 'f_hover_rocket';
					else
					bullet_obj.model = 'rocket_proj';

					if ( this.type === 1 )
					bullet_obj._damage = 35 * 2 * 2;
					else
					if ( this.type === 2 )
					bullet_obj._damage = 350 * 2;
					else
					bullet_obj._damage = 19 * 2 * 2;

					if ( this.type === 1 )
					bullet_obj.explosion_radius = 30 * 1.5;
					else
					if ( this.type === 2 )
					bullet_obj.explosion_radius = 45 * 1.5;
					else
					bullet_obj.explosion_radius = 19 * 1.5;

					if ( this.type === 1 )
					bullet_obj.color = '#ffca9e';
					else
					if ( this.type === 2 )
					bullet_obj.color = '#80ffff';
					else
					bullet_obj.color = '#7acaff';

					if ( this.type === 2 )
					bullet_obj._rail = true;
					else
					bullet_obj._rail = false;
					
					bullet_obj.ac = 1;
					
					if ( bullet_obj.ac > 0 )
					{
						bullet_obj.acx = Math.cos( Math.PI / 2 - an );
						bullet_obj.acy = Math.sin( Math.PI / 2 - an );
					}
					

					//bullet_obj._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj._armor_penetration_level = 0;

					let cost = sdGun.GetProjectileCost( bullet_obj, 1, 0 );
					
					if ( this.matter >= cost )
					{
						this.matter -= cost;
						
						sdEntity.entities.push( bullet_obj );

						if ( this.type === 2 )
						this._rockets_reload = 50;
						else
						if ( this.type === 1 )
						this._rockets_reload = 3;
						else
						this._rockets_reload = 5;

						this._rockets--;
					}
					else
					{
						bullet_obj.onRemoveAsFakeEntity();
						bullet_obj._remove();
						
						if ( this.driver2._socket )
						this.driver2._socket.SDServiceMessage( 'Out of matter' );
					
						sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
						this._bullets_reload = 30;
					}
				}

				if ( this._rockets <= 0 || ( this._rockets < 2 && this.driver2._key_states.GetKey( 'KeyR' ) ) )
				{
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:1, pitch:0.3 });
					if ( this.type === 2 )
					this._rockets = 1;
					else
					this._rockets = 2;
					this._rockets_reload = 60;
				}
			}
		}
		
		sdWorld.last_hit_entity = null;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 5 );
	}
	
	get friction_remain()
	{ return /*this.type === 3 ? 0.6 :*/ this.driver0 ? 0.95 : 0.8; } // I don't know if Hoverbike is needed in this case
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea <= 0 )
		return;
	
		if ( this.nick !== '' )
		sdEntity.Tooltip( ctx, this.nick );
		else
		if ( this.type === 1 )
		sdEntity.Tooltip( ctx, "Fighter Hover" );
		else
		if ( this.type === 2 )
		sdEntity.Tooltip( ctx, "Tank SD-7" );
		else
		if ( this.type === 3 )
		sdEntity.Tooltip( ctx, "Hoverbike" );
		else
		sdEntity.Tooltip( ctx, "Hover" );
		
		let w = this.type === 3 ? 20 : 40;
	
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
			if ( this.type !== 3 )
			ctx.scale( 0.5, 0.5 );
		}
		
		ctx.rotate( this._tilt / 100 );

		let xx; // Let it be undefined first
		//let yy = 0;

		let xyoffset = 32;
		let image = sdHover.img_hover;

		let width = 64;

		if ( this.type === sdHover.TYPE_FIGHTER_HOVER )
		image = sdHover.img_f_hover;

		if ( this.type === sdHover.TYPE_TANK )
		image = sdHover.img_tank_hover;

		if ( this.type === sdHover.TYPE_BIKE )
		{
			xyoffset = 16;
			width = 32;
			
			image = sdHover.img_hoverbike;
		}
		
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

						ctx.scale( -0.8, 0.8 );

						if ( this.type === 3 )
						ctx.translate( 1, -4 );
						else
						ctx.translate( ( -32 + ( 1 - i / ( this.GetDriverSlotsCount() - 1 ) ) * 64 ) * 0.5, 3 );

						this[ 'driver' + i ].Draw( ctx, true );

						this[ 'driver' + i ].look_x = old_x;
						this[ 'driver' + i ].look_y = old_y;
					}
					ctx.restore();
				}
			}
		};
		
		if ( this.type !== 3 )
		DrawDrivers();
		
		ctx.filter = this.filter;
		
		let can_boost = !!this.driver0;
		
		if ( !sdShop.isDrawing )
		if ( this.matter <= 1 )
		if ( this.hea > 0 )
		{
			ctx.filter += 'brightness(0.1)';
			can_boost = false;
		}
		
		let DelayedDrawGun = ()=>
		{
		};
		
		if ( this.hea > 0 )
		{
			if ( this.type === 2 )
			xx = this.driver2 ? 3 : can_boost ? 1 : 0;
			else
			xx = can_boost ? 1 : 0;
			/*if ( this.type === 1 )
			ctx.drawImageFilterCache( can_boost ? sdHover.img_f_hover_boost : sdHover.img_f_hover, - 32, - 16, 64,32 );
			else
			if ( this.type === 2 )
			ctx.drawImageFilterCache( this.driver2 ? sdHover.img_tank_hover_driver2 : can_boost ? sdHover.img_tank_hover_boost : sdHover.img_tank_hover, - 32, - 16, 64,32 );
			else
			if ( this.type === 3 )
			ctx.drawImageFilterCache( can_boost ? sdHover.img_hoverbike_boost : sdHover.img_hoverbike, - 16, - 16, 32, 32 );
			else
			ctx.drawImageFilterCache( can_boost ? sdHover.img_hover_boost : sdHover.img_hover, - 32, - 16, 64,32 );*/
			
			if ( this.guns )
			{
				var i;

				DelayedDrawGun = ()=>
				{
					let i = 0;
					if ( this[ 'driver' + i ] && this.type === 3 )
					{
						ctx.save();

						ctx.translate( -1, 7 );
						ctx.scale( 1, -1 );

						ctx.rotate( ( ( this._tilt > 0 ) ? Math.PI : 0 ) + Math.sign( this._tilt ) * ( -this._tilt / 100 + Math.atan2( this[ 'driver' + i ].look_y - this.y, this[ 'driver' + i ].look_x - this.x ) ) );

						ctx.drawImageFilterCache( sdHover.img_hover_mg, - 16, - 16, 32,32 );

						ctx.restore();
					}
				};

				i = 1;
				if ( this[ 'driver' + i ] )
				{
					ctx.save();

					ctx.translate( -1, 10 );
					ctx.scale( 1, -1 );

					ctx.rotate( ( ( this._tilt > 0 ) ? Math.PI : 0 ) + Math.sign( this._tilt ) * ( -this._tilt / 100 + Math.atan2( this[ 'driver' + i ].look_y - this.y, this[ 'driver' + i ].look_x - this.x ) ) );

					if ( this.type === 1 )
					ctx.drawImageFilterCache( sdHover.img_f_hover_mg, - 16, - 16, 32,32 );
					else
					if ( this.type === 2 )
					ctx.drawImageFilterCache( sdHover.img_tank_rl, - 16, - 16, 32,32 );
					else
					ctx.drawImageFilterCache( sdHover.img_hover_mg, - 16, - 16, 32,32 );

					ctx.restore();
				}
				i = 2;
				if ( this[ 'driver' + i ] )
				{
					ctx.save();

					ctx.translate( 9, -11 );
					ctx.scale( 1, -1 );

					ctx.rotate( ( ( this._tilt > 0 ) ? Math.PI : 0 ) + Math.sign( this._tilt ) * ( -this._tilt / 100 + Math.atan2( this[ 'driver' + i ].look_y - this.y, this[ 'driver' + i ].look_x - this.x ) ) );

					if ( this.type === 1 )
					ctx.drawImageFilterCache( sdHover.img_f_hover_rl, - 16, - 16, 32,32 );
					else
					if ( this.type === 2 )
					ctx.drawImageFilterCache( sdHover.img_tank_turret, - 16, - 16, 64,32 );
					else
					ctx.drawImageFilterCache( sdHover.img_hover_rl, - 16, - 16, 32,32 );

					ctx.restore();
				}
			}
		}
		else
		if ( this.type !== -1 )
		xx = 2;
		/*if ( this.type === 1 )
		ctx.drawImageFilterCache( sdHover.img_f_hover_broken, - 32, - 16, 64,32 );
		else
		if ( this.type === 2 )
		ctx.drawImageFilterCache( sdHover.img_tank_hover_broken, - 32, - 16, 64,32 );
		else
		if ( this.type === 3 )
		ctx.drawImageFilterCache( sdHover.img_hoverbike_broken, - 16, - 16, 32, 32 );
		else
		ctx.drawImageFilterCache( sdHover.img_hover_broken, - 32, - 16, 64,32 );*/

		ctx.drawImageFilterCache( image, xx * width, 0, width,32, - xyoffset, -16, width,32 );
		
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		
		if ( this.type === 3 )
		DrawDrivers();
		
		DelayedDrawGun();
	
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
		if ( this._broken || sdLongRangeTeleport.teleported_items.has( this ) || !sdWorld.is_server )
		{
			this.ExcludeAllDrivers();
		}
		
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		}
		else
		{
			this.RemoveAllDrivers();
		}
	}
	MeasureMatterCost()
	{
		// Old method
		/*if ( this.type === 1 )
		return this.hmax * sdWorld.damage_to_matter + 1300;
		else
		if ( this.type === 2 )
		return this.hmax * sdWorld.damage_to_matter + 2000;
		else
		if ( this.type === 3 )
		return this.hmax * sdWorld.damage_to_matter + 550;
		else
		return this.hmax * sdWorld.damage_to_matter + 800;*/
		
		// New method, same as the old one but better
		return this.type === 1 ? this.hmax * sdWorld.damage_to_matter + 1300 :
			this.type === 2 ? this.hmax * sdWorld.damage_to_matter + 2000 :
			this.type === 3 ? this.hmax * sdWorld.damage_to_matter + 550 :
			this.hmax * sdWorld.damage_to_matter + 800;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		//if ( exectuter_character._god || this.inRealDist2DToEntity_Boolean( exectuter_character, 64 ) )
		//if ( exectuter_character.canSeeForUse( this ) )
		if ( exectuter_character._god || exectuter_character.driver_of === this )
		{
			let v = this.doors_locked;
			
			if ( command_name === 'UNLOCK' )
			v = false;
			if ( command_name === 'LOCK' )
			v = true;
		
			if ( v !== this.doors_locked )
			{
				this.doors_locked = v;
				sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.5, pitch:1.5 });
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		//if ( exectuter_character._god || this.inRealDist2DToEntity_Boolean( exectuter_character, 64 ) )
		//if ( exectuter_character.canSeeForUse( this ) )
		if ( exectuter_character._god || exectuter_character.driver_of === this )
		{
			if ( this.doors_locked )
			this.AddContextOption( 'Unlock doors', 'UNLOCK', [] );
			else
			this.AddContextOption( 'Lock doors', 'LOCK', [] );
		}
	}
}
//sdHover.init_class();

export default sdHover;
