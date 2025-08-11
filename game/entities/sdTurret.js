/*

	TODO: Turrets could change their behavior whenever they are connected to lost particle containers? Maybe even freezing barrels too

*/

/* global sdShop */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdSound from '../sdSound.js';

import sdCharacter from './sdCharacter.js';
//import sdPlayerDrone from './sdPlayerDrone.js';
import sdVirus from './sdVirus.js';
import sdQuickie from './sdQuickie.js';
import sdOctopus from './sdOctopus.js';
import sdCube from './sdCube.js';
import sdBomb from './sdBomb.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdAsp from './sdAsp.js';
import sdSandWorm from './sdSandWorm.js';
import sdSlug from './sdSlug.js';
import sdGrub from './sdGrub.js';
import sdEnemyMech from './sdEnemyMech.js';
import sdDrone from './sdDrone.js';
import sdBlock from './sdBlock.js';
import sdBadDog from './sdBadDog.js';
import sdShark from './sdShark.js';
import sdSpider from './sdSpider.js';
import sdTutel from './sdTutel.js';
import sdFaceCrab from './sdFaceCrab.js';
import sdSetrDestroyer from './sdSetrDestroyer.js';
import sdBiter from './sdBiter.js';
import sdAbomination from './sdAbomination.js';
import sdMimic from './sdMimic.js';
import sdGuanako from './sdGuanako.js';
import sdSensorArea from './sdSensorArea.js';

import sdMatterContainer from './sdMatterContainer.js';
import sdMatterAmplifier from './sdMatterAmplifier.js';
import sdCommandCentre from './sdCommandCentre.js';
import sdCrystalCombiner from './sdCrystalCombiner.js';
import sdCrystal from './sdCrystal.js';
import sdRescueTeleport from './sdRescueTeleport.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';
import sdTzyrgAbsorber from './sdTzyrgAbsorber.js';
import sdVeloxMiner from './sdVeloxMiner.js';
import sdZektaronDreadnought from './sdZektaronDreadnought.js';
import sdStealer from './sdStealer.js';
import sdCouncilIncinerator from './sdCouncilIncinerator.js';
import sdMeow from './sdMeow.js';

class sdTurret extends sdEntity
{
	static init_class()
	{
		sdTurret.img_no_matter = sdWorld.CreateImageFromFile( 'turret_no_matter' );
		
		sdTurret.img_turret = sdWorld.CreateImageFromFile( 'turret' );
		sdTurret.img_turret_fire = sdWorld.CreateImageFromFile( 'turret_fire' );
		
		sdTurret.img_turret2 = sdWorld.CreateImageFromFile( 'turret2' );
		sdTurret.img_turret2_fire = sdWorld.CreateImageFromFile( 'turret2_fire' );

		sdTurret.img_turret3 = sdWorld.CreateImageFromFile( 'turret3' );
		sdTurret.img_turret3_fire = sdWorld.CreateImageFromFile( 'turret3_fire' );

		sdTurret.img_turret4 = sdWorld.CreateImageFromFile( 'turret4' );
		sdTurret.img_turret4_fire = sdWorld.CreateImageFromFile( 'turret4_fire' );

		sdTurret.img_turret5 = sdWorld.CreateImageFromFile( 'turret5' );
		sdTurret.img_turret5_fire = sdWorld.CreateImageFromFile( 'turret5_fire' );

		sdTurret.img_turret6 = sdWorld.CreateImageFromFile( 'turret6' );
		sdTurret.img_turret6_fire = sdWorld.CreateImageFromFile( 'turret6_fire' );
		
		sdTurret.targetable_classes = new WeakSet( [ 
			sdCharacter, 
			sdVirus, 
			sdQuickie, 
			sdOctopus, 
			sdCube, 
			//sdBomb, 
			sdAsp, 
			sdSandWorm, 
			sdSlug, 
			sdGrub, 
			sdGuanako, 
			sdShark, 
			sdEnemyMech, 
			sdDrone, 
			sdBadDog, 
			sdShark, 
			sdSpider, 
			sdTutel,
			sdFaceCrab,
			sdSetrDestroyer,
			sdWorld.entity_classes.sdOverlord,
			sdWorld.entity_classes.sdPlayerDrone,
			sdWorld.entity_classes.sdAmphid,
			sdWorld.entity_classes.sdPlayerOverlord,
			sdBiter,
			sdAbomination,
			sdMimic,
			sdTzyrgAbsorber,
			sdVeloxMiner,
			sdWorld.entity_classes.sdShurgTurret,
			sdZektaronDreadnought,
			sdStealer,
			sdCouncilIncinerator,
			sdMeow
			
		] ); // Module random load order that causes error prevention
		
		sdTurret.KIND_LASER = 0;
		sdTurret.KIND_ROCKET = 1;
		sdTurret.KIND_RAPID_LASER = 2;
		sdTurret.KIND_SNIPER = 3;
		sdTurret.KIND_FREEZER = 4;
		sdTurret.KIND_ZAP = 5;
		sdTurret.KIND_LASER_PORTABLE = 6;
		
		sdTurret.matter_capacity = 40; // Was 20, but new cable logic makes entities with 20 or less matter to be ignored
		
		sdTurret.portable_fake_com = { _net_id: 0, subscribers:[ 'sdCharacter', 'sdPlayerDrone' ] };
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -this.GetSize(); }
	get hitbox_x2() { return this.GetSize(); }
	get hitbox_y1() { return -this.GetSize(); }
	get hitbox_y2() { return this.GetSize(); }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ 
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		return false;
		
