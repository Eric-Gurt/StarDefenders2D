
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdTurret from './sdTurret.js';

class sdLandMine extends sdEntity
{
	static init_class()
	{
		sdLandMine.img_landmine = sdWorld.CreateImageFromFile( 'sdLandMine' ); // Sprite by Gashadokuro
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return -1; }
	get hitbox_y2() { return 1; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hea = 40;
		this.filter = params.filter || 'none';
		this.variation = params.variation || 0;
		this._owner = null;
		
		this._color = params.color || sdEffect.default_explosion_color;
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.DamageWithEffect( ( vel - 4 ) );
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
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( observer_character === this._owner )
		return true;

		if ( observer_character )
		{
			let di = sdWorld.Dist2D( observer_character.x, observer_character.y, this.x, this.y )
			if ( di < 64 )
			return true;
		}

		return false;
	}
	Impulse( x, y )
	{
		this.sx += x * 0.03;
		this.sy += y * 0.03;
	}
	onMovementInRange( from_entity )
	{
		//if ( from_entity.GetClass() !== 'sdBG' && from_entity.GetClass() !== 'sdBlock' && from_entity.GetClass() !== 'sdDoor' &&
		//from_entity.GetClass() !== 'sdWater' && from_entity.GetClass() !== 'sdGrass' )

		/*let entity_found = false;
		let ent_class= from_entity.GetClass();
		for ( let i = 0; i < sdTurret.targetable_classes.length; i++ )
		{
			if ( ent_class === sdTurret.targetable_classes[ i ].GetClass() )
			entity_found = true;
		}*/

		let ent_sx = from_entity.sx || 0;
		let ent_sy = from_entity.sy || 0;
		if ( ent_sx + ent_sy > 0.1 )
		if ( from_entity.GetClass() !== 'sdBullet' )
		if ( from_entity.mass > 25 )
		if ( from_entity.y <= this.y )
		{
			sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.5, pitch: 1.5 });
			setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...
			this.Damage( this.hea + 1 );
			}, 150 );
		}
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
		sdEntity.Tooltip( ctx, "Land mine" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		ctx.drawImageFilterCache( sdLandMine.img_landmine, -16, -16 );
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._owner )
		if ( this._owner._is_being_removed )
		this._owner = null;
		
		// Explosion
		if ( this._broken )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:30, // 70 was too much?
			damage_scale: 7, // 5 was too deadly on relatively far range
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this._owner,
			can_hit_owner: true,
			armor_penetration_level: ( this._owner && this.variation >= 3 ) ? this._owner._upgrade_counters[ 'upgrade_damage' ] : undefined, // No-owner barrels can damage workbenches, also white barrels can too
			color: this._color 
		});
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		return 150;
		//return this.hmax * sdWorld.damage_to_matter + 50;
	}
}
//sdLandMine.init_class();

export default sdLandMine;