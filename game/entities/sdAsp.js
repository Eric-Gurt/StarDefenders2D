
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCube from './sdCube.js';


class sdAsp extends sdEntity
{
	static init_class()
	{
		sdAsp.img_asp_idle = sdWorld.CreateImageFromFile( 'asp_idle' );
		sdAsp.img_asp_attack1 = sdWorld.CreateImageFromFile( 'asp_attack1' );
		sdAsp.img_asp_attack2 = sdWorld.CreateImageFromFile( 'asp_attack2' );
		
		sdAsp.death_imgs = [
			sdWorld.CreateImageFromFile( 'asp_death1' ),
			sdWorld.CreateImageFromFile( 'asp_death2' ),
			sdWorld.CreateImageFromFile( 'asp_death3' ),
			sdWorld.CreateImageFromFile( 'asp_death4' ),
			sdWorld.CreateImageFromFile( 'asp_death5' )
		];
		sdAsp.death_duration = 15;
		sdAsp.post_death_ttl = 30 * 6;
		
		sdAsp.max_seek_range = 1000;
		
		sdAsp.asps_tot = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	// 8 as max dimension so it can fit into one block
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -7; }
	get hitbox_y2() { return ( this.death_anim === 0 ) ? 7 : 3; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 80;
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_attack = sdWorld.time;
		
		this.side = 1;
		
		this.attack_frame = 0;
		
		this._anim_shift = ~~( Math.random() * 10000 );
		
		sdAsp.asps_tot++;
		
		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsVisible( this ) )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdAsp.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				//sdSound.PlaySound({ name:'asp_alert', x:this.x, y:this.y, volume: 0.5 });
				
				sdSound.PlaySound({ name:'quickie_alert', x:this.x, y:this.y, volume: 0.5, pitch: 2 });
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
	
		if ( initiator )
		if ( !initiator.is( sdAsp ) )
		if ( !initiator.is( sdCube ) )
		this._current_target = initiator;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			
			//sdSound.PlaySound({ name:'asp_death', x:this.x, y:this.y, volume: 0.5 });

			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 2;
	
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	get mass() { return 300; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
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
			if ( this.death_anim < sdAsp.death_duration + sdAsp.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdAsp.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				if ( this.attack_frame < 1 ) // Not attacking
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 150 )
				//if ( this._last_stand_on )
				//if ( in_water )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x + ( this._current_target.sx || 0 ) * 20 - this.x - this.sx * 20 );
					let dy = ( this._current_target.y + ( this._current_target.sy || 0 ) * 20 - this.y - this.sy * 20 );
					
					// Bad formula but whatever
					dx += Math.random() * 40 - 20;
					dy += -Math.random() * 20;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 2 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 2;
						dy *= 2;
						
						if ( di < 100 )
						{
							dx *= -1;
							dy *= -1;
						}
					}
					
					this.sx += dx;
					this.sy += dy;

					//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
					//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );
					
					//this._last_stand_on = null; // wait for next collision
				}
			}
		}
		else
		{
			// No target
			if ( sdWorld.is_server )
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				if ( sdWorld.sockets[ i ].character.IsVisible( this ) )
				{
					
					let dx = ( sdWorld.sockets[ i ].character.x + Math.random() * 1000 - 500 - this.x );
					let dy = ( sdWorld.sockets[ i ].character.y + Math.random() * 1000 - 500 - this.y );
					
					let di = sdWorld.Dist2D_Vector( dx, dy );

					if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 4 )
					if ( di > 1 )
					{
						this.sx += dx / di * 0.2;
						this.sy += dy / di * 0.2;

						//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
						//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );
						
						break;
					}
				}
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
		}
		
		if ( this.death_anim === 0 )
		{
			if ( this.attack_frame > 0 )
			this.attack_frame = Math.max( 0, this.attack_frame - GSPEED * 0.1 );
				
			if ( this._current_target )
			if ( this._last_attack < sdWorld.time - 1500 )
			{
				this._last_attack = sdWorld.time; // So it is not so much calc intensive
						
				let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 170 );
				let from_entity;
				
				let nears = [];
				for ( var i = 0; i < nears_raw.length; i++ )
				{
					from_entity = nears_raw[ i ];
					
					if ( ( from_entity.GetClass() === 'sdCharacter' && from_entity.IsVisible( this ) && from_entity.hea > 0 ) )
					{
						let rank = Math.random() * 0.1;
						
						nears.push( { ent: from_entity, rank: rank } );
					}
				}
				
				nears.sort((a,b)=>{
					return b.rank - a.rank;
				});
				
				//sdWorld.shuffleArray( nears );

				//let hits_left = 4;

				for ( var i = 0; i < nears.length; i++ )
				{
					from_entity = nears[ i ].ent;
					
					let xx = from_entity.x + ( from_entity.hitbox_x1 + from_entity.hitbox_x2 ) / 2;
					let yy = from_entity.y + ( from_entity.hitbox_y1 + from_entity.hitbox_y2 ) / 2;

					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						let dx = xx - this.x;
						let dy = yy - this.y;
						
						let di = sdWorld.Dist2D_Vector( dx, dy );
						
						dx += from_entity.sx * di / 12;
						dy += from_entity.sy * di / 12;
						
						di = sdWorld.Dist2D_Vector( dx, dy );
						
						if ( di > 1 )
						{
							dx /= di;
							dy /= di;
						}
						
						this.side = ( dx > 0 ) ? 1 : -1;
						
						//this.an = Math.atan2( this._target.y + this._target.sy * di / vel - this.y, this._target.x + this._target.sx * di / vel - this.x ) * 100;
						
						//sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:5 });
						sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:0.33, pitch:2.8 });

						let bullet_obj = new sdBullet({ x: this.x, y: this.y });

						bullet_obj._owner = this;

						bullet_obj.sx = dx;
						bullet_obj.sy = dy;
						bullet_obj.x += bullet_obj.sx * 3;
						bullet_obj.y += bullet_obj.sy * 3;

						bullet_obj.sx *= 12;
						bullet_obj.sy *= 12;

						bullet_obj._damage = 15;
						bullet_obj.color = '#00ff00';
						
						bullet_obj.model = 'ball_g';

						sdEntity.entities.push( bullet_obj );
						
						this.attack_frame = 3;
						this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
						
						break;
					}
				}
			}
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Asp" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.scale( -this.side, 1 );
		
		if ( this.death_anim === 0 )
		{
			ctx.translate( 0, Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2 );
			
			if ( this.attack_frame >= 1 )
			{
				ctx.rotate( this.attack_an / 100 );
			}
		}
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdAsp.death_duration + sdAsp.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdAsp.death_imgs.length - 1, ~~( ( this.death_anim / sdAsp.death_duration ) * sdAsp.death_imgs.length ) );
			ctx.drawImageFilterCache( sdAsp.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( this.attack_frame >= 2 )
			ctx.drawImageFilterCache( sdAsp.img_asp_attack1, - 16, - 16, 32,32 );
			else
			if ( this.attack_frame >= 1 )
			ctx.drawImageFilterCache( sdAsp.img_asp_attack2, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( sdAsp.img_asp_idle, - 16, - 16, 32,32 );
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
		sdAsp.asps_tot--;
		
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdAsp.death_duration + sdAsp.post_death_ttl ) // not gone by time
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
//sdAsp.init_class();

export default sdAsp;