
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';

import sdBlock from './sdBlock.js';

class sdShark extends sdEntity
{
	static init_class()
	{
		sdShark.img_shark = sdWorld.CreateImageFromFile( 'sdShark' );

		/*
		sdShark.img_shark = sdWorld.CreateImageFromFile( 'shark' );
		sdShark.img_shark_chomp = sdWorld.CreateImageFromFile( 'shark_chomp' );
		sdShark.img_shark_dead = sdWorld.CreateImageFromFile( 'shark_dead' );
		*/

		sdShark.death_duration = 10;
		sdShark.post_death_ttl = 90;
		
		sdShark.max_seek_range = 1000;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 300;
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this.chomp = 0;
		
		this._current_target = null;
		
		this._air = 30;
		
		//this._last_stand_on = null;
		//this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		
		this.side = ( Math.random() < 0.5 ) ? 1 : -1;
		
		this.hue = ~~( Math.random() * 360 );
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( sdWater.all_swimmers.has( character ) )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdShark.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				sdSound.PlaySound({ name:'overlord_welcomeB', x:this.x, y:this.y, volume: 0.5, pitch: 0.5 });
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
	GetBleedEffectHue()
	{
		return this.hue - 56;
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
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			
			sdSound.PlaySound({ name:'abomination_alert', x:this.x, y:this.y, volume: 1, pitch:0.5 });

			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_AVERAGE_MOB );
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 120; }
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
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWater.all_swimmers.has( this );// sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( in_water )
		this._air = 30;
		else
		this._air -= GSPEED;
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdShark.death_duration + sdShark.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		if ( sdWorld.is_server )
		//if ( this.death_anim === 0 ) // for client
		if ( in_water )
		{
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !sdWater.all_swimmers.has( this._current_target ) || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdShark.max_seek_range + 32 )
				this._current_target = null;
				else
				{
					this.side = ( this._current_target.x > this.x ) ? 1 : -1;

					//if ( this._last_jump < sdWorld.time - 100 )
					//if ( this._last_stand_on )
					{
						//this._last_jump = sdWorld.time;

						let dx = ( this._current_target.x - this.x );
						let dy = ( this._current_target.y - this.y );

						//dy -= Math.abs( dx ) * 0.5;

						/*if ( dx > 0 )
						dx = 5;
						else
						dx = -5;

						if ( dy > 0 )
						dy = 1;
						else
						dy = -1;*/

						let di = sdWorld.Dist2D_Vector( dx, dy );
						if ( di > 1 )
						{
							dx /= di;
							dy /= di;
						}

						this.sx += dx * 0.5 * GSPEED;
						this.sy += dy * 0.5 * GSPEED;


						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
			else
			{
				if ( this.sx === 0 )
				this.side *= -1;
			
				this.sx += this.side * 0.3 * GSPEED;
				this.sy += ( Math.random() - 0.5 ) * 0.4 * GSPEED;
				this.PhysWakeUp();
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			if ( this._hea <= 0 )
			this.sy -= sdWorld.gravity * GSPEED * 0.5;
			else
			{
				if ( this._hea < this._hmax )
				this._hea = Math.min( this._hmax, this._hea + GSPEED * 0.01 );
			}
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
			
			if ( this._air <= 0 )
			if ( this._hea > 0 )
			this.DamageWithEffect( GSPEED );
		}
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 500 )
		{
			let nears = sdWorld.GetAnythingNear( this.x, this.y, 10 );
			let from_entity;
				
			sdWorld.shuffleArray( nears );
			
			let max_targets = 1;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

				//if ( from_entity.GetClass() === 'sdCharacter' )
				if ( from_entity.IsPlayerClass() )
				if ( from_entity.IsTargetable() )
				{
					this._last_bite = sdWorld.time;
					from_entity.DamageWithEffect( 200, this );
					
					sdSound.PlaySound({ name:'popcorn', x:this.x, y:this.y, volume:0.5, pitch:0.4 });
					
					this._hea = Math.min( this._hmax, this._hea + 20 );

					from_entity.PlayDamageEffect( xx, yy );
					//sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					max_targets--;
					if ( max_targets <= 0 )
					break;
				}
			}
		}
		
		if ( sdWorld.is_server )
		this.chomp = ( sdWorld.time < this._last_bite + 300 ) ? 1 : 0;
		
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Devil shark" );
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		if ( !sdShop.isDrawing )
		{
			ctx.sd_hue_rotation = this.hue;
			ctx.scale( this.side, 1 );// ( this.death_anim === 0 ) ? 1 : -1 );
		}

		let xx = 0;
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdShark.death_duration + sdShark.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}

			xx = 2;
			//ctx.drawImageFilterCache( sdShark.img_shark_dead, - 16, - 16, 32,32 );
		}
		else
		{
			xx = Math.min( ( this.chomp ) ? 1 : 0 );
			//ctx.drawImageFilterCache( this.chomp ? sdShark.img_shark_chomp : sdShark.img_shark, - 16, - 16, 32,32 );
		}

		ctx.drawImageFilterCache( sdShark.img_shark, 32, xx * 32, 32,32, -16, -16, 32,32 );
		
		ctx.sd_hue_rotation = 0;
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
		if ( this.death_anim < sdShark.death_duration + sdShark.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
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
//sdShark.init_class();

export default sdShark;