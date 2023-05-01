/*

	Edit database

*/

/* global sd_events, sdElement */

import sdElement from './sdElement.js';
import sdInterface from './sdInterface.js';

class sdMotherShipStorageManager extends sdInterface
{
	static init_class()
	{
		sdMotherShipStorageManager.only_instance = null;

		sdInterface.interface_classes[ this.name ] = this; // Register for callbacks
	}
	
	static Open( params ) // { lrtp }
	{
		if ( sdMotherShipStorageManager.only_instance )
		return;
	
		sdMotherShipStorageManager.only_instance = new sdMotherShipStorageManager( params );
	}
	
	static Close()
	{
		if ( !sdMotherShipStorageManager.only_instance )
		return;
	
		sdMotherShipStorageManager.only_instance.remove();
		sdMotherShipStorageManager.only_instance = null;
	}
	
	constructor( params )
	{
		super( params );
		
		this.lrtp = params.lrtp;
		
		this.window = sdElement.createElement({ 
			type: sdElement.WINDOW,
			text: 'Mothership storage manager', translate: true,
			onCloseButton: ()=>{ sdMotherShipStorageManager.Close(); },
			draggable: true
		});
		this.window.element.style.cssText = `
			left: calc( 50% - 200px );
			top: calc( 100% - 20px - 400px );
		
			width: 400px;
			height: 400px;
		`;
		
		this.update_timer = setInterval( ()=>
		{
			this.DecreaseTimers( 100 );
			
		}, 100 );
		
		this.old_objects = null;
	
		this.structure_element = this.window.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: ''
		});
		
		this.structure_update_cheduled = false;
		
		this.data = [];
		
		this.structure_element.element.style.height = '100%';
		this.structure_element.element.style.overflowX = 'auto';
		this.structure_element.element.style.overflowY = 'auto';
		this.structure_element.element.style.width = '100%';
		this.structure_element.element.style.fontSize = '12px';
		this.structure_element.element.classList.add( 'sd_scrollbar' );
		
		this.RequestData();
		
		this.UpdateStructure();
	}
	
	RequestData()
	{
		globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.lrtp.GetClass(), this.lrtp._net_id, 'LIST_PRIVATE_STORAGE', [] ] );
	}
	
	UpdateStructure()
	{
		this.structure_update_cheduled = true;
		setTimeout( ()=>{ 
			
			if ( this.structure_update_cheduled )
			{
				this.structure_update_cheduled = false;
				
				if ( sdMotherShipStorageManager.only_instance )
				this._UpdateStructure();
			}
		}, 1 );
	}
	
	_UpdateStructure()
	{
		//this.structure_element.removeChildren();
		
		let new_objects = this.structure_element.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: ''
		});
		
		if ( this.old_objects )
		this.old_objects.MarkAsOldRecursively();
		
		for ( let i = 0; i < this.data.length; i++ )
		{
			let obj = this.data[ i ];
			
			let line_group = new_objects.createElement({ 
				type: sdElement.ROW, 
				text: '',
				marginBottom: 20,
				
				element_reuse_key: obj._old_line_group
			});
			obj._old_line_group = line_group;
			
			
			if ( obj.available_after <= 0 )
			{
				let receive_btn = line_group.createElement({ 
					type: sdElement.BUTTON, 
					text: 'Receive',
					translate: true,
					width: 100,
					marginRight: 10,
					onClick: ()=>
					{
						globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ this.lrtp.GetClass(), this.lrtp._net_id, 'GET_PRIVATE_STORAGE', [ obj.title ] ] );
					},

					element_reuse_key: obj._old_receive_btn
				});
				obj._old_receive_btn = receive_btn;
			}
			else
			{
				let receive_btn = line_group.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: '',
					width: 100,
					marginRight: 10,

					element_reuse_key: obj._old_receive_btn_disabled
				});
				obj._old_receive_btn_disabled = receive_btn;
			}
			
			
			
			let text_block = line_group.createElement({ 
				type: sdElement.TEXT_BLOCK, 
				text: '',
				
				element_reuse_key: obj._old_text_block
			});
			obj._old_text_block = text_block;
			{
				let line = text_block.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: '',
				
					//element_reuse_key: obj.title + '_line'
				});
				{
					line.createElement({ 
						type: sdElement.TEXT, 
						text: 'Group "',
						translate: true
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: obj.title
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: '" ('
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: obj.items
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: ' items)',
						translate: true
					});
				}
				
				line = text_block.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: '',
				
					//element_reuse_key: obj.title + '_line2'
				});
				if ( obj.available_after > 0 )
				{
					line.createElement({ 
						type: sdElement.TEXT, 
						text: 'Available in ',
						translate: true,
						color: '#ffff00'
					});
					
					if ( obj.available_after < 1000 * 60 )
					{
						line.createElement({ 
							type: sdElement.TEXT, 
							text: Math.ceil( obj.available_after / 1000 ),
							color: '#ffff00'
						});
						line.createElement({ 
							type: sdElement.TEXT, 
							text: ' seconds',
							translate: true,
							color: '#ffff00'
						});
					}
					else
					{
						line.createElement({ 
							type: sdElement.TEXT, 
							text: Math.ceil( obj.available_after / 1000 / 60 ),
							color: '#ffff00'
						});
						line.createElement({ 
							type: sdElement.TEXT, 
							text: ' minutes',
							translate: true,
							color: '#ffff00'
						});
					}
				}
				else
				{
					line.createElement({ 
						type: sdElement.TEXT, 
						text: 'Available now',
						translate: true,
						color: '#00ff00'
					});
				}
			}
		}
		
		if ( this.old_objects )
		this.old_objects.remove();
		
		this.old_objects = new_objects;
		
		new_objects.RemoveOldRecursively();
	}
	
	static HandleServerCommand( command_name, parameters_array )
	{
		if ( sdMotherShipStorageManager.only_instance )
		sdMotherShipStorageManager.only_instance.HandleServerCommand( command_name, parameters_array );
	}
	HandleServerCommand( command_name, parameters_array )
	{
		if ( command_name === 'LIST_RESET' )
		{
			this.data = [];
			this.UpdateStructure();
		}
		else
		if ( command_name === 'LIST_ADD' )
		{
			this.data.push( parameters_array[ 0 ] );
			this.UpdateStructure();
		}
		else
		if ( command_name === 'LIST_UPDATE_IF_TRACKING' )
		{
			this.RequestData();
		}
	}
	
	DecreaseTimers( by_how_much )
	{
		for ( let i = 0; i < this.data.length; i++ )
		{
			this.data[ i ].available_after -= by_how_much;
		}
		
		this.UpdateStructure();
	}
	
	remove()
	{
		this.window.remove();
		clearInterval( this.update_timer );
	}
}

export default sdMotherShipStorageManager;