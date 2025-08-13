/* global Infinity, globalThis, meSpeak, FakeCanvasContext, sdRenderer, sdModeration */
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdKeyStates from '../sdKeyStates.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdBullet from './sdBullet.js';
import sdBlock from './sdBlock.js';
import sdWater from './sdWater.js';
import sdCube from './sdCube.js';
import sdCom from './sdCom.js';
import sdHover from './sdHover.js';
import sdDoor from './sdDoor.js';
import sdBG from './sdBG.js';
import sdBarrel from './sdBarrel.js';
import sdBomb from './sdBomb.js';
import sdTurret from './sdTurret.js';
import sdArea from './sdArea.js';
import sdMatterContainer from './sdMatterContainer.js';
import sdWorkbench from './sdWorkbench.js';
import sdRescueTeleport from './sdRescueTeleport.js';
import sdLifeBox from './sdLifeBox.js';
import sdLost from './sdLost.js';
import sdWeather from './sdWeather.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdWeaponBench from './sdWeaponBench.js';
import sdTask from './sdTask.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdCharacterRagdoll from './sdCharacterRagdoll.js';
import sdTimer from './sdTimer.js';
import sdMimic from './sdMimic.js';
import sdShurgConverter from './sdShurgConverter.js';
import sdBubbleShield from './sdBubbleShield.js';
import sdUpgradeStation from './sdUpgradeStation.js';
//import sdLongRangeTeleport from './sdLongRangeTeleport.js';

import sdShop from '../client/sdShop.js';

