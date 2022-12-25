
/* global sd_events, sdElement */

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
		this.structure_element.element.style.height = '100%';
		this.structure_element.element.style.overflowY = 'auto';
		this.structure_element.element.style.width = '100%';
		this.structure_element.element.classList.add( 'sd_scrollbar' );
		
		this.known_data = 
		{
			_properties_change_pending: {},
			_prevent_new_properties: true,
		
			sdDatabase: 
			{
				_is_array: false,
				_path: [ 'sdDatabase' ],
				_synced: true,
				_pending: true, // Stays true even after _synced
				_expanded: true,
				_properties_change_pending: {},
				_auto_expand: true,
				_prevent_new_properties: true,

				data: 
				{
					_is_array: false,
					_path: [ 'sdDatabase', 'data' ],
					_synced: false,
					_pending: false,
					_expanded: false,
					_properties_change_pending: {},
					_auto_expand: true,
					_prevent_new_properties: true
				}
			}
		};
		
		this.UpdateStructure();
	}
	
	MakeDefaultObjectProperties( obj, path, manually_made )
	{
		if ( typeof obj === 'object' )
		{
			let template = 
			{
				_is_array: obj instanceof Array,
				_path: path,
				_synced: manually_made ? true : false,
				_pending: false,
				_expanded: manually_made ? true : false,
				_properties_change_pending: {}
			};

			//let keys = Object.keys( obj );
			//for ( let i = 0; i < keys.length; i++ )
			for ( let p in obj )
			this.MakeDefaultObjectProperties( obj[ p ], path+'.'+p, manually_made );
			
			for ( let p in template )
			obj[ p ] = template[ p ];
		}
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
			
			let property_access = '';
			
			for ( let i = 0; i < key.length; i++ )
			property_access += '['+JSON.stringify( key[ i ] )+']';
			
			eval( 'sdDatabaseEditor.only_instance.known_data' + property_access + ' = Object.assign( sdDatabaseEditor.only_instance.known_data' + property_access + ', value );' );
			
			sdDatabaseEditor.only_instance.UpdateStructure();
		}
	}
	
	UpdateStructure()
	{
		this.structure_element.removeChildren();
		
		const ShowObject = ( obj, name, indent, parent_obj )=>
		{
			let change_sync_pending = parent_obj._properties_change_pending[ name ] || 0;

			let line = this.structure_element.createElement({ 
				type: sdElement.TEXT_BLOCK, 
				text: '',
				marginLeft: indent
			});

			let key = line.createElement({ 
				type: sdElement.TEXT, 
				text: name,
				onClick: ()=>
				{
				}
			});
				
			if ( change_sync_pending === 1 )
			key.element.classList.add( 'pending_blinking' );
			
			if ( !parent_obj._prevent_new_properties )
			if ( change_sync_pending === 0 || change_sync_pending === 1 )
			key.setEditableStatus( true, ()=>{
				parent_obj._properties_change_pending[ name ] = 1;

				if ( parent_obj[ name ] )
				if ( key.text !== name )
				{
					let v = parent_obj[ name ];

					parent_obj[ key.text ] = v;

					delete parent_obj[ name ];

					this.UpdateStructure();
									
					debugger; // Sync is not implemented
				}
			});

			line.createElement({ 
				type: sdElement.TEXT, 
				text: ': ',
				color: '#aaaaaa'
			});
				
			if ( obj === null || 
				 obj === undefined || 
				 typeof obj === 'number' || 
				 typeof obj === 'string' || 
				 typeof obj === 'boolean' )
			{	
				let value = line.createElement({ 
					type: sdElement.TEXT, 
					text: JSON.stringify( obj ),
					color: ( obj ? '#aaffaa' : '#ff8383' ),
					onClick: ()=>
					{
					}
				});
				
				if ( change_sync_pending === 2 )
				value.element.classList.add( 'pending_blinking' );
				
				if ( change_sync_pending === 0 || change_sync_pending === 2 )
				value.setEditableStatus( 
						
					true, 
			
					()=>
					{
						let v;

						try
						{
							v = JSON.parse( value.text );

							//this.MakeDefaultObjectProperties( v, parent_obj._path+'.'+name, true );
							this.MakeDefaultObjectProperties( v, parent_obj._path.concat( name ), true );
						}
						catch ( e )
						{
							alert( 'Value must be proper JSON value. Value won\'t be saved' );
							return;
						}

						parent_obj._properties_change_pending[ name ] = 2;

						parent_obj[ name ] = v;

						this.UpdateStructure();
									
						debugger; // Sync is not implemented
					}, 
					
					{
						spellcheck: true
					}
				);
			}
			else
			{
				/*this.structure_element.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: name + ':',
					marginLeft: indent
				});
*/
				let brackets = obj._is_array ? [ '[', ']' ] : [ '{', '}' ];
					
				if ( obj._expanded )
				{
					this.structure_element.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						text: brackets[ 0 ],
						onClick: ()=>{
							
							if ( obj._auto_expand )
							obj._auto_expand = false;
							
							obj._expanded = false;
							this.UpdateStructure();
						},
						marginLeft: indent
					});

					let any_property_listed = false;
					
					for ( let p in obj )
					if ( p.charAt( 0 ) !== '_' )
					{
						any_property_listed = true;
						
						ShowObject( obj[ p ], p, indent + 20, obj );
					}

					if ( !obj._prevent_new_properties )
					{
						let add_prop_text = '+ Add property';
						let add_prop_color = '#4c984c';
						let add_prop = this.structure_element.createElement({ 
							type: sdElement.TEXT_BLOCK, 
							text: add_prop_text,
							color: add_prop_color,
							onClick: ()=>{
								add_prop.text = '';
								add_prop.color = '#ffffff';
							},
							marginLeft: indent + 20,
							marginTop: any_property_listed ? 10 : 0
						});
						let once = true;
						add_prop.setEditableStatus( true, ()=>{

							if ( add_prop.text !== '' && add_prop.text !== add_prop_text && once )
							{
								once = false;
								
								obj._properties_change_pending[ add_prop.text ] = 1;

								let v = null;

								obj[ add_prop.text ] = v;

								this.UpdateStructure();
									
								debugger; // Sync is not implemented
							}
							else
							{
								add_prop.text = add_prop_text;
								add_prop.color = add_prop_color;
							}
						});
						
						if ( !parent_obj._prevent_new_properties )
						this.structure_element.createElement({ 
							type: sdElement.TEXT_BLOCK, 
							text: 'x Delete whole ' + ( ( obj instanceof Array ) ? 'array' : 'object' ),
							color: '#ff8383',
							onClick: ()=>{
								if ( confirm( 'Are you sure? This operation can not be undone.' ) )
								{
									delete parent_obj[ name ];
									this.UpdateStructure();
									
									debugger; // Sync is not implemented
								}
							},
							marginLeft: indent + 20,
							marginTop: 10
						});
					}

					this.structure_element.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						text: brackets[ 1 ],
						onClick: ()=>{
							
							if ( obj._auto_expand )
							obj._auto_expand = false;
						
							obj._expanded = false;
							this.UpdateStructure();
						},
						marginLeft: indent
					});
				}
				else
				{
					let Expand = ()=>{
						if ( !obj._expanded )
						{
							obj._expanded = true;
							this.UpdateStructure();

							if ( !obj._synced )
							sd_events.push([ 'DB_SCAN', obj._path ]);
						}
					};
					
					this.structure_element.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						text: brackets[ 0 ] + ' ... ' + brackets[ 1 ],
						onClick: Expand,
						marginLeft: indent
					});
					
					if ( obj._auto_expand )
					Expand();
				}
			}
		};
	
		ShowObject( this.known_data.sdDatabase, 'sdDatabase', 0, this.known_data );
	}
	
	remove()
	{
		this.overlay.remove();
	}
}

export default sdDatabaseEditor;