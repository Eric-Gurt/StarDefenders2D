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
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	static InsertExistingTimer( timer )
	{
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
				let from = 0;
				let to = sdTimer.sorted_timeouts.length - 1;
				
				// 0...6, insert_at = ( 0 + 6 - 1 ) / 2 = 5 / 2 = 2.5 ~~ == 2
				
				do
				{
					insert_at = ~~( ( from + to ) / 2 );
					
					if ( expire_on === sdTimer.sorted_timeouts[ insert_at ].expire_on )
					{
						break;
					}
					else
					if ( expire_on < sdTimer.sorted_timeouts[ insert_at ].expire_on )
					{
						to = insert_at;
					}
					else
					{
						from = insert_at + 1;
					}
					
				} while( to !== from );
				
				insert_at = to;
			}
		}
		
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
		while ( sdTimer.sorted_timeouts.length > 0 )
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