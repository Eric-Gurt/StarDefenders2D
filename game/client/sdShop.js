

import sdWorld from '../sdWorld.js';


import sdEntity from '../entities/sdEntity.js';
import sdGun from '../entities/sdGun.js';
import sdBlock from '../entities/sdBlock.js';
import sdRenderer from './sdRenderer.js';
import sdContextMenu from './sdContextMenu.js';

class sdShop
{
	static init_class()
	{
		console.warn('sdShop class initiated');
		
		sdShop.open = false;
		sdShop.options = [];
		
		sdShop.scroll_y = 0;
		sdShop.scroll_y_target = 0;
		
		sdShop.max_y = 0;
		
		function AddBuildPack( filter )
		{
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, filter: filter });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, filter: filter });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, filter: filter });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, filter: filter });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, filter: filter });
		}
		
		for ( var i = 0; i < 11; i++ )
		{
			var filter = ( i === 0 ) ? '' : 'hue-rotate('+(~~(i/12*360))+'deg)';
			
			if ( i === 6 )
			filter += ' saturate(60)';
			if ( i === 7 )
			filter += ' saturate(10)';
			if ( i === 8 )
			filter += ' saturate(4)';
			if ( i === 10 )
			filter += ' saturate(2)';
			//if ( i === 11 )
			//filter += ' saturate(2)';
		
			AddBuildPack( filter );
			
			if ( i !== 6 )
			if ( i !== 7 )
			if ( i !== 8 )
			sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter });
		}
		AddBuildPack( 'hue-rotate(-90deg) contrast(0.5) brightness(1.5) saturate(0)' );
			
		AddBuildPack( 'hue-rotate(-90deg) saturate(0)' );
		sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: 'saturate(0)' });

		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_GROUND });
		sdShop.options.push({ _class: 'sdCom' });
		sdShop.options.push({ _class: 'sdTeleport' });
		sdShop.options.push({ _class: 'sdAntigravity' });
		

		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_SHARP });
		sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, material:sdBlock.MATERIAL_SHARP });
		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, material:sdBlock.MATERIAL_SHARP });
		sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, material:sdBlock.MATERIAL_SHARP });
		
		sdShop.options.push({ _class: 'sdTurret' });
		sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 });
		
		for ( var i = 0; i < 3; i++ )
		{
			let filter = '';
			if ( i === 1 )
			filter = 'brightness(0.5)';
			if ( i === 2 )
			filter = 'brightness(1.5)';
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter });
			sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter });
			sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter });
		}
		
		//sdShop.options.push({ _class: 'sdWater' });
		
		for ( var i = 0; i < sdGun.classes.length; i++ )
		if ( sdGun.classes[ i ].spawnable !== false )
		{
			sdShop.options.push({
				_class: 'sdGun',
				class: i//sdGun.classes[ i ]
			});
		}
		
		sdShop.upgrades = {
			upgrade_suit:
			{
				max_level: 3,
				matter_cost: 120,
				action: ( character, level_purchased )=>
				{
					character.hmax = Math.round( 130 + level_purchased / 3 * 120 );
				}
			},
			upgrade_damage:
			{
				max_level: 3,
				matter_cost: 100,
				action: ( character, level_purchased )=>
				{
					character._damage_mult = 1 + level_purchased / 3 * 1;
				}
			},
			upgrade_build_hp:
			{
				max_level: 3,
				matter_cost: 120,
				action: ( character, level_purchased )=>
				{
					character._build_hp_mult = 1 + level_purchased / 3 * 3;
				}
			},
			upgrade_energy:
			{
				max_level: 20,
				matter_cost: 1 / 10 * 450,
				action: ( character, level_purchased )=>
				{
					character.matter_max = Math.round( 50 + level_purchased / 10 * 450 );
				}
			},
			upgrade_hook:
			{
				max_level: 1,
				matter_cost: 75,
				action: ( character, level_purchased )=>
				{
					character._hook_allowed = true;
				}
			},
			upgrade_jetpack:
			{
				max_level: 1,
				matter_cost: 75,
				action: ( character, level_purchased )=>
				{
					character._jetpack_allowed = true;
				}
			},
			upgrade_invisibility:
			{
				max_level: 1,
				matter_cost: 150,
				action: ( character, level_purchased )=>
				{
					character._ghost_allowed = true;
				}
			},
			upgrade_coms:
			{
				max_level: 1,
				matter_cost: 75,
				action: ( character, level_purchased )=>
				{
					character._coms_allowed = true;
				}
			}
		};
		for ( var i in sdShop.upgrades )
		{
			sdShop.upgrades[ i ].image = sdWorld.CreateImageFromFile( i );
			sdShop.options.push({ _class: null, matter_cost: sdShop.upgrades[ i ].matter_cost, upgrade_name: i });
		}
		
		
		sdShop.options.push({ _class: 'sdOctopus' });
		sdShop.options.push({ _class: 'sdQuickie' });
		sdShop.options.push({ _class: 'sdVirus' });
		sdShop.options.push({ _class: 'sdCharacter' });
		
		sdShop.potential_selection = -1;
	}
	static Draw( ctx )
	{
		if ( !sdWorld.my_entity )
		{
			sdShop.open = false;
			return;
		}
		
		let old_active_build_settings = sdWorld.my_entity._build_params;
			
		ctx.fillStyle = 'rgba(0,0,0,0.8)';
		ctx.fillRect( 20, 20, sdRenderer.screen_width - 40, sdRenderer.screen_height - 40 );
		
		ctx.save();
		{
			let region = new Path2D();
			region.rect(20, 20, sdRenderer.screen_width - 40, sdRenderer.screen_height - 40);
			ctx.clip(region, "evenodd");

			if ( sdShop.scroll_y_target < -( sdShop.max_y + 80 + 25 ) + sdRenderer.screen_height * 1 )
			sdShop.scroll_y_target = -( sdShop.max_y + 80 + 25 ) + sdRenderer.screen_height * 1;

			if ( sdShop.scroll_y_target > 0 )
			sdShop.scroll_y_target = 0;
		
			//sdShop.max_y

			//if ( sdShop.scroll_y_target < -( Math.ceil( sdShop.options.length / 7 ) * ( 32 + 16 ) * 2 ) + sdRenderer.screen_height - 50 )
			//sdShop.scroll_y_target = -( Math.ceil( sdShop.options.length / 7 ) * ( 32 + 16 ) * 2 ) + sdRenderer.screen_height - 50;

			sdShop.scroll_y = sdWorld.MorphWithTimeScale( sdShop.scroll_y, sdShop.scroll_y_target, 0.5, 1 );

			let xx = 40;
			let yy = 40 + sdShop.scroll_y;

			sdShop.potential_selection = -1;

			for ( var i = 0; i < sdShop.options.length; i++ )
			{
				sdWorld.my_entity._build_params = sdShop.options[ i ];

				ctx.save();
				ctx.translate( xx, yy );
				ctx.scale( 2, 2 );

				let matter_cost = Infinity;

				let ent = null;

				let selectable = true;
				let max_level = 0;
				let cur_level = 0;

				if ( sdWorld.my_entity._build_params._class === null )
				{
					matter_cost = sdWorld.my_entity._build_params.matter_cost;

					max_level = sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].max_level;
					cur_level = ( sdWorld.my_entity._upgrade_counters[ sdWorld.my_entity._build_params.upgrade_name ] || 0 );

					if ( cur_level >= max_level )
					selectable = false;
				}
				else
				{
					ent = sdWorld.my_entity.CreateBuildObject( false );
					ent.x = -100;
					ent.y = 0;

					matter_cost = ent.MeasureMatterCost();
				}

				if ( selectable )
				{
					if ( sdWorld.my_entity.matter >= matter_cost )
					ctx.fillStyle = 'rgba(0,255,0,0.2)';
					else
					ctx.fillStyle = 'rgba(255,0,0,0.2)';

					if ( sdWorld.mouse_screen_x >= xx - 10 )
					if ( sdWorld.mouse_screen_x < xx + 64 + 10 )
					if ( sdWorld.mouse_screen_y >= yy - 10 )
					if ( sdWorld.mouse_screen_y < yy + 64 + 10 )
					if ( sdShop.potential_selection === -1 )
					{
						sdShop.potential_selection = i;
						ctx.fillStyle = 'rgba(255,255,0,0.3)';
					}
					ctx.fillRect( -5,-5, 32+10,32+10 );
				}

				

				if ( sdShop.options[ i ]._cache )
				{
					ctx.drawImage( sdShop.options[ i ]._cache, 0,0 );
				}
				else
				{
					var canvas = document.createElement('canvas');
					canvas.width  = 32;
					canvas.height = 32;
					
					let ctx2 = canvas.getContext("2d");
					sdRenderer.AddCacheDrawMethod( ctx2 );
					
					if ( ent )
					{
						ctx2.translate( ~~( 16 - ( ent.hitbox_x2 + ent.hitbox_x1 ) / 2 ), 
										~~( 16 - ( ent.hitbox_y2 + ent.hitbox_y1 ) / 2 ) );

						ctx2.save();
						ent.DrawBG( ctx2, false );
						ctx2.restore();
						
						ctx2.save();
						ent.Draw( ctx2, false );
						ctx2.restore();
						
						ctx2.save();
						ent.DrawFG( ctx2, false );
						ctx2.restore();
					}
					else
					{
						ctx2.drawImage( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].image, 0,0, 32,32 );
					}
					
					sdShop.options[ i ]._cache = canvas;
				}
				
				if ( ent )
				{
					ctx.translate( 16 - ( ent.hitbox_x2 + ent.hitbox_x1 ) / 2, 16 - ( ent.hitbox_y2 + ent.hitbox_y1 ) / 2 );
					
					ent.remove();
					ent._remove();
				}
				
				/*if ( ent )
				{
					ctx.translate( 16 - ( ent.hitbox_x2 + ent.hitbox_x1 ) / 2, 16 - ( ent.hitbox_y2 + ent.hitbox_y1 ) / 2 );
					
					ctx.save();
					ent.DrawBG( ctx, false );
					ctx.restore();
					ent.Draw( ctx );

					ent.remove();
					ent._remove();
				}
				else
				{
					ctx.drawImage( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].image, 0,0, 32,32 );
				}*/

				if ( max_level > 0 )
				{
					ctx.fillStyle = '#ffffff';
					ctx.font = "4.5px Verdana";
					ctx.textAlign = 'right';
					ctx.fillText( cur_level + " / " + max_level, 32, 32 );
				}

				ctx.restore();

				xx += ( 32 + 16 ) * 2;
				if ( xx + ( 32 ) * 2 > sdRenderer.screen_width - 40 )
				{
					xx = 40;
					yy += ( 32 + 16 ) * 2;
				}
			}
			
			sdShop.max_y = yy - sdShop.scroll_y;
		}
		ctx.restore();
		
		sdWorld.my_entity._build_params = old_active_build_settings;
	}
	static MouseDown( e )
	{
		if ( sdShop.open )
		{
			if ( e.which === 1 )
			{
				//
				if ( sdShop.potential_selection === -1 )
				{
					sdWorld.my_entity._build_params = null;
				}
				else
				sdWorld.my_entity._build_params = sdShop.options[ sdShop.potential_selection ];
				
				globalThis.socket.emit( 'BUILD_SEL', sdShop.potential_selection );
			}
			
			sdShop.open = false;
			sdRenderer.UpdateCursor();
			return true; // Block input
		}
		else
		{
			if ( e.which === 3 )
			if ( !sdContextMenu.open )
			if ( sdWorld.my_entity )
			if ( sdWorld.my_entity.hea > 0 )
			if ( sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ] )
			if ( sdGun.classes[ sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].class ].is_build_gun )
			{
				sdShop.open = true;
				sdRenderer.UpdateCursor();
				return true; // Block input
			}
		}
		return false; // Allow input
	}
	static MouseWheel( e )
	{
		//sdShop.scroll_y -= e.deltaY;
		sdShop.scroll_y_target -= e.deltaY;
	}
}
//sdShop.init_class();

export default sdShop;