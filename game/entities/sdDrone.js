
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdGib from './sdGib.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCube from './sdCube.js';
import sdCharacter from './sdCharacter.js';
import sdSpider from './sdSpider.js';
import sdJunk from './sdJunk.js';
import sdCrystal from './sdCrystal.js';
import sdLost from './sdLost.js';
//import sdPlayerSpectator from './sdPlayerSpectator.js';

import sdPathFinding from '../ai/sdPathFinding.js';

class sdDrone extends sdEntity
{
	static init_class()
	{
		sdDrone.img_drone_falkok = sdWorld.CreateImageFromFile( 'drone_falkok_sprite2' ); // Sprite by gravel/flora/floor
		sdDrone.img_drone_erthal = sdWorld.CreateImageFromFile( 'drone_erthal' );

		sdDrone.img_drone_falkok2 = sdWorld.CreateImageFromFile( 'drone_falkok_sprite3' ); // Sprite by gravel/flora/floor

		// Maybe we should make sprite sheets too for "sdPlayerDrone"s? - Molis
		sdDrone.img_drone_robot = sdWorld.CreateImageFromFile( 'drone_robot2' );
		sdDrone.img_drone_robot_attack = sdWorld.CreateImageFromFile( 'drone_robot_attack2' );
		sdDrone.img_drone_robot_destroyed = sdWorld.CreateImageFromFile( 'drone_robot_destroyed2' );
		sdDrone.img_drone_robot_hurt = sdWorld.CreateImageFromFile( 'drone_robot_hurt' );

		sdDrone.img_sarronian_drone1 = sdWorld.CreateImageFromFile( 'sarronian_drone1' ); // By Gravel
		sdDrone.img_sarronian_drone2 = sdWorld.CreateImageFromFile( 'sarronian_drone2' ); // By Gravel
		sdDrone.img_sarronian_drone3 = sdWorld.CreateImageFromFile( 'sarronian_drone3' ); // By Gravel
		sdDrone.img_sarronian_drone4 = sdWorld.CreateImageFromFile( 'sarronian_drone4' ); // By Ghost581
		sdDrone.img_sarronian_drone5 = sdWorld.CreateImageFromFile( 'sarronian_drone5' ); // By Ghost581

		sdDrone.img_zektaron_drone1 = sdWorld.CreateImageFromFile( 'zektaron_drone1' ); // By Gravel
		sdDrone.img_zektaron_drone2 = sdWorld.CreateImageFromFile( 'zektaron_drone2' ); // By Ghost581
		sdDrone.img_zektaron_drone3 = sdWorld.CreateImageFromFile( 'zektaron_drone3' ); // By LordBored

		sdDrone.img_drone_council = sdWorld.CreateImageFromFile( 'drone_council_sprite' );
		sdDrone.img_drone_council2 = sdWorld.CreateImageFromFile( 'drone_council_sprite2' );
		sdDrone.img_drone_setr = sdWorld.CreateImageFromFile( 'drone_setr_sprite' );

		sdDrone.img_drone_tzyrg = sdWorld.CreateImageFromFile( 'drone_tzyrg_sprite' ); // By floor/flora/Gravel
		sdDrone.img_drone_tzyrg2 = sdWorld.CreateImageFromFile( 'drone_tzyrg2_sprite' ); // By floor/flora/Gravel
		
		sdDrone.img_cut_droid = sdWorld.CreateImageFromFile( 'sdCutDroid' );

		sdDrone.img_drone_sd_bg = sdWorld.CreateImageFromFile( 'drone_sd_bg' ); // SD-Bulky Gunner drone, for tasks
		
		sdDrone.death_duration = 15;
		sdDrone.post_death_ttl = 30 * 10;
		
		sdDrone.max_seek_range = 1000;
		
		sdDrone.drones = []; // This way we can limit it to a count per faction rather than just "total" count

		sdDrone.DRONE_FALKOK = 1;
		sdDrone.DRONE_ERTHAL = 2;
		sdDrone.DRONE_SARRONIAN = 3;
		sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER = 4;
		sdDrone.DRONE_SARRONIAN_DETONATOR = 5;
		sdDrone.DRONE_COUNCIL = 6;
		sdDrone.DRONE_SETR = 7;
		sdDrone.DRONE_TZYRG = 8;
		sdDrone.DRONE_TZYRG_WATCHER = 9;
		sdDrone.DRONE_FALKOK_RAIL = 10;
		sdDrone.DRONE_CUT_DROID = 11;
		sdDrone.DRONE_SARRONIAN_REPAIR_DRONE = 12;
		sdDrone.DRONE_SARRONIAN_GAUSS = 13;
		sdDrone.DRONE_ZEKTARON = 14;
		sdDrone.DRONE_ZEKTARON_CORVETTE = 15;
		sdDrone.DRONE_ZEKTARON_HUNTER = 16;
		sdDrone.DRONE_SD_BG = 17;
		sdDrone.DRONE_COUNCIL_ATTACK = 18;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( this.type === sdDrone.DRONE_SD_BG ) ? -16 : ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER ) ? -18 :
		( this.type === sdDrone.DRONE_SARRONIAN_GAUSS ||this.type === sdDrone.DRONE_SARRONIAN || this.type === sdDrone.DRONE_TZYRG_WATCHER || this.type === sdDrone.DRONE_ZEKTARON_HUNTER || this.type === sdDrone.DRONE_ZEKTARON_CORVETTE ) ? -11 :
		( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_FALKOK_RAIL ) ? -10 : -6; 
	}
	get hitbox_x2() { return ( this.type === sdDrone.DRONE_SD_BG ) ? 16 : ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER ) ? 18 :
		( this.type === sdDrone.DRONE_SARRONIAN_GAUSS || this.type === sdDrone.DRONE_SARRONIAN || this.type === sdDrone.DRONE_TZYRG_WATCHER || this.type === sdDrone.DRONE_ZEKTARON_HUNTER || this.type === sdDrone.DRONE_ZEKTARON_CORVETTE ) ? 11 :
		( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_FALKOK_RAIL ) ? 10 : 6; 
	}
	get hitbox_y1() { return ( this.type === sdDrone.DRONE_SD_BG ) ? -16 : ( this.type === sdDrone.DRONE_SARRONIAN_GAUSS || this.type === sdDrone.DRONE_SARRONIAN || this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER || this.type === sdDrone.DRONE_TZYRG_WATCHER || this.type === sdDrone.DRONE_ZEKTARON_HUNTER || this.type === sdDrone.DRONE_ZEKTARON_CORVETTE ) ? -11 :
		( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_FALKOK_RAIL ) ? -10 : -6; 
	}
	get hitbox_y2() { return ( this.type === sdDrone.DRONE_SD_BG ) ? 16 : ( this.type === sdDrone.DRONE_SARRONIAN_GAUSS || this.type === sdDrone.DRONE_SARRONIAN || this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER || this.type === sdDrone.DRONE_TZYRG_WATCHER || this.type === sdDrone.DRONE_ZEKTARON_HUNTER || this.type === sdDrone.DRONE_ZEKTARON_CORVETTE ) ? 11 :
		( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_FALKOK_RAIL ) ? 10 : 6; 
	}
	
	get hard_collision() // For world geometry where players can walk
	{ return ( this.death_anim === 0 ); }
	
	constructor( params )
	{
		super( params );
		
		if ( params.tag )
		{
			if ( sdDrone[ params.tag ] !== undefined )
			params.type = sdDrone[ params.tag ];
			else
			debugger;
		}
		
		this.sx = 0;
		this.sy = 0;

		//this._collision = true;
		
		this.type = params.type || 1;
		
		this._hmax = 
			this.type === sdDrone.DRONE_SETR ? 90 : 
			this.type === sdDrone.DRONE_COUNCIL ? 140 : 
			this.type === sdDrone.DRONE_SARRONIAN_DETONATOR ? 90 : 
			this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER ? 750 : 
			this.type === sdDrone.DRONE_SARRONIAN ? 500 :
			this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE ? 140 :
			this.type === sdDrone.DRONE_SARRONIAN_GAUSS ? 600 :
			this.type === sdDrone.DRONE_ZEKTARON ? 160 :
			this.type === sdDrone.DRONE_ZEKTARON_CORVETTE ? 450 :
			this.type === sdDrone.DRONE_ZEKTARON_HUNTER ? 500 :
			this.type === sdDrone.DRONE_TZYRG_WATCHER ? 350 : 
			this.type === sdDrone.DRONE_FALKOK ? 120 : 
			this.type === sdDrone.DRONE_FALKOK_RAIL ? 280 : 
			this.type === sdDrone.DRONE_CUT_DROID ? 1200 : 
			this.type === sdDrone.DRONE_SD_BG ? 1800 : 
			this.type === sdDrone.DRONE_COUNCIL_ATTACK ? 180 : 
			100; // TYPE=1: 1 shot for regular railgun but 2 for mech one, TYPE=2: 1 shot from any railgun
	
		this._hea = this._hmax;
		this._ai_team = params._ai_team || this.GetDroneTeam();
		
		if ( this.type === sdDrone.DRONE_CUT_DROID )
		this._ai_team = -1; // Not affiliated with any faction

		this.attack_an = 0;
		this.death_anim = 0;
		
		// Targetting
		this._current_target = params.target || null;
		this._pathfinding = null;
		
		// Aiming
		this._look_x = this.x;
		this._look_y = this.y;
		
		if ( this._current_target ) 
		this.SetTarget( this._current_target ); 
	
		//
		
		this.hurt_timer = 0;

		this._attack_timer = 0;
		this._alt_attack_timer = 0; // secondary attack timer
		this._charged = false;
		this._burst_ammo_start = this.type === sdDrone.DRONE_SD_BG ? 50 : this.type === sdDrone.DRONE_ERTHAL ? 6 : this.type === sdDrone.DRONE_ZEKTARON ? 3 : 0;
		this._burst_ammo = this._burst_ammo_start;
		this._burst_reload = this.type === sdDrone.DRONE_SD_BG ? 1.5 : this.type === sdDrone.DRONE_ERTHAL ? 2 : this.type === sdDrone.DRONE_ZEKTARON ? 4 : 0; // Reload time when it's burst firing

		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_attack = sdWorld.time;
		
		this._nature_damage = 0; // For cubes to attack drones
		this._player_damage = 0;

		this._summon_ent_count = 3; // How much entities is ( a specific drone) allowed to create?
		this._is_minion_of = params.minion_of || null; // Is this a minion of a boss?
		
		if ( this._is_minion_of ) // If this is a minion of a boss
		{
			this._is_minion_of._current_minions_count++; // Increase the count of minions here
			//console.log( this._is_minion_of._current_minions_count );
		}

		this.side = 1;
		
		this.attack_frame = 0;
		this._anim_flap = 0; // Client-side controlled, for sdDrone.DRONE_CUT_DROID
		
		this._anim_shift = ~~( Math.random() * 10000 );

		this._ignore_collisions_with = null; // Used by Sarronian Detonators to pass through Detonator Carriers.

		// These are for DRONE_CUT_DROID, but could be used for others too
		this._anim_flap = 0;
		this._anim_twist = 0;
		this._anim_last_effect_time = 0;
		
		this._voice_channel = sdSound.CreateSoundChannel( this );
		
		this._unlimited_range = params.unlimited_range || false; // Unlimited attack range? Reserved for some "protect entity" events.
		
		sdDrone.drones.push( this );
		
		this.SetMethod( 'CollisionFiltering', this.CollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
	}

	CollisionFiltering( from_entity )
	{
		if ( from_entity._is_bg_entity !== this._is_bg_entity || !from_entity._hard_collision )
		return false;
		
		return ( this._ignore_collisions_with !== from_entity );
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_is_minion_of' ) return true;

		return false;
	}
	
	SetTarget( ent )
	{
		//if ( !ent )
		//return;

		if ( ent !== this._current_target )
		{
			this._current_target = ent;

			if ( ent )
			this._pathfinding = new sdPathFinding({ target: ent, traveler: this, attack_range: ( this.type === sdDrone.DRONE_CUT_DROID ) ? 32 : 240, options: [ sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS, sdPathFinding.OPTION_CAN_SWIM ] });
			else
			this._pathfinding = null;
		}
	}
	CanAttackEnt( ent )
	{
		if ( this._current_target === ent )
		return true;

		if ( this._ai_team === 1 || this._ai_team === 8 ) // Tier 1 drones targetting: Falkok and Tzyrg drones
		return true;

		if ( this._ai_team === 2 || ent._ai_team === 7 ) // Tier 2 drones targetting: Erthal and Setr drones
		{
			if ( ent._ai_team === this._ai_team  )
			return false;
			else
			{
				if ( ent._ai_team === 0 && ent.matter < 1200 && this._current_target !== ent )
				return false;
				else
				{
					this._current_target === ent;
					return true;
				}
			}
		}

		if ( this._ai_team === 4 || ent._ai_team === 6 ) // Tier 3 drones targetting: Sarronian + Zektaron & Council drones
		{
			if ( ent._ai_team === this._ai_team  )
			return false;
			else
			{
				if ( ent._ai_team === 0 && ent.matter < 1800 && this._current_target !== ent )
				return false;
				else
				{
					this._current_target === ent;
					return true;
				}
			}
		}

	}
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.driver_of )
		character = character.driver_of;
		
		if ( this._hea > 0 )
		if ( character.IsTargetable( this ) && character.IsVisible( this ) )
		if ( ( character.hea || character._hea ) > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdDrone.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				if ( this.CanAttackEnt( character ) )
				{
					//this._current_target = character;
					this.SetTarget( character );
				
					if ( this.type === sdDrone.DRONE_ERTHAL )
					sdSound.PlaySound({ name:'spider_welcomeC', x:this.x, y:this.y, volume: 1, pitch:2 });
					else
					if ( this.type === sdDrone.DRONE_CUT_DROID )
					sdSound.PlaySound({ name:'cut_droid_alert', x:this.x, y:this.y, volume: 1, pitch:1 });
				}
			}
		}
	}*/
	
	GetDroneTeam(){
		if ( this.type === sdDrone.DRONE_SD_BG )
		return 0;
		
		if ( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_FALKOK_RAIL )
		return 1;
		
		if ( this.type === sdDrone.DRONE_ERTHAL )
		return 2;
	
		if ( this.type === sdDrone.DRONE_COUNCIL || this.type === sdDrone.DRONE_COUNCIL_ATTACK )
		return 3;
	
		if ( this.type === sdDrone.DRONE_SARRONIAN || this.type === sdDrone.DRONE_SARRONIAN_DETONATOR || this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER || this.type === sdDrone.DRONE_SARRONIAN_GAUSS || this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE )
		return 4;
	
		if ( this.type === sdDrone.DRONE_ZEKTARON || this.type === sdDrone.DRONE_ZEKTARON_CORVETTE || this.type === sdDrone.DRONE_ZEKTARON_HUNTER )
		return 4;
	
		if ( this.type === sdDrone.DRONE_SETR )
		return 7;
	
		if ( this.type === sdDrone.DRONE_TZYRG || this.type === sdDrone.DRONE_TZYRG_WATCHER )
		return 8;
		
		return -1;
	}
	
	GetRandomTarget()
	{
		let ent = sdEntity.GetRandomActiveEntity();
		let array_of_enemies = sdCom.com_faction_attack_classes;
		if ( ent )
		if ( array_of_enemies.indexOf( ent.GetClass() ) !== -1 ) // If line of sight check found a potential target class inside that array
			{
				if ( typeof ent._ai_team !== 'undefined' ) // Does a potential target belong to a faction?
				{
					if ( ent._ai_team !== this._ai_team && ( sdWorld.Dist2D( this.x, this.y, ent.x, ent.y ) < sdDrone.max_seek_range || this._unlimited_range ) ) // Is this not a friendly faction? And is this close enough?
					return ent; // Target it
				}
				else
				return ent; // Target it
			}
		return null;
	}
	
	PlayAIAlertedSound( closest )
	{
		// Closest isn't really used here
		if ( this.type === sdDrone.DRONE_ERTHAL )
		sdSound.PlaySound({ name:'spider_welcomeC', x:this.x, y:this.y, volume: 1, pitch:2 });
		else
		if ( this.type === sdDrone.DRONE_CUT_DROID )
		sdSound.PlaySound({ name:'cut_droid_alert', x:this.x, y:this.y, volume: 1, pitch:1 });
		
	}
	

	GetBleedEffect()
	{
		if ( this.type === sdDrone.DRONE_ERTHAL )
		return sdEffect.TYPE_BLOOD_GREEN;
		else
		return sdEffect.TYPE_WALL_HIT;
	
	}
	
	GetBleedEffectHue()
	{
		if ( this.type === sdDrone.DRONE_ERTHAL )
		return 100; // Blue
	
		return 0;
	}
	GetBleedEffectFilter()
	{
		//if ( this.type === sdDrone.DRONE_ERTHAL )
		//return 'hue-rotate(100deg)'; // Blue
	
		return '';
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( this.type === sdDrone.DRONE_ERTHAL )
		if ( initiator.is( sdSpider ) || ( initiator.is( sdDrone ) && initiator.type === 2 ) )
		return;
	

		if ( initiator )
		{
			/*if ( !initiator.is( sdDrone ) && initiator._ai_team !== this._ai_team )
			if ( !initiator.IsPlayerClass() && initiator._ai_team !== this._ai_team )
			{
				//this._current_target = initiator;
				this.SetTarget( initiator );
			}
			else
			if ( ( initiator.is( sdSpider ) || initiator.is( sdDrone ) || initiator.IsPlayerClass() ) && initiator._ai_team !== this._ai_team )
			{
				//this._current_target = initiator;
				this.SetTarget( initiator );
			if ( 
			}*/
			if ( typeof initiator._ai_team !== 'undefined' ) // Is initiator a faction mob?
			{
				if ( initiator._ai_team !== this._ai_team ) // Is this not a friendly faction?
				this.SetTarget( initiator ); // Target it
			}
			else
			this.SetTarget( initiator );
		}

		dmg = Math.abs( dmg );
		
		let old_hea = this._hea;
		let was_alive = this._hea > 0;


		if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER )
		{
			let hp_current_mod = this._hea % 1000;
			let hp_after_mod = ( this._hea - dmg) % 1000;
			if ( hp_current_mod > hp_after_mod )
			this._summon_ent_count = 5; // was 3, bumped to 5 to make them more threatening if left unattended
		}
		
		this._hea -= dmg;
		
		if ( this.type === sdDrone.DRONE_SARRONIAN ||
			 this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER ||
			 this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE ||
			 this.type === sdDrone.DRONE_SARRONIAN_GAUSS )
		{
			let base_pitch = ( 600 / this._hmax + 1 ) / 2;
			
			if ( base_pitch > 1 )
			base_pitch = ( base_pitch + 1 * 3 ) / 4;
			
			if ( this._hea <= 0 && was_alive )
			sdSound.PlaySound({ name:'drone_death', x:this.x, y:this.y, volume:2, pitch:0.5 * base_pitch });
			else
			if ( this._hea > 0 )
			if ( Math.ceil( old_hea / this._hmax * 8 ) !== Math.ceil( this._hea / this._hmax * 8) )
			{
				sdSound.PlaySound({ name:'drone_death', x:this.x, y:this.y, volume:1, pitch:1 * base_pitch });
			}
		}
		
		if ( this._hea <= 0 && was_alive )
		{
			//if ( initiator )
			if ( this._ai_team !== 0 ) // Not friendly?
			{
				if ( this._hmax > 400 )
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
				else
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_AVERAGE_MOB );
			}
	
			if ( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_COUNCIL || this.type === sdDrone.DRONE_SETR || 
				 this.type === sdDrone.DRONE_TZYRG || this.type === sdDrone.DRONE_TZYRG_WATCHER || this.type === sdDrone.DRONE_FALKOK_RAIL || this.type === sdDrone.DRONE_SD_BG ||
				 this.type === sdDrone.DRONE_COUNCIL_ATTACK )
			{
				let explosion_color = sdEffect.default_explosion_color;
				
				if ( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_FALKOK_RAIL )
				{
					sdSound.PlaySound({ name:'drone_explosion', x:this.x, y:this.y, volume:2, pitch:1 });
					explosion_color = '#95c9ff';
				}
				
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 25, 
					damage_scale: 2, 
					type:sdEffect.TYPE_EXPLOSION,
					armor_penetration_level: 0,
					owner:this,
					can_hit_owner: false, // Make gibbing less likely
					color:explosion_color
				});
				/* Unreliable. Each of explosion projectiles deals very little damage on their own. Also more damage might come after drone's death
				if ( dmg >= this._hmax * 0.5 && this.type === sdDrone.DRONE_FALKOK ) // Instagib, splits drone into 2 parts ( if you weapon deals enough damage )
				{
					sdWorld.SpawnGib( this.x, this.y + 5, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_DRONE_PARTS , '', '', 100, this );
					sdWorld.SpawnGib( this.x, this.y - 5, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_DRONE_PARTS , '', '', 100, this, 1 );
					this.remove();
				}

				if ( dmg >= this._hmax * 0.5 && this.type === sdDrone.DRONE_FALKOK_RAIL ) // Instagib, splits drone into 2 parts ( if you weapon deals enough damage )
				{
					sdWorld.SpawnGib( this.x, this.y + 6, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_RAIL_DRONE_PARTS , '', '', 100, this );
					sdWorld.SpawnGib( this.x, this.y - 6, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_RAIL_DRONE_PARTS , '', '', 100, this, 1 );
					this.remove();
				}*/
				
				if ( this.type === sdDrone.DRONE_TZYRG || this.type === sdDrone.DRONE_TZYRG_WATCHER )
				{
					sdSound.PlaySound({ name:'tzyrg_death', x:this.x, y:this.y, volume:1, pitch: this.type === sdDrone.DRONE_TZYRG_WATCHER ? 0.8 : 1 });
				}
			}
			else
			if ( this.type === sdDrone.DRONE_ERTHAL )
			{
				this.sx -= this.side * 2;
				this.sy -= 2;
				
				sdSpider.StartErthalDrop( this, 0.8 );
			
				sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:2 });
			}
			else
			if ( this.type === sdDrone.DRONE_SARRONIAN || this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER || this.type === sdDrone.DRONE_SARRONIAN_GAUSS )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 42, 
					damage_scale: 1,
					type:sdEffect.TYPE_EXPLOSION,
					armor_penetration_level: 0,
					owner:this,
					color:'#00c600'
				});
			}
			else
			if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR ) // These are suicide bomber drones basically, lethal drones
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 18, 
					damage_scale: 13,
					type:sdEffect.TYPE_EXPLOSION,
					armor_penetration_level: 0,
					owner:this,
					color:'#00ff00'
				});
			}
			else
			if ( this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE ) // These are suicide bomber drones basically, lethal drones
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 15, 
					damage_scale: 1,
					type:sdEffect.TYPE_EXPLOSION,
					armor_penetration_level: 0,
					owner:this,
					color:'#00ff00'
				});
			}
			else
			if ( this.type === sdDrone.DRONE_ZEKTARON || this.type === sdDrone.DRONE_ZEKTARON_CORVETTE )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 28, 
					damage_scale: 4,
					type:sdEffect.TYPE_EXPLOSION,
					armor_penetration_level: 0,
					owner:this,
					color:'#ff0000'
				});
			}
			else
			if ( this.type === sdDrone.DRONE_ZEKTARON_HUNTER )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 48, 
					damage_scale: 5,
					type:sdEffect.TYPE_EXPLOSION,
					armor_penetration_level: 0,
					owner:this,
					color:'#bc0000'
				});
			}
			else
			if ( this.type === sdDrone.DRONE_CUT_DROID )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 64, 
					damage_scale: 0.1, 
					type:sdEffect.TYPE_EXPLOSION,
					armor_penetration_level: 0,
					owner:this,
					color:'#aaffdd'
				});
				
				sdSound.PlaySound({ name:'cut_droid_death', x:this.x, y:this.y, volume:1, pitch:1, channel:this._voice_channel });
			}
			

			if ( Math.random() < 0.2 ) // 20% chance to drop a faction-specific drop on destruction
			{
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun = null;

					if ( this.type === sdDrone.DRONE_SARRONIAN )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_SARRONIAN_ENERGY_RIFLE });
					else
					if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_SARRONIAN_BIO_ENERGY_LAUNCHER });
					else
					if ( this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_SARRONIAN_RAY });
					else
					if ( this.type === sdDrone.DRONE_SARRONIAN_GAUSS )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_SARRONIAN_GAUSS_RIFLE });
					else
					if ( this.type === sdDrone.DRONE_ZEKTARON )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_ZEKTARON_PLASMA_REPEATER });
					else
					if ( this.type === sdDrone.DRONE_ZEKTARON_CORVETTE )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_ZEKTARON_PLASMA_CANNON });
					else
					if ( this.type === sdDrone.DRONE_SETR )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_SETR_REPULSOR });
					else
					if ( this.type === sdDrone.DRONE_CUT_DROID )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_CHAINSAW });
					//else
					//gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_METAL_SHARD });

					if ( gun )
					{
						gun.sx = this.sx + Math.random() * 2 - 1;
						gun.sy = this.sy + Math.random() * 2 - 1;
						sdEntity.entities.push( gun );
					}

				}, 100 );
			}

			if ( ( Math.random() < 0.3 && this.type !== sdDrone.DRONE_COUNCIL_ATTACK ) || ( Math.random() < 0.2 && this.type === sdDrone.DRONE_COUNCIL_ATTACK ) ) // 30% chance to drop a metal shard on destruction, 20% if Council assault drone
			{
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun;

					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_METAL_SHARD });

					gun.sx = this.sx + Math.random() * 2 - 1;
					gun.sy = this.sy + Math.random() * 2 - 1;
					sdEntity.entities.push( gun );

				}, 100 );
			}
		}
		else
		{
			if ( this._hea > 0 )
			{
				if ( this.hurt_timer <= 0 )
				{
					if ( this.type === sdDrone.DRONE_ERTHAL )
					sdSound.PlaySound({ name:'spider_hurtC', x:this.x, y:this.y, volume: 1, pitch:1 });
					
					if ( this.type === sdDrone.DRONE_TZYRG || this.type === sdDrone.DRONE_TZYRG_WATCHER )
					sdSound.PlaySound({ name:'tzyrg_hurt', x:this.x, y:this.y, volume: 1, pitch: ( this.type === sdDrone.DRONE_TZYRG_WATCHER ? 0.8 : 1 ) * 1.5 });
					
					this.hurt_timer = 5;
				}
			}
		}
		
		if ( this._hea < -65 ) // -this._hmax * 0.5 ) DRONE_FALKOK_RAIL looks cooler when it also gets gibbed on fall once it was defeated
		{
			if ( this.type === sdDrone.DRONE_FALKOK ) // Instagib, splits drone into 2 parts ( if you weapon deals enough damage )
			{
				sdWorld.SpawnGib( this.x, this.y + 5, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_DRONE_PARTS , '', '', 100, this );
				sdWorld.SpawnGib( this.x, this.y - 5, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_DRONE_PARTS , '', '', 100, this, 1 );
				this.remove();
			}

			if ( this.type === sdDrone.DRONE_FALKOK_RAIL ) // Instagib, splits drone into 2 parts ( if you weapon deals enough damage )
			{
				sdWorld.SpawnGib( this.x, this.y + 6, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_RAIL_DRONE_PARTS , '', '', 100, this );
				sdWorld.SpawnGib( this.x, this.y - 6, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_RAIL_DRONE_PARTS , '', '', 100, this, 1 );
				this.remove();
			}
		}
		
		if ( 
				this._hea < -this._hmax * 0.5 || 
				( this._hea < 0 && this.type === sdDrone.DRONE_SARRONIAN_DETONATOR ) || 
				( this._hea < 0 && this.type === sdDrone.DRONE_ZEKTARON ) 
		)
		this.remove();
	}
	get mass() { return 500; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 15 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		let pathfinding_result = null;
		
		if ( sdWorld.is_server )
		{
			if ( !this._is_minion_of || this._is_minion_of._is_being_removed )
			this._is_minion_of = null;
		}
		

		if ( this.type === sdDrone.DRONE_CUT_DROID )
		{
			let timer = this.attack_frame * 10;
			let morph = Math.min( 1, timer / 30, ( 2.3 * 30 - timer ) / 30 );

			if ( this.death_anim !== 0 )
			morph = 0;

			this._anim_flap = sdWorld.MorphWithTimeScale( this._anim_flap, morph, 0.9, GSPEED );

			if ( !sdWorld.is_server || sdWorld.is_singleplayer )
			{
				this._anim_twist += this._anim_flap * GSPEED;
				this._anim_twist -= Math.sin( this._anim_twist ) * ( 1 - this._anim_flap ) * 0.1;
			}
			if ( sdWorld.is_server )
			if ( this._anim_flap > 0.5 )
			{
				let nears = this.GetAnythingNearCache( this.x, this.y, 15 + 64 );
				
				let candidates = [];

				for ( let i = 0; i < nears.length; i++ )
				{
					let e = nears[ i ];
					
					if ( e._is_being_removed )
					continue;

					let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
					let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;

					if ( e !== this )
					//if ( this._anim_flap > 0.9 || sdWorld.inDist2D_Boolean( xx, yy, this.x, this.y, 15 + 64 * this._anim_flap ) )
					if ( this._anim_flap > 0.9 || e.GetAccurateDistance( this.x, this.y ) < 15 + 64 * this._anim_flap )
					if ( e.IsTargetable( this ) )
					if ( e._is_bg_entity === this._is_bg_entity )
					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, e, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						if ( e.is( sdCrystal ) )
						{
							e._being_sawed_time = sdWorld.time;
						}
						
						e.DamageWithEffect( 5 * GSPEED, this );
						
						candidates.push( e );
					}
				}
				
				if ( candidates.length > 0 )
				if ( sdWorld.time > this._anim_last_effect_time + 50 )
				{
					this._anim_last_effect_time = sdWorld.time;
					
					let e = candidates[ Math.floor( Math.random() * candidates.length ) ];
					
					//let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
					//let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
					
					let [ xx, yy ] = e.GetClosestPointWithinCollision( this.x, this.y );
					
					e.PlayDamageEffect( xx, yy );
				}
			}
		}


		if ( this.death_anim !== 0 )
		{
			if ( this.type === sdDrone.DRONE_CUT_DROID && this._phys_last_rest_on )
			this.attack_an = 0;
			else
			this.attack_an += -this.sx * 100 * GSPEED * this.side; // Looks smoother
		}

		if ( this._hea <= 0 )
		{

			if ( this.death_anim < sdDrone.death_duration + sdDrone.post_death_ttl )
			this.death_anim += GSPEED;
			else
			{
				this.remove();
				this._broken = false; // Just vanish - no need to explode
				return;
			}
		}
		else
		{

			// It makes sense to call it at all times because it also handles wall attack logic
			if ( this._current_target )
			if ( this._pathfinding )
			pathfinding_result = this._pathfinding.Think( GSPEED );
			
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsVisible( this ) || ( sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdDrone.max_seek_range + 32 && !this._unlimited_range ) )
				{
					//this._current_target = null;
					this.SetTarget( null );
				}
				else
				{
					if ( this.attack_frame < 1 ) // Not attacking
					this.side = ( this._look_x > this.x ) ? 1 : -1;

					if ( this._last_jump < sdWorld.time - 200 )
					//if ( this._last_stand_on )
					//if ( in_water )
					{
						this._last_jump = sdWorld.time;

						//let dx = ( this._current_target.x + ( this._current_target.sx || 0 ) * 10 - this.x - this.sx * 10 );
						//let dy = ( this._current_target.y + ( this._current_target.sy || 0 ) * 10 - this.y - this.sy * 10 );
						
						let dx = 0;
						let dy = 0;
						
						if ( ( pathfinding_result && pathfinding_result.attack_target === this._current_target ) || this._unlimited_range )
						{
							dx = ( this._current_target.x + ( this._current_target.sx || 0 ) * 10 - this.x - this.sx * 10 );
							dy = ( this._current_target.y + ( this._current_target.sy || 0 ) * 10 - this.y - this.sy * 10 );
						}
						else
						/*if ( pathfinding_result && pathfinding_result.attack_target )
						{
							dx = ( pathfinding_result.attack_target.x + ( pathfinding_result.attack_target._hitbox_x1 + pathfinding_result.attack_target._hitbox_x2 ) / 2 + ( pathfinding_result.attack_target.sx || 0 ) * 10 - this.x - this.sx * 10 );
							dy = ( pathfinding_result.attack_target.y + ( pathfinding_result.attack_target._hitbox_y1 + pathfinding_result.attack_target._hitbox_y2 ) / 2 + ( pathfinding_result.attack_target.sy || 0 ) * 10 - this.y - this.sy * 10 );
						}
						else*/
						if ( pathfinding_result )
						{
							dx = pathfinding_result.act_x;
							dy = pathfinding_result.act_y;
							
							dx += Math.random() * 0.25 - 0.125;
							dy += Math.random() * 0.25 - 0.125;
						}

						// Bad formula but whatever
						//dx += Math.random() * 40 - 20;
						//dy += -Math.random() * 20;
						//dx += Math.random() * 0.25 - 0.125;
						//dy += Math.random() * 0.25 - 0.125;

						let di = sdWorld.Dist2D_Vector( dx, dy );
						if ( di > 2 )
						{
							dx /= di;
							dy /= di;

							if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR )
							{
								if ( di > 100 )
								{
									dx *= 1.2;
									dy *= 1.2;
								}
								else
								if ( di < 50 ) // When closing in, increase speed of the suicide bomber drone
								{
									dx *= 3;
									dy *= 3;
								}
								else
								{
									dx *= 2;
									dy *= 2;
								}
							}
							
							if ( this.type === sdDrone.DRONE_SARRONIAN_GAUSS ) // gauss drone artillery FIX LATER
							{	
								if ( di < 600 )
								{
									dx *= -0.8;
									dy *= -0.8;
								}
							}

							if ( this.type !== sdDrone.DRONE_SARRONIAN_DETONATOR || this.type !== sdDrone.DRONE_SARRONIAN_GAUSS )
							if ( di < 100 + Math.random() * 100 )
							{
								dx *= -0.2;
								dy *= -0.2;
							}
						}

						this.sx += dx;
						this.sy += dy;
						

						//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
						//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );

						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
			else
			{
				// No target
				if ( sdWorld.is_server )
				{
					{
						this.SetTarget( sdCharacter.GetRandomEntityNearby( this ) );
					}
					if ( Math.random() < 0.02 && !this._current_target ) // Still no target?
					{
						this.SetTarget( this.GetRandomTarget() );
					}
					
					if ( this._current_target )
					this.PlayAIAlertedSound();
					
				}
				/*if ( sdWorld.is_server )
				for ( let i = 0; i < sdWorld.sockets.length; i++ )
				{
					if ( sdWorld.sockets[ i ].character )
					if ( !sdWorld.sockets[ i ].character._is_being_removed )
					if ( sdWorld.sockets[ i ].character.hea > 0 )
					//if ( sdWorld.sockets[ i ].character.IsVisible( this ) )
					if ( !sdWorld.sockets[ i ].character.ghosting )
					if ( !sdWorld.sockets[ i ].character.is( sdWorld.entity_classes.sdPlayerSpectator ) )
					{

						let dx = ( sdWorld.sockets[ i ].character.x + Math.random() * 1000 - 500 - this.x );
						let dy = ( sdWorld.sockets[ i ].character.y + Math.random() * 1000 - 500 - this.y );

						let di = sdWorld.Dist2D_Vector( dx, dy );

						if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 4 )
						if ( di > 1 )
						{
							this.sx += dx / di * 0.2;
							this.sy += dy / di * 0.2;

							//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
							//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );

							break;
						}
					}
				}*/
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
		}
		
		if ( this.death_anim === 0 )
		{
			if ( this._attack_timer > 0 )
			this._attack_timer -= GSPEED;

			if ( this._alt_attack_timer > 0 )
			this._alt_attack_timer -= GSPEED;

			if ( this._special_attack_timer > 0 )
			this._special_attack_timer -= GSPEED;
			//else
			//if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR )
			//if ( this.CanMoveWithoutOverlap( this.x, this.y, 0 ) )
			//this._collision = true;

			if ( this.hurt_timer > 0 )
			this.hurt_timer = Math.max( 0, this.hurt_timer - GSPEED );

			if ( this.attack_frame > 0 )
			this.attack_frame = Math.max( 0, this.attack_frame - GSPEED * 0.1 );
			//else
				
			// Drones now "aim" at entities
			if ( sdWorld.is_server )
			if ( this._current_target )
			{
				// Target aiming so players can dodge
				this._look_x = sdWorld.MorphWithTimeScale( this._look_x, this._current_target.x + ( ( this._current_target._hitbox_x1 + this._current_target._hitbox_x2 ) / 2 ), 0.95, GSPEED );
				this._look_y = sdWorld.MorphWithTimeScale( this._look_y, this._current_target.y + ( ( this._current_target._hitbox_y1 + this._current_target._hitbox_y2 ) / 2 ), 0.95, GSPEED );
				
				let dx = this._look_x - this.x;
				let dy = this._look_y - this.y;
				if ( this.type !== 6 )
				this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
			}

			
			//if ( this.sy > 0 )
			/*if ( !this.CanMoveWithoutOverlap( this.x, this.y + 48, 0 ) )
			{
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.8, GSPEED ); // Slowdown
				this.sy -= 0.4 * GSPEED; // More than gravity
			}*/
		
			if ( this._current_target )
			{
				// Dodging
				if ( this.type === sdDrone.DRONE_ERTHAL )
				{
					if ( this._current_target.IsPlayerClass() )
					if ( Math.random() < 0.3 || ( 
						this._current_target._inventory[ this._current_target.gun_slot ] && 
						!sdGun.classes[ this._current_target._inventory[ this._current_target.gun_slot ].class ].is_sword && 
						this._current_target._key_states.GetKey( 'Mouse1' ) ) )
					{
						let ray_x = this._current_target.look_x - this._current_target.x;
						let ray_y = this._current_target.look_y - this._current_target.y;
						let ray_di = sdWorld.Dist2D_Vector( ray_x, ray_y );
						if ( ray_di > 1 )
						{
							ray_x /= ray_di;
							ray_y /= ray_di;

							let point = sdWorld.TraceRayPoint( this._current_target.x, this._current_target.y, this._current_target.x + ray_x * 1000, this._current_target.y + ray_y * 1000, this._current_target, null, sdCom.com_visibility_unignored_classes_plus_erthals, null );

							if ( point )
							{
								let di = sdWorld.inDist2D( point.x, point.y, this.x, this.y, 32 );
								if ( di > 0 )
								{
									let dx = this.x - point.x;
									let dy = this.y - point.y;
									if ( di > 0.1 )
									{
										dx /= di;
										dy /= di;
									}
									this.sx += dx * 0.1 * GSPEED;
									this.sy += dy * 0.1 * GSPEED;
								}
							}
						}
					}
				}
				
				if ( this._attack_timer <= 0 )
				{
					this._last_attack = sdWorld.time; // So it is not so much calc intensive

					/*let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 240, null, sdCom.com_faction_attack_classes );
					let from_entity;

					let nears = [];
					for ( var i = 0; i < nears_raw.length; i++ )
					{
						from_entity = nears_raw[ i ];

						let rank = Math.random() * 0.1;

						if ( ( ( from_entity.IsPlayerClass() && from_entity._ai_team !== this._ai_team || this._current_target === from_entity ) && ( from_entity.hea || from_entity._hea ) > 0 ) )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdDrone' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdSpider' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdEnemyMech' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdGuanako' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdTzyrgDevice' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdShurgTurret' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdShurgExcavator' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdVeloxMiner' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdSetrDestroyer' && from_entity._ai_team !== this._ai_team )
						{
							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						
					}

					nears.sort((a,b)=>{
						return b.rank - a.rank;
					});

					//sdWorld.shuffleArray( nears );

					//let hits_left = 4;
					
					*/
					
					let nears = [];
					let from_entity;
					if ( this._current_target )
					nears.push( { ent: this._current_target, rank: Math.random() * 0.1, ignore_line_of_sight: false } ); // It attacks only one target now
				
					if ( pathfinding_result && pathfinding_result.attack_target )
					{
						nears.push( { ent: pathfinding_result.attack_target, rank: 0, ignore_line_of_sight: true } ); // Not a priority usually
					}

					for ( var i = 0; i < nears.length; i++ )
					{
						from_entity = nears[ i ].ent;

						let xx = this._look_x;
						let yy = this._look_y;

						let in_attack_range = ( sdWorld.Dist2D( this.x, this.y, from_entity.x, from_entity.y ) < 240 ) ? true : false;
						if ( ( nears[ i ].ignore_line_of_sight || sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) ) && in_attack_range )
						{
							let dx = xx - this.x;
							let dy = yy - this.y;

							let di = sdWorld.Dist2D_Vector( dx, dy );

							//dx += ( from_entity.sx || 0 ) * di / 12;
							//dy += ( from_entity.sy || 0 ) * di / 12;

							di = sdWorld.Dist2D_Vector( dx, dy );

							if ( di > 1 )
							{
								dx /= di;
								dy /= di;
							}

							this.side = ( dx > 0 ) ? 1 : -1;
							if ( this.type !== 6 )
							this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;

							//this.an = Math.atan2( this._target.y + this._target.sy * di / vel - this.y, this._target.x + this._target.sx * di / vel - this.x ) * 100;

							//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:0.33, pitch:2.8 });
							if ( this.type === sdDrone.DRONE_FALKOK ) // Falkok drones
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 12;
								bullet_obj.color = '#afdfff';


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 7;

								sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:5 });
							}
							else
							if ( this.type === sdDrone.DRONE_ERTHAL ) // Erthal drones
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 18;
								bullet_obj.sy *= 18;

								bullet_obj._damage = 10; // 15 was too deadly
								bullet_obj.color = '#00aaff';


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								this._burst_ammo--;
								if ( this._burst_ammo > 0 )
								this._attack_timer = this._burst_reload;
								else
								{
									this._attack_timer = 35;
									this._burst_ammo = this._burst_ammo_start;
								}

								sdSound.PlaySound({ name:'spider_attackC', x:this.x, y:this.y, volume:0.33, pitch:6 });
							}
							else
							if ( this.type === sdDrone.DRONE_SARRONIAN )
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 24;
								bullet_obj.color = '#00c600';
								bullet_obj.explosion_radius = 12;
								bullet_obj.model = 'sarronian_ball';

								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 3;
								this._attack_timer = 60;

								sdSound.PlaySound({ name:'gun_spark', x:this.x, y:this.y, volume:1.25, pitch:0.5 });
							}
							else
							if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER )
							{
								if ( this._attack_timer <= 0 && this._alt_attack_timer <= 0 ) // drop a bio-mine every 2.5 detonator spawns
								{				
									let obj = new sdBullet({ x: this.x, y: this.y, owner: this});
									
									obj.sx = dx;
									obj.sy = dy;
									obj.x += obj.sx * -35;
									obj.y += obj.sy * -25;
									obj._ignore_collisions_with = this; // Make sure it can pass through the detonator carrier 
									obj.model = 'sarronian_bio_blob';
									obj.color = '#974800';
									obj.explosion_radius = 18;
									obj._hittable_by_bullets = false;
									obj.is_grenade = true;
									obj.time_left = 120;
									obj.gravity_scale = 0.9;
									obj._detonate_on_impact = false;
					
									obj._custom_extra_think_logic = ( bullet, GSPEED )=>
									{
										let owner = ( bullet._owner || bullet._owner2 || this || null );
									
										GSPEED *= 1;
					
										let range = 48;
					
										let nears = bullet.GetAnythingNearCache( bullet.x, bullet.y, range );
										for ( let i = 0; i < nears.length; i++ )
										{
											let e = nears[ i ];
											if ( !e._is_being_removed )
											if ( e !== bullet && e !== owner )
											if ( e._is_bg_entity === bullet._is_bg_entity )
											if ( e.IsTargetable( owner ) )
											if ( !e.is( sdGun ) )
											if ( !e.is( sdBullet ) )
											if ( !e.is( sdBlock ) )
											if ( !e.is( sdCrystal ) ) // crashes upon breaking crystals apparently, temporary fix
											if ( !e.is( sdJunk ) ) // crashes upon breaking junk entities apparently, temporary fix
											{
												let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
												let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
					
												if ( sdWorld.inDist2D_Boolean( bullet.x, bullet.y, xx, yy, range ) )
												if ( sdWorld.CheckLineOfSight( bullet.x, bullet.y, xx, yy, e, null, sdCom.com_creature_attack_unignored_classes ) )
												{
													e.DamageWithEffect( GSPEED * 4, owner, false, false );
												}
											}
										}
									},
									
									obj._custom_detonation_logic = ( bullet )=> // when the mine projectile detonates, releases an AoE and an initial explosion.
									{
										let gas_attack_obj = new sdBullet({ x: bullet.x, y: bullet.y }); // lingering damage over time AoE projectile
											gas_attack_obj.sx = 0;
											gas_attack_obj.sy = 0;
					
											gas_attack_obj.explosion_radius = 32;
											gas_attack_obj.model = 'sarronian_bio_gas';
											gas_attack_obj.model_is_big = true; // the bio gas is a 96 by 96 sprite, use this for 96 by 96 projectile sprites
											gas_attack_obj._damage = 9;
											gas_attack_obj.color ='#00ff00';
											gas_attack_obj.projectile_velocity = 0;
											gas_attack_obj.time_left = 180;
											gas_attack_obj._hittable_by_bullets = false;
											gas_attack_obj._detonate_on_impact = false;
											gas_attack_obj.gravity_scale = 0;
													
											gas_attack_obj._custom_extra_think_logic = ( bullet, GSPEED )=>{
												GSPEED *= 1;
								
												let range = 64;
									
												let nears = bullet.GetAnythingNearCache( bullet.x, bullet.y, range );
												for ( let i = 0; i < nears.length; i++ )
												{
													let e = nears[ i ];
													if ( !e._is_being_removed )
													if ( e !== bullet )
													if ( e._is_bg_entity === bullet._is_bg_entity )
													if ( e.IsTargetable() )
													if ( !e.is( sdGun ) )
													if ( !e.is( sdBullet ) )
													if ( !e.is( sdBlock ) )
													if ( !e.is( sdCrystal ) ) // crashes upon breaking crystals apparently, temporary fix
													if ( !e.is( sdJunk ) ) // crashes upon breaking junk entities apparently, temporary fix
													{
														let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
														let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
							
														if ( sdWorld.inDist2D_Boolean( bullet.x, bullet.y, xx, yy, range ) )
														if ( sdWorld.CheckLineOfSight( bullet.x, bullet.y, xx, yy, e, null, sdCom.com_creature_attack_unignored_classes ) )
														{
															e.DamageWithEffect( GSPEED * 3, false, false ); // deadly if you stay in it for too long, don't overstay.
														}
													}
												}
											}
									}
									sdEntity.entities.push( obj );
									this._alt_attack_timer = 240;
									this._attack_timer = 30;
								}
								else
								{								
									let drone = new sdDrone({ x: this.x, y: this.y, type: sdDrone.DRONE_SARRONIAN_DETONATOR, _ai_team: this._ai_team });

									drone.sx = dx;
									drone.sy = dy;
									drone.x += drone.sx * -25;
									drone.y += drone.sy;
									drone._ignore_collisions_with = this; // Make sure it can pass through the detonator carrier 

									sdEntity.entities.push( drone );
									this._attack_timer = 90;
								}
								
								this.attack_frame = 6;
								//this._collision = false;

								sdSound.PlaySound({ name:'gun_spark', x:this.x, y:this.y, volume:1.25, pitch:0.1 });

								//this._summon_ent_count--;
							
							}
							else
							if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR ) // Detonate if in proximity
							{
								if ( di < 32 )
								this.DamageWithEffect( 1000 );
							}
							else
							if ( this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE )
							{
								let entities = sdWorld.GetAnythingNear( this.x, this.y, 128, null, [ 'sdCharacter' ] );
								let att_anim = false;
								for ( let i = 0; i < entities.length; i++ )
								{
									if ( entities[ i ].GetClass() === 'sdCharacter' && ( this._attack_timer <= 0 ) ) // Is it a character?
									{
										if ( entities[ i ]._ai_team === 4 ) // Does it belong to Sarronian faction?
										{
											if ( entities[ i ].hea < entities[ i ].hmax ) // Is it missing health?
											{
												if ( entities[ i ].GetClass() === 'sdCharacter' && !entities[ i ].hea <= 1 ) // Don't target dead allies.
												entities[ i ].hea = Math.min( entities[ i ].hea + 40, entities[ i ].hmax ); // If humanoid heal for 40

												att_anim = true;
												sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#00c600' });
												sdSound.PlaySound({ name:'gun_spark', x:this.x, y:this.y, volume:1, pitch:3.2 });
												this._attack_timer = 75;
											}
										}
									}
								}
								if ( att_anim === true )
								{
									this.attack_frame = 2;
								}
							}
							else
							if ( this.type === sdDrone.DRONE_SARRONIAN_GAUSS )
							{

								if ( this._attack_timer <= 0 && this._charged === false )
								{
									this._attack_timer = 75 // let charge sound play out, then shoot like the gauss rifle itself does.
									sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:this.x, y:this.y, volume: 1.5, pitch: 0.5 });
									this._charged = true;
								}

								if ( this._attack_timer <= 0 && this._charged === true )
								{

									let bullet_obj = new sdBullet({ x: this.x, y: this.y });

									bullet_obj._owner = this;
	
									bullet_obj.sx = dx;
									bullet_obj.sy = dy;
									bullet_obj.x += bullet_obj.sx * 3;
									bullet_obj.y += bullet_obj.sy * 3;
	
									bullet_obj.sx *= 32;
									bullet_obj.sy *= 32;
	
									bullet_obj._damage = 118;
									bullet_obj.model = 'sarronian_bolt',
									bullet_obj.color = '#00c600';
									bullet_obj.explosion_radius = 16;
									
									sdSound.PlaySound({ name: 'gun_railgun_malicestorm_terrorphaser4', x:this.x, y:this.y, volume: 1.5, pitch: 2 });
									sdEntity.entities.push( bullet_obj );
									
									// this._alt_attack_timer = 90
									this._attack_timer = 90; // 75 + 90 + 1
									this._charged = false;
								}

								this.attack_frame = 2;
							}
							else
							if ( this.type === sdDrone.DRONE_ZEKTARON )
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 9;
								bullet_obj.sy *= 9;

								bullet_obj._damage = 24;
								bullet_obj.color = '#900000';
								bullet_obj.explosion_radius = 6;
								bullet_obj.model = 'ball_red';

								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 1;
								this._burst_ammo--;
								if ( this._burst_ammo > 0 )
								this._attack_timer = this._burst_reload;
								else
								{
									this._attack_timer = 45;
									this._burst_ammo = this._burst_ammo_start;
								}

								sdSound.PlaySound({ name:'alien_laser1', x:this.x, y:this.y, volume:1.1, pitch:1.7 });
							}
							else
							if ( this.type === sdDrone.DRONE_ZEKTARON_CORVETTE )
							{
								for ( let i = 0; i < 5; i++ )
								{
									let bullet_obj = new sdBullet({ x: this.x, y: this.y });

									bullet_obj._owner = this;

									bullet_obj.sx = dx;
									bullet_obj.sy = dy;
									bullet_obj.x += bullet_obj.sx * 3;
									bullet_obj.y += bullet_obj.sy * 3;

									bullet_obj.sx *= 8 + Math.random() * 9 - Math.random();
									bullet_obj.sy *= 8 + Math.random() * 9 - Math.random();

									bullet_obj._damage = 26;
									bullet_obj.color = '#cd1e1e';
									bullet_obj.model = 'ball_red';
									bullet_obj.explosion_radius = 8;

									sdEntity.entities.push( bullet_obj );
								}
								// bullet_obj.sx = dx;
								// bullet_obj.sy = dy;
								// bullet_obj.x += bullet_obj.sx * 1;
								// bullet_obj.y += bullet_obj.sy * 1;

								// bullet_obj.sx *= 3;
								// bullet_obj.sy *= 3;

								this.attack_frame = 2;
								this._attack_timer = 60;
								sdSound.PlaySound({ name:'alien_laser1', x:this.x, y:this.y, volume:1.1, pitch:0.4 });
							}
							else
							if ( this.type === sdDrone.DRONE_ZEKTARON_HUNTER )
							{

								if ( this._alt_attack_timer <= 0 && this._charged === false )
								{
									this._alt_attack_timer = 65; // let charge sound play out, then shoot.
									this._attack_timer = 156;
									sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:this.x, y:this.y, volume: 1.5, pitch: 1.3 });
									this._charged = true;
								}

								if ( this._attack_timer <= 0 && this._charged === false )
								{
									this._attack_timer = 65; // let charge sound play out, then shoot.
									this._alt_attack_timer = 156;
									sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:this.x, y:this.y, volume: 1.3, pitch: 1.7 });
									this._charged = true;
								}

								if ( this._alt_attack_timer <= 0 && this._charged === true )
								{
									let bullet_obj = new sdBullet({ x: this.x, y: this.y });

									bullet_obj._owner = this;
	
									bullet_obj.sx = dx;
									bullet_obj.sy = dy;
									bullet_obj.x += bullet_obj.sx * 1;
									bullet_obj.y += bullet_obj.sy * 1;
	
									bullet_obj.sx *= 3;
									bullet_obj.sy *= 3;
	
									bullet_obj._damage = 12;
									bullet_obj.color = '#900000';
									bullet_obj.time_left = 180;
									bullet_obj._rail = true;
									bullet_obj._rail_circled = true;
									bullet_obj._custom_detonation_logic = ( bullet_obj )=>
									{
										sdWorld.SendEffect({ 
											x:bullet_obj.x,
											y:bullet_obj.y,
											radius:28,
											damage_scale: 0, // Just a decoration effect
											type:sdEffect.TYPE_EXPLOSION,
											owner:this,
											color:'#900000'
										});
										
										let nears = sdWorld.GetAnythingNear( bullet_obj.x, bullet_obj.y, 28 );

										for ( let i = 0; i < nears.length; i++ )
										{
											sdLost.ApplyAffection( nears[ i ], 60, bullet_obj, sdLost.FILTER_GLASSED ); // Might have to be lowered depending on this unit's performance, will usually be in pairs.
										}
									}

									sdSound.PlaySound({ name:'alien_laser1', x:this.x, y:this.y, volume:1.3, pitch:0.18 });
									sdEntity.entities.push( bullet_obj );
									
									this._alt_attack_timer = 156;
									this._attack_timer = 80;
									this._charged = false;
								}

								if ( this._attack_timer <= 0 && this._charged === true )
								{

									let bullet_obj = new sdBullet({ x: this.x, y: this.y });

									bullet_obj._owner = this;
	
									bullet_obj.sx = dx;
									bullet_obj.sy = dy;
									bullet_obj.x += bullet_obj.sx * 1;
									bullet_obj.y += bullet_obj.sy * 1;
	
									bullet_obj.sx *= 3;
									bullet_obj.sy *= 3;
	
									bullet_obj._damage = 78;
									bullet_obj.color = '#ff0000';
									bullet_obj.time_left = 180;
									bullet_obj.explosion_radius = 18;
									bullet_obj._rail = true;
									bullet_obj._rail_circled = true;
									
									sdSound.PlaySound({ name:'alien_laser1', x:this.x, y:this.y, volume:1.3, pitch:0.33 });
									sdEntity.entities.push( bullet_obj );
									
									this._attack_timer = 156;
									this._alt_attack_timer = 80;
									this._charged = false;
								}

								this.attack_frame = 2;
							}
							else
							if ( this.type === sdDrone.DRONE_COUNCIL ) // Council support drones, heal and repair the council + council bomb which makes them a priority target
							{
								this._attack_timer = 60;
								let entities = sdWorld.GetAnythingNear( this.x, this.y, 128, null, [ 'sdCharacter', 'sdJunk', 'sdCouncilMachine', 'sdCouncilIncinerator' ] );
								let att_anim = false;
								for ( let i = 0; i < entities.length; i++ )
								{
									if ( entities[ i ].GetClass() === 'sdCharacter' ) // Is it a character?
									{
										if ( entities[ i ]._ai_team === 3 ) // Does it belong to Council faction?
										{
											if ( entities[ i ].hea < entities[ i ].hmax ) // Is it missing armor?
											{
												entities[ i ].hea = Math.min( entities[ i ].hea + 250, entities[ i ].hmax ); // In that case, repair their armor
												att_anim = true;
												sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#fff000' });
											}
										}
										else
										if ( sdWorld.CheckLineOfSight( this.x, this.y, entities[ i ].x, entities[ i ].y, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
										{
												entities[ i ].DamageWithEffect( 30, this ); // Damage it
												if ( entities[ i ].ghosting )
												entities[ i ].TogglePlayerAbility(); // And remove it's invisibility
												att_anim = true;
												sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y , type:sdEffect.TYPE_BEAM, color:'#ff0000' });
										}
									}
									if ( entities[ i ].GetClass() === 'sdJunk' ) // Is it a junk entity?
									{
										if ( entities[ i ].type === 4 ) // Is it a council bomb?
										if ( entities[ i ].hea < entities[ i ].hmax ) // Does it need repairing?
										{
											entities[ i ].hea = Math.min( entities[ i ].hea + 600, entities[ i ].hmax ); // In that case, repair the bomb
											att_anim = true;
											sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#fff000' });
										}
									}
									if ( entities[ i ].GetClass() === 'sdCouncilMachine' ) // Council portal machine
									{
										if ( entities[ i ].hea < entities[ i ].hmax ) // Does it need repairing?
										{
											entities[ i ].hea = Math.min( entities[ i ].hea + 600, entities[ i ].hmax ); // In that case, repair the machine
											att_anim = true;
											sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#fff000' });
										}
									}
									if ( entities[ i ].GetClass() === 'sdCouncilIncinerator' ) // Council incinerator
									{
										if ( entities[ i ].hea < entities[ i ]._hmax && entities[ i ].hea > 0 ) // Does it need repairing? (And is it alive?)
										{
											entities[ i ].hea = Math.min( entities[ i ].hea + 600, entities[ i ]._hmax ); // In that case, repair it
											att_anim = true;
											sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#fff000' });
										}
									}
								}
								if ( att_anim === true )
								{
									this.attack_frame = 2;
								}
							}
							else
							if ( this.type === sdDrone.DRONE_SETR && // Setr drones
								 sdWorld.Dist2D( this.x, this.y, from_entity.x, from_entity.y ) < 128 )
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 22;
								bullet_obj.color = '#0000c8';
								bullet_obj._rail = true;
								bullet_obj._knock_scale = 3; // Low damage, high knockback
								bullet_obj._dirt_mult = 10; // For easier digging blocks when pathfinding
								bullet_obj.time_left = 10;


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 37;

								sdSound.PlaySound({ name:'gun_railgun', x:this.x, y:this.y, volume:0.33, pitch:5 });
							}
							else
							if ( this.type === sdDrone.DRONE_TZYRG ) // Tzyrg drones
							{
								let bullet_obj = new sdBullet({ x: this.x - ( Math.sin( -this.attack_an / 1000 ) * 3 ) , y: this.y + ( Math.cos( -this.attack_an / 1000 ) * 3 ) });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 15;


								sdEntity.entities.push( bullet_obj );

								let bullet_obj2 = new sdBullet({ x: this.x + ( Math.sin( -this.attack_an / 1000 ) * 3 ) , y: this.y - ( Math.cos( -this.attack_an / 1000 ) * 3 ) });

								bullet_obj2._owner = this;

								bullet_obj2.sx = dx;
								bullet_obj2.sy = dy;
								bullet_obj2.x += bullet_obj2.sx * 3;
								bullet_obj2.y += bullet_obj2.sy * 3;

								bullet_obj2.sx *= 12;
								bullet_obj2.sy *= 12;

								bullet_obj2._damage = 14;


								sdEntity.entities.push( bullet_obj2 );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 14;

								//sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.5, pitch:4 });
								
								
								sdSound.PlaySound({ name:'tzyrg_fire', x:this.x, y:this.y, volume: this.type === sdDrone.DRONE_TZYRG_WATCHER ? 2 : 1, pitch: this.type === sdDrone.DRONE_TZYRG_WATCHER ? 0.8 : 1 });

							}
							else
							if ( this.type === sdDrone.DRONE_TZYRG_WATCHER ) // Tzyrg watcher
							{
								for ( let i = 0; i < 5; i++ )
								{
									let bullet_obj = new sdBullet({ x: this.x, y: this.y });

									bullet_obj._owner = this;

									bullet_obj.sx = dx;
									bullet_obj.sy = dy;
									bullet_obj.x += bullet_obj.sx * 3;
									bullet_obj.y += bullet_obj.sy * 3;

									bullet_obj.sx *= 12 + Math.random() * 8 - Math.random() * 8;
									bullet_obj.sy *= 12 + Math.random() * 8 - Math.random() * 8;

									bullet_obj._damage = 14;


									sdEntity.entities.push( bullet_obj );
								}

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 24;

								//sdSound.PlaySound({ name:'gun_shotgun', x:this.x, y:this.y, pitch:1.25 });
								
								sdSound.PlaySound({ name:'tzyrg_fire', x:this.x, y:this.y, volume: this.type === sdDrone.DRONE_TZYRG_WATCHER ? 2 : 1, pitch: this.type === sdDrone.DRONE_TZYRG_WATCHER ? 0.8 : 1 });
							}
							else
							if ( this.type === sdDrone.DRONE_FALKOK_RAIL ) // Falkok rail drones
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 18;
								bullet_obj.color = '#ff0000';
								bullet_obj._rail = true;
								bullet_obj._rail_circled = true;


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 13;

								sdSound.PlaySound({ name:'gun_railgun', x:this.x, y:this.y, volume:0.5, pitch:4 });
							}
							else
							if ( this.type === sdDrone.DRONE_SD_BG ) // SD-BG drones
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 14 + Math.random() * 2;
								bullet_obj.sy *= 14 + Math.random() * 2;

								bullet_obj._damage = 18;
								bullet_obj.color = '#ffaa00';


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								this._burst_ammo--;
								if ( this._burst_ammo > 0 )
								this._attack_timer = this._burst_reload;
								else
								{
									this._attack_timer = 60;
									this._burst_ammo = this._burst_ammo_start;
								}

								sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:1.5 });
							}
							else
							if ( this.type === sdDrone.DRONE_CUT_DROID &&
								 ( nears[ i ].ignore_line_of_sight || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) < 64 ) || ( this._current_target.is( sdCharacter ) && this._current_target.hook_relative_to === this ) )
							{
								this._attack_timer = 4 * 30;
								this.attack_frame = 2.3 * 30 / 10;
								
								sdSound.PlaySound({ name:'cut_droid_attack', x:this.x, y:this.y, volume: 1, pitch:1, channel:this._voice_channel });
								
								//IsCuttingHook() cuts the hook
							}
							else
							if ( this.type === sdDrone.DRONE_COUNCIL_ATTACK ) // Council assault drone
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 22;
								bullet_obj.color = '#ffff00';
								bullet_obj._rail = true;
								bullet_obj._rail_alt = true;
								bullet_obj._temperature = 100;


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 13;

								sdSound.PlaySound({ name:'cube_attack', pitch: 4, x:this.x, y:this.y, volume:1.2 });
							}
							else
							{
								// Drone type has undefined behavior or too far from one of targets. We should skip the target as it can not be damaged
								continue
							}
							break; // Drone attacked something
						}
					}
				}
			}
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		
		if ( this._ignore_collisions_with === null )
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1 );
		else
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, this.CollisionFiltering );
	}
	IsCuttingHook()
	{
		if ( this.type === sdDrone.DRONE_CUT_DROID )
		{
			if ( this.attack_frame > 2 && this.attack_frame < 2.3 * 30 / 10 - 2 )
			return true;
		}
		
		return false;
	}
	get title()
	{
		if ( this.type === sdDrone.DRONE_FALKOK )
		return "Falkok Drone";
		if ( this.type === sdDrone.DRONE_ERTHAL )
		return "Erthal Drone";
		if ( this.type === sdDrone.DRONE_SARRONIAN )
		return "Sarronian Fighter E3";
		if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER )
		return "Sarronian Carrier D7";
		if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR )
		return "Sarronian Detonator D7";
		if ( this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE )
		return "Sarronian Mender B6";
		if ( this.type === sdDrone.DRONE_SARRONIAN_GAUSS )
		return "Sarronian Stalker E8";
		if ( this.type === sdDrone.DRONE_ZEKTARON )
		return "Zektaron Observer Unit";
		if ( this.type === sdDrone.DRONE_ZEKTARON_CORVETTE )
		return "Zektaron Corvette Unit";
		if ( this.type === sdDrone.DRONE_ZEKTARON_HUNTER )
		return "Zektaron Hunter Unit";
		if ( this.type === sdDrone.DRONE_COUNCIL )
		return "Council Support Drone";
		if ( this.type === sdDrone.DRONE_SETR )
		return "Setr Drone";
		if ( this.type === sdDrone.DRONE_TZYRG )
		return "Tzyrg Drone";
		if ( this.type === sdDrone.DRONE_TZYRG_WATCHER )
		return "Tzyrg Watcher";
		if ( this.type === sdDrone.DRONE_FALKOK_RAIL )
		return "Falkok Rail Drone";
		if ( this.type === sdDrone.DRONE_CUT_DROID )
		return "Cut droid";
		if ( this.type === sdDrone.DRONE_SD_BG )
		return "SD-BG Drone";
		if ( this.type === sdDrone.DRONE_COUNCIL_ATTACK )
		return "Council Assault Drone";
	
		return 'Drone';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		{
			sdEntity.Tooltip( ctx, this.title );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.death_anim === 0 )
		if ( this.type === sdDrone.DRONE_ERTHAL )
		ctx.apply_shading = false;
		
		//ctx.filter = this.filter;

		let xx = 0;

		let image = sdDrone.img_drone_falkok;

		let width  = 32;
		let height = 32;
		
		let attack_frame = 1;
		
		let hurt_frame = -1;
		
		let death_anim_frames_from = 2;
		let death_anim_frames_to = 2;
		let death_anim_speed = 5 / 30;

		if ( this.type === sdDrone.DRONE_ERTHAL )
		{
			image = sdDrone.img_drone_erthal;
			hurt_frame = 3;
		}

		if ( this.type === sdDrone.DRONE_SARRONIAN )
		{
			image = sdDrone.img_sarronian_drone1;

			width = 64;
			height = 32;
		}

		if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR_CARRIER )
		{
			image = sdDrone.img_sarronian_drone2;

			width = 64;
			height = 64;
		}

		if ( this.type === sdDrone.DRONE_SARRONIAN_DETONATOR )
		image = sdDrone.img_sarronian_drone3;

		if ( this.type === sdDrone.DRONE_SARRONIAN_REPAIR_DRONE )
		{
			image = sdDrone.img_sarronian_drone4;

			width = 32;
			height = 32;
		}

		if ( this.type === sdDrone.DRONE_SARRONIAN_GAUSS )
		{
			image = sdDrone.img_sarronian_drone5;

			width = 64;
			height = 32;
		}

		if ( this.type === sdDrone.DRONE_ZEKTARON )
		{
			image = sdDrone.img_zektaron_drone1;
			width = 32;
			height = 32;
		}

		if ( this.type === sdDrone.DRONE_ZEKTARON_CORVETTE )
		{
			image = sdDrone.img_zektaron_drone2;
			width = 32;
			height = 32;
		}

		if ( this.type === sdDrone.DRONE_ZEKTARON_HUNTER )
		{
			image = sdDrone.img_zektaron_drone3;
			width = 32;
			height = 32;
		}

		if ( this.type === sdDrone.DRONE_COUNCIL )
		image = sdDrone.img_drone_council;
	
		if ( this.type === sdDrone.DRONE_COUNCIL_ATTACK )
		image = sdDrone.img_drone_council2;

		if ( this.type === sdDrone.DRONE_SETR )
		image = sdDrone.img_drone_setr;

		if ( this.type === sdDrone.DRONE_TZYRG )
		image = sdDrone.img_drone_tzyrg;

		if ( this.type === sdDrone.DRONE_FALKOK_RAIL )
		{
			image = sdDrone.img_drone_falkok2;
			width = 48;
			height = 48;
		}

		if ( this.type === sdDrone.DRONE_TZYRG_WATCHER )
		{
			image = sdDrone.img_drone_tzyrg2;

			width = 64;
			height = 64;
		}

		if ( this.type === sdDrone.DRONE_CUT_DROID )
		{
			image = sdDrone.img_cut_droid;
			
			death_anim_frames_from = 2;
			death_anim_frames_to = 6;
			
			attack_frame = 0;
		
			if ( this.death_anim === 0 )
			for ( let i = 0; i < 3; i++ )
			{
				let x0;
				let y0;
			
				let r = 15 + Math.sin( ( sdWorld.time + ( sdShop.isDrawing ? 0 : this._anim_shift ) ) / 1000 * Math.PI * 2 ) * 2;
				
				let morph = this._anim_flap;//Math.min( 1, timer / 30, ( 2.3 * 30 - timer ) / 30 );
				r = 64 * morph + r * ( 1 - morph );
				
				let ang = i / 3 * Math.PI * 2 + this.side * ( this.attack_an / 1000 + 1.2 );
				
				ang += this._anim_twist;
				
				x0 = -this.side * Math.sin( ang ) * r;
				y0 = -this.side * Math.cos( ang ) * r;
				
				if ( morph > 0.1 )
				{
					let hit = sdWorld.TraceRayPoint( this.x, this.y, this.x+x0, this.y+y0, this, null, sdCom.com_creature_attack_unignored_classes );
					
					if ( hit )
					{
						x0 = hit.x - this.x;
						y0 = hit.y - this.y;
					}
				}

				if ( this.death_anim === 0 )
				if ( !sdShop.isDrawing )
				y0 += Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2;
			
				ctx.drawImageFilterCache( image, 0, 32, 16,16, x0 - 8, y0 - 8, 16,16 );
			}
		}
		
		if ( this.type === sdDrone.DRONE_SD_BG )
		{
			image = sdDrone.img_drone_sd_bg;

			width = 64;
			height = 64;
		}
		
		if ( this.death_anim === 0 )
		{
			if ( !sdShop.isDrawing )
			ctx.translate( 0, Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2 );
		}
		
		ctx.scale( -this.side, 1 );
		ctx.rotate( this.attack_an / 1000 );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdDrone.death_duration + sdDrone.post_death_ttl - 30 )
			ctx.globalAlpha = 0.5;

			xx = ~~Math.min( death_anim_frames_from + this.death_anim * death_anim_speed, death_anim_frames_to );
		}
		else
		{
			xx = 0;
			
			if ( this.attack_frame >= 1 )
			{
				if ( attack_frame !== -1 )
				{
					xx = attack_frame;
					ctx.apply_shading = false;
				}
			}
			else
			{
				if ( this.hurt_timer > 0 )
				if ( hurt_frame !== -1 )
				xx = hurt_frame;
			}
		}
		
		ctx.drawImageFilterCache( image, xx * width, 0, width,height, -width/2, -height/2, width,height );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemoveAsFakeEntity()
	{
		let i = sdDrone.drones.indexOf( this );
		if ( i !== -1 )
		sdDrone.drones.splice( i, 1 );
		
	}
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
		
		if ( this._is_minion_of )
		{
			this._is_minion_of._current_minions_count--;
			//console.log( this._is_minion_of._current_minions_count );
		}
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 10, 3, 0.5, 0.75 );
		//sdWorld.BasicEntityBreakEffect( this, 10, 3, 0.75, 0.75 );
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdDrone.init_class();

export default sdDrone;
