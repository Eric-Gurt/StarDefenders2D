
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';

import sdRenderer from '../client/sdRenderer.js';


class sdGrass extends sdEntity
{
	static init_class()
	{
		sdGrass.img_grass = sdWorld.CreateImageFromFile( 'grass' );
		sdGrass.img_grass2 = sdWorld.CreateImageFromFile( 'grass2' ); // sprite by LazyRain
		sdGrass.img_grass3 = sdWorld.CreateImageFromFile( 'grass3' ); // sprite by LazyRain
		
		sdGrass.heights = [ 8, 14, 27 ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return ( 16 - sdGrass.heights[ this.variation ] ) || 0; }
	get hitbox_y2() { return 16; }
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_GRASS; }
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Grow()
	{
		if ( this.variation < 2 )
		{
			this.variation++;
			this._update_version++;
		}
	}
	Damage( dmg, initiator=null ) // Case of lava damage?
	{
		if ( !sdWorld.is_server )
		return;
		
		this.remove();
	}
	
	constructor( params )
	{
		super( params );
		
		this.variation = 0; // grass variation

		/*this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdGrass.MATERIAL_PLATFORMS;
		*/
		this.filter = params.filter || '';
		
		//this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
	}
	MeasureMatterCost()
	{
		return 0;
		//return this.width / 16 * this.height / 16;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	DrawFG( ctx, attached )
	{
		var w = 16;
		var h = 16;
		
		if ( sdWorld.my_entity )
		{
			if ( sdWorld.my_entity.look_x >= this.x )
			if ( sdWorld.my_entity.look_x < this.x + 16 )
			if ( sdWorld.my_entity.look_y >= this.y + this.hitbox_y1 )
			if ( sdWorld.my_entity.look_y < this.y + 16 )
			ctx.globalAlpha = 0.15;
		}
		
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		if ( this.variation === 0 )
		{
			ctx.drawImageFilterCache( sdGrass.img_grass, 0, 0, w,h, 0, 0, w, h );
		}
		else
		if ( this.variation === 1 )
		{
			ctx.drawImageFilterCache( sdGrass.img_grass2, 0, 0, w,h, 0, 0, w, h );
		}
		else
		if ( this.variation === 2 )
		{
			h = 32;
			ctx.drawImageFilterCache( sdGrass.img_grass3, 0, 0, w,h, 0, -16, w, h );
		}
		
		ctx.filter = 'none';
	}
}
//sdGrass.init_class();

export default sdGrass;