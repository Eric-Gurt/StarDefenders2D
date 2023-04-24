/*

	Scans anything that is accessible from globalThis, incrementally. 
	Should help detecting memory leaks in most cases. 
	But will also handle them by itself, assuiming left over entities were removed properly with .remove() calls.
	
	It has delays of 10 seconds and compares pair of most recent potentially leaking pointers towards removed entities. It should be pretty accurate.

	if ( sdMemoryLeakSeeker.erase_pointers_towards_removed_entities === false )
	Reports each leak case just once per 6 hours (assuming they have same access stack). This will cause double-reporting of same issues if something really stays leaked for that long time which is alarming.

	It seems to be robust.

	Note: Will detect too long arrays but don't expect it to be useful here.

	Add this to DevTools' watch list for debugging:
		sdMemoryLeakSeeker.always_do_full_cycle = true; sdMemoryLeakSeeker.log_erased_pointers = true; sdMemoryLeakSeeker.log_erased_pointers_count = true;
		( sdMemoryLeakSeeker.steps_total_currently / sdMemoryLeakSeeker.steps_total_previously * 100 )

*/
import sdWorld from '../sdWorld.js';
import sdEntity from '../entities/sdEntity.js';
import sdPathFinding from '../ai/sdPathFinding.js';

class sdMemoryLeakSeeker
{
	static init_class()
	{
		sdMemoryLeakSeeker.enabled = false; // Can be used to disabled at any time
		
		sdMemoryLeakSeeker.is_currently_executed = false; // You can use this property to prevent it from causing certain logic whenever getters are called
		
		sdMemoryLeakSeeker.always_do_full_cycle = false; // Hack. Does nearly instant check, but can cause lags. For debugging only
		
		sdMemoryLeakSeeker.erase_pointers_towards_removed_entities = true;
		
		sdMemoryLeakSeeker.log_erased_pointers = false;
		
		sdMemoryLeakSeeker.log_erased_pointers_count = false;
	   
		if ( sdMemoryLeakSeeker.always_do_full_cycle )
		trace( 'Debug option is enabled: sdMemoryLeakSeeker.always_do_full_cycle - it can cause performance issues' );
	   
		sdMemoryLeakSeeker.steps_total_previously = 0;
		sdMemoryLeakSeeker.steps_total_currently = 0;
	   
		sdMemoryLeakSeeker.last_found_entries = [];
		sdMemoryLeakSeeker.current_found_entries = [];
		
		sdMemoryLeakSeeker.announced_entries = new Set();
		
		sdMemoryLeakSeeker.erased_pointers = 0;
	   
		sdMemoryLeakSeeker.Reset();
	}
	
	static NewDetection( str, obj )
	{
		sdMemoryLeakSeeker.current_found_entries.push( str );
		
		if ( !sdMemoryLeakSeeker.announced_entries.has( obj ) )
		{
			if ( sdMemoryLeakSeeker.last_found_entries.indexOf( str ) !== -1 )
			{
				sdMemoryLeakSeeker.announced_entries.add( obj );

				console.error( 'Potential memory leak detected. Location of pointer towards destroyed object (it stayed here for more than 10 seconds): ', str );

				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				sdWorld.sockets[ i ].SDServiceMessage( 'New memory leak detected (' + obj.GetClass() + ')! Tell server admin to check error logs file' );

				// Forget after 6 hours
				setTimeout( ()=>
				{
					sdMemoryLeakSeeker.announced_entries.delete( obj );

				}, 1000 * 60 * 60 * 6 );
			}
		}
		
	}
	
