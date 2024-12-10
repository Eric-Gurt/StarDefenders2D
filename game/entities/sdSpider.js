
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCharacter from './sdCharacter.js';
import sdCube from './sdCube.js';
import sdBullet from './sdBullet.js';
import sdCom from './sdCom.js';
import sdDrone from './sdDrone.js';

import sdBlock from './sdBlock.js';

class sdSpider extends sdEntity
{
	static init_class()
	{
		sdSpider.img_spider_anim = sdWorld.CreateImageFromFile( 'sdSpider' );
		sdSpider.img_minitank_anim = sdWorld.CreateImageFromFile( 'sdSpider2' );
		
		sdSpider.frame_idle1 = 0;
		sdSpider.frame_idle2 = 1;
		sdSpider.frame_walk1 = 2;
		sdSpider.frame_walk2 = 3;
		sdSpider.frame_attack = 4;
		sdSpider.frame_hurt = 5;
		sdSpider.frame_death = 6;
		sdSpider.frame_death_frames = 4;
		
		sdSpider.death_duration = 30;
		sdSpider.post_death_ttl = 150; // 90
		
		//sdSpider.retreat_hp_mult = 0.5;
		
		sdSpider.max_seek_range = 1000;
		
		sdSpider.spider_counter = 0;
		
		sdSpider.ignored_classes_alive = [];
		sdSpider.ignored_classes_dead = [ 'sdDrone', 'sdSpider' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === 1 ? -8 : -13; }
	get hitbox_x2() { return this.type === 1 ? 8 : 13; }
	get hitbox_y1() { return this.type === 1 ? ( this.death_anim === 0 ? -10 : -6 ) : ( this.death_anim === 0 ? -6 : -2 ); }
	get hitbox_y2() { return 4; }
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return ( this.death_anim === 0 ) ? sdSpider.ignored_classes_alive : sdSpider.ignored_classes_dead;
	}
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		sdSpider.spider_counter++;
		
		this.sx = 0;
		this.sy = 0;

		this.type = params.type || 0;
		
		this._hmax = this.type === 1 ? 600 : 250;
		this._hea = this._hmax;
		this._ai_team = 2;

		
		//this._retreat_hp_mult = 0.5; // Goes closer to 1 each time and at some point makes creature friendly?
		
		//this.master = null;
		//this.owned = 0; // Server sets this to true because this.master will be null on client-side in most cases for lost dogs
		
		this.death_anim = 0;
		this.hurt_anim = 0;
		this.attack_anim = 0;
		
		//this.frame = sdSpider.frame_idle;
		//this._frame_time = 0;
		
		//this._attack_in_sound = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = 0;
		this._attack_in = 0;
		this._burst_shots = 3;
		//this.bites = false;
		//this.jumps = false;

		this._nature_damage = 0; // For cubes to attack spider bots
		this._player_damage = 0;

		
		this._regen_timeout = 0;
		
		// For homing
		this.look_x = 0;
		this.look_y = 0;
		
		this._last_celebrate = 0;
		
		this._high_fire_rate = 0; // If able to hit target - it stays high
		
