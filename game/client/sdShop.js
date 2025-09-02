

/* global sdChat */

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
import sdFactionTools from '../entities/sdFactionTools.js';

import sdRenderer from './sdRenderer.js';
import sdContextMenu from './sdContextMenu.js';


class sdShop
{
	static Open()
	{
		if ( !sdShop.open )
		{
			sdShop.open = true;
			//sdShop.search_phrase = '';
			sdShop.block_search_input_until = sdWorld.time + 50;
			sdShop.search_anim_morph = 0;
			sdShop.last_render = sdWorld.time;
			//sdShop.search_active = false;
		}
	}
	static Close()
	{
		sdShop.open = false;
	}
	static init_class()
	{
		//console.log('sdShop class initiated');
		
		sdShop.open = false;
		sdShop.options = [];
		sdShop.options_snappack = null; // Generated on very first connection. It means shop items can not be changed after world initialization, but not only because of that (shop data is sent only once per connection)
		
		sdShop.category_godmode_permission_cache = new Map(); // String => true/false
		
		sdShop.scroll_y = 0;
		sdShop.scroll_y_target = 0;
		
		sdShop.current_category = 'root'; // root category
		
		sdShop.max_y = 0;
		
		sdShop.isDrawing = false;
		
		sdShop.potential_selection = -1;
		sdShop.potential_selection_search_box = -2;
		sdShop.search_phrase = '';
		sdShop.search_anim_morph = 0;
		sdShop.block_search_input_until = 0;
		sdShop.full_item_description_cache = new WeakMap(); // obj -> [ a, b, c ]
		sdShop.search_active = false;
		
		sdShop.last_render = 0;
		
		// Used for image for hidden items
		sdShop.item_low_level = { 
			_class: null, 
			image: 'unavailable_shop_item', 
			_category: 'nowhere', 
			description: 'This item requires higher level in order to be built',
			dummy_item: true,
			
			_main_array_index: 0
		};
		sdShop.item_low_workbench_level = { 
			_class: null, 
			image: 'unavailable_shop_item_blue', 
			_category: 'nowhere', 
			description: 'This item requires workbench in order to be built (or higher workbench level)',
			dummy_item: true,
			
			_main_array_index: 1
		};

		if ( sdWorld.is_server )
		{
			sdShop.options.push( sdShop.item_low_level );
			sdShop.options.push( sdShop.item_low_workbench_level );
			
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
			sdShop.options.push({ _class: 'sdGun', class: sdGun.CLASS_LOST_CONVERTER, _category:'root', _godmode_only: true, _opens_category:'Development tests guns' });
			sdShop.options.push({ _class: 'sdVirus', _category:'root', _godmode_only: true, _opens_category:'Development tests' });
			sdShop.options.push({ _class: 'sdCrystal', tag:'deep', matter_max:5120, _category:'root', _godmode_only: true, _opens_category:'Development tests crystals' });
			sdShop.options.push({ _class: 'sdCharacter', _category:'root', _godmode_only: true, _opens_category:'Humanoid Spawner' });
			sdShop.options.push({ _class: 'sdFactionSpawner', _category:'root', _godmode_only: true, _opens_category:'Faction outpost tools' });
			
			//

			sdShop.options.push({ _class: 'sdBall', _category:'Other' });
			sdShop.options.push({ _class: 'sdBall', type: 1, _category:'Other' });
			sdShop.options.push({ _class: 'sdTheatre', _category:'Other' });
			for ( let hue = 0; hue < 360; hue += 30 )
			sdShop.options.push({ _class: 'sdGrass', variation: 3, hue:hue, _category:'Other' });
		
			sdShop.options.push({ _class: 'sdGrass', variation: 8, _category:'Other' });

			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, filter: 'hue-rotate(90deg) saturate(2)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, filter: 'hue-rotate(180deg) saturate(2)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, filter: 'hue-rotate(270deg) saturate(2)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 1, _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 1, filter: 'hue-rotate(90deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 1, filter: 'hue-rotate(180deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 1, filter: 'hue-rotate(270deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 17 });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 2, _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 2, filter: 'hue-rotate(90deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 2, filter: 'hue-rotate(180deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 2, filter: 'hue-rotate(270deg) saturate(2)', _category:'Vehicles', _min_build_tool_level: 24 });
			sdShop.options.push({ _class: 'sdLifeBox', _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:0, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:30, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:60, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:90, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:120, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:150, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:180, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:210, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:240, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:270, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:300, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdCapsulePod', hue:330, _category:'Vehicles', _min_build_tool_level:1 });
			sdShop.options.push({ _class: 'sdQuadro', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(300deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(270deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(210deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'hue-rotate(140deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'saturate(0) brightness(1.5)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdQuadro', filter: 'saturate(0) brightness(0.5)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 3, filter: 'hue-rotate(300deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 3, filter: 'hue-rotate(270deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 3, filter: 'hue-rotate(210deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 3, filter: 'hue-rotate(140deg)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 3, filter: 'saturate(0) brightness(1.5)', _category:'Vehicles' });
			sdShop.options.push({ _class: 'sdHover', _min_workbench_level:1, type: 3, filter: 'saturate(0) brightness(0.5)', _category:'Vehicles' });

			function AddBuildPack( filter )
			{
				for ( let i2 = 0; i2 < 3; i2++ )
				{
					let material = sdBlock.MATERIAL_WALL;

					let _reinforced_level = 0;

					let _min_build_tool_level = 0;

					let texture_id = sdBlock.TEXTURE_ID_WALL; // sdBG.TEXTURE_PLATFORMS_COLORED;

					if ( i2 === 1 )
					texture_id = sdBlock.TEXTURE_ID_REINFORCED_LVL1;

					if ( i2 === 2 )
					texture_id = sdBlock.TEXTURE_ID_REINFORCED_LVL2;

					sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
					sdShop.options.push({ _class: 'sdBlock', width: 8, height: 16, filter: filter, _category:'Walls', _min_build_tool_level:_min_build_tool_level, _reinforced_level:_reinforced_level, material:material, texture_id:texture_id });
				}
				
				sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter + 'brightness(1.5)', texture_id: sdBG.TEXTURE_PLATFORMS_COLORED, _category:'Background walls' });

				sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, filter: filter, texture_id: sdBG.TEXTURE_HEX, _category:'Background walls' });
			}

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

				sdShop.options.push({ _class: 'sdDoor', w:32, h:32, filter: filter, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:4, h:32, filter: filter, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:32, h:4, filter: filter, _category:'Doors' });
				
				sdShop.options.push({ _class: 'sdDoor', w:32, h:32, filter: filter, model: sdDoor.MODEL_ARMORED, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:4, h:32, filter: filter, model: sdDoor.MODEL_ARMORED, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:32, h:4, filter: filter, model: sdDoor.MODEL_ARMORED, _category:'Doors' });
				
				sdShop.options.push({ _class: 'sdDoor', w:32, h:32, filter: filter, model: sdDoor.MODEL_ARMORED_LVL2, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:4, h:32, filter: filter, model: sdDoor.MODEL_ARMORED_LVL2, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:32, h:4, filter: filter, model: sdDoor.MODEL_ARMORED_LVL2, _category:'Doors' });
				
				sdShop.options.push({ _class: 'sdDoor', w:16, h:16, filter: filter, model: sdDoor.MODEL_BASIC_SMALL, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:16, h:16, filter: filter, model: sdDoor.MODEL_ARMORED_SMALL, _category:'Doors' });
				sdShop.options.push({ _class: 'sdDoor', w:16, h:16, filter: filter, model: sdDoor.MODEL_CIRCULAR_LIGHTS_SMALL, _category:'Doors' });
				
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
			sdShop.options.push({ _class: 'sdSampleBuilder', type: 0, _category:'Base equipment', _min_build_tool_level: 35 });
			sdShop.options.push({ _class: 'sdSampleBuilder', type: 1, _category:'Base equipment', _min_build_tool_level: 35 });
			sdShop.options.push({ _class: 'sdSampleBuilder', type: 0, half_size:8, _category:'Base equipment', _min_build_tool_level: 45 });
			sdShop.options.push({ _class: 'sdSampleBuilder', type: 1, half_size:8, _category:'Base equipment', _min_build_tool_level: 45 });
			for ( let size = 16; size >= 8; size /= 2 )
			{
				let min_level = 0;
				
				if ( size === 8 )
				min_level = 45;
				
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:0, kind:0, size:size, _min_build_tool_level: Math.max( min_level, 0  ) });
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:0, kind:1, size:size, _min_build_tool_level: Math.max( min_level, 30 ) });
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:0, kind:3, size:size, _min_build_tool_level: Math.max( min_level, 30 ) });
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:0, kind:2, size:size, _min_build_tool_level: Math.max( min_level, 15 ) });
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:1, kind:0, size:size, _min_build_tool_level: Math.max( min_level, 31 ) });
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:1, kind:1, size:size, _min_build_tool_level: Math.max( min_level, 32 ) });
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:1, kind:3, size:size, _min_build_tool_level: Math.max( min_level, 33 ) });
				sdShop.options.push({ _class: 'sdAntigravity', _category:'Base equipment', type:1, kind:2, size:size, _min_build_tool_level: Math.max( min_level, 32 ) });
			}
			sdShop.options.push({ _class: 'sdLamp', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 0, filter: 'saturate(0)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 0, filter: 'none', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 0, filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 0, filter: 'hue-rotate(220deg)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 0, filter: 'hue-rotate(135deg)', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'saturate(0)', _category:'Base equipment', _min_build_tool_level: 15 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'none', _category:'Base equipment', _min_build_tool_level: 15 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment', _min_build_tool_level: 15 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'hue-rotate(220deg)', _category:'Base equipment', _min_build_tool_level: 15 });
			sdShop.options.push({ _class: 'sdStorage', type: 1, filter: 'hue-rotate(135deg)', _category:'Base equipment', _min_build_tool_level: 15 });
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
			sdShop.options.push({ _class: 'sdStorage', type: 4, filter: 'saturate(0)', _category:'Base equipment', _min_build_tool_level: 32 });
			sdShop.options.push({ _class: 'sdStorage', type: 4, filter: 'none', _category:'Base equipment', _min_build_tool_level: 32 });
			sdShop.options.push({ _class: 'sdStorage', type: 4, filter: 'hue-rotate(205deg) saturate(10)', _category:'Base equipment', _min_build_tool_level: 32 });
			sdShop.options.push({ _class: 'sdStorage', type: 4, filter: 'hue-rotate(220deg)', _category:'Base equipment', _min_build_tool_level: 32 });
			sdShop.options.push({ _class: 'sdStorage', type: 4, filter: 'hue-rotate(135deg)', _category:'Base equipment', _min_build_tool_level: 32 });
			sdShop.options.push({ _class: 'sdNode', type:0, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdNode', type:1, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdNode', type:2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdNode', type:4, _category:'Base equipment', _min_build_tool_level:15 });
			sdShop.options.push({ _class: 'sdNode', type:5, delay:500, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdNode', type:6, _category:'Base equipment', _min_build_tool_level:32 });
			sdShop.options.push({ _class: 'sdSunPanel', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', multiplier: 2, _min_build_tool_level: 3, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', multiplier: 4, _min_build_tool_level: 9, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', multiplier: 8, _min_build_tool_level: 18, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdSunPanel', multiplier: 20, _min_build_tool_level: 36, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdWeaponBench', type: 0, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdWeaponBench', type: 1,  _category:'Base equipment', _min_build_tool_level: 10 });
			//sdShop.options.push({ _class: 'sdWeaponMerger',_min_workbench_level: 5, _category:'Base equipment' });

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

			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_LASER_PORTABLE, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_LASER, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_ROCKET, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_RAPID_LASER, _category:'Base equipment', _min_build_tool_level: 6 });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_SNIPER, _category:'Base equipment', _min_build_tool_level: 13 });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_FREEZER, _category:'Base equipment', _min_build_tool_level: 15 });
			sdShop.options.push({ _class: 'sdTurret', kind:sdTurret.KIND_ZAP, _category:'Base equipment', _min_build_tool_level: 40 });
			sdShop.options.push({ _class: 'sdManualTurret', anti_base_mode:1, _category:'Base equipment', _min_build_tool_level: 20 });
			sdShop.options.push({ _class: 'sdManualTurret', anti_base_mode:0, _category:'Base equipment', _min_build_tool_level: 20 });
			/*sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 / 2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 * 2, _category:'Base equipment' });*/
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:2560 * 2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:5120 * 2, _category:'Base equipment', _min_build_tool_level: 3 }); // Orange glow
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:10240 * 2, _category:'Base equipment', _min_build_tool_level: 9 });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:20480 * 2, _category:'Base equipment', _min_build_tool_level: 18 });
			sdShop.options.push({ _class: 'sdMatterContainer', matter_max:40960 * 2, _category:'Base equipment', _min_build_tool_level: 24, _min_workbench_level: 4 });

			sdShop.options.push({ _class: 'sdLiquidAbsorber', _category:'Base equipment' });
			
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 1, width:1, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 2, width:1, _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 4, width:1, _category:'Base equipment', _min_build_tool_level: 9 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 8, width:1, _category:'Base equipment', _min_build_tool_level: 18 });
			
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 1, width:2, _category:'Base equipment', _min_build_tool_level: 22, _min_workbench_level: 1 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 2, width:2, _category:'Base equipment', _min_build_tool_level: 24, _min_workbench_level: 2 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 4, width:2, _category:'Base equipment', _min_build_tool_level: 27, _min_workbench_level: 3 });
			sdShop.options.push({ _class: 'sdMatterAmplifier', multiplier: 8, width:2, _category:'Base equipment', _min_build_tool_level: 30, _min_workbench_level: 4 });
			
			sdShop.options.push({ _class: 'sdStorageTank', _category:'Base equipment', });
			sdShop.options.push({ _class: 'sdStorageTank', type: sdStorageTank.TYPE_PORTABLE, _category:'Base equipment', });

			if ( sdWorld.server_config.do_green_base_shielding_units_consume_essence )
			if ( sdWorld.server_config.allowed_base_shielding_unit_types === null || sdWorld.server_config.allowed_base_shielding_unit_types.indexOf( 0 ) !== -1 )
			{
				sdShop.options.push({ _class: 'sdEssenceExtractor', _category:'Base equipment', });
			}
			sdShop.options.push({ _class: 'sdCommandCentre', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdLongRangeTeleport', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdCrystalCombiner', _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdCrystalCombiner', type: 1, _min_workbench_level: 3, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdCrystalCombiner', type: 2, _min_workbench_level: 8, _category:'Base equipment' });

			if ( sdWorld.server_config.allow_rescue_teleports )
			{
				if ( sdWorld.server_config.allowed_rescue_teleports === null || sdWorld.server_config.allowed_rescue_teleports.indexOf( sdRescueTeleport.TYPE_SHORT_RANGE ) !== -1 )
				sdShop.options.push({ _class: 'sdRescueTeleport', type: sdRescueTeleport.TYPE_SHORT_RANGE, _category:'Base equipment'});
			
				if ( sdWorld.server_config.allowed_rescue_teleports === null || sdWorld.server_config.allowed_rescue_teleports.indexOf( sdRescueTeleport.TYPE_INFINITE_RANGE ) !== -1 )
				sdShop.options.push({ _class: 'sdRescueTeleport', type: sdRescueTeleport.TYPE_INFINITE_RANGE, _category:'Base equipment', _min_build_tool_level: 10 });
			
				if ( sdWorld.server_config.allowed_rescue_teleports === null || sdWorld.server_config.allowed_rescue_teleports.indexOf( sdRescueTeleport.TYPE_CLONER ) !== -1 )
				sdShop.options.push({ _class: 'sdRescueTeleport', type: sdRescueTeleport.TYPE_CLONER, _category:'Base equipment', _min_build_tool_level: 20 });
			
				if ( sdWorld.server_config.allowed_rescue_teleports !== null && sdWorld.server_config.allowed_rescue_teleports.indexOf( sdRescueTeleport.TYPE_RESPAWN_POINT ) !== -1 )
				sdShop.options.push({ _class: 'sdRescueTeleport', type: sdRescueTeleport.TYPE_RESPAWN_POINT, _category:'Base equipment'});
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
			sdShop.options.push({ _class: 'sdSteeringWheel', type:0, _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdSteeringWheel', type:1, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdBG', width: 16, height: 16, texture_id: sdBG.TEXTURE_ELEVATOR_PATH, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdBG', width: 16, height: 32, texture_id: sdBG.TEXTURE_ELEVATOR_PATH, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 16, texture_id: sdBG.TEXTURE_ELEVATOR_PATH, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, texture_id: sdBG.TEXTURE_ELEVATOR_PATH, _category:'Base equipment', _min_build_tool_level: 2 });
			
			sdShop.options.push({ _class: 'sdThruster', _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdThruster', filter: 'hue-rotate(90deg) saturate(2)', _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdThruster', filter: 'hue-rotate(180deg) saturate(2)', _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdThruster', filter: 'hue-rotate(270deg) saturate(2)', _category:'Base equipment', _min_build_tool_level: 3 });
			sdShop.options.push({ _class: 'sdCamera', _category:'Base equipment', _min_build_tool_level: 1 });

			sdShop.options.push({ _class: 'sdButton', type:0, kind:0, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:0, kind:2, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdButton', type:0, kind:3, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdButton', type:0, kind:4, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdButton', type:0, kind:5, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdButton', type:1, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:2, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:3, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:5, _category:'Base equipment' });
			sdShop.options.push({ _class: 'sdButton', type:4, _category:'Base equipment', _min_build_tool_level: 2 });
			sdShop.options.push({ _class: 'sdButton', type:6, _category:'Base equipment', _min_build_tool_level: 2 });


			for ( let i = 0; i < sdCaption.colors.length / 3; i++ )
			sdShop.options.push({ _class: 'sdCaption', type: i, _category:'Base equipment' });

			sdShop.options.push({ _class: 'sdUpgradeStation', _category:'Base equipment', _min_build_tool_level: 3  });
			//sdShop.options.push({ _class: 'sdWorkbench', _category:'Base equipment', _min_build_tool_level: 11  });
			sdShop.options.push({ _class: 'sdWorkbench', _category:'Base equipment' });
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

			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: 'none', texture_id: sdBG.TEXTURE_WINDOW, _category:'Background walls' });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: 'invert(0.25)', texture_id: sdBG.TEXTURE_WINDOW, _category:'Background walls' });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: 'invert(0.5)', texture_id: sdBG.TEXTURE_WINDOW, _category:'Background walls' });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: 'invert(0.75)', texture_id: sdBG.TEXTURE_WINDOW, _category:'Background walls' });
			sdShop.options.push({ _class: 'sdBG', width: 32, height: 32, filter: 'invert(1)', texture_id: sdBG.TEXTURE_WINDOW, _category:'Background walls' });

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
					if ( i === sdGun.CLASS_SCORE_SHARD )
					{
						for ( let i2 = 0; i2 < sdGun.score_shard_recolor_tiers.length; i2++ )
						if ( sdGun.score_shard_recolor_tiers[ i2 ] )
						{
							sdShop.options.push({
								_class: 'sdGun',
								class: i,
								extra: i2,
								sd_filter: sdGun.score_shard_recolor_tiers[ i2 ],
								_category:'Development tests guns'
							});
						}
					}
					else
					if ( i === sdGun.CLASS_BUILDTOOL_UPG )
					{
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: 0,
							_category:'Development tests guns'
						});
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: 1,
							_category:'Development tests guns'
						});
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: -123,
							_category:'Development tests guns'
						});
						sdShop.options.push({
							_class: 'sdGun',
							class: i,
							extra: 2,
							_category:'Development tests guns'
						});
					}
					else
					{
						sdShop.options.push({
							_class: 'sdGun',
							class: i, 
							_category:'Development tests guns'
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
			sdShop.options.push({ _class: 'sdLandMine',variation:0, _category:'Equipment' });
			sdShop.options.push({ _class: 'sdLandMine', variation:1, _category:'Equipment', _min_build_tool_level:10 });

			//if ( globalThis.isWin ) // Lack of this check will probably allow creation of these entities even if category can not be opened in normal way
			{
				sdShop.options.push({ _class: 'sdOctopus', type:0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdOctopus', type:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdQuickie', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdQuickie', tier:2, filter:'invert(1) sepia(1) saturate(100) hue-rotate(270deg) opacity(0.45)', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdVirus', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdVirus', _category:'Development tests', _is_big:true });
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
				sdShop.options.push({ _class: 'sdAsteroid', type:0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsteroid', type:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsteroid', type:2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsteroid', type:3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsteroid', type:3, landed:true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:7, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCube', kind:8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_LAVA, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_WATER, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ACID, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_TOXIC_GAS, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ESSENCE, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ESSENCE, extra: 40, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ESSENCE, extra: sdCrystal.anticrystal_value / 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWater', type: sdWater.TYPE_ANTIMATTER, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsp', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAsp', tier:2, crystal_worth:160, filter: 'invert(1) sepia(1) saturate(100) hue-rotate(270deg) opacity(0.45)', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 3, scale: 0.5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSandWorm', kind: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrass', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrass', variation:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrass', variation:2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrass', variation:3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrass', variation:4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrass', variation:6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSlug', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdEnemyMech', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSetrDestroyer', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCouncilIncinerator', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdStalker', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCouncilNullifier', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdStealer', _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdMatterContainer', matter_max:640 * 2 * 2, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdJunk', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 7, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 9, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 10, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 11, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 12, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdJunk', type: 13, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCouncilMachine', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdTzyrgAbsorber', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgConverter', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdVeloxFortifier', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgTurret', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgTurret', type: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgExcavator', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgManualTurret', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShurgManualTurret', spawn_with_pilot: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdHover', type:0, spawn_with_ents: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdHover', type:1, spawn_with_ents: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdHover', type:2, spawn_with_ents: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdHover', type:3, spawn_with_ents: 1, filter: 'saturate(0) brightness(0.5)', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdHover', type:4, guns: 0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdHover', type:4, spawn_with_ents: 2, guns: 0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBadDog', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdShark', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdWorkbench', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRift', type: 6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdMeow', _category:'Development tests' });
				
				{
					// Testing potential new specialities
					/*sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:40, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:80, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:160, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:320, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:640, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:1280, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:2560, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:5120, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:10240, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:20480, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:40960, speciality:2 } );
					sdShop.options.push( { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals', matter_max:81920, speciality:2 } );*/
						
					let base_props = { _class: 'sdCrystal', tag: 'deep', _category:'Development tests crystals' };
					let type = [ undefined, 1, 2, 3, 4, 5, 6, 7, 8 ];
					let matter_max = [ 40, 80, 160, 320, 640, 1280, 2560, 5120, 5120 * 2, 5120 * 4, 5120 * 8, sdCrystal.anticrystal_value ];
					let speciality = [ undefined, 1, 2 ];
					for ( let s of speciality )
					for ( let t of type )
					for ( let m of matter_max )
					{
						if ( t === sdCrystal.TYPE_CRYSTAL_BALLOON )
						m *= 0.25;
					
						if ( t === sdCrystal.TYPE_CRYSTAL_CRAB_BIG || t === sdCrystal.TYPE_CRYSTAL_BIG )
						m *= 4;
					
						let props = Object.assign( { type:t, matter_max:m, speciality:s }, base_props );
						sdShop.options.push( props );
					}
				}
				
				/*sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', _category:'Development tests' });
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
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: sdCrystal.anticrystal_value, _category:'Development tests' });*/
				/*sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 40, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 80, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 160, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 320, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 640, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 1280, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 2560, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 5120, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 5120 * 2, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 5120 * 4, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: 5120 * 8, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', matter_max: sdCrystal.anticrystal_value, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB, tag: 'deep', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 160, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 320, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 640, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 1280, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 2560, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 5120, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 5120 * 2, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 5120 * 4, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 5120 * 8, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 5120 * 16, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: 5120 * 32, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CRAB_BIG, tag: 'deep', matter_max: sdCrystal.anticrystal_value * 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 160, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 320, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 640, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 1280, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 2560, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 5120, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 5120 * 2, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 5120 * 4, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 5120 * 8, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 5120 * 16, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: 5120 * 32, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', matter_max: sdCrystal.anticrystal_value * 4, _category:'Development tests' });
 				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_BIG, tag: 'deep', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type: sdCrystal.TYPE_CRYSTAL_CORRUPTED, tag: 'deep', _category:'Development tests' });
				
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 40, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 80, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 160, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 320, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 640, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 1280, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 2560, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 5120, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 5120 * 2, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 5120 * 4, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * 5120 * 8, _category:'Development tests' }); // Glowing one
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_CRYSTAL_BALLOON, matter_max: 0.25 * sdCrystal.anticrystal_value, _category:'Development tests' });
				
				sdShop.options.push({ _class: 'sdCrystal', type:sdCrystal.TYPE_EXCAVATOR_QUARTZ, _category:'Development tests' });*/
				
				//sdShop.options.push({ _class: 'sdDrone', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', _ai_team: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 3, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 4, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 5, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 6, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 7, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 9, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 10, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 12, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 13, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 14, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 15, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 16, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 17, _category:'Development tests', _ai_team: 0, unlimited_range: true });
				sdShop.options.push({ _class: 'sdDrone', type: 18, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 19, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdZektaronDreadnought', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 11, _ai_team: -1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdLost', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_LOST_CONVERTER, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_CABLE_TOOL, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSpider', _ai_team: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSpider', type: 1, _ai_team: 2, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdPlayerDrone', _category:'Development tests' });
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
				sdShop.options.push({ _class: 'sdTutel', type:0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdTutel', type:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGrub', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdAbomination', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBiter', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBiter', type: 1, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdSensorArea', _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdBloodDecal', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBG', width: 16, height: 8, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_SAND, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_GROUND, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_ROCK, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_CORRUPTION, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_FLESH, natural: true, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_ANCIENT_WALL, natural: false, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGib', class:sdGib.CLASS_VELOX_MECH_HEAD, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdMimic', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRoach', type: 0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdRoach', type: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBot', kind:0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBot', kind:1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGuanako', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdGuanakoStructure', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdVeloxMiner', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdLandScanner', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDropPod', type: 0, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDropPod', type: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdBeamProjector', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdLongRangeAntenna', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdSolarMatterDistributor', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdExcavator', _category:'Development tests' });
				sdShop.options.push({ _class: 'sdDrone', type: 17, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdMothershipContainer', _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.SARRORIAN_SPAWNER, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.COUNCIL_SPAWNER, _category:'Development tests' });
				//sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.TZYRG_SPAWNER, _category:'Development tests' });
				
				/*sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 40, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 80, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 160, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 320, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 640, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 1280, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 2560, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 5120, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 10240, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 20480, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 40960, speciality: 1, _category:'Development tests' });
				sdShop.options.push({ _class: 'sdCrystal', tag: 'deep', matter_max: 81920, speciality: 1, _category:'Development tests' });*/
			}

			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:256, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:128, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:64, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:32, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_PREVENT_DAMAGE, size:16, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdArea', type:sdArea.TYPE_ERASER_AREA, size:16, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdPresetEditor', w:1, h:1, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, _category:'Admin tools', material:sdBlock.MATERIAL_PRESET_SPECIAL_FORCE_AIR });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, _category:'Admin tools', material:sdBlock.MATERIAL_PRESET_SPECIAL_FORCE_AIR });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, _category:'Admin tools', material:sdBlock.MATERIAL_PRESET_SPECIAL_ANY_GROUND });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, _category:'Admin tools', material:sdBlock.MATERIAL_PRESET_SPECIAL_ANY_GROUND });
			//sdShop.options.push({ _class: 'sdDeepSleep', w:64, h:64, type:0, _category:'Admin tools' });
			//sdShop.options.push({ _class: 'sdDeepSleep', w:64, h:64, type:1, _category:'Admin tools' });
			
			// Outpost stuff
			//
			// Falkok
			sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.FALKOK_SPAWNER, _spawn_with_full_hp: true, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdDoor', w:32, h:32, model: sdDoor.MODEL_FALKOK, open_type: 1, _ai_team: 1, _spawn_with_full_hp: true, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdDoor', w:8, h:32, model: sdDoor.MODEL_FALKOK, open_type: 1, _ai_team: 1, _spawn_with_full_hp: true, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdDoor', w:32, h:8, model: sdDoor.MODEL_FALKOK, open_type: 1, _ai_team: 1, _spawn_with_full_hp: true, _category:'Faction outpost tools' });
			// Tzyrg
			sdShop.options.push({ _class: 'sdTzyrgMortar', _spawn_with_full_hp: true, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdFactionSpawner', type:sdFactionSpawner.TZYRG_SPAWNER, _spawn_with_full_hp: true, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, _ai_team: 8, _spawn_with_full_hp: true, texture_id: sdBlock.TEXTURE_ID_TZYRG_WALL, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 16, _ai_team: 8, _spawn_with_full_hp: true, texture_id: sdBlock.TEXTURE_ID_TZYRG_WALL, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 32, _ai_team: 8, _spawn_with_full_hp: true, texture_id: sdBlock.TEXTURE_ID_TZYRG_WALL, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdBlock', width: 32, height: 32, _ai_team: 8, _spawn_with_full_hp: true, texture_id: sdBlock.TEXTURE_ID_TZYRG_WALL, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdBlock', width: 16, height: 8, _ai_team: 8, _spawn_with_full_hp: true, texture_id: sdBlock.TEXTURE_ID_TZYRG_WALL, _category:'Faction outpost tools' });
			sdShop.options.push({ _class: 'sdBlock', width: 8, height: 16, _ai_team: 8, _spawn_with_full_hp: true, texture_id: sdBlock.TEXTURE_ID_TZYRG_WALL, _category:'Faction outpost tools' });
			//

			//let remover_sd_filter = sdWorld.CreateSDFilter();
			//sdWorld.ReplaceColorInSDFilter_v2( remover_sd_filter, '#abcbf4', '#ff9292' );

			//sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_REMOVER, sd_filter:remover_sd_filter, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_REMOVER, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_TELEPORTER, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdGun', class:sdGun.CLASS_ADMIN_DAMAGER, _category:'Admin tools' });
			sdShop.options.push({ _class: 'sdLongRangeTeleport', is_server_teleport:1, _category:'Admin tools' });

			// for ( var i = 1; i <= 40; i++ ) // increment when you add new humanoids or else they won't show up in shop // This is no longer required. - Molis
			for ( var i = 1; i < sdFactionTools.FACTIONS_LENGTH; i++ )
			{
				sdShop.options.push({
					_class: 'sdFactionTools',
					type:i,
					_category:'Humanoid Spawner'
				});
			}

			// Make all admin tools have Infinite cost to prevent them from being build by non-admins
			for ( let i = 0; i < sdShop.options.length; i++ )
			if ( sdShop.options[ i ]._category === 'Admin tools' || sdShop.options[ i ]._category === 'Development tests' || sdShop.options[ i ]._category === 'Humanoid Spawner' || sdShop.options[ i ]._category === 'Faction outpost tools' )
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
				max_level: 2,
				matter_cost: 75,
				description: 'Allows you to use the hook (to carry items and crystals around) with C button or Mouse Wheel click. Level 2 hook\'s length can be changed by holding Right Mouse button.',
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
					character.UninstallUpgrade( 'upgrade_shield' ); // Uninstall upgrades which use this button
					character._ghost_allowed = true;
				},
				reverse_action: ( character, level_purchased )=>
				{
					character._ghost_allowed = false;
					character.TogglePlayerAbility();
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
				max_with_upgrade_station_level: 10,
				min_upgrade_station_level: 3,
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
				max_with_upgrade_station_level: 10,
				min_upgrade_station_level: 2,
				description: 'Reduces matter cost for using jetpack.',
				action: ( character, level_purchased )=>
				{
					character._jetpack_fuel_multiplier = 1 - ( 0.09 * level_purchased ); // Max 90% fuel cost reduction
				}
			},
			upgrade_matter_regeneration_speed: // Upgrade idea & pull request by Booraz149 ( https://github.com/Booraz149 )
			{
				max_level: 3,
				matter_cost: 200,
				min_build_tool_level: 2,
				max_with_upgrade_station_level: 5,
				min_upgrade_station_level: 4,
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
				max_with_upgrade_station_level: 5,
				min_upgrade_station_level: 5,
				description: 'Increases jetpack efficiency to reach higher speeds faster.',
				action: ( character, level_purchased )=>
				{
					character._jetpack_power = 1 + ( level_purchased * 0.4 );
				}
			},
			upgrade_stability_recovery:
			{
				max_level: 3,
				matter_cost: 125,
				min_build_tool_level: 3,
				max_with_upgrade_station_level: 5,
				min_upgrade_station_level: 6,
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
			},
			upgrade_shield:
			{
				max_level: 1,
				matter_cost: 150,
				description: 'Allows you to activate shielding capabilities by pressing E button.',
				action: ( character, level_purchased )=>
				{
					character.UninstallUpgrade( 'upgrade_invisibility' ); // Uninstall upgrades which use this button
					character._shield_allowed = true;
				},
				reverse_action: ( character, level_purchased )=>
				{
					character._shield_allowed = false;
					character.TogglePlayerAbility();
				}
			},
			upgrade_invisibility_cost_reduction:
			{
				max_level: 0, // Only with upgrade station
				matter_cost: 300,
				min_build_tool_level: 10,
				max_with_upgrade_station_level: 5,
				min_upgrade_station_level: 7,
				description: 'Reduces matter cost of invisibility ability.',
				action: ( character, level_purchased )=>
				{
					character._ghost_cost_multiplier = 1 - ( 0.07 * level_purchased );
				}
			},
			upgrade_shield_cost_reduction:
			{
				max_level: 0, // Only with upgrade station
				matter_cost: 300,
				min_build_tool_level: 10,
				max_with_upgrade_station_level: 5,
				min_upgrade_station_level: 8,
				description: 'Reduces matter cost of shield ability.',
				action: ( character, level_purchased )=>
				{
					character._shield_cost_multiplier = 1 - ( 0.07 * level_purchased );
				}
			},
			upgrade_armor_repair_speed:
			{
				max_level: 0, // Only with upgrade station
				matter_cost: 500,
				min_build_tool_level: 10,
				max_with_upgrade_station_level: 5,
				min_upgrade_station_level: 9,
				description: 'Increases speed of armor repair modules.',
				action: ( character, level_purchased )=>
				{
					character._armor_repair_mult = 1 + ( 0.1 * level_purchased ); // 50% increased speed at max level
				}
			},
			upgrade_sword_throw_strength:
			{
				max_level: 5,
				matter_cost: 125,
				max_with_upgrade_station_level: 10,
				min_upgrade_station_level: 10,
				description: 'Increases power of your sword throws.',
				action: ( character, level_purchased )=>
				{
					character._sword_throw_mult = 1 + ( 0.2 * level_purchased ); // 3x damage mult at max level
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
	static IsGodModeOnlyItem( _build_params, inception=0 )
	{
		// Loop found, ignore this parent folder
		if ( inception > 100 )
		return undefined;
		
		const Result = ( v )=>
		{
			if ( _build_params._opens_category )
			sdShop.category_godmode_permission_cache.set( _build_params._opens_category, v );
			
			return v;
		};
		
		if ( _build_params._godmode_only )
		{
			return Result( true );
		}
		
		if ( _build_params._category )
		{
			let v = sdShop.category_godmode_permission_cache.get( _build_params._category );
			if ( v !== undefined )
			return Result( v );
			
			for ( let i = 0; i < sdShop.options.length; i++ )
			{
				if ( sdShop.options[ i ]._opens_category )
				if ( sdShop.options[ i ]._opens_category === _build_params._category )
				{
					let r = sdShop.IsGodModeOnlyItem( sdShop.options[ i ], inception + 1 );
					
					if ( r !== undefined ) // Inception
					return Result( r );
				}
			}
		}
		
		return Result( false );
	}
	static Draw( ctx )
	{
		sdShop.isDrawing = true;
		
		if ( !sdWorld.my_entity )
		{
			//sdShop.open = false;
			sdShop.Close();
			return;
		}
		
		let GSPEED = ( sdWorld.time - sdShop.last_render ) / 1000 * 30;
		sdShop.last_render = sdWorld.time;
		
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
			
			// Search box
			{
				yy += 20;
				ctx.globalAlpha = 0.4 + sdShop.search_anim_morph * 0.6;
				ctx.fillStyle = '#aaffaa';
				ctx.font = "11px Verdana";
				ctx.textAlign = 'left';
				
				if ( sdWorld.mouse_screen_x >= xx - 20 )
				if ( sdWorld.mouse_screen_x < sdRenderer.screen_width - 20 )
				if ( sdWorld.mouse_screen_y >= yy - 20 )
				if ( sdWorld.mouse_screen_y < yy + 20 )
				{
					sdShop.potential_selection = sdShop.potential_selection_search_box;
				}
				
				//if ( sdShop.search_phrase.length > 0 )
				if ( sdShop.search_active )
				ctx.fillText( T('Type what to find (press Esc to cancel search)') + ': ' + sdShop.search_phrase + ( ( sdWorld.time - sdChat.blink_offset ) % 1000 < 500 ? '_' : '' ), xx, yy ); // 'Find: '
				else
				ctx.fillText( T('Click here to search'), xx, yy );
				
				let hovered = ( sdShop.search_active || sdShop.potential_selection === sdShop.potential_selection_search_box );
				
				if ( hovered && sdShop.search_anim_morph < 1 )
				sdShop.search_anim_morph = Math.min( 1, sdShop.search_anim_morph + GSPEED * 0.5 );
				else
				if ( !hovered && sdShop.search_anim_morph > 0 )
				sdShop.search_anim_morph = Math.max( 0, sdShop.search_anim_morph - GSPEED * 0.5 );
				
				ctx.globalAlpha = 1;
				yy += 40;// * sdShop.search_anim_morph;
			}
			
			let search_phrase_lower_case = sdShop.search_phrase.toLowerCase();

			//let skip = 0; // Skip current_shop_options.push if an item is not unlocked yet
			let current_shop_options = [];
			for ( var i = 0; i < sdShop.options.length; i++ )
			{
				let matches = false;
				
				if ( search_phrase_lower_case.length > 0 )
				{
					if ( sdShop.options[ i ]._opens_category === 'root' )
					matches = true;
					else
					if ( sdShop.options[ i ]._opens_category === undefined )
					{
						let category = sdShop.options[ i ]._category;
						
						matches = false;
						
						for ( let i2 = 0; i2 < sdShop.options.length; i2++ )
						if ( sdShop.options[ i2 ]._opens_category === category )
						{
							if ( sdShop.options[ i2 ]._godmode_only !== true || ( sdWorld.my_entity && sdWorld.my_entity._god ) )
							matches = true;

							break;
						}
						
						// Filter by title/description
						if ( matches )
						{
							let [ item_title, description, how_to_build_hint ] = sdShop.GetFullItemDescription( i );
							
							matches = false;
							
							if ( search_phrase_lower_case === 'rtp' )
							search_phrase_lower_case = 'rescue ';
							
							if ( search_phrase_lower_case === 'bsu' )
							search_phrase_lower_case = 'base shielding unit';
							
							if ( item_title !== undefined && item_title.toLowerCase().indexOf( search_phrase_lower_case ) !== -1 )
							matches = true;
							//else
							//if ( description !== undefined && description.toLowerCase().indexOf( search_phrase_lower_case ) !== -1 )
							//matches = true;
						}
					}
				}
				else
				{
					if ( sdShop.options[ i ]._godmode_only !== true || ( sdWorld.my_entity && sdWorld.my_entity._god ) )
					if ( sdShop.options[ i ]._category === sdShop.current_category || 
						 ( sdShop.options[ i ]._category.charAt( 0 ) === '!' && sdShop.options[ i ]._category.substring( 1 ) !== sdShop.current_category ) ) // !root case
					matches = true;
				}
				
				
				if ( matches )
				{
					if ( sdWorld.my_entity._debug )
					{
					}
					else
					if ( ( sdShop.options[ i ]._min_build_tool_level || 0 ) > sdWorld.my_entity.build_tool_level )
					{
						current_shop_options.push( sdShop.item_low_level );
						continue;
					}
					else
					if ( ( sdShop.options[ i ]._min_workbench_level || 0 ) > sdWorld.my_entity.GetWorkBenchLevel() )
					{
						current_shop_options.push( sdShop.item_low_workbench_level );
						continue;
					}
					
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
				let max_level_with_station = 0;
					
				if ( sdWorld.my_entity._build_params._class === null )
				{
					if ( typeof sdWorld.my_entity._build_params._opens_category !== 'undefined' )
					{
						matter_cost = 0;
					}
					else
					{
						matter_cost = sdWorld.my_entity._build_params.matter_cost;
						
						if ( typeof sdWorld.my_entity._build_params.upgrade_name !== 'undefined' )
						{
							max_level = sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].max_level;
							cur_level = ( sdWorld.my_entity._upgrade_counters[ sdWorld.my_entity._build_params.upgrade_name ] || 0 );
							
							let min_station_level_needed = ( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].min_upgrade_station_level || 0 );
							max_level_with_station = ( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ].max_with_upgrade_station_level || max_level );

							if ( ( cur_level >= max_level && sdWorld.my_entity.GetUpgradeStationLevel() < min_station_level_needed ) || ( cur_level >= max_level_with_station ) )
							selectable = false;
						}
						else
						{
							// Just an unavailable item?
							selectable = true;
						}
					}
				}
				else
				{
					ent = sdWorld.my_entity.CreateBuildObject( false, false, true );
					
					if ( ent )
					{
						ent.x = 0;//-100;
						ent.y = 0;

						if ( typeof sdWorld.my_entity._build_params._opens_category !== 'undefined' )
						{
							matter_cost = 0;
						}
						else
						matter_cost = ent.MeasureMatterCost();
					}
					else
					{
						// Item can not be built
					}
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
					if ( sdShop.upgrades[ sdWorld.my_entity._build_params.upgrade_name ] )
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
				
				
				if ( max_level > 0 || max_level_with_station > 0 )
				{
					ctx.fillStyle = '#ffffff';
					//ctx.font = "4.5px Verdana";
					ctx.font = "5.5px Verdana";
					ctx.textAlign = 'right';
					
					if ( max_level_with_station === 0 ) // No upgrade station upgrades?
					ctx.fillText( cur_level + " / " + max_level, 32, 32 );
					else
					{
						if ( cur_level >= max_level )
						ctx.fillText( cur_level + " / " + max_level_with_station, 32, 32 );
						else
						ctx.fillText( cur_level + " / " + max_level, 32, 32 );
					}
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
		
		if ( sdShop.potential_selection >= 0 )	
		{
			let [ item_title, description, how_to_build_hint ] = sdShop.GetFullItemDescription( sdShop.potential_selection );
			
			ctx.font = "12px Verdana";
			
			let width = 0;/*Math.max( 
				ctx.measureText( item_title || '' ).width,
				ctx.measureText( description || '' ).width,
				ctx.measureText( how_to_build_hint || '' ).width
			);*/
	
			let offset_x = sdWorld.mouse_screen_x + 16;
			
			//if ( sdWorld.mouse_screen_x + 16 + width > sdRenderer.screen_width )
			//offset_x = sdRenderer.screen_width - width - 16;
			
			ctx.textAlign = 'left';
			for ( let layer = 0; layer < 3; layer++ ) // layer 0 is size measurement, 1st is drawing background, 2nd is drawing text
			{
				let offset_y = 0;
				
				const PrintText = ( color, text )=>
				{
					let text_lines = [ text ];
					
					let line_max_width = 100;
					
					for ( let i = 0; i < text_lines.length; i++ )
					{
						if ( text_lines[ i ].length > line_max_width )
						{
							let slice_at = text_lines[ i ].lastIndexOf( ' ', line_max_width );
							
							text_lines[ i + 1 ] = text_lines[ i ].substring( slice_at + 1 );
							text_lines[ i ] = text_lines[ i ].substring( 0, slice_at );
						}
						
						if ( layer === 2 )
						{
							ctx.fillStyle = color;
							ctx.fillText( text_lines[ i ], offset_x + 5, sdWorld.mouse_screen_y + 32 + 12 + 5 + offset_y );
						}
						if ( layer === 0 )
						{
							width = Math.max( width, ctx.measureText( text_lines[ i ] ).width );
						}
						offset_y += 14;
					}

					offset_y += 14;
				};
			
				if ( item_title )
				PrintText( '#ffff00', item_title );
			
				if ( description )
				PrintText( '#ffffff', description );
			
				if ( how_to_build_hint )
				PrintText( '#aaffaa', how_to_build_hint );
				
				if ( layer === 0 )
				{
					if ( offset_x + width + 16 > sdRenderer.screen_width )
					offset_x = sdRenderer.screen_width - width - 16;
				}
				if ( layer === 1 )
				{
					ctx.fillStyle = '#000000';
					ctx.globalAlpha = 0.8;
					ctx.fillRect( offset_x, sdWorld.mouse_screen_y + 32, width + 10, 25 + offset_y - 14 * 2 );
					ctx.globalAlpha = 1;
				}
			}
			
			/*let d = ctx.measureText( how_to_build_hint );
			let d2 = ( description !== null ) ? ctx.measureText( description ) : null; // Secondary description, used for upgrades
			
			let xx = sdWorld.mouse_screen_x + 16;
			
			if ( sdWorld.mouse_screen_x + 16 + Math.max( d.width, d2 ? d2.width : 0 ) > sdRenderer.screen_width )
			xx = sdRenderer.screen_width - Math.max( d.width, d2 ? d2.width : 0 ) - 16;
			
			ctx.fillStyle = '#000000';
			ctx.globalAlpha = 0.8;
			ctx.fillRect( xx, sdWorld.mouse_screen_y + 32, d.width + 10, 12 + 10 );
			if ( description !== null )
			ctx.fillRect( xx, sdWorld.mouse_screen_y + 32, d2.width + 10, 12 + 14 + 10 );
			ctx.globalAlpha = 1;
			
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'left';
			ctx.fillText( how_to_build_hint, xx + 5, sdWorld.mouse_screen_y + 32 + 12 + 5 );
			if ( description !== null )
			ctx.fillText( description, xx + 5, sdWorld.mouse_screen_y + 32 + 12 + 14 + 5 );*/
		}

		
		sdWorld.my_entity._build_params = old_active_build_settings;
		sdShop.isDrawing = false;
	}
				
	static GetFullItemDescription( shop_item_id )
	{
		let shop_item = sdShop.options[ shop_item_id ];
		
		let cached = sdShop.full_item_description_cache.get( shop_item );
		
		if ( cached === undefined )
		{
			const capitalize = (s) => {
				if (typeof s !== 'string') return '';
				return s.charAt(0).toUpperCase() + s.slice(1);
			};

			let simple_obj = Object.assign( {}, shop_item );
			delete simple_obj._cache;
			delete simple_obj.image_obj;

			let item_title = null;
			let description = null; // Secondary description, used for upgrades
			let how_to_build_hint = 'No description for shop item #'+shop_item_id; //T('No description for ') + JSON.stringify( simple_obj );

			if ( shop_item._opens_category )
			{
				if ( shop_item._opens_category === 'root' )
				{
					if ( sdShop.search_active )
					how_to_build_hint = T('Click to cancel search');
					else
					how_to_build_hint = T('Click to leave this category');
				}
				else
				how_to_build_hint = T('Click to enter category')+' "' + shop_item._opens_category + '"';
			}
			else
			{
				let pseudo_entity = shop_item;

				pseudo_entity = Object.assign( {}, pseudo_entity ); // Clone so title property can be set

				if ( pseudo_entity.dummy_item )
				{
					item_title = T( 'Unavailable item' );
					how_to_build_hint = 'Item is unavailable yet';
					description = capitalize( pseudo_entity.description );
				}
				else
				if ( pseudo_entity._class !== null )
				{
					let descr_obj = Object.getOwnPropertyDescriptors( sdWorld.entity_classes[ pseudo_entity._class ].prototype );

					for ( let prop in descr_obj )
					Object.defineProperty( pseudo_entity, prop, descr_obj[ prop ] );

					item_title = pseudo_entity.title;

					description = pseudo_entity.description;

					how_to_build_hint = T('Click to select')+' "' + item_title + '" '+T('as a build object. Then click to place this object in world.');
				}
				else
				if ( pseudo_entity.upgrade_name )
				{
					item_title = T(capitalize( pseudo_entity.upgrade_name.split('_').join(' ') ));

					// Oh man, here I go butchering the code again :( - Booraz149

					let max_level = sdShop.upgrades[ pseudo_entity.upgrade_name ].max_level;
					let cur_level = ( sdWorld.my_entity._upgrade_counters[ pseudo_entity.upgrade_name ] || 0 );
					let min_station_level = ( sdShop.upgrades[ pseudo_entity.upgrade_name ].min_upgrade_station_level || 0 )

					how_to_build_hint = T('Click to select')+' "' + item_title + '" '+T('as an upgrade. Then click anywhere to purchase upgrade.');

					if ( ( cur_level >= max_level ) && ( sdWorld.my_entity.GetUpgradeStationLevel() < min_station_level ) )
					how_to_build_hint = T('To further')+' "' + item_title + '" '+T(', you need a level ')+ min_station_level +T(' upgrade station.');

					description = capitalize( pseudo_entity.description );
				}
			}
			
			cached = [ item_title, description, how_to_build_hint ];
			sdShop.full_item_description_cache.set( shop_item, cached );
		}
		return cached;
	}

	static async KeyDown( e )
	{
		if ( e.key === 'BrowserBack' )
		{
			sdShop.current_category = 'root';
			e.preventDefault();
			return true;
		}
		else
		if ( sdShop.search_active )
		if ( !sdChat.open )
		{
			if ( e.key === 'Backspace' )
			{
				sdShop.search_phrase = sdShop.search_phrase.slice( 0, sdShop.search_phrase.length - 1 );
				e.preventDefault();
				return true;
			}
			else
			/*if ( e.code === 'KeyX' )
			return true;
			else
			if ( e.code === 'KeyZ' )
			return true;
			else
			if ( e.code === 'KeyE' )
			return true;
			else
			if ( e.code === 'KeyC' )
			return true;*/
					
			return true;
		}
	}
	static KeyPress( e )
	{
		if ( sdShop.open )
		if ( sdWorld.time > sdShop.block_search_input_until )
		if ( sdShop.search_active )
		if ( e.key.length === 1 )
		{
			let insert = ( e.key.length === 1 ) ? e.key : '';

			if ( sdShop.search_phrase.length + insert.length < 100 )
			sdShop.search_phrase += insert;
		}
	}
		
	static MouseDown( e )
	{
		if ( sdShop.open )
		{
			if ( !sdWorld.my_entity )
			{
				//sdShop.open = false;
				sdShop.Close();
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
				if ( sdShop.potential_selection === sdShop.potential_selection_search_box )
				{
					sdShop.search_active = true;
					sdChat.blink_offset = sdWorld.time;
					return true;
				}
				else
				{
					if ( sdShop.options[ sdShop.potential_selection ]._opens_category )
					{
						sdShop.current_category = sdShop.options[ sdShop.potential_selection ]._opens_category;
						
						if ( sdShop.current_category === 'root' )
						{
							sdShop.search_active = false;
							sdShop.search_phrase = '';
						}
						
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
				//sdShop.open = false;
				sdShop.Close();
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
				//sdShop.open = true;
				sdShop.Open();
				//sdRenderer.UpdateCursor();
				return true; // Block input
			}
		}
		return false; // Allow input
	}
	static MouseWheel( e )
	{
		if ( !sdShop.open )
		return;
	
		//sdShop.scroll_y -= e.deltaY;
		sdShop.scroll_y_target -= e.deltaY;
	}
}
//sdShop.init_class();

export default sdShop;
