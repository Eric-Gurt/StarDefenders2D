
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

import sdShop from '../client/sdShop.js';

// More like anything pickup-able
class sdGun extends sdEntity
{
	static init_class()
	{
		sdGun.img_muzzle1 = sdWorld.CreateImageFromFile( 'muzzle1' );
		sdGun.img_muzzle2 = sdWorld.CreateImageFromFile( 'muzzle2' );
		
		sdGun.disowned_guns_ttl = 30 * 60;
		
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
		
		sdGun.CLASS_PISTOL = 0;
		sdGun.CLASS_RIFLE = 1;
		sdGun.CLASS_SHOTGUN = 2;
		sdGun.CLASS_RAILGUN = 3;
		sdGun.CLASS_ROCKET = 4;
		sdGun.CLASS_MEDIKIT = 5;
		sdGun.CLASS_SPARK = 6;
		sdGun.CLASS_BUILD_TOOL = 7;
		sdGun.CLASS_CRYSTAL_SHARD = 8;
		sdGun.CLASS_GRENADE_LAUNCHER = 9;
		sdGun.CLASS_SNIPER = 10;
		sdGun.CLASS_SWORD = 11;
		sdGun.CLASS_STIMPACK = 12;
		sdGun.CLASS_FALKOK_RIFLE = 13;
		sdGun.CLASS_TRIPLE_RAIL = 14;
		sdGun.CLASS_FISTS = 15;
		sdGun.CLASS_SABER = 16;
		
		sdGun.classes = 
		[
			{
				image: sdWorld.CreateImageFromFile( 'pistol' ),
				sound: 'gun_pistol',
				title: 'Pistol',
				slot: 1,
				reload_time: 10,
				muzzle_x: 5,
				ammo_capacity: 12,
				spread: 0.01,
				count: 1,
				projectile_properties: { _damage: 20 }
			},
			{
				image: sdWorld.CreateImageFromFile( 'rifle' ),
				sound: 'gun_rifle',
				title: 'Assault rifle',
				slot: 2,
				reload_time: 3,
				muzzle_x: 7,
				ammo_capacity: 30,
				spread: 0.01, // 0.03
				count: 1,
				projectile_properties: { _damage: 25 }
			},
			{
				image: sdWorld.CreateImageFromFile( 'shotgun' ),
				sound: 'gun_shotgun',
				title: 'Shotgun',
				slot: 3,
				reload_time: 20,
				muzzle_x: 9,
				ammo_capacity: 8,
				count: 5,
				spread: 0.1,
				matter_cost: 40,
				projectile_properties: { _damage: 20 }
			},
			{
				image: sdWorld.CreateImageFromFile( 'railgun' ),
				sound: 'gun_railgun',
				title: 'Railgun',
				slot: 4,
				reload_time: 30,
				muzzle_x: 7,
				ammo_capacity: -1,
				count: 1,
				matter_cost: 50,
				projectile_properties: { _rail: true, _damage: 70, color: '#62c8f2', _knock_scale:0.01 * 8 }
			},
			{
				image: sdWorld.CreateImageFromFile( 'rocket' ),
				sound: 'gun_rocket',
				title: 'Rocket launcher',
				slot: 5,
				reload_time: 30,
				muzzle_x: 7,
				ammo_capacity: -1,
				spread: 0.05,
				projectile_velocity: 14,
				count: 1,
				matter_cost: 60,
				projectile_properties: { _explosion_radius: 19, model: 'rocket_proj', _damage: 19 * 3, color:sdEffect.default_explosion_color, ac:1 }
			},
			{
				image: sdWorld.CreateImageFromFile( 'medikit' ),
				sound: 'gun_defibrillator',
				title: 'Defibrillator',
				slot: 6,
				reload_time: 25,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 1,
				projectile_properties: { time_left: 2, _damage: -20, color: 'transparent', _return_damage_to_owner:true }
			},
			{
				image: sdWorld.CreateImageFromFile( 'spark' ),
				sound: 'gun_spark',
				title: 'Spark',
				slot: 8,
				reload_time: 7,
				muzzle_x: 7,
				ammo_capacity: 16,
				count: 1,
				matter_cost: 60,
				projectile_properties: { _explosion_radius: 10, model: 'ball', _damage: 5, color:'#00ffff' }
			},
			{
				image: sdWorld.CreateImageFromFile( 'buildtool' ),
				sound: 'gun_buildtool',
				title: 'Build tool',
				slot: 9,
				reload_time: 15,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 0,
				is_build_gun: true,
				projectile_properties: { _damage: 0 }
			},
			{
				image: sdWorld.CreateImageFromFile( 'crystal_shard' ),
				title: 'Crystal shard',
				slot: 0,
				reload_time: 25,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 0,
				projectile_properties: { _damage: 0 },
				spawnable: false,
				ignore_slot: true,
				onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
				{ 
					// 2 was too bad for case of randomly breaking crystals when digging
					if ( character.matter + gun.extra <= character.matter_max )
					{
						character.matter += gun.extra;
						gun.remove(); 
					}
				
					return false; 
				} 
			},
			{
				image: sdWorld.CreateImageFromFile( 'grenade_launcher' ),
				sound: 'gun_grenade_launcher',
				title: 'Grenade launcher',
				slot: 5,
				reload_time: 20,
				muzzle_x: 7,
				ammo_capacity: -1,
				spread: 0.05,
				count: 1,
				projectile_velocity: 7,
				matter_cost: 60,
				projectile_properties: { _explosion_radius: 13, time_left: 30 * 3, model: 'grenade', _damage: 13 * 2, color:sdEffect.default_explosion_color, is_grenade: true }
			},
			{
				image: sdWorld.CreateImageFromFile( 'sniper' ),
				image0: [ sdWorld.CreateImageFromFile( 'sniper0' ), sdWorld.CreateImageFromFile( 'sniper0b' ) ],
				image1: [ sdWorld.CreateImageFromFile( 'sniper1' ), sdWorld.CreateImageFromFile( 'sniper1b' ) ],
				image2: [ sdWorld.CreateImageFromFile( 'sniper2' ), sdWorld.CreateImageFromFile( 'sniper2b' ) ],
				sound: 'gun_sniper',
				title: 'Sniper rifle',
				slot: 4,
				reload_time: 90,
				muzzle_x: 11,
				ammo_capacity: -1,
				count: 1,
				projectile_velocity: 16 * 2,
				matter_cost: 60,
				projectile_properties: { _damage: 105, _knock_scale:0.01 * 8, penetrating:true }
			},
			{
				image: sdWorld.CreateImageFromFile( 'sword' ),
				//sound: 'gun_medikit',
				title: 'Sword',
				image_no_matter: sdWorld.CreateImageFromFile( 'sword_disabled' ),
				slot: 0,
				reload_time: 8,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 1,
				projectile_velocity: 16 * 1.5,
				projectile_properties: { time_left: 1, _damage: 35, color: 'transparent', _knock_scale:0.025 * 8 }
			},
			{
				image: sdWorld.CreateImageFromFile( 'stimpack' ),
				sound: 'gun_defibrillator',
				title: 'Stimpack',
				sound_pitch: 0.5,
				slot: 7,
				reload_time: 30 * 3,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 1,
				matter_cost: 300,
				projectile_properties: { time_left: 2, _damage: 50, color: 'transparent', _return_damage_to_owner:true, _custom_target_reaction:( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCharacter ) )
						{
							target_entity.stim_ef = 30 * 10;
						}
					}
				}
			},
			{
				image: sdWorld.CreateImageFromFile( 'f_rifle' ),
				sound: 'gun_f_rifle',
				title: 'Assault Rifle C-01r',
				slot: 2,
				reload_time: 3,
				muzzle_x: 7,
				ammo_capacity: 35,
				spread: 0.02,
				count: 1,
				projectile_properties: { _damage: 25, color:'#afdfff' },
				spawnable: false
			},
			{
				image: sdWorld.CreateImageFromFile( 'triple_rail' ),
				sound: 'cube_attack',
				title: 'Cube-gun',
				slot: 4,
				reload_time: 3,
				muzzle_x: 7,
				ammo_capacity: -1,// 10, // 3
				count: 1,
				projectile_properties: { _rail: true, _damage: 15, color: '#62c8f2', _knock_scale:0.01 * 8 }, // 70
				spawnable: false
			},
			{
				image: sdWorld.CreateImageFromFile( 'sword' ),
				//sound: 'gun_medikit',
				title: 'Fists',
				image_no_matter: sdWorld.CreateImageFromFile( 'sword_disabled' ),
				slot: 0,
				reload_time: 8,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 1,
				projectile_velocity: 16 * 1.2,
				spawnable: false,
				projectile_properties: { time_left: 1, _damage: 15, color: 'transparent', _soft:true, _knock_scale:0.4, _custom_target_reaction:( bullet, target_entity )=>
					{
						//debugger;
						//if ( sdCom.com_creature_attack_unignored_classes.indexOf( target_entity.GetClass() ) !== -1 )
						if ( target_entity.GetClass() !== 'sdCharacter' )
						if ( target_entity.is_static || target_entity.GetBleedEffect() === sdEffect.TYPE_WALL_HIT )
						if ( target_entity.GetClass() !== 'sdBlock' || target_entity.material !== sdBlock.MATERIAL_GROUND )
						//if ( target_entity.material !== ''
						{
							bullet._owner.Damage( 5 );
						}
					},
					_custom_target_reaction_protected:( bullet, target_entity )=>
					{
						bullet._owner.Damage( 5 );
					}
				}
			},
			{
				image: sdWorld.CreateImageFromFile( 'sword2' ),
				//sound: 'gun_medikit',
				title: 'Saber',
				image_no_matter: sdWorld.CreateImageFromFile( 'sword2_disabled' ),
				slot: 0,
				reload_time: 10,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 1,
				matter_cost: 200,
				projectile_velocity: 20 * 1.5,
				projectile_properties: { time_left: 1, _damage: 60, color: 'transparent', _knock_scale:0.025 * 8 }
			}
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -4; }
	get hitbox_x2() { return 4; }
	get hitbox_y1() { return -3; }
	get hitbox_y2() { return 3; }
	
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
			
			if ( from_entity.is( sdCharacter ) )
			{
				if ( from_entity._ignored_guns.indexOf( this ) !== -1 )
				return;
			}
			
			if ( typeof from_entity._armor_protection_level === 'undefined' || this._dangerous_from === null || ( this._dangerous_from._upgrade_counters[ 'upgrade_damage' ] || 0 ) >= from_entity._armor_protection_level )
			{
				if ( from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD || from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
				{
					sdSound.PlaySound({ name:'player_hit', x:this.x, y:this.y, volume:0.5 });
				}

				sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect() });

				if ( this._dangerous_from && this._dangerous_from.is( sdCharacter ) )
				from_entity.Damage( sdGun.classes[ sdGun.CLASS_SWORD ].projectile_properties._damage * this._dangerous_from._damage_mult, this._dangerous_from );
				else
				from_entity.Damage( sdGun.classes[ sdGun.CLASS_SWORD ].projectile_properties._damage, this._dangerous_from );
			
				this.Damage( 1 );
			}
			else
			{
				sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });
			}
			
			this.dangerous = false;
			this._dangerous_from = null;
		}
	}
	
	IsTargetable() // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		return ( this._held_by === null );
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
		
		this._ammo_left = -123;
		
		this.ttl = params.ttl || sdGun.disowned_guns_ttl;
		this.extra = 0; // shard value will be here
		
		this.class = params.class || 0;
		
		if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
		this._hea = 5;
		else
		this._hea = 50;
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
				if ( sdWorld.inDist2D_Boolean( observer_character.x, observer_character.y, this.x, this.y ) < sdStorage.access_range )
				return true;
			}
			else
			if ( this._held_by.is( sdCharacter ) )
			if ( !this._held_by.ghosting || this._held_by.IsVisible( observer_character ) )
			if ( !this._held_by.driver_of )
			{
				return ( this._held_by.gun_slot === sdGun.classes[ this.class ].slot );
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
		//this._ammo_left = 0; // Bad because energy wastes this way
		
		
		sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.5 });
		
		this._held_by.reload_anim = 30;
	}
	
	GetBulletCost( return_infinity_on_build_tool_fail_placement=true )
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
				this._held_by.Say( sdCharacter.last_build_deny_reason );
				
				//console.log( 'say complete' );
				
				//this._held_by_unenforce();
				
				return Infinity; // Unable to place anyway
			}
		
			let cost = ent.MeasureMatterCost();
			
			
			ent.onRemove = ent.onRemoveAsFakeEntity; // Disable any removal logic
			ent.remove();
			ent._remove();
			
			//console.log('costs '+cost);
			
			//this._held_by_unenforce();
			
			return cost;
		}
		
		if ( this.class === sdGun.CLASS_SWORD )
		return 0;
		
		if ( this.class === sdGun.CLASS_SABER )
		return 2;
		
		if ( this.class === sdGun.CLASS_PISTOL )
		return 0;
		
		return ( Math.abs( sdGun.classes[ this.class ].projectile_properties._damage * this._held_by._damage_mult ) * sdGun.classes[ this.class ].count + 
				( sdGun.classes[ this.class ].projectile_properties._rail ? 30 : 0 ) + 
				( sdGun.classes[ this.class ].projectile_properties._explosion_radius > 0 ? 20 : 0 ) ) * sdWorld.damage_to_matter;
	}
	
	ReloadComplete()
	{
		if ( !this._held_by )
		return;
	
		if ( !sdWorld.is_server )
		return;
	
		// Upgrade for guns that used to work on magazine basis but no longer do:
		if ( sdGun.classes[ this.class ].ammo_capacity === -1 )
		this._ammo_left = -1;
	
		let ammo_to_spawn = sdGun.classes[ this.class ].ammo_capacity - this._ammo_left;
		let ammo_cost = this.GetBulletCost();
		
		while ( ammo_to_spawn > 0 && this._held_by.matter >= ammo_cost )
		{
			this._ammo_left++;
			ammo_to_spawn--;
			this._held_by.matter -= ammo_cost;
			
			//this._ammo_left = sdGun.classes[ this.class ].ammo_capacity;
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
	Shoot( background_shoot=0 ) // It becomes 1 when player holds shift
	{
		if ( this._held_by === null )
		{
			console.warn( 'Server logic error: Something calls .Shoot method of sdGun but sdGun has no owner - report this error if you understand how, when or why it happens.' );
			
			debugger;
			
			for ( var i = 0; i < sdWorld.sockets.length; i++ )
			sdWorld.sockets[ i ].emit( 'SERVICE_MESSAGE', 'Server logic error: Something calls .Shoot method of sdGun but sdGun has no owner - report this error if you understand how, when or why it happens.' );
		
			return false;
		}
			
		if ( this.reload_time_left <= 0 )
		{
			if ( this._ammo_left === -123 )
			{
				//this.ReloadComplete();
				this._ammo_left = sdGun.classes[ this.class ].ammo_capacity;
			}
			
			if ( this._ammo_left !== 0 )
			{
				if ( this._ammo_left > 0 ) // can be -1
				this._ammo_left--;
				else
				{
					let ammo_cost = this.GetBulletCost();
					
					if ( this._held_by.matter >= ammo_cost )
					{
						if ( sdWorld.is_server )
						this._held_by.matter -= ammo_cost;
					}
					else
					{
						if ( ammo_cost === Infinity )
						this._held_by.Say( 'Nothing to build or upgrade' );
						else
						if ( ammo_cost > this._held_by.matter_max )
						this._held_by.Say( 'Need matter capacity upgrade and more matter' );
						else
						this._held_by.Say( 'Need at least ' + Math.ceil( ammo_cost - this._held_by.matter ) + ' more matter' );
					
						return false;
					}
				}
				
				if ( sdGun.classes[ this.class ].sound )
				sdSound.PlaySound({ name:sdGun.classes[ this.class ].sound, x:this.x, y:this.y, volume:0.5, pitch: sdGun.classes[ this.class ].sound_pitch || 1 });
			
				this.reload_time_left = sdGun.classes[ this.class ].reload_time;
				
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

							let ent = this._held_by.CreateBuildObject( false );
							
							if ( this._held_by._build_params._category !== 'Development tests' )
							{

								if ( typeof ent.hmax !== 'undefined' )
								ent.Damage( ent.hmax * 0.9 ); // Start with low hp

								if ( typeof ent._hmax !== 'undefined' )
								ent.Damage( ent._hmax * 0.9 ); // Start with low hp
							}
						
							ent.onBuilt();

							sdEntity.entities.push( ent );
						}
					}
					
					let initial_an = this._held_by._an + this._held_by._side * ( Math.pow( this._held_by._recoil * 5, 2 ) / 5 );
					
					let count = sdGun.classes[ this.class ].count === undefined ? 1 : sdGun.classes[ this.class ].count;
					let spread = sdGun.classes[ this.class ].spread || 0;
					for ( let i = 0; i < count; i++ )
					{
						let bullet_obj = new sdBullet({ x: this._held_by.x, y: this._held_by.y + sdCharacter.bullet_y_spawn_offset });
						bullet_obj._owner = this._held_by;

						let an = initial_an + ( Math.random() * 2 - 1 ) * spread;
						
						let vel = 16;
						
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
						
						if ( bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ] )
						bullet_obj._armor_penetration_level = bullet_obj._owner._upgrade_counters[ 'upgrade_damage' ];
						else
						bullet_obj._armor_penetration_level = 0;
						
						bullet_obj._owner.Impulse( -bullet_obj.sx * 0.3 * bullet_obj._knock_scale, -bullet_obj.sy * 0.3 * bullet_obj._knock_scale );
						
						bullet_obj._owner._recoil += bullet_obj._knock_scale * vel * 0.01;

						bullet_obj._bg_shooter = background_shoot ? true : false;

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
	onThink( GSPEED ) // Class-specific, if needed
	{
		
		if ( !sdWorld.is_server )
		{
			let old_held_by = this._held_by;
			
			this._held_by = sdEntity.GetObjectByClassAndNetId( this.held_by_class, this.held_by_net_id );
			
			if ( old_held_by !== this._held_by )
			{
				if ( old_held_by )
				if ( old_held_by.is( sdCharacter ) )
				if ( old_held_by._inventory[ sdGun.classes[ this.class ].slot ] === this )
				old_held_by._inventory[ sdGun.classes[ this.class ].slot ] = null;
			}
			
			if ( this._held_by )
			if ( this._held_by.is( sdCharacter ) )
			{
				this._held_by._inventory[ sdGun.classes[ this.class ].slot ] = this;
			}
			
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
					sdWorld.sockets[ i ].emit( 'SERVICE_MESSAGE', 'Floating gun bug happened, please report what caused it. Gun is held by removed '+this._held_by.GetClass()+' ('+this._held_by.title+')' );
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
			
			if ( sdWorld.last_hit_entity )
			{
				this.tilt += -Math.sin( this.tilt / sdGun.tilt_scale * 2 ) * 0.4 * sdGun.tilt_scale;
			}
			else
			{
				this.tilt += this.sx * 10;
			}
			
			/*
			
			let new_x = this.x + this.sx * GSPEED;
			let new_y = this.y + this.sy * GSPEED;

			if ( sdWorld.CheckWallExists( new_x, new_y + this.hitbox_y2, this, [ 'sdCharacter', 'sdGun' ] ) )
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
		
			this.x = this._held_by.x;
			this.y = this._held_by.y;
			
			if ( typeof this._held_by.sx !== 'undefined' )
			{
				this.sx = this._held_by.sx;
				this.sy = this._held_by.sy;
			}
		}
	}
	Draw( ctx, attached )
	{
		if ( this._held_by === null || ( this._held_by !== null && attached ) )
		{
			var image = sdGun.classes[ this.class ].image;
			
			if ( this._held_by === null )
			ctx.rotate( this.tilt / sdGun.tilt_scale );
			
			if ( this.class === sdGun.CLASS_SNIPER )
			{
				let odd = ( this.reload_time_left % 10 ) < 5 ? 0 : 1;
				
				if ( this.reload_time_left > sdGun.classes[ this.class ].reload_time / 3 * 2 || ( this._held_by && this._held_by.matter - 1 < this.GetBulletCost() ) )
				image = sdGun.classes[ this.class ].image0[ odd ];
				else
				if ( this.reload_time_left > sdGun.classes[ this.class ].reload_time / 3 * 1 )
				image = sdGun.classes[ this.class ].image1[ odd ];
				else
				if ( this.reload_time_left > 0 )
				image = sdGun.classes[ this.class ].image2[ odd ];
			}
			if ( this.class === sdGun.CLASS_SWORD )
			{
				//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost() )
				if ( this._held_by === null && !this.dangerous )
				image = sdGun.classes[ this.class ].image_no_matter;
			}

			if ( this.class === sdGun.CLASS_SABER )
			{
				//if ( this._held_by === null || this._held_by.matter < this.GetBulletCost() )
				if ( this._held_by === null && !this.dangerous )
				image = sdGun.classes[ this.class ].image_no_matter;
			}

			if ( this.ttl >= 0 && this.ttl < 30 )
			ctx.globalAlpha = 0.5;
		
			if ( this.class === sdGun.CLASS_CRYSTAL_SHARD )
			{
				let v = this.extra / sdWorld.crystal_shard_value * 40;
				/*if ( v > 40 )
				ctx.filter = 'hue-rotate(' + ( v - 40 ) + 'deg)';*/
			
				ctx.filter = sdWorld.GetCrystalHue( v );
			}
			
			if ( this.class === sdGun.CLASS_SWORD )
			if ( this._held_by )
			{
				if ( this._held_by.fire_anim <= 0 )
				ctx.rotate( - Math.PI / 2 );
			}
			
			if ( this.class === sdGun.CLASS_SABER )
			if ( this._held_by )
			{
				if ( this._held_by.fire_anim <= 0 )
				ctx.rotate( - Math.PI / 2 );
			}

			
			ctx.drawImageFilterCache( image, - 16, - 16, 32,32 );
			
			ctx.filter = 'none';
			
			if ( this.muzzle > 2.5 )
			{
				ctx.drawImage( sdGun.img_muzzle2, sdGun.classes[ this.class ].muzzle_x - 16, - 16, 32,32 );
			}
			else
			if ( this.muzzle > 0 )
			{
				ctx.drawImage( sdGun.img_muzzle1, sdGun.classes[ this.class ].muzzle_x - 16, - 16, 32,32 );
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