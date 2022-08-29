
import sdWorld from './sdWorld.js';
import sdEntity from './entities/sdEntity.js';
import sdWeather from './entities/sdWeather.js';
import sdWater from './entities/sdWater.js';
import sdCharacterRagdoll from './entities/sdCharacterRagdoll.js';
import sdEffect from './entities/sdEffect.js';
import sdCrystal from './entities/sdCrystal.js';

/*

	Test sound console command:

		sdSound.PlaySound({ name:'player_step', x:sdWorld.my_entity.x, y:sdWorld.my_entity.y, volume:1, _server_allowed:true });

*/

class sdSound
{
	static init_class()
	{
		sdSound.volume = 0.1; // non-relative
		sdSound.volume_speech = 0.1; // non-relative // amplitude below 1 (out of 100) is silence in mespeak
		sdSound.volume_ambient = 0.075; // non-relative
		
		sdSound.SetVolumeScale = ( v )=>{
			
			sdSound.volume = v * 1; // non-relative
			sdSound.volume_speech = v * 1; // non-relative // amplitude below 1 (out of 100) is silence in mespeak
			sdSound.volume_ambient = v * 0.75; // non-relative
			
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
					sdSound[ var_name + '_howl' ].volume( x, sdSound[ var_name + '_sound_id' ] );
				},
				get: function()
				{
					debugger; // Won't work
					return 0;
				}
			});
			
			Object.defineProperty( sdSound[ var_name ], 'pitch', 
			{ 
				set: function ( x ) 
				{ 
					sdSound[ var_name + '_howl' ].rate( x, sdSound[ var_name + '_sound_id' ] );
				},
				get: function()
				{
					debugger; // Won't work
					return 0;
				}
			});
		};
		
		MakeLoopAmbient( 'matter_charge_loop', './audio/matter_charge_loop2.wav' );
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
	}
	static AllowSound()
	{
		if ( !sdSound.allowed )
		{
			sdSound.allowed = true;
		}
	}
	static HandleMatterChargeLoop( GSPEED )
	{
		let target_volume = 0;
		
		if ( sdWorld.my_entity )
		if ( sdWorld.my_entity.hea > 0 )
		{
			let old_old = sdWorld.my_entity._matter_old;
			
			sdWorld.my_entity._matter_old = sdWorld.MorphWithTimeScale( sdWorld.my_entity._matter_old, sdWorld.my_entity.matter, 0.9, GSPEED );
			
			target_volume = ( ( sdWorld.my_entity._matter_old - old_old ) );
		}
		
		// Do not play negative matter sound during regular building
		if ( target_volume < 0 )
		target_volume = Math.min( 0, target_volume + 0.5 );
	
		sdSound.matter_charge_loop.volume = sdSound.volume * Math.min( 1, Math.abs( target_volume ) );
		//sdSound.matter_charge_loop.volume = sdSound.volume * Math.min( 1, Math.abs( target_volume ) );
		
		if ( target_volume >= 0 )
		{
			sdSound.matter_charge_loop.playbackRate = 1;
			//sdSound.matter_charge_loop.playbackRate = 1;
		}
		else
		{
			sdSound.matter_charge_loop.playbackRate = 0.6;
			//sdSound.matter_charge_loop.playbackRate = 0.6;
		}
	
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
			//a.audio.volume = a.di / di_sum * sdSound.volume_ambient * ( 1 - rain_intens );
			a.audio.volume = a.di / di_sum * sdSound.volume_ambient * ( 1 - rain_intens ) * Math.max( 0, 1 - sdWorld.Dist2D( sdSound.ambient_seeker.x, sdSound.ambient_seeker.y, a.x, a.y ) ); // More silence
		}
		
		sdSound.rain_low_res.volume = rain_intens * sdSound.volume_ambient;
		//sdSound.rain_low_res.volume = rain_intens * sdSound.volume_ambient;
		
		sdSound.earthquake.volume = earthquake_intens * sdSound.volume_ambient;
		//sdSound.earthquake.volume = earthquake_intens * sdSound.volume_ambient;
		
		let count_flying = 0;
		let count_hover_loop = 0;
		let count_amplifier_loop = 0;
		let count_lava_loop = 0;
		let count_lava_burn = 0;
		let count_rift_loop = 0;
		let count_anti_crystal_ambient = 0;
		let count_water_loop = 0;
		let count_antigravity = 0;
			
		for ( var i = 0; i < sdEntity.entities.length; i++ )
		{
			if ( !sdEntity.entities[ i ].is( sdCharacterRagdoll.sdBone ) )
			if ( !sdEntity.entities[ i ].is( sdEffect ) )
			{
				if ( sdEntity.entities[ i ].GetClass() === 'sdCharacter' )
				{
					if ( sdEntity.entities[ i ].flying )
					count_flying += 1 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdHover' )
				{
					if ( sdEntity.entities[ i ].driver0 /*&& ( sdEntity.entities[ i ].driver0.act_x !== 0 || sdEntity.entities[ i ].driver0.act_y !== 0 )*/ )
					count_hover_loop += 2 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdThruster' )
				{
					if ( sdEntity.entities[ i ].enabled )
					count_hover_loop += 1 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdMatterAmplifier' )
				{
					if ( sdEntity.entities[ i ].matter_max > 0 || sdEntity.entities[ i ].crystal )
					count_amplifier_loop += 0.2 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdAntigravity' )
				{
					if ( sdEntity.entities[ i ].power > 0 )
					count_antigravity += 0.2 * sdEntity.entities[ i ].power * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdWater' )
				{
					if ( sdEntity.entities[ i ].type === sdWater.TYPE_ACID || sdEntity.entities[ i ].type === sdWater.TYPE_WATER )
					{
						count_water_loop += 0.002 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
					}
					
					if ( sdEntity.entities[ i ].type === sdWater.TYPE_LAVA )
					{
						count_lava_loop += 0.02 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );

						for ( let e of sdEntity.entities[ i ]._swimmers )
						if ( !e.isWaterDamageResistant() )
						{
							count_lava_burn += 0.15 * 1 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
						}
					}
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdRift' )
				{
					count_rift_loop += 2.5 * sdEntity.entities[ i ].scale * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdJunk' && sdEntity.entities[ i ].type === 3 )
				{
					count_anti_crystal_ambient += 1 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
				else
				if ( sdEntity.entities[ i ].GetClass() === 'sdCrystal' )
				{
					if ( sdEntity.entities[ i ].type === sdCrystal.TYPE_CRYSTAL_BIG || sdEntity.entities[ i ].type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG)
					{
						if ( sdEntity.entities[ i ].matter_max === sdCrystal.anticrystal_value * 4 )
						count_anti_crystal_ambient += 0.1 * 4 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
					}
					else
					if ( sdEntity.entities[ i ].matter_max === sdCrystal.anticrystal_value )
					count_anti_crystal_ambient += 0.1 * sdSound.GetDistanceMultForPosition( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
				}
			}
		}
		
		sdSound.jetpack_volume_last = sdWorld.MorphWithTimeScale( sdSound.jetpack_volume_last, count_flying, 0.8, GSPEED );
		sdSound.jetpack.volume = Math.min( 1, sdSound.jetpack_volume_last * sdSound.volume_ambient );
		
		sdSound.hover_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.hover_loop_volume_last, count_hover_loop, 0.8, GSPEED );
		sdSound.hover_loop.volume = Math.min( 1, sdSound.hover_loop_volume_last * sdSound.volume_ambient );
		
		sdSound.amplifier_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.amplifier_loop_volume_last, count_amplifier_loop, 0.8, GSPEED );
		sdSound.amplifier_loop.volume = Math.min( 1, Math.min( 1.25, sdSound.amplifier_loop_volume_last ) * sdSound.volume_ambient );
		
		sdSound.antigravity_volume_last = sdWorld.MorphWithTimeScale( sdSound.antigravity_volume_last, count_antigravity, 0.8, GSPEED );
		sdSound.antigravity.volume = Math.min( 1, Math.min( 1.25, sdSound.antigravity_volume_last ) * sdSound.volume_ambient );
		
		sdSound.lava_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.lava_loop_volume_last, count_lava_loop, 0.8, GSPEED );
		sdSound.lava_loop.volume = Math.min( 1, Math.min( 1.5, sdSound.lava_loop_volume_last ) * sdSound.volume_ambient );
		
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
		sdSound.water_loop.volume = Math.min( 1, Math.min( 1.5, sdSound.water_loop_volume_last ) * sdSound.volume_ambient );
		
		
		
		sdSound.lava_burn_volume_last = sdWorld.MorphWithTimeScale( sdSound.lava_burn_volume_last, count_lava_burn, 0.8, GSPEED );
		sdSound.lava_burn.volume = Math.min( 1, Math.min( 2, sdSound.lava_burn_volume_last ) * sdSound.volume_ambient );
		
		sdSound.rift_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.rift_loop_volume_last, count_rift_loop, 0.8, GSPEED );
		sdSound.rift_loop.volume = Math.min( 1, Math.min( 10, sdSound.rift_loop_volume_last ) * sdSound.volume_ambient );
		
		sdSound.anti_crystal_ambient_volume_last = sdWorld.MorphWithTimeScale( sdSound.anti_crystal_ambient_volume_last, count_anti_crystal_ambient, 0.8, GSPEED );
		sdSound.anti_crystal_ambient.volume = Math.min( 1, Math.min( 10, sdSound.anti_crystal_ambient_volume_last ) * sdSound.volume_ambient );
		
		
		// Note: Never go over 1 on .volume - browsers will throw an error and freeze screen
	}
	static GetDistanceMultForPosition( x,y )
	{
		let di = sdWorld.Dist2D( sdWorld.camera.x, sdWorld.camera.y, x, y );
		
		return Math.max( 0.2, Math.pow( Math.max( 0, 400 - di ) / 400, 0.5 ) );
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
		
		let v;
		
		if ( typeof params.x !== 'undefined' )
		{
		
			let x = params.x;
			let y = params.y;

			if ( x < sdWorld.world_bounds.x1 )
			return;
			if ( x >= sdWorld.world_bounds.x2 )
			return;

			if ( y < sdWorld.world_bounds.y1 )
			return;
			if ( y >= sdWorld.world_bounds.y2 )
			return;

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
					console.log('Too many sounds played within short timespan. Is limit correct?');
					return;
				}
				
				/*let clone = sdSound.sounds[ name ].cloneNode();
			
				clone.volume = v;

				clone.playbackRate = rate;
				clone.preservesPitch = false;
				clone.play();*/
				
				
				sdSound.sounds[ name ].volume( v );
				sdSound.sounds[ name ].rate( rate );
				sdSound.sounds[ name ].play();
				
			}
		}
	}
}
export default sdSound;