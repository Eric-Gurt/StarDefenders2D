
import sdRenderer from './sdRenderer.js';

class sdChat
{
	static init_class()
	{
		sdChat.open = false;
		sdChat.text = '';
		
		sdChat.blink_offset = 0;
	}
	static KeyDown( e )
	{
		if ( e.key === 'Enter' )
		{
			if ( sdChat.open )
			{
				if ( sdChat.text.length > 0 )
				globalThis.socket.emit( 'CHAT', sdChat.text );
				sdChat.open = false;
			}
			else
			{
				sdChat.open = true;
				sdChat.text = '';
			}
		}
		if ( e.key === 'Backspace' )
		{
			sdChat.text = sdChat.text.slice( 0, sdChat.text.length - 1 );
		}
		
		sdChat.blink_offset = sdWorld.time;
		
		return sdChat.open;
	}
	static KeyPress( e )
	{
		if ( sdChat.open )
		{
			if ( e.key.length === 1 )
			{
				if ( sdChat.text.length < 100 )
				sdChat.text += e.key;
			}
		}
	}
	static KeyUp( e )
	{
	}
	static Draw( ctx )
	{
		ctx.fillStyle = 'rgba(0,0,0)';
		ctx.globalAlpha = 0.5;
		ctx.fillRect( 10, sdRenderer.screen_height - 40, sdRenderer.screen_width - 20, 30 );
		ctx.globalAlpha = 1;

		ctx.fillStyle = '#ffffff';
		ctx.font = "12px Verdana";
		
		ctx.textAlign = 'left';
		ctx.fillText( 'Say:', 20, sdRenderer.screen_height - 21 );
		
		
		
		if ( sdChat.text.length > 0 && sdChat.text.charAt( 0 ) === '/' )
		{
		    ctx.font = "16px Courier";
		    ctx.fillStyle = '#00ffaa';
	    }
		
		ctx.fillText( sdChat.text + ( ( sdWorld.time - sdChat.blink_offset ) % 1000 < 500 ? '_' : '' ), 20 + 35, sdRenderer.screen_height - 21 );
	}
}

export default sdChat;