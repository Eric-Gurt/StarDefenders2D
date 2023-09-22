/*


	Mostly meant for proper playing on tablets


*/
/* global globalThis, sdWorld, sdRenderer */

class sdMobileKeyboard
{
	static
	{
		sdMobileKeyboard.container = null;
		sdMobileKeyboard.open = false;
		sdMobileKeyboard.allowed = false;
		
		//sdMobileKeyboard.allowed = true; console.warn( 'Testing tablet UI even on Desktop devices...' ); // Hack
		
		sdMobileKeyboard.initialized = false;
		
		sdMobileKeyboard.KEY_SIZE = 1.8; // * 1.5
		sdMobileKeyboard.KEY_SPACE = 0.2; // 0.4
		
		sdMobileKeyboard.KEY_SIZE_MICE = 1.8;
		sdMobileKeyboard.KEY_SPACE_MICE = 0.4;
		
		sdMobileKeyboard.buttons = []; // HTML elements
		sdMobileKeyboard.touches = []; // [ { pageX pageY } ]
		
		document.ontouchstart = ()=>
		{
			sdMobileKeyboard.allowed = true;
			
			/*addEventListener("error", (event) => {

				alert( 'Error at:\nLine: ' + event.lineno + '\nMessage: ' + event.error.message );

			});*/
			
			document.ontouchstart = (e)=>{ 
				
				sdSound.AllowSound();
				sdWorld.GoFullscreen();
				
				touch_handler(e); 
			};
			document.ontouchmove = touch_handler;

			document.ontouchcancel = touch_handler;
			document.ontouchend = touch_handler;
			
			function touch_handler( e )
			{
				let old_touches = sdMobileKeyboard.touches;
				
				sdMobileKeyboard.touches = [];
				
				for ( let i = 0; i < e.touches.length; i++ )
				{
					let read_only_touch = e.touches.item( i );
					
					let touch = {
						pageX: read_only_touch.pageX,
						pageY: read_only_touch.pageY,
						identifier: read_only_touch.identifier,
						current_button: null,
						snap_button: null // Closest if nothing is being hovered
					};
					
					for ( let i2 = 0; i2 < old_touches.length; i2++ )
					{
						if ( old_touches[ i2 ].identifier === touch.identifier )
						{
							let old = old_touches[ i2 ];
							old.pageX = touch.pageX;
							old.pageY = touch.pageY;
							touch = old;
						}
					}
					
					sdMobileKeyboard.touches.push( touch );
				}
			
				sdMobileKeyboard.ThinkNow();
			
				if ( e.target && e.target.tagName === 'CANVAS' )
				e.preventDefault();
			}
		};
	}
	
