
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdStorage from './sdStorage.js';

class sdCrystal extends sdEntity
{
	static init_class()
	{
		sdCrystal.img_crystal = sdWorld.CreateImageFromFile( 'crystal' );
		sdCrystal.img_crystal_empty = sdWorld.CreateImageFromFile( 'crystal_empty' );

		sdCrystal.img_crystal_cluster = sdWorld.CreateImageFromFile( 'crystal_cluster' ); // Sprite by HastySnow / LazyRain
		sdCrystal.img_crystal_cluster_empty = sdWorld.CreateImageFromFile( 'crystal_cluster_empty' ); // Sprite by HastySnow / LazyRain
		
		sdCrystal.anticrystal_value = 10240;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.should_draw === 0 ? -2 : this.type === 2 ? -14 : -4; }
	get hitbox_x2() { return this.should_draw === 0 ? 2 : this.type === 2 ? 14 : 5; }
	get hitbox_y1() { return this.should_draw === 0 ? -2 : this.type === 2 ? -14 : -7; }
	get hitbox_y2() { return this.should_draw === 0 ? 2 : this.type === 2 ? 16 : 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this._held_by !== null ? false : true; }
	
	/* Causes client-side falling through unsynced ground, probably bad thing to do and it won't be complex entity after sdSnapPack is added
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }*/
	
