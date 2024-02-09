/*
 
	Sometimes it rains rain, sometimes it rains falkoks.


 
 
	Test specific event on server:

			sdWorld.entity_classes.sdWeather.only_instance.ExecuteEvent( 18 );

		OR

			sdWorld.entity_classes.sdWeather.only_instance.ExecuteEvent( sdWorld.entity_classes.sdWeather.EVENT_WATER_RAIN );

		OR (will break any other event)

		sdWorld.entity_classes.sdWeather.only_instance._time_until_event = 0
		sdWorld.server_config.GetAllowedWorldEvents = ()=>[ 17 ];
		sdWorld.server_config.GetDisallowedWorldEvents = ()=>[];
		sdWorld.entity_classes.sdWeather.only_instance._daily_events = sdWorld.server_config.GetAllowedWorldEvents();


	Stop all events:

		sdWorld.server_config.GetAllowedWorldEvents = ()=>[];
		sdWorld.entity_classes.sdWeather.only_instance._daily_events = [];

*/
/*

	// Not sure if method above works anymore, use this:
	sdWorld.entity_classes.sdWeather.only_instance.ExecuteEvent( 32 ); // Swap 32 for number you want to test inside
 
*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdAsteroid from './sdAsteroid.js';

import sdCube from './sdCube.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdAsp from './sdAsp.js';
import sdGrass from './sdGrass.js';
import sdCom from './sdCom.js';
import sdVirus from './sdVirus.js';
import sdBG from './sdBG.js';
import sdEnemyMech from './sdEnemyMech.js';
import sdBadDog from './sdBadDog.js';
import sdGuanako from './sdGuanako.js';
import sdRift from './sdRift.js';
import sdCrystal from './sdCrystal.js';
import sdDrone from './sdDrone.js';
import sdSpider from './sdSpider.js';
import sdAmphid from './sdAmphid.js';
import sdObelisk from './sdObelisk.js';
import sdWater from './sdWater.js';
import sdJunk from './sdJunk.js';
import sdOverlord from './sdOverlord.js';
import sdSetrDestroyer from './sdSetrDestroyer.js';
import sdBiter from './sdBiter.js';
import sdCouncilMachine from './sdCouncilMachine.js';
import sdLamp from './sdLamp.js';
import sdDoor from './sdDoor.js';
import sdTurret from './sdTurret.js';
import sdFactionSpawner from './sdFactionSpawner.js';
import sdFactions from './sdFactions.js';
import sdTzyrgAbsorber from './sdTzyrgAbsorber.js';
import sdShurgConverter from './sdShurgConverter.js';
import sdShurgTurret from './sdShurgTurret.js';
import sdShurgExcavator from './sdShurgExcavator.js';
import sdVeloxMiner from './sdVeloxMiner.js';
import sdZektaronDreadnought from './sdZektaronDreadnought.js';
import sdDropPod from './sdDropPod.js';
import sdBeamProjector from './sdBeamProjector.js';
import sdCouncilIncinerator from './sdCouncilIncinerator.js';
import sdStealer from './sdStealer.js';
import sdLongRangeAntenna from './sdLongRangeAntenna.js';
import sdVeloxFortifier from './sdVeloxFortifier.js';
import sdSolarMatterDistributor from './sdSolarMatterDistributor.js';
import sdExcavator from './sdExcavator.js';

import sdTask from './sdTask.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdStatusEffect from './sdStatusEffect.js';

import sdRenderer from '../client/sdRenderer.js';

class sdWeather extends sdEntity
{
	static init_class()
	{
		sdWeather.img_rain = sdWorld.CreateImageFromFile( 'rain' );
		sdWeather.img_rain_water = sdWorld.CreateImageFromFile( 'rain_water' );
		sdWeather.img_snow = sdWorld.CreateImageFromFile( 'snow' );
		sdWeather.img_crystal_shard = sdWorld.CreateImageFromFile( 'crystal_shard' );
		sdWeather.img_scary_mode = sdWorld.CreateImageFromFile( 'scary_mode' );
		
		sdWeather.only_instance = null;
		
		sdWeather.min_distance_from_online_players_for_entity_events = 500;
		sdWeather.max_distance_from_online_players_for_entity_events = 3000;
		
		let event_counter = 0;
		sdWeather.EVENT_ACID_RAIN =				event_counter++; // 0
		sdWeather.EVENT_ASTEROIDS =				event_counter++; // 1
		sdWeather.EVENT_CUBES =					event_counter++; // 2
		sdWeather.EVENT_FALKOKS =				event_counter++; // 3
		sdWeather.EVENT_ASPS =					event_counter++; // 4
		sdWeather.EVENT_INVASION =				event_counter++; // 5
		sdWeather.EVENT_BIG_VIRUS =				event_counter++; // 6
		sdWeather.EVENT_FLYING_MECH =			event_counter++; // 7
		sdWeather.EVENT_QUAKE =					event_counter++; // 8
		sdWeather.EVENT_BAD_DOGS =				event_counter++; // 9
		sdWeather.EVENT_RIFT_PORTAL =			event_counter++; // 10
		sdWeather.EVENT_ERTHALS =				event_counter++; // 11
		sdWeather.EVENT_OBELISK =				event_counter++; // 12
		sdWeather.EVENT_CORRUPTION =			event_counter++; // 13
		sdWeather.EVENT_WATER_RAIN =			event_counter++; // 14
		sdWeather.EVENT_SNOW =					event_counter++; // 15
		sdWeather.EVENT_LARGE_ANTICRYSTAL =		event_counter++; // 16
		sdWeather.EVENT_SARRONIANS =			event_counter++; // 17
		sdWeather.EVENT_COUNCIL_BOMB =			event_counter++; // 18
		sdWeather.EVENT_MATTER_RAIN =			event_counter++; // 19
		sdWeather.EVENT_OVERLORD =				event_counter++; // 20
		sdWeather.EVENT_ERTHAL_BEACON =			event_counter++; // 21
		sdWeather.EVENT_VELOX =					event_counter++; // 22
		sdWeather.EVENT_CRYSTAL_BLOCKS =		event_counter++; // 23
		sdWeather.EVENT_SD_EXTRACTION =			event_counter++; // 24
		sdWeather.EVENT_SETR =					event_counter++; // 25
		sdWeather.EVENT_SETR_DESTROYER =		event_counter++; // 26
		sdWeather.EVENT_CRYSTALS_MATTER =		event_counter++; // 27
		sdWeather.EVENT_DIRTY_AIR =				event_counter++; // 28
		sdWeather.EVENT_AMPHIDS =				event_counter++; // 29
		sdWeather.EVENT_BITERS =				event_counter++; // 30
		sdWeather.EVENT_LAND_SCAN =				event_counter++; // 31
		sdWeather.EVENT_FLESH_DIRT =			event_counter++; // 32
		sdWeather.EVENT_COUNCIL_PORTAL =		event_counter++; // 33
		sdWeather.EVENT_SWORD_BOT =				event_counter++; // 34
		sdWeather.EVENT_TZYRG =					event_counter++; // 35
		sdWeather.EVENT_FALKOK_OUTPOST =		event_counter++; // 36
		sdWeather.EVENT_GUANAKO =				event_counter++; // 37
		sdWeather.EVENT_TZYRG_DEVICE =			event_counter++; // 38
		sdWeather.EVENT_SHURG =					event_counter++; // 39
		sdWeather.EVENT_SHURG_CONVERTER =		event_counter++; // 40
		sdWeather.EVENT_TIME_SHIFTER =			event_counter++; // 41
		sdWeather.EVENT_ZEKTARON_DREADNOUGHT =	event_counter++; // 42
		sdWeather.EVENT_KIVORTEC_WEAPONS_POD =	event_counter++; // 43
		sdWeather.EVENT_BEAM_PROJECTOR =		event_counter++; // 44
		sdWeather.EVENT_COUNCIL_INCINERATOR =	event_counter++; // 45
		sdWeather.EVENT_STEALER =				event_counter++; // 46
		sdWeather.EVENT_LONG_RANGE_ANTENNA =	event_counter++; // 47
		sdWeather.EVENT_PROTECT_SDBG_DRONE =	event_counter++; // 48
		sdWeather.EVENT_VELOX_FORTIFIER =		event_counter++; // 49
		sdWeather.EVENT_SOLAR_DISTRIBUTOR =		event_counter++; // 50
		sdWeather.EVENT_SD_EXCAVATION =			event_counter++; // 51
		
		sdWeather.supported_events = [];
		for ( let i = 0; i < event_counter; i++ )
		sdWeather.supported_events.push( i );
		
		sdWeather.last_crystal_near_quake = null; // Used to damage left over crystals. Could be used to damage anything really
		
		sdWeather.pattern = [];
		for ( var i = 0; i < 300; i++ )
		sdWeather.pattern.push({ x:Math.random(), y:Math.random(), last_vis:false, last_y:0, last_x:0 });
		
		sdWeather.debug_rain = false;
		
		if ( sdWeather.debug_rain )
		console.warn( 'WARNING: sdWeather.debug_rain is enabled! Rain will spawn under first socket character, where it stands only' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	IsGlobalEntity() // Should never change
	{ return true; }
	
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return false; }
	
	constructor( params )
	{
		super( params );
		
		this.x = 0;
		this.y = 0;
		
		this._next_grass_seed = 0;
		
		if ( sdWeather.only_instance )
		sdWeather.only_instance.remove();
	
		sdWeather.only_instance = this;
		
		this._rain_amount = 0;
		this.raining_intensity = 0;
		this.acid_rain = 0; // 0 or 1
		this.snow = 0; // 0 or 1
		this.matter_rain = 0; // 0,1 or 2 ( 1 = crystal shard rain, 2 = anti-crystal shard rain )
		
		this._asteroid_spam_amount = 0;
		
		this._invasion = false;
		this._invasion_timer = 0; // invasion length timer
		this._invasion_spawn_timer = 0; // invasion spawn timer
		this._invasion_spawns_con = 0; // invasion spawn conditions, needs to be 0 or invasion can't end. Counter for falkoks left to spawn
		this._invasion_event = 0;
		this._potential_invasion_events = []; // array of possible invasion events. Selected during daily event selection


		// Max entity count variables
		// To change values of these, you need to edit values inside sdServerConfig.js located under /game/server inside sdServerConfigFull class.
		// Then you need to locate onAfterSnapshotLoad() and add inside the changed values, like this, for example:
		// "sdWorld.entity_classes.sdWeather.only_instance._max_ai_count = 16;"
		// ^ this would change max humanoid AI count to 16, which is set to 8 by default.

		this._max_ai_count = 8; //  Can be altered with onAfterSnapshotLoad inside sdServerConfig
		this._max_velox_mech_count = 3;
		this._max_setr_destroyer_count = 3;
		this._max_zektaron_dreadnought_count = 2; // Can spawn allot of drones and is tanky so it's best to limit it to 2
		this._max_council_incinerator_count = 2;
		this._max_drone_count = 15; // How much drones are allowed per faction?
		this._max_portal_count = 4;
		this._max_pod_count = 3;

		//
		//
		
		this._quake_scheduled_amount = 0;
		this.quake_intensity = 0;
		this._quake_temporary_not_regen_near = []; // Prevent too much ground being regenerated in same place during event
		
		this._time_until_event = 30 * 30; // 30 seconds since world reset
		this._time_until_weather_event = 30 * 30; // 30 seconds since world reset
		this._time_until_sd_task_event = 30 * 30; // 30 seconds since world reset
		//this._daily_events = [ 8 ];
		this._daily_weather_events = []; // Daily weather events are stored here. Also we need check to make sure server modification allows earthquakes
		this._daily_events = []; // Let's start with some silence.
		this._daily_sd_task_events = []; // Task events related to SD faction ( Rescue/Arrest SD, Planet scan etc )
		
		this._asteroid_timer = 0; // 60 * 1000 / ( ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 800 )
		this._asteroid_timer_scale_next = 0;
		
		this.day_time = 30 * 60 * 24 / 3;
		
		this._event_rotation_time = ( 30 * 60 * 14 ) + ( 30 * 45 ); // Time until potential events rotate, set to 14 minutes and 45 seconds so it can roll new events when fresh game starts instead of having earthquakes only for 15 minutes
		this._weather_rotation_time = ( 30 * 60 * 19 ) + ( 30 * 45 ); // Same as above but for weather, set to 19 minutes and 45 seconds so 15 seconds after it selects new weather events
		this._sd_task_rotation_time = ( 30 * 60 * 29 ) + ( 30 * 45 );; // 29 minutes, 45 seconds, selects new at 30
		
		this.air = 1; // Can happen to be 0, which means planet has no breathable air
		this._no_air_duration = 0; // Usually no-air times will be limited
		this._dustiness = 0; // Client-side variable that is used to apply visual dust effects
		
		// World bounds, but slow
		this.x1 = 0;
		this.y1 = 0;
		this.x2 = 0;
		this.y2 = 0;
		
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
	}
	GetSunIntensity()
	{
		return -Math.cos( this.day_time / ( 30 * 60 * 24 ) * Math.PI * 2 ) * 0.5 + 0.5;
	}
	IsWeatherEvent( n ) // Determines if event is a weather one. Put future weather events here
	{
		if ( n === sdWeather.EVENT_ACID_RAIN || n === sdWeather.EVENT_ASTEROIDS || n === sdWeather.EVENT_QUAKE ||
		n === sdWeather.EVENT_WATER_RAIN || n === sdWeather.EVENT_SNOW ||n === sdWeather.EVENT_MATTER_RAIN ||
		n === sdWeather.EVENT_DIRTY_AIR )
		return true;
		
		return false;
	}
	IsSDEvent( n ) // Determines if event is a SD one. Put future SD task related events here.
	{
		if ( n === sdWeather.EVENT_SD_EXTRACTION || n === sdWeather.EVENT_LAND_SCAN || n === sdWeather.EVENT_CRYSTALS_MATTER ||
			n === sdWeather.EVENT_BEAM_PROJECTOR || n === sdWeather.EVENT_LONG_RANGE_ANTENNA || n === sdWeather.EVENT_PROTECT_SDBG_DRONE ||
			n === sdWeather.EVENT_SOLAR_DISTRIBUTOR || n === sdWeather.EVENT_SD_EXCAVATION )
		return true;
		
		return false;
	}
	IsGeneralEvent( n ) // Determines if event is a general one.
	{
		if ( !this.IsWeatherEvent( n ) && !this.IsSDEvent( n ) )
		return true;
	
		return false;
	}
	GetDailyEvents() // Basically this function selects 15 general events ( No weather or SD task events )
	{
		this._potential_invasion_events = [];
		this._daily_events = [];
		
		let allowed_event_ids = ( sdWorld.server_config.GetAllowedWorldEvents ? sdWorld.server_config.GetAllowedWorldEvents() : undefined ) || sdWeather.supported_events;
				
		let disallowed_ones = ( sdWorld.server_config.GetDisallowedWorldEvents ? sdWorld.server_config.GetDisallowedWorldEvents() : [] );
				
		// allowed_event_ids = [ 8 ]; // Hack
				
		for ( let d = 0; d < allowed_event_ids.length; d++ )
		if ( disallowed_ones.indexOf( allowed_event_ids[ d ] ) !== -1 )
		{
			allowed_event_ids.splice( d, 1 );
			d--;
			continue;
		}
		
		// Potential invasion events
		if ( allowed_event_ids.indexOf( sdWeather.EVENT_FALKOKS ) !== -1 )
		this._potential_invasion_events.push( sdWeather.EVENT_FALKOKS );
	
		if ( allowed_event_ids.indexOf( sdWeather.EVENT_ASPS ) !== -1 )
		this._potential_invasion_events.push( sdWeather.EVENT_ASPS );
	
		if ( allowed_event_ids.indexOf( sdWeather.EVENT_BITERS ) !== -1 )
		this._potential_invasion_events.push( sdWeather.EVENT_BITERS );
				
		if ( allowed_event_ids.length > 0 )
		{
			let n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
			//let old_n = n;
			//let daily_event_count = Math.min( allowed_event_ids.length, sdWorld.server_config.GetAllowedWorldEventCount ? sdWorld.server_config.GetAllowedWorldEventCount() : 6 );
			let is_already_enabled = false;
			let daily_event_count = Math.min( allowed_event_ids.length, sdWorld.server_config.GetAllowedWorldEventCount() ); // It probably would work as is -- Eric Gurt
			let time = 1000;
			while ( daily_event_count > 0 && time > 0 )
			{
				is_already_enabled = false;
				n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
				if ( this.IsGeneralEvent( n ) ) // Make sure only general events are allowed here
				{
					for ( let i = 0; i < this._daily_events.length; i++ ) // Make sure event isn't already in the array
					{
						if ( this._daily_events[ i ] === n )
						is_already_enabled = true;
					}
					if ( !is_already_enabled ) // Not in array?
					{
						this._daily_events.push( n ); // Add it
						daily_event_count--;
					}
				}
				time--;
			}
		}
		//console.log( "General events: " + this._daily_events );
	}
	GetDailyWeatherEvents() // Select up to 3 weather events, 2 if you don't count earthquakes
	{
		this._daily_weather_events = [];
		
		let allowed_event_ids = ( sdWorld.server_config.GetAllowedWorldEvents ? sdWorld.server_config.GetAllowedWorldEvents() : undefined ) || sdWeather.supported_events;
				
		if ( allowed_event_ids.indexOf( sdWeather.EVENT_QUAKE ) !== -1 ) // Only if allowed
		this._daily_weather_events = [ sdWeather.EVENT_QUAKE ]; // Always enable earthquakes so ground can regenerate

		let disallowed_ones = ( sdWorld.server_config.GetDisallowedWorldEvents ? sdWorld.server_config.GetDisallowedWorldEvents() : [] );
				
		// allowed_event_ids = [ 8 ]; // Hack
				
		for ( let d = 0; d < allowed_event_ids.length; d++ )
		if ( disallowed_ones.indexOf( allowed_event_ids[ d ] ) !== -1 )
		{
			allowed_event_ids.splice( d, 1 );
			d--;
			continue;
		}
				
		if ( allowed_event_ids.length > 0 )
		{
			let n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
			//let old_n = n;
			//let daily_event_count = Math.min( allowed_event_ids.length, sdWorld.server_config.GetAllowedWorldEventCount ? sdWorld.server_config.GetAllowedWorldEventCount() : 6 );
			let is_already_enabled = false;
			let weather_event_count = Math.min( allowed_event_ids.length, ~~(Math.random() * 2 ) ); // Up to 2 events, can also be 0
			let time = 1000;
			while ( weather_event_count > 0 && time > 0 )
			{
				is_already_enabled = false;
				n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
				if ( this.IsWeatherEvent( n ) ) // Make sure only weather events are allowed here
				{
					for ( let i = 0; i < this._daily_weather_events.length; i++ ) // Make sure event isn't already in the array
					{
						if ( this._daily_weather_events[ i ] === n )
						is_already_enabled = true;
					}
					if ( !is_already_enabled ) // Not in array?
					{
						this._daily_weather_events.push( n ); // Add it
						weather_event_count--;
					}
				}
				time--;
			}
		}
		//console.log( "Weather events: " + this._daily_weather_events );
	}
	GetDailySDEvents() // Select up to 4 SD related task events
	{
		this._daily_sd_task_events = [];
		
		let allowed_event_ids = ( sdWorld.server_config.GetAllowedWorldEvents ? sdWorld.server_config.GetAllowedWorldEvents() : undefined ) || sdWeather.supported_events;

		let disallowed_ones = ( sdWorld.server_config.GetDisallowedWorldEvents ? sdWorld.server_config.GetDisallowedWorldEvents() : [] );
				
		// allowed_event_ids = [ 8 ]; // Hack
				
		for ( let d = 0; d < allowed_event_ids.length; d++ )
		if ( disallowed_ones.indexOf( allowed_event_ids[ d ] ) !== -1 )
		{
			allowed_event_ids.splice( d, 1 );
			d--;
			continue;
		}
				
		if ( allowed_event_ids.length > 0 )
		{
			let n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
			//let old_n = n;
			//let daily_event_count = Math.min( allowed_event_ids.length, sdWorld.server_config.GetAllowedWorldEventCount ? sdWorld.server_config.GetAllowedWorldEventCount() : 6 );
			let is_already_enabled = false;
			let sd_event_count = Math.min( allowed_event_ids.length, 4 ); // 4 events if possible
			let time = 1000;
			while ( sd_event_count > 0 && time > 0 )
			{
				is_already_enabled = false;
				n = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
				if ( this.IsSDEvent( n ) ) // Make sure only SD related events are allowed here
				{
					for ( let i = 0; i < this._daily_sd_task_events.length; i++ ) // Make sure event isn't already in the array
					{
						if ( this._daily_sd_task_events[ i ] === n )
						is_already_enabled = true;
					}
					if ( !is_already_enabled ) // Not in array?
					{
						this._daily_sd_task_events.push( n ); // Add it
						sd_event_count--;
					}
				}
				time--;
			}
			//Essentially we allow 4 events for every 30 minutes, when one happens it cannot happen again until next SD event selection happens.
		}
		//console.log( "SD Task events: " + this._daily_sd_task_events );
	}
	
	static SimpleSpawner( params ) // SimpleEntityS[awner // { count: [min,max], class:sdBadDog, aerial:boolean, group_radius:number, near_entity:ent, params:{ kind:()=>rand }, evalute_params:['kind'] }
	{
		// Note: SimpleSpawner is similar to SetRandomSpawnLocation, but has more features
		
		if ( !params.count )
		params.count = [ 1, 1 ];
	
		if ( typeof params.count === 'number' )
		params.count = [ params.count, params.count ];
	
		let near_entity = params.near_entity || null;
		
		params.group_radius = params.group_radius || 0;
		
		if ( near_entity && !params.group_radius )
		console.warn( 'params.near_entity was used but it requires params.group_radius to be used too' );
	
		let instances = params.count[ 0 ] + ~~( Math.random() * ( params.count[ 1 ] - params.count[ 0 ] ) );
		
		while ( instances > 0 )
		{
			let spawn_params = params.params ? params.params : { x:0, y:0 };
			
			if ( params.evalute_params )
			{
				spawn_params = Object.assign( {}, spawn_params );
				for ( let i = 0; i < params.evalute_params.length; i++ )
				spawn_params[ params.evalute_params[ i ] ] = spawn_params[ params.evalute_params[ i ] ]();
			}
			
			let dog = new ( params.class )( spawn_params );

			sdEntity.entities.push( dog );

			{
				let x,y,i;
				let tr = 1000;
				do
				{
					let place_onto = sdEntity.GetRandomEntity();
					
					// Give up if there is not entities in world at all
					if ( !place_onto )
					if ( tr > 0 )
					tr = 0;
						
					if ( place_onto.is( sdBlock ) )
					if ( place_onto.DoesRegenerate() )
					if ( place_onto._natural )
					{
						// Old approach triggers sdDeepSleep way too much and spawns entities where they would not matter all that much
						//x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						//y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );
						
						if ( params.aerial )
						{
							let morph = Math.random();
							let morph2 = Math.random();
							
							x = place_onto.x + ( place_onto._hitbox_x1 - 400 ) * morph + ( place_onto._hitbox_x2 + 400 ) * ( 1 - morph );
							y = place_onto.y + ( place_onto._hitbox_y1 - 400 ) * morph2 + ( place_onto._hitbox_y2 ) * ( 1 - morph2 );
						}
						else
						{
							let morph = Math.random();

							x = place_onto.x + place_onto._hitbox_x1 * morph + place_onto._hitbox_x2 * ( 1 - morph );
							y = place_onto.y - dog._hitbox_y2 - 1;
						}
						
						let ok = true;
						
						if ( near_entity )
						if ( !sdWorld.inDist2D_Boolean( near_entity.x, near_entity.y, x, y, params.group_radius ) )
						ok = false;
				
						if ( ok )
						if ( sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges( x, y ) )
						if ( dog.CanMoveWithoutDeepSleepTriggering( x, y, -32 ) )
						if ( dog.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( params.aerial || !dog.CanMoveWithoutOverlap( x, y + 5, 0 ) )
						if ( params.aerial || sdWorld.last_hit_entity )
						if ( params.aerial || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural ) )
						if ( !sdWorld.CheckWallExistsBox( 
								x + dog._hitbox_x1 - 16, 
								y + dog._hitbox_y1 - 16, 
								x + dog._hitbox_x2 + 16, 
								y + dog._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;

							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y, sdWeather.min_distance_from_online_players_for_entity_events ) ||
									 !sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y, sdWeather.max_distance_from_online_players_for_entity_events ) )
								{
									proper_distnace = false;
									break;
								}
							}

							if ( proper_distnace )
							{
								dog.x = x;
								dog.y = y;
								sdWorld.UpdateHashPosition( dog, false ); // Prevent inersection with other ones
								
								if ( params.group_radius > 0 )
								{
									near_entity = dog;
								}

								break;
							}
						}
					}



					tr--;
					if ( tr < 0 )
					{
						dog.remove();
						dog._broken = false;
						break;
					}
				} while( true );
			}

			instances--;
		}
	}
	
	static NotifyExtractableSoldiers(){ // Notify players on the map that some SD soldiers and criminals need extraction via LRTP.
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			if ( sdCharacter.characters[ i ]._ai_team === 0 || sdCharacter.characters[ i ]._ai_team === 6 )
			{
				//if ( sdCharacter.characters[ i ].title === 'Star Defender' || sdCharacter.characters[ i ].title === 'Criminal Star Defender' )
				//ais++;

				//Alert players of other AI Star Defenders on the map which need addressing, otherwise they might be buried corpses somewhere forever

				if ( sdCharacter.characters[ i ]._ai_team === 0 && sdCharacter.characters[ i ].title === 'Star Defender' )
				{
					let id = sdCharacter.characters[ i ]._net_id;
					for ( let j = 0; j < sdWorld.sockets.length; j++ ) // Let players know that it needs to be arrested ( don't destroy the body )
					{
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'EXTRACT-'+id, 
							executer: sdWorld.sockets[ j ].character,
							target: sdCharacter.characters[ i ],
							//extract_target: 1, // This let's the game know that it needs to draw arrow towards target. Use only when actual entity, and not class ( Like in CC tasks) needs to be LRTP extracted.
							mission: sdTask.MISSION_LRTP_EXTRACTION,
							difficulty: 0.14,
							//lrtp_ents_needed: 1,
							title: 'Rescue Star Defender',
							description: 'It seems that one of our soldiers is nearby and needs help. You should rescue the soldier and extract him to the mothership!'
						});
					}
				}

				if ( sdCharacter.characters[ i ]._ai_team === 6 && sdCharacter.characters[ i ].title === 'Criminal Star Defender' )
				{
					let id = sdCharacter.characters[ i ]._net_id;
					for ( let j = 0; j < sdWorld.sockets.length; j++ ) // Let players know that it needs to be arrested ( don't destroy the body )
					{
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'EXTRACT-'+id, 
							executer: sdWorld.sockets[ j ].character,
							target: sdCharacter.characters[ i ],
							//extract_target: 1, // This let's the game know that it needs to draw arrow towards target. Use only when actual entity, and not class ( Like in CC tasks) needs to be LRTP extracted.
							mission: sdTask.MISSION_LRTP_EXTRACTION,
							difficulty: 0.14,
							//lrtp_ents_needed: 1,
							title: 'Arrest Star Defender',
							description: 'It seems that one of criminals is nearby and needs to answer for their crimes. Arrest them and bring them to the mothership, even if it means bringing the dead body!'
						});
					}
				}
			}
		}
	static SetRandomSpawnLocation( ent ) // GetSpawnPosition // GetRandom // Locate spawn location for humanoids. First it uses same method as for Erthal spider bots / bad dogs, and if it doesn't find a position it uses old humanoid method.
	{
		// Note: SimpleSpawner supports some more features, but other than that these 2 methods are kind of same
		
		let x,y,i;
		//let located_spawn = false;
		let tr = 1500;

		// New spawn but prioritizes open space / surface
		do
		{
			let place_onto = sdEntity.GetRandomEntity();
					
			// Give up if there is not entities in world at all
			if ( !place_onto )
			if ( tr > 0 )
			{
				tr = 0;
				break;
			}

			if ( place_onto.is( sdBlock ) )
			if ( place_onto.DoesRegenerate() )
			if ( place_onto._natural )
			{
				//x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
				//y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

				let morph = Math.random();

				x = place_onto.x + place_onto._hitbox_x1 * morph + place_onto._hitbox_x2 * ( 1 - morph );
				y = place_onto.y - ent._hitbox_y2 - 1;
				
				if ( sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges( x, y ) )
				if ( ent.CanMoveWithoutDeepSleepTriggering( x, y, -32 ) )
				if ( ent.CanMoveWithoutOverlap( x, y, 0 ) )
				if ( !ent.CanMoveWithoutOverlap( x, y + 32, 0 ) )
				{
					let ground_entity = sdWorld.last_hit_entity;
					
					if ( ground_entity )
					if ( tr < 1000 || ent.CanMoveWithoutOverlap( x, y - 64, 0 ) ) // Include caves after first 1000 iterations
					if ( ground_entity.is( sdBlock ) && ground_entity.DoesRegenerate() && ground_entity._natural )
					if ( !sdWorld.CheckWallExistsBox( 
							x + ent._hitbox_x1 - 16, 
							y + ent._hitbox_y1 - 64, 
							x + ent._hitbox_x2 + 16, 
							y + ent._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
					{
						let proper_distnace = true;

						for ( i = 0; i < sdWorld.sockets.length; i++ )
						if ( sdWorld.sockets[ i ].character )
						{
							//let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );

							//if ( di < 500 )
							if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y, sdWeather.min_distance_from_online_players_for_entity_events ) ||
								 !sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y, sdWeather.max_distance_from_online_players_for_entity_events ) )
							{
								proper_distnace = false;
								break;
							}
						}

						if ( proper_distnace )
						{
							ent.x = x;
							ent.y = y;
							//located_spawn = true;
							return true;
						}
					}
				}
			}
									
			tr--;
		//} while ( tr >= 1000 );
		} while ( tr > 0 );
		
		return false;
		
		/*
		
		if ( tr >= 500 && tr < 1000 ) // New spawn but can spawn in caves too
		do
		{
			x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
			y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

			if ( ent.CanMoveWithoutOverlap( x, y, 0 ) )
			if ( !ent.CanMoveWithoutOverlap( x, y + 32, 0 ) )
			if ( sdWorld.last_hit_entity )
			if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
			if ( !sdWorld.CheckWallExistsBox( 
					x + ent._hitbox_x1 - 16, 
					y + ent._hitbox_y1 - 116, 
					x + ent._hitbox_x2 + 16, 
					y + ent._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
			{
				let proper_distnace = true;
										
				for ( i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				{
					let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
											
					if ( di < 500 )
					{
						proper_distnace = false;
						break;
					}
				}
							
				if ( proper_distnace )
				{
					ent.x = x;
					ent.y = y;
					located_spawn = true;
					return true;
				}
			}
									
			tr--;
		} while (tr >= 500 );
		if ( tr > 0 && tr < 500 ) // Regular "old" humanoid AI spawn
		do
		{
			if ( Math.random() > 0.5 )
			x = sdWorld.world_bounds.x1 + 16 + 16 * Math.random() * 4;
			else
			x = sdWorld.world_bounds.x2 - 16 - 16 * Math.random() * 4;

			y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

			if ( ent.CanMoveWithoutOverlap( x, y, 0 ) )
			if ( !ent.CanMoveWithoutOverlap( x, y + 32, 0 ) )
			if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() ) ) // Only spawn on ground
			{
					ent.x = x;
					ent.y = y;
					located_spawn = true;
					return true;
			}
			tr--;
		} while ( tr > 0 );

		if ( tr <= 0 )
		return false;
		*/
	}
	GenerateOutpost( x = 0, y = 0, base_type = -1, interior_type = -1, ai_team = 0 ) // Generate a faction outpost.
	{
		// TODO: These will be reworked with presets at some point. Also spawn is inefficient in terms of how many sdDeepSleep it would awake
		
		let init_x = x;
		let init_y = y;
		let i = Math.round( Math.random() * 12 );
		var filter = 'hue-rotate('+(~~(i/12*360))+'deg)';

		let potential_doors = []; // Blocks which could get replaced by doors, so we can replace some with doors when we generate base interior

		if ( base_type === 0 ) // 10x10 base
		{
			for ( let j = 0; j < 10; j++ )
			{
				y += 32;
				x = init_x;
				{
					let block = new sdBlock({ x:x, y:y , material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
					sdEntity.entities.push( block );

					if ( j === 4 || j === 5 )
					potential_doors.push( block ); // Left-middle side is a potential door entrance

					let bg = new sdBG({ x:x, y:y , width: 32, height: 32 });
					sdEntity.entities.push( bg );
				}
				for ( let i = 0; i < 8; i++ )
				{
					x += 32;

					let bg = new sdBG({ x:x, y:y , width: 32, height: 32 });
					sdEntity.entities.push( bg );

					if ( j === 0 || j === 9 )
					{
						let block = new sdBlock({ x:x, y:y , material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
						sdEntity.entities.push( block );

						if ( i === 3 || i === 4 )
						potential_doors.push( block ); // Top-middle and bottom-middle side is a potential door entrance
					}
				}
				x += 32;
				{
					let block = new sdBlock({ x:x, y:y , material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
					sdEntity.entities.push( block );

					if ( j === 4 || j === 5 )
					potential_doors.push( block ); // Right-middle side is a potential door entrance

					let bg = new sdBG({ x:x, y:y , width: 32, height: 32});
					sdEntity.entities.push( bg );
				}
			}
			// Interior types
			if ( interior_type === 0 ) // -1 is test case which is blank, so we start with 0
			{
				x = init_x; // Reset starting coordinates
				y = init_y + 32;

				// Lamps

				let lamp = new sdLamp({ x:x + 64 + 16, y:y + 64 + 16 });
				sdEntity.entities.push( lamp );

				let lamp2 = new sdLamp({ x:x + ( 32 * 8 ) - 32 + 16, y:y + 64 + 16 });
				sdEntity.entities.push( lamp2 );

				let lamp3 = new sdLamp({ x:x + ( 32 * 8 ) - 32 + 16, y:y + ( 32 * 8 ) - 32 + 16 });
				sdEntity.entities.push( lamp3 );

				let lamp4 = new sdLamp({ x:x + 64 + 16, y:y + ( 32 * 8 ) - 32 + 16 });
				sdEntity.entities.push( lamp4 );

				// Turrets

				let turret = new sdTurret({ x:x + 64 + 32, y:y + 64 + 16, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret );
				turret.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret2 = new sdTurret({ x:x + 64 + 16, y:y + 64 + 32, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret2 );
				turret2.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret2.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret3 = new sdTurret({ x:x + ( 32 * 8 ) - 32, y:y + 64 + 16, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret3 );
				turret3.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret3.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret4 = new sdTurret({ x:x + ( 32 * 8 ) - 32 + 16, y:y + 64 + 32, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret4 );
				turret4.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret4.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret5 = new sdTurret({ x:x + ( 32 * 8 ) - 32, y:y + ( 32 * 8 ) - 32 + 16 , type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret5 );
				turret5.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret5.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret6 = new sdTurret({ x:x + 64 + 32, y:y + ( 32 * 8 ) - 32 + 16 , type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret6 );
				turret6.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret6.kind = Math.round( Math.random() * 3 );	// Randomize turret kind



				// Blocks

				let block = new sdBlock({ x:x + 32, y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block );

				let block2 = new sdBlock({ x:x + 64, y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block2 );

				let block3 = new sdBlock({ x:x + 32, y:y + 64, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block3 );

				let block4 = new sdBlock({ x:x + ( 32 * 8 ), y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block4 );

				let block5 = new sdBlock({ x:x + ( 32 * 8 ) - 32, y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block5 );

				let block6 = new sdBlock({ x:x + ( 32 * 8 ), y:y + 64, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block6 );

				let block7 = new sdBlock({ x:x + ( 32 * 8 ), y:y + ( 32 * 8 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block7 );

				let block8 = new sdBlock({ x:x + ( 32 * 8 ) - 32, y:y + ( 32 * 8 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block8 );

				let block9 = new sdBlock({ x:x + ( 32 * 8 ), y:y + ( 32 * 8 ) - 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block9 );

				let block10 = new sdBlock({ x:x + 32, y:y + ( 32 * 8 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block10 );

				let block11 = new sdBlock({ x:x + 64, y:y + ( 32 * 8 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block11 );

				let block12 = new sdBlock({ x:x + 32, y:y + ( 32 * 8 ) - 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block12 );

				let block13 = new sdBlock({ x:x + 128, y:y + ( 32 * 5 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block13 );

				let block14 = new sdBlock({ x:x + 160, y:y + ( 32 * 5 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block14 );

				//Spawner
					
				let spawner = new sdFactionSpawner({ x:x + 160, y:y + ( 32 * 8 ) + 16, type:ai_team });
				sdEntity.entities.push( spawner );

				// Doors

				for ( let i = 0; i < potential_doors.length - 2; i++ ) // No bottom entrance
				{
					let door_x = potential_doors[ i ].x + 16;
					let door_y = potential_doors[ i ].y + 16;
					potential_doors[ i ].remove();
					potential_doors[ i ]._broken = false;


					let door = new sdDoor({ x:door_x, y:door_y, open_type:1, model: sdDoor.MODEL_ARMORED, _reinforced_level: 1, filter: filter, _ai_team:ai_team });
					sdEntity.entities.push( door );

					door.Damage( 1 ); // Enable sdSensorArea so it can actually be opened by AI
				}
			}
			if ( interior_type === 1 ) // -1 is test case which is blank, so we start with 0
			{
				x = init_x; // Reset starting coordinates
				y = init_y + 32;

				// Lamps

				let lamp = new sdLamp({ x:x + 64 + 16, y:y + 64 + 16 });
				sdEntity.entities.push( lamp );

				let lamp2 = new sdLamp({ x:x + ( 32 * 8 ) - 32 + 16, y:y + 64 + 16 });
				sdEntity.entities.push( lamp2 );

				let lamp3 = new sdLamp({ x:x + ( 32 * 5 ), y:y + ( 32 * 6 ) + 48 });
				sdEntity.entities.push( lamp3 );

				//let lamp4 = new sdLamp({ x:x + 64 + 16, y:y + ( 32 * 8 ) - 32 + 16 });
				//sdEntity.entities.push( lamp4 );

				// Turrets

				let turret = new sdTurret({ x:x + 64 + 32, y:y + 64 + 16, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret );
				turret.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret2 = new sdTurret({ x:x + 64 + 16, y:y + 64 + 32, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret2 );
				turret2.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret2.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret3 = new sdTurret({ x:x + ( 32 * 8 ) - 32, y:y + 64 + 16, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret3 );
				turret3.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret3.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret4 = new sdTurret({ x:x + ( 32 * 8 ) - 32 + 16, y:y + 64 + 32, type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret4 );
				turret4.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret4.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret5 = new sdTurret({ x:x + ( 32 * 8 ) - 64, y:y + ( 32 * 8 ) - 32 + 16 , type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret5 );
				turret5.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret5.kind = Math.round( Math.random() * 3 );	// Randomize turret kind

				let turret6 = new sdTurret({ x:x + 64 + 64, y:y + ( 32 * 8 ) - 32 + 16 , type:1, _ai_team:ai_team });
				sdEntity.entities.push( turret6 );
				turret6.lvl = Math.round( Math.random() * 3 ); // Randomize turret level
				turret6.kind = Math.round( Math.random() * 3 );	// Randomize turret kind



				// Blocks

				let block = new sdBlock({ x:x + 32, y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block );

				let block2 = new sdBlock({ x:x + 64, y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block2 );

				let block3 = new sdBlock({ x:x + 32, y:y + 64, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block3 );

				let block4 = new sdBlock({ x:x + ( 32 * 8 ), y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block4 );

				let block5 = new sdBlock({ x:x + ( 32 * 8 ) - 32, y:y + 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block5 );

				let block6 = new sdBlock({ x:x + ( 32 * 8 ), y:y + 64, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block6 );

				let block7 = new sdBlock({ x:x + ( 32 * 8 ), y:y + ( 32 * 8 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block7 );

				let block8 = new sdBlock({ x:x + ( 32 * 8 ), y:y + ( 32 * 8 ) - 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block8 );

				let block9 = new sdBlock({ x:x + ( 32 * 8 ), y:y + ( 32 * 8 ) - 64, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block9 );

				let block10 = new sdBlock({ x:x + 32, y:y + ( 32 * 8 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block10 );

				let block11 = new sdBlock({ x:x + 32, y:y + ( 32 * 8 ) - 32, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block11 );

				let block12 = new sdBlock({ x:x + 32, y:y + ( 32 * 8 ) - 64, material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block12 );

				let block13 = new sdBlock({ x:x + 128, y:y + ( 32 * 6 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block13 );

				let block14 = new sdBlock({ x:x + 160, y:y + ( 32 * 6 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block14 );

				let block15 = new sdBlock({ x:x + 96, y:y + ( 32 * 6 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block15 );

				let block16 = new sdBlock({ x:x + 192, y:y + ( 32 * 6 ), material: sdBlock.MATERIAL_WALL, filter:filter, _ai_team:ai_team, width: 32, height: 32 });
				sdEntity.entities.push( block16 );

				//Spawner
					
				let spawner = new sdFactionSpawner({ x:x + 160, y:y + ( 32 * 8 ) + 16, type:ai_team });
				sdEntity.entities.push( spawner );

				// Doors

				for ( let i = 0; i < potential_doors.length - 2; i++ ) // No bottom entrance
				{
					let door_x = potential_doors[ i ].x + 16;
					let door_y = potential_doors[ i ].y + 16;
					potential_doors[ i ].remove();
					potential_doors[ i ]._broken = false;


					let door = new sdDoor({ x:door_x, y:door_y, open_type:1, model: sdDoor.MODEL_ARMORED, _reinforced_level: 1, filter: filter, _ai_team:ai_team });
					sdEntity.entities.push( door );

					door.Damage( 1 ); // Enable sdSensorArea so it can actually be opened by AI
				}

				let door = new sdDoor({ x:x + 96 - 16, y:y + ( 32 * 6 ) + 16, open_type:1, model: sdDoor.MODEL_ARMORED, _reinforced_level: 1, filter: filter, _ai_team:ai_team });
				sdEntity.entities.push( door );
				door.Damage( 1 );

				let door2 = new sdDoor({ x:x + 224 + 16, y:y + ( 32 * 6 ) + 16, open_type:1, model: sdDoor.MODEL_ARMORED, _reinforced_level: 1, filter: filter, _ai_team:ai_team });
				sdEntity.entities.push( door2 );
				door2.Damage( 1 );
			}
		}
	}
	TraceDamagePossibleHere( x,y, steps_max=Infinity, sun_light_tracer=false, rain_tracer=false )
	{
		const consider_sky_open_height = 200;
		let space_until_premature_true = consider_sky_open_height;
		
		for ( 
				var yy = y; 
		
				yy > sdWorld.world_bounds.y1 && 
				steps_max > 0 && 
				space_until_premature_true > 0; 
				
				yy -= 8, 
				space_until_premature_true -= 8, 
				steps_max-- 
			)
		{
			if ( sdWorld.CheckWallExists( x, yy, null, null, [ 'sdBlock', 'sdDoor', 'sdWater' ] ) )
			{
				if ( !sdWorld.last_hit_entity ) // sdDeepSleep or world edge likely
				if ( y - yy > 64 ) // Not on edge between 2 sdDeepSleep areas
				{
					//debugger;
					return true;
				}
				
				if ( sun_light_tracer )
				{
					if ( sdWorld.last_hit_entity )
					if ( sdWorld.last_hit_entity.is( sdBlock ) )
					{
						if ( sdWorld.last_hit_entity.IsPartiallyTransparent() )
						continue;
					}
				}
				else
				if ( rain_tracer )
				{
					if ( sdWorld.last_hit_entity )
					if ( sdWorld.last_hit_entity.is( sdBlock ) )
					{
						if ( sdWorld.last_hit_entity.IsLetsLiquidsThrough() )
						continue;
					}
				}
				return false;
			}
			
			if ( sdWorld.CheckWallExists( x, yy, null, null, [ 'sdBG', 'sdTheatre' ] ) )
			{
				space_until_premature_true = consider_sky_open_height;
			}
		}

		return true;
	}
	ExecuteEvent( r = -1 ) // Used to be under OnThink ( GSPEED ) but swapped for this so any event can be executed at any time, from any entity
	{
		sdWeather.NotifyExtractableSoldiers(); // Upon every event execution, notify players about remaining SD soldiers for LRTP extraction
		// This is implemented this way because players connect after a SD soldier spawns and task is not given to the later connected players.
		
		//console.log( r );
		if ( r === sdWeather.EVENT_ACID_RAIN || r === sdWeather.EVENT_WATER_RAIN || r === sdWeather.EVENT_SNOW || r === sdWeather.EVENT_MATTER_RAIN )
		{
			this._rain_amount = 30 * 15 * ( 1 + Math.random() * 3 ); // start rain for ~15 seconds
		}

		if ( r === sdWeather.EVENT_ASTEROIDS )
		this._asteroid_spam_amount = 30 * 15 * ( 1 + Math.random() * 2 );

		if ( r === sdWeather.EVENT_CUBES )
		{
			sdWeather.SimpleSpawner({

				count: [ 1, 1 + Math.ceil( Math.random() * 2 ) ],
				class: sdCube,
				params: { kind: ()=>sdCube.GetRandomKind() },
				evalute_params: [ 'kind' ],
				
				aerial: true

			});
			/*
			//for ( let t = Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) + 1; t > 0; t-- )
			for ( let t = Math.ceil( Math.random() * 2 ) + 1; t > 0; t-- )
			//if ( sdCube.alive_cube_counter < sdCube.GetMaxAllowedCubesOfKind( 0 ) ) // 20
			{
				let cube = new sdCube({ 
					x:sdWorld.world_bounds.x1 + 32 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 64 ), 
					y:sdWorld.world_bounds.y1 + 32,
					kind:   sdCube.GetRandomKind() // _kind = 1 -> is_huge = true , _kind = 2 -> is_white = true , _kind = 3 -> is_pink = true
				});
				cube.sy += 10;
				sdEntity.entities.push( cube );

				if ( !cube.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
				{
					cube.remove();
					cube._broken = false;
				}
				else
				sdWorld.UpdateHashPosition( cube, false ); // Prevent inersection with other ones
			}*/
		}

		if ( r === sdWeather.EVENT_FALKOKS )
		{
			let ais = 0;

			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			if ( sdCharacter.characters[ i ].hea > 0 )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			if ( sdCharacter.characters[ i ]._ai_team === 1 ) // Otherwise it will prevent potentially spawning other factions, like Setr, Velox and Erthal
			{
				ais++;
			}

			let instances = 0;
			let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

			//let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && ais < this._max_ai_count )
			{

				let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

				sdEntity.entities.push( character_entity );

				{
					if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
					{
						character_entity.remove();
						character_entity._broken = false;
						break;
					}
					else
					{
						sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_FALKOK );
						break;
					}
				}

				instances++;
				ais++;
			}
			{ // Spawn some drones aswell
				let drones = 0;
				for ( let i = 0; i < sdDrone.drones.length; i++ )
				{
					let drone = sdDrone.drones[ i ];
					if ( drone._ai_team === 1 ) // Falkok drone?
					drones++;
				}
				if ( drones < this._max_drone_count ) // Sometimes it can go a little over the cap, can be changed later if needed.
				{
					sdWeather.SimpleSpawner({

						count: [ 2, 3 ],
						class: sdDrone,
						params: { _ai_team: 1, type: sdDrone.DRONE_FALKOK },
						aerial: true

					});
				
					if ( Math.random() < 0.5 )
					sdWeather.SimpleSpawner({

						count: [ 2, 3 ],
						class: sdDrone,
						params: { _ai_team: 1, type: sdDrone.DRONE_FALKOK_RAIL },
						aerial: true

					});
				}
			}
		}

		if ( r === sdWeather.EVENT_ASPS )
		{
			if ( sdAsp.asps_tot < 25 || sdWorld.server_config.aggressive_hibernation )
			sdWeather.SimpleSpawner({

				count: [ 1, 1 + Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) ],
				class: sdAsp,
				
				aerial: true

			});

			/*for ( let t = Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) + 1; t > 0; t-- )
			if ( sdAsp.asps_tot < 25 )
			{
				let asp = new sdAsp({ 
					x:sdWorld.world_bounds.x1 + 32 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 64 ), 
					y:sdWorld.world_bounds.y1 + 32
				});
				//asp.sy += 10;
				sdEntity.entities.push( asp );

				if ( !asp.CanMoveWithoutOverlap( asp.x, asp.y, 0 ) )
				{
					asp.remove();
					asp._broken = false;
				}
				else
				sdWorld.UpdateHashPosition( asp, false ); // Prevent inersection with other ones
			}*/
		}
					
		if ( r === sdWeather.EVENT_INVASION ) // Invasion event
		{
			if ( this._invasion === false ) // Prevent invasion resetting
			{
				this._invasion = true;
				this._invasion_timer = 30 * 60 * 3; // 3 minutes; using GSPEED for measurement (feel free to change that, I'm not sure how it should work)
				this._invasion_spawn_timer = 0;
				this._invasion_spawns_con = 25; // At least 25 Event executions must happen otherwise invasion will not end
				this._invasion_event = this._potential_invasion_events[ Math.floor( Math.random() * this._potential_invasion_events.length ) ];; // Random event which can fit the invasion is selected.
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // if the event is already active, quickly initiate something else
						
		}

		if ( r === sdWeather.EVENT_BIG_VIRUS ) // Big virus event
		{
			let instances = 0;
			let instances_tot = 1 + Math.ceil( Math.random() * 3 );

			//let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && sdVirus.viruses_tot < 40  && sdVirus.big_viruses < 4 )
			{

				let virus_entity = new sdVirus({ x:0, y:0 });
				virus_entity._is_big = true;
				sdEntity.entities.push( virus_entity );
				sdVirus.big_viruses++;
				{
					if ( !sdWeather.SetRandomSpawnLocation( virus_entity ) )
					{
						virus_entity.remove();
						virus_entity._broken = false;
						break;
					}
					/*else
					{

						if ( virus_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x + 32, y, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x - 32, y, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x, y - 32, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x + 32, y - 32, 0 ) )
						if ( virus_entity.CanMoveWithoutOverlap( x - 32, y - 32, 0 ) )
						if ( !virus_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() ) ) // Only spawn on ground
						{
							virus_entity.x = x;
							virus_entity.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							//console.log('Big virus spawned!');
							//console.log(sdVirus.big_viruses);
							break;
						}
					}*/
				}

				instances++;
			}
		}
					
		if ( r === sdWeather.EVENT_FLYING_MECH ) // Flying Mech event
		{
			let instances = 0;
			let instances_tot = Math.ceil( ( Math.random() * sdWorld.GetPlayingPlayersCount() ) / 3 );

			//let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && sdEnemyMech.mechs.length < this._max_velox_mech_count )
			{

				sdWeather.SimpleSpawner({
				
					count: [ 1, 1 ],
					class: sdEnemyMech,
					aerial: true
				
				});

				instances++;
			}
		}
					
		if ( r === sdWeather.EVENT_QUAKE ) // Earth quake, idea by LazyRain, implementation by Eric Gurt
		{
			this._quake_scheduled_amount = 30 * ( 10 + Math.random() * 30 );
			this._quake_temporary_not_regen_near.length = 0;
		}
					
		if ( r === sdWeather.EVENT_BAD_DOGS ) // Spawn few sdBadDog-s somewhere on ground where players don't see them
		{
			sdWeather.SimpleSpawner({
				
				count: [ 1, 3 ],
				class: sdBadDog
				
			});
		}

		if ( r === sdWeather.EVENT_RIFT_PORTAL ) // Portal event
		{
			if ( Math.random() < 0.7 ) // 70% chance for rift portal to spawn
			{
				if ( sdRift.portals < this._max_portal_count )
				sdWeather.SimpleSpawner({

					count: [ 1, 1 ],
					class: sdRift

				});


				/*let instances = 1;
				while ( instances > 0 && sdRift.portals < this._max_portal_count )
				{

					let portal = new sdRift({ x:0, y:0 });

					sdEntity.entities.push( portal );

					{
						let x,y,i;
						let tr = 1000;
						do
						{
							x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							let chance = Math.random();
							if ( chance < 0.25 ) // 25% chance it's a "Cube" spawning portal ( 0 - 0.25 )
							portal.type = 2;
							else
							if ( chance < 0.5 ) // 20% chance it's a "Asteroid" spawning portal ( 0.25 - 0.5 )
							portal.type = 3;
							else
							if ( chance < 0.6 ) // 10% chance it's a "Black hole" portal ( 0.5 - 0.6 )
							portal.type = 4;
							else
							portal.type = 1;

							if ( portal.CanMoveWithoutOverlap( x, y, 0 ) )
							if ( !portal.CanMoveWithoutOverlap( x, y + 24, 0 ) )
							if ( sdWorld.last_hit_entity )
							if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
							if ( !sdWorld.CheckWallExistsBox( 
									x + portal._hitbox_x1 - 8, 
									y + portal._hitbox_y1 - 8, 
									x + portal._hitbox_x2 + 8, 
									y + portal._hitbox_y2 + 8, null, null, [ 'sdWater' ], null ) )
							{
								portal.x = x;
								portal.y = y;

								break;
							}
									


							tr--;
							if ( tr < 0 )
							{
								portal.remove();
								portal._broken = false;
								break;
							}
						} while( true );
					}

					instances--;
				}*/
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
					
		if ( r === sdWeather.EVENT_ERTHALS ) // Spawn 3-6 sdSpiders, drones somewhere on ground where players don't see them and Erthal humanoids
		{
			let spider_type = Math.random() < 0.35 ? 1 : 0; // 35% chance for it to be a mini tank bot
			sdWeather.SimpleSpawner({

				count: [ 1, 2 ],
				class: sdSpider,
				params: { _ai_team: 2, type: spider_type }

			});
			
			let drones = 0;
			for ( let i = 0; i < sdDrone.drones.length; i++ )
			{
				let drone = sdDrone.drones[ i ];
				if ( drone._ai_team === 2 ) // Erthal drone?
				drones++;
			}
			if ( drones < this._max_drone_count ) // Sometimes it can go a little over the cap, can be changed later if needed.
			sdWeather.SimpleSpawner({

				count: [ 2, 3 ],
				class: sdDrone,
				params: { _ai_team: 2, type: sdDrone.DRONE_ERTHAL },
				aerial: true

			});
			
			
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ]._ai_team === 2 ) // Same as falkoks, needed so it doesn't block spawning other factions
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 0 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( percent / sdWorld.GetPlayingPlayersCount() ) ) // Spawn chance depends on RNG, chances increase if more players ( or all ) have at least one built tool / shop upgrade
			{
				let robots = 0;
				let robots_tot = 1 + ( ~~( Math.random() * 2 ) );

				//let left_side = ( Math.random() < 0.5 );

				while ( robots < robots_tot && ais < this._max_ai_count )
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

					sdEntity.entities.push( character_entity );

					{
						if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
						else
						{
							sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_ERTHAL );
							break;
						}
					}
					robots++;
					ais++;
					//console.log('Erthal spawned!');
				}
			}
		}
		if ( r === sdWeather.EVENT_OBELISK ) // Spawn an obelisk near ground where players don't see them
		{
			if ( sdObelisk.obelisks_counter < 17 || sdWorld.server_config.aggressive_hibernation )
			sdWeather.SimpleSpawner({

				count: [ 1, 1 ],
				class: sdObelisk,
				params: { type: 1 + Math.round( Math.random() * 7 ) }

			});

			/*let instances = 1;
			while ( instances > 0 && sdObelisk.obelisks_counter < 17 )
			{

				let obelisk = new sdObelisk({ x:0, y:0 });
				obelisk.type = Math.round( 1 + Math.random() * 7 );

				sdEntity.entities.push( obelisk );

				{
					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( obelisk.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !obelisk.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + obelisk._hitbox_x1 - 16, 
								y + obelisk._hitbox_y1 - 16, 
								x + obelisk._hitbox_x2 + 16, 
								y + obelisk._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;
										
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
											
								if ( di < 500 )
								{
									proper_distnace = false;
									break;
								}
							}
										
							if ( proper_distnace )
							{
								obelisk.x = x;
								obelisk.y = y;

								break;
							}
						}
									


						tr--;
						if ( tr < 0 )
							{
							obelisk.remove();
							obelisk._broken = false;
							break;
						}
					} while( true );
				}

				instances--;
			}*/
		}
		
		if ( r === sdWeather.EVENT_CORRUPTION ) // Ground corruption start from random block
		{
			for ( let tr = 0; tr < 100; tr++ )
			{
				let i = Math.floor( Math.random() * sdEntity.entities.length );
				
				if ( i < sdEntity.entities.length )
				{
					let ent = sdEntity.entities[ i ];
					
					if ( ent.is( sdBlock ) )
					if ( ent._natural )
					{
						ent.Corrupt();
						break;
					}
				}
				else
				{
					break;
				}
			}
		}

		if ( r === 0 || 
			 r === 14 || 
			 r === 15 ||
			 r === 19 )
		if ( this.raining_intensity <= 0 )
		{
			if ( r === sdWeather.EVENT_ACID_RAIN )
			{
				this.acid_rain = 1;
				this.snow = 0;
				this.matter_rain = 0;
			}
		
			if ( r === sdWeather.EVENT_WATER_RAIN )
			{
				this.acid_rain = 0;
				this.snow = 0;
				this.matter_rain = 0;
			}

			if ( r === sdWeather.EVENT_SNOW )
			{
				this.snow = 1;
				this.acid_rain = 0;
				this.matter_rain = 0;
			}

			if ( r === sdWeather.EVENT_MATTER_RAIN )
			{
				if ( Math.random() < 0.8 )
				{
					this.matter_rain = 1;
					this.snow = 0;
					this.acid_rain = 0;
				}
				else
				{
					this.matter_rain = 2;
					this.snow = 0;
					this.acid_rain = 0;
				}
			}
		}

		if ( r === sdWeather.EVENT_LARGE_ANTICRYSTAL ) // Spawn a Large Anti-Crystal anywhere on the map outside player views which drains active players' matter if they're close enough
		{
			if ( Math.random() < 0.2 ) // 20% chance for the Large Anti-Crystal to spawn
			{
				if ( sdJunk.anti_crystals < 1 )
				sdWeather.SimpleSpawner({

					count: [ 1, 1 ],
					class: sdJunk,
					params: { type: sdJunk.TYPE_PLANETARY_MATTER_DRAINER }

				});
				
				/*
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdJunk.anti_crystals < 1 )
				{
					let anticrystal = new sdJunk({ x:0, y:0, type: 3 });

					sdEntity.entities.push( anticrystal );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( anticrystal.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( anticrystal.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !anticrystal.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + anticrystal._hitbox_x1 - 16, 
								y + anticrystal._hitbox_y1 - 16, 
								x + anticrystal._hitbox_x2 + 16, 
								y + anticrystal._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									proper_distnace = false;
									break;
								}
							}
									
							if ( proper_distnace )
							{
								anticrystal.x = x;
								anticrystal.y = y;

								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							anticrystal.remove();
							anticrystal._broken = false;
							break;
						}
					} while( true );

					instances++;
				}*/

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_SARRONIANS ) // Sarronian & Zektaron factions spawn. Spawns humanoids and drones.
		{
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ]._ai_team === 4 )
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 20 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( percent / sdWorld.GetPlayingPlayersCount() ) ) // Spawn chance depends on RNG, chances increase if more players ( or all ) have at least 20 levels
			{
				let instances = 0;
				let instances_tot = 4 + ( ~~( Math.random() * 3 ) );

				//let left_side = ( Math.random() < 0.5 );


				while ( instances < instances_tot && ais < this._max_ai_count )
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

					sdEntity.entities.push( character_entity );

					{
						if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
						else
						{
							sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_SARRONIAN );
							break;
						}
					}

					instances++;
					ais++;
				}

				//let drones = 0;
				//let drones_tot = Math.min( 8 ,Math.ceil( ( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) ) );
				
				let drone_type = ( Math.random() < 0.075 ) ? 12 /*Sarronian Mender*/ : ( Math.random() < 0.175 ) ? 4 /*Sarronian Carrier*/
						: ( Math.random() < 0.30 ) ? 12 /*Sarronian Gauss*/ : ( Math.random() < 0.50 ) ? 3 /*Sarronian*/ : ( Math.random() < 0.70 ) ? 15 /*Zektaron Corvette*/
						: ( Math.random() < 0.95 ) ? 14 /*Zektaron*/ : 16 /*Zektaron Hunter*/;
						
				let drones = 0;
				for ( let i = 0; i < sdDrone.drones.length; i++ )
				{
					let drone = sdDrone.drones[ i ];
					if ( drone._ai_team === 4 ) // Sarronian/Zektaron drone?
					drones++;
				}
				if ( drones < this._max_drone_count ) // Sometimes it can go a little over the cap, can be changed later if needed.
				sdWeather.SimpleSpawner({

					count: [ 2, 4 ],
					class: sdDrone,
					params: { _ai_team: 4, type: drone_type },
					aerial: true

				});
				
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_COUNCIL_BOMB ) // Spawn a Council Bomb anywhere on the map outside player views which detonates in 10 minutes
		{
			let chance = 0;
			let req_char = 0;
			let char = 0;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character !== null )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					char++;
					if ( sdWorld.sockets[ i ].character.build_tool_level >= 15 )
					req_char++;
				}
			}
			chance = ( req_char / char ) * 0.6; // Chance to execute this event depends on how many players reached 15+ , max 60% chance

			if ( Math.random() < chance )
			{
				if ( sdJunk.council_bombs < 1 )
				sdWeather.SimpleSpawner({

					count: [ 1, 1 ],
					class: sdJunk,
					params: { type: sdJunk.TYPE_COUNCIL_BOMB }

				});
				
				/*let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdJunk.council_bombs < 1 )
				{
					let council_bomb = new sdJunk({ x:0, y:0, type: 4 });

					sdEntity.entities.push( council_bomb );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( council_bomb.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( council_bomb.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !council_bomb.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + council_bomb._hitbox_x1 - 16, 
								y + council_bomb._hitbox_y1 - 16, 
								x + council_bomb._hitbox_x2 + 16, 
								y + council_bomb._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									proper_distnace = false;
									break;
								}
							}
									
							if ( proper_distnace )
							{
								council_bomb.x = x;
								council_bomb.y = y;

								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							council_bomb.remove();
							council_bomb._broken = false;
							break;
						}
					} while( true );

					instances++;
				}*/

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		
		if ( r === sdWeather.EVENT_OVERLORD )
		{
			let instances = 0;
			let instances_tot = 1;

			//let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot )
			{
				let ent = new sdOverlord({ x:0, y:0 });

				sdEntity.entities.push( ent );

				if ( !sdWeather.SetRandomSpawnLocation( ent ) )
				{
					ent.remove();
					ent._broken = false;
					break;
				}

				instances++;
			}
		}
		if ( r === sdWeather.EVENT_ERTHAL_BEACON ) // Spawn an Erthal beacon anywhere on the map outside player views which summons Erthals until destroyed
		{
			let chance = 0;
			let req_char = 0;
			let char = 0;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character !== null )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					char++;
					if ( sdWorld.sockets[ i ].character.build_tool_level >= 5 )
					req_char++;
				}
			}
			chance = ( req_char / char ) * 0.6; // Chance to execute this event depends on how many players reached 5+ , max 60% chance

			if ( Math.random() < chance )
			{
				if ( sdJunk.erthal_beacons < 1 )
				sdWeather.SimpleSpawner({

					count: [ 1, 1 ],
					class: sdJunk,
					params: { type: sdJunk.TYPE_ERTHAL_DISTRESS_BEACON }

				});

				/*let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdJunk.erthal_beacons < 1 )
				{
					let erthal_beacon = new sdJunk({ x:0, y:0, type: 5 });

					sdEntity.entities.push( erthal_beacon );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( erthal_beacon.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( erthal_beacon.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !erthal_beacon.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + erthal_beacon._hitbox_x1 - 16, 
								y + erthal_beacon._hitbox_y1 - 16, 
								x + erthal_beacon._hitbox_x2 + 16, 
								y + erthal_beacon._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									proper_distnace = false;
									break;
								}
							}
									
							if ( proper_distnace )
							{
								erthal_beacon.x = x;
								erthal_beacon.y = y;

								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							erthal_beacon.remove();
							erthal_beacon._broken = false;
							break;
						}
					} while( true );

					instances++;
				}*/

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_VELOX ) // Velox faction spawn. TO DO: Support healing drones
		{
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ]._ai_team === 5 )
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 5 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( percent / sdWorld.GetPlayingPlayersCount() ) ) // Spawn chance depends on RNG, chances increase if more players ( or all ) have at least 5 levels
			{
				let instances = 0;
				let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

				//let left_side = ( Math.random() < 0.5 );
				while ( instances < instances_tot && ais < this._max_ai_count )
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

					sdEntity.entities.push( character_entity );

					{
						if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
						else
						{
							sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_VELOX );
							break;

						}
					}

					instances++;
					ais++;
				}
				sdWeather.SimpleSpawner({
				
					count: [ 1, 2 ],
					class: sdVeloxMiner
				});
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_CRYSTAL_BLOCKS ) // Put crystal shards in a 30 blocks
		{
			for ( let j = 0; j < 30; j++ )
			{
				for ( let tr = 0; tr < 100; tr++ )
				{
					let i = Math.floor( Math.random() * sdEntity.entities.length );
					
					if ( i < sdEntity.entities.length )
					{
						let ent = sdEntity.entities[ i ];
						
						if ( ent.is( sdBlock ) )
						if ( ent._natural )
						{
							ent.Crystalize();
							break;
						}
					}
					else
					{
						break;
					}
				}
			}
		}
		if ( r === sdWeather.EVENT_SD_EXTRACTION ) // Summon 1 Star Defender AI which appears to need to be escorted/rescued, or arrested, depending on RNG.
		{
			let ais = 0;
			let hostile = ( Math.random() < 0.5 );

			let instances = 0;
			let instances_tot = 1;
			
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			if ( sdCharacter.characters[ i ]._ai_team === 0 || sdCharacter.characters[ i ]._ai_team === 6 )
			{
				if ( sdCharacter.characters[ i ].title === 'Star Defender' || sdCharacter.characters[ i ].title === 'Criminal Star Defender' )
				ais++;
			}

			//let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && ais < 4 ) // Only 4 of these task types are available at once
			{
				let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled: hostile ? sdCharacter.AI_MODEL_FALKOK : sdCharacter.AI_MODEL_TEAMMATE });

				sdEntity.entities.push( character_entity );

				{
					//let x,y;
					let tr = 1;
					do
					{
						//if ( left_side )
						//x = sdWorld.world_bounds.x1 + 16 + 16 * instances;
						//else
						//x = sdWorld.world_bounds.x2 - 16 - 16 * instances;

						//y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						//if ( character_entity.CanMoveWithoutOverlap( x, y - 64, 0 ) ) // Make them spawn on surface more often when possible
						//if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() ) ) // Only spawn on ground

						if ( sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							//character_entity.x = x;
							//character_entity.y = y;

							//sdWorld.UpdateHashPosition( ent, false );
							if ( Math.random() < 0.5 ) // Random gun given to Star Defender
							{
								if ( Math.random() < 0.2 )
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
									character_entity._ai_gun_slot = 4;
								}
								else
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
									character_entity._ai_gun_slot = 3;
								}
							}
							else
							{ 
								if ( Math.random() < 0.1 )
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
									character_entity._ai_gun_slot = 2;
								}
								else
								{
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
									character_entity._ai_gun_slot = 2;
								}
							}
							let sd_settings;
							if ( hostile )
							sd_settings = {"hero_name":"Criminal Star Defender","color_bright":"#c0c0c0","color_dark":"#808080","color_bright3":"#c0c0c0","color_dark3":"#808080","color_visor":"#ff0000","color_suit":"#800000","color_suit2":"#800000","color_dark2":"#808080","color_shoes":"#000000","color_skin":"#808000","helmet1":true,"helmet2":false,"voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice6":false};
							else
							sd_settings = {"hero_name":"Star Defender","color_bright":"#c0c0c0","color_dark":"#808080","color_bright3":"#c0c0c0","color_dark3":"#808080","color_visor":"#ff0000","color_suit":"#008000","color_suit2":"#008000","color_dark2":"#808080","color_shoes":"#000000","color_skin":"#808000","helmet1":true,"helmet2":false,"voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice6":false};
							character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( sd_settings );
							character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( sd_settings );
							character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( sd_settings );
							character_entity.title = sd_settings.hero_name;
							character_entity.matter = 185;
							character_entity.matter_max = 185;

							character_entity.hea = 250; // It is a star defender after all
							character_entity.hmax = 250;

							character_entity.armor = 500;
							character_entity.armor_max = 500;
							character_entity._armor_absorb_perc = 0.6; // 60% damage reduction
							character_entity.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor

							//character_entity._damage_mult = 2;	
							character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
										
							character_entity._ai_level = 5;
										
							character_entity._matter_regeneration = 5; // At least some ammo regen
							character_entity._jetpack_allowed = true; // Jetpack
							//character_entity._recoil_mult = 1 - ( 0.0055 * 5 ) ; // Recoil reduction
							character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
							character_entity._ai_team = hostile ? 6 : 0; // AI team 6 is for Hostile Star Defenders, 0 is for normal Star Defenders
							character_entity._allow_despawn = false;
							character_entity._matter_regeneration_multiplier = 4; // Their matter regenerates 4 times faster than normal, unupgraded players
							//character_entity._ai.next_action = 1;
							break;
						}


						tr--;
						if ( tr < 0 )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
					} while( true );
				}

				instances++;
				ais++;
				if ( hostile )
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be arrested ( don't destroy the body )
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'EXTRACT-'+character_entity._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: character_entity,
						//extract_target: 1, // This let's the game know that it needs to draw arrow towards target. Use only when actual entity, and not class ( Like in CC tasks) needs to be LRTP extracted.
						mission: sdTask.MISSION_LRTP_EXTRACTION,
						difficulty: 0.14,
						//lrtp_ents_needed: 1,
						title: 'Arrest Star Defender',
						description: 'It seems that one of criminals is nearby and needs to answer for their crimes. Arrest them and bring them to the mothership, even if it means bringing the dead body!'
					});
				}
				else
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be rescued, although they can be teleported when dead, but not destroyed body.
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'EXTRACT-'+character_entity._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: character_entity,
						//extract_target: 1, // This let's the game know that it needs to draw arrow towards target. Use only when actual entity, and not class ( Like in CC tasks) needs to be LRTP extracted.
						mission: sdTask.MISSION_LRTP_EXTRACTION,
						difficulty: 0.14,
						//lrtp_ents_needed: 1,
						title: 'Rescue Star Defender',
						description: 'It seems that one of our soldiers is nearby and needs help. You should rescue the soldier and extract him to the mothership!'
					});
				}
			}
		}
		if ( r === sdWeather.EVENT_SETR ) // Setr faction spawn. Spawns humanoids and drones.
		{
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ]._ai_team === 7 )
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 5 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( percent / sdWorld.GetPlayingPlayersCount() ) ) // Spawn chance depends on RNG, chances increase if more players ( or all ) have at least 5 levels
			{
				let instances = 0;
				let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

				let left_side = ( Math.random() < 0.5 );


				while ( instances < instances_tot && ais < this._max_ai_count )
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

					sdEntity.entities.push( character_entity );

					{
						if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
						else
						{
							sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_SETR );
							break;
						}
					}

					instances++;
					ais++;
				}

				//let drones = 0;
				//let drones_tot = Math.min( 6 ,Math.ceil( ( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) ) );

				let drones = 0;
				for ( let i = 0; i < sdDrone.drones.length; i++ )
				{
					let drone = sdDrone.drones[ i ];
					if ( drone._ai_team === 7 ) // Setr drone?
					drones++;
				}
				if ( drones < this._max_drone_count ) // Sometimes it can go a little over the cap, can be changed later if needed.
				sdWeather.SimpleSpawner({

					count: [ 3, 6 ],
					class: sdDrone,
					params: { _ai_team: 7, type: sdDrone.DRONE_SETR },
					aerial: true

				});
				
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_SETR_DESTROYER ) // Setr Destroyer, basically alternate "flying mech"
		{
			if ( sdSetrDestroyer.destroyer_counter < this._max_setr_destroyer_count )
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdSetrDestroyer,
				
				aerial: true
				
			});
			
			/*let instances = 0;
			let instances_tot = 1;

			let left_side = ( Math.random() < 0.5 );

			while ( instances < instances_tot && sdSetrDestroyer.destroyer_counter < this._max_setr_destroyer_count )
			{

				let destroyer_entity = new sdSetrDestroyer({ x:0, y:0 });

				sdEntity.entities.push( destroyer_entity );

				{
					let x,y;
					if ( !sdWeather.SetRandomSpawnLocation( destroyer_entity ) )
					{
						destroyer_entity.remove();
						destroyer_entity._broken = false;
						break;
					}
				}

				instances++;
			}*/
		}
		if ( r === sdWeather.EVENT_CRYSTALS_MATTER ) // Task which tells players to deliver "X" amount of max matter worth of crystals.
		{
			let player_count = sdWorld.GetPlayingPlayersCount();
			for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Create the tasks
			{
				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'EXTRACT-'+this._net_id, 
					executer: sdWorld.sockets[ i ].character,
					//target: 'sdCrystal',
					lrtp_class_proprty_value_array: [ 'sdCrystal' ],
					mission: sdTask.MISSION_LRTP_EXTRACTION,
					difficulty: 0.2,
					//lrtp_ents_needed: 10240 + ( 2560 * player_count ), // 12300 matter requirement for 1 player, although progress counts for all players I think
					lrtp_matter_capacity_needed: 5120 + ( 1280 * player_count ), // 6300 matter requirement for 1 player, although progress counts for all players I think
					title: 'Teleport crystals',
					time_left: 30 * 60 * 15,
					for_all_players: true, // This task lets everyone contribute towards it's completion
					//extra: -99, // This lets the game know to take max matter as progress instead of crystal count.
					description: 'We need you to teleport a large amount of crystals. This is to help us keep the Mothership supplied with matter so our matter reserves do not deplete. With other Star Defenders on this planet, it should not be too hard.',
					//type: 1 // Task remains active even if player disconnects, so it doesn't exist after the event expires
				});
			}
		}
		if ( r === sdWeather.EVENT_DIRTY_AIR )
		{
			if ( this.air === 1 ) // Without this check event can roll multiple times while task doesn't display / refresh correct time left.
			{
				this.air = 0;
				this._no_air_duration = 30 * 60 * 5;
			}
		}
		if ( r === sdWeather.EVENT_AMPHIDS )
		{
			sdWeather.SimpleSpawner({
				
				count: [ 2, Math.floor( Math.random() * 5 ) ],
				class: sdAmphid,
				
				group_radius: 160
				
			});
			/*let instances = Math.floor( 2 + Math.random() * 5 );
			while ( instances > 0 )
			{

				let amphid = new sdAmphid({ x:0, y:0 });

				sdEntity.entities.push( amphid );

				{
					var ax,ay;
					let x,y,i;
					let tr = 1000;
					do
					{
						if ( ax )
						{
							x = ax + Math.random() * 320 - 160;
							y = ay + Math.random() * 320 - 160;
						}
						else
						{
							x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );
						}
						
						if ( this.TraceDamagePossibleHere( x, y, 20 ) )
						if ( !amphid.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
						if ( ax || sdWorld.CheckWallExistsBox( 
							x + amphid._hitbox_x1 - 16, 
							y + amphid._hitbox_y1 - 16, 
							x + amphid._hitbox_x2 + 16, 
							y + amphid._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;
							
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
								
								if ( di < 500 )
								{
									proper_distnace = false;
									break;
								}
							}
							
							if ( proper_distnace )
							{
								amphid.x = x;
								amphid.y = y;
								ax = x;
								ay = y;
								
								break;
							}
						}

						tr--;
						if ( tr < 0 )
						{
							amphid.remove();
							amphid._broken = false;
							break;
						}
					} while( true );
				}

				instances--;
			}*/
		}
		if ( r === sdWeather.EVENT_BITERS )
		{
			if ( sdBiter.biters_counter < 35 || sdWorld.server_config.aggressive_hibernation )
			sdWeather.SimpleSpawner({
				
				count: [ 1, Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) ],
				class: sdBiter,
				
				aerial: true
				
			});
			
			/*for ( let t = Math.ceil( Math.random() * 2 * sdWorld.GetPlayingPlayersCount() ) + 1; t > 0; t-- )
			if ( sdBiter.biters_counter < 35 )
			{
				let biter = new sdBiter({ 
					x:sdWorld.world_bounds.x1 + 32 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 64 ), 
					y:sdWorld.world_bounds.y1 + 32
				});
				//asp.sy += 10;
				sdEntity.entities.push( biter );

				if ( !biter.CanMoveWithoutOverlap( biter.x, biter.y, 0 ) )
				{
					biter.remove();
					biter._broken = false;
				}
				else
				sdWorld.UpdateHashPosition( biter, false ); // Prevent inersection with other ones
			}*/
		}
		if ( r === sdWeather.EVENT_LAND_SCAN ) // Task which tells players to use a land scanner entity to scan the planet for data.
		{
			//let player_count = sdWorld.GetPlayingPlayersCount();
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Create the tasks
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'LAND_SCAN-'+this._net_id, 
						executer: sdWorld.sockets[ i ].character,
						lrtp_class_proprty_value_array: [ 'sdLandScanner', 'scanned_ents', 350 ],
						mission: sdTask.MISSION_LRTP_EXTRACTION,
						difficulty: 0.14,
						lrtp_matter_capacity_needed: 1,
						title: 'Planet scan',
						time_left: 30 * 60 * 15,
						description: 'We need you to claim a land scanner from a long range teleporter, then scan planet environment until data is at max capacity, then send the land scanner back to us using the long range teleporter so we can analyze the planet data.'
					});
				}
		}
		if ( r === sdWeather.EVENT_FLESH_DIRT ) // Ground fleshify start from random block
		{
			for ( let tr = 0; tr < 100; tr++ )
			{
				let i = Math.floor( Math.random() * sdEntity.entities.length );
				
				if ( i < sdEntity.entities.length )
				{
					let ent = sdEntity.entities[ i ];
					
					if ( ent.is( sdBlock ) )
					if ( ent._natural )
					{
						ent.Fleshify();
						break;
					}
				}
				else
				{
					break;
				}
			}
		}
		if ( r === sdWeather.EVENT_COUNCIL_PORTAL ) // Spawn a Council portal machine anywhere on the map outside player views which summons a portal in 15 minutes or more, depending on player count.
		{
			let chance = 0;
			let req_char = 0;
			let char = 0;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character !== null )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					char++;
					if ( sdWorld.sockets[ i ].character.build_tool_level >= 15 )
					req_char++;
				}
			}
			chance = ( req_char / char ); // 100% chance to roll if all players are level 15 or above
			
			if ( Math.random() < chance )
			{
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdCouncilMachine.ents < 1 )
				{
					let council_mach = new sdCouncilMachine({ x:0, y:0});

					sdEntity.entities.push( council_mach );
					
					if ( sdWeather.SetRandomSpawnLocation( council_mach ) )
					{
						sdCouncilMachine.ents_left = Math.min( 6, Math.max( 2, sdWorld.GetPlayingPlayersCount() ) ); // 2+1 = 3 machines on single player
					}
					else
					{
						council_mach.remove();
						council_mach._broken = false;
					}

					/*let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( council_mach.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( council_mach.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !council_mach.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + council_mach._hitbox_x1 - 16, 
								y + council_mach._hitbox_y1 - 16, 
								x + council_mach._hitbox_x2 + 16, 
								y + council_mach._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									proper_distnace = false;
									break;
								}
							}
									
							if ( proper_distnace )
							{
								council_mach.x = x;
								council_mach.y = y;
								sdCouncilMachine.ents_left = Math.min( 6, Math.max( 2, sdWorld.GetPlayingPlayersCount() ) ); // 2+1 = 3 machines on single player
								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							council_mach.remove();
							council_mach._broken = false;
							break;
						}
					} while( true );*/

					instances++;
				}

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_SWORD_BOT ) // Falkonian sword bot, only one on map at the time
		{
			let ais = 0;

			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			if ( sdCharacter.characters[ i ].hea > 0 )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			if ( sdCharacter.characters[ i ]._ai_team === 1 ) // Otherwise it will prevent potentially spawning other factions, like Setr, Velox and Erthal
			if ( sdCharacter.characters[ i ].title === 'Falkonian Sword Bot' ) //Make sure it's the sword bot
			{
				ais++;
			}

			let instances = 0;
			let instances_tot = 5;


			while ( instances < instances_tot && ais < 1 ) // Capped to 1 on map, but will try to spawn it multiple times if it fails
			{

				let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE, s:250 });

				sdEntity.entities.push( character_entity );

				{
					if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
					{
						character_entity.remove();
						character_entity._broken = false;
						break;
					}
					else
					{
						{

							//sdWorld.UpdateHashPosition( ent, false );
							let falkok_settings;
							falkok_settings = {"hero_name":"Falkonian Sword Bot","color_bright":"#404040","color_dark":"#303030","color_bright3":"#202020","color_dark3":"#101010","color_visor":"#FF0000","color_suit":"#404040","color_suit2":"#303030","color_dark2":"#202020","color_shoes":"#101010","color_skin":"#101010","color_extra1":"#FF0000","helmet1":false,"helmet40":true,"body1":false,"legs1":false,"body25":true,"legs25":true,"voice1":false,"voice2":false,"voice10":true};

								character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( falkok_settings );
								character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( falkok_settings );
								character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( falkok_settings );
								character_entity.title = falkok_settings.hero_name;
								character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( falkok_settings );
								character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( falkok_settings );
							{
								character_entity.matter = 800;
								character_entity.matter_max = 800;

								character_entity.hea = 8500; // 105 so railgun requires at least headshot to kill and body shot won't cause bleeding
								character_entity.hmax = 8500;

								//character_entity._damage_mult = 1 / 2.5; // 1 / 4 was too weak
							}

							character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
										
							character_entity._ai_level = 4;
							character_entity._ai_gun_slot = -1;
										
							character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
							character_entity._jetpack_allowed = true; // Jetpack
							//character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ) ; // Small recoil reduction based on AI level
							character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
							character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
							character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
							character_entity.s = 250;
							character_entity._jetpack_power = 4;

							break;
						}
					}
				}

				instances++;
				ais++;
			}
		}
		if ( r === sdWeather.EVENT_TZYRG ) // Tzyrg faction spawn. Spawns humanoids and drones.
		{
			let ais = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ]._ai_team === 8 )
				{
					ais++;
				}

			}

			{
				let instances = 0;
				let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

				//let left_side = ( Math.random() < 0.5 );


				while ( instances < instances_tot && ais < this._max_ai_count )
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

					sdEntity.entities.push( character_entity );

					{
						if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
						else
						{
							sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_TZYRG );
							break;
						}
					}

					instances++;
					ais++;
				}
				
				let drones = 0;
				for ( let i = 0; i < sdDrone.drones.length; i++ )
				{
					let drone = sdDrone.drones[ i ];
					if ( drone._ai_team === 7 ) // Setr drone?
					drones++;
				}
				if ( drones < this._max_drone_count ) // Sometimes it can go a little over the cap, can be changed later if needed.
				{
					sdWeather.SimpleSpawner({

						count: [ 3, 5 ],
						class: sdDrone,
						params: { _ai_team: 8, type: sdDrone.DRONE_TZYRG },
						aerial: true

					});
				
					if ( Math.random() < 0.25 )
					sdWeather.SimpleSpawner({

						count: [ 1, 2 ],
						class: sdDrone,
						params: { _ai_team: 8, type: sdDrone.DRONE_TZYRG_WATCHER },
						aerial: true

					});
				}
			}
		}
		if ( r === sdWeather.EVENT_FALKOK_OUTPOST ) // Falkok base / outpost spawn. Looks for fitting location to generate an outpost. Very primitive at the moment. 10x10 base size.
		{
			// TODO: These will be reworked with presets at some point. Also spawn is inefficient in terms of how many sdDeepSleep it would awake
			
			if ( Math.random() < 0.2 ) // Don't want these to flood maps since they're very basic
			{
				if ( sdWorld.server_config.aggressive_hibernation )
				{
					trace( 'Falkok outpost spawn has been prevented due to aggressive_hibernation being enabled - should be redone with preset spawns and use simpler location test (for example try to spawn over random sdBlock entity - as long as it does not wake up thousands of sdDeepSleep cells across whole map it would be fine)' );
				}
				else
				{
					let x,y,i,j;
					let located_spawn = true;
					let tr = 1000;
					// Check if there's 10x10 worth of 32x32 block free space.
					if ( sdFactionSpawner.falkok_spawners === 0 ) // Capped to 1 for now.
					do
					{
						located_spawn = true;
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						x = 16 * Math.floor( x / 16 ); // Round up the values
						y = 16 * Math.floor( y / 16 );
						x -= 32;
						y -= 32;
						let init_x = x;
						let init_y = y;
						for ( j = 0; j < 10; j++ )
						{
							y += 32;
							x = init_x;
							for ( i = 0; i < 10; i++ )
							{
								x += 32;
								if ( !sdWorld.CheckWallExistsBox( 
										x - 32, 
										y - 32, 
										x + 32, 
										y + 32, null, null, null, null ) ) // Make sure nothing "blocks" ( pun intended ) outpost spawns
								{
									let proper_distnace = true;

									for ( let k = 0; k < sdWorld.sockets.length; k++ )
									if ( sdWorld.sockets[ k ].character )
									{
										let di = sdWorld.Dist2D( sdWorld.sockets[ k ].character.x, sdWorld.sockets[ k ].character.y, x, y );

										if ( di < 500 )
										{
											proper_distnace = false; // Too close to players
											//break;
										}
									}

									if ( proper_distnace === false ) // Look for new location
									{
										i = 10;
										j = 10;
										located_spawn = false;
									}
								}
								else // Look for new location if something blocks outpost generation
								{
									i = 10;
									j = 10;
									located_spawn = false;
								}
							}
						}		
						tr--;
						//if ( tr === 0 && !located_spawn )
						//console.log( 'No fitting location for a base.' );
						if ( located_spawn ) // Fitting base location
						{
							x = init_x;
							y = init_y;
							this.GenerateOutpost( x, y, 0, Math.round( Math.random() ), 1 ); // Generate an outpost. Could be randomized preset in future.
							//console.log( 'Located base location!' );
							tr = 0;
						}
					} while ( tr > 0 );
				}
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_GUANAKO )
		{
			// TODO: Spawn their houses instead, later houses will spawn new guanakos
			sdWeather.SimpleSpawner({
				
				count: [ 1, 2 ],
				class: sdGuanako
				
			});
		}
		if ( r === sdWeather.EVENT_TZYRG_DEVICE ) // Spawn a Tzyrg device. When players find it they should destroy it ( Since they do stop earthquakes when they exist on the map )
		{
			{
				sdWeather.SimpleSpawner({

					count: [ 1, 1 ],
					class: sdTzyrgAbsorber

				});

				/*let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdTzyrgAbsorber.absorbers.length < 1 )
				{
					let ent = new sdTzyrgAbsorber({ x:0, y:0});

					sdEntity.entities.push( ent );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( ent.CanMoveWithoutOverlap( x, y - 64, 0 ) )
						if ( ent.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !ent.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + ent._hitbox_x1 - 16, 
								y + ent._hitbox_y1 - 16, 
								x + ent._hitbox_x2 + 16, 
								y + ent._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let proper_distnace = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									proper_distnace = false;
									break;
								}
							}
									
							if ( proper_distnace )
							{
								ent.x = x;
								ent.y = y;
								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							ent.remove();
							ent._broken = false;
							break;
						}
					} while( true );

					instances++;
				}
				*/
			}
			//else
			//this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_SHURG ) // Shurg faction spawn. Spawns humanoids.
		{
			let ais = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ]._ai_team === 9 )
				{
					ais++;
				}

			}

			{
				let instances = 0;
				let instances_tot = 3 + ( ~~( Math.random() * 3 ) );

				//let left_side = ( Math.random() < 0.5 );


				while ( instances < instances_tot && ais < this._max_ai_count )
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

					sdEntity.entities.push( character_entity );

					{
						if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
						else
						{
							sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_SHURG );
							break;
						}
					}

					instances++;
					ais++;
				}

				sdWeather.SimpleSpawner({
				
					count: [ 1, 3 ],
					class: sdShurgExcavator
				});

			}
		}
		if ( r === sdWeather.EVENT_SHURG_CONVERTER ) // Spawn a Shurg oxygen-to-matter converter anywhere on the map outside player views.
		{
			{
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdShurgConverter.converters.length < 1 )
				{
					let converter = new sdShurgConverter({ x:0, y:0});

					sdEntity.entities.push( converter );
					
					if ( sdWeather.SetRandomSpawnLocation( converter ) )
					{
						sdShurgConverter.ents_left = 2; // 3 converters to destroy

						sdWeather.SimpleSpawner({
				
						count: [ 2, 2 ],
						class: sdShurgTurret,
				
						group_radius: 800,
						near_entity: converter
			
						});
						sdWeather.SimpleSpawner({

						count: [ 3, 3 ],
						class: sdShurgTurret,
						params: { type: sdShurgTurret.TURRET_FLYING }, // 2 flying turrets
						group_radius: 400,
						near_entity: converter,
						aerial: true
			
						});
					}
					else
					{
						converter.remove();
						converter._broken = false;
					}

					instances++;
				}

			}
			//else
			//this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_TIME_SHIFTER ) // Spawn a time shifter, very rarely though
		{
			let ais = 0;
			let percent = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			{
				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ]._ai_team === 10 )
				{
					ais++;
				}

				if ( sdCharacter.characters[ i ].hea > 0 )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				//if ( !sdCharacter.characters[ i ]._ai )
				if ( sdCharacter.characters[ i ].build_tool_level > 20 )
				{
					percent++;
				}
			}
			if ( Math.random() < ( 0.45 * ( percent / sdWorld.GetPlayingPlayersCount() ) ) ) // Spawn chance depends on RNG, chances increase if more players have at least 20 levels
			{
				let instances = 0;
				let instances_tot = 5;

				while ( instances < instances_tot && ais < 1 ) // Capped to 1 on map, but will try to spawn it multiple times if it fails
				{

					let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

					sdEntity.entities.push( character_entity );

					{
						if ( !sdWeather.SetRandomSpawnLocation( character_entity ) )
						{
							character_entity.remove();
							character_entity._broken = false;
							break;
						}
						else
						{
							let character_settings;
							{
								{ 
									sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TELEPORT_SWORD }) );
									character_entity._ai_gun_slot = 0;
								}

								if ( character_entity._ai_gun_slot === 0 )
								character_settings = {	"hero_name":"Time Shifter", // Name
								"color_bright":"#202020", // Helmet bright color
								"color_dark":"#000000", // Helmet dark color
								"color_visor":"#FFFFFF", // Visor color
								"color_bright3":"#202020", // Jetpack (bright shade) color
								"color_dark3":"#202020", // Jetpack and armor plates (dark shade) color
								"color_suit":"#000000", // Upper suit color
								"color_suit2":"#000000", // Lower suit color
								"color_dark2":"#000000", // Lower suit plates color
								"color_shoes":"#202020", // Shoes color
								"color_skin":"#202020", // Gloves and neck color
								"color_extra1":"#202020", // Extra 1 color
								"helmet36":true,
								"body1":true,
								"legs3":true,
								"voice1":true };

								if ( character_entity._ai_gun_slot === 0 )
								{
									character_entity.matter = 1000;
									character_entity.matter_max = 1000;

									character_entity.hea = 3000;
									character_entity.hmax = 3000;
								}

								character_entity._ai = { direction: ( Math.random() < 0.5 ) ? -1 : 1 };
								character_entity._ai_level =  4; // AI Level

								character_entity._matter_regeneration = 50; // At least some ammo regen
								character_entity._jetpack_allowed = false; // No jetpack, he can fly with his blade if he needs it after all
								character_entity._ai_team = 10; // AI team 10 is for the time shifter
								character_entity._matter_regeneration_multiplier = 50; // Their matter regenerates 50 times faster than normal, unupgraded players	

								character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( character_settings );
								character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( character_settings );
								character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( character_settings );
								character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( character_settings );
								character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( character_settings );
								character_entity.title = character_settings.hero_name;	

								character_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TIME_SHIFTER_PROPERTIES, charges_left: 3 }); // Give him the Time Shifter properties / status effect

								// This is a bossfight.
								break;
							}
						}
					}

					instances++;
					ais++;
				}
			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_ZEKTARON_DREADNOUGHT ) // Zektaron Dreadnought, main boss of the Zektarons
		{
			let possible_spawn = false;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.build_tool_level >= 25 ) // If atleast one player is level 25 or above
				possible_spawn = true;
			}
			if ( sdZektaronDreadnought.dreadnought_counter < this._max_zektaron_dreadnought_count && possible_spawn )
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdZektaronDreadnought,
				
				aerial: true
				
			});
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_KIVORTEC_WEAPONS_POD ) // KIVORTEC Weapons Pod. Has to be hacked before being opened and giving Star Defenders random KVT weaponry.
		{
			if ( sdDropPod.pod_counter < ( this._max_pod_count + sdWorld.GetPlayingPlayersCount() ) ) // +1 for every player online.
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdDropPod,
				
				aerial: true
				
			});
		}
		if ( r === sdWeather.EVENT_BEAM_PROJECTOR ) // Dark matter beam projector spawns and players need to activate and defend it
		{
			let possible_spawn = false;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.build_tool_level >= 15 ) // If atleast one player is level 15 or above
				possible_spawn = true;
			}
			if ( sdBeamProjector.projector_counter < 1 && possible_spawn )
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdBeamProjector,
				aerial: false
				
			});
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_COUNCIL_INCINERATOR ) // Council's Incinerator, mini boss from Council faction
		{
			let possible_spawn = false;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.build_tool_level >= 15 ) // If atleast one player is level 15 or above
				possible_spawn = true;
			}
			if ( sdCouncilIncinerator.incinerator_counter < this._max_council_incinerator_count && possible_spawn )
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdCouncilIncinerator,
				aerial: true
				
			});
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_STEALER ) // Spawn a Stealer which steals unattended crystals.
		{
			// No need for a cap, they disappear on their own when they can't find any unattended crystals
			sdWeather.SimpleSpawner({
				
				count: [ 2, 3 ],
				class: sdStealer,
				aerial: true
				
			});
		}
		if ( r === sdWeather.EVENT_LONG_RANGE_ANTENNA ) // Long range frequency antenna is placed by SD's and needs to be calibrated
		{
			if ( sdLongRangeAntenna.antennas.length < 8 )
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdLongRangeAntenna,
				aerial: false
				
			});
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_PROTECT_SDBG_DRONE ) // Mothership is trying to see if old drone stockpile is effective on planet ( players need to protect the drone for 5 minutes )
		{
			let instances = 0;
			let instances_tot = 1;
			while ( instances < instances_tot ) // Only 1 should spawn
			{
				let ent = new sdDrone({ x:0, y:0, type: 17, _ai_team: 0 });

				sdEntity.entities.push( ent );

				{
					//let x,y;
					let tr = 2;
					do
					{
						if ( sdWeather.SetRandomSpawnLocation( ent ) )
						{
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

				instances++;
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be protected
				if ( sdWorld.sockets[ i ].character )
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'PROTECT-'+ent._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: ent,
						mission: sdTask.MISSION_PROTECT_ENTITY,
						protect_type: 1, // 0 = wait until objective is completed, 1 = entity must survive for the time given on Task
						time_left: 30 * 60 * 5, // 5 minutes
						difficulty: 0.075,
						title: 'Protect a drone',
						description: 'We found an old drone stockpile and would like to see if these drones are efficient enough on this planet to complement your and other Star Defenders objective. We deployed it near you, all you have to do is make sure it does not get destroyed too quickly.'
					});
				}
			}
		}
		if ( r === sdWeather.EVENT_VELOX_FORTIFIER ) // Spawn a Velox device which shields velox units until it is destroyed
		{
			let chance = 0;
			let req_char = 0;
			let char = 0;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character !== null )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					char++;
					if ( sdWorld.sockets[ i ].character.build_tool_level >= 5 )
					req_char++;
				}
			}
			chance = ( req_char / char ) * 0.6; // Chance to execute this event depends on how many players reached 5+ , max 60% chance

			if ( Math.random() < chance )
			{
				if ( sdVeloxFortifier.ents < 1 )
				sdWeather.SimpleSpawner({

					count: [ 1, 1 ],
					class: sdVeloxFortifier 

				});

			}
			else
			this._time_until_event = Math.random() * 30 * 60 * 0; // Quickly switch to another event
		}
		if ( r === sdWeather.EVENT_SOLAR_DISTRIBUTOR ) // Solar matter distributor is placed by SD's and needs to be activated
		{
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdSolarMatterDistributor,
				aerial: false
				
			});
		}
		if ( r === sdWeather.EVENT_SD_EXCAVATION ) // Excavator is placed by SD's and needs to be activated
		{
			sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdExcavator,
				aerial: false
				
			});
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			this.x1 = sdWorld.world_bounds.x1;
			this.y1 = sdWorld.world_bounds.y1;
			this.x2 = sdWorld.world_bounds.x2;
			this.y2 = sdWorld.world_bounds.y2;
			
			//return; // Hack

			this.day_time += GSPEED;
			this._event_rotation_time += GSPEED;
			this._weather_rotation_time += GSPEED;
			this._sd_task_rotation_time += GSPEED;
			//if ( this.day_time > 30 * 60 * 24 ) // While in sandbox mode and not that many events - might seem too boring. Also It does not change when nobody is online which can effectively make it rotate on weekly basis
			if ( this.day_time > 30 * 60 * 24 ) // This is the day time cycle, 24 minutes
			{
				this.day_time = 0;
			}
			if ( this._event_rotation_time > 30 * 60 * 15 ) // Event rotation cycle
			{
				this._event_rotation_time = 0;

				this.GetDailyEvents();
			}
			if ( this._weather_rotation_time > 30 * 60 * 20 ) // Weather rotation cycle
			{
				this._weather_rotation_time = 0;

				this.GetDailyWeatherEvents();
			}
			if ( this._sd_task_rotation_time > 30 * 60 * 30 ) // SD task event rotation cycle
			{
				this._sd_task_rotation_time = 0;

				this.GetDailySDEvents();
			}
			
			if ( sdTask.completed_tasks_count >= 4 ) // every 4 completed tasks on the map, drop an SD pod
			{
				sdTask.completed_tasks_count = 0; // Reset counter
				sdWeather.SimpleSpawner({
				
				count: [ 1, 1 ],
				class: sdDropPod,
				params: { type: sdDropPod.TYPE_SD },
				aerial: true
				});
				
			}
			
			if ( this._invasion ) // Invasion event. Selects one of possible invasion events randomly.
			{
				this._invasion_timer -= GSPEED;
				this._invasion_spawn_timer -= GSPEED;
				if ( this._invasion_timer <= 0 && this._invasion_spawns_con <= 0 )
				{
					this._invasion = false;
					//console.log('Invasion clearing up!');
				}
				if ( this._invasion_spawn_timer <= 0 )
				{
					this._invasion_spawn_timer = 30 * ( 5 + ( Math.random() * 5 ) ) ; // Every 5+ to 10 seconds it will summon an event
					this._invasion_spawns_con -= 1;
					
					this.ExecuteEvent( this._invasion_event );
					
				}
			}
			this._asteroid_timer += GSPEED;
			if ( this._asteroid_timer > 60 * 30 / ( ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 800 ) )
			{
				let xx = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
				
				let proper_distnace = false;

				for ( let i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				{
					if ( Math.abs( sdWorld.sockets[ i ].character.x - xx ) < sdWeather.min_distance_from_online_players_for_entity_events )
					{
						proper_distnace = true;
						break;
					}
				}
				
				if ( proper_distnace )
				{
					let ent = new sdAsteroid({ 
						x:xx, 
						y:sdWorld.world_bounds.y1 + 1
					});
					sdEntity.entities.push( ent );
				}

				this._asteroid_timer = 0;
				this._asteroid_timer_scale_next = Math.random();
			}
			
			if ( this._asteroid_spam_amount > 0 )
			{
				this._asteroid_spam_amount -= GSPEED * 1;
				this._asteroid_timer += GSPEED * 40;
			}
			
			if ( this._rain_amount > 0 )
			{
				this.raining_intensity = Math.min( 100, this.raining_intensity + GSPEED * 0.1 );
				
				this._rain_amount -= this.raining_intensity / 100;
			}
			else
			{
				this.raining_intensity = Math.max( 0, this.raining_intensity - GSPEED * 0.1 );
			}
			
			if ( this.raining_intensity > 50 || sdWeather.debug_rain )
			//if ( sdWorld.is_server ) Done before
			{
				sdWorld.last_hit_entity = null;
				
				//for ( var i = 0; i < 40; i++ )
				//if ( Math.random() < 100 / ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) )
				if ( !this.matter_rain || sdWeather.debug_rain )
				if ( sdWorld.time > this._next_grass_seed || sdWeather.debug_rain )
				{
					this._next_grass_seed = sdWorld.time + 100;
					
					
					for ( let i = sdWeather.debug_rain ? 1 : ( sdBlock.natural_blocks_total / 1000 * 1.5 ); i > 0; i-- )
					{
						let e = sdEntity.GetRandomEntity();
						
						if ( sdWeather.debug_rain )
						if ( sdWorld.sockets[ 0 ] )
						if ( sdWorld.sockets[ 0 ].character )
						if ( sdWorld.sockets[ 0 ].character._stands_on )
						{
							e = sdWorld.sockets[ 0 ].character._stands_on;
							this.snow = 1;
						}

						if ( e.is( sdBlock ) )
						if ( !e._is_being_removed )
						if ( e.y >= sdWorld.world_bounds.y1 + 16 ) // Do not spawn on top of the world
						{
							let xx = Math.floor( ( e.x + Math.random() * e.width ) / 16 ) * 16;
							//if ( this.TraceDamagePossibleHere( e.x - 8, e.y + e.width / 2, Infinity, false, true ) )
							if ( this.TraceDamagePossibleHere( xx + 8, e.y - 8, Infinity, false, true ) )
							{
								if ( e.DoesRegenerate() )
								{
									if ( e._plants === null )
									{
										let tree_variation = sdGrass.VARIATION_LOW_GRASS; // Initial grass
										let x_off = 0; // X and Y offsets for proper aligment of bushes/trees
										let y_off = 0; //
										if ( Math.random() < 0.4 ) // 40% chance for it to check if a tree or bush spawn is possible
										{
											let proper_distance = true;

											for ( i = 0; i < sdWorld.sockets.length; i++ )
											if ( sdWorld.sockets[ i ].character )
											{
												if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, e.x, e.y, sdWeather.min_distance_from_online_players_for_entity_events ) ) // If players are too close, don't spawn a tree so they don't see it pop in
												{
													proper_distance = false;
													break;
												}
											}
											if ( proper_distance ) // Can spawn a tree?
											{
												let chance = Math.random();
												if ( chance < 0.175 ) // 35% of trees have a chance to be large, just like in fresh world generation
												tree_variation = sdGrass.VARIATION_TREE_LARGE;
												else
												if ( chance < 0.5 )
												tree_variation = sdGrass.VARIATION_TREE;
												else
												tree_variation = sdGrass.VARIATION_BUSH;

												x_off = 8;
												y_off = 16;
												// Without these offsets trees and bushes will spawn in air and on the left of the dirt blocks.
											}
										}
										let grass = new sdGrass({ x:e.x + x_off, y:e.y + y_off - 16, hue:e.hue, br:e.br, filter: e.filter, block:e, variation:tree_variation });

										//let grass = new sdGrass({ x:e.x, y:e.y - 16, hue:e.hue, br:e.br, filter: e.filter, block:e });
										sdEntity.entities.push( grass );

										//grass.snowed = this.snow;
										grass.SetSnowed( this.snow );

										e._plants = [ grass._net_id ];
									}
									else
									{
										for ( let i = 0; i < e._plants.length; i++ )
										{
											//let ent = sdEntity.entities_by_net_id_cache[ e._plants[ i ] ];
											let ent = sdEntity.entities_by_net_id_cache_map.get( e._plants[ i ] );

											if ( ent )
											{
												if ( ent.is( sdGrass ) )
												{
													// Old version problem fix:
													if ( ent._block !== e )
													ent._block = e;

													ent.SetSnowed( this.snow );
													//ent.snowed = this.snow;

													if ( ent.variation < sdWorld.GetFinalGrassHeight( ent.x ) )
													{
														ent.Grow();
														break; // Skip rest plants on this block
													}
												}
											}
											else
											{
												// Old version problem fix:
												e._plants.splice( i, 1 );
												i--;
												continue;
											}
										}
									}
								}

								if ( this.snow )
								{
									// Try to find higher block since they are too tiny sky tracer might skip them
									
									let arr = [ 'sdBlock' ];
									
									let tr = 0;
									while ( true )
									{
										if ( tr++ > 100 )
										throw new Error( 'Unable to find highest snow block' ); // Replace with break; if it happens
									
										if ( sdWorld.CheckSolidDeepSleepExistsAtBox( xx+1, e.y-3, xx+15, e.y-1 ) ) // Not tested but it makes sense
										{
											e = null;
											break;
										}
										
										if ( sdWorld.CheckWallExistsBox( xx+1, e.y-3, xx+15, e.y-1, null, null, arr ) )
										{
											if ( sdWorld.last_hit_entity )
											e = sdWorld.last_hit_entity;
											else
											break;
										}
										else
										break;
									}
									
									if ( e )
									{
										if ( e.material === sdBlock.MATERIAL_SNOW && e.height < 16 )
										{
											// Add snow amount
											e.y -= 4;
											e.height += 4;
											e._hea += 10;
											e._hmax += 10;
											e._update_version++;
											sdWorld.UpdateHashPosition( e, false );
										}
										else
										{
											// Spawn snow?
											let snow_block = new sdBlock({ x:xx, y:e.y - 4, width: 16, height: 4, material: sdBlock.MATERIAL_SNOW, filter:'saturate(0.1)', br:400, hue:180 });
											snow_block._hea = snow_block._hmax = 10;

											sdEntity.entities.push( snow_block );
											sdWorld.UpdateHashPosition( snow_block, false );
										}
									}
								}
								else
								if ( Math.random() < 0.01 )
								{
									if ( !this.matter_rain )
									{
										let water = new sdWater({ x:xx, y:Math.floor(e.y/16)*16 - 16, type: this.acid_rain ? sdWater.TYPE_ACID : sdWater.TYPE_WATER });
										sdEntity.entities.push( water );
										sdWorld.UpdateHashPosition( water, false ); // Without this, new water objects will only discover each other after one first think event (and by that time multiple water objects will overlap each other). This could be called at sdEntity super constructor but some entities don't know their bounds by that time
									}
								}
							}
						}
					}
				}

				if ( this.matter_rain || this.acid_rain )
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					//if ( sdWorld.sockets[ i ].character.driver_of === null )
					if ( sdWorld.sockets[ i ].character.IsTargetable() )
					if ( this.TraceDamagePossibleHere( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y ) )
					{
						if ( this.acid_rain )
						{
							if ( sdWorld.sockets[ i ].character.pain_anim <= 0 && sdWorld.sockets[ i ].character.hea > 0 )
							sdWorld.sockets[ i ].character.PlayDamageEffect( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character._hitbox_y1 );

							sdWorld.sockets[ i ].character.DamageWithEffect( GSPEED * this.raining_intensity / 240 );
						}
						
						if ( this.matter_rain )
						{
							if ( this.matter_rain === 1 )
							sdWorld.sockets[ i ].character.matter = Math.min( sdWorld.sockets[ i ].character.matter + ( GSPEED * this.raining_intensity / 120 ), sdWorld.sockets[ i ].character.matter_max );
							if ( this.matter_rain === 2 )
							sdWorld.sockets[ i ].character.matter = Math.max( sdWorld.sockets[ i ].character.matter - ( GSPEED * this.raining_intensity / 60 ), 0 );
						}
					}
				}
				/*
				if ( this.acid_rain )
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				{
					if ( sdWorld.sockets[ i ].character.driver_of === null )
					if ( this.TraceDamagePossibleHere( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y ) )
					{
						if ( sdWorld.sockets[ i ].character.pain_anim <= 0 && sdWorld.sockets[ i ].character.hea > 0 )
						{
							sdWorld.sockets[ i ].character.PlayDamageEffect( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character._hitbox_y1 );
							//sdWorld.SendEffect({ x:sdWorld.sockets[ i ].character.x, y:sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character._hitbox_y1, type:sdWorld.sockets[ i ].character.GetBleedEffect(), filter:sdWorld.sockets[ i ].character.GetBleedEffectFilter() });
						}

						sdWorld.sockets[ i ].character.DamageWithEffect( GSPEED * this.raining_intensity / 240 );
					}
				}*/
			}
			
			let quake_logic_percentage_done = 1; // Gets lower if earthquake can't perform enough of planned iterations (usually due to performance risks)
			
			//if ( this.quake_intensity >= 100 )
			if ( this.quake_intensity >= 60 )
			//for ( let i = 0; i < 100; i++ ) // Hack
			{
				let ent = new sdBlock({ x:0, y:0, width:16, height:16 });
				
				//sdEntity.entities.push( ent );
				
				{
					let x,y;
					
					//let tr = 1000;
					
					let world_area_under_ground = ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 16 * ( sdWorld.world_bounds.y2 - Math.max( sdWorld.world_bounds.y1, 0 ) ) / 16;
					
					//let tr = sdWorld.server_config.aggressive_hibernation ? 25 : 35;
					//let tr = 35;
					let tr = Math.ceil( world_area_under_ground * 0.0001 );
					let tr0 = tr;
					
					let t = Date.now();
					
					do
					{
						let t2 = Date.now();
						
						if ( t2 > t + 3 )
						{
							if ( tr0 > 0 )
							{
								quake_logic_percentage_done = ( tr0 - tr ) / tr0;
							}
							
							break;
						}
						
						let should_skip = false;
						
						//if ( sdWorld.server_config.aggressive_hibernation )
						if ( tr > 0 )
						{
							let place_near = sdEntity.GetRandomEntity();

							if ( place_near )
							{
								if ( place_near.is( sdBlock ) )
								{
									if ( place_near.DoesRegenerate() && place_near._natural )
									{
										let r = ~~( Math.random() * 4 );

										x = Math.floor( place_near.x / 16 ) * 16;
										y = Math.floor( place_near.y / 16 ) * 16;

										if ( r === 0 )
										x -= 16;
										else
										if ( r === 1 )
										x += 16;
										else
										if ( r === 2 )
										y -= 16;
										else
										if ( r === 3 )
										y += 16;
									}
								}
								else
								if ( place_near.is( sdBG ) && place_near._natural )
								{
									x = Math.floor( place_near.x / 16 ) * 16;
									y = Math.floor( place_near.y / 16 ) * 16;
								}
							}
							
							if ( x < sdWorld.world_bounds.x1 )
							should_skip = true;
							else
							if ( y < sdWorld.world_bounds.y1 )
							should_skip = true;
							else
							if ( x >= sdWorld.world_bounds.x2 )
							should_skip = true;
							else
							if ( y >= sdWorld.world_bounds.y2 )
							should_skip = true;
						}
						else
						{
							x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
							y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

							x = Math.floor( x / 16 ) * 16;
							y = Math.floor( y / 16 ) * 16;
							
							if ( Math.random() < 0.5 )
							x = ( Math.random() < 0.5 ) ? sdWorld.world_bounds.x1 : sdWorld.world_bounds.x2 - 16;
							else
							y = ( Math.random() < 0.5 ) ? sdWorld.world_bounds.y1 : sdWorld.world_bounds.y2 - 16;
						}
						
						if ( !should_skip )
						if ( sdWorld.CheckSolidDeepSleepExistsAtBox( x+1, y+1, x+15, y+15 ) ) // Prevent spawning blocks in deep sleep areas? Not tested but it should prevent double ground bug
						{
							should_skip = true;
						}
						
						if ( !should_skip )
						{
							//let hits = 0;
							
							for ( let i = 0; i < this._quake_temporary_not_regen_near.length; i++ )
							{
								let data = this._quake_temporary_not_regen_near[ i ];
								
								if ( data.until < sdWorld.time )
								{
									this._quake_temporary_not_regen_near.splice( i, 1 );
									i--;
									continue;
								}
								
								if ( sdWorld.inDist2D_Boolean( data.x, data.y, x, y, 100 ) )
								{
									//hits++;
									//if ( hits >= 3 )
									{
										should_skip = true;
										break;
									}
								}
							}
						}

						if ( !should_skip )
						for ( let num = 0; num < sdTzyrgAbsorber.absorbers.length; num++ )
						{
							//let di_absorbers = sdWorld.Dist2D( x, y, sdTzyrgAbsorber.absorbers[ num ].x, sdTzyrgAbsorber.absorbers[ num ].y );
							//if ( di_absorbers < 800 ) // if it's too close to an absorber
							if ( sdWorld.inDist2D_Boolean( x, y, sdTzyrgAbsorber.absorbers[ num ].x, sdTzyrgAbsorber.absorbers[ num ].y, sdTzyrgAbsorber.effect_radius ) )
							{
								should_skip = true;
								break;
							}
						}
						
						if ( should_skip === true )
						{
							// It can't place blocks next to an absorber since it's absorbing the earthquake. Also won't spawn blocks near blocks that spawned during this earthquake
						}
						else
						{
							sdWeather.last_crystal_near_quake = null;

							if ( ent.CanMoveWithoutOverlap( x, y, 0.0001, sdWeather.CrystalRemovalByEearthquakeFilter ) )
							{
								//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.DoesRegenerate() ) )
								//if ( !sdWorld.CheckWallExistsBox( x, y, x+16, y+16, null, null, [ 'sdBlock', 'sdWater' ] ) ) // Extra check for spike blocks and water/lava
								if ( !sdWorld.CheckWallExistsBox( x + 0.0001, y + 0.0001, x+16 - 0.0001, y+16 - 0.0001, null, null, [ 'sdBlock', 'sdWater' ] ) ) // Extra check for spike blocks and water/lava (liquids are caught by CrystalRemovalByEearthquakeFilter though now)
								{
									let ent_above = null;
									let ent_above_exists = false;

									let ent_below = null;
									let ent_below_exists = false;

									sdWorld.last_hit_entity = null;
									if ( !ent.CanMoveWithoutOverlap( x, y + 16, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural ) ) )
									{
										ent_below = sdWorld.last_hit_entity;
										ent_below_exists = true;
									}

									sdWorld.last_hit_entity = null;
									if ( !ent.CanMoveWithoutOverlap( x, y - 16, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural ) ) )
									{
										ent_above = sdWorld.last_hit_entity;
										ent_above_exists = true;
									}

									// Left and right entity will be threaten as above becase they do not require ant extra logic like plant clearence
									if ( !ent_above_exists )
									{
										sdWorld.last_hit_entity = null;
										if ( !ent.CanMoveWithoutOverlap( x - 16, y, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural ) ) )
										{
											ent_above = sdWorld.last_hit_entity;
											ent_above_exists = true;
										}
										sdWorld.last_hit_entity = null;
										if ( !ent.CanMoveWithoutOverlap( x + 16, y, 0.0001 ) && ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.is( sdBlock ) && sdWorld.last_hit_entity.DoesRegenerate() && sdWorld.last_hit_entity._natural ) ) )
										{
											ent_above = sdWorld.last_hit_entity;
											ent_above_exists = true;
										}
									}

									if ( ent_above_exists || ent_below_exists )
									{
										let bg_nature = true; // Or nothing or world border
										let bg_nature_ent = null;

										sdWorld.last_hit_entity = null;
										if ( sdWorld.CheckWallExistsBox( x+1, y+1, x + 16-1, y + 16-1, null, null, [ 'sdBG' ], null ) )
										if ( sdWorld.last_hit_entity )
										{
											if ( sdWorld.last_hit_entity.material !== sdBG.MATERIAL_GROUND )
											{
												if ( Math.random() < 0.1 ) // Chance to damage player-made backgrounds, will only work if they aren't protected
												{
													let e = sdWorld.last_hit_entity;

													e.DamageWithEffect( 20, null );

													if ( e._is_being_removed )
													bg_nature_ent = e;
												}
												else
												bg_nature = false;
											}
											else
											{
												bg_nature_ent = sdWorld.last_hit_entity;
											}
										}

										if ( bg_nature )
										{
											function ClearPlants()
											{
												if ( bg_nature_ent )
												bg_nature_ent.remove();

												if ( ent_below_exists )
												if ( ent_below )
												if ( ent_below._plants )
												{
													for ( let i = 0; i < ent_below._plants.length; i++ )
													{
														//let plant = sdEntity.entities_by_net_id_cache[ ent_below._plants[ i ] ];
														let plant = sdEntity.entities_by_net_id_cache_map.get( ent_below._plants[ i ] );
														if ( plant )
														plant.remove();
													}
													ent_below._plants = null;
												}
											}

											if ( sdWorld.AttemptWorldBlockSpawn( x, y ) )
											{
												ClearPlants();
												this._quake_temporary_not_regen_near.push({ x:x, y:y, until:sdWorld.time + 500 });
												//break; Do not skip anymore - spawn as many as there can be
											}

											/*let xx = Math.floor( x / 16 );
											let from_y = sdWorld.GetGroundElevation( xx );

											if ( y >= from_y )
											{
												let r = sdWorld.FillGroundQuad( x, y, from_y, false, true );

												if ( r )
												ClearPlants();

												break;
											}
											else
											if ( y === from_y - 8 )
											{
												y += 8;
												let r = sdWorld.FillGroundQuad( x, y, from_y, true, true );

												if ( r )
												ClearPlants();

												break;
											}
											else
											{
											}*/


										}
									}


								}
							}
							else
							if ( sdWeather.last_crystal_near_quake )
							{
								sdWorld.last_hit_entity = null;
								if ( sdWorld.CheckWallExistsBox( x - 4, y + 4, x+16 + 4, y+16 + 4, null, null, [ 'sdBlock' ] ) && 
										( sdWorld.last_hit_entity === null || 
											(	sdWorld.last_hit_entity.is( sdBlock ) && 
												sdWorld.last_hit_entity.DoesRegenerate() && 
												sdWorld.last_hit_entity._natural 
											) 
										)  
									)
								{
									if ( sdWeather.last_crystal_near_quake.is( sdWater ) )
									{
										sdWeather.last_crystal_near_quake.remove();
									}
									else
									{
										//sdWeather.last_crystal_near_quake.DamageWithEffect( 15 );
										if ( sdWeather.last_crystal_near_quake.IsTargetable( this ) )
										{
											sdWeather.last_crystal_near_quake.DamageWithEffect( 20 );
											
											// Do not damage something multiple times in a row
											this._quake_temporary_not_regen_near.push({ x:x, y:y, until:sdWorld.time + 500 });
										}
									}
								}
							}
						}

						tr--;
						if ( tr < 0 )
						{
							//ent.remove();
							break;
						}
					} while( true );
				}
				
				//ent.onRemove = ent.onRemoveAsFakeEntity; // Disable any removal logic
				ent.SetMethod( 'onRemove', ent.onRemoveAsFakeEntity ); // Disable any removal logic BUT without making .onRemove method appearing in network snapshot
				ent.remove();
				ent._remove();
			}
			
			if ( this._quake_scheduled_amount > 0 )
			{
				this._quake_scheduled_amount -= GSPEED * quake_logic_percentage_done;
				
				this.quake_intensity = Math.min( 100, this.quake_intensity + GSPEED * 0.3 );
			}
			else
			if ( this.quake_intensity > 0 )
			{
				this.quake_intensity = Math.max( 0, this.quake_intensity - GSPEED * 0.3 );
				
				if ( this.quake_intensity <= 0 )
				if ( this._quake_temporary_not_regen_near.length > 0 )
				this._quake_temporary_not_regen_near.length = 0;
			}
			
			if ( !this.air )
			{
				this._no_air_duration -= GSPEED;
				
				if ( this._no_air_duration <= 0 )
				this.air = 1;
				else
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Create the tasks
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'DIRTY_AIR', 
						executer: sdWorld.sockets[ i ].character,
						mission: sdTask.MISSION_TIMED_NOTIFICATION,
						difficulty: 0.1,
						title: 'Low oxygen concentration in air',
						time_left: this._no_air_duration,
						description: 'Oxygen concentration in atmosphere is getting low - we advice you to stay near oxygen sources, base shielding units or inside vehicles.',
					});
				}
			}
			
			// this._time_until_event = 0; // Hack
			
			this._time_until_event -= GSPEED;
			if ( this._time_until_event < 0 )
			{
				this._time_until_event = Math.random() * sdWorld.server_config.GetEventSpeed(); // Changed after introducing "daily events" since there is only up to 7 events that can happen to prevent them overflowing the map for new players

				let allowed_event_ids = this._daily_events;
				if ( allowed_event_ids.length > 0 )
				{
					let r = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
					this.ExecuteEvent( r );
				}
			}
			
			this._time_until_weather_event -= GSPEED;
			if ( this._time_until_weather_event < 0 )
			{
				this._time_until_weather_event = Math.random() * 30 * 60 * 6; // Need to add a server config option later - Booraz149

				let allowed_event_ids = this._daily_weather_events;
				if ( allowed_event_ids.length > 0 )
				{
					let r = allowed_event_ids[ ~~( Math.random() * allowed_event_ids.length ) ];
					this.ExecuteEvent( r );
				}
			}
			
			this._time_until_sd_task_event -= GSPEED;
			if ( this._time_until_sd_task_event < 0 )
			{
				this._time_until_sd_task_event = 30 * 60 * 5 + Math.random() * 30 * 2.5; // Need to add a server config option later - Booraz149

				let allowed_event_ids = this._daily_sd_task_events;
				if ( allowed_event_ids.length > 0 )
				{
					let event = ~~( Math.random() * allowed_event_ids.length );
					let r = allowed_event_ids[ event ];
					this.ExecuteEvent( r );
					
					allowed_event_ids.splice( event, 1 );
					//console.log( 'Executed event ' + r +', current available events:' + this._daily_sd_task_events );
				}
			}
		}
		else
		{
			//this._rain_offset = ( this._rain_offset + GSPEED ) % 32;
			
			sdWorld.world_bounds.x1 = this.x1;
			sdWorld.world_bounds.y1 = this.y1;
			sdWorld.world_bounds.x2 = this.x2;
			sdWorld.world_bounds.y2 = this.y2;
			
			//if ( this.air )
			if ( !sdWorld.my_entity || sdWorld.my_entity._can_breathe )
			this._dustiness = Math.max( 0, this._dustiness - GSPEED * 0.01 );
			else
			this._dustiness = Math.min( 1, this._dustiness + GSPEED * 0.01 );
		}
	}
	static CrystalRemovalByEearthquakeFilter( ent )
	{
		if ( ent )
		//if ( ent.is( sdCrystal ) )
		if ( !ent._natural )
		if ( ent.IsTargetable() || ent.is( sdWater ) )
		{
			sdWeather.last_crystal_near_quake = ent;
			//return false;
		}
		
		return true;
	}
	Draw( ctx, attached )
	{
		ctx.translate( -this.x, -this.y ); // sdWeather does move now just so it is kept inisde of world bounds and not gets removed with old areas
		//
		//ctx.translate( Math.floor(( sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale )/32)*32, 
		//               Math.floor(( sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale )/32)*32 );
		
		/*
		for ( var x = 0; x < sdRenderer.screen_width; x += 32 )
		for ( var y = 0; y < sdRenderer.screen_height; y += 32 )
		{
		    ctx.drawImage( sdWeather.img_rain, 
		        x - 16 + ( ( y % 32 < 16 ) ? 16 : 0 ), 
		        y - 16 + ( sdWorld.time % 32 ), 
		        32,32 );
	    }*/
		
		if ( this.raining_intensity > 0 )
		{
			ctx.globalAlpha = Math.pow( this.raining_intensity / 50, 1 );
			if ( this.matter_rain === 1 || this.matter_rain === 2 ) // Is it raining crystal shards?
			{
				ctx.globalAlpha = 1;
				if ( this.matter_rain === 2 )
				ctx.filter = sdWorld.GetCrystalHue( sdCrystal.anticrystal_value );
			}
			for ( var i = 0; i < sdWeather.pattern.length * this.raining_intensity / 100; i++ )
			{
				var p = sdWeather.pattern[ i ];
				
				var xx;
				var yy;

				if ( this.snow )
				{
					xx = sdWorld.mod( p.x * sdRenderer.screen_width + Math.sin( ( sdWorld.time * 0.001 + i ) )  * 5 - sdWorld.camera.x, sdRenderer.screen_width ) + sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale;
				    yy = sdWorld.mod( p.y * sdRenderer.screen_height + ( sdWorld.time * 0.01 ) - sdWorld.camera.y, sdRenderer.screen_height ) + sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale;
				}
				else
				{
					xx = sdWorld.mod( p.x * sdRenderer.screen_width - sdWorld.camera.x, sdRenderer.screen_width ) + sdWorld.camera.x - sdRenderer.screen_width / sdWorld.camera.scale;
				    yy = sdWorld.mod( p.y * sdRenderer.screen_height + ( sdWorld.time * 0.3 ) - sdWorld.camera.y, sdRenderer.screen_height ) + sdWorld.camera.y - sdRenderer.screen_height / sdWorld.camera.scale;
				}
				
				var just_one_step_check = ( Math.random() > 0.1 && p.last_y < yy && Math.abs( p.last_x - xx ) < 100 );

				p.last_x = xx;
				p.last_y = yy;

				if ( just_one_step_check )
				{
					if ( p.last_vis )
					{
						p.last_vis = this.TraceDamagePossibleHere( xx, yy, 2 );
						if ( !this.snow )
						if ( !this.matter_rain )
						if ( this.raining_intensity >= 30 )
						if ( !p.last_vis )
						{
						    let e;
							
					        if ( this.acid_rain )
						    e = new sdEffect({ x:xx, y:yy, type:sdEffect.TYPE_BLOOD_GREEN, filter:'opacity('+(~~((ctx.globalAlpha * 0.5)*10))/10+')' });
						    else
						    e = new sdEffect({ x:xx, y:yy, type:sdEffect.TYPE_BLOOD_GREEN, filter:'hue-rotate(90deg) opacity('+(~~((ctx.globalAlpha * 0.5)*10))/10+')' });
						
						    sdEntity.entities.push( e );
						}
					}
				}
				else
				p.last_vis = this.TraceDamagePossibleHere( xx, yy, Infinity );

				var vis = p.last_vis;

				if ( vis )
				{
					if ( this.snow )
					{
						ctx.drawImageFilterCache( sdWeather.img_snow, 
						xx - 16, 
						yy - 16, 
						32,32 );
					}
					else
					if ( this.acid_rain )
					ctx.drawImageFilterCache( sdWeather.img_rain, 
						xx - 16, 
						yy - 16, 
						32,32 );
					else
					if ( this.matter_rain === 1 || this.matter_rain === 2 )
					ctx.drawImageFilterCache( sdWeather.img_crystal_shard, 
						xx - 16, 
						yy - 16, 
						32,32 );
					else
					ctx.drawImageFilterCache( sdWeather.img_rain_water, 
						xx - 16, 
						yy - 16, 
						32,32 );
				}
			}
			ctx.globalAlpha = 1;
			ctx.filter = 'none';
		}
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( sdWeather.only_instance === this )
		sdWeather.only_instance = null;
	}
}
//sdWeather.init_class();

export default sdWeather;
