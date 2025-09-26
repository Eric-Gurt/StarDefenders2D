
/* global globalThis, process, fs, mime, sdWorld, sdEntity, sdModeration, sdShop, sdSnapPack, sdPathFinding, sdDatabase, Buffer, Infinity, sdServerConfigFull, sdInterface, sdLongRangeTeleport, sdServerToServerProtocol, sdCharacter, sdDeepSleep, sdPlayerSpectator, sdStorage, os, sdGun, sdMemoryLeakSeeker, zlib, Promise, sdDictionaryWords, sdSound, LZW, sdEffect, sdTask, WorkerServiceLogic, await, imported, FakeCanvasContext, Server, geckos, https, spawn, http */

let port0 = 3000;
let CloudFlareSupport = false;
let path_for_online_count_save = null;

/*

	Memory usage tracking:
	globalThis.inter = setInterval( ()=>{ trace( 'heapTotal: ' + process.memoryUsage().heapTotal ); }, 1000 * 60 );

*/

globalThis.CATCH_HUGE_ARRAYS = false; // Can worsen performance by 2-5%

// http://localhost:3000 + world_slot

// CentOS crontab can be here: /etc/crontab

/*

	TODO:

	- This could help for high latency cases: https://github.com/geckosio/geckos.io // Actually not that much, main server's low bandwidth is low bandwidth


 
*/
/*

	What to do:

	Give progression + purpose to the game
	- Vehicles for deeper digging, make shovels less efficient
	- Crates? Presets with rare items and entities?
	

*/
// Early error catching
//console.log('Early error catching enabled, waiting 10 seconds before doing anything...');
//await new Promise(resolve => setTimeout(resolve, 10000)); // Unexpected reserved word


//import heapdump from 'heapdump';
//import ofe from 'ofe';

import zlib from 'zlib';

import _app from 'express';
const app = _app();

import path from 'path';
import fs from 'fs';

globalThis.fs = fs;

import { spawn } from 'child_process';
globalThis.child_process_spawn = spawn;

//import { createServer } from "http";
import http from "http";
import https from "https";

import mime from "mime";

//import pkg from '@geckos.io/server'; // 
//const geckos = pkg.default;
import { Server } from "socket.io";

import { Worker } from "worker_threads";
import WorkerServiceLogic from './game/server/worker_service_logic.js';
globalThis.WorkerServiceLogic = WorkerServiceLogic;

const SOCKET_IO_MODE = ( typeof Server !== 'undefined' ); // In else case geckos.io
globalThis.SOCKET_IO_MODE = SOCKET_IO_MODE;


const httpServer = http.createServer( app );
let   httpsServer = null;

var isWin = process.platform === "win32";
globalThis.isWin = isWin;

globalThis.trace = console.log;
{
	let spoken = new Set();
	globalThis.traceOnce = ( ...args )=>
	{
		let str = args.join(' ');
		if ( !spoken.has( str ) )
		{
			spoken.add( str );
			trace( ...args );
		}
	};
}
globalThis.T = ( s )=>s; // Server won't translate anything

