


import sdWorld from '../sdWorld.js';
//import sdSound from '../sdSound.js';
//import sdEffect from './sdEffect.js';


//var entity_net_ids = 0;

let sdCable = null;
let sdStatusEffect = null;
let sdBullet = null;
			
class sdEntity
{
	static get entities_by_net_id_cache()
	{
		throw new Error( 'Outdated property. Property is no longer an array but is a Map instead' );
	}
	static init_class()
	{
		console.log('sdEntity class initiated');
		sdEntity.entities = [];
		sdEntity.global_entities = []; // sdWeather. This array contains extra copies of entities that exist in primary array, which is sdEntity.entities. Entities add themselves here and remove themselves whenever proper disposer like _remove is called.
		
		sdEntity.snapshot_clear_crawler_i = 0; // Slowly cleans up any snapshot data which could help saving some memory, sometimes by a half
		
		sdEntity.active_entities = [];
		
		sdEntity.to_seal_list = [];
		
		sdEntity.HIBERSTATE_ACTIVE = 0;
		sdEntity.HIBERSTATE_HIBERNATED = 1;
		sdEntity.HIBERSTATE_REMOVED = 2;
		sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP = 3; 
		
		//sdEntity.entities_by_net_id_cache = {};
		sdEntity.entities_by_net_id_cache_map = new Map();
		sdEntity.removed_entities_info = new Map(); // Map[by _net_id] of { entity, ttl } // Is used to keep track for last state sync, usually just for _broken property of sdBlock objects
		
		sdEntity.entity_net_ids = 0;
		
		sdEntity.matter_discretion_frames = 5; // Matter transfer happens once per this many frames, this value also scales GSPEED applied for matter transfer
		
		sdEntity.phys_stand_on_map = new WeakMap(); // Key is an object on which something lies on, value is an array of objects that are currently hibernated (such as sdStorage)
		//this._phys_last_touch
		
		sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION = 1;
		sdEntity.COLLISION_MODE_ONLY_CALL_TOUCH_EVENTS = 2;
		
		sdEntity.flag_counter = 0; // For marking entities as visited by WeakSet-like logic, but works faster
		
		sdEntity.y_rest_tracker = new WeakMap(); // entity => { y, repeated_sync_count }
		
		//sdEntity.properties_by_class_all = new WeakMap(); // class => [ 'x', 'y' ... ]
		sdEntity.properties_by_class_public = new WeakMap(); // class => [ 'x', 'y' ... ]
		
		sdEntity.removed_object = { _is_being_removed: true };//404.12345;
		sdEntity.pointer_has_been_cleared = { _inaccessible: true };//403.98765;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdWorld.entity_classes_array = null;
	}
	static AllEntityClassesLoadedAndInitiated()
	{
		sdWorld.entity_classes_array = Object.values( sdWorld.entity_classes );
		for ( let i = 0; i < sdWorld.entity_classes_array.length; i++ )
		sdWorld.entity_classes_array[ i ].class_id = i;
	}
	
	GetCollisionMode()
	{
		return sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION;
	}
	
