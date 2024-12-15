
/* global sdMobileKeyboard, sdChatInterface */

//import sdChatInterface from '../interfaces/sdChatInterface.js';
import sdRenderer from './sdRenderer.js';

class sdChat
{
	static init_class()
	{
		sdChat.open = false;
		sdChat.text = '';
		
		sdChat.blink_offset = 0;
		
		sdChat.STYLE_CHATBOX = 0;
		sdChat.STYLE_PROMPT = 1;
		
		sdChat.style = sdChat.STYLE_CHATBOX;
		
		sdChat.max_characters = 100;
		sdChat.censorship_ping_until = 0;
		
		sdChat.hint = '';
		
		sdChat.extra_mobile_buttons = [];
		
		sdChat.custom_destination_callback = null; // For prompt cases, like password-based locks or something similar
	}
	static StartPrompt( hint='Enter string', default_text='', callback=null, max_characters=100 )
	{
		sdChat.open = true;
		sdChat.text = default_text+'';
		sdChat.style = sdChat.STYLE_PROMPT;
		sdChat.hint = hint;
		sdChat.max_characters = max_characters;
		
		sdChat.last_message = '';
		
		sdChat.custom_destination_callback = callback;

		//sdChatInterface.Open();
		
		sdChat.ShowMobileHints();
	}
	static ShowMobileHints()
	{
		if ( sdMobileKeyboard.open )
		{
			const KEY_SIZE = sdMobileKeyboard.KEY_SIZE;
			const KEY_SPACE = sdMobileKeyboard.KEY_SPACE;

			const KEY_SIZE_MICE = sdMobileKeyboard.KEY_SIZE_MICE;
			const KEY_SPACE_MICE = sdMobileKeyboard.KEY_SPACE_MICE;

			let options = [ 'Hi', 'Ok', 'No', 'I\'m sorry', 'Help!', 'Thank you', 'Follow me', '/kill', 'Mobile gaming', 'I need build tool', ':D', 'Let me in', 'I need items for tasks', 'Let\'s do task', 'Nevermind', 'Stop, it is dangerous', 'Well...', 'Good bye' ];

			for ( let i = 0; i < options.length; i++ )
			{
				let line = options[ i ];

				let yy = i % 6;
				let xx = Math.floor( i / 6 );

				sdChat.extra_mobile_buttons.push( sdMobileKeyboard.MakeButton({

					key:'?',//'Digit'+(i%10), 
					caption: line,// + ' ('+xx+', '+yy+')',
					x: 1 + ( KEY_SIZE * 3.5 + KEY_SPACE ) * xx, 
					y: -1 - ( KEY_SIZE + KEY_SPACE ) * 3 - KEY_SIZE*0.5 - KEY_SPACE - ( KEY_SIZE*0.5 + KEY_SPACE ) * yy, 
					w:KEY_SIZE*3.5, 
					h:KEY_SIZE*0.5,
					bold: true,
					dimmed_background: true,
					onPress:()=>
					{
						sdChat.text = line;

						sdChat.KeyDown({ key: 'Enter' });
					}
				}) );
			}
		}
	}
	static HideMobileHints()
	{
		for ( let i = 0; i < sdChat.extra_mobile_buttons.length; i++ )
		sdChat.extra_mobile_buttons[ i ].sdRemove();

		sdChat.extra_mobile_buttons.length = 0;
	}
			
