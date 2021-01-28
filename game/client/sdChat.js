
import sdRenderer from './sdRenderer.js';

class sdChat
{
	static init_class()
	{
		sdChat.open = false;
		sdChat.text = '';
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
		ctx.fillStyle = 'rgba(0,0,0,0.5)';
		ctx.fillRect( 10, sdRenderer.screen_height - 40, sdRenderer.screen_width - 20, 30 );

		ctx.fillStyle = '#ffffff';
		ctx.font = "12px Verdana";
		ctx.textAlign = 'left';
		ctx.fillText( 'Say: ' + sdChat.text, 20, sdRenderer.screen_height - 21 );
	}
}

export default sdChat;