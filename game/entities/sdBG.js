
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';

import sdRenderer from '../client/sdRenderer.js';


class sdBG extends sdEntity
{
	static init_class()
	{
		sdBG.img_bg22 = sdWorld.CreateImageFromFile( 'bg' );
		sdBG.img_bg22_blue = sdWorld.CreateImageFromFile( 'bg_blue' );
		
		// Better to keep these same as in sdBlock, so 3D effects will work as intended
		sdBG.MATERIAL_PLATFORMS = 0;
		sdBG.MATERIAL_GROUND = 1;
		// 2
		sdBG.MATERIAL_PLATFORMS_COLORED = 3;
		// 4 trapshield
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.width; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.height; }
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_BOX; }
	
	get hard_collision()
	{ return true; }
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 1; }
	
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdBlock', 'sdDoor', 'sdWater', 'sdGun', 'sdCrystal', 'sdCharacter', 'sdTeleport', 'sdCom' ];
	}*/
	
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
		
		this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdBG.MATERIAL_PLATFORMS;
		
		this.filter = params.filter || '';
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
	}
	MeasureMatterCost()
	{
		return this.width / 16 * this.height / 16;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return Math.min( this.width, 16 ); };
	get spawn_align_y(){ return Math.min( this.height, 16 ); };
	
	//Draw( ctx, attached )
	DrawBG( ctx, attached )
	{
		var w = this.width;
		var h = this.height;
		
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		let lumes = sdWorld.GetClientSideGlowReceived( this.x + w / 2, this.y + h / 2, this );
		if ( lumes > 0 )
		ctx.filter = ctx.filter + 'brightness('+(1+lumes)+')';

		if ( this.material === sdBG.MATERIAL_PLATFORMS )
		ctx.drawImageFilterCache( sdBG.img_bg22, 0, 0, w,h, 0,0, w,h );
		else
		if ( this.material === sdBG.MATERIAL_PLATFORMS_COLORED )
		ctx.drawImageFilterCache( sdBG.img_bg22_blue, 0, 0, w,h, 0,0, w,h );
		else
		if ( this.material === sdBG.MATERIAL_GROUND )
		ctx.drawImageFilterCache( sdBlock.img_ground11, 0, 0, w,h, 0,0, w,h );
		else
		ctx.drawImageFilterCache( sdBG.img_bg22, 0, 0, w,h, 0,0, w,h ); // Reinforced walls etc

		ctx.filter = 'none';
	}
}
//sdBG.init_class();

export default sdBG;