
//const sdEntity = module.exports.sdEntity;

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdKeyStates from '../sdKeyStates.js';

import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdBullet from './sdBullet.js';
import sdBlock from './sdBlock.js';
import sdWater from './sdWater.js';

import sdShop from '../client/sdShop.js';

//const sdEntity = require( __dirname + '/sdEntity.js'); 

class sdCharacter extends sdEntity
{
	static init_class()
	{
		sdCharacter.img_legs_idle = sdWorld.CreateImageFromFile( 'legs_idle' );
		sdCharacter.img_legs_walk1 = sdWorld.CreateImageFromFile( 'legs_walk1' );
		sdCharacter.img_legs_walk2 = sdWorld.CreateImageFromFile( 'legs_walk2' );
		sdCharacter.img_legs_crouch = sdWorld.CreateImageFromFile( 'legs_crouch' );
		sdCharacter.img_legs_crouch_walk1 = sdWorld.CreateImageFromFile( 'legs_crouch_walk1' );
		
		sdCharacter.img_body_idle = sdWorld.CreateImageFromFile( 'body_idle' );
		sdCharacter.img_body_armed = sdWorld.CreateImageFromFile( 'body_armed' );
		sdCharacter.img_body_fire1 = sdWorld.CreateImageFromFile( 'body_fire1' );
		sdCharacter.img_body_fire2 = sdWorld.CreateImageFromFile( 'body_fire2' );
		sdCharacter.img_body_melee1 = sdWorld.CreateImageFromFile( 'body_melee1' );
		sdCharacter.img_body_melee2 = sdWorld.CreateImageFromFile( 'body_melee2' );
		sdCharacter.img_body_reload1 = sdWorld.CreateImageFromFile( 'body_reload1' );
		sdCharacter.img_body_reload2 = sdWorld.CreateImageFromFile( 'body_reload2' );
		sdCharacter.img_body_hurt = sdWorld.CreateImageFromFile( 'body_hurt' );
		
		sdCharacter.img_death1 = sdWorld.CreateImageFromFile( 'death1' );
		sdCharacter.img_death2 = sdWorld.CreateImageFromFile( 'death2' );
		sdCharacter.img_death3 = sdWorld.CreateImageFromFile( 'death3' );
		sdCharacter.img_death4 = sdWorld.CreateImageFromFile( 'death4' );
		sdCharacter.img_death4_visor_tint = sdWorld.CreateImageFromFile( 'death4_visor_tint' );
		
		sdCharacter.img_jetpack = sdWorld.CreateImageFromFile( 'jetpack' );
		
		sdCharacter.air_max = 30 * 30; // 30 sec
		
		sdCharacter.bullet_y_spawn_offset = -2;
		
		sdCharacter.last_build_deny_reason = null;
		
		sdCharacter.disowned_body_ttl = 60 * 60;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get substeps() // sdCharacter that is being controlled by player will need more
	{
		if ( !sdWorld.is_server )
		{
			if ( sdWorld.my_entity === this )
			return Math.ceil( sdWorld.GSPEED ); // More if GSPEED is more than 1
		}
		
		return 1;
	}
	
	GetHitDamageMultiplier( x, y )
	{
		if ( this.hea > 0 )
		{
			let di_to_head = sdWorld.Dist2D( x, y, this.x + 8 * Math.sin( this.tilt / 100 ), this.y - 8 * Math.cos( this.tilt / 100 ) );
			let di_to_body = sdWorld.Dist2D( x, y, this.x + 0 * Math.sin( this.tilt / 100 ), this.y - 0 * Math.cos( this.tilt / 100 ) );

			if ( di_to_head < di_to_body )
			return 1.65;
		}
	
		return 1;
	}
	AllowClientSideState() // Conditions to ignore sdWorld.my_entity_protected_vars
	{
		return ( this.hea > 0 && sdWorld.time > this._position_velocity_forced_until && ( this.hook_x === 0 && this.hook_y === 0 ) ); // Hook does not work well with position corrections for laggy players
	}
	ApplyServerSidePositionAndVelocity( restrict_correction, sx, sy ) // restrict_correction is usually ever only true when player should get position correction restriction, assuming some server-side events exist that control player (grappling hook case)
	{
		if ( sdWorld.is_server )
		{
			if ( restrict_correction )
			this._position_velocity_forced_until = sdWorld.time + 200; // Somewhat equal to max ping?
		
			this._force_add_sx = sx;
			this._force_add_sy = sy;
		}
	}
	constructor( params )
	{
		super( params );
		
		this.title = 'Random Hero #' + this._net_id;
		this._my_hash = undefined; // Will be used to let players repsawn within same entity if it exists on map
		this._old_score = 0; // This value is only read/written to when player disconnects and reconnects
		
		// Some stats for Cubes to either attack or ignore players
		this._nature_damage = 0;
		this._player_damage = 0;
		
		this._non_innocent_until = 0; // Used to determine who gone FFA first
		
		this._fall_sound_time = 0;
		
		this.sx = 0;
		this.sy = 0;
		
		// Disables position correction during short period of time (whenever player is pushed, teleported, attacked by sdOctopus etc). Basically stuff that client can't calculate (since projectiles deal no damage nor knock effect)
		this._position_velocity_forced_until = 0;
		this._force_add_sx = 0;
		this._force_add_sy = 0;

		this._side = 1;
		this.stands = false;
		this._stands_on = null;
		
		this.hea = 130;
		this.hmax = 130;
		this._dying = false;
		this._dying_bleed_tim = 0;

		this.anim_death = 0;
		this._anim_walk = 0;
		this.fire_anim = 0;
		this.reload_anim = 0;
		this.pain_anim = 0;
		this.death_anim = 0;

		this.act_x = 0;
		this.act_y = 0;
		this.act_fire = 0;

		this.look_x = 0;
		this.look_y = 0;
		this._an = 0;
		
		this.tilt = 0; // X button
		this.tilt_speed = 0;
		
		this._crouch_intens = 0;
		
		this._ignored_guns = []
		this._ignored_guns_until = [];
		
		this._inventory = []; this._inventory.length = 10; this._inventory.fill( null );
		this.gun_slot = 0;
		this._backup_slot = 0;
		
		this.hook_x = 0;
		this.hook_y = 0;
		this._hook_len = -1;
		this._hook_once = true;
		this._hook_relative_to = null;
		this._hook_relative_x = 0;
		this._hook_relative_y = 0;
		
		this._hook_allowed = false; // Through upgrade
		this._jetpack_allowed = false; // Through upgrade
		this._ghost_allowed = false; // Through upgrade
		this._coms_allowed = false; // Through upgrade, only non-proximity one
		this._damage_mult = 1; // Through upgrade
		this._build_hp_mult = 1; // Through upgrade
		
		this.flying = false; // Jetpack flying
		this._last_act_y = this.act_y; // For mid-air jump jetpack activation
		
		this.ghosting = false;
		this._last_e_state = 0; // For E key taps to activate ghosting
		
		this._upgrade_counters = {}; // key = upgrade
		
		this._regen_timeout = 0;
		
		this._key_states = new sdKeyStates();
		this._q_held = false;
		
		this._air = sdCharacter.air_max;
		
		this._build_params = null; // What player is about to build
		
		//this.hue = ~~( Math.random() * 360 );
		//this.saturation = ~~( 50 + Math.random() * 200 );
		
		//this.filter = params.filter || '';
		this.sd_filter = params.sd_filter || null; // Custom per-pixel filter
		
		this._voice = {
			wordgap: 0,
			pitch: 50,
			speed: 175,
			variant: 'klatt'
		};
		this._speak_id = -1; // last voice message
		this._say_allowed_in = 0;
		
		//this.team_id = 0; // 0 is FFA team
	
		this.matter = 50;
		this.matter_max = 50;
		
		this.stim_ef = 0; // Stimpack effect
		
		this._matter_old = this.matter;
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return this._key_states.GetKey('KeyX') ? [ 'sdCharacter' ] : null;
	}
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( !this.ghosting )
		return true;
	
		if ( this.flying || this.hea <= 0 || ( this.fire_anim > 0 && this.gun_slot !== 0 ) || this.pain_anim > 0 )
		return true;
	
		if ( observer_character )
		if ( sdWorld.Dist2D( observer_character.x, observer_character.y, this.x, this.y ) < 20 )
		return true;
		
		if ( observer_character )
		if ( sdWorld.GetComsNear( this.x, this.y, null, observer_character._net_id ).length > 0 )
		{
			return true;
		}
		
		return false;
	}
	/*static GetNewNonFFATeamID()
	{
		var used_teams = {};
		for ( var i = 0; i < sdEntity.entities.length; i++ )
		if ( typeof sdEntity.entities[ i ].team_id !== 'undefined' )
		used_teams[ sdEntity.entities[ i ].team_id ] = true;

		var best_team_id = 1;
		
		while ( typeof used_teams[ best_team_id ] !== 'undefined' )
		best_team_id++;
	}*/
	
	
	InstallUpgrade( upgrade_name ) // Ignores upper limit condition. Upgrades better be revertable and resistent to multiple calls within same level as new level
	{
		var upgrade_obj = sdShop.upgrades[ upgrade_name ];
		
		if ( typeof this._upgrade_counters[ upgrade_name ] === 'undefined' )
		this._upgrade_counters[ upgrade_name ] = 1;
		else
		this._upgrade_counters[ upgrade_name ]++;
	
		upgrade_obj.action( this, this._upgrade_counters[ upgrade_name ] );
		
		if ( this._socket )
		this._socket.emit( 'UPGRADE_SET', [ upgrade_name, this._upgrade_counters[ upgrade_name ] ] );
	}
	get hitbox_x1() { return this.death_anim < 20 ? -5 : -12; } // 7
	get hitbox_x2() { return this.death_anim < 20 ? 5 : 12; }
	get hitbox_y1() { return this.death_anim < 20 ? -12 : 12; }
	get hitbox_y2() { return this.death_anim < 20 ? ( ( 16 - this._crouch_intens * 6 ) * ( 0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7 ) ) : 16; }

//0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7

