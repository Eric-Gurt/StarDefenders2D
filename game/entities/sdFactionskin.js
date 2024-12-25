
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';
import sdStatusEffect from './sdStatusEffect.js';

class sdFactionskin extends sdEntity
{
	static init_class()
	{
		sdFactionskin.SKIN_STAR_DEFENDER = 0; // Star Defender
		sdFactionskin.SKIN_FALKOK = 1; // Falkok
		sdFactionskin.SKIN_PHOENIX_FALKOK = 2; // Phoenix Falkok
		sdFactionskin.SKIN_ERTHAL = 3; // Erthal
		sdFactionskin.SKIN_COUNCIL = 4; // Council Acolyte
		sdFactionskin.SKIN_COUNCIL_VANGUARD = 5; // Council Vanguard
		sdFactionskin.SKIN_SARRONIAN = 6; // Sarronian E3 Unit
		sdFactionskin.SKIN_SARRONIAN_HEAVY = 7; // Sarronian E6 Unit
		sdFactionskin.SKIN_VELOX = 8; // Velox Combat Pistol Class
		sdFactionskin.SKIN_VELOX_RIFLE = 9; // Velox Combat Rifle Class
		sdFactionskin.SKIN_VELOX_DEVASTATOR = 10; // Velox Devastator
		sdFactionskin.SKIN_SETR = 11; // Setr Soldier
		sdFactionskin.SKIN_TZYRG = 12; // Tzyrg
		sdFactionskin.SKIN_SHURG = 13; // Shurg
		sdFactionskin.SKIN_SHURG_COMMANDER = 14; // Shurg Commander
		sdFactionskin.SKIN_FALKONIAN_SWORD_BOT = 15; // Falkonian Sword Bot
		sdFactionskin.SKIN_STAR_DEFENDER_RESCUE = 16; // Rescue Star Defender
		sdFactionskin.SKIN_STAR_DEFENDER_ARREST = 17; // Arrest Star Defender
		sdFactionskin.SKIN_TIME_SHIFTER = 18; // Time Shifter
		sdFactionskin.SKIN_INSTRUCTOR = 19; // Instructor
		sdFactionskin.SKIN_COMBAT_INSTRUCTOR = 20; // Combat Instructor
		sdFactionskin.SKIN_EXTRACTION_PILOT = 21; // Extraction Pilot
		sdFactionskin.SKIN_ZEKTARON_ASSAULT = 22; // Zektaron Assault Unit
		sdFactionskin.SKIN_ZEKTARON_SEEKER = 23; // Zektaron Seeker Unit

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	static SetHumanoidSkinClass( character_entity, skin_class = -1, ENTITIES_ARRAY=sdEntity.entities, GUN_CLASS=sdGun, PLAY_SOUND_METHOD=sdSound.PlaySound, SEND_EFFECT_METHOD=sdWorld.SendEffect )
	{
		let character_settings;
		if ( skin_class === sdFactionskin.SKIN_STAR_DEFENDER ) // Star Defender Regular
		{
			character_settings = {"hero_name":"Star Defender Soldier", // Name
			"color_bright":"#c0c0c0", // Helmet bright color
			"color_dark":"#808080", // Helmet dark color
			"color_visor":"#FF0000", // Visor color
			"color_bright3":"#c0c0c0", // Jetpack (bright shade) color
			"color_dark3":"#808080", // Jetpack (dark shade) color
			"color_suit":"#000080", // Upper suit color
			"color_suit2":"#000080", // Lower suit color
			"color_dark2":"#808080", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#808000", // Gloves and neck color
			"color_extra1":"#0000FF",
			"helmet1":true,
			"voice1":true };

			character_entity.matter = 185;
			character_entity.matter_max = 185;

			character_entity.hea = 250; // It is a star defender after all
			character_entity.hmax = 250;

			character_entity.armor = 500;
			character_entity.armor_max = 500;
			character_entity._armor_absorb_perc = 0.6; // 60% damage reduction
			character_entity.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor

			character_entity._ai_level = 5;

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 0; // AI team 0 is for normal Star Defenders
			character_entity._matter_regeneration_multiplier = 4; // Their matter regenerates 4 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_FALKOK ) // Falkok
		{
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

			character_entity.matter = 85;
			character_entity.matter_max = 85;

			character_entity.hea = 125; // 105 so railgun requires at least headshot to kill and body shot won't cause bleeding
			character_entity.hmax = 125;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( Math.random() * 2 ); // Either 0 or 1

			character_entity._matter_regeneration = 3; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			character_entity._ai_enabled = ( Math.random() < 0.5 ) ? sdCharacter.AI_MODEL_FALKOK : sdCharacter.AI_MODEL_AERIAL; // 50% chance for aerial behaviour
			character_entity._init_ai_model = character_entity._ai_enabled;
		}

		if ( skin_class === sdFactionskin.SKIN_PHOENIX_FALKOK ) // Phoenix Falkok
		{
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

			character_entity.matter = 125;
			character_entity.matter_max = 125;

			character_entity.hea = 250; // It is a stronger falkok after all
			character_entity.hmax = 250;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( Math.random() * 2 ); // Either 0 or 1
										
			character_entity._matter_regeneration = 3; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			character_entity._ai_enabled = ( Math.random() < 0.5 ) ? sdCharacter.AI_MODEL_FALKOK : sdCharacter.AI_MODEL_AERIAL; // 50% chance for aerial behaviour
			character_entity._init_ai_model = character_entity._ai_enabled;
		}

		if ( skin_class === sdFactionskin.SKIN_ERTHAL ) // Erthal
		{
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
			"voice11":true };

			character_entity.matter = 150;
			character_entity.matter_max = 150;

			character_entity.hea = 500;
			character_entity.hmax = 500;
	
			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };			
			character_entity._ai_level = 4;

			character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 2; // AI team 2 is for Erthal
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_COUNCIL ) // Council Acolyte
		{
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

			character_entity.matter = 300;
			character_entity.matter_max = 300; // Let player leech matter off the bodies

			character_entity.hea = 650;
			character_entity.hmax = 650;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = 10;

			character_entity._matter_regeneration = 10 + character_entity._ai_level; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 3; // AI team 3 is for the Council
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			PLAY_SOUND_METHOD({ name:'council_teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
			character_entity._ai.next_action = 5;
			character_entity._ai_enabled = ( Math.random() < 0.25 ) ? sdCharacter.AI_MODEL_AGGRESSIVE : sdCharacter.AI_MODEL_AERIAL; // 25% chance for aerial behaviour
			character_entity._init_ai_model = character_entity._ai_enabled;

			SEND_EFFECT_METHOD({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
		}

		if ( skin_class === sdFactionskin.SKIN_COUNCIL_VANGUARD ) // Council Vanguard
		{
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

			character_entity.matter = 300;
			character_entity.matter_max = 300; // Let player leech matter off the bodies

			character_entity.hea = 800;
			character_entity.hmax = 800;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = 10;

			character_entity._matter_regeneration = 10 + character_entity._ai_level; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 3; // AI team 3 is for the Council
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			PLAY_SOUND_METHOD({ name:'council_teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
			character_entity._ai.next_action = 5;
			character_entity._ai_enabled = ( Math.random() < 0.25 ) ? sdCharacter.AI_MODEL_AGGRESSIVE : sdCharacter.AI_MODEL_AERIAL; // 25% chance for aerial behaviour
			character_entity._init_ai_model = character_entity._ai_enabled;

			SEND_EFFECT_METHOD({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
		}

		if ( skin_class === sdFactionskin.SKIN_SARRONIAN ) // Sarronian E3 Unit
		{
			character_settings = { "hero_name":"Sarronian E3 Unit", // Name
			"color_bright":"#2a2a2a", // Helmet bright color
			"color_dark":"#0c0c0c", // Helmet dark color
			"color_visor":"#00ff32", // Visor color
			"color_bright3":"#0c0c0c", // Jetpack (bright shade) color
			"color_dark3":"#2a2a2a", // Jetpack (dark shade) color
			"color_suit":"#1c1c1c", // Upper suit color
			"color_suit2":"#262626", // Lower suit color
			"color_dark2":"#0c0c0c", // Lower suit plates color
			"color_shoes":"#0c0c0c", // Shoes color
			"color_skin":"#0c0c0c", // Gloves and neck color
			"color_extra1":"#00d719", // Extra 1 color
			"helmet33":true,
			"body90":true,
			"legs51":true,
			"voice10":true };

			character_entity.matter = 350;
			character_entity.matter_max = 350;

			character_entity.hea = 350;
			character_entity.hmax = 350;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 10; // increased alongside matter regen multiplier to allow them to use the SMG.
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 4; // AI team 4 is for Sarronian & Zektaron faction
			character_entity._matter_regeneration_multiplier = 25; // Their matter regenerates 25 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_SARRONIAN_HEAVY ) // Sarronian E6 Unit
		{
			character_settings = { "hero_name":"Sarronian E6 Unit", // Name
			"color_bright":"#2a2a2a", // Helmet bright color
			"color_dark":"#0c0c0c", // Helmet dark color
			"color_visor":"#00ff32", // Visor color
			"color_bright3":"#0c0c0c", // Jetpack (bright shade) color
			"color_dark3":"#2a2a2a", // Jetpack (dark shade) color
			"color_suit":"#1c1c1c", // Upper suit color
			"color_suit2":"#262626", // Lower suit color
			"color_dark2":"#0c0c0c", // Lower suit plates color
			"color_shoes":"#0c0c0c", // Shoes color
			"color_skin":"#0c0c0c", // Gloves and neck color
			"color_extra1":"#00d719", // Extra 1 color
			"helmet33":true,
			"body90":true,
			"legs51":true,
			"voice10":true };

			character_entity.matter = 350;
			character_entity.matter_max = 350;

			character_entity.hea = 350;
			character_entity.hmax = 350;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 10; // increased alongside matter regen multiplier to allow them to use the SMG.
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 4; // AI team 4 is for Sarronian & Zektaron faction
			character_entity._matter_regeneration_multiplier = 25; // Their matter regenerates 25 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_VELOX ) // Velox Soldier Burst Pistol Class
		{
			character_settings = { "hero_name":"Velox Soldier", // Name // blue soldier
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

			character_entity.matter = 200;
			character_entity.matter_max = 200;

			character_entity.hea = 500;
			character_entity.hmax = 500;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 5; // AI team 5 is for Velox faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			character_entity._ai_enabled = ( Math.random() < 0.5 ) ? sdCharacter.AI_MODEL_DISTANT : sdCharacter.AI_MODEL_AERIAL; // 50% chance for aerial behaviour
			character_entity._init_ai_model = character_entity._ai_enabled;
		}

		if ( skin_class === sdFactionskin.SKIN_VELOX_RIFLE ) // Velox Soldier Combat Rifle Class
		{
			character_settings = { "hero_name":"Velox Soldier", // Name // green soldier
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

			character_entity.matter = 200;
			character_entity.matter_max = 200;

			character_entity.hea = 500;
			character_entity.hmax = 500;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 5; // AI team 5 is for Velox faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			character_entity._ai_enabled = ( Math.random() < 0.5 ) ? sdCharacter.AI_MODEL_DISTANT : sdCharacter.AI_MODEL_AERIAL; // 50% chance for aerial behaviour
			character_entity._init_ai_model = character_entity._ai_enabled;
		}

		if ( skin_class === sdFactionskin.SKIN_VELOX_DEVASTATOR ) // Velox Devastator
		{
			character_settings = { "hero_name":"Velox Devastator", // Name
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

			character_entity.matter = 400;
			character_entity.matter_max = 400;

			character_entity.hea = 900;
			character_entity.hmax = 900;
			character_entity.s = 110; // Tougher so bigger target

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 5; // AI team 5 is for Velox faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			character_entity._ai_enabled = ( Math.random() < 0.5 ) ? sdCharacter.AI_MODEL_DISTANT : sdCharacter.AI_MODEL_AERIAL; // 50% chance for aerial behaviour
			character_entity._init_ai_model = character_entity._ai_enabled;
		}

		if ( skin_class === sdFactionskin.SKIN_SETR ) // Setr Soldier
		{
			character_settings = { "hero_name":"Setr Soldier", // Name
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

			character_entity.matter = 150;
			character_entity.matter_max = 150;

			character_entity.hea = 560;
			character_entity.hmax = 560;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 7; // AI team 7 is for Setr faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_TZYRG ) // Tzyrg
		{
			character_settings = { "hero_name":"Tzyrg", // Name
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
			"voice12":true };

			character_entity.matter = 100;
			character_entity.matter_max = 100;

			character_entity.hea = 200;
			character_entity.hmax = 200;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 1 + Math.random() * 2 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 8; // AI team 8 is for Tzyrg faction
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_SHURG ) // Shurg
		{
			character_settings = { "hero_name":"Shurg", // Name
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

			character_entity.matter = 85;
			character_entity.matter_max = 85;

			character_entity.hea = 200;
			character_entity.hmax = 200;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 1 + Math.random() * 2 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = false; // No jetpack
			character_entity._ai_team = 9; // AI team 9 is for Shurg faction
			character_entity._matter_regeneration_multiplier = 5; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_SHURG_COMMANDER ) // Shurg Commander
		{
			character_settings = { "hero_name":"Shurg Commander", // Name
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

			character_entity.matter = 125;
			character_entity.matter_max = 125;

			character_entity.hea = 350;
			character_entity.hmax = 350;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 1 + Math.random() * 2 ); // AI Levels

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = false; // No jetpack
			character_entity._ai_team = 9; // AI team 9 is for Shurg faction
			character_entity._matter_regeneration_multiplier = 5; // Their matter regenerates 10 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_FALKONIAN_SWORD_BOT ) // Falkonian Sword Bot
		{
			character_settings = {"hero_name":"Falkonian Sword Bot",
			"color_bright":"#404040",
			"color_dark":"#303030",
			"color_visor":"#FF0000",
			"color_bright3":"#202020",
			"color_dark3":"#101010",
			"color_suit":"#404040",
			"color_suit2":"#303030",
			"color_dark2":"#202020",
			"color_shoes":"#101010",
			"color_skin":"#101010",
			"color_extra1":"#FF0000",
			"helmet40":true,
			"body25":true,
			"legs25":true,
			"voice13":true};

			character_entity.matter = 800;
			character_entity.matter_max = 800;

			character_entity.hea = 1000;
			character_entity.hmax = 1000;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };

			character_entity._ai_level = 4;
			character_entity.gun_slot = -1;
			character_entity._ai_allow_weapon_switch = false;

			character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
			character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
			character_entity.s = 150;
			character_entity._jetpack_power = 4;
			character_entity._ai_enabled = sdCharacter.AI_MODEL_AGGRESSIVE; // Make sure it's aggressive
			character_entity._init_ai_model = character_entity._ai_enabled;
		}

		if ( skin_class === sdFactionskin.SKIN_STAR_DEFENDER_RESCUE ) // Rescue Star Defender, the Green one, no task spawns
		{
			character_settings = {"hero_name":"Star Defender", // Name
			"color_bright":"#c0c0c0", // Helmet bright color
			"color_dark":"#808080", // Helmet dark color
			"color_visor":"#FF0000", // Visor color
			"color_bright3":"#c0c0c0", // Jetpack (bright shade) color
			"color_dark3":"#808080", // Jetpack (dark shade) color
			"color_suit":"#008000", // Upper suit color
			"color_suit2":"#008000", // Lower suit color
			"color_dark2":"#808080", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#808000", // Gloves and neck color
			"color_extra1":"#0000FF",
			"helmet1":true,
			"voice1":true };

			character_entity.matter = 185;
			character_entity.matter_max = 185;

			character_entity.hea = 250; // It is a star defender after all
			character_entity.hmax = 250;

			character_entity.armor = 500;
			character_entity.armor_max = 500;
			character_entity._armor_absorb_perc = 0.6; // 60% damage reduction
			character_entity.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor

			character_entity._ai_level = 5;

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 0; // AI team 0 is for normal Star Defenders
			character_entity._matter_regeneration_multiplier = 4; // Their matter regenerates 4 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_STAR_DEFENDER_ARREST ) // Arrest Star Defender, the Red one, no task spawns
		{
			character_settings = {"hero_name":"Criminal Star Defender", // Name
			"color_bright":"#c0c0c0", // Helmet bright color
			"color_dark":"#808080", // Helmet dark color
			"color_visor":"#FF0000", // Visor color
			"color_bright3":"#c0c0c0", // Jetpack (bright shade) color
			"color_dark3":"#808080", // Jetpack (dark shade) color
			"color_suit":"#800000", // Upper suit color
			"color_suit2":"#800000", // Lower suit color
			"color_dark2":"#808080", // Lower suit plates color
			"color_shoes":"#000000", // Shoes color
			"color_skin":"#808000", // Gloves and neck color
			"color_extra1":"#0000FF",
			"helmet1":true,
			"voice1":true };

			character_entity.matter = 185;
			character_entity.matter_max = 185;

			character_entity.hea = 250; // It is a star defender after all
			character_entity.hmax = 250;

			character_entity.armor = 500;
			character_entity.armor_max = 500;
			character_entity._armor_absorb_perc = 0.6; // 60% damage reduction
			character_entity.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor

			character_entity._ai_level = 5;

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 6; // AI team 6 is for Criminal Star Defenders
			character_entity._matter_regeneration_multiplier = 4; // Their matter regenerates 4 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_TIME_SHIFTER ) // Time Shifter
		{
			character_settings = { "hero_name":"Time Shifter", // Name
			"color_bright":"#202020", // Helmet bright color
			"color_dark":"#000000", // Helmet dark color
			"color_visor":"#FFFFFF", // Visor color
			"color_bright3":"#202020", // Jetpack (bright shade) color
			"color_dark3":"#202020", // Jetpack and armor plates (dark shade) color
			"color_suit":"#000000", // Upper suit color
			"color_suit2":"#000000", // Lower suit color
			"color_dark2":"#000000", // Lower suit plates color
			"color_shoes":"#202020", // Shoes color
			"color_skin":"#202020", // Gloves and neck color
			"color_extra1":"#202020", // Extra 1 color
			"helmet36":true,
			"body1":true,
			"legs3":true,
			"voice1":true };

			character_entity.matter = 1000;
			character_entity.matter_max = 1000;

			character_entity.hea = 3000;
			character_entity.hmax = 3000;

			character_entity._ai = { direction: ( Math.random() < 0.5 ) ? -1 : 1 };
			character_entity._ai_level =  4; // AI Level

			character_entity._matter_regeneration = 50; // At least some ammo regen
			character_entity._jetpack_allowed = false; // No jetpack, he can fly with his blade if he needs it after all
			character_entity._ai_team = 10; // AI team 10 is for the time shifter
			character_entity._matter_regeneration_multiplier = 50; // Their matter regenerates 50 times faster than normal, unupgraded players

			character_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TIME_SHIFTER_PROPERTIES, charges_left: 3 }); // Give him the Time Shifter properties / status effect
			// This is a bossfight.
		}

		if ( skin_class === sdFactionskin.SKIN_INSTRUCTOR ) // Instructor
		{
			character_settings = {"hero_name":"Instructor", // Name
			"color_bright":"#7aadff", // Helmet bright color
			"color_dark":"#25668e", // Helmet dark color
			"color_visor":"#ffffff", // Visor color
			"color_bright3":"#7aadff", // Jetpack (bright shade) color
			"color_dark3":"#25668e", // Jetpack (dark shade) color
			"color_suit":"#000000", // Upper suit color
			"color_suit2":"#000000", // Lower suit color
			"color_dark2":"#25668e", // Lower suit plates color
			"color_shoes":"#303954", // Shoes color
			"color_skin":"#51709a", // Gloves and neck color
			"helmet1":true,
			"voice1":true };

			character_entity.matter = 185;
			character_entity.matter_max = 185;

			character_entity.hea = 250; // It is a star defender after all
			character_entity.hmax = 250;

			character_entity._ai_level = 10;
			character_entity._matter_regeneration = 1;
			character_entity._matter_regeneration_multiplier = 10;
			character_entity._ai_team = 0; // AI team 0 is for normal Star Defenders

			if ( Math.random() < 0.25 )
			{
				ENTITIES_ARRAY.push( new GUN_CLASS({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_EMERGENCY_INSTRUCTOR }) );
			}
		}

		if ( skin_class === sdFactionskin.SKIN_COMBAT_INSTRUCTOR ) // Combat Instructor
		{
			character_settings = {"hero_name":"Combat Instructor", // Name
			"color_bright":"#7aadff", // Helmet bright color
			"color_dark":"#25668e", // Helmet dark color
			"color_visor":"#ffffff", // Visor color
			"color_bright3":"#7aadff", // Jetpack (bright shade) color
			"color_dark3":"#25668e", // Jetpack (dark shade) color
			"color_suit":"#000000", // Upper suit color
			"color_suit2":"#000000", // Lower suit color
			"color_dark2":"#25668e", // Lower suit plates color
			"color_shoes":"#303954", // Shoes color
			"color_skin":"#51709a", // Gloves and neck color
			"helmet1":true,
			"voice1":true };

			character_entity.matter = 185;
			character_entity.matter_max = 185;

			character_entity.hea = 250; // It is a star defender after all
			character_entity.hmax = 250;

			character_entity.armor = 370;
			character_entity.armor_max = 370;
			character_entity._armor_absorb_perc = 0.55;
			character_entity.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor

			character_entity._ai_level = 10;

			character_entity._matter_regeneration = 5; // At least some ammo regen
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 0;
			character_entity._matter_regeneration_multiplier = 10;
		}

		if ( skin_class === sdFactionskin.SKIN_EXTRACTION_PILOT ) // Extraction Pilot, Feive
		{
			character_settings = {"hero_name":"Extraction Pilot", // Name
			"color_bright":"#feeee1",
			"color_dark":"#a38e7b",
			"color_visor":"#58feb0",
			"color_bright3":"#21180d",
			"color_dark3":"#2d2824",
			"color_suit":"#43382d",
			"color_suit2":"#3c280b",
			"color_dark2":"#000000",
			"color_shoes":"#000000",
			"color_skin":"#4c4224",
			"color_extra1":"#000000",
			"helmet19":true,
			"body23":true,
			"legs37":true,
			"voice1":true };

			character_entity.matter = 50;
			character_entity.matter_max = 50;

			character_entity.hea = 100;
			character_entity.hmax = 100;

			character_entity._ai_level = 1;
			character_entity._ai_team = 0;
		}

		if ( skin_class === sdFactionskin.SKIN_ZEKTARON_ASSAULT ) // Zektaron Assault Unit
		{
			character_settings = { "hero_name":"Zektaron Assault Unit", // Name
			"color_bright":"#484848", // Helmet bright color
			"color_dark":"#c0c0c0", // Helmet dark color
			"color_visor":"#ff1919", // Visor color
			"color_bright3":"#c0c0c0", // Jetpack (bright shade) color
			"color_dark3":"#5c5c5c", // Jetpack (dark shade) color
			"color_suit":"#343434", // Upper suit color
			"color_suit2":"#5c5c5c", // Lower suit color
			"color_dark2":"#c0c0c0", // Lower suit plates color
			"color_shoes":"#121212", // Shoes color
			"color_skin":"#5c5c5c", // Gloves and neck color
			"color_extra1":"#d20000", // Extra 1 color
			"helmet10":true,
			"body72":true,
			"legs66":true,
			"voice12":true };

			character_entity.matter = 500;
			character_entity.matter_max = 500;

			character_entity.hea = 600;
			character_entity.hmax = 600;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 10; // increased alongside matter regen multiplier to allow them to use the SMG.
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 4; // AI team 4 is for Sarronian & Zektaron faction
			character_entity._matter_regeneration_multiplier = 25; // Their matter regenerates 25 times faster than normal, unupgraded players
		}

		if ( skin_class === sdFactionskin.SKIN_ZEKTARON_SEEKER ) // Zektaron Assault Unit
		{
			character_settings = { "hero_name":"Zektaron Seeker Unit", // Name
			"color_bright":"#c0c0c0", // Helmet bright color
			"color_dark":"#484848", // Helmet dark color
			"color_visor":"#ff1919", // Visor color
			"color_bright3":"#c0c0c0", // Jetpack (bright shade) color
			"color_dark3":"#5c5c5c", // Jetpack (dark shade) color
			"color_suit":"#343434", // Upper suit color
			"color_suit2":"#5c5c5c", // Lower suit color
			"color_dark2":"#c0c0c0", // Lower suit plates color
			"color_shoes":"#121212", // Shoes color
			"color_skin":"#5c5c5c", // Gloves and neck color
			"color_extra1":"#d20000", // Extra 1 color
			"helmet61":true,
			"body8":true,
			"legs69":true,
			"voice12":true };

			character_entity.matter = 500;
			character_entity.matter_max = 500;

			character_entity.hea = 600;
			character_entity.hmax = 600;

			character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
			character_entity._ai_level = Math.floor( 2 + Math.random() * 3 ); // AI Levels

			character_entity._matter_regeneration = 10; // increased alongside matter regen multiplier to allow them to use the SMG.
			character_entity._jetpack_allowed = true; // Jetpack
			character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
			character_entity._ai_team = 4; // AI team 4 is for Sarronian & Zektaron faction
			character_entity._matter_regeneration_multiplier = 25; // Their matter regenerates 25 times faster than normal, unupgraded players
		}

		character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( character_settings );
		character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( character_settings );
		character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( character_settings );
		character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( character_settings );
		character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( character_settings );
		character_entity.title = character_settings.hero_name;
		
		character_entity.onSkinChanged();
	}
}
//sdFactions.init_class();

export default sdFactionskin;
