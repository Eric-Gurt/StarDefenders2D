

/* global sdWorld */

class sdElement
{
	static init_class()
	{
		sdElement.ROOT_ELEMENT = 0; // Can be only one, automatically made
		sdElement.OVERLAY = 1; // Transparent yet clickable, automatically fullyscreen. Usually sends click events towards first children that has .onCloseButton property, trying to close window basically
		sdElement.WINDOW = 2; // 85%-ish black rectangle, automatically fullscreen but with outer margin. Accepts extra .onCloseButton property if it should be closeable
		sdElement.TEXT = 3; // Just a text, maybe clickable
		sdElement.TEXT_BLOCK = 4; // Just a text, maybe clickable
		sdElement.BUTTON = 5; // Just a button, possibly with a caption
		sdElement.ROW = 6; // Vertical alignment block
		// Drop lists, radio buttons, shop options, item previews etc will be there. Ideally we will redo all interfaces to work in this way
		
		sdElement.css_classnames = [
			null,
			'sd_overlay',
			'sd_window',
			'sd_text',
			'sd_text_block',
			'sd_button',
			'sd_row'
		];
		sdElement.text_path = [
			null,
			null,
			'this.element_caption.textContent',
			'this.element.textContent',
			'this.element.textContent',
			'this.element.textContent', // 'this.element.value'
			'this.element.textContent'
		];
		sdElement.children_container = [
			'this.element',
			'this.element',
			'this.element_inner_container',
			'this.element',
			'this.element',
			'this.element',
			'this.element'
		];
		
		if ( typeof window === 'undefined' )
		{
			sdElement.root_element = null;
			sdElement.current_hover = null;
			sdElement.hover_element = null;
		}
		else
		{
			sdElement.root_element = new sdElement({ type: sdElement.ROOT_ELEMENT });

			sdElement.current_hover = null;
			sdElement.hover_element = document.createElement( 'div' );
			sdElement.hover_element.style.cssText = `
				position: fixed;
				left: 0;
				top: 0;
				width: 0;
				height: 0;
				pointer-events: none;
				background-color: rgba(255,255,255,0.3);
				visibility: visible;
				z-index: 1000;
			`;
			document.body.append( sdElement.hover_element );
		}
		
		sdElement.current_hold = null;
	}
	
	static createElement( params )
	{
		return sdElement.root_element.createElement( params );
	}
	
	createElement( params )
	{
		if ( params.parent )
		throw new Error( 'These properties are reserved' );
	
		params.parent = this;
		
		let e;
		
		if ( params.element_reuse_key && params.element_reuse_key && !params.element_reuse_key._is_being_removed )
		{
			e = params.element_reuse_key;
			
			if ( e.type === sdElement.ROOT_ELEMENT )
			throw new Error( 'element_reuse_key is not supported for this type of sdElement' );
		
			if ( e.type === sdElement.WINDOW )
			throw new Error( 'element_reuse_key is not supported for this type of sdElement' );
			
			if ( e.parent !== params.parent )
			{
				if ( e.parent )
				e.detachFromParent();

				e.parent = params.parent;
				e.parent.GetChildrenContainer().append( e.element );
				
				/*if ( e._is_being_removed )
				throw new Error();
			
				if ( e.parent._is_being_removed )
				throw new Error();*/
				
				this.children.push( e );
			}
		}
		else
		{
			e = new sdElement( params );
			this.children.push( e );
		}
	
		e.is_new = true; // For tacking partial structural updates - you can remove elements that aren't new
		
		return e;
	}
	MarkAsOldRecursively()
	{
		this.is_new = false;
		for ( let i = 0; i < this.children.length; i++ )
		this.children[ i ].MarkAsOldRecursively();
	}
	RemoveOldRecursively()
	{
		if ( !this.is_new )
		this.remove();
		else
		{
			let children_copy = this.children.slice();
			
			for ( let i = 0; i < children_copy.length; i++ )
			children_copy[ i ].RemoveOldRecursively();
		}
	}
	
