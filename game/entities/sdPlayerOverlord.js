
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

class sdPlayerOverlord extends sdCharacter
{
	static init_class()
	{
		sdPlayerOverlord.img_overlord = sdWorld.CreateImageFromFile( 'sdOverlord' );
		
		sdPlayerOverlord.frame_width = 32;
		sdPlayerOverlord.frame_height = 64;
		
		sdPlayerOverlord.max_seek_range = 1000;
		
		//sdPlayerOverlord.overlord_tot = 0;
		sdPlayerOverlord.overlords = [];
		
		sdPlayerOverlord.rifle_offset_y = 14;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -13 * this.s / 100; }
	get hitbox_x2() { return 13 * this.s / 100; }
	get hitbox_y1() { return -13 * this.s / 100; }
	get hitbox_y2() { return 10 * this.s / 100; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._speak_id = -1;
		
		this.hmax = 400;
		this.hea = this.hmax;

		this.matter_max = 40;
		this.matter = this.matter_max;
		
		this._matter_capacity_boosters_max = 0;
		
		this._regen_timeout = 0;
		
		this.state_hp = 0; // 0 = healthy, 1 = damaged, 2 = falling down, 3 = fallen + falleng breathing

		//this.attack_an = 0;
		this._muzzle_timer = 0;
		
		this.scar = 0; // Becomes 1 after first defeated state
		
		this.mouth = 0; // 0 = closed, 1 = open, 2 = mad intent, 3 = very mad intent
		
		this.sweat = 0;
		
		this._sweat_amount = 0;

		
		this._hurt_timer = 0;
		
		this._occasional_anger_noises_timer = 0;
		this._occasional_levitation_sounds_timer = 0;

		this._reload_timer = 0;

		this.an = 0;

		this.side = -1;
		
		this.attack_frame = 0;
		
		this._play_fall_sound = false;
		
		this.sentence_to_speak = '';
		this._speak_delay = 0;
		this._speak_frame = 0;
		this.speak_forced = false;
		
		this._anim_shift = 0; ~~( Math.random() * 10000 );
		
		this.has_gun = 1;
		this._droppen_gun_entity = null;
		
		
		this.melee_arm = 0; // 0 or 1
		this.melee_anim = 0; // changes from 0 to 15 or something, then Damage happens, then goes back to 30
		this._melee_scheduled = false; // Becomes true when melee should start
		
		sdPlayerOverlord.overlords.push( this );
		
		this.hue = ~~( Math.random() * 360 );
	}
	onScoreChange()
	{
		if ( sdWorld.server_config.LinkPlayerMatterCapacityToScore( this ) )
		{
			this.matter_max = Math.min( 40 + Math.max( 0, this._score * 20 ), 600 );
			
			
			this.hmax = Math.min( 400 + Math.max( 0, this._score * 10 ), 3000 );
		}
	}
	
	
	/*ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_relations_to_classes' ) return true;
		
		if ( prop === '_attack_target' ) return true;
		//if ( prop === '_current_target' ) return true;
		if ( prop === '_droppen_gun_entity' ) return true;
		if ( prop === '_wont_attack_net_ids' ) return true;
		
		
		
		return false;
	}*/

	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD;
	}

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
		
		
		if ( this.hea > this.hmax )
		this.hea = this.hmax;
		
		if ( this.hea > 0 )
		if ( dmg > 0 )
		this._regen_timeout = 30 * 3;
		else
		if ( dmg > 0 )
		this._regen_timeout = 30 * 60;
		
		if ( this.hea > 0 && !was_alive )
		if ( initiator && initiator.IsPlayerClass() )
		this.Say( 'What is this generosity', true );
		
		if ( this.hea <= 0 && was_alive )
		{
			if ( !this.scar )
			{
				//this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
		
				this.scar = 1;
			}
			
			this._play_fall_sound = true;
			
			sdSound.PlaySound({ name:'overlord_deathC', x:this.x, y:this.y, volume:1 });
			
			/*if ( this.has_gun )
			{
				this.has_gun = 0;
				
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun = new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_OVERLORD_BLASTER });
					
					gun.sx = this.sx;
					gun.sy = this.sy;
					
					sdEntity.entities.push( gun );
					
					this._droppen_gun_entity = gun;
					
				}, 0 );
			}*/
			//Melee is bugged atm so I removed melee and weapon drop
		}
		else
		{
			if ( initiator !== this && initiator !== null )
			if ( dmg > 0 )
			{
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
	TogglePlayerAbility() // part of ManagePlayerVehicleEntrance()
	{
		// Disabled
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.PlayerClassThinkPausedLogic( GSPEED ) )
		return;
	
		this.ConnectedGodLogic( GSPEED );
		
		this._nature_damage = sdWorld.MorphWithTimeScale( this._nature_damage, 0, 0.9983, GSPEED );
		this._player_damage = sdWorld.MorphWithTimeScale( this._player_damage, 0, 0.9983, GSPEED );
		
		let in_water = sdWater.all_swimmers.has( this );

		if ( sdWorld.is_server )
		{
			if ( this._droppen_gun_entity )
			if ( this._droppen_gun_entity._is_being_removed )
			this._droppen_gun_entity = null;

			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED;
			else
			if ( this.hea < this.hmax )
			this.hea = Math.min( this.hea + GSPEED, this.hmax );
		}
		
		if ( this.IsOutOfBounds() )
		this.Damage( this.hmax * GSPEED / ( 30 * 5 ) );
		

		let v = 0.1;
				
		this.act_x = this._key_states.GetKey( 'KeyD' ) - this._key_states.GetKey( 'KeyA' );
		this.act_y = this._key_states.GetKey( 'KeyS' ) - ( ( this._key_states.GetKey( 'KeyW' ) || this._key_states.GetKey( 'Space' ) ) ? 1 : 0 );
		let di = sdWorld.Dist2D_Vector( this.act_x, this.act_y );
		if ( di > 0.75 )
		{
			v = v / di * 1;
		}

		this.sx += this.act_x * v * GSPEED;
		this.sy += this.act_y * v * GSPEED;
		
		if ( this.act_x !== 0 || this.act_y !== 0 )
		this.PhysWakeUp();
			
		this.an = ( -Math.PI/2 - Math.atan2( this.look_x - this.x, this.look_y - this.y - sdPlayerOverlord.rifle_offset_y ) ) * 100;
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
			{
				this.state_hp = ( this.hea < this.hmax * 0.5 ) ? 1 : 0;
				if ( this.matter < this.matter_max )
				this.matter = Math.min( this.matter + GSPEED / 600, this.matter_max );
			}


			// It makes sense to call it at all times because it also handles wall attack logic
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
				this.mouth = ( this._speak_frame === -1 ) ? 0 : this._speak_frame;
				
				if ( this.mouth === 0 )
				{
					if ( this._key_states.GetKey( 'Mouse1' ) )
					{
						this.mouth = 3;
					}
					else
					if ( this._key_states.GetKey( 'Mouse3' ) )
					{
						this.mouth = 2;
					}
					else
					if ( this.act_x !== 0 || this.act_y !== 0 )
					{
						this.mouth = 2;
					}
				}
				
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

			if ( this.state_hp <= 1 )
			{

				//this.side = ( t.x > this.x ) ? 1 : -1;

				//this.attack_an = this.an;

				if ( this._reload_timer > 0 )
				this._reload_timer -= GSPEED;
				else
				if ( this._reload_timer <= 0 && this._key_states.GetKey( 'Mouse1' ) && this.matter > 0.5 )
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

						let dx = -Math.cos( this.an / 100 );
						let dy = -Math.sin( this.an / 100 );

						let bullet_obj = new sdBullet({ x: this.x, y: this.y + sdPlayerOverlord.rifle_offset_y });

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

						bullet_obj.explosion_radius = 9;
						
						//bullet_obj._custom_target_reaction = sdGun.classes[ sdGun.CLASS_OVERLORD_BLASTER ].projectile_properties._custom_target_reaction;
						
						//bullet_obj.explosion_radius = 0; // Hack

						sdEntity.entities.push( bullet_obj );

						this.matter -= 0.5;
					}
					else
					{
						this._reload_timer *= 10;
						this._melee_scheduled = true;
					}
					/*if ( this.state_hp <= 1 )
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

									let dx = -Math.cos( this.an / 100 );
									let dy = -Math.sin( this.an / 100 );
									let bullet_obj = new sdBullet({ x: this.x, y: this.y + sdPlayerOverlord.rifle_offset_y, _rail:true });

									bullet_obj._owner = this;

									bullet_obj.sx = dx;
									bullet_obj.sy = dy;
									bullet_obj.x += bullet_obj.sx * 9;
									bullet_obj.y += bullet_obj.sy * 9;

									bullet_obj.sx *= 12;
									bullet_obj.sy *= 12;

									bullet_obj._damage = 60;

									sdEntity.entities.push( bullet_obj );
								}

								if ( this.melee_anim > 30 )
								{
									this.melee_anim = 0;
									this._melee_scheduled = false;
									this.melee_arm = 1 - this.melee_arm;
								}
							}
						}
					}*/
				}
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
		else
		{
			this.mouth = ( ~~( sdWorld.time / 2000 ) ) % 4;
		}
		
		if ( this.look_x - this.x > 0 )
		ctx.scale( -1, 1 );
		else
		ctx.scale( 1, 1 );

		let scale = this.s / 100;
		
		ctx.scale( scale, scale );
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

					if ( this.look_x - this.x > 0 )
					ctx.scale( -1, 1 );
					else
					ctx.scale( 1, 1 );
					ctx.rotate( this.an / 100 );

					if ( this.melee_anim < 7.5 || this.melee_anim > 15 + 7.5 )
					ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, 9*32,0,32,64, -16, -32, 32,64 );
					else
					ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, 10*32,0,32,64, -16, -32, 32,64 );
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
		ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, offset*32,0,32,64, -16, -32, 32,64 );
		else
		{
			if ( this.melee_arm === 0 )
			ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, 7*32,0,32,64, -16, -32, 32,64 );
			else
			ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, 8*32,0,32,64, -16, -32, 32,64 );
		}
		
		if ( offset === 0 )
		{
			// Blink
			if ( ( sdWorld.time + this._anim_shift * 0.5 ) % 6000 < 150 )
			ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, 1*32,64,32,64, -16, -32, 32,64 );
		
			if ( this.scar )
			ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, 0*32,64,32,64, -16, -32, 32,64 );
		
			ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, (2+this.mouth)*32,64,32,64, -16, -32, 32,64 );
		}
		
		if ( offset <= 1 )
		{
			if ( this.sweat )
			ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, 6*32,64,32,64, -16, -32, 32,64 );
		}
		
		
		if ( this.melee_arm === 1 )
		if ( draw_arm )
		draw_arm();
		
		if ( this.has_gun && this.hea > 0 )
		{
			ctx.filter = 'none';
			ctx.save();
			{
				ctx.translate( 0, sdPlayerOverlord.rifle_offset_y );
				if ( this.look_x - this.x > 0 )
				ctx.scale( -1, 1 );
				else
				ctx.scale( 1, 1 );
				ctx.rotate( this.an / 100 );
				ctx.drawImageFilterCache( sdPlayerOverlord.img_overlord, ( 5 + this.attack_frame )*32,0,32,64, -16, -32, 32,64 );
			}
			ctx.restore();
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
	}
	
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdGun ) && sdGun.classes[ from_entity.class ].ignore_slot ) // Shards
		super.onMovementInRange( from_entity );
		
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
		//sdPlayerOverlord.overlord_tot--;
		
		let i = sdPlayerOverlord.overlords.indexOf( this );
		
		if ( i !== -1 )
		sdPlayerOverlord.overlords.splice( i, 1 );

	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdPlayerOverlord.init_class();

export default sdPlayerOverlord;
