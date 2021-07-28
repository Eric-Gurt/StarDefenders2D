/*

	Cable connection node, does nothing, stores some amount of matter just so it can transfer it

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';


class sdNode extends sdEntity
{
	static init_class()
	{
		sdNode.img_node = sdWorld.CreateImageFromFile( 'cable_node' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return -3; }
	get hitbox_y2() { return 3; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Cable connection node';
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
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 100; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;

		this._matter = 0; // Just so it can transfer matter in cable network
		this._matter_max = 20;
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.MatterGlow( 0.1, 0, GSPEED ); // 0 radius means only towards cables
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		if ( this._matter < 0.05 || this._matter >= this._matter_max )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
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
		ctx.drawImageFilterCache( sdNode.img_node, -16, -16, 32,32 );
	}
	MeasureMatterCost()
	{
		return 5;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}
//sdNode.init_class();

export default sdNode;