/*

	setTimeout-like timer, but more freedom and possibility to re-use callback. Timer instances are never saved. Can be used to trigger rare logic function calls for something like sdBloodDecal

	sdTimer.ExecuteWithDelay( ( timer )=>{
	
		...
		timer.ScheduleAgain( 1000 );
	
	}, 1000 );

*/
import sdWorld from '../sdWorld.js';

class sdTimer
{
	static init_class()
	{
		sdTimer.sorted_timeouts = [];
		
		sdTimer.force_timer_insertion_delay_array_persistent = [];
		sdTimer.force_timer_insertion_delay_array = null;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	static InsertExistingTimer( timer )
	{
		if ( sdTimer.force_timer_insertion_delay_array )
		{
			sdTimer.force_timer_insertion_delay_array.push( timer );
			return;
		}
		let expire_on = timer.expire_on;
		
		let insert_at = 0;
		
		/*for ( let i = 0; i < sdTimer.sorted_timeouts.length; i++ )
		{
			// 2 4 7 9 10
			// inserting 3
			// 3 < 2 = false
			// 3 < 4 = true, inserting at [1]
			if ( expire_on < sdTimer.sorted_timeouts[ i ].expire_on )
			break;
			
			insert_at++;
		}*/
		
		if ( sdTimer.sorted_timeouts.length === 0 )
		{
			insert_at = 0;
		}
		else
		{
			if ( expire_on <= sdTimer.sorted_timeouts[ 0 ].expire_on )
			insert_at = 0;
			else
			if ( expire_on >= sdTimer.sorted_timeouts[ sdTimer.sorted_timeouts.length - 1 ].expire_on )
			insert_at = sdTimer.sorted_timeouts.length;
			else
			{
				let speed = 0.5;
				
				let step = sdTimer.sorted_timeouts.length + 1;
				
				insert_at = ~~( step * speed );
				
				while ( true )
				{
					step = Math.max( 1, ~~( step * 0.5 ) );

					if ( expire_on <= sdTimer.sorted_timeouts[ insert_at     ].expire_on &&
						 expire_on >= sdTimer.sorted_timeouts[ insert_at - 1 ].expire_on )
					{
						break;
					}
					else
					{
						if ( expire_on > sdTimer.sorted_timeouts[ insert_at     ].expire_on )
						{
							insert_at += step;
							
							if ( insert_at >= sdTimer.sorted_timeouts.length - 1 )
							insert_at = sdTimer.sorted_timeouts.length - 1;
						}
						else
						if ( expire_on < sdTimer.sorted_timeouts[ insert_at - 1 ].expire_on )
						{
							insert_at -= step;
							
							if ( insert_at <= 1 )
							insert_at = 1;
						}
						else
						throw new Error( 'Delay was scheduled with non-numeric value. Action is cancelled.' );
					}
				}
			}
		}
		
		//if ( sdTimer.sorted_timeouts.length > 1 )
		//trace( 'inserting ' + 'RELATIVE' + ' at ' + Math.round(insert_at/sdTimer.sorted_timeouts.length*100) + '% on array ' + (sdTimer.sorted_timeouts[ 0 ].expire_on-timer.expire_on) + ' ... ' + (sdTimer.sorted_timeouts[ sdTimer.sorted_timeouts.length - 1 ].expire_on-timer.expire_on) );
		
		/*if ( sdTimer.sorted_timeouts.length > 0 )
		{
			if ( insert_at - 1 >= 0 )
			if ( sdTimer.sorted_timeouts[ insert_at - 1 ].expire_on > expire_on )
			throw new Error();

			if ( insert_at < sdTimer.sorted_timeouts.length )
			if ( sdTimer.sorted_timeouts[ insert_at ].expire_on < expire_on )
			throw new Error();
		}*/
		
		sdTimer.sorted_timeouts.splice( insert_at, 0, timer );
	}
	
	static ExecuteWithDelay( f, delay )
	{
		let expire_on = sdWorld.time + delay;
		
		let t = new sdTimer( f, expire_on );
		
		sdTimer.InsertExistingTimer( t );
		
		return t;
	}
	
	static ThinkNow()
	{
		/*while ( sdTimer.sorted_timeouts.length > 0 )
		{
			let timer = sdTimer.sorted_timeouts[ 0 ];
			
			if ( sdWorld.time >= timer.expire_on )
			{
				sdTimer.sorted_timeouts.shift();
				
				if ( timer.function )
				timer.function( timer );
			}
			else
			{
				break;
			}
		}*/
		
		let i = 0;
		let del = 0;
		
		let last_expire_on = 0;
		
		sdTimer.force_timer_insertion_delay_array = sdTimer.force_timer_insertion_delay_array_persistent;
		
		while ( i < sdTimer.sorted_timeouts.length )
		{
			let timer = sdTimer.sorted_timeouts[ i++ ];
			
			if ( timer.expire_on < last_expire_on )
			debugger;
		
			last_expire_on = timer.expire_on;
			
			if ( sdWorld.time >= timer.expire_on )
			{
				//sdTimer.sorted_timeouts.shift();
				del++;
				
				if ( timer.function )
				timer.function( timer );
			}
			else
			break;
		}
		
		if ( del > 0 )
		sdTimer.sorted_timeouts.splice( 0, del );
		
		sdTimer.force_timer_insertion_delay_array = null;
		if ( sdTimer.force_timer_insertion_delay_array_persistent.length > 0 )
		{
			for ( let i = 0; i < sdTimer.force_timer_insertion_delay_array_persistent.length; i++ )
			sdTimer.InsertExistingTimer( sdTimer.force_timer_insertion_delay_array_persistent[ i ] );
		
			sdTimer.force_timer_insertion_delay_array_persistent.length = 0;
		}
	}
	
	constructor( f, expire_on )
	{
		this.function = f;
		this.expire_on = expire_on;
	}
	ScheduleAgain( delay )
	{
		this.expire_on = sdWorld.time + delay;
		
		sdTimer.InsertExistingTimer( this );
		
		return this;
	}
	Cancel()
	{
		this.function = null;
	}
}

export default sdTimer;