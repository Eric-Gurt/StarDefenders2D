
import LZW from './LZW.js';

class sdSnapPack
{
	static init_class()
	{
		sdSnapPack.all_time_worst_case = '';
		sdSnapPack.recent_worst_case = '';
		
		sdSnapPack.recent_worst_case_changed = false;
		sdSnapPack.all_time_worst_case_changed = false;
		
		//sdSnapPack.apply_lzw_for_snapshots = true; // Apparently some servers would prefer CPU-intensive comression over more data...
		sdSnapPack.apply_lzw_for_snapshots = false; // LZW isn't fast, 10% of total performance for just 1 user in some cases. Will use it for events only for now
		
		//sdSnapPack.textEncoder = new TextEncoder(); Not available natively at Node
		//sdSnapPack.textDecoder = new TextDecoder();
		
		// sdSnapPack.textEncoder.encode( str )
		// sdSnapPack.textDecoder.decode( arr )
	}
	/*static compressArrayBuffer( input )
	{
		const stream = new Response( input ).body.pipeThrough( new CompressionStream( 'deflate' ) );
		return new Response( stream ).arrayBuffer();
	}*/
	
	/*
	static f( a )
	{
		if ( typeof a === 'object' && !Array.isArray( a ) && a !== null )
		{
			let s = '';
			for ( let p in a )
			{
				if ( s.length > 0 )
				s += ',';

				s += p + ':' + sdSnapPack.f( a[ p ] );
			}
			return '{' + s + '}';
		}
		else
		return JSON.stringify( a );
	}
	*/
	static Compress( object_array, track_worst_case=false )
	{
		let unique_objects = new WeakSet();
	    
		function numDigits( x ) 
		{
		    //if ( chet = !chet )
		    return ( Math.log10( ( x ^ ( x >> 31 ) ) - ( x >> 31 ) ) | 0 ) + 1;
		    //else
		    //return Math.max(Math.floor(Math.log10(Math.abs(x))), 0) + 1;
		}
		
		function Iteration( object_array, inception )
		{
		    if ( object_array.length <= 1 )
		    {
				return object_array;
		    }
		    
		    let max_props = 0;
		    
		    // Try to cancel Iteration (at least complex compression part, will still do property packing)
		    prop_counter:
		    for ( let i = 0; i < object_array.length; i++ )
		    {
				let props = 0;
				for ( let p in object_array[ i ] )
				{
					props++;
					if ( props > 1 )
					{
						max_props = props;
						break prop_counter;
					}
				}
		    }
		    
		    let best_key_value_hits = 0;
		    
		    let key_value_compression_candidates;

		    let best_key = null;
		    let best_value = null;

		    if ( max_props > 1 )
		    {
				key_value_compression_candidates = new Map(); // Object of keys where values are Maps of values as keys and values are number of same values for same keys

				for ( let i = 0; i < object_array.length; i++ )
				{
					let ent = object_array[ i ];

					//Object.keys( ent );
					//Object.values( ent );

					if ( ent instanceof Array )
					{
					}
					else
					{
						for ( let p in ent )
						if ( p !== '_net_id' )
						if ( typeof ent[ p ] !== 'object' || ent[ p ] === null )
						{
							let value = ent[ p ];

							let map_of_value_candidates;

							map_of_value_candidates = key_value_compression_candidates.get( p );
							if ( !map_of_value_candidates )
							{
								map_of_value_candidates = new Map();
								key_value_compression_candidates.set( p, map_of_value_candidates );
							}

							/*if ( typeof key_value_compression_candidates[ p ] === 'undefined' )
							map_of_value_candidates = key_value_compression_candidates[ p ] = new Map();
							else
							map_of_value_candidates = key_value_compression_candidates[ p ]*/

							let hits;

							let hit_cost;

							if ( typeof value === 'number' )
							hit_cost = 3 + p.length + numDigits( value );
							else
							if ( typeof value === 'string' )
							hit_cost = 3 + p.length + value.length + 2;
							else
							if ( value === true )
							hit_cost = 3 + p.length + 4;
							else
							if ( value === false )
							hit_cost = 3 + p.length + 5;
							else
							if ( value === null )
							hit_cost = 3 + p.length + 4;
							else
							if ( value === undefined || isNaN( value ) || value === Infinity || value === -Infinity ) // Infinity becomes null in JSON spec...
							{
								hit_cost = 3 + p.length + 4; // Becomes null in the end
								
								throw new Error( 'Get rid of undefined & NaN values... undefined values are becoming nulls in JSON and NaN values just cause endless recursion. Property name is '+ent.GetClass()+'['+ent._net_id+'].'+p+' = '+value+';' );
							}
							else
							{
								debugger; // Avoid usage of JSON.stringify for simple objects?
								
								if ( p === undefined ) // Reason of recent crash...
								{
									console.log( 'ent, object_array:', ent, object_array );
									
									throw new Error('How is it undefined?');
								}
								
								hit_cost = 3 + p.length + JSON.stringify( value ).length;
							}

							hits = map_of_value_candidates.get( value );
							//hits = map_of_value_candidates[ value ];

							//if ( map_of_value_candidates.has( value ) )
							//hits = map_of_value_candidates.get( value ) + hit_cost;
							if ( hits !== undefined )
							hits += hit_cost;
							else
							hits = hit_cost - ( 2/*outer array brackets*/ + 1/*comma*/ + hit_cost+2/*JSON.stringify( [ p, value ] ).length*/ ); // Subtract own cost on init

							map_of_value_candidates.set( value, hits );
							//map_of_value_candidates[ value ] = hits;

							if ( hits > best_key_value_hits )
							{
								best_key_value_hits = hits;
								best_key = p;
								best_value = value;
							}

						}
					}
				}
		    }
		    
		    //if ( best_key_value_hits > 0 )
		    if ( best_key_value_hits > 15 ) // 45
		    {

				//console.log( '['+inception+'] Win by ' + best_key_value_hits );

				//console.log( 'Compression by pair: '+best_key+':'+best_value + ' -- should save '+ best_key_value_hits + ' bytes' );

				let packed_array = [];

				let max_property_use_count = 0; // Will be used to count only the most frequent properties that appear in 100% of cases
				let other_properties_to_check = {}; // Will be used to count only the most frequent properties that appear in 100% of cases
				let other_properties_to_check_values = {}; // Will be used to count only the most frequent properties that appear in 100% of cases

				let mass_replacement_definitor_array = [ best_key, best_value ];

				for ( let i = 0; i < object_array.length; i++ )
				{
					let ent = object_array[ i ];
					if ( ent[ best_key ] === best_value )
					{
						//ent = Object.assign( {}, ent ); // Copy only when needed, using WeakMap to store originality of each object?
						//delete ent[ best_key ];

						if ( unique_objects.has( ent ) )
						{
							delete ent[ best_key ];
						}
						else
						{
							let ent2 = {};
							for ( let p in ent )
							if ( p !== best_key )
							ent2[ p ] = ent[ p ];

							ent = ent2;

							unique_objects.add( ent );
						}

						packed_array.push( ent );

						for ( let p in ent )
						if ( p !== '_net_id' )
						if ( typeof ent[ p ] !== 'object' || ent[ p ] === null )
						{
							if ( typeof other_properties_to_check_values[ p ] === 'undefined' )
							{
								other_properties_to_check_values[ p ] = ent[ p ];
							}
							else
							{
								if ( other_properties_to_check_values[ p ] !== ent[ p ] )
								other_properties_to_check[ p ] = -Infinity;
							}

							//max_property_use_count = Math.max( max_property_use_count, other_properties_to_check[ p ] = ( other_properties_to_check[ p ] || 0 ) + 1 );
							other_properties_to_check[ p ] = ( other_properties_to_check[ p ] || 0 ) + 1;

						}

						object_array.splice( i, 1 );
						i--;
						continue;
					}
				}

				if ( packed_array.length >= 2 ) // Opposite does not usually happen but just in case
				{
					for ( let p in other_properties_to_check )
					//if ( other_properties_to_check[ p ] === max_property_use_count )
					if ( other_properties_to_check[ p ] === packed_array.length )
					{



						let best_key = p;
						let best_value = other_properties_to_check_values[ p ];

						mass_replacement_definitor_array.push( best_key, best_value );

						for ( let i = 0; i < packed_array.length; i++ )
						{
							let ent = packed_array[ i ];
							if ( ent[ best_key ] === best_value )
							{
							delete ent[ best_key ];
							}
						}

					}
				}
				//else
				//debugger

				packed_array = Iteration( packed_array, inception + 100 ); // Pack more what's already packed

				packed_array.unshift( mass_replacement_definitor_array ); // Add replacement instructions at the beginning
				object_array.unshift( packed_array );

				object_array = Iteration( object_array, inception + 1 ); // Pack same array again while possible
		    }
		    else
		    {
				/*

				Attempt compression of this 

				{_net_id: 7594479, y: 240}
				{_net_id: 7594480, y: 256}
				{_net_id: 7595361, y: 272}
				{_net_id: 7595662, y: 288}

				into something like this

				[ '_net_id|y', 7594479, 240, 7594480, 256, 7595361, 272, 7595662, 288 ]

				*/
				let first_object = null;
				let first_object_index = -1;
				for ( let i = 0; i < object_array.length; i++ )
				if ( !( object_array[ i ] instanceof Array ) )
				{
					first_object = object_array[ i ];
					first_object_index = i;
					break;
				}
				if ( first_object )
				{
					let prop_count = 0;
					let met_props = {};
					let met_props_arr = [];

					let met_objects = 1;

					let met_values = [];

					for ( let p in first_object )
					{
						met_props[ p ] = true;
						met_props_arr.push( p );
						prop_count++;

						met_values.push( first_object[ p ] );
					}

					let ok = true;

					optimized_possible_loop:
					for ( let i = first_object_index + 1; i < object_array.length; i++ )
					if ( !( object_array[ i ] instanceof Array ) )
					{
						met_objects++;

						let props = 0;
						for ( let p in object_array[ i ] )
						{
							if ( typeof met_props[ p ] !== 'undefined' )
							{
							met_values.push( object_array[ i ][ p ] );
							props++;
							}
							else
							{
							ok = false;
							break optimized_possible_loop;
							}
						}
						if ( props !== prop_count )
						{
							ok = false;
							break optimized_possible_loop;
						}
					}
					if ( ok )
					if ( met_objects > 1 )
					{
					//if ( met_values.length === met_props_arr.length )
					//debugger


					for ( let i = first_object_index; i < object_array.length; i++ )
					if ( !( object_array[ i ] instanceof Array ) )
					{
						object_array.splice( i, 1 );
						i--;
						continue;
					}

					met_values.unshift( '*'+met_props_arr.join('|') );

					//debugger;

					//object_array = [ met_values ];
					object_array.push( met_values );

					//debugger;
					}
				}

				//debugger
		    }
		    
		    return object_array;
		}
		
		let original_array = object_array.slice();
		
		try
		{
			Iteration( object_array, 0 );
			
			if ( sdSnapPack.apply_lzw_for_snapshots )
			object_array = LZW.lzw_encode( JSON.stringify( object_array ) );
		}
		catch( e )
		{
			console.log( 'Problem during compression of entity list: ', original_array );
			
			//socket.SDServiceMessage( 'Server: Something has caused corrupted values in world entities. Reverting back to backup...' );
			
			sdModeration.CommandReceived( sdModeration.superuser_socket, '/reboot nosave' );
			
			//throw new Error( 'Problem was not resolved. Original error: ', e );
		}
		
		if ( track_worst_case )
		{
			let s = JSON.stringify( object_array );
			
			if ( s.length > sdSnapPack.recent_worst_case.length )
			{
				sdSnapPack.recent_worst_case_changed = true;
				sdSnapPack.recent_worst_case = s;
			}
			
			if ( s.length > sdSnapPack.all_time_worst_case.length )
			{
				sdSnapPack.all_time_worst_case_changed = true;
				sdSnapPack.all_time_worst_case = s;
			}
		}
		
		return object_array;
	}
	