if ( !isWin )
{
	let ssl_key_path;
	let ssl_cert_path;
	
	let ssl = true;
	
	if ( fs.existsSync( 'sslconfig.json' ) ) 
	{
    	try 
		{
        	const data = fs.readFileSync( './sslconfig.json', 'utf8' );
    
        	// parse JSON string to JSON object
        	const sslconfig = JSON.parse( data );
        	ssl_cert_path = sslconfig.certpath;
        	ssl_key_path = sslconfig.keypath;
			path_for_online_count_save = sslconfig.onlinepath || null;
			CloudFlareSupport = !!sslconfig.cloudflare;
	    }
		catch (err)
		{
	        console.log(`Error reading file from disk: ${ err }`);
	    } 
	} 
	else 
	{ 
		if ( fs.existsSync('/var/') &&
	         fs.existsSync('/var/cpanel/') &&
	         fs.existsSync('/var/cpanel/ssl/') &&
	         fs.existsSync('/var/cpanel/ssl/apache_tls/') &&
	         fs.existsSync('/var/cpanel/ssl/apache_tls/plazmaburst2.com/') ) 
	    {
	        ssl_key_path = '/var/cpanel/ssl/apache_tls/plazmaburst2.com/combined';
	        ssl_cert_path = '/var/cpanel/ssl/apache_tls/plazmaburst2.com/combined'; // '/var/cpanel/ssl/apache_tls/plazmaburst2.com/certificates';
	        
	        port0 = 8443;
	        CloudFlareSupport = true;
        	
        	path_for_online_count_save = '/home/plazmaburst2/public_html/pb2/sd2d_online.v';
    	}
		else
		{
			// For replit.com-like hosts, they apparently handle all that by themselves
			ssl = false;
		}
	}
	
	if ( ssl )
	{
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

globalThis.sdServerToServerProtocol = sdServerToServerProtocol;

let io;

if ( SOCKET_IO_MODE ) // Socket.io
{
	io = new Server( httpsServer ? httpsServer : httpServer, {
	  // ...
	  pingInterval: 30000,
	  pingTimeout: 15000,
	  maxHttpBufferSize: 1024 * 1024, // 2048 was good for player-to-server connections but not for server-to-server protocol // 1024 // 512 is minimum that works (but lacks long-name support on join)
	  perMessageDeflate: {
		threshold: 1024
	  }, // Promised to be laggy but with traffic bottlenecking it might be the only way (and nature of barely optimized network snapshots)
	  httpCompression: {
		threshold: 1024
	  }
	  //transports: [ 'websocket' ] // Trying to disable polling one, maybe this will work better?
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
import THREE from "./game/libs/three-for-server.js";
	
// let that = this; setTimeout( ()=>{ sdWorld.entity_classes[ that.name ] = that; }, 1 ); // Old register for object spawn code
import sdWorld from './game/sdWorld.js';

import FakeCanvasContext from './game/libs/FakeCanvasContext.js'; // consts
globalThis.FakeCanvasContext = FakeCanvasContext;


import sdRenderer from './game/client/sdRenderer.js';
//globalThis.sdRenderer = { visual_settings: 4 }; // Fake object. Bad, because sdBlock-s will see a real module, and won't know about this altering whenever mimic logic is applied
sdRenderer.visual_settings = 4;
globalThis.sdRenderer = sdRenderer;


import sdEntity from './game/entities/sdEntity.js';
import sdInterface from './game/interfaces/sdInterface.js';


import sdDeepSleep from './game/entities/sdDeepSleep.js';
import sdCharacter from './game/entities/sdCharacter.js';
import sdPlayerDrone from './game/entities/sdPlayerDrone.js';
import sdGun from './game/entities/sdGun.js';
import sdBlock from './game/entities/sdBlock.js';
import sdEffect from './game/entities/sdEffect.js';
import sdCrystal from './game/entities/sdCrystal.js';
import sdBullet from './game/entities/sdBullet.js';
import sdCom from './game/entities/sdCom.js';
import sdAsteroid from './game/entities/sdAsteroid.js';
import sdVirus from './game/entities/sdVirus.js';
import sdAmphid from './game/entities/sdAmphid.js';
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
import sdBeacon from './game/entities/sdBeacon.js';
import sdHover from './game/entities/sdHover.js';
import sdStorage from './game/entities/sdStorage.js';
import sdAsp from './game/entities/sdAsp.js';
import sdModeration from './game/server/sdModeration.js';
import sdDictionaryWords from './game/server/sdDictionaryWords.js';
import sdDatabase from './game/server/sdDatabase.js';
import sdMemoryLeakSeeker from './game/server/sdMemoryLeakSeeker.js';
import sdByteShifter from './game/server/sdByteShifter.js';
import { sdServerConfigShort, sdServerConfigFull } from './game/server/sdServerConfig.js';

globalThis.sdByteShifter = sdByteShifter;

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
import sdWorkbench from './game/entities/sdWorkbench.js';
import sdRescueTeleport from './game/entities/sdRescueTeleport.js';
import sdRift from './game/entities/sdRift.js';
import sdDrone from './game/entities/sdDrone.js';
import sdLifeBox from './game/entities/sdLifeBox.js';
import sdLost from './game/entities/sdLost.js';
import sdCable from './game/entities/sdCable.js';
import sdCharacterRagdoll from './game/entities/sdCharacterRagdoll.js';
import sdNode from './game/entities/sdNode.js';
import sdSpider from './game/entities/sdSpider.js';
import sdBall from './game/entities/sdBall.js';
import sdTheatre from './game/entities/sdTheatre.js';
import sdCaption from './game/entities/sdCaption.js';
import sdBaseShieldingUnit from './game/entities/sdBaseShieldingUnit.js';
import sdConveyor from './game/entities/sdConveyor.js';
import sdBeamProjector from './game/entities/sdBeamProjector.js';
import sdQuadro from './game/entities/sdQuadro.js';
import sdObelisk from './game/entities/sdObelisk.js';
import sdSunPanel from './game/entities/sdSunPanel.js';
import sdWeaponBench from './game/entities/sdWeaponBench.js';
import sdLongRangeTeleport from './game/entities/sdLongRangeTeleport.js';
import sdTask from './game/entities/sdTask.js';
import sdPortal from './game/entities/sdPortal.js';
import sdPlayerSpectator from './game/entities/sdPlayerSpectator.js';
import sdStatusEffect from './game/entities/sdStatusEffect.js';

import { createRequire } from 'module';
const require = createRequire( import.meta.url );
globalThis.acorn = require('./game/libs/acorn.cjs');

async function LoadScriptsFromFolder( path='game/entities/' )
{
	//let classes_directory_relative_for_clients = './entities/'; // Prefix for clients
	let classes_directory_relative_for_clients = path.split( 'game/' ).join( './' ); // Prefix for clients
	
	let classes_directory_physical = __dirname + path; // For scanning
	let classes_directory_relative = './' + path; // For importing

	let import_class_promises = [];
	let imported_classes = [];
	let class_names_set = new Set();//new Map();

	let entity_files = fs.readdirSync( classes_directory_physical );

	entity_files.forEach( ( file )=>
	{
		import_class_promises.push( ( async ()=>
		{ 
			// Better to import this one manually
			if ( file === 'sdEntity' || file === 'sdInterface' )
			return;

			//trace( 'Auto-import: ' + classes_directory_relative + file );

			let imported = await import( classes_directory_relative + file );

			imported_classes.push( imported.default );
			
			let name_for_client = classes_directory_relative_for_clients + imported.default.name;

			if ( class_names_set.has( name_for_client ) )
			throw new Error( 'Class "' + name_for_client + '" is imported twice from two different files:\n' + name_for_client + '\nand\n' + classes_directory_relative + file );

			//class_names_set.set( name_for_client, classes_directory_relative + file );
			class_names_set.add( name_for_client );

		})() );
	});

	if ( import_class_promises.length < 4 )
	console.warn( 'Too few classes ('+import_class_promises.length+') to load. Is folder being read properly?' );

	await Promise.all( import_class_promises );
	
	return { class_names_set, imported_classes };
}

let entity_info = await LoadScriptsFromFolder( 'game/entities/' );
let interface_info = await LoadScriptsFromFolder( 'game/interfaces/' );

let get_classes_page = Array.from( entity_info.class_names_set.keys() ).concat( Array.from( interface_info.class_names_set.keys() ) ).join(',');
let all_imported_classes = entity_info.imported_classes.concat( interface_info.imported_classes );
entity_info = null;



import sdServerToServerProtocol from './game/server/sdServerToServerProtocol.js';

import sdPathFinding from './game/ai/sdPathFinding.js';

import LZW from './game/server/LZW.js';
import LZUTF8 from './game/server/LZUTF8.js';
import sdSnapPack from './game/server/sdSnapPack.js';
import sdShop from './game/client/sdShop.js';
import sdSound from './game/sdSound.js';
import sdKeyStates from './game/sdKeyStates.js';


console.warn = console.trace; // Adding stack trace support for console.warn, which it doesn't have by default for some reason in Node.JS

let enf_once = true;

	globalThis.CATCH_ERRORS = true;
	globalThis.EnforceChangeLog = function EnforceChangeLog( mat, property_to_enforce, value_as_string=true, mode='warn' )
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
			enumerable: mat.propertyIsEnumerable( property_to_enforce ),
			get: function () { return mat[ enforced_prop ]; },
			set: function ( v ) { 

				if ( mat[ enforced_prop ] !== v )
				{
					if ( mode === 'abs>100' )
					{
						if ( Math.abs( mat[ enforced_prop ] - v ) > 100 )
						console.warn( 'Big .'+enforced_prop+' change (abs>100) from', mat[ enforced_prop ],' to ', v );
						
						if ( isNaN( v ) )
						{
							console.warn( 'NaN (',v,') assign attempt. Old value was ', mat[ enforced_prop ] );
							throw new Error('NaN ('+v+') assign attempt. Old value was ' + mat[ enforced_prop ] );
						}
					}
					else
					if ( mode === 'nan_catch' )
					{
						if ( isNaN( v ) || v === undefined )
						{
							console.warn( 'NaN or undefined (',v,') assign attempt. Old value was ', mat[ enforced_prop ] );
							throw new Error('NaN or undefined ('+v+') assign attempt. Old value was ' + mat[ enforced_prop ] );
						}
					}
					else
					{
						if ( v === undefined )
						{
							throw new Error('undef set');
						}

						if ( value_as_string )
						console.warn( mat.constructor.name,'.'+property_to_enforce+' = '+v );
						else
						console.warn( mat.constructor.name,'.'+property_to_enforce+' = ',v );

					}
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

sdWorld.init_class();
sdEntity.init_class();
sdInterface.init_class();

for ( let i = 0; i < all_imported_classes.length; i++ )
if ( all_imported_classes[ i ].init_class )
all_imported_classes[ i ].init_class();

sdEntity.AllEntityClassesLoadedAndInitiated();

sdServerToServerProtocol.init_class();

sdPathFinding.init_class();


LZW.init_class();
sdSound.init_class();
sdDictionaryWords.init_class();

globalThis.LZW = LZW;
globalThis.sdWorld = sdWorld;
globalThis.sdShop = sdShop;
globalThis.sdModeration = sdModeration;
globalThis.sdDictionaryWords = sdDictionaryWords;
globalThis.sdDatabase = sdDatabase;
globalThis.sdSnapPack = sdSnapPack;
globalThis.sdPathFinding = sdPathFinding;
globalThis.sdSound = sdSound;

sdWorld.FinalizeClasses();

let world_slot = 0; // Default slot adds no prefixes to file names

for ( let i = 0; i < process.argv.length; i++ )
{
	let parts = process.argv[ i ].split('=');
	
	if ( parts.length > 1 )
	{
		if ( parts[ 0 ] === 'world_slot' )
		world_slot = ~~( parts[ 1 ] );
		
		let v = parts.slice( 1 ).join('=');
		
		try
		{
			sdWorld.server_start_values[ parts[ 0 ] ] = JSON.parse( v );
		}
		catch( e )
		{
			sdWorld.server_start_values[ parts[ 0 ] ] = v;
		}
	}
}
console.log('world_slot = ' + world_slot + ' (defines server instance file prefixes, can be added to run command arguments in form of world_slot=1)' );
globalThis.world_slot = world_slot;

let frame = 0;

globalThis.GetFrame = ()=>{ return frame; }; // Call like this: GetFrame()

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



var sockets = [];
var sockets_by_ip = {}; // values are arrays (for easier user counting per ip)
//var sockets_array_locked = false;
sdWorld.sockets = sockets;




const chunks_folder = __dirname + '/chunks' + ( world_slot || '' );
globalThis.chunks_folder = chunks_folder;

const presets_folder = __dirname + '/presets';
globalThis.presets_folder = presets_folder;

if ( !fs.existsSync( globalThis.presets_folder ) )
{
	trace( 'Making directory: ' + globalThis.presets_folder );
	fs.mkdirSync( globalThis.presets_folder );
}




if ( globalThis.CATCH_HUGE_ARRAYS )
{
	const push0 = Array.prototype.push;
	
	const max_size = 200000; // Hopefully it is high enough for all kinds of proper worlds?
	
	const _Buffer = Buffer; // Store locally for least performance hit
	
	Array.prototype.next_panic_size = max_size;
	
	Array.prototype.push = function ( ...args )
	{
		if ( this.length + args.length > this.next_panic_size )
		{
			if ( args[ 0 ] instanceof _Buffer ) // Not an array of zlib buffers
			{
				this.next_panic_size = Infinity;
			}
			else
			{
				console.warn( 'Panic: Array at this callstack grows over the size of ' + this.next_panic_size + ' elements (it is best to look for first panic message). Size is becoming: ' + ( this.length + args.length ) + '; Next added element: ', args[ 0 ] );
				this.next_panic_size *= 2;
			}
		}
	
		push0.call( this, ...args );
	};
}

eval( 'sdWorld.server_config = ' + sdServerConfigFull.toString() ); // Execute while exposing same classes

sdWorld.UpdateFilePaths( __dirname, world_slot );

{
	let file_raw = '';
	if ( globalThis.file_exists( sdWorld.server_config_path_const ) )
	{
		file_raw = fs.readFileSync( sdWorld.server_config_path_const );
	}
	else
	{
		console.log('Unable to find file "'+sdWorld.server_config_path_const+'" - will create default one');
		
		file_raw = sdWorld.server_config.__proto__.toString();
		
		fs.writeFileSync( sdWorld.server_config_path_const, file_raw );
	}

	//eval( 'sdWorld.server_config = ' + file_raw );
	
	//trace( '( sdWorld.server_config.onBeforeSnapshotLoad ) === ', ( sdWorld.server_config.onBeforeSnapshotLoad.toString() ) )
	
	eval( `sdWorld.server_config_loaded = ${ file_raw.toString() };` );
	
	//eval( `sdWorld.server_config = Object.assign( sdWorld.server_config, ${ file_raw.toString() } );` );
	
	let keys = Object.getOwnPropertyNames( sdWorld.server_config_loaded );
	
	for ( let i = 0; i < keys.length; i++ )
	{
		let prop = keys[ i ];
		
		//trace( prop );
		
		if ( prop !== 'length' )
		if ( prop !== 'prototype' )
		if ( prop !== 'name' )
		sdWorld.server_config[ prop ] = sdWorld.server_config_loaded[ prop ];
	}
	
	//trace( '( sdWorld.server_config.onBeforeSnapshotLoad ) === ', ( sdWorld.server_config.onBeforeSnapshotLoad.toString() ) )
}

sdShop.init_class(); // requires plenty of classes due to consts usage

sdWorld.onAfterConfigLoad();

//globalThis.use_parallel_saving = true;

//let snapshot_path = __dirname + '/star_defenders_snapshot.v';
sdWorld.server_config.InstallBackupAndServerShutdownLogic();


if ( sdWorld.server_config.onBeforeSnapshotLoad )
sdWorld.server_config.onBeforeSnapshotLoad();

sdWorld.server_config.InitialSnapshotLoadAttempt();



if ( sdEntity.global_entities.length === 0 )
{
	console.log( 'Recreating sdWeather' );
	//sdEntity.global_entities.push( new sdWeather({}) );
	sdEntity.entities.push( new sdWeather({}) );
}

if ( sdWorld.server_config.onAfterSnapshotLoad )
sdWorld.server_config.onAfterSnapshotLoad();

sdDeepSleep.init();










let file_cache = null;

// Moderators can call it
globalThis.UpdateFileCache = ()=>
{
	file_cache = new Map();

	const ReadRecursively = ( path )=>
	{
		fs.readdirSync( path ).forEach( ( file )=> 
		{
			let stat = fs.lstatSync( path + file );

			if ( stat.isDirectory() )
			{
				ReadRecursively( path + file + '/' );
			}
			else
			{
				let url = ( path + file ).split( __dirname + '/' ).join( '' );
				
				let data = fs.readFileSync( path + file );
				
				file_cache.set( url, {
					data: data,
					type: mime.lookup( path + file ),
					length: data.length
				} );
			}
		});
	};

	ReadRecursively( __dirname + '/game/' );
};
globalThis.DisableFileCache = ()=>
{
	file_cache = null;
};

if ( sdWorld.server_config.store_game_files_in_ram )
globalThis.UpdateFileCache();

// Slower but less file stacking that could slow down the game
let get_busy = false;
let busy_tot = 0;
{
	let cb = ( req, res, repeated=false )=>
	{
		const fullPath = req.url;
		
		if ( fullPath.indexOf( '..' ) !== -1 ) // Doesn't happen really
		return;
		
		function Finalize()
		{
			get_busy = false;
		}

		if ( repeated !== true )
		busy_tot++;

		if ( get_busy )
		{

			setTimeout( ()=>{ cb( req, res, true ); }, 2 + Math.random() * 10 );
			return;
		}

		get_busy = true;
		busy_tot--;

		if ( busy_tot > 20 )
		console.log( 'Slowing down file download due to '+busy_tot+' files requested at the same time' );

		var path = __dirname + '/game' + fullPath;
		//var path = './game' + fullPath;


		if ( fullPath.substring( 0, '/sd_hook'.length ) === '/sd_hook' )
		{
			let request = fullPath.split( '?' )[ 1 ];
			let request_parts = request.split( '{' );

			let _net_id = parseInt( request_parts[ 0 ] );

			let response = null;

			let ent = sdEntity.entities_by_net_id_cache_map.get( _net_id );

			if ( ent !== undefined )
			if ( typeof ent.HandleHookReply !== 'undefined' )
			{
				let json_obj = null;
				try
				{
					json_obj = JSON.parse( '{' + decodeURI( request_parts.slice( 1 ).join( '{' ) ) ); // Won't accept non-JSON objects
				}
				catch ( e )
				{
					debugger;
				}

				if ( json_obj )
				response = ent.HandleHookReply( json_obj );
			}

			if ( !response )
			{
				response = { no_response: 1 };
			}

			res.send( JSON.stringify( response ) );
			Finalize();
			return;
		}
		else
		if ( fullPath === '/get_classes.txt' )
		//if ( fullPath === '/get_entity_classes.txt' )
		{
			res.send( get_classes_page );
			Finalize();
			return;
		}
		else
		if ( file_cache )
		{
			let url = 'game' + fullPath;

			if ( url.length > 0 )
			if ( url.charAt( url.length - 1 ) === '/' )
			url += 'index.html';

			// Mespeak's path issue
			url = url.split( '//' ).join( '/' );

			let obj = file_cache.get( url );

			//trace( 'RECV', url );

			if ( obj )
			{
				res.writeHead(200, {'Content-Type': obj.type, 'Content-Length':obj.length});
				res.write( obj.data );
				res.end();
			}
			else
			{
				res.writeHead( 404 );
				res.write( '404' );
				res.end();
			}
			Finalize();
		}
		else
		{
			let path2 = path.split('?')[0];

			fs.access( path2, fs.F_OK, (err) => 
			{
				//let t3 = Date.now();

				if ( !file_exists( path ) ) // Silent
				{
					res.end();

					Finalize();
					return;
				}

				if ( err ) // Access errors usually
				{
					//res.send( '404' );//console.error(err)
					res.status( 404 ).end();

					Finalize();
					return;
				}

				//res.sendFile( path );
				//file exists

				if ( path2[ path2.length - 1 ] === '/' )
				path2 += 'index.html';

				if ( path2.slice( -5 ) === '.html' )
				{
					fs.readFile( path2, function(err, data) {
						if (err) {
							res.send(404);
						} else {
							res.contentType('text/html'); // Or some other more appropriate value
							//transform(data); // use imagination please, replace with custom code

							let _parts_all = [];

							let parts = data.toString().split( '<?' );
							for ( let i = 0; i < parts.length; i++ )
							{
								parts[ i ] = parts[ i ].split( '?>' );
								_parts_all.push( ...parts[ i ] );
							}

							let code = '';
							let out = '';

							let print_html = true; // Can be disabled via <? print_html = false; ?>

							function print( str )
							{
								out += str;
							}
							function printOrReturn( str )
							{
								if ( print_html )
								out += str;

								return str;
							}

							for ( let _i = 0; _i < _parts_all.length; _i++ )
							{
								/*if ( _parts_all[ _i ].indexOf( '`' ) !== -1 )
								{
									trace('!!!');
									debugger;
								}*/

								if ( _i % 2 === 0 )
								{
									let s = _parts_all[ _i ];

									//code += 'printOrReturn(`' + s + '`);';

									code += 'printOrReturn(' + JSON.stringify( s ) + ');';
								}
								else
								code += '\n' + _parts_all[ _i ] + '\n';
							}

							eval( code );

							res.send( out );
						}
					});
				}
				else
				res.sendFile( path );


				Finalize();
			});
		}
	}
	//app.get('/', cb );
	//app.get('/*fullPath', cb );
	app.get('/{*fullPath}', cb );
	//app.get('/*', ); No longer supported
}









sdDatabase.init_class();
sdModeration.init_class();
sdMemoryLeakSeeker.init_class();

globalThis.sdMemoryLeakSeeker = sdMemoryLeakSeeker;

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

if ( path_for_online_count_save !== null )
{
	setInterval( ()=>{
		
		fs.writeFile( path_for_online_count_save, sdWorld.GetPlayingPlayersCount()+'/'+sdWorld.sockets.length+'', ( err )=>
		{
			
		});
		
	}, 1000 * 60 );
};

let game_ttl = 0; // Prevent frozen state
function ResetGameTTL()
{
	game_ttl = 1500;
}
function IsGameActive()
{
	let c = sdWorld.GetPlayingPlayersCountForGameLogicTest();
	
	if ( c > 0 )
	{
		ResetGameTTL();
	}
	
	return ( game_ttl > 0 );
}
globalThis.IsGameActive = IsGameActive;

var no_respawn_areas = []; // arr of { x, y, radius, until }

function UpdateOnlineCount()
{
	let pc = GetPlayingPlayersCount( false, false );

	let connected_total = 0;

	for ( var i = 0; i < sockets.length; i++ )
	if ( sockets[ i ].likely_a_real_player )
	connected_total++;

	for ( var i = 0; i < sockets.length; i++ )
	if ( sockets[ i ].likely_a_real_player )
	{
		if ( sockets[ i ].character && !sockets[ i ].character._is_being_removed )
		sockets[ i ].sd_events.push( [ 'ONLINE', [ connected_total, pc ] ] ); // In-game case
		else
		sockets[ i ].emit( 'ONLINE', [ connected_total, pc ] ); // Character cusomization screen
	}
}

const DEBUG_SOCKET_CHANGES = false;

const VoidArray = {
	push: ()=>{},
	has: ()=>{ return false; },
	set: ()=>{},
	get: ()=>{ return undefined; },
	add: ()=>{},
	push: ()=>{},
	indexOf: ()=>{ return -1; },
	length: 0,
	clear: ()=>{},
	delete: ()=>{}
};

const js_challenge_lzw = LZW.lzw_encode( fs.readFileSync( sdWorld.browser_fingerprinting_path_const, 'utf8' ) );

const cached_bans = {};

globalThis.DEBUG_TIME_MODE = false;

const hash_flood_prevention = []; // Array of { hash, expire_on } - used to prevent database hash flooding
const unique_hash_queue_length = 50; // It will likely limit number of online players by 50, at least if they connect at the same time
const hash_floor_expire_in = 1000 * 30;
globalThis.hash_flood_prevention = hash_flood_prevention;

let menu_chat_messages = [];
let menu_chat_user_counter = 0;

let next_drop_log = 0;
io.on( 'connection', ( socket )=> 
//io.onConnection( socket =>
{
	sdByteShifter.InstallDebugFeatures( socket );

	socket.likely_a_real_player = true; // Can be a sign of webcrawler too, though these are likely to disconnect quickly
	
	// Note: Make sure to remove all pointers at socket.on('disconnect', () => 
	
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
	
	/*socket.sent_result_ok = 0;
	socket.sent_result_dropped = 0;

	socket.left_overs = {};
	socket.lost_messages = [];

	socket.sent_messages = new Map(); // { data: full_msg, time: sdWorld.time, arrived: false }
	socket.sent_messages_first = 0;
	socket.sent_messages_last = 0;*/
	
	socket.byte_shifter = new sdByteShifter( socket );

	/*socket.myDrop = ( drop ) => // { event, data }
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
				if ( drop.data[ 3 ][ i ][ 0 ] === 'EFF' && ( drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_CHAT ) )
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
	};*/
	
	let ip = null;
	let details = null;
		
	if ( SOCKET_IO_MODE )
	{
		ip = socket.client.conn.remoteAddress;
		
		if ( CloudFlareSupport )
		{
			if ( typeof socket.client.request.headers['cf-connecting-ip'] !== 'string' )
			{
				console.log( 'User connection rejected with cf-connecting-ip: ', socket.client.request.headers['cf-connecting-ip'], ' data got from IP: ' + ip );
				socket.disconnect();
				return;
			}
			
			ip = socket.client.request.headers['cf-connecting-ip'];
		}
	}
	else
	{
		ip = '?:?:?:?';
		
		if ( socket.userData.ip !== undefined )
		ip = socket.userData.ip;
	}
	
	//let my_command_centre = null;
	socket.command_centre = null; // Obsolete
	
	socket.next_ad_time = 0;
	socket.ad_reward_pending = false;
	socket.ResetAdCooldown = ()=>
	{
		socket.next_ad_time = sdWorld.time + 1000 * 60 * 5; // Update data-ad-frequency-hint in html too
	};
	socket.ResetAdCooldown();
	
	socket.max_update_rate = sdWorld.max_update_rate;
	
	let ip_accurate = ip;
	socket.ip_accurate = ip_accurate;
	
	ip = ip.split(':');
	
	// To subnet format
	let ip2 = ip[ ip.length - 1 ].split('.');
	ip2[ ip2.length - 1 ] = '*';
	ip[ ip.length - 1 ] = ip2.join('.');
	
	ip = ip.join(':');
	
	
	socket.on( 'S2SProtocolMessage', ( v )=>
	{
		socket.likely_a_real_player = false;
		sdServerToServerProtocol.IncomingData( v, socket, ip_accurate );
	});
	
	
	if ( DEBUG_CONNECTIONS )
	{
		console.log( 'a user connected: ' + ip + ' aka ' + JSON.stringify( details ), '; CloudFlareSupport = ' + CloudFlareSupport + ' ('+socket.client.request.headers['cf-connecting-ip']+')' );
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
	
	if ( sockets.length > 32 )
	{
		trace( 'Note: sockets.length is now ' + sockets.length ); // What if this causes out of memory errors?
	}
	
	let shop_pending = true; // Assuming shop is not dynamic
	
	socket.character = null;
	
	//socket.reaction_to_seen_entities_offset = 0;
	socket.next_reaction_to_seen_entity_time = 0;
	
	socket.sd_events = []; // Mobile devices should work better if they won't be flooded with separate TCP event messages.
	
	socket.respawn_block_until = sdWorld.time + 400;
	socket.ffa_warning = 0; // Will be used for slower respawn
	
	UpdateOnlineCount();
	
	socket.emit( 'INIT', 
	{
		game_title: sdWorld.server_config.game_title || 'Star Defenders',
		backgroundColor: sdWorld.server_config.backgroundColor || '',
		supported_languages: sdWorld.server_config.supported_languages || []
		//password_required: !!( sdWorld.server_config.password )
	});
	
	//globalThis.EnforceChangeLog( sockets, sockets.indexOf( socket ) );
	
	socket.last_sync = sdWorld.time;
	socket.last_sync_score = sdWorld.time;
	
	socket.sync_busy = false; // Will be busy if separate threads will be still preparing snapshot
	
	socket.camera = { x:0,y:0,scale:2 };
	socket._FixCameraPosition = ()=>
	{
		// Copy Camera Bounds [ 1 / 2 ]
		if ( socket.camera.x < socket.character.x - 800/2 / socket.camera.scale )
		socket.camera.x = socket.character.x - 800/2 / socket.camera.scale;
		if ( socket.camera.x > socket.character.x + 800/2 / socket.camera.scale )
		socket.camera.x = socket.character.x + 800/2 / socket.camera.scale;

		if ( socket.camera.y < socket.character.y - 400/2 / socket.camera.scale )
		socket.camera.y = socket.character.y - 400/2 / socket.camera.scale;
		if ( socket.camera.y > socket.character.y + 400/2 / socket.camera.scale )
		socket.camera.y = socket.character.y + 400/2 / socket.camera.scale;
	};
	
	socket._SetCameraZoom = ( v )=> // Call .SetCameraZoom on character instead so it will be saved
	{
		if ( socket.camera.scale !== v )
		{
			socket.camera.scale = v;
			socket.emit( 'ZOOM', v );
		}
	};
	
	socket.observed_entities = [];
	
	//socket.known_statics = [];
	//socket.known_statics_versions = [];
	
	//socket.known_statics_map = new WeakMap();
	
	//socket.known_statics_versions_map = new Map();
	socket.known_statics_versions_map2 = new Map();
	
	socket.known_non_removed_dynamics = new Set();
	
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
	socket.SDServiceMessage = ( m=null, untranslateables_array=null, color=null )=> // Example usage: character_entity._socket.SDServiceMessage( 'You have been excluded from {1}\'s team (Command Centre has been destroyed)', [ this.owner.title ] ); OR character_entity._socket.SDServiceMessage( 'Text' );
	{
		if ( typeof m === 'string' )
		stacked_service_messages.push( [ m, untranslateables_array, color ] );
	
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
	
	socket.CommandFromEntityClass = ( class_object, command_name, parameters_array )=>
	{
		socket.emit( 'CLASS_CMD', class_object.name, command_name, parameters_array );
	};
	
	socket.SDSetClipboard = ( t )=>
	{
		socket.emit( 'SET_CLIPBOARD', t );
	};
	
	
	socket.challenge_result = null;
	
	socket.emit( 'EVAL_LZW', js_challenge_lzw );
	socket.on( 'CHALLENGE_RESULT', ( obj )=>
	{
		if ( obj )
		if ( typeof obj === 'object' )
		if ( typeof obj.hash === 'string' && obj.hash.indexOf( ',' ) > 0 )
		if ( typeof obj.timeHash === 'number' )
		if ( typeof obj.time56 === 'number' )
		if ( typeof obj.count56 === 'number' )
		if ( typeof obj.sdWorld === 'number' )
		if ( obj.timeHash < 1000 )
		socket.challenge_result = obj.hash;
		
		//trace( obj );
	});
	/* 
	// Should work as independent set of commands:
	socket.respawn_block_until = sdWorld.time - 1;
	socket.last_player_settings.full_reset = true;
	socket.Respawn( socket.last_player_settings );
	*/
   
	socket.Redirect = ( new_url, one_time_key=undefined )=>
	{
		if ( one_time_key !== undefined )
		new_url += '#one_time_key=' + one_time_key;
	
		socket.emit('redirect', new_url );//, { reliable: true, runs: 100 } );
	};
	
	socket.forced_entity = null;
	socket.forced_entity_params = {};
	
	socket.last_player_settings = null;
	socket.Respawn = ( player_settings, force_allow=false )=>
	{ 
		if ( typeof player_settings !== 'object' || player_settings === null )
		return;
	
		if ( socket.challenge_result === null )
		{
			socket.SDServiceMessage( 'Client was unable to respond in time. Try refreshing page?' );
			return;
		}
		
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
	   
		/*if ( player_settings.my_hash !== socket.my_hash ) Why?
		{
			socket.my_hash = player_settings.my_hash;
		}*/
		
		if ( typeof player_settings.my_hash !== 'string' )
		{
			socket.SDServiceMessage( 'Connection Error: No "my_hash" string was provided.' );
			return;
		}
		
		if ( player_settings.my_hash.length > 300 )
		{
			socket.SDServiceMessage( 'Connection Error: Your "my_hash" is {1} characters long, but 300 is a maximum allowed length. Contact us if this happens to you for no reason.', [ player_settings.my_hash.length ] );
			return;
		}
		
		
			
		socket.my_hash = player_settings.my_hash;
		
		let bypass_bans_and_password_check = false;

		if ( sdModeration.GetAdminRow( socket ) )
		bypass_bans_and_password_check = true;
	
	
	
	
		let any_passwords = [];
		
		if ( sdWorld.server_config.password !== '' && typeof sdWorld.server_config.password === 'string' )
		any_passwords.push( sdWorld.server_config.password );
	
		if ( sdModeration.data.non_admin_password !== '' && typeof sdModeration.data.non_admin_password === 'string' )
		any_passwords.push( sdModeration.data.non_admin_password );
		
		if ( any_passwords.length > 0 && any_passwords.indexOf( player_settings.password ) === -1 )
		{
			if ( bypass_bans_and_password_check )
			{
				if ( player_settings.password === '' )
				socket.SDServiceMessage( 'Password is required but you are an admin (password check was skipped)' );
				else
				socket.SDServiceMessage( 'Password does not match but you are an admin (password check was skipped)' );
			}
			else
			{
				if ( player_settings.password === '' )
				socket.emit( 'REQUIRE_PASSWORD', [ 'Password is required', '' ] );
				else
				socket.emit( 'REQUIRE_PASSWORD', [ 'Password does not match', '#ff0000' ] );

				return;
			}
		}
		
		
		//socket.byte_shifter.onRemove();
		//socket.byte_shifter = new sdByteShifter( socket );
		//socket.byte_shifter.Reset();
	
		
		let t = Date.now();
		
		let new_recent_hash = true;
		
		for ( let i = 0; i < hash_flood_prevention.length; i++ )
		{
			let row = hash_flood_prevention[ i ];
			if ( row.hash === player_settings.my_hash )
			{
				row.expire_on = t + hash_floor_expire_in;
				new_recent_hash = false;
			}
			else
			{
				if ( t > row.expire_on )
				{
					hash_flood_prevention.splice( i, 1 );
					i--;
					continue;
				}
			}
		}
		
		if ( new_recent_hash )
		{
			if ( hash_flood_prevention.length > unique_hash_queue_length )
			{
				// Someone is trying random hashes consistently? Implement some sort of hash guessing bans there at some point.
				socket.SDServiceMessage( 'Connection Error: Connection queue exceeds {1} hashes. Try again in few minutes or report this issue if it continues.', [ unique_hash_queue_length ] );
				return;
			}
			else
			{
				hash_flood_prevention.push({
					hash: player_settings.my_hash,
					expire_on: t + hash_floor_expire_in
				});
			}
		}
	
		let my_hash = socket.my_hash; // To make sure it won't change
		
		let ban = cached_bans[ ip_accurate ] || cached_bans[ my_hash ];

		const options = {
			//weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric"
		};
	
		let will_delete_ban_after_resolved = false;

		if ( ban )
		{
			if ( Date.now() > ban.until )
			{
				will_delete_ban_after_resolved = true;
			}
			else
			{
				if ( bypass_bans_and_password_check )
				{
					socket.SDServiceMessage( 'Ignoring global ban (UID: {1}) due to admin permissions on a server (according to 15 seconds cache)', [ ban.uid ] );
				}
				else
				{
					socket.SDServiceMessage( 'Access denied: {1} (until {2})', [ ban.reason_public, ban.until_real === 0 ? 'forever' : new Date( ban.until_real ).toLocaleDateString( "en-US", options ) ] );
					return;
				}
			}
		}

		sdDatabase.Exec( 
			[ 
				[ 'DBLogIP', my_hash, ip_accurate, socket.challenge_result ] 
			], 
			( responses )=>
			{
				if ( responses !== null )
				{
					if ( will_delete_ban_after_resolved )
					{
						delete cached_bans[ ip_accurate ];
						delete cached_bans[ my_hash ];
					}

					while ( responses.length > 0 )
					{
						let r = responses.shift();

						if ( r[ 0 ] === 'BANNED' )
						{
							let ban = { 
								reason_public: r[ 1 ],
								until: Date.now() + 1000 * 15,
								until_real: r[ 2 ],
								uid: r[ 3 ]
							};

							cached_bans[ ip_accurate ] = ban;
							cached_bans[ my_hash ] = ban;

							// Server with local database would execute it instantly otherwise
							setTimeout( ()=>
							{
								if ( bypass_bans_and_password_check )
								{
									socket.SDServiceMessage( 'Ignoring global ban (UID: {1}) due to admin permissions on a server', [ ban.uid ] );
								}
								else
								{
									if ( socket.character )
									socket.CharacterDisconnectLogic();

									socket.SDServiceMessage( 'Access denied: {1} (until {2})', [ r[ 1 ], ban.until_real === 0 ? 'forever' : new Date( ban.until_real ).toLocaleDateString( "en-US", options ) ] );
								}	

							}, 0 );
						}
					}
				}
			},
			'localhost'
		);

		if ( !sdWorld.server_config.ModifyReconnectRestartAttempt( player_settings, socket ) )
		{
			return;
		}
		
		socket.sd_events = []; // Just in case? There was some source of 600+ events stacked, possibly during start screen waiting or maybe even during player being removed. Lots of 'C' events too
		
		//socket.respawn_block_until = sdWorld.time + 400;
		
		//let old_score = socket.score;
		
		//if ( !sdWorld.server_config.ResetScoreOnDeath || sdWorld.server_config.ResetScoreOnDeath() )
		//socket.score = 0;
		
		let character_entity = null;
		
		let skip_arrival_sequence = false;
		
		function RemoveOldPlayerOnSocket()
		{
			if ( socket.character )
			{
				if ( sdWorld.server_config.onDisconnect )
				sdWorld.server_config.onDisconnect( socket.character, 'manual' );
			
				if ( !socket.character._is_being_removed )
				{
					if ( socket.character.title.indexOf( 'Disconnected ' ) !== 0 )
					socket.character.title = 'Disconnected ' + socket.character.title;

					socket.character._key_states.Reset();
				}

				if ( !socket.character._is_being_removed )
				if ( socket.character.hea > 0 )
				socket.character.Damage( socket.character.hea ); // With weapon drop
		
				//socket.character._old_score = socket.score;
				
				if ( DEBUG_SOCKET_CHANGES )
				trace( 'characters['+socket.character._net_id + ']._socket = null');

				socket.character._socket = null;

				socket.character = null;
				
				//socket.score = 0;
			}
		}
		function SpawnNewPlayer()
		{
			const allowed_classes = sdWorld.allowed_player_classes;
			
			if ( socket.forced_entity )
			{
				socket.forced_entity_params.x = 0;
				socket.forced_entity_params.y = 0;
				character_entity = new sdWorld.entity_classes[ socket.forced_entity ]( socket.forced_entity_params );
			}
			else
			{
				let preferred_entity = sdWorld.ConvertPlayerDescriptionToEntity( player_settings );

				if ( preferred_entity === 'sdPlayerSpectator' && sdWorld.server_config.only_admins_can_spectate )
				{
					let admin_row = sdModeration.GetAdminRow( socket );

					if ( !admin_row )
					preferred_entity = 'sdCharacter';
				}

				if ( allowed_classes.indexOf( preferred_entity ) === -1 )
				character_entity = new sdCharacter({ x:0, y:0 });
				else
				character_entity = new sdWorld.entity_classes[ preferred_entity ]({ x:0, y:0 });

				if ( preferred_entity === 'sdPlayerOverlord' )
				socket.respawn_block_until = sdWorld.time + ( 1000 * 60 * 2 ); // 2 minutes respawn wait time
				// Not sure if this is ideal solution. - Booraz149
			}
			sdEntity.entities.push( character_entity );
			
			if ( sdWorld.server_config.PlayerSpawnPointSeeker )
			if ( sdWorld.server_config.PlayerSpawnPointSeeker( character_entity, socket ) )
			skip_arrival_sequence = true;
		}
		function TryToAssignDisconnectedPlayerEntity()
		{
			let best_ent = null;
			
			// Expand any deep sleep cells that might keep the player
			sdDeepSleep.WakeUpByArrayAndValue( '_my_hash_list', player_settings.my_hash );
			
			for ( let i = 0; i < sdCharacter.characters.length; i++ )
			{
				let ent = sdCharacter.characters[ i ];

				if ( ent )
				if ( !ent._is_being_removed )
				if ( ent._my_hash === player_settings.my_hash )
				if ( !ent._socket )
				if ( best_ent === null || ( best_ent.hea || best_ent._hea || 0 ) <= 0 )
				best_ent = ent;
			}
		
			if ( best_ent )
			character_entity = best_ent;
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
	
		if ( !player_settings.full_reset )
		{
			// Will only find appropriate player, no extra actions. Updates character_entity value
			TryToAssignDisconnectedPlayerEntity();
			
			if ( !character_entity )
			player_settings.full_reset = true;
		}
		
		
		
		if ( socket.character === null )
		{
			const sdCamera = sdWorld.entity_classes.sdCamera;
			
			for ( let i = 0; i < sdCamera.cameras.length; i++ )
			sdCamera.cameras[ i ].Trigger( sdCamera.DETECT_PLAYER_CONNECTIONS, player_settings.hero_name + ' enters the world' );
		}
		
		if ( player_settings.full_reset )
		{
			if ( !force_allow && sdWorld.time < socket.respawn_block_until )
			{
				//socket.SDServiceMessage( 'Respawn rejected - too quickly (wait ' + ( socket.respawn_block_until - sdWorld.time ) + 'ms)' );
				socket.SDServiceMessage( 'Respawn rejected - too quickly (wait ' + Math.ceil( ( socket.respawn_block_until - sdWorld.time ) / 100 ) / 10 + ' seconds)' );
				
				socket.emit('REMOVE sdWorld.my_entity');
				return;
			}
			
			if ( !sdWorld.server_config.IsEntitySpawnAllowed( player_settings, socket ) )
			{
				return;
			}
			
			socket.respawn_block_until = sdWorld.time + 2000; // Will be overriden if player respawned near his command centre
			socket.post_death_spectate_ttl = 60;




			RemoveOldPlayerOnSocket();
			SpawnNewPlayer(); // Updates character_entity value
			
			//if ( typeof player_settings.my_hash === 'string' )
			character_entity._my_hash = player_settings.my_hash;
		}
		else
		{
			
		}

		/*character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( player_settings );
		character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( player_settings );

		character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( player_settings );
		character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( player_settings );
		character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( player_settings );

		character_entity.title = player_settings.hero_name;
		character_entity.title_censored = sdModeration.IsPhraseBad( character_entity.title, socket );*/

		sdWorld.ApplyPlayerSettingsToPlayer( character_entity, player_settings, socket );
		
		if ( DEBUG_SOCKET_CHANGES )
		trace( 'characters['+character_entity._net_id + ']._socket = socket');
			
		character_entity._socket = socket; // prevent json appearence
		character_entity._save_file = player_settings.save_file;
		
		socket._SetCameraZoom( character_entity._camera_zoom );
		
		socket.character = character_entity;
		socket.camera.x = socket.character.x;
		socket.camera.y = socket.character.y;
		
		character_entity.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		character_entity._frozen = 0; // Preventing results of a bug where status effects were removed but _frozen property wasn't reset. Still not sure why this happens
		
		
		sdWorld.LogRecentPlayer( character_entity, socket );

		sdTask.WakeUpTasksFor( character_entity );
		
		if ( !character_entity._save_file )
		debugger;
		
		//playing_players++;
		
		


		socket.emit('SET sdWorld.my_entity', character_entity._net_id );//, { reliable: true, runs: 100 } );
		ResetGameTTL();
		
		// A little hack for admins that are in godmode
		if ( character_entity._god )
		{
			setTimeout( ()=>
			{
				socket.emit('SET sdWorld.my_entity._god', character_entity._god, character_entity._debug );//, { reliable: true, runs: 100 } );
				
			}, 2000 );
		}

		if ( shop_pending )
		{
			shop_pending = false;
			
			if ( !sdShop.options_snappack )
			{
				sdShop.options_snappack = LZW.lzw_encode( JSON.stringify( sdShop.options ) );
			}
			
			socket.emit('SET sdShop.options', sdShop.options_snappack );//, { reliable: true, runs: 100 } );
		}
		
		
		if ( character_entity._socket )
		{
			for ( var upgrade_name in character_entity._upgrade_counters )
			{
				character_entity._socket.emit( 'UPGRADE_SET', [ upgrade_name, character_entity._upgrade_counters[ upgrade_name ] ] );
			}
		}

		//sdEntity.entities.push( character_entity );
		

		//socket.character = character_entity; // Twice?
		
		if ( player_settings.full_reset )
		{
			if ( sdWorld.server_config.onRespawn )
			sdWorld.server_config.onRespawn( character_entity, player_settings, skip_arrival_sequence );
			/*
			let guns = [ sdGun.CLASS_BUILD_TOOL ];
			if ( player_settings.start_with1 )
			guns.push( sdGun.CLASS_PISTOL );
			else
			if ( player_settings.start_with2 )
			guns.push( sdGun.CLASS_SWORD );
			else
			if ( player_settings.start_with3 )
			guns.push( sdGun.CLASS_SHOVEL );

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
		
		if ( sdWorld.GetPlayingPlayersCount() >= 3 )
		{
			const sdCamera = sdWorld.entity_classes.sdCamera;
			
			for ( let i = 0; i < sdCamera.cameras.length; i++ )
			sdCamera.cameras[ i ].Trigger( sdCamera.DETECT_PLAYER_CONNECTIONS_3, player_settings.hero_name + ' enters the world' );
		}
		if ( sdWorld.GetPlayingPlayersCount() >= 6 )
		{
			const sdCamera = sdWorld.entity_classes.sdCamera;
			
			for ( let i = 0; i < sdCamera.cameras.length; i++ )
			sdCamera.cameras[ i ].Trigger( sdCamera.DETECT_PLAYER_CONNECTIONS_6, player_settings.hero_name + ' enters the world' );
		}
		
		UpdateOnlineCount();
	};
	
	socket.on('RESPAWN', socket.Respawn );
	
	socket.on('my_url', ( url )=>
	{
		if ( sdWorld.server_config.make_server_public )
		{
			if ( sdWorld.server_url === null )
			{
				if ( url.indexOf( 'localhost' ) === -1 ) // No point in these as they can't be accessed from outside anyway
				if ( url.indexOf( '127.0.0.1' ) === -1 ) // No point in these as they can't be accessed from outside anyway
				if ( url.indexOf( '[::1]' ) === -1 ) // No point in these as they can't be accessed from outside anyway
				sdWorld.server_url = url;
			}
		}
	});
	socket.listens_to_menu_chat = false;
	socket.menu_chat_uid = menu_chat_user_counter++;
	socket.on('menu_chat_command', ( v )=>
	{
		if ( v === 1 )
		{
			if ( !socket.listens_to_menu_chat )
			{
				let response = { 
					menu_chat_uid: socket.menu_chat_uid, 
					time: Date.now(), 
					messages: menu_chat_messages.slice() 
				};
				socket.emit( 'MENU_CHAT_UPDATE', response );
			}
			socket.listens_to_menu_chat = true;
			socket.likely_a_real_player = true;
		}
		else
		if ( v === 0 )
		{
			socket.listens_to_menu_chat = false;
		}
		else
		{
			v = (v+'').substring( 0, 2000 );
			
			let time = Date.now();
			
			// These are sent as is (!) Handle IP address information accordingly if you are going to
			let obj = {
				from: socket.menu_chat_uid,
				text: v,
				time: time,
				text_censored: sdModeration.IsPhraseBad( v, socket )
			};
			
			menu_chat_messages.push( obj );
			if ( menu_chat_messages.length > 100 )
			menu_chat_messages.shift();
			
			for ( let i = 0; i < sockets.length; i++ )
			if ( sockets[ i ].listens_to_menu_chat )
			sockets[ i ].emit( 'MENU_CHAT_UPDATE', { messages: [ obj ] } );
		}
	});
	socket.on('one_time_key', ( v )=>
	{
		for ( let i = 0; i < sdLongRangeTeleport.one_time_keys.length; i++ )
		{
			if ( sdWorld.time > sdLongRangeTeleport.one_time_keys[ i ].until )
			{
				sdLongRangeTeleport.one_time_keys.splice( i,1 );
				i--;
				continue;
			}
				
			if ( sdLongRangeTeleport.one_time_keys[ i ].hash === v )
			{
				/*socket.Respawn( 
					{ 
						my_hash: sdLongRangeTeleport.one_time_keys[ i ].ent._my_hash,
						keep_style: 1
					}, 
					true 
				);*/
				if ( !sdLongRangeTeleport.one_time_keys[ i ].ent._save_file )
				debugger;
				
				socket.emit( 'settings_replace_and_start', sdLongRangeTeleport.one_time_keys[ i ].ent._save_file );
		
				sdLongRangeTeleport.one_time_keys.splice( i,1 );
				i--;
				break;
			}
		}
	});
	
	// Input
	//socket.on('K1', ( key ) => { if ( socket.character ) socket.character._key_states.SetKey( key, 1 ); }); Mobile users send these too quickly as for TCP connection
	//socket.on('K0', ( key ) => { if ( socket.character ) socket.character._key_states.SetKey( key, 0 ); });
	
	
	socket.last_gsco_time = sdWorld.time;
	
	//let last_message_id = -1;
	
	socket.on('Kv2', ( sd_events )=>
	{
		// Prevent out of order messages, which happens
		/*if ( message_id instanceof Number )
		{
			if ( message_id <= last_message_id )
			return;
			else
			last_message_id = message_id;
		}*/
		
		if ( sd_events instanceof Array )
		if ( sd_events.length < 32 )
		for ( var i = 0; i < sd_events.length; i++ )
		{
			//if ( sd_events[ i ].length !== 2 )
			//return;
		
			if ( sd_events[ i ].length < 2 )
			return;
		
			var type = sd_events[ i ][ 0 ];
			var key = sd_events[ i ][ 1 ];
			
			if ( socket.character )
			if ( !socket.character._is_being_removed )
			{
				if ( type === 'GSCO' )
				{
					let gspeed_and_key_events = key;
					
					let panic_mode = false; // In panic mode server allows relative factors of GSPEED instead
					
					let average_GSPEED = 0;
					let average_EXPECTED_GSPEED = 0;
					for ( let i = 0; i < sdWorld.SERVER_AVERAGE_GSPEED_VALUES.length; i++ )
					{
						average_GSPEED += sdWorld.SERVER_AVERAGE_GSPEED_VALUES[ i ].GSPEED;
						average_EXPECTED_GSPEED += sdWorld.SERVER_AVERAGE_GSPEED_VALUES[ i ].EXPECTED_GSPEED;
					}
					
					//if ( average_GSPEED !== average_EXPECTED_GSPEED )
					if ( average_GSPEED < average_EXPECTED_GSPEED * 0.5 )
					{
						//trace( 'Panic', average_GSPEED, average_EXPECTED_GSPEED );
						panic_mode = true;
					}
					
					//let gspeed_allowed = Math.min( socket.character._GSPEED_buffer_length_allowed, 30 ); // Sensitive to server lags, but would keep player in sync with the world. Best if servers would not lag
					
					//let gspeed_allowed = Math.min( socket.character._GSPEED_buffer_length_allowed * sdWorld.SERVER_EXPECTED_GSPEED / sdWorld.GSPEED, 30 ); // Sensitive to server stutter but not overall lags. Maybe will be alright
					
					//let gspeed_allowed = Math.min( ( sdWorld.time - socket.last_gsco_time ) / 1000 * 30, 30 ); // Will make players always run at normal speed no matter how laggy server is. It ignores time warp though, which is bad
					
					let gspeed_allowed = Math.min( socket.character._GSPEED_buffer_length_allowed * average_EXPECTED_GSPEED / average_GSPEED, 30 );
					
					let gspeed_received = 0;
					
					if ( gspeed_and_key_events.length < sdWorld.my_inputs_and_gspeeds_max ) // It has been enough so far
					for ( let i = 0; i < gspeed_and_key_events.length; i++ )
					{
						let state = gspeed_and_key_events[ i ];
						
						if ( typeof state === 'number' )
						if ( state > 0 && state < 30 && !isNaN( state ) )
						gspeed_received += state;
					}
					
					// Make sure total GSPEED is scaled down/up to fit real GSPEED happened for character
					let gspeed_mult = gspeed_allowed / gspeed_received;
					
					if ( panic_mode )
					{
						if ( gspeed_received < gspeed_allowed * 2 || gspeed_received < 30 )
						{
							//trace( 'panic within x8');
							gspeed_mult = 1;
						}
						//else
						//trace( 'panic outside x8', gspeed_received, gspeed_allowed );
					}
					
					if ( gspeed_received > 0.0001 && isFinite( gspeed_mult ) && !isNaN( gspeed_mult ) )
					{
						let e = socket.character;
						
						let old_sync = e.sync;
						let old_sync_guns = [];
						for ( let i = 0; i < e._inventory.length; i++ )
						old_sync_guns[ i ] = ( e._inventory[ i ] ) ? e._inventory[ i ].sync : -1;
						
						sdCharacter.allow_alive_players_think = true;
						{
							for ( let i = 0; i < gspeed_and_key_events.length; i++ )
							{
								let state = gspeed_and_key_events[ i ];
								
								if ( typeof state === 'number' )
								{
									// Throw in more substeps if needed to prevent impacts
									let substeps = Math.max( 1, Math.floor( state * gspeed_mult / 3 ) );

									if ( state > 0 && state < 30 && !isNaN( state ) )
									for ( let i = 0; i < substeps; i++ )
									{
										e.onThink( state * gspeed_mult / substeps );

										if ( e._is_being_removed )
										{
											break;
										}
										else
										{
											// Without it bullets can pass through such players on lags

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

										for ( let i = 0; i < e._inventory.length; i++ )
										if ( e._inventory[ i ] )
										if ( !e._inventory[ i ]._is_being_removed )
										e._inventory[ i ].onThink( state * gspeed_mult / substeps );
									}
								}
								else
								if ( state instanceof Array )
								{
									if ( state[ 0 ] === 1 )
									e._key_states.SetKey( state[ 1 ], 1 );
									else
									if ( state[ 0 ] === 0 )
									e._key_states.SetKey( state[ 1 ], 0 );
									else
									debugger;
								}
								else
								debugger;
							}
						}
						sdCharacter.allow_alive_players_think = false;
						
						e.sync = ( old_sync + 1 ) % 100; // Somehow it helps with decreased update on viewer's side
						
						for ( let i = 0; i < e._inventory.length; i++ )
						if ( e._inventory[ i ] )
						if ( old_sync_guns[ i ] !== -1 )
						e._inventory[ i ].sync = ( e._inventory[ i ].sync + 1 ) % 100; // Somehow it helps with decreased update on viewer's side
					}
					
					socket.character._GSPEED_buffer_length_allowed = 0;
					
					socket.OnMouseMovementAndCorrectionsSnapshot( sd_events[ i ][ 2 ] );
					
					socket.last_gsco_time = sdWorld.time;
					
					let held_key_ids = sd_events[ i ][ 3 ];
					if ( held_key_ids instanceof Array )
					for ( let i = 0; i < sdKeyStates.default_state_keys.length; i++ )
					{
						let prop = sdKeyStates.default_state_keys[ i ];

						let old_value = socket.character._key_states.key_states[ prop ];
						let new_value = ( held_key_ids.indexOf( i ) !== -1 ) ? 1 : 0;

						if ( old_value !== new_value )
						socket.character._key_states.key_states[ prop ] = new_value;
					}
				}
				else
				if ( type === 'K1' )
				{
					//socket.character._key_states.SetKey( key, 1 );
					debugger; // Obsolete
				}
				else
				if ( type === 'K0' )
				{
					//socket.character._key_states.SetKey( key, 0 );
					debugger; // Obsolete
				}
			}
			
			if ( type === 'UI' )
			{
				sdInterface.HandleCommandOnServer( sd_events[ i ][ 1 ], sd_events[ i ][ 2 ], sd_events[ i ][ 3 ], sd_events[ i ][ 4 ], socket );
			}
			
			if ( type === 'T' ) // Translations
			{
				let lang = key;
				let str_array = sd_events[ i ][ 2 ];
				
				if ( typeof lang === 'string' )
				if ( str_array instanceof Array )
				if ( lang !== 'en' )
				if ( lang.length === 2 )
				//if ( sdWorld.server_config.supported_languages.indexOf( lang ) !== -1 )
				{
					let initiator_hash_or_user_uid = socket.my_hash;
					
					sdDatabase.Exec( 
						[ 
							[ 'DBTranslate', initiator_hash_or_user_uid, lang, str_array ] 
						], 
						( responses )=>
						{
							if ( responses.length > 0 )
							socket.emit( 'T', responses );
						},
						'localhost'
					);
				}
			}
			else
			if ( type.substring( 0, 3 ) === 'DB_' )
			{
				let admin_row = sdModeration.GetAdminRow( socket );
				if ( admin_row )
				{
					let initiator_hash_or_user_uid = socket.my_hash;
					//sdDatabase.HandleCommandFromAdmin( socket, initiator_hash_or_user_uid, type, key, sd_events[ i ][ 2 ] );
					let path_parts = key;
					let new_value = sd_events[ i ][ 2 ];
					
					sdDatabase.Exec( 
						[ 
							[ 'DBEditorCommand', initiator_hash_or_user_uid, type, path_parts, new_value ] 
						], 
						( responses )=>
						{
							// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server
							for ( let i = 0; i < responses.length; i++ )
							{
								let response = responses[ i ];
								socket.emit( response[ 0 ], response[ 1 ] );
							}
						},
						'localhost'
					);
				}
				else
				socket.SDServiceMessage( 'Server: Only first admin can access database' );
			}
		}
	});
	
	socket.on('CHAT', ( t ) => { 
		
		if ( typeof t !== 'string' )
		return;
		
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
		
		if ( socket.character )
		if ( socket.character.hea > 0 || socket.character.death_anim < 30 ) // allow last words
		{
			if ( t.length > 100 )
			{
				t = t.slice( 0, 100 ) + '...';
			}
			
			/*if ( sdWorld.time < socket.muted_until )
			{
				socket.emit( 'censored_chat', [ 0 ] );
			}
			else
			if ( sdModeration.IsPhraseBad( t, socket ) )
			{
				socket.emit( 'censored_chat', [ ( sdWorld.server_config.censorship_mute_duration !== undefined ? sdWorld.server_config.censorship_mute_duration : 5000 ) ] );
			}
			else*/
			socket.character.Say( t, false, false, false, false, false );
		}
	});
	socket.muted_until = 0;
	
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
	socket.OnMouseMovementAndCorrectionsSnapshot = ( arr )=>{
	//socket.on('M', ( arr ) => { // Position corrections. Cheating can happen here. Better solution could be UDP instead of TCP connections.
		
		if ( arr instanceof Array )
		if ( typeof arr[ 0 ] === 'number' )
		if ( typeof arr[ 1 ] === 'number' )
		if ( typeof arr[ 2 ] === 'number' )
		if ( typeof arr[ 3 ] === 'number' )
		if ( typeof arr[ 4 ] === 'number' ) // Not used right now
		if ( typeof arr[ 5 ] === 'number' )
		if ( typeof arr[ 6 ] === 'number' )
		if ( typeof arr[ 7 ] === 'number' )
		//if ( typeof arr[ 8 ] === 'number' ) //
		if ( typeof arr[ 8 ] === 'object' ) //
		if ( typeof arr[ 9 ] === 'number' )
		if ( typeof arr[ 10 ] === 'number' )
		{
			socket.last_ping = sdWorld.time;
			socket.waiting_on_M_event_until = 0;
			
			if ( socket.character ) 
			//if ( !socket.character.is( sdPlayerSpectator ) ) 
			{ 
				/*let test_ent = sdEntity.entities_by_net_id_cache_map.get( 40580166 ); // Hack. Testing what is wrong here - possibly compression fails
				socket.character.x = test_ent.x;
				socket.character.y = test_ent.y;
				socket.character.sx = 0;
				socket.character.sy = 0;*/
				
				//messages_to_report_arrival
				socket.character.look_x = arr[ 0 ]; 
				socket.character.look_y = arr[ 1 ];

				socket.camera.x = arr[ 2 ];
				socket.camera.y = arr[ 3 ];
				//socket.camera.scale = arr[ 4 ]; // Why?

				socket.byte_shifter.ClientReportedArrival( arr[ 8 ] );
				/*let messages_to_report_arrival = arr[ 8 ];

				for ( let i = 0; i < Math.min( 100, messages_to_report_arrival.length ); i++ )
				{
					let id = ~~( messages_to_report_arrival[ i ] );
					if ( id >= socket.sent_messages_first && id < socket.sent_messages_last )
					{
						let msg = socket.sent_messages.get( id );
						msg.arrived = true;
					}
				}*/
				
				let look_at_net_id = arr[ 9 ];
				let look_at_relative_to_direct_angle = arr[ 10 ];
				
				if ( look_at_net_id !== -1 )
				if ( !socket.character.is( sdCharacter ) || // Always on for drones & different creatures
					 !socket.character._inventory[ socket.character.gun_slot ] || // Fists
					 ( sdGun.classes[ socket.character._inventory[ socket.character.gun_slot ].class ] && sdGun.classes[ socket.character._inventory[ socket.character.gun_slot ].class ].allow_aim_assist !== false ) ) // No aim assist for build gun and admin teleport gun
				{
					let look_at_entity = sdEntity.entities_by_net_id_cache_map.get( look_at_net_id );
					if ( look_at_entity )
					if ( !look_at_entity._is_being_removed )
					{
						//if ( ( look_at_entity.is_static && socket.known_statics_versions_map.has( look_at_entity ) ) ||
						if ( ( look_at_entity.is_static && socket.known_statics_versions_map2.has( look_at_entity._net_id ) ) ||
							 ( !look_at_entity.is_static && socket.observed_entities.indexOf( look_at_entity ) !== -1 ) ) // Is entity actually visible (anti-cheat measure)
						if ( sdWorld.inDist2D_Boolean( look_at_entity.x, look_at_entity.y, socket.character.x, socket.character.y, 1000 ) ) // Prevent player from tracking RTP-ing characters (anti-base detection measure)
						{
							// Bad! Apply offset
							//socket.character.look_x = look_at_entity.x;
							//socket.character.look_y = look_at_entity.y;
							
							let di = sdWorld.Dist2D( socket.character.look_x, socket.character.look_y, socket.character.x, socket.character.y );
							
							// TODO: Make it aim at physical center
							let direct_angle = Math.atan2( look_at_entity.x + ( look_at_entity._hitbox_x1 + look_at_entity._hitbox_x2 ) / 2 - socket.character.x, look_at_entity.y + ( look_at_entity._hitbox_y1 + look_at_entity._hitbox_y2 ) / 2 - socket.character.y );
							
							if ( globalThis.CATCH_ERRORS )
							{
								if ( isNaN( look_at_entity._hitbox_x1 ) || look_at_entity._hitbox_x1 === undefined )
								throw new Error('look_at_entity._hitbox_x1 is ' + look_at_entity._hitbox_x1 + ' ('+look_at_entity.GetClass()+')' );

								if ( isNaN( look_at_entity._hitbox_x2 ) || look_at_entity._hitbox_x2 === undefined )
								throw new Error('look_at_entity._hitbox_x2 is ' + look_at_entity._hitbox_x2 + ' ('+look_at_entity.GetClass()+')' );

								if ( isNaN( look_at_entity._hitbox_y1 ) || look_at_entity._hitbox_y1 === undefined )
								throw new Error('look_at_entity._hitbox_y1 is ' + look_at_entity._hitbox_y1 + ' ('+look_at_entity.GetClass()+')' );

								if ( isNaN( look_at_entity._hitbox_y2 ) || look_at_entity._hitbox_y2 === undefined )
								throw new Error('look_at_entity._hitbox_y2 is ' + look_at_entity._hitbox_y2 + ' ('+look_at_entity.GetClass()+')' );

								if ( isNaN( look_at_entity.x ) || look_at_entity.x === undefined )
								throw new Error('look_at_entity.x is ' + look_at_entity.x + ' ('+look_at_entity.GetClass()+')' );

								if ( isNaN( look_at_entity.y ) || look_at_entity.y === undefined )
								throw new Error('look_at_entity.y is ' + look_at_entity.y + ' ('+look_at_entity.GetClass()+')' );

								if ( isNaN( direct_angle ) )
								throw new Error('direct_angle ' + direct_angle );

								if ( isNaN( look_at_relative_to_direct_angle ) )
								throw new Error('look_at_relative_to_direct_angle ' + look_at_relative_to_direct_angle );
							}
							
							socket.character.look_x = socket.character.x + Math.sin( direct_angle - look_at_relative_to_direct_angle ) * di;
							socket.character.look_y = socket.character.y + Math.cos( direct_angle - look_at_relative_to_direct_angle ) * di;
						}
					}
				}

				if ( sdWorld.time > socket.next_position_correction_allowed )
				{
					let corrected = false;

					const correction_scale = 3; // Was 3 before input and GSPEED sequences being sent by players // 1 should be most cheat-proof, but can be not enough for laggy servers
					const debug_correction = false;
					
					if ( socket.character.AllowClientSideState() ) // Health and hook change
					{
						let dx = arr[ 5 ] - socket.character.x;
						let dy = arr[ 6 ] - socket.character.y;

						let allowed = true;

						/*if ( socket.character.stands || socket.character._in_air_timer < 500 / 1000 * 30 * correction_scale ) // Allow late jump
						{
							if ( dy < -27 )
							{

								if ( debug_correction )
								console.log( 'dy', dy );
								dy = -27 * correction_scale;
							}

							if ( dx > 30 )
							{
								if ( debug_correction )
								console.log( 'dx', dx );
								dx = 30 * correction_scale;

							}
							else
							if ( dx < -30 )
							{
								if ( debug_correction )
								console.log( 'dx', dx );
								dx = -30 * correction_scale;
							}
						}
						else
						{
							if ( socket.character.flying || socket.character._jetpack_allowed || socket.character._in_water )
							{
								if ( dx > 20 )
								dx = 20;
								else
								if ( dx < -20 )
								dx = -20;

								if ( dy > 20 )
								dy = 20;
								else
								if ( dy < -20 )
								dy = -20;

								if ( debug_correction )
								console.log( 'flying', dx, dy );
							}
							else
							{
								if ( dy < 0 )
								{
									if ( debug_correction )
									console.log( 'dy < 0 without flying or water', dx, dy );

									allowed = false;
								}
							}
						}*/

						if ( !allowed || Math.abs( dx ) > 32 || Math.abs( dy ) > 32 )
						{
							if ( allowed )
							if ( debug_correction )
							console.log( 'too far', dx, dy );

							dx = 0;
							dy = 0;
						}
						else
						{
							let di = sdWorld.Dist2D_Vector( dx, dy );

							if ( di > 32 )
							{
								dx = dx / di * 32;
								dy = dy / di * 32;
							}
						
							let jump_di = sdWorld.Dist2D_Vector( dx, dy );

							let steps = Math.ceil( jump_di / 8 );

							corrected = true;

							const overlap = 0.001; // 1
							
							let filter = socket.character.GetCurrentCollisionFilter();

							for ( let i = 1; i > 0; i -= 1 / steps )
							if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx * i, socket.character.y + dy * i, overlap, filter ) )
							{
								corrected = false;
								break;
							}

							if ( !corrected )
							{
								corrected = true;

								// Up
								for ( let i = 1; i > 0; i -= 1 / steps )
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x, socket.character.y + dy * i, overlap, filter ) )
								{
									corrected = false;
									break;
								}

								// Then to right
								if ( corrected )
								for ( let i = 1; i > 0; i -= 1 / steps )
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx * i, socket.character.y + dy, overlap, filter ) )
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
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx * i, socket.character.y, overlap, filter ) )
								{
									corrected = false;
									break;
								}

								// Then to up
								if ( corrected )
								for ( let i = 1; i > 0; i -= 1 / steps )
								if ( !socket.character.CanMoveWithoutOverlap( socket.character.x + dx, socket.character.y + dy * i, overlap, filter ) )
								{
									corrected = false;
									break;
								}
							}

							if ( corrected )
							{
								socket.next_position_correction_allowed = sdWorld.time + 100;
								socket.character.x += dx;
								socket.character.y += dy;

								corrected = true;
							}
						}

						if ( !corrected )
						{
							socket.next_position_correction_allowed = sdWorld.time + 50;
							
							socket.sd_events.push( [ 'C', [ socket.character.x, socket.character.y, socket.character.sx, socket.character.sy ] ] );
							//socket.sd_events.push( [ 'C', [ socket.character.x - arr[ 5 ], socket.character.y - arr[ 6 ], socket.character.sx, socket.character.sy ] ] );
						}
					}
				}

				socket._FixCameraPosition();
			}
		}
	};
	
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
		
	});
	
	/*socket.on('COM_SUB', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		let net_id = arr[ 0 ];
		let new_sub = arr[ 1 ];
		
		if ( typeof new_sub === 'number' || ( typeof new_sub === 'string' && ( new_sub === '*' || typeof sdWorld.entity_classes[ new_sub ] !== 'undefined' ) ) )
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdCom', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdCom.action_range ) >= 0 )
				{
					if ( socket.character.canSeeForUse( ent ) )
					ent.NotifyAboutNewSubscribers( 1, [ new_sub ] );
					else
					socket.SDServiceMessage( 'Communication node is behind wall' );
				}
				else
				socket.SDServiceMessage( 'Communication node is too far' );
			}
			else
			socket.SDServiceMessage( 'Communication node no longer exists' );
		}
	});*/
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
	
		if ( !socket.character )
		return;
	
		if ( socket.character.is( sdPlayerSpectator ) && !socket.character._god )
		return;
	
		let _class = params[ 0 ];
		let net_id = params[ 1 ];
		
		if ( net_id !== undefined )
		{
			let ent = sdEntity.GetObjectByClassAndNetId( _class, net_id );
			if ( ent !== null && !ent._is_being_removed )
			{
				let allow = ent.AllowContextCommandsInRestirectedAreas( socket.character, socket );
				
				if ( allow instanceof Array )
				{
					allow = ( allow.indexOf( params[ 2 ] ) !== -1 );
				}
				
				if ( !allow )
				{
					if ( socket.character && socket.character._god )
					{
					}
					else
					if ( ent.IsInSafeArea() )
					{
						socket.SDServiceMessage( 'Entity is in restricted area' );
						return;
					}
				}
					
				ent.ExecuteContextCommand( params[ 2 ], params[ 3 ], socket.character, socket );
			}
			else
			{
				socket.SDServiceMessage( 'Entity no longer exists' );
			}
		}
	});
	/*socket.on('COM_UNSUB', ( net_id ) => { 
		
		if ( typeof net_id !== 'number' )
		return;
		
		if ( socket.character ) 
		if ( socket.character.hea > 0 ) 
		{
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdCom', net_id );
			if ( ent !== null )
			{
				ent.NotifyAboutNewSubscribers( 0, [ socket.character._net_id ] );
				ent.NotifyAboutNewSubscribers( 0, [ socket.character.biometry ] );
			}
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
				{
					if ( socket.character.canSeeForUse( ent ) )
					ent.NotifyAboutNewSubscribers( 0, [ net_id_to_kick ] );
					else
					socket.SDServiceMessage( 'Communication node is behind wall' );
				}
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
			//let net_id_to_get = arr[ 1 ];
			let slot = arr[ 1 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdStorage', net_id );
			if ( ent !== null && !ent._is_being_removed )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdStorage.access_range ) >= 0 )
				{
					if ( socket.character.canSeeForUse( ent ) )
					ent.ExtractItem( slot, socket.character );
					else
					socket.SDServiceMessage( 'Can\'t get items through walls' );
				}
				else
				socket.SDServiceMessage( 'Storage is too far' );
			}
			else
			socket.SDServiceMessage( 'Storage no longer exists' );
		}
	});*/
	/*socket.on('UPGRADE_STAT', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( !socket.character )
		return;
	
		if ( socket.character.is( sdPlayerSpectator ) && !socket.character._god )
		return;
	
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdUpgradeStation', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdStorage.access_range ) >= 0 )
				{
					if ( socket.character.build_tool_level > ent.level )
					{
						if ( ent.matter >= 5000 )
						ent.UpgradeStation( socket.character );
						else
						socket.SDServiceMessage( 'Upgrade station needs at least 5000 matter!' );
					}
					else
					socket.SDServiceMessage( 'You need a bigger build tool level!' );
				}
				else
				socket.SDServiceMessage( 'Upgrade station is too far' );
			}
			else
			socket.SDServiceMessage( 'Upgrade station no longer exists' );
		}
	});
	*/
	/*socket.on('UPGRADE_GET_EQUIP', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( !socket.character )
		return;
	
		if ( socket.character.is( sdPlayerSpectator ) && !socket.character._god )
		return;
	
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
	*/
	/*socket.on('UPGRADE_CHAR', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( !socket.character )
		return;
	
		if ( socket.character.is( sdPlayerSpectator ) && !socket.character._god )
		return;
	
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
	*/
	/*socket.on('CRYSTAL_COMBINE', ( arr ) => { 
		
		if ( !( arr instanceof Array ) )
		return;
	
		if ( !socket.character )
		return;
	
		if ( socket.character.is( sdPlayerSpectator ) && !socket.character._god )
		return;
	
		if ( socket.character.hea > 0 ) 
		{
			let net_id = arr[ 0 ];
			let ent = sdEntity.GetObjectByClassAndNetId( 'sdCrystalCombiner', net_id );
			if ( ent !== null )
			{
				if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, 64 ) >= 0 )
				{
					//if ( ent.crystals === 2 )
					if ( ent.crystal0 && ent.crystal1 )
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
	});*/
	
	socket.CharacterDisconnectLogic = ()=>
	{
		if ( socket.character )
		{
			if ( sdWorld.server_config.onDisconnect )
			sdWorld.server_config.onDisconnect( socket.character, 'disconnected' );
			
			if ( socket.character.title.indexOf( 'Disconnected ' ) !== 0 )
			socket.character.title = 'Disconnected ' + socket.character.title;

			//socket.character._old_score = socket.score;

			if ( DEBUG_SOCKET_CHANGES )
			trace( 'characters['+socket.character._net_id + ']._socket = null');

			socket.character._socket = null;
			
			if ( socket.character.is( sdPlayerSpectator ) )
			socket.character.remove();

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
		
			socket.observed_entities = VoidArray;
			socket.sd_events = VoidArray;
			socket.known_statics_versions_map2 = VoidArray;
			socket.known_non_removed_dynamics = VoidArray;
			socket.lost_messages = VoidArray;
			socket.sent_messages = VoidArray;
			
			socket.byte_shifter.onRemove();
			socket.byte_shifter = null;
		
			UpdateOnlineCount();
			
		},0);
	});
	//socket.emit( 'hi' );
});

