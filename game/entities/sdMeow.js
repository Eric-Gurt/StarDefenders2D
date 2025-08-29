
/* global sdShop */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdWater from './sdWater.js';
import sdBullet from './sdBullet.js';

import sdBlock from './sdBlock.js';

class sdMeow extends sdEntity
{
	static init_class()
	{
		sdMeow.img = sdWorld.CreateImageFromFile( 'sdMeow' );

		sdMeow.max_seek_range = 350;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7.9; }
	get hitbox_x2() { return 7.9; }
	get hitbox_y1() { return -7.9; }
	get hitbox_y2() { return 7.9; }
	
	get hard_collision() // For world geometry where players can walk
	{ return ( this.is_dead === 0 ); }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 1200;
		this._hea = this._hmax;
		
		this.is_dead = 0;
		
		this._anim_shift = ~~( Math.random() * 10000 );
		
		this.hunger = 0;
		this._hunger_client_side = 0;
		
		this._talk_frame_until = 0;
		
		this.current_target = null;
		
		this._next_target_lookup = 0;
		
		this.random_move_x = 0;
		this.random_move_y = 0;
		this.random_move_timer = 0;
		
		this.not_hungry_timer = 0;
		
		this.carrying = null; // Eating target
		this.eating_progress = 0; // Ends when reaches full bounding box height of an item
		
