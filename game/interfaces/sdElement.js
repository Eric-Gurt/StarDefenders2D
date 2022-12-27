

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
		// Drop lists, radio buttons, shop options, item previews etc will be there. Ideally we will redo all interfaces to work in this way
		
		sdElement.css_classnames = [
			null,
			'sd_overlay',
			'sd_window',
			'sd_text',
			'sd_text_block',
			'sd_button'
		];
		sdElement.text_path = [
			null,
			null,
			'this.element_caption.textContent',
			'this.element.textContent',
			'this.element.textContent',
			'this.element.value'
		];
		sdElement.children_container = [
			'this.element',
			'this.element',
			'this.element_inner_container',
			'this.element',
			'this.element',
			null
		];
		
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
	
	static createElement( params )
	{
		return sdElement.root_element.createElement( params );
	}
	
	createElement( params )
	{
		if ( params.parent )
		throw new Error( 'These properties are reserved' );
	
		params.parent = this;
		
		let e = new sdElement( params );
		
		this.children.push( e );
		
		return e;
	}
	
	constructor( params )
	{
		if ( params.element || params.children )
		throw new Error( 'These properties are reserved' );
	
		if ( params.type === undefined )
		throw new Error( 'No type specified for sdElement' );
	
		this.children = [];
		this.parent = params.parent;
		this.type = params.type;
		
		this.translate = params.translate;
		
		this.elements = []; // Array of independent arrays, used for removal. No need to add nexted elements here - just top level one(s) that contain all other elements

		// and give it some content
		//const newContent = document.createTextNode("Hi there and greetings!");
		
		if ( this.type === sdElement.ROOT_ELEMENT )
		{
			this.element = document.body;
		}
		else
		{
			let element = document.createElement( 'div' );
			this.element = element;

			element.className = sdElement.css_classnames[ this.type ];
			
			this.parent.GetChildrenContainer().append( element );
			//this.parent.element.append( element );
			
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
			element.onmousedown = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 2 ) };
			element.onmouseup = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 1 ) };
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
		
			if ( old_value !== new_value )
			{
				callback();
				
				old_value = new_value;
			}
		};
		
		let old_value = element.textContent;
		
		element.setAttribute( 'spellcheck', params.spellcheck ? 'true' : 'false' );
		
		element.contentEditable = v ? 'true' : 'false';
		/*element.onblur = callback;
		element.onkeyup = callback;
		element.onpaste = callback;
		element.oncopy = callback;
		element.oncut = callback;
		element.ondelete = callback;
		element.onmouseup = callback;*/
		
		element.onblur = v ? ()=>
		{
			window.getSelection().removeAllRanges();
			
			action();
		} : null;
		
		element.onkeydown = v ? ( e )=>
		{
			if ( e.key === 'Enter' )
			{
				e.preventDefault();
				e.stopImmediatePropagation();
				
				action();
			}
		} : null;
		
		//if ( v )
		//element.focus();
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
		
		this.element.onclick = ( e )=>{
			
			if ( e.target === this.element )
			v( e );
		};
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
	
	removeChildren()
	{
		for ( let i = this.children.length - 1; i >= 0; i-- )
		this.children[ i ].remove();
	}
	
	remove() // Recursively removes children as well
	{
		if ( this.type === sdElement.ROOT_ELEMENT )
		throw new Error();
	
		if ( sdElement.current_hover === this )
		this.nativeSetHover( null, 0 );
		
		
		let id = this.parent.children.indexOf( this );
		if ( id === -1 )
		throw new Error();
		
		this.parent.children.splice( id, 1 );
		
		this.removeChildren();
	
		this.children = null;
		
		while ( this.elements.length > 0 )
		this.elements.shift().remove();
	
		//this.element.remove();
		this.element = null;
	}
}

export default sdElement;