
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdGib from './sdGib.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';


class sdBiter extends sdEntity
{
	static init_class()
	{
		sdBiter.img_biter_anim = sdWorld.CreateImageFromFile( 'sdBiter' );
		
		sdBiter.frame_idle = 0;
		sdBiter.frame_attack = 1;
		sdBiter.frame_death = 2;
		sdBiter.frame_death_frames = 4;
		sdBiter.death_duration = 15;
		sdBiter.post_death_ttl = 30 * 6;
		
		sdBiter.max_seek_range = 1000;
		
		sdBiter.biters_counter = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	// 8 as max dimension so it can fit into one block
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 4; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 60;
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_attack = sdWorld.time + 2000;
		this._attacking = false;
		
		this.side = 1;
		
		this.attack_anim = 0;
		
		//this._anim_shift = ~~( Math.random() * 10000 );
		
		//this.attack_an = 0;
		
		sdBiter.biters_counter++;
		
		this.hue = ~~( Math.random() * 360 );
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
		//this.filter = 'saturate(0.5)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdBiter.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				//sdSound.PlaySound({ name:'biter_alert', x:this.x, y:this.y, volume: 0.5 });
				
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
		return 'hue-rotate('+( this.hue + 150 )+'deg)';
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( !initiator.is( sdBiter ) )
		this._current_target = initiator;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			
			//sdSound.PlaySound({ name:'biter_death', x:this.x, y:this.y, volume: 0.5 });

			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );

			if ( dmg >= this._hmax * 0.5 ) // Instagib, gibs biter into 2 parts ( if you weapon deals enough damage )
			{
				sdWorld.SpawnGib( this.x + ( 3 * this.side ), this.y, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_BITER_GIBS , 'hue-rotate(' + this.hue + 'deg)', 'hue-rotate('+( this.hue + 150 )+'deg)', 100, this );
				sdWorld.SpawnGib( this.x - ( 3 * this.side ), this.y, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_BITER_GIBS , 'hue-rotate(' + this.hue + 'deg)', 'hue-rotate('+( this.hue + 150 )+'deg)', 100, this, 1 );
				this.remove();
			}
	
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	get mass() { return 10; } // sdBiter is capable of crashing hovers with 50 kg mass
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.Damage( ( vel - 5 ) * 5 );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdBiter.death_duration + sdBiter.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdBiter.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 150 )
				//if ( this._last_stand_on )
				//if ( in_water )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x + ( this._current_target.sx || 0 ) * 10 - this.x - this.sx * 10 );
					let dy = ( this._current_target.y + ( this._current_target.sy || 0 ) * 10 - this.y - this.sy * 10 );
					
					if ( !this._attacking )
					{
						let limited_dx = Math.max( 1, Math.abs( dx ) ); // Because division by 0 causes NaN values and server reboots
						
						// Bad formula but whatever
						dx += ( Math.random() * 10 - 5 ) * 800 / limited_dx;
						dy += ( -Math.random() * 50 );
					}
					
					let di = sdWorld.Dist2D_Vector( dx / 1.5, dy );
					if ( di > 2 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 3;
						dy *= 3;
						
						if ( !this._attacking && di < 100 )
						{
							dx *= -0.5;
							dy -= GSPEED * 5;
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
					let dy = ( sdWorld.sockets[ i ].character.y + Math.random() * -500 - this.y );
					
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
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.6, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.6, GSPEED );
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
		}

		if ( this.attack_anim > 0 )
		this.attack_anim -= GSPEED;
		
		if ( this.death_anim === 0 )
		{
			
			if ( !this._attacking )
			if ( this._last_attack < sdWorld.time )
			{
				this._last_attack += 500;
					this._attacking = true;
					this._last_attack = sdWorld.time + ( Math.random() * 3000 + 4000 ); // So it is not so much calc intensive
			}
			
			let from_entity;
			
			if ( this._attacking )
			{
			
				let nears = sdWorld.GetAnythingNear( this.x, this.y, 12 );
				sdWorld.shuffleArray( nears );

				//let hits_left = 4;

				for ( var i = 0; i < nears.length; i++ )
				{
					from_entity = nears[ i ];
					
					let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
					let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;
					
					if ( from_entity.IsPlayerClass() || this._current_target === from_entity )
					if ( from_entity.IsTargetable() )
					{
						this._attacking = false;

						from_entity.DamageWithEffect( 12, this );
						from_entity.PlayDamageEffect( xx, yy );
						
						if ( from_entity.is( sdCharacter ) )
						{
							from_entity._sickness += 30;
							from_entity._last_sickness_from_ent = this;
						}
						
						this._hea = Math.min( this._hmax, this._hea + 15 );

						this.attack_anim = 5;

						sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:0.33, pitch: 2.5 });
						
						break;
					}
				}
			}

			if ( sdWorld.CheckWallExists( this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2, this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2 + 8, null, null, sdCom.com_creature_attack_unignored_classes ) )
			{
				this._attacking = false;
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
		sdEntity.Tooltip( ctx, "Biter" );
	}
	Draw( ctx, attached )
	{
		if ( !sdShop.isDrawing )
		{
			//ctx.filter = this.filter;
			
			if ( sdRenderer.visual_settings === 4 )
			ctx.sd_hue_rotation = this.hue;
			else
			ctx.filter = 'hue-rotate(' + this.hue + 'deg)' + ctx.filter;
		}
		
		ctx.scale( this.side, 1 );

		var frame = sdBiter.frame_idle;
		
		/*if ( this.death_anim === 0 )
		{
			ctx.translate( 0, Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2 );
			
			if ( this.attack_frame >= 1 )
			{
				ctx.rotate( this.attack_an / 100 );
			}
		}*/
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdBiter.death_duration + sdBiter.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			frame = sdBiter.frame_death + Math.min( sdBiter.frame_death_frames - 1, ~~( ( this.death_anim / sdBiter.death_duration ) * sdBiter.frame_death_frames ) );
		}
		else
		this.attack_anim > 0 ? frame = 1 : 0

		ctx.drawImageFilterCache( sdBiter.img_biter_anim, frame*32,0,32,32, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdBiter.biters_counter--;
		
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdBiter.death_duration + sdBiter.post_death_ttl ) // not gone by time
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
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdBiter.init_class();

export default sdBiter;