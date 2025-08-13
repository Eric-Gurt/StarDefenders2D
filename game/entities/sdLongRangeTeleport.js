/*

	TODO: sdCom-like subscription to portals as a result of which (store at player-side list of possible teleportation locations, probably)

	TODO: Add chat so players could send messages to other side? And do some sort of trading like that?

	TODO: Make RTPs work cross-server?

	Note: Test locally pair of new fresh LRTs - they are bugged in one direction...

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';
import sdHover from './sdHover.js';
import sdArea from './sdArea.js';
import sdCommandCentre from './sdCommandCentre.js';
import sdCrystal from './sdCrystal.js';
import sdGun from './sdGun.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdJunk from './sdJunk.js';
import sdLandScanner from './sdLandScanner.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdLongRangeAntenna from './sdLongRangeAntenna.js';

import sdTask from './sdTask.js';
import sdCharacter from './sdCharacter.js';

//import sdServerToServerProtocol from '../server/sdServerToServerProtocol.js';

import sdRenderer from '../client/sdRenderer.js';


class sdLongRangeTeleport extends sdEntity
{
	static init_class()
	{
		sdLongRangeTeleport.img_long_range_teleport = sdWorld.CreateImageFromFile( 'long_range_teleport' );
		
		sdLongRangeTeleport.max_matter = 300;
		
		sdLongRangeTeleport.long_range_teleports = [];
		
		//sdLongRangeTeleport.delay_simple = 30 * 10; // 10 seconds
		sdLongRangeTeleport.delay_simple = 30 * 3; // 3 seconds
		
		//sdLongRangeTeleport.redirect_codes = {}; // { code: _net_id }
		sdLongRangeTeleport.one_time_keys = []; // for redirections
		
		sdLongRangeTeleport.teleported_items = new WeakSet(); // Will be used to prevent rewards for teleporting beacons to other servers rather than destroying them
		
		sdLongRangeTeleport.ignored_class_pointers = new Set();
		sdLongRangeTeleport.ignored_class_pointers.add( 'sdTask' );
		sdLongRangeTeleport.ignored_class_pointers.add( 'sdSensorArea' );
		sdLongRangeTeleport.ignored_class_pointers.add( 'sdBG' );
		//sdLongRangeTeleport.ignored_class_pointers.add( 'sdStatusEffect' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -48; }
	get hitbox_x2() { return 48; }
	get hitbox_y1() { return -11; }
	get hitbox_y2() { return 0; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this.hea > 0 )
		{
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				if ( !this.is_server_teleport )
				this.hea -= dmg;

				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

				if ( this.delay < 90 )
				this.SetDelay( 90 );

				this._regen_timeout = 60;

				if ( this.hea <= 0 )
				this.remove();
			}
		}
	}
	IsInSafeArea()
	{
		if ( this.is_server_teleport )
		return true;
	
		return super.IsInSafeArea();
	}
	/*IsDamageAllowedByAdmins() // Extra check used by steering wheel elevators
	{
		if ( !this.is_server_teleport )
		return super.IsDamageAllowedByAdmins();
	
		return false;
	}*/
	Activation()
	{
		this._is_busy_since = sdWorld.time;
		this.is_charging = 1;
		this.charge_timer = 0;
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		this._update_version++;
		sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, volume:3, pitch:0.5 });
	}
	Deactivation()
	{
		this._is_busy_since = 0;
		this.is_charging = 0;
		this._update_version++;
		sdSound.PlaySound({ name:'crystal_combiner_end', x:this.x, y:this.y, volume:3, pitch:0.5 });

	}
	SetDelay( v )
	{
		if ( v < 0 )
		v = 0;

		if ( ( v > 0 ) !== ( this.delay > 0 ) )
		{
			if ( v === 0 )
			{
				sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:1 });
				this._update_version++;
			}
		}
		
		if ( Math.ceil( v / 30 ) !== Math.ceil( this.delay / 30 ) )
		{
			this._update_version++;
		}
		
		this.delay = v;

		if ( v > 0 )
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	onMatterChanged( by=null ) // Something like sdLongRangeTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 1500 * 4;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._cc_near = null;
		this.has_cc_near = false; // Store boolean because client does not know if cc exists
		
		this._local_supported_entity_classes = null;
		this._remote_supported_entity_classes = null;
		
		
		this._last_collected_entities_array = [];
		this._last_inserted_entities_array = [];
		this._last_overlap_issue_entities = [];
		
		this.delay = sdLongRangeTeleport.delay_simple;
		//this._update_version++
		
		this._matter_max = sdLongRangeTeleport.max_matter;
		this.matter = 0;
		
		// When initiation started and access granted - it will start increasing these
		this.charge_timer = 0; // 0..100 percents
		this.is_charging = 0; // This one will be 1 when preparing to swap entities
		
		this._charge_complete_method = null;
		
		this.is_server_teleport = params.is_server_teleport || 0; // 1 if admin creates it, 0 if user (in that case it works as a task completion target). Requires matter in both cases probably
		this.remote_server_url = 'http://localhost:3000';
		this.remote_server_target_net_id = this._net_id + '';
		
		this._is_busy_since = 0; // Used to prevent activations whenever data is being sent/received
		
		//this.owner_net_id = this._owner ? this._owner._net_id : null;
		
		sdLongRangeTeleport.long_range_teleports.push( this );
	}
	get biometry()
	{
		return 'Long-range teleport';
	}
	onServerSideSnapshotLoaded() // Something like LRT will use this to reset phase on load
	{
		this.charge_timer = 0;
		this.is_charging = 0;
		this._is_busy_since = 0;
	}
	/*ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_owner' ) return true;
		
		return false;
	}*/
	
	MeasureMatterCost()
	{
		return this.is_server_teleport ? Infinity : ( this.hmax * sdWorld.damage_to_matter + 300 );
	}
	onThinkFrozen( GSPEED )
	{
		if ( this.is_server_teleport )
		this.onThink( GSPEED );
		else
		{
			super.onThinkFrozen( GSPEED );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;
	
		let can_hibernateA = false;
		let can_hibernateB = false;
		
		this._cc_near = this.GetComWiredCache( null, sdCommandCentre );
		this.has_cc_near = !!this._cc_near; // Object to boolean conversion
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			this.hea = Math.min( this.hea + GSPEED, this.hmax );
			else
			can_hibernateA = true;
		}
		
		if ( this.matter >= this._matter_max )
		{
			if ( this.delay > 0 )
			this.SetDelay( this.delay - GSPEED );
			else
			can_hibernateB = true;
		}
		else
		can_hibernateB = true;
	
		if ( this.is_charging )
		{
			this.charge_timer = Math.min( 100, this.charge_timer + GSPEED * 0.66 );
			if ( this.charge_timer >= 100 )
			{
				if ( this._charge_complete_method )
				{
					this._charge_complete_method();
					this._charge_complete_method = null;
				}
			}
			this._update_version++;
		}
		else
		{
			if ( this.charge_timer > 0 )
			{
				this.charge_timer = Math.max( 0, this.charge_timer - GSPEED * 5 );
				this._update_version++;
			}
		}
	
		if ( can_hibernateA && can_hibernateB && this.charge_timer === 0 )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
	}
	get title()
	{
		return 'Long-range teleport';
	}
	get description()
	{
		return 'Can be used to manage private storage on Mothership, complete tasks and receive rewards. Does require command centre to be wired to it via cable management tool. Requires matter in order to work.';
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		if ( sdShop.isDrawing )
		ctx.scale( 0.333,0.333 );
	
		//if ( this.matter >= this._matter_max || sdShop.isDrawing )
		{
			if ( this.delay === 0 || sdShop.isDrawing )
			{
			}
			
			let version_offset = 0;
			
			if ( this.is_server_teleport )
			{
				version_offset = 0;
			}
			else
			{
				let cc_near = this.has_cc_near;//GetComWiredCache( null, sdCommandCentre );
				
				if ( cc_near && this.matter >= this._matter_max || sdShop.isDrawing )
				{
					if ( this.delay <= 0 || sdShop.isDrawing )
					version_offset = 32;
					else
					version_offset = 64;
				}
				else
				{
					version_offset = ( sdWorld.time % 4000 < 2000 ? 96 : 128 );
				}
			}

		    if ( this.charge_timer > 0 )
		    {
				ctx.sd_color_mult_r = 1 + this.charge_timer / 100 * 5;
				ctx.sd_color_mult_g = 1 + this.charge_timer / 100 * 5;
				ctx.sd_color_mult_b = 1 + this.charge_timer / 100 * 5;

			    //ctx.filter = 'brightness('+ ( 1 +(~~(this.charge_timer)) / 50 ) + ')';
				//ctx.filter = 'hue-rotate('+( 0 + 90*(~~(this.charge_timer)) / 100 )+'deg) saturate('+( 1 -(~~(this.charge_timer)) / 200 )+') brightness('+ ( 1 +(~~(this.charge_timer)) / 50 ) + ')';
			    ctx.drawImageFilterCache( sdLongRangeTeleport.img_long_range_teleport, 0,version_offset,96,32, -48,-16,96,32 );
			    //ctx.filter = 'none';

				ctx.sd_color_mult_r = 1;
				ctx.sd_color_mult_g = 1;
				ctx.sd_color_mult_b = 1;
		    }
		    else
			ctx.drawImageFilterCache( sdLongRangeTeleport.img_long_range_teleport, 0,version_offset,96,32, -48,-16,96,32 );
		}
		/*else
		{
			ctx.drawImageFilterCache( sdLongRangeTeleport.img_long_range_teleport_no_matter, ( sdWorld.time % 4000 < 2000 ? 1 : 0 )*32,0,32,32, - 16, - 16, 32,32 );
		}*/
		
		if ( this.is_charging )
		{
			let w = 48 * 2;
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 70, w, 3 );
			
			ctx.fillStyle = '#aabbff';
			ctx.fillRect( 1 - w / 2, 1 - 70, ( w - 2 ) * Math.max( 0, this.charge_timer / 100 ), 1 );
		}
	}
	static ShortenURL( remote_server_url )
	{
		return remote_server_url.split('http://').join('').split('https://').join('').split('www.').join('').split('/').join('');
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		let postfix = this.is_server_teleport ? '' : "  ( " + ~~(this.matter) + " / " + ~~(this._matter_max) + " )";
		
		sdEntity.Tooltip( ctx, this.title + postfix, 0, -48 );
		if ( this.is_server_teleport )
		sdEntity.Tooltip( ctx, sdLongRangeTeleport.ShortenURL( this.remote_server_url ), 0, 32 + 5, '#33ff33' );
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		let i = sdLongRangeTeleport.long_range_teleports.indexOf( this );
		if ( i !== -1 )
		sdLongRangeTeleport.long_range_teleports.splice( i, 1 );
	
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 3 );
				
			/*
			sdSound.PlaySound({ name:'blockB4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdLongRangeTeleport.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,y,a,s;
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			for ( y = step_size / 2; y < 32; y += step_size )
			if ( Math.abs( 16 - x ) > 7 && Math.abs( 16 - y ) > 7 )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}*/
		}
	}
	
	//GetEntitiesOnTop( partial_colision_too=false )
	GetEntitiesOnTop( use_task_filter=false, initiator=null )
	{
		let x1 = this.x - 48;
		let x2 = this.x + 48;
		let y1 = this.y - 64;
		let y2 = this.y + this.hitbox_y1;
		
		let ents = sdWorld.GetAnythingNear( (x1+x2)/2, (y1+y2)/2, Math.sqrt( Math.pow(x1-x2,2) + Math.pow(y1-y2,2) ) / 2 );
		
		let ents_final = [];
		
		let IsClassSupported = ( ent )=>
		{
			// Check if remote server supports this kind of entity
			if ( this._remote_supported_entity_classes !== null )
			if ( this._remote_supported_entity_classes.indexOf( ent.GetClass() ) === -1 )
			{
				return false;
			}
			
			return true;
		};
		
		let IsTeleportable = ( ent )=>
		{
			if ( ent.y > this.y ) // I have no clue but for some reason blue LRTP teleports counts stuff placed under it but doesn't teleport it? - Booraz149
			return false; // I just know that this fixes that, so I guess this is a bandaid fix.
		
			// Moving it here to prevent crystals being teleported through blocks
			if ( ent.x + ent.hitbox_x1 <= x2 &&
			     ent.x + ent.hitbox_x2 >= x1 &&
			     ent.y + ent.hitbox_y1 <= y2 &&
			     ent.y + ent.hitbox_y2 >= y1 &&
			     sdWorld.CheckLineOfSight( this.x, this.y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2, null, null, null, ( e )=>
				 {
					 if ( e.is( sdDoor ) )
					 {
						 return true;
					 }
					 
					 if ( e.is( sdBlock ) )
					 {
						 if ( e._natural )
						 {
							 e.remove();
							 return false;
						 }
						 
						 return true;
					 }
					 
				 } ) )
			{
			}
			else
			{
				return false;
			}
			
			// Disable teleporting items which have a "Protect" task on them, aswell as "Destroy"
			for ( let i = 0; i < sdTask.tasks.length; i++ )
			{
				let task = sdTask.tasks[ i ];
				if ( task._target === ent && sdTask.missions[ task.mission ] === sdTask.missions[ sdTask.MISSION_PROTECT_ENTITY ] )
				return false;
			
				if ( task._target === ent && sdTask.missions[ task.mission ] === sdTask.missions[ sdTask.MISSION_DESTROY_ENTITY ] )
				return false;
			}


			if ( use_task_filter )
			{
				for ( let i = 0; i < sdTask.tasks.length; i++ )
				{
					let task = sdTask.tasks[ i ];
					if ( task._executer === initiator )
					{
						let mission = sdTask.missions[ task.mission ];

						if ( mission.onLongRangeTeleportCalledForEntity )
						if ( mission.onLongRangeTeleportCalledForEntity( task, this, ent ) )
						{
							if ( mission.forAllPlayers ) // Check if initiator's task is "for all players" type
							if ( mission.forAllPlayers( task ) )
							for ( let j = 0; j < sdTask.tasks.length; j++ ) // For tasks which should count for all players
							{
								let task2 = sdTask.tasks[ j ];
								let mission2 = sdTask.missions[ task2.mission ];
								if ( task2._executer !== initiator ) // Make sure it doesn't check already confirmed task
								if ( mission2.forAllPlayers )
								if ( mission2.forAllPlayers( task2 ) )
								if ( mission2.onLongRangeTeleportCalledForEntity )
								if ( mission2.onLongRangeTeleportCalledForEntity( task2, this, ent ) )
								{
									// Feels like I'm butchering code, but it works - Booraz149
								}
							}
							return true;
						}
					}
					/*
					if ( sdTask.tasks[ i ].mission === sdTask.MISSION_LRTP_EXTRACTION )
					if ( sdTask.tasks[ i ]._executer === initiator )
					{
						if ( ent.GetClass() === sdTask.tasks[ i ]._target ) // For CC tasks
						{
							if ( ent.GetClass() === 'sdCrystal' || ent.GetClass() === 'sdJunk' )
							if ( ent.type === sdTask.tasks[ i ].extra && sdTask.tasks[ i ].extra !== -99 ) // -99 value is for "Teleport "X" matter worth of crystals task"
							if ( sdTask.tasks[ i ].lrtp_ents_count < sdTask.tasks[ i ].lrtp_ents_needed )
							{
								sdTask.tasks[ i ].lrtp_ents_count++;
								sdTask.tasks[ i ]._update_version++;
								return true;
								break;
							}
							if ( ent.GetClass() === 'sdSlug' || ent.GetClass() === 'sdVirus' )
							if ( ent._hea > 0 ) // No dead entities
							if ( sdTask.tasks[ i ].lrtp_ents_count < sdTask.tasks[ i ].lrtp_ents_needed )
							{
								sdTask.tasks[ i ].lrtp_ents_count++;
								sdTask.tasks[ i ]._update_version++;
								return true;
								break;
							}
							if ( ent.GetClass() === 'sdCube' )
							if ( sdTask.tasks[ i ].lrtp_ents_count < sdTask.tasks[ i ].lrtp_ents_needed )
							{
								sdTask.tasks[ i ].lrtp_ents_count++;
								sdTask.tasks[ i ]._update_version++;
								return true;
								break;
							}
							if ( ent.GetClass() === 'sdGun' )
							if ( ent.class === sdTask.tasks[ i ].extra )
							if ( sdTask.tasks[ i ].lrtp_ents_count < sdTask.tasks[ i ].lrtp_ents_needed )
							{
								sdTask.tasks[ i ].lrtp_ents_count++;
								sdTask.tasks[ i ]._update_version++;
								return true;
								break;
							}
						}
						if ( ent === sdTask.tasks[ i ]._target ) // For actual entity "target" extraction like that star defender event
						{
							sdTask.tasks[ i ].lrtp_ents_count++;
							sdTask.tasks[ i ]._update_version++;
							return true;
							break;
						}
					}
					
					if ( sdTask.tasks[ i ].mission === sdTask.MISSION_LRTP_EXTRACTION ) // If the extraction should apply progress for all players
					if ( ent.GetClass() === sdTask.tasks[ i ]._target ) // For CC tasks
					{
						let prog = false;
						if ( ent.GetClass() === 'sdCrystal' && sdTask.tasks[ i ].extra === -99 )
						if ( sdTask.tasks[ i ].lrtp_ents_count < sdTask.tasks[ i ].lrtp_ents_needed )
						{
							for( let j = 0; j < sdTask.tasks.length; j++ ) // I'm not sure what I did here but it works - Booraz149
							{
								if ( sdTask.tasks[ i ].extra === sdTask.tasks[ j ].extra )
								{
									sdTask.tasks[ j ].lrtp_ents_count += ent.matter_max;
									sdTask.tasks[ j ]._update_version++;
									sdTask.tasks[ j ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // Will wake-up task for a brief moment if it happens to be inactive due to disconnected user
									prog = true;
								}
							}
							if ( prog ) // Feels like I'm butchering the code once again - Booraz149
							{
								return true;
								//break; // Break won't be called after return. Return stops IsTeleportable function execution
							}
						}
					}*/
				}
				// Need a better approach if CC's should give tasks to whole team, and not the initiator only. ( Right click CC -> Give task )
				return false;
			}
			else
			{
				if ( !IsClassSupported( ent ) )
				return false;

				if ( ent.IsPlayerClass() && !ent._socket && ent._ai_enabled <= 0 )
				{
					// Do not teleport disconnected players
					return false;
				}
				else
				//if ( ent.is_static || ent._is_bg_entity !== 0 || ent._is_being_removed || ( ent.hea || ent._hea ) === undefined )
				if ( typeof ent.sx === 'undefined' || typeof ent.sy === 'undefined' || ent._is_bg_entity !== 0 || ent._is_being_removed || ( ent.hea || ent._hea ) === undefined ) // This will prevent tasks and status effects, but these will be caught later
				{
					return false;
				}

				if ( ent._held_by || ent.held_by )
				{
					return IsTeleportable( ent._held_by || ent.held_by );
				}
			}
			
			return true;
		};
		
		for ( let i = 0; i < ents.length; i++ )
		{
			let ent = ents[ i ];
			
			if ( IsTeleportable( ent ) )
			{
				// Moving it to IsTeleportable to prevent crystals being teleported through blocks
				//if ( ent.x + ent.hitbox_x1 <= x2 )
				//if ( ent.x + ent.hitbox_x2 >= x1 )
				//if ( ent.y + ent.hitbox_y1 <= y2 )
				//if ( ent.y + ent.hitbox_y2 >= y1 )
				//if ( sdWorld.CheckLineOfSight( this.x, this.y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2, null, null, [ 'sdBlock', 'sdDoor' ] ) )
				ents_final.push( ent );
			}
		}
		
		const Append = ( ent2 )=>
		{
			if ( IsTeleportable( ent2 ) ) // Still check if targetable just in case so sdLifeBox won't be teleported for example
			if ( ents_final.indexOf( ent2 ) === -1 )
			ents_final.push( ent2 );
		};
		
		// Attempt to catch drivers, held guns, held items and driven vehicles - because they might not have accurate positions and might have them delayed for the sake of low-rate cache update when held/transported. Will prevent cases of death due to sdHover teleportation but not players who are in it
		for ( let i = 0; i < ents_final.length; i++ )
		{
			let ent = ents_final[ i ];
			
			// Append status-effects, without extra checks
			let status_effects = sdStatusEffect.entity_to_status_effects.get( ent );
			if ( status_effects )
			for ( let i2 = 0; i2 < status_effects.length; i2++ )
			if ( IsClassSupported( status_effects[ i2 ] ) )
			ents_final.push( status_effects[ i2 ] );
			
			for ( let prop in ent )
			{
				if ( ent[ prop ] instanceof sdEntity )
				{
					if ( 
							prop.indexOf( 'driver' ) === 0 // drivers of vehicle
							||
							prop.indexOf( 'item' ) === 0 // contents of sdStorage
							||
							prop === 'driver_of' // driven vehicle
							||
							prop === '_held_by' // keeper of weapon
						)
					Append( ent[ prop ] );
				}
				else
				if ( ent[ prop ] instanceof Array )
				if ( prop === '_inventory' ) // Held guns by player
				{
					let arr = ent[ prop ];
					
					for ( let i2 = 0; i2 < arr.length; i2++ )
					if ( arr[ i2 ] )
					Append( arr[ i2 ] );
				}
			}
		}
		
		if ( use_task_filter )
		for ( let i = 0; i < sdTask.tasks.length; i++ )
		{
			let task = sdTask.tasks[ i ];

			if ( task._executer === initiator )
			{
				let mission = sdTask.missions[ task.mission ];

				if ( mission.onLongRangeTeleportCalled )
				if ( mission.onLongRangeTeleportCalled( task, this ) )
				{
				}
			}
		}
		
		return ents_final;
	}

	//GiveRewards( reward_type = 1 )
	GiveRewards( reward_type='CLAIM_REWARD_SHARDS', socket=null )
	{
		let rewards = reward_type;// || 1;
		if ( rewards === 'CLAIM_REWARD_SHARDS' )
		{
			for( let i = 0; i < 8; i++ )
			{
				let shard = new sdGun({ x:this.x + ( -24 + i * 8 ), y:this.y - 16, class:sdGun.CLASS_CUBE_SHARD });
				sdEntity.entities.push( shard );
			}
		}
		else
		if ( rewards === 'CLAIM_REWARD_WEAPON' )
		{
			for( let i = 0; i < 2; i++ ) // Task rewards now drop 2 items. Kind of painful to recieve only one item when you can get 15K worth of crystals - Booraz149
			{
				
				let gun, rng;
				rng = Math.random() * 0.9; // With more gun rewards, these values will change
				
				let types = [ sdGun.CLASS_TOPS_DMR, sdGun.CLASS_TOPS_SHOTGUN, sdGun.CLASS_COMBAT_INSTRUCTOR, sdGun.CLASS_ZAPPER, sdGun.CLASS_RAYRIFLE, sdGun.CLASS_AREA_AMPLIFIER, sdGun.CLASS_ILLUSION_MAKER, sdGun.CLASS_LVL4_ARMOR_REGEN, sdGun.CLASS_TOPS_PLASMA_RIFLE, sdGun.CLASS_TELEKINETICS ]

				gun = new sdGun({ x:this.x + ( i % 2 !== 0 ? 10 : -10 ), y:this.y - 16, class:sdWorld.AnyOf( types ) });
		
				sdEntity.entities.push( gun );
			}
		}
		else
		if ( rewards === 'CLAIM_REWARD_CRYSTALS' )
		{
			for( let i = 0; i < 3; i++ )
			{
				let crystal = new sdCrystal({ x:this.x + ( -24 + i * 24 ), y:this.y - 24, matter_max: 5120, type:sdCrystal.TYPE_CRYSTAL_ARTIFICIAL });
				sdEntity.entities.push( crystal );
			}
		}
		else
		if ( rewards === 'CLAIM_REWARD_CONTAINER' )
		{
			let container = new sdJunk({ x:this.x, y:this.y - 32, type: 6 });
			sdEntity.entities.push( container );
		}
		else
		if ( rewards === 'CLAIM_SCANNER' )
		{
			let scanner = new sdLandScanner({ x:this.x, y:this.y - 32});
			sdEntity.entities.push( scanner );
		}
		else
		if ( rewards === 'CLAIM_BUILD_TOOL' )
		{
			sdEntity.entities.push( new sdGun({ x:this.x, y:this.y - 32, class:sdGun.CLASS_BUILD_TOOL }) );
		}
		else
		if ( rewards === 'CLAIM_HOVER' )
		{
			let e = new sdHover({ x:this.x, y:this.y - 32, guns:0 });
			if ( e.CanMoveWithoutOverlap( this.x, this.y - 32 ) )
			{
				e.nick = 'Emergency Hover';
				
				e.filter = 'sepia(1) hue-rotate(180deg) brightness(1.5)';
				
				sdEntity.entities.push( e );
			}
			else
			{
				e.remove();
				e._broken = false;
				e._remove();
				return;
			}
		}
		else
		if ( rewards === 'CLAIM_REWARD_AD' )
		{
			if ( socket && socket.ad_reward_pending )
			{
				socket.ad_reward_pending = false;
				
				let r = [ 640, 1280, 2560, 5120 ][ ~~( Math.pow( Math.random(), 2 ) * 4 ) ];
				let crystal = new sdCrystal({ x:this.x, y:this.y - 24, matter_max: r, type:sdCrystal.TYPE_CRYSTAL_ARTIFICIAL });
				sdEntity.entities.push( crystal );
			}
		}
		if ( rewards === 'CLAIM_MERGER_CORE' )
		{
			let core;
			core = new sdGun({ x:this.x, y:this.y - 16, class:sdGun.CLASS_MERGER_CORE });
			sdEntity.entities.push( core );
		}
		
		if ( rewards === 'CLAIM_UPGRADE_STATION_CHIP' )
		{
			let chipset;
			chipset = new sdGun({ x:this.x, y:this.y - 16, class:sdGun.CLASS_UPGRADE_STATION_CHIPSET });
			sdEntity.entities.push( chipset );
		}
		
		sdWorld.SendEffect({ x:this.x, y:this.y - 24, type:sdEffect.TYPE_TELEPORT });
		sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
		
		this.matter = 0;
	}

	ExtractEntitiesOnTop( collected_entities_array=null, use_task_filter=false, initiator=null )
	{
		let ents_to_push = this.GetEntitiesOnTop( use_task_filter, initiator );
		let snapshots = [];
		let current_frame = globalThis.GetFrame();

		for ( let i = 0; i < ents_to_push.length; i++ )
		{
			ents_to_push[ i ].onBeforeLongRangeTeleport( this );
			
			snapshots.push( ents_to_push[ i ].GetSnapshot( current_frame, true ) );
		}
	
		if ( ents_to_push.length > 0 )
		sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });

		for ( let i = 0; i < ents_to_push.length; i++ )
		{
			let e = ents_to_push[ i ];
			
			//if ( e.is( sdCharacter ) )
			//debugger;
			
			sdWorld.SendEffect({ x:e.x + (e.hitbox_x1+e.hitbox_x2)/2, y:e.y + (e.hitbox_y1+e.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });
			
			e.remove();
			e._broken = false;
			sdLongRangeTeleport.teleported_items.add( e );
			
			if ( collected_entities_array )
			collected_entities_array.push( e );
		}

		return snapshots;
	}
	
	InsertEntitiesOnTop( snapshots, relative_x, relative_y )
	{
		let one_time_keys = [];
		
		let net_id_remap = new Map();
		
		sdWorld.unresolved_entity_pointers = [];
	
		if ( snapshots.length > 0 )
		sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
	
		let new_entities = [];
		this._last_inserted_entities_array = new_entities;
		
		const custom_filtering_method = ( e )=>
		{
			if ( e === this )
			return false;
			
			if ( new_entities.indexOf( e ) === -1 )
			return true;
		
			return false;
		};
		
		this._last_overlap_issue_entities = [];
						
		for ( let i = 0; i < snapshots.length; i++ )
		{
			let snapshot = snapshots[ i ];
			
			net_id_remap.set( snapshot._net_id, sdEntity.entity_net_ids );
			snapshot._net_id = sdEntity.entity_net_ids++;
			
			snapshot.x = snapshot.x - relative_x + this.x;
			snapshot.y = snapshot.y - relative_y + this.y;
			
			let ent = sdEntity.GetObjectFromSnapshot( snapshot );
			
			if ( ent )
			if ( !ent._is_being_removed )
			{
				if ( ent._affected_hash_arrays.length > 0 ) // Easier than checking for hiberstates
				sdWorld.UpdateHashPosition( ent, false, false );
			
				sdWorld.SendEffect({ x:ent.x + (ent.hitbox_x1+ent.hitbox_x2)/2, y:ent.y + (ent.hitbox_y1+ent.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });
				
				if ( ent.IsPlayerClass() )
				{
					ent._respawn_protection = 30 * 10; // 10 seconds of protection once teleported
					ent._god = false;
				}
				
				if ( !ent.CanMoveWithoutOverlap( ent.x, ent.y, 0, custom_filtering_method ) || 
					 !sdWorld.CheckLineOfSight( this.x, this.y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2, null, null, [ 'sdBlock', 'sdDoor' ] ) )
				this._last_overlap_issue_entities.push( sdWorld.last_hit_entity );
				
				new_entities.push( ent );
			}
			
			let key = {
				hash: Math.random()+''+Math.random()+''+Math.random()+''+Math.random(),
				ent: ent,
				until: sdWorld.time + 30 * 1000
			};
			
			sdLongRangeTeleport.one_time_keys.push( key );
			
			one_time_keys[ i ] = key.hash;
			
		}
		for ( let i = 0; i < sdWorld.unresolved_entity_pointers.length; i++ )
		{
			if ( net_id_remap.has( sdWorld.unresolved_entity_pointers[ i ][ 3 ] ) )
			sdWorld.unresolved_entity_pointers[ i ][ 3 ] = net_id_remap.get( sdWorld.unresolved_entity_pointers[ i ][ 3 ] );
			else
			{
				if ( !sdLongRangeTeleport.ignored_class_pointers.has( sdWorld.unresolved_entity_pointers[ i ]._class ) )
				trace( 'Warning: Pointer is impossible to resolve - entity was not recreated in new world. Pointer will likely be set to null. Pointer: ', sdWorld.unresolved_entity_pointers[ i ] );
			
				sdWorld.unresolved_entity_pointers[ i ][ 3 ] = -1;
			}
		}
		//sdWorld.unresolved_entity_pointers.push([ this, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
		
		
		sdWorld.SolveUnresolvedEntityPointers();
		sdWorld.unresolved_entity_pointers = null;
		
		return one_time_keys;
	}
	
	static AuthorizedIncomingS2SProtocolMessageHandler( data_object, callback ) // From legit/trusted source
	{
		let ret = null;
			
		if ( data_object.action === 'Exchange new _net_ids' )
		{
			/*ret = {
				message: 'New _net_ids are as follows'
			};*/
			debugger;
		}
		else
		{

			let possible_ent = sdEntity.entities_by_net_id_cache_map.get( parseInt( data_object.target_net_id ) );
				
			if ( possible_ent )
			{
				if ( data_object.action === 'Require long-range teleportation' )
				{
					if ( data_object.supported_entity_classes )
					possible_ent._remote_supported_entity_classes = data_object.supported_entity_classes;
					else
					possible_ent._remote_supported_entity_classes = null; // Old version probably
					
					if ( possible_ent.is_charging || sdWorld.time < possible_ent._is_busy_since + 15 * 1000 )
					{
						ret = {
							message: 'Started sequence is not finished yet (will be forcefully canceled if old enough)',
							is_charing: possible_ent.is_charging,
							is_busy: ( sdWorld.time < possible_ent._is_busy_since + 15 * 1000 )
						};
						
						if ( sdWorld.time < possible_ent._is_busy_since + 15 * 1000 )
						{
							possible_ent.Deactivation();
						}
					}
					else
					{
						possible_ent._local_supported_entity_classes = Object.keys( sdWorld.entity_classes );
						ret = {
							message: 'Granted',
							supported_entity_classes: possible_ent._local_supported_entity_classes
						};
						possible_ent.Activation();
					}
				}
				else
				if ( data_object.action === 'Do long-range teleportation' )
				{
					possible_ent.Deactivation();
					
					let one_time_keys = possible_ent.InsertEntitiesOnTop( data_object.snapshots, data_object.relative_x, data_object.relative_y );

					possible_ent._last_collected_entities_array = [];

					ret = {
						message: 'Take these',
						snapshots: possible_ent.ExtractEntitiesOnTop( possible_ent._last_collected_entities_array ),
						relative_x: possible_ent.x,
						relative_y: possible_ent.y,
						one_time_keys: one_time_keys
					};
				}
				else
				if ( data_object.action === 'Post-teleporation swap-back one-time keys' )
				{
					
					let collected_entities_array = possible_ent._last_collected_entities_array;
					
					trace( '--AuthorizedIncomingS2SProtocolMessageHandler--');
					trace( 'Executing: ', data_object.action );
					trace( 'collected_entities_array: ', collected_entities_array.length );
					//trace( 'collected_entities_array: ', collected_entities_array );
					
					for ( let i = 0; i < collected_entities_array.length; i++ )
					if ( collected_entities_array[ i ].IsPlayerClass() )
					if ( collected_entities_array[ i ]._socket )
					collected_entities_array[ i ]._socket.Redirect( possible_ent.remote_server_url, data_object.one_time_keys[ i ] );
		
					ret = {
						message: 'Final redirects done'
					};
				}
			}
			else
			ret = {
				message: 'Bad target'
			};
		}
		
		callback( ret );
	}
	
	static ReceivedCommandFromEntityClass( command_name, parameters_array )
	{
		if ( command_name === 'AD_START_ALLOWED' )
		{
			let old_volume = sdSound.volume;
			
			let started = false;

			adBreak({
				type: 'reward',  // ad shows at start of next level
				name: 'begging-for-crystals',
				beforeReward: ( showAdFn )=>
				{
					showAdFn();
					started = true;
				},  
				adDismissed: ()=>
				{
				},
				adViewed: ()=>
				{
					let lrtp = sdEntity.GetObjectByClassAndNetId( 'auto', parameters_array[ 0 ] );
					
					globalThis.socket.emit( 'ENTITY_CONTEXT_ACTION', [ lrtp.GetClass(), lrtp._net_id, 'CLAIM_REWARD_AD', [] ] );
				},
				beforeAd: () => { sdSound.SetVolumeScale( 0 ); }, // Prepare for the ad. Mute and pause the game flow
				afterAd: () => { sdSound.SetVolumeScale( old_volume ); } // Resume the game and un-mute the sound
			});
			
			setTimeout( ()=>
			{
				if ( !started )
				{
					sdRenderer.service_mesage_until = sdWorld.time + 12500;
					sdRenderer.service_mesage = sdWorld.GetAny([ 
						'Mothership: Sorry, we don\'t have any left over crystals for now. But you can ask later.',
						'Mothership: Maybe later. We are all kind of busy right now.',
						'Mothership: Still nothing. Try in 5 minutes?',
						'Mothership: No luck. Try later.',
						'Mothership: We are pretty much out of crystals right now. Maybe a bit later?',
						'Mothership: Ask again in 5 minutes.',
						'Mothership: Could not find anything for you yet, sorry.',
						'Mothership: I\'m so sorry.',
						'Mothership: They don\'t grow on trees, you know.',
						'Mothership: We had one but it got broken midway...',
						'Mothership: Sure, just ask in 5 minutes.',
						'Mothership: We had plenty in a storage but someone teleported Quickie which broke all our stuff including crystals.',
						'Mothership: We don\'t have any right now.',
						'Mothership: Message me in 5 minutes. We are in the middle of something.',
						'Mothership: We really are not picking who gets the crystals. Please don\'t be jealous if somebody gets crystals when you don\'t.',
						'Mothership: I have a note "Don\'t give crystals to this person" next to your name. I\'m really sorry...',
						'Mothership: We don\'t have any stunning ads for you to see at this moment. Oops.',
						'Mothership: Well... Doesn\'t the planet you are on has them?!',
						'Mothership: There is a note that says "torture this person with 5 minute delay promises".',
						'Mothership: There is a note that says "There is a note that says "torture this person with 5 minute delay promises"".',
						'Mothership: I hope you can wait for when it is a time.',
						'Mothership: One day we will have spare crystals.',
						'Mothership: No ads for you now. Sorry :('
					]);
				}
				
			}, 1500 );
		}
		else
		sdMotherShipStorageManager.HandleServerCommand( command_name, parameters_array );
	}
	
	AllowContextCommandsInRestirectedAreas( exectuter_character, executer_socket ) // exectuter_character can be null
	{
		return true;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'LIST_PRIVATE_STORAGE' )
			{
				if ( sdWorld.server_config.allow_private_storage_access )
				{
					let initiator_hash_or_user_uid = exectuter_character._my_hash;

					sdDatabase.Exec( 
						[ 
							[ 'DBManageSavedItems', initiator_hash_or_user_uid, 'LIST' ] 
						], 
						( responses )=>
						{
							// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server

							executer_socket.CommandFromEntityClass( sdLongRangeTeleport, 'LIST_RESET', [] ); // class, command_name, parameters_array

							for ( let i = 0; i < responses.length; i++ )
							{
								let response = responses[ i ];

								if ( response[ 0 ] === 'DENY_WITH_SERVICE_MESSAGE' )
								{
									executer_socket.SDServiceMessage( response[ 1 ] );
								}
								else
								if ( response[ 0 ] === 'LIST_RESULT' )
								{
									executer_socket.CommandFromEntityClass( sdLongRangeTeleport, 'LIST_ADD', [ response[ 1 ] ] ); // class, command_name, parameters_array
								}
								else
								debugger;
							}
						},
						'localhost'
					);
				}
				else
				{
					executer_socket.SDServiceMessage( 'Private storages are not available here' );
				}
				return;
			}
			
			//if ( exectuter_character._god || sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			if ( exectuter_character._god || ( this.inRealDist2DToEntity_Boolean( exectuter_character, 64 ) && executer_socket.character.canSeeForUse( this ) ) )
			{
				//let can_reset_teleport = !( this.is_charging || sdWorld.time < this._is_busy_since + 15 * 1000 );
				let can_reset_teleport = !this.is_charging || ( this.is_charging && sdWorld.time > this._is_busy_since + 15 * 1000 );
				
				if ( ( exectuter_character._god && command_name === 'TELEPORT_RESET' ) || ( this.is_charging && can_reset_teleport ) )
				{
					this.Deactivation();
					//this._is_busy_since = 0;
				}
				else
				if ( !can_reset_teleport )
				{
					executer_socket.SDServiceMessage( 'Long-range teleport is busy' );
				}
				else
				if (	
						// All possible reward claims - maybe no need to copy same code multiple times
						command_name === 'CLAIM_REWARD_SHARDS' ||
						command_name === 'CLAIM_REWARD_WEAPON' ||
						command_name === 'CLAIM_REWARD_CRYSTALS' ||
						command_name === 'CLAIM_REWARD_CONTAINER' || 
						command_name === 'CLAIM_REWARD_AD' ||
						command_name === 'CLAIM_MERGER_CORE' ||
						command_name === 'CLAIM_UPGRADE_STATION_CHIP'
						
					)
				{
					if ( !this.is_server_teleport )
					{
						let cc_near = this.has_cc_near;//GetComWiredCache( null, sdCommandCentre );
						if ( cc_near )
						{
							if ( this.matter >= this._matter_max )
							{
								let claim_cost = ( command_name === 'CLAIM_REWARD_AD' ) ? 0 : 1;
								
								if ( this.delay === 0 && exectuter_character._task_reward_counter >= claim_cost )
								{
									this.Activation();
									
									this._charge_complete_method = ()=>
									{
										this.Deactivation();
										
										if ( exectuter_character._is_being_removed ) // LRTP duping prevention
										{
											return;
										}
										
										if ( exectuter_character._task_reward_counter < claim_cost ) // Prevent claiming reward on multiple long-range teleports
										{
											executer_socket.SDServiceMessage( 'Reward claim was rejected - reward was claimed somewhere else' );
											return;
										}
										
										if ( this.matter < this._matter_max )
										{
											executer_socket.SDServiceMessage( 'Reward claim was rejected - not enough matter' );
											return;
										}
										
										this.GiveRewards( command_name, executer_socket );
										exectuter_character._task_reward_counter = Math.max( 0, exectuter_character._task_reward_counter - claim_cost );
									};
								}
								else
								executer_socket.SDServiceMessage( 'Not activated yet - possibly due to damage' );
							}
							else
							executer_socket.SDServiceMessage( 'Not enough matter' );
						}
						else
						executer_socket.SDServiceMessage( 'Long-range teleport requires Command Centre connected' );
					}
				}
				else
				if ( command_name === 'AD_REWARD_START' )
				{
					if ( !this.is_server_teleport )
					{
						let cc_near = this.has_cc_near;//GetComWiredCache( null, sdCommandCentre );
						if ( cc_near )
						{
							if ( this.matter >= this._matter_max )
							{
								if ( sdWorld.time > executer_socket.next_ad_time )
								{
									executer_socket.ResetAdCooldown();
									executer_socket.CommandFromEntityClass( sdLongRangeTeleport, 'AD_START_ALLOWED', [ this._net_id ] );

									executer_socket.ad_reward_pending = true;
								}
								else
								executer_socket.SDServiceMessage( 'Not so soon. Try in 5 minutes' );
							}
							else
							executer_socket.SDServiceMessage( 'Not enough matter' );
						}
						else
						executer_socket.SDServiceMessage( 'Long-range teleport requires Command Centre connected' );
					}
				}
				else
				if ( command_name === 'CLAIM_SCANNER' || command_name === 'CLAIM_BUILD_TOOL' || command_name === 'CLAIM_HOVER' )
				{
					if ( !this.is_server_teleport )
					{
						let cc_near = this.has_cc_near;//GetComWiredCache( null, sdCommandCentre );
						if ( cc_near )
						{
							if ( this.matter >= this._matter_max )
							{
								this.Activation();

								this._charge_complete_method = ()=>
								{
									if ( this.matter < this._matter_max )
									{
										executer_socket.SDServiceMessage( 'Claim was rejected - not enough matter' );
										return;
									}

									this.Deactivation();
									this.GiveRewards( command_name );
									
									if ( this.matter !== 0 )
									executer_socket.SDServiceMessage( 'Claim was rejected - something is blocking the path' );
								};
							}
							else
							executer_socket.SDServiceMessage( 'Not enough matter' );
						}
						else
						executer_socket.SDServiceMessage( 'Long-range teleport requires Command Centre connected' );
					}
				}
				else
				if ( command_name === 'TELEPORT_ANTENNA' )
				{
					if ( !this.is_server_teleport )
					{
						let cc_near = this.has_cc_near;//GetComWiredCache( null, sdCommandCentre );
						if ( cc_near )
						{
							if ( this.matter >= this._matter_max )
							{
								this.Activation();

								this._charge_complete_method = ()=>
								{
									if ( this.matter < this._matter_max )
									{
										executer_socket.SDServiceMessage( 'Teleport was rejected - not enough matter' );
										return;
									}

									this.Deactivation();
									let nearest_antenna = null;
									for ( let i = 0; i < sdLongRangeAntenna.antennas.length; i++ )
									{
										//let nearest_antenna = null;
										let nearest_di = Infinity;
										let antenna = sdLongRangeAntenna.antennas[ i ];
										if ( antenna.progress >= 100 ) // At least one calibrated antenna
										{
											if ( !nearest_antenna )
											{
												nearest_antenna = antenna;
												nearest_di = sdWorld.Dist2D( this.x, this.y, antenna.x, antenna.y ); 
											}
											else // We already have an antenna? But what if one is closer?
											{
												let di = sdWorld.Dist2D( this.x, this.y, antenna.x, antenna.y ); 
												if ( di < nearest_di )
												{
													nearest_antenna = antenna;
													nearest_di = di;
												}
											}
										}
									}
									if ( nearest_antenna )
									{
										if ( !nearest_antenna.AttemptTeleportToTarget( exectuter_character ) )
										executer_socket.SDServiceMessage( 'Teleport path is blocked.' );
									}
									else
									executer_socket.SDServiceMessage( 'No calibrated antenna is available for teleport.' );
								};
							}
							else
							executer_socket.SDServiceMessage( 'Not enough matter' );
						}
						else
						executer_socket.SDServiceMessage( 'Long-range teleport requires Command Centre connected' );
					}
				}
				else
				if ( command_name === 'TELEPORT_STUFF' || 
					 command_name === 'SAVE_STUFF' || 
					 command_name === 'GET_PRIVATE_STORAGE' )
				{
					if ( command_name === 'GET_PRIVATE_STORAGE' )
					if ( !sdWorld.server_config.allow_private_storage_access )
					{
						executer_socket.SDServiceMessage( 'Private storages are not available here' );
						return;
					}

					if ( !this.is_server_teleport )
					{
						let cc_near = this.has_cc_near;//GetComWiredCache( null, sdCommandCentre );
						if ( cc_near )
						{
							if ( this.matter >= this._matter_max )
							{
								if ( this.delay === 0 )
								{
									this.Activation();
									
									this._charge_complete_method = ()=>
									{
										this.Deactivation();
										
										if ( this.matter < this._matter_max )
										{
											executer_socket.SDServiceMessage( 'Not enough matter' );
											return;
										}
										
										let collected_entities_array = [];

										if ( command_name === 'TELEPORT_STUFF' )
										{
											this.ExtractEntitiesOnTop( collected_entities_array, true, exectuter_character );
										
											if ( collected_entities_array.length === 0 )
											executer_socket.SDServiceMessage( 'You need to assign yourself a task using a Command Centre!' );
											else
											{
												for ( let i = 0; i < collected_entities_array.length; i++ )
												exectuter_character.GiveScore( sdEntity.SCORE_REWARD_TASK_ITEM_FUNCTION( collected_entities_array[ i ] ), collected_entities_array[ i ] );

												this.matter = 0;
											}
										}
										else
										if ( command_name === 'SAVE_STUFF' )
										{
											let classes = Object.keys( sdWorld.entity_classes );
											
											// Never save players here
											for ( let i = 0; i < classes.length; i++ )
											{
												let c = sdWorld.entity_classes[ classes[ i ] ];
												
												try
												{
													if ( !c.prototype || !c.prototype.IsPlayerClass || c.prototype.IsPlayerClass() )
													{
														classes.splice( i, 1 );
														i--;
														continue;
													}
												}
												catch ( e )
												{
													classes.splice( i, 1 );
													i--;
													continue;
												}
											}
											
											if ( parameters_array[ 0 ].toLowerCase() === 'recovered weapon' )
											{
												executer_socket.SDServiceMessage( 'Invalid storage name' );
												return;
											}
											
											this._remote_supported_entity_classes = classes;
											let snapshots = this.ExtractEntitiesOnTop( collected_entities_array, false, exectuter_character );
											
										
											if ( collected_entities_array.length === 0 )
											executer_socket.SDServiceMessage( 'Nothing was saved' );
											else
											{
												let initiator_hash_or_user_uid = exectuter_character._my_hash;
												let this_x = this.x;
												let this_y = this.y;
												
												this.matter = 0;

												sdDatabase.Exec( 
													[ 
														[ 'DBManageSavedItems', initiator_hash_or_user_uid, 'SAVE', parameters_array[ 0 ], snapshots, this_x, this_y, true ] 
													], 
													( responses )=>
													{
														// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server
														for ( let i = 0; i < responses.length; i++ )
														{
															let response = responses[ i ];
															
															if ( response[ 0 ] === 'DENY_WITH_SERVICE_MESSAGE' )
															{
																executer_socket.SDServiceMessage( response[ 1 ] );
																this.InsertEntitiesOnTop( snapshots, this_x, this_y );
															}
															else
															if ( response[ 0 ] === 'SUCCESS' )
															{
																//executer_socket.SDServiceMessage( 'Success!' );
																executer_socket.CommandFromEntityClass( sdLongRangeTeleport, 'LIST_UPDATE_IF_TRACKING', [] ); // class, command_name, parameters_array
															}
														}
													},
													'localhost'
												);
											}
										}
										else
										if ( command_name === 'GET_PRIVATE_STORAGE' )
										{
									
											let initiator_hash_or_user_uid = exectuter_character._my_hash;
											let this_x = this.x;
											let this_y = this.y;

											this.matter = 0;

											sdDatabase.Exec( 
												[ 
													[ 'DBManageSavedItems', initiator_hash_or_user_uid, 'GET', parameters_array[ 0 ] ] 
												], 
												( responses )=>
												{
													// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server
													for ( let i = 0; i < responses.length; i++ )
													{
														let response = responses[ i ];

														if ( response[ 0 ] === 'DENY_WITH_SERVICE_MESSAGE' )
														{
															executer_socket.SDServiceMessage( response[ 1 ] );
														}
														else
														if ( response[ 0 ] === 'GET_RESULT' )
														{
															let snapshots = response[ 1 ];
															let relative_x = response[ 2 ];
															let relative_y = response[ 3 ];

															this.InsertEntitiesOnTop( snapshots, relative_x, relative_y );

															if ( this._last_overlap_issue_entities.length > 0 )
															{
																for ( let i = 0; i < this._last_overlap_issue_entities.length; i++ )
																if ( this._last_overlap_issue_entities[ i ] ) // Not null, which is a world bounds
																this._last_overlap_issue_entities[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 6, 0.5, 0.5 ], observer: exectuter_character });

																while ( this._last_inserted_entities_array.length > 0 )
																{
																	let e = this._last_inserted_entities_array.pop();
																	e.remove();
																	e._broken = false;

																	sdLongRangeTeleport.teleported_items.add( e );
																}

																// Return back...
																sdDatabase.Exec( 
																	[ 
																		[ 'DBManageSavedItems', initiator_hash_or_user_uid, 'SAVE', parameters_array[ 0 ], snapshots, this_x, this_y, false ] 
																	], 
																	( responses )=>
																	{
																		// What if responses is null? Might happen if there is no connection to database server or database server refuses to accept connection from current server
																		for ( let i = 0; i < responses.length; i++ )
																		{
																			let response = responses[ i ];

																			if ( response[ 0 ] === 'DENY_WITH_SERVICE_MESSAGE' )
																			{
																				executer_socket.SDServiceMessage( response[ 1 ] + ' (items were permanently deleted due to overlap and sudden connection issue with database...)' );
																				//this.InsertEntitiesOnTop( snapshots, this_x, this_y );
																			}
																			else
																			if ( response[ 0 ] === 'SUCCESS' )
																			{
																				executer_socket.SDServiceMessage( 'Items can not be placed here due to overlap' );
																				//executer_socket.CommandFromEntityClass( sdLongRangeTeleport, 'LIST_UPDATE_IF_TRACKING', [] ); // class, command_name, parameters_array
																			}
																		}
																	},
																	'localhost'
																);
															}
															else
															{
																executer_socket.CommandFromEntityClass( sdLongRangeTeleport, 'LIST_UPDATE_IF_TRACKING', [] ); // class, command_name, parameters_array
															}
														}
														else
														debugger;
													}
												},
												'localhost'
											);
										}
									};
								}
								else
								executer_socket.SDServiceMessage( 'Not activated yet - possibly due to damage' );
							}
							else
							executer_socket.SDServiceMessage( 'Not enough matter' );
						}
						else
						executer_socket.SDServiceMessage( 'Long-range teleport requires Command Centre connected' );
					}
					else
					{
						if ( !can_reset_teleport )
						{
							executer_socket.SDServiceMessage( 'Busy - previous sequence is not finished yet (will be forcefully canceled if old enough)' );
							
							if ( sdWorld.time > this._is_busy_since + 15 * 1000 )
							{
								this.Deactivation();
							}
							
							return;
						}
						else
						{
							executer_socket.SDServiceMessage( 'Pending remote connection...' );

							this.SetDelay( sdLongRangeTeleport.delay_simple );
							this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

							this._local_supported_entity_classes = Object.keys( sdWorld.entity_classes );

							sdServerToServerProtocol.SendData(
								this.remote_server_url,
								{
									action: 'Require long-range teleportation',
									target_net_id: this.remote_server_target_net_id,
									supported_entity_classes: this._local_supported_entity_classes
								},
								( response=null )=>
								{
									//this._is_busy_since = 0;

									if ( response )
									{
										executer_socket.SDServiceMessage( '' );
							
										if ( response.message === 'Granted' )
										{
											if ( response.supported_entity_classes )
											this._remote_supported_entity_classes = response.supported_entity_classes;
											else
											this._remote_supported_entity_classes = null; // Old version probably
											
											//sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:1 });
											this.Activation();
											
											this._charge_complete_method = ()=>
											{
												let collected_entities_array = [];

												let snapshots = this.ExtractEntitiesOnTop( collected_entities_array );

												sdServerToServerProtocol.SendData(
													this.remote_server_url,
													{
														action: 'Do long-range teleportation',
														target_net_id: this.remote_server_target_net_id,
														snapshots: snapshots,
														relative_x: this.x,
														relative_y: this.y
													},
													( response=null )=>
													{
														this.Deactivation();
														
														if ( response )
														{
															let one_time_keys_for_remote = this.InsertEntitiesOnTop( response.snapshots, response.relative_x, response.relative_y );

															for ( let i = 0; i < collected_entities_array.length; i++ )
															if ( collected_entities_array[ i ].IsPlayerClass() )
															if ( collected_entities_array[ i ]._socket )
															//if ( collected_entities_array[ i ].hea > 0 )
															collected_entities_array[ i ]._socket.Redirect( this.remote_server_url, response.one_time_keys[ i ] );
												

															sdServerToServerProtocol.SendData(
																this.remote_server_url,
																{
																	action: 'Post-teleporation swap-back one-time keys',
																	target_net_id: this.remote_server_target_net_id,
																	one_time_keys: one_time_keys_for_remote
																},
																( response=null )=>
																{
																	if ( response )
																	{
																	}
																	else
																	{
																		trace('Remote server did not receive swap-back redirect keys... This can cause players to not be redirected towards this server');
																	}
																}
															);
														}
														else
														{
															this.InsertEntitiesOnTop( snapshots, this.x, this.y );
															debugger; // Restore _net_ids for players
														}
													}
												);
											};
										}
										else
										executer_socket.SDServiceMessage( 'Remote server responded with: ' + JSON.stringify( response ) );
									}
									else
									{
										executer_socket.SDServiceMessage( 'Unable to reach remote server' );
										trace('Unable to reach remote server error happened. Data object sent: ', 
										{
											action: 'Require long-range teleportation',
											target_net_id: this.remote_server_target_net_id,
											supported_entity_classes: this._local_supported_entity_classes
										} );
									}
								}
							);
						}
					}
				}
				else
				if ( exectuter_character._god )
				{
					let admin_row = sdModeration.GetAdminRow( executer_socket );
					
					if ( admin_row )
					if ( admin_row.access_level === 0 || sdWorld.server_config.let_non_full_access_level_admin_setup_long_range_teleports )
					{
						if ( command_name === 'SET_REMOTE_SERVER_URL' )
						if ( parameters_array.length === 1 && typeof parameters_array[ 0 ] === 'string' && parameters_array[ 0 ].length < 300 )
						{
							this.remote_server_url = parameters_array[ 0 ];
							this._update_version++;
							executer_socket.SDServiceMessage( 'Remote server URL set' );
						}

						if ( command_name === 'SET_REMOTE_TARGET_NET_ID' )
						if ( parameters_array.length === 1 && typeof parameters_array[ 0 ] === 'string' && parameters_array[ 0 ].length < 64 )
						{
							this.remote_server_target_net_id = parameters_array[ 0 ];
							this._update_version++;
							executer_socket.SDServiceMessage( 'Remote _net_id set' );
						}

					}
				}
				else
				executer_socket.SDServiceMessage( 'No permissions' );
			}
			else
			executer_socket.SDServiceMessage( 'Long-range teleport is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		//if ( exectuter_character._god || sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		if ( exectuter_character._god || this.inRealDist2DToEntity_Boolean( exectuter_character, 64 ) )
		{
			/*if ( sdWorld.my_entity && this.owner_net_id === sdWorld.my_entity._net_id )
			this.AddContextOption( 'Lose ownership', 'UNRESCUE_HERE', [] );
			else
			this.AddContextOption( 'Set as personal rescue teleport', 'RESCUE_HERE', [] );*/
		
			//
			if ( this.is_server_teleport )
			if ( exectuter_character._god )
			{
				this.AddPromptContextOption( 'Set remote server URL', 'SET_REMOTE_SERVER_URL', [ undefined ], 'Enter remote server URL (same as for players)', this.remote_server_url, 300 );
				this.AddPromptContextOption( 'Set remote long-range teleport _net_id', 'SET_REMOTE_TARGET_NET_ID', [ undefined ], 'Enter remote server URL (same as for players)', this.remote_server_target_net_id, 64 );
				this.AddPromptContextOption( 'Get this long-range teleport _net_id', 'GET_REMOTE_TARGET_NET_ID', [ undefined ], 'This is a _net_id of this long-range teleport entity', this._net_id, 64 );
				this.AddContextOption( 'Forcefully reset state', 'TELEPORT_RESET', [] );
			}
			
			if ( !this.is_server_teleport )
			{
				this.AddContextOption( 'Send items for task completion ( 300 matter )', 'TELEPORT_STUFF', [] );
				
				//Allow regular LRTP to teleport near antennas
				this.AddContextOption( 'Teleport to nearest long range frequency antenna', 'TELEPORT_ANTENNA', [] );
				
				for ( let i = 0; i < sdTask.tasks.length; i++ )
				{
					if ( sdTask.tasks[ i ].mission )
					{
						if ( sdTask.tasks[ i ].mission === sdTask.MISSION_TASK_CLAIM_REWARD )
						{
							this.AddContextOption( 'Claim rewards ( cube shards )', 'CLAIM_REWARD_SHARDS', [] );
							this.AddContextOption( 'Claim rewards ( weapons )', 'CLAIM_REWARD_WEAPON', [] );
							this.AddContextOption( 'Claim rewards ( crystals )', 'CLAIM_REWARD_CRYSTALS', [] );
							this.AddContextOption( 'Claim rewards ( advanced matter container )', 'CLAIM_REWARD_CONTAINER', [] );
							this.AddContextOption( 'Claim rewards ( merger core )', 'CLAIM_MERGER_CORE', [] );
							this.AddContextOption( 'Claim rewards ( upgrade station chipset )', 'CLAIM_UPGRADE_STATION_CHIP', [] );
						}

						if ( sdTask.tasks[ i ].mission === sdTask.MISSION_LRTP_EXTRACTION )
						{
							let task = sdTask.tasks[ i ];
							{
								if ( task.title === 'Planet scan' ) // This variable / property is the only way I got the context option to work, and that's after 6 beers and 3 hours - Booraz149
								{
									this.AddContextOption( 'Recieve the land scanner', 'CLAIM_SCANNER', [] );
								}
							}
						}
					}
				}
				
				this.AddPromptContextOption( 'Send items to private storage on Mothership', 'SAVE_STUFF', [ undefined ], 'Enter name for item group', '', 100 );
				
				//sdMotherShipStorageManager.Open()
				
				this.AddClientSideActionContextOption( 'Manage private storage on Mothership', ()=>
				{
					sdMotherShipStorageManager.Close();
					sdMotherShipStorageManager.Open({ lrtp: this });
				}, true );
				
				if ( sdWorld.my_entity )
				if ( sdWorld.my_entity._inventory[ sdGun.classes[ sdGun.CLASS_BUILD_TOOL ].slot ] === null )
				this.AddContextOption( 'Ask Mothership for build tool', 'CLAIM_BUILD_TOOL', [] );
		
				this.AddContextOption( 'Ask Mothership for Hover', 'CLAIM_HOVER', [] );
									
				this.AddContextOption( 'Ask Mothership for crystals ( watch ad )', 'AD_REWARD_START', [] );
			}
			else
			{
				this.AddContextOption( 'Initiate teleportation', 'TELEPORT_STUFF', [] );
			}
		}
	}
}
//sdLongRangeTeleport.init_class();

export default sdLongRangeTeleport;
