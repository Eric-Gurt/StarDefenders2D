
/* global globalThis, process */

// http://localhost:3000 + world_slot

// CentOS crontab can be here: /etc/crontab

/*

	TODO:

	- This could help for high latency cases: https://github.com/geckosio/geckos.io // Actually not that much, main server's low bandwidth is low bandwidth


 
*/

//import heapdump from 'heapdump';
//import ofe from 'ofe';

import zlib from 'zlib';

import _app from 'express';
const app = _app();

import path from 'path';
import fs from 'fs';

//import { createServer } from "http";
import http from "http";
import https from "https";

//import pkg from '@geckos.io/server'; // 
//const geckos = pkg.default;
import { Server } from "socket.io";

const SOCKET_IO_MODE = ( typeof Server !== 'undefined' ); // In else case geckos.io


const httpServer = http.createServer( app );
let   httpsServer = null;

var isWin = process.platform === "win32";
globalThis.isWin = isWin;

if ( !isWin )
{
	const ssl_key_path = '/usr/local/directadmin/data/users/admin/domains/gevanni.com.key';
	const ssl_cert_path = '/usr/local/directadmin/data/users/admin/domains/gevanni.com.cert';
	const credentials = {
		key: fs.readFileSync( ssl_key_path ),
		cert: fs.readFileSync( ssl_cert_path )
	};
	httpsServer = https.createServer( credentials, app ); // https version
	
	setInterval(()=>{
		
			//console.log( httpsServer.key, httpsServer.cert );
		
		 httpsServer.key = fs.readFileSync( ssl_key_path );
		 httpsServer.cert = fs.readFileSync( ssl_cert_path );

	}, 2147483647 );
}

// process.cwd() - current working directory
// require.main.paths[0].split('node_modules')[0].slice(0, -1) - ?



let script_path_id = -1;
let script_path_id_alter = -1;

for ( let i = 0; i < process.argv.length; i++ )
{
	if ( script_path_id === -1 )
	if ( process.argv[ i ].indexOf( 'index.js' ) !== -1 )
	script_path_id = i;
	
	if ( script_path_id_alter === -1 )
	if ( process.argv[ i ].indexOf( '.js' ) !== -1 )
	script_path_id_alter = i;
	
	if ( script_path_id !== -1 )
	if ( script_path_id_alter !== -1 )
	break;
}
if ( script_path_id === -1 )
script_path_id = script_path_id_alter;

if ( script_path_id === -1 )
{
	throw new Error('I have no idea where application folder is... Could not find index.js (or any else .js) in process.argv variable, which is: ', process.argv );
}

let full_path = process.argv[ script_path_id ];

let __dirname;

if ( isWin )
{
	__dirname = full_path.split( '\\' );
	__dirname[ __dirname.length - 1 ] = '';
	__dirname = __dirname.join( '\\' );
}
else
{
	__dirname = full_path.split( '/' );
	__dirname[ __dirname.length - 1 ] = '';
	__dirname = __dirname.join( '/' );
}
//console.log( '__dirname = ' + __dirname );

//throw new Error('manual stop');
/*
const __dirname = ( isWin ) ? 
	path.resolve()
	: 
	'/home/admin/sd2d/';*/

let io;

if ( SOCKET_IO_MODE ) // Socket.io
{
	io = new Server( httpsServer ? httpsServer : httpServer, {
	  // ...
	  pingInterval: 30000,
	  pingTimeout: 15000,
	  maxHttpBufferSize: 1024, // 512 is minimum that works (but lacks long-name support on join)
	  perMessageDeflate: {
		threshold: 1024
	  }, // Promised to be laggy but with traffic bottlenecking it might be the only way (and nature of barely optimized network snapshots)
	  httpCompression: {
		threshold: 1024
	  },
	  transports: [ 'websocket' ] // Trying to disable polling one, maybe this will work better?
	});
}
else // Geckos
{
	console.log( 'geckos is ', geckos );
	io = geckos({
		authorization: async function( auth, request, response )
		{
			//debugger;
			//response.setHeader('www-authenticate', 'Test testa="testb"');
			
			return { ip:request.connection.remoteAddress }; // or request.headers['x-forwarded-for'] if server is behind proxy
		},
		cors: { allowAuthorization: true }
	});
	//io.listen( 3001 );
	
	io.addServer( httpsServer ? httpsServer : httpServer );
}
	
// let that = this; setTimeout( ()=>{ sdWorld.entity_classes[ that.name ] = that; }, 1 ); // Old register for object spawn code
import sdWorld from './game/sdWorld.js';

import sdEntity from './game/entities/sdEntity.js';
import sdCharacter from './game/entities/sdCharacter.js';
import sdGun from './game/entities/sdGun.js';
import sdBlock from './game/entities/sdBlock.js';
import sdEffect from './game/entities/sdEffect.js';
import sdCrystal from './game/entities/sdCrystal.js';
import sdBullet from './game/entities/sdBullet.js';
import sdCom from './game/entities/sdCom.js';
import sdAsteroid from './game/entities/sdAsteroid.js';
import sdVirus from './game/entities/sdVirus.js';
import sdTeleport from './game/entities/sdTeleport.js';
import sdDoor from './game/entities/sdDoor.js';
import sdWater from './game/entities/sdWater.js';
import sdBG from './game/entities/sdBG.js';
import sdWeather from './game/entities/sdWeather.js';
import sdTurret from './game/entities/sdTurret.js';
import sdMatterContainer from './game/entities/sdMatterContainer.js';
import sdMatterAmplifier from './game/entities/sdMatterAmplifier.js';
import sdQuickie from './game/entities/sdQuickie.js';
import sdOctopus from './game/entities/sdOctopus.js';
import sdAntigravity from './game/entities/sdAntigravity.js';
import sdCube from './game/entities/sdCube.js';
import sdLamp from './game/entities/sdLamp.js';
import sdCommandCentre from './game/entities/sdCommandCentre.js';
import sdBomb from './game/entities/sdBomb.js';
import sdHover from './game/entities/sdHover.js';
import sdStorage from './game/entities/sdStorage.js';
import sdAsp from './game/entities/sdAsp.js';
import sdModeration from './game/server/sdModeration.js';
import sdSandWorm from './game/entities/sdSandWorm.js';
import sdGrass from './game/entities/sdGrass.js';
import sdSlug from './game/entities/sdSlug.js';
import sdBarrel from './game/entities/sdBarrel.js';
import sdEnemyMech from './game/entities/sdEnemyMech.js';
import sdArea from './game/entities/sdArea.js';
import sdCrystalCombiner from './game/entities/sdCrystalCombiner.js';
import sdUpgradeStation from './game/entities/sdUpgradeStation.js';
import sdJunk from './game/entities/sdJunk.js';
import sdBadDog from './game/entities/sdBadDog.js';
import sdShark from './game/entities/sdShark.js';


import LZW from './game/server/LZW.js';
import sdSnapPack from './game/server/sdSnapPack.js';
import sdShop from './game/client/sdShop.js';
import sdSound from './game/sdSound.js';


console.warn = console.trace; // Adding stack trace support for console.warn, which it doesn't have by default for some reason in Node.JS

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
					console.warn( mat.constructor.name,'.'+property_to_enforce+' = '+v );
					else
					console.warn( mat.constructor.name,'.'+property_to_enforce+' = ',v );
					

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

// Early error catching
/*if ( false )
{
	console.log('Early error catching enabled, waiting 10 seconds before doing anything...');
	await new Promise(resolve => setTimeout(resolve, 10000));
}*/

sdWorld.init_class();
sdEntity.init_class();
sdCharacter.init_class();
sdEffect.init_class();
sdGun.init_class(); // must be after sdEffect
sdBlock.init_class();
sdCrystal.init_class();
sdBG.init_class();
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

sdShop.init_class(); // requires plenty of classes due to consts usage
LZW.init_class();

globalThis.sdWorld = sdWorld;
globalThis.sdShop = sdShop;
globalThis.sdModeration = sdModeration;

let world_slot = 0; // Default slot adds no prefixes to file names

for ( let i = 0; i < process.argv.length; i++ )
{
	let parts = process.argv[ i ].split('=');
	
	if ( parts.length > 1 )
	{
		if ( parts[ 0 ] === 'world_slot' )
		world_slot = ~~( parts[ 1 ] );
		
	}
}
console.log('world_slot = ' + world_slot + ' (defines server instance file prefixes, can be added to run command arguments in form of world_slot=1)' );

let frame = 0;

/*function file_exists( url )
{
	return fs.stat( url, function(err, stat) 
	{
		if(err == null) {
			return true;
		} else if(err.code === 'ENOENT') {
			// file does not exist
			return false;//fs.writeFile('log.txt', 'Some log\n');
		} else {
			return false;//console.log('Some other error: ', err.code);
		}
	});

}*/
const file_exists = fs.existsSync;
globalThis.file_exists = file_exists;

let request_durations_worst = 0; // Normally would be 1-2ms

let request_durations_per_second_sum_worst = 0;

let request_durations = [];
let request_durations_time = 0;
let second_end_callback = null;
// Wider url catcher breaks socket?
/*
app.get('/*', (req, res) => 
{
	let t_sum = 0;
	
	function Finalize()
	{
		request_durations.push({ time:t_sum, url:req.url });
		
		if ( t_sum >= 10 )
		if ( t_sum > request_durations_worst )
		{
			request_durations_worst = t_sum;
			console.log('New slowest request ['+req.url+']: '+t_sum+'ms');
		}
		
		let s = 0;
		for ( let i = 0; i < request_durations.length; i++ )
		{
			s += request_durations[ i ].time;
		}
		
		if ( s > 100 )
		if ( s > request_durations_per_second_sum_worst )
		{
			request_durations_per_second_sum_worst = s;
			
			second_end_callback = ()=>
			{
				console.log('Requests called within 1 second took longest time: '+s+'ms :: Requests: ' + JSON.stringify( request_durations.slice(0,5) )+'... ('+request_durations.length+' requests)');
			};
		}
	}
	
	let t = Date.now();
	
	if ( request_durations_time !== Math.floor( t / 1000 ) )
	{
		if ( second_end_callback )
		{
			second_end_callback();
			second_end_callback = null;
		}
		request_durations_time = Math.floor( t / 1000 );
		request_durations.length = 0;
	}
	
	if ( req.url.indexOf('./') !== -1 || req.url.indexOf('/.') !== -1 )
	{
		
		t_sum += Date.now() - t;
		Finalize();
		return;
	}
	
	var path = __dirname + '/game' + req.url;
	//var path = './game' + req.url;
	fs.access(path.split('?')[0], fs.F_OK, (err) => 
	{
		let t3 = Date.now();
		
		if (err)
		{
			res.send( '404' );//console.error(err)
			
			t_sum += Date.now() - t3;
			Finalize();
			return;
		}
		res.sendFile( path );
		//file exists
		
		t_sum += Date.now() - t3;
		Finalize();
	});

	t_sum += Date.now() - t;
});*/

// Slower but less file stacking that could slow down game
let get_busy = false;
let busy_tot = 0;
app.get('/*', function cb( req, res, repeated=false )
{
	function Finalize()
	{
		get_busy = false;
	}
	
	if ( repeated !== true )
	busy_tot++;

	if ( get_busy )
	{
	
		setTimeout( ()=>{ cb( req, res, true ); }, 4 + Math.random() * 20 );
		return;
	}
	
	get_busy = true;
	busy_tot--;
	
	if ( busy_tot > 20 )
	console.log( 'Slowing down file download due to '+busy_tot+' files requested at the same time' );
	
	var path = __dirname + '/game' + req.url;
	//var path = './game' + req.url;
	fs.access(path.split('?')[0], fs.F_OK, (err) => 
	{
		let t3 = Date.now();
		
		if (err)
		{
			res.send( '404' );//console.error(err)
			
			Finalize();
			return;
		}
		res.sendFile( path );
		//file exists
		
		Finalize();
	});
});

var sockets = [];
var sockets_by_ip = {}; // values are arrays (for easier user counting per ip)
//var sockets_array_locked = false;
sdWorld.sockets = sockets;






const server_config_path_const = __dirname + '/server_config' + ( world_slot || '' ) + '.js';

