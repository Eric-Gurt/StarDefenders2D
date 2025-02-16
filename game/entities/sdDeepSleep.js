/*

	Areas that store entities in form of snapshots, can store on a disk as well?

	This is a heavy over-optimization approach...

	Most likely it would merge whole big bases into one big chunk, which is perfectly fine I guess.

	Command to count deep sleep areas by type:

		let c = {};
		for ( let i = 0; i < sdWorld.entity_classes.sdDeepSleep.cells.length; i++ )
		c[ sdWorld.entity_classes.sdDeepSleep.cells[ i ].type ] = ( c[ sdWorld.entity_classes.sdDeepSleep.cells[ i ].type ] || 0 ) + 1;
		trace( c );


	Command to track memory (for watch):

		if ( sdWorld.time > (globalThis.log_time||0) ) { globalThis.log_time=sdWorld.time + 1000 * 10; trace( 'entities: ' + sdWorld.entity_classes.sdEntity.entities.length + ' / active: ' + sdWorld.entity_classes.sdEntity.active_entities.length + ' / cells: ' + sdWorld.entity_classes.sdDeepSleep.cells.length ) }


	Command to trigger all cell saving to disk:

		for ( let i = 0; i < sdWorld.entity_classes.sdDeepSleep.cells.length; i++ )
		{
			sdWorld.entity_classes.sdDeepSleep.cells[ i ]._will_hibernate_on = 0;
			sdWorld.entity_classes.sdDeepSleep.cells[ i ]._will_be_written_to_disk = 0;
		}
		for ( let i = 0; i < sdWorld.entity_classes.sdDeepSleep.cells.length; i++ )
		sdWorld.entity_classes.sdDeepSleep.GlobalThink( 1 );

		sdWorld.SaveSnapshotAutoPath();


	Command to check sdDeepSleep overlaps with any other entities + blocks vs blocks overlaps:

		let c = new Set(); 
		let extra_block_block_overaps = new Set();
		for ( let [ key, cell ] of sdWorld.world_hash_positions )
		{
			let arr = cell.arr;

			let hibernated_or_unspawned_deep_sleep = [];
			let block = [];

			for ( let i = 0; i < arr.length; i++ )
			{
				let e = arr[ i ];
				if ( e.is( sdWorld.entity_classes.sdDeepSleep ) )
				{
					if ( e.type <= 1 )
					hibernated_or_unspawned_deep_sleep.push( e );
				}
				else
				//if ( e.is( sdWorld.entity_classes.sdBlock ) )
				block.push( e );
			}

			if ( hibernated_or_unspawned_deep_sleep.length > 0 && block.length > 0 )
			{
				for ( let i = 0; i < hibernated_or_unspawned_deep_sleep.length; i++ )
				{
					for ( let i2 = 0; i2 < block.length; i2++ )
					{
						if ( hibernated_or_unspawned_deep_sleep[ i ].DoesOverlapWith( block[ i2 ], -0.001 ) )
						c.add( block[ i2 ] );
					}
				}
			}

            if ( block.length > 0 )
            {
                
				for ( let i = 0; i < block.length; i++ )
                if ( block[ i ].is( sdWorld.entity_classes.sdBlock ) )
                for ( let i2 = 0; i2 < block.length; i2++ )
                {
                    if ( block[ i2 ].is( sdWorld.entity_classes.sdBlock ) )
                    if ( block[ i ].DoesOverlapWith( block[ i2 ], -0.001 ) )
					extra_block_block_overaps.add( block[ i2 ] );
                }
            }
		}
		let r = { 'ents_overlapping_deep_sleep':c, 'blocks_that_overlap_other_blocks':extra_block_block_overaps };
		r;




	TODO: Had weird bug that caused rift portal overcharge rollback as well as 5k crystal resapwn which I did put into rift... Reboots did not happen. I doubt another 5k would spawn? It could be just GSPEED-unscaled sdRift logic though.

	TODO: Maybe apply compression to chunk files? Though it would slow-down their loading

	TODO: Make renaming from temp to actual directories synced - just in case if world snapshot saving will cause crash

	TODO: Make sure sdDeepSleep.cells count does not grow indefinitely

	TODO: Most probably sdRescueTeleport and sdBeacon will have to be taught to hibernate as well... Player connection might wake them up, onShapshotDecoded might wake them up, but should be aware of cases when sdTask tracking sdBeacon will get removed

	TODO: Add timewarp saves

	TODO: Consider some shrink-down logic, especially for chunks that do not contain user-created entities? Somehow... Probably impossible - chunks might have rare items or even genearated alien bases in them

*/
/* global globalThis, Infinity */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';
import sdWeather from './sdWeather.js';
import sdGrass from './sdGrass.js';
import sdTurret from './sdTurret.js';
import sdCrystal from './sdCrystal.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdAntigravity from './sdAntigravity.js';
import sdDoor from './sdDoor.js';
import sdBG from './sdBG.js';
import sdSteeringWheel from './sdSteeringWheel.js';
import sdThruster from './sdThruster.js';
import sdRescueTeleport from './sdRescueTeleport.js';
import sdBeacon from './sdBeacon.js';
import sdHover from './sdHover.js';
import sdTzyrgAbsorber from './sdTzyrgAbsorber.js';
import sdWanderer from './sdWanderer.js';
import sdBullet from './sdBullet.js';
import sdCable from './sdCable.js';

import sdRenderer from '../client/sdRenderer.js';

let fs = null;

