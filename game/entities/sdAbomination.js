
// Idea & implementation by Booraz149 ( https://github.com/Booraz149 )

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';

import sdBlock from './sdBlock.js';

class sdAbomination extends sdEntity
{
	static init_class()
	{
		sdAbomination.img_abomination_idle1 = sdWorld.CreateImageFromFile( 'abomination_idle' );
		sdAbomination.img_abomination_attack1 = sdWorld.CreateImageFromFile( 'abomination_attack' );
		sdAbomination.img_abomination_grab= sdWorld.CreateImageFromFile( 'abomination_grab' );
		
		
		sdAbomination.death_imgs = [
			sdWorld.CreateImageFromFile( 'abomination_death1' ),
			sdWorld.CreateImageFromFile( 'abomination_death2' ),
			sdWorld.CreateImageFromFile( 'abomination_death3' ),
			sdWorld.CreateImageFromFile( 'abomination_death4' )
		];
		sdAbomination.death_duration = 20;
		sdAbomination.post_death_ttl = 120;
		
		sdAbomination.max_seek_range = 1000;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -15; }
	get hitbox_x2() { return 15; }
	get hitbox_y1() { return -12; }
	get hitbox_y2() { return 12; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 650;
		this._hea = this._hmax;
		this._move_timer = 30;
		this.idle = 0;
		this.death_anim = 0;
		this.attack_timer = 30;
		this._pull_timer = 50; // Timer for pulling it's enemies towards it

		this.tenta_tim = 0;
		this.tenta_x = 0;
		this.tenta_y = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this.time_since_jump = 0;
		//this.last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		this._last_stand_when = 0;
		
		this.side = 1;
		
		//this.filter = 'none';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdAbomination.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;
			}
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		//dmg = Math.abs( dmg ); Can be healed now

		if ( initiator !== null )
		this._current_target = initiator;
		
		let was_alive = this._hea > 0;
		
