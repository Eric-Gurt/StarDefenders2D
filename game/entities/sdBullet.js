
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';

import sdEffect from './sdEffect.js';
import sdCube from './sdCube.js';
import sdCharacter from './sdCharacter.js';
import sdSound from '../sdSound.js';
import sdBlock from './sdBlock.js';
import sdAntigravity from './sdAntigravity.js';
import sdDoor from './sdDoor.js';
import sdGun from './sdGun.js';
import sdArea from './sdArea.js';
import sdRift from './sdRift.js';
import sdWater from './sdWater.js';
//import sdQuadro from './sdQuadro.js';
//import sdHover from './sdHover.js';
import sdLifeBox from './sdLifeBox.js';
import sdTurret from './sdTurret.js';
import sdCrystal from './sdCrystal.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdBloodDecal from './sdBloodDecal.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdBubbleShield from './sdBubbleShield.js';
import sdBadDog from './sdBadDog.js';
import sdDrone from './sdDrone.js';
import sdFactions from './sdFactions.js';
import sdCom from './sdCom.js';


class sdBullet extends sdEntity
{
	static init_class()
	{
		sdBullet.images = {
			'bullet': sdWorld.CreateImageFromFile( 'bullet' )
			 // Auto-appended now
		};
		/*
			'ball': sdWorld.CreateImageFromFile( 'ball' ),
			'ball_g': sdWorld.CreateImageFromFile( 'ball_g' ),
			'blaster_proj': sdWorld.CreateImageFromFile( 'blaster_proj' ),
			'rocket_proj': sdWorld.CreateImageFromFile( 'rocket_proj' ),
			'grenade': sdWorld.CreateImageFromFile( 'grenade' ),
			'snowball': sdWorld.CreateImageFromFile( 'snowball' ),
			'f_psicutter_proj': sdWorld.CreateImageFromFile( 'f_psicutter_proj' ),
			'ball_charged':  sdWorld.CreateImageFromFile( 'ball_charged' ),
			'mini_rocket':  sdWorld.CreateImageFromFile( 'mini_rocket' ),
			'mini_rocket_green':  sdWorld.CreateImageFromFile( 'mini_rocket_green' ),
			'gauss_rifle_proj':  sdWorld.CreateImageFromFile( 'gauss_rifle_proj' ),
			'mini_missile_p241':  sdWorld.CreateImageFromFile( 'mini_missile_p241' ),
			'transparent_proj':  sdWorld.CreateImageFromFile( 'transparent_proj' ),
			'f_hover_rocket':  sdWorld.CreateImageFromFile( 'f_hover_rocket' ),
			'ball_orange':  sdWorld.CreateImageFromFile( 'ball_orange' ),
			'ab_tooth':  sdWorld.CreateImageFromFile( 'ab_tooth' ),
			'bullet':  sdWorld.CreateImageFromFile( 'bullet' )
		};*/

		sdBullet.images_with_smoke =
		{
			'rocket_proj': 1,
			'mini_missile_p241': 1,
			'f_hover_rocket': 1
		};
		sdBullet.images_with_no_velocity_rotation = 
		{
			'flare': 1,
			'anti_rifle_projectile_overcharged': 1,
			'anti_rifle_projectile': 1,
			'drain_shotgun_projectile_overcharged': 1,
			'drain_shotgun_projectile': 1
		};

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get hitbox_x1()
	{ if ( this.model_size >= 2 ) // if bullet sprite model is 64 by 64
		return -3
		else
		if ( this.is_grenade || this.ac > 0 || this.model_size === 1 )
		return -2
		else
		return -0.1 }
	get hitbox_x2()
	{ if ( this.model_size >= 2 ) // if bullet sprite model is 64 by 64
	return 3
	else
	if ( this.is_grenade || this.ac > 0 || this.model_size === 1 )
	return 2
	else
	return 0.1 }
	get hitbox_y1()
	{ if ( this.model_size >= 2 ) // if bullet sprite model is 64 by 64
	return -18
	else
	if ( this.is_grenade || this.ac > 0 || this.model_size === 1 )
	return -2
	else
	return -0.1 }
	get hitbox_y2()
	{ if ( this.model_size >= 2 ) // if bullet sprite model is 64 by 64
	return 18
	else
	if ( this.is_grenade || this.ac > 0 || this.model_size === 1 )
	return 2
	else
	return 0.1 }

	/*
	get substeps() // Bullets will need more
	{ return 6; } // 3 was generally fine expect for sniper

	get substeps() // Bullets will need more
	{ return 1; } // 3 was generally fine expect for sniper
	*/
	get hard_collision() // For world geometry where players can walk
	{ return this.sticky_target ? false : this.is_grenade; }

	get mass() { return this.model === 'stalker_target' ? 15 : 5; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}

	ThinkUntilRemoved()
	{ return this._rail || this._wave; }

	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( this._rail || this._wave )
		return false;

		if ( this.color === 'transparent' )
		return false;

		return true;
	}

	Impact( vel ) // fall damage basically
	{
		if ( this.is_grenade )
		if ( vel > 3 )
		{
			if ( !sdWorld.is_server || sdWorld.is_singleplayer )
			sdSound.PlaySound({ name:'world_hit2', x:this.x, y:this.y, pitch:5, volume: Math.min( 0.25, 0.1 * vel ), _server_allowed:true });
		}

		if ( this._custom_post_bounce_reaction )
		this._custom_post_bounce_reaction( this, vel, null );
	}

	static AntiShieldBulletReaction( bullet, target_entity )
	{
		if ( target_entity._shielded )
		if ( !target_entity._shielded._is_being_removed )
		if ( target_entity._shielded.enabled )
		if ( target_entity._shielded.type === sdBaseShieldingUnit.TYPE_DAMAGE_PERCENTAGE ) // Wasn't tested on any else type
		{
			target_entity.DamageWithEffect( bullet._anti_shield_damage_bonus, bullet._owner || bullet._owner2 || null );
		}

		/*if ( target_entity.is( sdBlock ) )
		if ( target_entity._contains_class )
		if ( target_entity._contains_class.indexOf( 'sdCrystal' ) === 0 )
		target_entity._contains_class = null;*/
	}

