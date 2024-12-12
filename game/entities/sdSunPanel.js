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
		sdSunPanel.img_sun_panel2 = sdWorld.CreateImageFromFile( 'sunpanel2' );
		sdSunPanel.img_sun_panel3 = sdWorld.CreateImageFromFile( 'sunpanel3' );
		sdSunPanel.img_sun_panel4 = sdWorld.CreateImageFromFile( 'sunpanel4' );
		sdSunPanel.img_sun_panel5 = sdWorld.CreateImageFromFile( 'sunpanel5' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( this.multiplier === 20 ) ? -16 : -5; }
	get hitbox_x2() { return  ( this.multiplier === 20 ) ? 16 : 7; }
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
	get description()
	{
		return `It is renewable unlike crystals and matter amplifiers. You can use these to provide small amount of matter to your base equipment by wiring them with cable management tool (slot 7).`;
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
				sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.25, pitch: 0.6 });
				this.remove();
			}
			
			this.dirt = 0;
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 150 * 4; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;

		this.multiplier = params.multiplier || 1; // New solar panels, yay!
		//this.UpdatePropertiesDueToUpgrade();
		this._matter = 0;
		this._matter_max = 20; // Don't go over 20 matter, that way it will not hoard matter
		
		this.dirt = 0;
		
		this._next_trace_rethink = 0;
		this._sun_reaches = false;
	}
	UpdatePropertiesDueToUpgrade()
	{
		//this._hmax = ( 150 + ( 50 * this.multiplier ) ) * 4; // Regular panel amplifier has 150 hp
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
				
				if ( this._matter_max > 20 )
				{
					this._matter_max = 20;
					this._update_version++;
				}
			}

			if ( this.dirt <= 1 )
			{
				this.dirt += GSPEED * ( 0.00001 / this.multiplier ); // Higher tiers should recieve dirt slower?

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
				this._matter = Math.min( this._matter_max, this._matter + GSPEED * 0.001 * 1000 / 80 * sun_intensity * this.multiplier );
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
		let xx = this.dirt >= 1 ? 1 : 0;
		if ( this.multiplier === 1 )
		{
			ctx.drawImageFilterCache( sdSunPanel.img_sun_panel, xx * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		}
		if ( this.multiplier === 2 )
		{
			ctx.drawImageFilterCache( sdSunPanel.img_sun_panel2, xx * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		}
		if ( this.multiplier === 4 )
		{
			ctx.drawImageFilterCache( sdSunPanel.img_sun_panel3, xx * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		}
		if ( this.multiplier === 8 )
		{
			ctx.drawImageFilterCache( sdSunPanel.img_sun_panel4, xx * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		}
		if ( this.multiplier === 20 )
		{
			ctx.drawImageFilterCache( sdSunPanel.img_sun_panel5, xx * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		}
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( parameters_array instanceof Array )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			{
				if ( command_name === 'UPGRADE' || command_name === 'UPGRADE_MAX' )
				{
					let upgraded = false;
					let can_upgrade = true;
					
					for ( let tr = ( command_name === 'UPGRADE' ) ? 1 : 10; tr > 0; tr-- )
					{
						let best_option = null;

						for ( let i = 0; i < sdShop.options.length; i++ )
						{
							let option = sdShop.options[ i ];
							if ( option._class === this.GetClass() )
							{
								if ( option.multiplier !== undefined )
								if ( option.multiplier > this.multiplier && ( !best_option || option.multiplier < best_option.multiplier ) )
								if ( exectuter_character.build_tool_level >= ( option._min_build_tool_level || 0 ) )
								best_option = option;
							}
						}

						if ( best_option && best_option.multiplier < 20 ) // Prevent T4 solars to upgrading into T5/wide panels
						{
							let cost_this = this.MeasureMatterCost();
							let multiplier_old = this.multiplier;

							this.multiplier = best_option.multiplier;
							//this.UpdatePropertiesDueToUpgrade();

							let cost_new = this.MeasureMatterCost();

							let cost = ~~( cost_new - cost_this + 100 );

							if ( exectuter_character.matter >= cost )
							{
								exectuter_character.matter -= cost;
								
								this._update_version++;
								this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
								
								upgraded = true;
							}
							else
							{
								this.multiplier = multiplier_old;
								this.UpdatePropertiesDueToUpgrade();
								
								can_upgrade = false;

								executer_socket.SDServiceMessage( 'Not enough matter. Upgrade costs ' + cost + ' matter' );
								break;
							}
						}
						else
						{
							break;
						}
					}
					
					if ( upgraded )
					sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });
					else
					if ( can_upgrade )
					executer_socket.SDServiceMessage( 'No upgrades available' );
				}
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
			this.AddContextOption( 'Upgrade tier', 'UPGRADE', [] );
			this.AddContextOption( 'Upgrade tier to max', 'UPGRADE_MAX', [] );
		}
	}
	MeasureMatterCost()
	{
		return 100 * this.multiplier;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}
//sdSunPanel.init_class();

export default sdSunPanel;