const snapshot_path_const = __dirname + '/star_defenders_snapshot' + ( world_slot || '' ) + '.v';
const timewarp_path_const = __dirname + '/star_defenders_timewarp' + ( world_slot || '' ) + '.v';
const moderation_data_path_const = __dirname + '/moderation_data' + ( world_slot || '' ) + '.v';
const superuser_pass_path = __dirname + '/superuser_pass' + ( world_slot || '' ) + '.v';
const sync_debug_path = __dirname + '/sync_debug' + ( world_slot || '' ) + '.v';

sdWorld.server_config = {};

{
	let file_raw = '';
	if ( globalThis.file_exists( server_config_path_const ) )
	{
		file_raw = fs.readFileSync( server_config_path_const );
	}
	else
	{
		console.log('Unable to find file "'+server_config_path_const+'" - will create default one');
		
		file_raw = 
`class sdServerConfig
{
	// This file should contain one object (for example class like this one), it will be interpreted using basic eval method and automatically assigned to global variable sdWorld.server_config
			
	// If this all looks scary and you are using NetBeans - use "Ctrl + -" and "Ctrl + *" to hide big methods.
	
	static game_title = 'Star Defenders';
	
	static GetHitAllowed( bullet_or_sword, target )
	{
		// Cancel damage from bullet_or_sword towards target. ( bullet_or_sword._owner || bullet_or_sword._dangerous_from ) is a possible owner (can be null)
			
		return true;
	}
	
	static GetSocketScore( socket )
	{
		// Alternates return value of socket.GetScore() which is used for leaderboard
			
		return socket.character ? socket.character._score : 0;
	}
		
	static onDamage( target, initiator, dmg, headshot )
	{
		// Player (initiator, can be null in case of self-damage) damaged another player (target)
		
		if ( initiator )
		if ( initiator.is( sdCharacter ) )
		if ( initiator._socket )
		if ( sdWorld.time >= target._non_innocent_until ) // Check if victim is innocent
		initiator._non_innocent_until = sdWorld.time + 1000 * 30;
	}
	static onKill( target, initiator=null )
	{
		// Player (initiator) killed another player (target)
		
		// Check if initiator exists, is a sdCharacter and has player behind him
		if ( initiator )
		if ( initiator.is( sdCharacter ) )
		if ( initiator._socket )
		if ( !target._ai_enabled ) // Make sure not a real player is being killed
		if ( sdWorld.time < initiator._non_innocent_until ) // Attacker is not innocent
		{
			if ( initiator._socket.ffa_warning === 0 )
			initiator._socket.SDServiceMessage( 'Your respawn rate was temporarily decreased' );

			initiator._socket.SyncFFAWarning();
			initiator._socket.ffa_warning += 1;
			initiator._socket.respawn_block_until = sdWorld.time + initiator._socket.ffa_warning * 5000;
		}
	}
			
	static GetAllowedWorldEvents()
	{
		return undefined; // Return array of allowed event IDs or "undefined" to allow them all
	}
	static GetDisallowedWorldEvents()
	{
		return []; // Return array of disallowed event IDs. Has higher priority over GetAllowedWorldEvents() and can be used to allow any new events that will be added to the game with updates
	}
			
	static onExtraWorldLogic( GSPEED )
	{
	}
			
	static ResetScoreOnDeath( character_entity )
	{
		return true;
	}
			
	static onDisconnect( character_entity, reason ) // reason can be either 'disconnected' (connection lost) or 'manual' (player right clicked on himself or pressed Space while dead)
	{
		// Player lost control over sdCharacter (does not include full death case). Note that in case of reason being 'manual' player will get damage equal to his .hea (health) value.
		
	}
			
	static onReconnect( character_entity, player_settings )
	{
		// Player was reconnected. Alternatively onRespawn can be called
		
	}
	static onRespawn( character_entity, player_settings )
	{
		// Player just fully respawned. Best moment to give him guns for example. Alternatively onReconnect can be called
		
		// Spawn starter items based off what player wants to spawn with
		let guns = [ sdGun.CLASS_BUILD_TOOL ];
		if ( player_settings.start_with1 )
		guns.push( sdGun.CLASS_PISTOL );
		else
		guns.push( sdGun.CLASS_SWORD );

		for ( var i = 0; i < sdGun.classes.length; i++ )
		if ( guns.indexOf( i ) !== -1 )
		{
			let gun = new sdGun({ x:character_entity.x, y:character_entity.y, class: i });
			sdEntity.entities.push( gun );

			if ( i !== sdGun.CLASS_BUILD_TOOL )
			character_entity.gun_slot = sdGun.classes[ i ].slot;
		}
			
		// Track early damage and save this kind of info for later
		const EarlyDamageTaken = ( character_entity, dmg, initiator )=>
		{
			if ( character_entity.hea - dmg <= 30 )
			{
				sdWorld.no_respawn_areas.push({
					x: character_entity.x,
					y: character_entity.y,
					radius:150,
					until: sdWorld.time + 1000 * 60 // 1 minute at area
				});

				if ( initiator )
				{
					sdWorld.no_respawn_areas.push({
						x: character_entity.x,
						y: character_entity.y,
						entity: initiator,
						radius:250,
						until: sdWorld.time + 1000 * 60 * 5 // 5 minutes around entity that damaged
					});
				}

				character_entity.removeEventListener( 'DAMAGE', EarlyDamageTaken );
			}
		};
		character_entity.addEventListener( 'DAMAGE', EarlyDamageTaken );
		
		// Disable starter damage tracking after while
		setTimeout( ()=>
		{
			character_entity.removeEventListener( 'DAMAGE', EarlyDamageTaken );
		}, 5000 );
		
		// Instructor, obviously
		if ( player_settings.hints2 )
		{
			let intro_offset = 0;
			let intro_to_speak = [
				'Welcome to Star Defenders!',
				'This is a sandbox-type of game where you can play and interact with other players.',
				'You can move around by pressing W, S, A and D keys.',
				'You can look around and aim by moving your mouse.',
				'You can press Left Mouse button to fire.',
				'Attacks require a resource called Matter.',
				'Matter can be found in underground crystals.',
				'You can try digging ground in order to find crystals, but finding them is not guaranteed.',
				'Sometimes you might encounter enemies and other players.',
				'You can interact with other players by sending proximity chat messages.',
				'Press Enter key to start typing chat messages. Press Enter key again to send them.',
				'You can switch active device by pressing keys from 1 to 9.',
				'Each device uses its\\' own slot represented with number.',
				'Slot 9 is a Build tool. Press 9 Key in order to activate build mode.',
				'Once you have selected slot 9, you can press Right Mouse button in order to enter build selection menu.',
				'You can also press B key to open build selection menu directly.',
				'In that menu you will find placeable entities such as walls and weapons as well as upgrades.',
				'On respawn you will lose all your upgrades.',
				'Jetpack ability can be activated by pressing W or Space mid-air.',
				'Grappling hook ability can be activated with Mouse Wheel click or C key.',
				'Ghosting ability can be activated by pressing E key.',
				'Defibrillator can revive passed out players.',
				'You can throw held items by pressing V key.',
				'You can aim at background-level walls by holding Shift key.',
				'And finally, you can disable these hints at start screen.',
				'Good luck!'
			];
			
			let my_character_entity = character_entity;
			
			
			
			let instructor_entity = new sdCharacter({ x:my_character_entity.x + 32, y:my_character_entity.y - 32 });
			let instructor_gun = new sdGun({ x:instructor_entity.x, y:instructor_entity.y, class:sdGun.CLASS_RAILGUN });
			
			let instructor_settings = {"hero_name":"Instructor","color_bright":"#7aadff","color_dark":"#25668e","color_visor":"#ffffff","color_suit":"#000000","color_shoes":"#303954","color_skin":"#51709a","voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"color_suit2":"#000000","color_dark2":"#25668e"};

			instructor_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter( instructor_settings );
			instructor_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( instructor_settings );
			instructor_entity.title = instructor_settings.hero_name;
			//instructor_entity.matter = 1;
			instructor_entity.matter_max = 1;
			let instructor_interval0 = setInterval( ()=>
			{
				if ( instructor_entity.hea <= 0 || instructor_entity._is_being_removed )
				instructor_gun.remove();
				
				if ( my_character_entity._is_being_removed || 
					 instructor_entity._is_being_removed || 
					 my_character_entity._socket === null || 
					 ( instructor_entity.hea <= 0 && sdWorld.Dist2D( instructor_entity.x, instructor_entity.y, my_character_entity.x, my_character_entity.y ) > 800 ) )
				{
					instructor_gun.remove();
					instructor_entity.remove();
					clearInterval( instructor_interval0 );
					return;
				}
				
				instructor_entity.gun_slot = sdGun.classes[ sdGun.CLASS_RAILGUN ].slot;
				
				instructor_entity._key_states.SetKey( 'KeyA', 0 );
				instructor_entity._key_states.SetKey( 'KeyD', 0 );
				instructor_entity._key_states.SetKey( 'KeyW', 0 );
				
				if ( instructor_entity.x < my_character_entity.x - 32 )
				instructor_entity._key_states.SetKey( 'KeyD', 1 );
			
				if ( instructor_entity.x > my_character_entity.x + 32 )
				instructor_entity._key_states.SetKey( 'KeyA', 1 );
			
				if ( my_character_entity.stands )
				if ( instructor_entity.y > my_character_entity.y + 8 )
				instructor_entity._key_states.SetKey( 'KeyW', 1 );
			
				instructor_entity.look_x = my_character_entity.x;
				instructor_entity.look_y = my_character_entity.y;
				
			}, 100 );
			let instructor_interval = setInterval( ()=>
			{
				if ( instructor_entity && instructor_entity.hea > 0 && !instructor_entity._is_being_removed )
				{
					if ( my_character_entity.hea > 0 && !my_character_entity._dying )
					if ( sdWeather.only_instance )
					if ( sdWeather.only_instance.raining_intensity > 0 )
					if ( sdWeather.only_instance._rain_amount > 0 )
					if ( sdWeather.only_instance.TraceDamagePossibleHere( my_character_entity.x, my_character_entity.y ) )
					{
						if ( my_character_entity.matter > 5 )
						instructor_entity.Say( 'Looks like we are under the acid rain, try to find shelter or dig under the ground to hide from it.', false );
						else
						instructor_entity.Say( 'Looks like we are under the acid rain, try to find shelter or water.', false );
					
						return;
					}

					if ( intro_to_speak[ intro_offset ] )
					{
						instructor_entity.Say( intro_to_speak[ intro_offset ], false );
					}
					intro_offset++;
				}
				
				if ( intro_offset > intro_to_speak.length || instructor_entity._is_being_removed )
				{
					clearInterval( instructor_interval );
					instructor_entity.remove();
				}
				
			}, 7000 );
			
			
			sdEntity.entities.push( instructor_entity );
			sdEntity.entities.push( instructor_gun );
			
		}
	}
	static EntitySaveAllowedTest( entity )
	{
		// This method should return false in cases when specific entities should never be saved in snapshots (for example during reboot). Can be used to not save players for FFA servers especially if reboots are frequent
			
		return true;
	}
	static onBeforeSnapshotLoad()
	{
		// Do something before shapshot is loaded. It is earliest available stage of logic - you can edit or alter shop contents here
			
		sdWorld.no_respawn_areas = [];
	}
	static onAfterSnapshotLoad()
	{
		// World exists and players are ready to connect
		
		// In case of new server these will be 0. This will define initial world bounds:
		if ( sdWorld.world_bounds.x1 === 0 )
		if ( sdWorld.world_bounds.x2 === 0 )
		if ( sdWorld.world_bounds.y1 === 0 )
		if ( sdWorld.world_bounds.y2 === 0 )
		{
			console.log( 'Reinitializing world bounds' );
			sdWorld.ChangeWorldBounds( -16 * 10, -16 * 10, 16 * 10, 16 * 10 );
		}
			
		const world_edge_think_rate = 500;
			
		// Setup a logic for world bounds shifter
		setInterval( ()=>
		{
			let x1 = sdWorld.world_bounds.x1;
			let y1 = sdWorld.world_bounds.y1;
			let x2 = sdWorld.world_bounds.x2;
			let y2 = sdWorld.world_bounds.y2;

			// Locked decrease for removal of old parts
			let x1_locked = false;
			let y1_locked = false;
			let x2_locked = false;
			let y2_locked = false;

			let x1_locked_by = [];
			let y1_locked_by = [];
			let x2_locked_by = [];
			let y2_locked_by = [];

			let edge_cursious = []; // -1
			let edge_cursious_ent = [];

			let sockets = sdWorld.sockets;
			let no_respawn_areas = sdWorld.no_respawn_areas;

			function TellReason()
			{
				for ( var i = 0; i < edge_cursious_ent.length; i++ )
				{
					if ( edge_cursious_ent[ i ]._socket )
					{
						let blocking_by = [];

						switch ( edge_cursious[ i ] )
						{
							case 0: for ( var i2 = 0; i2 < x1_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( x1_locked_by[ i2 ]._net_id ) ); break;
							case 1: for ( var i2 = 0; i2 < x2_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( x2_locked_by[ i2 ]._net_id ) ); break;
							case 2: for ( var i2 = 0; i2 < y1_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( y1_locked_by[ i2 ]._net_id ) ); break;
							case 3: for ( var i2 = 0; i2 < y2_locked_by.length; i2++ ) blocking_by.push( sdEntity.GuessEntityName( y2_locked_by[ i2 ]._net_id ) ); break;
						}

						for ( var i2 = 0; i2 < blocking_by.length; i2++ )
						{
							let count = 1;
							for ( var i3 = i2 + 1; i3 < blocking_by.length; i3++ )
							{
								if ( blocking_by[ i2 ] === blocking_by[ i3 ] )
								{
									count++;
									blocking_by.splice( i3, 1 );
									i3--;
									continue;
								}
							}
							if ( count > 1 )
							{
								blocking_by[ i2 ] = blocking_by[ i2 ] + ' x' + count;
							}
						}

						if ( blocking_by.length === 1 )
						edge_cursious_ent[ i ]._socket.SDServiceMessage( 'World can not be extended past this point - ' + blocking_by.join(', ') + ' is at the opposite edge of playable area' );
						else
						edge_cursious_ent[ i ]._socket.SDServiceMessage( 'World can not be extended past this point - ' + blocking_by.join(', ') + ' are at the opposite edge of playable area' );
					}
				}
			}

			let top_matter = 0;


			for ( let i = 0; i < no_respawn_areas.length; i++ )
			{
				if ( sdWorld.time > no_respawn_areas[ i ].until )
				{
					no_respawn_areas.splice( i, 1 );
					i--;
					continue;
				}

				if ( no_respawn_areas[ i ].entity )
				{
					if ( no_respawn_areas[ i ].entity._is_being_removed )
					{
						no_respawn_areas.splice( i, 1 );
						i--;
						continue;
					}

					no_respawn_areas[ i ].x = no_respawn_areas[ i ].entity.x;
					no_respawn_areas[ i ].y = no_respawn_areas[ i ].entity.y;
				}
			}

			for ( let i = 0; i < sockets.length; i++ )
			{
				var ent = sockets[ i ].character;
				if ( ent !== null )
				if ( ent.hea > 0 )
				if ( !ent._is_being_removed )
				{
					if ( ent.matter > top_matter )
					top_matter = ent.matter;

					if ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 > 4000 )
					{
						if ( ent.x < sdWorld.world_bounds.x1 + 2000 )
						{
							x1_locked = true;
							x1_locked_by.push( ent );
						}

						if ( ent.x > sdWorld.world_bounds.x2 - 2000 )
						{
							x2_locked = true;
							x2_locked_by.push( ent );
						}
					}


					if ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 > 2000 )
					{
						if ( ent.y < sdWorld.world_bounds.y1 + 1000 )
						{
							y1_locked = true;
							y1_locked_by.push( ent );
						}

						if ( ent.y > sdWorld.world_bounds.y2 - 1000 )
						{
							y2_locked = true;
							y2_locked_by.push( ent );
						}
					}
					/*
					if ( ent.y < ( sdWorld.world_bounds.y1 + sdWorld.world_bounds.y2 ) / 2 )
					y1_locked = true;
					else
					y2_locked = true;*/

					if ( ent.x > sdWorld.world_bounds.x2 - 16 * 40 )
					{
						x2 += 16 * 5;

						if ( ent.x > sdWorld.world_bounds.x2 - 32 )
						{
							edge_cursious.push( 0 );
							edge_cursious_ent.push( ent );
						}
					}

					if ( ent.x < sdWorld.world_bounds.x1 + 16 * 40 )
					{
						x1 -= 16 * 5;
						if ( ent.x < sdWorld.world_bounds.x1 + 32 )
						{
							edge_cursious.push( 1 );
							edge_cursious_ent.push( ent );
						}
					}

					if ( ent.y > sdWorld.world_bounds.y2 - 16 * 40 )
					{
						y2 += 16 * 5;
						if ( ent.y > sdWorld.world_bounds.y2 - 32 )
						{
							edge_cursious.push( 2 );
							edge_cursious_ent.push( ent );
						}
					}

					if ( ent.y < sdWorld.world_bounds.y1 + 16 * 40 )
					{
						y1 -= 16 * 5;
						if ( ent.y < sdWorld.world_bounds.y1 + 32 )
						{
							edge_cursious.push( 3 );
							edge_cursious_ent.push( ent );
						}
					}
				}
			}

			for ( let i = 0; i < sdCommandCentre.centres.length; i++ )
			{
				var ent = sdCommandCentre.centres[ i ];

				if ( top_matter >= sdCharacter.matter_required_to_destroy_command_center )
				if ( ent.self_destruct_on < sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near - 1000 * 5 )
				{
					ent.self_destruct_on = Math.min( ent.self_destruct_on + world_edge_think_rate * 2, sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near );
				}

				if ( ent.x < sdWorld.world_bounds.x1 + 1000 )
				{
					x1_locked = true;
					x1_locked_by.push( ent );
				}
				if ( ent.x > sdWorld.world_bounds.x2 - 1000 )
				{
					x2_locked = true;
					x2_locked_by.push( ent );
				}

				if ( ent.y < sdWorld.world_bounds.y1 + 1000 )
				{
					y1_locked = true;
					y1_locked_by.push( ent );
				}
				if ( ent.y > sdWorld.world_bounds.y2 - 1000 )
				{
					y2_locked = true;
					y2_locked_by.push( ent );
				}
			}

			if ( sdWorld.world_bounds.x1 !== x1 ||
				 sdWorld.world_bounds.y1 !== y1 ||
				 sdWorld.world_bounds.x2 !== x2 ||
				 sdWorld.world_bounds.y2 !== y2 )
			{
				let min_width = 3200 * 2; // % 16
				let min_height = 1600 * 2; // % 16

				if ( x2 - x1 > min_width )
				{
					if ( x1_locked && x2_locked )
					{
						x1 = sdWorld.world_bounds.x1;
						x2 = sdWorld.world_bounds.x2;
						//return; 
					}
					else
					{
						if ( x1_locked )
						x2 = x1 + min_width;
						else
						x1 = x2 - min_width;
					}
				}

				if ( y2 - y1 > min_height )
				{
					if ( y1_locked && y2_locked )
					{
						y1 = sdWorld.world_bounds.y1;
						y2 = sdWorld.world_bounds.y2;
						//return;
					}
					else
					{
						if ( y1_locked )
						y2 = y1 + min_height;
						else
						y1 = y2 - min_height;
					}
				}

				if ( sdWorld.world_bounds.x1 !== x1 ||
					 sdWorld.world_bounds.y1 !== y1 ||
					 sdWorld.world_bounds.x2 !== x2 ||
					 sdWorld.world_bounds.y2 !== y2 )
				sdWorld.ChangeWorldBounds( x1, y1, x2, y2 );
				else
				TellReason();
			}
			else
			{
				TellReason();
			}

		}, world_edge_think_rate );
	}
	static PlayerSpawnPointSeeker( character_entity, socket )
	{
		let x,y,bad_areas_near,i;
		let tr = 0;
		let max_tr = 10000;
		do
		{
			x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
			y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

			if ( socket.command_centre )
			{
				if ( socket.command_centre._is_being_removed )
				{
					socket.command_centre = null;
					socket.SDServiceMessage( 'Command Centre no longer exists' );
				}
				else
				{
					if ( tr < max_tr * 0.05 )
					{
						x = socket.command_centre.x - 100 + Math.random() * 200;
						y = socket.command_centre.y - 100 + Math.random() * 200;
					}
					else
					if ( tr < max_tr * 0.1 )
					{
						x = socket.command_centre.x - 500 + Math.random() * 1000;
						y = socket.command_centre.y - 500 + Math.random() * 1000;
					}
					else
					if ( tr < max_tr * 0.15 )
					{
						x = socket.command_centre.x - 500 + Math.random() * 1000;
						y = socket.command_centre.y - 500 + Math.random() * 1000;
					}
				}
			}

			bad_areas_near = 0;

			for ( i = 0; i < sdWorld.no_respawn_areas.length; i++ )
			if ( sdWorld.inDist2D_Boolean( x, y, sdWorld.no_respawn_areas[ i ].x, sdWorld.no_respawn_areas[ i ].y, sdWorld.no_respawn_areas[ i ].radius ) )
			{
				bad_areas_near++;
				break;
			}

			let can_stand_here = character_entity.CanMoveWithoutOverlap( x, y, 0 ) && !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 );
			
			let ground_ent = sdWorld.last_hit_entity;

			if ( tr > max_tr * 0.6 || bad_areas_near === 0 )
			if ( tr > max_tr * 0.8 || ( can_stand_here && !sdWorld.CheckWallExistsBox( 
					x + character_entity.hitbox_x1 - 16, 
					y + character_entity.hitbox_y1 - 16, 
					x + character_entity.hitbox_x2 + 16, 
					y + character_entity.hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) ) )
			if ( tr > max_tr * 0.4 || socket.command_centre || ground_ent === null || ( ground_ent.GetClass() === 'sdBlock' && ground_ent.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
			{
				character_entity.x = x;
				character_entity.y = y;

				//sdWorld.UpdateHashPosition( ent, false );

				if ( socket.command_centre )
				{
					if ( Math.abs( socket.command_centre.x - x ) <= 200 && Math.abs( socket.command_centre.y - y ) <= 200 )
					{
						socket.respawn_block_until = sdWorld.time + 1000 * 10; // Not too frequently
					}
					else
					if ( Math.abs( socket.command_centre.x - x ) <= 500 && Math.abs( socket.command_centre.y - y ) <= 500 )
					{
						socket.respawn_block_until = sdWorld.time + 1000 * 10; // Not too frequently

						socket.SDServiceMessage( 'Unable to respawn too close to Command Centre (possibly due to recent spawnkills near Command Center)' );
					}
					else
					socket.SDServiceMessage( 'Unable to respawn near Command Centre (possibly due to recent spawnkills near Command Center)' );

				}

				break;
			}

			tr++;
			if ( tr > max_tr )
			{
				character_entity.x = x;
				character_entity.y = y;
				break;
			}
		} while( true );
	}
}`;
		fs.writeFileSync( server_config_path_const, file_raw );
	}

	eval( 'sdWorld.server_config = ' + file_raw );
}



