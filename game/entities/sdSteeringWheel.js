/*

	Base mover?


*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdBlock from './sdBlock.js';
import sdGrass from './sdGrass.js';
import sdDoor from './sdDoor.js';
import sdBG from './sdBG.js';
//import sdCommandCentre from './sdCommandCentre.js';
//import sdWorkbench from './sdWorkbench.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdThruster from './sdThruster.js';
import sdArea from './sdArea.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';


class sdSteeringWheel extends sdEntity
{
	static init_class()
	{
		sdSteeringWheel.img_steering_wheel = sdWorld.CreateImageFromFile( 'steering_wheel' );
		
		sdSteeringWheel.access_range = 46;
		
		sdSteeringWheel.lost_control_range = 80;
		
		sdSteeringWheel.overlap = 8;
		
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return -5; }
	get hitbox_x2()  { return 5; }
	get hitbox_y1()  { return -7; }
	get hitbox_y2()  { return 8; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		//this.sx = 0;
		//this.sy = 0;

		this._hea = 800 * 4;
		this._hmax = 800 * 4;
		
		this._regen_timeout = 0;
		
		this.driver = null;
		
		this._scan = [];
		this._scan_net_ids = [];
		
		this.vx = 0;
		this.vy = 0;
		
		this._speed = 0; // Depends on amount of thrusters found
		
		this._last_scan = 0;
		
		this._schedule_rounding_task = false;
	}
	
	Scan( character_to_tell_result_to )
	{
		let socket_to_tell_result_to = character_to_tell_result_to._socket;
		
		if ( sdWorld < this._last_scan + 1000 )
		{
			if ( socket_to_tell_result_to )
			{
				socket_to_tell_result_to.SDServiceMessage( 'Too fast' );
			}
			
			return;
		}
		
		this._last_scan = sdWorld.time;
		
		const LIMIT = 400; // Was 100
		
		let speed = 0;
		
		//this._scan = [];
		
		let visited = new Set();
		
		let active = [ this ];
		visited.add( this );
		
		let collected = [ this ];
		
		const overlap = sdSteeringWheel.overlap;
		
		let reason = null;
		
		out:
		while ( active.length > 0 )
		{
			let current = active.shift();
			
			let cells = sdWorld.GetCellsInRect( current.x + current._hitbox_x1 - overlap, current.y + current._hitbox_y1 - overlap, current.x + current._hitbox_x2 + overlap, current.y + current._hitbox_y2 + overlap );
			
			for ( let c = 0; c < cells.length; c++ )
			{
				let cell = cells[ c ].arr;
				
				for ( let i = 0; i < cell.length; i++ )
				{
					let ent2 = cell[ i ];
					
					if ( !visited.has( ent2 ) )
					{
						if ( current.DoesOverlapWith( ent2, overlap ) )
						{
							visited.add( ent2 );
								
							if ( 
									( ent2.is( sdBlock ) && !ent2._natural ) 

									|| 

									ent2.is( sdDoor ) 

									|| 

									( 
									   ent2.IsBGEntity() === 1 &&
									   
									   ( !ent2.is( sdBlock ) || !ent2._natural ) &&
									   
									   (
											( ent2.is( sdBG ) && ent2.material !== sdBG.MATERIAL_GROUND ) 
											||
											!ent2.is( sdBG ) 
										)
									) 

									|| 

									( !ent2.onThink.has_ApplyVelocityAndCollisions && ent2.IsBGEntity() === 0 && !ent2.is( sdBlock ) && !ent2.is( sdGrass ) ) // Ignore physical entities that will be pushed

								)
							//if ( !ent2.onThink.has_ApplyVelocityAndCollisions && ent2.IsBGEntity() === 0 ) // Ignore physical entities that will be pushed
							{
								active.push( ent2 );
								collected.push( ent2 );
								
								if ( ent2.is( sdThruster ) )
								{
									speed++;
								}
								
								if ( collected.length > LIMIT )
								{
									reason = 'Skybase is likely stuck or too big to move (over ' + LIMIT + ' entities in a scan)';
									collected = null;
									break out;
								}
								
								if ( ent2.is( sdSteeringWheel ) && ent2 !== this )
								{
									reason = 'Only one steering wheel is allowed';
									collected = null;
									break out;
								}
								
								if ( ( ent2.is( sdLongRangeTeleport ) && ent2.is_server_teleport ) ||
									 !sdArea.CheckPointDamageAllowed( ent2.x + ( ent2._hitbox_x1 + ent2._hitbox_x2 ) / 2, ent2.y + ( ent2._hitbox_y1 + ent2._hitbox_y2 ) / 2 ) )
								{
									reason = 'One of affected entities is in restricted area';
									collected = null;
									break out;
								}
							}
						}
					}
				}
			}
		}
		
		if ( reason === null )
		if ( speed === 0 )
		{
			reason = 'Skybase requires at least 1 thruster'
			collected = null;
		}
		
		if ( collected )
		{
			let net_ids = [];
			for ( let i = 0; i < collected.length; i++ )
			{
				net_ids.push( collected[ i ]._net_id );
				
				collected[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, observer: character_to_tell_result_to });
			}
			
			this._scan = collected;
			this._scan_net_ids = net_ids;
			
			this._speed = speed;
			
			//trace( collected );
			
			this._update_version++;
		}
		else
		{
			if ( socket_to_tell_result_to )
			{
				socket_to_tell_result_to.SDServiceMessage( reason );
			}
		}
	}
	
	IsVehicle()
	{
		return true;
	}
	VehicleHidesDrivers()
	{
		return false;
	}
	VehicleHidesLegs()
	{
		return false;
	}
	AddDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.driver )
		{
			if ( c._socket )
			c._socket.SDServiceMessage( 'All slots are occupied' );
		
			return;
		}
		this.driver = c;
		
		c.driver_of = this;
		
		sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1, pitch:0.5 });
		
		if ( this._scan.length === 0 )
		{
			this.Scan( c );
		}
		else
		{
			this.VerifyMissingParts();
		}
	
		for ( let i = 0; i < this._scan.length; i++ )
		{
			if ( this._scan[ i ].is( sdThruster ) )
			{
				this._scan[ i ].enabled = true;
				this._scan[ i ]._update_version++;
			}
		}
	
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	
	ExcludeDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
		
		this.driver = null;
		
		if ( !c._is_being_removed )
		{
			c.driver_of = null;

			c.PhysWakeUp();
		}
		
		this.VerifyMissingParts();
			
		for ( let i = 0; i < this._scan.length; i++ )
		{
			if ( this._scan[ i ].is( sdThruster ) )
			{
				this._scan[ i ].enabled = false;
				this._scan[ i ]._update_version++;
			}
		}
		
		this._schedule_rounding_task = true;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		this._regen_timeout = 60;
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_scan_net_ids' ) return true;
		
		return false;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
			}
		}
		
		if ( this.driver )
		if ( this.driver._is_being_removed || this.driver.hea <= 0 )
		{
			this.ExcludeDriver( this.driver );
			//this.driver = null;

			//this._schedule_rounding_task = true;
		}
		
		// When loaded from snapshot - scan might end up being not loaded
		if ( sdWorld.is_server )
		{
			if ( this._scan.length !== this._scan_net_ids.length )
			{
				this._scan = [];
				
				for ( let i = 0; i < this._scan_net_ids.length; i++ )
				{
					let ent = sdEntity.entities_by_net_id_cache_map.get( this._scan_net_ids[ i ] );
					
					if ( ent )
					{
						this._scan.push( ent );
					}
					else
					{
						this._scan_net_ids.splice( i, 1 );
						i--;
						continue;
					}
				}
			}
		}
		
		if ( sdWorld.is_server )
		{
			if ( this._schedule_rounding_task )
			{
				this.VerifyMissingParts();
				
				let xx = Math.round( this.x / 8 ) * 8 - this.x;
				let yy = Math.round( this.y / 8 ) * 8 - this.y;

				if ( xx < 0 )
				xx = -1;
				if ( xx > 0 )
				xx = 1;
				if ( yy < 0 )
				yy = -1;
				if ( yy > 0 )
				yy = 1;

				if ( xx !== 0 || yy !== 0 )
				this.ComplexElevatorLikeMove( this._scan, this._scan_net_ids, xx, yy, true, GSPEED );
				else
				this._schedule_rounding_task = false;
				
				this.vx = 0;
				this.vy = 0;
			}
			else
			if ( this.driver )
			{
				if ( this.driver.hea <= 0 || !sdWorld.inDist2D_Boolean( this.x, this.y, this.driver.x, this.driver.y, sdSteeringWheel.lost_control_range ) )
				{
					this.ExcludeDriver( this.driver );
				}
				else
				{
					if ( GSPEED > 1 )
					GSPEED = 1;
				
					let speed = Math.min( 1, this._speed / 4 );

					this.vx += this.driver.act_x * GSPEED * 0.25 * speed;
					this.vy += this.driver.act_y * GSPEED * 0.25 * speed;

					this.vx = sdWorld.MorphWithTimeScale( this.vx, 0, 0.95, GSPEED );
					this.vy = sdWorld.MorphWithTimeScale( this.vy, 0, 0.95, GSPEED );

					if ( this.vx > 16 )
					this.vx = 16;
					if ( this.vx < -16 )
					this.vx = -16;
					if ( this.vy > 16 )
					this.vy = 16;
					if ( this.vy < -16 )
					this.vy = -16;

					let xx = Math.round( this.vx * GSPEED );
					let yy = Math.round( this.vy * GSPEED );
					
					if ( xx !== 0 || yy !== 0 )
					{
						this.VerifyMissingParts();

						if ( this.driver.CanMoveWithoutOverlap( this.driver.x, this.driver.y ) &&
							 this.ComplexElevatorLikeMove( this._scan, this._scan_net_ids, xx, yy, false, GSPEED ) )
						{
							if ( this.driver.CanMoveWithoutOverlap( this.driver.x + xx, this.driver.y + yy ) )
							{
								this.driver.x += xx;
								this.driver.y += yy;
								
								sdWorld.UpdateHashPosition( this.driver, false, false );
							}
						}
						else
						{					
							if ( !sdWorld.inDist2D_Boolean( 0,0, this.vx,this.vy, 1 ) )
							sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.25, volume:1 });

							this.vx = 0;
							this.vy = 0;
						}
					}
				}
			}
			else
			if ( this._hea >= this._hmax )
			{
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			}
		}
	}
	
	ExcludeEntity( current, i, meltdown=false )
	{
		if ( current.is ) // Check if it is not a fake removed object
		{
			if ( current.is( sdThruster ) )
			{
				this._speed--;

				current.enabled = false;
				current._update_version++;
			}
			
			if ( meltdown )
			current.ApplyStatusEffect({ type: sdStatusEffect.TYPE_FALLING_STATIC_BLOCK }); // Very cursed thing - can cause bases to be melted
		}

		this._scan.splice( i, 1 );

		if ( this._scan_net_ids )
		this._scan_net_ids.splice( i, 1 );
	}
	
	
	VerifyMissingParts()
	{
		let do_structural_check = false;
		
		let meltdown = true;
		
		for ( let i = 0; i < this._scan.length; i++ )
		{
			let current = this._scan[ i ];

			if ( !current._is_being_removed )
			//if ( current.is( sdBaseShieldingUnit ) ) // It is never here
			//if ( current.enabled )
			if ( current._shielded )
			{
				meltdown = false;
				break;
			}
		}
		
		for ( let i = 0; i < this._scan.length; i++ )
		{
			let current = this._scan[ i ];

			if ( current._is_being_removed )
			{
				do_structural_check = true;
				
				this.ExcludeEntity( current, i, meltdown );
				i--;
				continue;
			}
			
			//current._flag = 1;
		}
		
		if ( do_structural_check )
		{
			//let visited = new Set();
			
			let active = [ this ];
			//visited.add( this );
			
			let unchecked = this._scan.slice();
			
			unchecked.splice( unchecked.indexOf( this ), 1 );
			
			//debugger;
		
			const overlap = sdSteeringWheel.overlap;
			
			while ( active.length > 0 )
			{
				let current = active.shift();
				
				//current._flag = 2;
				
				for ( let i2 = 0; i2 < unchecked.length; i2++ )
				{
					let another = unchecked[ i2 ];
					
					if ( current.DoesOverlapWith( another, overlap ) )
					{
						active.push( another );
						
						unchecked.splice( i2, 1 );
						i2--;
						continue;
					}
				}
			}
			
			for ( let i = 0; i < unchecked.length; i++ )
			{
				let current = unchecked[ i ];
				
				let id = this._scan.indexOf( current );

				if ( id !== -1 )
				{
					this.ExcludeEntity( current, id, meltdown );
					i--;
					continue;
				}
				//else
				//debugger;
			}
		}
	}
	
	ComplexElevatorLikeMove( scan, _scan_net_ids, xx, yy, forceful, GSPEED ) // GSPEED only used for damage scaling
	{
		let stuff_to_push = [];
		let stopping_entities = [];
		let stopped_entities = []; // Ones that are likely to take damage, together with stopping_entities

		let will_move = true;

		for ( let i = 0; i < scan.length; i++ )
		{
			let current = scan[ i ];

			/*if ( current._is_being_removed )
			{
				scan.splice( i, 1 );
				
				if ( _scan_net_ids )
				_scan_net_ids.splice( i, 1 );
				
				i--;
				continue;
			}*/

			const Filter = ( ent2, current )=>
			{
				if ( ent2._is_being_removed )
				return false;
			
				// Normally, it should igonre all possible drivers
				/*if ( ent2 === this.driver )
				{
					return false;
				}*/

				if ( ent2.onThink.has_ApplyVelocityAndCollisions )
				{
					if ( stuff_to_push.indexOf( ent2 ) === -1 )
					{
						stuff_to_push.push( ent2 );
						
						ent2.CanMoveWithoutOverlap( ent2.x + xx, ent2.y + yy, 0, ( ent3 )=>{ return Filter( ent3, ent2 ); }, GetIgnoredEntityClassesFor( ent2 ) );
					}
				}
				else
				{
					if ( scan.indexOf( ent2 ) === -1 )
					{
						if ( stopping_entities.indexOf( ent2 ) === -1 )
						{
							stopping_entities.push( ent2 );
							
							if ( !forceful )
							if ( stopped_entities.indexOf( current ) === -1 )
							stopped_entities.push( current );
						}
					}
				}

				return false;
			};
			
			const GetIgnoredEntityClassesFor = ( current )=>
			{
				if ( current.is( sdDoor ) )
				{
					return sdDoor.ignored_entity_classes_travel;
				}
				
				return current.GetIgnoredEntityClasses();
			};

			current.CanMoveWithoutOverlap( current.x + xx, current.y + yy, 0, ( ent2 )=>{ return Filter( ent2, current ); }, GetIgnoredEntityClassesFor( current ) );
			
			if ( current.x + xx + current._hitbox_x2 > sdWorld.world_bounds.x2 )
			{
				will_move = false;
			}
			else
			if ( current.x + xx + current._hitbox_x1 < sdWorld.world_bounds.x1 )
			{
				will_move = false;
			}
			else
			if ( current.y + yy + current._hitbox_y2 > sdWorld.world_bounds.y2 )
			{
				will_move = false;
			}
			else
			if ( current.y + yy + current._hitbox_y1 < sdWorld.world_bounds.y1 )
			{
				will_move = false;
			}
		}

		if ( stopping_entities.length > 0 )
		{
			will_move = false;
		}

		if ( will_move || forceful )
		{
			for ( let i = 0; i < scan.length; i++ )
			{
				let current = scan[ i ];

				current.x += xx;
				current.y += yy;
				
				sdWorld.UpdateHashPosition( current, false, false );
				
				current.ManageTrackedPhysWakeup();

				if ( current.is( sdDoor ) )
				{
					if ( current.x0 !== null )
					current.x0 += xx;

					if ( current.y0 !== null )
					current.y0 += yy;
				}

				if ( current.is_static )
				{
					//current._update_version++;
					
					current.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_MOVEMENT_SMOOTH, tx:current.x, ty:current.y });
				}
				
				current.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				
			}
			for ( let i = 0; i < stuff_to_push.length; i++ )
			{
				let item = stuff_to_push[ i ];
				
				item.x += xx;
				item.y += yy;
				
				if ( item.is( sdBaseShieldingUnit ) )
				{
					item.charge = 0;
				}

				if ( xx < 0 )
				{
					if ( item.sx > xx )
					item.sx = xx - Math.abs( item.sx - xx ) * item.bounce_intensity;
				}
				else
				if ( xx > 0 )
				{
					if ( item.sx < xx )
					item.sx = xx + Math.abs( item.sx - xx ) * item.bounce_intensity;
				}


				if ( yy < 0 )
				{
					if ( item.sy > yy )
					item.sy = yy - Math.abs( item.sy - yy ) * item.bounce_intensity;
				}
				else
				if ( yy > 0 )
				{
					if ( item.sy < yy )
					item.sy = yy + Math.abs( item.sy - yy ) * item.bounce_intensity;
				}
				
				sdWorld.UpdateHashPosition( item, false, false );
				
				item.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				
				item.PhysWakeUp();
				
				item.ManageTrackedPhysWakeup();
			}
		}
		else
		{
			for ( let i = 0; i < stopping_entities.length; i++ )
			{
				if ( !stopping_entities[ i ].is( sdBG ) || stopping_entities[ i ].material === sdBG.MATERIAL_GROUND )
				stopping_entities[ i ].Damage( 5 * GSPEED );
			}
			for ( let i = 0; i < stopped_entities.length; i++ )
			{
				if ( !stopped_entities[ i ].is( sdBG ) || stopped_entities[ i ].material === sdBG.MATERIAL_GROUND )
				stopped_entities[ i ].Damage( 5 * GSPEED );
			}
			
			return false;
		}
		return true;
	}
	
	get title()
	{
		return 'Skybase steering wheel';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdSteeringWheel.img_steering_wheel, - 16, - 16, 32,32 );
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 5 );
		}
		else
		{
		}
	}
	MeasureMatterCost()
	{
		return 1000;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdSteeringWheel.access_range ) )
			{
				if ( command_name === 'SCAN' )
				{
					this.Scan( exectuter_character );
				}
			}
			else
			{
				executer_socket.SDServiceMessage( 'Too far' );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdSteeringWheel.access_range ) )
		{
			this.AddContextOption( 'Rescan base entities', 'SCAN', [] );
		}
	}
}
//sdSteeringWheel.init_class();

export default sdSteeringWheel;
