/*

	
	"If bases won't be possible to destroy with heavy armory vehicles and nuclear strikes - I'll be sad. 
	It would be cool if some combat tank could be made with the cost of some anti-crystal and long construction process though."
																											- Eric Gurt

	TODO: Green BSU just broke offscreen - conveyors were sending crystals at -5 speed. Could do something with offscreen GSPEED optimizations, maybe it was even "falling"

*/
/* global Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdVirus from './sdVirus.js';
import sdQuickie from './sdQuickie.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';
import sdCamera from './sdCamera.js';
import sdAsteroid from './sdAsteroid.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';
import sdBG from './sdBG.js';
import sdBSUTurret from './sdBSUTurret.js';
import sdMatterAmplifier from './sdMatterAmplifier.js';


import sdRenderer from '../client/sdRenderer.js';

class sdBaseShieldingUnit extends sdEntity
{
	static init_class()
	{
		sdBaseShieldingUnit.enable_nearby_claiming = false; // 
		sdBaseShieldingUnit.longer_time_protected_bsu_priority = 0; // 5 // It is added to 1
		
		sdBaseShieldingUnit.all_shield_units = [];
		
		sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER = 0;
		sdBaseShieldingUnit.TYPE_MATTER = 1;
		sdBaseShieldingUnit.TYPE_SCORE_TIMED = 2; // Similar to crystal consumer but players charge it with score, it expires overtime and can not be attacked. Can't be near red LRTPs though
		sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE = 3; // Only portion of damage can pass through and damage entities
		sdBaseShieldingUnit.TYPE_FACTION_SHIELD = 4;
		
		sdBaseShieldingUnit.damage_reduction_shield_max_level = 50;
		
		sdBaseShieldingUnit.img_unit = sdWorld.CreateImageFromFile( 'shield_unit_sheet' );
		/*
		sdBaseShieldingUnit.img_unit = sdWorld.CreateImageFromFile( 'shield_unit' );
		sdBaseShieldingUnit.img_unit_repair = sdWorld.CreateImageFromFile( 'shield_unit_repair' );
		
		sdBaseShieldingUnit.img_unit2 = sdWorld.CreateImageFromFile( 'shield_unit2' );
		sdBaseShieldingUnit.img_unit2_repair = sdWorld.CreateImageFromFile( 'shield_unit2_repair' );
		*/

		sdBaseShieldingUnit.protect_distance = 275; // Used for breathing when there is no air and if BSU is enabled
		sdBaseShieldingUnit.protect_distance_stretch = sdBaseShieldingUnit.protect_distance + 100; // If BSU moves...
				
		sdBaseShieldingUnit.regen_matter_cost_per_1_hp = 0.001; // Much less than player's automatic regeneration
		sdBaseShieldingUnit.regen_matter_cost_per_1_hp_matter_type = 0.0375; // 0.15 / 1.32 * 0.66; // Was 0.15 but ( / 1.32 * 0.66 ) makes it equal to average matter cost of a weapon. It is slightly less effective for non-sword weapons such as bullets or rails
		
		sdBaseShieldingUnit.score_timed_max_capacity = 1000; // 1000 = 2 days // 3500 = 7 days
		
		// Prevent peopel use score BSUs forever - they are for new players only
		sdBaseShieldingUnit.no_score_bsu_areas = []; // Array of { x, y, allowed_for:BSU, allowed_is_allowed_until:time+1000*60*60, anything_is_disallowed_until:time+60*60*24*4 }
		sdBaseShieldingUnit.no_score_bsu_area_radius = sdBaseShieldingUnit.protect_distance_stretch;
		sdBaseShieldingUnit.no_score_bsu_area_loopie = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -7; }
	get hitbox_y2() { return 8; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }

	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	IsPhysicallyMovable() // By physics (not steering wheels). Incorrect value can crash the game or cause players to stuck in place when trying to push entity
	{
		return !this.enabled;
	}
	
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }

	Impact( vel ) // fall damage basically
	{
		// No impact damage if has driver (because no headshot damage)
		if ( vel > 5 )
		{
			this.DamageWithEffect( ( vel - 3 ) * 25 );
		}
	}
	RequireSpawnAlign() 
	{ return false; }
	
	onFleshifyAttempted( from_entity )
	{
		/*if ( this._flesh_infestation_counter === 0 )
		{
			this._flesh_infestation_allowed_in = sdWorld.time + sdAsteroid.GetProtetedBlockInfestationDelay();
		}
		
		this._flesh_infestation_counter++;*/
		
		//return ( sdWorld.time >= this._flesh_infestation_allowed_in );
		
		let net_id_to_time = this._flesh_infestation_net_id_to_allowed_after;
		
		if ( net_id_to_time[ from_entity._net_id ] === undefined )
		{
			// Remove outdated
			for ( let _net_id in net_id_to_time )
			{
				_net_id = parseInt( _net_id );
				
				let e = sdEntity.entities_by_net_id_cache_map.get( _net_id );
				if ( !e || e._is_being_removed )
				delete net_id_to_time[ _net_id ];
			}
			
			net_id_to_time[ from_entity._net_id ] = sdWorld.time + sdAsteroid.GetProtetedBlockInfestationDelay();
		}
		
		return ( sdWorld.time > net_id_to_time[ from_entity._net_id ] );
	}

	constructor( params )
	{
		super( params );
		
		this.type = params.type || sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER;
		
		this.sx = 0;
		this.sy = 0;
		
		this._time_amplification = 0;
		
		//this._flesh_infestation_counter = 0; // Grows up overtime if something tries to infestate it, resets on re-enabling BSU
		//this._flesh_infestation_allowed_in = 0; // Becomes timestamp once counter becomes 1 or more
		this._flesh_infestation_net_id_to_allowed_after = {};
		
		this._connected_cameras_cache = [];
		this._connected_cameras_cache_last_rethink = 0;
		
		this._revenge_damage_bonus = 0; // Goes up if shield is being repeatedly damaged
		this._revenge_target = null;
		this._revenge_turret = null;
		this._revenge_animation_progress = 0;
		this._revenge_reload = 0;
		this._revenge_turret_parent = null;
		this._revenge_turret_x = 0; // Local coordinates relative to parent
		this._revenge_turret_y = 0;
		
		this.revenge_turrets_enabled = true;
		
		this._dmg_to_report = 0;
		
		this._speed_boost = 1;
		
		this._last_damage = 0; // Sound flood prevention
		
		this.hmax = ( this.type === sdBaseShieldingUnit.TYPE_FACTION_SHIELD ) ? 300 : ( 500 * 4 ); // * 3 when enabled * construction hitpoints upgrades - Just enough so players don't accidentally destroy it when stimpacked and RTP'd
		this.hea = this.hmax;
		//this._hmax_old = this.hmax;
		this.regen_timeout = 0;
		//this._last_sync_matter = 0;
		//this.matter_crystal_max = 2000000;
		this.matter_crystal = 0; // Named differently to prevent matter absorption from entities that emit matter // Also score for score type is stored here
		this._protected_entities = [];
		this._protected_entities_when_disabled = null; // Becomes new Set() of _net_id-s // this._protected_entities are moved there for ~5 minutes so raiders can not claim your whole base...
		this._protected_entities_when_disabled_until = 0;
		this.enabled = false;
		this.attack_other_units = true;
		this._matter_drain = 0;
		
		this.level = 0; // For TYPE_DAMAGE_PERCENTAGE
		this.auto_level_up = true;
		this._level_up_blocked_until = 0;
		
		this.pushable = false; // By thrusters
		
		this.prevent_hostile_shielding = true; // Prevent bases from being "sealed forever", at least at zero range. Disabled globally by sdBaseShieldingUnit.enable_nearby_claiming constant
		
		this.protect_cables = true;
		
		this.matter_max = ( this.type === sdBaseShieldingUnit.TYPE_MATTER ) ? 1000 : 
				( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE ) ? 5120 : 
				0;
		this.matter = 0;
		this.timer_to_expect_matter = 30 * 10; // Goes down when out of matter so big explosions could not destroy BSU if there is more matter
		
		this.charge = 0; // Goes up while shield is activated - makes lose less matter on BSU-BSU attacks (TYPE_MATTER only)
		this.charge_blocked_until = 0; // Set during attacking
		
		this._last_x_for_charge_reset = 0;
		this._last_y_for_charge_reset = 0;

		this._check_blocks = 30; // Temporary, checks for old pre-rework BSU's protected blocks and applies cost for "this._matter_drain" which is now used when BSU attacks BSU. Will be commented out / removed later.
		
		this._enabled_shields_in_network_count = 0; // Used to scale score/time-based shield decrease to scale appropriately
		
		this._last_tick_score = sdWorld.time; // Score BSU-s would not count time spend in an offline server, essentially making them ignore placement limitations if server is idling at least half of the time. This fixes it
		
		//this._age = 0; // Goes up when enabled, goes down when disabled. Time continues to be tracked in private storage as well
		
		//this.filter = params.filter || 'none';

		//this._repair_timer = 0;
		this._attack_timer = 0;
		this.attack_anim = 0; //Animation

		this._target = null;
		
		this._last_shield_sound_played = 0;
		// 1 slot
		
		this._last_value_share = 0;
		
		this._last_out_of_bounds_check = 30 * 30; // Timer for checking if BSU is out of playable area
		
		sdBaseShieldingUnit.all_shield_units.push( this );
	}
	/*onBeforeLongRangeTeleport( lrtp )
	{
		this.SetShieldState( false, null );
		this._age = 0;
	}*/
	onSnapshotApplied()
	{
		if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		{
			if ( this.matter_crystal > sdBaseShieldingUnit.score_timed_max_capacity )
			{
				this.matter_crystal = sdBaseShieldingUnit.score_timed_max_capacity;
			}
			
			if ( this.enabled )
			sdBaseShieldingUnit.EnableNoScoreBSUArea( this ); // Re-occupy area
		}
		
		if ( this.enabled )
		if ( sdWorld.is_server )
		{
			if ( sdWorld.server_config.allowed_base_shielding_unit_types !== null )
			if ( sdWorld.server_config.allowed_base_shielding_unit_types.indexOf( this.type ) === -1 )
			{
				this.SetShieldState( false );
			}
			if ( this.IsOutOfBounds() ) // Disable BSU if it's outside play area
			this.SetShieldState( false );
		}
	}
	
	IsOutOfBounds()
	{
		//if ( !sdWorld.inDist2D_Boolean( 0,0, this.x, this.y, sdWorld.server_config.open_world_max_distance_from_zero_coordinates ) )
		if ( ( sdWorld.server_config.enable_bounds_move && sdWorld.server_config.aggressive_hibernation ) || sdWorld.server_config.forced_play_area )
		if ( Math.abs( this.x ) > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_x ||
			 this.y < sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_min ||
			 this.y > sdWorld.server_config.open_world_max_distance_from_zero_coordinates_y_max )
		{
			return true;
		}
		
		return false;
	}

	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_protected_entities' || prop === '_flesh_infestation_net_id_to_allowed_after' );
	}
	
	MeasureProtectionPercentage()
	{
		let level = Math.min( sdBaseShieldingUnit.damage_reduction_shield_max_level, this.level );
		
		return sdWorld.MorphWithTimeScale( 0, 1, 0.9, level );
	}
	
	static TestIfPointIsOutsideOfBSURanges( x, y )
	{
		for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
		{
			let s = sdBaseShieldingUnit.all_shield_units[ i ];

			if ( s.enabled )
			{
				if ( sdWorld.inDist2D_Boolean( s.x, s.y, x, y, sdBaseShieldingUnit.protect_distance ) )
				return false;
			}
		}
		
		return true;
	}
	static IsMobSpawnAllowed( x, y ) // Just like TestIfPointIsOutsideOfBSURanges, except it allows mobs to be placed within range of BSU but only if furthest protected wall towards mob is closer than mob
	{
		for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
		{
			let s = sdBaseShieldingUnit.all_shield_units[ i ];

			if ( s.enabled )
			if ( s.type !== sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
			{
				if ( sdWorld.inDist2D_Boolean( s.x, s.y, x, y, sdBaseShieldingUnit.protect_distance ) )
				{
					let dx = x - s.x;
					let dy = y - s.y;
					let di = sdWorld.Dist2D_Vector( dx, dy );
					
					if ( di < 16 )
					return false;
				
					dx = dx / di * sdBaseShieldingUnit.protect_distance;
					dy = dy / di * sdBaseShieldingUnit.protect_distance;
					
					// This make it impossible for it to spawn mobs in-between 2 BSUs that protect single big room, even if these BSUs are of different types
					let all_nearby_bsus = new Set();
					for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
					{
						let s2 = sdBaseShieldingUnit.all_shield_units[ i ];

						if ( s2.enabled )
						if ( s2.type !== sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
						if ( sdWorld.inDist2D_Boolean( s2.x, s2.y, s.x, s.y, sdBaseShieldingUnit.protect_distance * 2 ) )
						all_nearby_bsus.add( s2 );
					}
					
					let bsu_ownership_filter = ( e )=>
					{
						if ( e._shielded )
						if ( all_nearby_bsus.has( e._shielded ) )
						//if ( e._shielded === s )
						return true;
				
						return false;
					};
					
					let hit_point = sdWorld.TraceRayPoint( s.x + dx, s.y + dy, s.x, s.y, null, null, sdCom.com_protectable_solid_classes, bsu_ownership_filter );
					
					if ( hit_point )
					{
						let furthest_wall_distance = sdWorld.Dist2D_Vector_pow2( hit_point.x - s.x, hit_point.y - s.y );
						
						let distance_towards_potential_mob = sdWorld.Dist2D_Vector_pow2( x - s.x, y - s.y );
						
						if ( distance_towards_potential_mob < furthest_wall_distance )
						return false;
					}
				}
			}
		}
		
		return true;
	}
	
	static TestIfDamageShouldPass( entity, dmg, initiator=null )
	{
		if ( dmg !== Infinity && entity._shielded && !entity._shielded._is_being_removed && entity._shielded.enabled && entity._shielded.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE && sdWorld.inDist2D_Boolean( entity.x + ( entity._hitbox_x1 + entity._hitbox_x2 ) / 2, entity.y + ( entity._hitbox_y1 + entity._hitbox_y2 ) / 2, entity._shielded.x, entity._shielded.y, sdBaseShieldingUnit.protect_distance_stretch ) )
		{
			entity._shielded.ProtectedEntityAttacked( entity, dmg, initiator );
			return dmg * ( 1 - entity._shielded.MeasureProtectionPercentage() );
		}
		else
		if ( entity._shielded === null || 
			 dmg === Infinity || 
			 entity._shielded._is_being_removed || 
			 !entity._shielded.enabled || 
			 !sdWorld.inDist2D_Boolean( entity.x + ( entity._hitbox_x1 + entity._hitbox_x2 ) / 2, entity.y + ( entity._hitbox_y1 + entity._hitbox_y2 ) / 2, entity._shielded.x, entity._shielded.y, sdBaseShieldingUnit.protect_distance_stretch ) )
		{
			return dmg;
		}
		else
		{
			entity._shielded.ProtectedEntityAttacked( entity, dmg, initiator );
			return 0;
		}
	}
	
	ShareValueIfHadntRecently( destroy=false )
	{
		this._enabled_shields_in_network_count = this.enabled ? 1 : 0;
		
		if ( this.type !== sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER &&
			 this.type !== sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		return false;
	
		if ( this._is_being_removed )
		return false;
		
		if ( sdWorld.time > this._last_value_share + 2000 || destroy )
		{
			let friendly_shields = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
			
			let id = friendly_shields.indexOf( this );
			if ( id === -1 )
			friendly_shields.push( this );
		
			for ( let i = 0; i < friendly_shields.length; i++ )
			{
				if ( friendly_shields[ i ].type !== this.type || 
					 friendly_shields[ i ]._is_being_removed || 
					 !sdBaseShieldingUnit.EnableNoScoreBSUArea( friendly_shields[ i ], false ) )
				{
					friendly_shields.splice( i, 1 );
					i--;
					continue;
				}
			}
			
			let sum_matter = 0;
			
			for ( let i = 0; i < friendly_shields.length; i++ )
			sum_matter += friendly_shields[ i ].matter_crystal;
		
		
			if ( friendly_shields.length <= 1 )
			return false;
			
			if ( destroy )
			{
				id = friendly_shields.indexOf( this );
				
				if ( id !== -1 )
				friendly_shields.splice( id, 1 );
			
				this.remove();
			}
			
			sum_matter /= friendly_shields.length;
			
			// Hard cap
			if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
			{
				if ( sum_matter > sdBaseShieldingUnit.score_timed_max_capacity )
				sum_matter = sdBaseShieldingUnit.score_timed_max_capacity;
			}

			for ( let i = 0; i < friendly_shields.length; i++ )
			{
				friendly_shields[ i ].matter_crystal = sum_matter;
				
				
				friendly_shields[ i ]._last_value_share = sdWorld.time;
				
				if ( friendly_shields[ i ].enabled )
				if ( friendly_shields[ i ] !== this ) // Already counted, also it will make it ignore enabled status and prevent division by zero
				{
					this._enabled_shields_in_network_count++;
				}
			}
			
			return true;
		}
		
		return false;
	}
				
	ProtectedEntityAttacked( ent, dmg, initiator )
	{
		let fx = ( sdWorld.time > this._last_shield_sound_played + 100 );
		
		if ( initiator )
		if ( initiator._socket )
		{
			if ( initiator._last_damage_upg_complain < sdWorld.time - 1000 * 10 )
			{
				initiator._last_damage_upg_complain = sdWorld.time;

				switch ( ~~( Math.random() * 7 ) )
				{
					case 0: initiator.Say( 'This entity is protected by a base shielding unit', true, false, true ); break;
					case 1: initiator.Say( 'A base shielding unit is protecting this', true, false, true ); break;
					case 2: initiator.Say( 'Entity can not be damaged until base shielding unit is disabled', true, false, true ); break;
					case 3: initiator.Say( 'Can\'t damage due to base shielding unit', true, false, true ); break;
					case 4: initiator.Say( 'This entity is within range of base shielding unit', true, false, true ); break;
					case 5: initiator.Say( 'Some base shielding units can be attacked by other base shielding units', true, false, true ); break;
					case 6: initiator.Say( 'Some base shielding units are vulnerable to anti-crystals, some are timed', true, false, true ); break;
				}
			}

			if ( fx )
			{
				//ent.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 1, 6, 1 ], observer: initiator });
				this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 6, 6, 6 ], observer: initiator });
			}
		}
		
		if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED || this.type === sdBaseShieldingUnit.TYPE_FACTION_SHIELD )
		{
			// These ignore any damage
		}
		else
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		{
			let crystal_damage = dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp * sdWorld.server_config.GetBSUDamageMultiplier();
			
			this.matter_crystal = Math.max( 0, this.matter_crystal - crystal_damage );

			if ( this.matter_crystal >= 50000 && this.revenge_turrets_enabled )
			{
				if ( initiator )
				if ( !initiator._is_being_removed )
				if ( initiator._shielded !== this )
				{
					if ( !sdWorld.inDist2D_Boolean( initiator.x, initiator.y, this.x, this.y, sdBaseShieldingUnit.protect_distance * ( initiator.IsPlayerClass() ? 1 : 0.5 ) - 64 ) ) // Check if it is far enough from the shield to prevent players in base take damage
					{
						this._revenge_damage_bonus += dmg;
			
						this._revenge_target = initiator;
						
						//if ( this._revenge_turret_parent === null )
						if ( this._revenge_turret === null )
						{
							let best_ent = null;
							let best_x = 0;
							let best_y = 0;
							let best_dx = 0;
							let best_dy = 0;
							
							let best_di_pow2 = Infinity;
							
							let xx = ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2;
							let yy = ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2;
							
							let extrude = 5;

							for ( let i = 0; i < this._protected_entities.length; i++ )
							{
								let e = sdEntity.entities_by_net_id_cache_map.get( this._protected_entities[ i ] );
								
								if ( e !== ent )
								if ( e )
								if ( !e._is_being_removed )
								if ( e.is( sdBlock ) )
								{
									let cx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
									let cy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;

									let di_pow2 = sdWorld.Dist2D_Vector_pow2( cx-initiator.x, cy-initiator.y );

									let turret_x = cx;
									let turret_y = cy;
									
									let dx = 0;
									let dy = 0;

									if ( initiator.y < yy )
									{
										turret_x = cx;
										turret_y = e.y + e._hitbox_y1;
										
										dx = 0;
										dy = -extrude;
									}
									else
									if ( initiator.y > yy )
									{
										turret_x = cx;
										turret_y = e.y + e._hitbox_y2;
										
										dx = 0;
										dy = extrude;
									}
									else
									if ( initiator.x < xx )
									{
										turret_x = e.x + e._hitbox_x1;
										turret_y = cy;
										
										dx = -extrude;
										dy = 0;
									}
									else
									if ( initiator.x > xx )
									{
										turret_x = e.x + e._hitbox_x2;
										turret_y = cy;
										
										dx = extrude;
										dy = 0;
									}
									
									if ( di_pow2 < 1000 * 1000 && sdWorld.CheckLineOfSight( turret_x, turret_y, initiator.x, initiator.y, null, null, sdCom.com_visibility_unignored_classes ) )
									di_pow2 *= 0.01;
									
									di_pow2 *= 0.25 + Math.random() * 0.75;

									if ( di_pow2 < best_di_pow2 )
									{
										best_ent = e;
										best_di_pow2 = di_pow2;
										best_x = turret_x - e.x;
										best_y = turret_y - e.y;
										best_dx = dx;
										best_dy = dy;
									}
								}
							}
							
							if ( best_ent )
							{
								this._revenge_turret_parent = best_ent;
								this._revenge_turret_x = best_x;
								this._revenge_turret_y = best_y;
								this._revenge_turret = sdEntity.Create( sdBSUTurret, { x:best_ent.x + best_x, y:best_ent.y + best_y, bsu:this } );
								this._revenge_turret.dx = best_dx;
								this._revenge_turret.dy = best_dy;
								//sdEntity.entities.push( this._revenge_turret );
								
								this._revenge_animation_progress = 0;
							}
						}
						
						/*
						//initiator.DamageWithEffect( 5 );
						initiator.DamageWithEffect( 1 + this._revenge_damage_bonus * 0.1 );
						
						
						
						if ( fx )
						{
							sdWorld.SendEffect({ x:this.x, y:this.y, x2:ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, y2:ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							sdWorld.SendEffect({ x:initiator.x, y:initiator.y, x2:ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, y2:ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							
							//sdWorld.SendEffect({ x:this.x, y:this.y, x2:this.x + ( this._hitbox_x2 / 2 ), y2:ent.y + ( ent._hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							//sdWorld.SendEffect({ x:ent.x + ( ent._hitbox_x2 / 2 ), y:ent.y + ( ent._hitbox_y2 / 2 ), x2:initiator.x, y2:initiator.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
						}*/
					}
				}
			}
		}
		else
		if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
		{
			//trace( 'BSU matter wasted per damage: ', dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp_matter_type * sdWorld.server_config.GetBSUDamageMultiplier() );
			
			this.matter = Math.max( 0, this.matter - dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp_matter_type * sdWorld.server_config.GetBSUDamageMultiplier() );
			this.WakeUpMatterSources();
		}
		
		if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		{
			// No damage reporting
		}
		else
		{
			this._dmg_to_report += dmg;
			if ( this._dmg_to_report > 500 )
			{
				this._dmg_to_report = 0;

				let cameras = this.GetConnectedCameras();
				for ( let i = 0; i < cameras.length; i++ )
				cameras[ i ].Trigger( sdCamera.DETECT_BSU_DAMAGE );
			}
		}
		
		if ( fx )
		{
			sdSound.PlaySound({ name:'shield', x:ent.x, y:ent.y, volume:0.2 });
			
			this._last_shield_sound_played = sdWorld.time;
		}
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = Math.abs( dmg );
		
		if ( this.enabled )
		{
			dmg *= 0.333;
			
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
			}
		}
		
		//let old_hea = this.hea;
		
		this.hea -= dmg;
		
		
		if ( !this.attack_other_units )
		if ( this.hea < this.hmax * 0.75 )
		{
			let cameras = this.GetConnectedCameras();
			for ( let i = 0; i < cameras.length; i++ )
			cameras[ i ].Trigger( sdCamera.DETECT_BSU_DAMAGE );
		}
	
		this.regen_timeout = 30;

		if ( this.hea <= 0 )
		this.remove();

		//console.log( this._protected_entities );

		//this._update_version++; // Just in case
	}
	static IsShieldableFilter( e )
	{
		if ( typeof e._shielded !== 'undefined' ) // _shielded is now a magic property
		{
			const is_block = e.is( sdBlock );
			
			const is_bg = !is_block && e.is( sdBG );
			
			if (
					( 
						is_block && 
						( 
							e.material === sdBlock.MATERIAL_WALL || 
							e.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || 
							e.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 || 
							e.material === sdBlock.MATERIAL_SHARP || 
							e.material === sdBlock.MATERIAL_TRAPSHIELD 
						)
					)
					||
					( 
						is_bg && e.material !== sdBG.MATERIAL_GROUND
					)
					||
					(
						!is_block 
						&&
						!is_bg
					)
				)
			{
				return true;
			}	
		}
		
		return false;
	}
	SetShieldState( enable=false, observer_character=null )
	{
		if ( enable === this.enabled )
		{
			return;
		}
		
		//this._flesh_infestation_counter = 0;
		//this._flesh_infestation_allowed_in = 0;
		
		if ( enable )
		{
			this._protected_entities_when_disabled = null;
			this._protected_entities_when_disabled_until = 1;
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
		else
		{
			let cameras = this.GetConnectedCameras();
			for ( let i = 0; i < cameras.length; i++ )
			cameras[ i ].Trigger( sdCamera.DETECT_BSU_DEACTIVATION );
		
			this._protected_entities_when_disabled = new Set();
			for ( let j = 0; j < this._protected_entities.length; j++ )
			{
				if ( this._protected_entities[ j ] )
				this._protected_entities_when_disabled.add(
					this._protected_entities[ j ]
				);
			}
			this._protected_entities_when_disabled_until = sdWorld.time + 1000 * 60 * 5; // 5 minutes
		}
		
		this.enabled = enable;
		if ( !this.enabled ) // Disabled protected blocks and doors
		{
			sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:2, pitch:0.25 });
			
			let obj;
			
			let effect_for = [];
			
			for ( let j = 0; j < this._protected_entities.length; j++ )
			{
				obj = sdEntity.entities_by_net_id_cache_map.get( this._protected_entities[ j ] );
				if ( obj ) // If not - admin removed it. Or world border
				if ( !obj._is_being_removed )
				if ( obj._shielded === this )
				{
					obj._shielded = null;
						
					effect_for.push( obj );
				}
			}
			
			for ( let t = 0; t < 30 && effect_for.length > 0; t++ )
			{
				let p = ~~( Math.random() * effect_for.length );
				
				let b = effect_for[ p ];
				
				sdWorld.SendEffect({ x:this.x, y:this.y, x2:b.x + ( b.hitbox_x2 / 2 ), y2:b.y + ( b.hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#855805' });
				
				effect_for.splice( p, 1 );
			}
			
			this._protected_entities = [];
			this._matter_drain = 0; // Reset matter drain
		}

		if ( this.enabled ) // Scan unprotected blocks and fortify them
		{
			this.charge_blocked_until = sdWorld.time + 3000;
			
			sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:2, pitch:0.5 });

			//let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, [ 'sdBlock', 'sdDoor' ] );
			let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, null, sdBaseShieldingUnit.IsShieldableFilter );
			//_x, _y, range, append_to=null, specific_classes=null, filter_candidates_function=null
			
			let effect_for = [];
			
			let CheckIfNearUnfriendly = this.GetCheckIfNearUnfriendlyMethod();
			
			let tell_about_disputable_entities = false;

			for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
			{
				let e = blocks[ i ];
				
				if ( e._shielded === null || e._shielded._is_being_removed )
				{
					if ( CheckIfNearUnfriendly( e ) )
					{
						tell_about_disputable_entities++;
						continue;
					}

					e._shielded = this;

					effect_for.push( e );

					this._protected_entities.push( e._net_id ); // Since for some reason arrays don't save _net_id's in this entity, this is obsolete
					this._matter_drain += ( e.height + e.width ) / 32;

					if ( observer_character )
					e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 1, 2, 1 ], observer: observer_character });
				}

				/*if ( e.is( sdBlock ) )
				{
					if ( e.material === sdBlock.MATERIAL_WALL || 
						 e.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || 
						 e.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 ) // Only walls, no trap or shield blocks
					if ( e._shielded === null || e._shielded._is_being_removed )
					{
						if ( CheckIfNearUnfriendly( e ) )
						{
							tell_about_disputable_entities++;
							continue;
						}
						
						e._shielded = this;
						
						effect_for.push( e );
						
						this._protected_entities.push( e._net_id ); // Since for some reason arrays don't save _net_id's in this entity, this is obsolete
						this._matter_drain += ( e.height + e.width ) / 32;

						if ( observer_character )
						e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 1, 2, 1 ], observer: observer_character });
					}
				}
				else
				if ( e.is( sdDoor ) )
				{
					if ( e._shielded === null || e._shielded._is_being_removed )
					{
						if ( CheckIfNearUnfriendly( e ) )
						{
							tell_about_disputable_entities++;
							continue;
						}
					
						e._shielded = this;
						
						effect_for.push( e );
						
						this._protected_entities.push( e._net_id );
						this._matter_drain += ( e.height + e.width ) / 32;
						
						if ( observer_character )
						e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 1, 2, 1 ], observer: observer_character });
					}
				}*/
			}
			
			for ( let t = 0; t < 30 && effect_for.length > 0; t++ )
			{
				let p = ~~( Math.random() * effect_for.length );
				
				let b = effect_for[ p ];
				
				sdWorld.SendEffect({ x:this.x, y:this.y, x2:b.x + ( b.hitbox_x2 / 2 ), y2:b.y + ( b.hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
				
				effect_for.splice( p, 1 );
			}
			
			if ( tell_about_disputable_entities > 0 )
			if ( observer_character )
			if ( observer_character._socket )
			{
				if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
				observer_character._socket.SDServiceMessage( '{1} entities are disputable and were not protected. Try connecting base shielding units with a cable tool or reset previous claims. This kind can\'t be near red long-range teleports.', [ tell_about_disputable_entities ] );
				else
				observer_character._socket.SDServiceMessage( '{1} entities are disputable and were not protected. Try connecting base shielding units with a cable tool or reset previous claims.', [ tell_about_disputable_entities ] );
			}
		}
		
		this.ShareValueIfHadntRecently();
	}
	SetAttackState()
	{
		//if ( this.enabled )
		{
			this.attack_other_units = !this.attack_other_units;

			if ( !this.attack_other_units )
			{
				let cameras = this.GetConnectedCameras();
				for ( let i = 0; i < cameras.length; i++ )
				cameras[ i ].Trigger( sdCamera.DETECT_BSU_DEACTIVATION );
			}
			
			sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
		}
	}
	IsPhysicallyMovable()
	{
		return !this.enabled;
	}
	get mass() { return ( this.enabled ) ? 500 : 35; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
			
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	
	GetConnectedCameras()
	{
		if ( sdWorld.time > this._connected_cameras_cache_last_rethink + 3000 )
		{
			let old_cameras = this._connected_cameras_cache.slice();
			
				
			this._connected_cameras_cache_last_rethink = sdWorld.time;
			this._connected_cameras_cache = this.FindObjectsInACableNetwork( null, sdCamera );
			
			if ( old_cameras.length !== this._connected_cameras_cache.length )
			{
				for ( let i = 0; i < old_cameras.length; i++ )
				{
					let c = old_cameras[ i ];
					
					if ( !c._is_being_removed )
					if ( this._connected_cameras_cache.indexOf( c ) === -1 )
					c.Trigger( sdCamera.DETECT_BSU_DEACTIVATION );
				}
			}
		}
		
		return this._connected_cameras_cache;
	}
	
	GetCheckIfNearUnfriendlyMethod()
	{
		let friendly_shields = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
		let unfriendly_shields = []; // These will prevent protecting walls nearby other shields
		let disallowed_net_ids = new Set();

		for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
		{
			let s = sdBaseShieldingUnit.all_shield_units[ i ];

			if ( s.prevent_hostile_shielding && sdBaseShieldingUnit.enable_nearby_claiming )
			if ( s !== this )
			if ( ( s.charge >= this.charge && s.charge > 0 ) || ( s.type !== this.type && s.enabled ) )
			if ( friendly_shields.indexOf( s ) === -1 )
			unfriendly_shields.push( s );
		}
		
		//if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		for ( let i = 0; i < sdLongRangeTeleport.long_range_teleports.length; i++ )
		{
			let s = sdLongRangeTeleport.long_range_teleports[ i ];

			if ( s.is_server_teleport )
			unfriendly_shields.push( s );
		}
		
		for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
		{
			let s = sdBaseShieldingUnit.all_shield_units[ i ];
			
			if ( s._protected_entities_when_disabled )
			if ( friendly_shields.indexOf( s ) === -1 )
			{
				s._protected_entities_when_disabled.forEach( ( _net_id )=>
				{
					disallowed_net_ids.add( _net_id );
				});
			}
		}

		let CheckIfNearUnfriendly = ( e )=>
		{
			if ( disallowed_net_ids.has( e._net_id ) )
			return true;
			
			for ( let i = 0; i < unfriendly_shields.length; i++ )
			{
				let s = unfriendly_shields[ i ];
				
				if ( e.inRealDist2DToEntity_Boolean( s, sdBaseShieldingUnit.protect_distance + 32 ) )
				return true;
			}

			return false;
		};

		return CheckIfNearUnfriendly;
	}
	
	ProtectedEntityMoved( e, CheckIfNearUnfriendly=null )
	{
		if ( !CheckIfNearUnfriendly )
		CheckIfNearUnfriendly = this.GetCheckIfNearUnfriendlyMethod();
		
		if ( CheckIfNearUnfriendly( e ) )
		{
			//if ( sound_once )
			{
				sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:2, pitch:0.25 });
				//sound_once = false;
			}

			let b = e;

			sdWorld.SendEffect({ x:this.x, y:this.y, x2:b.x + ( b.hitbox_x2 / 2 ), y2:b.y + ( b.hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#855805' });

			e._shielded = null;
			//this._protected_entities.splice( i, 1 );
			//i--;
			//continue;
			return true;
		}
		return false;
	}
	static GlobalThink( GSPEED )
	{
		if ( sdBaseShieldingUnit.no_score_bsu_areas.length <= 0 )
		return;
	
		sdBaseShieldingUnit.no_score_bsu_area_loopie = ( sdBaseShieldingUnit.no_score_bsu_area_loopie + 1 ) % sdBaseShieldingUnit.no_score_bsu_areas.length;
		
		let i = sdBaseShieldingUnit.no_score_bsu_area_loopie;
	
		if ( sdWorld.time > sdBaseShieldingUnit.no_score_bsu_areas[ i ].anything_is_disallowed_until )
		{
			sdBaseShieldingUnit.no_score_bsu_areas.splice( i, 1 );
			sdBaseShieldingUnit.no_score_bsu_area_loopie--;
			return;
		}
	}
	static EnableNoScoreBSUArea( bsu, spawn_new_area=true )
	{
		let r = sdBaseShieldingUnit.no_score_bsu_area_radius;
		
		let x = bsu.x;
		let y = bsu.y;
		
		let allowed = true;
		
		for ( let i = 0; i < sdBaseShieldingUnit.no_score_bsu_areas.length; i++ )
		{
			let a = sdBaseShieldingUnit.no_score_bsu_areas[ i ];
			
			if ( sdWorld.time < a.anything_is_disallowed_until )
			{
				if ( sdWorld.inDist2D_Boolean( x, y, a.x, a.y, r * 0.5 ) )
				if ( a.allowed_for === bsu )
				{
					spawn_new_area = false;
				}

				if ( sdWorld.inDist2D_Boolean( x, y, a.x, a.y, r ) )
				{
					if ( a.allowed_for === bsu && sdWorld.time < a.allowed_is_allowed_until )
					{
						// Allow
						if ( sdWorld.inDist2D_Boolean( x, y, a.x, a.y, 32 ) )
						{
							return true; // Insta-allow if it is in same place
						}
						
						// Otherwise simply allow until there is some else area
					}
					else
					{
						allowed = false;
					}
				}
			}
		}
		
		if ( allowed )
		if ( spawn_new_area )
		sdBaseShieldingUnit.no_score_bsu_areas.push({
			x: x,
			y: y,
			allowed_for: bsu,
			allowed_is_allowed_until: sdWorld.time + 1000*60*60*8,
			anything_is_disallowed_until: sdWorld.time + 1000*60*60*24*4
		});
	
		return allowed;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		let time_scale = sdGun.HandleTimeAmplification( this, 1 );
		
		GSPEED *= time_scale;
		
		let GSPEED_offline_compensated = Math.max( 0, sdWorld.time - this._last_tick_score ) / 1000 * 30;
		this._last_tick_score = sdWorld.time;
		
		if ( this._revenge_reload > 0 )
		this._revenge_reload = Math.max( 0, this._revenge_reload - GSPEED );
	
		// Turret somehow disappeared
		{	
			let xx = 0;
			let yy = 0;
			
			if ( this._revenge_target )
			if ( this._revenge_target._is_being_removed || ( this._revenge_target.IsPlayerClass() && ( this._revenge_target.hea || this._revenge_target._hea || 0 ) <= 0 ) ) // Broken tanks still can damage shields walls with conveyors indefinitely
			this._revenge_target = null;
			
			if ( this._revenge_turret_parent && this._revenge_turret )
			{
				xx = this._revenge_turret_parent.x + this._revenge_turret_x;
				yy = this._revenge_turret_parent.y + this._revenge_turret_y;

				/*let cx = this._revenge_turret_parent.x + ( this._revenge_turret_parent._hitbox_x1 + this._revenge_turret_parent._hitbox_x2 ) / 2;
				let cy = this._revenge_turret_parent.y + ( this._revenge_turret_parent._hitbox_y1 + this._revenge_turret_parent._hitbox_y2 ) / 2;
				
				let morph = Math.min( 1, this._revenge_animation_progress / 100 * 2 );
				
				//morph = 1 - ( 1 - morph ) * 0.75; // Do not reach center actually

				xx = xx * morph + cx * ( 1 - morph );
				yy = yy * morph + cy * ( 1 - morph );*/
				
				let morph = Math.min( 1, this._revenge_animation_progress / 100 * 2 );
				
				xx += this._revenge_turret.dx * ( morph - 0.75 ) * 4;
				yy += this._revenge_turret.dy * ( morph - 0.75 ) * 4;
			}

			if ( this._revenge_damage_bonus >= 5 && this.enabled && this._revenge_target && this._revenge_turret_parent && this._revenge_turret && !sdWorld.inDist2D_Boolean( this._revenge_target.x, this._revenge_target.y, this.x, this.y, sdBaseShieldingUnit.protect_distance * ( this._revenge_target.IsPlayerClass() ? 1 : 0.5 ) - 64 ) )
			{
				if ( this._revenge_animation_progress < 100 )
				{
					if ( this._revenge_animation_progress === 0 )
					sdSound.PlaySound({ name:'shield_turret_door', x:xx, y:yy, volume:1 });

					this._revenge_animation_progress = Math.min( 100, this._revenge_animation_progress + GSPEED * 5 );
				}
				else
				{
					if ( this._revenge_reload <= 0 )
					{
						sdSound.PlaySound({ name:'shield_turret', x:xx, y:yy, volume:1 });

						sdWorld.SendEffect({ x:xx, y:yy, x2:this._revenge_target.x + ( this._revenge_target._hitbox_x1 + this._revenge_target._hitbox_x2 ) / 2, y2:this._revenge_target.y + ( this._revenge_target._hitbox_y1 + this._revenge_target._hitbox_y2 ) / 2, type:sdEffect.TYPE_BEAM_CIRCLED, color:'#f9e853' });

						this._revenge_reload = 15;

						let dmg = Math.min( Math.max( 50, this._revenge_damage_bonus * 0.1 ), this._revenge_damage_bonus );

						this._revenge_damage_bonus -= dmg;
						this._revenge_target.DamageWithEffect( dmg, this._revenge_turret );
					}
				}
			}
			else
			{
				if ( this._revenge_animation_progress > 0 )
				this._revenge_animation_progress = Math.max( 0, this._revenge_animation_progress - GSPEED * 2.5 );

				if ( this._revenge_animation_progress <= 0 )
				{
					this._revenge_turret_parent = null;

					if ( this._revenge_turret )
					{
						this._revenge_turret.remove();
						this._revenge_turret._broken = false;

						this._revenge_turret = null;
					}
				}
			}

			if ( this._revenge_turret )
			{
				if ( !this._revenge_turret_parent )
				{
					this._revenge_turret.remove();
					this._revenge_turret = null;
				}
				else
				{
					let f = ( this._revenge_reload > 7 ) ? 1 : 0;

					this._revenge_turret.x = xx;
					this._revenge_turret.y = yy;
					this._revenge_turret.frame = f;
					
					if ( this._revenge_target )
					this._revenge_turret.ang = ( -Math.PI/2 - Math.atan2( xx-this._revenge_target.x, yy-this._revenge_target.y ) ) * 100;
					
					this._revenge_turret.x0 = this._revenge_turret_parent.x + this._revenge_turret_x;
					this._revenge_turret.y0 = this._revenge_turret_parent.y + this._revenge_turret_y;
					
					this._revenge_turret.open = Math.min( 100, this._revenge_animation_progress * 8 );
				}
			}
		}

		
		if ( this.enabled )
		{
			this.sx = 0;
			this.sy = 0;
			
			if ( sdWorld.time > this.charge_blocked_until )
			//if ( this.matter >= 320 )
			if ( this.charge < 100 )
			this.charge = Math.min( 100, this.charge + GSPEED * 0.25 );
	
			//this._age += GSPEED_offline_compensated;
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			
			if ( this.charge > 0 )
			this.charge = Math.max( 0, this.charge - GSPEED * 0.25 );
		
			//this._age -= Math.max( 0, GSPEED_offline_compensated );
		}
		
		if ( sdWorld.time > this.charge_blocked_until )
		if ( this._speed_boost > 1 )
		{
			this._speed_boost = Math.max( 1, this._speed_boost - GSPEED / 30 );
		}
		
		// Forget previous claim-protection
		if ( this._protected_entities_when_disabled )
		if ( sdWorld.time > this._protected_entities_when_disabled_until )
		{
			this._protected_entities_when_disabled = null;
			this._protected_entities_when_disabled_until = 2;
		}
		
		let delta_pos = sdWorld.Dist2D_Vector( this.x - this._last_x_for_charge_reset, this.y - this._last_y_for_charge_reset );
		this.charge = Math.max( 0, this.charge - delta_pos / 16 * 100 );
		this._last_x_for_charge_reset = this.x;
		this._last_y_for_charge_reset = this.y;
		if ( delta_pos > 0 )
		if ( this.enabled )
		{
			// Moves - clear protected blocks if they enter other BSU area
			
			/*let friendly_shields = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
			let unfriendly_shields = []; // These will prevent protecting walls nearby other shields
			
			for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
			{
				let s = sdBaseShieldingUnit.all_shield_units[ i ];
				
				if ( s.prevent_hostile_shielding && sdBaseShieldingUnit.enable_nearby_claiming )
				if ( s !== this )
				if ( ( s.charge >= this.charge && s.charge > 0 ) || ( s.type !== this.type && s.enabled ) )
				if ( friendly_shields.indexOf( s ) === -1 )
				unfriendly_shields.push( s );
			}
			
			let CheckIfNearUnfriendly = ( e )=>
			{
				for ( let i = 0; i < unfriendly_shields.length; i++ )
				{
					let s = unfriendly_shields[ i ];
					if ( e.inRealDist2DToEntity_Boolean( s, sdBaseShieldingUnit.protect_distance + 32 ) )
					return true;
				}

				return false;
			};*/
								
			let CheckIfNearUnfriendly = this.GetCheckIfNearUnfriendlyMethod();
			
			//let sound_once = true;
			
			for ( let i = 0; i < this._protected_entities.length; i++ )
			{
				let e = sdEntity.GetObjectByClassAndNetId( 'auto', this._protected_entities[ i ] );
				
				if ( e )
				if ( this.ProtectedEntityMoved( e, CheckIfNearUnfriendly ) ) // If deleted
				{
					this._protected_entities.splice( i, 1 );
					i--;
					continue;
				}
				/*if ( CheckIfNearUnfriendly( e ) )
				{
					if ( sound_once )
					{
						sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:2, pitch:0.25 });
						sound_once = false;
					}
			
					let b = e;

					sdWorld.SendEffect({ x:this.x, y:this.y, x2:b.x + ( b.hitbox_x2 / 2 ), y2:b.y + ( b.hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#855805' });

					e._shielded = null;
					this._protected_entities.splice( i, 1 );
					i--;
					continue;
				}*/
			}
		}
		
		if ( !sdWorld.is_server )
		return;
	
		if ( this.enabled )
		this._last_out_of_bounds_check -= GSPEED;
		if ( this._last_out_of_bounds_check < 0 )
		{
			this._last_out_of_bounds_check = 30 * 30; // Check every 30 seconds if BSU is out of bounds
			if ( this.IsOutOfBounds() ) // Disable BSU if it's outside play area
			this.SetShieldState( false );
			
		}
	
	
		if ( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
		if ( this.auto_level_up )
		{
			if ( this.matter >= this.matter_max )
			if ( sdWorld.time > this._level_up_blocked_until )
			if ( this.level < sdBaseShieldingUnit.damage_reduction_shield_max_level ) // 2852 is 4 top tier crystals
			{
				this.matter = 0;
				this._level_up_blocked_until = sdWorld.time + 1000 / time_scale;
				
				if ( this.level >= sdBaseShieldingUnit.damage_reduction_shield_max_level )
				{
					this.matter_max = 0;
				}
				
				this.level++;
				sdSound.PlaySound({ name:'ghost_start', pitch: 0.5 + 0.2 * ( 1 - Math.min( 1, this.level / 1000 ) ), x:this.x, y:this.y, volume:1 });
			}
		}
	

		//if ( this._repair_timer > 0 )
		//this._repair_timer -= GSPEED;

		if ( this._attack_timer > 0 )
		this._attack_timer -= GSPEED;


		if ( this.attack_anim > 0 )
		this.attack_anim -= GSPEED;

		if ( this.regen_timeout > 0 )
		this.regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			{
				//let heal = Math.min( this.hea + 2 * ( GSPEED ), this.hmax ) - this.hea;
				let heal = Math.min( this.hea + 1.5 * ( GSPEED ), this.hmax ) - this.hea;

				this.hea += heal;

				/*if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
				{
					this.matter_crystal -= heal * sdBaseShieldingUnit.regen_matter_cost_per_1_hp * 3; // 3 for shield effect
				}*/
			}
		}

		if ( this._check_blocks > 0 && this.enabled )
		this._check_blocks -= GSPEED;
		else
		if ( this._matter_drain === 0 && this.enabled )
		{
			let blocks = this._protected_entities;
			for ( let i = 0; i < this._protected_entities.length; i++ ) // For non-reworked BSU's that exist pre-update
			{
				this._matter_drain += ( blocks[ i ].height + blocks[ i ].width ) / 32;
			}
		}

		if ( this.enabled )
		{
			const StartExplosionSequence = ()=>
			{
				sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
				sdSound.PlaySound({ name:'gun_needle', x:this.x, y:this.y, volume:4, pitch: 0.2 });
				
				let protected_entities_copy = this._protected_entities.slice();

				let that = this;
				for ( var i = 0; i < 20; i++ )
				{
					let an = Math.random() * Math.PI * 2;
					let d = ( i === 0 ) ? 0 : Math.random() * 20;
					let r = ( i === 0 ) ? 50 : ( 10 + Math.random() * 20 );

					setTimeout( ()=>
					{
						if ( !that._is_being_removed || i === 0 )
						if ( !that.enabled )
						{
							var a = Math.random() * 2 * Math.PI;
							var s = Math.random() * 10;

							var k = 1;

							var x = that.x + that._hitbox_x1 + Math.random() * ( that._hitbox_x2 - that._hitbox_x1 );
							var y = that.y + that._hitbox_y1 + Math.random() * ( that._hitbox_y2 - that._hitbox_y1 );

							that.sx -= Math.sin( an ) * d * r * 0.005;
							that.sy -= Math.cos( an ) * d * r * 0.005;

							//sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: that.sx*k + Math.sin(a)*s, sy: that.sy*k + Math.cos(a)*s, filter:'hue-rotate(-90deg) saturate(1.5)' });

							if ( protected_entities_copy.length > 0 )
							{
								let net_id = protected_entities_copy[ ~~( Math.random() * protected_entities_copy.length ) ];
								let e = sdEntity.entities_by_net_id_cache_map.get( net_id );
								
								if ( e )
								if ( !e._is_being_removed )
								{
									if ( Math.random() < 0.5 )
									sdBaseShieldingUnit.Zap( that, e, '#ff3333' );
									else
									sdBaseShieldingUnit.Zap( that, e, '#ffff33' );
								
									e.DamageWithEffect( 500, that );
								}
							}

							sdWorld.SendEffect({ 
								x: that.x + Math.sin( an ) * d, 
								y: that.y + Math.cos( an ) * d, 
								radius: r, 
								damage_scale: 1, 
								type: sdEffect.TYPE_EXPLOSION,
								owner: that,
								can_hit_owner: false,
								color: '#55aaff'
							});

							that.DamageWithEffect( this.hmax / 20 * 0.95 ); // Leave with 5 hitpoints
						}
					}, i * 150 );
				}
			};
			
			if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER && this.matter_crystal < 800 )
			{
				StartExplosionSequence();
					
				this.SetShieldState( false ); // Shut down if no matter
				//if ( this.attack_other_units )
				//this.attack_other_units = false;
			}
			else
			if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED && this.matter_crystal < 1 )
			{
				this.SetShieldState( false ); // Shut down if no matter
				//if ( this.attack_other_units )
				//this.attack_other_units = false;
			}
			else
			if ( this.type === sdBaseShieldingUnit.TYPE_MATTER && this.matter < 320 )
			{
				if ( this.timer_to_expect_matter > 0 )
				{
					let previous_value = this.timer_to_expect_matter;
					this.timer_to_expect_matter -= GSPEED;
					
					if ( ~~( this.timer_to_expect_matter / 30 ) !== ~~( previous_value / 30 ) )
					{
						let pitch = 0.5 * ( 0.9 + 0.1 * this.timer_to_expect_matter / ( 30 * 10 ) );
						
						if ( pitch > 0 )
						sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.25, pitch: pitch });
					}
					
					let amps = this.FindObjectsInACableNetwork( null, sdMatterAmplifier );
					for ( let i = 0; i < amps.length; i++ )
					if ( amps[ i ].crystal )
					{
						amps[ i ].crystal._last_amplification_until = sdWorld.time + 1000;
					}
				}
				else
				{
					StartExplosionSequence();

					this.SetShieldState( false ); // Shut down if no matter
					//if ( this.attack_other_units )
					//this.attack_other_units = false;
				}
			}
			else
			{
				//if ( this.hea > 0 )
				//{
					if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
					if ( this.timer_to_expect_matter < 30 * 10 )
					{
						this.timer_to_expect_matter = 30 * 10;
					}
				//}
			}
		}
		
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		{
			if ( this._enabled_shields_in_network_count > 0 ) // If connected to enabled - still drain them
			if ( sdWorld.server_config.base_degradation )
			if ( sdWorld.server_config.base_shielding_units_passive_drain_per_week_green > 0 )
			this.matter_crystal = sdWorld.MorphWithTimeScale( this.matter_crystal, 0, 1 - sdWorld.server_config.base_shielding_units_passive_drain_per_week_green, GSPEED / ( 30 * 60 * 60 * 24 * 7 ) ); // 20% per week
		}

		if ( this.enabled )
		{
			/*if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
			{
				this.matter_crystal = sdWorld.MorphWithTimeScale( this.matter_crystal, 0, 0.8, GSPEED / ( 30 * 60 * 60 * 24 * 7 ) ); // 20% per week
			}
			else*/
			if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
			{
				//if ( this._enabled_shields_in_network_count > 0 )
				//this.matter_crystal = Math.max( 0, this.matter_crystal - GSPEED / this._enabled_shields_in_network_count * 100 / ( 30 * 60 * 60 * 24 ) ); // 100 per day
				//this.matter_crystal = Math.max( 0, this.matter_crystal - GSPEED * 500 / ( 30 * 60 * 60 * 24 ) ); // 100 per day, more BSUs - less time so it can't be used to build huge bases
				
				this.matter_crystal = Math.max( 0, this.matter_crystal - GSPEED_offline_compensated * 500 / ( 30 * 60 * 60 * 24 ) );
			}
		}

		if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		{
			// No attack logic
		}
		else
		if ( this.attack_other_units )
		if ( this.enabled )
		if ( this._attack_timer <= 0 )
		{
			this._attack_timer = 30 + Math.random() * 30; // Idling, do not check in each frame since this whole test can be complex enough
			
			//let units = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance + 64, null, [ 'sdBaseShieldingUnit' ] );
			
			const units = sdBaseShieldingUnit.all_shield_units;
			
			const range = ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER ) ? 
				sdBaseShieldingUnit.protect_distance + 64 :
				sdBaseShieldingUnit.protect_distance * 1.5;
		
			let friendly_shields = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
			
			for ( let i = 0; i < units.length; i++ ) // Protect nearby entities inside base unit's radius
			if ( units[ i ].type === this.type )
			{
				let unit = units[ i ];
				
				//let mult = 1;//Math.max( 1, ( 1 + friendly_shields.length ) ); // Divide matter drain by cabled BSU amounts
				
				//console.log( ( 1 + friendly_shields.length ) );
				
				let distance = sdWorld.Dist2D( this.x, this.y, unit.x, unit.y );
				
				if ( ( distance < range ) ) // Only attack close range shields can be attacked
				if ( unit !== this )
				if ( unit.enabled === true )
				if ( friendly_shields.indexOf( unit ) === -1 ) // Do not attack same base's shields
				{
					if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
					{
						if ( unit.matter_crystal > 80 ) // Not really needed since the units turn off below 800 matter
						{
							unit.matter_crystal -= 80;
							this.matter_crystal -= 80;
							
							//this._speed_boost = Math.min( 100, this._speed_boost + 0.002 );
							//unit._speed_boost = Math.min( 100, unit._speed_boost + 0.002 );

							this.charge_blocked_until = sdWorld.time + 3000;
							unit.charge_blocked_until = sdWorld.time + 3000;
							
							{
								let cameras = this.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}
							{
								let cameras = unit.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}

							if ( false ) // Something does not feel right here, yet (no damage is registered in some cases, possibly due to _matter_drain being 0, though I haven't checked)
							{
								if ( unit._matter_drain - this._matter_drain > 0 )
								{
									unit.matter_crystal -= ( unit.matter_crystal > 100000 ? 0.9 : 1 ) * ( unit._matter_drain - this._matter_drain );
									this.matter_crystal -= ( unit._matter_drain - this._matter_drain );
								}
							}
							//sdWorld.SendEffect({ x:this.x, y:this.y, x2:unit.x, y2:unit.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							this._attack_timer = 30 / this._speed_boost;
							this.attack_anim = 20;
								
							//sdSound.PlaySound({ name:'zombie_alert2', x:this.x, y:this.y, volume:0.375 * 1, pitch:3 + ( this._speed_boost - 1 ) / 100 * 6 });
							//sdSound.PlaySound({ name:'zombie_alert2', x:unit.x, y:unit.y, volume:0.375 * 1, pitch:3 + ( unit._speed_boost - 1 ) / 100 * 6 });
							
							sdBaseShieldingUnit.Zap( this, unit, '#f9e853' );
							
							if ( unit.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
							unit.ShareValueIfHadntRecently();
							
							if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
							this.ShareValueIfHadntRecently();
						}
					}
					else
					if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
					{
						let my_scale = ( 1 + sdBaseShieldingUnit.longer_time_protected_bsu_priority * this.charge / 100 );
						let their_scale = ( 1 + sdBaseShieldingUnit.longer_time_protected_bsu_priority * unit.charge / 100 );
						
						let my_matter_scaled = this.matter * my_scale; // 10 times more if charged
						let their_matter_scaled = unit.matter * their_scale; // 10 times more if charged
						
						let least_matter = Math.min( my_matter_scaled, their_matter_scaled, 500 * this._speed_boost );
						
						let intensity = Math.min( 1, 10 - distance / range * 10 ); // Further sheilds are - less matter is wasted by both, 10% of soft waste
						least_matter *= intensity;
						
						if ( least_matter > 0 )
						{
							//trace( 'my matter damage: '+(least_matter / my_scale),', their matter damage: '+(least_matter / their_scale) );

							this.matter -= ( least_matter / my_scale );
							unit.matter -= ( least_matter / their_scale );
							
							this._speed_boost = Math.min( 4, this._speed_boost + 0.01 );
							unit._speed_boost = Math.min( 4, unit._speed_boost + 0.01 );
							
							{
								let cameras = this.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}
							{
								let cameras = unit.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}

							this._attack_timer = 60 / this._speed_boost * ( 0.99 + Math.random() * 0.02 );
							//unit._attack_timer = 60;

							this.attack_anim = 20;
							unit.attack_anim = 20;

							this.charge_blocked_until = sdWorld.time + 3000;
							unit.charge_blocked_until = sdWorld.time + 3000;

							this.WakeUpMatterSources();
							unit.WakeUpMatterSources();

							//if ( intensity < 1 )
							//sdWorld.SendEffect({ x:this.x, y:this.y, x2:unit.x, y2:unit.y, type:sdEffect.TYPE_BEAM, color:'#f90000' });
							//else
							//sdWorld.SendEffect({ x:this.x, y:this.y, x2:unit.x, y2:unit.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
						
							let c = ( intensity < 1 ) ? '#34d52c' : '#007eff';
						
							sdBaseShieldingUnit.Zap( this, unit, c );
							
						}
					}
				}
			}
		}
		/*if ( this._repair_timer <= 0 ) // Realtime fortifying replaced with turning unit on/off since now it is static when it is turned on
		{
			{
				for ( let j = 0; j < this._protected_entities.length; j++ )
				{
					if ( ( sdWorld.Dist2D( this.x, this.y, this._protected_entities[ j ].x, this._protected_entities[ j ].y ) > sdBaseShieldingUnit.protect_distance ) || ( !this.enabled ) ) // If an entity is too far away, let players know it's not protected anymore
					if ( this._protected_entities[ j ]._shielded === this )
					{
						this._protected_entities[ j ]._shielded = null;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:this._protected_entities[ j ].x + ( this._protected_entities[ j ].hitbox_x2 / 2 ), y2:this._protected_entities[ j ].y + ( this._protected_entities[ j ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#855805' });
					}
				}
				this._repair_timer = 210; // 7 seconds
				if ( this.enabled )
				{
					let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, [ 'sdBlock', 'sdDoor' ] );
					for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
					{
						if ( blocks[ i ].GetClass() === 'sdBlock' )
						{
							if ( blocks[ i ].material === sdBlock.MATERIAL_WALL || blocks[ i ].material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ) // Only walls, no trap or shield blocks
							if ( blocks[ i ]._shielded === null )
							{
								blocks[ i ]._shielded = this;
								sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
								this._protected_entities.push( blocks[ i ] );
							}
						}
						
						if ( blocks[ i ].GetClass() === 'sdDoor' )
						{
							if ( blocks[ i ]._shielded === null )
							{
								blocks[ i ]._shielded = this;
								sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
								this._protected_entities.push( blocks[ i ] );
							}
						}
					}
				}
			}
		}*/
		
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.01 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}*/
		//sdWorld.last_hit_entity = null;
		
		//this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this.hea >= this.hmax && !this.enabled && this._phys_sleep <= 0 )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
	}
	
	static Zap( that, unit, c )
	{
		sdCrystal.Zap( that, unit, c );
		sdWorld.SendEffect({ x:that.x, y:that.y, type:sdEffect.TYPE_GLOW_HIT, color:c, scale:2, radius:10 });
		sdWorld.SendEffect({ x:unit.x, y:unit.y, type:sdEffect.TYPE_GLOW_HIT, color:c, scale:2, radius:10 });

		//sdSound.PlaySound({ name:'zombie_alert2', x:this.x, y:this.y, volume:0.375 * intensity, pitch:3 + ( this._speed_boost - 1 ) / 100 * 6 });
		//sdSound.PlaySound({ name:'zombie_alert2', x:unit.x, y:unit.y, volume:0.375 * intensity, pitch:3 + ( unit._speed_boost - 1 ) / 100 * 6 });

		sdSound.PlaySound({ name:'bsu_attack', x:that.x, y:that.y, volume:0.5, pitch:1 });
		sdSound.PlaySound({ name:'bsu_attack', x:unit.x, y:unit.y, volume:0.5, pitch:1 });
	}

	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		if ( from_entity.is( sdCrystal ) )
		if ( from_entity.held_by === null && from_entity.type !== 2 && from_entity.type !== 6 ) // Prevent crystals which are stored in a crate
		//if ( this.matter_crystal < this.matter_crystal_max )
		{
			if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
			{
				sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2, pitch:2 });
				
				let matter_to_feed = from_entity.matter_max * ( from_entity.matter_regen / 100 );
				/* Likely won't work properly with value sharing green BSUs have now
				let matter_to_feed = ( this.matter_crystal < 50000 ? 1.2 : this.matter_crystal < 100000 ? 1.1 : 1 ) * from_entity.matter_max;
				let old_matter = this.matter_crystal;
				if ( this.matter_crystal < 50000 )
				if ( this.matter_crystal + matter_to_feed > 50000 )
				{
					this.matter_crystal = 50000;
					matter_to_feed = ( ( matter_to_feed - ( this.matter_crystal - old_matter ) ) / 1.2 ) * 1.1;
				}
				if ( this.matter_crystal > 50000 && this.matter_crystal < 100000 )
				if ( this.matter_crystal + matter_to_feed > 100000 )
				{
					this.matter_crystal = 100000;
					matter_to_feed = ( matter_to_feed - ( this.matter_crystal - old_matter ) ) / 1.1;
				}*/

				//this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + matter_to_feed); // Drain the crystal for it's max value and destroy it
				this.matter_crystal = Math.min( Number.MAX_SAFE_INTEGER, this.matter_crystal + matter_to_feed ); // Drain the crystal for it's max value and destroy it
				//this._update_version++;
				from_entity.remove();
			}
		}
	}

	get title()
	{
		if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		return T('Timed base shielding unit for new Star Defenders');
	
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		return T('Crystal consumption-based base shielding unit');
	
		if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
		return T('Matter-based base shielding unit');
	
		if ( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
		return T('Damage reduction shield');
	
		//return T('Base shielding unit');
		return 'undefined';
	}
	get description()
	{
		if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		return T('Reliably protects nearby walls, except for being time & location limited. Players can use score to charge these base shielding units. Use right click to configure & enable them.');
	
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		return T('Maximum value of crystals that are being put in these base shielding units is used to protect nearby walls. These base shielding units can attack other base shielding units of same kind. Use right click to configure & enable them.');
	
		if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
		return T('Matter is used to charge these base shielding units and protect nearby walls as a result. These base shielding units can attack other base shielding units of same kind. Use right click to configure & enable them.');
	
		if ( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
		return T('Matter is used to increase protection percentage applied to nearby walls of this base shielding units. Leveling can be quite costly so you might want to use alternatives and not try to charge multiple of these at the same time. Use right click to configure & enable them.');
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.hea <= 0 )
		//return;
	
		if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		{
			sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter_crystal) + " / "+sdWorld.RoundedThousandsSpaces(sdBaseShieldingUnit.score_timed_max_capacity)+" )", 0, -8 );
			
			let days = ~~( this.matter_crystal / 500 );
			let hours = ~~( ( this.matter_crystal - days * 500 ) / 500 * 24 );
			
			sdEntity.TooltipUntranslated( ctx, T('Protection expires in') + ': ' + days + ' ' + T('days') + ', ' + hours + ' ' + T('hours'), 0, 0, ( days < 1 ) ? '#ff6666' : '#66ff66' );
		}
		else
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter_crystal) + " )" );
		else
		if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
		{
			sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )", 0, -8 );
			
			let allow_protection_claim_str = 
				sdBaseShieldingUnit.enable_nearby_claiming ? 
					', ' + T( ( this.prevent_hostile_shielding ) ? 'nearby claiming disallowed' : 'nearby claiming allowed' ) :
					'';
			
			let active_str = T( ( this.attack_other_units ) ? 'active' : 'passive' );
			
			if ( sdBaseShieldingUnit.longer_time_protected_bsu_priority > 0 )
			sdEntity.TooltipUntranslated( ctx, T('Anti-raid protection') + ': ' + ~~(this.charge) + '% (' + active_str + allow_protection_claim_str + ')', 0, 0, ( this.charge < 50 || ( !this.prevent_hostile_shielding && sdBaseShieldingUnit.enable_nearby_claiming ) || !this.attack_other_units ) ? '#ff6666' : '#66ff66' );
			else
			sdEntity.TooltipUntranslated( ctx, T('Anti-raid protection') + ': ' + active_str + allow_protection_claim_str + '', 0, 0, ( ( !this.prevent_hostile_shielding && sdBaseShieldingUnit.enable_nearby_claiming ) || !this.attack_other_units ) ? '#ff6666' : '#66ff66' );
		}
		else
		if ( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
		{
			if ( this.level >= sdBaseShieldingUnit.damage_reduction_shield_max_level )
			{
				sdEntity.TooltipUntranslated( ctx, this.title, 0, -8 );
				sdEntity.TooltipUntranslated( ctx, T('Damage reduction') + ': ' + Math.round( this.MeasureProtectionPercentage() * 100 * 1000 ) / 1000 + '% ( '+T('level')+' '+this.level+', '+T('maxed out')+' )', 0, 0, '#66ff66' );
			}
			else
			{
				sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / "+ sdWorld.RoundedThousandsSpaces(this.matter_max) +" )", 0, -8 );
				sdEntity.TooltipUntranslated( ctx, T('Damage reduction') + ': ' + Math.round( this.MeasureProtectionPercentage() * 100 * 1000 ) / 1000 + '% ( '+T('level')+' '+this.level+' )', 0, 0, '#66ff66' );
			}
		
		}

		let w = 30;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		
		this.DrawConnections( ctx );
	}

	DrawConnections( ctx )
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;

		ctx.beginPath();
		ctx.arc( 0,0, sdBaseShieldingUnit.protect_distance, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}

	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;

		let xx = 0;
		let yy = 0;
		
		xx = ( this.enabled ) ? 1 : 0;
		yy = this.type;
		
		if ( this.enabled )
		{
			if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
			{
				if ( this.matter_crystal < 10 )
				ctx.filter = ( sdWorld.time % 200 < 100 ) ? 'brightness(0.5)' : 'brightness(1.5)';
				else
				if ( this.matter_crystal < 100 )
				ctx.filter = ( sdWorld.time % 2000 < 1000 ) ? 'brightness(0.5)' : 'brightness(1.5)';
			}
			else
			if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
			{
				if ( this.timer_to_expect_matter < 30 * 9 )
				ctx.filter = ( sdWorld.time % 200 < 100 ) ? 'brightness(0.5)' : 'brightness(1.5)';
			}
		
			ctx.apply_shading = false;
		}

		ctx.drawImageFilterCache( sdBaseShieldingUnit.img_unit, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );
		//ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
		
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		this.SetShieldState( false );
		
		if ( this._revenge_turret )
		{
			if ( !this._revenge_turret._is_being_removed )
			this._revenge_turret.remove();
		
			this._revenge_turret = null;
		}
		
		let id = sdBaseShieldingUnit.all_shield_units.indexOf( this );
		if ( id !== -1 )
		sdBaseShieldingUnit.all_shield_units.splice( id, 1 );
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		return 600;
	
		if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
		return 600;
	
		//if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
		return 300;
	
		//return this.hmax * sdWorld.damage_to_matter + 600;
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		//this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		this.ShareValueIfHadntRecently();
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		//if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			//if ( sdWorld.inDist2D_Boolean( this.x, this.y * 2, exectuter_character.x, exectuter_character.y * 2, 32 ) )
			if ( this.inRealDist2DToEntity_Boolean( exectuter_character, 15 ) )
			{
				if ( this.type === sdBaseShieldingUnit.TYPE_FACTION_SHIELD && !exectuter_character._god )
				return;
			
				if ( command_name === 'SHIELD_ON' )
				{	
			
					if ( !this.IsOutOfBounds() ) // Disallow activation outside playable area
					{
						this.ShareValueIfHadntRecently(); // Try taking value from connected shields if this one has 0
							
						if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED && 
							( sdWorld.is_singleplayer || sdWorld.server_config.allowed_base_shielding_unit_types === null || 
							  sdWorld.server_config.allowed_base_shielding_unit_types.indexOf( sdBaseShieldingUnit.TYPE_SCORE_TIMED ) !== -1 ) )
						{	
							if ( this.matter_crystal >= 1 )
							{
								if ( sdBaseShieldingUnit.EnableNoScoreBSUArea( this ) )
								this.SetShieldState( true, exectuter_character );
								else
								executer_socket.SDServiceMessage( 'This kind of Base shield unit can be no longer used here. Try crystal consumption-based base shielding unit or matter-based base shielding unit instead' );
							}
							else
							executer_socket.SDServiceMessage( 'Base shield unit needs at least some score being put into it' );
						}
						else
						if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER && ( sdWorld.is_singleplayer || sdWorld.server_config.allowed_base_shielding_unit_types === null || sdWorld.server_config.allowed_base_shielding_unit_types.indexOf( sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER ) !== -1 ) )
						{
							if ( this.matter_crystal >= 800 )
							this.SetShieldState( true, exectuter_character );
							else
							executer_socket.SDServiceMessage( 'Base shield unit needs at least 800 in total matter capacity crystals to be put into it' );
						}
						else
						if ( this.type === sdBaseShieldingUnit.TYPE_MATTER && ( sdWorld.is_singleplayer || sdWorld.server_config.allowed_base_shielding_unit_types === null || sdWorld.server_config.allowed_base_shielding_unit_types.indexOf( sdBaseShieldingUnit.TYPE_MATTER ) !== -1 ) )
						{
							if ( this.matter >= 320 )
							this.SetShieldState( true, exectuter_character );
							else
							executer_socket.SDServiceMessage( 'Base shield unit needs at least 320 matter. Use cable management tool and matter amplifiers with crystals to keep it charged' );
						}
						else
						if ( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE && ( sdWorld.is_singleplayer || sdWorld.server_config.allowed_base_shielding_unit_types === null || sdWorld.server_config.allowed_base_shielding_unit_types.indexOf( sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE ) !== -1 ) )
						{
							//if ( this.matter >= 320 )
							this.SetShieldState( true, exectuter_character );
							//else
							//executer_socket.SDServiceMessage( 'Base shield unit needs at least 320 matter. Use cable management tool and matter amplifiers with crystals to keep it charged' );
						}
						else
						{
							executer_socket.SDServiceMessage( 'Base shield unit of this kind does not work in this environment' );
						}
					}
					else
					{
						executer_socket.SDServiceMessage( 'Base shield unit of this kind does not work in this environment' );
					}
				}
				if ( command_name === 'CLAIMS_RESET' )
				{
					if ( this._protected_entities_when_disabled )
					{
						this._protected_entities_when_disabled = null;
						this._protected_entities_when_disabled_until = 3;
						sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
						executer_socket.SDServiceMessage( 'Previous claims were reset' );
					}
					else
					{
						executer_socket.SDServiceMessage( 'Previous claims were not found' );
					}
				}
				if ( command_name === 'SHIELD_OFF' )
				{
					if ( this.enabled === true )
					this.SetShieldState( false, exectuter_character );
				}
				if ( command_name === 'SHIELD_RESCAN' )
				{
					if ( this.enabled === true )
					{
						this.SetShieldState( false, exectuter_character );
						if ( !this.IsOutOfBounds() )
						this.SetShieldState( true, exectuter_character );
					}
				}
				if ( command_name === 'ATTACK' )
				{
					//if ( this.enabled )
					//{
						this.SetAttackState();
					//}
					//else
					//executer_socket.SDServiceMessage( 'Base shield unit needs to be enabled' );
				}
				
				if ( sdBaseShieldingUnit.enable_nearby_claiming )
				if ( command_name === 'PREVENT_HOSTILE_SHIELDING' )
				{
					this.prevent_hostile_shielding = !this.prevent_hostile_shielding;
					sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
				}
				
				if ( command_name === 'TOGGLE_CABLE_PROTECTION' )
				{
					this.protect_cables = !this.protect_cables;
					sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
				}
				
				if ( sdBaseShieldingUnit.enable_nearby_claiming )
				if ( this.type !== sdBaseShieldingUnit.TYPE_SCORE_TIMED )
				if ( command_name === 'PREVENT_PUSH' )
				{
					this.pushable = !this.pushable;
					sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
				}
				
				if ( command_name === 'AUTO_LEVEL_UP' )
				{
					this.auto_level_up = !this.auto_level_up;
					sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
				}
				
				
				if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
				{
					if ( command_name === 'PROLONG_BY_DAY' )
					{
						if ( sdBaseShieldingUnit.EnableNoScoreBSUArea( this, false ) )
						{
							let mult = parameters_array[ 0 ];

							if ( mult === 1 || mult === 7 )
							if ( exectuter_character._score >= 500 * mult )
							{
								let increase = ~~Math.min( sdBaseShieldingUnit.score_timed_max_capacity - this.matter_crystal, 500 * mult );

								if ( increase > 1 )
								{
									this.matter_crystal += increase;
									exectuter_character._score -= increase;

									sdSound.PlaySound({ name:'level_up', x:this.x, y:this.y, volume:2, pitch:0.4 });
								}
							}
						}
						else
						executer_socket.SDServiceMessage( 'This kind of Base shield unit can be no longer used here. Try crystal consumption-based base shielding unit or matter-based base shielding unit instead' );
					}
				}
				else
				if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
				{
					if ( command_name === 'CAPACITY' )
					{
						let cap = parseInt( parameters_array[ 0 ] );

						if ( cap === 1000 || cap === 10000 )
						{
							if ( this.matter > cap )
							executer_socket.SDServiceMessage( 'Base shielding unit still has matter capacity over target capacity' );

							this.matter_max = Math.max( cap, this.matter );

							sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:0.25 });
						}
					}
				}
				
				if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED ||
					 this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
				if ( command_name === 'DESTROY_AND_GIVE_MATTER_OUT' )
				{
					if ( this.ShareValueIfHadntRecently( true ) )
					{
						sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:0.25 });
					}
					else
					executer_socket.SDServiceMessage( 'Shield must be connected to other shields of a same type with a cable' );
				}

				if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
				if ( command_name === 'TOGGLE_REVENGE_TURRETS' )
				{
					this.revenge_turrets_enabled = !this.revenge_turrets_enabled;
					sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
				}
			}
			else
			executer_socket.SDServiceMessage( 'Base shielding unit is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		//if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		//if ( sdWorld.inDist2D_Boolean( this.x, this.y * 2, exectuter_character.x, exectuter_character.y * 2, 32 ) )
		if ( this.inRealDist2DToEntity_Boolean( exectuter_character, 15 ) )
		{
			if ( this.type === sdBaseShieldingUnit.TYPE_FACTION_SHIELD && !exectuter_character._god )
			return;
			
			if ( sdWorld.my_entity )
			{
				if ( this.enabled === false )
				{
					if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
					this.AddContextOption( 'Scan nearby unprotected entities', 'SHIELD_ON', [] );
					else
					if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
					this.AddContextOption( 'Scan nearby unprotected entities ( 800 matter )', 'SHIELD_ON', [] );
					else
					if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
					this.AddContextOption( 'Scan nearby unprotected entities ( 320 matter )', 'SHIELD_ON', [] );
					else
					if ( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
					this.AddContextOption( 'Scan nearby unprotected entities', 'SHIELD_ON', [] );
					
					this.AddContextOption( 'Reset previous temporary claims', 'CLAIMS_RESET', [] );
				}
				else
				{
					this.AddContextOption( 'Turn the shields off', 'SHIELD_OFF', [] );
					
					this.AddContextOption( 'Rescan entities', 'SHIELD_RESCAN', [] );
				}

				if ( this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
				{
					if ( !this.auto_level_up )
					this.AddContextOption( 'Enable automatic upgrading', 'AUTO_LEVEL_UP', [] );
					else
					this.AddContextOption( 'Stop automatic upgrading', 'AUTO_LEVEL_UP', [] );
				}


				if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED || 
					 this.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE )
				{
				}
				else
				{
					if ( !this.attack_other_units )
					this.AddContextOption( 'Attack nearby shield units', 'ATTACK', [] );
					else
					this.AddContextOption( 'Stop attacking nearby shield units', 'ATTACK', [] );
				}

				if ( sdBaseShieldingUnit.enable_nearby_claiming )
				{
					if ( this.prevent_hostile_shielding )
					this.AddContextOption( 'Allow nearby shielding claim by disconnected shields', 'PREVENT_HOSTILE_SHIELDING', [] );
					else
					this.AddContextOption( 'Disallow nearby shielding claim by disconnected shields', 'PREVENT_HOSTILE_SHIELDING', [] );
				}
				
				
				if ( this.protect_cables )
				this.AddContextOption( 'Disable cable protection', 'TOGGLE_CABLE_PROTECTION', [] );
				else
				this.AddContextOption( 'Enable cable protection', 'TOGGLE_CABLE_PROTECTION', [] );

				if ( sdBaseShieldingUnit.enable_nearby_claiming )
				if ( this.type !== sdBaseShieldingUnit.TYPE_SCORE_TIMED )
				{
					if ( this.pushable )
					this.AddContextOption( 'Prevent being moved with steering wheel', 'PREVENT_PUSH', [] );
					else
					this.AddContextOption( 'Allow being moved with steering wheel', 'PREVENT_PUSH', [] );
				}
				
				
				
				
				if ( this.type === sdBaseShieldingUnit.TYPE_SCORE_TIMED )
				{
					this.AddContextOption( 'Charge for 1 more day ( 500 score )', 'PROLONG_BY_DAY', [ 1 ] );
					this.AddContextOption( 'Charge for 2 more days ( '+sdBaseShieldingUnit.score_timed_max_capacity+' score )', 'PROLONG_BY_DAY', [ 7 ] );
					
					this.AddContextOption( 'Destroy and give score to connected base shield units', 'DESTROY_AND_GIVE_MATTER_OUT', [] );
				}
				else
				if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
				{
					if ( this.matter_max !== 10000 )
					this.AddContextOption( 'Increase matter capacity to 10k', 'CAPACITY', [ 10000 ] );
					
					if ( this.matter_max !== 1000 )
					this.AddContextOption( 'Decrease matter capacity to 1k', 'CAPACITY', [ 1000 ] );
				}
				else
				if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
				{
					this.AddContextOption( 'Destroy and give matter to connected base shield units', 'DESTROY_AND_GIVE_MATTER_OUT', [] );
					
					if ( this.revenge_turrets_enabled )
					this.AddContextOption( 'Disable revenge turrets (50k+ value shields only)', 'TOGGLE_REVENGE_TURRETS', [] );
					else
					this.AddContextOption( 'Enable revenge turrets (50k+ value shields only)', 'TOGGLE_REVENGE_TURRETS', [] );
				}
			}
		}
	}
}
//sdBaseShieldingUnit.init_class();

export default sdBaseShieldingUnit;
