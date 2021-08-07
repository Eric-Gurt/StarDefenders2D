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

import sdGunClass from './sdGunClass.js';

import sdShop from '../client/sdShop.js';

// More like anything pickup-able
class sdGun extends sdEntity
{
	static init_class()
	{
		sdGun.img_muzzle1 = sdWorld.CreateImageFromFile( 'muzzle1' );
		sdGun.img_muzzle2 = sdWorld.CreateImageFromFile( 'muzzle2' );
		
		sdGun.disowned_guns_ttl = 30 * 60;
		
		sdGun.default_projectile_velocity = 20; // 16
		
		sdGun.tilt_scale = 200;
		
		/*let images_loaded = 0;
		let guess_muzzle = ()=>
		{
			images_loaded++;
			if ( images_loaded === sdGun.classes.length )
			{
				for ( var i = 0; i < sdGun.classes.length; i++ )
				{
					//stuff
				}
			}
		};*/
		
		/*
		
			Some basic SD2D weapon ideas:
		
				- Weapon cost is only exists to prevent new players from being strong enough to spawn deadly weapons (like grenades, sniper rifle);
		
				- Matter consumption is what defines weapons and should always be aligned to damage dealt, unless it exposes some unfair features.
		
		*/
		sdGun.classes = [];
		
		sdGunClass.init_class(); // Will populate sdGun.classes array

		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -4; }
	get hitbox_x2() { return 4; }
	get hitbox_y1() { return -3; }
	get hitbox_y2() { return 3; }
	get mass()
	{
		return 30;
	}
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
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
			
			if ( from_entity.is( sdCharacter ) )
			{
				if ( from_entity._ignored_guns.indexOf( this ) !== -1 || from_entity.driver_of !== null )
				return;
			}
			
			if ( !sdArea.CheckPointDamageAllowed( from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2, from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2 ) )
			{
				this.dangerous = false;
				this._dangerous_from = null;
				return;
			}
			
