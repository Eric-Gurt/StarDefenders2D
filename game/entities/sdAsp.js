
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
import sdCube from './sdCube.js';
import sdLongRangeAntenna from './sdLongRangeAntenna.js';


class sdAsp extends sdEntity
{
	static init_class()
	{
		sdAsp.img_asp = sdWorld.CreateImageFromFile( 'sdAsp' );
		
		sdAsp.TIER_ORGANIC = 1;
		sdAsp.TIER_CRYSTAL = 2;
		sdAsp.TIER_ANTI = 3;

		/*
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
		*/
		sdAsp.death_duration = 15;
		sdAsp.post_death_ttl = 30 * 6;
		
		sdAsp.max_seek_range = 1000;
		
		sdAsp.asps_tot = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	// 8 as max dimension so it can fit into one block
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return ( this.death_anim === 0 ) ? -7 : -2; }
	get hitbox_y2() { return ( this.death_anim === 0 ) ? 7 : 3; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	get _tier()
	{
		throw new Error( 'Outdated property' ); 
	}
	set _tier( v )
	{
		throw new Error( 'Outdated property' ); 
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.tier = params.tier || params.tier || 1; // Used to determine its' HP and damage
		
		if ( this.tier === 1 )
		this._hmax = 80;
		else
		if ( this.tier === 2 ) // Crystal asps were meant to have 2x HP due to turning into crystal shards on death.
		this._hmax = 160;
		else
		if ( this.tier === 3 ) // Anti-crystal asps
		this._hmax = 160 * 2;
		else
		this._hmax = 10;
	
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this._current_target = params.target || null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_attack = sdWorld.time;
		
		this.side = 1;
		
		this.attack_frame = 0;
		
		this._anim_shift = ~~( Math.random() * 10000 );
		
		this.attack_an = 0;
		
		this._crystal_worth = params.crystal_worth || 0;
		
		this._hibernation_check_timer = 30;
		
		this._unlimited_range = params.unlimited_range || false; // Unlimited attack range? Reserved for SD tasks.
		
		this._attack_through_walls = params.attack_through_walls || false;
		
		this._anti_time_left = 30 * 60 * 3 * 0.25;
		
		sdAsp.asps_tot++;
		
		this.hue = params.filter ? 0 : ~~( Math.random() * 360 );
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
		this.filter = params.filter || 'saturate(0.5)';
	}
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		this._current_target = null;
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
			if ( di < sdAsp.max_seek_range || this._unlimited_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
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
		if ( this.tier === 1 )
		return sdEffect.TYPE_BLOOD_GREEN;
	
		return sdEffect.TYPE_WALL_HIT;
	}
	GetBleedEffectHue()
	{
		return this.hue;
	}
	GetBleedEffectFilter()
	{
		if ( this.tier === 1 )
		return this.filter;
	
		return '';
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
			if ( this.tier === 2 )
			{
				if ( this._crystal_worth > 0 )
				sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, pitch: 1.2, volume:0.5 });
			}
			else
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			
			//sdSound.PlaySound({ name:'asp_death', x:this.x, y:this.y, volume: 0.5 });