	static MakeButton( params )
	{
		let element = document.createElement( 'SPAN' );

		element.className = 'r_container';

		element.style.position = 'fixed';

		//params.x = ( params.x );
		//params.y = ( params.y );

		if ( params.x > 0 )
		element.style.left = params.x + 'cm';
		else
		element.style.right = -params.x + 'cm';

		if ( params.y > 0 )
		element.style.top = params.y + 'cm';
		else
		element.style.bottom = -params.y + 'cm';

		element.style.width = ( params.w || sdMobileKeyboard.KEY_SIZE ) + 'cm';
		element.style.height = ( params.h || sdMobileKeyboard.KEY_SIZE ) + 'cm';

		let action_key = params.key;

		let event = {
			key: '?',
			code: action_key,
			preventDefault: ()=>{},
			target: null
		};

		let down = window.onkeydown;
		let down2 = null;
		let up = window.onkeyup;

		if ( params.key.substring( 0, 3 ) === 'Key' )
		{
			params.key = params.key.substring( 3 );
			down2 = window.onkeypress;
		}

		if ( params.key.substring( 0, 5 ) === 'Digit' )
		{
			params.key = params.key.substring( 5 );
			down2 = window.onkeypress;
		}

		if ( params.key.substring( 0, 5 ) === 'Mouse' )
		{
			down = window.onmousedown;
			up = window.onmouseup;

			event.which = ( ~~( params.key.substring( 5 ) ) );
		}


		if ( params.key === 'Space' )
		{
			event.key = ' ';
			down2 = window.onkeypress;
		}
		else
		{
			event.key = params.key;
		}

		element.sdUpdate = null;

		element.sd_group_id = params.group_id;

		if ( action_key === '#' ) // Cursor dragger
		{
			let relative_to_touch = null;
			let xx = 0;
			let yy = 0;

			let x = 0;
			let y = 0;

			element.sdUpdate = ()=>
			{
				if ( relative_to_touch )
				{
					let dx = relative_to_touch.pageX - xx;
					let dy = relative_to_touch.pageY - yy;

					x += dx;
					y += dy;

					xx += dx;
					yy += dy;

					//alert( dx + ', ' + dy + ', ' + element.style.transform );

					for ( let i = 0; i < sdMobileKeyboard.buttons.length; i++ )
					if ( sdMobileKeyboard.buttons[ i ].sd_group_id === element.sd_group_id )
					sdMobileKeyboard.buttons[ i ].style.transform = 'translate('+x+'px,'+y+'px)';

					//element.textContent = relative_to_touch.pageX+', ' + relative_to_touch.pageY+' / ' + dx+', '+dy;

					window.onmousemove({
						target: sdRenderer.canvas,
						mobile_bypass: true,
						clientX: x * 5 + sdRenderer.screen_width / 2,
						clientY: y * 5 + sdRenderer.screen_height / 2
					});

					//sdWorld.mouse_screen_x = e.clientX * sdRenderer.resolution_quality;
					//sdWorld.mouse_screen_y = e.clientY * sdRenderer.resolution_quality;
				}
				else
				{
					//element.textContent = 'no touch';
				}
			};

			down = ()=>
			{
				if ( !relative_to_touch )
				{
					relative_to_touch = element.sd_current_touches[ 0 ];
					xx = relative_to_touch.pageX;
					yy = relative_to_touch.pageY;

					//alert('drag');
				}
			};

			up = ()=>
			{
				if ( element.sd_current_touches.indexOf( relative_to_touch ) === -1 )
				{
					relative_to_touch = null;
					//alert('drag stop');
				}
			};

			params.key = 'drag';
		}

		element.sdKeyDown = ()=>
		{
			event.target = sdRenderer.canvas;

			element.classList.add( 'r_held' );
			
			if ( params.onPress )
			params.onPress();

			down( event );

			if ( down2 )
			down2( event );
		};
		element.sdKeyUp = ()=>
		{
			element.classList.remove( 'r_held' );

			up( event );
		};

		let last_bounds_update = -1;
		let bounds = null;
		element.sdGetUpdateBounds = ()=>
		{
			if ( last_bounds_update !== sdWorld.time )
			{
				last_bounds_update = sdWorld.time;
				bounds = element.getBoundingClientRect();
			}
			return bounds;
		};
		element.sdAddTouch = ( touch )=>
		{
			let triggers_event = false;

			if ( element.sd_current_touches.length === 0 )
			triggers_event = true;

			element.sd_current_touches.push( touch );

			if ( triggers_event )
			element.sdKeyDown();
		};
		element.sdRemoveTouchByID = ( listed_id )=>
		{
			element.sd_current_touches.splice( listed_id, 1 );

			if ( element.sd_current_touches.length === 0 )
			element.sdKeyUp();
		};
		
		element.sdRemove = ()=>
		{
			element.parentNode.removeChild( element );
			
			let id = sdMobileKeyboard.buttons.indexOf( element );
			if ( id !== -1 )
			sdMobileKeyboard.buttons.splice( id, 1 );
		};

		if ( params.caption )
		element.textContent = params.caption;
		else
		element.textContent = params.key;

		//if ( 'WSAD'.indexOf( params.key ) !== -1 )
		if ( params.bold )
		element.classList.add( 'r_wsad' );
	
		if ( params.dimmed_background )
		element.classList.add( 'r_dimmed_bg' );

		element.sd_current_touches = [];

		sdMobileKeyboard.container.append( element );

		sdMobileKeyboard.buttons.push( element );
		
		return element;
	}
	
