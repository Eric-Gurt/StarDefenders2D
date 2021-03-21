

import sdWorld from '../sdWorld.js';


import sdEntity from '../entities/sdEntity.js';
import sdGun from '../entities/sdGun.js';
import sdBlock from '../entities/sdBlock.js';
import sdBG from '../entities/sdBG.js';
import sdTurret from '../entities/sdTurret.js';
import sdRenderer from './sdRenderer.js';
import sdContextMenu from './sdContextMenu.js';

class sdShop
{
	static init_class()
	{
		console.log('sdShop class initiated');
		
		sdShop.open = false;
		sdShop.options = [];
		
		sdShop.scroll_y = 0;
		sdShop.scroll_y_target = 0;
		
		sdShop.current_category = 'root'; // root category
		
		sdShop.max_y = 0;
		
		sdShop.options.push({ _class: null, image: 'return', _category:'!root',  _opens_category:'root' });
		sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, _category:'root', _opens_category:'Walls' });
		sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, material: sdBG.MATERIAL_PLATFORMS, _category:'root', _opens_category:'Background walls' });
		sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, _category:'root', _opens_category:'Doors' });
		sdShop.options.push({ _class: 'sdCom', _category:'root', _opens_category:'Base equipment' });
		sdShop.options.push({ _class: 'sdGun', class: sdGun.CLASS_RIFLE, _category:'root', _opens_category:'Equipment' });
		sdShop.options.push({ _class: null, image: 'vehicle', _category:'root', _opens_category:'Vehicles' });
		sdShop.options.push({ _class: null, image: 'upgrade', _category:'root', _opens_category:'upgrades' });
		
		if ( globalThis.isWin )
		sdShop.options.push({ _class: 'sdVirus', _category:'root', _opens_category:'Development tests' });
	
		sdShop.options.push({ _class: 'sdHover', _category:'Vehicles' });
		sdShop.options.push({ _class: 'sdHover', filter: 'hue-rotate(90deg) saturate(2)', _category:'Vehicles' });
		sdShop.options.push({ _class: 'sdHover', filter: 'hue-rotate(180deg) saturate(2)', _category:'Vehicles' });
		sdShop.options.push({ _class: 'sdHover', filter: 'hue-rotate(270deg) saturate(2)', _category:'Vehicles' });
		
		function AddBuildPack( filter, i )
		{
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, filter: filter, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, filter: filter, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, filter: filter, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, filter: filter, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, filter: filter, _category:'Walls' });
			
			//if ( i !== 0 )
			//{
				sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter + 'brightness(1.5)', material: sdBG.MATERIAL_PLATFORMS_COLORED, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter + 'brightness(1.5)', material: sdBG.MATERIAL_PLATFORMS_COLORED, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter + 'brightness(1.5)', material: sdBG.MATERIAL_PLATFORMS_COLORED, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter + 'brightness(1.5)', material: sdBG.MATERIAL_PLATFORMS_COLORED, _category:'Background walls' });
			//}
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
		
			AddBuildPack( filter, i );
			
			if ( i !== 6 )
			if ( i !== 7 )
			if ( i !== 8 )
			sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter, _category:'Doors' });
		}
		AddBuildPack( 'hue-rotate(-90deg) contrast(0.5) brightness(1.5) saturate(0)' );
			
		AddBuildPack( 'hue-rotate(-90deg) saturate(0)' );
		sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: 'saturate(0)', _category:'Doors' });

		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_GROUND, _category:'Walls' });
		sdShop.options.push({ _class: 'sdCom', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdTeleport', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdLamp', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdStorage', filter: 'saturate(0)', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdStorage', filter: 'none', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdStorage', filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdStorage', filter: 'hue-rotate(220deg)', _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdStorage', filter: 'hue-rotate(135deg)', _category:'Base equipment' });
		

		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_SHARP, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, material:sdBlock.MATERIAL_SHARP, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, material:sdBlock.MATERIAL_SHARP, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, material:sdBlock.MATERIAL_SHARP, _category:'Base equipment' });
		
		sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_LASER, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_ROCKET, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 / 2, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 * 2, _category:'Base equipment' });
		sdShop.options.push({ _class: 'sdCommandCentre', _category:'Base equipment' });
		
		for ( var i = 0; i < 3; i++ )
		{
			let filter = '';
			if ( i === 1 )
			filter = 'brightness(0.5)';
			if ( i === 2 )
			filter = 'brightness(1.5)';
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter, _category:'Background walls' });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter, _category:'Background walls' });
			sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter, _category:'Background walls' });
			sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter, _category:'Background walls' });
		}
		
		//sdShop.options.push({ _class: 'sdWater' });
		
		for ( var i = 0; i < sdGun.classes.length; i++ )
		if ( sdGun.classes[ i ].spawnable !== false )
		{
			sdShop.options.push({
				_class: 'sdGun',
				class: i, 
				_category:'Equipment'
			});
		}
		sdShop.options.push({ _class: 'sdBomb', _category:'Equipment' });
		
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
				max_level: 40,
				matter_cost: 45,
				action: ( character, level_purchased )=>
				{
					character.matter_max = Math.round( 50 + level_purchased * 45 ); // Max is 1850
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
			sdShop.options.push({ _class: null, matter_cost: sdShop.upgrades[ i ].matter_cost, upgrade_name: i, 
				_category:'upgrades' });
		}
		
		if ( globalThis.isWin ) // Lack of this check will probably allow creation of these entities even if category can not be opened in normal way
		{
			sdShop.options.push({ _class: 'sdOctopus', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdQuickie', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdVirus', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdCharacter', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdAsteroid', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdCube', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdCube', is_huge:true, _category:'Development tests' });
			sdShop.options.push({ _class: 'sdWater', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdAsp', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdSandWorm', _category:'Development tests' });
			sdShop.options.push({ _class: 'sdGrass', _category:'Development tests' });
		}
		
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
			
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.globalAlpha = 0.8;
		ctx.fillRect( 20, 20, sdRenderer.screen_width - 40, sdRenderer.screen_height - 40 );
		ctx.globalAlpha = 1;
		
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
			
			let current_shop_options = [];
			for ( var i = 0; i < sdShop.options.length; i++ )
			{
				if ( sdShop.options[ i ]._category === sdShop.current_category || 
					 ( sdShop.options[ i ]._category.charAt( 0 ) === '!' && sdShop.options[ i ]._category.substring( 1 ) !== sdShop.current_category ) ) // !root case
				{
					current_shop_options.push( sdShop.options[ i ] );
					sdShop.options[ i ]._main_array_index = i;
				}
			}
			
			for ( var i = 0; i < current_shop_options.length; i++ )
			{
				sdWorld.my_entity._build_params = current_shop_options[ i ];

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
					if ( typeof sdWorld.my_entity._build_params._opens_category !== 'undefined' )
					{
						matter_cost = 0;
					}
					else
					{
						matter_cost = sdWorld.my_entity._build_params.matter_cost;

						max_level = sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].max_level;
						cur_level = ( sdWorld.my_entity._upgrade_counters[ sdWorld.my_entity._build_params.upgrade_name ] || 0 );

						if ( cur_level >= max_level )
						selectable = false;
					}
				}
				else
				{
					ent = sdWorld.my_entity.CreateBuildObject( false );
					ent.x = -100;
					ent.y = 0;

					if ( typeof sdWorld.my_entity._build_params._opens_category !== 'undefined' )
					{
						matter_cost = 0;
					}
					else
					matter_cost = ent.MeasureMatterCost();
				}

				if ( selectable )
				{
					ctx.globalAlpha = 0.2;
					if ( sdWorld.my_entity.matter >= matter_cost )
					{
						ctx.fillStyle = 'rgb(0,255,0)';
					}
					else
					{
						ctx.fillStyle = 'rgb(255,0,0)';
					}

					if ( sdWorld.mouse_screen_x >= xx - 10 )
					if ( sdWorld.mouse_screen_x < xx + 64 + 10 )
					if ( sdWorld.mouse_screen_y >= yy - 10 )
					if ( sdWorld.mouse_screen_y < yy + 64 + 10 )
					if ( sdShop.potential_selection === -1 )
					{
						sdShop.potential_selection = sdWorld.my_entity._build_params._main_array_index; // i;
						
						ctx.fillStyle = 'rgb(255,255,0)';
						ctx.globalAlpha = 0.3;
					}
					ctx.fillRect( -5,-5, 32+10,32+10 );
					ctx.globalAlpha = 1;
				}

				

				if ( sdWorld.my_entity._build_params._cache )
				{
					ctx.drawImage( sdWorld.my_entity._build_params._cache, 0,0 );
				}
				else
				{
					var canvas = document.createElement('canvas');
					canvas.width  = 32;
					canvas.height = 32;
					
					let ctx2 = canvas.getContext("2d");
					sdRenderer.AddCacheDrawMethod( ctx2 );
					
					ctx2.imageSmoothingEnabled = false;
					
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
					if ( sdWorld.my_entity._build_params.image )
					{
						if ( !sdWorld.my_entity._build_params.image_obj )
						{
							let obj = sdWorld.my_entity._build_params;
							sdWorld.my_entity._build_params.image_obj = sdWorld.CreateImageFromFile( sdWorld.my_entity._build_params.image, ()=>
							{
								obj._cache = null;
							});
						}
					
						ctx2.drawImage( sdWorld.my_entity._build_params.image_obj, 0,0, 32,32 );
					}
					else
					{
						ctx2.drawImage( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].image, 0,0, 32,32 );
					}
					
					sdWorld.my_entity._build_params._cache = canvas;
				}
				
				if ( ent )
				{
					ctx.translate( 16 - ( ent.hitbox_x2 + ent.hitbox_x1 ) / 2, 16 - ( ent.hitbox_y2 + ent.hitbox_y1 ) / 2 );
					
					ent.remove();
					ent._remove();
				}
				
				
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
		
		if ( sdShop.potential_selection !== -1 )	
		{
			const capitalize = (s) => {
				if (typeof s !== 'string') return '';
				return s.charAt(0).toUpperCase() + s.slice(1);
			};

			ctx.font = "12px Verdana";
			
			let t = 'No description for ' + JSON.stringify( sdShop.options[ sdShop.potential_selection ] );
			
			if ( sdShop.options[ sdShop.potential_selection ]._opens_category )
			{
				if ( sdShop.options[ sdShop.potential_selection ]._opens_category === 'root' )
				t = 'Click to leave this category';
				else
				t = 'Click to enter category "' + sdShop.options[ sdShop.potential_selection ]._opens_category + '"';
			}
			else
			{
				if ( sdShop.options[ sdShop.potential_selection ]._class !== null )
				{
					let c = sdShop.options[ sdShop.potential_selection ]._class.slice( 2 );
					
					if ( c === 'BG' )
					c = 'Background wall';
					else
					c = c.replace(/([A-Z])/g, ' $1').trim();
				
					if ( c === 'Block' )
					{
						if ( sdShop.options[ sdShop.potential_selection ].material === sdBlock.MATERIAL_WALL )
						c = 'Wall';
						if ( sdShop.options[ sdShop.potential_selection ].material === sdBlock.MATERIAL_GROUND )
						c = 'Ground';
						if ( sdShop.options[ sdShop.potential_selection ].material === sdBlock.MATERIAL_SHARP )
						c = 'Trap';
					}
				
					if ( c === 'Gun' )
					if ( sdGun.classes[ sdShop.options[ sdShop.potential_selection ].class ].title )
					c = sdGun.classes[ sdShop.options[ sdShop.potential_selection ].class ].title;
					
					t = 'Click to select "' + c + '" as a build object. Then click to place this object in world.';
				}
				else
				if ( sdShop.options[ sdShop.potential_selection ].upgrade_name )
				t = 'Click to select "' + capitalize( sdShop.options[ sdShop.potential_selection ].upgrade_name.split('_').join(' ') ) + '" as an upgrade. Then click anywhere to upgrade.';
				
			}
			
			let d = ctx.measureText( t );
			
			ctx.fillStyle = '#000000';
			ctx.globalAlpha = 0.8;
			ctx.fillRect( sdWorld.mouse_screen_x + 16, sdWorld.mouse_screen_y + 32, d.width + 10, 12 + 10 );
			ctx.globalAlpha = 1;
			
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText( t, sdWorld.mouse_screen_x + 16 + 5, sdWorld.mouse_screen_y + 32 + 12 + 5 );
		}

		
		sdWorld.my_entity._build_params = old_active_build_settings;
	}
	static MouseDown( e )
	{
		if ( sdShop.open )
		{
			if ( !sdWorld.my_entity )
			{
				sdShop.open = false;
				return false;
			}
			
			let selected = true;
				
			if ( e.which === 1 )
			{
				//
				if ( sdShop.potential_selection === -1 )
				{
					sdWorld.my_entity._build_params = null;
				}
				else
				{
					if ( sdShop.options[ sdShop.potential_selection ]._opens_category )
					{
						sdShop.current_category = sdShop.options[ sdShop.potential_selection ]._opens_category;
						selected = false;
					}
					else
					sdWorld.my_entity._build_params = sdShop.options[ sdShop.potential_selection ];
				}
				
				if ( selected )
				globalThis.socket.emit( 'BUILD_SEL', sdShop.potential_selection );
			}
			
			if ( selected )
			{
				sdShop.open = false;
				sdRenderer.UpdateCursor();
			}
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