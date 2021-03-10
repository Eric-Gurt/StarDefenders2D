


import sdWorld from '../sdWorld.js';
//import sdSound from '../sdSound.js';
//import sdEffect from './sdEffect.js';


//var entity_net_ids = 0;

class sdEntity
{
	static init_class()
	{
		console.warn('sdEntity class initiated');
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
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
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
	
	IsTargetable() // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		return true;
	}
	
	Impact( vel ) // fall damage basically
	{
		//if ( this.GetClass() === 'sdCharacter' )
		//console.log('Impact',vel);
		
		//if ( vel > 7 )
		if ( vel > 6 ) // For new mass-based model
		{
			//this.Damage( ( vel - 4 ) * 15 );
			this.Damage( ( vel - 3 ) * 15 );
		}
	}
	
	Touches( hit_what ) // For cases that are handled by ApplyVelocityAndCollisions and also player walking
	{
		if ( hit_what )
		{
			this.onMovementInRange( hit_what );
			hit_what.onMovementInRange( this );
			
			if ( this._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP )
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
			if ( hit_what._hiberstate !== sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP )
			hit_what.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	
	get bounce_intensity()
	{ return 0; }
	
	UseServerCollisions()
	{
		return sdWorld.is_server;
	}
	
	onBuilt() // Entity was successfully built and added to world, server-side
	{
	}
	
	ApplyVelocityAndCollisions( GSPEED, step_size=0, apply_friction=false, impact_scale=1 ) // step_size can be used by entities that can use stairs
	{
		let new_x = this.x + this.sx * GSPEED;
		let new_y = this.y + this.sy * GSPEED;
		
		//let safe_overlap = step_size === 0 ? 0 : ( sdWorld.is_server ? 0 : 0.01 ); // Only for players (other entities have no anti-shake measures)

		let safe_overlap = ( this.UseServerCollisions() ? 0 : 0.01 );
		
		//if ( !sdWorld.is_server )
		//safe_overlap += 1;

		if ( this.CanMoveWithoutOverlap( new_x, new_y, safe_overlap ) )
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
			
			if ( step_size > 0 )
			if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 7 )
			{
				for ( let i = 1; i <= step_size; i++ )
				{
					if ( this.CanMoveWithoutOverlap( new_x, new_y - i ) )
					{
						if ( i > step_size / 2 )
					    {
							this.Impact( sdWorld.Dist2D_Vector( this.sx, this.sy ) );
							this.sx = 0;
							this.sy = 0;
						}
				
						this.x = new_x;
						this.y = new_y - i;
						return;
					}
				}
			}
			

			if ( this.CanMoveWithoutOverlap( new_x, this.y, safe_overlap ) )
			{
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
					sdWorld.last_hit_entity.Impact( Math.abs( this.sy ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
				this.Impact( Math.abs( this.sy ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
				this.sy = - this.sy * bounce_intensity;
				this.x = new_x;
				
				if ( apply_friction )
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.8, GSPEED );
			}
			else
			if ( this.CanMoveWithoutOverlap( this.x, new_y, safe_overlap ) )
			{
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
					sdWorld.last_hit_entity.Impact( Math.abs( this.sx ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
				this.Impact( Math.abs( this.sx ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
				this.sx = - this.sx * bounce_intensity;
				this.y = new_y;
				
				if ( apply_friction )
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.8, GSPEED );
			}
			else
			{
				let self_effect_scale = 1;
				
				if ( sdWorld.last_hit_entity )
				if ( this.hard_collision )
				{
					self_effect_scale = sdWorld.last_hit_entity.mass / ( sdWorld.last_hit_entity.mass + this.mass );
					
					if ( typeof sdWorld.last_hit_entity.sx !== 'undefined' )
					sdWorld.last_hit_entity.sx += this.sx * ( 1 - self_effect_scale );
				
					if ( typeof sdWorld.last_hit_entity.sy !== 'undefined' )
					sdWorld.last_hit_entity.sy += this.sy * ( 1 - self_effect_scale );
				
					sdWorld.last_hit_entity.Impact( sdWorld.Dist2D_Vector( this.sx, this.sy ) * ( 1 + bounce_intensity ) * ( 1 - self_effect_scale ) * impact_scale );
				}
			
				this.Impact( sdWorld.Dist2D_Vector( this.sx, this.sy ) * ( 1 + bounce_intensity ) * self_effect_scale * impact_scale );
				this.sx = - this.sx * bounce_intensity;
				this.sy = - this.sy * bounce_intensity;
			}

		}
	}
	MeasureMatterCost()
	{
		return Infinity;
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
	IsBGEntity() // True for BG entities, should handle collisions separately
	{ return false; }
	CanMoveWithoutOverlap( new_x, new_y, safe_bound=0 ) // Safe bound used to check if sdCharacter can stand and not just collides with walls nearby. Also due to number rounding clients should better have it (or else they will teleport while sliding on vertical wall)
	{
		var ignored_classes = this.GetIgnoredEntityClasses();
		
		if ( sdWorld.CheckWallExistsBox( 
				new_x + this.hitbox_x1 + safe_bound, 
				new_y + this.hitbox_y1 + safe_bound, 
				new_x + this.hitbox_x2 - safe_bound, 
				new_y + this.hitbox_y2 - safe_bound, this, ignored_classes, this.GetNonIgnoredEntityClasses() ) )
		return false;
		
		/*if ( sdWorld.CheckWallExists( new_x + this.hitbox_x1 + safe_bound, new_y + this.hitbox_y2 - safe_bound, this, ignored_classes ) )
		return false;
	
		if ( sdWorld.CheckWallExists( new_x + this.hitbox_x2 - safe_bound, new_y + this.hitbox_y2 - safe_bound, this, ignored_classes ) )
		return false;
	
		if ( sdWorld.CheckWallExists( new_x + this.hitbox_x1 + safe_bound, new_y + this.hitbox_y1 + safe_bound, this, ignored_classes ) )
		return false;
	
		if ( sdWorld.CheckWallExists( new_x + this.hitbox_x2 - safe_bound, new_y + this.hitbox_y1 + safe_bound, this, ignored_classes ) )
		return false;
	
		var extra_steps_x = Math.ceil( ( this.hitbox_x2 - this.hitbox_x1 ) / 8 );
		var extra_steps_y = Math.ceil( ( this.hitbox_y2 - this.hitbox_y1 ) / 8 );
		for ( var x = 1; x < extra_steps_x; x++ )
		{
			var morph = x / extra_steps_x;
			var xx = ( new_x + this.hitbox_x1 + safe_bound ) * morph + ( new_x + this.hitbox_x2 - safe_bound ) * ( 1 - morph );
			
			if ( sdWorld.CheckWallExists( xx, new_y + this.hitbox_y2 - safe_bound, this, ignored_classes ) )
			return false;
		
			if ( sdWorld.CheckWallExists( xx, new_y + this.hitbox_y1 + safe_bound, this, ignored_classes ) )
			return false;
		}
		for ( var y = 1; y < extra_steps_y; y++ )
		{
			var morph = y / extra_steps_y;
			var yy = ( new_y + this.hitbox_y1 + safe_bound ) * morph + ( new_y + this.hitbox_y2 - safe_bound ) * ( 1 - morph );
			
			if ( sdWorld.CheckWallExists( new_x + this.hitbox_x1 + safe_bound, yy, this, ignored_classes ) )
			return false;
		
			if ( sdWorld.CheckWallExists( new_x + this.hitbox_x2 - safe_bound, yy, this, ignored_classes ) )
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
	
	constructor( params )
	{
		//this._stack_trace = globalThis.getStackTrace();
		
		this._last_x = params.x;
		this._last_y = params.y;
		
		this._last_hit_time = 0; // Prevent flood from splash damage bullets
		
		this.x = params.x;
		this.y = params.y;
		
		if ( this.is_static )
		this._update_version = 0;
		
		//this._hash_position = null;
		this._affected_hash_arrays = []; // Every time entity moves - these are ones where entity will be excluded, and then new hash array group will be set. Will be tiny for small objects and can get quite large for larger entities.
		sdWorld.UpdateHashPosition( this, true );
		
		this._is_being_removed = false;
		this._broken = false; // Becomes true for statics whenever they are really broken rather than just cut out by visibility
		
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
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		this._snapshot_cache_frame = 0;
		this._snapshot_cache = null;
		
		//this._is_real = ( typeof params.is_real !== 'undefined' ) ? params.is_real : true; // Build tools spawns entities with ._is_real === false (this is not handled on client-side since damage generally can't be dealt on client-side anyway), it will prevent them from reacting to impact (sdBlock for example would be able to kill spawner sdCharacter and cause gun to throw an error without this)
		
		if ( this.IsGlobalEntity() )
		sdEntity.global_entities.push( this );
	}
	SetHiberState( v, allow_calling_movement_in_range=true )
	{
		if ( v !== this._hiberstate )
		{
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
					
					this._hiberstate = v;
				}
				else
				if ( v === sdEntity.HIBERSTATE_ACTIVE )
				{
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
	
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
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
	GetSnapshot( current_frame, save_as_much_as_possible=false )
	{
		if ( current_frame !== this._snapshot_cache_frame )
		{
			this._snapshot_cache_frame = current_frame;
			
			this._snapshot_cache = {
				_net_id: this._net_id,
				_class: this.GetClass()
			};
			
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
					 ( save_as_much_as_possible && prop !== '_hiberstate' && prop !== '_last_x' && prop !== '_last_y' && ( typeof this[ prop ] === 'number' || typeof this[ prop ] === 'string' || typeof this[ prop ] === 'boolean' /*|| ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' && typeof this[ prop ]._class !== 'undefined' )*/ || this.ExtraSerialzableFieldTest( prop ) ) ) )
				{
					var v = this[ prop ];
					
					if ( this[ prop ] !== null )
					{
						/*if ( typeof this[ prop ] === 'object' )
						if ( prop !== 'sd_filter' )
							debugger;*/
						
						if ( typeof this[ prop ] === 'object' && typeof this[ prop ]._net_id !== 'undefined' && typeof this[ prop ].constructor !== 'undefined' )
						{
							v = { _net_id: this[ prop ]._net_id, _class: this[ prop ].constructor.name };
						}
					}
					
					if ( !save_as_much_as_possible && typeof v === 'number' ) // Do not do number rounding if world is being saved
					{
						if ( prop === 'sx' || prop === 'sy' )
						this._snapshot_cache[ prop ] = Math.round( v * 100 ) / 100;
						else
						this._snapshot_cache[ prop ] = Math.round( v );
					}
					else
					this._snapshot_cache[ prop ] = v;
				}
			}
		}
		
		//if ( this.GetClass() === 'sdBullet' )
		//console.log( JSON.stringify( this._snapshot_cache ) );
		
		return this._snapshot_cache;
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
		
		if ( snapshot._net_id !== this._net_id )
		debugger;
		if ( snapshot._class !== this.GetClass() )
		debugger;
	
		let my_entity_protected_vars = null;
			
		for ( var prop in snapshot )
		{
			if ( prop !== '_net_id' )
			if ( prop !== '_class' )
			{
				if ( snapshot[ prop ] !== null )
				if ( typeof snapshot[ prop ] === 'object' )
				{
					if ( snapshot[ prop ]._net_id )
					if ( snapshot[ prop ]._class )
					{
						if ( this[ prop ] && this[ prop ]._net_id === snapshot[ prop ]._net_id )
						{
							snapshot[ prop ] = this[ prop ];
						}
						else
						{
							let new_val = sdEntity.GetObjectByClassAndNetId( snapshot[ prop ]._class, snapshot[ prop ]._net_id );
							
							if ( new_val === null )
							{
								if ( sdWorld.is_server )
								{
									sdWorld.unresolved_entity_pointers.push([ this, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
									
									//throw new Error('Unresolvable sdEntity pointer at ApplySnapshot. This isn\'t good especially if world snapshot is loaded...');
									//debugger; // Unresolvable sdEntity pointer at ApplySnapshot. This isn't good especially if world snapshot is loaded...
								}
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
		}
		else
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
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
		
		//if ( globalThis[ snapshot._class ] === undefined )
		if ( typeof sdWorld.entity_classes[ snapshot._class ] === 'undefined' )
		{
			console.log( 'Known entity classes: ', sdWorld.entity_classes );
			throw new Error( 'Unknown entity class "'+snapshot._class+'". Download?' );
		}
	
		var ret = new sdWorld.entity_classes[ snapshot._class ]({ x:snapshot.x, y:snapshot.y });//globalThis[ snapshot._class ];
		ret._net_id = snapshot._net_id;
		sdEntity.entities_by_net_id_cache[ ret._net_id ] = ret; // Same for client, done here rather than during object creation
		
		ret.ApplySnapshot( snapshot );
		
		sdEntity.entities.push( ret );
		//sdWorld.UpdateHashPosition( ret, false ); // Will prevent sdBlock from occasionally not having collisions on client-side (it will rest in hibernated state, probably because of that. It is kind of a bug though)
	
		return ret;
	}
	static GuessEntityName( net_id ) // For client-side coms
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
			return e.GetClass() + '#' + net_id;
		}
	}
	MatterGlow( how_much=0.01, radius=30, GSPEED )
	{
		//sdEntity.matter_discretion_frames
		
		if ( sdWorld.is_server )
		{
			if ( typeof this._matter_discretion_frame === 'undefined' )
			this._matter_discretion_frame = ~~( Math.random() * sdEntity.matter_discretion_frames );

			this._matter_discretion_frame--;

			if ( this._matter_discretion_frame > 0 )
			return;

			this._matter_discretion_frame += sdEntity.matter_discretion_frames;
			GSPEED *= sdEntity.matter_discretion_frames;
		}
		
		if ( radius > 64 )
		{
			debugger; // Not needed yet?
		}
		else
		if ( radius > 32 )
		{
			var x = this.x;
			var y = this.y;
			for ( var xx = -2; xx <= 2; xx++ )
			for ( var yy = -2; yy <= 2; yy++ )
			//for ( var xx = -1; xx <= 1; xx++ )
			//for ( var yy = -1; yy <= 1; yy++ )
			{
				var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
				for ( var i = 0; i < arr.length; i++ )
				if ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' )
				if ( sdWorld.inDist2D_Boolean( arr[ i ].x, arr[ i ].y, x, y, radius ) >= 0 )
				if ( arr[ i ] !== this )
				{
					this.TransferMatter( arr[ i ], how_much, GSPEED );
				}
			}
		}
		else
		{
			var x = this.x;
			var y = this.y;
			//for ( var xx = -2; xx <= 2; xx++ )
			//for ( var yy = -2; yy <= 2; yy++ )
			for ( var xx = -1; xx <= 1; xx++ )
			for ( var yy = -1; yy <= 1; yy++ )
			{
				var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
				for ( var i = 0; i < arr.length; i++ )
				if ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' )
				if ( sdWorld.inDist2D_Boolean( arr[ i ].x, arr[ i ].y, x, y, radius ) >= 0 )
				if ( arr[ i ] !== this )
				{
					this.TransferMatter( arr[ i ], 0.01, GSPEED );
				}
			}
		}
	}
	addEventListener( str, method ) // Not all entities will support these
	{
		this._listeners[ str ].push( method );
	}
	removeEventListener( str, method ) // Not all entities will support these
	{
		let i = this._listeners[ str ].indexOf( method );
		if ( i !== -1 )
		this._listeners[ str ].splice( i, 1 );
		//else
		//debugger;
	}
	TransferMatter( to, how_much, GSPEED )
	{
		let this_matter = ( this.matter || this._matter || 0 );
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
	}
	Think( GSPEED )
	{
		this.onThink( GSPEED );

		return this._is_being_removed;
	}
	remove()
	{
		// Or else some entities won't be removed
		if ( !this._is_being_removed )
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	
		this._is_being_removed = true;
	}
	_remove()
	{
		this._is_being_removed = true; // Just in case?
		
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
	onRemove() // Class-specific, if needed
	{
	}
	onRemoveAsFakeEntity() // Will be called instead of onRemove() if entity was never added to world
	{
	}
	onMovementInRange( from_entity )
	{
	}
	Damage( dmg, initiator=null )
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
}
//sdEntity.init_class();

//module.exports = sdEntity;
//module.exports.sdEntity = sdEntity;

//exports.sdEntity = sdEntity;
export default sdEntity;

//module.exports = sdEntity;