	static Reset()
	{
		sdMemoryLeakSeeker.next_test_will_start_at = null; // Used to make it wait exactly 10 seconds before starting new test (just so whatever can be left by cache will be disposed normally)
		
		sdMemoryLeakSeeker.steps_total_previously = sdMemoryLeakSeeker.steps_total_currently;
		sdMemoryLeakSeeker.steps_total_currently = 0;
		
		sdMemoryLeakSeeker.last_found_entries = sdMemoryLeakSeeker.current_found_entries;
		sdMemoryLeakSeeker.current_found_entries = [];
		
		sdMemoryLeakSeeker.scheduled_objects = [ globalThis ];
		sdMemoryLeakSeeker.scheduled_objects_offset = 0;
		
		sdMemoryLeakSeeker.current_object = null;
		sdMemoryLeakSeeker.scheduled_current_object_properties = null;
		sdMemoryLeakSeeker.scheduled_current_object_properties_offset = 0;
		
		sdMemoryLeakSeeker.visited_objects = new WeakSet();
		sdMemoryLeakSeeker.parental_structure = new WeakMap(); // obj -> [ parentObj, prop ]
		
		if ( sdMemoryLeakSeeker.erased_pointers > 0 && sdMemoryLeakSeeker.log_erased_pointers_count )
		{
			trace( 'sdMemoryLeakSeeker task complete. Erased pointers: ' + sdMemoryLeakSeeker.erased_pointers );
		}
		
		sdMemoryLeakSeeker.erased_pointers = 0;
		
		sdMemoryLeakSeeker.visited_objects.add( sdMemoryLeakSeeker );
	}
	
	static GetLocationOf( obj )
	{
		let parts = [];

		let ptr = obj;

		while ( ptr )
		{
			let parent_and_prop = sdMemoryLeakSeeker.parental_structure.get( ptr );
			
			if ( parent_and_prop === undefined )
			{
				parts.unshift( 'globalThis' );
				break;
			}

			if ( parent_and_prop[ 1 ] instanceof sdEntity )
			parts.unshift( '<' + parent_and_prop[ 1 ].GetClass() + '>' );
			else
			{
				parts.unshift( parent_and_prop[ 1 ] );

				if ( ptr instanceof sdEntity )
				parts[ 0 ] = parts[ 0 ] + '(<' + ptr.GetClass() + '>)';
			}
			
			ptr = parent_and_prop[ 0 ];
		}

		if ( obj instanceof sdEntity )
		return parts.join( '.' ) + ' = ' + JSON.stringify({ _class: obj.GetClass(), _hiberstate:obj._hiberstate, hea:obj.hea, hmax:obj.hmax, _hea:obj._hea, _hmax:obj._hmax, x: obj.x, y:obj.y, w: obj.w, h:obj.h });
		else
		return parts.join( '.' );
	}
	
