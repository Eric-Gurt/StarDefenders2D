
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';

import sdBlock from './sdBlock.js';

class sdSlug extends sdEntity
{
	static init_class()
	{
		sdSlug.img_slug_idle1 = sdWorld.CreateImageFromFile( 'slug_idle' );
		sdSlug.img_slug_idle2 = sdWorld.CreateImageFromFile( 'slug_idle' );
		sdSlug.img_slug_walk1 = sdWorld.CreateImageFromFile( 'slug_walk1' );
		sdSlug.img_slug_walk2 = sdWorld.CreateImageFromFile( 'slug_walk2' );
		
		sdSlug.death_imgs = [
			sdWorld.CreateImageFromFile( 'slug_death1' ),
			sdWorld.CreateImageFromFile( 'slug_death2' ),
			sdWorld.CreateImageFromFile( 'slug_death3' ),
			sdWorld.CreateImageFromFile( 'slug_death4' )
		];
		sdSlug.death_duration = 20;
		sdSlug.post_death_ttl = 120;
		
		sdSlug.max_seek_range = 1000;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 6; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 500;
		this._hea = this._hmax;
		this._move_timer = 30; // Timer used for moving when unprovoked
		this.idle=0;
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		
		this.side = 1;
		
		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea != this._hmax )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdSlug.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				sdSound.PlaySound({ name:'quickie_alert', x:this.x, y:this.y, volume: 0.5 });
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
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			this.idle=1;
			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 1;
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 75; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / (this.mass/2);
		//this.sx += x * 0.2;
		//this.sy += y * 0.2;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdSlug.death_duration + sdSlug.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
{
		if (this._hea < this._hmax && this._hea > 0) // If provoked then move
		{
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible() || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdSlug.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 100 )
				//if ( this._last_stand_on )
				if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x - this.x );
					let dy = ( this._current_target.y - this.y );
					
					//dy -= Math.abs( dx ) * 0.5;
					
					if ( dx > 0 )
					dx = 2;
					else
					dx = -2;
					
					if ( dy > 0 )
					dy = 1;
					else
					dy = -2;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 5 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 5;
						dy *= 5;
					}
					
					this.sx = dx;
					this.sy = dy;

					
					//this._last_stand_on = null; // wait for next collision
				}
			}
		}
		}

		else // If not provoked then move around
		if ( this._hea === this._hmax )
		{
		if (this._move_timer > 0)
		this._move_timer -= 1;
		if (this._move_timer < 1)
		{
			this.side = ( Math.random() > 0.5 ) ? 1 : -1;
			if ( Math.random() > 0.7)
			this.idle = ( Math.random() > 0.7 ) ? 0 : 1;
			this._move_timer = 120;
		}
			if ( this.idle === 0)
			if ( this._last_jump < sdWorld.time - 100 )
				//if ( this._last_stand_on )
				if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
				{
					this._last_jump = sdWorld.time;
					
					let dx = this.side;
					let dy = 0;
					
					//dy -= Math.abs( dx ) * 0.5;
					
					if ( dx > 0 )
					dx = 2;
					else
					dx = -2;
					
					//if (Math.random() > 0.91)
					dy = -2;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 5 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 5;
						dy *= 5;
					}
					
					this.sx = dx;
					this.sy = dy;

					
					//this._last_stand_on = null; // wait for next collision
				}
		}
}
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			if ( this._hea > 0 )
			this.sy -= sdWorld.gravity * GSPEED * 2;
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		if (this._hea < this._hmax && this._hea > 0) // If provoked then become hostile
		if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 500 )
		{
			let nears = sdWorld.GetAnythingNear( this.x, this.y, 8 );
			let from_entity;
				
			sdWorld.shuffleArray( nears );
			
			let max_targets = 3;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity.hitbox_x1 + from_entity.hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity.hitbox_y1 + from_entity.hitbox_y2 ) / 2;

				if ( from_entity.GetClass() === 'sdCharacter' ||
					 from_entity.GetClass() === 'sdVirus' ||
					 from_entity.GetClass() === 'sdAsp' ||
					 from_entity.GetClass() === 'sdBlock' ||
					 from_entity.GetClass() === 'sdQuickie' )
				if ( from_entity.IsTargetable() )
				{
					this._last_bite = sdWorld.time;
					from_entity.Damage( 30, this );
					
					this._hea = Math.min( this._hmax, this._hea + 3 );

					sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					max_targets--;
					if ( max_targets <= 0 )
					break;
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Slug" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdSlug.death_duration + sdSlug.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdSlug.death_imgs.length - 1, ~~( ( this.death_anim / sdSlug.death_duration ) * sdSlug.death_imgs.length ) );
			ctx.drawImageFilterCache( sdSlug.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( Math.abs( this.sx ) < 2 )
			ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdSlug.img_slug_idle1 : sdSlug.img_slug_idle2, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdSlug.img_slug_walk1 : sdSlug.img_slug_walk2, - 16, - 16, 32,32 );
		}
		
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
		if ( this.death_anim < sdSlug.death_duration + sdSlug.post_death_ttl ) // not gone by time
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
//sdSlug.init_class();

export default sdSlug;