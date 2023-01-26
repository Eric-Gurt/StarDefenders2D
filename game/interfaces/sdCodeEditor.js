/*

	Edit code for later sdProgram start

*/

/* global sd_events, sdElement */

import sdElement from './sdElement.js';

class sdCodeEditor
{
	static init_class()
	{
		sdCodeEditor.window_instances = [];
	}
	
	static Open( params )
	{
		let instance = new sdCodeEditor( params );
		sdCodeEditor.window_instances.push( instance );
		return instance;
	}
	
	static Close( instance )
	{
		if ( !instance )
		throw new Error();
	
		instance.remove();
	}
	
	constructor( params )
	{
		this.code_container = params.code_container;
		this.code_container_net_id = params.code_container_net_id;
		
		this.window = sdElement.createElement({ 
			type: sdElement.WINDOW,
			text: 'Program editor', translate: true,
			onCloseButton: ()=>{ this.remove(); },
			draggable: true
		});
		this.window.element.style.cssText = `
			left: calc( 100% - 20px - 600px );
			top: 0px;
		
			width: 600px;
			height: 100%;
		`;
		
		this.info_block = this.window.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: '',
			height: 50
		});
		
		this.info_block.createElement({ 
			type: sdElement.TEXT, 
			text: 'Program editing for ', translate: true
		});
		this.info_block.createElement({ 
			type: sdElement.TEXT, 
			text: params.code_container.title,
		});
		
		this.last_message = this.info_block.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: '',
			color: '#ffff00',
			marginTop: 10
		});
		
		this.code_element = this.window.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: params.code
		});
		this.code_element.setEditableStatus( 
			true, 
			()=>
			{
				//alert( 'Code edited. Sync back to server? ' + this.code_element.text );

				globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.code_container.GetClass(), this.code_container_net_id, 'SET_CODE', [ this.code_element.text ] ] );
			},
			{
				code: true
			}
		);
		this.code_element.element.style.height = 'calc( 100% - 50px )';
		this.code_element.element.style.overflowX = 'auto';
		this.code_element.element.style.overflowY = 'auto';
		this.code_element.element.style.width = '100%';
		this.code_element.element.style.fontSize = '12px';
		this.code_element.element.style.outline = 'none';
		this.code_element.element.style.backgroundColor = '#000066';
		this.code_element.element.style.padding = '10px';
		this.code_element.element.style.boxSizing = 'border-box';
		this.code_element.element.style.whiteSpace = 'pre';
		this.code_element.element.style.tabSize = '4';
		
		this.code_element.element.classList.add( 'sd_scrollbar' );
		
		//this.UpdateStructure();
		this.ApplyServerCommand( params.command_name, params.parameters_array );
	}
	
	ApplyServerCommand( command_name, parameters_array )
	{
		if ( command_name === 'OPEN_CODE_EDITOR' )
		{
			//let net_id = parameters_array[ 0 ];
			let code = parameters_array[ 1 ];
			let program_message = parameters_array[ 2 ];
			
			this.code_element.text = code;
			this.last_message.text = program_message;
		}
		else
		if ( command_name === 'MESSAGE' )
		{
			let program_message = parameters_array[ 1 ];
			
			this.last_message.text = program_message;
		}
	}
	
	static HandleServerCommand( command_name, parameters_array )
	{
		//if ( command_name === 'OPEN_CODE_EDITOR' )
		{
			let net_id = parameters_array[ 0 ];
			//let code = parameters_array[ 1 ];
			//let program_message = parameters_array[ 2 ];

			for ( let i = 0; i < sdCodeEditor.window_instances.length; i++ )
			if ( sdCodeEditor.window_instances[ i ].code_container_net_id === net_id )
			{
				sdCodeEditor.window_instances[ i ].ApplyServerCommand( command_name, parameters_array );
				return;
			}
			
			if ( command_name === 'OPEN_CODE_EDITOR' )
			sdCodeEditor.Open({
				code_container: sdEntity.GetObjectByClassAndNetId( 'auto', net_id ),
				code_container_net_id: net_id,
				
				command_name: command_name,
				parameters_array: parameters_array
			});
		}
	}
	
	remove()
	{
		this.window.remove();
		
		let id = sdCodeEditor.window_instances.indexOf( this );
		if ( id !== -1 )
		sdCodeEditor.window_instances.splice( id, 1 );
	}
}

export default sdCodeEditor;