		this._hea = Math.min( this._hea - dmg, this._hmax ); // Allow healing
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			this.idle = 1;
			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 15;
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 350; } // 75
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sy += y / ( this.mass / 2 ); // Impulse is something that defines how entity bounces off damage. Scaling Y impulse can cause it to be knocked into wrong direction?
	}
	/* Default fall damage
	Impact( vel ) // fall damage basically
	{
		if ( vel > 10 ) // less fall damage
		{
			this.DamageWithEffect( ( vel - 3 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );

		if ( this.tenta_tim > 0 )
		this.tenta_tim = Math.max( 0, this.tenta_tim - GSPEED * 5 );
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdAbomination.death_duration + sdAbomination.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		{
			this.time_since_jump = Math.min( 1000 / 1000 * 30, this.time_since_jump + GSPEED );

			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hmax, this._hea + GSPEED / 10 );

			if ( this.attack_timer > 0 )
			this.attack_timer = Math.max( 0, this.attack_timer - GSPEED );

			if ( this._pull_timer > 0 )
			this._pull_timer = Math.max( 0, this._pull_timer - GSPEED );
			
			{
				if ( this._current_target )
				{
					if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible() || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdAbomination.max_seek_range + 32 )
					this._current_target = null;
					else
					{
						this.side = ( this._current_target.x > this.x ) ? 1 : -1;

						if ( this.time_since_jump > 500 / 1000 * 30 )
						if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
						{
							//this.last_jump = sdWorld.time;
							this.time_since_jump = 0;
							//sdSound.PlaySound({ name:'slug_jump', x:this.x, y:this.y, volume: 0.25, pitch: 2 });

							let dx = ( this._current_target.x - this.x );
							let dy = ( this._current_target.y - this.y );

							//dy -= Math.abs( dx ) * 0.5;

							if ( dx > 0 )
							dx = 2;
							else
							dx = -2;

							if ( dy > 0 )
							dy = -2;
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
							sdWorld.SendEffect({ x: this.x, y: this.y, type:sdEffect.TYPE_BLOOD });
						}
					}
				}
			}
			if ( this._current_target )
			if ( this._pull_timer <= 0 )
			{
				this._pull_timer = 50;
						
				//let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 170 );
				let from_entity;
				//for ( var i = 0; i < nears.length; i++ )
				{
					from_entity = this._current_target;
					
					let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
					let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						from_entity.DamageWithEffect( 10, this );
						this._hea = Math.min( this._hmax, this._hea + 25 );


						//from_entity.PlayDamageEffect( xx, yy ); // Should pulling entities display this effect?

						this.tenta_x = xx - this.x;
						this.tenta_y = yy - this.y;
						this.tenta_tim = 100;


						if ( typeof from_entity.sx !== 'undefined' ) // Is it an entity
						from_entity.sx = - this.tenta_x / 20; // Pull it in
						else
						this.sx = this.tenta_x / 25; // Pull itself towards the static entity

						if ( typeof from_entity.sy !== 'undefined' )
						from_entity.sy = - this.tenta_y / 20;
						else
						this.sy = this.tenta_y / 10; // Pull itself towards the entity
						
						if ( from_entity.IsPlayerClass() )
						from_entity.ApplyServerSidePositionAndVelocity( true, - this.tenta_x / 20, - this.tenta_y / 20 );
						
						let di = sdWorld.Dist2D_Vector( this.tenta_x, this.tenta_y );
						if ( di > 0 )
						from_entity.Impulse( this.tenta_x / di * 20, this.tenta_y / di * 20 );
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
		
		sdWorld.last_hit_entity = null;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( sdWorld.last_hit_entity ) // ApplyVelocityAndCollisions sets value to sdWorld.last_hit_entity which can be reused to figure out if Slug collides with something. It can also set nothing if it entity physically sleeps, which is another sign of collision 
		this._last_stand_when = sdWorld.time;
		
		//if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this.attack_timer <= 0 )
		{
					let xx = this._current_target.x + ( this._current_target._hitbox_x1 + this._current_target._hitbox_x2 ) / 2;
					let yy = this._current_target.y + ( this._current_target._hitbox_y1 + this._current_target._hitbox_y2 ) / 2;

					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, this._current_target, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						let dx = xx - this.x;
						let dy = yy - this.y;
						
						let di = sdWorld.Dist2D_Vector( dx, dy );
						
						dx += ( this._current_target.sx || 0 ) * di / 12;
						dy += ( this._current_target.sy || 0 ) * di / 12;
						
						di = sdWorld.Dist2D_Vector( dx, dy );
						
						if ( di > 1 )
						{
							dx /= di;
							dy /= di;
						}
						
						this.side = ( dx > 0 ) ? 1 : -1;
						
						//this.an = Math.atan2( this._target.y + this._target.sy * di / vel - this.y, this._target.x + this._target.sx * di / vel - this.x ) * 100;
						
						//sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:5 });
						sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:0.33, pitch:1.5 });

						let bullet_obj = new sdBullet({ x: this.x, y: this.y });

						bullet_obj._owner = this;

						bullet_obj.sx = dx;
						bullet_obj.sy = dy;
						bullet_obj.x += bullet_obj.sx * 3;
						bullet_obj.y += bullet_obj.sy * 3;

						bullet_obj.sx *= 12;
						bullet_obj.sy *= 12;

						bullet_obj._damage = 45;
						bullet_obj.color = '#00ff00';
						
						bullet_obj.model = 'ab_tooth';

						sdEntity.entities.push( bullet_obj );
						
						this.attack_timer = 30;
						
					}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Abomination" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdAbomination.death_duration + sdAbomination.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdAbomination.death_imgs.length - 1, ~~( ( this.death_anim / sdAbomination.death_duration ) * sdAbomination.death_imgs.length ) );
			ctx.drawImageFilterCache( sdAbomination.death_imgs[ frame ], - 32, - 32, 64,64 );
		}
		else
		{
			if ( this.attack_timer > 25 )
			ctx.drawImageFilterCache( sdAbomination.img_abomination_attack1, - 32, - 32, 64,64 );
			else
			ctx.drawImageFilterCache( sdAbomination.img_abomination_idle1, - 32, - 32, 64,64 );


			if ( this.tenta_tim > 0 )
			{
				let sprites = [
					0,1,
					1,1,
					1,0
				];
				
				let morph = ( Math.sin( this.tenta_tim / 100 * Math.PI ) );
				let best_id = Math.round( morph * 2 );
				
				let xx = sprites[ best_id * 2 + 0 ];
				let yy = sprites[ best_id * 2 + 1 ];
				
				let di = sdWorld.Dist2D_Vector( this.tenta_x, this.tenta_y ) * ( ( best_id + 1 ) / 3 );
			
				if ( di < 200 )
				{
				    ctx.save();
					{
						ctx.scale( this.side, 1 );
						ctx.rotate( Math.PI / 2 - Math.atan2( this.tenta_x, this.tenta_y ) );
						ctx.drawImageFilterCache( sdAbomination.img_abomination_grab, xx * 32, yy * 32, 32,32, 0, -16, di,32 );
					}
				    ctx.restore();
				}
			}
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}

	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdAbomination.death_duration + sdAbomination.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
				//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter() });
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}

}
//sdAbomination.init_class();

export default sdAbomination;