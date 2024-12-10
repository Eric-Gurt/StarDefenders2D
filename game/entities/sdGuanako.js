
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdBG from './sdBG.js';
import sdBloodDecal from './sdBloodDecal.js';
import sdCrystal from './sdCrystal.js';
import sdStorage from './sdStorage.js';
import sdBullet from './sdBullet.js';
import sdBlock from './sdBlock.js';
import sdWeather from './sdWeather.js';

import sdPathFinding from '../ai/sdPathFinding.js';

class sdGuanako extends sdEntity
{
	static init_class()
	{
		sdGuanako.img_guanako = sdWorld.CreateImageFromFile( 'sdGuanako' ); // Sprite by Eric Gurt
		
		sdGuanako.ACTION_IDLE = 0;
		sdGuanako.ACTION_ATTACK = 1;
		sdGuanako.ACTION_SLEEP = 2;
		sdGuanako.ACTION_JUMP = 3;
		sdGuanako.ACTION_HURT = 4;
		sdGuanako.ACTION_DIES = 5;
		
		sdGuanako.action_durations = [
			30 * 3,
			10,
			30 * 60,
			30 * 5,
			10,
			30 * 30
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -4; }
	get hitbox_x2() { return 4; }
	get hitbox_y1() { return	( this.action_id !== sdGuanako.ACTION_DIES ) ? 
								-7.9
								: 
								3; 
					}
	get hitbox_y2() { return 8; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.action_id !== sdGuanako.ACTION_DIES; }
	
	/*GetIgnoredEntityClasses()
	{
		return [ 'sdGuanako' ];
	}*/
	
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		this._lives_until = sdWorld.time + 1000 * 60 * 5; // Lives for 5 minutes without anybody near
	}*/
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._speak_id = -1;
		
		this.hmax = 250;
		this.hea = this.hmax;

		this.side = 1;
		
		this._has_score = true;
		
		this.action_id = sdGuanako.ACTION_IDLE;
		this.action_time = 0; // Grows until reaches duration of current action, then action changes
		this._current_action_duration = 0;
		
		this._regen_timeout = 0;
		
		this._stands = false;
		
		this._last_damage = 0;
		
		this._attack_cooldown = 0; // Can't attack when it is positive
		
		this._home_entity = null; // Could be shared with few other guanakos
		this._held_entity = null; // Could drag items and crystals if needed
		this._higher_rank_guanako = null; // All guanakos spawn from one specific guanako - that one is their leader
		this._community_rank = 0; // 0 = leader, 1 = kid of a leader, 2 = kid of a kid of a leader etc, could be used to limit their population and keep community knowledge information in same place - on a leader
		
		//this.filter = 'none';
		//this.hue = ( ~~( Math.random() * 6 ) ) * 60; // Only 6 species, same species will likely group up together on sight
		
		this._current_target = null;
		this._pathfinding = null;
		this._current_target_reset_timer = 0; // Resets if reaches 0
		
