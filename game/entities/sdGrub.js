
// Idea & implementation by Booraz149 ( https://github.com/Booraz149 )

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';

import sdBlock from './sdBlock.js';

class sdGrub extends sdEntity
{
	static init_class()
	{
		sdGrub.img_grub = sdWorld.CreateImageFromFile( 'sdGrub' );
		/*
		sdGrub.img_grub_idle1 = sdWorld.CreateImageFromFile( 'grub_idle' );
		sdGrub.img_grub_walk1 = sdWorld.CreateImageFromFile( 'grub_walk1' );
		sdGrub.img_grub_walk2 = sdWorld.CreateImageFromFile( 'grub_walk2' );
		
		
		sdGrub.death_imgs = [
			sdWorld.CreateImageFromFile( 'grub_death1' ),
			sdWorld.CreateImageFromFile( 'grub_death2' ),
			sdWorld.CreateImageFromFile( 'grub_death3' ),
			sdWorld.CreateImageFromFile( 'grub_death4' )
		];
		*/
		sdGrub.death_duration = 20;
		sdGrub.post_death_ttl = 120;
		
		sdGrub.max_seek_range = 1000;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -6; }
	get hitbox_y2() { return 3; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 200; // Still can kill new players at 300 if player does not run away or does not have medikit // 500
		this._hea = this._hmax;
		this._move_timer = 30; // Timer used for moving when unprovoked
		this.idle = 0;
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this.time_since_jump = 0;
		//this.last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		this._last_stand_when = 0;
		
		this.side = 1;
		
		this.blinks = [ 0, 0, 0 ];
		
		//this.filter = 'none';
		
		this._hibernation_check_timer = 30;
		
		this._last_speak = 0;
		this._speak_id = -1; // Required by speak effects // last voice message
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea !== this._hmax )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdGrub.max_seek_range )
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
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		//return 'hue-rotate(-55deg)' + 'brightness(2)';
		return 'brightness(2)';
	}
	GetBleedEffectHue()
	{
		return -55;
	}
	CanBuryIntoBlocks()
	{
		return 1; // 0 = no blocks, 1 = natural blocks, 2 = corruption, 3 = flesh blocks	
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		
		let was_alive = this._hea > 0;
		
		if ( this._hea <= 0 )
		dmg = Math.abs( dmg ); // Prevent healing after death
			
		this._hea = Math.min( this._hea - dmg, this._hmax ); // Allow healing
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			this.idle = 1;
			//if ( initiator )
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 30; } // 75
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
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdGrub.death_duration + sdGrub.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		{
			this.time_since_jump = Math.min( 1000 / 1000 * 30, this.time_since_jump + GSPEED );

			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hmax, this._hea + GSPEED / 10 );
			
			if ( this._hea < this._hmax && this._hea > 0 ) // If provoked then move
			{
				if ( this._current_target )
				{
					if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible() || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdGrub.max_seek_range + 32 )
					this._current_target = null;
					else
					{
						this.side = ( this._current_target.x > this.x ) ? 1 : -1;

						if ( this.time_since_jump > 100 / 1000 * 30 )
						if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
						{
							//this.last_jump = sdWorld.time;
							this.time_since_jump = 0;
							sdSound.PlaySound({ name:'slug_jump', x:this.x, y:this.y, volume: 0.25, pitch: 2 });

							let dx = ( this._current_target.x - this.x );
							let dy = ( this._current_target.y - this.y );

							//dy -= Math.abs( dx ) * 0.5;

							if ( dx > 0 )
							dx = 3;
							else
							dx = -3;

							if ( dy > 0 )
							dy = -1;
							else
							dy = -3;

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
			if ( sdWorld.is_server ) // Do not let client assume random stuff
			if ( this._hea === this._hmax )
			{
				/*for ( let i = 0; i < 3; i++ )
				{
					if ( this.blinks[ i ] )
					{
						if ( Math.random() < 0.01 )
						this.blinks[ i ] = 0;
					}
					else
					{
						if ( Math.random() < 0.005 )
						this.blinks[ i ] = 1;
					}
				}*/
				
				if ( this._move_timer > 0 )
				this._move_timer -= 1 * GSPEED;
				else
				{
					this.side = ( Math.random() > 0.5 ) ? 1 : -1;
					
					if ( Math.random() > 0.7 )
					this.idle = ( Math.random() > 0.7 ) ? 0 : 1;
				
					this._move_timer = 120;
				}

				if ( this.idle === 0 )
				//if ( this.last_jump < sdWorld.time - 100 )
				if ( this.time_since_jump > 100 / 1000 * 30 )
				//if ( this._last_stand_on )
				//if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
				//if ( in_water || ( sdWorld.time < this._last_stand_when + 50 || ( this._phys_sleep <= 0 && !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) ) ) ) // CanMoveWithoutOverlap can be heavy operation
				if ( in_water || ( ( sdWorld.time < this._last_stand_when + 50 || this._phys_sleep <= 0 ) && ( !this.CanMoveWithoutOverlap( this.x, this.y + 3, 1 ) && this.CanMoveWithoutOverlap( this.x + this.side * 9, this.y - 9, 2 ) ) ) ) // CanMoveWithoutOverlap can be heavy operation
				{
					//this.last_jump = sdWorld.time;
					this.time_since_jump = 0;
							
					sdSound.PlaySound({ name:'slug_jump', x:this.x, y:this.y, volume: 0.25, pitch: 2 });

					let dx = this.side;
					let dy = 0;

					if ( dx > 0 )
					dx = 2;
					else
					dx = -2;

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
		
		if ( this._hea < this._hmax && this._hea > 0 ) // If provoked then become hostile
		//if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 500 )
		{
			let nears = sdWorld.GetAnythingNear( this.x, this.y, 12 );
			let from_entity;
				
			sdWorld.shuffleArray( nears );
			
			let max_targets = 3;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

				if ( from_entity.GetClass() === 'sdCharacter' ||
					 from_entity.GetClass() === 'sdVirus' ||
					 from_entity.GetClass() === 'sdAsp' ||
					 from_entity.GetClass() === 'sdBlock' ||
					 from_entity.GetClass() === 'sdQuickie' )
				if ( from_entity.IsTargetable() )
				{
					this._last_bite = sdWorld.time;
				if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdDoor' )
				{
					from_entity.DamageWithEffect( 30, this );
				}
				else
				from_entity.DamageWithEffect( 25, this );
					
					//this._hea = Math.min( this._hmax, this._hea + 3 );

					from_entity.PlayDamageEffect( xx, yy );
					//sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
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
+					this.AttemptBlockBurying(); // Attempt to hibernate inside nearby blocks
				}
			}
		}
	}
	get title()
	{
		return 'Grub';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );

		let xx = 0;
		let yy = 0;
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdGrub.death_duration + sdGrub.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}

			xx = Math.min( 4 - 1, ~~( ( this.death_anim / sdGrub.death_duration ) * 4 ) );
			yy = 1;
			
			//let frame = Math.min( sdGrub.death_imgs.length - 1, ~~( ( this.death_anim / sdGrub.death_duration ) * sdGrub.death_imgs.length ) );
			//ctx.drawImageFilterCache( sdGrub.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			//if ( Math.abs( this.sx ) < 2 )
			//if ( sdWorld.time < this.last_jump + 400 ) // This approach would work better for in-place jumps
			if ( this.time_since_jump < 400 / 1000 * 30 )
			{
				xx = Math.min( ( this.time_since_jump < 200 / 1000 * 30 ) ? 1 : 2 );
				//ctx.drawImageFilterCache( ( this.time_since_jump < 200 / 1000 * 30 ) ? sdGrub.img_grub_walk1 : sdGrub.img_grub_walk2, - 16, - 16, 32,32 );
				//ctx.drawImageFilterCache( ( sdWorld.time < this.last_jump + 200 ) ? sdGrub.img_grub_walk1 : sdGrub.img_grub_walk2, - 16, - 16, 32,32 );
			}
			else
			{
				xx = 0;
				//ctx.drawImageFilterCache( sdGrub.img_grub_idle1, - 16, - 16, 32,32 );
				
				/*for ( let i = 0; i < 3; i++ )
				if ( this.blinks[ i ] )
				ctx.drawImageFilterCache( sdGrub.img_slug_blinks[ i ], - 16, - 16, 32,32 );*/
			}
		}

		ctx.drawImageFilterCache( sdGrub.img_grub, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );
		
		ctx.globalAlpha = 1;
		//ctx.filter = 'none';
	}

	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdGrub.death_duration + sdGrub.post_death_ttl ) // not gone by time
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
	/*ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'PAT' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
					if ( this._hea >= this._hmax )
					if ( sdWorld.time > ( this._last_speak || 0 ) + 1000 )
					{
						this._last_speak = sdWorld.time;

						let params = { 
							x:this.x, 
							y:this.y - 36, 
							type:sdEffect.TYPE_CHAT, 
							attachment:this, 
							attachment_x: 0,
							attachment_y: -36,
							text: '?',
							voice: {
								wordgap: 0,
								pitch: 100,
								speed: 150,
								variant: 'f1'
							} 
						};

						params.text = Math.random() < 0.5 ? 'uwu' : 'owo';

						sdWorld.SendEffect( params );
					}
				}
				else
				executer_socket.SDServiceMessage( 'Slug is too far' );
			}
		}
	}*/
	/*PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( this._hea >= this._hmax )
			this.AddContextOption( 'Give pats', 'PAT', [] );
		}
	}*/
}
//sdGrub.init_class();

export default sdGrub;