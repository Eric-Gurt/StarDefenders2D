

import sdWorld from '../sdWorld.js';


import sdEntity from '../entities/sdEntity.js';
import sdGun from '../entities/sdGun.js';
import sdBlock from '../entities/sdBlock.js';
import sdCrystal from '../entities/sdCrystal.js';
import sdBG from '../entities/sdBG.js';
import sdTurret from '../entities/sdTurret.js';
import sdArea from '../entities/sdArea.js';
import sdWater from '../entities/sdWater.js';
import sdDoor from '../entities/sdDoor.js';
import sdCaption from '../entities/sdCaption.js';
import sdGib from '../entities/sdGib.js'
import sdRescueTeleport from '../entities/sdRescueTeleport.js';
import sdFactionSpawner from '../entities/sdFactionSpawner.js';
import sdStorageTank from '../entities/sdStorageTank.js';

import sdRenderer from './sdRenderer.js';
import sdContextMenu from './sdContextMenu.js';


class sdShop
{
	static init_class()
	{
		console.log('sdShop class initiated');
		
		sdShop.open = false;
		sdShop.options = [];
		sdShop.options_snappack = null; // Generated on very first connection. It means shop items can not be changed after world initialization, but not only because of that (shop data is sent only once per connection)
		
		sdShop.scroll_y = 0;
		sdShop.scroll_y_target = 0;
		
		sdShop.current_category = 'root'; // root category
		
		sdShop.max_y = 0;
		
		sdShop.isDrawing = false;
		
		sdShop.potential_selection = -1;
		
		if ( sdWorld.is_server )
		{
			sdShop.options.push({ _class: null, image: 'return', _category:'!root',  _opens_category:'root' });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, _category:'root', _opens_category:'Walls' });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, material: sdBG.MATERIAL_PLATFORMS, _category:'root', _opens_category:'Background walls' });
			sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, _category:'root', _opens_category:'Doors' });
			sdShop.options.push({ _class: 'sdCom', variation:1, _category:'root', _opens_category:'Base equipment' });
			sdShop.options.push({ _class: 'sdGun', class: sdGun.CLASS_RIFLE, _category:'root', _opens_category:'Equipment' });
			sdShop.options.push({ _class: null, image: 'vehicle', _category:'root', _opens_category:'Vehicles' });
			sdShop.options.push({ _class: null, image: 'upgrade', _category:'root', _opens_category:'Upgrades' });
			sdShop.options.push({ _class: 'sdGun', class: sdGun.CLASS_POPCORN, _category:'root', _opens_category:'Other' });
			sdShop.options.push({ _class: null, image: 'com_red', _category:'root', _godmode_only: true, _opens_category:'Admin tools' }); // Cost of Infinity is what actually prevents items here from being accessible to non-in-godmode-admins

			//if ( globalThis.isWin )
			sdShop.options.push({ _class: 'sdVirus', _category:'root', _godmode_only: true, _opens_category:'Development tests' });

			sdShop.options.push({ _class: 'sdBall', _category:'Other' });
			sdShop.options.push({ _class: 'sdBall', type: 1, _category:'Other' });
			sdShop.options.push({ _class: 'sdTheatre', _category:'Other' });
			sdShop.options.push({ _class: 'sdBeamProjector', _category:'Other', _min_build_tool_level: 25 });

			sdShop.options.push({ _class: 'sdHover', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', filter: 'hue-rotate(90deg) saturate(2)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', filter: 'hue-rotate(180deg) saturate(2)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', filter: 'hue-rotate(270deg) saturate(2)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', type: 1, _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', type: 1, filter: 'hue-rotate(90deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', type: 1, filter: 'hue-rotate(180deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', type: 1, filter: 'hue-rotate(270deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', type: 2, _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdHover', type: 2, filter: 'hue-rotate(90deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdHover', type: 2, filter: 'hue-rotate(180deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdHover', type: 2, filter: 'hue-rotate(270deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdLifeBox', _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdQuadro', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(300deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(270deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(210deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(140deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'saturate(0) brightness(1.5)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'saturate(0) brightness(0.5)', _category:'Vehicles' });
			//sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'saturate(0) brightness(1.5)', _category:'Vehicles' });
			//sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'saturate(0) brightness(0.5)', _category:'Vehicles' });
			//sdShop.options.push({ _class: 'sdHoverBike', filter: 'saturate(0) brightness(1.5)', _category:'Vehicles' });
			//sdShop.options.push({ _class: 'sdHoverBike', filter: 'saturate(0) brightness(0.5)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'hue-rotate(300deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'hue-rotate(270deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'hue-rotate(210deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'hue-rotate(140deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'saturate(0) brightness(1.5)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', type: 3, filter: 'saturate(0) brightness(0.5)', _category:'Vehicles' });

			//ctx.filter = '' // yellow
			//ctx.filter = '' // redish
			//ctx.filter = '' // pink
			//ctx.filter = '' // blueish
			//ctx.filter = '' // white
			//ctx.filter = '' // black

			function AddBuildPack( filter )
			{
				for ( let i2 = 0; i2 < 3; i2++ )
				{
					let material = sdBlock.MATERIAL_WALL;

					let _reinforced_level = 0;

					let _min_build_tool_level = 0;

					let texture_id = sdBlock.TEXTURE_ID_WALL; // sdBG.TEXTURE_PLATFORMS_COLORED;

					if ( i2 === 1 )
					{
						_min_build_tool_level = 7;
						_reinforced_level = 1;
						material = sdBlock.MATERIAL_REINFORCED_WALL_LVL1;
						texture_id = sdBlock.TEXTURE_ID_REINFORCED_LVL1;
					}

					if ( i2 === 2 )
					{
						_min_build_tool_level = 16;
						_reinforced_level = 2;
						material = sdBlock.MATERIAL_REINFORCED_WALL_LVL2; // We probably no longer need 2 kinds of these if we could just switch texture
						texture_id = sdBlock.TEXTURE_ID_REINFORCED_LVL2;
					}

					sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 8, height: 16, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
				}
				/*
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL1, _reinforced_level: 1, _category:'Walls', _min_build_tool_level: 7 });
				sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL1, _reinforced_level: 1, _category:'Walls', _min_build_tool_level: 7 });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL1, _reinforced_level: 1, _category:'Walls', _min_build_tool_level: 7 });
				sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL1, _reinforced_level: 1, _category:'Walls', _min_build_tool_level: 7 });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL1, _reinforced_level: 1, _category:'Walls', _min_build_tool_level: 7 });

				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL2, _reinforced_level: 2, _category:'Walls', _min_build_tool_level: 16 });
				sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL2, _reinforced_level: 2, _category:'Walls', _min_build_tool_level: 16 });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL2, _reinforced_level: 2, _category:'Walls', _min_build_tool_level: 16 });
				sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL2, _reinforced_level: 2, _category:'Walls', _min_build_tool_level: 16 });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, filter: filter, material: sdBlock.MATERIAL_REINFORCED_WALL_LVL2, _reinforced_level: 2, _category:'Walls', _min_build_tool_level: 16 });
				*/
				//if ( i !== 0 )
				//{
					sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });
					sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });
					sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });
					sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });

					sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
					sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
					sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
					sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
				//}
			}

			/*for ( var i = 0; i < 11; i++ )
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
				{
					sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter, _category:'Doors' });
					//var filter = ( i === 0 ) ? '' : 'hue-rotate('+(~~(i/12*360))+'deg) contrast(0.75)';
					sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter, model: sdDoor.MODEL_ARMORED, _reinforced_level: 1, _category:'Doors', _min_build_tool_level: 7 });
					sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter, model: sdDoor.MODEL_ARMORED_LVL2, _reinforced_level: 2, _category:'Doors', _min_build_tool_level: 16 });
				}
			}*/
			for ( var i = 0; i < 20; i++ )
			{
				/*
					0 good
					1 bad
					2 good
					3 bad
					4 good 
					5 bad
					6 good
					7 bad
					8 bad
					9 good
					10 good
					11 good
					12 bad
					13 good
					14 bad
					15 good
					16 bad
					17 good
					18 good
					19 bad
				*/

				if ( [
					1, 
					3, 
					5, 
					7, 
					8, 
					12,
					14,
					16,
					19 ].indexOf( i ) !== -1 )
				continue;

				var filter = ( i === 0 ) ? '' : 'hue-rotate('+(~~(i/20*360))+'deg)';
				AddBuildPack( filter, i );

				sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter, model: sdDoor.MODEL_ARMORED, _reinforced_level: 1, _category:'Doors', _min_build_tool_level: 7 });
				sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: filter, model: sdDoor.MODEL_ARMORED_LVL2, _reinforced_level: 2, _category:'Doors', _min_build_tool_level: 16 });
			}

			AddBuildPack( 'hue-rotate( 105deg) brightness(0.7)' );
			AddBuildPack( 'hue-rotate(-90deg) brightness(1.5) saturate(0)' );
			AddBuildPack( 'saturate(0) brightness(8)' );
			AddBuildPack( 'hue-rotate(-90deg) contrast(0.5) brightness(1.5) saturate(0)' );
			// People seemed to ask for those 4 ^ - Booraz149

			for ( let br = 50; br <= 150; br += 50 )
			for ( let i = sdBlock.TEXTURE_ID_PORTAL; i <= sdBlock.TEXTURE_ID_GREY; i++ )
			if ( br === 100 || i === sdBlock.TEXTURE_ID_GREY )
			{
				sdShop.options.push({ _class: 'sdBlock', br:br, width: 16, height: 16, texture_id: i, _category:'Walls' });
				sdShop.options.push({ _class: 'sdBlock', br:br, width: 32, height: 16, texture_id: i, _category:'Walls' });
				sdShop.options.push({ _class: 'sdBlock', br:br, width: 16, height: 32, texture_id: i, _category:'Walls' });
				sdShop.options.push({ _class: 'sdBlock', br:br, width: 32, height: 32, texture_id: i, _category:'Walls' });
				sdShop.options.push({ _class: 'sdBlock', br:br, width: 16, height: 8, texture_id: i, _category:'Walls' });
				sdShop.options.push({ _class: 'sdBlock', br:br, width: 8, height: 16, texture_id: i, _category:'Walls' });
				if ( i === sdBlock.TEXTURE_ID_GLASS )
				{
					sdShop.options.push({ _class: 'sdBlock', br:br, width: 32, height: 8, texture_id: i, _category:'Walls' });
					sdShop.options.push({ _class: 'sdBlock', br:br, width: 8, height: 32, texture_id: i, _category:'Walls' });
				}
			}

			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 16, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 32, height: 16, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 32, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 32, height: 32, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 8, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 8, height: 16, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });

			sdShop.options.push({ _class: 'sdBlock', br:100, hue:34, width: 16, height: 16, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, hue:34, width: 32, height: 16, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, hue:34, width: 16, height: 32, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, hue:34, width: 32, height: 32, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, hue:34, width: 16, height: 8, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, hue:34, width: 8, height: 16, texture_id: sdBlock.TEXTURE_ID_WHITE_BRICK, _category:'Walls' });

			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 16, texture_id: sdBlock.TEXTURE_ID_DARK_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 32, height: 16, texture_id: sdBlock.TEXTURE_ID_DARK_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 32, texture_id: sdBlock.TEXTURE_ID_DARK_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 32, height: 32, texture_id: sdBlock.TEXTURE_ID_DARK_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 8, texture_id: sdBlock.TEXTURE_ID_DARK_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 8, height: 16, texture_id: sdBlock.TEXTURE_ID_DARK_BRICK, _category:'Walls' });

			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 16, texture_id: sdBlock.TEXTURE_ID_FULL_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 32, height: 16, texture_id: sdBlock.TEXTURE_ID_FULL_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 32, texture_id: sdBlock.TEXTURE_ID_FULL_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 32, height: 32, texture_id: sdBlock.TEXTURE_ID_FULL_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 16, height: 8, texture_id: sdBlock.TEXTURE_ID_FULL_WHITE_BRICK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', br:100, width: 8, height: 16, texture_id: sdBlock.TEXTURE_ID_FULL_WHITE_BRICK, _category:'Walls' });



			sdShop.options.push({ _class: 'sdDoor', width: 32, height: 32, filter: 'saturate(0)', _category:'Doors' });

			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_GROUND, _category:'Walls' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_ROCK, _category:'Walls' });
			sdShop.options.push({ _class: 'sdCom', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdCom', variation: 1, _category:'Base equipment', _min_build_tool_level:2 });
			sdShop.options.push({ _class: 'sdCom', variation: 2, _category:'Base equipment', _min_build_tool_level:4 });
			sdShop.options.push({ _class: 'sdCom', variation: 3, _category:'Base equipment', _min_build_tool_level:6 });
			sdShop.options.push({ _class: 'sdCom', variation: 4, _category:'Base equipment', _min_build_tool_level:8 });
			sdShop.options.push({ _class: 'sdCom', variation: 5, _category:'Base equipment', _min_build_tool_level:10 });
			sdShop.options.push({ _class: 'sdCom', variation: 6, _category:'Base equipment', _min_build_tool_level:12 });
			sdShop.options.push({ _class: 'sdCom', variation: 7, _category:'Base equipment', _min_build_tool_level:14 });
			sdShop.options.push({ _class: 'sdTeleport', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdLamp', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', filter: 'saturate(0)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', filter: 'none', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', filter: 'hue-rotate(220deg)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', filter: 'hue-rotate(135deg)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'saturate(0)', _category:'Base equipment', _min_build_tool_level: 1 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'none', _category:'Base equipment', _min_build_tool_level: 1 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment', _min_build_tool_level: 1 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'hue-rotate(220deg)', _category:'Base equipment', _min_build_tool_level: 1 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'hue-rotate(135deg)', _category:'Base equipment', _min_build_tool_level: 1 });
			sdShop.options.push({ _class: 'sdStorage', type: 2, filter: 'saturate(0)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 2, filter: 'none', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 2, filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 2, filter: 'hue-rotate(220deg)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 2, filter: 'hue-rotate(135deg)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 3, filter: 'saturate(0)', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdStorage', type: 3, filter: 'none', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdStorage', type: 3, filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdStorage', type: 3, filter: 'hue-rotate(220deg)', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdStorage', type: 3, filter: 'hue-rotate(135deg)', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdNode', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdNode', type:1, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdNode', type:2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', multiplier: 2, _min_build_tool_level: 3, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', multiplier: 4, _min_build_tool_level: 9, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', multiplier: 8, _min_build_tool_level: 18, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdWeaponBench', _category:'Base equipment' });

			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_SHARP, texture_id:0, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, material:sdBlock.MATERIAL_SHARP, texture_id:0, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, material:sdBlock.MATERIAL_SHARP, texture_id:0, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, material:sdBlock.MATERIAL_SHARP, texture_id:0, _category:'Base equipment' });

			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_SHARP, texture_id:1, _category:'Base equipment', _min_build_tool_level: 5 });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, material:sdBlock.MATERIAL_SHARP, texture_id:1, _category:'Base equipment', _min_build_tool_level: 5 });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, material:sdBlock.MATERIAL_SHARP, texture_id:1, _category:'Base equipment', _min_build_tool_level: 5 });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, material:sdBlock.MATERIAL_SHARP, texture_id:1, _category:'Base equipment', _min_build_tool_level: 5 });

			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_TRAPSHIELD, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, material:sdBlock.MATERIAL_TRAPSHIELD, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdBlock', width: 8, height: 16, material:sdBlock.MATERIAL_TRAPSHIELD, _category:'Base equipment' });

			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_LASER, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_ROCKET, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_RAPID_LASER, _category:'Base equipment', _min_build_tool_level: 6 });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_SNIPER, _category:'Base equipment', _min_build_tool_level: 13 });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_FREEZER, _category:'Base equipment', _min_build_tool_level: 15 });
			sdShop.options.push({ _class: 'sdManualTurret', _category:'Base equipment', _min_build_tool_level: 20 });
			/*sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 / 2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 * 2, _category:'Base equipment' });*/
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 * 2 * 2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 * 2 * 2 * 2, _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 2, _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 4, _category:'Base equipment', _min_build_tool_level: 9 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 8, _category:'Base equipment', _min_build_tool_level: 18 });
			sdShop.options.push({ _class: 'sdStorageTank', _category:'Base equipment', });
			sdShop.options.push({ _class: 'sdStorageTank', type: sdStorageTank.TYPE_PORTABLE, _category:'Base equipment', });
			sdShop.options.push({ _class: 'sdEssenceExtractor', _category:'Base equipment', });
			sdShop.options.push({ _class: 'sdCommandCentre', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdLongRangeTeleport', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdCrystalCombiner', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdCrystalCombiner', type: 1, _min_workbench_level: 3, _category:'Base equipment' });

			if ( sdWorld.server_config.allow_rescue_teleports )
			{
				sdShop.options.push({ _class: 'sdRescueTeleport', type: sdRescueTeleport.TYPE_SHORT_RANGE, _category:'Base equipment'});
				sdShop.options.push({ _class: 'sdRescueTeleport', _category:'Base equipment', _min_build_tool_level: 10 });
				sdShop.options.push({ _class: 'sdRescueTeleport', type: sdRescueTeleport.TYPE_CLONER, _category:'Base equipment', _min_build_tool_level: 20 });
			}
			if ( sdWorld.server_config.allowed_base_shielding_unit_types === null )
			{
				sdShop.options.push({ _class: 'sdBaseShieldingUnit', type:0, _category:'Base equipment' });
				sdShop.options.push({ _class: 'sdBaseShieldingUnit', type:1, _category:'Base equipment' });
				sdShop.options.push({ _class: 'sdBaseShieldingUnit', type:2, _category:'Base equipment' });
				sdShop.options.push({ _class: 'sdBaseShieldingUnit', type:3, _category:'Base equipment' });
			}
			else
			{
				for ( let i = 0; i < sdWorld.server_config.allowed_base_shielding_unit_types.length; i++ )
				sdShop.options.push({ _class: 'sdBaseShieldingUnit', type:sdWorld.server_config.allowed_base_shielding_unit_types[ i ], _category:'Base equipment' });
			}
			sdShop.options.push({ _class: 'sdConveyor', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdConveyor', filter:'sepia(1) saturate(2) hue-rotate(30deg) brightness(0.8)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdConveyor', filter:'sepia(1) saturate(1.5) hue-rotate(170deg) brightness(0.7)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdConveyor', filter:'sepia(1) saturate(2) hue-rotate(220deg) brightness(0.7)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdConveyor', filter:'sepia(1) saturate(1.7) hue-rotate(300deg) brightness(0.7)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdBeacon', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSteeringWheel', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdThruster', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdThruster', filter: 'hue-rotate(90deg) saturate(2)', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdThruster', filter: 'hue-rotate(180deg) saturate(2)', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdThruster', filter: 'hue-rotate(270deg) saturate(2)', _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdCamera', _category:'Base equipment', _min_build_tool_level: 1 });

			sdShop.options.push({ _class: 'sdButton', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:1, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:3, _category:'Base equipment' });


			for ( let i = 0; i < sdCaption.colors.length / 3; i++ )
			sdShop.options.push({ _class: 'sdCaption', type: i, _category:'Base equipment' });

			sdShop.options.push({ _class: 'sdUpgradeStation', _category:'Base equipment', _min_build_tool_level: 3  });
			sdShop.options.push({ _class: 'sdWorkbench', _category:'Base equipment', _min_build_tool_level: 11  });
			sdShop.options.push({ _class: 'sdBotFactory', _category:'Base equipment', _min_build_tool_level: 7  });
			sdShop.options.push({ _class: 'sdBotCharger', _category:'Base equipment', _min_build_tool_level: 7  });

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

				let filter2 = '';
				if ( i === 1 )
				filter2 = 'hue-rotate(-60deg)brightness(.5)';
				if ( i === 2 )
				filter2 = 'hue-rotate(44deg)brightness(.8)';

				sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter2, texture_id: sdBG.TEXTURE_STRIPES, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter2, texture_id: sdBG.TEXTURE_STRIPES, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter2, texture_id: sdBG.TEXTURE_STRIPES, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter2, texture_id: sdBG.TEXTURE_STRIPES, _category:'Background walls' });
			}


			sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter, texture_id: sdBG.TEXTURE_GLOWING, _category:'Background walls' });
			//sdShop.options.push({ _class: 'sdWater' });

			for ( var i = 0; i < sdGun.classes.length; i++ )
			{
				if ( sdGun.classes[ i ].spawnable !== false )
				{
					sdShop.options.push({
						_class: 'sdGun',
						class: i, 
						_category: ( sdGun.classes[ i ].category || 'Equipment' ),
						_min_build_tool_level: sdGun.classes[ i ].min_build_tool_level || 0,
						_min_workbench_level: sdGun.classes[ i ].min_workbench_level || 0 // For workbench items
					});
				}
				//else
				//if ( globalThis.isWin )
				if ( sdGun.classes[ i ].title !== 'Missing weapon' )
				{
					if ( i === sdGun.CLASS_BUILDTOOL_UPG )
					{
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: 0,
							_category:'Development tests'
						});
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: 1,
							_category:'Development tests'
						});
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: -123,
							_category:'Development tests'
						});
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: 2,
							_category:'Development tests'
						});
					}
					else
					{
						sdShop.options.push({
							_class: 'sdGun',
							class: i, 
							_category:'Development tests'
						});
					}
				}
			}
			sdShop.options.push({ _class: 'sdBomb', _category:'Equipment' });
			sdShop.options.push({ _class: 'sdBomb', type:1, _category:'Equipment', _min_build_tool_level:15 });
			sdShop.options.push({ _class: 'sdBarrel', _category:'Equipment', _min_build_tool_level:5 });
			sdShop.options.push({ _class: 'sdBarrel', color: '#33FFFF', filter: 'hue-rotate(130deg) saturate(10)', variation: 1, _category:'Equipment', _min_build_tool_level:10 });
			sdShop.options.push({ _class: 'sdBarrel', color: '#ff6633', filter: 'hue-rotate(300deg) saturate(20)', variation: 2, _category:'Equipment', _min_build_tool_level:15 });
			sdShop.options.push({ _class: 'sdBarrel', color: '#ffffff', filter: 'saturate(0)', variation: 3, _category:'Equipment', _min_build_tool_level:20 });
			sdShop.options.push({ _class: 'sdLandMine', _category:'Equipment' });

			//if ( globalThis.isWin ) // Lack of this check will probably allow creation of these entities even if category can not be opened in normal way
			{
				sdShop.options.push({ _class: 'sdOctopus', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdQuickie', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdVirus', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdFaceCrab', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAmphid', _category:'Development tests' });

				let sd_filter = sdWorld.CreateSDFilter();
				sdWorld.ReplaceColorInSDFilter_v2( sd_filter, '#ff00ff', '#007f00', false );
				sdWorld.ReplaceColorInSDFilter_v2( sd_filter, '#800080', '#007f00', false );

				sdShop.options.push({ _class: 'sdCharacter', title: 'Player from the shop', sd_filter:sd_filter, _category:'Development tests' });

				let sd_filter2 = sdWorld.CreateSDFilter();
				sdWorld.ReplaceColorInSDFilter_v2( sd_filter2, '#ff00ff', '#000000', false );
				sdWorld.ReplaceColorInSDFilter_v2( sd_filter2, '#800080', '#000000', false );


				sdShop.options.push({ _class: 'sdCharacter', title: 'Idling AI from the shop', sd_filter:sd_filter2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsteroid', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_LAVA, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_WATER, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ACID, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_TOXIC_GAS, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ESSENCE, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ESSENCE, extra: 40, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ESSENCE, extra: sdCrystal.anticrystal_value / 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ANTIMATTER, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsp', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrass', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSlug', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdEnemyMech', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSetrDestroyer', _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 * 2 * 2, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdJunk', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 7, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCouncilMachine', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdTzyrgAbsorber', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgConverter', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgTurret', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgTurret', type: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBadDog', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShark', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWorkbench', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 40, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 80, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 160, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 320, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 640, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 1280, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 2560, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 5120, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 5120 * 2, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 5120 * 4, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 5120 * 8, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: sdCrystal.anticrystal_value, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 7, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 9, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 5120 * 4, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: sdCrystal.anticrystal_value * 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 5120, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: sdCrystal.anticrystal_value, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 5120 * 4, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: sdCrystal.anticrystal_value * 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CORRUPTED, tag: 'deep', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', _ai_team: 2, type: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 4,_ai_team: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 5,_ai_team: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 10, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 11, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdLost', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_LOST_CONVERTER, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_CABLE_TOOL, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSpider', _ai_team: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSpider', type: 1, _ai_team: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdPlayerDrone', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBeamProjector', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', type: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', type: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', type: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', type: 5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', type: 6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', type: 7, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdObelisk', type: 8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdQuadro', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdOverlord', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdPlayerOverlord', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdTutel', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrub', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAbomination', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBiter', _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdSensorArea', _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdBloodDecal', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_SAND, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_GROUND, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_ROCK, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_CORRUPTION, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_FLESH, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGib', class:sdGib.CLASS_VELOX_MECH_HEAD, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdMimic', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRoach', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBot', kind:0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBot', kind:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGuanako', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdLandScanner', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.FALKOK_SPAWNER, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.SARRORIAN_SPAWNER, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.COUNCIL_SPAWNER, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.TZYRG_SPAWNER, _category:'Development tests' });
			}

			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:256, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:128, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:64, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:32, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:16, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_ERASER_AREA, size:16, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdPresetEditor', w:1, h:1, _category:'Admin tools' });
			//sdShop.options.push({ _class: 'sdDeepSleep', w:64, h:64, type:0, _category:'Admin tools' });
			//sdShop.options.push({ _class: 'sdDeepSleep', w:64, h:64, type:1, _category:'Admin tools' });

			//let remover_sd_filter = sdWorld.CreateSDFilter();
			//sdWorld.ReplaceColorInSDFilter_v2( remover_sd_filter, '#abcbf4', '#ff9292' );

			//sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_REMOVER, sd_filter:remover_sd_filter, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_REMOVER, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_TELEPORTER, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_DAMAGER, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdLongRangeTeleport', is_server_teleport:1, _category:'Admin tools' });

			// Make all admin tools have Infinite cost to prevent them from being build by non-admins
			for ( let i = 0; i < sdShop.options.length; i++ )
			if ( sdShop.options[ i ]._category === 'Admin tools' || sdShop.options[ i ]._category === 'Development tests' )
			sdShop.options[ i ].matter_cost = Infinity;

		}
		

		// Upgrades so far are not synced
		sdShop.upgrades = {
			/*upgrade_suit:
			{
				max_level: 3,
				matter_cost: 120,
				description: 'Increases your max health.',
				action: ( character, level_purchased )=>
				{
					character.hmax = Math.round( 130 + level_purchased / 3 * 120 );
				}
			},*/
			/*upgrade_damage:
			{
				max_level: 3,
				matter_cost: 100,
				description: 'Increases your damage output.',
				action: ( character, level_purchased )=>
				{
					character._damage_mult = 1 + level_purchased / 3 * 1;
				}
			},*/
			/*upgrade_build_hp:
			{
				max_level: 3,
				matter_cost: 120,
				description: 'Increases health of the objects you build.',
				action: ( character, level_purchased )=>
				{
					character._build_hp_mult = 1 + level_purchased / 3 * 3;
				}
			},
			upgrade_energy:
			{
				max_level: 40,
				matter_cost: 45,
				description: 'Increases your maximum matter capacity.',
				action: ( character, level_purchased )=>
				{
					character.matter_max = Math.round( 50 + level_purchased * 45 ); // Max is 1850
				}
			},*/
			upgrade_hook:
			{
				max_level: 1,
				matter_cost: 75,
				description: 'Allows you to use the hook with C button or middle mouse button.',
				action: ( character, level_purchased )=>
				{
					character._hook_allowed = true;
				}
			},
			upgrade_jetpack:
			{
				max_level: 1,
				matter_cost: 75,
				description: 'Allows you to use jetpack by holding jump button.',
				action: ( character, level_purchased )=>
				{
					character._jetpack_allowed = true;
				}
			},
			upgrade_invisibility:
			{
				max_level: 1,
				matter_cost: 150,
				description: 'Allows you to activate invisibility by pressing E button.',
				action: ( character, level_purchased )=>
				{
					character._ghost_allowed = true;
				}
			},
			upgrade_flashlight:
			{
				max_level: 1,
				matter_cost: 50,
				description: 'Allows you to better see in complete darkness.',
				action: ( character, level_purchased )=>
				{
					character.has_flashlight = 1;
					character.flashlight = 1;
				}
			},
			/*upgrade_coms:
			{
				max_level: 1,
				matter_cost: 75,
				description: '',
				action: ( character, level_purchased )=>
				{
					character._coms_allowed = true;
				}
			},*/
			upgrade_matter_regeneration: // Upgrade idea & pull request by Booraz149 ( https://github.com/Booraz149 )
			{
				max_level: 5,
				matter_cost: 200,
				description: 'Allows you to regenerate matter to a certain amount.',
				action: ( character, level_purchased )=>
				{
					character._matter_regeneration = level_purchased;
				}
			},
			/*upgrade_recoil_reduction: // Upgrade idea & pull request by Booraz149 ( https://github.com/Booraz149 )
			{
				max_level: 5,
				matter_cost: 150,
				description: 'Reduces recoil when firing.',
				action: ( character, level_purchased )=>
				{
					character._recoil_mult = 1 - ( 0.0055 * level_purchased ) ; // Small recoil reduction, don't want rifles turn to laser beams
				}
			},
			upgrade_oxygen_capacity: // Upgrade idea & pull request by Booraz149 ( https://github.com/Booraz149 )
			{
				max_level: 3,
				matter_cost: 100,
				description: 'Increases your oxygen capacity.',
				action: ( character, level_purchased )=>
				{
					character._air_upgrade = 1 + level_purchased ; // 
				}
			},*/
			upgrade_jetpack_fuel_cost_reduction: // Upgrade idea & pull request by Booraz149 ( https://github.com/Booraz149 )
			{
				max_level: 5,
				matter_cost: 150,
				min_build_tool_level: 1,
				description: 'Reduces matter cost for using jetpack.',
				action: ( character, level_purchased )=>
				{
					character._jetpack_fuel_multiplier = 1 - ( 0.15 * level_purchased ); // Max 75% fuel cost reduction
				}
			},
			upgrade_matter_regeneration_speed: // Upgrade idea & pull request by Booraz149 ( https://github.com/Booraz149 )
			{
				max_level: 3,
				matter_cost: 200,
				min_build_tool_level: 2,
				description: 'Increases matter regeneration speed.',
				action: ( character, level_purchased )=>
				{
					character._matter_regeneration_multiplier = 1 + level_purchased;
				}
			},
			upgrade_jetpack_power:
			{
				max_level: 3,
				matter_cost: 100,
				min_build_tool_level: 4,
				description: 'Increases jetpack efficiency to reach higher speeds faster.',
				action: ( character, level_purchased )=>
				{
					character._jetpack_power = 1 + ( level_purchased * 0.5 );
				}
			},
			upgrade_stability_recovery:
			{
				max_level: 3,
				matter_cost: 125,
				min_build_tool_level: 3,
				description: 'Reduces time to recover after falling down.',
				action: ( character, level_purchased )=>
				{
					character._stability_recovery_multiplier = 1 + ( 3 / level_purchased );
				}
			},
			upgrade_grenades:
			{
				max_level: 1,
				matter_cost: 150,
				min_build_tool_level: 5,
				description: 'Your suit will be able to throw grenades on demand, each will cost 150 matter.',
				action: ( character, level_purchased )=>
				{
				}
			}
		};
		for ( var i in sdShop.upgrades )
		{
			sdShop.upgrades[ i ].image = sdWorld.CreateImageFromFile( i );
			sdShop.options.push({ _class: null, matter_cost: sdShop.upgrades[ i ].matter_cost, upgrade_name: i, description: sdShop.upgrades[ i ].description, 
				_category:'Upgrades', _min_build_tool_level: sdShop.upgrades[ i ].min_build_tool_level || 0 });
		}

	}
	static Draw( ctx )
	{
		sdShop.isDrawing = true;
		
		if ( !sdWorld.my_entity )
		{
			sdShop.open = false;
			return;
		}
		
		let old_active_build_settings = sdWorld.my_entity._build_params;
			
		ctx.fillStyle = '#000000';
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
			//let skip = 0; // Skip current_shop_options.push if an item is not unlocked yet
			let current_shop_options = [];
			for ( var i = 0; i < sdShop.options.length; i++ )
			{
				if ( sdShop.options[ i ]._godmode_only !== true || ( sdWorld.my_entity && sdWorld.my_entity._god ) )
				if ( sdShop.options[ i ]._category === sdShop.current_category || 
					 ( sdShop.options[ i ]._category.charAt( 0 ) === '!' && sdShop.options[ i ]._category.substring( 1 ) !== sdShop.current_category ) ) // !root case
				{
					/*
					if ( sdShop.options[ i ]._category === 'Equipment' ) // Equipment category unlockables go here
					{
						if ( ( sdShop.options[ i ].class === sdGun.CLASS_PISTOL_MK2 || sdShop.options[ i ].class === sdGun.CLASS_LMG_P04 ) && sdWorld.my_entity.build_tool_level <= 0 )
						skip = 1;
						if ( ( sdShop.options[ i ]._class === 'sdBarrel' && sdShop.options[ i ].variation === 1 ) && sdWorld.my_entity.build_tool_level <= 0 )
						skip = 1;
					}
					if ( sdShop.options[ i ]._category === 'Base equipment' ) // Base equipment category unlockables go here
					{
						if ( ( sdShop.options[ i ]._class === 'sdCom' && sdShop.options[ i ].variation === 1 ) && sdWorld.my_entity.build_tool_level <= 0 )
						skip = 1;
					}*/
					
					/*if ( sdShop.options[ i ]._min_build_tool_level || 0 > sdWorld.my_entity.build_tool_level )
					skip = 1;
					
					if ( skip === 0 )
					current_shop_options.push( sdShop.options[ i ] );
				
					sdShop.options[ i ]._main_array_index = i;
					skip = 0; // reset
					*/
					
					if ( ( sdShop.options[ i ]._min_build_tool_level || 0 ) > sdWorld.my_entity.build_tool_level )
					continue;

					if ( ( sdShop.options[ i ]._min_workbench_level || 0 ) > sdWorld.my_entity.GetWorkBenchLevel() )
					continue;
				
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
					ent.x = 0;//-100;
					ent.y = 0;

					if ( typeof sdWorld.my_entity._build_params._opens_category !== 'undefined' )
					{
						matter_cost = 0;
					}
					else
					matter_cost = ent.MeasureMatterCost();
				}

				// Overrides
				if ( current_shop_options[ i ].matter_cost !== undefined )
				matter_cost = current_shop_options[ i ].matter_cost;
			

				if ( selectable )
				{
					ctx.globalAlpha = 0.2;
					
					if ( sdWorld.my_entity.matter >= matter_cost )
					{
						ctx.fillStyle = '#00ff00';
					}
					else
					{
						ctx.fillStyle = '#ff0000';
					}
				}
				if ( sdWorld.mouse_screen_x >= xx - 20 )
				if ( sdWorld.mouse_screen_x < xx + 64 + 20 )
				if ( sdWorld.mouse_screen_y >= yy - 20 )
				if ( sdWorld.mouse_screen_y < yy + 64 + 20 )
				if ( sdShop.potential_selection === -1 )
				{
					sdShop.potential_selection = sdWorld.my_entity._build_params._main_array_index; // i;

					if ( selectable )
					{
						ctx.fillStyle = '#ffff00';
						ctx.globalAlpha = 0.3;
					}
				}
				if ( selectable )
				{
					ctx.fillRect( -5,-5, 32+10,32+10 );
					ctx.globalAlpha = 1;
				}

				
				if ( sdRenderer.visual_settings === 4 )
				{
					if ( ent )
					{
						ctx.save();
						{
							ctx.translate( ~~( 16 - ( ent._hitbox_x2 + ent._hitbox_x1 ) / 2 ), 
											~~( 16 - ( ent._hitbox_y2 + ent._hitbox_y1 ) / 2 ) );
							
							ctx.save();
							ent.DrawBG( ctx, false );
							ctx.restore();
	
							ctx.save();
							ent.Draw( ctx, false );
							ctx.restore();
	
							ctx.save();
							ent.DrawFG( ctx, false );
							ctx.restore();
						}
						ctx.restore();
					}
					else
					if ( sdWorld.my_entity._build_params.image )
					{
						if ( !sdWorld.my_entity._build_params.image_obj /*|| !sdWorld.my_entity._build_params.image_obj.loaded*/ )
						{
							let obj = sdWorld.my_entity._build_params;
							sdWorld.my_entity._build_params.image_obj = sdWorld.CreateImageFromFile( sdWorld.my_entity._build_params.image, ()=>
							{
								obj._cache = null;
							});
							sdWorld.my_entity._build_params.image_obj.RequiredNow();
						}
						
						ctx.drawImage( sdWorld.my_entity._build_params.image_obj, 0,0, 32,32 );
					}
					else
					{
						if ( !sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].image.loaded )
						{
							let obj = sdWorld.my_entity._build_params;
							sdShop.upgrades[ obj.upgrade_name ].image.callbacks.push( ()=>
							{
								obj._cache = null;
							});
							sdShop.upgrades[ obj.upgrade_name ].image.RequiredNow();
						}
						
						ctx.drawImage( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].image, 0,0, 32,32 );
					}
				}
				else
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
						sdRenderer.unavailable_image_collector = [];
						
						ctx2.translate( ~~( 16 - ( ent._hitbox_x2 + ent._hitbox_x1 ) / 2 ), 
										~~( 16 - ( ent._hitbox_y2 + ent._hitbox_y1 ) / 2 ) );

						ctx2.save();
						ent.DrawBG( ctx2, false );
						ctx2.restore();
						
						ctx2.save();
						ent.Draw( ctx2, false );
						ctx2.restore();
						
						ctx2.save();
						ent.DrawFG( ctx2, false );
						ctx2.restore();
						
						let unavaulable_images = sdRenderer.unavailable_image_collector;
						sdRenderer.unavailable_image_collector = null;
						
						let obj = sdWorld.my_entity._build_params;
						for ( let i = 0; i < unavaulable_images.length; i++ )
						{
							unavaulable_images[ i ].callbacks.push( ()=>
							{
								obj._cache = null;
							});
						}
					}
					else
					if ( sdWorld.my_entity._build_params.image )
					{
						if ( !sdWorld.my_entity._build_params.image_obj /*|| !sdWorld.my_entity._build_params.image_obj.loaded*/ )
						{
							let obj = sdWorld.my_entity._build_params;
							sdWorld.my_entity._build_params.image_obj = sdWorld.CreateImageFromFile( sdWorld.my_entity._build_params.image, ()=>
							{
								obj._cache = null;
							});
							sdWorld.my_entity._build_params.image_obj.RequiredNow();
						}
						
						ctx2.drawImage( sdWorld.my_entity._build_params.image_obj, 0,0, 32,32 );
					}
					else
					{
						if ( !sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].image.loaded )
						{
							let obj = sdWorld.my_entity._build_params;
							sdShop.upgrades[ obj.upgrade_name ].image.callbacks.push( ()=>
							{
								obj._cache = null;
							});
							sdShop.upgrades[ obj.upgrade_name ].image.RequiredNow();
						}
						
						ctx2.drawImage( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].image, 0,0, 32,32 );
					}
					
					sdWorld.my_entity._build_params._cache = canvas;
				}
				
				if ( ent )
				{
					ctx.translate( 16 - ( ent._hitbox_x2 + ent._hitbox_x1 ) / 2, 16 - ( ent._hitbox_y2 + ent._hitbox_y1 ) / 2 );
					
					ent.remove();
					ent._broken = false;
					ent._remove();
				}
				
				
				if ( max_level > 0 )
				{
					ctx.fillStyle = '#ffffff';
					//ctx.font = "4.5px Verdana";
					ctx.font = "5.5px Verdana";
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
			
			let simple_obj = Object.assign( {}, sdShop.options[ sdShop.potential_selection ] );
			delete simple_obj._cache;
			delete simple_obj.image_obj;
			
			let t = T('No description for ') + JSON.stringify( simple_obj );
			let desc = null; // Secondary description, used for upgrades
			
			if ( sdShop.options[ sdShop.potential_selection ]._opens_category )
			{
				if ( sdShop.options[ sdShop.potential_selection ]._opens_category === 'root' )
				t = T('Click to leave this category');
				else
				t = T('Click to enter category')+' "' + sdShop.options[ sdShop.potential_selection ]._opens_category + '"';
			}
			else
			{
				let pseudo_entity = sdShop.options[ sdShop.potential_selection ];
					
				if ( pseudo_entity._class !== null )
				{
					
					let c = sdWorld.ClassNameToProperName( pseudo_entity._class, pseudo_entity );
					
					try
					{
						let title = sdWorld.entity_classes[ pseudo_entity._class ].prototype.title;
						
						if ( typeof title === 'string' && title.indexOf( 'undefined' ) === -1 )
						c = title;
					}
					catch(e){};
					
					try
					{
						let title = Object.getOwnPropertyDescriptor( sdWorld.entity_classes[ pseudo_entity._class ].prototype, 'title' ).get.call( pseudo_entity );
						
						if ( typeof title === 'string' && title.indexOf( 'undefined' ) === -1 )
						c = title;
					}
					catch(e){};
					
					t = T('Click to select')+' "' + c + '" '+T('as a build object. Then click to place this object in world.');
				}
				else
				if ( pseudo_entity.upgrade_name )
				{
					t = T('Click to select')+' "' + T(capitalize( pseudo_entity.upgrade_name.split('_').join(' ') )) + '" '+T('as an upgrade. Then click anywhere to upgrade.');
					desc = capitalize( pseudo_entity.description );
				}
				
			}
			
			let d = ctx.measureText( t );
			let d2 = ( desc !== null ) ? ctx.measureText( desc ) : null; // Secondary description, used for upgrades
			
			let xx = sdWorld.mouse_screen_x + 16;
			
			if ( sdWorld.mouse_screen_x + 16 + d.width > sdRenderer.screen_width )
			xx = sdRenderer.screen_width - d.width - 16;
			
			ctx.fillStyle = '#000000';
			ctx.globalAlpha = 0.8;
			ctx.fillRect( xx, sdWorld.mouse_screen_y + 32, d.width + 10, 12 + 10 );
			if ( desc !== null )
			ctx.fillRect( xx, sdWorld.mouse_screen_y + 32, d2.width + 10, 12 + 14 + 10 );
			ctx.globalAlpha = 1;
			
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText( t, xx + 5, sdWorld.mouse_screen_y + 32 + 12 + 5 );
			if ( desc !== null )
			ctx.fillText( desc, xx + 5, sdWorld.mouse_screen_y + 32 + 12 + 14 + 5 );
		}

		
		sdWorld.my_entity._build_params = old_active_build_settings;
		sdShop.isDrawing = false;
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
				//sdRenderer.UpdateCursor();
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
				//sdRenderer.UpdateCursor();
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
