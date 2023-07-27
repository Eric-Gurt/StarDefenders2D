/* global sdChat, sdElement */

/*
	This can be activated through dev tools for now

	TODO list:
		Let Eric design? Release sdChatInterface?
*/

import sdElement from './sdElement.js';
import sdInterface from './sdInterface.js';
import sdChat from '../client/sdChat.js';

class sdChatInterface extends sdInterface
{
	static init_class()
	{
		sdChatInterface.only_instance = null;

		sdInterface.interface_classes[ this.name ] = this; // Register for callbacks
	}

	static Open()
	{
		if ( sdChatInterface.only_instance )
		return;

		sdChatInterface.only_instance = new sdChatInterface();
	}

	static Close()
	{
		if ( !sdChatInterface.only_instance )
		return;

		sdChatInterface.only_instance.remove();
		sdChatInterface.only_instance = null;
	}

	constructor( params )
	{
		super( params );

		this.style = sdChat.style;

		if ( this.style === sdChat.STYLE_CHATBOX )
		{
			this.chat = sdElement.createElement({
				type: sdElement.INPUT_TEXT,
				placeholder: "Say:", translate: true // Can it be possible that it can be translated in other languages?
			});
			
			this.chat.element_inner_container.focus();
		}

		if ( this.style === sdChat.STYLE_PROMPT )
		{
			this.outer_chat = sdElement.createElement({
				type: sdElement.WINDOW,
				text: sdChat.hint, translate: false,
				draggable: true
			});

			this.outer_chat.element.style.cssText = `
				width:394px;
				height:120px;
				background-color: #0088ff80;
			`;

			this.outer_chat.element_caption.style.cssText = `
				background-color: transparent;
				padding: 4px;
				margin-bottom: 24px;
			`;

			this.chat = sdElement.createElement({
				type: sdElement.INPUT_TEXT,
				placeholder: sdChat.hint, translate: false
			});

			this.chat.element.style.cssText = `
				background-color: #ffffff80;
				position: static;
			`;

			this.chat.element_inner_container.style.color = "black";
			this.chat.element_inner_container.value = sdChat.text;

			this.outer_chat.element_inner_container.append( this.chat.element );
		}
	}

	remove()
	{
		if ( !sdChat.open )
		{
			if ( typeof this.outer_chat !== "undefined" ) // Remove it too if it's still here
			this.outer_chat.remove();
			
			this.chat.remove();
		}
	}
}

export default sdChatInterface;