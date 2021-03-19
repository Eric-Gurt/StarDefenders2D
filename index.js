
/* global globalThis, process */

// http://localhost:3000

/*

	TODO:

	- This could help for high latency cases: https://github.com/geckosio/geckos.io


 
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

import pkg from '@geckos.io/server'; // 
const geckos = pkg.default;

//import { Server } from "socket.io";

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

//debugger

const __dirname = ( isWin ) ? 
	path.resolve()
	: 
	'/home/admin/sd2d/';

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
	  }
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


import sdShop from './game/client/sdShop.js';

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

sdShop.init_class(); // requires plenty of classes due to consts usage

globalThis.sdWorld = sdWorld;
globalThis.sdShop = sdShop;
globalThis.sdModeration = sdModeration;

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

// Wider url catcher breaks socket?
app.get('/*', (req, res) => 
{
	//console.log( req.url );
	
	if ( req.url.indexOf('./') !== -1 || req.url.indexOf('/.') !== -1 )
	return;
	
	//if ( file_exists( __dirname + '/game' + req.url ) )
	//res.sendFile( __dirname + '/game' + req.url );
	//else
	//res.send( '404' );
	//
	
	var path = __dirname + '/game' + req.url;
	//var path = './game' + req.url;
	fs.access(path.split('?')[0], fs.F_OK, (err) => 
	{
		if (err) {
		  res.send( '404' );//console.error(err)
		  return;
		}
		res.sendFile( path );
		//file exists
	});

});


var sockets = [];
var sockets_by_ip = {}; // values are arrays (for easier user counting per ip)
//var sockets_array_locked = false;
sdWorld.sockets = sockets;








const snapshot_path_const = __dirname + '/star_defenders_snapshot.v';
const timewarp_path_const = __dirname + '/star_defenders_timewarp.v';
const moderation_data_path_const = __dirname + '/moderation_data.v';
const superuser_pass_path = __dirname + '/superuser_pass.v';

sdWorld.snapshot_path_const = snapshot_path_const;
sdWorld.timewarp_path_const = timewarp_path_const;
sdWorld.moderation_data_path_const = moderation_data_path_const;
sdWorld.superuser_pass_path = superuser_pass_path;

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
			base_ground_level1: sdWorld.base_ground_level1,
			base_ground_level2: sdWorld.base_ground_level2,
			entities: entities
		};

		for ( var i = 0; i < sdEntity.entities.length; i++ )
		entities.push( sdEntity.entities[ i ].GetSnapshot( frame, true ) );


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
		sockets[ i ].emit( 'SERVICE_MESSAGE', 'Server: Backup is being done!' );

		SaveSnapshot( snapshot_path_const, ( err )=>
		{
			for ( var i = 0; i < sockets.length; i++ )
			sockets[ i ].emit( 'SERVICE_MESSAGE', 'Server: Backup is compelte ('+(err?'Error!':'successfully')+')!' );
		});
	}, 1000 * 60 * 15 ); // Once per 15 minutes

	let termination_initiated = false;
	function onBeforeTurnOff()
	{
		if ( termination_initiated )
		return;
	
		termination_initiated = true;
		console.warn('SIGTERM signal received. Backup time?');
		
		for ( var i = 0; i < sockets.length; i++ )
		sockets[ i ].emit( 'SERVICE_MESSAGE', 'Server reboot: Game server got SIGTERM signal from operating system. Attempting to save world state...' );
	
		const proceed = ( err )=>{
			
			console.warn('SaveSnapshot called callback (error='+err+'), saying goodbye to everyone and quiting process.');
		
			is_terminating = true;
			
			for ( var i = 0; i < sockets.length; i++ )
			sockets[ i ].emit( 'SERVICE_MESSAGE', err ? 'Server reboot: Unable to save world snapshot...' : 'Server reboot: World snapshot has been saved! See you soon!' );
		
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
	sdWorld.base_ground_level1 = save_obj.base_ground_level1;
	sdWorld.base_ground_level2 = save_obj.base_ground_level2;
	
	let i;
	
	sdWorld.unresolved_entity_pointers = [];
	
	for ( i = 0; i < save_obj.entities.length; i++ )
	{
		try
		{
			sdEntity.GetObjectFromSnapshot( save_obj.entities[ i ] );
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

if ( sdWorld.world_bounds.x1 === 0 )
if ( sdWorld.world_bounds.x2 === 0 )
if ( sdWorld.world_bounds.y1 === 0 )
if ( sdWorld.world_bounds.y2 === 0 )
{
	console.log( 'Reinitializing world bounds' );
	sdWorld.ChangeWorldBounds( -16 * 10, -16 * 10, 16 * 10, 16 * 10 );
}

// World bounds shifter
//if ( false )
const world_edge_think_rate = 500;
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
				edge_cursious_ent[ i ]._socket.emit('SERVICE_MESSAGE', 'World can not be extended past this point - ' + blocking_by.join(', ') + ' is at the opposite edge of playable area' );
				else
				edge_cursious_ent[ i ]._socket.emit('SERVICE_MESSAGE', 'World can not be extended past this point - ' + blocking_by.join(', ') + ' are at the opposite edge of playable area' );
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
//}, world_edge_think_rate ); // Hack


/*if ( sdWorld.is_server )
{
	await new Promise(resolve => setTimeout(resolve, 10000));
}*/
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

