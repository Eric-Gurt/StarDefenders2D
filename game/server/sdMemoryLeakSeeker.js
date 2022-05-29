/*

	Scans anything that is accessible from globalThis, incrementally. Should help at detecting memory leaks in most cases.
	
	It has delays of 10 seconds and compares pair of most recent potentially leaking pointers towards removed entities. It should be pretty accurate.

	Reports each leak case just once per 6 hours (assuming they have same access stack). This will cause double-reporting of same issues if something really stays leaked for that long time which is alarming.

	It seems to be really robust.

	Note: Will detect too long arrays but don't expect it to be useful here.

*/
import sdWorld from '../sdWorld.js';
import sdEntity from '../entities/sdEntity.js';

class sdMemoryLeakSeeker
{
	static init_class()
	{
		sdMemoryLeakSeeker.enabled = true; // Can be used to disabled at any time
		
		sdMemoryLeakSeeker.is_currently_executed = false; // You can use this property to prevent it from causing certain logic whenever getters are called
		
		sdMemoryLeakSeeker.always_do_full_cycle = false; // Hack. Does nearly instant check, but can cause lags. For debugging only
	   
		if ( sdMemoryLeakSeeker.always_do_full_cycle )
		trace( 'Debug option is enabled: sdMemoryLeakSeeker.always_do_full_cycle - it can cause performance issues' );
	   
		sdMemoryLeakSeeker.steps_total_previously = 0;
		sdMemoryLeakSeeker.steps_total_currently = 0;
	   
		sdMemoryLeakSeeker.last_found_entries = [];
		sdMemoryLeakSeeker.current_found_entries = [];
		
		sdMemoryLeakSeeker.announced_entries = new Set();
	   
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
		
		sdMemoryLeakSeeker.current_object = null;
		sdMemoryLeakSeeker.scheduled_current_object_properties = null;
		
		sdMemoryLeakSeeker.visited_objects = new WeakSet();
		sdMemoryLeakSeeker.parental_structure = new WeakMap(); // obj -> [ parentObj, prop ]
		
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
			if ( sdMemoryLeakSeeker.scheduled_current_object_properties.length > 0 )
			{
				let prop = sdMemoryLeakSeeker.scheduled_current_object_properties.shift();
				
				let value;
				
				if ( sdMemoryLeakSeeker.current_object instanceof Map )
				value = sdMemoryLeakSeeker.current_object.get( value );
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
				
				if ( value === null || value === undefined || typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'symbol' )
				{
				}
				else
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
						if ( value._is_being_removed )
						sdMemoryLeakSeeker.NewDetection( sdMemoryLeakSeeker.GetLocationOf( value ), value );
						
						sdMemoryLeakSeeker.scheduled_objects.push( value );
					}
				}
				else
				{
					throw new Error( 'Unknown object type...' + typeof value );
				}
			}
			else
			{
				sdMemoryLeakSeeker.current_object = null;
			}
		}
		else
		if ( sdMemoryLeakSeeker.scheduled_objects.length > 0 )
		{
			let obj = sdMemoryLeakSeeker.scheduled_objects.shift();
			
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
				}
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
			const steps = ( sdMemoryLeakSeeker.always_do_full_cycle || sdMemoryLeakSeeker.steps_total_previously === 0 || !IsGameActive() ) ? 10000 : 10; // Will work quite slowly, like 1% percent per 10-20 seconds depending on world size. Unless all players left - then it will finish remaining cycle and won't start any new ones

			for ( let i = 0; i < steps; i++ ) // Verify 10 properties at a time (per frame basically)
			if ( !sdMemoryLeakSeeker.Step() )
			break;
		}
		sdMemoryLeakSeeker.is_currently_executed = false;
	}
}

export default sdMemoryLeakSeeker;