class sdDeepSleep extends sdEntity
{
	static init_class()
	{
		sdDeepSleep.debug = false; // Alters timings
		
		sdDeepSleep.debug_pause_any_deep_sleep_logic = false;
		
		sdDeepSleep.debug_wake_up_sleep_refuse_reasons = false;
		
		sdDeepSleep.debug_dependences = false;
		
		sdDeepSleep.debug_entity_count = false;
		
		sdDeepSleep.debug_big_area_increments = false;
		
		sdDeepSleep.debug_times = false;
		
		sdDeepSleep.debug_track_entity_stucking_on_hibernated_deep_sleep_areas = false;
		sdDeepSleep.track_entity_stucking_ignore_temporary = false;
		
		sdDeepSleep.debug_cell = false;
		sdDeepSleep.debug_cell_x = -7936;
		sdDeepSleep.debug_cell_y = 768;
		
		fs = globalThis.fs;
		
		if ( sdDeepSleep.debug || sdDeepSleep.debug_cell || sdDeepSleep.debug_dependences || sdDeepSleep.debug_big_area_increments || sdDeepSleep.debug_times || sdDeepSleep.debug_entity_count || sdDeepSleep.debug_wake_up_sleep_refuse_reasons || sdDeepSleep.debug_pause_any_deep_sleep_logic || sdDeepSleep.debug_track_entity_stucking_on_hibernated_deep_sleep_areas )
		{
			trace( 'WARNING: Running server with sdDeepSleep\'s debug values enabled' );
		}
		
		sdDeepSleep.TYPE_UNSPAWNED_WORLD = 0; // Whenever something touches it or some player sees it - spawns fresh world at the area
		sdDeepSleep.TYPE_HIBERNATED_WORLD = 1; // Whenever something touches it or some player sees it - spawns previously hibernated entities
		sdDeepSleep.TYPE_SCHEDULED_SLEEP = 2; // These will be created at areas that will be scheduled to sleep soon unless nobody interacts with them
		sdDeepSleep.TYPE_DO_NOT_HIBERNATE = 3; // Hibernation attempted but there was an entity that wasn't allowing hibernation - should prevent GlobalThink from scheduling hibernation there and waste a lot of performance
		
		sdDeepSleep.cells = [];
		sdDeepSleep.loopie = 0;
		
		sdDeepSleep.scheduled_saves = new Set();
		sdDeepSleep.scheduled_deletions = new Set();
		
		//sdDeepSleep.normal_cell_size = 2048; // Half a second lags can happen
		sdDeepSleep.normal_cell_size = 256; // Maybe this is actually more optimal
		
		sdDeepSleep.inception_catcher = 0;
		sdDeepSleep.inception_catcher_warning_level = 32;
		sdDeepSleep.inception_catcher_give_up_level = 512;
		sdDeepSleep.inception_catcher_next_warning_allowed_in = 0;
		
		sdDeepSleep.dependence_distance_max = 500; // Anti-dependence hell measure
		
		sdDeepSleep.time_budget = 0; // If there was a lag spike - some of later sdDeepSleep updates will be ignored for some amount of time
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	ThreatAsSolid() // Test done by some entities, solid possibility might prevent water from flowing through hibernated/not/spawned sdSleepAreas
	{
		return ( !this._is_being_removed && this.type !== sdDeepSleep.TYPE_SCHEDULED_SLEEP && this.type !== sdDeepSleep.TYPE_DO_NOT_HIBERNATE );
	}
	
	static init()
	{
		if ( sdWorld.server_config.aggressive_hibernation )
		if ( sdWorld.is_server && !sdWorld.is_singleplayer )
		if ( !fs.existsSync( globalThis.chunks_folder ) )
		{
			trace( 'Making directory: ' + globalThis.chunks_folder );
			fs.mkdirSync( globalThis.chunks_folder );
		}
		
		/*if ( sdWorld.server_config.remove_irrelevant_aggressive_hibernation_files ) This does not make sense because it will not include deep sleeps within deep sleeps.
		{
		}*/
	}
	
	static WakeUpByArrayAndValue( array_name, value )
	{
		for ( let i = 0; i < sdDeepSleep.cells.length; i++ )
		{
			let cell = sdDeepSleep.cells[ i ];

			if ( cell.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
			if ( cell[ array_name ].indexOf( value ) !== -1 )
			{
				cell.WakeUpArea( false, null, true ); // Results into removal

				if ( cell._is_being_removed )
				{
					i--;
					continue;
				}
			}
		}
	}
	static GlobalThink( GSPEED )
	{
		if ( sdWorld.paused && sdWorld.is_singleplayer )
		return;
	
		if ( sdDeepSleep.debug_pause_any_deep_sleep_logic )
		return;
		
		//return; // Hack
		let iters = Math.max(
			sdDeepSleep.debug ? 
				sdDeepSleep.cells.length * 0.01 : 
				sdDeepSleep.cells.length * 0.001, 
			1 
		);
		
		sdDeepSleep.time_budget = Math.min( 3, sdDeepSleep.time_budget + 3 );
		
		if ( sdWorld.is_server )
		while ( iters-- > 0 && sdDeepSleep.time_budget > 0 )
		{
			sdDeepSleep.inception_catcher = 0;
			
			let t = Date.now();
		
			if ( sdWorld.server_config.aggressive_hibernation )
			{
				//if ( 0 ) // Hack
				if ( sdEntity.entities.length > 0 )
				{
					let i = Math.floor( Math.random() * sdEntity.entities.length );

					let e = sdEntity.entities[ i ];

					//if ( !e.is( sdDeepSleep ) )
					if ( e._is_bg_entity !== 10 )
					if ( !e._is_being_removed )
					{
						let x = Math.floor( ( e.x + e._hitbox_x1 ) / sdDeepSleep.normal_cell_size ) * sdDeepSleep.normal_cell_size;
						let y = Math.floor( ( e.y + e._hitbox_y1 ) / sdDeepSleep.normal_cell_size ) * sdDeepSleep.normal_cell_size;
						let w = sdDeepSleep.normal_cell_size;
						let h = sdDeepSleep.normal_cell_size;


						/*let ok = true;
						for ( let i2 = 0; i2 < sdDeepSleep.cells.length; i2++ )
						if ( cell !== sdDeepSleep.cells[ i2 ] )
						if ( cell.DoesOverlapWith( sdDeepSleep.cells[ i2 ] ) )
						{
							ok = false;
							break;
						}*/
						let ok = !sdWorld.CheckSolidDeepSleepExistsAtBox(
							x,
							y,
							x + w,
							y + h,
							null,
							true
						);

						if ( ok )
						{
							let cell = new sdDeepSleep({
								x: x,
								y: y,
								w: w,
								h: h,
								type: sdDeepSleep.TYPE_SCHEDULED_SLEEP
							});

							sdEntity.entities.push( cell );
							
							sdWorld.UpdateHashPosition( cell, false, false );
						}
						else
						{
							//cell.remove();
						}
					}
				}

				if ( sdDeepSleep.cells.length > 0 )
				{
					sdDeepSleep.loopie = ( sdDeepSleep.loopie + 1 ) % sdDeepSleep.cells.length;

					let cell = sdDeepSleep.cells[ sdDeepSleep.loopie ];
					
					//if ( !cell._is_being_removed ) Probably can't happen
					{
						if ( cell.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
						{
						}
						else
						if ( cell.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
						{
							// Better to do it in sync with world snapshot saves...
							
							// Moved for consistency as well
						}
						else
						if ( cell.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP )
						{
							if ( sdWorld.time > cell._will_hibernate_on )
							{
								cell.type = sdDeepSleep.TYPE_HIBERNATED_WORLD;
								cell.onBuilt();
								cell._update_version++;
							}
						}
						else
						if ( cell.type === sdDeepSleep.TYPE_DO_NOT_HIBERNATE )
						{
							if ( sdWorld.time > cell._will_hibernate_on )
							{
								cell.remove();
							}
						}
						else
						{
						}
					}
				}
			}
			else
			{
				for ( let i = 0; i < sdDeepSleep.cells.length; i++ )
				{
					let cell = sdDeepSleep.cells[ i ];
					
					trace( 'Waking up/removing sdDeepSleep[ '+i+' ] object due to aggressive_hibernation being switched off' );
					
					if ( cell.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
					cell.WakeUpArea( false, null, true );
					else
					if ( cell.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
					cell.WakeUpArea( false, null, true );
					else
					if ( cell.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP )
					cell.remove();
					else
					if ( cell.type === sdDeepSleep.TYPE_DO_NOT_HIBERNATE )
					cell.remove();
					else
					debugger;
				}
			}
			let t2 = Date.now();
			
			sdDeepSleep.time_budget -= t2 - t;
		}
	}
	/*HasSnapshotsOfValue()
	{
		return true;
	}*/
	static SaveScheduledChunks()
	{
		let promises = [];
		
		for ( let i = 0; i < sdDeepSleep.cells.length; i++ )
		{
			let cell = sdDeepSleep.cells[ i ];
			
			if ( cell.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
			{
				if ( sdWorld.time > cell._will_be_written_to_disk )
				{
					//if ( cell._snapshots_filename === null )
					if ( !cell._file_exists )
					if ( sdWorld.is_server )//&& !sdWorld.is_singleplayer )
					sdDeepSleep.scheduled_saves.add( cell );
				}
				
				if ( sdWorld.time > cell._will_become_unspawned )
				{
					cell._snapshots_str = '';
					cell._snapshots_objects = null;
					cell._last_obj_str_reset_reason = 11;

					if ( sdWorld.is_server )//&& !sdWorld.is_singleplayer )
					{
						sdDeepSleep.scheduled_deletions.add( cell );
						sdDeepSleep.scheduled_saves.delete( cell );
					}

					cell.type = sdDeepSleep.TYPE_UNSPAWNED_WORLD;
					cell._update_version++;
					continue;
				}
			}
		}
		
		sdDeepSleep.scheduled_saves.forEach( ( cell )=>
		{
			promises.push( cell.SaveToFile() );
		});
		sdDeepSleep.scheduled_saves.clear();
		
		sdDeepSleep.scheduled_deletions.forEach( ( cell )=>
		{
			promises.push( cell.DeleteFile() );
		});
		sdDeepSleep.scheduled_deletions.clear();
		
		return promises;
	}

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.w; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.h; }
	
	get hard_collision()
	{ return this.ThreatAsSolid(); }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	IsVisible( observer_entity )
	{
		return ( !this._is_being_removed );
	}
	
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		// Ignore god-mode player who is in debug mode
		if ( sdDeepSleep.debug )
		if ( character._god )
		return;
		
		this.WakeUpArea( true, character );
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		// Ignore god-mode player who is in debug mode
		if ( sdDeepSleep.debug )
		if ( from_entity.IsPlayerClass() )
		if ( from_entity._god )
		return;
	
		if ( this._to_remove_temp_set )
		//if ( this._to_remove_temp_set.has( from_entity ) )
		if ( this._to_remove_temp_set.indexOf( from_entity ) !== -1 )
		{
			return;
		}
		
		if ( from_entity.is( sdDeepSleep ) )
		return;
	
		if ( from_entity.is( sdWanderer ) )
		return; // Don't let bg ents wake up deep sleep cells
		
		//this.ping_time = sdWorld.time;
		
		//trace( 'Movement from ', from_entity );
		//debugger;
		
		if ( from_entity.is( sdBullet ) ) // Bullet?
		{
			if ( !from_entity._owner )
			return;
			else
			{
				if ( !from_entity._owner.is( sdCharacter ) ) // Is this not a character's bullet?
				return;
				else
				if ( !from_entity._owner._socket ) // Is this not a player's bullet?
				return;
			}
		}
		
		
		this.WakeUpArea( true, from_entity );
	}
	WakeUpArea( from_movement_or_vision=false, initiator=null, forced=false )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( sdDeepSleep.debug_pause_any_deep_sleep_logic )
		return;
	
		if ( sdDeepSleep.debug_cell && this.x === sdDeepSleep.debug_cell_x && this.y === sdDeepSleep.debug_cell_y )
		trace( 'WakeUpArea()', from_movement_or_vision, initiator, { _net_id:this._net_id, w:this.w, h:this.h, type:this.type, _file_exists:this._file_exists, _snapshots_str:this._snapshots_str.length, _is_being_removed:this._is_being_removed } );
	
		if ( forced || ( from_movement_or_vision && initiator && initiator.IsPlayerClass() && initiator._socket ) )
		{
		}
		else
		return;
	
		if ( this.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP )
		{
			//if ( from_movement_or_vision && initiator && initiator.IsPlayerClass() && initiator._socket )
			//{
				this.remove();
			//}
			
			return; // These can't be waken up nor should be removed unless playe sees or interacts with them
		}
	
		if ( this._is_being_removed )
		return;
		
		if ( sdDeepSleep.inception_catcher > sdDeepSleep.inception_catcher_warning_level )
		{
			if ( sdWorld.time > sdDeepSleep.inception_catcher_next_warning_allowed_in )
			{
				sdDeepSleep.inception_catcher_next_warning_allowed_in = sdWorld.time + 1000 * 60 * 5; 
				console.warn( 'WakeUpArea was called over 32 times per frame - it can be bad for server performance' );
			}
			
		
			if ( sdDeepSleep.inception_catcher > sdDeepSleep.inception_catcher_give_up_level )
			{
				console.warn( 'WakeUpArea was called over 512 times per frame - some crazy deep sleep inception has happened?' );
				return;
			}
		}
	
		sdDeepSleep.inception_catcher++;

		if ( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
		{
			if ( sdDeepSleep.debug_wake_up_sleep_refuse_reasons )
			{
				trace( 'sdDeepSleep generates world: TYPE_UNSPAWNED_WORLD generated due to (from_movement_or_vision='+from_movement_or_vision+', initiator=', initiator, ', potential_initiator=', sdWorld.last_simulated_entity, ')', this.x, this.y, this.x+this.w, this.y+this.h );
			}
		
			this.remove();
		
			let x2 = this.x + this.w;
			let y2 = this.y + this.h;

			sdDeepSleep.track_entity_stucking_ignore_temporary = true;
			{
				for ( let x = this.x; x < x2; x += 16 )
				for ( let y = this.y; y < y2; y += 16 )
				{
					let block = sdWorld.AttemptWorldBlockSpawn( x, y, false );

					if ( block )
					sdWorld.UpdateHashPosition( block, false, true ); // Last must be true or else bullets will miss new entities for a frame // Won't call onMovementInRange
				}
			}
			sdDeepSleep.track_entity_stucking_ignore_temporary = false;
		}
		else
		if ( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
		{
			/*if ( this._is_being_removed )
			{
				console.warn( 'Waking up a removed area?' );
				debugger;
				return;
			}*/
			
			if ( sdDeepSleep.debug_wake_up_sleep_refuse_reasons )
			trace( 'sdDeepSleep[ '+this._net_id+' ] woken up: TYPE_HIBERNATED_WORLD wakes up due to (from_movement_or_vision='+from_movement_or_vision+', initiator=', initiator, ', potential_initiator=', sdWorld.last_simulated_entity ,')', this.x, this.y, this.x+this.w, this.y+this.h );
			
			let load_attempted = false;
			if ( this._file_exists )
			{
				load_attempted = true;
				this.LoadFromFile();
			}
			
			let snapshots = this._snapshots_objects;
			let _snapshots_str = this._snapshots_str;
		
			this.remove();
			
			sdDeepSleep.scheduled_deletions.add( this );
			sdDeepSleep.scheduled_saves.delete( this );
			

			if ( sdDeepSleep.debug_cell && this.x === sdDeepSleep.debug_cell_x && this.y === sdDeepSleep.debug_cell_y )
			trace( 'WakeUpArea-doing-dehibernation()', from_movement_or_vision, initiator, { _net_id:this._net_id, w:this.w, h:this.h, type:this.type, _file_exists:this._file_exists, _snapshots_str:this._snapshots_str.length, _is_being_removed:this._is_being_removed } );

			
			if ( _snapshots_str === '' && snapshots === null ) // onBuild was not called yet..?
			{
				console.warn( 'Empty snapshot being decoded ( file load attempted: '+load_attempted+' )' );
				debugger;
				
				for ( let x = 0; x < this.w; x += 16 )
				for ( let y = 0; y < this.h; y += 16 )
				{
					let e = new sdBlock({
						x: this.x + x,
						y: this.y + y,
						width: 16,
						height: 16,
						material: sdBlock.MATERIAL_BUGGED_CHUNK,
						texture_id: 0
					});
					sdEntity.entities.push( e );

					e._hmax = 1;
					e._hea = 1;
				}
				
				return;
			}
			
			if ( !snapshots )
			{
				snapshots = JSON.parse( _snapshots_str );
			}
			
			_snapshots_str = '';
			this._snapshots_str = '';
			this._snapshots_objects = null;
			this._last_obj_str_reset_reason = 22;
			
			sdWorld.unresolved_entity_pointers = [];
			
			//globalThis.EnforceChangeLog( sdWorld, 'unresolved_entity_pointers' );
			
			let ents = [];
		
			for ( let i = 0; i < snapshots.length; i++ )
			{
				let snapshot = snapshots[ i ];
				
				/*if ( snapshot._class === 'sdGrass' )
				{
					debugger;
				}*/
				
				let ent = sdEntity.GetObjectFromSnapshot( snapshot );
				
				/*if ( ent.is( sdGrass ) )
				{
					debugger;
				}*/
				
				/*if ( !ent._is_being_removed ) Move below as it might auto-activate deep sleep areas inisde of this deep sleep area
				{
					//if ( ent._affected_hash_arrays.length > 0 ) // Easier than checking for hiberstates
					sdWorld.UpdateHashPosition( ent, false, true ); // Last must be true or else bullets will miss new entities for a frame
				
					//sdWorld.UpdateHashPosition( ent, false, false ); // Won't call onMovementInRange
				}*/
				
				if ( ent ) // Happens in singleplayer sometimes?
				ents.push( ent );
			}
			
			//sdWorld.unresolved_entity_pointers_unenforce();
			
			sdWorld.SolveUnresolvedEntityPointers();
			sdWorld.unresolved_entity_pointers = null;
			
			for ( let i = 0; i < ents.length; i++ )
			{
				let ent = ents[ i ];
				
				if ( !ent._is_being_removed )
				{
					/*if ( ent.is( sdHover ) )
					{
						if ( !ent.driver0 )
						{
							trace( 'Error?' );
							debugger;
						}
					}*/
					
					if ( ent.is( sdGrass ) )
					{
						if ( ent._block )
						ent._block.ValidatePlants( ent );
						else
						{
							ent.remove();
						}
						//debugger;
					}
					
					//if ( ent._affected_hash_arrays.length > 0 ) // Easier than checking for hiberstates
					sdWorld.UpdateHashPosition( ent, false, true ); // Last must be true or else bullets will miss new entities for a frame
				
					//sdWorld.UpdateHashPosition( ent, false, false ); // Won't call onMovementInRange
				}
			}
		}
		
		if ( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD ||
			 this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
		{
			if ( sdWorld.server_config.run_patch_overlap )
			for ( let i = 0; i < this._affected_hash_arrays.length; i++ )
			sdDeepSleep.PatchOverlapInCell( this._affected_hash_arrays[ i ] );
		}
		
		if ( sdDeepSleep.debug_wake_up_sleep_refuse_reasons )
		{
			if ( sdWorld.last_simulated_entity )
			{
				/*if ( sdWorld.last_simulated_entity.GetClass() === 'sdAsteroid' )
				debugger;*/
			
				if ( initiator )
				{
					/*if ( initiator.GetClass() === 'sdBG' )
					if ( sdWorld.last_simulated_entity.GetClass() === 'sdGun' )
					debugger;

					if ( initiator.GetClass() === 'sdBG' )
					if ( sdWorld.last_simulated_entity.GetClass() === 'sdDrone' )
					debugger;*/
				}
			}
			
			if ( initiator )
			{
				/*if ( initiator.GetClass() === 'sdBG' )
				debugger;*/
			}
		}
	}
	
	IsAdminEntity() // Influences remover gun hit test
	{ return true; }
	
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Override default IsTargetable because it will return false in case of .IsAdminEntity
	{
		return true;
	}
	
	static DeleteAllFiles()
	{
		let directory = globalThis.chunks_folder + '/';
		
		if ( fs.rmSync )
		fs.rmSync( directory, { recursive: true, maxRetries: 10, retryDelay: 100 } );
		else
		fs.rmdirSync( directory, { recursive: true, maxRetries: 10, retryDelay: 100 } );
	}
	
	DeleteFile()// forced=false )
	{
		let promise = new Promise( ( resolve, reject )=>
		{
			//if ( this._snapshots_filename === null )
			//return;

			//if ( this._loaded_or_deleted && !forced )
			//return;

			//this._loaded_or_deleted = true;

			if ( this._file_exists )
			{
				fs.unlink( globalThis.chunks_folder + '/' + this._snapshots_filename, ( err )=>
				{
					if ( err )
					trace( 'Tried deleting chunk file but it does not exist' + err );

					this._file_exists = false;
					
					resolve();
				});
			}
			else
			resolve();
		});
		
		return promise;
	}
	
	SaveToFile()
	{
		this._snapshots_filename = this._net_id + '.v';
		
		let promise = new Promise( ( resolve, reject )=>
		{
			if ( this._snapshots_str === '' && this._snapshots_objects !== null )
			{
				this._snapshots_str = JSON.stringify( this._snapshots_objects );
			}
			
			if ( sdWorld.is_singleplayer )
			{
				fs.writeFile( globalThis.chunks_folder + '/' + this._snapshots_filename, this._snapshots_str, ( err )=> 
				{
					if ( err )
					trace( 'Unable to save chunk data to final file: ' + err );

					this._file_exists = true;

					this._snapshots_str = '';
					this._snapshots_objects = null;
					this._last_obj_str_reset_reason = 33;

					resolve();
				});
			}
			else
			{
				fs.writeFile( globalThis.chunks_folder + '/' + 'TEMP_' + this._snapshots_filename, this._snapshots_str, ( err )=> 
				{
					if ( err )
					trace( 'Unable to save chunk data to temp file: ' + err );

					fs.rename( globalThis.chunks_folder + '/' + 'TEMP_' + this._snapshots_filename, globalThis.chunks_folder + '/' + this._snapshots_filename, ( err )=>
					{
						if ( err )
						trace( 'Unable to rename TEMP chunk data file into proper snapshot file: ' + err );

						this._file_exists = true;

						this._snapshots_str = '';
						this._snapshots_objects = null;
						this._last_obj_str_reset_reason = 33;

						resolve();
					});
				});
			}
		});
		
		return promise;
	}
	
	LoadFromFile()
	{
		if ( this._file_exists )
		{
			try
			{
				if ( sdDeepSleep.debug_cell && this.x === sdDeepSleep.debug_cell_x && this.y === sdDeepSleep.debug_cell_y )
				trace( 'LoadFromFile()', { _net_id:this._net_id, w:this.w, h:this.h, type:this.type, _file_exists:this._file_exists, _snapshots_str:this._snapshots_str.length } );
				
				this._snapshots_str = fs.readFileSync( globalThis.chunks_folder + '/' + this._snapshots_filename, 'utf8' );
				this._snapshots_objects = null; // Stays null for now, later decoded
				this._last_obj_str_reset_reason = 44;
				
				sdDeepSleep.scheduled_deletions.add( this );
				sdDeepSleep.scheduled_saves.delete( this );
			}
			catch ( e )
			{
				trace( 'Chunk file was not found! You\'ll see big breakable red block where it happened. Expected path: ' + globalThis.chunks_folder + '/' + this._snapshots_filename + '\nError: ' + e );
			}
		}
		else
		{
			// Won't happen
		}
	}
	
	ClearAllPropertiesOnRemove() // Deletion won't work with this
	{
		return false;
	}
	GetSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null )
	{
		let cache;
		
		if ( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD ) // These extremely require optimizations as saving can take 2 seconds
		{
			if ( !this._snapshot_cache )
			{
				this._snapshot_cache = { _net_id:this._net_id, _class:this.GetClass(), x:this.x, y:this.y, w:this.w, h:this.h, type:this.type };
			}
		
			cache = this._snapshot_cache;
				
			//if ( cache.x !== this.x || cache.y !== this.y )
			//throw new Error();
		}
		else
		{
			if ( save_as_much_as_possible )
			{
				if ( !this._snapshot_cache )
				this._snapshot_cache = { _net_id:this._net_id, _class:this.GetClass(), x:this.x, y:this.y, w:this.w, h:this.h, r:this.r };
			
				cache = this._snapshot_cache;
			
				cache._will_hibernate_on = this._will_hibernate_on;
				cache._will_be_written_to_disk = this._will_be_written_to_disk;
				cache._will_become_unspawned = this._will_become_unspawned;

				cache._snapshots_str = this._snapshots_str;

				cache._snapshots_objects = this._snapshots_objects;

				cache._snapshots_filename = this._snapshots_filename;
				cache._file_exists = this._file_exists;

				cache._my_hash_list = this._my_hash_list;
				cache._rtp_biometries = this._rtp_biometries;
				cache._beacon_net_ids = this._beacon_net_ids;
			}
			else
			{
				if ( !this._snapshot_cache_public )
				{
					this._snapshot_cache_public = { _net_id:this._net_id, _class:this.GetClass(), x:this.x, y:this.y, w:this.w, h:this.h, r:this.r };
				}
			
				cache = this._snapshot_cache_public;
				
				//if ( cache.x !== this.x || cache.y !== this.y )
				//throw new Error();
			}
		
			cache.type = this.type;
			
			//return cache;
			//return sdEntity.prototype.GetSnapshot.call( this, current_frame, save_as_much_as_possible, observer_entity );
		}
		
		if ( this._is_being_removed )
		cache._is_being_removed = this._is_being_removed;
	
		cache.x = this.x;
		cache.y = this.y;
		cache.w = this.w;
		cache.h = this.h;
	
		//if ( !save_as_much_as_possible )
		cache = Object.assign( {}, cache ); // Some mystery is happening to this object

		return cache;
	}
	
	IsHittableWithAdminTools() // Admin tool for removal
	{ return false; }
	
	constructor( params )
	{
		super( params );
		
		this._snapshot_cache_public = null;
		
		this.w = params.w || 512;
		this.h = params.h || 512;
		
		if ( this.w <= 0 || isNaN( this.w ) )
		throw new Error();
		
		if ( this.h <= 0 || isNaN( this.h ) )
		throw new Error();
		
		this.type = params.type || sdDeepSleep.TYPE_UNSPAWNED_WORLD;
		
		if ( sdDeepSleep.debug_cell && this.x === sdDeepSleep.debug_cell_x && this.y === sdDeepSleep.debug_cell_y )
		trace( 'constructor()', { _net_id:this._net_id, w:this.w, h:this.h, type:this.type } );
	
		this.r = '';

		if ( sdDeepSleep.debug )
		{
			// Test values
			this._will_hibernate_on = sdWorld.time + 5000; // For sdDeepSleep.TYPE_SCHEDULED_SLEEP only
			this._will_be_written_to_disk = sdWorld.time + 10000; // In a day
			this._will_become_unspawned = sdWorld.time + 1000 * 60 * 60 * 24 * 30 * 12 * 5; // Full removal in 5 years?
		}
		else
		{
			// Proper values for live server
			this._will_hibernate_on = sdWorld.time + 1000 * 60 * 5; // For sdDeepSleep.TYPE_SCHEDULED_SLEEP only
			this._will_be_written_to_disk = sdWorld.time + 1000 * 60 * 30; // 30 minutes. Makes sense to do it frequently as it happens on snapshot save now only
			this._will_become_unspawned = sdWorld.time + 1000 * 60 * 60 * 24 * 30;// * 12 * 5; // Full removal in 5 years? UPD: 1 month now
		}
		this._snapshots_str = '';
		this._snapshots_objects = null; // Sometimes can be there instead of _snapshots_str - these are faster to use than to stringify/parse
		
		this._last_obj_str_reset_reason = -1;
		
		if ( sdDeepSleep.debug_dependences )
		this._made_at = globalThis.getStackTrace();
		
		this._snapshots_filename = null; // null means it was never saved to disk yet
		this._file_exists = false;
		
		this._to_remove_temp_set = null;
		
		this._my_hash_list = []; // Disconnected player hashes are stored here
		this._rtp_biometries = [];
		this._beacon_net_ids = [];
		
		sdDeepSleep.cells.push( this );
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_my_hash_list' ) return true;
		if ( prop === '_snapshots_str' ) return true;
		if ( prop === '_snapshots_objects' ) return true;
		
		return false;
	}
	onBuilt()
	{
		//trace( 'onBuilt called for', this );
		
		if ( sdWorld.is_server )
		{
			/*let test_case = false;
			
			// Why is this one made but empty?
			if ( this.x === -1536 )
			if ( this.y === -256 )
			{
				test_case = true;
				debugger;
			}*/
		
		
			if ( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
			{
				let t = sdDeepSleep.debug_times ? Date.now() : 0;
				let serialization_per_class_times = sdDeepSleep.debug_times ? {} : 0;
				
				let merge_into_existing_cell = null;

				const ProvidePerformanceReport = sdDeepSleep.debug_times ? ( aborted )=>
				{
					let t2 = Date.now();

					if ( t2 - t > 50 )
					{
						trace( 'sdDeepSleep.onBuilt time: ' + ( t2 - t ) + ( aborted ? ' (aborted)' : '' ) );
						trace( 'Serialization times by class:', serialization_per_class_times );
						debugger;
					}

				} : ()=>{};
				
				const HibernationAborted = ( reason_object=null, nothing_to_hibernate=false )=>
				{
					ProvidePerformanceReport( true );
					
					//this.remove();
					
					if ( merge_into_existing_cell )
					{
						let x1 = Math.min( this.x, merge_into_existing_cell.x );
						let y1 = Math.min( this.y, merge_into_existing_cell.y );
						let x2 = Math.max( this.x + this.w, merge_into_existing_cell.x + merge_into_existing_cell.w );
						let y2 = Math.max( this.y + this.h, merge_into_existing_cell.y + merge_into_existing_cell.h );
						
						merge_into_existing_cell.x = x1;
						merge_into_existing_cell.y = y1;
						merge_into_existing_cell.w = x2 - x1;
						merge_into_existing_cell.h = y2 - y1;
						sdWorld.UpdateHashPosition( merge_into_existing_cell, false, false );
						merge_into_existing_cell._update_version++;
						
						merge_into_existing_cell._snapshot_cache_public = null; // Reset cached snapshot
						
						this.remove();
					}
					else
					{
						if ( nothing_to_hibernate )
						{
							// We should not disallow hibernation of just empty cells. Also it wasn't costly - can try again later.
							this.remove();
						}
						else
						{
							this.r = nothing_to_hibernate ? 
								( reason_object ? 'Because nothing to hibernate here except for '+reason_object.GetClass() : 'Because nothing to hibernate here at all' ) : 
								'Because of ' + reason_object.GetClass();

							this._snapshot_cache_public = null; // Reset cached snapshot

							if ( sdDeepSleep.debug )
							this._will_hibernate_on = sdWorld.time + 5000 + Math.random() * 1000; // 5-6 sec
							else
							this._will_hibernate_on = sdWorld.time + 60000 * ( 1 + Math.random() ); // 1-2 minutes?

							this.type = sdDeepSleep.TYPE_DO_NOT_HIBERNATE;
							sdWorld.UpdateHashPosition( this, false, false );
							this._update_version++;
						}
					}
				};

				if ( sdDeepSleep.debug_cell && this.x === sdDeepSleep.debug_cell_x && this.y === sdDeepSleep.debug_cell_y )
				trace( 'onBuilt()', { _net_id:this._net_id, w:this.w, h:this.h, type:this.type, _file_exists:this._file_exists, _snapshots_str:this._snapshots_str.length } );

				//trace( 'Generating hibernated area...' );

				//let entity_once = new Set();

				//entity_once.add( this ); // Ignore itself

				const visited_ent_flag = sdEntity.GetUniqueFlagValue();
				const all_entities = [];

				this._flag = visited_ent_flag;

				let bounds_moved = true;

				let _x = this.x;
				let _x2 = this.x + this.w;
				let _y = this.y;
				let _y2 = this.y + this.h;

				let area = 0;

				let dependences = [];

				let all_dependences = null;

				if ( sdDeepSleep.debug_dependences )
				all_dependences = [];

				//let scheduled_sleep_areas_to_cancel = [];

				const HandleEntity = ( e, as_dependence=false )=>
				{
					/*if ( e.is( sdBaseShieldingUnit ) )
					{
						let a = 1;
					}
					if ( e.is( sdLongRangeTeleport ) )
					{
						let a = 1;
					}
					if ( e.is( sdWorld.entity_classes.sdCommandCentre ) )
					{
						let a = 1;
					}
					if ( e.is( sdBlock ) && e.width === 32 && e.height === 16 )
					{
						let a = 1;
					}*/
					
					//if ( entity_once.has( e ) )
					if ( e._flag === visited_ent_flag )
					{
						/*if ( e !== this )
						if ( all_entities.indexOf( e ) === -1 )
						{
							throw new Error( 'What is this sorcery? ' + e._net_id );
						}*/
					}
					else
					if ( as_dependence || this.DoesOverlapWith( e ) )
					{
						if ( e.is( sdWeather ) )
						return false;
					
						if ( e.is( sdWanderer ) )
						return false;

						if ( e._is_being_removed )
						return false;

						if ( 
								( e.IsPlayerClass() && e._socket ) || // No online players
								( e.is( sdLongRangeTeleport ) && e.is_server_teleport ) || // No server teleports (unless regular telepors will be available for in-world teleportation at some point?)
								e.is( sdRescueTeleport ) || // It looks like there is no simple solution at all for these...
								e.is( sdBeacon ) || // It looks like there is no simple solution at all for these...
								!sdWorld.server_config.AllowAggressiveHibernationFor( e )
							)
						{
							if ( sdDeepSleep.debug_wake_up_sleep_refuse_reasons )
							{
								if ( ( e.IsPlayerClass() && e._socket ) )
								trace( 'sdDeepSleep hibernation refused: Cell contains connected player ('+e._net_id+')', _x, _y, _x2, _y2 );
								else
								if ( ( e.is( sdLongRangeTeleport ) && e.is_server_teleport ) )
								trace( 'sdDeepSleep hibernation refused: Cell contains sdLongRangeTeleport that is also .is_server_teleport ('+e._net_id+')', _x, _y, _x2, _y2 );
								else
								if ( e.is( sdRescueTeleport ) )
								trace( 'sdDeepSleep hibernation refused: Cell contains sdRescueTeleport ('+e._net_id+')', _x, _y, _x2, _y2 );
								else
								if ( e.is( sdBeacon ) )
								trace( 'sdDeepSleep hibernation refused: Cell contains sdBeacon ('+e._net_id+')', _x, _y, _x2, _y2 );
								else
								if ( !sdWorld.server_config.AllowAggressiveHibernationFor( e ) )
								trace( 'sdDeepSleep hibernation refused: Cell contains entity filtered by AllowAggressiveHibernationFor ('+e.GetClass()+', '+e._net_id+')', _x, _y, _x2, _y2 );
								else
								trace( 'sdDeepSleep hibernation refused: - Unspecified -', _x, _y, _x2, _y2 );
							}

							//this.remove();
							return true;
						}

						// Sleep cells do not matter
						if ( e.is( sdDeepSleep ) )
						{
							if ( e.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP )
							{
								return false;
							}
							else
							if ( e.type === sdDeepSleep.TYPE_DO_NOT_HIBERNATE )
							{
								merge_into_existing_cell = e;
								return true; // Abort
							}
							else
							if ( e.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
							{
								// Accept these
							}
							else
							if ( e._snapshots_str === '' && e._snapshots_objects === null )
							{
								// Accept these
							}
							else
							{
								// Hibernated sdDeepSleep yet it keeps objects/snapshot in memory - we don't want to merge these really
								//return false;
								return true; // Abort! Or else we will end up with deep sleep areas overlapping each other, which will result into entities overlapping once both are decoded
							}
						}
						
						// No returns allowed past this point -------------------------

						e._flag = visited_ent_flag;
						//trace( 'flag set for '+ e._net_id );

						all_entities.push( e );

						let ext_x1 = e._hitbox_x1;
						let ext_x2 = e._hitbox_x2;
						let ext_y1 = e._hitbox_y1;
						let ext_y2 = e._hitbox_y2;

						// Radius extensions for entities that have reaction range
						let r = 0;

						if ( e.is( sdTurret ) )
						{
							r = e.GetTurretRange();
						}
						else
						if ( e.is( sdCrystal ) )
						{
							if ( e.is_anticrystal )
							r = 100;
							else
							r = 30;
						}
						else
						if ( e.is( sdBaseShieldingUnit ) )
						{
							if ( e.enabled )
							{
								r = sdBaseShieldingUnit.protect_distance_stretch;
								
								/*for ( let i = 0; i < e._protected_entities.length; i++ )
								{
									let e2 = sdEntity.entities_by_net_id_cache_map.get( e._protected_entities[ i ] );
									
									debugger;
								}*/
							}
						}
						else
						if ( e.is( sdAntigravity ) )
						{
							if ( e.power > 0 )
							ext_y1 = -16 * 16;
							else
							if ( e.power === -1 )
							ext_y1 = -3 * 16;
						}
						else
						if ( e.is( sdDoor ) )
						{
							r = 16 + 32;
						}
						else
						if ( e.is( sdTzyrgAbsorber ) )
						{
							r = sdTzyrgAbsorber.effect_radius;
						}

						if ( r !== 0 )
						{
							/*ext_x1 = e.x - r;
							ext_x2 = e.x + r;
							ext_y1 = e.y - r;
							ext_y2 = e.y + r;*/
							ext_x1 = -r;
							ext_x2 = r;
							ext_y1 = -r;
							ext_y2 = r;
						}

						_x = Math.floor( Math.min( _x, e.x + ext_x1 ) / 16 ) * 16;
						_x2 = Math.ceil( Math.max( _x2, e.x + ext_x2 ) / 16 ) * 16;
						_y = Math.floor( Math.min( _y, e.y + ext_y1 ) / 16 ) * 16;
						_y2 = Math.ceil( Math.max( _y2, e.y + ext_y2 ) / 16 ) * 16;

						// Try to catch moving objects and merge them all together
						if ( typeof e.sx !== 'undefined' )
						if ( typeof e.sy !== 'undefined' )
						{
							if ( sdWorld.inDist2D_Boolean( e.sx, e.sy, 0,0, 1 ) )
							{

							}
							else
							{
								_x -= 64;
								_x2 += 64;
								_y -= 64;
								_y2 += 64;
							}
						}

						if ( sdDeepSleep.debug_big_area_increments )
						{
							let area2 = ( _x2 - _x ) * ( _y2 - _y );

							if ( area2 > area * 2 )
							if ( area !== 0 )
							{
								trace( 'sdDeepSleep large area increment after adding ( '+area+' -> '+area2+' )', e );
							}

							area = area2;
						}

						//if ( _y > this.y )
						//throw new Error();

						this.x = _x;
						this.w = _x2 - _x;
						this.y = _y;
						this.h = _y2 - _y;
						this._hitbox_x2 = this.w;
						this._hitbox_y2 = this.h;

						// Add any pointer entities as dependences?
						if ( e.is( sdBlock ) )
						{
							if ( e._shielded )
							if ( !e._shielded._is_being_removed )
							dependences.push( e._shielded );

							if ( e._plants )
							for ( let i = 0; i < e._plants.length; i++ )
							{
								let possible_ent = sdEntity.entities_by_net_id_cache_map.get( e._plants[ i ] );

								if ( possible_ent )
								if ( !possible_ent._is_being_removed )
								dependences.push( possible_ent );
							}
						}
						else
						if ( e.is( sdBG ) )
						{
							if ( e._shielded )
							if ( !e._shielded._is_being_removed )
							dependences.push( e._shielded );
						}
						else
						{
							for ( let prop in e )
							if ( typeof e[ prop ] === 'object' )
							//if ( e[ prop ] instanceof sdEntity ) // 102.7 ms - Too slow
							if ( e[ prop ] !== null )
							if ( typeof e[ prop ]._is_being_removed !== 'undefined' )
							if ( !e[ prop ]._is_being_removed ) // 0.8 ms
							if ( prop !== '_phys_last_touch' ) // 1.3 ms
							{
								if ( sdWorld.inDist2D_Boolean( e.x, e.y, e[ prop ].x, e[ prop ].y, sdDeepSleep.dependence_distance_max ) )
								{
									/*if ( e[ prop ].is( sdCharacter ) && e[ prop ]._socket )
									{
										let a = 1;
									}*/
									
									dependences.push( e[ prop ] );

									if ( all_dependences )
									all_dependences.push( e.GetClass() + '.' + prop + ' -> ' + e[ prop ].GetClass() );
								}
								else
								{
									//if ( prop !== 'follow' )
									//debugger;
								}
							}
						}
						
						
						if ( e.is( sdCable ) )
						{
							dependences.push( e._p );
							dependences.push( e._c );
						}
						else
						{
							let cables_set = sdCable.cables_per_entity.get( e );
							if ( cables_set !== undefined )
							{
								for ( let cable of cables_set )
								if ( !cable._is_being_removed ) // Probably can't happen
								dependences.push( cable );
							}
						}

						/*if ( e.is( sdBlock ) )
						if ( e._plants )
						for ( let i = 0; i < e._plants.length; i++ )
						{
							let possible_ent = sdEntity.entities_by_net_id_cache_map.get( e._plants[ i ] );

							if ( possible_ent )
							if ( !possible_ent._is_being_removed )
							dependences.push( possible_ent );
						}*/

						if ( e._steering_wheel_net_id !== -1 )
						{
							let steer = e.GetSteeringWheel();
							if ( steer )
							dependences.push( steer );
						}

						/*if ( e.is( sdDoor ) || e.is( sdBlock ) || e.is( sdBG ) || e.is( sdThruster ) )
						for ( let i = 0; i < sdSteeringWheel.steering_wheels.length; i++ )
						if ( sdSteeringWheel.steering_wheels[ i ]._scan_net_ids.indexOf( e._net_id ) !== -1 )
						{
							dependences.push( sdSteeringWheel.steering_wheels[ i ] );
							break;
						}*/

						if ( e.is( sdSteeringWheel ) )
						dependences.push( ...e._scan );

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
							let e = arr[ i2 ];
							
							if ( _x2 < e.x + e._hitbox_x1 ||
								 _x >= e.x + e._hitbox_x2 ||
								 _y2 < e.y + e._hitbox_y1 ||
								 _y >= e.y + e._hitbox_y2 )
							{
								// Does not overlap
							}
							else
							if ( HandleEntity( e, false ) )
							{
								HibernationAborted( e );
								return;
							}
						}
					}

					while ( dependences.length > 0 )
					{
						let e = dependences.pop();

						if ( !e._is_being_removed )
						if ( HandleEntity( e, true ) )
						{
							HibernationAborted( e );
							return;
						}
					}
				}

				//if ( all_entities.length === 0 || ( all_entities.length === 1 && all_entities[ 0 ].is( sdDeepSleep ) ) )
				if ( all_entities.length === 0 || ( all_entities.length === 1 && all_entities[ 0 ]._hiberstate !== sdEntity.HIBERSTATE_ACTIVE ) )
				{
					if ( sdDeepSleep.debug_wake_up_sleep_refuse_reasons )
					trace( 'sdDeepSleep hibernation refused: Too few entities ('+all_entities.length+')', _x, _y, _x2, _y2 );

					HibernationAborted( all_entities[ 0 ], true );
					//this.remove();
					return;
				}

				let snapshots = [];
				let current_frame = globalThis.GetFrame();

				//this._to_remove_temp_set = entity_once;
				this._to_remove_temp_set = all_entities;

				//entity_once.forEach( ( e )=>
				for ( let i = 0; i < all_entities.length; i++ )
				{
					let e = all_entities[ i ];

					//if ( e !== this )
					//{
						let t3;
						if ( sdDeepSleep.debug_times )
						t3 = Date.now();

						snapshots.push( e.GetSnapshot( current_frame, true ) );

						if ( sdDeepSleep.debug_times )
						{
							let t4 = Date.now();

							serialization_per_class_times[ e.GetClass() ] = ( serialization_per_class_times[ e.GetClass() ] || 0 ) + ( t4 - t3 );
						}

						if ( e.is( sdDeepSleep ) )
						{
							this._my_hash_list.push( ...e._my_hash_list );
							this._rtp_biometries.push( ...e._rtp_biometries );
							this._beacon_net_ids.push( ...e._beacon_net_ids );
						}
						else
						if ( e.IsPlayerClass() && e._my_hash !== undefined )
						{
							this._my_hash_list.push( e._my_hash );

							//trace( 'Saving player\'s hash ' + e._my_hash + ' to '+this._net_id );
						}
						else
						if ( e.is( sdRescueTeleport ) )
						{
							this._rtp_biometries.push( e.owner_biometry );
						}
						else
						if ( e.is( sdBeacon ) )
						{
							this._beacon_net_ids.push( e._net_id );
						}
					//}
				}

				if ( sdDeepSleep.debug_entity_count )
				if ( all_entities.length > 4000 ) // It can easily reach 3000 if for example crystals happen to be lying at edges of cells
				{
					trace( 'Why are we so big? sdDeepSleep cell wants to include ' + all_entities.length + ' entities - it will lag the server' );

					if ( sdDeepSleep.debug_dependences )
					trace( 'Dependences (excluding ones that are hardcoded for specific classes):', all_dependences );

					debugger;
				}

				const bulk_exclude = [];

				//entity_once.forEach( ( e )=>
				//{
				for ( let i = 0; i < all_entities.length; i++ )
				{
					let e = all_entities[ i ];

					if ( e !== this )
					{
						if ( sdDeepSleep.debug_cell && e.x === sdDeepSleep.debug_cell_x && e.y === sdDeepSleep.debug_cell_y )
						{
							trace( 'Now tracking cell ('+this.x+', '+this.y+') that has consumed previously tracked cell ('+sdDeepSleep.debug_cell_x+', '+sdDeepSleep.debug_cell_y+')...' );
							sdDeepSleep.debug_cell_x = this.x;
							sdDeepSleep.debug_cell_y = this.y;
							trace( 'onBuilt-consumer-cell()', { _net_id:this._net_id, x:this.x, y:this.y, w:this.w, h:this.h, type:this.type, _file_exists:this._file_exists, _snapshots_str:this._snapshots_str.length, _is_being_removed:this._is_being_removed } );
						}

						/*if ( this.x > e.x + e._hitbox_x1 )
						throw new Error();

						if ( this.y > e.y + e._hitbox_y1 )
						throw new Error();

						if ( this.x + this.w < e.x + e._hitbox_x2 )
						throw new Error();

						if ( this.y + this.h < e.y + e._hitbox_y2 )
						throw new Error();*/

						e.remove();
						e._broken = false;

						e._remove(); // Instant remove is required or else it won't be able to spawn same entities from snapshot?

						bulk_exclude.push( e );
						//e._remove_from_entities_array();

						sdLongRangeTeleport.teleported_items.add( e );
					}
				}
				sdEntity.BulkRemoveEntitiesFromEntitiesArray( bulk_exclude, true );

				//for ( let i = 0; i < scheduled_sleep_areas_to_cancel.length; i++ )
				//scheduled_sleep_areas_to_cancel[ i ].remove();

				this._to_remove_temp_set = null;

				//trace( 'Hibernation is being done on following entities:', all_entities, snapshots, this );
				
				if ( snapshots.length === 0 )
				{
					console.warn( 'What is happening here?' );
					debugger;
				}

				this._snapshots_objects = snapshots;
				this._snapshots_str = ''; // JSON.stringify( snapshots ); Delay serialization - maybe chunk will be woken up right away. Or we can always serialize during save

				sdWorld.UpdateHashPosition( this, false, false ); // Prevent inersection with other ones // Won't call onMovementInRange

				this._update_version++;
				
				this._snapshot_cache_public = null; // Reset cached snapshot


				if ( sdDeepSleep.debug_wake_up_sleep_refuse_reasons )
				{
					trace( 'sdDeepSleep[ '+this._net_id+' ] hibernated', _x, _y, _x2, _y2 );

				}

				ProvidePerformanceReport( false );
			}
		}
	}
	onSnapshotApplied()
	{
		if ( sdWorld.is_server )
		{
			if ( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
			{
				// Patching for extremely big unspawned chunks
				if ( this.w > sdDeepSleep.normal_cell_size || 
					 this.h > sdDeepSleep.normal_cell_size )
				{
					let xx2 = this.x + this.w;
					let yy2 = this.y + this.h;

					for ( let xx = this.x; xx < xx2; xx += sdDeepSleep.normal_cell_size )
					for ( let yy = this.y; yy < yy2; yy += sdDeepSleep.normal_cell_size )
					{
						let cell = new sdDeepSleep({
							x:xx, y:yy, w:sdDeepSleep.normal_cell_size, h:sdDeepSleep.normal_cell_size, type: sdDeepSleep.TYPE_UNSPAWNED_WORLD
						});
						sdEntity.entities.push( cell );
						
						sdWorld.UpdateHashPosition( cell, false, false );
					}
			
					this.remove();
				}
			}
		}
	}
	MeasureMatterCost()
	{
		return Infinity;
	}
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 10; }
	
	onBeforeRemove()
	{
		if ( sdDeepSleep.debug_cell && this.x === sdDeepSleep.debug_cell_x && this.y === sdDeepSleep.debug_cell_y )
		{
			console.warn( 'onBeforeRemove()', { _net_id:this._net_id, w:this.w, h:this.h, type:this.type, _file_exists:this._file_exists, _snapshots_str:this._snapshots_str.length } );
			debugger;
		}
		
		this._snapshots_str = null;
		this._snapshots_objects = null;
		
		//if ( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
		//console.warn( 'Hibernated world cell is being removed', { _net_id:this._net_id, "_snapshots_str":this._snapshots_str.length+' bytes', file_exists:this._file_exists, _snapshots_filename:this._snapshots_filename } );
		
		let id = sdDeepSleep.cells.indexOf( this );
		
		if ( id !== -1 )
		sdDeepSleep.cells.splice( id, 1 );
		else
		debugger;
	
		// Do not remove file simply because cell was removed - it might be removed in order to be merged into a larger cell too
	}
	


	static PatchOverlapInCell( cell )
	{
		let ops = 0;
		
		let arr = cell.arr;

		let hibernated_or_unspawned_deep_sleep = [];
		let stuck_entities = [];

		for ( let i = 0; i < arr.length; i++ )
		{
			let e = arr[ i ];
			
			if ( e._is_being_removed )
			continue;
			
			if ( e.is( sdWorld.entity_classes.sdDeepSleep ) )
			{
				if ( e.type <= 1 )
				hibernated_or_unspawned_deep_sleep.push( e );
			}
			else
			stuck_entities.push( e );
		}

		if ( hibernated_or_unspawned_deep_sleep.length > 0 && stuck_entities.length > 0 )
		{
			for ( let i = 0; i < hibernated_or_unspawned_deep_sleep.length; i++ )
			{
				for ( let i2 = 0; i2 < stuck_entities.length; i2++ )
				{
					let stuck_entity = stuck_entities[ i2 ];
					if ( hibernated_or_unspawned_deep_sleep[ i ].DoesOverlapWith( stuck_entity, -0.001 ) )
					{
						let Delete = ()=>
						{
							ops++;
							stuck_entity.remove();
							stuck_entity._broken = false;
						};

						// Remove entities stuck in deep sleep areas
						if ( stuck_entity.is( sdWorld.entity_classes.sdBlock ) ||
							 stuck_entity.is( sdWorld.entity_classes.sdBG ) )
						{
							if ( !stuck_entity._shielded )
							Delete();
						}
					}
				}
			}
		}

		if ( stuck_entities.length > 0 )
		{
			let classes = [ sdWorld.entity_classes.sdBlock, sdWorld.entity_classes.sdBG ];

			for ( let c = 0; c < classes.length; c++ )
			{
				for ( let i = 0; i < stuck_entities.length; i++ )
				if ( stuck_entities[ i ].is( classes[ c ] ) )
				if ( !stuck_entities[ i ]._is_being_removed )
				{
					for ( let i2 = 0; i2 < stuck_entities.length; i2++ )
					if ( stuck_entities[ i2 ].is( classes[ c ] ) )
					if ( !stuck_entities[ i2 ]._is_being_removed )
					if ( stuck_entities[ i ].DoesOverlapWith( stuck_entities[ i2 ], -0.001 ) )
					if ( i !== i2 )
					{
						// Remove overlapped blocks

						let stuck_entity = stuck_entities[ i2 ];

						//if ( stuck_entity.is( sdWorld.entity_classes.sdBlock ) )
						{
							if ( !stuck_entity._shielded )
							{
								ops++;
								stuck_entity.remove();
								stuck_entity._broken = false;
							}
						}
					}
				}
			}
		}
		
		return ops;
	};
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	Draw( ctx, attached )
	{
		if ( sdWorld.my_entity && sdWorld.my_entity._god && sdDeepSleep.debug )
		{
			ctx.apply_shading = false;
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
			
			if ( this.type === sdDeepSleep.TYPE_DO_NOT_HIBERNATE )
			{
				ctx.fillStyle = '#ffaaaa';
			}

			ctx.fillRect( 0, 0, this._hitbox_x2, this._hitbox_y2 );

			ctx.globalAlpha = 1;
			ctx.filter = 'none';
			
			let scale = 1 / sdWorld.camera.scale * 2.1;

			ctx.font = Math.round( 7 * scale ) + "px Verdana";
			ctx.textAlign = 'left';

			let t = 
				( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD ) ? 'Unspawned' :
				( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD ) ? 'Hibernated' :
				( this.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP ) ? 'Scheduled sleep' :
				( this.type === sdDeepSleep.TYPE_DO_NOT_HIBERNATE ) ? 'Hibernation rejected and is no longer allowed' :
				'type ' + this.type;

			ctx.fillStyle = '#ffffff';
			ctx.fillText( t, 2, 8 * scale );
			
			if ( this.r )
			{
				ctx.fillStyle = '#ffaaaa';
				ctx.fillText( this.r, 2, ( 8 + 8 ) * scale );
			}
		}
	}
	DrawFG( ctx, attached )
	{
		this.Draw( ctx, attached );
	}
}

export default sdDeepSleep;