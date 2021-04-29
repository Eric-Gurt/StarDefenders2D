
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
import sdCube from './sdCube.js';
import sdCom from './sdCom.js';
import sdHover from './sdHover.js';
import sdDoor from './sdDoor.js';
import sdBG from './sdBG.js';
import sdBarrel from './sdBarrel.js';
import sdBomb from './sdBomb.js';
import sdTurret from './sdTurret.js';
import sdArea from './sdArea.js';
import sdMatterContainer from './sdMatterContainer.js';


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
		
		sdCharacter.img_helmets = [
			null,
			sdWorld.CreateImageFromFile( 'helmet_star_defender' ), // EG
			sdWorld.CreateImageFromFile( 'helmet_falkok' ), // EG
			sdWorld.CreateImageFromFile( 'helmet_eyes' ), // EG
			sdWorld.CreateImageFromFile( 'helmet_dino' ), // EG
			sdWorld.CreateImageFromFile( 'helmet_v' ), // EG
			sdWorld.CreateImageFromFile( 'helmet_open' ), // EG
			sdWorld.CreateImageFromFile( 'helmet_cs' ), // idea by butorinoks77, rework by Eric Gurt
			sdWorld.CreateImageFromFile( 'helmet_grub' ), // idea by butorinoks77, rework by Eric Gurt
			sdWorld.CreateImageFromFile( 'helmet_crow' ), // by butorinoks77
			sdWorld.CreateImageFromFile( 'helmet_scope' ), // by butorinoks77
			sdWorld.CreateImageFromFile( 'helmet_crusader' ), // by xXRedXAssassinXx
			sdWorld.CreateImageFromFile( 'helmet_phfalkok' ), // by Booraz149
			sdWorld.CreateImageFromFile( 'helmet_aero' ), // // original by LordBored, remake by LazyRain
			sdWorld.CreateImageFromFile( 'helmet_scout' ) // by Ghost581, original name was "Observer"
		];
		
		// x y rotation, for images below
		sdCharacter.head_pos = {
			img_body_idle: [ 14, 11, 0 ],
			img_body_armed: [ 14, 11, 0 ],
			img_body_fire1: [ 13, 11, 0 ],
			img_body_fire2: [ 13, 11, 0 ],
			img_body_melee1: [ 16, 12, 0 ],
			img_body_melee2: [ 15, 11, 0 ],
			img_body_reload1: [ 16, 13, 22 ], // 45
			img_body_reload2: [ 15, 12, 0 ],
			img_body_hurt: [ 12, 11, -15 ],
			
			// death
			img_death1: [ 10, 13, -90 ],
			img_death2: [ 9, 18, -90 ],
			img_death3: [ 6, 28, -90 ],
			img_death4: [ 6, 29, -90 ]
		};
		
		sdCharacter.ghost_breath_delay = 10 * 30;
		
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
		//sdCharacter.img_death4_visor_tint = sdWorld.CreateImageFromFile( 'death4_visor_tint' );
		
		sdCharacter.img_jetpack = sdWorld.CreateImageFromFile( 'jetpack' );
		
		sdCharacter.air_max = 30 * 30; // 30 sec
		
		sdCharacter.bullet_y_spawn_offset = -2; // Not only used for sword attacks
		
		sdCharacter.last_build_deny_reason = null;
		
		sdCharacter.disowned_body_ttl = 30 * 60 * 1; // 1 min
	
		sdCharacter.starter_matter = 50;
		sdCharacter.matter_required_to_destroy_command_center = 300; // Will be used to measure command centres' self-destruct if no characters with enough matter will showup near them
		
		sdCharacter.characters = []; // Used for AI counting
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	GetBleedEffect()
	{
		if ( this._voice.variant === 'whisperf' )
		return sdEffect.TYPE_BLOOD_GREEN;
		
		if ( this._voice.variant === 'klatt3' )
		return sdEffect.TYPE_WALL_HIT;
	
		return sdEffect.TYPE_BLOOD;
	}
	GetBleedEffectFilter()
	{
		if ( this._voice.variant === 'whisperf' )
		return 'hue-rotate(73deg)';
	
		return '';
	}
	
	DrawHelmet( ctx, frame )
	{
		ctx.save();
		
		var x, y, an;
		
		x = sdCharacter.head_pos[ frame ][ 0 ] - 16;
		y = sdCharacter.head_pos[ frame ][ 1 ] - 16;
		an = sdCharacter.head_pos[ frame ][ 2 ];

		ctx.translate( x, y );
		ctx.rotate( an / 180 * Math.PI );

		ctx.drawImageFilterCache( sdCharacter.img_helmets[ this.helmet ], - 16, - 16, 32,32 );
		
		ctx.restore();
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
		
			this._force_add_sx += sx;
			this._force_add_sy += sy;
		}
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_voice' ) return true;
		//if ( prop === '_ai' ) return true; Bad idea, object pointers here
		if ( prop === '_upgrade_counters' ) return true;
		
		return false;
	}
	IsTargetable() // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( !sdArea.CheckPointDamageAllowed( this.x, this.y ) )
		return false;
	
		return ( this.driver_of === null );
	}
	get _old_score() // Obsolete now
	{
		debugger;
		return 0;
	}
	set _old_score( v ) // Obsolete now
	{
		debugger;
	}
	constructor( params )
	{
		super( params );
		
		this._socket = null; // undefined causes troubles
		
		this.lag = false;
		
		this._god = false;
		
		this.helmet = 1;
		
		this._in_water = false;
		
		this.driver_of = null;
		this._potential_vehicle = null; // Points at vehicle which player recently did hit
		
		this._listeners = {
			DAMAGE: []
		};
		
		this._ai = null; // Object, won't be saved to snapshot
		this._ai_enabled = false;
		this._ai_gun_slot = 0; // When AI spawns with a weapon, this variable needs to be defined to the same slot as the spawned gun so AI can use it
		this._ai_level = 0; // Self explanatory
		this._ai_team = 0; // AI "Teammates" do not damage each other
		
		this.title = 'Random Hero #' + this._net_id;
		this._my_hash = undefined; // Will be used to let players repsawn within same entity if it exists on map
		//this._old_score = 0; // This value is only read/written to when player disconnects and reconnects
		this._score = 0; // Only place where score will be kept from now
		
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

		//this.anim_death = 0;
		this._anim_walk = 0;
		this.fire_anim = 0;
		this.reload_anim = 0;
		this.pain_anim = 0;
		this.death_anim = 0;

		this.act_x = 0;
		this.act_y = 0;
		//this.act_fire = 0;

		this.look_x = 0;
		this.look_y = 0;
		this._an = 0;
		
		this.tilt = 0; // X button
		this.tilt_speed = 0;
		
		this._crouch_intens = 0;
		
		this._ignored_guns = [];
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
		this._matter_regeneration = 0; // Through upgrade
		this._recoil_mult = 1; // Through upgrade
		this._air_upgrade = 1; // Underwater breath capacity upgrade
		this.build_tool_level = 0; // Used for some unlockable upgrades in build tool
		this._jetpack_fuel_multiplier = 1; // Fuel cost reduction upgrade

		this._acquired_bt_mech = false; // Has the character picked up build tool upgrade that the flying mech drops?

		this.flying = false; // Jetpack flying
		this._last_act_y = this.act_y; // For mid-air jump jetpack activation
		
		this.ghosting = false;
		this._ghost_breath = 0; // Time until next breath as ghost
		this._last_e_state = 0; // For E key taps to activate ghosting
		
		this._upgrade_counters = {}; // key = upgrade
		
		this._regen_timeout = 0;
		
		this._key_states = new sdKeyStates();
		this._q_held = false;
		
		this.air = sdCharacter.air_max;
		
		this._build_params = null; // What player is about to build
		
		//this.hue = ~~( Math.random() * 360 );
		//this.saturation = ~~( 50 + Math.random() * 200 );
		
		//this.filter = params.filter || '';
		this.sd_filter = params.sd_filter || null; // Custom per-pixel filter
		
		this._sd_filter_old = null;
		this._sd_filter_darkened = null;
		
		this._voice = {
			wordgap: 0,
			pitch: 50,
			speed: 175,
			variant: 'klatt'
		};
		this._speak_id = -1; // last voice message
		this._say_allowed_in = 0;
		
		//this.team_id = 0; // 0 is FFA team
	
		this.matter = sdCharacter.starter_matter;
		this.matter_max = sdCharacter.starter_matter;
		
		this.stim_ef = 0; // Stimpack effect
		
		this._matter_old = this.matter;
		
		this._last_damage_upg_complain = 0;
		
		this._recoil = 0;
		
		sdCharacter.characters.push( this );
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return this._key_states.GetKey('KeyX') ? [ 'sdCharacter', 'sdBullet' ] : [ 'sdBullet' ];
	}
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( this.driver_of )
		if ( !this.driver_of.IsVisible( observer_character ) )
		return false;
		
		if ( !observer_character || !observer_character.is( sdCharacter ) )
		if ( !sdArea.CheckPointDamageAllowed( this.x, this.y ) )
		return false;
		
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
	
	AIWarnTeammates()
	{
		if ( !sdWorld.is_server )
		return;

		let teammates = sdWorld.GetAnythingNear( this.x, this.y, 200, null, [ 'sdCharacter' ] );
		for ( let i = 0; i < teammates.length; i++ )
		{
		if ( teammates[ i ].GetClass() === 'sdCharacter' && teammates[ i ]._ai && teammates[ i ].hea > 0 )
		teammates[ i ].AIProtectTeammate( this._ai.target ); // teammates[ i]._ai.target = this._ai_target; didn't work
		//teammates[ i ]._ai.target = this._ai_target;
		}
	
	}
	
	AIProtectTeammate ( target )
	{
	this._ai.target = target;
	}
	
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
	get hitbox_x1() { return this.death_anim < 10 ? -5 : -5; } // 7
	get hitbox_x2() { return this.death_anim < 10 ? 5 : 5; }
	get hitbox_y1() { return this.death_anim < 10 ? -12 : 12; }
	get hitbox_y2() { return this.death_anim < 10 ? ( ( 16 - this._crouch_intens * 6 ) * ( 0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7 ) ) : 16; }