sdWorld.snapshot_path_const = snapshot_path_const;
sdWorld.timewarp_path_const = timewarp_path_const;
sdWorld.moderation_data_path_const = moderation_data_path_const;
sdWorld.superuser_pass_path = superuser_pass_path;

let strange_position_classes = {};

//let snapshot_path = __dirname + '/star_defenders_snapshot.v';
let is_terminating = false;
{
	// World save test
	let snapshot_save_busy = false;
	function SaveSnapshot( snapshot_path, callback )
	{
		if ( snapshot_save_busy || is_terminating )
		return;

		let start_time = Date.now();

		snapshot_save_busy = true;

		let entities = [];
		

		let save_obj = 
		{
			bounds: sdWorld.world_bounds,
			entity_net_ids: sdEntity.entity_net_ids,
			seed: sdWorld.SeededRandomNumberGenerator.seed,
			base_ground_level1: sdWorld.base_ground_level1,
			base_ground_level2: sdWorld.base_ground_level2,
			entities: entities
		};

		for ( var i = 0; i < sdEntity.entities.length; i++ )
		if ( !sdWorld.server_config.EntitySaveAllowedTest || sdWorld.server_config.EntitySaveAllowedTest( sdEntity.entities[ i ] ) )
		{
			if ( isNaN( sdEntity.entities[ i ].x ) || isNaN( sdEntity.entities[ i ].y ) || sdEntity.entities[ i ].x === null || sdEntity.entities[ i ].y === null )
			if ( typeof strange_position_classes[ sdEntity.entities[ i ].GetClass() ] === 'undefined' )
			{
				console.log( sdEntity.entities[ i ].GetClass() + ' has strange position during saving: ' + sdEntity.entities[ i ].x + ', ' + sdEntity.entities[ i ].y + ' (nulls could mean NaNs) - not reporting this class with same kind of error anymore...' );
				strange_position_classes[ sdEntity.entities[ i ].GetClass() ] = 1;
			}
		
			entities.push( sdEntity.entities[ i ].GetSnapshot( frame, true ) );
		}


		let snapshot_made_time = Date.now();


		let json = JSON.stringify( save_obj );

		let json_made_time = Date.now();

		let deflate_done_time = 0;
		let save_done_time = 0;

		function Report( err )
		{
			console.log('Backup timings report (ms): ' + [
				snapshot_made_time - start_time,
				json_made_time - snapshot_made_time,
				deflate_done_time - json_made_time,
				save_done_time - deflate_done_time
			].join(', ') );
			
			if ( callback )
			callback( err );
		}

		// zlib.deflate(buffer
		zlib.deflate( json, ( err, buffer )=>{

			deflate_done_time = Date.now();

			if ( err )
			{
				console.warn( 'Compression error: ', err );

				Report( true );
				snapshot_save_busy = false;
			}
			else
			{
				// This must run inside a function marked `async`:
				//const file = await fs.readFile('filename.txt', 'utf8');
				fs.writeFile( snapshot_path, buffer, ( err )=>
				{
					save_done_time = Date.now();

					if ( err )
					{
						console.warn( 'Snapshot was not saved: ', err );
					}
					else
					console.log('Snapshot saved.');


					Report( false );
					snapshot_save_busy = false;
				});
				fs.writeFile( snapshot_path + '.raw.v', json, ( err )=>
				{
				});
			}

		});
	}
	
	sdWorld.SaveSnapshot = SaveSnapshot;
	sdWorld.PreventSnapshotSaving = () =>
	{
		snapshot_save_busy = true;
	};
	
	setInterval( ()=>{
		
		for ( var i = 0; i < sockets.length; i++ )
		sockets[ i ].SDServiceMessage( 'Server: Backup is being done!' );

		SaveSnapshot( snapshot_path_const, ( err )=>
		{
			for ( var i = 0; i < sockets.length; i++ )
			sockets[ i ].SDServiceMessage( 'Server: Backup is compelte ('+(err?'Error!':'successfully')+')!' );
		});
	}, 1000 * 60 * 15 ); // Once per 15 minutes
	
	
	
	setInterval( ()=>{
		
		if ( sdSnapPack.recent_worst_case_changed )
		{
			fs.writeFile( sync_debug_path + '.recent_worst.v', sdSnapPack.recent_worst_case, ( err )=>
			{
			});
			
			sdSnapPack.recent_worst_case = '';
		}
		
		if ( sdSnapPack.all_time_worst_case_changed )
		{
			fs.writeFile( sync_debug_path + '.all_time_worst.v', sdSnapPack.all_time_worst_case, ( err )=>
			{
			});
		}
	
	}, 1000 * 60 * 5 ); // Once per 5 minutes

	let termination_initiated = false;
	function onBeforeTurnOff()
	{
		if ( termination_initiated )
		return;
	
		termination_initiated = true;
		console.warn('SIGTERM signal received. Backup time?');
		
		for ( var i = 0; i < sockets.length; i++ )
		sockets[ i ].SDServiceMessage( 'Server reboot: Game server got SIGTERM signal from operating system. Attempting to save world state...' );
	
		const proceed = ( err )=>{
			
			console.warn('SaveSnapshot called callback (error='+err+'), saying goodbye to everyone and quiting process.');
		
			is_terminating = true;
			
			for ( var i = 0; i < sockets.length; i++ )
			sockets[ i ].SDServiceMessage( err ? 'Server reboot: Unable to save world snapshot...' : 'Server reboot: World snapshot has been saved! See you soon!' );
		
			setTimeout( ()=>
			{
				process.exit(1);
			}, 500 );

		};
	
		if ( snapshot_save_busy )
		setTimeout( proceed, 5000 ); // Let 5 seconds to complete saving
		else
		SaveSnapshot( snapshot_path_const, proceed );
	}
	process.on( 'SIGTERM', onBeforeTurnOff );
	process.on( 'SIGINT', onBeforeTurnOff );
}