	static Init()
	{
		sdMobileKeyboard.initialized = true;
		
		sdMobileKeyboard.container = document.getElementById( 'mobile_ui' );
		sdMobileKeyboard.container.innerHTML = '';
		
		const KEY_SIZE = sdMobileKeyboard.KEY_SIZE;
		const KEY_SPACE = sdMobileKeyboard.KEY_SPACE;
		
		const KEY_SIZE_MICE = sdMobileKeyboard.KEY_SIZE_MICE;
		const KEY_SPACE_MICE = sdMobileKeyboard.KEY_SPACE_MICE;
		
		let MakeButton = sdMobileKeyboard.MakeButton;
		
		for ( let i = 0; i <= 10; i++ )
		MakeButton({ key:'Digit'+(i%10), x: 1 + ( KEY_SIZE*0.5 ) * i, y: -1 - ( KEY_SIZE + KEY_SPACE ) * 3, w:KEY_SIZE*0.5, h:KEY_SIZE*0.5 });
		
		MakeButton({ key:'KeyA', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 0, y: -1 - ( KEY_SIZE + KEY_SPACE ) * 1, bold: true });
		MakeButton({ key:'KeyQ', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 0, y: -1 - ( KEY_SIZE + KEY_SPACE ) * 2 });
		
		MakeButton({ key:'KeyX', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 1,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 0 });
		MakeButton({ key:'KeyS', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 1,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 1, bold: true });
		MakeButton({ key:'KeyW', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 1,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 2, bold: true });
		
		MakeButton({ key:'KeyC', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 2,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 0 });
		MakeButton({ key:'KeyD', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 2,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 1, bold: true });
		MakeButton({ key:'KeyE', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 2,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 2 });
		
		MakeButton({ key:'KeyV', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 3,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 0 });
		MakeButton({ key:'KeyF', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 3,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 1 });
		MakeButton({ key:'KeyR', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 3,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 2 });
		
		MakeButton({ key:'KeyB', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 4,	y: -1 - ( KEY_SIZE * 0.5 + KEY_SPACE ) });
		MakeButton({ key:'KeyN', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 5,	y: -1 - ( KEY_SIZE * 0.5 + KEY_SPACE ) });
		
		MakeButton({ key:'Space', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 4,	y: -1 - ( KEY_SIZE + KEY_SPACE ) * 0, w: 2 * KEY_SIZE + KEY_SPACE, h:KEY_SIZE * 0.5 });
		MakeButton({ key:'Enter', x: 1 + ( KEY_SIZE + KEY_SPACE ) * 4,	y: -1 - ( KEY_SIZE * 1.5 + KEY_SPACE * 2 ), w: 2 * KEY_SIZE + KEY_SPACE, h:KEY_SIZE * 0.5 });
		
		
		MakeButton({ key:'Mouse3', caption:'R', x: -1 - ( KEY_SIZE_MICE + KEY_SPACE_MICE ) * 0, y: -1 - ( KEY_SIZE_MICE + KEY_SPACE_MICE ) * 3, group_id: 11, w:KEY_SIZE_MICE*2,h:KEY_SIZE_MICE*4.5 });
		MakeButton({ key:'Mouse1', caption:'L', x: -1 - ( KEY_SIZE_MICE + KEY_SPACE_MICE ) * ( 3 - 1.35 ), y: -1 - ( KEY_SIZE_MICE + KEY_SPACE_MICE ) * 3, group_id: 11, w:KEY_SIZE_MICE*2,h:KEY_SIZE_MICE*3.5 });
		MakeButton({ key:'#', caption:'☰', x: -1 - ( KEY_SIZE_MICE + KEY_SPACE_MICE ) * ( 2.5 - 1.35 ), y: -0.5, group_id: 11, w:KEY_SIZE_MICE*2,h:KEY_SIZE_MICE*2 });
	}
	
