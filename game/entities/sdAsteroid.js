
/* global Infinity, sdShop, sdRenderer */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdSound from '../sdSound.js';
import sdMimic from './sdMimic.js';
import sdBlock from './sdBlock.js';
import sdWeather from './sdWeather.js';
import sdBullet from './sdBullet.js';
import sdDeepSleep from './sdDeepSleep.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdCom from './sdCom.js';

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
		
		sdAsteroid.effect_colors = [ '#fffff0', '#fffff0', '#ff0000', '#80ffff' ]
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	static GetProtetedBlockInfestationDelay()
	{
		//return 10000; // Hack
		
		return 1000 * 60 * 60 * 24 * ( 2 + 2 * Math.random() ); // 2-4 days, per BSU actually now in order to prevent raiding with flesh asteroids and manually placed unprotected walls
	}
	get hitbox_x1() { return -5 * this.scale / 100; }
	get hitbox_x2() { return 5 * this.scale / 100; }
	get hitbox_y1() { return -5 * this.scale / 100; }
	get hitbox_y2() { return 5 * this.scale / 100; }
	
	Impulse( x, y )
	{
		if ( this.held_by )
		return;
	
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.held_by )
		return [ this.held_by ]; 
	
		return [];
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
	PlayerIsHooked( character, GSPEED )
	{
		if ( this.type === sdAsteroid.TYPE_FLESH )
		this.AsteroidLanded();
	}
	PlayerIsCarrying( character, GSPEED )
	{
		this.PlayerIsHooked( character, GSPEED );
	}
		
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.attached_to )
		return;
	
		if ( this.type === sdAsteroid.TYPE_FLESH )
		{
			if ( from_entity )
			{
				/*if ( from_entity.is( sdBullet ) )
				{
					if ( from_entity._hook )
					{
						this.AsteroidLanded();
					}
				}
				else*/
				if ( from_entity.Fleshify )
				if ( !from_entity.is( sdBlock ) || from_entity.material !== sdBlock.MATERIAL_FLESH )
				{
					if ( sdWorld.inDist2D_Boolean( this.x, this.y, this._land_x, this._land_y, 800 ) && ( sdWorld.server_config.base_degradation || !from_entity._shielded || !from_entity._shielded._is_being_removed ) )
					{
						//from_entity.Fleshify();
						this.attached_to = from_entity;
						this.attached_offset_x = this.x - from_entity.x;
						this.attached_offset_y = this.y - from_entity.y;
						//this._infestation_in = sdWorld.time + 1000 * 60 * 60 * 24 * ( 2 + 2 * Math.random() ); // 2-4 days
						
						/*if ( from_entity._shielded )
						{
							from_entity._shielded.onFleshifyAttempted( this );
							
							this._infestation_in = sdWorld.time + sdAsteroid.GetProtetedBlockInfestationDelay();
						}
						else*/
						this._infestation_in = sdWorld.time + 5000; // Unprotected walls/ground is nearly instant
					}
					else
					{
						let e = new sdMimic({ x: this.x, y: this.y });
						sdEntity.entities.push( e );
						this.remove();
					}

					//this._broken = false;
				}
			}
		}
	}
	constructor( params )
	{
		super( params );
		
		// Carrying
		this.held_by = null;
		
		//this._max_build_tool_level_near = 0;

		//this._type = params._type || Math.random() < 0.2 ? 1 : 0;
		this.landed = params.landed || false;
		this._warhead_detonated = false;
		
		this.attached_to = null;
		this.attached_offset_x = 0;
		this.attached_offset_y = 0;
		this._infestation_in = 0;

		
		this.type = ( params.type !== undefined ) ? params.type : ( Math.random() < 0.005 ) ? sdAsteroid.TYPE_FLESH : ( Math.random() < 0.5 ) ? sdAsteroid.TYPE_SHARDS : sdAsteroid.TYPE_DEFAULT;
		this.scale = ( this.type === sdAsteroid.TYPE_MISSILE ) ? 100 : Math.max( 0.8, Math.random() * 2 ) * 100; // Scale / size of the asteroid

		this._hmax = 60 * this.scale / 100; // Asteroids that land need more HP to survive the "explosion" when they land
		this._hea = this._hmax;
		
		this.sx = this.landed ? 0 : Math.random() * 12 - 6;
		this.sy = this.landed ? 0 : 10;
		
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
		this._an = ( Math.atan2( this.sy, this.sx ) - Math.PI / 2 );
		this.rotation = this._an * 100;  // Needed as public variable for aiming missiles
		
		// client-sided
		this._eff_color = sdAsteroid.effect_colors [ this.type ];
		this._eff_timer = 0;
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
		if ( sdWorld.is_server )
		if ( !this.landed )
		{
			this.landed = true;

			// this._an = Math.random() * Math.PI;
			// this.rotation = this._an * 100;

			if ( this.type === sdAsteroid.TYPE_FLESH )
			{
				sdSound.PlaySound({ name:'slug_jump', x:this.x, y:this.y, volume: 0.5 });

				this._land_x = this.x;
				this._land_y = this.y;
			}
			else
			if ( this.type === sdAsteroid.TYPE_MISSILE ) 
			{
				if ( Math.random() < 0.9 ) // Small chance to malfunction, for realism
				this.remove();
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
				
				bullet_obj._can_hit_owner = false;
				bullet_obj.color = '#ffff00';

				sdEntity.entities.push( bullet_obj );

				this._warhead_detonated = true;
			}
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.held_by )
		{
			return;
		}
		
		if ( this.landed )
		{
			if ( this.attached_to )
			{
				if ( this.attached_to._is_being_removed )
				{
					this.remove();
				}
				else
				{
					this.x = this.attached_to.x + this.attached_offset_x;
					this.y = this.attached_to.y + this.attached_offset_y;

					if ( sdWorld.is_server )
					if ( sdWorld.time > this._infestation_in )
					{
						if ( !this.attached_to._shielded || this.attached_to._shielded.onFleshifyAttempted( this ) )
						{
							this.attached_to.Fleshify( null, sdBlock.max_flesh_rank_asteroid );
							this.remove();
						}
						else
						this._infestation_in = sdWorld.time + 5000; // Try later
					}
				}
			}
			else
			{
				this.sy += sdWorld.gravity * GSPEED;
				this.ApplyVelocityAndCollisions( GSPEED, 0, true );
				this._time_to_despawn -= GSPEED;

				this._an +=		 this.sx * GSPEED * 20 / 100 / ( this.scale / 100 );
				this.rotation += this.sx * GSPEED * 20 / 100 / ( this.scale / 100 ) * 100;

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
				if ( sdWorld.CheckLineOfSight( this.x, this.y, ( this.x + c.x ) / 2, ( this.y + c.y ) / 2, this, null, sdCom.com_vision_blocking_classes ) )
				{
					this._witnessers.add( c );
					
					let v = sdWeather.only_instance.TraceDamagePossibleHere( c.x, c.y, Infinity, false, true ) ? 1 : 0.2;
					
					if ( this.type === sdAsteroid.TYPE_MISSILE )
					sdSound.PlaySound({ name:'missile_incoming', x:((this.x + this.sx * 60)+c.x)/2, y:((this.y + this.sy * 60)+c.y)/2, volume:v*2, pitch:1 }, [ c._socket ] );
					else
					sdSound.PlaySound({ name:'asteroid', x:((this.x + this.sx * 60)+c.x)/2, y:((this.y + this.sy * 60)+c.y)/2, volume:v, pitch:1 / ( ( this.scale + 100 ) / 200 ) }, [ c._socket ] );

					c.ApplyStatusEffect({ type:sdStatusEffect.TYPE_ASTEROID_WARNING, asteroid:this });
				}
			}

			// if ( !sdWorld.is_server )
			this._an = ( Math.atan2( this.sy, this.sx ) - Math.PI / 2 );
		
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
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		if ( !this.landed )
		if ( sdRenderer.effects_quality > 1 )
		{
			if ( this._eff_timer > 0 )
			this._eff_timer -= GSPEED;
			
			if ( this._eff_timer <= 0 )
			{
				let xx = -this.sx / 4 + ( -Math.random() + Math.random() );
				let yy = -this.sy / 4 + ( -Math.random() + Math.random() );
				
				let e = new sdEffect({ type: sdEffect.TYPE_SPARK, x:this.x, y:this.y, sx: xx, sy: yy, color: this._eff_color });
				sdEntity.entities.push( e );
				if ( this.type !== sdAsteroid.TYPE_FLESH )
				{
					let e2 = new sdEffect({ type: sdEffect.TYPE_SMOKE, x:this.x + xx * 2, y:this.y + yy * 2, sx: xx, sy:yy, scale:1, radius:this.scale / 200, color:sdEffect.GetSmokeColor( sdEffect.smoke_colors ), spark_color:this._eff_color });
					sdEntity.entities.push( e2 );
				}
					
				this._eff_timer = 1;
			}
		}
		
		if ( sdWorld.is_server )
		this.rotation = this._an * 100;
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
				sdWorld.SendEffect({ x:this.x, y:this.y, radius:75 * this.scale/100, damage_scale:2, type:sdEffect.TYPE_EXPLOSION, color:sdEffect.default_explosion_color, shrapnel:true, can_hit_owner:false, owner:this });
				this.Fragmentation(); // Always activate warhead in case of destruction
			}
			else
			sdWorld.BasicEntityBreakEffect( this, 3, undefined, undefined, 1.4 );
		}
	}
	get title()
	{
		if ( this.type === sdAsteroid.TYPE_FLESH )
		return this.attached_to ? 'Attached space flesh asteroid' : 'Space flesh asteroid';
	
		if ( this.type === sdAsteroid.TYPE_SHARDS )
		return ('Asteroid with crystal shards');

		if ( this.type === sdAsteroid.TYPE_MISSILE )
		return ('Cruise missile');

	
		return ('Asteroid');
	}
	IsPhysicallyMovable()
	{
		return ( !this.held_by && !this.attached_to );
	}
	IsCarriable( by )
	{
		return ( this.landed && !this.attached_to );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.landed )
		{
			sdEntity.TooltipUntranslated( ctx, this.title );
			
			this.BasicCarryTooltip( ctx, 8 );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.held_by === null || attached )
		{
			var xx = ( this.landed ? 1 : 0 ) + this.type * 2;
			//var image = this.landed ? sdAsteroid.img_asteroid_landed : sdAsteroid.img_asteroid;

			let yy = 0;

			if ( !sdShop.isDrawing )
			{
				ctx.rotate( this.rotation / 100 );

				ctx.scale( this.scale/100, this.scale/100 );
			}
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
	}
	MeasureMatterCost()
	{
		return 100; // Hack
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
			{
				if ( command_name === 'IGNITE' )
				if ( this.type === sdAsteroid.TYPE_MISSILE )
				if ( this.landed )
				{
					this.landed = false;
		
					this.sx = Math.sin ( this._an - Math.PI ) * 10;
					this.sy = Math.cos ( this._an ) * 10;
					
					sdSound.PlaySound({ name:'missile_incoming', x:this.x, y:this.y, volume: 1, pitch: 1 });
					
					// Prevent instant explosion due to getting stuck in walls even when aimed properly - might not be needed anymore
					
					//this.x += this.sx / 2;
					//this.y += this.sy / 2;
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( this.type === sdAsteroid.TYPE_MISSILE )
			if ( this.landed )
			{
					
				this.AddContextOption( 'Reignite engine', 'IGNITE', [ ] );
				
			}
		}
	}
};
export default sdAsteroid;
