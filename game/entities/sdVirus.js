
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';


class sdVirus extends sdEntity
{
	static init_class()
	{
		sdVirus.img_virus = sdWorld.CreateImageFromFile( 'virus' );
		sdVirus.img_virus_walk = sdWorld.CreateImageFromFile( 'virus_walk' );
		
		sdVirus.death_imgs = [
			sdWorld.CreateImageFromFile( 'virus_death1' ),
			sdWorld.CreateImageFromFile( 'virus_death2' ),
			sdWorld.CreateImageFromFile( 'virus_death3' ),
			sdWorld.CreateImageFromFile( 'virus_death4' ),
			sdWorld.CreateImageFromFile( 'virus_death5' )
		];
		sdVirus.death_duration = 10;
		sdVirus.post_death_ttl = 90;
		
		sdVirus.max_seek_range = 1000;
		
		sdVirus.normal_max_health = 80;
		sdVirus.normal_max_health_max = 800 * 3; 
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -6 * this.hmax / sdVirus.normal_max_health; }
	get hitbox_x2() { return 6 * this.hmax / sdVirus.normal_max_health; }
	get hitbox_y1() { return ( ( this.death_anim === 0 ) ? -5 : 1 ) * this.hmax / sdVirus.normal_max_health; }
	get hitbox_y2() { return 4 * this.hmax / sdVirus.normal_max_health; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = sdVirus.normal_max_health;
		this._hea = this.hmax;
		
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		this._last_grow = sdWorld.time;
		this._last_target_change = 0;
		
		this.side = 1;
		
		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	Grow( delta )
	{
		let old = this.hmax;
		
		this.hmax += delta;
		if ( this.hmax > sdVirus.normal_max_health_max )
		this.hmax = sdVirus.normal_max_health_max;
	
		for ( var r = 0; r < 2; r++ )
		{
			var dist = 0;
			
			if ( r === 1 )
			dist = 2;
			
			if ( r === 1 )
			dist = 8;
		
			for ( var x = 0; x < 3; x++ )
			for ( var y = 0; y < 3; y++ )
			{
				var xx = ( ( x + 1 ) % 3 ) - 1;
				var yy = ( ( y + 1 ) % 3 ) - 1;
				
				if ( this.CanMoveWithoutOverlap( this.x + xx * dist, this.y + yy * dist, 0 ) )
				{
					this.x += xx * dist;
					this.y += yy * dist;
					
					this._hea = this._hea / old * this.hmax;

					return true;
				}
				
				if ( r === 0 )
				{
					x = 10;
					y = 10;
					break;
				}
			}
		}
	
		/*if ( this.CanMoveWithoutOverlap( this.x, this.y, 0 ) )
		{
			this._hea = this._hea / old * this.hmax;

			return true;
		}
		else*/
		{
			this.hmax = old;
			return false;
		}
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		if ( this._last_target_change < sdWorld.time - 2000 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdVirus.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;
				
				this._last_target_change = sdWorld.time;

				sdSound.PlaySound({ name:'virus_alert', x:this.x, y:this.y, volume: 0.5, pitch: 1 * sdVirus.normal_max_health / this.hmax });
			}
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		return this.filter;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 * sdVirus.normal_max_health / this.hmax });

			if ( initiator )
			if ( initiator._socket )
			initiator._socket.score += ~~( 1 * this.hmax / sdVirus.normal_max_health );
		}
		
		if ( this._hea < -this.hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 30 * this.hmax / sdVirus.normal_max_health; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 ) // less fall damage
		{
			this.Damage( ( vel - 3 ) * 15 );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdVirus.death_duration + sdVirus.post_death_ttl )
			this.death_anim += GSPEED * sdVirus.normal_max_health / this.hmax;
			else
			this.remove();
		}
		else
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible() || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdVirus.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 100 * this.hmax / sdVirus.normal_max_health )
				//if ( this._last_stand_on )
				if ( !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x - this.x ) * 0.1;
					let dy = ( this._current_target.y - this.y ) * 0.1;
					
					dy -= Math.abs( dx ) * 0.5;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 7 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 7;
						dy *= 7;
					}
					
					this.sx = dx;
					this.sy = dy;

					
					//this._last_stand_on = null; // wait for next collision
				}
			}
		}
		
		sdWorld.last_hit_entity = null;
		
		let in_water = sdWorld.CheckWallExistsBox( this.x + this.hitbox_x1, this.y + this.hitbox_y1, this.x + this.hitbox_x2, this.y + this.hitbox_y2, null, null, sdWater.water_class_array );
		//let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			let water_ent = sdWorld.last_hit_entity;
			
			if ( this.death_anim === 0 ) // Alive
			if ( water_ent )
			if ( sdWorld.time > this._last_grow + 500 )
			{
				this._last_grow = sdWorld.time;
				
				if ( this.Grow( 15 ) )
				{
					water_ent.AwakeSelfAndNear();
					water_ent.remove();
				}
			}
		}
		//else
		//{
			this.sy += sdWorld.gravity * GSPEED;
		//}
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 1000 )
		{
			this._last_bite = sdWorld.time;
					
			let nears = sdWorld.GetAnythingNear( this.x, this.y, 8 * this.hmax / sdVirus.normal_max_health );
			let from_entity;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity.hitbox_x1 + from_entity.hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity.hitbox_y1 + from_entity.hitbox_y2 ) / 2;
				
				if ( from_entity.is( sdCharacter ) )
				if ( from_entity.IsTargetable() )
				if ( sdWorld.CheckLineOfSight( this.x, this.y, from_entity.x, from_entity.y, null, null, sdCom.com_creature_attack_unignored_classes ) )
				{
					from_entity.Damage( 30 * this.hmax / sdVirus.normal_max_health, this );
					
					this._hea = Math.min( this.hmax, this._hea + 15 * this.hmax / sdVirus.normal_max_health );

					sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					break;
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Virus" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.scale( this.side * this.hmax / sdVirus.normal_max_health, 1 * this.hmax / sdVirus.normal_max_health );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdVirus.death_duration + sdVirus.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdVirus.death_imgs.length - 1, ~~( ( this.death_anim / sdVirus.death_duration ) * sdVirus.death_imgs.length ) );
			ctx.drawImageFilterCache( sdVirus.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdVirus.img_virus : sdVirus.img_virus_walk, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdVirus.death_duration + sdVirus.post_death_ttl ) // not gone by time
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this.hitbox_x1 + Math.random() * ( this.hitbox_x2 - this.hitbox_x1 );
				y = this.y + this.hitbox_y1 + Math.random() * ( this.hitbox_y2 - this.hitbox_y1 );
				
				//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter() });
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdVirus.init_class();

export default sdVirus;