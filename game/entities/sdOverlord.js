
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';
import sdArea from './sdArea.js';

import sdPathFinding from '../ai/sdPathFinding.js';

class sdOverlord extends sdEntity
{
	static init_class()
	{
		sdOverlord.img_overlord = sdWorld.CreateImageFromFile( 'sdOverlord' );
		
		sdOverlord.frame_width = 32;
		sdOverlord.frame_height = 64;
		
		sdOverlord.max_seek_range = 1000;
		
		//sdOverlord.overlord_tot = 0;
		sdOverlord.overlords = [];
		
		sdOverlord.rifle_offset_y = 14;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -13; }
	get hitbox_x2() { return 13; }
	get hitbox_y1() { return -13; }
	get hitbox_y2() { return 10; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._speak_id = -1;
		
		this.hmax = 2000;
		this.hea = this.hmax;
		
		this._regen_timeout = 0;
		
		this.state_hp = 0; // 0 = healthy, 1 = damaged, 2 = falling down, 3 = fallen + falleng breathing

		this.attack_an = 0;
		this._muzzle_timer = 0;
		
		this._concentration = 0; // Makes it more accurate longer it shoots
		
		this.scar = 0; // Becomes 1 after first defeated state
		
		this.mouth = 0; // 0 = closed, 1 = open, 2 = mad intent, 3 = very mad intent
		
		this.sweat = 0;
		
		this._sweat_amount = 0;
		
		this._peaceful_mode = false;
		this._peaceful_rethink_timer = 0;
		
		this._current_target = null;
		this._pathfinding = null;
		
		this._attack_target = null; // Can be both wall and target, stays in memory for longer time
		this._shots_fired_towards_target = 0;
		this._last_known_target_health_before_shots_fired = 0;
		
		this._wont_attack_net_ids = {}; // biometry, _biometry or _net_id
		
		this._hurt_timer = 0;
		
		this._occasional_anger_noises_timer = 0;
		this._occasional_levitation_sounds_timer = 0;

		this._nature_damage = 0; // For cubes to attack overlords
		this._player_damage = 0;


		//this._attack_timer = 0;
		//this._burst_ammo_start = 6;
		//this._burst_ammo = this._burst_ammo_start;
		//this._burst_reload = 5; // Reload time when it's burst firing

		//this._last_attack = sdWorld.time;
		this._reload_timer = 0;

		this.side = -1;
		
		this.attack_frame = 0;
		
		this._play_fall_sound = false;
		
		this.sentence_to_speak = '';
		this._speak_delay = 0;
		this._speak_frame = 0;
		this.speak_forced = false;
		
		this._anim_shift = ~~( Math.random() * 10000 );
		
		this.has_gun = 1;
		this._droppen_gun_entity = null;
		
		this._relations_to_classes = {};
		
		//EnforceChangeLog( this, '_relations_to_classes', false );
		
		this.melee_arm = 0; // 0 or 1
		this.melee_anim = 0; // changes from 0 to 15 or something, then Damage happens, then goes back to 30
		this._melee_scheduled = false; // Becomes true when melee should start
		
		/*for ( let i = 0; i < sdWorld.entity_classes.length; i++ )
		{
			let c = sdWorld.entity_classes[ i ];
			
			this._relations_to_classes[ c.name ] = Math.random() - 0.5;
		}*/
		
		//sdOverlord.overlord_tot++;
		sdOverlord.overlords.push( this );
		
		this.hue = ~~( Math.random() * 360 )
		//this.filter = 'hue-rotate(' +  + 'deg)';
	}
	
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_relations_to_classes' ) return true;
		
		if ( prop === '_attack_target' ) return true;
		//if ( prop === '_current_target' ) return true;
		if ( prop === '_droppen_gun_entity' ) return true;
		if ( prop === '_wont_attack_net_ids' ) return true;
		
		
		