	get hard_collision() // For world geometry where players can walk
	{ return ( this.death_anim < 20 ); }
	
	GetVoicePitch()
	{
		let v = this._voice.pitch / 50;
		
		if ( v >= 1 )
		return ( v + 1 * 3 ) / 4;
	
		
		return ( v + 1 * 6 ) / 7;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator === this )
		initiator = null;
			
		let was_alive = ( this.hea > 0 );
			
		if ( dmg > 0 )
		{
			if ( was_alive )
			{
				if ( initiator )
				if ( initiator.is( sdCharacter ) )
				if ( initiator._socket )
				if ( sdWorld.time >= this._non_innocent_until ) // Victim is innocent
				initiator._non_innocent_until = sdWorld.time + 1000 * 30;
			}

			this.hea -= dmg;

			if ( this.hea <= 0 && was_alive )
			{
				if ( this.hea < -100 )
				sdSound.PlaySound({ name:'sd_death2', x:this.x, y:this.y, volume:1, pitch:this.GetVoicePitch() });
				else
				sdSound.PlaySound({ name:'sd_death', x:this.x, y:this.y, volume:1, pitch:this.GetVoicePitch() });
			
				this.DropWeapons();
				
				if ( initiator )
				if ( initiator.is( sdCharacter ) )
				if ( initiator._socket )
				{
					if ( this._socket )
					if ( this._socket.score > 0 )
					{
						initiator._socket.score += ~~( ( this._socket.score - 1 ) * 0.5 );
						this._socket.score = 1; // Or else body will break on respawn
					}
					
					//console.log( 'initiator._socket.ffa_warning', initiator._socket.ffa_warning );

					if ( sdWorld.time < initiator._non_innocent_until ) // Attacker is not innocent
					{
						if ( initiator._socket.ffa_warning === 0 )
						initiator._socket.emit('SERVICE_MESSAGE', 'Your respawn rate was temporarily decreased' );

						initiator._socket.SyncFFAWarning();
						initiator._socket.ffa_warning += 1;
						initiator._socket.respawn_block_until = sdWorld.time + initiator._socket.ffa_warning * 5000;
					}
				}
			}
			else
			{
				if ( was_alive )
				//if ( dmg > 1 )
				{
					if ( this.pain_anim <= 0 )
					{
						sdSound.PlaySound({ name:'sd_hurt' + ~~(1+Math.random() * 2), x:this.x, y:this.y, pitch:this.GetVoicePitch(), volume:( dmg > 1 )? 1 : 0.5 }); // less volume for bleeding
						this.pain_anim = 10;
					}
				}
			}
			
			
			if ( this.hea < -150 )
			{
				for ( var x = this.hitbox_x1; x < this.hitbox_x2; x += 4 )
				{
					sdWorld.SendEffect({ x:this.x + x - 3 + Math.random() * 3, y:this.y + 16 - 3 + Math.random() * 3, type:sdEffect.TYPE_BLOOD });
				}
				this.remove();
			}
			
			this._regen_timeout = 30;
			if ( this.hea < 30 )
			this._dying = true;
		}
		else
		if ( this._socket !== null )
		{
			if ( this.hea < 0 )
			this.hea = 0;
			
			this.hea += Math.abs( dmg );
			
			if ( this.hea > 0 && !was_alive )
			{
				this.death_anim = 0;
				this.pain_anim = 10;
				this._crouch_intens = 1;
				
				if ( initiator )
				if ( initiator._socket )
				if ( this._socket )
				{
					let share = Math.min( Math.max( 0, initiator._socket.score ), 10 );
					initiator._socket.score -= share;
					this._socket.score += share;
					
					if ( this._non_innocent_until < sdWorld.time ) // Healed player is innocent
					initiator._socket.ffa_warning = Math.max( initiator._socket.ffa_warning - 1, 0 );
				}
			}
			
			this._dying = false;
			
			if ( this.hea > this.hmax )
			this.hea = this.hmax;
		}
	}
	Impulse( x, y )
	{
		this.sx += x * 0.1;
		this.sy += y * 0.1;
		this.ApplyServerSidePositionAndVelocity( false, x * 0.1, y * 0.1 );
	}
	
	UseServerCollisions()
	{
		if ( sdWorld.is_server )
		return true;
	
		if ( sdWorld.my_entity === this && this.AllowClientSideState() )
		return true;
		
		return false;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		/*
		this.matter_max = 1000; // Hack
		this.matter = this.matter_max; // Hack
		this.hea = this.hmax; // Hack
		this._dying = false; // Hack
		this._air = sdCharacter.air_max;
		*/
	   
		if ( this.hea <= 0 )
		{
			if ( this.death_anim < 90 )
			this.death_anim += GSPEED;
			else
			{
				if ( this._socket === null )
				{
					this.death_anim += GSPEED;
					if ( this.death_anim > sdCharacter.disowned_body_ttl )
					{
						this.remove();
					}
				}
			}
		}
		else
		{
			if ( this._dying )
			{
				this.Damage( GSPEED * 0.1 );
				
				if ( this._dying_bleed_tim <= 0 )
				{
					this._dying_bleed_tim = 15;
					sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_BLOOD });
				}
				else
				this._dying_bleed_tim -= GSPEED;
			}
			else
			{
				if ( this.hea < this.hmax )
				{
					this._regen_timeout -= GSPEED;
					if ( this._regen_timeout < 0 )
					{
						if ( this.matter > GSPEED )
						{
							this.matter -= GSPEED * 0.3;
							this.Damage( -GSPEED );
						}
					}
				}
			}
			
			if ( this.fire_anim > 0 )
			this.fire_anim = Math.max( 0, this.fire_anim - GSPEED );

			if ( this.pain_anim > 0 )
			this.pain_anim -= GSPEED;

			this._an = -Math.PI / 2 - Math.atan2( this.y + sdCharacter.bullet_y_spawn_offset - this.look_y, this.x - this.look_x );

			if ( this.reload_anim > 0 )
			{
				this.reload_anim -= GSPEED * ( ( this.stim_ef > 0 ) ? 2 : 1 );

				if ( this.reload_anim <= 0 )
				{
					if ( this._inventory[ this.gun_slot ] )
					this._inventory[ this.gun_slot ].ReloadComplete();
				}
			}
			else
			{
				if ( this._inventory[ this.gun_slot ] )
				{
					if ( this._key_states.GetKey( 'KeyR' ) &&
						 this._inventory[ this.gun_slot ]._ammo_left >= 0 && 
						 this._inventory[ this.gun_slot ]._ammo_left < sdGun.classes[ this._inventory[ this.gun_slot ].class ].ammo_capacity )
					{
						this._inventory[ this.gun_slot ].ReloadStart();
					}
					else
					{
						if ( this._key_states.GetKey( 'Mouse1' ) )
						{


							if ( this._inventory[ this.gun_slot ].Shoot( this._key_states.GetKey( 'ShiftLeft' ) ) )
							{
								this.fire_anim = 5;
							}
						}
					}
				}
			}

			if ( this._key_states.GetKey( 'KeyV' ) )
			{
				this._key_states.SetKey( 'KeyV', 0 ); // So sword is not dropped all the time
				
				if ( this._inventory[ this.gun_slot ] )
				{
					this.DropWeapon( this.gun_slot );
					
					this.gun_slot = 0;
					if ( this.reload_anim > 0 )
					this.reload_anim = 0;
				}
			}

			if ( this._key_states.GetKey( 'KeyQ' ) )
			{
				if ( !this._q_held )
				{
					this._q_held = true;

					let b = this._backup_slot;
					if ( !this._inventory[ b ] )
					b = 0;

					this._backup_slot = this.gun_slot;
					this.gun_slot = b;

					if ( this.reload_anim > 0 )
					this.reload_anim = 0;
				}
			}
			else
			{
				this._q_held = false;
				for ( var i = 0; i < 10; i++ )
				if ( this._inventory[ i ] || i === 0 )
				if ( this._key_states.GetKey( 'Digit' + i ) || ( i === 0 && this._key_states.GetKey( 'Backquote' ) ) )
				{
					if ( this.gun_slot !== i )
					{
						this._backup_slot = this.gun_slot;
						this.gun_slot = i;

						if ( this.reload_anim > 0 )
						this.reload_anim = 0;
					}
					break;
				}
			}
			
		
			this._side = ( this.x < this.look_x ) ? 1 : -1;
		}
		
		if ( this.stim_ef > 0 )
		{
			this.stim_ef = Math.max( 0, this.stim_ef - GSPEED );
		}
		
		//let new_x = this.x + this.sx * GSPEED;
		//let new_y = this.y + this.sy * GSPEED;
		
		//let leg_height = 16 - this._crouch_intens * 6;
		let leg_height = this.hitbox_y2;
		
		let speed_scale = 1;
		
		if ( this.act_y === 1 )
		{
			speed_scale *= 0.5;
			
			this._crouch_intens = sdWorld.MorphWithTimeScale( this._crouch_intens, 1, 0.7, GSPEED );
		}
		else
		{
			if ( this.CanMoveWithoutOverlap( this.x, this.y - 4, 1 ) )
			this._crouch_intens = sdWorld.MorphWithTimeScale( this._crouch_intens, 0, 0.7, GSPEED );
		}
		//let new_leg_height = 16 - this._crouch_intens * 6;
		let new_leg_height = this.hitbox_y2;
		
		//leg_height		*= 0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7;
		//new_leg_height  *= 0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7;
	
		//if ( sdWorld.is_server )
		{
			if ( sdWorld.is_server || sdWorld.my_entity === this )
			{
				if ( this.hea > 0 )
				{
					this.act_x = this._key_states.GetKey( 'KeyD' ) - this._key_states.GetKey( 'KeyA' );
					this.act_y = this._key_states.GetKey( 'KeyS' ) - ( ( this._key_states.GetKey( 'KeyW' ) || this._key_states.GetKey( 'Space' ) ) ? 1 : 0 );
				}
				else
				{
					this.act_x = 0;
					this.act_y = 0;
				}
			}

			if ( sdWorld.is_server )
			{
				/*if ( this.hea > 0 )
				{
					this.act_x = this._key_states.GetKey( 'KeyD' ) - this._key_states.GetKey( 'KeyA' );
					this.act_y = this._key_states.GetKey( 'KeyS' ) - ( ( this._key_states.GetKey( 'KeyW' ) || this._key_states.GetKey( 'Space' ) ) ? 1 : 0 );
				}
				else
				{
					this.act_x = 0;
					this.act_y = 0;
				}*/
				
				if ( this.hea > 0 && this._key_states.GetKey( 'Mouse2' ) && this._hook_allowed )
				{
					if ( this._hook_once )
					{
						this._hook_once = false;
					
						if ( this.hook_x === 0 && this.hook_y === 0 )
						{
							this._hook_once = false;
							let bullet_obj = new sdBullet({ x: this.x, y: this.y + sdCharacter.bullet_y_spawn_offset });
							bullet_obj._owner = this;
							let an = this._an;
							let vel = 16;
							bullet_obj.sx = Math.sin( an ) * vel;
							bullet_obj.sy = Math.cos( an ) * vel;

							//for ( var p in sdGun.classes[ sdGun.CLASS_HOOK ].projectile_properties )
							//bullet_obj[ p ] = sdGun.classes[ sdGun.CLASS_HOOK ].projectile_properties[ p ];

							bullet_obj._hook = true;
							bullet_obj._damage = 0;
							bullet_obj.time_left = 8.5;

							sdEntity.entities.push( bullet_obj );
						}
						else
						{
							this.hook_x = 0;
							this.hook_y = 0;
							this._hook_len = -1;
						}
					}
				}
				else
				{
					//if ( this.hook_x !== 0 )
					//console.warn('hook reset');

					this._hook_once = true;
				}
				
				if ( this.hook_x !== 0 || this.hook_y !== 0 )
				{
					if ( this._hook_relative_to )
					{
						this.hook_x = this._hook_relative_to.x + this._hook_relative_x;
						this.hook_y = this._hook_relative_to.y + this._hook_relative_y;
					}
					
					let from_y = this.y + ( this.hitbox_y1 + this.hitbox_y2 ) / 2;
					
					let cur_di = sdWorld.Dist2D( this.x, from_y, this.hook_x, this.hook_y );

					if ( this._hook_len === -1 )
					this._hook_len = cur_di;
					else
					{
						this._hook_len = sdWorld.MorphWithTimeScale( this._hook_len, cur_di - GSPEED * 10, 0.9, GSPEED );
					}

					let pull_force = -( this._hook_len - cur_di ) / 15;
					let vx = ( this.hook_x - this.x ) / cur_di;
					let vy = ( this.hook_y - from_y ) / cur_di;
					
					if ( this._hook_relative_to )
					{
						if ( typeof this._hook_relative_to.sx !== 'undefined' )
						{
							let lx = this._hook_relative_to.sx;
							let ly = this._hook_relative_to.sy;
							
							this._hook_relative_to.sx -= vx * pull_force * GSPEED;
							this._hook_relative_to.sy -= vy * pull_force * GSPEED;

                            this._hook_relative_to.sx = sdWorld.MorphWithTimeScale( this._hook_relative_to.sx, this.sx, 0.8, GSPEED );
                            this._hook_relative_to.sy = sdWorld.MorphWithTimeScale( this._hook_relative_to.sy, this.sy, 0.8, GSPEED );
							
							if ( this._hook_relative_to.is( sdCharacter ) )
							this._hook_relative_to.ApplyServerSidePositionAndVelocity( true, this._hook_relative_to.sx - lx, this._hook_relative_to.sy - ly );

							pull_force /= 2;
						}


						if ( this._hook_relative_to._is_being_removed )
						{
							this.hook_x = 0;
							this.hook_y = 0;
						}
					}

					this.sx += vx * pull_force * GSPEED;
					this.sy += vy * pull_force * GSPEED;
				}

			}
			
			this.stands = false;
		
			/*
			if ( sdWorld.CheckWallExists( this.x + this.hitbox_x1 + 2, new_y + leg_height ) ||
				 sdWorld.CheckWallExists( this.x + this.hitbox_x2 - 2, new_y + leg_height ) )
			{
				this.stands = true;
				
				if ( sdWorld.CheckWallExists( this.x + this.hitbox_x1 + 2, new_y + leg_height - 1 ) ||
					 sdWorld.CheckWallExists( this.x + this.hitbox_x2 - 2, new_y + leg_height - 1 ) ) // Intersection overlap prevention
				{
					this.y -= 0.5;
					new_y -= 0.5;
				}
			}*/
			
			// 14 is a full width, so revived players don't stuch in each other
			//if ( !this.CanMoveWithoutOverlap( this.x, this.y, sdWorld.is_server ? 0 : 1 ) )
			if ( !this.CanMoveWithoutOverlap( this.x, this.y, this.UseServerCollisions() ? 0 : 0.01 ) )
			{
				if ( this.CanMoveWithoutOverlap( this.x, this.y - 14 ) )
				this.y -= 0.5;
				
				if ( this.CanMoveWithoutOverlap( this.x, this.y + 14 ) )
				this.y += 0.5;
			
				if ( this.CanMoveWithoutOverlap( this.x - 14, this.y ) )
				this.x -= 0.5;
				
				if ( this.CanMoveWithoutOverlap( this.x + 14, this.y ) )
				this.x += 0.5;
			}
			
			//if ( !this.CanMoveWithoutOverlap( this.x, this.y + ( this.UseServerCollisions() ? 2 : 3 ), 1 ) ) Has egde-stand-constant-fall bug, not sure why it was done like that exactly
			if ( !this.CanMoveWithoutOverlap( this.x, this.y + ( this.UseServerCollisions() ? 2 : 3 ), 0 ) )
			//if ( !this.CanMoveWithoutOverlap( this.x, this.y + 2, 1 ) )
			{
				this.stands = true;
				this._stands_on = sdWorld.last_hit_entity;
				this.Touches( sdWorld.last_hit_entity );
			}
		}

		if ( this.act_y === -1 )
		if ( !this.stands )
		if ( Math.abs( this.sy ) < 3 )
		if ( Math.abs( this.sx ) < 3 )
		{
			if ( this.act_x !== -1 )
			if ( sdWorld.CheckWallExists( this.x + this.hitbox_x1 - 5, this.y, this ) )
			{
				this.sy = -3;
				this.sx = 2.5;
			}
			if ( this.act_x !== 1 )
			if ( sdWorld.CheckWallExists( this.x + this.hitbox_x2 + 5, this.y, this ) )
			{
				this.sy = -3;
				this.sx = -2.5;
			}
		}
		
		
		if ( this._key_states.GetKey( 'KeyX' ) )
		{
			this.tilt_speed += this.act_x * 1 * GSPEED;
			speed_scale = 0.1;
		}
	
		this.tilt += this.tilt_speed * GSPEED;
		
		let e_state = this._key_states.GetKey( 'KeyE' );
		
		if ( e_state )
		if ( e_state !== this._last_e_state )
		if ( this._ghost_allowed )
		this.ghosting = !this.ghosting;
	
		this._last_e_state = e_state;
		
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( this.ghosting )
		{
			let fuel_cost = 0.4 * GSPEED;
			
			if ( this.matter < fuel_cost || this.hea <= 0 )
			this.ghosting = false;
			else
			this.matter -= fuel_cost;
		}
		
		if ( this.flying )
		{
			let di = Math.max( 1, sdWorld.Dist2D_Vector( this.act_x, this.act_y ) );
			
			let x_force = this.act_x / di * 0.1;
			let y_force = this.act_y / di * 0.1 - sdWorld.gravity;
			
			let fuel_cost = GSPEED * sdWorld.Dist2D_Vector( x_force, y_force );

			if ( ( this.stands && this.act_y !== -1 ) || this.in_water || this.act_y !== -1 || this._key_states.GetKey( 'KeyX' ) || this.matter < fuel_cost || this.hea <= 0 )
			this.flying = false;
			else
			{
				this.matter -= fuel_cost;
			
				let di = sdWorld.Dist2D_Vector( this.act_x, this.act_y );
				if ( di > 0 )
				{
					this.sx += x_force * GSPEED;
					this.sy += y_force * GSPEED;
				}
			}
		}
		else
		{
			if ( sdWorld.is_server )
			if ( this._jetpack_allowed &&
				 this.act_y === -1 &&
				 this._last_act_y !== -1 &&
				 !this.stands )
			this.flying = true;
		
			this._last_act_y = this.act_y;
		}
		
		let can_breathe = true;
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.93, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.93, GSPEED );
			
			let x_force = this.act_x;
			let y_force = this.act_y;
			let di = sdWorld.Dist2D_Vector( x_force, y_force );
			if ( di > 1 )
			{
				x_force /= di;
				y_force /= di;
			}
			
			this.sx += x_force * 0.2 * GSPEED;
			this.sy += y_force * 0.2 * GSPEED;
			
			if ( !sdWorld.CheckWallExists( this.x, this.y + this.hitbox_y1, null, null, sdWater.water_class_array ) )
			{
				if ( this.act_y === -1 )
				this.sy = -3;
			}
			else
			can_breathe = false;
		}
		else
		{
			if ( this.stands && ( this._stands_on !== this._hook_relative_to || ( this.hook_x === 0 && this.hook_y === 0 ) ) )
			{
				if ( this.sy > 1 )
				{
					if ( !this.ghosting )
					{
						if ( sdWorld.time > this._fall_sound_time + 100 ) // Flood will cause world snapshots to be delayed
						{
							this._fall_sound_time = sdWorld.time;
							sdSound.PlaySound({ name:'player_step', x:this.x, y:this.y, volume:0.5 });
						}
					}
				}

				this.sy = 0;

				this.tilt_speed = sdWorld.MorphWithTimeScale( this.tilt_speed, 0, 0.9, GSPEED );

				if ( this._key_states.GetKey( 'KeyX' ) && this.hea > 0 )
				this.tilt_speed += Math.sin( this.tilt / 100 * 2 ) * GSPEED;
				else
				{
					this.tilt_speed -= Math.sin( this.tilt / 100 ) * 4 * GSPEED;
					this.tilt_speed = sdWorld.MorphWithTimeScale( this.tilt_speed, 0, 0.9, GSPEED );
				}

				//new_y -= new_leg_height - leg_height;
				this.y -= new_leg_height - leg_height;

				if ( Math.abs( Math.sin( this.tilt / 100 ) ) > 0.3 )
				{
					this._crouch_intens = 1;
					this.act_y = 1;

					this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.8, GSPEED );
				}
				else
				{
					if ( this.act_y === -1 )
					{
						//if ( this._crouch_intens > 0.1 )
						//this.sy = Math.min( this.sy, -6 );
						//else
						this.sy = Math.min( this.sy, -4 );
					}
					else
					{
						this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.8, GSPEED );
						this.sx += this.act_x * 1.25 * GSPEED * speed_scale;

						let old_walk = this._anim_walk;
						this._anim_walk += Math.abs( this.sx ) * 0.2 / speed_scale * GSPEED;

						if ( old_walk < 5 && this._anim_walk >= 5 )
						if ( !this.ghosting )
						if ( this._crouch_intens < 0.5 )
						sdSound.PlaySound({ name:'player_step', x:this.x, y:this.y, volume:0.25, _server_allowed:true });

						if ( this._anim_walk > 10 )
						this._anim_walk = 0;
					}
				}
			}
			else
			{
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.98, GSPEED );
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.98, GSPEED );

				if ( this.flying )
				{
				}
				else
				this.sx += this.act_x * 0.15 * GSPEED;
				//this.sx += this.act_x * 0.2 * GSPEED;

				this.sy += sdWorld.gravity * GSPEED;
			}
		}
		
		
		if ( can_breathe )
		{
			if ( this._air < sdCharacter.air_max )
			this._air = Math.min( sdCharacter.air_max, this._air + GSPEED * 3 );
		}
		else
		{
			if ( this._air > 0 )
			this._air = Math.max( 0, this._air - GSPEED );
			else
			{
				if ( this.hea > 0 )
				this.Damage( GSPEED );
			}
		}
		
		this.ApplyVelocityAndCollisions( GSPEED, ( this.hea > 0 ) ? ( this.act_y !== 1 ? 10 : 3 ) : 0 );
		/*
		if ( sdWorld.last_hit_entity )
		{
			if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' )
			if ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP )
			this.Damage( Infinity );
		}*/
	}

	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD;
	}
	onRemove() // Class-specific, if needed
	{
		this.DropWeapons();
		
		if ( sdWorld.is_server )
		{
			if ( this.death_anim <= sdCharacter.disowned_body_ttl )
			{
				let a,s,x,y,k;

				sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine

				for ( let i = 0; i < 6; i++ )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;

					k = Math.random();

					x = this.x + this.hitbox_x1 + Math.random() * ( this.hitbox_x2 - this.hitbox_x1 );
					y = this.y + this.hitbox_y1 + Math.random() * ( this.hitbox_y2 - this.hitbox_y1 );

					//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )

					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD });
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
				}
			}
		}
		else
		{
			if ( this._speak_id !== -1 )
			{
				meSpeak.stop( this._speak_id );
				this._speak_id = -1;
			}
		}
	}
	
	DropWeapons()
	{
		for ( var i = 0; i < this._inventory.length; i++ )
		this.DropWeapon( i );
	}
	DropWeapon( i ) // by slot
	{
		if ( this._inventory[ i ] )
		{
			if ( typeof this._inventory[ i ]._held_by === 'undefined' )
			debugger; // Pickable items should have this property

			if ( this.hea <= 0 || this._is_being_removed )
			{
				this._inventory[ i ].y = this.y + 16 - 4;

				this._inventory[ i ].sx += Math.random() * 6 - 3;
				this._inventory[ i ].sy -= Math.random() * 3;
			}
			else
			{
				this._inventory[ i ].sx += Math.sin( this._an ) * 5;
				this._inventory[ i ].sy += Math.cos( this._an ) * 5;
				
				this._ignored_guns.push( this._inventory[ i ] );
				this._ignored_guns_until.push( sdWorld.time + 300 );
			}

			this._inventory[ i ].ttl = sdGun.disowned_guns_ttl;
			this._inventory[ i ]._held_by = null;
			this._inventory[ i ] = null;
		}
	}

	onMovementInRange( from_entity )
	{
		//console.log( from_entity.GetClass(), from_entity.material, sdBlock.MATERIAL_SHARP, this.hea, sdWorld.is_server );
			
		if ( this.hea > 0 )
		if ( sdWorld.is_server )
		{
			if ( from_entity.GetClass() === 'sdGun' )
			{
				for ( var i = 0; i < this._ignored_guns_until.length; i++ )
				{
					if ( sdWorld.time > this._ignored_guns_until[ i ] )
					{
						this._ignored_guns.splice( i, 1 );
						this._ignored_guns_until.splice( i, 1 );
						i--;
						continue;
					}
				}
				
				if ( from_entity._held_by === null )
				if ( this._ignored_guns.indexOf( from_entity ) === -1 )
				//if ( Math.abs( from_entity.x - this.x ) < 8 )
				//if ( Math.abs( from_entity.y - this.y ) < 16 )
				{
					//if ( this._inventory[ sdGun.classes[ from_entity.class ].slot ] === null )
					if ( sdGun.classes[ from_entity.class ].ignore_slot || this._inventory[ sdGun.classes[ from_entity.class ].slot ] === null )
					{
						if ( !sdGun.classes[ from_entity.class ].onPickupAttempt || 
							  sdGun.classes[ from_entity.class ].onPickupAttempt( this, from_entity ) )
						{	
							this._inventory[ sdGun.classes[ from_entity.class ].slot ] = from_entity;
							from_entity._held_by = this;
							from_entity.ttl = -1;
						}
					}
				}
			}
			else
			if ( from_entity.GetClass() === 'sdBlock' )
			if ( from_entity._contains_class === 'sdQuickie' )
			{
				from_entity.Damage( 1 ); // Will break
			}
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim < 20 )
		{
			let w = 20;
			
			let show_air = false;
			
			if ( sdWorld.my_entity === this )
			if ( this._air < sdCharacter.air_max )
			{
				show_air = true;
			}
			
			let snap_frame = ( ~~( this.death_anim / 10 ) ) * 10 / 20;
			
			ctx.globalAlpha = ( 1 - snap_frame ) * 0.5;
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 20, w, 5 + ( show_air ? 2 : 0 ) );
			
			ctx.globalAlpha = 1 - snap_frame;
			
			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
			
			//ctx.fillStyle = '#000000';
			//ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );
			
			ctx.fillStyle = '#00ffff';
			ctx.fillRect( 1 - w / 2, 3 - 20, ( w - 2 ) * Math.max( 0, Math.min( this.matter / this.matter_max, 1 ) ), 1 );
			
			if ( show_air )
			{
				ctx.fillStyle = '#aaaaff';
				ctx.fillRect( 1 - w / 2, 5 - 20, ( w - 2 ) * Math.max( 0, this._air / sdCharacter.air_max ), 1 );
			}
			
			//
			
			ctx.textAlign = 'center';
			
			let size = 5.5;
			let text_size;
			do
			{
				ctx.font = size + "px Verdana";

				text_size = ctx.measureText( this.title );
				
				size += 0.5;
				
			} while( text_size.width < 20 && size < 10 );
			
			ctx.fillStyle = '#000000';
			ctx.fillText( this.title, 0, -24.5, 50 ); 
			ctx.fillStyle = '#ffffff';
			ctx.fillText( this.title, 0, -25, 50 );
			
			if ( this._inventory[ this.gun_slot ] )
			if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_build_gun )
			if ( this._build_params )
			{
				let fake_ent = this.CreateBuildObject( false );
				if ( fake_ent )
				{
					if ( this.CheckBuildObjectPossibilityNow( fake_ent ) )
					ctx.globalAlpha = 0.5;
					else
					ctx.globalAlpha = 0.2 * ( ( sdWorld.time % 200 < 100 ) ? 1 : 0.5 );

					ctx.translate( -this.x + fake_ent.x, -this.y + fake_ent.y );
					ctx.save();
					fake_ent.DrawBG( ctx, false );
					ctx.restore();
					fake_ent.Draw( ctx, false );
					
					if ( fake_ent.DrawConnections )
					fake_ent.DrawConnections( ctx );
					
					fake_ent.remove();
					fake_ent._remove();
				}
			}
			
			ctx.globalAlpha = 1;
		}
	}
	CheckBuildObjectPossibilityNow( fake_ent )
	{
		//if ( !fake_ent.IsBGEntity )
		fake_ent.GetIgnoredEntityClasses = sdEntity.prototype.GetIgnoredEntityClasses; // Discard effect of this method because doors will have problems in else case
		if ( fake_ent.CanMoveWithoutOverlap( fake_ent.x, fake_ent.y, 1 ) )
		{
			if ( sdWorld.Dist2D( this.x, this.y, this._build_params.x, this._build_params.y ) < 64 )
			{
				if ( this.stands || this.flying )
				return true;
				else
				sdCharacter.last_build_deny_reason = 'I\'d need to stand on something or at least use jetpack';
			}
			else
			sdCharacter.last_build_deny_reason = 'Can\'t build that far';
		}
		else
		{
			if ( fake_ent.IsBGEntity() )
			sdCharacter.last_build_deny_reason = 'Holding Left Shift key while shooting could help getting rid of those';
			else
			sdCharacter.last_build_deny_reason = 'It overlaps with something';
		}
		
		return false;
	}
	CreateBuildObject( check_placement_and_range=true ) // Can be removed later on and used as fake signle-frame object in general
	{
		if ( this._build_params === null )
		return null;
	
		if ( this._build_params._class === null ) // Upgrades
		return null;
		
		let fake_ent = new sdWorld.entity_classes[ this._build_params._class ]( this._build_params );
		
		this._build_params.x = this.look_x;
		this._build_params.y = this.look_y;
		
		fake_ent.x = ( this.look_x - ( fake_ent.hitbox_x2 + fake_ent.hitbox_x1 ) / 2 );
		fake_ent.y = ( this.look_y - ( fake_ent.hitbox_y2 + fake_ent.hitbox_y1 ) / 2 );
		
		if ( fake_ent._owner !== undefined )
		fake_ent._owner = this; // Source of price to go up
		
		if ( fake_ent._hmax !== undefined )
		fake_ent._hmax *= this._build_hp_mult; // Source of price to go up
		
		if ( fake_ent.hmax !== undefined )
		fake_ent.hmax *= this._build_hp_mult; // Source of price to go up
		
		if ( fake_ent._hea !== undefined )
		fake_ent._hea *= this._build_hp_mult; // Or else initial damage might instantly destroy it
		
		if ( fake_ent.hea !== undefined )
		fake_ent.hea *= this._build_hp_mult; // Or else initial damage might instantly destroy it
	
		if ( fake_ent._armor_protection_level !== undefined )
		if ( this._upgrade_counters[ 'upgrade_build_hp' ] )
		{
			fake_ent._armor_protection_level = this._upgrade_counters[ 'upgrade_build_hp' ]; // Because starts at 1
			
			if ( fake_ent.is( sdBlock ) )
			if ( fake_ent.material !== sdBlock.MATERIAL_WALL )
			fake_ent._armor_protection_level = 0;
		}
		
		if ( fake_ent.RequireSpawnAlign() )
		{
			fake_ent.x = Math.round( fake_ent.x / fake_ent.spawn_align_x ) * fake_ent.spawn_align_x;
			fake_ent.y = Math.round( fake_ent.y / fake_ent.spawn_align_y ) * fake_ent.spawn_align_y;
		}
		
		if ( check_placement_and_range )
		{
			if ( !this.CheckBuildObjectPossibilityNow( fake_ent ) )
			{
				fake_ent.onRemove = fake_ent.onRemoveAsFakeEntity; // Disable any removal logic
				fake_ent.remove();
				fake_ent._remove();
				return null;
			}
		}
		
		return fake_ent;
	}
	Draw( ctx, attached )
	{	
		if ( this.ghosting )
		ctx.globalAlpha = 0.3;
		
		//ctx.filter = this.filter;
		ctx.sd_filter = this.sd_filter;
		
		if ( this.hook_x !== 0 || this.hook_y !== 0 )
		{
			let from_y = this.y + ( this.hitbox_y1 + this.hitbox_y2 ) / 2;
			
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#c0c0c0';
			ctx.beginPath();
			ctx.moveTo( 0,from_y - this.y );
			ctx.lineTo( this.hook_x - this.x, this.hook_y - this.y );
			ctx.stroke();
		}
		
		if ( this.death_anim > 0 )
		{
			ctx.scale( this._side, 1 );
			
			if ( this.death_anim > sdCharacter.disowned_body_ttl - 30 )
			ctx.globalAlpha = 0.5;
			
			if ( this.death_anim < 10 )
			ctx.drawImageFilterCache( sdCharacter.img_death1, - 16, - 16, 32,32 );
			else
			if ( this.death_anim < 20 )
			ctx.drawImageFilterCache( sdCharacter.img_death2, - 16, - 16, 32,32 );
			else
			if ( this.death_anim < 30 )
			ctx.drawImageFilterCache( sdCharacter.img_death3, - 16, - 16, 32,32 );
			else
			{
				if ( this._speak_id !== -1 )
				{
					meSpeak.stop( this._speak_id );
					this._speak_id = -1;
				}
				
				ctx.drawImageFilterCache( sdCharacter.img_death4, - 16, - 16, 32,32 );
				ctx.drawImageFilterCache( sdCharacter.img_death4_visor_tint, - 16, - 16, 32,32 );
			}
		}
		else
		{
			
			var image = sdCharacter.img_legs_idle;

			//ctx.fillRect( -4 + 8 * Math.sin( this.tilt / 100 ), -4 - 8 * Math.cos( this.tilt / 100 ), 8, 8 );

			if ( this.stands )
			{
				if ( this._crouch_intens > 0.25 )
				{
					if ( Math.abs( this._anim_walk - 5 ) < 5 / 2 * 1 )
					image = sdCharacter.img_legs_crouch;
					else
					image = sdCharacter.img_legs_crouch_walk1;
				}
				else
				if ( this.act_x !== 0 )
				{
					if ( Math.abs( this._anim_walk - 5 ) < 5 / 3 * 1 )
					{
					}
					else
					if ( Math.abs( this._anim_walk - 5 ) < 5 / 3 * 2 )
					image = sdCharacter.img_legs_walk1;
					else
					image = sdCharacter.img_legs_walk2;
				}
			}
			else
			image = sdCharacter.img_legs_walk2;

			ctx.rotate( this.tilt / 100 );

			ctx.scale( this._side, 1 );

			ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );

			image = sdCharacter.img_body_idle;

			let gun_offset_x = 0;
			let gun_offset_y = 0;

			if ( this.pain_anim > 0 )
			image = sdCharacter.img_body_hurt;

			//if ( this.gun_slot === 0 )
			if ( !this._inventory[ this.gun_slot ] )
			{
			}
			else
			{
				if ( this.reload_anim > 0 )
				{
					if ( this.reload_anim > 30 / 3 * 2 )
					image = sdCharacter.img_body_reload2;
					else
					if ( this.reload_anim > 30 / 3 * 1 )
					image = sdCharacter.img_body_reload1;
					else
					image = sdCharacter.img_body_reload2;


					gun_offset_x -= 1;
					gun_offset_y += 1;
				}
				else
				{
					if ( this.pain_anim <= 0 )
					image = sdCharacter.img_body_armed;

					if ( this.gun_slot === 0 )
					{
						if ( this.fire_anim > 2.5 )
						{
							image = sdCharacter.img_body_melee2;
							gun_offset_x += 1;
						}
						else
						if ( this.fire_anim > 0 )
						{
							image = sdCharacter.img_body_melee1;
							gun_offset_x += 3;
						}
					}
					else
					{
						if ( this.fire_anim > 2.5 )
						{
							image = sdCharacter.img_body_fire2;
							gun_offset_x -= 3;
						}
						else
						if ( this.fire_anim > 0 )
						{
							image = sdCharacter.img_body_fire1;
							gun_offset_x -= 2;
						}
					}
				}
			}

			if ( image === sdCharacter.img_body_hurt )
			{
				gun_offset_x = -1;
				gun_offset_y = 2;
			}

			let an = Math.atan2( 
					( this.y - this.look_y ) , 
					( ( this.x - this.look_x ) * this._side - 3 * Math.abs( this.y - this.look_y ) ) ) - Math.PI;


			ctx.translate( - 2, 5 );
			ctx.rotate( an );
			ctx.translate( 2,  - 5 );
			
			ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );

			//ctx.filter = 'none';
			ctx.sd_filter = null;
			
			if ( this.flying )
			{
				ctx.drawImageFilterCache( sdCharacter.img_jetpack, - 16, - 16, 32,32 );
			}

			if ( this._inventory[ this.gun_slot ] )
			{
				ctx.translate( 5 + gun_offset_x, -2 + gun_offset_y );

				ctx.rotate( -an );
				ctx.rotate( -this.tilt / 100 * this._side );

				ctx.rotate( ( -this._an ) * this._side + Math.PI / 2 );
				/*
				ctx.rotate( Math.atan2( 
					( this.y - this.look_y ) , 
					( ( this.x - this.look_x ) * this._side ) ) - Math.PI );*/
		
				this._inventory[ this.gun_slot ].Draw( ctx, true );
			}
		}
		
		//ctx.filter = 'none';
		ctx.sd_filter = null;
	}
	MeasureMatterCost()
	{
		return 200; // Hack
	}
	Say( t, to_self=true, force_client_side=false )
	{
		let params = { 
			x:this.x, 
			y:this.y - 36, 
			type:sdEffect.TYPE_CHAT, 
			attachment:this, 
			attachment_x: 0,
			attachment_y: -36,
			text:t,
			voice:this._voice 
		};

		if ( sdWorld.is_server )
		{
			if ( sdWorld.time > this._say_allowed_in )
			{
				this._say_allowed_in = sdWorld.time + t.length * 50;
				
				if ( to_self )
				{
					if ( this._socket )
					{
						params.attachment = [ params.attachment.GetClass(), params.attachment._net_id ];
						//this._socket.emit( 'EFF', params );
						this._socket.sd_events.push( [ 'EFF', params ] );
					}
				}
				else
				sdWorld.SendEffect( params );
			}
		}
		else
		{
			if ( force_client_side )
			{
				let ef = new sdEffect( params );
				sdEntity.entities.push( ef );
			}
		}
	}
}
//sdCharacter.init_class();

	
export default sdCharacter;
	