/*

	Crystalized non-sdCrystal entities, as a result of being damaged by powerful weaponry, possibly ones that belong to bosses. 
	Most probably rescue teleports should not work in case of these unless updated to level 3 or something like that.

	Should be gold-colored

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdCrystal from './sdCrystal.js';

class sdLost extends sdEntity
{
	static init_class()
	{
		sdLost.entities_and_affection = new Map();
		
		sdWorld.static_think_methods.push( sdLost.StaticThink );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	static ApplyAffection( ent, amonut, bullet )
	{
		if ( ( ent.hard_collision && !ent.is( sdCrystal ) && !ent.is( sdLost ) ) || 
			 ( ent.is( sdGun ) && ent.class !== sdGun.CLASS_CRYSTAL_SHARD ) ) // Not for BG entities
		if ( ent.IsBGEntity() === 0 ) // Not for BG entities
		if ( ent.IsTargetable() )
		{
			if ( ( typeof ent._armor_protection_level === 'undefined' || bullet._armor_penetration_level >= ent._armor_protection_level ) &&
				 ( typeof ent._reinforced_level === 'undefined' || bullet._reinforced_level >= ent._reinforced_level ) )
			{
				
			}
			else
			return;
		
			
			let hea = ( ent._hea || ent.hea || 0 );
			
			ent.Damage( 1 );
			
			let hea2 = ( ent._hea || ent.hea || 0 );
			
			if ( ent._is_being_removed )
			return;
		
			let mult = hea - hea2;
			
			if ( mult < 0 )
			return;
			
			if ( mult > 1 )
			mult = 1;
		
			amonut *= mult;

			let cur_amount = sdLost.entities_and_affection.get( ent );

			if ( cur_amount === undefined )
			cur_amount = 0;

			cur_amount += amonut;

			if ( cur_amount > Math.max( ent._hea || ent.hea || 0, 50 ) )
			{
				sdLost.entities_and_affection.delete( ent );

				let ent2 = new sdLost({
					x: ent.x,
					y: ent.y,
					sx: ent.sx,
					sy: ent.sy,
					x1: ent.hitbox_x1,
					y1: ent.hitbox_y1,
					x2: ent.hitbox_x2,
					y2: ent.hitbox_y2,
					hea: ent.hea || ent._hea,
					d3d: ent.DrawIn3D(),
					mass: ent.mass,
					d: sdWorld.GetDrawOperations( ent ),
					matter_max: ent.matter || ent._matter || 1,
					s: ent.is_static
				});
				sdEntity.entities.push( ent2 );
				sdWorld.UpdateHashPosition( ent2, false ); // Optional, but will make it visible as early as possible

				ent.remove();
				ent._broken = false; // No debris
			}
			else
			{
				sdLost.entities_and_affection.set( ent, cur_amount );
			}
		}
	}
	
	static StaticThink( GSPEED )
	{
		GSPEED *= 0.1;
		sdLost.entities_and_affection.forEach( ( cur_amount, ent )=>
		{
			cur_amount -= GSPEED;
			
			if ( cur_amount <= 0 || ent._is_being_removed )
			sdLost.entities_and_affection.delete( ent );
			else
			sdLost.entities_and_affection.set( ent, cur_amount );
		});
	}
	
	get hitbox_x1() { return this.x1; }
	get hitbox_x2() { return this.x2; }
	get hitbox_y1() { return this.y1; }
	get hitbox_y2() { return this.y2; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return this.s; }
	
	DrawIn3D()
	{
		return this.d3d;
	}
	/* Causes client-side falling through unsynced ground, probably bad thing to do and it won't be complex entity after sdSnapPack is added
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }*/
	
	constructor( params )
	{
		super( params );
		
		this.x1 = params.x1 || 0;
		this.y1 = params.y1 || 0;
		this.x2 = params.x2 || 0;
		this.y2 = params.y2 || 0;
		
		this.sx = params.sx || 0;
		this.sy = params.sy || 0;
		this._matter_max = 1;
		
		this.s = params.s || false;
		
		this._last_damage = 0; // Sound flood prevention
		
		if ( typeof params.matter_max !== 'undefined' )
		this._matter_max = params.matter_max;

		this._matter = this._matter_max;
		this._hea = Math.max( ( params.hea || 1 ) * 0.2, 30 );
		
		this.d3d = params.d3d || 0;
		
		this.m = params.mass || 1;
		
		this.d = params.d || [ 1, 'death1' ];
		
		if ( this.s )
		this._update_version++;
		
		//console.log( 'this._matter_max = ',this._matter_max );
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = ( this._hea > 0 );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		{
			if ( was_alive )
			{
				//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:1 });
				sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.5 });

				sdWorld.DropShards( this.x + ( this.x2 + this.x1 ) / 2, this.y + ( this.y2 + this.y1 ) / 2, this.sx, this.sy, 
					Math.ceil( Math.min( 10, Math.max( 1, this._matter / sdWorld.crystal_shard_value ) ) ),
					//this._matter_max / 40,
					40 * 16 / 40,
					( this.x2 - this.x1 + this.y2 - this.y1 ) / 4
				);

				this.remove();
			}
		}
		else
		{
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
			}
		}
	}
	
	get mass() { return this.m; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !this.s )
		{
			this.sy += sdWorld.gravity * GSPEED;

			this.ApplyVelocityAndCollisions( GSPEED, 0, true );

			//this._matter = Math.min( this._matter_max, this._matter + GSPEED * 0.001 * this._matter_max / 80 );
			//this.MatterGlow( 0.01, 30, GSPEED );
			if ( this._phys_sleep <= 0 )
			{
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
			}
		}
		else
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	/*DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Lost" );
	}*/
	Draw( ctx, attached )
	{
		/*ctx.drawImageFilterCache( sdLost.img_crystal_empty, - 16, - 16, 32,32 );
		
		ctx.filter = sdWorld.GetCrystalHue( this._matter_max );

		if ( this._matter_max === sdLost.anticrystal_value )
		ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
		else
		ctx.globalAlpha = this._matter / this._matter_max;
		
		ctx.drawImageFilterCache( sdLost.img_crystal, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';*/
		
		ctx.filter = 'contrast(0.8) sepia(1) hue-rotate(10deg) saturate(16)';
		ctx.globalAlpha = 0.8;
		
		sdWorld.ApplyDrawOperations( ctx, this.d );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		/*if ( this._hea <= 0 ) // In else case it was just removed (not best way to check)
		{
			sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
				Math.ceil( Math.max( 5, this._matter / this._matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				this._matter_max / 40
			);
		}*/
	}
	MeasureMatterCost()
	{
		return 0; // Hack
		
		//return this._hmax * sdWorld.damage_to_matter + this._matter;
	}
}
//sdLost.init_class();

export default sdLost;