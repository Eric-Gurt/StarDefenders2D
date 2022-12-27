/*

	Edit database

*/

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
		/*this.overlay = sdElement.createElement({ 
			type: sdElement.OVERLAY,
			onClick: ()=>{ sdDatabaseEditor.Close(); } 
		});
		
		this.window = this.overlay.createElement({ */
		this.window = sdElement.createElement({ 
			type: sdElement.WINDOW,
			text: 'Database Editor', translate: true,
			onCloseButton: ()=>{ sdDatabaseEditor.Close(); },
			draggable: true
		});
		this.window.element.style.cssText = `
			width: 800px;
			left: 20px;
			top: 20px;
			height: calc( 100% - 40px );
		`;
	
		this.structure_element = this.window.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: ''
		});
		this.structure_element.element.style.height = '100%';
		this.structure_element.element.style.overflowX = 'auto';
		this.structure_element.element.style.overflowY = 'auto';
		this.structure_element.element.style.width = '100%';
		this.structure_element.element.style.fontSize = '12px';
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
				_partial: false,
				_rows_count: undefined,
				_results_count: undefined,
				_last_search_by_key: '',
				_last_search_by_substring: '',
				_last_search_count_to_return: 30,

				data: 
				{
					_is_array: false,
					_path: [ 'sdDatabase', 'data' ],
					_synced: false,
					_pending: false,
					_expanded: false,
					_properties_change_pending: {},
					_auto_expand: true,
					_prevent_new_properties: true,
					_partial: false,
					_rows_count: undefined,
					_results_count: undefined,
					_last_search_by_key: '',
					_last_search_by_substring: '',
					_last_search_count_to_return: 30,
				}
			}
		};
		
		this.structure_update_cheduled = true;
		
		this.UpdateStructure();
	}
	
	MakeDefaultObjectProperties( obj, path, manually_made )
	{
		//if ( typeof obj === 'object' )
		if ( obj instanceof Object )
		{
			let template = 
			{
				_is_array: obj instanceof Array,
				_path: path,
				_synced: manually_made ? true : false,
				_pending: false,
				_expanded: manually_made ? true : false,
				_properties_change_pending: {},
				_last_search_by_key: '',
				_last_search_by_substring: '',
			};

			//let keys = Object.keys( obj );
			//for ( let i = 0; i < keys.length; i++ )
			for ( let p in obj )
			{
				//this.MakeDefaultObjectProperties( obj[ p ], path+'.'+p, manually_made );
				this.MakeDefaultObjectProperties( obj[ p ], path.concat( p ), manually_made );
			}
			
			for ( let p in template )
			{
				if ( obj.hasOwnProperty( p ) )
				if ( p === '_is_array' || // Do not lose _is_array type whenever pasting objects
					 p === '_expanded' ||
					 p === '_synced' )
				{
					continue;
				}
				
				obj[ p ] = template[ p ];
			}
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
			let property_access_parent = '';
			
			for ( let i = 0; i < key.length; i++ )
			{
				property_access += '['+JSON.stringify( key[ i ] )+']';
				
				if ( i < key.length - 1 )
				property_access_parent += '['+JSON.stringify( key[ i ] )+']';
			}
			
			if ( value instanceof Object )
			{
				if ( value._clear_old_properties )
				{
					let obj;
					
					eval( 'obj = sdDatabaseEditor.only_instance.known_data' + property_access + ';' );
					
					for ( let p in obj )
					if ( p.charAt( 0 ) !== '_' )
					delete obj[ p ];
				}
				
				eval( 'sdDatabaseEditor.only_instance.known_data' + property_access + ' = Object.assign( sdDatabaseEditor.only_instance.known_data' + property_access + ', value );' );
			}
			else
			if ( value === '#PROP_DELETED' )
			eval( 'delete sdDatabaseEditor.only_instance.known_data' + property_access + ';' );
			else
			eval( 'sdDatabaseEditor.only_instance.known_data' + property_access + ' = value;' );
			
			let last_prop = key[ key.length - 1 ];
			
			eval( 'delete sdDatabaseEditor.only_instance.known_data' + property_access_parent + '._properties_change_pending[ last_prop ];' );
			
			sdDatabaseEditor.only_instance.UpdateStructure();
		}
	}
	
	AskIfObjectCanBeRemoved( obj, what_it_will_do='delete both property and value permanently' )
	{
		if ( obj instanceof Object )
		{
			for ( let p in obj )
			if ( p.charAt( 0 ) !== '_' )
			{
				return confirm( T('Are you sure? This action will ' + what_it_will_do + '.') );
			}
			
			return true;
		}
		return true;
	}
	
	UpdateStructure()
	{
		this.structure_update_cheduled = true;
		setTimeout( ()=>{ 
			
			if ( this.structure_update_cheduled )
			{
				this.structure_update_cheduled = false;
				this._UpdateStructure();
			}
		}, 1 );
	}
	_UpdateStructure()
	{
		this.structure_element.removeChildren();
		
		let indent_step = 20;
		
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
		
			//key.element.style.transformOrigin = 'right center';
			
			if ( !parent_obj._prevent_new_properties )
			if ( change_sync_pending === 0 || change_sync_pending === 1 )
			key.setEditableStatus( true, ()=>{

				//if ( parent_obj[ name ] !== undefined )
				if ( parent_obj.hasOwnProperty( name ) )
				if ( key.text !== name )
				{
					if ( key.text === '' )
					{
						if ( this.AskIfObjectCanBeRemoved( obj ) )
						{
							parent_obj._properties_change_pending[ name ] = 1;

							// Delete
							delete parent_obj[ name ];

							this.UpdateStructure();

							sd_events.push([ 'DB_RENAME_PROP', parent_obj._path.concat( name ), '' ]);
						}
						else
						{
							key.text = name;
							this.UpdateStructure();
						}
					}
					else
					{
						let new_key_name = parent_obj._is_array ? parseInt( key.text ) : key.text;
						
						if ( new_key_name + '' === key.text )
						{
							//parent_obj._properties_change_pending[ name ] = 1;
							parent_obj._properties_change_pending[ new_key_name ] = 1;
							
							let v = parent_obj[ name ];

							parent_obj[ new_key_name ] = v;

							delete parent_obj[ name ];

							this.UpdateStructure();

							sd_events.push([ 'DB_RENAME_PROP', parent_obj._path.concat( name ), new_key_name ]);
						}
						else
						{
							alert( T('Key must be integer number since it is a key of array. Key won\'t be saved') );
							return;
						}
					}
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
				
				// Check if it is likely a timestemp
				if ( typeof obj === 'number' && obj >= 1671998741285 )
				{
					line.createElement({ 
						type: sdElement.TEXT, 
						text: new Date( obj ).toLocaleDateString( "en-US", { year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' } ),
						color: '#aaaaaa',
						marginLeft: 20
					});
				}
				else
				if ( typeof obj === 'boolean' )
				{
					line.createElement({ 
						type: sdElement.TEXT, 
						text: '[ Toggle ]', translate: true,
						color: '#aaaaaa',
						marginLeft: 20,
						onClick: ()=>
						{
							value.text = !obj;
							value.element.onblur();
						}
					});
				}
				else
				if ( obj === null )
				{
					line.createElement({ 
						type: sdElement.TEXT, 
						text: '[ object ]', translate: true,
						color: '#aaaaaa',
						marginLeft: 20,
						onClick: ()=>
						{
							value.text = '{}';
							value.element.onblur();
						}
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: '[ array ]', translate: true,
						color: '#aaaaaa',
						marginLeft: 20,
						onClick: ()=>
						{
							value.text = '[]';
							value.element.onblur();
						}
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: '[ string ]', translate: true,
						color: '#aaaaaa',
						marginLeft: 20,
						onClick: ()=>
						{
							value.text = '""';
							value.element.onblur();
						}
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: '[ number ]', translate: true,
						color: '#aaaaaa',
						marginLeft: 20,
						onClick: ()=>
						{
							value.text = '0';
							value.element.onblur();
						}
					});
					line.createElement({ 
						type: sdElement.TEXT, 
						text: '[ boolean ]', translate: true,
						color: '#aaaaaa',
						marginLeft: 20,
						onClick: ()=>
						{
							value.text = 'false';
							value.element.onblur();
						}
					});
				}
				
				//value.element.style.transformOrigin = 'left center';
				
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

							this.MakeDefaultObjectProperties( v, parent_obj._path.concat( name ), true );
						}
						catch ( e )
						{
							try
							{
								eval('v = ' + value.text + ';');

								this.MakeDefaultObjectProperties( v, parent_obj._path.concat( name ), true );
							}
							catch ( e )
							{
								if ( value.text === '' )
								{
									v = null;
									alert( T('Value must be proper JSON or JavaScript value. Erase property name if are trying to delete whole property.\n\nNote: Never insert unknown code here.') );
									
								}
								else
								{
									alert( T('Value must be proper JSON or JavaScript value. Value won\'t be saved.\n\nNote: Never insert unknown code here.') );
									return;
								}
							}
						}

						parent_obj._properties_change_pending[ name ] = 2;

						parent_obj[ name ] = v;

						this.UpdateStructure();
									
						//debugger; // Sync is not implemented
						
						sd_events.push([ 'DB_SET_VALUE', parent_obj._path.concat( name ), v ]);
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
						marginLeft: indent,
						paddingRight: 10
					});
					
					
					if ( obj._access_denied )
					{
						this.structure_element.createElement({ 
							type: sdElement.TEXT_BLOCK, 
							text: 'Access denied. Contact first admin of a server with database and ask him to give you "read" permissions to access this part of database. This will require knowing your "hash ID", you can get it by right clicking your character.', translate: true,
							color: '#ffaaaa',
							marginLeft: indent + indent_step,
						});
					}
					else
					{
						if ( obj._partial )
						{
							// Another line
							let line = this.structure_element.createElement({ 
								type: sdElement.TEXT_BLOCK, 
								text: '',
								marginLeft: indent + indent_step
							});

							const RequestSeachResults = ()=>
							{
								obj._last_search_by_key = search_by_key_box.text;
								obj._last_search_by_substring = search_by_substring.text;
								obj._last_search_count_to_return = parseInt( search_count_to_return.text ) || 30;

								if ( obj._last_search_by_key === 'By key, use * for partial match' )
								obj._last_search_by_key = '';

								if ( obj._last_search_by_substring === 'By substring in JSON' )
								obj._last_search_by_substring = '';

								sd_events.push([ 'DB_SEARCH', obj._path, [  
									obj._last_search_by_key,
									obj._last_search_by_substring,
									obj._last_search_count_to_return
								] ]);
							};

							let START = '<span style="color:#ffffff">';
							let END = '</span>';

							line.createElement({ 
								type: sdElement.TEXT, 
								innerHTML: T('Showing ') + START + obj._results_count + END + ( obj._results_count === 1 ? T(' row') : T(' rows') ) + T(' out of ') + START + obj._rows_count + END + ( obj._rows_count === 1 ? T(' row') : T(' rows') ),
								color: '#aaaaaa',
								paddingRight: 10,
							});

							// New line
							line = this.structure_element.createElement({ 
								type: sdElement.TEXT_BLOCK, 
								text: '\u00A0',
								marginLeft: indent + indent_step
							});
							// New line
							line = this.structure_element.createElement({ 
								type: sdElement.TEXT_BLOCK, 
								text: '',
								marginLeft: indent + indent_step
							});

							line.createElement({ 
								type: sdElement.TEXT, 
								text: 'Search [', translate: true,
								color: '#aaaaaa',
								paddingRight: 10,
							});

							let search_by_key_box = line.createElement({ 
								type: sdElement.TEXT, 
								text: obj._last_search_by_key || 'By key, use * for partial match',
								color: '#aaffaa',
								onClick: ()=>
								{
									if ( search_by_key_box.text === 'By key, use * for partial match' )
									search_by_key_box.text = '';
								}
							});
							line.createElement({ 
								type: sdElement.TEXT, 
								text: 'x',
								color: '#ffaaaa',
								marginLeft: 10,
								onClick: ()=>
								{
									search_by_key_box.text = 'By key, use * for partial match';
									RequestSeachResults();
								}
							});

							line.createElement({ 
								type: sdElement.TEXT, 
								text: '] [',
								color: '#aaaaaa',
								paddingLeft: 10,
								paddingRight: 10,
							});



							let search_by_substring = line.createElement({ 
								type: sdElement.TEXT, 
								text: obj._last_search_by_substring || 'By substring in JSON',
								color: '#aaffaa',
								onClick: ()=>
								{
									if ( search_by_substring.text === 'By substring in JSON' )
									search_by_substring.text = '';
								}
							});
							line.createElement({ 
								type: sdElement.TEXT, 
								text: 'x',
								color: '#ffaaaa',
								marginLeft: 10,
								onClick: ()=>
								{
									search_by_substring.text = 'By substring in JSON';
									RequestSeachResults();
								}
							});


							line.createElement({ 
								type: sdElement.TEXT, 
								text: '], show', translate: true,
								color: '#aaaaaa',
								paddingLeft: 10,
								paddingRight: 10,
							});




							let search_count_to_return = line.createElement({ 
								type: sdElement.TEXT, 
								text: obj._last_search_count_to_return || 30,
								color: '#aaffaa',
								onClick: ()=>
								{
								}
							});
							line.createElement({ 
								type: sdElement.TEXT, 
								text: 'rows', translate: true,
								color: '#aaaaaa',
								paddingLeft: 10,
								paddingRight: 10,
							});

							search_by_key_box.setEditableStatus( 

								true,

								()=>
								{
									if ( search_by_key_box.text === 'By key, use * for partial match' || search_by_key_box.text === '' )
									{
										search_by_key_box.text = 'By key, use * for partial match';
									}
									else
									{
										RequestSeachResults();
									}
								}, 

								{
									spellcheck: false
								}
							);
							search_by_substring.setEditableStatus( 

								true,

								()=>
								{
									if ( search_by_substring.text === 'By key, use * for partial match' || search_by_substring.text === '' )
									{
										search_by_substring.text = 'By key, use * for partial match';
									}
									else
									{
										RequestSeachResults();
									}
								}, 

								{
									spellcheck: false
								}
							);
							search_count_to_return.setEditableStatus( 

								true,

								()=>
								{
									RequestSeachResults();
								}, 

								{
									spellcheck: false
								}
							);

							// Line break
							this.structure_element.createElement({ 
								type: sdElement.TEXT_BLOCK, 
								text: '\u00A0',
								marginLeft: indent + indent_step
							});
						}


						let any_property_listed = false;

						for ( let p in obj )
						if ( p.charAt( 0 ) !== '_' )
						{
							any_property_listed = true;

							ShowObject( obj[ p ], p, indent + indent_step, obj );
						}

						if ( !obj._prevent_new_properties )
						{
						let line = this.structure_element.createElement({ 
							type: sdElement.TEXT_BLOCK, 
							text: '',
							marginLeft: indent,
							marginTop: any_property_listed ? 10 : 0
						});
						
						let add_prop_text = T('+ Add property');
						let add_prop_color = '#4c984c';
						let add_prop = line.createElement({ 
							type: sdElement.TEXT, 
							text: add_prop_text,
							color: add_prop_color,
							onClick: ()=>{
								add_prop.text = '';
								add_prop.color = '#ffffff';
							},
							marginLeft: 20
						});
						let once = true;
						add_prop.setEditableStatus( true, ()=>{
							
							let new_key_name = obj._is_array ? parseInt( add_prop.text ) : add_prop.text;
							
							if ( add_prop.text !== add_prop_text )
							if ( new_key_name + '' !== add_prop.text + '' )
							{
								alert( T('Key must be integer number since it is a key of array. Key won\'t be added') );
								new_key_name = '';
							}

							if ( new_key_name !== '' && add_prop.text !== add_prop_text && once )
							{
								once = false;
								
								obj._properties_change_pending[ new_key_name ] = 1;

								let v = null;

								obj[ new_key_name ] = v;

								this.UpdateStructure();
									
								//debugger; // Sync is not implemented
								
								//sd_events.push([ 'DB_RENAME_PROP', parent_obj._path.concat( '' ), new_key_name ]);
								sd_events.push([ 'DB_RENAME_PROP', obj._path.concat( '' ), new_key_name ]);
							}
							else
							{
								add_prop.text = add_prop_text;
								add_prop.color = add_prop_color;
							}
						});
						
						/*if ( !parent_obj._prevent_new_properties )
						line.createElement({ 
							type: sdElement.TEXT_BLOCK, 
							text: 'x Delete whole ' + ( ( obj instanceof Array ) ? 'array' : 'object' ),
							color: '#ff8383',
							onClick: ()=>{
								//if ( confirm( 'Are you sure? This operation can not be undone.' ) )
								if ( this.AskIfObjectCanBeRemoved( obj ) )
								{
									delete parent_obj[ name ];
									this.UpdateStructure();
									
									//debugger; // Sync is not implemented
									
									sd_events.push([ 'DB_RENAME_PROP', obj._path, '' ]);
								}
							},
							marginLeft: indent + 20,
							marginTop: 10
						});*/
						
						if ( !parent_obj._prevent_new_properties )
						line.createElement({ 
							type: sdElement.TEXT, 
							text: 'x Replace '+( ( obj instanceof Array ) ? 'array' : 'object' )+' with null', translate: true,
							color: '#ff8383',
							onClick: ()=>{
								if ( this.AskIfObjectCanBeRemoved( obj, 'replace old value' ) )
								{
									parent_obj[ name ] = null;
									this.UpdateStructure();
									
									sd_events.push([ 'DB_SET_VALUE', obj._path, null ]);
								}
							},
							marginLeft: 20,
						});
					
						line.createElement({ 
							type: sdElement.TEXT, 
							text: 'Copy ' + ( ( obj instanceof Array ) ? 'array' : 'object' ), translate: true,
							color: '#83ff83',
							onClick: ()=>{
								
								let str = JSON.stringify( obj );
								navigator.clipboard.writeText( str );
								
								if ( str.indexOf( `"_partial":true` ) !== -1 ||
									 str.indexOf( `"_synced":false` ) !== -1 )
								alert( T('Copied data might be partial (object is not synced fully)') );
							},
							marginLeft: 20,
						});
						line.createElement({ 
							type: sdElement.TEXT, 
							text: 'Paste copied value instead of this ' + ( ( obj instanceof Array ) ? 'array' : 'object' ), translate: true,
							color: '#8383ff',
							onClick: async ()=>{
								
								let insert = await navigator.clipboard.readText();
									
								if ( this.AskIfObjectCanBeRemoved( obj, 'replace old value' ) )
								{
									
									try
									{
										insert = JSON.parse( insert );
									}
									catch( e )
									{
										try
										{
											eval( 'insert = ' + insert );
										}
										catch( e )
										{
											alert( T('Unparsable value. Value must be JSON or JavaScript.\n\nNote: Never insert unknown code here.') );
										}
									}
									
									this.MakeDefaultObjectProperties( insert, obj._path, true );
									
									parent_obj[ name ] = insert;
									this.UpdateStructure();
									
									sd_events.push([ 'DB_SET_VALUE', obj._path, insert ]);
								}
							},
							marginLeft: 20,
						});
					}
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
						marginLeft: indent,
						paddingRight: 10
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
		this.window.remove();
		//this.overlay.remove();
	}
}

export default sdDatabaseEditor;