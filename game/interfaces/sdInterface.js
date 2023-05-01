


/* global Promise */

class sdInterface
{
	static init_class()
	{
		sdInterface.interface_classes = {};
		
		sdInterface.callbacks = new Map();
		sdInterface.callback_id_counter = 0;
		
		sdInterface.interface_classes[ this.name ] = this; // Register for callbacks
	}
	constructor( params )
	{
	}
	CallServerCommand( command, arr=[], callback=null )
	{
		let _class = this.constructor.name; // For example becomes sdAdminPanel
		
		let callback_id = callback ? sdInterface.callback_id_counter++ : -1;
		
		if ( callback )
		sdInterface.callbacks.set( callback_id, callback );
		
		globalThis.sd_events.push( [ 'UI', _class, command, callback_id, arr ] );
	}
	
	static async HandleCommandOnServer( _class, command, callback_id, arr, socket )
	{
		if ( sdInterface.interface_classes[ _class ] )
		if ( sdInterface.interface_classes[ _class ].HandleServerCommand )
		{
			let ret = sdInterface.interface_classes[ _class ].HandleServerCommand( command, arr, socket );
			
			if ( ret instanceof Promise )
			ret = await ret;
			
			if ( ret !== undefined )
			{
				if ( socket.character && !socket.character._is_being_removed )
				socket.sd_events.push( [ 'UI_REPLY', [ callback_id, ret ] ] ); // In-game case
				else
				socket.emit( 'UI_REPLY', [ callback_id, ret ] ); // Character cusomization screen
			}
		}
	}
	
	static UI_REPLY_Handle( callback_id, ret )
	{
		let callback = sdInterface.callbacks.get( callback_id );
		
		if ( callback )
		{
			sdInterface.callbacks.delete( callback_id );
			
			callback( ret );
		}
	}
	
	/*static ReplyToClient( command, arr, socket )
	{
		let _class = '?';
		
		debugger;
	}*/
}
export default sdInterface;