	constructor( params )
	{
		if ( params.element || params.children )
		throw new Error( 'These properties are reserved' );
	
		if ( params.type === undefined )
		throw new Error( 'No type specified for sdElement' );
	
		this._is_being_removed = false;
	
		this.children = [];
		this.parent = params.parent;
		this.type = params.type;
		
		this.translate = params.translate;
		
		this.last_textContent = null; // Used to track textContent altering on editable elements
		
		this.elements = []; // Array of independent arrays, used for removal. No need to add nexted elements here - just top level one(s) that contain all other elements

		// and give it some content
		//const newContent = document.createTextNode("Hi there and greetings!");
		
		if ( this.type === sdElement.ROOT_ELEMENT )
		{
			this.element = document.body;
		}
		else
		{
			/*if ( params.element_reuse_key && params.element_reuse_key.element )
			{
				this.element = params.element_reuse_key.element;
			}
			else*/
			{
				let element = document.createElement( 'div' );
				this.element = element;

				element.className = sdElement.css_classnames[ this.type ];

				this.parent.GetChildrenContainer().append( element );

				if ( this.type === sdElement.WINDOW )
				{
					if ( params.draggable || params.onCloseButton )
					{
						let caption = document.createElement( 'div' );
						caption.className = 'sd_window_caption';
						element.append( caption );
						this.element_caption = caption;

						let dragging = false;
						caption.onmousedown = ( e )=>
						{
							if ( dragging )
							return;

							dragging = true;

							let bounds = element.getBoundingClientRect();

							let dx = bounds.x - e.pageX;
							let dy = bounds.y - e.pageY;

							let up = ( e )=>
							{
								document.removeEventListener( 'mouseup', up );
								document.removeEventListener( 'mousemove', move );

								dragging = false;
							};
							let move = ( e )=>
							{
								let mx = e.pageX;
								let my = e.pageY;

								if ( mx + dx > document.body.scrollWidth - 30 )
								mx = document.body.scrollWidth - 30 - dx;

								if ( mx + dx + bounds.width < 30 )
								mx = 30 - dx - bounds.width;

								if ( my + dy > document.body.scrollHeight - 30 )
								my = document.body.scrollHeight - 30 - dy;

								if ( my + dy < 0 )
								my = 0 - dy;

								element.style.position = 'fixed';
								element.style.left = mx + dx + 'px';
								element.style.top = my + dy + 'px';
							};
							document.addEventListener( 'mouseup', up );
							document.addEventListener( 'mousemove', move );
						};

						let inner_container = document.createElement( 'div' );
						inner_container.className = 'sd_window_inner_container';
						element.append( inner_container );
						this.element_inner_container = inner_container;

						if ( params.onCloseButton )
						{
							let close_btn = document.createElement( 'div' );
							close_btn.className = 'sd_window_close_btn';
							element.append( close_btn );
							this.close_btn = close_btn;
							close_btn.onclick = params.onCloseButton;
							close_btn.textContent = 'x';
						}
					}
					else
					{
						let inner_container = document.createElement( 'div' );
						inner_container.className = 'sd_window_inner_container';
						element.append( inner_container );
						this.element_inner_container = inner_container;

						inner_container.style.height = '100%';
					}
				}

				element.onmouseover = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 1 ) };
				element.onmouseout = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 0 ) };
				element.onmousedown = ( e )=>
				{ 
					if ( e.target === this.element ) 
					{
						this.nativeSetHover( e, 2 );
						
						sdElement.current_hold = this;
					}
				};
				element.onmouseup = ( e )=>
				{ 
					if ( e.target === this.element )
					{
						this.nativeSetHover( e, 1 );
						
						if ( sdElement.current_hold === this )
						{
							if ( this._onClick )
							{
								this._onClick( e );
							}
						}
					}
				};
			}
		}
		
		this.elements.push( this.element );
		
		for ( let p in params )
		this[ p ] = params[ p ];
	}
	
	GetChildrenContainer()
	{
		let v;
		eval( 'v = ' + sdElement.children_container[ this.type ] );
		return v;
	}
	
	setEditableStatus( v, callback=null, params={} /*edit_once=false*/ )
	{
		let element = this.element;

		// Removed
		if ( !element )
		return;

		this.last_textContent = element.textContent;

		let activate_once = ()=>
		{
			activate_once = ()=>{};

			let action = null;

			if ( v )
			action = ()=>
			{
				let new_value = element.textContent;

				if ( params.edit_once )
				{
					action = ()=>{};

					this.setEditableStatus( false ); // Causes blur action
				}

				if ( this.last_textContent !== new_value )
				{
					callback();

					this.last_textContent = new_value;
				}
			};

			element.setAttribute( 'spellcheck', params.spellcheck ? 'true' : 'false' );

			let v_str = v ? 'true' : 'false';

			if ( v_str !== element.contentEditable )
			{
				element.contentEditable = v ? 'true' : 'false';
			}

			element.onblur = v ? ()=>
			{
				window.getSelection().removeAllRanges();

				action();
			} : null;

			element.onkeydown = v ? ( e )=>
			{
				if ( params.code && e.key === 'Tab' )
				{
					let t = element.textContent;
					let pos = window.getSelection().anchorOffset;
					
					function MoveCaret( pos )
					{
						let range = document.createRange();
						let sel = window.getSelection();

						range.setStart(element.childNodes[0], pos );
						range.collapse(true);

						sel.removeAllRanges();
						sel.addRange(range);
					}
					
					if ( e.shiftKey )
					{
						let last_tab = t.lastIndexOf( '\t', pos - 1 );
						let last_br = t.lastIndexOf( '\n', pos - 1 );
						
						if ( last_tab > last_br )
						{
							element.textContent = t.slice( 0, last_tab ) + t.slice( last_tab + 1 );
							MoveCaret( pos - 1 );
						}
					}
					else
					{
						element.textContent = t.slice( 0, pos ) + '\t' + t.slice( pos );
						MoveCaret( pos + 1 );
					}
					

					
					
					
					e.preventDefault();
					e.stopImmediatePropagation();
				}
				else
				if ( params.code && e.key === 'Enter' )
				{
				}
				else
				if ( e.key === 'Enter' )
				{
					e.preventDefault();
					e.stopImmediatePropagation();

					action();
				}
			} : null;

			//if ( v )
			//element.focus();
		};
		
		element.onmousedown = ()=>
		{
			activate_once();
		};
		/*
		element.onblur = ( e )=>
		{
			activate_once();
			
			element.onblur( e );
		};*/
	}
	
	nativeSetHover( e=null, value )
	{
		if ( value > 0 )
		{
			if ( sdElement.current_hover )
			sdElement.current_hover.nativeSetHover( null, 0 );
			
			sdElement.current_hover = this;
			
			if ( this._onClick && this.type !== sdElement.OVERLAY )
			{
				let b = sdElement.current_hover.element.getBoundingClientRect();
				
				let overlap = 1;

				sdElement.hover_element.style.left = b.x - overlap + 'px';
				sdElement.hover_element.style.top = b.y - overlap + 'px';
				sdElement.hover_element.style.width = b.width + overlap*2 + 'px';
				sdElement.hover_element.style.height = b.height + overlap*2 + 'px';
				sdElement.hover_element.style.visibility = ( !sdElement.current_hover.element.contentEditable || sdElement.current_hover.element !== document.activeElement ) ? 'visible' : 'hidden';
				
				if ( value === 2 ) // Hold
				{
					sdElement.hover_element.style.backgroundColor = 'rgba(0,0,0,0.3)';
				}
				else
				{
					sdElement.hover_element.style.backgroundColor = 'rgba(255,255,255,0.3)';
				}
			}
		}
		else
		{
			//this.element.filter = '';
			if ( sdElement.current_hover === this )
			{
				sdElement.current_hover = null;
				
				sdElement.hover_element.style.visibility = 'hidden';
			}
		}
	}
	
	set color( v )
	{ this.element.style.color = v; }
	
	get color()
	{ return this.element.style.color; }
	
	set text( v )
	{
		if ( this.translate )
		v = T(v);
	
		eval( sdElement.text_path[ this.type ] + ' = v;' );
		
		//this.last_textContent = this.element.textContent;
	}
	get text()
	{
		let v;
		
		eval( 'v = ' + sdElement.text_path[ this.type ] + ';' );
		
		return v;
	}
	set innerHTML( v )
	{
		let ptr_str = sdElement.text_path[ this.type ].split( 'textContent' ).join( 'innerHTML' );
		eval( ptr_str + ' = v;' );
	}
	get innerHTML()
	{
		let v;
		
		let ptr_str = sdElement.text_path[ this.type ].split( 'textContent' ).join( 'innerHTML' );
		eval( 'v = ' + ptr_str + ';' );
		
		return v;
	}
	
	
	set onClick( v )
	{
		this._onClick = v;
		
		/*this.element.onmousedown = ( e )=>
		{
			if ( e.target === this.element )
			{
				sdElement.current_hold = this;
			}
		};
		this.element.onmouseup = ( e )=>
		{
			if ( e.target === this.element )
			{
				if ( sdElement.current_hold === this )
				v( e );
			}
		};*/
		/*
		this.element.onclick = ( e )=>{
			
			if ( e.target === this.element )
			v( e );
		};*/
	}
	get onClick()
	{
		return this._onClick;
	}
	
	set marginLeft( v )
	{ this.element.style.marginLeft = v + 'px'; }
	set marginTop( v )
	{ this.element.style.marginTop = v + 'px'; }
	set marginBottom( v )
	{ this.element.style.marginBottom = v + 'px'; }
	set marginRight( v )
	{ this.element.style.marginRight = v + 'px'; }
	
	set paddingTop( v )
	{ this.element.style.paddingTop = v + 'px'; }
	set paddingBottom( v )
	{ this.element.style.paddingBottom = v + 'px'; }
	set paddingRight( v )
	{ this.element.style.paddingRight = v + 'px'; }
	set paddingLeft( v )
	{ this.element.style.paddingLeft = v + 'px'; }
	set padding( v )
	{
		this.paddingTop = v;
		this.paddingBottom = v;
		this.paddingRight = v;
		this.paddingLeft = v;
	}
	
	set width( v )
	{ this.element.style.width = v + 'px'; }
	set height( v )
	{ this.element.style.height = v + 'px'; }
	
	removeChildren()
	{
		//if ( this.children )
		for ( let i = this.children.length - 1; i >= 0; i-- )
		this.children[ i ].remove();
	}
	
	detachFromParent()
	{
		if ( this.parent )
		{
			let id = this.parent.children.indexOf( this );
			if ( id === -1 )
			throw new Error();

			this.parent.children.splice( id, 1 );
			
			/*for ( let i = 0; i < this.parent.children.length; i++ )
			if ( this.parent.children[ i ]._is_being_removed )
			throw new Error( 'bug already happened' );*/
			
			this.parent = null;
		}
		else
		throw new Error();
	}
	
	remove() // Recursively removes children as well
	{
		if ( this.type === sdElement.ROOT_ELEMENT )
		throw new Error();
	
		if ( sdElement.current_hover === this )
		this.nativeSetHover( null, 0 );
		
		this.detachFromParent();
		//this.parent.children.splice( id, 1 );
		
		this.removeChildren();
	
		this.children = null;
		
		while ( this.elements.length > 0 )
		this.elements.shift().remove();
	
		//this.element.remove();
		this.element = null;
		
		this._is_being_removed = true;
		this._removed_at = getStackTrace();
	}
}

export default sdElement;