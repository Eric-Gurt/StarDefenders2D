


import sdWorld from '../sdWorld.js';
//import sdSound from '../sdSound.js';
//import sdEffect from './sdEffect.js';


//var entity_net_ids = 0;

let sdCable = null;
let sdCom = null;
			
class sdEntity
{
	static init_class()
	{
		console.log('sdEntity class initiated');
		sdEntity.entities = [];
		sdEntity.global_entities = []; // sdWeather. This array contains extra copies of entities that exist in primary array, which is sdEntity.entities. Entities add themselves here and remove themselves whenever proper disposer like _remove is called.
		
		sdEntity.active_entities = [];
		
		sdEntity.HIBERSTATE_ACTIVE = 0;
		sdEntity.HIBERSTATE_HIBERNATED = 1;
		sdEntity.HIBERSTATE_REMOVED = 2;
		sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP = 3; 
		
		//if ( !sdWorld.is_server )
		sdEntity.entities_by_net_id_cache = {};
		
		sdEntity.entity_net_ids = 0;
		
		sdEntity.matter_discretion_frames = 5; // Matter transfer happens once per this many frames, this value also scales GSPEED applied for matter transfer
		
		sdEntity.phys_stand_on_map = new WeakMap(); // Key is an object on which something lies on, value is an array of objects that are currently hibernated (such as sdStorage)
		//this._phys_last_touch
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
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
	ManageTrackedPhysWakeup()
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
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_FLAT; }
	
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
	
	GetAccurateDistance( xx, yy ) // Used on client-side when right clicking on cables (also during cursor hovering for context menu and hint), also on server when distance between cable and player is measured
	{
		return sdWorld.Dist2D(	xx, 
								yy, 
								Math.min( Math.max( this.x + this._hitbox_x1, xx ), this.x + this._hitbox_x2 ), 
								Math.min( Math.max( this.y + this._hitbox_y1, yy ), this.y + this._hitbox_y2 ) );
	}
	
	IsAdminEntity() // Influences remover gun hit test
	{ return false; }
	
	IsVehicle() // Mostly defines damage from rockets multiplier so far
	{
		return false;
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return false; }
	