	static async KeyDown( e )
	{
		let do_not_allow_other_keys = false;
		
		if ( e.key === 'Escape' && sdChat.open )
		{
			sdChat.open = false;
			sdChat.HideMobileHints();
			
			do_not_allow_other_keys = true;
			//sdChatInterface.Close();
		}
		else
		if ( e.key === 'Enter' )
		{
			do_not_allow_other_keys = true;
				
			if ( sdChat.open )
			{
				if ( sdChat.custom_destination_callback )
				{
					//sdChat.text = sdChatInterface.only_instance.chat.element_inner_container.value;
					sdChat.custom_destination_callback( sdChat.text );
					sdChat.custom_destination_callback = null;
					
					sdChat.text = '';
				}
				else
				{
					//if ( sdChatInterface.only_instance.chat.element_inner_container.value.length > 0 )
					if ( sdChat.text.length > 0 )
					{
						//sdChat.text = sdChatInterface.only_instance.chat.element_inner_container.value;
						globalThis.socket.emit( 'CHAT', sdChat.text );
						sdChat.last_message = sdChat.text;
					}
				}
				sdChat.open = false;
				//sdChatInterface.Close();
				sdChat.HideMobileHints();
			}
			else
			{
				sdChat.style = sdChat.STYLE_CHATBOX;
				sdChat.open = true;
				sdChat.text = '';
				sdChat.max_characters = 100;
				sdChat.custom_destination_callback = null;
				
				//sdChatInterface.Open();
				sdChat.ShowMobileHints();
			}
		}
		else
		if ( e.key === 'Backspace' && sdChat.open )
		{
			sdChat.text = sdChat.text.slice( 0, sdChat.text.length - 1 );
		}
		else
		if ( e.code === 'KeyV' && e.ctrlKey && sdChat.open )
		{
			//console.log( e.key );

			let insert = await navigator.clipboard.readText();
			
			if ( sdChat.text.length + insert.length < sdChat.max_characters )
			{
				sdChat.text += insert;
			}
		}
		else
		if ( ( e.code === 'KeyX' || e.code === 'KeyC' ) && e.ctrlKey && sdChat.open )
		{
			if ( sdChat.text.length > 0 )
			navigator.clipboard.writeText( sdChat.text );

			if ( e.code === 'KeyX' )
			sdChat.text = '';
		}
		
		sdChat.blink_offset = sdWorld.time;
		
		return sdChat.open || do_not_allow_other_keys;
	}
	static async KeyPress( e )
	{
		if ( !sdChat.open )
		return false;
	
		if ( e.key.length === 1 )
		{
			let insert = ( e.key.length === 1 ) ? e.key : '';

			if ( sdChat.text.length + insert.length < sdChat.max_characters )
			sdChat.text += insert;
		}
	}
	static KeyUp( e )
	{
		if ( !sdChat.open )
		return false;
	}
	static Draw( ctx )
	{
		if ( sdChat.style === sdChat.STYLE_CHATBOX )
		{
			ctx.fillStyle = '#000000';
			ctx.globalAlpha = 0.5;
			ctx.fillRect( 10, sdRenderer.screen_height - 40, sdRenderer.screen_width - 20, 30 );
			ctx.globalAlpha = 1;

			if ( sdWorld.time < sdChat.censorship_ping_until )
			ctx.fillStyle = '#ff0000';
			else
			ctx.fillStyle = '#ffffff';
		
			ctx.font = "12px Verdana";

			ctx.textAlign = 'left';
			ctx.fillText( 'Say:', 20, sdRenderer.screen_height - 21 );
			
			let text = sdChat.text;

			if ( sdChat.text.length > 0 && sdChat.text.charAt( 0 ) === '/' )
			{
				ctx.font = "16px Courier";
				ctx.fillStyle = '#00ffaa';
			}
			
			if ( sdChat.text.indexOf( '/password ' ) === 0 )
			{
				text = '/password ';
				for ( let i = '/password '.length; i < sdChat.text.length; i++ )
				text += '*';
			}
			
			ctx.fillText( text + ( ( sdWorld.time - sdChat.blink_offset ) % 1000 < 500 ? '_' : '' ), 20 + 35, sdRenderer.screen_height - 21 );
		}
		else
		{
			ctx.fillStyle = '#0088ff';
			ctx.globalAlpha = 0.8;
			ctx.fillRect( sdRenderer.screen_width / 2 - 220, sdRenderer.screen_height / 2 - 40 - 40, 440, 50 + 40 );
			ctx.globalAlpha = 1;
			
			ctx.fillStyle = '#ffffff';
			ctx.globalAlpha = 0.8;
			ctx.fillRect( sdRenderer.screen_width / 2 - 200, sdRenderer.screen_height / 2 - 40, 400, 30 );
			ctx.globalAlpha = 1;

			ctx.fillStyle = '#ffffff';
			ctx.font = "12px Verdana";

			ctx.textAlign = 'left';
			ctx.fillText( sdChat.hint + ':', sdRenderer.screen_width / 2 - 200, sdRenderer.screen_height / 2 - 50 );

			ctx.fillStyle = '#000000';
			ctx.fillText( sdChat.text + ( ( sdWorld.time - sdChat.blink_offset ) % 1000 < 500 ? '_' : '' ), sdRenderer.screen_width / 2 - 190, sdRenderer.screen_height / 2 - 20 );
		}
	}
}

export default sdChat;