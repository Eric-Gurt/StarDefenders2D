
import sdRenderer from './sdRenderer.js';
import sdWorld from '../sdWorld.js';
import sdShop from './sdShop.js';
import sdCom from '../entities/sdCom.js';
import sdEntity from '../entities/sdEntity.js';
import sdStorage from '../entities/sdStorage.js';



class sdContextMenu
{
	static init_class()
	{
		sdContextMenu.open = false;
		sdContextMenu.options = [];
		sdContextMenu.x = 0;
		sdContextMenu.y = 0;
		
		sdContextMenu.current_target = null;
		sdContextMenu.potential_option = null;
	}
	static Open()
	{
		if ( sdWorld.hovered_entity )
		{
			sdContextMenu.current_target = sdWorld.hovered_entity;
			
			sdContextMenu.options = [];
				
			if ( sdContextMenu.current_target.GetClass() === 'sdUpgradeStation' )
			{
				if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdCom.action_range_command_centre ) >= 0 )
				{
					sdContextMenu.options.push({ title: 'Upgrade character (5000 matter cost)',
						action: ()=>
						{
							globalThis.socket.emit( 'UPGRADE_CHAR', [ sdContextMenu.current_target._net_id ] );
						}
					});
					sdContextMenu.options.push({ title: 'Get basic equipment (500 matter cost)',
						action: ()=>
						{
							globalThis.socket.emit( 'UPGRADE_GET_EQUIP', [ sdContextMenu.current_target._net_id ] );
						}
					});
					if ( sdWorld.my_entity.build_tool_level > 1 && sdContextMenu.current_target.level < 3 )
					sdContextMenu.options.push({ title: 'Upgrade the station (5000 matter cost)',
						action: ()=>
						{
							globalThis.socket.emit( 'UPGRADE_STAT', [ sdContextMenu.current_target._net_id ] );
						}
					});
				}
			}
			else
			if ( sdContextMenu.current_target.GetClass() === 'sdCrystalCombiner' )
			{
				if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, 64 ) >= 0 )
				{
					sdContextMenu.options.push({ title: 'Combine crystals',
						action: ()=>
						{
							globalThis.socket.emit( 'CRYSTAL_COMBINE', [ sdContextMenu.current_target._net_id ] );
						}
					});
				}
			}
			else
			/*if ( sdContextMenu.current_target.GetClass() === 'sdStorage' )
			{
				if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdStorage.access_range ) >= 0 )
				if ( sdContextMenu.current_target.held_by === null )
				{
					let items = sdContextMenu.current_target.GetItems();

					for ( var i = 0; i < items.length; i++ )
					{
						let item = items[ i ]; // Name of the item
						let it_c = i; // For some reason I need this since otherwise setting "i" value on socket emit array below results always in last value - Booraz // It is because by the time action function is executed - this loop is already finished and i points to items.length, it is perfectly fine to create "let" variables inside of such loops -- Eric Gurt
						sdContextMenu.options.push({ title: 'Get ' + item,
							action: ()=>
							{
								globalThis.socket.emit( 'STORAGE_GET', [ sdContextMenu.current_target._net_id, it_c ] );
							}
						});
					}
				}
			}
			else
			if ( sdContextMenu.current_target.GetClass() === 'sdCom' )
			{
				if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdCom.action_range ) >= 0 )
				{
					if ( sdContextMenu.current_target.subscribers.indexOf( sdWorld.my_entity.biometry ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe myself to network',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, sdWorld.my_entity.biometry ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdCharacter' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe all players',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdCharacter' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdPlayerDrone' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe all player drones',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdPlayerDrone' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdCrystal' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe all crystals',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdCrystal' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdCube' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe all Cubes',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdCube' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdStorage' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe all Storage crates',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdStorage' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdHover' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe all Hovers',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdHover' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdGun' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe all items',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdGun' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( 'sdBullet' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe projectiles',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdBullet' ] ); }
					});

					if ( sdContextMenu.current_target.subscribers.indexOf( '*' ) === -1 )
					sdContextMenu.options.push({ title: 'Subscribe everything (for doors & teleports only)',
						action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, '*' ] ); }
					});

					for ( var i = 0; i < sdContextMenu.current_target.subscribers.length; i++ )
					{
						let net_id_or_biometry = sdContextMenu.current_target.subscribers[ i ];
						sdContextMenu.options.push({ title: 'Kick ' + sdEntity.GuessEntityName( net_id_or_biometry ),
							action: ()=>
							{
								globalThis.socket.emit( 'COM_KICK', [ sdContextMenu.current_target._net_id, net_id_or_biometry ] );
							}
						});
					}
				}

				if ( sdContextMenu.current_target.subscribers.indexOf( sdWorld.my_entity.biometry ) !== -1 )
				sdContextMenu.options.push({ title: 'Unsubscribe from network',
					action: ()=>
					{
						globalThis.socket.emit( 'COM_UNSUB', sdContextMenu.current_target._net_id );
					}
				});
			}
			else*/
			sdContextMenu.current_target.PopulateContextOptions( sdWorld.my_entity );
			
			if ( sdContextMenu.options.length > 0 )
			{
				if ( !sdContextMenu.open ) // Will be open in case of going through context menu categories
				{
					sdContextMenu.open = true;
					sdContextMenu.potential_option = null; // Needed to prevent it clicking onto color picker when it tries to be closed
					sdContextMenu.x = sdWorld.mouse_screen_x;
					sdContextMenu.y = sdWorld.mouse_screen_y;
				}

				sdRenderer.UpdateCursor();
			}
		}
	}
	static MouseDown( e )
	{
		if ( !sdContextMenu.open )
		{
			if ( !sdShop.open )
			if ( e.which === 3 )
			if ( ( !sdContextMenu.open && sdWorld.hovered_entity ) || ( sdContextMenu.open && sdContextMenu.potential_option === null ) )
			{
				sdContextMenu.Open();
				
				if ( sdContextMenu.open )
				return true;
			}
		}
		else
		{
			if ( sdContextMenu.potential_option === null )
			{
				sdContextMenu.open = false;
				sdRenderer.UpdateCursor();
				return true;
			}
			else
			{
				sdContextMenu.potential_option.action();
				
				if ( sdContextMenu.potential_option.close_on_click !== false )
				sdContextMenu.open = false;
			
				sdRenderer.UpdateCursor();
				return true;
			}
		}
		
		return false;
	}
	static Draw( ctx )
	{
		ctx.save();
		{
			//let width = 180;
			let width = 400;
			
			if ( sdContextMenu.y + sdContextMenu.options.length * 30 + 60 > sdRenderer.screen_height )
			{
				sdContextMenu.y = sdRenderer.screen_height - sdContextMenu.options.length * 30 - 60;
			}
			if ( sdContextMenu.x + width > sdRenderer.screen_width )
			{
				sdContextMenu.x = sdRenderer.screen_width - width;
			}
			
			ctx.translate( sdContextMenu.x, sdContextMenu.y );

			ctx.fillStyle = '#000000';
			ctx.globalAlpha = 0.7;
			ctx.fillRect( 0, 0, width, ( sdContextMenu.options.length + 1 ) * ( 30 ) );
			ctx.globalAlpha = 1;
			
			sdContextMenu.potential_option = null;
			
			for ( var i = -1; i < sdContextMenu.options.length; i++ )
			{
				var t = '';
				if ( i === -1 )
				{
					t = T( sdContextMenu.current_target.title || sdContextMenu.current_target.GetClass().slice( 2 ) );
				}
				else
				{
					t = sdContextMenu.options[ i ].title;
					
					if ( sdContextMenu.options[ i ].translate )
					t = T( t );
				}
				
				
				if ( i >= 0 )
				{
					if ( sdWorld.mouse_screen_x >= sdContextMenu.x )
					if ( sdWorld.mouse_screen_x < sdContextMenu.x + width )
					if ( sdWorld.mouse_screen_y >= sdContextMenu.y + ( i + 1 ) * 30 )
					if ( sdWorld.mouse_screen_y < sdContextMenu.y + ( i + 1 + 1 ) * 30 )
					{
						if ( sdContextMenu.potential_option === null )
						{
							sdContextMenu.potential_option = sdContextMenu.options[ i ];

							ctx.fillStyle = '#ffff00';
							ctx.globalAlpha = 0.3;
							ctx.fillRect( 1, ( i + 1 ) * 30 + 1, width-2, 28 );
							ctx.globalAlpha = 1;
						}
					}

					if ( sdContextMenu.options[ i ].hint_color )
					{
						ctx.fillStyle = sdContextMenu.options[ i ].hint_color;
						ctx.globalAlpha = 1;
						ctx.fillRect( width - 28 - 1, ( i + 1 ) * 30 + 1, 28, 28 );
						ctx.globalAlpha = 1;
					}
				}
				
				if ( i === -1 )
				ctx.fillStyle = '#66aaff';
				else
				{
					ctx.fillStyle = '#ffffff';
					
					if ( sdContextMenu.options[ i ].color )
					ctx.fillStyle = sdContextMenu.options[ i ].color;
				}
			
				
				ctx.font = "12px Verdana";
				ctx.textAlign = 'left';
				
				ctx.fillText( t, 10, 20 + ( i + 1 ) * 30, width - 20 );
			}
		}
		ctx.restore();
	}
}
export default sdContextMenu;