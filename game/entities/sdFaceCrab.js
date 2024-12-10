/*

	Color-shifting crabs that land on the face of attacker or player

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdBullet from './sdBullet.js';
import sdWater from './sdWater.js';

import sdBlock from './sdBlock.js';
import sdCom from './sdCom.js';
import sdCharacter from './sdCharacter.js';
import sdRescueTeleport from './sdRescueTeleport.js';


class sdFaceCrab extends sdEntity
{
	static init_class()
	{
		sdFaceCrab.img_face_crab = sdWorld.CreateImageFromFile( 'face_crab' );

		sdFaceCrab.death_duration = 20;
		sdFaceCrab.post_death_ttl = 90;
		
		sdFaceCrab.max_seek_range = 800;
		
		sdFaceCrab.ignored_classes_when_stuck = [ 'sdFaceCrab', 'sdCharacter' ];
		sdFaceCrab.ignored_classes_when_not_stuck = [ 'sdCharacter' ];
		
		sdFaceCrab.all_face_crabs = [];

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.attached_to ? -4 : -7; }
	get hitbox_x2() { return this.attached_to ?  4 :  7; }
	get hitbox_y1() { return this.attached_to ? -6 : -3; }
	get hitbox_y2() { return 4; }
	
	get hard_collision() // For world geometry where players can walk
	{ return ( this.death_anim === 0 && this.attached_to === null ); }
	
	GetIgnoredEntityClasses()
	{
		return this._physically_stuck_timer > 0 ? sdFaceCrab.ignored_classes_when_stuck : sdFaceCrab.ignored_classes_when_not_stuck;
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 60;
	
		this._hea = this._hmax;
	
		this.death_anim = 0;
		
		this._current_target = null;
		
		this.attached_to = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		
		this.hue = ( sdWorld.mod( this.x / 16, 360 ) );
		this.target_hue = this.hue;
		
		this._physically_stuck_timer = 0;
		
		this._hibernation_check_timer = 30; // Timer which checks if hibernating in an empty block is possible ( if crab did not attack anything past a certain time )
		
		//this.side = 1;

		this.filter = null;
		
		sdFaceCrab.all_face_crabs.push( this );
	}
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( this.attached_to )
		if ( by_entity )
		if ( !this.attached_to.IsPlayerClass() || ( sdWorld.time % 5 > 0 ) ) // Decreased hit chance for players, no hit chance for creatures
		{
			if ( by_entity.is( sdBullet ) )
			{
				if ( by_entity._wave || by_entity.is_grenade )
				{
				}
				else
				if ( by_entity._owner === this.attached_to )
				return false;
			}
			else
			if ( by_entity === this.attached_to )
			return false;
		}
		
		return true;
	}
	CanBuryIntoBlocks()
	{
		return 1; // 0 = no blocks, 1 = natural blocks, 2 = corruption, 3 = flesh blocks	
	}
	
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.driver_of )
		character = character.driver_of;
		
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( ( character.hea || character._hea ) > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdFaceCrab.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea || 0 ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;
				
				sdSound.PlaySound({ name:'quickie_alert', x:this.x, y:this.y, volume: 0.2, pitch: 0.75});
				
			}
		}
	}
	
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
		//return sdEffect.TYPE_WALL_HIT;
	}
	GetBleedEffectFilter()
	{
		//if ( this._tier === 1 )
		return 'hue-rotate('+( this.hue - 150 )+'deg)';
	
		return '';
	}
	
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( initiator )
		this._current_target = initiator;
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });

			//if ( initiator )
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
		}
		
		if ( this._hea < -this._hmax / 80 * 100 ) 
		this.remove();
	}
	
	get mass() { return 25; }
	Impulse( x, y )
	{
		if ( !this.attached_to )
		{
			this.sx += x / this.mass;
			this.sy += y / this.mass;
		}
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
	onThinkFrozen( GSPEED )
	{
		super.onThinkFrozen( GSPEED );
		
		this.attached_to = null;
	}
	onPhysicallyStuck()
	{
		this._physically_stuck_timer = 30;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( this.attached_to )
		{
			if ( !this.attached_to._is_being_removed && this.attached_to.IsPlayerClass() && this.attached_to.driver_of && this.attached_to.driver_of.is( sdRescueTeleport ) )
			{
				// Do not follow into the cloner
				
				this._current_target = null;
				this.attached_to = null;
			}
			else
			if ( this._hea <= 0 || in_water || this.attached_to._is_being_removed || ( this.attached_to.hea || this.attached_to._hea || 0 ) <= 0 )
			{
				if ( in_water )
				{
					this.y = this.attached_to.y + this.attached_to._hitbox_y1 - this._hitbox_y2;
				}
				else
				if ( this._current_target === this.attached_to )
				this._current_target = null;
			
				this.attached_to = null;
			}
			else
			{
				this.x = this.attached_to.x + ( this.attached_to._hitbox_x1 + this.attached_to._hitbox_x2 ) / 2;
				this.y = this.attached_to.y + this.attached_to._hitbox_y1;
				this.sx = this.attached_to.sx || 0;
				this.sy = this.attached_to.sy || 0;
			}
		}
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdFaceCrab.death_duration + sdFaceCrab.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		{
			if ( this._physically_stuck_timer > 0 )
			this._physically_stuck_timer -= GSPEED;

			this.hue = sdWorld.MorphWithTimeScale( this.hue, this.target_hue, 0.95, GSPEED );
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdFaceCrab.max_seek_range + 32 )
				this._current_target = null;
				else
				{
					//this.side = ( this._current_target.x > this.x ) ? 1 : -1;

					if ( this._last_jump < sdWorld.time - 100 )
					//if ( this._last_stand_on )
					if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
					{
						this._last_jump = sdWorld.time;

						let dx = ( this._current_target.x - this.x );
						let dy = ( this._current_target.y - this.y );

						let di = sdWorld.Dist2D_Vector( dx, dy );

						if ( di < 80 )
						{
							dy -= Math.abs( dx ) * 0.5;

							if ( di > 5 )
							{
								dx /= di;
								dy /= di;

								dx *= 5;
								dy *= 5;
							}
						}
						else
						{
							if ( dx > 0 )
							dx = 1;
							else
							dx = -1;

							if ( dy > 0 )
							dy = 1;
							else
							dy = -1;
						}

						this.sx = dx;
						this.sy = dy;

						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
		}
		
		if ( this.attached_to )
		{
		}
		else
		{
			if ( in_water )
			{
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );

				if ( this._hea > 0 )
				this.sy -= sdWorld.gravity * GSPEED * 2;
			}

			this.sy += sdWorld.gravity * GSPEED;

			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		
		if ( this.death_anim === 0 )
		if ( this._current_target || this.attached_to )
		if ( this._last_bite < sdWorld.time - 500 )
		{
			let nears = this.attached_to ? [ this.attached_to ] : sdWorld.GetAnythingNear( this.x, this.y, 10 );
			let from_entity;
				
			sdWorld.shuffleArray( nears );
			
			let max_targets = 1;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
				
				if ( from_entity.is( sdBlock ) )
				{
					//this.hue = from_entity.hue;//( sdWorld.mod( sdWorld.camera.x / 16, 360 ) );
					this.target_hue = from_entity.hue + 40;
				}
					
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

				if ( !from_entity.is( sdFaceCrab ) )
				if ( from_entity === this._current_target || from_entity.IsPlayerClass() || ( from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN || from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD ) )
				if ( from_entity.IsTargetable() || ( this.attached_to && from_entity.driver_of ) )
				if ( this.attached_to || sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
				{
					this._last_bite = sdWorld.time;
					
					from_entity.DamageWithEffect( 15, this );
					
					this._hea = Math.min( this._hmax, this._hea + ( 7 ) );

					from_entity.PlayDamageEffect( xx, yy );
					//sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					if ( !this.attached_to )
					{
						//if ( !from_entity._god )
						if ( ( from_entity.hea || from_entity._hea || 0 ) > 0 )
						{
							let allowed_to_grab = true;
							
							for ( let i2 = 0; i2 < sdFaceCrab.all_face_crabs.length; i2++ )
							if ( sdFaceCrab.all_face_crabs[ i2 ].attached_to === from_entity )
							{
								allowed_to_grab = false;
								break;
							}
							
							if ( allowed_to_grab )
							this.attached_to = from_entity;
						}
					}
					else
					{
						if ( Math.random() < 0.3 )
						if ( from_entity.IsPlayerClass() )
						{
							if ( from_entity.is( sdCharacter ) )
							{
								from_entity.Say( [ 
									'Aaaaa it is on my face!',
									'Aaaaa!',
									'It bites me!',
									'Who turned the lights off?',
									'There is something hostile on my head!'
								][ ~~( Math.random() * 5 ) ] );
							}
							else
							{
								from_entity.Say( [ 
									'Aaaaa it is on me!',
									'Aaaaa!',
									'It bites me!',
									'Who turned the lights off?',
									'There is something hostile on me!'
								][ ~~( Math.random() * 5 ) ] );
							}
						}
					}
					
					max_targets--;
					if ( max_targets <= 0 )
					break;
				}
			}
		}
		
		if ( sdWorld.is_server )
		{
			if ( this._last_bite < sdWorld.time - ( 1000 * 60 * 3 ) ) // 3 minutes since last attack?
			{
				this._hibernation_check_timer -= GSPEED;
				
				if ( this._hibernation_check_timer < 0 )
				{
					this._hibernation_check_timer = 30 * 30; // Check if hibernation is possible every 30 seconds
					this.AttemptBlockBurying(); // Attempt to hibernate inside nearby blocks
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Face crab" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		ctx.sd_hue_rotation = this.hue;
		//ctx.scale( this.side, 1 );
		
		let frame = 0;
		
		if ( this.attached_to )
		{
			frame = 5;
			
			if ( this.attached_to.is( sdCharacter ) )
			if ( this.attached_to._ragdoll )
			if ( this.attached_to._ragdoll.head )
			{
				ctx.translate( this.attached_to._ragdoll.head.x - this.x, this.attached_to._ragdoll.head.y - this.y );
			}
		}
		else
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdFaceCrab.death_duration + sdFaceCrab.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			frame = 6 + Math.min( 3, ~~( ( this.death_anim / sdFaceCrab.death_duration ) * 4 ) );
		}
		else
		{
			/*if ( Math.abs( this.sx ) < 2 )
			ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdFaceCrab.img_quickie_idle1 : sdFaceCrab.img_quickie_idle2, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdFaceCrab.img_quickie_walk1 : sdFaceCrab.img_quickie_walk2, - 16, - 16, 32,32 );*/
				
			if ( Math.abs( this.sx ) > 0.5 )
			{
				frame = ~~( ( sdWorld.time / 100 ) % 4 );
			}
		}
		
		ctx.drawImageFilterCache( sdFaceCrab.img_face_crab, frame*32,0,32,32, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
	}
	
	onRemoveAsFakeEntity()
	{
		sdFaceCrab.all_face_crabs.splice( sdFaceCrab.all_face_crabs.indexOf( this ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	
		if ( sdWorld.is_server )
		if ( this.death_anim < sdFaceCrab.death_duration + sdFaceCrab.post_death_ttl ) // not gone by time
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
//sdFaceCrab.init_class();

export default sdFaceCrab;