//0.3 + Math.abs( Math.cos( this.tilt / 100 ) ) * 0.7

	get hard_collision() // For world geometry where players can walk
	{ return ( this.death_anim < 20 && !this.driver_of ); }
	
	GetVoicePitch()
	{
		let v = this._voice.pitch / 50;
		
		if ( v >= 1 )
		return ( v + 1 * 3 ) / 4;
	
		
		return ( v + 1 * 6 ) / 7;
	}
	Impact( vel ) // fall damage basically
	{
		//if ( vel > 7 )
		if ( vel > 6.5 ) // For new mass-based model
		{
			//this.Damage( ( vel - 4 ) * 15 );
			this.Damage( ( vel - 3 ) * 17 );
		}
	}
	Damage( dmg, initiator=null, headshot=false )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator === this )
		initiator = null;
	
		for ( var i = 0; i < this._listeners.DAMAGE.length; i++ )
		this._listeners.DAMAGE[ i ]( this, dmg, initiator );
			
		let was_alive = ( this.hea > 0 );
	
		if ( dmg > 0 )
		{
			if ( was_alive )
			{
				if ( this._ai )
				{
					if ( initiator )
					{
						if ( !initiator._ai || ( initiator._ai && initiator._ai_team !== this._ai_team ) ) //Math.random() < ( 0.333 - Math.min( 0.33, ( 0.09 * this._ai_level ) ) ) ) // 3 times less friendly fire for Falkoks, also reduced by their AI level
						{
							this._ai.target = initiator;
							if ( Math.random() < 0.3 ) // 30% chance
							this.AIWarnTeammates();
						}
						else
						if ( initiator._ai_team === this._ai_team && Math.random() < ( 0.333 - Math.min( 0.33, ( 0.09 * this._ai_level ) ) ) ) // 3 times less friendly fire for Falkoks, also reduced by their AI level
						this._ai.target = initiator;

					}
				}
				else
				{
					if ( sdWorld.server_config.onDamage )
					sdWorld.server_config.onDamage( this, initiator, dmg, headshot );
				
					//if ( initiator )
					//if ( initiator.is( sdCharacter ) )
					//if ( initiator._socket )
					//{
						//if ( sdWorld.server_config.onDamage )
						//sdWorld.server_config.onDamage( this, initiator, dmg, headshot );
						/*
						if ( sdWorld.time >= this._non_innocent_until ) // Check if victim is innocent
						initiator._non_innocent_until = sdWorld.time + 1000 * 30;
						*/
					//}
				}
			}

			this.hea -= dmg;

			if ( this.hea <= 0 && was_alive )
			{
				if ( this._voice.variant === 'klatt3' )
				{
					this.Say( [ 'Critical damage!', 'Shutting down' ][ ~~( Math.random() * 2 ) ], false, false, true );
				}
				else
				if ( this._voice.variant === 'whisperf' )
				{
					sdSound.PlaySound({ name:'f_death' + ~~(1+Math.random() * 3), x:this.x, y:this.y, volume:0.4 });
				}
				else
				{
					if ( this.hea < -100 )
					sdSound.PlaySound({ name:'sd_death2', x:this.x, y:this.y, volume:1, pitch:this.GetVoicePitch() });
					else
					sdSound.PlaySound({ name:'sd_death', x:this.x, y:this.y, volume:1, pitch:this.GetVoicePitch() });
				}
				
				if ( this.driver_of )
				{
					this.driver_of.ExcludeDriver( this );
				}
			
				this.DropWeapons();
				
				if ( sdWorld.server_config.onKill )
				sdWorld.server_config.onKill( this, initiator );

				if ( initiator )
				if ( initiator.is( sdCharacter ) )
				if ( initiator._socket )
				{
					if ( this._ai_enabled )
					{
						if ( typeof initiator._score !== 'undefined' )
						initiator._score += 2;
					}
					else
					{
						/*
						if ( sdWorld.time < initiator._non_innocent_until ) // Attacker is not innocent
						{
							if ( initiator._socket.ffa_warning === 0 )
							initiator._socket.emit('SERVICE_MESSAGE', 'Your respawn rate was temporarily decreased' );

							initiator._socket.SyncFFAWarning();
							initiator._socket.ffa_warning += 1;
							initiator._socket.respawn_block_until = sdWorld.time + initiator._socket.ffa_warning * 5000;
						}*/
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
						if ( this._voice.variant === 'klatt3' )
						{
							this.Say( [ 'Ouch!', 'Aaa!', 'Uh!' ][ ~~( Math.random() * 3 ) ], false, false );
						}
						else
						if ( this._voice.variant === 'whisperf' )
						sdSound.PlaySound({ name:'f_pain' + ~~(2+Math.random() * 3), x:this.x, y:this.y, volume:( ( dmg > 1 )? 1 : 0.5 ) * 0.4 }); // less volume for bleeding
						else
						sdSound.PlaySound({ name:'sd_hurt' + ~~(1+Math.random() * 2), x:this.x, y:this.y, pitch:this.GetVoicePitch(), volume:( dmg > 1 )? 1 : 0.5 }); // less volume for bleeding
					
						this.pain_anim = 10;
					}
				}
			}
			
			
			if ( this.hea < -200 )
			{
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
					if ( this._ai_enabled )
					{
					}
					else
					{
						let share = Math.min( Math.max( 0, initiator._score ), 10 );
						initiator._score -= share;
						this._score += share;

						if ( this._non_innocent_until < sdWorld.time ) // Healed player is innocent
						initiator._socket.ffa_warning = Math.max( initiator._socket.ffa_warning - 1, 0 );
					}
				}
			}
			
			this._dying = false;
			
			if ( this.hea > this.hmax )
			this.hea = this.hmax;
		}
	}
	
	get mass() { return 80; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		this.ApplyServerSidePositionAndVelocity( false, x / this.mass, y / this.mass );
		
		/*this.sx += x * 0.1;
		this.sy += y * 0.1;
		this.ApplyServerSidePositionAndVelocity( false, x * 0.1, y * 0.1 );*/
	}
	
	UseServerCollisions()
	{
		if ( sdWorld.is_server )
		return true;
	
		if ( sdWorld.my_entity === this && this.AllowClientSideState() )
		return true;
		
		return false;
	}
	
	AILogic( GSPEED ) // aithink
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( typeof this._ai.next_action === 'undefined' )
		this._ai.next_action = 30;
	
		if ( typeof this._ai.direction === 'undefined' )
		this._ai.direction = ( Math.random() < 0.5 ) ? 1 : -1;
	
		if ( ( this._ai.direction > 0 && this.x > sdWorld.world_bounds.x2 - 32 ) || ( this._ai.direction > 0 && this.x < sdWorld.world_bounds.x1 + 32 ) )
		{
			this.remove();
			return;
		}
	
		this._ai.next_action -= GSPEED;
		
		if ( this._ai.next_action <= 0 )
		{
			this._ai.next_action = 5 + Math.random() * 10;
			
			this.gun_slot = this._ai_gun_slot;
			
			let closest = null;
			let closest_di = Infinity;
			//let closest_di_real = Infinity;
			
			// Occasionally change direction?
			if ( Math.random() < 0.001 )
			this._ai.direction = ( Math.random() < 0.5 ) ? 1 : -1;
			
			
			if ( this._ai.target )
			{
				if ( ( this._ai.target.hea || this._ai.target._hea || 0 ) > 0 && this._ai.target.IsVisible( this ) && sdWorld.Dist2D( this.x, this.y, this._ai.target.x, this._ai.target.y ) < 800 )
				{
					closest = this._ai.target;
				}
				else
				this._ai.target = null;
			}
			
			if ( !closest )
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				var ent = sdWorld.sockets[ i ].character;
					
				if ( ent )
				if ( ent.hea > 0 )
				if ( !ent._is_being_removed )
				{
					let di = sdWorld.Dist2D( this.x, this.y, ent.x, ent.y );
					//let di_real = di;

					if ( di < 400 )
					//if ( !sdCube.IsTargetFriendly( ent ) )
					if ( ent.IsVisible( this ) )
					if ( sdWorld.CheckLineOfSight( this.x, this.y, ent.x, ent.y, this, sdCom.com_visibility_ignored_classes, null ) )
					{
						if ( di < closest_di )
						{
							closest_di = di;
							//closest_di_real = di_real;
							closest = ent;
						}
					}
				}
			}
				
			this._key_states.SetKey( 'KeyA', 0 );
			this._key_states.SetKey( 'KeyD', 0 );
			this._key_states.SetKey( 'KeyW', 0 );
			this._key_states.SetKey( 'KeyS', 0 );
			
			this._key_states.SetKey( 'Mouse1', 0 );
			
			if ( closest )
			{
				if ( !this._ai.target )
				{
					sdSound.PlaySound({ name:'f_welcome1', x:this.x, y:this.y, volume:0.4 });
				}
				
				this._ai.target = closest;
				this._ai.target_local_y = closest.hitbox_y1 + ( closest.hitbox_y2 - closest.hitbox_y1 ) * Math.random();

				let should_fire = true; // Sometimes prevents friendly fire, not ideal since it updates only when ai performs "next action"
				if ( !sdWorld.CheckLineOfSight( this.x, this.y, closest.x, closest.y, this, null, ['sdCharacter'] ) )
				if ( sdWorld.last_hit_entity && sdWorld.last_hit_entity._ai_team === this._ai_team )
				should_fire = false;

				if ( Math.random() < 0.3 )
				this._key_states.SetKey( 'KeyA', 1 );
				
				if ( Math.random() < 0.3 )
				this._key_states.SetKey( 'KeyD', 1 );
				
				if ( Math.random() < 0.2 || ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30  ) )
				this._key_states.SetKey( 'KeyW', 1 );
				
				if ( Math.random() < 0.4 )
				this._key_states.SetKey( 'KeyS', 1 );
			
				if ( Math.random() < 0.05 && should_fire === true  ) // Shoot the walls occasionally, when target is not in sight but was detected previously
				{
					this._key_states.SetKey( 'Mouse1', 1 );
				}
				else
				if ( Math.random() < 0.25 + Math.min( 0.7, ( 0.25 * this._ai_level ) ) && should_fire === true ) // Shoot on detection, depends on AI level
				{
					if ( sdWorld.CheckLineOfSight( this.x, this.y, closest.x, closest.y, this, sdCom.com_visibility_ignored_classes, null ) )
					this._key_states.SetKey( 'Mouse1', 1 );
				}
			}
			else
			{
				if ( this._ai.direction > 0 )
				this._key_states.SetKey( 'KeyD', ( Math.random() < 0.5 ) ? 1 : 0 );
				else
				this._key_states.SetKey( 'KeyA', ( Math.random() < 0.5 ) ? 1 : 0 );
			
				sdWorld.last_hit_entity = null;
				
				if ( sdWorld.CheckWallExistsBox( this.x + this._ai.direction * 16 - 16, this.y + this.hitbox_y2 - 32 + 1, this.x + this._ai.direction * 16 + 16, this.y + this.hitbox_y2 - 1, this, null, null ) ||  ( this.sy > 4.5 && this._jetpack_allowed && this.matter > 30 )  )
				this._key_states.SetKey( 'KeyW', 1 );
				else
				{
					// Try to go through walls of any kinds
					if ( sdWorld.last_hit_entity )
					//if ( sdWorld.last_hit_entity._natural === false || sdWorld.last_hit_entity.is( sdDoor ) || sdWorld.last_hit_entity.is( sdMatterContainer ) || ( !sdWorld.last_hit_entity.is( sdCharacter ) && Math.random() < 0.01 ) )
					if ( sdWorld.last_hit_entity._natural === false || sdWorld.last_hit_entity.is( sdDoor ) || sdWorld.last_hit_entity.is( sdMatterContainer ) || ( !sdWorld.last_hit_entity.is( sdCharacter ) && Math.random() < ( 0.01 * this._ai_level ) ) )
					{
						closest = sdWorld.last_hit_entity;

						this._ai.target = closest;
						this._ai.target_local_y = closest.hitbox_y1 + ( closest.hitbox_y2 - closest.hitbox_y1 ) * Math.random();
					}
				}
			}
		}
		
		if ( this._ai.target && this._ai.target.IsVisible( this ) )
		{
			this.look_x = sdWorld.MorphWithTimeScale( this.look_x, this._ai.target.x, Math.max( 0.5, ( 0.8 - 0.15 * this._ai_level ) ), GSPEED );
			this.look_y = sdWorld.MorphWithTimeScale( this.look_y, this._ai.target.y + ( this._ai.target_local_y || 0 ), Math.max( 0.5, ( 0.8 - 0.15 * this._ai_level ) ), GSPEED );
		}
		else
		{
			this.look_x = sdWorld.MorphWithTimeScale( this.look_x, this.x + this._ai.direction * 400, 0.9, GSPEED );
			this.look_y = sdWorld.MorphWithTimeScale( this.look_y, this.y + Math.sin( sdWorld.time / 2000 * Math.PI ) * 50, 0.9, GSPEED );
			
			this._key_states.SetKey( 'Mouse1', 0 );
		}
	}
	GetBulletSpawnOffset()
	{
		// Much better for digging down. Also will work with all short-range weapons like defibrillators
		if ( !this._inventory[ this.gun_slot ] || sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_sword || ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].projectile_properties.time_left !== undefined && sdGun.classes[ this._inventory[ this.gun_slot ].class ].projectile_properties.time_left < 5 ) )
		{
			return { x:0, y:sdCharacter.bullet_y_spawn_offset };
		}
		
		/*let xx = 0;
		let yy = 0;
		
		let x_on_x = 1;
		let x_on_y = 0;
		
		let y_on_x = 0;
		let y_on_y = 1;*/
			
		let m1 = [ 1, 0, 0, 1, 0, 0 ];
		
		// Assume these as 0
		let gun_offset_x = 0;
		let gun_offset_y = 0;
		
		function ctx_translate( x, y )
		{
			/*xx += x * x_on_x + y * y_on_x;
			yy += y * y_on_y + x * x_on_y;*/
			
			m1[ 4 ] += m1[ 0 ] * x + m1[ 2 ] * y;
			m1[ 5 ] += m1[ 1 ] * x + m1[ 3 ] * y;
		}
		function ctx_scale( sx, sy )
		{
			/*x_on_x *= x;
			x_on_y *= x;
			
			y_on_x *= y;
			y_on_y *= y;*/
			
			m1[ 0 ] *= sx;
			m1[ 1 ] *= sx;
			m1[ 2 ] *= sy;
			m1[ 3 ] *= sy;
		}
		function ctx_rotate( angle )
		{
			/*var cos = Math.cos( a );
			var sin = Math.sin( a );
			
			var nx = cos * x_on_x - sin * x_on_y;
			x_on_y = sin * x_on_x + cos * x_on_y;
			x_on_x = nx;
			
				nx = cos * y_on_x - sin * y_on_y;
			y_on_y = sin * y_on_x + cos * y_on_y;
			y_on_x = nx;*/
			
			var c = Math.cos( angle );
			var s = Math.sin( angle );
			var m11 = m1[ 0 ] * c + m1[ 2 ] * s;
			var m12 = m1[ 1 ] * c + m1[ 3 ] * s;
			var m21 = m1[ 0 ] * -s + m1[ 2 ] * c;
			var m22 = m1[ 1 ] * -s + m1[ 3 ] * c;
			m1[ 0 ] = m11;
			m1[ 1 ] = m12;
			m1[ 2 ] = m21;
			m1[ 3 ] = m22;
		}
		
		//ctx_translate( this.x, this.y );
		
		
		ctx_rotate( this.tilt / 100 );
		ctx_scale( this._side, 1 );
		
		let an = Math.atan2( 
						( this.y - this.look_y ) , 
						( ( this.x - this.look_x ) * this._side - 3 * Math.abs( this.y - this.look_y ) ) ) - Math.PI;

		if ( this._ledge_holding )
		an = 0;
	
		if ( this.gun_slot === 0 )
		{
		}
		else
		{
			if ( this.fire_anim > 2.5 )
			{
				gun_offset_x -= 3;
			}
			else
			if ( this.fire_anim > 0 )
			{
				gun_offset_x -= 2;
			}
		}

		ctx_translate( - 2, 5 );
		ctx_rotate( an );
		ctx_translate( 2,  - 5 );

		ctx_translate( 5 + gun_offset_x, -2 + gun_offset_y );
		
		//return { x:xx, y:yy };
		return { x: m1[ 4 ], y: m1[ 5 ] };
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._god )
		if ( this._socket )
		{
			this.matter_max = 10000; // Hack
			this.matter = this.matter_max; // Hack
			this.hea = this.hmax; // Hack
			this._dying = false; // Hack
			this.air = sdCharacter.air_max; // Hack
			this._nature_damage = 0; // Hack
			this._player_damage = 0; // Hack
		}
		
		this._nature_damage = sdWorld.MorphWithTimeScale( this._nature_damage, 0, 0.9983, GSPEED );
		this._player_damage = sdWorld.MorphWithTimeScale( this._player_damage, 0, 0.9983, GSPEED );
		
		if ( this.hea <= 0 )
		{
			this.MatterGlow( 0.01, 30, GSPEED );
				
			if ( this.death_anim < 90 )
			this.death_anim += GSPEED;
			else
			{
				/*for ( var xx = -1; xx <= 1; xx++ )
				for ( var yy = -1; yy <= 1; yy++ )
				{
					var x = this.x;
					var y = this.y;
					
					var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
					for ( var i = 0; i < arr.length; i++ )
					if ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' )
					if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 30 ) >= 0 )
					if ( arr[ i ] !== this )
					{
						this.TransferMatter( arr[ i ], 0.01, GSPEED );
					}
				}*/
				
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
			if ( this._ai_enabled )
			{
				if ( !this._ai )
				this._ai = {};

				this.AILogic( GSPEED );
			}
			
			if ( this._recoil > 0 )
			this._recoil = Math.max( 0, sdWorld.MorphWithTimeScale( this._recoil , -0.01, 0.9 * this._recoil_mult , GSPEED ) );

			if ( this._dying )
			{
				this.Damage( GSPEED * 0.1 );
				
				if ( this._dying_bleed_tim <= 0 )
				{
					this._dying_bleed_tim = 15;
					sdWorld.SendEffect({ x:this.x, y:this.y, type:this.GetBleedEffect(), filter:this.GetBleedEffectFilter() });
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
							this.matter -= GSPEED * 0.15; // 0.3
							this.Damage( -GSPEED );
						}
					}
				}
			}
			
			if ( this.fire_anim > 0 )
			this.fire_anim = Math.max( 0, this.fire_anim - GSPEED );

			if ( this.pain_anim > 0 )
			this.pain_anim -= GSPEED;
		
			let offset = this.GetBulletSpawnOffset();

			this._an = -Math.PI / 2 - Math.atan2( this.y + offset.y - this.look_y, this.x + offset.x - this.look_x );
			//this._an = -Math.PI / 2 - Math.atan2( this.y + sdCharacter.bullet_y_spawn_offset - this.look_y, this.x - this.look_x );

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
				if ( !this.driver_of )
				{
					let will_fire = this._key_states.GetKey( 'Mouse1' );
					
					if ( will_fire )
					{
						if ( !this._inventory[ this.gun_slot ] || !sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_build_gun )
						if ( !sdArea.CheckPointDamageAllowed( this.x, this.y ) )
						{
							will_fire = false;
							
							switch ( ~~( Math.random() * 5 ) )
							{
								case 0: this.Say( 'This is a no-combat zone' ); break;
								case 1: this.Say( 'Combat is not allowed here' ); break;
								case 2: this.Say( 'This place is meant to be peaceful' ); break;
								case 3: this.Say( 'Combat is restricted in this area' ); break;
								case 4: this.Say( 'Admins have restricted combat in this area' ); break;
							}
						}
					}
					
					if ( this._inventory[ this.gun_slot ] )
					{
						if ( this._key_states.GetKey( 'KeyR' ) &&
							 this._inventory[ this.gun_slot ].ammo_left >= 0 && 
							 this._inventory[ this.gun_slot ].ammo_left < sdGun.classes[ this._inventory[ this.gun_slot ].class ].ammo_capacity )
						{
							this._inventory[ this.gun_slot ].ReloadStart();
						}
						else
						{

							if ( will_fire )
							{
								if ( this._inventory[ this.gun_slot ].Shoot( this._key_states.GetKey( 'ShiftLeft' ), offset ) )
								{
									this.fire_anim = 5;
								}
							}
						}
					}
					else
					{
						if ( will_fire )
						{
							if ( this.fire_anim <= 0 )
							{
								this.fire_anim = 7.5;
								
								if ( sdWorld.is_server )
								{
									let _class = sdGun.CLASS_FISTS;
									
									//let offset = this._held_by.GetBulletSpawnOffset();

									let bullet_obj = new sdBullet({ x: this.x + offset.x, y: this.y + offset.y });
									bullet_obj._owner = this;

									let an = bullet_obj._owner._an;// + ( Math.random() * 2 - 1 ) * spread;

									let vel = 16;

									if ( sdGun.classes[ _class ].projectile_velocity )
									vel = sdGun.classes[ _class ].projectile_velocity;

									/*if ( spread > 0 && count > 0 )
									{
										vel *= ( 1 - Math.random() * 0.15 );
									}*/

									bullet_obj.sx = Math.sin( an ) * vel;
									bullet_obj.sy = Math.cos( an ) * vel;

									for ( var p in sdGun.classes[ _class ].projectile_properties )
									bullet_obj[ p ] = sdGun.classes[ _class ].projectile_properties[ p ];

									//if ( bullet_obj.color !== 'transparent' )
									//debugger;

									//if ( bullet_obj.is_grenade )
									/*if ( !bullet_obj._rail )
									{
										bullet_obj.sx += bullet_obj._owner.sx;
										bullet_obj.sy += bullet_obj._owner.sy;
									}

									if ( bullet_obj.ac > 0 )
									{
										bullet_obj.acx = Math.sin( an );
										bullet_obj.acy = Math.cos( an );
									}*/

									//bullet_obj._damage *= bullet_obj._owner._damage_mult;

									//if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
									//bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
									//else
									bullet_obj._armor_penetration_level = 0;

									//bullet_obj._owner.Impulse( -bullet_obj.sx * 0.3 * bullet_obj._knock_scale, -bullet_obj.sy * 0.3 * bullet_obj._knock_scale );

									//bullet_obj._bg_shooter = background_shoot ? true : false;

									sdEntity.entities.push( bullet_obj );
								}
							}
						}
					}
				}
			}

			
			if ( this.matter < this._matter_regeneration * 20 )
			{
				if ( sdWorld.is_server )
				if ( this.matter < this.matter_max ) // Character cannot store or regenerate more matter than what it can contain
				{
					//this.matter += 1 / 30 * GSPEED;
					this.matter = Math.min( this.matter_max, this._matter_regeneration * 20, this.matter + 1 / 30 * GSPEED );
				}
			}			

			if ( this._key_states.GetKey( 'KeyV' ) )
			{
				this._key_states.SetKey( 'KeyV', 0 ); // So sword is not dropped all the time
				
				if ( this._inventory[ this.gun_slot ] )
				{
					//if ( this.gun_slot === 0 )
					if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].is_sword )
					{
						this._inventory[ this.gun_slot ].dangerous = true;
						this._inventory[ this.gun_slot ]._dangerous_from = this;
						
						if ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound )
						sdSound.PlaySound({ name:sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound, x:this.x, y:this.y, volume: 0.5 * ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound_volume || 1 ), pitch: 0.8 * ( sdGun.classes[ this._inventory[ this.gun_slot ].class ].sound_pitch || 1 ) });
					}
					
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
	
		let last_ledge_holding = this._ledge_holding;
	 
		let ledge_holding = false;
		this._ledge_holding = false;
	
		//if ( sdWorld.is_server )
		{
			if ( sdWorld.is_server || sdWorld.my_entity === this )
			{
				if ( this.hea > 0 )
				{
					this.act_x = this._key_states.GetKey( 'KeyD' ) - this._key_states.GetKey( 'KeyA' );
					this.act_y = this._key_states.GetKey( 'KeyS' ) - ( ( this._key_states.GetKey( 'KeyW' ) || this._key_states.GetKey( 'Space' ) ) ? 1 : 0 );
					
					if ( this.act_x !== 0 || this.act_y !== 0 )
					this.PhysWakeUp();
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
							
							bullet_obj.color = '#333333';

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
					/*let my_ent = this;
					
					if ( this.driver_of )
					my_ent = this.driver_of;*/
					
					if ( this._hook_relative_to )
					{
						this.hook_x = this._hook_relative_to.x + this._hook_relative_x;
						this.hook_y = this._hook_relative_to.y + this._hook_relative_y;
					}
					
					let from_y = this.y + ( this.hitbox_y1 + this.hitbox_y2 ) / 2;
					
					let cur_di = sdWorld.Dist2D( this.x, from_y, this.hook_x, this.hook_y );

					if ( this._hook_len === -1 )
					this._hook_len = cur_di;
					/*else
					{
						this._hook_len = sdWorld.MorphWithTimeScale( this._hook_len, cur_di - GSPEED * 10, 0.9, GSPEED );
					}*/

					let pull_force = -( this._hook_len - cur_di ) / 15;
					let vx = ( this.hook_x - this.x ) / cur_di;
					let vy = ( this.hook_y - from_y ) / cur_di;
					
					let self_effect_scale = 1;
					
					if ( this._hook_relative_to )
					{
						if ( typeof this._hook_relative_to.sx !== 'undefined' )
						{
							let lx = this._hook_relative_to.sx;
							let ly = this._hook_relative_to.sy;
							
							self_effect_scale = this._hook_relative_to.mass / ( this._hook_relative_to.mass + this.mass );
					
							this._hook_relative_to.sx -= vx * pull_force * GSPEED * ( 1 - self_effect_scale );
							this._hook_relative_to.sy -= vy * pull_force * GSPEED * ( 1 - self_effect_scale );
							
                            this._hook_relative_to.sx = sdWorld.MorphWithTimeScale( this._hook_relative_to.sx, this.sx, 0.8, GSPEED * ( 1 - self_effect_scale ) );
                            this._hook_relative_to.sy = sdWorld.MorphWithTimeScale( this._hook_relative_to.sy, this.sy, 0.8, GSPEED * ( 1 - self_effect_scale ) );
							
							if ( this._hook_relative_to.is( sdCharacter ) )
							this._hook_relative_to.ApplyServerSidePositionAndVelocity( true, this._hook_relative_to.sx - lx, this._hook_relative_to.sy - ly );

							pull_force /= 2;
						}


						if ( this._hook_relative_to._is_being_removed || this._hook_relative_to === this.driver_of )
						{
							this.hook_x = 0;
							this.hook_y = 0;
						}
					}

					this.sx += vx * pull_force * GSPEED * self_effect_scale;
					this.sy += vy * pull_force * GSPEED * self_effect_scale;
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
			
			if ( this.hea > 0 ) // Disable extra logic for stuck cases, standing and ledge holding if dead
			{
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
				else
				{
					if ( this.hea > 0 )
					if ( this.act_x !== 0 )
					if ( sdWorld.CheckWallExistsBox( this.x + this.act_x * 7, this.y, this.x + this.act_x * 7, this.y + 10, null, null, [ 'sdBlock' ] ) )
					if ( !sdWorld.CheckWallExists( this.x + this.act_x * 7, this.y + this.hitbox_y1, null, null, [ 'sdBlock' ] ) )
					{
						ledge_holding = true;
					}
				}
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
			//this.tilt_speed += this.act_x * 1 * GSPEED;
			
			this.tilt_speed = sdWorld.MorphWithTimeScale( this.tilt_speed, this.act_x * 30, 0.9, GSPEED );
			
			speed_scale = 0.1;
		}
	
		this.tilt += this.tilt_speed * GSPEED;
		
		let e_state = this._key_states.GetKey( 'KeyE' );
		
		if ( this.hea > 0 )
		if ( e_state )
		if ( e_state !== this._last_e_state )
		{
			if ( this.driver_of )
			{
				this.driver_of.ExcludeDriver( this );
				//this.driver_of = null;
			}
			else
			{
				if ( this._potential_vehicle && this._potential_vehicle.hea > 0 && !this._potential_vehicle._is_being_removed && sdWorld.inDist2D_Boolean( this.x, this.y, this._potential_vehicle.x, this._potential_vehicle.y, sdCom.vehicle_entrance_radius ) )
				{
					this._potential_vehicle.AddDriver( this );
				}
				else
				if ( this._ghost_allowed )
				{
					this.ghosting = !this.ghosting;
					this._ghost_breath = sdCharacter.ghost_breath_delay;
					
					if ( this.ghosting )
					sdSound.PlaySound({ name:'ghost_start', x:this.x, y:this.y, volume:1 });
					else
					sdSound.PlaySound({ name:'ghost_stop', x:this.x, y:this.y, volume:1 });
				}
			}
		}
	
		this._last_e_state = e_state;
		
		//let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		let local_arr = sdWorld.RequireHashPosition( this.x, this.y );
		let in_water = false;
		for ( let i = 0; i < local_arr.length; i++ )
		if ( local_arr[ i ].is( sdWater ) )
		{
			in_water = true;
			
			break;
		}
		
		this._in_water = in_water;
		
		if ( this.ghosting )
		{
			let fuel_cost = 0.4 * GSPEED;
			
			if ( this.matter < fuel_cost || this.hea <= 0 || this.driver_of )
			this.ghosting = false;
			else
			this.matter -= fuel_cost;
		
			this._ghost_breath -= GSPEED;
			if ( this._ghost_breath < 0 )
			{
				this._ghost_breath = sdCharacter.ghost_breath_delay;
				sdSound.PlaySound({ name:'ghost_breath', x:this.x, y:this.y, volume:1 });
			}
		}
		
		if ( this.flying )
		{
			let di = Math.max( 1, sdWorld.Dist2D_Vector( this.act_x, this.act_y ) );
			
			let x_force = this.act_x / di * 0.1;
			let y_force = this.act_y / di * 0.1 - sdWorld.gravity;
			
			let fuel_cost =  GSPEED * sdWorld.Dist2D_Vector( x_force, y_force ) * this._jetpack_fuel_multiplier;

			if ( ( this.stands && this.act_y !== -1 ) || this.driver_of || this._in_water || this.act_y !== -1 || this._key_states.GetKey( 'KeyX' ) || this.matter < fuel_cost || this.hea <= 0 )
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
			if ( !this.driver_of )
			if ( this._jetpack_allowed &&
				 this.act_y === -1 &&
				 this._last_act_y !== -1 &&
				 !last_ledge_holding &&
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
			if ( this.stands && !this.driver_of && ( this._stands_on !== this._hook_relative_to || ( this.hook_x === 0 && this.hook_y === 0 ) ) )
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
					this.tilt -= Math.sin( this.tilt / 100 ) * 4 * GSPEED;
					this.tilt_speed -= Math.sin( this.tilt / 100 ) * 4 * GSPEED;
					this.tilt_speed = sdWorld.MorphWithTimeScale( this.tilt_speed, 0, 0.7, GSPEED );
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
				if ( ledge_holding && !this.flying )
				{
					if ( Math.sign( this.sx ) !== this.act_x )
					this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.65, GSPEED );
				
					//if ( Math.sign( this.sy ) !== this.act_y )
					if ( ( this.sy > 0 ) !== ( this.act_y > 0 ) )
					this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.65, GSPEED );
					
					this.sx += this.act_x * 0.15 * GSPEED;
					this.sy += this.act_y * 0.15 * GSPEED;
					
					this._side = this.act_x;
					//this._ledge_holding = 0;
					//this.look_x = this.x - 100;
					//this.look_y = this.y;
					this._ledge_holding = ledge_holding;
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
		}
		
		
		if ( can_breathe )
		{
			if ( this.air < sdCharacter.air_max )
			this.air = Math.min( sdCharacter.air_max, this.air + GSPEED * 3 );
		}
		else
		{
			if ( this.air > 0 )
			this.air = Math.max( 0, this.air - ( GSPEED / this._air_upgrade ) );
			else
			{
				if ( this.hea > 0 )
				this.Damage( GSPEED );
			}
		}
		
		if ( this.driver_of )
		{
			this.x = this.driver_of.x;
			this.y = this.driver_of.y;
			this.sx = this.driver_of.sx;
			this.sy = this.driver_of.sy;
		}
		else
		this.ApplyVelocityAndCollisions( GSPEED, ( this.hea > 0 ) ? ( this.act_y !== 1 ? 10 : 3 ) : 0 );
		/*
		if ( sdWorld.last_hit_entity )
		{
			if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' )
			if ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP )
			this.Damage( Infinity );
		}*/
	}

	onRemoveAsFakeEntity()
	{
		sdCharacter.characters.splice( sdCharacter.characters.indexOf( this ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		//console.log( this.title + '['+this._net_id+'] is being removed' );
		sdCharacter.characters.splice( sdCharacter.characters.indexOf( this ), 1 );
		
		if ( this.driver_of )
		this.driver_of.ExcludeDriver( this );
		
		this.DropWeapons();
		
		if ( sdWorld.is_server )
		{
			if ( this.death_anim <= sdCharacter.disowned_body_ttl )
			{
				let a,s,x,y,k;

				if ( this.GetBleedEffect() === sdEffect.TYPE_BLOOD || this.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
				sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
				else
				sdSound.PlaySound({ name:'block4', 
					x:this.x, y:this.y, 
					volume: 0.25, 
					pitch: 1 });
			

				for ( let i = 0; i < 6; i++ )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;

					k = Math.random();

					x = this.x + this.hitbox_x1 + Math.random() * ( this.hitbox_x2 - this.hitbox_x1 );
					y = this.y + this.hitbox_y1 + Math.random() * ( this.hitbox_y2 - this.hitbox_y1 );

					//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )

					if ( this.GetBleedEffect() === sdEffect.TYPE_BLOOD )
					{
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD });
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
					}
					else
					if ( this.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
					{
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter() });
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, filter:this.GetBleedEffectFilter(), sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
					}
					else
					{
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s });
					}
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
	DropSpecificWeapon( ent ) // sdGun keepers need this method for case of sdGun removal
	{
		let slot = this._inventory.indexOf( ent );
		if ( slot === -1 )
		{
			//if ( sdWorld.is_server )
			//throw new Error('Should not happen');
			//else
			
			console.warn( 'Should not happen' ); // Rarely happened on server, not sure what caused this. Could be related to floating guns in mid-air, which happened after client self-initated respawn while he already had character in world but snapshots were simply not sent to players due to bug.
			return;
		}
		
	
		this.DropWeapon( slot );
	}
	DropWeapon( i ) // by slot
	{
		if ( this._inventory[ i ] )
		{
			//console.log( this.title + ' drops gun ' + this._inventory[ i ]._net_id );
		
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
			
			this.TriggerMovementInRange();
		}
		//else
		//console.log( this.title + ' is unable to drop drop gun with slot ' + i );
	}

	onMovementInRange( from_entity )
	{
		//console.log( from_entity.GetClass(), from_entity.material, sdBlock.MATERIAL_SHARP, this.hea, sdWorld.is_server );
			
		if ( this.hea > 0 )
		if ( sdWorld.is_server )
		{
			if ( from_entity.is( sdBlock ) )
			{
				if ( from_entity._contains_class === 'sdQuickie' )
				{
					from_entity.Damage( 1 ); // Will break
				}
			}
			else
			if ( from_entity.is( sdGun ) )
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
				{

					if ( this._ignored_guns.indexOf( from_entity ) === -1 )
					//if ( Math.abs( from_entity.x - this.x ) < 8 )
					//if ( Math.abs( from_entity.y - this.y ) < 16 )
					{
						/*if ( from_entity.dangerous )
						{
							this.Damage( 30 );
							from_entity.dangerous = false;
						}*/
										
						//if ( this._inventory[ sdGun.classes[ from_entity.class ].slot ] === null )
						if ( sdGun.classes[ from_entity.class ].ignore_slot || this._inventory[ sdGun.classes[ from_entity.class ].slot ] === null )
						{
							if ( !sdGun.classes[ from_entity.class ].onPickupAttempt || 
								  sdGun.classes[ from_entity.class ].onPickupAttempt( this, from_entity ) )
							{	
								//console.warn( this.title + '['+this._net_id+'] picks up gun ' + from_entity._net_id + ' // this._is_being_removed = ' + this._is_being_removed );

								this._inventory[ sdGun.classes[ from_entity.class ].slot ] = from_entity;
								from_entity._held_by = this;
								from_entity.ttl = -1;

								if ( this._socket )
								sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:1.5 }, [ this._socket ] );
							}
						}
					}
				}
			}
			else
			if ( from_entity.is( sdHover ) )
			{
				this._potential_vehicle = from_entity;
			}
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim < 20 && !this.driver_of )
		{
			let w = 20;
			
			let show_air = false;
			
			if ( sdWorld.my_entity === this )
			if ( this.air < sdCharacter.air_max )
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
				ctx.fillRect( 1 - w / 2, 5 - 20, ( w - 2 ) * Math.max( 0, this.air / sdCharacter.air_max ), 1 );
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
		fake_ent.GetIgnoredEntityClasses = sdEntity.prototype.GetIgnoredEntityClasses; // Discard effect of this method because doors will have problems in else case
		
		if ( fake_ent.GetClass() === 'sdGun' )
		{
			fake_ent.GetIgnoredEntityClasses = ()=>[ 'sdCharacter', 'sdGun' ];
		}
		
		if ( sdWorld.Dist2D( this.x, this.y, this._build_params.x, this._build_params.y ) < 64 || this._god )
		{
			if ( this.stands || this._in_water || this.flying || ( this._hook_relative_to && sdWorld.Dist2D_Vector( this.sx, this.sy ) < 2 ) || this._god )
			{
				if ( fake_ent.CanMoveWithoutOverlap( fake_ent.x, fake_ent.y, 0.00001 ) ) // Very small so entity's velocity can be enough to escape this overlap
				{
					if ( fake_ent.IsEarlyThreat() )
					//if ( fake_ent.is( sdTurret ) || fake_ent.is( sdCom ) || fake_ent.is( sdBarrel ) || fake_ent.is( sdBomb ) || ( fake_ent.is( sdBlock ) && fake_ent.material === sdBlock.MATERIAL_SHARP ) )
					{
						if ( sdWorld.CheckLineOfSight( this.x, this.y, this._build_params.x, this._build_params.y, null, null, sdCom.com_visibility_unignored_classes ) || this._god )
						{
						}
						else
						{
							sdCharacter.last_build_deny_reason = 'Can\'t build this type of entity through wall';
							return false;
						}
					}
					
					if ( !this._god )
					if ( !sdArea.CheckPointDamageAllowed( this._build_params.x, this._build_params.y ) )
					{
						sdCharacter.last_build_deny_reason = 'This area is currently restricted from combat and building';
						return false;
					}
					
					//if ( sdWorld.Dist2D( this.x, this.y, this._build_params.x, this._build_params.y ) < 64 )
					//{
						//if ( this.stands || this._in_water || this.flying || ( this._hook_relative_to && sdWorld.Dist2D_Vector( this.sx, this.sy ) < 2 ) )
						return true;
						//else
						//sdCharacter.last_build_deny_reason = 'I\'d need to stand on something or at least use jetpack';
					//}
					//else
					//sdCharacter.last_build_deny_reason = 'Can\'t build that far';
				}
				else
				{
					if ( sdWorld.is_server )
					{
						if ( sdWorld.last_hit_entity )
						{
							if ( fake_ent.is( sdBG ) && sdWorld.last_hit_entity.is( sdBG ) )
							{
								if ( sdWorld.last_hit_entity.material === sdBG.MATERIAL_GROUND )
								{
									sdCharacter.last_build_deny_reason = null;
									sdWorld.last_hit_entity.remove();
									return false;
								}
								else
								{
									sdCharacter.last_build_deny_reason = 'Holding Left Shift key while shooting could help getting rid of those';
								}
							}
							else
							if ( fake_ent.is( sdArea ) && fake_ent.type === sdArea.TYPE_ERASER_AREA && sdWorld.last_hit_entity.is( sdArea ) )
							{
								sdCharacter.last_build_deny_reason = 'Erasing...';
								sdWorld.last_hit_entity.remove();
								return false;
							}
							else
							{
								//sdCharacter.last_build_deny_reason = 'It overlaps with something';
								sdCharacter.last_build_deny_reason = 'It overlaps with ' + sdWorld.last_hit_entity.GetClass();
							}
						}
					}
					
				}
			}
			else
			sdCharacter.last_build_deny_reason = 'I\'d need to stand on something or at least use jetpack or grappling hook';
		}
		else
		sdCharacter.last_build_deny_reason = 'Can\'t build that far';
		
		return false;
	}
	CreateBuildObject( check_placement_and_range=true, demo_mode=false ) // Can be removed later on and used as fake signle-frame object in general
	{
		if ( this._build_params === null )
		{
			sdCharacter.last_build_deny_reason = 'Nothing selected for build? Does this error even happen?';
			return null;
		}
	
		if ( this._build_params._class === null ) // Upgrades
		{
			//sdCharacter.last_build_deny_reason
			return null;
		}
	
		if ( ( this._build_params._min_build_tool_level || 0 ) > this.build_tool_level )
		{
			sdCharacter.last_build_deny_reason = 'Nice hacks bro';
			return null;
		}
			
		//this._build_params._spawner = this;
		
		
		// Note: X and Y are weird here. This can cause hash array being incorrect - hash update is important to do after entity was placed properly! It can not be done earlier due to entity sizes being unknown too
		let fake_ent = new sdWorld.entity_classes[ this._build_params._class ]( this._build_params );
		
		this._build_params.x = this.look_x;
		this._build_params.y = this.look_y;
		
		fake_ent.x = ( this.look_x - ( fake_ent.hitbox_x2 + fake_ent.hitbox_x1 ) / 2 );
		fake_ent.y = ( this.look_y - ( fake_ent.hitbox_y2 + fake_ent.hitbox_y1 ) / 2 );
		
		if ( !demo_mode )
		{
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

			if ( fake_ent._owner !== undefined )
			fake_ent._owner = this;
	
			if ( fake_ent._armor_protection_level !== undefined )
			if ( this._upgrade_counters[ 'upgrade_build_hp' ] )
			{
				fake_ent._armor_protection_level = this._upgrade_counters[ 'upgrade_build_hp' ]; // Because starts at 1

				if ( fake_ent.is( sdBlock ) )
				if ( fake_ent.material !== sdBlock.MATERIAL_WALL )
				fake_ent._armor_protection_level = 0;
			}
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
	
		if ( this.lag )
		if ( globalThis.enable_debug_info )
		{
			ctx.fillStyle = '#000000';
			ctx.fillText( 'Connection problem', 0, -24.5 - 5, 50 ); 
			ctx.fillStyle = '#ffff00';
			ctx.fillText( 'Connection problem', 0, -25 - 5, 50 );
		}
		
		//ctx.filter = this.filter;
		ctx.sd_filter = this.sd_filter;
		
		if ( !attached )
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
		
		if ( !this.driver_of || attached )
		{
		
			var frame;

			if ( this.death_anim > 0 )
			{
				ctx.scale( this._side, 1 );

				if ( this.death_anim > sdCharacter.disowned_body_ttl - 30 )
				ctx.globalAlpha = 0.5;

				if ( this.death_anim < 10 )
				{
					frame = 'img_death1';
					ctx.drawImageFilterCache( sdCharacter.img_death1, - 16, - 16, 32,32 );
				}
				else
				if ( this.death_anim < 20 )
				{
					frame = 'img_death2';
					ctx.drawImageFilterCache( sdCharacter.img_death2, - 16, - 16, 32,32 );
				}
				else
				if ( this.death_anim < 30 )
				{
					frame = 'img_death3';
					ctx.drawImageFilterCache( sdCharacter.img_death3, - 16, - 16, 32,32 );
				}
				else
				{
					if ( this._speak_id !== -1 )
					{
						meSpeak.stop( this._speak_id );
						this._speak_id = -1;
					}




					if ( this.sd_filter !== this._sd_filter_old )
					{
						this._sd_filter_old = this.sd_filter;

						this._sd_filter_darkened = Object.assign( {}, this.sd_filter );

						this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 0 ] = ~~( this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 0 ] * 0.5 );
						this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 1 ] = ~~( this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 1 ] * 0.5 );
						this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 2 ] = ~~( this._sd_filter_darkened[ 255 ][ 0 ][ 0 ][ 2 ] * 0.5 );
					}

					ctx.sd_filter = this._sd_filter_darkened;


					frame = 'img_death4';
					ctx.drawImageFilterCache( sdCharacter.img_death4, - 16, - 16, 32,32 );
					//ctx.drawImageFilterCache( sdCharacter.img_death4_visor_tint, - 16, - 16, 32,32 );
				}

				this.DrawHelmet( ctx, frame );
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

				if ( !attached ) // Hide legs if in vehicle... Simple solution for now
				ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );

				image = sdCharacter.img_body_idle;
				frame = 'img_body_idle';

				let gun_offset_x = 0;
				let gun_offset_y = 0;

				if ( this.pain_anim > 0 )
				{
					image = sdCharacter.img_body_hurt;
					frame = 'img_body_hurt';
				}

				//if ( this.gun_slot === 0 )
				if ( !this._inventory[ this.gun_slot ] )
				{
					if ( this.fire_anim > 5 || this._ledge_holding )
					{
						image = sdCharacter.img_body_melee2;
						frame = 'img_body_melee2';
						gun_offset_x += 1;
					}
					else
					if ( this.fire_anim > 2.5 )
					{
						image = sdCharacter.img_body_melee1;
						frame = 'img_body_melee1';
						gun_offset_x += 3;
					}
				}
				else
				{
					if ( this.reload_anim > 0 )
					{
						if ( this.reload_anim > 30 / 3 * 2 )
						{
							image = sdCharacter.img_body_reload2;
							frame = 'img_body_reload2';
						}
						else
						if ( this.reload_anim > 30 / 3 * 1 )
						{
							image = sdCharacter.img_body_reload1;
							frame = 'img_body_reload1';
						}
						else
						{
							image = sdCharacter.img_body_reload2;
							frame = 'img_body_reload2';
						}


						gun_offset_x -= 1;
						gun_offset_y += 1;
					}
					else
					{
						if ( this.pain_anim <= 0 )
						{
							image = sdCharacter.img_body_armed;
							frame = 'img_body_armed';
						}

						if ( this.gun_slot === 0 )
						{
							if ( this.fire_anim > 2.5 )
							{
								image = sdCharacter.img_body_melee2;
								frame = 'img_body_melee2';
								gun_offset_x += 1;
							}
							else
							if ( this.fire_anim > 0 )
							{
								image = sdCharacter.img_body_melee1;
								frame = 'img_body_melee1';
								gun_offset_x += 3;
							}
						}
						else
						{
							if ( this.fire_anim > 2.5 )
							{
								image = sdCharacter.img_body_fire2;
								frame = 'img_body_fire2';
								gun_offset_x -= 3;
							}
							else
							if ( this.fire_anim > 0 )
							{
								image = sdCharacter.img_body_fire1;
								frame = 'img_body_fire1';
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

				if ( this._ledge_holding )
				an = 0;

				ctx.translate( - 2, 5 );
				ctx.rotate( an );
				ctx.translate( 2,  - 5 );

				if ( this._inventory[ this.gun_slot ] && !attached ) // Hide guns in vehicle too
				{
					ctx.sd_filter = null;
					ctx.save();
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
					ctx.restore();
					ctx.sd_filter = this.sd_filter;
				}


				ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );

				this.DrawHelmet( ctx, frame );

				//ctx.filter = 'none';
				ctx.sd_filter = null;

				if ( this.flying )
				{
					ctx.drawImageFilterCache( sdCharacter.img_jetpack, - 16, - 16, 32,32 );
				}
			}

		}
		
		//ctx.filter = 'none';
		ctx.sd_filter = null;
	}
	MeasureMatterCost()
	{
		return 200; // Hack
	}
	Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false )
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
			if ( sdWorld.time > this._say_allowed_in || ignore_rate_limit )
			{
				this._say_allowed_in = sdWorld.time + t.length * 50;
				
				if ( to_self )
				{
					if ( this._socket )
					{
						params.attachment = [ params.attachment.GetClass(), params.attachment._net_id ];
						
						params.UC = sdWorld.event_uid_counter++;
						
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
	