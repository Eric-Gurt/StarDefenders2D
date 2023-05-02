
/* global process, globalThis */
/*

	TODO: Recursively demote all admins that were promoted by demoted admin.

*/

import fs from 'fs';
//import fs from 'fs-extra';

import sdWorld from '../sdWorld.js';
import sdEntity from '../entities/sdEntity.js';
import sdGun from '../entities/sdGun.js';
import sdWater from '../entities/sdWater.js';
import sdRescueTeleport from '../entities/sdRescueTeleport.js';
import sdDeepSleep from '../entities/sdDeepSleep.js';


import { spawn } from 'child_process';

class sdModeration
{
	static init_class()
	{
		// JSON it to save
		sdModeration.data = {
			admins: [
				// { my_hash, access_level, pseudonym, promoter_hash } // lower access_level - more rights // promoter_hash can be null for first admin
			],
			ban_ips: {}, // Obsolete? Use DB bans instead
			ban_passwords: {}, // Obsolete? Use DB bans instead
			// xxx: { until, reason, pseudonym, time } // not working yet
		};
		sdModeration.ever_loaded = false;
		
		sdModeration.non_admin_commands = [ 'help', '?', 'commands', 'listadmins', 'selfpromote', 'connection', 'kill' ];
		
		sdModeration.admin_commands = [ 'commands', 'listadmins', 'announce', 'quit', 'restart', 'save', 'restore', 'fullreset', 'god', 'scale', 'admin', 'boundsmove', 'db', 'database' ];
		
		// Fake socket that can be passed instead of socket to force some commands from world logic
		sdModeration.superuser_socket = {
			SDServiceMessage: ( t )=>{ console.log( 'superuser_socket.SDServiceMessage(...): ' + t ) },
			my_hash: null
		};
		
		sdModeration.bad_words = [];
		
		sdModeration.Load();
	}
	
	static Save()
	{
		fs.writeFile( sdWorld.moderation_data_path_const, JSON.stringify( sdModeration.data ), ( err )=>{});
	}
	
	static Load( timeout=5000 )
	{
		try
		{
			if ( globalThis.file_exists( sdWorld.moderation_data_path_const ) )
			{
				let potential = JSON.parse( fs.readFileSync( sdWorld.moderation_data_path_const ) );
				
				if ( typeof potential === 'object' && typeof potential.admins === 'object' && typeof potential.ban_ips === 'object' && typeof potential.ban_passwords === 'object' )
				sdModeration.data = potential;
				else
				throw new Error('Bad JSON object property types');
			}
			else
			sdModeration.Save();
			
			sdModeration.ever_loaded = true;
		}
		catch( e )
		{
			debugger;
			
			setTimeout( ()=>
			{
				for ( let i = 0; i < sdWorld.sockets.length; i++ )
				sdWorld.sockets[ i ].SDServiceMessage( 'Server: Moderation has been disabled due to access file read error. Type /retry to try again.' );
			
			}, timeout );
		}
		
		if ( sdWorld.server_config.apply_censorship || sdWorld.server_config.apply_censorship === undefined )
		{
			if ( globalThis.file_exists( sdWorld.censorship_file_path ) )
			{
				try
				{
					let bad_words = fs.readFileSync( sdWorld.censorship_file_path ).toString().split( '\r' ).join('').split( '\n' );

					for ( let i = 0; i < bad_words.length; i++ )
					sdModeration.bad_words.push( [ 
						sdModeration.SpecialsReplaceWithLatin( bad_words[ i ].split( ' // ' )[ 0 ] ), 
						parseFloat( bad_words[ i ].split( ' // ' )[ 1 ] )
					] );
				
					trace( 'Censorship file loaded: ' + bad_words.length + ' lines' );
				}
				catch( e )
				{
					console.warn( 'Bad words could not be loaded. Error: ', e );
				}
			}
			else
			if ( sdWorld.server_config.apply_censorship )
			trace( 'Censorship file does not exist' );
		}
	}
	static SpecialsReplaceWithLatin( s )
	{
		s = s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
		
		s = s.split('е').join('e');
		s = s.split('і').join('i');
		s = s.split('ї').join('i');
		s = s.split('о').join('o');
		s = s.split('р').join('p');
		
		return s;
	}
	static IsPhraseBad( phrase, coming_from_socket=null )
	{
		// Note: Delay any kicks as it sometimes executed within loops of socket arrays
		
		//trace( '------IsPhraseBad', phrase );
		
		if ( sdWorld.server_config.apply_censorship || sdWorld.server_config.apply_censorship === undefined )
		{
			//trace( 'Checking words', sdModeration.bad_words.length );
			
			let phrase_raw_lower_case = ' ' + ( phrase.toLowerCase ) + ' ';
			phrase = ' ' + sdModeration.SpecialsReplaceWithLatin( phrase ) + ' ';

			for ( let i = 0; i < sdModeration.bad_words.length; i++ )
			{
				if ( phrase.indexOf( sdModeration.bad_words[ i ][ 0 ] ) !== -1 ||
					 phrase_raw_lower_case.indexOf( sdModeration.bad_words[ i ][ 0 ] ) !== -1 )
				{
					// Potentially tracking IPs and lowering reaction level would make sense against some obsessed people, hopefully there won't be any
					
					if ( sdModeration.bad_words[ i ][ 1 ] < 0.15 ) // In current implementation some words can be ignored since they can be mean but not exactly worthy censoring
					{
						// Low tier phrases should prevent higher tier to react to them
						phrase = phrase.split( sdModeration.bad_words[ i ][ 1 ] ).join( ' ' );
						phrase_raw_lower_case = phrase_raw_lower_case.split( sdModeration.bad_words[ i ][ 1 ] ).join( ' ' );
						//trace( 'Partially found', i, ' -- ', sdModeration.bad_words[ i ][ 0 ], ' -- ', sdModeration.bad_words[ i ][ 1 ] );
					}
					else
					{
						//trace( 'Found bad word' );
						/*if ( coming_from_socket )
						{
							coming_from_socket.muted_until = sdWorld.time + ( sdWorld.server_config.censorship_mute_duration !== undefined ? sdWorld.server_config.censorship_mute_duration : 5000 );
						}*/
						return 1;
					}
				}
			}
		}
		//trace( 'It is fine' );
		return 0;
	}
	
