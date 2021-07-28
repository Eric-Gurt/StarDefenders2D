
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';

class sdBall extends sdEntity
{
	static init_class()
	{
		sdBall.img_ball = sdWorld.CreateImageFromFile( 'phys_ball' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return -3; }
	get hitbox_y2() { return 3; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		this._lives_until = sdWorld.time + 1000 * 60 * 5; // Lives for 5 minutes without anybody near
	}
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hea = 10;
		
		this._vulnerable_to = null;
		this._vulnerable_until = 0;
		
		this._lives_until = sdWorld.time + 1000 * 60 * 5; // Lives for 5 minutes without anybody near
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 30 )
		{
			this.Damage( ( vel - 4 ) * 5 );
		}
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( initiator.is( sdCharacter ) )
		{
			if ( !initiator._inventory[ this.gun_slot ] || sdGun.classes[ initiator._inventory[ this.gun_slot ].class ].is_sword )
			{
				if ( sdWorld.time < this._vulnerable_until && this._vulnerable_to === initiator )
				{
				}
				else
				{
					this._vulnerable_to = initiator;
					this._vulnerable_until = sdWorld.time + 2000;
					return;
				}
			}
		}
	
		let old_hp = this.hea;
	
		this.hea -= dmg;
		
		if ( this.hea <= 0 )
		{
			if ( old_hp > 0 )
			{
				//sdSound.PlaySound({ name:'sd_beacon_disarm', x:this.x, y:this.y, volume:1 });
			}
			this.remove();
		}
	}
	
	get bounce_intensity()
	{ return 0.7; }
	
	get friction_remain()
	{ return 0.9; }
	
	get mass() { return 20; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( sdWorld.time > this._lives_until )
		{
			this.remove();
		}
	}
	Draw( ctx, attached )
	{
		ctx.filter = 'hue-rotate('+( (( this._net_id )%36) * 10 )+'deg)';
		
		ctx.rotate( Math.round( this.x / 5 / Math.PI * 2 ) * Math.PI / 2 );
		
		ctx.drawImageFilterCache( sdBall.img_ball, - 16, - 16, 32,32 );
		
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
	}
	MeasureMatterCost()
	{
		return 100;
	}
}
//sdBall.init_class();

export default sdBall;