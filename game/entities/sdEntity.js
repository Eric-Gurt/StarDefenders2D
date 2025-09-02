

/* global sdSound, sdContextMenu, sdRenderer, globalThis, sdChat, Map */

import sdWorld from '../sdWorld.js';
//import sdKeyStates from '../sdKeyStates.js';
//import sdSound from '../sdSound.js';
//import sdEffect from './sdEffect.js';


//var entity_net_ids = 0;

let sdCable = null;
let sdStatusEffect = null;
let sdBullet = null;
//let sdCrystal = null;
//let sdMatterAmplifier = null;

let skipper = 0;

let GetAnythingNear = null;
let sdArea = null;
//let sdSound = null;
//let sdDeepSleep = null;
//let sdKeyStates = null;
//let sdStatusEffect = null;
			
class sdEntity
{
	/*static get entities_by_net_id_cache()
	{
		throw new Error( 'Outdated property. Property is no longer an array but is a Map instead' );
	}*/
	static init_class()
	{
		//console.log('sdEntity class initiated');
		sdEntity.entities = [];
		/*{
			let old_push = sdEntity.entities.push;
			sdEntity.entities.push = ( ...es )=>
			{
				for ( let i = 0; i < es.length; i++ )
				{
					if ( 0 )
					{
						if ( es[ i ]._added_times === undefined )
						es[ i ]._added_times = 1;
						else
						throw new Error( 'Adding same object twice?' );
					}
					
					if ( 0 )
					if ( Date.now() > sdWorld.time - 100 )
					if ( es[ i ]._is_being_removed )
					if ( sdWorld.entity_classes.sdEntity.active_entities.indexOf( es[ i ] ) === -1 )
					throw new Error( 'Adding removed object to the objects list?' );
				}
				
				old_push.call( sdEntity.entities, ...es );
			};
		}*/
		
		sdEntity.global_entities = []; // sdWeather. This array contains extra copies of entities that exist in primary array, which is sdEntity.entities. Entities add themselves here and remove themselves whenever proper disposer like _remove is called.
		
		sdEntity.snapshot_clear_crawler_i = 0; // Slowly cleans up any snapshot data which could help saving some memory, sometimes by a half
		
		sdEntity.active_entities = [];
		
		sdEntity.to_seal_list = [];
		sdEntity.to_finalize_list = [];
		
		sdEntity.HIBERSTATE_ACTIVE = 0;
		sdEntity.HIBERSTATE_HIBERNATED = 1;
		sdEntity.HIBERSTATE_REMOVED = 2;
		sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP = 3; 
		
		sdEntity.SCORE_REWARD_EASY_MOB = 1;
		sdEntity.SCORE_REWARD_AVERAGE_MOB = 3;
		sdEntity.SCORE_REWARD_CHALLENGING_MOB = 5;
		sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB = 10;
		sdEntity.SCORE_REWARD_BOSS = 30;
		sdEntity.SCORE_REWARD_BOSS_OVERPOWERED = 60;
		//sdEntity.SCORE_REWARD_COMMON_TASK_ITEM = 3;
		//sdEntity.SCORE_REWARD_UNCOMMON_TASK_ITEM = 15;
		sdEntity.SCORE_REWARD_TEDIOUS_TASK = 20;
		sdEntity.SCORE_REWARD_BIG_EVENT_TASK = 50;
		sdEntity.SCORE_REWARD_ADMIN_CRATE = 100000;
		sdEntity.SCORE_REWARD_SCORE_SHARD = 1;
		sdEntity.SCORE_REWARD_SCORE_MOP = 1;
		sdEntity.SCORE_REWARD_BROKEN_5K_CRYSTAL = 5;
		sdEntity.SCORE_REWARD_BROKEN_CRAB_CRYSTAL = 1;
		sdEntity.SCORE_REWARD_BROKEN_BIG_CRAB_CRYSTAL = 3;
		sdEntity.SCORE_REWARD_TASK_ITEM_FUNCTION = ( entity )=>
		{
			if ( entity.is( sdWorld.entity_classes.sdCrystal ) )
			{
				return Math.ceil( entity.matter_max / 640 );
			}
			
			if ( entity.is( sdWorld.entity_classes.sdJunk ) )
			return Math.ceil( sdWorld.entity_classes.sdJunk.ScoreScaleByType( entity.type ) ); // 20 for artifacts, 5 for other items
		
			return 15; // Common task item teleportation, mostly for creatures
		};
		
		/*sdEntity.MATTER_MODE_UNDECIDED = 0;
		sdEntity.MATTER_MODE_NONE = 1;
		sdEntity.MATTER_MODE_PUBLIC = 2;
		sdEntity.MATTER_MODE_PRIVATE = 3;*/
		
		//sdEntity.entities_by_net_id_cache = {};
		sdEntity.entities_by_net_id_cache_map = new Map();
		sdEntity.removed_entities_info = new Map(); // Map[by _net_id] of { entity, ttl } // Is used to keep track for last state sync, usually just for _broken property of sdBlock objects
		
		sdEntity.entity_net_ids = 0;
		
		sdEntity.matter_discretion_frames = 5; // Matter transfer happens once per this many frames, this value also scales GSPEED applied for matter transfer
		
		//sdEntity.phys_stand_on_map = new WeakMap(); // Key is an object on which something lies on, value is an array of objects that are currently hibernated (such as sdStorage)
		
		sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION = 1;
		sdEntity.COLLISION_MODE_ONLY_CALL_TOUCH_EVENTS = 2;
		
		sdEntity.flag_counter = 0; // For marking entities as visited by WeakSet-like logic, but works faster
		
		sdEntity.y_rest_tracker = new WeakMap(); // entity => { y, repeated_sync_count }
		
		//sdEntity.properties_by_class_all = new WeakMap(); // class => [ 'x', 'y' ... ]
		//sdEntity.properties_by_class_public = new WeakMap(); // class => [ 'x', 'y' ... ]
		sdEntity.properties_by_class_public = new Map(); // _class_id => [ 'x', 'y' ... ]
		
		sdEntity.removed_object = { _is_being_removed: true };//404.12345;
		sdEntity.pointer_has_been_cleared = { _inaccessible: true };//403.98765;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdWorld.entity_classes_array = null;
		
		sdEntity.properties_important_upon_creation = [
			'class',
			'type',
			'mission',
			'variation', // Grass, needs for timers
			'natural' // For proper dirt counting
		];
		
		sdEntity.default_driver_position_offset = { x:0, y:0 };
		
		sdEntity.debug_track_unrest_physics = null;
		sdEntity.debug_track_object_physics = null;
		//sdEntity.phys_near_statics = new WeakMap(); // entity => { left, right, top, bottom }
	}
	static Create( class_ptr, params={ x:0, y:0 } ) // Does UpdateHashPosition with onMovementInRange call. Not doing UpdateHashPosition is how objects may appear on top of sdDeepSleep and cause memory leaks 
	{
		if ( !sdWorld.is_server )
		return null;
		
		let ent = new class_ptr( params );
		sdEntity.entities.push( ent );
		sdWorld.UpdateHashPosition( ent, false, true );
		return ent;
	}
	static AllEntityClassesLoadedAndInitiated()
	{
		sdWorld.entity_classes_array = Object.values( sdWorld.entity_classes );
		
		// Make this consistent on server and client
		sdWorld.entity_classes_array.sort( (a,b)=>{ return a.name.localeCompare( b.name ); } );
		
		for ( let i = 0; i < sdWorld.entity_classes_array.length; i++ )
		sdWorld.entity_classes_array[ i ].class_id = i;
	
		for ( let i = 0; i < sdWorld.entity_classes_array.length; i++ )
		if ( sdWorld.entity_classes_array[ i ].init )
		sdWorld.entity_classes_array[ i ].init();
	}
	
	
	GetRandomEntityNearby( range )
	{
		let an = Math.random() * Math.PI * 2;

		if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.x + Math.sin( an ) * range, this.y + Math.cos( an ) * range, this ) )
		{
			return sdWorld.last_hit_entity;
		}
		return null;
	}
	
	static GetRandomEntity()
	{
		if ( sdEntity.entities.length > 0 )
		{
			let e = sdEntity.entities[ Math.floor( Math.random() * sdEntity.entities.length ) ];
			
			if ( !e._is_being_removed )
			return e;
		}
	
		return null;
	}
	
	static GetRandomActiveEntity() // For drones and more things in future?
	{
		if ( sdEntity.active_entities.length > 0 )
		{
			let e = sdEntity.active_entities[ Math.floor( Math.random() * sdEntity.active_entities.length ) ];
			
			if ( !e._is_being_removed )
			return e;
		}
	
		return null;
	}
	
	GetCollisionMode()
	{
		return sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION;
	}
	
	static TrackPhysWakeup( bottom_ent, top_ent )
	{
		top_ent.SetPhysRestOn( bottom_ent );
		
		//var arr = sdEntity.phys_stand_on_map.get( bottom_ent );
		/*let arr = bottom_ent._phys_entities_on_top;
		
		if ( arr === null )
		{
			top_ent.SetPhysRestOn( bottom_ent );
		}
		else
		{
			let id = arr.indexOf( top_ent );
			
			if ( id === -1 )
			{
				// Slow partial cleanup
				if ( arr.length > 5 )
				for ( let i2 = 0; i2 < 2; i2++ )
				{
					let i = ~~( arr.length * Math.random() );
					
					let e = arr[ i ];
					
					if ( 
							e._is_being_removed 
							|| 
							( 
								e._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED 
								&& 
								e._phys_sleep > 0
							)
							||
							e._phys_last_rest_on !== bottom_ent
						)
					{
						arr.splice( i, 1 );
					}
				}

				arr.push( top_ent );

				if ( sdWorld.is_server )
				if ( arr.length > 300 )
				{
					//console.warn( 'Too many objets lie on top of ',bottom_ent,'objects list:', arr );
					debugger;
				}
			}
		}*/
	}
	SetPhysRestOn( best_ent )
	{
		if ( typeof this._phys_last_rest_on !== 'undefined' )
		if ( this._phys_last_rest_on !== best_ent )
		{
			let old_rest_on = this._phys_last_rest_on;

			this._phys_last_rest_on = best_ent;
			
			if ( this._phys_last_rest_on )
			{
				if ( this._phys_last_rest_on._phys_entities_on_top === null )
				{
					this._phys_last_rest_on._phys_entities_on_top = [ this ];
				}
				else
				{
					let ind = this._phys_last_rest_on._phys_entities_on_top.indexOf( this );
					if ( ind === -1 )
					{
						this._phys_last_rest_on._phys_entities_on_top.push( this );
						
						//this._phys_last_rest_on.CleanupOutdatedItemsOnTop();
					}
				}
			}
			
			if ( old_rest_on )
			if ( !old_rest_on._is_being_removed )
			{
				let arr = old_rest_on._phys_entities_on_top;
				if ( arr )
				{
					let ind = arr.indexOf( this );
					if ( ind !== -1 )
					{
						arr.splice( ind, 1 );

						if ( arr.length === 0 )
						old_rest_on._phys_entities_on_top = null;
					}
				}
				//old_rest_on.ManageTrackedPhysWakeup();
			}
		}
	}
	ManageTrackedPhysWakeup() // Can make sense to call this on entity deletion too
	{
		//var arr = sdEntity.phys_stand_on_map.get( this );
		
		let arr = this._phys_entities_on_top;
		if ( arr )
		{
			for ( let i = 0; i < arr.length; i++ )
			{
				let e = arr[ i ];
				if ( 
						e._is_being_removed 
						||
						!this.DoesOverlapWith( e, 1 )
						||
						e._phys_last_rest_on !== this
					)
				{
					if ( e._phys_last_rest_on === this )
					{
						e._phys_last_rest_on = null;
						
						if ( !e._is_being_removed )
						e.PhysWakeUp();
					}
					
					if ( arr.length === 1 )
					{
						this._phys_entities_on_top = null;
						break;
					}
					else
					{
						arr.splice( i, 1 );
						i--;
						continue;
					}
				}
				else
				if ( e._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED && e._phys_sleep > 0 ) // Active and moving
				{
					continue;
				}
				else
				{
					e.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					e.PhysWakeUp();
				}
			}
		}
		
		/*if ( this._phys_last_rest_on ) This should be actually handled by bottom entity on move/removal instead
		{
			if ( this._phys_last_rest_on._is_being_removed )
			{
			}
			else
			if ( !this.DoesOverlapWith( this._phys_last_rest_on, 1 ) )
			{
			}
		}*/
	}
	
	IsGlobalEntity() // Should never change
	{ return false; }
	
	get hitbox_x1() { return -5; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	PrecieseHitDetection( x, y, bullet=null ) // Teleports use this to prevent bullets from hitting them like they do. Only ever used by bullets, as a second rule after box-like hit detection. It can make hitting entities past outer bounding box very inaccurate. Can be also used to make it ignore certain bullet kinds altogether
	{
		return true;
	}
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT; }
	
	InstallBoxCapVisibilitySupport()
	{
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			this._box_cap_rethink_next = 0;
			this._box_cap_rethinks_total = 0;
			this._box_cap_left = null;
			this._box_cap_right = null;
			this._box_cap_top = null;
			this._box_cap_bottom = null;
		}
	}
	FigureOutBoxCapVisibilities( box_caps )
	{
		if ( this._box_cap_left )
		{
			let ent = this._box_cap_left;
			
			if ( !ent._is_being_removed &&
				 this.y + this._hitbox_y1 >= ent.y + ent._hitbox_y1 &&
			     this.y + this._hitbox_y2 <= ent.y + ent._hitbox_y2 &&
			     this.x + this._hitbox_x1 === ent.x + ent._hitbox_x2 )
			{
			}
			else
			this._box_cap_left = null;
		}
		if ( this._box_cap_right )
		{
			let ent = this._box_cap_right;
			
			if ( !ent._is_being_removed &&
				 this.y + this._hitbox_y1 >= ent.y + ent._hitbox_y1 &&
			     this.y + this._hitbox_y2 <= ent.y + ent._hitbox_y2 &&
			     this.x + this._hitbox_x2 === ent.x + ent._hitbox_x1 )
			{
			}
			else
			this._box_cap_right = null;
		}
		if ( this._box_cap_top )
		{
			let ent = this._box_cap_top;
			
			if ( !ent._is_being_removed &&
				 this.x + this._hitbox_x1 >= ent.x + ent._hitbox_x1 &&
			 	 this.x + this._hitbox_x2 <= ent.x + ent._hitbox_x2 &&
			 	 this.y + this._hitbox_y1 === ent.y + ent._hitbox_y2 )
			{
			}
			else
			this._box_cap_top = null;
		}
		if ( this._box_cap_bottom )
		{
			let ent = this._box_cap_bottom;
			
			if ( !ent._is_being_removed &&
				 this.x + this._hitbox_x1 >= ent.x + ent._hitbox_x1 &&
			 	 this.x + this._hitbox_x2 <= ent.x + ent._hitbox_x2 &&
			 	 this.y + this._hitbox_y2 === ent.y + ent._hitbox_y1 )
			{
			}
			else
			this._box_cap_bottom = null;
		}
		
		if ( !this._box_cap_left || !this._box_cap_right || !this._box_cap_top || !this._box_cap_bottom )
		if ( this._box_cap_rethink_next < sdWorld.time )
		{
			if ( this._box_cap_rethinks_total === 0 )
			this._box_cap_rethink_next = sdWorld.time + 50;
			else
			if ( this._box_cap_rethinks_total === 1 )
			this._box_cap_rethink_next = sdWorld.time + 100;
			else
			this._box_cap_rethink_next = sdWorld.time + 500 + Math.random() * 500;
		
			this._box_cap_rethinks_total++;

			let cells = sdWorld.GetCellsInRect( this.x + this._hitbox_x1 - 1, this.y + this._hitbox_y1 - 1, this.x + this._hitbox_x2 + 1, this.y + this._hitbox_y2 + 1 );

			for ( let c = 0; c < cells.length; c++ )
			{
				let arr = cells[ c ].arr;
				for ( let i = 0; i < arr.length; i++ )
				{
					let ent = arr[ i ];
					//if ( ent.GetClass() === this.GetClass() )
					if ( ent._class_id === this._class_id )
					if ( typeof ent.IsPartiallyTransparent === 'undefined' || ent.IsPartiallyTransparent() === this.IsPartiallyTransparent() )
					{
						if ( this.y + this._hitbox_y1 >= ent.y + ent._hitbox_y1 )
						if ( this.y + this._hitbox_y2 <= ent.y + ent._hitbox_y2 )
						{
							if ( this.x + this._hitbox_x1 === ent.x + ent._hitbox_x2 )
							this._box_cap_left = ent;
							else
							if ( this.x + this._hitbox_x2 === ent.x + ent._hitbox_x1 )
							this._box_cap_right = ent;
						}

						if ( this.x + this._hitbox_x1 >= ent.x + ent._hitbox_x1 )
						if ( this.x + this._hitbox_x2 <= ent.x + ent._hitbox_x2 )
						{
							if ( this.y + this._hitbox_y1 === ent.y + ent._hitbox_y2 )
							this._box_cap_top = ent;
							else
							if ( this.y + this._hitbox_y2 === ent.y + ent._hitbox_y1 )
							this._box_cap_bottom = ent;
						}
					}
				}
			}
			
			
			
		}
		
		box_caps.top = !this._box_cap_top;
		box_caps.right = !this._box_cap_right;
		box_caps.bottom = !this._box_cap_bottom;
		box_caps.left = !this._box_cap_left;
		
		box_caps.is_rotated = false;
	}
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG, return null or array of [x,y,z] offsets
	{ return null; }
	
	CameraDistanceScale3D( layer ) // so far called for layer FG (which is 1), usually only used by chat messages
	{ return 1; }
	
	/*get substeps() // Bullets will need more
	{ return 1; }*/
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	ThinkUntilRemoved()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these.
	{ return false; }
	
	IsPhysicallyMovable() // By physics (not steering wheels). Incorrect value can crash the game or cause players to stuck in place when trying to push entity
	{
		if ( typeof this.sx === 'undefined' )
		return false;
	
		if ( typeof this.sy === 'undefined' )
		return false;
	
		if ( this.is_static )
		return false;
	
		return true;
	}
	
	IsAttachableToSteeringWheel()
	{
		return ( !this.onThink.has_ApplyVelocityAndCollisions );
	}
	
	get is_alive() // For tasks, also for entities like sdSandWorm to override
	{
		return ( this.hea || this._hea || 0 ) > 0;
	}
	
	IsInSafeArea()
	{
		if ( !sdArea )
		sdArea = sdWorld.entity_classes.sdArea;

		return sdArea.IsEntityProtected( this );
		//return !sdWorld.entity_classes.sdArea.CheckPointDamageAllowed( this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2, this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2 );
	}
	/*IsDamageAllowedByAdmins()
	{
		if ( !sdArea )
		sdArea = sdWorld.entity_classes.sdArea;

		return sdArea.CheckPointDamageAllowed( this.x + ( this._hitbox_x2 + this._hitbox_x1 ) / 2, this.y + ( this._hitbox_y2 + this._hitbox_y1 ) / 2 );
	}*/
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( !ignore_safe_areas )
		if ( !by_entity || !by_entity._admin_picker )
		//if ( !sdWorld.entity_classes.sdArea.CheckPointDamageAllowed( this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2, this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2 ) )
		if ( this.IsInSafeArea() )
		return false;
		
		if ( this.IsAdminEntity() )
		return false;
	
		return true;
	}
	
	IsPlayerClass() // sdCharacter has it as well as everything that extends him
	{
		return false;
	}
	GiveScore( amount, killed_entity=null, allow_partial_drop=true )
	{
	}
	GiveScoreToLastAttacker( amount )
	{
		if ( sdWorld.time < this._last_attacker_until )
		{
			let attacker = null;
		
			attacker = sdEntity.entities_by_net_id_cache_map.get( this._last_attacker_net_id );
		
			if ( attacker )
			if ( attacker._is_being_removed || ( attacker.hea || attacker._hea || 0 ) <= 0 || !attacker.IsPlayerClass() || !attacker._socket )
			attacker = null;
		
			if ( attacker )
			sdWorld.GiveScoreToPlayerEntity( amount, this, true, attacker );
		}
	}
	
	GetCenterX()
	{
		return this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2;
	}
	GetCenterY()
	{
		return this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2;
	}
	GetAccurateDistance( xx, yy ) // Used on client-side when right clicking on cables (also during cursor hovering for context menu and hint), also on server when distance between cable and player is measured
	{
		return sdWorld.Dist2D(	xx, 
								yy, 
								Math.min( Math.max( this.x + this._hitbox_x1, xx ), this.x + this._hitbox_x2 ), 
								Math.min( Math.max( this.y + this._hitbox_y1, yy ), this.y + this._hitbox_y2 ) );
	}
	GetClosestPointWithinCollision( xx, yy )
	{
		return [
			Math.min( Math.max( this.x + this._hitbox_x1, xx ), this.x + this._hitbox_x2 ), 
			Math.min( Math.max( this.y + this._hitbox_y1, yy ), this.y + this._hitbox_y2 )
		];
	}
	
	IsAdminEntity() // Influences remover gun hit test
	{ return false; }
	
	/*GetRocketDamageScale() // Mostly defines damage from rockets multiplier so far
	{
		return 1;
	}*/
	IsVehicle() // Workbench, sdButton and sdRescueTeleport are all "vehicles" but they won't add player on .AddDriver call. If you wan to prevent ghost mode though - override .IsFakeVehicleForEKeyUsage() just like sdButton does
	{
		return false;
	}
	IsCarriable( by_entity ) // In hands
	{
		return ( 
				typeof this.held_by !== 'undefined' &&
				typeof this.sx !== 'undefined' &&
				this.IsVisible( by_entity ) &&
				this.IsTargetable( by_entity, true ) &&
				this.mass <= 30 && 
				this._hitbox_x2 - this._hitbox_x1 <= 16 && 
				this._hitbox_y2 - this._hitbox_y1 <= 16 );
	}
	PlayerIsHooked( character, GSPEED )
	{
	}
	PlayerIsCarrying( character, GSPEED )
	{
	}
	IsFakeVehicleForEKeyUsage()
	{
		return false;
	}
	VehicleHidesLegs()
	{
		return true;
	}
	VehicleAllowsDriverCombat( character )
	{
		return false;
	}
	GetDriverPositionOffset( character )
	{
		return sdEntity.default_driver_position_offset;
	}
	GetDriverSlotsCount() // Not specfiying this will cause phantom effect on drivers after entity was destroyed
	{
		/*if ( this.IsVehicle() )
		{
			console.warn( 'Vehicle sdEntity has no .GetDriverSlotsCount() method overriden in extended class ' + this.GetClass() );
			debugger;
		}*/
		
		return 0;
	}
	GetDriverSlotHint( best_slot )
	{
		return 'Entered slot ' + ( best_slot + 1 );
	}
	onAfterDriverAdded( best_slot )
	{
	}
	onAfterDriverExcluded( best_slot, character )
	{
	}
	ExcludeAllDrivers()
	{
		const driver_slots_total = this.GetDriverSlotsCount();
		
		for ( var i = 0; i < driver_slots_total; i++ )
		if ( this[ 'driver' + i ] )
		this.ExcludeDriver( this[ 'driver' + i ], true );
	}
	RemoveAllDrivers() // Will be called if vehicle gets removed by default
	{
		const driver_slots_total = this.GetDriverSlotsCount();
		
		for ( var i = 0; i < driver_slots_total; i++ )
		if ( this[ 'driver' + i ] )
		this[ 'driver' + i ].remove();
	}
	GetDriverZoom()
	{
		return sdWorld.default_zoom * 0.75;
	}
	AddDriver( c, force=false ) // Uses magic property _doors_locked or doors_locked
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( c.driver_of )
		return;
	
		if ( !force )// && !c._god )
		if ( ( this._doors_locked || this.doors_locked || false ) )
		{
			// Make sure it is ot a living thing
			if ( this.GetBleedEffect() !== sdWorld.entity_classes.sdEffect.TYPE_BLOOD_GREEN )
			if ( this.GetBleedEffect() !== sdWorld.entity_classes.sdEffect.TYPE_BLOOD )
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
			c.SetCameraZoom( this.GetDriverZoom() );

			if ( c._socket )
			{
				c._socket.SDServiceMessage( this.GetDriverSlotHint( best_slot ) );
			}
			
			this.onAfterDriverAdded( best_slot );
			/*
			if ( this.type === 3 && best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1, pitch:2 });
			else
			if ( best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1 });*/
				
			return true;
		}
		else
		{
			if ( !force )
			if ( c._socket )
			c._socket.SDServiceMessage( 'All slots are occupied' );
	
			return false;
		}
	}
	ExcludeDriver( c, force=false )
	{
		if ( !force )
		if ( !sdWorld.is_server )
		return;

		if ( !force )//&& !c._god )
		if ( ( this._doors_locked || this.doors_locked || false ) )
		{
			// Make sure it is ot a living thing
			if ( this.GetBleedEffect() !== sdWorld.entity_classes.sdEffect.TYPE_BLOOD_GREEN )
			if ( this.GetBleedEffect() !== sdWorld.entity_classes.sdEffect.TYPE_BLOOD )
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
				c.SetCameraZoom( sdWorld.default_zoom );
				
				// To prevent the teleport exploit
				if ( this.GetDriverSlotsCount() <= 1 )
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
		
				this.onAfterDriverExcluded( i, c );

				return;
			}
		}
		
		if ( c._socket )
		c._socket.SDServiceMessage( 'Error: Attempted leaving vehicle in which character is not located.' );
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return false; }
	
	IsCuttingHook()
	{
		return false;
	}
	
	ImpactWithDamageEffect( vel, initiator=null )
	{
		if ( sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( !sdStatusEffect )
			sdStatusEffect = sdWorld.entity_classes.sdStatusEffect;
		
			let hp_old = Math.max( 0, this.hea || this._hea || 0 );

			this.Impact( vel, initiator );

			let dmg = hp_old - Math.max( 0, this.hea || this._hea || 0 );
			if ( dmg !== 0 )
			this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_DAMAGED, by: null, dmg: dmg });
		}
		else
		{
			this.Impact( vel, initiator );
		}
	}
	
	Impact( vel, initiator=null ) // fall damage basically. Values below 5 won't be reported due to no-damage area lookup optimization
	{
		//if ( vel > 7 )
		if ( vel > 6 ) // For new mass-based model
		{
			//this.DamageWithEffect( ( vel - 4 ) * 15 );
			this.DamageWithEffect( ( vel - 3 ) * 15, initiator );
		}
	}
	TriggerMovementInRange() // Should cause onMovementInRange to be called even if no movement happens for entity. Can be used in cases when sdCharacter drops guns (so other guns can be picked up) or upgrades matter capacity (so shards can be picken up)
	{
		// Also causes some static entities to resync (sdMatterCase)
		this._last_x = undefined;
		this._last_y = undefined;
	}
	Touches( hit_what ) // For cases that are handled by ApplyVelocityAndCollisions and also player walking
	{
		if ( hit_what )
		{
			/*if ( this.GetClass() === 'sdMatterAmplifier' || hit_what.GetClass() === 'sdMatterAmplifier' )
			if ( this.GetClass() === 'sdCrystal' || hit_what.GetClass() === 'sdCrystal' )
			{
				console.log( 'sdCrystal touches sdMatterAmplifier' );
			}
			*/


			// Few more tests for crystals that hit 2 amplifiers at the same time
			if ( !this._is_being_removed )
			if ( !hit_what._is_being_removed )
			{
				if ( this.onMovementInRange !== sdEntity.prototype.onMovementInRange )
				this.onMovementInRange( hit_what );
				
				if ( !hit_what._is_being_removed )
				if ( hit_what.onMovementInRange !== sdEntity.prototype.onMovementInRange )
				hit_what.onMovementInRange( this );
			}
			
			//this.SharePhysAwake( hit_what );
			
			if ( this._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP )
			if ( this._hiberstate !== sdEntity.HIBERSTATE_REMOVED )
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
			if ( hit_what._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP )
			if ( hit_what._hiberstate !== sdEntity.HIBERSTATE_REMOVED )
			hit_what.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	
	onBeforeLongRangeTeleport( lrtp ) // Called before snapshot is taken
	{
	}
	
	get bounce_intensity()
	{ return 0; }
	
	get friction_remain()
	{ return 0.8; }
	
	IsFrictionTimeScaled() // Whether morph or just multiply
	{
		return true;
	}
	
	UseServerCollisions()
	{
		return sdWorld.is_server;
	}
	
	onBuilt() // Entity was successfully built and added to world, server-side
	{
	}
	dragWhenBuilt( builder_entity ) // true = deny animation recovery, false = allow weapon reload animation recovery
	{
		return false; // false = allow weapon reload animation recovery
	}
	dragWhenBuiltComplete( builder_entity )
	{
	}
	
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		return []; 
	}
	getTeleportGroup() // List of entities that will be teleproted together with this entity. For sdSandWorm and sdQuadro-like entities. You might want to use sdWorld.ExcludeNullsAndRemovedEntitiesForArray on returned array to filter out null pointers and removed entities
	{
		// OR return sdWorld.ExcludeNullsAndRemovedEntitiesForArray( [ this ] ); // Which is slower
		return [ this ];
	}
	
	PhysInitIfNeeded() // Method can have problems with entities that are not initially physical, it can make sense to call this method somewhere on spawn to init physical cache properties
	{
		//if ( typeof this._phys_sleep === 'undefined' )
		if ( typeof this._phys_last_touch === 'undefined' ) // Pointer is more probable to remain undefined after snapshot load
		{
			this._phys_sleep = 10; // Time until full sleep
			this._phys_last_touch = null;
			this._phys_last_rest_on = null;
			this._phys_last_w = 0;
			this._phys_last_h = 0;
			
			// Opposite velocity can cause reactivation of physics (jetpack into ceiling case which normally would cause player being stuck)
			this._phys_last_sx = false;
			this._phys_last_sy = false;
			
			this._phys_last_rest_on_targetable = false;
			this._phys_last_rest_on_x = 0;
			this._phys_last_rest_on_y = 0;
			
			//EnforceChangeLog( this, '_phys_last_touch' );
		}
	}
	PhysWakeUp() // Call this method if entity stuck mid-air
	{
		if ( typeof this._phys_last_touch === 'undefined' ) // Do not wake up non-physical bodies, such as sdAsteroid
		return;
	
		this.PhysInitIfNeeded();

		//if ( this.GetClass() === 'sdHover' )
		//console.log( this.GetClass() + ' becomes physically active (wake up method)' );

		this._phys_sleep = 10;
	}
	
	DoStuckCheck() // Makes _hard_collision-less entities receive unstuck logic (not neede anymore if that entity has step-up logic)
	{
		return false;
	}
	onPhysicallyStuck() // Requires _hard_collision OR DoStuckCheck() to return true. Called as a result of ApplyVelocityAndCollisions call. Return true if entity needs unstuck logic appleid, which can be performance-damaging too
	{
		return false;
	}
	/*IsMovesLogic( sx_sign, sy_sign )
	{
		return sx_sign !== this._phys_last_sx || 
			   sy_sign !== this._phys_last_sy || 
			   !sdWorld.inDist2D_Boolean( this.sx, this.sy, 0, 0, sdWorld.gravity + 0.1 );
	}*/
	static TrackPotentialYRest( ent )
	{
		let obj = sdEntity.y_rest_tracker.get( ent );
		
		if ( !obj )
		{
			obj = {
				y: ent.y,
				repeated_sync_count: 0
			};
			sdEntity.y_rest_tracker.set( ent, obj );
		}
		else
		{
			if ( ent.y === obj.y )
			{
				if ( obj.repeated_sync_count < 30 )
				obj.repeated_sync_count++;
			}
			else
			{
				obj.y = ent.y;
				obj.repeated_sync_count = 0;
			}
		}
	}
	
	IsPhysicallyMovable() // Correct value prevents players (and other entities) from sticking to such objects
	{
		if ( typeof this.sx !== 'undefined' )
		{
			if ( typeof this.held_by !== 'undefined' )
			if ( this.held_by )
			return false;
			
			return true;
		}
		return false;
	}
	
	static IsPushableRecursively( entity, dx, dy, recursion=0 )
	{
		if ( recursion > 10 )
		{
			return false;
		}
		
		if ( !entity.IsPhysicallyMovable() )
		//if ( typeof entity.sx === 'undefined' )
		return false;
		
		if ( entity.CanMoveWithoutOverlap( entity.x + dx, entity.y + dy ) )
		{
			return true;
		}
		else
		{
			if ( sdWorld.last_hit_entity )
			{
				return sdEntity.IsPushableRecursively( sdWorld.last_hit_entity, dx, dy, recursion + 1 );
			}
			else
			{
				return false;
			}
		}
	}
	
	static calculateInelasticCollisionWithLoss( m1, m2, v1, v2, bounce_intensity1, bounce_intensity2 )
	{
		// Calculate velocities after inelastic collision using COR
		const e = bounce_intensity1 * bounce_intensity2; // restitutionCoeff
		const w1_collision = ((m1 - e * m2) * v1 + (1 + e) * m2 * v2) / (m1 + m2);
		const w2_collision = ((1 + e) * m1 * v1 + (m2 - e * m1) * v2) / (m1 + m2);

		return [ w1_collision, w2_collision ];
	}
	
	ApplyVelocityAndCollisionsPreviouslyCarried( GSPEED, step_size=0, apply_friction=false, impact_scale=1, custom_filtering_method=null )
	{
		if ( this._last_held_by )
		{
			if ( this._last_held_by._is_being_removed || sdWorld.time > this._last_held_by_until )
			{
				this._last_held_by = null;
			}
			else
			{
				if ( this._last_held_by_filter === null )
				this._last_held_by_filter = ( e )=>
				{
					return ( e !== this._last_held_by && e.hard_collision );
				};

				if ( custom_filtering_method === null )
				{
					custom_filtering_method = this._last_held_by_filter;
				}
				else
				{
					debugger; // Filter combination is not yet supported for previously carried items
				}
			}
		}
		
		return sdEntity.prototype.ApplyVelocityAndCollisions.call( 
					this,
					GSPEED, step_size, apply_friction, impact_scale, custom_filtering_method 
		);
		//return this.ApplyVelocityAndCollisions( GSPEED, step_size, apply_friction, impact_scale, custom_filtering_method );
	}
	
	// Optimized to the point where it is same as old method (sometimes +20% slower on average though), but both methods were optimized by _hard_collision optimization
	ApplyVelocityAndCollisions( GSPEED, step_size=0, apply_friction=false, impact_scale=1, custom_filtering_method=null ) // step_size can be used by entities that can use stairs
	{
		/*
			Test who is not sleeping (might include held_by crystals that don't really call ApplyVelocityAndCollisions):
		
			for ( let i = 0; i < sdWorld.entity_classes.sdEntity.active_entities.length; i++ )
			{
				let e = sdWorld.entity_classes.sdEntity.active_entities[ i ];
				if ( e._phys_sleep > 5 )
				trace( e );
			}
		*/
		
		//const debug = ( sdWorld.my_entity === this );
		//const debug = ( this._class === 'sdBullet' && this._rail ) && sdWorld.is_server;
		//const debug = ( this._class === 'sdBullet' ) && sdWorld.is_server;
		//const debug = ( this._class === 'sdSandWorm' ) && sdWorld.is_server;
		//const debug = ( this._class === 'sdBaseShieldingUnit' ) && sdWorld.is_server;
		const debug = false;
		
		if ( !sdBullet )
		sdBullet = sdWorld.entity_classes.sdBullet;
		
		///////// Some ancient sleep logic ////////////
		{
			//this.PhysInitIfNeeded(); Done at constructor now

			//let sx_sign = ( this.sx > 0 ); Do these still make any sense?
			//let sy_sign = ( this.sy > 0 );

			let moves = ( //sx_sign !== this._phys_last_sx || 
						  //sy_sign !== this._phys_last_sy || 
						  
							Math.max(
								Math.abs( this.sx ),
								Math.abs( this.sy )
							) > ( sdWorld.gravity + 0.2 ) * Math.max( 1, GSPEED ) );
							//) > ( sdWorld.gravity + 0.2 ) * GSPEED );

		
			if ( !moves )
			{
				let w = this._hitbox_x2 - this._hitbox_x1;
				let h = this._hitbox_y2 - this._hitbox_y1;

				if ( this._phys_last_w !== w || this._phys_last_h !== h )
				{
					this._phys_last_w = w;
					this._phys_last_h = h;
					moves = true;
				}
			}

			if ( moves )
			{
				this.ManageTrackedPhysWakeup();
				this._phys_sleep = 10;

				//this._phys_last_sx = sx_sign;
				//this._phys_last_sy = sy_sign;
			}
			else
			{
				if ( this._phys_sleep > 0 )
				{
					if ( this._phys_last_rest_on ) // Do not sleep mid-air. It probably is not consistent?
					{
						this._phys_sleep -= Math.min( 1, GSPEED );
					}
					else
					{
						this._phys_sleep -= Math.min( 1, GSPEED ) * 0.1; // Just more time to enter sleeping state?
					}
					
					if ( this._phys_sleep <= 0 )
					if ( this._phys_last_rest_on )
					sdEntity.TrackPhysWakeup( this._phys_last_rest_on, this );
				}
				else
				{
					this.sx = 0;
					this.sy = 0;

					sdWorld.last_hit_entity = this._phys_last_rest_on;
					return;
				}
			}
		}
		///////////////////////////////////////////////
		
		if ( this.sx === 0 && this.sy === 0 )
		{
			sdWorld.last_hit_entity = this._phys_last_rest_on;
				
			return;
		}
		
		
		
		if ( sdEntity.debug_track_unrest_physics )
		{
			sdEntity.debug_track_unrest_physics.set( this, { sx:this.sx, sy:this.sy, _phys_sleep:this._phys_sleep } );
			
			if ( this === sdEntity.debug_track_object_physics )
			debugger;
		}
	
		
		let ignore_entity_classes = this.GetIgnoredEntityClasses();
		let ignore_entity_classes_classes = sdWorld.GetClassListByClassNameList( ignore_entity_classes );
		/*
		let ignore_entity_classes_classes = null;
		if ( ignore_entity_classes )
		{
			ignore_entity_classes_classes = ignore_entity_classes._classes;
			
			if ( ignore_entity_classes_classes === undefined )
			{
				ignore_entity_classes_classes = new Set();
				for ( let i = 0; i < ignore_entity_classes.length; i++ )
				ignore_entity_classes_classes.add( sdWorld.entity_classes[ ignore_entity_classes[ i ] ] );

				ignore_entity_classes._classes = ignore_entity_classes_classes;
				
				if ( debug )
				trace('Possibly inefficient GetIgnoredEntityClasses at ',this.GetIgnoredEntityClasses);
			}
		}*/
			
		let include_only_specific_classes = this.GetNonIgnoredEntityClasses();
		let include_only_specific_classes_classes = sdWorld.GetClassListByClassNameList( include_only_specific_classes );
		/*let include_only_specific_classes_classes = null;
		if ( include_only_specific_classes )
		{
			include_only_specific_classes_classes = include_only_specific_classes._classes;
			
			if ( include_only_specific_classes_classes === undefined )
			{
				include_only_specific_classes_classes = new Set();
				for ( let i = 0; i < include_only_specific_classes.length; i++ )
				include_only_specific_classes_classes.add( sdWorld.entity_classes[ include_only_specific_classes[ i ] ] );

				include_only_specific_classes._classes = include_only_specific_classes_classes;
				
				if ( debug )
				trace('Possibly inefficient GetNonIgnoredEntityClasses at ',this.GetNonIgnoredEntityClasses);
			}
		}*/
		
		if ( this.sx !== this.sx || this.sy !== this.sy ) // NaN check
		{
			console.log('Entity has achieved NaN velocity: ', this );
			
			this.sx = 0;
			this.sy = 0;
		}
		
		const bounce_intensity = this.bounce_intensity;
		const friction_remain = this.friction_remain;
		const IsFrictionTimeScaled = this.IsFrictionTimeScaled();
		const hard_collision = this._hard_collision;
		const do_stuck_check = hard_collision || this.DoStuckCheck();
		const GetCollisionMode = this.GetCollisionMode();
		
		const force_hit_non_hard_collision_entities = this.is( sdBullet );
		
		let hits = null; // arr of { ent, t }
		
		if ( GetCollisionMode === sdEntity.COLLISION_MODE_ONLY_CALL_TOUCH_EVENTS )
		{
			hits = [];
		}
		
		let affected_cells = null;
		
		let hitbox_x1_first;
		let hitbox_y1_first;

		let hitbox_x2_first;
		let hitbox_y2_first;
		
		let skip_cell_scan = false;
		
		let first_collision = true;

		sdWorld.last_hit_entity = null;
		let new_phys_last_rest_on = null;
		//this._phys_last_rest_on = null; // Uncommented since it does not make much sense if it is never reset
		
		//this._phys_last_touch = null; Maybe it is best to just keep it, since movement and removal is tracked above
		
		const is_bg_entity = this._is_bg_entity;

		const this_mass = this.mass;
		
		const iters_total = ( this.sx === 0 || this.sy === 0 ) ? 1 : 2; // 1 Iteration is enough for one-dimension moving entities
		
		//if ( this.GetClass() === 'sdCharacter' )
		//{
			//if ( this.sx < -1 )
			//debugger;
		//}
		
		for ( let iter = 0; iter < iters_total; iter++ ) // Only 2 iterations of linear movement, enough to allow sliding in box-collisions-world
		//for ( let iter = 0; iter < 2; iter++ ) // Only 2 iterations of linear movement, enough to allow sliding in box-collisions-world
		//for ( let iter = 0; iter < 10; iter++ ) // Only 2 iterations of linear movement, enough to allow sliding in box-collisions-world
		{
			let sx = this.sx * GSPEED;
			let sy = this.sy * GSPEED;


			//let cell_size = 32;
			//let step_size = 8; // How many (at most) X or Y pixels to move per step

			//let vel_quad = Math.max( Math.abs( sx ), Math.abs( sy ) );
			//let steps = Math.ceil( vel_quad / step_size );


			// Absolute coords
			let hitbox_x1 = this.x + this._hitbox_x1;
			let hitbox_y1 = this.y + this._hitbox_y1;

			let hitbox_x2 = this.x + this._hitbox_x2;
			let hitbox_y2 = this.y + this._hitbox_y2;
			
			if ( iter === 0 )
			{
				hitbox_x1_first = hitbox_x1;
				hitbox_y1_first = hitbox_y1;
				hitbox_x2_first = hitbox_x2;
				hitbox_y2_first = hitbox_y2;
			}
			else
			{
				skip_cell_scan =  ( hitbox_x1 >= hitbox_x1_first &&
									hitbox_x2 <= hitbox_x2_first &&
									hitbox_y1 >= hitbox_y1_first &&
									hitbox_y2 <= hitbox_y2_first );
			}

			if ( skip_cell_scan )
			{
			}
			else
			{
				// Only once is enough since iter 2 usually is a remaining horizontal movement, unless there is any bounce or strange friction
				if ( affected_cells === null || bounce_intensity > 0 || friction_remain > 1 )
				affected_cells = sdWorld.GetCellsInRect(
					hitbox_x1 + Math.min( sx, 0 ),
					hitbox_y1 + Math.min( sy, 0 ),
					hitbox_x2 + Math.max( sx, 0 ),
					hitbox_y2 + Math.max( sy, 0 ),
				);
			}

			let best_t = 1;
			let best_ent = null;
			let best_min_xy = Infinity;

			//const ignore_entity = this;

			//const visited_ent = new WeakSet();
			//visited_ent.add( this );
			
			const visited_ent_flag = sdEntity.GetUniqueFlagValue();
			this._flag = visited_ent_flag;
			
			let min_xy = Infinity;
			
			for ( let c = 0; c < affected_cells.length; c++ )
			{
				const cell = affected_cells[ c ].arr;
				for ( let e = 0; e < cell.length; e++ )
				{
					const arr_i = cell[ e ];

					//if ( !visited_ent.has( arr_i ) )
					if ( arr_i._flag !== visited_ent_flag )
					{
						//visited_ent.add( arr_i );
						arr_i._flag = visited_ent_flag;

						if ( !arr_i._is_being_removed )
						{
							/*

			if ( sdWorld.CheckWallExistsBox( 
			---, 
			---, 
			---, 
			---, this, ignored_classes, this.GetNonIgnoredEntityClasses(), custom_filtering_method ) )

							*/
							/*if ( debug )
							if ( arr_i._class === 'sdGun' )
							debugger;*/

			//CheckWallExistsBox( x1, y1, x2, y2, ignore_entity=null, ignore_entity_classes=null, include_only_specific_classes=null, custom_filtering_method=null )

							let arr_i_is_bg_entity = arr_i._is_bg_entity;

							if ( arr_i_is_bg_entity === 10 ) // Check if this is a sdDeepSleep
							{
								// If so - wake it up as soon as possible!
								//debugger;
								arr_i.WakeUpArea( true, this );

								// Make it collide if it was not removed and it is meant to be threated as solid
								if ( !arr_i._is_being_removed )
								if ( arr_i.ThreatAsSolid() )
								{
									arr_i_is_bg_entity = is_bg_entity;
								}
							}

							if ( arr_i_is_bg_entity === is_bg_entity )
							{
								//if ( include_only_specific_classes_classes || arr_i.hard_collision )
								if ( force_hit_non_hard_collision_entities || include_only_specific_classes_classes || arr_i._hard_collision || custom_filtering_method )
								{
									//class_str = arr_i.GetClass();

									if ( include_only_specific_classes_classes && !include_only_specific_classes_classes.has( arr_i.__proto__.constructor ) )
									{
									}
									else
									//if ( ignore_entity_classes && ignore_entity_classes.indexOf( class_str ) !== -1 )
									//if ( ignore_entity_classes_classes && ignore_entity_classes_classes.has( arr_i.__proto__.constructor ) )
									if ( ignore_entity_classes_classes && ignore_entity_classes_classes.has( arr_i.constructor ) )
									{
									}
									else
									if ( custom_filtering_method === null || custom_filtering_method( arr_i ) )
									if ( !arr_i._is_being_removed )
									{
										/*if ( arr_i.is( sdBullet ) )
										{
											debugger
											continue;
										}*/
										
										let t = sdEntity.MovingRectIntersectionCheck(
											hitbox_x1,
											hitbox_y1,
											hitbox_x2,
											hitbox_y2,

											sx,
											sy,

											arr_i.x + arr_i._hitbox_x1,
											arr_i.y + arr_i._hitbox_y1,
											arr_i.x + arr_i._hitbox_x2,
											arr_i.y + arr_i._hitbox_y2
										);

										if ( debug )
										{
											if ( t === 0 )
											if ( arr_i._class === 'sdBlock' )
											if ( 
												 !(
													( this.x + this._hitbox_x1 <= arr_i.x + arr_i._hitbox_x2 ) &&
													( this.x + this._hitbox_x2 >= arr_i.x + arr_i._hitbox_x1 ) &&
													( this.y + this._hitbox_y1 <= arr_i.y + arr_i._hitbox_y2 ) &&
													( this.y + this._hitbox_y2 >= arr_i.y + arr_i._hitbox_y1 ) 
												 )
											)
											{
												debugger;

												trace(
														'Hitting sdBlock but no real overlap: ',
													hitbox_x1,
													hitbox_y1,
													hitbox_x2,
													hitbox_y2,

													sx,
													sy,

													arr_i.x + arr_i._hitbox_x1,
													arr_i.y + arr_i._hitbox_y1,
													arr_i.x + arr_i._hitbox_x2,
													arr_i.y + arr_i._hitbox_y2, ' :: t = '+t
												);

												t = sdEntity.MovingRectIntersectionCheck(
													hitbox_x1,
													hitbox_y1,
													hitbox_x2,
													hitbox_y2,

													sx,
													sy,

													arr_i.x + arr_i._hitbox_x1,
													arr_i.y + arr_i._hitbox_y1,
													arr_i.x + arr_i._hitbox_x2,
													arr_i.y + arr_i._hitbox_y2
												);
											}
										}

										/*if ( t <= 1 )
										if ( arr_i.GetClass() === 'sdDeepSleep' )
										if ( !arr_i.IsTargetable( this, true ) )
										debugger;*/


										if ( t <= 1 )
										if ( arr_i.IsTargetable( this, true ) ) // So guns are ignored
										{
											/*if ( this.GetClass() === 'sdQuadro' )
											if ( arr_i.GetClass() === 'sdGun' )
											if ( !arr_i._held_by )
											{
												debugger;
											}*/

											if ( GetCollisionMode === sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION )
											{
												if ( t === best_t )
												{
													//trace( 'it happens' );

													min_xy = Math.min(

														Math.abs( ( hitbox_x1 + hitbox_x2 ) - ( arr_i.x + arr_i._hitbox_x1 ) + ( arr_i.x + arr_i._hitbox_x2 ) ),
														Math.abs( ( hitbox_y1 + hitbox_y2 ) - ( arr_i.y + arr_i._hitbox_y1 ) + ( arr_i.y + arr_i._hitbox_y2 ) )

													);
												}

												if ( t < best_t || ( t === best_t && min_xy < best_min_xy ) )
												{
													//if ( arr_i._hard_collision )
													//{

														best_t = t;
														best_ent = arr_i;

														if ( t === best_t )
														{
															//trace( 'it happens and improvements happens too' );
															best_min_xy = min_xy;
														}

														if ( best_t === 0 )
														break;

													//}
													//else
													//hits.push({ ent:arr_i, t:t });
												}
											}
											else
											if ( GetCollisionMode === sdEntity.COLLISION_MODE_ONLY_CALL_TOUCH_EVENTS )
											{
												hits.push({ ent:arr_i, t:t });
											}
										}
									}
								}
							}
						}
					}
				}
			}

			if ( hitbox_x2 + sx > sdWorld.world_bounds.x2 || hitbox_x1 + sx < sdWorld.world_bounds.x1 )
			{
				best_t = 0;
				best_ent = null;

				const old_sx_real = this.sx;
				const old_sx = Math.abs( this.sx );

				this.sx = ( ( hitbox_x2 + sx > sdWorld.world_bounds.x2 ) ? -old_sx : old_sx ) * bounce_intensity;

				if ( apply_friction )
				{
					if ( IsFrictionTimeScaled )
					this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, friction_remain, GSPEED );
					else
					this.sy *= friction_remain;
				}

				const self_effect_scale = 1;
				this.ImpactWithDamageEffect( Math.abs( this.sx - old_sx_real ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
			}
			if ( hitbox_y2 + sy > sdWorld.world_bounds.y2 || hitbox_y1 + sy < sdWorld.world_bounds.y1 )
			{
				best_t = 0;
				best_ent = null;

				const old_sy_real = this.sy;
				const old_sy = Math.abs( this.sy );

				this.sy = ( ( hitbox_y2 + sy > sdWorld.world_bounds.y2 ) ? -old_sy : old_sy ) * bounce_intensity;
				
				if ( apply_friction )
				{
					if ( IsFrictionTimeScaled )
					this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, friction_remain, GSPEED );
					else
					this.sx *= friction_remain;
				}

				const self_effect_scale = 1;
				this.ImpactWithDamageEffect( Math.abs( this.sy - old_sy_real ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
				
				if ( this.IsPlayerClass() )
				//if ( this._socket )
				if ( this.act_y < 0 )
				{
					this.sy = -5;
				}
			}

			if ( debug )
			{
				//trace( '-- best_t='+best_t, ' :: iter='+iter );
				
				//if ( best_ent )
				//trace( 'Hitting ', best_t, best_ent.GetClass() );
				
				//if ( best_t < 1 )
				//debugger;
			}
			
			if ( GetCollisionMode === sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION )
			{
				if ( best_t === 1 )
				{
					if ( debug )
					{
						debugger;
					}
					
					this.x += sx;
					this.y += sy;

					break;
				}/*
				else
				if ( best_t === 0 )
				{
					sdWorld.last_hit_entity = best_ent;
					this._phys_last_touch = best_ent;

					if ( best_ent ) // Void already changes velocity
					{
						this.sx = 0;
						this.sy = 0;
						this.Touches( best_ent );
					}

					this.onPhysicallyStuck();

					if ( best_ent )
					break;
					else
					continue; // Perhaps sliding?
				}*/
				else
				{
					//best_t = Math.max( 0, best_t );

					const old_sx = Math.abs( this.sx );
					const old_sy = Math.abs( this.sy );
					
					/*if ( best_ent )
					if ( hard_collision )
					if ( best_ent._hard_collision )
					{
						if ( hitbox_x1 < best_ent.x + best_ent._hitbox_x2 )
						if ( hitbox_x2 > best_ent.x + best_ent._hitbox_x1 )
						if ( hitbox_y1 < best_ent.y + best_ent._hitbox_y2 )
						if ( hitbox_y2 > best_ent.y + best_ent._hitbox_y1 )
						{
							//debugger;
							this.DamageWithEffect( 10 );
							best_ent.DamageWithEffect( 10 );
							this.onPhysicallyStuck();
							trace('Stuck before');
						}
					}*/
							
					const best_t_original = best_t;

					best_t = Math.max( 0, best_t - 0.00001 / Math.max( old_sx, old_sy ) ); // Because math will betray us and bullet will stuck bouncing in a wall
					
					this.x += sx * best_t;
					this.y += sy * best_t;

					if ( best_ent )
					{
						let x_not_teleported = this.x;
						let y_not_teleported = this.y;

						const old_sx_real = this.sx;
						const old_sy_real = this.sy;

						this.Touches( best_ent );
						

						// After touch (character was teleported?)
						if ( x_not_teleported !== this.x || y_not_teleported !== this.y || this._is_being_removed )
						{
							return;
						}

						if ( best_ent._hard_collision )
						{
							// After touch reaction (teleporting?)
							/*if ( x_not_teleported !== this.x || y_not_teleported !== this.y )
							{
								return;
							}*/
							
							let do_unstuck = false;

							if ( best_t_original === 0 )
							{
								if ( do_stuck_check || !hard_collision )
								if ( hitbox_x1 < best_ent.x + best_ent._hitbox_x2 )
								if ( hitbox_x2 > best_ent.x + best_ent._hitbox_x1 )
								if ( hitbox_y1 < best_ent.y + best_ent._hitbox_y2 )
								if ( hitbox_y2 > best_ent.y + best_ent._hitbox_y1 )
								{
									if ( do_stuck_check )
									{
										if ( this.onPhysicallyStuck() )
										{
											do_unstuck = true;
											step_size = 8;
										}
											
										// Relax for overlapping entities (storages) or else they might fall forever and eventually break
										this.sx = 0;
										this.sy = 0;
									}
									else
									{
										// Guns that are stuck in walls/doors/etc will otherwise fall forever
										this.sx = 0;
										this.sy = 0;
									}
								}
								
								
							}

							let on_top = Math.abs( ( this.y + this._hitbox_y2 ) - ( best_ent.y + best_ent._hitbox_y1 ) );
							//const on_top = Math.max( 0, Math.abs( ( this.y + this._hitbox_y2 ) - ( best_ent.y + best_ent._hitbox_y1 ) ) - step_size );

							const under = Math.abs( ( this.y + this._hitbox_y1 ) - ( best_ent.y + best_ent._hitbox_y2 ) );
							const on_left = Math.abs( ( this.x + this._hitbox_x2 ) - ( best_ent.x + best_ent._hitbox_x1 ) );
							const on_right = Math.abs( ( this.x + this._hitbox_x1 ) - ( best_ent.x + best_ent._hitbox_x2 ) );

							if ( step_size > 0 )
							{
								if ( this.CanMoveWithoutOverlap( this.x, best_ent.y + best_ent._hitbox_y1 - this._hitbox_y2 - 0.001, -0.0005, custom_filtering_method ) ) // Prevent standing on vertical walls
								{
									if ( step_size > on_top )
									{
										step_size = on_top;
									}
									on_top -= step_size;
								}
								else
								step_size = 0;
							}

							/*if ( step_size > 0 )
							{
								on_top = Math.max( 0, on_top - step_size );
							}*/

							const smallest = Math.min( on_top, under, on_left, on_right );
							
							const best_ent_mass = best_ent.mass;

							const self_effect_scale = 
									( hard_collision && best_ent._hard_collision ) ?
										best_ent_mass / ( best_ent_mass + this_mass ) :
									( hard_collision ) ?
										0 :
										1;

							//let old_sx2 = best_ent.sx;
							//let old_sy2 = best_ent.sy;

							if ( debug )
							{
								//trace( [ on_top, under, on_left, on_right ], smallest );

								/*if ( smallest === on_left )
								{
									{
										let arr_i  = best_ent;
									debugger;
									sdEntity.MovingRectIntersectionCheck(
																				hitbox_x1,
																				hitbox_y1,
																				hitbox_x2,
																				hitbox_y2,

																				sx,
																				sy,

																				arr_i.x + arr_i._hitbox_x1,
																				arr_i.y + arr_i._hitbox_y1,
																				arr_i.x + arr_i._hitbox_x2,
																				arr_i.y + arr_i._hitbox_y2
																			);
									}
								}*/
							}
							
							
							/*if ( this.GetClass() === 'sdCharacter' )
							{
								if ( this._key_states.GetKey( 'KeyA' ) )
								trace( 'iter='+iter, best_t, sx, sy, [ smallest === on_top, smallest === under, smallest === on_left, smallest === on_right ] );
							}*/
											
							/*let near_static_data = sdEntity.phys_near_statics.get( this );
							if ( !near_static_data )
							{
								near_static_data = { on_top:0, under:0, on_left:0, on_right:0 };
								sdEntity.phys_near_statics.set( this, near_static_data );
							}
							else
							{
								near_static_data.on_top = 0;
								near_static_data.under = 0;
								near_static_data.on_left = 0;
								near_static_data.on_right = 0;
							}*/
											
							const push_step = 0.01;
							
							const inverse_space_around_required_for_unstuck = 0; // -0.00001 prevents crystals from sliding on top of other crystals when pushed // 0.001 makes crates be pushed into walls by players jetpacking into them
							//const directional_space_required_for_unstuck = 0; Seems not needed actually
											
							switch ( smallest )
							{
								case on_top:
								{
									/*this.sy = - Math.abs( old_sy * bounce_intensity );

									if ( typeof best_ent.sy !== 'undefined' )
									best_ent.sy = Math.max( best_ent.sy, best_ent.sy + old_sy * ( 1 - self_effect_scale ) );*/
									
									if ( best_ent._hard_collision || hard_collision === best_ent._hard_collision )
									if ( this.sy > ( best_ent.sy || 0 ) )
									{
										let best_is_dynamic = best_ent.IsPhysicallyMovable();
								
										if ( best_is_dynamic )
										best_is_dynamic = 
											( hard_collision && best_ent._hard_collision ) ? true : // Both hard, both pushed
											( best_ent._hard_collision ) ? false : // Only best_ent is hard, let it push this entity
											true; // Both non-hard, both are equal
										
										if ( best_is_dynamic )
										if ( !sdEntity.IsPushableRecursively( best_ent, 0, push_step ) )
										best_is_dynamic = false;
										
										let [ w1_collision, w2_collision ] = 
											sdEntity.calculateInelasticCollisionWithLoss( 
												this.mass, 
												best_is_dynamic ? best_ent.mass : Number.MAX_SAFE_INTEGER,
												old_sy_real,
												best_is_dynamic ? best_ent.sy : 0,
												bounce_intensity,
												best_is_dynamic ? best_ent.bounce_intensity : 1
										);
										this.sy = w1_collision;

										if ( best_is_dynamic )
										best_ent.sy = w2_collision;
										else
										this.sy -= w2_collision;
									}

									//if ( do_unstuck )
									if ( step_size > 0 || do_stuck_check )
									{
										//const y_risen = best_ent.y + best_ent._hitbox_y1 - this._hitbox_y2;
										const y_risen = best_ent.y + best_ent._hitbox_y1 - this._hitbox_y2 - 0.00001; // There was a case where standing on a turret would instantly stuck player to it

										if ( this.CanMoveWithoutOverlap( this.x, y_risen, inverse_space_around_required_for_unstuck, custom_filtering_method ) )
										this.y = y_risen;
									}
								}
								break;
								case under:
								{
									/*this.sy = old_sy * bounce_intensity;

									if ( typeof best_ent.sy !== 'undefined' )
									best_ent.sy = Math.min( best_ent.sy, best_ent.sy - old_sy * ( 1 - self_effect_scale ) );*/
									
									if ( best_ent._hard_collision || hard_collision === best_ent._hard_collision )
									if ( this.sy < ( best_ent.sy || 0 ) )
									{
										let best_is_dynamic = best_ent.IsPhysicallyMovable();
								
										if ( best_is_dynamic )
										best_is_dynamic = 
											( hard_collision && best_ent._hard_collision ) ? true : // Both hard, both pushed
											( best_ent._hard_collision ) ? false : // Only best_ent is hard, let it push this entity
											true; // Both non-hard, both are equal
										
										if ( best_is_dynamic )
										if ( !sdEntity.IsPushableRecursively( best_ent, 0, -push_step ) )
										best_is_dynamic = false;
										
										let [ w1_collision, w2_collision ] = 
											sdEntity.calculateInelasticCollisionWithLoss( 
												this.mass, 
												best_is_dynamic ? best_ent.mass : Number.MAX_SAFE_INTEGER,
												old_sy_real,
												best_is_dynamic ? best_ent.sy : 0,
												bounce_intensity,
												best_is_dynamic ? best_ent.bounce_intensity : 1
										);
										this.sy = w1_collision;

										if ( best_is_dynamic )
										{
											best_ent.sy = w2_collision;
											best_ent._phys_sleep = Math.max( best_ent._phys_sleep, this._phys_sleep );
										}
										else
										this.sy -= w2_collision;
									}
								
									if ( do_unstuck )
									if ( do_stuck_check && best_ent._hard_collision )
									{
										const y_risen = best_ent.y + best_ent._hitbox_y2 - this._hitbox_y1;

										if ( this.CanMoveWithoutOverlap( this.x, y_risen, inverse_space_around_required_for_unstuck, custom_filtering_method ) )
										this.y = y_risen;
									}
								}	
								break;
								case on_left:
								{
									if ( debug )
									trace('on left', [ on_top, under, on_left, on_right ], smallest );
									
									/*this.sx = - old_sx * bounce_intensity;

									if ( typeof best_ent.sx !== 'undefined' )
									best_ent.sx = Math.max( best_ent.sx, best_ent.sx + old_sx * ( 1 - self_effect_scale ) );*/
								
									if ( best_ent._hard_collision || hard_collision === best_ent._hard_collision )
									if ( this.sx > ( best_ent.sx || 0 ) )
									{
										let best_is_dynamic = best_ent.IsPhysicallyMovable();
								
										if ( best_is_dynamic )
										best_is_dynamic = 
											( hard_collision && best_ent._hard_collision ) ? true : // Both hard, both pushed
											( best_ent._hard_collision ) ? false : // Only best_ent is hard, let it push this entity
											true; // Both non-hard, both are equal
										
										if ( best_is_dynamic )
										if ( !sdEntity.IsPushableRecursively( best_ent, push_step, 0 ) )
										best_is_dynamic = false;
										
										let [ w1_collision, w2_collision ] = 
											sdEntity.calculateInelasticCollisionWithLoss( 
												this.mass, 
												best_is_dynamic ? best_ent.mass : Number.MAX_SAFE_INTEGER,
												old_sx_real,
												best_is_dynamic ? best_ent.sx : 0,
												bounce_intensity,
												best_is_dynamic ? best_ent.bounce_intensity : 1
										);
										this.sx = w1_collision;

										if ( best_is_dynamic )
										{
											best_ent.sx = w2_collision;
											best_ent._phys_sleep = Math.max( best_ent._phys_sleep, this._phys_sleep );
										}
										else
										this.sx -= w2_collision;
									}
								
									if ( do_unstuck )
									if ( do_stuck_check && best_ent._hard_collision )
									{
										const x_risen = best_ent.x + best_ent._hitbox_x1 - this._hitbox_x2;

										if ( this.CanMoveWithoutOverlap( x_risen, this.y, inverse_space_around_required_for_unstuck, custom_filtering_method ) )
										this.x = x_risen;
									}
								}
								break;
								case on_right:
								{
									if ( debug )
									trace('on right', [ on_top, under, on_left, on_right ], smallest );
									
									/*this.sx = old_sx * bounce_intensity;

									if ( typeof best_ent.sx !== 'undefined' )
									best_ent.sx = Math.min( best_ent.sx, best_ent.sx - old_sx * ( 1 - self_effect_scale ) );*/
										
									if ( best_ent._hard_collision || hard_collision === best_ent._hard_collision )
									if ( this.sx < ( best_ent.sx || 0 ) )			
									{
										let best_is_dynamic = best_ent.IsPhysicallyMovable();
								
										if ( best_is_dynamic )
										best_is_dynamic = 
											( hard_collision && best_ent._hard_collision ) ? true : // Both hard, both pushed
											( best_ent._hard_collision ) ? false : // Only best_ent is hard, let it push this entity
											true; // Both non-hard, both are equal
										
										if ( best_is_dynamic )
										if ( !sdEntity.IsPushableRecursively( best_ent, -push_step, 0 ) )
										best_is_dynamic = false;
										
										let [ w1_collision, w2_collision ] = 
											sdEntity.calculateInelasticCollisionWithLoss( 
												this.mass, 
												best_is_dynamic ? best_ent.mass : Number.MAX_SAFE_INTEGER,
												old_sx_real,
												best_is_dynamic ? best_ent.sx : 0,
												bounce_intensity,
												best_is_dynamic ? best_ent.bounce_intensity : 1
										);
										this.sx = w1_collision;

										if ( best_is_dynamic )
										{
											best_ent.sx = w2_collision;
											best_ent._phys_sleep = Math.max( best_ent._phys_sleep, this._phys_sleep );
										}
										else
										this.sx -= w2_collision;
									}
								
									if ( do_unstuck )
									if ( do_stuck_check && best_ent._hard_collision )
									{
										const x_risen = best_ent.x + best_ent._hitbox_x2 - this._hitbox_x1;

										if ( this.CanMoveWithoutOverlap( x_risen, this.y, inverse_space_around_required_for_unstuck, custom_filtering_method ) )
										this.x = x_risen;
									}
								}
								break;
							}
							

							x_not_teleported = this.x;
							y_not_teleported = this.y;

							if ( smallest === on_top || smallest === under )
							{
								if ( apply_friction )
								{
									if ( IsFrictionTimeScaled )
									this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, friction_remain, GSPEED );
									else
									this.sx *= friction_remain;
								}
								
								const impact = Math.abs( old_sy_real - this.sy ) * impact_scale * ( 1 + bounce_intensity );

								if ( impact > 5 )
								{
									if ( sdWorld.entity_classes.sdArea.CheckPointDamageAllowed( this.x, this.y ) )
									{
										this.ImpactWithDamageEffect( impact * self_effect_scale, ( !best_ent.is_static ) ? best_ent : null ); // Extra source logic to prevent creatures from attacking ground when falling

										best_ent.ImpactWithDamageEffect( impact * ( 1 - self_effect_scale ), ( !this.is_static ) ? this : null ); // Extra source logic to prevent creatures from attacking ground when falling
									}
								}
							}
							else
							{
								if ( apply_friction )
								{
									if ( IsFrictionTimeScaled )
									this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, friction_remain, GSPEED );
									else
									this.sy *= friction_remain;
								}
								
								const impact = Math.abs( old_sx_real - this.sx ) * impact_scale * ( 1 + bounce_intensity );

								if ( impact > 5 )
								{
									if ( sdWorld.entity_classes.sdArea.CheckPointDamageAllowed( this.x, this.y ) )
									{
										this.ImpactWithDamageEffect( impact * self_effect_scale, ( !best_ent.is_static ) ? best_ent : null ); // Extra source logic to prevent creatures from attacking ground when falling

										best_ent.ImpactWithDamageEffect( impact * ( 1 - self_effect_scale ), ( !this.is_static ) ? this : null ); // Extra source logic to prevent creatures from attacking ground when falling
									}
								}
							}
							
							// After impact (character rescued via RTP?)
							if ( x_not_teleported !== this.x || y_not_teleported !== this.y || this._is_being_removed )
							{
								return;
							}
						}
						
					}
					else
					{
						if ( best_t_original === 0 )
						if ( do_stuck_check )
						{
							if ( hitbox_x1 < sdWorld.world_bounds.x1 )
							{
								const x_risen = sdWorld.world_bounds.x1 - this._hitbox_x1;

								if ( this.CanMoveWithoutOverlap( x_risen, this.y, 0.001, custom_filtering_method ) )
								this.x = x_risen;
							}
							if ( hitbox_x2 > sdWorld.world_bounds.x2 )
							{
								const x_risen = sdWorld.world_bounds.x2 - this._hitbox_x2;

								if ( this.CanMoveWithoutOverlap( x_risen, this.y, 0.001, custom_filtering_method ) )
								this.x = x_risen;
							}
							if ( hitbox_y1 < sdWorld.world_bounds.y1 )
							{
								const y_risen = sdWorld.world_bounds.y1 - this._hitbox_y1;

								if ( this.CanMoveWithoutOverlap( this.x, y_risen, 0.001, custom_filtering_method ) )
								this.y = y_risen;
							}
							if ( hitbox_y2 > sdWorld.world_bounds.y2 )
							if ( this.onPhysicallyStuck() )
							{
								const y_risen = sdWorld.world_bounds.y2 - this._hitbox_y2;

								if ( this.CanMoveWithoutOverlap( this.x, y_risen, 0.001, custom_filtering_method ) )
								this.y = y_risen;
							}
						}
					}

					// Keep first collision
					//if ( !sdWorld.last_hit_entity ) // What is even this for? It seems to be overriden by step-up logic all the time
					if ( first_collision )
					{
						first_collision = false;
						
						sdWorld.last_hit_entity = best_ent;
						
						//if ( best_ent )
						//if ( this.GetClass() === 'sdQuadro' )
						//sdWorld.SendEffect({ x: best_ent.x, y: best_ent.y - 8, type: 1 });
						
						this._phys_last_touch = best_ent;
						
						// If lies on top
						if ( best_ent )
						if ( this.y + this._hitbox_y2 <= best_ent.y + best_ent._hitbox_y1 )
						if ( this.x + this._hitbox_x1 <= best_ent.x + best_ent._hitbox_x2 )
						if ( this.x + this._hitbox_x2 >= best_ent.x + best_ent._hitbox_x1 )
						new_phys_last_rest_on = best_ent;
						//this.SetPhysRestOn( best_ent );
					}

					GSPEED = GSPEED * ( 1 - best_t );

					if ( GSPEED < 0.01 )
					break; // Not worth recursion

					continue;
				}
			}
			else
			{
				const old_x = this.x;
				const old_y = this.y;
				
				hits = hits.sort( sdEntity.PenetrationHitSorter );
				
				//trace( 'hits in order:',hits);
				
				for ( let i = 0; i < hits.length; i++ )
				if ( i === 0 || !hits[ i ]._is_being_removed )
				{
					this.x = old_x + sx * hits[ i ].t;
					this.y = old_y + sy * hits[ i ].t;
					
					this.Touches( hits[ i ].ent );
					
					if ( this._is_being_removed )
					return;
				}
				
				this.x = old_x + sx;
				this.y = old_y + sy;
				break;
			}
		}
		
		/*if ( debug )
		{
			if ( GSPEED > 0 )
			trace('remaining GSPEED',GSPEED, this.sx, this.sy );
		}*/
							
		this.SetPhysRestOn( new_phys_last_rest_on );
						
		if ( !sdWorld.is_server )
		if ( this !== sdWorld.my_entity )
		{
			let obj = sdEntity.y_rest_tracker.get( this );
			if ( obj )
			if ( obj.repeated_sync_count > 2 )
			{
				this.y = obj.y;
			}
		}
	}
	static PenetrationHitSorter( a, b )
	{
		return ( a.t < b.t ) ? -1 : 1;
	}
	static MovingRectIntersectionCheck( a,c,b,d, w,v, e,g,f,h ) // AC - left top, BC - right bottom of hitbox, WV is a movement direction vector, EG - top left of another box, FH - bottom right of another box. Retuns "t" (time) where 1 is no hit
	{
		/*
			a + w * t < f
			b + w * t > e
			c + v * t < h
			d + v * t > g
		*/
	   
		// Division by zero
		/*if ( w === 0 )
		w = 0.0000001;
		if ( v === 0 )
		v = 0.0000001;*/
	
		// There should exist "t" which:
		/*
			//( e - b ) / w    <    t    <    ( f - a ) / w -- WRONG
			//( g - d ) / v    <    t    <    ( h - c ) / v
			
			a + w * t < f
			b + w * t > e
			c + v * t < h
			d + v * t > g
			
			w * t < f - a
			w * t > e - b
			v * t < h - c
			v * t > g - d
			
		*/
		
		let min_value;// = Math.max( ( e - b ) / w, ( g - d ) / v );
		let max_value;// = Math.min( ( f - a ) / w, ( h - c ) / v );
		
		//throw new Error();
		// TODO: Properly handle cases of moving-bounding-box collisions for 
		// cases when velocity is 0 along one of axis (use raw bbox hit tests)
		
		if ( w === 0 )
		{
			if ( v === 0 )
			{
				if ( a < f && b > e && c < h && d > g ) // Full overlap test
				{
					min_value = 0;
					max_value = 1;
				}
				else
				{
					return 2;
				}
			}
			else
			{
				if ( a < f && b > e )
				{
					if ( v > 0 )
					{
						min_value = ( g - d ) / v;
						max_value = ( h - c ) / v;
					}
					else
					{
						min_value = ( h - c ) / v;
						max_value = ( g - d ) / v;
					}
				}
				else
				{
					return 2;
				}
			}
		}
		else
		if ( w > 0 )
		{
			if ( v === 0 )
			{
				if ( c < h && d > g )
				{
					min_value = ( e - b ) / w;
					max_value = ( f - a ) / w;
				}
				else
				{
					return 2;
				}
			}
			else
			if ( v > 0 )
			{
				/*
					w * t < f - a
					w * t > e - b
					v * t < h - c
					v * t > g - d
					
					t < ( f - a ) / w
					t > ( e - b ) / w
					t < ( h - c ) / v
					t > ( g - d ) / v
				*/
	   
				min_value = Math.max( ( e - b ) / w, ( g - d ) / v );
				max_value = Math.min( ( f - a ) / w, ( h - c ) / v );
			}
			else
			{
				/*
					w * t < f - a
					w * t > e - b
					v * t < h - c
					v * t > g - d
					
					t < ( f - a ) / w
					t > ( e - b ) / w
					t > ( h - c ) / v
					t < ( g - d ) / v
				*/
				min_value = Math.max( ( e - b ) / w, ( h - c ) / v );
				max_value = Math.min( ( f - a ) / w, ( g - d ) / v );
			}
		}
		else
		{
			if ( v === 0 )
			{
				if ( c < h && d > g )
				{
					min_value = ( f - a ) / w;
					max_value = ( e - b ) / w;
				}
				else
				{
					return 2;
				}
			}
			else
			if ( v > 0 )
			{
				/*
					w * t < f - a
					w * t > e - b
					v * t < h - c
					v * t > g - d
					
					t > ( f - a ) / w
					t < ( e - b ) / w
					t < ( h - c ) / v
					t > ( g - d ) / v
				*/
				min_value = Math.max( ( f - a ) / w, ( g - d ) / v );
				max_value = Math.min( ( e - b ) / w, ( h - c ) / v );
			}
			else
			{
				/*
					w * t < f - a
					w * t > e - b
					v * t < h - c
					v * t > g - d
					
					t > ( f - a ) / w
					t < ( e - b ) / w
					t > ( h - c ) / v
					t < ( g - d ) / v
				*/
				min_value = Math.max( ( f - a ) / w, ( h - c ) / v );
				max_value = Math.min( ( e - b ) / w, ( g - d ) / v );
			}
		}
		/*
		*/
		if ( min_value < 0 )
		min_value = 0;
	
		if ( max_value > 1 )
		max_value = 1;
		
		if ( min_value < max_value ) // <= will cause sticking to walls
		{
			// Hit exists, also t is from 0 to 1
			return min_value;
		}
		else
		{
			// Hit is impossible
			return 2;
		}
	}
	MeasureMatterCost()
	{
		return Infinity; // Infinity means godmode players only
	}
	RequireSpawnAlign()
	{ return this.is_static; }
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions. Most probably will have conflicts with .GetNonIgnoredEntityClasses()
	{
		return null;
	}
	GetNonIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions. Most probably will have conflicts with .GetIgnoredEntityClasses()
	{
		return null;
	}
	IsBGEntity() // 0 for in-game entities, 1 for background entities, 2 is for moderator areas, 3 is for cables/sensor areas, 4 for task in-world interfaces, 5 for wandering around background entities, 6 for status effects, 7 for player-defined regions, 8 for decals, 9 for player spectators, 10 for deep sleep areas. Should handle collisions separately
	{ return 0; }
	IsHittableWithAdminTools() // Admin tool for removal
	{ return true; }
	CanMoveWithoutOverlap( new_x, new_y, safe_bound=0, custom_filtering_method=null, alter_ignored_classes=null ) // Safe bound used to check if sdCharacter can stand and not just collides with walls nearby. Also due to number rounding clients should better have it (or else they will teleport while sliding on vertical wall)
	{
		this.UpdateHitbox();
		
		var ignored_classes = alter_ignored_classes || this.GetIgnoredEntityClasses();
		
		if ( sdWorld.CheckWallExistsBox( 
				new_x + this._hitbox_x1 + safe_bound, 
				new_y + this._hitbox_y1 + safe_bound, 
				new_x + this._hitbox_x2 - safe_bound, 
				new_y + this._hitbox_y2 - safe_bound, this, ignored_classes, this.GetNonIgnoredEntityClasses(), custom_filtering_method ) )
		return false;
		
		return true;
	}
	CanMoveWithoutDeepSleepTriggering( new_x, new_y, safe_bound=0 )
	{
		this.UpdateHitbox();
		
		//if ( !sdDeepSleep )
		//sdDeepSleep = sdWorld.entity_classes.sdDeepSleep;
	
		//const extra_space_around = -safe_bound;
		
		return !( sdWorld.CheckSolidDeepSleepExistsAtBox( new_x + this._hitbox_x1 + safe_bound, new_y + this._hitbox_y1 + safe_bound, new_x + this._hitbox_x2 - safe_bound, new_y + this._hitbox_y2 - safe_bound, this ) );
		/*
		for ( let i = 0; i < sdDeepSleep.cells.length; i++ )
		{
			const cell = sdDeepSleep.cells[ i ];
			
			if ( cell.ThreatAsSolid() )
			{
				if ( new_x + this._hitbox_x2 <= cell.x + cell._hitbox_x1 - extra_space_around ||
					 new_x + this._hitbox_x1 >= cell.x + cell._hitbox_x2 + extra_space_around ||
					 new_y + this._hitbox_y2 <= cell.y + cell._hitbox_y1 - extra_space_around ||
					 new_y + this._hitbox_y1 >= cell.y + cell._hitbox_y2 + extra_space_around )
				{
				}
				else
				return false;
			}
		}

		return true;*/
	}
	
	GetHitDamageMultiplier( x, y ) // Multiplier for damage
	{
		return 1;
	}
	GetBleedEffect()
	{
		return 1; // sdEffect.TYPE_WALL_HIT; unavailable due to early init
	}
	GetBleedEffectDamageMultiplier()
	{
		//return this.GetBleedEffect(); // But GetBleedEffect returns sdEffect.TYPE_WALL_HIT ID rather than multiplier. It could break in case if sdEffect.TYPE_WALL_HIT was replaced with newer version
		return 1;
	}
	GetBleedEffectHue()
	{
		return 0;
	}
	GetBleedEffectFilter()
	{
		return '';
	}
	
	CanBuryIntoBlocks() // Can this entity bury inside sdBlock?
	{
		return 0; // 0 = no blocks, 1 = natural blocks, 2 = corruption, 3 = flesh blocks	
	}
	
	AttemptBlockBurying( custom_ent_tag = null )
	{
		if ( !sdWorld.is_server || this.CanBuryIntoBlocks() === 0 )
		return;
	
		let no_players_near = true;
		let i;			
		for ( i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character )
		{
			if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, this.x, this.y, 500 ) ) // A player is too close to it?
			{
				no_players_near = false; // Prevent hibernation
				break;
			}
		}
		if ( no_players_near )
		{
			let potential_hibernation_blocks = sdWorld.GetAnythingNear( this.x, this.y, 96, null, [ 'sdBlock' ] ); // Look for blocks
			// sdWorld.shuffleArray( potential_hibernation_blocks ); // Not sure if needed? Though check will mostly start from left to right of the entity.
			for ( i = 0; i < potential_hibernation_blocks.length; i++ )
			{
				
				let block = potential_hibernation_blocks[ i ];
							
				if ( block )
				{
					if ( this.CanBuryIntoBlocks() === 1 ) // 1st scenario, natural blocks
					{
						if ( !block._is_being_removed && block._natural && block.material !== 7 && block.material !== 9 ) // Natural block, no flesh or corruption?
						{
							if ( !block._merged && !block._contains_class ) // Not merged block, doesn't contain anything inside?
							{
								if ( !custom_ent_tag )
								block._contains_class = this.GetClass(); // Put the entity in there
								else
								block._contains_class = custom_ent_tag;
								this.remove(); // Disappear
								this._broken = false;
								break;
							}
							else
							if ( block._merged ) // Merged block? We can check if there are any "slots" left to bury in
							{
								for( let j = 0; j < block._contains_class.length; j++ )
								{
									let buried = false;
									if ( !block._contains_class[ j ] ) // Does this work? Probably should since it works in UnmergeBlocks()
									{
										if ( !custom_ent_tag )
										block._contains_class[ j ] = this.GetClass(); // Put the entity in there
										else
										block._contains_class[ j ] = custom_ent_tag;
										this.remove(); // Disappear
										this._broken = false;
										buried = true;
									}
									if ( buried )
									break;
								}
							}
						}
					}
					if ( this.CanBuryIntoBlocks() === 2 ) // 2nd scenario, corrupted blocks
					{
						if ( !block._is_being_removed && block._natural && !block._contains_class && block.material === 7 ) // Natural corrupted block and nothing inside it?
						{
							if ( !custom_ent_tag )
							block._contains_class = this.GetClass(); // Put the entity in there
							else
							block._contains_class = custom_ent_tag;
							this.remove(); // Disappear
							this._broken = false;
							break;
						}
					}
					if ( this.CanBuryIntoBlocks() === 3 ) // 3rd scenario, flesh blocks
					{
						if ( !block._is_being_removed && block._natural && !block._contains_class && block.material === 9 ) // Natural flesh block and nothing inside it?
						{
							if ( !custom_ent_tag )
							block._contains_class = this.GetClass(); // Put the entity in there
							else
							block._contains_class = custom_ent_tag;
							this.remove(); // Disappear
							this._broken = false;
							break;
						}
					}
				}
			}
		}
	}
	
	PlayDamageEffect( xx, yy, scale=1 )
	{
		sdWorld.SendEffect({ x:xx, y:yy, type:this.GetBleedEffect(), hue:this.GetBleedEffectHue(), filter:this.GetBleedEffectFilter() });
	}
	
	/*
	get _hash_position()
	{
		debugger; // Get rid of it, use this._affected_hash_arrays instead
		throw new Error('Get rid of this property');
	}
	set _hash_position( v )
	{
		debugger; // Get rid of it, use this._affected_hash_arrays instead
		throw new Error('Get rid of this property');
	}*/
					
	static NotNaN( a, b )
	{
		if ( isNaN( a ) )
		return b;
	
		return a;
	}
	inRealDist2DToEntity_Boolean( ent, di )
	{
		let [ x1, y1, x1b, y1b ] = [ this.x + this._hitbox_x1, this.y + this._hitbox_y1, this.x + this._hitbox_x2, this.y + this._hitbox_y2 ];
		let [ x2, y2, x2b, y2b ] = [ ent.x + ent._hitbox_x1, ent.y + ent._hitbox_y1, ent.x + ent._hitbox_x2, ent.y + ent._hitbox_y2 ];
		
		let left = (x2b < x1);
		let right = (x1b < x2);
		let bottom = (y2b < y1);
		let top = (y1b < y2);
		
		const dist = sdWorld.inDist2D_Boolean;
		
		if ( top && left )
		return dist( x1, y1b, x2b, y2, di );
		else if ( left && bottom )
		return dist( x1, y1, x2b, y2b, di );
		else if ( bottom && right )
		return dist( x1b, y1, x2, y2b, di );
		else if ( right && top )
		return dist( x1b, y1b, x2, y2, di );
		else if ( left )
		return ( x1 - x2b <= di );
		else if ( right )
		return ( x2 - x1b <= di );
		else if ( bottom )
		return ( y1 - y2b <= di );
		else if ( top )
		return ( y2 - y1b <= di );
		else
		return ( 0 <= di );
	}
	RealDist2DToEntity( ent )
	{
		let [ x1, y1, x1b, y1b ] = [ this.x + this._hitbox_x1, this.y + this._hitbox_y1, this.x + this._hitbox_x2, this.y + this._hitbox_y2 ];
		let [ x2, y2, x2b, y2b ] = [ ent.x + ent._hitbox_x1, ent.y + ent._hitbox_y1, ent.x + ent._hitbox_x2, ent.y + ent._hitbox_y2 ];
		
		let left = (x2b < x1);
		let right = (x1b < x2);
		let bottom = (y2b < y1);
		let top = (y1b < y2);
		
		const dist = sdWorld.Dist2D;
		
		if ( top && left )
		return dist( x1, y1b, x2b, y2 );
		else if ( left && bottom )
		return dist( x1, y1, x2b, y2b );
		else if ( bottom && right )
		return dist( x1b, y1, x2, y2b );
		else if ( right && top )
		return dist( x1b, y1b, x2, y2 );
		else if ( left )
		return x1 - x2b;
		else if ( right )
		return x2 - x1b;
		else if ( bottom )
		return y1 - y2b;
		else if ( top )
		return y2 - y1b;
		else
		return 0;
	}
	DoesOverlapWith( ent, extra_space_around=0 ) // Overlaps( // OverlapsWith(
	{
		if ( this.x + this._hitbox_x2 <= ent.x + ent._hitbox_x1 - extra_space_around ||
			 this.x + this._hitbox_x1 >= ent.x + ent._hitbox_x2 + extra_space_around ||
			 this.y + this._hitbox_y2 <= ent.y + ent._hitbox_y1 - extra_space_around ||
			 this.y + this._hitbox_y1 >= ent.y + ent._hitbox_y2 + extra_space_around )
		return false;
	
		return true;
	}
	DoesOverlapWithRect( x1,y1,x2,y2, extra_space_around=0 )
	{
		if ( this.x + this._hitbox_x2 <= x1 - extra_space_around ||
			 this.x + this._hitbox_x1 >= x2 + extra_space_around ||
			 this.y + this._hitbox_y2 <= y1 - extra_space_around ||
			 this.y + this._hitbox_y1 >= y2 + extra_space_around )
		return false;
	
		return true;
	}
	
	UpdateHitboxInitial() // Because there are no post-structors in JS, and implementing them normally would not be easy at this point...
	{
		this._hitbox_last_update = sdWorld.time;

		this._hitbox_x1 = sdEntity.NotNaN( this.hitbox_x1, this._hitbox_x1 );
		this._hitbox_y1 = sdEntity.NotNaN( this.hitbox_y1, this._hitbox_y1 );
		this._hitbox_x2 = sdEntity.NotNaN( this.hitbox_x2, this._hitbox_x2 );
		this._hitbox_y2 = sdEntity.NotNaN( this.hitbox_y2, this._hitbox_y2 );
		
		this._hard_collision = this.hard_collision;
	}
	UpdateHitbox()
	{
		if ( this._hitbox_last_update !== sdWorld.time )
		{
			if ( sdWorld.is_server )
			{
				this._hitbox_last_update = sdWorld.time;
			
				// More liteweight approach. On server-side it is important to update hash position manually whenever hitbox offsets change
				this._hitbox_x1 = this.hitbox_x1;
				this._hitbox_y1 = this.hitbox_y1;
				this._hitbox_x2 = this.hitbox_x2;
				this._hitbox_y2 = this.hitbox_y2;

				this._hard_collision = this.hard_collision;
			}
			else
			{
				// It is done to make amplifier shields update hashes without extra info from server
				if ( this._hitbox_last_update < sdWorld.time - 100 )
				{
					this._hitbox_last_update = sdWorld.time;
			
					let x1 = this.hitbox_x1;
					let y1 = this.hitbox_y1;
					let x2 = this.hitbox_x2;
					let y2 = this.hitbox_y2;

					let h = ( 
						this._hitbox_x1 !== x1 || 
						this._hitbox_y1 !== y1 || 
						this._hitbox_x2 !== x2 || 
						this._hitbox_y2 !== y2 
					);

					this._hitbox_x1 = x1;
					this._hitbox_y1 = y1;
					this._hitbox_x2 = x2;
					this._hitbox_y2 = y2;

					this._hard_collision = this.hard_collision;

					if ( h )
					sdWorld.UpdateHashPosition( this, true );
				}
			}
		}
	}
	GetClass()
	{
		return sdWorld.FastestMethod( this, sdEntity.prototype, sdEntity.prototype.GetClass, [ sdEntity.prototype.GetClassA, sdEntity.prototype.GetClassB ], [] );
	}
	GetClassA()
	{ return this.constructor.name; }
	GetClassB()
	{ return this._class; }
	is( c )
	{
		// sdEntity.prototype.isB is faster than sdEntity.prototype.isA without sdWorld.FastestMethod call, at least on some specs
		return sdWorld.FastestMethod( this, sdEntity.prototype, sdEntity.prototype.is, [ sdEntity.prototype.isA, sdEntity.prototype.isB, sdEntity.prototype.isC, sdEntity.prototype.isD, sdEntity.prototype.isE, sdEntity.prototype.isF ], [ c ] );
	}
	isA( c )
	{ return this.constructor === c.prototype.constructor; }
	isB( c )
	{ return this.constructor.name === c.prototype.constructor.name; }
	isC( c )
	{ return this._class === c._class; }
	//{ if ( typeof c._class === 'undefined' ) c._class = c.prototype.constructor.name; return this._class === c._class; }
	isD( c )
	{ return this instanceof c; }
	isE( c )
	{ return this._class === c.prototype.constructor.name; }
	isF( c )
	{ 
		return this._class_id === c.class_id; 
	}
	
	PreInit() // Best place for NaN tracking methods initialization
	{
	}
	
	static GetUniqueFlagValue() // Whenever there happens overflow (it probably will never happen) - you can do a full cycle over all entities and reset _flag value. (sdByteShifter uses < instead of === though for flag values)
	{
		return sdEntity.flag_counter++;
	}
	constructor( params )
	{
		// Warning: When adding new properties here - at least make sure you don't save them at GetSnapshot
		//			All these properties will also sit in memory at all times, obviously. And we want to be able
		//			to run game on low memory VDS servers too -- Eric Gurt
		
		
		//if ( !sdWorld.mobile )
		//this._stack_trace = globalThis.getStackTrace();
		
		this._flag = 0; // Used to mark entities as visited/added/mentioned just so WeakSet is not needed. Compare it to sdEntity.flag_counter++
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		this._flag2 = 0; // Used solely by client-side rendering since ._flag will often be overriden during render logic and thus cause rare flickering
	
		//this._flag3 = 0; // Accurate line of sight reuse cache, used on both server and client
		this._near_player_until = 0; // Optimization for server to know if entity is near player and thus should keep high update rate - faster than looking up every nearby player to apply every single logic step

		this._class = this.constructor.name;
		
		this._net_id = undefined;
		
		this._class_id = this.__proto__.constructor.class_id;
		
		if ( this.PreInit !== sdEntity.prototype.PreInit )
		this.PreInit();
		
		this._frozen = 0; // This value is changed by sdStatusEffect. Result of this value is an alternate ThinkNow function calls. It shows how many degrees temperature is below freezing point, it is always positive value. Value like 1 means it is about to unfreeze - used by turrets to keep targets frozen
		
		// Because getters are slow in JS, especially when they are virtual methods. Trying this method?
		this._hitbox_x1 = 0;
		this._hitbox_y1 = 0;
		this._hitbox_x2 = 0;
		this._hitbox_y2 = 0;
		this._hard_collision = false;
		this.UpdateHitboxInitial(); // Update hitbox
		this._hitbox_last_update = 0; // But be ready for it to be updated again (sdCrystal that is being ejected from sdMatterAmplifier would need it to be not stuck in it)
		
		this._last_x = params.x;
		this._last_y = params.y;
		
		this._last_hit_time = 0; // Prevent flood from splash damage bullets
		
		this._listeners = null; // Only REMOVAL listener is handled by sdEntity. Anything else is not handled globally. Listeners are never saved into world snapshot so make sure to recreate them
		/*
			this._listeners = {
				DAMAGE: [],
				REMOVAL: [],
				MOVES: []
			};
		*/
		
		this.x = params.x || 0;
		this.y = params.y || 0;
	
		this._last_attacker_net_id = -1;
		this._last_attacker_until = 0;
		
		this._steering_wheel_net_id = -1;
		
		if ( this.is_static )
		this._update_version = 0;
		
		let is_global_entity = this.IsGlobalEntity();
		
		//this._hash_position = null;
		this._affected_hash_arrays = []; // Every time entity moves - these are ones where entity will be excluded, and then new hash array group will be set. Will be tiny for small objects and can get quite large for larger entities.
		
		if ( !is_global_entity )
		sdWorld.UpdateHashPosition( this, true );
		
		this._is_being_removed = false;
		this._broken = false; // Becomes true for statics (anything now) whenever they are really broken rather than just cut out by visibility. After removal you can set it to false to prevent particles spawned on client
		
		this._is_bg_entity = this.IsBGEntity();
		
		if ( sdWorld.is_server )
		{
			//if ( typeof params._net_id !== undefined )
			if ( params._net_id !== undefined )
			this._net_id = params._net_id;
			else
			this._net_id = sdEntity.entity_net_ids++;
			
			//sdEntity.entities_by_net_id_cache[ this._net_id ] = this;
			sdEntity.entities_by_net_id_cache_map.set( this._net_id, this );
		}
		else
		{
			
			if ( typeof params._net_id !== undefined )
			{
				this._net_id = params._net_id;
				
				//sdEntity.entities_by_net_id_cache[ this._net_id ] = this;
				sdEntity.entities_by_net_id_cache_map.set( this._net_id, this );
			}
			else
			this._net_id = undefined;
		
			/*setTimeout(()=>
			{
				console.warn('Entity with this._net_id = '+this._net_id+' created here');
			},1);*/
		}
		
		this._hiberstate = -1; // Defines whether think logic to be called in each frame. Might become active automatically if something touches entity
		
		if ( is_global_entity ) // These are always active and should never appear in list of active entities
		{
			// Do not update hiberstate at all as it will add entity to physical grid
			//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
		}
		else
		{
			this._phys_entities_on_top = null; // Becomes array
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
		
		this._snapshot_cache_frame = -1;
		this._snapshot_cache = null;
		
		//this._is_real = ( typeof params.is_real !== 'undefined' ) ? params.is_real : true; // Build tools spawns entities with ._is_real === false (this is not handled on client-side since damage generally can't be dealt on client-side anyway), it will prevent them from reacting to impact (sdBlock for example would be able to kill spawner sdCharacter and cause gun to throw an error without this)
		
		if ( this.IsGlobalEntity() )
		sdEntity.global_entities.push( this );
	
		//if ( sdWorld.is_server )
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			this._vertex_cache = null;
		}
		
		//this._onThinkPtr = this.onThink; // Trying to make v8 optimize stuff better... It actually and unfortunately works.
		
		this._has_matter_props = false; // Becomes true on seal in cases where it is needed
		
		this._has_liquid_props = false; // Becomes true on seal in cases where it is needed
		
		// Premake all needed variables so sealing would work best
		{
			if ( this.onThink.has_held_by === undefined )
			{
				// Guns are exception because they can't be carried and thus extra logic can be too demanding
				this.onThink.has_held_by = ( this.GetClass() !== 'sdGun' && this.constructor.toString().indexOf( 'this.held_by' ) !== -1 );
			}
			
			if ( this.onThink.has_held_by )
			{
				this._last_held_by = null;
				this._last_held_by_until = 0;
				this._last_held_by_filter = null;
				
				this.SetMethod( 'ApplyVelocityAndCollisions', this.ApplyVelocityAndCollisionsPreviouslyCarried );
			}
			
			if ( this.onThink.has_ApplyVelocityAndCollisions === undefined )
			{
				let onThinkString = this.onThink.toString();
				let DrawString = this.Draw.toString();
				
				this.onThink.has_ApplyVelocityAndCollisions = ( onThinkString.indexOf( 'ApplyVelocityAndCollisions' ) !== -1 );
				
				this.onThink.has_MatterGlow = ( onThinkString.indexOf( 'MatterGlow' ) !== -1 );
				
				this.onThink.has_GetAnythingNearCache = ( onThinkString.indexOf( 'MatterGlow' ) !== -1 || onThinkString.indexOf( 'GetAnythingNearCache' ) !== -1 || onThinkString.indexOf( 'BossLikeTargetScan' ) !== -1 );
				
				this.onThink.has_needs_angular_range_cache = ( onThinkString.indexOf( 'BossLikeTargetScan' ) !== -1 || onThinkString.indexOf( 'CheckLineOfSightAngularCache' ) !== -1 );
				
				this.onThink.has_GiveLiquid = ( onThinkString.indexOf( 'GiveLiquid' ) !== -1 );
				
				this.onThink.has_GetComWiredCache = ( onThinkString.indexOf( 'GetComWiredCache' ) !== -1 || DrawString.indexOf( 'GetComWiredCache' ) !== -1 );
				
				this.onThink.has_GetActiveTargetsCache = ( onThinkString.indexOf( 'GetActiveTargetsCache' ) !== -1 );
				
				this.onThink.has_sdBlock_extras = false;
				
				if ( !sdCable )
				sdCable = sdWorld.entity_classes.sdCable;
				
				this.onThink.has_cable_support = ( sdCable.attacheable_entities.indexOf( this.GetClass() ) !== -1 ) || this.GetClass() === 'sdCrystal'; // Crystals can send matter over amplifiers' cables
				
				// Hacks
				const c = this.GetClass();
				if ( c === 'sdBone' )
				{
					this.onThink.has_ApplyVelocityAndCollisions = true;
				}
				else
				if ( c === 'sdBlock' )
				{
					this.onThink.has_sdBlock_extras = true;
				}
			}
			
			if ( this.onThink.has_cable_support )
			{
				this._connected_ents = null; // Can be array, for slower update rate
				this._connected_ents_next_rethink = 0;
			}
			
			if ( this.onThink.has_needs_angular_range_cache )
			{
				this._angular_range_cache = [];
				this._angular_range_cache_per_entity = new WeakMap();
			}
			
			if ( this.onRemove.has_broken_property_check === undefined )
			{
				let onRemoveString = this.onRemove.toString();
				
				this.onRemove.has_broken_property_check = ( onRemoveString.indexOf( '_broken' ) !== -1 );
			}
			
			if ( this.onThink.has_ApplyVelocityAndCollisions )
			this.PhysInitIfNeeded();
		
			if ( this.onThink.has_GetAnythingNearCache )
			{
				this._anything_near = [];
				this._anything_near_range = 0;
				this._next_anything_near_rethink = 0;
			}
			
			if ( this.onThink.has_GetComWiredCache )
			{
				this._com_near_cache = null;
				this._next_com_rethink = 0;
				this.cio = 0;
			}
			
			if ( this.onThink.has_GetActiveTargetsCache )
			{
				this._targets_raw_cache = [];
				this._targets_raw_cache_until = 0;
			}
			
			if ( this.onThink.has_sdBlock_extras )
			{
				this._vis_block_left = null;
				this._vis_block_right = null;
				this._vis_block_top = null;
				this._vis_block_bottom = null;
				//this._vis_back = ;
			}
		}
		sdEntity.to_seal_list.push( this );
		sdEntity.to_finalize_list.push( this );
	}
	
	onCarryStart() // For carriable items
	{
		if ( this.is_static )
		this._update_version++;
	}
	
	onCarryEnd() // For carriable items
	{
		this.PhysWakeUp();
		
		if ( this.is_static )
		this._update_version++;
	}
	GetSteeringWheel()
	{
		if ( this._steering_wheel_net_id === -1 )
		return null;
		
		const e = sdEntity.entities_by_net_id_cache_map.get( this._steering_wheel_net_id );
		
		if ( e )
		return e;
		
		this._steering_wheel_net_id = -1;
		return null;
	}
	
	VehicleHidesDrivers()
	{
		return true;
	}
	ObfuscateAnyDriverInformation() // In case if vehicle is supposed to hide drivers completely. Use together with altering GetSnapshot to use GetDriverObfuscatingSnapshot
	{
		return false;
	}
	GetDriverObfuscatingSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null )
	{
		if ( save_as_much_as_possible || observer_entity === null )
		return sdEntity.prototype.GetSnapshot.call( this, current_frame, save_as_much_as_possible, observer_entity );
		//return super.GetSnapshot( current_frame, save_as_much_as_possible, observer_entity );
	
	
		
		let hide_contents = false;
		
		if ( observer_entity.driver_of === this ) // Let driver know what he is driving
		{
		}
		else
		{
			current_frame -= 100; // Make it so frame is different for case of obfuscation. Otherwise 1 out of 2 players seeing this entity might get wrong mixed snapshots
			hide_contents = true;
		}
		
		let snapshot = sdEntity.prototype.GetSnapshot.call( this, current_frame, save_as_much_as_possible, observer_entity );
		//let snapshot = super.GetSnapshot( current_frame, save_as_much_as_possible, observer_entity );
		
		if ( hide_contents )
		{
			for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
			snapshot[ 'driver' + i ] = null;
		}
		
		return snapshot;
	}
	
	DrawsHUDForDriver()
	{
		return true;
	}

	static CableCacheFlushMethod( e )
	{
		if ( e._connected_ents )
		e._connected_ents = null;
	
		let auto_entity = e.GetAutoConnectedEntityForMatterFlow();
		if ( auto_entity )
		if ( auto_entity._connected_ents )
		auto_entity._connected_ents = null;
	
		return false;
	}
	FindObjectsInACableNetwork( accept_test_method=null, alternate_class_to_search=sdWorld.entity_classes.sdBaseShieldingUnit, return_full_paths=false ) // No cache, so far. return_full_paths makes it return arrays of entities on a way to searched entities
	{
		const sdCable = sdWorld.entity_classes.sdCable;
		const SearchedClass = alternate_class_to_search;
		
		const ret = [];
		
		const back_track = return_full_paths ? new Map() : null;
		const GetBackTrackArray = return_full_paths ? ( e )=>
		{
			let e0 = e;
			
			let arr = [];
			
			while ( e )
			{
				e = back_track.get( e );
				
				if ( e )
				arr.unshift( e );
			}
			
			return {
				entity: e0,
				path: arr
			};
			
		} : null;

		//let worked_out_ents = [];
		const visited_ent_flag = sdEntity.GetUniqueFlagValue();
		
		let active_ents = [ this ];
		while ( active_ents.length > 0 )
		{
			let current_ent = active_ents[ 0 ];
			
			let connected_ents = sdCable.GetConnectedEntities( current_ent, sdCable.TYPE_ANY );

			current_ent._flag = visited_ent_flag;
			
			active_ents.shift();

			for ( let i = 0; i < connected_ents.length; i++ )
			{
				let connected_ent = connected_ents[ i ];
				
				if ( connected_ent._flag !== visited_ent_flag )
				{
					if ( back_track )
					back_track.set( connected_ent, current_ent );
					
					if ( accept_test_method )
					{
						if ( accept_test_method( connected_ent ) )
						{
							if ( back_track )
							ret.push( GetBackTrackArray( connected_ent ) );
							else
							ret.push( connected_ent );
						}
					}
					else
					if ( SearchedClass === sdEntity || connected_ent.is( SearchedClass ) )
					{
						if ( back_track )
						ret.push( GetBackTrackArray( connected_ent ) );
						else
						ret.push( connected_ent );
					}

					if ( active_ents.indexOf( connected_ent ) === -1 )
					active_ents.push( connected_ent );
				}
			}
		}

		return ret;
	}
	
	GetComWiredCache( accept_test_method=null, alternate_class_to_search=sdWorld.entity_classes.sdCom ) // Cretes .cio property for clients to know if com exists
	{
		if ( !sdWorld.is_server )
		{
			if ( accept_test_method )
			return null;
		
			if ( this.cio !== 0 )
			{
				return { _net_id: this.cio, subscribers:[] };
			}
		
			return null;
		}
		if ( accept_test_method || sdWorld.time > ( this._next_com_rethink || 0 ) )
		{
			const sdCable = sdWorld.entity_classes.sdCable;
			const SearchedClass = alternate_class_to_search;
			
			//let worked_out_ents = [];
			const visited_ent_flag = sdEntity.GetUniqueFlagValue();
			
			let active_ents = [ this ];
			while ( active_ents.length > 0 )
			{
				let connected_ents = sdCable.GetConnectedEntities( active_ents[ 0 ], sdCable.TYPE_ANY );

				//worked_out_ents.push( active_ents[ 0 ] );
				active_ents[ 0 ]._flag = visited_ent_flag;
				active_ents.shift();

				for ( let i = 0; i < connected_ents.length; i++ )
				{
					//if ( worked_out_ents.indexOf( connected_ents[ i ] ) === -1 )
					if ( connected_ents[ i ]._flag !== visited_ent_flag )
					{
						if ( accept_test_method )
						{
							if ( accept_test_method( connected_ents[ i ] ) )
							{
								return connected_ents[ i ];
							}
						}
						else
						if ( connected_ents[ i ].is( SearchedClass ) )
						{
							this._com_near_cache = connected_ents[ i ];
							this._next_com_rethink = sdWorld.time + 1000 + Math.random() * 100;
							//if ( this.cio !== this._com_near_cache )
							if ( this.cio !== this._com_near_cache._net_id )
							{
								this.cio = this._com_near_cache._net_id;
								if ( typeof this._update_version !== 'undefined' )
								this._update_version++;
							}
							return this._com_near_cache;
						}

						if ( active_ents.indexOf( connected_ents[ i ] ) === -1 )
						active_ents.push( connected_ents[ i ] );
					}
				}
			}
			
			if ( accept_test_method )
			{
				return null;
			}
			else
			{
				this._com_near_cache = null;
				this._next_com_rethink = sdWorld.time + 1000 + Math.random() * 100;
				//if ( this.cio !== this._com_near_cache )
				if ( this.cio !== 0 )
				{
					this.cio = 0;
					if ( typeof this._update_version !== 'undefined' )
					this._update_version++;
				}
				return this._com_near_cache;
			}
		}
		else
		{
			return this._com_near_cache;
		}
	}
	
	CheckLineOfSightAngularCache( target_entity, ignore_entity_classes=null, include_only_specific_classes=null, custom_filtering_method=null )
	{
		// Remember once visible targets for 2 seconds instead of 0.5 + 0.5 * random
		let by_target = this._angular_range_cache_per_entity.get( target_entity );
		if ( by_target !== undefined )
		{
			if ( sdWorld.time < by_target )
			return true;
		}
		
		let step = 8;
		
		let x1 = this.x;
		let y1 = this.y;
		
		let x2 = target_entity.x + ( target_entity._hitbox_x1 + target_entity._hitbox_x2 ) / 2;
		let y2 = target_entity.y + ( target_entity._hitbox_y1 + target_entity._hitbox_y2 ) / 2;
		
		let di = sdWorld.Dist2D( x1,y1,x2,y2 );
		
		//if ( di > max_range )
		//return false;
			
		let an = Math.floor( ( Math.atan2( x2-x1, y2-y1 ) + Math.PI ) / ( Math.PI * 2 ) * 32 );
		
		let cache_object = this._angular_range_cache[ an ];
		
		if ( !cache_object )
		{
			this._angular_range_cache[ an ] = 
				cache_object = 
					{
						last_s: step / 2,
						exprie_on: 0,//sdWorld.time + 500 + Math.random() * 500
						hit: null
					};
		}
		else
		{
			if ( sdWorld.time > cache_object.exprie_on )
			{
				cache_object.last_s = step / 2;
				cache_object.hit = null;
			}
			else
			{
				if ( di > cache_object.last_s && cache_object.hit )
				{
					sdWorld.last_hit_entity = cache_object.hit;
					return false;
				}
				
				if ( di <= cache_object.last_s && !cache_object.hit )
				{
					this._angular_range_cache_per_entity.set( target_entity, sdWorld.time + 2000 );
					return true;
				}
			}
		}
			
		cache_object.exprie_on = sdWorld.time + 500 + Math.random() * 500;
		
		
		for ( let s = cache_object.last_s; s < di - step / 2; s += step )
		{
			let x = x1 + ( x2 - x1 ) / di * s;
			let y = y1 + ( y2 - y1 ) / di * s;
			if ( sdWorld.CheckWallExists( x, y, target_entity, ignore_entity_classes, include_only_specific_classes, custom_filtering_method ) )
			{
				cache_object.last_s = s;
				cache_object.hit = sdWorld.last_hit_entity;
				
				sdWorld.last_hit_entity = cache_object.hit;
				return false;
			}
		}
		
		cache_object.last_s = di;
		//cache_object.hit = null;
		
		this._angular_range_cache_per_entity.set( target_entity, sdWorld.time + 2000 );
		return true;
		
		//sdWorld.CheckLineOfSight( x1, y1, x2, y2, target_entity, ignore_entity_classes, include_only_specific_classes, custom_filtering_method )
	}
	
	GetComsNearCache( x, y, append_to=null, require_auth_for_net_id=null, return_arr_of_one_with_lowest_net_id=true )
	{
		if ( append_to !== null || require_auth_for_net_id !== null || return_arr_of_one_with_lowest_net_id !== true )
		throw new Error('Bad usage of GetComsNearCache, use sdWorld.GetComsNear instead for this kind of use');
		
		let coms_near = this._coms_near_cache || [];
		let next_com_rethink = this._next_com_rethink || 0;

		if ( sdWorld.time > next_com_rethink )
		{
			this._next_com_rethink = next_com_rethink = sdWorld.time + 100 + Math.random() * 32;
			if ( coms_near.length === 0 || coms_near[ 0 ]._is_being_removed || !sdWorld.CheckLineOfSight( x, y, coms_near[ 0 ].x, coms_near[ 0 ].y, null, null, sdWorld.entity_classes.sdCom.com_visibility_unignored_classes ) )
			{
				this._coms_near_cache = coms_near = sdWorld.GetComsNear( x, y, append_to, require_auth_for_net_id, return_arr_of_one_with_lowest_net_id );
			}
		}
		
		return coms_near;
	}
	
	GetAnythingNearCache( _x, _y, range, append_to=null, specific_classes=null, shuffle=true, filter_candidates_function=null )
	{
		//if ( append_to !== null || specific_classes !== null ) Why was it like this?
		if ( append_to !== null )
		throw new Error('Bad usage of GetAnythingNearCache, use sdWorld.GetAnythingNear instead for this kind of use');
	
		let anything_near = this._anything_near || [];
		let anything_near_range = this._anything_near_range || 0;
		let next_anything_near_rethink = this._next_anything_near_rethink || 0;
		
		if ( sdWorld.time > next_anything_near_rethink || anything_near_range !== range )
		{
			if ( anything_near_range !== range && anything_near_range !== 0 )
			{
				debugger; // Inefficient range cache, separate cache needs to be kept for each range?
			}
			this._next_anything_near_rethink = next_anything_near_rethink = sdWorld.time + 200 + Math.random() * 32; // Can be extended due to extend_cache_duration
			
			if ( !GetAnythingNear )
			GetAnythingNear = sdWorld.GetAnythingNear;
			
			//if ( skipper++ % 2 === 0 )
			//anything_near = this._anything_near = sdWorld.GetAnythingNear( _x, _y, range, append_to, specific_classes, filter_candidates_function );
			//else
			anything_near = this._anything_near = GetAnythingNear( _x, _y, range, append_to, specific_classes, filter_candidates_function );
			anything_near_range = this._anything_near_range = range;

			// Randomize array in-place using Durstenfeld shuffle algorithm. This should be more fair and also more relaxed for sdMatterContainers that exchange matter
			/*function shuffleArray(array) 
			{
				for (var i = array.length - 1; i > 0; i--) {
					var j = Math.floor(Math.random() * (i + 1));
					var temp = array[i];
					array[i] = array[j];
					array[j] = temp;
				}
			}*/

			if ( shuffle )
			sdWorld.shuffleArray( anything_near );
		}
		
		return anything_near;
	}
	
	static ActiveTargetsFilter( e )
	{
		return ( e._hiberstate === sdEntity.HIBERSTATE_ACTIVE );
	}
	GetActiveTargetsCache( range, filter_method=sdEntity.ActiveTargetsFilter ) // Used by cubes and turrets so far - looks up targets nearby using fastest approach considering current world state
	{
		let targets_raw = this._targets_raw_cache;
		
		if ( sdWorld.time > this._targets_raw_cache_until )
		{
			targets_raw.length = 0;
			
			this._targets_raw_cache_until = sdWorld.time + 200 + Math.random() * 200;
			
			// One method can be faster than another, depending on how many active entities there are on server
			if ( sdWorld.entity_classes.sdEntity.active_entities.length > 3933 * 0.28502415458937197 )
			targets_raw = sdWorld.GetAnythingNear( this.x, this.y, range, targets_raw, null, filter_method );
			else
			targets_raw = sdWorld.GetAnythingNearOnlyNonHibernated( this.x, this.y, range, targets_raw, null, filter_method );
		}
		return targets_raw;
	}
	
	SetHiberState( v, allow_calling_movement_in_range=true )
	{
		if ( v !== this._hiberstate )
		{
			if ( sdWorld.is_server )
			if ( v === sdEntity.HIBERSTATE_ACTIVE )
			if ( this._hiberstate === sdEntity.HIBERSTATE_REMOVED )
			{
				if ( this._is_being_removed )
				{
					debugger;
					
					throw new Error('Logic error: ' + this.GetClass() + ' is not allowed to become active after was removed. Originally was removed here (from ._remove_stack_trace): ' + this._remove_stack_trace );
				}
			}
			
			/*if ( sdWorld.is_server )
			if ( v === sdEntity.HIBERSTATE_ACTIVE )
			{
				if ( this.GetClass() === 'sdNode' )
				debugger;
			}*/

			//if ( !this._hiberstate_history )
			//this._hiberstate_history = [];
		
			//this._hiberstate_history.push({ from:this._hiberstate, to:v, stack:globalThis.getStackTrace() });
			
			//console.log( this.GetClass(), 'hiberstate becomes ',v);
		
			if ( this._hiberstate === sdEntity.HIBERSTATE_REMOVED )
			{
				debugger;
			}
			else
			{
				if ( v === sdEntity.HIBERSTATE_HIBERNATED || v === sdEntity.HIBERSTATE_REMOVED || v === sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP )
				{
					if ( this._affected_hash_arrays.length === 0 || v === sdEntity.HIBERSTATE_REMOVED ) // Usually it is a sign that entity (ex. sdBlock) just spawned and wasn't added to any hash arrays for collision and visibility checks (alternatively _last_x/y === undefined check could be here, but probably not needed or not efficient). Hibernation would prevent that event further so we do it now
					{
						sdWorld.UpdateHashPosition( this, false, allow_calling_movement_in_range );
					}
					
					if ( v === sdEntity.HIBERSTATE_REMOVED )
					{
						if ( sdWorld.is_server )
						if ( this.IsGlobalEntity() )
						debugger;
					}
					
					if ( this._hiberstate === sdEntity.HIBERSTATE_ACTIVE )
					{
						
						//if (  v === sdEntity.HIBERSTATE_REMOVED )
						//if ( this.GetClass() === 'sdBlock' )
						//	debugger;
						
						//let id = sdEntity.active_entities.indexOf( this );
						let id = sdEntity.active_entities.lastIndexOf( this );
						if ( id === -1 )
						debugger;
						sdEntity.active_entities.splice( id, 1 );
					}
					
					this._hiberstate = v;
				}
				else
				if ( v === sdEntity.HIBERSTATE_ACTIVE )
				{
					if ( sdWorld.is_server )
					if ( this.IsGlobalEntity() )
					//if ( this.GetClass() === 'sdFleshGrabber' )
					{
						debugger;
					}
					
					this._hiberstate = v;
					sdEntity.active_entities.push( this );
					
					/*if ( sdEntity.active_entities.length > 172000 )
					{
						debugger;
					}*/
					//this.onHiberstateChange();
				}
				else
				debugger;
			}
		}
		/*
		if ( this.GetClass() === 'sdBG' )
		if ( sdWorld.is_server )
		{
			let that = this;
			
			that._last_hibernation_change = globalThis.getStackTrace();
					
			setTimeout( ()=>
			{
				if ( sdEntity.active_entities.indexOf( that ) !== -1 )
				debugger;
			},1000);
		}*/
	}
	/*onHiberstateChange() // this._hiberstate
	{
	}*/
	
	IsVisible( observer_entity ) // Can be used to hide guns that are held, they will not be synced this way
	{
		return true;
	}
	GetSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null, include_class_and_net_id=true ) // Some classes like sdDeepSleep do override it(!)
	{
		let returned_object;
		
		if ( current_frame !== this._snapshot_cache_frame || save_as_much_as_possible )
		{
			/*returned_object = {
				_net_id: this._net_id,
				_class: this.GetClass()
			};*/

			// Some extra logic so backup saving does not corrupt _snapshot_cache for 1 frame
			if ( save_as_much_as_possible )
			{
				returned_object = {
					_net_id: this._net_id,
					_class: this.GetClass()
				};
			}
			else
			{
				// This code prevents conditional property visibility, but does some optimisations
				if ( this._snapshot_cache === null )
				{
					if ( include_class_and_net_id )
					returned_object = {
						_net_id: this._net_id,
						_class: this.GetClass()
					};
					else
					returned_object = {};
				
					this._snapshot_cache = returned_object;
				}
				else
				returned_object = this._snapshot_cache;
				
				this._snapshot_cache_frame = current_frame;
				//this._snapshot_cache = returned_object;
			}
			
			//throw new Error( this.__proto__ );
			
			if ( this.x === undefined || this.y === undefined )
			{
				if ( sdEntity._debug_catch1 || 0 < 50 )
				{
					sdEntity._debug_catch1 = ( sdEntity._debug_catch1 || 0 ) + 1;
					console.warn( 'Attempted sync of an entity with x or y being undefined. What made it?' );
				}
				debugger;
			}
			
			let props;
			
			if ( save_as_much_as_possible )
			{
				// Sometimes it could consider null as acceptable but then writes whole socket data...
				//props = sdEntity.properties_by_class_all.get( this.__proto__.constructor );
				
				//if ( props === undefined )
				//{
					props = [];
					
					for ( let prop in this )
					{
						/*let ok = false;
						
						// Optimization of code from below
						if ( prop.charCodeAt( 0 ) !== 95 )
						ok = true;
						else
						if ( save_as_much_as_possible )
						{
							switch ( prop )
							{
								case '_snapshot_cache_frame':
								case '_snapshot_cache':
								case '_hiberstate':
								case '_affected_hash_arrays':
								case '_class_id':
								case '_flag':
								case '_connected_ents':
								case '_connected_ents_next_rethink':
								case '_hitbox_x1':
								case '_hitbox_y1':
								case '_hitbox_x2':
								case '_hitbox_y2':
								case '_hard_collision':
								case '_hitbox_last_update':
								case '_last_hit_time':
								case '_last_attacker_net_id':
								case '_last_attacker_until':
								case '_is_being_removed':
								case '_broken':
								case '_listeners':
								case '_last_x':
								case '_last_y':
								case '_has_matter_props':
								case '_has_liquid_props':
								case '_is_static':
								case '_update_version':
								case '_remove_stack_trace':
								case '_vis_block_top':
								case '_vis_block_left':
								case '_vis_block_right':
								case '_vis_block_bottom':
								case '_speak_id':
								case '_say_allowed_in':
								case '_phys_sleep': 
								case '_phys_last_touch': 
								case '_phys_last_rest_on':
								case '_phys_last_w': 
								case '_phys_last_h': 
								case '_phys_last_sx': 
								case '_phys_last_sy': 
								case '_phys_last_rest_on_targetable':
								case '_phys_last_rest_on_x':
								case '_phys_last_rest_on_y':
								case '_phys_entities_on_top':
								case '_client_side_bg':
								case '_frozen': 
								case '_anything_near_range':
								case '_next_anything_near_rethink':
									
									//ok = false;
									
								break;
								default:
									
									switch ( typeof this[ prop ] )
									{
										case 'number':
										case 'string':
										case 'boolean':

											ok = true;

										break;
										default:

											if ( this[ prop ] === null || this.ExtraSerialzableFieldTest( prop ) )
											ok = true;
											//else
											//ok = false;

										break;
									}
									
								break;
							}
						}*/
						
						if ( 
								//prop.charAt( 0 ) !== '_' 
								prop.charCodeAt( 0 ) !== 95 // Same as above but faster
								|| 
								( 
								  save_as_much_as_possible && 
								  prop !== '_snapshot_cache_frame' && 
								  prop !== '_snapshot_cache' && 
								  prop !== '_hiberstate' && 
								  prop !== '_affected_hash_arrays' && 
								  prop !== '_class_id' && 
								  prop !== '_flag' && 
								  prop !== '_flag2' && 
								  //prop !== '_flag3' && 
								  prop !== '_near_player_until' && 
								  prop !== '_connected_ents' && 
								  prop !== '_connected_ents_next_rethink' && 
								  prop !== '_hitbox_x1' && 
								  prop !== '_hitbox_y1' && 
								  prop !== '_hitbox_x2' && 
								  prop !== '_hitbox_y2' && 
								  prop !== '_hard_collision' && 
								  prop !== '_hitbox_last_update' && 
								  prop !== '_last_hit_time' && 
								  prop !== '_last_attacker_net_id' && 
								  prop !== '_last_attacker_until' && 
								  prop !== '_is_being_removed' && 
								  prop !== '_broken' && 
								  prop !== '_listeners' && 
								  prop !== '_last_x' && 
								  prop !== '_last_y' && 
								  prop !== '_has_matter_props' && 
								  prop !== '_has_liquid_props' && 
								 // prop !== '_is_static' && 
								  prop !== '_update_version' && 
								  prop !== '_remove_stack_trace' && 
								  prop !== '_vis_block_top' && 
								  prop !== '_vis_block_left' && 
								  prop !== '_vis_block_right' && 
								  prop !== '_vis_block_bottom' && 
								  prop !== '_speak_id' && 
								  prop !== '_say_allowed_in' && 

								  prop !== '_phys_sleep' && 
								  prop !== '_phys_last_touch' && 
								  prop !== '_phys_last_rest_on' && 
								  prop !== '_phys_last_w' && 
								  prop !== '_phys_last_h' && 
								  prop !== '_phys_last_sx' && 
								  prop !== '_phys_last_sy' && 
								  prop !== '_phys_last_rest_on_targetable' && 
								  prop !== '_phys_last_rest_on_x' && 
								  prop !== '_phys_last_rest_on_y' && 
								  prop !== '_phys_entities_on_top' && 
								  prop !== '_client_side_bg' && 

								  prop !== '_frozen' && 

								  prop !== '_anything_near_range' && 
								  prop !== '_next_anything_near_rethink' &&

								  ( 
									typeof this[ prop ] === 'number' || 
									typeof this[ prop ] === 'string' || 
									this[ prop ] === null || 
									typeof this[ prop ] === 'boolean' || 
									prop === '_shielded' || // It became way too common and means only one thing anyway. LRTPs and CCs don't check for it and it causes them to lose protection on server reboot
									prop === '_shield_ent' || // Bubble shields
									this.ExtraSerialzableFieldTest( prop ) 
								  ) 
								) 
							)
						//if ( ok )
						{
							if ( prop === '_affected_hash_arrays' )
							{
								console.warn( 'Strange object has property "_affected_hash_arrays", which is typeof "'+(typeof this[ prop ])+'": ', this );
								throw new Error('How? Bad.');
							}

							props.push( prop );
						}
					}
			
					/*if ( this.GetClass() === 'sdBlock' )
					{
						if ( props.indexOf( '_contains_class' ) === -1 )
						throw new Error('Something is not right. Props for block are missing contained class: ' + JSON.stringify( props ) );
					}*/
					
					//sdEntity.properties_by_class_all.set( this.__proto__.constructor, props );
				//}
			}
			else
			{
				let kinds = sdEntity.properties_by_class_public.get( this._class_id );
				
				if ( kinds === undefined )
				{
					kinds = [];
					sdEntity.properties_by_class_public.set( this._class_id, kinds );
				}
				
				let current_kind = this.material || this.type || this.kind || this.class || this.variation || 0;
				
				props = kinds[ current_kind ];
				
				if ( props === undefined )
				{
					props = [];
					
					for ( let prop in this )
					if ( prop.charAt( 0 ) !== '_' )
					props.push( prop );
			
					kinds[ current_kind ] = props;
				}
				
			}
			
			//for ( var prop in this )
			for ( let i = 0; i < props.length; i++ )
			{
				let prop = props[ i ];
				
				{
					let v = this[ prop ];
					
					//if ( this[ prop ] !== null )
					if ( v !== null )
					{
						/*if ( typeof this[ prop ] === 'object' )
						if ( prop !== 'sd_filter' )
							debugger;*/
						
						//if ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' && typeof this[ prop ].constructor !== 'undefined' ) Last condition never happens
						//if ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' /*&& typeof this[ prop ]._class !== 'undefined'*/ )
						if ( v instanceof sdEntity && this[ prop ]._net_id !== 'undefined' ) // We should allow snapshots as properties, needed for case of _held_item_snapshot of sdGun (liquid carriers used to lose their water when put into storages)
						{
							
							//this._snapshot_cache_frame = -1;
							
							if ( save_as_much_as_possible )
							{
								v = { _net_id: this[ prop ]._net_id, _class: this[ prop ].constructor.name };
							}
							else
							if ( this[ prop ].IsVisible( observer_entity ) )
							{
								v = { _net_id: this[ prop ]._net_id, _class: this[ prop ].constructor.name };
							}
							else
							{
								this._snapshot_cache_frame = -1; // Invalidate cache if at least one entity pointer can not be seen... Could help with sdStorages in huge amounts? Better approach would be to cache by property visibility mask
								v = null;
							}
							
							//if ( save_as_much_as_possible )
							//v = { _net_id: this[ prop ]._net_id, _class: this[ prop ].constructor.name };
						}
					/*	else
						{
							// As is?
						}*/
					}
					
					/*if ( this.GetClass() === 'sdGun' )
					if ( prop === 'sd_filter' )
					{
						let a = 1;
					}*/
					
					if ( !save_as_much_as_possible && typeof v === 'number' ) // Do not do number rounding if world is being saved
					{
						if ( prop === 'sx' || prop === 'sy' || prop === 'scale' )
						returned_object[ prop ] = Math.round( v * 100 ) / 100;
						else
						returned_object[ prop ] = Math.round( v );
					}
					else
					{
						// Object/array copies are required since sdByteShifter otherwise won't be able to tell if values are different since same pointers will be stored on all messages
						if ( v instanceof Array )
						returned_object[ prop ] = v.slice();
						else
						if ( v instanceof Object )
						returned_object[ prop ] = Object.assign( {}, v );
						else
						returned_object[ prop ] = v;
					}
				}
			}
		}
		else
		{
			returned_object = this._snapshot_cache;
		}
		
		//if ( this.GetClass() === 'sdBullet' )
		//console.log( JSON.stringify( returned_object ) );
		
		/*if ( !save_as_much_as_possible )
		{
			if ( returned_object._class === 'sdGrass' )
			if ( returned_object.variation === 4 || returned_object.variation === 6 )
			{
				trace( 'GetSnapshot returns', returned_object );
			}
		}*/
		
		return returned_object;
	}
	ExtraSerialzableFieldTest( prop ) // Some object properties testing might go here, for snapshots only. Should never be dynamic
	{
		return false; 
	}
	
	AllowClientSideState() // Conditions to ignore sdWorld.my_entity_protected_vars
	{
		return true;
	}
	ApplySnapshot( snapshot )
	{
		const my_entity = sdWorld.my_entity;
		
		/*if ( snapshot._class !== this.GetClass() )
		if ( snapshot._class !== 'auto' )
		debugger;*/

		if ( this.isSnapshotDecodingAllowed === sdEntity.prototype.isSnapshotDecodingAllowed || this.isSnapshotDecodingAllowed( snapshot ) )
		for ( var prop in snapshot )
		{
			/*
			if ( !sdWorld.is_server )
			if ( prop === 'd' )
			if ( snapshot[ prop ].length === 0 )
			{
				debugger;
			}*/

			if ( prop !== '_net_id' )
			if ( prop !== '_class' )
			if ( prop !== '_is_being_removed' )
			if ( prop !== '_class_id' )
			if ( prop !== '_hiberstate' )
			{
				if ( snapshot[ prop ] !== null && typeof snapshot[ prop ] === 'object' && snapshot[ prop ]._net_id && snapshot[ prop ]._class )
				{
					if ( this[ prop ] && !this[ prop ]._is_being_removed && this[ prop ]._net_id === snapshot[ prop ]._net_id )
					{
						snapshot[ prop ] = this[ prop ];
					}
					else
					{
						// It is reworked now to be able to alter pointers within inserted group which long range teleports require
						if ( sdWorld.unresolved_entity_pointers ) // Used by client-side cables now
						{
							sdWorld.unresolved_entity_pointers.push([ this, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
						}
						else
						{
							let new_val = sdEntity.GetObjectByClassAndNetId( snapshot[ prop ]._class, snapshot[ prop ]._net_id );

							/*if ( new_val === null )
							{
								if ( sdWorld.unresolved_entity_pointers ) // Used by client-side cables now
								sdWorld.unresolved_entity_pointers.push([ this, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
							}*/

							snapshot[ prop ] = new_val;
							/*
							let new_val = sdEntity.GetObjectByClassAndNetId( snapshot[ prop ]._class, snapshot[ prop ]._net_id );

							if ( new_val === null )
							{
								if ( sdWorld.unresolved_entity_pointers ) // Used by client-side cables now
								sdWorld.unresolved_entity_pointers.push([ this, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
							}

							snapshot[ prop ] = new_val;*/
						}
					}
				}
				else
				{
					if ( my_entity !== this )
					{
						// Patch - probably remove after June 2022
						//if ( sdWorld.is_server )
						{
							if ( prop === '_listeners' )
							snapshot[ prop ] = null;
						}
						
						

						/*if ( !sdWorld.is_server )
						if ( this.is( sdWorld.entity_classes.sdDeepSleep ) )
						if ( prop === 'x' )
						if ( snapshot[ prop ] === 0 )
						if ( this.x !== 0 )
						debugger;*/
			
			
						
						//if ( typeof this[ prop ] !== 'undefined' ) // Disallow creation of new properties
						if ( this.hasOwnProperty( prop ) )
						this[ prop ] = snapshot[ prop ];
						else
						{
							//if ( prop === 'crystal' )
							//debugger;
							
							traceOnce('[1]Rejecting creaton of ',prop,'on',this.GetClass(),'(probably an old version property)');
							//trace( this );
							//throw new Error();
						}
					}
					else
					{
						if ( 
								(
									(
										// Movement, aiming
										typeof sdWorld.my_entity_protected_vars[ prop ] === 'undefined'
									)
									&&
									(
										// Weapon slot changes are usually here
										typeof sdWorld.my_entity_protected_vars_untils[ prop ] === 'undefined' || 
										sdWorld.time > sdWorld.my_entity_protected_vars_untils[ prop ] 
									)
								) 
								|| 
								
								// Being held by something on server, for example ropes seem to cause it, which isn't good actually
								( !this.AllowClientSideState() && prop !== 'look_x' && prop !== 'look_y' )
									
								
							)
						{
							//if ( typeof this[ prop ] !== 'undefined' ) // Disallow creation of new properties
							if ( this.hasOwnProperty( prop ) )
							this[ prop ] = snapshot[ prop ];
							else
							{
								traceOnce('[2]Rejecting creaton of ',prop,'on',this.GetClass(),'(probably an old version property)');
								//trace( this );
								//throw new Error();
							}
						}
					}
				}
			}
		}
		
		if ( sdWorld.is_server )
		{
			/*
			// Maybe it should be better to let hibernated sdStorage objects re-detect what are they are lying on?
			if ( typeof snapshot._hiberstate !== 'undefined' )
			this.SetHiberState( snapshot._hiberstate );
			*/
			if ( typeof this._phys_sleep !== 'undefined' )
			{
				this.PhysWakeUp(); // Reset phys sleep
			}
		   
		
			// Guns still use old pointer method
			if ( this.GetClass() === 'sdGun' )
			if ( this.held_by_class !== 'sdCharacter' && this.held_by_class !== 'sdPlayerDrone' ) // Old gun code handles it
			{
				// For long-range teleportation
				if ( sdWorld.unresolved_entity_pointers )
				{
					if ( this.held_by_net_id === -1 )
					this._held_by = null;
					else
					sdWorld.unresolved_entity_pointers.push([ this, '_held_by', this.held_by_class, this.held_by_net_id ]);
				}
				else
				{
					let potential_held_by = sdEntity.GetObjectByClassAndNetId( this.held_by_class, this.held_by_net_id );

					if ( potential_held_by )
					{
						this._held_by = potential_held_by;
					}
					else
					{
						this._held_by = null;
						//if ( this.held_by_class !== '' )
						//sdWorld.unresolved_entity_pointers.push([ this, '_held_by', this.held_by_class, this.held_by_net_id ]);
					}
				}
			}
			
			if ( this.sd_filter )
			if ( !this.sd_filter.s )
			{
				this.sd_filter = sdWorld.GetVersion2SDFilterFromVersion1SDFilter( this.sd_filter );
				/*
				let s = '';
				for ( let r in this.sd_filter )
				{
					//this.sd_filter[ r ] = Object.assign( {}, this.sd_filter[ r ] );
					for ( let g in this.sd_filter[ r ] )
					{
						//this.sd_filter[ r ][ g ] = Object.assign( {}, this.sd_filter[ r ][ g ] );
						for ( let b in this.sd_filter[ r ][ g ] )
						{
							//this.sd_filter[ r ][ g ][ b ] = [ 255, 255, 255 ];
							s += sdWorld.ColorArrayToHex( [ r,g,b ] ) + sdWorld.ColorArrayToHex( this.sd_filter[ r ][ g ][ b ] );
						}
					}
				}
				this.sd_filter = { s: s };
				//console.log( this.sd_filter );
				
				//if ( this.sd_filter.s % 12 !== 0 )
				//throw new Error( 'Wrong sd_filter length: ' + this.sd_filter.s );
				*/
			}
			if ( this.is( sdWorld.entity_classes.sdLost ) )
			{
				sdWorld.ApplyDrawOperations( null, this.d );
			}
			
			this.onServerSideSnapshotLoaded( snapshot );
		}
		else
		{
			if ( !this.IsGlobalEntity() )
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
		
		this._hitbox_last_update = 0;
		this.UpdateHitbox();
		
		// This will make entity be properly removed out of class arrays
		if ( typeof snapshot._is_being_removed !== 'undefined' )
		{
			if ( snapshot._is_being_removed )
			{
				this.remove();
				
				if ( typeof snapshot._broken !== 'undefined' )
				this._broken = snapshot._broken;
			}
		}
	}
	
	onServerSideSnapshotLoaded() // Something like LRT will use this to reset phase on load
	{
	}
	
	static GetObjectByClassAndNetId( _class, _net_id ) // GetEntityByNetID // FindEntityByNetID
	{
		if ( _class === '' )
		return null;
		
		// Slow way, for debugging
		/*
		let searched_class = sdWorld.entity_classes[ _class ];
		let should_return = null;
		
		for ( var i = 0; i < sdEntity.entities.length; i++ )
		{
			//if ( sdEntity.entities[ i ].GetClass() === _class )
			if ( sdEntity.entities[ i ] instanceof searched_class ) // Should be faster
			if ( sdEntity.entities[ i ]._net_id === _net_id )
			{
				should_return = sdEntity.entities[ i ];
				break;
			}
		}
		*/
	
	
	
		
		let possible_ent = undefined;
		
		//if ( sdWorld.is_server )
		//possible_ent = sdEntity.entities_by_net_id_cache[ _net_id ]; // Fast way
		possible_ent = sdEntity.entities_by_net_id_cache_map.get( _net_id ); // Fast way
		/*else
		{
			let searched_class = sdWorld.entity_classes[ _class ];
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			{
				//if ( sdEntity.entities[ i ].GetClass() === _class )
				if ( sdEntity.entities[ i ].is( searched_class ) ) // Should be faster
				if ( sdEntity.entities[ i ]._net_id === _net_id )
				{
					possible_ent = sdEntity.entities[ i ];
					break;
				}
			}
		}*/
	
		if ( possible_ent === undefined )
		{
			/*if ( should_return !== null )
			{
				throw new Error('Cached access failed for ',should_return );
			}*/
			return null;
		}
	
		if ( possible_ent.GetClass() !== _class && _class !== 'auto' )
		{
			//debugger; // Should not happen // Can happen when server sends remove entity command - it has no class
			return null;
		}
	
		if ( possible_ent._net_id !== _net_id )
		{
			debugger; // Should not happen
			return null;
		}
		
		/* Normal thing for client-side case...
		if ( possible_ent._is_being_removed )
		{
			//debugger; // That is a weird case. Is this is a reason client-side blocks might not appear at times?
		
		}*/
		
		return possible_ent;
	
		/*
		let searched_class = sdWorld.entity_classes[ _class ];
		
		for ( var i = 0; i < sdEntity.entities.length; i++ )
		{
			//if ( sdEntity.entities[ i ].GetClass() === _class )
			if ( sdEntity.entities[ i ] instanceof searched_class ) // Should be faster
			if ( sdEntity.entities[ i ]._net_id === _net_id )
			{
				return sdEntity.entities[ i ];
			}
		}
		return null;*/
	}
	
	// If you are going to use this method while snapshot may contain pointers towards not-yet-existing objects - you can try catching cases by setting sdWorld.unresolved_entity_pointers = []; (temporarily! Or else memory leaks. Once you've done - do sdWorld.unresolved_entity_pointers = null; )
	static GetObjectFromSnapshot( snapshot ) // GetEntityFromSnapshot // GetEntityBySnapshot
	{
		/*for ( var i = 0; i < sdEntity.entities.length; i++ )
		{
			if ( sdEntity.entities[ i ].GetClass() === snapshot._class )
			if ( sdEntity.entities[ i ]._net_id === snapshot._net_id )
			{
				sdEntity.entities[ i ].ApplySnapshot( snapshot );
				return sdEntity.entities[ i ];
			}
		}*/
												
		//let existing = sdEntity.GetObjectByClassAndNetId( snapshot._class ? snapshot._class : 'auto', snapshot._net_id );
		let existing = sdEntity.GetObjectByClassAndNetId( snapshot._class, snapshot._net_id );
		if ( existing )
		{
			existing.ApplySnapshot( snapshot );
			
			if ( !sdWorld.is_server )
			{
				sdEntity.TrackPotentialYRest( existing );
			}
			
			return existing;
		}
		
		if ( snapshot._is_being_removed )
		{
			//console.warn( 'Got removal for non-made entity. Ignore if nothing crashes if null returned here.' );
			//debugger; // Pointless? Trying to catch blue walls that appear at ( 0; 0 ) coordinates
			return null;
		}
		
		//if ( globalThis[ snapshot._class ] === undefined )
		if ( typeof sdWorld.entity_classes[ snapshot._class ] === 'undefined' )
		{
			if ( snapshot._class === 'sdBone' )
			return null;
			
			//console.log( 'Known entity classes: ', sdWorld.entity_classes );
			throw new Error( 'Unknown entity class "'+snapshot._class+'". Download or it is missing?' );
		}
		
		let params = { x:snapshot.x, y:snapshot.y, _net_id:snapshot._net_id };
		
		// Some entities like crystal crabs have separate set of properties
		
		/*if ( typeof snapshot.class !== 'undefined' )
		params.class = snapshot.class;
		
		if ( typeof snapshot.type !== 'undefined' )
		params.type = snapshot.type;
		
		if ( typeof snapshot.mission !== 'undefined' )
		params.mission = snapshot.mission;
		
		if ( typeof snapshot.variation !== 'undefined' ) // Grass, needs for timers
		params.variation = snapshot.variation;
		
		if ( typeof snapshot._natural !== 'undefined' ) // For proper dirt counting
		params.natural = snapshot._natural;*/
		for ( let i = 0; i < sdEntity.properties_important_upon_creation.length; i++ )
		{
			let prop = sdEntity.properties_important_upon_creation[ i ];
			
			if ( typeof snapshot[ prop ] !== 'undefined' )
			params[ prop ] = snapshot[ prop ];
		}
		
		//var ret = new sdWorld.entity_classes[ snapshot._class ]({ x:snapshot.x, y:snapshot.y });
		var ret = new sdWorld.entity_classes[ snapshot._class ]( params );
		//ret._net_id = snapshot._net_id;
		//sdEntity.entities_by_net_id_cache[ ret._net_id ] = ret; // Same for client, done here rather than during object creation
		
		ret.ApplySnapshot( snapshot );
		
		ret.onSnapshotApplied();
		
		ret.UpdateHitbox();
		
		/*if ( ret._is_being_removed )
		if ( sdWorld.entity_classes.sdEntity.active_entities.indexOf( ret ) === -1 )
		{
			debugger;
			throw new Error( 'How?' );
		}*/
		
		sdEntity.entities.push( ret );
		//sdWorld.UpdateHashPosition( ret, false ); // Will prevent sdBlock from occasionally not having collisions on client-side (it will rest in hibernated state, probably because of that. It is kind of a bug though)
	
		return ret;
	}	
	onSnapshotApplied() // To override
	{
	}
	onToggleEnabledChange() // Called via sdButton
	{
	}
	//static GuessEntityName( net_id ) // For client-side coms, also for server bound extend report. Use sdWorld.ClassNameToProperName in other cases
	static GuessEntityName( net_id_or_biometry ) // For client-side coms, also for server bound extend report. Use sdWorld.ClassNameToProperName in other cases
	{
		let net_id = net_id_or_biometry;
		
		if ( typeof net_id === 'string' )
		{
			if ( net_id === 'sdCharacter' )
			return 'all players';
			if ( net_id === 'sdPlayerDrone' )
			return 'all player drones';
			if ( net_id === 'sdCrystal' )
			return 'all crystals';
			if ( net_id === 'sdCube' )
			return 'all Cubes';
			if ( net_id === 'sdStorage' )
			return 'all storage crates';
			if ( net_id === 'sdHover' )
			return 'all Hovers';
			if ( net_id === 'sdGun' )
			return 'all items';
			if ( net_id === 'sdJunk' )
			return 'all dug out junk';
			if ( net_id === '*' )
			return 'all everything';
		
			return net_id;
		}
		
		let e = null;
		
		
		//let e = sdEntity.entities_by_net_id_cache[ net_id ];
		e = sdEntity.entities_by_net_id_cache_map.get( net_id );
		
		if ( !e )
		for ( let i = 0; i < sdWorld.entity_classes.sdCharacter.characters.length; i++ )
		if ( sdWorld.entity_classes.sdCharacter.characters[ i ].biometry === net_id_or_biometry )
		{
			e = sdWorld.entity_classes.sdCharacter.characters[ i ];
			break;
		}
	
	
		//if ( typeof sdEntity.entities_by_net_id_cache[ net_id ] === 'undefined' )
		if ( !e )
		{
			return 'user #' + net_id;
		}
		else
		{
			//let e = sdEntity.entities_by_net_id_cache[ net_id ];
			
			if ( e.GetClass() === 'sdCommandCentre' )
			{
				return 'Command centre';
			}
			else
			if ( e.GetClass() === 'sdCharacter' )
			{
				let s = e.title;

				if ( sdWorld.client_side_censorship && e.title_censored )
				s = 'Censored Defender';
				
				if ( e._is_being_removed )
				s += ' [ body is broken ]';
				else
				if ( e.hea <= 0 )
				s += ' [ dead ]';
				
				return s;
			}
			else
			if ( e.GetClass() === 'sdGun' )
			{
				if ( sdWorld.entity_classes.sdGun.classes[ e.class ] )
				{
					if ( sdWorld.client_side_censorship && e.title_censored )
					return 'item';
				
					return e.GetTitle();// sdWorld.entity_classes.sdGun.classes[ e.class ].title;
				}
				else
				return 'Item of unknown class ' + e.class;
			}
			else
			return e.GetClass() + '#' + net_id;
		}
	}
	WakeUpMatterSources( connected_ents=null ) // Call this when entity loses some of its matter and needs hibernated nearby entities to wake up
	{
		if ( !connected_ents )
		{
			if ( !sdCable )
			sdCable = sdWorld.entity_classes.sdCable;
		
			connected_ents = sdCable.GetConnectedEntities( this, sdCable.TYPE_MATTER );
		}
	
		for ( var i = 0; i < connected_ents.length; i++ )
		{
			if ( connected_ents[ i ]._hiberstate !== sdEntity.HIBERSTATE_ACTIVE )
			//if ( ( typeof connected_ents[ i ].matter !== 'undefined' || typeof connected_ents[ i ]._matter !== 'undefined' ) && !connected_ents[ i ]._is_being_removed ) // Can appear as being removed as well...
			if ( connected_ents[ i ]._has_matter_props && !connected_ents[ i ]._is_being_removed )
			if ( !connected_ents[ i ].PrioritizeGivingMatterAway() )
			connected_ents[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return false;
	}
	GetAutoConnectedEntityForMatterFlow()
	{
		return null;
	}
	MatterGlow( how_much=0.01, radius=30, GSPEED ) // Set radius to 0 to only glow into cables. Make sure to call WakeUpMatterSources when matter drops or else some mid-way nodes might end up not being awaken
	{
		if ( !sdWorld.is_server )
		if ( this.is_static )
		return;

		/*if ( sdWorld.sockets )
		if ( sdWorld.sockets[ 0 ] )
		if ( sdWorld.sockets[ 0 ].character )
		//if ( this === sdWorld.sockets[ 0 ].character.hook_relative_to )
		if ( this === sdWorld.sockets[ 0 ].character._stands_on )
		{
			debugger;
		}*/
	
		let this_matter = ( this.matter || this._matter || 0 );
		
		if ( this_matter > 0.05 )
		{
			if ( !sdCable )
			sdCable = sdWorld.entity_classes.sdCable;
		
			let i;
			
			//let visited_ents = new Set();
			//visited_ents.add( this );
			
			const visited_ent_flag = sdEntity.GetUniqueFlagValue();
			this._flag = visited_ent_flag;
			
			let array_is_not_cloned = true;
			
			if ( this.onThink.has_cable_support )
			{
				let connected_ents;

				if ( this._connected_ents && sdWorld.time < this._connected_ents_next_rethink ) // This cache probably should not be rethinked at all (since cables erase it anyway)... But just in case...
				{
					connected_ents = this._connected_ents;
				}
				else
				{
					connected_ents = sdCable.GetConnectedEntities( this, sdCable.TYPE_MATTER );

					/*if ( !sdCrystal )
					sdCrystal = sdWorld.entity_classes.sdCrystal;

					if ( !sdMatterAmplifier )
					sdMatterAmplifier = sdWorld.entity_classes.sdMatterAmplifier;*/

					let auto_entity = this.GetAutoConnectedEntityForMatterFlow();

					if ( auto_entity )
					if ( array_is_not_cloned )
					{
						array_is_not_cloned = false;
						connected_ents = connected_ents.slice(); // Clone

						connected_ents.push( auto_entity );
					}


					for ( i = 0; i < connected_ents.length; i++ )
					{
						const e = connected_ents[ i ];

						/*globalThis.max_connected_ents_length = globalThis.max_connected_ents_length || null;

						// Top: 257
						if ( globalThis.max_connected_ents_length === null || connected_ents.length > globalThis.max_connected_ents_length.len )
						{
							globalThis.max_connected_ents_length = {
								len: connected_ents.length,
								arr: connected_ents,
								that: this
							};
						}*/

						//if ( ( typeof e.matter !== 'undefined' || typeof e._matter !== 'undefined' ) && !e._is_being_removed ) // Can appear as being removed as well...
						if ( e._has_matter_props && !e._is_being_removed )
						{
							//this.TransferMatter( e, how_much, GSPEED * 4 ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity

							//visited_ents.add( e );
							e._flag = visited_ent_flag;

							if ( e.PrioritizeGivingMatterAway() )
							{
								if ( array_is_not_cloned )
								{
									array_is_not_cloned = false;
									connected_ents = connected_ents.slice(); // Clone
								}

								let recursively_connected = sdCable.GetConnectedEntities( e, sdCable.TYPE_MATTER );

								if ( recursively_connected )
								for ( let i2 = 0; i2 < recursively_connected.length; i2++ )
								//if ( !visited_ents.has( recursively_connected[ i2 ] ) )
								if ( recursively_connected[ i2 ]._flag !== visited_ent_flag )
								{
									//visited_ents.add( recursively_connected[ i2 ] );
									recursively_connected[ i2 ]._flag = visited_ent_flag;

									connected_ents.push( recursively_connected[ i2 ] );

									let auto2 = recursively_connected[ i2 ].GetAutoConnectedEntityForMatterFlow();
									if ( auto2 )
									connected_ents.push( auto2 );
								}
							}


							if ( ( e.matter_max || e._matter_max || 0 ) <= 20 ) // Exclude sdCom, sdMatterAmplifier, sdNode - they won't receive any matter
							{
								connected_ents.splice( i, 1 );
								i--;
								continue;
							}
						}
						else
						{
							connected_ents.splice( i, 1 );
							i--;
							continue;
						}
					}
					//visited_ents = null;


					this._connected_ents = connected_ents;
					//this._connected_ents_next_rethink = sdWorld.time + 200 + Math.random() * 50;

					this._connected_ents_next_rethink = sdWorld.time + 1000 * 60 + Math.random() * 1000; // Likely should never expire?
				}

				for ( let i = 0; i < connected_ents.length; i++ )
				{
					//let keep = false;
					
					if ( !connected_ents[ i ]._is_being_removed )
					{
						/*keep = */this.TransferMatter( connected_ents[ i ], how_much, GSPEED * 4 ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity
					}
					else
					//if ( !keep )
					{
						connected_ents.splice( i, 1 );
						i--;
						continue;
					}
				}
			}
			
			
			if ( radius > 0 )
			if ( this_matter > 0.05 )
			{
				let old_rethink_time = this._next_anything_near_rethink;
				
				//var arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null, ( e )=>!e.is( sdWorld.entity_classes.sdBG ) );
				let arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null, true, sdWorld.FilterHasMatterProperties );

				let extend_cache_duration = ( old_rethink_time !== this._next_anything_near_rethink );

				for ( i = 0; i < arr.length; i++ )
				{
					let e = arr[ i ];
					
					//if ( ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' ) && arr[ i ] !== this && !arr[ i ]._is_being_removed )
					if ( e._has_matter_props && e !== this && !e._is_being_removed )
					{
						if ( extend_cache_duration )
						{
							if ( ( e.matter || e._matter || 0 ) < ( e.matter_max || e._matter_max || 0 ) )
							extend_cache_duration = false;
						}
						
						this.TransferMatter( arr[ i ], how_much, GSPEED * 4 ); // Mult by X because targets no longer take 4 cells
					}
					else
					{
						// Remove these that do not match anyway, at least for brief period of time until GetAnythingNearCache overrides this list - less time to spend on property existence checks
						arr.splice( i, 1 );
						i--;
					}
				}
				
				if ( extend_cache_duration )
				{
					this._next_anything_near_rethink += 400;
				}
			}
			
			//this.WakeUpMatterSources( connected_ents );
			this.WakeUpMatterSources( null );
		}
	}
	HungryMatterGlow( how_much=0.01, radius=30, GSPEED )
	{
		// In case of client it only allows matter drain sound
		if ( !sdWorld.is_server )
		if ( sdSound.allow_matter_drain_loop )
		return;
			
		let this_matter = ( this.matter || this._matter || 0 );
		let this_matter_max = ( this.matter_max || this._matter_max || 0 );
		
		if ( this_matter < this_matter_max - 0.05 )
		{
			var arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null, true, sdWorld.FilterHasMatterProperties );

			for ( var i = 0; i < arr.length; i++ )
			{
				const e = arr[ i ];
				
				if ( ( typeof e.matter !== 'undefined' || typeof e._matter !== 'undefined' ) && e !== this && !e._is_being_removed )
				{
					if ( sdWorld.is_server )
					{
						if ( radius > 32 )
						{
							if ( !sdWorld.server_config.base_degradation )
							if ( !sdWorld.CheckLineOfSight( this.x, this.y, ...e.GetClosestPointWithinCollision( this.x, this.y ), null, null, null, sdWorld.FilterShieldedWallsAndDoors ) )
							continue;
						}
						
						e.TransferMatter( this, how_much, GSPEED * 4, true ); // Mult by X because targets no longer take 4 cells
						e.WakeUpMatterSources();
					}
					else
					{
						if ( e === sdWorld.my_entity )
						{
							sdSound.allow_matter_drain_loop = true;
							break;
						}
					}
				}
				else
				{
					// Remove these that do not match anyway, at least for brief period of time until GetAnythingNearCache overrides this list - less time to spend on property existence checks
					arr.splice( i, 1 );
					i--;
				}
			}
		}
	}
	hasEventListener( str, method )
	{
		if ( !this._listeners )
		return false;
		
		if ( typeof this._listeners[ str ] === 'undefined' )
		return false;
			
		let i = this._listeners[ str ].indexOf( method );
		return ( i !== -1 );
	}
	addEventListener( str, method ) // Not all entities will support these
	{
		if ( !this._listeners )
		this._listeners = {};
	
		if ( typeof this._listeners[ str ] === 'undefined' )
		this._listeners[ str ] = [];
	
		/*if ( typeof method !== 'function' )
		{
			throw new Error( 'Not a function passed to listener: '+(typeof method)+' :: '+method );
		}
		trace( 'adding '+str+' listener '+method.name+' to '+this.GetClass() );*/
		
		this._listeners[ str ].push( method );
	}
	removeEventListener( str, method ) // Not all entities will support these
	{
		if ( this._listeners )
		{
			let i = this._listeners[ str ].indexOf( method );
			if ( i !== -1 )
			{
				this._listeners[ str ].splice( i, 1 );
				//else
				//debugger;

				if ( this._listeners.length === 0 )
				this._listeners = null;
			}
		}
	}
	callEventListener( str, ...args )
	{
		if ( this._listeners )
		if ( typeof this._listeners[ str ] !== 'undefined' )
		{
			for ( let i = 0; i < this._listeners[ str ].length; i++ )
			this._listeners[ str ][ i ]( ...args );
		}
	}
	
	/*InitMatterMode()
	{
		if ( typeof this.matter !== 'undefined' )
		this._matter_mode = sdEntity.MATTER_MODE_PUBLIC;
		else
		if ( typeof this._matter !== 'undefined' )
		this._matter_mode = sdEntity.MATTER_MODE_PRIVATE;
		else
		this._matter_mode = sdEntity.MATTER_MODE_NONE;
	}
	GetMatter()
	{
		//if ( this._matter_mode === sdEntity.MATTER_MODE_UNDECIDED )
		//this.InitMatterMode();
		
		switch ( this._matter_mode )
		{
			case sdEntity.MATTER_MODE_PUBLIC: return this.matter;
			case sdEntity.MATTER_MODE_PRIVATE: return this._matter;
			default: return 0;
		}
	}
	SetMatter( v )
	{
		//if ( this._matter_mode === sdEntity.MATTER_MODE_UNDECIDED )
		//this.InitMatterMode();
		
		switch ( this._matter_mode )
		{
			case sdEntity.MATTER_MODE_PUBLIC: this.matter = v; return;
			case sdEntity.MATTER_MODE_PRIVATE: this._matter = v; return;
			default: return;
		}
	}
	AddMatter( v )
	{
		//if ( this._matter_mode === sdEntity.MATTER_MODE_UNDECIDED )
		//this.InitMatterMode();
		
		switch ( this._matter_mode )
		{
			case sdEntity.MATTER_MODE_PUBLIC: this.matter += v; return;
			case sdEntity.MATTER_MODE_PRIVATE: this._matter += v; return;
			default: return;
		}
	}*/
	
	TransferMatter( to, how_much, GSPEED, optimize=false )
	{
		let this_matter = ( this.matter || this._matter || 0 );
		//let this_matter = this.GetMatter();
		
		if ( optimize )
		{
			if ( this_matter < 0.05 )
			return false;
		}
		
		let to_matter = ( to.matter || to._matter || 0 );
		//let to_matter = to.GetMatter();
		
		let to_matter_max = ( to.matter_max || to._matter_max || 0 );
		
		if ( to_matter >= to_matter_max )
		return false;
		
		how_much = this_matter * how_much * GSPEED;
		
		if ( how_much > this_matter )
		how_much = this_matter;
	
		if ( how_much > to_matter_max - to_matter )
		how_much = to_matter_max - to_matter;
	
		if ( isNaN( how_much ) )
		{
			debugger;
			how_much = 0;
		}
		
		if ( how_much <= 0 )
		return false;
	
		if ( typeof this.matter !== 'undefined' )
		{
			if ( isNaN( this.matter ) )
			debugger;
			
			this.matter -= how_much;
		}
		else
		{
			if ( isNaN( this._matter ) )
			debugger;
		
			this._matter -= how_much;
		}
		//this.AddMatter( -how_much );
	
		if ( typeof to.matter !== 'undefined' )
		{
			if ( isNaN( to.matter ) )
			debugger;
		
			to.matter += how_much;
		}
		else
		{
			if ( isNaN( to._matter ) )
			debugger;
		
			to._matter += how_much;
		}
		//to.AddMatter( how_much );
		
		// Update update versions for static entities if matter property is public
		
		if ( typeof this.matter !== 'undefined' )
		if ( typeof this._update_version !== 'undefined' )
		this._update_version++;
	
		if ( typeof to.matter !== 'undefined' )
		if ( typeof to._update_version !== 'undefined' )
		to._update_version++;

		if ( to.onMatterChanged !== sdEntity.prototype.onMatterChanged )
		to.onMatterChanged( this );
	
		return true;
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
	}

	WakeUpLiquidSources( connected_ents=null ) // Call this when entity loses some of its matter and needs hibernated nearby entities to wake up
	{
		if ( !connected_ents )
		{
			if ( !sdCable )
			sdCable = sdWorld.entity_classes.sdCable;
		
			connected_ents = sdCable.GetConnectedEntities( this, sdCable.TYPE_LIQUID );
		}

		if ( !this._has_liquid_props )
		return;

		let this_liquid = ( this.liquid || this._liquid )
	
		for ( var i = 0; i < connected_ents.length; i++ )
		{
			if ( connected_ents[ i ]._hiberstate !== sdEntity.HIBERSTATE_ACTIVE )
			//if ( ( typeof connected_ents[ i ].matter !== 'undefined' || typeof connected_ents[ i ]._matter !== 'undefined' ) && !connected_ents[ i ]._is_being_removed ) // Can appear as being removed as well...
			if ( connected_ents[ i ]._has_liquid_props && !connected_ents[ i ]._is_being_removed )
			if ( connected_ents[ i ].IsLiquidTypeAllowed( this_liquid.type ) )
			connected_ents[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	onLiquidChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
	}
	LiquidTransferMode() // 0 - balance liquids, 1 - only give liquids, 2 - only take liquids
	{
	}
	IsLiquidTypeAllowed( type )
	{
		return false;
	}
	GiveLiquid( how_much=0.01, GSPEED, ignore_transfer_mode=false ) // Make sure to call WakeUpMatterSources when matter drops or else some mid-way nodes might end up not being awaken
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( !this._has_liquid_props )
		return;
		
		let this_liquid = ( this.liquid || this._liquid );

		if ( this_liquid.amount > 0 && this.LiquidTransferMode() !== 2 )
		{
			if ( !sdCable )
			sdCable = sdWorld.entity_classes.sdCable;
		
			const sdBaseShieldingUnit = sdWorld.entity_classes.sdBaseShieldingUnit;
			
			let i;
			
			//let visited_ents = new Set();
			//visited_ents.add( this );
			
			const visited_ent_flag = sdEntity.GetUniqueFlagValue();
			this._flag = visited_ent_flag;
			
			let array_is_not_cloned = true;
			
			
			let connected_ents;
			
			if ( this._connected_ents && sdWorld.time < this._connected_ents_next_rethink ) // This cache probably should not be rethinked at all (since cables erase it anyway)... But just in case...
			{
				connected_ents = this._connected_ents;
			}
			else
			{
				connected_ents = sdCable.GetConnectedEntities( this, sdCable.TYPE_LIQUID );
				
				/*if ( !sdCrystal )
				sdCrystal = sdWorld.entity_classes.sdCrystal;
				
				if ( !sdMatterAmplifier )
				sdMatterAmplifier = sdWorld.entity_classes.sdMatterAmplifier;*/
				
				// let auto_entity = this.GetAutoConnectedEntityForMatterFlow();
				
				/*if ( auto_entity )
				if ( array_is_not_cloned )
				{
					array_is_not_cloned = false;
					connected_ents = connected_ents.slice(); // Clone
					
					connected_ents.push( auto_entity );
				}*/
				
				
				for ( i = 0; i < connected_ents.length; i++ )
				{
					const e = connected_ents[ i ];
					
					/*globalThis.max_connected_ents_length = globalThis.max_connected_ents_length || null;

					// Top: 257
					if ( globalThis.max_connected_ents_length === null || connected_ents.length > globalThis.max_connected_ents_length.len )
					{
						globalThis.max_connected_ents_length = {
							len: connected_ents.length,
							arr: connected_ents,
							that: this
						};
					}*/

					//if ( ( typeof e.matter !== 'undefined' || typeof e._matter !== 'undefined' ) && !e._is_being_removed ) // Can appear as being removed as well...
					if ( e._has_liquid_props && !e._is_being_removed )
					{
						//this.TransferMatter( e, how_much, GSPEED * 4 ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity

						//visited_ents.add( e );
						e._flag = visited_ent_flag;

						if ( e.IsLiquidTypeAllowed( this_liquid.type ) )
						{
							if ( array_is_not_cloned )
							{
								array_is_not_cloned = false;
								connected_ents = connected_ents.slice(); // Clone
							}

							let recursively_connected = sdCable.GetConnectedEntities( e, sdCable.TYPE_LIQUID );

							if ( recursively_connected )
							for ( let i2 = 0; i2 < recursively_connected.length; i2++ )
							//if ( !visited_ents.has( recursively_connected[ i2 ] ) )
							if ( recursively_connected[ i2 ]._flag !== visited_ent_flag )
							{
								//visited_ents.add( recursively_connected[ i2 ] );
								recursively_connected[ i2 ]._flag = visited_ent_flag;

								connected_ents.push( recursively_connected[ i2 ] );
							}
						}
						
						
						/*if ( ( e.matter_max || e._matter_max || 0 ) <= 20 ) // Exclude sdCom, sdMatterAmplifier, sdNode - they won't receive any matter
						{
							connected_ents.splice( i, 1 );
							i--;
							continue;
						}*/
					}
					else
					if ( !connected_ents[ i ].is( sdBaseShieldingUnit ) )
					{
						connected_ents.splice( i, 1 );
						i--;
						continue;
					}
				}
				//visited_ents = null;
				
				
				this._connected_ents = connected_ents;
				this._connected_ents_next_rethink = sdWorld.time + 200 + Math.random() * 50;
			}
			
			for ( let i = 0; i < connected_ents.length; i++ )
			{
				if ( !connected_ents[ i ]._is_being_removed )
				{
					if ( connected_ents[ i ]._has_liquid_props )
					if ( connected_ents[ i ].IsLiquidTypeAllowed( this_liquid.type ) && connected_ents[ i ].LiquidTransferMode() !== 1 )
					this.TransferLiquid( connected_ents[ i ], how_much, GSPEED ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity

					if ( sdWorld.server_config.do_green_base_shielding_units_consume_essence )
					if ( this_liquid.type === 4 ) // sdWater.TYPE_ESSENCE
					if ( connected_ents[ i ].is( sdBaseShieldingUnit ) && connected_ents[ i ].type === 0 )
					this.TransferEssence( connected_ents[ i ], how_much, GSPEED ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity
				}
			}
			
			//this.WakeUpMatterSources( connected_ents );
			this.WakeUpLiquidSources( null );
		}
	}
	TransferLiquid( to, how_much, GSPEED, optimize_threshold=10 )
	{
		if ( !this._has_liquid_props || !to._has_liquid_props )
		return;
		
		let this_liquid = ( this.liquid || this._liquid );
		let to_liquid = ( to.liquid || to._liquid );

		if ( !to.IsLiquidTypeAllowed( this_liquid.type ) )
		return;

		if ( this.LiquidTransferMode() === 0 && to.LiquidTransferMode() === 0 && Math.abs( this_liquid.amount - to_liquid.amount ) < optimize_threshold ) // Don't transfer if both liquids are equal
		return;

		if ( this.LiquidTransferMode() === 1 || to.LiquidTransferMode() === 2 )
		how_much = this_liquid.max * how_much * GSPEED;
		else
		{
			how_much = this_liquid.amount * how_much * GSPEED;

			if ( Math.random() > how_much ) // For proper balancing
			return;
		}

		how_much = Math.ceil( how_much ); // Should only change by integers to avoid floating point errors

		if ( how_much > this_liquid.amount )
		how_much = this_liquid.amount;
	
		if ( how_much > to_liquid.max - to_liquid.amount )
		how_much = to_liquid.max - to_liquid.amount;
	
		if ( isNaN( how_much ) )
		{
			debugger;
			how_much = 0;
		}
		
		if ( how_much <= 0 )
		return;

		let extra = Math.round( this_liquid.extra / this_liquid.amount * how_much );

		if ( isNaN( extra ) )
		debugger;
	
		if ( typeof this.liquid !== 'undefined' )
		{
			if ( isNaN( this.liquid.amount ) )
			debugger;
			
			this.liquid.amount -= how_much;

			if ( isNaN( this.liquid.extra ) )
			debugger;
			
			this.liquid.extra -= extra;
		}
		else
		{
			if ( isNaN( this._liquid.amount ) )
			debugger;
		
			this._liquid.amount -= how_much;

			if ( isNaN( this._liquid.extra ) )
			debugger;
		
			this._liquid.extra -= extra;
		}
	
		if ( typeof to.liquid !== 'undefined' )
		{
			if ( isNaN( to.liquid.amount ) )
			debugger;
		
			to.liquid.amount += how_much;

			if ( isNaN( to.liquid.extra ) )
			debugger;
		
			to.liquid.extra += extra;

			if ( to.liquid.type === -1 )
			to.liquid.type = this_liquid.type;
		}
		else
		{
			if ( isNaN( to._liquid.amount ) )
			debugger;
		
			to._liquid.amount += how_much;

			if ( isNaN( to._liquid.extra ) )
			debugger;
		
			to._liquid.extra += extra;

			if ( to._liquid.type === -1 )
			to._liquid.type = this_liquid.type;
		}
		
		// Update update versions for static entities if matter property is public
		
		if ( typeof this.liquid !== 'undefined' )
		if ( typeof this._update_version !== 'undefined' )
		this._update_version++;
	
		if ( typeof to.liquid !== 'undefined' )
		if ( typeof to._update_version !== 'undefined' )
		to._update_version++;

		if ( to.onLiquidChanged !== sdEntity.prototype.onLiquidChanged )
		to.onLiquidChanged( this );
	}
	TransferEssence( to, how_much, GSPEED ) // For entities that do not hold liquid
	{
		if ( !this._has_liquid_props )
		return;

		let is_bsu = ( to.is( sdWorld.entity_classes.sdBaseShieldingUnit ) );

		if ( !is_bsu || to.type !== 0 )
		return;

		let this_liquid = ( this.liquid || this._liquid );

		how_much = this_liquid.extra * how_much * GSPEED;

		how_much = Math.ceil( how_much ); // Should only change by integers to avoid floating point errors

		if ( how_much > this_liquid.extra )
		how_much = this_liquid.extra;

		if ( isNaN( how_much ) )
		{
			debugger;
			how_much = 0;
		}
		
		if ( how_much <= 0 )
		return;

		let liquid_lost = this_liquid.amount / this_liquid.extra; // Liquid essence is consumed slower the higher its value

		if ( liquid_lost > this_liquid.amount )
		liquid_lost = this_liquid.amount;

		if ( this_liquid.amount - liquid_lost <= 0 && this_liquid.extra > how_much )
		liquid_lost = 0;

		if ( this_liquid.extra - how_much <= 0 && this_liquid.amount > liquid_lost )
		liquid_lost = this_liquid.amount;

		if ( typeof this.liquid !== 'undefined' )
		{
			if ( isNaN( this.liquid.amount ) )
			debugger;
			
			this.liquid.amount -= liquid_lost;

			if ( isNaN( this.liquid.extra ) )
			debugger;
			
			this.liquid.extra -= how_much;
		}
		else
		{
			if ( isNaN( this._liquid.amount ) )
			debugger;
		
			this._liquid.amount -= liquid_lost;

			if ( isNaN( this._liquid.extra ) )
			debugger;
		
			this._liquid.extra -= how_much;
		}

		if ( is_bsu )
		{
			if ( isNaN( to.matter_crystal ) )
			debugger;
		
			to.matter_crystal = Math.min( Number.MAX_SAFE_INTEGER, to.matter_crystal + how_much );
		}
		
		// Update update versions for static entities if matter property is public
		
		if ( typeof this.liquid !== 'undefined' )
		if ( typeof this._update_version !== 'undefined' )
		this._update_version++;
	
		if ( typeof to._update_version !== 'undefined' )
		if ( typeof to.matter_crystal !== 'undefined' )
		to._update_version++;
	}

	/*Think( GSPEED )
	{
		this.onThink( GSPEED );

		return this._is_being_removed;
	}*/
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
	}
	remove()
	{
		//if ( this.GetClass() === 'sdTask' )
		//debugger;
		
		// Or else some entities won't be removed
		if ( !this._is_being_removed )
		{
			this.onBeforeRemove();
			
			/*if ( this._class === 'sdBullet' )
			{
				trace( 'Bullet is being removed' );
				debugger;
			}*/
			
			if ( !this.IsGlobalEntity() )
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			this._is_being_removed = true;

			this._broken = true; // By default, you can override it after removal was called for entity // Copy [ 1 / 2 ]
			
			/*let removal_stack_trace = globalThis.getStackTrace();
			let ticks = 0;
			let cb = ()=>{
				
				if ( Date.now() > sdWorld.time - 100 )
				if ( sdEntity.entities.indexOf( this ) !== -1 )
				{
					ticks++;
					if ( ticks > 3 )
					{
						console.warn( 'Object was not removed at: ' + removal_stack_trace );
						return;
					}
				}
				setTimeout( cb, 5000 );
			};
			setTimeout( cb, 5000 );*/
		}
	}
	ClearAllPropertiesOnRemove()
	{
		return true;
	}
	_remove() // If you are willing to use this method - make sure to removed to do _remove_from_entities_array()
	{
		//if ( this.GetClass() === 'sdTask' )
		//debugger;
		
		// Method should be called only ever once per entity, but there was case where it didn't. Since it has no side effects I haven't debugged callstack of first removal, but it surely can be done (performance damage)
		
		// Just in case? Never needed but OnThink might return true for removal without .remove() call
		if ( !this._is_being_removed )
		{
			this._is_being_removed = true;

			this._broken = true; // By default, you can override it after removal was called for entity // Copy [ 2 / 2 ]
		}
		
		//if ( this._listeners )
		//for ( var i = 0; i < this._listeners.REMOVAL.length; i++ )
		//this._listeners.REMOVAL[ i ]( this );
		this.callEventListener( 'REMOVAL', this );
		
		this.onRemove();
		
		this.ExcludeAllDrivers();
		//this.RemoveAllDrivers();
		
		this.ManageTrackedPhysWakeup();
		this.SetPhysRestOn( null );
		
		if ( !this.IsGlobalEntity() )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_REMOVED );
			sdWorld.UpdateHashPosition( this, false );
		}
		
		// Some more memory leak preventing cleanup logic
		{
			if ( typeof this._anything_near !== 'undefined' )
			this._anything_near = null;

			if ( typeof this._com_near_cache !== 'undefined' )
			this._com_near_cache = null;
		
			if ( typeof this._targets_raw_cache !== 'undefined' )
			this._targets_raw_cache = null;
		
			if ( typeof this._angular_range_cache !== 'undefined' )
			{
				this._angular_range_cache = null;
				this._angular_range_cache_per_entity = null;
			}

			if ( typeof this._phys_last_touch !== 'undefined' )
			{
				if ( this._phys_last_touch )
				{
					if ( typeof this._phys_last_touch._phys_last_touch !== 'undefined' )
					if ( this._phys_last_touch._phys_last_touch === this )
					this._phys_last_touch._phys_last_touch = null;
				}
				
				this._phys_last_touch = null;
			}
			
			if ( typeof this._connected_ents !== 'undefined' )
			this._connected_ents = null;
		
			if ( this.ClearAllPropertiesOnRemove() )
			{
				
				let props = Object.getOwnPropertyNames( this );
				for ( let i = 0; i < props.length; i++ )
				{
					let prop = props[ i ];
					let value = this[ prop ];

					if ( typeof value === 'number' )
					{
						// Ignore
					}
					else
					if ( typeof value === 'object' )
					{
						/*if ( prop === '_phys_entities_on_top' )
						{
						}
						else*/
						if ( this[ prop ] instanceof sdEntity )
						this[ prop ] = null;
						else
						/*if ( this[ prop ] instanceof WeakSet || this[ prop ] instanceof WeakMap || this[ prop ] instanceof sdKeyStates )
						{
						}
						else*/
						if ( this[ prop ] instanceof Array && this[ prop ].length > 0 && this[ prop ][ 0 ] instanceof sdEntity )
						this[ prop ] = null;
						else
						if ( ( this[ prop ] instanceof Map || this[ prop ] instanceof Set ) && this[ prop ].values().length > 0 && this[ prop ].values()[ 0 ] instanceof sdEntity )
						this[ prop ] = null;
						else
						if ( this[ prop ] instanceof Map && this[ prop ].keys().length > 0 && this[ prop ].keys()[ 0 ] instanceof sdEntity )
						this[ prop ] = null;
					}
					else
					if ( typeof value === 'string' )
					{
						if ( prop !== '_class' ) // Keep the class name as it is required for deletion data sync
						this[ prop ] = '';
					}
				}
			}
			
			/* It is handled by memory leak seeker now instead
			const is_vehicle = this.IsVehicle();
		
			if ( is_vehicle )
			{
				const sdCharacter = sdWorld.entity_classes.sdCharacter;
				
				for ( let i = 0; i < sdCharacter.characters.length; i++ )
				{
					if ( is_vehicle )
					if ( sdCharacter.characters[ i ]._potential_vehicle === this )
					sdCharacter.characters[ i ]._potential_vehicle = null;
				}
			}
			
			// More of automated approach for cross-pointer removal
			let entities_for_back_scan = [];
			
			let props = Object.getOwnPropertyNames( this );
			
			for ( let i = 0; i < props.length; i++ )
			{
				let prop = props[ i ];
				
				let value = this[ prop ];
				
				if ( value instanceof sdEntity )
				{
					entities_for_back_scan.push( value );
					
					this[ prop ] = sdEntity.pointer_has_been_cleared;
				}
				else
				if ( value instanceof Array )
				{
					if ( value.length > 0 )
					this[ prop ] = sdEntity.pointer_has_been_cleared;
				}
				else
				if ( value instanceof Map || value instanceof Set )
				{
					this[ prop ] = sdEntity.pointer_has_been_cleared;
				}
			}
			
			for ( let i = 0; i < entities_for_back_scan.length; i++ )
			{
				let ent = entities_for_back_scan[ i ];
				
				for ( let i2 = 0; i2 < props.length; i2++ )
				{
					let prop = props[ i2 ];

					let value = ent[ prop ];

					if ( value === this )
					ent[ prop ] = sdEntity.immutable_removed_object;
					else
					if ( value instanceof Array )
					{
						for ( let i3 = 0; i3 < value.length; i3++ )
						{
							if ( value[ i3 ] === this )
							value[ i3 ] = sdEntity.removed_object;
						}
					}
					else
					if ( value instanceof Object )
					{
						for ( let i3 in value )
						{
							if ( value[ i3 ] === this )
							value[ i3 ] = sdEntity.removed_object;
						}
					}
				}
			}*/
		}
		
		/*if ( this.IsGlobalEntity() ) Better do it in sdWorld
		{
			let i = sdEntity.global_entities.indexOf( this );
			if ( i === -1 )
			{
				debugger;
			}
			else
			sdEntity.global_entities.splice( i, 1 );
		}*/
		
		if ( this._net_id !== undefined ) // client-side entities
		{
			//console.warn('deleted cache with this._net_id = '+this._net_id);
			//if ( !sdWorld.is_server ) server tracks these now too
			{
				//if ( sdEntity.entities_by_net_id_cache[ this._net_id ] !== this )
				if ( sdEntity.entities_by_net_id_cache_map.get( this._net_id ) !== this )
				debugger; // Should never happen
			
				//delete sdEntity.entities_by_net_id_cache[ this._net_id ];
				sdEntity.entities_by_net_id_cache_map.delete( this._net_id );
				
				if ( sdWorld.is_server )
				if ( !sdWorld.is_singleplayer )
				if ( this.onRemove.has_broken_property_check )
				{
					/*if ( this.GetClass() === 'sdCharacter' )
					if ( !this._ai )
					{
						debugger;
					}*/
					
					sdEntity.removed_entities_info.set( this._net_id, { entity: this, ttl: sdWorld.time + 10000 } );
					//trace( 'deleting ' + this.GetClass() );
				}
			}
		}
		
		sdSound.DestroyAllSoundChannels( this );
	}
	/*_remove_from_entities_array( old_hiber_state=-2 )
	{
		// Use BulkRemoveEntitiesFromEntitiesArray instead when possible
		
		let id = sdEntity.entities.indexOf( this );
		if ( id === -1 )
		{
			console.log('Removing unlisted entity ' + this.GetClass() + ', hiberstate was ' + ( old_hiber_state === -2 ) ? '(unspecified)' : old_hiber_state + '. Entity was made at: ' + this._stack_trace );
			debugger;	
		}
		else
		sdEntity.entities.splice( id, 1 );
	}*/
	static BulkRemoveEntitiesFromEntitiesArray( arr, force_all=false ) // Entities should be already _is_being_removed. force_all is true in sdDeepSleep
	{
		if ( arr.length <= 0 )
		return;
	
		// Partial removal approach
		let t = force_all ? 0 : Date.now();
		let t2 = t;
		
		let pos = 0;
		
		let at_least = force_all ? arr.length : Math.ceil( arr.length * 0.01 );
		
		while ( pos < arr.length && ( t2 - t < 1 || pos < at_least ) )
		{
			let id = sdEntity.entities.lastIndexOf( arr[ pos ] );
			if ( id !== -1 )
			sdEntity.entities.splice( id, 1 );

            pos++;

			t2 = force_all ? 0 : Date.now();
		}
		
		if ( pos === arr.length )
		arr.length = 0;
		else
		arr.splice( 0, pos );
	}
	
	
	
	isFireAndAcidDamageResistant()
	{
		return false;
	}
	isSnapshotDecodingAllowed( snapshot ) // Used by characters on client-side to prevent freezing due to new method of GSPEED catching up
	{
		return true;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP ); // Likely no logic is added to entity - no reason to keep it awake at all. Something like sdSensorArea can happen to be non-hiberanted occasionally, possibly due to being loaded from snapshots. This would solve that
	}
	onThinkFrozen( GSPEED )
	{
		if ( this.onThink.has_ApplyVelocityAndCollisions ) // Likely is capable of falling
		{
			if ( typeof this.held_by !== 'undefined' && this.held_by )
			{
			}
			else
			{
				this.sy += sdWorld.gravity * GSPEED;
				this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1 ); // Extra fragility is buggy
			}
		}
		else
		{
			// No hibernation logic is really needed here - it barely happens if happens at all
			//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP ); // Likely no logic is added to entity - no reason to keep it awake at all. Something like sdSensorArea can happen to be non-hiberanted occasionally, possibly due to being loaded from snapshots. This would solve that
		}
			
		//if ( this._ragdoll )
		//this._ragdoll.Think( GSPEED * 0.01 );
	}
	onRemove() // Class-specific, if needed. Can be overriden with onRemoveAsFakeEntity but only like this: ent.SetMethod( 'onRemove', ent.onRemoveAsFakeEntity ); ent.remove(); ent._remove();
	{
		// Make sure to not spawn any new potentially permanent entities there because that won't work well with world bounds move
	}
	onRemoveAsFakeEntity() // Will be called instead of onRemove() if entity was never added to world
	{
		// Make sure to not spawn any new potentially permanent entities there because that won't work well with world bounds move
	}
	SetMethod( method_name, method ) // Because doing it normally will make method enumerable and thus it will appear in snapshots. And will cause crash. Also this one binds "this"
	{
		Object.defineProperty( this, method_name,
		{
			value: method.bind( this ),
			enumerable: false
		});
	}
	HookAttempt() // true for allow. from_entity is sdBullet that is hook tracer
	{
		return true;
	}
	onMovementInRange( from_entity )
	{
	}
	ApplyStatusEffect( params )
	{
		if ( !sdStatusEffect )
		sdStatusEffect = sdWorld.entity_classes.sdStatusEffect;
	
		if ( this.is( sdStatusEffect ) )
		{
			//debugger;
			return;
		}
		
		params.for = this;
		sdStatusEffect.ApplyStatusEffectForEntity( params );
	}
	
	
	DamageWithEffect( dmg, initiator=null, headshot=false, affects_armor=true )
	{
		// Some extra check so old code works without changes and occasional crashes
		if ( initiator )
		if ( initiator._is_being_removed )
		initiator = null;
		
		if ( sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( !!this.IsInSafeArea() )
			{
				if ( initiator && initiator._god )
				{
				}
				else
				return false;
			}
			
			if ( initiator )
			{
				if ( dmg > 0 )
				{
					this._last_attacker_net_id = initiator._net_id;
					this._last_attacker_until = sdWorld.time + 7000;
				}
				else
				{
					this._last_attacker_net_id = -1;
					this._last_attacker_until = 0;
				}			
			}


			if ( !sdStatusEffect )
			sdStatusEffect = sdWorld.entity_classes.sdStatusEffect;
		
			let hp_old = Math.max( 0, this.hea || this._hea || 0 );

			this.Damage( dmg, initiator, headshot, affects_armor );

			dmg = hp_old - Math.max( 0, this.hea || this._hea || 0 );
			if ( dmg !== 0 )
			this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_DAMAGED, by: initiator, dmg: dmg, crit:headshot });
		}
		else
		{
			this.Damage( dmg, initiator, headshot, affects_armor );
		}
		
		return true;
	}
	Damage( dmg, initiator=null, headshot=false, affects_armor=true )
	{
	}
	
	get mass() { return this.is_static ? 100 : 5; }
	Impulse( sx, sy )
	{
	}
	SafeAddVelocity( sx, sy ) // Caps velocity at 16 pixels per frame after adding it - in order to prevent too fast object velocities that can pass through walls. It means that velocity will be incorrect after it reaches maximum value. Better approach would be to add more substeps instead of it but that would cause perofrmance issues at some point
	{
		// No longer needed with new collision model
		
		this.sx += sx;
		this.sy += sy;
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // Wake up hibernated storages
		
		/*let sx2 = this.sx + sx;
		let sy2 = this.sy + sy;
		
		let di_pow2 = sx2 * sx2 + sy2 * sy2;
		
		const max_vel_pow2 = 16 * 16;
		
		// Cap max velocity
		if ( di_pow2 > max_vel_pow2 )
		{
			const di = Math.sqrt( di_pow2 );
			const max_vel = Math.sqrt( max_vel_pow2 );
			
			sx2 = sx2 / di * max_vel;
			sy2 = sy2 / di * max_vel;
		}
		
		this.sx = sx2;
		this.sy = sy2;*/
	}
	
	DrawWithStatusEffects( ctx, attached=true )
	{
		if ( !sdStatusEffect )
		sdStatusEffect = sdWorld.entity_classes.sdStatusEffect;
		
		let STATUS_EFFECT_LAYER_NORMAL = 1;
		let STATUS_EFFECT_BEFORE = 0;
		let STATUS_EFFECT_AFTER = 1;
		sdStatusEffect.DrawEffectsFor( this, STATUS_EFFECT_LAYER_NORMAL, STATUS_EFFECT_BEFORE, ctx, false );

		this.Draw( ctx, attached );

		sdStatusEffect.DrawEffectsFor( this, STATUS_EFFECT_LAYER_NORMAL, STATUS_EFFECT_AFTER, ctx, false );
	}
	
	Draw( ctx, attached )
	{
	}
	BasicCarryTooltip( ctx, offset_y=8 )
	{
		if ( this.IsCarriable() )
		{
			if ( this.held_by )
			{
				if ( this.held_by === sdWorld.my_entity )
				sdEntity.Tooltip( ctx, 'Press E to drop or Mouse1 to throw', 0, offset_y, '#aaffaa' );
			}
			else
			sdEntity.Tooltip( ctx, 'Press E to carry', 0, offset_y, '#aaffaa' );
		}
	}
	BasicVehicleTooltip( ctx, offset_y=8 )
	{
		if ( this.IsVehicle() && this.doors_locked !== true && ( this.hea || this._hea || 0 ) > 0 )
		{
			if ( sdWorld.my_entity.driver_of === this )
			sdEntity.Tooltip( ctx, 'Press E to leave vehicle', 0, offset_y, '#aaffaa' );
			else
			sdEntity.Tooltip( ctx, 'Press E to enter vehicle', 0, offset_y, '#aaffaa' );
		}
	}
	static Tooltip( ctx, t, x=0, y=0, color='#ffffff' )
	{
		sdEntity.TooltipUntranslated( ctx, T( t ), x, y, color );
	}
	static TooltipUntranslated( ctx, t, x=0, y=0, color='#ffffff' )
	{
		ctx.font = "5.5px Verdana";
		ctx.textAlign = 'center';
		ctx.fillStyle = '#000000';
		ctx.fillText(t, 0 + x, -24.5 + y ); 
		ctx.fillStyle = color;
		ctx.fillText(t, 0 + x, -25 + y ); 
	}
	DrawHealthBar( ctx, color=undefined, y_raise=20, raw_health=true ) // Not called automatically, needs .hea and .hmax as public properties
	{
		if ( this.hea > 0 )
		{
			let w = ~~Math.max( ( this._hitbox_x2 - this._hitbox_x1 ) * 1.25, ( this._hitbox_y2 - this._hitbox_y1 ) * 0.75 );

			let h = this._hitbox_y1;

			ctx.globalAlpha = 1;

			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 + h - y_raise, w, 3 );

			if ( color === undefined )
			{
				if ( this.IsPlayerClass() || ( this.master && this.master.IsPlayerClass() ) || this.owned )
				ctx.fillStyle = '#FF0000';
				else
				ctx.fillStyle = '#FFAA00';
			}
			else
			ctx.fillStyle = color;//'#FF0000';
		
			ctx.fillRect( 1 - w / 2, 1 + h - y_raise, ( w - 2 ) * Math.max( 0, ( this.hea || this._hea ) / ( this.hmax || this._hmax ) ), 1 );
			if ( raw_health )
			{
				ctx.font = "3px Verdana";
				ctx.textAlign = 'center';
			
				ctx.fillStyle = '#ffffff';
				ctx.fillText( Math.round ( this.hea ), 0, h - y_raise + 2.5 );
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
	}
	DrawBG( ctx, attached ) // background layer
	{
	}
	DrawFG( ctx, attached ) // foreground layer, but not HUD
	{
	}
	
	AllowContextCommandsInRestirectedAreas( exectuter_character, executer_socket ) // exectuter_character can be null
	{
		return false;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		/*
		if ( !this._is_being_removed )
		if ( ( this._hea || this.hea ) > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
		}
		*/
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{	
		/*
		if ( !this._is_being_removed )
		if ( ( this._hea || this.hea ) > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			this.AddContextOption( 'Unsubscribe from network', 'COM_UNSUB', exectuter_character._net_id );
		}
		*/
	}
	AddContextOptionNoTranslation( title, command_name, parameters_array, close_on_click=true, extra={} ) // Do not override. extra goes straight to context menu properties
	{
		sdContextMenu.options.push( Object.assign( extra, { 
			title: title,
			close_on_click: close_on_click,
			action: ()=>
			{
				globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.GetClass(), this._net_id, command_name, parameters_array ] );
				
				//if ( extra.extra_action )
				//extra.extra_action();
			}
		}) );
	}
	AddContextOption( title, command_name, parameters_array, close_on_click=true, extra={} ) // Do not override. extra goes straight to context menu properties
	{
		extra.translate = true;
		this.AddContextOptionNoTranslation( title, command_name, parameters_array, close_on_click, extra );
	}
	AddPromptContextOption( title, command_name, parameters_array, hint, default_text, max_characters=100 ) // Do not override. Sets entered text to parameters_array[ 0 ]
	{
		sdContextMenu.options.push({ title: title,
			action: ()=>
			{
				sdChat.StartPrompt( hint, default_text, ( v )=>
				{
					let id = parameters_array.indexOf( undefined );
					if ( id === -1 )
					throw new Error( 'parameters_array of AddPromptContextOption is missing undefined value - without it AddPromptContextOption does now know where to put string which player has provided' );
					else
					parameters_array[ id ] = v;
						
					globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.GetClass(), this._net_id, command_name, parameters_array ] );
				});
			}
		});
	}
	AddColorPickerContextOption( title, command_name, parameters_array, close_on_click=true, default_color='#ff0000' )
	{
		//sdContextMenu.options.push({ title: title,
		//	action: ()=>
		//	{
				this.AddClientSideActionContextOption( 
					title, 
					()=>
					{
						sdRenderer.GetColorPickerValue( default_color, ( new_color )=>
						{
							let id = parameters_array.indexOf( undefined );
							if ( id === -1 )
							throw new Error( 'parameters_array of AddColorPickerContextOption is missing undefined value - without it AddColorPickerContextOption does now know where to put color which player has picked' );
							else
							parameters_array[ id ] = new_color;

							globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.GetClass(), this._net_id, command_name, parameters_array ] );

							if ( !close_on_click )
							this.RebuildContextMenu();
						});
					}, 
					true,
					{ 
						 hint_color: default_color
					}
				);
		//	}
		//});
	}
	AddClientSideActionContextOption( title, action, close_on_click=true, extra={} )
	{
		sdContextMenu.options.push( Object.assign( extra, {
			title: title,
			close_on_click: close_on_click,
			action: action
		} ) );
	}
	RebuildContextMenu()
	{
		sdWorld.hovered_entity = this;
		sdContextMenu.Open();
	}
}
//sdEntity.init_class();

//module.exports = sdEntity;
//module.exports.sdEntity = sdEntity;

//exports.sdEntity = sdEntity;
export default sdEntity;

//module.exports = sdEntity;