		this._voice_channel = sdSound.CreateSoundChannel( this );
	}
	
	isFireAndAcidDamageResistant()
	{
		return true;
	}
	
	get title()
	{
		return 'Guanako';
	}
	
	SetTarget( ent )
	{
		if ( this._current_target !== ent )
		{
			this._current_target = ent;
			
			if ( ent )
			this._pathfinding = new sdPathFinding({ target: ent, traveler: this, attack_range: 128, options: [ sdPathFinding.OPTION_CAN_CRAWL, sdPathFinding.OPTION_CAN_SWIM, sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS ] });
			else
			this._pathfinding = null;
		}
	}
	
	PlayAction( id )
	{
		if ( sdGuanako.action_durations[ id ] === undefined )
		throw new Error();
		
		this.action_id = id;
		this.action_time = 0; // Grows until reaches duration of current action, then action changes
		this._current_action_duration = sdGuanako.action_durations[ id ];
	}
	
	/*PlayNextAction()
	{
		let r = ~~( Math.random() * 3 );

		if ( r === 0 )
		this.PlayAction( sdGuanako.ACTION_IDLE );

		if ( r === 1 )
		this.PlayAction( sdGuanako.ACTION_SLEEP );

		if ( r === 2 )
		{
			this.PlayAction( sdGuanako.ACTION_JUMP );

			this.sy = -3;
		}
		
		
	}*/
	
	/*Impact( vel ) // fall damage basically
	{
		if ( vel > 30 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 5 );
		}
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( dmg > 0 )
		{
			if ( initiator.is( sdGuanako ) )
			{
				dmg = -50;
				
				if ( initiator._current_target !== this )
				this.SetTarget( initiator._current_target ); // Inherit target of attacker just to avoid both pushing each other forever
			}
		}
	
		//dmg = Math.abs( dmg );
	
		let old_hp = this.hea;
	
		this.hea -= dmg;
		
		if ( this.hea > this.hmax )
		this.hea = this.hmax;
		
		if ( dmg > 0 )
		{
			this._regen_timeout = 30;
			
			if ( initiator )
			this.SetTarget( initiator );
		}
		
		let sound_played = false;
		let died = false;
		
		if ( this.hea <= 0 )
		{
			if ( old_hp > 0 )
			{
				if ( this._has_score )
				{
					this._has_score = false;
					this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_AVERAGE_MOB );
				}
				
				sound_played = true;
				sdSound.PlaySound({ name:'guanako_death', x:this.x, y:this.y, volume: 0.5, pitch:1, channel:this._voice_channel });
				died = true;
				
				this.PlayAction( sdGuanako.ACTION_DIES );
			}
			//this.remove();
			
			if ( this.hea < -this.hmax / 40 * 100 )
			this.remove();
		}
		else
		{
			if ( this.hea > 0 )
			{
				if ( old_hp <= 0 )
				{
					this.PlayAction( sdGuanako.ACTION_SLEEP );
				}
				else
				{
					if ( dmg > 0 )
					{
			
						this.PlayAction( sdGuanako.ACTION_HURT );
						
						if ( this._frozen <= 0 )
						if ( sdWorld.time > this._last_damage + 200 )
						{
							this._last_damage = sdWorld.time;
							
							sound_played = true;
							sdSound.PlaySound({ name:'guanako_hurt', x:this.x, y:this.y, volume: 0.5, pitch:1, channel:this._voice_channel });
						}
					}
				}
			}
		}
		
		if ( sound_played )
		{
			if ( initiator )
			//if ( dmg > 0 )
			{
				if ( ( initiator.hea || initiator._hea || 0 ) > 0 )
				{
					let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 240, null, [ 'sdGuanako' ] );

					let assigned_healer = false;
					
					if ( !died )
					assigned_healer = true;

					for ( let i = 0; i < nears_raw.length; i++ )
					if ( nears_raw[ i ] !== this )
					if ( nears_raw[ i ].hea > 0 )
					{
						if ( assigned_healer )
						{
							if ( nears_raw[ i ]._current_target === null ||
								 ( nears_raw[ i ]._current_target.is( sdGuanako ) && nears_raw[ i ]._current_target.hea > 0 ) )
							nears_raw[ i ].SetTarget( initiator );
						}
						else
						{
							assigned_healer = true;
							nears_raw[ i ].SetTarget( this );
						}
					}
				}
			}
		}
	}
	
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		return '';
	}
	GetBleedEffectHue()
	{
		return 61;// + this.hue;
	}
	
	get mass() { return 100; }
	
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 3; i++ )
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
	
	onMovementInRange( from_entity )
	{
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			this.action_time += GSPEED;
			
			if ( this.action_id === sdGuanako.ACTION_DIES )
			{
				if ( this.action_time >= this._current_action_duration )
				{
					this.remove();
					this._broken = false;
					return true;
				}
			}
			else
			{
				if ( this.hea < this.hmax )
				{
					this._regen_timeout -= GSPEED;
					if ( this._regen_timeout < 0 )
					{
						this.hea = Math.min( this.hmax, this.hea + GSPEED );
					}
				}
				
				if ( this._attack_cooldown > 0 )
				this._attack_cooldown -= GSPEED;
				
				if ( this.action_id === sdGuanako.ACTION_ATTACK )
				{
					// Hurt blocks any attack logic
					
					if ( this.action_time > this._current_action_duration )
					this.PlayAction( sdGuanako.ACTION_IDLE );
				}
				else
				if ( this.action_id === sdGuanako.ACTION_HURT )
				{
					// Hurt blocks any attack logic
					
					if ( this.action_time > this._current_action_duration )
					this.PlayAction( sdGuanako.ACTION_IDLE );
				}
				else
				if ( this.action_id === sdGuanako.ACTION_JUMP )
				{
					if ( this.action_time > 5 &&
						 this._stands &&
						 Math.abs( this.sy ) < 0.01 )
					{
						//this.action_time = this._current_action_duration;
						this.PlayAction( sdGuanako.ACTION_IDLE );
					}
					else
					if ( this.action_time > this._current_action_duration )
					this.PlayAction( sdGuanako.ACTION_IDLE );
					else
					if ( this._pathfinding )
					{
						let pathfinding_result = this._pathfinding.Think( GSPEED );

						if ( pathfinding_result )
						{
							this.sx += pathfinding_result.act_x * GSPEED * 0.05;
							this.sy += pathfinding_result.act_y * GSPEED * 0.05;
						}
					}
				}
				else
				if ( this.action_id === sdGuanako.ACTION_SLEEP )
				{
					if ( Math.abs( this.sx ) > 0.1 || !this._stands )
					this.PlayAction( sdGuanako.ACTION_IDLE );
					else
					if ( this.action_time > this._current_action_duration )
					this.PlayAction( sdGuanako.ACTION_IDLE );
				}
				else
				if ( this.action_id === sdGuanako.ACTION_IDLE )
				{
					let new_action = sdGuanako.ACTION_IDLE;
					
					if ( this.action_time > this._current_action_duration && sdWeather.only_instance.GetSunIntensity() < 0.06 )
					{
						this.PlayAction( sdGuanako.ACTION_SLEEP );
					}
					else
					{
						if ( this._held_entity )
						{
							// Carry to base/build base

							 // TODO
						}
						else
						{
							// Find crystals

							if ( this._current_target )
							{
								if ( this._current_target_reset_timer > 0 )
								this._current_target_reset_timer -= GSPEED;

								if ( this._current_target._is_being_removed || ( this._current_target._hea || this._current_target.hea || 0 ) <= 0 || this._current_target_reset_timer <= 0 )
								this.SetTarget( null );
							}

							if ( !this._current_target )
							{
								//let e = sdEntity.active_entities[ Math.floor( Math.random() * sdEntity.active_entities.length ) ];
								let e = sdEntity.entities[ Math.floor( Math.random() * sdEntity.entities.length ) ];

								if ( e )
								if ( e.IsVisible( this ) )
								if ( e.is( sdCrystal ) ||
									 ( e.is( sdBlock ) && ( e._contains_class && e._contains_class.substring( 0, 'sdCrystal'.length ) === 'sdCrystal' ) ) )
								if ( sdWorld.inDist2D_Boolean( e.x, e.y, this.x, this.y, 1000 ) )
								{
									this.SetTarget( e );

									this._current_target_reset_timer = 30 * 15;
								}
							}

							if ( this._pathfinding )
							{
								let pathfinding_result = this._pathfinding.Think( GSPEED );

								if ( pathfinding_result )
								{
									this._current_target_reset_timer = 30 * 15;

									if ( pathfinding_result.attack_target )
									{
										if ( pathfinding_result.attack_target.is( sdCrystal ) )
										{
											if ( false ) // TODO
											{
												this._held_entity = pathfinding_result.attack_target;
											}

											this.SetTarget( null );
										}
										else
										if ( this._attack_cooldown <= 0 )
										{
											//debugger;
											new_action = sdGuanako.ACTION_ATTACK;

											this._attack_cooldown = 60;

											let bullet_obj = new sdBullet({ x: this.x, y: this.y });

											let e = pathfinding_result.attack_target;

											let dx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2 - this.x;
											let dy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2 - this.y;

											this.side = ( dx > 0 ) ? 1 : -1;

											let di = sdWorld.Dist2D_Vector( dx, dy );

											dx += ( e.sx || 0 ) * di / 12;
											dy += ( e.sy || 0 ) * di / 12;

											di = sdWorld.Dist2D_Vector( dx, dy );

											if ( di > 1 )
											{
												dx /= di;
												dy /= di;
											}

											bullet_obj._owner = this;

											bullet_obj.sx = dx;
											bullet_obj.sy = dy;
											//bullet_obj.x += bullet_obj.sx * 3;
											//bullet_obj.y += bullet_obj.sy * 3;

											bullet_obj.sx *= 12;
											bullet_obj.sy *= 12;

											bullet_obj._damage = 120;
											bullet_obj.color = '#0000ff';

											bullet_obj.model = 'ball';

											sdEntity.entities.push( bullet_obj );

											sdSound.PlaySound({ name:'gun_portal4', x:this.x, y:this.y, volume: 0.5, pitch:2 });
										}
									}
									else
									{
										new_action = sdGuanako.ACTION_JUMP;
										this.sx = pathfinding_result.act_x;

										if ( pathfinding_result.act_y <= 0 )
										this.sy = pathfinding_result.act_y - 2;
										else
										this.sy = pathfinding_result.act_y;

										if ( pathfinding_result.act_x > 0 )
										this.side = 1;
										if ( pathfinding_result.act_x < 0 )
										this.side = -1;

										if ( this.sx === 0 )
										{
											this.sx = this.side * 0.1;
										}
									}
								}
							}
						}

						if ( new_action !== sdGuanako.ACTION_IDLE )
						this.PlayAction( new_action );
					}
				}
			}
		}
		
		if ( !this._stands || this._phys_last_rest_on )
		this.sy += sdWorld.gravity * GSPEED;
	
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		//this._stands = ( this._phys_last_rest_on ) ? true : false;
		
		if ( this._phys_last_touch && !this._phys_last_touch._is_being_removed )
		this._stands = ( this.DoesOverlapWith( this._phys_last_touch, 3 ) );
		else
		this._stands = false;
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.action_id !== sdGuanako.ACTION_DIES )
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		//ctx.sd_filter = this.sd_filter;
		//ctx.filter = this.filter;
		
		//if ( !sdShop.isDrawing )
		//ctx.sd_hue_rotation = this.hue;
	   
		let xx = 0;
		let yy = 0;
		
		let action_id = this.action_id;
		
		if ( !this._stands && action_id === sdGuanako.ACTION_IDLE )
		action_id = sdGuanako.ACTION_JUMP;
		
		if ( !this._stands && action_id === sdGuanako.ACTION_SLEEP )
		action_id = sdGuanako.ACTION_JUMP;
		
		if ( this._stands && action_id === sdGuanako.ACTION_JUMP )
		action_id = sdGuanako.ACTION_IDLE;
		
		if ( action_id === sdGuanako.ACTION_IDLE )
		{
			xx = ( this.action_time % (30*5) ) < 15 ? 1 : 0;
		}
		else
		if ( action_id === sdGuanako.ACTION_ATTACK )
		{
			xx = 2;
		}
		else
		if ( action_id === sdGuanako.ACTION_SLEEP )
		{
			xx = ( this.action_time % 120 ) < 60 ? 3 : 4;
		}
		else
		if ( action_id === sdGuanako.ACTION_JUMP )
		{
			xx = ( this.sy < 0 ) ? 5 : 6;
		}
		else
		if ( action_id === sdGuanako.ACTION_HURT )
		{
			xx = 7;
		}
		else
		if ( action_id === sdGuanako.ACTION_DIES )
		{
			xx = 8 + ~~( this.action_time / 5 );
			
			if ( this.action_time > sdGuanako.action_durations[ action_id ] - 30 )
			ctx.globalAlpha = 0.5;
		}
		
		//if ( xx > 20 )
		//ctx.globalAlpha = 0.5;
	
		if ( xx > 11 )
		xx = 11;
	
		ctx.scale( -1 * this.side, 1 );
	
		ctx.drawImageFilterCache( sdGuanako.img_guanako, xx*32,yy*32,32,32, - 16, - 16, 32,32 );
	
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
		ctx.globalAlpha = 1;
		ctx.sd_filter = null;
	}
	
	Say( t, force_say=false )
	{
		//if ( ( this.state_hp === 0 && this.sentence_to_speak.length === 0 ) || force_say )
		{
			
			let params = { 
				x:this.x, 
				y:this.y - 20, 
				type:sdEffect.TYPE_CHAT, 
				attachment:this, 
				attachment_x: 0,
				attachment_y: -20,
				text: t,
				voice: {
					wordgap: 0,
					pitch: 0,
					speed: 150,
					variant: 'silence'
				} 
			};

			sdWorld.SendEffect( params );
		}
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( this.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 128 ) )
		{
			if ( this.action_id === sdGuanako.ACTION_SLEEP )
			this.PlayAction( sdGuanako.ACTION_IDLE );
		
			if ( this.x > exectuter_character.x )
			this.side = -1;
			else
			this.side = 1;
		
			if ( this._current_target === exectuter_character )
			{
				this.Say( 'No, I don\'t like you >:(' );
				sdSound.PlaySound({ name:'guanako_confused', x:this.x, y:this.y, volume: 0.5, pitch:1, channel:this._voice_channel });
			}
			else
			if ( command_name === 'REQUEST_CRYSTAL' )
			{
				if ( Math.random() < 0.5 )
				{
					this.Say( 'I don\'t have any' );
					sdSound.PlaySound({ name:'guanako_disagreeing', x:this.x, y:this.y, volume: 0.5, pitch:1, channel:this._voice_channel });
				}
				else
				{
					this.Say( 'Let\'s find some' );
					sdSound.PlaySound({ name:'guanako_confused', x:this.x, y:this.y, volume: 0.5, pitch:1, channel:this._voice_channel });
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( this.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 128 ) )
		{
			this.AddContextOption( 'Ask for crystals', 'REQUEST_CRYSTAL', [ ], false );
		}
	}
}
//sdGuanako.init_class();

export default sdGuanako;