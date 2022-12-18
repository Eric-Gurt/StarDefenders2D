/*

	Warning: Carrier needs to call .UpdateHeldPosition() on carried sdGuns or else they can appear at old positions logically, which will mean removal when world bounds move. Carried guns won't update their positions because they will hibernate once hidden

*/
/* global Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdStorage from './sdStorage.js';
import sdBlock from './sdBlock.js';
import sdCom from './sdCom.js';
import sdBG from './sdBG.js';
import sdArea from './sdArea.js';
import sdOctopus from './sdOctopus.js';
import sdRift from './sdRift.js';
import sdWeaponBench from './sdWeaponBench.js';

import sdGunClass from './sdGunClass.js';

import sdShop from '../client/sdShop.js';

// More like anything pickup-able
class sdGun extends sdEntity
{
	static init_class()
	{
		if ( !sdEffect.initiated )
		sdEffect.init_class();
		
		//sdGun.img_muzzle1 = sdWorld.CreateImageFromFile( 'muzzle1' );
		//sdGun.img_muzzle2 = sdWorld.CreateImageFromFile( 'muzzle2' );
		sdGun.img_muzzle_sheet = sdWorld.CreateImageFromFile( 'muzzle_sheet' );
		
		sdGun.img_present = sdWorld.CreateImageFromFile( 'present' );
		
		sdGun.disowned_guns_ttl = 30 * 60 * 2; // Was 1 minute before, 2 now
		
		sdGun.default_projectile_velocity = 20; // 16
		
		sdGun.tilt_scale = 200;
		
		/*
		
			Some basic SD2D weapon ideas:
		
				- Weapon cost is only exists to prevent new players from being strong enough to spawn deadly weapons (like grenades, sniper rifle);
		
				- Matter consumption is what defines weapons and should always be aligned to damage dealt, unless it exposes some unfair features.
		
		*/
		
		sdGun.default_vehicle_mult_bonus = 3; // Use this as base value and multiply it just so these can be scaled together
		
		sdGun.ignored_entity_classes_arr = [ 'sdCharacter', 'sdGun', 'sdPlayerDrone', 'sdPlayerOverlord' ];
		
		sdGun.classes = [];
		
		sdGunClass.init_class(); // Will populate sdGun.classes array

		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( this.class === sdGun.CLASS_CRYSTAL_SHARD ) ? -2 : ( this.class === sdGun.CLASS_BUILDTOOL_UPG ) ? -7 : -4; }
	get hitbox_x2() { return ( this.class === sdGun.CLASS_CRYSTAL_SHARD ) ? 2  : ( this.class === sdGun.CLASS_BUILDTOOL_UPG ) ? 7  : 4; }
	get hitbox_y1() { return ( this.class === sdGun.CLASS_CRYSTAL_SHARD ) ? 1  : ( this.class === sdGun.CLASS_BUILDTOOL_UPG ) ? -6 : -3; }
	get hitbox_y2() { return ( this.class === sdGun.CLASS_CRYSTAL_SHARD ) ? 4  : ( this.class === sdGun.CLASS_BUILDTOOL_UPG ) ? 5  : 3; }
	get mass()
	{
		return 30;
	}
	get bounce_intensity()
	{
		if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
		return 0.2 + Math.random() * 0.2;
	
		return 0;
	}
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 3 )
		{
			if ( !sdWorld.is_server )
			{
				if ( sdWorld.time > this._last_hit_sound )
				{
					if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
					sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch:2, volume: 0.15, _server_allowed:true });
					else
					sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.3, volume: Math.min( 0.25, 0.1 * vel ), _server_allowed:true });
				}
				
				this._last_hit_sound = sdWorld.time + 100;
			}
		}
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		this._hea -= dmg;
		if ( this._hea <= 0 )
		{
			if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
			this.remove();
		}
	}
	
	onMovementInRange( from_entity )
	{
		// Just so we don't have to apply extra accuracy for sdGun-s and sdCharacter-s when they are too far from connected players...
		if ( from_entity.IsPlayerClass() )
		{
			from_entity.onMovementInRange( this );
			
			if ( this._is_being_removed )
			return;
		}

		if ( this.dangerous )
		if ( sdWorld.is_server )
		{
			if ( from_entity.is( sdGun ) )
			return;
		
			if ( from_entity.is( sdBG ) )
			return;
		
			if ( from_entity.is( sdBullet ) )
			return;
		
			if ( from_entity.is( sdRift ) ) // Ignore portals
			return;
		
			const is_unknown = ( sdGun.classes[ this.class ] === undefined ); // Detect unknown weapons from LRT teleports
		
			if ( from_entity.IsBGEntity() === 0 || from_entity.IsBGEntity() === 1 )
			{
			}
			else
			if ( from_entity.IsBGEntity() === 2 )
			{
				if ( from_entity.is( sdArea ) )
				if ( from_entity.type === sdArea.TYPE_PREVENT_DAMAGE )
				{
					this.dangerous = false;
					this._dangerous_from = null;
					return;
				}
			}
			else
			{
				return;
			}
		
			
			let from_entity_ignored_classes = from_entity.GetIgnoredEntityClasses();
			if ( from_entity_ignored_classes )
			if ( from_entity_ignored_classes.indexOf( 'sdGun' ) !== -1 ) // Mostly it is here to prevent sword-sdArea reaction
			return;
	
			let from_entity_nonignored_classes = from_entity.GetNonIgnoredEntityClasses();
			if ( from_entity_nonignored_classes )
			if ( from_entity_nonignored_classes.indexOf( 'sdGun' ) === -1 ) // Mostly it is here to prevent sword-sdArea reaction
			return;
			
			//if ( from_entity.is( sdCharacter ) )
			if ( from_entity.IsPlayerClass() )
			{
				//if ( from_entity._ignored_guns.indexOf( this ) !== -1 || from_entity.driver_of !== null )
				if ( from_entity.IsGunIgnored( this, true ) || from_entity.driver_of !== null )
				return;
			}
			
			if ( !sdArea.CheckPointDamageAllowed( from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2, from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2 ) )
			{
				this.dangerous = false;
				this._dangerous_from = null;
				return;
			}
			
			if ( !is_unknown )
			if ( !sdWorld.server_config.GetHitAllowed || sdWorld.server_config.GetHitAllowed( this, from_entity ) )
			if ( !this._dangerous_from || !from_entity.IsPlayerClass() || !this._dangerous_from.IsPlayerClass() || from_entity.cc_id === 0 || from_entity.cc_id !== this._dangerous_from.cc_id )
			{
				let projectile_properties = this.GetProjectileProperties();

				if ( ( typeof from_entity._armor_protection_level === 'undefined' || 
					   this._dangerous_from === null || 
					   ( this._dangerous_from._upgrade_counters[ 'upgrade_damage' ] || 0 ) >= from_entity._armor_protection_level )
					   /*&&
					   ( typeof from_entity._reinforced_level === 'undefined' || from_entity._reinforced_level <= 0 )*/ // Throwable swords can never damage entities with _reinforced_level
					)
				{
					if ( projectile_properties._custom_target_reaction )
					projectile_properties._custom_target_reaction( this, from_entity );

					if ( projectile_properties._damage !== 0 )
					{
						if ( from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD || from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
						{
							sdSound.PlaySound({ name:'player_hit', x:this.x, y:this.y, volume:0.5 });
						}

						sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect() });
					}
					
					let mult = 1;
					
					if ( from_entity.IsPlayerClass() )
					{
						mult = 1.5;

						mult *= from_entity.GetHitDamageMultiplier( this.x, this.y );
					}

					//if ( this._dangerous_from && this._dangerous_from.is( sdCharacter ) )
					//from_entity.DamageWithEffect( projectile_properties._damage * this._dangerous_from._damage_mult, this._dangerous_from );
					//else
					from_entity.DamageWithEffect( projectile_properties._damage, this._dangerous_from );

					this.DamageWithEffect( 1 );
					
					if ( sdGun.classes[ this.class ].onThrownSwordReaction )
					sdGun.classes[ this.class ].onThrownSwordReaction( this, from_entity, false );
				}
				else
				{
					if ( projectile_properties._custom_target_reaction_protected )
					projectile_properties._custom_target_reaction_protected( this, from_entity );

					sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });
					
					if ( sdGun.classes[ this.class ].onThrownSwordReaction )
					sdGun.classes[ this.class ].onThrownSwordReaction( this, from_entity, true );
				}
			}
			
			this.dangerous = false;
			this._dangerous_from = null;
		}
	}
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( !super.IsTargetable( by_entity, ignore_safe_areas ) )
		return false;
		
		
		let r = false;
	
		if ( by_entity )
		{
			if ( by_entity.is( sdBullet ) )
			{
				if ( ( by_entity._hook || by_entity._admin_picker ) && !this._held_by )
				r = true;
				else
				r = false;
			}
			else
			{
				let projectile_properties = this.GetProjectileProperties();
				
				r = ( 
						( by_entity.is( sdOctopus ) && 
						  this._held_by && 
						  !this._held_by._god && 
						  this._held_by.IsVisible( by_entity ) && 
						  this._held_by.gun_slot === this.GetSlot() && 
						  //this.class !== sdGun.CLASS_BUILD_TOOL && 
						  //projectile_properties._damage >= 0 && // no healing guns
						  projectile_properties._admin_picker !== true // no admin tools
						  ) || // sdOctopus rule
						this._held_by === null 
					);
			}
		}
		else
		{
			// Lost effect won't work in else case
			if ( this._held_by === null )
			r = true;
		}
		
		/*if ( r )
		if ( !sdArea.CheckPointDamageAllowed( this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2, this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2 ) )
		return false;*/

		return r;
	}
	
	GetProjectileProperties()
	{
		return sdGun.classes[ this.class ].projectile_properties_dynamic ?
			sdGun.classes[ this.class ].projectile_properties_dynamic( this ) :
			sdGun.classes[ this.class ].projectile_properties;
	}
	GetSlot()
	{
		return sdGun.classes[ this.class ].slot_dynamic ? sdGun.classes[ this.class ].slot_dynamic( this ) : sdGun.classes[ this.class ].slot;
	}
	GetTitle()
	{
		return sdGun.classes[ this.class ].title_dynamic ? sdGun.classes[ this.class ].title_dynamic( this ) : sdGun.classes[ this.class ].title;
	}
	GetAmmoCapacity()
	{
		return sdGun.classes[ this.class ].ammo_capacity_dynamic ? sdGun.classes[ this.class ].ammo_capacity_dynamic( this ) : sdGun.classes[ this.class ].ammo_capacity;
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		//this._remove_stack_trace = null;
		
		this._last_hit_sound = 0;
		
		this.tilt = 0;
		
		this.dangerous = false; // When thrown can deal damage
		this._dangerous_from = null;
		
		this._reload_time = 0;
		this.reload_time_left = 0;
		this.muzzle = 0;
		this._last_muzzle = 0; // Used for client-side shells
		
		// Old way of entity pointers I guess. ApplySnapshot handles this case but only for sdGun case
		this._held_by = null; // This property is cursed and outdated. Use public properties for new entitties - they will work fine and will handle pointers when pointed entiteis exist (null in else cases)
		this.held_by_net_id = -1;
		this.held_by_class = '';
		
		this._held_by_removed_panic = 0;
		
		this.ammo_left = -123;
		this.burst_ammo = -123;

		this._combo = 0; // Specifically made for the time shifter blade, this increases rate of fire / swing rate of sword for every hit you make
		this._combo_timer = 0;// Goes to 0, resets combo when it reaches 0
		//this.ttl = params.ttl || sdGun.disowned_guns_ttl;
		this.extra = ( params.extra === undefined ) ? 0 : params.extra; // shard value will be here

		this.sd_filter = ( params.sd_filter === undefined ) ? null : params.sd_filter;

		this.fire_mode = 1; // 1 = full auto, 2 = semi auto
		
		this.class = params.class || 0;
		
		//this._ignored_class = null; // Used by score shards to ignore entity from which score shards are dropped
		this._ignore_collisions_with = null; // Used by score shards to ignore entity from which score shards are dropped
		this.follow = null; // In case of score - score shards might follow player who should receive score, if such player is nearby
		
		this._count = 0;
		this._spread = 0;
		this._sound = '';
		this._sound_pitch = 1;
		this._hea = 50;
		
		this._unblocked_for_drones = false; // Only to prevent bug that is making server restart drop all guns of all players
		
		this.title_censored = 0;
		
		this.biometry_lock = -1;
		
		this._held_item_snapshot = null; // In case of liquid carrier - it is a snapshot of a water object

		this._temperature_addition = 0; // Does this gun's projectile set enemies on fire?
		
		this.ttl = params.ttl || sdGun.disowned_guns_ttl;
		
		let has_class = sdGun.classes[ this.class ];
		
		if ( has_class )
		{
			this._count = sdGun.classes[ this.class ].count === undefined ? 1 : sdGun.classes[ this.class ].count;
			this._spread = sdGun.classes[ this.class ].spread || 0;
			this._temperature_addition = sdGun.classes[ this.class ].temperature_addition || 0;
			this._reload_time = sdGun.classes[ this.class ].reload_time || 0;
			
			this._sound = sdGun.classes[ this.class ].sound || null;
			this._sound_pitch = sdGun.classes[ this.class ].sound_pitch || 1;
		
			if ( sdGun.classes[ this.class ].hea !== undefined )
			this._hea = sdGun.classes[ this.class ].hea;

			if ( this.class !== sdGun.CLASS_CRYSTAL_SHARD && sdGun.classes[ this.class ].spawnable === false ) // Unbuildable guns have 3 minutes to despawn, enough for players to find them if they lost them
			this.ttl = params.ttl || sdGun.disowned_guns_ttl * 2;
		
			if ( has_class.onMade )
			has_class.onMade( this, params ); // Should not make new entities, assume gun might be instantly removed once made
		
			this.fire_mode = has_class.fire_type || 1; // Adjust fire mode for the weapon
		}
		
		this.SetMethod( 'CollisionFiltering', this.CollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
	}
	
	CollisionFiltering( from_entity )
	{
		if ( from_entity.IsBGEntity() !== this.IsBGEntity() || !from_entity._hard_collision )
		return false;
		
		return ( this._ignore_collisions_with !== from_entity );
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_held_item_snapshot' ) return true;
		if ( prop === '_sound' ) return true;
		
		return false;
	}
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( this._held_by === null )
		return true;
		else
		{
			if ( this._held_by.is( sdWeaponBench ) )
			return true;
			else
			if ( this._held_by.is( sdStorage ) )
			{
				if ( observer_character )
				if ( sdWorld.inDist2D_Boolean( observer_character.x, observer_character.y, this.x, this.y, sdStorage.access_range ) )
				return true;
			}
			else
			//if ( this._held_by.is( sdCharacter ) )
			if ( this._held_by.IsPlayerClass() )
			{
				// Because in else case B key won't work
				//if ( sdGun.classes[ this.class ].is_build_gun ) Maybe it should always work better if player will know info about all of his guns. Probably that will be later used in interface anyway
				if ( this._held_by === observer_character )
				return true;
		
				if ( !this._held_by.ghosting || this._held_by.IsVisible( observer_character ) )
				if ( !this._held_by.driver_of )
				{
					return ( this._held_by.gun_slot === this.GetSlot() );
				}
			}
		}
		
		return false;
	}
	
	//onRemove()
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		//if ( sdWorld.is_server )
		//this._remove_stack_trace = getStackTrace();
		
		if ( this._held_by )
		{
			this._held_by.DropSpecificWeapon( this );
			/*
			if ( this._held_by._inventory[ this.GetSlot() ] === this )
			this._held_by._inventory[ this.GetSlot() ] = null;
			else
			console.warn('Warning: Held sdGun is removed but different entity is at same exact slot!...');
			*/
			this._held_by = null;
		}
	}
	ReloadStart() // Can happen multiple times
	{
		sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.5 });
		this._held_by.reload_anim = 15;
	}
	ChangeFireModeStart() // Can happen multiple times
	{
		if ( sdGun.classes[ this.class ] )
		if ( !sdGun.classes[ this.class ].is_build_gun )
		if ( !sdGun.classes[ this.class ].is_sword )
		{
			sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.5, pitch:1.5 });
			this._held_by.reload_anim = 15;

			this.fire_mode = ( this.fire_mode === 1 ) ? 2 : 1;
		}
	}
	
	GetBulletCost( return_infinity_on_build_tool_fail_placement=true, shoot_from_scenario=false )
	{
		if ( sdGun.classes[ this.class ].is_build_gun )
		{
			if ( this._held_by._build_params === null )
			return Infinity; // Unable to place anyway
			
			//globalThis.EnforceChangeLog( this, '_held_by' );
			
			if ( this._held_by._build_params._class === null ) // Upgrades
			{
				if ( ( this._held_by._upgrade_counters[ this._held_by._build_params.upgrade_name ] || 0 ) >= sdShop.upgrades[ this._held_by._build_params.upgrade_name ].max_level )
				{
					//this._held_by_unenforce();
				
					return Infinity; // Maxed out
				}
				
				if ( typeof this._held_by._build_params.matter_cost !== 'undefined' )
				{
					return this._held_by._build_params.matter_cost;
				}
			}
		
			let ent = this._held_by.CreateBuildObject( return_infinity_on_build_tool_fail_placement );
			
			if ( ent === null )
			{
				//console.log('Unplaceable' , sdCharacter.last_build_deny_reason );
				
				if ( this._held_by ) // Apparently can be not held at this moment
				if ( sdCharacter.last_build_deny_reason )
				this._held_by.Say( sdCharacter.last_build_deny_reason );
				
				//console.log( 'say complete' );
				
				//this._held_by_unenforce();
				
				return Infinity; // Unable to place anyway
			}
		
			// Allow cost override at shop
			let cost = ( typeof this._held_by._build_params.matter_cost !== 'undefined' ) ? this._held_by._build_params.matter_cost : ent.MeasureMatterCost();
			
			if ( cost === Infinity )
			if ( this._held_by )
			if ( this._held_by._god )
			cost = 0;

			
			//ent.onRemove = ent.onRemoveAsFakeEntity; // Disable any removal logic
			ent.SetMethod( 'onRemove', ent.onRemoveAsFakeEntity ); // Disable any removal logic
			ent.remove();
			ent._remove();
			
			//console.log('costs '+cost);
			
			//this._held_by_unenforce();
			
			return cost;
		}
		
		if ( this.class === sdGun.CLASS_SWORD )
		return 0;
		
		//if ( this.class === sdGun.CLASS_SABER )
		//return 2;
		
		if ( this.class === sdGun.CLASS_PISTOL )
		return 0;

		if ( this.class === sdGun.CLASS_LASER_DRILL )
		return 6;

		if ( this.class === sdGun.CLASS_SHOVEL )
		return 0;

		if ( this.class === sdGun.CLASS_SHOVEL_MK2 )
		return 2;
		
		let projectile_properties = this.GetProjectileProperties();
				
		if ( projectile_properties._admin_picker && !this._held_by._god )
		{
			return Infinity;
		}
		
		if ( sdGun.classes[ this.class ].GetAmmoCost )
		return sdGun.classes[ this.class ].GetAmmoCost( this, shoot_from_scenario );
	
		//let dmg_mult = 1;
		
		return sdGun.GetProjectileCost( projectile_properties, this._count, this._temperature_addition );
	}
	
	static GetProjectileCost( projectile_properties, _count=1, _temperature_addition=0 )
	{
		let temperature_damage = Math.abs( _temperature_addition ) / 500 * 50;
		
		if ( _temperature_addition < -50 )
		temperature_damage = Math.abs( _temperature_addition ) / 100 * 50;
		
		return ( Math.abs( projectile_properties._damage + temperature_damage ) * _count + 
				( projectile_properties._rail ? 30 : 0 ) + 
				( projectile_properties.explosion_radius > 0 ? 250 : 0 ) ) * sdWorld.damage_to_matter;
	}
	
	ReloadComplete()
	{
		if ( !this._held_by )
		return;
	
		if ( !sdWorld.is_server )
		return;
	
		// Upgrade for guns that used to work on magazine basis but no longer do:
		if ( this.GetAmmoCapacity() === -1 )
		this.ammo_left = -1;
	
		let ammo_to_spawn = this.GetAmmoCapacity() - this.ammo_left;
		let ammo_cost = this.GetBulletCost( true );
		
		//trace( 'Matter cost for gun: ', ammo_cost );
		
		while ( ammo_to_spawn > 0 && this._held_by.matter >= ammo_cost )
		{
			this.ammo_left++;
			ammo_to_spawn--;
			this._held_by.matter -= ammo_cost;
		}
		
		if ( ammo_to_spawn > 0 )
		{
			this._held_by.Say( sdWorld.GetAny([
				'I\'m out of matter...',
				'This might be the end...',
				'This thing could use some matter...',
				'I need matter...',
				'I\'ll need some crystals or help...'
			]));
		}
	}
	Shoot( background_shoot=0, offset=null, shoot_from_scenario=false ) // It becomes 1 when player holds shift
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		if ( this.class === sdGun.CLASS_CUSTOM_RIFLE )
		{
			if ( this._temperature_addition < 0 )
			{
				this._temperature_addition = 0;
				this.extra[ 11 ] = 0;
			}
			if ( this.extra[ 7 ] > 3 )
			{
				this.extra[ 7 ] = 3;
			}
			if ( this.extra[ 9 ] > 2 )
			{
				this.extra[ 9 ] = 2; // Make sure recoil is toned down to prevent server crashes or absurd knockback
			}
		}
			
		if ( this._held_by === null )
		{
			console.warn( 'Server logic error: Something calls .Shoot method of sdGun but sdGun has no owner - report this error if you understand how, when or why it happens.' );
			
			debugger;
			
			for ( var i = 0; i < sdWorld.sockets.length; i++ )
			sdWorld.sockets[ i ].SDServiceMessage( 'Server logic error: Something calls .Shoot method of sdGun but sdGun has no owner - report this error if you understand how, when or why it happens.' );
		
			this.remove();
			return false;
		}
		
		if ( !this._held_by.IsPlayerClass() )
		{
			console.warn( 'Server logic error: Something calls .Shoot method of sdGun is not owned by PlayerClass.' );
			
			debugger;
			
			for ( var i = 0; i < sdWorld.sockets.length; i++ )
			sdWorld.sockets[ i ].SDServiceMessage( 'Server logic error: Something calls .Shoot method of sdGun but sdGun owner isn\'t a PlayerClass - report this error if you understand how, when or why it happens.' );
		
			this.remove();
			return false;
		}
		
		if ( this.biometry_lock !== -1 && this.biometry_lock !== this._held_by.biometry )
		{
			this._held_by.Say( 'This weapon is biometry-locked' );
			return false;
		}
		
		const is_unknown = ( sdGun.classes[ this.class ] === undefined ); // Detect unknown weapons from LRT teleports
		
		if ( this.reload_time_left <= 0 && !is_unknown )
		{
			if ( this.ammo_left === -123 )
			{
				if ( sdGun.classes[ this.class ].ammo_capacity === undefined )
				sdGun.classes[ this.class ].ammo_capacity = -1;
			
				this.ammo_left = this.GetAmmoCapacity();
				if ( sdGun.classes[ this.class ].burst )
				this.burst_ammo = Math.min( this.ammo_left, sdGun.classes[ this.class ].burst );
			}
			
			if ( this.ammo_left !== 0 )
			{
				if ( this.ammo_left > 0 ) // can be -1
				{
					this.ammo_left--;
					if ( sdGun.classes[ this.class ].burst )
					this.burst_ammo--; 
				}
				else
				{
					let ammo_cost = this.GetBulletCost( true, shoot_from_scenario );
					
					if ( this._held_by.matter >= ammo_cost )
					{
						if ( sdWorld.is_server )
						{
							this._held_by.matter -= ammo_cost;

							if ( sdGun.classes[ this.class ].burst )
							this.burst_ammo--; 
							
							this._held_by.TriggerMovementInRange();
						}
					}
					else
					{
						let projectile_properties = this.GetProjectileProperties();
		
						if ( ammo_cost === Infinity )
						{
							if ( projectile_properties._admin_picker )
							this._held_by.Say( 'This weapon can be only used by admins' );
							else
							this._held_by.Say( 'Nothing to build or upgrade' ); // Also will happen to regular users trying to build admin entities like sdArea
						}
						else
						if ( ammo_cost > this._held_by.matter_max )
						this._held_by.Say( 'I need more score in order to have higher matter capacity' );
						//this._held_by.Say( 'Need matter capacity upgrade and more matter' );
						else
						{
							let n = Math.ceil( ammo_cost - this._held_by.matter );
							
							this._held_by.Say( [
								'Need at least '+n+' more matter',
								'What\'s the MATTER?',
								'It does not MATTER',
								''+n+' more matter',
								'Maybe I could get '+n+' matter from cubes?',
								'I am thinking about that MATTER',
								'I\'ll reconsider the MATTER',
								'No MATTER where I go, I get lost',
								'No MATTER who says so, I need '+n+' more',
								'It doesn\'t MATTER to me',
								'I want to spend more time doing things that MATTER',
								'I look forward to hearing your thoughts on this MATTER',
								this._held_by.title+' is not a lazy boy. As a MATTER of fact, '+this._held_by.title+' works hard',
								'Uh, do I go into debt?',
								'Where would I get '+n+' more matter?',
								'Where are my crystals again?'
							][ ~~( Math.random() * 16 ) ] );
						}
					
						return false;
					}
				}
				
				if ( sdGun.classes[ this.class ].onShootAttempt )
				if ( sdGun.classes[ this.class ].onShootAttempt( this, shoot_from_scenario ) === false )
				{
					return false;
				}
				
				if ( !this._held_by ) // Just in case if onShootAttempt removes/disowns gun? It happened once on line if ( this._held_by.power_ef > 0 )
				return false;
				
				let scale = this._held_by.s / 100;
						
				if ( this._sound )
				{
					let pitch = this._sound_pitch || 1;
					
					if ( this._held_by.power_ef > 0 )
					pitch *= 0.75;
				
					//pitch /= scale;
					pitch /= ( 0.75 + scale * 0.25 );
					
					sdSound.PlaySound({ name:this._sound, 
						x:this.x, y:this.y, 
						volume: ( 0.75 + scale * 0.25 ) * 0.5 * ( sdGun.classes[ this.class ].sound_volume || 1 ), 
						pitch: pitch });
				}
			
				this.reload_time_left = this._reload_time;
				if ( sdGun.classes[ this.class ].burst )
				if ( this.burst_ammo <= 0 )
				{
					this.reload_time_left = sdGun.classes[ this.class ].burst_reload;
					this.burst_ammo = sdGun.classes[ this.class ].burst;
				}

				let projectile_properties = this.GetProjectileProperties();
			
				if ( sdWorld.is_server )
				{
					//console.log( this._held_by._net_id );
					
					if ( sdGun.classes[ this.class ].is_build_gun )
					{
						if ( this._held_by._build_params._class === null )
						{
							this._held_by.InstallUpgrade( this._held_by._build_params.upgrade_name );
						}
						else
						{

							let ent = this._held_by.CreateBuildObject( false, ( this._held_by._build_params._category === 'Development tests' ) );
							
							if ( this._held_by._build_params._category !== 'Development tests' && !this._held_by._build_params._spawn_with_full_hp )
							{

								if ( typeof ent.hmax !== 'undefined' )
								ent.Damage( ent.hmax * 0.9 ); // Start with low hp

								if ( typeof ent._hmax !== 'undefined' )
								ent.Damage( ent._hmax * 0.9 ); // Start with low hp
							}
						
							ent.onBuilt();

							sdEntity.entities.push( ent );
							
							// Initially object is not spawned at cursor but near it. It means that huge static objects (sdBG, sdArea) will have incorrect hash array which will cause them to not have collisions when needed)
							if ( ent._affected_hash_arrays.length > 0 ) // Easier than checking for hiberstates
							sdWorld.UpdateHashPosition( ent, false, false );
						
							this._held_by._last_built_entity = ent;
						}
					}
					
					let initial_an = this._held_by.GetLookAngle() + this._held_by._side * ( ( Math.pow( this._held_by._recoil * 5, 2 ) / 5 ) * ( 0.5 + 0.5 * Math.random() ) );
					
					let count = this._count; //sdGun.classes[ this.class ].count === undefined ? 1 : sdGun.classes[ this.class ].count;
					let spread = this._spread; //sdGun.classes[ this.class ].spread || 0;
					let temperature_addition = this._temperature_addition;

					for ( let i = 0; i < count; i++ )
					{
						let vel = sdGun.default_projectile_velocity;
						
						if ( sdGun.classes[ this.class ].projectile_velocity_dynamic )
						vel = sdGun.classes[ this.class ].projectile_velocity_dynamic( this );
						else
						if ( sdGun.classes[ this.class ].projectile_velocity )
						vel = sdGun.classes[ this.class ].projectile_velocity;
						
						if ( isNaN( vel ) ) // Happened in one case it looks like, related to indefinitely bad recoil bug
						{
							break;
						}
					
						if ( projectile_properties._knock_scale !== undefined && isNaN( projectile_properties._knock_scale ) ) // Happened in one case it looks like, related to indefinitely bad recoil bug
						{
							break;
						}
						
						if ( spread > 0 && count > 0 )
						vel *= ( 1 - Math.random() * 0.15 );
						
						let bullet_obj = new sdBullet({ x: this._held_by.x + offset.x, y: this._held_by.y + offset.y });
						bullet_obj._owner = this._held_by;
						
						bullet_obj._gun = this;

						let an = initial_an + ( Math.random() * 2 - 1 ) * spread;
						
						bullet_obj.sx = Math.sin( an ) * vel;
						bullet_obj.sy = Math.cos( an ) * vel;
						
						bullet_obj._temperature_addition = temperature_addition;

						for ( var p in projectile_properties )
						bullet_obj[ p ] = projectile_properties[ p ];
						
						//if ( bullet_obj.is_grenade )
						if ( !bullet_obj._rail )
						{
							bullet_obj.sx += bullet_obj._owner.sx;
							bullet_obj.sy += bullet_obj._owner.sy;
						}
						
						if ( bullet_obj.ac > 0 )
						{
							bullet_obj.acx = Math.sin( an );
							bullet_obj.acy = Math.cos( an );
						}
						
						//bullet_obj._damage *= bullet_obj._owner._damage_mult;
						
						if ( bullet_obj._owner.power_ef > 0 )
						bullet_obj._damage *= 2.5;
					
						bullet_obj._damage *= scale;
						
						/*if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
						bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
						else
						bullet_obj._armor_penetration_level = 0;*/
						bullet_obj._armor_penetration_level = 3;
					
						if ( typeof projectile_properties._armor_penetration_level !== 'undefined' )
						bullet_obj._armor_penetration_level = projectile_properties._armor_penetration_level;
					
						/*if ( globalThis.CATCH_ERRORS )
						if ( isNaN( -bullet_obj.sx * 0.3 * bullet_obj._knock_scale ) || 
							 isNaN( -bullet_obj.sy * 0.3 * bullet_obj._knock_scale ) || 
							 isNaN( bullet_obj._owner.mass ) || 
							 bullet_obj._owner.mass === 0 )
						{
							let report = [ 'Something is not right about either spawned bullet or character! .Impulse will crash server' ];
							
							report.push( 

								`an = ${ an }`,
								`this._held_by.GetLookAngle() = ${this._held_by.GetLookAngle()}`,
								`this._held_by._side = ${ this._held_by._side }`,
								`this._held_by._recoil = ${ this._held_by._recoil }`,
								`this._held_by.look_x = ${ this._held_by.look_x }`,
								`this._held_by.look_y = ${ this._held_by.look_y }`,
								`this._held_by.x = ${ this._held_by.x }`,
								`this._held_by.y = ${ this._held_by.y }`,
								
								`spread = ${ spread }`,

								`bullet_obj._owner.mass = ${ bullet_obj._owner.mass }`,

								`bullet_obj._owner.s = ${ bullet_obj._owner.s }`,

								`bullet_obj._owner.sx = ${ bullet_obj._owner.sx }`,

								`bullet_obj._owner.sy = ${ bullet_obj._owner.sy }`,

								`this.class = ${ this.class }` 
							);
							
							for ( var p in bullet_obj )
							report.push( `bullet_obj.${ p } = ${ bullet_obj[ p ] }` );
						
							console.warn( report.join(', \n') );
							throw new Error( report.join(', \n') );
						}*/
						
						bullet_obj._owner.Impulse( -bullet_obj.sx * 0.3 * bullet_obj._knock_scale, -bullet_obj.sy * 0.3 * bullet_obj._knock_scale );
						
						bullet_obj._owner._recoil += bullet_obj._knock_scale * vel * 0.02; // 0.01

						bullet_obj._bg_shooter = background_shoot ? true : false;
						
						if ( bullet_obj._owner.IsPlayerClass() )
						bullet_obj.time_left *= bullet_obj._owner.s / 100;

						sdEntity.entities.push( bullet_obj );
					}
				}
				
				if ( sdGun.classes[ this.class ].muzzle_x !== null )
				{
					this.muzzle = Math.min( 5, ( projectile_properties._damage || 10 ) / 45 * 5 * sdGun.classes[ this.class ].count );

					if ( projectile_properties._rail ||
						 projectile_properties.explosion_radius )
					{
						this.muzzle = 5;
					}

					if ( !sdWorld.is_server || sdWorld.is_singleplayer )
					//if ( this._last_muzzle < this.muzzle )
					//if ( this._held_by )
					{
						let initial_an = this._held_by.GetLookAngle() + this._held_by._side * Math.PI / 2;
						let an = initial_an + ( Math.random() * 2 - 1 ) * 0.5 + this._held_by._side * Math.PI / 2 * 0.5;

						let vel = 1 + Math.random();
						
						let offset = this._held_by.GetBulletSpawnOffset();

						let ef = new sdEffect({ x: this._held_by.x + offset.x, y: this._held_by.y + offset.y, type: sdEffect.TYPE_SHELL, sx:Math.sin( an ) * vel, sy:Math.cos( an ) * vel, rotation: Math.PI / 2 - initial_an });
						sdEntity.entities.push( ef );
					}
				}
			
				return true;
			}
			else
			{
				this.ReloadStart();
			}
		}
		return false;
	}
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	GetIgnoredEntityClasses()
	{
		return sdGun.ignored_entity_classes_arr;
	}
	
	UpdateHolderClientSide()
	{
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Only for real entities
		if ( sdGun.classes[ this.class ] ) // Missing class test
		{
			let old_held_by = this._held_by;
			
			if ( this._held_by && this._held_by._net_id === this.held_by_net_id )
			{
			}
			else
			{
				this._held_by = sdEntity.GetObjectByClassAndNetId( this.held_by_class, this.held_by_net_id );

				if ( old_held_by !== this._held_by )
				{
					if ( old_held_by )
					if ( old_held_by.IsPlayerClass() )
					if ( old_held_by._inventory[ this.GetSlot() ] === this )
					old_held_by._inventory[ this.GetSlot() ] = null;
				}
			}

			if ( this._held_by )
			if ( this._held_by.IsPlayerClass() )
			{
				this._held_by._inventory[ this.GetSlot() ] = this;
			}

			// Other kinds of entities like sdStorage will handle pointers properly without extra logic here (since they are public and entity pointers will naturally work)
		}
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		{
			this.UpdateHolderClientSide();
			// Other kinds of entities like sdStorage will handle pointers properly without extra logic here (since they are public and entity pointers will naturally work)
		}
		else
		{
			if ( this._combo_timer > 0 )
			this._combo_timer = Math.max( 0, this._combo_timer - GSPEED );
			else
			this._combo = 0;

			if ( this._held_by )
			if ( this._held_by._is_being_removed )
			{
				this._held_by_removed_panic++;
				
				if ( this._held_by_removed_panic === 10 )
				{
					
					console.log( 'Floating weapon bug just happened: this['+this._net_id+']._held_by._is_being_removed. Held by '+this._held_by.GetClass()+' aka '+this._held_by.title );
					
					debugger;

					//throw new Error('Terminating due to bug found (gun held by something that is removed yet gun logic still being executed)...');
					

					for ( var i = 0; i < sdWorld.sockets.length; i++ )
					sdWorld.sockets[ i ].SDServiceMessage( 'Floating gun bug happened, please report what caused it. Gun is held by removed '+this._held_by.GetClass()+' ('+this._held_by.title+')' );
				}
			}

			if ( this.reload_time_left > 0 )
			{
				if ( this._held_by &&
					 this._held_by._last_built_entity &&
					 !this._held_by._last_built_entity._is_being_removed &&
					 sdGun.classes[ this.class ] && 
					 sdGun.classes[ this.class ].is_build_gun &&
					 this._held_by.gun_slot === this.GetSlot() &&
					 this._held_by._key_states.GetKey( 'Mouse1' ) &&
					 this._held_by._last_built_entity.dragWhenBuilt( this._held_by ) )
				{
					
				}
				else
				{
					if ( this._held_by && !this._held_by._is_being_removed )
					{
						if ( this._held_by.IsPlayerClass() )
						{
							if ( typeof this._held_by._last_built_entity === 'undefined' )
							{
								console.warn( 'this._held_by = ', this._held_by );
							}

							this._held_by._last_built_entity = null;
						}
						// In else case it is weapon bench
					}

					this.reload_time_left = Math.max( 0, this.reload_time_left - GSPEED * ( ( this._held_by && this._held_by.stim_ef > 0 ) ? 2 : 1 ) );
				}
			}
		}
		
		const is_unknown = ( sdGun.classes[ this.class ] === undefined ); // Detect unknown weapons from LRT teleports
		
		if ( !is_unknown )
		{
			//this.fire_mode = sdGun.classes[ this.class ].fire_type || 1; // Adjust fire mode for the weapon

			/*if ( !sdWorld.is_server || sdWorld.is_singleplayer )
			if ( this._last_muzzle < this.muzzle )
			if ( this._held_by )
			{
				let initial_an = this._held_by.GetLookAngle() + this._held_by._side * Math.PI / 2 * 1.5;
				let an = initial_an + ( Math.random() * 2 - 1 ) * 0.5;

				let vel = 1 + Math.random();
					
				let ef = new sdEffect({ x: this.x, y: this.y, type: sdEffect.TYPE_SHELL, sx:Math.sin( an ) * vel, sy:Math.cos( an ) * vel, rotation: Math.PI / 2 - initial_an });
				sdEntity.entities.push( ef );
			}*/
			
			if ( this.muzzle > 0 )
			this.muzzle -= GSPEED;
		
			this._last_muzzle = this.muzzle;
		}
		
		let allow_hibernation_due_to_logic = true;
			
		if ( this._held_by === null || this._held_by._is_being_removed )
		{
			if ( sdWorld.is_server )
			{
				this.held_by_net_id = -1;
				this.held_by_class = '';
				
				if ( this.ttl > 0 )
				{
					this.ttl -= GSPEED;
					if ( this.ttl <= 0 )
					{
						this.remove();
						return;
					}
				}

			}
			
			this.sy += sdWorld.gravity * GSPEED;
			
			sdWorld.last_hit_entity = null;
			
			if ( this._ignore_collisions_with === null )
			this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1 );
			else
			this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, this.CollisionFiltering );
			
			let known_class = sdGun.classes[ this.class ];
			
			if ( known_class )
			{
				if ( known_class.onThinkOwnerless )
				{
					allow_hibernation_due_to_logic = known_class.onThinkOwnerless( this, GSPEED );
					
					if ( allow_hibernation_due_to_logic === undefined )
					throw new Error( 'onThinkOwnerless of gun class should return either true or false, depending whether you want hibernation to be allowed for a gun or not' );
				}
			}
			
			//if ( this.class === sdGun.CLASS_CRYSTAL_SHARD || this.class === sdGun.CLASS_CUBE_SHARD || is_unknown )
			if ( is_unknown || known_class.no_tilt )
			this.tilt = 0; // These have offset which better to not rotate for better visuals
			else
			{
				if ( sdWorld.last_hit_entity )
				this.tilt += -Math.sin( this.tilt / sdGun.tilt_scale * 2 ) * 0.4 * sdGun.tilt_scale;
				else
				this.tilt += this.sx * 20 * GSPEED;
			}
			
		}
		else
		{
			if ( sdWorld.is_server )
			{
				this.held_by_net_id = this._held_by._net_id;
				this.held_by_class = this._held_by.GetClass();
			}
		}
		
		if ( sdWorld.is_server )
		if ( allow_hibernation_due_to_logic )
		if ( this._held_by && !this._held_by._is_being_removed && ( this.held_by_net_id === this._held_by._net_id && this.held_by_class === this._held_by.GetClass() ) )
		//if ( !this.IsVisible() ) // Usually means in storage or held by player
		if ( this.reload_time_left <= 0 )
		if ( this._combo_timer <= 0 )
		if ( this.muzzle <= 0 )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED ); // Note: Such hibernation will casue weapon to logically appear behind carrier. It means that carrier now should handle position logic
		}
	}
	UpdateHeldPosition()
	{
		if ( !this.extra ) // Is the gun missing damage upgrade properties for weapon bench?
		{
			if ( sdGun.classes[ this.class].onMade )
			if ( sdGun.classes[ this.class].upgrades )
			{
				/*let upgradeString = sdGun.classes[ this.class ].upgrades.toString(); // Convert to string so we can see if gun has new damage upgrade stuff
				let has_upgrades = ( upgradeString.indexOf( 'AddGunDefaultUpgrades' ) !== -1 )
				if ( has_upgrades )*/
				// I tried checking if it has the new upgrade function but I don't know what I am doing wrong. Can someone help / tell me? - Booraz149
				// Current iteration below seems to work without issues, however I think it would be ideal if it could check if "upgrades" section of gun class has explicitly "AddGunDefaultUpgrades"
				{
					let gun = new sdGun({ x:this.x, y:this.y, sx: this.sx, sy: this.sy, class:this.class }); // Remove and rebuild the weapon itself
					sdEntity.entities.push( gun );
					this.remove(); // Not sure if it should be before or after duplicate spawns
					return;
				}
			}
		}
		if ( this._held_by ) // Should not happen but just in case
		{
			let old_x = this.x;
			let old_y = this.y;
			
			this.x = this._held_by.x;
			this.y = this._held_by.y;

			if ( typeof this._held_by.sx !== 'undefined' )
			{
				this.sx = this._held_by.sx;
				this.sy = this._held_by.sy;
				
				if ( isNaN( this.sx ) )
				{
					console.log( 'Entity with corrupted velocity: ', this._held_by );
					throw new Error('sdGun is held by entity with .sx as NaN');
				}
			}

			if ( this.x !== old_x || this.y !== old_y )
			sdWorld.UpdateHashPosition( this, false, false );
		}
	}
	Draw( ctx, attached )
	{
		this.UpdateHolderClientSide();
		
		let has_class = sdGun.classes[ this.class ];
		
		if ( has_class )
		{
			let offset_x = ( has_class.image_offset_x || 0 );
			let offset_y = ( has_class.image_offset_y || 0 );
			
			ctx.translate( offset_x, offset_y );
			
			ctx.apply_shading = ( has_class.apply_shading === undefined ) ? true : has_class.apply_shading;
			
			if ( this.muzzle > 0 )
			{
				ctx.apply_shading = false;
			}
		}


		if ( this._held_by === null || ( this._held_by !== null && attached ) )
		{
			var image = sdGun.img_present;
			
			if ( has_class )
			{
				image = has_class.image;

				if ( this._held_by )
				{
					if ( this._held_by._auto_shoot_in > 0 )
					if ( has_class.image_charging )
					{
						image = has_class.image_charging;
					}
				}

				if ( this._held_by === null )
				ctx.rotate( this.tilt / sdGun.tilt_scale );

				if ( this.class === sdGun.CLASS_SNIPER || this.class === sdGun.CLASS_RAYGUN || this.class === sdGun.CLASS_PHASERCANNON_P03 || this.class === sdGun.CLASS_ERTHAL_BURST_RIFLE || this.class === sdGun.CLASS_BURST_PISTOL || this.class === sdGun.CLASS_GAUSS_RIFLE || this.class === sdGun.CLASS_ZAPPER || this.class === sdGun.CLASS_KIVORTEC_AVRS_P09 ) // It could probably be separated as a variable declared in sdGunClass to determine if it has reloading animation or not
				{
					let odd = ( this.reload_time_left % 10 ) < 5 ? 0 : 1;

					if ( this.reload_time_left > has_class.reload_time / 3 * 2 || ( this._held_by && this._held_by.matter - 1 < this.GetBulletCost( true ) ) )
					image = has_class.image0[ odd ];
					else
					if ( this.reload_time_left > has_class.reload_time / 3 * 1 )
					image = has_class.image1[ odd ];
					else
					if ( this.reload_time_left > 0 )
					image = has_class.image2[ odd ];
				}

				if ( has_class.is_sword )
				{
					//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost( true ) )
					if ( this._held_by === null && !this.dangerous && !sdShop.isDrawing )
					image = has_class.image_no_matter;
				}
				/*
				if ( this.class === sdGun.CLASS_SWORD )
				{
					//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost( true ) )
					if ( this._held_by === null && !this.dangerous )
					image = has_class.image_no_matter;
				}

				if ( this.class === sdGun.CLASS_SABER )
				{
					//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost( true ) )
					if ( this._held_by === null && !this.dangerous )
					image = has_class.image_no_matter;
				}*/

				if ( this.ttl >= 0 && this.ttl < 30 )
				ctx.globalAlpha = 0.5;

				if ( this.sd_filter )
				{
					ctx.sd_filter = this.sd_filter;
				}

				if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
				{
					let v = this.extra / sdWorld.crystal_shard_value * 40;
					/*if ( v > 40 )
					ctx.filter = 'hue-rotate(' + ( v - 40 ) + 'deg)';*/

					ctx.filter = sdWorld.GetCrystalHue( v );
				}

				/*if ( this.class === sdGun.CLASS_TRIPLE_RAIL || 
					 this.class === sdGun.CLASS_RAIL_PISTOL || 
					 this.class === sdGun.CLASS_RAIL_SHOTGUN || 
					 this.class === sdGun.CLASS_CUBE_SHARD || 
					 this.class === sdGun.CLASS_HEALING_RAY || 
					 this.class === sdGun.CLASS_LOST_CONVERTER ) // Cube weaponry, looked up color wheel since sdFilter is not worth it
				{
					if ( this.extra === 1 )
					{
						ctx.filter = 'hue-rotate(-120deg) saturate(100) brightness(1.5)'; // yellow
					}
					if ( this.extra === 2 )
					{
						ctx.filter = 'saturate(0) brightness(1.5)'; // white color
					}
					if ( this.extra === 3 )
					{
						ctx.filter = 'hue-rotate(120deg)  saturate(100)'; // pink
					}
				}*/

				if ( this.class === sdGun.CLASS_BUILDTOOL_UPG )
				{
					if ( this.extra === 1 )
					image = has_class.image0;

					if ( this.extra === 2 )
					image = has_class.image1;

					if ( this.extra === -123 )
					ctx.filter = 'invert(1)';
				}
				if ( this.class === sdGun.CLASS_WYRMHIDE )
				{
					ctx.filter = this.extra;
				}

				if ( has_class.is_sword )
				//if ( this.class === sdGun.CLASS_SWORD )
				if ( this._held_by )
				{
					if ( this.class !== sdGun.CLASS_POPCORN )
					if ( this._held_by.fire_anim <= 0 )
					ctx.rotate( - Math.PI / 2 );
				}

				if ( this.class === sdGun.CLASS_SHOVEL || this.class === sdGun.CLASS_SHOVEL_MK2 ) // Will add "is_shovel" property if needed
				if ( this._held_by )
				{
					if ( this._held_by.fire_anim <= 0 )
					ctx.rotate( + Math.PI / 8 );
					else
					ctx.rotate( - Math.PI / 8 );
				}
				/*
				if ( this.class === sdGun.CLASS_SABER )
				if ( this._held_by )
				{
					if ( this._held_by.fire_anim <= 0 )
					ctx.rotate( - Math.PI / 2 );
				}
				*/
			}
		   
			let muzzle_x = undefined;
			let muzzle_y = 0;
		   
			if ( this.muzzle > 0 )//2.5 )
			if ( has_class )
			{
				muzzle_x = has_class.muzzle_x;
				
				if ( has_class.image_firing !== undefined )
				{
					image = has_class.image_firing;
				}
			}
			
			if ( has_class.use_parts_rendering )
			{
				let ID_BASE = 0;
				let ID_STOCK = 1;
				let ID_MAGAZINE = 2;
				let ID_BARREL = 3;
				let ID_UNDERBARREL = 4;
				let ID_MUZZLE = 5;
				let ID_SCOPE = 6;
				
				let base_part_description = has_class.parts_base[ this.extra[ ID_BASE ] || 0 ];
				let barrel_part_description = has_class.parts_barrel[ this.extra[ ID_BARREL ] || 0 ];
				let muzzle_part_description = has_class.parts_muzzle[ this.extra[ ID_MUZZLE ] || 0 ];
				
				muzzle_x = base_part_description.w + barrel_part_description.w + muzzle_part_description.w;
				muzzle_y = muzzle_part_description.h;
				
				for ( let i = 0; i <= ID_SCOPE; i++ )
				{
					let frame = this.extra[ i ];
					
					let xx = 0;
					let yy = 0;
					
					if ( i === ID_MAGAZINE )
					{
						xx += base_part_description.w;
						yy += base_part_description.h;
						
						if ( this._held_by )
						if ( this._held_by.reload_anim > 0 )
						continue;
					}
				
					if ( i === ID_BARREL )
					{
						xx += base_part_description.w;
					}
				
					if ( i === ID_UNDERBARREL )
					{
						xx += base_part_description.w;
						yy += barrel_part_description.h;
					}
				
					if ( i === ID_MUZZLE )
					{
						xx += base_part_description.w + barrel_part_description.w;
					}
					
					if ( i === ID_SCOPE )
					{
						xx += base_part_description.w;
						yy -= 1;
					}
					//xx += offset_x;
					//yy += offset_y;
		
					ctx.drawImageFilterCache( image, i * 32,32 + frame * 32,32,32, -16 + xx, -16 + yy, 32,32 );
				}
			}
			else
			if ( has_class.image_frames )
			{
				let frame = Math.floor( ( sdWorld.time + ( this._net_id || 0 ) * 2154 ) / has_class.image_duration ) % has_class.image_frames;
				ctx.drawImageFilterCache( image, 0 + frame * 32,0,32,32,  - 16, - 16, 32,32 );
			}
			else
			{
				ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );
			}
			
			ctx.filter = 'none';
			ctx.sd_filter = null;
			
			if ( muzzle_x !== undefined )
			if ( this.muzzle > 0 )
			{
				/*if ( this.muzzle > 2.5 )
				{
					ctx.drawImageFilterCache( sdGun.img_muzzle2, muzzle_x - 16, muzzle_y - 16, 32,32 );
				}
				else
				if ( this.muzzle > 0 )
				{
					ctx.drawImageFilterCache( sdGun.img_muzzle1, muzzle_x - 16, muzzle_y - 16, 32,32 );
				}*/
						
				let yy = 4 - ~~( Math.min( 5, this.muzzle ) / 5 * 5 );
				
				for ( let xx = 0; xx < 2; xx++ )
				{
					if ( xx === 0 )
					{
						if ( sdGun.classes[ this.class ].projectile_properties &&
							 sdGun.classes[ this.class ].projectile_properties.color )
						{
							ctx.sd_tint_filter = sdWorld.hexToRgb( sdGun.classes[ this.class ].projectile_properties.color );
							ctx.sd_tint_filter[ 0 ] /= 255;
							ctx.sd_tint_filter[ 1 ] /= 255;
							ctx.sd_tint_filter[ 2 ] /= 255;
						}
						else
						ctx.sd_tint_filter = [ 255 / 255, 216 / 255, 33 / 255 ];
					}
				
					ctx.drawImageFilterCache( sdGun.img_muzzle_sheet, xx*32,yy*32,32,32, muzzle_x - 16, muzzle_y - 16, 32,32 );
					
					ctx.sd_tint_filter = null;
				}
				
			}
			
			ctx.globalAlpha = 1;
		}
	}
	MeasureMatterCost()
	{
		if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
		return this.extra;
	
		return sdGun.classes[ this.class ].matter_cost || 30;
	}
}
//sdGun.init_class();

export default sdGun;
