/*

	Potentially this song could be added as a welcome tune whenever player joins server for the first time/empty server:
	https://samplefocus.com/users/first-name-last-name-af33092b-2f17-46f3-b312-a66932926d0a/samples (Chill Piano Chords)
	Currently used btw ^ I still have more cuts out of it - EG


	HandleWorldLogic

*/
/* global sdShop */

// sdShop is global on client-side

import sdEntity from './entities/sdEntity.js';
import sdGun from './entities/sdGun.js';
import sdEffect from './entities/sdEffect.js';
import sdCom from './entities/sdCom.js';
import sdBullet from './entities/sdBullet.js';
import sdWeather from './entities/sdWeather.js';
import sdBlock from './entities/sdBlock.js';
import sdDoor from './entities/sdDoor.js';
import sdBG from './entities/sdBG.js';
import sdWater from './entities/sdWater.js';
import sdCharacter from './entities/sdCharacter.js';
import sdGrass from './entities/sdGrass.js';
import sdShark from './entities/sdShark.js';
import sdSandWorm from './entities/sdSandWorm.js';
import sdCable from './entities/sdCable.js';
import sdArea from './entities/sdArea.js';
import sdPlayerDrone from './entities/sdPlayerDrone.js';
import sdQuadro from './entities/sdQuadro.js';
import sdStatusEffect from './entities/sdStatusEffect.js';
import sdPlayerOverlord from './entities/sdPlayerOverlord.js';
import sdBloodDecal from './entities/sdBloodDecal.js';
import sdGib from './entities/sdGib.js';
import sdTimer from './entities/sdTimer.js';
import sdCrystal from './entities/sdCrystal.js';
import sdRescueTeleport from './entities/sdRescueTeleport.js';
import sdCharacterRagdoll from './entities/sdCharacterRagdoll.js';
import sdPlayerSpectator from './entities/sdPlayerSpectator.js';
import sdBaseShieldingUnit from './entities/sdBaseShieldingUnit.js';
import sdDeepSleep from './entities/sdDeepSleep.js';
import sdCommandCentre from './entities/sdCommandCentre.js';
import sdPresetEditor from './entities/sdPresetEditor.js';


import sdRenderer from './client/sdRenderer.js';
import { sdServerConfigShort, sdServerConfigFull } from './server/sdServerConfig.js';
import sdBitmap from './client/sdBitmap.js';
import sdSound from './sdSound.js';
import sdKeyStates from './sdKeyStates.js';

const CHUNK_SIZE = 64; // 128 causes groups of 111 or so entities, it is probably too much // 32

class sdWorld
{
	static init_class()
	{
		console.log('sdWorld class initiated');
		sdWorld.logic_rate = 16; // for server
		
		sdWorld.CHUNK_SIZE = CHUNK_SIZE;
		
		sdWorld.startup_hash = Math.floor( Math.random() * 9007199254740991 ); // Used to detect server restarts by notifier
		
		//sdWorld.max_update_rate = 64;
		sdWorld.max_update_rate = 75; // For weaker servers (more like bandwidth-limited)
		
		sdWorld.allowed_player_classes = [ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdPlayerSpectator' ]; // Options to spawn as
		
		sdWorld.server_config = {};
		
		sdWorld.time = Date.now(); // Can be important because some entities (sdCommandCentre) use sdWorld.time as default destruction time, which will be instantly without setting this value
		sdWorld.frame = 0;
		
		sdWorld.event_uid_counter = 0; // Will be used by clients to not re-apply same events
		
		sdWorld.static_think_methods = [];
		
		sdWorld.gravity = 0.3;
		
		sdWorld.entity_classes = {}; // Will be filled up later
		
		sdWorld.is_server = ( typeof window === 'undefined' );
		sdWorld.is_singleplayer = false; // Local offline mode has it as true
		sdWorld.mobile = false;
		
		sdWorld.soft_camera = true;
		sdWorld.show_videos = true;
		
		sdWorld.sockets = null; // Becomes array
		sdWorld.recent_players = []; // { pseudonym, last_known_net_id, my_hash, time, ban }, up to 100 connections or so
		//sdWorld.hook_entities = []; // Entities that implement hook logic, basically for notification system. These must have HandleHookReply( hook_id, password ) and return either JSON-able object or null
		
		sdWorld.online_characters = []; // Used for active entities update rate optimizations
		
		sdWorld.camera = {
			x:0,
			y:0,
			scale:1
		};
		
		sdWorld.mouse_speed_morph = 0; // Slow-down due to open context menu or shop, especially for fast camera
		
		sdWorld.last_frame_time = 0; // For lag reporting
		sdWorld.last_slowest_class = 'nothing';
		
		sdWorld.target_scale = 2; // Current one, this one depends on screen size
		sdWorld.default_zoom = 2;
		sdWorld.current_zoom = sdWorld.default_zoom; // Synced from server, for example when player is in vehicle or steering wheel
		
		
		sdWorld.my_key_states = null; // Will be assigned to active entity to allow client-side movement
		
		sdWorld.my_entity = null;
		sdWorld.my_entity_net_id = undefined; // Temporary place
		sdWorld.my_entity_protected_vars = { look_x:1, look_y:1, x:1, y:1, sx:1, sy:1, act_x:1, act_y:1, flying:1 }; // Client-side variables such as look_x will appear here
		sdWorld.my_entity_protected_vars_untils = { gun_slot: 0 }; // Whenever player presses some gun slot - it will also save there sdWord.time + ping * 2 for property to prevent it from being accepted by server. Will improve some client-side looks even if allow doing stuff player should not be able to do, locally only.
		sdWorld.my_score = 0;
		sdWorld.my_entity_upgrades_later_set_obj = null;
		
		sdWorld.client_side_censorship = false;
		
		//sdWorld.world_bounds = { x1: 0, y1: -400, x2: 800, y2: 0 };
		sdWorld.world_bounds = { 
			x1: 0, 
			y1: 0, 
			x2: 0, 
			y2: 0
		};
		sdWorld.base_ground_level1 = {};
		sdWorld.base_ground_level2 = {};
		sdWorld.base_grass_level = {};
		/*sdWorld.world_bounds = { 
			x1: 0, 
			y1: -2000, 
			x2: 800 * 10, 
			y2: 0
		};*/
		sdWorld.base_ground_level = 0;//-256;
		
		sdWorld.last_simulated_entity = null; // Used by sdDeepSleep debugging so far
		
		
		sdWorld.mouse_screen_x = 0;
		sdWorld.mouse_screen_y = 0;
		
		sdWorld.mouse_world_x = 0;
		sdWorld.mouse_world_y = 0;
		
		sdWorld.img_tile = sdWorld.CreateImageFromFile( 'bg' );
		sdWorld.img_sharp = sdWorld.CreateImageFromFile( 'sharp' );
		sdWorld.img_crosshair = sdWorld.CreateImageFromFile( 'crosshair' );
		sdWorld.img_crosshair_build = sdWorld.CreateImageFromFile( 'crosshair_build' );
		sdWorld.img_cursor = sdWorld.CreateImageFromFile( 'cursor' );
		
		
		//sdWorld.world_hash_positions = {};
		sdWorld.world_hash_positions = new Map();
		//sdWorld.world_hash_positions_recheck_keys = []; // Array for keys to slowly check and delete if they are empty (can happen as a result of requiring cells by world logic)
		sdWorld.world_hash_positions_recheck_keys = new Set(); // Set of keys to slowly check and delete if they are empty (can happen as a result of requiring cells by world logic)
		
		sdWorld.last_hit_entity = null;
		
		sdWorld.hovered_entity = null; // With cursor
		
		sdWorld.crystal_shard_value = 3;
		
		sdWorld.damage_to_matter = 0.025;
		//sdWorld.active_build_settings = { _class: 'sdBlock', width:16, height:16 }; // Changes every time some client tries to build something
		//sdWorld.active_build_settings = { _class: 'sdBlock', width:32, height:32 }; // Changes every time some client tries to build something
		
		sdWorld.leaders = [];
		sdWorld.leaders_global = [];
		
		sdWorld.outgoing_server_connections_obj = null;
		
		sdWorld.GSPEED = 0;
		
		//sdWorld.PerlinNoiseGenerator = new PerlinNoiseGenerator( 1337 );
		sdWorld.SeededRandomNumberGenerator = new SeededRandomNumberGenerator( ~~( Math.random() * 500000 ) );
		//sdWorld.SeededRandomNumberGenerator2 = new SeededRandomNumberGenerator( 612 );
		sdWorld.SeededRandomNumberGenerator_constructor = SeededRandomNumberGenerator;
		
		sdWorld.el_hit_cache = [];
		
		sdWorld.unresolved_entity_pointers = null; // Temporarily becomes array during backup loading just so cross pointer properties can be set (for example driver and vehicle)
		
		sdWorld.OFFSCREEN_BEHAVIOR_SIMULATE_PROPERLY = 0;
		sdWorld.OFFSCREEN_BEHAVIOR_SIMULATE_X_TIMES_SLOWER = 1;
		sdWorld.OFFSCREEN_BEHAVIOR_SIMULATE_X_STEPS_AT_ONCE = 2;
		sdWorld.offscreen_behavior = -3324; // Set later
		sdWorld.offscreen_behavior_x_value = 30; // Set later
		
		
		sdWorld.lost_images_cache = null; // Object // For sdLost entities
		// Could be expanded further to include flip_x etc, maybe also non-JSON format could be used to optimize even further
		sdWorld.draw_operation_command_match_table = [
			'sd_filter', 0,
			'drawImageFilterCache', 1,
			'save', 2,
			'restore', 3,
			'rotate', 4,
			'scale', 5,
			'translate', 6
		];
		sdWorld.draw_methods_per_command_id = {};
		sdWorld.draw_methods_output_ptr = null;
		sdWorld.draw_operation_no_parameters = {};
		sdWorld.draw_operation_no_parameters[ 2 ] = true;
		sdWorld.draw_operation_no_parameters[ 3 ] = true;
		
		
	
		sdWorld.reusable_closest_point = {
			x: 0,
			y: 0,
			SetV: ( v )=>{
				sdWorld.reusable_closest_point.x = v.x;
				sdWorld.reusable_closest_point.y = v.y;
			},
			Set: ( a, b )=>{
				sdWorld.reusable_closest_point.x = a;
				sdWorld.reusable_closest_point.y = b;
			}
		};

		sdWorld.fake_empty_array = { length:0 };
		Object.freeze( sdWorld.fake_empty_array );

		sdWorld.fake_empty_cell = new Cell( null );
		//Object.freeze( sdWorld.fake_empty_cell ); Bad because fake cell will be returned during snapshot generation for client - server has to mark empty cell as visited
		Object.freeze( sdWorld.fake_empty_cell.arr );
		/*
		if ( typeof document !== 'undefined' ) // If server
		document.ontouchstart = ()=>{ ForMobile(); };

		function ForMobile()
		{
			sdWorld.mobile = true;
			
			document.ontouchstart = start_handler;
			document.ontouchmove = move_handler;

			document.ontouchcancel = end_handler;
			document.ontouchend = end_handler;
			
			window.addEventListener('selectstart', function(e){ e.preventDefault(); });
			
			document.body.style.userSelect = 'none';

			var buttons = [];
			function RegisterButton( element_id, radius_mult, action_hold, action_release=null ) // action_hold( dx, dy, button_radius ) is called on tap and during move
			{
				if ( document.getElementById( element_id ) === null )
				alert('Button register error: ' + element_id );
				else
				buttons.push({ 
								element: document.getElementById( element_id ),
								radius_mult: radius_mult,
								action_hold: action_hold,
								action_release: action_release,
								touch_id: -1
							});
			}
			
			var move_x = 0;
			var move_y = 0;
			
			function HandleMoves()
			{
				if ( move_x > 0.5 )
				{
					window.onkeydown({ code:'KeyD' });
					window.onkeyup({ code:'KeyA' });
				}
				else
				if ( move_x < -0.5 )
				{
					window.onkeydown({ code:'KeyA' });
					window.onkeyup({ code:'KeyD' });
				}
				else
				{
					window.onkeyup({ code:'KeyA' });
					window.onkeyup({ code:'KeyD' });
				}
				
				
				if ( move_y > 0.5 )
				{
					window.onkeydown({ code:'KeyS' });
					window.onkeyup({ code:'KeyW' });
				}
				else
				if ( move_y < -0.5 )
				{
					window.onkeydown({ code:'KeyW' });
					window.onkeyup({ code:'KeyS' });
				}
				else
				{
					window.onkeyup({ code:'KeyW' });
					window.onkeyup({ code:'KeyS' });
				}
			}
			//setInterval( HandleMoves, 16 );
			
			function Tap( key )
			{
				window.onkeydown({ code:key });
				window.onkeyup({ code:key });
				
			}
			
			setTimeout( function()
			{
				document.getElementById('mobile_ui').style.display = 'block';
				
				let min_aim_radius = 32;
				
				sdWorld.mouse_screen_x = sdRenderer.screen_width / 2 + min_aim_radius;
				sdWorld.mouse_screen_y = sdRenderer.screen_height / 2;
			
				RegisterButton( 'mobile_move_button', 1.2, function( dx, dy, button_radius ){
					move_x = dx / button_radius * 1.5;
					move_y = dy / button_radius * 1.5;
					HandleMoves();
				}, function() {
					move_x = 0;
					move_y = 0;
					HandleMoves();
				});

				RegisterButton( 'mobile_shoot_button', 1.2, function( dx, dy, button_radius ){ 
					
					dx *= 2;
					dy *= 2;
					let di = sdWorld.Dist2D_Vector( dx,dy );
					if ( di < min_aim_radius )
					{
						dx = dx / di * min_aim_radius;
						dy = dy / di * min_aim_radius;
					}
					sdWorld.mouse_screen_x = sdRenderer.screen_width / 2 + dx;
					sdWorld.mouse_screen_y = sdRenderer.screen_height / 2 + dy;
					
					window.onkeydown({ code:'Mouse1' }); 
					
				}, function() { 
					
					window.onkeyup({ code:'Mouse1' }); 
				});

				//RegisterButton( 'mobile_jump_button', 1, function(){ sdWorld.hold_space = 1; }, function() { sdWorld.hold_space = 0; });
				//RegisterButton( 'mobile_zoom_button', 1, function(){ sdWorld.zoom_intensity_target = 0.5; }, function() { sdWorld.zoom_intensity_target = 1; });
				//RegisterButton( 'mobile_crouch_button', 1, function(){ sdWorld.hold_ctrl = 1; }, function() { sdWorld.hold_ctrl = 0; });
				RegisterButton( 'mobile_reload_button', 1, function(){ Tap('KeyR'); });
				RegisterButton( 'mobile_1_button', 1, function(){ Tap('Digit1'); });
				RegisterButton( 'mobile_2_button', 1, function(){ Tap('Digit2'); });
				RegisterButton( 'mobile_3_button', 1, function(){ Tap('Digit3'); });
				RegisterButton( 'mobile_4_button', 1, function(){ Tap('Digit4'); });
				RegisterButton( 'mobile_5_button', 1, function(){ Tap('Digit5'); });
				RegisterButton( 'mobile_x_button', 1, function(){ Tap('Digit9'); });
				RegisterButton( 'mobile_s_button', 1, function(){ Tap('Digit0'); });
				
			}, 100 );
			
			function start_handler( e )
			{
				if ( document.getElementById( 'mobile_ui' ).style.display === 'none' )
				return;
			
				//sdWorld.GoFullscreen();
				
				//screen.orientation.lock('landscape');
			
				for ( var i = 0; i < buttons.length; i++ )
				{
					var button_rect = buttons[ i ].element.getBoundingClientRect();
					var button_x = ( button_rect.right + button_rect.left ) / 2;
					var button_y = ( button_rect.top + button_rect.bottom ) / 2;
					var button_radius = ( button_rect.right - button_rect.left ) / 2;
					
					if ( sdWorld.Dist2D( e.changedTouches[ 0 ].pageX, e.changedTouches[ 0 ].pageY, button_x, button_y ) <= button_radius * buttons[ i ].radius_mult )
					{
						buttons[ i ].touch_id = e.changedTouches[ 0 ].identifier;
						buttons[ i ].action_hold( e.changedTouches[ 0 ].pageX - button_x, e.changedTouches[ 0 ].pageY - button_y, button_radius );
						
						buttons[ i ].element.style.backgroundColor = '#000000';
						
						//e.preventDefault();
						break;
					}
				}
				
				
				//globalThis.ModalTrace( e.target.tagName +'' );
				
				if ( e.target && e.target.tagName === 'CANVAS' )
				e.preventDefault();
			}

			function end_handler( e )
			{
				for ( var i = 0; i < buttons.length; i++ )
				{
					if ( e.changedTouches[ 0 ].identifier === buttons[ i ].touch_id )
					{
						buttons[ i ].touch_id = -1;
						if ( buttons[ i ].action_release !== null )
						buttons[ i ].action_release();
					
						buttons[ i ].element.style.backgroundColor = '#ffffff0d';
						
						//e.preventDefault();
						break;
					}
				}
				
				
				if ( e.target && e.target.tagName === 'CANVAS' )
				e.preventDefault();
			}

			function move_handler( e )
			{
				if ( document.getElementById( 'mobile_ui' ).style.display === 'none' )
				return;
			
				for ( var i = 0; i < buttons.length; i++ )
				{
					if ( buttons[ i ].touch_id === e.changedTouches[ 0 ].identifier )
					{
						var button_rect = buttons[ i ].element.getBoundingClientRect();
						var button_x = ( button_rect.right + button_rect.left ) / 2;
						var button_y = ( button_rect.top + button_rect.bottom ) / 2;
						var button_radius = ( button_rect.right - button_rect.left ) / 2;

						buttons[ i ].action_hold( e.changedTouches[ 0 ].pageX - button_x, e.changedTouches[ 0 ].pageY - button_y, button_radius );
						
						
						//e.preventDefault();
						break;
					}
				}
				
				
				if ( e.target && e.target.tagName === 'CANVAS' )
				e.preventDefault();
			}
		};*/
		
		sdWorld.server_url = null; // Will be guessed when first connected player tells it
		sdWorld.server_url_pending = null;
		sdWorld.server_url_pending_code = null;
		
		let say_delay = true;
		let sealing_classes = ()=>
		{
			if ( !sdWorld.fastest_method_improver_info || sdWorld.fastest_method_improver_info.size === 0 )
			{
				for ( let i in sdWorld.entity_classes )
				{
					Object.seal( sdWorld.entity_classes[ i ] );
					Object.seal( sdWorld.entity_classes[ i ].prototype );
				}
				
				if ( !say_delay )
				console.log( 'Classes & prototypes sealing done!' );
			}
			else
			{
				if ( say_delay )
				{
					say_delay = false;
					console.log( 'Delaying classes & prototypes sealing, pending ' + sdWorld.fastest_method_improver_info.size + ' fastest_method_improver_info items...' );
				}
				setTimeout( sealing_classes, 1000 );
			}
		};
		
		setTimeout( sealing_classes, 1000 );
	}
	static onAfterConfigLoad()
	{
		sdWorld.offscreen_behavior = sdWorld[ sdWorld.server_config.offscreen_behavior ];
		sdWorld.offscreen_behavior_x_value = sdWorld.server_config.offscreen_behavior_x_value;
	}
	static FinalizeClasses() // isC optimization, also needed for sealing
	{
		for ( let i in sdWorld.entity_classes )
		{
			let c = sdWorld.entity_classes[ i ];
			
			//trace( '_class === "'+c.prototype.constructor.name+'" for ',c );
			
			c._class = c.prototype.constructor.name;
			
		}
	}
	
	static PreventCharacterPropertySyncForAWhile( prop_name )
	{
		sdWorld.my_entity_protected_vars_untils[ prop_name ] = sdWorld.time + 550; // Worst case scenario
	}
	
	static CensoredText( t )
	{
		let p = '!@#%&*';
		let p2 = '';

		while ( p2.length < t.length )
		if ( t.charAt( p2.length ) === ' ' )
		p2 += ' ';
		else
		p2 += p.charAt( p2.length % p.length );

		return p2;
	}
	static ExcludeNullsAndRemovedEntitiesForArray( arr )
	{
		for ( let i = 0; i < arr.length; i++ )
		if ( arr[ i ] === null || arr[ i ]._is_being_removed )
		{
			arr.splice( i, 1 );
			i--;
			continue;
		}
		return arr;
	}
	static GoFullscreen()
	{
		
		try
		{
			
			//if ( !document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement) 
			//{
				if (document.documentElement.requestFullscreen) 
				{
					document.documentElement.requestFullscreen().then( s2 ).catch( s2 );
				} 
				/*else 
				if (document.documentElement.mozRequestFullScreen) 
				{
					document.documentElement.mozRequestFullScreen();
				} 
				else 
				if (document.documentElement.webkitRequestFullscreen) 
				{
					document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
				}*/
			//} 
			//else
			//{
			//}
		}
		catch( e )
		{
			console.warn( e );
			s2();
		}
	
		function s2()
		{
			try
			{
				if ( document.pointerLockElement !== sdRenderer.canvas )
				sdRenderer.canvas.requestPointerLock().then( s3 ).catch( s3 );
			}
			catch( e )
			{
				s3();
			}
		}

		function s3()
		{
			screen.orientation.lock('landscape').then( window.onresize ).catch( ()=>{} );
			
			window.onresize();
		}
	}
	
	
	/*static GetHighestScoreOfPlayingPlayers()
	{
		let c = 0;

		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character !== null )
		if ( sdWorld.sockets[ i ].character.hea > 0 )
		if ( !sdWorld.sockets[ i ].character._is_being_removed )
		{
			c = Math.max( sdWorld.sockets[ i ].character._score );
		}

		return c;
	}*/
	static GetPlayingPlayersCount( count_dead=false )
	{
		let c = 0;

		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character !== null )
		if ( count_dead || sdWorld.sockets[ i ].character.hea > 0 )
		if ( count_dead || !sdWorld.sockets[ i ].character._is_being_removed )
		if ( !sdWorld.sockets[ i ].character.is( sdPlayerSpectator ) )
		{
			c++;
		}

		return c;
	}
	static GetPlayingPlayersCountForGameLogicTest()
	{
		let c = 0;

		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character !== null )
		c++;