io.on("reconnect", (socket) => {
  // ...
  debugger;
});

if ( sdWorld.server_config.port )
{
	( httpsServer ? httpsServer : httpServer ).listen( sdWorld.server_config.port, () =>
	{
		console.log('listening on *:' + ( sdWorld.server_config.port ) + ' (port was set by server_config file)' );
	});
}
else
{
	( httpsServer ? httpsServer : httpServer ).listen( port0 + world_slot, () =>
	{
		console.log('listening on *:' + ( port0 + world_slot ) );
	});
}

import os from 'os';

const RunWorkerService = ( WorkerData )=>
{
    return new Promise( ( resolve, reject )=>
	{
        // import script..
		
		
    
        const worker = new Worker( __dirname + '/game/server/worker_service.js', { WorkerData });
        worker.on('message', ( data )=>{
			
			worker.is_busy = false;
			
			if ( worker.next_callback )
			worker.next_callback( data );
		} );
        worker.on('error', reject );
        worker.on('exit', ( code )=>
		{
            if ( code !== 0 )
			{
                reject(new Error(`Worker ${ WorkerData } stopped with ${ code } exit code`));
			}
        });
		
		worker.is_busy = false;
		
		worker.next_callback = ( data )=>
		{ 
			resolve( worker ); 
		};
		
		worker.Execute = ( command, callback=null )=>
		{
			if ( !worker.is_busy )
			{
				worker.is_busy = true;
				
				worker.postMessage( command );
				worker.next_callback = callback;
			}
			else
			throw new Error('Worker is busy');
		};
    });
};

