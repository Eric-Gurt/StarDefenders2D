
    /* global globalThis */

meSpeak.loadVoice("voices/en/en.json");
	
	var socket = io( '/' );


	import sdRenderer from './client/sdRenderer.js';
	import sdShop from './client/sdShop.js';
	import sdChat from './client/sdChat.js';
	import sdContextMenu from './client/sdContextMenu.js';

	import sdWorld from './sdWorld.js';
	import sdSound from './sdSound.js';
	import sdKeyStates from './sdKeyStates.js';
	import sdEntity from './entities/sdEntity.js';
	import sdCharacter from './entities/sdCharacter.js';
	import sdGun from './entities/sdGun.js';
	import sdEffect from './entities/sdEffect.js';
	import sdBlock from './entities/sdBlock.js';
	import sdCrystal from './entities/sdCrystal.js';
	import sdBullet from './entities/sdBullet.js';
	import sdCom from './entities/sdCom.js';
	import sdAsteroid from './entities/sdAsteroid.js';
	import sdVirus from './entities/sdVirus.js';
	import sdTeleport from './entities/sdTeleport.js';
	import sdDoor from './entities/sdDoor.js';
	import sdWater from './entities/sdWater.js';
	import sdBG from './entities/sdBG.js';
	import sdWeather from './entities/sdWeather.js';
	import sdTurret from './entities/sdTurret.js';
	import sdMatterContainer from './entities/sdMatterContainer.js';
	import sdQuickie from './entities/sdQuickie.js';
	import sdOctopus from './entities/sdOctopus.js';
	import sdAntigravity from './entities/sdAntigravity.js';


	sdWorld.init_class();
	sdRenderer.init_class();
	
	sdSound.init_class();
	sdContextMenu.init_class();
	sdEntity.init_class();
	sdCharacter.init_class();
	sdEffect.init_class(); 
	sdGun.init_class(); // must be after sdEffect
	sdBlock.init_class();
	sdCrystal.init_class();
	sdBG.init_class();
	sdShop.init_class();
	sdChat.init_class();
	sdBullet.init_class();
	sdCom.init_class();
	sdAsteroid.init_class();
	sdVirus.init_class();
	sdTeleport.init_class();
	sdDoor.init_class();
	sdWater.init_class();
	sdWeather.init_class();
	sdTurret.init_class();
	sdMatterContainer.init_class();
	sdQuickie.init_class();
	sdOctopus.init_class();
	sdAntigravity.init_class();
	
	globalThis.sdCharacter = sdCharacter; // for console access
	globalThis.sdEntity = sdEntity;
	globalThis.sdGun = sdGun;
	globalThis.socket = socket;
	globalThis.sdRenderer = sdRenderer;
	globalThis.sdBullet = sdBullet;
	globalThis.sdWorld = sdWorld;
	globalThis.sdSound = sdSound;
	globalThis.sdWeather = sdWeather;
	

	globalThis.EnforceChangeLog = function EnforceChangeLog( mat, property_to_enforce, value_as_string=true )
	{
		console.log('Enforcing method applied');

		let enforced_prop = '_enfroce_' + property_to_enforce;
		mat[ enforced_prop ] = mat[ property_to_enforce ];

		mat[ property_to_enforce ] = null;

		Object.defineProperty( mat, property_to_enforce, 
		{
			get: function () { return mat[ enforced_prop ]; },
			set: function ( v ) { 

				if ( mat[ enforced_prop ] !== v )
				{
					if ( v === undefined )
					{
						throw new Error('undef set');
					}

					if ( value_as_string )
					console.warn( mat,'.'+property_to_enforce+' = '+v );
					else
					console.warn( mat,'.'+property_to_enforce+' = ',v );

					mat[ enforced_prop ] = v;
				}

			}
		});

		mat[ property_to_enforce+'_unenforce' ] = function()
		{
			Object.defineProperty( mat, property_to_enforce, 
			{
				get: function () { return mat[ enforced_prop ]; },
				set: function ( v ) { mat[ enforced_prop ] = v; }
			});
		};
	};
	globalThis.getStackTrace = ()=>
	{
		var obj = {};
		Error.captureStackTrace( obj, globalThis.getStackTrace );
		return obj.stack;
	};

	//socket.emit('SYNC', 'Random text');
	socket.on('connect', () =>
	{
		for ( var i = 0; i < sdEntity.entities.length; i++ )
		sdEntity.entities[ i ].remove();
	
		for ( var i = 0; i < sdEntity.global_entities.length; i++ )
		sdEntity.global_entities[ i ].remove();
	
		sdWorld.my_entity = null;
		sdWorld.my_entity_net_id = undefined;
		
		globalThis.connection_established = true;
	});
	socket.on('disconnect', () => 
	{
		globalThis.connection_established = false;
		
		if ( sdWorld.my_entity )
		{
			sdWorld.my_entity.Say( sdWorld.GetAny([
				'Connection has been lost... Can you believe that?',
				'No connection to server',
				'Connection to server has gone'
			]), true, true );
			
			setTimeout( ()=>{
				sdWorld.Stop();
			}, 4000 );
		}
		
		//alert('Connection was lost');
		
		
	});

	let old_snapshot_entities = [];
	socket.on( 'RES', ( snapshot )=>
	{
		let new_snapshot_entities = [];
		for ( var i = 0; i < snapshot.length; i++ )
		{
			new_snapshot_entities.push( sdEntity.GetObjectFromSnapshot( snapshot[ i ] ) );
		}
		
		for ( var i = 0; i < old_snapshot_entities.length; i++ )
		{
			if ( new_snapshot_entities.indexOf( old_snapshot_entities[ i ] ) === -1 )
			{
				if ( !old_snapshot_entities[ i ].is_static ) // Keep statics
				old_snapshot_entities[ i ].remove();
			}
		}
		old_snapshot_entities = new_snapshot_entities;
		
		if ( sdWorld.my_entity === null || sdWorld.my_entity_net_id !== sdWorld.my_entity._net_id )
		sdWorld.ResolveMyEntityByNetId();
	});
	
	
	socket.on( 'SERVICE_MESSAGE', ( v )=>
	{
		sdRenderer.service_mesage_until = sdWorld.time + 5000;
		sdRenderer.service_mesage = v;
	});
	
	socket.on( 'SCORE', ( v )=>
	{
		sdWorld.my_score = v;
	});
	socket.on( 'LEADERS', ( arr )=>
	{
		sdWorld.leaders = arr[ 0 ];
		globalThis.players_playing = arr[ 1 ];
	});
	socket.on( 'SET sdWorld.my_entity', ( _net_id )=>
	{
		sdWorld.my_entity_net_id = _net_id;
		
		sdWorld.ResolveMyEntityByNetId();
	});
	socket.on( 'SET sdShop.options', ( arr )=>
	{
		sdShop.options = arr;
	});	
	socket.on( 'ONLINE', ( arr )=>
	{
		globalThis.players_online = arr[ 0 ];
		globalThis.players_playing = arr[ 1 ];
	});	
	socket.on( 'UPGRADE_SET', ( arr )=>
	{
		if ( sdWorld.my_entity )
		{
			sdWorld.my_entity._upgrade_counters[ arr[ 0 ] ] = arr[ 1 ];
			
			sdShop.upgrades[ arr[ 0 ] ].action( sdWorld.my_entity, arr[ 1 ] );
		}
	});	
	socket.on( 'EFF', ( params )=> // particles
	{
		var ef = new sdEffect( params );
		sdEntity.entities.push( ef );
	});
	socket.on( 'S', ( params )=> // particles
	{
		params._server_allowed = true;
		sdSound.PlaySound( params );
	});
	socket.on( 'C', ( arr )=> // Position correction was rejected
	{
		if ( sdWorld.my_entity )
		{
			sdWorld.my_entity.x = arr[ 0 ];
			sdWorld.my_entity.y = arr[ 1 ];
			sdWorld.my_entity.sx = arr[ 2 ];
			sdWorld.my_entity.sy = arr[ 3 ];
			
			//sdRenderer.service_mesage_until = sdWorld.time + 3000;
			//sdRenderer.service_mesage = 'Got position correction rejection ('+sdWorld.time+')';
		}
	});
	
	/*setInterval( ()=>
	{
		sdWorld.HandleWorldLogic();
		
		sdRenderer.Render();
		
	}, sdWorld.logic_rate );*/

	socket.last_sync = sdWorld.time;
	const logic = ()=>
	{
		try
		{
			sdWorld.HandleWorldLogic();

			if ( sdWorld.time > socket.last_sync + sdWorld.max_update_rate )
			{
				socket.last_sync = sdWorld.time;

				if ( sdWorld.my_entity )
				socket.volatile.emit( 'M', [ sdWorld.my_entity.look_x, sdWorld.my_entity.look_y, sdWorld.camera.x, sdWorld.camera.y, sdWorld.camera.scale, sdWorld.my_entity.x, sdWorld.my_entity.y, ( sdWorld.my_entity.stands && sdWorld.my_entity._stands_on ) ? sdWorld.my_entity._stands_on._net_id : -1 ] );
			}

			sdRenderer.Render();
		}
		catch( e )
		{
			sdRenderer.service_mesage_until = sdWorld.time + 5000;
			sdRenderer.service_mesage = 'Game/render logic error! ' + e;
			debugger;
		}
		
		window.requestAnimationFrame( logic );
	};
	window.requestAnimationFrame( logic );

	let key_states = new sdKeyStates();
	sdWorld.my_key_states = key_states;
	
	window.onkeydown = ( e )=>
	{
		if ( sdShop.open )
		{
			if ( e.key === 'BrowserBack' )
			{
				sdShop.current_category = 'root';
				e.preventDefault();
				return false;
			}
		}
		
		if ( sdChat.KeyDown( e ) )
		return;
	
		if ( key_states.GetKey( e.code ) !== 1 )
		{
			key_states.SetKey( e.code, 1 );
			socket.emit( 'K1', e.code );
		}
		
		if ( e.code === 'Escape' || e.code === 'Space' || e.code === 'KeyR' )
		{
			if ( sdWorld.my_entity === null || sdWorld.my_entity.hea <= 0 || sdWorld.my_entity._is_being_removed )
			if ( sdRenderer.canvas.style.display === 'block' )
			{
				if ( e.code === 'Escape' )
				sdWorld.Stop();
			
				if ( e.code === 'Space' || e.code === 'KeyR' )
				sdWorld.Start( globalThis.GetPlayerSettings() );
			}
		}
	};
	window.onkeypress = ( e )=>
	{
		sdChat.KeyPress( e );
	};
	window.onkeyup = ( e )=>
	{
		if ( sdChat.KeyUp( e ) )
		{
			// Let release keys when chatting
		}
	
		if ( key_states.GetKey( e.code ) !== 0 )
		{
			key_states.SetKey( e.code, 0 );
			socket.emit( 'K0', e.code );
		}
	};
	window.onmousemove = ( e )=>
	{
		if ( sdWorld.mobile )
		return;
	
		//if ( sdWorld.my_entity )
		//{
			sdWorld.mouse_screen_x = e.clientX;
			sdWorld.mouse_screen_y = e.clientY;
		//}
	};
	window.onmousedown = ( e )=>
	{
		if ( sdRenderer.canvas.style.display !== 'block' )
		return;
		
		//sdSound.allowed = true;
		sdSound.AllowSound();
		
		if ( sdContextMenu.MouseDown( e ) )
		return;
	
		if ( sdShop.MouseDown( e ) )
		return;
	
		if ( sdWorld.mobile )
		return;
		
		let code = 'Mouse' + e.which;
		key_states.SetKey( code, 1 );
		
		socket.emit( 'K1', code );
		
		e.preventDefault();
	};
	window.onmouseup = ( e )=>
	{
		if ( sdRenderer.canvas.style.display !== 'block' )
		return;
	
		if ( sdWorld.mobile )
		return;

		let code = 'Mouse' + e.which;
		key_states.SetKey( code, 0 );
		
		socket.emit( 'K0', code );
		
		e.preventDefault();
	};
	window.oncontextmenu = (e)=>{
		
		if ( sdRenderer.canvas.style.display !== 'block' )
		return;
	
		e.preventDefault();
	};
	window.onmousewheel = (e)=>
	{
		if ( sdRenderer.canvas.style.display !== 'block' )
		return;
	
		sdShop.MouseWheel( e );
	};