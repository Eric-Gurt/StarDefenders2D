
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';

import sdCharacter from './sdCharacter.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';

class sdQuadro extends sdEntity
{
	static init_class()
	{
		sdQuadro.img_quadro = sdWorld.CreateImageFromFile( 'sdQuadro' );
		
		sdQuadro.PART_BODY = 0;
		sdQuadro.PART_WHEEL = 1;
		
		sdQuadro.driver_slots = 1;
		
		sdQuadro.slot_hints = [
			'Entered slot 1: Driver'
		];
		
		// Could be better with filtering
		//sdQuadro.ignoring_body = [ 'sdQuadro' ];
		//sdQuadro.ignoring_wheels = [ 'sdQuadro' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( this.part === 1 ) ? -4 : -9; }
	get hitbox_x2() { return ( this.part === 1 ) ? 4 : 9; }
	//get hitbox_y1() { return ( this.part === 1 ) ? -4 : ( this.driver0 && Math.sin( this._angle ) < 0 ? -16 : -4 ); }
	//get hitbox_y2() { return ( this.part === 1 ) ? ( this.hea <= 0 ? 2 : 4 ) : ( this.driver0 && Math.sin( this._angle ) > 0 ? 16 : 4 ); }
	get hitbox_y1() { return ( this.part === 1 ) ? -4 : -4; }
	get hitbox_y2() { return ( this.part === 1 ) ? ( this.hea <= 0 ? 2 : 4 ) : 4; }
	
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
		return ( this.part === 0 );
	}
	VehicleHidesLegs()
	{
		return false;
	}
	
	Impact( vel ) // fall damage basically
	{
		//if ( this.part === 1 ) // Wheels
		//{
			if ( vel > 8 ) // less fall damage
			{
				this.DamageWithEffect( ( vel - 3 ) * 7 );
			}
		/*}
		else
		if ( vel > 5 )
		{
			this.DamageWithEffect( ( vel - 3 ) * 45 );
		}*/
	}
	
	constructor( params )
	{
		super( params );
		
		//this._is_cable_priority = true;
		
		this.sx = 0;
		this.sy = 0;
		
		this._regen_timeout = 0;
		
		this.filter = params.filter || 'none';
		
		this.part = params.part || 0; // 0 for body, 1 for wheels
		
		this.w1 = null; // Wheels, if this is a main part
		this.w2 = null; // Wheels, if this is a main part
		this.p = null; // Main part, if this is a wheel
		
		this._spawn_wheels = 1; // Whether vehicle is just made or not. If it is just made - it will spawn wheels
		
		if ( this.part === 0 )
		{
			this.hmax = 200 * 4;
		}
		else
		{
			this.hmax = 130 * 4;
		}
		
		this.hea = this.hmax;
		
		this.side = 1;
		
		this._angle = 0;
		
		//this._last_hit_entity = null; // same as _phys_last_touch
		
		// 1 slot
		this.driver0 = null; // movement
		
		this.SetMethod( 'CustomFiltering', this.CustomFiltering ); // Here it used for "this" binding so method can be passed to collision logic

	}
	/*
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return ( this.part === 0 ) ? sdQuadro.ignoring_body : sdQuadro.ignoring_wheels;
	}
	*/
	GetDriverSlotsCount()
	{
		return sdQuadro.driver_slots;
	}
	AddDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
	
		var best_slot = -1;
		
		for ( var i = 0; i < sdQuadro.driver_slots; i++ )
		//for ( var i = 2; i < sdQuadro.driver_slots; i++ ) // Hack
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
			c._socket.SDServiceMessage( sdQuadro.slot_hints[ best_slot ] );
		
			//if ( best_slot === 0 )
			//sdSound.PlaySound({ name:'quadro_start', x:this.x, y:this.y, volume:1 });
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
		