function BadSpawn( x, y, entity=null )
{
	no_respawn_areas.push({
		x:x,
		y:y,
		radius:150,
		until: sdWorld.time + 1000 * 60 // 1 minute at area
	});
	
	if ( entity )
	no_respawn_areas.push({
		x:x,
		y:y,
		entity: entity,
		radius:250,
		until: sdWorld.time + 1000 * 60 * 5 // 5 minutes around entity that damaged
	});
}
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
		
		socket.sent_result_ok = 0;
		socket.sent_result_dropped = 0;
		
		socket.left_overs = {};
		socket.lost_messages = [];
		
		socket.sent_messages = new Map(); // { data: full_msg, time: sdWorld.time, arrived: false }
		socket.sent_messages_first = 0;
		socket.sent_messages_last = 0;
		
		socket.myDrop = ( drop ) => // { event, data }
		{
			
			/*if ( drop.reason !== 'DROPPED_FROM_BUFFERING' )
			{
				if ( sdWorld.time > next_drop_log )
				{	
					next_drop_log = sdWorld.time + 1000 * 60;
					console.log('Dropped packet: ', drop );
					debugger;
				}
			}
			else
			{
			}*/
			
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
					if ( drop.data[ 3 ][ i ][ 0 ] === 'EFF' && ( drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_CHAT || drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_BEAM || drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_EXPLOSION || drop.data[ 3 ][ i ][ 1 ].type === sdEffect.TYPE_BLOOD ) )
					socket.lost_messages.push( drop.data[ 3 ][ i ] );
				}
			}
		};
		
		const old_emit = socket.emit;
		socket.emit = ( event, action )=>
		{
			if ( event === 'RESv2' )
			{
				socket.sent_result_ok++;
			}
			
			old_emit.call( socket, event, action );
		};
		
		socket.client = { conn: { transport: { writable: true } } }; // Fake object just to keep main logic working
	}
	
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
	
	socket.score = 0;// + ~~( Math.random() * 10 );
	
	socket.post_death_spectate_ttl = 0;
	
	socket.SyncFFAWarning = ()=>
	{
		// Sync respawn blocks
		for ( var i = 0; i < sockets_by_ip[ ip ].length; i++ )
		{
			socket.respawn_block_until = Math.max( socket.respawn_block_until, sockets_by_ip[ ip ][ i ].respawn_block_until );
			socket.ffa_warning = Math.max( socket.ffa_warning, sockets_by_ip[ ip ][ i ].ffa_warning );
		}
	};
	
	socket.on('RESPAWN', ( player_settings ) => { 
		
		socket.SyncFFAWarning();
		
		if ( sdWorld.time < socket.respawn_block_until )
		{
			//socket.emit('SERVICE_MESSAGE', 'Respawn rejected - too quickly (wait ' + ( socket.respawn_block_until - sdWorld.time ) + 'ms)' );
			socket.emit('SERVICE_MESSAGE', 'Respawn rejected - too quickly (wait ' + Math.ceil( ( socket.respawn_block_until - sdWorld.time ) / 100 ) / 10 + ' seconds)' );
			return;
		}
		
		socket.my_hash = player_settings.my_hash;
		
		socket.sd_events = []; // Just in case? There was some source of 600+ events stacked, possibly during start screen waiting or maybe even during player being removed. Lots of 'C' events too
		
		//socket.respawn_block_until = sdWorld.time + 400;
		socket.respawn_block_until = sdWorld.time + 2000; // Will be overriden if player respawned near his command centre
		
		socket.post_death_spectate_ttl = 30;
		
		let old_score = socket.score;
		
		socket.score = 0;
		
		let character_entity = null;
		
		function RemoveOldPlayerOnSocket()
		{
			if ( socket.character )
			{
				socket.character.title = 'Disconnected ' + socket.character.title;

				/*if ( old_score <= 0 )
				{
					socket.character.remove();
				}
				else
				{*/
					if ( socket.character.hea > 0 )
					socket.character.Damage( socket.character.hea ); // With weapon drop
				//}

				socket.character._socket = null;

				socket.character = null;
			}
		}
		function SpawnNewPlayer()
		{
			character_entity = new sdCharacter({ x:0, y:0 });
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
							socket.emit('SERVICE_MESSAGE', 'Command Centre no longer exists' );
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
					
					for ( i = 0; i < no_respawn_areas.length; i++ )
					if ( sdWorld.inDist2D_Boolean( x, y, no_respawn_areas[ i ].x, no_respawn_areas[ i ].y, no_respawn_areas[ i ].radius ) )
					{
						bad_areas_near++;
						break;
					}

					if ( tr > max_tr * 0.6 || bad_areas_near === 0 )
					if ( tr > max_tr * 0.8 || ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) && !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) ) )
					if ( tr > max_tr * 0.4 || socket.command_centre || sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
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
								
								socket.emit('SERVICE_MESSAGE', 'Unable to respawn too close to Command Centre (possibly due to recent spawnkills near Command Center)' );
							}
							else
							socket.emit('SERVICE_MESSAGE', 'Unable to respawn near Command Centre (possibly due to recent spawnkills near Command Center)' );
								
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

						socket.score = character_entity._old_score;
						character_entity._old_score = 0;
					}
				}
			}
			
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
				socket.emit('SERVICE_MESSAGE', 'That is a long name, my friend' );
			}
		}
		else
		player_settings.hero_name = '?';
		
		TryToAssignDisconnectedPlayerEntity();
		
		if ( player_settings.full_reset )
		{
			RemoveOldPlayerOnSocket();
			SpawnNewPlayer();
			
			if ( typeof player_settings.my_hash === 'string' )
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
				'Each device uses its\' own slot represented with number.',
				'Slot 9 is a Build tool. Press 9 Key in order to activate build mode.',
				'Once you have selected slot 9, you can press Right Mouse button in order to enter build selection menu.',
				'In that menu you will find placeable entities such as walls and weapons as well as upgrades.',
				'On respawn you will lose all your upgrades.',
				'Jetpack ability can be activated by pressing W or Space mid-air.',
				'Grappling hook ability can be activated with Mouse Wheel click.',
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
					if ( sdWeather.only_instance._rain_ammount > 0 )
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


		socket.emit('SET sdWorld.my_entity', character_entity._net_id, { reliable: true, runs: 100 } );

		socket.emit('SET sdShop.options', sdShop.options, { reliable: true, runs: 100 } );

		sdEntity.entities.push( character_entity );
		
		const EarlyDamageTaken = ( character_entity, dmg, initiator )=>
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
		}, 5000 );

		socket.character = character_entity;
		
		if ( player_settings.full_reset )
		{
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
		}
		
	});
	
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
	
	socket.next_position_correction_allowed = 0;
	socket.on('M', ( arr ) => { // Position corrections. Cheating can happen here. Better solution could be UDP instead of TCP connections.
		if ( socket.character ) 
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
			//messages_to_report_arrival
			socket.character.look_x = arr[ 0 ]; 
			socket.character.look_y = arr[ 1 ];
			
			socket.camera.x = arr[ 2 ];
			socket.camera.y = arr[ 3 ];
			socket.camera.scale = arr[ 4 ];
			
			let messages_to_report_arrival = arr[ 8 ];
			
			for ( let i = 0; i < Math.min( 100, messages_to_report_arrival.length ); i++ )
			{
				let id = messages_to_report_arrival[ i ];
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
	});
	
	socket.on('SELF_EXTRACT', ( net_id ) => { 
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
			
			/*if ( socket.score > 0 )
			{
				socket.character._socket = null;
				socket.character = null;
			}
			else
			{
				socket.character.remove();
				socket.character._socket = null;
				socket.character = null;
			}*/
			
			socket.score = 0;
		}
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
					socket.emit('SERVICE_MESSAGE', 'Respawn point unset' );
				}
				else
				socket.emit('SERVICE_MESSAGE', 'Respawn point was\'t set yet (can be set at any nearby Command Centre)' );
			}
			else
			{
				let ent = sdEntity.GetObjectByClassAndNetId( 'sdCommandCentre', net_id );
				if ( ent !== null )
				{
					if ( sdWorld.inDist2D( socket.character.x, socket.character.y, ent.x, ent.y, sdCom.action_range_command_centre ) >= 0 )
					{
						socket.command_centre = ent;
						socket.emit('SERVICE_MESSAGE', 'Respawn point set' );
					}
					else
					socket.emit('SERVICE_MESSAGE', 'Command Centre is too far' );
				}
				else
				{
					socket.emit('SERVICE_MESSAGE', 'Command Centre no longer exists' );
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
				socket.emit('SERVICE_MESSAGE', 'Communication node is too far' );
			}
			else
			socket.emit('SERVICE_MESSAGE', 'Communication node no longer exists' );
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
			socket.emit('SERVICE_MESSAGE', 'Communication node no longer exists' );
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
				socket.emit('SERVICE_MESSAGE', 'Communication node is too far' );
			}
			else
			socket.emit('SERVICE_MESSAGE', 'Communication node no longer exists' );
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
				socket.emit('SERVICE_MESSAGE', 'Storage is too far' );
			}
			else
			socket.emit('SERVICE_MESSAGE', 'Storage no longer exists' );
		}
	});
	
	socket.CharacterDisconnectLogic = ()=>
	{
		if ( socket.character )
		{
			socket.character.title = 'Disconnected ' + socket.character.title;

			socket.character._old_score = socket.score;

			socket.character._socket = null;

			socket.character = null;

			socket.score = 0;
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


//http.listen(3000, () =>
( httpsServer ? httpsServer : httpServer ).listen(3000, () =>
{
	console.log('listening on *:3000');
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
					if ( socket.sent_result_dropped / socket.sent_result_ok > 0.2 )
					socket.max_update_rate = Math.min( 200, socket.max_update_rate + 16 );
				
					if ( socket.sent_result_dropped / socket.sent_result_ok <= 0.005 )
					socket.max_update_rate = Math.max( 16, socket.max_update_rate - 1 );
						
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
				if ( sdWorld.time > socket.last_sync + socket.max_update_rate && socket.client.conn.transport.writable ) // Buffering prevention?
				{
					let previous_sync_time = socket.last_sync;
					
					socket.last_sync = sdWorld.time;

					var snapshot = [];

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
					
					const MaxCompleteEntitiesCount = 50;
					
					//let random_upgrade_for = [];

					for ( var x = min_x; x < max_x; x += 32 )
					for ( var y = min_y; y < max_y; y += 32 )
					{
						var arr = sdWorld.RequireHashPosition( x, y );
						for ( var i2 = 0; i2 < arr.length; i2++ )
						if ( arr[ i2 ].IsVisible( socket.character ) )
						{
							if ( arr[ i2 ].is_static )
							{
								//observed_statics.push( arr[ i2 ] );
								observed_statics_map.add( arr[ i2 ] );

								/*var pos_in_known = socket.known_statics.indexOf( arr[ i2 ] );

								if ( pos_in_known === -1 )
								{
									socket.known_statics.push( arr[ i2 ] );
									socket.known_statics_versions.push( arr[ i2 ]._update_version );

									snapshot.push( arr[ i2 ].GetSnapshot( frame ) );
								}
								else
								{
									if ( socket.known_statics_versions[ pos_in_known ] !== arr[ i2 ]._update_version )
									snapshot.push( arr[ i2 ].GetSnapshot( frame ) ); // Update actually needed
								}*/
								
								if ( socket.known_statics_versions_map.has( arr[ i2 ] ) )
								{
									if ( socket.known_statics_versions_map.get( arr[ i2 ] ) !== arr[ i2 ]._update_version && snapshot.length < MaxCompleteEntitiesCount )
									snapshot.push( arr[ i2 ].GetSnapshot( frame ) ); // Update actually needed
									//else
									//random_upgrade_for.push( arr[ i2 ] );
								}
								else
								if ( snapshot.length < MaxCompleteEntitiesCount )
								{
									//socket.known_statics_map.set( arr[ i2 ], arr[ i2 ] );
									socket.known_statics_versions_map.set( arr[ i2 ], arr[ i2 ]._update_version );

									snapshot.push( arr[ i2 ].GetSnapshot( frame ) );
								}
								//else
								//random_upgrade_for.push( arr[ i2 ] );
							}
							else
							observed_entities.push( arr[ i2 ] );

							arr[ i2 ].SyncedToPlayer( socket.character );
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
					snapshot.push( sdEntity.global_entities[ i2 ].GetSnapshot( frame ) );

					for ( var i2 = 0; i2 < observed_entities.length; i2++ )
					if ( !observed_entities[ i2 ].IsGlobalEntity() ) // Global entities are already sent few lines above
					snapshot.push( observed_entities[ i2 ].GetSnapshot( frame ) );
				
					//var isTransportWritable = socket.io.engine && socket.io.engine.transport && socket.io.engine.transport.writable;
					//console.log( isTransportWritable );
					
					//socket.broadcast.emit( snapshot );
					
					//socket.emit('RES', snapshot );

					//socket.emit('SCORE', socket.score );
					
					let leaders = null;
					
					if ( sdWorld.time > socket.last_sync_score + 5000 )
					{
						socket.last_sync_score = sdWorld.time;

						//socket.emit('LEADERS', [ sdWorld.leaders, GetPlayingPlayersCount() ] );
						leaders = [ sdWorld.leaders, GetPlayingPlayersCount() ];
					}
					
					let sd_events = [];
					
					if ( socket.sd_events.length > 100 )
					{
						//console.log('socket.sd_events overflow (last sync was ' + ( sdWorld.time - previous_sync_time ) + 'ms ago): ', socket.sd_events );
						
						sockets[ i ].emit( 'SERVICE_MESSAGE', 'Server: .sd_events overflow (' + socket.sd_events.length + ' events were skipped). Some sounds and effects might not spawn as result of that.' );
						
						socket.sd_events.length = 0;
					}
					
					while ( sd_events.length < 10 && socket.sd_events.length > 0 )
					sd_events.push( socket.sd_events.shift() );
				
					let leftovers_tot = Object.keys( socket.left_overs ).length;
					if ( leftovers_tot > 10000 )
					{
						console.log('socket.left_overs.length = ' + leftovers_tot + '... giving up with resends' );
						socket.left_overs = {};
					}
				
					for ( let m = socket.sent_messages_first; m < socket.sent_messages_last; m++ )
					{
						let msg = socket.sent_messages.get( m );
						if ( !msg.arrived )
						if ( msg.time < sdWorld.time - 350 )
						{
							socket.myDrop({ event:'RESv2', data:msg.data }); // { event, data }
							
							msg.arrived = true; // Prevent resend
						}
					}
				
					let v = 0;
					for ( let prop in socket.left_overs )
					{
						let possibly_ent = sdEntity.entities_by_net_id_cache[ socket.left_overs[ prop ]._net_id ];
						
						if ( possibly_ent && !possibly_ent.is_static )
						{
							//console.log('Dropped packet entity is not static, skip: ' + possibly_ent.GetClass() + '['+possibly_ent._net_id+']' );
							continue;
						}
					
						let found = false;
					
						for ( let s = 0; s < snapshot.length; s++ )
						if ( snapshot[ s ]._net_id === socket.left_overs[ prop ]._net_id )
						{
							delete socket.left_overs[ prop ];
							
							//console.log('Dropped packet entity was already in snapshot: ' + snapshot[ s ]._class + '['+snapshot[ s ]._net_id+']' );
							found = true;
							break;
						}

						if ( !found )
						{
							if ( v <= leftovers_tot * 0.05 )
							{
								//console.log('Dropped packet entity was readded: ' + socket.left_overs[ prop ]._class + '['+socket.left_overs[ prop ]._net_id+']' );
								snapshot.push( socket.left_overs[ prop ] );
								delete socket.left_overs[ prop ];

								v++;
							}
							//if ( v > leftovers_tot * 0.05 )
							//break;
						}
						
						//delete socket.left_overs[ prop ];
					}
					
					for ( let s = 0; s < Math.min( 3, socket.lost_messages.length ); s++ )
					{
						sd_events.push( socket.lost_messages.shift() );
					}
					
					let full_msg = [ 
						snapshot, // 0
						socket.score, // 1
						leaders, // 2
						sd_events, // 3
						socket.character._force_add_sx, // 4
						socket.character._force_add_sy, // 5
						Math.max( -1, socket.character._position_velocity_forced_until - sdWorld.time ), // 6
						sdWorld.last_frame_time, // 7
						sdWorld.last_slowest_class, // 8
						socket.sent_messages_last // 9
					];
					
					//socket.sent_messages = new Map();
					//socket.sent_messages_first = 0;
					//socket.sent_messages_last = 0;
					
					socket.sent_messages.set( socket.sent_messages_last++, { data: full_msg, time: sdWorld.time, arrived: false } );
					
					// Forget too old messages
					while ( socket.sent_messages.get( socket.sent_messages_first ).time < sdWorld.time - 10000 )
					socket.sent_messages.delete( socket.sent_messages_first++ );
					
					//for ( let g = 0; g < 25; g++ )
					//if ( Math.random() < 0.9 )
					socket.compress( true ).emit('RESv2', full_msg );
					
					socket.character._force_add_sx = 0;
					socket.character._force_add_sy = 0;

					socket.observed_entities = observed_entities;
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