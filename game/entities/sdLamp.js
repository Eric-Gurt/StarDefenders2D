
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';

import sdRenderer from '../client/sdRenderer.js';


class sdLamp extends sdEntity
{
	static init_class()
	{
		sdLamp.img_lamp = sdWorld.CreateImageFromFile( 'lamp' );
		
		if ( sdWorld.is_server )
		sdLamp.lamps = null;
		else
		sdLamp.lamps = []; // Only clients need it, for visual brightness logic
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -2; }
	get hitbox_x2() { return 2; }
	get hitbox_y1() { return -2; }
	get hitbox_y2() { return 2; }
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_FLAT; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		
		this.remove();
	}
	constructor( params )
	{
		super( params );
		
		this.filter = params.filter || '';
		
		this._hea = 1; // Just so bullets react to it
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		
		if ( sdLamp.lamps )
		sdLamp.lamps.push( this );
	}
	MeasureMatterCost()
	{
		return 5;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	Draw( ctx, attached )
	//DrawBG( ctx, attached )
	{
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		ctx.drawImageFilterCache( sdLamp.img_lamp, -16, -16 );
		
		if ( typeof ctx.DrawLamp !== 'undefined' )
		{
			ctx.DrawLamp( this.x, this.y );
		}

		ctx.filter = 'none';
	}
	
	_Unlist()
	{
		if ( sdLamp.lamps )
		{
			let i = sdLamp.lamps.indexOf( this );
			if ( i !== -1 )
			sdLamp.lamps.splice( i, 1 );
		}
	}
	
	onRemove() // Class-specific, if needed
	{
		this._Unlist();
	}
	onRemoveAsFakeEntity() // Will be called instead of onRemove() if entity was never added to world
	{
		this._Unlist();
	}
}
//sdLamp.init_class();

export default sdLamp;