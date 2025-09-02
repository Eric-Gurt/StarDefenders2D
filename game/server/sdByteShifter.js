/*

	//TODO: Array properties won't be updated properly yet, since they are compared like pointers and thus won't be seen as changed

	//TODO: Same for sd_filter objects (trying to fix this)

	//TODO: Task message flood, especially when alt-tabbing. Server keeps asking client to create RTP task objects but never actually tells client to remove 
		  already expired tasks because client reports only the latest message UID, but should report all he received so server can efficiently tell which 
		  objects client may have.

	//TODO: Fix reconnection message UID counter issues

	//TODO: Doors controlled by switches return to their previous states once open

	//TODO: is_static objects could be handled much more efficiently if their properties were not scanned unless their _update_version did increment

	//TODO: Some crazy camera shaking in stream logger mode. Maybe client is overriding something?

	TODO: Shaking camera with fast camera left and right causes parts of non-static objects to disappear... Even without packet shuffling.
	UPD: It is better now but still occasionally some rare objects can be missing for some reason

*/

/* global sdSnapPack, globalThis, WorkerServiceLogic, LZW, SOCKET_IO_MODE */

import sdEntity from '../entities/sdEntity.js';
import sdPlayerSpectator from '../entities/sdPlayerSpectator.js';
import sdTask from '../entities/sdTask.js';
import sdGun from '../entities/sdGun.js';
import sdWorld from '../sdWorld.js';

let vision_cells_cache = {};

let ShallowClone = ( typeof structuredClone === 'undefined' ) ? ( a )=>Object.assign( {}, a ) : structuredClone;

class sdByteShifter
{
	static init_class()
	{
		sdByteShifter.simulate_packet_loss_percentage = 0;//0.5;
		sdByteShifter.simulate_packet_shuffle = false;
		sdByteShifter.simulate_packet_delay = false;
		
		sdByteShifter.events_overflow_warning_next_time = 0;
		
		if ( sdByteShifter.simulate_packet_shuffle || sdByteShifter.simulate_packet_delay )
		console.warn( 'sdByteShifter debug features are enabled' );
		
		sdByteShifter.last_warning = 0;
		
		//sdByteShifter.simulate_all_as_non_static = false; // Bug still happens even when this is enabled. Comment out for some performance gain.
		
		sdByteShifter.allow_weirdly_ordered_messages_to_be_used_as_reference = false;
	}
	
	static InstallDebugFeatures( socket )
	{
		let e = socket.emit;
		
		if ( sdByteShifter.simulate_packet_shuffle )
		{
			socket.emit = ( ...args )=>
			{
				for ( let i = 0; i < args.length; i++ )
				if ( args[ i ] instanceof Array )
				args[ i ] = args[ i ].slice();
				
				setTimeout( ()=>
				{
					e.call( socket, ...args );
				}, 50 + Math.random() * 1000 );
			};
		}
		else
		if ( sdByteShifter.simulate_packet_delay )
		{
			socket.emit = ( ...args )=>
			{
				for ( let i = 0; i < args.length; i++ )
				if ( args[ i ] instanceof Array )
				args[ i ] = args[ i ].slice();
				
				setTimeout( ()=>
				{
					e.call( socket, ...args );
				}, 100 );
			};
		}
	}
	
	constructor( socket )
	{
		this.socket = socket;
		
		this.confirmed_snapshot = new Map(); // Used to by entity -> snapshot, now it is _net_id -> snapshot
		
		this.sent_messages_first = 0;
		this.sent_messages_last = 0;
		this.sent_messages_confirmed_id_first = -1; // Should never go down. It is a latest one
		this.sent_messages_confirmed_id_last = -1;
		this.sent_messages_confirmed_ids = []; // Used to additionally scan these and remove objects that are made with them but no longer exist
		this.send_messages = new Map(); // sent_messages_last => new confirmed_snapshot
		
		this.known_statics_versions = new WeakMap(); // entity => version // Only scan optimization purposes
		this.snap_object_to_its_version = new WeakMap(); // snap_values => version
		//this.last_gcso_id = -1;
		
		//this.message_id = 0;
		this.old_leaders_str = '';
		
		this.visited_hashes_untils = new Map(); // Chunk hash -> { hash, x, y until } it allows contents to be visible for a duration of chunk vanishing on client-side
	}

