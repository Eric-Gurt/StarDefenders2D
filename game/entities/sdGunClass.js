
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdBlock from './sdBlock.js';
import sdGun from './sdGun.js';

class sdGunClass
{
	static init_class()
	{
		/*
		
			Uses defined indices in order to optimize performance AND to keep gun classes compatible across different snapshots.
		
			Will also check for Index problems and tell you if any of changes that are done will cause server to crash eventually (cases like missing indices between few existing indices and index intersection)
		
			Variables prefixed as sdGun.CLASS_* are the indices, here they are assigned during gun class object creation and specify index at sdGun.classes array where bug class object will exist.
		
			You can execute this:
				sdWorld.entity_classes.sdGun.classes
			in devTools console in order to see how it will be stored in the end.
			
			Sure we could insert classes by doing something like sdGun.classes.push({ ... }); but that would not store index of class in array for later quick spawning of new guns.
			We could also do something like sdGun.classes[ sdGun.classes.length ] = { ... }; but that would not give us consistency across different versions of the game and also it seems 
				like sometimes whoever adds new classes seems to be addin them in the middle of the list. Don't do that - add them at the very end.
		
			Once sdGun-s are saved to snapshots only their ID is saved. It means that if IDs will be changed - it is quite possible to convert existing sdGun.CLASS_TRIPLE_RAIL into sdGun.FISTS which isn't event 
				a spawnable gun (only projectile properties are copied from it).
		
			Now press "Ctrl + Shift + -" if you are in NetBeans and go do the impressive!
		
		*/
		sdGun.classes[ sdGun.CLASS_PISTOL = 0 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'pistol' ),
			sound: 'gun_pistol',
			title: 'Pistol',
			slot: 1,
			reload_time: 10,
			muzzle_x: 4,
			ammo_capacity: 12,
			spread: 0.01,
			count: 1,
			projectile_properties: { _damage: 20 }
		};
		