	static Open()
	{
		if ( !sdMobileKeyboard.allowed )
		return;
	
		if ( !sdMobileKeyboard.open )
		{
			if ( !sdMobileKeyboard.initialized )
			sdMobileKeyboard.Init();

			sdMobileKeyboard.container.style.display = 'block';

			sdMobileKeyboard.open = true;
		}
	}
	
	static Close()
	{
		if ( sdMobileKeyboard.open )
		{
			sdMobileKeyboard.container.style.display = 'none';

			sdMobileKeyboard.open = false;
		}
	}
	
	static ThinkNow()
	{
		for ( let i = 0; i < sdMobileKeyboard.touches.length; i++ )
		{
			let touch = sdMobileKeyboard.touches[ i ];
			
			/*if ( touch.current_button )
			touch.snap_button = touch.current_button;
			else*/
			{
				let x = touch.pageX;
				let y = touch.pageY;
				
				let best_di = Infinity;
				
				touch.snap_button = null;
				
				for ( let i2 = 0; i2 < sdMobileKeyboard.buttons.length; i2++ )
				{
					let element = sdMobileKeyboard.buttons[ i2 ];
					
					let bounds = element.sdGetUpdateBounds();
			
					let closest_x = Math.max( bounds.x, Math.min( x, bounds.x + bounds.width ) );
					let closest_y = Math.max( bounds.y, Math.min( y, bounds.y + bounds.height ) );
					
					let di = sdWorld.Dist2D_Vector_pow2( x - closest_x, y - closest_y );
					
					if ( element === touch.current_button )
					di -= 30 * 30;
					
					if ( di < 40 * 40 )
					if ( di < best_di )
					{
						best_di = di;
						touch.snap_button = element;
					}
				}
			}
		}
				
		for ( let i2 = 0; i2 < sdMobileKeyboard.buttons.length; i2++ )
		{
			let element = sdMobileKeyboard.buttons[ i2 ];
			
			if ( element.sdUpdate )
			element.sdUpdate();

			let bounds = element.sdGetUpdateBounds();

			for ( let i = 0; i < sdMobileKeyboard.touches.length; i++ )
			{
				let touch = sdMobileKeyboard.touches[ i ];
				
				if ( touch.current_button === element || touch.current_button === null )
				{
				}
				else
				{
					continue;
				}
			
				let x = touch.pageX;
				let y = touch.pageY;
			
				let hit = touch.snap_button === element ||
				   ( x > bounds.x &&
				     x < bounds.x + bounds.width &&
				     y > bounds.y &&
				     y < bounds.y + bounds.height );
			 
				let listed_id = element.sd_current_touches.indexOf( touch );
				let listed = ( listed_id !== -1 );
				
				if ( hit === listed )
				{
					// Same state
				}
				else
				{
					if ( hit )
					{
						element.sdAddTouch( touch );
						
						touch.current_button = element;
					}
					else
					{
						element.sdRemoveTouchByID( listed_id ); // Touches that exist but were moved away
						
						touch.current_button = null;
					}
				}
			}
			
			// Handle removed touches
			for ( let i = 0; i < element.sd_current_touches.length; i++ )
			{
				let touch = element.sd_current_touches[ i ];
				
				if ( sdMobileKeyboard.touches.indexOf( touch ) === -1 )
				{
					element.sdRemoveTouchByID( i );
					i--;
					continue;
				}
			}
		}
	}
}

globalThis.sdMobileKeyboard = sdMobileKeyboard;

export default sdMobileKeyboard;