	onRemove()
	{
	}
	
	ClientReportedArrival( arr )
	{
		if ( arr instanceof Array )
		{
			// Verifly array of ids
			for ( let i = 0; i < arr.length; i++ )
			{
				let v = Math.floor( arr[ i ] );
				
				if ( isNaN( v ) )
				return;
				
				arr[ i ] = v;
			}
			
			this.sent_messages_confirmed_ids = arr;
			
			let uid = arr[ arr.length - 1 ];

			let new_confirmed_snapshot = this.send_messages.get( uid );

			if ( new_confirmed_snapshot )
			{
				this.sent_messages_confirmed_id_first = arr[ 0 ];
				this.sent_messages_confirmed_id_last = uid;
				this.confirmed_snapshot = new_confirmed_snapshot;
				this.ClearOutdatedSentMessages();
			}
			else
			{
				// Completely refresh reference snapshot since client reported really outdated one
				//trace( 'ClientReportedArrival', uid, arr );
				debugger;
				this.confirmed_snapshot = new Map();
			}
		}
	}
	ClearOutdatedSentMessages()
	{
		if ( sdByteShifter.allow_weirdly_ordered_messages_to_be_used_as_reference )
		{
			while ( this.sent_messages_first < this.sent_messages_confirmed_id_first - 100 || this.sent_messages_first < this.sent_messages_last - 100 ) // Leave some space for out of order message reports
			this.send_messages.delete( this.sent_messages_first++ );
		}
		else
		{
			while ( this.sent_messages_first < this.sent_messages_confirmed_id_first || this.sent_messages_first < this.sent_messages_last - 100 ) // Leave some space for out of order message reports
			this.send_messages.delete( this.sent_messages_first++ );
		}
	}
	
