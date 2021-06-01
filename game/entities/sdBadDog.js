
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCharacter from './sdCharacter.js';

import sdBlock from './sdBlock.js';

class sdBadDog extends sdEntity
{
	static init_class()
	{
		sdBadDog.img_bad_dog_anim = sdWorld.CreateImageFromFile( 'sdBadDog' );
		sdBadDog.img_bad_dog_armored_anim = sdWorld.CreateImageFromFile( 'sdBadDog_armored' );
		
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
		
		//sdBadDog.retreat_hp_mult = 0.5;
		
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
		
		this.hmax = 200;
		this.hea = this.hmax;

		this.type = 0;
		
		this._retreat_hp_mult = 0.5; // Goes closer to 1 each time and at some point makes creature friendly?
		
		this.master = null;
		this.owned = 0; // Server sets this to true because this.master will be null in most cases for lost dogs
		
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
		
		this._regen_timeout = 0;
		
		this.side = 1;

		this.SetMethod( 'MasterDamaged', this.MasterDamaged );
		this.SetMethod( 'MasterRemoved', this.MasterRemoved );
		
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( !this.master )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdBadDog.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
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
	
		//dmg = Math.abs( dmg );
		
		//let was_alive = this.hea > 0;
		let old_hp = this.hea;
		
		if ( dmg > 0 || !this.master || initiator !== this.master )
		{
			this.hea -= Math.abs( dmg );
			
			this._regen_timeout = 30;

			if ( initiator )
			if ( initiator !== this.master )
			this._current_target = initiator;
		}
		else
		{
			// Only if this.master is set and healed by master
			
			if ( this.hea <= 0 )
			{
				this.hea = 0;
				this.death_anim = 0;
			}
			this.hea = Math.min( this.hea + Math.abs( dmg ), this.hmax );
			return;
		}
		
		if ( this.hea <= 0 && old_hp > 0 )
		{
			sdSound.PlaySound({ name:'bad_dog_death', x:this.x, y:this.y, volume: 0.5 });

			if ( this.master )
			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 5;
		}
		else
		if ( this.hea > 0 )
		{
			if ( this.hea < this.hmax * this._retreat_hp_mult && old_hp >= this.hmax * this._retreat_hp_mult && ( !this.master || this.master._is_being_removed ) )
			{
				sdSound.PlaySound({ name:'bad_dog_retreat', x:this.x, y:this.y, volume: 0.2 });
				
				//if ( this._retreat_hp_mult < 1 || !this.master || this.master._is_being_removed )
				{
					this._retreat_hp_mult = Math.min( 1, this._retreat_hp_mult + 0.2 );

					if ( this._retreat_hp_mult >= 1 )
					if ( initiator && initiator.is( sdCharacter ) )
					{
						this.master = initiator;
						
						this._current_target = null;
					}
				}
			}
			else
			{
				if ( this.hurt_anim <= 0 )
				sdSound.PlaySound({ name:'bad_dog_hurt', x:this.x, y:this.y, volume: 0.75 });
			}
			
			this.hurt_anim = 5;
		}
		
		if ( this.hea < -this.hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 40; }
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
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return this.master ? [ 'sdCharacter' ] : null;
	}*/
	

	MasterDamaged( damaged_ent, dmg2, initiator2 )
	{
		if ( this.master === damaged_ent )
		if ( initiator2 )
		if ( initiator2 !== this.master )
		if ( dmg2 > 0 )
		if ( initiator2 !== this )
		this._current_target = initiator2;
	}

	MasterRemoved( removed_ent )
	{
		if ( sdWorld.is_server )
		{
			this.master.removeEventListener( 'DAMAGE', this.MasterDamaged );
			this.master.removeEventListener( 'REMOVAL', this.MasterRemoved );
		}

		if ( this.master === removed_ent )
		this.master = null;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( sdWorld.is_server )
		{
			this.bites = ( sdWorld.time < this._last_bite + 75 ) ? 1 : 0;
			this.jumps = ( sdWorld.time < this._last_jump + 200 ) ? 1 : 0;
			
			this.owned = this.master ? 1 : 0;
		}
		
		if ( this.hea <= 0 )
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
			if ( this.hea < this.hmax )
			{
				this._regen_timeout -= GSPEED;
				if ( this._regen_timeout < 0 )
				{
					this.hea = Math.min( this.hmax, this.hea + GSPEED * ( this.master ? 30 : 5 ) / 30 );
				}
			}
		
			if ( this.hurt_anim > 0 )
			this.hurt_anim -= GSPEED;
		
			if ( this.master )
			{
				if ( sdWorld.is_server )
				{
					if ( !this.master.hasEventListener( 'DAMAGE', this.MasterDamaged ) ) // Will happen on world load since events are not saved
					{
						this.master.addEventListener( 'DAMAGE', this.MasterDamaged );
						this.master.addEventListener( 'REMOVAL', this.MasterRemoved );
					}
				}

						
						
				if ( sdWorld.Dist2D( this.x, this.y, this.master.x, this.master.y ) > ( this._current_target ? 300 : 100 ) )
				{
					this._current_target = this.master;
				}
				else
				{
					if ( this._current_target === this.master )
					{
						this._current_target = null;
					}
				}
			}
			
			if ( sdWorld.is_server )
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || ( this._current_target.master && this._current_target.master === this.master ) || ( this._current_target.hea || this._current_target._hea ) <= 0 || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdBadDog.max_seek_range + 32 )
				this._current_target = null;
				else
				{
					this.side = ( this._current_target.x > this.x ) ? 1 : -1;

					if ( !this.master )
					if ( this.hea < this.hmax * this._retreat_hp_mult )
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

							if ( !this.master )
							if ( this.hea < this.hmax * this._retreat_hp_mult )
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

							if ( !this.master )
							if ( this.hea < this.hmax * this._retreat_hp_mult )
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
			
			if ( this.hea > 0 )
			this.sy -= sdWorld.gravity * GSPEED * 2;
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, ( this.death_anim === 0 && this._current_target ) ? 10 : 0, true );
		