		this.side = 1;
	}
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		//if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		if ( character._ai_team !== this._ai_team )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdSpider.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				sdSound.PlaySound({ name:'spider_welcomeC', x:this.x, y:this.y, volume: 1 });
				
				if ( this._attack_in < 30 )
				this._attack_in = 45;
			}
		}
	}*/
	
	GetRandomTarget()
	{
		let ent = sdEntity.GetRandomActiveEntity();
		let array_of_enemies = sdCom.com_faction_attack_classes;
		if ( ent )
		if ( array_of_enemies.indexOf( ent.GetClass() ) !== -1 ) // Random entity check found a potential target class inside that array
			{
				if ( typeof ent._ai_team !== 'undefined' ) // Does a potential target belong to a faction?
				{
					if ( ent._ai_team !== this._ai_team && sdWorld.Dist2D( this.x, this.y, ent.x, ent.y ) < sdSpider.max_seek_range ) // Is this not a friendly faction? And is this close enough?
					return ent; // Target it
				}
				else
				return ent; // Target it
			}
		return null;
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		return 'hue-rotate(100deg)'; // Blue
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		if ( initiator )
		if ( initiator === this || initiator.is( sdSpider ) || ( initiator.is( sdDrone ) && initiator.type === 2 ) )
		return;
	
		//dmg = Math.abs( dmg );
		
		//let was_alive = this._hea > 0;
		let old_hp = this._hea;
		
		this._hea -= Math.abs( dmg );

		this._regen_timeout = 30;

		if ( initiator && !initiator.is( sdSpider ) )
		{
			this._current_target = initiator;
			this._high_fire_rate = 150;
		}

		
		if ( this._hea <= 0 && old_hp > 0 )
		{
			sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume: 1 });
			
			sdSpider.StartErthalDrop( this, 1 );
			
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
		}
		else
		if ( this._hea > 0 )
		{
			if ( this.hurt_anim <= 0 )
			{
				sdSound.PlaySound({ name:'spider_hurtC', x:this.x, y:this.y, volume: 1 });
			}
			
			this.hurt_anim = 5;
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	
	static StartErthalDrop( dying_entity, luck_scale=1 )
	{
		let x = dying_entity.x;
		let y = dying_entity.y;
		let sx = dying_entity.sx;
		let sy = dying_entity.sy;

		setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

			let random_value = Math.random();

			if ( random_value < 0.15 * luck_scale )
			{
				let gun;
				
				let gun_class = sdGun.CLASS_ERTHAL_PLASMA_PISTOL;
				if ( random_value < ( 0.15 * luck_scale * 0.25 ) )
				gun_class = sdGun.CLASS_ERTHAL_ENERGY_CELL;
				else
				if ( random_value < ( 0.15 * luck_scale * 0.6 ) )
				gun_class = sdGun.CLASS_ERTHAL_BURST_RIFLE;

				gun = new sdGun({ x:x, y:y, class: gun_class });

				gun.sx = sx;
				gun.sy = sy;
				sdEntity.entities.push( gun );
			}

		}, 500 );
	}
	
	get mass() { return this.type === 1 ? 200 : 80; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdSpider.death_duration + sdSpider.post_death_ttl )
			{
				this.death_anim += GSPEED;
			}
			else
			this.remove();
		}
		else
		{
			if ( this._hea < this._hmax )
			{
				this._regen_timeout -= GSPEED;
				if ( this._regen_timeout < 0 )
				{
					this._hea = Math.min( this._hmax, this._hea + GSPEED * ( this.master ? 30 : 5 ) / 30 );
				}
			}
		
			if ( this.hurt_anim > 0 )
			this.hurt_anim -= GSPEED;
		
			if ( this.attack_anim > 0 )
			this.attack_anim -= GSPEED;
		
			if ( this._attack_in > 0 )
			this._attack_in -= GSPEED;
		
			if ( this._high_fire_rate > 0 )
			this._high_fire_rate -= GSPEED;
		
			if ( sdWorld.is_server )
			{
				if ( this._current_target )
				{
					if ( this._current_target._is_being_removed || ( this._current_target.hea || this._current_target._hea ) <= 0 || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdSpider.max_seek_range + 32 )
					this._current_target = null;
					else
					{
						this.side = ( this._current_target.x > this.x ) ? 1 : -1;

						if ( sdWorld.is_server )
						if ( this._last_jump < sdWorld.time - 100 )
						if ( this.hurt_anim <= 0 )
						if ( this.attack_anim <= 0 )
						{
							if ( !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
							{
								this._last_jump = sdWorld.time;

								let dx = ( this._current_target.x - this.x );
								let dy = ( this._current_target.y - this.y );
							
								let di = sdWorld.Dist2D_Vector( dx, dy );
							
								if ( dx > 0 )
								dx = this.type === 1 ? 0.5 : 1;
								else
								dx = this.type === 1 ? -0.5 : -1;
							
								if ( di > 300 )
								{
								}
								else
								if ( di < 150 )
								{
									dx *= -1;
								}
								else
								{
									dx = 0;
								}
							
								if ( this._current_target.is( sdCharacter ) )
								if ( Math.random() < 0.3 || ( 
									this._current_target._inventory[ this._current_target.gun_slot ] && 
									!sdGun.classes[ this._current_target._inventory[ this._current_target.gun_slot ].class ].is_sword && 
									this._current_target._key_states.GetKey( 'Mouse1' ) ) )
								{
									let ray_x = this._current_target.look_x - this._current_target.x;
									let ray_y = this._current_target.look_y - this._current_target.y;
									let ray_di = sdWorld.Dist2D_Vector( ray_x, ray_y );
									if ( ray_di > 1 )
									{
										ray_x /= ray_di;
										ray_y /= ray_di;
									
										let point = sdWorld.TraceRayPoint( this._current_target.x, this._current_target.y, this._current_target.x + ray_x * 1000, this._current_target.y + ray_y * 1000, this._current_target, null, sdCom.com_visibility_unignored_classes_plus_erthals, null );
									
										if ( point )
										{
											if ( sdWorld.inDist2D_Boolean( point.x, point.y, this.x, this.y, 32 ) )
											{
												if ( point.x < this.x )
												dx = 1.5;
												else
												dx = -1.5;
											}
										}
									}
								
									let cx = ( this._current_target.x + this.x ) / 2;
									let cy = ( this._current_target.y + this.y ) / 2 - 64;
								
									if ( sdWorld.CheckLineOfSight( this._current_target.x, this._current_target.y, cx, cy, this._current_target, null, sdCom.com_visibility_unignored_classes, null ) )
									if ( sdWorld.CheckLineOfSight( this.x, this.y, cx, cy, this, null, sdCom.com_visibility_unignored_classes, null ) )
									{
										this._high_fire_rate = 150;
										if ( this._attack_in > 90 )
										this._attack_in = 45;
									}
								}
							
								if ( dx !== 0 )
								{
									this.sx += dx;

									if ( !this.CanMoveWithoutOverlap( this.x + dx, this.y, 0 ) )
									{
										if ( this.CanMoveWithoutOverlap( this.x + dx, this.y - 9, 0 ) )
										{
											this.y -= 9;
										}
										else
										if ( this.CanMoveWithoutOverlap( this.x + dx, this.y -  17, 0 ) )
										{
											this.y -= 17;
										}
									}
								}
							}
						}
					}
				}
				else
				{
					{
						let potential_target = sdCharacter.GetRandomEntityNearby( this );
						if ( potential_target )
						{
							this._current_target = potential_target;
							sdSound.PlaySound({ name:'spider_welcomeC', x:this.x, y:this.y, volume: 1 });
						
							if ( this._attack_in < 30 )
							this._attack_in = 45;
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
		
		
		//this.ApplyVelocityAndCollisions( GSPEED, ( this.death_anim === 0 && this._current_target ) ? 17 : 0, true );
		this.ApplyVelocityAndCollisions( GSPEED, ( this.death_anim === 0 && this._current_target && Math.abs( this.sx ) > 0.5 ) ? 17 : 0, true );
		
		let from_entity = this._current_target;
    
        if ( from_entity )
        {
			let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
			let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

			this.look_x = xx + ( from_entity.sx || 0 ) * 15;
			this.look_y = yy + ( from_entity.sy || 0 ) * 15;

			if ( this.death_anim === 0 )
			//if ( this._current_target )
			if ( this._attack_in <= 0 )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, from_entity.x, from_entity.y, 410 ) )
				{

					let bullet_obj = new sdBullet({ x: this.x - this.side * 3, y: this.y - 8 });

					bullet_obj._owner = this;

					let dx = this.side;
					let dy = -3;

					let di = sdWorld.Dist2D_Vector( dx, dy ) * ( 0.75 + Math.random() * 0.5 );
					dx /= di;
					dy /= di;

					bullet_obj.sx = dx * 10;
					bullet_obj.sy = dy * 10;

					bullet_obj._damage = 0.0001; // To allow ._custom_target_reaction calls
					bullet_obj._homing = true;
					bullet_obj._homing_mult = 0.01; // increases missiles travel speed when higher
					bullet_obj.ac = 0.11; // increases missile travel speed but also offsets tracking accuracy when higher?
					
					if ( this.HasMercyFor( from_entity ) )
					{
						bullet_obj.explosion_radius = 6; // 16 is hard for new players, but too low damage is not challenging
						
						if ( this._burst_shots > 1 )
						this._burst_shots = 1;

						bullet_obj.model = 'mini_rocket_green';
						bullet_obj.color = '#66ff66';
					}
					else
					{
						bullet_obj.explosion_radius = 9; // 16 is hard for new players, but too low damage is not challenging

						bullet_obj.model = 'mini_rocket';
						bullet_obj.color = '#00aaff';
					}

					bullet_obj.time_left = 60;
					
					//this._high_fire_rate = 90;
					
					bullet_obj._custom_target_reaction = ( bullet, target_entity )=>
					{
						if ( target_entity === from_entity )
						{
							this._high_fire_rate = 180;
							if ( this._attack_in > 90 )
							this._attack_in = 45;
						
							
							if ( sdWorld.time > this._last_celebrate + 60000 )
							{
								this._last_celebrate = sdWorld.time;
								sdSound.PlaySound({ name:'spider_celebrateC', x:this.x, y:this.y, volume:1 });
							}
						}
					};

					//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:0.2, pitch:2 });
					sdSound.PlaySound({ name:'spider_attackC', x:this.x, y:this.y, volume:1 });

					this.attack_anim = 10;

					sdEntity.entities.push( bullet_obj );
					
					
					this._burst_shots--;
					
					if ( this._high_fire_rate > 0 )
					this._attack_in = ( ( this._burst_shots > 0 ) ? 100 : ( 1000 + Math.random() * 2000 ) ) / 1000 * 30;
					else
					{
						this._attack_in = ( 5000 + Math.random() * 10000 ) / 1000 * 60;
					}

					if ( this._burst_shots <= 0 )
					this._burst_shots = 3;
				}
			}
        }
	}
	HasMercyFor( from_entity )
	{
		return ( this._hea > this._hmax / 2 && from_entity.is( sdCharacter ) && from_entity._score < 100 && from_entity.matter < 600 && from_entity._ai_enabled === sdCharacter.AI_MODEL_NONE );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		{
			if ( this.type === 0 )
			sdEntity.Tooltip( ctx, 'Erthal Spider Bot' );
			if ( this.type === 1 )
			sdEntity.Tooltip( ctx, 'Erthal Mini-tank Bot' );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.death_anim === 0 )
		ctx.apply_shading = false;
		
		//ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );
		
		var frame = sdSpider.frame_idle;
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdSpider.death_duration + sdSpider.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			frame = sdSpider.frame_death + Math.min( sdSpider.frame_death_frames - 1, ~~( ( this.death_anim / sdSpider.death_duration ) * sdSpider.frame_death_frames ) );
			//ctx.drawImageFilterCache( sdSpider.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( this.hurt_anim > 0 )
			frame = sdSpider.frame_hurt;
			else
			if ( this.attack_anim > 0 )
			frame = sdSpider.frame_attack;
			else
			if ( Math.abs( this.sx ) > 0.5 )
			{
				/*if ( sdWorld.time % 500 < 250 )
				frame = sdSpider.frame_walk1;
				else
				frame = sdSpider.frame_walk2;*/
				if ( sdWorld.time % 500 < 500 / 4 )
				frame = sdSpider.frame_walk1;
				else
				if ( sdWorld.time % 500 < 500 / 4 * 2 )
				frame = sdSpider.frame_idle2;
				else
				if ( sdWorld.time % 500 < 500 / 4 * 3 )
				frame = sdSpider.frame_walk2;
				else
				frame = sdSpider.frame_idle2;
			}
			else
			{
				if ( sdWorld.time % 2000 < 1000 )
				frame = sdSpider.frame_idle1;
				else
				frame = sdSpider.frame_idle2;
			}
		}
		if ( this.type === 0 )
		ctx.drawImageFilterCache( sdSpider.img_spider_anim, frame*32,0,32,32, - 16, - 16, 32,32 );
		if ( this.type === 1 )
		ctx.drawImageFilterCache( sdSpider.img_minitank_anim, frame*32,0,32,32, - 16, - 16, 32,32 );
		
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
		
		sdSpider.spider_counter--;
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdSpider.death_duration + sdSpider.post_death_ttl ) // not gone by time
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
//sdSpider.init_class();

export default sdSpider;