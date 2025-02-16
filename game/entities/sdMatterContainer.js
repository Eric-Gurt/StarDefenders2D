
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
		
		sdMatterContainer.MODE_EQUALIZE = 0;
		sdMatterContainer.MODE_COLLECT = 1;
		sdMatterContainer.MODE_RELEASE = 2;
		
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
		
		this.mode = sdMatterContainer.MODE_EQUALIZE;
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
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		
		if ( this.mode === sdMatterContainer.MODE_EQUALIZE )
		this.MatterGlow( 0.01, 50, GSPEED );
	
		if ( this.mode === sdMatterContainer.MODE_RELEASE )
		this.MatterGlow( 0.3, 50, GSPEED );
		
		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}
	}
	get title()
	{
		return 'Matter container';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )" );
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
		if ( this.matter_max === 2560 * 2 || this.matter_max === 5120 * 2 || this.matter_max === 10240 * 2 || this.matter_max === 20480 * 2 )
		return this._hmax * sdWorld.damage_to_matter + this.matter_max * 0.05;
		if ( this.matter_max === 40960 * 2 )
		return this._hmax * sdWorld.damage_to_matter + this.matter_max * 0.0275;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( this.inRealDist2DToEntity_Boolean( exectuter_character, 64 ) && executer_socket.character.canSeeForUse( this ) )
			{
				if ( command_name === 'MODE' )
				{
					if ( parameters_array[ 0 ] === 0 || parameters_array[ 0 ] === 1 || parameters_array[ 0 ] === 2 )
					{
						this.mode = parameters_array[ 0 ];
						this._update_version++;
					}
				}
			}
			else
			executer_socket.SDServiceMessage( 'Matter container is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( exectuter_character._god || this.inRealDist2DToEntity_Boolean( exectuter_character, 64 ) )
		{
			let active_mode_text = ' ( ' + T( 'active' ) + ' )';
			this.AddContextOptionNoTranslation( T( 'Set mode to Equalize' ) + (( this.mode === 0 ) ? active_mode_text : ''), 'MODE', [ 0 ] );
			this.AddContextOptionNoTranslation( T( 'Set mode to Collect' ) + (( this.mode === 1 ) ? active_mode_text : ''), 'MODE', [ 1 ] );
			this.AddContextOptionNoTranslation( T( 'Set mode to Release' ) + (( this.mode === 2 ) ? active_mode_text : ''), 'MODE', [ 2 ] );
		}
	}
}
//sdMatterContainer.init_class();

export default sdMatterContainer;