/*

	Areas that store entities in form of snapshots, can store on a disk as well?

	This is a heavy over-optimization approach...

	Most likely it would merge whole big bases into one big chunk, which is perfectly fine I guess.


	TODO: this._my_hash_list is generated but not yet used outside of this class

	TODO: Add SyncedToPlayer logic

	TODO: Greatly increase range over entities that have some sort of radius-based scans, such as turrets and crystals

	TODO: Add some sort of global chunk manager

	TODO: Make point and rect testers wake-up sdDeepSleep areas?

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';

import sdRenderer from '../client/sdRenderer.js';


class sdDeepSleep extends sdEntity
{
	static init_class()
	{
		sdDeepSleep.TYPE_UNSPAWNED_WORLD = 0; // Whenever something touches it or some player sees it - spawns fresh world at the area
		sdDeepSleep.TYPE_HIBERNATED_WORLD = 1; // Whenever something touches it or some player sees it - spawns previously hibernated entities
		//sdDeepSleep.TYPE_SCHEDULED_SLEEP = 2; // These will be created at areas that will be scheduled to sleep soon unless nobody interacts with them
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.w; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.h; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	IsVisible( observer_entity )
	{
		return true;
	}
	
	static GlobalThink( GSPEED )
	{
		if ( sdWorld.is_server )
		{
		}
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._to_remove_temp_set )
		if ( this._to_remove_temp_set.has( from_entity ) )
		{
			return;
		}
		
		this.ping_time = sdWorld.time;
		
		trace( 'Movement from ', from_entity );
		debugger;
		
		this.WakeUpArea();
	}
	WakeUpArea()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._is_being_removed )
		return;

		if ( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
		{
			this.remove();
		
			let x2 = this.x + this.w;
			let y2 = this.y + this.h;

			for ( let x = this.x; x < x2; x += 16 )
			for ( let y = this.y; y < y2; y += 16 )
			{
				let block = sdWorld.AttemptWorldBlockSpawn( x, y );
				
				if ( block )
				{
					sdWorld.UpdateHashPosition( block, false, true ); // Last must be true or else bullets will miss new entities for a frame // Won't call onMovementInRange
				}
			}
		}
		else
		if ( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
		{
			if ( this._snapshots_str === '' ) // onBuild was not called yet..?
			{
				debugger;
				return;
			}
		
			this.remove();
			
			//trace( 'Restoring hibernated area' );
			
			//trace( 'sdDeepSleep has no action for this type - just removing' );
			let snapshots = JSON.parse( this._snapshots_str );
			this._snapshots_str = '';
			
			sdWorld.unresolved_entity_pointers = [];
			
			let ents = [];
		
			for ( let i = 0; i < snapshots.length; i++ )
			{
				let snapshot = snapshots[ i ];
				
				let ent = sdEntity.GetObjectFromSnapshot( snapshot );
				
				if ( !ent._is_being_removed )
				{
					//if ( ent._affected_hash_arrays.length > 0 ) // Easier than checking for hiberstates
					sdWorld.UpdateHashPosition( ent, false, true ); // Last must be true or else bullets will miss new entities for a frame
				
					//sdWorld.UpdateHashPosition( ent, false, false ); // Won't call onMovementInRange
				}
				
				ents.push( ent );
			}
			
			sdWorld.SolveUnresolvedEntityPointers();
			sdWorld.unresolved_entity_pointers = null;
		}
	}
	
	IsAdminEntity() // Influences remover gun hit test
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.w = params.w || 512;
		this.h = params.h || 512;
		
		this.type = params.type || sdDeepSleep.TYPE_UNSPAWNED_WORLD;
		
		this.ping_time = 0;
		
		this._snapshots_str = '';// [];
		this._to_remove_temp_set = null;
		
		this._my_hash_list = []; // Disconnected player hashes are stored here
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
	}
	onBuilt()
	{
		if ( sdWorld.is_server )
		if ( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
		{
			//trace( 'Generating hibernated area...' );
			
			let entity_once = new Set();
			
			entity_once.add( this ); // Ignore itself
			
			let bounds_moved = true;
			
			let _x = this.x;
			let _x2 = this.x + this.w;
			let _y = this.y;
			let _y2 = this.y + this.h;
				
			let dependences = [];
			
			const HandleEntity = ( e )=>
			{
				if ( entity_once.has( e ) )
				{
				}
				else
				if ( this.DoesOverlapWith( e ) )
				{
					if ( e === this )
					throw new Error();

					if ( e.IsPlayerClass() )
					if ( e._socket )
					{
						// We probably will experience a lot of issues trying to wake up playable characters, unless...
						this.remove();
						return true;
					}

					entity_once.add( e );

					_x = Math.floor( Math.min( _x, e.x + e._hitbox_x1 ) / 16 ) * 16;
					_x2 = Math.ceil( Math.max( _x2, e.x + e._hitbox_x2 ) / 16 ) * 16;
					_y = Math.floor( Math.min( _y, e.y + e._hitbox_y1 ) / 16 ) * 16;
					_y2 = Math.ceil( Math.max( _y2, e.y + e._hitbox_y2 ) / 16 ) * 16;

					if ( _y > this.y )
					throw new Error();

					this.x = _x;
					this.w = _x2 - _x;
					this.y = _y;
					this.h = _y2 - _y;
					this._hitbox_x2 = this.w;
					this._hitbox_y2 = this.h;
					
					for ( let prop in e )
					{
						if ( e[ prop ] instanceof sdEntity )
						{
							dependences.push( e[ prop ] );
						}
					}

					// TODO: Lookup pointers in properties as well as try to include crystal/turret ranges

					bounds_moved = true;
				}
				return false;
			};
			
			while ( bounds_moved )
			{
				bounds_moved = false;

				let cells = sdWorld.GetCellsInRect( _x, _y, _x2, _y2 );

				for ( let i = 0; i < cells.length; i++ )
				{
					let arr = cells[ i ].arr;

					for ( let i2 = 0; i2 < arr.length; i2++ )
					{
						if ( HandleEntity( arr[ i2 ] ) )
						return;
					}
				}
				
				while ( dependences.length > 0 )
				{
					if ( HandleEntity( dependences.pop() ) )
					return;
				}
			}
			
			let snapshots = [];
			let current_frame = globalThis.GetFrame();
			
			this._to_remove_temp_set = entity_once;

			entity_once.forEach( ( e )=>
			{
				if ( e !== this )
				{
					snapshots.push( e.GetSnapshot( current_frame, true ) );
					
					if ( e.is( sdDeepSleep ) )
					{
						this._my_hash_list.push( ...e._my_hash_list );
					}
					else
					if ( e.IsPlayerClass() && e._my_hash !== undefined )
					{
						this._my_hash_list.push( e._my_hash );
					}
				}
			});
			entity_once.forEach( ( e )=>
			{
				if ( e !== this )
				{
					e.remove();
					e._broken = false;
					
					e._remove(); // Instant remove is required or else it won't be able to spawn same entities from snapshot?
					
					sdLongRangeTeleport.teleported_items.add( e );
				}
			});
			
			this._to_remove_temp_set = null;
			
			this._snapshots_str = JSON.stringify( snapshots );

			sdWorld.UpdateHashPosition( this, false, false ); // Prevent inersection with other ones // Won't call onMovementInRange
			
			//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
			this._update_version++;
			
			
			//trace( '...success!' );
		}
	}
	MeasureMatterCost()
	{
		return Infinity;
	}
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 10; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		if ( sdWorld.time % 1000 < 500 )
		{
			ctx.globalAlpha = 0.4;
		}
		else
		{
			ctx.globalAlpha = 0.38;
		}
		
		ctx.fillStyle = '#000000';
		ctx.fillRect( 1, 1, this._hitbox_x2-2, this._hitbox_y2-2 );
		
		ctx.fillStyle = '#aaaaff';
		
		if ( sdWorld.time < this.ping_time + 200 )
		{
			ctx.fillStyle = '#0000ff';
		}
		
		ctx.fillRect( 0, 0, this._hitbox_x2, this._hitbox_y2 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		
		ctx.font = "7px Verdana";
		ctx.textAlign = 'left';
		
		let t = 
			( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD ) ? 'Unspawned' :
			( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD ) ? 'Hibernated' :
			'type ' + this.type;
		
		ctx.fillStyle = '#ffffff';
		ctx.fillText( t, 2, 8 );
	}
	DrawFG( ctx, attached )
	{
		this.Draw( ctx, attached );
	}
}

export default sdDeepSleep;