		return true; 
	}
	IsAttachableToSteeringWheel()
	{
		return ( this.kind !== sdTurret.KIND_LASER_PORTABLE );
	}
	
	get title()
	{
		if ( this.kind === sdTurret.KIND_LASER )
		return ('Automatic laser turret');
		if ( this.kind === sdTurret.KIND_ROCKET )
		return ('Automatic missile turret');
		if ( this.kind === sdTurret.KIND_RAPID_LASER )
		return ('Automatic rapid laser turret');
		if ( this.kind === sdTurret.KIND_SNIPER )
		return ('Automatic sniper turret');
		if ( this.kind === sdTurret.KIND_FREEZER )
		return ('Automatic freezing turret');
		if ( this.kind === sdTurret.KIND_ZAP )
		return ('Automatic zapper turret');
	
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		return ('Portable automatic laser turret');

		return ('Automatic turret');
	}
	get description()
	{
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		return `Automatic portable turrets require matter source nearby, such as crystals.`;
		else
		return `Automatic turrets require matter and cable connection with access management node. Access management node specifies which entities turrets won't be attacking.`;
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return !this.is_static; }
	
	GetComWiredCache( ...args ) // Cretes .cio property for clients to know if com exists
	{
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		return sdTurret.portable_fake_com;
		
		return super.GetComWiredCache( ...args );
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._hea > 0 )
		{
			dmg = Math.abs( dmg );
			
			if ( initiator )
			if ( initiator.is( sdTurret ) )
			{
				if ( this.GetComWiredCache() === initiator.GetComWiredCache() )
				{
					dmg *= 0.1; // Make same base turrets less probably to break each other
				}
			}
			
			this._hea -= dmg;
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this.kind = params.kind || 0;
		this.type = params.type || 0; // 0 = default SD turrets which need com nodes to work, 1 = faction base turrets which work without com nodes and matter source, target anything but their own faction.
		this._ai_team = params._ai_team || 0; // AI Team, used in faction base / outpost turrets to determine friend from foe
		
		//this._is_cable_priority = true;
		
		this._hmax = ( ( this.kind === sdTurret.KIND_RAPID_LASER || 
						 this.kind === sdTurret.KIND_SNIPER || 
						 this.kind === sdTurret.KIND_FREEZER ) ? 200 : 100 ) * 4;
				 
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		this._hmax = 200;
	
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._owner = params.owner || null;
		
		this.an = 0;
		
		this.sx = 0;
		this.sy = 0;
		
		this.auto_attack = -1; // Angle ID according to sdNode
		this._auto_attack_reference = null;
		
		this._seek_timer = Math.random() * 15;
		this.fire_timer = 0;
		this._target = null;
		
		this._sensor_detected_entities = new Set();
		this._sensor_area = null;
		
		this._considered_target = null; // What target is being considered. Used for filtering to allow attacking through unknown walls

		this.disabled = false; // If hit by EMP, set the turret in sleep mode but allow hp regen
		this._disabled_timeout = 0; // Countdown timer when disabled
		
		//this._coms_near_cache = [];
		
		//this.matter = params.matter || 0;
		//this._matter_max = params.matter_max || 20;
		
		this.matter = 0;
		this._matter_max = sdTurret.matter_capacity;
		
		this.lvl = 0;
		
		this._time_amplification = 0;
		
		this.SetMethod( 'ShootPossibilityFilter', this.ShootPossibilityFilter ); // Here it used for "this" binding so method can be passed to collision logic
	}
	onSnapshotApplied() // To override
	{
		this._matter_max = sdTurret.matter_capacity;
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_auto_attack_reference' || prop === '_sensor_area' ) return true;

		return false;
	}
	
	IsLegitimateTarget( e, com_near=null, skip_raycast=true )
	{
		//let com_near = this.GetComWiredCache();
		
		function RuleAllowedByNodes( c )
		{
			if ( !com_near ) // This can only happen on sensor callback when turret was just made and wasn't connected to com node
			return true;
			
			if ( com_near.subscribers.indexOf( c ) !== -1 )
			return false;

			return true;
		}

		const targetable_classes = sdTurret.targetable_classes;
						
		const range = this.GetTurretRange();
		
		let [ cx, cy ] = e.GetClosestPointWithinCollision( this.x, this.y );
		
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, cx, cy, range ) )
		if ( targetable_classes.has( e.constructor ) )
		if ( 
				( !e._is_being_removed ) &&
				( e.hea || e._hea ) > 0 && 
				( !e.is( sdSandWorm ) || e.death_anim === 0 ) && 
				( !e.is( sdMimic ) || e.morph < 100 ) && 
				( e._frozen < 10 || this.kind !== sdTurret.KIND_FREEZER ) &&
				( typeof e.held_by === 'undefined' || e.held_by === null )
			)
		{
			if ( this.type === 1 )
			{
				if ( ( e.is( sdCharacter ) && e._ai_team === this._ai_team ) || ( e.is( sdDrone ) && e._ai_team === this._ai_team ) )
				return false;
				else
				{
					this._considered_target = e;
					
					if ( skip_raycast )
					if ( !this._is_being_removed )
					if ( this._hiberstate !== sdEntity.HIBERSTATE_ACTIVE )
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

					//if ( skip_raycast || sdWorld.CheckLineOfSight( this.x, this.y, e.x, e.y, this, null, [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier', 'sdCommandCentre', 'sdCrystalCombiner', 'sdTurret', 'sdCrystal', 'sdRescueTeleport' ], this.ShootPossibilityFilter ) )
					if ( skip_raycast || sdWorld.CheckLineOfSight( this.x, this.y, e.x, e.y, this, null, null, this.ShootPossibilityFilter ) )
					return true;
				}
			}
			else
			{
				if ( !e.is( sdBadDog ) || !e.owned )
				if ( e.IsPlayerClass() || e.IsVisible( this ) || ( e.driver_of && !e.driver_of._is_being_removed && e.driver_of.IsVisible( this ) ) )
				{
					var is_char = e.IsPlayerClass();
					
					if ( is_char )
					{
						if ( !e.IsHostileAI() && e._ai_enabled > 0  ) // Is this AI friendly?
						return false;
					}

					if ( ( is_char && e.IsHostileAI() ) || ( ( !is_char || ( RuleAllowedByNodes( e._net_id ) && RuleAllowedByNodes( e.biometry ) ) ) && RuleAllowedByNodes( e.GetClass() ) ) )
					{
						if ( is_char && ( is_char._god && !e.IsVisible() ) )
						{
						}
						else
						{
							this._considered_target = e;
					
							if ( skip_raycast )
							if ( !this._is_being_removed )
							if ( this._hiberstate !== sdEntity.HIBERSTATE_ACTIVE )
							this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

							//if ( skip_raycast || sdWorld.CheckLineOfSight( this.x, this.y, e.x, e.y, this, null, [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier', 'sdCommandCentre', 'sdCrystalCombiner', 'sdTurret', 'sdCrystal', 'sdRescueTeleport' ], this.ShootPossibilityFilter ) )
							if ( skip_raycast || sdWorld.CheckLineOfSight( this.x, this.y, e.x, e.y, this, null, null, this.ShootPossibilityFilter ) || sdWorld.last_hit_entity === e ) // sdOctopus and larger entities will block vision like this
							return true;
						}
					}
				}
			}
		}
		
		return false;
	}
	
	SensorAreaMovementCallback( from_entity )
	{
		let will_attack = this.IsLegitimateTarget( from_entity );
		
		if ( will_attack )
		this._sensor_detected_entities.add( from_entity );
		else
		this._sensor_detected_entities.delete( from_entity );
	}
	
	
	GetShootCost()
	{
		var dmg = 1;
		
		var dmg_mult = 1 + this.lvl / 3;
		
		var count = 1;
		
		var is_rail = false;
		
		var explosion_radius = 0;
		
		let _temperature_addition = 0;
		
		if ( this.kind === sdTurret.KIND_LASER || this.kind === sdTurret.KIND_RAPID_LASER || this.kind === sdTurret.KIND_LASER_PORTABLE )
		dmg = 15;
	
		if ( this.kind === sdTurret.KIND_SNIPER )
		dmg = 85;
	
		if ( this.kind === sdTurret.KIND_ZAP )
		dmg = 100;
	
		if ( this.kind === sdTurret.KIND_ROCKET )
		{
			dmg = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties._damage;
			explosion_radius = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.explosion_radius;
		}
	
		if ( this.kind === sdTurret.KIND_FREEZER )
		{
			dmg = 1;
			_temperature_addition = -50;
		}
			
		//return m * 0.1;

		if ( this.type === 1 ) // Faction base / outpost turrets
		return 0;
	
		let projectile_properties = {
			_damage: dmg,
			_rail: is_rail,
			explosion_radius: explosion_radius
		};
	
		return 2 * sdGun.GetProjectileCost( projectile_properties, 1, _temperature_addition );
		/*
		return ( Math.abs( dmg * dmg_mult ) * count + 
				( is_rail ? 30 : 0 ) + 
				( explosion_radius > 0 ? 20 : 0 ) ) * sdWorld.damage_to_matter;*/
	}
	
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	onThinkFrozen( GSPEED )
	{
		if ( !this.is_static ) // Likely is capable of falling
		{
			this.sy += sdWorld.gravity * GSPEED;
			
			this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1 ); // Extra fragility is buggy
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		GSPEED = sdGun.HandleTimeAmplification( this, GSPEED );
		
		let can_hibernate = false;
		
		if ( this._disabled_timeout > 0 )
		this._disabled_timeout -= GSPEED;
		else
		if ( this.disabled )
		this.disabled = false;
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		{
			can_hibernate = true;
		}
		
		if ( this.is_static )
		{
			this.sx = 0;
			this.sy = 0;
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			
			if ( this._phys_sleep > 0 )
			can_hibernate = false;
			//can_hibernate = can_hibernate && ( this._phys_sleep <= 0 );
		}
		
		if ( this.fire_timer > 0 )
		this.fire_timer = Math.max( 0, this.fire_timer - GSPEED );
		
		if ( sdWorld.is_server )
		{
			if ( this.matter > this.GetShootCost() || this.type === 1 )
			{
				//can_hibernate = false;
				
				let range = this.GetTurretRange();
					
				if ( this._sensor_area && !this._sensor_area._is_being_removed )
				{
					if ( this._sensor_area.x !== this.x - range || this._sensor_area.y !== this.y - range )
					{
						this._sensor_area.x = this.x - range;
						this._sensor_area.y = this.y - range;
						this._sensor_area._update_version++;
						this._sensor_area.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
					}
				}
				else
				{
					this._sensor_area = new sdSensorArea({ x: this.x-range, y: this.y-range, w: range*2, h: range*2, on_movement_target: this });
					sdEntity.entities.push( this._sensor_area );
				}
				
				
				
				if ( this._seek_timer <= 0 && this.disabled === false )
				{
					this._seek_timer = 10 + Math.random() * 10;

					this._target = null;

					let com_near = this.GetComWiredCache();

					if ( this.auto_attack >= 0 )
					{
						can_hibernate = false;
					}
					else
					if ( ( com_near && this.type === 0 ) || this.type === 1 )
					{
						let target_set = this._sensor_detected_entities;

						for ( let e of target_set )
						{
							if ( this.IsLegitimateTarget( e, com_near, false ) )
							{
								can_hibernate = false;
								this._target = e;
								break;
							}
							else
							{
								target_set.delete( e );
								continue;
							}
						}
					}
					else
					{
						can_hibernate = true;
					}
					
				}
				else
				{
					this._seek_timer -= GSPEED;
					can_hibernate = false;
				}

				if ( ( this._target !== null || this.auto_attack >= 0 ) && this.disabled === false )
				{
					let vel = ( this.kind === sdTurret.KIND_SNIPER ) ? 30 : 15;
					
					if ( this.kind === sdTurret.KIND_ZAP )
					{
						vel = 10;
					}

					if ( this.auto_attack >= 0 )
					{
						if ( this._auto_attack_reference )
						{
							if ( this._auto_attack_reference._is_being_removed )
							{
								this._auto_attack_reference = null;
								this.auto_attack = -1;
							}
							else
							{
								this.auto_attack = this._auto_attack_reference.variation;
							}
						}
						
						this.an = ( -Math.PI / 2 + this.auto_attack / 8 * Math.PI * 2 ) * 100;
					}
					else
					{
						let di = sdWorld.Dist2D( this.x, this.y, this._target.x, this._target.y );

						if ( this.kind === sdTurret.KIND_ROCKET )
						vel = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_velocity;

						if ( this.kind === sdTurret.KIND_ZAP )
						this.an = Math.atan2( 
							this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2 - this.y, 
							this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2 - this.x ) * 100;
						else
						this.an = Math.atan2( 
							this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2 + this._target.sy * di / vel - this.y, 
							this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2 + this._target.sx * di / vel - this.x ) * 100;
					}

					if ( this.fire_timer <= 0 )
					{
						this.matter -= this.GetShootCost();
						this.WakeUpMatterSources();
						
						if ( this.kind === sdTurret.KIND_LASER || this.kind === sdTurret.KIND_RAPID_LASER || this.kind === sdTurret.KIND_LASER_PORTABLE )
						sdSound.PlaySound({ name:'turret', x:this.x, y:this.y, volume:0.5, pitch: 1 / ( 1 + this.lvl / 3 ) });
					
						if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
						{
							let an = this.an / 100;
							let shell_vel = -1.5;
							sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_SHELL, sx:Math.sin( an ) * shell_vel, sy:Math.cos( an ) * shell_vel - 0.5, rotation: Math.PI / 2 - an });
						}
						
					
						if ( this.kind === sdTurret.KIND_SNIPER )
						sdSound.PlaySound({ name:'gun_sniper', x:this.x, y:this.y, volume:0.5, pitch: 1 / ( 1 + this.lvl / 3 ) });
					
						if ( this.kind === sdTurret.KIND_ROCKET )
						sdSound.PlaySound({ name:sdGun.classes[ sdGun.CLASS_ROCKET ].sound, x:this.x, y:this.y, volume:0.5, pitch: 1 / ( 1 + this.lvl / 3 ) });
					
						if ( this.kind === sdTurret.KIND_FREEZER )
						sdSound.PlaySound({ name:'gun_spark', x:this.x, y:this.y, volume:0.5, pitch: 1 / ( 1 + this.lvl / 3 ) });

						if ( this.kind === sdTurret.KIND_ZAP )
						sdSound.PlaySound({ name:'bsu_attack', x:this.x, y:this.y, volume:0.75, pitch: 1 / ( 1 + this.lvl / 3 ) });

						let bullet_obj = new sdBullet({ x: this.x, y: this.y });

						bullet_obj._owner = this;

						bullet_obj.sx = Math.cos( this.an / 100 );
						bullet_obj.sy = Math.sin( this.an / 100 );
						
						bullet_obj._armor_penetration_level = 3; // Prevent damaging world in arena but also prevent damage to workbench

						//bullet_obj.x += bullet_obj.sx * 5;
						//bullet_obj.y += bullet_obj.sy * 5;

						bullet_obj.sx *= vel;
						bullet_obj.sy *= vel;

						this.fire_timer = this.GetReloadTime();

						if ( this.kind === sdTurret.KIND_LASER || this.kind === sdTurret.KIND_RAPID_LASER || this.kind === sdTurret.KIND_LASER_PORTABLE )
						{
							bullet_obj._damage = 15;
							bullet_obj.color = '#ff0000';
						}
						if ( this.kind === sdTurret.KIND_ZAP )
						{
							bullet_obj._damage = 100;
							bullet_obj.color = '#ffffff';
							bullet_obj._rail = true;
							bullet_obj._rail_zap = true;
							
							bullet_obj.time_left = this.GetTurretRange() / vel;
							
							let px = Math.cos( this.an / 100 );
							let py = Math.sin( this.an / 100 );
							
							bullet_obj._custom_target_reaction = ( bullet, target_entity )=>
							{
								if ( typeof target_entity._matter !== 'undefined' )
								target_entity._matter = Math.max( 0, target_entity._matter - 300 );

								if ( typeof target_entity.matter !== 'undefined' )
								target_entity.matter = Math.max( 0, target_entity.matter - 300 );
								
								target_entity.Impulse( px * 800, py * 800 );
							};
						}
						if ( this.kind === sdTurret.KIND_SNIPER )
						{
							bullet_obj._damage = 85;
							bullet_obj.color = '#ff00ff';
							bullet_obj.penetrating = true;
						}
						if ( this.kind === sdTurret.KIND_ROCKET )
						{
							bullet_obj._damage = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties._damage;

							bullet_obj.explosion_radius = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.explosion_radius;
							bullet_obj.model = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.model;

							bullet_obj.color = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.color;

							bullet_obj.ac = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.ac;

							if ( bullet_obj.ac > 0 )
							{
								bullet_obj.acx = Math.cos( this.an / 100 );
								bullet_obj.acy = Math.sin( this.an / 100 );
							}
						}
						if ( this.kind === sdTurret.KIND_FREEZER )
						{
							bullet_obj._damage = 1;

							bullet_obj.model = 'ball';
							
							bullet_obj._temperature_addition = -50;
						}
						
						bullet_obj._damage *= 1 + this.lvl / 3;
						bullet_obj._temperature_addition *= 1 + this.lvl / 3;

						sdEntity.entities.push( bullet_obj );
					}

					this._update_version++;
				}
				else
				{
					if ( this.fire_timer > 0 )
					{
						this.fire_timer = Math.max( 0, this.fire_timer - GSPEED );
						this._update_version++;
						
						can_hibernate = false;
					}
				}
			}
		}
		
		if ( sdWorld.is_server )
		if ( can_hibernate && this.fire_timer <= 0 )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
	}
	ShootPossibilityFilter( ent )
	{
		if ( this._com_near_cache )
		if ( this._com_near_cache.through_walls )
		if ( this._considered_target.IsPlayerClass() )
		if ( !ent._shielded || ent._shielded._is_being_removed )
		return false;
		
		if ( ent.is( sdBlock ) )
		if ( ( ent.material === sdBlock.MATERIAL_TRAPSHIELD && sdBullet.IsTrapShieldIgonred( this, ent ) ) || ent.texture_id === sdBlock.TEXTURE_ID_CAGE )
		return false;

		if ( ent.is( sdMatterContainer ) )
		return false;

		if ( ent.is( sdMatterAmplifier ) )
		return false;

		if ( ent.is( sdCommandCentre ) )
		return false;

		if ( ent.is( sdCrystalCombiner ) )
		return false;

		if ( ent.is( sdTurret ) )
		return false;

		if ( ent.is( sdCrystal ) )
		return false;

		if ( ent.is( sdRescueTeleport ) )
		return false;

		if ( ent.is( sdLongRangeTeleport ) )
		return false;
		
		return true;
	}
	GetReloadTime()
	{
		if ( this.kind === sdTurret.KIND_LASER || this.kind === sdTurret.KIND_LASER_PORTABLE )
		return 10;
		if ( this.kind === sdTurret.KIND_ROCKET )
		return sdGun.classes[ sdGun.CLASS_ROCKET ].reload_time;
		if ( this.kind === sdTurret.KIND_RAPID_LASER )
		return 5; // Twice as fast than regular laser
		if ( this.kind === sdTurret.KIND_SNIPER )
		return sdGun.classes[ sdGun.CLASS_SNIPER ].reload_time;
		if ( this.kind === sdTurret.KIND_FREEZER )
		return 30;
		if ( this.kind === sdTurret.KIND_ZAP )
		return 20;
	
		return 30;
	}
	GetSize()
	{
		if ( this.kind === sdTurret.KIND_LASER )
		return 3;
		if ( this.kind === sdTurret.KIND_ROCKET || this.kind === sdTurret.KIND_FREEZER )
		return 6;
		if ( this.kind === sdTurret.KIND_RAPID_LASER || this.kind === sdTurret.KIND_SNIPER || this.kind === sdTurret.KIND_ZAP )
		return 4;
	
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		return 6;
	
		return 2;
	}
	GetTurretRange()
	{
		//if ( this.kind === sdTurret.KIND_RAPID_LASER || this.kind === sdTurret.KIND_SNIPER )
		if ( this.kind === sdTurret.KIND_SNIPER )
		return 450;
		
		if ( this.kind === sdTurret.KIND_ZAP )
		return 120;
	
		//if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		//return 300;
		
		return 300 + this.lvl * 50; // 450 when upgraded
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.type === 0 )
		{
			if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
			sdEntity.TooltipUntranslated( ctx, T( this.title ) + ' ( '+ ~~(this.matter)+' / '+this._matter_max+' )' );
			else
			sdEntity.TooltipUntranslated( ctx, T( this.title ) + ' ( level ' + this.lvl + ', '+ ~~(this.matter)+' / '+this._matter_max+' )' );
		}
		else
		sdEntity.TooltipUntranslated( ctx, T( this.title ) );

		//this.DrawConnections( ctx );
	}
	get mass() { return this.is_static ? 100 : 60; }
	IsPhysicallyMovable()
	{
		return !this.is_static;
	}
	Impulse( x, y )
	{
		if ( this.is_static )
		{
		}
		else
		{
			this.sx += x / this.mass;
			this.sy += y / this.mass;
		}
	}
	Draw( ctx, attached )
	{
		var not_firing_now = ( this.fire_timer < this.GetReloadTime() - 2.5 );
		
		let com_near = this.GetComWiredCache();
		
		let dimmed = false;
		
		if ( !sdShop.isDrawing )
		if ( this.disabled || this.matter < this.GetShootCost() || ( !com_near && this.type === 0 && this.auto_attack === -1 ) )
		{
			ctx.filter = 'brightness(0.1)';
			not_firing_now = true;
			
			dimmed = true;
		}
		
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE ) // A
		{
			if ( Math.cos( this.an / 100 ) > 0 )
			ctx.scale( -1, 1 );
			
			ctx.drawImageFilterCache( sdBadDog.img_portable_turret, 0,0,32,32, -16, -16, 32,32 );
		}
		
		if ( this.kind === sdTurret.KIND_ZAP )
		{
			if ( !dimmed )
			ctx.apply_shading = false;
		}
		else
		ctx.rotate( this.an / 100 );
		
		if ( !not_firing_now )
		ctx.apply_shading = false;
		
		if ( this.kind === sdTurret.KIND_LASER )
		ctx.drawImageFilterCache( not_firing_now ? sdTurret.img_turret : sdTurret.img_turret_fire, -16, -16, 32,32 );
	
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE ) // B
		{
			if ( Math.cos( this.an / 100 ) > 0 )
			{
				ctx.rotate( -this.an / 100 );
				ctx.rotate( -this.an / 100 );
			}
			else
			{
				ctx.rotate( Math.PI );
			}
			
			ctx.drawImageFilterCache( sdBadDog.img_portable_turret, not_firing_now ? 32 : 64,0,32,32, -16, -16, 32,32 );
		}
	
		if ( this.kind === sdTurret.KIND_ROCKET )
		ctx.drawImageFilterCache( not_firing_now ? sdTurret.img_turret2 : sdTurret.img_turret2_fire, -16, -16, 32,32 );

		if ( this.kind === sdTurret.KIND_RAPID_LASER )
		ctx.drawImageFilterCache( not_firing_now ? sdTurret.img_turret3 : sdTurret.img_turret3_fire, -16, -16, 32,32 );

		if ( this.kind === sdTurret.KIND_SNIPER )
		ctx.drawImageFilterCache( not_firing_now ? sdTurret.img_turret4 : sdTurret.img_turret4_fire, -16, -16, 32,32 );
	
		if ( this.kind === sdTurret.KIND_FREEZER )
		ctx.drawImageFilterCache( not_firing_now ? sdTurret.img_turret5 : sdTurret.img_turret5_fire, -16, -16, 32,32 );
	
		if ( this.kind === sdTurret.KIND_ZAP )
		ctx.drawImageFilterCache( not_firing_now ? sdTurret.img_turret6 : sdTurret.img_turret6_fire, -16, -16, 32,32 );
	
		ctx.filter = 'none';
		
		if ( !sdShop.isDrawing )
		if ( sdWorld.time % 4000 < 2000 )
		if ( this.matter < this.GetShootCost() || !com_near )
		ctx.drawImageFilterCache( sdTurret.img_no_matter, -16, -16, 32,32 );
	}
	MeasureMatterCost()
	{
		if ( this.kind === sdTurret.KIND_LASER )
		return ~~( 100 * sdWorld.damage_to_matter + 150 );
		
		if ( this.kind === sdTurret.KIND_ROCKET )
		return ~~( 100 * sdWorld.damage_to_matter + 300 );

		if ( this.kind === sdTurret.KIND_RAPID_LASER )
		return ~~( 100 * sdWorld.damage_to_matter + 450 );

		if ( this.kind === sdTurret.KIND_SNIPER )
		return ~~( 100 * sdWorld.damage_to_matter + 600 );

		if ( this.kind === sdTurret.KIND_FREEZER )
		return ~~( 100 * sdWorld.damage_to_matter + 600 );

		if ( this.kind === sdTurret.KIND_ZAP )
		return ~~( 100 * sdWorld.damage_to_matter + 1000 );
	
		if ( this.kind === sdTurret.KIND_LASER_PORTABLE )
		return 60;
	}
	onRemove()
	{
		this._considered_target = null;
		this._target = null;
		
		this._sensor_detected_entities = null;
		
		if ( this._sensor_area )
		if ( sdWorld.is_server ) // Will break visibility for admin
		{
			this._sensor_area.remove();
			this._sensor_area = null;
		}
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	
	RequireSpawnAlign()
	{ return this.is_static; }
	get spawn_align_x(){ return 4; };
	get spawn_align_y(){ return 4; };
	
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		//if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( this.kind !== sdTurret.KIND_LASER_PORTABLE )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 128 ) )
			{
				if ( command_name === 'UPGRADE' || command_name === 'UPGRADE_MAX' )
				{
					let upgrades_to_do = ( command_name === 'UPGRADE_MAX' ) ? 3 : 1;
					
					let upgraded = false;
					
					while ( upgrades_to_do > 0 )
					{
						upgrades_to_do--;
						
						if ( this.lvl < 3 )
						{
							if ( exectuter_character.matter >= 100 )
							{
								upgraded = true;

								this.lvl += 1;
								exectuter_character.matter -= 100;

								this._update_version++;
							}
							else
							{
								executer_socket.SDServiceMessage( 'Not enough matter' );
								break;
							}
						}
						else
						{
							break;
						}
					}
					
					if ( upgraded )
					sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });
					else
					executer_socket.SDServiceMessage( 'Turret is at maximum level' );
				}
			}
			else
			executer_socket.SDServiceMessage( 'Turret is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		//if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 128 ) )
		if ( this.kind !== sdTurret.KIND_LASER_PORTABLE )
		{
			if ( this.lvl < 3 )
			{
				this.AddContextOption( 'Upgrade damage to level 3 ('+ (3-this.lvl)*100 +' matter)', 'UPGRADE_MAX', [] );
				this.AddContextOption( 'Upgrade damage (100 matter)', 'UPGRADE', [] );
			}
			else
			this.AddContextOption( '- no upgrades available -', 'UPGRADE', [] );
		}
	}
}
//sdTurret.init_class();

export default sdTurret;
