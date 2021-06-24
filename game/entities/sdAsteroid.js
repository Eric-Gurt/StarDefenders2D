
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';

class sdAsteroid extends sdEntity
{
	static init_class()
	{
		sdAsteroid.img_asteroid = sdWorld.CreateImageFromFile( 'asteroid' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 6; }
	get hitbox_y1() { return -6; }
	get hitbox_y2() { return 6; }
	
	constructor( params )
	{
		super( params );
		
		this._hmax = 200;
		this._hea = this._hmax;
		
		this.sx = Math.random() * 12 - 6;
		this.sy = 10;
		
		//this._an = 0;
		this._an = Math.atan2( this.sy, this.sx ) - Math.PI / 2;
	}
	Damage( dmg, initiator=null )
	{
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			if ( this._hea <= 0 )
			this.remove();
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.x += this.sx * GSPEED;
		this.y += this.sy * GSPEED;
		
		if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 10 )
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		if ( !sdWorld.is_server )
		this._an = Math.atan2( this.sy, this.sx ) - Math.PI / 2;
	
		if ( sdWorld.CheckWallExists( this.x, this.y + this._hitbox_y2, this ) )
		{
			this.remove();
		}
	}
	onRemove() // Class-specific, if needed
	{
		sdWorld.SendEffect({ x:this.x, y:this.y, radius:19, type:sdEffect.TYPE_EXPLOSION, color:sdEffect.default_explosion_color });
	}
	Draw( ctx, attached )
	{
		var image = sdAsteroid.img_asteroid;
		
		ctx.rotate( this._an );

		ctx.drawImage( image, - 16, - 16, 32,32 );
	}
	MeasureMatterCost()
	{
		return 100; // Hack
	}
};
export default sdAsteroid;