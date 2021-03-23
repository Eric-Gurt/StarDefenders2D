
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';

class sdCrystal extends sdEntity
{
	static init_class()
	{
		sdCrystal.img_crystal = sdWorld.CreateImageFromFile( 'crystal' );
		sdCrystal.img_crystal_empty = sdWorld.CreateImageFromFile( 'crystal_empty' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -4; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -7; }
	get hitbox_y2() { return 5; }

	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		this.matter_max = 40;
		
		let bad_luck = 1.5; // High value crystals are more rare if this value is high
		
		let r = 1 - Math.pow( Math.random(), bad_luck );
		//let r = Math.random();
		
		//r = 0; // Hack
		
		if ( r < 0.0078125 && params.tag === 'deep' ) // glowing, new
		this.matter_max *= 128;
		else
		if ( r < 0.015625 && params.tag === 'deep' ) // Red, new
		this.matter_max *= 64;
		else
		if ( r < 0.03125 && params.tag === 'deep' ) // Pink variation, new (old red)
		this.matter_max *= 32;
		else
		if ( r < 0.0625 )
		this.matter_max *= 16;
		else
		if ( r < 0.125 )
		this.matter_max *= 8;
		else
		if ( r < 0.25 )
		this.matter_max *= 4;

		else
			if (r < 0.125)
				this.matter_max *= 8;
			else
				if (r < 0.25)
					this.matter_max *= 4;
				else
					if (r < 0.5)
						this.matter_max *= 2;


		this.matter = this.matter_max;
		
		this._last_sync_matter = this.matter;
		this._last_sync_x = this.x;
		this._last_sync_y = this.y;
		
		this._hea = 60;
		
		this._damagable_in = sdWorld.time + 1000; // Suggested by zimmermannliam, will only work for sdCharacter damage
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator !== null )
		if ( initiator.GetClass() === 'sdCharacter' )
		if ( sdWorld.time < this._damagable_in )
		{
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });
			return;
		}
		
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		{
			sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:1 });

			this.remove();
		}
		else
			sdSound.PlaySound({ name: 'crystal2_short', x: this.x, y: this.y, volume: 1 });
	}
	
	get mass() { return 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}

	onThink(GSPEED) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;

		this.ApplyVelocityAndCollisions(GSPEED, 0, true);

		this.matter = Math.min(this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80);

		this.MatterGlow( 0.01, 30, GSPEED );
		
		
		// Similar to sdMatterContainers but not really, since it can have consistent slight movement unlike containers
		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.1 || Math.abs( this._last_sync_x - this.x ) >= 1 || Math.abs( this._last_sync_y - this.y ) >= 1 )
		{
			this._last_sync_matter = this.matter;
			this._last_sync_x = this.x;
			this._last_sync_y = this.y;
			this._update_version++;
		}
	}
	DrawHUD(ctx, attached) // foreground layer
	{
		sdEntity.Tooltip(ctx, "Crystal ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )");
	}

	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdCrystal.img_crystal_empty, - 16, - 16, 32,32 );
		
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max );
		/*if ( this.matter_max > 40 )
		{
			if ( this.matter_max === 5120 )
		    ctx.filter = 'hue-rotate(200deg) brightness(1.3) drop-shadow(0px 0px 7px #FFFFAA)';
			else
			if ( this.matter_max === 2560 )
			ctx.filter = 'hue-rotate(170deg) brightness(0.8) contrast(2)';
			else
			ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
		}*/
	
		ctx.globalAlpha = this.matter / this.matter_max;

		ctx.drawImageFilterCache(sdCrystal.img_crystal, - 16, - 16, 32, 32);

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
			Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
			this.matter_max / 40
		);
	}
}
//sdCrystal.init_class();

export default sdCrystal;