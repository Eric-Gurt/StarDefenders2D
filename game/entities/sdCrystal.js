
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
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		this.matter_max = 40;
		
		let r = Math.random();
		
		if ( r < 0.0625 )
		this.matter_max *= 16;
		else
		if ( r < 0.125 )
		this.matter_max *= 8;
		else
		if ( r < 0.25 )
		this.matter_max *= 4;
		else
		if ( r < 0.5 )
		this.matter_max *= 2;
		
		
		this.matter = this.matter_max;
		
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
		sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
	}
	Impulse( x, y )
	{
		this.sx += x * 0.1;
		this.sy += y * 0.1;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );

		//let inner_range = [];
		//let outer_range = [];

		var x = this.x;
		var y = this.y;
		//for ( var xx = -2; xx <= 2; xx++ )
		//for ( var yy = -2; yy <= 2; yy++ )
		for ( var xx = -1; xx <= 1; xx++ )
		for ( var yy = -1; yy <= 1; yy++ )
		{
			var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
			for ( var i = 0; i < arr.length; i++ )
			if ( typeof arr[ i ].matter !== 'undefined' )
			if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 30 ) >= 0 )
			if ( arr[ i ] !== this )
			{
				/*if ( Math.abs( xx ) >= 2 || Math.abs( yy ) >= 2 )
				{
					outer_range.push( arr[ i ] );
				}
				else
				{
					inner_range.push( arr[ i ] );
				}*/
				//debugger; // Does this even happen?
				
				this.TransferMatter( arr[ i ], 0.01, GSPEED );
			}
		}
		
		/*for ( var i = 0; i < outer_range.length; i++ )
		{
			if ( inner_range.indexOf( outer_range[ i ] ) === -1 )
			debugger; // If this never happens - shrink range check
		}*/

	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Crystal ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdCrystal.img_crystal_empty, - 16, - 16, 32,32 );
		
		if ( this.matter_max > 40 )
		ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.globalAlpha = this.matter / this.matter_max;
		
		ctx.drawImageFilterCache( sdCrystal.img_crystal, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
			Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
			this.matter_max / 40
		);
		/*if ( sdWorld.is_server )
		{
			for ( var i = 0; i < 5; i++ )
			{
				let ent = new sdGun({ class:sdGun.CLASS_CRYSTAL_SHARD, x: this.x, y:this.y });
				ent.sx = this.sx + Math.random() * 8 - 4;
				ent.sy = this.sy + Math.random() * 8 - 4;
				ent.ttl = 30 * 7 * ( 0.7 + Math.random() * 0.3 );
				sdEntity.entities.push( ent );
			}
		}*/
	}
}
//sdCrystal.init_class();

export default sdCrystal;