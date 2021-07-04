
    /* global globalThis */

meSpeak.loadVoice("voices/en/en.json");
	
	// socket.io-specific
	var socket = io( '/', {
		
		transports: [ 'websocket' ]
		
	} );

	// geckos-specific
	
	/*const geckos_start_options = {
		port: 3000,
		authorization: 'Hi, Star Defenders 2D server!'
	};
	
	let socket = geckos( geckos_start_options );*/

	import FakeCanvasContext from './libs/FakeCanvasContext.js';
	globalThis.FakeCanvasContext = FakeCanvasContext;

	import sdRenderer from './client/sdRenderer.js';
	import sdShop from './client/sdShop.js';
	import sdChat from './client/sdChat.js';
	import sdContextMenu from './client/sdContextMenu.js';
	import LZW from './server/LZW.js';
	import LZUTF8 from './server/LZUTF8.js';
	import sdSnapPack from './server/sdSnapPack.js';

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
	import sdMatterAmplifier from './entities/sdMatterAmplifier.js';
	import sdQuickie from './entities/sdQuickie.js';
	import sdOctopus from './entities/sdOctopus.js';
	import sdAntigravity from './entities/sdAntigravity.js';
	import sdCube from './entities/sdCube.js';
	import sdLamp from './entities/sdLamp.js';
	import sdCommandCentre from './entities/sdCommandCentre.js';
	import sdBomb from './entities/sdBomb.js';
	import sdHover from './entities/sdHover.js';
	import sdStorage from './entities/sdStorage.js';
	import sdAsp from './entities/sdAsp.js';
	import sdSandWorm from './entities/sdSandWorm.js';
	import sdGrass from './entities/sdGrass.js';
	import sdSlug from './entities/sdSlug.js';
	import sdBarrel from './entities/sdBarrel.js';
	import sdEnemyMech from './entities/sdEnemyMech.js';
	import sdArea from './entities/sdArea.js';
	import sdCrystalCombiner from './entities/sdCrystalCombiner.js';
	import sdUpgradeStation from './entities/sdUpgradeStation.js';
	import sdJunk from './entities/sdJunk.js';
	import sdBadDog from './entities/sdBadDog.js';
	import sdShark from './entities/sdShark.js';
	import sdWorkbench from './entities/sdWorkbench.js';
	import sdRescueTeleport from './entities/sdRescueTeleport.js';
	import sdRift from './entities/sdRift.js';
	import sdDrone from './entities/sdDrone.js';
	import sdLifeBox from './entities/sdLifeBox.js';
	import sdLost from './entities/sdLost.js';
	import sdCable from './entities/sdCable.js';
	import sdCharacterRagdoll from './entities/sdCharacterRagdoll.js';
	import sdNode from './entities/sdNode.js';
	import sdSpider from './entities/sdSpider.js';

	sdWorld.init_class();
	sdRenderer.init_class();
	LZW.init_class();
	
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
	sdMatterAmplifier.init_class();
	sdQuickie.init_class();
	sdOctopus.init_class();
	sdAntigravity.init_class();
	sdCube.init_class();
	sdLamp.init_class();
	sdCommandCentre.init_class();
	sdBomb.init_class();
	sdHover.init_class();
	sdStorage.init_class();
	sdAsp.init_class();
	sdSandWorm.init_class();
	sdGrass.init_class();
	sdSlug.init_class();
	sdBarrel.init_class();
	sdEnemyMech.init_class();
	sdArea.init_class();
	sdCrystalCombiner.init_class();
	sdUpgradeStation.init_class();
	sdJunk.init_class();
	sdBadDog.init_class();
	sdShark.init_class();
	sdWorkbench.init_class();
	sdRescueTeleport.init_class();
	sdRift.init_class();
	sdDrone.init_class();
	sdLifeBox.init_class();
	sdLost.init_class();
	sdCable.init_class();
	sdCharacterRagdoll.init_class();
	sdNode.init_class();
	sdSpider.init_class();

	globalThis.sdCharacter = sdCharacter; // for console access
	globalThis.sdEntity = sdEntity;
	globalThis.sdGun = sdGun;
	globalThis.socket = socket;
	globalThis.sdRenderer = sdRenderer;
	globalThis.sdBullet = sdBullet;
	globalThis.sdWorld = sdWorld;
	globalThis.sdSound = sdSound;
	globalThis.sdWeather = sdWeather;
	globalThis.sdShop = sdShop;
	globalThis.sdContextMenu = sdContextMenu;
	globalThis.LZW = LZW;
	
	sdWorld.FinalizeClasses();

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
		try
		{
			Error.captureStackTrace( obj, globalThis.getStackTrace ); // Webkit
			return obj.stack;
		}
		catch ( e )
		{
			return ( new Error ).stack; // Firefox
		}
	};
	
	let sd_events = [];

	
	const SOCKET_IO_MODE = ( typeof geckos === 'undefined' ); // In else case geckos.io

	globalThis.connection_established = false;
	globalThis.connection_started = false;

	if ( !SOCKET_IO_MODE )
	{
		// Reconnect?
		setInterval( ()=>
		{
			if ( !globalThis.connection_established )
			if ( !globalThis.connection_started )
			{
				socket.close();

				socket = geckos( geckos_start_options );
				SpawnConnection();
			}
		}, 2000 );
	}
	globalThis.SpawnConnection = SpawnConnection;
	SpawnConnection();

	let messages_to_report_arrival = [];

	function SpawnConnection()
	{
		globalThis.connection_started = true;
		
		if ( !SOCKET_IO_MODE )
		{
			const old_on = socket.on;
			socket.on = ( event, action )=>
			{
				if ( event === 'disconnect' )
				socket.onDisconnect( action );
				else
				if ( event === 'connect' )
				socket.onConnect( action );
				else
				old_on.call( socket, event, action );
			};

			socket.compress = ( b )=>{ return socket; };

			socket.volatile = socket;
		}

		socket.on('connect', () =>
		//socket.onConnect( error =>
		{
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			{
				sdEntity.entities[ i ].remove();
				sdEntity.entities[ i ]._broken = false;
			}

			for ( var i = 0; i < sdEntity.global_entities.length; i++ )
			{
				sdEntity.global_entities[ i ].remove();
			}

			sdWorld.my_entity = null;
			sdWorld.my_entity_net_id = undefined;

			globalThis.connection_established = true;

			//debugger;
			/*window.onbeforeunload = ()=>
			{
				socket.close();
			};*/
		});

		socket.on('disconnect', () => 
		//socket.onDisconnect( ()=>
		{
			globalThis.connection_established = false;
			globalThis.connection_started = false;

			if ( sdWorld.my_entity )
			{
				sdWorld.my_entity.Say( sdWorld.GetAny([
					'Connection has been lost... Can you believe that?',
					'No connection to server',
					'Connection to server has gone'
				]), true, true );
				
				setTimeout( ()=>{
					
					//if ( !globalThis.connection_established )
					sdWorld.Stop();
				
				}, 4000 );
			}

			//alert('Connection was lost');

			if ( !globalThis.reconnecter )
			{
				globalThis.reconnecter = setInterval( ()=>
				{
					if ( socket.connected )
					{
						clearInterval( globalThis.reconnecter );
						globalThis.reconnecter = null;
					}
					else
					socket.connect();

				}, 1000 );
			}
			
		});

		let old_snapshot_entities = [];
		
		let played_events = [];
		let assumptions_event_types = {};

		socket.on( 'RESv2', ( stuff_arr )=>
		{
			if ( !SOCKET_IO_MODE )
			stuff_arr = JSON.parse( LZW.lzw_decode( stuff_arr ) );
			
			
			let snapshot = sdSnapPack.Decompress( stuff_arr[ 0 ] );
			let score = stuff_arr[ 1 ];
			let leaders = JSON.parse( LZW.lzw_decode( stuff_arr[ 2 ] ) );
			let sd_events = JSON.parse( LZW.lzw_decode( stuff_arr[ 3 ] ) );

			let _force_add_sx = stuff_arr[ 4 ];
			let _force_add_sy = stuff_arr[ 5 ];
			let _position_velocity_forced_until = sdWorld.time + ( stuff_arr[ 6 ] || -1 );

			if ( ( stuff_arr[ 7 ] || 0 ) > 32 )
			{
				sdWorld.last_frame_time = stuff_arr[ 7 ] || 0;
				sdWorld.last_slowest_class = stuff_arr[ 8 ] || '';
			}
			
			let message_id_to_report = ( stuff_arr[ 9 ] === undefined ) ? -1 : stuff_arr[ 9 ];
			
			if ( message_id_to_report !== -1 )
			messages_to_report_arrival.push( message_id_to_report );

			// snapshot
			sdWorld.unresolved_entity_pointers = [];
			{
				let new_snapshot_entities = [];
				for ( var i = 0; i < snapshot.length; i++ )
				{
					let ent = sdEntity.GetObjectFromSnapshot( snapshot[ i ] );
					
					if ( ent )
					new_snapshot_entities.push( ent );
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
			sdWorld.SolveUnresolvedEntityPointers();
			sdWorld.unresolved_entity_pointers = null;

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
				
				if ( params.UC === undefined )
				{
					if ( typeof assumptions_event_types[ type ] === 'undefined' )
					{
						assumptions_event_types[ type ] = true;
						console.log('Client is assuming that sd_event of type "' + type + '" is not important and does not requires data to be resent on loss. Example: ', params );
					}
				}
				else
				{

					if ( played_events.indexOf( params.UC ) !== -1 )
					continue;

					if ( played_events.length > 100 ) // Not best solution, better solution would be to keep time of each event and remove it after 5000 - 10000 ms
					played_events.pop();

					played_events.unshift( params.UC );
				}

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
			if ( sdWorld.my_entity )
			{
				sdWorld.my_entity.sx += _force_add_sx;
				sdWorld.my_entity.sy += _force_add_sy;
				sdWorld.my_entity._position_velocity_forced_until = _position_velocity_forced_until;
			}
			
			if ( sdWorld.time < Date.now() - 5000 ) // Socket data received but world logic timer is not working (happens and can cause active entity flood). Problem is entity removal won't happen without world timer
			{
				//debugger;
				sdWorld.HandleWorldLogic();
			}
		});


		socket.on( 'SERVICE_MESSAGE', ( v )=>
		{
			sdRenderer.service_mesage_until = sdWorld.time + 6500;
			sdRenderer.service_mesage = v;
		});

		socket.on( 'SET sdWorld.my_entity._god', ( v )=>
		{
			if ( sdWorld.my_entity )
			sdWorld.my_entity._god = v;
		});
		socket.on( 'SET sdWorld.my_entity', ( _net_id )=>
		{
			sdWorld.my_entity_net_id = _net_id;

			try 
			{
				localStorage.setItem( 'my_net_id', _net_id );
			} catch(e){}

			sdWorld.ResolveMyEntityByNetId();
		});
		
		socket.on( 'REMOVE sdWorld.my_entity', ( _net_id )=>
		{
			if ( sdWorld.my_entity )
			if ( sdWorld.my_entity._net_id === _net_id )
			sdWorld.my_entity.remove();
		});
		socket.on( 'SET sdShop.options', ( arr )=>
		{
			sdShop.options = JSON.parse( LZW.lzw_decode( arr ) );
		});	
		socket.on( 'ONLINE', ( arr )=> // Character customization screen -only
		{
			globalThis.players_online = arr[ 0 ];
			globalThis.players_playing = arr[ 1 ];
		});
		socket.on( 'INIT', ( obj )=>
		{
			document.getElementById( 'game_title_text' ).textContent = obj.game_title;
			document.body.style.backgroundColor = obj.backgroundColor;
		});
		socket.on( 'UPGRADE_SET', ( arr )=>
		{
			if ( sdWorld.my_entity )
			{
				// Same at sdWorld.ResolveMyEntityByNetId()
				sdWorld.my_entity._upgrade_counters[ arr[ 0 ] ] = arr[ 1 ];
				sdShop.upgrades[ arr[ 0 ] ].action( sdWorld.my_entity, arr[ 1 ] );
			}
			else
			{
				// Delay
				if ( !sdWorld.my_entity_upgrades_later_set_obj )
				sdWorld.my_entity_upgrades_later_set_obj = {};
			
				sdWorld.my_entity_upgrades_later_set_obj[ arr[ 0 ] ] = arr[ 1 ];
			}
		});	



		socket.last_sync = sdWorld.time;

		socket.max_update_rate = SOCKET_IO_MODE ? sdWorld.max_update_rate : 16;
	}
	
	let last_sent_snapshot = [];
	
	const logic = ()=>
	{
		try
		{
			sdWorld.HandleWorldLogic();

			const isTransportWritable = socket.io.engine &&
										socket.io.engine.transport &&
										socket.io.engine.transport.writable;

			if ( sdWorld.time > socket.last_sync + socket.max_update_rate )
			if ( isTransportWritable )
			{
				socket.last_sync = sdWorld.time;

				if ( sdWorld.my_entity )
				if ( !sdWorld.my_entity._is_being_removed )
				{
					let new_snapshot = [ 
						Math.round( sdWorld.my_entity.look_x ), // 0
						Math.round( sdWorld.my_entity.look_y ), // 1
						Math.round( sdWorld.camera.x ), // 2
						Math.round( sdWorld.camera.y ), // 3
						sdWorld.camera.scale, // 4
						Math.round( sdWorld.my_entity.x * 100 ) / 100, // 5
						Math.round( sdWorld.my_entity.y * 100 ) / 100, // 6
						( sdWorld.my_entity.stands && sdWorld.my_entity._stands_on ) ? sdWorld.my_entity._stands_on._net_id : -1, // 7
						messages_to_report_arrival // 8
					];
					
					let will_send = ( messages_to_report_arrival.length > 0 ); // Hopefully it will help to prevent high message rate when server can't handle them in time?
					/*
					if ( !will_send )
					{
						for ( let i = 0; i < new_snapshot.length; i++ )
						{
							if ( typeof new_snapshot[ i ] === 'number' )
							{
								if ( new_snapshot[ i ] !== last_sent_snapshot[ i ] )
								{
									will_send = true;
									break;
								}
							}
							else
							{
								if ( new_snapshot[ i ] === messages_to_report_arrival )
								{
								}
								else
								{
									debugger; // How to analyze this client-to-server snapshot element in order to minimize sent data?
								}
							}
						}
					}*/
					
					if ( will_send )
					{
						socket.volatile.emit( 'M', new_snapshot );
						//ssetTimeout(()=>{ // Hack
						//	socket.volatile.emit( 'M', new_snapshot );
						//},100);

						last_sent_snapshot = new_snapshot;

						messages_to_report_arrival = [];
					}
				}
			
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
		ArrowRight: 'KeyD'
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
	
		if ( code === 'Tab' )
		if ( sdWorld.my_entity )
		{
			sdRenderer.show_leader_board = !sdRenderer.show_leader_board;
			e.preventDefault();
			return;
		}
		
		if ( code === 'KeyB' )
		{
			// Equip build tool, suggested by Maxteabag
			if ( sdWorld.my_entity )
			if ( sdWorld.my_entity.hea > 0 )
			if ( !sdWorld.my_entity._is_being_removed )
			if ( sdWorld.my_entity._inventory[ sdGun.classes[ sdGun.CLASS_BUILD_TOOL ].slot ] && 
			     sdWorld.my_entity._inventory[ sdGun.classes[ sdGun.CLASS_BUILD_TOOL ].slot ].class === sdGun.CLASS_BUILD_TOOL )
			{
				sd_events.push( [ 'K1', 'Digit9' ] );
				sd_events.push( [ 'K0', 'Digit9' ] );
				
				sdShop.open = true;
				//sdRenderer.UpdateCursor();
			}
		}
		else
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
			sdWorld.mouse_screen_x = e.clientX * sdRenderer.resolution_quality;
			sdWorld.mouse_screen_y = e.clientY * sdRenderer.resolution_quality;
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