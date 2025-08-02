
/* global sdMusic */

import sdWorld from './sdWorld.js';
import sdEntity from './entities/sdEntity.js';
import sdWeather from './entities/sdWeather.js';
import sdWater from './entities/sdWater.js';
import sdCharacterRagdoll from './entities/sdCharacterRagdoll.js';
import sdEffect from './entities/sdEffect.js';
import sdCrystal from './entities/sdCrystal.js';
import sdSteeringWheel from './entities/sdSteeringWheel.js';

/*

	Test sound console command:

		sdSound.PlaySound({ name:'player_step', x:sdWorld.camera.x, y:sdWorld.camera.y, volume:1, _server_allowed:true });

*/

class sdSound
{
	static init_class()
	{
		sdSound.entity_to_channels_list = new Map();
		
		if ( !sdWorld.is_server )
		{
			sdSound.volume_scale_inactive_window = 0.1;

			sdSound.volume = 0.1; // non-relative
			sdSound.volume_speech = 0.1; // non-relative // amplitude below 1 (out of 100) is silence in mespeak
			sdSound.volume_ambient = 0.075; // non-relative
			sdSound.volume_music = 0.1;

			sdSound.SetVolumeScale = ( v )=>{

				sdSound.volume = v * 1; // non-relative
				sdSound.volume_speech = v * 1; // non-relative // amplitude below 1 (out of 100) is silence in mespeak
				sdSound.volume_ambient = v * 0.75; // non-relative
				sdSound.volume_music = v * 0.3; // non-relative
			};

			//sdSound.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

			sdSound.sounds = {};

			sdSound.sounds_played_at_frame = 0; // Prevent massive flood

			/*sdSound.matter_charge_loop = new Audio( './audio/matter_charge_loop2.wav' );
			sdSound.matter_charge_loop.volume = 0;
			sdSound.matter_charge_loop.loop = true;
			sdSound.matter_charge_loop.preservesPitch = false;*/

			const MakeLoopAmbient = ( var_name, source )=>
			{
				sdSound[ var_name + '_volume_last' ] = 0;
				sdSound[ var_name + '_howl' ] = new Howl({ src: [ source ], loop: true, autoplay: true, volume: 0 });
				sdSound[ var_name + '_sound_id' ] = sdSound[ var_name + '_howl' ].play();

				sdSound[ var_name ] = {};


				Object.defineProperty( sdSound[ var_name ], 'volume', 
				{ 
					set: function ( x ) 
					{
						if ( document.hidden )
						x *= sdSound.volume_scale_inactive_window;
					
						sdSound[ var_name + '_howl' ].volume( x, sdSound[ var_name + '_sound_id' ] );
					},
					get: function()
					{
						debugger; // Won't work
						return 0;
					}
				});
				
				let last_pitch = 1;
				Object.defineProperty( sdSound[ var_name ], 'pitch', 
				{ 
					set: function ( x ) 
					{ 
						if ( last_pitch !== x )
						{
							last_pitch = x;

							sdSound[ var_name + '_howl' ].rate( x, sdSound[ var_name + '_sound_id' ] );
						}
					},
					get: function()
					{
						debugger; // Won't work
						return last_pitch;
					}
				});
			};

			//MakeLoopAmbient( 'matter_charge_loop', './audio/matter_charge_loop2.wav' );
			MakeLoopAmbient( 'matter_charge_loop', './audio/matter_charge_loopB.wav' );
			MakeLoopAmbient( 'matter_charge_loop_inverse', './audio/matter_charge_loopB_inverse.wav' );
			MakeLoopAmbient( 'ambient1', './audio/ambient1_looped3.wav' );
			MakeLoopAmbient( 'ambient3', './audio/ambient3.wav' );
			MakeLoopAmbient( 'ambient4_short', './audio/ambient4_short.wav' );
			MakeLoopAmbient( 'scary_monster_spawned3', './audio/scary_monster_spawned3.wav' );
			MakeLoopAmbient( 'scary_monster_spawned2', './audio/scary_monster_spawned2.wav' );
			MakeLoopAmbient( 'scary_monsters_in_the_dark', './audio/scary_monsters_in_the_dark.wav' );
			//MakeLoopAmbient( 'rain_low_res', './audio/rain_low_res.wav' );
			MakeLoopAmbient( 'rain_low_res', './audio/rain_clean.wav' );
			MakeLoopAmbient( 'earthquake', './audio/earthquake.wav' );
			//MakeLoopAmbient( 'jetpack', './audio/jetpack.wav' );
			MakeLoopAmbient( 'jetpack', './audio/jetpack_hd2.wav' );
			MakeLoopAmbient( 'hover_loop', './audio/hover_loop.wav' );
			MakeLoopAmbient( 'amplifier_loop', './audio/amplifier_loop2.wav' );
			MakeLoopAmbient( 'lava_loop', './audio/lava_loop4.wav' );
			MakeLoopAmbient( 'lava_burn', './audio/lava_burn2.wav' );
			MakeLoopAmbient( 'rift_loop', './audio/rift_loop.wav' );
			MakeLoopAmbient( 'anti_crystal_ambient', './audio/anti_crystal_ambient.wav' );
			MakeLoopAmbient( 'water_loop', './audio/water.wav' );
			MakeLoopAmbient( 'antigravity', './audio/antigravity.wav' );
			MakeLoopAmbient( 'fire_big', './audio/fire_big.wav' );
			MakeLoopAmbient( 'fire_small', './audio/fire_small.wav' );
			MakeLoopAmbient( 'motor_loop', './audio/motor_loop.wav' );


			sdSound.ambient_seeker = { x:Math.random()*2-1, y:Math.random()*2-1, tx:Math.random()*2-1, ty:Math.random()*2-1 };
			/*
				Ambient 2D map:

				3 2 6
				1 - 4
				- - 5
			*/
			sdSound.ambients = [
				{ x: -1, y: 0, audio: sdSound.ambient1 },
				{ x: 0, y: -1, audio: sdSound.ambient3 },
				{ x: -1, y: -1, audio: sdSound.ambient4_short }, // Short ones in corners so they are more rare
				{ x: 1, y: 0, audio: sdSound.scary_monsters_in_the_dark },
				{ x: 1, y: 1, audio: sdSound.scary_monster_spawned3 }, // Short ones in corners so they are more rare,
				{ x: 1, y: -1, audio: sdSound.scary_monster_spawned2 } // Short ones in corners so they are more rare
			];

			sdSound.allowed = false; // Gesture await

			sdSound.server_mute = false; // Becomes true during silent removals

			//sdSound.matter_charge_sum = 0;
			//sdSound.matter_decrease_strength = 0;
			sdSound.matter_target_volume_soft = 0;
			
			{
				sdSound.quit_sounds_str = 
`abomination_alert
abomination_attack
abomination_death
adoor_start
adoor_stop
alien_charge2
alien_energy_charge1
alien_energy_charge2
alien_energy_power_charge1
alien_energy_power_charge1_fast
alien_energy_power_charge2
alien_energy_power_charge2_fast
alien_energy_power_charge2_fast2
alien_laser1
alien_laser2
antigravity
anti_crystal_ambient
armor_break
armor_pickup
asteroid
bad_dog_alert
bad_dog_attack
bad_dog_death
bad_dog_hurt
bad_dog_retreat
block4
blockB4
bsu_attack
can_drink
command_centre
council_beacon_destruction
council_death
council_hurtA
council_hurtB
council_teleport
crystal
crystal2
crystal2_short
crystal_combiner_end
crystal_combiner_endB
crystal_combiner_start
crystal_combiner_startB
crystal_crab_death
cube_alert2
cube_attack
cube_attackB
cube_boss_ping
cube_death
cube_hurt
cube_offline
cube_shard
cube_teleport
cut_droid_alert
cut_droid_attack
cut_droid_death
digA
digB
digC
digD
door_start
door_stop
drone_death
drone_explosion
earthquake
enemy_mech_alert
enemy_mech_attack4
enemy_mech_charge
enemy_mech_death3
enemy_mech_hurt
enemy_mech_warning
epic_machine_startup
erthal_alert
erthal_death
erthal_hurt
evil_alien_charge1
evil_alien_charge1_fast1
explosion
explosion3
falkok_drone_fire
fire_big
fire_detected
fire_gone
fire_small
f_death1
f_death2
f_death3
f_pain2
f_pain3
f_pain4
f_welcome1
ghost_breath
ghost_start
ghost_stop
glass10
glass12
gravity_gun
guanako_confused
guanako_death
guanako_disagreeing
guanako_hurt
gun_anti_rifle_fire
gun_anti_rifle_hit
gun_buildtool
gun_buildtool2
gun_defibrillator
gun_dmr
gun_f_rifle
gun_grenade_launcher
gun_missile_launcher_p07
gun_needle
gun_pistol
gun_portal4
gun_psicutter
gun_psicutter_bounce
gun_railgun
gun_railgun_malicestorm_terrorphaser
gun_railgun_malicestorm_terrorphaser4
gun_raygun
gun_rayrifle
gun_rifle
gun_rocket
gun_saw
gun_shotgun
gun_shotgun_mk2
gun_sniper
gun_spark
gun_the_ripper
gun_the_ripper2
hover_explosion
hover_lowhp
hover_start
kick_blaster
level_up
menu_bypass
menu_click
menu_hover
missile_incoming
mission_complete
mission_failed
notificator_alert
notificator_alertB
notificator_alertC
notificator_alertD
notificator_alertE
octopus_alert
octopus_death
octopus_hurt2
overlord_cannon3
overlord_cannon4
overlord_chatter1
overlord_chatter2
overlord_chatter3
overlord_chatter4
overlord_chatter5
overlord_deathB
overlord_deathC
overlord_hurtB2
overlord_hurtC
overlord_nearby
overlord_nearbyB
overlord_spawned
overlord_welcomeB
piano_world_startB
piano_world_startB2_cutA
player_hit
player_hit3
player_step
player_step_robot
pop
popcorn
portal_through
powerup_or_exp_pickup
quickie_alert
red_railgun
reload
reload3
rescue_teleport_fake_death2
rift_feed3
rift_spawn1
saber_attack
saber_hit2
scary_monsters_in_the_dark
scary_monster_spawned2
scary_monster_spawned3
sci_fi_world_start
score_impact
sd_beacon
sd_beacon_disarm
sd_death
sd_death2
sd_hurt1
sd_hurt2
sd_welcome
sd_welcome2
shield
shield_turret
shield_turret_door
shotgun_blaster
shurg_turret_attack
slug_jump
spider_attackC
spider_celebrateC
spider_deathC3
spider_hurtC
spider_welcomeC
supercharge_combined2
supercharge_combined2_part1
supercharge_combined2_part2
sword_attack
sword_attack2
sword_bot_alert
sword_bot_death
teleport
teleport_ready
tentacle_end
tentacle_start
turret
tzyrg_alertC
tzyrg_death
tzyrg_deathC2
tzyrg_fire
tzyrg_hurt
tzyrg_hurtC
virus_alert
virus_damage2
water
water_entrance
world_hit
world_hit2
zektaron_crash
zektaron_death
zombie_alert2
zombie_hurt
zombie_idle`;
			}
		}
	}
	static AllowSound()
	{
		if ( !sdSound.allowed )
		{
			sdSound.allowed = true;
			
			if ( typeof adConfig !== 'undefined' )
			adConfig({
				sound: 'on'
			});
			
			sdMusic.init_classB();
		}
	}
	static HandleMatterChargeLoop( GSPEED )
	{
		let volume_ambient = ( sdRenderer.canvas.style.display === 'block' ) ? sdSound.volume_ambient : 0;
		
		let target_volume = 0;
		
		if ( sdWorld.my_entity )
		if ( sdWorld.my_entity.hea > 0 )
		{
			let old_old = sdWorld.my_entity._matter_old;
			
			//sdWorld.my_entity._matter_old = sdWorld.MorphWithTimeScale( sdWorld.my_entity._matter_old, sdWorld.my_entity.matter, 0.9, GSPEED );
			sdWorld.my_entity._matter_old = sdWorld.MorphWithTimeScale( sdWorld.my_entity._matter_old, sdWorld.my_entity.matter, 0.95, GSPEED );
			
			target_volume = ( ( sdWorld.my_entity._matter_old - old_old ) );
		}
		
		// Do not play negative matter sound during regular building
		//if ( target_volume < 0 )
		//target_volume = Math.min( 0, target_volume + 0.5 );
		
		sdSound.matter_target_volume_soft = sdWorld.MorphWithTimeScale( sdSound.matter_target_volume_soft, target_volume, 0.9, GSPEED );
	
		let v = document.hidden ? 0 : ( sdSound.volume * Math.min( 1, Math.abs( sdSound.matter_target_volume_soft ) ) * 2 );
		
		if ( sdSound.matter_target_volume_soft >= 0 )
		{
			sdSound.matter_charge_loop.volume = v;
			sdSound.matter_charge_loop_inverse.volume = 0;
		}
		else
		{
			sdSound.matter_charge_loop_inverse.volume = v;
			sdSound.matter_charge_loop.volume = 0;
		}
		
		//sdSound.matter_charge_loop.pitch = 1 + Math.abs( sdSound.matter_target_volume_soft ) * 0.01;
		//sdSound.matter_charge_loop_inverse.pitch = 1 + Math.abs( sdSound.matter_target_volume_soft ) * 0.01;
		
		/*if ( target_volume >= 0 )
		sdSound.matter_charge_loop.pitch = 1;
		else
		sdSound.matter_charge_loop.pitch = 0.6;*/
		
	
		sdSound.allow_matter_drain_loop = false;
		
		let vx = sdSound.ambient_seeker.tx - sdSound.ambient_seeker.x;
		let vy = sdSound.ambient_seeker.ty - sdSound.ambient_seeker.y;
		let di = sdWorld.Dist2D_Vector( vx, vy );
		if ( di >= GSPEED * 0.01 )
		{
			vx /= di;
			vy /= di;
			sdSound.ambient_seeker.x += vx * GSPEED * 0.005;
			sdSound.ambient_seeker.y += vy * GSPEED * 0.005;
		}
		else
		{
			sdSound.ambient_seeker.tx = Math.random() * 2 - 1;
			sdSound.ambient_seeker.ty = Math.random() * 2 - 1;
		}
		
		var rain_intens = 0;
		var earthquake_intens = 0;
		
		if ( sdWeather.only_instance )
		{
			if ( sdWeather.only_instance.snow )
			rain_intens = 0;
			else
			rain_intens = sdWeather.only_instance.raining_intensity / 200;
		
			earthquake_intens = sdWeather.only_instance.quake_intensity * 1.3 / 100;
		}
		
		var di_sum = 0;
		for ( var i = 0; i < sdSound.ambients.length; i++ )
		{
			var a = sdSound.ambients[ i ];
			a.di = 1 / ( 0.1 + 0.9 * sdWorld.Dist2D( a.x, a.y, sdSound.ambient_seeker.x, sdSound.ambient_seeker.y ) );
			di_sum += a.di;
		}
		for ( var i = 0; i < sdSound.ambients.length; i++ )
		{
			var a = sdSound.ambients[ i ];
			//a.audio.volume = a.di / di_sum * volume_ambient * ( 1 - rain_intens );
			a.audio.volume = a.di / di_sum * volume_ambient * ( 1 - rain_intens ) * Math.max( 0, 1 - sdWorld.Dist2D( sdSound.ambient_seeker.x, sdSound.ambient_seeker.y, a.x, a.y ) ); // More silence
		}
		
		sdSound.rain_low_res.volume = rain_intens * volume_ambient;
		//sdSound.rain_low_res.volume = rain_intens * volume_ambient;
		
		sdSound.earthquake.volume = earthquake_intens * volume_ambient;
		//sdSound.earthquake.volume = earthquake_intens * volume_ambient;
		
		let count_flying = 0;
		let count_hover_loop = 0;
		let count_amplifier_loop = 0;
		let count_lava_loop = 0;
		let count_lava_burn = 0;
		let count_rift_loop = 0;
		let count_anti_crystal_ambient = 0;
		let count_water_loop = 0;
		let count_antigravity = 0;
		let count_fire = 0;
		let count_motor = 0;
		
		// Singleplayer entities array is huge and will damage performance there otherwise
		const entities_array = sdWorld.is_singleplayer ? sdRenderer.single_player_visibles_array : sdEntity.entities;
			
		//for ( let i = 0; i < sdEntity.entities.length; i++ )
		for ( let i = 0; i < entities_array.length; i++ )
		{
			//const e = sdEntity.entities[ i ];
			const e = entities_array[ i ];
			
			if ( !sdWorld.is_server || sdWorld.inDist2D_Boolean( e.x, e.y, sdWorld.camera.x, sdWorld.camera.y, 1000 ) )
		
			switch ( e.GetClass() )
			{
				case 'sdCharacter':
				{
					if ( e.flying )
					count_flying += 1 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdHover':
				{
					if ( e.driver0 && e.matter > 1 /*&& ( e.driver0.act_x !== 0 || e.driver0.act_y !== 0 )*/ )
					count_hover_loop += 2 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdThruster':
				{
					if ( e.enabled )
					count_hover_loop += 1 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdMatterAmplifier':
				{
					if ( e.matter_max > 0 || e.crystal )
					count_amplifier_loop += 0.2 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdAntigravity':
				{
					if ( e.power > 0 )
					if ( e.matter > 0 )
					count_antigravity += 0.2 * e.power * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdWater':
				{
					if ( e.type === sdWater.TYPE_ACID || e.type === sdWater.TYPE_WATER )
					{
						count_water_loop += 0.002 * sdSound.GetDistanceMultForPosition( e.x, e.y );
					}
					
					if ( e.type === sdWater.TYPE_LAVA )
					{
						count_lava_loop += 0.02 * sdSound.GetDistanceMultForPosition( e.x, e.y );

						if ( e._swimmers )
						for ( let sw of e._swimmers )
						if ( !sw.isFireAndAcidDamageResistant() )
						{
							count_lava_burn += 0.15 * 1 * sdSound.GetDistanceMultForPosition( sw.x, sw.y );
						}
					}
				}
				break;
				
				case 'sdRift':
				{
					count_rift_loop += 2.5 * e.scale * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdJunk':
				{
					if ( e.type === 3 )
					count_anti_crystal_ambient += 1 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdCrystal':
				{
					if ( e.type === sdCrystal.TYPE_CRYSTAL_BIG || e.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG)
					{
						if ( e.matter_max === sdCrystal.anticrystal_value * 4 )
						count_anti_crystal_ambient += 0.1 * 4 * sdSound.GetDistanceMultForPosition( e.x, e.y );
					}
					else
					if ( e.matter_max === sdCrystal.anticrystal_value )
					count_anti_crystal_ambient += 0.1 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdEffect':
				{
					if ( e._type === sdEffect.TYPE_FIRE )
					count_fire += 0.05 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
				
				case 'sdSteeringWheel':
				{
					if ( e.type === sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
					if ( e.toggle_enabled )
					count_motor += 1 * sdSound.GetDistanceMultForPosition( e.x, e.y );
				}
				break;
			}
		}
		
		let count_fire_big = 0;
		let count_fire_small = 0;

		if ( count_fire > 0.9 )
		count_fire = 0.9;
		
		let morph = Math.min( 1, count_fire / 0.2 );
		
		count_fire_big = count_fire * morph;
		count_fire_small = count_fire * ( 1 - morph );
		
		sdSound.jetpack_volume_last = sdWorld.MorphWithTimeScale( sdSound.jetpack_volume_last, count_flying, 0.8, GSPEED );
		sdSound.jetpack.volume = Math.min( 1, sdSound.jetpack_volume_last * volume_ambient );
		
		sdSound.hover_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.hover_loop_volume_last, count_hover_loop, 0.8, GSPEED );
		sdSound.hover_loop.volume = Math.min( 1, sdSound.hover_loop_volume_last * volume_ambient );
		
		sdSound.amplifier_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.amplifier_loop_volume_last, count_amplifier_loop, 0.8, GSPEED );
		sdSound.amplifier_loop.volume = Math.min( 1, Math.min( 1.25, sdSound.amplifier_loop_volume_last ) * volume_ambient );
		
		sdSound.antigravity_volume_last = sdWorld.MorphWithTimeScale( sdSound.antigravity_volume_last, count_antigravity, 0.8, GSPEED );
		sdSound.antigravity.volume = Math.min( 1, Math.min( 1.25, sdSound.antigravity_volume_last ) * volume_ambient );
		
		sdSound.lava_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.lava_loop_volume_last, count_lava_loop, 0.8, GSPEED );
		sdSound.lava_loop.volume = Math.min( 1, Math.min( 1.5, sdSound.lava_loop_volume_last ) * volume_ambient );
		
		sdSound.fire_big_volume_last = sdWorld.MorphWithTimeScale( sdSound.fire_big_volume_last, count_fire_big, 0.8, GSPEED );
		sdSound.fire_big.volume = Math.min( 1, Math.min( 1.5, sdSound.fire_big_volume_last ) * volume_ambient );
		
		sdSound.fire_big_volume_last = sdWorld.MorphWithTimeScale( sdSound.fire_big_volume_last, count_fire_small, 0.8, GSPEED );
		sdSound.fire_big.volume = Math.min( 1, Math.min( 1.5, sdSound.fire_big_volume_last ) * volume_ambient );
		
		sdSound.motor_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.motor_loop_volume_last, count_motor, 0.8, GSPEED );
		sdSound.motor_loop.volume = Math.min( 1, Math.min( 1.5, sdSound.motor_loop_volume_last ) * volume_ambient );
		
		if ( sdWorld.my_entity )
		{
			if ( sdWorld.my_entity._in_water && !sdWorld.my_entity._can_breathe )
			{
				count_water_loop = 0.1;
				sdSound.water_loop.pitch = 0.25;
			}
			else
			sdSound.water_loop.pitch = 1;
		}
		
		count_water_loop = Math.max( 0, count_water_loop - ( 0.5 + Math.sin( sdWorld.time / 10000 ) * 0.5 ) * 0.05 );
		sdSound.water_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.water_loop_volume_last, count_water_loop, 0.8, GSPEED );
		sdSound.water_loop.volume = Math.min( 1, Math.min( 1.5, sdSound.water_loop_volume_last ) * volume_ambient );
		
		
		
		sdSound.lava_burn_volume_last = sdWorld.MorphWithTimeScale( sdSound.lava_burn_volume_last, count_lava_burn, 0.8, GSPEED );
		sdSound.lava_burn.volume = Math.min( 1, Math.min( 2, sdSound.lava_burn_volume_last ) * volume_ambient );
		
		sdSound.rift_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.rift_loop_volume_last, count_rift_loop, 0.8, GSPEED );
		sdSound.rift_loop.volume = Math.min( 1, Math.min( 10, sdSound.rift_loop_volume_last ) * volume_ambient );
		
		sdSound.anti_crystal_ambient_volume_last = sdWorld.MorphWithTimeScale( sdSound.anti_crystal_ambient_volume_last, count_anti_crystal_ambient, 0.8, GSPEED );
		sdSound.anti_crystal_ambient.volume = Math.min( 1, Math.min( 10, sdSound.anti_crystal_ambient_volume_last ) * volume_ambient );
		
		
		// Note: Never go over 1 on .volume - browsers will throw an error and freeze screen
	}
	static GetDistanceMultForPosition( x,y )
	{
		let di = sdWorld.Dist2D( sdWorld.camera.x, sdWorld.camera.y, x, y );
		
		//return Math.max( 0.05, Math.pow( Math.max( 0, 400 - di ) / 400, 0.5 ) );
		
		return Math.max( 0.01, 200 / ( 200 + di ) );
	}
	static CreateSoundChannel( for_entity )
	{
		let arr = sdSound.entity_to_channels_list.get( for_entity );
		if ( arr === undefined )
		{
			arr = [];
			sdSound.entity_to_channels_list.set( for_entity, arr );
		}

		let obj = {
			entity: for_entity,
			uid: arr.length, // Multiple sound channels per entity is an option
			current_played_howl: null,
			current_played_playback_id: null
		};

		arr.push( obj );

		return obj;
	}
	static DestroyAllSoundChannels( for_entity )
	{
		// There could be logic to cancel all currently played sounds
		sdSound.entity_to_channels_list.delete( for_entity );
	}
	static PlaySound( params, exclusive_to_sockets_arr=null )// name, x,y, volume=1, server_allowed=true )
	{
		if ( sdWorld.is_singleplayer )
		{
		}
		else
		{
			if ( sdWorld.is_server )
			{
				if ( !sdSound.server_mute )
				if ( !params._server_allowed )
				sdWorld.SendSound( params, exclusive_to_sockets_arr );

				return;
			}
			else
			if ( !params._server_allowed )
			return;
		}

		let name = params.name;
		let volume = params.volume || 1;
		let rate = params.pitch || 1;
		
		let sound_channel = null;
		
		if ( params.channel )
		{
			if ( params.channel instanceof Array )
			{
				// Array, synced sound from remote
				
				let entity = sdEntity.entities_by_net_id_cache_map.get( params.channel[ 0 ] );
				
				if ( entity )
				{
					sound_channel = sdSound.entity_to_channels_list.get( entity );
					
					if ( sound_channel )
					{
						sound_channel = sound_channel[ params.channel[ 1 ] ];
						
						if ( !sound_channel )
						{
							throw new Error( 'Number of sound channels created per entity class "'+entity.GetClass()+'" on server and client does not match' );
						}
					}
					else
					return;
				}
				else
				return;
			}
			else
			{
				sound_channel = params.channel;
			}
			
		}
		
		let v;
		
		if ( typeof params.x !== 'undefined' )
		{
		
			let x = params.x;
			let y = params.y;

			/*if ( x < sdWorld.world_bounds.x1 )
			return;
			if ( x >= sdWorld.world_bounds.x2 )
			return;

			if ( y < sdWorld.world_bounds.y1 )
			return;
			if ( y >= sdWorld.world_bounds.y2 )
			return;*/

			v = sdSound.GetDistanceMultForPosition( x,y ) * sdSound.volume * volume;
		}
		else
		{
			v = sdSound.volume * volume;
		}
	
		if ( typeof sdSound.sounds[ name ] === 'undefined' )
		{
			//sdSound.sounds[ name ] = new Audio( './audio/' + name + '.wav' );
			sdSound.sounds[ name ] = new Howl({ src: [ './audio/' + name + '.wav' ] });
		}
		
		if ( sdSound.allowed )
		{
			if ( isNaN( v ) || v === Infinity || v === -Infinity )
			{
				console.warn( 'Sound won\'t be played due to error: ', params );
			}
			else
			{
				sdSound.sounds_played_at_frame++;
				if ( sdSound.sounds_played_at_frame > 10 )
				{
					//console.log('Too many sounds played within short timespan. Is limit correct?', name, globalThis.getStackTrace() );
					console.log('Too many sounds played within short timespan. Is limit correct?' );
					return;
				}
				
				/*let clone = sdSound.sounds[ name ].cloneNode();
			
				clone.volume = v;

				clone.playbackRate = rate;
				clone.preservesPitch = false;
				clone.play();*/
				
				let howl = sdSound.sounds[ name ];
				
				if ( document.hidden )
				v *= sdSound.volume_scale_inactive_window;
				
				howl.volume( v );
				howl.rate( rate );
				let playback_id = howl.play();
				
				if ( sound_channel )
				{
					if ( sound_channel.current_played_playback_id !== null )
					sound_channel.current_played_howl.stop( sound_channel.current_played_playback_id );
				
					sound_channel.current_played_howl = howl;
					sound_channel.current_played_playback_id = playback_id;
				}
				
			}
		}
	}
	
	static PlayUISound( params ) // It is more of a hack than anything
	{
		params._server_allowed = true;
		params.x = sdWorld.camera.x;
		params.y = sdWorld.camera.y;
		
		sdSound.PlaySound( params );
	}
}
export default sdSound;