		sdGun.classes[ sdGun.CLASS_RIFLE = 1 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'rifle' ),
			sound: 'gun_rifle',
			title: 'Assault rifle',
			slot: 2,
			reload_time: 3,
			muzzle_x: 7,
			ammo_capacity: 30,
			spread: 0.01, // 0.03
			count: 1,
			projectile_properties: { _damage: 25 }
		};
		
		sdGun.classes[ sdGun.CLASS_SHOTGUN = 2 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shotgun' ),
			sound: 'gun_shotgun',
			title: 'Shotgun',
			slot: 3,
			reload_time: 20,
			muzzle_x: 9,
			ammo_capacity: 8,
			count: 5,
			spread: 0.1,
			matter_cost: 40,
			projectile_properties: { _damage: 20 }
		};
		
		sdGun.classes[ sdGun.CLASS_RAILGUN = 3 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'railgun' ),
			sound: 'gun_railgun',
			title: 'Railgun',
			slot: 4,
			reload_time: 30,
			muzzle_x: 7,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 50,
			projectile_properties: { _rail: true, _damage: 70, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ }
		};
		
		sdGun.classes[ sdGun.CLASS_ROCKET = 4 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'rocket' ),
			sound: 'gun_rocket',
			title: 'Rocket launcher',
			slot: 5,
			reload_time: 30,
			muzzle_x: 7,
			ammo_capacity: -1,
			spread: 0.05,
			projectile_velocity: 14,
			count: 1,
			matter_cost: 60,
			projectile_properties: { explosion_radius: 19, model: 'rocket_proj', _damage: 19 * 3, color:sdEffect.default_explosion_color, ac:1 }
		};
		
		sdGun.classes[ sdGun.CLASS_MEDIKIT = 5 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'medikit' ),
			sound: 'gun_defibrillator',
			title: 'Defibrillator',
			slot: 6,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { time_left: 2, _damage: -20, color: 'transparent', _return_damage_to_owner:true }
		};
		
		sdGun.classes[ sdGun.CLASS_SPARK = 6 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'spark' ),
			sound: 'gun_spark',
			title: 'Spark',
			slot: 8,
			reload_time: 7,
			muzzle_x: 7,
			ammo_capacity: 16,
			count: 1,
			matter_cost: 60,
			projectile_velocity: 16,
			projectile_properties: { explosion_radius: 10, model: 'ball', _damage: 5, color:'#00ffff' }
		};
		
		sdGun.classes[ sdGun.CLASS_BUILD_TOOL = 7 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'buildtool' ),
			sound: 'gun_buildtool',
			title: 'Build tool',
			slot: 9,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			is_build_gun: true,
			projectile_properties: { _damage: 0 }
		};
		
		sdGun.classes[ sdGun.CLASS_CRYSTAL_SHARD = 8 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'crystal_shard' ),
			title: 'Crystal shard',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				// 2 was too bad for case of randomly breaking crystals when digging
				if ( character.matter + gun.extra <= character.matter_max )
				{
					character.matter += gun.extra;
					gun.remove(); 
				}

				return false; 
			} 
		};
		
		sdGun.classes[ sdGun.CLASS_GRENADE_LAUNCHER = 9 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'grenade_launcher' ),
			sound: 'gun_grenade_launcher',
			title: 'Grenade launcher',
			slot: 5,
			reload_time: 20,
			muzzle_x: 7,
			ammo_capacity: -1,
			spread: 0.05,
			count: 1,
			projectile_velocity: 7,
			matter_cost: 60,
			projectile_properties: { explosion_radius: 13, time_left: 30 * 3, model: 'grenade', _damage: 13 * 2, color:sdEffect.default_explosion_color, is_grenade: true }
		};
		
		sdGun.classes[ sdGun.CLASS_SNIPER = 10 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sniper' ),
			image0: [ sdWorld.CreateImageFromFile( 'sniper0' ), sdWorld.CreateImageFromFile( 'sniper0b' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'sniper1' ), sdWorld.CreateImageFromFile( 'sniper1b' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'sniper2' ), sdWorld.CreateImageFromFile( 'sniper2b' ) ],
			sound: 'gun_sniper',
			title: 'Sniper rifle',
			slot: 4,
			reload_time: 90,
			muzzle_x: 11,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: sdGun.default_projectile_velocity * 2,
			matter_cost: 60,
			projectile_properties: { _damage: 105, /*_knock_scale:0.01 * 8, */penetrating:true }
		};
		
		sdGun.classes[ sdGun.CLASS_SWORD = 11 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sword' ),
			//sound: 'gun_medikit',
			title: 'Sword',
			sound: 'sword_attack2',
			image_no_matter: sdWorld.CreateImageFromFile( 'sword_disabled' ),
			slot: 0,
			reload_time: 8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			projectile_velocity: 16 * 1.5,
			projectile_properties: { time_left: 1, _damage: 35, color: 'transparent', _knock_scale:0.025 * 8 }
		};
		
		sdGun.classes[ sdGun.CLASS_STIMPACK = 12 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'stimpack' ),
			sound: 'gun_defibrillator',
			title: 'Stimpack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 300,
			projectile_velocity: 16,
			projectile_properties: { time_left: 2, _damage: 50, color: 'transparent', _return_damage_to_owner:true, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( target_entity.is( sdCharacter ) )
					{
						target_entity.stim_ef = 30 * 10;
					}
				}
			}
		};
		
		sdGun.classes[ sdGun.CLASS_FALKOK_RIFLE = 13 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'f_rifle' ),
			sound: 'gun_f_rifle',
			title: 'Assault Rifle C-01r',
			slot: 2,
			reload_time: 3,
			muzzle_x: 7,
			ammo_capacity: 35,
			spread: 0.02,
			count: 1,
			projectile_properties: { _damage: 25, color:'#afdfff' },
			spawnable: false
		};
		
		sdGun.classes[ sdGun.CLASS_TRIPLE_RAIL = 14 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'triple_rail' ),
			sound: 'cube_attack',
			title: 'Cube-gun',
			slot: 4,
			reload_time: 3,
			muzzle_x: 7,
			ammo_capacity: -1,// 10, // 3
			count: 1,
			projectile_properties: { _rail: true, _damage: 15, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ }, // 70
			spawnable: false
		};
		
		sdGun.classes[ sdGun.CLASS_FISTS = 15 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sword' ),
			//sound: 'gun_medikit',
			title: 'Fists',
			image_no_matter: sdWorld.CreateImageFromFile( 'sword_disabled' ),
			slot: 0,
			reload_time: 8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 16 * 1.2,
			spawnable: false,
			projectile_properties: { time_left: 1, _damage: 15, color: 'transparent', _soft:true, _knock_scale:0.4, _custom_target_reaction:( bullet, target_entity )=>
				{
					//debugger;
					//if ( sdCom.com_creature_attack_unignored_classes.indexOf( target_entity.GetClass() ) !== -1 )
					if ( target_entity.GetClass() !== 'sdCharacter' )
					if ( target_entity.is_static || target_entity.GetBleedEffect() === sdEffect.TYPE_WALL_HIT )
					if ( target_entity.GetClass() !== 'sdBlock' || target_entity.material !== sdBlock.MATERIAL_GROUND )
					//if ( target_entity.material !== ''
					{
						bullet._owner.Damage( 5 );
					}
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					bullet._owner.Damage( 5 );
				}
			}
		};
		
		sdGun.classes[ sdGun.CLASS_SABER = 16 ] = { // Original weapon idea & pull request by Booraz149 ( https://github.com/Booraz149 ), image editing & sound effects by Eric Gurt
			image: sdWorld.CreateImageFromFile( 'sword2b' ),
			sound: 'saber_attack',
			sound_volume: 1.5,
			title: 'Saber',
			image_no_matter: sdWorld.CreateImageFromFile( 'sword2b_disabled' ),
			slot: 0,
			reload_time: 10,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			matter_cost: 90, // Was 200, but I don't feel like this weapon is overpowered enough to have high cost like stimpack does /EG
			projectile_velocity: 20 * 1.5,
			projectile_properties: { time_left: 1, _damage: 60, color: 'transparent', _knock_scale:0.025 * 8, 
				_custom_target_reaction:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5 });
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5 });
				}
			}
		};
		
		sdGun.classes[ sdGun.CLASS_RAIL_PISTOL = 17 ] = { // Original weapon idea, image & pull request by Booraz149 ( https://github.com/Booraz149 )
			image: sdWorld.CreateImageFromFile( 'rail_pistol' ),
			sound: 'cube_attack',
			sound_pitch: 0.9,
			title: 'Cube-pistol',
			slot: 1,
			reload_time: 9,
			muzzle_x: 6,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { _rail: true, _damage: 25, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false
		};
		
		sdGun.classes[ sdGun.CLASS_RAYGUN = 18 ] = { // Original sprite and weapon balancing by The_Commander 
				image: sdWorld.CreateImageFromFile( 'raygun_c01y' ),
				image0: [ sdWorld.CreateImageFromFile( 'raygun_c01y0' ), sdWorld.CreateImageFromFile( 'raygun_c01y0b' ) ],
				image1: [ sdWorld.CreateImageFromFile( 'raygun_c01y1' ), sdWorld.CreateImageFromFile( 'raygun_c01y1b' ) ],
				image2: [ sdWorld.CreateImageFromFile( 'raygun_c01y2' ), sdWorld.CreateImageFromFile( 'raygun_c01y2b' ) ],
				sound: 'gun_raygun',
				title: 'Raygun C01y',
				slot: 3,
				reload_time: 60, // Might be inaccurate - not checked
				muzzle_x: 9,
				ammo_capacity: -1,
				count: 3,
				projectile_velocity: 14 * 2,
				spread: 0.15,
				projectile_properties: { _damage: 40, color: '#DDDDDD', penetrating: true }, // I nerfed it's damage from 45 to 40 but that's up to balancing decisions - Booraz149
				spawnable:false
		};

		sdGun.classes[ sdGun.CLASS_FALKOK_PSI_CUTTER = 19 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'f_psicutter' ),
			sound: 'gun_psicutter',
			sound_volume: 1.5,
			title: 'Falkonian PSI-cutter',
			slot: 4,
			reload_time: 60,
			muzzle_x: 11,
			ammo_capacity: -1,
			spread: 0.01,
			count: 1,
			projectile_velocity: 10 * 2,  // Slower bullet velocity than sniper but more damage
			projectile_properties: { _damage: 55/*111*/, color:'#00ffff', model: 'f_psicutter_proj'/*, _knock_scale:0.01 * 8*/, penetrating: false, _bouncy: true },
			spawnable:false
		};
		
		sdGun.classes[ sdGun.CLASS_RAIL_SHOTGUN = 20 ] = { // Image by LazyRain
			image: sdWorld.CreateImageFromFile( 'rail_shotgun' ),
			sound: 'cube_attack',
			sound_pitch: 0.4,
			sound_volume: 2,
			title: 'Cube-shotgun',
			slot: 3,
			reload_time: 20,
			muzzle_x: 6,
			ammo_capacity: -1,
			spread: 0.09,
			count: 5,
			projectile_properties: { _rail: true, _damage: 23, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false
		};		
		
		sdGun.classes[ sdGun.CLASS_RAIL_CANNON = 21 ] = { // sprite by Booraz149
			image: sdWorld.CreateImageFromFile( 'rail_cannon' ),
			sound: 'gun_railgun',
			sound_pitch: 0.5,
			title: 'Rail Cannon',
			slot: 4,
			reload_time: 20,
			muzzle_x: 7,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { _rail: true, _damage: 62, color: '#FF0000'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false
		};
		
		sdGun.classes[ sdGun.CLASS_CUBE_SHARD = 22 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cube_shard2' ),
			title: 'Cube shard',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character._upgrade_counters[ 'upgrade_energy' ] )
				if ( character._upgrade_counters[ 'upgrade_energy' ] < 60 )
				{
					character._upgrade_counters[ 'upgrade_energy' ] = Math.min( 60, character._upgrade_counters[ 'upgrade_energy' ] + 4 );
					character.matter_max = Math.round( 50 + character._upgrade_counters[ 'upgrade_energy' ] * 45 );
					if ( Math.random() > 0.5 )
					character.Say( "I can use this Cube shard to store matter inside it" );
					else
					character.Say( "Cube shard! These store matter pretty well");
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_PISTOL_MK2 = 23 ] = { // sprite by Booraz149
			image: sdWorld.CreateImageFromFile( 'pistol_mk2' ),
			sound: 'gun_pistol',
			sound_pitch: 0.7,
			title: 'Pistol MK2',
			slot: 1,
			reload_time: 15,
			muzzle_x: 7,
			ammo_capacity: 8,
			spread: 0.01,
			count: 1,
			matter_cost: 90,
			min_build_tool_level: 1,
			projectile_properties: { _damage: 35 }
		};

		sdGun.classes[ sdGun.CLASS_LMG_P04 = 24 ] = { // sprite by Ghost581
			image: sdWorld.CreateImageFromFile( 'lmg_p04' ),
			sound: 'turret',
			sound_pitch: 0.6,
			sound_volume: 2,
			title: 'LMG-P04',
			slot: 2,
			reload_time: 4,
			muzzle_x: 10,
			ammo_capacity: 50,
			spread: 0.02,
			count: 1,
			matter_cost: 90,
			min_build_tool_level: 1,
			projectile_properties: { _damage: 40, color: '#AA0000' }
		};

		sdGun.classes[ sdGun.CLASS_BUILDTOOL_UPG = 25 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'buildtool_upgrade2' ),
			image0: sdWorld.CreateImageFromFile( 'buildtool_upgrade' ),
			title: 'Build tool upgrade',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character._acquired_bt_mech === false && gun.extra === 0 ) // Has the player found this upgrade before?
				if ( !character._ai )
				{
					character.build_tool_level++;
					character._acquired_bt_mech = true;
					if ( Math.random() > 0.5 )
					character.Say( "I can use this to expand my building arsenal" );
					else
					character.Say( "This is definitely gonna help me build new stuff");
					gun.remove(); 
					
					if ( character._socket )
					sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
				}

				if ( character._acquired_bt_rift === false && gun.extra === 1 ) // Has the player found this upgrade before?
				if ( !character._ai )
				{
					character.build_tool_level++;
					character._acquired_bt_rift = true;
					if ( Math.random() > 0.5 )
					character.Say( "I can use this to expand my building arsenal" );
					else
					character.Say( "This is definitely gonna help me build new stuff");
					gun.remove(); 
					
					if ( character._socket )
					sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL1_LIGHT_ARMOR = 26 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_light' ),
			title: 'SD-01 Light Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 150,
			min_workbench_level: 1,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				// 2 was too bad for case of randomly breaking crystals when digging
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 130;
					character.armor_max = 130;
					character._armor_absorb_perc = 0.3; // 30% damage reduction
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL1_MEDIUM_ARMOR = 27 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_medium' ),
			title: 'SD-01 Duty Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 250,
			min_workbench_level: 1,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				// 2 was too bad for case of randomly breaking crystals when digging
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 190;
					character.armor_max = 190;
					character._armor_absorb_perc = 0.4; // 40% damage reduction
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL1_HEAVY_ARMOR = 28 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_heavy' ),
			title: 'SD-01 Combat Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 350,
			min_workbench_level: 1,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				// 2 was too bad for case of randomly breaking crystals when digging
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 250;
					character.armor_max = 250;
					character._armor_absorb_perc = 0.5; // 50% damage reduction
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_SHOTGUN_MK2 = 29 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shotgun_mk2' ),
			sound: 'gun_shotgun',
			title: 'Shotgun MK2',
			slot: 3,
			reload_time: 6,
			muzzle_x: 9,
			ammo_capacity: 15,
			count: 3,
			spread: 0.1,
			matter_cost: 90,
			burst: 3, // Burst fire count
			burst_reload: 30, // Burst fire reload, needed when giving burst fire
			min_build_tool_level: 2,
			projectile_properties: { _damage: 20 }
		};

		sdGun.classes[ sdGun.CLASS_LASER_DRILL = 30 ] = { // Sprite made by Silk1 / AdibAdrian
			image: sdWorld.CreateImageFromFile( 'laser_drill' ),
			sound: 'saber_attack',
			sound_pitch: 0.6,
			sound_volume: 1,
			title: 'Laser Drill',
			slot: 0,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			matter_cost: 300,
			projectile_velocity: 1 * 1.5,
			min_build_tool_level: 2,
			projectile_properties: { _rail: true, _damage: 25, color: '#ffb300', _knock_scale:0.1, _dirt_mult: 2 } // 3X ( 1 + 2 ) damage against dirt blocks
		};

		sdGun.classes[ sdGun.CLASS_SMG = 31 ] = { // Sprite made by LazyRain
			image: sdWorld.CreateImageFromFile( 'smg' ),
			sound: 'gun_pistol',
			title: 'SMG',
			slot: 1,
			reload_time: 3,
			muzzle_x: 5,
			ammo_capacity: 24,
			spread: 0.1,
			count: 1,
			burst: 3, // Burst fire count
			burst_reload: 10, // Burst fire reload, needed when giving burst fire
			min_build_tool_level: 2,
			matter_cost: 45,
			projectile_properties: { _damage: 18 }
		};

		sdGun.classes[ sdGun.CLASS_SMG_MK2 = 32 ] = { // Sprite made by LazyRain
			image: sdWorld.CreateImageFromFile( 'smg_mk2' ),
			sound: 'gun_pistol',
			title: 'SMG MK2',
			slot: 1,
			reload_time: 3,
			muzzle_x: 6,
			ammo_capacity: 30,
			spread: 0.1,
			count: 1,
			min_build_tool_level: 3,
			matter_cost: 90,
			projectile_properties: { _damage: 20 }
		};

		sdGun.classes[ sdGun.CLASS_ROCKET_MK2 = 33 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'rocket_mk2' ),
			sound: 'gun_rocket',
			title: 'Rocket launcher MK2',
			slot: 5,
			reload_time: 30,
			muzzle_x: 7,
			ammo_capacity: -1,
			spread: 0.05,
			projectile_velocity: 14,
			count: 1,
			min_build_tool_level: 3,
			matter_cost: 90,
			projectile_properties: { time_left: 60, explosion_radius: 19, model: 'rocket_proj', _damage: 19 * 3, color:sdEffect.default_explosion_color, ac:0.4, _homing: true, _homing_mult: 0.02 }
		};

		sdGun.classes[ sdGun.CLASS_HEALING_RAY = 34 ] = { // Sprite made by LazyRain
			image: sdWorld.CreateImageFromFile( 'cube_healing_ray' ),
			sound: 'cube_attack',
			title: 'Cube-Medgun',
			slot: 6,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 1 * 3.5,
			spawnable: false,
			projectile_properties: { _rail: true, _damage: -15, color: '#ff00ff',  _return_damage_to_owner:true }
		};

		sdGun.classes[ sdGun.CLASS_SHOVEL = 35 ] = { // Sprite made by Silk
			image: sdWorld.CreateImageFromFile( 'shovel' ),
			//sound: 'gun_medikit',
			title: 'Shovel',
			sound: 'sword_attack2',
			image_no_matter: sdWorld.CreateImageFromFile( 'shovel' ),
			slot: 0,
			reload_time: 9,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			projectile_velocity: 16 * 1.5,
			projectile_properties: { time_left: 1, _damage: 19, color: 'transparent', _knock_scale:0.025 * 8, _dirt_mult: 2 } // 3X ( 1 + 2 ) damage against dirt blocks
		};


		sdGun.classes[ sdGun.CLASS_SHOVEL_MK2 = 36 ] = { // Sprite made by LazyRain
			image: sdWorld.CreateImageFromFile( 'shovel_mk2' ),
			//sound: 'gun_medikit',
			title: 'Shovel MK2',
			sound: 'sword_attack2',
			sound_pitch: 1.5,
			image_no_matter: sdWorld.CreateImageFromFile( 'shovel_mk2' ),
			slot: 0,
			reload_time: 11,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			min_build_tool_level: 1,
			matter_cost: 90,
			projectile_velocity: 20 * 1.5,
			projectile_properties: { time_left: 1, _damage: 30, color: 'transparent', _dirt_mult: 2 , _knock_scale:0.025 * 8, 
				_custom_target_reaction:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5, pitch: 1.5 });
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5, pitch: 1.5 });
				}
			}
		};

		sdGun.classes[ sdGun.CLASS_DECONSTRUCTOR_HAMMER = 37 ] = { // Sprite by LazyRain
			image: sdWorld.CreateImageFromFile( 'deconstructor_hammer' ),
			//sound: 'gun_medikit',
			title: 'Deconstructor Hammer',
			sound: 'sword_attack2',
			image_no_matter: sdWorld.CreateImageFromFile( 'deconstructor_hammer' ),
			slot: 0,
			reload_time: 8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			min_workbench_level: 1,
			matter_cost: 900,
			projectile_velocity: 16 * 1.5,
			projectile_properties: { time_left: 1, _damage: 35, color: 'transparent', _knock_scale:0.025 * 8, _reinforced_level: 1 }
		};

		sdGun.classes[ sdGun.CLASS_ADMIN_REMOVER = 38 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shark' ),
			sound: 'gun_defibrillator',
			title: 'Admin tool for removing',
			sound_pitch: 2,
			slot: 4,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			projectile_properties: { _rail: true, time_left: 30, _damage: 1, color: '#ffffff', _reinforced_level:Infinity, _armor_penetration_level:Infinity, _admin_picker:true, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( bullet._owner )
					{
						if ( bullet._owner._god )
						{
							target_entity.Damage( Infinity, bullet._owner, false, false );
							target_entity.remove();
						}
						else
						if ( bullet._owner.is( sdCharacter ) )
						{
							// Remove if used by non-admin
							if ( bullet._owner._inventory[ bullet._owner.gun_slot ] )
							if ( sdGun.classes[ bullet._owner._inventory[ bullet._owner.gun_slot ].class ].projectile_properties._admin_picker )
							bullet._owner._inventory[ bullet._owner.gun_slot ].remove();
						}
					}
				}
			}
		};
		// Add new gun classes above this line //
		
		let index_to_const = [];
		for ( let s in sdGun )
		if ( s.indexOf( 'CLASS_' ) === 0 )
		{
			if ( typeof sdGun[ s ] !== 'number' )
			throw new Error( 'Check sdGunClass for a place where gun class index '+s+' is set - it has value '+sdGun[ s ]+' but should be a number in order to things work correctly' );
			if ( typeof sdGun.classes[ sdGun[ s ] ] !== 'object' )
			throw new Error( 'Check sdGunClass for a place where class '+s+' is defined. It looks like there is a non-object in sdGun.classes array at this slot' );
			if ( index_to_const[ sdGun[ s ] ] === undefined )
			index_to_const[ sdGun[ s ] ] = s;
			else
			throw new Error( 'Check sdGunClass for a place where index value is assigned - it looks like there is ID conflict for ID '+sdGun[ s ]+'. Both: '+s+' and '+index_to_const[ sdGun[ s ] ]+' point at the exact same ID. Not keeping IDs of different gun classes as unique will cause replacement of one class with another when it comes to spawning by ID.' );
		}
		for ( let i = 0; i < sdGun.classes.length; i++ )
		if ( typeof index_to_const[ i ] === 'undefined' )
		throw new Error( 'Check sdGunClass for a place where index values are assigned - there seems to be an ID number '+i+' skipped (assuming sdGun.classes.length is '+sdGun.classes.length+' and thus highest ID should be '+(sdGun.classes.length-1)+', with IDs starting at 0). Holes in ID list will cause server to crash when some parts of logic will try to loop through all classes. Currently defined IDs are following: ', index_to_const );
	}
}

export default sdGunClass;