			if ( this.tier === 3 )
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
			else
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );

			if ( dmg >= this._hmax * 0.5 && this.tier === 1 ) // Instagib, gibs asp into 2 parts ( if your weapon deals enough damage )
			{
				sdWorld.SpawnGib( this.x + ( 4 * this.side ), this.y, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_ASP_GIBS , 'hue-rotate(' + this.hue + 'deg)' + this.filter, 'hue-rotate(' + this.hue + 'deg)' + this.filter, 100, this );
				sdWorld.SpawnGib( this.x - ( 4 * this.side ), this.y, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_ASP_GIBS , 'hue-rotate(' + this.hue + 'deg)' + this.filter, 'hue-rotate(' + this.hue + 'deg)' + this.filter, 100, this, 1 );
				this.remove();
			}
		}
		else
		{
			if ( was_alive )
			if ( this.tier === 2 )
			if ( this._crystal_worth > 0 )
			sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, pitch: 1.7, volume:0.3 });
		}
		
		//if ( this._hea < -this._hmax / 80 * 100 || ( this._hea <= 0 && this.tier === 2 ) ) // used to be only " ||this.tier === 2 " which resulted in instant death for Crystal Asps, unintentional - Booraz
		if ( this._hea < -this._hmax / 80 * 100 || ( this._hea <= -10 && this.tier === 2 ) ) // Tier 2 will not break on fall
		this.remove();
	}
	get mass() { return 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	Impact( vel ) // fall damage basically. Values below 5 won't be reported due to no-damage area lookup optimization
	{
		if ( this.tier === 2 && this._hea <= 0 )
		this.DamageWithEffect( Math.max( 10, vel - 3 ) * 15 );
		else
		if ( vel > 6 ) // For new mass-based model
		{
			this.DamageWithEffect( ( vel - 3 ) * 15 );
		}
	}
	CanBuryIntoBlocks()
	{
		return 1; // 0 = no blocks, 1 = natural blocks, 2 = corruption, 3 = flesh blocks	
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.tier === sdAsp.TIER_ANTI )
		{
			GSPEED *= 0.25;
			
			this._anti_time_left -= GSPEED;
			
			if ( this._anti_time_left <= 0 )
			{
				if ( this._hea > 0 )
				this._hea = 0;
			}
		}
		
		let in_water = sdWater.all_swimmers.has( this );
		
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
			if ( this._current_target._is_being_removed || !this._current_target.IsVisible( this ) || ( sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdAsp.max_seek_range + 32 && !this._unlimited_range ) )
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
			{
				//Prioritize moving towards antennas
				for ( let i = 0; i < sdLongRangeAntenna.antennas; i++ )
				{
					if ( sdLongRangeAntenna.antennas[ i ] )
					{
					
						let dx = ( sdLongRangeAntenna.antennas[ i ].x + Math.random() * 1000 - 500 - this.x );
						let dy = ( sdLongRangeAntenna.antennas[ i ].y + Math.random() * 1000 - 500 - this.y );
					
						let di = sdWorld.Dist2D_Vector( dx, dy );

						if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 4 )
						if ( di > 1 )
						{
							this.sx += dx / di * 0.2;
							this.sy += dy / di * 0.2;
							this._current_target = sdLongRangeAntenna.antennas[ i ]; //Attack the antenna
							//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
							//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );
						
							break;
						}
					}
				}
				
				if ( !this._current_target )
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
					
					if ( ( ( from_entity.IsPlayerClass() || from_entity.GetClass() === 'sdBot' || from_entity.GetClass() === 'sdGuanako' || from_entity.GetClass() === 'sdLongRangeAntenna' || this._current_target === from_entity ) && from_entity.IsVisible( this ) && ( from_entity.hea || from_entity._hea ) > 0 ) )
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
				
				let offset = 0;
				let projectiles = 1;
				let spread_per_projectile = 0;
				
				if ( this.tier === 2 || this.tier === 3 )
				if ( this._crystal_worth !== 160 ) // Lost effect ones likely
				{
					offset = -0.15;
					projectiles = 3;
					spread_per_projectile = 0.15;
				}

				for ( var i = 0; i < nears.length; i++ )
				{
					from_entity = nears[ i ].ent;
					
					let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
					let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

					if ( ( this._attack_through_walls && from_entity === this._current_target ) || sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						let dx = xx - this.x;
						let dy = yy - this.y;
						
						let di = sdWorld.Dist2D_Vector( dx, dy );
						
						dx += ( from_entity.sx || 0 ) * di / 12;
						dy += ( from_entity.sy || 0 ) * di / 12;
						
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

						for ( let p = 0; p < projectiles; p++ )
						{
							let bullet_obj = new sdBullet({ x: this.x, y: this.y });

							bullet_obj._owner = this;

							bullet_obj.sx = dx;
							bullet_obj.sy = dy;
							
							let a = offset + p * spread_per_projectile;
							// Rotate
							let cos = Math.cos( a );
							let sin = Math.sin( a );
							let nx = cos * bullet_obj.sx - sin * bullet_obj.sy;
							bullet_obj.sy = sin * bullet_obj.sx + cos * bullet_obj.sy;
							bullet_obj.sx = nx;
							
							bullet_obj.x += bullet_obj.sx * 3;
							bullet_obj.y += bullet_obj.sy * 3;

							bullet_obj.sx *= 12;
							bullet_obj.sy *= 12;

							bullet_obj._damage = 15;
							bullet_obj.color = '#00ff00';
							bullet_obj.model = 'ball_g';
							
							if ( this.tier === 3 )
							{
								bullet_obj.sx *= 0.25;
								bullet_obj.sy *= 0.25;
								bullet_obj.time_left /= 0.25;
								bullet_obj._damage *= 1.5; // /= 0.25;
								bullet_obj.color = '#000000';
								bullet_obj.model = 'ball_anti';
								bullet_obj._custom_target_reaction = ( bullet, target_entity )=>
								{
									if ( target_entity )
									{
										if ( typeof target_entity._matter !== 'undefined' )
										target_entity._matter = Math.max( 0, target_entity._matter - 300 );
									
										if ( typeof target_entity.matter !== 'undefined' )
										target_entity.matter = Math.max( 0, target_entity.matter - 300 );
									}
								};
								
								bullet_obj._extra_filtering_method = ( hit_entity, bullet )=>
								{
									if ( from_entity.driver_of )
									if ( hit_entity === from_entity.driver_of )
									return true; // Only hit destination targets
									
									if ( hit_entity === from_entity )
									return true; // Only hit destination targets

									return false; // Go right through everything including walls
								};
							}

							sdEntity.entities.push( bullet_obj );
						}
						
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
		
		if ( sdWorld.is_server )
		{
			if ( this._last_attack < sdWorld.time - ( 1000 * 60 * 3 ) ) // 3 minutes since last attack?
			{
				this._hibernation_check_timer -= GSPEED;
				
				if ( this._hibernation_check_timer < 0 )
				{
					this._hibernation_check_timer = 30 * 30; // Check if hibernation is possible every 30 seconds
					this.AttemptBlockBurying(); // Attempt to hibernate inside nearby blocks
				}
			}
		}
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	get title()
	{
		return ( this.tier === 3 ) ? "Anti-crystal Asp" : ( this.tier === 2 ) ? "Crystal Asp" : 'Asp';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, this.title ); // This won't work. tier is not synced
	}
	Draw( ctx, attached )
	{		
		ctx.filter = this.filter;

		//if ( sdRenderer.visual_settings === 4 )
		//{
			if ( !sdShop.isDrawing )
			ctx.sd_hue_rotation = this.hue;
		//}
		//else
		//ctx.filter = 'hue-rotate(' + this.hue + 'deg)' + ctx.filter;

		let xx = 0;
		let yy = 0;
		
		ctx.scale( -this.side, 1 );
		
		if ( this.death_anim === 0 )
		{
			if ( !sdShop.isDrawing )
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
			
			xx = Math.min( 5 - 1, ~~( ( this.death_anim / sdAsp.death_duration ) * 5 ) );
			yy = 1;
			//let frame = Math.min( sdAsp.death_imgs.length - 1, ~~( ( this.death_anim / sdAsp.death_duration ) * sdAsp.death_imgs.length ) );
			//ctx.drawImageFilterCache( sdAsp.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( this.attack_frame >= 2 )
			xx = 1;
			//ctx.drawImageFilterCache( sdAsp.img_asp_attack1, - 16, - 16, 32,32 );
			else
			if ( this.attack_frame >= 1 )
			xx = 2;
			//ctx.drawImageFilterCache( sdAsp.img_asp_attack2, - 16, - 16, 32,32 );
			else
			xx = 0;
			//ctx.drawImageFilterCache( sdAsp.img_asp_idle, - 16, - 16, 32,32 );
		}

		ctx.drawImageFilterCache( sdAsp.img_asp, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );
		
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
		sdAsp.asps_tot--;
		
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdAsp.death_duration + sdAsp.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			if ( this.tier === 2 || this.tier === 3 )
			{
				if ( this._crystal_worth > 0 )
				{
					sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.25 });
					

					//let value_mult = this._crystal_worth / 40;
					//sdWorld.DropShards( this.x,this.y,this.sx,this.sy, 3, value_mult, 3 );

					sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
							Math.ceil( Math.max( 5, 1 * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
							this._crystal_worth / 40,
							5
					);
				}
				else
				sdWorld.BasicEntityBreakEffect( this, 3, undefined, undefined, 1.4 );
			}
			else
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
				//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
				if ( this.tier === 1 )
				{
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
				}
				else
				{
				}
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