			if ( !sdWorld.server_config.GetHitAllowed || sdWorld.server_config.GetHitAllowed( this, from_entity ) )
			if ( !this._dangerous_from || !from_entity.is( sdCharacter ) || !this._dangerous_from.is( sdCharacter ) || from_entity.cc_id === 0 || from_entity.cc_id !== this._dangerous_from.cc_id )
			{
				if ( ( typeof from_entity._armor_protection_level === 'undefined' || 
					   this._dangerous_from === null || 
					   ( this._dangerous_from._upgrade_counters[ 'upgrade_damage' ] || 0 ) >= from_entity._armor_protection_level )
					   &&
					   ( typeof from_entity._reinforced_level === 'undefined' || from_entity._reinforced_level <= 0 ) // Throwable swords can never damage entities with _reinforced_level
					)
				{
					if ( sdGun.classes[ this.class ].projectile_properties._custom_target_reaction )
					sdGun.classes[ this.class ].projectile_properties._custom_target_reaction( this, from_entity );

					if ( sdGun.classes[ this.class ].projectile_properties._damage !== 0 )
					{
						if ( from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD || from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
						{
							sdSound.PlaySound({ name:'player_hit', x:this.x, y:this.y, volume:0.5 });
						}

						sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect() });
					}
					
					let mult = 1;
					
					if ( from_entity.is( sdCharacter ) )
					{
						mult = 1.5;

						mult *= from_entity.GetHitDamageMultiplier( this.x, this.y );
					}

					if ( this._dangerous_from && this._dangerous_from.is( sdCharacter ) )
					from_entity.Damage( sdGun.classes[ this.class ].projectile_properties._damage * this._dangerous_from._damage_mult, this._dangerous_from );
					else
					from_entity.Damage( sdGun.classes[ this.class ].projectile_properties._damage, this._dangerous_from );

					this.Damage( 1 );
					
					if ( sdGun.classes[ this.class ].onThrownSwordReaction )
					sdGun.classes[ this.class ].onThrownSwordReaction( this, from_entity, false );
				}
				else
				{
					if ( sdGun.classes[ this.class ].projectile_properties._custom_target_reaction_protected )
					sdGun.classes[ this.class ].projectile_properties._custom_target_reaction_protected( this, from_entity );

					sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });
					
					if ( sdGun.classes[ this.class ].onThrownSwordReaction )
					sdGun.classes[ this.class ].onThrownSwordReaction( this, from_entity, true );
				}
			}
			
			this.dangerous = false;
			this._dangerous_from = null;
		}
	}
	
	IsTargetable( by_entity ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( !sdArea.CheckPointDamageAllowed( this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2, this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2 ) )
		return false;
		
		return	( 
					( by_entity && 
					  by_entity.is( sdOctopus ) && 
					  this._held_by && 
					  this._held_by.IsVisible( by_entity ) && 
					  this._held_by.gun_slot === sdGun.classes[ this.class ].slot && 
					  this.class !== sdGun.CLASS_BUILD_TOOL && 
					  sdGun.classes[ this.class ].projectile_properties._damage >= 0 && // no healing guns
					  sdGun.classes[ this.class ].projectile_properties._admin_picker !== true // no admin tools
					  ) || // sdOctopus rule
					this._held_by === null 
				);
	}
	
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.tilt = 0;
		
		this.dangerous = false; // When thrown can deal damage
		this._dangerous_from = null;
		
		this.reload_time_left = 0;
		this.muzzle = 0;
		
		// Old way of entity pointers I guess. ApplySnapshot handles this case but only for sdGun case
		this._held_by = null;
		this.held_by_net_id = -1;
		this.held_by_class = '';
		
		this._held_by_removed_panic = 0;
		
		this.ammo_left = -123;
		this.burst_ammo = -123;
		//this.ttl = params.ttl || sdGun.disowned_guns_ttl;
		this.extra = ( params.extra === undefined ) ? 0 : params.extra; // shard value will be here
		
		this.class = params.class || 0;
		
		if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
		this._hea = 5;
		else
		this._hea = 50;
	
		if ( this.class != sdGun.CLASS_CRYSTAL_SHARD && sdGun.classes[ this.class ].spawnable === false ) // Unbuildable guns have 3 minutes to despawn, enough for players to find them if they lost them
		this.ttl = params.ttl || sdGun.disowned_guns_ttl * 3;
		else
		this.ttl = params.ttl || sdGun.disowned_guns_ttl;
	}
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( this._held_by === null )
		return true;
		else
		{
			if ( this._held_by.is( sdStorage ) )
			{
				if ( observer_character )
				if ( sdWorld.inDist2D_Boolean( observer_character.x, observer_character.y, this.x, this.y, sdStorage.access_range ) )
				return true;
			}
			else
			if ( this._held_by.is( sdCharacter ) )
			{
				// Because in else case B key won't work
				//if ( sdGun.classes[ this.class ].is_build_gun ) Maybe it should always work better if player will know info about all of his guns. Probably that will be later used in interface anyway
				if ( this._held_by === observer_character )
				return true;
		
				if ( !this._held_by.ghosting || this._held_by.IsVisible( observer_character ) )
				if ( !this._held_by.driver_of )
				{
					return ( this._held_by.gun_slot === sdGun.classes[ this.class ].slot );
				}
			}
		}
		
		return false;
	}
	onRemove()
	{
		if ( this._held_by )
		{
			this._held_by.DropSpecificWeapon( this );
			/*
			if ( this._held_by._inventory[ sdGun.classes[ this.class ].slot ] === this )
			this._held_by._inventory[ sdGun.classes[ this.class ].slot ] = null;
			else
			console.warn('Warning: Held sdGun is removed but different entity is at same exact slot!...');
			*/
			this._held_by = null;
		}
	}
	ReloadStart() // Can happen multiple times
	{
		//this.ammo_left = 0; // Bad because energy wastes this way
		
		
		sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.5 });
		
		this._held_by.reload_anim = 30;
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
				
				if ( this._held_by._build_params.matter_cost )
				{
					//this._held_by_unenforce();
				
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
		
			let cost = ent.MeasureMatterCost();
			
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
	
		if ( sdGun.classes[ this.class ].projectile_properties._admin_picker && !this._held_by._god )
		{
			return Infinity;
		}
		
		if ( sdGun.classes[ this.class ].GetAmmoCost )
		return sdGun.classes[ this.class ].GetAmmoCost( this, shoot_from_scenario );
		
		return ( Math.abs( sdGun.classes[ this.class ].projectile_properties._damage * this._held_by._damage_mult * ( this._held_by.power_ef > 0 ? 2.5 : 1 ) ) * sdGun.classes[ this.class ].count + 
				( sdGun.classes[ this.class ].projectile_properties._rail ? 30 : 0 ) + 
				( sdGun.classes[ this.class ].projectile_properties.explosion_radius > 0 ? 20 : 0 ) ) * sdWorld.damage_to_matter;
	}
	
	ReloadComplete()
	{
		if ( !this._held_by )
		return;
	
		if ( !sdWorld.is_server )
		return;
	
		// Upgrade for guns that used to work on magazine basis but no longer do:
		if ( sdGun.classes[ this.class ].ammo_capacity === -1 )
		this.ammo_left = -1;
	
		let ammo_to_spawn = sdGun.classes[ this.class ].ammo_capacity - this.ammo_left;
		let ammo_cost = this.GetBulletCost( true );
		
		while ( ammo_to_spawn > 0 && this._held_by.matter >= ammo_cost )
		{
			this.ammo_left++;
			ammo_to_spawn--;
			this._held_by.matter -= ammo_cost;
			
			//this.ammo_left = sdGun.classes[ this.class ].ammo_capacity;
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
			
		if ( this._held_by === null )
		{
			console.warn( 'Server logic error: Something calls .Shoot method of sdGun but sdGun has no owner - report this error if you understand how, when or why it happens.' );
			
			debugger;
			
			for ( var i = 0; i < sdWorld.sockets.length; i++ )
			sdWorld.sockets[ i ].SDServiceMessage( 'Server logic error: Something calls .Shoot method of sdGun but sdGun has no owner - report this error if you understand how, when or why it happens.' );
		
			return false;
		}
			
		if ( this.reload_time_left <= 0 )
		{
			if ( this.ammo_left === -123 )
			{
				if ( sdGun.classes[ this.class ].ammo_capacity === undefined )
				sdGun.classes[ this.class ].ammo_capacity = -1;
			
				this.ammo_left = sdGun.classes[ this.class ].ammo_capacity;
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
						if ( ammo_cost === Infinity )
						{
							if ( sdGun.classes[ this.class ].projectile_properties._admin_picker )
							this._held_by.Say( 'This weapon can be only used by admins' );
							else
							this._held_by.Say( 'Nothing to build or upgrade' ); // Also will happen to regular users trying to build admin entities like sdArea
						}
						else
						if ( ammo_cost > this._held_by.matter_max )
						this._held_by.Say( 'Need matter capacity upgrade and more matter' );
						else
						this._held_by.Say( 'Need at least ' + Math.ceil( ammo_cost - this._held_by.matter ) + ' more matter' );
					
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
						
				if ( sdGun.classes[ this.class ].sound )
				{
					let pitch = sdGun.classes[ this.class ].sound_pitch || 1;
					
					if ( this._held_by.power_ef > 0 )
					pitch *= 0.75;
				
					//pitch /= scale;
					pitch /= ( 0.75 + scale * 0.25 );
					
					sdSound.PlaySound({ name:sdGun.classes[ this.class ].sound, x:this.x, y:this.y, volume: ( 0.75 + scale * 0.25 ) * 0.5 * ( sdGun.classes[ this.class ].sound_volume || 1 ), pitch: pitch });
				}
			
				this.reload_time_left = sdGun.classes[ this.class ].reload_time;
				if ( sdGun.classes[ this.class ].burst )
				if ( this.burst_ammo <= 0 )
				{
					this.reload_time_left = sdGun.classes[ this.class ].burst_reload;
					this.burst_ammo = sdGun.classes[ this.class ].burst;
				}
				if ( sdGun.classes[ this.class ].muzzle_x !== null )
				this.muzzle = 5;
			
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
						}
					}
					
					let initial_an = this._held_by.GetLookAngle() + this._held_by._side * ( ( Math.pow( this._held_by._recoil * 5, 2 ) / 5 ) * ( 0.5 + 0.5 * Math.random() ) );
					
					let count = sdGun.classes[ this.class ].count === undefined ? 1 : sdGun.classes[ this.class ].count;
					let spread = sdGun.classes[ this.class ].spread || 0;
					for ( let i = 0; i < count; i++ )
					{
						//let offset = this._held_by.GetBulletSpawnOffset();
						
						let bullet_obj = new sdBullet({ x: this._held_by.x + offset.x, y: this._held_by.y + offset.y });
						bullet_obj._owner = this._held_by;

						let an = initial_an + ( Math.random() * 2 - 1 ) * spread;
						
						let vel = sdGun.default_projectile_velocity;
						
						if ( sdGun.classes[ this.class ].projectile_velocity )
						vel = sdGun.classes[ this.class ].projectile_velocity;
						
						if ( spread > 0 && count > 0 )
						{
							vel *= ( 1 - Math.random() * 0.15 );
						}
						
						//an += bullet_obj._owner._side * bullet_obj._owner._recoil;
						
						bullet_obj.sx = Math.sin( an ) * vel;
						bullet_obj.sy = Math.cos( an ) * vel;
						
						for ( var p in sdGun.classes[ this.class ].projectile_properties )
						bullet_obj[ p ] = sdGun.classes[ this.class ].projectile_properties[ p ];
						
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
						
						bullet_obj._damage *= bullet_obj._owner._damage_mult;
						
						if ( bullet_obj._owner.power_ef > 0 )
						bullet_obj._damage *= 2.5;
					
						bullet_obj._damage *= scale;
						
						if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
						bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
						else
						bullet_obj._armor_penetration_level = 0;
					
						if ( typeof sdGun.classes[ this.class ].projectile_properties._armor_penetration_level !== 'undefined' )
						bullet_obj._armor_penetration_level = sdGun.classes[ this.class ].projectile_properties._armor_penetration_level;
						
						bullet_obj._owner.Impulse( -bullet_obj.sx * 0.3 * bullet_obj._knock_scale, -bullet_obj.sy * 0.3 * bullet_obj._knock_scale );
						
						bullet_obj._owner._recoil += bullet_obj._knock_scale * vel * 0.02; // 0.01

						bullet_obj._bg_shooter = background_shoot ? true : false;
						
						if ( bullet_obj._owner.IsPlayerClass() )
						bullet_obj.time_left *= bullet_obj._owner.s / 100;

						sdEntity.entities.push( bullet_obj );
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
	
	GetIgnoredEntityClasses()
	{
		return [ 'sdCharacter', 'sdGun' ];
	}
	
	UpdateHolderClientSide()
	{
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Only for real entities
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
					if ( old_held_by.is( sdCharacter ) )
					if ( old_held_by._inventory[ sdGun.classes[ this.class ].slot ] === this )
					old_held_by._inventory[ sdGun.classes[ this.class ].slot ] = null;
				}
			}

			if ( this._held_by )
			if ( this._held_by.is( sdCharacter ) )
			{
				this._held_by._inventory[ sdGun.classes[ this.class ].slot ] = this;
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
			this.reload_time_left = Math.max( 0, this.reload_time_left - GSPEED * ( ( this._held_by && this._held_by.stim_ef > 0 ) ? 2 : 1 ) );
		}
		
		if ( this.ttl > 0 )
		{
			this.ttl -= GSPEED;
			if ( this.ttl <= 0 )
			{
				this.remove();
				return;
			}
		}
		
		if ( this.muzzle > 0 )
		this.muzzle -= GSPEED;
			
		if ( this._held_by === null )
		{
			if ( sdWorld.is_server )
			{
				this.held_by_net_id = -1;
				this.held_by_class = '';
			}
			
			this.sy += sdWorld.gravity * GSPEED;
			
			sdWorld.last_hit_entity = null;
			
			this.ApplyVelocityAndCollisions( GSPEED, 0, true, 0 );
			
			if ( this.class === sdGun.CLASS_CRYSTAL_SHARD || this.class === sdGun.CLASS_CUBE_SHARD )
			this.tilt = 0; // These have offset which better to not rotate for better visuals
			else
			{
				if ( sdWorld.last_hit_entity )
				this.tilt += -Math.sin( this.tilt / sdGun.tilt_scale * 2 ) * 0.4 * sdGun.tilt_scale;
				else
				this.tilt += this.sx * 20 * GSPEED;
			}
			
			/*
			
			let new_x = this.x + this.sx * GSPEED;
			let new_y = this.y + this.sy * GSPEED;

			if ( sdWorld.CheckWallExists( new_x, new_y + this._hitbox_y2, this, [ 'sdCharacter', 'sdGun' ] ) )
			{
				this.sx = 0;
				this.sy = 0;
				
				this.tilt += -Math.sin( this.tilt / sdGun.tilt_scale * 2 ) * 0.4 * sdGun.tilt_scale;
				//this.dangerous = false;
			}
			else
			{
				this.sy += sdWorld.gravity * GSPEED;

				this.x = new_x;
				this.y = new_y;
				
				this.tilt += this.sx * 10;
			}*/
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
		if ( this._held_by && ( this.held_by_net_id === this._held_by._net_id && this.held_by_class === this._held_by.GetClass() ) )
		//if ( !this.IsVisible() ) // Usually means in storage or held by player
		if ( this.reload_time_left <= 0 )
		if ( this.muzzle <= 0 )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED ); // Note: Such hibernation will casue weapon to logically appear behind carrier. It means that carrier now should handle position logic
		}
	}
	UpdateHeldPosition()
	{
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
		
		if ( this._held_by === null || ( this._held_by !== null && attached ) )
		{
			var image = sdGun.classes[ this.class ].image;
			
			if ( this._held_by )
			{
				if ( this._held_by._auto_shoot_in > 0 )
				if ( sdGun.classes[ this.class ].image_charging )
				{
					image = sdGun.classes[ this.class ].image_charging;
				}
			}
			
			if ( this._held_by === null )
			ctx.rotate( this.tilt / sdGun.tilt_scale );
			
			if ( this.class === sdGun.CLASS_SNIPER || this.class === sdGun.CLASS_RAYGUN || this.class === sdGun.CLASS_PHASERCANNON_P03 || this.class === sdGun.CLASS_ERTHAL_BURST_RIFLE || this.class === sdGun.CLASS_BURST_PISTOL || this.class === sdGun.CLASS_GAUSS_RIFLE ) // It could probably be separated as a variable declared in sdGunClass to determine if it has reloading animation or not
			{
				let odd = ( this.reload_time_left % 10 ) < 5 ? 0 : 1;
				
				if ( this.reload_time_left > sdGun.classes[ this.class ].reload_time / 3 * 2 || ( this._held_by && this._held_by.matter - 1 < this.GetBulletCost( true ) ) )
				image = sdGun.classes[ this.class ].image0[ odd ];
				else
				if ( this.reload_time_left > sdGun.classes[ this.class ].reload_time / 3 * 1 )
				image = sdGun.classes[ this.class ].image1[ odd ];
				else
				if ( this.reload_time_left > 0 )
				image = sdGun.classes[ this.class ].image2[ odd ];
			}
			
			if ( sdGun.classes[ this.class ].is_sword )
			{
				//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost( true ) )
				if ( this._held_by === null && !this.dangerous )
				image = sdGun.classes[ this.class ].image_no_matter;
			}
			/*
			if ( this.class === sdGun.CLASS_SWORD )
			{
				//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost( true ) )
				if ( this._held_by === null && !this.dangerous )
				image = sdGun.classes[ this.class ].image_no_matter;
			}

			if ( this.class === sdGun.CLASS_SABER )
			{
				//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost( true ) )
				if ( this._held_by === null && !this.dangerous )
				image = sdGun.classes[ this.class ].image_no_matter;
			}*/

			if ( this.ttl >= 0 && this.ttl < 30 )
			ctx.globalAlpha = 0.5;
		
			if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
			{
				let v = this.extra / sdWorld.crystal_shard_value * 40;
				/*if ( v > 40 )
				ctx.filter = 'hue-rotate(' + ( v - 40 ) + 'deg)';*/
			
				ctx.filter = sdWorld.GetCrystalHue( v );
			}
			
			if ( this.class === sdGun.CLASS_TRIPLE_RAIL || 
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
			}

			if ( this.class === sdGun.CLASS_BUILDTOOL_UPG )
			{
				if ( this.extra === 1 )
				image = sdGun.classes[ this.class ].image0;
			
				if ( this.extra === -123 )
				ctx.filter = 'invert(1)';
			}

			if ( sdGun.classes[ this.class ].is_sword )
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
			
			ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );
			
			ctx.filter = 'none';
			
			if ( this.muzzle > 2.5 )
			{
				ctx.drawImageFilterCache( sdGun.img_muzzle2, sdGun.classes[ this.class ].muzzle_x - 16, - 16, 32,32 );
			}
			else
			if ( this.muzzle > 0 )
			{
				ctx.drawImageFilterCache( sdGun.img_muzzle1, sdGun.classes[ this.class ].muzzle_x - 16, - 16, 32,32 );
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