if ( sdWorld.server_config.onBeforeSnapshotLoad )
sdWorld.server_config.onBeforeSnapshotLoad();

try
{
	const snapshot_path = snapshot_path_const;
	
	let packed_snapshot = fs.readFileSync( snapshot_path );
	let json = zlib.inflateSync( packed_snapshot );
	let save_obj = JSON.parse( json );
	
	
	/*
		let save_obj = 
		{
			bounds: sdWorld.world_bounds,
			entity_net_ids: sdEntity.entity_net_ids,
			base_ground_level1: sdWorld.base_ground_level1,
			base_ground_level2: sdWorld.base_ground_level2,
			entities: entities
		};
	*/
	sdWorld.world_bounds = save_obj.bounds;
	sdEntity.entity_net_ids = save_obj.entity_net_ids;
	
	if ( save_obj.seed !== undefined )
	sdWorld.SeededRandomNumberGenerator.seed = save_obj.seed;

	sdWorld.base_ground_level1 = save_obj.base_ground_level1;
	sdWorld.base_ground_level2 = save_obj.base_ground_level2;
	
	let i;
	
	sdWorld.unresolved_entity_pointers = [];
	
	let ent = null;
	
	for ( i = 0; i < save_obj.entities.length; i++ )
	{
		try
		{
			ent = sdEntity.GetObjectFromSnapshot( save_obj.entities[ i ] );
			/*
			if ( !ent ) // This can happen if saved entity is being removed
			{
				debugger
				ent = sdEntity.GetObjectFromSnapshot( save_obj.entities[ i ] );
			}
			*/
			if ( ent )
			if ( isNaN( ent.x ) || isNaN( ent.y ) || ent.x === null || ent.y === null )
			{
				if ( typeof strange_position_classes[ ent.GetClass() ] === 'undefined' )
				{
					console.log( ent.GetClass() + ' has strange position during loading: ' + ent.x + ', ' + ent.y + ' (nulls could mean NaNs) - not reporting this class with same kind of error anymore...' );
					strange_position_classes[ ent.GetClass() ] = 1;
				}
				ent.remove();
			}
			
			// This is done because some variable-size entities might end up having wrong hash areas occupied after reboot, for example sdArea. Possibly due to _hiberstate being not really set since it already had final target value
			if ( ent )
			if ( !ent._is_being_removed )
			{
				if ( ent._affected_hash_arrays.length > 0 ) // Easier than checking for hiberstates
				sdWorld.UpdateHashPosition( ent, false, false );
			}
		}
		catch( e )
		{
			console.warn('entity snapshot wasn\'t decoded because it contains errors: ', e, save_obj.entities[ i ] );
		}
	}
	let arr;
	for ( i = 0; i < sdWorld.unresolved_entity_pointers.length; i++ )
	{
		arr = sdWorld.unresolved_entity_pointers[ i ];
		
		arr[ 0 ][ arr[ 1 ] ] = sdEntity.GetObjectByClassAndNetId( arr[ 2 ], arr[ 3 ] );
		
		if ( arr[ 0 ][ arr[ 1 ] ] === null )
		{
			console.warn('Entity pointer could not be resolved even at later stage for ' + arr[ 0 ].GetClass() + '.' + arr[ 1 ] + ' :: ' + arr[ 2 ] + ' :: ' + arr[ 3 ] );
			debugger;
		}
		
		//sdWorld.unresolved_entity_pointers.push([ snapshot, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
	}
	sdWorld.unresolved_entity_pointers = null;

	console.log('Continuing from where we\'ve stopped (snapshot decoded)!');
	//fs.writeFile( 'sd2d_server_started_here.v', 'Continuing from where we\'ve stopped (snapshot decoded)!', ( err )=>{} );
}
catch( e )
{
	console.log('Snapshot wasn\'t found or contains errors. Doing fresh start.');
	//fs.writeFile( 'sd2d_server_started_here.v', 'Snapshot wasn\'t found or contains errors. Doing fresh start.' + JSON.stringify( e ), ( err )=>{} );
}


if ( sdEntity.global_entities.length === 0 )
{
	console.log( 'Recreating sdWeather' );
	//sdEntity.global_entities.push( new sdWeather({}) );
	sdEntity.entities.push( new sdWeather({}) );
}

if ( sdWorld.server_config.onAfterSnapshotLoad )
sdWorld.server_config.onAfterSnapshotLoad();


sdModeration.init_class();

if ( !SOCKET_IO_MODE )
{
	//const old_on = io.on;
	io.on = ( event, action )=>
	{
		if ( event === 'connection' )
		{
			io.onConnection( action );
		}
		else
		{
			console.warn('Event '+event+' is not supported in geckos mode');
			//old_on.call( io, event, action );
		}
	};
}

io.on("error", ( e ) => 
{
	console.warn( 'Global socket Error: ', e );
});

const DEBUG_CONNECTIONS = false;
/*
function GetPlayingPlayersCount()
{
	let c = 0;
	
	for ( let i = 0; i < sockets.length; i++ )
	if ( sockets[ i ].character !== null )
	if ( sockets[ i ].character.hea > 0 )
	if ( !sockets[ i ].character._is_being_removed )
	{
		c++;
	}
		
	return c;
}
*/
const GetPlayingPlayersCount = sdWorld.GetPlayingPlayersCount;

let game_ttl = 0; // Prevent frozen state
function IsGameActive()
{
	let c = GetPlayingPlayersCount();
	
	if ( c > 0 )
	{
		game_ttl = 150;
	}
	
	return ( game_ttl > 0 );
}

var no_respawn_areas = []; // arr of { x, y, radius, until }


