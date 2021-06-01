
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
			
			if ( sdContextMenu.current_target === sdWorld.my_entity )
			{
				sdContextMenu.options = [];
				
				sdContextMenu.options.push({ title: 'Quit and forget this character',
					action: ()=>
					{
						//globalThis.socket.emit( 'SELF_EXTRACT' );
						sdWorld.Stop();
					}
				});
				
				sdContextMenu.options.push({ title: 'Reset respawn point',
					action: ()=>
					{
						globalThis.socket.emit( 'CC_SET_SPAWN', [ -1 ] );
					}
				});
				
				if ( sdContextMenu.current_target.armor > 0 )
				sdContextMenu.options.push({ title: 'Remove armor',
					action: ()=>
					{
						globalThis.socket.emit( 'REMOVE_ARMOR', [ -1 ] );
					}
				});
			}
			else
			{
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
						if ( sdWorld.my_entity.build_tool_level > 1 )
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
					if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdStorage.access_range ) >= 0 )
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
				if ( sdContextMenu.current_target.GetClass() === 'sdMatterAmplifier' )
				{
					if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdStorage.access_range ) >= 0 )
					{
						sdContextMenu.options.push({ title: 'Toggle shields',
							action: ()=>
							{
								globalThis.socket.emit( 'AMPLIFIER_SHIELD_TOGGLE', [ sdContextMenu.current_target._net_id ] );
							}
						});
					}
				}
				else
				if ( sdContextMenu.current_target.GetClass() === 'sdStorage' )
				{
					if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdStorage.access_range ) >= 0 )
					{
						let items = sdContextMenu.current_target.GetItems();
						
						for ( var i = 0; i < items.length; i++ )
						{
							let net_id = items[ i ]._net_id;
							sdContextMenu.options.push({ title: 'Get ' + sdEntity.GuessEntityName( net_id )/*user ' + net_id*/,
								action: ()=>
								{
									globalThis.socket.emit( 'STORAGE_GET', [ sdContextMenu.current_target._net_id, net_id ] );
								}
							});
						}
					}
				}
				else
				if ( sdContextMenu.current_target.GetClass() === 'sdCharacter' )
				{
					if ( sdContextMenu.current_target.hea > 0 )
					{
					}
				}
				else
				if ( sdContextMenu.current_target.GetClass() === 'sdCommandCentre' )
				{
					if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdCom.action_range_command_centre ) >= 0 )
					{
						sdContextMenu.options.push({ title: 'Set as respawn point',
							action: ()=> { globalThis.socket.emit( 'CC_SET_SPAWN', [ sdContextMenu.current_target._net_id ] ); }
						});
					}
				
					sdContextMenu.options.push({ title: 'Reset respawn point',
						action: ()=>
						{
							globalThis.socket.emit( 'CC_SET_SPAWN', [ -1 ] );
						}
					});
				}
				else
				if ( sdContextMenu.current_target.GetClass() === 'sdCom' )
				{
					if ( sdWorld.inDist2D( sdWorld.my_entity.x, sdWorld.my_entity.y, sdContextMenu.current_target.x, sdContextMenu.current_target.y, sdCom.action_range ) >= 0 )
					{
						if ( sdContextMenu.current_target.subscribers.indexOf( sdWorld.my_entity._net_id ) === -1 )
						sdContextMenu.options.push({ title: 'Subscribe myself to network',
							action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, sdWorld.my_entity._net_id ] ); }
						});
					
						if ( sdContextMenu.current_target.subscribers.indexOf( 'sdCharacter' ) === -1 )
						sdContextMenu.options.push({ title: 'Subscribe all players',
							action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdCharacter' ] ); }
						});
					
						if ( sdContextMenu.current_target.subscribers.indexOf( 'sdCrystal' ) === -1 )
						sdContextMenu.options.push({ title: 'Subscribe all crystals',
							action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdCrystal' ] ); }
						});
					
						if ( sdContextMenu.current_target.subscribers.indexOf( 'sdCube' ) === -1 )
						sdContextMenu.options.push({ title: 'Subscribe all Cubes',
							action: ()=> { globalThis.socket.emit( 'COM_SUB', [ sdContextMenu.current_target._net_id, 'sdCube' ] ); }
						});
						
						for ( var i = 0; i < sdContextMenu.current_target.subscribers.length; i++ )
						{
							let net_id = sdContextMenu.current_target.subscribers[ i ];
							sdContextMenu.options.push({ title: 'Kick ' + sdEntity.GuessEntityName( net_id )/*user ' + net_id*/,
								action: ()=>
								{
									globalThis.socket.emit( 'COM_KICK', [ sdContextMenu.current_target._net_id, net_id ] );
								}
							});
						}
					}
					if ( sdContextMenu.current_target.subscribers.indexOf( sdWorld.my_entity._net_id ) !== -1 )
					sdContextMenu.options.push({ title: 'Unsubscribe from network',
						action: ()=>
						{
							globalThis.socket.emit( 'COM_UNSUB', sdContextMenu.current_target._net_id );
						}
					});
				}
				else
				sdContextMenu.current_target.PopulateContextOptions( sdWorld.my_entity );
			}
			
			if ( sdContextMenu.options.length > 0 )
			{
				sdContextMenu.open = true;
				sdContextMenu.x = sdWorld.mouse_screen_x;
				sdContextMenu.y = sdWorld.mouse_screen_y;

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
			ctx.translate( sdContextMenu.x, sdContextMenu.y );

			//let width = 180;
			let width = 260;

			ctx.fillStyle = 'rgb(0,0,0)';
			ctx.globalAlpha = 0.7;
			ctx.fillRect( 0, 0, width, ( sdContextMenu.options.length + 1 ) * ( 30 ) );
			ctx.globalAlpha = 1;

			sdContextMenu.potential_option = null;
			
			for ( var i = -1; i < sdContextMenu.options.length; i++ )
			{
				var t = '';
				if ( i === -1 )
				{
					t = sdContextMenu.current_target.title || sdContextMenu.current_target.GetClass().slice( 2 );
				}
				else
				{
					t = sdContextMenu.options[ i ].title;
				}
				
				if ( i >= 0 )
				if ( sdWorld.mouse_screen_x >= sdContextMenu.x )
				if ( sdWorld.mouse_screen_x < sdContextMenu.x + width )
				if ( sdWorld.mouse_screen_y >= sdContextMenu.y + ( i + 1 ) * 30 )
				if ( sdWorld.mouse_screen_y < sdContextMenu.y + ( i + 1 + 1 ) * 30 )
				{
					if ( sdContextMenu.potential_option === null )
					{
						sdContextMenu.potential_option = sdContextMenu.options[ i ];
						
						ctx.fillStyle = 'rgb(255,255,0)';
						ctx.globalAlpha = 0.3;
						ctx.fillRect( 1, ( i + 1 ) * 30 + 1, width-2, 28 );
						ctx.globalAlpha = 1;
					}
				}
				
				if ( i === -1 )
				ctx.fillStyle = '#66aaff';
				else
				ctx.fillStyle = '#ffffff';
				
				ctx.font = "12px Verdana";
				ctx.textAlign = 'left';
				
				ctx.fillText( t, 10, 20 + ( i + 1 ) * 30, width - 20 );
			}
		}
		ctx.restore();
	}
}
export default sdContextMenu;