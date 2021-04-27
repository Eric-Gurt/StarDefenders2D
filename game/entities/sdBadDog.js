
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';

import sdBlock from './sdBlock.js';

class sdBadDog extends sdEntity
{
	static init_class()
	{
		sdBadDog.img_bad_dog_anim = sdWorld.CreateImageFromFile( 'sdBadDog' );
		
		sdBadDog.frame_idle = 0;
		sdBadDog.frame_jump = 1;
		sdBadDog.frame_attack = 2;
		sdBadDog.frame_death = 3;
		sdBadDog.frame_death_frames = 5;
		/*
		sdBadDog.img_quickie_idle1 = sdWorld.CreateImageFromFile( 'quickie_idle1' );
		sdBadDog.img_quickie_idle2 = sdWorld.CreateImageFromFile( 'quickie_idle2' );
		sdBadDog.img_quickie_walk1 = sdWorld.CreateImageFromFile( 'quickie_walk1' );
		sdBadDog.img_quickie_walk2 = sdWorld.CreateImageFromFile( 'quickie_walk2' );
		
		sdBadDog.death_imgs = [
			sdWorld.CreateImageFromFile( 'quickie_death1' ),
			sdWorld.CreateImageFromFile( 'quickie_death2' ),
			sdWorld.CreateImageFromFile( 'quickie_death3' )
		];
		*/
		sdBadDog.death_duration = 21;
		sdBadDog.post_death_ttl = 150;
		
		sdBadDog.retreat_hp_mult = 0.5;
		
		sdBadDog.max_seek_range = 1000;
		
		sdBadDog.dogs_counter = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -7; }
	get hitbox_y2() { return 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		sdBadDog.dogs_counter++;
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 200;
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this.hurt_anim = 0;
		
		//this.frame = sdBadDog.frame_idle;
		//this._frame_time = 0;
		
		this._last_bite_sound = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = 0;
		this._last_bite = 0;
		this.bites = false;
		this.jumps = false;
		
		this.side = 1;
		
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdBadDog.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				sdSound.PlaySound({ name:'bad_dog_alert', x:this.x, y:this.y, volume: 0.5 });
			}
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	/*GetBleedEffectFilter()
	{
		return 'hue-rotate(-56deg)'; // Yellow
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		//let was_alive = this._hea > 0;
		let old_hp = this._hea;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && old_hp > 0 )
		{
			sdSound.PlaySound({ name:'bad_dog_death', x:this.x, y:this.y, volume: 0.5 });

			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 1;
		}
		else
		if ( this._hea > 0 )
		{
			if ( this._hea <= this._hmax * sdBadDog.retreat_hp_mult && old_hp > this._hmax * sdBadDog.retreat_hp_mult )
			{
				sdSound.PlaySound({ name:'bad_dog_retreat', x:this.x, y:this.y, volume: 0.2 });
			}
			else
			{
				if ( this.hurt_anim <= 0 )
				sdSound.PlaySound({ name:'bad_dog_hurt', x:this.x, y:this.y, volume: 0.75 });
			}
			
			this.hurt_anim = 5;
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 50; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.2;
		//this.sy += y * 0.2;
	}
	/* Default fall damage
	Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 15 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( sdWorld.is_server )
		{
			this.bites = ( sdWorld.time < this._last_bite + 75 );
			this.jumps = ( sdWorld.time < this._last_jump + 200 );
		}
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdBadDog.death_duration + sdBadDog.post_death_ttl )
			{
				this.death_anim += GSPEED;
			}
			else
			this.remove();
		}
		else
		{
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hmax, this._hea + GSPEED * 1 / 30 );
		
			if ( this.hurt_anim > 0 )
			this.hurt_anim -= GSPEED;
				
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdBadDog.max_seek_range + 32 )
				this._current_target = null;
				else
				{
					this.side = ( this._current_target.x > this.x ) ? 1 : -1;

					if ( this._hea < this._hmax * sdBadDog.retreat_hp_mult )
					this.side *= -1;

					if ( sdWorld.is_server )
					if ( this._last_jump < sdWorld.time - 400 )
					{
						//if ( this._last_stand_on )
						if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
						{
							this._last_jump = sdWorld.time;

							let dx = ( this._current_target.x - this.x );
							//let dy = ( this._current_target.y - this.y );

							if ( this._hea < this._hmax * sdBadDog.retreat_hp_mult )
							{
								dx *= -1;
								//dy *= -1;
							}

							//dy -= Math.abs( dx ) * 0.5;

							if ( dx > 0 )
							dx = 5;
							else
							dx = -5;

							/*if ( dy > 0 )
							dy = 3;
							else
							dy = -3;*/

							let dy = -1;

							if ( Math.abs( this.sx ) < 0.5 )
							dy = -5;

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
						else
						{
							let dx = ( this._current_target.x > this.x ) ? 1 : -1;

							if ( this._hea < this._hmax * sdBadDog.retreat_hp_mult )
							{
								dx *= -1;
							}

							this.sx += dx * 0.01 * GSPEED;
						}
					}
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
		
		
		this.ApplyVelocityAndCollisions( GSPEED, ( this.death_anim === 0 && this._current_target ) ? 10 : 0, true );
		
		if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 100 )
		{
			let nears = sdWorld.GetAnythingNear( this.x, this.y, 12 ); // 8 not enough when player tilts
			let from_entity;
				
			sdWorld.shuffleArray( nears );
			
			let max_targets = 1;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity.hitbox_x1 + from_entity.hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity.hitbox_y1 + from_entity.hitbox_y2 ) / 2;

				if ( from_entity.GetClass() === 'sdCharacter' )
				if ( from_entity.IsTargetable() )
				{
					this._last_bite = sdWorld.time;
					from_entity.Damage( 5, this );
					
					if ( this._last_bite_sound < sdWorld.time - 500 )
					{
						this._last_bite_sound = sdWorld.time;
						sdSound.PlaySound({ name:'bad_dog_attack', x:this.x, y:this.y, volume: 0.5 });
					}
					
					this._hea = Math.min( this._hmax, this._hea + 5 );

					sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					from_entity.tilt = Math.PI / 2 * this.side * 100;
					from_entity.tilt_speed = 0;
					if ( from_entity.flying )
					from_entity.flying = false;
					
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
		sdEntity.Tooltip( ctx, "Bad Dog" );
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		ctx.scale( -this.side, 1 );
		
		var frame = sdBadDog.frame_idle;
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdBadDog.death_duration + sdBadDog.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			frame = sdBadDog.frame_death + Math.min( sdBadDog.frame_death_frames - 1, ~~( ( this.death_anim / sdBadDog.death_duration ) * sdBadDog.frame_death_frames ) );
			//ctx.drawImageFilterCache( sdBadDog.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( this.hurt_anim > 0 )
			frame = sdBadDog.frame_death;
			else
			if ( this.bites )
			frame = sdBadDog.frame_attack;
			else
			//if ( Math.abs( this.sx ) < 1.5 )
			if ( !this.jumps )
			frame = sdBadDog.frame_idle;
			else
			frame = sdBadDog.frame_jump;
		}
		
		ctx.drawImageFilterCache( sdBadDog.img_bad_dog_anim, frame*32,0,32,32, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		//ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		sdBadDog.dogs_counter--;
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdBadDog.death_duration + sdBadDog.post_death_ttl ) // not gone by time
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
//sdBadDog.init_class();

export default sdBadDog;