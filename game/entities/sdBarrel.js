
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';

class sdBarrel extends sdEntity
{
	static init_class()
	{
		sdBarrel.img_barrel = sdWorld.CreateImageFromFile( 'barrel_y' ); // Sprite image by PeacyQuack, slightly edited by Booraz149
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -8; }
	get hitbox_y2() { return 8; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hea = 70;
		this.filter = params.filter || 'none';
		this.variation = params._variation || 0;
		this._owner = null;
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.Damage( ( vel - 4 ) * 5 );
		}
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		let old_hp = this.hea;
	
		this.hea -= dmg;
		
		if ( this.hea <= 0 )
		if ( old_hp > 0 )
		{
			this.remove();
		}
	}
	Impulse( x, y )
	{
		this.sx += x * 0.03;
		this.sy += y * 0.03;
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea > 0 )
		sdEntity.Tooltip( ctx, "Barrel" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		ctx.drawImageFilterCache( sdBarrel.img_barrel, -16, -16 );
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		// Explosion
		if ( this._broken )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:30 + 5 * ( this.variation ) , // 70 was too much?
			damage_scale: 9 * (1 + this.variation ) * ( this._owner ? this._owner._damage_mult : 1 ), // 5 was too deadly on relatively far range
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this._owner,
			armor_penetration_level: this._owner ? this._owner._upgrade_counters[ 'upgrade_damage' ] : undefined,
			color:sdEffect.default_explosion_color 
		});
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		return 125;
		//return this.hmax * sdWorld.damage_to_matter + 50;
	}
}
//sdBarrel.init_class();

export default sdBarrel;