	get title()
	{
		return 'Crystal';
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		this.type = params.type || 1;
		this.matter_max = this.type === 2 ? 160 : 40;

		this._held_by = null; // For storage crates
		this.should_draw = 1; // For storage crates, guns have ttl which can make them dissapear
		
		let bad_luck = 1.45; // High value crystals are more rare if this value is high
		
		let r = 1 - Math.pow( Math.random(), bad_luck );
		//let r = Math.random();
		
		//r = 0; // Hack
		
		if ( r < ( 0.00390625 * 0.75 ) && params.tag === 'deep' ) // matter consuming crystal
		this.matter_max *= 256;
		else
		if ( r < ( 0.0078125 * 0.75 ) && params.tag === 'deep' ) // glowing, new
		this.matter_max *= 128;
		else
		if ( r < ( 0.015625 * 0.75 ) && params.tag === 'deep' ) // Red, new
		this.matter_max *= 64;
		else
		if ( r < ( 0.03125 * 1.25 ) && params.tag === 'deep' ) // Pink variation, new (old red)
		this.matter_max *= 32;
		else
		if ( r < ( 0.0625 * 1.25 ) )
		this.matter_max *= 16;
		else
		if ( r < ( 0.125 * 1.25 ) )
		this.matter_max *= 8;
		else
		if ( r < ( 0.25 * 1.25 ) )
		this.matter_max *= 4;
		else
		if ( r < ( 0.5 * 1.25 ) )
		this.matter_max *= 2;
		
		this._last_damage = 0; // Sound flood prevention
		
		if ( typeof params.matter_max !== 'undefined' )
		this.matter_max = params.matter_max;
	
		if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type === 1 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
		{
			this.matter = 0;
			this._hea = 600;
			this._damagable_in = 0;
		}
		else
		{
			this.matter = this.matter_max;
			this._hea = this.type === 2 ? 600 : 60;
			this._damagable_in = sdWorld.time + 1000; // Suggested by zimmermannliam, will only work for sdCharacter damage		
		}
		
	}

	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdLifeBox' ];
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this._held_by !== null )
		return;
	
		//if ( initiator !== null )
		if ( initiator === null || initiator.IsPlayerClass() )
		if ( sdWorld.time < this._damagable_in )
		if ( !( initiator && initiator.IsPlayerClass() && initiator.power_ef > 0 ) )
		{
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });
			return;
		}
		
		dmg = Math.abs( dmg );
		
		let was_alive = ( this._hea > 0 );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		{
			if ( was_alive )
			{
				//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:1 });
				sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.5 });
				if ( this.type === 1 ) // Default crystal
				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
					Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					this.matter_max / 40,
					5
				);
				if ( this.type === 2 ) // Big crystals
				{
					sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
						Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
						this.matter_max / 160,
						8
					);

					let ent = new sdCrystal({x: this.x, y: this.y + 4, sx: this.sx, sy: this.sy, type:1 });

					ent.matter_max = this.matter_max / 4;
					ent.matter = this.matter / 4;

					sdEntity.entities.push( ent );
					sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible
				}

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
	
	get mass() { return this.type === 2 ? 120 : 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	IsVisible( observer_character ) // Can be used to hide crystals that are held by crates
	{
		if ( this._held_by === null )
		return true;
		else
		{
			if ( this._held_by.is( sdStorage ) )
			{
				if ( observer_character )
				if ( sdWorld.inDist2D_Boolean( observer_character.x, observer_character.y, this.x, this.y, sdStorage.access_range ) )
				return true;
			}
			/*else
			if ( this._held_by.is( sdCharacter ) )
			{
				// Because in else case B key won't work
				//if ( sdGun.classes[ this.class ].is_build_gun ) Maybe it should always work better if player will know info about all of his guns. Probably that will be later used in interface anyway
				if ( this._held_by === observer_character )
				return true;
		
				if ( !this._held_by.ghosting || this._held_by.IsVisible( observer_character ) )
				if ( !this._held_by.driver_of )
				{
					return ( this._held_by.gun_slot === sdGun.classes[ this.class ].slot );
				}
			}*/
		}
		
		return false;
	}
	UpdateHeldPosition()
	{
		if ( this._held_by ) // Should not happen but just in case
		{
			let old_x = this.x;
			let old_y = this.y;
			
			this.x = this._held_by.x;
			this.y = this._held_by.y;

			if ( typeof this._held_by.sx !== 'undefined' )
			{
				this.sx = this._held_by.sx;
				this.sy = this._held_by.sy;
				
				if ( isNaN( this.sx ) )
				{
					console.log( 'Entity with corrupted velocity: ', this._held_by );
					throw new Error('sdCrystal is held by entity with .sx as NaN');
				}
			}

			if ( this.x !== old_x || this.y !== old_y )
			sdWorld.UpdateHashPosition( this, false, false );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.matter_max === sdCrystal.anticrystal_value )
		GSPEED *= 0.25;
			
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		if ( this._held_by === null ) // Don't emit matter if inside a crate
		{
			if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type === 1 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
			{
				this.HungryMatterGlow( 0.01, 100, GSPEED );
				this.matter = Math.max( 0, this.matter - GSPEED * 0.01 * this.matter );
			}
			else
			{
				this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
				this.MatterGlow( 0.01, 30, GSPEED );
			}
		}
		
		
		// Similar to sdMatterContainers but not really, since it can have consistent slight movement unlike containers
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.1 || Math.abs( this._last_sync_x - this.x ) >= 1 || Math.abs( this._last_sync_y - this.y ) >= 1 )
		{
			this._last_sync_matter = this.matter;
			this._last_sync_x = this.x;
			this._last_sync_y = this.y;
			this._update_version++;
		}*/
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.should_draw === 1 )
		{
			if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type === 1 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
			sdEntity.Tooltip( ctx, "Anti-crystal ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
			else
			sdEntity.Tooltip( ctx, "Crystal ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.should_draw === 1 )
		{
			if ( this.type === 1 )
			{
				ctx.drawImageFilterCache( sdCrystal.img_crystal_empty, - 16, - 16, 32, 32 );
		
				ctx.filter = sdWorld.GetCrystalHue( this.matter_max );

				if ( this.matter_max === sdCrystal.anticrystal_value )
				ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
				else
				ctx.globalAlpha = this.matter / this.matter_max;
		
				ctx.drawImageFilterCache( sdCrystal.img_crystal, - 16, - 16, 32, 32 );
		
				ctx.globalAlpha = 1;
				ctx.filter = 'none';
			}
			if ( this.type === 2 )
			{
				ctx.drawImageFilterCache( sdCrystal.img_crystal_cluster_empty, - 24, - 24, 48, 48 );
		
				ctx.filter = sdWorld.GetCrystalHue( this.matter_max / 4 );

				if ( this.matter_max === sdCrystal.anticrystal_value )
				ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
				else
				ctx.globalAlpha = this.matter / this.matter_max;
		
				ctx.drawImageFilterCache( sdCrystal.img_crystal_cluster, - 24, - 24, 48, 48 );
		
				ctx.globalAlpha = 1;
				ctx.filter = 'none';
			}
		}
	}
	onRemove() // Class-specific, if needed
	{
		/*if ( this._hea <= 0 ) // In else case it was just removed (not best way to check)
		{
			sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
				Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 40
			);
		}*/
	}
	MeasureMatterCost()
	{
		return 0; // Hack
		
		//return this._hmax * sdWorld.damage_to_matter + this.matter;
	}
}
//sdCrystal.init_class();

export default sdCrystal;