	static TrackPhysWakeup( sleeping_ent, hibernated_ent )
	{
		var arr = sdEntity.phys_stand_on_map.get( sleeping_ent );
		if ( !arr )
		{
			arr = [ hibernated_ent ];
			
			sdEntity.phys_stand_on_map.set( sleeping_ent, arr );
		}
		else
		{
			// Slow partial cleanup
			if ( arr.length > 5 )
			for ( let i2 = 0; i2 < 2; i2++ )
			{
				let i = ~~( arr.length * Math.random() );
				if ( arr[ i ]._is_being_removed || arr[ i ]._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED )
				{
					arr.splice( i, 1 );
				}
			}
			
			arr.push( hibernated_ent );
		}
	}
	ManageTrackedPhysWakeup() // Can make sense to call this on entity deletion too
	{
		var arr = sdEntity.phys_stand_on_map.get( this );
		if ( arr )
		{
			for ( let i = 0; i < arr.length; i++ )
			{
				if ( arr[ i ]._is_being_removed || arr[ i ]._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED )
				{
					continue;
				}
				else
				{
					arr[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				}
			}
			sdEntity.phys_stand_on_map.delete( this );
		}
	}
	
	IsGlobalEntity() // Should never change
	{ return false; }
	
	get hitbox_x1() { return -5; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	PrecieseHitDetection( x, y ) // Teleports use this to prevent bullets from hitting them like they do. Only ever used by bullets, as a second rule after box-like hit detection. It can make hitting entities past outer bounding box very inaccurate
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
	FigureOutBoxCapVisibilities()
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
				let arr = cells[ c ];
				for ( let i = 0; i < arr.length; i++ )
				{
					let ent = arr[ i ];
					if ( ent.GetClass() === this.GetClass() )
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
		
		sdRenderer.ctx.box_caps.top = !this._box_cap_top;
		sdRenderer.ctx.box_caps.right = !this._box_cap_right;
		sdRenderer.ctx.box_caps.bottom = !this._box_cap_bottom;
		sdRenderer.ctx.box_caps.left = !this._box_cap_left;
	}
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG, return null or array of [x,y,z] offsets
	{ return null; }
	
	CameraDistanceScale3D( layer ) // so far called for layer FG (which is 1), usually only used by chat messages
	{ return 1; }
	
	get substeps() // Bullets will need more
	{ return 1; }
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	get progress_until_removed()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these.
	{ return false; }
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( !ignore_safe_areas )
		if ( !by_entity || !by_entity._admin_picker )
		if ( !sdWorld.entity_classes.sdArea.CheckPointDamageAllowed( this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2, this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2 ) )
		return false;
		
		if ( this.IsAdminEntity() )
		return false;
	
		return true;
	}
	
	IsPlayerClass() // sdCharacter has it as well as everything that extends him
	{
		return false;
	}
	
	GetAccurateDistance( xx, yy ) // Used on client-side when right clicking on cables (also during cursor hovering for context menu and hint), also on server when distance between cable and player is measured
	{
		return sdWorld.Dist2D(	xx, 
								yy, 
								Math.min( Math.max( this.x + this._hitbox_x1, xx ), this.x + this._hitbox_x2 ), 
								Math.min( Math.max( this.y + this._hitbox_y1, yy ), this.y + this._hitbox_y2 ) );
	}
	
	IsAdminEntity() // Influences remover gun hit test
	{ return false; }
	
	/*GetRocketDamageScale() // Mostly defines damage from rockets multiplier so far
	{
		return 1;
	}*/
	IsVehicle()
	{
		return false;
	}
	VehicleHidesLegs()
	{
		return true;
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return false; }
	
	ImpactWithDamageEffect( vel )
	{
		if ( sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( !sdStatusEffect )
			sdStatusEffect = sdWorld.entity_classes.sdStatusEffect;
		
			let hp_old = Math.max( 0, this.hea || this._hea || 0 );

			this.Impact( vel );

			let dmg = hp_old - Math.max( 0, this.hea || this._hea || 0 );
			if ( dmg !== 0 )
			this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_DAMAGED, by: null, dmg: dmg });
		}
		else
		{
			this.Impact( vel );
		}
	}
	
	Impact( vel ) // fall damage basically. Values below 5 won't be reported due to no-damage area lookup optimization
	{
		//if ( vel > 7 )
		if ( vel > 6 ) // For new mass-based model
		{
			//this.DamageWithEffect( ( vel - 4 ) * 15 );
			this.DamageWithEffect( ( vel - 3 ) * 15 );
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
	
	getRequiredEntities() // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		return []; 
	}
	
	PhysInitIfNeeded() // Method can have problems with entities that are not initially physical, it can make sense to call this method somewhere on spawn to init physical cache properties
	{
		//if ( typeof this._phys_sleep === 'undefined' )
		if ( typeof this._phys_last_touch === 'undefined' ) // Pointer is more probable to remain undefined after snapshot load
		{
			this._phys_sleep = 10; // Time until full sleep
			this._phys_last_touch = null;
			this._phys_last_w = 0;
			this._phys_last_h = 0;
			
			// Opposite velocity can cause reactivation of physics (jetpack into ceiling case which normally would cause player being stuck)
			this._phys_last_sx = false;
			this._phys_last_sy = false;
			
			this._phys_last_touch_targetable = false;
			this._phys_last_touch_x = 0;
			this._phys_last_touch_y = 0;
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
	/*SharePhysAwake( hit_what )
	{
		if ( ( typeof this.sx !== 'undefined' && typeof this.sy !== 'undefined' ) || this._is_being_removed )
		if ( ( typeof hit_what.sx !== 'undefined' && typeof hit_what.sy !== 'undefined' ) || hit_what._is_being_removed )
		if ( this.IsTargetable() )
		if ( hit_what.IsTargetable() )
		if ( this.hard_collision )
		if ( hit_what.hard_collision )
		{
			this.PhysInitIfNeeded();
			hit_what.PhysInitIfNeeded();
			
			//if ( this === hit_what )
			//debugger;

			if ( this._phys_sleep < hit_what._phys_sleep )
			if ( hit_what.GetClass() === 'sdHover' || this.GetClass() === 'sdHover' )
			console.log( hit_what.GetClass() + ' wakes up ' + this.GetClass() );

			this._phys_sleep = hit_what._phys_sleep = Math.max( this._phys_sleep, hit_what._phys_sleep );
		}
	}*/
	DoStuckCheck() // Makes _hard_collision-less entities receive unstuck logic
	{
		return false;
	}
	onPhysicallyStuck() // Requires _hard_collision OR DoStuckCheck() to return true. Called as a result of ApplyVelocityAndCollisions call. Return true if entity needs unstuck logic appleid, which can be performance-damaging too
	{
		return false;
	}
	IsMovesLogic( sx_sign, sy_sign )
	{
		return sx_sign !== this._phys_last_sx || 
			   sy_sign !== this._phys_last_sy || 
			   !sdWorld.inDist2D_Boolean( this.sx, this.sy, 0, 0, sdWorld.gravity + 0.1 );
	}
	/*ApplyVelocityAndCollisions( GSPEED, step_size=0, apply_friction=false, impact_scale=1, custom_filtering_method=null ) // step_size can be used by entities that can use stairs
	{
		sdEntity.chet = ( ( sdEntity.chet || 0 ) + 1 ) % 100;
		
		if ( !sdEntity.measure )
		sdEntity.measure = [ 0, 0 ];
		
		let t = Date.now();
		
		if ( sdEntity.chet < 50 )
		this.ApplyVelocityAndCollisions_New( GSPEED, step_size, apply_friction, impact_scale, custom_filtering_method );
		else
		this.ApplyVelocityAndCollisions_Old( GSPEED, step_size, apply_friction, impact_scale, custom_filtering_method );
	
		if ( sdWorld.is_server )
		{
			
			sdEntity.measure[ sdEntity.chet < 50 ? 1 : 0 ] += Date.now() - t;
		
			if ( Math.random() < 0.001 )
			{
				if ( sdEntity.measure[ 1 ] > sdEntity.measure[ 0 ] )
				trace( Math.round( sdEntity.measure[ 1 ] / sdEntity.measure[ 0 ] * 100 ) - 100 + '% slower', sdEntity.measure );
				else
				trace( -(Math.round( sdEntity.measure[ 1 ] / sdEntity.measure[ 0 ] * 100 ) - 100) + '% FASTER!', sdEntity.measure );
			}

			while ( sdEntity.measure[ sdEntity.chet < 50 ? 1 : 0 ] > 100 )
			{
				sdEntity.measure[ 0 ] *= 0.999;
				sdEntity.measure[ 1 ] *= 0.999;
			}
		}
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
	// Optimized to the point where it is same as old method (sometimes +20% slower on average though), but both methods were optimized by _hard_collision optimization
	ApplyVelocityAndCollisions( GSPEED, step_size=0, apply_friction=false, impact_scale=1, custom_filtering_method=null ) // step_size can be used by entities that can use stairs
	{
		//const debug = ( sdWorld.my_entity === this );
		//const debug = ( this._class === 'sdBullet' && this._rail ) && sdWorld.is_server;
		//const debug = ( this._class === 'sdBullet' ) && sdWorld.is_server;
		//const debug = ( this._class === 'sdSandWorm' ) && sdWorld.is_server;
		//const debug = ( this._class === 'sdBaseShieldingUnit' ) && sdWorld.is_server;
		const debug = false;
		
		if ( !sdBullet )
		sdBullet = sdWorld.entity_classes.sdBullet;
		
		//throw new Error('Fix sword not hitting character in test world 3003');
		
		// TODO: Bullet ricochet randomly does not bounce of walls but disappears instead
		//throw new Error('Bullet ricochet randomly does not bounce off walls but disappears instead');
		
		//if ( debug )
		//debugger;
		
		///////// Some ancient sleep logic ////////////
		{
			this.PhysInitIfNeeded();

			let sx_sign = ( this.sx > 0 );
			let sy_sign = ( this.sy > 0 );

			//let moves = this.IsMovesLogic( sx_sign, sy_sign );
			let moves = ( sx_sign !== this._phys_last_sx || 
						  sy_sign !== this._phys_last_sy || 
						  
							Math.max(
								Math.abs( this.sx ),
								Math.abs( this.sy )
							) > sdWorld.gravity + 0.1 );
						  //!sdWorld.inDist2D_Boolean( this.sx, this.sy, 0, 0, sdWorld.gravity + 0.1 ) );

			if ( !moves )
			if ( this._phys_last_touch )
			{
				if ( this._phys_last_touch._is_being_removed )
				{
					this._phys_last_touch = null;
					moves = true;

					//if ( this.GetClass() === 'sdHover' )
					//console.log( this.GetClass() + ' moves due to this._phys_last_touch being removed' );
				}
				else
				{
					if ( this._phys_last_touch_targetable !== this._phys_last_touch.IsTargetable( null, true ) )
					{

						//if ( this.GetClass() === 'sdHover' )
						//console.log( this.GetClass() + ' moves due to IsTargetable change of this._phys_last_touch' );

						this._phys_last_touch_targetable = this._phys_last_touch.IsTargetable( null, true );
						moves = true;
					}
					else
					if ( !sdWorld.inDist2D_Boolean( this._phys_last_touch_x, this._phys_last_touch_y, this._phys_last_touch.x, this._phys_last_touch.y, sdWorld.gravity + 0.1 ) )
					{
						this._phys_last_touch_x = this._phys_last_touch.x;
						this._phys_last_touch_y = this._phys_last_touch.y;

						//if ( this.GetClass() === 'sdHover' )
						//console.log( this.GetClass() + ' moves due to slight move of this._phys_last_touch' );

						moves = true;
					}
				}
			}

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
				//if ( this._phys_sleep <= 0 )
				//if ( this.GetClass() === 'sdHover' )
				//console.log( this.GetClass() + ' becomes physically active' );

				//if ( this._phys_sleep <= 0 ) Because top entity might enter hibernation while this one moves just slightly to the left/right
				//{
					this.ManageTrackedPhysWakeup();
				//}
				this._phys_sleep = 10;

				this._phys_last_sx = sx_sign;
				this._phys_last_sy = sy_sign;
			}
			else
			{
				if ( this._phys_sleep > 0 )
				{
					if ( this._phys_last_touch ) // Do not sleep mid-air
					{
						this._phys_sleep -= Math.min( 1, GSPEED );

					}
				}
				else
				{
					this.sx = 0;
					this.sy = 0;

					sdWorld.last_hit_entity = this._phys_last_touch;
					return;
				}
			}
		}
		///////////////////////////////////////////////
		
		if ( this.sx === 0 && this.sy === 0 )
		{
			sdWorld.last_hit_entity = this._phys_last_touch;
			//this._phys_last_touch = this._phys_last_touch;
				
			return;
		}
		
		let ignore_entity_classes = this.GetIgnoredEntityClasses();
		
		let ignore_entity_classes_classes = null;
		if ( ignore_entity_classes )
		{
			ignore_entity_classes_classes = new WeakSet();
			for ( let i = 0; i < ignore_entity_classes.length; i++ )
			ignore_entity_classes_classes.add( sdWorld.entity_classes[ ignore_entity_classes[ i ] ] );
		}
			
		let include_only_specific_classes = this.GetNonIgnoredEntityClasses();
		
		let include_only_specific_classes_classes = null;
		if ( include_only_specific_classes )
		{
			include_only_specific_classes_classes = new WeakSet();
			for ( let i = 0; i < include_only_specific_classes.length; i++ )
			include_only_specific_classes_classes.add( sdWorld.entity_classes[ include_only_specific_classes[ i ] ] );
		}
		
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

		sdWorld.last_hit_entity = null;
		this._phys_last_touch = null;

		const is_bg_entity = this.IsBGEntity();

		for ( let iter = 0; iter < 2; iter++ ) // Only 2 iterations of linear movement, enough to allow sliding in box-collisions-world
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
			
			const visited_ent_flag = sdEntity.flag_counter++;
			this._flag = visited_ent_flag;
			
			let min_xy = Infinity;
			
			for ( let c = 0; c < affected_cells.length; c++ )
			{
				const cell = affected_cells[ c ];
				for ( let e = 0; e < cell.length; e++ )
				{
					const arr_i = cell[ e ];

					//if ( !visited_ent.has( arr_i ) )
					if ( !arr_i._is_being_removed )
					if ( arr_i._flag !== visited_ent_flag )
					{
						//visited_ent.add( arr_i );
						arr_i._flag = visited_ent_flag;

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
						if ( arr_i.IsBGEntity() === is_bg_entity )
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
								
								if ( t <= 1 )
								if ( arr_i.IsTargetable( this, true ) ) // So guns are ignored
								{
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
						const x_not_teleported = this.x;
						const y_not_teleported = this.y;

						const old_sx_real = this.sx;
						const old_sy_real = this.sy;

						this.Touches( best_ent );

						if ( best_ent._hard_collision )
						{
							// After touch reaction (teleporting?)
							if ( x_not_teleported !== this.x || y_not_teleported !== this.y )
							{
								return;
							}
							
							let do_unstuck = false;

							if ( best_t_original === 0 )
							if ( do_stuck_check )
							if ( hitbox_x1 < best_ent.x + best_ent._hitbox_x2 )
							if ( hitbox_x2 > best_ent.x + best_ent._hitbox_x1 )
							if ( hitbox_y1 < best_ent.y + best_ent._hitbox_y2 )
							if ( hitbox_y2 > best_ent.y + best_ent._hitbox_y1 )
							{
								// Moving caused stuck effect
								//debugger;
								//this.DamageWithEffect( 10 );
								//best_ent.DamageWithEffect( 10 );
								if ( this.onPhysicallyStuck() )
								{
									do_unstuck = true;
									step_size = 8;
								}
							}

							let on_top = Math.abs( ( this.y + this._hitbox_y2 ) - ( best_ent.y + best_ent._hitbox_y1 ) );
							//const on_top = Math.max( 0, Math.abs( ( this.y + this._hitbox_y2 ) - ( best_ent.y + best_ent._hitbox_y1 ) ) - step_size );

							const under = Math.abs( ( this.y + this._hitbox_y1 ) - ( best_ent.y + best_ent._hitbox_y2 ) );
							const on_left = Math.abs( ( this.x + this._hitbox_x2 ) - ( best_ent.x + best_ent._hitbox_x1 ) );
							const on_right = Math.abs( ( this.x + this._hitbox_x1 ) - ( best_ent.x + best_ent._hitbox_x2 ) );

							if ( step_size > 0 )
							{
							    if ( this.CanMoveWithoutOverlap( this.x, best_ent.y + best_ent._hitbox_y1 - this._hitbox_y2 - 0.001, -0.0005 ) ) // Prevent standing on vertical walls
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

							const self_effect_scale = 
									( hard_collision && best_ent._hard_collision ) ?
										best_ent.mass / ( best_ent.mass + this.mass ) :
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

							switch ( smallest )
							{
								case on_top:
								{
									//this.sy = ( this.mass - best_ent.mass ) * old_sy;
									this.sy = - old_sy * bounce_intensity;

									if ( typeof best_ent.sy !== 'undefined' )
									best_ent.sy = Math.max( best_ent.sy, best_ent.sy + old_sy * ( 1 - self_effect_scale ) );
									//best_ent.sy += old_sy * ( 1 - self_effect_scale );

									if ( step_size > 0 )
									if ( do_stuck_check && best_ent._hard_collision )
									{
										const y_risen = best_ent.y + best_ent._hitbox_y1 - this._hitbox_y2;

										if ( this.CanMoveWithoutOverlap( this.x, y_risen, 0.001 ) )
										this.y = y_risen;
									}
								}
								break;
								case under:
								{
									this.sy = old_sy * bounce_intensity;

									//if ( hard_collision && best_ent._hard_collision )
									//this.y = best_ent.y + best_ent._hitbox_y2 - this._hitbox_y1;

									if ( typeof best_ent.sy !== 'undefined' )
									best_ent.sy = Math.min( best_ent.sy, best_ent.sy - old_sy * ( 1 - self_effect_scale ) );
									//best_ent.sy -= old_sy * ( 1 - self_effect_scale );
								
									if ( do_unstuck )
									if ( do_stuck_check && best_ent._hard_collision )
									{
										const y_risen = best_ent.y + best_ent._hitbox_y2 - this._hitbox_y1;

										if ( this.CanMoveWithoutOverlap( this.x, y_risen, 0.001 ) )
										this.y = y_risen;
									}
								}	
								break;
								case on_left:
								{
									if ( debug )
										trace('on left', [ on_top, under, on_left, on_right ], smallest );
									
									this.sx = - old_sx * bounce_intensity;

									//if ( hard_collision && best_ent._hard_collision )
									//this.x = best_ent.x + best_ent._hitbox_x1 - this._hitbox_x2;

									if ( typeof best_ent.sx !== 'undefined' )
									best_ent.sx = Math.max( best_ent.sx, best_ent.sx + old_sx * ( 1 - self_effect_scale ) );
									//best_ent.sx += old_sx * ( 1 - self_effect_scale );
								
									if ( do_unstuck )
									if ( do_stuck_check && best_ent._hard_collision )
									{
										const x_risen = best_ent.x + best_ent._hitbox_x1 - this._hitbox_x2;

										if ( this.CanMoveWithoutOverlap( x_risen, this.y, 0.001 ) )
										this.x = x_risen;
									}
								}
								break;
								case on_right:
								{
									if ( debug )
										trace('on right', [ on_top, under, on_left, on_right ], smallest );
									
									this.sx = old_sx * bounce_intensity;

									//if ( hard_collision && best_ent._hard_collision )
									//this.x = best_ent.x + best_ent._hitbox_x2 - this._hitbox_x1;

									if ( typeof best_ent.sx !== 'undefined' )
									best_ent.sx = Math.min( best_ent.sx, best_ent.sx - old_sx * ( 1 - self_effect_scale ) );
									//best_ent.sx -= old_sx * ( 1 - self_effect_scale );
								
									if ( do_unstuck )
									if ( do_stuck_check && best_ent._hard_collision )
									{
										const x_risen = best_ent.x + best_ent._hitbox_x2 - this._hitbox_x1;

										if ( this.CanMoveWithoutOverlap( x_risen, this.y, 0.001 ) )
										this.x = x_risen;
									}
								}
								break;
							}

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
										//if ( best_ent._hard_collision )
										this.ImpactWithDamageEffect( impact * self_effect_scale );

										//if ( hard_collision )
										best_ent.ImpactWithDamageEffect( impact * ( 1 - self_effect_scale ) );
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
										//if ( best_ent._hard_collision )
										this.ImpactWithDamageEffect( impact * self_effect_scale );

										//if ( hard_collision )
										best_ent.ImpactWithDamageEffect( impact * ( 1 - self_effect_scale ) );
									}
								}
							}
							
							// After impact (character rescued via RTP?)
							if ( x_not_teleported !== this.x || y_not_teleported !== this.y )
							{
								return;
							}

							if ( this._is_being_removed )
							return;
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

								if ( this.CanMoveWithoutOverlap( x_risen, this.y, 0.001 ) )
								this.x = x_risen;
							}
							if ( hitbox_x2 > sdWorld.world_bounds.x2 )
							{
								const x_risen = sdWorld.world_bounds.x2 - this._hitbox_x2;

								if ( this.CanMoveWithoutOverlap( x_risen, this.y, 0.001 ) )
								this.x = x_risen;
							}
							if ( hitbox_y1 < sdWorld.world_bounds.y1 )
							{
								const y_risen = sdWorld.world_bounds.y1 - this._hitbox_y1;

								if ( this.CanMoveWithoutOverlap( this.x, y_risen, 0.001 ) )
								this.y = y_risen;
							}
							if ( hitbox_y2 > sdWorld.world_bounds.y2 )
							if ( this.onPhysicallyStuck() )
							{
								const y_risen = sdWorld.world_bounds.y2 - this._hitbox_y2;

								if ( this.CanMoveWithoutOverlap( this.x, y_risen, 0.001 ) )
								this.y = y_risen;
							}
						}
					}

					// Keep first collision
					if ( !this._phys_last_touch )
					{
						sdWorld.last_hit_entity = best_ent;
						this._phys_last_touch = best_ent;
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
	/*ApplyVelocityAndCollisions_Old( GSPEED, step_size=0, apply_friction=false, impact_scale=1, custom_filtering_method=null ) // step_size can be used by entities that can use stairs
	{
		this.PhysInitIfNeeded();
		
		let sx_sign = ( this.sx > 0 );
		let sy_sign = ( this.sy > 0 );
		
		let moves = this.IsMovesLogic( sx_sign, sy_sign );
		
		if ( !moves )
		if ( this._phys_last_touch )
		{
			if ( this._phys_last_touch._is_being_removed )
			{
				this._phys_last_touch = null;
				moves = true;

				//if ( this.GetClass() === 'sdHover' )
				//console.log( this.GetClass() + ' moves due to this._phys_last_touch being removed' );
			}
			else
			{
				if ( this._phys_last_touch_targetable !== this._phys_last_touch.IsTargetable( null, true ) )
				{
					
					//if ( this.GetClass() === 'sdHover' )
					//console.log( this.GetClass() + ' moves due to IsTargetable change of this._phys_last_touch' );
				
					this._phys_last_touch_targetable = this._phys_last_touch.IsTargetable( null, true );
					moves = true;
				}
				else
				if ( !sdWorld.inDist2D_Boolean( this._phys_last_touch_x, this._phys_last_touch_y, this._phys_last_touch.x, this._phys_last_touch.y, sdWorld.gravity + 0.1 ) )
				{
					this._phys_last_touch_x = this._phys_last_touch.x;
					this._phys_last_touch_y = this._phys_last_touch.y;
							
					//if ( this.GetClass() === 'sdHover' )
					//console.log( this.GetClass() + ' moves due to slight move of this._phys_last_touch' );
		
					moves = true;
				}
			}
		}
	
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
			//if ( this._phys_sleep <= 0 )
			//if ( this.GetClass() === 'sdHover' )
			//console.log( this.GetClass() + ' becomes physically active' );

			//if ( this._phys_sleep <= 0 ) Because top entity might enter hibernation while this one moves just slightly to the left/right
			//{
				this.ManageTrackedPhysWakeup();
			//}
			this._phys_sleep = 10;

			this._phys_last_sx = sx_sign;
			this._phys_last_sy = sy_sign;
		}
		else
		{
			if ( this._phys_sleep > 0 )
			{
				if ( this._phys_last_touch ) // Do not sleep mid-air
				{
					this._phys_sleep -= Math.min( 1, GSPEED );

				}
			}
			else
			{
				this.sx = 0;
				this.sy = 0;

				sdWorld.last_hit_entity = this._phys_last_touch;
				return;
			}
		}
		
		let CheckPointDamageAllowed_result = undefined;
		
		const CheckPointDamageAllowed = ()=>
		{
			//if ( this.GetClass() === 'sdHover' )
			//if ( Math.abs( this.sx ) > 5 || Math.abs( this.sy ) > 5 )
			//debugger;
			
			if ( CheckPointDamageAllowed_result === undefined )
			CheckPointDamageAllowed_result = sdWorld.entity_classes.sdArea.CheckPointDamageAllowed( this.x, this.y );
			
			return CheckPointDamageAllowed_result;
		};
		
		let new_x = this.x + this.sx * GSPEED;
		let new_y = this.y + this.sy * GSPEED;
		
		//let safe_overlap = step_size === 0 ? 0 : ( sdWorld.is_server ? 0 : 0.01 ); // Only for players (other entities have no anti-shake measures)

		let safe_overlap = ( this.UseServerCollisions() ? 0 : 0.01 );
		
		//if ( !sdWorld.is_server )
		//safe_overlap += 1;

		if ( this.CanMoveWithoutOverlap( new_x, new_y, safe_overlap, custom_filtering_method ) )
		{
			this.x = new_x;
			this.y = new_y;
			
			this._phys_last_touch = null;
		}
		else
		{
			let old_x = this.x;
			let old_y = this.y;
			
			this.Touches( sdWorld.last_hit_entity );
			
			// Moved as result of touch event - abort any further position/velocity changes
			if ( this.x !== old_x || this.y !== old_y )
			return;
			
			// Better for sync (but causes random friction)
			//new_x = Math.round( new_x );
			//new_y = Math.round( new_y );
			
			let bounce_intensity = this.bounce_intensity;
			let friction_remain = this.friction_remain;
			
			let last_touch = null;
			
			if ( step_size > 0 )
			{
				last_touch = sdWorld.last_hit_entity;
				
				for ( let i = 1; i <= step_size; i++ )
				{
				    sdWorld.last_hit_entity = null;
					
					if ( last_touch && 
						 Math.abs( last_touch.y + last_touch._hitbox_y1 - this._hitbox_y2 - this.y ) <= step_size && 
						 this.CanMoveWithoutOverlap( new_x, last_touch.y + last_touch._hitbox_y1 - this._hitbox_y2 - 0.0001, 0, custom_filtering_method ) )
					{
						// Shake-less version
						this.y = last_touch.y + last_touch._hitbox_y1 - this._hitbox_y2 - 0.0001;
						
						break;
					}
					else
					if ( this.CanMoveWithoutOverlap( new_x, new_y - i, 0, custom_filtering_method ) )
					{
						this.y = new_y - i;
						
						break;
					}
					else
					if ( last_touch !== sdWorld.last_hit_entity )
					if ( sdWorld.last_hit_entity )
					{
						last_touch = sdWorld.last_hit_entity;
						this.Touches( sdWorld.last_hit_entity );
					}
				}
			}
			

			if ( this.CanMoveWithoutOverlap( new_x, this.y, safe_overlap, custom_filtering_method ) )
			{
				const last_hit_entity = sdWorld.last_hit_entity;
				
				this.Touches( sdWorld.last_hit_entity );
			
				let self_effect_scale = 1;
				
				let old_sy = Math.abs( this.sy );
			
				this.sy = - this.sy * bounce_intensity;
				this.x = new_x;
				
				if ( apply_friction )
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, friction_remain, GSPEED );
				
				if ( last_hit_entity )
				if ( this.hard_collision )
				{
					self_effect_scale = last_hit_entity.mass / ( last_hit_entity.mass + this.mass );
					
					if ( typeof last_hit_entity.sy !== 'undefined' )
					{
						last_hit_entity.sy += old_sy * ( 1 - self_effect_scale );
						//last_hit_entity.Impulse( 0, this.sy ); Impulse is reworked and needs some kind of hint that Impulse is not server-side only, so velocity change isn't doubled on client-side
					}
					if ( CheckPointDamageAllowed() )
					last_hit_entity.Impact( Math.abs( old_sy ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
				if ( CheckPointDamageAllowed() )
				this.Impact( Math.abs( old_sy ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
			}
			else
			if ( this.CanMoveWithoutOverlap( this.x, new_y, safe_overlap, custom_filtering_method ) )
			{
				const last_hit_entity = sdWorld.last_hit_entity;
				
				this.Touches( sdWorld.last_hit_entity );
				
				let self_effect_scale = 1;
				
				let old_sx = this.sx;
			
				this.sx = - this.sx * bounce_intensity;
				this.y = new_y;
				
				if ( apply_friction )
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, friction_remain, GSPEED );
				
				if ( last_hit_entity )
				if ( this.hard_collision )
				{
					self_effect_scale = last_hit_entity.mass / ( last_hit_entity.mass + this.mass );
					
					if ( typeof last_hit_entity.sx !== 'undefined' )
					{
						last_hit_entity.sx += old_sx * ( 1 - self_effect_scale );
						//last_hit_entity.Impulse( this.sx, 0 ); Impulse is reworked and needs some kind of hint that Impulse is not server-side only, so velocity change isn't doubled on client-side
					}
					
					if ( CheckPointDamageAllowed() )
					last_hit_entity.Impact( Math.abs( old_sx ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
				if ( CheckPointDamageAllowed() )
				this.Impact( Math.abs( old_sx ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
			}
			else
			{
				const last_hit_entity = sdWorld.last_hit_entity;
				
				this.Touches( sdWorld.last_hit_entity );
				
				let self_effect_scale = 1;
				
				let old_sx = this.sx;
				let old_sy = this.sy;
			
				this.sx = - this.sx * bounce_intensity;
				this.sy = - this.sy * bounce_intensity;
				
				this.onPhysicallyStuck();
				
				if ( last_hit_entity )
				if ( this.hard_collision )
				{
					self_effect_scale = last_hit_entity.mass / ( last_hit_entity.mass + this.mass );
					
					if ( typeof last_hit_entity.sx !== 'undefined' )
					last_hit_entity.sx += old_sx * ( 1 - self_effect_scale );
				
					if ( typeof last_hit_entity.sy !== 'undefined' )
					last_hit_entity.sy += old_sy * ( 1 - self_effect_scale );
				
					if ( CheckPointDamageAllowed() )
					last_hit_entity.Impact( sdWorld.Dist2D_Vector( old_sx, old_sy ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
			
				if ( CheckPointDamageAllowed() )
				this.Impact( sdWorld.Dist2D_Vector( old_sx, old_sy ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
			}

			this._phys_last_touch = sdWorld.last_hit_entity || last_touch;
		}
		
	}*/
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
	IsBGEntity() // 0 for in-game entities, 1 for background entities, 2 is for moderator areas, 3 is for cables, 4 for task in-world interfaces, 5 for wandering around background entities, 6 for status effects, 7 for player-defined regions. Should handle collisions separately
	{ return 0; }
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
	
	GetHitDamageMultiplier( x, y ) // Multiplier for damage
	{
		return 1;
	}
	GetBleedEffect()
	{
		return 1; // sdEffect.TYPE_WALL_HIT; unavailable due to early init
	}
	GetBleedEffectHue()
	{
		return 0;
	}
	GetBleedEffectFilter()
	{
		return '';
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
	
	DoesOverlapWith( ent, extra_space_around=0 )
	{
		if ( this.x + this._hitbox_x2 < ent.x + ent._hitbox_x1 - extra_space_around ||
			 this.x + this._hitbox_x1 > ent.x + ent._hitbox_x2 + extra_space_around ||
			 this.y + this._hitbox_y2 < ent.y + ent._hitbox_y1 - extra_space_around ||
			 this.y + this._hitbox_y1 > ent.y + ent._hitbox_y2 + extra_space_around )
		return false;
	
		return true;
		/*
		if ( this.x + this._hitbox_x1 < ent.x + ent._hitbox_x2 )
		if ( this.x + this._hitbox_x2 > ent.x + ent._hitbox_x1 )
		if ( this.y + this._hitbox_y1 < ent.y + ent._hitbox_y2 )
		if ( this.y + this._hitbox_y2 > ent.y + ent._hitbox_y1 )
		return true;
		
		return false;
		*/
	}
	
	UpdateHitboxInitial() // Because there is no post-structors in JS, and implementing them normally would not be easy at this point...
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
			this._hitbox_last_update = sdWorld.time;
			
			if ( sdWorld.is_server )
			{
				// More liteweight approach. On server-side it is important to update hash position manually when hitbox offsets changes
				this._hitbox_x1 = this.hitbox_x1;
				this._hitbox_y1 = this.hitbox_y1;
				this._hitbox_x2 = this.hitbox_x2;
				this._hitbox_y2 = this.hitbox_y2;

				this._hard_collision = this.hard_collision;
			}
			else
			{
				// It is done to make amplifier shields update hashes without extra info from server
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
	
	constructor( params )
	{
		//if ( !sdWorld.mobile )
		//this._stack_trace = globalThis.getStackTrace();
		
		if ( this.PreInit !== sdEntity.prototype.PreInit )
		this.PreInit();
		
		this._class = this.constructor.name;
		
		this._class_id = this.__proto__.constructor.class_id;
		
		this._flag = 0; // Used to mark entities as visited/added/mentioned just so WeakSet is not needed. Compare it to sdEntity.flag_counter++
		//debugger;
		
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
		
		if ( this.is_static )
		this._update_version = 0;
		
		let is_global_entity = this.IsGlobalEntity();
		
		//this._hash_position = null;
		this._affected_hash_arrays = []; // Every time entity moves - these are ones where entity will be excluded, and then new hash array group will be set. Will be tiny for small objects and can get quite large for larger entities.
		
		if ( !is_global_entity )
		sdWorld.UpdateHashPosition( this, true );
		
		this._is_being_removed = false;
		this._broken = false; // Becomes true for statics (anything now) whenever they are really broken rather than just cut out by visibility. After removal you can set it to false to prevent particles spawned on client
		
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
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		this._snapshot_cache_frame = -1;
		this._snapshot_cache = null;
		
		//this._is_real = ( typeof params.is_real !== 'undefined' ) ? params.is_real : true; // Build tools spawns entities with ._is_real === false (this is not handled on client-side since damage generally can't be dealt on client-side anyway), it will prevent them from reacting to impact (sdBlock for example would be able to kill spawner sdCharacter and cause gun to throw an error without this)
		
		if ( this.IsGlobalEntity() )
		sdEntity.global_entities.push( this );
	
		//if ( sdWorld.is_server )
		
		// Premade all needed variables so sealing would work best
		{
			if ( this.onThink.has_ApplyVelocityAndCollisions === undefined )
			{
				let onThinkString = this.onThink.toString();
				let DrawString = this.Draw.toString();
				
				this.onThink.has_ApplyVelocityAndCollisions = ( onThinkString.indexOf( 'ApplyVelocityAndCollisions' ) !== -1 );
				
				this.onThink.has_GetAnythingNearCache = ( onThinkString.indexOf( 'MatterGlow' ) !== -1 || onThinkString.indexOf( 'GetAnythingNearCache' ) !== -1 );
				
				this.onThink.has_GetComWiredCache = ( onThinkString.indexOf( 'GetComWiredCache' ) !== -1 || DrawString.indexOf( 'GetComWiredCache' ) !== -1 );
				
				this.onThink.has_sdBlock_extras = false;
				
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
			
			if ( this.onThink.has_sdBlock_extras )
			{
				this._vis_block_left = null;
				this._vis_block_right = null;
				this._vis_block_top = null;
				this._vis_block_bottom = null;
				//this._vis_back = ;
			}
		
			sdEntity.to_seal_list.push( this );
		}
	}
	
	VehicleHidesDrivers()
	{
		return true;
	}

	
	FindObjectsInACableNetwork( accept_test_method=null, alternate_class_to_search=sdWorld.entity_classes.sdBaseShieldingUnit ) // No cache, so far
	{
		const sdCable = sdWorld.entity_classes.sdCable;
		const SearchedClass = alternate_class_to_search;
		
		let ret = [];

		let worked_out_ents = [];
		let active_ents = [ this ];
		while ( active_ents.length > 0 )
		{
			let connected_ents = sdCable.GetConnectedEntities( active_ents[ 0 ], sdCable.TYPE_ANY );

			worked_out_ents.push( active_ents[ 0 ] );
			active_ents.shift();

			for ( let i = 0; i < connected_ents.length; i++ )
			{
				if ( worked_out_ents.indexOf( connected_ents[ i ] ) === -1 )
				{
					if ( accept_test_method )
					{
						if ( accept_test_method( connected_ents[ i ] ) )
						{
							//return connected_ents[ i ];
							ret.push( connected_ents[ i ] );
						}
					}
					else
					if ( connected_ents[ i ].is( SearchedClass ) )
					{
						ret.push( connected_ents[ i ] );
					}

					if ( active_ents.indexOf( connected_ents[ i ] ) === -1 )
					active_ents.push( connected_ents[ i ] );
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
			
			let worked_out_ents = [];
			let active_ents = [ this ];
			while ( active_ents.length > 0 )
			{
				let connected_ents = sdCable.GetConnectedEntities( active_ents[ 0 ], sdCable.TYPE_ANY );

				worked_out_ents.push( active_ents[ 0 ] );
				active_ents.shift();

				for ( let i = 0; i < connected_ents.length; i++ )
				{
					if ( worked_out_ents.indexOf( connected_ents[ i ] ) === -1 )
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
	
	GetAnythingNearCache( _x, _y, range, append_to=null, specific_classes=null )
	{
		if ( append_to !== null || specific_classes !== null )
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
			this._next_anything_near_rethink = next_anything_near_rethink = sdWorld.time + 200 + Math.random() * 32;
			
			anything_near = this._anything_near = sdWorld.GetAnythingNear( _x, _y, range, append_to, specific_classes );
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

			sdWorld.shuffleArray( anything_near );
		}
		
		return anything_near;
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
						if ( this.IsGlobalEntity() )
						debugger;
					}
					
					if ( this._hiberstate === sdEntity.HIBERSTATE_ACTIVE )
					{
						
						//if (  v === sdEntity.HIBERSTATE_REMOVED )
						//if ( this.GetClass() === 'sdBlock' )
						//	debugger;
						
						let id = sdEntity.active_entities.indexOf( this );
						if ( id === -1 )
						debugger;
						sdEntity.active_entities.splice( id, 1 );
					}
					
					if ( v === sdEntity.HIBERSTATE_HIBERNATED )
					{
						if ( this._phys_last_touch )
						sdEntity.TrackPhysWakeup( this._phys_last_touch, this );
					}
					
					this._hiberstate = v;
				}
				else
				if ( v === sdEntity.HIBERSTATE_ACTIVE )
				{
					if ( this.IsGlobalEntity() )
					{
						debugger;
					}
					
					this._hiberstate = v;
					sdEntity.active_entities.push( this );
					
					/*if ( sdEntity.active_entities.length > 172000 )
					{
						debugger;
					}*/
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
	
	
	IsVisible( observer_entity ) // Can be used to hide guns that are held, they will not be synced this way
	{
		return true;
	}
	GetSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null )
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
					returned_object = {
						_net_id: this._net_id,
						_class: this.GetClass()
					};
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
					if ( prop.charAt( 0 ) !== '_' || 
						 ( save_as_much_as_possible && prop !== '_snapshot_cache_frame' && prop !== '_snapshot_cache' && prop !== '_hiberstate' && prop !== '_last_x' && prop !== '_last_y' && ( typeof this[ prop ] === 'number' || typeof this[ prop ] === 'string' || this[ prop ] === null || typeof this[ prop ] === 'boolean' || this.ExtraSerialzableFieldTest( prop ) ) ) )
					{
						/*if ( prop === '_listeners' )
						{
							throw new Error('How? Bad.');
						}
						*/
						props.push( prop );
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
				let kinds = sdEntity.properties_by_class_public.get( this.__proto__.constructor );
				
				if ( kinds === undefined )
				{
					kinds = [];
					sdEntity.properties_by_class_public.set( this.__proto__.constructor, kinds );
				}
				
				let current_kind = this.material || this.type || this.kind || this.class || 0;
				
				props = kinds[ current_kind ];
				
				if ( props === undefined )
				{
					props = [];
					
					for ( let prop in this )
					if ( prop.charAt( 0 ) !== '_' )
					props.push( prop );
			
					kinds[ current_kind ] = props;
				}
				
				/*props = sdEntity.properties_by_class_public.get( this.__proto__.constructor );
				
				if ( props === undefined )
				{
					props = [];
					
					for ( var prop in this )
					if ( prop.charAt( 0 ) !== '_' )
					props.push( prop );
					
					sdEntity.properties_by_class_public.set( this.__proto__.constructor, props );
				}*/
			}
			
			//for ( var prop in this )
			for ( let i = 0; i < props.length; i++ )
			{
				let prop = props[ i ];
				
				//if ( prop.charAt( 0 ) !== '_' || 
				//	 ( save_as_much_as_possible && prop !== '_snapshot_cache_frame' && prop !== '_snapshot_cache' && prop !== '_hiberstate' && prop !== '_last_x' && prop !== '_last_y' && ( typeof this[ prop ] === 'number' || typeof this[ prop ] === 'string' || typeof this[ prop ] === 'boolean' /*|| ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' && typeof this[ prop ]._class !== 'undefined' )*/ || this.ExtraSerialzableFieldTest( prop ) ) ) )
				{
					let v = this[ prop ];
					
					//if ( this[ prop ] !== null )
					if ( v !== null )
					{
						/*if ( typeof this[ prop ] === 'object' )
						if ( prop !== 'sd_filter' )
							debugger;*/
						
						//if ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' && typeof this[ prop ].constructor !== 'undefined' ) Last condition never happens
						if ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' /*&& typeof this[ prop ]._class !== 'undefined'*/ )
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
					
					if ( !save_as_much_as_possible && typeof v === 'number' ) // Do not do number rounding if world is being saved
					{
						if ( prop === 'sx' || prop === 'sy' || prop === 'scale' )
						returned_object[ prop ] = Math.round( v * 100 ) / 100;
						else
						returned_object[ prop ] = Math.round( v );
					}
					else
					returned_object[ prop ] = v;
				}
			}
		}
		else
		{
			returned_object = this._snapshot_cache;
		}
		
		//if ( this.GetClass() === 'sdBullet' )
		//console.log( JSON.stringify( returned_object ) );
		
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
		
		//if ( snapshot._net_id !== this._net_id ) Will happen in case of copying
		//debugger;
		if ( snapshot._class !== this.GetClass() )
		if ( snapshot._class !== 'auto' )
		debugger;
	
		//let my_entity_protected_vars = null;
			
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
						
						//if ( typeof this[ prop ] !== 'undefined' ) // Disallow creation of new properties
						if ( this.hasOwnProperty( prop ) )
						this[ prop ] = snapshot[ prop ];
						else
						{
							trace('[1]Rejecting creaton of ',prop,'on',this.GetClass(),'(probably an old version property)');
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
								trace('[2]Rejecting creaton of ',prop,'on',this.GetClass(),'(probably an old version property)');
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
			if ( typeof snapshot._hiberstate !== 'undefined' )
			this.SetHiberState( snapshot._hiberstate );
		
			// Guns still use old pointer method
			if ( this.GetClass() === 'sdGun' )
			if ( this.held_by_class !== 'sdCharacter' ) // Old gun code handles it
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
			debugger; // Should not happen
			return null;
		}
	
		if ( possible_ent._net_id !== _net_id )
		{
			debugger; // Should not happen
			return null;
		}
		
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
			//console.log( 'Known entity classes: ', sdWorld.entity_classes );
			throw new Error( 'Unknown entity class "'+snapshot._class+'". Download or it is missing?' );
		}
		
		let params = { x:snapshot.x, y:snapshot.y, _net_id:snapshot._net_id };
		
		// Some entities like crystal crabs have separate set of properties
		
		if ( typeof snapshot.class !== 'undefined' )
		params.class = snapshot.class;
		
		if ( typeof snapshot.type !== 'undefined' )
		params.type = snapshot.type;
		
		if ( typeof snapshot.mission !== 'undefined' )
		params.mission = snapshot.mission;
		
		//var ret = new sdWorld.entity_classes[ snapshot._class ]({ x:snapshot.x, y:snapshot.y });
		var ret = new sdWorld.entity_classes[ snapshot._class ]( params );
		//ret._net_id = snapshot._net_id;
		//sdEntity.entities_by_net_id_cache[ ret._net_id ] = ret; // Same for client, done here rather than during object creation
		
		ret.ApplySnapshot( snapshot );
		
		ret.onSnapshotApplied();
		
		ret.UpdateHitbox();
		
		sdEntity.entities.push( ret );
		//sdWorld.UpdateHashPosition( ret, false ); // Will prevent sdBlock from occasionally not having collisions on client-side (it will rest in hibernated state, probably because of that. It is kind of a bug though)
	
		return ret;
	}	
	onSnapshotApplied() // To override
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
				return sdWorld.entity_classes.sdGun.classes[ e.class ].title;
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
			if ( ( typeof connected_ents[ i ].matter !== 'undefined' || typeof connected_ents[ i ]._matter !== 'undefined' ) && !connected_ents[ i ]._is_being_removed ) // Can appear as being removed as well...
			connected_ents[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return false;
	}
	MatterGlow( how_much=0.01, radius=30, GSPEED ) // Set radius to 0 to only glow into cables. Make sure to call WakeUpMatterSources when matter drops or else some mid-way nodes might end up not being awaken
	{
		if ( !sdWorld.is_server )
		return;
		
		let this_matter = ( this.matter || this._matter || 0 );
		
		if ( this_matter > 0.05 )
		{
			if ( !sdCable )
			sdCable = sdWorld.entity_classes.sdCable;
		
			let i;
			
			let visited_ents = new Set();
			visited_ents.add( this );
			
			let array_is_not_cloned = true;
			
			let connected_ents = sdCable.GetConnectedEntities( this, sdCable.TYPE_MATTER );
			for ( i = 0; i < connected_ents.length; i++ )
			{
				if ( ( typeof connected_ents[ i ].matter !== 'undefined' || typeof connected_ents[ i ]._matter !== 'undefined' ) && !connected_ents[ i ]._is_being_removed ) // Can appear as being removed as well...
				{
					this.TransferMatter( connected_ents[ i ], how_much, GSPEED * 4 ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity
					
					visited_ents.add( connected_ents[ i ] );
							
					if ( connected_ents[ i ].PrioritizeGivingMatterAway() )
					{
						if ( array_is_not_cloned )
						{
							array_is_not_cloned = false;
							connected_ents = connected_ents.slice(); // Clone
						}
						
						let recursively_connected = sdCable.GetConnectedEntities( connected_ents[ i ], sdCable.TYPE_MATTER );
						
						if ( recursively_connected )
						for ( let i2 = 0; i2 < recursively_connected.length; i2++ )
						if ( !visited_ents.has( recursively_connected[ i2 ] ) )
						{
							visited_ents.add( recursively_connected[ i2 ] );
							
							connected_ents.push( recursively_connected[ i2 ] );
						}
					}
				}
			}
			visited_ents = null;
			
			if ( radius > 0 )
			if ( this_matter > 0.05 )
			{
				//var arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null, ( e )=>!e.is( sdWorld.entity_classes.sdBG ) );
				let arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null );

				for ( i = 0; i < arr.length; i++ )
				{
					if ( ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' ) && arr[ i ] !== this && !arr[ i ]._is_being_removed )
					{
						this.TransferMatter( arr[ i ], how_much, GSPEED * 4 ); // Mult by X because targets no longer take 4 cells
					}
					else
					{
						// Remove these that do not match anyway, at least for brief period of time until GetAnythingNearCache overrides this list - less time to spend on property existence checks
						arr.splice( i, 1 );
						i--;
					}
				}
			}
			
			this.WakeUpMatterSources( connected_ents );
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
			var arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null );

			for ( var i = 0; i < arr.length; i++ )
			{
				if ( ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' ) && arr[ i ] !== this && !arr[ i ]._is_being_removed )
				{
					if ( sdWorld.is_server )
					{
						arr[ i ].TransferMatter( this, how_much, GSPEED * 4, true ); // Mult by X because targets no longer take 4 cells
						arr[ i ].WakeUpMatterSources();
					}
					else
					{
						if ( arr[ i ] === sdWorld.my_entity )
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
	TransferMatter( to, how_much, GSPEED, optimize=false )
	{
		let this_matter = ( this.matter || this._matter || 0 );
		
		if ( optimize )
		{
			if ( this_matter < 0.05 )
			return;
		}
		
		let to_matter = ( to.matter || to._matter || 0 );
		let to_matter_max = ( to.matter_max || to._matter_max || 0 );
		
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
		return;
	
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
		
		// Update update versions for static entities if matter property is public
		
		if ( typeof this.matter !== 'undefined' )
		if ( typeof this._update_version !== 'undefined' )
		this._update_version++;
	
		if ( typeof to.matter !== 'undefined' )
		if ( typeof to._update_version !== 'undefined' )
		to._update_version++;

		if ( to.onMatterChanged !== sdEntity.prototype.onMatterChanged )
		to.onMatterChanged( this );
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
	}
	/*Think( GSPEED )
	{
		this.onThink( GSPEED );

		return this._is_being_removed;
	}*/
	onBeforeRemove() // Right when .remove() is called for the first time
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

			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			this._is_being_removed = true;

			this._broken = true; // By default, you can override it after removal was called for entity // Copy [ 1 / 2 ]
		}
	}
	_remove()
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
		
		this.SetHiberState( sdEntity.HIBERSTATE_REMOVED );
		
		sdWorld.UpdateHashPosition( this, false );
		
		// Some more memory leak preventing cleanup logic
		{
			if ( typeof this._anything_near !== 'undefined' )
			this._anything_near = null;

			if ( typeof this._com_near_cache !== 'undefined' )
			this._com_near_cache = null;

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
		
		if ( this.IsGlobalEntity() )
		{
			let i = sdEntity.global_entities.indexOf( this );
			if ( i === -1 )
			{
				debugger;
			}
			else
			sdEntity.global_entities.splice( i, 1 );
		}
		
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
					sdEntity.removed_entities_info.set( this._net_id, { entity: this, ttl: sdWorld.time + 10000 } );
					//trace( 'deleting ' + this.GetClass() );
				}
			}
		}
	}
	isWaterDamageResistant()
	{
		return false;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
	}
	onThinkFrozen( GSPEED )
	{
		if ( this.onThink.has_ApplyVelocityAndCollisions ) // Likely is capable of falling
		{
			this.sy += sdWorld.gravity * GSPEED;
			
			this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1 ); // Extra fragility is buggy
		}
			
		if ( this._ragdoll )
		this._ragdoll.Think( GSPEED * 0.01 );
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
			debugger;
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
			if ( !sdStatusEffect )
			sdStatusEffect = sdWorld.entity_classes.sdStatusEffect;
		
			let hp_old = Math.max( 0, this.hea || this._hea || 0 );

			this.Damage( dmg, initiator, headshot, affects_armor );

			dmg = hp_old - Math.max( 0, this.hea || this._hea || 0 );
			if ( dmg !== 0 )
			this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_DAMAGED, by: initiator, dmg: dmg });
		}
		else
		{
			this.Damage( dmg, initiator, headshot, affects_armor );
		}
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
	Draw( ctx, attached )
	{
	}
	static Tooltip( ctx, t, x=0, y=0, color='#ffffff' )
	{
		ctx.font = "5.5px Verdana";
		ctx.textAlign = 'center';
		ctx.fillStyle = '#000000';
		ctx.fillText(t, 0 + x, -24.5 + y ); 
		ctx.fillStyle = color;
		ctx.fillText(t, 0 + x, -25 + y ); 
	}
	DrawHealthBar( ctx, color=undefined, y_raise=20 ) // Not called automatically, needs .hea and .hmax as public properties
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
	AddContextOption( title, command_name, parameters_array ) // Do not override
	{
		sdContextMenu.options.push({ title: title,
			action: ()=>
			{
				globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.GetClass(), this._net_id, command_name, parameters_array ] );
			}
		});
	}
	AddPromptContextOption( title, command_name, parameters_array, hint, default_text, max_characters=100 ) // Do not override. Sets entered text to parameters_array[ 0 ]
	{
		sdContextMenu.options.push({ title: title,
			action: ()=>
			{
				sdChat.StartPrompt( hint, default_text, ( v )=>
				{
					parameters_array[ 0 ] = v;
					globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.GetClass(), this._net_id, command_name, parameters_array ] );
				});
			}
		});
	}
	AddClientSideActionContextOption( title, action )
	{
		sdContextMenu.options.push({ title: title,
			action: action
		});
	}
}
//sdEntity.init_class();

//module.exports = sdEntity;
//module.exports.sdEntity = sdEntity;

//exports.sdEntity = sdEntity;
export default sdEntity;

//module.exports = sdEntity;