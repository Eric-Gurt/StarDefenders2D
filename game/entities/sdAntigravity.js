
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdDoor from './sdDoor.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdSensorArea from './sdSensorArea.js';


import sdRenderer from '../client/sdRenderer.js';


class sdAntigravity extends sdEntity
{
	static init_class()
	{
		sdAntigravity.img_antigravity = sdWorld.CreateImageFromFile( 'sdAntigravity' );
		
		sdAntigravity.TYPE_ADD = 0;
		sdAntigravity.TYPE_SET = 1;
		
		sdAntigravity.rotations_by_kind = [
			{ dx:0,  dy:-1, hitbox:[-16,-4,16,0] }, // up
			{ dx:1,  dy:0,  hitbox:[0,-16,4,16]  }, // right
			{ dx:0,  dy:1,  hitbox:[-16,0,16,4]  }, // down
			{ dx:-1, dy:0,  hitbox:[-4,-16,0,16] } // left
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	AdjustHitboxSizeByDimension( dimension )
	{
		if ( dimension === 16 )
		return dimension / 16 * this.size;
	
		if ( dimension === -16 )
		return dimension / 16 * this.size;
	
		return dimension;
	}
	get hitbox_x1() { return this.AdjustHitboxSizeByDimension( sdAntigravity.rotations_by_kind[ this.kind || 0 ].hitbox[ 0 ] ); }
	get hitbox_x2() { return this.AdjustHitboxSizeByDimension( sdAntigravity.rotations_by_kind[ this.kind || 0 ].hitbox[ 2 ] ); }
	get hitbox_y1() { return this.AdjustHitboxSizeByDimension( sdAntigravity.rotations_by_kind[ this.kind || 0 ].hitbox[ 1 ] ); }
	get hitbox_y2() { return this.AdjustHitboxSizeByDimension( sdAntigravity.rotations_by_kind[ this.kind || 0 ].hitbox[ 3 ] ); }
	
	get hard_collision()
	{ return true; }
	
	// Apparently is a threat if power is 20
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( this._hea > 0 )
		{
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;
				this._regen_timeout = 60;

				if ( this._hea <= 0 )
				this.remove();
			}
		}
	}
	constructor( params )
	{
		super( params );
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this.power = 1;
		
		this.type = params.type || 0;
		this.kind = params.kind || 0; // 0, 1, 2, 3, rotation
		this.size = params.size || 16; // Half width before rotation
		
		this._hmax = 300 * this.size / 16;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this.toggle_enabled = 1; // Sets to 0 if sdButton is being pressed
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._sensor_area = null;
		this._entities_within_sensor_area = []; // _net_ids
		
		//this.matter = 0;
		//this._matter_max = 20;
		
		//this._update_version++
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_shielded' || prop === '_sensor_area' || prop === '_entities_within_sensor_area' );
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter + 50;
	}
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	SensorAreaMovementCallback( from_entity )
	{
		if ( this._entities_within_sensor_area.indexOf( from_entity._net_id ) === -1 )
		{
			this._entities_within_sensor_area.push( from_entity._net_id );
		
			this.CleanupOrFilterTrackedEntities();
		}
	}
	CleanupOrFilterTrackedEntities( targets=null, walls=null ) // Leave targets & walls empty to only do cleanup
	{
		if ( walls )
		{
			for ( let i2 = 0; i2 < this._entities_within_sensor_area.length; i2++ )
			{
				let e = sdEntity.entities_by_net_id_cache_map.get( this._entities_within_sensor_area[ i2 ] );

				if ( e && !e._is_being_removed && this._sensor_area && e.DoesOverlapWith( this._sensor_area ) ) // Copy [ 1 / 2 ]
				{
					if ( e.is( sdBlock ) || e.is( sdDoor ) )
					walls.push( e );
					else
					if ( e.IsPhysicallyMovable() )
					targets.push( e );
				}
				else
				{
					this._entities_within_sensor_area.splice( i2, 1 );
					i2--;
					continue;
				}
			}
		}
		else
		{
			// Check random 20%
			for ( let i = this._entities_within_sensor_area.length * 0.2; i > 0; i-- )
			//for ( let i2 = 0; i2 < this._entities_within_sensor_area.length; i2++ )
			{
				let i2 = Math.floor( Math.random() * this._entities_within_sensor_area.length );
				
				let e = sdEntity.entities_by_net_id_cache_map.get( this._entities_within_sensor_area[ i2 ] );

				if ( e && !e._is_being_removed && this._sensor_area && e.DoesOverlapWith( this._sensor_area ) ) // Copy [ 1 / 2 ]
				{
				}
				else
				{
					this._entities_within_sensor_area.splice( i2, 1 );
					//i2--;
					continue;
				}
			}
		}
	}
	
