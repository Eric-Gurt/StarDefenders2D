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
		
		// x y rotation, for images below
		/*sdCharacter.head_pos = {
			img_body_idle: [ 14, 11, 0 ],
			img_body_armed: [ 14, 11, 0 ],
			img_body_fire1: [ 13, 11, 0 ],
			img_body_fire2: [ 13, 11, 0 ],
			img_body_melee1: [ 16, 12, 0 ],
			img_body_melee2: [ 15, 11, 0 ],
			img_body_reload1: [ 16, 13, 22 ], // 45
			img_body_reload2: [ 15, 12, 0 ],
			img_body_hurt: [ 12, 11, -15 ],
			
			// death
			img_death1: [ 10, 13, -90 ],
			img_death2: [ 9, 18, -90 ],
			img_death3: [ 6, 28, -90 ],
			img_death4: [ 6, 29, -90 ]
		};*/
		
		sdCharacter.AI_MODEL_NONE = 0;
		sdCharacter.AI_MODEL_FALKOK = 1;
		sdCharacter.AI_MODEL_INSTRUCTOR = 2;
		sdCharacter.AI_MODEL_DUMMY_UNREVIVABLE_ENEMY = 3;
		sdCharacter.AI_MODEL_TEAMMATE = 4;
		sdCharacter.AI_MODEL_AGGRESSIVE = 5; // Has the AI aggressively charge their target.
		sdCharacter.AI_MODEL_DISTANT = 6; // // Has the AI try to retreat from their target and maintain distance between them.
		
		sdCharacter.ghost_breath_delay = 10 * 30;
		
		
		sdCharacter.img_jetpack = sdWorld.CreateImageFromFile( 'jetpack_sheet' ); // Sprite sheet by Molis

		sdCharacter.air_max = 30 * 30; // 30 sec
		
		//sdCharacter.bullet_y_spawn_offset = -2; // Not only used for sword attacks
		sdCharacter.bullet_y_spawn_offset = -5; // Not only used for sword attacks
		
		sdCharacter.last_build_deny_reason = null;
		
		sdCharacter.disowned_body_ttl = 30 * 60 * 1; // 1 min
	
		sdCharacter.starter_matter = 50;
		sdCharacter.matter_required_to_destroy_command_center = 300; // Will be used to measure command centres' self-destruct if no characters with enough matter will showup near them
		
		sdCharacter.default_weapon_draw_time = 7;
		
		sdCharacter.ignored_classes_when_holding_x = [ 'sdCharacter', 'sdBullet', 'sdWorkbench', 'sdLifeBox' ];
		sdCharacter.ignored_classes_when_not_holding_x = [ 'sdBullet', 'sdWorkbench', 'sdLifeBox' ];

		sdCharacter.characters = []; // Used for AI counting, also for team management
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	GetBleedEffect()
	{
		if ( this._voice.variant === 'whisperf' || this._voice.variant === 'croak' || this._voice.variant ==='m2' )
		return sdEffect.TYPE_BLOOD_GREEN;
		
		if ( this._voice.variant === 'klatt3' || this._voice.variant === 'silence' )
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
	
		return 0;
	}
	GetBleedEffectFilter()
	{
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
			let di_to_head = sdWorld.Dist2D( x, y, this.x, this.y - 8 );
			let di_to_body = sdWorld.Dist2D( x, y, this.x, this.y );

			if ( di_to_head < di_to_body )
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

				if ( Math.abs( sdWorld.time - this._last_discovery ) > 15000 )
				if ( this.hea > this.hmax * 0.75 )
				{
					this._last_discovery = sdWorld.time;

					switch ( ~~( Math.random() * 38 ) )
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
						case 10: this.Say( 'Wow, a real '+t, true, false, true ); break;
						case 11: this.Say( 'Gotta screenshot '+t, true, false, true ); break;
						case 12: this.Say( 'Wow, a '+t+'. I\'m literally shaking', true, false, true ); break;
						case 13: this.Say( t+' looks cool', true, false, true ); break;
						case 14: this.Say( 'We\'ve met again, '+t, true, false, true ); break;
						case 15: this.Say( 'Ah, the '+t, true, false, true ); break;

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
						case 31: this.Say( 'Nice, a '+t+'. But can I exchange '+t+' for more matter?', true, false, true ); break;
						case 32: this.Say( 'Huh, a '+t+' is ['+Math.round(ent._hitbox_x2 - ent._hitbox_x1)+'] units wide', true, false, true ); break;
						case 33: this.Say( 'Huh, a '+t+' is ['+Math.round(ent._hitbox_y2 - ent._hitbox_y1)+'] units in height', true, false, true ); break;
						case 34: this.Say( 'This '+t+' '+( ent._current_target === this ? 'looks threatening to me' : 'seems chill' ) ); break;
						case 35: this.Say( 'This '+t+' '+( ( ent._hea || ent.hea || 0 ) <= 0 ? 'looks rather dead' : 'looks rather healthy' ) ); break;
						case 36: this.Say( t+' is right there', true, false, true ); break;
						case 37: this.Say( 'This day can\'t get any better with '+t+', can\'t it?', true, false, true ); break;
					}
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
			this.stability = Math.max( -100, this.stability - this._ignored_stability_damage );
			this._ignored_stability_damage = 0;
		}
	}
	
	constructor( params )
	{
		super( params );
		
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
			
		this._global_user_uid = null; // Multiple sdCharacter-s can have same _global_user_uid because it points to user, not a character - user can have multiple characters. This can be null is sandbox modes that chose not to use global accounts yet might use presets and translations
		
		this.lag = false;
		
		this._god = false;
		
		this._discovered = {}; // Entity classes with type hashes, makes player gain starter score
		this._last_discovery = sdWorld.time; // Do not interrupt instructor as much

		this._can_breathe = true;
		
		this.helmet = 1;
		this.body = 1;
		this.legs = 1;
		
		this._weapon_draw_timer = 0;
		
		this._in_water = false;
		
		this._ledge_holding = false;
		
		this.driver_of = null;
		this._potential_vehicle = null; // Points at vehicle which player recently did hit
		
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
		this.build_tool_level = 0; // Used for some unlockable upgrades in build tool
		this._jetpack_fuel_multiplier = 1; // Fuel cost reduction upgrade
		this._matter_regeneration_multiplier = 1; // Matter regen multiplier upgrade
		this._stability_recovery_multiplier = 1; // How fast does the character recover after stability damage?
		//this.workbench_level = 0; // Stand near workbench to unlock some workbench build stuff
		this._task_reward_counter = 0;

		this._score_to_level = 50;// How much score is needed to level up character?
		this._score_to_level_additive = 50; // How much score it increases to level up next level
		this._max_level = 30; // Current maximum level for players to reach

		//this._acquired_bt_mech = false; // Has the character picked up build tool upgrade that the flying mech drops?
		//this._acquired_bt_rift = false; // Has the character picked up build tool upgrade that the portals drop?
		//this._acquired_bt_score = false; // Has the character reached over 5000 score?
		//this._acquired_bt_projector = false; // Has the character picked up build tool upgrade that the dark matter beam projectors drop?
		this.flying = false; // Jetpack flying
		this.free_flying = false; // Flying in mid-air ( water )
		//this._last_act_y = this.act_y; // For mid-air jump jetpack activation
		
		this.ghosting = false;
		this._ghost_breath = 0; // Time until next breath as ghost
		this._last_e_state = 0; // For E key taps to activate ghosting
		this._last_fire_state = 0; // For semi auto weaponry
		
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
		
		//this.team_id = 0; // 0 is FFA team
	
		this.matter = sdCharacter.starter_matter;
		this.matter_max = sdCharacter.starter_matter;
		
		this._matter_capacity_boosters = 0; // Cube shards are increasing this value
		this._matter_capacity_boosters_max = 20 * 45;
		
		this.stim_ef = 0; // Stimpack effect
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
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		if ( this.is( sdCharacter ) ) // Prevent ragdoll spawn for drones and overlords
		{
			this._ragdoll = new sdCharacterRagdoll( this );
			/*
			if ( sdWorld.is_singleplayer )
			{
				trace( this._is_being_removed );
				EnforceChangeLog( this, '_is_being_removed' );
				EnforceChangeLog( this, '_ragdoll' );
			}*/
		}
		
		this._allow_self_talk = true;
		this._camera_zoom = sdWorld.default_zoom;
		
		this._has_rtp_in_range = false; // Updated only when socket is connected. Also measures matter. Works only when hints are working"

		this._voice_channel = sdSound.CreateSoundChannel( this );
		
		sdCharacter.characters.push( this );
	}
	SetCameraZoom( v )
	{
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

		return -Math.PI / 2 - Math.atan2( this.y + offset.y - this.look_y, this.x + offset.x - this.look_x );
	}
	
	ReloadAndCombatLogic( GSPEED )
	{
		if ( this._weapon_draw_timer > 0 )
		this._weapon_draw_timer = Math.max( 0, this._weapon_draw_timer - GSPEED );
		
		if ( this._recoil > 0 )
		this._recoil = Math.max( 0, sdWorld.MorphWithTimeScale( this._recoil , -0.01, 0.935 , GSPEED ) ); //0.9 was "laser beams" basically and nullified the point for "Recoil upgrade"
		//this._recoil = Math.max( 0, sdWorld.MorphWithTimeScale( this._recoil , -0.01, 0.935 * this._recoil_mult , GSPEED ) ); //0.9 was "laser beams" basically and nullified the point for "Recoil upgrade"

		if ( this.fire_anim > 0 )
		this.fire_anim = Math.max( 0, this.fire_anim - GSPEED );




		let offset = null;
		
		for ( let i = 0; i < this._inventory.length; i++ )
		if ( this._inventory[ i ] )
		this._inventory[ i ].UpdateHeldPosition();

		if ( this.reload_anim > 0 )
		{
			this.reload_anim -= GSPEED * ( ( this.stim_ef > 0 ) ? 1.25 : 1 );

			if ( this.reload_anim <= 0 )
			{
				if ( this._inventory[ this.gun_slot ] )
				this._inventory[ this.gun_slot ].ReloadComplete();
			}
		}
		else
		{
			if ( !this.driver_of )
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

								bullet_obj.time_left *= ( this.s / 100 );

								bullet_obj._damage *= ( this.s / 100 );

								if ( this._ai_team === 1 )
								if ( this.title === 'Falkonian Sword Bot' )
								bullet_obj._damage = 250; // Falkonian sword bot should be lethal at close range.

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
			if ( this._key_states.GetKey( 'KeyV' ) && !this.driver_of )
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
		}
	}

	WeaponSwitchLogic( GSPEED )
	{
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
		return ( this._key_states.GetKey('KeyX') || !this.IsDamageAllowedByAdmins() ) ? sdCharacter.ignored_classes_when_holding_x : sdCharacter.ignored_classes_when_not_holding_x;
	}
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( !this.ghosting )
		return true;
		
		if ( this.driver_of )
		if ( !this.driver_of._is_being_removed )
		if ( this.driver_of.VehicleHidesDrivers() )
		if ( !this.driver_of.IsVisible( observer_character ) )
		return false;
	
		if ( observer_character )
		if ( observer_character.IsPlayerClass() )
		if ( observer_character._god )
		return true;
		
		//if ( !observer_character || !observer_character.is( sdCharacter ) )
		if ( !observer_character || typeof observer_character._socket === 'undefined' ) // Let player-controlled drones see players in NCZ
		if ( !sdArea.CheckPointDamageAllowed( this.x, this.y ) )
		return false;
	
		if ( this.flying || this.free_flying || this.hea <= 0 || ( this.fire_anim > 0 && this.gun_slot !== 0 ) || this.pain_anim > 0 || this._auto_shoot_in > 0 || this.time_ef > 0 )
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
	
	GetRandomEntityNearby() // From sdOverlord but checks for classes for enemies instead of considering anything as a target
	{
		let an = Math.random() * Math.PI * 2;

		if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.x + Math.sin( an ) * 900, this.y + Math.cos( an ) * 900, this ) )
		if ( sdWorld.last_hit_entity )
		{
			let found_enemy = false;
			if ( sdWorld.last_hit_entity.is( sdCharacter ) ||  sdWorld.last_hit_entity.GetClass() === 'sdDrone' || sdWorld.last_hit_entity.GetClass() === 'sdEnemyMech' || sdWorld.last_hit_entity.GetClass() === 'sdSpider' || sdWorld.last_hit_entity.GetClass() === 'sdSetrDestroyer' )
			if ( sdWorld.last_hit_entity._ai_team !== this._ai_team )
			found_enemy = true;

			if ( sdWorld.last_hit_entity.GetClass() === 'sdPlayerDrone' || sdWorld.last_hit_entity.GetClass() === 'sdPlayerOverlord' )
			if ( this._ai_team !== 0 )
			found_enemy = true;

			if (	sdWorld.last_hit_entity.GetClass() === 'sdAmphid' || 
					sdWorld.last_hit_entity.GetClass() === 'sdAsp' || 
					sdWorld.last_hit_entity.GetClass() === 'sdBadDog' || 
					sdWorld.last_hit_entity.GetClass() === 'sdOctopus' || 
					sdWorld.last_hit_entity.GetClass() === 'sdQuickie' || 
					sdWorld.last_hit_entity.GetClass() === 'sdSandWorm' || 
					sdWorld.last_hit_entity.GetClass() === 'sdVirus' || 
					sdWorld.last_hit_entity.GetClass() === 'sdTutel' || 
					sdWorld.last_hit_entity.GetClass() === 'sdFaceCrab' || 
					sdWorld.last_hit_entity.GetClass() === 'sdBiter'  ||
					sdWorld.last_hit_entity.GetClass() === 'sdAbomination' ||
					( sdWorld.last_hit_entity.GetClass() === 'sdBomb' && sdWorld.inDist2D_Boolean( sdWorld.last_hit_entity.x, sdWorld.last_hit_entity.y, this.x, this.y, 150 ) ) ||
					( sdWorld.last_hit_entity.GetClass() === 'sdBarrel' && sdWorld.inDist2D_Boolean( sdWorld.last_hit_entity.x, sdWorld.last_hit_entity.y, this.x, this.y, 150 ) && sdWorld.last_hit_entity.armed < 100 ) // Attack not yet armed barrels (for Councils?)
			) 
			found_enemy = true;

			if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && this._ai_team !== 0 )
			if ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_WALL || 
					sdWorld.last_hit_entity.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ||
					sdWorld.last_hit_entity.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 ||
					sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP ) // Attack player built walls
			if ( sdWorld.last_hit_entity._ai_team === 0 ) // Don't attack if it's own faction outpost walls
			found_enemy = true;

			if ( sdWorld.last_hit_entity.is( sdCube ) ) // Only confront cubes when they want to attack AI
			if ( this._nature_damage >= this._player_damage + 60 )
			found_enemy = true;

			if ( found_enemy === true )
			return sdWorld.last_hit_entity;
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
		for ( let i = 0; i < targets.length; i++ )
		{
			if ( targets[ i ].is( sdBlock ) )
			if ( targets[ i ].material === sdBlock.MATERIAL_GROUND || targets[ i ]._ai_team !== this._ai_team )
			{
				this._ai.target = targets[ i ];
				return;
			}
		}
		this._ai.direction = -this._ai.direction; // Change direction if no suitable blocks are found
	}

	InstallUpgrade( upgrade_name ) // Ignores upper limit condition. Upgrades better be revertable and resistent to multiple calls within same level as new level
	{
		if ( ( this._upgrade_counters[ upgrade_name ] || 0 ) + 1 > sdShop.upgrades[ upgrade_name ].max_level )
		{
			return;
		}
		
		
		
		
		var upgrade_obj = sdShop.upgrades[ upgrade_name ];
		
		if ( typeof this._upgrade_counters[ upgrade_name ] === 'undefined' )
		this._upgrade_counters[ upgrade_name ] = 1;
		else
		this._upgrade_counters[ upgrade_name ]++;
	
		upgrade_obj.action( this, this._upgrade_counters[ upgrade_name ] );
		
		if ( this._socket )
		this._socket.emit( 'UPGRADE_SET', [ upgrade_name, this._upgrade_counters[ upgrade_name ] ] );
	}
	/*get hitbox_x1() { return this.s / 100 * ( this.death_anim < 10 ? -5 : -5 ); } // 7
	get hitbox_x2() { return this.s / 100 * ( this.death_anim < 10 ? 5 : 5 ); }
	get hitbox_y1() { return this.s / 100 * ( this.death_anim < 10 ? -12 : 10 ); }
	get hitbox_y2() { return this.s / 100 * ( this.death_anim < 10 ? ( ( 16 - this._crouch_intens * 6 ) ) : 16 ); }*/
	
	get hitbox_x1() { return this.s / 100 * ( -5 ); }
	get hitbox_x2() { return this.s / 100 * ( 5 ); }
	get hitbox_y1() { return this.s / 100 * ( this.death_anim < 10 ? ( -12 + this._crouch_intens * 6 ) : 10 ); }
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
	Impact( vel ) // fall damage basically
	{
		//if ( vel > 7 )
		if ( vel > 6.5 ) // For new mass-based model
		{
			//this.DamageWithEffect( ( vel - 4 ) * 15 );
			this.DamageWithEffect( ( vel - 3 ) * 17, null, false, false );
			
			this.DamageStability( vel * sdCharacter.stability_damage_from_velocity_changes_scale );
		}
	}
	AttemptTeleportOut( from_ent=null, lost_effect=false )
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
																				
			if ( !lost_effect || t.IsCloner() )
			if ( close_enough )
			if ( t._owner === this || t.owner_biometry === this.biometry )
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
			copy_ent._ai_enabled = sdCharacter.AI_MODEL_DUMMY_UNREVIVABLE_ENEMY;
			copy_ent._god = false;
			copy_ent._socket = null;
			copy_ent._my_hash = undefined;
			copy_ent.matter = 0;
			copy_ent.biometry = -2;
			
			copy_ent.death_anim = sdCharacter.disowned_body_ttl - 2480 / 1000 * 30; // Vanishing opacity
						
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
				best_t.AddDriver( this, true );
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
					'Not the last time',
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
	
	Damage( dmg, initiator=null, headshot=false, affects_armor=true )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._god )
		if ( this._socket ) // No disconnected gods
		if ( dmg > 0 )
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
		if ( ( this._my_hash !== undefined || this._socket || this.title === 'Player from the shop' ) && 
		     ( initiator._my_hash !== undefined || initiator._socket || initiator.title === 'Player from the shop' ) ) // Both are real players or at least test dummie from the shop
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
					{
						if ( !initiator._ai || ( initiator._ai && initiator._ai_team !== this._ai_team ) ) //Math.random() < ( 0.333 - Math.min( 0.33, ( 0.09 * this._ai_level ) ) ) ) // 3 times less friendly fire for Falkoks, also reduced by their AI level
						{
							if ( !this._ai.target )
							this.PlayAIAlertedSound( initiator );
							
							this._ai.target = initiator;
							
							
							if ( Math.random() < 0.3 ) // 30% chance
							this.AIWarnTeammates();
						}
						else
						if ( initiator._ai_team === this._ai_team && Math.random() < ( 0.333 - Math.min( 0.33, ( 0.09 * this._ai_level ) ) ) ) // 3 times less friendly fire for Falkoks, also reduced by their AI level
						this._ai.target = initiator;

					}
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
					
					this.RemoveArmor();
					
					
				}
			}
			
			//console.log( 'Final HP damage to receive: ' + damage_to_deal );
			
			if ( was_alive )
			if ( this.hea - damage_to_deal <= 0 )
			{
				if ( this.AttemptTeleportOut( initiator ) )
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
				if ( this._voice.variant === 'croak' )
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
				}
			
				this._sickness /= 4;
				
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
					sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
					else
					sdSound.PlaySound({ name:'block4', 
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
							sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter() });
							sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, filter:this.GetBleedEffectFilter(), sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
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
			this._dying = true;
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
		if ( this._ai_enabled === sdCharacter.AI_MODEL_FALKOK || this._ai_enabled === sdCharacter.AI_MODEL_AGGRESSIVE || this._ai_enabled === sdCharacter.AI_MODEL_DUMMY_UNREVIVABLE_ENEMY || this._ai_enabled === sdCharacter.AI_MODEL_DISTANT )
		{
			return true;
		}
		
		return false;
	}
						
	PlayAIAlertedSound( closest )
	{
		if ( this._voice.variant === 'whisperf' )
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
		}
	}
	AILogic( GSPEED ) // aithink
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._ai_enabled === sdCharacter.AI_MODEL_FALKOK || this._ai_enabled === sdCharacter.AI_MODEL_AGGRESSIVE || this._ai_enabled === sdCharacter.AI_MODEL_TEAMMATE || this._ai_enabled === sdCharacter.AI_MODEL_DISTANT )
		{
			if ( typeof this._ai.next_action === 'undefined' )
			this._ai.next_action = 5; // At 30 they get shot down before they can even react

			if ( typeof this._ai.direction === 'undefined' )
			this._ai.direction = ( Math.random() < 0.5 ) ? 1 : -1;

			if ( ( this._ai.direction > 0 && this.x > sdWorld.world_bounds.x2 - 24 ) || ( this._ai.direction < 0 && this.x < sdWorld.world_bounds.x1 + 24 ) )
			{
				if ( this._ai_team !== 0 && this._ai_team !== 6 )// Prevent SD and Instructor from disappearing
				this.remove();
				return;
			}

			if ( !this._ai.target || this._ai.target._is_being_removed )
			{
				this._ai.target = null;
				
				this._ai.target = this.GetRandomEntityNearby();
				if ( this._ai.target)
				this.PlayAIAlertedSound( this._ai.target );
			}

			if ( this._ai.target && this._ai_enabled !== sdCharacter.AI_MODEL_TEAMMATE )
			{
				this._ai_enabled = this.GetBehaviourAgainstTarget(); // Set their fighting behaviour appropriately when they fight specific enemies
			}
			this._ai.next_action -= GSPEED;

			if ( this._ai.next_action <= 0 )
			{
				this._ai.next_action = 5 + Math.random() * 10;

				if ( this.gun_slot !== this._ai_gun_slot )
				{
					this.gun_slot = this._ai_gun_slot;
					this._weapon_draw_timer = sdCharacter.default_weapon_draw_time;
				}

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

				this._key_states.SetKey( 'Mouse1', 0 );

				if ( this._ai_stay_near_entity ) // Is there an entity AI should stay near?
				{
					if ( !this._ai_stay_near_entity._is_being_removed && !sdWorld.inDist2D_Boolean( this.x, this.y, this._ai_stay_near_entity.x, this._ai_stay_near_entity.y, this._ai_stay_distance ) ) // Is the AI too far away from the entity?
					{
						// Move towards entity
						if ( this.x > this._ai_stay_near_entity.x )
						this._key_states.SetKey( 'KeyA', 1 );

						if ( this.x < this._ai_stay_near_entity.x )
						this._key_states.SetKey( 'KeyD', 1 );

						if ( this.y > this._ai_stay_near_entity.y )
						this._key_states.SetKey( 'KeyW', 1 );

					}
				}
				else
				this._ai_stay_near_entity = null;

				if ( closest )
				{
					if ( !this._ai.target )
					{
						this.PlayAIAlertedSound( closest );
					}

					this._ai.target = closest;
					this._ai.target_local_y = closest._hitbox_y1 + ( closest._hitbox_y2 - closest._hitbox_y1 ) * Math.random();

					let should_fire = true; // Sometimes prevents friendly fire, not ideal since it updates only when ai performs "next action"
					if ( this.look_x - this._ai.target.x > 60 || this.look_x - this._ai.target.x < -60 ) // Don't shoot if you're not looking near or at the target
					should_fire = false;
					if ( this.look_y - this._ai.target.y > 60 || this.look_y - this._ai.target.y < -60 ) // Same goes here but Y coordinate
					should_fire = false;
					if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.look_x, this.look_y, this, null, ['sdCharacter'] ) )
					if ( sdWorld.last_hit_entity && sdWorld.last_hit_entity._ai_team === this._ai_team )
					should_fire = false;
					if ( this._ai_enabled === sdCharacter.AI_MODEL_FALKOK )
					{
						if ( Math.random() < 0.3 )
						this._key_states.SetKey( 'KeyA', 1 );

						if ( Math.random() < 0.3 )
						this._key_states.SetKey( 'KeyD', 1 );

						if ( Math.random() < 0.2 || ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30  ) )
						this._key_states.SetKey( 'KeyW', 1 );

						if ( Math.random() < 0.4 )
						this._key_states.SetKey( 'KeyS', 1 );
					}

					if ( this._ai_enabled === sdCharacter.AI_MODEL_AGGRESSIVE )
					{
						if ( this.x > closest.x + 32 )
						this._key_states.SetKey( 'KeyA', 1 );

						if ( this.x < closest.x - 32 )
						this._key_states.SetKey( 'KeyD', 1 );

						if ( Math.random() < 0.2 || ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30  ) || ( this.y > closest.y + Math.random() * 64 ) )
						this._key_states.SetKey( 'KeyW', 1 );

						if ( Math.random() < 0.4 )
						this._key_states.SetKey( 'KeyS', 1 );
					}

					if ( this._ai_enabled === sdCharacter.AI_MODEL_DISTANT )
					{
						if ( this.x < closest.x && this.x > ( closest.x - 250 ) )
						this._key_states.SetKey( 'KeyA', 1 );
						else
						if ( this.x > closest.x && this.x < ( closest.x + 250 ) )
						this._key_states.SetKey( 'KeyD', 1 );

						if ( Math.random() < 0.2 || ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30 ) )
						this._key_states.SetKey( 'KeyW', 1 );

						if ( Math.random() < 0.1 )
						this._key_states.SetKey( 'KeyS', 1 );
					}

					if ( Math.random() < 0.05 && should_fire === true  ) // Shoot the walls occasionally, when target is not in sight but was detected previously
					{
						this._key_states.SetKey( 'Mouse1', 1 );
					}
					else
					if ( Math.random() < 0.25 + Math.min( 0.75, ( 0.25 * this._ai_level ) ) && should_fire === true ) // Shoot on detection, depends on AI level
					{

						if ( !this._ai.target.is( sdBlock ) ) // Check line of sight if not targeting blocks
						{
							if ( sdWorld.CheckLineOfSight( this.x, this.y, this._ai.target.x, this._ai.target.y, this, sdCom.com_visibility_ignored_classes, null ) )
							if ( sdWorld.CheckLineOfSight( this.x, this.y, this.look_x, this.look_y, this, sdCom.com_visibility_ignored_classes, null ) )
							this._key_states.SetKey( 'Mouse1', 1 );
						}
						else
						{
							if ( this._ai_dig > 0 ) // If AI should dig blocks, shoot
							this._key_states.SetKey( 'Mouse1', 1 );

							if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.look_x, this.look_y, this, null, ['sdBlock'] ) && // Scenario for targetting player built blocks from neutral
								 sdWorld.last_hit_entity && // Can be null when hits void
								 sdWorld.last_hit_entity.is( sdBlock ) && // Just in case
								 ( 
									sdWorld.last_hit_entity === this._ai.target 
									|| 
									( sdWorld.last_hit_entity.GetClass() === this._ai.target.GetClass() && sdWorld.last_hit_entity.material === this._ai.target.material ) 
								)
							)
							{
								this._ai.target = sdWorld.last_hit_entity;
								this._key_states.SetKey( 'Mouse1', 1 );
							}
							else
							{
								this._ai.target = this.GetRandomEntityNearby();
								//if ( this._ai.target )
								//this.PlayAIAlertedSound( this._ai.target );
							}
						}
					}
				}
				else
				{
					if ( this._ai.direction > 0 )
					this._key_states.SetKey( 'KeyD', ( Math.random() < 0.5 ) ? 1 : 0 );
					else
					this._key_states.SetKey( 'KeyA', ( Math.random() < 0.5 ) ? 1 : 0 );

					sdWorld.last_hit_entity = null;

					if ( sdWorld.CheckWallExistsBox( this.x + this._ai.direction * 16 - 16, this.y + this._hitbox_y2 - 32 + 1, this.x + this._ai.direction * 16 + 16, this.y + this._hitbox_y2 - 1, this, null, null ) ||  ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30 )  )
					this._key_states.SetKey( 'KeyW', 1 );
					else
					{
						// Try to go through walls of any kinds
						if ( sdWorld.last_hit_entity )
						//if ( sdWorld.last_hit_entity._natural === false || sdWorld.last_hit_entity.is( sdDoor ) || sdWorld.last_hit_entity.is( sdMatterContainer ) || ( !sdWorld.last_hit_entity.is( sdCharacter ) && Math.random() < 0.01 ) )
						if ( sdWorld.last_hit_entity._natural === false || sdWorld.last_hit_entity.is( sdDoor ) || sdWorld.last_hit_entity.is( sdMatterContainer ) || ( !sdWorld.last_hit_entity.is( sdCharacter ) && Math.random() < ( 0.01 * this._ai_level ) ) )
						{
							closest = sdWorld.last_hit_entity;

							this._ai.target = closest;
							this._ai.target_local_y = closest._hitbox_y1 + ( closest._hitbox_y2 - closest._hitbox_y1 ) * Math.random();
						}
					}
				}
			}

			if ( this._ai.target && this._ai.target.IsVisible( this ) )
			{
				this.look_x = sdWorld.MorphWithTimeScale( this.look_x, this._ai.target.x, Math.max( 0.5, ( 0.8 - 0.15 * this._ai_level ) ), GSPEED );
				this.look_y = sdWorld.MorphWithTimeScale( this.look_y, this._ai.target.y + ( this._ai.target_local_y || 0 ), Math.max( 0.5, ( 0.8 - 0.15 * this._ai_level ) ), GSPEED );
			}
			else
			{
				this.look_x = sdWorld.MorphWithTimeScale( this.look_x, this.x + this._ai.direction * 400, 0.9, GSPEED );
				this.look_y = sdWorld.MorphWithTimeScale( this.look_y, this.y + Math.sin( sdWorld.time / 2000 * Math.PI ) * 50, 0.9, GSPEED );

				this._key_states.SetKey( 'Mouse1', 0 );
			}
		}
		else
		if ( this._ai_enabled === sdCharacter.AI_MODEL_INSTRUCTOR )
		{
			// Logic is done elsewhere (in config file), he is so far just idle and friendly
		}
	}
	GetBulletSpawnOffset()
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
		// 14 is a full width, so revived players don't stuck in each other
		/*if ( !this.CanMoveWithoutOverlap( this.x, this.y, this.UseServerCollisions() ? 0 : 0.01 ) )
		{
			if ( this.CanMoveWithoutOverlap( this.x, this.y - 14 ) )
			this.y -= 0.5;

			if ( this.CanMoveWithoutOverlap( this.x, this.y + 14 ) )
			this.y += 0.5;

			if ( this.CanMoveWithoutOverlap( this.x - 14, this.y ) )
			this.x -= 0.5;

			if ( this.CanMoveWithoutOverlap( this.x + 14, this.y ) )
			this.x += 0.5;
		}*/
		
		return true;
	}


	TogglePlayerGhosting() // part of ManagePlayerVehicleEntrance()
	{
		if ( this._ghost_allowed || this.ghosting )
		{
			this.ghosting = !this.ghosting;
			this._ghost_breath = sdCharacter.ghost_breath_delay;

			if ( this.ghosting )
			sdSound.PlaySound({ name:'ghost_start', x:this.x, y:this.y, volume:1 });
			else
			sdSound.PlaySound({ name:'ghost_stop', x:this.x, y:this.y, volume:1 });
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
	ManagePlayerVehicleEntrance()
	{
		let e_state = this._key_states.GetKey( 'KeyE' );

		if ( this.hea > 0 && this._frozen <= 0 )
		if ( e_state )
		if ( e_state !== this._last_e_state )
		{
			if ( this.driver_of )
			{
				this.driver_of.ExcludeDriver( this );
				//this.driver_of = null;
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
					this.TogglePlayerGhosting();
				}
				else
				this.TogglePlayerGhosting();
				/*if ( this._ghost_allowed )
				{
					this.ghosting = !this.ghosting;
					this._ghost_breath = sdCharacter.ghost_breath_delay;

					if ( this.ghosting )
					sdSound.PlaySound({ name:'ghost_start', x:this.x, y:this.y, volume:1 });
					else
					sdSound.PlaySound({ name:'ghost_stop', x:this.x, y:this.y, volume:1 });
				}*/
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
			this.y + this._hitbox_y2 - 1, this, this.GetIgnoredEntityClasses(), this.GetNonIgnoredEntityClasses() );
	}
	
	ConnecgtedGodLogic( GSPEED )
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
		if ( sdWorld.server_config.enable_bounds_move && sdWorld.server_config.aggressive_hibernation )
		if ( Math.abs( this.x ) > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_x ||
			 this.y < sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_min ||
			 this.y > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_max )
		{
			return true;
		}
		
		return false;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		this.lst = sdLost.entities_and_affection.get( this ) || 0;
	
		if ( this._respawn_protection > 0 )
		this._respawn_protection = Math.max( 0, this._respawn_protection - GSPEED );
		
		this.ConnecgtedGodLogic( GSPEED );
		
		this._nature_damage = sdWorld.MorphWithTimeScale( this._nature_damage, 0, 0.9983, GSPEED );
		this._player_damage = sdWorld.MorphWithTimeScale( this._player_damage, 0, 0.9983, GSPEED );
		/*
		if ( this._score >= this._score_to_level && this.build_tool_level < this._max_level )
		{
			this.build_tool_level++;
			this._score_to_level_additive = this._score_to_level_additive * 1.04;
			this._score_to_level = this._score_to_level + this._score_to_level_additive;
		}*/
		
		if ( this.hea <= 0 )
		{
			if ( this.AttemptTeleportOut() )
			return;
		
			this.MatterGlow( 0.01, 30, GSPEED );

			if ( this.death_anim < 90 )
			this.death_anim += GSPEED;
			else
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
				this._ai = {};

				this.AILogic( GSPEED );
			}
			
			if ( this._sickness > 0 )
			{
				this._sick_damage_timer += GSPEED;
				if ( this._sick_damage_timer > 6000 / this._sickness )
				{
					this._sick_damage_timer = 0;
					
					this._sickness = Math.max( 0, this._sickness - 10 );
					this.DamageWithEffect( 10, this._last_sickness_from_ent, false, false );
					sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_BLOOD_GREEN, filter:'none' });
					
					// And then it spreads to players near, sounds fun
					
					let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 50, null, [ 'sdCharacter' ] );
					
					let itself = targets_raw.indexOf( this );
					if ( itself !== -1 )
					targets_raw.splice( itself, 1 );
					
					for ( let i = 0; i < targets_raw.length; i++ )
					{
						if ( targets_raw[ i ].IsTargetable( this ) )
						targets_raw[ i ]._sickness += 5 / targets_raw.length;
					}
					
					if ( this._sickness === 0 )
					{
						this._last_sickness_from_ent = null;
					}
				}
			}


			if ( this._dying )
			{
				this.DamageWithEffect( GSPEED * 0.1, null, false, false );
				
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
							this.armor += Math.min( this.armor_max, GSPEED * ( this._armor_repair_amount / 3000 ) );
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

				if ( this._task_reward_counter >= sdTask.reward_claim_task_amount ) // was 1 but players told me it takes too long
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
			if ( !this.ghosting )
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
		

		let act_y_or_unstable = ( this.driver_of ) ? 0 : this.act_y;
		
		if ( this.stability < 50 )
		act_y_or_unstable = 1;
	
	
		//let new_x = this.x + this.sx * GSPEED;
		//let new_y = this.y + this.sy * GSPEED;
		
		let speed_scale = 1 * ( 1 - ( this.armor_speed_reduction / 100 ) );
		
		speed_scale *= Math.max( 0.1, this.stability / 100 );
		
		let walk_speed_scale = speed_scale;
		
		//let leg_height;
		//let new_leg_height;
		
		if ( act_y_or_unstable )
		walk_speed_scale *= 0.5;
	
		let can_uncrouch = -1;
		
		if ( ( ( act_y_or_unstable === 1 ) ? 1 : 0 ) !== this._crouch_intens )
		{
			//leg_height = this.hitbox_y2;
			
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
					/*else
					{
						if ( this._crouch_intens > 1 )
						{
							this.stability = Math.min( 25, this.stability );
						}
					}*/
				}
			}
			//new_leg_height = this.hitbox_y2; // Through getter
		}
		else
		{
			//leg_height = new_leg_height = this._hitbox_y2; // Fake-ish outdated value since there is no crouch
		}
		
		//this._hitbox_y2 = new_leg_height; // Prevent short-term stucking in ground
		
		//leg_height		*= 0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7;
		//new_leg_height  *= 0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7;
	
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

				if ( this._jetpack_allowed )
				if ( this._key_states.GetKey( 'KeyW' ) && this._key_states.GetKey( 'Space' ) )
				{
					this.free_flying = true;
				
					if ( this._socket || this._ai || sdWorld.my_entity === this )
					if ( this.act_x !== 0 || this.act_y !== 0 )
					this.PhysWakeUp();
				}
				else
				if ( this._key_states.GetKey( 'KeyS' ) && this._key_states.GetKey( 'Space' ) )
				{
					this.free_flying = false;
				}
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

			if ( this.hea > 0 && ( !this.driver_of || this.hook_relative_to ) && ( this._key_states.GetKey( 'Mouse2' ) || this._key_states.GetKey( 'KeyC' ) ) && this._hook_allowed )
			{
				if ( this._hook_once )
				{
					this._hook_once = false;

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
						bullet_obj.time_left = 8.5;

						sdEntity.entities.push( bullet_obj );
					}
					else
					{
						//this.hook_x = 0;
						//this.hook_y = 0;
						
						sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, volume:1, pitch:2 });
						this.hook_relative_to = null;
						this.hook_len = -1;
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

				if ( this.hook_relative_to.is( sdCube ) )
				this.hook_relative_to.PlayerIsHooked( this, GSPEED );
			}

			let from_y = this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2;

			let cur_di = sdWorld.Dist2D( this.x, from_y, hook_x, hook_y );

			if ( cur_di < 1 )
			cur_di = 1;

			if ( this.hook_len === -1 )
			this.hook_len = cur_di;

			if ( cur_di > this.hook_len + 128 )
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
				if ( !this._stands_on._is_being_removed )
				if ( this._stands_on._hard_collision )
				if ( this.x + this._hitbox_x1 <= this._stands_on.x + this._stands_on._hitbox_x2 )
				if ( this.x + this._hitbox_x2 >= this._stands_on.x + this._stands_on._hitbox_x1 )
				if ( this.y + this._hitbox_y1 + 0.1 <= this._stands_on.y + this._stands_on._hitbox_y2 )
				if ( this.y + this._hitbox_y2 + 0.1 >= this._stands_on.y + this._stands_on._hitbox_y1 )
				{
					sdWorld.last_hit_entity = this._stands_on;

					still_stands = true;
				}

				if ( !still_stands )
				if ( Math.abs( this.sx ) > 0.01 ) // Moving left/right, it is only needed for seamless sliding
				{
					sdWorld.last_hit_entity = null;
					if ( sdWorld.CheckWallExistsBox( this.x + this._hitbox_x1, this.y + this._hitbox_y1 + 0.1, this.x + this._hitbox_x2, this.y + this._hitbox_y2 + 0.1, this, this.GetIgnoredEntityClasses(), null, null ) )
					if ( sdWorld.last_hit_entity )
					{
						// Sets sdWorld.last_hit_entity;

						this._stands_on = sdWorld.last_hit_entity;

						still_stands = true;
					}
				}
			}

			//if ( still_stands || !this.CanMoveWithoutOverlap( this.x, this.y + 2, 0.0001 ) )
			if ( still_stands )//|| !this.CanMoveWithoutOverlap( this.x, this.y + 2, 0.0001 ) )
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
				if ( sdWorld.CheckWallExistsBox( this.x + this.act_x * 7, this.y, this.x + this.act_x * 7, this.y + 10, null, null, sdCharacter.climb_filter ) )
				if ( !sdWorld.CheckWallExists( this.x + this.act_x * 7, this.y + this._hitbox_y1, null, null, sdCharacter.climb_filter ) )
				{
					ledge_holding = true;
				}
			}
		}


		// Walljumps
		if ( act_y_or_unstable === -1 )
		if ( !this.stands )
		if ( !this.driver_of )
		if ( Math.abs( this.sy ) < 3 )
		if ( Math.abs( this.sx ) < 3 )
		{
			if ( this.act_x !== -1 )
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
			}
		}
		
		let in_water = sdWater.all_swimmers.has( this );
		
		this._in_water = in_water;
		
		if ( ( this._key_states.GetKey( 'KeyX' ) && !this.driver_of ) || ( in_water && !this._can_breathe ) )
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
				if ( this.stability < 20 )
				this.free_flying = false;

				if ( can_uncrouch === -1 )
				can_uncrouch = this.CanUnCrouch();

				if ( this._crouch_intens <= 1 || can_uncrouch )
				this.stability = Math.min( 100, this.stability + ( Math.max( 0, this.stability ) * 0.1 + GSPEED * 2.5 * this._stability_recovery_multiplier ) * GSPEED );
			}
		}
	
		//this.tilt += this.tilt_speed * GSPEED;
		
		
		this.ManagePlayerFlashLight();
		
		this.ManagePlayerVehicleEntrance();
		
		
		if ( this.ghosting )
		{
			let fuel_cost = 0.4 * GSPEED; // 0.4 Previously
			
			if ( this.matter < fuel_cost || this.hea <= 0 || this.driver_of )
			{
				//this.ghosting = false;
				this.TogglePlayerGhosting();
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
		
		//this.flying = true; // Hack
		
		if ( this.flying && !this.free_flying )
		{
			let di = Math.max( 1, sdWorld.Dist2D_Vector( this.act_x, this.act_y ) );
			
			let x_force = this.act_x / di * 0.1;
			let y_force = ( this.act_y * this._jetpack_power ) / di * 0.1 - sdWorld.gravity;
			
			let fuel_cost = GSPEED * sdWorld.Dist2D_Vector( x_force, y_force ) * this._jetpack_fuel_multiplier;

			if ( ( this.stands && this.act_y !== -1 ) || this.driver_of || this._in_water || this.free_flying || this.act_y !== -1 || this._key_states.GetKey( 'KeyX' ) || this.matter < fuel_cost || this.hea <= 0 )
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
				 !this.free_flying &&
				 !this.stands )
			this.flying = true;
		
			//this._last_act_y = this.act_y;
		}

		if ( this.free_flying )
		{
			let di = Math.max( 1, sdWorld.Dist2D_Vector( this.act_x, this.act_y ) );
			
			let x_force = ( this.act_x * this._jetpack_power ) / di * 0.1;
			let y_force = ( this.act_y * this._jetpack_power ) / di * 0.1 - sdWorld.gravity;
			
			let fuel_cost = GSPEED * sdWorld.Dist2D_Vector( x_force, y_force ) * this._jetpack_fuel_multiplier;
			this.matter -= fuel_cost;

			if ( this.driver_of || this.stands || this._in_water || this.matter < fuel_cost || this.hea <= 0 )
			this.free_flying = false;
		}
		
		let can_breathe = false;

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
		if ( this.driver_of && this.driver_of.VehicleHidesDrivers() )
		can_breathe = true;
	
		// And near BSUs
		if ( !can_breathe )
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

		if ( in_water || this.free_flying )
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
			
			if ( this.free_flying )
			{
				this.sx += x_force * 0.2 * this._jetpack_power * GSPEED;
				this.sy += y_force * 0.2 * this._jetpack_power * GSPEED;
			}
			else
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
								sdSound.PlaySound({ name:'player_step', x:this.x, y:this.y, volume:0.5 });
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
						//if ( this._crouch_intens > 0.1 )
						//this.sy = Math.min( this.sy, -6 );
						//else
						this.sy = Math.min( this.sy, -4 * speed_scale /*( 1 - ( this.armor_speed_reduction / 100 ) )*/ );
					}
					else
					{
						this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.8, GSPEED );
						
						if ( !this.driver_of )
						this.sx += this.act_x * 1.25 * GSPEED * walk_speed_scale;

						let old_walk = this._anim_walk;
						this._anim_walk += Math.abs( this.sx ) * 0.2 / walk_speed_scale * GSPEED;

						if ( old_walk < 5 && this._anim_walk >= 5 )
						if ( !this.ghosting )
						if ( this._crouch_intens < 0.5 )
						sdSound.PlaySound({ name:'player_step', x:this.x, y:this.y, volume:0.25, _server_allowed:true });

						if ( this._anim_walk > 10 )
						this._anim_walk = 0;
					}
				}
			}
			else
			{
				if ( ledge_holding && ( !this.flying && !this.free_flying ) )
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
					this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.98, GSPEED );
					this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.98, GSPEED );

					if ( this.flying || this.free_flying )
					{
					}
					else
					if ( !this.driver_of )
					this.sx += this.act_x * 0.15 * GSPEED;
					//this.sx += this.act_x * 0.2 * GSPEED;


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
		this.ApplyVelocityAndCollisions( GSPEED, this.GetStepHeight(), ( this.hea <= 0 ) );
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
									
		if ( sdWorld.is_server && !this._socket && !this._ai && this._phys_sleep <= 0 && !in_water && !this.free_flying && !this.driver_of && this.hea > 0 && !this._dying && this.pain_anim <= 0 && this.death_anim <= 0 )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
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
			this.x = this.driver_of.x;
			this.y = this.driver_of.y;
			this.sx = this.driver_of.sx || 0;
			this.sy = this.driver_of.sy || 0;
		}
	}

	HandlePlayerPowerups( GSPEED )
	{
		if ( this.stim_ef > 0 )
		this.stim_ef = Math.max( 0, this.stim_ef - GSPEED );
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
		
		//
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
		for ( var i = 0; i < this._inventory.length; i++ )
		this.DropWeapon( i );
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
		if ( this._inventory[ i ] )
		{
			//console.log( this.title + ' drops gun ' + this._inventory[ i ]._net_id );
		
			if ( typeof this._inventory[ i ]._held_by === 'undefined' )
			debugger; // Pickable items should have this property

			if ( this.hea <= 0 || this._is_being_removed )
			{
				this._inventory[ i ].y = this.y + 16 - 4;

				this._inventory[ i ].sx += Math.random() * 6 - 3;
				this._inventory[ i ].sy -= Math.random() * 3;
			}
			else
			{
				let an = this.GetLookAngle();
				
				this._inventory[ i ].sx += Math.sin( an ) * 5;
				this._inventory[ i ].sy += Math.cos( an ) * 5;
				
				this._ignored_guns_infos.push( { ent: this._inventory[ i ], until: sdWorld.time + 300 } );
			}

			this._inventory[ i ].ttl = sdGun.disowned_guns_ttl;
			this._inventory[ i ]._held_by = null;
			this._inventory[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			this._inventory[ i ] = null;
			
			this.TriggerMovementInRange();
		}
		//else
		//console.log( this.title + ' is unable to drop drop gun with slot ' + i );
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
		
		if ( from_entity.IsBGEntity() === this.IsBGEntity() )
		if ( from_entity._hard_collision )
		{
			if ( this.y + this._hitbox_y2 >= from_entity.y + from_entity._hitbox_y1 - this.GetStepHeight() )
			if ( this.x + this._hitbox_x2 > from_entity.x + from_entity._hitbox_x1 )
			if ( this.x + this._hitbox_x1 < from_entity.x + from_entity._hitbox_x2 )
			if ( this.GetIgnoredEntityClasses().indexOf( from_entity.GetClass() ) === -1 )
			{
				let remote_ignored = from_entity.GetIgnoredEntityClasses();
				if ( remote_ignored === null || remote_ignored.indexOf( this.GetClass() ) === -1 )
				{
					this.stands = true;
					this._stands_on = from_entity;
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
								sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:1.5 }, [ this._socket ] );
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
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim < 20 && !this.driver_of )
		{
			let w = 20 * Math.max( 0.5, this.s / 100 );
			
			let raise = 5 + 15 * this.s / 100;
			
			raise -= this._crouch_intens * 6;
			
			let show_air = false;
			
			if ( sdWorld.my_entity === this )
			if ( this.air < sdCharacter.air_max )
			{
				show_air = true;
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
			
			ctx.textAlign = 'center';
			
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
		fake_ent.GetIgnoredEntityClasses = sdEntity.prototype.GetIgnoredEntityClasses; // Discard effect of this method because doors will have problems in else case
		
		if ( fake_ent.GetClass() === 'sdGun' )
		{
			fake_ent.GetIgnoredEntityClasses = ()=>[ 'sdCharacter', 'sdGun' ];
		}
		
		if ( sdWorld.Dist2D( this.x, this.y, this._build_params.x, this._build_params.y ) < 64 || this._god )
		{
			//if ( this.stands || this._in_water || this.flying || ( this.hook_relative_to && sdWorld.Dist2D_Vector( this.sx, this.sy ) < 2 ) || this._god )
			{
				// This is used to make it include sdButton-s when putting new sdButtons on top
				const custom_filtering_method = ( e )=>
				{
					if ( !fake_ent._hard_collision ) 
					{
						return true;
					}
					
					return e._hard_collision;
				};
				
				//if ( fake_ent.CanMoveWithoutOverlap( fake_ent.x, fake_ent.y, 0.00001 ) ) // Very small so entity's velocity can be enough to escape this overlap
				//new_x, new_y, safe_bound=0, custom_filtering_method=null, alter_ignored_classes=null
				if ( fake_ent.CanMoveWithoutOverlap( fake_ent.x, fake_ent.y, 0, custom_filtering_method ) )
				{
					if ( fake_ent.IsEarlyThreat() )
					//if ( fake_ent.is( sdTurret ) || fake_ent.is( sdCom ) || fake_ent.is( sdBarrel ) || fake_ent.is( sdBomb ) || ( fake_ent.is( sdBlock ) && fake_ent.material === sdBlock.MATERIAL_SHARP ) )
					{
						//if ( sdWorld.CheckLineOfSight( this.x, this.y, this._build_params.x, this._build_params.y, null, null, sdCom.com_visibility_unignored_classes ) || this._god )
						if ( sdWorld.CheckLineOfSight( this.x, this.y, this._build_params.x, this._build_params.y, fake_ent, null, sdCom.com_visibility_unignored_classes ) || this._god )
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
					
					if ( !this._god )
					if ( !sdArea.CheckPointDamageAllowed( this._build_params.x, this._build_params.y ) )
					{
						sdCharacter.last_build_deny_reason = 'This area is currently restricted from combat and building';
						return false;
					}
					
					//if ( sdWorld.Dist2D( this.x, this.y, this._build_params.x, this._build_params.y ) < 64 )
					//{
						//if ( this.stands || this._in_water || this.flying || ( this.hook_relative_to && sdWorld.Dist2D_Vector( this.sx, this.sy ) < 2 ) )
						return true;
						//else
						//sdCharacter.last_build_deny_reason = 'I\'d need to stand on something or at least use jetpack';
					//}
					//else
					//sdCharacter.last_build_deny_reason = 'Can\'t build that far';
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
								 ( obstacle._shielded === null || fake_ent._owner === obstacle._owner ) )
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
							if ( fake_ent.IsBGEntity() === 1 && obstacle.is( sdBG ) )
							{
								if ( allow_erase )
								{
									sdCharacter.last_build_deny_reason = null;
									obstacle.remove();
									return this.CheckBuildObjectPossibilityNow( fake_ent, allow_erase );
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
	CreateBuildObject( check_placement_and_range=true, demo_mode=false ) // Can be removed later on and used as fake signle-frame object in general
	{
		if ( this._build_params === null )
		{
			sdCharacter.last_build_deny_reason = 'Nothing selected for build? Does this error even happen?';
			return null;
		}
	
		if ( this._build_params._class === null ) // Upgrades
		{
			//sdCharacter.last_build_deny_reason
			return null;
		}
	
		if ( ( this._build_params._min_build_tool_level || 0 ) > this.build_tool_level )
		{
			sdCharacter.last_build_deny_reason = 'Nice hacks bro';
			return null;
		}

		//if ( ( this._build_params._min_workbench_level || 0 ) > this.workbench_level )
		if ( ( this._build_params._min_workbench_level || 0 ) > this.GetWorkBenchLevel() )
		{
			sdCharacter.last_build_deny_reason = 'I need a workbench to build this';
			return null;
		}
			
		//this._build_params._spawner = this;
		
		
		// Note: X and Y are weird here. This can cause hash array being incorrect - hash update is important to do after entity was placed properly! It can not be done earlier due to entity sizes being unknown too
		let fake_ent = new sdWorld.entity_classes[ this._build_params._class ]( Object.assign( { initiator: this }, this._build_params ) );
		
		fake_ent.UpdateHitbox();
		
		this._build_params.x = this.look_x;
		this._build_params.y = this.look_y;
		
		fake_ent.x = ( this.look_x - ( fake_ent._hitbox_x2 + fake_ent._hitbox_x1 ) / 2 );
		fake_ent.y = ( this.look_y - ( fake_ent._hitbox_y2 + fake_ent._hitbox_y1 ) / 2 );
		
		if ( !demo_mode )
		{
			if ( fake_ent._owner !== undefined )
			fake_ent._owner = this; // Source of price to go up

			if ( fake_ent.owner !== undefined )
			fake_ent.owner = this;

			if ( fake_ent.owner_biometry !== undefined )
			fake_ent.owner_biometry = this.biometry;

			if ( fake_ent._owner_biometry !== undefined )
			fake_ent._owner_biometry = this.biometry;

			/*if ( fake_ent._hmax !== undefined )
			fake_ent._hmax *= this._build_hp_mult; // Source of price to go up

			if ( fake_ent.hmax !== undefined )
			fake_ent.hmax *= this._build_hp_mult; // Source of price to go up

			if ( fake_ent._hea !== undefined )
			fake_ent._hea *= this._build_hp_mult; // Or else initial damage might instantly destroy it

			if ( fake_ent.hea !== undefined )
			fake_ent.hea *= this._build_hp_mult; // Or else initial damage might instantly destroy it
			*/
			if ( fake_ent._armor_protection_level !== undefined )
			if ( this._upgrade_counters[ 'upgrade_build_hp' ] )
			{
				fake_ent._armor_protection_level = this._upgrade_counters[ 'upgrade_build_hp' ]; // Because starts at 1

				if ( fake_ent.is( sdBlock ) )
				if ( fake_ent.material !== sdBlock.MATERIAL_WALL )
				fake_ent._armor_protection_level = 0;
			}
		}
		
		if ( fake_ent.RequireSpawnAlign() )
		{
			fake_ent.x = Math.round( fake_ent.x / fake_ent.spawn_align_x ) * fake_ent.spawn_align_x;
			fake_ent.y = Math.round( fake_ent.y / fake_ent.spawn_align_y ) * fake_ent.spawn_align_y;
		}
		
		if ( check_placement_and_range )
		{
			if ( !this.CheckBuildObjectPossibilityNow( fake_ent ) )
			{
				//fake_ent.onRemove = fake_ent.onRemoveAsFakeEntity; // Disable any removal logic
				fake_ent.SetMethod( 'onRemove', fake_ent.onRemoveAsFakeEntity ); // Disable any removal logic
				fake_ent.remove();
				fake_ent._remove();
				return null;
			}
		}
		
		return fake_ent;
	}
	AnnounceTooManyEffectsIfNeeded()
	{
		if ( this.stim_ef > 30 * 3 || this.power_ef > 30 * 3 || this.time_ef > 30 * 3 )
		{
			this.Say( [ 'I\'m in', 'That is a power', 'Make your bets', 'Check out this combo', 'Good luck' ][ ~~( Math.random() * 3 ) ], false, false, true );
		}
	}
	Draw( ctx, attached )
	{
		if ( ( this._inventory[ this.gun_slot ] && this._inventory[ this.gun_slot ].muzzle > 0 ) || ( this.flying || this.free_flying ) )
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
		
		//ctx.filter = this.filter;
		ctx.sd_filter = this.sd_filter;
		
		if ( this.stim_ef > 0 && ( ( sdWorld.time ) % 1000 < 500 || this.stim_ef > 30 * 3 ) )
		ctx.filter = 'sepia(1) hue-rotate(-50deg) contrast(0.8) saturate(7) drop-shadow(0px 0px 1px #ff0000)';
	
		if ( this.power_ef > 0 && ( ( sdWorld.time + 100 ) % 1000 < 500 || this.power_ef > 30 * 3 ) )
		ctx.filter = 'sepia(1) hue-rotate(140deg) contrast(0.8) saturate(7) drop-shadow(0px 0px 1px #33ffff)';
	
		if ( this.time_ef > 0 && ( ( sdWorld.time + 200 ) % 1000 < 500 || this.time_ef > 30 * 3 ) )
		ctx.filter = 'grayscale(1) brightness(0.5) contrast(1.5) drop-shadow(0px 0px 1px #000000)';
		
		const char_filter = ctx.filter;
		
		if ( !attached )
		if ( this.hook_relative_to )
		{
			let from_y = this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2;
			
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#c0c0c0';
			ctx.beginPath();
			ctx.moveTo( 0,from_y - this.y );
			ctx.lineTo( this.hook_relative_to.x + this.hook_relative_x - this.x, this.hook_relative_to.y + this.hook_relative_y - this.y );
			ctx.stroke();
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
					if ( !character.AttemptTeleportOut( null, false ) )
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

					if ( command_name === 'REMOVE_ARMOR' )
					{
						if ( exectuter_character.armor > 0 ) 
						{
							exectuter_character.RemoveArmor();
						}
					}

					if ( command_name === 'REMOVE_EFFECTS' )
					{
						exectuter_character.stim_ef = 0;
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
		if ( !this._is_being_removed )
		{
			/*if ( exectuter_character )
			this.AddPromptContextOption( 'Report this player', 'REPORT', [ undefined ], 'Specify report reason in short', '', 500 );*/
			
			if ( this.hea > 0 )
			if ( exectuter_character )
			if ( exectuter_character.hea > 0 )
			{
				if ( exectuter_character._god )
				{
					this.AddContextOption( 'Press "E"', 'ADMIN_PRESS', [ 'KeyE' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "Mouse1"', 'ADMIN_PRESS', [ 'Mouse1' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "Mouse2"', 'ADMIN_PRESS', [ 'Mouse2' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "1"', 'ADMIN_PRESS', [ 'Digit1' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "2"', 'ADMIN_PRESS', [ 'Digit2' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Press "5"', 'ADMIN_PRESS', [ 'Digit5' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "W"', 'ADMIN_TOGGLE', [ 'KeyW' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "S"', 'ADMIN_TOGGLE', [ 'KeyS' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "X"', 'ADMIN_TOGGLE', [ 'KeyX' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "Mouse1"', 'ADMIN_TOGGLE', [ 'Mouse1' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Toggle "Mouse2"', 'ADMIN_TOGGLE', [ 'Mouse2' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Drop current weapon', 'ADMIN_PRESS', [ 'KeyV' ], true, { color:'ff0000' } );
					this.AddContextOption( 'Kill', 'ADMIN_KILL', [], true, { color:'ff0000' } );
					this.AddContextOption( 'Remove', 'ADMIN_REMOVE', [], true, { color:'ff0000' } );

					this.AddContextOption( 'Start controlling', 'ADMIN_CONTROL', [], { color:'ff0000' } );
				}


				//this.AddContextOption( 'Report player', 'REPORT', [], { color:'ffff00' } );



				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
					if ( this === exectuter_character )
					{
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

						if ( this.cc_id )
						{
							this.AddContextOption( 'Leave team', 'CC_SET_SPAWN', [] );
						}

						if ( this.armor > 0 )
						this.AddContextOption( 'Lose armor', 'REMOVE_ARMOR', [] );

						if ( this.stim_ef > 0 || this.power_ef > 0 || this.time_ef > 0 )
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
			text_censored: ( typeof sdModeration === 'undefined' ) ? 0 : sdModeration.IsPhraseBad( t, this._socket ),
			voice:this._voice,
			no_ef:simulate_sound
		};
		
		if ( translate )
		params.t = 1;

		if ( sdWorld.is_server )
		{
			if ( sdWorld.time > this._say_allowed_in || ignore_rate_limit )
			{
				if ( !ignore_rate_limit )
				this._say_allowed_in = sdWorld.time + t.length * 50;
				
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

					sdWorld.SendEffect( params );
				}
			}
		}
		else
		{
			if ( force_client_side )
			{
				let ef = new sdEffect( params );
				sdEntity.entities.push( ef );
			}
		}
	}
}
//sdCharacter.init_class();

	
export default sdCharacter;
	