	static GetAdminRowByHash( hash )
	{
		if ( hash !== null )
		for ( var a = 0; a < sdModeration.data.admins.length; a++ )
		if ( sdModeration.data.admins[ a ].my_hash === hash )
		return sdModeration.data.admins[ a ];
		
		return null;
	}
	static GetAdminRow( socket )
	{
		return sdModeration.GetAdminRowByHash( socket.my_hash );
	}
	
	static CommandReceived( socket, text )
	{
		text = text.substring( 1 ); // Skip /
		
		var parts = text.split(' ');
		
		if ( !sdModeration.ever_loaded )
		if ( parts[ 0 ] !== 'retry' )
		{
			socket.SDServiceMessage( 'Server: Moderation has been disabled due to access file read error. Type /retry to try again.' );
			return;
		}

		let my_admin_row = null;

		let is_non_admin = false;
		
		if ( socket !== sdModeration.superuser_socket )
		{
			if ( socket.my_hash === null )
			{
				socket.SDServiceMessage( 'Server: No permissions for unknown user.' );
				return;
			}
			
			my_admin_row = sdModeration.GetAdminRow( socket );
			/*
			for ( var a = 0; a < sdModeration.data.admins.length; a++ )
			{
				if ( sdModeration.data.admins[ a ].my_hash === socket.my_hash )
				{
					my_admin_row = sdModeration.data.admins[ a ];
					break;
				}
			}*/

			if ( !my_admin_row )
			{
				is_non_admin = ( sdModeration.non_admin_commands.indexOf( parts[ 0 ] ) !== -1 );

				if ( sdModeration.ever_loaded )
				{
					if ( !is_non_admin )
					{
						socket.SDServiceMessage( 'Server: No permissions.' );
						return;
					}
				}
			}
			else
			{
				is_non_admin = false;
			}
		}
		
		let allowed_commands = sdModeration.admin_commands;
		
		if ( my_admin_row )
		if ( my_admin_row.access_level > 0 )
		{
			allowed_commands = sdWorld.server_config.allowed_non_full_access_level_admin_commands;
			
			if ( sdModeration.non_admin_commands.indexOf( parts[ 0 ] ) === -1 )
			if ( allowed_commands.indexOf( parts[ 0 ] ) === -1 )
			{
				socket.SDServiceMessage( 'Server: No permissions according to allowed_non_full_access_level_admin_commands server config file value. Type /help for list of allowed commands.' );
				return;
			}
		}
		
		// Anything below won't execute without admin permission, except for selfpromote. Nothing will also be executed if moderation data wasn't loaded yet or failed to load.
		
		if ( parts[ 0 ] === 'selfpromote' )
		{
			if ( sdModeration.data.admins.length === 0 )
			{
				if ( socket.my_hash && socket.character )
				{
					if ( !globalThis.file_exists( sdWorld.superuser_pass_path ) )
					{
						fs.writeFileSync( sdWorld.superuser_pass_path, 'pass' + 
							Math.floor( 1000000000000000 + Math.random() * 8007199254740991 ) + 
							Math.floor( 1000000000000000 + Math.random() * 8007199254740991 ) + 
							Math.floor( 1000000000000000 + Math.random() * 8007199254740991 )
						);
					}
					
					let pass = fs.readFileSync( sdWorld.superuser_pass_path ).toString();
					
					if ( pass && pass === parts[ 1 ] )
					{
						sdModeration.data.admins.push( { my_hash: socket.my_hash, access_level: 0, pseudonym: socket.character.title, promoter_hash: null } );
						sdModeration.Save();
						socket.SDServiceMessage( 'Server: You are a first admin now! That password won\'t work while at least one admin exists.' );
					}
					else
					socket.SDServiceMessage( 'Server: Wrong password. Open superuser_pass.v in Notepad, select everything, press Ctrl+C, and then type here "/selfpromote pass..." (Ctrl+V to paste).' );
				}
				else
				socket.SDServiceMessage( 'Server: No hash or no character found.' );
			}
			else
			socket.SDServiceMessage( 'Server: First admin already exists.' );
		}
		else
		if ( parts[ 0 ] === 'retry' )
		{
			sdModeration.Load( 0 );
		}
		/*else
		if ( parts[ 0 ] === 'myid' || parts[ 0 ] === 'id' )
		{
			if ( socket.character )
			{
				socket.character.Say( 'My _net_id is ' + socket.character._net_id );
				
			}
		}
		else Moved to '/admin' or '/a' command
		if ( parts[ 0 ] === 'promote' || parts[ 0 ] === 'demote' )
		{
			if ( parts[ 1 ] === 'undefined' )
			{
				if ( parts[ 0 ] === 'promote' )
				socket.SDServiceMessage( 'Usage example (replace 123 with number player says when types /myid ): /promote 123' );
				else
				socket.SDServiceMessage( 'Usage example (replace #5 with # and number that starts with # after executing /listadmins , _net_id will work too): /demote #5' );
			
				return;
			}
			let target = null;
			
			if ( typeof parts[ 1 ] === 'string' )
			if ( parts[ 1 ].length > 0 )
			{
				if ( parts[ 1 ].charAt( 0 ) === '#' ) // # means search in admin list
				{
					let id = ~~( parts[ 1 ].slice( 1 ) );
					
					if ( id < sdModeration.data.admins.length )
					{
						target = {
							my_hash: sdModeration.data.admins[ id ].my_hash,
							character: { title: sdModeration.data.admins[ id ].pseudonym },
							emit:()=>{},
						};
					}
				}
				else // In else case - lookup by _net_id
				{
					let id = ~~( parts[ 1 ] );

					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].my_hash )
					if ( sdWorld.sockets[ i ].character )
					if ( sdWorld.sockets[ i ].character._net_id === id )
					{
						target = sdWorld.sockets[ i ];
						break;
					}
				}
			}

			if ( target )
			{
				if ( parts[ 0 ] === 'promote' )
				{
					for ( let a = 0; a < sdModeration.data.admins.length; a++ )
					if ( sdModeration.data.admins[ a ].my_hash === target.my_hash )
					{
						if ( sdModeration.data.admins[ a ].access_level > my_admin_row.access_level + 1 )
						{
							sdModeration.data.admins[ a ].access_level = my_admin_row.access_level + 1;
							sdModeration.data.admins[ a ].promoter_hash = my_admin_row.my_hash;
							sdModeration.Save();
							socket.SDServiceMessage( 'Server: Already admin, access_level has been increased and promoter updated.' );
						}
						else
						socket.SDServiceMessage( 'Server: Already admin, can not increase access_level.' );

						return;
					}

					sdModeration.data.admins.push( { my_hash: target.my_hash, access_level: my_admin_row.access_level + 1, pseudonym: target.character.title, promoter_hash: my_admin_row.my_hash } );
					sdModeration.Save();
					socket.SDServiceMessage( 'Server: ' + target.character.title + ' has been promoted to admin with access level ' + ( my_admin_row.access_level + 1 ) + ' (higher = less permissions).' );
					target.SDServiceMessage( 'Server: ' + target.character.title + ' has been promoted to admin with access level ' + ( my_admin_row.access_level + 1 ) + ' (higher = less permissions).' );
				}
				else
				if ( parts[ 0 ] === 'demote' )
				{
					for ( let a = 0; a < sdModeration.data.admins.length; a++ )
					if ( sdModeration.data.admins[ a ].my_hash === target.my_hash )
					{
						if ( sdModeration.data.admins[ a ].access_level > my_admin_row.access_level || sdModeration.data.admins[ a ].my_hash === socket.my_hash )
						{
							sdModeration.data.admins.splice( a, 1 );
							a--;
							sdModeration.Save();
							
							target.character._god = false;
							socket.SDServiceMessage( 'Server: ' + target.character.title + ' has been demoted.' );
							return;
						}
						else
						{
							socket.SDServiceMessage( 'Server: ' + target.character.title + ' has higher or equal access level ' + ( sdModeration.data.admins[ a ].access_level ) + '. Your is ' + my_admin_row.access_level + ' (higher = less permissions).' );
							return;
						}
					}
					target.character._god = false;
					socket.SDServiceMessage( 'Server: ' + target.character.title + ' had no admin permissions.' );
				}
			}
			else
			{
				socket.SDServiceMessage( 'Server: Unable to find target' );
			}
		}*/
		else
		if ( parts[ 0 ] === 'commands' || parts[ 0 ] === 'help' || parts[ 0 ] === '?' )
		{
			if ( is_non_admin )
			socket.SDServiceMessage( 'Supported commands: /' + sdModeration.non_admin_commands.join(', /') );
			else
			socket.SDServiceMessage( 'Supported commands: /' + allowed_commands.join(', /') );
		}
		else
		if ( parts[ 0 ] === 'announce' )
		{
			let rest_text = parts.slice( 1 ).join(' ');
			
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( socket.character )
				sdWorld.sockets[ i ].SDServiceMessage( 'Announcement from '+socket.character.title+': ' + rest_text );
				else
				sdWorld.sockets[ i ].SDServiceMessage( 'Announcement from '+my_admin_row.pseudonym+': ' + rest_text );
			}
		}
		else
		if ( parts[ 0 ] === 'listadmins' )
		{
			let out = [];
			for ( let a = 0; a < sdModeration.data.admins.length; a++ )
			out.push( '[ #'+a+' ]: ' + sdModeration.data.admins[ a ].pseudonym + '^' + sdModeration.data.admins[ a ].access_level );
			
			if ( out.length === 0 )
			socket.SDServiceMessage( 'No admins. Use /selfpromote to generate one-time-use password and then enter it like this: /selfpromote pass000' );
			else
			socket.SDServiceMessage( 'Admins: ' + out.join(',   ') );
		}
		else
		if ( parts[ 0 ] === 'quit' || parts[ 0 ] === 'shutdown' || parts[ 0 ] === 'exit' )
		{
			globalThis.StopAllWorkers();
			
			process.exit();
		}
		else
		if ( parts[ 0 ] === 'restart' || parts[ 0 ] === 'reboot' )
		{
			if ( parts[ 1 ] === 'nosave' || parts[ 1 ] === '0' )
			socket.SDServiceMessage( 'Server: Restarting... Without saving snapshot' );
			else
			socket.SDServiceMessage( 'Server: Restarting... Saving snapshot' );
		
			console.log( "This is pid " + process.pid + ' :: parts: ' + JSON.stringify( parts ) );
			
			const proceed = ( err )=>
			{		
				if ( parts[ 1 ] === 'nosave' || parts[ 1 ] === '0' )
				socket.SDServiceMessage( 'Server: Restarting... Snapshot saving ignored, goodbye!' );
				else
				socket.SDServiceMessage( 'Server: Restarting... Snapshot saved, goodbye!' );
				
				setTimeout( function () 
				{
					socket.SDServiceMessage( 'Server: Restarting... Terminating' );
				
					process.on( "exit", function () 
					{
						let args = process.argv;

						let arg0 = args.shift();

						let arg123 = ( globalThis.isWin ) ? [ '--inspect', args[ 0 ] ] : args;

						//console.log('CWD: ' + process.cwd() );

						//require( "child_process" ).spawn( process.argv.shift(), process.argv, 
						spawn( arg0, arg123, 
						{
							cwd: process.cwd(),
							detached: true,
							stdio: "inherit"
						});
					});
					
					globalThis.StopAllWorkers();
					
					process.exit();
				}, 100 );

			};
			
			if ( parts[ 1 ] === 'nosave' || parts[ 1 ] === '0' )
			proceed();
			else
			sdWorld.SaveSnapshot( sdWorld.snapshot_path_const, proceed );
		}
		else
		if ( parts[ 0 ] === 'save' )
		{
			if ( sdWorld.server_config.aggressive_hibernation )
			{
				socket.SDServiceMessage( 'This feature does not work when aggressive_hibernation is enabled in config file' );
			}
			else
			sdWorld.SaveSnapshot( sdWorld.timewarp_path_const, ( err )=>
			{
				for ( let i = 0; i < sdWorld.sockets.length; i++ )
				sdWorld.sockets[ i ].SDServiceMessage( 'Server: World timewarp restore point has been set ('+(err?'Error!':'successfully')+')!' );
			});
		}
		else
		if ( parts[ 0 ] === 'restore' || parts[ 0 ] === 'load' )
		{
			if ( sdWorld.server_config.aggressive_hibernation )
			{
				socket.SDServiceMessage( 'This feature does not work when aggressive_hibernation is enabled in config file' );
			}
			else
			{
				for ( let i = 0; i < sdWorld.sockets.length; i++ )
				sdWorld.sockets[ i ].SDServiceMessage( 'Server: Timewarp initiated.' );

				sdWorld.PreventSnapshotSaving();

				let ok = 0;
				let tot = 0;

				const fin = ( err )=>
				{
					tot++;
					if ( !err )
					ok++;

					socket.SDServiceMessage( 'Server: Copying files... tot: ' + tot + ', ok: ' + ok  );

					if ( tot === 2 )
					{
						if ( ok === 2 )
						sdModeration.CommandReceived( socket, '/restart nosave' );
						else
						{
							socket.SDServiceMessage( 'Server: Unable to manage backup files. /load command execution canceled.' );
						}
					}
				};

				fs.copyFile( sdWorld.timewarp_path_const, sdWorld.snapshot_path_const, fs.constants.COPYFILE_FICLONE, fin );
				fs.copyFile( sdWorld.timewarp_path_const+'.raw.v', sdWorld.snapshot_path_const+'.raw.v', fs.constants.COPYFILE_FICLONE, fin );
			}
		}
		else
		if ( parts[ 0 ] === 'fullreset' || parts[ 0 ] === 'wipe' )
		{
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			sdWorld.sockets[ i ].SDServiceMessage( 'Server: World reset has been initated.' );

			sdWorld.PreventSnapshotSaving();
			try
			{
				fs.unlinkSync( sdWorld.snapshot_path_const );
				sdDeepSleep.DeleteAllFiles();
				
			}catch(e){}
			
			sdModeration.CommandReceived( socket, '/restart nosave' );
		}
		else
		if ( parts[ 0 ] === 'connection' || parts[ 0 ] === 'socket' )
		{
			/*if ( !is_non_admin )
			console.log(
				'Socket command execution status: ',
				socket.max_update_rate,
				socket.left_overs
					
			);*/
	
			//socket.sent_result_ok *= 0.8;
			//socket.sent_result_dropped = 0.8;
	
			socket.SDServiceMessage( 'Server: Server sends updates to you each ' + socket.max_update_rate + 'ms ('+ (~~socket.sent_result_dropped)+' dropped out of '+(~~socket.sent_result_ok)+')' );
		}
		else
		if ( parts[ 0 ] === 'god' )
		{
			if ( socket.character )
			{
				if ( parts[ 1 ] === '1' )
				{
					// Skip arrival sequence
					if ( socket.character.driver_of )
					if ( socket.character.driver_of._doors_locked )
					{
						socket.character.driver_of.ExcludeDriver( socket.character, true );
					}
					
					socket.character._god = true;
					
					if ( socket.character.GetClass() !== 'sdPlayerSpectator' )
					{
						//for ( let i = 0; i < sdWorld.sockets.length; i++ )
						//sdWorld.sockets[ i ].SDServiceMessage( socket.character.title + ' has entered "godmode".' );

						sdEntity.entities.push( new sdGun({ x:socket.character.x, y:socket.character.y, class:sdGun.CLASS_ADMIN_REMOVER }) );
						sdEntity.entities.push( new sdGun({ x:socket.character.x, y:socket.character.y, class:sdGun.CLASS_ADMIN_TELEPORTER }) );
						sdEntity.entities.push( new sdGun({ x:socket.character.x, y:socket.character.y, class:sdGun.CLASS_ADMIN_DAMAGER }) );
						sdEntity.entities.push( new sdGun({ x:socket.character.x, y:socket.character.y, class:sdGun.CLASS_BUILD_TOOL }) );

						socket.character.InstallUpgrade( 'upgrade_jetpack' );
						socket.character.InstallUpgrade( 'upgrade_hook' );
						socket.character.InstallUpgrade( 'upgrade_invisibility' );
						socket.character.InstallUpgrade( 'upgrade_grenades' );

						socket.character.InstallUpgrade( 'upgrade_jetpack_power' );
						socket.character.InstallUpgrade( 'upgrade_jetpack_power' );
						socket.character.InstallUpgrade( 'upgrade_jetpack_power' );

						socket.character.InstallUpgrade( 'upgrade_stability_recovery' );
						socket.character.InstallUpgrade( 'upgrade_stability_recovery' );
						socket.character.InstallUpgrade( 'upgrade_stability_recovery' );
					}
					
					socket.emit('SET sdWorld.my_entity._god', true );
				}
				else
				if ( parts[ 1 ] === '0' )
				{
					//if ( socket.character.GetClass() !== 'sdPlayerSpectator' )
					//for ( let i = 0; i < sdWorld.sockets.length; i++ )
					//sdWorld.sockets[ i ].SDServiceMessage( socket.character.title + ' is no longer in "godmode".' );
				
					socket.character._god = false;
					socket.emit('SET sdWorld.my_entity._god', false );
				}
				else
				socket.SDServiceMessage( 'Type /god 1 or /god 0' );
			}
			else
			socket.SDServiceMessage( 'Server: No active character.' );
		}
		else
		if ( parts[ 0 ] === 'remove' || parts[ 0 ] === 'break' )
		{
			if ( !sdWorld.entity_classes[ parts[ 1 ] ] && parts[ 1 ] !== '*' )
			{
				socket.SDServiceMessage( 'Server: No such class was found. Examples: ' + Object.keys( sdWorld.entity_classes ).sort(()=>{return Math.random()-0.5;}).slice(0,10).join(', ') );
			}
			else
			for ( let i = 0; i < sdEntity.entities.length; i++ )
			if ( !sdEntity.entities[ i ].IsGlobalEntity() ) // Let's at least not remove sdWeather since it can't respawn
			if ( sdEntity.entities[ i ].GetClass() === parts[ 1 ] || parts[ 1 ] === '*' )
			{
				sdEntity.entities[ i ].remove();
				
				if ( parts[ 0 ] === 'remove' )
				sdEntity.entities[ i ]._broken = false;
			}
		}
		else
		if ( parts[ 0 ] === 'scale' )
		{
			if ( socket.character )
			{
				let num = parseFloat( parts[ 1 ] );
				if ( isNaN( num ) )
				num = 100;
				else
				if ( num < 10 )
				num = 10;
				else
				if ( num > 1000 )
				num = 1000;
		
				socket.character.s = num;
			}
		}
		else
		if ( parts[ 0 ] === 'kill' )
		{
			if ( socket.character )
			if ( !socket.character._is_being_removed )
			{
				let character = socket.character;
				
				character.ManualRTPSequence( true );
			}
		}
		else
		if ( parts[ 0 ] === 'boundsmove' )
		{
			let xx = parts[ 1 ];
			let yy = parts[ 2 ];
			
			if ( isNaN( xx ) || isNaN( yy ) )
			{
				socket.SDServiceMessage( 'Can\'t move bounds like that. Type something like /boundsmove 32 -32 . Both X and Y coordinates will be rounded to 32. Positive Y is downwards.' );
			}
			else
			{
				xx = Math.round( xx / 32 ) * 32;
				yy = Math.round( yy / 32 ) * 32;
				
				if ( parts[ 3 ] === 'fast' || parts[ 3 ] === 'wipe' )
				{
					let w = sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1;
					let h = sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1;
					
					sdWorld.world_bounds.x1 += xx;
					sdWorld.world_bounds.y1 += yy;
					
					sdWorld.world_bounds.x2 = sdWorld.world_bounds.x1;
					sdWorld.world_bounds.y2 = sdWorld.world_bounds.y1;
					
					sdWorld.ChangeWorldBounds( sdWorld.world_bounds.x1, sdWorld.world_bounds.y1, sdWorld.world_bounds.x1 + w, sdWorld.world_bounds.y1 + h );
				}
				else
				sdWorld.ChangeWorldBounds( sdWorld.world_bounds.x1 + xx, sdWorld.world_bounds.y1 + yy, sdWorld.world_bounds.x2 + xx, sdWorld.world_bounds.y2 + yy );
			
				socket.SDServiceMessage( 'Server: Bounds changed. Current bounds: '+JSON.stringify( sdWorld.world_bounds ) );
			}
		}
		else
		if ( parts[ 0 ] === 'topactive' )
		{
			for ( let t = 0; t < 30; t++ )
			{
				setTimeout( ()=>
				{
					let counts = {};
					let ents = sdWorld.entity_classes.sdEntity.active_entities;
					for ( let i = 0; i < ents.length; i++ )
					counts[ ents[ i ].GetClass() ] = ( counts[ ents[ i ].GetClass() ] || 0 ) + 1;

					let all_options = [];
					for ( let i in counts )
					all_options.push({ title: i, value: counts[ i ] });

					all_options = all_options.sort((a,b)=>{return b.value-a.value;});

					let strings = [];

					for ( let i = 0; i < all_options.length && i < 10; i++ )
					strings.push( all_options[ i ].title + ': ' + all_options[ i ].value );

					socket.SDServiceMessage( 'Most active entitites by count: ' + strings.join(', ') );
				}, t * 1000 );
			}
		}
		else
		if ( parts[ 0 ] === 'deepsleepinfo' || parts[ 0 ] === 'cells' || parts[ 0 ] === 'deepsleep' || parts[ 0 ] === 'ds' )
		{
			let counts = [ 0,0,0 ];
			for ( let i = 0; i < sdDeepSleep.cells.length; i++ )
			counts[ sdDeepSleep.cells[ i ].type ]++;
		
			socket.SDServiceMessage( 'Cells total: ' + sdDeepSleep.cells.length + ', unspawned: ' + counts[ sdDeepSleep.TYPE_UNSPAWNED_WORLD ] + ', hibernated: ' + counts[ sdDeepSleep.TYPE_HIBERNATED_WORLD ] + ', potentially-to-hibernate: ' + counts[ sdDeepSleep.TYPE_SCHEDULED_SLEEP ] );
		}
		else
		if ( parts[ 0 ] === 'updatecache' )
		{
			globalThis.UpdateFileCache();
			socket.SDServiceMessage( 'Done' );
		}
		else
		if ( parts[ 0 ] === 'disablecache' )
		{
			globalThis.DisableFileCache();
			socket.SDServiceMessage( 'Done' );
		}
		else
		if ( parts[ 0 ] === 'database' || parts[ 0 ] === 'db' )
		{
			socket.emit( 'OPEN_INTERFACE', 'sdDatabaseEditor' );
		}
		else
		if ( parts[ 0 ] === 'admin' || parts[ 0 ] === 'a' || parts[ 0 ] === 'adm' )
		{
			socket.emit( 'OPEN_INTERFACE', 'sdAdminPanel' );
		}
		else
		socket.SDServiceMessage( 'Server: Unknown command "' + parts[ 0 ] + '"' );
	}
}
//sdModeration.init_class();

export default sdModeration;