let next_drop_log = 0;
io.on("connection", (socket) => 
//io.onConnection( socket =>
{
	//socket.packets_sent = 0;
	//socket.packets_dropped = 0;
	if ( !SOCKET_IO_MODE )
	{
		const old_on = socket.on;
		socket.on = ( event, action )=>
		{
			if ( event === 'disconnect' )
			socket.onDisconnect( action );
			else
			old_on.call( socket, event, action );
		};
		
		socket.disconnect = socket.close;
		
		socket.compress = ( b )=>{ return socket; };
		
		socket.volatile = socket;
		
		socket.client = { conn: { transport: { writable: true } } }; // Fake object just to keep main logic working
	}
	
	socket.sent_result_ok = 0;
	socket.sent_result_dropped = 0;

	socket.left_overs = {};
	socket.lost_messages = [];

	socket.sent_messages = new Map(); // { data: full_msg, time: sdWorld.time, arrived: false }
	socket.sent_messages_first = 0;
	socket.sent_messages_last = 0;

	socket.myDrop = ( drop ) => // { event, data }
	{
		if ( drop.event === 'RESv2' )
		{
			socket.sent_result_dropped++;

			let ent, ind, i2;

			for ( let i = 0; i < drop.data[ 0 ].length; i++ )
			{
				//console.log('Found dropped entity: ' + drop.data[ 0 ][ i ]._class + '['+drop.data[ 0 ][ i ]._net_id+']' );

				socket.left_overs[ drop.data[ 0 ][ i ]._net_id ] = drop.data[ 0 ][ i ];

			}
			for ( let i = 0; i < drop.data[ 3 ].length; i++ )
			{
				if ( drop.data[ 3 ][ i ][ 0 ] === 'EFF' && ( drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_CHAT /*|| drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_BEAM || drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_EXPLOSION || drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_BLOOD*/ ) )
				{
					if ( typeof drop.data[ 3 ][ i ][ 1 ].UC === 'undefined' ) // These can not be resent because they lack .UC set, which is unique ID for them so player knows he already applied these events.
					continue;
					
					// Since it is an Array - new property won't be sent in strigified version (I guess).
					if ( typeof drop.data[ 3 ][ i ]._give_up_on === 'undefined' )
					drop.data[ 3 ][ i ]._give_up_on = sdWorld.time + 5000;
					else
					if ( sdWorld.time > drop.data[ 3 ][ i ]._give_up_on )
					{
						//console.log('Dropping message after 5 seconds of resending: ', drop.data[ 3 ][ i ] );
						continue;
					}
					
					
					socket.lost_messages.push( drop.data[ 3 ][ i ] );
				}
			}
		}
	};
	
	let ip = null;
	let details = null;
		
	if ( SOCKET_IO_MODE )
	ip = socket.client.conn.remoteAddress;
	else
	{
		ip = '?:?:?:?';
		
		if ( socket.userData.ip !== undefined )
		ip = socket.userData.ip;
	}
	
	//let my_command_centre = null;
	socket.command_centre = null;
	
	socket.max_update_rate = sdWorld.max_update_rate;
	
	ip = ip.split(':');
	
	// To subnet format
	let ip2 = ip[ ip.length - 1 ].split('.');
	ip2[ ip2.length - 1 ] = '*';
	ip[ ip.length - 1 ] = ip2.join('.');
	
	ip = ip.join(':');
	
	
	
	if ( DEBUG_CONNECTIONS )
	{
		console.log( 'a user connected: ' + ip + ' aka ' + JSON.stringify( details ) );
	}
	
	if ( typeof sockets_by_ip[ ip ] === 'undefined' )
	sockets_by_ip[ ip ] = [ socket ]; // Accept [ 1 / 2 ]
	else
	{
		if ( sockets_by_ip[ ip ].length + 1 > 10 )
		{
			if ( DEBUG_CONNECTIONS )
			console.log( 'Rejected, ' + sockets_by_ip[ ip ].length + ' active connections from same ip ' + ip );
		
			//if ( socket.disconnect )
			socket.disconnect();
			//else
			//socket.close();
		
			return;
		}
		
		sockets_by_ip[ ip ].push( socket ); // Accept [ 2 / 2 ]
	}
	sockets.push( socket );
	
	let shop_pending = true; // Assuming shop is not dynamic
	
	socket.character = null;
	
	socket.sd_events = []; // Mobile devices should work better if they won't be flooded with separate TCP event messages.
	
	socket.respawn_block_until = sdWorld.time + 400;
	socket.ffa_warning = 0; // Will be used for slower respawn
	
	{
		let pc = GetPlayingPlayersCount();
		for ( var i = 0; i < sockets.length; i++ )
		{
			if ( sockets[ i ].character && !sockets[ i ].character._is_being_removed )
			sockets[ i ].sd_events.push( [ 'ONLINE', [ sockets.length, pc ] ] ); // In-game case
			else
			sockets[ i ].emit( 'ONLINE', [ sockets.length, pc ] ); // Character cusomization screen
		}
	}
	
	socket.emit( 'INIT', 
	{
		game_title: sdWorld.server_config.game_title || 'Star Defenders',
		backgroundColor: sdWorld.server_config.backgroundColor || ''
	});
	
	//globalThis.EnforceChangeLog( sockets, sockets.indexOf( socket ) );
	
	socket.last_sync = sdWorld.time;
	socket.last_sync_score = sdWorld.time;
	
	socket.camera = { x:0,y:0,scale:1 };
	
	socket.observed_entities = [];
	
	//socket.known_statics = [];
	//socket.known_statics_versions = [];
	
	//socket.known_statics_map = new WeakMap();
	socket.known_statics_versions_map = new Map();
	
	socket.my_hash = null;


	socket.on("error", ( e ) => 
	{
		console.warn( 'Local socket Error: ', e );
	});
	
	//socket.score = 0; // Reserved for custom config usage
	//EnforceChangeLog( socket, 'score' );
	
	socket.GetScore = ()=>
	{
		if ( sdWorld.server_config.GetSocketScore )
		return sdWorld.server_config.GetSocketScore( socket );
	
		return socket.character ? socket.character._score : 0;
	};
	
	socket.post_death_spectate_ttl = 0;
	
	socket.SyncFFAWarning = ()=>
	{
		// Sync respawn blocks
		if ( sockets_by_ip[ ip ] ) // It is possible to get a case where user would fully disconnect. This check prevents crash.
		for ( var i = 0; i < sockets_by_ip[ ip ].length; i++ )
		{
			socket.respawn_block_until = Math.max( socket.respawn_block_until, sockets_by_ip[ ip ][ i ].respawn_block_until );
			socket.ffa_warning = Math.max( socket.ffa_warning, sockets_by_ip[ ip ][ i ].ffa_warning );
		}
	};
	
	const stacked_service_messages = [];
	let service_message_interval_exists = null;
	let service_message_allow_next_in = sdWorld.time + 500;
	socket.SDServiceMessage = ( m=null )=>
	{
		if ( typeof m === 'string' )
		stacked_service_messages.push( m );
	
		if ( stacked_service_messages.length > 0 )
		{
			// Skip anything but first and last
			if ( stacked_service_messages.length > 2 )
			stacked_service_messages.splice( 1, stacked_service_messages.length - 2 );

			if ( sdWorld.time > service_message_allow_next_in )
			{
				socket.emit( 'SERVICE_MESSAGE', stacked_service_messages[ 0 ] );
				stacked_service_messages.shift();
				service_message_allow_next_in = sdWorld.time + 500;
			}
		}

		if ( stacked_service_messages.length > 0 )
		{
			if ( !service_message_interval_exists )
			service_message_interval_exists = setInterval( socket.SDServiceMessage, 500 );
		}
		else
		if ( service_message_interval_exists )
		{
			clearInterval( service_message_interval_exists );
			service_message_interval_exists = null;
		}
	};
	
	/* 
	// Should work as independent set of commands:
	socket.respawn_block_until = sdWorld.time - 1;
	socket.last_player_settings.full_reset = true;
	socket.Respawn( socket.last_player_settings );
	*/
	
	socket.last_player_settings = null;
	socket.Respawn = ( player_settings, force_allow=false ) => { 
		
		socket.last_ping = sdWorld.time;
		socket.waiting_on_M_event_until = 0;
		
		socket.last_player_settings = player_settings;
		
		socket.SyncFFAWarning();
		/* Moved down so it only prevents full respawn
		if ( !force_allow && sdWorld.time < socket.respawn_block_until )
		{
			//socket.SDServiceMessage( 'Respawn rejected - too quickly (wait ' + ( socket.respawn_block_until - sdWorld.time ) + 'ms)' );
			socket.SDServiceMessage( 'Respawn rejected - too quickly (wait ' + Math.ceil( ( socket.respawn_block_until - sdWorld.time ) / 100 ) / 10 + ' seconds)' );
			return;
		}
		socket.respawn_block_until = sdWorld.time + 2000; // Will be overriden if player respawned near his command centre
		
		socket.post_death_spectate_ttl = 30;
		
		*/
		socket.my_hash = player_settings.my_hash;
		
		socket.sd_events = []; // Just in case? There was some source of 600+ events stacked, possibly during start screen waiting or maybe even during player being removed. Lots of 'C' events too
		
		//socket.respawn_block_until = sdWorld.time + 400;
		
		//let old_score = socket.score;
		
		//if ( !sdWorld.server_config.ResetScoreOnDeath || sdWorld.server_config.ResetScoreOnDeath() )
		//socket.score = 0;
		
		let character_entity = null;
		
		function RemoveOldPlayerOnSocket()
		{
			if ( socket.character )
			{
				if ( sdWorld.server_config.onDisconnect )
				sdWorld.server_config.onDisconnect( socket.character, 'manual' );

				if ( socket.character.title.indexOf( 'Disconnected ' ) !== 0 )
				socket.character.title = 'Disconnected ' + socket.character.title;

				if ( !socket.character._is_being_removed )
				if ( socket.character.hea > 0 )
				socket.character.Damage( socket.character.hea ); // With weapon drop
		
				//socket.character._old_score = socket.score;

				socket.character._socket = null;

				socket.character = null;
				
				//socket.score = 0;
			}
		}
		function SpawnNewPlayer()
		{
			character_entity = new sdCharacter({ x:0, y:0 });
			
			if ( sdWorld.server_config.PlayerSpawnPointSeeker )
			sdWorld.server_config.PlayerSpawnPointSeeker( character_entity, socket );
		}
		function TryToAssignDisconnectedPlayerEntity()
		{
			//player_settings.full_reset = full_reset;
			//player_settings.my_hash = Math.random() + '';
			//player_settings.my_net_id = undefined;
			
			if ( typeof sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ] === 'object' )
			if ( !sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._is_being_removed )
			{
				if ( sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._my_hash === player_settings.my_hash )
				{
					if ( sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._socket )
					{
						if ( sockets_by_ip[ ip ].indexOf( sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._socket ) !== -1 )
						{
							//await sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._socket.close(); // Try to disconnect old connection, can happen in geckos case if player reconnects too quickly
							sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._socket.CharacterDisconnectLogic();
						}
					}
					
					if ( !sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._socket )
					{
						sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ]._socket = socket;
						socket.character = sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ];

						character_entity = sdEntity.entities_by_net_id_cache[ player_settings.my_net_id ];

						//socket.score = character_entity._old_score;
						//character_entity._old_score = 0;
					}
				}
			}
			
			// Probably not a good thing to do since non-full reset will not can bypass respawn timeout
			if ( character_entity === null )
			player_settings.full_reset = true; // Full reset if no player can be found
		}
		
		if ( typeof player_settings.hero_name === 'string' )
		{
			if ( player_settings.hero_name.length <= 30 )
			{
				//player_settings.hero_name;
			}
			else
			{
				player_settings.hero_name = player_settings.hero_name.substring( 0, 30 );
				socket.SDServiceMessage( 'That is a long name, my friend' );
			}
		}
		else
		player_settings.hero_name = '?';
	
		if ( typeof player_settings.my_hash === 'string' )
		{
		}
		else
		player_settings.my_hash = 'unset' + Math.random() + '_got_' + ( typeof player_settings.my_hash );
	
		
		TryToAssignDisconnectedPlayerEntity();
		
		if ( player_settings.full_reset )
		{
			if ( !force_allow && sdWorld.time < socket.respawn_block_until )
			{
				//socket.SDServiceMessage( 'Respawn rejected - too quickly (wait ' + ( socket.respawn_block_until - sdWorld.time ) + 'ms)' );
				socket.SDServiceMessage( 'Respawn rejected - too quickly (wait ' + Math.ceil( ( socket.respawn_block_until - sdWorld.time ) / 100 ) / 10 + ' seconds)' );
				return;
			}
			socket.respawn_block_until = sdWorld.time + 2000; // Will be overriden if player respawned near his command centre
			socket.post_death_spectate_ttl = 30;




			RemoveOldPlayerOnSocket();
			SpawnNewPlayer();
			
			//if ( typeof player_settings.my_hash === 'string' )
			character_entity._my_hash = player_settings.my_hash;
		}
		else
		{
			
		}
		character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter( player_settings );
		character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( player_settings );
		
		character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( player_settings );
		
		character_entity.title = player_settings.hero_name;
		
		//character_entity.sd_filter = {};
		//sdWorld.ReplaceColorInSDFilter( character_entity.sd_filter, [ 0,0,128 ], [ 128,0,0 ] );

		character_entity._socket = socket; // prevent json appearence
		
		//playing_players++;
		
		
		


		socket.emit('SET sdWorld.my_entity', character_entity._net_id, { reliable: true, runs: 100 } );

		if ( shop_pending )
		{
			shop_pending = false;
			
			if ( !sdShop.options_snappack )
			{
				sdShop.options_snappack = LZW.lzw_encode( JSON.stringify( sdShop.options ) );
			}
			
			socket.emit('SET sdShop.options', sdShop.options_snappack, { reliable: true, runs: 100 } );
		}
		
		
		if ( character_entity._socket )
		{
			for ( var upgrade_name in character_entity._upgrade_counters )
			{
				character_entity._socket.emit( 'UPGRADE_SET', [ upgrade_name, character_entity._upgrade_counters[ upgrade_name ] ] );
			}
		}

		sdEntity.entities.push( character_entity );
		
		/*const EarlyDamageTaken = ( character_entity, dmg, initiator )=>
		{
			if ( character_entity.hea - dmg <= 30 )
			{
				BadSpawn( character_entity.x, character_entity.y, initiator );
				character_entity.removeEventListener( 'DAMAGE', EarlyDamageTaken );
			}
		};
		
		character_entity.addEventListener( 'DAMAGE', EarlyDamageTaken );
		
		setTimeout( ()=>
		{
			character_entity.removeEventListener( 'DAMAGE', EarlyDamageTaken );
		}, 5000 );*/

		socket.character = character_entity;
		
		if ( player_settings.full_reset )
		{
			if ( sdWorld.server_config.onRespawn )
			sdWorld.server_config.onRespawn( character_entity, player_settings );
			/*
			let guns = [ sdGun.CLASS_BUILD_TOOL ];
			if ( player_settings.start_with1 )
			guns.push( sdGun.CLASS_PISTOL );
			else
			guns.push( sdGun.CLASS_SWORD );

			for ( var i = 0; i < sdGun.classes.length; i++ )
			if ( guns.indexOf( i ) !== -1 )
			{
				let gun = new sdGun({ x:character_entity.x, y:character_entity.y, class: i });
				sdEntity.entities.push( gun );

				if ( i !== sdGun.CLASS_BUILD_TOOL )
				character_entity.gun_slot = sdGun.classes[ i ].slot;
			}*/
		}
		else
		{
			if ( sdWorld.server_config.onReconnect )
			sdWorld.server_config.onReconnect( character_entity, player_settings );
		}
		
	};
	
	socket.on('RESPAWN', socket.Respawn );
	
	// Input
	//socket.on('K1', ( key ) => { if ( socket.character ) socket.character._key_states.SetKey( key, 1 ); }); Mobile users send these too quickly as for TCP connection
	//socket.on('K0', ( key ) => { if ( socket.character ) socket.character._key_states.SetKey( key, 0 ); });
	
	socket.on('Kv2', ( sd_events )=>
	{
		if ( sd_events instanceof Array )
		if ( sd_events.length < 32 )
		for ( var i = 0; i < sd_events.length; i++ )
		{
			if ( sd_events[ i ].length !== 2 )
			return;
		
			var type = sd_events[ i ][ 0 ];
			var key = sd_events[ i ][ 1 ];
			
			if ( socket.character )
			{
				if ( type === 'K1' )
				socket.character._key_states.SetKey( key, 1 );
				else
				if ( type === 'K0' )
				socket.character._key_states.SetKey( key, 0 );
			}
		}
	});
	
	socket.on('CHAT', ( t ) => { 
		
		if ( t.charAt( 0 ) === '/' )
		{
			if ( t.length > 1000 )
			t = 'Error: Command is too long';
			else
			{
				sdModeration.CommandReceived( socket, t );
				return;
			}
		}
		
		if ( t.length > 100 )
		{
			t = t.slice( 0, 100 ) + '...';
		}
		
		if ( socket.character )
		if ( socket.character.hea > 0 || socket.character.death_anim < 30 ) // allow last words
		socket.character.Say( t, false );
	});
	socket.on('BUILD_SEL', ( v )=>
	{
		if ( socket.character ) 
		if ( typeof v === 'number' )
		{
			if ( typeof sdShop.options[ v ] !== 'undefined' && !sdShop.options[ v ]._opens_category )
			{
				socket.character._build_params = sdShop.options[ v ];
			}
			else
			socket.character._build_params = null;
		}
	});
	
	socket.waiting_on_M_event_until = 0; // Will cause server to wait for 1 second before trying to send data again. During this 1 second server will wait for any kind of response from client. If response arrives within 1 second then server is allowed to send snapshot to client and will wait for another 1 second for any reply to arrive to server
	socket.last_ping = sdWorld.time; // Used to disconnect dead connections
	socket.next_position_correction_allowed = 0;
	socket.on('M', ( arr ) => { // Position corrections. Cheating can happen here. Better solution could be UDP instead of TCP connections.
		
		if ( typeof arr[ 0 ] === 'number' )
		if ( typeof arr[ 1 ] === 'number' )
		if ( typeof arr[ 2 ] === 'number' )
		if ( typeof arr[ 3 ] === 'number' )
		if ( typeof arr[ 4 ] === 'number' )
		if ( typeof arr[ 5 ] === 'number' )
		if ( typeof arr[ 6 ] === 'number' )
		if ( typeof arr[ 7 ] === 'number' )
		if ( typeof arr[ 8 ] === 'object' )
		{
			socket.last_ping = sdWorld.time;
			socket.waiting_on_M_event_until = 0;
			
			if ( socket.character ) 
			{ 
				//messages_to_report_arrival
				socket.character.look_x = arr[ 0 ]; 
				socket.character.look_y = arr[ 1 ];

				socket.camera.x = arr[ 2 ];
				socket.camera.y = arr[ 3 ];
				socket.camera.scale = arr[ 4 ];

				let messages_to_report_arrival = arr[ 8 ];

				for ( let i = 0; i < Math.min( 100, messages_to_report_arrival.length ); i++ )
				{
					let id = ~~( messages_to_report_arrival[ i ] );
					if ( id >= socket.sent_messages_first && id < socket.sent_messages_last )
					{
						let msg = socket.sent_messages.get( id );
						msg.arrived = true;
					}
				}

				if ( sdWorld.time > socket.next_position_correction_allowed )
				{
					let corrected = false;

					//if ( socket.character.hea > 0 )
					if ( socket.character.AllowClientSideState() ) // Health and hook change
					{

						var dx = arr[ 5 ] - socket.character.x;
						var dy = arr[ 6 ] - socket.character.y;

						let di = sdWorld.Dist2D_Vector( dx, dy );

						if ( Math.abs( dx ) < 200 && Math.abs( dy ) < 200 )
						{
							if ( di > 128 )
							{
								dx = dx / di * 16;
								dy = dy / di * 16;
							}
						}
						else
						{
							dx = 0;
							dy = 0;
						}
						if ( sdWorld.Dist2D( socket.character.x, socket.character.y, arr[ 5 ], arr[ 6 ] ) < 128 )
						{
							let jump_di = sdWorld.Dist2D_Vector( dx, dy );

							let steps = Math.ceil( jump_di / 16 );

							corrected = true;

							for ( let i = 1; i > 0; i -= 1 / steps )
							if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx * i, socket.character.y + dy * i, 1 ) )
							{
								corrected = false;
								break;
							}

							if ( !corrected )
							{
								corrected = true;

								// Up
								for ( let i = 1; i > 0; i -= 1 / steps )
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x, socket.character.y + dy * i, 1 ) )
								{
									corrected = false;
									break;
								}

								// Then to right
								if ( corrected )
								for ( let i = 1; i > 0; i -= 1 / steps )
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx * i, socket.character.y + dy, 1 ) )
								{
									corrected = false;
									break;
								}
							}


							if ( !corrected )
							{
								corrected = true;

								// Right
								for ( let i = 1; i > 0; i -= 1 / steps )
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx * i, socket.character.y, 1 ) )
								{
									corrected = false;
									break;
								}

								// Then to up
								if ( corrected )
								for ( let i = 1; i > 0; i -= 1 / steps )
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx, socket.character.y + dy * i, 1 ) )
								{
									corrected = false;
									break;
								}
							}

							//if ( socket.character.CanMoveWithoutOverlap( socket.character.x + dx, socket.character.y + dy, 1 ) )
							if ( corrected )
							{
								socket.next_position_correction_allowed = sdWorld.time + 100;
								socket.character.x += dx;
								socket.character.y += dy;
								/*
								let stand_on_net_id = arr[ 7 ]; // _net_id of stand_on target
								if ( typeof sdEntity.entities_by_net_id_cache[ stand_on_net_id ] !== 'undefined' )
								{
									let ent = sdEntity.entities_by_net_id_cache[ stand_on_net_id ];
									if ( !ent._is_being_removed )
									{
										if ( Math.abs( socket.character.x + socket.character.hitbox_x2 - ( ent.x + socket.character.hitbox_x1 ) ) < 2 )
										{
											socket.character.x = ent.x + socket.character.hitbox_x1 - socket.character.hitbox_x2 + 2;
										}
										else
										if ( Math.abs( socket.character.x + socket.character.hitbox_x1 - ( ent.x + socket.character.hitbox_x2 ) ) < 2 )
										{
											socket.character.x = ent.x + socket.character.hitbox_x2 - socket.character.hitbox_x1 - 2;
										}
									}
								}*/

								corrected = true;
							}
						}

						if ( !corrected )
						{
							socket.next_position_correction_allowed = sdWorld.time + 50;
							//socket.emit( 'C', [ socket.character.x, socket.character.y, socket.character.sx, socket.character.sy ] );
							socket.sd_events.push( [ 'C', [ socket.character.x, socket.character.y, socket.character.sx, socket.character.sy ] ] );
						}
					}
				}

				if ( socket.camera.x < socket.character.x - 400 )
				socket.camera.x = socket.character.x - 400;
				if ( socket.camera.x > socket.character.x + 400 )
				socket.camera.x = socket.character.x + 400;

				if ( socket.camera.y < socket.character.y - 200 )
				socket.camera.y = socket.character.y - 200;
				if ( socket.camera.y > socket.character.y + 200 )
				socket.camera.y = socket.character.y + 200;
			}
		}
	});
	
	socket.on('SELF_EXTRACT', ( net_id ) => { 
		
		if ( socket.character ) 
		{
			//let old_score = socket.score;
			
			let char = socket.character;
			socket.CharacterDisconnectLogic();
			
			char.remove();
			
			//if ( !sdWorld.server_config.ResetScoreOnDeath || sdWorld.server_config.ResetScoreOnDeath() )
			//socket.score = 0;
		}
		
		/*
		if ( socket.character ) 
		if ( !socket.character._is_being_removed ) 
		{
			//socket.character._old_score = socket.score;
			
			if ( socket.character.hea > 0 )
			{
				socket.character.remove();
				socket.character._socket = null;
				socket.character = null;
			}
			
			socket.character = null;
			
			if ( !sdWorld.server_config.ResetScoreOnDeath || sdWorld.server_config.ResetScoreOnDeath() )
			socket.score = 0;
		}*/
	});
	
	socket.on('CC_SET_SPAWN', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		let net_id = arr[ 0 ];
		
		if ( typeof net_id === 'number' )
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			if ( net_id === -1 )
			{
				if ( socket.command_centre )
				{
					socket.command_centre = null;
					socket.SDServiceMessage( 'Respawn point unset' );
				}
				else
				socket.SDServiceMessage( 'Respawn point was\'t set yet (can be set at any nearby Command Centre)' );
			}
			else
			{
				let ent = sdEntity.GetObjectByClassAndNetId( 'sdCommandCentre', net_id );
				if ( ent !== null )
				{
					if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdCom.action_range_command_centre ) >= 0 )
					{
						socket.command_centre = ent;
						socket.SDServiceMessage( 'Respawn point set' );
					}
					else
					socket.SDServiceMessage( 'Command Centre is too far' );
				}
				else
				{
					socket.SDServiceMessage( 'Command Centre no longer exists' );
				}
			}
		}
	});
	
	socket.on('COM_SUB', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		let net_id = arr[ 0 ];
		let new_sub = arr[ 1 ];
		
		if ( typeof new_sub === 'number' || typeof new_sub === 'string' )
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdCom', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdCom.action_range ) >= 0 )
				ent.NotifyAboutNewSubscribers( 1, [ new_sub ] );
				else
				socket.SDServiceMessage( 'Communication node is too far' );
			}
			else
			socket.SDServiceMessage( 'Communication node no longer exists' );
		}
	});
	socket.on('ENTITY_CONTEXT_ACTION', ( params )=>
	{
		if ( typeof params !== 'object' )
		return;
	
		if ( typeof params[ 0 ] !== 'string' )
		return;
	
		if ( typeof params[ 1 ] !== 'number' )
		return;
	
		if ( typeof params[ 2 ] !== 'string' )
		return;
	
		let _class = params[ 0 ];
		let net_id = params[ 1 ];
		
		if ( net_id !== undefined )
		{
			let ent = sdEntity.GetObjectByClassAndNetId( _class, net_id );
			if ( ent !== null )
			{
				ent.ExecuteContextCommand( params[ 2 ], params[ 3 ], socket.character, socket );
			}
			else
			{
				socket.SDServiceMessage( 'Entity no longer exists' );
			}
		}
	});
	socket.on('COM_UNSUB', ( net_id ) => { 
		
		if ( typeof net_id !== 'number' )
		return;
		
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdCom', net_id );
			if ( ent !== null )
			ent.NotifyAboutNewSubscribers( 0, [ socket.character._net_id ] );
			else
			socket.SDServiceMessage( 'Communication node no longer exists' );
		}
	});
	socket.on('COM_KICK', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let net_id_to_kick = arr[ 1 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdCom', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdCom.action_range ) >= 0 )
				ent.NotifyAboutNewSubscribers( 0, [ net_id_to_kick ] );
				else
				socket.SDServiceMessage( 'Communication node is too far' );
			}
			else
			socket.SDServiceMessage( 'Communication node no longer exists' );
		}
	});
	socket.on('STORAGE_GET', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let net_id_to_get = arr[ 1 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdStorage', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdStorage.access_range ) >= 0 )
				{
					ent.ExtractItem( net_id_to_get, socket.character );
				}
				else
				socket.SDServiceMessage( 'Storage is too far' );
			}
			else
			socket.SDServiceMessage( 'Storage no longer exists' );
		}
	});
	socket.on('UPGRADE_GET_EQUIP', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdUpgradeStation', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdStorage.access_range ) >= 0 )
				{
					if ( ent._cooldown <= 0 )
					{
						if ( ent.matter >= 500 )
						ent.DropBasicEquipment( socket.character );
						else
						socket.SDServiceMessage( 'Upgrade station needs at least 500 matter!' );
					}
					else
					socket.SDServiceMessage( 'Upgrade station is generating new weapons, please wait ' + ent._cooldown / 30 + ' seconds.' ); // seems like GSPEED creates an error so this replacement should be semi-accurate
				}
				else
				socket.SDServiceMessage( 'Upgrade station is too far' );
			}
			else
			socket.SDServiceMessage( 'Upgrade station no longer exists' );
		}
	});
	socket.on('UPGRADE_CHAR', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdUpgradeStation', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdStorage.access_range ) >= 0 )
				{
					if ( ent.matter >= 5000 )
					ent.UpgradeCharacter( socket.character );
					else
					socket.SDServiceMessage( 'Upgrade station needs at least 5000 matter!' );
				}
				else
				socket.SDServiceMessage( 'Upgrade station is too far' );
			}
			else
			socket.SDServiceMessage( 'Upgrade station no longer exists' );
		}
	});
	socket.on('CRYSTAL_COMBINE', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdCrystalCombiner', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdStorage.access_range ) >= 0 )
				{
					if ( ent.crystals === 2 )
					ent.CombineCrystals();
					else
					socket.SDServiceMessage( 'Crystal combiner needs 2 crystals to combine them' );
				}
				else
				socket.SDServiceMessage( 'Crystal combiner is too far' );
			}
			else
			socket.SDServiceMessage( 'Crystal combiner no longer exists' );
		}
	});
	socket.on('AMPLIFIER_SHIELD_TOGGLE', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdMatterAmplifier', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdStorage.access_range ) >= 0 )
				{
					ent.ToggleShields();
				}
				else
				socket.SDServiceMessage( 'Matter amplifier is too far' );
			}
			else
			socket.SDServiceMessage( 'Matter amplifier no longer exists' );
		}
	});
	
	socket.CharacterDisconnectLogic = ()=>
	{
		if ( socket.character )
		{
			if ( sdWorld.server_config.onDisconnect )
			sdWorld.server_config.onDisconnect( socket.character, 'disconnected' );
			
			if ( socket.character.title.indexOf( 'Disconnected ' ) !== 0 )
			socket.character.title = 'Disconnected ' + socket.character.title;

			//socket.character._old_score = socket.score;

			socket.character._socket = null;

			socket.character = null;

			//if ( !sdWorld.server_config.ResetScoreOnDeath || sdWorld.server_config.ResetScoreOnDeath() )
			//socket.score = 0;
		}
	};
	
	socket.on('disconnect', () => 
	{
		setTimeout( ()=> // Or else sockets array may be modified mid-loop when random .emit is called
		{
			/*if ( sockets_array_locked )
			{
				debugger;
			}*/
			
			if ( DEBUG_CONNECTIONS )
			console.log('user disconnected');

			socket.CharacterDisconnectLogic();

			sockets.splice( sockets.indexOf( socket ), 1 );
			
			sockets_by_ip[ ip ].splice( sockets_by_ip[ ip ].indexOf( socket ), 1 );
			if ( sockets_by_ip[ ip ].length === 0 )
			delete sockets_by_ip[ ip ];
			
		},0);
	});
	//socket.emit( 'hi' );
});

