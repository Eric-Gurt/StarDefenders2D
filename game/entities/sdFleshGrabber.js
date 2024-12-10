
// Idea & implementation by Booraz149 ( https://github.com/Booraz149 )

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdGib from './sdGib.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';

import sdBlock from './sdBlock.js';

class sdFleshGrabber extends sdEntity
{
	static init_class()
	{
		sdFleshGrabber.img_flesh = sdWorld.CreateImageFromFile( 'flesh_grabber' );

		sdFleshGrabber.img_grab = sdWorld.CreateImageFromFile( 'abomination_grab' );
		

		sdFleshGrabber.death_duration = 30; // 20
		sdFleshGrabber.post_death_ttl = 120;
		
		sdFleshGrabber.max_seek_range = 300;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( this.side === 0 || this.side === 2 ) ? -8 : ( this.side === 1 ) ? -2 : 0 }
	get hitbox_x2() { return ( this.side === 0 || this.side === 2 ) ? 8 : ( this.side === 1 ) ? 0 : 2 }
	get hitbox_y1() { return ( this.side === 1 || this.side === 3 ) ? -8 : ( this.side === 0 ) ? -2 : 0 }
	get hitbox_y2() { return ( this.side === 1 || this.side === 3 ) ? 8 : ( this.side === 0 ) ? 0 : 2 }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }

	
	constructor( params )
	{
		super( params );
		
		
		this._hmax = 140;
		this._hea = this._hmax;
		this._pull_timer = 50; // Timer for pulling it's enemies towards it
		this._tenta_target = null;

		this.tenta_tim = 0;
		this.tenta_x = 0;
		this.tenta_y = 0;
		this._current_target = null;

		this._attached_to = params._attached_to || null; // To what flesh block is this attached to? It should die only when it's
		
		this.side = params.side || 0; // 0-3. Random 90 degree directions it should be attached to flesh.
		
		//this.filter = 'none';
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_attached_to' );
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.driver_of )
		character = character.driver_of;
		
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( ( character.hea || character._hea ) > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdFleshGrabber.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target._is_being_removed ||
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D( this._current_target.x,this._current_target.y,this.x,this.y ) )
			{
				//if ( !this._current_target )
				//sdSound.PlaySound({ name:'abomination_alert', x:this.x, y:this.y });
			
				this._current_target = character;
				
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
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
	
		dmg = Math.abs( dmg );

		if ( initiator !== null )
		this._current_target = initiator;
		
		let was_alive = this._hea > 0;
		
		this._hea = Math.min( this._hea - dmg, this._hmax );
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		if ( this._hea <= 0 && was_alive )
		{
			this.remove();
			//this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
		}
		
	}
	
	get mass() { return 350; } // 75
	Impulse( x, y )
	{
		//this.sx += x / this.mass;
		//this.sy += y / this.mass;
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
		if ( sdWorld.is_server )
		{
			if ( !this._attached_to || this._attached_to._is_being_removed )
			this.remove();
		}
		{
			
			//if ( this._tenta_target )
			//if ( this._tenta_target._is_being_removed )
			//this._tenta_target = null;

			if ( this.tenta_tim > 0 && this._tenta_target )
			{
				if ( this._tenta_target._is_being_removed || !this._tenta_target.IsTargetable() )
				{
					this._tenta_target = null;
				}
				else
				{
					let dist_att = sdWorld.Dist2D_Vector( this._tenta_target.x - this.x, this._tenta_target.y - this.y );
					let has_sight = false;
					if ( sdWorld.CheckLineOfSight( this.x, this.y, this._tenta_target.x, this._tenta_target.y, this._tenta_target, null, sdCom.com_creature_attack_unignored_classes ) )
					has_sight = true;
					else
					this._tenta_target = null;
					if ( dist_att < 150 && has_sight )
					{
						let old_tenta_tim = this.tenta_tim;

						this.tenta_tim = Math.max( 0, this.tenta_tim - GSPEED * 2 );

						if ( this._tenta_target )
						if ( this._tenta_target._is_being_removed )
						this._tenta_target = null;

						if ( this._tenta_target )
						if ( this.tenta_tim < 90 && old_tenta_tim >= 90 )
						sdSound.PlaySound({ name:'tentacle_end', x:this._tenta_target.x, y:this._tenta_target.y });

						if ( this._tenta_target && this.tenta_tim > 10 && this.tenta_tim < 90 )
						{
							if ( typeof this._tenta_target.sx !== 'undefined' ) // Is it an entity
							this._tenta_target.sx += - this.tenta_x / 100; // Pull it in
							//else
							//this.sx += this.tenta_x / 100; // Pull itself towards the static entity

							if ( typeof this._tenta_target.sy !== 'undefined' )
							this._tenta_target.sy += - this.tenta_y / 100;
							//else
							//this.sy += this.tenta_y / 100; // Pull itself towards the entity

							if ( this._tenta_target.IsPlayerClass() )
							this._tenta_target.ApplyServerSidePositionAndVelocity( true, - this.tenta_x / 100, - this.tenta_y / 100 );

							this.tenta_x = this._tenta_target.x - this.x;
							this.tenta_y = this._tenta_target.y - this.y;
						}
					}
				}
			}
			else
			if ( this.tenta_tim > 0 )
			this.tenta_tim = Math.max( 0, this.tenta_tim - GSPEED * 2 );

			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hmax, this._hea + GSPEED / 10 );

			if ( this._pull_timer > 0 )
			this._pull_timer = Math.max( 0, this._pull_timer - GSPEED );
			
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || this._current_target.is( sdBlock ) )
				this._current_target = null;
				else
				if ( this._pull_timer <= 0 )
				{

					//let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 170 );
					let from_entity;
					//let dist_att = sdWorld.Dist2D_Vector( this._current_target.x - this.x, this._current_target.y - this.y );
					//if ( dist_att < 150 )
					if ( sdWorld.inDist2D_Boolean( this._current_target.x, this._current_target.y, this.x, this.y, 150 ) )
					{
						from_entity = this._current_target;
						this._pull_timer = 50;

						let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
						let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

						if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
						{
							from_entity.DamageWithEffect( 10, this );
							this._hea = Math.min( this._hmax, this._hea + 15 );


							from_entity.PlayDamageEffect( xx, yy ); // Should pulling entities display this effect?

							this.tenta_x = xx - this.x;
							this.tenta_y = yy - this.y;
							this.tenta_tim = 100;
							this._tenta_target = from_entity;

							sdSound.PlaySound({ name:'tentacle_start', x:this.x, y:this.y, volume: 0.5 });


							if ( typeof from_entity.sx !== 'undefined' ) // Is it an entity
							from_entity.sx += - this.tenta_x / 100; // Pull it in

							if ( typeof from_entity.sy !== 'undefined' )
							from_entity.sy += - this.tenta_y / 100;

							if ( from_entity.IsPlayerClass() )
							from_entity.ApplyServerSidePositionAndVelocity( true, - this.tenta_x / 100, - this.tenta_y / 100 );

							let di = sdWorld.Dist2D_Vector( this.tenta_x, this.tenta_y );
							if ( di > 0 )
							from_entity.Impulse( this.tenta_x / di * 20, this.tenta_y / di * 20 );
						}
					}
					else
					this._current_target = null;
				}
			}
		}
		
		if ( !this._current_target && !( this._tenta_target && this.tenta_tim > 0 ) )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.death_anim === 0 )
		//sdEntity.Tooltip( ctx, "Flesh grabber" );
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		let yy = 0;
		{
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
						//ctx.scale( this.side, 1 );
						ctx.rotate( Math.PI / 2 - Math.atan2( this.tenta_x, this.tenta_y ) );
						ctx.drawImageFilterCache( sdFleshGrabber.img_grab, xx * 32, yy * 32, 32,32, 0, -16, di,32 );
					}
				    ctx.restore();
				}
			}
			
		}
		if ( this.side === 1 )
		ctx.rotate( 270 * Math.PI / 180 );
		if ( this.side === 2 )
		ctx.rotate( Math.PI );
		if ( this.side === 3 )
		ctx.rotate( 90 * Math.PI / 180 );
		ctx.drawImageFilterCache( sdFleshGrabber.img_flesh, - 16, - 16, 32, 32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}

	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		/*if ( sdWorld.is_server )
		if ( this.death_anim < sdFleshGrabber.death_duration + sdFleshGrabber.post_death_ttl ) // not gone by time
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
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD, hue:this.GetBleedEffectHue() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
			}
		}*/
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}

}
//sdFleshGrabber.init_class();

export default sdFleshGrabber;