
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';

class sdFactions extends sdEntity
{
	static init_class()
	{
		sdFactions.FACTION_FALKOK = 1; // Falkoks
		sdFactions.FACTION_ERTHAL = 2; // Erthals
		sdFactions.FACTION_COUNCIL = 3; // Council
		sdFactions.FACTION_SARRORIAN = 4; // Sarrorian
		sdFactions.FACTION_VELOX = 5; // Velox
		sdFactions.FACTION_SETR = 6; // Setr
		sdFactions.FACTION_TZYRG = 7; // Tzyrg
		sdFactions.FACTION_SHURG = 8; // Shurg
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	// This class is used to simplify humanoid faction storage, faction creation and their humanoid properties - Booraz149
	// Just use sdFactions.SetHumanoidProperties( character_entity, faction = faction number ). Factions are stated inside static init_class() to keep it simple and comprehensible.

	static SetHumanoidProperties( character_entity, faction = -1 ) // This automatically generates a humanoid based off a faction we selected. Must specify character_entity.
	{
		let character_settings;
		if ( faction === sdFactions.FACTION_FALKOK ) // Falkoks
		{
			if ( Math.random() < 0.07 )
			{
				if ( Math.random() < 0.2 )
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }) );
					character_entity._ai_gun_slot = 4;
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN }) );
					character_entity._ai_gun_slot = 3;
				}
			}
			else
			{ 
				if ( Math.random() < 0.1 )
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }) );
					character_entity._ai_gun_slot = 2;
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );
					character_entity._ai_gun_slot = 2;
				}
			}
			if ( character_entity._ai_gun_slot === 2 )
			character_settings = {"hero_name":"Falkok", // Name
			"color_bright":"#6b0000", // Helmet bright color
			"color_dark":"#420000", // Helmet dark color
			"color_visor":"#5577b9", // Visor color
			"color_bright3":"#6b0000", // Jetpack (bright shade) color
			"color_dark3":"#420000", // Jetpack (dark shade) color
			"color_suit":"#240000", // Upper suit color
			"color_suit2":"#2e0000", // Lower suit color
			"color_dark2":"#560101", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#240000", // Gloves and neck color
			"color_extra1":"#240000",
			"helmet2":true,
			"body60":true,
			"legs60":true,
			"voice6":true };

			if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If Falkok spawns with Raygun or PSI-Cutter, change their looks Phoenix Falkok
			character_settings = {"hero_name":"Phoenix Falkok", // Name
			"color_bright":"#ffc800", // Helmet bright color
			"color_dark":"#a37000", // Helmet dark color
			"color_visor":"#000000", // Visor color
			"color_bright3":"#ffc800", // Jetpack (bright shade) color
			"color_dark3":"#a37000", // Jetpack (dark shade) color
			"color_suit":"#ffc800", // Upper suit color
			"color_suit2":"#ffc800", // Lower suit color
			"color_dark2":"#000000", // Lower suit plates color
			"color_shoes":"#a37000", // Shoes color
			"color_skin":"#a37000", // Gloves and neck color
			"helmet12":true,
			"body60":true,
			"legs60":true,
			"voice6":true };

			if ( character_entity._ai_gun_slot === 2 ) // If a regular falkok spawns
			{
				character_entity.matter = 85;
				character_entity.matter_max = 85;

				character_entity.hea = 125; // 105 so railgun requires at least headshot to kill and body shot won't cause bleeding
				character_entity.hmax = 125;
			}

			if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If a Phoenix Falkok spawns
			{
				character_entity.matter = 125;
				character_entity.matter_max = 125;

				character_entity.hea = 250; // It is a stronger falkok after all
				character_entity.hmax = 250;
			}	
			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			//character_entity._ai_enabled = sdCharacter.AI_MODEL_FALKOK;
										
			character_entity._ai_level = Math.floor( Math.random() * 2 ); // Either 0 or 1
										
			character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( faction === sdFactions.FACTION_ERTHAL ) // Erthals
		{
			if ( Math.random() < 0.3 )
			{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_BURST_RIFLE }) );
					character_entity._ai_gun_slot = 2;
			}
			else
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_PLASMA_PISTOL }) );
				character_entity._ai_gun_slot = 1;
			}
				character_settings = {"hero_name":"Erthal", // Name
				"color_bright":"#37a2ff", // Helmet bright color
				"color_dark":"#000000", // Helmet dark color
				"color_visor":"#1664a8", // Visor color
				"color_bright3":"#464646", // Jetpack (bright shade) color
				"color_dark3":"#000000", // Jetpack (dark shade) color
				"color_suit":"#464646", // Upper suit color
				"color_suit2":"#000000", // Lower suit color
				"color_dark2":"#464646", // Lower suit plates color
				"color_shoes":"#000000", // Shoes color
				"color_skin":"#1665a8", // Gloves and neck color
				"color_extra1":"#464646", // Extra 1 color
				"helmet4":true,
				"body3":true,
				"legs3":true,
				"voice7":true };
				if ( character_entity._ai_gun_slot === 2 || character_entity._ai_gun_slot === 1 )
				{
					character_entity.matter = 150;
					character_entity.matter_max = 150;

					character_entity.hea = 650;
					character_entity.hmax = 650;

				}
	
				character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
				//character_entity._ai_enabled = sdCharacter.AI_MODEL_FALKOK;				
				character_entity._ai_level = 4;
										
				character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
				character_entity._jetpack_allowed = true; // Jetpack
				character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
				character_entity._ai_team = 2; // AI team 2 is for Erthal
				character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( faction === sdFactions.FACTION_COUNCIL )
		{
			if ( Math.random() < 0.075 )
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_SHOTGUN }) );
				character_entity._ai_gun_slot = 3;
			}
			else
			if ( Math.random() > 0.2 )
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_BURST_RAIL }) );
				character_entity._ai_gun_slot = 4;
			}
			else
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_PISTOL }) );
				character_entity._ai_gun_slot = 1;
			}
			if ( character_entity._ai_gun_slot === 1 || character_entity._ai_gun_slot === 4 )
			character_settings = {"hero_name":"Council Acolyte", // Name
			"color_bright":"#bca63e", // Helmet bright color
			"color_dark":"#e3d06d", // Helmet dark color
			"color_visor":"#00ffdf", // Visor color
			"color_bright3":"#ffea70", // Jetpack (bright shade) color
			"color_dark3":"#cbba48", // Jetpack (dark shade) color
			"color_suit":"#003e7a", // Upper suit color
			"color_suit2":"#af963c", // Lower suit color
			"color_dark2":"#d0b943", // Lower suit plates color
			"color_shoes":"#9b7f31", // Shoes color
			"color_skin":"#1c1c1c", // Gloves and neck color
			"color_extra1":"#00ffdf", // Extra 1 color
			"helmet23":true,
			"body66":true,
			"legs27":true,
			"voice8":true };

			if ( character_entity._ai_gun_slot === 3 )
			character_settings = {"hero_name":"Council Vanguard", // Name
			"color_bright":"#bca63e", // Helmet bright color
			"color_dark":"#e3d06d", // Helmet dark color
			"color_visor":"#00ffdf", // Visor color
			"color_bright3":"#ffea70", // Jetpack (bright shade) color
			"color_dark3":"#cbba48", // Jetpack (dark shade) color
			"color_suit":"#003e7a", // Upper suit color
			"color_suit2":"#af963c", // Lower suit color
			"color_dark2":"#d0b943", // Lower suit plates color
			"color_shoes":"#9b7f31", // Shoes color
			"color_skin":"#1c1c1c", // Gloves and neck color
			"color_extra1":"#00ffdf", // Extra 1 color
			"helmet96":true,
			"body68":true,
			"legs68":true,
			"voice8":true };

			if ( character_entity._ai_gun_slot === 4 || character_entity._ai_gun_slot === 1 )
			{
				character_entity.matter = 300;
				character_entity.matter_max = 300; // Let player leech matter off the bodies

				character_entity.hea = 850;
				character_entity.hmax = 850;
			}
			if ( character_entity._ai_gun_slot === 3 )
			{
				character_entity.matter = 300;
				character_entity.matter_max = 300; // Let player leech matter off the bodies

				character_entity.hea = 1000;
				character_entity.hmax = 1000;

			}
			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			//character_entity._ai_enabled = sdCharacter.AI_MODEL_AGGRESSIVE;

			character_entity._ai_level = 10;

			character_entity._matter_regeneration = 10 + character_entity._ai_level; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 3; // AI team 3 is for the Council
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			sdSound.PlaySound({ name:'council_teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
			character_entity._ai.next_action = 5;

			sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
		}

		if ( faction === sdFactions.FACTION_SARRORIAN ) // Sarrorians
		{
			if ( Math.random() < 0.3 )
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_GAUSS_RIFLE }) );
				character_entity._ai_gun_slot = 8;
			}
			else
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ALIEN_ENERGY_RIFLE }) );
				character_entity._ai_gun_slot = 8;
			}

			if ( character_entity._ai_gun_slot === 8 )
			character_settings = {"hero_name":"Sarronian E2 Unit", // Name
			"color_bright":"#202020", // Helmet bright color
			"color_dark":"#101010", // Helmet dark color
			"color_visor":"#FFA000", // Visor color
			"color_bright3":"#000000", // Jetpack (bright shade) color
			"color_dark3":"#101010", // Jetpack (dark shade) color
			"color_suit":"#202020", // Upper suit color
			"color_suit2":"#101010", // Lower suit color
			"color_dark2":"#101010", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#FFFF00", // Gloves and neck color
			"color_extra1":"#00FF00", // Extra 1 color
			"helmet77":true,
			"body18":true,
			"legs36":true,
			"voice10":true };

			if ( character_entity._ai_gun_slot === 8 ) // If a regular Sarronian soldier
			{
				character_entity.matter = 250;
				character_entity.matter_max = 250;

				character_entity.hea = 350;
				character_entity.hmax = 350;
			}

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 10; // increased alongside matter regen multiplier to allow them to efficiently use the Gauss cannon.
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 4; // AI team 4 is for Sarronian faction
			character_entity._matter_regeneration_multiplier = 25; // Their matter regenerates 25 times faster than normal, unupgraded players
		}

		if ( faction === sdFactions.FACTION_VELOX ) // Velox
		{
			if ( Math.random() < 0.35 )
			{
				if ( Math.random() < 0.25 )
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAIL_CANNON }) );
					character_entity._ai_gun_slot = 4;
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_COMBAT_RIFLE }) );
					character_entity._ai_gun_slot = 2;
				}
			}
			else
			{ 
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_PISTOL }) );
					character_entity._ai_gun_slot = 1;
				}
			}
			if ( character_entity._ai_gun_slot === 1 )
			character_settings = {"hero_name":"Velox Soldier", // Name // blue soldier
			"color_bright":"#bcbcbc", // Helmet bright color
			"color_dark":"#7a7a7a", // Helmet dark color
			"color_visor":"#00ffff", // Visor color
			"color_bright3":"#bcbcbc", // Jetpack (bright shade) color
			"color_dark3":"#7a7a7a", // Jetpack (dark shade) color
			"color_suit":"#1c1c1c", // Upper suit color
			"color_suit2":"#121212", // Lower suit color
			"color_dark2":"#a2a2a2", // Lower suit plates color
			"color_shoes":"#1c1c1c", // Shoes color
			"color_skin":"#626262", // Gloves and neck color
			"color_extra1":"#00b9b9", // Extra 1 color
			"helmet86":true, // Velox helmet
			"body89":true, // Lite Velox body
			"legs89":true, // Lite Velox legs
			"voice7":true };

			if ( character_entity._ai_gun_slot === 2 )
			character_settings = {"hero_name":"Velox Soldier", // Name // green soldier
			"color_bright":"#bcbcbc", // Helmet bright color
			"color_dark":"#7a7a7a", // Helmet dark color
			"color_visor":"#00ff00", // Visor color
			"color_bright3":"#bcbcbc", // Jetpack (bright shade) color
			"color_dark3":"#7a7a7a", // Jetpack (dark shade) color
			"color_suit":"#1c1c1c", // Upper suit color
			"color_suit2":"#121212", // Lower suit color
			"color_dark2":"#a2a2a2", // Lower suit plates color
			"color_shoes":"#1c1c1c", // Shoes color
			"color_skin":"#626262", // Gloves and neck color
			"color_extra1":"#00b900", // Extra 1 color
			"helmet86":true, // Velox helmet
			"body59":true, // Velox body
			"legs59":true, // Velox legs
			"voice7":true };

			if ( character_entity._ai_gun_slot === 4 )
			character_settings = {"hero_name":"Velox Devastator", // Name
			"color_bright":"#bcbcbc", // Helmet bright color
			"color_dark":"#7a7a7a", // Helmet dark color
			"color_visor":"#ff0000", // Visor color
			"color_bright3":"#bcbcbc", // Jetpack (bright shade) color
			"color_dark3":"#7a7a7a", // Jetpack (dark shade) color
			"color_suit":"#1c1c1c", // Upper suit color
			"color_suit2":"#121212", // Lower suit color
			"color_dark2":"#a2a2a2", // Lower suit plates color
			"color_shoes":"#1c1c1c", // Shoes color
			"color_skin":"#626262", // Gloves and neck color
			"color_extra1":"#b90000", // Extra 1 color
			"helmet86":true, // Velox helmet
			"body90":true, // Heavy Velox body
			"legs90":true, // Heavy Velox legs
			"voice7":true };

			if ( character_entity._ai_gun_slot === 1 || 2 ) // If a regular Velox soldier
			{
				character_entity.matter = 200;
				character_entity.matter_max = 200;

				character_entity.hea = 650;
				character_entity.hmax = 650;
			}

			if ( character_entity._ai_gun_slot === 4 ) // Rail cannon Velox, harder to kill
			{
				character_entity.matter = 400;
				character_entity.matter_max = 400;

				character_entity.hea = 1100;
				character_entity.hmax = 1100;
				character_entity.s = 110; // Tougher so bigger target
			}
			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 5; // AI team 5 is for Velox faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( faction === sdFactions.FACTION_SETR ) // Setr
		{
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_PLASMA_SHOTGUN }) );
				character_entity._ai_gun_slot = 3;
			}

			if ( character_entity._ai_gun_slot === 3 )
			character_settings = {"hero_name":"Setr Soldier", // Name
			"color_bright":"#0000c0", // Helmet bright color
			"color_dark":"#404040", // Helmet dark color
			"color_visor":"#c8c800", // Visor color
			"color_bright3":"#404040", // Jetpack (bright shade) color
			"color_dark3":"#202020", // Jetpack (dark shade) color
			"color_suit":"#000080", // Upper suit color
			"color_suit2":"#000080", // Lower suit color
			"color_dark2":"#404040", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#000000", // Gloves and neck color
			"helmet3":true,
			"body18":true,
			"legs22":true,
			"voice9":true };

			if ( character_entity._ai_gun_slot === 3 ) // If a regular Setr soldier
			{
				character_entity.matter = 150;
				character_entity.matter_max = 150;

				character_entity.hea = 560;
				character_entity.hmax = 560;

			}

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 7; // AI team 7 is for Setr faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( faction === sdFactions.FACTION_TZYRG ) // Tzyrg
		{
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_SHOTGUN }) );
				character_entity._ai_gun_slot = 3;
			}

			if ( character_entity._ai_gun_slot === 3 )
			character_settings = {"hero_name":"Tzyrg", // Name
			"color_bright":"#404040", // Helmet bright color
			"color_dark":"#202020", // Helmet dark color
			"color_visor":"#FF0000", // Visor color
			"color_bright3":"#303030", // Jetpack (bright shade) color
			"color_dark3":"#202020", // Jetpack (dark shade) color
			"color_suit":"#404040", // Upper suit color
			"color_suit2":"#383838", // Lower suit color
			"color_dark2":"#202020", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#101010", // Gloves and neck color
			"color_extra1":"#000000", // Extra 1 color
			"helmet69":true,
			"body34":true,
			"legs36":true,
			"voice10":true };

			if ( character_entity._ai_gun_slot === 3 ) // If a regular Tzyrg
			{
				character_entity.matter = 100;
				character_entity.matter_max = 100;

				character_entity.hea = 200;
				character_entity.hmax = 200;
			}

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 1 + Math.random() * 2 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 8; // AI team 8 is for Tzyrg faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( faction === sdFactions.FACTION_SHURG ) // Shurg
		{
			if ( Math.random() < 0.2 )
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_SNIPER }) );
				character_entity._ai_gun_slot = 4;
			}
			else
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_PISTOL }) );
				character_entity._ai_gun_slot = 1;
			}

			if ( character_entity._ai_gun_slot === 1 )
			character_settings = {	"hero_name":"Shurg", // Name
			"color_bright":"#203020", // Helmet bright color
			"color_dark":"#102010", // Helmet dark color
			"color_visor":"#109000", // Visor color
			"color_bright3":"#004000", // Jetpack (bright shade) color
			"color_dark3":"#002000", // Jetpack and armor plates (dark shade) color
			"color_suit":"#003000", // Upper suit color
			"color_suit2":"#001000", // Lower suit color
			"color_dark2":"#083008", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#080808", // Gloves and neck color
			"color_extra1":"#003000", // Extra 1 color
			"helmet76":true,
			"body48":true,
			"legs17":true,
			"voice10":true };

			if ( character_entity._ai_gun_slot === 4 ) // Shurg Commander
			character_settings = {	"hero_name":"Shurg Commander", // Name
			"color_bright":"#203020", // Helmet bright color
			"color_dark":"#102010", // Helmet dark color
			"color_visor":"#109000", // Visor color
			"color_bright3":"#004000", // Jetpack (bright shade) color
			"color_dark3":"#002000", // Jetpack and armor plates (dark shade) color
			"color_suit":"#003000", // Upper suit color
			"color_suit2":"#001000", // Lower suit color
			"color_dark2":"#083008", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#080808", // Gloves and neck color
			"color_extra1":"#003000", // Extra 1 color
			"helmet76":true,
			"body36":true,
			"legs25":true,
			"voice10":true };

			if ( character_entity._ai_gun_slot === 4 ) // Shurg commander
			{
				character_entity.matter = 125;
				character_entity.matter_max = 125;

				character_entity.hea = 350;
				character_entity.hmax = 350;
			}

			if ( character_entity._ai_gun_slot === 1 ) // Shurg
			{
				character_entity.matter = 85;
				character_entity.matter_max = 85;

				character_entity.hea = 200;
				character_entity.hmax = 200;
			}

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 1 + Math.random() * 2 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = false; // No jetpack
			character_entity._ai_team = 9; // AI team 9 is for Shurg faction
			character_entity._matter_regeneration_multiplier = 5; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( character_settings );
		character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( character_settings );
		character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( character_settings );
		character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( character_settings );
		character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( character_settings );
		character_entity.title = character_settings.hero_name;

		/*if ( faction !== -1 )
		return true;
		else
		return false;*/
	}
}
//sdFactions.init_class();

export default sdFactions;