io.on("reconnect", (socket) => {
  // ...
  debugger;
});

//http.listen(3000 + world_slot, () =>
( httpsServer ? httpsServer : httpServer ).listen( 3000 + world_slot, () =>
{
	console.log('listening on *:' + ( 3000 + world_slot ) );
});

let only_do_nth_connection_per_frame = 1;
let nth_connection_shift = 0;

setInterval( ()=>
{
	//console.log( 'game_ttl', game_ttl );
	
	if ( IsGameActive() )
	{
		game_ttl--;
		
		sdWorld.HandleWorldLogic();
		
		let unwritable = 0;
		for ( var i = 0; i < sockets.length; i++ )
		{
			var socket = sockets[ i ];
			
			if ( !socket.client.conn.transport.writable )
			unwritable++;
		
			//sdWorld.max_update_rate;
		}
		
		if ( unwritable === sockets.length )
		{
			//if ( only_do_nth_connection_per_frame < sockets.length )
			//console.log( sdWorld.time + ': only_do_nth_connection_per_frame increases to ' + (only_do_nth_connection_per_frame + 1) + ' (all sockets are non-writable)' );
		
			only_do_nth_connection_per_frame = Math.min( Math.max( 1, sockets.length ), only_do_nth_connection_per_frame + 1 );
		}
		else
		{
			//if ( only_do_nth_connection_per_frame > 1 )
			//console.log( sdWorld.time + ': only_do_nth_connection_per_frame decreases to ' + (only_do_nth_connection_per_frame - 1) + ' (all sockets are writable)' );
		
			only_do_nth_connection_per_frame = Math.max( 1, only_do_nth_connection_per_frame - 1 );
		}
		
		nth_connection_shift = ( nth_connection_shift + 1 ) % only_do_nth_connection_per_frame;

		//sockets_array_locked = true;
		for ( var i = 0; i < sockets.length; i++ )
		{
			var socket = sockets[ i ]; // can disappear from array in the middle of loop

			if ( !SOCKET_IO_MODE )
			{
				
				if ( socket.sent_result_ok > 10 )
				{
					//let prev = socket.max_update_rate;
					
					if ( socket.sent_result_dropped / socket.sent_result_ok > 0.2 )
					{
						socket.max_update_rate = Math.min( 200, socket.max_update_rate + 16 );
						
						//if ( prev < 200 )
						//socket.SDServiceMessage( 'Server: Server sends updates to you each ' + socket.max_update_rate + 'ms ('+ (~~socket.sent_result_dropped)+' dropped out of '+(~~socket.sent_result_ok)+')' );
					}
				
					if ( socket.sent_result_dropped / socket.sent_result_ok <= 0.01 )
					{
						socket.max_update_rate = Math.max( 16, socket.max_update_rate - 1 );
						
						//if ( prev > 16 )
						//socket.SDServiceMessage( 'Server: Server sends updates to you each ' + socket.max_update_rate + 'ms ('+ (~~socket.sent_result_dropped)+' dropped out of '+(~~socket.sent_result_ok)+')' );
					
					}
					
					socket.SDServiceMessage( 'Server: Server sends updates to you each ' + socket.max_update_rate + 'ms ('+ (~~socket.sent_result_dropped)+' dropped out of '+(~~socket.sent_result_ok)+')' );
						
					//socket.max_update_rate = socket.max_update_rate * 0.9 + 0.1 * Math.min( 200, Math.max( 16, sdWorld.max_update_rate / ( socket.sent_result_ok ) * ( socket.sent_result_dropped ) ) );
				}
				if ( socket.sent_result_ok > 20 )
				{
					socket.sent_result_ok *= 0.8;
					socket.sent_result_dropped *= 0.8;
				}
			}
			//else
			//socket.max_update_rate = sdWorld.max_update_rate;

			if ( !socket.character || socket.character._is_being_removed )
			{
				if ( socket.post_death_spectate_ttl > 0 )
				socket.post_death_spectate_ttl--;
			}
			else
			socket.post_death_spectate_ttl = 30;
		
			//console.log( 'socket.post_death_spectate_ttl', socket.post_death_spectate_ttl );
					
			if ( socket.character && ( !socket.character._is_being_removed || socket.post_death_spectate_ttl > 0 ) )
			{
				if ( sdWorld.time > socket.last_sync + socket.max_update_rate )
				{
					socket.character.lag = !socket.client.conn.transport.writable;
				}
				
				if ( i % only_do_nth_connection_per_frame === nth_connection_shift )
				if ( sdWorld.time > socket.last_sync + socket.max_update_rate && socket.client.conn.transport.writable && sdWorld.time > socket.waiting_on_M_event_until ) // Buffering prevention?
				{
					let previous_sync_time = socket.last_sync;
					
					socket.last_sync = sdWorld.time;
					socket.waiting_on_M_event_until = sdWorld.time + 1000;

					var snapshot = [];
					var snapshot_only_statics = [];

					var observed_entities = [];
					//var observed_statics = [];
					
					var observed_statics_map = new WeakSet();
					
					/*for ( var i2 = 0; i2 < sdEntity.entities.length; i2++ )
					{
						if ( sdEntity.entities[ i2 ].x > socket.character.x - 800 )
						if ( sdEntity.entities[ i2 ].x < socket.character.x + 800 )
						if ( sdEntity.entities[ i2 ].y > socket.character.y - 400 )
						if ( sdEntity.entities[ i2 ].y < socket.character.y + 400 )
						if ( sdEntity.entities[ i2 ].IsVisible() )
						{
							observed_entities.push( sdEntity.entities[ i2 ] );
						}
					}*/


					socket.camera.scale = 2;

					let min_x = socket.camera.x - 800/2 / socket.camera.scale;
					let max_x = socket.camera.x + 800/2 / socket.camera.scale;

					let min_y = socket.camera.y - 400/2 / socket.camera.scale;
					let max_y = socket.camera.y + 400/2 / socket.camera.scale;

					/*
					if ( min_x < socket.character.x - 800/2 )
					min_x = socket.character.x - 800/2;
					if ( max_x > socket.character.x + 800/2 )
					max_x = socket.character.x + 800/2;

					if ( min_y < socket.character.y - 400/2 )
					min_y = socket.character.y - 400/2;
					if ( max_y > socket.character.y + 400/2 )
					max_y = socket.character.y + 400/2;
					*/
					min_x -= 32 * 3;
					min_y -= 32 * 3;
					max_x += 32 * 3;
					max_y += 32 * 3;
					
					const MaxCompleteEntitiesCount = 40; // 50 sort of fine for PC, but now for mobile
					
					//let random_upgrade_for = [];
					
					let meet_once = new WeakSet();

					for ( var x = min_x; x < max_x; x += 32 )
					for ( var y = min_y; y < max_y; y += 32 )
					{
						var arr = sdWorld.RequireHashPosition( x, y );
						for ( var i2 = 0; i2 < arr.length; i2++ )
						if ( !meet_once.has( arr[ i2 ] ) )
						{
							meet_once.add( arr[ i2 ] );
							
							if ( arr[ i2 ].IsVisible( socket.character ) )
							{
								if ( arr[ i2 ].is_static )
								{
									//observed_statics.push( arr[ i2 ] );
									observed_statics_map.add( arr[ i2 ] );

									if ( socket.known_statics_versions_map.has( arr[ i2 ] ) )
									{
										if ( socket.known_statics_versions_map.get( arr[ i2 ] ) !== arr[ i2 ]._update_version && snapshot.length < MaxCompleteEntitiesCount )
										{
											socket.known_statics_versions_map.set( arr[ i2 ], arr[ i2 ]._update_version ); // Why it was missing?

											var snap = arr[ i2 ].GetSnapshot( frame, false, socket.character );
											snapshot.push( snap ); // Update actually needed
											snapshot_only_statics.push( snap );
										}
										//else
										//random_upgrade_for.push( arr[ i2 ] );
									}
									else
									if ( snapshot.length < MaxCompleteEntitiesCount )
									{
										//socket.known_statics_map.set( arr[ i2 ], arr[ i2 ] );
										socket.known_statics_versions_map.set( arr[ i2 ], arr[ i2 ]._update_version );

										var snap = arr[ i2 ].GetSnapshot( frame, false, socket.character );
										snapshot.push( snap );
										snapshot_only_statics.push( snap );
									}
									//else
									//random_upgrade_for.push( arr[ i2 ] );
								}
								else
								observed_entities.push( arr[ i2 ] );

								arr[ i2 ].SyncedToPlayer( socket.character );
							}
						}
					}

					// Forget offscreen statics (and removed ones)
					/*for ( var i2 = 0; i2 < socket.known_statics.length; i2++ )
					{
						if ( observed_statics.indexOf( socket.known_statics[ i2 ] ) === -1 )
						{
							let snapshot_of_deletion = { 
								_class: socket.known_statics[ i2 ].GetClass(), 
								_net_id: socket.known_statics[ i2 ]._net_id,
								_is_being_removed: true,
								_broken: socket.known_statics[ i2 ]._is_being_removed
							};
							snapshot.push( snapshot_of_deletion );

							socket.known_statics.splice( i2, 1 );
							socket.known_statics_versions.splice( i2, 1 );
							i2--;
							continue;
						}
					}*/
					socket.known_statics_versions_map.forEach( ( value, key, map )=>
					{
						//if ( observed_statics.indexOf( key ) === -1 )
						if ( !observed_statics_map.has( key ) )
						{
							let snapshot_of_deletion = { 
								_class: key.GetClass(), 
								_net_id: key._net_id,
								_is_being_removed: true,
								_broken: key._is_being_removed
							};
							snapshot.push( snapshot_of_deletion );
							snapshot_only_statics.push( snapshot_of_deletion );

							socket.known_statics_versions_map.delete( key );
						}
					} );

					if ( !socket.character._is_being_removed )
					if ( observed_entities.indexOf( socket.character ) === -1 )
					{
						observed_entities.push( socket.character );
						
						if ( socket.character.driver_of )
						if ( observed_entities.indexOf( socket.character.driver_of ) === -1 )
						observed_entities.push( socket.character.driver_of );
					}

					for ( var i2 = 0; i2 < sdEntity.global_entities.length; i2++ ) // So it is drawn on back
					snapshot.push( sdEntity.global_entities[ i2 ].GetSnapshot( frame, false, socket.character ) );

					for ( var i2 = 0; i2 < observed_entities.length; i2++ )
					if ( !observed_entities[ i2 ].IsGlobalEntity() ) // Global entities are already sent few lines above
					snapshot.push( observed_entities[ i2 ].GetSnapshot( frame, false, socket.character ) );
				
					//var isTransportWritable = socket.io.engine && socket.io.engine.transport && socket.io.engine.transport.writable;
					//console.log( isTransportWritable );
					
					//socket.broadcast.emit( snapshot );
					
					//socket.emit('RES', snapshot );

					//socket.emit('SCORE', socket.score );
					
					let leaders = null;
					
					if ( sdWorld.time > socket.last_sync_score + 1000 )
					{
						socket.last_sync_score = sdWorld.time;

						//socket.emit('LEADERS', [ sdWorld.leaders, GetPlayingPlayersCount() ] );
						leaders = [ sdWorld.leaders, GetPlayingPlayersCount() ];
					}
					
					let sd_events = [];
					
					if ( socket.sd_events.length > 100 )
					{
						//console.log('socket.sd_events overflow (last sync was ' + ( sdWorld.time - previous_sync_time ) + 'ms ago): ', socket.sd_events );
						
						sockets[ i ].SDServiceMessage( 'Server: .sd_events overflow (' + socket.sd_events.length + ' events were skipped). Some sounds and effects might not spawn as result of that.' );
						
						socket.sd_events.length = 0;
					}
					
					while ( sd_events.length < 10 && socket.sd_events.length > 0 )
					sd_events.push( socket.sd_events.shift() );
				
					let leftovers_tot = Object.keys( socket.left_overs ).length;
					if ( leftovers_tot > 5000 )
					{
						console.log('socket.left_overs.length = ' + leftovers_tot + '... giving up with resends' );
						socket.left_overs = {};
					}
				
					let v = 0;
					for ( let prop in socket.left_overs )
					{
						//Not needed too?
						/*let possibly_ent = sdEntity.entities_by_net_id_cache[ socket.left_overs[ prop ]._net_id ];
						
						if ( possibly_ent && !possibly_ent.is_static )
						{
							debugger // Should not happen because these are removed later? Or they are not due to last snapshot inserted into sent ones without clearing these?
							
							//console.log('Dropped packet entity is not static, skip: ' + possibly_ent.GetClass() + '['+possibly_ent._net_id+']' );
							delete socket.left_overs[ prop ];
							continue;
						}*/
					
						let found = false;
					
						// Not needed anymore due to it being done later near AAA
						
						for ( let s = 0; s < snapshot_only_statics.length; s++ )
						if ( snapshot_only_statics[ s ]._net_id === socket.left_overs[ prop ]._net_id )
						{
							//debugger; // Does this even happen? Should not but what if it helps catching some bug. And we do not want to send 2 states of same object
							
							// It still does happen... Which is maybe fine.
							
							delete socket.left_overs[ prop ];
							
							//console.log('Dropped packet entity was already in snapshot: ' + snapshot[ s ]._class + '['+snapshot[ s ]._net_id+']' );
							found = true;
							break;
						}
						

						if ( !found )
						{
							if ( v <= leftovers_tot * 0.05 || v <= 10 )
							{
								// Serious bug here: It resends outdated states AND one of these states might tell client that entity is being removed (for example due to looking away from it) BUT this info might arrive after entity already reappeared
								
								//console.log('Dropped packet entity was readded: ' + socket.left_overs[ prop ]._class + '['+socket.left_overs[ prop ]._net_id+']' );
								snapshot.push( socket.left_overs[ prop ] );
								snapshot_only_statics.push( socket.left_overs[ prop ] );
								delete socket.left_overs[ prop ];

								v++;
							}
							else
							break
							//if ( v > leftovers_tot * 0.05 )
							//break;
						}
						
						//delete socket.left_overs[ prop ];
					}
					
					// Walk through socket.sent_messages and get rid of mentions of current snapshot's static entities (because we are about to send fresher versions of their state or even deletion)
					for ( let m = socket.sent_messages_first; m < socket.sent_messages_last; m++ )
					{
						let msg = socket.sent_messages.get( m );
						if ( !msg.arrived )
						{
							for ( let d = 0; d < msg.data[ 0 ].length; d++ )
							{
								let del = false;
								
								/*let possibly_ent = sdEntity.entities_by_net_id_cache[ msg.data[ 0 ][ d ]._net_id ];
						
								if ( possibly_ent && !possibly_ent.is_static )
								{
									del = true;
									//delete msg.data[ 0 ][ d ];
									//continue;
								}
								*/

								// AAA
								if ( !del )
								for ( let s = 0; s < snapshot_only_statics.length; s++ )
								if ( msg.data[ 0 ][ d ]._net_id === snapshot_only_statics[ s ]._net_id )
								{
									//console.log('Preventing outdated state resend for ' + snapshot_only_statics[ s ]._class );
									del = true;
									//delete msg.data[ 0 ][ d ];
									break;
								}
								
								if ( del )
								{
									msg.data[ 0 ].splice( d, 1 );
									d--;
									continue;
								}
							}
						}
					}
					
					const resend_in = 1000;
					const old_shapshots_expire_in_in = 3000; // 3000 kind of fine, but holes still might happen in stress-cases of spark firing at ground, but that is probably unrelated
					
					if ( resend_in >= old_shapshots_expire_in_in )
					throw new Error('Keep resend_in value less than old_shapshots_expire_in_in');
				
					for ( let m = socket.sent_messages_first; m < socket.sent_messages_last; m++ )
					{
						let msg = socket.sent_messages.get( m );
						if ( !msg.arrived )
						//if ( msg.time < sdWorld.time - 350 )
						if ( msg.time < sdWorld.time - resend_in )
						{
							socket.myDrop({ event:'RESv2', data:msg.data }); // { event, data }
							
							msg.arrived = true; // Prevent resend
						}
					}
					
					
					if ( socket.lost_messages.length > 5000 )
					{
						
						console.log('socket.lost_messages.length = ' + socket.lost_messages.length + '... giving up with resends' );
						socket.lost_messages = [];
					}
					
					for ( let s = 0; s < Math.min( 3, socket.lost_messages.length ); s++ )
					{
						sd_events.push( socket.lost_messages.shift() );
					}
					
					let full_msg = [ 
						sdSnapPack.Compress( snapshot ), // 0
						socket.GetScore(), // 1
						LZW.lzw_encode( JSON.stringify( leaders ) ), // 2
						LZW.lzw_encode( JSON.stringify( sd_events ) ), // 3
						//leaders, // 2
						//sd_events, // 3
						Math.round( socket.character._force_add_sx * 1000 ) / 1000, // 4
						Math.round( socket.character._force_add_sy * 1000 ) / 1000, // 5
						Math.max( -1, socket.character._position_velocity_forced_until - sdWorld.time ), // 6
						sdWorld.last_frame_time, // 7
						sdWorld.last_slowest_class, // 8
						socket.sent_messages_last // 9
					];
					
					let full_msg_story = [ 
						snapshot_only_statics, // 0
						null, // 1
						null, // 2
						sd_events, // 3
						null, // 4
						null, // 5
						null, // 6
						null, // 7
						null, // 8
						socket.sent_messages_last // 8
					];
					
					
					//socket.sent_messages = new Map();
					//socket.sent_messages_first = 0;
					//socket.sent_messages_last = 0;
					
					socket.sent_messages.set( socket.sent_messages_last++, { data: full_msg_story, time: sdWorld.time, arrived: false } );
					
					// Forget too old messages
					while ( socket.sent_messages.get( socket.sent_messages_first ).time < sdWorld.time - old_shapshots_expire_in_in ) // Used to be 10000 but lower value is better because static entities will be removed in each sync from all these snapshots
					socket.sent_messages.delete( socket.sent_messages_first++ );
					
					//for ( let g = 0; g < 25; g++ )
					//if ( Math.random() < 0.2 )
					{
						if ( !SOCKET_IO_MODE )
						socket.compress( true ).emit('RESv2', LZW.lzw_encode( JSON.stringify( full_msg ) ) );
						else
						socket.compress( true ).emit('RESv2', full_msg );
					}
				
					socket.sent_result_ok++;
					
					socket.character._force_add_sx = 0;
					socket.character._force_add_sy = 0;

					socket.observed_entities = observed_entities;
				}

				if ( sdWorld.time > socket.last_ping + 60000 )
				//if ( sdWorld.time > socket.last_ping + 3000 ) // Hack
				{
					socket.disconnect();
				}
			}
		}
		//sockets_array_locked = false;
	}
	else
	{
		sdWorld.HandleWorldLogicNoPlayers();
	}
	
	frame++;
	
}, sdWorld.logic_rate );

/*
process.on('exit', (code) => {
	
	console.log(`About to exit with code: ${code}`);
	heapdump.writeSnapshot( 'crashed.heapsnapshot' );
  
});*/