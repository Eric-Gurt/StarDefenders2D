
/* global sd_events */

import sdElement from './sdElement.js';

class sdDatabaseEditor
{
	static init_class()
	{
		sdDatabaseEditor.only_instance = null;
		
		//sdDatabaseEditor.Open(); // Test
	}
	
	static Open()
	{
		if ( sdDatabaseEditor.only_instance )
		return;
	
		sdDatabaseEditor.only_instance = new sdDatabaseEditor();
	}
	
	static Close()
	{
		if ( !sdDatabaseEditor.only_instance )
		return;
	
		sdDatabaseEditor.only_instance.remove();
		sdDatabaseEditor.only_instance = null;
	}
	
	constructor()
	{
		this.overlay = sdElement.createElement({ 
			type: sdElement.OVERLAY,
			onClick: ()=>{ this.remove(); } 
		});
		
		this.window = this.overlay.createElement({ 
			type: sdElement.WINDOW,
			text: 'Database Editor',
			onCloseButton: ()=>{ this.remove(); } 
		});
		
		/*
		this.object_scout = this.window.createElement({ 
			type: sdElement.TEXT, 
			text: 'sdDatabase.data',
			onClick: ()=>{ 
				
			} 
		});*/
		
		this.structure_element = this.window.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: ''
		});
		
		this.known_data = 
		{
			sdDatabase: 
			{
				//_element: null,
				_path: 'sdDatabase',
				_synced: true,
				_pending: true, // Stays true even after _synced
				_expanded: true,

				data: 
				{
					//_element: null,
					_path: 'sdDatabase.data',
					_synced: false,
					_pending: false,
					_expanded: false
				}
			}
		};
		
		this.UpdateStructure();
	}
	
	static OnScanResult( key, value )
	{
		if ( sdDatabaseEditor.only_instance )
		{
			//let ptr = sdDatabaseEditor.only_instance.known_data;
			
			//let parts = key.split( '.' );
			
			//debugger;
			
			//for ( let i = 0; i < parts.length; i++ )
			//ptr = ptr[ parts[ i ] ];
			
			eval( 'sdDatabaseEditor.only_instance.known_data.' + key + ' = Object.assign( sdDatabaseEditor.only_instance.known_data.' + key + ', value );' );
			
			sdDatabaseEditor.only_instance.UpdateStructure();
		}
	}
	
	UpdateStructure()
	{
		this.structure_element.removeChildren();
		
		const ShowObject = ( obj, name, indent )=>
		{
			if ( obj === null || typeof obj === 'number' || typeof obj === 'string' )
			{
				this.structure_element.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: name + ': ' + JSON.stringify( obj ),
					marginLeft: indent
				});
			}
			else
			{
				this.structure_element.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: name + ':',
					marginLeft: indent
				});

				if ( obj._expanded )
				{
					this.structure_element.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						text: '{',
						onClick: ()=>{
							obj._expanded = false;
							this.UpdateStructure();
						},
						marginLeft: indent
					});

					for ( let p in obj )
					if ( p.charAt( 0 ) !== '_' )
					{
						ShowObject( obj[ p ], p, indent + 20 );
					}

					this.structure_element.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						text: '}',
						onClick: ()=>{
							obj._expanded = false;
							this.UpdateStructure();
						},
						marginLeft: indent
					});
				}
				else
				{
					this.structure_element.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						text: '{ ... }',
						onClick: ()=>{
							obj._expanded = true;
							this.UpdateStructure();

							if ( !obj._synced )
							sd_events.push([ 'DB_SCAN', obj._path ]);
						},
						marginLeft: indent
					});
				}
			}
		};
	
		ShowObject( this.known_data.sdDatabase, 'sdDatabase', 0 );
	}
	
	remove()
	{
		this.overlay.remove();
	}
}

export default sdDatabaseEditor;