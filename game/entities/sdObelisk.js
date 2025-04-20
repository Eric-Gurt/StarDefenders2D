import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdWeather from './sdWeather.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdGun from './sdGun.js';
import sdJunk from './sdJunk.js';


import sdRenderer from '../client/sdRenderer.js';


class sdObelisk extends sdEntity
{
	static init_class()
	{
		sdObelisk.img_obelisk = sdWorld.CreateImageFromFile( 'obelisk' );
		/*sdObelisk.img_obelisk1 = sdWorld.CreateImageFromFile( 'obelisk1' );
		sdObelisk.img_obelisk2 = sdWorld.CreateImageFromFile( 'obelisk2' );
		sdObelisk.img_obelisk3 = sdWorld.CreateImageFromFile( 'obelisk3' );*/
		sdObelisk.img_obelisk4 = sdWorld.CreateImageFromFile( 'obelisk4' );
		sdObelisk.img_obelisk5 = sdWorld.CreateImageFromFile( 'obelisk5' ); // Sprite by PeacyQuack
		sdObelisk.img_obelisk6 = sdWorld.CreateImageFromFile( 'obelisk6' ); // Original sprite by PeacyQuack, reworked by LazyRain
		sdObelisk.img_obelisk7 = sdWorld.CreateImageFromFile( 'obelisk7' );
		sdObelisk.img_obelisk8 = sdWorld.CreateImageFromFile( 'obelisk8' ); // Sprite by LordBored


		sdObelisk.obelisks_counter = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === 8 ? -9 : this.type === 7 ? -9 : this.type === 6 ? -10 : this.type === 5 ? -9 : this.type === 4 ? -8 : -5; }
	get hitbox_x2() { return this.type === 8 ? 9 : this.type === 7 ? 9 : this.type === 6 ? 10 : this.type === 5 ? 9 : this.type === 4 ? 8 : 5; }
	get hitbox_y1() { return this.type === 8 ? -19 : this.type === 7 ? -19 : this.type === 6 ? -24 : this.type === 5 ? -21 : this.type === 4 ? - 24 : -12; }
	get hitbox_y2() { return this.type === 8 ? 31 : this.type === 7 ? 31 : this.type === 6 ? 32 : this.type === 5 ? 21 : this.type === 4 ? 32 : 16; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	get mass()
	{ return 2500; }

	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this._hea > 0 )
		{
			this._hea -= dmg;

			if ( this._hea <= 0 )
			{
				this.remove();
			}
			else
			{
				this._regen_timeout = 30 * 10;
			}
		}
	}
	ActivateObelisk()
	{
		let color = '#FFFFFF';
		
		if ( this.type === 1 )
		{
			sdWeather.only_instance._quake_scheduled_amount = 30 * 90; // Earthquake for 90 seconds
			color = '#804000';
			
		}

		if ( this.type === 2 )
		{
			sdWeather.only_instance._rain_amount = 30 * 60; // Start raining for 60 seconds
			color = '#00FFFF';
		}
		
		if ( this.type === 3 )
		{
			sdWeather.only_instance._asteroid_spam_amount = 30 * 60; // Meteors for 60 seconds
			color = '#804000';
		}

		if ( this.type === 4 ) // A larger obelisk which is the combination of all 3 above
		{
			sdWeather.only_instance._quake_scheduled_amount = 30 * 90; // Earthquake for 90 seconds
			sdWeather.only_instance._rain_amount = 30 * 60; // Start raining for 60 seconds
			sdWeather.only_instance._asteroid_spam_amount = 30 * 60; // Meteors for 60 seconds
		}

		if ( this.type === 5 ) // A larger obelisk which summons all possible "daily" events on the planet
		{
			if ( sdWeather.only_instance._daily_events.length > 0 )
			{
				let n = 0;
				for( let i = 0; i < sdWeather.only_instance._daily_events.length; i++)
				{
					n = sdWeather.only_instance._daily_events[ i ];
					if ( n !== 8 ) // No need for earthquakes when there's a specific obelisk doing that
					//console.log(n);
					sdWeather.only_instance.ExecuteEvent({
						event: n
					});
				}
			}
			color = '#0000FF';
		}
		if ( this.type === 6 ) // A larger obelisk which summons 8 events which cannot occur via time on the planet. Guarantees chaos.
		{
			let n = 0;
			let j = 0;
			let summon;

			for( let i = 0; i < 8; i++)
			{
				summon = true;
				j = ~~( Math.random() * 12 );
				if ( j !== 12 ) // Prevent the game from summoning more obelisks by using obelisks
				if ( sdWeather.only_instance._daily_events.length > 0 )
				for( let i = 0; i < sdWeather.only_instance._daily_events.length; i++)
				{
					n = sdWeather.only_instance._daily_events[ i ];
					if ( j === n )
					summon = false;
				}
				if ( summon === true )
				sdWeather.only_instance.ExecuteEvent({
					event: j
				});
			}
			color = '#FF0000';
		}
		if ( this.type === 7 ) // Obelisk which holds artifact, is destroyed and artifact can be extracted to mothership as a task.
		{
			let artifact = new sdJunk({ x: this.x, y: this.y + 4, type: sdJunk.TYPE_ALIEN_ARTIFACT });
			sdEntity.entities.push( artifact );
			color = '#880000';
		}
		if ( this.type === 8 ) // A larger obelisk which summons 10 events of same type. ( 10 x cubes, 10x asp event, for example )
		{
			let j;
			j = ~~( Math.random() * sdWeather.supported_events.length );
			for( let i = 0; i < 10; i++ )
			{
				sdWeather.only_instance.ExecuteEvent({
					event: j
				});
			}
			color = '#FF8800';
		}
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:48,
			damage_scale: 0.01, // Just a decoration effect
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this,
			color:color
		});
		
		const zap = sdWorld.GetAnythingNear( this.x, this.y ,96 );
		
		for ( let i = 0; i < zap.length; i++ )
		{
			let e = zap[ i ];
			if ( !e._is_being_removed )
			{
				if ( Math.random() < 0.25 && e.GetClass() === 'sdBlock' || e.GetClass() === 'sdDoor' )
				{
					sdCrystal.Zap( this, e, color );
				}
			}
		}
		
		this.remove();
	}
	constructor( params )
	{
		super( params );
		
		sdObelisk.obelisks_counter++;


		this.sx = 0;
		this.sy = 0;

		this._hmax = 2000;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		//this.matter_max = 1000;
		//this.matter = 1000;
		this.type = params.type || 1;

		this.glow_animation = 0; // Glow animation for the obelisk
		this._glow_fade = 0; // Should the glow fade or not?

		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );

		if ( this._glow_fade === 0 )
		{
			if ( this.glow_animation < 60 )
			this.glow_animation =  Math.min( this.glow_animation + GSPEED, 60 );
			else
			this._glow_fade = 1;
		}
		else
		{
			if ( this.glow_animation > 0 )
			this.glow_animation = Math.max( this.glow_animation - GSPEED, 0 );
			else
			this._glow_fade = 0;
		}
	}
	get title()
	{
		return 'Obelisk';
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		if ( !sdShop.isDrawing ) // Some subtle randomness atleast
		{
			let inversion = this._net_id % 2 === 0 ? 1 : -1;
			ctx.scale( inversion, 1 );
		}
		
		if ( this.type === 1 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk, 0, 0, 32, 64, - 16, - 32, 32, 64 ); // Regular obelisk sprite
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 6px #FFFFFF)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk, 32, 0, 32, 64, - 16, - 32, 32, 64 ); // Obelisk glow
		}

		if ( this.type === 2 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk, 0, 0, 32, 64, - 16, - 32, 32, 64 ); // Regular obelisk sprite
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 6px #FFFFFF)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk, 64, 0, 32, 64, - 16, - 32, 32, 64 ); // Obelisk glow
		}

		if ( this.type === 3 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk, 0, 0, 32, 64, - 16, - 32, 32, 64 ); // Regular obelisk sprite
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 6px #FFFFFF)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk, 96, 0, 32, 64, - 16, - 32, 32, 64 );
		}

		if ( this.type === 4 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk4, 0, 0, 64, 128, - 32, - 64, 64, 128 );
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 12px #FFFFFF)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk4, 64, 0, 64, 128, - 32, - 64, 64, 128 );
		}

		if ( this.type === 5 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk5, 0, 0, 64, 128, - 32, - 64, 64, 128 );
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 6px #0000C8)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk5, 64, 0, 64, 128, - 32, - 64, 64, 128 );
		}

		if ( this.type === 6 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk6, 0, 0, 64, 128, - 32, - 64, 64, 128 );
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 12px #C80000)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk6, 64, 0, 64, 128, - 32, - 64, 64, 128 );
		}

		if ( this.type === 7 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk7, 0, 0, 64, 128, - 32, - 64, 64, 128 );
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 6px #5a7254)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk7, 64, 0, 64, 128, - 32, - 64, 64, 128 );
		}

		if ( this.type === 8 )
		{
			ctx.drawImageFilterCache( sdObelisk.img_obelisk8, 0, 0, 64, 128, - 32, - 64, 64, 128 );
			ctx.globalAlpha = this.glow_animation / 60;
			ctx.filter = ' drop-shadow(0px 0px 12px #ff8c00)';
			ctx.drawImageFilterCache( sdObelisk.img_obelisk8, 64, 0, 64, 128, - 32, - 64, 64, 128 );
		}

		ctx.filter = 'none';
		ctx.globalAlpha = 1;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Obelisk" );
	}
	
	onRemove() // Class-specific, if needed
	{
		
		sdObelisk.obelisks_counter--;


		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		//this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'ACT' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
				{
					this.ActivateObelisk();
				}
				else
				executer_socket.SDServiceMessage( 'Obelisk is too far' );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			this.AddContextOption( 'Activate obelisk', 'ACT', [] );
		}
	}
}
//sdObelisk.init_class();

export default sdObelisk;