	static Step()
	{		
		if ( sdMemoryLeakSeeker.current_object )
		{
			//if ( sdMemoryLeakSeeker.scheduled_current_object_properties.length > 0 )
			if ( sdMemoryLeakSeeker.scheduled_current_object_properties_offset < sdMemoryLeakSeeker.scheduled_current_object_properties.length )
			{
				//let prop = sdMemoryLeakSeeker.scheduled_current_object_properties.shift();
				
				let old_offset = sdMemoryLeakSeeker.scheduled_current_object_properties_offset;
				
				let prop = sdMemoryLeakSeeker.scheduled_current_object_properties[ sdMemoryLeakSeeker.scheduled_current_object_properties_offset++ ];
				
				sdMemoryLeakSeeker.scheduled_current_object_properties[ old_offset ] = null;
				
				//if ( sdMemoryLeakSeeker.current_object === sdEntity )
				if ( sdMemoryLeakSeeker.current_object === sdEntity.removed_entities_info ||
					 sdMemoryLeakSeeker.current_object === sdEntity.entities ||
					 sdMemoryLeakSeeker.current_object === sdEntity.entities_by_net_id_cache_map ||
					 sdMemoryLeakSeeker.current_object instanceof sdPathFinding // It is better to keep these for reverse keys to work properly
				   )
				{
					//if ( prop === 'removed_entities_info' )
					//{
						return true; // This one should remember removed entities for a short period of time
					//}
				}
				else
				{
					if ( typeof sdMemoryLeakSeeker.current_object.connected !== 'undefined' ) // Quick check if object is a connected socket
					if ( typeof sdMemoryLeakSeeker.current_object.acks !== 'undefined' ) // Quick check if object is a connected socket
					{
						return true; // Ignore anything about them since there can be very big arrays of everything
						
						/*debugger;
						
						if ( prop === 'observed_entities' || prop === 'known_non_removed_dynamics' || prop === 'character' ) // Part of socket
						{
							return true; // This should be allowed
						}*/
					}
				}
				
				let value;
				
				if ( sdMemoryLeakSeeker.current_object instanceof Map )
				value = sdMemoryLeakSeeker.current_object.get( prop );
				else
				if ( sdMemoryLeakSeeker.current_object instanceof Set )
				{
					value = prop;
				}
				else
				{
					try
					{
						value = sdMemoryLeakSeeker.current_object[ prop ];
					}
					catch ( e )
					{
						return true; // Just continue if getter throws an error
					}
				}
				
				/*if ( value === null || value === undefined || typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'symbol' )
				{
				}
				else*/
				if ( value !== null )
				if ( typeof value === 'object' || typeof value === 'function' )
				{
					
					if ( !sdMemoryLeakSeeker.visited_objects.has( value ) )
					{
						if ( value instanceof Array )
						{
							if ( value.length > 200000 )
							{
								sdMemoryLeakSeeker.NewDetection( sdMemoryLeakSeeker.GetLocationOf( value ) + ' (array length is really long: '+value.length+')', value );
							}
						}
						
						sdMemoryLeakSeeker.parental_structure.set( value, [ sdMemoryLeakSeeker.current_object, prop ] );
						
						if ( value instanceof sdEntity )
						//if ( value.prototype ) // Actually instance rather than class
						if ( value._hiberstate !== undefined )
						//if ( value._is_being_removed ) // Can be false-positive due to delayed _remove() call
						//if ( sdEntity.entities_by_net_id_cache_map.get( value._net_id ) !== value ) // _remove() has been called on object
						if ( value._hiberstate === sdEntity.HIBERSTATE_REMOVED || sdEntity.entities.indexOf( value ) === -1 )
						{
							if ( sdMemoryLeakSeeker.erase_pointers_towards_removed_entities )
							{
								if ( sdMemoryLeakSeeker.log_erased_pointers )
								{
									if ( sdMemoryLeakSeeker.current_object !== sdEntity.to_seal_list ) // Ignore these
									trace( 'Erasing pointer: ' + sdMemoryLeakSeeker.GetLocationOf( value ) );
								}
								
								//trace( value.prototype );
								
								// Fix the issue by overriding pointers towards removed objects
								if ( sdMemoryLeakSeeker.current_object instanceof Map )
								sdMemoryLeakSeeker.current_object.set( prop, sdEntity.removed_object );
								else
								if ( sdMemoryLeakSeeker.current_object instanceof Set )
								sdMemoryLeakSeeker.current_object.delete( prop );
								else
								{
									if ( sdMemoryLeakSeeker.current_object instanceof Array )
									{
										sdMemoryLeakSeeker.current_object[ prop ] = sdEntity.removed_object; // Just to keep indices in case if there are multiple arrays of some sort
									}
									else
									if ( sdMemoryLeakSeeker.current_object instanceof sdEntity )
									{
										sdMemoryLeakSeeker.current_object[ prop ] = null; // It is just easier to deal with...
									}
									else
									sdMemoryLeakSeeker.current_object[ prop ] = sdEntity.removed_object; // Strange case, probably some kind of Object but not a regular entity...
								}
							
								sdMemoryLeakSeeker.erased_pointers++;
							}
							else
							sdMemoryLeakSeeker.NewDetection( sdMemoryLeakSeeker.GetLocationOf( value ), value );
						}
						
						if ( sdMemoryLeakSeeker.scheduled_objects.length > 1000 )
						{
							let cut_first_n = 0;
							
							while ( sdMemoryLeakSeeker.scheduled_objects[ cut_first_n ] === null && cut_first_n < sdMemoryLeakSeeker.scheduled_objects.length )
							cut_first_n++;
						
							sdMemoryLeakSeeker.scheduled_objects.splice( 0, cut_first_n );
							sdMemoryLeakSeeker.scheduled_objects_offset -= cut_first_n;
						}
						
						if ( value === undefined )
						{
						}
						else
						if ( value instanceof Array && value.length === 0 )
						{
						}
						else
						sdMemoryLeakSeeker.scheduled_objects.push( value );
					}
				}
				/*else
				{
					throw new Error( 'Unknown object type...' + typeof value );
				}*/
			}
			else
			{
				sdMemoryLeakSeeker.current_object = null;
			}
		}
		else
		//if ( sdMemoryLeakSeeker.scheduled_objects.length > 0 )
		if ( sdMemoryLeakSeeker.scheduled_objects_offset < sdMemoryLeakSeeker.scheduled_objects.length )
		{
			let old_offset = sdMemoryLeakSeeker.scheduled_objects_offset;
			
			//let obj = sdMemoryLeakSeeker.scheduled_objects.shift();
			let obj = sdMemoryLeakSeeker.scheduled_objects[ sdMemoryLeakSeeker.scheduled_objects_offset++ ];
			
			sdMemoryLeakSeeker.scheduled_objects[ old_offset ] = null;
			
			if ( !sdMemoryLeakSeeker.visited_objects.has( obj ) )
			{
				sdMemoryLeakSeeker.visited_objects.add( obj );
						
				sdMemoryLeakSeeker.current_object = obj;
				
				if ( obj instanceof Map || obj instanceof Set )
				{
					if ( Object.keys( obj ).length > 0 )
					{
						throw new Error( 'Unexpected properties on Map/Set object' );
					}
				
					sdMemoryLeakSeeker.scheduled_current_object_properties = [];
					
					let keys = obj.keys();
					while ( true )
					{
						let struct = keys.next();
						
						if ( struct.done )
						break;
					
						sdMemoryLeakSeeker.scheduled_current_object_properties.push( struct.value );
						
						
					}
				}
				else
				{
					if ( obj.__proto__ && obj.__proto__.constructor.name === 'Server' ) // Some internal object that generates deprecated warnings
					{
						sdMemoryLeakSeeker.scheduled_current_object_properties = Object.keys( obj );
					}
					else
					{
						sdMemoryLeakSeeker.scheduled_current_object_properties = Object.getOwnPropertyNames( obj );
					}
					
					for ( let i = 0; i < sdMemoryLeakSeeker.scheduled_current_object_properties.length; i++ )
					{
						let descriptor = Object.getOwnPropertyDescriptor( obj, sdMemoryLeakSeeker.scheduled_current_object_properties[ i ] );

						if ( descriptor.get ) // This is a getter, and those like to throw strange exceptions that may crash whole node process, for example on Ubuntu apparently
						{
							sdMemoryLeakSeeker.scheduled_current_object_properties.splice( i, 1 );
							i--;
							continue;
						}
					}
				}
				
				sdMemoryLeakSeeker.scheduled_current_object_properties_offset = 0;
			}
		}
		else
		{
			if ( sdMemoryLeakSeeker.next_test_will_start_at === null )
			{
				if ( sdMemoryLeakSeeker.always_do_full_cycle )
				sdMemoryLeakSeeker.next_test_will_start_at = sdWorld.time + 1000;
				else
				sdMemoryLeakSeeker.next_test_will_start_at = sdWorld.time + 10000;
			}
			else
			if ( sdWorld.time > sdMemoryLeakSeeker.next_test_will_start_at && IsGameActive() ) // Do not run new tests when game is active (but finish previous ones)
			{
				// Nothing left to check - deep search complete
				sdMemoryLeakSeeker.Reset();
			}
			
			return false; // Skip remaining steps
		}
		
		sdMemoryLeakSeeker.steps_total_currently++;
		
		return true;
	}
	
	static ThinkNow()
	{
		if ( !sdMemoryLeakSeeker.enabled )
		return;
		
		sdMemoryLeakSeeker.is_currently_executed = true;
		{
			//const many_steps = ( sdMemoryLeakSeeker.always_do_full_cycle || sdMemoryLeakSeeker.steps_total_previously === 0 || !IsGameActive() );
			//const many_steps = ( sdMemoryLeakSeeker.always_do_full_cycle || !IsGameActive() );
			
			const many_steps = false; // No, because it might delay player's connection to an empty server
			
			const steps = many_steps ? 10000 : 5; // Will work quite slowly, like 1% percent per 10-20 seconds depending on world size. Unless all players left - then it will finish remaining cycle and won't start any new ones

			let t = Date.now();
			let t2;

			for ( let i = 0; i < steps; i++ ) // Verify 10 properties at a time (per frame basically)
			{
				if ( !sdMemoryLeakSeeker.Step() )
				break;
				
				if ( !many_steps )
				{
					t2 = Date.now();
					
					// Don't waste too much time here, 2ms at most
					if ( t2 - t >= 2 )
					break;
				}
			}
		}
		sdMemoryLeakSeeker.is_currently_executed = false;
	}
}

export default sdMemoryLeakSeeker;