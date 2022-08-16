
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';

import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';

class sdHover extends sdEntity
{
	static init_class()
	{
		sdHover.img_hover = sdWorld.CreateImageFromFile( 'hover_sheet' );

		/*sdHover.img_hover = sdWorld.CreateImageFromFile( 'hover' );
		sdHover.img_hover_boost = sdWorld.CreateImageFromFile( 'hover_boost' );
		sdHover.img_hover_broken = sdWorld.CreateImageFromFile( 'hover_broken' );

		sdHover.img_f_hover = sdWorld.CreateImageFromFile( 'f_hover' );
		sdHover.img_f_hover_boost = sdWorld.CreateImageFromFile( 'f_hover_boost' );
		sdHover.img_f_hover_broken = sdWorld.CreateImageFromFile( 'f_hover_broken' );*/
		
		sdHover.img_tank_hover = sdWorld.CreateImageFromFile( 'tank' ); // image by lazyrain
		sdHover.img_tank_hover_boost = sdWorld.CreateImageFromFile( 'tank_hover_boost' ); // image by lazyrain
		sdHover.img_tank_hover_broken = sdWorld.CreateImageFromFile( 'tank_destroyed' );
		sdHover.img_tank_with_turret = sdWorld.CreateImageFromFile( 'tank_with_turret' ); // image by lazyrain
		sdHover.img_tank_hover_driver2= sdWorld.CreateImageFromFile( 'tank_hover_driver2' ); // image by lazyrain

		sdHover.img_hover_mg = sdWorld.CreateImageFromFile( 'hover_mg' );
		sdHover.img_hover_rl = sdWorld.CreateImageFromFile( 'hover_rl' );

		sdHover.img_f_hover_mg = sdWorld.CreateImageFromFile( 'f_hover_railgun' );
		sdHover.img_f_hover_rl = sdWorld.CreateImageFromFile( 'f_hover_rl' );


		sdHover.img_tank_turret = sdWorld.CreateImageFromFile( 'tank_turret' );
		sdHover.img_tank_rl = sdWorld.CreateImageFromFile( 'tank_railgun' );
		
		sdHover.driver_slots = 6;
		
		sdHover.slot_hints = [
			'Entered slot 1: Driver',
			'Entered slot 2: Minigun operator',
			'Entered slot 3: Rocket launcher operator',
			'Entered slot 4: Passenger',
			'Entered slot 5: Passenger',
			'Entered slot 6: Passenger'
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === 2 ? -27 : -26; }
	get hitbox_x2() { return this.type === 2 ? 27 : 26; }
	get hitbox_y1() { return this.type === 2 ? -12 : -9; }
	get hitbox_y2() { return this.type === 2 ? 12 : 10; }
	
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
	IsVehicle()
	{
		return true;
	}
	
	Impact( vel ) // fall damage basically
	{
		if ( vel > 5 )
		{
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
		
		this.hmax = ( this.type === 1 ? 1200 : this.type === 2 ? 5000 : 600 ) * 4;
		this.hea = this.hmax;
		
		this._tilt = 0;
		
		if ( this.type === 2 )
		this._bullets = 200;
		else
		this._bullets = 300;

		this._bullets_reload = 0;
		
		if ( this.type === 2 )
		this._rockets = 1;
		else
		this._rockets = 2;

		this._rockets_reload = 0;
		
		this._regen_timeout = 0;
		
		this.filter = params.filter || 'none';
		
		// 6 slots
		this.driver0 = null; // movement
		this.driver1 = null; // minigun
		this.driver2 = null; // rockets
		this.driver3 = null; // passenger
		this.driver4 = null; // passenger
		this.driver5 = null; // passenger
	}
	AddDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
	
		var best_slot = -1;
		
		for ( var i = 0; i < sdHover.driver_slots; i++ )
		//for ( var i = 2; i < sdHover.driver_slots; i++ ) // Hack
		{
			if ( this[ 'driver' + i ] === null )
			{
				best_slot = i;
				break;
			}
		}
		
		if ( best_slot >= 0 )
		{
			this[ 'driver' + best_slot ] = c;
			
			c.driver_of = this;
			
			if ( c._socket )
			c._socket.SDServiceMessage( sdHover.slot_hints[ best_slot ] );
		
			if ( best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1 });
		}
		else
		{
			if ( c._socket )
			c._socket.SDServiceMessage( 'All slots are occupied' );
		}
	}
	ExcludeDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
		
