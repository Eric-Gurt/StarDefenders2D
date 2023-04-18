/*

	Areas that store entities in form of snapshots, can store on a disk as well?

	This is a heavy over-optimization approach...

	Most likely it would merge whole big bases into one big chunk, which is perfectly fine I guess.


	//TODO: Try to restore _net_id-s of hibernated entities exactly what they were - it will help with de-hibernation of nested sdDeepSleep. It probably is already like this.

	//TODO: _will_be_written_to_disk is not used yet. Save to disk under _net_id names?

	//TODO: Make sure "unspawned" state removes file from the disk as well

	//TODO: this._my_hash_list is generated but not yet used outside of this class

	//TODO: Add SyncedToPlayer logic

	//TODO: Greatly increase range over entities that have some sort of radius-based scans, such as turrets and crystals

	//TODO: Add some sort of global chunk manager

	//TODO: Make point and rect testers wake-up sdDeepSleep areas?

	//TODO: Keep in mind pathfinding can accidentally wake up sdDeepSleep areas it does not really needs. Make pathfinding more directed by default somehow? Limit its' range?

*/
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

import sdRenderer from '../client/sdRenderer.js';

let fs = null;

class sdDeepSleep extends sdEntity
{
	static init_class()
	{
		sdDeepSleep.debug = false;
		
		fs = globalThis.fs;
		
		if ( sdDeepSleep.debug )
		{
			trace( 'WARNING: Running server with sdDeepSleep.debug === 1' );
		}
		
		sdDeepSleep.TYPE_UNSPAWNED_WORLD = 0; // Whenever something touches it or some player sees it - spawns fresh world at the area
		sdDeepSleep.TYPE_HIBERNATED_WORLD = 1; // Whenever something touches it or some player sees it - spawns previously hibernated entities
		sdDeepSleep.TYPE_SCHEDULED_SLEEP = 2; // These will be created at areas that will be scheduled to sleep soon unless nobody interacts with them
		
		sdDeepSleep.cells = [];
		sdDeepSleep.loopie = 0;
		
		//sdDeepSleep.normal_cell_size = 2048; // Half a second lags can happen
		sdDeepSleep.normal_cell_size = 256; // Maybe this is actually more optimal
		
		sdDeepSleep.inception_catcher = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
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
				cell.WakeUpArea(); // Results into removal

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
		if ( sdWorld.is_server )
		{
			sdDeepSleep.inception_catcher = 0;
		
			if ( sdWorld.server_config.aggressive_hibernation )
			{
				if ( sdEntity.entities.length > 0 )
				{
					let i = Math.floor( Math.random() * sdEntity.entities.length );

					let e = sdEntity.entities[ i ];

					if ( !e.is( sdDeepSleep ) )
					{
						let x = Math.floor( ( e.x + e._hitbox_x1 ) / sdDeepSleep.normal_cell_size ) * sdDeepSleep.normal_cell_size;
						let y = Math.floor( ( e.y + e._hitbox_y1 ) / sdDeepSleep.normal_cell_size ) * sdDeepSleep.normal_cell_size;
						let w = sdDeepSleep.normal_cell_size;
						let h = sdDeepSleep.normal_cell_size;

						let cell = new sdDeepSleep({
							x: x,
							y: y,
							w: w,
							h: h,
							type: sdDeepSleep.TYPE_SCHEDULED_SLEEP
						});

						sdEntity.entities.push( cell );

						let ok = true;
						for ( let i2 = 0; i2 < sdDeepSleep.cells.length; i2++ )
						if ( cell !== sdDeepSleep.cells[ i2 ] )
						if ( cell.DoesOverlapWith( sdDeepSleep.cells[ i2 ] ) )
						{
							ok = false;
							break;
						}

						if ( ok )
						{
						}
						else
						{
							cell.remove();
						}
					}
				}

				if ( sdDeepSleep.cells.length > 0 )
				{
					sdDeepSleep.loopie = ( sdDeepSleep.loopie + 1 ) % sdDeepSleep.cells.length;

					let cell = sdDeepSleep.cells[ sdDeepSleep.loopie ];

					if ( cell.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
					{
					}
					else
					if ( cell.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
					{
						/*if ( sdWorld.time > cell._will_be_written_to_disk ) Better to do it in sync with world snapshot saves...
						{
							if ( cell._snapshots_filename === null )
							if ( sdWorld.is_server && !sdWorld.is_singleplayer )
							cell.SaveToFile();
						}*/
						
						/*if ( sdWorld.time > cell._will_become_unspawned ) Moved for consistency as well
						{
							cell._snapshots_str = '';
							
							if ( sdWorld.is_server && !sdWorld.is_singleplayer )
							cell.DeleteFile();
							
							cell.type = sdDeepSleep.TYPE_UNSPAWNED_WORLD;
							cell._update_version++;
						}*/
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
					{
					}
				}
			}
			else
			{
				for ( let i = 0; i < sdDeepSleep.cells.length; i++ )
				{
					let cell = sdDeepSleep.cells[ i ];
					
					if ( cell.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
					cell.WakeUpArea();
					else
					if ( cell.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
					cell.WakeUpArea();
					else
					if ( cell.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP )
					cell.remove();
					else
					debugger;
				}
			}
		}
	}
	static SaveScheduledChunks()
	{
		for ( let i = 0; i < sdDeepSleep.cells.length; i++ )
		{
			let cell = sdDeepSleep.cells[ i ];
			
			if ( cell.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
			{
				if ( sdWorld.time > cell._will_be_written_to_disk )
				{
					if ( cell._snapshots_filename === null )
					if ( sdWorld.is_server && !sdWorld.is_singleplayer )
					cell.SaveToFile();
				}
				
				if ( sdWorld.time > cell._will_become_unspawned )
				{
					cell._snapshots_str = '';

					if ( sdWorld.is_server && !sdWorld.is_singleplayer )
					cell.DeleteFile();

					cell.type = sdDeepSleep.TYPE_UNSPAWNED_WORLD;
					cell._update_version++;
				}
			}
		}
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
		
		//this.ping_time = sdWorld.time;
		
		//trace( 'Movement from ', from_entity );
		//debugger;
		
		this.WakeUpArea( true, from_entity );
	}
	WakeUpArea( from_movement_or_vision=false, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP )
		{
			if ( from_movement_or_vision && initiator && initiator.IsPlayerClass() )
			{
				this.remove();
			}
			
			return; // These can't be waken up nor should be removed unless playe sees or interacts with them
		}
	
		if ( this._is_being_removed )
		return;
	
		sdDeepSleep.inception_catcher++;
		
		if ( sdDeepSleep.inception_catcher > 128 )
		{
			//debugger;
			console.warn( 'Some crazy deep sleep inception has happened' );
			return;
		}

		if ( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD )
		{
			this.remove();
		
			let x2 = this.x + this.w;
			let y2 = this.y + this.h;

			for ( let x = this.x; x < x2; x += 16 )
			for ( let y = this.y; y < y2; y += 16 )
			{
				let block = sdWorld.AttemptWorldBlockSpawn( x, y, false );
				
				if ( block )
				{
					sdWorld.UpdateHashPosition( block, false, true ); // Last must be true or else bullets will miss new entities for a frame // Won't call onMovementInRange
				}
			}
		}
		else
		if ( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
		{
			let load_attempted = false;
			if ( this._saving || this._file_exists )
			{
				load_attempted = true;
				this.LoadFromFile();
			}
		
			this.remove();
			
			if ( this._snapshots_str === '' ) // onBuild was not called yet..?
			{
				console.warn( 'Empty snapshot being decoded ( file load attempted: '+load_attempted+' )' );
				
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
			
			//trace( 'Restoring hibernated area' );
			
			//trace( 'sdDeepSleep has no action for this type - just removing' );
			let snapshots = JSON.parse( this._snapshots_str );
			this._snapshots_str = '';
			
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
	}
	
	IsAdminEntity() // Influences remover gun hit test
	{ return true; }
	
	static DeleteAllFiles()
	{
		let directory = globalThis.chunks_folder + '/';
		
		fs.rmdirSync( directory, { recursive: true, maxRetries: 10, retryDelay: 100 } );
	}
	
	DeleteFile( forced=false )
	{
		if ( this._snapshots_filename === null )
		return;
	
		if ( this._loaded_or_deleted && !forced )
		return;
	
		this._loaded_or_deleted = true;
	
		/*if ( this._saving )
		{
			setTimeout( ()=>
			{
				trace( 'Delaying chunk deletion due to unfinished save ('+this._snapshots_filename+')...' );
				this.DeleteFile();
			}, 1000 );
			return;
		}*/
		
		if ( !this._saving )
		if ( this._file_exists )
		fs.unlink( globalThis.chunks_folder + '/' + this._snapshots_filename, ( err )=>
		{
			//if ( err )
			//throw err;
		
			this._file_exists = false;
		});
	}
	
	SaveToFile()
	{
		if ( this._saving )
		throw new Error( 'This should not happen' );
		
		this._saving = true;
		this._snapshots_filename = this._net_id + '.v';
		
		fs.writeFile( globalThis.chunks_folder + '/' + this._snapshots_filename, this._snapshots_str, ( err )=> 
		{
			if ( err )
			throw err;
		
			this._saving = false;
			this._file_exists = true;
			
			if ( this._loaded_or_deleted )
			{
				this.DeleteFile( true );
			}
			else
			{
				this._snapshots_str = '';
			}
		});
	}
	
	LoadFromFile()
	{
		this._loaded_or_deleted = true;
		
		if ( this._saving )
		{
			// this._snapshots_str is available at this moment
		}
		else
		{
			if ( this._file_exists )
			{
				try
				{
					this._snapshots_str = fs.readFileSync( globalThis.chunks_folder + '/' + this._snapshots_filename, 'utf8' );
					this.DeleteFile( true );
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
	}
	
	constructor( params )
	{
		super( params );
		
		this.w = params.w || 512;
		this.h = params.h || 512;
		
		if ( this.w <= 0 || isNaN( this.w ) )
		throw new Error();
		
		if ( this.h <= 0 || isNaN( this.h ) )
		throw new Error();
		
		this.type = params.type || sdDeepSleep.TYPE_UNSPAWNED_WORLD;
		
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
			this._will_be_written_to_disk = sdWorld.time + 1000 * 60 * 60 * 3; // 3 hours
			this._will_become_unspawned = sdWorld.time + 1000 * 60 * 60 * 24 * 30 * 12 * 5; // Full removal in 5 years?
		}
		this._snapshots_str = '';
		this._snapshots_filename = null; // null means it was never saved to disk yet
		this._saving = false;
		this._loaded_or_deleted = false;
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
		
		return false;
	}
	onBuilt()
	{
		if ( sdWorld.is_server )
		if ( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD )
		{
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
				
			let dependences = [];
			
			//let scheduled_sleep_areas_to_cancel = [];
			
			const HandleEntity = ( e )=>
			{
				//if ( entity_once.has( e ) )
				if ( e._flag === visited_ent_flag )
				{
				}
				else
				if ( this.DoesOverlapWith( e ) )
				{
					//if ( e === this )
					//return false;
					//throw new Error();
				
					if ( e.is( sdWeather ) )
					return false;
					//throw new Error();
					
					if ( e._is_being_removed )
					return false;

					if ( 
							( e.IsPlayerClass() && e._socket ) || // No online players
							( e.is( sdLongRangeTeleport ) && e.is_server_teleport ) || // No server teleports (unless regular telepors will be available for in-world teleportation at some point?)
							e.is( sdRescueTeleport ) || // It looks like there is no solution at all for these...
							e.is( sdBeacon ) || // It looks like there is no solution at all for these...
							!sdWorld.server_config.AllowAggressiveHibernationFor( e )
						)
					{
						this.remove();
						return true;
					}
					
					// Sleep cells do not matter
					if ( e.is( sdDeepSleep ) )
					if ( e.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP )
					{
						//scheduled_sleep_areas_to_cancel.push( e );
						return false;
					}

					//entity_once.add( e );
					e._flag = visited_ent_flag;
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
						r = sdBaseShieldingUnit.protect_distance_stretch;
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
					
					if ( r !== 0 )
					{
						ext_x1 = e.x - r;
						ext_x2 = e.x + r;
						ext_y1 = e.y - r;
						ext_y2 = e.y + r;
					}

					_x = Math.floor( Math.min( _x, e.x + ext_x1 ) / 16 ) * 16;
					_x2 = Math.ceil( Math.max( _x2, e.x + ext_x2 ) / 16 ) * 16;
					_y = Math.floor( Math.min( _y, e.y + ext_y1 ) / 16 ) * 16;
					_y2 = Math.ceil( Math.max( _y2, e.y + ext_y2 ) / 16 ) * 16;

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
					}
					else
					{
						for ( let prop in e )
						//if ( typeof e[ prop ] === 'object' )
						if ( e[ prop ] instanceof sdEntity )
						if ( !e[ prop ]._is_being_removed )
						dependences.push( e[ prop ] );
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
					
					if ( e.is( sdDoor ) || e.is( sdBlock ) || e.is( sdBG ) || e.is( sdThruster ) )
					for ( let i = 0; i < sdSteeringWheel.steering_wheels.length; i++ )
					if ( sdSteeringWheel.steering_wheels[ i ]._scan_net_ids.indexOf( e._net_id ) !== -1 )
					{
						dependences.push( sdSteeringWheel.steering_wheels[ i ] );
						break;
					}
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
						if ( HandleEntity( arr[ i2 ] ) )
						return;
					}
				}
				
				while ( dependences.length > 0 )
				{
					let e = dependences.pop();
					
					if ( !e._is_being_removed )
					if ( HandleEntity( e ) )
					return;
				}
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
					snapshots.push( e.GetSnapshot( current_frame, true ) );
					
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
			
			if ( snapshots.length === 0 )
			{
				this.remove();
				return;
			}
			
			//entity_once.forEach( ( e )=>
			//{
			for ( let i = 0; i < all_entities.length; i++ )
			{
				let e = all_entities[ i ];
				
				if ( e !== this )
				{
					e.remove();
					e._broken = false;
					
					e._remove(); // Instant remove is required or else it won't be able to spawn same entities from snapshot?
					
					sdLongRangeTeleport.teleported_items.add( e );
				}
			}
			
			//for ( let i = 0; i < scheduled_sleep_areas_to_cancel.length; i++ )
			//scheduled_sleep_areas_to_cancel[ i ].remove();
			
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
	
	onBeforeRemove()
	{
		let id = sdDeepSleep.cells.indexOf( this );
		
		if ( id !== -1 )
		sdDeepSleep.cells.splice( id, 1 );
		else
		debugger;
	
		this.DeleteFile();
	}
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	Draw( ctx, attached )
	{
		if ( sdWorld.my_entity && sdWorld.my_entity._god && sdDeepSleep.debug )
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

			ctx.fillRect( 0, 0, this._hitbox_x2, this._hitbox_y2 );

			ctx.globalAlpha = 1;
			ctx.filter = 'none';

			ctx.font = "7px Verdana";
			ctx.textAlign = 'left';

			let t = 
				( this.type === sdDeepSleep.TYPE_UNSPAWNED_WORLD ) ? 'Unspawned' :
				( this.type === sdDeepSleep.TYPE_HIBERNATED_WORLD ) ? 'Hibernated' :
				( this.type === sdDeepSleep.TYPE_SCHEDULED_SLEEP ) ? 'Scheduled sleep' :
				'type ' + this.type;

			ctx.fillStyle = '#ffffff';
			ctx.fillText( t, 2, 8 );
		}
	}
	DrawFG( ctx, attached )
	{
		this.Draw( ctx, attached );
	}
}

export default sdDeepSleep;