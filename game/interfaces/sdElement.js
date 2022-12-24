

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
			
			this.parent.element.append( element );
			
			if ( this.type === sdElement.WINDOW )
			{
				let caption = document.createElement( 'div' );
				caption.className = 'sd_window_caption';
				element.append( caption );
				
				this.element_caption = caption;
			}
			
			element.onmouseover = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 1 ) };
			element.onmouseout = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 0 ) };
			element.onmousedown = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 2 ) };
			element.onmouseup = ( e )=>{ if ( e.target === this.element ) this.nativeSetHover( e, 1 ) };
		}
		
		for ( let p in params )
		this[ p ] = params[ p ];
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
				sdElement.hover_element.style.visibility = 'visible';
				
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
	
	set text( v )
	{
		//this.element.textContent = v;
		eval( sdElement.text_path[ this.type ] + ' = v;' );
	}
	get text()
	{
		let v;
		
		eval( 'v = ' + sdElement.text_path[ this.type ] + ';' );
		//return this.element.textContent;
		
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
	{
		this.element.style.marginLeft = v + 'px';
	}
	
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
		//for ( let i = this.children.length - 1; i >= 0; i-- )
		//this.children[ i ].remove();
	
		this.children = null;
		
		this.element.remove();
		//this.element.parentNode.remove( this.element );
		this.element = null;
	}
}

export default sdElement;