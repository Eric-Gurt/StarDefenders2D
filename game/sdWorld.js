
/* global sdShop */

// sdShop is global on client-side

import sdEntity from './entities/sdEntity.js';
import sdGun from './entities/sdGun.js';
import sdEffect from './entities/sdEffect.js';
import sdCom from './entities/sdCom.js';
import sdBullet from './entities/sdBullet.js';
import sdWeather from './entities/sdWeather.js';
import sdBlock from './entities/sdBlock.js';
import sdBG from './entities/sdBG.js';
import sdWater from './entities/sdWater.js';
import sdCharacter from './entities/sdCharacter.js';
import sdGrass from './entities/sdGrass.js';
import sdShark from './entities/sdShark.js';
import sdSandWorm from './entities/sdSandWorm.js';


import sdRenderer from './client/sdRenderer.js';
import sdSound from './sdSound.js';

class sdWorld
{
	static init_class()
	{
		console.log('sdWorld class initiated');
		sdWorld.logic_rate = 16; // for server
		
		//sdWorld.max_update_rate = 64;
		sdWorld.max_update_rate = 75; // For weaker servers (more like bandwidth-limited)
		
		sdWorld.server_config = {};
		
		sdWorld.time = Date.now(); // Can be important because some entities (sdCommandCentre) use sdWorld.time as default destruction time, which will be instantly without setting this value
		sdWorld.frame = 0;
		
		sdWorld.event_uid_counter = 0; // Will be used by clients to not re-apply same events
		
		sdWorld.static_think_methods = [];
		
		sdWorld.gravity = 0.3;
		
		sdWorld.entity_classes = {}; // Will be filled up later
		
		sdWorld.is_server = ( typeof window === 'undefined' );
		sdWorld.mobile = false;
		
		sdWorld.soft_camera = true;
		
		sdWorld.sockets = null; // Becomes array
		
		sdWorld.camera = {
			x:0,
			y:0,
			scale:1
		};
		
		sdWorld.last_frame_time = 0; // For lag reporting
		sdWorld.last_slowest_class = 'nothing';
		
		sdWorld.target_scale = 2;
		
		sdWorld.my_key_states = null; // Will be assigned to active entity to allow client-side movement
		
		sdWorld.my_entity = null;
		sdWorld.my_entity_net_id = undefined; // Temporary place
		sdWorld.my_entity_protected_vars = { look_x:1, look_y:1, x:1, y:1, sx:1, sy:1, act_x:1, act_y:1 }; // Client-side variables such as look_x will appear here
		sdWorld.my_score = 0;
		sdWorld.my_entity_upgrades_later_set_obj = null;
		
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
		
		
		
		sdWorld.mouse_screen_x = 0;
		sdWorld.mouse_screen_y = 0;
		
		sdWorld.img_tile = sdWorld.CreateImageFromFile( 'bg' );
		sdWorld.img_sharp = sdWorld.CreateImageFromFile( 'sharp' );
		sdWorld.img_crosshair = sdWorld.CreateImageFromFile( 'crosshair' );
		sdWorld.img_crosshair_build = sdWorld.CreateImageFromFile( 'crosshair_build' );
		sdWorld.img_cursor = sdWorld.CreateImageFromFile( 'cursor' );
		
		
		//sdWorld.world_hash_positions = {};
		sdWorld.world_hash_positions = new Map();
		sdWorld.world_hash_positions_recheck_keys = []; // Array for keys to slowly check and delete if they are empty (can happen as a result of requiring cells by world logic)
		
		sdWorld.last_hit_entity = null;
		
		sdWorld.hovered_entity = null; // With cursor
		
		sdWorld.crystal_shard_value = 3;
		
		sdWorld.damage_to_matter = 0.025;
		//sdWorld.active_build_settings = { _class: 'sdBlock', width:16, height:16 }; // Changes every time some client tries to build something
		//sdWorld.active_build_settings = { _class: 'sdBlock', width:32, height:32 }; // Changes every time some client tries to build something
		
		sdWorld.leaders = [];
		
		sdWorld.GSPEED = 0;
		
		//sdWorld.PerlinNoiseGenerator = new PerlinNoiseGenerator( 1337 );
		sdWorld.SeededRandomNumberGenerator = new SeededRandomNumberGenerator( ~~( Math.random() * 500000 ) );
		//sdWorld.SeededRandomNumberGenerator2 = new SeededRandomNumberGenerator( 612 );
		
		sdWorld.el_hit_cache = [];
		
		sdWorld.unresolved_entity_pointers = null; // Temporarily becomes array during backup loading just so cross pointer properties can be set (for example driver and vehicle)
		
		
		
		
		
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

		function MobileCheck() 
		{
			if ( typeof navigator !== 'undefined' )
			{
				let check = false;
				(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
				return check;
			}
			return false;
		};
		
		if ( MobileCheck() )
		ForMobile();

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
				/*setTimeout(()=> Should no longer be needed
				{
					window.onkeyup({ code:key });
				},100 );*/
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
			}
		};
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
			screen.orientation.lock('landscape');
			
