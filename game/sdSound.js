
import sdWorld from './sdWorld.js';
import sdEntity from './entities/sdEntity.js';
import sdWeather from './entities/sdWeather.js';

class sdSound
{
	static init_class()
	{
		sdSound.volume = 0.1; // non-relative
		sdSound.volume_speech = 0.1; // non-relative // amplitude below 1 (out of 100) is silence in mespeak
		sdSound.volume_ambient = 0.075; // non-relative
		
		//sdSound.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			
		sdSound.sounds = {};
		
		sdSound.sounds_played_at_frame = 0; // Prevent massive flood
				
		//		= new Audio( './audio/android_miner_hurt.wav' );
		
		//sdSound.s_test.play();
		//sdSound.s_test.cloneNode().play();
		
		sdSound.matter_charge_loop = new Audio( './audio/matter_charge_loop2.wav' );
		sdSound.matter_charge_loop.volume = 0;
		sdSound.matter_charge_loop.loop = true;
		
		sdSound.ambient1 = new Audio( './audio/ambient1_looped3.wav' );
		sdSound.ambient1.volume = 0;
		sdSound.ambient1.loop = true;
		
		sdSound.ambient3 = new Audio( './audio/ambient3.wav' );
		sdSound.ambient3.volume = 0;
		sdSound.ambient3.loop = true;
		
		sdSound.scary_monsters_in_the_dark = new Audio( './audio/scary_monsters_in_the_dark.wav' );
		sdSound.scary_monsters_in_the_dark.volume = 0;
		sdSound.scary_monsters_in_the_dark.loop = true;
		
		sdSound.rain_low_res = new Audio( './audio/rain_low_res.wav' );
		sdSound.rain_low_res.volume = 0;
		sdSound.rain_low_res.loop = true;
		
		sdSound.jetpack_volume_last = 0;
		sdSound.jetpack = new Audio( './audio/jetpack.wav' );
		sdSound.jetpack.volume = 0;
		sdSound.jetpack.loop = true;
		
		sdSound.hover_loop_volume_last = 0;
		sdSound.hover_loop = new Audio( './audio/hover_loop.wav' );
		sdSound.hover_loop.volume = 0;
		sdSound.hover_loop.loop = true;
		
		
		
		sdSound.ambient_seeker = { x:Math.random()*2-1, y:Math.random()*2-1, tx:Math.random()*2-1, ty:Math.random()*2-1 };
		sdSound.ambients = [
			{ x: -1, y: 0, audio: sdSound.ambient1 },
			{ x: 0, y: -1, audio: sdSound.ambient3 },
			{ x: 1, y: 0, audio: sdSound.scary_monsters_in_the_dark }
		];
		
		sdSound.allowed = false; // Gesture await
		
		sdSound.server_mute = false; // Becomes true during silent removals
	}
	static AllowSound()
	{
		if ( !sdSound.allowed )
		{
			sdSound.allowed = true;
			sdSound.matter_charge_loop.play();
			//sdSound.ambient1.play();
			//sdSound.ambient3.play();
			
			for ( var i = 0; i < sdSound.ambients.length; i++ )
			sdSound.ambients[ i ].audio.play();
		
			sdSound.rain_low_res.play();
			
			sdSound.jetpack.play();
			sdSound.hover_loop.play();
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
			
			target_volume = ( Math.max( 0, sdWorld.my_entity._matter_old - old_old ) * 1 );
		}
		sdSound.matter_charge_loop.volume = sdSound.volume * Math.min( 1, target_volume );
		
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
		
		if ( sdWeather.only_instance )
		rain_intens = sdWeather.only_instance.raining_intensity / 100;
		
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
			a.audio.volume = a.di / di_sum * sdSound.volume_ambient * ( 1 - rain_intens );
		}
		//sdSound.ambient1.volume = sdSound.volume_ambient;
		//sdSound.ambient3.volume = sdSound.volume_ambient;
		
		sdSound.rain_low_res.volume = rain_intens * sdSound.volume_ambient;
		
		let count_flying = 0;
		let count_hover_loop = 0;
		
		for ( var i = 0; i < sdEntity.entities.length; i++ )
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
		}
		
		sdSound.jetpack_volume_last = sdWorld.MorphWithTimeScale( sdSound.jetpack_volume_last, count_flying, 0.8, GSPEED );
		sdSound.jetpack.volume = sdSound.jetpack_volume_last * sdSound.volume_ambient;
		
		sdSound.hover_loop_volume_last = sdWorld.MorphWithTimeScale( sdSound.hover_loop_volume_last, count_hover_loop, 0.8, GSPEED );
		sdSound.hover_loop.volume = sdSound.hover_loop_volume_last * sdSound.volume_ambient;
	}
	static GetDistanceMultForPosition( x,y )
	{
		let di = sdWorld.Dist2D( sdWorld.camera.x, sdWorld.camera.y, x, y );
		
		return Math.max( 0.2, Math.pow( Math.max( 0, 400 - di ) / 400, 0.5 ) );
	}
	static PlaySound( params, exclusive_to_sockets_arr=null )// name, x,y, volume=1, server_allowed=true )
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

		let name = params.name;
		let x = params.x;
		let y = params.y;
		let volume = params.volume || 1;
		let rate = params.pitch || 1;
		
		if ( x < sdWorld.world_bounds.x1 )
		return;
		if ( x >= sdWorld.world_bounds.x2 )
		return;
		
		if ( y < sdWorld.world_bounds.y1 )
		return;
		if ( y >= sdWorld.world_bounds.y2 )
		return;
	
		if ( typeof sdSound.sounds[ name ] === 'undefined' )
		{
			//let time_of_first_play = sdWorld.time;
			
			sdSound.sounds[ name ] = new Audio( './audio/' + name + '.wav' );
			/*sdSound.sounds[ name ].addEventListener("canplaythrough", event => 
			{
				sdSound.sounds[ name ].can_play = true;
				
				if ( sdWorld.time < time_of_first_play + 1000 )
				sdSound.PlaySound( params );
			});*/
		}
		
		if ( sdSound.allowed )
		{
			
			let v = sdSound.GetDistanceMultForPosition( x,y ) * sdSound.volume * volume;
			
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
				
				let clone = sdSound.sounds[ name ].cloneNode();
			
				clone.volume = v;

				clone.playbackRate = rate;
				clone.preservesPitch = false;
				clone.play();
			}
		}
	}
}
export default sdSound;