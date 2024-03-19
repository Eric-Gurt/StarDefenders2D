
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdTask from './sdTask.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';
import sdFactions from './sdFactions.js';
import sdFactionskin from './sdFactionskin.js';

class sdFactionTools extends sdEntity
{
	static init_class()
	{
		sdFactionTools.FT_SD_A = 1; // Star Defender Sniper
		sdFactionTools.FT_SD_B = 2; // Star Defender Shotgun
		sdFactionTools.FT_SD_C = 3; // Star Defender Light Machine Gunner
		sdFactionTools.FT_SD_D = 4; // Star Defender Assault Rifle
		sdFactionTools.FT_FALKOK_A = 5; // Falkok Heavy Rifle
		sdFactionTools.FT_FALKOK_B = 6; // Falkok Marksman
		sdFactionTools.FT_FALKOK_C = 7; // Falkok Assault Rifle
		sdFactionTools.FT_PFALKOK_A = 8; // Phoenix Falkok PSI Cutter
		sdFactionTools.FT_PFALKOK_B = 9; // Phoenix Falkok Ray Gun
		sdFactionTools.FT_SARRONIAN_A = 10; // Sarronian E6 Unit
		sdFactionTools.FT_SARRONIAN_B = 11; // Sarronian E3 Unit
		sdFactionTools.FT_VELOX_A = 12; // Velox Devastator
		sdFactionTools.FT_VELOX_B = 13; // Velox Soldier Combat Rifle Class
		sdFactionTools.FT_VELOX_C = 14; // Velox Soldier Burst Pistol Class
		sdFactionTools.FT_SETR_A = 15; // Setr Soldier Light Machine Gunner
		sdFactionTools.FT_SETR_B = 16; // Setr Soldier Shotgun
		sdFactionTools.FT_TZYRG_A = 17; // Tzyrg Shotgun
		sdFactionTools.FT_TZYRG_B = 18; // Tzyrg Assault Rifle
		sdFactionTools.FT_ERTHAL_A = 19; // Erthal Burst Rifle
		sdFactionTools.FT_ERTHAL_B = 20; // Erthal Plasma Pistol
		sdFactionTools.FT_SHURG_A = 21; // Shurg Commander
		sdFactionTools.FT_SHURG_B = 22; // Shurg
		sdFactionTools.FT_COUNCIL_A = 23; // Council Vanguard
		sdFactionTools.FT_COUNCIL_B = 24; // Council Acolyte Burst Rail Rifle
		sdFactionTools.FT_COUNCIL_C = 25; // Council Acolyte Pistol
		sdFactionTools.FT_FSB = 26; // Falkonian Sword Bot
		sdFactionTools.FT_SDR_A = 27; // Star Defender Sniper
		sdFactionTools.FT_SDR_B = 28; // Star Defender Shotgun
		sdFactionTools.FT_SDR_C = 29; // Star Defender Light Machine Gunner
		sdFactionTools.FT_SDR_D = 30; // Star Defender Assault Rifle
		sdFactionTools.FT_SDA_A = 31; // Criminal Star Defender Sniper
		sdFactionTools.FT_SDA_B = 32; // Criminal Star Defender Shotgun
		sdFactionTools.FT_SDA_C = 33; // Criminal Star Defender Light Machine Gunner
		sdFactionTools.FT_SDA_D = 34; // Criminal Star Defender Assault Rifle
		sdFactionTools.FT_TS = 35; // Time Shifter
		sdFactionTools.FT_IR_A = 36; // Instructor
		sdFactionTools.FT_IR_B = 37; // Combat Instructor
		sdFactionTools.FT_PILOT = 38; // Extraction Pilot
		sdFactionTools.FT_ZEKTARON_A = 39; // Zektaron Assault Unit
		sdFactionTools.FT_ZEKTARON_B = 40; // Zektaron Seeker Unit

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }

	constructor( params )
	{
		super( params );

		this.type = params.type || 1;

		this.hmax = 100;
		this.hea = this.hmax;
	}
	
