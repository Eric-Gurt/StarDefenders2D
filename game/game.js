
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
	import sdCube from './entities/sdCube.js';
	import sdLamp from './entities/sdLamp.js';
	import sdCommandCentre from './entities/sdCommandCentre.js';
	import sdBomb from './entities/sdBomb.js';


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
	sdCube.init_class();
	sdLamp.init_class();
	sdCommandCentre.init_class();
	sdBomb.init_class();
	
	globalThis.sdCharacter = sdCharacter; // for console access
	globalThis.sdEntity = sdEntity;
	globalThis.sdGun = sdGun;
	globalThis.socket = socket;
	globalThis.sdRenderer = sdRenderer;
	globalThis.sdBullet = sdBullet;
	globalThis.sdWorld = sdWorld;
	globalThis.sdSound = sdSound;
	globalThis.sdWeather = sdWeather;
	

let enf_once = true;
	globalThis.EnforceChangeLog = function EnforceChangeLog( mat, property_to_enforce, value_as_string=true )
	{
		if ( enf_once )
		{
			enf_once = false;
			console.warn('Enforcing method applied');
		}

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
			let old_val = mat[ property_to_enforce ];
			
			delete mat[ property_to_enforce ];
			
			mat[ property_to_enforce ] = old_val;
			/*
			Object.defineProperty( mat, property_to_enforce, 
			{
				get: function () { return mat[ enforced_prop ]; },
				set: function ( v ) { mat[ enforced_prop ] = v; }
			});*/
		};
	};
	globalThis.getStackTrace = ()=>
	{
		var obj = {};
		Error.captureStackTrace( obj, globalThis.getStackTrace );
		return obj.stack;
	};
	
	let sd_events = [];

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
	/*socket.on( 'RES', ( snapshot )=>
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
	*/
	socket.on( 'RESv2', ( stuff_arr )=>
	{
		let snapshot = stuff_arr[ 0 ];
		let score = stuff_arr[ 1 ];
		let leaders = stuff_arr[ 2 ];
		let sd_events = stuff_arr[ 3 ];
		
		let _force_add_sx = stuff_arr[ 4 ];
		let _force_add_sy = stuff_arr[ 5 ];
		let _position_velocity_forced_until = sdWorld.time + ( stuff_arr[ 6 ] || -1 );
		
		// snapshot
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
		}
		
		// score
		sdWorld.my_score = score;
		
		// leaders
		if ( leaders )
		{
			sdWorld.leaders = leaders[ 0 ];
			globalThis.players_playing = leaders[ 1 ];
		}
		
		// sd_events
		for ( var i = 0; i < sd_events.length; i++ )
		{
			var type = sd_events[ i ][ 0 ];
			var params = sd_events[ i ][ 1 ];
			
			if ( type === 'EFF' ) // particles
			{
				var ef = new sdEffect( params );
				sdEntity.entities.push( ef );
			}
			else
			if ( type === 'S' ) // sound
			{
				params._server_allowed = true;
				sdSound.PlaySound( params );
			}
			else
			if ( type === 'ONLINE' ) // update online stats (in-game only)
			{
				globalThis.players_online = params[ 0 ];
				globalThis.players_playing = params[ 1 ];
			}
			else
			if ( type === 'C' ) // position correction failed
			{
				if ( sdWorld.my_entity )
				{
					sdWorld.my_entity.x = params[ 0 ];
					sdWorld.my_entity.y = params[ 1 ];
					sdWorld.my_entity.sx = params[ 2 ];
					sdWorld.my_entity.sy = params[ 3 ];
				}
			}
			else
			debugger;
		}
		
		// server-side velocity changes
		sdWorld.my_entity.sx += _force_add_sx;
		sdWorld.my_entity.sy += _force_add_sy;
		sdWorld.my_entity._position_velocity_forced_until = _position_velocity_forced_until;
	});
	
	
	socket.on( 'SERVICE_MESSAGE', ( v )=>
	{
		sdRenderer.service_mesage_until = sdWorld.time + 5000;
		sdRenderer.service_mesage = v;
	});
	
	/*socket.on( 'SCORE', ( v )=>
	{
		sdWorld.my_score = v;
	});*/
	/*socket.on( 'LEADERS', ( arr )=>
	{
		sdWorld.leaders = arr[ 0 ];
		globalThis.players_playing = arr[ 1 ];
	});*/
	socket.on( 'SET sdWorld.my_entity', ( _net_id )=>
	{
		sdWorld.my_entity_net_id = _net_id;
		
		try 
		{
			localStorage.setItem( 'my_net_id', _net_id );
		} catch(e){}
		
		sdWorld.ResolveMyEntityByNetId();
	});
	socket.on( 'SET sdShop.options', ( arr )=>
	{
		sdShop.options = arr;
	});	
	socket.on( 'ONLINE', ( arr )=> // Character customization screen -only
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
	/*socket.on( 'EFF', ( params )=> // particles
	{
		var ef = new sdEffect( params );
		sdEntity.entities.push( ef );
	});
	socket.on( 'S', ( params )=> // sound
	{
		params._server_allowed = true;
		sdSound.PlaySound( params );
	});*/
	/*socket.on( 'C', ( arr )=> // Position correction was rejected
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
	});*/
	
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
			
				if ( sd_events.length > 0 )
				{
					if ( sd_events.length > 32 )
					{
						socket.emit( 'Kv2', sd_events.slice( 0, 32 ) );
						sd_events = sd_events.slice( 32 );
						console.log('Too many events to server are being sent (' + sd_events.length + ') - this might cause input delay on server-side');
					}
					else
					{
						socket.emit( 'Kv2', sd_events );
						sd_events.length = 0;
					}
				}
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
	
	const KeyCodeRemap = {
		ArrowUp: 'KeyW',
		ArrowDown: 'KeyS',
		ArrowLeft: 'KeyA',
		ArrowRight: 'KeyD',
	};
	
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
	
		let code = e.code;
		
		if ( KeyCodeRemap[ code ] )
		code = KeyCodeRemap[ code ];
		
		if ( key_states.GetKey( code ) !== 1 )
		{
			key_states.SetKey( code, 1 );
			
			//socket.emit( 'K1', code );
			sd_events.push( [ 'K1', code ] );
		}
		
		if ( code === 'Escape' || code === 'Space' || ( code === 'KeyR' && sdWorld.mobile ) )
		{
			if ( sdWorld.my_entity === null || sdWorld.my_entity.hea <= 0 || sdWorld.my_entity._is_being_removed )
			if ( sdRenderer.canvas.style.display === 'block' )
			{
				if ( code === 'Escape' )
				sdWorld.Stop();
			
				if ( code === 'Space' || code === 'KeyR' )
				sdWorld.Start( globalThis.GetPlayerSettings(), true );
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
	
		let code = e.code;
		
		if ( KeyCodeRemap[ code ] )
		code = KeyCodeRemap[ code ];
	
		if ( key_states.GetKey( code ) !== 0 )
		{
			key_states.SetKey( code, 0 );
			
			//socket.emit( 'K0', code );
			sd_events.push( [ 'K0', code ] );
			
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
		if ( sdWorld.mobile )
		{
			sdSound.AllowSound();
			sdWorld.GoFullscreen();
		}
		
		if ( sdRenderer.canvas.style.display !== 'block' )
		return;
		
		//sdSound.allowed = true;
		sdSound.AllowSound();
		
		if ( sdContextMenu.MouseDown( e ) )
		return;
	
		if ( sdShop.MouseDown( e ) )
		return;
	
		if ( sdWorld.mobile )
		{
			e.preventDefault();
			return;
		}
		
		let code = 'Mouse' + e.which;
		key_states.SetKey( code, 1 );
		
		//socket.emit( 'K1', code );
		sd_events.push( [ 'K1', code ] );
		
		e.preventDefault();
	};
	window.onmouseup = ( e )=>
	{
		if ( sdRenderer.canvas.style.display !== 'block' )
		return;
	
		if ( sdWorld.mobile )
		{
			e.preventDefault();
			return;
		}

		let code = 'Mouse' + e.which;
		key_states.SetKey( code, 0 );
		
		//socket.emit( 'K0', code );
		sd_events.push( [ 'K0', code ] );
		
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