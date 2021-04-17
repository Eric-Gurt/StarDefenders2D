
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';

import sdCharacter from './sdCharacter.js';
import sdVirus from './sdVirus.js';
import sdQuickie from './sdQuickie.js';
import sdCrystal from './sdCrystal.js';

class sdHover extends sdEntity
{
	static init_class()
	{
		sdHover.img_hover = sdWorld.CreateImageFromFile( 'hover' );
		sdHover.img_hover_boost = sdWorld.CreateImageFromFile( 'hover_boost' );
		sdHover.img_hover_broken = sdWorld.CreateImageFromFile( 'hover_broken' );
		
		sdHover.img_hover_mg = sdWorld.CreateImageFromFile( 'hover_mg' );
		sdHover.img_hover_rl = sdWorld.CreateImageFromFile( 'hover_rl' );
		
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
	get hitbox_x1() { return -26; }
	get hitbox_x2() { return 26; }
	get hitbox_y1() { return -9; }
	get hitbox_y2() { return 10; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdCharacter' ];
	}*/
	
	IsVehicle() // Mostly defines damage from rockets multiplier so far
	{
		return true;
	}
	
	Impact( vel ) // fall damage basically
	{
		if ( vel > 5 )
		{
			this.Damage( ( vel - 3 ) * 45 );
		}
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 600;
		this.hea = this.hmax;
		
		this._tilt = 0;
		
		this._bullets = 300;
		this._bullets_reload = 0;
		
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
			c._socket.emit('SERVICE_MESSAGE', sdHover.slot_hints[ best_slot ] );
		
			if ( best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1 });
		}
		else
		{
			if ( c._socket )
			c._socket.emit('SERVICE_MESSAGE', 'All slots are occupied' );
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
				
				c.x = this.x + ( i / ( sdHover.driver_slots - 1 ) ) * ( this.hitbox_x2 - this.hitbox_x1 );
				
				if ( c.CanMoveWithoutOverlap( c.x, this.y + this.hitbox_y1 - c.hitbox_y2, 1 ) )
				c.y = this.y + this.hitbox_y1 - c.hitbox_y2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this.hitbox_x1 - c.hitbox_x2, c.y, 1 ) )
				c.x = this.x + this.hitbox_x1 - c.hitbox_x2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this.hitbox_x2 - c.hitbox_x1, c.y, 1 ) )
				c.x = this.x + this.hitbox_x2 - c.hitbox_x1;
		
				c.PhysWakeUp();
				
				if ( c._socket )
				c._socket.emit('SERVICE_MESSAGE', 'Leaving vehicle' );
		
				return;
			}
		}
		
		if ( c._socket )
		c._socket.emit('SERVICE_MESSAGE', 'Error: Attempted leaving vehicle in which character is not located.' );
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
			if ( old_hea > 0 )
			{
				sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
				
				for ( var i = 0; i < sdHover.driver_slots; i++ )
				if ( this[ 'driver' + i ] )
				this.ExcludeDriver( this[ 'driver' + i ] );
				
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
								can_hit_owner: false,
								color: sdEffect.default_explosion_color 
							});
						}
					}, i * 150 );
				}
			}
			
			if ( this.hea <= -400 )
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
	
	get mass() { return 500; }
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
					sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:1.5 });

					let bullet_obj = new sdBullet({ x: this.x, y: this.y });

					bullet_obj._owner = this;

					let an = this.driver1._an + ( Math.random() * 2 - 1 ) * 0.05;

					bullet_obj.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj.x += bullet_obj.sx * 5;
					bullet_obj.y += bullet_obj.sy * 5;

					bullet_obj.sx *= 15;
					bullet_obj.sy *= 15;
					
					bullet_obj.sx += this.sx;
					bullet_obj.sy += this.sy;

					bullet_obj._damage = 10;
					bullet_obj.color = '#ffaa00';

					sdEntity.entities.push( bullet_obj );

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
					sdSound.PlaySound({ name:'gun_rocket', x:this.x, y:this.y, volume:1, pitch:0.5 });

					let bullet_obj = new sdBullet({ x: this.x, y: this.y });

					bullet_obj._owner = this;

					let an = this.driver2._an + ( Math.random() * 2 - 1 ) * 0.05;

					bullet_obj.sx = Math.cos( Math.PI / 2 - an );
					bullet_obj.sy = Math.sin( Math.PI / 2 - an );
					bullet_obj.x += bullet_obj.sx * 5;
					bullet_obj.y += bullet_obj.sy * 5;

					bullet_obj.sx *= 15;
					bullet_obj.sy *= 15;
					
					bullet_obj.model = 'rocket_proj';

					bullet_obj._damage = 19 * 2;
					bullet_obj.explosion_radius = 19 * 1.5;
					bullet_obj.color = '#7acaff';
					
					bullet_obj.ac = 1;
					
					if ( bullet_obj.ac > 0 )
					{
						bullet_obj.acx = Math.cos( Math.PI / 2 - an );
						bullet_obj.acy = Math.sin( Math.PI / 2 - an );
					}

					sdEntity.entities.push( bullet_obj );

					this._rockets_reload = 5;

					this._rockets--;
				}

				if ( this._rockets <= 0 || ( this._rockets < 2 && this.driver2._key_states.GetKey( 'KeyR' ) ) )
				{
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:1, pitch:0.3 });
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
	
		sdEntity.Tooltip( ctx, "Hover" );
		
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	Draw( ctx, attached )
	{
		ctx.rotate( this._tilt / 100 );
		
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
					this[ 'driver' + i ]._an = 0; // Hack
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
			ctx.drawImageFilterCache( this.driver0 ? sdHover.img_hover_boost : sdHover.img_hover, - 32, - 16, 64,32 );
	
	        var i = 0;

            i = 1;
			if ( this[ 'driver' + i ] )
			{
				ctx.save();

				ctx.translate( -1, 10 );
				ctx.scale( 1, -1 );

                ctx.rotate( ( ( this._tilt > 0 ) ? Math.PI : 0 ) + Math.sign( this._tilt ) * ( -this._tilt / 100 + Math.atan2( this[ 'driver' + i ].look_y - this.y, this[ 'driver' + i ].look_x - this.x ) ) );

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

				ctx.drawImageFilterCache( sdHover.img_hover_rl, - 16, - 16, 32,32 );

				ctx.restore();
			}
		}
		else
		ctx.drawImageFilterCache( sdHover.img_hover_broken, - 32, - 16, 64,32 );
		
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
			
		for ( var i = 0; i < sdHover.driver_slots; i++ )
		if ( this[ 'driver' + i ] )
		this.ExcludeDriver( this[ 'driver' + i ] );
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return this.hmax * sdWorld.damage_to_matter + 800;
	}
}
//sdHover.init_class();

export default sdHover;