	static Decompress( object_array, level=0 )
	{
		if ( sdSnapPack.apply_lzw_for_snapshots )
		if ( level === 0 )
		object_array = JSON.parse( LZW.lzw_decode( object_array ) );
		
		let definitor = null;

		for ( let i = 0; i < object_array.length; i++ )
		{
			if ( object_array[ i ] instanceof Array ) // definitor
			{
				if ( typeof object_array[ i ][ 0 ] === 'string' )
				{
					if ( object_array[ i ][ 0 ].charAt( 0 ) === '*' )
					{
						// Got compact similar object value lister
						//debugger;

						let keys = object_array[ i ][ 0 ].slice( 1 ).split( '|' );

						//if ( object_array.length > 1 )
						//debugger;

						let made_objects = [];

						let current_obj = null;
						let offset = 1;

						while ( offset < object_array[ i ].length )
						{
							current_obj = {};
							made_objects.push( current_obj );

							for ( let p = 0; p < keys.length; p++ )
							current_obj[ keys[ p ] ] = object_array[ i ][ offset++ ];
						}

						//if ( object_array.length > 1 ) // Hack
						//debugger;

						object_array.splice( i, 1, ...made_objects );
						i--;
						continue; // They can be extended by current definitor still
					}
					else
					{
						if ( object_array[ i ].length % 2 !== 0 )
						throw new Error('Expected definitor but element count is not even');

						definitor = object_array[ i ];
						object_array.splice( i, 1 );
						i--;
						continue;
						//debugger; // Remember properties to apply to other elements, then remove element
					}
				}
				else
				{
					//debugger;

					object_array.splice( i, 1, ...sdSnapPack.Decompress( object_array[ i ], level+1 ) );
					//object_array[ i ] = sdSnapPack.Decompress( object_array[ i ] );

					i--;
					continue; // They can be extended by current definitor still
				}
			}
			else
			{
				if ( definitor )
				{
					//debugger
					for ( let p = 0; p < definitor.length; p += 2 )
					{
						object_array[ i ][ definitor[ p ] ] = definitor[ p + 1 ];
					}
				}
			}

			//if ( level === 0 )
			//debugger;
		}

		//debugger;

		return object_array;

		/*for ( let i = 0; i < object_array.length; i++ )
		{
		if ( object_array[ i ] instanceof Array )
		{
			if ( object_array[ i ][ 0 ] instanceof Array ) // definitor
			{
			if ( object_array[ i ][ 0 ].length % 2 !== 0 )
			throw new Error('Expected definitor but element count is not even');


			}
		}
		debugger;
		}*/
	}
}
sdSnapPack.init_class();

export default sdSnapPack;