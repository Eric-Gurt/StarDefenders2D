/*

	Ban manager

*/

/* global sdElement, sdModeration */

import sdElement from './sdElement.js';
import sdInterface from './sdInterface.js';

import sdEntity from '../entities/sdEntity.js';
import sdCharacter from '../entities/sdCharacter.js';
//import sdDatabase from '../server/sdDatabase.js';
import sdWorld from '../sdWorld.js';

class sdAdminPanel extends sdInterface
{
	static init_class()
	{
		sdAdminPanel.window_instances = [];

		sdInterface.interface_classes[ this.name ] = this; // Register for callbacks
	}
	
	static Open( params )
	{
		let instance = new sdAdminPanel( params );
		sdAdminPanel.window_instances.push( instance );
		return instance;
	}
	
	static Close( instance )
	{
		if ( !instance )
		throw new Error();
	
		instance.remove();
	}
	
	constructor( params )
	{
		super( params );
		
		this.window = sdElement.createElement({ 
			type: sdElement.WINDOW,
			text: 'Admin panel', translate: true,
			onCloseButton: ()=>{ this.remove(); },
			draggable: true
		});
		this.window.element.style.cssText = `
			left: 20px;
			top: 20px;
		
			width: 1000px;
			height: calc( 100% - 40px );
		`;
		
		this.contents = this.window.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: ''
		});
		
		this.contents.element.style.cssText = `
			overflow: auto;
			height: 100%;
			width: 100%;
		`;
		this.contents.element.classList.add( 'sd_scrollbar' );
		
		this.banning_mode = false;
		this.last_data = null;
		
		//globalThis.socket.emit( 'UI', [ 'sdAdminPanel',  ] );
		
		this.UpdateContentsWrap = ( data )=> // So "this" is not forgotten
		{
			this.UpdateContents( data );
		};
		
		this.CallServerCommand( 'SYNC_DATA', [], this.UpdateContentsWrap );
	}
	
	static async HandleServerCommand( command, arr, socket )
	{
		let admin_row = sdModeration.GetAdminRow( socket );
		
		if ( !admin_row )
		return;
	
	
		let data = {
		};
	
		if ( command === 'SYNC_DATA' )
		{
			data = {
				admins: [],
				recent_players: [],
				bans: []
			};
		}
		else
		if ( command === 'DEMOTE' )
		{
			data.admins = [];
			
			let target = null;
			
			let index = arr[ 0 ];
			
			if ( sdModeration.data.admins[ index ] )
			if ( sdModeration.data.admins[ index ].pseudonym === arr[ 1 ] )
			{
				target = sdModeration.data.admins[ index ];
				
				if ( target.access_level > admin_row.access_level || target === admin_row )
				{
					sdModeration.data.admins.splice( index, 1 );
					sdModeration.Save();
					
					for ( let i = 0; i < sdCharacter.characters.length; i++ )
					if ( sdCharacter.characters[ i ]._god )
					if ( sdCharacter.characters[ i ]._my_hash === target.my_hash || ( sdCharacter.characters[ i ]._socket && sdCharacter.characters[ i ]._socket.my_hash === target.my_hash ) ) // Including cases of temporarily controlling other characters
					{
						sdCharacter.characters[ i ]._god = false;
					}
				}
			}
		}
		else
		if ( command === 'TELEPORT_TO' || command === 'TELEPORT_HERE' )
		{
			if ( socket.character )
			for ( let i = 0; i < sdWorld.recent_players.length; i++ )
			if ( sdWorld.recent_players[ i ].last_known_net_id === arr[ 0 ] )
			{
				let ent = sdEntity.entities_by_net_id_cache_map.get( sdWorld.recent_players[ i ].last_known_net_id );
				
				if ( ent )
				{
					if ( command === 'TELEPORT_TO' )
					{
						socket.character.x = ent.x;
						socket.character.y = ent.y;
					}
					else
					if ( command === 'TELEPORT_HERE' )
					{
						if ( ent.driver_of )
						ent.driver_of.ExcludeDriver( ent );
						
						ent.x = socket.character.x;
						ent.y = socket.character.y;
					}
				}
			}
		}
		else
		if ( command === 'PROMOTE' )
		{
			data.admins = [];
			
			let target_pseudonym = '?';
			
			let target_hash = null;
			
			for ( let i = 0; i < sdWorld.recent_players.length; i++ )
			if ( sdWorld.recent_players[ i ].last_known_net_id === arr[ 0 ] )
			{
				target_hash = sdWorld.recent_players[ i ].my_hash;
				
				let ent = sdEntity.entities_by_net_id_cache_map.get( sdWorld.recent_players[ i ].last_known_net_id );
				
				if ( ent && ent.title )
				target_pseudonym = ent.title.split( 'Disconnected ' ).join('');
				else
				target_pseudonym = sdWorld.recent_players[ i ].pseudonym;
			
			
				let is_admin_row = sdModeration.GetAdminRowByHash( target_hash );
				
				if ( !is_admin_row )
				{
					sdModeration.data.admins.push( { my_hash: target_hash, access_level: admin_row.access_level + 1, pseudonym: target_pseudonym, promoter_hash: admin_row.my_hash } );
					sdModeration.Save();
				}
				
				break;
			}
		}
		else
		if ( command === 'UNBAN' )
		{
			data.bans = [];
			
			let target_hash_or_ban_uid = arr[ 0 ];
			
			let initiator_hash_or_user_uid = socket.my_hash;

			let operation = 'unban';

			//let reason_public = arr[ 1 ];
			//let reason_private = admin_row.pseudonym + ' bans ' + target_pseudonym + ' with provided reason: ' + arr[ 1 ];

			//let duration = arr[ 2 ];//1000 * 60 * 60 * 24 * 30 * 12; // Year?

			await new Promise( ( resolve, reject )=>
			{
				sdDatabase.Exec( 
					[ 
						[ 'DBBanUnbanByHash', initiator_hash_or_user_uid, operation, target_hash_or_ban_uid ] 
					], 
					( responses )=>
					{
						if ( responses )
						for ( let i = 0; i < responses.length; i++ )
						{
							let response = responses[ i ];
							socket.emit( response[ 0 ], response[ 1 ] );
						}

						resolve();
					},
					'localhost'
				);
			});
		}
		else
		if ( command === 'BAN' )
		{
			data.recent_players = [];
			data.bans = [];
			
			let target_hash_or_ban_uid = null;
			
			let target_pseudonym = '?';
			
			for ( let i = 0; i < sdWorld.recent_players.length; i++ )
			if ( sdWorld.recent_players[ i ].last_known_net_id === arr[ 0 ] )
			{
				sdWorld.recent_players[ i ].ban = 'Banned by ' + admin_row.pseudonym + ': ' + arr[ 1 ];
				
				target_hash_or_ban_uid = sdWorld.recent_players[ i ].my_hash;
				
				let ent = sdEntity.entities_by_net_id_cache_map.get( sdWorld.recent_players[ i ].last_known_net_id );
				
				if ( ent && ent.title )
				target_pseudonym = ent.title.split( 'Disconnected ' ).join('');
				else
				target_pseudonym = sdWorld.recent_players[ i ].pseudonym;
				
				/*if ( ent )
				if ( ent._socket )
				ent._socket.disconnect();*/
		
				for ( let i2 = 0; i2 < sdWorld.sockets.length; i2++ )
				if ( sdWorld.sockets[ i2 ].my_hash === sdWorld.recent_players[ i ].my_hash )
				{
					let s = sdWorld.sockets[ i2 ];
					setTimeout( ()=>
					{
						s.disconnect();
					}, 1 );
				}
				break;
			}
	
			if ( target_hash_or_ban_uid !== null )
			{
				let initiator_hash_or_user_uid = socket.my_hash;

				let operation = 'ban';

				let reason_public = arr[ 1 ];
				let reason_private = '[' + admin_row.pseudonym + '] bans "' + target_pseudonym + '" with provided reason: ' + arr[ 1 ];

				let duration = arr[ 2 ];//1000 * 60 * 60 * 24 * 30 * 12; // Year?

				await new Promise( ( resolve, reject )=>
				{
					sdDatabase.Exec( 
						[ 
							[ 'DBBanUnbanByHash', initiator_hash_or_user_uid, operation, target_hash_or_ban_uid, reason_public, reason_private, duration ] 
						], 
						( responses )=>
						{
							if ( responses )
							for ( let i = 0; i < responses.length; i++ )
							{
								let response = responses[ i ];
								socket.emit( response[ 0 ], response[ 1 ] );
							}
						
							resolve();
						},
						'localhost'
					);
				});
			}
		}
		
		
		if ( data.admins )
		for ( let i = 0; i < sdModeration.data.admins.length; i++ )
		{
			data.admins.push({
				pseudonym: sdModeration.data.admins[ i ].pseudonym,
				access_level: sdModeration.data.admins[ i ].access_level,
				is_you: ( admin_row === sdModeration.data.admins[ i ] )
			});
		}
		
		if ( data.recent_players )
		for ( let i = 0; i < sdWorld.recent_players.length; i++ )
		{
			data.recent_players.push({
				pseudonym: sdWorld.recent_players[ i ].pseudonym,
				last_known_net_id: sdWorld.recent_players[ i ].last_known_net_id,
				time: sdWorld.recent_players[ i ].time,
				ban: sdWorld.recent_players[ i ].ban,
				you: ( sdWorld.recent_players[ i ].my_hash === socket.my_hash ) ? 1 : 0,
				challenge_result: ( admin_row.access_level === 0 ) ? sdWorld.recent_players[ i ].challenge_result : 0 // Only server owner can see these so far
			});
		}
		
		
		if ( data.bans )
		{
			let bans = data.bans;

			await new Promise( ( resolve, reject )=>
			{
				let initiator_hash_or_user_uid = socket.my_hash;
				let operation = 'list_bans';
				sdDatabase.Exec( 
					[ 
						[ 'DBBanUnbanByHash', initiator_hash_or_user_uid, operation ] 
					], 
					( responses )=>
					{
						if ( responses )
						{
							for ( let i = 0; i < responses.length; i++ )
							{
								let response = responses[ i ];

								if ( !( response instanceof Array ) )
								{
									bans.unshift( response );
								}
								else
								{
									socket.emit( response[ 0 ], response[ 1 ] );
								}
							}
						}

						resolve();
					},
					'localhost'
				);
			});
		}
		
		
		
		
		
		

		return data;
	}
	
	UpdateContents( data=null )
	{
		if ( data )
		{
			data = Object.assign( this.last_data || {}, data ); // Keep non-mentioned properties
			
			this.last_data = data;
		}
		else
		data = this.last_data;
	
		this.contents.removeChildren();
		
		
		let action_line = this.contents.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			paddingTop: 10,
			text: ''
		});
		{
			action_line.createElement({ type: sdElement.TEXT, text: '[ ' });
			action_line.createElement({ type: sdElement.TEXT, text: 'Refresh', color: '#aaffaa', onClick:()=>
			{
				this.CallServerCommand( 'SYNC_DATA', [], this.UpdateContentsWrap );
			}});
			action_line.createElement({ type: sdElement.TEXT, text: ' ] ' });
		}
		
		
		
		this.contents.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: 'Admins (current server):',
			paddingTop: 20,
			color: '#aabdff'
		});
		{
			let my_admin_row_simple = null;
			for ( let i = 0; i < data.admins.length; i++ )
			if ( data.admins[ i ].is_you )
			{
				my_admin_row_simple = data.admins[ i ];
			}

			for ( let i = 0; i < data.admins.length; i++ )
			{
				let admin_row = data.admins[ i ];

				let that_i = i;

				let admin_line = this.contents.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					padding: 10,
					text: admin_row.pseudonym
				});
				admin_line.createElement({ 
					type: sdElement.TEXT, 
					padding: 10,
					color: '#666666',
					text: ' (access level: '+admin_row.access_level+')' + ( admin_row.is_you ? ' <--- This is you' : '' )
				});

				if ( my_admin_row_simple.access_level < admin_row.access_level || my_admin_row_simple === admin_row )
				{
					let action_line = admin_line.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						paddingTop: 10,
						text: ''
					});
					
					action_line.createElement({ type: sdElement.TEXT, text: '[ ' });
					action_line.createElement({ type: sdElement.TEXT, text: 'Demote', color:'#ffaaaa', onClick:()=>
					{
						this.CallServerCommand( 'DEMOTE', [ that_i, admin_row.pseudonym ], this.UpdateContentsWrap );
					}});
					action_line.createElement({ type: sdElement.TEXT, text: ' ] ' });
				}
			}
		}
		
		
		let recent_players_header = this.contents.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: 'Recent players (current server, resets on restart): ',
			paddingTop: 20,
			color: '#aabdff'
		});
		

		recent_players_header.createElement({ type: sdElement.TEXT, text: '[ ' });
		recent_players_header.createElement({ type: sdElement.TEXT, text: 'Toggle banning mode', color:'#ffaaaa', onClick:()=>
		{
			this.banning_mode = !this.banning_mode;
			this.UpdateContents();

		}});
		recent_players_header.createElement({ type: sdElement.TEXT, text: ' ] ' });
		
		{
			for ( let i = 0; i < data.recent_players.length; i++ )
			{
				let player_row = data.recent_players[ i ];
				
				let line = this.contents.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					padding: 10,
					text: player_row.pseudonym
				});
				line.createElement({ 
					type: sdElement.TEXT, 
					padding: 10,
					color: '#666666',
					text: ' (' + new Date( player_row.time ).toLocaleDateString( "en-US", { year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' } ) + ( player_row.challenge_result ? ', fingerprint: ' + player_row.challenge_result : '' ) + ')' + ( ( player_row.you ) ? ' <--- This is you' : '' )
				});
				

				if ( !player_row.you )
				{
					if ( player_row.ban !== '' )
					{
						let action_line = line.createElement({ 
							type: sdElement.TEXT_BLOCK, 
							paddingTop: 10,
							text: ''
						});

						action_line.createElement({ type: sdElement.TEXT, text: '[ ' });
						action_line.createElement({ type: sdElement.TEXT, text: player_row.ban, color:'#666666' });
						action_line.createElement({ type: sdElement.TEXT, text: ' ] ' });
					}
					else
					{
						if ( !this.banning_mode )
						{
							let action_line = line.createElement({ 
								type: sdElement.TEXT_BLOCK, 
								paddingTop: 10,
								text: ''
							});

							action_line.createElement({ type: sdElement.TEXT, text: '[ ' });
							action_line.createElement({ type: sdElement.TEXT, text: 'Promote to admin', color:'#aaffaa', onClick:()=>
							{
								this.CallServerCommand( 'PROMOTE', [ player_row.last_known_net_id ], this.UpdateContentsWrap );
							}});
							action_line.createElement({ type: sdElement.TEXT, text: ' ] ' });



							action_line.createElement({ type: sdElement.TEXT, text: '[ ' });
							action_line.createElement({ type: sdElement.TEXT, text: 'Teleport to player', color:'#aaffaa', onClick:()=>
							{
								this.CallServerCommand( 'TELEPORT_TO', [ player_row.last_known_net_id ], this.UpdateContentsWrap );
							}});
							action_line.createElement({ type: sdElement.TEXT, text: ' ] ' });



							action_line.createElement({ type: sdElement.TEXT, text: '[ ' });
							action_line.createElement({ type: sdElement.TEXT, text: 'Move player here', color:'#aaffaa', onClick:()=>
							{
								this.CallServerCommand( 'TELEPORT_HERE', [ player_row.last_known_net_id ], this.UpdateContentsWrap );
							}});
							action_line.createElement({ type: sdElement.TEXT, text: ' ] ' });
						}
						else
						{
							let banning_line;

							banning_line = line.createElement({ 
								type: sdElement.TEXT_BLOCK, 
								paddingTop: 10,
								text: ''
							});
							{
								let options = [  
									'Ban for 30 minutes',	1000 * 60 * 30,
									'Ban for 1 day',		1000 * 60 * 60 * 24,
									'Ban for 1 month',		1000 * 60 * 60 * 24 * 30,
									'Ban for 6 months',		1000 * 60 * 60 * 24 * 30 * 6,
									'Ban for 1 year',		1000 * 60 * 60 * 24 * 30 * 12,
									'Ban permanently',		1000 * 60 * 60 * 24 * 30 * 12 * 100,
								];
								for ( let p = 0; p < options.length; p += 2 )
								{
									let duration = options[ p + 1 ];

									banning_line.createElement({ type: sdElement.TEXT, text: '[ ' });
									banning_line.createElement({ type: sdElement.TEXT, text: options[ p + 0 ], color:'#ffaaaa', onClick:()=>
									{
										let reason = prompt( 'Provide ban reason:' );

										if ( reason !== null )
										this.CallServerCommand( 'BAN', [ player_row.last_known_net_id, reason, duration ], this.UpdateContentsWrap );
									}});
									banning_line.createElement({ type: sdElement.TEXT, text: ' ] ' });
								}
							}
						}
					}
				}
				

			}
		}
		
		
		let bans_header = this.contents.createElement({ 
			type: sdElement.TEXT_BLOCK, 
			text: 'Bans (from associated database): ',
			//text: 'Bans (from associated database, expired bans are removed when banned player connects): ',
			paddingTop: 20,
			color: '#aabdff'
		});
		{
			if ( data.bans.length === 0 )
			{
				let line = this.contents.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					padding: 10,
					color: '#666666',
					//text: '- no bans were found or moderation.bans execute access was not granted for you (top-level admins can do this by editing database with /db command) -'
					text: '- no bans were found -'
				});
			}
			for ( let i = 0; i < data.bans.length; i++ )
			{
				let ban_row = data.bans[ i ];
				
				let line = this.contents.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					padding: 10,
					text: ''
				});
				/*
				line.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: '{'
				});*/
				for ( let p in ban_row )
				if ( p !== 'uid' )
				{
					let caption = p;
					
					if ( caption === 'reason_private' )
					caption = 'Ban ' + ban_row.uid;
					
					if ( caption === 'until' )
					caption = 'Until';
					
					let prop = line.createElement({ 
						type: sdElement.TEXT_BLOCK, 
						text: caption + ': ',
						color: '#aaaaaa'
					});
					
					prop.createElement({ 
						type: sdElement.TEXT, 
						color: ( p === 'until' && ban_row.expired ) ? '#666666' : '#ffffff',
						text: ( p === 'until' ) ? new Date( ban_row[ p ] ).toLocaleDateString( "en-US", { year: 'numeric', month: 'long', day: 'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' } ) + ( ban_row.expired ? ' expired, will disappear next time user connects' : '' ) : ban_row[ p ]
					});
					
					if ( p === 'until' )
					{
						prop.createElement({ type: sdElement.TEXT, text: ' [ ' });
						prop.createElement({ type: sdElement.TEXT, text: 'Cancel this ban', color:'#ffffaa', onClick:()=>
						{
							this.CallServerCommand( 'UNBAN', [ ban_row.uid ], this.UpdateContentsWrap );
						}});
						prop.createElement({ type: sdElement.TEXT, text: ' ] ' });
					}
				}
				
				/*let btn = line.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: '', paddingTop: 10
				});*/
				/*line.createElement({ type: sdElement.TEXT, text: ' [ ' });
				line.createElement({ type: sdElement.TEXT, text: 'Cancel this ban', color:'#ffffaa', onClick:()=>
				{
					this.CallServerCommand( 'UNBAN', [ ban_row.uid ], this.UpdateContentsWrap );
				}});
				line.createElement({ type: sdElement.TEXT, text: ' ] ' });*/
				
				/*line.createElement({ 
					type: sdElement.TEXT_BLOCK, 
					text: '}'
				});*/
			}
		}
	}
	
	remove()
	{
		this.window.remove();
		
		let id = sdAdminPanel.window_instances.indexOf( this );
		if ( id !== -1 )
		sdAdminPanel.window_instances.splice( id, 1 );
	}
}

export default sdAdminPanel;