let cpu_cores = os.cpus().length;

//cpu_cores = 0; // Hack
//console.warn( 'HACK: cpu_cores = 0' );

let worker_services = [];

trace( 'Starting '+(~~(Math.max( 0, Math.min( cpu_cores * 0.8 ) )))+' extra threads for parallel tasks (compression). Total CPU cores: ' + cpu_cores );
for ( let i = 0; i < Math.max( 0, Math.min( cpu_cores * 0.8 ) ); i++ ) // Leave some space for GC?
{
	// Some Node.js versions seem to be unable to handle await at top-level so wrapping these into function (for a short period of time worker_services will be empty and main thread will handle all snapshot compressions/tasks)
	(async ()=>
	{
		
		worker_services.push( await RunWorkerService( 'Worker #'+i ) );
		//trace('Started worker thread #'+i);
		
	})();
}
globalThis.StopAllWorkers = ()=> // Probably not needed
{
	/*
	for ( let i = 0; i < worker_services.length; i++ )
	{
		worker_services[ i ].is_busy = false;
		worker_services[ i ].Execute({ action: WorkerServiceLogic.ACTION_EXIT });
	}*/
};
/*

	To disable workers:
		
	globalThis.ExecuteParallel = ( command, callback )=>
	{
		WorkerServiceLogic.HandleCommand( command, callback );
	};

*/
globalThis.ExecuteParallel = ( command, callback )=>
{
	for ( let i = 0; i < worker_services.length; i++ )
	{
		if ( !worker_services[ i ].is_busy )
		{
			worker_services[ i ].Execute( command, callback );
			return;
		}
	}
	WorkerServiceLogic.HandleCommand( command, callback );
};
globalThis.ExecuteParallelPromise = ( command )=>
{
	let p = new Promise( ( resolve, reject )=>
	{
		/*setTimeout(() => {
		  resolve('foo');
		}, 300);*/
		
		globalThis.ExecuteParallel( command, resolve );

		//resolve( data );
	});
	
	
	
	
	return p;
};