	SendSnapshot()
	{
		let socket = this.socket;
		
		if ( !socket.sync_busy )
		{
			const SyncDataToPlayer = async ()=>
			{
				socket.sync_busy = true;
				
				let allow_silent_event_skip = ( sdWorld.time > socket.last_sync + 1000 );
				
				socket.last_sync = sdWorld.time;
				socket.waiting_on_M_event_until = sdWorld.time + 1000;
				
				{
					socket._FixCameraPosition();
					
					// Copy block-like vision [ 1 / 2 ]

					// Copy Camera Bounds [ 2 / 2 ]
					let min_x = socket.camera.x - 800/2 / socket.camera.scale;
					let max_x = socket.camera.x + 800/2 / socket.camera.scale;

					let min_y = socket.camera.y - 400/2 / socket.camera.scale;
					let max_y = socket.camera.y + 400/2 / socket.camera.scale;

					min_x -= 32 * 3;
					min_y -= 32 * 3;
					max_x += 32 * 3;
					max_y += 32 * 3;
					
					const CHUNK_SIZE = sdWorld.CHUNK_SIZE;
					
					const frame = globalThis.GetFrame();
					const default_IsVisible = sdEntity.prototype.IsVisible;
					const default_SyncedToPlayer = sdEntity.prototype.SyncedToPlayer;
					const default_getRequiredEntitiesr = sdEntity.prototype.getRequiredEntities;

					const visited_ent_flag = sdEntity.GetUniqueFlagValue();
					const listed_ent_flag = sdEntity.GetUniqueFlagValue();

					const triggers_sync = !socket.character.is( sdPlayerSpectator ); // Also used for task sync
					
					//const current_snapshot_entities = [];
					const snapshot = [];
					const replacement_for_confirmed_snapshot = new Map();
					const current_snapshot_entities_by_net_id = new Map(); // Speeds up entity lookup for removal snapshots
					
					const near_player_until_time = sdWorld.time + 1000;
					
					const IncludeRequiredEntitiesOf = ( ent )=>
					{
						if ( ent.getRequiredEntities !== default_getRequiredEntitiesr )
						{
							let ents = ent.getRequiredEntities( socket.character );
							for ( let i = 0; i < ents.length; i++ )
							AddEntity( ents[ i ], true );
						}
					};
					
					const AddEntity = ( ent )=>//, forced )=>
					{
						if ( ent._flag < visited_ent_flag )
						{
							ent._near_player_until = near_player_until_time;
							
							if ( ( ent.IsVisible === default_IsVisible || ent.IsVisible( socket.character ) ) && !ent._is_being_removed )
							{
								ent._flag = listed_ent_flag;
							
								//current_snapshot_entities.push( ent );
								current_snapshot_entities_by_net_id.set( ent._net_id, ent );
								
								let is_static = ent.is_static;
								
								if ( is_static )
								{
									let old_version = this.known_statics_versions.get( ent );
									
									if ( old_version !== ent._update_version )
									{
										// Scan as usually. known_statics_versions.set will be done on arrival confirmation
									}
									else
									{
										// Reuse the snapshot object
										//let snap = this.confirmed_snapshot.get( ent );
										let snap = this.confirmed_snapshot.get( ent._net_id );
										
										if ( snap )
										{
											//replacement_for_confirmed_snapshot.set( ent, snap );
											replacement_for_confirmed_snapshot.set( ent._net_id, snap );

											IncludeRequiredEntitiesOf( ent ); // Crystal combiners need this, many other items too
											return; // Skip
										}
									}
								}
								
								//let confirmed_state = this.confirmed_snapshot.get( ent );
								let confirmed_state = this.confirmed_snapshot.get( ent._net_id );
								
								let snap = ent.GetSnapshot( frame, false, socket.character, false );
									
								if ( confirmed_state === undefined )
								{
									
									let class_info = ent._class_id; // Number or string if class has initial type/class/mission properties
									
									for ( let i = 0; i < sdEntity.properties_important_upon_creation.length; i++ )
									{
										let prop = sdEntity.properties_important_upon_creation[ i ];
										
										if ( snap.hasOwnProperty( prop ) )
										class_info += '/' + i + '=' + snap[ prop ];
									}
									
									let entity_snapshot = [
										ent._net_id, // 0
										class_info, // 1 - list of indexes of properties to update OR class ID if it is a first sync OR -1 if removal OR -2 if broken
									];
									for ( let prop in snap )
									entity_snapshot.push( snap[ prop ] ); // 2... - values of properties
								
									snapshot.push( entity_snapshot );
								}
								else
								{
									let prop_ids = null;
									let values_array_partial = null;
									
									let is_held_gun = ent.is( sdGun ) && ent._held_by;
									
									let is_active_or_rare_update = ( !ent.is_static || ent.awake ) && ( ent._phys_sleep > 0 || ent._net_id % 30 === frame % 30 );
									
									let i = 0;
									for ( let prop in snap )
									{
										let snap_value = snap[ prop ];
										let confirmed_value = confirmed_state[ prop ];
										
										let is_pos = false;
										let is_vel = false;
										
										let mismatch = false;
										
										if ( typeof snap_value === 'number' )
										{
											is_pos = ( prop === 'x' || prop === 'y' ) && !is_held_gun;

											if ( is_pos )
											{
												snap_value = Math.round( snap_value * 100 ) / 100;
												
												mismatch = ( confirmed_value !== snap_value || ( is_active_or_rare_update && is_pos ) );
											}
											else
											{
												is_vel = ( prop === 'sx' || prop === 'sy' ) && !is_held_gun;

												if ( is_vel )
												{
													snap_value = Math.round( snap_value * 100 ) / 100;
													mismatch = ( confirmed_value !== snap_value || ( is_active_or_rare_update && is_vel ) );
												}
												else
												{
													if ( prop === 'scale' )
													snap_value = Math.round( snap_value * 100 ) / 100;
													else
													snap_value = Math.round( snap_value );
												
													mismatch = ( confirmed_value !== snap_value );
												}
											}
										}
										else
										if ( typeof snap_value === 'object' )
										{
											mismatch = ( ( confirmed_value === null ) !== ( snap_value === null ) );
											
											if ( !mismatch )
											{
												if ( snap_value === null )
												{
												}
												else
												if ( typeof snap_value.s !== 'undefined' )
												{
													mismatch = ( confirmed_value.s !== snap_value.s );
												}
												else
												if ( typeof snap_value._net_id !== 'undefined' )
												{
													mismatch = ( confirmed_value._net_id !== snap_value._net_id );
												}
												else
												if ( snap_value instanceof Array )
												{
													if ( snap_value.length !== confirmed_value.length )
													mismatch = true;
													else
													for ( let i = 0; i < snap_value.length; i++ )
													{
														if ( snap_value[ i ] !== confirmed_value[ i ] )
														{
															mismatch = true;
															break;
														}
													}
												}
												else
												{
													// Will not track missing/extra properties...
													for ( let i2 in snap_value )
													{
														if ( snap_value[ i2 ] !== confirmed_value[ i2 ] )
														{
															mismatch = true;
															break;
														}
													}
												}
											}
										}
										else
										{
											mismatch = ( confirmed_value !== snap_value );
										}
										
										if ( mismatch )
										{
											if ( prop_ids === null )
											{
												prop_ids = [ i ];
												values_array_partial = [ snap_value ];
											}
											else
											{
												prop_ids.push( i );
												values_array_partial.push( snap_value );
											}
										}
										
										i++;
									}
									
									if ( prop_ids !== null )
									snapshot.push([

										ent._net_id, // 0
										prop_ids, // 1 - list of indexes of properties to update OR class name if it is a first sync OR -1 if removal OR -2 if broken
										...values_array_partial // 2... - values of properties

									]);
								}
								
								let snap_stored_copy = null;
								
								snap_stored_copy = ShallowClone( snap );
								
								//replacement_for_confirmed_snapshot.set( ent, snap_stored_copy );
								replacement_for_confirmed_snapshot.set( ent._net_id, snap_stored_copy );
								
								if ( is_static )
								this.snap_object_to_its_version.set( snap_stored_copy, ent._update_version );
								
								

								if ( ent.SyncedToPlayer !== default_SyncedToPlayer )
								if ( ent._frozen <= 0 )
								if ( triggers_sync )
								ent.SyncedToPlayer( socket.character );

								IncludeRequiredEntitiesOf( ent );
							}
							else
							{
								ent._flag = visited_ent_flag;
							}
						}
					};
					
					//let t0 = Date.now();

					const VisitCell = ( x, y )=>
					{
						let arr = sdWorld.RequireHashPosition( x, y ).arr;

						for ( let i2 = 0; i2 < arr.length; i2++ )
						{
							let ent = arr[ i2 ];
							
							if ( ent._flag < visited_ent_flag )
							AddEntity( ent, false );
						}
					};
					
					if ( !socket.character._is_being_removed )
					{
						AddEntity( socket.character, false );

						if ( socket.character.driver_of )
						AddEntity( socket.character.driver_of, true );

						if ( socket.character.hook_relative_to )
						AddEntity( socket.character.hook_relative_to, true );
					}

					// Add player's tasks
					if ( socket.character )
					if ( triggers_sync )
					for ( let t = 0; t < sdTask.tasks.length; t++ )
					if ( sdTask.tasks[ t ]._executer === socket.character )
					AddEntity( sdTask.tasks[ t ], false );
	
					let cells = vision_cells_cache[ socket.camera.scale ];

					if ( !cells )
					{
						vision_cells_cache[ socket.camera.scale ] = 
							cells = 
								[];

						for ( let x = min_x; x < max_x; x += CHUNK_SIZE )
						for ( let y = min_y; y < max_y; y += CHUNK_SIZE )
						{
							cells.push({ 
								x: Math.round( x - min_x ), 
								y: Math.round( y - min_y ), 
								dist: sdWorld.Dist2D( (min_x+max_x)/2, (min_y+max_y)/2, x, y )
							});
						}
						cells.sort((a,b)=>{
							return a.dist-b.dist;
						});

						for ( let c = 0; c < cells.length; c++ )
						delete cells[ c ].dist;
					}

					const line_of_sight_mode = sdWorld.server_config.GetLineOfSightMode( socket.character );

					if ( !line_of_sight_mode )
					{
						for ( let c = 0; c < cells.length; c++ )
						VisitCell( cells[ c ].x + min_x, cells[ c ].y + min_y );
					}
					else
					if ( socket.character )
					{
						// At the end of a beam
						const extra_xy_spread = 32;
						const extra_xy_spread_step = 32;

						// Around beam while it travels
						const extra_xy_spread_middle = 32;
						const extra_xy_spread_middle_step = 32;

						if ( extra_xy_spread_step > CHUNK_SIZE )
						throw new Error('Might jump over chunk here...');

						const hitmap = new Map();

						function CheckRect( x, y )
						{
							x = sdWorld.FastFloor( x / 16 );
							y = sdWorld.FastFloor( y / 16 );

							let hash = x * 5000 + y;

							let r = hitmap.get( hash );

							if ( r === undefined )
							{
								//r = sdWorld.CheckWallExists( x * 16 + 8, y * 16 + 8, null, null, null, sdWorld.FilterVisionBlocking );
								r = sdWorld.CheckWallExistsBox( x * 16, y * 16, x * 16 + 16, y * 16 + 16, socket.character, null, null, sdWorld.FilterVisionBlocking );
								hitmap.set( hash, r );
							}

							return r;
						}

						const visited_hashes = new Set();
						//const seen_hashes = [];

						for ( let b = 0; b < 32; b++ )
						{
							// TODO: Make beams at least casted down at first - it tends to discover cells clockwise and due to static entity limit per snapshot it will do this slowly

							let x = sdWorld.limit( min_x, socket.character.x, max_x );
							let y = sdWorld.limit( min_y, socket.character.y, max_y );

							const dx = Math.sin( b / 32 * Math.PI * 2 ) * 16;
							const dy = Math.cos( b / 32 * Math.PI * 2 ) * 16;
							
							x += dx / 2;
							y += dy / 2;

							let ttl = -1;

							while ( x >= min_x && x <= max_x && y >= min_y && y <= max_y )
							{
								if ( ttl === -1 )
								{
									if ( CheckRect( x, y ) )
									ttl = 0; // 10 seems enough in no xy-spread but this is not how clients see world
								}
								else
								if ( --ttl < 0 )
								break;

								const extra_xy_spread_this = ( ttl === 0 ) ? extra_xy_spread : extra_xy_spread_middle;
								const extra_xy_spread_step_this = ( ttl === 0 ) ? extra_xy_spread_step : extra_xy_spread_middle_step;

								//let xx = 0;
								//let yy = 0;
								for ( let xx = -extra_xy_spread_this; xx <= extra_xy_spread_this; xx += extra_xy_spread_step_this )
								for ( let yy = -extra_xy_spread_this; yy <= extra_xy_spread_this; yy += extra_xy_spread_step_this )
								{
									const hash = ( sdWorld.FastFloor( (y+yy) / CHUNK_SIZE ) ) * 4098 + sdWorld.FastFloor( (x+xx) / CHUNK_SIZE );

									if ( visited_hashes.has( hash ) )
									{
									}
									else
									{
										visited_hashes.add( hash );
										
										let info = this.visited_hashes_untils.get( hash );
										if ( info === undefined )
										{
											this.visited_hashes_untils.set( hash, { x:x+xx, y:y+yy, until:sdWorld.time + 5000 } ); 
										}
										else
										{
											info.until = sdWorld.time + 5000;
										}
									}
								}

								x += dx;
								y += dy;
							}
						}
						
						for ( let [ hash, info ] of this.visited_hashes_untils )
						{
							if ( sdWorld.time > info.until )
							{
								this.visited_hashes_untils.delete( hash );
								continue;
							}
							
							let x = info.x;
							let y = info.y;
							
							if ( x+CHUNK_SIZE >= min_x && x-CHUNK_SIZE <= max_x && y+CHUNK_SIZE >= min_y && y-CHUNK_SIZE <= max_y )
							{
								visited_hashes.add( hash );
								
								const cell = sdWorld.RequireHashPosition( x, y );
								const arr = cell.arr;

								for ( let i2 = 0; i2 < arr.length; i2++ )
								AddEntity( arr[ i2 ], false );
							
							
							
								snapshot.push( [ 
									( info.until === sdWorld.time + 5000 ) ? -1 : -2,
									hash,
									sdWorld.FastFloor( (x) / CHUNK_SIZE ),
									sdWorld.FastFloor( (y) / CHUNK_SIZE )
								] );
							}
						}
						/*
						for ( let x = min_x-CHUNK_SIZE; x < max_x+CHUNK_SIZE; x += CHUNK_SIZE )
						for ( let y = min_y-CHUNK_SIZE; y < max_y+CHUNK_SIZE; y += CHUNK_SIZE )
						{
							const hash = ( sdWorld.FastFloor( (y) / CHUNK_SIZE ) ) * 4098 + sdWorld.FastFloor( (x) / CHUNK_SIZE );
							if ( !visited_hashes.has( hash ) )
							{
								visited_hashes.add( hash );

								snapshot.push( [ 
									-1,
									hash,
									
									sdWorld.FastFloor( (x) / CHUNK_SIZE ),
									sdWorld.FastFloor( (y) / CHUNK_SIZE )
								] );
							}
						}*/
					}
					
					for ( var i2 = 0; i2 < sdEntity.global_entities.length; i2++ ) // So it is drawn on back
					AddEntity( sdEntity.global_entities[ i2 ] );
					//snapshot.push( sdEntity.global_entities[ i2 ].GetSnapshot( frame, false, socket.character ) );
					
					/*let t1 = Date.now();
					
					if ( t1 > t0 + 4 )
					{
						 debugger;
					}*/
					
					// ------------- End of entity adding, now sending removals -------------------------
					
					let net_id_onces = ( this.sent_messages_confirmed_ids.length > 1 ) ? new Set() : null;
					
					for ( let i = 0; i < this.sent_messages_confirmed_ids.length; i++ )
					{
						let confirmed_snapshot = this.send_messages.get( this.sent_messages_confirmed_ids[ i ] );
						
						if ( confirmed_snapshot )
						{
							for ( let [ _net_id, snap_values ] of confirmed_snapshot )
							{
								if ( net_id_onces )
								{
									if ( i > 0 && net_id_onces.has( _net_id ) ) // Do not check on first snapshot
									continue;

									net_id_onces.add( _net_id );
								}
								
								let ent;
								
								ent = current_snapshot_entities_by_net_id.get( _net_id );
								
								if ( !ent )
								ent = sdEntity.entities_by_net_id_cache_map.get( _net_id );
								
								if ( !ent )
								{
									let info = sdEntity.removed_entities_info.get( _net_id );
									if ( info === undefined )
									{
										// Send deletion // Almost copy [ 1 / 2 ]
										snapshot.push([

											_net_id, // 0
											-1 // 1 - list of indexes of properties to update OR class name if it is a first sync OR -1 if removal OR -2 if broken

										]);
										
										// Scan all snapshots into future and remove this entity, effectivaly causing full snapshot of this entity next time // Copy [ 1 / 2 ]
										for ( let [ uid, snapshot ] of this.send_messages )
										snapshot.delete( _net_id );
									
										continue;
									}
									else
									{
										ent = info.entity;
									}
								}
								
								if ( ent.is_static )
								//if ( !sdByteShifter.simulate_all_as_non_static )
								{
									let new_version = this.snap_object_to_its_version.get( snap_values );
									
									if ( new_version === undefined )
									throw new Error();
									
									let old_version = this.known_statics_versions.get( ent );
									
									if ( old_version === undefined || new_version > old_version )
									this.known_statics_versions.set( ent, new_version );
								}
								
								if ( ent._flag !== listed_ent_flag ) // No longer listed? Then it is probably no longer visible or actually broken
								{
									ent._flag = listed_ent_flag;

									// Send deletion // Almost copy [ 2 / 2 ]
									snapshot.push([

										ent._net_id, // 0
										ent._broken ? -2 : -1 // 1 - list of indexes of properties to update OR class name if it is a first sync OR -1 if removal OR -2 if broken

									]);
									
									// Scan all snapshots into future and remove this entity, effectivaly causing full snapshot of this entity next time // Copy [ 2 / 2 ]
									for ( let [ uid, snapshot ] of this.send_messages )
									snapshot.delete( _net_id );
									//snapshot.delete( ent );
									
									if ( ent.is_static )
									this.known_statics_versions.delete( ent );
								}
							}
						}
						else
						{
							if ( sdWorld.time > sdByteShifter.last_warning + 60 * 1000 )
							{
								sdByteShifter.last_warning = sdWorld.time;
								trace( 'Unable to compare snapshot that is being sent to old snapshots that were client-mentioned as confirmed ( '+this.sent_messages_confirmed_ids[ i ]+' < '+this.sent_messages_first+' < '+this.sent_messages_last+' ). This may cause entities not being properly removed on client-side, especially RTP tasks since they are constantly made and deleted...' );
							}
							
							this.sent_messages_confirmed_ids.splice( i, 1 );
							i--;
							continue;
						}
					}
					
					/*let t2 = Date.now();
					
					if ( t2 > t1 + 4 )
					{
						 debugger;
					}*/

					// ------------- End of entity adding and removals data -------------------------
					
					let leaders = null;

					if ( sdWorld.time > socket.last_sync_score + 1000 )
					{
						socket.last_sync_score = sdWorld.time;

						leaders = [ sdWorld.leaders_global, sdWorld.GetPlayingPlayersCount( false, false ) ];
						
						let leaders_str = JSON.stringify( leaders );
						
						if ( leaders_str !== this.old_leaders_str )
						{
							leaders = LZW.lzw_encode( leaders_str );
							this.old_leaders_str = leaders_str;
						}
						else
						leaders = null;
					}

					let sd_events = [];

					if ( socket.sd_events.length > 100 )
					{
						if ( !allow_silent_event_skip )
						if ( Date.now() > sdByteShifter.events_overflow_warning_next_time )
						{
							// Once in 6 hours
							sdByteShifter.events_overflow_warning_next_time = Date.now() + 1000 * 60 * 60 * 6;
							trace( '.sd_events overflow: ' + JSON.stringify( socket.sd_events ) );
						}
						
						//console.log('socket.sd_events overflow (last sync was ' + ( sdWorld.time - previous_sync_time ) + 'ms ago): ', socket.sd_events );

						//debugger;

						socket.SDServiceMessage( 'Server: .sd_events overflow (' + socket.sd_events.length + ' events were skipped). Some sounds and effects might not spawn as result of that.' );

						socket.sd_events.length = 0;
					}

					while ( sd_events.length < 10 && socket.sd_events.length > 0 )
					sd_events.push( socket.sd_events.shift() );
				
				
				
					//trace( snapshot );
					//debugger;
					
					
				
					let promise_snapshot_compress = globalThis.ExecuteParallelPromise({ action: WorkerServiceLogic.ACTION_LZW, data: JSON.stringify( snapshot ) });//sdSnapPack.Compress( snapshot );
					let promise_sd_events_compress = ( sd_events.length === 0 ) ?
														null
														: 
														globalThis.ExecuteParallelPromise({ action: WorkerServiceLogic.ACTION_LZW, data: JSON.stringify( sd_events ) });
					
					//LZW.lzw_encode( JSON.stringify( sd_events ) )

					//await Promise.all([ promise_snapshot_compress, promise_sd_events_compress ]);

					//debugger;

					let full_msg = [ 
						await promise_snapshot_compress, // 0
						socket.GetScore(), // 1
						leaders,//LZW.lzw_encode( JSON.stringify( leaders ) ), // 2
						( sd_events.length === 0 ) ? 0 : await promise_sd_events_compress, // 3
						//leaders, // 2
						//sd_events, // 3
						socket.character ? Math.round( socket.character._force_add_sx * 1000 ) / 1000 : 0, // 4
						socket.character ? Math.round( socket.character._force_add_sy * 1000 ) / 1000 : 0, // 5
						socket.character ? Math.max( -1, socket.character._position_velocity_forced_until - sdWorld.time ) : 0, // 6
						sdWorld.last_frame_time, // 7
						sdWorld.last_slowest_class, // 8
						this.sent_messages_last, // 9
						line_of_sight_mode ? 1 : 0, // 10
						this.sent_messages_confirmed_ids.slice(), // 11
						//this.message_id++ // 12
					];

					// Await can happen after disconnection and full GC removal of any pointer on socket
					if ( !socket.connected )
					return;


					/*let full_msg_story = [ 
						snapshot_only_statics, // 0
						null, // 1
						null, // 2
						sd_events, // 3
						null, // 4
						null, // 5
						null, // 6
						null, // 7
						null, // 8
						socket.sent_messages_last, // 9
						null // 10
					];

					socket.sent_messages.set( socket.sent_messages_last++, { data: full_msg_story, time: sdWorld.time, arrived: false } );

					// Forget too old messages
					while ( socket.sent_messages.get( socket.sent_messages_first ).time < sdWorld.time - old_shapshots_expire_in_in ) // Used to be 10000 but lower value is better because static entities will be removed in each sync from all these snapshots
					socket.sent_messages.delete( socket.sent_messages_first++ );*/
					
					this.ClearOutdatedSentMessages();
					
					this.send_messages.set( this.sent_messages_last++, replacement_for_confirmed_snapshot );

					//for ( let g = 0; g < 25; g++ )
					//if ( Math.random() < 0.2 )
					if ( Math.random() < 1 - sdByteShifter.simulate_packet_loss_percentage )
					{
						if ( !SOCKET_IO_MODE )
						socket.compress( true ).emit('RESv3', LZW.lzw_encode( JSON.stringify( full_msg ) ) );
						else
						socket.compress( true ).emit('RESv3', full_msg );
					}

					//socket.sent_result_ok++;

					if ( socket.character )
					{
						socket.character._force_add_sx = 0;
						socket.character._force_add_sy = 0;
					}

					//socket.observed_entities = observed_entities;

					if ( triggers_sync )
					if ( sdWorld.time > socket.next_reaction_to_seen_entity_time )
					if ( socket.character )
					{
						socket.next_reaction_to_seen_entity_time = sdWorld.time + 100;
						
						let keys_arr = Array.from( current_snapshot_entities_by_net_id.values() );

						let i = ~~( Math.random() * keys_arr.length );
						if ( i < keys_arr.length )
						socket.character.onSeesEntity( keys_arr[ i ] );
					}
				}
				
				socket.sync_busy = false;
			};

			SyncDataToPlayer();
		}
	}
}
sdByteShifter.init_class();

export default sdByteShifter;