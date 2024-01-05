
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';

class sdMatterContainer extends sdEntity
{
	static init_class()
	{
		sdMatterContainer.img_matter_container = sdWorld.CreateImageFromFile( 'matter_container' );
		sdMatterContainer.img_matter_container_empty = sdWorld.CreateImageFromFile( 'matter_container_empty' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -10; }
	get hitbox_x2() { return 10; }
	get hitbox_y1() { return -14; }
	get hitbox_y2() { return 14; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	RequireSpawnAlign()
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		//this.matter_max = params.matter_max || 640;
		this.matter_max = params.matter_max || 2048;
		
		//this.matter = this.matter_max;
		this.matter = 0;
		
		this._last_sync_matter = this.matter;
		
		this._hmax = 400 * 4;
		this._hea = this._hmax;
		
		this._regen_timeout = 0;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		this.remove();
	
		this._regen_timeout = 60;
		
		this._update_version++; // Just in case
	}
	
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return true;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		// No regen, just give away matter
		//this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
			}
		}
		
		this.MatterGlow( 0.01, 50, GSPEED );
		
		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T("Matter container") + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )" );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		ctx.drawImageFilterCache( sdMatterContainer.img_matter_container_empty, - 32, - 32, 64, 64 );
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max / 2 );
	
		ctx.globalAlpha = sdShop.isDrawing ? 1 : this.matter / this.matter_max;
		
		ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, - 32, - 32, 64, 64 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

			sdWorld.DropShards( this.x, this.y, 0, 0, 
				Math.floor( Math.max( 0, this.matter / this.matter_max * 80 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 80,
				10
			);

			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
	}
	
	MeasureMatterCost()
	{
	//	return 0; // Hack
		
		//return this._hmax * sdWorld.damage_to_matter + this.matter;
		if ( this.matter_max == 2560 * 2 || this.matter_max == 5120 * 2 || this.matter_max == 10240 * 2 || this.matter_max == 20480 * 2 )
		return this._hmax * sdWorld.damage_to_matter + this.matter_max * 0.05;
		if ( this.matter_max == 40960 * 2 )
		return this._hmax * sdWorld.damage_to_matter + this.matter_max * 0.0275;
	}
}
//sdMatterContainer.init_class();

export default sdMatterContainer;