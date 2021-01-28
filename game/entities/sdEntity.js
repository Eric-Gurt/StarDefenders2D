


import sdWorld from '../sdWorld.js';
//import sdEffect from './sdEffect.js';

var entity_net_ids = 0;

class sdEntity
{
	static init_class()
	{
		console.warn('sdEntity class initiated');
		sdEntity.entities = [];
		sdEntity.global_entities = []; // sdWeather
		
		sdEntity.active_entities = [];
		
		sdEntity.HIBERSTATE_ACTIVE = 0;
		sdEntity.HIBERSTATE_HIBERNATED = 1;
		sdEntity.HIBERSTATE_REMOVED = 2;
		sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP = 3; 
		
		//if ( !sdWorld.is_server )
		sdEntity.entities_by_net_id_cache = {};
		
		let that = this; setTimeout( ()=>{ sdWorld.entity_classes[ that.name ] = that; }, 1 ); // Register for object spawn
	}
	get hitbox_x1() { return -5; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	get substeps() // Bullets will need more
	{ return 1; }
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	get progress_until_removed()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these.
	{ return false; }
	
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.Damage( ( vel - 4 ) * 15 );
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
	
	ApplyVelocityAndCollisions( GSPEED, step_size=0, apply_friction=false ) // step_size can be used by entities that can use stairs
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
				if ( sdWorld.last_hit_entity )
				if ( this.hard_collision )
				sdWorld.last_hit_entity.sy += this.sy;
				//sdWorld.last_hit_entity.Impulse( 0, this.sy );
			
				this.Impact( Math.abs( this.sy ) * ( 1 + bounce_intensity ) );
				this.sy = - this.sy * bounce_intensity;
				this.x = new_x;
				
				if ( apply_friction )
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.8, GSPEED );
			}
			else
			if ( this.CanMoveWithoutOverlap( this.x, new_y, safe_overlap ) )
			{
				if ( sdWorld.last_hit_entity )
				if ( this.hard_collision )
				sdWorld.last_hit_entity.sx += this.sx;
				//sdWorld.last_hit_entity.Impulse( this.sx, 0 );
			
				this.Impact( Math.abs( this.sx ) * ( 1 + bounce_intensity ) );
				this.sx = - this.sx * bounce_intensity;
				this.y = new_y;
				
				if ( apply_friction )
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.8, GSPEED );
			}
			else
			{
				if ( sdWorld.last_hit_entity )
				if ( this.hard_collision )
				{
					sdWorld.last_hit_entity.sx += this.sx;
					sdWorld.last_hit_entity.sy += this.sy;
				}
			
				this.Impact( sdWorld.Dist2D_Vector( this.sx, this.sy ) * ( 1 + bounce_intensity ) );
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
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
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
				new_y + this.hitbox_y2 - safe_bound, this, ignored_classes ) )
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
		
		this._hash_position = null;
		sdWorld.UpdateHashPosition( this, true );
		
		this._is_being_removed = false;
		this._broken = false; // Becomes true for statics whenever they are really broken rather than just cut out by visibility
		
		if ( sdWorld.is_server )
		{
			this._net_id = entity_net_ids++;
			
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
	}
	SetHiberState( v )
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
	}
	
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		return true;
	}
	GetClass()
	{
		return this.constructor.name;
	}
	GetSnapshot( current_frame )
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
				if ( prop.charAt( 0 ) !== '_' )
				{
					if ( typeof this[ prop ] === 'number' )
					{
						if ( prop === 'sx' || prop === 'sy' )
						this._snapshot_cache[ prop ] = Math.round( this[ prop ] * 100 ) / 100;
						else
						this._snapshot_cache[ prop ] = Math.round( this[ prop ] );
					
						//this[ prop ] = Math.round( this[ prop ] * 100 ) / 100;
					
						//this._snapshot_cache[ prop ] = this[ prop ];
					}
					else
					/*if ( this[ prop ] instanceof sdEntity )
					{
						throw this[ prop ];
					}
					else*/
					this._snapshot_cache[ prop ] = this[ prop ];
				}
			}
		}
		
		//if ( this.GetClass() === 'sdBullet' )
		//console.log( JSON.stringify( this._snapshot_cache ) );
		
		return this._snapshot_cache;
	}
	
	AllowClientSideState() // Conditions to ignore sdWorld.my_entity_protected_vars
	{
		return true;
	}
	ApplySnapshot( snapshot )
	{
		if ( snapshot._net_id !== this._net_id )
		debugger;
		if ( snapshot._class !== this.GetClass() )
		debugger;
			
		for ( var prop in snapshot )
		{
			if ( prop !== '_net_id' )
			if ( prop !== '_class' )
			{
				if ( sdWorld.my_entity !== this || typeof sdWorld.my_entity_protected_vars[ prop ] === 'undefined' || !this.AllowClientSideState() )
				this[ prop ] = snapshot[ prop ];
			}
		}
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	static GetObjectByClassAndNetId( _class, _net_id )
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
	
	
	
		// Fast way
	
		let possible_ent = sdEntity.entities_by_net_id_cache[ _net_id ];
	
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
		throw new Error( 'Unknown entity class. Download?' );
	
		var ret = new sdWorld.entity_classes[ snapshot._class ]({ x:snapshot.x, y:snapshot.y });//globalThis[ snapshot._class ];
		ret._net_id = snapshot._net_id;
		sdEntity.entities_by_net_id_cache[ ret._net_id ] = ret; // Same for client, done here rather than during object creation
		
		ret.ApplySnapshot( snapshot );
		
		sdEntity.entities.push( ret );
	
		return ret;
	}
	TransferMatter( to, how_much, GSPEED )
	{
		how_much = this.matter * how_much * GSPEED;
		
		if ( how_much > this.matter )
		how_much = this.matter;
	
		if ( how_much > to.matter_max - to.matter )
		how_much = to.matter_max - to.matter;
	
		this.matter -= how_much;
		to.matter += how_much;
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
	onMovementInRange( from_entity )
	{
	}
	Damage( dmg, initiator=null )
	{
	}
	Impulse( sx, sy )
	{
	}
	Draw( ctx, attached )
	{
	}
	static Tooltip( ctx, t )
	{
		ctx.font = "5.5px Verdana";
		ctx.textAlign = 'center';
		ctx.fillStyle = '#000000';
		ctx.fillText(t, 0, -24.5 ); 
		ctx.fillStyle = '#ffffff';
		ctx.fillText(t, 0, -25 ); 
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