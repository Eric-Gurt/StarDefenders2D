/*

	Some slow matter emission for planets without traditional matter sources. Also gets dirty all the time

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdWeather from './sdWeather.js';
import sdSound from '../sdSound.js';


class sdSunPanel extends sdEntity
{
	static init_class()
	{
		sdSunPanel.img_sun_panel = sdWorld.CreateImageFromFile( 'sunpanel' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -5; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -10; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		if ( this.dirt >= 1 )
		return 'Dirty solar panel';
		else
		return 'Solar panel';
	}
	
	//IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	//{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			{
				sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.25, pitch: 0.6 });
				this.remove();
			}
			
			this.dirt = 0;
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 50; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;

		this._matter = 0;
		this._matter_max = 20;
		
		this.dirt = 0;
		
		this._next_trace_rethink = 0;
		this._sun_reaches = false;
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			let sun_intensity = 1;

			if ( this.dirt >= 1 )
			{
				sun_intensity *= 0.25; // Some amount will be generated but only during day
			}

			sun_intensity *= sdWeather.only_instance.GetSunIntensity();

			if ( sdWorld.time > this._next_trace_rethink )
			{
				this._sun_reaches = sdWeather.only_instance.TraceDamagePossibleHere( this.x, this.y + this.hitbox_y1, Infinity, true );

				this._next_trace_rethink = sdWorld.time + 5000 + Math.random() * 10000;
			}

			if ( this.dirt <= 1 )
			{
				this.dirt += GSPEED * 0.00001;

				if ( this.dirt >= 1 )
				this._update_version++;
			}

			if ( !this._sun_reaches )
			sun_intensity = 0;
			else
			{
				if ( sdWeather.only_instance.raining_intensity > 0 )
				{
					if ( this.dirt >= 1 )
					this._update_version++;

					this.dirt = 0;
				}
			}

			if ( sun_intensity > 0.2 )
			{
				this._matter = Math.min( this._matter_max, this._matter + GSPEED * 0.001 * 1000 / 80 * sun_intensity );
				this.MatterGlow( 0.01, 50, GSPEED );
			}

			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED;
			else
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
			/*else
			if ( this._matter < 0.05 || this._matter >= this._matter_max )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );*/
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	Draw( ctx, attached )
	{
		if ( this.dirt >= 1 )
		ctx.drawImageFilterCache( sdSunPanel.img_sun_panel, 32, 0, 32, 32, - 16, - 16, 32, 32 );
		else
		ctx.drawImageFilterCache( sdSunPanel.img_sun_panel, 0, 0, 32, 32, - 16, - 16, 32, 32 );
	}
	MeasureMatterCost()
	{
		return 100;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}
//sdSunPanel.init_class();

export default sdSunPanel;