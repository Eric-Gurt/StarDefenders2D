/*

	Used to make server pairs talk to each other, because sometimes nobody is online and they feel very lonely.

*/
/* global sdDatabase */

import sdLongRangeTeleport from '../entities/sdLongRangeTeleport.js';
import sdWorld from '../sdWorld.js';

import { io } from "socket.io-client";


class sdServerToServerProtocol
{
	static init_class()
	{
		sdServerToServerProtocol.outgoing_connections = {};
		sdServerToServerProtocol.routes = 0;
		
		sdServerToServerProtocol.message_once_log = new Map(); // Message => do not repeat until
		
		sdWorld.outgoing_server_connections_obj = sdServerToServerProtocol.outgoing_connections;
		
		sdServerToServerProtocol.last_global_leaderboard_ask = 0;
		
		let ask_for_leaders = ()=>
		{
			for ( let remote_server_url in sdServerToServerProtocol.outgoing_connections )
			{
				let socket = sdServerToServerProtocol.outgoing_connections[ remote_server_url ];
				
				sdServerToServerProtocol.SendData( 
					remote_server_url, 
					{
						action: 'Get leaders'
					}, 
					( response=null )=>
					{
						if ( response )
						{
							socket.leaders = response;
							
							let url_short = ' :: ' + sdLongRangeTeleport.ShortenURL( remote_server_url );
							
							for ( let i = 0; i < socket.leaders.length; i++ )
							{
								socket.leaders[ i ].here = 0;
								socket.leaders[ i ].name += url_short;
							}
						}
						else
						socket.leaders = [];
					}
				);
			}
			
			setTimeout( ask_for_leaders, 15000 );
		};
		
		setTimeout( ask_for_leaders, 5000 );
	}
	static IncomingData( route_and_data_object, socket, ip ) // This is where it arrives from remote source, suddenly. Spoofed IPs can't receive data back so we should be fine (probably)
	{
		if ( sdWorld.server_config.log_s2s_messages )
		trace( 'Incoming S2SProtocolMessage (from ' + ip + '): ', route_and_data_object );
	
		let rejection = false;
			
		// Any verification needs to be done here - any player can send these messages. Check IPs or something
		try
		{
			if ( sdWorld.server_config.allowed_s2s_protocol_ips.indexOf( ip ) === -1 )
			{
				rejection = true;
				//throw new Error( 'IP '+ip+' is not specified in sdWorld.server_config.allowed_s2s_protocol_ips array (server_config*.js)' );
			}

			if ( typeof route_and_data_object === 'object' )
			{
				if ( route_and_data_object.length === 2 )
				{
					if ( typeof route_and_data_object[ 0 ] === 'number' )
					{
						let route = route_and_data_object[ 0 ];
						let data_object = route_and_data_object[ 1 ];

						if ( typeof data_object === 'object' )
						{
							if ( typeof data_object.action === 'string' )
							{
								// This action is allowed for unknown servers
								if ( data_object.action === 'I exist!' )
								{
									let date_ob = new Date();

									// current date
									// adjust 0 before single digit date
									let date = ("0" + date_ob.getDate()).slice(-2);

									// current month
									let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

									// current year
									let year = date_ob.getFullYear();

									// current hours
									let hours = date_ob.getHours();

									// current minutes
									let minutes = date_ob.getMinutes();

									// current seconds
									let seconds = date_ob.getSeconds();

									let t = JSON.stringify( data_object );
									trace( '['+year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds+'] Server says it exists :: ' + t.substring( 1, t.length - 1 ) );
									
									socket.emit( 'S2SProtocolMessage', [ route, '+' ] );
									return;
								}
								
								
								// Non-public operations
								if ( !rejection )
								{
									if ( data_object.action === 'Require long-range teleportation' ||
										 data_object.action === 'Do long-range teleportation' ||
										 data_object.action === 'Exchange new _net_ids' ||
										 data_object.action === 'Post-teleporation swap-back one-time keys'
										)
									{
										if ( sdWorld.server_config.log_s2s_messages )
										trace( 'calling sdLongRangeTeleport.AuthorizedIncomingS2SProtocolMessageHandler' );

										try
										{
											sdLongRangeTeleport.AuthorizedIncomingS2SProtocolMessageHandler( data_object, ( response )=>{

												if ( sdWorld.server_config.log_s2s_messages )
												trace( 'replying ',[ route, response ] );

												socket.emit( 'S2SProtocolMessage', [ route, response ] );

											} );
											return;
										}
										catch( e )
										{
											trace( 'Error during message handling at sdLongRangeTeleport.AuthorizedIncomingS2SProtocolMessageHandler: ', e );
										}
									}
									else
									if ( data_object.action === 'Get leaders' )
									{
										socket.emit( 'S2SProtocolMessage', [ route, sdWorld.leaders ] );
										return;
									}
									else
									if ( data_object.action === 'db' )
									{
										sdDatabase.Exec( 
											data_object.request, 
											( result )=>{
												socket.emit( 'S2SProtocolMessage', [ route, result ] );
											},
											ip
										);
										return;
									}
								}
								else
								{
									throw new Error( 'IP '+ip+' is not specified in sdWorld.server_config.allowed_s2s_protocol_ips array (server_config*.js)' );
								}
							}
							else
							{
								if ( !rejection )
								trace( '[ 1 ] Unexpected S2S message' );
							}
						}
						else
						{
							if ( !rejection )
							trace( '[ 2 ] Unexpected S2S message' );
						}
					}
					else
					{
						if ( !rejection )
						trace( '[ 3 ] Unexpected S2S message' );
					}
				}
				else
				{
					if ( !rejection )
					trace( '[ 4 ] Unexpected S2S message' );
				}
			}
			else
			{
				if ( !rejection )
				trace( '[ 5 ] Unexpected S2S message' );
			}
			//else
			//throw new Error( 'route_and_data_object should be "object", got "'+(typeof route_and_data_object)+'" instead' );
		
			throw new Error( 'Command was executed but nothing was done' );
		}
		catch( e )
		{
			if ( sdWorld.server_config.log_s2s_messages || ( rejection && sdWorld.server_config.notify_about_failed_s2s_attempts ) )
			{
				let message = e.toString();
				
				if ( sdServerToServerProtocol.message_once_log.has( message ) )
				{
				}
				else
				{
					trace( 'Error at IncomingData: ', e, ' :: route_and_data_object: ', route_and_data_object );

					for ( var i = 0; i < sdWorld.sockets.length; i++ )
					{
						var socket = sdWorld.sockets[ i ]; // can disappear from array in the middle of loop

						if ( socket.character )
						if ( socket.character._god )
						socket.SDServiceMessage( 'Notice: Remote server sent message that caused error - view server output for details' );
					}
				}
				
				sdServerToServerProtocol.message_once_log.set( message, sdWorld.time + 1000 * 60 * 60 );
				
				sdServerToServerProtocol.message_once_log.forEach( ( value, key )=>
				{
					if ( sdWorld.time > value )
					{
						sdServerToServerProtocol.message_once_log.delete( key );
					}
				});
			}
		}
	}
	static SendData( remote_server_url, data_object, callback=null )
	{
		// Connection will hang for a while actually and auto-restore it seems once established once
		
		let route = sdServerToServerProtocol.routes++;
		
		let socket;
		
		if ( sdServerToServerProtocol.outgoing_connections[ remote_server_url ] === undefined )
		{
			socket = sdServerToServerProtocol.outgoing_connections[ remote_server_url ] = io( 
				remote_server_url, 
				{ 
					forceNew: false,
					transports: [ 'websocket' ], 
					rejectUnauthorized: false 
				}
			);
	
			
			socket.on("connect_error", (err) => 
			{  
				console.log(`S2SProtocolMessage :: SendData socket: connect_error due to ${err.message}`);
			});
	
			socket.leaders = [];
		}
		else
		socket = sdServerToServerProtocol.outgoing_connections[ remote_server_url ];
	
		if ( sdWorld.server_config.log_s2s_messages )
		trace('S2SProtocolMessage :: SendData: Working with outgoing socket: ', socket );
		
		/*
		let socket = io( 
			remote_server_url, 
			{ 
				forceNew: false,
				transports: [ 'websocket' ]
			}
		);*/

		//socket.once('connect', ()=>
		//{
			socket.emit( 'S2SProtocolMessage', [ route, data_object ] );
			
			if ( sdWorld.server_config.log_s2s_messages )
			trace( 'S2SProtocolMessage :: Sending: ', [ route, data_object ] );
		//});
		
		const handler = ( v )=>
		{
			if ( v[ 0 ] === route )
			{
				if ( sdWorld.server_config.log_s2s_messages )
				trace( 'S2SProtocolMessage :: Received response for correct route ( '+v[ 0 ]+' === '+route+' )' );
			
				socket.off('S2SProtocolMessage', handler );
				
				//trace( 'S2SProtocolMessage :: Received: ', v );

				if ( callback )
				{
					callback( v[ 1 ] );
					callback = null;
				}
			}
			else
			{
				if ( sdWorld.server_config.log_s2s_messages )
				trace( 'S2SProtocolMessage :: Received response for another route ( '+v[ 0 ]+' !== '+route+' )' );
			}
		};
		
		socket.on('S2SProtocolMessage', handler );
		/*
		socket.on('disconnect', ()=>
		{
			if ( callback )
			{
				callback( null );
				callback = null;
			}
		});
		*/
		setTimeout( 
			()=>
			{
				socket.off('S2SProtocolMessage', handler );
				
				if ( callback )
				{
					trace( 'S2SProtocolMessage :: No reply received... timeout' );
					callback( null );
					callback = null;
				}
			}, 
			15000 
		);
	}
}
export default sdServerToServerProtocol;