	get title()
	{
		let [ character_entity, gun_entity ] = sdFactionTools.SpawnCharacter( this.type );
		
		if ( character_entity )
		{
			if ( gun_entity )
			if ( sdGun.classes[ gun_entity.class ] )
			{
				return character_entity.title + ' ' + T( 'equipped with' ) + ' ' + sdGun.classes[ gun_entity.class ].title;
			}
				
			return character_entity.title;
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		let [ character_entity, gun_entity ] = sdFactionTools.SpawnCharacter( this.type );
		
		ctx.sd_filter = character_entity.sd_filter;
		ctx.save();
		{
			ctx.translate( -4, 0 );
			
			if ( character_entity.s )
			ctx.scale( character_entity.s/100, character_entity.s/100 );
			
			ctx.drawImageFilterCache( sdCharacter.img_helmets[ character_entity.helmet ], 0, 0, 32, 32, - 16, - 16, 32,32 );

			if ( gun_entity )
			ctx.drawImageFilterCache( sdGun.classes[ gun_entity.class ].image, -8, - 16, 32,32 );
		}
		ctx.restore();
		
		ctx.sd_filter = null;
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	static SpawnCharacter( type, relative_to=null ) // If relative_to is not specified - it will create daft object that has all needed properties
	{
		let xx = 0;
		let yy = 0;
		
		let CHARACTER_CLASS = sdCharacter;
		let GUN_CLASS = sdGun;
		let ENTITIES_ARRAY = sdEntity.entities;
		
		let teleport_sound = 'teleport';
		let teleport_volume = 1;
		let teleport_effect_filter = 'none';
		
		if ( relative_to )
		{
			xx = relative_to.x;
			yy = relative_to.y;
		}
		else
		{
			CHARACTER_CLASS = 
				GUN_CLASS = class Daft
				{ 
					constructor(params)
					{
						Object.assign( this, params );
					} 
					ApplyStatusEffect(){} 
				};
		
			ENTITIES_ARRAY = { 
				push: ()=>{}
			};
		}
		
		let character_entity = null;
		let gun_entity = null;
		
		{
			if ( type === sdFactionTools.FT_SD_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else
			if ( type === sdFactionTools.FT_SD_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else
			if ( type === sdFactionTools.FT_SD_C )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else
			if ( type === sdFactionTools.FT_SD_D )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else

			if ( type === sdFactionTools.FT_FALKOK_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_HEAVY_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );
				}
			}
			else
			if ( type === sdFactionTools.FT_FALKOK_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );
				}
			}
			else
			if ( type === sdFactionTools.FT_FALKOK_C )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );
				}
			}
			else
			if ( type === sdFactionTools.FT_PFALKOK_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_PHOENIX_FALKOK );
				}
			}
			else
			if ( type === sdFactionTools.FT_PFALKOK_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_PHOENIX_FALKOK );
				}
			}
			else

			if ( type === sdFactionTools.FT_SARRONIAN_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_ENERGY_DISPLACER }) );
					character_entity._ai_gun_slot = 5;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SARRONIAN_HEAVY );
				}
			}
			else
			if ( type === sdFactionTools.FT_SARRONIAN_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_SMG }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SARRONIAN );
				}
			}
			else
			if ( type === sdFactionTools.FT_ZEKTARON_A )
			{
				teleport_effect_filter = 'hue-rotate(140deg)';

				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ZEKTARON_COMBAT_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ZEKTARON_ASSAULT );
				}
			}
			else
			if ( type === sdFactionTools.FT_ZEKTARON_B )
			{
				teleport_effect_filter = 'hue-rotate(140deg)';

				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ZEKTARON_RAILGUN }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ZEKTARON_SEEKER );
				}
			}
			else

			if ( type === sdFactionTools.FT_VELOX_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAIL_CANNON }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX_DEVASTATOR );
				}
			}
			else
			if ( type === sdFactionTools.FT_VELOX_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_COMBAT_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX_RIFLE );
				}
			}
			else
			if ( type === sdFactionTools.FT_VELOX_C )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX );
				}
			}
			else

			if ( type === sdFactionTools.FT_SETR_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SETR );
				}
			}
			else

			if ( type === sdFactionTools.FT_SETR_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_PLASMA_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SETR );
				}
			}
			else

			if ( type === sdFactionTools.FT_TZYRG_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TZYRG );
				}
			}
			else
			if ( type === sdFactionTools.FT_TZYRG_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TZYRG );
				}
			}
			else

			if ( type === sdFactionTools.FT_ERTHAL_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_BURST_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ERTHAL );
				}
			}
			else
			if ( type === sdFactionTools.FT_ERTHAL_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_PLASMA_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ERTHAL );
				}
			}
			else

			if ( type === sdFactionTools.FT_SHURG_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SHURG_COMMANDER );
				}
			}
			else
			if ( type === sdFactionTools.FT_SHURG_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SHURG );
				}
			}
			else

			if ( type === sdFactionTools.FT_COUNCIL_A )
			{
				teleport_sound = 'council_teleport';
				teleport_volume = 0.5;
				teleport_effect_filter = 'hue-rotate(170deg)';

				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL_VANGUARD );

					const logic = ()=>
					{
					if ( character_entity.hea <= 0 )
					if ( !character_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
						sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170 });
						character_entity.remove();
					}
					};
					setInterval( logic, 1000 );
				}
			}
			else
			if ( type === sdFactionTools.FT_COUNCIL_B )
			{
				teleport_sound = 'council_teleport';
				teleport_volume = 0.5;
				teleport_effect_filter = 'hue-rotate(170deg)';

				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_BURST_RAIL }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL );

					const logic = ()=>
					{
					if ( character_entity.hea <= 0 )
					if ( !character_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
						sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170 });
						character_entity.remove();
					}
					};
					setInterval( logic, 1000 );
				}
			}
			else
			if ( type === sdFactionTools.FT_COUNCIL_C )
			{
				teleport_sound = 'council_teleport';
				teleport_volume = 0.5;
				teleport_effect_filter = 'hue-rotate(170deg)';

				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL );

					const logic = ()=>
					{
					if ( character_entity.hea <= 0 )
					if ( !character_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
						sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170 });
						character_entity.remove();
					}
					};
					setInterval( logic, 1000 );
				}
			}
			else

			if ( type === sdFactionTools.FT_FSB )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				ENTITIES_ARRAY.push( character_entity );
				{
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKONIAN_SWORD_BOT );
				}
			}
			else

			if ( type === sdFactionTools.FT_SDR_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else
			if ( type === sdFactionTools.FT_SDR_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else
			if ( type === sdFactionTools.FT_SDR_C )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else
			if ( type === sdFactionTools.FT_SDR_D )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else

			if ( type === sdFactionTools.FT_SDA_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else
			if ( type === sdFactionTools.FT_SDA_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else
			if ( type === sdFactionTools.FT_SDA_C )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else
			if ( type === sdFactionTools.FT_SDA_D )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else

			if ( type === sdFactionTools.FT_TS )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TELEPORT_SWORD }) );
					character_entity._ai_gun_slot = 0;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TIME_SHIFTER );
				}
			}

			if ( type === sdFactionTools.FT_IR_A )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAILGUN }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_INSTRUCTOR );
				}
			}
			else
			if ( type === sdFactionTools.FT_IR_B )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COMBAT_INSTRUCTOR );
				}
			}
			else

			if ( type === sdFactionTools.FT_PILOT )
			{
				character_entity = new CHARACTER_CLASS({ x:xx, y:yy, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				ENTITIES_ARRAY.push( character_entity );
				{
					ENTITIES_ARRAY.push( gun_entity = new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SMG }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_EXTRACTION_PILOT );
				}
			}
		}
		
		if ( relative_to )
		{
			sdSound.PlaySound({ name:teleport_sound, x:xx, y:yy, pitch: 1, volume:teleport_volume });
			sdWorld.SendEffect({ x:xx, y:yy, type:sdEffect.TYPE_TELEPORT, filter:teleport_effect_filter });
		}
		
		return [ character_entity, gun_entity ];
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;

		this.hea -= GSPEED;

		if ( this.hea < 95 )
		{
			sdFactionTools.SpawnCharacter( this.type, this );

			this.remove();
		}
	}
}

export default sdFactionTools;