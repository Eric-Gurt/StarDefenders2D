
/* global Infinity, sdShop */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdSound from '../sdSound.js';
import sdMimic from './sdMimic.js';
import sdBlock from './sdBlock.js';
import sdWeather from './sdWeather.js';
import sdBullet from './sdBullet.js';
import sdDeepSleep from './sdDeepSleep.js';

class sdAsteroid extends sdEntity
{
	static init_class()
	{
		sdAsteroid.img_asteroid = sdWorld.CreateImageFromFile( 'asteroid_sheet' );
		/*
		sdAsteroid.img_asteroid = sdWorld.CreateImageFromFile( 'asteroid' );
		sdAsteroid.img_asteroid_landed = sdWorld.CreateImageFromFile( 'asteroid_landed' );
		*/
	   
		sdAsteroid.TYPE_DEFAULT = 0;
		sdAsteroid.TYPE_SHARDS = 1;
		sdAsteroid.TYPE_FLESH = 2;
		sdAsteroid.TYPE_MISSILE = 3;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -5 * this.scale / 100; }
	get hitbox_x2() { return 5 * this.scale / 100; }
	get hitbox_y1() { return -5 * this.scale / 100; }
	get hitbox_y2() { return 5 * this.scale / 100; }
	
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	GetBleedEffect()
	{
		return ( this.type === sdAsteroid.TYPE_FLESH ) ? sdEffect.TYPE_BLOOD : sdEffect.TYPE_WALL_HIT;
	}
	
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.build_tool_level > this._max_build_tool_level_near )
		this._max_build_tool_level_near = character.build_tool_level;
	}*/
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.type === sdAsteroid.TYPE_FLESH )
		{
			if ( from_entity )
			{
				if ( from_entity.is( sdBullet ) )
				{
					if ( from_entity._hook )
					{
						this.AsteroidLanded();
					}
				}
				else
				if ( from_entity.Fleshify )
				if ( !from_entity.is( sdBlock ) || from_entity.material !== sdBlock.MATERIAL_FLESH )
				{
					if ( sdWorld.inDist2D_Boolean( this.x, this.y, this._land_x, this._land_y, 800 ) && ( sdWorld.server_config.base_degradation || !from_entity._shielded || !from_entity._shielded._is_being_removed ) )
					{
						from_entity.Fleshify();
					}
					else
					{
						let e = new sdMimic({ x: this.x, y: this.y });
						sdEntity.entities.push( e );
					}

					this.remove();
					//this._broken = false;
				}
			}
		}
	}
	constructor( params )
	{
		super( params );
		
		//this._max_build_tool_level_near = 0;

		//this._type = params._type || Math.random() < 0.2 ? 1 : 0;
		this.landed = false;
		this._warhead_detonated = false;

		
		this.type = ( params.type !== undefined ) ? params.type : ( Math.random() < 0.005 ) ? sdAsteroid.TYPE_FLESH : ( Math.random() < 0.5 ) ? sdAsteroid.TYPE_SHARDS : sdAsteroid.TYPE_DEFAULT;
		this.scale = ( this.type === sdAsteroid.TYPE_MISSILE ) ? 100 : Math.max( 0.8, Math.random() * 2 ) * 100; // Scale / size of the asteroid

		this._hmax = 60 * this.scale / 100; // Asteroids that land need more HP to survive the "explosion" when they land
		this._hea = this._hmax;
		
		this.sx = Math.random() * 12 - 6;
		this.sy = 10;
		
		if ( this.type === sdAsteroid.TYPE_MISSILE )
		{
			// Velocity was 32 originally. But missiles are just killing new players too often, they probably can't be that fast and that deadly
			this.sx *= 0.5;
			//this.sy *= 1.5;
		}
		
		// Check for flesh asteroids to only fleshify near this area
		this._land_x = 0;
		this._land_y = 0;

		this.matter_max = 0;

		
		this._witnessers = new WeakSet();
		
		if ( this.type === sdAsteroid.TYPE_SHARDS )
		{
			this.matter_max = 40;
			let r = 1 - Math.pow( Math.random(), 1.45 );
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
		}

		//this._time_to_despawn = 30 * 60 * 5; // 5 minutes to despawn landed asteroids
		this._time_to_despawn = 30 * 60 * 2; // 2 minutes to despawn landed asteroids
		
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
				/*if ( this.type === sdAsteroid.TYPE_FLESH )
				{
					let ent = new sdMimic({ x: this.x, y: this.y });
					sdEntity.entities.push( ent );
					sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs
					
				}
				else*/
				if ( this.type === sdAsteroid.TYPE_SHARDS )
				{
					sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
						Math.ceil( Math.max( 5, 1 * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
							this.matter_max / 40,
							5
					);
				}
		
				this.remove();
			}
		}
	}
	PlayerIsHooked( character, GSPEED )
	{
		this.AsteroidLanded();
	}
	onBeforeLongRangeTeleport( lrtp ) // Called before snapshot is taken
	{
		this.AsteroidLanded();
		this._land_x = 0;
		this._land_y = -Number.MAX_SAFE_INTEGER;
	}
	AsteroidLanded()
	{
		if ( !this.landed )
		{
			this.landed = true;

			this._an = Math.random() * Math.PI;

			if ( this.type === sdAsteroid.TYPE_FLESH )
			{
				sdSound.PlaySound({ name:'slug_jump', x:this.x, y:this.y, volume: 0.5 });

				this._land_x = this.x;
				this._land_y = this.y;
			}
			else
			if ( this.type === sdAsteroid.TYPE_MISSILE ) 
			{
				if ( Math.random() < 0.9 ) this.Fragmentation(); // Small chance to malfunction, for realism
			}
			else
			sdWorld.SendEffect({ x:this.x, y:this.y, radius:36 * this.scale/100, damage_scale:2, type:sdEffect.TYPE_EXPLOSION, color:sdEffect.default_explosion_color, can_hit_owner:false, owner:this });

			this.sx *= 0.02;
			this.sy *= 0.02;
		}
	}
	Fragmentation()
	{
		if ( sdWorld.is_server && !this._warhead_detonated ) { // Prevent visual bugs on lagging client
			let initial_rand = Math.random() * Math.PI * 2;
			let steps = Math.min( 32, Math.max( 16, 32 * this.scale / 100 / 70 * 32 ) );
			let an;
			let bullet_obj;
						
			for ( let s = 0; s < steps; s++ )
			{
				an = s / steps * Math.PI * 2;
				
				bullet_obj = new sdBullet({ 
					x: this.x + Math.sin( an + initial_rand ) * 1, 
					y: this.y + Math.cos( an + initial_rand ) * 1 
				});	
			
				bullet_obj.sx = Math.sin( an + initial_rand ) * 16;
				bullet_obj.sy = Math.cos( an + initial_rand ) * 16;
				bullet_obj.time_left = 500 * this.scale / 100 / 16 * 2;
												
				bullet_obj._damage = 32;
				//bullet_obj._temperature_addition = 1000;

				bullet_obj._affected_by_gravity = true;
				bullet_obj.gravity_scale = 2;

				bullet_obj._owner = this;
				
				bullet_obj._can_hit_owner = true;
				bullet_obj.color = '#ffff00';

				sdEntity.entities.push( bullet_obj );

				this._warhead_detonated = true;
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
			
			this._an += this.sx * GSPEED * 20 / 100 / ( this.scale / 100 );
			
			if ( sdWorld.is_server )
			if ( this._time_to_despawn < 0 )
			{
				if ( this.type === sdAsteroid.TYPE_MISSILE )
				{
					if ( this.CanMoveWithoutOverlap( this.x, this.y, 0.1 ) ) // Spawned at the top of a map in some protected wall or something like that. Just remove these
					{
						// Otherwise stop them from being active at least
						this._time_to_despawn = 90;
						this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
					}
					else
					{
						this.remove();
						this._broken = false;
					}
				}
				else
				{
					this.remove();
					this._broken = false;
				}
			}
		}
		else
		{
			let new_x = this.x + this.sx * GSPEED;
			let new_y = this.y + this.sy * GSPEED;
			
			if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 10 )
			{
				this.sy += sdWorld.gravity * GSPEED;
			}
			
			if ( sdWorld.is_server )
			if ( !this.landed )
			if ( this.type !== sdAsteroid.TYPE_FLESH )
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				let c = sdWorld.sockets[ i ].character;
				if ( c )
				if ( !c._is_being_removed )
				if ( !this._witnessers.has( c ) )
				if ( sdWorld.inDist2D_Boolean( c.x, c.y, this.x + this.sx * 60, this.y + this.sy * 60, 500 ) )
				{
					this._witnessers.add( c );
					
					let v = sdWeather.only_instance.TraceDamagePossibleHere( c.x, c.y, Infinity, false, true ) ? 1 : 0.2;
					
					if ( this.type === sdAsteroid.TYPE_MISSILE )
					sdSound.PlaySound({ name:'missile_incoming', x:((this.x + this.sx * 60)+c.x)/2, y:((this.y + this.sy * 60)+c.y)/2, volume:v*2, pitch:1 }, [ c._socket ] );
					else
					sdSound.PlaySound({ name:'asteroid', x:((this.x + this.sx * 60)+c.x)/2, y:((this.y + this.sy * 60)+c.y)/2, volume:v, pitch:1 / ( ( this.scale + 100 ) / 200 ) }, [ c._socket ] );
				}
			}

			if ( !sdWorld.is_server )
			this._an = Math.atan2( this.sy, this.sx ) - Math.PI / 2;
		
			//if ( sdWorld.CheckWallExists( this.x, this.y + this._hitbox_y2, this ) )
			if ( !this.CanMoveWithoutDeepSleepTriggering( new_x, new_y, 0 ) )
			{
				// Fly past them as if nothing is here?
				this.x = new_x;
				this.y = new_y;
				
				//let old_v = sdDeepSleep.track_entity_stucking_ignore_temporary;
				//sdDeepSleep.track_entity_stucking_ignore_temporary = true;
				//{
					sdWorld.UpdateHashPosition( this, false, true );
				//}
				//sdDeepSleep.track_entity_stucking_ignore_temporary = old_v;
				/*
				
				// Despawn asteroids flying into sdDeepSleep
				this.remove();
				this._broken = false;*/
			}
			else
			if ( !this.CanMoveWithoutOverlap( new_x, new_y, 0 ) )
			{
				this.AsteroidLanded();
			}
			else
			{
				this.x = new_x;
				this.y = new_y;
				sdWorld.UpdateHashPosition( this, false, true );
			}
		}
	}
	get mass() { return 80 * this.scale/100; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.landed; }
	
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			if ( this.type === sdAsteroid.TYPE_FLESH )
			{
				//sdWorld.SendEffect({ x:this.x, y:this.y, radius:19, type:sdEffect.TYPE_EXPLOSION, color:sdEffect.default_explosion_color });

				let a,s,x,y,k;

				sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine

				for ( let i = 0; i < 6; i++ )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;

					k = Math.random();

					x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
					y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );

					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GI, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });

				}
			}
			if ( this.type === sdAsteroid.TYPE_MISSILE )
			{
				sdWorld.SendEffect({ x:this.x, y:this.y, radius:75 * this.scale/100, damage_scale:2, type:sdEffect.TYPE_EXPLOSION, color:sdEffect.default_explosion_color, can_hit_owner:false, owner:this });
				this.Fragmentation(); // Always activate warhead in case of destruction
			}
			else
			sdWorld.BasicEntityBreakEffect( this, 3, undefined, undefined, 1.4 );
		}
	}
	get title()
	{
		if ( this.type === sdAsteroid.TYPE_FLESH )
		return ('Space flesh asteroid');
	
		if ( this.type === sdAsteroid.TYPE_SHARDS )
		return ('Asteroid with crystal shards');

		if ( this.type === sdAsteroid.TYPE_MISSILE )
		return ('Cruise missile');

	
		return ('Asteroid');
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.landed )
		sdEntity.TooltipUntranslated( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		var xx = ( this.landed ? 1 : 0 ) + this.type * 2;
		//var image = this.landed ? sdAsteroid.img_asteroid_landed : sdAsteroid.img_asteroid;
		
		let yy = 0;
		
		if ( !sdShop.isDrawing )
		ctx.rotate( this._an );

		ctx.scale( this.scale/100, this.scale/100 );
		
		if ( this.landed )
		yy = ( ( sdWorld.time + ( this._net_id || 0 ) ) % 3000 < 1500 ) ? 1 : 0;
		else
		yy = ( ( sdWorld.time + ( this._net_id || 0 ) ) % 200 < 100 ) ? 1 : 0;
		
		if ( this.matter_max > 0 )
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max );
		
		ctx.drawImageFilterCache( sdAsteroid.img_asteroid, xx * 32, yy * 64, 32,64, -16, -32, 32,64 );
		//ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );
		
		ctx.filter = 'none';
	}
	MeasureMatterCost()
	{
		return 100; // Hack
	}
};
export default sdAsteroid;
