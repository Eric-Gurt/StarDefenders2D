
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdCom from './sdCom.js';
import sdGun from './sdGun.js';

class sdMatterMatrix extends sdEntity
{
	static init_class()
	{
		sdMatterMatrix.img_matrix = sdWorld.CreateImageFromFile( 'sdMatterMatrix' );
		
		sdMatterMatrix.relative_regen_amplification = 5 * 8; // Same as T4 amplifier
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -15.5; }
	get hitbox_x2() { return 15.5; }
	get hitbox_y1() { return -15.5; }
	get hitbox_y2() { return 15.5; }
	
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	/*
		This entity was created to let players make them as their base's main matter generators.
		It can be charged up by feeding it crystals, exatcly how green BSU works.
		After that, it starts generating matter until it runs out of matter, and requires feeding again.
		Goal is to reduce general matter amplifier and crystal count required in bases, aswell as server by using these.
		Requires 5 task rewards to claim.
	*/
	
	constructor( params )
	{
		super( params );
		
		this.matter_max = 5120 * 16;
		this.matter = 0;
		
		this.matter_regen = 5; // Charge/regen speed, start at 5% charge. Can go up to 1000% ( 5120 * 16 * 10 )
		// Displays 10x less charge value to prevent confusion.
		
		this._time_amplification = 0;
		
		this._last_amplification_until = 0; // Overcharge mode for matter-based BSUs whenever they are in beeping state
		
		this._last_sync_matter = this.matter;
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 6000;
		this.hea = this.hmax;
		
		this.charge_time_left = 0; // Time it takes to re-active/charge up when fed a crystal. Should be on par with basic crystal combiner, slower than others.
		
		this._regen_timeout = 0;
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this.hea -= dmg;
		
		if ( this.hea <= 0 )
		{
			this.remove();
		}
	
		this._regen_timeout = 60;
		
		//this._update_version++; // Just in case
	}
	
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return true;
	}
	
	get mass() { return 70; } // Should probably be somewhat moveable
	
	get max_matter_regen()
	{
		return 1000;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		
		this.sy += sdWorld.gravity * GSPEED;
		
		let GSPEED_scaled = sdGun.HandleTimeAmplification( this, GSPEED ); // Area amplifier
		
		this.MatterGlow( 0.01, 50, GSPEED_scaled );
		
		if ( this.charge_time_left > 0 )
		{
			this.charge_time_left = Math.max( 0, this.charge_time_left - GSPEED_scaled );
			if ( this.charge_time_left === 0 )
			sdSound.PlaySound({ name:'crystal_combiner_end', x:this.x, y:this.y, pitch:0.9, volume:1 });
		}
		else
		{
			// Regular "emit matter" logic
			
			if ( sdWorld.time < this._last_amplification_until )
			GSPEED_scaled *= 10000;
			
			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED_scaled;
			else
			if ( this.hea < this.hmax )
			this.hea = Math.min( this.hea + GSPEED_scaled, this.hmax );
			
			// Matter regeneration
			let matter_before_regen = this.matter;
			
			if ( this.matter_regen > 0 )
			{
				this.matter = Math.min( this.matter_max, this.matter + GSPEED_scaled * 0.001 * this.matter_max / 80 * ( this.matter_regen / sdCrystal.recharges_until_depleated ) * sdMatterMatrix.relative_regen_amplification );

				if ( sdWorld.server_config.crystal_matter_regen_decrease )
				this.matter_regen = Math.max( 0, this.matter_regen - ( this.matter - matter_before_regen ) / this.matter_max );
			}
		}
		
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}
		*/
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}

	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;

		if ( from_entity.is( sdCrystal ) && !from_entity.is_anticrystal )
		if ( from_entity.held_by === null && from_entity.type !== 2 && from_entity.type !== 6 ) // Prevent crystals which are stored in a crate
		{
			if ( !from_entity._is_being_removed ) // One per sdMatterMatrix, also prevent occasional sound flood
			{
				sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2, pitch:2 });
				
				let matter_to_feed = from_entity.matter_max * ( from_entity.matter_regen / 100 );
				if ( matter_to_feed > 0 )
				{
					this.matter_regen = Math.min( this.max_matter_regen , this.matter_regen + 100 * ( matter_to_feed / ( 5120 * 16 ) ) );
					
					// Add charge time. It should incentivize combining via crystal combiner for higher crystals.
					if ( matter_to_feed > 2560 ) // Generally above 2.5k's should take some to charge it up.
					{
						let charge_time = 30;
						charge_time = Math.max( 30, 30 + ( 30 * 10 * ( 5120 * 16 ) / matter_to_feed ) );
						charge_time += Math.sqrt( matter_to_feed, 2 );
						
						if ( this.charge_time_left === 0 )
						sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, pitch:0.9, volume:1 });
						
						// Some time reduction if it's charging a bit
						if ( this.charge_time_left > charge_time * 4 )
						charge_time = charge_time / 4;
						else
						if ( this.charge_time_left > charge_time * 2 )
						charge_time = charge_time / 2;
					
						this.charge_time_left += charge_time;
					}
					//this._update_version++;
					from_entity.remove();
				}
			}
		}
	}
	
	get title()
	{
		return 'Matter generation matrix';
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.matter_regen > 1 )
		sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " ) (matter regeneration rate: " + Math.max(1, Math.round( this.matter_regen / 10 ) ) + "%)", 0, -20 );
		else
		sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " ) (matter regeneration rate: " + Math.round( this.matter_regen ) + "%)", 0, -20 );
	
		if ( this.matter_regen < 100 && this.charge_time_left <= 0 ) // Under "10%"? Display it requires charging by putting in crystals
		sdEntity.TooltipUntranslated( ctx, "Requires charging by putting crystals inside", 0, -12, '#ff0000'  );
		
		if ( this.charge_time_left > 0 ) // Charging after crystal feeding?
		{
			let minutes = Math.floor( this.charge_time_left / ( 60 * 30 ) );
			let seconds = Math.round( ( this.charge_time_left % ( 60 * 30 ) ) / 30 );
			if ( minutes > 0 )
			sdEntity.TooltipUntranslated( ctx, "Charging (" + minutes + " minutes, " + seconds + " seconds left)", 0, -12 );
			else
			sdEntity.TooltipUntranslated( ctx, "Charging (" + seconds + " seconds left)", 0, -12 );
		}
		
		let w = 40;
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 32, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 32, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		
		if ( this.progress < 100 )
		{
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 28, w, 3 );
			
			ctx.fillStyle = '#aabbff';
			ctx.fillRect( 1 - w / 2, 1 - 28, ( w - 2 ) * Math.max( 0, this.progress / 100 ), 1 );
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		let xx = 0;
		
		
		ctx.drawImageFilterCache( sdMatterMatrix.img_matrix, xx * 64, 0, 64, 64, -32, -32, 64, 64 );
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( -1 ); // White
	
		ctx.globalAlpha = sdShop.isDrawing ? 1 : this.matter / this.matter_max;
		
		xx = 1;
		
		ctx.drawImageFilterCache( sdMatterMatrix.img_matrix, xx * 64, 0, 64, 64, -32, -32, 64, 64 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		//this.onRemoveAsFakeEntity();
		
		if ( this._broken )
		{
			/*sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

			sdWorld.DropShards( this.x, this.y, 0, 0, 
				Math.floor( Math.max( 0, this.matter / this.matter_max * 80 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 80,
				10
			);*/

			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
	}
	
	/*MeasureMatterCost()
	{
		return Infinity; // Hack
	}
	*/
}
//sdMatterMatrix.init_class();

export default sdMatterMatrix;