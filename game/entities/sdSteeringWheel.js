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
import sdManualTurret from './sdManualTurret.js';
import sdTimer from './sdTimer.js';
import sdSampleBuilder from './sdSampleBuilder.js';
import sdButton from './sdButton.js';
import sdNode from './sdNode.js';
import sdCrystal from './sdCrystal.js';
import sdTeleport from './sdTeleport.js';
import sdStorage from './sdStorage.js';
import sdMatterAmplifier from './sdMatterAmplifier.js';
import sdCrystalCombiner from './sdCrystalCombiner.js';


class sdSteeringWheel extends sdEntity
{
	static init_class()
	{
		sdSteeringWheel.img_steering_wheel = sdWorld.CreateImageFromFile( 'steering_wheel' );
		sdSteeringWheel.img_elevator_motor = sdWorld.CreateImageFromFile( 'elevator_motor' );
		
		sdSteeringWheel.entities_limit_per_scan = 650;
		
		sdSteeringWheel.access_range = 46;
		
		sdSteeringWheel.lost_control_range = 80;
		
		sdSteeringWheel.overlap = 8;
		
		sdSteeringWheel.steering_wheels = [];
		
		sdSteeringWheel.TYPE_STEERING_WHEEL = 0;
		sdSteeringWheel.TYPE_ELEVATOR_MOTOR = 1;
		
		sdSteeringWheel.button_filter = [ 'sdButton' ];
		
		/*
		const drop_rate = 100; // 30000
		
		let next_drop = 0;
		
		// Let's make flying bases fall occasionally, probably not in the best way though.
		sdTimer.ExecuteWithDelay( ( timer )=>{
			
			if ( sdWorld.is_server || sdWorld.is_singleplayer )
			if ( sdWorld.time > next_drop )
			if ( sdEntity.entities.length > 0 )
			{
				let e = sdEntity.entities[ Math.floor( Math.random() * sdEntity.entities.length ) ];
				
				//if ( e.is_static ) // Anything that is static part of a base may fall down
				if ( !e.onThink.has_ApplyVelocityAndCollisions )
				if ( e._is_bg_entity === 0 || e._is_bg_entity === 1 )
				if ( sdArea.CheckPointDamageAllowed( e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2, e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2 ) )
				{
					while ( sdWorld.CheckWallExistsBox( e.x + e._hitbox_x1, e.y + e._hitbox_y2, e.x + e._hitbox_x2, e.y + e._hitbox_y2 + 16, e ) &&
							sdWorld.last_hit_entity &&
							!sdWorld.last_hit_entity.onThink.has_ApplyVelocityAndCollisions &&
							( sdWorld.last_hit_entity._is_bg_entity === 0 || sdWorld.last_hit_entity._is_bg_entity === 1 &&
							sdArea.CheckPointDamageAllowed( sdWorld.last_hit_entity.x + ( sdWorld.last_hit_entity._hitbox_x1 + sdWorld.last_hit_entity._hitbox_x2 ) / 2, sdWorld.last_hit_entity.y + ( sdWorld.last_hit_entity._hitbox_y1 + sdWorld.last_hit_entity._hitbox_y2 ) / 2 ) )
					)
					{
						e = sdWorld.last_hit_entity;
					}
					
					//if ( e.y > sdWorld.GetGroundElevation( Math.round( e.x / 16 ) * 16 ) ) 
					if ( e.y + e._hitbox_y2 > sdWorld.world_bounds.y2 - 16 )
					{
					}
					else
					{
						//const LIMIT = 400; // Was 100

						let visited = new Set();

						let active = [ e ];
						visited.add( e );

						let collected = [ e ];

						const overlap = sdSteeringWheel.overlap;

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

											if ( !ent2.onThink.has_ApplyVelocityAndCollisions && ( ent2._is_bg_entity === 0 || ent2._is_bg_entity === 1 ) ) // Ignore physical entities that will be pushed
											{
												active.push( ent2 );
												collected.push( ent2 );

												if ( ( ent2.is( sdLongRangeTeleport ) && ent2.is_server_teleport ) ||
													 !sdArea.CheckPointDamageAllowed( ent2.x + ( ent2._hitbox_x1 + ent2._hitbox_x2 ) / 2, ent2.y + ( ent2._hitbox_y1 + ent2._hitbox_y2 ) / 2 ) )
												{
													collected = null;
													break out;
												}

												//if ( ent2.y > sdWorld.GetGroundElevation( Math.round( ent2.x / 16 ) * 16 ) ) 
												if ( ent2.y + ent2._hitbox_y2 > sdWorld.world_bounds.y2 - 16 )
												{
													collected = null;
													break out;
												}
											}
										}
									}
								}
							}
						}

						if ( collected )
						{
							//e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_FALLING_STATIC_BLOCK });
							next_drop = sdWorld.time + 3000;
							
							sdSteeringWheel.ComplexElevatorLikeMove( collected, undefined, 0, 16, false, 1, true );
						}
					}
				}
			}
			
			timer.ScheduleAgain( drop_rate );

		}, drop_rate );*/
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) ? -5 : -8; }
	get hitbox_x2()  { return ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) ? 5 : 8; }
	get hitbox_y1()  { return ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) ? -7 : -8; }
	get hitbox_y2()  { return ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) ? 8 : 8; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.type = params.type || 0;

		this._hea = 800 * 2;
		this._hmax = 800 * 2;
		
		this.matter = ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) ? 500 : 0;
		this.matter_max = this.matter;
		
		this._regen_timeout = 0;
		
		this._last_stop_sound = 0;
		this._last_malfunction_sound = 0;
		this._last_movement_stop = 0;
		
		this.driver0 = null;
		
		this._owner = null; // Updated when used
		
		this.toggle_enabled = false;
		this._toggle_source_current = null;
		this._toggle_direction_current = null;
		
		this._scan = [ this ];
		this._scan_set = null;
		this._scan_net_ids = [ this._net_id ];
		
		this.vx = 0;
		this.vy = 0;
		
		this.speed = 0; // Depends on amount of thrusters found
		
		if ( this.type === sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
		this.speed = 4;
	
		this._progression_unrounded = 0; // For slow motors
	
		this.stop_on_impact = true;
		this.stop_on_track_loss = true;
		
		this.is_stuck = false;
		
		this._last_scan = 0;
		
		this._schedule_rounding_task = false;
		
		sdSteeringWheel.steering_wheels.push( this );
	}
	onToggleEnabledChange() // Called via sdButton
	{
		if ( this.type === sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
		{
			if ( sdWorld.time > this._last_stop_sound + 1000 )
			{
				if ( this.toggle_enabled )
				{
					if ( sdWorld.time > this._last_stop_sound - 1000 )
					{
						if ( sdWorld.time > this._last_malfunction_sound + 1000 )
						{
							this._last_malfunction_sound = sdWorld.time;
							sdSound.PlaySound({ name:'motor_malfunction', x:this.x, y:this.y, pitch:1, volume:1 });
						}
					}
					else
					sdSound.PlaySound({ name:'motor_start', x:this.x, y:this.y, pitch:1, volume:1 });
				}
				else
				{
					if ( sdWorld.time > this._last_malfunction_sound + 1000 )
					if ( sdWorld.time > this._last_stop_sound + 1000 )
					sdSound.PlaySound({ name:'motor_stop', x:this.x, y:this.y, pitch:1, volume:1 });
				}
			}
		}
	}
	RemovePointersToThisSteeringWheel()
	{
		if ( this._scan && this._scan.length > 0 )
		{
			for ( let i = 0; i < this._scan.length; i++ )
			if ( this._scan[ i ]._steering_wheel_net_id === this._net_id )
			this._scan[ i ]._steering_wheel_net_id = -1;
		}
		else
		{
			for ( let i = 0; i < this._scan_net_ids.length; i++ )
			{
				let e = sdEntity.entities_by_net_id_cache_map.get( this._scan_net_ids[ i ] );
				
				if ( e ) // Happens on world bounds move somehow
				if ( e._steering_wheel_net_id === this._net_id )
				e._steering_wheel_net_id = -1;
			}
		}
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
		
		let allowed_bsu_list = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
		
		this._last_scan = sdWorld.time;
		
		const LIMIT = sdSteeringWheel.entities_limit_per_scan;
		
		let speed = 0;
		
		//this._scan = [];
		
		let visited = new Set();
		
		let active = [ this ];
		visited.add( this );
		
		let collected = [ this ];
		
		const overlap = sdSteeringWheel.overlap;//( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) ? sdSteeringWheel.overlap : -1;
		
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
									   ent2._is_bg_entity === 1 &&
									   
									   ( !ent2.is( sdBlock ) || !ent2._natural ) &&
									   
									   (
											( ent2.is( sdBG ) && ent2.material !== sdBG.MATERIAL_GROUND && this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) 
											||
											!ent2.is( sdBG ) 
										)
									) 

									|| 

									( ent2.IsAttachableToSteeringWheel() && ent2._is_bg_entity === 0 && !ent2.is( sdBlock ) && !ent2.is( sdGrass ) ) // Ignore physical entities that will be pushed

								)
							//if ( !ent2.onThink.has_ApplyVelocityAndCollisions && ent2._is_bg_entity === 0 ) // Ignore physical entities that will be pushed
							{
								if ( ent2._shielded )
								if ( !ent2._shielded._is_being_removed )
								if ( ent2._shielded.enabled )
								if ( allowed_bsu_list.indexOf( ent2._shielded ) === -1 )
								{
									if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
									reason = 'Steering wheel can not move entities that are protected by base shielding units that are not wired to this steering wheel';
									else
									reason = 'Elevator motor can not move entities that are protected by base shielding units that are not wired to this elevator motor';
								
									collected = null;
									break out;
								}
								
								active.push( ent2 );
								collected.push( ent2 );
								
								if ( ent2.is( sdThruster ) )
								{
									speed++;
								}
								
								if ( collected.length > LIMIT )
								{
									if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
									reason = 'Skybase is likely stuck or too big to move (over ' + LIMIT + ' entities in a scan)';
									else
									reason = 'Entities groups is likely stuck or too big to move (over ' + LIMIT + ' entities in a scan)';
								
									collected = null;
									break out;
								}
								
								if ( ent2.is( sdSteeringWheel ) && ent2 !== this )
								{
									reason = 'Only one steering wheel/elevator motor is allowed';
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
		
		if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
		if ( reason === null )
		if ( speed === 0 )
		{
			reason = 'Skybase requires at least 1 thruster';
			collected = null;
		}
		
		if ( collected )
		{
			this.RemovePointersToThisSteeringWheel();
			
			let net_ids = [];
			for ( let i = 0; i < collected.length; i++ )
			{
				net_ids.push( collected[ i ]._net_id );
				
				collected[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, observer: character_to_tell_result_to });
				
				collected[ i ]._steering_wheel_net_id = this._net_id;
			}
			
			this._scan = collected;
			this._scan_net_ids = net_ids;
			this._scan_set = null;
			
			this.speed = speed;
			
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
	ToggleSingleScanItem( entity, character_to_tell_result_to=null )
	{
		if ( entity === this )
		return;
	
		if ( entity._shielded && !entity._shielded._is_being_removed )
		{
			if ( character_to_tell_result_to )
			character_to_tell_result_to.Say( 'This entity is protected with base shielding unit' );
		
			return;
		}
		
		if ( entity.IsInSafeArea() )
		{
			if ( character_to_tell_result_to )
			character_to_tell_result_to.Say( 'This entity is in admin restricted area' );
		
			return;
		}
		
		if ( entity.is( sdBlock ) || entity.is( sdBG ) )
		if ( entity._natural )
		{
			if ( character_to_tell_result_to )
			character_to_tell_result_to.Say( 'Non-player-made walls can not be moved' );
		
			return;
		}
		
		let i = this._scan.indexOf( entity );
		
		//let socket_to_tell_result_to = character_to_tell_result_to ? character_to_tell_result_to._socket : null;
		if ( i === -1 )
		{
			if ( this._scan.length < sdSteeringWheel.entities_limit_per_scan )
			{
				let any_near = false;
				for ( let i = 0; i < this._scan.length; i++ )
				if ( this._scan[ i ].DoesOverlapWith( entity, 17 ) )
				{
					any_near = true;
					break;
				}
				
				if ( any_near )
				{
					this._scan.push( entity );
					this._scan_net_ids.push( entity._net_id );
					this._scan_set = null;


					entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 0.5, 2, 0.5 ], observer: character_to_tell_result_to });
					entity._steering_wheel_net_id = this._net_id;

					sdSound.PlaySound({ name:'gun_buildtool2', x:entity.x, y:entity.y, volume:1, pitch:0.75 });
				}
				else
				{
					if ( character_to_tell_result_to )
					character_to_tell_result_to.Say( 'This entity is not near anything that is already connected to elevator motor' );
				}
			}
			else
			{
				if ( character_to_tell_result_to )
				character_to_tell_result_to.Say( 'Limit of attached entities has been reached' );
			}
		}
		else
		{
			this._scan.splice( i, 1 );
			this._scan_net_ids.splice( i, 1 );
			this._scan_set = null;
			
			entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 2, 0.5, 0.5 ], observer: character_to_tell_result_to });
			
			sdSound.PlaySound({ name:'gun_buildtool2', x:entity.x, y:entity.y, volume:1, pitch:0.5 });
		}
		
		this.speed = ( this._scan.length > 0 ) ? 4 : 0;
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
	GetDriverSlotsCount()
	{
		return ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL ) ? 1 : 0;
	}
	AddDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.GetDriverSlotsCount() === 0 )
		return;
	
		if ( this.driver0 )
		{
			if ( c._socket )
			c._socket.SDServiceMessage( 'All slots are occupied' );
		
			return;
		}
		this.driver0 = c;
		
		c.driver_of = this;
		c.SetCameraZoom( 1 );
		
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
				
				this._scan[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
			else
			if ( this._scan[ i ].is( sdManualTurret ) )
			{
				this._scan[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
		}
	
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	
	ExcludeDriver( c, force=false )
	{
		if ( !force )
		if ( !sdWorld.is_server )
		return;
		
		this.driver0 = null;
		c.SetCameraZoom( sdWorld.default_zoom );
		
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
		if ( prop === '_toggle_direction_current' ) return true;
		if ( prop === '_toggle_source_current' ) return true;
		
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
		
		if ( this.driver0 )
		if ( this.driver0._is_being_removed || this.driver0.hea <= 0 )
		{
			this.ExcludeDriver( this.driver0 );
			//this.driver0 = null;

			//this._schedule_rounding_task = true;
		}
		
		if ( sdWorld.is_server )
		{
			this.is_stuck = ( sdWorld.time < this._last_movement_stop + 1000 );
			
			// When loaded from snapshot - scan might end up being not loaded
			if ( this._scan.length !== this._scan_net_ids.length )
			{
				this._scan = [];
				this._scan_set = null;
				
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
				{
					sdSteeringWheel.ComplexElevatorLikeMove( this._scan, undefined, xx, yy, true, GSPEED, false, this );
					//sdSteeringWheel.ComplexElevatorLikeMove( this._scan, this._scan_net_ids, xx, yy, true, GSPEED, false, this );
				}
				else
				this._schedule_rounding_task = false;
				
				this.vx = 0;
				this.vy = 0;
			}
			else
			if ( this.toggle_enabled && this.type === sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
			{
				if ( GSPEED > 1 )
				GSPEED = 1;
			
				this._progression_unrounded += this.speed * GSPEED / 2;
			
				//let speed = this.speed;
				let speed = this._progression_unrounded;
				
				let dx = 0;
				let dy = 0;
				
				if ( this._toggle_direction_current )
				{
					if ( this._toggle_direction_current.is( sdButton ) )
					{
						if ( this._toggle_direction_current.kind === sdButton.BUTTON_KIND_TAP_UP )
						dy = -1;
						if ( this._toggle_direction_current.kind === sdButton.BUTTON_KIND_TAP_DOWN )
						dy = 1;
						if ( this._toggle_direction_current.kind === sdButton.BUTTON_KIND_TAP_LEFT )
						dx = -1;
						if ( this._toggle_direction_current.kind === sdButton.BUTTON_KIND_TAP_RIGHT )
						dx = 1;
					}
					else
					if ( this._toggle_direction_current.is( sdNode ) )
					{
						let an = this._toggle_direction_current.variation / 8 * Math.PI * 2;
						
						dx = Math.sin( an );
						dy = -Math.cos( an );
					}
				}
				
				this.vx = dx * speed;
				this.vy = dy * speed;
				
				let xx = Math.round( this.vx );
				let yy = Math.round( this.vy );

				if ( xx !== 0 || yy !== 0 )
				{
					this._progression_unrounded -= sdWorld.Dist2D_Vector( xx, yy );
					
					this.VerifyMissingParts();
					
					const filter_candidates_function = ( e )=>
					{
						if ( e.is( sdBG ) )
						if ( e.material === sdBG.MATERIAL_PLATFORMS )
						if ( e.texture_id === sdBG.TEXTURE_ELEVATOR_PATH )
						return true;
			
						return false;
					};
					
					//let path_bgs = sdWorld.GetAnythingNear( this.x + xx + Math.sign( xx ) * 8, this.y + yy + Math.sign( yy ) * 8, 16, null, null, filter_candidates_function );
					
					let full_stop = false;
					
					//let stop_checker = sdWorld.CheckWallExists( this.x + xx, this.y + yy, null, null, null, filter_stoppers_function );
					//let stop_checker = false;
					let stops_collected = [];
					let xx2 = xx;
					let yy2 = yy;
					//while ( xx2 !== 0 || yy2 !== 0 )
					let iter = 0;
					while ( ++iter < 1000 )
					{
						const filter_stoppers_function = ( e )=>
						{
							if ( e.is( sdButton ) )
							if ( e.type === sdButton.TYPE_ELEVATOR_CALLBACK_SENSOR )
							if ( Math.abs( this.x + xx2 - e.x ) <= 1 )
							if ( Math.abs( this.y + yy2 - e.y ) <= 1 )
							if ( e !== this._toggle_source_current )
							{
								stops_collected.push( { entity:e, xx:xx2, yy:yy2 } );
							}

							return false;
						};

						sdWorld.CheckWallExists( this.x + xx2, this.y + yy2, null, null, sdSteeringWheel.button_filter, filter_stoppers_function );

						if ( xx2 !== 0 )
						xx2 = Math.sign( xx2 ) * Math.max( Math.abs( xx2 ) - 1, 0 );

						if ( yy !== 0 )
						yy2 = Math.sign( yy2 ) * Math.max( Math.abs( yy2 ) - 1, 0 );
					
						if ( xx2 === 0 && yy2 === 0 )
						break;
					}
					let stop_button = null;
					if ( stops_collected.length > 0 )
					{
						stop_button = stops_collected[ stops_collected.length - 1 ];
						xx = stop_button.xx;
						yy = stop_button.yy;
					}
					
					let can_move_on_track = sdWorld.CheckWallExists( this.x + xx + Math.sign( xx ) * 8, this.y + yy + Math.sign( yy ) * 8, null, null, null, filter_candidates_function );
					
					if ( !can_move_on_track )
					{
						while ( xx !== 0 || yy !== 0 )
						{
							if ( xx !== 0 )
							xx = Math.sign( xx ) * Math.max( Math.abs( xx ) - 1, 0 );
						
							if ( yy !== 0 )
							yy = Math.sign( yy ) * Math.max( Math.abs( yy ) - 1, 0 );
						
							if ( xx === 0 && yy === 0 )
							{
								can_move_on_track = false;
								break;
							}
							
							can_move_on_track = sdWorld.CheckWallExists( this.x + xx + Math.sign( xx ) * 8, this.y + yy + Math.sign( yy ) * 8, null, null, null, filter_candidates_function );
							
							if ( can_move_on_track )
							break;
						}
					}

					if ( this.stop_on_track_loss && !can_move_on_track )
					full_stop = true;

					if ( !full_stop )
					{
						if ( sdSteeringWheel.ComplexElevatorLikeMove( this._scan, undefined, xx, yy, false, GSPEED, false, this ) )
						{
							if ( stop_button )
							stop_button.entity.onMovementInRange( this );
						}
						else
						{
							this._last_movement_stop = sdWorld.time;
							
							if ( this.stop_on_impact )
							full_stop = true;
						}
					}
					
					if ( full_stop )
					{					
						if ( !sdWorld.inDist2D_Boolean( 0,0, this.vx,this.vy, 1 ) )
						if ( sdWorld.time > this._last_malfunction_sound + 1000 )
						if ( sdWorld.time > this._last_stop_sound + 1000 )
						{
							this._last_stop_sound = sdWorld.time;
							sdSound.PlaySound({ name:'motor_stop', x:this.x, y:this.y, pitch:1, volume:1 });
						}

						this.vx = 0;
						this.vy = 0;
						
						this._schedule_rounding_task = true;
						
						this.toggle_enabled = false;
						if ( this._toggle_source_current && !this._toggle_source_current._is_being_removed )
						this._toggle_source_current.SetActivated( false );
					}
				}
			}
			else
			if ( this.driver0 )
			{
				if ( this.driver0.hea <= 0 || !sdWorld.inDist2D_Boolean( this.x, this.y, this.driver0.x, this.driver0.y, sdSteeringWheel.lost_control_range ) )
				{
					this.ExcludeDriver( this.driver0 );
				}
				else
				{
					if ( GSPEED > 1 )
					GSPEED = 1;
				
					//let speed = Math.min( 1, this.speed / 4 );
					let speed = Math.min( 2, this.speed / 4 );
					
					let matter_cost = sdWorld.Dist2D_Vector( 
							this.driver0.act_x * GSPEED * 0.25 * speed,
							this.driver0.act_y * GSPEED * 0.25 * speed );
							
					if ( this.matter - matter_cost < 0 )
					{
						speed = 0;
						
						if ( this.driver0._socket )
						this.driver0._socket.SDServiceMessage( 'Steering wheel is out of matter. Connect steering wheel to matter sources via cable management tool.' );
					}
					else
					{
						this.matter -= matter_cost;
					}

					this.vx += this.driver0.act_x * GSPEED * 0.25 * speed;
					this.vy += this.driver0.act_y * GSPEED * 0.25 * speed;

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

						if ( this.driver0.CanMoveWithoutOverlap( this.driver0.x, this.driver0.y ) &&
							 sdSteeringWheel.ComplexElevatorLikeMove( this._scan, undefined, xx, yy, false, GSPEED, false, this )
							 //sdSteeringWheel.ComplexElevatorLikeMove( this._scan, this._scan_net_ids, xx, yy, false, GSPEED, false, this )
							)
						{
							/*if ( this.driver0.CanMoveWithoutOverlap( this.driver0.x + xx, this.driver0.y + yy ) )
							{
								this.driver0.x += xx;
								this.driver0.y += yy;
								
								sdWorld.UpdateHashPosition( this.driver0, false, false );
							}*/
						}
						else
						{					
							if ( !sdWorld.inDist2D_Boolean( 0,0, this.vx,this.vy, 1 ) )
							if ( sdWorld.time > this._last_stop_sound + 1000 )
							{
								this._last_stop_sound = sdWorld.time;
								sdSound.PlaySound({ name:'world_hit2', x:this.x, y:this.y, pitch:0.5, volume:1 });
								//sdSound.PlaySound({ name:'motor_stop', x:this.x, y:this.y, pitch:1, volume:1 });
							}

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
			current._steering_wheel_net_id = -1;
		
			if ( current.is( sdThruster ) )
			{
				if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
				this.speed--;

				current.enabled = false;
				current._update_version++;
			}
			
			if ( meltdown )
			current.ApplyStatusEffect({ type: sdStatusEffect.TYPE_FALLING_STATIC_BLOCK }); // Very cursed thing - can cause bases to be melted
		}
		

		this._scan.splice( i, 1 );

		if ( this._scan_net_ids )
		this._scan_net_ids.splice( i, 1 );
	
		this._scan_set = null;
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
	
	static ComplexElevatorLikeMove( scan, _scan_net_ids, xx, yy, forceful, GSPEED, force_push_bsus=false, initiator=null ) // GSPEED only used for damage scaling
	{
		let stuff_to_push = [];
		let stopping_entities = [];
		let stopped_entities = []; // Ones that are likely to take damage, together with stopping_entities

		let will_move = true;
		
		let scan_set = null;
		
		if ( initiator )
		{
			if ( !initiator._scan_set || initiator._scan_set.size !== scan.length )
			initiator._scan_set = new Set( scan );
	
			scan_set = initiator._scan_set;
		}
		else
		{
			throw new Error( 'Unable to cache _scan_set' );
		}
		
		const AddPushable = ( ent2 )=>
		{
			if ( scan_set.has( ent2 ) )
			{
				return false;
			}
			
			if ( stuff_to_push.indexOf( ent2 ) === -1 )
			{
				stuff_to_push.push( ent2 );
				
				if ( ent2.is( sdWorld.entity_classes.sdStorage ) )
				debugger;
				
				RecursivelyAddItemsLyingOnTop( ent2 );
				
				return true;
			}
			return false;
		};
		
		const CanAPassThroughB = ( a, b )=>
		{
			// Let sample builders go through unprotected walls since it might be the one building them
			if ( a.is( sdSampleBuilder ) || a.is( sdTeleport ) )
			if ( !b.is( sdSampleBuilder ) && !b.is( sdTeleport ) )
			if ( 
					typeof b._shielded === 'undefined' ||
					(
						( b._shielded === null || b._shielded === a._shielded ) // Allow going through walls that are protected with no or same BSU
					)
					|| 
					b.IsPhysicallyMovable() // Let crystals be pushed into teleports
				 )
			return true;
			
			// Check if storage can pick up item
			if ( a.is( sdStorage ) )
			{
				a.onMovementInRange( b );
				b.onMovementInRange( a );
				
				if ( b._is_being_removed )
				return true;
			}
			
			// Check if amplifier/combiner can pick crystal
			if ( a.is( sdMatterAmplifier ) || a.is( sdCrystalCombiner ) )
			if ( b.is( sdCrystal ) )
			{
				a.onMovementInRange( b );
				b.onMovementInRange( a );

				if ( b._is_being_removed || b.held_by === a )
				return true;
			}

			if ( b.is( sdButton ) )
			return true;
			
			return false;
		};
		
		const Filter = ( ent2, current, declare_stopping=true )=>
		{
			if ( ent2._is_being_removed )
			{
				//trace( 'Skipped potentially stopping entity that is being removed', ent2 );
				return false;
			}
			
			if ( ent2.GetClass() === 'sdBone' )
			return false;	
			
			/*if ( scan_set.has( ent2 ) )
			return false;
		
			if ( stuff_to_push.indexOf( ent2 ) !== -1 )
			return false;*/

			if ( ent2.onThink.has_ApplyVelocityAndCollisions && ( ent2.IsPhysicallyMovable() || ent2.is( sdBaseShieldingUnit ) ) )
			{
				if ( CanAPassThroughB( current, ent2 ) )
				return false;

				if ( CanAPassThroughB( ent2, current ) )
				return false;

				if ( AddPushable( ent2 ) )
				{
					//ent2.CanMoveWithoutOverlap( ent2.x + xx, ent2.y + yy, 0, ( ent3 )=>{ return Filter( ent3, ent2 ); }, GetIgnoredEntityClassesFor( ent2 ) );
					ent2.CanMoveWithoutOverlap( ent2.x + xx, ent2.y + yy, 0, ( ent3 )=>{ return Filter( ent3, ent2, declare_stopping ); }, GetIgnoredEntityClassesFor( ent2 ) );
				}
			}
			else
			{
				//if ( scan.indexOf( ent2 ) === -1 )
				if ( !scan_set.has( ent2 ) )
				{
					if ( CanAPassThroughB( current, ent2 ) )
					return false;
				
					if ( CanAPassThroughB( ent2, current ) )
					return false;

					if ( stopping_entities.indexOf( ent2 ) === -1 )
					if ( stuff_to_push.indexOf( ent2 ) === -1 )
					{
						if ( declare_stopping )
						{
							stopping_entities.push( ent2 );

							//trace( 'Added stopping entity', ent2 );

							if ( !forceful )
							if ( stopped_entities.indexOf( current ) === -1 )
							stopped_entities.push( current );
						}
						else
						{
							return true;
						}
					}
				}
			}

			return false;
		};

		const GetIgnoredEntityClassesFor = ( current )=>
		{
			if ( current.is( sdDoor ) )
			return sdDoor.ignored_entity_classes_travel;

			return current.GetIgnoredEntityClasses();
		};

		const AddItemToPushWithAnythingOnTop = ( ent2, ignore_physically_movable_test=false )=>
		{
			if ( !ent2._is_being_removed )
			if ( ignore_physically_movable_test || ent2.IsPhysicallyMovable() )
			AddPushable( ent2 );
			/*if ( AddPushable( ent2 ) )
			{
				RecursivelyAddItemsLyingOnTop( ent2 );
			}*/
		};
		const RecursivelyAddItemsLyingOnTop = ( current )=>
		{
			if ( current._phys_entities_on_top )
			for ( let i = 0; i < current._phys_entities_on_top.length; i++ )
			{
				let ent2 = current._phys_entities_on_top[ i ];

				AddItemToPushWithAnythingOnTop( ent2 );
			}
			
			//if ( current.is( sdWorld.entity_classes.sdMatterAmplifier ) )
			//debugger;
			
			// Amplifiers and complex vehicles like sdQuadro or even sdSandWorm-s
			let arr = current.getRequiredEntities( null );
			if ( arr )
			for ( let i = 0; i < arr.length; i++ )
			{
				let ent2 = arr[ i ];
				if ( current.DoesOverlapWith( ent2, 8 ) )
				AddItemToPushWithAnythingOnTop( ent2, true );
			}
		};
		
		if ( initiator.driver0 )
		AddItemToPushWithAnythingOnTop( initiator.driver0 );

		for ( let i = 0; i < scan.length; i++ )
		{
			let current = scan[ i ];
			
			RecursivelyAddItemsLyingOnTop( current ); // So they aren't hittable by some part of scan that doesn't know about them yet
		}
		
		for ( let i = 0; i < scan.length; i++ )
		{
			let current = scan[ i ];

			if ( current.CanMoveWithoutOverlap( current.x + xx, current.y + yy, 0, ( ent2 )=>{ return Filter( ent2, current ); }, GetIgnoredEntityClassesFor( current ) ) )
			{
			}
			else
			{
				// Stopped by sdDeepSleep case, they won't trigger filter
				if ( !forceful )
				if ( stopped_entities.indexOf( current ) === -1 )
				stopped_entities.push( current );
			}
			
			if ( current.x + xx + current._hitbox_x2 > sdWorld.world_bounds.x2 )
			will_move = false;
			else
			if ( current.x + xx + current._hitbox_x1 < sdWorld.world_bounds.x1 )
			will_move = false;
			else
			if ( current.y + yy + current._hitbox_y2 > sdWorld.world_bounds.y2 )
			will_move = false;
			else
			if ( current.y + yy + current._hitbox_y1 < sdWorld.world_bounds.y1 )
			will_move = false;
		}
		
		let partial_push_movement = new Map();
		let no_xx = 0;
		let no_yy = 1;
		
		for ( let i = 0; i < stuff_to_push.length; i++ )
		{
			let current = stuff_to_push[ i ];
			
			if ( current.CanMoveWithoutOverlap( current.x + xx, current.y + yy, 0, ( ent2 )=>{ return Filter( ent2, current, false ); }, GetIgnoredEntityClassesFor( current ) ) )
			{
			}
			else
			{
				if ( current.CanMoveWithoutOverlap( current.x, current.y + yy, 0, ( ent2 )=>{ return Filter( ent2, current, false ); }, GetIgnoredEntityClassesFor( current ) ) )
				{
					partial_push_movement.set( current, no_xx );
				}
				else
				if ( current.CanMoveWithoutOverlap( current.x + xx, current.y, 0, ( ent2 )=>{ return Filter( ent2, current ); }, GetIgnoredEntityClassesFor( current ) ) )
				{
					partial_push_movement.set( current, no_yy );
				}
				else
				{
					// Stopped by sdDeepSleep case, they won't trigger filter
					if ( !forceful )
					if ( stopped_entities.indexOf( current ) === -1 )
					stopped_entities.push( current );
				}
			}
			
			if ( current.x + xx + current._hitbox_x2 > sdWorld.world_bounds.x2 && !current.CanMoveWithoutOverlap( current.x - 1, current.y ) )
			will_move = false;
			else
			if ( current.x + xx + current._hitbox_x1 < sdWorld.world_bounds.x1 && !current.CanMoveWithoutOverlap( current.x + 1, current.y ) )
			will_move = false;
			else
			if ( current.y + yy + current._hitbox_y2 > sdWorld.world_bounds.y2 && !current.CanMoveWithoutOverlap( current.x, current.y - 1 ) )
			will_move = false;
			else
			if ( current.y + yy + current._hitbox_y1 < sdWorld.world_bounds.y1 && !current.CanMoveWithoutOverlap( current.x, current.y + 1 ) )
			will_move = false;
		}

		if ( stopping_entities.length > 0 || stopped_entities.length > 0 )
		will_move = false;
	
		//trace( 'stuff_to_push', stuff_to_push );
		
		if ( will_move || forceful || force_push_bsus )
		for ( let i = 0; i < stuff_to_push.length; i++ )
		{
			let item = stuff_to_push[ i ];
			
			if ( item.is( sdBaseShieldingUnit ) )
			{
				if ( item.pushable || force_push_bsus || !sdBaseShieldingUnit.enable_nearby_claiming )
				item.charge = 0;
				else
				will_move = false;
			}
		}
		

		if ( will_move || forceful )
		{
			for ( let i = 0; i < scan.length; i++ )
			{
				let current = scan[ i ];

				current.x += xx;
				current.y += yy;
				sdWorld.UpdateHashPosition( current, false, false );
				current._last_x = current.x; // Hacky, prevents calling ManageTrackedPhysWakeup in sdWorld entity loop
				current._last_y = current.y; // Hacky, prevents calling ManageTrackedPhysWakeup in sdWorld entity loop
				
				//current.ManageTrackedPhysWakeup();

				if ( current.is( sdDoor ) )
				{
					if ( current.x0 !== null )
					current.x0 += xx;

					if ( current.y0 !== null )
					current.y0 += yy;
				}
				
				if ( current._shielded )
				{
					current._shielded.ProtectedEntityMoved( current );
				}

				if ( current.is_static )
				{
					current.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_MOVEMENT_SMOOTH, tx:current.x, ty:current.y });
				}
				
				current.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				
			}
			for ( let i = 0; i < stuff_to_push.length; i++ )
			{
				let item = stuff_to_push[ i ];
				
				let partial_movement_info = partial_push_movement.get( item );
				
				if ( partial_movement_info === undefined )
				{
					item.x += xx;
					item.y += yy;
				}
				else
				if ( partial_movement_info === no_xx )
				{
					item.y += yy;
				}
				else
				if ( partial_movement_info === no_yy )
				{
					item.x += xx;
				}
				else
				{
					throw new Error();
				}
				sdWorld.UpdateHashPosition( item, false, false );
				item._last_x = item.x; // Hacky, prevents calling ManageTrackedPhysWakeup in sdWorld entity loop
				item._last_y = item.y; // Hacky, prevents calling ManageTrackedPhysWakeup in sdWorld entity loop
				
				item.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				
				item.PhysWakeUp();
				
				//item.ManageTrackedPhysWakeup();
				
				if ( ( item.is( sdCrystal ) && item.held_by ) || item.IsPlayerClass() )
				{
					// Crystals in amplifiers look buggy for some reason
				}
				else
				item.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_MOVEMENT_SMOOTH, tx:item.x, ty:item.y });
			}
			
			// Call movement in range for everything together, or else motors won't trigger any switches
			for ( let i = 0; i < scan.length; i++ )
			{
				let current = scan[ i ];
				sdWorld.UpdateHashPosition( current, false, true );
			}
			for ( let i = 0; i < stuff_to_push.length; i++ )
			{
				let current = stuff_to_push[ i ];
				sdWorld.UpdateHashPosition( current, false, true );
			}
		}
		else
		{
			for ( let i = 0; i < stopping_entities.length; i++ )
			{
				if ( !stopping_entities[ i ].is( sdBG ) || stopping_entities[ i ].material === sdBG.MATERIAL_GROUND )
				stopping_entities[ i ].DamageWithEffect( 5 * GSPEED, initiator );
			
				if ( initiator )
				if ( initiator.driver0 )
				stopping_entities[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 2, 0.5, 0.5 ], observer: initiator.driver0 });
			}
			for ( let i = 0; i < stopped_entities.length; i++ )
			{
				if ( !stopped_entities[ i ].is( sdBG ) || stopped_entities[ i ].material === sdBG.MATERIAL_GROUND )
				stopped_entities[ i ].DamageWithEffect( 5 * GSPEED, initiator );
			
				if ( initiator )
				if ( initiator.driver0 )
				stopped_entities[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 2, 0.5, 0.5 ], observer: initiator.driver0 });
			}
			
			return false;
		}
		return true;
	}
	
	get title()
	{
		if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
		return 'Skybase steering wheel';
		
		return 'Elevator motor';
	}
	get description()
	{
		if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
		return 'Lets you move your whole base assuming it isn\'t insanely big. Base should have thrusters. Make sure to connect your base shielding units to this steering wheel via cable management tool.';
	
		return 'Lets you move small elevators along elevator path background walls. Use weld tool to pick this elevator motor and then start welding walls and backgrounds you want to add. Use cable-connected directional buttons to control elevator motor.';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.matter_max > 0 )
		sdEntity.Tooltip( ctx, this.title + ' ( '+Math.round( this.matter )+' / '+this.matter_max+' )' );
		else
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
		ctx.drawImageFilterCache( sdSteeringWheel.img_steering_wheel, - 16, - 16, 32,32 );
		else
		{
			let xx = 0;
			
			if ( this.is_stuck )
			xx = 64;
			else
			if ( this.toggle_enabled )
			xx = 32;
			
			ctx.drawImageFilterCache( sdSteeringWheel.img_elevator_motor, 8+xx,8,16,16, - 8, - 8, 16,16 );
		}
	}
	
	DrawIn3D()
	{
		if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
		return super.DrawIn3D();
		else
		return FakeCanvasContext.DRAW_IN_3D_BOX; 
	}
	onBeforeRemove()
	{
		let id = sdSteeringWheel.steering_wheels.indexOf( this );
		
		if ( id !== -1 )
		sdSteeringWheel.steering_wheels.splice( id, 1 );
		else
		debugger;
	}
	
	onRemove() // Class-specific, if needed
	{
		/*if ( this.driver0 )
		this.ExcludeDriver( this.driver0, true );
		*/
		this.RemovePointersToThisSteeringWheel();
			
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 5 );
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
				if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
				{
					if ( command_name === 'SCAN' )
					this.Scan( exectuter_character );
				}
				else
				if ( this.type === sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
				{
					if ( command_name === 'SCAN' )
					this.Scan( exectuter_character );
				
					if ( command_name === 'SET_SPEED' )
					{
						for ( let i = 1; i <= 32; i *= 2 )
						if ( i === parameters_array[ 0 ] )
						{
							this.speed = i;
							this._update_version++;
							break;
						}
					}
					else
					if ( command_name === 'TOGGLE_IMPACT_STOP' )
					{
						this.stop_on_impact = !this.stop_on_impact;
						this._update_version++;
					}
					else
					if ( command_name === 'TOGGLE_TRACK_LOSS_STOP' )
					{
						this.stop_on_track_loss = !this.stop_on_track_loss;
						this._update_version++;
					}
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
			if ( this.type === sdSteeringWheel.TYPE_STEERING_WHEEL )
			this.AddContextOption( 'Rescan base entities', 'SCAN', [] );
			else
			if ( this.type === sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
			{
				this.AddContextOption( 'Re-weld nearby entities', 'SCAN', [] );
			
				for ( let i = 1; i <= 32; i *= 2 )
				this.AddContextOption( 'Set motor speed to ' + i/2, 'SET_SPEED', [ i ], true, ( this.speed === i ) ? { color:'#00ff00' } : {} );
			
				this.AddContextOption( 'Stop on impact: ' + ( this.stop_on_impact ? 'Yes' : 'No' ), 'TOGGLE_IMPACT_STOP', [], true, ( this.stop_on_impact ) ? { color:'#00ff00' } : { color:'#ff0000' } );
				this.AddContextOption( 'Stop on track end: ' + ( this.stop_on_track_loss ? 'Yes' : 'No' ), 'TOGGLE_TRACK_LOSS_STOP', [], true, ( this.stop_on_track_loss ) ? { color:'#00ff00' } : { color:'#ff0000' } );
			}
		}
	}
}
//sdSteeringWheel.init_class();

export default sdSteeringWheel;