	SetSensorBounds( sensor_or_params, max_h )
	{
		if ( this.kind === 0 || this.kind === 2 ) // up or down
		{
			sensor_or_params.x = this.x - this.size;
			sensor_or_params.w = this.size * 2;
			sensor_or_params.h = max_h;

			if ( this.kind === 0 )
			sensor_or_params.y = this.y - max_h;
			else
			sensor_or_params.y = this.y;
		}
		else
		if ( this.kind === 1 || this.kind === 3 ) // right or left
		{
			sensor_or_params.y = this.y - this.size;
			sensor_or_params.h = this.size * 2;
			sensor_or_params.w = max_h;

			if ( this.kind === 3 )
			sensor_or_params.x = this.x - max_h;
			else
			sensor_or_params.x = this.x;
		}
		return sensor_or_params;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
		}
		
		if ( this.power !== 0 && this.toggle_enabled )
		{
			let max_h_steps = ( this.power === -1 ? 3 : 16 );
			let max_h = max_h_steps * 16;

			if ( !this._sensor_area || this._sensor_area._is_being_removed )
			{
				if ( sdWorld.is_server )
				{
					this._sensor_area = sdEntity.Create( sdSensorArea, this.SetSensorBounds({ x: this.x, y: this.y, w: 0, h: 0, on_movement_target: this }, max_h ) );
				}
				else
				{
					this._sensor_area = null;
				}
			}
			
			if ( this._sensor_area )
			{
				let old_x = this._sensor_area.x;
				let old_y = this._sensor_area.y;
				let old_w = this._sensor_area.w;
				let old_h = this._sensor_area.h;
				
				this.SetSensorBounds( this._sensor_area, max_h );

				if ( old_x !== this._sensor_area.x || old_y !== this._sensor_area.y ||
					 old_w !== this._sensor_area.w || old_h !== this._sensor_area.h )
				{
					this._sensor_area._update_version++;
					this._sensor_area.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
				}
				
				let targets = [];
				let walls = [];
				this.CleanupOrFilterTrackedEntities( targets, walls );

				let WithinLimits = ( e )=>
				{
					if ( this.kind === 0 || this.kind === 2 )
					{
						let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
						
						if ( xx < this.x - 16 || xx >= this.x + 16 )
						return false;
					}
					else
					if ( this.kind === 1 || this.kind === 3 )
					{
						let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
						
						if ( yy < this.y - 16 || yy >= this.y + 16 )
						return false;
					}
					return true;
				};

				let an = this.kind * Math.PI / 2;

				let t_from = -1;
				let t_to = 1;
				
				if ( this.size === 8 )
				{
					t_from = 0;
					t_to = 0;
				}

				for ( var t = t_from; t <= t_to; t += 2 )
				{
					let xx = this.x + Math.round( Math.cos( an ) ) * 8 * ( t );
					let yy = this.y + Math.round( Math.sin( an ) ) * 8 * ( t );

					let dx = Math.round( Math.sin( an ) );
					let dy = -Math.round( Math.cos( an ) );

					xx += dx * 8;
					yy += dy * 8;
					
					steps_loop:
					for ( let steps = 0; steps < max_h_steps; steps++ )
					{
						for ( let i = 0; i < walls.length; i++ )
						{
							let w = walls[ i ];
							if ( w.DoesOverlapWithRect( xx-8, yy-8, xx+8, yy+8 ) )
							{
								//w.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 0.5, 2, 0.5 ] });

								break steps_loop;
							}
						}

						for ( let i = 0; i < targets.length; i++ )
						{
							let e = targets[ i ];

							if ( e.DoesOverlapWithRect( xx-8, yy-8, xx+8, yy+8 ) )
							{
								if ( WithinLimits( e ) )
								{
									let is_player = ( e.is( sdCharacter ) && e.hea > 0 );

									if ( sdWorld.is_server || !is_player )
									{
										let old_sx = e.sx;
										let old_sy = e.sy;

										let mass_capped = Math.min( e.mass, 80 ); // Anti-tank raiding (tank would damage walls its' being pushed into, without any damage to tank itself)

										if ( this.power === -1 )
										{
											if ( this.kind === 0 || this.kind === 2 )
											e.sy = sdWorld.MorphWithTimeScale( e.sy, 0, 0.75, GSPEED );
											else
											e.sx = sdWorld.MorphWithTimeScale( e.sx, 0, 0.75, GSPEED );
										}
										else
										{
											let force = ( GSPEED * sdWorld.gravity * 0.9 * this.power ) * mass_capped;
											e.Impulse( force * dx, force * dy );
											
											if ( e._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP )
											e.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
										
											e.PhysWakeUp();
										}


										if ( this.type === sdAntigravity.TYPE_SET )
										{
											e.sy = sdWorld.MorphWithTimeScale( e.sy, 0, 0.75, GSPEED );
											e.sx = sdWorld.MorphWithTimeScale( e.sx, 0, 0.75, GSPEED );
										}


										if ( is_player )
										{
											if ( this.power !== -1 )
											{
												if ( this.type === sdAntigravity.TYPE_ADD )
												if ( this.kind === 0 )
												e.Impulse( 0, ( GSPEED * e.act_y * 0.1 ) * mass_capped );
											}
											else
											e.ApplyServerSidePositionAndVelocity( false, e.sx - old_sx, e.sy - old_sy ); // It happens as part of .Impulse now
										}
									}
								}



								targets.splice( i, 1 );
								i--;
								continue;
							}
						}
						
						//if ( Math.random() < 0.01 )
						//sdWorld.SendEffect({ x:xx, y:yy, type:sdEffect.TYPE_WALL_HIT });
						
						xx += dx * 16;
						yy += dy * 16;
					}
				}

			}
			else
			this.CleanupOrFilterTrackedEntities();
		}
		else
		this.CleanupOrFilterTrackedEntities();
		
				
		if ( this._hea >= this._hmax )
		//if ( this.matter <= 0 || this.power === 0 )
		if ( this.power === 0 || !this.toggle_enabled )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
	}
	
	get title()
	{
		if ( this.type === sdAntigravity.TYPE_ADD )
		return ( this.size === 16 ) ? 'Antigravity field' : 'Small antigravity field';
	
		if ( this.type === sdAntigravity.TYPE_SET )
		return ( this.size === 16 ) ? 'Stopping antigravity field' : 'Small stopping antigravity field';
	}
	get description()
	{
		if ( this.type === sdAntigravity.TYPE_ADD )
		return 'Creates force field that applies force to any movable entities in it. Does not work through walls or doors.';
	
		if ( this.type === sdAntigravity.TYPE_SET )
		return 'Creates force field that attempts to override velocity of any movable entities in it. Does not work through walls or doors.';
	}
	
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		ctx.rotate( this.kind * Math.PI / 2 );
		
		let frame = 0;
	
		if ( this.size === 16 )
		ctx.drawImageFilterCache( sdAntigravity.img_antigravity, this.type*32,frame*32,32,32, -16, -16, 32,32 );
		else
		{
			ctx.drawImageFilterCache( sdAntigravity.img_antigravity, this.type*32,frame*32,this.size,32, -this.size, -16, this.size,32 );
			ctx.drawImageFilterCache( sdAntigravity.img_antigravity, this.type*32+32-this.size,frame*32,this.size,32, 0, -16, this.size,32 );
		}
		
		if ( this.power !== 0 && this.toggle_enabled )
		if ( frame === 0 )
		{
			let repeat = 400;

			for ( let i = 0; i < 3; i++ )
			{
				let prog;

				if ( this.power >= 0 && this.toggle_enabled )
				prog = ( ( sdWorld.time * this.power + i * repeat / 3 ) % repeat ) / repeat;
				else
				prog = 1 - ( ( sdWorld.time * 0.1 + i * repeat / 3 ) % repeat ) / repeat;

				prog *= prog;

				prog = Math.round( prog * 40 ) / 40;

				ctx.globalAlpha = ( 1 - prog ) * 0.4 * Math.abs( this.power );
				
				if ( this.type === sdAntigravity.TYPE_ADD )
				ctx.fillStyle = '#ffffff';
			
				if ( this.type === sdAntigravity.TYPE_SET )
				ctx.fillStyle = '#8787e1';
			
				let s = this.size / 16;
			
				ctx.fillRect( -10 * s + prog * 2, -5 - prog * 20, 20 * s - prog * 4, 1 );
			}

		}

        ctx.globalAlpha = 1;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
		//else
		//sdEntity.Tooltip( ctx, this.title + ' ( no matter )' );
	}
	onRemoveAsFakeEntity() // Class-specific, if needed
	{
		if ( this._sensor_area )
		this._sensor_area.remove();
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._sensor_area )
		this._sensor_area.remove();
	
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 12 );
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			{
				if ( exectuter_character.canSeeForUse( this ) )
				{
					if ( command_name === 'SETPOWER' )
					{
						let velocities = [ -1, 0, 1, 2, 5, 10, 20 ];

						let i = velocities.indexOf( parameters_array[ 0 ] );

						if ( i !== -1 )
						{
							i = velocities[ i ];
							if ( this.power !== i )
							{
								this.power = i;
								this._update_version++;

								this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
							}
						}
					}
				}
				else
				executer_socket.SDServiceMessage( 'Antigravity is behind wall' );
			}
			else
			executer_socket.SDServiceMessage( 'Antigravity is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		if ( exectuter_character.canSeeForUse( this ) )
		{
			if ( sdWorld.my_entity )
			{
				let velocities = [ -1, 0, 1, 2, 5, 10, 20 ];

				for ( let i = 0; i < velocities.length; i++ )
				this.AddContextOptionNoTranslation( T('Set intensity to ') + ( i === 0 ? T('impact prevention') : velocities[ i ] ), 'SETPOWER', [ velocities[ i ] ], true, ( this.power === velocities[ i ] ) ? { color:'#00ff00' } : {} );
			}
		}
	}
}
//sdAntigravity.init_class();

export default sdAntigravity;