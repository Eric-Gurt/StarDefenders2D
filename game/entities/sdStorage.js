
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';

class sdStorage extends sdEntity
{
	static init_class()
	{
		sdStorage.img_storage = sdWorld.CreateImageFromFile( 'storage' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 6; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hea = 100;
		this._hmax = 100;
		
		this._regen_timeout = 0;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		this._regen_timeout = 60;
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	
	get mass() { return 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
			}
		}
		
		
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Storage crate (does not work yet :P )" );
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdStorage.img_storage, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
	}
	onRemove() // Class-specific, if needed
	{
		sdWorld.BasicEntityBreakEffect( this, 5 );
	}
	MeasureMatterCost()
	{
		//return 0;
		
		return this._hmax * sdWorld.damage_to_matter;
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdGun ) )
		{
			
		}
	}
}
//sdStorage.init_class();

export default sdStorage;