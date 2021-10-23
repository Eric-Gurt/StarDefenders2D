import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdWeather from './sdWeather.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';


import sdRenderer from '../client/sdRenderer.js';


class sdObelisk extends sdEntity
{
	static init_class()
	{
		sdObelisk.img_obelisk1 = sdWorld.CreateImageFromFile( 'obelisk1' );
		sdObelisk.img_obelisk2 = sdWorld.CreateImageFromFile( 'obelisk2' );
		sdObelisk.img_obelisk3 = sdWorld.CreateImageFromFile( 'obelisk3' );
		sdObelisk.img_obelisk4 = sdWorld.CreateImageFromFile( 'obelisk4' );


		sdObelisk.obelisks_counter = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === 4 ? -8 : -5; }
	get hitbox_x2() { return this.type === 4 ? 8 : 5; }
	get hitbox_y1() { return this.type === 4 ? - 24 : -12; }
	get hitbox_y2() { return this.type === 4 ? 32 : 16; }
	
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
		
		if ( this.hea > 0 )
		{
			this.hea -= dmg;

			if ( this.hea <= 0 )
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
		if ( this.type === 1 )
		sdWeather.only_instance._quake_scheduled_amount = 30 * 90; // Earthquake for 90 seconds

		if ( this.type === 2 )
		sdWeather.only_instance._rain_amount = 30 * 60; // Start raining for 60 seconds

		if ( this.type === 3 )
		sdWeather.only_instance._asteroid_spam_amount = 30 * 60; // Meteors for 60 seconds

		if ( this.type === 4 ) // A larger obelisk which is the combination of all 3 above
		{
			sdWeather.only_instance._quake_scheduled_amount = 30 * 90; // Earthquake for 90 seconds
			sdWeather.only_instance._rain_amount = 30 * 60; // Start raining for 60 seconds
			sdWeather.only_instance._asteroid_spam_amount = 30 * 60; // Meteors for 60 seconds
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

		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
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
		if ( this.type === 1 )
		{
		ctx.drawImageFilterCache( sdObelisk.img_obelisk1, 0, 0, 32, 64, - 16, - 32, 32, 64 ); // Regular obelisk sprite
		ctx.globalAlpha = this.glow_animation / 60;
		ctx.filter = ' drop-shadow(0px 0px 6px #FFFFFF)';
		ctx.drawImageFilterCache( sdObelisk.img_obelisk1, 32, 0, 32, 64, - 16, - 32, 32, 64 ); // Obelisk glow
		}

		if ( this.type === 2 )
		{
		ctx.drawImageFilterCache( sdObelisk.img_obelisk2, 0, 0, 32, 64, - 16, - 32, 32, 64 ); // Regular obelisk sprite
		ctx.globalAlpha = this.glow_animation / 60;
		ctx.filter = ' drop-shadow(0px 0px 6px #FFFFFF)';
		ctx.drawImageFilterCache( sdObelisk.img_obelisk2, 32, 0, 32, 64, - 16, - 32, 32, 64 ); // Obelisk glow
		}

		if ( this.type === 3 )
		{
		ctx.drawImageFilterCache( sdObelisk.img_obelisk3, 0, 0, 32, 64, - 16, - 32, 32, 64 ); // Regular obelisk sprite
		ctx.globalAlpha = this.glow_animation / 60;
		ctx.filter = ' drop-shadow(0px 0px 6px #FFFFFF)';
		ctx.drawImageFilterCache( sdObelisk.img_obelisk3, 32, 0, 32, 64, - 16, - 32, 32, 64 ); // Obelisk glow
		}

		if ( this.type === 4 )
		{
		ctx.drawImageFilterCache( sdObelisk.img_obelisk4, 0, 0, 64, 128, - 32, - 64, 64, 128 ); // Regular obelisk sprite
		ctx.globalAlpha = this.glow_animation / 60;
		ctx.filter = ' drop-shadow(0px 0px 12px #FFFFFF)';
		ctx.drawImageFilterCache( sdObelisk.img_obelisk4, 64, 0, 64, 128, - 32, - 64, 64, 128 ); // Obelisk glow
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
					if ( this._hea >= this._hmax )
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
			if ( this._hea >= this._hmax )
			this.AddContextOption( 'Activate obelisk', 'ACT', [] );
		}
	}
}
//sdObelisk.init_class();

export default sdObelisk;
