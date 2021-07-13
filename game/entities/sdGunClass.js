
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdBlock from './sdBlock.js';
import sdGun from './sdGun.js';
import sdLost from './sdLost.js';
import sdCable from './sdCable.js';
import sdEntity from './sdEntity.js';
import sdNode from './sdNode.js';

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
			muzzle_x: 9,
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
		
		sdGun.classes[ sdGun.CLASS_NEEDLE = 10 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'needle' ),
			sound: 'gun_needle',
			sound_volume: 0.4,
			title: 'Needle',
			slot: 4,
			reload_time: 12,
			muzzle_x: null, // It is supposed to be supressed
			ammo_capacity: 10,
			count: 1,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			matter_cost: 60,
			projectile_properties: { _damage: 48, /*_knock_scale:0.01 * 8, */penetrating:true }
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
			GetAmmoCost: ()=>
			{
				return 100;
			},
			projectile_properties: { time_left: 2, _damage: 40, color: 'transparent', _return_damage_to_owner:true, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( target_entity.is( sdCharacter ) )
					{
						target_entity.AnnounceTooManyEffectsIfNeeded();
						target_entity.stim_ef = 30 * 30;
						
						//if ( bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_STIMPACK ].slot ] )
						//bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_STIMPACK ].slot ].remove();
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
			min_build_tool_level: 1, // Was available from start before, however MK2 shovel needs this aswell
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
			reload_time: 3.2,
			muzzle_x: 10,
			ammo_capacity: 50,
			spread: 0.02,
			count: 1,
			matter_cost: 90,
			min_build_tool_level: 1,
			projectile_properties: { _damage: 36, color: '#AA0000' }
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
				if ( !character._ai )
				{
					if ( gun.extra === -123 )
					{
						character.Say( "Score" );
						character._score += 100000;
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					
					if ( character._acquired_bt_mech === false && gun.extra === 0 ) // Has the player found this upgrade before?
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
					character.armor_speed_reduction = 0; // Armor speed reduction, 0% for light armor
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
					character.armor_speed_reduction = 10; // Armor speed reduction, 10% for medium armor
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
					character.armor_speed_reduction = 20; // Armor speed reduction, 20% for heavy armor
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
			min_workbench_level: 2,
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
			projectile_properties: { _rail: true, _damage: -15, color: '#ff00ff',  _return_damage_to_owner:true },
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.is( sdCharacter ) )
				if ( gun._held_by.hea < gun._held_by.hmax )
				{
					gun._held_by.Damage( -15, null ); // Heal self if HP isn't max. However this healing is unaffected by damage mult and power pack
				}
				return true;
			}
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
			min_build_tool_level: 2,
			matter_cost: 1000,
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

		sdGun.classes[ sdGun.CLASS_LOST_CONVERTER = 39 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cube_bng' ),
			image_charging: sdWorld.CreateImageFromFile( 'cube_bng_charging' ),
			//sound: 'supercharge_combined2',
			title: 'Cube overcharge cannon',
			//sound_pitch: 0.5,
			slot: 5,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 100;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						
						gun._held_by._auto_shoot_in = 2200 / 1000 * 30;

						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'supercharge_combined2_part2', x:gun.x, y:gun.y, volume: 1.5 });
					
					if ( gun._held_by.matter >= 100 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 15;
						gun._held_by.matter -= 100;
					}
				}
				return true;
			},
			projectile_properties: { 
				//explosion_radius: 10, 
				model: 'ball_charged', _damage: 0, /*color:'#ffff66',*/ time_left: 30, _custom_detonation_logic:( bullet )=>
				{
					if ( bullet._owner )
					{
						sdWorld.SendEffect({ 
							x:bullet.x, 
							y:bullet.y, 
							radius:30,
							damage_scale: 0, // Just a decoration effect
							type:sdEffect.TYPE_EXPLOSION, 
							owner:this,
							color:'#ffff66' 
						});

						let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 32 );

						for ( let i = 0; i < nears.length; i++ )
						{
							sdLost.ApplyAffection( nears[ i ], 300, bullet );
						}
					}
				}
			}
		};
		
		const cable_reaction_method = ( bullet, target_entity )=>
		{
			if ( sdCable.attacheable_entities.indexOf( target_entity.GetClass() ) !== -1 )
			{
				if ( sdCable.one_cable_entities.indexOf( target_entity.GetClass() ) !== -1 && sdCable.GetConnectedEntities( target_entity, sdCable.TYPE_ANY ).length > 0 )
				{
					//bullet._owner.Say( ( target_entity.title || target_entity.GetClass() ) + ' has only one socket' );
					bullet._owner.Say( 'There is only one socket' );
				}
				else
				{
					if ( bullet._owner._current_built_entity && !bullet._owner._current_built_entity._is_being_removed )
					{
						if ( sdCable.one_cable_entities.indexOf( bullet._owner._current_built_entity.p.GetClass() ) !== -1 && sdCable.one_cable_entities.indexOf( target_entity.GetClass() ) !== -1 )
						{
							bullet._owner.Say( 'It seems pointless to connect devices when both have just one socket' );
						}
						else
						if ( sdCable.GetConnectedEntities( target_entity ).indexOf( bullet._owner._current_built_entity.p ) !== -1 )
						{
							bullet._owner.Say( ( bullet._owner._current_built_entity.p.title || bullet._owner._current_built_entity.p.GetClass() ) + ' and ' + 
									( target_entity.title || target_entity.GetClass() ) + ' are already connected' );
						}
						else
						if ( target_entity === bullet._owner._current_built_entity.p )
						{
							//bullet._owner.Say( 'Connecting cable end to same ' + ( target_entity.title || target_entity.GetClass() ) + ' does not make sense' );
							bullet._owner.Say( 'Connecting cable to same thing does not make sense' );
						}
						else
						{
							//bullet._owner._current_built_entity.SetChild( target_entity );
							bullet._owner._current_built_entity.c = target_entity;
							if ( target_entity.is( sdNode ) )
							{
								bullet._owner._current_built_entity.d[ 2 ] = 0;
								bullet._owner._current_built_entity.d[ 3 ] = 0;
							}
							else
							{
								bullet._owner._current_built_entity.d[ 2 ] = bullet.x - target_entity.x;
								bullet._owner._current_built_entity.d[ 3 ] = bullet.y - target_entity.y;
							}

							//bullet._owner.Say( 'End connected to ' + ( target_entity.title || target_entity.GetClass() ) );

							bullet._owner._current_built_entity._update_version++;

							bullet._owner._current_built_entity = null;
						}
					}
					else
					{
						let ent = new sdCable({ 
							x: bullet.x, 
							y: bullet.y, 
							parent: target_entity,
							child: bullet._owner,
							offsets: target_entity.is( sdNode ) ? [ 0,0, 0,0 ] : [ bullet.x - target_entity.x, bullet.y - target_entity.y, 0,0 ],
							type: sdCable.TYPE_MATTER
						});

						bullet._owner._current_built_entity = ent;
						//bullet._owner.Say( 'Start connected to ' + ( target_entity.title || target_entity.GetClass() ) );

						sdEntity.entities.push( ent );
					}
				}
			}
			else
			{
				bullet._owner.Say( 'Cable can not be attached there' );
				//bullet._owner.Say( 'Cable can not be attached to ' + ( target_entity.title || target_entity.GetClass() ) );
			}
		};
		sdGun.classes[ sdGun.CLASS_CABLE_TOOL = 40 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cable_tool' ),
			sound: 'gun_defibrillator',
			title: 'Cable tool',
			sound_pitch: 0.25,
			slot: 7,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 300,
			projectile_velocity: 16,
			projectile_properties: { time_left: 2, _damage: 1, color: 'transparent', 
				_custom_target_reaction_protected: cable_reaction_method,
				_custom_target_reaction: cable_reaction_method
			}
		};
		
		
		sdGun.classes[ sdGun.CLASS_POWER_PACK = 41 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'powerpack' ),
			sound: 'gun_defibrillator',
			title: 'Power pack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 300 / 2 * 2.5, // More DPS relative to stimpack
			projectile_velocity: 16,
			GetAmmoCost: ()=>
			{
				return 100 / 2 * 2.5;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.is( sdCharacter ) )
				{
					gun._held_by.AnnounceTooManyEffectsIfNeeded();
					gun._held_by.power_ef = 30 * 30;
					//gun._held_by.Damage( 40 );
					
					//if ( gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_PACK ].slot ] )
					//gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_PACK ].slot ].remove();
				}
				return true;
			},
			projectile_properties: {}
		};
		
		sdGun.classes[ sdGun.CLASS_TIME_PACK = 42 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'timepack' ),
			sound: 'gun_defibrillator',
			title: 'Time pack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 500, // More DPS relative to stimpack
			projectile_velocity: 16,
			GetAmmoCost: ()=>
			{
				return 750;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.is( sdCharacter ) )
				{
					gun._held_by.AnnounceTooManyEffectsIfNeeded();
					gun._held_by.time_ef = 30 * 30;
					//gun._held_by.Damage( 40 );
					
					//if ( gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_TIME_PACK ].slot ] )
					//gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_TIME_PACK ].slot ].remove();
				}
				return true;
			},
			projectile_properties: {}
		};
		
		sdGun.classes[ sdGun.CLASS_LVL2_LIGHT_ARMOR = 43 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_light_lvl2' ),
			title: 'SD-02 Light Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 275,
			min_workbench_level: 2,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 190;
					character.armor_max = 190;
					character._armor_absorb_perc = 0.3; // 30% damage reduction
					character.armor_speed_reduction = 0; // Armor speed reduction, 0% for light armor
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL2_MEDIUM_ARMOR = 44 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_medium_lvl2' ),
			title: 'SD-02 Duty Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 375,
			min_workbench_level: 2,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 280;
					character.armor_max = 280;
					character._armor_absorb_perc = 0.4; // 40% damage reduction
					character.armor_speed_reduction = 10; // Armor speed reduction, 10% for medium armor
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL2_HEAVY_ARMOR = 45 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_heavy_lvl2' ),
			title: 'SD-02 Combat Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 475,
			min_workbench_level: 2,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 370;
					character.armor_max = 370;
					character._armor_absorb_perc = 0.5; // 50% damage reduction
					character.armor_speed_reduction = 20; // Armor speed reduction, 20% for heavy armor
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_F_MARKSMAN = 46 ] =  // sprite made by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'f_marksman' ),
			sound: 'gun_f_rifle',
			sound_pitch: 2.4,
			title: 'Falkok Marksman Rifle',
			slot: 2,
			reload_time: 25,
			muzzle_x: 10,
			ammo_capacity: 12,
			count: 1,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.6,
			projectile_properties: { _damage: 68, color: '#92D0EC'}
		};
		
		sdGun.classes[ sdGun.CLASS_MMG_THE_RIPPER_T2 = 47 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'mmg_the_ripper_t2' ),
			sound: 'gun_the_ripper2',
			//sound_pitch: 0.7,
			sound_pitch: 1.6,
			//sound_volume: 1.75,
			title: 'The Ripper',
			slot: 2,
			reload_time: 4.4,
			muzzle_x: 10,
			ammo_capacity: 50,
			spread: 0.03,
			count: 1,
			matter_cost: 140,
			min_build_tool_level: 3,
			projectile_properties: { _damage: 42, color: '#FFEB00' }
		};

		sdGun.classes[ sdGun.CLASS_MMG_THE_RIPPER_T3 = 48 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'mmg_the_ripper_t3' ),
			sound: 'gun_the_ripper2',
			//sound_pitch: 1.6,
			sound_pitch: 0.7,
			//sound_volume: 1.65,
			title: 'The Ripper MK2',
			slot: 2,
			reload_time: 4.8,
			muzzle_x: 10,
			ammo_capacity: 55,
			spread: 0.02,
			count: 1,
			matter_cost: 190,
			min_build_tool_level: 5,
			projectile_properties: { _damage: 48, color: '#FFEB00' }
		};

		sdGun.classes[ sdGun.CLASS_RAILGUN_P03 = 49 ] = // sprite by Ghost581
        {
            image: sdWorld.CreateImageFromFile( 'railgun_p03' ),
           	// image0: [ sdWorld.CreateImageFromFile( 'railgun_p03_c' ), sdWorld.CreateImageFromFile( 'railgun_p03_c' ) ],
            //image1: [ sdWorld.CreateImageFromFile( 'railgun_p03_r1' ), sdWorld.CreateImageFromFile( 'railgun_p03_r1b' ) ],
            //image2: [ sdWorld.CreateImageFromFile( 'railgun_p03_r2' ), sdWorld.CreateImageFromFile( 'railgun_p03_r2b' ) ],
            image0: [ sdWorld.CreateImageFromFile( 'railgun_p03_reload1' ), sdWorld.CreateImageFromFile( 'railgun_p03_reload2' ) ],
            image1: [ sdWorld.CreateImageFromFile( 'railgun_p03_reload1' ), sdWorld.CreateImageFromFile( 'railgun_p03_reload2' ) ],
            image2: [ sdWorld.CreateImageFromFile( 'railgun_p03_reload1' ), sdWorld.CreateImageFromFile( 'railgun_p03_reload2' ) ],
            sound: 'gun_railgun_malicestorm_terrorphaser4',
            title: 'Railgun P03',
			sound_pitch: 1.6, // re-added cause weapon sounds better with the sound pitch. - Ghost581
			sound_volume: 1.5,
            slot: 8, // moved it to slot 8 cause of it being supposed to be a power weapon and slot 9 still is bound to the BT - Ghost581
            reload_time: 360, // can one-shot 250 HP players so it has been bumped back up to its original reload time. - Ghost581
            muzzle_x: null,
            ammo_capacity: -1,
            count: 1,
            matter_cost: 280,
            projectile_properties: { _rail: true, _damage: 90, color: '#62c8f2', explosion_radius: 20}, // buffed damage by player request - Ghost581
            min_build_tool_level: 3
		};

		sdGun.classes[ sdGun.CLASS_ADMIN_TELEPORTER = 50 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shark' ),
			sound: 'gun_defibrillator',
			title: 'Admin tool for teleporting',
			sound_pitch: 2,
			slot: 8,
			reload_time: 10,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( sdWorld.is_server )
				if ( gun._held_by )
				if ( gun._held_by.is( sdCharacter ) )
				if ( gun._held_by._god )
				{
					gun._held_by.x = gun._held_by.look_x;
					gun._held_by.y = gun._held_by.look_y;
					gun._held_by.sx = 0;
					gun._held_by.sy = 0;
					gun._held_by.ApplyServerSidePositionAndVelocity( true, 0, 0 );
				}
				return true;
			},
			projectile_properties: { _rail: true, time_left: 0, _damage: 1, color: '#ffffff', _admin_picker:true }
		};

		sdGun.classes[ sdGun.CLASS_POWER_STIMPACK = 51 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'power_stimpack' ),
			sound: 'gun_defibrillator',
			title: 'Power-Stimpack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 10,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 900,
			min_workbench_level: 5,
			projectile_velocity: 16,
			GetAmmoCost: ()=>
			{
				return ( 100 / 2 * 2.5 + 100 ) * 2;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.is( sdCharacter ) )
				{
					gun._held_by.AnnounceTooManyEffectsIfNeeded();
					gun._held_by.stim_ef = 30 * 30;
					gun._held_by.power_ef = 30 * 30;
					gun._held_by.Damage( 40, null, false, false ); // Don't damage armor
					
					/*if ( gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_PACK ].slot ] )
					gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_PACK ].slot ].remove();*/
				}
				return true;
			},
			projectile_properties: {}
		};

		sdGun.classes[ sdGun.CLASS_LVL1_ARMOR_REGEN = 52 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_repair_module_lvl1' ),
			title: 'SD-11 Armor Repair Module',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 250,
			min_workbench_level: 3,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.armor > 0 )
				{
					character._armor_repair_amount = 250;
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL2_ARMOR_REGEN = 53 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_repair_module_lvl2' ),
			title: 'SD-12 Armor Repair Module',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 500,
			min_workbench_level: 4,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.armor > 0 )
				{
					character._armor_repair_amount = 500;
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_ARMOR_REGEN = 54 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_repair_module_lvl3' ),
			title: 'SD-13 Armor Repair Module',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 750,
			min_workbench_level: 7,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.armor > 0 )
				{
					character._armor_repair_amount = 750;
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_LIGHT_ARMOR = 55 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_light_lvl3' ),
			title: 'SD-03 Light Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 400,
			min_workbench_level: 6,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 300;
					character.armor_max = 300;
					character._armor_absorb_perc = 0.3; // 30% damage reduction
					character.armor_speed_reduction = 0; // Armor speed reduction, 0% for light armor
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_MEDIUM_ARMOR = 56 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_medium_lvl3' ),
			title: 'SD-03 Duty Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 500,
			min_workbench_level: 6,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 400;
					character.armor_max = 400;
					character._armor_absorb_perc = 0.4; // 40% damage reduction
					character.armor_speed_reduction = 10; // Armor speed reduction, 10% for medium armor
					gun.remove(); 
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_HEAVY_ARMOR = 57 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_heavy_lvl3' ),
			title: 'SD-03 Combat Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 600,
			min_workbench_level: 6,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				//if ( character.armor === 0 || character._armor_absorb_perc <= character._armor_absorb_perc )
				{
					character.armor = 500;
					character.armor_max = 500;
					character._armor_absorb_perc = 0.5; // 50% damage reduction
					character.armor_speed_reduction = 20; // Armor speed reduction, 20% for heavy armor
					gun.remove(); 
				}

				return false; 
			} 
		};
		
		sdGun.classes[ sdGun.CLASS_EMERGENCY_INSTRUCTOR = 58 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'emergency_instructor' ),
			sound: 'gun_defibrillator',
			title: 'Emergency instructor',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 300, // More DPS relative to stimpack
			projectile_velocity: 16,
			spawnable: false,
			GetAmmoCost: ()=>
			{
				return 300;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				let owner = gun._held_by;
				
				setTimeout(()=> // Out of loop spawn
				{
					if ( sdWorld.is_server )
					if ( owner )
					//if ( owner.is( sdCharacter ) )
					{
						let instructor_settings = {"hero_name":"Instructor","color_bright":"#7aadff","color_dark":"#25668e","color_bright3":"#7aadff","color_dark3":"#25668e","color_visor":"#ffffff","color_suit":"#000000","color_shoes":"#303954","color_skin":"#51709a","voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"color_suit2":"#000000","color_dark2":"#25668e"};

						let ent = new sdCharacter({ x: owner.x + 16 * owner._side, y: owner.y,
							_ai_enabled: sdCharacter.AI_MODEL_TEAMMATE, 
							_ai_gun_slot: 4,
							_ai_level: 10,
							_ai_team: owner.cc_id + 4141,
							sd_filter: sdWorld.ConvertPlayerDescriptionToSDFilter_v2( instructor_settings ), 
							_voice: sdWorld.ConvertPlayerDescriptionToVoice( instructor_settings ), 
							title: instructor_settings.hero_name,
							cc_id: owner.cc_id,
							_owner: owner
						});
						ent.gun_slot = 4;
						ent._matter_regeneration = 5;
						ent._damage_mult = 1 + 3 / 3 * 1;
						sdEntity.entities.push( ent );

						let ent2 = new sdGun({ x: ent.x, y: ent.y,
							class: sdGun.CLASS_RAILGUN
						});
						sdEntity.entities.push( ent2 );

						sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });
						
						let side_set = false;
						const logic = ()=>
						{
							if ( ent._ai )
							{
								if ( !side_set )
								{
									ent._ai.direction = owner._side;
									side_set = false;
								}
								if ( ent.x > owner.x + 200 )
								ent._ai.direction = -1;
							
								if ( ent.x < owner.x - 200 )
								ent._ai.direction = 1;
							}
						};
						
						const MasterDamaged = ( victim, dmg, enemy )=>
						{
							if ( enemy && enemy.IsTargetable( ent ) )
							if ( dmg > 0 )
							if ( ent._ai )
							{
								if ( !ent._ai.target || Math.random() > 0.5 )
								ent._ai.target = enemy;
							}
						};
						
						owner.addEventListener( 'DAMAGE', MasterDamaged );
						
						setInterval( logic, 1000 );
						
						setTimeout(()=>
						{
							if ( ent.hea > 0 )
							if ( !ent._is_being_removed )
							{
								ent.Say( [ 
									'Was nice seeing you', 
									'I can\'t stay any longer', 
									'Thanks for the invite, ' + owner.title, 
									'Glad I didn\'t die here lol',
									'Until next time',
									'You can call be later',
									'My time is almost out',
									( ent._inventory[ 4 ] === ent2 ) ? 'You can take my railgun' : 'I\'ll miss my railgun',
									'Time for me to go'
								][ ~~( Math.random() * 9 ) ], false, false, false );
							}
						}, 60000 - 4000 );
						setTimeout(()=>
						{
							clearInterval( logic );
							
							owner.removeEventListener( 'DAMAGE', MasterDamaged );
							
							if ( !ent._is_being_removed )
							sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });

							ent.DropWeapons();
							ent.remove();
							//ent2.remove();

							ent._broken = false;
							//ent2._broken = false;

						}, 60000 );
					}
				}, 1 );
				
				return true;
			},
			projectile_properties: {}
		};
		
		sdGun.classes[ sdGun.CLASS_POPCORN = 59 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'popcorn' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'popcorn_disabled' ),
			title: 'Popcorn',
			slot: 7,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 10,
			projectile_velocity: 16,
			spawnable: true,
			category: 'Other',
			is_sword: true,
			GetAmmoCost: ()=>
			{
				return 0;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				sdSound.PlaySound({ name:'popcorn', x:gun.x, y:gun.y, volume:0.3 + Math.random() * 0.2, pitch:1 + Math.sin( gun._net_id ) * 0.2 });
				
				return true;
			},
			onThrownSwordReaction: ( gun, hit_entity, hit_entity_is_protected )=>
			{
				sdSound.PlaySound({ name:'block4', x:gun.x, y:gun.y, volume: 0.05, pitch:1 });
			
				for ( let i = 0; i < 6; i++ )
				{
					let a = Math.random() * 2 * Math.PI;
					let s = Math.random() * 4;

					let k = Math.random();

					let x = gun.x;
					let y = gun.y;

					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_POPCORN, sx: gun.sx*k + Math.sin(a)*s, sy: gun.sy*k + Math.cos(a)*s });
				}
			},
			projectile_properties: { _damage: 0 }
		};

		sdGun.classes[ sdGun.CLASS_ERTHAL_BURST_RIFLE = 60 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'erthal_burst_rifle' ),
			image0: [ sdWorld.CreateImageFromFile( 'erthal_burst_rifle0' ), sdWorld.CreateImageFromFile( 'erthal_burst_rifle0b' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'erthal_burst_rifle1' ), sdWorld.CreateImageFromFile( 'erthal_burst_rifle1b' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'erthal_burst_rifle2' ), sdWorld.CreateImageFromFile( 'erthal_burst_rifle2b' ) ],
			sound: 'spider_attackC',
			sound_pitch: 6,
			title: 'Erthal Burst Rifle',
			slot: 2,
			reload_time: 2,
			muzzle_x: 8,
			ammo_capacity: 36,
			count: 1,
			spread: 0.01,
			spawnable: false,
			burst: 6, // Burst fire count
			burst_reload: 24, // Burst fire reload, needed when giving burst fire
			projectile_velocity: 18,
			projectile_properties: { _damage: 38,  color: '#00aaff' }
		};

		sdGun.classes[ sdGun.CLASS_ERTHAL_PLASMA_PISTOL = 61 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'erthal_plasma_pistol' ),
			sound: 'gun_spark',
			sound_pitch: 2,
			title: 'Erthal Plasma Pistol',
			slot: 1,
			reload_time: 9,
			muzzle_x: 9,
			ammo_capacity: 8,
			count: 1,
			spawnable:false,
			projectile_velocity: 16,
			projectile_properties: { explosion_radius: 7, model: 'ball', _damage: 12, color:'#00aaff' }
		};
		
		sdGun.classes[ sdGun.CLASS_FMECH_MINIGUN = 62 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'fmech_lmg' ),
			image_charging: sdWorld.CreateImageFromFile( 'fmech_lmg' ),
			//sound: 'supercharge_combined2',
			title: 'Flying Mech Minigun',
			//sound_pitch: 0.5,
			slot: 2,
			reload_time: 0,
			muzzle_x: 10,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 16,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 4;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						
						gun._held_by._auto_shoot_in = 800 / 1000 * 30;

						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 2 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					
					if ( gun._held_by.matter >= 4 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( gun._held_by.stim_ef > 0 ) ? 1 : 2;
						gun._held_by.matter -= 4;
					}
				}
				return true;
			},
			projectile_properties: { _damage: 30 } // Combined with fire rate
		};

		sdGun.classes[ sdGun.CLASS_SNIPER = 63 ] = 
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
			matter_cost: 120,
			min_build_tool_level: 1,
			projectile_properties: { _damage: 105, /*_knock_scale:0.01 * 8, */penetrating:true }
		};
    
		sdGun.classes[ sdGun.CLASS_DMR = 64 ] =  // sprite made by The Commander
		{
			image: sdWorld.CreateImageFromFile( 'dmr' ),
			sound: 'gun_dmr',
			sound_volume: 2.4,
			sound_pitch: 1.3,
			title: 'DMR',
			slot: 4,
			reload_time: 28,
			muzzle_x: 10,
			ammo_capacity: 8,
			count: 1,
			matter_cost: 160,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			projectile_properties: { _damage: 64, color: '#33ffff', penetrating: true }
		};
    
		sdGun.classes[ sdGun.CLASS_BURST_PISTOL = 65 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'burst_pistol' ),
			image0: [ sdWorld.CreateImageFromFile( 'burst_pistol_reload' ), sdWorld.CreateImageFromFile( 'burst_pistol' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'burst_pistol_reload' ), sdWorld.CreateImageFromFile( 'burst_pistol' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'burst_pistol_reload' ), sdWorld.CreateImageFromFile( 'burst_pistol' ) ],
			sound: 'gun_f_rifle',
			sound_pitch: 1.5,
			title: 'Burst Pistol',
			slot: 1,
			reload_time: 2,
			muzzle_x: 5,
			ammo_capacity: 9,
			count: 1,
			spread: 0.01,
			matter_cost: 120,
			burst: 3,
			burst_reload: 35,
			projectile_velocity: 30,
			min_build_tool_level: 3,
			projectile_properties: { _damage: 25, color:'#00aaff' }
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
