

class sdScript
{
	static init_class()
	{
		
	}
	
	constructor( params )
	{
		this.owner = params.owner; // likely sdCharacter
		
		this.hear_listeners = [];
	}
	
	Any( arr )
	{
		return arr[ ~~( arr.length * Math.random ) ];
	}
	
	RegisterListener( f ) // Listener receives: ( incoming_message, from_entity, listener_function ) on call
	{
		this.hear_listeners.push( f );
	}
	
	RemoveListener( f )
	{
		for ( let i = this.hear_listeners.length - 1; i >= 0; i-- )
		{
			if ( f === this.hear_listeners[ i ] )
			{
				this.hear_listeners.splice( i, 1 );
			}
		}
	}
	
	RemoveAllListeners()
	{
		this.hear_listeners.length = 0;
	}
	
	HearsMessage( incoming_message, from_entity )
	{
		//for ( let i = 0; i < this.hear_listeners.length; i++ )
		for ( let i = this.hear_listeners.length - 1; i >= 0; i-- )
		{
			if ( this.hear_listeners[ i ]( incoming_message, from_entity, this.hear_listeners[ i ] ) )
			return;
		}
	}
	
	ExecuteBestOption( message, options ) // message:String, array of { expect:String|Array<String>, then:Function( message ) }
	{
		message = message.toLowerCase();
		
		const levenshteinDistance = (str1 = '', str2 = '') => {
			const track = Array(str2.length + 1).fill(null).map(() =>
			Array(str1.length + 1).fill(null));
			for (let i = 0; i <= str1.length; i += 1) {
			   track[0][i] = i;
			}
			for (let j = 0; j <= str2.length; j += 1) {
			   track[j][0] = j;
			}
			for (let j = 1; j <= str2.length; j += 1) {
			   for (let i = 1; i <= str1.length; i += 1) {
				  const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
				  track[j][i] = Math.min(
					 track[j][i - 1] + 1, // deletion
					 track[j - 1][i] + 1, // insertion
					 track[j - 1][i - 1] + indicator, // substitution
				  );
			   }
			}
			return track[str2.length][str1.length];
		};


		let best_di = Infinity;
		let best_i = 0;
		
		for ( let i = 0; i < options.length; i++ )
		{
			let di;
			
			if ( typeof options.expect === 'string' )
			di = levenshteinDistance( message, options.expect.toLowerCase() );
			else
			{
				di = Infinity;
				for ( let i2 = 0; i2 < options.expect.length; i2++ )
				{
					di = Math.min( di, levenshteinDistance( message, options.expect[ i2 ].toLowerCase() ) );
				}
			}
			
			if ( di < best_di )
			{
				best_i = i;
				best_di = di;
			}
		}
		
		trace( 'Heard something, distance to best phrase: ' + best_di );
		
		options[ best_i ].then( message );
	}
	
	Say( message )
	{
		this.owner.Say( message, false, false, true, false );
	}
}

export default sdScript;