		return c;
	}
	static GetFinalGrassHeight( x )
	{
		let xx = Math.floor( x / 16 );
					
		const pow = 2; // Higher value causes higher variations to be more rare

		return Math.round( Math.pow( Math.sin( ( sdWorld.base_grass_level[ xx ] || 0 ) * 15 ) * 0.5 + 0.5, pow ) * 2 );

	}
	static GetGroundElevation( x )
	{
		let s = 0;
		let tot = 0;
		
		let r = 20;
		
		for ( var xx = -r; xx <= r; xx++ )
		{
			let influence = 1;// Math.pow( 1 + r - Math.abs( xx ), 0.1 );
			s += sdWorld.SeededRandomNumberGenerator.random( x + xx * 1, 512 ) * influence;
			tot += influence;
		}
		
		s /= tot;
		
		return sdWorld.base_ground_level - Math.round( ( s - 0.5 ) / 0.5 * 1024 / 8 ) * 8;
	}
	/*static GetGroundElevation( xx )
	{
		return sdWorld.base_ground_level - Math.round( ( 

				Math.sin( sdWorld.base_ground_level1[ xx ] ) * 64 + 
				Math.sin( sdWorld.base_ground_level2[ xx ] ) * 64

				- Math.abs( Math.sin( sdWorld.base_ground_level1[ xx ] * 0.9 ) ) / ( 0.1 + 0.9 * Math.abs( Math.cos( sdWorld.base_ground_level2[ xx ] * 0.5 ) ) ) * 16

				+ Math.abs( Math.sin( sdWorld.base_ground_level2[ xx ] * 0.9 ) ) / ( 0.1 + 0.9 * Math.abs( Math.cos( sdWorld.base_ground_level1[ xx ] * 0.8 ) ) ) * 128
				+ Math.abs( Math.sin( sdWorld.base_ground_level2[ xx ] * 0.9 ) ) / ( 0.1 + 0.9 * Math.abs( Math.cos( sdWorld.base_ground_level1[ xx ] * 0.55 ) ) ) * 128

		) / 8 ) * 8;
	}*/
	static AttemptWorldBlockSpawn( x, y, only_plantless_block=true )
	{
		let xx = Math.floor( x / 16 );
		let from_y = sdWorld.GetGroundElevation( xx );

		if ( y >= from_y )
		{
			let r = sdWorld.FillGroundQuad( x, y, from_y, false, only_plantless_block );

			//if ( r )
			//ClearPlants();

			return r;
		}
		else
		if ( y === from_y - 8 )
		{
			y += 8;
			let r = sdWorld.FillGroundQuad( x, y, from_y, true, only_plantless_block );

			//if ( r )
			//ClearPlants();

			return r;
		}
		else
		{
		}
		
		return null;
	}
	static FillGroundQuad( x, y, from_y, half=false, only_plantless_block=false )
	{
		var ent = null;
		
		var allow_block = true;
		var allow_water = true;
		var allow_lava = false;
		
		var s = 0;
		var s_tot = 0;
		
		var s2 = 0;
		var s2_tot = 0;
		
		var s3 = 0; // Used for random hitpoint variety
		var s3_tot = 0;
		
		var s4 = 0;
		var s4_tot = 0;
		
		var r = 10;
		var r_plus = r + 1;
		
		for ( var xx = -r; xx <= r; xx++ )
		for ( var yy = -r; yy <= r; yy++ )
		{
			if ( sdWorld.inDist2D_Boolean( xx, yy, 0, 0, r_plus ) )
			{
				s += sdWorld.SeededRandomNumberGenerator.random( x + xx * 8, y + yy * 8 );
				s_tot += 1;
				
				s2 += sdWorld.SeededRandomNumberGenerator.random( x + xx * 8 + 1024, y + yy * 8 - 1024 );
				s2_tot += 1;
				
				s3 += sdWorld.SeededRandomNumberGenerator.random( x + xx * 8 + 1024 * 2, y + yy * 8 - 1024 * 2 );
				s3_tot += 1;
				
				s4 += sdWorld.SeededRandomNumberGenerator.random( x + xx * 8 + 1024 * 3, y + yy * 8 - 1024 * 3 );
				s4_tot += 1;
			}
		}
		
		s /= s_tot;
		s2 /= s2_tot;
		s3 /= s3_tot;
		s4 /= s4_tot;
		
		if ( s < 0.49 - ( 1 + Math.sin( y / 100 ) ) * 0.001 )
		{
			allow_block = false;
			allow_water = false;
			
			//if ( y > 500 ) // What is it?
			{
				if ( s < 0.485 - ( 1 + Math.sin( y / 100 ) ) * 0.001 )
				{
					allow_water = true;
					
					allow_lava = ( s2 < 0.5 );
				}
			}
		}
		//debugger;
	
	
	
		let material = sdBlock.MATERIAL_GROUND;
		let f;// = 'hue-rotate('+( ~~sdWorld.mod( x / 16, 360 ) )+'deg)';
		let hp_mult = 1;
		
		if ( s3 < 0.5 - 0.005 )
		{
			material = sdBlock.MATERIAL_ROCK;
			hp_mult *= 1.5;
			//f = 'none';
		}
		else
		if ( s3 > 0.5 + 0.005 )
		{
			material = sdBlock.MATERIAL_SAND;
			hp_mult *= 0.5;
			//f = 'none';
		}
		
		/*if ( s4 < 0.495 )
		{
			//material = sdBlock.MATERIAL_SAND;
			hp_mult *= 0.5;
			//f = 'none';
			f = 'saturate(0)';
		}*/
		f = 'hue-rotate('+( ~~sdWorld.mod( x / 16 + ( s4 - 0.5 ) * 1000, 360 ) )+'deg)';

		if ( y > from_y + 256 )
		{
			hp_mult = 1 + Math.ceil( ( y - from_y - 256 ) / 200 * 3 ) / 3;
			//f += 'brightness(' + Math.max( 0.2, 1 / hp_mult ) + ') saturate(' + Math.max( 0.2, 1 / hp_mult ) + ')';
			f = 'brightness(0.5) saturate(0.2)';
		}
		
		
		

		if ( y >= from_y && allow_block )
		{
			//let enemy_rand_num = Math.random();
			let random_enemy = null;
			
			//if ( Math.random() < 0.2 )
			{
				// Format is [ type, relative probability ]
				let chances = ( hp_mult <= 1 ) ? 
					[ // Surface
						'sdBadDog', 2
					] 
					: 
					[ // Deep
						'sdSandWorm', 1.0,
						'sdOctopus', 1.5,
						'sdFaceCrab', 1.5,
						'sdTutel', 1.5,
						'sdWater.toxic', 1.0,
						'sdWater.lava', 0.5,
						'sdWater.acid', 1.0,
						'sdDrone.DRONE_CUT_DROID', 0.35
					]
				;
				
				// Add general creatures
				chances.push( ...[
					
						'sdVirus', 5 / hp_mult,
						'sdQuickie', 5 / hp_mult,
						'sdAsp', 4 / hp_mult,
						'sdBiter', 4 / hp_mult,
						'sdAmphid', 3 / hp_mult,
						'sdSlug', 2 / hp_mult,
						'sdGrub', 2 / hp_mult,
						'sdJunk', 4,
						'sdWater.water', 3
				] );
				
				let sum_chance = 0;
				for ( let i = 0; i < chances.length; i += 2 )
				sum_chance += chances[ i + 1 ];
			
				let r = Math.random() * sum_chance;
				
				for ( let i = 0; i < chances.length; i += 2 )
				{
					if ( r < chances[ i + 1 ] )
					{
						random_enemy = chances[ i ];
						break;
					}
					else
					r -= chances[ i + 1 ];
				}
			}
			
			let plants = null;
			let plants_objs = null;

			//if ( material === sdBlock.MATERIAL_GROUND )
			if ( !only_plantless_block )
			if ( y === from_y )
			if ( y <= sdWorld.base_ground_level )
			{

				let grass = new sdGrass({ x:x, y:y - 16, filter:f });
				
				grass.variation = sdWorld.GetFinalGrassHeight( x );

				sdEntity.entities.push( grass );

				if ( plants === null )
				{
					plants = [];
					plants_objs = [];
				}

				plants.push( grass._net_id );
				plants_objs.push( grass );
			}
			
			let potential_crystal = ( y > 1500 ) ? 'sdCrystal.really_deep' : ( ( y > from_y + 256 ) ? 'sdCrystal.deep' : 'sdCrystal' );
			
			if ( Math.random() < 0.1 )
			{
				if ( y > from_y + 256 )
				potential_crystal = 'sdCrystal.deep_crab';
				else
				potential_crystal = 'sdCrystal.crab';
			}
			
			let contains_class = ( !half && Math.random() > 0.85 / hp_mult ) ? 
									( ( Math.random() < Math.min( 0.725, 0.3 * ( 1*0.75 + hp_mult*0.25 ) ) ) ? random_enemy : potential_crystal ) : 
									( 
										( Math.random() < 0.1 ) ? 'weak_ground' : null 
									);
							
			if ( material === sdBlock.MATERIAL_ROCK || material === sdBlock.MATERIAL_SAND )
			{
				if ( contains_class === 'sdWater.lava' )
				contains_class = 'sdWater.water';
			}
							
			ent = new sdBlock({ 
				x:x, 
				y:y, 
				width:16, 
				height: half ? 8 : 16,
				material: material,
				contains_class: contains_class,
				filter: f,
				natural: true,
				plants: plants
				//filter: 'hue-rotate('+(~~(Math.sin( ( Math.min( from_y, sdWorld.world_bounds.y2 - 256 ) - y ) * 0.005 )*360))+'deg)' 
			});
			
			if ( plants_objs )
			for ( let i = 0; i < plants_objs.length; i++ )
			{
				plants_objs[ i ]._block = ent;
			}
			
			/*if ( plants )
			for ( let i = 0; i < plants.length; i++ )
			{
				plants[ i ].SetRoot( ent );
			}*/

			if ( hp_mult > 0 )
			{
				ent._hea *= hp_mult;
				ent._hmax *= hp_mult;
			}
		}
		else
		if ( !only_plantless_block )
		{
			ent = new sdBG({ x:x, y:y, width:16, height:16, material:sdBG.MATERIAL_GROUND, filter:'brightness(0.5) ' + f });

			if ( allow_water )
			if ( y > sdWorld.base_ground_level )
			if ( y % 16 === 0 )
			{
				let ent2 = new sdWater({ x:x, y:y, volume:1, type:allow_lava ? sdWater.TYPE_LAVA : sdWater.TYPE_WATER });
				sdEntity.entities.push( ent2 );
				sdWorld.UpdateHashPosition( ent2, false ); // Without this, new water objects will only discover each other after one first think event (and by that time multiple water objects will overlap each other). This could be called at sdEntity super constructor but some entities don't know their bounds by that time
				
				if ( !allow_lava )
				if ( Math.random() < 0.01 )
				{
					let ent3 = new sdShark({ x:x + 8, y:y + 8 });
					sdEntity.entities.push( ent3 );
				}
			}

			//sdWater.SpawnWaterHere( x, y, (y===sdWorld.base_ground_level)?0.5:1 );
		}

		if ( ent )
		{
			sdEntity.entities.push( ent );
			sdWorld.UpdateHashPosition( ent, false ); // Prevent intersection with other ones
		}
		
		return ent;
	}
	
	static ChangeWorldBounds( x1, y1, x2, y2 ) // BoundsMove // MoveBounds
	{
		if ( sdWorld.server_config.aggressive_hibernation )
		{
			const step = sdDeepSleep.normal_cell_size; // Most likely all sizes will be dividable by this
			
			function CreateUnspawned( x, y, w, h, extension_x, extension_y )
			{
				let x2 = x + w;
				let y2 = y + h;
				
				if ( extension_x < 0 )
				if ( x2 > sdWorld.world_bounds.x1 )
				{
					x2 = sdWorld.world_bounds.x1;
					w = x2 - x;
				}
				
				if ( extension_y < 0 )
				if ( y2 > sdWorld.world_bounds.y1 )
				{
					y2 = sdWorld.world_bounds.y1;
					h = y2 - y;
				}
				
				if ( extension_x > 0 )
				if ( x < sdWorld.world_bounds.x2 )
				{
					x = sdWorld.world_bounds.x2;
					w = x2 - x;
				}
				if ( extension_y > 0 )
				if ( y < sdWorld.world_bounds.y2 )
				{
					y = sdWorld.world_bounds.y2;
					h = y2 - y;
				}
				
				if ( w < 0 || h < 0 )
				{
					trace({
						x:x, y:y, w:w, h:h, type: sdDeepSleep.TYPE_UNSPAWNED_WORLD
					});

					throw new Error( 'ChangeWorldBounds: Bad sdDeepSleep size' );
				}
				
				sdEntity.entities.push( new sdDeepSleep({
					x:x, y:y, w:w, h:h, type: sdDeepSleep.TYPE_UNSPAWNED_WORLD
				}) );
			}
			
			// Prevent shrinking in this mode...
			if ( x1 > sdWorld.world_bounds.x1 )
			x1 = sdWorld.world_bounds.x1;
		
			if ( y1 > sdWorld.world_bounds.y1 )
			y1 = sdWorld.world_bounds.y1;
		
			if ( x2 < sdWorld.world_bounds.x2 )
			x2 = sdWorld.world_bounds.x2;
		
			if ( y2 < sdWorld.world_bounds.y2 )
			y2 = sdWorld.world_bounds.y2;
			
			// Extend to left
			for ( let x = x1; x < sdWorld.world_bounds.x1; x += step )
			for ( let y = sdWorld.world_bounds.y1; y < sdWorld.world_bounds.y2; y += step )
			{
				CreateUnspawned( x, y, step, step, -1,0 );
			}
			sdWorld.world_bounds.x1 = x1;
			
			// Extend to right
			for ( let x = sdWorld.world_bounds.x2; x < x2; x += step )
			for ( let y = sdWorld.world_bounds.y1; y < sdWorld.world_bounds.y2; y += step )
			{
				CreateUnspawned( x, y, step, step, 1,0 );
			}
			sdWorld.world_bounds.x2 = x2;
			
			// Extend up
			for ( let y = y1; y < sdWorld.world_bounds.y1; y += step )
			for ( let x = sdWorld.world_bounds.x1; x < sdWorld.world_bounds.x2; x += step )
			{
				CreateUnspawned( x, y, step, step, 0,-1 );
			}
			sdWorld.world_bounds.y1 = y1;
			
			// Extend down
			for ( let y = sdWorld.world_bounds.y2; y < y2; y += step )
			for ( let x = sdWorld.world_bounds.x1; x < sdWorld.world_bounds.x2; x += step )
			{
				CreateUnspawned( x, y, step, step, 0,1 );
			}
			sdWorld.world_bounds.y2 = y2;
			
			// No deletions in this mode
		}
		else
		{
			const GetGroundElevation = sdWorld.GetGroundElevation;

			const FillGroundQuad = sdWorld.FillGroundQuad;

			// Extension down, using same base ground levels
			for ( var x = sdWorld.world_bounds.x1; x < sdWorld.world_bounds.x2; x += 16 )
			{
				var xx = Math.floor( x / 16 );
				var from_y = GetGroundElevation( xx );

				//for ( var y = Math.max( from_y, sdWorld.world_bounds.y2 ); y < y2; y += 16 ) // Only append
				for ( var y = Math.max( Math.min( from_y, sdWorld.base_ground_level ), Math.min( y1, sdWorld.world_bounds.y1 ) ); y < y2; y += 16 ) // Only append
				{
					if ( y < sdWorld.world_bounds.y1 || y >= sdWorld.world_bounds.y2 )
					{
						if ( Math.abs( y ) % 16 === 8 )
						{
							FillGroundQuad( x, y, from_y, true );
							y -= 8;
						}
						else
						FillGroundQuad( x, y, from_y );
					}
					else
					{
						if ( Math.abs( y ) % 16 === 8 )
						y -= 8;
					}
				}
			}

			// Extension to right
			for ( var x = sdWorld.world_bounds.x2; x < x2; x += 16 )
			{
				var xx = Math.floor( x / 16 );
				sdWorld.base_ground_level1[ xx ] = sdWorld.base_ground_level1[ xx - 1 ] || 0;
				sdWorld.base_ground_level2[ xx ] = sdWorld.base_ground_level2[ xx - 1 ] || 0;
				sdWorld.base_grass_level[ xx ] = sdWorld.base_grass_level[ xx - 1 ] || 0;

				sdWorld.base_ground_level1[ xx ] += ( Math.random() - 0.5 ) * 0.2;
				sdWorld.base_ground_level2[ xx ] += ( Math.random() - 0.25 ) * 0.1;
				sdWorld.base_grass_level[ xx ] += ( Math.random() - 0.5 ) * 0.1;

				var from_y = GetGroundElevation( xx );

				for ( var y = Math.max( Math.min( from_y, sdWorld.base_ground_level ), y1 ); y < y2; y += 16 ) // Whole relevant height
				{
					if ( Math.abs( y ) % 16 === 8 )
					{
						FillGroundQuad( x, y, from_y, true );
						y -= 8;
					}
					else
					FillGroundQuad( x, y, from_y );
				}
			}

			// Extension to left
			for ( var x = sdWorld.world_bounds.x1 - 16; x >= x1; x -= 16 )
			{
				var xx = Math.floor( x / 16 );
				sdWorld.base_ground_level1[ xx ] = sdWorld.base_ground_level1[ xx + 1 ] || 0;
				sdWorld.base_ground_level2[ xx ] = sdWorld.base_ground_level2[ xx + 1 ] || 0;
				sdWorld.base_grass_level[ xx ] = sdWorld.base_grass_level[ xx + 1 ] || 0;

				sdWorld.base_ground_level1[ xx ] -= ( Math.random() - 0.5 ) * 0.2;
				sdWorld.base_ground_level2[ xx ] -= ( Math.random() - 0.25 ) * 0.1;
				sdWorld.base_grass_level[ xx ] -= ( Math.random() - 0.5 ) * 0.1;

				var from_y = GetGroundElevation( xx );

				for ( var y = Math.max( Math.min( from_y, sdWorld.base_ground_level ), y1 ); y < y2; y += 16 ) // Whole relevant height
				{
					if ( Math.abs( y ) % 16 === 8 )
					{
						FillGroundQuad( x, y, from_y, true );
						y -= 8;
					}
					else
					FillGroundQuad( x, y, from_y );
				}
			}

			// Delete outbound items
			if ( sdWeather.only_instance )
			{
				sdWeather.only_instance.x = x1;
				sdWeather.only_instance.y = y1;
			}

			sdSound.server_mute = true;
			for ( let i = 0; i < sdEntity.entities.length; i++ )
			{
				var e = sdEntity.entities[ i ];
				//if ( e.x + e._hitbox_x2 < x1 || e.x + e._hitbox_x1 > x2 || e.y + e._hitbox_y2 < y1 || e.y + e._hitbox_y1 > y2 ) Ground overlap problem
				if ( e.x < x1 || e.x >= x2 || e.y < y1 || e.y >= y2 )
				{
					if ( e._is_being_removed )
					{
					}
					else
					{
						// Should be pointless now
						if ( e.is( sdBlock ) )
						if ( e._contains_class !== null )
						e._contains_class = null;

						e.remove();
						e._remove();

						e._broken = false;



						let id_in_active = sdEntity.active_entities.indexOf( e );
						if ( id_in_active !== -1 )
						{
							debugger; // Doesn't _remove handles it by changing hiberstate?

							sdEntity.active_entities.splice( id_in_active, 1 );
						}




						sdEntity.entities.splice( i, 1 );
						i--;
						continue;
					}
				}
			}
			sdSound.server_mute = false;

			sdWorld.world_bounds.x1 = x1;
			sdWorld.world_bounds.y1 = y1;
			sdWorld.world_bounds.x2 = x2;
			sdWorld.world_bounds.y2 = y2;
		}
	}
	static CanSocketSee( socket, x, y )
	{
		if ( socket.character && socket.post_death_spectate_ttl > 0 )
		if ( x > socket.character.x - 800 )
		if ( x < socket.character.x + 800 )
		if ( y > socket.character.y - 400 )
		if ( y < socket.character.y + 400 )
		{
			return true;
		}
		return false;
	}
	static CanAnySocketSee( ent ) // Actually used to lower think rate of some entities
	{
		if ( sdWorld.server_config.debug_offscreen_behavior )
		return false;
	
		const x = ent.x;
		const y = ent.y;
		
		for ( let i = 0; i < sdWorld.online_characters.length; i++ )
		{
			const c = sdWorld.online_characters[ i ];
			if ( x > c.x - 800 )
			if ( x < c.x + 800 )
			if ( y > c.y - 400 )
			if ( y < c.y + 400 )
			return true;
		}
		/*
		
		if ( typeof ent._socket === 'object' ) // Is a connected player
		if ( ent._socket !== null )
		return true;

		if ( sdWorld.server_config.debug_offscreen_behavior )
		return false;
	
		let x = ent.x;
		let y = ent.y;

		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		{
			let socket = sdWorld.sockets[ i ];

			if ( sdWorld.CanSocketSee( socket, x, y ) )
			return true;
		}
		*/
		return false;
	}
	static SpawnGib( x, y, sx = Math.random() * 1 - Math.random() * 1, sy = Math.random() * 1 - Math.random() * 1, side = 1, gib_class, gib_filter, blood_filter = null, scale = 100, ignore_collisions_with=null, image = 0 )
	{
		if ( sdWorld.is_server )
		{
			let gib = new sdGib({ class:gib_class, x:x, y:y, filter: gib_filter, blood_filter: blood_filter, side: side, s: scale });
			gib.sx = sx;
			gib.sy = sy;
			gib._ignore_collisions_with = ignore_collisions_with;
			gib.image = image;

			/*for ( let i = 0; i < sdStatusEffect.status_effects.length; i++ )
			{
				if ( sdStatusEffect.status_effects[ i ].for === ignore_collisions_with ) // Is this effect for the entity we just gibbed?
				
			}*/
			// TO DO: TRANSFER STATUS EFFECTS FROM GIBBED ENTITY TO GIBS

			sdEntity.entities.push( gib );
			//gib.s = scale;
		}
	}
	
	static GiveScoreToPlayerEntity( amount, killed_entity = null, allow_partial_drop = true, player_entity = null )
	{
		let auto_give = Math.floor( killed_entity && allow_partial_drop ? amount * 0.2 : amount );
		
		if ( player_entity )
		{
			// Prevent server's death when too much score is given
			auto_give = Math.max( auto_give, Math.floor( amount - 50 ) );

			player_entity._score += auto_give;
		}
		else
		{
			auto_give = 0;
		}
		
		amount -= auto_give;
		
		amount = Math.floor( amount );
		
		if ( killed_entity )
		if ( amount > 0 )
		{
			const sdGun = sdWorld.entity_classes.sdGun;
			
			sdWorld.DropShards( 
				killed_entity.x + ( killed_entity._hitbox_x1 + killed_entity._hitbox_x2 ) / 2,
				killed_entity.y + ( killed_entity._hitbox_y1 + killed_entity._hitbox_y2 ) / 2,
				0,0, amount, 1, 0, sdGun.CLASS_SCORE_SHARD, 20, killed_entity, player_entity );
		}
		
		let once = true;
		
		if ( player_entity )
		while ( player_entity._score >= player_entity._score_to_level && player_entity.build_tool_level < player_entity._max_level )
		{
			player_entity.build_tool_level++;
			player_entity._score_to_level_additive = player_entity._score_to_level_additive * 1.04;
			player_entity._score_to_level = player_entity._score_to_level + player_entity._score_to_level_additive;
			
			if ( once )
			{
				once = false;
				
				player_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_LEVEL_UP, is_level_up: 1, level:player_entity.build_tool_level });
				//sdSound.PlaySound({ name:'powerup_or_exp_pickup', x:player_entity.x, y:player_entity.y, volume:4 });
				sdSound.PlaySound({ name:'level_up', x:player_entity.x, y:player_entity.y, volume:1 });

				if ( player_entity.build_tool_level % 10 === 0 )
				if ( player_entity._socket )
				sdSound.PlaySound({ name:'piano_world_startB', x:player_entity.x, y:player_entity.y, volume:0.5 }, [ player_entity._socket ] );
			}
		}
		
		if ( player_entity )
		{
			player_entity.onScoreChange();
		}
	}
	static DropShards( x,y,sx,sy, tot, value_mult, radius=0, shard_class_id=sdGun.CLASS_CRYSTAL_SHARD, normal_ttl_seconds=9, ignore_collisions_with=null, follow=null ) // Can drop anything, but if you want to drop score shards - use sdCharacter.prototype.GiveScore instead, and, most specifically - use this.GiveScoreToLastAttacker
	{
		if ( sdWorld.is_server )
		{
			for ( var i = 0; i < tot; i++ )
			{
				let xx = x - radius + Math.random() * radius * 2;
				let yy = y - radius + Math.random() * radius * 2;
				let ent = new sdGun({ class:shard_class_id, x: xx, y: yy });
				ent.sx = sx + Math.random() * 8 - 4;
				ent.sy = sy + Math.random() * 8 - 4;
				//ent.ttl = 30 * normal_ttl_seconds * ( 0.7 + Math.random() * 0.3 ); // was 7 seconds, now 9
				ent.extra = value_mult * sdWorld.crystal_shard_value;
				ent._ignore_collisions_with = ignore_collisions_with;
				ent.follow = follow;
				sdEntity.entities.push( ent );
			}
		}
	}
	static SpawnWaterEntities( x, y, di_x, di_y, tot, type, extra=0, liquid_to_modify=null )
	{
		if ( !sdWorld.is_server )
		return;
		let spawned = 0;

		for ( var i = 0; i < tot; i++ )
		{
			let xx,yy;
			let tr = 1000;
			while ( tr > 0 )
			{
				xx = Math.floor( ( x - di_x + Math.random() * di_x * 2 ) / 16 ) * 16;
				yy = Math.floor( ( y - di_y + Math.random() * di_y * 2 ) / 16 ) * 16;

				let safe_bound = 1;

				let water_ent = sdWater.GetWaterObjectAt( xx, yy );

				while ( water_ent && tr > 0 )
				{
					yy = water_ent.y - 16;
					water_ent = sdWater.GetWaterObjectAt( xx, yy );

					tr--;
				}

				if ( xx >= Math.floor( sdWorld.world_bounds.x1 / 16 ) * 16 && xx < Math.floor( sdWorld.world_bounds.x2 / 16 ) * 16 )
				if ( yy >= Math.floor( sdWorld.world_bounds.y1 / 16 ) * 16 && yy < Math.floor( sdWorld.world_bounds.y2 / 16 ) * 16 )
				{
					if ( !water_ent )
					if ( !sdWorld.CheckWallExistsBox( 
						xx + safe_bound, 
						yy + safe_bound, 
						xx + 16 - safe_bound, 
						yy + 16 - safe_bound, null, null, sdWater.classes_to_interact_with ) )
					{
						water_ent = new sdWater({ x: xx, y: yy, type:type });

						if ( typeof water_ent.extra !== 'undefined' )
						water_ent.extra = extra;
						
						sdEntity.entities.push( water_ent );
						sdWorld.UpdateHashPosition( water_ent, false );

						spawned++;

						if ( liquid_to_modify )
						{
							liquid_to_modify.amount -= 100;
							liquid_to_modify.extra -= extra;

							if ( liquid_to_modify.amount <= 0 )
							liquid_to_modify.type = -1;
						}

						break;
					}
				}

				tr--;
			}
		}

		console.log( spawned );
	}
	static SendEffect( params, command='EFF', exclusive_to_sockets_arr=null ) // 'S' for sound
	{
		if ( !sdWorld.is_server )
		return;
				
		let extra_affected_chars = [];
		
		//console.log('send effect');
	
		if ( params.attachment )
		{
			//console.log('.attachment found');
			
			if ( params.type === sdEffect.TYPE_CHAT )
			//if ( params.attachment._coms_allowed )
			{
				
				if ( params.attachment.driver_of )
				if ( params.attachment.driver_of.is( sdCommandCentre ) )
				{
					params.text = 'CC-' + params.attachment.driver_of.biometry + ': ' + params.text;
					
					//sdCommandCentre.centres
					for ( let i = 0; i < sdCommandCentre.centres.length; i++ )
					{
						const cc = sdCommandCentre.centres[ i ];
						
						//sdWorld.GetCharactersNear( sdCommandCentre.centres[ i ].x, sdCommandCentre.centres[ i ].y, extra_affected_chars, coms_near[ i ].subscribers ); Slow
						
						for ( let i2 = 0; i2 < sdCharacter.characters.length; i2++ )
						{
							const c = sdCharacter.characters[ i2 ];
							
							if ( c._socket )
							if ( sdWorld.inDist2D_Boolean( cc.x, cc.y, c.x, c.y, 5000 ) )
							{
								extra_affected_chars.push( c );
							}
						}
					}
				}
			}
			
			params.attachment = [ params.attachment.GetClass(), params.attachment._net_id ];
		}
		
		if ( params.type === sdEffect.TYPE_EXPLOSION )
		{
			/*let targets = sdWorld.GetAnythingNear( params.x, params.y, params.radius );
			
			for ( var i = 0; i < targets.length; i++ )
			targets[ i ].DamageWithEffect( params.radius * 2 );*/
			
			if ( params.color === undefined )
			throw new Error('Attempted to create explosion without a color - this should not happen and params.color must be a HEX value');
			
			let initial_rand = Math.random() * Math.PI * 2;
			let steps = Math.min( 50, Math.max( 16, params.radius / 70 * 50 ) );
			let an;
			let bullet_obj;
			
			if ( params.damage_scale === 0 )
			steps = 0;
			
			for ( let s = 0; s < steps; s++ )
			{
				an = s / steps * Math.PI * 2;
				
				bullet_obj = new sdBullet({ 
					x: params.x + Math.sin( an + initial_rand ) * 1, 
					y: params.y + Math.cos( an + initial_rand ) * 1 
				});
				bullet_obj._wave = true;
				/*
				bullet_obj.sx = Math.sin( an + initial_rand ) * params.radius;
				bullet_obj.sy = Math.cos( an + initial_rand ) * params.radius;
				bullet_obj.time_left = 2;*/
				
				bullet_obj.sx = Math.sin( an + initial_rand ) * 16;
				bullet_obj.sy = Math.cos( an + initial_rand ) * 16;
				bullet_obj.time_left = params.radius / 16 * 2;
				
				if ( params.armor_penetration_level !== undefined )
				bullet_obj._armor_penetration_level = params.armor_penetration_level;
				
				if ( params.reinforced_level !== undefined )
				bullet_obj._reinforced_level = params.reinforced_level;
				
				//bullet_obj._damage = 80 * ( params.damage_scale || 1 ) * ( params.radius / 19 ) / steps;
				bullet_obj._damage = 140 * ( params.damage_scale || 1 ) * ( params.radius / 19 ) / steps;
				bullet_obj._owner = params.owner || null;
				
				if ( params.can_hit_owner !== undefined )
				bullet_obj._can_hit_owner = params.can_hit_owner;
				else
				bullet_obj._can_hit_owner = true;
				
				sdEntity.entities.push( bullet_obj );
			}
			delete params.damage_scale;
			
			if ( params.owner ) // Will point to real object
			delete params.owner;
		}
		
		if ( params.type === sdEffect.TYPE_BLOOD || params.type === sdEffect.TYPE_BLOOD_GREEN )
		{
			for ( let t = 0; t < 3; t++ )
			{
				let r = Math.random() * 32;
				let a = Math.random() * Math.PI * 2;
				
				let dx = Math.sin( a ) * r;
				let dy = Math.cos( a ) * r;
				
				if ( sdWorld.CheckLineOfSight( params.x, params.y, params.x + dx, params.y + dy, null, null, sdCom.com_visibility_unignored_classes ) )
				{
					if ( sdWorld.CheckWallExists( params.x + dx, params.y + dy, null, null, [ 'sdBG' ] ) )
					if ( sdWorld.last_hit_entity )
					{
						//let bg = sdWorld.last_hit_entity;
						
						let x = Math.floor( ( params.x + dx ) / 16 ) * 16;
						let y = Math.floor( ( params.y + dy ) / 16 ) * 16;
						let w = 16; // Ignored so far
						let h = 16;
						
						if ( sdArea.CheckPointDamageAllowed( x + w / 2, y + h / 2 ) )
						{
						
							/*if ( y < bg.y )
							{
								trace( 'y', y, '->', bg.y );
								y = bg.y;
							}

							if ( y + h > bg.y + bg.height )
							{
								trace( 'h', h, '->', bg.y + bg.height - y );
								h = bg.y + bg.height - y;
							}*/

							let ent = new sdBloodDecal({
								x: x,
								y: y,
								h: h,
								//bg: bg,
								//bg_relative_x: x - bg.x,
								//bg_relative_y: y - bg.y,
								effect_type: params.type,
								filter: params.filter,
								hue: params.hue
							});
							sdEntity.entities.push( ent );
							//sdWorld.UpdateHashPosition( ent, false ); // Prevent inersection with other ones

							/*if ( bg._decals === null )
							bg._decals = [ ent._net_id ];
							else
							bg._decals.push( ent._net_id );*/
						}
					}
				}
			}
		}
		
		if ( params.color === 'transparent' )
		{
			// This should never happen
			debugger;
		}
		
		let socket_arr = exclusive_to_sockets_arr ? exclusive_to_sockets_arr : sdWorld.sockets;
		
		
		params.UC = sdWorld.event_uid_counter++;
				
		let arr = [ command, params ];

		//arr._give_up_on = sdWorld + 5000;
		
		if ( typeof params.x !== 'undefined' )
		params.x = Math.round( params.x );
		
		if ( typeof params.y !== 'undefined' )
		params.y = Math.round( params.y );
		
		if ( typeof params.x2 !== 'undefined' )
		params.x2 = Math.round( params.x2 );
		
		if ( typeof params.y2 !== 'undefined' )
		params.y2 = Math.round( params.y2 );
	
		if ( command === 'S' )
		{
			if ( params.channel )
			{
				params.channel = [ params.channel.entity._net_id, params.channel.uid ]; // Only send _net_id of entity and local uid if a channel
			}
		}

		for ( var i = 0; i < socket_arr.length; i++ )
		{
			var socket = socket_arr[ i ];
			
			if ( params.type === sdEffect.TYPE_LAG )
			{
				if ( socket.character && !socket.character._god )
				continue;
			}

			if ( 
				 ( socket.character && socket.character.hea > 0 && 
				   extra_affected_chars.indexOf( socket.character ) !== -1 ) ||
				   
				 sdWorld.CanSocketSee( socket, params.x, params.y ) || 
				 
				 ( typeof params.x2 !== 'undefined' && 
				   typeof params.y2 !== 'undefined' &&
				   sdWorld.CanSocketSee( socket, params.x2, params.y2 ) ) ) // rails
			{
				//socket.emit( command, params );
				
				socket.sd_events.push( arr );
			}
		}
	}
	static SendSound( params, exclusive_to_sockets_arr=null )
	{
		sdWorld.SendEffect( params, 'S', exclusive_to_sockets_arr );
	}
	static GetComsNear( _x, _y, append_to=null, require_auth_for_net_id=null, return_arr_of_one_with_lowest_net_id=false ) // Only used by GetComsNearCache
	{
		let ret = append_to || [];
		
		let min_x = _x - sdCom.retransmit_range - CHUNK_SIZE;
		let max_x = _x + sdCom.retransmit_range + CHUNK_SIZE;
		let min_y = _y - sdCom.retransmit_range - CHUNK_SIZE;
		let max_y = _y + sdCom.retransmit_range + CHUNK_SIZE;
		
		let x, y, arr, i;
		for ( x = min_x; x <= max_x; x += CHUNK_SIZE )
		for ( y = min_y; y <= max_y; y += CHUNK_SIZE )
		{
			arr = sdWorld.RequireHashPosition( x, y ).arr;
			for ( i = 0; i < arr.length; i++ )
			//if ( arr[ i ].GetClass() === 'sdCom' ) can take up to 11% of execution time
			//if ( arr[ i ] instanceof sdCom )
			if ( !arr[ i ]._is_being_removed )
			if ( arr[ i ].is( sdCom ) )
			if ( require_auth_for_net_id === null || arr[ i ].subscribers.indexOf( require_auth_for_net_id ) !== -1 /*|| arr[ i ].subscribers.indexOf( 'sdCharacter' ) !== -1*/ )
			if ( ret.indexOf( arr[ i ] ) === -1 )
			if ( sdWorld.inDist2D_Boolean( _x, _y, arr[ i ].x, arr[ i ].y, sdCom.retransmit_range ) ) // Strict or else visuals won't match
			//if ( sdWorld.CheckLineOfSight( _x, _y, arr[ i ].x, arr[ i ].y, null, sdCom.com_visibility_ignored_classes, null ) )
			if ( sdWorld.CheckLineOfSight( _x, _y, arr[ i ].x, arr[ i ].y, null, null, sdCom.com_visibility_unignored_classes ) )
			{
				if ( ret.length > 0 && return_arr_of_one_with_lowest_net_id )
				{
					if ( ret[ 0 ]._net_id > arr[ i ] )
					ret[ 0 ] = arr[ i ];
				}
				else
				ret.push( arr[ i ] );
			}
		}
		return ret;
	}
	/*static GetCharactersNear( _x, _y, append_to=null, require_auth_for_net_id_by_list=null, range=sdCom.retransmit_range ) Inefficient method
	{
		let ret = append_to || [];
		
		let min_x = sdWorld.FastFloor((_x - range)/CHUNK_SIZE);
		let min_y = sdWorld.FastFloor((_y - range)/CHUNK_SIZE);
		let max_x = sdWorld.FastCeil((_x + range)/CHUNK_SIZE);
		let max_y = sdWorld.FastCeil((_y + range)/CHUNK_SIZE);
		
		if ( max_x === min_x )
		max_x++;
		if ( max_y === min_y )
		max_y++;
		
		let x, y, arr, i;
		//for ( x = min_x; x <= max_x; x++ )
		//for ( y = min_y; y <= max_y; y++ )
		for ( x = min_x; x < max_x; x++ )
		for ( y = min_y; y < max_y; y++ )
		{
			arr = sdWorld.RequireHashPosition( x * CHUNK_SIZE, y * CHUNK_SIZE ).arr;
			for ( i = 0; i < arr.length; i++ )
			//if ( arr[ i ].GetClass() === 'sdCharacter' )
			//if ( arr[ i ] instanceof sdCharacter )
			if ( !arr[ i ]._is_being_removed )
			if ( arr[ i ].is( sdCharacter ) )
			if ( require_auth_for_net_id_by_list === null )
			if ( ret.indexOf( arr[ i ] ) === -1 )
			ret.push( arr[ i ] );
		}
		return ret;
	}*/
	static FilterHasMatterProperties( ent )
	{
		return ent._has_matter_props;// ( typeof ent.matter !== 'undefined' || typeof ent._matter !== 'undefined' );
	}
	static FilterVisionBlocking( ent )
	{
		return ( ( ent.is( sdBlock ) && ent.texture_id !== sdBlock.TEXTURE_ID_CAGE && ent.texture_id !== sdBlock.TEXTURE_ID_GLASS && ent.material !== sdBlock.MATERIAL_TRAPSHIELD ) || ent.is( sdDoor ) );
	}
	static GetAnythingNearOnlyNonHibernated( _x, _y, range, append_to=null, specific_classes=null, filter_candidates_function=null ) // Kind of faster
	{
		let ret = append_to || [];
		
		const arr = sdEntity.active_entities;
		
		let i, e;
		let cx,cy;
		let x1,y1,x2,y2;
		
		for ( i = 0; i < arr.length; i++ )
		{
			e = arr[ i ];

			if ( !e._is_being_removed )
			if ( filter_candidates_function === null || filter_candidates_function( e ) )
			if ( specific_classes === null || specific_classes.indexOf( e.GetClass() ) !== -1 )
			{
				x1 = e._hitbox_x1;
				x2 = e._hitbox_x2;
				y1 = e._hitbox_y1;
				y2 = e._hitbox_y2;

				cx = Math.max( e.x + x1, Math.min( _x, e.x + x2 ) );
				cy = Math.max( e.y + y1, Math.min( _y, e.y + y2 ) );

				//if ( sdWorld.inDist2D( _x, _y, cx, cy, range ) >= 0 )
				if ( sdWorld.inDist2D_Boolean( _x, _y, cx, cy, range ) )
				if ( ret.indexOf( e ) === -1 )
				ret.push( e );
			}
		}
		
		return ret;
	}
	static GetAnythingNear( _x, _y, range, append_to=null, specific_classes=null, filter_candidates_function=null )
	{
		let ret = append_to || [];
		
		let min_x = sdWorld.FastFloor((_x - range)/CHUNK_SIZE);
		let min_y = sdWorld.FastFloor((_y - range)/CHUNK_SIZE);
		let max_x = sdWorld.FastCeil((_x + range)/CHUNK_SIZE);
		let max_y = sdWorld.FastCeil((_y + range)/CHUNK_SIZE);
		
		if ( max_x === min_x )
		max_x++;
		if ( max_y === min_y )
		max_y++;
	
		let x, y, arr, i, e;
		let cx,cy;
		let x1,y1,x2,y2;
		
		for ( x = min_x; x < max_x; x++ )
		for ( y = min_y; y < max_y; y++ )
		{
			arr = sdWorld.RequireHashPosition( x * CHUNK_SIZE, y * CHUNK_SIZE ).arr;
			for ( i = 0; i < arr.length; i++ )
			{
				e = arr[ i ];
				
				if ( !e._is_being_removed )
				{
					const e_is_bg_entity = e.IsBGEntity();

					if ( e_is_bg_entity === 10 ) // sdDeepSleep
					{
						/* Fighting the case when area would be instantly woken up by random sdDrone from nearby area... Let's wake them up by physically colliding only and whenever players see these
						
						x1 = e._hitbox_x1;
						x2 = e._hitbox_x2;
						y1 = e._hitbox_y1;
						y2 = e._hitbox_y2;

						cx = Math.max( e.x + x1, Math.min( _x, e.x + x2 ) );
						cy = Math.max( e.y + y1, Math.min( _y, e.y + y2 ) );

						// Make sure it actually collides with sdDeepSleep area
						if ( sdWorld.inDist2D_Boolean( _x, _y, cx, cy, range ) )
						{
							e.WakeUpArea();
						}*/
					}
					else
					if ( filter_candidates_function === null || filter_candidates_function( e ) )
					if ( specific_classes === null || specific_classes.indexOf( e.GetClass() ) !== -1 )
					{
						x1 = e._hitbox_x1;
						x2 = e._hitbox_x2;
						y1 = e._hitbox_y1;
						y2 = e._hitbox_y2;

						cx = Math.max( e.x + x1, Math.min( _x, e.x + x2 ) );
						cy = Math.max( e.y + y1, Math.min( _y, e.y + y2 ) );

						if ( sdWorld.inDist2D_Boolean( _x, _y, cx, cy, range ) )
						if ( ret.indexOf( e ) === -1 )
						ret.push( e );
					}
				}
			}
		}
		
		return ret;
	}
	static GetCellsInRect( _x, _y, _x2, _y2 )
	{
		let ret = [];
		
		let min_x = sdWorld.FastFloor(_x/CHUNK_SIZE);
		let min_y = sdWorld.FastFloor(_y/CHUNK_SIZE);
		let max_x = sdWorld.FastCeil(_x2/CHUNK_SIZE);
		let max_y = sdWorld.FastCeil(_y2/CHUNK_SIZE);
		
		if ( max_x === min_x )
		max_x++;
		if ( max_y === min_y )
		max_y++;
	
		let x, y;
		
		for ( x = min_x; x < max_x; x++ )
		for ( y = min_y; y < max_y; y++ )
		ret.push( sdWorld.RequireHashPosition( x * CHUNK_SIZE, y * CHUNK_SIZE ) );
		
		return ret;
	}
	static ResolveMyEntityByNetId()
	{
		//console.warn('ResolveMyEntityByNetId()');
		if ( sdWorld.my_entity_net_id !== undefined )
		if ( sdWorld.my_entity === null || sdWorld.my_entity_net_id !== sdWorld.my_entity._net_id )
		{
			if ( sdWorld.my_entity )
			{
				sdWorld.my_entity._key_states = new sdKeyStates();
				sdWorld.my_entity = null;
			}
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			if ( !sdEntity.entities[ i ]._is_being_removed )
			{
				if ( sdEntity.entities[ i ]._net_id === sdWorld.my_entity_net_id )
				{
					//console.warn('resolved!');
					sdWorld.my_entity = sdEntity.entities[ i ];
					sdWorld.my_entity._key_states = sdWorld.my_key_states;
					
					sdWorld.camera.x = sdWorld.my_entity.x;
					sdWorld.camera.y = sdWorld.my_entity.y;
					
					sdWorld.my_entity.look_x = sdWorld.camera.x;
					sdWorld.my_entity.look_y = sdWorld.camera.y;

					
					if ( sdWorld.my_entity_upgrades_later_set_obj )
					{
						for ( var arr0 in sdWorld.my_entity_upgrades_later_set_obj )
						{
							var arr1 = sdWorld.my_entity_upgrades_later_set_obj[ arr0 ];
							
							sdWorld.my_entity._upgrade_counters[ arr0 ] = arr1;
							if ( sdShop.upgrades[ arr0 ] )
							sdShop.upgrades[ arr0 ].action( sdWorld.my_entity, arr1 );
						}
						
						sdWorld.my_entity_upgrades_later_set_obj = null;
					}
										
					return;
				}
			}
		}
	}
	
	static SolveUnresolvedEntityPointers()
	{
		if ( sdWorld.unresolved_entity_pointers )
		{
			let arr;
			for ( let i = 0; i < sdWorld.unresolved_entity_pointers.length; i++ )
			{
				arr = sdWorld.unresolved_entity_pointers[ i ];

				arr[ 0 ][ arr[ 1 ] ] = sdEntity.GetObjectByClassAndNetId( arr[ 2 ], arr[ 3 ] );

				if ( arr[ 0 ][ arr[ 1 ] ] === null )
				{
					if ( sdWorld.is_server )
					{
						console.warn('Entity pointer could not be resolved even at later stage (can be unimportant but usually is worth attention) for ' + arr[ 0 ].GetClass() + '.' + arr[ 1 ] + ' :: ' + arr[ 2 ] + ' :: ' + arr[ 3 ] );
						//debugger;
					}
				}
			}
			sdWorld.unresolved_entity_pointers = null;
		}
		else
		debugger; // Do sdWorld.unresolved_entity_pointers = []; before applying snapshots
	}
	
	
	static ClassNameToProperName( _class, ent=null, add_translation_tags=false )
	{
		let translate = true;
		
		let c = _class.slice( 2 );

		if ( c === 'BG' )
		c = 'Background wall';
		else
		c = c.replace(/([A-Z])/g, ' $1').trim();

		if ( ent )
		{
			
			
			if ( c === 'Block' )
			{
				if ( ent.material === sdBlock.MATERIAL_WALL )
				c = 'Wall';
				if ( ent.material === sdBlock.MATERIAL_GROUND )
				c = 'Ground';
				if ( ent.material === sdBlock.MATERIAL_ROCK )
				c = 'Rock';
				if ( ent.material === sdBlock.MATERIAL_SAND )
				c = 'Sand';
				if ( ent.material === sdBlock.MATERIAL_SHARP )
				c = 'Trap';
				if ( ent.material === sdBlock.MATERIAL_TRAPSHIELD )
				c = 'Shield';
				if ( ent.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 )
				c = 'Reinforced wall';
				if ( ent.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
				c = 'Reinforced wall level 2';
				if ( ent.material === sdBlock.MATERIAL_CORRUPTION )
				c = 'Corruption';
				if ( ent.material === sdBlock.MATERIAL_CRYSTAL_SHARDS )
				c = 'Flesh corruption';
			}

			if ( c === 'Crystal' )
			{
				/*sdCrystal.TYPE_CRYSTAL = 1;
				sdCrystal.TYPE_CRYSTAL_BIG = 2;
				sdCrystal.TYPE_CRYSTAL_CRAB = 3;
				sdCrystal.TYPE_CRYSTAL_CORRUPTED = 4;
				sdCrystal.TYPE_CRYSTAL_ARTIFICIAL = 5;
				sdCrystal.TYPE_CRYSTAL_CRAB_BIG = 6;*/
									
				let matter_value = ( ent.is_big ? Math.round( ent.matter_max / 4 ) : ent.matter_max );

				if ( matter_value < 1000 )
				matter_value = matter_value + ' matter';
				else
				matter_value = (~~(matter_value/1000)) + 'k';

				if ( ent.type === sdCrystal.TYPE_CRYSTAL )
				c = matter_value+' crystal';
				if ( ent.type === sdCrystal.TYPE_CRYSTAL_BIG )
				c = 'Large '+matter_value+' crystal';
				if ( ent.type === sdCrystal.TYPE_CRYSTAL_CRAB )
				c = ''+matter_value+' Crystal crab';
				if ( ent.type === sdCrystal.TYPE_CRYSTAL_CORRUPTED )
				c = 'Corrupted '+matter_value+' crystal';
				if ( ent.type === sdCrystal.TYPE_CRYSTAL_ARTIFICIAL )
				c = 'Artificial '+matter_value+' crystal';
				if ( ent.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
				c = 'Large '+matter_value+' crystal crab';
			
				if ( ent.is_depleted )
				c = 'Depleted ' + c;
				else
				if ( ent.is_overcharged )
				c = 'Overcharged ' + c;
			}

			if ( c === 'Area' )
			{
				if ( ent.type === sdArea.TYPE_PREVENT_DAMAGE )
				c = 'Combat & build (unless in godmode) preventing area';
				if ( ent.type === sdArea.TYPE_ERASER_AREA )
				c = 'Area eraser';
			}

			/*if ( c === 'Rescue Teleport' )
			{
				if ( ent.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
				c = 'Rescue teleport';
				else
				if ( ent.type === sdRescueTeleport.TYPE_SHORT_RANGE )
				c = 'Short-range rescue teleport';
			}*/

			if ( c === 'Gun' )
			{
				if ( sdGun.classes[ ent.class ] )
				{
					if ( sdGun.classes[ ent.class ].title )
					c = sdGun.classes[ ent.class ].title;
				}
			}

			if ( c === 'Character' )
			{
				c = ent.title;
				translate = false;
			}
			else
			{
				//if ( c === 'Base Shielding Unit' )
				if ( ent )
				if ( ent.title !== undefined )
				{
					//c = ent.title;
					if ( ent )
					if ( Object.getOwnPropertyDescriptor( sdWorld.entity_classes[ _class ].prototype, 'title' ) )
					if ( Object.getOwnPropertyDescriptor( sdWorld.entity_classes[ _class ].prototype, 'title' ).get )
					c = Object.getOwnPropertyDescriptor( sdWorld.entity_classes[ _class ].prototype, 'title' ).get.call( ent );
				}
			}
		}
		
		if ( add_translation_tags )
		{
			if ( translate )
			c = '<' + c + '>';
			else
			c = '[' + c + ']';
		}
		else
		{
			if ( translate )
			c = T(c);
		}

		return c;
	}
	

	/*static shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
		}
	}*/
	static shuffleArray( array ) 
	{
		for (var i = array.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	}
	
	static Dist2D_Vector_pow2( tox, toy )
	{
		return ( tox*tox + toy*toy );
	}
	static Dist2D_Vector( tox, toy )
	{
		return Math.sqrt( sdWorld.Dist2D_Vector_pow2( tox, toy ) );
	}
	static Dist2D( x1, y1, x2, y2 )
	{
		return sdWorld.Dist2D_Vector( x1-x2, y1-y2 );
	}
	static inDist2D( x1, y1, x2, y2, rad )
	{
		if ( x1 <= x2 - rad )
		return -1;

		if ( x1 >= x2 + rad )
		return -1;

		if ( y1 <= y2 - rad )
		return -1;

		if ( y1 >= y2 + rad )
		return -1;

		var di = sdWorld.Dist2D_Vector_pow2( x1-x2, y1-y2 );

		if ( di > rad * rad )
		return -1;

		return Math.sqrt( di );
	}
	static inDist2D_Boolean( x1, y1, x2, y2, rad )
	{
		if ( x1 <= x2 - rad )
		return false;

		if ( x1 >= x2 + rad )
		return false;

		if ( y1 <= y2 - rad )
		return false;

		if ( y1 >= y2 + rad )
		return false;

		var di = sdWorld.Dist2D_Vector_pow2( x1-x2, y1-y2 );

		if ( di > rad * rad )
		return false;

		return true;
	}
	
	
	static sqr( x )
	{ return x * x; }
	static dist2( v, w )
	{ return sdWorld.sqr( v.x - w.x ) + sdWorld.sqr( v.y - w.y ); }
	static distToSegmentSquared( p, v, w ) // p is tested point, v and w is a segment
	{
		var l2 = sdWorld.dist2( v, w );
		if ( l2 === 0 )
		{
			sdWorld.reusable_closest_point.SetV( v );
			return sdWorld.dist2( p, v );
		}
		var t = ( ( p.x - v.x ) * ( w.x - v.x ) + ( p.y - v.y ) * ( w.y - v.y ) ) / l2;

		if ( t < 0 )
		sdWorld.reusable_closest_point.SetV( v );
		else
		if ( t > 1 )
		sdWorld.reusable_closest_point.SetV( w );
		else
		sdWorld.reusable_closest_point.Set( v.x + t * ( w.x - v.x ), v.y + t * ( w.y - v.y ) );

		return sdWorld.dist2( p, sdWorld.reusable_closest_point );
	}
	static distToSegment( p, v, w ) // Can be updated into inDistToSegment() to avoid unneded calculations // p is tested point, v and w is a segment
	{ return Math.sqrt( sdWorld.distToSegmentSquared( p, v, w ) ); }
	
	static MorphWithTimeScale( current, to, remain, _GSPEED, snap_range=0 )
	{
		remain = Math.pow( remain, _GSPEED );
		current = to * ( 1 - remain ) + current * remain;
		
		if ( snap_range !== 0 )
		if ( Math.abs( current - to ) <= snap_range )
		return to;

		return current;
	}
	
	static FastestMethod( THAT, prototype, CURRENT_METHOD, ALTERNATIVE_METHODS, args ) // Because JS performance is quite unreliable across different hardware and versions of Node.JS
	{
		if ( !sdWorld.fastest_method_improver_info )
		{
			sdWorld.fastest_method_improver_info = new Map();
		}
		
		let arr = sdWorld.fastest_method_improver_info.get( CURRENT_METHOD );
		
		if ( !arr )
		{
			arr = {
				times: [],
				current_test_id: 0,
				test_iters_left: 1000, // Let JS engine optimize something
				iterations: 0,
				until: sdWorld.is_server ? ( Date.now() + 1000 * 60 * 5 ) : ( Date.now() + 3000 ) // Overhead can be too much for client devices, also some simple server might never get optimizations if no limit set
			};
			sdWorld.fastest_method_improver_info.set( CURRENT_METHOD, arr );
		}
		if ( arr.test_iters_left <= 0 )
		{
			arr.current_test_id = ( arr.current_test_id + 1 ) % ALTERNATIVE_METHODS.length;
			arr.test_iters_left = 1000;
		}
		
		let t0;
		let t2;

		let r;
		{
			const args2 = args;
			const THAT2 = THAT;
			const m = ALTERNATIVE_METHODS[ arr.current_test_id ].name;
			
			let r2;
			
			t0 = Date.now();

			r2 = THAT2[ m ]( ...args2 );

			t2 = Date.now();
			
			r = r2;
		}
		
		arr.times[ arr.current_test_id ] = ( arr.times[ arr.current_test_id ] || 0 ) + t2 - t0;
		
		arr.iterations++;
		
		arr.test_iters_left--;
		
		if ( arr.test_iters_left <= 0 && arr.current_test_id === ALTERNATIVE_METHODS.length - 1 ) // Only when even iternatinos are done
		if ( ( arr.iterations > 20000 && arr.times[ arr.current_test_id ] > 100 ) || arr.iterations > 500000 || t0 > arr.until )
		{
			var smallest_i = 0;
			
			for ( let i = 1; i < ALTERNATIVE_METHODS.length; i++ )
			if ( arr.times[ i ] < arr.times[ smallest_i ] )
			smallest_i = i;
	
			prototype[ CURRENT_METHOD.name ] = ALTERNATIVE_METHODS[ smallest_i ];
			
			for ( let i = 0; i < ALTERNATIVE_METHODS.length; i++ )
			{
				delete prototype[ ALTERNATIVE_METHODS[ i ].name ];
			}
			
			console.log( 'prototype.' + CURRENT_METHOD.name + ' method replaced with version[' + smallest_i + ']', arr );
			
			sdWorld.fastest_method_improver_info.delete( CURRENT_METHOD );
		}
		
		return r;
	}
	static RequireHashPosition( x, y, spawn_if_empty=false )
	{
		/*
		x = sdWorld.FastFloor( x / CHUNK_SIZE );
		y = sdWorld.FastFloor( y / CHUNK_SIZE );
		
		//x = Math.floor( x / CHUNK_SIZE );
		//y = Math.floor( y / CHUNK_SIZE );
		
		var a;
		
		if ( typeof sdWorld.world_hash_positions[ x ] === 'undefined' )
		a = sdWorld.world_hash_positions[ x ] = {};
		else
		a = sdWorld.world_hash_positions[ x ];
	
		var b;
	
		if ( typeof a[ y ] === 'undefined' )
		b = a[ y ] = [];
		else
		b = a[ y ];
	
		return b;*/
		
		//x = ~~( x / CHUNK_SIZE );
		//y = ;
		
		//x = ( ~~( y / CHUNK_SIZE ) ) * 4098 + ~~( x / CHUNK_SIZE ); // Too many left-over empty arrays when bounds move?
		
		x = ( sdWorld.FastFloor( y / CHUNK_SIZE ) ) * 4098 + sdWorld.FastFloor( x / CHUNK_SIZE );
		
		let arr = sdWorld.world_hash_positions.get( x );
		
		//if ( !sdWorld.world_hash_positions.has( x ) )
		if ( arr === undefined )
		{
			if ( spawn_if_empty )
			{
				//let arr = [];
				//arr.hash = x;
				
				arr = new Cell( x );

				sdWorld.world_hash_positions.set( x, arr );

				sdWorld.world_hash_positions_recheck_keys.add( x );
				//if ( sdWorld.world_hash_positions_recheck_keys.indexOf( x ) === -1 )
				//sdWorld.world_hash_positions_recheck_keys.push( x );
			}
			else
			{
				return sdWorld.fake_empty_cell;
			}
		}
		
		return arr;// sdWorld.world_hash_positions.get( x );
		
	}
	static ArraysEqualIgnoringOrder( a, b )
	{
		if ( a.length !== b.length )
		return false;
	
		for ( var i = 0; i < a.length; i++ )
		{
			if ( b.indexOf( a[ i ] ) === -1 )
			return false;
		}
	
		return true; // Try false here if method fails for some reason
	}
	static limit( min, v, max )
	{
		if ( v <= min )
		return min;
		if ( v >= max )
		return min;
		return v;
	}
	static FastFloor( v ) // in case you need negative values, has 500000 as low limit.
	{
		if ( v < 0 )
		return ( ~~( 500000 + v ) ) - 500000;
		else
		return ~~v;
	}
	static FastCeil( v ) // in case you need negative values, has 500000 as high limit.
	{
		if ( v > 0 )
		return -( ( ~~( 500000 - v ) ) - 500000 );
		else
		return ~~v;
	}
	static UpdateHashPosition( entity, delay_callback_calls, allow_calling_movement_in_range=true ) // allow_calling_movement_in_range better be false when it is not decided whether entity will be physically placed in world or won't be (so sdBlock SHARP won't kill initiator in the middle of Shoot method of a gun, which was causing crash)
	{
		if ( sdWorld.is_server )
		if ( entity.IsGlobalEntity() )
		{
			debugger;
		}
		
		if ( !delay_callback_calls )
		entity.UpdateHitbox();
	
		//let new_hash_position = entity._is_being_removed ? null : sdWorld.RequireHashPosition( entity.x, entity.y );
		
		//if ( entity.GetClass() === 'sdArea' )
		//debugger;
		
		
		let new_affected_hash_arrays = [];
		if ( !entity._is_being_removed && !delay_callback_calls ) // delay_callback_calls is useful here as it will delay ._hitbox_x2 access which in case of sdBlock will be undefined at the very beginning, due to .width not specified yet
		{
			/*if ( entity.is( sdBlock ) )
			if ( entity.width === 16 )
			if ( entity.height === 16 )
			debugger;*/
								
			if ( entity._net_id === undefined ) // Client-side entities can't interact with anything. Such as sdEffect and sdBone. In case if they would - they will also appear in huge arrays of hash cells, which would slow down client-side game
			{
			}
			else
			{
				let from_x = sdWorld.FastFloor( ( entity.x + entity._hitbox_x1 ) / CHUNK_SIZE );
				let from_y = sdWorld.FastFloor( ( entity.y + entity._hitbox_y1 ) / CHUNK_SIZE );
				let to_x = sdWorld.FastCeil( ( entity.x + entity._hitbox_x2 ) / CHUNK_SIZE );
				let to_y = sdWorld.FastCeil( ( entity.y + entity._hitbox_y2 ) / CHUNK_SIZE );

				if ( to_x === from_x )
				to_x++;
				if ( to_y === from_y )
				to_y++;

				if ( ( to_x - from_x < CHUNK_SIZE && to_y - from_y < CHUNK_SIZE ) || entity.is( sdDeepSleep ) )
				{
					var xx, yy;

					/*if ( entity.is( sdBlock ) )
					if ( entity.width === 16 )
					if ( entity.height === 16 )
					if ( to_x === from_x || to_y === from_y )
					debugger*/

					//for ( xx = from_x; xx <= to_x; xx++ )
					//for ( yy = from_y; yy <= to_y; yy++ )
					for ( xx = from_x; xx < to_x; xx++ )
					for ( yy = from_y; yy < to_y; yy++ )
					new_affected_hash_arrays.push( sdWorld.RequireHashPosition( xx * CHUNK_SIZE, yy * CHUNK_SIZE, true ) );

					/*
					if ( entity.GetClass() === 'sdArea' )
					//if ( new_affected_hash_arrays.length < 72 )
					{
						console.warn(['CaseA sdArea new_affected_hash_arrays =',new_affected_hash_arrays.length,'::',from_x,from_y,to_x,to_y,'size:'+entity.size,'x:'+entity.x,'y:'+entity.y]);
					}*/
				}
				else
				debugger; // ~~ operation overflow is taking place? Or object is just too huge?
			}
		}
		
		//if ( entity._hash_position !== new_hash_position )
		if ( !sdWorld.ArraysEqualIgnoringOrder( entity._affected_hash_arrays, new_affected_hash_arrays ) )
		{
			for ( var i = 0; i < entity._affected_hash_arrays.length; i++ )
			{
				var ind = entity._affected_hash_arrays[ i ].arr.indexOf( entity );
				if ( ind === -1 )
				throw new Error('Bad hash object - it should contain this entity but it does not');
			
				entity._affected_hash_arrays[ i ].arr.splice( ind, 1 );
				//entity._affected_hash_arrays[ i ].RecreateWithout( ind );
					
				if ( entity._affected_hash_arrays[ i ].arr.length === 0 && new_affected_hash_arrays.indexOf( entity._affected_hash_arrays[ i ] ) === -1 ) // Empty and not going to re-add(!)
				{
					//entity._affected_hash_arrays[ i ].unlinked = globalThis.getStackTrace();
					sdWorld.world_hash_positions.delete( entity._affected_hash_arrays[ i ].hash );
				}
			}
			/*
			if ( entity._hash_position !== null )
			{
				let ind = entity._hash_position.indexOf( entity );
				if ( ind === -1 )
				throw new Error('Bad hash object');
				entity._hash_position.splice( ind, 1 );
				
				if ( entity._hash_position.length === 0 )
				{
					sdWorld.world_hash_positions.delete( entity._hash_position.hash );
				}
			}*/
			
			for ( var i = 0; i < new_affected_hash_arrays.length; i++ )
			{
				//if ( new_affected_hash_arrays[ i ].unlinked )
				//throw new Error('Adding to unlinked hash');
				
				//new_affected_hash_arrays[ i ].push( entity );
				new_affected_hash_arrays[ i ].arr.push( entity );
				//new_affected_hash_arrays[ i ].RecreateWith( entity );
				
				//if ( new_affected_hash_arrays[ i ].length > 1000 ) // Dealing with NaN bounds?
				if ( new_affected_hash_arrays[ i ].arr.length > 100 ) // Dealing with NaN bounds? Or just entity flood? Likely entity flood (is is bad for performance)
				debugger;
			}
			
/*
			if ( entity.GetClass() === 'sdArea' )
			//if ( new_affected_hash_arrays.length < 72 )
			{
				console.warn(['CaseB sdArea new_affected_hash_arrays =',new_affected_hash_arrays.length,'size:'+entity.size]);
			}*/
		
			entity._affected_hash_arrays = new_affected_hash_arrays;
			/*
			entity._hash_position = new_hash_position;
			if ( new_hash_position !== null )
			entity._hash_position.push( entity );*/
		}
		
		if ( entity._is_being_removed )
		return;
		
		if ( delay_callback_calls || !allow_calling_movement_in_range )
		{
			// Trigger instant collision check
			entity._last_x = undefined;
			entity._last_y = undefined;
		}
		else
		{
			entity._last_x = entity.x;
			entity._last_y = entity.y;
			
			//if ( false ) // Is it still needed? Yes, for cases of overlap that does not involve pushing (players picking up guns, bullets hitting anything)
			//if ( sdWorld.is_server || entity._net_id !== undefined ) // Not a client-side entity, these (like sdBone) should not react with anything and can simply take up execution time
			{
				let map = new Set();

				let i2, i;

				/*for ( i2 = 0; i2 < new_affected_hash_arrays.length; i2++ )
				for ( i = 0; i < new_affected_hash_arrays[ i2 ].length; i++ )
				map.add( new_affected_hash_arrays[ i2 ][ i ] );*/

				let another_entity;

				const default_movement_in_range_method = sdEntity.prototype.onMovementInRange;

				for ( i2 = 0; i2 < new_affected_hash_arrays.length; i2++ )
				for ( i = 0; i < new_affected_hash_arrays[ i2 ].arr.length; i++ )
				{
					another_entity = new_affected_hash_arrays[ i2 ].arr[ i ];

					if ( another_entity !== entity )
					{
						let m1 = ( entity.onMovementInRange !== default_movement_in_range_method );
						let m2 = ( another_entity.onMovementInRange !== default_movement_in_range_method );

						if ( m1 || m2 )
						if ( entity.x + entity._hitbox_x2 > another_entity.x + another_entity._hitbox_x1 &&
							 entity.x + entity._hitbox_x1 < another_entity.x + another_entity._hitbox_x2 &&
							 entity.y + entity._hitbox_y2 > another_entity.y + another_entity._hitbox_y1 &&
							 entity.y + entity._hitbox_y1 < another_entity.y + another_entity._hitbox_y2 )
						map.add( another_entity );
					}
				}
				
				
				// Always call onMovementInRange with last interacted water as it might not receive onMovementInRange as it is only called whenever something enters water, not when it leaves it
				let water = sdWater.all_swimmers.get( entity );
				if ( water )
				map.add( water );

				// Make entities reach to each other in both directions
				map.forEach( ( another_entity )=>
				{
					//if ( another_entity !== entity )
					//{
						//if ( m1 || m2 )
						if ( !another_entity._is_being_removed )
						if ( !entity._is_being_removed ) // Just so bullets won't hit multiple targets
						{
							/*if ( entity.x + entity._hitbox_x2 > another_entity.x + another_entity._hitbox_x1 &&
								 entity.x + entity._hitbox_x1 < another_entity.x + another_entity._hitbox_x2 &&
								 entity.y + entity._hitbox_y2 > another_entity.y + another_entity._hitbox_y1 &&
								 entity.y + entity._hitbox_y1 < another_entity.y + another_entity._hitbox_y2 )*/
							//{
							
								let m1 = ( entity.onMovementInRange !== default_movement_in_range_method );
								let m2 = ( another_entity.onMovementInRange !== default_movement_in_range_method );

								if ( m1 )
								entity.onMovementInRange( another_entity );

								if ( m2 )
								another_entity.onMovementInRange( entity );
							//}
						}
					//}
				});
			}
		}
	}
	static HandleWorldLogicNoPlayers()
	{
		sdWorld.time = Date.now();
		//sdWorld.frame++; Not needed if nothing happens
	}
	static HandleWorldLogic( frame )
	{
		const DEBUG_TIME_MODE = false;
		
		
		let old_time = sdWorld.time;
		
		sdWorld.time = Date.now();
		sdSound.sounds_played_at_frame = 0;
		
		let t2 = sdWorld.time;
		
		let times = {};
		
		let worst_case = 0;
		
		function IncludeTimeCost( _class, time_add )
		{
			if ( sdWorld.is_server )
			{
				if ( typeof times[ _class ] === 'undefined' )
				times[ _class ] = time_add;
				else
				times[ _class ] += time_add;

				if ( times[ _class ] > worst_case )
				{
					worst_case = times[ _class ];
					sdWorld.last_slowest_class = _class;
				}
			}
		}
		
		//let substeps = sdWorld.is_server ? 2 : 2;
		//let substeps = 2;
		
		//for ( var step = 0; step < substeps; step++ )
		//{
			let GSPEED = ( sdWorld.time - old_time ) / 1000 * 30; // / substeps;
			
			if ( GSPEED < 0 ) // Overflow? Probably would never happen normally
			GSPEED = 0;
			else
			if ( sdWorld.is_server )
			{
				if ( GSPEED > 1 ) // Should be best for hitdetection
				GSPEED = 1;
			}
			else
			{
				if ( GSPEED > 10 ) // Should be best for weaker devices, just so at least server would not initiate player teleportation back to where he thinks player is
				GSPEED = 10;
			}
			
			//GSPEED = 4;

			sdWorld.GSPEED = GSPEED;
			//console.log( GSPEED );
			
			let arr_i;
			let arr;
			let i;
			let i2;
			let best_warp;
			let e;
			let time_from;
			let time_to;
			let step;
			let hiber_state;
			let substeps;
			let progress_until_removed;
			
			let gspeed_mult;
			let substeps_mult;
			let skip_frames;
			
			let timewarps = null;
			let stop_motion_regions = null;
			
			if ( sdEntity.to_seal_list.length > 0 )
			{
				//if ( false )
				for ( i = 0; i < sdEntity.to_seal_list.length; i++ )
				{
					let e = sdEntity.to_seal_list[ i ];
					
					if ( !e._is_being_removed )
					{
						//sdEntity.to_seal_list[ i ].InitMatterMode();
						e._has_matter_props = ( typeof e.matter !== 'undefined' || typeof e._matter !== 'undefined' );//sdWorld.FilterHasMatterProperties( e );
				
						e._has_liquid_props = ( typeof e.liquid !== 'undefined' || typeof e._liquid !== 'undefined' );//sdWorld.FilterHasMatterProperties( e );
				
						Object.seal( e );
					}
				}
				sdEntity.to_seal_list.length = 0;
			}
			
			if ( sdWorld.is_server && !sdWorld.is_singleplayer )
			{
				for ( i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				if ( sdWorld.sockets[ i ].character.time_ef > 0 )
				{
					if ( timewarps === null )
					timewarps = [];

					timewarps.push( { x: sdWorld.sockets[ i ].character.x, y: sdWorld.sockets[ i ].character.y, e: sdWorld.sockets[ i ].character, r: 128 } );
				}
			}
			else
			{
				for ( i = 0; i < sdEntity.active_entities.length; i++ )
				{
					if ( sdEntity.active_entities[ i ].is( sdCharacter ) )
					if ( sdEntity.active_entities[ i ].hea > 0 )
					if ( !sdEntity.active_entities[ i ]._is_being_removed )
					if ( sdEntity.active_entities[ i ].time_ef > 0 )
					{
						if ( timewarps === null )
						timewarps = [];

						timewarps.push( { x: sdEntity.active_entities[ i ].x, y: sdEntity.active_entities[ i ].y, e: sdEntity.active_entities[ i ], r: 128 } );
					}
				}
			}
				
			for ( i = 0; i < sdPresetEditor.regions.length; i++ )
			if ( sdPresetEditor.regions[ i ].time_scale !== 1 )
			{
				if ( stop_motion_regions === null )
				stop_motion_regions = [];

				stop_motion_regions.push( sdPresetEditor.regions[ i ] );
			}
			
			//sdCable.GlobalCableThink( GSPEED );

			for ( i = 0; i < sdWorld.static_think_methods.length; i++ )
			sdWorld.static_think_methods[ i ]( GSPEED );
		
			//const think_function_ptr_cache = [];
			
			//let skipper = 0;
			
			sdWorld.online_characters.length = 0;
			if ( sdWorld.sockets ) // Server-side only thing
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				let socket = sdWorld.sockets[ i ];
				
				if ( socket.character && socket.post_death_spectate_ttl > 0 )
				sdWorld.online_characters.push( socket.character );
			}
			
			const debug_wake_up_sleep_refuse_reasons = sdDeepSleep.debug_wake_up_sleep_refuse_reasons;
			
			const bulk_exclude = [];
			
			for ( arr_i = 0; arr_i < 2; arr_i++ )
			{
				arr = ( arr_i === 0 ) ? sdEntity.active_entities : sdEntity.global_entities;
				
				loop1: for ( i = 0; i < arr.length; i++ )
				{
					e = arr[ i ];
					
					gspeed_mult = 1;
					//substeps_mult = 1;
					substeps = 1;
					
					if ( arr_i === 0 ) // Only for real in-world objects that have position
					{
						if ( sdWorld.offscreen_behavior === sdWorld.OFFSCREEN_BEHAVIOR_SIMULATE_PROPERLY )
						{
						}
						else
						if ( sdWorld.offscreen_behavior === sdWorld.OFFSCREEN_BEHAVIOR_SIMULATE_X_TIMES_SLOWER )
						{
							if ( e._last_x !== undefined ) // Make sure it is initiated properly
							if ( !sdWorld.CanAnySocketSee( e ) )
							{
								skip_frames = sdWorld.offscreen_behavior_x_value;
								
								if ( e._net_id % skip_frames === frame % skip_frames )
								{
									// Simulate 1 step
								}
								else
								continue; // Ignore
							}
						}
						else
						if ( sdWorld.offscreen_behavior === sdWorld.OFFSCREEN_BEHAVIOR_SIMULATE_X_STEPS_AT_ONCE )
						{
							if ( sdWorld.server_config.TestIfShouldForceProperSimulation( e ) )
							{
							}
							else
							if ( e._last_x !== undefined ) // Make sure it is initiated properly
							if ( !sdWorld.CanAnySocketSee( e ) )
							{
								skip_frames = sdWorld.offscreen_behavior_x_value;
								
								if ( e._net_id % skip_frames === frame % skip_frames )
								{
									// Simulate 30 steps
									
									gspeed_mult = sdWorld.offscreen_behavior_x_value;
									
									if ( e.onThink.has_ApplyVelocityAndCollisions )
									substeps = sdWorld.offscreen_behavior_x_value;
								}
								else
								continue; // Ignore
							}
						}
						
						/*
						if ( sdWorld.is_server )
						if ( e._last_x !== undefined ) // sdEntity was never placed properly yet, can cause items to fall into each other after snapshot load
						if ( e._frozen <= 0 )
						if ( !sdWorld.CanAnySocketSee( e, arr_i === 1 ) )
						{
							// Make sure low tickrate entities are still catch up on time, this still improved performance because of calling same method multiple times is always faster than calling multiple methods once (apparently virtual method call issue)
							skip_frames = 30;

							//if ( e.is( sdCharacter ) || e.is( sdGun ) )
							//skip_frames = 5; // High values cause idling players to lose their guns
							//else
							if ( e.is( sdSandWorm ) )
							skip_frames = 5; // These are just unstable on high GSPEED
							else
							if ( e.is( sdQuadro ) )
							skip_frames = 2; // These are just unstable on high GSPEED

							if ( e._net_id % skip_frames === frame % skip_frames )
							{
								gspeed_mult = skip_frames;
								
								if ( typeof e._phys_sleep === 'undefined' || e._phys_sleep <= 0 )
								//if ( e.is_static || typeof e.sy === 'undefined' )
								{
									// Single substep for amplifiers, nodes, cables etc
								}
								else
								substeps = 10; // 8 and 5 were not enough for crystals in amplifiers
								//substeps_mult = 10; // 8 and 5 were not enough for crystals in amplifiers
							}
							else
							continue;
						}*/

						if ( timewarps )
						{
							best_warp = 1;
							for ( i2 = 0; i2 < timewarps.length; i2++ )
							{
								if ( sdWorld.inDist2D_Boolean( timewarps[ i2 ].x, timewarps[ i2 ].y, e.x, e.y, timewarps[ i2 ].r ) )
								{
									if ( !sdWorld.server_config.base_degradation )
									if ( !sdWorld.CheckLineOfSight( timewarps[ i2 ].x, timewarps[ i2 ].y, ...e.GetClosestPointWithinCollision( timewarps[ i2 ].x, timewarps[ i2 ].y ), null, null, null, sdWorld.FilterShieldedWallsAndDoors ) )
									continue;
									
									if ( e === timewarps[ i2 ].e || e === timewarps[ i2 ].e.driver_of || ( e.is( sdGun ) && e._held_by === timewarps[ i2 ].e ) )
									{
										best_warp = 0.5;
										break;
									}
									else
									{
										if ( best_warp === 1 )
										best_warp = 0.15;
									}
								}
							}

							gspeed_mult *= best_warp;
						}
						if ( stop_motion_regions )
						{
							if ( e.is( sdEffect ) || e.is( sdBullet ) )
							{
							}
							else
							if ( e.is( sdCharacter ) && ( e._socket || sdWorld.my_entity === e ) )
							{
							}
							else
							if ( e.is( sdGun ) && e._held_by && ( e._held_by._socket || sdWorld.my_entity === e._held_by._socket ) )
							{
							}
							else
							for ( i2 = 0; i2 < stop_motion_regions.length; i2++ )
							if ( e.DoesOverlapWith( stop_motion_regions[ i2 ] ) )
							{
								gspeed_mult *= stop_motion_regions[ i2 ].time_scale / 1000;
								break;
							}
						}

					}
					
					if ( DEBUG_TIME_MODE )
					{
						time_from = Date.now();
					}
					
					//substeps = e.substeps * substeps_mult;
					//substeps = substeps_mult;
					progress_until_removed = e.ThinkUntilRemoved();
					
					//if ( !e._onThinkPtr )
					//e._onThinkPtr = e.onThink;
					
					for ( step = 0; step < substeps || progress_until_removed; step++ )
					{
						if ( !e._is_being_removed )
						{
							if ( debug_wake_up_sleep_refuse_reasons )
							{
								sdWorld.last_simulated_entity = e;
							}
							
							if ( e._frozen >= 1 )
							e.onThinkFrozen( GSPEED / substeps * gspeed_mult );
							else
							{
								//if ( skipper++ % 2 === 0 )
								e.onThink( GSPEED / substeps * gspeed_mult );
								//else
								//e._onThinkPtr( GSPEED / substeps * gspeed_mult ); // Actually faster in v8... Has something to do with different objects having same property // UPD: Let's rollback it, maybe this was causing Booraz's server to lag?
							}
							
							if ( debug_wake_up_sleep_refuse_reasons )
							{
								sdWorld.last_simulated_entity = null;
							}
						}
						
						if ( e._is_being_removed /*|| 
							 e.Think( GSPEED / substeps * gspeed_mult )*/ )
						{
							hiber_state = e._hiberstate;
							
							e._remove();
							
							if ( DEBUG_TIME_MODE )
							{
								time_to = Date.now();
								if ( time_to - time_from > 5 )
								sdWorld.SendEffect({ x:e.x, y:e.y, type:sdEffect.TYPE_LAG, text:e.GetClass()+': '+(time_to - time_from)+'ms' });
							}
							
							if ( arr_i === 0 )
							{
								//e._remove_from_entities_array( hiber_state );
								bulk_exclude.push( e );
							}
							
							if ( arr[ i ] === e ) // Removal did not happen?
							{
								arr.splice( i, 1 );
								i--;
							}
							continue loop1; // Or else it will try to get removed in each substep of a bullet
						}
						
						if ( arr_i === 0 ) // Only for real in-world objects that have position
						{
							e.UpdateHitbox();

							if ( e._last_x !== e.x ||
								 e._last_y !== e.y )
							{
								if ( !e._is_being_removed )
								{
									sdWorld.UpdateHashPosition( e, false );
									
									e.ManageTrackedPhysWakeup();

									if ( e._listeners ) // Should be faster than passing string
									e.callEventListener( 'MOVES' );
								}
							}
						}
					}
					
					if ( DEBUG_TIME_MODE )
					{
						time_to = Date.now();
						if ( time_to - time_from > 5 )
						sdWorld.SendEffect({ x:e.x, y:e.y, type:sdEffect.TYPE_LAG, text:e.GetClass()+': '+(time_to - time_from)+'ms' });

						IncludeTimeCost( e.GetClass(), time_to - time_from );
					}
				}
			}
			
			sdEntity.BulkRemoveEntitiesFromEntitiesArray( bulk_exclude );
			
			// Check for improperly removed entities. It fill falsely react to chained removals, for example in case of sdBG -> sdBloodDecal
			/*if ( sdWorld.is_server || sdWorld.is_singleplayer )
			{
				let e = sdEntity.GetRandomEntity();
				if ( e )
				if ( e._is_being_removed )
				{
					trace( 'Entity was not removed properly. .remove() was likely called, _remove() was likely called too, but entity is still in sdEntity.entities array. Make sure to call ._remove_from_entities_array() at the time of removal too...', e );
					
					e._remove_from_entities_array();
				}
			}*/
			
			if ( !sdWorld.is_server || sdWorld.is_singleplayer )
			{
				//if ( sdShop.open || sdContextMenu.open )
				//sdWorld.mouse_speed_morph = Math.max( sdWorld.mouse_speed_morph - GSPEED * 0.01, 0 );
				//else
				sdWorld.mouse_speed_morph = Math.min( sdWorld.mouse_speed_morph + GSPEED * 0.2, 1 );
				
				sdWorld.mouse_world_x = ( sdWorld.mouse_screen_x / sdWorld.camera.scale + sdWorld.camera.x - sdRenderer.screen_width / 2 / sdWorld.camera.scale );// * sdWorld.mouse_speed_morph + sdWorld.mouse_world_x * ( 1 - sdWorld.mouse_speed_morph );
				sdWorld.mouse_world_y = ( sdWorld.mouse_screen_y / sdWorld.camera.scale + sdWorld.camera.y - sdRenderer.screen_height / 2 / sdWorld.camera.scale );// * sdWorld.mouse_speed_morph + sdWorld.mouse_world_y * ( 1 - sdWorld.mouse_speed_morph );

				if ( sdWorld.my_entity )
				{
					if ( sdWorld.mobile )
					{
						sdWorld.camera.x = sdWorld.my_entity.x;
						sdWorld.camera.y = sdWorld.my_entity.y;
					}
					else
					{
						if ( sdWorld.soft_camera )
						{
							sdWorld.camera.x = sdWorld.MorphWithTimeScale( sdWorld.camera.x, ( sdWorld.my_entity.x + sdWorld.my_entity.look_x ) / 2, 1 - 10/11, GSPEED/30 ) * sdWorld.mouse_speed_morph + sdWorld.camera.x * ( 1 - sdWorld.mouse_speed_morph );
							sdWorld.camera.y = sdWorld.MorphWithTimeScale( sdWorld.camera.y, ( sdWorld.my_entity.y + sdWorld.my_entity.look_y ) / 2, 1 - 10/11, GSPEED/30 ) * sdWorld.mouse_speed_morph + sdWorld.camera.y * ( 1 - sdWorld.mouse_speed_morph );
						}
						else
						{
							//sdWorld.camera.x = ( sdWorld.my_entity.x + sdWorld.my_entity.look_x ) / 2;
							//sdWorld.camera.y = ( sdWorld.my_entity.y + sdWorld.my_entity.look_y ) / 2;
							//for ( let i = 0; i < 30; i++ )
							{
								sdWorld.camera.x = sdWorld.MorphWithTimeScale( sdWorld.camera.x, ( sdWorld.my_entity.x + sdWorld.my_entity.look_x ) / 2, 0.5, GSPEED * 30 ) * sdWorld.mouse_speed_morph + sdWorld.camera.x * ( 1 - sdWorld.mouse_speed_morph );
								sdWorld.camera.y = sdWorld.MorphWithTimeScale( sdWorld.camera.y, ( sdWorld.my_entity.y + sdWorld.my_entity.look_y ) / 2, 0.5, GSPEED * 30 ) * sdWorld.mouse_speed_morph + sdWorld.camera.y * ( 1 - sdWorld.mouse_speed_morph );
							}
						}
					}
					
					if ( sdWorld.mouse_speed_morph < 1 )
					{
						sdWorld.camera.x = sdWorld.camera.x * sdWorld.mouse_speed_morph + sdWorld.my_entity.x * ( 1 - sdWorld.mouse_speed_morph );
						sdWorld.camera.y = sdWorld.camera.y * sdWorld.mouse_speed_morph + sdWorld.my_entity.y * ( 1 - sdWorld.mouse_speed_morph );
					}
					

					sdWorld.camera.x = Math.round( sdWorld.camera.x * sdWorld.camera.scale ) / sdWorld.camera.scale;
					sdWorld.camera.y = Math.round( sdWorld.camera.y * sdWorld.camera.scale ) / sdWorld.camera.scale;

					sdWorld.camera.scale = sdWorld.MorphWithTimeScale( sdWorld.camera.scale, sdWorld.target_scale, 1 - 10/11, GSPEED/30, 0.01 );

					//sdWorld.camera.x = sdWorld.my_entity.x;
					//sdWorld.camera.y = sdWorld.my_entity.y;
					//sdWorld.camera.scale = 2;
					
					
					
					if ( sdWorld.camera.x < sdWorld.my_entity.x - 400 )
					sdWorld.camera.x = sdWorld.my_entity.x - 400;
					if ( sdWorld.camera.x > sdWorld.my_entity.x + 400 )
					sdWorld.camera.x = sdWorld.my_entity.x + 400;

					if ( sdWorld.camera.y < sdWorld.my_entity.y - 200 )
					sdWorld.camera.y = sdWorld.my_entity.y - 200;
					if ( sdWorld.camera.y > sdWorld.my_entity.y + 200 )
					sdWorld.camera.y = sdWorld.my_entity.y + 200;

					/*if ( sdRenderer.visual_settings === 4 )
					{
						sdRenderer.ctx.camera.position.x = sdWorld.camera.x;
						sdRenderer.ctx.camera.position.y = sdWorld.camera.y;
						sdRenderer.ctx.camera.position.z = -811 / sdWorld.camera.scale;
					}*/

					if ( sdWorld.my_entity.is( sdPlayerSpectator ) )
					{
						sdWorld.my_entity.look_x = sdWorld.my_entity.x;
						sdWorld.my_entity.look_y = sdWorld.my_entity.y;
					}
					else
					if ( sdWorld.my_entity._frozen <= 0 )
					//if ( sdWorld.my_entity.AllowClientSideState() )
					{
						sdWorld.my_entity.look_x = sdWorld.mouse_world_x;
						sdWorld.my_entity.look_y = sdWorld.mouse_world_y;
					}
				}
				
				sdSound.HandleMatterChargeLoop( GSPEED );
			}
		//}
		
		let t3 = Date.now();
		
		if ( sdWorld.is_server )
		{
			let sockets = sdWorld.sockets;
			sdWorld.leaders.length = 0;
			for ( let i2 = 0; i2 < sockets.length; i2++ )
			{
				if ( 
						sockets[ i2 ].character && 
						( !sdWorld.server_config.only_admins_can_spectate || !sockets[ i2 ].character.is( sdPlayerSpectator ) ) && 
						!sockets[ i2 ].character._is_being_removed 
				)
				sdWorld.leaders.push({ name:sockets[ i2 ].character.title, name_censored:sockets[ i2 ].character.title_censored, score:sockets[ i2 ].GetScore(), here:1 });
			
				if ( sockets[ i2 ].ffa_warning > 0 )
				{
					sockets[ i2 ].ffa_warning -= GSPEED / ( 30 * 60 * 5 ); // .ffa_warning is decreased by 1 once in 5 minutes
					
					if ( sockets[ i2 ].ffa_warning <= 0 )
					{
						sockets[ i2 ].ffa_warning = 0;
						sockets[ i2 ].SDServiceMessage( 'Your respawn rate has been restored' );
					}
				}
			}

			sdWorld.leaders_global = sdWorld.leaders.slice();
			
			if ( sdWorld.outgoing_server_connections_obj )
			{
				for ( let remote_server_url in sdWorld.outgoing_server_connections_obj )
				{
					let socket = sdServerToServerProtocol.outgoing_connections[ remote_server_url ];
					/*
					for ( let i = 0; i < socket.leaders.length; i++ )
					{
						socket.leaders[ i ].here = 0;
						sdWorld.leaders_global.push( socket.leaders[ i ] );
					}*/
					
					sdWorld.leaders_global.push( ...socket.leaders );
				}
			}
			
			sdWorld.leaders_global.sort((a,b)=>
			{
				/*if ( b.here > a.here )
				return 1;
			
				if ( b.here < a.here )
				return -1;
				*/
				return b.score - a.score;
			});
			
			if ( sdWorld.leaders_global.length > 30 )
			sdWorld.leaders_global = sdWorld.leaders_global.slice( 0, 30 );
		}
		
		let t4 = Date.now();
		IncludeTimeCost( 'leaders_and_warnings', t4 - t3 );
		
		//if ( sdWorld.world_hash_positions_recheck_keys.length > 0 )
		if ( sdWorld.world_hash_positions_recheck_keys.size > 0 )
		{
			let s = Math.max( 32, sdWorld.world_hash_positions_recheck_keys.size * 0.1 );
			
			//for ( var s = Math.max( 32, sdWorld.world_hash_positions_recheck_keys.size * 0.1 ); s >= 0; s-- )
			for ( const x of sdWorld.world_hash_positions_recheck_keys )
			{
				//let x = sdWorld.world_hash_positions_recheck_keys[ 0 ];

				if ( sdWorld.world_hash_positions.has( x ) )
				if ( sdWorld.world_hash_positions.get( x ).arr.length === 0 )
				{
					//sdWorld.world_hash_positions.get( x ).unlinked = globalThis.getStackTrace();
					sdWorld.world_hash_positions.delete( x );
				}

				//sdWorld.world_hash_positions_recheck_keys.shift();
				sdWorld.world_hash_positions_recheck_keys.delete( x );
				
				s--;
				if ( s < 0 )
				break;
			}
		}
		
		let t5 = Date.now();
		IncludeTimeCost( 'world_hash_positions_recheck_keys', t5 - t4 );
		
		sdTimer.ThinkNow();
		
		
		if ( sdWorld.server_config.onExtraWorldLogic )
		sdWorld.server_config.onExtraWorldLogic( GSPEED );
	
		let t6 = Date.now();
		IncludeTimeCost( 'onExtraWorldLogic', t6 - t5 );
		
		if ( sdWorld.is_server )
		{
			sdWorld.last_frame_time = t5 - t2;
			//sdWorld.last_slowest_class = 'nothing';
			
			if ( sdEntity.snapshot_clear_crawler_i < sdEntity.entities.length )
			{
				if ( sdEntity.entities[ sdEntity.snapshot_clear_crawler_i ]._snapshot_cache_frame < sdWorld.frame - 10 )
				{
					sdEntity.entities[ sdEntity.snapshot_clear_crawler_i ]._snapshot_cache_frame = -1;
					sdEntity.entities[ sdEntity.snapshot_clear_crawler_i ]._snapshot_cache = null;
				}
				sdEntity.snapshot_clear_crawler_i++;
			}
			else
			sdEntity.snapshot_clear_crawler_i = 0;
		}
		
		sdDeepSleep.GlobalThink( GSPEED );
		
		sdWater.GlobalThink( GSPEED );
		sdRescueTeleport.GlobalThink( GSPEED );
		sdBaseShieldingUnit.GlobalThink( GSPEED );
		//sdSteeringWheel.GlobalThink( GSPEED );
		
		// Keep it last:
		sdWorld.frame++;
	}
	
		
	static mod( a, n )
	{
		return ((a%n)+n)%n;
	}
	
	// custom_filtering_method( another_entity ) should return true in case if surface can not be passed through
	static CheckWallExistsBox( x1, y1, x2, y2, ignore_entity=null, ignore_entity_classes=null, include_only_specific_classes=null, custom_filtering_method=null ) // under 32x32 boxes unless line with arr = sdWorld.RequireHashPosition( x1 + xx * 32, y1 + yy * 32 ); changed
	{
		if ( y1 < sdWorld.world_bounds.y1 || 
			 y2 > sdWorld.world_bounds.y2 || 
			 x1 < sdWorld.world_bounds.x1 ||
			 x2 > sdWorld.world_bounds.x2 )
		{
			sdWorld.last_hit_entity = null;
			return true;
		}
		
		let arr;
		let i;
		let arr_i;
		let class_str;
		let arr_i_x;
		let arr_i_y;
		
		var xx_from = sdWorld.FastFloor( x1 / CHUNK_SIZE ); // Overshoot no longer needed, due to big entities now taking all needed hash arrays
		var yy_from = sdWorld.FastFloor( y1 / CHUNK_SIZE );
		var xx_to = sdWorld.FastCeil( x2 / CHUNK_SIZE );
		var yy_to = sdWorld.FastCeil( y2 / CHUNK_SIZE );
		
		if ( xx_to === xx_from )
		xx_to++;
		
		if ( yy_to === yy_from )
		yy_to++;
	
		let xx,yy;
		for ( xx = xx_from; xx < xx_to; xx++ )
		for ( yy = yy_from; yy < yy_to; yy++ )
		{
			arr = sdWorld.RequireHashPosition( xx * CHUNK_SIZE, yy * CHUNK_SIZE ).arr;
			
			for ( i = 0; i < arr.length; i++ )
			{
				arr_i = arr[ i ];
						
				if ( arr_i !== ignore_entity )
				{
					arr_i_x = arr_i.x;
					
					if ( x2 > arr_i_x + arr_i._hitbox_x1 )
					if ( x1 < arr_i_x + arr_i._hitbox_x2 )
					{
						arr_i_y = arr_i.y;
						
						if ( y2 > arr_i_y + arr_i._hitbox_y1 )
						if ( y1 < arr_i_y + arr_i._hitbox_y2 )
						{
							const arr_i_is_bg_entity = arr_i.IsBGEntity();
							
							//if ( arr_i.GetClass() === 'sdButton' )
							//debugger;
							
							if ( arr_i_is_bg_entity === 10 ) // sdDeepSleep
							{
								/* Fighting the case when area would be instantly woken up by random sdDrone from nearby area... Let's wake them up by physically colliding only and whenever players see these
						
								arr_i.WakeUpArea();
									
								*/
								if ( arr_i.ThreatAsSolid() )
								{
									sdWorld.last_hit_entity = null;
									return true;
								}
							}
							else
							if ( ignore_entity === null || arr_i_is_bg_entity === ignore_entity.IsBGEntity() )
							//if ( include_only_specific_classes || arr_i._hard_collision )
							if ( include_only_specific_classes || custom_filtering_method || arr_i._hard_collision ) // custom_filtering_method is needed here to prevent sdButton overlap during building
							if ( !arr_i._is_being_removed )
							{
								if ( include_only_specific_classes || ignore_entity_classes )
								class_str = arr_i.GetClass();

								if ( include_only_specific_classes && include_only_specific_classes.indexOf( class_str ) === -1 )
								{
								}
								else
								if ( ignore_entity_classes && ignore_entity_classes.indexOf( class_str ) !== -1 )
								{
								}
								else
								if ( custom_filtering_method === null || custom_filtering_method( arr_i ) )
								{
									sdWorld.last_hit_entity = arr_i;
									return true;
								}
							}
						}
					}
				}
			}
		}
	
		return false;
	}
	
	static CheckSolidDeepSleepExistsAtBox( x1, y1, x2, y2, ignore_cell=null, include_non_solid=false )
	{
		if ( y1 < sdWorld.world_bounds.y1 || 
			 y2 > sdWorld.world_bounds.y2 || 
			 x1 < sdWorld.world_bounds.x1 ||
			 x2 > sdWorld.world_bounds.x2 )
		{
			return false;
		}
		
		let arr;
		let i;
		let arr_i;
		let arr_i_x;
		let arr_i_y;
		
		var xx_from = sdWorld.FastFloor( x1 / CHUNK_SIZE ); // Overshoot no longer needed, due to big entities now taking all needed hash arrays
		var yy_from = sdWorld.FastFloor( y1 / CHUNK_SIZE );
		var xx_to = sdWorld.FastCeil( x2 / CHUNK_SIZE );
		var yy_to = sdWorld.FastCeil( y2 / CHUNK_SIZE );
		
		if ( xx_to === xx_from )
		xx_to++;
		
		if ( yy_to === yy_from )
		yy_to++;
	
		let xx,yy;
		for ( xx = xx_from; xx < xx_to; xx++ )
		for ( yy = yy_from; yy < yy_to; yy++ )
		{
			arr = sdWorld.RequireHashPosition( xx * CHUNK_SIZE, yy * CHUNK_SIZE ).arr;
			
			for ( i = 0; i < arr.length; i++ )
			{
				arr_i = arr[ i ];
						
				{
					arr_i_x = arr_i.x;
					
					if ( x2 > arr_i_x + arr_i._hitbox_x1 )
					if ( x1 < arr_i_x + arr_i._hitbox_x2 )
					{
						arr_i_y = arr_i.y;
						
						if ( y2 > arr_i_y + arr_i._hitbox_y1 )
						if ( y1 < arr_i_y + arr_i._hitbox_y2 )
						{
							const arr_i_is_bg_entity = arr_i.IsBGEntity();
							
							//if ( arr_i.GetClass() === 'sdButton' )
							//debugger;
							
							if ( arr_i_is_bg_entity === 10 ) // sdDeepSleep
							if ( arr_i !== ignore_cell )
							if ( include_non_solid || arr_i.ThreatAsSolid() )
							return true;
						}
					}
				}
			}
		}
	
		return false;
	}
	
	
	static FilterOnlyVisionBlocking( e )
	{
		return e.is( sdBlock ) || e.is( sdDoor );
	}
	static FilterShieldedWallsAndDoors( e )
	{
		return ( e.is( sdBlock ) || e.is( sdDoor ) && e._shielded && !e._shielded._is_being_removed );
	}
	static CheckLineOfSight( x1, y1, x2, y2, ignore_entity=null, ignore_entity_classes=null, include_only_specific_classes=null, custom_filtering_method=null ) // sdWorld.last_hit_entity will be set if false, but not if world edge was met
	{
		var di = sdWorld.Dist2D( x1,y1,x2,y2 );
		//var step = 16;
		var step = 8;
		
		for ( var s = step / 2; s < di - step / 2; s += step )
		{
			var x = x1 + ( x2 - x1 ) / di * s;
			var y = y1 + ( y2 - y1 ) / di * s;
			if ( sdWorld.CheckWallExists( x, y, ignore_entity, ignore_entity_classes, include_only_specific_classes, custom_filtering_method ) )
			return false;
		}
		return true;
	}
	static TraceRayPoint( x1, y1, x2, y2, ignore_entity=null, ignore_entity_classes=null, include_only_specific_classes=null, custom_filtering_method=null )
	{
		var di = sdWorld.Dist2D( x1,y1,x2,y2 );
		//var step = 16;
		var step = 8;
		
		for ( var s = step / 2; s < di - step / 2; s += step )
		{
			var x = x1 + ( x2 - x1 ) / di * s;
			var y = y1 + ( y2 - y1 ) / di * s;
			if ( sdWorld.CheckWallExists( x, y, ignore_entity, ignore_entity_classes, include_only_specific_classes, custom_filtering_method ) )
			{
				sdWorld.reusable_closest_point.x = x;
				sdWorld.reusable_closest_point.y = y;
				return sdWorld.reusable_closest_point;
			}
		}
		return null;
	}
	static CheckWallExists( x, y, ignore_entity=null, ignore_entity_classes=null, include_only_specific_classes=null, custom_filtering_method=null )
	{
		if ( y < sdWorld.world_bounds.y1 || 
			 y > sdWorld.world_bounds.y2 || 
			 x < sdWorld.world_bounds.x1 ||
			 x > sdWorld.world_bounds.x2 )
		{
			sdWorld.last_hit_entity = null;
			return true;
		}
	
		let arr;
		let i;
		let arr_i;
		let class_str;
		let arr_i_x;
		let arr_i_y;
	
		//for ( var xx = -1; xx <= 2; xx++ )
		//for ( var yy = -1; yy <= 2; yy++ )
		//for ( var xx = -1; xx <= 0; xx++ ) Was not enough for doors, sometimes they would have left vertical part lacking collision with players
		//for ( var yy = -1; yy <= 0; yy++ )
		//for ( var xx = -1; xx <= 1; xx++ ) // TODO: Overshoot no longer needed, due to big entities now taking all needed hash arrays?
		//for ( var yy = -1; yy <= 1; yy++ )
		{
			//arr = sdWorld.RequireHashPosition( x + xx * CHUNK_SIZE, y + yy * CHUNK_SIZE );
			arr = sdWorld.RequireHashPosition( x, y ).arr;
			for ( i = 0; i < arr.length; i++ )
			{
				arr_i = arr[ i ];
				
				if ( arr_i !== ignore_entity )
				if ( !arr_i._is_being_removed )
				{
					arr_i_x = arr_i.x;
					
					if ( x >= arr_i_x + arr_i._hitbox_x1 )
					if ( x <= arr_i_x + arr_i._hitbox_x2 )
					{
						arr_i_y = arr_i.y;
						
						if ( y >= arr_i_y + arr_i._hitbox_y1 )
						if ( y <= arr_i_y + arr_i._hitbox_y2 )
						{
							const arr_i_is_bg_entity = arr_i.IsBGEntity();
							
							if ( arr_i_is_bg_entity === 10 ) // sdDeepSleep
							{
								/* Fighting the case when area would be instantly woken up by random sdDrone from nearby area... Let's wake them up by physically colliding only and whenever players see these
						
								arr_i.WakeUpArea();
									
								*/
								if ( arr_i.ThreatAsSolid() )
								{
									sdWorld.last_hit_entity = null;
									return true;
								}
							}
							else
							if ( ignore_entity === null || arr_i_is_bg_entity === ignore_entity.IsBGEntity() )
							if ( include_only_specific_classes || arr_i._hard_collision )
							{
								if ( include_only_specific_classes || ignore_entity_classes )
								class_str = arr_i.GetClass();

								if ( include_only_specific_classes && include_only_specific_classes.indexOf( class_str ) === -1 )
								{
								}
								else
								if ( ignore_entity_classes && ignore_entity_classes.indexOf( class_str ) !== -1 )
								{
								}
								else
								if ( custom_filtering_method === null || custom_filtering_method( arr_i ) )
								{
									sdWorld.last_hit_entity = arr_i;
									return true;
								}
							}
						}
					}
				}
			}
		}
	
		return false;
	}
	
	static GetCrystalHue( v, glow_radius_scale=1, glow_opacity_hex='' )
	{
		//if ( v > 40 )
		{
			if ( v === 5120 * 16 /*10240*/ ) // === sdCrystal.anticrystal_value
			{
				return 'brightness(0) drop-shadow(0px 0px '+( glow_radius_scale * 6 )+'px #000000'+glow_opacity_hex+')';
			}
			/*else
			if ( v === 5120 * 8 ) // Task reward / Advanced matter container
			{
				return 'brightness(1) saturate(0) drop-shadow(0px 0px '+( glow_radius_scale * 6 )+'px #FFFFFF'+glow_opacity_hex+')';
			}*/
			else
			if ( v === 5120 * 8 ) // new 2022
			{
				return 'hue-rotate(' + ( 75 ) + 'deg) brightness(1.7) drop-shadow(0px 0px '+( glow_radius_scale * 6 )+'px #AAAAFF'+glow_opacity_hex+')';
			}
			else
			if ( v === 5120 * 4 ) // new 2022
			{
				return 'hue-rotate(' + ( 330 ) + 'deg) brightness(1.6) drop-shadow(0px 0px '+( glow_radius_scale * 6 )+'px #AAFFFF'+glow_opacity_hex+')';
			}
			else
			if ( v === 5120 * 2 ) // new 2022
			{
				return 'hue-rotate(' + ( 270 ) + 'deg) brightness(1.6) drop-shadow(0px 0px '+( glow_radius_scale * 6 )+'px #AAFFAA'+glow_opacity_hex+')';
			}
			else
			if ( v === 5120 )
			{
				return 'hue-rotate(' + ( 200 ) + 'deg) brightness(1.3) drop-shadow(0px 0px '+( glow_radius_scale * 6 )+'px #FFFFAA'+glow_opacity_hex+')';
			}
			else
			if ( v === 2560 )
			{
				return 'hue-rotate(' + ( 170 ) + 'deg) brightness(0.8) contrast(2)';
			}
			else
			{
				return 'hue-rotate(' + ( v - 40 ) + 'deg)';
			}

		}
		
		return 'none';
	}
	
	static BasicEntityBreakEffect( that, debris_count=3, max_rand_velocity=3, volume=0.25, pitch=1 )
	{
		if ( sdWorld.is_server )
		{
			sdSound.PlaySound({ name:'block4', 
				x: that.x, 
				y: that.y, 
				volume: volume, 
				pitch: pitch });
			
			for ( let i = 0; i < debris_count; i++ )
			{
				let a = Math.random() * 2 * Math.PI;
				let s = Math.random() * max_rand_velocity;

				let k = Math.random();

				let x = that.x + that._hitbox_x1 + Math.random() * ( that._hitbox_x2 - that._hitbox_x1 );
				let y = that.y + that._hitbox_y1 + Math.random() * ( that._hitbox_y2 - that._hitbox_y1 );
				
				//console.log( 'BasicEntityBreakEffect', that.sx, k, a, s );

				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: ( that.sx || 0 )*k + Math.sin(a)*s, sy: ( that.sy || 0 )*k + Math.cos(a)*s, filter:that.GetBleedEffectFilter() });
			}
		}
	}
	
	static hexToRgb(hex) 
	{
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

		return result ? [
		  parseInt(result[1], 16),
		  parseInt(result[2], 16),
		  parseInt(result[3], 16)
		] : null;
	}
	static ReplaceColorInSDFilter( sd_filter, from, to )
	{
		debugger; // Outdated, use _v2 instead
		
		if ( typeof from === 'string' )
		{
			from = sdWorld.hexToRgb( from );
			if ( from === null )
			return;
		}
		else
		//if ( typeof from !== 'array' )
		if ( !( from instanceof Array ) )
		return;

		if ( typeof to === 'string' )
		{
			to = sdWorld.hexToRgb( to );
			if ( to === null )
			return;
		}
		else
		//if ( typeof to !== 'array' )
		if ( !( to instanceof Array ) )
		return;
		
		if ( typeof sd_filter[ from[ 0 ] ] === 'undefined' )
		sd_filter[ from[ 0 ] ] = {};
	
		if ( typeof sd_filter[ from[ 0 ] ][ from[ 1 ] ] === 'undefined' )
		sd_filter[ from[ 0 ] ][ from[ 1 ] ] = {};
	
		//if ( typeof sd_filter[ from[ 0 ] ][ from[ 1 ] ][ from[ 2 ] ] === 'undefined' )
		sd_filter[ from[ 0 ] ][ from[ 1 ] ][ from[ 2 ] ] = to;
	}
	static GetColorOfSDFilter( sd_filter, from )
	{
		for ( let i = 0; i < sd_filter.s.length; i += 12 )
		{
			let color_hex = sd_filter.s.substring( i, i + 6 );

			if ( color_hex === from )
			{
				return sd_filter.s.substring( i + 6, i + 12 );
				//sd_filter.s = sd_filter.s.substring( 0, i + 6 ) + to + sd_filter.s.substring( i + 12 );
				//return;
			}
		}
		return from;
	}
	static ColorArrayToHex( color ) // RGBtohex
	{
		color[ 0 ] = Math.min( Math.max( 0, ~~color[ 0 ] ), 255 );
		color[ 1 ] = Math.min( Math.max( 0, ~~color[ 1 ] ), 255 );
		color[ 2 ] = Math.min( Math.max( 0, ~~color[ 2 ] ), 255 );
		
		color[ 0 ] = color[ 0 ].toString( 16 );
		if ( color[ 0 ].length < 2 )
		color[ 0 ] = '0' + color[ 0 ];
		
		color[ 1 ] = color[ 1 ].toString( 16 );
		if ( color[ 1 ].length < 2 )
		color[ 1 ] = '0' + color[ 1 ];
		
		color[ 2 ] = color[ 2 ].toString( 16 );
		if ( color[ 2 ].length < 2 )
		color[ 2 ] = '0' + color[ 2 ];
	
		//if ( color.join( '' ).length !== 6 )
		//throw new Error( 'Wrong ColorArrayToHex length: ' + JSON.stringify( color ) );
				
		return color.join( '' );
	}
	static MultiplyHexColor( hex, v )
	{
		let color = sdWorld.hexToRgb( hex );
		
		color[ 0 ] = ~~( color[ 0 ] * v );
		color[ 1 ] = ~~( color[ 1 ] * v );
		color[ 2 ] = ~~( color[ 2 ] * v );
		
		return sdWorld.ColorArrayToHex( color );
	}
	static GetVersion2SDFilterFromVersion1SDFilter( sd_filter )
	{
		if ( sd_filter )
		if ( !sd_filter.s )
		{
			let s = '';
			for ( let r in sd_filter )
			{
				for ( let g in sd_filter[ r ] )
				{
					for ( let b in sd_filter[ r ][ g ] )
					{
						s += sdWorld.ColorArrayToHex( [ r,g,b ] ) + sdWorld.ColorArrayToHex( sd_filter[ r ][ g ][ b ] );
					}
				}
			}
			sd_filter = { s: s };
		}
		
		return sd_filter;
	}
	static ReplaceColorInSDFilter_v2( sd_filter, from, to, replace_existing_color_if_there_is_one=true )
	{
		if ( to === undefined ) // Usually means there is no replacement
		return;
	
		if ( typeof to !== 'string' ) // Malfunctioned replacement from client?
		{
			debugger;
			return;
		}
		
		if ( from.length === 7 )
		from = from.substring( 1 );
	
		if ( to.length === 7 )
		to = to.substring( 1 );
	
		if ( from.length !== 6 )
		throw new Error('Wrong hex color string passed');
	
		if ( to.length !== 6 ) // Malfunctioned replacement from client?
		{
			debugger;
			return;
		}
	
		if ( typeof sd_filter.s !== 'string' )
		throw new Error('SDFilter was not init properly. Use sdWorld.CreateSDFilter() to make new SDFilters');
	
		if ( replace_existing_color_if_there_is_one )
		{
			for ( let i = 0; i < sd_filter.s.length; i += 12 )
			{
				let color_hex = sd_filter.s.substring( i, i + 6 );
				
				if ( color_hex === from )
				{
					sd_filter.s = sd_filter.s.substring( 0, i + 6 ) + to + sd_filter.s.substring( i + 12 );
					return;
				}
			}
		}
		sd_filter.s += from;
		sd_filter.s += to;
	}
	static ConvertPlayerDescriptionToSDFilter( player_description )
	{
		debugger; // Outdated, use _v2 instead
		
		let ret = {};
		
		sdWorld.ReplaceColorInSDFilter( ret, '#c0c0c0', player_description['color_bright'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#808080', player_description['color_dark'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#00ff00', player_description['color_bright3'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#007f00', player_description['color_dark3'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#ff0000', player_description['color_visor'] );
		//sdWorld.ReplaceColorInSDFilter( ret, '#800000', player_description['color_splashy'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#000080', player_description['color_suit'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#800080', player_description['color_suit2'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#ff00ff', player_description['color_dark2'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#000000', player_description['color_shoes'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#808000', player_description['color_skin'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#0000ff', player_description['color_extra1'] );
		
		if ( player_description['voice6'] ) // Falkok voice
		sdWorld.ReplaceColorInSDFilter( ret, '#800000', '#006480' ); // hue +73 deg
		
		if ( player_description['voice7'] ) // Robot voice
		sdWorld.ReplaceColorInSDFilter( ret, '#800000', '#000000' ); // hue +73 deg

		if ( player_description['voice10'] ) // Silence
		sdWorld.ReplaceColorInSDFilter( ret, '#800000', '#000000' ); // hue +73 deg

		return ret;
	}
	
	
	
	static CreateSDFilter()
	{
		return { s: '' };
	}
	
	static ConvertPlayerDescriptionToSDFilter_v2( player_description )
	{
		let ret = sdWorld.CreateSDFilter();
		
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#c0c0c0', player_description['color_bright'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#808080', player_description['color_dark'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#00ff00', player_description['color_bright3'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#007f00', player_description['color_dark3'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#ff0000', player_description['color_visor'], false );
		//sdWorld.ReplaceColorInSDFilter_v2( ret, '#800000', player_description['color_splashy'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#000080', player_description['color_suit'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#800080', player_description['color_suit2'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#ff00ff', player_description['color_dark2'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#000000', player_description['color_shoes'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#808000', player_description['color_skin'], false );
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#0000ff', player_description['color_extra1'], false );
		
		if ( player_description['voice6'] ) // Falkok voice
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#800000', '#006480', false ); // hue +73 deg
		
		if ( player_description['voice7'] ) // Robot voice
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#800000', '#000000', false ); // hue +73 deg
		
		if ( player_description['voice8'] ) // Council voice
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#800000', '#ffaa00', false ); 

		if ( player_description['voice9'] ) // Setr voice
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#800000', '#3e5ede', false ); 

		if ( player_description['voice10'] ) // Silence
		sdWorld.ReplaceColorInSDFilter_v2( ret, '#800000', '#000000', false ); // hue +73 deg
	
		return ret;
	}
	
		
	static ExtractHueRotate( old_hue, old_brightness, filter_str )
	{
		let sd_hue_rotation = old_hue;
		
		let parts = filter_str.split( ')' );

				
		//if ( old_brightness === 0 )
		//throw new Error( 'old_brightness = 0' );
					
		for ( let i = 0; i < parts.length; i++ )
		{
			let part = parts[ i ];
			part = part.trim();

			if ( part.length > 0 )
			{
				let parts2 = part.split( '(' );

				let func_name = parts2[ 0 ];
				let value_str = parts2[ 1 ];

				let keep = true;

				if ( func_name === 'hue-rotate' )
				{
					sd_hue_rotation += parseFloat( value_str );
					keep = false;
				}

				if ( func_name === 'brightness' )
				{
					if ( value_str.indexOf( '%' ) !== -1 )
					old_brightness *= parseFloat( value_str ) / 100;
					else
					old_brightness *= parseFloat( value_str );
				
					//if ( old_brightness === 0 )
					//throw new Error( 'old_brightness = 0 after mult by ' + value_str + ' (='+parseFloat( value_str )+')' );
				
					keep = false;
				}

				if ( keep )
				{
					if ( part[ part.length - 1 ] !== ')' )
					part += ')';
				}
				else
				part = '';

				parts[ i ] = part;
			}
		}

		return [ sd_hue_rotation, old_brightness, parts.join('') ];
	}
	
	
	static ConvertPlayerDescriptionToHelmet( player_description )
	{
		if ( player_description['entity2'] )
		{
			for ( var i = 1; i < sdPlayerDrone.drone_helmets.length; i++ )
			if ( player_description[ 'drone_helmet' + i ] )
			return i;
		}
		else // Default is humanoid because of old styles
		{
			for ( var i = 1; i < sdCharacter.img_helmets.length; i++ )
			if ( player_description[ 'helmet' + i ] )
			return i;
		}
		return 1;
	}
	static ConvertPlayerDescriptionToBody( player_description )
	{
		for ( var i = 1; i < sdCharacter.skins.length; i++ )
		if ( player_description[ 'body' + i ] )
		return i;

		return 1;
	}
	static ConvertPlayerDescriptionToLegs( player_description )
	{
		for ( var i = 1; i < sdCharacter.skins.length; i++ )
		if ( player_description[ 'legs' + i ] )
		return i;

		return 1;
	}
	static ConvertPlayerDescriptionToEntity( player_description )
	{
		for ( var i = 0; i < sdWorld.allowed_player_classes.length; i++ )
		if ( player_description[ 'entity' + ( i + 1 ) ] )
		return sdWorld.allowed_player_classes[ i ];

		return 1;
	}
	static ConvertPlayerDescriptionToVoice( player_description )
	{
		let _voice = {
			wordgap: 0,
			pitch: 50,
			speed: 175,
			variant: 'klatt',
			voice: 'en'
		};
		
		if ( player_description['voice1'] )
		{
			_voice.variant = 'klatt';
			_voice.pitch = 0;
		}
		if ( player_description['voice2'] )
		{
			_voice.variant = 'klatt';
			_voice.pitch = 25;
		}
		if ( player_description['voice3'] )
		{
			_voice.variant = 'klatt';
			_voice.pitch = 50;
		}
		if ( player_description['voice4'] )
		{
			_voice.variant = 'f1'; // f5
			_voice.pitch = 75;
		}
		if ( player_description['voice5'] )
		{
			_voice.variant = 'f1'; // f5
			_voice.pitch = 100;
		}
		if ( player_description['voice6'] )
		{
			_voice.variant = 'whisperf';
			_voice.pitch = 20;
			_voice.speed = 160;
		}
		if ( player_description['voice7'] )
		{
			_voice.variant = 'klatt3';
			_voice.pitch = 0;
			_voice.speed = 175;
		}
		if ( player_description['voice8'] )
		{
			_voice.variant = 'croak';
			_voice.pitch = 1;
			_voice.speed = 140;
			_voice.voice = 'es-la';
		}
		if ( player_description['voice9'] )
		{
			_voice.variant = 'm2';
			_voice.pitch = 40;
			_voice.speed = 60;
			_voice.voice = 'hr';
		}
		if ( player_description['voice10'] )
		{
			_voice.variant = 'silence';
			_voice.pitch = 0;
		}
		
		return _voice;
	}
	
	static ApplyPlayerSettingsToPlayer( character_entity, player_settings, socket ) 
	{
		character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( player_settings );
		character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( player_settings );

		character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( player_settings );
		character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( player_settings );
		character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( player_settings );

		character_entity.title = player_settings.hero_name;
		character_entity.title_censored = ( typeof sdModeration !== 'undefined' && socket ) ? sdModeration.IsPhraseBad( character_entity.title, socket ) : false;
		
		character_entity._allow_self_talk = ( player_settings.selftalk1 ) || false;
	}
	
	static RequirePassword( message_and_color )
	{
		document.querySelector('.password_screen').style.display = 'block';
		
		document.getElementById('password_screen_message').textContent = message_and_color[ 0 ];
		document.getElementById('password_screen_message').style.color = message_and_color[ 1 ];
	}
	
	static CreateImageFromFile( filename, cb=null ) // In cases when processing calls are added to filename - expect correct image to be returned as part of return_value.canvas_override
	{
		// For singleplayer lost effect
		if ( typeof Image !== 'undefined' )
		if ( filename instanceof Image )
		{
			filename = filename.filename;
		}
		
		filename = filename.split(' -> ').join('->'); // Remove prettiness to save pair of bytes when transfering sdLost data
		
		if ( sdWorld.is_server && !sdWorld.is_singleplayer )
		return filename; // Actually return image name now just so sdLost could be drawn using these
		
		if ( sdWorld.lost_images_cache && sdWorld.lost_images_cache[ filename ] )
		{
			let img = sdWorld.lost_images_cache[ filename ];
			img.filename = filename;
			
			if ( cb )
			{
				if ( img.loaded )
				cb();
				else
				img.callbacks.push( cb );
			}
			
			return img;
		}
	
		let img = null;
		
		//if ( filename_parts.length > 1 )
		//img = sdBitmap.CreateBitmap(); // Assume it should be a canvas on its own
		//else
		img = new Image();
		img.filename = filename;
		
		let filename_parts = filename.split('->'); // Preprocessing right in the file name (for sdLost to be able to require such images as well)
		
		if ( filename_parts.length > 1 )
		img.canvas_override = sdBitmap.CreateBitmap();
		else
		img.canvas_override = null;
		
		img.ever_requested = false;
		img.pending_src = './assets/' + filename_parts[ 0 ] + '.png';
		
		img.loaded = false;
		
		img.callbacks = [];
		
		if ( cb )
		img.callbacks.push( cb );
	
		img.RequiredNow = ()=>
		{
			if ( !img.ever_requested )
			{
				img.ever_requested = true;
				img.src = img.pending_src;
			}
		};
	
		img.onload = ()=>
		{
			img.loaded = true; 
			
			if ( filename_parts.length > 1 )
			{
				for ( let i = 1; i < filename_parts.length; i++ )
				{
					//try
					//{
						let method_call = filename_parts[ i ];

						let colon_pos = method_call.indexOf( '(' );
						let method = method_call.substring( 0, colon_pos );
						//let params = JSON.parse( method_call.substring( colon_pos + 1 ).split('(').join('[').split(')').join(']') );
						
						let s = method_call.substring( colon_pos + 1 );
						
						s = s.substring( 0, s.length - 1 );
						
						let params = JSON.parse( '['+s+']' );

						if ( method === 'CreateBitmap' )
						throw new Error('Method is not allowed and is pointless here');

						sdBitmap[ method ]( img, ...params );
					//}
					/*catch ( e )
					{
						debugger;
					}*/
				}
			}
			
			for ( let i = 0; i < img.callbacks.length; i++ )
			img.callbacks[ i ]();
		
			img.callbacks = null;
		};
		
		if ( !sdWorld.lost_images_cache )
		sdWorld.lost_images_cache = {};
	
		sdWorld.lost_images_cache[ filename ] = img;
		
		return img;
	}
	static StartOffline( player_settings, full_reset=false, retry=0 )
	{
		let offline_socket = {
			
			GetScore: ()=>
			{
				return 123;
			},
			
			character: null,
			
			post_death_spectate_ttl: 12345,
			
			sd_events: {
				push: ( arr )=>
				{
					if ( arr[ 0 ] === 'EFF' )
					{
						let e = new sdEffect( arr[ 1 ] );
						sdEntity.entities.push( e );
					}
					else
					debugger;
				}
			},
			
			emit: ( command, value )=>
			{
			},
			
			SDServiceMessage: ( v, untranslateables )=>
			{
				sdRenderer.service_mesage_until = sdWorld.time + 6500;
				sdRenderer.service_mesage = v;
				sdRenderer.service_mesage_untranslateables = untranslateables;
			}
		};
		
		sdWorld.is_server = true; 
		sdWorld.is_singleplayer = true; 
		globalThis.sockets = sdWorld.sockets = [
			offline_socket
		];
		
		// From client to server
		globalThis.sd_events = {
			push: ( command, obj )=>
			{
				if ( command[ 0 ] !== 'K1' )
				if ( command[ 0 ] !== 'K0' )
				{
					debugger;
				}
				else
				{
					offline_socket.character._key_states.SetKey( command[ 1 ], ( command[ 0 ] === 'K1' ) ? 1 : 0 );
				}
			}
		};
		
		let socket = globalThis.socket;
		socket.close();
		
		//let w = 20;
		//let h = 10;
		
		let w = 80;
		let h = 30;
		
		//sdWorld.ChangeWorldBounds( -w * 16, -h * 16, w * 16, h * 16 );
		//sdWorld.ChangeWorldBounds( -w * 16, -h * 16, w * 16, h * 16 + 100 * 16 );
		sdWorld.ChangeWorldBounds( -w * 16, -h * 16, w * 16, h * 16 + 30 * 16 );
		
		// Hack
		/*
		for ( let i = 0; i < sdEntity.entities.length; i++ )
		{
			sdEntity.entities[ i ].material = sdBlock.MATERIAL_WALL;
			sdEntity.entities[ i ].remove();
			
			sdEntity.entities[ i ]._broken = false;
		}*/
		
		if ( sdEntity.global_entities.length === 0 )
		sdEntity.entities.push( new sdWeather({}) );
	
		// Stop all events
		sdWorld.server_config = sdServerConfigFull;
		sdWorld.server_config.GetAllowedWorldEvents = ()=>[];
		sdWorld.entity_classes.sdWeather.only_instance._daily_events = [];
		
		globalThis.socket = {
			emit: ( cmd, obj )=>
			{
				let socket = offline_socket;
						
				if ( cmd === 'RESPAWN' )
				{
					let player_settings = obj;
					
					let character_entity;
					
					function SpawnNewPlayer()
					{
						const allowed_classes = sdWorld.allowed_player_classes;

						let preferred_entity = sdWorld.ConvertPlayerDescriptionToEntity( player_settings );

						if ( allowed_classes.indexOf( preferred_entity ) === -1 )
						character_entity = new sdCharacter({ x:0, y:0 });
						else
						character_entity = new sdWorld.entity_classes[ preferred_entity ]({ x:0, y:0 });
					
						sdEntity.entities.push( character_entity );
					}
					
					SpawnNewPlayer();
					
					sdWorld.ApplyPlayerSettingsToPlayer( character_entity, player_settings, null );
					
					sdWorld.my_entity = character_entity;
					sdWorld.my_entity._key_states = sdWorld.my_key_states;
					
					offline_socket.character = sdWorld.my_entity;
					offline_socket.character._socket = offline_socket;
					
					for ( let i = 0; i < sdShop.options.length; i++ )
					if ( sdShop.options[ i ]._class === 'sdGun' )
					if ( sdShop.options[ i ]._min_build_tool_level === 0 )
					if ( sdShop.options[ i ]._min_workbench_level === 0 )
					{
						let gun = new sdGun({ x: character_entity.x, y: character_entity.y, class: sdShop.options[ i ].class });
						sdEntity.entities.push( gun );
					}
				}
				else
				if ( cmd === 'BUILD_SEL' )
				{
					trace( 'build selection', sdShop.options[ obj ], obj );
					
					socket.character._build_params = sdShop.options[ obj ] || null;
				}
				else
				if ( cmd === 'CHAT' )
				{
					if ( obj === '/god 1' )
					socket.character._god = 1;
					else
					if ( obj === '/god 0' )
					socket.character._god = 0;
					else
					socket.character.Say( obj, false );
				}
				else
				if ( cmd === 'ENTITY_CONTEXT_ACTION' )
				{
					let _class = obj[ 0 ];
					let net_id = obj[ 1 ];

					let ent = sdEntity.GetObjectByClassAndNetId( _class, net_id );
					if ( ent !== null && !ent._is_being_removed )
					ent.ExecuteContextCommand( obj[ 2 ], obj[ 3 ], socket.character, socket );
					else
					socket.SDServiceMessage( 'Entity no longer exists' );
				}
				else
				{
					socket.SDServiceMessage( 'Singleplayer mode does not yet supports command "'+cmd+'"' );
					debugger; // In case if it is related to context actions - these need to be moved to entity's ExecuteContextCommand and PopulateContextOptions methods
				}
			},
			
			close: ()=>
			{
			}
		};
		
		sdWorld.Start( player_settings, full_reset, retry );
	}
	static PlayAdAndStart( player_settings, button )
	{
		button.disabled = true; // Prevent double clicks while it might be loading ad
		
		
		let once = true;
		
		if ( player_settings.entity4 )
		{
			navigator.wakeLock.request("screen").then(()=>{
			}).catch(()=>{
				trace( 'Wake lock request failed' );
			});
			
			// Do not show ads in stream logger
			ForceProceedOnce();
		}
		else
		{
			adBreak({
				type: 'preroll',  // ad shows at start of next level
				name: 'game-started-ad',
				adBreakDone: ()=>
				{
					ForceProceedOnce();
				}
			});

			setTimeout( ()=>
			{
				if ( document.querySelectorAll('.adsbygoogle').length > 1 )
				{
					// AdSense works and ad is currently shown
				}
				else
				ForceProceedOnce(); // Fallback

			}, 300 );
		}
		
		function ForceProceedOnce()
		{
			if ( once )
			{
				once = false;
				button.disabled = false;
				sdWorld.Start( player_settings );
			}
		}
	}
	static Start( player_settings, full_reset=false, retry=0 )
	{
		sdSound.AllowSound();

		sdWorld.my_entity_net_id = undefined; // Reset...

		if ( !globalThis.connection_established && !sdWorld.is_singleplayer )
		{
			//alert('Connection is not open yet, for some reason...');
			//console.log('Connection is not open yet, for some reason...');

			if ( retry < 3 )
			setTimeout( ()=>{

				sdWorld.Start( player_settings, full_reset, retry+1 );

			}, 1000 );
			else
			{
				alert('Connection is not open yet, for some reason...');
				console.log('Connection is not open yet, for some reason...');
			}

			return;
		}
		else
		{
				let socket = globalThis.socket;

				globalThis.enable_debug_info = player_settings['bugs2'];

				const BoolToInt = ( v )=>
				{
					return v?1:0;
				};

				//sdRenderer.visual_settings = BoolToInt( player_settings['visuals1'] ) * 1 + BoolToInt( player_settings['visuals2'] ) * 2 + BoolToInt( player_settings['visuals3'] ) * 3 + BoolToInt( player_settings['visuals4'] ) * 4;
				sdRenderer.InitVisuals();

				sdRenderer.resolution_quality = BoolToInt( player_settings['density1'] ) * 1 + BoolToInt( player_settings['density2'] ) * 0.5 + BoolToInt( player_settings['density3'] ) * 0.25;
				window.onresize();

				sdSound.SetVolumeScale( parseFloat( player_settings['volume'] ) / 100 ); // BoolToInt( player_settings['volume1'] ) * 0.4 + BoolToInt( player_settings['volume2'] ) * 0.25 + BoolToInt( player_settings['volume3'] ) * 0.1 );

				sdWorld.client_side_censorship = player_settings['censorship1'] ? true : false;

				sdWorld.soft_camera = player_settings['camera1'] ? true : false;
				
				sdWorld.show_videos = player_settings['censorship3'] ? false : true;

				player_settings.full_reset = full_reset;
				//player_settings.my_hash = [ Math.random(), Math.random(), Math.random(), Math.random(), Math.random() ].join(''); // Sort of password
				//player_settings.my_net_id = undefined;
				/*
				try 
				{
					let v;

					v = localStorage.getItem( 'my_hash' );
					if ( v !== null )
					player_settings.my_hash = v;
					else
					localStorage.setItem( 'my_hash', player_settings.my_hash );

					//v = localStorage.getItem( 'my_net_id' );
					//if ( v !== null )
					//player_settings.my_net_id = v;

				} catch(e){}*/

				//if ( sdWorld.time > player_settings['last_local_time_start'] + 1000 * 60 * 60 * 8 )
				if ( globalThis.will_play_startup_tune )
				{
					globalThis.will_play_startup_tune = false;

					setTimeout( ()=>
					{
						sdSound.PlaySound({ name:'sci_fi_world_start', volume:0.3, _server_allowed:true });
						//sdSound.PlaySound({ name:'piano_world_startB2_cutA', volume:0.3, _server_allowed:true });
					}, 0 );//2500 );
				}

				socket.emit( 'RESPAWN', player_settings );

				sdWorld.GotoGame();
			}
	}
	static GotoGame()
	{
		sdRenderer.canvas.style.display = 'block';
		globalThis.settings_container.style.display = 'none';

		if ( globalThis.preview_interval !== null )
		{
			clearInterval( globalThis.preview_interval );
			globalThis.preview_interval = null;
		}

		globalThis.meSpeak.stop();

		if ( sdWorld.mobile )
		{
			sdSound.AllowSound();
			sdWorld.GoFullscreen();
		}
		
		sdMobileKeyboard.Open();
	}
	static Stop()
	{
		sdMobileKeyboard.Close();
		
		globalThis.ClearWorld();
		
		sdRenderer.canvas.style.display = 'none';
		globalThis.settings_container.style.display = 'block';
		
		if ( globalThis.preview_interval === null )
		{
			globalThis.preview_interval = setInterval( globalThis.preview_fnc, 16 );
		}
		
		globalThis.meSpeak.stop();
		globalThis.socket.emit( 'SELF_EXTRACT' );
	}
	static GetAny( arr )
	{
		let r = Math.random() * arr.length;
		return arr[ ~~r ];
	}
	
	
	static GetDrawOperations( ent ) // Method that is used to collect draw logic for later to be used in sdLost
	{
		let despawn_ragdoll = false;
		
		if ( ent.is( sdCharacter ) )
		{
			if ( !ent._ragdoll )
			{
				ent._ragdoll = new sdCharacterRagdoll( ent );
				
				despawn_ragdoll = true;

				if ( ent.hea > 0 )
				{
					ent._ragdoll.AliveUpdate();
				}
				else
				{
					ent._ragdoll.AliveUpdate();
					for ( let i = 0; i < 90; i++ )
					ent._ragdoll.Think( 1 );
				}
			}
		}
		
		const command_match_table = sdWorld.draw_operation_command_match_table;
		const methods_per_command_id = sdWorld.draw_methods_per_command_id;

		const output = [];
		
		sdWorld.draw_methods_output_ptr = output;
		
		var blend_mode = THREE.NormalBlending;
		
		let any_drawImage_happened = false;
		
		var fake_ctx = new Proxy( 
			{}, 
			{
				get: function( target, name )
				{
					if ( name === 'drawImage' )
					name = 'drawImageFilterCache';
				
					if ( name === 'drawImageFilterCache' )
					{
						any_drawImage_happened = true;
					}
					
					let command_offset = command_match_table.indexOf( name );
					
					if ( command_offset !== -1 )
					{
						let command_id = command_match_table[ command_offset + 1 ];
						
						if ( typeof methods_per_command_id[ command_id ] === 'undefined' )
						{
							methods_per_command_id[ command_id ] = ( ...args )=>
							{ 
								for ( let i = 0; i < args.length; i++ )
								if ( typeof args[ i ] === 'number' )
								args[ i ] = Math.round( args[ i ] * 10 ) / 10; // Some rounding
						
								if ( command_id === 5 ) // Pointless scaling
								{
									if ( args[ 0 ] === 1 )
									if ( args[ 1 ] === 1 )
									return;
								}
								else
								if ( command_id === 4 ) // Pointless rotation
								{
									if ( args[ 0 ] === 0 )
									return;
								}
								else
								if ( command_id === 1 ) // common drawImageFilterCache with -16,-16,32,32
								{
									if ( args.length === 5 )
									if ( args[ 1 ] === -16 )
									if ( args[ 2 ] === -16 )
									if ( args[ 3 ] === 32 )
									if ( args[ 4 ] === 32 )
									{
										//any_drawImage_happened = true;
										sdWorld.draw_methods_output_ptr.push( command_id, args[ 0 ] );
										return;
									}
								}
								
								if ( args.length === 0 ) // ctx.save/restore don't need args
								{
									sdWorld.draw_methods_output_ptr.push( command_id );
									return;
								}
								
								if ( command_id === 1 ) // drawImageFilterCache but with non-normal blending is to ignore, for example sdPlayerDrone has glowing grab effect which should be ignored
								if ( blend_mode !== THREE.NormalBlending )
								{
									return;
								}
								
								sdWorld.draw_methods_output_ptr.push( command_id, args ); // args is already an array
							};
						}
						
						return methods_per_command_id[ command_id ];
					}
					else
					return ()=>{}; // Always return dummy methods unless it is related to drawImage
				},
				set: function( target, prop, value ) 
				{
					if ( prop === 'sd_filter' )
					sdWorld.draw_methods_output_ptr.push( 0, value );
					//sdWorld.draw_methods_output_ptr.push( 0, [ value ] );
					
					if ( prop === '' )
					{
						blend_mode = value;
					}
					
					return true;
				}
			}
		);

		ent.Draw( fake_ctx, false );
		ent.DrawFG( fake_ctx, false );
		
		/*if ( output.length === 0 ) Something like held crystals
		{
			debugger;
			ent.Draw( fake_ctx, false );
			ent.DrawFG( fake_ctx, false );
		}*/
		
		sdWorld.draw_methods_output_ptr = null;
		
		if ( despawn_ragdoll )
		{
			if ( ent._ragdoll )
			{
				ent._ragdoll.Delete(); // Or lese crash if this happens at the same time when snapshot is saved
				ent._ragdoll = null;
			}
		}
		
		if ( !any_drawImage_happened )
		return [];
		
		// Remove final sd_filter sets (these are to null probably)
		while ( output.length >= 2 && output[ output.length - 2 ] === 0 )
		{
			output.pop();
			output.pop();
		}
		
		//console.log( JSON.stringify( output ) );
	
		//debugger;
	
		return output;
	}
	static ApplyDrawOperations( ctx, output ) // Call with ctx as null on server to update sd_filter version
	{
		const command_match_table = sdWorld.draw_operation_command_match_table;
		
		/*
		
		sdWorld.draw_operation_command_match_table = [
			'sd_filter', 0,
			'drawImageFilterCache', 1,
			'save', 2,
			'restore', 3,
			'rotate', 4,
			'scale', 5,
			'restore', 6,
			'translate', 7
		];
							
		*/
	   
		let opcode = -1;
		
		for ( let i = 0; i < output.length; i++ )
		{
			if ( typeof output[ i ] === 'number' )
			opcode = output[ i ];
			
			if ( typeof output[ i ] !== 'number' || sdWorld.draw_operation_no_parameters[ opcode ] )
			{
				if ( !ctx )
				{
					if ( opcode === 0 ) // sd_filter set
					{
						if ( output[ i ] )
						if ( !output[ i ].s )
						output[ i ] = sdWorld.GetVersion2SDFilterFromVersion1SDFilter( output[ i ] );
					}
				}
				else
				{
					if ( opcode === 0 ) // sd_filter set
					{
						ctx.sd_filter = output[ i ];
					}
					else
					{
						let method_name = sdWorld.draw_operation_command_match_table[ sdWorld.draw_operation_command_match_table.indexOf( opcode ) - 1 ];

						let args = output[ i ];

						// Decompress simple draw
						if ( opcode === 1 )
						{
							if ( typeof args === 'string' )
							{
								args = [ args, -16, -16, 32, 32 ];
							}
							else
							{
								if ( args instanceof Array )
								args = args.slice(); // Do not overwrite old array
								else
								if ( args instanceof Image ) // Server won't have this one
								args = [ args.filename, -16, -16, 32, 32 ]; // for singleplayer
								else
								debugger;
							
								//else
								//args = args.slice(); // Do not overwrite old array
							}

							args[ 0 ] = sdWorld.CreateImageFromFile( args[ 0 ] );
						}

						if ( sdWorld.draw_operation_no_parameters[ opcode ] )
						ctx[ method_name ]();
						else
						ctx[ method_name ]( ...args );
					}
				}
			}
		}
		
		if ( ctx )
		ctx.sd_filter = null;
	}
	
}
//sdWorld.init_class();

/*
// When probability matters on a scale of N cases
class ConsistentRandom
{
	static init_class()
	{
		ConsistentRandom.keys = {};
	}
	static GetRandomFrom( key, options ) // sdWorld.GetRandomFrom( 'cube_drop', [ 0.5, 0.1, 0.2 ] )
	{
		if ( typeof ConsistentRandom.keys[ key ] === 'undefined' )
		{
			ConsistentRandom.keys
		}
	}
}
ConsistentRandom.init_class();
*/

class SeededRandomNumberGenerator
{
	constructor( s=0 )
	{
		this.seed = s;
	}
	random( v1, v2 )
	{		
		v1 = Math.floor( v1 );
		v2 = Math.floor( v2 );
		
		var seed = this.seed + v1 * 56221 + v2;
		
		seed = ((seed + 0x7ED55D16) + (seed << 12))  & 0xFFFFFFFF;
		seed = ((seed ^ 0xC761C23C) ^ (seed >>> 19)) & 0xFFFFFFFF;
		seed = ((seed + 0x165667B1) + (seed << 5))   & 0xFFFFFFFF;
		seed = ((seed + 0xD3A2646C) ^ (seed << 9))   & 0xFFFFFFFF;
		seed = ((seed + 0xFD7046C5) + (seed << 3))   & 0xFFFFFFFF;
		seed = ((seed ^ 0xB55A4F09) ^ (seed >>> 16)) & 0xFFFFFFFF;

		return (seed & 0xFFFFFFF) / 0x10000000;
	}

}

class Cell
{
	constructor( hash )
	{
		this.arr = [];
		this.hash = hash;
		
		//this.snapshot_scan_id = 0; // Used during snapshot scan to keep track of visited cells
		
		//this.length = null;
		Object.seal( this );
	}
	/*get length()
	{
		throw new Error('Improper use of Cell, access elements through .arr property now');
	}*/
	/*RecreateWith( ent )
	{
		let arr = this.arr.slice();
		arr.push( ent );
		Object.freeze( arr );
		this.arr = arr;
	}
	RecreateWithout( ind )
	{
		let arr = this.arr.slice();
		arr.splice( ind, 1 );
		Object.freeze( arr );
		this.arr = arr;
	}*/
}

export default sdWorld;
	
	