class sdCharacter extends sdEntity
{
	static init_class()
	{
		sdCharacter.img_teammate = sdWorld.CreateImageFromFile( 'teammate' );
		
		sdCharacter.climb_filter = [ 'sdBlock', 'sdLost', 'sdBarrel', 'sdCrystal', 'sdCharacter', 'sdDoor', 'sdMatterContainer', 'sdCube' ];
		
		sdCharacter.stability_damage_from_damage_scale = 1.25;
		sdCharacter.stability_damage_from_velocity_changes_scale = 128 / 6;
	
		// Add new values at the end. This list will be automatically sorted
		sdCharacter.helmet_file_names_with_actual_names = [
			{ file:'', name:'' }, // Should be kept like this
			{ file:'helmets/helmet_star_defender', name:'Star Defender' }, // by Eric Gurt, index = 1
			{ file:'helmets/helmet_falkok', name:'Falkok' }, // by Eric Gurt , index = 2
			{ file:'helmets/helmet_eyes', name:'Eyes' }, // by Eric Gurt, index = 3
			{ file:'helmets/helmet_dino', name:'Dino' }, // by Eric Gurt, index = 4
			{ file:'helmets/helmet_v', name:'V' }, // by Eric Gurt, index = 5
			{ file:'helmets/helmet_open', name:'Open' }, // by Eric Gurt, index = 6
			{ file:'helmets/helmet_cs', name:'CS' }, //  idea by butorinoks77, rework by Eric Gurt, index = 7
			{ file:'helmets/helmet_grub', name:'Grub' }, //  idea by butorinoks77, rework by Eric Gurt, index = 8
			{ file:'helmets/helmet_crow', name:'Crow' }, //  by butorinoks77, index = 9
			{ file:'helmets/helmet_scope', name:'Scope' }, //  by butorinoks77, remake by GPU, index = 10
			{ file:'helmets/helmet_crusader', name:'Crusader' }, //  by xXRedXAssassinXx, index = 11
			{ file:'helmets/helmet_phfalkok', name:'Phoenix Falkok' }, //  by Booraz149, index = 12
			{ file:'helmets/helmet_aero', name:'Aero' }, //  original by LordBored, remake by LazyRain, index = 13
			{ file:'helmets/helmet_scout', name:'Scout' }, //  by Ghost581, original name was "Observer", index = 14
			{ file:'helmets/helmet_heavy', name:'Heavy' }, //  by LordBored, index = 15
			{ file:'helmets/helmet_shade', name:'Shade' }, //  by LordBored, index = 16
			{ file:'helmets/helmet_plasmator', name:'Plasmator' }, //  by LordBored, index = 17
			{ file:'helmets/helmet_arbiter', name:'Arbiter' }, //  by LordBored, index = 18
			{ file:'helmets/helmet_pilot', name:'Pilot' }, //  by LordBored, index = 19
			{ file:'helmets/helmet_guardian', name:'Guardian' }, //  by LordBored, index = 20
			{ file:'helmets/helmet_vanquisher', name:'Vanquisher' }, //  by LordBored, index = 21
			{ file:'helmets/helmet_glory', name:'Glory' }, //  by LordBored, index = 22
			{ file:'helmets/helmet_scion', name:'Scion' }, //  by LordBored, index = 23
			{ file:'helmets/helmet_varia', name:'Varia' }, //  by Silk1, index = 24
			{ file:'helmets/helmet_array', name:'Array' }, //  original by Silk1, index = 25
			{ file:'helmets/helmet_nova', name:'Nova' }, //  by LazyRain, index = 26
			{ file:'helmets/helmet_igris', name:'Igris' }, //  by Silk1, index = 27
			{ file:'helmets/helmet_ace', name:'Ace' }, //  by Silk1, index = 28
			{ file:'helmets/helmet_alpha', name:'Alpha' }, //  by Silk1, index = 29
			{ file:'helmets/helmet_templar', name:'Templar' }, //  by LordBored, index = 30
			{ file:'helmets/helmet_dragon', name:'Dragon' }, //  by LordBored, index = 31
			{ file:'helmets/helmet_agilus', name:'Agilus' }, //  by LordBored, index = 32
			{ file:'helmets/helmet_biohazard', name:'Biohazard' }, //  by LordBored, index = 33
			{ file:'helmets/helmet_bulwark', name:'Bulwark' }, //  by LordBored, index = 34
			{ file:'helmets/helmet_engineer', name:'Engineer' }, //  by LordBored, index = 35
			{ file:'helmets/helmet_forge', name:'Forge' }, //  by LordBored, index = 36
			{ file:'helmets/helmet_harbinger', name:'Harbinger' }, //  by LordBored, index = 37
			{ file:'helmets/helmet_legate', name:'Legate' }, //  by LordBored, index = 38
			{ file:'helmets/helmet_lifter', name:'Lifter' }, //  by LordBored, index = 39
			{ file:'helmets/helmet_omega', name:'Omega' }, //  by LordBored, index = 40
			{ file:'helmets/helmet_protector', name:'Protector' }, //  by LordBored, index = 41
			{ file:'helmets/helmet_reaper', name:'Reaper' }, //  by LordBored, index = 42
			{ file:'helmets/helmet_researcher', name:'Researcher' }, //  by LordBored, index = 43
			{ file:'helmets/helmet_supreme', name:'Supreme' }, //  by LordBored, index = 44
			{ file:'helmets/helmet_spire', name:'Spire' }, //  by LordBored, index = 45
			{ file:'helmets/helmet_walker', name:'Walker' }, //  by LordBored, index = 46
			{ file:'helmets/helmet_acolyte', name:'Acolyte' }, //  by LordBored, index = 47
			{ file:'helmets/helmet_archangel', name:'Archangel' }, //  by LordBored, index = 48
			{ file:'helmets/helmet_assault', name:'Assault' }, //  by LordBored, index = 49
			{ file:'helmets/helmet_beast', name:'Beast' }, //  by LordBored, index = 50
			{ file:'helmets/helmet_colonel', name:'Colonel' }, //  by LordBored, index = 51
			{ file:'helmets/helmet_cyber', name:'Cyber' }, //  by LordBored, index = 52
			{ file:'helmets/helmet_destiny', name:'Destiny' }, //  by LordBored, index = 53
			{ file:'helmets/helmet_duality', name:'Duality' }, //  by LordBored, index = 54
			{ file:'helmets/helmet_flame', name:'Flame' }, //  by LordBored, index = 55
			{ file:'helmets/helmet_hatred', name:'Hatred' }, //  by LordBored, index = 56
			{ file:'helmets/helmet_hunter', name:'Hunter' }, //  by LordBored, index = 57
			{ file:'helmets/helmet_judicator', name:'Judicator' }, //  by LordBored, index = 58
			{ file:'helmets/helmet_marauder', name:'Marauder' }, //  by LordBored, index = 59
			{ file:'helmets/helmet_medic2', name:'Medic' }, //  by LordBored, index = 60
			{ file:'helmets/helmet_overseer', name:'Overseer' }, //  by LordBored, index = 61
			{ file:'helmets/helmet_shocktrooper', name:'Shocktrooper' }, //  by GPU, index = 62
			{ file:'helmets/helmet_starfarer', name:'Starfarer' }, //  by LordBored, index = 63
			{ file:'helmets/helmet_stream', name:'Stream' }, //  by LordBored, index = 64
			{ file:'helmets/helmet_synth', name:'Synth' }, //  by GPU, index = 65
			{ file:'helmets/helmet_warden', name:'Warden' }, //  by LordBored, index = 66
			{ file:'helmets/helmet_warlord', name:'Warlord' }, //  by LordBored, index = 67
			{ file:'helmets/helmet_sentinel', name:'Sentinel' }, //  by Ghost581, index = 68
			{ file:'helmets/helmet_skeleton', name:'Skeleton' }, //  by Silk1, index = 69
			{ file:'helmets/helmet_rose', name:'Rose' }, //  by Silk1, index = 70
			{ file:'helmets/helmet_avre', name:'Avre' }, //  by Silk1, index = 71
			{ file:'helmets/helmet_spaghetti', name:'Spaghetti' }, //  by Silk1, index = 72
			{ file:'helmets/helmet_tacticalSD', name:'Tactical Star Defender' }, //  by The_Commander, index = 73
			{ file:'helmets/helmet_vengeance', name:'Vengeance' }, //  by LordBored, index = 74
			{ file:'helmets/helmet_sovereign', name:'Sovereign' }, //  by LordBored, index = 75
			{ file:'helmets/helmet_oxide', name:'Oxide' }, //  by LordBored, index = 76
			{ file:'helmets/helmet_mythic', name:'Mythic' }, //  by LordBored, index = 77
			{ file:'helmets/helmet_outcast', name:'Outcast' }, //  by LordBored, index = 78
			{ file:'helmets/helmet_angel', name:'Angel' }, //  by LazyRain, index = 79
			{ file:'helmets/helmet_split_visor', name:'Split visor' }, //  by LazyRain, index = 80
			{ file:'helmets/helmet_soldier_rig', name:'Soldier RIG' }, //  by LazyRain, index = 81
			{ file:'helmets/helmet_witch', name:'Witch' }, //  by LazyRain, index = 82
			{ file:'helmets/helmet_modeus', name:'Modeus' }, //  by LazyRain, index = 83
			{ file:'helmets/helmet_pepe', name:'Pepe' }, //  by LazyRain, index = 84
			{ file:'helmets/helmet_santa', name:'Santa' }, //  by LazyRain, index = 85
			{ file:'helmets/helmet_velox', name:'Velox' }, //  by LordBored, index = 86
			{ file:'helmets/helmet_apex', name:'Apex' }, //  by LordBored, index = 87
			{ file:'helmets/helmet_advisor', name:'Advisor' }, //  by LordBored, index = 88
			{ file:'helmets/helmet_paradigm', name:'Paradigm' }, //  by LordBored, index = 89
			{ file:'helmets/helmet_sync', name:'Sync' }, //  by LordBored, index = 90
			{ file:'helmets/helmet_legend', name:'Legend' }, //  by LordBored, index = 91
			{ file:'helmets/helmet_duster', name:'SD Duster' }, //  by LordBored, index = 92
			{ file:'helmets/helmet_vengeance2', name:'Vengeance Alt' }, //  by LordBored, index = 93
			{ file:'helmets/helmet_bulwark2', name:'Bulwark Alt' }, //  by LordBored, index = 94
			{ file:'helmets/helmet_empyrean', name:'Empyrean' }, //  by LordBored, index = 95
			{ file:'helmets/helmet_council', name:'Council' }, //  by LordBored, index = 96
			{ file:'helmets/helmet_androidSD', name:'Android' }, //  by LordBored, index = 97
			{ file:'helmets/helmet_androidSD2', name:'Android Alt' }, //  by LordBored, index = 98
			{ file:'helmets/helmet_assassin', name:'Assassin' }, //  by LordBored, index = 99
			{ file:'helmets/helmet_automata', name:'Automata' }, //  by LordBored, index = 100
			{ file:'helmets/helmet_automata2', name:'Automata Alt' }, //  by LordBored, index = 101
			{ file:'helmets/helmet_blackguard', name:'Blackguard' }, //  by LordBored, index = 102
			{ file:'helmets/helmet_duelist', name:'Duelist' }, //  by LordBored, index = 103
			{ file:'helmets/helmet_monolith', name:'Monolith' }, //  by LordBored, index = 104
			{ file:'helmets/helmet_reaper2', name:'Reaper Alt' }, //  by LordBored, index = 105
			{ file:'helmets/helmet_assassin2', name:'Assassin Alt' }, //  by LordBored, index = 106
			{ file:'helmets/helmet_specialist', name:'Specialist' }, //  by LordBored, index = 107
			{ file:'helmets/helmet_spectre', name:'Spectre' }, //  by LordBored, index = 108
			{ file:'helmets/helmet_storm', name:'Storm' }, //  by LordBored, index = 109
			{ file:'helmets/helmet_swole', name:'Swole' }, //  by LordBored, index = 110
			{ file:'helmets/helmet_terminus', name:'Terminus' }, //  by LordBored, index = 111
			{ file:'helmets/helmet_titan', name:'Titan' }, //  by LordBored, index = 112
			{ file:'helmets/helmet_terminus2', name:'Terminus Alt' }, //  by LordBored, index = 113
			{ file:'helmets/helmet_versatile', name:'Versatile' }, //  by LordBored, index = 114
			{ file:'helmets/helmet_fixer', name:'Fixer' }, //  by LordBored, index = 115
			{ file:'helmets/helmet_fixer2', name:'Fixer Alt' }, //  by LordBored, index = 116
			{ file:'helmets/helmet_renegade', name:'Renegade' }, //  by LordBored, index = 117
            { file:'helmets/helmet_velox_heavy', name:'Velox Heavy' }, //  by LordBored, index = 118
            { file:'helmets/helmet_voxel', name:'Voxel' }, //  by LordBored, index = 119
			{ file:'helmets/helmet_stickman', name:'Stickman' }, //  by Thj, index = 120
			{ file:'helmets/helmet_stickman2', name:'Stickman Alt' }, //  by Thj, index = 121
			{ file:'helmets/helmet_animus', name:'Animus' }, //  by LordBored, index = 122
			{ file:'helmets/helmet_architect', name:'Architect' }, //  by LordBored, index = 123
			{ file:'helmets/helmet_architect2', name:'Architect Alt1' }, //  by LordBored, index = 124
			{ file:'helmets/helmet_architect3', name:'Architect Alt2' }, //  by LordBored, index = 125
			
			// Add new values at the end
			// Note: Commas -> , are important since this is just a big Array: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
			// Note: Never insert values in the middle as it will cause existing skins to break
		];
		sdCharacter.img_helmets = []; // Actual images, indices will match with array above
		for ( let i = 0; i < sdCharacter.helmet_file_names_with_actual_names.length; i++ )
		{
			if ( sdCharacter.helmet_file_names_with_actual_names[ i ] )
			sdCharacter.helmet_file_names_with_actual_names[ i ].id = i;
			
			sdCharacter.img_helmets[ i ] = ( sdCharacter.helmet_file_names_with_actual_names[ i ].file !== '' ) ?
				sdWorld.CreateImageFromFile( sdCharacter.helmet_file_names_with_actual_names[ i ].file ) :
				null;
		}
		
		sdCharacter.skin_part_indices = {
			body_lower: 0,
			body_upper: 1,
			arm_upper: 2,
			arm_lower: 3,
			leg_upper: 4,
			leg_lower: 5,
			feet: 6,
			head: 7
		};
		sdCharacter.skin_file_names_with_actual_names = [
			{ file:'', name:'' }, // Should be kept like this
			{ file:'skins/star_defender', name:'Star Defender' }, // by Eric Gurt, index = 1
			{ file:'skins/heavy', name:'Heavy' }, // by Eric Gurt , index = 2
			{ file:'skins/tech', name:'Tech' }, // by LordBored , index = 3
			{ file:'skins/templar', name:'Templar' }, // by LordBored, index = 4
			{ file:'skins/inferno', name:'Inferno' }, // by LordBored, index = 5
			{ file:'skins/kevlar', name:'Kevlar' }, // by LordBored, index = 6
			{ file:'skins/shade', name:'Shade' }, // by LordBored, index = 7
			{ file:'skins/afterburn', name:'Afterburn' }, // by LordBored , index = 8
			{ file:'skins/vanquisher', name:'Vanquisher' }, // by LordBored, index = 9
			{ file:'skins/glory', name:'Glory' }, // by LordBored, index = 10
			{ file:'skins/scion', name:'Scion' }, // by LordBored, index = 11
			{ file:'skins/varia', name:'Varia' }, // by Silk1, index = 12
			{ file:'skins/array', name:'Array' }, // original by Silk1, index = 13
			{ file:'skins/nova', name:'Nova' }, // by LazyRain, index = 14
			{ file:'skins/igris', name:'Igris' }, // by Silk1, index = 15
			{ file:'skins/alpha', name:'Alpha' }, // by Silk1, index = 16
			{ file:'skins/agilus', name:'Agilus' }, // by LordBored, index = 17
			{ file:'skins/biohazard', name:'Biohazard' }, // by LordBored, index = 18
			{ file:'skins/bulwark', name:'Bulwark' }, // by LordBored, index = 19
			{ file:'skins/engineer', name:'Engineer' }, // by LordBored, index = 20
			{ file:'skins/forge', name:'Forge' }, // by LordBored, index = 21
			{ file:'skins/harbinger', name:'Harbinger' }, // by LordBored, index = 22
			{ file:'skins/legate', name:'Legate' }, // by LordBored, index = 23
			{ file:'skins/lifter', name:'Lifter' }, // by LordBored, index = 24
			{ file:'skins/omega', name:'Omega' }, // by LordBored, index = 25
			{ file:'skins/protector', name:'Protector' }, // by LordBored, index = 26
			{ file:'skins/reaper', name:'Reaper' }, // by LordBored, index = 27
			{ file:'skins/researcher', name:'Researcher' }, // by LordBored, index = 28
			{ file:'skins/spire', name:'Spire' }, // by LordBored, index = 29
			{ file:'skins/supreme', name:'Supreme' }, // by LordBored, index = 30
			{ file:'skins/walker', name:'Walker' }, // by LordBored, index = 31
			{ file:'skins/castellan', name:'Castellan' }, // by LordBored, index = 32
			{ file:'skins/empyrean2', name:'Empyrean' }, // by LordBored, index = 33
			{ file:'skins/jumper', name:'Jumper' }, // by LordBored, index = 34
			{ file:'skins/matrix', name:'Matrix' }, // by LordBored, index = 35
			{ file:'skins/runner', name:'Runner' }, // by LordBored, index = 36
			{ file:'skins/sovereign', name:'Sovereign' }, // by LordBored, index = 37
			{ file:'skins/wyvern', name:'Wyvern' }, // by LordBored, index = 38
			{ file:'skins/sentinel', name:'Sentinel' }, // by Ghost581, index = 39
			{ file:'skins/skeleton', name:'Skeleton' }, // by Silk1, index = 40
			{ file:'skins/rose', name:'Rose' }, // by Silk1, index = 41
			{ file:'skins/avre', name:'Avre' }, // by Silk1, index = 42
			{ file:'skins/spaghetti', name:'Spaghetti' }, // by Silk1, index = 43
			{ file:'skins/trooper', name:'Trooper' }, // by AlbanianTrooper, index = 44
			{ file:'skins/vengeance', name:'Vengeance' }, // by LordBored, index = 45
			{ file:'skins/arbiter', name:'Arbiter' }, // by LordBored, index = 46
			{ file:'skins/ranger', name:'Ranger' }, // by LordBored, index = 47
			{ file:'skins/oxide', name:'Oxide' }, // by LordBored, index = 48
			{ file:'skins/survivor', name:'Survivor' }, // by LordBored, index = 49
			{ file:'skins/mythic', name:'Mythic' }, // by LordBored, index = 50
			{ file:'skins/outcast', name:'Outcast' }, // by LordBored, index = 51
			{ file:'skins/amogus', name:'Amogus' }, // by LordBored, index = 52
			{ file:'skins/angel', name:'Angel' }, // by LazyRain, index = 53
			{ file:'skins/split_visor', name:'Split visor' }, // by LazyRain, index = 54
			{ file:'skins/legless', name:'Legless' }, // by LazyRain, index = 55
			{ file:'skins/soldier_rig', name:'Soldier RIG' }, // by LazyRain, index = 56
			{ file:'skins/witch', name:'Witch' }, // by LazyRain, index = 57
			{ file:'skins/modeus', name:'Modeus' }, // by LazyRain, index = 58
			{ file:'skins/velox', name:'Velox' }, // by Booraz149, index = 59
			{ file:'skins/falkok', name:'Falkok' }, // by Ghost581, index = 60
			{ file:'skins/apex', name:'Apex' }, // by LordBored, index = 61
			{ file:'skins/advisor', name:'Advisor' }, // by LordBored, index = 62
			{ file:'skins/paradigm', name:'Paradigm' }, // by LordBored, index = 63
			{ file:'skins/sync', name:'Sync' }, // by LordBored, index = 64
			{ file:'skins/duster', name:'SD Duster' }, // by LordBored, index = 65
			{ file:'skins/vengeance2', name:'Vengeance Alt' }, // by LordBored, index = 66
			{ file:'skins/bulwark2', name:'Bulwark Alt' }, // by LordBored, index = 67
			{ file:'skins/council', name:'Council' }, // by LordBored, index = 68
			{ file:'skins/androidSD', name:'Android' }, // by LordBored, index = 69
			{ file:'skins/androidSD2', name:'Android Alt' }, // by LordBored, index = 70
			{ file:'skins/assassin', name:'Assassin' }, // by LordBored, index = 71
			{ file:'skins/automata', name:'Automata' }, // by LordBored, index = 72
			{ file:'skins/automata2', name:'Automata Alt' }, // by LordBored, index = 73
			{ file:'skins/blackguard', name:'Blackguard' }, // by LordBored, index = 74
			{ file:'skins/duelist', name:'Duelist' }, // by LordBored, index = 75
			{ file:'skins/monolith', name:'Monolith' }, // by LordBored, index = 76
			{ file:'skins/specialist', name:'Specialist' }, // by LordBored, index = 77
			{ file:'skins/spectre', name:'Spectre' }, // by LordBored, index = 78
			{ file:'skins/storm', name:'Storm' }, // by LordBored, index = 79
			{ file:'skins/stream', name:'Stream' }, // by LordBored, index = 80
			{ file:'skins/swole', name:'Swole' }, // by LordBored, index = 81
			{ file:'skins/terminus', name:'Terminus' }, // by LordBored, index = 82
			{ file:'skins/titan', name:'Titan' }, // by LordBored, index = 83
			{ file:'skins/versatile', name:'Versatile' }, // by LordBored, index = 84
			{ file:'skins/versatile2', name:'Versatile Alt' }, // by LordBored, index = 85
			{ file:'skins/warlord', name:'Warlord' }, // by LordBored, index = 86
			{ file:'skins/fixer', name:'Fixer' }, // by LordBored, index = 87
			{ file:'skins/renegade', name:'Renegade' }, // by LordBored, index = 88
            { file:'skins/velox_lite', name:'Velox Lite' }, // by LordBored, index = 89
			{ file:'skins/velox_heavy', name:'Velox Heavy' }, // by LordBored, index = 90
			{ file:'skins/stickman', name:'Stickman' }, // by LordBored, index = 91
			{ file:'skins/animus', name:'Animus' }, // by LordBored, index = 92
			{ file:'skins/architect', name:'Architect' }, // by LordBored, index = 93
			{ file:'skins/architect2', name:'Architect Alt1' }, // by LordBored, index = 94
			{ file:'skins/architect3', name:'Architect Alt2' }, // by LordBored, index = 95
		];
		sdCharacter.skins = [];
		for ( let i = 0; i < sdCharacter.skin_file_names_with_actual_names.length; i++ )
		{
			if ( sdCharacter.skin_file_names_with_actual_names[ i ] )
			sdCharacter.skin_file_names_with_actual_names[ i ].id = i;
			
			sdCharacter.skins[ i ] = ( sdCharacter.skin_file_names_with_actual_names[ i ].file !== '' ) ?
				sdWorld.CreateImageFromFile( sdCharacter.skin_file_names_with_actual_names[ i ].file ) :
				null;
		}
		
		sdCharacter.drone_file_names_with_actual_names = [
			{ file:'', name:'' },
			{ file:'drone_robot2', name:'Erthal' }, // by EG
			{ file:'drone_robot', name:'Container' }, // by Booraz
			{ file:'drone_robot3', name:'Armored' }, // by GPU
			{ file:'drone_robot4', name:'Slider' }, // by LordBored
			{ file:'drone_robot5', name:'Oculus' }, // by LordBored
			{ file:'drone_robot6', name:'Drake' }, // by LordBored
			{ file:'drone_robot7', name:'Rover' }, // by LordBored
			{ file:'drone_robot8', name:'Junky' }, // art by Booraz, idea by EG
			{ file:'drone_robot9', name:'Harrier' }, // by LordBored
			{ file:'drone_robot10', name:'Spirit' }, // by LordBored
			{ file:'drone_robot11', name:'Ray' }, // by Silk1, edited by LordBored
			{ file:'drone_robot12', name:'Vulture' }, // by LordBored
			{ file:'drone_robot13', name:'Tracer' }, // by LordBored
			{ file:'drone_robot14', name:'Latch' }, // by LordBored
			{ file:'drone_robot15', name:'Transport' }, // by LordBored
			{ file:'drone_robot16', name:'Haunt' }, // by LordBored
			{ file:'drone_robot17', name:'Gothic' }, // by LordBored
			{ file:'drone_robot18', name:'Raven' }, // by LordBored
			{ file:'drone_robot19', name:'Conservator' }, // by LordBored
			{ file:'drone_robot20', name:'Blaze' }, // by GPU
			{ file:'drone_robot21', name:'Explorer' }, // by GPU
			{ file:'drone_robot22', name:'Hunter' }, // by GPU
			{ file:'drone_robot23', name:'Asp' }, // by EG
			{ file:'drone_robot24', name:'Blight' }, // by GPU
			{ file:'drone_robot25', name:'Droid' }, // by GPU
			{ file:'drone_robot26', name:'Falkok' },
			{ file:'drone_robot27', name:'Float' }, // by GPU
			{ file:'drone_robot28', name:'Future' }, // by GPU
			{ file:'drone_robot29', name:'Shrimp' }, // by GPU
			{ file:'drone_robot30', name:'Synergy' }, // by GPU
			{ file:'drone_robot31', name:'Vector' }, // by GPU
			{ file:'drone_robot32', name:'Archaic' }, // by LordBored
			{ file:'drone_robot33', name:'Blades' }, // by LordBored
			{ file:'drone_robot34', name:'Constellation' } // by LordBored, re-added on request, originally named Raven
		];
		for ( let i = 0; i < sdCharacter.drone_file_names_with_actual_names.length; i++ )
		{
			if ( sdCharacter.drone_file_names_with_actual_names[ i ] )
			sdCharacter.drone_file_names_with_actual_names[ i ].id = i;
		}
		
		/* Generator:

			let prefix = 'helmet';
			let arr = document.querySelectorAll('label[for^='+prefix+']');
			let str = '';
			for ( let i = 0; i < sdCharacter.img_helmets.length; i++ )
			{
				let label = document.querySelector('label[for=helmet' + i + ']');
				let img = sdCharacter.img_helmets[ i ];

				str+=( `{ file:'${ img ? img.filename : null }', name:'${ label ? label.textContent : null }' }` ) + ',\n';
			   // trace( "[ '" , arr[ i ].textContent , "', '" , sdCharacter.img_helmets[ parseInt( arr[ i ].getAttribute( 'for' ).substring( prefix.length ) ) ].filename , "' ]" );
			}
			str;
		*/
		
		// voice_presets
		sdCharacter.voice_sound_effects = {
			
			// Council
			'croak':
			{
				death: [ 'council_death' ],
				hurt: [ 'council_hurtA', 'council_hurtB' ],
				
				alert_tts: ( character, enemy )=>
				{
					if ( character._ai_team === 3 )
					{
						if ( Math.random() < 0.1 )
						return sdWorld.AnyOf( [ 
							'This universe is doomed. You cannot stop it.', 
							'Give in. You are not to survive.', 
							'You challenge me? You cannot contest this.', 
							'You will bring down the wrath by doing this.',
							'I will stop this.',
							'You can only delay your inevitable death.',
							'You cannot harm me, you can only send me back.'
							] );
					}
				}
			},
			
			// No idea
			'klatt3':
			{
				// These use TTS alternative
				death_tts: [ '/Critical damage!', '/Shutting down', '/Structural integrity compromised!' ],
				hurt_tts: [ '/Ouch!', '/Aaa!', '/Uh!' ]
			},
			
			// Falkok
			'whisperf':
			{
				volume: 0.4,
		
				death: [ 'f_death1', 'f_death2', 'f_death3' ],
				hurt: [ 'f_pain2', 'f_pain3', 'f_pain4' ],
				alert: [ 'f_welcome1' ]
			},
			
			// No idea
			'm2':
			{
			},
			
			// Fully silent
			'silence':
			{
			},
	
			'swordbot':
			{
				volume: 1.5,
		
				death: [ 'sword_bot_death' ],
				alert: [ 'sword_bot_alert' ]
			},
	
			// Tzyrg
			'm4':
			{
				death: [ 'tzyrg_deathC2' ],
				hurt: [ 'tzyrg_hurtC' ],
				alert: [ 'tzyrg_alertC' ]
			},
	
			// Erthal, this isn't for Falkok, whisper and whisperf.
			'whisper':
			{
				death: [ 'erthal_death' ],
				hurt: [ 'erthal_hurt' ],
				alert: [ 'erthal_alert' ]
			},
			// Clones
			'clone':
			{
				//death: [ 'council_death' ],
				//hurt: [ 'council_hurtA', 'council_hurtB' ],
				
				alert_tts: ( character, enemy )=>
				{
					{
						return sdWorld.AnyOf( [ 
							'You were never real to begin with.',
							'You know, maybe you are just a clone.',
							'I am you, and you are me.',
							'I have been here before you.',
							'I am the real you. Come back to me, before it is too late.',
							'You were never in control of your body. Free will does not exist.',
							'I think, therefore I am.'
						] );
					}
				}
			},
			// Star Defenders
			'default':
			{
				death: [ 'sd_death' ],
				death_scream: [ 'sd_death2' ],
				hurt: [ 'sd_hurt1', 'sd_hurt2' ],
				
				alert_tts: ( character, enemy )=>
				{
					if ( character._ai_team === 0 )
					{
						// Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false )
						return sdWorld.AnyOf( [ 
							'Your presence makes me mad, but in a good way!', 
							'I have no other choice but to attack!', 
							character.title + ' attacks!', 
							character._inventory[ character.gun_slot ] ? 'I will attack you with my gun because I actually have one!' : 'I will attack with my bare hands if I\'d have to!',
							character._inventory[ character.gun_slot ] ? 'Peow-peow!' : 'Punchy-punchy!',
							'*wild ' + character.title + ' noises*',
							sdWorld.ClassNameToProperName( enemy.GetClass(), enemy, true ) + ', identify yourself!',
							sdWorld.ClassNameToProperName( enemy.GetClass(), enemy, true ) + ' is attacking me!',
							'Say hello to my little ' + ( character._inventory[ character.gun_slot ] ? sdWorld.ClassNameToProperName( character._inventory[ character.gun_slot ].GetClass(), character._inventory[ character.gun_slot ], true ) : 'fists' )
						] );
					}
					
					if ( character._ai_team === 6 ) // Criminal Star Defender
					{
						// Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false )
						if ( enemy.is( sdCharacter ) )
						if ( enemy._ai_team === 0 )
						return sdWorld.AnyOf( [ 
							'I refuse to answer for something I had not done!',
							'Why would you bother with me anyway, I do not think I am worth the hassle.',
							'You know, maybe I am just a clone.',
							'Did they send you in here with nothing too?',
							'Instructor laughed at me when I first got here.',
							'The food on this planet is bad anyway.',
							'It was just a little trolling.',
							'My advice? Avoid the space mushrooms.',
							'Were we not in the same platoon?',
							'I was just following orders.',
							'One day you will be in my place.',
							'Responsibility comes.',
							'They will eventually issue a warrant on you too.',
							'We are replacable, so I ran.',
							'Dying seems like a better option to me. Come, I am ready.',
							'What exactly will you get by capturing me?',
							'There are federal agents outside my base'
						] );
					}
					if ( character._ai_team === 7 ) // Setr faction
					{
						if ( Math.random() < 0.8 )
						return sdWorld.AnyOf( [ 
							'/Uytiuk mdmhjmye.', 
							'/Toisv muke!', 
							'/Jpbitp amlrn! ', 
							'/Monmfig eiayyse.',
							'/Smmems iiedyg.'
							] );
					}
					if ( character._ai_team === 10 ) // Time Shifter
					{
						if ( character.hea > 1250 )
						{
							// Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false )
							return sdWorld.AnyOf( [ 
								'I already killed you in the future. Might aswell have fun in the past.',
								'I know how you die, but I will not tell you.',
								'Are you ready?',
								'If I kill you now, it might change future events.',
								'Time is the most valuable resource. Something you do not have.'
							] );
						}
					}
					return null;
				},
			}
		};
		
		/* Probably a bad idea as it will break NPCs
		sdCharacter.player_allowed_blood_effect_types = [
			sdEffect.TYPE_WALL_HIT,
			sdEffect.TYPE_BLOOD_GREEN,
			sdEffect.TYPE_BLOOD
		];
		sdCharacter.player_allowed_blood_effect_filters = {
			'none':			'',
			'clone':		'saturate(0)brightness(0.75)'
		};*/
		
		sdCharacter.AI_MODEL_NONE = 0;
		sdCharacter.AI_MODEL_FALKOK = 1;
		sdCharacter.AI_MODEL_INSTRUCTOR = 2;
		sdCharacter.AI_MODEL_DUMMY_UNREVIVABLE_ENEMY = 3;
		sdCharacter.AI_MODEL_TEAMMATE = 4;
		sdCharacter.AI_MODEL_AGGRESSIVE = 5; // Has the AI aggressively charge their target.
		sdCharacter.AI_MODEL_DISTANT = 6; // // Has the AI try to retreat from their target and maintain distance between them.
		sdCharacter.AI_MODEL_AERIAL = 7; // // Has the AI fly all the time, even without a target. Does keep certain height above surface.
		
		sdCharacter.ghost_breath_delay = 10 * 30;
		
		sdCharacter.unique_discovery_indexes = [];
		
		
		sdCharacter.img_jetpack = sdWorld.CreateImageFromFile( 'jetpack_sheet' ); // Sprite sheet by Molis
		sdCharacter.img_grapple_hook = sdWorld.CreateImageFromFile( 'grapple_hook' );

		sdCharacter.air_max = 30 * 30; // 30 sec
		
		//sdCharacter.bullet_y_spawn_offset = -2; // Not only used for sword attacks
		sdCharacter.bullet_y_spawn_offset = -5; // Not only used for sword attacks
		
		sdCharacter.last_build_deny_reason = null;
		
		sdCharacter.disowned_body_ttl = 30 * 60 * 1; // 1 min
	
		sdCharacter.starter_matter = 50;
		sdCharacter.matter_required_to_destroy_command_center = 300; // Will be used to measure command centres' self-destruct if no characters with enough matter will showup near them
		
		sdCharacter.default_weapon_draw_time = 7;
		
		sdCharacter.ignored_classes_when_holding_x = [ 'sdCharacter', 'sdBullet', 'sdWorkbench', 'sdLifeBox', 'sdUpgradeStation', 'sdCaption', 'sdLandMine' ];
		sdCharacter.ignored_classes_when_not_holding_x = [ 'sdBullet', 'sdWorkbench', 'sdLifeBox', 'sdUpgradeStation', 'sdCaption', 'sdLandMine' ];

		sdCharacter.max_level = 60;
		
		sdCharacter.allow_alive_players_think = false; // Will be switching on/off depending on where from onThink was called (multiplayer players will have onThink logic delayed)
		
		sdCharacter.max_stand_on_elevation = 0.15; // 0.1 was not enough for case of walking on top of combiner-mounted crystals while occasionaly doing step-up logic
		sdCharacter.carried_item_collision_igonre_duration = 500; // Making sure it can land on top of player's head if thrown up
		sdCharacter.debug_hitboxes = false;
		
		sdCharacter.characters = []; // Used for AI counting, also for team management
		
		sdCharacter.as_class_list = [ 'sdCharacter' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	GetBleedEffect()
	{
		if ( Math.random() < 1 / 3 )
		if ( this.armor > 0 )
		if ( this.hea > 0 && !this._dying )
		return sdEffect.TYPE_WALL_HIT;
	
		if ( this._voice.variant === 'whisperf' || this._voice.variant === 'croak' || this._voice.variant === 'm2'  || this._voice.variant === 'whisper' || this._voice.variant === 'clone' )
		return sdEffect.TYPE_BLOOD_GREEN;
		
		if ( this._voice.variant === 'klatt3' || this._voice.variant === 'silence' || this._voice.variant === 'm4' || this._voice.variant === 'swordbot' )
		return sdEffect.TYPE_WALL_HIT;
	
		return sdEffect.TYPE_BLOOD;
	}
	GetBleedEffectHue()
	{
		if ( this._voice.variant === 'croak' )
		return -73;
	
		if ( this._voice.variant === 'whisperf' )
		return 73;

		if ( this._voice.variant === 'm2' )
		return 133;
	
		if ( this._voice.variant === 'whisper' )
		return 100;

		return 0;
	}
	GetBleedEffectFilter()
	{
		if ( this._voice.variant === 'clone' )
		return 'saturate(0)brightness(0.75)';
	
		return '';
	}
	
	DrawHelmet( ctx, frame=undefined )
	{
		// This won't work in lost effect since server does not load images
		
		let source_x_offset = 0;
		let source_y_offset = ( this.hea <= this.hmax / 2 ) ? 32 : 0; // Gory version
		
		if ( sdWorld.time > this._anim_blink_next )
		{
			source_x_offset = 32;
			
			if ( sdWorld.time > this._anim_blink_next + 200 )
			this._anim_blink_next = sdWorld.time + 1000 * 60 / ( Math.random() * 5 + 15 ); // 15-20 times per minute
		}
	
		if ( this.hea <= 0 )
		{
			source_y_offset = 64;
			source_x_offset = 32;
		}
		
		if ( sdCharacter.img_helmets[ this.helmet ].loaded )
		{
			source_x_offset = Math.min( source_x_offset, sdCharacter.img_helmets[ this.helmet ].naturalWidth - 32 );
			source_y_offset = Math.min( source_y_offset, sdCharacter.img_helmets[ this.helmet ].naturalHeight - 32 );
		}
		else
		{
			source_x_offset = 0;
			source_y_offset = 0;
		}
		
		/*if ( frame !== undefined )
		{
			ctx.save();

			var x, y, an;

			x = sdCharacter.head_pos[ frame ][ 0 ] - 16;
			y = sdCharacter.head_pos[ frame ][ 1 ] - 16;
			an = sdCharacter.head_pos[ frame ][ 2 ];

			ctx.translate( x, y );
			ctx.rotate( an / 180 * Math.PI );

			//ctx.drawImageFilterCache( sdCharacter.img_helmets[ this.helmet ], - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdCharacter.img_helmets[ this.helmet ], source_x_offset,source_y_offset,32,32, - 16, - 16, 32,32 );

			ctx.restore();
		}
		else*/
		ctx.drawImageFilterCache( sdCharacter.img_helmets[ this.helmet ], source_x_offset,source_y_offset,32,32, - 16, - 16, 32,32 );
	}
	
	/*get substeps() // sdCharacter that is being controlled by player will need more
	{
		if ( !sdWorld.is_server )
		{
			if ( sdWorld.my_entity === this )
			return Math.ceil( sdWorld.GSPEED ); // More if GSPEED is more than 1
		}
		
		return 1;
	}*/
	
	GetHitDamageMultiplier( x, y )
	{
		if ( this.hea > 0 )
		{
			// Headshots 
			
			/*let di_to_head = sdWorld.Dist2D( x, y, this.x, this.y - 8 );
			let di_to_body = sdWorld.Dist2D( x, y, this.x, this.y );

			if ( di_to_head < di_to_body )*/
			if ( y < this.y + this.hitbox_y1 + this.s/100 * 10 )
			return 1.65;
		}
	
		return 1;
	}
	AllowClientSideState() // Conditions to ignore sdWorld.my_entity_protected_vars
	{
		if ( Math.abs( this._position_velocity_forced_until - sdWorld.time ) > 1000 * 60 * 30 ) // 30 minutes difference usually means timezone changes... Better to correct this when possible than having delayed input
		this._position_velocity_forced_until = 0;
			
		return ( this.hea > 0 && !this.driver_of && this._frozen <= 0 && sdWorld.time > this._position_velocity_forced_until && !this.hook_relative_to ); // Hook does not work well with position corrections for laggy players
	}
	ApplyServerSidePositionAndVelocity( restrict_correction, sx, sy ) // restrict_correction is usually ever only true when player should get position correction restriction, assuming some server-side events exist that control player (grappling hook case)
	{
		if ( sdWorld.is_server )
		{
			if ( restrict_correction )
			this._position_velocity_forced_until = sdWorld.time + 200; // Somewhat equal to max ping?
		
			this._force_add_sx += sx;
			this._force_add_sy += sy;
		}
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_voice' ) return true;
		//if ( prop === '_ai' ) return true; Bad idea, object pointers here
		if ( prop === '_upgrade_counters' ) return true;
		if ( prop === '_save_file' ) return true;
		if ( prop === '_discovered' ) return true;
		if ( prop === '_user_data' ) return true;
		if ( prop === '_ai_stay_near_entity' ) return true;

		return false;
	}
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( !super.IsTargetable( by_entity, ignore_safe_areas ) )
		return false;
		
		return ( this.driver_of === null || !this.driver_of.VehicleHidesDrivers() );
	}
	IsPlayerClass() // sdCharacter has it as well as everything that extends him
	{
		return true;
	}
	GiveScore( amount, killed_entity=null, allow_partial_drop=true )
	{
		sdWorld.GiveScoreToPlayerEntity( amount, killed_entity, allow_partial_drop, this );
	}
	onScoreChange()
	{
		if ( sdWorld.server_config.LinkPlayerMatterCapacityToScore( this ) )
		{
			let old_matter_max = this.matter_max;

			this.matter_max = Math.min( 50 + Math.max( 0, this._score * 20 ), 1850 ) + this._matter_capacity_boosters;
			
			// Keep matter multiplied when low score or else it feels like matter gets removed
			if ( this._score < 100 )
			this.matter = this.matter / old_matter_max * this.matter_max;
		}
	}
	canSeeForUse( ent )
	{
		let off = this.GetBulletSpawnOffset();

		return ( sdWorld.CheckLineOfSight( this.x + off.x, this.y + off.y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2, null, null, null, sdWorld.FilterOnlyVisionBlocking ) )
	}
	onSeesEntity( ent ) // Only gets triggered for connected characters that have active socket connection, with delay (each 1000th entity is seen per sync)
	{
		if ( !this.is( sdCharacter ) )
		return;
	
		if ( ent.is( sdStatusEffect ) || ent.is( sdTask ) )
		return;

		let hash;

		if ( ent.IsPlayerClass() )
		{
			if ( ent._ai_enabled )
			hash = ent.title + '';
			else
			hash = ent.biometry + '';
		}
		else
		hash = ent.GetClass() + '.' + (ent.type||'') + '.' + (ent.class||'') + '.' + (ent.kind||'') + '.' + (ent.material||'') + '.' + (ent.matter_max||'');

		if ( typeof this._discovered[ hash ] === 'undefined' )
		{
			let off = this.GetBulletSpawnOffset();

			let xx = ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2;
			let yy = ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2;

			if ( sdWorld.CheckLineOfSight( this.x + off.x, this.y + off.y, xx, yy, ent, null, sdCom.com_vision_blocking_classes ) )
			{
				this._discovered[ hash ] = 1;

				let t = /*'<' + */sdWorld.ClassNameToProperName( ent.GetClass(), ent, true );// + '>';

				if ( Math.abs( sdWorld.time - this._last_discovery ) > 2 * 60 * 1000 ) // Once in 2 minutes // Was 15 seconds
				if ( this.hea > this.hmax * 0.75 )
				{
					this._last_discovery = sdWorld.time;
					
					let i_have_ = ( ent.is( sdGun ) && ent._held_by === this ) ? 'I have ' : '';
					
					let options =
					[
						'Huh, '+t+'? This is something new',
						t+' looks interesting',
						'I\'ve never seen '+t+' before',
						t+' is new to me',
						'I\'ve discovered '+t,
						'That is '+t+' for sure',
						t+'? Gonna note that',
						t+'? Amazing',
						t+'? I\'m shocked',
						'So this is how '+t+' looks like',
						'Wow, '+i_have_+'a real '+t,
						'Gotta screenshot '+t,
						'Wow, '+i_have_+'a '+t+'. I\'m literally shaking',
						t+' looks cool',
						'We\'ve met again, '+t,
						'Ah, '+i_have_+'the '+t,
						
						'They have '+t+' here? Nice',
						'I\'m excited to see you, '+t,
						'I\'ve been missing you, '+t,
						'It wasn\'t the same without you, '+t,
						'Wow, the opportunity to see '+t,
						'I wonder what are you good for, '+t,
						'I\'m all ecstatic for '+t,
						t+'? This is getting me upbeat',
						'What are you doing there, little '+t+'?',
						'Aha! I found '+t,
						'Contact on '+t,
						'Discovering '+t,
						'Nice, a chance to experience '+t, 
						'I don\'t know nothing about '+t+', don\'t I?',
						'Gotta spend some time with '+t,
						'Nice, '+i_have_+'a '+t+'. But can I exchange '+t+' for more matter?',
						'Huh, '+i_have_+'a '+t+' is ['+Math.round(ent._hitbox_x2 - ent._hitbox_x1)+'] units wide',
						'Huh, '+i_have_+'a '+t+' is ['+Math.round(ent._hitbox_y2 - ent._hitbox_y1)+'] units in height',
						'This '+t+' '+i_have_+''+( ent._current_target === this ? 'looks threatening to me' : 'seems chill' ),
						'This '+t+' '+i_have_+''+( ( ent._hea || ent.hea || 0 ) <= 0 ? 'looks rather dead' : 'looks rather healthy' ),
						t+' is right there',
						'This day can\'t get any better with '+t+', can\'t it?',
					];
					
					// EG: I didn't even read them all.
					let chatGPT_options = `Well, well, well, what do we have here? A wild THING appears!
Hold onto your helmets, folks! THING sighting ahead!
Oh, snap! Check out the latest addition to the alien fashion show - THING!
Look alive, team! THING's dropping in, and it's a head-scratcher!
Beam me up, THING-y! We've got a new star on the planet!
New planet, new day, new... THING. Seriously, where do they come up with this stuff?
Alert the space paparazzi! THING's making its red carpet debut right before our eyes!
Captain, you won't believe it - we've got THING on the horizon and it's utterly peculiar!
Step aside, ordinary discoveries! THING is about to steal the show!
Gather 'round, explorers! THING's the latest gossip in the alien neighborhood.
Well, blow me down! THING's like nothing we've encountered in this or any other galaxy!
Attention, universe! THING just joined the party, and it's rewriting the guest list!
Buckle up, crew! THING's giving us a one-of-a-kind welcome to this alien shindig!
Check out the extraterrestrial oddity - THING! It's like a surprise package from the cosmos.
Heads up, gang! THING's crash-landed in our midst, and it's a mind-boggler!
Say cheese, THING! You're about to become the star of our otherworldly photo album!
Move over, run-of-the-mill species! THING's rolling in, ready to rock our scientific socks off!
Hold tight, everyone! THING's here to remind us that the universe is the ultimate prankster.
Attention, fellow stargazers! THING's the main event in today's cosmic sideshow!
Prepare for awe, crew! THING's dropping by unannounced, and it's a jaw-dropper!
Calling all starship shutterbugs! THING's the newest subject for our alien photo collection!
Brace yourselves, explorers! THING's crashed the party, and it's a game-changer!
Time to dust off the thesaurus, folks, because THING defies description!
I told the universe to surprise us, but THING's taken it to a whole new level!
Huddle up, team! THING's here to remind us that predictability is overrated!
Newsflash from the cosmos: THING's in town, and it's rewriting the rulebook!
Someone pinch me - THING's the stuff dreams (or possibly nightmares) are made of!
Break out the welcome wagon, crew! THING's the latest arrival in our cosmic neighborhood!
Remember those "believe in the unbelievable" posters? Well, THING just embodied them!
Incoming transmission: THING sighted! Prepare for maximum weirdness!
Stop the space presses! THING's here to steal the extraterrestrial spotlight!
Hold onto your helmets, crew! THING's crashing this alien party!
Time to update the alien encyclopedia - THING's chapter has just begun!
Well, paint me green and call me an alien! THING's a whole new level of strange.
Hey there, THING! You've just become the star of our otherworldly safari!
I've seen space oddities, but THING takes the cosmic cake!
Buckle up, explorers! THING's here to show us the zaniest side of the universe.
Alert the space geeks! THING's a front-row seat to an intergalactic sideshow!
To infinity and THING-yond! This planet just got a whole lot stranger.
What do you know? THING's making its grand entrance into the alien theater!
Look alive, crew! THING's in town and it's rewriting the laws of weird.
Ever wish upon a shooting star? Well, here's THING to grant your wish for oddity!
Prepare for liftoff, because THING's a ticket to a whole new dimension of bizarre!
And the award for "Most Unconventional Alien" goes to... you guessed it, THING!
Brace for alien impact! THING's a one-of-a-kind collision with the unknown.
Well, slap me with a tentacle! THING's like nothing even the holodeck could conjure.
Fire up the curiosity engines, team! THING's here to put our imaginations to shame!
Hold the starship phone! THING's a wakeup call to the cosmos' sense of humor.
Quick, someone call the space paparazzi! THING's the latest sensation in the stars.
To explore strange new worlds and seek out new life forms like THING – that's the mission!
Commence operation "Figure Out THING"! Our scanners are in for a workout.
What's weirder than an alien planet? Meeting THING, the embodiment of weirdness!
Grab your space popcorn, folks! THING's the star of this otherworldly show.
Warning: THING overload imminent! This planet's become an oddity hotspot.
We've seen the sci-fi movies, but THING's a real-life enigma from beyond the stars.
Alien bingo, anyone? THING's a new entry on our cosmic playing card.
Mark this day in the space calendar! THING's like discovering a new color in the spectrum.
Listen up, universe! THING's proof that the cosmos has a wild sense of creativity.
Time to rewrite the textbooks, team! THING's a lesson in uncharted alien biology.
Well, butter my space toast! THING's a breakfast surprise from the cosmos.
What's that? It's not a bird, it's not a plane - it's THING, defying all expectations!
Incoming transmission from the bizarre zone: THING's the new star of the show!
Hold onto your helmets, explorers! THING's here to turn reality into science fiction.
Attention, fellow star seekers! THING's the ultimate proof that weird knows no bounds.
To THING or not to THING? That's the question we'll be pondering for light-years.
Cue the alien fanfare! THING's our VIP guest in this cosmic extravaganza.
Commander, you won't believe it! THING's a real-life emoji from the alien realm.
Uncharted territory, meet THING - the poster child for the unexpected!
Friendly reminder: THING's our daily dose of "what on earth... or not on earth"!
Get your camera drones ready, crew! THING's an A-list celebrity in the alien realm.
Well, blow me down and call me an asteroid! THING's like nothing we've seen before.
Roll out the welcome hovercarpet, team! THING's the guest of honor at our alien soiree.
Science fiction's got nothing on THING! This is the real deal, folks.
Brace for cosmic oddity, explorers! THING's a walk on the wild side of the universe.
It's official: THING's the latest sensation in the space tabloids. Move over, stars!
Behold, the enigma known as THING! Prepare for an alien mind-bender.
Ready for a space conundrum? THING's like an alien puzzle wrapped in mystery.
Planet of the weird, meet THING - the crowned ruler of extraterrestrial oddities!
Attention, starship log: THING's a remarkable entry in our cosmic chronicles.
Greetings, THING! Your otherworldly antics have officially made our day.
What's that, THING? The universe just hit us with a curveball of strangeness!
Prepare for liftoff, crew! THING's our ticket to the ultimate alien rollercoaster.
Quick, someone give THING a standing ovation for redefining the weird-o-meter!
Hold tight, explorers! THING's here to give us a lesson in interstellar unpredictability.
Say hello to the cosmos' favorite conversation starter: THING, the ultimate icebreaker.
Space goggles on, crew! THING's an eye-popping spectacle from the outer realms.
Calling all space detectives! THING's the newest case in our intergalactic mystery files.
Well, color me intrigued! THING's a crayon outside the lines of normalcy.
Attention, universe: THING's the cosmic cherry on top of this alien sundae!
Break out the cosmic confetti, team! THING's a reason to celebrate the unknown.
Ever seen a shooting star with tentacles? Say hello to THING, the galactic anomaly!
Hold the starship phone, explorers! THING's a voice message from the far reaches of oddity.
Brace yourselves, crew! THING's a whirlwind tour of the cosmos' creative genius.
To boldly go where no one's gone before... and meet THING, the star attraction!
Stop the starship! THING's here to prove that weirdness is the universal language.
Well, slap me with a comet! THING's a cosmic curveball in the game of alien discoveries.
Alert the cosmic art gallery! THING's a masterpiece straight from the imagination of aliens.
Prepare for a close encounter of the THING kind! This is no ordinary rendezvous.
Look alive, fellow star sailors! THING's the compass pointing toward the bizarre.
Calling all explorers, code "Weird"! THING's the password to this alien wonderland.
Quick, someone pinch me! THING's the real-life embodiment of our wildest dreams.
Beam us up, THING! You're the star we've been waiting for in this interstellar play.
Gather 'round, star gawkers! THING's the headline act in the cosmic circus.
Well, space jellyfish and nebulae! THING's like a mashup of all things extraterrestrial.
Incoming transmission from the unknown: THING's the latest message from the cosmos.
Hold onto your helmets, crew! THING's the rollercoaster ride through alien imagination.
Attention, starship crew: THING's the answer to the riddle of interstellar oddities.
It's official: THING's the ultimate wild card in the deck of cosmic exploration.
Prepare for liftoff, universe! THING's the rocket fuel for our intergalactic curiosity.
Say hello to THING - the cosmic jigsaw puzzle piece we didn't even know was missing!
Brace for interstellar impact, team! THING's a phenomenon from the farthest reaches.
Well, orbit me around a star! THING's the ultimate reminder that normal's overrated.
Get your alien dictionaries ready, folks! THING's the latest entry in the lexicon of weird.
Incoming from the cosmos: THING's the new buzzword in the interstellar dictionary.
Alien planet, meet THING - the visitor that puts the "extra" in extraterrestrial!
Hold tight, explorers! THING's the invitation to a galactic masquerade of the unusual.
Attention, star seekers! THING's the latest revelation in our quest for the cosmic unknown.
Cue the cosmic drumroll! THING's the surprise package from the depths of space.
What's that? It's not a meteor shower, it's not a comet - it's THING, the cosmic showstopper!
Whoa, THING? New, right?
Check THING out! Weird.
Meet THING: an alien or an art?
THING, you're unique!
Blast! THING's here now.
A THING! Surprise from the universe.
THING? Never seen this.
Look, THING's fascinating!
Introducing THING, oddity extraordinaire!
THING - cosmos' new face.
Hold on, THING's unknown.
THING? Cosmic mystery solved!
THING: space's oddball addition.
THING's uniqueness - astounding, huh?
Behold THING: space's curveball!
THING's entry: cosmic surprise.
Explore, and find THING!
What's up, THING? Unbelievable!
THING's arrival: redefine weird.
THING: space's wild card.
Surprise, universe: THING's here!
Encounter THING, redefine normal.
THING: cosmic head-scratcher.
Meet THING: space's novelty.
THING's debut: interstellar delight!
Whoa, THING alert! New?
THING: space's showstopper.
Unveiling THING: redefine strange.
THING is cosmic mic drop!`;
					
					let chatGPT_options_lines = chatGPT_options.split('\n');
					for ( let i = 0; i < chatGPT_options_lines.length; i++ )
					{
						if ( chatGPT_options_lines[ i ].charAt( chatGPT_options_lines[ i ].length - 1 ) === '.' )
						options.push( chatGPT_options_lines[ i ].substring( 0, chatGPT_options_lines[ i ].length - 1 ).split( 'THING' ).join( t ) );
						else
						options.push( chatGPT_options_lines[ i ].split( 'THING' ).join( t ) );
					}
					
					if ( sdCharacter.unique_discovery_indexes.length === 0 )
					{
						for ( let i = 0; i < options.length; i++ )
						sdCharacter.unique_discovery_indexes.push( i );
					}
					
					let random_id = ~~( Math.random() * sdCharacter.unique_discovery_indexes.length );
					this.Say( options[ sdCharacter.unique_discovery_indexes[ random_id ] ], true, false, true );
					sdCharacter.unique_discovery_indexes.splice( random_id, 1 );

					/*switch ( ~~( Math.random() * 38 ) )
					{
						case 0: this.Say( 'Huh, '+t+'? This is something new', true, false, true ); break;
						case 1: this.Say( t+' looks interesting', true, false, true ); break;
						case 2: this.Say( 'I\'ve never seen '+t+' before', true, false, true ); break;
						case 3: this.Say( t+' is new to me', true, false, true ); break;
						case 4: this.Say( 'I\'ve discovered '+t ); break;
						case 5: this.Say( 'That is '+t+' for sure', true, false, true ); break;
						case 6: this.Say( t+'? Gonna note that', true, false, true ); break;
						case 7: this.Say( t+'? Amazing', true, false, true ); break;
						case 8: this.Say( t+'? I\'m shocked', true, false, true ); break;
						case 9: this.Say( 'So this is how '+t+' looks like', true, false, true ); break;
						case 10: this.Say( 'Wow, '+i_have_+'a real '+t, true, false, true ); break;
						case 11: this.Say( 'Gotta screenshot '+t, true, false, true ); break;
						case 12: this.Say( 'Wow, '+i_have_+'a '+t+'. I\'m literally shaking', true, false, true ); break;
						case 13: this.Say( t+' looks cool', true, false, true ); break;
						case 14: this.Say( 'We\'ve met again, '+t, true, false, true ); break;
						case 15: this.Say( 'Ah, '+i_have_+'the '+t, true, false, true ); break;

						case 16: this.Say( 'They have '+t+' here? Nice', true, false, true ); break;
						case 17: this.Say( 'I\'m excited to see you, '+t, true, false, true ); break;
						case 18: this.Say( 'I\'ve been missing you, '+t, true, false, true ); break;
						case 19: this.Say( 'It wasn\'t the same without you, '+t, true, false, true ); break;
						case 20: this.Say( 'Wow, the opportunity to see '+t, true, false, true ); break;
						case 21: this.Say( 'I wonder what are you good for, '+t, true, false, true ); break;
						case 22: this.Say( 'I\'m all ecstatic for '+t, true, false, true ); break;
						case 23: this.Say( t+'? This is getting me upbeat', true, false, true ); break;
						case 24: this.Say( 'What are you doing there, little '+t+'?', true, false, true ); break;
						case 25: this.Say( 'Aha! I found '+t, true, false, true ); break;
						case 26: this.Say( 'Contact on '+t, true, false, true ); break;
						case 27: this.Say( 'Discovering '+t, true, false, true ); break;
						case 28: this.Say( 'Nice, a chance to experience '+t, true, false, true ); break;
						case 29: this.Say( 'I don\'t know nothing about '+t+', don\'t I?', true, false, true ); break;
						case 30: this.Say( 'Gotta spend some time with '+t, true, false, true ); break;
						case 31: this.Say( 'Nice, '+i_have_+'a '+t+'. But can I exchange '+t+' for more matter?', true, false, true ); break;
						case 32: this.Say( 'Huh, '+i_have_+'a '+t+' is ['+Math.round(ent._hitbox_x2 - ent._hitbox_x1)+'] units wide', true, false, true ); break;
						case 33: this.Say( 'Huh, '+i_have_+'a '+t+' is ['+Math.round(ent._hitbox_y2 - ent._hitbox_y1)+'] units in height', true, false, true ); break;
						case 34: this.Say( 'This '+t+' '+i_have_+''+( ent._current_target === this ? 'looks threatening to me' : 'seems chill' ) ); break;
						case 35: this.Say( 'This '+t+' '+i_have_+''+( ( ent._hea || ent.hea || 0 ) <= 0 ? 'looks rather dead' : 'looks rather healthy' ) ); break;
						case 36: this.Say( t+' is right there', true, false, true ); break;
						case 37: this.Say( 'This day can\'t get any better with '+t+', can\'t it?', true, false, true ); break;
							

					}*/
				}

				this.GiveScore( 1, null, false );

				if ( this._socket )
				sdSound.PlaySound({ name:'powerup_or_exp_pickup', x:this.x, y:this.y, volume:0.4, pitch:0.5 }, [ this._socket ] );

				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'DISCOVERY-' + hash, 
					executer: this,
					mission: sdTask.MISSION_GAMEPLAY_NOTIFICATION,
					title: 'You\'ve discovered '+t,
					description: '+1 score',
					//time_left: 90
				});
			}
		}
	}
	
	PreInit() // Best place for NaN tracking methods initialization
	{
		if ( globalThis.CATCH_ERRORS )
		{
			//globalThis.EnforceChangeLog( this, 'x', true, 'abs>100' );
			//globalThis.EnforceChangeLog( this, 'y', true, 'abs>100' );
			
			/*globalThis.EnforceChangeLog( this, 'sx', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 'sy', true, 'nan_catch' );
			
			globalThis.EnforceChangeLog( this, 'x', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 'y', true, 'nan_catch' );
			
			globalThis.EnforceChangeLog( this, 'look_x', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 'look_y', true, 'nan_catch' );
			
			globalThis.EnforceChangeLog( this, '_hitbox_y2', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 's', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 'death_anim', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, '_crouch_intens', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 'tilt', true, 'nan_catch' );*/
		}
	}
	
	/*get tilt()
	{
		debugger;
		return 0;
	}
	set tilt( v )
	{
		debugger;
		//this.DamageStability( 50 );
	}
	get tilt_speed()
	{
		debugger;
		return 0;
	}
	set tilt_speed( v )
	{
		debugger;
	}*/
	
	DamageStability( v ) // v is usually a velocity or damage received
	{
		let delta_since_last_damage = sdWorld.time - this._ignored_stability_damage_last;
		
		this._ignored_stability_damage = sdWorld.MorphWithTimeScale( this._ignored_stability_damage, 0, 0.85, delta_since_last_damage / 1000 * 30 );
		
		this._ignored_stability_damage_last = sdWorld.time;
		
		this._ignored_stability_damage += v;
		
		if ( this._ignored_stability_damage > 33 )
		{
			this.stability = Math.max( -100, this.stability - this._ignored_stability_damage / ( this.hmax / 250 ) );
			
			if ( this._ai )
			{
				// Push aiming of AI characters whenever they take damage
				let r = Math.min( 50, this._ignored_stability_damage / ( this.hmax / 250 ) * 5 );
				let an = Math.random() * Math.PI * 2;
				this.look_x += Math.sin( an ) * r;
				this.look_y += Math.cos( an ) * r;
			}
			
			this._ignored_stability_damage = 0;
		}
	}
	
	GetStepSound()
	{
		//if ( this.GetBleedEffect() === sdEffect.TYPE_WALL_HIT )
		if ( this.bleed_effect === sdEffect.TYPE_WALL_HIT )
		return 'player_step_robot';
		else
		return 'player_step';
	}
	GetStepSoundVolume()
	{
		if ( this.bleed_effect === sdEffect.TYPE_WALL_HIT )
		return 0.5 * ( this.s / 100 );
		else
		return 1 * ( this.s / 100 );
	}
	GetStepSoundPitch()
	{
		return 1 / ( 1 * 0.5 + 0.5 * ( this.s / 100 ) );
	}
	onSkinChanged()
	{
		this.bleed_effect = this.GetBleedEffect();
	}
	
	constructor( params )
	{
		super( params );
		
		//console.warn( 'Character created', this, params );
		
		//EnforceChangeLog( this, '_frozen' );
		
		//this._is_cable_priority = true;

		this._debug_last_removed_stack = null;
		
		this._local_ragdoll_ever_synced = false; // To track need to precalculate ragdoll logic
		
		this.s = 100; // Scale, %
		
		this.stability = 100; // -100...100. Low values cause player to activate ragdoll and move slower. Drops down due to high damage (not towards the armor) and high impulses received
		this._ignored_stability_damage = 0; // Grows when stability damage is received. If above certain moment - it goes towards stabiltiy damage. Slowly decreses overtime. Should accumulate shotgun-like damages
		this._ignored_stability_damage_last = 0; // Time of last stability damage for passive solving of accumulation decrease
		
		this._socket = null; // undefined causes troubles
		this._my_hash = undefined;
		this._save_file = null;
		this._user_data = {}; // Must be JSON-able. Contains random game mode related values
		/*this._pos_corr_x = this.x;
		this._pos_corr_y = this.y;
		this._pos_corr_until = 0;*/
		this._GSPEED_buffer_length_allowed = 0; // For players
		this.sync = 0; // Will let other players know if gspeed catch-up logic was already applied to player, thus allowing updating it without freezing in time and place
			
		this._list_online = 0; // Same value as in 'list_online' setting. Lets players be not listed on the leaderboard
			
		this._global_user_uid = null; // Multiple sdCharacter-s can have same _global_user_uid because it points to user, not a character - user can have multiple characters. This can be null in sandbox modes that chose not to use global accounts yet might use presets and translations
		
		this.lag = false;
		
		this._self_boost = 0;
		
		this._god = false;
		this._debug = false; // Debug godmode when /god 2 // Always check for _god property too
		this.skin_allowed = true;
		
		this._discovered = {}; // Entity classes with type hashes, makes player gain starter score
		this._last_discovery = sdWorld.time; // Do not interrupt instructor as much

		this._can_breathe = true;
		
		this.helmet = 1;
		this.body = 1;
		this.legs = 1;
		
		this._weapon_draw_timer = 0;
		this.weapon_stun_timer = 0; // Octopuses hold players' so they can't shoot. Throwing crystals also causes it
		
		this._in_water = false;
		
		this._ledge_holding = false;
		
		this.driver_of = null;
		this._potential_vehicle = null; // Points at vehicle which player recently did hit
		
		this.carrying = null; // Crystal (and maybe something else too?) carrying
		this._previous_carrying = null; 
		this._previous_carrying_ignore_until = 0;
		//this._potential_carry_target = null; // Crystals perhaps
		this._current_collision_filter = null;
		this._carried_item_collision_filter = null;
		
		/*this._listeners = {
			DAMAGE: [],
			REMOVAL: []
		};*/
		
		this._owner = params._owner || null; // Just for manually made AI sdCharacters
		
		this._ai = null; // Object, won't be saved to snapshot
		this._ai_enabled = ( params._ai_enabled ) || 0; // Now means id of AI model // false;
		this._init_ai_model = this._ai_enabled || 0; // Initial / AI model on spawn. AI model needs to be declared in parameters of "new sdCharacter({...});"
		this._ai_gun_slot = ( params._ai_gun_slot ) || 0; // When AI spawns with a weapon, this variable needs to be defined to the same slot as the spawned gun so AI can use it
		this._ai_level = ( params._ai_level ) || 0; // Self explanatory
		this._ai_team = 0; // AI "Teammates" do not target each other
		this._ai_last_x = 0;
		this._ai_last_y = 0;
		this._ai_action_counter = 0; // Counter for AI "actions"
		this._ai_dig = 0; // Amount of blocks for AI to shoot when stuck; given randomly in AILogic when AITargetBlocks is called
		this._ai_stay_near_entity = null; // Should AI stay near an entity/protect it?
		this._ai_stay_distance = params._ai_stay_distance || 128; // Max distance AI can stray from entity it follows/protects.
		this._allow_despawn = true; // Use to prevent despawn of critically important characters once they are downed (task/mission-related)
		this._ai_allow_weapon_switch = true; // Allow switching weapons if AI has multiple of them
		this._ai_post_alert_fire_prevention_until = 0; // Applied if target is a real player. Prevents case when spawned mobs instantly attack player
		// PB:FttP/PB2-like relative movement suggestions to restore line of sight:
		this._ai_dive_suggestion_x = 0;
		this._ai_dive_suggestion_y = 0;
		this._ai_dive_suggestion_rethink_in = 0;
		this._ai_force_fire = false; // For possessed AIs
		
		this.title = params.title || ( 'Random Hero #' + this._net_id );
		this.title_censored = 0;
		
		this._my_hash = undefined; // Will be used to let players repsawn within same entity if it exists on map
		this._save_file = undefined; // Used to transfer save file together with character
		this.biometry = Math.floor( Math.random() * 9007199254740991 ); // Used for entities to recognize player when he leaves server (_net_id is different on other servers)
		//this._old_score = 0; // This value is only read/written to when player disconnects and reconnects
		this._score = 0; // Only place where score will be kept from now
		
		// Some stats for Cubes to either attack or ignore players
		this._nature_damage = 0;
		this._player_damage = 0;
		
		this._non_innocent_until = 0; // Used to determine who gone FFA first
		
		this._fall_sound_time = 0;
		
		this._auto_shoot_in = 0; // Timer, when above 0 player can not switch weapon or drop weapon nor shoot. Once it reaches 0 - player will automatically shoot, probably
		
		this._current_built_entity = null; // For entities that are built in 2 or more stages, usually with help of separate weapon. These include sdCable-s
		
		this.sx = 0;
		this.sy = 0;
		
		// Disables position correction during short period of time (whenever player is pushed, teleported, attacked by sdOctopus etc). Basically stuff that client can't calculate (since projectiles deal no damage nor knock effect)
		this._position_velocity_forced_until = sdWorld.time + 200; // Should allow better respawning in arena-like mode (without player instantly moving back to where he just died if close enough for position correction)
		this._force_add_sx = 0;
		this._force_add_sy = 0;

		this._side = 1;
		this.stands = false;
		this._stands_on = null;
		this._in_air_timer = 0; // Grows and is used to activate jetpack without extra jump tap mid-air
		
		this.hea = 250;
		this.hmax = 250;
		this.lst = 0; // How "lost" is this player?
		this._dying = false;
		this._dying_bleed_tim = 0;
		//this._wb_timer = 0; // Workbench timer, used to reset player's workbench level to 0 if he's not near it.

		this.armor = 0; // Armor
		this.armor_max = 0; // Max armor; used for drawing armor bar
		this._armor_absorb_perc = 0; // Armor absorption percentage
		this.armor_speed_reduction = 0; // Armor speed reduction, depends on armor type
		this._armor_repair_amount = 0; // Armor repair speed
		
		this.mobility = 100; // Used to slow-down hostile AIs

		//this.anim_death = 0;
		this._anim_walk = 0;
		this.fire_anim = 0;
		this.reload_anim = 0;
		this.pain_anim = 0;
		this.death_anim = 0;
		
		this.flashlight = 0;
		this.has_flashlight = 0;
		this._last_f_state = 0;

		this.act_x = 0;
		this.act_y = 0;
		//this.act_fire = 0;

		this.look_x = 0;
		this.look_y = 0;
		//this._an = 0; Became a getter because gun offsets calculation isn't easy task and is not needed unless player shoots
		
		//this.tilt = 0; // X button
		//this.tilt_speed = 0;
		
		this._crouch_intens = 0;
		
		//this._ignored_guns = [];
		//this._ignored_guns_until = [];
		this._ignored_guns_infos = []; // arr of { ent, until }
		
		this._inventory = []; this._inventory.length = 10; this._inventory.fill( null );
		this.gun_slot = 0;
		this._backup_slot = 0;
		
		//this.hook_x = 0;
		//this.hook_y = 0;
		this._hook_once = true;
		
		this.hook_relative_to = null;
		this.hook_len = -1;
		
		this.hook_relative_x = 0;
		this.hook_relative_y = 0;

		this._hook_projectile = null;
		this.hook_projectile_net_id = -1;

		this._jetpack_power = 1; // Through upgrade
		
		this._hook_allowed = false; // Through upgrade
		this._jetpack_allowed = false; // Through upgrade
		this._ghost_allowed = false; // Through upgrade
		//this._coms_allowed = false; // Through upgrade, only non-proximity one
		this._damage_mult = 2; // Through upgrade. Has no effect anymore, but level of 3 allows damaging some buildings
		//this._build_hp_mult = 1; // Through upgrade
		this._matter_regeneration = 0; // Through upgrade
		//this._recoil_mult = 1; // Through upgrade
		//this._air_upgrade = 1; // Underwater breath capacity upgrade
		this.build_tool_level = 0; // Used for some unlockable upgrades in build tool // this._level // this.level
		this._jetpack_fuel_multiplier = 1; // Fuel cost reduction upgrade
		this._matter_regeneration_multiplier = 1; // Matter regen multiplier upgrade
		this._stability_recovery_multiplier = 1; // How fast does the character recover after stability damage?
		this._shield_allowed = false; // Through upgrade
		this._ghost_cost_multiplier = 1; // Through upgrade
		this._shield_cost_multiplier = 1; // Through upgrade
		this._armor_repair_mult = 1; // Through upgrade
		this._sword_throw_mult = 1; // Through upgrade
		
		//this.workbench_level = 0; // Stand near workbench to unlock some workbench build stuff
		this._task_reward_counter = 0;

		this._score_to_level = 50;// How much score is needed to level up character?
		this._score_to_level_additive = 50; // How much score it increases to level up next level
		//this._max_level = 30; // Current maximum level for players to reach

		//this._acquired_bt_mech = false; // Has the character picked up build tool upgrade that the flying mech drops?
		//this._acquired_bt_rift = false; // Has the character picked up build tool upgrade that the portals drop?
		//this._acquired_bt_score = false; // Has the character reached over 5000 score?
		//this._acquired_bt_projector = false; // Has the character picked up build tool upgrade that the dark matter beam projectors drop?
		this.flying = false; // Jetpack flying
		//this._last_act_y = this.act_y; // For mid-air jump jetpack activation
		
		this.ghosting = false;
		this._ghost_breath = 0; // Time until next breath as ghost
		this._last_e_state = 0; // For E key taps to activate ability
		this._last_fire_state = 0; // For semi auto weaponry
		this._shielding = false; // Shielding, same as ghosting
		this._shield_ent = null; // Magic property name
		
		this._shield_allowed = false; // Through upgrade
		
		this._respawn_protection = 0; // Given after long-range teleported. Also on resque teleporting // Also prevents player from shooting
		
		this._upgrade_counters = {}; // key = upgrade
		
		this._regen_timeout = 0;
		
		this.cc_id = 0; // net_id of Command centre, which defines player's team
		this._cc_rank = 0; // 0 for owner, anything else for non-owner
		//this.cc_r = 0; // Rank within command centre. 
		
		this._key_states = new sdKeyStates();
		this._q_held = false;
		
		this.air = sdCharacter.air_max;
		
		this._build_params = null; // What player is about to build
		this._last_built_entity = null; // Used to resize regions, perhaps
		
		//this.hue = ~~( Math.random() * 360 );
		//this.saturation = ~~( 50 + Math.random() * 200 );
		
		//this.filter = params.filter || '';
		this.sd_filter = params.sd_filter || null; // Custom per-pixel filter
		
		this._sd_filter_old = null;
		this._sd_filter_darkened = null;
		
		this._voice = params._voice || {
			wordgap: 0,
			pitch: 50,
			speed: 175,
			variant: 'klatt',
			voice: 'en'
		};
		this._speak_id = -1; // Required by speak effects // last voice message
		this._say_allowed_in = 0;
		this._chat_color = params.chat_color || '#ffffff'
		
		//this.team_id = 0; // 0 is FFA team
	
		this.matter = sdCharacter.starter_matter;
		this.matter_max = sdCharacter.starter_matter;
		
		this._matter_capacity_boosters = 0; // Cube shards are increasing this value
		this._matter_capacity_boosters_max = 20 * 45;
		
		//this.stim_ef = 0; // Stimpack effect
		this.power_ef = 0; // Damage multiplication effect
		this.time_ef = 0; // GSPEED manipulations
		
		this._matter_old = this.matter;
		
		this._last_damage_upg_complain = 0;
		
		this._recoil = 0;
		
		this._ragdoll = null; // Client-side ragdolls could be here? Not ready.
		
		this._sickness = 0; // When sick - occasionally gets random damage and when dies turns into zombie?
		this._last_sickness_from_ent = null;
		this._sick_damage_timer = 0;
		//this.lost = 0; // Set to lost type if sdCharacter is lost
		
		// Client-side blinking
		this._anim_blink_next = sdWorld.time + 5000; // Better like this for main screen since it is recreated all the time
		
		if ( ( !sdWorld.is_server || sdWorld.is_singleplayer ) && this.is( sdCharacter ) )
		{
			if ( !this._ragdoll )
			this._ragdoll = new sdCharacterRagdoll( this );
		}
		else
		{
			// Prevent ragdoll spawn for drones and overlords
			if ( this._ragdoll )
			{
				this._ragdoll.remove();
				this._ragdoll = null;
			}
		}
		
		this._allow_self_talk = true;
		this._camera_zoom = sdWorld.default_zoom;
		this._additional_camera_zoom_mult = 1; // Admins can change it
		
		this._has_rtp_in_range = false; // Updated only when socket is connected. Also measures matter. Works only when hints are working"

		this.bleed_effect = this.GetBleedEffect(); // Clients need it in order to play proper walk sound

		this._voice_channel = sdSound.CreateSoundChannel( this );
		
		this._jetpack_effect_timer = 0; // Client-side
		
		sdCharacter.characters.push( this );
	}
	GetCameraZoom()
	{
		return this._camera_zoom / this._additional_camera_zoom_mult;
	}
	SetCameraZoom( v )
	{
		v *= this._additional_camera_zoom_mult;
		
		this._camera_zoom = v;
		
		if ( sdWorld.my_entity === this )
		{
			sdWorld.current_zoom = v;
			window.onresize();
		}
		
		if ( sdWorld.is_server )
		{
			if ( this._socket )
			{
				this._socket._SetCameraZoom( v );
			}
		}
	}
	
	/*get _an()
	{
		debugger; // sdCharacter\'s property _an is obsolete now
		return 0;
	}
	set _an( v )
	{
		debugger; // sdCharacter\'s property _an is obsolete now
		//console.log( 'sdCharacter\'s property _an is obsolete now' );
	}*/
	GetLookAngle( for_visuals=false )
	{
		if ( for_visuals )
		if ( this.driver_of )
		return 0;
		
		let offset = this.GetBulletSpawnOffset();

		if ( for_visuals && this._ragdoll )
		return -Math.PI / 2 - Math.atan2( this.y + offset.y - this._ragdoll._smooth_look_y, this.x + offset.x - this._ragdoll._smooth_look_x );
	
		return -Math.PI / 2 - Math.atan2( this.y + offset.y - this.look_y, this.x + offset.x - this.look_x );
	}
	
	ReloadAndCombatLogic( GSPEED )
	{
		if ( this._weapon_draw_timer > 0 )
		this._weapon_draw_timer = Math.max( 0, this._weapon_draw_timer - GSPEED );
	
		if ( this.weapon_stun_timer > 0 )
		this.weapon_stun_timer = Math.max( 0, this.weapon_stun_timer - GSPEED );
		
		if ( this._recoil > 0 )
		this._recoil = Math.max( 0, sdWorld.MorphWithTimeScale( this._recoil , -0.01, 0.935 , GSPEED ) ); //0.9 was "laser beams" basically and nullified the point for "Recoil upgrade"
		//this._recoil = Math.max( 0, sdWorld.MorphWithTimeScale( this._recoil , -0.01, 0.935 * this._recoil_mult , GSPEED ) ); //0.9 was "laser beams" basically and nullified the point for "Recoil upgrade"

		if ( this.fire_anim > 0 )
		this.fire_anim = Math.max( 0, this.fire_anim - GSPEED );

		if ( this._self_boost < 15 )
		if ( this.stands )
		this._self_boost = Math.min( 15, this._self_boost + GSPEED );


		let offset = null;
		
		for ( let i = 0; i < this._inventory.length; i++ )
		if ( this._inventory[ i ] )
		this._inventory[ i ].UpdateHeldPosition();

		if ( this.reload_anim > 0 )
		{
			let is_stimmed = false;
			let effects = sdStatusEffect.entity_to_status_effects.get( this );
			if ( effects !== undefined )
			for ( let i = 0; i < effects.length; i++ )
			{
				if ( effects[ i ].type === sdStatusEffect.TYPE_STIMPACK_EFFECT ) // Is the character under stimpack effect?
				is_stimmed = true; // Increase reload speed by 100% ( Compensation for slown down reload speed on high DPS weapons )
			}
			this.reload_anim -= GSPEED * ( ( is_stimmed ) ? 2 : 1 );

			if ( this.reload_anim <= 0 )
			{
				if ( this._inventory[ this.gun_slot ] )
				this._inventory[ this.gun_slot ].ReloadComplete();
			}
		}
		else
		{
			if ( !this.driver_of || this.driver_of.VehicleAllowsDriverCombat( this ) )
			if ( this._frozen <= 0 )
			{
				let will_throw_grenade = this._key_states.GetKey( 'KeyG' ) && ( this._upgrade_counters[ 'upgrade_grenades' ] );
				let will_fire = will_throw_grenade || this._key_states.GetKey( 'Mouse1' );
				
				let shoot_from_scenario = false;

				//if ( will_fire )
				//this._respawn_protection = 0;

				if ( this._weapon_draw_timer > 0 )
				will_fire = false;

				if ( this._auto_shoot_in > 0 )
				{
					this._auto_shoot_in -= GSPEED;
					if ( this._auto_shoot_in <= 0 )
					{
						will_fire = true;
						shoot_from_scenario = true;
					}
				}
				
				if ( this._respawn_protection > 0 )
				{
					will_throw_grenade = false;
					will_fire = false;
					shoot_from_scenario = false;
				}
			
				if ( this.weapon_stun_timer > 0 )
				{
					will_fire = false;
					will_throw_grenade = false;
				}

				if ( will_fire )
				if ( !will_throw_grenade )
				if ( this._inventory[ this.gun_slot ] )
				if ( !sdGun.classes[ this._inventory[ this.gun_slot ].class ] )
				{
					will_fire = false;

					switch ( ~~( Math.random() * 5 ) )
					{
						case 0: this.Say( 'This item does not work in this environment' ); break;
						case 1: this.Say( 'Maybe it is not a right place to use it' ); break;
						case 2: this.Say( 'This won\'t work here' ); break;
						case 3: this.Say( 'I don\'t think this item can be used there' ); break;
						case 4: this.Say( 'This item belongs to another realm' ); break;
					}
				}

				/*if ( will_fire )
				{
					if ( !this._inventory[ this.gun_slot ] || !sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_build_gun )
					if ( !sdArea.CheckPointDamageAllowed( this.x, this.y ) )
					if ( !this._god )
					{
						will_fire = false;

						switch ( ~~( Math.random() * 5 ) )
						{
							case 0: this.Say( 'This is a no-combat zone' ); break;
							case 1: this.Say( 'Combat is not allowed here' ); break;
							case 2: this.Say( 'This place is meant to be peaceful' ); break;
							case 3: this.Say( 'Combat is restricted in this area' ); break;
							case 4: this.Say( 'Admins have restricted combat in this area' ); break;
						}
					}
				}
				else*/
				this._last_fire_state = 0;

				if ( will_throw_grenade )
				{
					if ( sdWorld.is_server )
					if ( this.fire_anim <= 0 )
					{
						if ( this.matter >= 150 ) // Just like mine
						{
							this.fire_anim = 15;

							this.matter -= 150;

							let _class = sdGun.CLASS_THROWABLE_GRENADE;

							if ( !offset )
							offset = this.GetBulletSpawnOffset();

							let bullet_obj = new sdBullet({ x: this.x + offset.x, y: this.y + offset.y });
							bullet_obj._owner = this;

							let an = bullet_obj._owner.GetLookAngle();// + ( Math.random() * 2 - 1 ) * spread;

							let vel = 2.5;
							if ( sdGun.classes[ _class ].projectile_velocity )
							vel = sdGun.classes[ _class ].projectile_velocity;

							bullet_obj.sx = this.sx + Math.sin( an ) * vel;
							bullet_obj.sy = this.sy + Math.cos( an ) * vel;

							for ( var p in sdGun.classes[ _class ].projectile_properties )
							bullet_obj[ p ] = sdGun.classes[ _class ].projectile_properties[ p ];

							bullet_obj._armor_penetration_level = 0;

							sdEntity.entities.push( bullet_obj );
							
							sdSound.PlaySound({ name:'sword_attack2', x:this.x, y:this.y, volume: 0.5, pitch: 1 });
						}
						else
						{
							this.Say( sdWorld.GetAny([
								'Grenade costs 150 matter',
								'Out of matter'
							]));
						}
					}
				}
				else
				if ( this._inventory[ this.gun_slot ] )
				{
					if ( this._key_states.GetKey( 'KeyN' ) )
					{
						this._inventory[ this.gun_slot ].ChangeFireModeStart();
					}
					else
					if ( this._key_states.GetKey( 'KeyR' ) &&
						 this._inventory[ this.gun_slot ].ammo_left >= 0 && 
						 this._inventory[ this.gun_slot ].ammo_left < this._inventory[ this.gun_slot ].GetAmmoCapacity() )
					{
						this._inventory[ this.gun_slot ].ReloadStart();
					}
					else
					{

						if ( will_fire )
						{
							if ( this._inventory[ this.gun_slot ].fire_mode === 1 )
							{
								if ( !offset )
								offset = this.GetBulletSpawnOffset();
							
								if ( !this.stands )
								if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ] )
								if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_sword )
								{
									let boost_waste = sdWorld.limit( 0, this._self_boost, GSPEED );
									this._self_boost -= boost_waste;
									
									let an = this.GetLookAngle();
									
									boost_waste *= 0.2;

									this.sx += Math.sin( an ) * boost_waste;
									this.sy += Math.cos( an ) * boost_waste;
								}

								if ( this._inventory[ this.gun_slot ].Shoot( this._key_states.GetKey( 'ShiftLeft' ), offset, shoot_from_scenario ) )
								{
									this.fire_anim = 5;
								}
							}
							else
							if ( this._inventory[ this.gun_slot ].fire_mode === 2 && this._last_fire_state !== will_fire ) // Somehow this line caused crash, possible due to .Shoot call above caused weapon to be removed
							{
								if ( !offset )
								offset = this.GetBulletSpawnOffset();

								if ( this._inventory[ this.gun_slot ].Shoot( this._key_states.GetKey( 'ShiftLeft' ), offset, shoot_from_scenario ) )
								{
									this.fire_anim = 5;
									this._last_fire_state = will_fire;
								}
							}
						}
					}
				}
				else
				{
					if ( will_fire )
					{
						if ( this.fire_anim <= 0 )
						{
							this.fire_anim = 7.5;

							if ( sdWorld.is_server )
							{
								let _class = sdGun.CLASS_FISTS;

								if ( this.s >= 249 )
								_class = sdGun.CLASS_SWORD;

								if ( !offset )
								offset = this.GetBulletSpawnOffset();

								let bullet_obj = new sdBullet({ x: this.x + offset.x, y: this.y + offset.y });
								bullet_obj._owner = this;

								let an = bullet_obj._owner.GetLookAngle();// + ( Math.random() * 2 - 1 ) * spread;

								let vel = 16;
								if ( sdGun.classes[ _class ].projectile_velocity )
								vel = sdGun.classes[ _class ].projectile_velocity;

								bullet_obj.sx = Math.sin( an ) * vel;
								bullet_obj.sy = Math.cos( an ) * vel;

								for ( var p in sdGun.classes[ _class ].projectile_properties )
								bullet_obj[ p ] = sdGun.classes[ _class ].projectile_properties[ p ];

								bullet_obj._armor_penetration_level = 0;

								bullet_obj._damage *= ( this.s / 100 );

								bullet_obj.time_left *= ( this.s / 100 );

								if ( this.s >= 249 )
								bullet_obj._damage = 200; // Falkonian sword bot should be lethal at close range.

								sdEntity.entities.push( bullet_obj );
							}
						}
					}
				}
			}
		}
		

		// Patch for bugged guns. 
		if ( this._inventory[ this.gun_slot ] )
		if ( this._inventory[ this.gun_slot ]._is_being_removed )
		{
			console.warn( 'sdCharacter holds removed gun (slot '+this.gun_slot+'). Gun snapshot: ' + JSON.stringify( this._inventory[ this.gun_slot ].GetSnapshot( GetFrame(), true ) ) );

			if ( sdWorld.is_server )
			{
				if ( this._socket )
				this._socket.SDServiceMessage( 'Error: Your character holds gun that is already removed. Report if you know how this happened ~' );
			}

			this._inventory[ this.gun_slot ] = null;
		}
	}
	
	DropWeaponLogic( GSPEED )
	{
		if ( this._auto_shoot_in <= 0 )
		{
			if ( this._key_states.GetKey( 'KeyV' ) && !this.driver_of && this._frozen <= 0 )
			{
				this._key_states.SetKey( 'KeyV', 0, true ); // So sword is not dropped all the time

				if ( this._inventory[ this.gun_slot ] )
				{
					//if ( this.gun_slot === 0 )
					if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ] )
					if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_sword )
					{
						this._inventory[ this.gun_slot ].dangerous = true;
						this._inventory[ this.gun_slot ]._dangerous_from = this;

						if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound )
						sdSound.PlaySound({ name:sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound, x:this.x, y:this.y, volume: 0.5 * ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound_volume || 1 ), pitch: 0.8 * ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound_pitch || 1 ) });
					}

					this.DropWeapon( this.gun_slot );

					this.gun_slot = 0;
					if ( sdWorld.my_entity === this )
					sdWorld.PreventCharacterPropertySyncForAWhile( 'gun_slot' );

					if ( this.reload_anim > 0 )
					this.reload_anim = 0;

					this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
				}
			}
		}
	}

	WeaponSwitchLogic( GSPEED )
	{
		if ( this.weapon_stun_timer > 0 )
		return;
	
		if ( this._auto_shoot_in <= 0 )
		{
			if ( this._key_states.GetKey( 'KeyQ' ) )
			{
				if ( !this._q_held )
				{
					this._q_held = true;

					let b = this._backup_slot;
					if ( !this._inventory[ b ] )
					b = 0;

					this._backup_slot = this.gun_slot;
					this.gun_slot = b;
					if ( sdWorld.my_entity === this )
					sdWorld.PreventCharacterPropertySyncForAWhile( 'gun_slot' );

					if ( this.reload_anim > 0 )
					this.reload_anim = 0;

					this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
				}
			}
			else
			{
				this._q_held = false;
				for ( var i = 0; i < 10; i++ )
				if ( this._inventory[ i ] || i === 0 )
				if ( this._key_states.GetKey( 'Digit' + i ) || ( i === 0 && this._key_states.GetKey( 'Backquote' ) ) )
				{
					if ( this.gun_slot !== i )
					{
						this._backup_slot = this.gun_slot;
						this.gun_slot = i;
						if ( sdWorld.my_entity === this )
						sdWorld.PreventCharacterPropertySyncForAWhile( 'gun_slot' );

						if ( this.reload_anim > 0 )
						this.reload_anim = 0;

						this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
					}
					break;
				}
			}
		}
	}
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return ( this._key_states.GetKey('KeyX') || !!this.IsInSafeArea() ) ? sdCharacter.ignored_classes_when_holding_x : sdCharacter.ignored_classes_when_not_holding_x;
	}
	
	getRequiredEntities( observer_character )
	{
		let arr = [];
		
		for ( let i = 0; i < this._inventory.length; i++ )
		if ( this._inventory[ i ] )
		arr.push( this._inventory[ i ] );

		if ( this.driver_of )
		arr.push( this.driver_of );

		if ( this.carrying )
		if ( !this.carrying._is_being_removed )
		arr.push( this.carrying );
		
		return arr;
	}
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		//if ( !this.ghosting || this.carrying )
		//return true;
		
		if ( observer_character === this )
		return true;
		
		if ( this.driver_of )
		if ( !this.driver_of._is_being_removed )
		{
			if ( this.driver_of.VehicleHidesDrivers() )
			if ( !this.driver_of.IsVisible( observer_character ) )
			return false;
	
			if ( this.driver_of.ObfuscateAnyDriverInformation() )
			return false;
		}
		
		if ( this.carrying )
		return true;
	
		if ( !this.ghosting )
		return true;
	
		if ( observer_character )
		if ( observer_character.IsPlayerClass() )
		if ( observer_character._god )
		return true;
		
		//if ( !observer_character || !observer_character.is( sdCharacter ) )
		if ( !observer_character || typeof observer_character._socket === 'undefined' ) // Let player-controlled drones see players in NCZ
		if ( !sdArea.CheckPointDamageAllowed( this.x, this.y ) )
		return false;
	
		if ( this.flying || this.hea <= 0 || ( this.fire_anim > 0 && this.gun_slot !== 0 ) || this.pain_anim > 0 || this._auto_shoot_in > 0 || this.time_ef > 0 )
		return true;
	
		if ( observer_character )
		{
			let px = Math.max( observer_character.x + observer_character._hitbox_x1, Math.min( this.x, observer_character.x + observer_character._hitbox_x2 ) );
			let py = Math.max( observer_character.y + observer_character._hitbox_y1, Math.min( this.y, observer_character.y + observer_character._hitbox_y2 ) );
			
			if ( sdWorld.Dist2D( px, py, this.x, this.y ) < 16 )
			return true;
		}
		/*
		if ( observer_character )
		if ( sdWorld.GetComsNear( this.x, this.y, null, observer_character._net_id ).length > 0 )
		{
			return true;
		}
		*/
		return false;
	}
	
	AIWarnTeammates()
	{
		if ( !sdWorld.is_server )
		return;

		let teammates = sdWorld.GetAnythingNear( this.x, this.y, 200, null, [ 'sdCharacter' ] );
		for ( let i = 0; i < teammates.length; i++ )
		{
			if ( teammates[ i ].is( sdCharacter ) && teammates[ i ]._ai && teammates[ i ]._ai_team === this._ai_team  && teammates[ i ].hea > 0 )
			{
				if ( teammates[ i ].target ) // Check if teammate has a target already
				if ( teammates[ i ].target.GetClass() !== 'sdBlock' ) // Check if the target is a threat
				if ( sdWorld.CheckLineOfSight( teammates[ i ].x, teammates[ i ].y, teammates[ i ]._ai.target.x, teammates[ i ]._ai.target.y, teammates[ i ], sdCom.com_visibility_ignored_classes, null ) )
				return; // Does not switch target if a threat is in line of sight.
				else
				teammates[ i ]._ai.target = this._ai.target; // This works now since I forgot to change this._ai_target last time to this._ai.target
			}
		}
	
	}
	
	static GetRandomEntityNearby( from_entity ) // From sdOverlord but checks for classes for enemies instead of considering anything as a target ( from entity = from which entity you want to check potential target )
	{
		let an = Math.random() * Math.PI * 2;
		
		let ent_to_check_from = from_entity;
		
		if ( typeof from_entity.driver_of !== 'undefined' )
		if ( from_entity.driver_of )
		ent_to_check_from = from_entity.driver_of; // Allow AI to target if they are inside vehicles
		

		if ( !sdWorld.CheckLineOfSight( ent_to_check_from.x, ent_to_check_from.y, ent_to_check_from.x + Math.sin( an ) * 900, ent_to_check_from.y + Math.cos( an ) * 900, ent_to_check_from ) )
		if ( sdWorld.last_hit_entity )
		{
			if ( sdWorld.last_hit_entity._is_being_removed )
			return null;
			// Not sure why but last hit entity somehow became null mid this function, inside this block
		
			let potential_target = sdWorld.last_hit_entity;

		
			let found_enemy = false;
			//let array_of_enemies = sdCom.com_faction_attack_classes;
			if ( sdCom.com_faction_attack_classes.indexOf( potential_target.GetClass() ) !== -1 ) // If line of sight check found a potential target class inside that array
			{
				if ( typeof potential_target._ai_team !== 'undefined' ) // Does a potential target belong to a faction?
				{
					if ( potential_target._ai_team !== from_entity._ai_team ) // Is this not a friendly faction?
					found_enemy = true; // Target it
				}
				else
				found_enemy = true; // Target it
			}
		
			if ( potential_target.IsVehicle() )
			{
				if ( typeof potential_target.driver0 !== 'undefined' ) // Workbench might crash servers otherwise
				{
					if ( potential_target.driver0 )
					if ( potential_target.driver0._ai_team !== from_entity._ai_team )
					found_enemy = true;
				}

				if ( typeof potential_target.driver1 !== 'undefined' )
				{
					if ( potential_target.driver1 )
					if ( potential_target.driver1._ai_team !== from_entity._ai_team )
					found_enemy = true;
				}
				
				if ( typeof potential_target.driver2 !== 'undefined' )
				{
					if ( potential_target.driver2 )
					if ( potential_target.driver2._ai_team !== from_entity._ai_team )
					found_enemy = true;
				}
				
				if ( typeof potential_target.driver3 !== 'undefined' )
				{
					if ( potential_target.driver3 )
					if ( potential_target.driver3._ai_team !== from_entity._ai_team )
					found_enemy = true;
				}
				
				if ( typeof potential_target.driver4 !== 'undefined' )
				{
					if ( potential_target.driver4 )
					if ( potential_target.driver4._ai_team !== from_entity._ai_team )
					found_enemy = true;
				}
				
				if ( typeof potential_target.driver5 !== 'undefined' )
				{
					if ( potential_target.driver5 )
					if ( potential_target.driver5._ai_team !== from_entity._ai_team )
					found_enemy = true;
				}
			}
			// Entities outside sdCom.faction_attack_classes
			if (	( potential_target.GetClass() === 'sdBomb' && sdWorld.inDist2D_Boolean( potential_target.x, potential_target.y, from_entity.x, from_entity.y, 150 ) ) ||
					( potential_target.GetClass() === 'sdBarrel' && sdWorld.inDist2D_Boolean( potential_target.x, potential_target.y, from_entity.x, from_entity.y, 150 ) && potential_target.armed < 100 ) // Attack not yet armed barrels (for Councils?)
			) 
			found_enemy = true;

			if ( potential_target.GetClass() === 'sdBlock' && from_entity._ai_team !== 0 )
			if ( potential_target.material === sdBlock.MATERIAL_WALL || 
					potential_target.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ||
					potential_target.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 ||
					potential_target.material === sdBlock.MATERIAL_SHARP ) // Attack player built walls
			if ( potential_target._ai_team === 0 ) // Don't attack if it's own faction outpost walls
			found_enemy = true;

			if ( potential_target.is( sdCube ) ) // Only confront cubes when they want to attack AI
			if ( from_entity._nature_damage >= from_entity._player_damage + 60 )
			found_enemy = true;

			if ( found_enemy === true )
			{
				// I have no clue how game found sdWorld.last_hit_entity to be null here since to even reach this part - sdWorld.last_hit_entity needs to exist ( Line 1825 ). Hopefully swapping to let potential_target could prevent this crash. - Booraz149
				if ( potential_target.IsTargetable( from_entity ) && potential_target.IsVisible( from_entity ) )
				return potential_target;
			}
		}
		return null;
	}

	GetBehaviourAgainstTarget() // AI has specific ways to fight specific mobs sometimes, like running away from worms, octopus, quickies and virus.
	{
		if ( this._ai_team === 1 ) // Is it falkok team?
		if ( this.title === 'Falkonian Sword Bot' ) // Is it the falkonian sword bot?
		return sdCharacter.AI_MODEL_AGGRESSIVE; // It is a robot and it is large, it does not fear.

		if ( this._ai.target.GetClass() === 'sdOctopus' || this._ai.target.GetClass() === 'sdAmphid' || this._ai.target.GetClass() === 'sdSandWorm' || this._ai.target.GetClass() === 'sdQuickie' || 
			 this._ai.target.GetClass() === 'sdVirus' || this._ai.target.GetClass() === 'sdTutel' || this._ai.target.GetClass() === 'sdBiter' || this._ai.target.GetClass() === 'sdAbomination' || 
			 this._ai.target.GetClass() === 'sdBomb' || this._ai.target.GetClass() === 'sdBarrel' )
		return sdCharacter.AI_MODEL_DISTANT;


		if ( this._ai.target.GetClass() === 'sdBlock' )
		if ( this._ai.target.material === sdBlock.MATERIAL_WALL || 
				this._ai.target.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ||
				this._ai.target.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
		return sdCharacter.AI_MODEL_AGGRESSIVE;
		

		return this._init_ai_model; // Return to normal behaviour against other mobs
	}
	
	AITargetBlocks() // Targets first "GetAnythingNear" sdBlock.
	{
		if ( !sdWorld.is_server )
		return;

		if ( this._ai.target )
		if ( !this._ai.target.is( sdBlock ) ) // Check if the target is a threat
		if ( sdWorld.CheckLineOfSight( this.x, this.y, this._ai.target.x, this._ai.target.y, this, sdCom.com_visibility_ignored_classes, null ) )
		return; // Does not target blocks if a threat is in line of sight.

		let targets = sdWorld.GetAnythingNear( this.x, this.y + 12, 32, null, [ 'sdBlock' ] );
		sdWorld.shuffleArray( targets );
		for ( let i = 0; i < targets.length; i++ )
		{
			if ( targets[ i ].is( sdBlock ) )
			if ( targets[ i ]._natural || targets[ i ]._ai_team !== this._ai_team )
			{
				this._ai.target = targets[ i ];
				return;
			}
		}
		this._ai.direction = -this._ai.direction; // Change direction if no suitable blocks are found
	}

	InstallUpgrade( upgrade_name, quick_start = false ) // Ignores upper limit condition. Upgrades better be revertable and resistent to multiple calls within same level as new level
	{ // Quick start ignores upgrade station requirement, so /qs gives all upgrades and levels
		if ( ( sdShop.upgrades[ upgrade_name ].max_with_upgrade_station_level || 0 ) === 0 )
		{
			if ( ( this._upgrade_counters[ upgrade_name ] || 0 ) + 1 > sdShop.upgrades[ upgrade_name ].max_level )
			{
				this._upgrade_counters[ upgrade_name ] = sdShop.upgrades[ upgrade_name ].max_level; // Reset the upgrade, just in case
				sdShop.upgrades[ upgrade_name ].action( this, this._upgrade_counters[ upgrade_name ] );
		
				if ( this._socket )
				this._socket.emit( 'UPGRADE_SET', [ upgrade_name, this._upgrade_counters[ upgrade_name ] ] );
				return;
			}
		}
		else
		{
			if ( ( this.GetUpgradeStationLevel() < ( sdShop.upgrades[ upgrade_name ].min_upgrade_station_level || 0 ) ) && ( ( this._upgrade_counters[ upgrade_name ] || 0 ) + 1 > sdShop.upgrades[ upgrade_name ].max_level ) && !quick_start ) // Can't upgrade without the station level
			return;
			else
			{
				if ( ( this._upgrade_counters[ upgrade_name ] || 0 ) + 1 > sdShop.upgrades[ upgrade_name ].max_with_upgrade_station_level ) // Don't go beyond the limit
				{
					this._upgrade_counters[ upgrade_name ] = sdShop.upgrades[ upgrade_name ].max_with_upgrade_station_level; // Reset the upgrade, just in case
					sdShop.upgrades[ upgrade_name ].action( this, this._upgrade_counters[ upgrade_name ] );
		
					if ( this._socket )
					this._socket.emit( 'UPGRADE_SET', [ upgrade_name, this._upgrade_counters[ upgrade_name ] ] );
					return;
				}
			}
	
		}
		
		
		var upgrade_obj = sdShop.upgrades[ upgrade_name ];
		
		let max_level = ( upgrade_obj.max_with_upgrade_station_level || upgrade_obj.max_level ); // Sets value to either max value with upgrade station or max level
		
		if ( typeof this._upgrade_counters[ upgrade_name ] === 'undefined' )
		this._upgrade_counters[ upgrade_name ] = 1;
		else
		this._upgrade_counters[ upgrade_name ] = Math.min( this._upgrade_counters[ upgrade_name ] + 1, max_level ); // Prevent max level exceeding
	
		upgrade_obj.action( this, this._upgrade_counters[ upgrade_name ] );
		
		if ( this._socket )
		this._socket.emit( 'UPGRADE_SET', [ upgrade_name, this._upgrade_counters[ upgrade_name ] ] );
	}

	UninstallUpgrade( upgrade_name ) // Ignores lower limit condition. Upgrades better be revertable and resistent to multiple calls within same level as new level
	{
		if ( ( this._upgrade_counters[ upgrade_name ] || 0 ) - 1 < 0 )
		{
			return;
		}
		
		
		
		
		var upgrade_obj = sdShop.upgrades[ upgrade_name ];
		
		let max_level = ( upgrade_obj.max_with_upgrade_station_level || upgrade_obj.max_level ); // Used to reduce value if beyond max level
		
		if ( typeof this._upgrade_counters[ upgrade_name ] === 'undefined' )
		this._upgrade_counters[ upgrade_name ] = 0;
		else
		{
			if ( this._upgrade_counters[ upgrade_name ] > max_level )
			this._upgrade_counters[ upgrade_name ] = max_level;
			this._upgrade_counters[ upgrade_name ] = Math.max( this._upgrade_counters[ upgrade_name ] - 1, 0 );
		}
	
		upgrade_obj.reverse_action( this, this._upgrade_counters[ upgrade_name ] );
		
		if ( this._socket )
		this._socket.emit( 'UPGRADE_SET', [ upgrade_name, this._upgrade_counters[ upgrade_name ] ] );
	}
	/*get hitbox_x1() { return this.s / 100 * ( this.death_anim < 10 ? -5 : -5 ); } // 7
	get hitbox_x2() { return this.s / 100 * ( this.death_anim < 10 ? 5 : 5 ); }
	get hitbox_y1() { return this.s / 100 * ( this.death_anim < 10 ? -12 : 10 ); }
	get hitbox_y2() { return this.s / 100 * ( this.death_anim < 10 ? ( ( 16 - this._crouch_intens * 6 ) ) : 16 ); }*/
	
	get hitbox_x1() { return this.s / 100 * ( -5 ); }
	get hitbox_x2() { return this.s / 100 * ( 5 ); }
	get hitbox_y1() 
	{ 
		let death_morph = Math.max( 0, Math.min( 1, this.death_anim / 10 ) );
		
		return this.s / 100 * ( ( -12 + this._crouch_intens * 6 ) * ( 1 - death_morph ) + death_morph * 10 ); 
	}
	get hitbox_y2() { return this.s / 100 * ( 16 ); }

	get hard_collision() // For world geometry where players can walk
	{
		return ( ( !this.driver_of || !this.driver_of.VehicleHidesDrivers() ) && this.death_anim < 10 ); 
	}
	//{ return ( this.death_anim < 20 && !this.driver_of ); }
	
	GetVoicePitch()
	{
		let v = this._voice.pitch / 50;
		
		if ( v >= 1 )
		return ( v + 1 * 3 ) / 4;
	
		
		return ( v + 1 * 6 ) / 7;
	}
	Impact( vel, initiator=null ) // fall damage basically
	{
		//if ( vel > 7 )
		if ( vel > 6.5 ) // For new mass-based model
		{
			/*if ( sdWorld.is_server )
			if ( this._socket )
			{
				debugger;
			}*/
			
			//this.DamageWithEffect( ( vel - 4 ) * 15 );
			this.DamageWithEffect( ( vel - 3 ) * 17, initiator, false, false );
			
			this.DamageStability( vel * sdCharacter.stability_damage_from_velocity_changes_scale );
		}
	}
	AttemptTeleportOut( from_ent=null, lost_effect=false, assumed_health_after_damage=0 )
	{
		if ( from_ent )
		if ( from_ent._is_being_removed )
		from_ent = null;

		if ( !sdWorld.server_config.allow_rescue_teleports )
		{
			return false;
		}

		/*let tele_cost = sdRescueTeleport.max_matter;
		
		if ( !this.is( sdCharacter ) )
		tele_cost = 100;*/

		let best_di = Infinity;
		let best_cost = Infinity;
		let best_t = null;

		for ( var i = 0; i < sdRescueTeleport.rescue_teleports.length; i++ )
		{
			let t = sdRescueTeleport.rescue_teleports[ i ];

			let close_enough = true;

			/*let tele_cost = t.type === sdRescueTeleport.TYPE_INFINITE_RANGE ? sdRescueTeleport.max_matter : sdRescueTeleport.max_matter_short; // Needed so short range RTPs work

			if ( !this.is( sdCharacter ) )
			tele_cost = 100;
			*/
			let tele_cost = t.GetRTPMatterCost( this );

			let rtp_range = t.GetRTPRange( this );
			
			if ( rtp_range === Infinity )
			{
			}
			else
			{
				if ( !sdWorld.inDist2D_Boolean( this.x, this.y, t.x, t.y, rtp_range ) )
				close_enough = false;
			}
			/*if ( sdRescueTeleport.rescue_teleports[ i ].type === sdRescueTeleport.TYPE_SHORT_RANGE )
			{
				let di = sdWorld.Dist2D( this.x, this.y, t.x, t.y );
				if ( di > sdRescueTeleport.max_short_range_distance ) // 1200 units
				close_enough = false;
			}*/
			
			if ( t.allowed )
			if ( !lost_effect || t.IsCloner() )
			if ( close_enough )
			if ( t._owner === this || t.owner_biometry === this.biometry )
			//if ( t.owner_biometry === this.biometry )
			if ( t.delay <= 0 )
			if ( t.matter >= t._matter_max ) // Fully charged
			if ( t.matter >= tele_cost ) // Has enough matter for this kind of teleport out
			if ( !t._is_being_removed )
			//if ( this.CanMoveWithoutOverlap( t.x, t.y + t._hitbox_y1 - this._hitbox_y2 - 1, 0 ) && sdWorld.CheckLineOfSight( t.x - t._hitbox_x1, t.y + t._hitbox_y1 - this._hitbox_y2 - 1, t.x + t._hitbox_x1, t.y + t._hitbox_y1 - this._hitbox_y2 - 12, this ) ) // Make sure it isn't blocked by anything
			//if ( sdWorld.CheckLineOfSight( t.x - t._hitbox_x1, t.y + t._hitbox_y1 - this._hitbox_y2 - 1, t.x + t._hitbox_x1, t.y + t._hitbox_y1 - this._hitbox_y2 - 12, t, null, sdCom.com_vision_blocking_classes ) ) // Could be better. Should allow cases of storages and crystals on top of RTP
			if ( t.GetRTPPotentialPlayerPlacementTestResult( this ) )
			{
				let di = sdWorld.Dist2D( this.x, this.y, t.x, t.y );
				if ( 
						( di < best_di && tele_cost <= best_cost ) 
						||
						tele_cost < best_cost 
				   )
				{
					best_t = t;
					best_di = di;
					best_cost = tele_cost;
				}
			}
		}

		if ( best_t )
		{
			if ( this.carrying )
			this.DropCrystal( this.carrying );
			
			if ( this.driver_of )
			{
				this.driver_of.ExcludeDriver( this, true );
			}
			
			let is_cloner = best_t.IsCloner();
			
			this._auto_shoot_in = 0; // Cancel lost particle converter-like guns from being shot
			
			// Create temporary copy just for visuals
			//let copy_ent = new sdCharacter({ x:this.x, y:this.y });
			let copy_ent = new sdWorld.entity_classes[ this.GetClass() ]({ x:this.x, y:this.y });
			sdEntity.entities.push( copy_ent );
			copy_ent.ApplySnapshot( this.GetSnapshot( 0, true, null ) );
			copy_ent.hea = Math.min( copy_ent.hea, -1 );
			copy_ent.stability = 0;
			copy_ent._ai_enabled = sdCharacter.AI_MODEL_DUMMY_UNREVIVABLE_ENEMY;
			copy_ent._god = false;
			copy_ent._socket = null;
			copy_ent._my_hash = undefined;
			copy_ent.matter = 0;
			copy_ent.biometry = -2;
			
			//copy_ent.death_anim = sdCharacter.disowned_body_ttl - 2480 / 1000 * 30; // Vanishing opacity
			copy_ent.death_anim = 0;
			
			sdWorld.SendEffect({
									x: this.x,
									y: this.y,
									f: this._net_id,
									t: copy_ent._net_id
								}, 'COPY_RAGDOLL_POSE' );
								
						
			if ( this.hook_relative_to )
			{
				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:1, pitch:2 });
				this.hook_relative_to = null;
				this.hook_len = -1;
			}

			this.x = best_t.x;
			this.y = best_t.y + best_t._hitbox_y1 - this._hitbox_y2;
			
			let stack = globalThis.getStackTrace();
			let x_expected = this.x;
			let y_expected = this.y;

			this.sx = 0;
			this.sy = 0;
			
			this._dying = false;
			
			this.death_anim = 0;

			this.hea = Math.max( this.hea, 30 );
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			this._sickness = 0;
			this._frozen = 0; // For some reason does not always happen...
			
			for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
			if ( sdBaseShieldingUnit.all_shield_units[ i ]._revenge_target === this )
			sdBaseShieldingUnit.all_shield_units[ i ]._revenge_target = null;
	
			
			this.stability = 100;
			
			this._respawn_protection = 30;
			
			if ( !is_cloner )
			{
				sdSound.PlaySound({ name:'rescue_teleport_fake_death2', x:copy_ent.x, y:copy_ent.y, volume:2 });

				let new_sd_filter_s = '';

				let reference_sd_filter = copy_ent.sd_filter || sdWorld.CreateSDFilter();

				while ( new_sd_filter_s.length < reference_sd_filter.s.length )
				{
					new_sd_filter_s += reference_sd_filter.s.substring( new_sd_filter_s.length, new_sd_filter_s.length + 6 );
					new_sd_filter_s += 'ffffff';
				}

				copy_ent.sd_filter = { s: new_sd_filter_s };
				
				setTimeout(()=>
				{
					copy_ent.remove();
				}, 2480 );
				
				sdSound.PlaySound({ name:'teleport', x:best_t.x, y:best_t.y, volume:0.5 });
				
				sdWorld.SendEffect({ x:this.x + (this.hitbox_x1+this.hitbox_x2)/2, y:this.y + (this.hitbox_y1+this.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });
			}
			else
			{
				if ( !lost_effect )
				{
					let voice_preset = sdCharacter.voice_sound_effects[ this._voice.variant ] || sdCharacter.voice_sound_effects[ 'default' ];
					
					let result = null;
					
					if ( assumed_health_after_damage < -100 && voice_preset.death_scream )
					result = ( voice_preset.death_scream instanceof Array ) ? 
								sdWorld.AnyOf( voice_preset.death_scream ) :
								voice_preset.death_scream();
					else
					if ( voice_preset.death )
					result = ( voice_preset.death instanceof Array ) ? 
								sdWorld.AnyOf( voice_preset.death ) :
								voice_preset.death();
						
					if ( result )
					sdSound.PlaySound({ name:result, x:this.x, y:this.y, volume:voice_preset.volume || 1, pitch:voice_preset.pitch || this.GetVoicePitch(), channel:this._voice_channel });
				
					this.DropWeapons();
				}
				
				// After dropping the weapons, it should have only one weapon remaining if player should LRTP one to mothership
				// In the case of "Lost damage", it will save one weapon before removing them all anyway
				if ( sdWorld.server_config.keep_favourite_weapon_on_death && !this._ai_enabled )
				{
					// Attempt saving the weapon to LRTP, instead of dropping it
					let slot = this.GetFavouriteEquippedSlot();
					if ( this._inventory[ slot ] )
					{
						this._inventory[ slot ].ttl = sdGun.disowned_guns_ttl;
						this._inventory[ slot ]._held_by = null;
						this._inventory[ slot ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
									
						if ( this.AttemptWeaponSaving( this._inventory[ slot ] ) || lost_effect )
						this._inventory[ slot ].remove();
						// else
						this._inventory[ slot ] = null;
						// If it doesn't save the weapon, it will probably just end up being dropped
					}
				}
				
				if ( best_t.IsVehicle() )
				best_t.AddDriver( this, true );
			
				best_t.onRescued( this );
			}
			
			
			sdStatusEffect.PerformActionOnStatusEffectsOf( this, ( status_effect )=>
			{
				if ( sdStatusEffect.types[ status_effect.type ] )
				if ( sdStatusEffect.types[ status_effect.type ].remove_on_rescue_teleport_use )
				status_effect.remove();
			});
			
			best_t.SetDelay( sdRescueTeleport.delay_simple );
																			
			let tele_cost = best_t.GetRTPMatterCost( this );
		
			if ( !is_cloner ) // Cloners lose matter over time
			best_t.matter -= tele_cost;
			
			best_t.WakeUpMatterSources();
			
			//best_t._rescuing_from_lost_effect = lost_effect; Always true now
			
			if ( lost_effect )
			{
				for ( var i = 0; i < this._inventory.length; i++ )
				{
					let gun = this._inventory[ i ];
					if ( gun )
					{
						this.DropWeapon( i );
						gun.remove();
					}
				}
				
				this._nature_damage = 0;
				this._player_damage = 0;
			}
			
			
			this.ApplyServerSidePositionAndVelocity( true, 0, 0 );
			
			// Detect improper movement while RTP-ing
			setTimeout( ()=>
			{
				if ( Math.abs( this.x - x_expected ) > 100 ||
					 Math.abs( this.y - y_expected ) > 100 )
				{
					console.warn( 'Found offset shift right after RTP call (offset: '+(this.x - x_expected)+', '+( this.y - y_expected )+'). Callstack of this happy event is following: ' + stack );
				}
			}, 0 );
			
			if ( !lost_effect )
			setTimeout( ()=>
			{
				if ( this.hea > 0 )
				this.Say( [ 
					'Ok then', 
					'That was close', 
					'I live... Again!', 
					from_ent ? 'Almost died from '+from_ent.GetClass() : 'Almost died', 
					'I guess I live for now', 
					'I\'d need more of these', 
					'I wasn\'t welcomed there very well', 
					'I\'m not saying farewell',
					from_ent ? 'Not today, '+from_ent.GetClass()+'!' : 'Not today, Death!',
					'Well',
					'I\'m out',
					'Saved',
					'I have too much to lose!',
					'Mistakes do not define us. What defines us is how many rescue teleports we have.',
					'Still kicking',
					from_ent ? 'I won\'t miss you, '+from_ent.GetClass() : 'I won\'t miss that',
					'Imagine dying',
					'Thanks, but I\'d like to die another day!',
					'Dying is cringe',
					'How about not?',
					'Not like this!'
				][ ~~( Math.random() * 21 ) ] );
			}, 2000 );

			return true;
		}
		return false;
	}
	GetFavouriteEquippedSlot()
	{
		// Finds/returns value of the slot of a weapon that is the best option to save into storage before dying/cloner/etc
		if ( !this._ai_enabled ) //  Make sure it only attempts for players
		{
			let weapon_to_keep = -1;
			let max_dps = 0;
			let biometry = -1;
			for ( var i = 0; i < this._inventory.length; i++ ) // Determine which weapon to keep by checking biometry, DPS
			{
				if ( this._inventory[ i ] )
				{
					if ( this._inventory[ i ].IsGunRecoverable() && this._inventory[ i ].biometry_lock === this.biometry ) // Make sure it is not a "Lost effect damage" weapon
					if ( max_dps === 0 || max_dps < this._inventory[ i ]._max_dps )
					{
						max_dps = this._inventory[ i ]._max_dps || 1;
						weapon_to_keep = i;
						biometry = this._inventory[ i ].biometry_lock;
					}
				}
			}
			if ( biometry === -1 ) // No weapon with biometry equal to player was found? Try saving weapon without biometry and max DPS then
			for ( i = 0; i < this._inventory.length; i++ ) // Determine which weapon to keep
			{
				if ( this._inventory[ i ] )
				{
					if ( this._inventory[ i ].IsGunRecoverable() && this._inventory[ i ].biometry_lock === -1 ) // Make sure it is not a "Lost effect damage" weapon
					if ( max_dps === 0 || max_dps < this._inventory[ i ]._max_dps )
					{
						max_dps = this._inventory[ i ]._max_dps || 1;
						weapon_to_keep = i;
					}
				}
			}
			return weapon_to_keep;
		}
		else
		return -1;
	}
	AttemptWeaponSaving( gun = null )
	{
		if ( !sdWorld.is_server )
		return false;
	
		if ( !gun )
		return false;
	
		if ( !gun.IsGunRecoverable() ) // Just in case
		return false;
		
		gun.biometry_lock = -1; // Reset biometry, since it only saves weapons without biometry or same as dying player
	
		let saved_weapon = false;
	
		let current_frame = globalThis.GetFrame();
		let snapshot = [];
		console.log( gun.title );
		snapshot.push( gun.GetSnapshot( current_frame, true ) );
		//console.log( gun );			
		//if ( collected_entities_array.length === 0 )
		//executer_socket.SDServiceMessage( 'Nothing was saved' );
		//else
		if ( snapshot.length > 0 )
		{
			sdDatabase.Exec( 
				[ 
					[ 'DBManageSavedItems', this._my_hash, 'SAVE', 'Recovered weapon', snapshot, gun.x, gun.y + 12, true ] 
				], 
				( responses )=>
				{
					// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server
					for ( let i = 0; i < responses.length; i++ )
					{
						let response = responses[ i ];
															
						if ( response[ 0 ] === 'DENY_WITH_SERVICE_MESSAGE' )
						{
							console.log( 'Failed' );
							//executer_socket.SDServiceMessage( response[ 1 ] );
							//this.InsertEntitiesOnTop( snapshot, this_x, this_y );
						}
						else
						if ( response[ 0 ] === 'SUCCESS' )
						{
							saved_weapon = true;
							console.log( 'Success' );
							//executer_socket.SDServiceMessage( 'Success!' );
							//executer_socket.CommandFromEntityClass( sdLongRangeTeleport, 'LIST_UPDATE_IF_TRACKING', [] ); // class, command_name, parameters_array
						}
					}
				},
				'localhost'
			);
		}
		
		return saved_weapon;
	}
	
	RemoveArmor()
	{
		this.armor = 0;
		this.armor_max = 0;
		//this._armor_absorb_perc = 0;
		//this.armor_speed_reduction = 0; 
		//this._armor_repair_amount = 0; // Completely broken armor cannot be repaired
	}
	ApplyArmor( params )
	{
		params.armor = params.armor || 100;
		params._armor_absorb_perc = params._armor_absorb_perc || 0;
		params.armor_speed_reduction = params.armor_speed_reduction || 0;
		
		// Make sure it is better by all stats only
		if ( params.armor >= this.armor_max )
		if ( params._armor_absorb_perc >= this._armor_absorb_perc || this.armor_max === 0 )
		//if ( params.armor_speed_reduction <= this.armor_speed_reduction * 2 || this.armor_max === 0 )
		if ( ( 1 - this._armor_absorb_perc ) * this.armor < ( 1 - params._armor_absorb_perc ) * params.armor )
		{
			this.armor = params.armor;
			this.armor_max = params.armor;
			this._armor_absorb_perc = params._armor_absorb_perc; // 0..1 * 100% damage reduction
			this.armor_speed_reduction = params.armor_speed_reduction; // Armor speed reduction, 5% for medium armor
			
			if ( this._socket ) 
			sdSound.PlaySound({ name:'armor_pickup', x:this.x, y:this.y, volume:1, pitch: 1.5 - this._armor_absorb_perc * 1 }, [ this._socket ] );
		
			return true;
		}
		return false;
	}
	ApplyArmorRegen( regen_strength )
	{
		if ( this.armor > 0 )
		if ( this._armor_repair_amount < regen_strength )
		{
			this._armor_repair_amount = regen_strength;

			if ( this._socket ) 
			sdSound.PlaySound({ name:'armor_pickup', x:this.x, y:this.y, volume:0.5, pitch:1.75 }, [ this._socket ] );
		
			return true;
		}
		return false;
	}
	AICheckInitiator( initiator ) // Targetting logic when AI is hit is now stored here - to simplify vehicle Targetting
	{
			if ( typeof initiator._ai_team !== 'undefined' )
			{
				if ( this._voice.variant !== 'clone' ) // Clones
				if ( initiator._ai_team !== this._ai_team || Math.random() < 0.15 ) // 15% chance to return friendly fire, 25% was too chaotic
				{
					if ( !this._ai.target )
					this.PlayAIAlertedSound( initiator );
							
					this._ai.target = initiator;
							
							
					if ( Math.random() < 0.3 ) // 30% chance
					this.AIWarnTeammates();
				}
			}
			else // No faction?
			{
				if ( !this._ai.target )
				this.PlayAIAlertedSound( initiator );
							
				this._ai.target = initiator;
							
							
				if ( Math.random() < 0.3 ) // 30% chance
				this.AIWarnTeammates();
			}
	}
	Damage( dmg, initiator=null, headshot=false, affects_armor=true )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._god )
		if ( this._socket ) // No disconnected gods
		if ( dmg > 0 )
		return;
	
		// Shield logic, add to other entities if they will use shields
		// Also import sdBubbleShield if it's not imported
		/*let shielded_by = sdBubbleShield.CheckIfEntityHasShield( this );
		if ( shielded_by && dmg > 0 )
		if ( shielded_by.hea > 0 )
		{
			shielded_by.Damage( dmg, initiator );
			return;
		}*/
		if ( sdBubbleShield.DidShieldProtectFromDamage( this, dmg, initiator ) )
		return;
		
		// No healing for frozen players - prevent cube & freezing turret traps
		if ( this._frozen > 0 )
		dmg = Math.abs( dmg );
		
		dmg /= this.s / 100;
		
		// For onDamage logic that exists in default config
		if ( initiator && initiator._is_being_removed )
		initiator = null;
	
		if ( initiator === this )
		initiator = null;
	
		if ( dmg > 0 )
		if ( initiator && initiator !== this && ( initiator.cc_id !== this.cc_id || this.cc_id === 0 ) ) // Allow PvP damage scale for non-teammates only
		if ( ( this._my_hash !== undefined || this._socket ) && 
		( initiator._my_hash !== undefined || initiator._socket ) ) // Both are real players or at least test dummie from the shop
		if ( this.is( sdCharacter ) && initiator.is( sdCharacter ) ) // Only for characters... So it won't make drones/Overlords overpowered
		{
			dmg *= sdWorld.server_config.player_vs_player_damage_scale;
		}
			
		let was_alive = ( this.hea > 0 );
	
		//for ( var i = 0; i < this._listeners.DAMAGE.length; i++ )
		//this._listeners.DAMAGE[ i ]( this, dmg, initiator );
		this.callEventListener( 'DAMAGE', this, dmg, initiator );
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		if ( this._respawn_protection > 0 )
		return;
	
		if ( dmg > 0 )
		{
			if ( was_alive )
			{
				if ( this._ai )
				{
					if ( initiator )
					this.AICheckInitiator( initiator ); // Check if damage initiator is an enemy
				}
				else
				{
					if ( sdWorld.server_config.onDamage )
					sdWorld.server_config.onDamage( this, initiator, dmg, headshot );
				
					//if ( initiator )
					//if ( initiator.is( sdCharacter ) )
					//if ( initiator._socket )
					//{
						//if ( sdWorld.server_config.onDamage )
						//sdWorld.server_config.onDamage( this, initiator, dmg, headshot );
						/*
						if ( sdWorld.time >= this._non_innocent_until ) // Check if victim is innocent
						initiator._non_innocent_until = sdWorld.time + 1000 * 30;
						*/
					//}
				}
			}


			let damage_to_deal = dmg;
			
			/*if ( this.armor <= 0 || affects_armor === false ) // No armor
			{
				this.hea -= dmg;
			}
			else
			{
				this.hea -= ( dmg * ( 1 - this._armor_absorb_perc ) );
				
				this.armor -= ( dmg * this._armor_absorb_perc );
				
				if ( this.armor <= 0 )
				{
					this.RemoveArmor();
				}
			}*/
			
			//console.log( 'Initial damage to receive: ' + damage_to_deal );
			
			if ( this.armor <= 0 || affects_armor === false )
			{
			}
			else
			{
				if ( this.armor > ( damage_to_deal * this._armor_absorb_perc ) )
				{
					// Enough armor
					this.armor -= ( damage_to_deal * this._armor_absorb_perc );
					damage_to_deal = ( damage_to_deal * ( 1 - this._armor_absorb_perc ) );
				}
				else
				{
					// Not enough armor, will be broken and remaining damage calculcated as usually
					let armored_percentage = this.armor / ( damage_to_deal * this._armor_absorb_perc );
					
					if ( armored_percentage < 0 || armored_percentage > 1 )
					throw new Error( 'Armor logic error, armored_percentage must be within 0..1, but instead got ' + armored_percentage );
					
					this.armor -= ( damage_to_deal * this._armor_absorb_perc ) * armored_percentage;
					damage_to_deal = ( damage_to_deal * ( 1 - this._armor_absorb_perc ) ) * armored_percentage + damage_to_deal * ( 1 - armored_percentage );
					
					if ( Math.abs( this.armor ) > 0.001 )
					throw new Error( 'Armor logic error, remaining armor must be 0 after damage dealt that is above armor capacity, but instead got ' + this.armor );
				
					if ( damage_to_deal > dmg )
					throw new Error( 'Armor logic error, hitpoints damage increased after armor was applied damage_to_deal > dmg === ' + damage_to_deal + ' > ' + dmg );

					if ( damage_to_deal < 0 )
					throw new Error( 'Armor logic error, hitpoints damage is negative damage_to_deal === ' + damage_to_deal );

					sdSound.PlaySound({ name:'armor_break', x:this.x, y:this.y, volume:1, pitch: 1.5 - this._armor_absorb_perc * 1 } );

					for ( let i = 0; i < 5; i++ )
					{
						let a = Math.random() * 2 * Math.PI;
						let s = Math.random() * 2;

						let k = Math.random();

						let x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
						let y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );

						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
					}
					
					this.RemoveArmor();
				}
			}
			
			//console.log( 'Final HP damage to receive: ' + damage_to_deal );
			
			if ( was_alive )
			if ( this.hea - damage_to_deal <= 0 )
			{
				if ( this.AttemptTeleportOut( initiator, false, this.hea - damage_to_deal ) )
				return;
			}
			if ( this._ai_team === 10 && this.hea - damage_to_deal <= 0 ) // Time shifters aren't supposed to die ( prevent barrel/bomb/whatever cheesing )
			{
				this.hea = 1;
				this._dying = false;
			}
			else
			this.hea -= damage_to_deal;
			this.DamageStability( damage_to_deal * sdCharacter.stability_damage_from_damage_scale );
			
			if ( this.hea <= 0 && was_alive )
			{
				if ( this.carrying )
				this.DropCrystal( this.carrying );
		
				let voice_preset = sdCharacter.voice_sound_effects[ this._voice.variant ] || sdCharacter.voice_sound_effects[ 'default' ];
				
				if ( this.hea < -100 && voice_preset.death_scream )
				{
					let result = 
							( voice_preset.death_scream instanceof Array ) ? 
								sdWorld.AnyOf( voice_preset.death_scream ) :
								voice_preset.death_scream();
						
					if ( result )
					sdSound.PlaySound({ name:result, x:this.x, y:this.y, volume:voice_preset.volume || 1, pitch:voice_preset.pitch || this.GetVoicePitch(), channel:this._voice_channel });
				}
				else
				if ( voice_preset.death )
				{
					let result = 
							( voice_preset.death instanceof Array ) ? 
								sdWorld.AnyOf( voice_preset.death ) :
								voice_preset.death();
						
					if ( result )
					sdSound.PlaySound({ name:result, x:this.x, y:this.y, volume:voice_preset.volume || 1, pitch:voice_preset.pitch || this.GetVoicePitch(), channel:this._voice_channel });
				}
				else
				if ( voice_preset.death_tts )
				{
					let result = 
							( voice_preset.death_tts instanceof Array ) ? 
								sdWorld.AnyOf( voice_preset.death_tts ) :
								voice_preset.death_tts();
						
					if ( result )
					{
						if ( result.charAt( 0 ) !== '/' ) // Slash to hide pop-up
						this.Say( result, false, false, false );
						else
						this.Say( result.substring( 1 ), false, false, true, true );
					}
				}
				
				/*if ( this._voice.variant === 'croak' )
				{
					sdSound.PlaySound({ name:'council_death', x:this.x, y:this.y, volume:1, pitch:this.GetVoicePitch(), channel:this._voice_channel });
				}
				else
				if ( this._voice.variant === 'klatt3' )
				{
					this.Say( [ 'Critical damage!', 'Shutting down', 'Structural integrity compromised!' ][ ~~( Math.random() * 3 ) ], false, false, true, true );
				}
				else
				if ( this._voice.variant === 'whisperf' )
				{
					sdSound.PlaySound({ name:'f_death' + ~~(1+Math.random() * 3), x:this.x, y:this.y, volume:0.4, channel:this._voice_channel });
				}
				else
				if ( this._voice.variant !== 'm2' && this._voice.variant !== 'silence' )
				{
					if ( this.hea < -100 )
					sdSound.PlaySound({ name:'sd_death2', x:this.x, y:this.y, volume:1, pitch:this.GetVoicePitch(), channel:this._voice_channel });
					else
					sdSound.PlaySound({ name:'sd_death', x:this.x, y:this.y, volume:1, pitch:this.GetVoicePitch(), channel:this._voice_channel });
				}*/
			
				//this._sickness /= 4;
				this._sickness = 0;
				
				if ( this.driver_of )
				this.driver_of.ExcludeDriver( this );
			
				this.DropWeapons();

				if ( sdWorld.server_config.onKill )
				sdWorld.server_config.onKill( this, initiator );

				//if ( initiator )
				//if ( initiator.IsPlayerClass() )
				//if ( initiator._socket )
				{
					if ( this.IsHostileAI() )
					{
						if ( this.hmax < 200 )
						this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );
						else
						if ( this.hmax < 400 )
						this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
						else
						this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
					}
					else
					{
						/*
						if ( sdWorld.time < initiator._non_innocent_until ) // Attacker is not innocent
						{
							if ( initiator._socket.ffa_warning === 0 )
							initiator._socket.SDServiceMessage( 'Your respawn rate was temporarily decreased' );

							initiator._socket.SyncFFAWarning();
							initiator._socket.ffa_warning += 1;
							initiator._socket.respawn_block_until = sdWorld.time + initiator._socket.ffa_warning * 5000;
						}*/
					}
				}
			}
			else
			{
				if ( was_alive )
				//if ( dmg > 1 )
				{
					if ( this.pain_anim <= 0 )
					{
						let voice_preset = sdCharacter.voice_sound_effects[ this._voice.variant ] || sdCharacter.voice_sound_effects[ 'default' ];

						if ( voice_preset.hurt )
						{
							let result = 
									( voice_preset.hurt instanceof Array ) ? 
										sdWorld.AnyOf( voice_preset.hurt ) :
										voice_preset.hurt();

							if ( result )
							sdSound.PlaySound({ name:result, x:this.x, y:this.y, volume:voice_preset.volume || 1, pitch:voice_preset.pitch || this.GetVoicePitch(), channel:this._voice_channel });
						}
						else
						if ( voice_preset.hurt_tts )
						{
							let result = 
									( voice_preset.hurt_tts instanceof Array ) ? 
										sdWorld.AnyOf( voice_preset.hurt_tts ) :
										voice_preset.hurt_tts();

							if ( result )
							{
								if ( result.charAt( 0 ) !== '/' ) // Slash to hide pop-up
								this.Say( result, false, false, false );
								else
								this.Say( result.substring( 1 ), false, false, true, true );
							}
						}
						
						
						
						
						
						
						/*
						if ( this._voice.variant === 'croak' )
						{
							sdSound.PlaySound({ name: ( Math.random() < 0.5 ) ? 'council_hurtA' : 'council_hurtB', x:this.x, y:this.y, pitch:this.GetVoicePitch(), volume:( dmg > 1 )? 1 : 0.5, channel:this._voice_channel }); // less volume for bleeding
						}
						else
						if ( this._voice.variant === 'klatt3' )
						{
							this.Say( [ 'Ouch!', 'Aaa!', 'Uh!' ][ ~~( Math.random() * 3 ) ], false, false, true, true );
						}
						else
						if ( this._voice.variant === 'whisperf' )
						sdSound.PlaySound({ name:'f_pain' + ~~(2+Math.random() * 3), x:this.x, y:this.y, volume:( ( dmg > 1 )? 1 : 0.5 ) * 0.4, channel:this._voice_channel }); // less volume for bleeding
						else
						if ( this._voice.variant !== 'm2' && this._voice.variant !== 'silence' )
						sdSound.PlaySound({ name:'sd_hurt' + ~~(1+Math.random() * 2), x:this.x, y:this.y, pitch:this.GetVoicePitch(), volume:( dmg > 1 )? 1 : 0.5, channel:this._voice_channel }); // less volume for bleeding
						*/
						this.pain_anim = 10;
						
						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // Can wake up hibernated players
					}
				}
			}
			
			
			//if ( this.hea < -800 ) // Not so fun when body is on the way
			if ( this.hea < -400 )
			{
				//if ( this.death_anim <= sdCharacter.disowned_body_ttl )
				{
					let a,s,x,y,k;

					if ( this.GetBleedEffect() === sdEffect.TYPE_BLOOD || this.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
					sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
					else
					sdSound.PlaySound({ name:'blockB4', 
						x:this.x, y:this.y, 
						volume: 0.25, 
						pitch: 1 });


					for ( let i = 0; i < 6; i++ )
					{
						a = Math.random() * 2 * Math.PI;
						s = Math.random() * 4;

						k = Math.random();

						x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
						y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );

						//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )

						if ( this.GetBleedEffect() === sdEffect.TYPE_BLOOD )
						{
							sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD });
							sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
						}
						else
						if ( this.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
						{
							sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
							sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, filter:this.GetBleedEffectFilter(), sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, hue:this.GetBleedEffectHue() });
						}
						else
						{
							sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
						}
					}
				}
				this.remove();
			}
			
			this._regen_timeout = 30;
			if ( this.hea < 30 )
			if ( this._ai_enabled )
			this._dying = true; // Maybe it is more of confusing than a good feature in the game like this
		}
		else
		if ( this._socket !== null || this._my_hash !== undefined || !this.IsHostileAI() ) // Allow healing disconnected players
		{
			// Forget nearby entities that were only known because of character was dead and was giving out matter (memory leak prevention)
			if ( typeof this._anything_near !== 'undefined' )
			this._anything_near.length = 0;
		
			
			if ( this.hea < 0 )
			this.hea = 0;
			
			this.hea += Math.abs( dmg );
			
			if ( this.hea > 0 && !was_alive )
			{
				this.death_anim = 0;
				this.pain_anim = 10;
				this._crouch_intens = 1;
				
				if ( initiator )
				if ( initiator._socket )
				if ( this._socket )
				{
					if ( this._ai_enabled > 0 )
					{
					}
					else
					{
						/*let share = Math.min( Math.max( 0, initiator._score ), 10 );
						initiator._score -= share;
						this._score += share;*/

						if ( this._non_innocent_until < sdWorld.time ) // Healed player is innocent
						initiator._socket.ffa_warning = Math.max( initiator._socket.ffa_warning - 1, 0 );
					}
				}
			}
			if ( initiator && this._ai ) // AI got healed?
			{
				if ( this._ai.target )
				if ( this._ai.target === initiator ) // AI got healed by whoever shot them before? ( Instructor or SD soldiers come to mind here )
				this._ai.target = null; // Maybe AI could forgive
			}
			
			this._dying = false;
			
			if ( this.hea > this.hmax )
			this.hea = this.hmax;
		}
	}
	
	get mass() { return 80 * this.s / 100; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		let di = sdWorld.Dist2D_Vector( x / this.mass, y / this.mass );
		this.DamageStability( di * sdCharacter.stability_damage_from_velocity_changes_scale );
		
		this.ApplyServerSidePositionAndVelocity( false, x / this.mass, y / this.mass );
		
		/*this.sx += x * 0.1;
		this.sy += y * 0.1;
		this.ApplyServerSidePositionAndVelocity( false, x * 0.1, y * 0.1 );*/
	}
	
	UseServerCollisions()
	{
		if ( sdWorld.is_server )
		return true;
	
		if ( sdWorld.my_entity === this && this.AllowClientSideState() )
		return true;
		
		return false;
	}
	IsHostileAI() // Used to check if standartized score will be given for killing them and also for turrets to attack them
	{
		if ( this._ai_team !== 0 ) // Quite simple, if AI isn't on SD team, it's hostile
		{
			return true;
		}
		
		return false;
	}
						
	PlayAIAlertedSound( closest )
	{
		let voice_preset = sdCharacter.voice_sound_effects[ this._voice.variant ] || sdCharacter.voice_sound_effects[ 'default' ];

		if ( voice_preset.alert )
		{
			let result = 
					( voice_preset.alert instanceof Array ) ? 
						sdWorld.AnyOf( voice_preset.alert ) :
						voice_preset.alert( this, closest );

			if ( result )
			sdSound.PlaySound({ name:result, x:this.x, y:this.y, volume:voice_preset.volume || 1, pitch:voice_preset.pitch || this.GetVoicePitch(), channel:this._voice_channel });
		}
		else
		if ( voice_preset.alert_tts )
		{
			let result = 
					( voice_preset.alert_tts instanceof Array ) ? 
						sdWorld.AnyOf( voice_preset.alert_tts ) :
						voice_preset.alert_tts( this, closest );

			if ( result )
			{
				if ( result.charAt( 0 ) !== '/' ) // Slash to hide pop-up
				this.Say( result, false, false, false );
				else
				this.Say( result.substring( 1 ), false, false, true, true );
			}
		}
		
		if ( closest )
		if ( closest.IsPlayerClass() )
		if ( closest._my_hash )
		{
			this._ai_post_alert_fire_prevention_until = sdWorld.time + 800; // 250 ms is average human reaction time and 250 ms is a worst case ping scenario. And some extra to finish alert sound playing
		}

		/*if ( this._voice.variant === 'whisperf' )
		sdSound.PlaySound({ name:'f_welcome1', x:this.x, y:this.y, volume:0.4 });
		else
		if ( this._ai_team === 0 )
		{
			// Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false )
			this.Say( [ 
				'Your presence makes me mad, but in a good way!', 
				'I have no other choice but to attack!', 
				this.title + ' attacks!', 
				this._inventory[ this.gun_slot ] ? 'I will attack you with my gun because I actually have one!' : 'I will attack with my bare hands if I\'d have to!',
				this._inventory[ this.gun_slot ] ? 'Peow-peow!' : 'Punchy-punchy!',
				'*wild ' + this.title + ' noises*',
				sdWorld.ClassNameToProperName( closest.GetClass(), closest, true ) + ', identify yourself!',
				sdWorld.ClassNameToProperName( closest.GetClass(), closest, true ) + ' is attacking me!',
				'Say hello to my little ' + ( this._inventory[ this.gun_slot ] ? sdWorld.ClassNameToProperName( this._inventory[ this.gun_slot ].GetClass(), this._inventory[ this.gun_slot ], true ) : 'fists' )
			][ ~~( Math.random() * 9 ) ], false, false, false );
		}
		if ( this._ai_team === 3 )
		{
			if ( Math.random() < 0.1 )
			this.Say( [ 
				'This universe is doomed. You cannot stop it.', 
				'Give in. You are not to survive.', 
				'You challenge me? You cannot contest this. ', 
				'You will bring down the wrath by doing this.',
				'I will stop this.',
				'You can only delay your inevitable death.',
				'You cannot harm me, you can only send me back.'
				][ ~~( Math.random() * 7 ) ], false, false, false );
		}
		if ( this._ai_team === 6 ) // Criminal Star Defender
		{
			// Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false )
			if ( closest.is( sdCharacter ) )
			if (closest._ai_team === 0 )
				this.Say( [ 
				'I refuse to answer for something I had not done!',
				'Why would you bother with me anyway, I do not think I am worth the hassle.',
				'You know, maybe I am just a clone.',
				'Did they send you in here with nothing too?',
				'Instructor laughed at me when I first got here.',
				'The food on this planet is bad anyway.',
				'It was just a little trolling.',
				'My advice? Avoid the space mushrooms.',
				'Were we not in the same platoon?',
				'I was just following orders.',
				'One day you will be in my place.',
				'Responsibility comes.',
				'They will eventually issue a warrant on you too.',
				'We are replacable, so I ran.',
				'Dying seems like a better option to me. Come, I am ready.',
				'What exactly will you get by capturing me?'
			][ ~~( Math.random() * 16 ) ], false, false, false );
		}
		if ( this._ai_team === 7 ) // Setr faction
		{
			if ( Math.random() < 0.8 )
			this.Say( [ 
				'Uytiuk mdmhjmye.', 
				'Toisv muke!', 
				'Jpbitp amlrn! ', 
				'Monmfig eiayyse.',
				'Smmems iiedyg.'
				][ ~~( Math.random() * 5 ) ], false, false, false );
		}
		if ( this._ai_team === 10 ) // Time Shifter
		{
			if ( this.hea > 1250 )
			{
				// Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false )
				this.Say( [ 
					'I already killed you in the future. Might aswell have fun in the past.',
					'I know how you die, but I will not tell you.',
					'Are you ready?',
					'If I kill you now, it might change future events.',
					'Time is the most valuable resource. Something you do not have.'
				][ ~~( Math.random() * 5 ) ], false, false, false );
			}
		}*/
	}
	AILogic( GSPEED ) // aithink
	{
		if ( !sdWorld.is_server )
		return;
	
		let ai_will_fire = false;
	
		if ( this._ai_enabled === sdCharacter.AI_MODEL_FALKOK || this._ai_enabled === sdCharacter.AI_MODEL_AGGRESSIVE || this._ai_enabled === sdCharacter.AI_MODEL_TEAMMATE || this._ai_enabled === sdCharacter.AI_MODEL_DISTANT || this._ai_enabled === sdCharacter.AI_MODEL_AERIAL )
		{
			if ( typeof this._ai.next_action === 'undefined' )
			this._ai.next_action = 5; // At 30 they get shot down before they can even react

			if ( typeof this._ai.direction === 'undefined' )
			this._ai.direction = ( Math.random() < 0.5 ) ? 1 : -1;

			if ( ( this._ai.direction > 0 && this.x > sdWorld.world_bounds.x2 - 24 ) || ( this._ai.direction < 0 && this.x < sdWorld.world_bounds.x1 + 24 ) )
			{
				if ( this._ai_team !== 0 && this._ai_team !== 6 && this._ai_team !== 10 && !this.driver_of )// Prevent SD, Instructor and Time Shifter from disappearing
				{
					this.remove();
					return;
				}
				else
				this._ai.direction = -this._ai.direction // Switch sides
			}

			if ( !this._ai.target || this._ai.target._is_being_removed )
			{
				this._ai.target = null;
				
				this._ai.target = sdCharacter.GetRandomEntityNearby( this );
				if ( this._ai.target )
				this.PlayAIAlertedSound( this._ai.target );
			}

			if ( this._ai.target && this._ai_enabled !== sdCharacter.AI_MODEL_TEAMMATE && this._ai_enabled !== sdCharacter.AI_MODEL_AERIAL )
			{
				this._ai_enabled = this.GetBehaviourAgainstTarget(); // Set their fighting behaviour appropriately when they fight specific enemies
			}
			this._ai.next_action -= GSPEED;

			if ( this._ai.next_action <= 0 )
			{
				this._ai.next_action = 5 + Math.random() * 10;

				/*if ( this.gun_slot !== this._ai_gun_slot && this._inventory[ this._ai_gun_slot ] && !this._inventory[ this._gun_slot ] ) // Any weapon in it's predicted slot? And no weapon is currently equipped?
				{
					this.gun_slot = this._ai_gun_slot; // Equip it
					this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
				}
				else
				*/
				if ( ( !this._inventory[ this.gun_slot ] || Math.random() < 0.15 ) && this._ai_allow_weapon_switch ) // No weapon ( or occasionally check if they have a better one ) and is allowed to switch weapons?
				{
					if ( this._inventory.length > 0 ) // Any weapons?
					{
						//let slots = [];
						let best_slot = -1; // Which slot is most suitable for current situation?
						// Currently it only checks DPS for weapons, though it should probably check target distance so it selects a sniper, or shotgun, or a pistol if it's low on matter.
						for ( let i = 0; i < 9; i++ )
						{
							if ( this._inventory[ i ] )
							{
								if ( best_slot === -1 )
								best_slot = i;
								else
								if ( this._inventory[ i ].class._max_dps > this._inventory[ best_slot ].class._max_dps )
								best_slot = i;
							}
						}
						//if ( best_slot !== -1 )
						//this.gun_slot = slots[ Math.round( Math.random() * slots.length ) ];
						//else
						this.gun_slot = best_slot;
						this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
					}
					
					
				}
				
				
				// AI should now be able to accompany players when players pilot a vehicle
				this._key_states.SetKey( 'KeyE', 0 );

				if ( this._potential_vehicle && this.driver_of === null )
				{
					if ( typeof this._potential_vehicle.driver0 !== 'undefined' ) // Workbench might crash servers otherwise
					{
						if ( this._potential_vehicle.driver0 )
						if ( this._potential_vehicle.driver0._ai_team === this._ai_team && this.driver_of === null )
						this._key_states.SetKey( 'KeyE', 1 );
					}
				}
				//
				let closest = null;
				let closest_di = Infinity;
				//let closest_di_real = Infinity;

				// Occasionally change direction?
				if ( Math.random() < 0.001 )
				this._ai.direction = ( Math.random() < 0.5 ) ? 1 : -1;

				this._ai_action_counter++;

				if ( this._ai_action_counter > 0 && this._ai_action_counter % 5 === 0 ) // In some cases if AI doesn't move a while, it should occasionally try changing direction
				if ( Math.random() < 0.08 )
				this._ai.direction = -this._ai.direction;

				if ( ( this.x - this._ai_last_x ) < -64 || ( this.x - this._ai_last_x ) > 64 ) // Has the AI moved a bit or is it stuck?
				{
					this._ai_last_x = this.x;
					this._ai_action_counter = 0;
					if ( this._ai_dig > 0 )
					{
						this._ai_dig = 0; // Stop digging and reset target if AI is targeting sdBlock
						if ( this._ai.target )
						if ( this._ai.target.is( sdBlock ) )
						this._ai.target = null;
					}
				}
				if ( ( this.y - this._ai_last_y ) < -64 || ( this.y - this._ai_last_y ) > 64 ) // Same but Y coordinate
				{
					this._ai_last_y = this.y;
					this._ai_action_counter = 0;
					if ( this._ai_dig > 0 )
					{
						this._ai_dig = 0; // Stop digging and reset target if AI is targeting sdBlock
						if ( this._ai.target )
						if ( this._ai.target.is( sdBlock ) )
						this._ai.target = null;
					}
				}

				if ( this._ai_action_counter >= 40 || ( this._ai_dig > 0 && !this._ai.target ) ) // In case if AI is stuck in blocks (earthquakes, player buildings etc) will target nearby blocks
				{
					this.AITargetBlocks();
					if ( this._ai_action_counter >= 40 )
					{
						this._ai_action_counter = 0;
						this._ai_dig = 2 + Math.floor( Math.random() * 3 ); // Shoot down at least 2 nearby blocks
					}
				}			

				if ( this._ai.target )
				{
					if ( ( this._ai.target.hea || this._ai.target._hea || 0 ) > 0 && 
						 !this._ai.target._is_being_removed &&
					     this._ai.target.IsVisible( this ) && 
						 sdWorld.Dist2D( this.x, this.y, this._ai.target.x, this._ai.target.y ) < 800 )
					{
						closest = this._ai.target;
					}
					else
					this._ai.target = null;
				}

				/*if ( !closest )
				{
					let targets,di;

					di = 300;
					targets = sdWorld.GetAnythingNear( this.x, this.y, 400, null, [ 'sdAmphid', 'sdBadDog', 'sdOctopus', 'sdVirus', 'sdEnemyMech', 'sdCube', 'sdDrone', 'sdAsp', 'sdQuickie', 'sdSpider', 'sdSandWorm', 'sdShark', 'sdCharacter' ] );
					for ( let i = 0; i < targets.length; i++) // Target closest entity which AI can see
					{
						let target_is_alive = false;
						if ( typeof targets[ i ]._hea !== 'undefined' )
						if ( targets[ i ]._hea > 0 )
						target_is_alive = true;
						if ( typeof targets[ i ].hea !== 'undefined' )
						if ( targets[ i ].hea > 0 )
						target_is_alive = true;

						if ( target_is_alive === true )
						{
							//if ( this._ai_team >= 0 && this._ai_team <= 999 ) // Non-instructor
							{
								let should_target = true;
								if ( typeof targets[ i ]._ai_team !== 'undefined' ) // Erthal spider bots, humanoids, drones
								if ( this._ai_team === targets[ i ]._ai_team )
								should_target = false;
								if ( should_target === true )
								if ( sdWorld.CheckLineOfSight( this.x, this.y, targets[ i ].x, targets[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) )
								if ( sdWorld.Dist2D( this.x, this.y, targets[ i ].x, targets[ i ].y ) <= di )
								//if ( targets[ i ] !== old_target ) // Don't target entity which isn't possible to attack
								{
									this._ai.target = targets[ i ];
									di = sdWorld.Dist2D( this.x, this.y, targets[ i ].x, targets[ i ].y );
								}
							}
						}
					}

				}*/
				/*for ( let i = 0; i < sdCharacter.characters.length; i++ )
				{
					var ent = sdCharacter.characters[ i ];
					if ( this._ai_team === 0 ) // Keep emergency instructor's behaviour as it is right now
					{
						if ( !sdCharacter.characters[ i ]._ai )
						{
							if ( ent )
							if ( ent.hea > 0 )
							if ( !ent._is_being_removed )
							if ( this._owner !== ent && ( this._owner === null || ( this._owner.cc_id !== 0 || this._owner.cc_id !== ent.cc_id ) ) )
							{
								let di = sdWorld.Dist2D( this.x, this.y, ent.x, ent.y );
								//let di_real = di;

								if ( di < 400 )
								//if ( !sdCube.IsTargetFriendly( ent ) )
								if ( ent.IsVisible( this ) )
								if ( sdWorld.CheckLineOfSight( this.x, this.y, ent.x, ent.y, this, sdCom.com_visibility_ignored_classes, null ) )
								{
									if ( di < closest_di )
									{
										closest_di = di;
										//closest_di_real = di_real;
										closest = ent;
									}
								}
							}
						}
					}
					else // If falkoks or other factions, like Erthals, target anything beside themselves
					{
						if ( ent )
						if ( ent.hea > 0 )
						if ( ent._ai_team !== this._ai_team )
						if ( !ent._is_being_removed )
						if ( this._owner !== ent && ( this._owner === null || ( this._owner.cc_id !== 0 || this._owner.cc_id !== ent.cc_id ) ) )
						{
							let di = sdWorld.Dist2D( this.x, this.y, ent.x, ent.y );
							//let di_real = di;

							if ( di < 400 )
							//if ( !sdCube.IsTargetFriendly( ent ) )
							if ( ent.IsVisible( this ) )
							if ( sdWorld.CheckLineOfSight( this.x, this.y, ent.x, ent.y, this, sdCom.com_visibility_ignored_classes, null ) )
							{
								if ( di < closest_di )
								{
									closest_di = di;
									//closest_di_real = di_real;
									closest = ent;
								}
							}
						}
					}
				}*/

				this._key_states.SetKey( 'KeyA', 0 );
				this._key_states.SetKey( 'KeyD', 0 );
				this._key_states.SetKey( 'KeyW', 0 );
				this._key_states.SetKey( 'KeyS', 0 );

				//this._key_states.SetKey( 'Mouse1', 0 );
				//ai_will_fire = false;

				/*if ( this.driver_of )
				{
					if ( typeof this.driver_of.driver0 !== 'undefined' )
					if ( this.driver_of.driver0 === null )
					this._key_states.SetKey( 'KeyE', 1 );	
				
					if ( this.driver_of.sy > 1 ) // Prevents vehicle fall damage?
					{
						this._key_states.SetKey( 'KeyW', 1 );
						this._key_states.SetKey( 'KeyS', 0 );
					}
					if ( this.driver_of.sy < -1 ) // Prevents vehicle upwards border damage?
					{
						this._key_states.SetKey( 'KeyW', 0 );
						this._key_states.SetKey( 'KeyS', 0 );
					}
				}*/

				if ( this._ai_stay_near_entity ) // Is there an entity AI should stay near?
				{
					if ( !this._ai_stay_near_entity._is_being_removed && 
						 !sdWorld.inDist2D_Boolean( this.x, this.y, this._ai_stay_near_entity.x, this._ai_stay_near_entity.y, this._ai_stay_distance ) ) // Is the AI too far away from the entity?
					{
						// Move towards entity
						if ( this.x > this._ai_stay_near_entity.x )
						this._key_states.SetKey( 'KeyA', 1 );

						if ( this.x < this._ai_stay_near_entity.x )
						this._key_states.SetKey( 'KeyD', 1 );

						if ( this.y > this._ai_stay_near_entity.y + 8 )
						this._key_states.SetKey( 'KeyW', 1 );

					}
				}
				else
				this._ai_stay_near_entity = null;

				if ( !this._ai_stay_near_entity && this._ai_enabled === sdCharacter.AI_MODEL_TEAMMATE && Math.random() < 0.25 )
				{
					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].character )
					{
						if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, this.x, this.y, 200 ) ) // Is the player close enough to the teammate?
						{
							this._ai_stay_near_entity = sdWorld.sockets[ i ].character; // Follow the players ( useful for "Rescue Star Defender" tasks
							this._ai_stay_distance = 96;
							break;
						}
					}
				}

				if ( closest )
				{
					if ( !this._ai.target )
					{
						this.PlayAIAlertedSound( closest );
					}

					this._ai.target = closest;
					this._ai.target_local_y = closest._hitbox_y1 + ( closest._hitbox_y2 - closest._hitbox_y1 ) * Math.random();
					
					let check_from = ( this.driver_of ) ? this.driver_of : this;
					let projectile_offset = ( this.driver_of ) ? { x:0, y:0 } : this.GetBulletSpawnOffset();

					let should_fire = false; // Sometimes prevents friendly fire, not ideal since it updates only when ai performs "next action"
					
					/*if ( this.look_x - this._ai.target.x > 60 || this.look_x - this._ai.target.x < -60 || // Don't shoot if you're not looking near or at the target
						 this.look_y - this._ai.target.y > 60 || this.look_y - this._ai.target.y < -60 )
					should_fire = false;*/
					
					
					let CheckIfFirePositionAppropriate = ( projectile_spawn_x, projectile_spawn_y, look_x, look_y, check_from )=>
					{
						let should_fire = true;
						
						if ( !sdWorld.CheckLineOfSight( projectile_spawn_x, projectile_spawn_y, look_x, look_y, check_from ) )
						if ( sdWorld.last_hit_entity )
						{
							let cur_target = sdWorld.last_hit_entity;
							if ( typeof cur_target._ai_team !== 'undefined' ) // Does a potential target belong to a faction?
							{
								if ( cur_target._ai_team === this._ai_team ) // Is this part of a friendly faction?
								should_fire = false; // Don't target
							}
							if ( !sdWorld.CheckLineOfSight( projectile_spawn_x, projectile_spawn_y, look_x, look_y, check_from, sdCom.com_visibility_ignored_classes ) )
							should_fire = false; // Don't attack through walls

							if ( this._ai.target === cur_target ) // But attack if the target is directly looked at ( even walls in digging scenario )
							should_fire = true;
						}
						
						return should_fire;
					};
			
					let allow_random_movements = true;
					
					if ( this.look_x - this._ai.target.x > 60 || this.look_x - this._ai.target.x < -60 || // Don't shoot if you're not looking near or at the target
						 this.look_y - this._ai.target.y > 60 || this.look_y - this._ai.target.y < -60 )
					{
					}
					else
					{
						if ( CheckIfFirePositionAppropriate( 
								check_from.x + projectile_offset.x, 
								check_from.y + projectile_offset.y, this.look_x, this.look_y, check_from ) )
						{
							should_fire = true;
							
							// Mark current attack position as good enough if line of sight happens to be broken later due to random movements
							this._ai_dive_suggestion_x = check_from.x;
							this._ai_dive_suggestion_y = check_from.y;
						}
						else
						{
							if ( sdWorld.time > this._ai_dive_suggestion_rethink_in )
							{
								this._ai_dive_suggestion_rethink_in = sdWorld.time + 1;//+ 100 + Math.random() * 200;
								this._ai_dive_suggestion_x = check_from.x - 100 + Math.random() * 100;
								this._ai_dive_suggestion_y = check_from.y - 100 + Math.random() * 100;
								
								if ( sdWorld.CheckLineOfSight( check_from.x, check_from.y, this._ai_dive_suggestion_x, this._ai_dive_suggestion_y, check_from, sdCom.com_visibility_ignored_classes ) )
								{
									// Can go there
								}
								else
								{
									// Can't go there
									this._ai_dive_suggestion_x = 0;
									this._ai_dive_suggestion_y = 0;
								}
							}
							
							if ( this._ai_dive_suggestion_x !== 0 || this._ai_dive_suggestion_y !== 0 )
							if ( CheckIfFirePositionAppropriate( 
								this._ai_dive_suggestion_x + projectile_offset.x, 
								this._ai_dive_suggestion_y + projectile_offset.y, this.look_x, this.look_y, check_from ) )
							{
								if ( this._ai_dive_suggestion_x < check_from.x )
								this._key_states.SetKey( 'KeyA', 1 );
							
								if ( this._ai_dive_suggestion_x > check_from.x )
								this._key_states.SetKey( 'KeyD', 1 );
							
								if ( this._ai_dive_suggestion_y < check_from.y )
								this._key_states.SetKey( 'KeyW', 1 );
							
								// Don't actually crouch
								
								allow_random_movements = false;
								
								//sdWorld.SendEffect({ x:this._ai_dive_suggestion_x, y:this._ai_dive_suggestion_y, type:sdEffect.TYPE_TELEPORT });
								
								this._ai_dive_suggestion_rethink_in = sdWorld.time + 2000; // Don't rethink suggestion position for a while since it seems to be a good suggestion
							}
						}
					}
					
					/*if ( !sdWorld.CheckLineOfSight( projectile_spawn_x, projectile_spawn_y, this.look_x, this.look_y, check_from ) )
					if ( sdWorld.last_hit_entity )
					{
						let cur_target = sdWorld.last_hit_entity;
						if ( typeof cur_target._ai_team !== 'undefined' ) // Does a potential target belong to a faction?
						{
							if ( cur_target._ai_team === this._ai_team ) // Is this part of a friendly faction?
							should_fire = false; // Don't target
						}
						if ( !sdWorld.CheckLineOfSight( projectile_spawn_x, projectile_spawn_y, this.look_x, this.look_y, check_from, sdCom.com_visibility_ignored_classes ) )
						should_fire = false; // Don't attack through walls
						
						if ( this._ai.target === cur_target ) // But attack if the target is directly looked at ( even walls in digging scenario )
						should_fire = true;
					}
					
					debugger; // Finish diving logic that uses _ai_dive_suggestion_x/y
					if ( !should_fire )
					{
						
					}*/
					
					if ( this._ai_enabled === sdCharacter.AI_MODEL_FALKOK )
					{
						if ( allow_random_movements )
						{
							if ( Math.random() < 0.3 )
							this._key_states.SetKey( 'KeyA', 1 );

							if ( Math.random() < 0.3 )
							this._key_states.SetKey( 'KeyD', 1 );

							if ( Math.random() < 0.2 || ( this.sy > 2.5 && this._jetpack_allowed && this.matter > 30 ) )
							this._key_states.SetKey( 'KeyW', 1 );

							if ( Math.random() < 0.4 )
							this._key_states.SetKey( 'KeyS', 1 );
						}
					}

					if ( this._ai_enabled === sdCharacter.AI_MODEL_AGGRESSIVE )
					{
						if ( this.x > closest.x + 32 )
						this._key_states.SetKey( 'KeyA', 1 );

						if ( this.x < closest.x - 32 )
						this._key_states.SetKey( 'KeyD', 1 );

						if ( ( allow_random_movements && Math.random() < 0.2 ) || ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30 ) || ( this.y > closest.y + Math.random() * 64 ) )
						this._key_states.SetKey( 'KeyW', 1 );

						if ( ( allow_random_movements && Math.random() < 0.4 ) )
						this._key_states.SetKey( 'KeyS', 1 );
					}

					if ( this._ai_enabled === sdCharacter.AI_MODEL_DISTANT )
					{
						if ( this.x < closest.x && this.x > ( closest.x - 250 ) )
						this._key_states.SetKey( 'KeyA', 1 );
						else
						if ( this.x > closest.x && this.x < ( closest.x + 250 ) )
						this._key_states.SetKey( 'KeyD', 1 );

						if ( ( allow_random_movements && Math.random() < 0.2 ) || ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30 ) )
						this._key_states.SetKey( 'KeyW', 1 );

						if ( ( allow_random_movements && Math.random() < 0.1 ) )
						this._key_states.SetKey( 'KeyS', 1 );
					}
					
					if ( this._ai_enabled === sdCharacter.AI_MODEL_AERIAL )
					{
						//if ( allow_random_movements )
						{
							if ( Math.random() < 0.3 )
							this._key_states.SetKey( 'KeyA', 1 );

							if ( Math.random() < 0.3 )
							this._key_states.SetKey( 'KeyD', 1 );

							if ( sdWorld.CheckLineOfSight( this.x, this.y + this._hitbox_y2, this.x, this.y + this._hitbox_y2 + 128, this, null, sdCom.com_visibility_unignored_classes ) ) // Too far above?
							{
								this._key_states.SetKey( 'KeyW', 0 );
								//this._key_states.SetKey( 'KeyS', 1 ); // Go down a little, unless below conditions tell otherwise
							}
							else
							if ( this.sy > -4.5 )
							{
								this._key_states.SetKey( 'KeyW', 1 );
								this._key_states.SetKey( 'KeyS', 0 );
							}
									
							if ( this.sy > 1.5 ) // Prevents fall damage?
							{
								this._key_states.SetKey( 'KeyW', 1 );
								this._key_states.SetKey( 'KeyS', 0 );
							}
							
							//if ( Math.random() < 0.4 )
							//this._key_states.SetKey( 'KeyS', 1 );
						}
					}

					if ( Math.random() < 0.05 && should_fire === true ) // Shoot the walls occasionally, when target is not in sight but was detected previously
					{
						//this._key_states.SetKey( 'Mouse1', 1 );
						ai_will_fire = true;
					}
					else
					if ( Math.random() < 0.25 + Math.min( 0.75, ( 0.25 * this._ai_level ) ) && should_fire === true ) // Shoot on detection, depends on AI level
					{

						//if ( !this._ai.target.is( sdBlock ) ) // Check line of sight if not targeting blocks
						{
							/*
							//if ( sdWorld.CheckLineOfSight( this.x, this.y, this._ai.target.x, this._ai.target.y, this, sdCom.com_visibility_ignored_classes, null ) )
							//if ( sdWorld.CheckLineOfSight( this.x, this.y, this.look_x, this.look_y, this, sdCom.com_visibility_ignored_classes, null ) )
							// I think it already checks in "let should_fire" part.
							this._key_states.SetKey( 'Mouse1', 1 );
						
							if ( this._ai.target.IsVehicle() )
							this._key_states.SetKey( 'Mouse1', 1 );
							*/
							ai_will_fire = true;
						}
					}
				}
				else
				{
					if ( this._ai_enabled === sdCharacter.AI_MODEL_AERIAL ) // Also enabled when idle/without a target
					{
						//if ( allow_random_movements )
						{
							if ( Math.random() < 0.3 )
							this._key_states.SetKey( 'KeyA', 1 );

							if ( Math.random() < 0.3 )
							this._key_states.SetKey( 'KeyD', 1 );

							if ( sdWorld.CheckLineOfSight( this.x, this.y + this._hitbox_y2, this.x, this.y + this._hitbox_y2 + 128, this, null, sdCom.com_visibility_unignored_classes ) ) // Too far above?
							{
								this._key_states.SetKey( 'KeyW', 0 );
								//this._key_states.SetKey( 'KeyS', 1 ); // Go down a little, unless below conditions tell otherwise
							}
							else
							if ( this.sy > -4 )
							{
								this._key_states.SetKey( 'KeyW', 1 );
								this._key_states.SetKey( 'KeyS', 0 );
							}
									
							if ( this.sy > 1.5 ) // Prevents fall damage?
							{
								this._key_states.SetKey( 'KeyW', 1 );
								this._key_states.SetKey( 'KeyS', 0 );
							}

							//if ( Math.random() < 0.4 )
							//this._key_states.SetKey( 'KeyS', 1 );
						}
					}
					
					if ( this._ai.direction > 0 )
					this._key_states.SetKey( 'KeyD', ( Math.random() < 0.5 ) ? 1 : 0 );
					else
					this._key_states.SetKey( 'KeyA', ( Math.random() < 0.5 ) ? 1 : 0 );

					sdWorld.last_hit_entity = null;

					if ( sdWorld.CheckWallExistsBox( 
								this.x + this._ai.direction * 16 - 16, 
								this.y + this._hitbox_y2 - 32 + 1, 
								this.x + this._ai.direction * 16 + 16, 
								this.y + this._hitbox_y2 - 1, this, null, null 
							) || 
							( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30 ) )
					{
						if ( Math.random() < 0.5 )
						this._key_states.SetKey( 'KeyW', 1 ); // Move up
						else
						if ( Math.random() < 0.5 )
						this._ai.direction = - this._ai.direction; // Change direction
					}
					else
					{
						// Try to go through walls of any kinds
						if ( sdWorld.last_hit_entity )
						//if ( sdWorld.last_hit_entity._natural === false || sdWorld.last_hit_entity.is( sdDoor ) || sdWorld.last_hit_entity.is( sdMatterContainer ) || ( !sdWorld.last_hit_entity.is( sdCharacter ) && Math.random() < 0.01 ) )
						if ( sdWorld.last_hit_entity._natural === false || sdWorld.last_hit_entity.is( sdDoor ) || 
							 sdWorld.last_hit_entity.is( sdMatterContainer ) || ( !sdWorld.last_hit_entity.is( sdCharacter ) && Math.random() < ( 0.01 * this._ai_level ) ) )
						{
							closest = sdWorld.last_hit_entity;

							this._ai.target = closest;
							this._ai.target_local_y = closest._hitbox_y1 + ( closest._hitbox_y2 - closest._hitbox_y1 ) * Math.random();
						}
					}
				}
				if ( this.driver_of ) // Is the AI inside of a vehicle?
				this.AIVehicleLogic();
			}

			if ( this._ai.target && this._ai.target.IsVisible( this ) )
			{
				this.look_x = sdWorld.MorphWithTimeScale( this.look_x, this._ai.target.x + ( ( this._ai.target._hitbox_x1 + this._ai.target._hitbox_x2 ) / 2 ), Math.max( 0.5, ( 0.8 - 0.15 * this._ai_level ) ), GSPEED );
				this.look_y = sdWorld.MorphWithTimeScale( this.look_y, this._ai.target.y + ( this._ai.target_local_y || 0 ), Math.max( 0.5, ( 0.8 - 0.15 * this._ai_level ) ), GSPEED );
			}
			else
			{
				this.look_x = sdWorld.MorphWithTimeScale( this.look_x, this.x + this._ai.direction * 400, 0.9, GSPEED );
				this.look_y = sdWorld.MorphWithTimeScale( this.look_y, this.y + Math.sin( sdWorld.time / 2000 * Math.PI ) * 50, 0.9, GSPEED );

				//this._key_states.SetKey( 'Mouse1', 0 );
				//ai_will_fire = false;
			}
			
			//sdWorld.SendEffect({ x:this.look_x, y:this.look_y, type:sdEffect.TYPE_TELEPORT });
		}
		else
		if ( this._ai_enabled === sdCharacter.AI_MODEL_INSTRUCTOR )
		{
			// Logic is done elsewhere (in config file), he is so far just idle and friendly
		}
		
		if ( ai_will_fire && sdWorld.time > this._ai_post_alert_fire_prevention_until || this._ai_force_fire )
		this._key_states.SetKey( 'Mouse1', 1 );
		else
		this._key_states.SetKey( 'Mouse1', 0 );
	}
	AIVehicleLogic() // For piloting some vehicles
	{
		{
			let vehicle = this.driver_of;
			if ( typeof vehicle.driver0 !== 'undefined' )
			{
				if ( vehicle.driver0 === null ) // No driver?
				this._key_states.SetKey( 'KeyE', 1 );
			
				if ( vehicle.is( sdHover ) )
				{
					if ( vehicle.guns === 0 && vehicle.driver0 !== this && Math.random() < 0.1 && this._ai.target ) // Hover with no guns but AI has a target?
					{
						this._key_states.SetKey( 'KeyE', 1 ); // Randomly leave and engage the target
						//this._ai.next_action = 30;
					}
				}
			}
		
			if ( typeof vehicle.matter !== 'undefined' )
			if ( vehicle.matter < 1 ) // No matter?
			this._key_states.SetKey( 'KeyE', 1 ); // Leave
			
			if ( vehicle.hea < vehicle.hmax * 0.05 && Math.random() < 0.5 ) // Vehicle is below 5% HP and RNG decides it's time to leave?
			this._key_states.SetKey( 'KeyE', 1 ); // Leave
			
			if ( Math.random() < 0.66 ) // Needs to be above LOS check or it will continually go up regardless
			{
				this._key_states.SetKey( 'KeyW', 1 );
				this._key_states.SetKey( 'KeyS', 0 );
			}
			
			if ( sdWorld.CheckLineOfSight( vehicle.x, vehicle.y + vehicle._hitbox_y2, vehicle.x, vehicle.y + vehicle._hitbox_y2 + 300, vehicle, null, sdCom.com_visibility_unignored_classes ) ) // Too far above?
			{
				this._key_states.SetKey( 'KeyW', 0 );
				this._key_states.SetKey( 'KeyS', 1 ); // Go down a little, unless below conditions tell otherwise
			}
					
			if ( vehicle.sy > 1 ) // Prevents vehicle fall damage?
			{
				this._key_states.SetKey( 'KeyW', 1 );
				this._key_states.SetKey( 'KeyS', 0 );
			}
			if ( vehicle.sy < -1 ) // Prevents vehicle upwards border damage?
			{
				this._key_states.SetKey( 'KeyW', 0 );
				this._key_states.SetKey( 'KeyS', 0 );
			}
			if ( vehicle.sx > 1 ) // Prevents vehicle impact
			{
				this._key_states.SetKey( 'KeyA', 1 );
				this._key_states.SetKey( 'KeyD', 0 );
			}
			if ( vehicle.sx < -1 ) //Prevents vehicle impact
			{
				this._key_states.SetKey( 'KeyA', 0 );
				this._key_states.SetKey( 'KeyD', 1 );
			}
		}
	}
	GetBulletSpawnOffset() // GetProjectileSpawnOffset() // Should return new Object
	{
		// Anything else is no longer good with new ragdoll structure
		//return { x:0, y:Math.max( sdCharacter.bullet_y_spawn_offset, ( this._hitbox_y1 + this._hitbox_y2 ) / 2 ) };
		//return { x:0, y:( this._hitbox_y1 + this._hitbox_y2 ) / 2 + sdCharacter.bullet_y_spawn_offset };
		return { x:0, y: ( this._hitbox_y1 + this._hitbox_y2 ) / 2 + sdCharacter.bullet_y_spawn_offset / ( 16 - (-12) ) * ( this._hitbox_y2 - this._hitbox_y1 ) };
		//return { x:0, y:( this._hitbox_y1 + this._hitbox_y2 ) / 2 };
		/*
			
		// Much better for digging down. Also will work with all short-range weapons like defibrillators
		if ( !this._inventory[ this.gun_slot ] || sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_sword || ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].projectile_properties.time_left !== undefined && sdGun.classes[ this._inventory[ this.gun_slot ].class ].projectile_properties.time_left < 5 ) )
		{
			return { x:0, y:sdCharacter.bullet_y_spawn_offset };
		}
		
		let m1 = [ 1, 0, 0, 1, 0, 0 ];
		
		// Assume these as 0
		let gun_offset_x = 0;
		let gun_offset_y = 0;
		
		function ctx_translate( x, y )
		{
			m1[ 4 ] += m1[ 0 ] * x + m1[ 2 ] * y;
			m1[ 5 ] += m1[ 1 ] * x + m1[ 3 ] * y;
		}
		function ctx_scale( sx, sy )
		{
			m1[ 0 ] *= sx;
			m1[ 1 ] *= sx;
			m1[ 2 ] *= sy;
			m1[ 3 ] *= sy;
		}
		function ctx_rotate( angle )
		{
			var c = Math.cos( angle );
			var s = Math.sin( angle );
			var m11 = m1[ 0 ] * c + m1[ 2 ] * s;
			var m12 = m1[ 1 ] * c + m1[ 3 ] * s;
			var m21 = m1[ 0 ] * -s + m1[ 2 ] * c;
			var m22 = m1[ 1 ] * -s + m1[ 3 ] * c;
			m1[ 0 ] = m11;
			m1[ 1 ] = m12;
			m1[ 2 ] = m21;
			m1[ 3 ] = m22;
		}
		
		ctx_rotate( this.tilt / 100 );
		ctx_scale( this._side, 1 );
		
		let an = Math.atan2( 
						( this.y - this.look_y ) , 
						( ( this.x - this.look_x ) * this._side - 3 * Math.abs( this.y - this.look_y ) ) ) - Math.PI;

		if ( this._ledge_holding )
		an = 0;
	
		if ( this.gun_slot === 0 )
		{
		}
		else
		{
			if ( this.fire_anim > 2.5 )
			{
				gun_offset_x -= 3;
			}
			else
			if ( this.fire_anim > 0 )
			{
				gun_offset_x -= 2;
			}
		}

		ctx_translate( - 2, 5 );
		ctx_rotate( an );
		ctx_translate( 2,  - 5 );

		ctx_translate( 5 + gun_offset_x, -2 + gun_offset_y );
		
		return { x: m1[ 4 ], y: m1[ 5 ] };*/
	}
	
	DoStuckCheck() // Makes _hard_collision-less entities receive unstuck logic
	{
		return true;
	}
	onPhysicallyStuck() // Called as a result of ApplyVelocityAndCollisions call. Return true if entity needs unstuck logic appleid, which can be performance-damaging too
	{
		return true;
	}


	TogglePlayerAbility() // part of ManagePlayerVehicleEntrance()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._ghost_allowed || this.ghosting )
		{
			this.ghosting = !this.ghosting;
			this._ghost_breath = sdCharacter.ghost_breath_delay;

			if ( this.ghosting )
			sdSound.PlaySound({ name:'ghost_start', x:this.x, y:this.y, volume:1 });
			else
			sdSound.PlaySound({ name:'ghost_stop', x:this.x, y:this.y, volume:1 });
		}
		if ( this._shield_allowed || this._shielding )
		{
			this._shielding = !this._shielding;
			
			if ( this.matter < 20 ) // The shields cost matter to activate
			this._shielding = false;

			if ( this._shielding ) // Activate shield
			{
				sdSound.PlaySound({ name:'ghost_start', x:this.x, y:this.y, volume:1, pitch:2 });
				sdBubbleShield.ApplyShield( this, sdBubbleShield.TYPE_STAR_DEFENDER_SHIELD, true, 32, 32 ); // Apply shield
				this.matter -= 20;
			}
			else // Remove shield
			{
				sdSound.PlaySound({ name:'ghost_stop', x:this.x, y:this.y, volume:1, pitch:2 });
				/*let shield = sdBubbleShield.CheckIfEntityHasShield( this );
				if ( shield )
				if ( !shield._is_being_removed )
				shield.remove();*/
		
				let shield = sdBubbleShield.GetShieldOfEntity( this );
				if ( shield )
				if ( !shield._is_being_removed )
				shield.remove();
			}
		}
	}
	ManagePlayerFlashLight()
	{
		let f_state = this._key_states.GetKey( 'KeyF' );

		if ( this.hea > 0 && this._frozen <= 0 )
		if ( f_state )
		if ( f_state !== this._last_f_state )
		{
			if ( this.flashlight )
			{
				this.flashlight = 0;
				
				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:0.5, pitch:1.5 });
			}
			else
			{
				if ( this.has_flashlight )
				{
					this.flashlight = 1;
					
					sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:0.5, pitch:2 });
				}
			}
		}

		this._last_f_state = f_state;
	}
	DropCrystal( crystal_to_drop, initiated_by_player=false )
	{
		if ( this.carrying !== crystal_to_drop )
		return;
	
		if ( initiated_by_player ) // By player attack specifically
		return;
	
		this.carrying.held_by = null;
		this.carrying.onCarryEnd();
			
		if ( !this.carrying._is_being_removed )
		{
			this.carrying.PhysWakeUp();
			this.carrying.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			this.carrying.sx = this.sx + this._side * 0.1;
			this.carrying.sy = this.sy;
		}
		
		this._previous_carrying = this.carrying;
		this._previous_carrying_ignore_until = sdWorld.time + sdCharacter.carried_item_collision_igonre_duration;
		
		this.carrying._last_held_by = this;
		this.carrying._last_held_by_until = sdWorld.time + sdCharacter.carried_item_collision_igonre_duration;
		
		sdWorld.SendEffect({
			x: this.x,
			y: this.y,
			p: this._net_id,
			c: this.carrying._net_id
		}, 'CARRY_END' );
		
		this.carrying = null;
	}
	ManagePlayerVehicleEntrance( GSPEED )
	{
		let e_state = this._key_states.GetKey( 'KeyE' );
		
		if ( this.carrying )
		{
			if ( this.carrying._is_being_removed )
			this.carrying = null;
			else
			{
				let xx;
				let yy;
				
				/*let safe_area = 3;
				
				if ( this._side > 0 )
				xx = this.x + this._hitbox_x2 - this.carrying._hitbox_x1 + safe_area;
				else
				xx = this.x + this._hitbox_x1 - this.carrying._hitbox_x2 - safe_area;*/
			
				let off = this.GetBulletSpawnOffset();
				let an = this.GetLookAngle();
				let add_x = Math.sin( an );
				let add_y = Math.cos( an );
				if ( add_y > 0 )
				add_y *= 2;
				xx = this.x + off.x + add_x * 4;
				yy = this.y + off.y + add_y * 4;
			
				/*let placement_y = 0.75;
			
				yy = Math.min( 
						this.y + ( this._hitbox_y1 * placement_y + this._hitbox_y2 * ( 1-placement_y ) ) - ( this.carrying._hitbox_y1 + this.carrying._hitbox_y2 ) / 2, // Centers
						this.y + this._hitbox_y2 - this.carrying._hitbox_y2 // Not below floor
					);
			
			
				// Upwards
				let an = this.GetLookAngle();
				let look_xx = Math.sin( an );
				let look_yy = Math.cos( an );
				if ( look_yy < 0 )
				if ( Math.abs( look_xx ) < Math.abs( look_yy ) )
				{
					xx = this.x;
					yy = this.y + this._hitbox_y1 - this.carrying._hitbox_y2 - safe_area;
				}*/
				
				this.carrying.PlayerIsCarrying( this, GSPEED );
				if ( this.carrying )
				{
					if ( !this._carried_item_collision_filter )
					{
						this._carried_item_collision_filter = ( e )=>
						{
							return ( e !== this && e._hard_collision );
						};
					}
					
					if ( this.carrying.CanMoveWithoutOverlap( xx, yy, 0, this._carried_item_collision_filter ) )
					{
						this.carrying.x = xx;
						this.carrying.y = yy;
					}
					else
					{
						both:
						for ( let di = 0; di < 32; di += 2 )
						for ( let a = 0; a < 16; a++ )
						{
							let an = a / 16 * Math.PI * 2;

							let xx2 = xx + Math.sin( an ) * di;
							let yy2 = yy + Math.cos( an ) * di;

							if ( this.carrying.CanMoveWithoutOverlap( xx2, yy2, 0, this._carried_item_collision_filter ) )
							if ( sdWorld.CheckLineOfSight( this.x + off.x, this.y + off.y, xx2, yy2, null, null, null, sdWorld.FilterOnlyVisionBlocking ) ) // Make sure item can be seen by player
							{
								this.carrying.x = xx2;
								this.carrying.y = yy2;
								break both;
							}
						}
					}
					this.carrying.sx = 0;
					this.carrying.sy = 0;
				}
			}
		}
		
		if ( this._previous_carrying )
		if ( sdWorld.time > this._previous_carrying_ignore_until || this._previous_carrying._is_being_removed )
		this._previous_carrying = null;
		
		if ( this.hea > 0 && this._frozen <= 0 )
		{
			if ( sdWorld.is_server )
			if ( this.carrying )
			if ( this._key_states.GetKey( 'Mouse1' ) )
			{
				this.weapon_stun_timer = Math.max( this.weapon_stun_timer, 15 );
				
				let an = this.GetLookAngle();
				let xx = Math.sin( an );
				let yy = Math.cos( an );
				
				let vel = 3 * 1.3;
				
				let c = this.carrying;
				this.DropCrystal( this.carrying );
				
				sdSound.PlaySound({ name:'sword_attack2', x:this.x, y:this.y, volume: 0.5, pitch: 0.8 });
				
				//if ( yy < 0 )
				//yy *= 1.3;
				
				c.sx = this.sx + xx * vel;
				c.sy = this.sy + yy * vel;
				
				if ( !this.stands )
				{
					this.sx -= xx * vel * c.mass / this.mass;
					this.sy -= yy * vel * c.mass / this.mass;
				}
			}
			
			if ( e_state )
			if ( e_state !== this._last_e_state )
			{
				let potential_carry_target = null;
				
				let range_mult = this.s / 100;
				
				if ( !this.driver_of && this.is( sdCharacter ) && !this.carrying )
				{
					let an = this.GetLookAngle();
					let xx = Math.sin( an );
					let yy = Math.cos( an );

					let offset = this.GetBulletSpawnOffset();
																				
					let x1 = this.x + offset.x;
					let y1_original = this.y + offset.y;
					let x2 = this.x + offset.x + xx * 32 * range_mult;
					let y2 = this.y + offset.y + yy * 32 * range_mult;
					
					both:
					for ( let tries = 0; tries < 3; tries++ )
					{
						let y1;
						
						if ( tries === 0 )
						y1 = ( y1_original + this.y + this._hitbox_y1 ) / 2; // A bit higher to allow picking up items from 1 block higher
						else
						if ( tries === 1 )
						y1 = y1_original;
						else
						y1 = ( y1_original + this.y + this._hitbox_y2 ) / 2; // And a bit lower to get crystals from 1 block holes horizontally

						let di = sdWorld.Dist2D( x1,y1,x2,y2 );
						let step = 4 * range_mult;
						let radius = 3 * range_mult;

						for ( let s = step / 2; s < di - step / 2; s += step )
						{
							let x = x1 + ( x2 - x1 ) / di * s;
							let y = y1 + ( y2 - y1 ) / di * s;
							
							//sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_WALL_HIT });

							if ( sdWorld.CheckWallExistsBox( 
								x - radius, 
								y - radius, 
								x + radius, 
								y + radius, this, null, null, null ) )
							{
								if ( sdWorld.last_hit_entity )
								if ( sdWorld.last_hit_entity.IsCarriable( this ) )
								{
									potential_carry_target = sdWorld.last_hit_entity;

									if ( potential_carry_target.held_by )
									{
										if ( potential_carry_target.held_by.DropCrystal( potential_carry_target ) )
										{

										}
										else
										potential_carry_target = null;
									}
									
									if ( potential_carry_target )
									break both;
								}

								break;
							}
						}
					}
				}
				
				
				if ( this.carrying )
				{
					if ( sdWorld.is_server )
					this.DropCrystal( this.carrying );
				}
				else
				if ( potential_carry_target )
				{
					if ( sdWorld.is_server )
					{
						this.carrying = potential_carry_target;
						this.carrying.held_by = this;
						this.carrying.onCarryStart();

						sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });

						if ( this._stands_on === this.carrying )
						{
							this.stands = false;
							this._stands_on = null;
						}
					}
				}
				else
				if ( this.driver_of )
				{
					this.driver_of.ExcludeDriver( this );
				}
				else
				{
					if ( this._potential_vehicle && ( this._potential_vehicle.hea || this._potential_vehicle._hea ) > 0 && !this._potential_vehicle._is_being_removed && sdWorld.inDist2D_Boolean( this.x, this.y, this._potential_vehicle.x, this._potential_vehicle.y, sdCom.vehicle_entrance_radius ) )
					{
						this._potential_vehicle.AddDriver( this );

						if ( this._potential_vehicle.IsFakeVehicleForEKeyUsage() )
						{
						}
						else
						if ( this.driver_of === null ) // Vehicles did not allow entrance. Doing it like this because sdWorkBench is also a vehicle now which is why it is able to give extra build options. It had issue with preventing ghost mode near work benches
						this.TogglePlayerAbility();
					}
					else
					this.TogglePlayerAbility();
				}
			}
		}

		this._last_e_state = e_state;
	}
	
	CanUnCrouch()
	{
		return !sdWorld.CheckWallExistsBox( 
			this.x + this._hitbox_x1 + 1, 
			this.y + ( - this.s / 100 * 12 ) + 1, 
			this.x + this._hitbox_x2 - 1, 
			this.y + this._hitbox_y2 - 1, this, this.GetIgnoredEntityClasses(), this.GetNonIgnoredEntityClasses(), this.GetCurrentCollisionFilter() );
	}
	
	ConnectedGodLogic( GSPEED )
	{
		if ( this._socket )	
		if ( this._god )
		{
			this.matter_max = 10000; // Hack
			this.matter = this.matter_max; // Hack
			this.hea = this.hmax; // Hack
			this._dying = false; // Hack
			this.air = sdCharacter.air_max; // Hack
			this._nature_damage = 0; // Hack
			this._player_damage = 0; // Hack
		}
	}
	
	IsOutOfBounds()
	{
		//if ( !sdWorld.inDist2D_Boolean( 0,0, this.x, this.y, sdWorld.server_config.open_world_max_distance_from_zero_coordinates ) )
		if ( ( sdWorld.server_config.enable_bounds_move && sdWorld.server_config.aggressive_hibernation ) || sdWorld.server_config.forced_play_area )
		if ( Math.abs( this.x ) > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_x ||
			 this.y < sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_min ||
			 this.y > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_max )
		{
			return true;
		}
		
		return false;
	}

	isSnapshotDecodingAllowed( snapshot ) // Same for guns
	{
		if ( !sdWorld.is_server )
		{
			if ( this.sync === -1 )
			return true;
		
			if ( this.sync !== snapshot.sync )
			return true;
	
			return false;
		}
		return true;
	}
	PlayerClassThinkPausedLogic( GSPEED )
	{
		if ( !sdWorld.is_singleplayer )
		if ( sdWorld.is_server )
		if ( this._socket && this._socket.last_gsco_time > sdWorld.time - 1000 && this.hea > 0 && this._frozen <= 0 && !sdCharacter.allow_alive_players_think )
		{
			this._GSPEED_buffer_length_allowed += GSPEED;
			return true;
		}
		
		if ( sdWorld.is_server )
		this.sync = ( this.sync + 1 ) % 100; // Additionally done at index.js
		
		return false;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.PlayerClassThinkPausedLogic( GSPEED ) )
		return;
		
		if ( sdWorld.is_server )
		this.lst = sdLost.entities_and_affection.get( this ) || 0;
	
		if ( this._respawn_protection > 0 )
		this._respawn_protection = Math.max( 0, this._respawn_protection - GSPEED );
	
		this.ConnectedGodLogic( GSPEED );
		
		let cube_forgiveness_rate;
		
		if ( this.build_tool_level > 45 )
		cube_forgiveness_rate = 0.25;
		else
		if ( this.build_tool_level > 30 )
		cube_forgiveness_rate = 0.5;
		else
		if ( this.build_tool_level > 15 )
		cube_forgiveness_rate = 0.75;
		else
		if ( this.build_tool_level > 5 )
		cube_forgiveness_rate = 1;
		else
		cube_forgiveness_rate = 2;

		this._nature_damage = sdWorld.MorphWithTimeScale( this._nature_damage, 0, 0.9983, GSPEED * cube_forgiveness_rate );
		this._player_damage = sdWorld.MorphWithTimeScale( this._player_damage, 0, 0.9983, GSPEED * cube_forgiveness_rate );

		if ( sdWorld.is_server && this._hook_projectile )
		{
			let di = sdWorld.Dist2D( this._hook_projectile.x, this._hook_projectile.y, this.x, this.y );
			if ( di > 1000 ) this._hook_projectile.remove(); // Prevent use of teleports

			if ( this._hook_projectile._is_being_removed )
			{
				this._hook_projectile = null;
				this.hook_projectile_net_id = -1;
			}
		}
		/*
		if ( this._score >= this._score_to_level && this.build_tool_level < this._max_level )
		{
			this.build_tool_level++;
			this._score_to_level_additive = this._score_to_level_additive * 1.04;
			this._score_to_level = this._score_to_level + this._score_to_level_additive;
		}*/
																		
		this.ManagePlayerFlashLight();
		
		this.ManagePlayerVehicleEntrance( GSPEED ); // Before fire logic, because Mouse1 will throw crystals and it needs to block attacks
		
		if ( this.hea <= 0 )
		{
			if ( this.AttemptTeleportOut( null, false, this.hea ) )
			return;
		
			this.MatterGlow( 0.01, 30, GSPEED );

			if ( this.death_anim < 90 )
			this.death_anim += GSPEED;
			else
			if ( sdWorld.is_server ) // From local testing, didn't seem to despawn Extract task SD's - Booraz
			{
				
				if ( !this._allow_despawn )
				{
					// Some AI characters for tasks
				}
				else
				if ( this._socket === null )
				{
					// Normal players and simple AI like starter instructor, perhaps
					this.death_anim += GSPEED;
				
					if ( this.death_anim > sdCharacter.disowned_body_ttl )
					this.remove();
				}
			}
		}
		else
		{
			if ( this._ai_enabled > 0 )
			{
				if ( !this._ai )
				{
					this._ai = {};
					
					if ( this._ai_team !== 0 )
					this.mobility = 33;
				}

				this.AILogic( GSPEED );
			}
			
			if ( this._sickness > 0 )
			{
				this._sickness -= GSPEED;
				
				this._sick_damage_timer += GSPEED;
				//if ( this._sick_damage_timer > 6000 / this._sickness )
				if ( this._sick_damage_timer > 60 )
				{
					this._sick_damage_timer = 0;
					
					//this._sickness = Math.max( 0, this._sickness - 10 );
					this.DamageWithEffect( 10, this._last_sickness_from_ent, false, false );
					sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_BLOOD_GREEN, filter:'none' });
					
					// And then it spreads to players near, sounds fun
					
					let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 90, null, [ 'sdCharacter' ] );
					
					let itself = targets_raw.indexOf( this );
					if ( itself !== -1 )
					targets_raw.splice( itself, 1 );
					
					for ( let i = 0; i < targets_raw.length; i++ )
					{
						if ( targets_raw[ i ].IsTargetable( this ) )
						targets_raw[ i ]._sickness += 5 / targets_raw.length;
					}
				}

				if ( this._sickness <= 0 )
				{
					this._last_sickness_from_ent = null;
				}
			}


			if ( this._dying )
			{
				//this.DamageWithEffect( GSPEED * 0.1, null, false, false );
				this.Damage( GSPEED * 0.1, null, false, false );
				
				if ( this._ai_enabled )
				{
					this.stability = -100;
				}
				
				if ( this._dying_bleed_tim <= 0 )
				{
					this._dying_bleed_tim = 15;
					this.PlayDamageEffect( this.x, this.y );
					//sdWorld.SendEffect({ x:this.x, y:this.y, type:this.GetBleedEffect(), filter:this.GetBleedEffectFilter() });
				}
				else
				this._dying_bleed_tim -= GSPEED;
			}
			else
			{
				if ( this.hea < this.hmax )
				{
					this._regen_timeout -= GSPEED;
					if ( this._regen_timeout < 0 )
					{
						if ( this.matter > GSPEED * 0.15 )
						{
							this.matter -= GSPEED * 0.15; // 0.3
							this.DamageWithEffect( -GSPEED );
						}
					}
				}
				if ( this.armor < this.armor_max && this._armor_repair_amount > 0 )
				{
					this._regen_timeout -= GSPEED;
					if ( this._regen_timeout < 0 )
					{
						if ( this.matter > GSPEED )
						{
							this.matter -= GSPEED * 0.1 * ( this._armor_repair_amount / 1000 ); // 0.15
							this.armor += Math.min( this.armor_max, this._armor_repair_mult * GSPEED * ( this._armor_repair_amount / 3000 ) );
							//this._armor_repair_amount -= GSPEED * 1 / 6;
						}
					}
				}
			}
			
			if ( this.pain_anim > 0 )
			this.pain_anim -= GSPEED;

			if ( sdWorld.is_server )
			{
				/*if ( this._wb_timer > 0 && this.workbench_level > 0 )
				if ( this.sx !== 0 || this.sy !== 0 ) // Do not affect timer unless player is moving, a circumvent solution for static players at workbench
				this._wb_timer -= GSPEED;
				if ( this._wb_timer <= 0 && this.workbench_level > 0 )
				this.workbench_level = 0;*/

				//this._task_reward_counter = Math.min(1, this._task_reward_counter + GSPEED / 1800 ); // For testing

				if ( this._task_reward_counter >= 1 )
				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'CLAIM_REWARD-'+this._net_id, 
					executer: this,
					mission: sdTask.MISSION_TASK_CLAIM_REWARD
				});
			}

			//let offset = this.GetBulletSpawnOffset();

			//this._an = -Math.PI / 2 - Math.atan2( this.y + offset.y - this.look_y, this.x + offset.x - this.look_x );
			
			
			
			this.ReloadAndCombatLogic( GSPEED );

			if ( this.matter < this._matter_regeneration * 20 )
			if ( !this.ghosting && !this._shielding )
			{
				if ( sdWorld.is_server )
				if ( this.matter < this.matter_max ) // Character cannot store or regenerate more matter than what it can contain
				{
					//this.matter += 1 / 30 * GSPEED;
					this.matter = Math.min( this.matter_max, this._matter_regeneration * 20, this.matter + ( 1 * this._matter_regeneration_multiplier ) / 30 * GSPEED );
				}
			}			
			
			this.DropWeaponLogic( GSPEED );
			this.WeaponSwitchLogic( GSPEED );
			
			/*if ( this._auto_shoot_in <= 0 )
			{
				if ( this._key_states.GetKey( 'KeyV' ) )
				{
					this._key_states.SetKey( 'KeyV', 0 ); // So sword is not dropped all the time

					if ( this._inventory[ this.gun_slot ] )
					{
						//if ( this.gun_slot === 0 )
						if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ] )
						if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_sword )
						{
							this._inventory[ this.gun_slot ].dangerous = true;
							this._inventory[ this.gun_slot ]._dangerous_from = this;

							if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound )
							sdSound.PlaySound({ name:sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound, x:this.x, y:this.y, volume: 0.5 * ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound_volume || 1 ), pitch: 0.8 * ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound_pitch || 1 ) });
						}
						
						this.DropWeapon( this.gun_slot );

						this.gun_slot = 0;
						if ( sdWorld.my_entity === this )
						sdWorld.PreventCharacterPropertySyncForAWhile( 'gun_slot' );
						
						if ( this.reload_anim > 0 )
						this.reload_anim = 0;
						
						this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
					}
				}

				if ( this._key_states.GetKey( 'KeyQ' ) )
				{
					if ( !this._q_held )
					{
						this._q_held = true;

						let b = this._backup_slot;
						if ( !this._inventory[ b ] )
						b = 0;

						this._backup_slot = this.gun_slot;
						this.gun_slot = b;
						if ( sdWorld.my_entity === this )
						sdWorld.PreventCharacterPropertySyncForAWhile( 'gun_slot' );

						if ( this.reload_anim > 0 )
						this.reload_anim = 0;
						
						this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
					}
				}
				else
				{
					this._q_held = false;
					for ( var i = 0; i < 10; i++ )
					if ( this._inventory[ i ] || i === 0 )
					if ( this._key_states.GetKey( 'Digit' + i ) || ( i === 0 && this._key_states.GetKey( 'Backquote' ) ) )
					{
						if ( this.gun_slot !== i )
						{
							this._backup_slot = this.gun_slot;
							this.gun_slot = i;
							if ( sdWorld.my_entity === this )
							sdWorld.PreventCharacterPropertySyncForAWhile( 'gun_slot' );

							if ( this.reload_anim > 0 )
							this.reload_anim = 0;
						
							this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
						}
						break;
					}
				}
			}*/
			
		
			this._side = ( this.x < this.look_x ) ? 1 : -1;
		}
	
		this.HandlePlayerPowerups( GSPEED );
		

		let act_y_or_unstable = ( this.driver_of || this._frozen > 0 ) ? 0 : this.act_y;
		
		if ( this.stability < 50 )
		act_y_or_unstable = 1;
	
	
		//let new_x = this.x + this.sx * GSPEED;
		//let new_y = this.y + this.sy * GSPEED;
		
		let speed_scale = 1 * ( 1 - ( this.armor_speed_reduction / 100 ) );
		speed_scale *= Math.max( 0.3, this.stability / 100 );
		
		let walk_speed_scale = speed_scale;
		walk_speed_scale *= ( this.mobility / 100 );
		
		if ( act_y_or_unstable )
		walk_speed_scale *= 0.5;
	
		let can_uncrouch = -1;
		
		//let target_crouch = ( this.stability < 50 ) ? 3 : Math.max( 0, act_y_or_unstable );
		let target_crouch = ( this.stability < 50 ) ? 3 : Math.max( 0, act_y_or_unstable );
		
		if ( this._crouch_intens !== target_crouch )
		{
			let morph_speed = ( this.stability < 50 ) ? 0.9 : 0.7;
		
			if ( this._crouch_intens <= target_crouch )
			{
				this._crouch_intens = sdWorld.MorphWithTimeScale( this._crouch_intens, target_crouch, morph_speed, GSPEED );
				
				this._crouch_intens = Math.min( this._crouch_intens + morph_speed * GSPEED * 0.1, target_crouch );
				
				// Snap
				//if ( Math.abs( this._crouch_intens - target_crouch ) < 0.05 )
				//this._crouch_intens = target_crouch;
			}
			else
			{
				if ( can_uncrouch === -1 )
				can_uncrouch = this.CanUnCrouch();

				if ( can_uncrouch )
				{
					this._crouch_intens = sdWorld.MorphWithTimeScale( this._crouch_intens, target_crouch, morph_speed, GSPEED );
				
					this._crouch_intens = Math.max( this._crouch_intens - morph_speed * GSPEED * 0.1, target_crouch );

					// Snap
					//if ( Math.abs( this._crouch_intens - target_crouch ) < 0.05 )
					//this._crouch_intens = target_crouch;
				}
			}
		}
		/*if ( ( ( act_y_or_unstable === 1 ) ? 1 : 0 ) !== this._crouch_intens )
		{
			let target_crouch = ( this.stability < 50 ) ? 3 : 1;

			if ( act_y_or_unstable === 1 )
			{
				if ( this._crouch_intens < target_crouch - 0.01 )
				this._crouch_intens = sdWorld.MorphWithTimeScale( this._crouch_intens, target_crouch, 0.7, GSPEED );
				else
				this._crouch_intens = target_crouch;
			}
			else
			{
				if ( this._crouch_intens > 0 )
				{
					if ( can_uncrouch === -1 )
					can_uncrouch = this.CanUnCrouch();
					
					if ( can_uncrouch )
					{
						if ( this._crouch_intens > 0.01 )
						this._crouch_intens = sdWorld.MorphWithTimeScale( this._crouch_intens, 0, 0.7, GSPEED );
						else
						this._crouch_intens = 0;
					}
				}
			}
		}*/
		
		let last_ledge_holding = this._ledge_holding;
	 
		let ledge_holding = false;
		this._ledge_holding = false;
		
		if ( sdWorld.is_server || sdWorld.my_entity === this )
		{
			if ( this.hea > 0 )
			{
				this.act_x = this._key_states.GetKey( 'KeyD' ) - this._key_states.GetKey( 'KeyA' );
				this.act_y = this._key_states.GetKey( 'KeyS' ) - ( ( this._key_states.GetKey( 'KeyW' ) || this._key_states.GetKey( 'Space' ) ) ? 1 : 0 );
				
				if ( this._socket || this._ai || sdWorld.my_entity === this )
				if ( this.act_x !== 0 || this.act_y !== 0 )
				this.PhysWakeUp();
			}
			else
			{
				this.act_x = 0;
				this.act_y = 0;
			}
		}
	
		if ( sdWorld.is_server )
		{
			/*if ( this.hea > 0 )
			{
				this.act_x = this._key_states.GetKey( 'KeyD' ) - this._key_states.GetKey( 'KeyA' );
				this.act_y = this._key_states.GetKey( 'KeyS' ) - ( ( this._key_states.GetKey( 'KeyW' ) || this._key_states.GetKey( 'Space' ) ) ? 1 : 0 );
			}
			else
			{
				this.act_x = 0;
				this.act_y = 0;
			}*/

			if ( this.hea > 0 && ( !this.driver_of || this.hook_relative_to ) && ( this._key_states.GetKey( 'Mouse2' ) || this._key_states.GetKey( 'KeyC' ) ) && this._hook_allowed && this._frozen <= 0 )
			{
				if ( this._hook_once )
				{
					this._hook_once = false;

					if ( this._hook_projectile && !this._hook_projectile._is_being_removed )
					{
						sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:1, pitch:2 });
						this._hook_projectile.remove();
					}
					else
					if ( !this.hook_relative_to )
					{
						this._hook_once = false;
						
						let offset = this.GetBulletSpawnOffset();
						
						let bullet_obj = new sdBullet({ x: this.x + offset.x, y: this.y + offset.y });
						bullet_obj._owner = this;
						let an = this.GetLookAngle();
						let vel = 16;

						bullet_obj.sx = Math.sin( an ) * vel;
						bullet_obj.sy = Math.cos( an ) * vel;

						bullet_obj.color = '#333333';

						//for ( var p in sdGun.classes[ sdGun.CLASS_HOOK ].projectile_properties )
						//bullet_obj[ p ] = sdGun.classes[ sdGun.CLASS_HOOK ].projectile_properties[ p ];

						bullet_obj._hook = true;
						bullet_obj._damage = 0;
						bullet_obj.time_left = 20;
						bullet_obj.model = 'grapple_hook'
						bullet_obj._affected_by_gravity = true;
						bullet_obj.gravity_scale = 2;
						
						if ( this._hook_projectile )
						if ( !this._hook_projectile._is_being_removed )
						this._hook_projectile.remove();

						sdEntity.entities.push( bullet_obj );

						this._hook_projectile = bullet_obj;
						this.hook_projectile_net_id = bullet_obj._net_id;
					}
					else
					{
						sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:1, pitch:2 });
						this.hook_relative_to = null;
						this.hook_len = -1;
						
						this.PhysWakeUp();
					}
				}
			}
			else
			{
				//if ( this.hook_x !== 0 )
				//console.warn('hook reset');

				this._hook_once = true;
			}
		}

		if ( this.hook_relative_to )
		{
			/*let my_ent = this;

			if ( this.driver_of )
			my_ent = this.driver_of;*/

			let hook_x = 0;	
			let hook_y = 0;

			//if ( this.hook_relative_to )
			{
				hook_x = this.hook_relative_to.x + this.hook_relative_x;
				hook_y = this.hook_relative_to.y + this.hook_relative_y;

				//if ( this.hook_relative_to.is( sdCube ) )
				this.hook_relative_to.PlayerIsHooked( this, GSPEED );
			}

			let from_y = this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2;

			let cur_di = sdWorld.Dist2D( this.x, from_y, hook_x, hook_y );

			if ( cur_di < 1 )
			cur_di = 1;

			if ( this.hook_len === -1 )
			this.hook_len = cur_di;
		
			let max_length = 8.5 * 48;
		
			if ( this._upgrade_counters.upgrade_hook > 1 )
			if ( this._key_states.GetKey( 'Mouse3' ) )
			{
				//let off = this.GetBulletSpawnOffset();
				let target_di = sdWorld.Dist2D( this.look_x, this.look_y, this.x, from_y );
				
				if ( target_di < 4 )
				target_di = 4;
			
				if ( target_di > max_length )
				target_di = max_length;
			
				let speed = 2;
				
				if ( this.hook_len < target_di )
				this.hook_len = Math.min( target_di, this.hook_len + GSPEED * speed );
				else
				if ( this.hook_len > target_di )
				this.hook_len = Math.max( target_di, this.hook_len - GSPEED * speed );
			}

			if ( cur_di > this.hook_len + 128 || this.hook_len > max_length + 16 )
			{
				//hook_x = 0;
				//hook_y = 0;

				sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:1, pitch:2 });
				this.hook_relative_to = null;
				this.hook_len = -1;
			}
			else
			{

				let pull_force = -( this.hook_len - cur_di ) / 15;
				let vx = ( hook_x - this.x ) / cur_di;
				let vy = ( hook_y - from_y ) / cur_di;

				let my_ent = this;
				if ( this.driver_of )
				{
					if ( typeof this.driver_of.sx !== 'undefined' )
					if ( typeof this.driver_of.sy !== 'undefined' )
					my_ent = this.driver_of;
				}

				let self_effect_scale = 1;

				if ( this.hook_relative_to )
				{
					if ( typeof this.hook_relative_to.sx !== 'undefined' )
					{
						let lx = this.hook_relative_to.sx;
						let ly = this.hook_relative_to.sy;

						self_effect_scale = this.hook_relative_to.mass / ( this.hook_relative_to.mass + my_ent.mass );

						if ( pull_force > 0.4 )
						this.hook_relative_to.PhysWakeUp();

						this.hook_relative_to.sx -= vx * pull_force * GSPEED * ( 1 - self_effect_scale );
						this.hook_relative_to.sy -= vy * pull_force * GSPEED * ( 1 - self_effect_scale );

						this.hook_relative_to.sx = sdWorld.MorphWithTimeScale( this.hook_relative_to.sx, my_ent.sx, 0.8, GSPEED * ( 1 - self_effect_scale ) );
						this.hook_relative_to.sy = sdWorld.MorphWithTimeScale( this.hook_relative_to.sy, my_ent.sy, 0.8, GSPEED * ( 1 - self_effect_scale ) );

						//if ( this.hook_relative_to.is( sdCharacter ) )
						if ( this.hook_relative_to.IsPlayerClass() )
						this.hook_relative_to.ApplyServerSidePositionAndVelocity( true, this.hook_relative_to.sx - lx, this.hook_relative_to.sy - ly );

						if ( this.hook_relative_to._hiberstate === sdEntity.HIBERSTATE_HIBERNATED )
						this.hook_relative_to.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

						if ( isNaN( this.hook_relative_to.sx ) )
						{
							throw new Error('sdCharacter\'s hook causes attached item to have NaN velocity '+[
								this.hook_relative_to.mass,
								this.mass,
								self_effect_scale,
								cur_di,
								vx,
								vy,
								pull_force,
								GSPEED,
								lx,
								ly,
								this.sx,
								this.sy

							].join(',') );
						}

						pull_force /= 2;
					}
					else
					{
						// Some slowdown for case of hooking something while in Hover
						if ( my_ent !== this )
						{
							my_ent.sx = sdWorld.MorphWithTimeScale( my_ent.sx, 0, 0.8, GSPEED * ( 0.3 ) );
							my_ent.sy = sdWorld.MorphWithTimeScale( my_ent.sy, 0, 0.8, GSPEED * ( 0.3 ) );
						}
					}

					if ( this.hook_relative_to._is_being_removed || this.hook_relative_to === this.driver_of || ( this.hook_relative_to.IsCuttingHook() ) )
					{
						//this.hook_x = 0;
						//this.hook_y = 0;

						sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:1, pitch:2 });
						this.hook_relative_to = null;
						this.hook_len = -1;
					}
				}

				my_ent.sx += vx * pull_force * GSPEED * self_effect_scale;
				my_ent.sy += vy * pull_force * GSPEED * self_effect_scale;

			}
		}
		

		let old_stands = this.stands ? this._stands_on : null;
		this.stands = false;

		/*
		if ( sdWorld.CheckWallExists( this.x + this._hitbox_x1 + 2, new_y + leg_height ) ||
			 sdWorld.CheckWallExists( this.x + this._hitbox_x2 - 2, new_y + leg_height ) )
		{
			this.stands = true;

			if ( sdWorld.CheckWallExists( this.x + this._hitbox_x1 + 2, new_y + leg_height - 1 ) ||
				 sdWorld.CheckWallExists( this.x + this._hitbox_x2 - 2, new_y + leg_height - 1 ) ) // Intersection overlap prevention
			{
				this.y -= 0.5;
				new_y -= 0.5;
			}
		}*/

		this._in_air_timer += GSPEED;

		if ( this.hea > 0 ) // Disable extra logic for stuck cases, standing and ledge holding if dead
		{
			let still_stands = false;

			if ( old_stands )
			{
				const max_stand_on_elevation = sdCharacter.max_stand_on_elevation;
				
				if ( !this._stands_on._is_being_removed )
				if ( this._stands_on._hard_collision )
				// Copy "stands on detection" [ 1 / 2 ]
				if ( this.x + this._hitbox_x1 < this._stands_on.x + this._stands_on._hitbox_x2 )
				if ( this.x + this._hitbox_x2 > this._stands_on.x + this._stands_on._hitbox_x1 )
				if ( this.y + this._hitbox_y1 + max_stand_on_elevation <= this._stands_on.y + this._stands_on._hitbox_y2 )
				if ( this.y + this._hitbox_y2 + max_stand_on_elevation >= this._stands_on.y + this._stands_on._hitbox_y1 )
				{
					sdWorld.last_hit_entity = this._stands_on;

					still_stands = true;
				}

				if ( !still_stands )
				if ( Math.abs( this.sx ) > 0.01 ) // Moving left/right, it is only needed for seamless sliding
				{
					sdWorld.last_hit_entity = null;
					if ( sdWorld.CheckWallExistsBox( this.x + this._hitbox_x1, this.y + this._hitbox_y1 + max_stand_on_elevation, this.x + this._hitbox_x2, this.y + this._hitbox_y2 + max_stand_on_elevation, this, this.GetIgnoredEntityClasses(), null, this.GetCurrentCollisionFilter() ) )
					if ( sdWorld.last_hit_entity )
					{
						// Sets sdWorld.last_hit_entity;

						this._stands_on = sdWorld.last_hit_entity;
						this._stands_on.onMovementInRange( this );

						still_stands = true;
					}
				}
			}

			if ( still_stands )
			{
				/*let new_hit = sdWorld.last_hit_entity;
				
				this.stands = true;
				
				if ( this._stands_on !== new_hit )
                this.Touches( this._stands_on );
			
				this._stands_on = new_hit;
				
				if ( this._stands_on )
				if ( !this._in_water )
				this.y = this._stands_on.y + this._stands_on._hitbox_y1 - this._hitbox_y2;

				this._in_air_timer = 0;

				if ( !old_stands ) // Less calls of cases of moving on top of same surface?
				this.Touches( new_hit );
				*/
				this.stands = true;
				this._in_air_timer = 0;
			}
			else
			{
				if ( this._stands_on )
				this._stands_on = null;
			
				if ( this.hea > 0 )
				if ( this.act_x !== 0 )
				if ( !this.driver_of )
				if ( sdWorld.CheckWallExistsBox( this.x + this.act_x * 7, this.y, this.x + this.act_x * 7, this.y + 10, null, null, sdCharacter.climb_filter, this.GetCurrentCollisionFilter() ) )
				{
					let ledge_target = sdWorld.last_hit_entity;
					if ( !sdWorld.CheckWallExists( this.x + this.act_x * 7, this.y + this._hitbox_y1, null, null, sdCharacter.climb_filter, this.GetCurrentCollisionFilter() ) )
					{
						ledge_holding = true;

						if ( this._ragdoll )
						{
							if ( ledge_target )
							{
								if ( this.x < ledge_target.GetCenterX() )
								this._ragdoll._ledge_holding_x = ledge_target.x + ledge_target._hitbox_x1;
								else
								this._ragdoll._ledge_holding_x = ledge_target.x + ledge_target._hitbox_x2;
								
								this._ragdoll._ledge_holding_y = ledge_target.y + ledge_target._hitbox_y1;
								
								this._ragdoll._ledge_holding_defined = true;
							}
							else
							{
								this._ragdoll._ledge_holding_defined = false;
							}
						}
					}
				}
			}
		}


		// Walljumps
		/*if ( act_y_or_unstable === -1 )
		if ( !this.stands )
		if ( !this.driver_of )
		if ( Math.abs( this.sy ) < 3 )
		if ( Math.abs( this.sx ) < 3 )*/
		{
			// Too inconsistent and is rather annoying
			/*if ( this.act_x !== -1 )
			if ( sdWorld.CheckWallExists( this.x + this._hitbox_x1 - 5, this.y, this ) )
			{
				this.sy = -3;
				this.sx = 2.5;
			}
			if ( this.act_x !== 1 )
			if ( sdWorld.CheckWallExists( this.x + this._hitbox_x2 + 5, this.y, this ) )
			{
				this.sy = -3;
				this.sx = -2.5;
			}*/
			
			
			if ( !this.stands )
			if ( this.act_y === -1 )
			if ( Math.abs( this.sy ) <= 3 )
			if ( Math.abs( this.sx ) <= 3 )
			if ( this._frozen <= 0 )
			//if ( sdWorld.CheckWallExists( this.x + this._hitbox_x1 - 8, this.y, this ) )
			//if ( sdWorld.CheckWallExists( this.x + this._hitbox_x2 + 8, this.y, this ) )
			if ( !this.CanMoveWithoutOverlap( this.x - 8, this.y, 0, this.GetCurrentCollisionFilter() ) )
			if ( !this.CanMoveWithoutOverlap( this.x + 8, this.y, 0, this.GetCurrentCollisionFilter() ) )
			{
				this.sy = Math.min( this.sy, -2 );
			}
		}
		
		let in_water = sdWater.all_swimmers.has( this );
		
		this._in_water = in_water;
		
		if ( this._frozen <= 0 && ( ( this._key_states.GetKey( 'KeyX' ) && !this.driver_of ) || ( in_water && !this._can_breathe ) ) )
		{
			//this.tilt_speed += this.act_x * 1 * GSPEED;
			
			//this.tilt_speed = sdWorld.MorphWithTimeScale( this.tilt_speed, this.act_x * 30, 0.9, GSPEED );
			
			//speed_scale = 0.1 * ( 1 - ( this.armor_speed_reduction / 100 ) );
			
			if ( in_water && !this._can_breathe )
			this.stability = Math.min( 10, this.stability );
			else
			this.stability = Math.min( 0, this.stability );
		}
		else
		{
			if ( this.stability < 100 )
			{
				if ( can_uncrouch === -1 )
				can_uncrouch = this.CanUnCrouch();

				if ( this._crouch_intens <= 1 || can_uncrouch )
				this.stability = Math.min( 100, this.stability + ( Math.max( 0, this.stability ) * 0.1 + GSPEED * 2.5 * this._stability_recovery_multiplier ) * GSPEED );
			}
		}
	
		//this.tilt += this.tilt_speed * GSPEED;
		
		
		if ( this.ghosting )
		{
			let fuel_cost = 0.4 * GSPEED * this._ghost_cost_multiplier; // 0.4 Previously
			
			if ( this.matter < fuel_cost || this.hea <= 0 || this.driver_of )
			{
				//this.ghosting = false;
				this.TogglePlayerAbility();
			}
			else
			this.matter -= fuel_cost;
		
			this._ghost_breath -= GSPEED;
			if ( this._ghost_breath < 0 )
			{
				this._ghost_breath = sdCharacter.ghost_breath_delay;
				sdSound.PlaySound({ name:'ghost_breath', x:this.x, y:this.y, volume:1 });
			}
		}
		if ( this._shielding && sdWorld.is_server )
		{
			let fuel_cost = 0.6 * GSPEED * this._shield_cost_multiplier; // 0.6 Previously
			
			if ( this.matter < fuel_cost || this.hea <= 0 || this.driver_of )
			{
				//this.ghosting = false;
				this.TogglePlayerAbility();
			}
			else
			this.matter -= fuel_cost;
		}
		
		//this.flying = true; // Hack
		
		if ( this.flying )
		{
			let di = Math.max( 1, sdWorld.Dist2D_Vector( this.act_x, this.act_y ) );
			
			let x_force = this.act_x / di * 0.1;
			let y_force = ( this.act_y * this._jetpack_power ) / di * 0.1 - sdWorld.gravity;
			
			let fuel_cost = GSPEED * sdWorld.Dist2D_Vector( x_force, y_force ) * this._jetpack_fuel_multiplier;

			if ( ( this.stands && this.act_y !== -1 ) || this.driver_of || this._in_water || this.act_y !== -1 || this._key_states.GetKey( 'KeyX' ) || this.matter < fuel_cost || this.hea <= 0 || this._frozen > 0 )
			this.flying = false;
			else
			{
				this.matter -= fuel_cost;
			
				let di = sdWorld.Dist2D_Vector( this.act_x, this.act_y );
				if ( di > 0 )
				{
					this.sx += x_force * GSPEED;
					this.sy += y_force * GSPEED;
				}
			}
			
			if ( !sdWorld.is_server || sdWorld.is_singleplayer )
			if ( sdRenderer.effects_quality > 1 )
			{
				if ( this._jetpack_effect_timer > 0 )
				this._jetpack_effect_timer -= GSPEED;
			
				if ( this._jetpack_effect_timer <= 0 )
				{
					let offset = ( this.look_x > this.x ) ? -6 : 6;
					let type = sdEffect.TYPE_SPARK;
					
					let e = new sdEffect({ type: type, x:this.x + offset, y:this.y, sx: this.sx / 2 + ( -Math.random() + Math.random() ) * 2, sy: this.sy / 2 + Math.random() * 4, color: '#ffff00' });
					sdEntity.entities.push( e );
					
					this._jetpack_effect_timer = 2;
				}
			}
		}
		else
		{
			//if ( sdWorld.is_server )
			if ( !this.driver_of )
			if ( this._jetpack_allowed &&
				 this.act_y === -1 &&
				 !in_water &&
				 this._in_air_timer > 200 / 1000 * 30 && // after 200 ms
				 //this._last_act_y !== -1 &&
				 !last_ledge_holding &&
				 this._frozen <= 0 &&
				 !this.stands )
			this.flying = true;
		
			//this._last_act_y = this.act_y;
		}
		
		let can_breathe = false;

		if ( sdWeather.only_instance )
		if ( sdWeather.only_instance.air > 0 )
		can_breathe = true;
	
		// Low score players ignore lack of air but won't ignore sdShurgConverter's
		if ( this._score < 100 )
		can_breathe = true;
	
		if ( can_breathe )
		for ( let i = 0; i < sdShurgConverter.converters.length; i++ )
		{
			let e = sdShurgConverter.converters[ i ];
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, e.x, e.y, 400 ) )
			{
				if ( e.should_drain_timer <= 0 )
				{
					can_breathe = false; // I've gone rusty with my coding again - Booraz149
					break;
				}
			}
		}
	
		// Players can't breathe past soft y limit
		if ( can_breathe )
		if ( sdWorld.server_config.enable_bounds_move && sdWorld.server_config.aggressive_hibernation )
		if ( this.y < sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_min_soft )
		can_breathe = false;
		
		// But can breathe in vehicles
		if ( !can_breathe )
		{
			if ( 
				 ( this.driver_of && this.driver_of.VehicleHidesDrivers() ) || 
				 this.FindObjectsInACableNetwork( (e)=>{ return ( e.hea > 0 ); }, sdHover ).length > 0
			)
			can_breathe = true;
		}
	
		// And near BSUs
		if ( !can_breathe )
		{
			for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
			{
				let e = sdBaseShieldingUnit.all_shield_units[ i ];
				if ( e.enabled )
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, e.x, e.y, sdBaseShieldingUnit.protect_distance ) )
				{
					can_breathe = true;
					break;
				}
			}
			if ( !can_breathe )
			if ( this.FindObjectsInACableNetwork( (e)=>{ return ( e.enabled ); }, sdBaseShieldingUnit ).length > 0 )
			can_breathe = true;
		}
		
		// And on top of RTPs
		if ( !can_breathe )
		if ( ( this.stands && this._stands_on && this._stands_on.is( sdRescueTeleport ) ) || this.FindObjectsInACableNetwork( null, sdRescueTeleport ).length > 0 )
		{
			can_breathe = true;
		}
		
		let out_of_bounds = false;
		
		if ( this.IsOutOfBounds() )
		{
			can_breathe = false;
			out_of_bounds = true;
		}
		
		/*if ( Math.abs( this.x ) > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_x ||
			 this.y < sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_min ||
			 this.y > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_max )
		{
			can_breathe = false;
			out_of_bounds = true;
		}*/
		
		/*if ( this._key_states.GetKey( 'KeyA' ) )
		{
			trace( { stands:this.stands, stands_on:this._stands_on, sx:this.sx, GSPEED:GSPEED } );
		}*/

		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.93, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.93, GSPEED );
			
			let x_force = this.act_x;
			let y_force = this.act_y;
			let di = sdWorld.Dist2D_Vector( x_force, y_force );
			if ( di > 1 )
			{
				x_force /= di;
				y_force /= di;
			}
			
			if ( this._frozen <= 0 )
			{
				this.sx += x_force * 0.2 * GSPEED;
				this.sy += y_force * 0.2 * GSPEED;
			}
			/*
			if ( !sdWorld.CheckWallExists( this.x, this.y + this._hitbox_y1, null, null, sdWater.water_class_array ) )
			{
				if ( this.act_y === -1 )
				this.sy = -3;
			}
			else*/
					
			if ( can_breathe )
			if ( sdWorld.CheckWallExists( this.x, this.y + this._hitbox_y1, null, null, sdWater.water_class_array ) )
			can_breathe = false;
		}
		else
		{
			if ( this.stands && ( !this.driver_of || !this.driver_of.VehicleHidesDrivers() ) && ( this._stands_on !== this.hook_relative_to || ( this.hook_x === 0 && this.hook_y === 0 ) ) )
			{
				if ( this.sy > -0.1 )
				{
					if ( this.sy > 1 )
					{
						if ( !this.ghosting )
						{
							if ( sdWorld.time > this._fall_sound_time + 100 ) // Flood will cause world snapshots to be delayed
							{
								this._fall_sound_time = sdWorld.time;
								sdSound.PlaySound({ name:this.GetStepSound(), x:this.x, y:this.y, volume:0.5 * this.GetStepSoundVolume(), pitch:this.GetStepSoundPitch() });
							}
						}
					}

					this.sy = 0;
				}

				/*this.tilt_speed = sdWorld.MorphWithTimeScale( this.tilt_speed, 0, 0.9, GSPEED );

				if ( this._key_states.GetKey( 'KeyX' ) && this.hea > 0 )
				this.tilt_speed += Math.sin( this.tilt / 100 * 2 ) * GSPEED;
				else
				{
					this.tilt -= Math.sin( this.tilt / 100 ) * 4 * GSPEED;
					this.tilt_speed -= Math.sin( this.tilt / 100 ) * 4 * GSPEED;
					this.tilt_speed = sdWorld.MorphWithTimeScale( this.tilt_speed, 0, 0.7, GSPEED );
				}*/
				
				/*if ( globalThis.CATCH_ERRORS )
				{
					//if ( isNaN( new_leg_height ) || new_leg_height === undefined )
					//throw new Error( 'new_leg_height is '+new_leg_height );
				
					if ( isNaN( leg_height ) || leg_height === undefined )
					{
						console.warn([
							this._hitbox_y2,
							this.s,
							this.death_anim,
							this._crouch_intens,
							this.tilt,
							this.hitbox_y2
						]);
						
						throw new Error( 'leg_height is '+leg_height );
					}
				
					if ( isNaN( this.y ) || this.y === undefined )
					throw new Error( 'this.y is '+this.y );
				}*/
				
				// No longer goes into ground, possibly doe to different hitbox cache handling
				//if ( new_leg_height !== leg_height )
				//this.y -= new_leg_height - leg_height;
			
				/*if ( new_leg_height > leg_height )
				{
					// Stands up from crouch - should be fine
					this.y -= new_leg_height - leg_height;
				}
				else
				{
					// Goes into crouch. Should be fine too?
					this.y -= new_leg_height - leg_height;
				}*/

				//this.y -= new_leg_height - leg_height; Causes dogs to somehow push player into the ground
				
				// Prevent leg shaking when stopping crouch, probably caused by stand target cache delaying fall, especially after step logic applied (it leaves player slightly floating)
				//if ( new_leg_height - leg_height > 0 )
				//this.sy += new_leg_height - leg_height;

				/*if ( Math.abs( Math.sin( this.tilt / 100 ) ) > 0.3 )
				{
					this._crouch_intens = 1;
					this.act_y = 1;

					this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.8, GSPEED );
				}
				else*/
				
				if ( !this.driver_of || !this.driver_of.VehicleHidesDrivers() )
				{
					if ( act_y_or_unstable === -1 )
					{
						this.sy = Math.min( this.sy, -4 * speed_scale /*( 1 - ( this.armor_speed_reduction / 100 ) )*/ );
					}
					else
					{
						this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.8, GSPEED );
						
						if ( !this.driver_of )
						this.sx += this.act_x * 1.25 * GSPEED * walk_speed_scale;

						let old_walk = this._anim_walk;
						this._anim_walk += Math.abs( this.sx ) * 0.2 / walk_speed_scale * GSPEED;

						//if ( ( old_walk < 0.5 && this._anim_walk >= 0.5 ) )//|| ( old_walk < 0.666 && this._anim_walk >= 0.666 ) )
						if ( ( old_walk < 3.333 && this._anim_walk >= 3.333 ) || ( old_walk < 6.666 && this._anim_walk >= 6.666 ) )
						if ( !this.ghosting )
						if ( this._crouch_intens < 0.5 )
						sdSound.PlaySound({ name:this.GetStepSound(), x:this.x, y:this.y, volume:0.25 * this.GetStepSoundVolume(), _server_allowed:true, pitch:this.GetStepSoundPitch() });

						if ( this._anim_walk > 10 )
						this._anim_walk -= 10;
					}
				}
			}
			else
			{
				if ( ledge_holding && !this.flying )
				{
					if ( Math.sign( this.sx ) !== this.act_x )
					this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.65, GSPEED );
				
					//if ( Math.sign( this.sy ) !== act_y_or_unstable )
					if ( ( this.sy > 0 ) !== ( act_y_or_unstable > 0 ) )
					this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.65, GSPEED );
					
					this.sx += this.act_x * 0.15 * GSPEED;
					this.sy += act_y_or_unstable * 0.15 * GSPEED;
					
					this._side = this.act_x;
					//this._ledge_holding = 0;
					//this.look_x = this.x - 100;
					//this.look_y = this.y;
					this._ledge_holding = ledge_holding;
				}
				else
				{
					//this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.98, GSPEED );
					//this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.98, GSPEED );

					if ( this.flying )
					{
					}
					else
					{
						this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.98, GSPEED );
						this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.98, GSPEED );
					
						if ( !this.driver_of )
						this.sx += this.act_x * 0.15 * GSPEED;
						//this.sx += this.act_x * 0.2 * GSPEED;
					}


					this.sy += sdWorld.gravity * GSPEED;
				}
			}
		}
		
		
		if ( can_breathe )
		{
			if ( this.air < sdCharacter.air_max )
			this.air = Math.min( sdCharacter.air_max, this.air + GSPEED * 5 );
		}
		else
		{
			if ( this.air > 0 )
			{
				this.air = Math.max( 0, this.air - ( GSPEED ) );
				
				//if ( this.air < 0.5 )
				if ( !in_water )
				{
					if ( sdWorld.is_server )
					{
						if ( out_of_bounds )
						sdTask.MakeSureCharacterHasTask({ 
								similarity_hash:'NO-AIR-HINT', 
								executer: this,
								mission: sdTask.MISSION_GAMEPLAY_HINT,
								title: 'Out of playable area',
								description: 'You have left the allowed playable area - there is no oxygen here (even near base shielding units or in vehicles).'
						});
						else
						sdTask.MakeSureCharacterHasTask({ 
								similarity_hash:'NO-AIR-HINT', 
								executer: this,
								mission: sdTask.MISSION_GAMEPLAY_HINT,
								title: 'No oxygen',
								description: 'Enter vehicle or stay near charged and activated Base Shielding Unit.'
						});
					}
					
					if ( this.air < sdCharacter.air_max * 0.666 || out_of_bounds )
					if ( this._last_damage_upg_complain < sdWorld.time - 1000 * 10 )
					{
						this._last_damage_upg_complain = sdWorld.time;

						switch ( ~~( Math.random() * 7 ) )
						{
							case 0: this.Say( 'I can\'t breathe here', true, false, true ); break;
							case 1: this.Say( 'Running low on oxygen', true, false, true ); break;
							case 2: this.Say( 'No oxygen', true, false, true ); break;
							case 3: this.Say( 'Watch out for oxygen', true, false, true ); break;
							case 4: this.Say( 'I really should not be out there', true, false, true ); break;
							case 5: this.Say( 'Can\'t... breathe...', true, false, true ); break;
							case 6: this.Say( 'There is no air', true, false, true ); break;
						}
					}
				}
			}
			else
			{
				if ( this.hea > 0 )
				this.DamageWithEffect( GSPEED * 10, null, false, false );
			}
		}
		
		this._can_breathe = can_breathe;
		
		if ( this.driver_of && this.driver_of.VehicleHidesDrivers() )
		this.PositionUpdateAsDriver();
		else
		{
			this.ApplyVelocityAndCollisions( GSPEED, this.GetStepHeight(), ( this.hea <= 0 ), 1, this.GetCurrentCollisionFilter() );
		}
		/*
		if ( sdWorld.last_hit_entity )
		{
			if ( sdWorld.last_hit_entity.is( sdBlock ) )
			if ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP )
			this.DamageWithEffect( Infinity );
		}*/
									
		if ( this._ragdoll )
		{
			if ( !sdWorld.is_server && !this._local_ragdoll_ever_synced )
			{
				for ( let i = 0; i < 30; i++ )
				this._ragdoll.Think( 1 );
			
				this._local_ragdoll_ever_synced = true;
			}
			else
			this._ragdoll.Think( GSPEED );
		}
									
		if ( sdWorld.is_server && !this._socket && !this._ai && this._phys_sleep <= 0 && !in_water && !this.driver_of && this.hea > 0 && !this._dying && this.pain_anim <= 0 && this.death_anim <= 0 )
		{
			this.sync = -1;
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
	}
	GetCurrentCollisionFilter()
	{
		let filtering = null;

		if ( this.carrying || this._previous_carrying )
		{
			if ( !this._current_collision_filter )
			this._current_collision_filter = ( e )=>
			{
				return ( 
							( e !== this.carrying && e !== this._previous_carrying ) && e._hard_collision
						); // hard collision test is skipped when non-null filter is applied
			};
			
			filtering = this._current_collision_filter;
		}
		
		return filtering;
	}
	GetStepHeight()
	{
		return ( this.hea > 0 ) ? ( this.act_y !== 1 ? 10 : 3 ) : 0;
	}
	onThinkFrozen( GSPEED )
	{
		super.onThinkFrozen( GSPEED );
		
		if ( this._respawn_protection > 0 )
		this._respawn_protection = Math.max( 0, this._respawn_protection - GSPEED );
		
		if ( this._ragdoll )
		this._ragdoll.ThinkFrozen( GSPEED );
	}
			
	PositionUpdateAsDriver()
	{
		//if ( this.driver_of.VehicleHidesDrivers() )
		{
			let offset = this.driver_of.GetDriverPositionOffset( this );
			
			this.x = this.driver_of.x + offset.x;
			this.y = this.driver_of.y + offset.y;
			this.sx = this.driver_of.sx || 0;
			this.sy = this.driver_of.sy || 0;
		}
	}

	HandlePlayerPowerups( GSPEED )
	{
		//if ( this.stim_ef > 0 )
		//this.stim_ef = Math.max( 0, this.stim_ef - GSPEED );
		if ( this.power_ef > 0 )
		this.power_ef = Math.max( 0, this.power_ef - GSPEED );
		if ( this.time_ef > 0 )
		this.time_ef = Math.max( 0, this.time_ef - GSPEED );
	}
	get friction_remain()
	{ return ( this.hea <= 0 ) ? 0.7 : 0.8; } // Same 0.7 for ragdoll bones

	/*onRemoveAsFakeEntity()
	{
		if ( this._ragdoll )
		this._ragdoll.Delete();*/
	
		
		/*
		let id = sdCharacter.characters.indexOf( this );

		if ( id === -1 )
		throw new Error( 'Removing sdCharacter entity twice? Removed entity is not in a list of sdCharacter.characters. Previously it was removed at: ' + this._debug_last_removed_stack );
		else
		sdCharacter.characters.splice( id, 1 );
	
		this._debug_last_removed_stack = globalThis.getStackTrace();
	}*/
	
	//onRemove() // Class-specific, if needed
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		// Release object
		if ( this._ai )
		this._ai.target = null;
		//else
		//debugger;
		
		if ( this._ragdoll )
		this._ragdoll.Delete();
	
		if ( this.carrying )
		this.DropCrystal( this.carrying );
	
		//this._ignored_guns = [];
		//this._ignored_guns_until = [];
	
		if ( this._socket )
		{
			this._socket.emit('REMOVE sdWorld.my_entity', this._net_id );
		}
		
		// Done by sdEntity now
		//for ( var i = 0; i < this._listeners.REMOVAL.length; i++ )
		//this._listeners.REMOVAL[ i ]( this );
	
		let id = sdCharacter.characters.indexOf( this );

		if ( id === -1 )
		throw new Error( 'Removing sdCharacter entity twice? Removed entity is not in a list of sdCharacter.characters. Previously it was removed at: ' + this._debug_last_removed_stack );
		else
		sdCharacter.characters.splice( sdCharacter.characters.indexOf( this ), 1 );
		
		this._debug_last_removed_stack = globalThis.getStackTrace();

		if ( this.driver_of )
		this.driver_of.ExcludeDriver( this );
		
		// Check if server allows keeping one weapon
		if ( sdWorld.server_config.keep_favourite_weapon_on_death && !this._ai_enabled )
		{
			// Attempt saving the weapon to LRTP
			let slot = this.GetFavouriteEquippedSlot();
			if ( this._inventory[ slot ] )
			{
				this._inventory[ slot ].ttl = sdGun.disowned_guns_ttl;
				this._inventory[ slot ]._held_by = null;
				this._inventory[ slot ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					
				if ( this.AttemptWeaponSaving( this._inventory[ slot ] ) )
				this._inventory[ slot ].remove();
				// else
				this._inventory[ slot ] = null;
				// If it doesn't save the weapon, it will probably just end up being dropped
			}
		}
		// Actually remove instead if player was deleted
		if ( this._broken )
		this.DropWeapons();
		else
		{
			for ( var i = 0; i < this._inventory.length; i++ )
			if ( this._inventory[ i ] )
			{
				this._inventory[ i ].remove();
			}
		}
		
		if ( sdWorld.is_server )
		{
			
		}
		else
		{
			if ( this._speak_id !== -1 )
			{
				meSpeak.stop( this._speak_id );
				this._speak_id = -1;
			}
		}
		
		// Let all tasks be removed
		for ( let i = 0; i < sdTask.tasks.length; i++ )
		{
			if ( sdTask.tasks[ i ]._executer === this )
			sdTask.tasks[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
		
		this._ignored_guns_infos = null;
	}
	
	DropWeapons()
	{
		if ( sdWorld.server_config.keep_favourite_weapon_on_death === false || this._ai_enabled )
		{
			for ( var i = 0; i < this._inventory.length; i++ )
			this.DropWeapon( i );
		}
		else
		{
			let weapon_to_keep = this.GetFavouriteEquippedSlot();
			for ( i = 0; i < this._inventory.length; i++ )
			{
				if ( i !== weapon_to_keep )
				this.DropWeapon( i );
			}
			
		}
	}
	DropSpecificWeapon( ent ) // sdGun keepers need this method for case of sdGun removal
	{
		let slot = this._inventory.indexOf( ent );
		if ( slot === -1 )
		{
			//if ( sdWorld.is_server )
			//throw new Error('Should not happen');
			//else
			
			console.warn( 'Should not happen' ); // Rarely happened on server, not sure what caused this. Could be related to floating guns in mid-air, which happened after client self-initated respawn while he already had character in world but snapshots were simply not sent to players due to bug.
			
			console.warn('Can\'t drop gun. Gun snapshot: '+JSON.stringify( ent.GetSnapshot( GetFrame(), true ) ) );
			return;
		}
		
	
		this.DropWeapon( slot );
	}
	DropWeapon( i ) // by slot
	{
		let gun = this._inventory[ i ];
		
		if ( gun )
		{
			//console.log( this.title + ' drops gun ' + gun._net_id );
		
			if ( typeof gun._held_by === 'undefined' )
			debugger; // Pickable items should have this property

			if ( this.hea <= 0 || this._is_being_removed )
			{
				gun.y = this.y + 16 - 4;

				gun.sx += Math.random() * 6 - 3;
				gun.sy -= Math.random() * 3;
			}
			else
			{
				let an = this.GetLookAngle();
				
				let throw_force = 5;
				
				if ( sdGun.classes[ gun.class ].is_sword )
				{
					//if ( this._dangerous_from.IsPlayerClass() )
					throw_force *= ( 1 + this._sword_throw_mult ) / 2;
				}
				
				gun.sx += Math.sin( an ) * throw_force;
				gun.sy += Math.cos( an ) * throw_force;
				
				this._ignored_guns_infos.push( { ent: gun, until: sdWorld.time + 300 } );
			}

			gun.ttl = sdGun.disowned_guns_ttl;
			gun._held_by = null;
			gun.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			this._inventory[ i ] = null;
			
			this.TriggerMovementInRange();
		}
	}
	
	IsGunIgnored( from_entity, fast_check ) // fast_check causes it to skip expiration logic
	{
		let will_ignore_pickup = false;

		for ( var i = 0; i < this._ignored_guns_infos.length; i++ )
		{
			if ( !fast_check )
			if ( sdWorld.time > this._ignored_guns_infos[ i ].until )
			{
				this._ignored_guns_infos.splice( i, 1 );
				i--;
				continue;
			}

			if ( this._ignored_guns_infos[ i ].ent === from_entity )
			{
				will_ignore_pickup = true;
				
				if ( fast_check )
				break;
			}
		}

		return will_ignore_pickup;
	}

	onMovementInRange( from_entity )
	{
		//console.log( from_entity.GetClass(), from_entity.material, sdBlock.MATERIAL_SHARP, this.hea, sdWorld.is_server );
		
		if ( from_entity._is_bg_entity === this._is_bg_entity )
		if ( from_entity._hard_collision )
		if ( from_entity !== this.carrying )
		{
			const max_stand_on_elevation = sdCharacter.max_stand_on_elevation;
			
			/*if ( this.y + this._hitbox_y2 >= from_entity.y + from_entity._hitbox_y1 - this.GetStepHeight() )
			if ( this.x + this._hitbox_x2 > from_entity.x + from_entity._hitbox_x1 )
			if ( this.x + this._hitbox_x1 < from_entity.x + from_entity._hitbox_x2 )*/
																																	
			// Copy "stands on detection" [ 2 / 2 ]
			if ( this.x + this._hitbox_x1 < from_entity.x + from_entity._hitbox_x2 )
			if ( this.x + this._hitbox_x2 > from_entity.x + from_entity._hitbox_x1 )
			if ( this.y + this._hitbox_y1 + max_stand_on_elevation <= from_entity.y + from_entity._hitbox_y2 )
			if ( this.y + this._hitbox_y2 + max_stand_on_elevation >= from_entity.y + from_entity._hitbox_y1 )
			{
				let ignored_arr_or_null = this.GetIgnoredEntityClasses();
				if ( ignored_arr_or_null === null || ignored_arr_or_null.indexOf( from_entity.GetClass() ) === -1 )
				{
					let remote_ignored = from_entity.GetIgnoredEntityClasses();
					if ( remote_ignored === null || remote_ignored.indexOf( this.GetClass() ) === -1 )
					{
						this.stands = true;
						this._stands_on = from_entity;
					}
				}
			}
		}
		
		if ( this.hea > 0 )
		if ( sdWorld.is_server || from_entity.IsVehicle() )
		{
			if ( from_entity.is( sdBlock ) )
			{
				if ( from_entity._contains_class === 'sdQuickie' || from_entity._contains_class === 'sdFaceCrab' || from_entity._contains_class === 'weak_ground' )
				{
					from_entity.DamageWithEffect( 1 ); // Will break
				}
			}
			else
			if ( from_entity.is( sdGun ) )
			{
				if ( from_entity._is_being_removed )
				{
					return; // Can happen is very rare cases, if gun self-destructs, perhaps.
					//throw new Error('[ 1 ] How did character touch gun that is _is_being_removed? Gun snapshot: ' + JSON.stringify( from_entity.GetSnapshot( GetFrame(), true ) ) );
				}

				let will_ignore_pickup = this.IsGunIgnored( from_entity, false );

				if ( from_entity._held_by === null )
				{

					if ( !will_ignore_pickup )
					//if ( this._ignored_guns.indexOf( from_entity ) === -1 )
					//if ( Math.abs( from_entity.x - this.x ) < 8 )
					//if ( Math.abs( from_entity.y - this.y ) < 16 )
					{
						/*if ( from_entity.dangerous )
						{
							this.DamageWithEffect( 30 );
							from_entity.dangerous = false;
						}*/
										
						if ( sdGun.classes[ from_entity.class ] !== undefined ) // Incompatible guns
						if ( sdGun.classes[ from_entity.class ].ignore_slot || this._inventory[ from_entity.GetSlot() ] === null )
						{
							if ( !sdGun.classes[ from_entity.class ].onPickupAttempt || 
								  sdGun.classes[ from_entity.class ].onPickupAttempt( this, from_entity ) )
							{	
								//console.warn( this.title + '['+this._net_id+'] picks up gun ' + from_entity._net_id + ' // this._is_being_removed = ' + this._is_being_removed );
								
								if ( from_entity._is_being_removed )
								{
									throw new Error('[ 2 ] How did character pick gun that is _is_being_removed? Gun snapshot: ' + JSON.stringify( from_entity.GetSnapshot( GetFrame(), true ) ) );
								}

								this._inventory[ from_entity.GetSlot() ] = from_entity;
								from_entity._held_by = this;
								from_entity.ttl = -1;

								if ( this._socket )
								sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:1.5 }, [ this._socket ] );
							}
						}
					}
				}
			}
			else
			if ( from_entity.IsVehicle() )
			{
				this._potential_vehicle = from_entity;
			}
			/*else
			if ( from_entity.IsCarriable() )
			{
				this._potential_carry_target = from_entity;
			}*/
			/*else
			if ( from_entity.is( sdWorkbench ) )
			{
				this.workbench_level = from_entity.level;
				this._wb_timer = 15;
				//console.log( from_entity.GetClass(), this.workbench_level, this._wb_timer, sdWorld.is_server );
			}*/
		}
	}
	
	GetWorkBenchLevel()
	{
		if ( this._potential_vehicle )
		if ( !this._potential_vehicle._is_being_removed )
		if ( this._potential_vehicle.is( sdWorkbench ) )
		if ( this.DoesOverlapWith( this._potential_vehicle ) )
		{
			return this._potential_vehicle.level;
		}
		
		return 0;
	}
	
	GetUpgradeStationLevel()
	{
		if ( this._potential_vehicle )
		if ( !this._potential_vehicle._is_being_removed )
		if ( this._potential_vehicle.is( sdUpgradeStation ) )
		if ( this.DoesOverlapWith( this._potential_vehicle ) )
		{
			return this._potential_vehicle.level;
		}

		
		return 0;
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim < 20 && !this.driver_of )
		{
			ctx.textAlign = 'center';
			
			let w = 20 * Math.max( 0.5, this.s / 100 );
			
			let raise = 0;/*5 + 15 * this.s / 100;
			
			raise -= this._crouch_intens * 6;
			*/
			
			if ( this._ragdoll )
			{
				raise = ( this.y - this._ragdoll.chest.y + 20 * this.s / 100 );
			}
			else
			{
				// Drones, overlords
				raise = 5 + 15 * this.s / 100
			}
			
			let show_air = false;
			
			if ( sdWorld.my_entity === this )
			if ( this.air < sdCharacter.air_max )
			{
				show_air = true;
				
				ctx.font = "5.5px Verdana";
				
				let critical = ( this.air < sdCharacter.air_max / 2 );
				
				let t = critical ? 'No oxygen' : 'Low oxygen';
				
				ctx.fillStyle = '#000000';
				ctx.fillText( t, 0, -raise - 5 - 10 + 0.5, 50 );
				
				if ( critical )
				ctx.fillStyle = ( sdWorld.time % 4000 < 2000 ) ? '#ff0000' : '#ff6666';
				else
				ctx.fillStyle = ( sdWorld.time % 4000 < 2000 ) ? '#ffff00' : '#ffff66';
			
				ctx.fillText( t, 0, -raise - 5 - 10, 50 );
			}
			
			let snap_frame = ( ~~( this.death_anim / 10 ) ) * 10 / 20;
			
			ctx.globalAlpha = ( 1 - snap_frame ) * 0.5;
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - raise - ( this.armor > 0 ? 2 : 0 ), w, 5 + ( this.armor > 0 ? 2 : 0 )  + ( show_air ? 2 : 0 ) );
			
			ctx.globalAlpha = 1 - snap_frame;
			
			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - raise, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
			
			if ( this.lst > 0 )
			{
				ctx.fillStyle = '#FFFF00';
				ctx.fillRect( 1 - w / 2, 1 - raise, ( w - 2 ) * Math.max( 0, Math.min( this.lst, this.hea ) / this.hmax ), 1 );
			}

			if ( this.armor > 0 )
			{
				//ctx.fillStyle = '#5555ff';
				ctx.fillStyle = '#77aaff';
				ctx.fillRect( 1 - w / 2, -1 - raise, ( w - 2 ) * Math.max( 0, this.armor / this.armor_max ), 1 );
			}

			//ctx.fillStyle = '#000000';
			//ctx.fillRect( 0 - w / 2, 0 - raise, w, 3 );
			
			ctx.fillStyle = '#00ffff';
			ctx.fillRect( 1 - w / 2, 3 - raise, ( w - 2 ) * Math.max( 0, Math.min( this.matter / this.matter_max, 1 ) ), 1 );
			
			if ( show_air )
			{
				ctx.fillStyle = '#aaaaff';
				ctx.fillRect( 1 - w / 2, 5 - raise, ( w - 2 ) * Math.max( 0, this.air / sdCharacter.air_max ), 1 );
			}
			
			//
			
			
			let size = 5.5;
			let text_size;
			do
			{
				ctx.font = size + "px Verdana";

				text_size = ctx.measureText( this.title );
				
				size += 0.5;
				
			} while( text_size.width < 20 && size < 10 );
			
			let t = this.title;
			
			if ( sdWorld.client_side_censorship && this.title_censored )
			t = T('Censored Defender');//sdWorld.CensoredText( t );
			
			ctx.fillStyle = '#000000';
			ctx.fillText( t, 0, -raise - 4.5, 50 ); 
			ctx.fillStyle = '#ffffff';
			ctx.fillText( t, 0, -raise - 5, 50 );
			
			if ( this._inventory[ this.gun_slot ] )
			if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ] && sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_build_gun )
			if ( this._build_params )
			{
				let fake_ent = this.CreateBuildObject( false );
				if ( fake_ent )
				{
					if ( this.CheckBuildObjectPossibilityNow( fake_ent, false ) )
					ctx.globalAlpha = 0.9;
					else
					{
						ctx.globalAlpha = 0.4 * ( ( sdWorld.time % 200 < 100 ) ? 1 : 0.9 );
						ctx.sd_status_effect_tint_filter = [ 1.5, 0.3, 0.3 ];
					}
				
					let old_volumetric_mode = ctx.volumetric_mode;
					let old_object_offset = ctx.object_offset;
					let old_z_offset = ctx.z_offset;
					let old_z_depth = ctx.z_depth;
					let old_camera_relative_world_scale = ctx.camera_relative_world_scale;
					//ctx.sd_status_effect_tint_filter = [ 1.5, 1.5, 1.5 ];
					{
						ctx.volumetric_mode = fake_ent.DrawIn3D();

						ctx.translate( -this.x + fake_ent.x, -this.y + fake_ent.y );
						

						if ( ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX || 
							 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT || 
							 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_DECAL )
						{
							ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT;
							fake_ent.FigureOutBoxCapVisibilities( sdRenderer.ctx.box_caps );
						}
					
						ctx.object_offset = fake_ent.ObjectOffset3D( -1 );
						ctx.z_offset = -32 * sdWorld.camera.scale;
						ctx.z_depth = 16 * sdWorld.camera.scale;
						ctx.camera_relative_world_scale = sdRenderer.distance_scale_in_world;
						ctx.save();
						{
							fake_ent.DrawBG( ctx, false );
						}
						ctx.restore();
						
						ctx.object_offset = fake_ent.ObjectOffset3D( 0 );
						ctx.z_offset = -16 * sdWorld.camera.scale;
						ctx.z_depth = 16 * sdWorld.camera.scale;
						ctx.save();
						{
							fake_ent.Draw( ctx, false );
						}
						ctx.restore();
						
						ctx.object_offset = fake_ent.ObjectOffset3D( 1 );
						ctx.save();
						{
							fake_ent.DrawFG( ctx, false );
						}
						ctx.restore();

						if ( fake_ent.DrawConnections )
						fake_ent.DrawConnections( ctx );

						fake_ent.remove();
						fake_ent._broken = false;
						fake_ent._remove();
					}
					ctx.object_offset = old_object_offset;
					ctx.volumetric_mode = old_volumetric_mode;
					ctx.z_offset = old_z_offset;
					ctx.z_depth = old_z_depth;
					ctx.camera_relative_world_scale = old_camera_relative_world_scale;
					ctx.sd_status_effect_tint_filter = null;
				}
			}
			
			ctx.globalAlpha = 1;
		}
	}
	CheckBuildObjectPossibilityNow( fake_ent, allow_erase=true )
	{
		return sdCharacter.GeneralCheckBuildObjectPossibilityNow( this._build_params, this, fake_ent, allow_erase );
	}
	static GeneralCheckBuildObjectPossibilityNow( build_params, initiator=null, fake_ent, allow_erase=true )
	{
		fake_ent.GetIgnoredEntityClasses = sdEntity.prototype.GetIgnoredEntityClasses; // Discard effect of this method because doors will have problems in else case
		
		if ( fake_ent.GetClass() === 'sdGun' )
		{
			fake_ent.GetIgnoredEntityClasses = ()=>[ 'sdCharacter', 'sdGun', 'sdSampleBuilder', 'sdTeleport', 'sdButton' ];
		}
		
		if ( !initiator || sdWorld.Dist2D( initiator.x, initiator.y, build_params.x, build_params.y ) < 64 || initiator._god )
		{
			{
				// This is used to make it include sdButton-s when putting new sdButtons on top
				const custom_filtering_method = ( e )=>
				{
					if ( !fake_ent._hard_collision ) 
					{
						if ( !sdWorld.is_server || sdWorld.is_singleplayer )
						if ( e.GetClass() === 'sdBone' )
						{
							return false;
						}
						
						return true;
					}
					
					return e._hard_collision;
				};
				
				//if ( fake_ent.CanMoveWithoutOverlap( fake_ent.x, fake_ent.y, 0.00001 ) ) // Very small so entity's velocity can be enough to escape this overlap
				//new_x, new_y, safe_bound=0, custom_filtering_method=null, alter_ignored_classes=null
				if ( ( initiator && initiator._god && initiator._debug ) || 
					 fake_ent.CanMoveWithoutOverlap( fake_ent.x, fake_ent.y, 0, custom_filtering_method ) )
				{
					if ( fake_ent.IsEarlyThreat() )
					//if ( fake_ent.is( sdTurret ) || fake_ent.is( sdCom ) || fake_ent.is( sdBarrel ) || fake_ent.is( sdBomb ) || ( fake_ent.is( sdBlock ) && fake_ent.material === sdBlock.MATERIAL_SHARP ) )
					{
						let off;
						
						if ( initiator )
						if ( initiator.GetBulletSpawnOffset )
						off = initiator.GetBulletSpawnOffset();

						//if ( !initiator || sdWorld.CheckLineOfSight( initiator.x + off.x, initiator.y + off.y, build_params.x, build_params.y, fake_ent, null, sdCom.com_visibility_unignored_classes ) || initiator._god )
						if ( !initiator || sdWorld.AccurateLineOfSightTest( initiator.x + off.x, initiator.y + off.y, build_params.x, build_params.y, sdCom.com_build_line_of_sight_filter_for_early_threats ) || initiator._god )
						{
						}
						else
						{
							sdCharacter.last_build_deny_reason = [
									'Can\'t build this type of entity through wall',
									'Not through wall',
									'No',
									'I refuse',
									'Can\'t phase through wall',
									'How I\'d do that?',
									'It can\'t be built through wall',
									'Understandable',
									'Wall is in the way'
								][ ~~( Math.random() * 9 ) ];

							return false;
						}
					}
					
					if ( initiator )
					if ( !initiator._god )
					if ( !sdArea.CheckPointDamageAllowed( build_params.x, build_params.y ) )
					{
						sdCharacter.last_build_deny_reason = 'This area is currently restricted from combat and building';
						return false;
					}
					
					return true;
				}
				else
				{
					if ( sdWorld.is_server )
					{
						let obstacle = sdWorld.last_hit_entity;
						
						if ( obstacle )
						{
							if ( fake_ent.is( sdBlock ) && obstacle.is( sdBlock ) && 
								 fake_ent.x === obstacle.x && 
								 fake_ent.y === obstacle.y && 
								 fake_ent.w === obstacle.w && 
								 fake_ent.h === obstacle.h &&
								 fake_ent.material === obstacle.material &&
								 fake_ent._hmax === obstacle._hmax &&
								 fake_ent._armor_protection_level >= obstacle._armor_protection_level &&
								 
								 //( obstacle._shielded === null || fake_ent._owner === obstacle._owner || obstacle._shielded._is_being_removed ) &&
								 ( obstacle._shielded === null || ( initiator === obstacle._owner && obstacle._owner ) || obstacle._shielded._is_being_removed ) &&
								 !fake_ent.IsInSafeArea()
							)
							{
								if ( allow_erase )
								{
									obstacle.hue = fake_ent.hue;
									obstacle.br = fake_ent.br;
									obstacle.filter = fake_ent.filter;
									
									obstacle._armor_protection_level = fake_ent._armor_protection_level;
									
									obstacle.texture_id = fake_ent.texture_id;
									
									obstacle._update_version++;
									
									sdCharacter.last_build_deny_reason = 'Repainting...';
									return false;
								}
								else
								{
									sdCharacter.last_build_deny_reason = 'You shouldn\'t be able to hear this';
									return false;
								}
							}
							else
							if ( fake_ent._is_bg_entity === 1 && obstacle.is( sdBG ) && ( !obstacle._shielded || obstacle._shielded._is_being_removed ) )
							{
								if ( obstacle._merged ) // Merged backgrounds?
								{
									obstacle.UnmergeBackgrounds(); // Unmerge first
									return sdCharacter.GeneralCheckBuildObjectPossibilityNow( build_params, initiator, fake_ent, allow_erase ); // Try again
								}
								if ( allow_erase )
								{
									sdCharacter.last_build_deny_reason = null;
									obstacle.remove();
									//return initiator.CheckBuildObjectPossibilityNow( fake_ent, allow_erase );
									return sdCharacter.GeneralCheckBuildObjectPossibilityNow( build_params, initiator, fake_ent, allow_erase );
								}
								else
								{
									sdCharacter.last_build_deny_reason = 'You shouldn\'t be able to hear this';
									return false;
								}
							}
							else
							if ( fake_ent.is( sdArea ) && fake_ent.type === sdArea.TYPE_ERASER_AREA && obstacle.is( sdArea ) )
							{
								sdCharacter.last_build_deny_reason = 'Erasing...';
								obstacle.remove();
								return false;
							}
							else
							{
								let s = sdWorld.ClassNameToProperName( obstacle.GetClass(), obstacle, true );

								//sdCharacter.last_build_deny_reason = 'It overlaps with '+s;

								sdCharacter.last_build_deny_reason = [
									'It overlaps with '+s,
									s+' is in the way',
									'Maybe I should break '+s+' first?',
									'Ok, but there is '+s,
									'Can\'t build on top of '+s,
									'No space',
									s+', could you move please?',
									'Out of my way, '+s+'!',
									'Uh...',
									'Um...'
								][ ~~( Math.random() * 10 ) ];
							}
						}
					}
					
				}
			}
			/*else
			{
				switch ( ~~( Math.random() * 6 ) )
				{
					case 0: sdCharacter.last_build_deny_reason = 'I\'d need to stand on something or use jetpack or grappling hook'; break;
					case 1: sdCharacter.last_build_deny_reason = 'Need to stand'; break;
					case 2: sdCharacter.last_build_deny_reason = 'Can\'t build mid-air'; break;
					case 3: sdCharacter.last_build_deny_reason = 'Maybe if I was using jetpack'; break;
					case 4: sdCharacter.last_build_deny_reason = 'Maybe if I was using grappling hook'; break;
					case 5: sdCharacter.last_build_deny_reason = 'Maybe if I was swimming right now'; break;
					case 5: sdCharacter.last_build_deny_reason = 'Maybe if I was able to stand'; break;
				}
			}*/
		}
		else
		{
			switch ( ~~( Math.random() * 4 ) )
			{
				case 0: sdCharacter.last_build_deny_reason = 'Can\'t build that far'; break;
				case 1: sdCharacter.last_build_deny_reason = 'Too far'; break;
				case 2: sdCharacter.last_build_deny_reason = 'Can\'t reach'; break;
				case 3: sdCharacter.last_build_deny_reason = 'Maybe if I was closer'; break;
			}

		}
		
		return false;
	}
	CreateBuildObject( check_placement_and_range=true, demo_mode=false, preview_for_shop=false ) // Can be removed later on and used as fake signle-frame object in general
	{
		let build_tool_level = this.build_tool_level;
		let work_bench_level = this.GetWorkBenchLevel();
		
		if ( this._debug )
		{
			build_tool_level = 999;
			work_bench_level = 999;
		}
		
		return sdCharacter.GeneralCreateBuildObject( this.look_x, this.look_y, this._build_params, this, build_tool_level, work_bench_level, check_placement_and_range, demo_mode, preview_for_shop );
	}
	static GeneralCreateBuildObject( x, y, build_params, initiator, build_tool_level, workbench_level, check_placement_and_range=true, demo_mode=false, preview_for_shop=false ) // Used by sdSampleBuilder now
	{
		if ( build_params === null )
		{
			sdCharacter.last_build_deny_reason = 'Nothing selected for build? Does this error even happen?';
			return null;
		}
	
		if ( build_params._class === null ) // Upgrades
		{
			//sdCharacter.last_build_deny_reason
			return null;
		}
	
		
		if ( ( build_params._min_build_tool_level || 0 ) > build_tool_level )
		{
			sdCharacter.last_build_deny_reason = 'Nice hacks bro';
			return null;
		}

		//if ( ( build_params._min_workbench_level || 0 ) > initiator.workbench_level )
		if ( ( build_params._min_workbench_level || 0 ) > workbench_level )
		{
			sdCharacter.last_build_deny_reason = 'I need a workbench to build this';
			return null;
		}
			
		//build_params._spawner = initiator;
		
		
		// Note: X and Y are weird here. This can cause hash array being incorrect - hash update is important to do after entity was placed properly! It can not be done earlier due to entity sizes being unknown too
		let fake_ent = new sdWorld.entity_classes[ build_params._class ]( Object.assign( { initiator: initiator }, build_params ) );
		
		fake_ent.UpdateHitbox();
		
		if ( preview_for_shop )
		{
			fake_ent.x = 0;
			fake_ent.y = 0;
		}
		else
		{
			build_params.x = x;
			build_params.y = y;

			fake_ent.x = ( x - ( fake_ent._hitbox_x2 + fake_ent._hitbox_x1 ) / 2 );
			fake_ent.y = ( y - ( fake_ent._hitbox_y2 + fake_ent._hitbox_y1 ) / 2 );
		}
		
		/*if ( !demo_mode )
		{
			if ( fake_ent._owner !== undefined )
			fake_ent._owner = initiator; // Source of price to go up

			if ( fake_ent.owner !== undefined )
			fake_ent.owner = initiator;

			if ( fake_ent.owner_biometry !== undefined )
			fake_ent.owner_biometry = initiator.biometry;

			if ( fake_ent._owner_biometry !== undefined )
			fake_ent._owner_biometry = initiator.biometry;
		}*/
		
		if ( fake_ent.RequireSpawnAlign() )
		{
			fake_ent.x = Math.round( fake_ent.x / fake_ent.spawn_align_x ) * fake_ent.spawn_align_x;
			fake_ent.y = Math.round( fake_ent.y / fake_ent.spawn_align_y ) * fake_ent.spawn_align_y;
		}
		
		if ( check_placement_and_range )
		{
			if ( !sdCharacter.GeneralCheckBuildObjectPossibilityNow( build_params, initiator, fake_ent, true ) )
			//if ( !initiator.CheckBuildObjectPossibilityNow( build_params, initiator, fake_ent ) )
			{
				// So many bugs with this one
				//fake_ent.SetMethod( 'onRemove', fake_ent.onRemoveAsFakeEntity ); // Disable any removal logic
				
				fake_ent.remove();
				fake_ent._broken = false;
				fake_ent._remove();
				return null;
			}
		}
		
		if ( sdWorld.is_server )
		if ( fake_ent )
		if ( initiator )
		if ( initiator.IsPlayerClass() )
		{
			let arr = sdWorld.recent_built_item_net_ids_by_hash.get( initiator._my_hash );
			
			if ( !arr )
			{
				arr = [];
				sdWorld.recent_built_item_net_ids_by_hash.set( initiator._my_hash, arr );
			}
			
			arr.push({
				_net_id: fake_ent._net_id,
				time: sdWorld.time
			});
			
			while ( true )
			{
				if ( arr.length === 0 )
				break;
			
				if ( arr[ 0 ].time < sdWorld.time - sdWorld.recent_built_item_memory_length )
				{
					arr.shift();
					continue;
				}
			
				let e = sdEntity.entities_by_net_id_cache_map.get( arr[ 0 ]._net_id );
				if ( !e || e._is_being_removed )
				{
					arr.shift();
					continue;
				}
				
				break;
			}
			
			// Extra check for previous item since it is very likely to be a temporary entity that was never made/removed after creation (and thus cause rather big memory leaks)
			if ( arr.length >= 2 )
			{
				let id = arr.length - 2;
				
				let e = sdEntity.entities_by_net_id_cache_map.get( arr[ id ]._net_id );
				if ( !e || e._is_being_removed )
				{
					arr.splice( id, 1 );
				}
			}
		}
		
		return fake_ent;
	}
	
	static ApplyPostBuiltProperties( ent, build_params, initiator, demo_mode=false )
	{
		if ( !demo_mode )
		if ( initiator )
		{
			if ( ent._owner !== undefined )
			ent._owner = initiator; // Source of price to go up

			if ( ent.owner !== undefined )
			ent.owner = initiator;

			if ( ent.owner_biometry !== undefined )
			ent.owner_biometry = initiator.biometry;

			if ( ent._owner_biometry !== undefined )
			ent._owner_biometry = initiator.biometry;
		}

		//if ( build_params._category !== 'Development tests' && !build_params._spawn_with_full_hp )
		if ( !sdShop.IsGodModeOnlyItem( build_params ) && !build_params._spawn_with_full_hp )
		{
			if ( typeof ent.hmax !== 'undefined' )
			ent.Damage( ent.hmax * 0.9, null, false, false ); // Start with low hp
			else
			if ( typeof ent._hmax !== 'undefined' )
			ent.Damage( ent._hmax * 0.9, null, false, false ); // Start with low hp
		}

		ent.onBuilt();
	}
	
	AnnounceTooManyEffectsIfNeeded()
	{
		if ( this.power_ef > 30 * 3 || this.time_ef > 30 * 3 )
		{
			this.Say( [ 'I\'m in', 'That is a power', 'Make your bets', 'Check out this combo', 'Good luck' ][ ~~( Math.random() * 3 ) ], false, false, true );
		}
	}
	Draw( ctx, attached )
	{
		if ( ( this._inventory[ this.gun_slot ] && this._inventory[ this.gun_slot ].muzzle > 0 ) || this.flying )
		ctx.apply_shading = false;
		
		if ( this.ghosting )
		ctx.globalAlpha = 0.3;
	
		if ( this.lag )
		if ( globalThis.enable_debug_info )
		{
			ctx.fillStyle = '#000000';
			ctx.fillText( 'Connection problem', 0, -24.5 - 5, 50 ); 
			ctx.fillStyle = '#ffff00';
			ctx.fillText( 'Connection problem', 0, -25 - 5, 50 );
		}
		
		if ( !attached )
		if ( this.hook_relative_to || this.hook_projectile_net_id !== -1 )
		{
			//let from_y = this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2;
			
			let off = this.GetBulletSpawnOffset();

			ctx.lineWidth = 1;
			ctx.strokeStyle = '#c0c0c0';
			ctx.beginPath();
			
			//ctx.moveTo( 0,from_y - this.y );
			ctx.moveTo( off.x, off.y );
			
			if ( this.hook_relative_to )
			ctx.lineTo( this.hook_relative_to.x + this.hook_relative_x - this.x, this.hook_relative_to.y + this.hook_relative_y - this.y );
			else
			{
				let hook_ent = sdEntity.entities_by_net_id_cache_map.get( this.hook_projectile_net_id );
				if ( hook_ent )
				ctx.lineTo( hook_ent.x - this.x, hook_ent.y - this.y );
			}
			ctx.stroke();
			if ( this.hook_relative_to )
			{
				ctx.save();

				ctx.translate( this.hook_relative_to.x + this.hook_relative_x - this.x, this.hook_relative_to.y + this.hook_relative_y - this.y );

				ctx.rotate( ( Math.atan2( this.hook_relative_to.y + this.hook_relative_y - this.y-off.y ,this.hook_relative_to.x + this.hook_relative_x - this.x-off.x ) ) );

				ctx.drawImageFilterCache( sdCharacter.img_grapple_hook, - 16, - 16 + 0.5, 32,32 );

				ctx.restore();
			}
		}
		
		//ctx.filter = this.filter;
		ctx.sd_filter = this.sd_filter;
		//if ( this.stim_ef > 0 && ( ( sdWorld.time ) % 1000 < 500 || this.stim_ef > 30 * 3 ) )
		let effects = sdStatusEffect.entity_to_status_effects.get( this );
		if ( effects !== undefined )
		for ( let i = 0; i < effects.length; i++ )
		{
			if ( effects[ i ].type === sdStatusEffect.TYPE_STIMPACK_EFFECT ) // Is the character under stimpack effect?
			ctx.filter = 'sepia(1) hue-rotate(-50deg) contrast(0.8) saturate(7) drop-shadow(0px 0px 1px #ff0000)'; // Give it the good old red outline
		
	
		}
		
		//if ( this.power_ef > 0 && ( ( sdWorld.time + 100 ) % 1000 < 500 || this.power_ef > 30 * 3 ) )
		//ctx.filter = 'sepia(1) hue-rotate(140deg) contrast(0.8) saturate(7) drop-shadow(0px 0px 1px #33ffff)';
	
		if ( this.time_ef > 0 && ( ( sdWorld.time + 200 ) % 1000 < 500 || this.time_ef > 30 * 3 ) ) // Time pack
		ctx.filter = 'grayscale(1) brightness(0.5) contrast(1.5) drop-shadow(0px 0px 1px #000000)';
		
		const char_filter = ctx.filter;
		
		if ( sdCharacter.debug_hitboxes )
		{
			ctx.fillStyle = '#00ff00';
			ctx.fillRect( this.hitbox_x1, this.hitbox_y1, this.hitbox_x2-this.hitbox_x1, this.hitbox_y2-this.hitbox_y1 );
			ctx.fillStyle = '#ff0000';
			ctx.fillRect( this.hitbox_x1, this.hitbox_y1, this.hitbox_x2-this.hitbox_x1, this.s/100 * 10 );
			
			if ( this.carrying )
			{
				let c = this.carrying;
				
				ctx.fillStyle = '#0000ff';
				ctx.fillRect( c.hitbox_x1 - this.x + c.x, c.hitbox_y1 - this.y + c.y, c.hitbox_x2-c.hitbox_x1, c.hitbox_y2-c.hitbox_y1 );
			}
		}
		if ( this._ragdoll )
		{
			if ( this.death_anim > sdCharacter.disowned_body_ttl - 30 )
			ctx.globalAlpha = 0.5;
		
			this._ragdoll.DrawRagdoll( ctx, attached );
			//ctx.globalAlpha = 0.2;
		}
		
		/*
		if ( !this.driver_of || attached )
		{
		
			var frame;

			if ( this.death_anim > 0 )
			{
				ctx.scale( this._side, 1 );

				if ( this.death_anim > sdCharacter.disowned_body_ttl - 30 )
				ctx.globalAlpha = 0.5;

				if ( this.death_anim < 10 )
				{
					frame = 'img_death1';
					ctx.drawImageFilterCache( sdCharacter.img_death1, - 16, - 16, 32,32 );
				}
				else
				if ( this.death_anim < 20 )
				{
					frame = 'img_death2';
					ctx.drawImageFilterCache( sdCharacter.img_death2, - 16, - 16, 32,32 );
				}
				else
				if ( this.death_anim < 30 )
				{
					frame = 'img_death3';
					ctx.drawImageFilterCache( sdCharacter.img_death3, - 16, - 16, 32,32 );
				}
				else
				{
					if ( this._speak_id !== -1 )
					{
						meSpeak.stop( this._speak_id );
						this._speak_id = -1;
					}




					if ( this.sd_filter !== this._sd_filter_old )
					{
						this._sd_filter_old = this.sd_filter;

						this._sd_filter_darkened = Object.assign( {}, this.sd_filter );

						this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 0 ] = ~~( this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 0 ] * 0.5 );
						this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 1 ] = ~~( this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 1 ] * 0.5 );
						this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 2 ] = ~~( this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 2 ] * 0.5 );
					}

					ctx.sd_filter = this._sd_filter_darkened;


					frame = 'img_death4';
					ctx.drawImageFilterCache( sdCharacter.img_death4, - 16, - 16, 32,32 );
					//ctx.drawImageFilterCache( sdCharacter.img_death4_visor_tint, - 16, - 16, 32,32 );
				}

				this.DrawHelmet( ctx, frame );
			}
			else
			{
				var image = sdCharacter.img_legs_idle;

				//ctx.fillRect( -4 + 8 * Math.sin( this.tilt / 100 ), -4 - 8 * Math.cos( this.tilt / 100 ), 8, 8 );

				if ( this.stands )
				{
					if ( this._crouch_intens > 0.25 )
					{
						if ( Math.abs( this._anim_walk - 5 ) < 5 / 2 * 1 )
						image = sdCharacter.img_legs_crouch;
						else
						image = sdCharacter.img_legs_crouch_walk1;
					}
					else
					if ( this.act_x !== 0 )
					{
						if ( Math.abs( this._anim_walk - 5 ) < 5 / 3 * 1 )
						{
						}
						else
						if ( Math.abs( this._anim_walk - 5 ) < 5 / 3 * 2 )
						image = sdCharacter.img_legs_walk1;
						else
						image = sdCharacter.img_legs_walk2;
					}
				}
				else
				image = sdCharacter.img_legs_walk2;

				ctx.rotate( this.tilt / 100 );

				ctx.scale( this._side, 1 );

				if ( !attached ) // Hide legs if in vehicle... Simple solution for now
				ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );

				image = sdCharacter.img_body_idle;
				frame = 'img_body_idle';

				let gun_offset_x = 0;
				let gun_offset_y = 0;

				if ( this.pain_anim > 0 )
				{
					image = sdCharacter.img_body_hurt;
					frame = 'img_body_hurt';
				}

				//if ( this.gun_slot === 0 )
				if ( !this._inventory[ this.gun_slot ] )
				{
					if ( this.fire_anim > 5 || this._ledge_holding )
					{
						image = sdCharacter.img_body_melee2;
						frame = 'img_body_melee2';
						gun_offset_x += 1;
					}
					else
					if ( this.fire_anim > 2.5 )
					{
						image = sdCharacter.img_body_melee1;
						frame = 'img_body_melee1';
						gun_offset_x += 3;
					}
				}
				else
				{
					if ( this.reload_anim > 0 )
					{
						if ( this.reload_anim > 30 / 3 * 2 )
						{
							image = sdCharacter.img_body_reload2;
							frame = 'img_body_reload2';
						}
						else
						if ( this.reload_anim > 30 / 3 * 1 )
						{
							image = sdCharacter.img_body_reload1;
							frame = 'img_body_reload1';
						}
						else
						{
							image = sdCharacter.img_body_reload2;
							frame = 'img_body_reload2';
						}


						gun_offset_x -= 1;
						gun_offset_y += 1;
					}
					else
					{
						if ( this.pain_anim <= 0 )
						{
							image = sdCharacter.img_body_armed;
							frame = 'img_body_armed';
						}

						if ( this.gun_slot === 0 )
						{
							if ( this.fire_anim > 2.5 )
							{
								image = sdCharacter.img_body_melee2;
								frame = 'img_body_melee2';
								gun_offset_x += 1;
							}
							else
							if ( this.fire_anim > 0 )
							{
								image = sdCharacter.img_body_melee1;
								frame = 'img_body_melee1';
								gun_offset_x += 3;
							}
						}
						else
						{
							if ( this.fire_anim > 2.5 )
							{
								image = sdCharacter.img_body_fire2;
								frame = 'img_body_fire2';
								gun_offset_x -= 3;
							}
							else
							if ( this.fire_anim > 0 )
							{
								image = sdCharacter.img_body_fire1;
								frame = 'img_body_fire1';
								gun_offset_x -= 2;
							}
						}
					}
				}

				if ( image === sdCharacter.img_body_hurt )
				{
					gun_offset_x = -1;
					gun_offset_y = 2;
				}

				let an = Math.atan2( 
						( this.y - this.look_y ) , 
						( ( this.x - this.look_x ) * this._side - 3 * Math.abs( this.y - this.look_y ) ) ) - Math.PI;

				if ( this._ledge_holding )
				an = 0;

				ctx.translate( - 2, 5 );
				ctx.rotate( an );
				ctx.translate( 2,  - 5 );

				if ( this._inventory[ this.gun_slot ] && !attached ) // Hide guns in vehicle too
				{
					ctx.sd_filter = null;
					ctx.save();
					{
						ctx.translate( 5 + gun_offset_x, -2 + gun_offset_y );

						ctx.rotate( -an );
						ctx.rotate( -this.tilt / 100 * this._side );

						ctx.rotate( ( -this.GetLookAngle( true ) ) * this._side + Math.PI / 2 );
						
						ctx.filter = 'none';
						this._inventory[ this.gun_slot ].Draw( ctx, true );
						ctx.filter = char_filter;
					}
					ctx.restore();
					ctx.sd_filter = this.sd_filter;
				}


				ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );

				this.DrawHelmet( ctx, frame );

				ctx.filter = 'none';
				ctx.sd_filter = null;
				if ( this.flying )
				{
					let frame = ( sdWorld.time % 600 > 400 ) ? 2 : ( sdWorld.time % 600 > 200 ) ? 1 : 0;
					ctx.drawImageFilterCache( sdCharacter.img_jetpack, frame * 32, 0, 32, 32, - 16, - 16, 32, 32 );
				}
				//ctx.filter = char_filter;
			}

		}
		*/
		ctx.filter = 'none';
		ctx.sd_filter = null;
	}
	
	DrawFG( ctx, attached ) // foreground layer, but not HUD
	{
		if ( this.cc_id )
		if ( sdWorld.my_entity )
		if ( this.cc_id === sdWorld.my_entity.cc_id )
		{
			ctx.drawImageFilterCache( sdCharacter.img_teammate, - 16, - 16 - 32 + this._crouch_intens * 6, 32,32 );
		}
	}
	
	ManualRTPSequence( kill=false )
	{
		let character = this;
		
		let was_god = character._god;

		character._god = false;

		if ( character.hea > 0 )
		{
			function Proceed()
			{
				if ( character._is_being_removed )
				return;

				if ( character.GetClass() === 'sdPlayerSpectator' ) // If player is using overlord, despawn it instantly.
				{
					character.remove();
					return;
				}

				if ( character.GetClass() === 'sdPlayerOverlord' ) // If player is using overlord, despawn it instantly.
				{
					character.remove();
					return;
				}

				if ( kill )
				character.Damage( character.hea, null, false, false ); // dmg, initiator=null, headshot=false, affects_armor=true
				else
				{
					if ( !character.AttemptTeleportOut( null, false, 0 ) )
					{
						character.Say( [ 'Jokes on you! I don\'t have any Rescue Teleport nearby', 'I\'d have to build Rescue Teleport or Rescue Cloner', 'Huh? It does not work...' ][ ~~( Math.random() * 3 ) ], false, false, true );
					}
				}
			}

			if ( character._score < 30 || was_god || !sdRescueTeleport.players_can_build_rtps )
			{
				Proceed();
			}
			else
			{
				character.Say( [ 'Emergency RTP - activate!' ][ ~~( Math.random() * 1 ) ], false, false, true );

				setTimeout( ()=>
				{
					if ( character._is_being_removed )
					return;

					if ( character._frozen >= 1 )
					{
						character.Say( [ 'Uh... I\'m frozen', 'Frozen...', 'A bit cold out there' ][ ~~( Math.random() * 3 ) ], false, false, true );
						return;
					}
					
					if ( character.driver_of )
					if ( character.driver_of.is( sdRescueTeleport ) )
					{
						// Likely a cloner... RTP-int out of it will move player outside of a vehicle and call the remove() on him... Bad
						character.Say( [ 
							'Yeah, I\'m kind of already here', 
							'I\'m literally disassembled', 
							'I should wait until this thing prints me my skin first - should be more comformatable wearing suit then',
							'Does anyone have area amplifier by any chance?',
							'I used to think that I hate waiting. But can I hate anything if my brain is still being printed?',
							'Time flies by when don\'t have anything to feel it',
							'Wait... How can I talk?',
							'"Weep-woop-weep-woop... Weep"'
						][ ~~( Math.random() * 8 ) ], false, false, true );
						return;
					}

					if ( character._has_rtp_in_range || !kill )
					Proceed();
					else
					{
						character.Say( [ 'Oh wait!..', 'Uh...', 'Damn', 'Well...', '...but do I have RTP?', 'RIP', 'Where is my RTP by the way?', '...but have I charged the batteries?' ][ ~~( Math.random() * 8 ) ], false, false, true );
						setTimeout( ()=>
						{
							Proceed();
						}, 2000 );
					}

				}, 2000 );
			}
		}
	}
	
	AllowContextCommandsInRestirectedAreas( exectuter_character, executer_socket ) // exectuter_character can be null
	{
		return true;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		{
			/*if ( exectuter_character )
			if ( command_name === 'REPORT' )
			{
				if ( typeof parameters_array[ 0 ] === 'string' )
				{
					let reason = parameters_array[ 0 ];
					
					if ( reason.length <= 500 )
					{
						if ( this._my_hash )
						{
							sdDatabase.Exec( 
								[ 
									[ 'DBReportHash', executer_socket.my_hash, this._my_hash ] 
								], 
								( responses )=>
								{
									while ( responses.length > 0 )
									{
										let r = responses.shift();

										if ( r[ 0 ] === 'REPORTED' )
										{
											executer_socket.SDServiceMessage( 'Report was received' );
											return;
										}
									}
									executer_socket.SDServiceMessage( 'Reporting error - could be that main database is not reachable or you don\'t have permissions' );
								},
								'localhost'
							);
						}
						else
						executer_socket.SDServiceMessage( 'This is not a real player, this is an AI character - report was ignored' );
					}
					else
					{
						executer_socket.SDServiceMessage( 'Report reason is too long' );
					}
				}
				return;
			}*/
			
			if ( this.hea > 0 )
			if ( exectuter_character )
			if ( exectuter_character.hea > 0 )
			{
				if ( exectuter_character._god )
				{
					if ( command_name === 'ADMIN_TOGGLE' )
					{
						let key = parameters_array[ 0 ];
						let value = 1 - this._key_states.GetKey( key );
						this._key_states.SetKey( key, value );

						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
					if ( command_name === 'ADMIN_PRESS' )
					{
						let key = parameters_array[ 0 ];

						//let value = 1 - this._key_states.GetKey( key );

						this._key_states.SetKey( key, 1 );

						sdTimer.ExecuteWithDelay( ( timer )=>{

							this._key_states.SetKey( key, 0 );

						}, 500 );

						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
					if ( command_name === 'ADMIN_KILL' )
					{
						this.hea = 1;
						this.armor = 0;
						this.Damage( 1 );
					}
					if ( command_name === 'ADMIN_REMOVE' )
					{
						this.remove();
					}
					if ( command_name === 'ADMIN_CONTROL' )
					{
						executer_socket;

						if ( this._socket )
						{
							executer_socket.SDServiceMessage( 'Player has connected socket' );
						}
						else
						{
							exectuter_character._god = false;
							exectuter_character._socket = null;

							this._socket = executer_socket;
							executer_socket.character = this;

							this.title = exectuter_character.title;
							this.title_censored = exectuter_character.title_censored;

							this._god = true;

							executer_socket.emit('SET sdWorld.my_entity', this._net_id, { reliable: true, runs: 100 } );

							this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						}
					}
					if ( command_name === 'ADMIN_CONTROLB' )
					{
						executer_socket;

						if ( this._socket )
						{
							executer_socket.SDServiceMessage( 'Player has connected socket' );
						}
						else
						{
							if ( !this._my_hash )
							{
								exectuter_character._socket = null;

								executer_socket.SDServiceMessage( 'Have a new start with other guy! :D' );

								this._ai_team = 0;
								this._ai_enabled = 0;
								this._ai = null;

								this._socket = executer_socket;
								executer_socket.character = this;
								this.skin_allowed = false;

								this.title_censored = exectuter_character.title_censored;

								this._god = false;

								sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_BUILD_TOOL }) );
								sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LVL3_LIGHT_ARMOR }) );

								this._my_hash = exectuter_character._my_hash;

								this.GiveScore( 3000, null, false );

								executer_socket.emit('SET sdWorld.my_entity', this._net_id, { reliable: true, runs: 100 } );

								this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

								exectuter_character.remove();
							}
							else
							{
								executer_socket.SDServiceMessage( 'Controlling no AI player is not allowed.' );
							}
						}
					}
				}

				//if ( exectuter_character ) 
				//if ( exectuter_character.hea > 0 ) 

				if ( exectuter_character === this )
				{
					if ( command_name === 'RTP' )
					{
						this.ManualRTPSequence( false );
					}

					if ( command_name === 'EMOTE' )
					{
						if ( parameters_array[ 0 ] === 'HEARTS' )
						{
							exectuter_character.ApplyStatusEffect({ type: sdStatusEffect.TYPE_HEARTS });
						}
						if ( parameters_array[ 0 ] === 'NOTHING' )
						{
							sdStatusEffect.PerformActionOnStatusEffectsOf( this, ( status_effect )=>
							{
								if ( status_effect.GetStatusType().is_emote )
								status_effect.remove();
							});
						}
					}

					/*if ( command_name === 'REMOVE_ARMOR' )
					{
						if ( exectuter_character.armor > 0 ) 
						{
							exectuter_character.RemoveArmor();
						}
					}*/
					if ( command_name === 'NO_TASKS' )
					{
						sdTask.PerformActionOnTasksOf( exectuter_character, ( task )=>
						{
							if ( task.mission !== sdTask.MISSION_TRACK_ENTITY )
							if ( task.mission !== sdTask.MISSION_TASK_CLAIM_REWARD )
							//if ( task._net_id === id )
							task.remove();
						});
					}
					if ( command_name === 'REMOVE_EFFECTS' )
					{
						//exectuter_character.stim_ef = 0;
						exectuter_character.power_ef = 0;
						exectuter_character.time_ef = 0;
					}

					if ( command_name === 'CC_SET_SPAWN' )
					{
						if ( exectuter_character )
						if ( exectuter_character.cc )
						if ( this.cc === exectuter_character.cc )
						{
							if ( exectuter_character._cc_rank < this._cc_rank || exectuter_character === this )
							{
								exectuter_character.cc.KickNetID( this, true );
							}
							else
							executer_socket.SDServiceMessage( 'Not enough rights to kick user' );
						}
					}

					if ( command_name === 'TOGGLE_LRTP_NAV' )
					{
						const sdLongRangeTeleport = sdWorld.entity_classes.sdLongRangeTeleport;

						let had_tasks = false;
						sdTask.PerformActionOnTasksOf( this, ( task )=>
						{
							if ( task.mission === sdTask.MISSION_TRACK_ENTITY )
							if ( task._target.is( sdLongRangeTeleport ) )
							if ( task._target.is_server_teleport )
							{
								had_tasks = true;
								task.remove();
							}
						});
						if ( !had_tasks )
						{
							for ( let i = 0; i < sdLongRangeTeleport.long_range_teleports.length; i++ )
							if ( sdLongRangeTeleport.long_range_teleports[ i ].is_server_teleport )
							{
								let e = sdLongRangeTeleport.long_range_teleports[ i ];

								sdTask.MakeSureCharacterHasTask({ 
									similarity_hash:'TRACK-LRTP'+e._net_id, 
									executer: exectuter_character,
									target: e,
									mission: sdTask.MISSION_TRACK_ENTITY,

									title: 'Long-range teleport navigation is enabled',
									description: 'You can toggle it in your character\'s context menu (or press Esc).'
								});
							}
						}
					}

					if ( command_name === 'STOP_TRACKING' )
					{
						let id = parameters_array[ 0 ];

						sdTask.PerformActionOnTasksOf( this, ( task )=>
						{
							if ( task.mission === sdTask.MISSION_TRACK_ENTITY )
							if ( task._net_id === id )
							task.remove();
						});
					}
				}


				if ( command_name === 'INSTALL_DRONE_GUN' )
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				if ( exectuter_character.matter >= 200 )
				//if ( this.is( sdPlayerDrone ) )
				if ( this.GetClass() === 'sdPlayerDrone' )
				if ( exectuter_character.is( sdCharacter ) )
				{
					let ents = sdWorld.GetAnythingNear( this.x, this.y, 32 );

					let ok = false;

					for ( let i = 0; i < ents.length; i++ )
					if ( ents[ i ].is( sdWeaponBench ) || ents[ i ].is( sdWorkbench ) )
					{
						ok = true;
						break;
					}

					if ( ok )
					{
						let gun = exectuter_character._inventory[ exectuter_character.gun_slot ];
						if ( gun && !sdGun.classes[ gun.class ].is_build_gun )
						{
							let guns = 0;
							for ( let i = 0; i < this._inventory.length; i++ )
							{
								if ( this._inventory[ i ] )
								guns++;
							}

							if ( guns < 2 )
							{
								exectuter_character.matter -= 200;
								exectuter_character.DropWeapon( exectuter_character.gun_slot );
								gun._unblocked_for_drones = true;
								gun.x = this.x;
								gun.y = this.y;
								this.onMovementInRange( gun );
							}
							else
							executer_socket.SDServiceMessage( 'Only 2 guns can be installed on a drone' );
						}
						else
						{
							executer_socket.SDServiceMessage( 'No gun to install' );
						}
					}
					else
					{
						executer_socket.SDServiceMessage( 'Procedure can be executed only near workbench and weapon bench' );
					}
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed || exectuter_character === sdWorld.my_entity )
		{
			/*if ( exectuter_character )
			this.AddPromptContextOption( 'Report this player', 'REPORT', [ undefined ], 'Specify report reason in short', '', 500 );*/
			
			if ( this.hea > 0 || exectuter_character === sdWorld.my_entity )
			if ( exectuter_character )
			if ( exectuter_character.hea > 0 || exectuter_character === sdWorld.my_entity )
			{
				if ( exectuter_character._god )
				{
					this.AddContextOption( 'Press "E"', 'ADMIN_PRESS', [ 'KeyE' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "Mouse1"', 'ADMIN_PRESS', [ 'Mouse1' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "Mouse2"', 'ADMIN_PRESS', [ 'Mouse2' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "1"', 'ADMIN_PRESS', [ 'Digit1' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "2"', 'ADMIN_PRESS', [ 'Digit2' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "3"', 'ADMIN_PRESS', [ 'Digit3' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "5"', 'ADMIN_PRESS', [ 'Digit5' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "6"', 'ADMIN_PRESS', [ 'Digit6' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "W"', 'ADMIN_TOGGLE', [ 'KeyW' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "S"', 'ADMIN_TOGGLE', [ 'KeyS' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "X"', 'ADMIN_TOGGLE', [ 'KeyX' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "Mouse1"', 'ADMIN_TOGGLE', [ 'Mouse1' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "Mouse2"', 'ADMIN_TOGGLE', [ 'Mouse2' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Drop current weapon', 'ADMIN_PRESS', [ 'KeyV' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Kill', 'ADMIN_KILL', [], true, { color:'ff0000' } );
					this.AddContextOption( 'Remove', 'ADMIN_REMOVE', [], true, { color:'ff0000' } );

					if ( this !== sdWorld.my_entity )
					{
						this.AddContextOption( 'Start controlling', 'ADMIN_CONTROL', [], { color:'ff0000' } );
						this.AddContextOption( 'Replace as player ( AI only, delete self-owned )', 'ADMIN_CONTROLB', [], { color:'ff0000' } );
					}
				}


				//this.AddContextOption( 'Report player', 'REPORT', [], { color:'ffff00' } );



				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
					if ( this === exectuter_character )
					{
						if ( sdWorld.is_singleplayer )
						{
							this.AddClientSideActionContextOption( 'Save & quit to main menu', ()=>
							{
								sdWorld.Stop();
								
								ClearWorld();
							});
							
							this.AddClientSideActionContextOption( 'Destroy this world', ()=>
							{
								if ( sdWorld.my_score < 50 || confirm( 'Are you sure you want to destroy this world?' ) )
								{
									sdWorld.Stop();
									
									//sdWorld.PreventSnapshotSaving();
									try
									{
										fs.unlinkSync( sdWorld.snapshot_path_const );
										sdDeepSleep.DeleteAllFiles();

									}catch(e){}
									
									ClearWorld();
								}
							});
						}
						else
						{
							this.AddClientSideActionContextOption( 'Main menu', ()=>
							{
								globalThis.manually_disconnected = true;
								globalThis.socket.disconnect();
								//GoToScreen('screen_settings');
							});
							
							this.AddClientSideActionContextOption( 'Settings & character customization', ()=>
							{
								globalThis.manually_disconnected = true;
								globalThis.socket.disconnect();
								GoToScreen('screen_settings');
							});
							
							this.AddClientSideActionContextOption( 'Quit and forget this character', ()=>
							{
								if ( sdWorld.my_score < 50 || confirm( 'Are you sure you want to forget this character?' ) )
								{
									sdWorld.Stop();
								}
							});
							this.AddContextOption( 'Teleport to closest/cheapest claimed rescue teleport', 'RTP', [] );

							this.AddClientSideActionContextOption( 'Copy character hash ID', ()=>
							{
								if( confirm( 'Sharing this with others, or not knowing how to use this properly can make you lose your character and progress. Are you sure?' ) )
								{
									prompt('This is your hash, keep it private and remember it to recover your character.', localStorage.my_hash /*+ "|" + localStorage.my_net_id*/ );
								}
							});
						}

						if ( this.cc_id )
						{
							this.AddContextOption( 'Leave team', 'CC_SET_SPAWN', [] );
						}

						//if ( this.armor > 0 )
						//this.AddContextOption( 'Lose armor', 'REMOVE_ARMOR', [] ); Seems pointless these days
						this.AddContextOption( 'Cancel all personal tasks', 'NO_TASKS', [] );

						if ( this.power_ef > 0 || this.time_ef > 0 )
						this.AddContextOption( 'Remove pack effects', 'REMOVE_EFFECTS', [] );

						this.AddContextOption( 'Emote: Hearts', 'EMOTE', [ 'HEARTS' ] );
						this.AddContextOption( 'Stop emotes', 'EMOTE', [ 'NOTHING' ] );

						this.AddContextOption( 'Toggle server long-range teleport navigation', 'TOGGLE_LRTP_NAV', [] );

						for ( let i = 0; i < sdTask.tasks.length; i++ )
						if ( sdWorld.is_singleplayer || sdTask.tasks[ i ]._executer === this )
						{
							let task = sdTask.tasks[ i ];

							if ( task.mission === sdTask.MISSION_TRACK_ENTITY )
							{
								let t = task.target_biometry;

								if ( sdWorld.client_side_censorship && task.biometry_censored )
								t = sdWorld.CensoredText( t );

								this.AddContextOptionNoTranslation( T( 'Stop tracking' ) + ' "' + t + '"', 'STOP_TRACKING', [ sdTask.tasks[ i ]._net_id ] );
							}
						}
					}
					else
					{
						if ( this.GetClass() === 'sdPlayerDrone' )
						if ( exectuter_character.is( sdCharacter ) )
						this.AddContextOption( 'Install current weapon (200 matter)', 'INSTALL_DRONE_GUN', [] );

						/*if ( this.cc_id === exectuter_character.cc_id )
						{

							this.AddContextOption( 'Kick from team', 'CC_SET_SPAWN', [] );
						}*/
					}
				}

				if ( this !== exectuter_character )
				{
					if ( this.cc_id !== 0 )
					if ( this.cc_id === exectuter_character.cc_id )
					this.AddContextOption( 'Kick from team', 'CC_SET_SPAWN', [] );
				}
			}
		}
	}
	
	MeasureMatterCost()
	{
		return 200; // Hack
	}
	
	static RegisterTalkIfNear( character, voice, phrase )
	{
		let prepare = true;
		
		for ( let i = 0; i < sdCharacter.characters.length; i++ )
		{
			let other = sdCharacter.characters[ i ];
			
			if ( other.hea > 0 )
			if ( other._ai_enabled === sdCharacter.AI_MODEL_TEAMMATE )
			if ( sdWorld.inDist2D_Boolean( other.x, other.y, character.x, character.y, 100 ) )
			{
				if ( prepare )
				{
					phrase = ' ' + phrase.toLowerCase() + ' ';
					prepare = false;
				}
				
				let React = ( substring )=>
				{
					return ( phrase.indexOf( substring ) !== -1 );
				};
				
				let Reply = ( s )=>
				{
					setTimeout( ()=>
					{
						if ( typeof s === 'string' )
						other.Say( s, false );
						else
						other.Say( s[ ~~( Math.random() * s.length ) ], false );
					}, 1000 );
				};
				
				if ( React( ' hi ' ) || React( 'hello' ) || React( ' hey ' ) || React( ' sup ' ) || React( ' good day ' ) )
				{
					Reply( [ 'Hi, [' + character.title + '].', 'Hello, [' + character.title + '].', 'How are you today, [' + character.title + ']?' ] );
				}
				else
				if ( React( 'what should i do' ) )
				{
					Reply( [ 'That is a great question. Press B key if you need to open build menu.' ] );
				}
				else
				if ( React( 'where do i get crystal' ) )
				{
					Reply( [ 'In ground.' ] );
				}
				else
				if ( React( 'jetpack' ) || React( 'fly' ) )
				{
					Reply( [ 'You can buy jetpack in upgrade category of build menu. You can open it with B key.' ] );
				}
				else
				if ( React( 'drag crystals' ) || React( 'drag items' ) )
				{
					Reply( [ 'You can drag items with a grappling hook. You can get it in upgrade category of build menu. You can open it with B key.' ] );
				}
				else
				if ( React( 'doesnt work' ) )
				{
					Reply( [ 'You need to use cable management tool (press 7) to connect base equipment with matter amplifiers. Matter amplifiers is where crystals can be put into.' ] );
				}
				else
				if ( React( 'fuck you' ) || React( 'fuck off' ) || React( 'get lost' ) || React( 'disappear' ) || React( 'go away' ) || React( 'shut up' ) || React( 'shut yo' ) || React( 'vanish' ) || React( 'i dont need you' ) || React( 'not talking to you' ) )
				{
					Reply( 'So mean.' );
					
					setTimeout( ()=>
					{
						let instructor_entity = other;
						
						sdWorld.SendEffect({ x:instructor_entity.x + (instructor_entity.hitbox_x1+instructor_entity.hitbox_x2)/2, y:instructor_entity.y + (instructor_entity.hitbox_y1+instructor_entity.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });

						sdSound.PlaySound({ name:'teleport', x:instructor_entity.x, y:instructor_entity.y, volume:0.5 });

						instructor_entity.remove();
						instructor_entity._broken = false;
						
					}, 3000 );
					
					return;
				}
				else
				{
					Reply( '..?' );
					return;
				}
			}
		}
	}
	
	Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false, simulate_sound=false, translate=true )
	{
		if ( to_self )
		{
			if ( !this._allow_self_talk )
			return;
		}
		
		let raise = 36;
		
		if ( this.driver_of )
		raise += 10;
		
		let params = { 
			x:this.x, 
			y:this.y - raise, 
			type:sdEffect.TYPE_CHAT, 
			attachment:this, 
			attachment_x: 0,
			attachment_y: -raise,
			text:t,
			color: this._chat_color,
			text_censored: undefined,
			voice:this._voice,
			no_ef:simulate_sound
		};
		
		let RequireCensorshipTest = ()=>
		{
			if ( params.text_censored === undefined )
			params.text_censored = ( typeof sdModeration === 'undefined' ) ? 0 : sdModeration.IsPhraseBad( t, this._socket );
		};
		
		if ( translate )
		params.t = 1;

		if ( sdWorld.is_server )
		{
			if ( sdWorld.time > this._say_allowed_in || ignore_rate_limit )
			{
				if ( !ignore_rate_limit )
				this._say_allowed_in = sdWorld.time + t.length * 50;
			
				RequireCensorshipTest();
				
				if ( to_self )
				{
					if ( this._socket )
					{
						params.attachment = [ params.attachment.GetClass(), params.attachment._net_id ];
						
						params.UC = sdWorld.event_uid_counter++;
						
						//this._socket.emit( 'EFF', params );
						this._socket.sd_events.push( [ 'EFF', params ] );
					}
				}
				else
				{
					if ( !params.text_censored )
					sdMimic.RegisterTalkIfNear( this, this._voice, t );
				
					if ( this._my_hash )
					if ( !simulate_sound )
					sdCharacter.RegisterTalkIfNear( this, this._voice, t );

					sdWorld.SendEffect( params );
				}
			}
		}
		else
		{
			if ( force_client_side )
			{
				RequireCensorshipTest();
				
				let ef = new sdEffect( params );
				sdEntity.entities.push( ef );
			}
		}
	}
}
//sdCharacter.init_class();

	
export default sdCharacter;
	
