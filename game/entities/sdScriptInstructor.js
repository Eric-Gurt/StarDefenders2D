
import sdWorld from '../sdWorld.js';
import sdScript from '../entities/sdScript.js';

class sdScriptInstructor extends sdScript
{
	static init_class()
	{
		
	}
	
	constructor( params )
	{
		this.super( params );
		
		this.RegisterListener( ( incoming_message, from_entity, this_method )=>
		{
			incoming_message = incoming_message.toLowerCase();
			
			if ( from_entity.IsPlayerClass() )
			if ( incoming_message.indexOf( 'instructor' ) !== -1 || sdWorld.inDist2D_Boolean( from_entity.x, from_entity.y, this.owner.x, this.owner.y, 150 ) )
			{
				incoming_message = incoming_message.split( 'instructor' ).join( '' );
				
				this.ExecuteBestOption( incoming_message,
					[
						{ 
							expect: [ 'hi', 'hello', 'welcome', 'greetings', 'good morning' ], then: ()=> 
							{
								this.Say( this.Any( [ 
									'Hi. How are you?',
									'Good day',
									'Welcome',
									'Nice to see you',
									'Hi',
									'Hello',
									'Greetings'
								] ) );
							}
						},
						{
							expect: [ 'you are dumb', 'instructor bad' ], then: ()=> 
							{
								this.Say( this.Any( [ 
									':('
								] ) );
							}
						}

					] 
				);
		
				return true; // Stop other (earlier) listeners
			}
		} );
	}
}
export default sdScriptInstructor;