		for ( var i = 0; i < sdQuadro.driver_slots; i++ )
		{
			if ( this[ 'driver' + i ] === c )
			{
				this[ 'driver' + i ] = null;
				c.driver_of = null;
				
				c.x = this.x;

				// Low ceiling case
				c._crouch_intens = 1;
				c._hitbox_y1 = c.hitbox_y1;
				c._hitbox_y2 = c.hitbox_y2;
				
				let y1 = this.y + this._hitbox_y1;
				
				if ( this.w1 && !this.w1._is_being_removed )
				y1 = Math.min( y1, this.w1.y + this.w1._hitbox_y1 );
				
				if ( this.w2 && !this.w2._is_being_removed )
				y1 = Math.min( y1, this.w2.y + this.w2._hitbox_y1 );
				
				if ( c.CanMoveWithoutOverlap( c.x, y1 - c._hitbox_y2, 1 ) )
				c.y = y1 - c._hitbox_y2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this._hitbox_x1 - c._hitbox_x2 - 7, c.y - 2, 1 ) )
				c.x = this.x + this._hitbox_x1 - c._hitbox_x2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this._hitbox_x2 - c._hitbox_x1 + 7, c.y - 2, 1 ) )
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
			const break_at_hp = -this.hmax;
			
			if ( this.part === 0 )
			if ( old_hea > 0 )
			{
				sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2, pitch:2 });
				
				for ( var i = 0; i < sdQuadro.driver_slots; i++ )
				if ( this[ 'driver' + i ] )
				{
					let driver = this[ 'driver' + i ];
					
					this.ExcludeDriver( this[ 'driver' + i ] );
					
					if ( this.hea <= break_at_hp )
					{
						driver.DamageWithEffect( 100 );
					}
				}
				
				let that = this;
				for ( var i = 0; i < 3; i++ )
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
								damage_scale: 0.3, 
								type: sdEffect.TYPE_EXPLOSION,
								owner: that,
								can_hit_owner: false,
								color: sdEffect.default_explosion_color 
							});
						}
					}, i * 150 );
				}
				
				setTimeout( ()=>
				{
					if ( this.w1 )
					this.w1.p = null;
				
					if ( this.w2 )
					this.w2.p = null;

					this.w1 = null;
					this.w2 = null;
				}, 2000 );
			}
			
			if ( this.hea <= break_at_hp )
			this.remove();
		}
		else
		{
			//if ( this.hea <= 100 && old_hea > 100 )
			//sdSound.PlaySound({ name:'quadro_lowhp', x:this.x, y:this.y, volume:1 });
		}
	
		this._regen_timeout = 90;
		
		if ( this.part === 0 )
		sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
	}
	
	//get mass() { return ( this.part === 0 ) ? 100 : 50; }
	get mass() { return 200 / 3; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.part === sdQuadro.PART_WHEEL )
		{
			if ( this.p )
			if ( this.p._is_being_removed )
			this.p = null;
	
			if ( this.p )
			{
				// Logic handled by parent
				if ( this.p._hiberstate === sdEntity.HIBERSTATE_HIBERNATED )
				{
					this.p.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					this.p.PhysWakeUp();
				}
			}
			else
			{
				this.Damage( GSPEED * 0.1 );
				
				this.sy += sdWorld.gravity * GSPEED;
				this.ApplyVelocityAndCollisions( GSPEED, 0, true, 0.25, this.CustomFiltering );
				
				if ( this._phys_sleep <= 0 )
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
			}
			return;
		}
		else
		{
			let driver = null;

			if ( GSPEED > 1 )
			GSPEED = 1;

			if ( this.driver0 )
			driver = this.driver0;
		
			let any_awake = false;
			let max_sleep_timer = 0;

			if ( this._spawn_wheels )
			{
				this._spawn_wheels = 0;

				if ( sdWorld.is_server )
				for ( let s = -1; s <= 1; s += 2 )
				{
					let wheel = new sdQuadro({ x: this.x + s * 7, y: this.y + 6, part: 1 });
					sdEntity.entities.push( wheel );

					wheel.p = this;

					if ( s === -1 )
					this.w1 = wheel;
					else
					this.w2 = wheel;
				}
			}

			if ( this.hea > 0 )
			{
				if ( this.w1 && !this.w1._is_being_removed )
				if ( this.w2 && !this.w2._is_being_removed )
				this._angle = Math.atan2( this.w1.x - this.w2.x, this.w1.y - this.w2.y );

				if ( driver )
				{
					//let di = Math.max( 1, sdWorld.Dist2D_Vector( driver.act_x, driver.act_y ) );

					//let x_force = driver.act_x / di * 0.2;
					//let y_force = driver.act_y / di * 0.2; 

					let x_force = -Math.sin( this._angle ) * driver.act_x * 0.6;
					let y_force = -Math.cos( this._angle ) * driver.act_x * 0.6;

					//let fly_force_x = driver.act_x * 0.05;
					//let fly_force_y = driver.act_y * 0.2;
					
					let fly_force_x = driver.act_x * 0.05;
					let fly_force_y = driver.act_y * 0.18;
					
					if ( driver.act_x !== 0 && driver.act_y !== 0 )
					{
						fly_force_x *= 0.71;
						fly_force_y *= 0.71;
					}

					if ( x_force !== 0 || y_force !== 0 || fly_force_x !== 0 || fly_force_y !== 0 )
					{
						if ( driver.act_x !== 0 )
						this.side = ( driver.act_x > 0 ) ? 1 : -1;

						let fly_force_scale = 1;

						if ( this.w1 && !this.w1._is_being_removed )
						{
							if ( this.w1._phys_last_touch && !this.w1._phys_last_touch._is_being_removed && this.w1.DoesOverlapWith( this.w1._phys_last_touch, 8 ) )
							{
								this.w1.sx += x_force * GSPEED * ( this.w1.hea > 0 ? 1 : 0.3 );
								this.w1.sy += y_force * GSPEED * ( this.w1.hea > 0 ? 1 : 0.3 );
								
								fly_force_scale = 2;
							}
							this.w1.PhysWakeUp();
						}

						if ( this.w2 && !this.w2._is_being_removed )
						{
							//if ( this.w2._phys_last_touch )
							//sdWorld.SendEffect({ x: this.w2._phys_last_touch.x, y: this.w2._phys_last_touch.y - 8, type:sdEffect.TYPE_WALL_HIT });
							
							//if ( this.w2._phys_last_touch )
							if ( this.w2._phys_last_touch && !this.w2._phys_last_touch._is_being_removed && this.w2.DoesOverlapWith( this.w2._phys_last_touch, 8 ) )
							{
								this.w2.sx += x_force * GSPEED * ( this.w2.hea > 0 ? 1 : 0.3 );
								this.w2.sy += y_force * GSPEED * ( this.w2.hea > 0 ? 1 : 0.3 );
								
								fly_force_scale = 2;
							}
							this.w2.PhysWakeUp();
						}
						
						this.sx += fly_force_x * GSPEED * fly_force_scale;
						this.sy += fly_force_y * GSPEED * fly_force_scale;
						
						if ( this.w1 && !this.w1._is_being_removed )
						if ( this.w1._phys_last_touch && !this.w1._phys_last_touch._is_being_removed && this.w1.DoesOverlapWith( this.w1._phys_last_touch, 2 ) )
						{
							this.w1.sx += fly_force_x * GSPEED * fly_force_scale;
							this.w1.sy += fly_force_y * GSPEED * fly_force_scale;
						}
						
						if ( this.w2 && !this.w2._is_being_removed )
						if ( this.w2._phys_last_touch && !this.w2._phys_last_touch._is_being_removed && this.w2.DoesOverlapWith( this.w2._phys_last_touch, 2 ) )
						{
							this.w2.sx += fly_force_x * GSPEED * fly_force_scale;
							this.w2.sy += fly_force_y * GSPEED * fly_force_scale;
						}
						
						this.PhysWakeUp();
					}
					else
					{
						/*let parts_down = [];
						
						if ( this.w1 && !this.w1._is_being_removed )
						parts_down.push( this.w1 );
						
						if ( this.w2 && !this.w2._is_being_removed )
						parts_down.push( this.w2 );
					
						if ( parts_down.length > 0 )
						{
							let cx = 0;
							let cy = 0;
							let avsx = 0;
							
							//this.sy -= 0.1 * GSPEED * parts_down.length;
							for ( let i = 0; i < parts_down.length; i++ )
							{
								//parts_down[ i ].sy += 0.1 * GSPEED;
								cx += parts_down[ i ].x;
								cy += parts_down[ i ].y;
								avsx += parts_down[ i ].sx;
							}
							
							cx /= parts_down.length;
							cy /= parts_down.length;
							avsx /= parts_down.length;
							
							if ( cy < this.y )
							{
								let speed_scale = 10;
								let dx = ( ( cx + avsx * speed_scale ) - ( this.x + this.sx * speed_scale ) ) * 0.1 * GSPEED;
								
								this.sx += dx;
								this.sy -= Math.abs( dx );
								
								for ( let i = 0; i < parts_down.length; i++ )
								{
									parts_down[ i ].sx -= dx;
									parts_down[ i ].sy += Math.abs( dx );
								}
							}
						}*/
					}
				}
			}


			let substeps = 1;

			if ( this.hea > 0 )
			substeps = 4;

			let GSPEED_scaled = GSPEED / substeps;

			//for ( let q = driver ? 4 : 2; q >= 0; q-- )
			for ( let q = 0; q < substeps; q++ )
			{
				if ( this.hea > 0 )
				for ( let i = 0; i < 3; i++ )
				{
					let a;
					let b;
					let target_di;

					if ( i === 0 )
					{
						a = this.w1;
						b = this.w2;
						target_di = 14;
					}
					else
					if ( i === 1 )
					{
						a = this;
						b = this.w1;
						target_di = Math.sqrt( 7*7 + 6*6 );
					}
					else
					{
						a = this;
						b = this.w2;
						target_di = Math.sqrt( 7*7 + 6*6 );
					}

					if ( !a || a._is_being_removed )
					continue;

					if ( !b || b._is_being_removed )
					continue;

					let di = sdWorld.Dist2D( a.x, a.y, b.x, b.y );

					if ( di > 1 )
					{
						const power = - 8 * ( target_di - di ) * GSPEED_scaled; // -1 allowed due to mass_balance

						const mass_balance = a.mass / ( a.mass + b.mass );
						const mass_balance_inv = 1 - mass_balance;

						let addx = ( b.x - a.x ) / di * power;
						let addy = ( b.y - a.y ) / di * power;

						a.sx += addx * mass_balance_inv;
						a.sy += addy * mass_balance_inv;

						if ( a.CanMoveWithoutOverlap( a.x + addx, a.y + addy, 0, a.CustomFiltering ) )
						if ( sdWorld.CheckLineOfSight( a.x, a.y, a.x + addx, a.y + addy, a, null, null, a.CustomFiltering ) )
						{
							a.x += addx * mass_balance_inv;
							a.y += addy * mass_balance_inv;
						}

						b.sx -= addx * mass_balance;
						b.sy -= addy * mass_balance;

						if ( b.CanMoveWithoutOverlap( b.x - addx, b.y - addy, 0, b.CustomFiltering ) )
						if ( sdWorld.CheckLineOfSight( b.x, b.y, b.x - addx, b.y - addy, b, null, null, b.CustomFiltering ) )
						{
							b.x -= addx * mass_balance;
							b.y -= addy * mass_balance;
						}
					}
				}


				for ( let i = 0; i < 3; i ++ )
				{
					let e;

					if ( i === 0 )
					e = this;
					else
					if ( i === 1 )
					e = this.w1;
					else
					if ( i === 2 )
					e = this.w2;

					if ( e && !e._is_being_removed )
					{
						e.sy += sdWorld.gravity * GSPEED_scaled;
						
						let step_size = 0;
						/*
						//if ( false ) // Testing why collision does not remember wall under wheels as last collision when friction happens
						if ( e !== this )
						//if ( Math.abs( e.sx ) > 0.5 )
						step_size = 4;
					
						*/

						e.ApplyVelocityAndCollisions( GSPEED_scaled, step_size, true, ( e === this ) ? 1 : 0.25, e.CustomFiltering );

						if ( max_sleep_timer < e._phys_sleep )
						max_sleep_timer = e._phys_sleep;
						//any_awake = true;
					}
				}
			}


			const HandleRegenAndPhysics = ( e )=>
			{
				if ( e === null || e._is_being_removed )
				return;
				
				if ( e._regen_timeout > 0 )
				{
					e._regen_timeout -= GSPEED;
					
					any_awake = true;
				}
				else
				{
					if ( e.hea > 0 )
					if ( e.hea < e.hmax )
					{
						if ( driver )
						e.hea = Math.min( e.hea + GSPEED / 3, e.hmax );
						else
						e.hea = Math.min( e.hea + GSPEED, e.hmax );
					
						any_awake = true;
					}
				}
			};
			HandleRegenAndPhysics( this );
			HandleRegenAndPhysics( this.w1 );
			HandleRegenAndPhysics( this.w2 );
			
			if ( !any_awake && max_sleep_timer <= 0 && ( !driver || !driver._socket ) )
			{
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
				
				if ( this.w1 && !this.w1._is_being_removed )
				this.w1.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
			
				if ( this.w2 && !this.w2._is_being_removed )
				this.w2.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
			}
			else
			{
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				this._phys_sleep = Math.max( this._phys_sleep, max_sleep_timer );
				
				if ( this.w1 && !this.w1._is_being_removed )
				{
					this.w1.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					this.w1._phys_sleep = Math.max( this.w1._phys_sleep, max_sleep_timer );
				}
			
				if ( this.w2 && !this.w2._is_being_removed )
				{
					this.w2.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					this.w2._phys_sleep = Math.max( this.w2._phys_sleep, max_sleep_timer );
				}
			}
		}
	}
	
	
	get bounce_intensity()
	{ 
		if ( this.part === 0 || this.hea <= 0 || ( this.p && this.p.hea > 0 && !this.p._is_being_removed ) )
		return 0;
	
		return 0.7; 
	}
	CustomFiltering( ent )
	{
		if ( this.part === 0 )
		{
			if ( ent._is_bg_entity !== this._is_bg_entity )
			return false;
			
			if ( !ent._hard_collision )
			return false;
		
			if ( ent === this || ent === this.w1 || ent === this.w2 )
			return false;
		
			if ( ent.IsPlayerClass() )
			if ( ent.driver_of === this )
			return false;
		
			//for ( var i = 0; i < sdQuadro.driver_slots; i++ )
			//if ( this[ 'driver' + i ] === ent )
			//return false;

			return true;
		}
		else
		{
			if ( this.p )
			return this.p.CustomFiltering( ent );
			
			return true;
		}
	}
	
	/*IsMovesLogic( sx_sign, sy_sign )
	{
		return !sdWorld.inDist2D_Boolean( this.sx, this.sy, 0, 0, sdWorld.gravity + 0.4 );
	}*/
	
	get friction_remain()
	{ return 0.95; }
	
	get title()
	{
		return 'Quadro';
	}
	get description()
	{
		return `Is there really a point in making these? Prototype of a vehicle.`;
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.part === 0 )
		{
			if ( this.hea <= 0 )
			return;
	
			sdEntity.Tooltip( ctx, this.title, 0, -8 );
			
			this.BasicVehicleTooltip( ctx, 0 );

			let w = 20;

			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
			
		}
	}
	Draw( ctx, attached )
	{
		const alive_offset = ( this.hea > 0 ) ? 0 : 32;
		const body_wheel_offset = ( this.part === sdQuadro.PART_BODY ) ? 0 : 32;

		ctx.save();
		{
			if ( this.part === sdQuadro.PART_BODY )
			{
				if ( this.w1 )
				if ( this.w2 )
				ctx.rotate( - Math.PI / 2 - this._angle );

				ctx.scale( -this.side, 1 );

				for ( var i = 0; i < sdQuadro.driver_slots; i++ )
				{
					if ( this[ 'driver' + i ] )
					{
						ctx.save();
						{
							let old_x = this[ 'driver' + i ].look_x;
							let old_y = this[ 'driver' + i ].look_y;
							this[ 'driver' + i ]._side = 1;
							this[ 'driver' + i ].look_x = this[ 'driver' + i ].x + 50;

							ctx.scale( -0.8, 0.8 );
							ctx.translate( 0, -8 );

							this[ 'driver' + i ].Draw( ctx, true ); // Hack

							this[ 'driver' + i ].look_x = old_x;
							this[ 'driver' + i ].look_y = old_y;
						}
						ctx.restore();
					}
				}

				ctx.filter = this.filter;
			}
			
			
		
			if ( this.part === sdQuadro.PART_BODY || ( !this.p || this.p._is_being_removed ) || attached )
			{
				ctx.drawImageFilterCache( sdQuadro.img_quadro, alive_offset,body_wheel_offset,32,32, - 16, - 16, 32,32 );
			}

			ctx.globalAlpha = 1;
			ctx.filter = 'none';
		}
		ctx.restore();
		
		if ( this.part === sdQuadro.PART_BODY )
		{
			if ( this.w1 && !this.w1._is_being_removed )
			{
				ctx.save();
				ctx.translate( -this.x + this.w1.x, -this.y + this.w1.y );
				this.w1.Draw( ctx, true );
				ctx.restore();
			}
			if ( this.w2 && !this.w2._is_being_removed )
			{
				ctx.save();
				ctx.translate( -this.x + this.w2.x, -this.y + this.w2.y );
				this.w2.Draw( ctx, true );
				ctx.restore();
			}
		}
		
		if ( sdShop.isDrawing )
		{
			ctx.drawImageFilterCache( sdQuadro.img_quadro, alive_offset,32,32,32, - 16-7, - 16+6, 32,32 );
			ctx.drawImageFilterCache( sdQuadro.img_quadro, alive_offset,32,32,32, - 16+7, - 16+6, 32,32 );
		}
	}
	/*getRequiredEntities( observer_character )
	{
		let r = [];
		if ( this.part === 0 )
		{
			if ( this.w1 && !this.w1._is_being_removed )
			r.push( this.w1 );
		
			if ( this.w2 && !this.w2._is_being_removed )
			r.push( this.w2 );
		}
		return r;
	}*/
	getTeleportGroup() // List of entities that will be teleproted together with this entity. For sdSandWorm and sdQuadro-like entities. You might want to use sdWorld.ExcludeNullsAndRemovedEntitiesForArray on returned array to filter out null pointers and removed entities
	{
		if ( this.p )
		{
			return sdWorld.ExcludeNullsAndRemovedEntitiesForArray( [ this.p, this.p.w1, this.p.w2 ] );
		}
		else
		{
			return sdWorld.ExcludeNullsAndRemovedEntitiesForArray( [ this, this.w1, this.w2 ] );
		}
	}
	onRemove() // Class-specific, if needed
	{
		if ( this.p )
		{
			if ( this.p.w1 === this )
			this.p.w1 = null;
		
			if ( this.p.w2 === this )
			this.p.w2 = null;
		}
		else
		{
			if ( this.w1 )
			this.w1.p = null;
		
			if ( this.w2 )
			this.w2.p = null;
		}
		
		/*if ( this._broken || sdLongRangeTeleport.teleported_items.has( this ) || !sdWorld.is_server )
		{
			for ( var i = 0; i < sdQuadro.driver_slots; i++ )
			if ( this[ 'driver' + i ] )
			this.ExcludeDriver( this[ 'driver' + i ], true );
		}*/
		
		if ( this._broken )
		{
			if ( this.part === 0 )
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		}
		/*else
		{
			for ( var i = 0; i < sdQuadro.driver_slots; i++ )
			if ( this[ 'driver' + i ] )
			{
				this[ 'driver' + i ].remove();
			}
		}*/
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return this.hmax * sdWorld.damage_to_matter + 250;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( exectuter_character.driver_of !== this )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 128 ) )
		{
			if ( this.part === 0 )
			if ( this.hea > 0 )
			if ( command_name === 'RESTORE' )
			{
				if ( this.CanMoveWithoutOverlap( this.x - 3, this.y - 6, 0, this.CustomFiltering ) && 
					 this.CanMoveWithoutOverlap( this.x + 3, this.y - 6, 0, this.CustomFiltering ) )
				{
					if ( this.w1 )
					this.w1.remove();

					if ( this.w2 )
					this.w2.remove();

					this._spawn_wheels = 1;
					
					this.y -= 6;
				}
				else
				{
					if ( !this.driver0 )
					{
						this.sy -= 5;
						if ( this.w1 && !this.w1._is_being_removed )
						this.w1.sy -= 5;
						if ( this.w2 && !this.w2._is_being_removed )
						this.w2.sy -= 5;
					}
					executer_socket.SDServiceMessage( 'Something is on top of or near Quadro.' );
					return;
				}
			}
		}
		else
		{
			executer_socket.SDServiceMessage( 'Quadro is too far.' );
			return;
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( exectuter_character.driver_of !== this )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			if ( this.part === 0 )
			if ( this.hea > 0 )
			this.AddContextOption( 'Repair wheels & restore', 'RESTORE', [] );
		}
	}
}
//sdQuadro.init_class();

export default sdQuadro;