let only_do_nth_connection_per_frame = 1;
let nth_connection_shift = 0;

//let current_snapshot_scan_id = 0;

let vision_cells_cache = {};

/*let perf_test_scan_method = 0;
let perf_test_scan_method_iters_left = 15;
let perf_test_scan_method_results = [ 0, 0 ];

globalThis.perf_test_scan_method_results = perf_test_scan_method_results;*/

// This will prevent stacking of interal calls, letting server to actually handle all received data from clients
const ServerMainMethod = ()=>
{
	//console.log( 'game_ttl', game_ttl );
	
	let ttt = Date.now();
	
	/*let bbb;
	while ( Date.now() < ttt + 40 )
	{
		bbb = Math.random();
	}*/
	
	if ( IsGameActive() )
	{
		game_ttl--;
		
		sdWorld.HandleWorldLogic( frame );
							
		const CHUNK_SIZE = sdWorld.CHUNK_SIZE;
		
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

		sdSnapPack.ClearCache();
		
		sdEntity.removed_entities_info.forEach( ( info, net_id )=>
		{
			if ( sdWorld.time > info.ttl )
			sdEntity.removed_entities_info.delete( net_id );
		});

		//sockets_array_locked = true;
		for ( let i = 0; i < sockets.length; i++ )
		{
			let socket = sockets[ i ]; // can disappear from array in the middle of loop
			
			/*if ( !SOCKET_IO_MODE )
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
			}*/

			if ( !socket.character || socket.character._is_being_removed )
			{
				if ( socket.post_death_spectate_ttl > 0 )
				socket.post_death_spectate_ttl--;
			}
			else
			socket.post_death_spectate_ttl = 60;
		
			//console.log( 'socket.post_death_spectate_ttl', socket.post_death_spectate_ttl );
					
			if ( socket.character && ( !socket.character._is_being_removed || socket.post_death_spectate_ttl > 0 ) )
			{
				if ( sdWorld.time > socket.last_sync + socket.max_update_rate )
				{
					socket.character.lag = !socket.client.conn.transport.writable;
				}
				/*
				
				if ( i % only_do_nth_connection_per_frame === nth_connection_shift )
				if ( sdWorld.time > socket.last_sync + socket.max_update_rate && socket.client.conn.transport.writable && sdWorld.time > socket.waiting_on_M_event_until ) // Buffering prevention?
				{
					if ( !socket.sync_busy )
					{
						const SyncDataToPlayer = async ()=>
						{
							//let previous_sync_time = socket.last_sync;

							socket.sync_busy = true;

							socket.last_sync = sdWorld.time;
							socket.waiting_on_M_event_until = sdWorld.time + 1000;

							var snapshot = [];
							var snapshot_only_statics = [];

							var observed_entities = [];

							var observed_entities_map = new Set();

							var observed_statics_map2 = new Set();

							socket._FixCameraPosition();


							// Copy Camera Bounds [ 2 / 2 ]
							let min_x = socket.camera.x - 800/2 / socket.camera.scale;
							let max_x = socket.camera.x + 800/2 / socket.camera.scale;

							let min_y = socket.camera.y - 400/2 / socket.camera.scale;
							let max_y = socket.camera.y + 400/2 / socket.camera.scale;


							min_x -= 32 * 3;
							min_y -= 32 * 3;
							max_x += 32 * 3;
							max_y += 32 * 3;

							const MaxCompleteEntitiesCount = 40; // 50 sort of fine for PC, but now for mobile


							const visited_ent_flag = sdEntity.GetUniqueFlagValue();
							
							
							const triggers_sync = !socket.character.is( sdPlayerSpectator ); // Also used for task sync

							const AddEntity = ( ent, forced )=>
							{
							
								//if ( //!meet_once.has( ent ) && 
									 //!meet_once2.has( ent._net_id ) )
								if ( ent._flag !== visited_ent_flag )
								{
									//meet_once.add( ent );
									//meet_once2.add( ent._net_id );
									ent._flag = visited_ent_flag;

									if ( ent.IsVisible === sdEntity.prototype.IsVisible || 
										 ent.IsVisible( socket.character ) )
									
									{

										if ( ent.is_static ) // 5.8
										{
											//observed_statics_map.add( ent ); // 16.6
											observed_statics_map2.add( ent._net_id ); // ?

											if ( snapshot.length < MaxCompleteEntitiesCount || forced )
											{
												//if ( socket.known_statics_versions_map.get( ent ) !== ent._update_version ) // known_statics_versions_map.get can be undefined which does not equals to _update_version ever. Faster than doing .has
												if ( socket.known_statics_versions_map2.get( ent._net_id ) !== ent._update_version ) // known_statics_versions_map.get can be undefined which does not equals to _update_version ever. Faster than doing .has
												{
													//socket.known_statics_versions_map.set( ent, ent._update_version );
													socket.known_statics_versions_map2.set( ent._net_id, ent._update_version );

													let snap = ent.GetSnapshot( frame, false, socket.character );
													snapshot.push( snap );
													snapshot_only_statics.push( snap );
												}
											}
										}
										else
										{
											observed_entities.push( ent );
											observed_entities_map.add( ent );
										}

										if ( ent.SyncedToPlayer !== sdEntity.prototype.SyncedToPlayer )
										if ( ent._frozen <= 0 )
										if ( triggers_sync )
										ent.SyncedToPlayer( socket.character );
								

										if ( ent.getRequiredEntities !== sdEntity.prototype.getRequiredEntities )
										{
											let ents = ent.getRequiredEntities();
											for ( let i = 0; i < ents.length; i++ )
											AddEntity( ents[ i ], true );
										}
									}
								}
							};

							const VisitCell = ( x, y )=>
							{
								let arr = sdWorld.RequireHashPosition( x, y ).arr;

								for ( let i2 = 0; i2 < arr.length; i2++ )
								{
									//let ent = arr[ i2 ];

									AddEntity( arr[ i2 ], false );
								}
							};
							
							
							if ( !socket.character._is_being_removed )
							{
								AddEntity( socket.character, false );
								
								if ( socket.character.driver_of )
								AddEntity( socket.character.driver_of, true );
								
								if ( socket.character.hook_relative_to )
								AddEntity( socket.character.hook_relative_to, true );
							}
						
							// Add player's tasks
							if ( socket.character )
							if ( triggers_sync )
							for ( let t = 0; t < sdTask.tasks.length; t++ )
							if ( sdTask.tasks[ t ]._executer === socket.character )
							if ( observed_entities.indexOf( sdTask.tasks[ t ] ) === -1 )
							//observed_entities.push( sdTask.tasks[ t ] );
							AddEntity( sdTask.tasks[ t ], false );

							let cells = vision_cells_cache[ socket.camera.scale ];

							if ( !cells )
							{
								//if ( socket.camera.scale !== 2 )
								//debugger; // Watch out for too many versions of ordered cells here... Round scale that is used there?

								vision_cells_cache[ socket.camera.scale ] = 
									cells = 
										[];
								

								//for ( let x = min_x; x < max_x; x += 32 )
								//for ( let y = min_y; y < max_y; y += 32 )
								for ( let x = min_x; x < max_x; x += CHUNK_SIZE )
								for ( let y = min_y; y < max_y; y += CHUNK_SIZE )
								{
									cells.push({ 
										x: x - min_x, 
										y: y - min_y, 
										dist: sdWorld.Dist2D( (min_x+max_x)/2, (min_y+max_y)/2, x, y )
										//last_trace: 0,
										//last_trace_result: false
									});
								}
								cells.sort((a,b)=>{
									return a.dist-b.dist;
								});

								for ( let c = 0; c < cells.length; c++ )
								delete cells[ c ].dist;
							}
							
							//const USE_SCAN_EVERYTHING_ON_SCREEN_METHOD = false;
							
							//let t0 = Date.now();
							
							const line_of_sight_mode = sdWorld.server_config.GetLineOfSightMode( socket.character );
							
							//if ( perf_test_scan_method === 0 )
							//if ( socket.character._god || socket.character.is( sdPlayerSpectator ) ) // Faster for god mode players as they see everything anyway
							if ( !line_of_sight_mode )
							{
								for ( let c = 0; c < cells.length; c++ )
								VisitCell( cells[ c ].x + min_x, cells[ c ].y + min_y );
							}
							else
							{
								// Cast vision beams? Better anti-cheat and perhaps better performance? // Works same and sometimes faster
								//const visited_cells = new Set();
								//current_snapshot_scan_id++;
								
								// At the end of a beam
								const extra_xy_spread = 64;
								const extra_xy_spread_step = 64;
								
								// Around beam while it travels
								const extra_xy_spread_middle = 64;
								const extra_xy_spread_middle_step = 64;
								
								if ( extra_xy_spread_step > CHUNK_SIZE )
								throw new Error('Might jump over chunk here...');
							
								const hitmap = new Map();
								
								function CheckRect( x, y )
								{
									x = sdWorld.FastFloor( x / 16 );
									y = sdWorld.FastFloor( y / 16 );
									
									let hash = x * 5000 + y;
									
									let r = hitmap.get( hash );
									
									if ( r === undefined )
									{
										r = sdWorld.CheckWallExists( x * 16 + 8, y * 16 + 8, null, null, null, sdWorld.FilterVisionBlocking );
										hitmap.set( hash, r );
									}
									
									return r;
								}
								
								
								const visited_hashes = new Set();
								
								for ( let b = 0; b < 32; b++ )
								{
									// TODO: Make beams at least casted down at first - it tends to discover cells clockwise and due to static entity limit per snapshot it will do this slowly
									
									let x = sdWorld.limit( min_x, socket.character.x, max_x );
									let y = sdWorld.limit( min_y, socket.character.y, max_y );
									
									const dx = Math.sin( b / 32 * Math.PI * 2 ) * 16;
									const dy = Math.cos( b / 32 * Math.PI * 2 ) * 16;

									//const dx = Math.sin( b / 64 * Math.PI * 2 ) * 31;
									//const dy = Math.cos( b / 64 * Math.PI * 2 ) * 31;
									
									let ttl = -1;

									while ( x >= min_x && x <= max_x && y >= min_y && y <= max_y )
									{
										if ( ttl === -1 )
										{
											if ( CheckRect( x, y ) )
											ttl = 0; // 10 seems enough in no xy-spread but this is not how clients see world
										}
										else
										if ( --ttl < 0 )
										break;
									
										//if ( Math.random() < 0.01 )
										//sdWorld.SendEffect({ x:x, y:y, type:sdEffect.TYPE_WALL_HIT });
										
										const extra_xy_spread_this = ( ttl === 0 ) ? extra_xy_spread : extra_xy_spread_middle;
										const extra_xy_spread_step_this = ( ttl === 0 ) ? extra_xy_spread_step : extra_xy_spread_middle_step;
										
										for ( let xx = -extra_xy_spread_this; xx <= extra_xy_spread_this; xx += extra_xy_spread_step_this )
										for ( let yy = -extra_xy_spread_this; yy <= extra_xy_spread_this; yy += extra_xy_spread_step_this )
										//let xx = 0;
										//let yy = 0;
										{
											const hash = ( sdWorld.FastFloor( (y+yy) / CHUNK_SIZE ) ) * 4098 + sdWorld.FastFloor( (x+xx) / CHUNK_SIZE );
											
											if ( visited_hashes.has( hash ) )
											{
											}
											else
											{
												visited_hashes.add( hash );
												
												const cell = sdWorld.RequireHashPosition( x+xx, y+yy );

												//if ( !visited_cells.has( cell ) ) // [ 48, 203 ] with this enabled
												//if ( cell.snapshot_scan_id !== current_snapshot_scan_id )
												{
													//visited_cells.add( cell );
													//cell.snapshot_scan_id = current_snapshot_scan_id;

													const arr = cell.arr;

													for ( let i2 = 0; i2 < arr.length; i2++ )
													AddEntity( arr[ i2 ], false );
												}
											}
										}

										x += dx;
										y += dy;
									}
								}
							}
							
							// Forget offscreen statics (and removed ones)
							//socket.known_statics_versions_map.forEach( ( value, key, map )=>
							socket.known_statics_versions_map2.forEach( ( value, net_id, map )=>
							{
								//if ( !observed_statics_map.has( key ) )
								//if ( !observed_statics_map2.has( key._net_id ) )
								if ( !observed_statics_map2.has( net_id ) )
								{
									let key = sdEntity.entities_by_net_id_cache_map.get( net_id );

									let snapshot_of_deletion;

									if ( key )
									{
									}
									else
									{
										let info = sdEntity.removed_entities_info.get( net_id );

										if ( info )
										key = info.entity;
										//else
										//console.log('Entity no longer exists in any array - no idea what break info to send...');
									}

									if ( key )
									{
										
										snapshot_of_deletion = { 
											_class: key.GetClass(), 
											_net_id: net_id,
											_is_being_removed: true,
											_broken: key._broken
										};
									}
									else
									{
										snapshot_of_deletion = { 
											_class: 'auto', 
											_net_id: net_id,
											_is_being_removed: true,
											_broken: false
										};
									}
									

									snapshot.push( snapshot_of_deletion );
									snapshot_only_statics.push( snapshot_of_deletion );

									//socket.known_statics_versions_map.delete( key );
									socket.known_statics_versions_map2.delete( net_id );
								}
							} );

							// Better handling of ._broken for dynamics
							socket.known_non_removed_dynamics.forEach( ( value, key, map )=>
							{
								if ( !observed_entities_map.has( key ) )
								{
									if ( key === socket.character || key === socket.character.driver_of )
									if ( !key._is_being_removed )
									return;

									let snapshot_of_deletion = { 
										_class: key.GetClass(), 
										_net_id: key._net_id,
										_is_being_removed: true,
										_broken: key._broken
									};
									snapshot.push( snapshot_of_deletion );
								}
							} );
							socket.known_non_removed_dynamics = observed_entities_map;


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
								leaders = [ sdWorld.leaders_global, GetPlayingPlayersCount() ];
							}

							let sd_events = [];

							if ( socket.sd_events.length > 100 )
							{
								//console.log('socket.sd_events overflow (last sync was ' + ( sdWorld.time - previous_sync_time ) + 'ms ago): ', socket.sd_events );

								//debugger;

								sockets[ i ].SDServiceMessage( 'Server: .sd_events overflow (' + socket.sd_events.length + ' events were skipped). Some sounds and effects might not spawn as result of that.' );

								socket.sd_events.length = 0;
							}

							while ( sd_events.length < 10 && socket.sd_events.length > 0 )
							sd_events.push( socket.sd_events.shift() );

							let leftovers_tot = Object.keys( socket.left_overs ).length;
							if ( leftovers_tot > 5000 )
							{
								if ( socket.character && socket.character.is( sdPlayerSpectator ) )
								{
									// Seems to happen more frequently for these, yet we probably should not care
								}
								else
								console.log('socket.left_overs.length = ' + leftovers_tot + '... giving up with resends' );
							
								socket.left_overs = {};
							}

							let v = 0;
							for ( let prop in socket.left_overs )
							{

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

										if ( socket.left_overs[ prop ]._is_being_removed && socket.known_statics_versions_map2.has( socket.left_overs[ prop ]._net_id ) )
										{
											// Bug fix? Prevent remove packet for still visible blocks
										}
										else
										{
											//console.log('Dropped packet entity was readded: ' + socket.left_overs[ prop ]._class + '['+socket.left_overs[ prop ]._net_id+']' );
											snapshot.push( socket.left_overs[ prop ] );
											snapshot_only_statics.push( socket.left_overs[ prop ] );
										}
										
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

							let promise_snapshot_compress = sdSnapPack.Compress( snapshot );
							let promise_sd_events_compress = globalThis.ExecuteParallelPromise({ action: WorkerServiceLogic.ACTION_LZW, data: JSON.stringify( sd_events ) });
							//LZW.lzw_encode( JSON.stringify( sd_events ) )

							//await Promise.all([ promise_snapshot_compress, promise_sd_events_compress ]);

							//debugger;

							let full_msg = [ 
								await promise_snapshot_compress, // 0
								socket.GetScore(), // 1
								LZW.lzw_encode( JSON.stringify( leaders ) ), // 2
								await promise_sd_events_compress, // 3
								//leaders, // 2
								//sd_events, // 3
								socket.character ? Math.round( socket.character._force_add_sx * 1000 ) / 1000 : 0, // 4
								socket.character ? Math.round( socket.character._force_add_sy * 1000 ) / 1000 : 0, // 5
								socket.character ? Math.max( -1, socket.character._position_velocity_forced_until - sdWorld.time ) : 0, // 6
								sdWorld.last_frame_time, // 7
								sdWorld.last_slowest_class, // 8
								socket.sent_messages_last, // 9
								line_of_sight_mode ? 1 : 0 // 10
							];
							
							// Await can happen after disconnection and full GC removal of any pointer on socket
							if ( !socket.connected )
							return;


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
								socket.sent_messages_last, // 9
								null // 10
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

							if ( socket.character )
							{
								socket.character._force_add_sx = 0;
								socket.character._force_add_sy = 0;
							}

							socket.observed_entities = observed_entities;
							
							if ( triggers_sync )
							if ( sdWorld.time > socket.next_reaction_to_seen_entity_time )
							if ( socket.character )
							{
								socket.next_reaction_to_seen_entity_time = sdWorld.time + 100;
								
								let i = ~~( Math.random() * observed_entities.length );
								if ( i < observed_entities.length )
								{
									socket.character.onSeesEntity( observed_entities[ i ] );
								}
							}

							socket.sync_busy = false;
						};

						SyncDataToPlayer();
					}
				}
				
				*/
			   
			   
				if ( i % only_do_nth_connection_per_frame === nth_connection_shift )
				if ( sdWorld.time > socket.last_sync + socket.max_update_rate && socket.client.conn.transport.writable && sdWorld.time > socket.waiting_on_M_event_until ) // Buffering prevention?
				socket.byte_shifter.SendSnapshot();

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
	
	sdMemoryLeakSeeker.ThinkNow();
	
	//setTimeout( ServerMainMethod, 50 );
	setTimeout( ServerMainMethod, Math.max( 5, sdWorld.logic_rate - ( Date.now() - ttt ) ) );
};

setTimeout( ServerMainMethod, sdWorld.logic_rate );

/*
process.on('exit', (code) => {
	
	console.log(`About to exit with code: ${code}`);
	heapdump.writeSnapshot( 'crashed.heapsnapshot' );
  
});*/
			
if ( sdWorld.server_config.make_server_public )
setInterval(
	()=>
	{
		if ( sdWorld.server_url )
		if ( sdWorld.server_url.indexOf( 'gevanni.com:3000' ) === -1 )
		{
			let names = [];
			
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			if ( sdWorld.sockets[ i ].character !== null )
			if ( sdWorld.sockets[ i ].character.hea > 0 )
			names.push( sdWorld.sockets[ i ].character.title );
			
			sdServerToServerProtocol.SendData(
				'https://www.gevanni.com:3000',
				{
					action: 'I exist!',
					url: sdWorld.server_url,
					online: sdWorld.sockets.length,
					playing: sdWorld.GetPlayingPlayersCount(),
					players: names
				},
				( response=null )=>
				{
					if ( response )
					trace( 'make_server_public response: ', response );
				}
			);
		}
	}, 
	1000 * 60 * 60 // Every hour
);

/*
let mem_crash_test = [];
setInterval(()=>{
	let len = mem_crash_test.length * 2 + 1;
	for ( let i = 0; i < len; i++ )
	mem_crash_test.push( JSON.stringify( sdWorld.toString() ) + i );
},1);
globalThis.mem_crash_test = mem_crash_test;*/
