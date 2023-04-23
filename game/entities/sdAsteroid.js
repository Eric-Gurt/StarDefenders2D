
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdMimic from './sdMimic.js';

class sdAsteroid extends sdEntity
{
	static init_class()
	{
		sdAsteroid.img_asteroid = sdWorld.CreateImageFromFile( 'asteroid_sheet' );
		/*
		sdAsteroid.img_asteroid = sdWorld.CreateImageFromFile( 'asteroid' );
		sdAsteroid.img_asteroid_landed = sdWorld.CreateImageFromFile( 'asteroid_landed' );
		*/
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -5 * this.scale; }
	get hitbox_x2() { return 5 * this.scale; }
	get hitbox_y1() { return -5 * this.scale; }
	get hitbox_y2() { return 5 * this.scale; }
	
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.build_tool_level > this._max_build_tool_level_near )
		this._max_build_tool_level_near = character.build_tool_level;
	}
	constructor( params )
	{
		super( params );
		
		this._max_build_tool_level_near = 0;

		this.scale = Math.max( 0.8, Math.random() * 2 ); // Scale / size of the asteroid
		this._type = params._type || Math.random() < 0.2 ? 1 : 0;
		this.landed = false;
		
		this._hmax = 60 * this.scale; // Asteroids that land need more HP to survive the "explosion" when they land
		this._hea = this._hmax;
		
		this.sx = Math.random() * 12 - 6;
		this.sy = 10;


		this._time_to_despawn = 30 * 60 * 5; // 5 minutes to despawn landed asteroids
		
		//this._an = 0;
		this._an = Math.atan2( this.sy, this.sx ) - Math.PI / 2;
	}
	Damage( dmg, initiator=null )
	{
		dmg = Math.abs( dmg );
		
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			if ( this._hea <= 0 )
			{
				if ( this._max_build_tool_level_near >= 10 && Math.random() < this._max_build_tool_level_near / 30 * 0.05 )
				{
					let ent = new sdMimic({ x: this.x, y: this.y });
					sdEntity.entities.push( ent );
					sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs
				}
				else
				if ( Math.random() < 0.25 || this._type === 1 )
				{
					let matter_max = 40;

					let r = 1 - Math.pow( Math.random(), 1.45 );

					if ( r < 0.0625 )
					matter_max *= 16;
					else
					if ( r < 0.125 )
					matter_max *= 8;
					else
					if ( r < 0.25 )
					matter_max *= 4;
					else
					if ( r < 0.5 )
					matter_max *= 2;

					sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
						Math.ceil( Math.max( 5, 1 * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
							matter_max / 40,
							5
					);
				}
		
				this.remove();
			}
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.landed )
		{
			this.sy += sdWorld.gravity * GSPEED;
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			this._time_to_despawn -= GSPEED;
			
			this._an += this.sx * GSPEED * 20 / 100 / this.scale;
			
			if ( this._time_to_despawn < 0 )
			this.remove();
		}
		else
		{
			let new_x = this.x + this.sx * GSPEED;
			let new_y = this.y + this.sy * GSPEED;
			
			if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 10 )
			{
				this.sy += sdWorld.gravity * GSPEED;
			}

			if ( !sdWorld.is_server )
			this._an = Math.atan2( this.sy, this.sx ) - Math.PI / 2;
		
			//if ( sdWorld.CheckWallExists( this.x, this.y + this._hitbox_y2, this ) )
			if ( !this.CanMoveWithoutDeepSleepTriggering( new_x, new_y, 0 ) )
			{
				// Despawn asteroids flying into sdDeepSleep
				this.remove();
				this._broken = false;
			}
			else
			if ( !this.CanMoveWithoutOverlap( new_x, new_y, 0 ) )
			{
				if ( this._type === 0 )
				this.DamageWithEffect( 1000 );
			
				if ( this._type === 1 && this.landed === false )
				{
					sdWorld.SendEffect({ x:this.x, y:this.y, radius:12, type:sdEffect.TYPE_EXPLOSION, color:sdEffect.default_explosion_color, can_hit_owner:false, owner:this });
					this.landed = true;
					
					//this.x -= this.sx * GSPEED;
					//this.y -= this.sy * GSPEED; // Revert overlapping position
					
					this.sx *= 0.02;
					this.sy *= 0.02;
				}
				//this.remove();
			}
			else
			{
				this.x = new_x;
				this.y = new_y;
			}
		}
	}
	get mass() { return 80 * this.scale; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.landed; }
	
	onRemove() // Class-specific, if needed
	{
		if ( this.landed )
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3, undefined, undefined, 1.4 );
	
		if ( this._type === 0 )
		if ( this._broken )
		sdWorld.SendEffect({ x:this.x, y:this.y, radius:19, type:sdEffect.TYPE_EXPLOSION, color:sdEffect.default_explosion_color });
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.landed )
		sdEntity.Tooltip( ctx, "Asteroid" );
	}
	Draw( ctx, attached )
	{
		var xx = this.landed ? 1 : 0;
		//var image = this.landed ? sdAsteroid.img_asteroid_landed : sdAsteroid.img_asteroid;
		
		if ( !sdShop.isDrawing )
		ctx.rotate( this._an );

		ctx.scale( this.scale, this.scale );
		ctx.drawImageFilterCache( sdAsteroid.img_asteroid, xx * 32, 0, 32,32, -16, -16, 32,32 );
		//ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );
	}
	MeasureMatterCost()
	{
		return 100; // Hack
	}
};
export default sdAsteroid;