		for ( var i = 0; i < sdHover.driver_slots; i++ )
		{
			if ( this[ 'driver' + i ] === c )
			{
				this[ 'driver' + i ] = null;
				c.driver_of = null;
				
				c.x = this.x + ( i / ( sdHover.driver_slots - 1 ) ) * ( this._hitbox_x2 - this._hitbox_x1 );
				
				if ( c.CanMoveWithoutOverlap( c.x, this.y + this._hitbox_y1 - c._hitbox_y2, 1 ) )
				c.y = this.y + this._hitbox_y1 - c._hitbox_y2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this._hitbox_x1 - c._hitbox_x2, c.y, 1 ) )
				c.x = this.x + this._hitbox_x1 - c._hitbox_x2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this._hitbox_x2 - c._hitbox_x1, c.y, 1 ) )
				c.x = this.x + this._hitbox_x2 - c._hitbox_x1;
		
				c.PhysWakeUp();
				
				if ( c._socket )
				c._socket.SDServiceMessage( 'Leaving vehicle' );
		
				return;
			}
		}
		
		if ( c._socket )
		c._socket.SDServiceMessage( 'Error: Attempted leaving vehicle in which character is not located.' );
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let old_hea = this.hea;
		
		this.hea -= dmg;

		if ( this.hea <= 0 )
		{
			const break_at_hp = -400;
			
			if ( old_hea > 0 )
			{
				sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
				
				for ( var i = 0; i < sdHover.driver_slots; i++ )
				if ( this[ 'driver' + i ] )
				{
					let driver = this[ 'driver' + i ];
					
					this.ExcludeDriver( this[ 'driver' + i ] );
					
					if ( this.hea <= break_at_hp )
					{
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
		
		sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
	}
	
	get mass() { return this.type === 2 ? 2500 : this.type === 1 ? 1200 : 500; }
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
				if ( this.driver0 )
				this.hea = Math.min( this.hea + GSPEED / 3, this.hmax );
				else
				this.hea = Math.min( this.hea + GSPEED, this.hmax );
			}
		}
		
		if ( this.driver0 && this.hea > 0 )
		{
			this.sy += sdWorld.gravity * 0.2 * GSPEED;
			
			let di = Math.max( 1, sdWorld.Dist2D_Vector( this.driver0.act_x, this.driver0.act_y ) );
			
			let x_force = this.driver0.act_x / di * 0.2;
			let y_force = this.driver0.act_y / di * 0.2; 
			
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
			this.sy += sdWorld.gravity * GSPEED;
			this._tilt = sdWorld.MorphWithTimeScale( this._tilt, 0, 0.93, GSPEED );
			
			if ( Math.abs( this._tilt ) < 1 )
			this._tilt = ( this._tilt > 0 ? 1 : -1 );
		}
		
		if ( sdWorld.is_server && this.hea > 0 )
		{
			if ( this._bullets_reload > 0 )
			this._bullets_reload -= GSPEED;
		
			if ( this._rockets_reload > 0 )
			this._rockets_reload -= GSPEED;
		
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
					
					if ( this.type !== 2 )
					{
						bullet_obj.sx += this.sx;
						bullet_obj.sy += this.sy;
					}

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

					if ( this.type === 2 )
					bullet_obj.explosion_radius = 7 * 1.5;
					else
					bullet_obj.explosion_radius = null;
					
					//bullet_obj._damage *= bullet_obj._owner._damage_mult;

					if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
					bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
					else
					bullet_obj._armor_penetration_level = 0;

					sdEntity.entities.push( bullet_obj );

					if ( this.type === 2 )
					this._bullets_reload = 2;
					else
					this._bullets_reload = 1.5;

					this._bullets--;
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
	{ return this.driver0 ? 0.95 : 0.8; }
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea <= 0 )
		return;
	
		if ( this.type === 1 )
		sdEntity.Tooltip( ctx, "Fighter Hover" );
		else
		if ( this.type === 2 )
		sdEntity.Tooltip( ctx, "Tank SD-7" );
		else
		sdEntity.Tooltip( ctx, "Hover" );
		
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	Draw( ctx, attached )
	{
		if ( sdShop.isDrawing )
		{
			ctx.scale( 0.5, 0.5 );
		}
		
		ctx.rotate( this._tilt / 100 );

		let xx = 0;
		let yy = 0;
		
		if ( this._tilt > 0 )
		{
			ctx.scale( -1, 1 );
		}
		
		for ( var i = 0; i < sdHover.driver_slots; i++ )
		{
			if ( this[ 'driver' + i ] )
			{
				ctx.save();
				{
					let old_x = this[ 'driver' + i ].look_x;
					let old_y = this[ 'driver' + i ].look_y;
					//this[ 'driver' + i ].tilt = 0;
					//this[ 'driver' + i ]._an = 0; // Hack
					this[ 'driver' + i ]._side = 1;
					this[ 'driver' + i ].look_x = this[ 'driver' + i ].x + 100;
					this[ 'driver' + i ].look_y = this[ 'driver' + i ].y;
					
					ctx.scale( -0.8, 0.8 );
					ctx.translate( ( -32 + ( 1 - i / ( sdHover.driver_slots - 1 ) ) * 64 ) * 0.5, 3 );
					//this[ 'driver' + i ].Draw( ctx, true );
					this[ 'driver' + i ].Draw( ctx, true ); // Hack

					this[ 'driver' + i ].look_x = old_x;
					this[ 'driver' + i ].look_y = old_y;
				}
				ctx.restore();
			}
		}
		
		ctx.filter = this.filter;
		
		if ( this.hea > 0 )
		{
			if ( this.type === 1 )
			xx = Math.min( ( this.driver0 ) ? 1 : 0 ),yy = 1;
			//ctx.drawImageFilterCache( this.driver0 ? sdHover.img_f_hover_boost : sdHover.img_f_hover, - 32, - 16, 64,32 );
			else
			if ( this.type === 2 )
			ctx.drawImageFilterCache( this.driver2 ? sdHover.img_tank_hover_driver2 : this.driver0 ? sdHover.img_tank_hover_boost : sdHover.img_tank_hover, - 32, - 16, 64,32 );
			else
			xx = Math.min( ( this.driver0 ) ? 1 : 0 );
			//ctx.drawImageFilterCache( this.driver0 ? sdHover.img_hover_boost : sdHover.img_hover, - 32, - 16, 64,32 );
	
	        var i = 0;

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
		else
		if ( this.type === 1 )
		xx = 2,yy = 1;
		//ctx.drawImageFilterCache( sdHover.img_f_hover_broken, - 32, - 16, 64,32 );
		else
		if ( this.type === 2 )
		ctx.drawImageFilterCache( sdHover.img_tank_hover_broken, - 32, - 16, 64,32 );
		else
		xx = 2;
		//ctx.drawImageFilterCache( sdHover.img_hover_broken, - 32, - 16, 64,32 );

		ctx.drawImageFilterCache( sdHover.img_hover, xx * 64, yy * 32, 64,32, -32, -16, 64,32 )
		
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
			
			for ( var i = 0; i < sdHover.driver_slots; i++ )
			if ( this[ 'driver' + i ] )
			this.ExcludeDriver( this[ 'driver' + i ] );
		}
		else
		{
			for ( var i = 0; i < sdHover.driver_slots; i++ )
			if ( this[ 'driver' + i ] )
			{
				this[ 'driver' + i ].remove();
			}
		}
	}
	MeasureMatterCost()
	{
		if ( this.type === 1 )
		return this.hmax * sdWorld.damage_to_matter + 1300;
		else
		if ( this.type === 2 )
		return this.hmax * sdWorld.damage_to_matter + 2000;
		else
		return this.hmax * sdWorld.damage_to_matter + 800;
	}
}
//sdHover.init_class();

export default sdHover;