		if ( this.death_anim === 0 )
		if ( this._current_target && this._current_target !== this.master )
		if ( this._last_bite < sdWorld.time - 100 )
		{
			let nears;
			let from_entity;
			
			let range = 12;
			
			if ( this.master )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, this._current_target.x, this._current_target.y, range + 15 ) )
				nears = [ this._current_target ];
				else
				nears = [];
			}
			else
			{
				nears = sdWorld.GetAnythingNear( this.x, this.y, range );
				sdWorld.shuffleArray( nears );
			}
			
			let max_targets = 1;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

				if ( from_entity.GetClass() === 'sdCharacter' || this.master )
				if ( from_entity.IsTargetable() )
				{
					this._last_bite = sdWorld.time;
					
					if ( typeof from_entity.sx === 'number' && typeof from_entity.sy === 'number' )
					{
						this.sx = from_entity.sx;
						this.sy = from_entity.sy;
					}
					
					if ( this._last_bite_sound < sdWorld.time - 500 )
					{
						from_entity.Damage( 25, this );
						sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
						this.hea = Math.min( this.hmax, this.hea + 25 );
					
						this._last_bite_sound = sdWorld.time;
						sdSound.PlaySound({ name:'bad_dog_attack', x:this.x, y:this.y, volume: 0.5 });
					}
					
					
					if ( from_entity.is( sdCharacter ) )
					{
						from_entity.tilt = Math.PI / 2 * this.side * 100;
						from_entity.tilt_speed = 0;
						if ( from_entity.flying )
						from_entity.flying = false;
					}
					
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
		sdEntity.Tooltip( ctx, this.owned ? ( this.master ? sdEntity.GuessEntityName( this.master._net_id ) : 'Someone') + "'s Bad Dog" : "Bad Dog" );
	
		if ( this.death_anim < 20 )
		if ( this.owned )
		{
			let w = 20;
			
			let snap_frame = ( ~~( this.death_anim / 10 ) ) * 10 / 20;
			
			ctx.globalAlpha = ( 1 - snap_frame ) * 0.5;
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );
			
			ctx.globalAlpha = 1 - snap_frame;
			
			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		}
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
		if ( this.type === 0 )
		ctx.drawImageFilterCache( sdBadDog.img_bad_dog_anim, frame*32,0,32,32, - 16, - 16, 32,32 );
		if ( this.type === 1 )
		ctx.drawImageFilterCache( sdBadDog.img_bad_dog_armored_anim, frame*32,0,32,32, - 16, - 16, 32,32 );
		
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
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
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
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'PAT' || command_name === 'ARMOR' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
				}
				else
				{
					executer_socket.SDServiceMessage( 'Bad Dog is too far' );
					return;
				}
			}
			
			if ( command_name === 'PAT' )
			{
				if ( this.master )
				{
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
								pitch: 0,
								speed: 150,
								variant: 'klatt'
							} 
						};

						if ( this.master === exectuter_character )
						params.text = 'Aw, thanks man';
						else
						params.text = 'Thanks, but I only accept pats from ' + this.master.title;

						sdWorld.SendEffect( params );
					}
				}
			}
			
			if ( command_name === 'DISOWN' )
			{
				if ( this.master === exectuter_character )
				{
					//this.master = null;
					this.MasterRemoved( this.master );
				}
			}

			if ( command_name === 'ARMOR' )
			{
				if ( this.master === exectuter_character )
				{
					if ( this.master.matter >= 500 )
					{
						if ( this.type !== 1 )
						{
							if ( this.type === 0 )
							{
								this.type = 1; // Small armored baddog
								this.master.matter -= 500;
								this.hmax += 200;
								this.hea += 200;
							}
						}
						else
						executer_socket.SDServiceMessage( 'The dog is already armored' );
					}
					else
					executer_socket.SDServiceMessage( 'Not enough matter' );
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( this.master )
			{
				this.AddContextOption( 'Give pats', 'PAT', [] );
		
				if ( this.master === exectuter_character )
				this.AddContextOption( 'Stop following me', 'DISOWN', [] );

				if ( this.master === exectuter_character )
				if ( this.type === 0 )
				this.AddContextOption( 'Build armor for the dog (500 matter)', 'ARMOR', [] );
			}
		}
	}
}
//sdBadDog.init_class();

export default sdBadDog;