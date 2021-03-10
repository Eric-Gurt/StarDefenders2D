
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdAsteroid from './sdAsteroid.js';

import sdCube from './sdCube.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';



import sdRenderer from '../client/sdRenderer.js';

class sdWeather extends sdEntity
{
	static init_class()
	{
		sdWeather.img_rain = sdWorld.CreateImageFromFile( 'rain' );
		
		sdWeather.only_instance = null;
		
		sdWeather.pattern = [];
		for ( var i = 0; i < 300; i++ )
		sdWeather.pattern.push({ x:Math.random(), y:Math.random(), last_vis:false, last_y:0, last_x:0 });
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	IsGlobalEntity() // Should never change
	{ return true; }
	
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return false; }
	
	constructor( params )
	{
		super( params );
		
		this.x = 0;
		this.y = 0;
		
		if ( sdWeather.only_instance )
		sdWeather.only_instance.remove();
	
		sdWeather.only_instance = this;
		
		this._rain_ammount = 0;
		this._asteroid_spam_ammount = 0;
		
		this.raining_intensity = 0;
		
		//this._rain_offset = 0;
		this._time_until_event = 0;
		
		this._asteroid_timer = 0; // 60 * 1000 / ( ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 800 )
		this._asteroid_timer_scale_next = 0;
		
		this.day_time = 0;
		
		// World bounds, but slow
		this.x1 = 0;
		this.y1 = 0;
		this.x2 = 0;
		this.y2 = 0;
	}
	TraceDamagePossibleHere( x,y, steps_max=Infinity )
	{
		for ( var yy = y; yy > sdWorld.world_bounds.y1 && steps_max > 0; yy -= 8, steps_max-- )
		if ( sdWorld.CheckWallExists( x, yy, null, null, [ 'sdBlock', 'sdDoor', 'sdWater' ] ) )
		return false;

		return true;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			this.x1 = sdWorld.world_bounds.x1;
			this.y1 = sdWorld.world_bounds.y1;
			this.x2 = sdWorld.world_bounds.x2;
			this.y2 = sdWorld.world_bounds.y2;
			
			//return; // Hack
			
			this.day_time += GSPEED;
			if ( this.day_time > 30 * 60 * 24 )
			this.day_time = 0;
			
			this._asteroid_timer += GSPEED;
			if ( this._asteroid_timer > 60 * 30 / ( ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 800 ) )
			{
				let ent = new sdAsteroid({ 
					x:sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ), 
					y:sdWorld.world_bounds.y1 + 1
				});
				sdEntity.entities.push( ent );

				this._asteroid_timer = 0;
				this._asteroid_timer_scale_next = Math.random();
			}
			
			if ( this._asteroid_spam_ammount > 0 )
			{
				this._asteroid_spam_ammount -= GSPEED * 1;
				this._asteroid_timer += GSPEED * 40;
			}
			
			if ( this._rain_ammount > 0 )
			{
				this.raining_intensity = Math.min( 100, this.raining_intensity + GSPEED * 0.1 );
				
				this._rain_ammount -= this.raining_intensity / 100;
			}
			else
			{
				this.raining_intensity = Math.max( 0, this.raining_intensity - GSPEED * 0.1 );
			}
			
			if ( this.raining_intensity > 50 )
			for ( var i = 0; i < sdWorld.sockets.length; i++ )
			if ( sdWorld.sockets[ i ].character )
			if ( !sdWorld.sockets[ i ].character._is_being_removed )
			{
				if ( sdWorld.sockets[ i ].character.driver_of === null )
				if ( this.TraceDamagePossibleHere( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y ) )
				{
					if ( sdWorld.sockets[ i ].character.pain_anim <= 0 && sdWorld.sockets[ i ].character.hea > 0 )
					sdWorld.SendEffect({ x:sdWorld.sockets[ i ].character.x, y:sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character.hitbox_y1, type:sdWorld.sockets[ i ].character.GetBleedEffect(), filter:sdWorld.sockets[ i ].character.GetBleedEffectFilter() });
					
					sdWorld.sockets[ i ].character.Damage( GSPEED * this.raining_intensity / 240 );
				}
			}
			
			// Hack
			//if ( this._time_until_event > 90 )
			//this._time_until_event = 90;
			
			this._time_until_event -= GSPEED;
			if ( this._time_until_event < 0 )
			{
				this._time_until_event = Math.random() * 30 * 60 * 8; // once in an ~4 minutes (was 8 but more event kinds = less events sort of)
				
				let r = ~~( Math.random() * 4 );
				
				//r = 3; // Hack
				
				if ( r === 0 )
				this._rain_ammount = 30 * 15 * ( 1 + Math.random() * 2 ); // start rain for ~15 seconds
			
				if ( r === 1 )
				this._asteroid_spam_ammount = 30 * 15 * ( 1 + Math.random() * 2 );
			
				if ( r === 2 )
				{
					for ( let t = Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) + 1; t > 0; t-- )
					if ( sdCube.alive_cube_counter < 20 )
					{
						let cube = new sdCube({ 
							x:sdWorld.world_bounds.x1 + 32 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 64 ), 
							y:sdWorld.world_bounds.y1 + 32,
							is_huge: ( sdCube.alive_huge_cube_counter >= sdWorld.GetPlayingPlayersCount() ) ? false : ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.1 )
						});
						cube.sy += 10;
						sdEntity.entities.push( cube );
						