			window.onresize();
		}
	}
	
	

	static GetPlayingPlayersCount( count_dead=false )
	{
		let c = 0;

		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character !== null )
		if ( count_dead || sdWorld.sockets[ i ].character.hea > 0 )
		if ( count_dead || !sdWorld.sockets[ i ].character._is_being_removed )
		{
			c++;
		}

		return c;
	}
	static GetFinalGrassHeight( x )
	{
		let xx = Math.floor( x / 16 );
					
		const pow = 2; // Higher value causes higher variations to be more rare

		return Math.round( Math.pow( Math.sin( ( sdWorld.base_grass_level[ xx ] || 0 ) * 15 ) * 0.5 + 0.5, pow ) * 2 );

	}
	static GetGroundElevation( xx )
	{
		//return sdWorld.base_ground_level - Math.round( ( Math.sin( sdWorld.base_ground_level1[ xx ] ) * 64 + Math.sin( sdWorld.base_ground_level2[ xx ] ) * 64 ) / 16 ) * 16;
		//return sdWorld.base_ground_level - Math.round( ( Math.sin( sdWorld.base_ground_level1[ xx ] ) * 64 + Math.sin( sdWorld.base_ground_level2[ xx ] ) * 64 ) / 8 ) * 8;

		//console.log( Math.abs( Math.sin( sdWorld.base_ground_level2[ xx ] * 0.9 ) ) / ( 0.1 + 0.9 * Math.abs( Math.cos( sdWorld.base_ground_level1[ xx ] * 0.5 ) ) ) * 64 );

		return sdWorld.base_ground_level - Math.round( ( 

				Math.sin( sdWorld.base_ground_level1[ xx ] ) * 64 + 
				Math.sin( sdWorld.base_ground_level2[ xx ] ) * 64

				- Math.abs( Math.sin( sdWorld.base_ground_level1[ xx ] * 0.9 ) ) / ( 0.1 + 0.9 * Math.abs( Math.cos( sdWorld.base_ground_level2[ xx ] * 0.5 ) ) ) * 16

				+ Math.abs( Math.sin( sdWorld.base_ground_level2[ xx ] * 0.9 ) ) / ( 0.1 + 0.9 * Math.abs( Math.cos( sdWorld.base_ground_level1[ xx ] * 0.8 ) ) ) * 128
				+ Math.abs( Math.sin( sdWorld.base_ground_level2[ xx ] * 0.9 ) ) / ( 0.1 + 0.9 * Math.abs( Math.cos( sdWorld.base_ground_level1[ xx ] * 0.55 ) ) ) * 128

		) / 8 ) * 8;
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
			}
		}
		
		s /= s_tot;
		s2 /= s2_tot;
		
		if ( s < 0.49 - ( 1 + Math.sin( y / 100 ) ) * 0.001 )
		{
			allow_block = false;
			allow_water = false;
			
			if ( y > 500 )
			{
				if ( s < 0.485 - ( 1 + Math.sin( y / 100 ) ) * 0.001 )
				{
					allow_water = true;
					
					allow_lava = ( s2 < 0.5 );
				}
			}
		}
		//debugger;
	
	
	
		
		let f = 'hue-rotate('+( ~~sdWorld.mod( x / 16, 360 ) )+'deg)';

		let hp_mult = 1;

		//if ( y > sdWorld.base_ground_level + 256 )
		if ( y > from_y + 256 )
		{
			//hp_mult = 1 + ( y - sdWorld.base_ground_level - 256 ) / 200;
			hp_mult = 1 + Math.ceil( ( y - from_y - 256 ) / 200 * 3 ) / 3;
			f += 'brightness(' + Math.max( 0.2, 1 / hp_mult ) + ') saturate(' + Math.max( 0.2, 1 / hp_mult ) + ')';
		}
		
		
		

		if ( y >= from_y && allow_block )
		{
			let enemy_rand_num = Math.random();
			let random_enemy;

			if ( Math.pow( enemy_rand_num, 10 ) > 1 / hp_mult )
			{
				random_enemy = 'sdSandWorm';
				//console.log('sdSandWorm spawned somewhere');
			}
			else
			if ( Math.pow( enemy_rand_num, 5 ) > 1 / hp_mult )
			random_enemy = 'sdOctopus';
			else
			if ( Math.pow( enemy_rand_num, 3 ) > 0.8 / hp_mult )
			random_enemy = 'sdSlug';
			else
			if ( Math.pow( enemy_rand_num, 2 ) > 0.8 / hp_mult )
			random_enemy = 'sdQuickie';
			else
			if ( Math.pow( enemy_rand_num, 1.2 ) > 0.8 / hp_mult )
			random_enemy = 'sdJunk';
			else
			{
				if ( Math.random() < 0.05 ) // Small chance to spawn on ground levels since they are passive if unprovoked
				random_enemy = 'sdSlug';
				else
				if ( Math.random() < 0.2 )
				random_enemy = 'sdAsp';
				else
				random_enemy = 'sdVirus';
			}

			let plants = null;
			let plants_objs = null;

			if ( !only_plantless_block )
			if ( y === from_y )
			if ( y <= sdWorld.base_ground_level )
			{

				let grass = new sdGrass({ x:x, y:y - 16, filter:f });
				/*
				if ( Math.random() < 0.2 )
				grass.variation = 2;
				else
				if ( Math.random() < 0.4 )
				grass.variation = 1;
				else
				grass.variation = 0; // maybe unneeded since it's defined under constructor?
				*/
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

			ent = new sdBlock({ 
				x:x, 
				y:y, 
				width:16, 
				height: half ? 8 : 16,
				material: sdBlock.MATERIAL_GROUND,
				contains_class: ( !half && Math.random() > 0.75 / hp_mult ) ? ( Math.random() < 0.3 ? random_enemy : ( ( y > from_y + 256 ) ? 'sdCrystal.deep' : 'sdCrystal' ) ) : null,
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
			{
				let ent2 = new sdWater({ x:x, y:y, volume:1, type:allow_lava ? sdWater.TYPE_LAVA : sdWater.TYPE_WATER });
				sdEntity.entities.push( ent2 );
				
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
	
	static ChangeWorldBounds( x1, y1, x2, y2 )
	{
		//var ent;
		
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
		//return false; // Hack, forces everything move like it would off-screen
		
		if ( ent.IsGlobalEntity() )
		return true;
	
		if ( typeof ent._socket === 'object' ) // Is a connected player
		return true;

		let x = ent.x;
		let y = ent.y;

		for ( var i = 0; i < sdWorld.sockets.length; i++ )
		{
			var socket = sdWorld.sockets[ i ];

			if ( sdWorld.CanSocketSee( socket, x, y ) )
			return true;
		}
	}
	static DropShards( x,y,sx,sy, tot, value_mult, radius=0 )
	{
		if ( sdWorld.is_server )
		{
			for ( var i = 0; i < tot; i++ )
			{
				let xx = x - radius + Math.random() * radius * 2;
				let yy = y - radius + Math.random() * radius * 2;
				let ent = new sdGun({ class:sdGun.CLASS_CRYSTAL_SHARD, x: xx, y: yy });
				ent.sx = sx + Math.random() * 8 - 4;
				ent.sy = sy + Math.random() * 8 - 4;
				ent.ttl = 30 * 9 * ( 0.7 + Math.random() * 0.3 ); // was 7 seconds, now 9
				ent.extra = value_mult * sdWorld.crystal_shard_value;
				sdEntity.entities.push( ent );
			}
		}
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
			if ( params.attachment._coms_allowed )
			{
				let coms_near = [];
				
				sdWorld.GetComsNear( params.x, params.y, coms_near, params.attachment._net_id );
				//console.log('[zero hop]coms_near = ', coms_near.length);
				
				let tot_before = 0;
				let tot_after;
				let i = 0;
				do
				{
					tot_before = coms_near.length;
					
					while ( i < tot_before )
					{
						sdWorld.GetComsNear( coms_near[ i ].x, coms_near[ i ].y, coms_near, params.attachment._net_id );
						//console.log('[hop]coms_near = ', coms_near.length);
						
						i++;
					}
					
					tot_after = coms_near.length;
					
				} while( tot_after !== tot_before );
				
				for ( i = 0; i < coms_near.length; i++ )
				{
					sdWorld.GetCharactersNear( coms_near[ i ].x, coms_near[ i ].y, extra_affected_chars, coms_near[ i ].subscribers );
					//console.log('[hop]extra_affected_chars = ', extra_affected_chars.length);
				}
			}
			
			params.attachment = [ params.attachment.GetClass(), params.attachment._net_id ];
		}
		
		if ( params.type === sdEffect.TYPE_EXPLOSION )
		{
			/*let targets = sdWorld.GetAnythingNear( params.x, params.y, params.radius );
			
			for ( var i = 0; i < targets.length; i++ )
			targets[ i ].Damage( params.radius * 2 );*/
			
			if ( params.color === undefined )
			throw new Error('Should not happen');
			
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
	static GetComsNear( _x, _y, append_to=null, require_auth_for_net_id=null, return_arr_of_one_with_lowest_net_id=false )
	{
		let ret = append_to || [];
		
		let min_x = _x - sdCom.retransmit_range - 32;
		let max_x = _x + sdCom.retransmit_range + 32;
		let min_y = _y - sdCom.retransmit_range - 32;
		let max_y = _y + sdCom.retransmit_range + 32;
		
		let x, y, arr, i;
		for ( x = min_x; x <= max_x; x += 32 )
		for ( y = min_y; y <= max_y; y += 32 )
		{
			arr = sdWorld.RequireHashPosition( x, y );
			for ( i = 0; i < arr.length; i++ )
			//if ( arr[ i ].GetClass() === 'sdCom' ) can take up to 11% of execution time
			//if ( arr[ i ] instanceof sdCom )
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
	static GetCharactersNear( _x, _y, append_to=null, require_auth_for_net_id_by_list=null, range=sdCom.retransmit_range )
	{
		let ret = append_to || [];
		
		let min_x = sdWorld.FastFloor((_x - range)/32);
		let min_y = sdWorld.FastFloor((_y - range)/32);
		let max_x = sdWorld.FastCeil((_x + range)/32);
		let max_y = sdWorld.FastCeil((_y + range)/32);
		
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
			arr = sdWorld.RequireHashPosition( x * 32, y * 32 );
			for ( i = 0; i < arr.length; i++ )
			//if ( arr[ i ].GetClass() === 'sdCharacter' )
			//if ( arr[ i ] instanceof sdCharacter )
			if ( arr[ i ].is( sdCharacter ) )
			if ( require_auth_for_net_id_by_list === null || ( arr[ i ]._coms_allowed && require_auth_for_net_id_by_list.indexOf( arr[ i ]._net_id ) !== -1 ) )
			if ( ret.indexOf( arr[ i ] ) === -1 )
			ret.push( arr[ i ] );
		}
		return ret;
	}
	static GetAnythingNear( _x, _y, range, append_to=null, specific_classes=null )
	{
		let ret = append_to || [];
		
		/*let min_x = _x - range - 32;
		let max_x = _x + range + 32;
		let min_y = _y - range - 32;
		let max_y = _y + range + 32;*/
		let min_x = sdWorld.FastFloor((_x - range)/32);
		let min_y = sdWorld.FastFloor((_y - range)/32);
		let max_x = sdWorld.FastCeil((_x + range)/32);
		let max_y = sdWorld.FastCeil((_y + range)/32);
		
		if ( max_x === min_x )
		max_x++;
		if ( max_y === min_y )
		max_y++;
	
		let x, y, arr, i, e;
		let cx,cy;
		let x1,y1,x2,y2;
		//for ( x = min_x; x <= max_x; x++ )
		//for ( y = min_y; y <= max_y; y++ )
		for ( x = min_x; x < max_x; x++ )
		for ( y = min_y; y < max_y; y++ )
		{
			arr = sdWorld.RequireHashPosition( x * 32, y * 32 );
			for ( i = 0; i < arr.length; i++ )
			{
				e = arr[ i ];
				if ( specific_classes === null || specific_classes.indexOf( e.GetClass() ) !== -1 )
				{
					x1 = e._hitbox_x1;
					x2 = e._hitbox_x2;
					y1 = e._hitbox_y1;
					y2 = e._hitbox_y2;
					
					cx = Math.max( e.x + x1, Math.min( _x, e.x + x2 ) );
					cy = Math.max( e.y + y1, Math.min( _y, e.y + y2 ) );

					if ( sdWorld.inDist2D( _x, _y, cx, cy, range ) >= 0 )
					if ( ret.indexOf( e ) === -1 )
					ret.push( e );
				}
			}
		}
		
		
		
		return ret;
	}
	static ResolveMyEntityByNetId()
	{
		//console.warn('ResolveMyEntityByNetId()');
		if ( sdWorld.my_entity === null || sdWorld.my_entity_net_id !== sdWorld.my_entity._net_id )
		{
			sdWorld.my_entity = null;
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
						console.warn('Entity pointer could not be resolved even at later stage for ' + arr[ 0 ].GetClass() + '.' + arr[ 1 ] + ' :: ' + arr[ 2 ] + ' :: ' + arr[ 3 ] );
						debugger;
					}
				}
			}
			sdWorld.unresolved_entity_pointers = null;
		}
		else
		debugger; // Do sdWorld.unresolved_entity_pointers = []; before applying snapshots
	}
	

	static shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
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
	static RequireHashPosition( x, y, spawn_if_empty=false )
	{
		/*
		x = sdWorld.FastFloor( x / 32 );
		y = sdWorld.FastFloor( y / 32 );
		
		//x = Math.floor( x / 32 );
		//y = Math.floor( y / 32 );
		
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
		
		//x = ~~( x / 32 );
		//y = ;
		
		//x = ( ~~( y / 32 ) ) * 4098 + ~~( x / 32 ); // Too many left-over empty arrays when bounds move?
		
		x = ( sdWorld.FastFloor( y / 32 ) ) * 4098 + sdWorld.FastFloor( x / 32 );
		
		if ( !sdWorld.world_hash_positions.has( x ) )
		{
			if ( spawn_if_empty )
			{
				let arr = [];

				arr.hash = x;
				//arr.unlinked = false; // Debugging client-side non-coliding sdBlock-s (they somehow point towards removed hashes

				sdWorld.world_hash_positions.set( x, arr );

				if ( sdWorld.world_hash_positions_recheck_keys.indexOf( x ) === -1 )
				sdWorld.world_hash_positions_recheck_keys.push( x );
			}
			else
			{
				return sdWorld.fake_empty_array;
			}
		}
		
		return sdWorld.world_hash_positions.get( x );
		
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
		
			let from_x = sdWorld.FastFloor( ( entity.x + entity._hitbox_x1 ) / 32 );
			let from_y = sdWorld.FastFloor( ( entity.y + entity._hitbox_y1 ) / 32 );
			let to_x = sdWorld.FastCeil( ( entity.x + entity._hitbox_x2 ) / 32 );
			let to_y = sdWorld.FastCeil( ( entity.y + entity._hitbox_y2 ) / 32 );
			
			if ( to_x === from_x )
			to_x++;
			if ( to_y === from_y )
			to_y++;

			if ( to_x - from_x < 32 && to_y - from_y < 32 )
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
				new_affected_hash_arrays.push( sdWorld.RequireHashPosition( xx * 32, yy * 32, true ) );
		
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
		
		//if ( entity._hash_position !== new_hash_position )
		if ( !sdWorld.ArraysEqualIgnoringOrder( entity._affected_hash_arrays, new_affected_hash_arrays ) )
		{
			for ( var i = 0; i < entity._affected_hash_arrays.length; i++ )
			{
				var ind = entity._affected_hash_arrays[ i ].indexOf( entity );
				if ( ind === -1 )
				throw new Error('Bad hash object - it should contain this entity but it does not');
			
				entity._affected_hash_arrays[ i ].splice( ind, 1 );
					
				if ( entity._affected_hash_arrays[ i ].length === 0 && new_affected_hash_arrays.indexOf( entity._affected_hash_arrays[ i ] ) === -1 ) // Empty and not going to re-add(!)
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
				
				new_affected_hash_arrays[ i ].push( entity );
				
				if ( new_affected_hash_arrays[ i ].length > 1000 ) // Dealing with NaN bounds?
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

			//var map = new Map();
			var map = new Set();
			
			/*var map = new Map();
			for ( var x = -1; x <= 1; x++ ) // TODO: Use box query method?
			for ( var y = -1; y <= 1; y++ )
			{
				var local_hash_array = sdWorld.RequireHashPosition( entity.x + x * 32, entity.y + y * 32 );
				for ( var i = 0; i < local_hash_array.length; i++ )
				{
					map.set( local_hash_array[ i ], local_hash_array[ i ] );
				}
			}*/
								
			let i2, i;
			
			for ( i2 = 0; i2 < new_affected_hash_arrays.length; i2++ )
			for ( i = 0; i < new_affected_hash_arrays[ i2 ].length; i++ )
			map.add( new_affected_hash_arrays[ i2 ][ i ] );
			//map.set( new_affected_hash_arrays[ i2 ][ i ], new_affected_hash_arrays[ i2 ][ i ] );

			// Make entities reach to each other in both directions
			map.forEach( ( another_entity )=>
			{
				if ( another_entity !== entity )
				if ( !another_entity._is_being_removed )
				if ( !entity._is_being_removed ) // Just so bullets won't hit multiple targets
				{
					if ( entity.x + entity._hitbox_x2 > another_entity.x + another_entity._hitbox_x1 &&
						 entity.x + entity._hitbox_x1 < another_entity.x + another_entity._hitbox_x2 &&
						 entity.y + entity._hitbox_y2 > another_entity.y + another_entity._hitbox_y1 &&
						 entity.y + entity._hitbox_y1 < another_entity.y + another_entity._hitbox_y2 )
					{
						entity.onMovementInRange( another_entity );
						another_entity.onMovementInRange( entity );
						
						//entity.SharePhysAwake( another_entity );
					}
					/*else
					{
						if ( entity.GetClass() === 'sdMatterAmplifier' || another_entity.GetClass() === 'sdMatterAmplifier' )
						if ( entity.GetClass() === 'sdCrystal' || another_entity.GetClass() === 'sdCrystal' )
						{
							console.log('Not colliding with sdMatterAmplifier due to bounds check', [entity.x + entity._hitbox_x1, another_entity.x + another_entity._hitbox_x2] );
						}
					}*/
				}
			});
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
			
			if ( sdWorld.is_server )
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

			for ( i = 0; i < sdWorld.static_think_methods.length; i++ )
			sdWorld.static_think_methods[ i ]( GSPEED );
		
			for ( arr_i = 0; arr_i < 2; arr_i++ )
			{
				arr = ( arr_i === 0 ) ? sdEntity.active_entities : sdEntity.global_entities;
				
				loop1: for ( i = 0; i < arr.length; i++ )
				{
					e = arr[ i ];
					
					gspeed_mult = 1;
					substeps_mult = 1;
					
					if ( sdWorld.is_server )
					if ( e._last_x !== undefined ) // sdEntity was never placed properly yet, can cause items to fall into each other after snapshot load
					if ( !sdWorld.CanAnySocketSee( e ) )
					{
						// Make sure low tickrate entities are still catch up on time, this still improved performance because of calling same method multiple times is always faster than calling multiple methods once (apparently virtual method call issue)
						skip_frames = 30;
						
						if ( e.is( sdCharacter ) || e.is( sdGun ) )
						skip_frames = 5; // High values cause idling players to lose their guns
						else
						if ( e.is( sdSandWorm ) )
						skip_frames = 5; // These are just unstable on high GSPEED
				
						if ( e._net_id % skip_frames === frame % skip_frames )
						{
							gspeed_mult = skip_frames;
							substeps_mult = skip_frames;
						}
						else
						continue;
					}
					
					if ( timewarps )
					{
						best_warp = 1;
						for ( i2 = 0; i2 < timewarps.length; i2++ )
						{
							if ( sdWorld.inDist2D_Boolean( timewarps[ i2 ].x, timewarps[ i2 ].y, e.x, e.y, timewarps[ i2 ].r ) )
							{
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
						
						gspeed_mult = best_warp;
					}
					
					if ( DEBUG_TIME_MODE )
					{
						time_from = Date.now();
					}
					
					substeps = e.substeps * substeps_mult;
					progress_until_removed = e.progress_until_removed;

					for ( step = 0; step < substeps || progress_until_removed; step++ )
					{
						if ( !e._is_being_removed )
						e.onThink( GSPEED / substeps * gspeed_mult );
						
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
								let id = sdEntity.entities.indexOf( e );
								if ( id === -1 )
								{
									console.log('Removing unlisted entity ' + e.GetClass() + ', hiberstate was ' + hiber_state );
									debugger;
								}
								else
								sdEntity.entities.splice( id, 1 );
							}
							
							if ( arr[ i ] === e ) // Removal did not happen?
							{
								arr.splice( i, 1 );
								i--;
							}
							continue loop1; // Or else it will try to get removed in each substep of a bullet
						}
						
						e.UpdateHitbox();
						
						if ( e._last_x !== e.x ||
							 e._last_y !== e.y )
						{
							if ( !e._is_being_removed )
							{
								sdWorld.UpdateHashPosition( e, false );
								
								if ( e._listeners ) // Should be faster than passing string
								e.callEventListener( 'MOVES' );
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

			if ( !sdWorld.is_server )
			{
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
							sdWorld.camera.x = sdWorld.MorphWithTimeScale( sdWorld.camera.x, ( sdWorld.my_entity.x + sdWorld.my_entity.look_x ) / 2, 1 - 10/11, GSPEED/30 );
							sdWorld.camera.y = sdWorld.MorphWithTimeScale( sdWorld.camera.y, ( sdWorld.my_entity.y + sdWorld.my_entity.look_y ) / 2, 1 - 10/11, GSPEED/30 );
						}
						else
						{
							sdWorld.camera.x = ( sdWorld.my_entity.x + sdWorld.my_entity.look_x ) / 2;
							sdWorld.camera.y = ( sdWorld.my_entity.y + sdWorld.my_entity.look_y ) / 2;
						}
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


					sdWorld.my_entity.look_x = sdWorld.mouse_screen_x / sdWorld.camera.scale + sdWorld.camera.x - sdRenderer.screen_width / 2 / sdWorld.camera.scale;
					sdWorld.my_entity.look_y = sdWorld.mouse_screen_y / sdWorld.camera.scale + sdWorld.camera.y - sdRenderer.screen_height / 2 / sdWorld.camera.scale;
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
				if ( sockets[ i2 ].character && !sockets[ i2 ].character._is_being_removed )
				sdWorld.leaders.push({ name:sockets[ i2 ].character.title, score:sockets[ i2 ].GetScore() });
			
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

			sdWorld.leaders.sort((a,b)=>{return b.score - a.score;});
			
			if ( sdWorld.leaders.length > 15 )
			sdWorld.leaders = sdWorld.leaders.slice( 0, 15 );
		}
		
		let t4 = Date.now();
		IncludeTimeCost( 'leaders_and_warnings', t4 - t3 );
		
		if ( sdWorld.world_hash_positions_recheck_keys.length > 0 )
		for ( var s = Math.max( 32, sdWorld.world_hash_positions_recheck_keys.length * 0.1 ); s >= 0; s-- )
		{
			let x = sdWorld.world_hash_positions_recheck_keys[ 0 ];
			
			if ( sdWorld.world_hash_positions.has( x ) )
			if ( sdWorld.world_hash_positions.get( x ).length === 0 )
			{
				//sdWorld.world_hash_positions.get( x ).unlinked = globalThis.getStackTrace();
				sdWorld.world_hash_positions.delete( x );
			}
	
			sdWorld.world_hash_positions_recheck_keys.shift();
		}
		
		let t5 = Date.now();
		IncludeTimeCost( 'world_hash_positions_recheck_keys', t5 - t4 );
		
		
		if ( sdWorld.server_config.onExtraWorldLogic )
		sdWorld.server_config.onExtraWorldLogic( GSPEED );
	
		let t6 = Date.now();
		IncludeTimeCost( 'onExtraWorldLogic', t6 - t5 );
		
		if ( sdWorld.is_server )
		{
			sdWorld.last_frame_time = t5 - t2;
			//sdWorld.last_slowest_class = 'nothing';
		}
		
		// Keep it last:
		sdWorld.frame++;
	}
	
		
	static mod( a, n )
	{
		return ((a%n)+n)%n;
	}
	
	static GetClientSideGlowReceived( x, y, lume_receiver )
	{
		let lumes = 0;
		
		if ( sdWorld.is_server ) // Disabled, could be called by draw command collector
		return 0;
		
		let cache = sdRenderer.lumes_weak_cache.get( lume_receiver );
		
		if ( !cache )
		{
			cache = { expiration: 0, lumes: 0 };
			sdRenderer.lumes_weak_cache.set( lume_receiver, cache );
		}
		
		if ( sdWorld.time > cache.expiration )
		{
			let nears = [];
			sdWorld.GetAnythingNear( x, y, 64, nears, [ 'sdWater', 'sdLamp' ] );
			
			let ent;
			
			//sdWorld.CheckWallExistsBox( x - 64, y - 64, x + 64, y + 64, null, null, [ 'sdWater', 'sdLamp' ], ( ent )=>
			for ( let i = 0; i < nears.length; i++ )
			{
				ent = nears[ i ];
				
				if ( ent.is( sdWorld.entity_classes.sdWater ) )
				{
					if ( ent.type === sdWorld.entity_classes.sdWater.TYPE_LAVA )
					{
						lumes += 10 / Math.max( 16, sdWorld.Dist2D( x, y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2 ) );
					}
				}
				else
				{
					lumes += 10 / Math.max( 16, sdWorld.Dist2D( x, y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2 ) );
				}
				//return false;
			}//);
			
			lumes = Math.min( 5, Math.floor( lumes * 2 ) / 2 );
			
			if ( cache.lumes !== lumes )
			{
				cache.lumes = lumes;
				
				nears = [];
				sdWorld.GetAnythingNear( x, y, 16, nears, [ 'sdBlock', 'sdBG' ] );
				
				let ent2;
				let cache2;
				for ( let i = 0; i < nears.length; i++ )
				{
					ent2 = nears[ i ];
					cache2 = sdRenderer.lumes_weak_cache.get( ent2 );
					if ( cache2 )
					cache2.expiration = 0;
				}
			}
			cache.expiration = 1000 + sdWorld.time + Math.random() * 15000;
		}
		else
		lumes = cache.lumes;
		
		/*
		let xx = Math.floor( x / 16 );
		let yy = Math.floor( y / 16 );
		
		let hash = xx+','+yy;
		
		if ( typeof sdRenderer.lumes_cache[ hash ] === 'undefined' )
		{
			sdRenderer.lumes_cache[ hash ] = { expiration: 0, lumes: 0 };
			sdRenderer.lumes_cache_hashes.push( hash );
		}
		
		if ( sdWorld.time > sdRenderer.lumes_cache[ hash ].expiration )
		{
			let nears = [];
			sdWorld.GetAnythingNear( x, y, 64, nears, [ 'sdWater', 'sdLamp' ] );
			
			let ent;
			
			//sdWorld.CheckWallExistsBox( x - 64, y - 64, x + 64, y + 64, null, null, [ 'sdWater', 'sdLamp' ], ( ent )=>
			for ( let i = 0; i < nears.length; i++ )
			{
				ent = nears[ i ];
				
				if ( ent.is( sdWorld.entity_classes.sdWater ) )
				{
					if ( ent.type === sdWorld.entity_classes.sdWater.TYPE_LAVA )
					{
						lumes += 10 / Math.max( 1, sdWorld.Dist2D( x, y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2 ) );
					}
				}
				else
				{
					lumes += 10 / Math.max( 1, sdWorld.Dist2D( x, y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2 ) );
				}
				//return false;
			}//);
			
			lumes = Math.min( 5, Math.floor( lumes * 2 ) / 2 );
			
			if ( sdRenderer.lumes_cache[ hash ].lumes !== lumes )
			{
				sdRenderer.lumes_cache[ hash ].lumes = lumes;
			
				if ( typeof sdRenderer.lumes_cache[ (xx-1)+','+(yy) ] !== 'undefined' )
				sdRenderer.lumes_cache[ (xx-1)+','+(yy) ].expiration = 0;
			
				if ( typeof sdRenderer.lumes_cache[ (xx+1)+','+(yy) ] !== 'undefined' )
				sdRenderer.lumes_cache[ (xx+1)+','+(yy) ].expiration = 0;
			
				if ( typeof sdRenderer.lumes_cache[ (xx)+','+(yy-1) ] !== 'undefined' )
				sdRenderer.lumes_cache[ (xx)+','+(yy-1) ].expiration = 0;
			
				if ( typeof sdRenderer.lumes_cache[ (xx)+','+(yy+1) ] !== 'undefined' )
				sdRenderer.lumes_cache[ (xx)+','+(yy+1) ].expiration = 0;
			}
			
			sdRenderer.lumes_cache[ hash ].expiration = 1000 + sdWorld.time + Math.random() * 15000;
		}
		else
		{
			lumes = sdRenderer.lumes_cache[ hash ].lumes;
		}
		*/
		return lumes;
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
		
		//let el_hit_cache = new WeakMap();
		//let el_hit_cache = sdWorld.el_hit_cache;
		//let el_hit_cache_len = 0;
	
		let arr;
		let i;
		let arr_i;
		let class_str;
		let arr_i_x;
		let arr_i_y;
		
		var xx_from = sdWorld.FastFloor( x1 / 32 ); // Overshoot no longer needed, due to big entities now taking all needed hash arrays
		var yy_from = sdWorld.FastFloor( y1 / 32 );
		var xx_to = sdWorld.FastCeil( x2 / 32 );
		var yy_to = sdWorld.FastCeil( y2 / 32 );
		
		if ( xx_to === xx_from )
		xx_to++;
		
		if ( yy_to === yy_from )
		yy_to++;
	
		//for ( var xx = -1; xx <= 2; xx++ )
		//for ( var yy = -1; yy <= 2; yy++ )
		//for ( var xx = -1; xx <= 0; xx++ ) Was not enough for doors, sometimes they would have left vertical part lacking collision with players
		//for ( var yy = -1; yy <= 0; yy++ )
		//for ( var xx = -1; xx <= 1; xx++ )
		//for ( var yy = -1; yy <= 1; yy++ )
		//for ( var xx = xx_from; xx <= xx_to; xx++ )
		//for ( var yy = yy_from; yy <= yy_to; yy++ )
		let xx,yy;
		for ( xx = xx_from; xx < xx_to; xx++ )
		for ( yy = yy_from; yy < yy_to; yy++ )
		{
			//arr = sdWorld.RequireHashPosition( x1 + xx * 32, y1 + yy * 32 );
			//arr = sdWorld.RequireHashPosition( x2 + xx * 32, y2 + yy * 32 ); // Better player-matter container collisions. Worse for player-block cases
			arr = sdWorld.RequireHashPosition( xx * 32, yy * 32 );
			
			//ent_skip: 
			for ( i = 0; i < arr.length; i++ )
			{
				arr_i = arr[ i ];
						
				if ( arr_i !== ignore_entity )
				{
					arr_i_x = arr_i.x;
					
					if ( x2 >= arr_i_x + arr_i._hitbox_x1 )
					if ( x1 <= arr_i_x + arr_i._hitbox_x2 )
					{
						arr_i_y = arr_i.y;
						
						if ( y2 >= arr_i_y + arr_i._hitbox_y1 )
						if ( y1 <= arr_i_y + arr_i._hitbox_y2 )
						if ( ignore_entity === null || arr_i.IsBGEntity() === ignore_entity.IsBGEntity() )
						//if ( arr_i.hard_collision || include_only_specific_classes )
						if ( include_only_specific_classes || arr_i.hard_collision )
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
	
		return false;
	}
	/*static CheckWallExistsBox( x1, y1, x2, y2, ignore_entity=null, ignore_entity_classes=null, include_only_specific_classes=null ) // under 32x32 boxes unless line with arr = sdWorld.RequireHashPosition( x1 + xx * 32, y1 + yy * 32 ); changed
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
		
		var xx_from = x1 - 32; // TODO: Overshoot no longer needed, due to big entities now taking all needed hash arrays?
		var yy_from = y1 - 32;
		var xx_to = x2 + 32;
		var yy_to = y2 + 32;
	
		//for ( var xx = -1; xx <= 2; xx++ )
		//for ( var yy = -1; yy <= 2; yy++ )
		//for ( var xx = -1; xx <= 0; xx++ ) Was not enough for doors, sometimes they would have left vertical part lacking collision with players
		//for ( var yy = -1; yy <= 0; yy++ )
		//for ( var xx = -1; xx <= 1; xx++ )
		//for ( var yy = -1; yy <= 1; yy++ )
		for ( var xx = xx_from; xx <= xx_to; xx += 32 )
		for ( var yy = yy_from; yy <= yy_to; yy += 32 )
		{
			//arr = sdWorld.RequireHashPosition( x1 + xx * 32, y1 + yy * 32 );
			//arr = sdWorld.RequireHashPosition( x2 + xx * 32, y2 + yy * 32 ); // Better player-matter container collisions. Worse for player-block cases
			arr = sdWorld.RequireHashPosition( xx, yy );
			
			for ( i = 0; i < arr.length; i++ )
			if ( arr[ i ].hard_collision || include_only_specific_classes )
			if ( arr[ i ] !== ignore_entity )
			if ( ignore_entity === null || arr[ i ].IsBGEntity() === ignore_entity.IsBGEntity() )
			{
				if ( x2 >= arr[ i ].x + arr[ i ]._hitbox_x1 )
				if ( x1 <= arr[ i ].x + arr[ i ]._hitbox_x2 )
				if ( y2 >= arr[ i ].y + arr[ i ]._hitbox_y1 )
				if ( y1 <= arr[ i ].y + arr[ i ]._hitbox_y2 )
				{
					if ( include_only_specific_classes )
					if ( include_only_specific_classes.indexOf( arr[ i ].GetClass() ) === -1 )
					continue;
					
					if ( ignore_entity_classes !== null )
					if ( ignore_entity_classes.indexOf( arr[ i ].GetClass() ) !== -1 )
					continue;
					
					sdWorld.last_hit_entity = arr[ i ];
					return true;
				}
			}
		}
	
		return false;
	}*/
	static CheckLineOfSight( x1, y1, x2, y2, ignore_entity=null, ignore_entity_classes=null, include_only_specific_classes=null, custom_filtering_method=null )
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
			//arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
			arr = sdWorld.RequireHashPosition( x, y );
			for ( i = 0; i < arr.length; i++ )
			{
				arr_i = arr[ i ];
				
				if ( arr_i !== ignore_entity )
				{
					arr_i_x = arr_i.x;
					
					if ( x >= arr_i_x + arr_i._hitbox_x1 )
					if ( x <= arr_i_x + arr_i._hitbox_x2 )
					{
						arr_i_y = arr_i.y;
						
						if ( y >= arr_i_y + arr_i._hitbox_y1 )
						if ( y <= arr_i_y + arr_i._hitbox_y2 )
						if ( ignore_entity === null || arr_i.IsBGEntity() === ignore_entity.IsBGEntity() )
						if ( include_only_specific_classes || arr_i.hard_collision )
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
	
		return false;
	}
	
	static GetCrystalHue( v )
	{
		if ( v > 40 )
		{
			if ( v === 10240 ) // === sdCrystal.anticrystal_value
		    return 'brightness(0) drop-shadow(0px 0px 7px #000000)';
			else
			if ( v === 5120 )
		    return 'hue-rotate(200deg) brightness(1.3) drop-shadow(0px 0px 7px #FFFFAA)';
			else
			if ( v === 2560 )
			return 'hue-rotate(170deg) brightness(0.8) contrast(2)';
			else
			return 'hue-rotate('+( v - 40 )+'deg)';
		}
		
		return '';
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
			
			if ( that.sx === undefined )
			that.sx = 0;
			
			if ( that.sy === undefined )
			that.sy = 0;

			for ( let i = 0; i < debris_count; i++ )
			{
				let a = Math.random() * 2 * Math.PI;
				let s = Math.random() * max_rand_velocity;

				let k = Math.random();

				let x = that.x + that._hitbox_x1 + Math.random() * ( that._hitbox_x2 - that._hitbox_x1 );
				let y = that.y + that._hitbox_y1 + Math.random() * ( that._hitbox_y2 - that._hitbox_y1 );
				
				//console.log( 'BasicEntityBreakEffect', that.sx, k, a, s );

				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: that.sx*k + Math.sin(a)*s, sy: that.sy*k + Math.cos(a)*s, filter:that.GetBleedEffectFilter() });
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
		if ( typeof from === 'string' )
		{
			from = sdWorld.hexToRgb( from );
			if ( from === null )
			return;
		}
		else
		if ( typeof from !== 'array' )
		return;

		if ( typeof to === 'string' )
		{
			to = sdWorld.hexToRgb( to );
			if ( to === null )
			return;
		}
		else
		if ( typeof to !== 'array' )
		return;
		
		if ( typeof sd_filter[ from[ 0 ] ] === 'undefined' )
		sd_filter[ from[ 0 ] ] = {};
	
		if ( typeof sd_filter[ from[ 0 ] ][ from[ 1 ] ] === 'undefined' )
		sd_filter[ from[ 0 ] ][ from[ 1 ] ] = {};
	
		//if ( typeof sd_filter[ from[ 0 ] ][ from[ 1 ] ][ from[ 2 ] ] === 'undefined' )
		sd_filter[ from[ 0 ] ][ from[ 1 ] ][ from[ 2 ] ] = to;
	}
	static ConvertPlayerDescriptionToSDFilter( player_description )
	{
		let ret = {};
		
		sdWorld.ReplaceColorInSDFilter( ret, '#c0c0c0', player_description['color_bright'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#808080', player_description['color_dark'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#ff0000', player_description['color_visor'] );
		//sdWorld.ReplaceColorInSDFilter( ret, '#800000', player_description['color_splashy'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#000080', player_description['color_suit'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#800080', player_description['color_suit2'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#ff00ff', player_description['color_dark2'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#000000', player_description['color_shoes'] );
		sdWorld.ReplaceColorInSDFilter( ret, '#808000', player_description['color_skin'] );
		
		if ( player_description['voice6'] ) // Falkok voice
		sdWorld.ReplaceColorInSDFilter( ret, '#800000', '#006480' ); // hue +73 deg
		
		if ( player_description['voice7'] ) // Robot voice
		sdWorld.ReplaceColorInSDFilter( ret, '#800000', '#000000' ); // hue +73 deg
		
		return ret;
	}
	static ConvertPlayerDescriptionToHelmet( player_description )
	{
		for ( var i = 1; i < sdCharacter.img_helmets.length; i++ )
		if ( player_description[ 'helmet' + i ] )
		return i;

		return 1;
	}
	static ConvertPlayerDescriptionToVoice( player_description )
	{
		let _voice = {
			wordgap: 0,
			pitch: 50,
			speed: 175,
			variant: 'klatt'
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
		
		return _voice;
	}
	static CreateImageFromFile( filename, cb=null )
	{
		if ( sdWorld.is_server )
		return filename; // Actually return image name now just so sdLost could be drawn using these
		//return null;
		
		if ( sdWorld.lost_images_cache && sdWorld.lost_images_cache[ filename ] )
		{
			let img = sdWorld.lost_images_cache[ filename ];
			
			if ( cb )
			{
				if ( img.loaded )
				cb();
				else
				img.callbacks.push( cb );
			}
			
			return img;
		}
	
		let img = new Image();
		img.src = './assets/' + filename + '.png';
		
		img.loaded = false;
		
		img.callbacks = [];
		
		if ( cb )
		img.callbacks.push( cb );
	
		img.onload = ()=>{ 
			img.loaded = true; 
			
			for ( let i = 0; i < img.callbacks.length; i++ )
			img.callbacks[ i ]();
		
			img.callbacks = null;
		};
		
		if ( !sdWorld.lost_images_cache )
		sdWorld.lost_images_cache = {};
	
		sdWorld.lost_images_cache[ filename ] = img;
		
		return img;
	}
	static Start( player_settings, full_reset=false, retry=0 )
	{
		if ( !globalThis.connection_established )
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
			
			sdRenderer.visual_settings = player_settings['visuals1'] * 1 + player_settings['visuals2'] * 2 + player_settings['visuals3'] * 3;
			
			sdRenderer.resolution_quality = player_settings['density1'] * 1 + player_settings['density2'] * 0.5 + player_settings['density3'] * 0.25;
			window.onresize();
			
			sdSound.SetVolumeScale( player_settings['volume1'] * 0.4 + player_settings['volume2'] * 0.25 + player_settings['volume3'] * 0.1 ) ;
			
			sdWorld.soft_camera = player_settings['camera1'] ? true : false;
			
			player_settings.full_reset = full_reset;
			player_settings.my_hash = [ Math.random(), Math.random(), Math.random(), Math.random(), Math.random() ].join(''); // Sort of password
			player_settings.my_net_id = undefined;
			
			/*try 
			{
				let v;
				
				v = localStorage.getItem( 'perm_password' );
				if ( v !== null )
				player_settings.perm_password = v;
				else
				localStorage.setItem( 'perm_password', player_settings.perm_password );

			} catch(e){}*/
			
			try 
			{
				let v;
				
			    v = localStorage.getItem( 'my_hash' );
			    if ( v !== null )
				player_settings.my_hash = v;
				else
				localStorage.setItem( 'my_hash', player_settings.my_hash );
			
			    v = localStorage.getItem( 'my_net_id' );
			    if ( v !== null )
				player_settings.my_net_id = v;
			
			} catch(e){}

			socket.emit( 'RESPAWN', player_settings );

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
		}
	}
	static Stop()
	{
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
		//var output = [];
		
		const command_match_table = sdWorld.draw_operation_command_match_table;
		const methods_per_command_id = sdWorld.draw_methods_per_command_id;

		const output = [];
		
		sdWorld.draw_methods_output_ptr = output;
		
		var fake_ctx = new Proxy( 
			{}, 
			{
				get: function( target, name )
				{
					if ( name === 'drawImage' )
					name = 'drawImageFilterCache';
					
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
										sdWorld.draw_methods_output_ptr.push( command_id, args[ 0 ] );
										return;
									}
								}
								
								if ( args.length === 0 ) // ctx.save/restore don't need args
								{
									sdWorld.draw_methods_output_ptr.push( command_id );
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
					
					return true;
				}
			}
		);

		ent.Draw( fake_ctx, false );
		ent.DrawFG( fake_ctx, false );
		
		if ( output.length === 0 )
		{
			debugger;
			ent.Draw( fake_ctx, false );
			ent.DrawFG( fake_ctx, false );
		}
		
		sdWorld.draw_methods_output_ptr = null;
		
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
	static ApplyDrawOperations( ctx, output )
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
			{
				opcode = output[ i ];
			}
			
			
			if ( typeof output[ i ] !== 'number' || sdWorld.draw_operation_no_parameters[ opcode ] )
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
							args = args.slice(); // Do not overwrite old array
						}
						
						/*let img_object = sdWorld.lost_images_cache[ args[ 0 ] ];
						
						if ( !sdWorld.lost_images_cache || sdWorld.lost_images_cache[ args[ 0 ] ] )
						{
							sdWorld.CreateImageFromFile( args[ 0 ] );
							
							args[ 0 ] = img_object;
						}*/
						args[ 0 ] = sdWorld.CreateImageFromFile( args[ 0 ] );
					}
					
					if ( sdWorld.draw_operation_no_parameters[ opcode ] )
					ctx[ method_name ]();
					else
					ctx[ method_name ]( ...args );
				}
			}
		}
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
export default sdWorld;
	
	