	RemoveBullet()
	{
		if ( sdWorld.is_server /*|| this._speculative*/ )
		this.remove();
		else
		{
			this.sx = 0;
			this.sy = 0;
			//this._client_side_hide_until = sdWorld.time + 100;
		}
	}
	SpawnFlareSquad()
	{
		// Spawn a faction near the flare, depending on "damage" value to determine which faction.
		if ( !sdWorld.is_server ) // Let's make sure it's the server doing it.
		return;
		
		if ( this._damage === 7 ) // AI team 7 is for Setr faction, so a Setr faction Spawn
		{
			// Attempt spawning 2 drones and 2 humanoids
			for ( let i = 0; i < 4; i++ )
			{
				let ent;
				if ( i < 2 ) // Humanoid
				{
					ent = sdEntity.Create( sdCharacter, { x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK } );
					sdFactions.SetHumanoidProperties( ent, sdFactions.FACTION_SETR );
				}
				else // Drone
				{
					ent = sdEntity.Create( sdDrone, { x:this.x, y:this.y, type: sdDrone.DRONE_SETR } );
					ent._look_x = this.x;
					ent._look_y = this.y;
				}
				
				let x,y;
				let tr = 100;
				do
				{
					{
						x = this.x + 128 - ( Math.random() * 256 );

						if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
						x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

						if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
						x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );
					}

					y = this.y + 128 - ( Math.random() * ( 256 ) );
					if ( y < sdWorld.world_bounds.y1 + 32 )
					y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

					if ( y > sdWorld.world_bounds.y2 - 32 )
					y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

					if ( ent.CanMoveWithoutOverlap( x, y, 0 ) )
					if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, ent, sdCom.com_visibility_ignored_classes, null ) )
					//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
					//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
					{
						ent.x = x;
						ent.y = y;
							
					
						sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });
						sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT });
						//console.log('ent spawned!');
						break;
					}

					tr--;
					if ( tr < 0 )
					{
						ent.remove();
						ent._broken = false;
						break;
					}
				} while( true );
			}
		}
	}
	constructor( params )
	{
		super( params );

		this.sx = 0;
		this.sy = 0;
		this.color = '#FFFF00';
		this._sd_tint_filter = null;

		this._smoke_spawn_wish = 0;

		this._hittable_by_bullets = true;

		this._anti_shield_damage_bonus = 0;
		
		this._creation_time = sdWorld.time; // Make grenades not collide with each other when fired at the same time
		
		//this._speculative = false; // Only exists on client-side for a short period of time

		//globalThis.EnforceChangeLog( this, 'color' );

		this._start_x = this.x;
		this._start_y = this.y;
		//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_BLOOD });

		this._damage = 10;
		this.time_left = 30;
		
		//this._client_side_hide_until = 0;

		this._return_damage_to_owner = false; // Stimpack and medikit
		this._custom_target_reaction = null;
		this._custom_target_reaction_protected = null;
		this._custom_target_reaction_before_damage_tests = null; // Ignores protection, called always even for BSU and other kinds of protected entities
		this._custom_detonation_logic = null;
		this._custom_post_bounce_reaction = null;
		this._custom_extra_think_logic = null;

		this._armor_penetration_level = 10; // Defines damage that is compared to target's ._armor_level in order to potentially be able or unable to deal any damage
		this._reinforced_level = 0; // For "reinforced" blocks which are unlocked from shop / build tool upgrades

		this._rail = false;
		this._rail_circled = false;
		this._rail_alt = false;
		this._rail_zap = false;

		this._affected_by_gravity = false; // Bullet drop?
		this.gravity_scale = 1;

		this.explosion_radius = 0;
		this._explosion_mult = params.explosion_mult || 1; // For damage upgraded guns to scale explosion damage ( not radius )
		this._no_explosion_smoke = false;
		this._explosion_shrapnel = false;
		
		this.model = null; // Custom image model
		this.model_size = params.model_size || 0; // 0 = 32x32, 1 = 64x32, 2 = 64x64, 3 = 96x96

		//this._knock_scale = 0.05 * 8; // Without * 8 in old mass model
		this._knock_scale = 0.01 * 8; // Less and standartized now, except for swords

		this._hook = false;
		this._wave = false; // hidden & instant

		this._last_target = null; // what bullet did hit

		this.is_grenade = false;
		this._detonate_on_impact = true;

		this._bg_shooter = false;

		this.penetrating = false;
		this._penetrated_list = [];

		this._emp = false; // EMP effect, used for turrets to set them to "sleep mode"
		this._emp_mult = 1; // How long will the turret sleep ( 1 = 5 seconds )
		
		//this._skip_crystals = false;

		this._temperature_addition = 0; // Set enemies on fire?

		this._dirt_mult = 0; // bonus Damage multiplier (relative to initial damage) against dirt blocks, used in Laser Drill weapon
		this._shield_block_mult = 0; // bonus Damage multiplier (relative to initial damage) against shield blocks, used in Life Box
		this._vehicle_mult = 0; // bonus Damage multiplier (relative to initial damage) against vehicles
		this._critical_hit_mult = 0; // bonus Damage multiplier (relative to initial damage) at close ranges - useful for Shotguns and SMGs for example.

		this._bouncy = false;

		this._owner = null;
		this._owner2 = null; // Usually vehicle which _owner uses to shoot (or sdTurret?). Participates in collision ignoring as well
		this._can_hit_owner = false;

		this._gun = null; // Gun that was used to fire this projectile. Is null in most cases

		this._admin_picker = false; // Whether it can hit anything including rift portals

		this._soft = false; // Punches

		this._hea = 80; // For grenades to be hittable

		// Rockets
		this.ac = 0; // Intensity
		this.acx = 0;
		this.acy = 0;

		this._homing = false; // is the bullet homing towards mouse?
		this._homing_mult = 0; // How fast/strong does it home towards target?

		this._first_frame = true; // Bad approach but early removal isn't good either. Also impossible to know if projectile is hook this early so far
		
		this._extra_filtering_method = null;
		
		this._for_ai_target = null; // Target "drone"
		
		this.sticky_target = null;
		this.sticky_relative_x = 0;
		this.sticky_relative_y = 0;

		// Defining this in method that is not called on this object and passed as collision filtering thing
		//this.BouncyCollisionFiltering = this.BouncyCollisionFiltering.bind( this ); Bad, snapshot will enumerate it
		/*Object.defineProperty( this, 'BouncyCollisionFiltering',
		{
			value: this.BouncyCollisionFiltering.bind( this ),
			enumerable: false
		});
		Object.defineProperty( this, 'RegularCollisionFiltering',
		{
			value: this.RegularCollisionFiltering.bind( this ),
			enumerable: false
		});*/
		this.SetMethod( 'BouncyCollisionFiltering', this.BouncyCollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
		this.SetMethod( 'RegularCollisionFiltering', this.RegularCollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
	}
	onSnapshotApplied()
	{
		if ( !sdWorld.is_server )
		{
			// Assume ownership so bullet does not dissappear on first sync while it is in player
			if ( !this._owner )
			{
				if ( !this.CanMoveWithoutOverlap( this.x, this.y ) )
				{
					let e = sdWorld.last_hit_entity;
					if ( e )
					if ( e.IsPlayerClass() )
					{
						this._owner = e;
						this._can_hit_owner = false;
					}
				}
			}
		}
	}
	onRemove()
	{
		if ( this._custom_detonation_logic )
		this._custom_detonation_logic( this );

		if ( this.color !== 'transparent' )
		{
			if ( this._rail_zap )
			{
				sdCrystal.ZapLine( this._start_x, this._start_y, this.x, this.y, this.color );
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_GLOW_HIT, color:this.color, scale:2, radius:5 });
			}
			else
			if ( this._rail_alt )
			sdWorld.SendEffect({ x:this._start_x, y:this._start_y, x2:this.x, y2:this.y, type:sdEffect.TYPE_ALT_RAIL, color:this.color });
			else
			if ( this._rail_circled )
			sdWorld.SendEffect({ x:this._start_x, y:this._start_y, x2:this.x, y2:this.y, type:sdEffect.TYPE_BEAM_CIRCLED, color:this.color });
			else
			if ( this._rail )
			sdWorld.SendEffect({ x:this._start_x, y:this._start_y, x2:this.x, y2:this.y, type:sdEffect.TYPE_BEAM, color:this.color });
		}

		if ( this.explosion_radius > 0 )
		sdWorld.SendEffect({
			x:this.x,
			y:this.y,
			radius:this.explosion_radius,
			//damage_scale: ( this._owner && this._owner.IsPlayerClass() ? this._owner._damage_mult : 1 ),
			damage_scale: 2 * this._explosion_mult,
			type:sdEffect.TYPE_EXPLOSION,
			armor_penetration_level: this._armor_penetration_level,
			owner:this._owner,
			color:this.color,
			no_smoke:this._no_explosion_smoke,
			shrapnel: this._explosion_shrapnel
		});
		
		if ( this.model === 'flare' )
		sdWorld.SendEffect({
			x:this.x,
			y:this.y,
			radius:4,
			//damage_scale: ( this._owner && this._owner.IsPlayerClass() ? this._owner._damage_mult : 1 ),
			damage_scale: 0,
			type:sdEffect.TYPE_EXPLOSION,
			owner:this._owner,
			color:this.color,
			no_smoke:this._no_explosion_smoke
		});

		if ( this._hook )
		{
			if ( this._owner )
			if ( this._owner.IsPlayerClass() )
			{
				//this._owner.hook_x = this.x;
				//this._owner.hook_y = this.y;

				if ( this._last_target && this._last_target.HookAttempt( this ) )
				{
					this._owner.hook_relative_to = this._last_target;
					this._owner.hook_relative_x = this.x - this._last_target.x;
					this._owner.hook_relative_y = this.y - this._last_target.y;

					sdSound.PlaySound({ name:'gun_psicutter_bounce', x:this.x, y:this.y, volume:0.5, pitch:3 });
				}
				else
				{
					this._owner.hook_relative_to = null;
					this._owner.hook_relative_x = 0;
					this._owner.hook_relative_y = 0;

					sdSound.PlaySound({ name:'world_hit2', x:this._owner.x, y:this._owner.y, volume:0.5, pitch:2 });
				}

			}
		}

		//if ( this._damage < 0 ) // healgun
		if ( this._damage !== 0 ) // Didn't hit anyting
		if ( this._return_damage_to_owner )
		{
			if ( this._owner )
			if ( !this._owner._is_being_removed )
			{
				this._owner.DamageWithEffect( this._damage, null, false, false );

				if ( this._custom_target_reaction )
				this._custom_target_reaction( this, this._owner );

				this._damage = 0;
			}
		}

		// Cleanup
		this._last_target = null;
		this._owner = null;
		this._owner2 = null;
		this._penetrated_list = null;
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return null; // Adapting to new way of working - nothing is ignored
		//return this._bouncy ? null : ( this.is_grenade ? [ 'sdCharacter' ] : [ 'sdCharacter', 'sdTurret', 'sdHover', 'sdEnemyMech' , 'sdCube', 'sdAsp', 'sdJunk', 'sdRift', 'sdDrone', 'sdLifeBox' ] );
	}
	get bounce_intensity()
	{ return this._bouncy ? 0.8 : ( this.is_grenade ? 0.55 : 0.3 ); } // 0.3 not felt right for grenades

	get friction_remain()
	{ return this._bouncy ? 0.8 : ( this.is_grenade ? 0.8 : 0.3 ); }

	IsFrictionTimeScaled() // Whether morph or just multiply
	{
		return this.is_grenade ? true : false;
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		//if ( !this._speculative )
		return;
	
		if ( this.model === 'flare' )
		return;

		dmg = Math.abs( dmg );

		let was_alive = this._hea > 0;

		this._hea -= dmg;

		if ( this._hea <= 0 && was_alive )
		{
			this.remove();
		}
	}

	static IsTrapShieldIgonred( owner_ent, trap_shield_block )
	{
		return sdWorld.inDist2D_Boolean( owner_ent.x, owner_ent.y, trap_shield_block.x + trap_shield_block.width/2, trap_shield_block.y + trap_shield_block.height/2, 32 );
	}

	RegularCollisionFiltering( from_entity )
	{
		//if ( from_entity.is( sdWorld.entity_classes.sdFaceCrab ) )
		//debugger;

		if ( this._hook )
		{
			if ( from_entity.is( sdGun ) )
			{
				let known_class = sdGun.classes[ from_entity.class ];
				if ( known_class )
				if ( known_class.unhookable )
				return false;
			}
		}
		
		if ( !sdWorld.is_server )
		{
			// Speculatively ignore collisions between groups of grenades fired at the same time
			if ( from_entity.is( sdBullet ) )
			if ( this._creation_time === from_entity._creation_time )
			{
				return false;
			}
		}

		if ( this._can_hit_owner )
		{
		}
		else
		{
			if ( from_entity === this._owner || from_entity === this._owner2 || ( !this._hook && this._damage >= 0 && from_entity.is( sdBadDog ) && from_entity.master && ( this._owner === from_entity.master || this._owner2 === from_entity.master ) ) )
			return false;

			if ( from_entity.is( sdBullet ) )
			{
				if ( this._owner )
				if ( this._owner === from_entity._owner )
				return false;

				if ( this._owner2 )
				if ( this._owner2 === from_entity._owner2 )
				return false;

				if ( !this._hittable_by_bullets || !from_entity._hittable_by_bullets )
				return false;
			}


			// Generally not having hitpoints and being included in GetIgnoredEntityClasses is enough for bullets to ignore something. But watch out for throwable swords at sdGun at movement in range method

			if ( from_entity.is( sdBlock ) && from_entity.material === sdBlock.MATERIAL_TRAPSHIELD )
			if ( this._owner === null || ( ( !this._owner._key_states || !this._owner._key_states.GetKey( 'ShiftLeft' ) ) && sdBullet.IsTrapShieldIgonred( this._owner, from_entity ) ) )
			{
				return false;
			}
		}

		if ( this.sticky_target === from_entity )
		return false;
		
		if ( from_entity.is( sdBlock ) && from_entity._merged )
		return false;

		if ( this._admin_picker )
		return from_entity.IsHittableWithAdminTools();

		if ( from_entity.is( sdRift ) ) // Ignore portals
		return false;

		if ( from_entity.is( sdBubbleShield ) && ( this._owner === from_entity.for_ent || from_entity.hea <= 0 ) ) // Ignore shields from owner, or if they are depleted
		return false;

		if ( from_entity.is( sdWater ) ) // Ignore water
		return false;

		if ( !from_entity.PrecieseHitDetection( this.x, this.y, this ) )
		return false;
	
		/*if ( from_entity.is( sdBullet ) )
		if ( from_entity._owner === this._owner )
		if ( from_entity._creation_time === this._creation_time )
		{
			debugger;
			return false;
		}*/

		if ( this._extra_filtering_method )
		return this._extra_filtering_method( from_entity, this );

		return true;
	}

	BouncyCollisionFiltering( from_entity ) // Without this logic bullets will stuck in initiator on spawn. Though GetIgnoredEntityClasses will implement simpler logic which could work more efficient for normal cases
	{
		if ( from_entity === this._owner || from_entity === this._owner2 )
		return false;

		if ( !this.RegularCollisionFiltering( from_entity ) )
		return false;

		if ( this._owner === from_entity )
		return false;

		if ( this._owner2 === from_entity )
		return false;

		if ( this._extra_filtering_method )
		return this._extra_filtering_method( from_entity, this );

		return true;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		this.GetAnythingNearCache; // Some projectiles might use this method - mentioning it here just so cache properties will be created and crash would not happen

		if ( this._first_frame )
		{
			if ( this.color )
			if ( this.color.indexOf(' ') !== -1 )
			debugger;


			this._first_frame = false;
		}

		let GSPEED_to_solve = GSPEED;

		// Sub-step precision to time_left
		if ( this.time_left < GSPEED )
		GSPEED = Math.max( this.time_left + 0.000001, 0.01 );
		//GSPEED = Math.max( this.time_left - 0.001, 0.01 );
		else
		GSPEED = GSPEED_to_solve;

		while ( GSPEED_to_solve > 0 )
		{
			GSPEED_to_solve -= GSPEED;

			if ( this.ac > 0 )
			{
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.93, GSPEED );
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.93, GSPEED );

				if ( this._homing && this._owner )
				{
					let invert = ( this._owner.IsPlayerClass() && this._owner._key_states.GetKey( 'Mouse3' ) ? -1 : 1 ); // Repel missiles via right-click
					let di_targ = sdWorld.Dist2D_Vector( this._owner.look_x - this.x, this._owner.look_y - this.y );
					let xx = invert * ( this._owner.look_x - this.x ) - this.sx * di_targ / 15;
					let yy = invert * ( this._owner.look_y - this.y ) - this.sy * di_targ / 15;

					let di = sdWorld.Dist2D_Vector( xx, yy );
					if ( di > 0.01 )
					{
						this.acx = sdWorld.MorphWithTimeScale( this.acx, xx / di * 50, 1 - this._homing_mult, GSPEED );
						this.acy = sdWorld.MorphWithTimeScale( this.acy, yy / di * 50, 1 - this._homing_mult, GSPEED );
						
					}
				}

				this.sx += this.acx * GSPEED * this.ac * 1;
				this.sy += this.acy * GSPEED * this.ac * 1;
			}
			
			if ( this.model === 'flare' )
			{
				this.sx = this.sx * 0.95;
				this.sy = this.sy * 0.95;
			}


			if ( this.is_grenade || this._affected_by_gravity )
			{
				this.sy += sdWorld.gravity * GSPEED * this.gravity_scale;

				this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, this.RegularCollisionFiltering );
			}
			else
			{
				if ( this.penetrating || this._rail )
				{
					// Old penetration logic is now handled by GetCollisionMode()
					//this.x += this.sx * GSPEED;
					//this.y += this.sy * GSPEED;

					this.ApplyVelocityAndCollisions( GSPEED, 0, false, 0, null );
				}
				else
				{
					let vel = this.sx * this.sx + this.sy * this.sy;
					let old_sx = this.sx;
					let old_sy = this.sy;

					sdWorld.last_hit_entity = null;

					this.ApplyVelocityAndCollisions( GSPEED, 0, true, 0, this._bouncy ? this.BouncyCollisionFiltering : this.RegularCollisionFiltering );

					let vel2 = this.sx * this.sx + this.sy * this.sy;

					if ( !this._bouncy )
					if ( vel2 < vel )
					if ( this.sx !== old_sx || this.sy !== old_sy )
					{
						vel = Math.sqrt( vel );
						vel2 = Math.sqrt( vel2 );

						//trace( sdWorld.Dist2D_Vector( this.sx / vel2 - old_sx / vel, this.sy / vel2 - old_sy / vel ) );

						//if ( vel2 < vel * 0.5 )
						//if ( sdWorld.Dist2D_Vector( this.sx / vel2 - old_sx / vel, this.sy / vel2 - old_sy / vel ) > 0.8 )
						if ( sdWorld.Dist2D_Vector_pow2( this.sx / vel2 - old_sx / vel, this.sy / vel2 - old_sy / vel ) > 0.8 * 0.8 )
						{
							this.RemoveBullet();
						
							return true;
						}

						if ( vel > 0.001 )
						this._damage = this._damage / vel * vel2;

						if ( !sdWorld.is_server )
						if ( sdWorld.last_hit_entity === null || ( !this.CanBounceOff( sdWorld.last_hit_entity ) && !this.WillRailPenetrate( sdWorld.last_hit_entity ) ) )
						{
							this.RemoveBullet();
						
							return true;
						}
					}
				}

				if ( this.y > sdWorld.world_bounds.y2 )
				{
					if ( !this._wave )
					sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });
				
					this.RemoveBullet();
				
					return;
				}
			}

			if ( this._custom_extra_think_logic )
			if ( this._custom_extra_think_logic( this, GSPEED ) )
			{
				if ( this.model !== 'flare' || this.model !== 'stalker_target' )
				this.RemoveBullet();
			
				return;
			}

			this.time_left -= GSPEED;
			if ( this.time_left <= 0 )
			{
				if ( this.model === 'flare' ) // If it's a "flare", this is where it calls the "Spawn squad" Function
				this.SpawnFlareSquad();
				
				if ( this._hook )
				{
					this._last_target = null;
					//this._hook = false;
				}

				this.RemoveBullet();
			
				return;
			}

			if ( this._is_being_removed )
			return;
		}

		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( sdBullet.images_with_smoke[ this.model ] )
			{
				if ( this._smoke_spawn_wish > 0 )
				this._smoke_spawn_wish -= GSPEED;
			
				if ( this._smoke_spawn_wish <= 0 )
				{
					let colors = [ '#777777', '#666666', '#555555' ]
					let ent = new sdEffect({ x: this.x, y: this.y, sy:-1, type:sdEffect.TYPE_SMOKE, color:sdEffect.GetSmokeColor( colors )});
					sdEntity.entities.push( ent );
					
					this._smoke_spawn_wish = 0.5;
				}
			}
		}
		
		if ( sdWorld.is_server )
		if ( this.model === 'stalker_target' )
		{
			if ( !this._for_ai_target || this._for_ai_target._is_being_removed )
			this.RemoveBullet();
		
			if ( this._for_ai_target )
			if ( this._for_ai_target.is( sdCharacter ) && this._for_ai_target._ai_enabled )
			if ( !this._for_ai_target._ai_force_fire )
			{
				if ( this._for_ai_target._ai )
				this._for_ai_target._ai.target = this;
			}
		}	
		
		if ( this.sticky_target )
		{
			if ( this.sticky_target._is_being_removed || !sdWorld.inDist2D_Boolean( this.x, this.y, this.sticky_target.x + this.sticky_relative_x, this.sticky_target.y + this.sticky_relative_y, 100 ) )
			{
				this.sticky_target = null;
				
				if ( this.time_left > 0 )
				this.time_left = 0;
			}
			else
			{
				this.x = this.sticky_target.x + this.sticky_relative_x;
				this.y = this.sticky_target.y + this.sticky_relative_y;
				this.sx = (this.sticky_target.sx||0);
				this.sy = (this.sticky_target.sy||0);
			}
		}
	}

	CanBounceOff( from_entity )
	{
		if ( this._bouncy )
		return true;
	
		if ( this.model === 'flare' || this.model === 'stalker_target' )
		return true;

		if ( this.explosion_radius > 0 )
		return false;

		if ( !this._wave )
		if ( !this._rail )
		if ( !this._hook )
		if ( this._damage > 0 )
		{
			if ( this.penetrating )
			return ( from_entity.is( sdBlock ) && from_entity._shielded === null /*&& this._reinforced_level >= from_entity._reinforced_level*/) || from_entity.is( sdAntigravity ) || ( from_entity.is( sdDoor ) && from_entity._shielded === null /*&& this._reinforced_level >= from_entity._reinforced_level*/ );
			else
			return ( from_entity.is( sdBlock ) && from_entity.material === sdBlock.MATERIAL_WALL ) || from_entity.is( sdAntigravity ) || from_entity.is( sdDoor );
		}

		return false;
	}
	
	WillRailPenetrate( from_entity )
	{
		if ( !this.penetrating || !this._rail )
		return false;
	
		if ( this._damage > 5 ) // Larger damage threshold since it can penetrate way better 
		{
			if ( from_entity.is( sdBlock ) || from_entity.is( sdDoor ) )
			return ( from_entity._shielded === null ); // Disallow shielded units to be penetrated
			
			return true;
		}
		
		return false;	
	}

	GetCollisionMode()
	{
		if ( this.is_grenade )
		return sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION;
		else
		{
			if ( this.penetrating || this._rail )
			return sdEntity.COLLISION_MODE_ONLY_CALL_TOUCH_EVENTS;
			else
			return sdEntity.COLLISION_MODE_BOUNCE_AND_FRICTION;
		}
	}

	GetCriticalHitMult() // renamed from PointBlank to CriticalHit to make it easy to find in the future - Ghost581
	{
		if ( this._critical_hit_mult !== 0 )
		{
			let di = sdWorld.Dist2D( this._start_x, this._start_y, this.x, this.y );
			if ( di < this._critical_hit_range ) // 24 - A dirt block and a half // 16 = 1 dirt block
			return ( 1 + this._critical_hit_mult ); // Multiply by normal critical hit value
			else
			if ( di < this._weak_critical_hit_range ) // 48 - 3 dirt blocks
			return ( 1 + ( this._critical_hit_mult / 2 ) ); // Multiply by half of critical hit value
		}

		// If it's point blank multiplier is 0, or is outside bonus damage range, default the multiplier
		return 1;
	}

	onMovementInRange( from_entity )
	{
		/*if ( this._hook )
		if ( from_entity._class === 'sdCharacter' || from_entity._class === 'sdGun' )
		debugger;*/
		if ( this.model === 'flare' || this.model === 'stalker_target' ) // Flares should not deal damage
		return;
	
		if ( from_entity.is( sdBlock ) && from_entity._merged )
		{
			// Essentially the blocks split themselves, returning an array of the new spawned blocks
			let ents = from_entity.UnmergeBlocks();
			if ( ents.length > 0 ) 
			{
				// And we need to determine which block to damage, which is the closest one.
				let closest = sdWorld.Dist2D( this.x, this.y, ents[ 0 ].x + ( ents[ 0 ].width / 2 ), ents[ 0 ].y + ( ents[ 0 ].height / 2 ) );
				from_entity = ents[ 0 ];
				for ( let i = 0; i < ents.length; i++ )
				{
					let distance = sdWorld.Dist2D( this.x, this.y, ents[ i ].x + ( ents[ i ].width / 2 ), ents[ i ].y + ( ents[ i ].height / 2 ) );
					if ( distance < closest )
					{
						closest = distance;
						from_entity = ents[ i ];
					}
				}
			}
			else
			return;
		}
		// BG shooting works normally even without this, so disabled for now.
		/*if ( this._bg_shooter && !this._bouncy && from_entity._is_bg_entity === 1 )
		{
			// Essentially the backgrounds split themselves, returning an array of the new spawned backgrounds
			let ents = from_entity.UnmergeBackgrounds();
			if ( ents.length > 0 ) 
			{
				// And we need to determine which block to damage, which is the closest one.
				let closest = sdWorld.Dist2D( this.x, this.y, ents[ 0 ].x + ( ents[ 0 ].width / 2 ), ents[ 0 ].y + ( ents[ 0 ].height / 2 ) );
				from_entity = ents[ 0 ];
				for ( let i = 0; i < ents.length; i++ )
				{
					let distance = sdWorld.Dist2D( this.x, this.y, ents[ i ].x + ( ents[ i ].width / 2 ), ents[ i ].y + ( ents[ i ].height / 2 ) );
					if ( distance < closest )
					{
						closest = distance;
						from_entity = ents[ i ];
					}
				}
			}
			else
			return;
		}*/
		
		if ( this._last_target === from_entity )
		return; // Prevent bouncing bullets to deal multiple damage when they stuck in something?

		if ( !from_entity.PrecieseHitDetection( this.x, this.y, this ) )
		return;

		if ( !this._hook && !this._admin_picker )
		{
			if ( from_entity.is( sdGun ) )
			return;
		}


		// Moved it up because this logic prevents shotgun projectiles from reacting to each other
		if ( !this.RegularCollisionFiltering( from_entity ) )
		return;
	
		if ( this._custom_post_bounce_reaction )
		this._custom_post_bounce_reaction( this, 0, from_entity );

		//if ( !this.RegularCollisionFiltering( from_entity ) )
		//return;
	

		if ( this._custom_target_reaction_before_damage_tests )
		this._custom_target_reaction_before_damage_tests( this, from_entity );


		if ( (
				this._owner !== from_entity && ( !this._owner || !this._owner._owner || this._owner._owner !== from_entity ) &&
				this._owner2 !== from_entity

			 ) || this._can_hit_owner ) // 2nd rule is for turret bullet to not hit turret owner
		{
			if ( from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD || from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN || from_entity.IsPlayerClass() )
			//if ( from_entity.GetClass() === 'sdCharacter' ||
			//	 from_entity.GetClass() === 'sdVirus' )
			{
				if ( from_entity.IsTargetable( this, !this._hook ) ) // Ignore safe areas only if not a hook
				if ( !sdWorld.server_config.GetHitAllowed || sdWorld.server_config.GetHitAllowed( this, from_entity ) )
				if ( this._damage < 0 || !this._owner || !from_entity.IsPlayerClass() || !this._owner.IsPlayerClass() || from_entity.cc_id === 0 || from_entity.cc_id !== this._owner.cc_id || from_entity === this._owner )
				{
					if ( sdWorld.is_server ) // Or else fake self-knock
					{
						let damaged = true;
						
						if ( this._damage !== 0 )
						{
							let limb_mult = from_entity.GetHitDamageMultiplier( this.x, this.y );

							let critical_hit_mult = this.GetCriticalHitMult();

							let dmg = limb_mult * critical_hit_mult * this._damage;


							let old_hea = ( from_entity.hea || from_entity._hea || 0 );

							// Play effects no matter if target was damaged - it would look better this way
							if ( !this._wave )
							{
								//if ( this.explosion_radius <= 0 )
								//if ( this.color !== 'transparent' )
								//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_GLOW_HIT, color:this.color });

								if ( this._damage > 1 )
								if ( from_entity._last_hit_time !== sdWorld.time ) // Prevent flood from splash damage bullets
								{
									from_entity._last_hit_time = sdWorld.time;
									sdSound.PlaySound({ name:'player_hit3', x:this.x, y:this.y, volume:0.5 });
								}

								if ( !this._soft )
								{
									from_entity.PlayDamageEffect( this.x, this.y, ( limb_mult === 1 ? 1 : 1.65 ) );
									//sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter(), scale:( limb_mult === 1 ? 1 : 1.65 ) });
								}
							}

							damaged = from_entity.DamageWithEffect( dmg, this._owner, limb_mult !== 1 );

							if ( damaged )
							{
								// Limit knock_scale so high damage, high recoil weapons don't toss around high mass objects
								if ( this._knock_scale * dmg > 60 ) // If I remember correctly setr drones have max knockback which is 20 damage x 3 scale
								this._knock_scale = 60 / dmg;
								// Some entities need to inherit impact velocity on damage so it is higher now
								if ( from_entity._god && from_entity._socket )
								{
									// Do not throw arround developers who are testing something
								}
								else
								from_entity.Impulse( this.sx * Math.abs( this._damage ) * this._knock_scale,
													 this.sy * Math.abs( this._damage ) * this._knock_scale );

								if ( typeof from_entity.sx !== 'undefined' )
								from_entity.SafeAddVelocity( 0, 0 ); // Will only verify, without adding anything

								if ( this._temperature_addition !== 0 ) // Is this an incediary bullet?
								from_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t:this._temperature_addition, initiator: this._owner }); // Set enemy on fire

								if ( this._owner )
								if ( old_hea > 0 )
								if ( old_hea !== ( from_entity.hea || from_entity._hea || 0 ) ) // Any damage actually dealt
								{
									if ( from_entity.IsPlayerClass() && !sdCube.IsTargetFriendly( from_entity ) )
									{
										if ( typeof this._owner._player_damage !== 'undefined' )
										this._owner._player_damage += dmg;
									}
									else
									{
										if ( typeof this._owner._nature_damage !== 'undefined' )
										this._owner._nature_damage += dmg;
									}
								}

							}
							
							if ( from_entity.is( sdCharacter ) )
							{
								if ( from_entity._god && from_entity._socket )
								{
								}
								else
								sdWorld.SendEffect({ 
									t: from_entity._net_id,
									x: Math.round( this.x - from_entity.x ), 
									y: Math.round( this.y - from_entity.y ), 
									sx: Math.round( this.sx * Math.abs( this._damage ) * this._knock_scale ), 
									sy: Math.round( this.sy * Math.abs( this._damage ) * this._knock_scale ) 
								}, 'P' );
							}

							if ( this._bouncy )
							this._damage *= 0.8;
							else
							this._damage = 0; // for healguns
						}

						if ( damaged ) // It is false if target is in safe zone
						if ( this._custom_target_reaction )
						this._custom_target_reaction( this, from_entity );
					}

					this._last_target = from_entity;

					if ( this._detonate_on_impact )
					if ( this._damage === 0 || !sdWorld.is_server )
					{
						if ( this.model !== 'flare' || this.model !== 'stalker_target' )
						this.RemoveBullet();
					
						return;
					}
				}
			}
			else
			{
				if ( sdWorld.server_config.GetHitAllowed && !sdWorld.server_config.GetHitAllowed( this, from_entity ) )
				this._damage = 0;
				if ( this.is_grenade || this.model === 'flare' || this.model === 'stalker_target' )
				{
					// Maybe more filtering logic had to be here
					if ( this._custom_target_reaction_protected )
					if ( from_entity._is_bg_entity === 0 )
					if ( from_entity.IsTargetable( this, !this._hook ) )
					this._custom_target_reaction_protected( this, from_entity );
				}
				else
				//if ( typeof from_entity.hea !== 'undefined' || typeof from_entity._hea !== 'undefined' || ( this._bg_shooter && !this._bouncy && from_entity.GetClass() === 'sdBG' ) || ( this._admin_picker && ( this._bg_shooter || from_entity.GetClass() !== 'sdBG' ) ) )
				//if ( typeof from_entity.hea !== 'undefined' || typeof from_entity._hea !== 'undefined' || ( this._bg_shooter && !this._bouncy && from_entity._is_bg_entity === 1 ) || ( this._admin_picker && ( this._bg_shooter || from_entity._is_bg_entity !== 1 ) ) )
				if (
						( from_entity._is_bg_entity === 0 && ( typeof from_entity.hea !== 'undefined' || typeof from_entity._hea !== 'undefined' ) ) ||
						( this._bg_shooter && !this._bouncy && from_entity._is_bg_entity === 1 ) ||
						( this._admin_picker && ( this._bg_shooter || from_entity._is_bg_entity !== 1 ) && from_entity._is_bg_entity !== 8 ) ) // 8 is blood decal
				if ( from_entity.IsTargetable( this, !this._hook ) ) // Ignore safe areas only if not a hook
				{
					let will_bounce = false;
					//let dmg_mult = 1;


					if ( this.CanBounceOff( from_entity ) || ( this._rail && this.WillRailPenetrate( from_entity ) ) ) // Allow some rails to penetrate
					{
						if ( this.penetrating )
						{
							if ( this._penetrated_list.indexOf( from_entity ) === -1 )
							this._penetrated_list.unshift( from_entity );
							else
							{
								return; // Ignore collision
							}
						}

						//dmg_mult = 0.65;
						will_bounce = true;
					}

					if ( this._damage !== 0 )
					{
						let target_protected = false;

						if ( sdWorld.is_server ) // Or else fake self-knock
						{
							if ( !this._wave )
							{
								//if ( this.explosion_radius <= 0 )
								//if ( this.color !== 'transparent' )
								//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_GLOW_HIT, color:this.color });

								if ( this._soft )
								{
									sdSound.PlaySound({ name:'player_step', x:this.x, y:this.y, volume:0.5, pitch:1.8 });
								}
							}

							//if ( ( typeof from_entity._armor_protection_level === 'undefined' || this._armor_penetration_level >= from_entity._armor_protection_level ) &&
							//	 ( typeof from_entity._reinforced_level === 'undefined' || this._reinforced_level >= from_entity._reinforced_level ) /*&&
							//		 ( typeof from_entity._shielded === 'undefined' || from_entity._shielded === null )*/ )

							if ( ( typeof from_entity._armor_protection_level === 'undefined' || this._armor_penetration_level >= from_entity._armor_protection_level ) /*&&
								 ( typeof from_entity._reinforced_level === 'undefined' || this._reinforced_level >= from_entity._reinforced_level ) &&
									 ( typeof from_entity._shielded === 'undefined' || from_entity._shielded === null )*/ )
							{
								let limb_mult = from_entity.GetHitDamageMultiplier( this.x, this.y );

								let critical_hit_mult = this.GetCriticalHitMult();
								
								let eff = ( limb_mult === 1 ? from_entity.GetBleedEffect() : from_entity.GetBleedEffectDamageMultiplier() );

								let dmg = this._damage * critical_hit_mult;// * dmg_mult;


								/*if ( this.ac > 0 )
								{
									dmg *= from_entity.GetRocketDamageScale();
								}*/
								// Limit knock_scale so high damage, high recoil weapons don't toss around high mass objects
								if ( this._knock_scale * dmg > 60 ) // If I remember correctly setr drones have max knockback which is 20 damage x 3 scale
								this._knock_scale = 60 / dmg;
								// Some entities need to inherit impact velocity on damage so it is higher now
								from_entity.Impulse( this.sx * Math.abs( dmg ) * this._knock_scale,
													 this.sy * Math.abs( dmg ) * this._knock_scale );

								if ( typeof from_entity.sx !== 'undefined' )
								from_entity.SafeAddVelocity( 0, 0 ); // Will only verify, without adding anything

								let old_hea = ( from_entity.hea || from_entity._hea || 0 );

								dmg *= limb_mult;




								let base_damage = dmg;

								//from_entity.DamageWithEffect( dmg, this._owner );


								/*if ( from_entity.GetClass() === 'sdLifeBox' ) This logic is moved to sdLifeBox.prototype.GetHitDamageMultiplier
								if ( from_entity.driver0 )
								if ( this.y <= from_entity.y )
								from_entity.DamageWithEffect( dmg, this._owner, true );*/

								//if ( from_entity.GetClass() === 'sdTurret' && this._emp === true ) // Disable turrets if they're hit by an EMP bullet
								if ( from_entity.is( sdTurret ) && this._emp === true ) // Disable turrets if they're hit by an EMP bullet
								{
									from_entity.disabled = true;
									from_entity._disabled_timeout = 150 * this._emp_mult;
								}

								//if ( from_entity.GetClass() === 'sdLifeBox' )
								if ( this._detonate_on_impact )
								if ( from_entity.is( sdLifeBox ) )
								if ( this._bouncy && !this.is_grenade && this.model !== 'flare' && this.model !== 'stalker_target' )
								{
									this.RemoveBullet(); // Prevent falkonian PSI cutter oneshotting lifebox
								}

								if ( from_entity.is( sdBlock ) && (
										from_entity.DoesRegenerate() ) ) // Dirt damage bonus multiplier (relative to initial damage)
								dmg += base_damage * this._dirt_mult;
								//from_entity.DamageWithEffect( dmg * this._dirt_mult, this._owner );

								if ( from_entity.IsVehicle() && ( typeof from_entity.sx !== 'undefined' && typeof from_entity.sy !== 'undefined' ) ) // All vehicles except for static ones like sdLifeBox
								dmg += base_damage * this._vehicle_mult;
								//from_entity.DamageWithEffect( dmg * this._vehicle_mult, this._owner );

								if ( from_entity.is( sdBlock ) && from_entity.material === sdBlock.MATERIAL_TRAPSHIELD ) // Shield block damage bonus multiplier (relative to initial damage)
								dmg += base_damage * this._shield_block_mult;
								//from_entity.DamageWithEffect( dmg * this._shield_block_mult, this._owner );

								from_entity.DamageWithEffect( dmg, this._owner, limb_mult > 1 );

								if ( this._temperature_addition !== 0 ) // Is this an incediary bullet?
								from_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t:this._temperature_addition, initiator: this._owner }); // Set enemy on fire

								if ( this._owner )
								if ( old_hea > 0 )
								if ( old_hea !== ( from_entity.hea || from_entity._hea || 0 ) ) // Any damage actually dealt
								{
									//if ( from_entity.GetClass() === 'sdCube' || from_entity.GetClass() === 'sdCrystal' )
									//if ( from_entity.is( sdCube ) || from_entity.is( sdCrystal ) )
									if ( from_entity.is( sdCrystal ) )
									if ( typeof this._owner._nature_damage !== 'undefined' )
									this._owner._nature_damage += dmg;
								}
								
								

								if ( !this._wave )
								{
									if ( !this._soft )
									{
										let partial_damage = false;
										
										if ( dmg > 0 )
										if ( old_hea - ( from_entity.hea || from_entity._hea || 0 ) < dmg * 0.99 )
										partial_damage = true;
										
										if ( eff === sdEffect.TYPE_SHIELD || partial_damage )
										{
											let dist_x1 = Math.abs( from_entity.x + from_entity._hitbox_x1 - this.x );
											let dist_x2 = Math.abs( from_entity.x + from_entity._hitbox_x2 - this.x );
											let dist_y1 = Math.abs( from_entity.y + from_entity._hitbox_y1 - this.y );
											let dist_y2 = Math.abs( from_entity.y + from_entity._hitbox_y2 - this.y );
											
											let xx = this.x;
											let yy = this.y;
											let r = 0;
											
											if ( Math.min( dist_x1, dist_x2 ) < Math.min( dist_y1, dist_y2 ) )
											{
												if ( dist_x1 < dist_x2 )
												{
													xx = from_entity.x + from_entity._hitbox_x1;
													r = - Math.PI / 2;
												}
												else
												{
													xx = from_entity.x + from_entity._hitbox_x2;
													r = Math.PI / 2;
												}
											}
											else
											{
												if ( dist_y1 < dist_y2 )
												yy = from_entity.y + from_entity._hitbox_y1;
												else
												yy = from_entity.y + from_entity._hitbox_y2;
											}
											
											sdWorld.SendEffect({ 
												x:xx, 
												y:yy, 
												type:sdEffect.TYPE_SHIELD,
												rotation: r });
										}
										
										if ( eff !== sdEffect.TYPE_SHIELD )
										sdWorld.SendEffect({ 
											x:this.x, 
											y:this.y, 
											type:eff });
									}
								}
							}
							else
							{
								//if ( this.penetrating )
								//will_bounce = false;

								target_protected = true;

								if ( !this._wave )
								{
									if ( !this._soft )
									sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });

									sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });

									if ( this._owner )
									if ( this._owner.IsPlayerClass() )
									{
										if ( this._owner._last_damage_upg_complain < sdWorld.time - 1000 * 10 )
										{
											this._owner._last_damage_upg_complain = sdWorld.time;

											/*if ( from_entity._shielded !== null )
											{
												if ( Math.random() < 0.5 )
												this._owner.Say( 'This entity is protected by a base shielding unit' );
												else
												this._owner.Say( 'A base shielding unit is protecting this' );
											}
											else
											if ( from_entity._reinforced_level > 0 )
											{
												if ( Math.random() < 0.5 )
												this._owner.Say( 'I could do with a Deconstructor Hammer' );
												else
												this._owner.Say( 'I need a Deconstructor Hammer to damage this' );
											}
											else*/
											{
												if ( from_entity._armor_protection_level > 3 )
												this._owner.Say( 'Regular weapons won\'t work here. What about big explosions?' );
												else
												{
													if ( Math.random() < 0.5 )
													this._owner.Say( 'Can\'t damage that' );
													else
													this._owner.Say( 'I need damage upgrade' );
												}
											}
										}
									}
								}
							}
						}

						//this._damage *= ( 1 - dmg_mult ); // for healguns it is important to be at 0

						if ( !will_bounce )
						this._damage = 0; // for healguns it is important to be at 0
						else
						if ( this.penetrating )
						{
							this._damage *= 0.5;
							this.sx *= this._rail ? 0.95 : 0.5;
							this.sy *= this._rail ? 0.95 : 0.5;

							//console.log( 'vel = '+sdWorld.Dist2D_Vector( this.sx, this.sy ) );

							if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 10 )
							this._damage = 0;
						}

						if ( target_protected )
						{
							if ( this._custom_target_reaction_protected )
							this._custom_target_reaction_protected( this, from_entity );
						}
						else
						{
							if ( this._custom_target_reaction )
							this._custom_target_reaction( this, from_entity );
						}
					}
					else
					{
						if ( this._custom_target_reaction_protected )
						this._custom_target_reaction_protected( this, from_entity );
					}

					//if ( will_bounce ) Bounce is done at bullet logic now, naturally
					/*if ( dmg_mult !== 1 )
					{
						this.sx *= ( 1 - dmg_mult );
						this.sy *= ( 1 - dmg_mult );
					}*/

					this._last_target = from_entity;

					if ( this._detonate_on_impact )
					if ( this._damage === 0 )
					{
						//this._last_target = from_entity;
						this.RemoveBullet();
					}
					return;
				}
			}
		}
	}
	get title()
	{
		return 'Projectile';
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		if ( this.sy !== 0 || this.sx !== 0 || this.is_grenade || this.sticky_target || this.model === 'flare' )
		{
			if ( this.model )
			{
				//if ( this.model !== 'flare' )
				if ( sdBullet.images_with_no_velocity_rotation[ this.model ] !== 1 )
				ctx.rotate( Math.atan2( this.sy, this.sx ) );

				if ( !sdBullet.images[ this.model ] )
				sdBullet.images[ this.model ] = sdWorld.CreateImageFromFile( this.model );

				if ( this.model_size === 1 )
				ctx.drawImageFilterCache( sdBullet.images[ this.model ], - 32, - 16, 64,32 ); // used for 64 by 32 sprites

				if ( this.model_size === 2 )
				ctx.drawImageFilterCache( sdBullet.images[ this.model ], - 32, - 32, 64,64 ); // used for 64 by 64 sprites

				if ( this.model_size === 3 )
				ctx.drawImageFilterCache( sdBullet.images[ this.model ], - 48, - 48, 96,96 ); // used for 96 by 96 sprites

				if ( this.model === 'flare' )
				{
					if ( this._sd_tint_filter === null )
					{
						this._sd_tint_filter = sdWorld.hexToRgb( this.color );
						if ( this._sd_tint_filter )
						{
							this._sd_tint_filter[ 0 ] /= 255;
							this._sd_tint_filter[ 1 ] /= 255;
							this._sd_tint_filter[ 2 ] /= 255;

							this._sd_tint_filter[ 0 ] += 0.2;
							this._sd_tint_filter[ 1 ] += 0.2;
							this._sd_tint_filter[ 2 ] += 0.2;

							this._sd_tint_filter[ 0 ] *= 1.5;
							this._sd_tint_filter[ 1 ] *= 1.5;
							this._sd_tint_filter[ 2 ] *= 1.5;
						}
					}
					ctx.blend_mode = THREE.AdditiveBlending;
					{
						ctx.sd_tint_filter = this._sd_tint_filter;
						//let dist_travelled = sdWorld.Dist2D( this._start_x, this._start_y, this.x, this.y );
						//ctx.scale( 1 * dist_travelled / 32, 0.5 );
						ctx.drawImageFilterCache( sdBullet.images[ this.model ], -16, - 16, 32, 32 );
						ctx.sd_tint_filter = null;
					}
				}

				if ( this.model !== 'flare' )
				ctx.drawImageFilterCache( sdBullet.images[ this.model ], - 16, - 16, 32, 32 );

				ctx.sd_tint_filter = null;
				ctx.blend_mode = THREE.NormalBlending;
			}
			else
			{

				/*ctx.rotate( Math.atan2( this.sy, this.sx ) + Math.PI / 2 );

				let vel = Math.sqrt( this.sx * this.sx + this.sy * this.sy ) * 0.7;

				ctx.fillStyle = this.color;
				ctx.globalAlpha = 1;
				ctx.fillRect( -0.5, -vel/2, 1, vel );*/

				if ( this._sd_tint_filter === null )
				{
					this._sd_tint_filter = sdWorld.hexToRgb( this.color );
					if ( this._sd_tint_filter )
					{
						this._sd_tint_filter[ 0 ] /= 255;
						this._sd_tint_filter[ 1 ] /= 255;
						this._sd_tint_filter[ 2 ] /= 255;

						this._sd_tint_filter[ 0 ] += 0.2;
						this._sd_tint_filter[ 1 ] += 0.2;
						this._sd_tint_filter[ 2 ] += 0.2;

						this._sd_tint_filter[ 0 ] *= 1.5;
						this._sd_tint_filter[ 1 ] *= 1.5;
						this._sd_tint_filter[ 2 ] *= 1.5;
					}
				}

				ctx.blend_mode = THREE.AdditiveBlending;
				{
					ctx.sd_tint_filter = this._sd_tint_filter;

					ctx.rotate( Math.atan2( this.sy, this.sx ) );
					ctx.scale( 0.5, 0.5 );
					ctx.drawImageFilterCache( sdBullet.images[ 'bullet' ], - 22, - 5, 44,10 );

					ctx.sd_tint_filter = null;
				}
				ctx.blend_mode = THREE.NormalBlending;
			}
		}
		
		//ctx.apply_shading = true;
	}
}
//sdBullet.init_class();

export default sdBullet;