		this.side = ( Math.random() < 0.5 ) ? 1 : -1;
	}
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdMeow.max_seek_range )
			if ( this.current_target === null || 
				 ( this.current_target.hea || this.current_target._hea || 0 ) <= 0 || 
				 di < sdWorld.Dist2D(this.current_target.x,this.current_target.y,this.x,this.y) )
			{
				this.current_target = character;
			}
		}
	}*/
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
			
			if ( this.carrying )
			this.DropCrystal( this.carrying );
			
			this.is_dead = 1;
			this.PhysWakeUp();
			
			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius:140,
				damage_scale: 0 * 4.5, // 5 was too deadly on relatively far range
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this,
				color:'#c03377',
				no_smoke: true,
				shrapnel: true
			});
			
			sdSound.PlaySound({ name:'meow_death', x:this.x, y:this.y, volume: 2, pitch: 1 });
			sdSound.PlaySound({ name:'meow_explosion', x:this.x, y:this.y, volume: 2, pitch: 1 });
			
			let nades_set = new Set();
			
			let extra_filtering_method = ( e )=>
			{
				return !nades_set.has( e );
			};
			
			//let an_step = 0.25 * Math.PI;
			
			//let speed_step = 6;
			
			//let speed = 3;
			
			//for ( let an = 0; an < Math.PI * 2; an += an_step )
			//for ( let speed = 6; speed <= 3 + speed_step; speed += speed_step )
			for ( let i = 0; i < 12; i++ )
			{
				let bullet_obj = new sdBullet({ x: this.x, y: this.y });
				
				nades_set.add( bullet_obj );

				bullet_obj._owner = this;
				
				//let rand_an = an + Math.random() * an_step;
				//let rand_speed = speed + Math.random() * speed_step;
				
				let rand_an = Math.random() * Math.PI * 2;
				let rand_speed = ( 1 - Math.pow( Math.random(), 2 ) ) * 16;

				bullet_obj.sx = this.sx + Math.cos( rand_an ) * rand_speed;
				bullet_obj.sy = this.sy + Math.sin( rand_an ) * rand_speed;
				
				bullet_obj.x += Math.cos( rand_an ) * 3;
				bullet_obj.y += Math.sin( rand_an ) * 3;

				bullet_obj.explosion_radius = 20; // 15 was not deadly enough
				bullet_obj.time_left = 30 * 3 + Math.random() * 30 * 3;
				bullet_obj.model = 'meow_grenade'; 
				bullet_obj.color = sdEffect.default_explosion_color;
				bullet_obj.is_grenade = true;
				//bullet_obj._dirt_mult = 2;
				
				bullet_obj._extra_filtering_method = extra_filtering_method;

				sdEntity.entities.push( bullet_obj );
			}
		}
		
		if ( this._hea < -this._hmax * 0.2 )
		this.remove();
	}
	
	get mass() { return 70; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.is_dead )
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.98, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.98, GSPEED );
			
			if ( this.not_hungry_timer > 0 )
			this.not_hungry_timer -= GSPEED;
			
			if ( this.current_target )
			{
				if ( this.current_target._is_being_removed || ( this.current_target.hea || this.current_target._hea || 0 ) <= 0 || !sdWorld.inDist2D_Boolean( this.x, this.y, this.current_target.x, this.current_target.y, sdMeow.max_seek_range ) )
				this.current_target = null;
				else
				{
					if ( this.not_hungry_timer > 0 )
					{
					}
					else
					{
						let old_hunger = this._hunger_client_side;

						this.hunger += GSPEED * 1;
						this._hunger_client_side += GSPEED * 1;

						if ( !sdWorld.is_server || sdWorld.is_singleplayer )
						{
							if ( Math.abs( this._hunger_client_side - this.hunger ) > 100 )
							{
								old_hunger = this.hunger;
								this._hunger_client_side = this.hunger;
							}

							if ( Math.floor( Math.pow( this._hunger_client_side/1000 + 1, 8 ) ) !== Math.floor( Math.pow( old_hunger/1000 + 1, 8 ) ) )
							{
								let p = 1 + old_hunger/1000 * 2;

								sdSound.PlaySound({ name:'meow', x:this.x, y:this.y, volume: 2, pitch: p, _server_allowed:true });

								this._talk_frame_until = sdWorld.time + 400 / p;
							}
						}


						let dx = this.current_target.x - this.x;
						let dy = this.current_target.y - this.y;
						let di = sdWorld.Dist2D_Vector( dx, dy );

						let range = this.CanEatEntity( this.current_target ) ? 1 : 64;

						if ( di > range )
						{
							dx /= di;
							dy /= di;

							let speed = 0.1 + this.hunger / 700 * 0.2;

							this.sx += dx * speed * GSPEED;
							this.sy += dy * speed * GSPEED;
							this.PhysWakeUp();
						}

						this.side = ( dx > 0 ) ? 1 : -1;

						if ( sdWorld.is_server )
						if ( this.hunger >= 700 )
						{
							this.Damage( this._hea + 1 );
						}
					}
				}
			}
			else
			{
				if ( this.random_move_timer > 0 )
				{
					this.random_move_timer -= GSPEED;
					
					let speed = 0.1;
					
					this.sx += this.random_move_x * speed * GSPEED;
					this.sy += this.random_move_y * speed * GSPEED;
					this.PhysWakeUp();
				}
				if ( sdWorld.is_server )
				if ( sdWorld.time > this._next_target_lookup )
				{
					this._next_target_lookup = sdWorld.time + 100 + Math.random() * 100;
					
					let e = this.GetRandomEntityNearby( 800 );
					
					if ( e )
					if ( e.IsPlayerClass() || this.CanEatEntity( e ) ||
						 e.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN || 
						 e.GetBleedEffect() === sdEffect.TYPE_BLOOD )
					{
						this.current_target = e;
					}
					
					if ( !this.current_target )
					if ( this.random_move_timer <= 0 )
					{
						this.random_move_timer = 90 + Math.random() * 90;
						let an = Math.random() * Math.PI * 2;
						this.random_move_x = Math.sin( an );
						this.random_move_y = Math.cos( an );
						
						this.side = ( this.random_move_x > 0 ) ? 1 : -1;
					}
				}
			}
			
			if ( this.carrying )
			{
				if ( this.carrying._is_being_removed )
				this.carrying = null;
				else
				{
					let max_progress = this.carrying._hitbox_y2 - this.carrying._hitbox_y1;
					
					this.eating_progress = Math.min( this.eating_progress + GSPEED * 0.2, max_progress );

					this.carrying.x = this.x;
					this.carrying.y = this.y + this._hitbox_y2 - this.carrying._hitbox_y1 - this.eating_progress;
					
					this.carrying.DamageWithEffect( ( 0.5 + 9.5 * ( this.eating_progress / max_progress ) ) * GSPEED, this );
					
					this.hunger = 0;
					
					if ( this.current_target && this.current_target.IsPlayerClass() ) // It only makes sense for meow drone to not be hungry if players gave it food, otherwise it stays hungry
					this.not_hungry_timer = Math.max( this.not_hungry_timer, 30 * 60 * 30 ); // Not hungry for 30 minutes
					else
					this.not_hungry_timer = Math.max( this.not_hungry_timer, 30 * 5 ); // Not hungry for 5 seconds
					
					if ( !this.carrying || this.carrying._is_being_removed )
					sdSound.PlaySound({ name:'meow_purring', x:this.x, y:this.y, volume: 2 });
				}
			}
		}

		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	get title()
	{
		return 'Meow';
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( !this.is_dead )
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		if ( !sdShop.isDrawing )
		if ( !this.is_dead )
		ctx.translate( 0, Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2 );
			
		if ( this.carrying )
		{
			ctx.save();
			//ctx.translate( 0, this._hitbox_y2 - this.eating_progress ( this.carrying._hitbox_y2 - this.carrying._hitbox_y1 ) );
			ctx.translate( Math.sin( sdWorld.time / 32 * Math.PI ), this._hitbox_y2 - this.carrying._hitbox_y1 - this.eating_progress );
			this.carrying.Draw( ctx, true );
			ctx.restore();
		}
		
		if ( sdShop.isDrawing )
		ctx.scale( -1, 1 );
		else
		{
			ctx.scale( -this.side, 1 );
		}
		
		if ( !this.is_dead )
		ctx.apply_shading = false;

		let xx = 0;
		
		if ( this.is_dead )
		xx = 2;
		else
		if ( this.not_hungry_timer > 0 )
		xx = 4;
		else
		if ( this.hunger > 600 )
		xx = 3;
		else
		if ( sdWorld.time < this._talk_frame_until )
		xx = 1;

		ctx.drawImageFilterCache( sdMeow.img, xx * 32, 0, 32,32, -16, -16, 32,32 );
		
		//sdEntity.TooltipUntranslated( ctx, 'this.hunger: ' + this.hunger, 50, 0 );
	}
	CanEatEntity( from_entity )
	{
		if ( typeof from_entity.held_by !== 'undefined' )
		if ( from_entity.held_by === null )
		return true;

		return false;
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( !this.is_dead )
		if ( !this.carrying )
		if ( typeof from_entity.held_by !== 'undefined' )
		if ( from_entity.held_by === null )
		if ( from_entity._hitbox_x2 - from_entity._hitbox_x1 <= 16 )
		if ( from_entity._hitbox_y2 - from_entity._hitbox_y1 <= 32 )
		{
			this.carrying = from_entity;
			from_entity.held_by = this;
			from_entity.onCarryStart();
			
			this.eating_progress = 0;
			
			sdSound.PlaySound({ name:'meow_eating', x:this.x, y:this.y, volume: 1, pitch: 1 });
		}
	}
	DropCrystal( crystal_to_drop, initiated_by_player=false )
	{
		if ( this.carrying !== crystal_to_drop )
		return;
	
		if ( initiated_by_player ) // Damage from eating makes it true
		return;
	
		this.carrying.held_by = null;
		this.carrying.onCarryEnd();
		this.carrying = null;
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 5 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdMeow.init_class();

export default sdMeow;