						if ( !cube.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
						cube.remove();
						else
						sdWorld.UpdateHashPosition( cube, false ); // Prevent inersection with other ones
					}
				}
				
				if ( r === 3 )
				{
					let ais = 0;
					
					for ( var i = 0; i < sdCharacter.characters.length; i++ )
					if ( sdCharacter.characters[ i ].hea > 0 )
					if ( !sdCharacter.characters[ i ]._is_being_removed )
					if ( sdCharacter.characters[ i ]._ai )
					{
						ais++;
					}
					
					let instances = 0;
					let instances_tot = 3 + ( ~~( Math.random() * 3 ) );
					
					let left_side = ( Math.random() < 0.5 );
					
					while ( instances < instances_tot && ais < 8 )
					{

						let character_entity = new sdCharacter({ x:0, y:0 });

						sdEntity.entities.push( character_entity );

						{
							let x,y;
							let tr = 1000;
							do
							{
								if ( left_side )
								x = sdWorld.world_bounds.x1 + 16 + 16 * instances;
								else
								x = sdWorld.world_bounds.x2 - 16 - 16 * instances;

								y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

								if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
								if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
								if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
								{
									character_entity.x = x;
									character_entity.y = y;

									//sdWorld.UpdateHashPosition( ent, false );

									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );

									let falkok_settings = {"hero_name":"Falkok","color_bright":"#6b0000","color_dark":"#420000","color_visor":"#ff0000","color_suit":"#240000","color_suit2":"#2e0000","color_dark2":"#560101","color_shoes":"#000000","color_skin":"#240000","helmet1":false,"helmet2":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":true};

									character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter( falkok_settings );
									character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( falkok_settings );
									character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( falkok_settings );
									character_entity.title = falkok_settings.hero_name;

									character_entity.matter = 75;
									character_entity.matter_max = 75;

									character_entity.hea = 115; // 105 so railgun requires at least headshot to kill and body shot won't cause bleeding
									character_entity.hmax = 115;

									character_entity._damage_mult = 1 / 4;

									character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
									character_entity._ai_enabled = true;

									break;
								}

								tr--;
								if ( tr < 0 )
								{
									character_entity.remove();
									break;
								}
							} while( true );
						}
						
						instances++;
						ais++;
					}
				}
			}
		}
		else
		{
			//this._rain_offset = ( this._rain_offset + GSPEED ) % 32;
			
			sdWorld.world_bounds.x1 = this.x1;
			sdWorld.world_bounds.y1 = this.y1;
			sdWorld.world_bounds.x2 = this.x2;
			sdWorld.world_bounds.y2 = this.y2;
		}
	}
	Draw( ctx, attached )
	{
		ctx.translate( -this.x, -this.y ); // sdWeather does move now just so it is kepth inisde of world bounds and not gets removed with old areas
		//
		//ctx.translate( Math.floor(( sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale )/32)*32, 
		//               Math.floor(( sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale )/32)*32 );
		
		/*
		for ( var x = 0; x < sdRenderer.screen_width; x += 32 )
		for ( var y = 0; y < sdRenderer.screen_height; y += 32 )
		{
		    ctx.drawImage( sdWeather.img_rain, 
		        x - 16 + ( ( y % 32 < 16 ) ? 16 : 0 ), 
		        y - 16 + ( sdWorld.time % 32 ), 
		        32,32 );
	    }*/
		
		if ( this.raining_intensity > 0 )
		{
			ctx.globalAlpha = Math.pow( this.raining_intensity / 50, 1 );
			for ( var i = 0; i < sdWeather.pattern.length * this.raining_intensity / 100; i++ )
			{
				var p = sdWeather.pattern[ i ];

				var xx = sdWorld.mod( p.x * sdRenderer.screen_width - sdWorld.camera.x, sdRenderer.screen_width ) + sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale;
				var yy = sdWorld.mod( p.y * sdRenderer.screen_height + ( sdWorld.time * 0.3 ) - sdWorld.camera.y, sdRenderer.screen_height ) + sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale;

				var just_one_step_check = ( Math.random() > 0.1 && p.last_y < yy && Math.abs( p.last_x - xx ) < 100 );

				p.last_x = xx;
				p.last_y = yy;

				if ( just_one_step_check )
				{
					if ( p.last_vis )
					{
						p.last_vis = this.TraceDamagePossibleHere( xx, yy, 2 );
						if ( this.raining_intensity >= 30 )
						if ( !p.last_vis )
						{
						    let e = new sdEffect({ x:xx, y:yy, type:sdEffect.TYPE_BLOOD_GREEN, filter:'opacity('+(~~((ctx.globalAlpha * 0.5)*10))/10+')' });
						    sdEntity.entities.push( e );
						}
					}
				}
				else
				p.last_vis = this.TraceDamagePossibleHere( xx, yy, Infinity );

				var vis = p.last_vis;

				if ( vis )
				ctx.drawImage( sdWeather.img_rain, 
					xx - 16, 
					yy - 16, 
					32,32 );
			}
			ctx.globalAlpha = 1;
		}
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( sdWeather.only_instance === this )
		sdWeather.only_instance = null;
	}
}
//sdWeather.init_class();

export default sdWeather;