		return false;
	}
	
	SetTarget( ent, force=false, peaceful_mode=false )
	{
		if ( ent !== this._current_target || force || this._peaceful_mode !== peaceful_mode )
		{
			this._current_target = ent;
			
			this._peaceful_mode = peaceful_mode;

			if ( ent )
			{
				if ( !peaceful_mode )
				{
					if ( ent !== this._droppen_gun_entity )
					this.Say( sdWorld.ClassNameToProperName( ent.GetClass() ) + ' is to be destroyed' );
				}
				
				this._pathfinding = new sdPathFinding({ target: ent, traveler: this, attack_range: ( this.has_gun || peaceful_mode ) ? 350 : 32, options: ( this.has_gun && !peaceful_mode ) ? [ sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS ] : [ sdPathFinding.OPTION_CAN_FLY ] });
			}
			else
			this._pathfinding = null;
		}
	}
	/*SyncedToPlayer( character )
	{
		this.SetTarget( character );
	}*/
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdOverlord.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				if ( this.CanAttackEnt( character ) )
				{
					//this._current_target = character;
					this.SetTarget( character );
				
					if ( this.type === 2 )
					sdSound.PlaySound({ name:'spider_welcomeC', x:this.x, y:this.y, volume: 1, pitch:2 });
				}
			}
		}
	}*/

	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD;
	}
	/*GetBleedEffectFilter()
	{
		if ( this.type === 2 )
		return 'hue-rotate(100deg)'; // Blue
	
		return '';
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator === this )
		return;

		//dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		let old_hp = this.hea;

		this.hea -= dmg;
		
		if ( dmg > 0 )
		{
			if ( initiator )
			if ( typeof this._wont_attack_net_ids[ initiator.biometry || initiator._biometry || initiator._net_id ] !== 'undefined' )
			delete this._wont_attack_net_ids[ initiator.biometry || initiator._biometry || initiator._net_id ];
		}
		
		if ( this.hea > this.hmax )
		this.hea = this.hmax;
		
		//if ( initiator )
		//{
			/*
			let class_name = initiator.GetClass();
			if ( typeof this._relations_to_classes[ class_name ] === 'undefined' )
			{
				this._relations_to_classes[ class_name ] = Math.random() - 0.5;
			}
			
			this._relations_to_classes[ class_name ] -= ( old_hp - this.hea ) / this.hmax;
			*/
			let e = this.GetRandomEntityNearby();
			this.AddRelationLevelToEntity( e, -( old_hp - this.hea ) / this.hmax * 1 );
			
			this.AddRelationLevelToEntity( initiator, -( old_hp - this.hea ) / this.hmax * 1 );
			
			if ( this.hea < this.hmax / 2 )
			if ( this.GetRelationLevelWithEntity( initiator ) < 0 )
			{
				this.SetTarget( initiator );
			}
		//}
		
		if ( this.hea > 0 )
		this._regen_timeout = 30 * 3;
		else
		this._regen_timeout = 30 * 60;
		
		if ( this.hea > 0 && !was_alive )
		if ( initiator && initiator.IsPlayerClass() )
		this.Say( 'What is this generosity', true );
		
		if ( this.hea <= 0 && was_alive )
		{
			if ( !this.scar )
			{
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
		
				this.scar = 1;
			}
			
			this._play_fall_sound = true;
			
			sdSound.PlaySound({ name:'overlord_deathC', x:this.x, y:this.y, volume:1 });
			
			if ( this.has_gun )
			{
				this.has_gun = 0;
				
				this.SetTarget( this._current_target, true );
				
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun = new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_OVERLORD_BLASTER });
					
					gun.sx = this.sx;
					gun.sy = this.sy;
					
					sdEntity.entities.push( gun );
					
					this._droppen_gun_entity = gun;
					
				}, 0 );
			}
		}
		else
		{
			if ( initiator !== this && initiator !== null )
			if ( dmg > 0 )
			{
				if ( initiator !== this._current_target || this._peaceful_mode )
				if ( initiator && initiator.IsPlayerClass() )
				this.Say( 'You are hitting us' );

				if ( ~~( old_hp / this.hmax * 6 ) !== ~~( this.hea / this.hmax * 6 ) )
				{
					sdSound.PlaySound({ name:'overlord_hurtC', x:this.x, y:this.y, volume:0.7 });
					this.sentence_to_speak = '';
					this._hurt_timer = 5;
				}
			}
		}
		
		if ( this.hea < -3000 )
		{
			{
				let a,s,x,y,k;

				sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:1.8 }); // 3 was fine

				for ( let i = 0; i < 17; i++ )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;

					k = Math.random();

					x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
					y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );

					if ( this.GetBleedEffect() === sdEffect.TYPE_BLOOD )
					{
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD });
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
					}
				}
			}

			this.remove();
		}
	}
	get mass() { return 1200; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		let pathfinding_result = null;
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this.hea < this.hmax )
		this.hea = Math.min( this.hea + GSPEED, this.hmax );

		if ( sdWorld.is_server )
		{
			if ( !this._current_target || this._peaceful_mode )
			{
				let e = this.GetRandomEntityNearby();

				if ( this.GetRelationLevelWithEntity( e ) < 0 )
				this.SetTarget( e );
			}
			
			if ( this._droppen_gun_entity )
			if ( this._droppen_gun_entity._is_being_removed )
			this._droppen_gun_entity = null;
		}
		
		let extremely_mad_intent = false;
			
		if ( this.hea <= 0 )
		{
			if ( sdWorld.is_server )
			{
				if ( this._phys_last_touch && !this._phys_last_touch.is( sdBullet ) && 
					this.x + this._hitbox_x2 > this._phys_last_touch.x + this._phys_last_touch._hitbox_x1 &&
					this.x + this._hitbox_x1 < this._phys_last_touch.x + this._phys_last_touch._hitbox_x2 )
				{
					if ( this._play_fall_sound )
					{
						this._play_fall_sound = false;
						sdSound.PlaySound({ name:'slug_jump', x:this.x, y:this.y, pitch: 0.9, volume: 0.25 });
						
						
						setTimeout( ()=>
						{
							if ( !this._is_being_removed )
							if ( this.hea <= 0 )
							this.Say([ 
								'We were only executing orders',
								'We are innocent',
								'It wasn\'t our fault',
								'We\'ve been told to do that',
								'You could have been in our place',
								'We meant no harm to you',
								'We are not a single organism',
								'You have already won',
								'Save the survivors',
								'You have saved us',
								'Remaining of us salute you'
							][ ~~( Math.random() * 11 ) ], true );
							
						}, 3000 );
					}
					this.state_hp = 3;
				}
				else
				this.state_hp = 2;
			}
		}
		else
		{
			if ( sdWorld.is_server )
			this.state_hp = ( this.hea < this.hmax * 0.5 ) ? 1 : 0;

			// It makes sense to call it at all times because it also handles wall attack logic
			if ( this._current_target )
			{
				pathfinding_result = this._pathfinding.Think( GSPEED );
			}
		
			if ( sdWorld.is_server )
			{
				if ( pathfinding_result )
				{
					if ( pathfinding_result.attack_target && !this._peaceful_mode )
					{
						extremely_mad_intent = true;

						let t = pathfinding_result.attack_target;
						
						if ( this._attack_target !== t )
						{
							this._attack_target = t;

							this._last_known_target_health_before_shots_fired = t.hea || t._hea || 100;
							this._shots_fired_towards_target = 0;
						}
					}
					else
					{
						this.sx += pathfinding_result.act_x * GSPEED * 0.1;
						this.sy += pathfinding_result.act_y * GSPEED * 0.1;
						
						this.PhysWakeUp();
					}
				}

				if ( this._current_target )
				{
					if ( this._current_target._is_being_removed || /*!this._current_target.IsVisible( this ) ||*/ sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdOverlord.max_seek_range + 32 )
					{
						//this._current_target = null;
						this.SetTarget( null );
					}
					else
					{
						if ( this.attack_frame < 1 ) // Not attacking
						{
							if ( pathfinding_result )
							{
								if ( pathfinding_result.act_x > 0 )
								this.side = 1;
								else
								if ( pathfinding_result.act_x < 0 )
								this.side = -1;
							}
							else
							this.side = ( this._current_target.x > this.x ) ? 1 : -1;
						}
					}
				}
				else
				{
					// No target
				}
				
				if ( this._peaceful_mode )
				this._peaceful_rethink_timer -= GSPEED;
				
				if ( !this._current_target || ( this._peaceful_mode && this._peaceful_rethink_timer <= 0 ) )	
				{
					//let e = this.GetRandomEntityNearby();
					
					this._peaceful_rethink_timer = 30 * 10;
					
					//this.SetTarget( e, false, true );
					
					if ( sdWorld.sockets.length > 0 )
					{
						let i = Math.floor( Math.random() * sdWorld.sockets.length );
						if ( sdWorld.sockets[ i ].character )
						{
							this.SetTarget( sdWorld.sockets[ i ].character, false, true );
						}
					}
				}
				
				if ( this.state_hp <= 0 ) // Only if healthy - in else case it won't be able to melee
				if ( !this.has_gun )
				if ( this._droppen_gun_entity )//&& !this._droppen_gun_entity._is_being_removed )
				{
					let t = this._droppen_gun_entity;
					if ( sdWorld.inDist2D_Boolean( t.x, t.y, this.x, this.y, 100 ) )
					if ( sdWorld.CheckLineOfSight( this.x, this.y, t.x, t.y, this ) )
					{
						if ( this._current_target !== t )
						{
							if ( t._held_by )
							this.Say( 'This belongs to us' );

							this.SetTarget( t );
						}
					}
				}
			}
		}
		
		
		
		//if ( sdWorld.is_server )
		{
			if ( this._speak_delay > 0 )
			this._speak_delay -= GSPEED;
			else
			{
				
				let talk_speed = ( this.state_hp <= 0 ) ? 1 : 0.8;
				
				this._speak_delay = 3.5 / talk_speed;

				if ( this.sentence_to_speak.length > 0 )
				{
					if ( this.state_hp === 0 || this.speak_forced )
					{
						let char_code = this.sentence_to_speak.charCodeAt( 0 );

						let target_speak_frame = ( 681 + char_code * 7 ) % 3;

						//this._speak_frame = ~~( Math.random() * 3 );
						//this._speak_frame = ( 681 + char_code * 7 ) % 3;

						if ( this._speak_frame < target_speak_frame )
						this._speak_frame++;
						else
						if ( this._speak_frame > target_speak_frame )
						this._speak_frame--;
						else
						{
							if ( this._speak_frame === 0 )
							this._speak_frame = 1;
							else
							if ( this._speak_frame === 1 )
							this._speak_frame = 0;
							else
							if ( this._speak_frame === 2 )
							this._speak_frame = 1;
						}

						this.sentence_to_speak = this.sentence_to_speak.substring( 1 );

						//sdSound.PlaySound({ name:'overlord_chatter' + ~~( 1 + Math.random() * 5 ), x:this.x, y:this.y, volume:0.3 });
						sdSound.PlaySound({ name:'overlord_chatter' + ~~( 1 + ( char_code % 5 ) ), x:this.x, y:this.y, volume:0.3, pitch:talk_speed, _server_allowed:true });
						
						this._reload_timer = 10;
					}
					else
					{
						this.sentence_to_speak = '';
					}
				}
				else
				{
					this._speak_frame = -1;
				}
			}

			if ( sdWorld.is_server )
			{
				this.mouth = ( this._speak_frame === -1 ) ? ( ( this._current_target && !this._peaceful_mode ) ? ( extremely_mad_intent ? 3 : 2 ) : 0 ) : this._speak_frame;
				
				if ( this._hurt_timer > 0 )
				{
					this._hurt_timer -= GSPEED;
					
					
					if ( this._hurt_timer > 2.5 )
					this.mouth = 3;
					else
					this.mouth = 2;
				}
				
				if ( this.mouth === 3 )
				this._sweat_amount = Math.min( 1, this._sweat_amount + GSPEED * 0.002 );
				else
				this._sweat_amount = Math.max( 0, this._sweat_amount - GSPEED * 0.002 );
				
				this.sweat = ( this._sweat_amount > 0.5 ) ? 1 : 0;
			}
			
			
			if ( this.mouth >= 2 || this.state_hp >= 3 )
			{
				this._occasional_anger_noises_timer -= GSPEED;

				if ( this._occasional_anger_noises_timer < 0 )
				{
					this._occasional_anger_noises_timer = 30 * 6;

					sdSound.PlaySound({ name:'overlord_nearbyB', x:this.x, y:this.y, volume:0.5, _server_allowed:true });
				}
			}

			if ( this.state_hp <= 1 )
			{
				this._occasional_levitation_sounds_timer -= GSPEED;

				if ( this._occasional_levitation_sounds_timer < 0 )
				{
					this._occasional_levitation_sounds_timer = 30 * 10;

					sdSound.PlaySound({ name:'overlord_nearby', x:this.x, y:this.y, volume:0.75, _server_allowed:true });
				}
			}
		}
		
		
				
		if ( sdWorld.is_server )
		{
			if ( this._attack_target )
			if ( this._attack_target._is_being_removed )
			{
				this._attack_target = null;
			}
			
			if ( this.state_hp <= 1 && this._attack_target && this.sentence_to_speak.length <= 0 )
			{
				this._concentration = Math.min( 1, this._concentration + GSPEED * 0.001 );
				
				let t = this._attack_target;

				this.side = ( t.x > this.x ) ? 1 : -1;

				//let an = Math.atan2( this.x - ( t.x + ( t._hitbox_x1 + t._hitbox_x2 ) / 2 ), this.y + sdOverlord.rifle_offset_y - ( t.y + ( t._hitbox_y1 + t._hitbox_y2 ) / 2 ) );
				let an = Math.atan2( this.x - ( t.x + ( t._hitbox_x1 + t._hitbox_x2 ) / 2 ), this.y + sdOverlord.rifle_offset_y - ( t.y + ( t._hitbox_y1 + t._hitbox_y2 ) / 2 ) );

				let waving = Math.sin( sdWorld.time / 500 * Math.PI + this._anim_shift ) * 0.3;

				this.attack_an = ( this.side * ( an + waving * ( 1 - this._concentration * 0.9 ) ) + Math.PI * 0.5 ) / Math.PI * 180;

				if ( this._reload_timer > 0 )
				this._reload_timer -= GSPEED;
				else
				if ( this._reload_timer <= 0 )
				{
					this._reload_timer = 5;

					this._muzzle_timer = 5;

					if ( this.sweat )
					this._reload_timer *= 0.666;

					if ( this.state_hp >= 1 )
					this._reload_timer *= 0.666;

					if ( this.scar >= 1 )
					this._reload_timer *= 0.666;
				
					if ( this.has_gun )
					{
						sdSound.PlaySound({ name:'overlord_cannon4', x:this.x, y:this.y, volume:0.33 });

						this._shots_fired_towards_target++;
						
						if ( this._shots_fired_towards_target > 60 )
						{
							if ( ( t.hea || t._hea || 100 ) >= this._last_known_target_health_before_shots_fired )
							{
								this._attack_target = null;
								
								if ( this._current_target === t )
								{
									this.Say( 'I don\'t like you ' + sdWorld.ClassNameToProperName( t.GetClass() ) + ', you are annoying' );
									this._wont_attack_net_ids[ t.biometry || t._biometry || t._net_id ] = 1;
									
									this.SetTarget( null );
								}
							}
						}

						an += ( Math.random() * 0.2 - 0.1 + waving ) * ( 1 - this._concentration * 0.9 );

						let dx2 = 0;
						let dy2 = 0;
						{
							dx2 = t.x + ( t._hitbox_x1 + t._hitbox_x2 ) / 2 - this.x;
							dy2 = t.y + ( t._hitbox_y1 + t._hitbox_y2 ) / 2 - ( this.y + sdOverlord.rifle_offset_y );

							let di = sdWorld.Dist2D_Vector( dx2, dy2 );

							dx2 += ( t.sx || 0 ) * di / 12;
							dy2 += ( t.sy || 0 ) * di / 12;

							di = sdWorld.Dist2D_Vector( dx2, dy2 );

							if ( di > 1 )
							{
								dx2 /= di;
								dy2 /= di;
							}
						}

						let dx = -Math.sin( an );
						let dy = -Math.cos( an );

						dx = dx * ( 1 - this._concentration ) + dx2 * this._concentration;
						dy = dy * ( 1 - this._concentration ) + dy2 * this._concentration;

						let bullet_obj = new sdBullet({ x: this.x, y: this.y + sdOverlord.rifle_offset_y });

						bullet_obj._owner = this;

						bullet_obj.sx = dx;
						bullet_obj.sy = dy;
						bullet_obj.x += bullet_obj.sx * 9;
						bullet_obj.y += bullet_obj.sy * 9;

						bullet_obj.sx *= 12;
						bullet_obj.sy *= 12;

						bullet_obj._damage = 0;
						bullet_obj.color = '#ff00aa';

						bullet_obj.model = 'blaster_proj';

						bullet_obj.explosion_radius = 4;
						
						//bullet_obj._custom_target_reaction = sdGun.classes[ sdGun.CLASS_OVERLORD_BLASTER ].projectile_properties._custom_target_reaction;
						
						//bullet_obj.explosion_radius = 0; // Hack

						sdEntity.entities.push( bullet_obj );
					}
					else
					{
						this._reload_timer *= 10;
						this._melee_scheduled = true;
					}
				}
			}
			else
			{
				this._concentration = Math.max( 0, this._concentration - GSPEED * 0.001 );
			}

			this.attack_frame = ( this._muzzle_timer > 2.5 ) ? 1 : 0;

			if ( this._muzzle_timer > 0 )
			this._muzzle_timer -= GSPEED;
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			this.sy -= sdWorld.gravity * GSPEED;
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
		}
		
		if ( this.state_hp <= 1 )
		{
			if ( this.state_hp <= 0 ) // Only when healthy (no animation frames so far)
			{
				if ( ( this._melee_scheduled && sdWorld.is_server ) || this.melee_anim > 0 )
				{
					let before = this.melee_anim;
					this.melee_anim += GSPEED * 2;

					if ( before < 15 )
					if ( this.melee_anim >= 15 )
					{
						let t = this._attack_target;
						if ( t )
						if ( !t._is_being_removed )
						if ( sdWorld.inDist2D_Boolean( t.x, t.y, this.x, this.y + sdOverlord.rifle_offset_y, 50 ) )
						if ( sdWorld.CheckLineOfSight( this.x, this.y, t.x, t.y, this, [ t.GetClass() ] ) )
						{
							if ( t === this._droppen_gun_entity )
							{
								t.remove();
								this.has_gun = true;
								
								this.Say( 'Where did we stop again?' );
							}
							else
							{
								t.DamageWithEffect( 60 );

								let an = Math.atan2( this.x - ( t.x + ( t._hitbox_x1 + t._hitbox_x2 ) / 2 ), this.y + sdOverlord.rifle_offset_y - ( t.y + ( t._hitbox_y1 + t._hitbox_y2 ) / 2 ) );

								let dx = -Math.sin( an ) * 80 * 8;
								let dy = -Math.cos( an ) * 80 * 8;

								t.Impulse( dx, dy );
								
								t.PlayDamageEffect( t.x + ( t._hitbox_x1 + t._hitbox_x2 ) / 2, t.y + ( t._hitbox_y1 + t._hitbox_y2 ) / 2 );
								//sdWorld.SendEffect({ x:t.x + ( t._hitbox_x1 + t._hitbox_x2 ) / 2, y:t.y + ( t._hitbox_y1 + t._hitbox_y2 ) / 2, type:t.GetBleedEffect(), filter:t.GetBleedEffectFilter() });
							}
						}
					}

					if ( this.melee_anim > 30 )
					{
						this.melee_anim = 0;
						this._melee_scheduled = false;
						this.melee_arm = 1 - this.melee_arm;
					}
				}
			}
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	Say( t, force_say=false )
	{
		if ( ( this.state_hp === 0 && this.sentence_to_speak.length === 0 ) || force_say )
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

			this.sentence_to_speak = t;
			this._speak_delay = 0;
			this._speak_frame = 0;
			this.speak_forced = force_say;
		}
	}
	GetRandomEntityNearby()
	{
		let an = Math.random() * Math.PI * 2;

		if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.x + Math.sin( an ) * 900, this.y + Math.cos( an ) * 900, this ) )
		//if ( sdWorld.last_hit_entity )
		{
			return sdWorld.last_hit_entity;
		}
		return null;
	}
	GetRelationLevelWithEntity( e )
	{
		if ( !e )
		return 0;
	
		if ( e.is( sdBlock ) && e._natural && e.IsDefaultGround() && Math.random() < 0.995 )
		return 0;
		
		if ( e.IsPlayerClass() && e._score <= 30 )
		return 0;
	
		if ( typeof this._wont_attack_net_ids[ e.biometry || e._biometry || e._net_id ] !== 'undefined' )
		return 0;
	
		if ( !sdArea.CheckPointDamageAllowed( e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2, e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2 ) )
		return 0;
	
		let class_name = e.GetClass();
				
		if ( typeof this._relations_to_classes[ class_name ] === 'undefined' )
		this._relations_to_classes[ class_name ] = Math.random() - 0.5;

		return this._relations_to_classes[ class_name ];
	}
	AddRelationLevelToEntity( e, v )
	{
		if ( !e )
		return;
	
		let class_name = e.GetClass();
				
		if ( typeof this._relations_to_classes[ class_name ] === 'undefined' )
		this._relations_to_classes[ class_name ] = Math.random() - 0.5;

		this._relations_to_classes[ class_name ] += v;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.state_hp <= 1 )
		{
			sdEntity.Tooltip( ctx, "Overlord" );
			this.DrawHealthBar( ctx, undefined, 10 );
		}
		else
		sdEntity.Tooltip( ctx, "Defeated overlord" );
	}
	Draw( ctx, attached )
	{
		if ( !sdShop.isDrawing )
		{
			//ctx.filter = this.filter;
			
			if ( sdRenderer.visual_settings === 4 )
			ctx.sd_hue_rotation = this.hue;
			else
			ctx.filter = 'hue-rotate(' + this.hue + 'deg)';
		}
		
		ctx.scale( -this.side, 1 );
		//ctx.rotate( this.attack_an / 100 );
		
		let offset = this.state_hp;
		
		let draw_arm = null;
		
		if ( offset === 0 && this.melee_anim !== 0 )
		{
			draw_arm = ()=>
			{
				let origin_x = 14;
				let origin_y = 41;

				if ( this.melee_arm === 1 )
				origin_x = 23;

				ctx.save();
				{
					ctx.translate( origin_x - 16, origin_y - 32 );
					ctx.rotate( this.attack_an / 180 * Math.PI + Math.PI / 2 );

					if ( this.melee_anim < 7.5 || this.melee_anim > 15 + 7.5 )
					ctx.drawImageFilterCache( sdOverlord.img_overlord, 9*32,0,32,64, -16, -32, 32,64 );
					else
					ctx.drawImageFilterCache( sdOverlord.img_overlord, 10*32,0,32,64, -16, -32, 32,64 );
				}
				ctx.restore();
			};
		}
			
		if ( offset <= 1 )
		{
			if ( !sdShop.isDrawing )
			ctx.translate( 0, Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2 );
		}
		else
		{
			if ( offset === 3 )
			{
				if ( ( sdWorld.time+this._anim_shift ) % 9000 < 1200 )
				offset++;
			}
		}
		
		if ( this.melee_arm === 0 )
		if ( draw_arm )
		draw_arm();
		
		if ( offset > 0 || this.melee_anim === 0 )
		ctx.drawImageFilterCache( sdOverlord.img_overlord, offset*32,0,32,64, -16, -32, 32,64 );
		else
		{
			if ( this.melee_arm === 0 )
			ctx.drawImageFilterCache( sdOverlord.img_overlord, 7*32,0,32,64, -16, -32, 32,64 );
			else
			ctx.drawImageFilterCache( sdOverlord.img_overlord, 8*32,0,32,64, -16, -32, 32,64 );
		}
		
		if ( offset === 0 )
		{
			// Blink
			if ( ( sdWorld.time + this._anim_shift * 0.5 ) % 6000 < 150 )
			ctx.drawImageFilterCache( sdOverlord.img_overlord, 1*32,64,32,64, -16, -32, 32,64 );
		
			if ( this.scar )
			ctx.drawImageFilterCache( sdOverlord.img_overlord, 0*32,64,32,64, -16, -32, 32,64 );
		
			ctx.drawImageFilterCache( sdOverlord.img_overlord, (2+this.mouth)*32,64,32,64, -16, -32, 32,64 );
		}
		
		if ( offset <= 1 )
		{
			if ( this.sweat )
			ctx.drawImageFilterCache( sdOverlord.img_overlord, 6*32,64,32,64, -16, -32, 32,64 );
		}
		
		
		if ( this.melee_arm === 1 )
		if ( draw_arm )
		draw_arm();
		
		if ( this.has_gun )
		{
			ctx.filter = 'none';
			ctx.save();
			{
				ctx.translate( 0, sdOverlord.rifle_offset_y );
				ctx.rotate( this.attack_an / 180 * Math.PI );
				ctx.drawImageFilterCache( sdOverlord.img_overlord, ( 5 + this.attack_frame )*32,0,32,64, -16, -32, 32,64 );
			}
			ctx.restore();
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
	}
	
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( this.state_hp <= 1 )
		if ( !this.has_gun )
		if ( from_entity.is( sdGun ) )
		if ( from_entity.class === sdGun.CLASS_OVERLORD_BLASTER )
		if ( !from_entity._is_being_removed )
		{
			if ( this._droppen_gun_entity === from_entity )
			this.Say( 'What a coincedence' );
			else
			this.Say( 'This will do' );
			
			this.has_gun = true;
			from_entity.remove();
		}
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		//sdOverlord.overlord_tot--;
		
		let i = sdOverlord.overlords.indexOf( this );
		
		if ( i !== -1 )
		sdOverlord.overlords.splice( i, 1 );

	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdOverlord.init_class();

export default sdOverlord;