	Impact( vel ) // fall damage basically
	{
		//if ( vel > 7 )
		if ( vel > 6 ) // For new mass-based model
		{
			//this.Damage( ( vel - 4 ) * 15 );
			this.Damage( ( vel - 3 ) * 15 );
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
				this.onMovementInRange( hit_what );
				
				if ( !hit_what._is_being_removed )
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
	
	UseServerCollisions()
	{
		return sdWorld.is_server;
	}
	
	onBuilt() // Entity was successfully built and added to world, server-side
	{
	}
	
	getRequiredEntities() // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		return []; 
	}
	
	PhysInitIfNeeded( w, h )
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
	onPhysicallyStuck() // Called as a result of ApplyVelocityAndCollisions call
	{
	}
	ApplyVelocityAndCollisions( GSPEED, step_size=0, apply_friction=false, impact_scale=1, custom_filtering_method=null ) // step_size can be used by entities that can use stairs
	{
		this.PhysInitIfNeeded();
		
		let sx_sign = ( this.sx > 0 );
		let sy_sign = ( this.sy > 0 );
		
		let moves = 
				sx_sign !== this._phys_last_sx || 
				sy_sign !== this._phys_last_sy || 
				!sdWorld.inDist2D_Boolean( this.sx, this.sy, 0, 0, sdWorld.gravity + 0.1 );
		
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

					/*if ( this._phys_sleep <= 0 )
					{
						if ( this.GetClass() === 'sdHover' )
						console.log( this.GetClass() + ' becomes physically inactive' );
					}*/
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
		}
		else
		{
			this.Touches( sdWorld.last_hit_entity );
			
			// Better for sync (but causes random friction)
			//new_x = Math.round( new_x );
			//new_y = Math.round( new_y );
			
			let bounce_intensity = this.bounce_intensity;
			let friction_remain = this.friction_remain;
			
			if ( step_size > 0 )
			if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 7 )
			{
				for ( let i = 1; i <= step_size; i++ )
				{
					if ( this.CanMoveWithoutOverlap( new_x, new_y - i, 0, custom_filtering_method ) )
					{
						/*if ( i > step_size / 2 )
					    {
							this.Impact( sdWorld.Dist2D_Vector( this.sx, this.sy ) );
							this.sx = 0;
							this.sy = 0;
						}*/
				
						this.x = new_x;
						this.y = new_y - i;
						
						this._phys_last_touch = sdWorld.last_hit_entity;
						return;
					}
				}
			}
			

			if ( this.CanMoveWithoutOverlap( new_x, this.y, safe_overlap, custom_filtering_method ) )
			{
				this.Touches( sdWorld.last_hit_entity );
			
				let self_effect_scale = 1;
				
				if ( sdWorld.last_hit_entity )
				if ( this.hard_collision )
				{
					self_effect_scale = sdWorld.last_hit_entity.mass / ( sdWorld.last_hit_entity.mass + this.mass );
					
					if ( typeof sdWorld.last_hit_entity.sy !== 'undefined' )
					{
						sdWorld.last_hit_entity.sy += this.sy * ( 1 - self_effect_scale );
						//sdWorld.last_hit_entity.Impulse( 0, this.sy ); Impulse is reworked and needs some kind of hint that Impulse is not server-side only, so velocity change isn't doubled on client-side
					}
					if ( CheckPointDamageAllowed() )
					sdWorld.last_hit_entity.Impact( Math.abs( this.sy ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
				if ( CheckPointDamageAllowed() )
				this.Impact( Math.abs( this.sy ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
			
				this.sy = - this.sy * bounce_intensity;
				this.x = new_x;
				
				if ( apply_friction )
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, friction_remain, GSPEED );
			}
			else
			if ( this.CanMoveWithoutOverlap( this.x, new_y, safe_overlap, custom_filtering_method ) )
			{
				this.Touches( sdWorld.last_hit_entity );
				
				let self_effect_scale = 1;
				
				if ( sdWorld.last_hit_entity )
				if ( this.hard_collision )
				{
					self_effect_scale = sdWorld.last_hit_entity.mass / ( sdWorld.last_hit_entity.mass + this.mass );
					
					if ( typeof sdWorld.last_hit_entity.sx !== 'undefined' )
					{
						sdWorld.last_hit_entity.sx += this.sx * ( 1 - self_effect_scale );
						//sdWorld.last_hit_entity.Impulse( this.sx, 0 ); Impulse is reworked and needs some kind of hint that Impulse is not server-side only, so velocity change isn't doubled on client-side
					}
					
					if ( CheckPointDamageAllowed() )
					sdWorld.last_hit_entity.Impact( Math.abs( this.sx ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
				if ( CheckPointDamageAllowed() )
				this.Impact( Math.abs( this.sx ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
			
				this.sx = - this.sx * bounce_intensity;
				this.y = new_y;
				
				if ( apply_friction )
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, friction_remain, GSPEED );
			}
			else
			{
				this.Touches( sdWorld.last_hit_entity );
				
				let self_effect_scale = 1;
				
				if ( sdWorld.last_hit_entity )
				if ( this.hard_collision )
				{
					self_effect_scale = sdWorld.last_hit_entity.mass / ( sdWorld.last_hit_entity.mass + this.mass );
					
					if ( typeof sdWorld.last_hit_entity.sx !== 'undefined' )
					sdWorld.last_hit_entity.sx += this.sx * ( 1 - self_effect_scale );
				
					if ( typeof sdWorld.last_hit_entity.sy !== 'undefined' )
					sdWorld.last_hit_entity.sy += this.sy * ( 1 - self_effect_scale );
				
					if ( CheckPointDamageAllowed() )
					sdWorld.last_hit_entity.Impact( sdWorld.Dist2D_Vector( this.sx, this.sy ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
			
				if ( CheckPointDamageAllowed() )
				this.Impact( sdWorld.Dist2D_Vector( this.sx, this.sy ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
			
				this.sx = - this.sx * bounce_intensity;
				this.sy = - this.sy * bounce_intensity;
				
				this.onPhysicallyStuck();
			}

		}
		
		this._phys_last_touch = sdWorld.last_hit_entity;
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
	IsBGEntity() // 0 for in-game entities, 1 for background entities, 2 is for moderator areas, 3 is for cables. Should handle collisions separately
	{ return 0; }
	CanMoveWithoutOverlap( new_x, new_y, safe_bound=0, custom_filtering_method=null ) // Safe bound used to check if sdCharacter can stand and not just collides with walls nearby. Also due to number rounding clients should better have it (or else they will teleport while sliding on vertical wall)
	{
		this.UpdateHitbox();
		
		var ignored_classes = this.GetIgnoredEntityClasses();
		
		if ( sdWorld.CheckWallExistsBox( 
				new_x + this._hitbox_x1 + safe_bound, 
				new_y + this._hitbox_y1 + safe_bound, 
				new_x + this._hitbox_x2 - safe_bound, 
				new_y + this._hitbox_y2 - safe_bound, this, ignored_classes, this.GetNonIgnoredEntityClasses(), custom_filtering_method ) )
		return false;
		
		/*if ( sdWorld.CheckWallExists( new_x + this._hitbox_x1 + safe_bound, new_y + this._hitbox_y2 - safe_bound, this, ignored_classes ) )
		return false;
	
		if ( sdWorld.CheckWallExists( new_x + this._hitbox_x2 - safe_bound, new_y + this._hitbox_y2 - safe_bound, this, ignored_classes ) )
		return false;
	
		if ( sdWorld.CheckWallExists( new_x + this._hitbox_x1 + safe_bound, new_y + this._hitbox_y1 + safe_bound, this, ignored_classes ) )
		return false;
	
		if ( sdWorld.CheckWallExists( new_x + this._hitbox_x2 - safe_bound, new_y + this._hitbox_y1 + safe_bound, this, ignored_classes ) )
		return false;
	
		var extra_steps_x = Math.ceil( ( this._hitbox_x2 - this._hitbox_x1 ) / 8 );
		var extra_steps_y = Math.ceil( ( this._hitbox_y2 - this._hitbox_y1 ) / 8 );
		for ( var x = 1; x < extra_steps_x; x++ )
		{
			var morph = x / extra_steps_x;
			var xx = ( new_x + this._hitbox_x1 + safe_bound ) * morph + ( new_x + this._hitbox_x2 - safe_bound ) * ( 1 - morph );
			
			if ( sdWorld.CheckWallExists( xx, new_y + this._hitbox_y2 - safe_bound, this, ignored_classes ) )
			return false;
		
			if ( sdWorld.CheckWallExists( xx, new_y + this._hitbox_y1 + safe_bound, this, ignored_classes ) )
			return false;
		}
		for ( var y = 1; y < extra_steps_y; y++ )
		{
			var morph = y / extra_steps_y;
			var yy = ( new_y + this._hitbox_y1 + safe_bound ) * morph + ( new_y + this._hitbox_y2 - safe_bound ) * ( 1 - morph );
			
			if ( sdWorld.CheckWallExists( new_x + this._hitbox_x1 + safe_bound, yy, this, ignored_classes ) )
			return false;
		
			if ( sdWorld.CheckWallExists( new_x + this._hitbox_x2 - safe_bound, yy, this, ignored_classes ) )
			return false;
		}
		*/
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
	GetBleedEffectFilter()
	{
		return '';
	}
	
	get _hash_position()
	{
		debugger; // Get rid of it, use this._affected_hash_arrays instead
		throw new Error('Get rid of this property');
	}
	set _hash_position( v )
	{
		debugger; // Get rid of it, use this._affected_hash_arrays instead
		throw new Error('Get rid of this property');
	}
	
	UpdateHitbox()
	{
		/*if ( !sdWorld.is_server )
		if ( this.GetClass() === 'sdBlock' )
		if ( this.material === 0 )
		{
			console.warn( 'Hash update allowed: ',this._hitbox_last_update !== sdWorld.time );
			debugger;
		}	*/
		
		if ( this._hitbox_last_update !== sdWorld.time )
		{
			this._hitbox_last_update = sdWorld.time;
			
			this._hitbox_x1 = this.hitbox_x1;
			this._hitbox_y1 = this.hitbox_y1;
			this._hitbox_x2 = this.hitbox_x2;
			this._hitbox_y2 = this.hitbox_y2;

			//if ( isNaN( this._hitbox_x2 ) || isNaN( this._hitbox_y2 ) )
			//throw new Error('UpdateHitbox caused NaN error');
		}
	}
	constructor( params )
	{
		//this._stack_trace = globalThis.getStackTrace();
		
		// Because getters are slow in JS, especially when they are virtual methods. Trying this method?
		this._hitbox_x1 = 0;
		this._hitbox_y1 = 0;
		this._hitbox_x2 = 0;
		this._hitbox_y2 = 0;
		this.UpdateHitbox(); // Update hitbox
		this._hitbox_last_update = 0; // But be ready for it to be updated again (sdCrystal that is being ejected from sdMatterAmplifier would need it to be not stuck in it)
		//this.UpdateHitbox();
		
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
			this._net_id = sdEntity.entity_net_ids++;
			
			//if ( !sdWorld.is_server )
			sdEntity.entities_by_net_id_cache[ this._net_id ] = this;
		}
		else
		{
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
	}
	
	GetComWiredCache( accept_test_method=null ) // Cretes .cio property for clients to know if com exists
	{
		if ( !sdWorld.is_server )
		{
			if ( accept_test_method )
			return null;
		
			if ( this.cio !== 0 )
			return { _net_id: this.cio, subscribers:[] };
		
			return null;
		}
		if ( accept_test_method || sdWorld.time > ( this._next_com_rethink || 0 ) )
		{
			const sdCable = sdWorld.entity_classes.sdCable;
			const sdCom = sdWorld.entity_classes.sdCom;

			var worked_out_ents = [];
			var active_ents = [ this ];
			while ( active_ents.length > 0 )
			{
				var connected_ents = sdCable.GetConnectedEntities( active_ents[ 0 ], sdCable.TYPE_ANY );

				worked_out_ents.push( active_ents[ 0 ] );
				active_ents.shift();

				for ( var i = 0; i < connected_ents.length; i++ )
				{
					if ( worked_out_ents.indexOf( connected_ents[ i ] ) === -1 )
					{
						if ( accept_test_method )
						{
							if ( accept_test_method( connected_ents[ i ] ) )
							return connected_ents[ i ];
						}
						else
						if ( connected_ents[ i ].is( sdCom ) )
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
			function shuffleArray(array) 
			{
				for (var i = array.length - 1; i > 0; i--) {
					var j = Math.floor(Math.random() * (i + 1));
					var temp = array[i];
					array[i] = array[j];
					array[j] = temp;
				}
			}

			shuffleArray( anything_near );
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
					throw new Error('Logic error: ' + this.GetClass() + ' is not allowed to become active after was removed');
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
					if ( this._affected_hash_arrays.length === 0 ) // Usually it is a sign that entity (ex. sdBlock) just spawned and wasn't added to any hash arrays for collision and visibility checks (alternatively _last_x/y === undefined check could be here, but probably not needed or not efficient). Hibernation would prevent that event further so we do it now
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
	GetClass()
	{
		return this.constructor.name;
	}
	is( c )
	{
		return this.constructor === c.prototype.constructor;
	}
	GetSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null )
	{
		let returned_object;
			
		if ( current_frame !== this._snapshot_cache_frame || save_as_much_as_possible )
		{
			returned_object = {
				_net_id: this._net_id,
				_class: this.GetClass()
			};

			// Some extra logic so backup saving does not corrupt _snapshot_cache for 1 frame
			if ( save_as_much_as_possible )
			{
			}
			else
			{
				this._snapshot_cache_frame = current_frame;

				/*this._snapshot_cache = {
					_net_id: this._net_id,
					_class: this.GetClass()
				};
				
				returned_object = this._snapshot_cache;*/
				
				this._snapshot_cache = returned_object;
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
			
			for ( var prop in this )
			{
				if ( prop.charAt( 0 ) !== '_' || 
					 ( save_as_much_as_possible && prop !== '_snapshot_cache_frame' && prop !== '_snapshot_cache' && prop !== '_hiberstate' && prop !== '_last_x' && prop !== '_last_y' && ( typeof this[ prop ] === 'number' || typeof this[ prop ] === 'string' || typeof this[ prop ] === 'boolean' /*|| ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' && typeof this[ prop ]._class !== 'undefined' )*/ || this.ExtraSerialzableFieldTest( prop ) ) ) )
				{
					var v = this[ prop ];
					
					if ( this[ prop ] !== null )
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
	ExtraSerialzableFieldTest( prop ) // Some object properties testing might go here, for snapshots only
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
		debugger;
	
		let my_entity_protected_vars = null;
			
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
			{
				if ( snapshot[ prop ] !== null )
				if ( typeof snapshot[ prop ] === 'object' )
				{
					if ( snapshot[ prop ]._net_id )
					if ( snapshot[ prop ]._class )
					{
						if ( this[ prop ] && !this[ prop ]._is_being_removed && this[ prop ]._net_id === snapshot[ prop ]._net_id )
						{
							snapshot[ prop ] = this[ prop ];
						}
						else
						{
							let new_val = sdEntity.GetObjectByClassAndNetId( snapshot[ prop ]._class, snapshot[ prop ]._net_id );
							
							if ( new_val === null )
							{
								//if ( sdWorld.is_server )
								//{
									if ( sdWorld.unresolved_entity_pointers ) // Used by client-side cables now
									sdWorld.unresolved_entity_pointers.push([ this, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
									
									//throw new Error('Unresolvable sdEntity pointer at ApplySnapshot. This isn\'t good especially if world snapshot is loaded...');
									//debugger; // Unresolvable sdEntity pointer at ApplySnapshot. This isn't good especially if world snapshot is loaded...
								//}
							}
							
							snapshot[ prop ] = new_val;
						}
					}
				}
				
				if ( my_entity !== this )
				{
					this[ prop ] = snapshot[ prop ];
				}
				else
				{
					if ( !my_entity_protected_vars )
					my_entity_protected_vars = sdWorld.my_entity_protected_vars;
					
					if ( typeof my_entity_protected_vars[ prop ] === 'undefined' || !this.AllowClientSideState() )
					this[ prop ] = snapshot[ prop ];
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
				let potential_held_by = sdEntity.GetObjectByClassAndNetId( this.held_by_class, this.held_by_net_id );
				
				if ( potential_held_by )
				{
					this._held_by = potential_held_by;
				}
				else
				{
					if ( this.held_by_class !== '' )
					sdWorld.unresolved_entity_pointers.push([ this, '_held_by', this.held_by_class, this.held_by_net_id ]);
				}
			}
		}
		else
		{
			if ( !this.IsGlobalEntity() )
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
		
		this._hitbox_last_update = 0;
		this.UpdateHitbox();
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
		
		if ( sdWorld.is_server )
		possible_ent = sdEntity.entities_by_net_id_cache[ _net_id ]; // Fast way
		else
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
		}
	
		if ( possible_ent === undefined )
		{
			/*if ( should_return !== null )
			{
				throw new Error('Cached access failed for ',should_return );
			}*/
			return null;
		}
	
		if ( possible_ent.GetClass() !== _class )
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
	static GetObjectFromSnapshot( snapshot )
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
	
		var ret = new sdWorld.entity_classes[ snapshot._class ]({ x:snapshot.x, y:snapshot.y });//globalThis[ snapshot._class ];
		ret._net_id = snapshot._net_id;
		sdEntity.entities_by_net_id_cache[ ret._net_id ] = ret; // Same for client, done here rather than during object creation
		
		ret.ApplySnapshot( snapshot );
		
		ret.UpdateHitbox();
		
		sdEntity.entities.push( ret );
		//sdWorld.UpdateHashPosition( ret, false ); // Will prevent sdBlock from occasionally not having collisions on client-side (it will rest in hibernated state, probably because of that. It is kind of a bug though)
	
		return ret;
	}
	static GuessEntityName( net_id ) // For client-side coms, also for server bound extend report
	{
		if ( typeof net_id === 'string' )
		{
			if ( net_id === 'sdCharacter' )
			return 'all players';
			if ( net_id === 'sdCrystal' )
			return 'all crystals';
			if ( net_id === 'sdCube' )
			return 'all Cubes';
		
			return net_id;
		}
	
		if ( typeof sdEntity.entities_by_net_id_cache[ net_id ] === 'undefined' )
		{
			return 'user #' + net_id;
		}
		else
		{
			let e = sdEntity.entities_by_net_id_cache[ net_id ];
			
			if ( e.GetClass() === 'sdCommandCentre' )
			{
				return 'Command centre';
			}
			else
			if ( e.GetClass() === 'sdCharacter' )
			{
				let s = e.title;
				
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
				return sdWorld.entity_classes.sdGun.classes[ e.class ].title;
			}
			else
			return e.GetClass() + '#' + net_id;
		}
	}
	
	MatterGlow( how_much=0.01, radius=30, GSPEED ) // Set radius to 0 to only glow into cables
	{
		if ( !sdWorld.is_server )
		return;
		
		let this_matter = ( this.matter || this._matter || 0 );
		
		if ( this_matter > 0.05 )
		{
			if ( !sdCable )
			sdCable = sdWorld.entity_classes.sdCable;
			
			var connected_ents = sdCable.GetConnectedEntities( this, sdCable.TYPE_MATTER );
			for ( var i = 0; i < connected_ents.length; i++ )
			{
				if ( typeof connected_ents[ i ].matter !== 'undefined' || typeof connected_ents[ i ]._matter !== 'undefined' )
				this.TransferMatter( connected_ents[ i ], how_much, GSPEED * 4 ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity
			}
			
			if ( radius > 0 )
			if ( this_matter > 0.05 )
			{
				//var arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null, ( e )=>!e.is( sdWorld.entity_classes.sdBG ) );
				var arr = this.GetAnythingNearCache( this.x, this.y, radius, null, null );

				for ( var i = 0; i < arr.length; i++ )
				{
					if ( ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' ) && arr[ i ] !== this )
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
				if ( ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' ) && arr[ i ] !== this )
				{
					if ( sdWorld.is_server )
					{
						arr[ i ].TransferMatter( this, how_much, GSPEED * 4, true ); // Mult by X because targets no longer take 4 cells
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
	remove()
	{
		// Or else some entities won't be removed
		if ( !this._is_being_removed )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			this._is_being_removed = true;

			this._broken = true; // By default, you can override it after removal was called for entity // Copy [ 1 / 2 ]
		}
	}
	_remove()
	{
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
				if ( sdEntity.entities_by_net_id_cache[ this._net_id ] !== this )
				debugger; // Should never happen
			
				delete sdEntity.entities_by_net_id_cache[ this._net_id ];
			}
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
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
	
	onMovementInRange( from_entity )
	{
	}
	Damage( dmg, initiator=null, headshot=false, affects_armor=true )
	{
	}
	
	get mass() { return this.is_static ? 100 : 5; }
	Impulse( sx, sy )
	{
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
}
//sdEntity.init_class();

//module.exports = sdEntity;
//module.exports.sdEntity = sdEntity;

//exports.sdEntity = sdEntity;
export default sdEntity;

//module.exports = sdEntity;