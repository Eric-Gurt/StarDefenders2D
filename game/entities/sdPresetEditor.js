/*

	Players can create these to save/load presets, perhaps.

	TODO: This is unfinished. Could be used to make presets which later could be used with more meaning. It works but simply does not do anything as of yet

	TODO: SpawnPresetInWorld requires preset file content caching.


	Spawning presets in random places in world (poorly tested but might just work well already):

		sdWorld.entity_classes.sdPresetEditor.SpawnPresetInWorld( 'test_tower' );

			OR (for debug info and callback case):

		sdWorld.entity_classes.sdPresetEditor.SpawnPresetInWorld( 'test_tower', { debug:1 }, ( editor )=>
			{
				if ( editor )
				if ( sdWorld.sockets[ 0 ] )
				if ( sdWorld.sockets[ 0 ].character )
				{
					sdWorld.sockets[ 0 ].character.x = editor.x;
					sdWorld.sockets[ 0 ].character.y = editor.y;
				}
			});

*/
/* global globalThis, Infinity, sdShop */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdBG from './sdBG.js';
import sdCharacter from './sdCharacter.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdRescueTeleport from './sdRescueTeleport.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';
import sdStorage from './sdStorage.js';
import sdBeacon from './sdBeacon.js';

import sdRenderer from '../client/sdRenderer.js';

let fs = null;

class sdPresetEditor extends sdEntity
{
	static init_class()
	{
		//sdPresetEditor.PROGRAM_DO_NOTHING = 0;
		
		sdPresetEditor.regions = [];
		
		sdPresetEditor.active_async_preset_spawn_tasks = 0;
		
		fs = globalThis.fs;
		
		sdPresetEditor.BIT_EMPTY = 0; // Leave existing entities as is
		sdPresetEditor.BIT_FILLED = 1; // Erase existing entities
		sdPresetEditor.BIT_AIR = 2; // Prioritize preset spawn locations where air is under these bits, erase entities if there is no air
		sdPresetEditor.BIT_GROUND = 3; // Prioritize preset spawn locations where air is under these bits, replace existing entities with natural dirt
		// Higher number has priority over low numbers
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.w; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.h; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	IsVisible( observer_entity )
	{
		if ( observer_entity )
		if ( observer_entity.IsPlayerClass() )
		if ( observer_entity._god )
		return true;

		return false;
	}
	
	get title()
	{
		return T('Preset Editor');
	}
	
	IsHittableWithAdminTools() // Admin tool for removal
	{ return false; }
	
	dragWhenBuilt( builder_entity ) // true = deny animation recovery, false = allow weapon reload animation recovery
	{
		this.x = Math.round( Math.min( builder_entity.look_x, this._x0 ) / 16 ) * 16;
		this.y = Math.round( Math.min( builder_entity.look_y, this._y0 ) / 16 ) * 16;
		
		this.w = Math.round( ( Math.max( builder_entity.look_x, this._x0 ) - this.x ) / 16 ) * 16;
		this.h = Math.round( ( Math.max( builder_entity.look_y, this._y0 ) - this.y ) / 16 ) * 16;
		
		if ( this.w > 16 * 30 )
		this.w = 16 * 30;
		if ( this.h > 16 * 30 )
		this.h = 16 * 30;
		
		this._update_version++;
		
		this.UpdateHitboxInitial();
		
		return true; // true = deny animation recovery
	}
	dragWhenBuiltComplete()
	{
		// No sure if these even happen
		if ( this.w < 0 )
		{
			this.x += this.w;
			this.w *= -1;
		}
		if ( this.h < 0 )
		{
			this.y += this.h;
			this.h *= -1;
		}
		
		if ( this.w === 0 || this.h === 0 )
		this.remove();
	}
	
	constructor( params )
	{
		super( params );
		
		//this.filter = params.filter || '';
		
		this._x0 = this.x;
		this._y0 = this.y;
		
		//this.r = 50;
		//this.g = 255;
		//this.b = 50;
		
		this.w = params.w || 128;
		this.h = params.h || 128;
		
		//this.program = sdPresetEditor.PROGRAM_DO_NOTHING;
		this._program = ''; // Perhaps some logic attached to preset, same as used for sdBotFactory
		
		this.preset_name = '';//'untitled_preset' + ( this._net_id === undefined ? '' : '_' + this._net_id );
		this.authors = [];// Preset authors?
		
		this.tags = []; // Tags which preset creator can define to simplify search / preset loading
		
		this._last_inserted_entities_array = [];
		
		this.associated_button_net_ids = []; // Why not have physical buttons that different admins could press? Just not sure what those buttons would be, possibly context options will be enough
		
		this.time_scale = 0; // Percentages
		
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED, false );
		
		sdPresetEditor.regions.push( this );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			//if ( sdWorld.time > this._expiration )
			//this.remove();
		}
	}
	MeasureMatterCost()
	{
		return Infinity;
	}
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 7; }
	//RequireSpawnAlign() 
	//{ return true; }
	
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		let id = sdPresetEditor.regions.indexOf( this );
		if ( id !== -1 )
		sdPresetEditor.regions.splice( id, 1 );
		else
		debugger;
	}
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }

	GetEntitiesInside( initiator = null, highlight_objects = true )
	{
		let x1 = this.x;
		let x2 = this.x + this.hitbox_x2;
		let y1 = this.y;
		let y2 = this.y + this.hitbox_y2;
		
		let ents = sdWorld.GetAnythingNear( (x1+x2)/2, (y1+y2)/2, Math.sqrt( Math.pow(x1-x2,2) + Math.pow(y1-y2,2) ) / 2 );
		
		let ents_final = [];
		
		let IsClassSupported = ( ent )=>
		{
					if ( ent.x + ent.hitbox_x1 < x2 &&
			     ent.x + ent.hitbox_x2 > x1 &&
			     ent.y + ent.hitbox_y1 < y2 &&
			     ent.y + ent.hitbox_y2 > y1 )
				 return true;
		
			return false;
		};
		
		let IsSaveable = ( ent )=>
		{
		
			{
				if ( !IsClassSupported( ent ) )
				return false;

				if ( ent.IsPlayerClass() /*&& !ent._socket*/ && ent._ai_enabled <= 0 )
				{
					// Do not save players? I don't know, up to Eric - Booraz149
					return false;
				}
				if ( ent === this )
				return false; // Don't save preset editor to it's snapshot
				//else
				//if ( ent.is_static || ent._is_bg_entity !== 0 || ent._is_being_removed || ( ent.hea || ent._hea ) === undefined )
				/*if ( typeof ent.sx === 'undefined' || typeof ent.sy === 'undefined' || ent._is_bg_entity !== 0 || ent._is_being_removed || ( ent.hea || ent._hea ) === undefined ) // This will prevent tasks and status effects, but these will be caught later
				{
					return false;
				}*/

				if ( ent._held_by || ent.held_by )
				{
					return IsSaveable( ent._held_by || ent.held_by );
				}
			}
			return true;
		};
		
		for ( let i = 0; i < ents.length; i++ )
		{
			let ent = ents[ i ];
			
			if ( IsSaveable( ent ) )
			{
				ents_final.push( ent );
			}
		}
		
		const Append = ( ent2 )=>
		{
			if ( IsSaveable( ent2 ) ) // Still check if targetable just in case so sdLifeBox won't be teleported for example
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
		
		if ( initiator && highlight_objects )
		{
			for ( let i = 0; i < ents_final.length; i++ )
			{
				let net_ids = [];
				net_ids.push( ents_final[ i ]._net_id );
				
				ents_final[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, observer: initiator });
				
				ents_final[ i ]._steering_wheel_net_id = this._net_id;
			}
		}
		return ents_final;
	}
	
	EraseEntitiesInEditor( initiator = null )
	{
		let ents_array = this.GetEntitiesInside( initiator );
		
		for ( let i = 0; i < ents_array.length; i++ )
		{
			ents_array[ i ].remove();
			ents_array[ i ]._broken = false;
		}
	}
	
	IsFileNameInvalid( preset_name ) // Does security checks
	{
		if ( preset_name === '' ) // Just in case
		return true;
		
		if ( preset_name.indexOf( '.' ) !== -1 )
		return true;
		
		if ( preset_name.indexOf( '/' ) !== -1 )
		return true;
		
		if ( preset_name.indexOf( ':' ) !== -1 )
		return true;
	
		return false;
	}
	
	SaveEntitiesInsidePreset( initiator = null )
	{
		if ( this.IsFileNameInvalid( this.preset_name ) )
		return false;
		
		let ents_array = this.GetEntitiesInside( initiator );
		let snapshots = [];
		let current_frame = globalThis.GetFrame();

		for ( let i = 0; i < ents_array.length; i++ )
		{
			let ignore_entity = false;
			if ( ents_array[ i ].is( sdStatusEffect ) )
			if ( ents_array[ i ].type === sdStatusEffect.TYPE_STEERING_WHEEL_PING )
			ignore_entity = true; // Don't save steering wheel ping effects
		
			//if ( ents_array[ i ].GetClass() == "sdGrass" )
			//ignore_entity = true;
			
			if ( !ignore_entity )
			snapshots.push( ents_array[ i ].GetSnapshot( current_frame, true ) );
		}
	
		const pres = {
			name: this.preset_name,
			tags: this.tags,
			authors: this.authors,
			last_edit_time: sdWorld.time,
			relative_x: this.x,
			relative_y: this.y,
			width: this.w,
			height: this.h,
			snapshots: snapshots
		}; // Create JSON object
		
		const data = JSON.stringify( pres ); // Convert JSON object to string
		
		let save_to_main_preset_folder = false;
		
		if ( initiator )
		{
			let admin_row = sdModeration.GetAdminRow( initiator._socket );

			if ( admin_row && admin_row.access_level === 0 )
			save_to_main_preset_folder = true;
		}
		else
		save_to_main_preset_folder = true;
		
		if ( save_to_main_preset_folder )
		fs.writeFile( globalThis.presets_folder +		'/' + this.preset_name + '.json', data, ( err )=>{ if ( err ) trace( 'Unable to save preset data to file: ' + err ); return false; });
	
	
		if ( sdWorld.server_config.let_non_full_access_level_admins_save_presets )
		fs.writeFile( globalThis.presets_folder_users + '/' + this.preset_name + '.json', data, ( err )=>{ if ( err ) trace( 'Unable to save preset data to file: ' + err ); return false; });
		else
		if ( !save_to_main_preset_folder ) // Don't show error if top-level admin is saving it
		return false;

		
		return true;
		// Maybe I should use sdWorld.time for last_edit_time? - Booraz149
		// Yes, that or Date.now(), because frame time resets with server reboots - EG
		
		//return snapshots;
	}
	IsOutsideWorldBounds()
	{
		let outside_bounds = false;

		if ( this.x < sdWorld.world_bounds.x1 || this.x + this.w > sdWorld.world_bounds.x2 || this.y < sdWorld.world_bounds.y1 || this.y + this.h > sdWorld.world_bounds.y2 )
		outside_bounds = true;

		/*if ( this.x < sdWorld.world_bounds.x1 || this.x > sdWorld.world_bounds.x2 || this.x + this.w < sdWorld.world_bounds.x1 || this.x + this.w > sdWorld.world_bounds.x2 )
		outside_bounds = true;

		if ( this.y < sdWorld.world_bounds.y1 || this.y > sdWorld.world_bounds.y2 || this.y + this.h < sdWorld.world_bounds.y1 || this.y + this.h > sdWorld.world_bounds.y2 ) // Checking all corners just in case
		outside_bounds = true;*/

		return outside_bounds;
	}
	CanLoadPreset( force_load = false ){ // Force load means if it should override BSU protected entities, since loading a preset deletes everything inside the region of loaded preset before the preset spawns objects.
		let ents_to_delete = this.GetEntitiesInside();
			// Don't load even if forced if the region is outside world borders
			let outside_bounds = this.IsOutsideWorldBounds();
			
			if ( outside_bounds )
			return false;
			//
			if ( force_load )
			{
				for ( let i = 0; i < ents_to_delete.length; i++ )
				{
					ents_to_delete[i].remove();
					ents_to_delete[i]._broken = false;
				}
				return true;
			}
			else
			{
				//Check if preset corners are outside BSU ranges )
				let outside_bsus = true;
				{
					// EG: It does look like preset that is larger than a BSU-protected base would override it anyway since all preset corners would be outside of BSU range
					if ( !sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges(this.x, this.y ) ||
					!sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges(this.x + this.w, this.y ) ||
					!sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges(this.x, this.y + this.h ) ||
					!sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges(this.x + this.w, this.y + this.h ) 
					)
						outside_bsus = false;
				}
				if ( outside_bsus === false )
				return false;
			
				let delete_ents = true;
				for ( let i = 0; i < ents_to_delete.length; i++ )
				{
					if ( typeof ents_to_delete[ i ]._shielded !== 'undefined' )
					if ( ents_to_delete[ i ]._shielded ) // If it's not null, then it is protected by a BSU, therefore it can't soft load preset
					delete_ents = false;
				}
				if ( delete_ents )
				return( this.CanLoadPreset( delete_ents ) ); // Delete all entities and return true so it can place preset
			}
	}
	
	static GetPresetData( preset_name )
	{
		try
		{
			let preset_str = fs.readFileSync( globalThis.presets_folder + '/' + preset_name + '.json', 'utf8' ); // Try to load file for parsing
			return JSON.parse( preset_str );
		}	
		catch ( e )
		{
			try
			{
				let preset_str = fs.readFileSync( globalThis.presets_folder_users + '/' + preset_name + '.json', 'utf8' ); // Try to load file for parsing
				return JSON.parse( preset_str );
			}	
			catch ( e )
			{
				console.warn( 'Preset file not found' + e );
				return null;
			}
		}
	}
	static SpawnPresetInWorld( preset_name='test_tower', options={}, then_callback=null ) // This operation might not work instantly but instead perform multiple iterations over longer period of time
	{
		/* Test:	
		
			sdWorld.entity_classes.sdPresetEditor.SpawnPresetInWorld( 'test_tower', { debug:1 }, ( editor )=>
			{
				if ( editor )
				if ( sdWorld.sockets[ 0 ] )
				if ( sdWorld.sockets[ 0 ].character )
				{
					sdWorld.sockets[ 0 ].character.x = editor.x;
					sdWorld.sockets[ 0 ].character.y = editor.y;
				}
			});
		
		*/
		
		const preset_data = sdPresetEditor.GetPresetData( preset_name );
		
		if ( !preset_data )
		{
			if ( sdWorld.is_singleplayer )
			{
				//debugger;
				console.warn( 'Preset was not found in singleplayer mode (are presets even pre-laded there yet?): ' + preset_name );
				return;
			}
		
			throw new Error( 'Preset was not found: ' + preset_name );
		}
		
		sdPresetEditor.active_async_preset_spawn_tasks++;
		
		if ( sdPresetEditor.active_async_preset_spawn_tasks > 10 )
		throw new Error( 'Too many async preset spawn tasks - it may damage performance' );
		
		
		let snapshots = preset_data.snapshots;
		
		let bit_width = Math.ceil( preset_data.width/16 );
		let bit_height = Math.ceil( preset_data.height/16 );
		
		let bitmask = [];
		let bitmask_existing_overlaps = []; // Collects existing overlapped entities here for later
		bitmask.length = preset_data.width/16 * preset_data.height/16;
		bitmask_existing_overlaps.length = preset_data.width/16 * preset_data.height/16;
		for ( let i = 0; i < bitmask.length; i++ )
		{
			bitmask[ i ] = sdPresetEditor.BIT_EMPTY;
			bitmask_existing_overlaps[ i ] = null;
		}
	
	
		// Equalize priorities of both of these groups
		let requires_air = 0;
		let requires_ground = 0;
		
		for ( let i = 0; i < snapshots.length; i++ )
		{
			let s = snapshots[ i ];
			
			let bit = sdPresetEditor.BIT_FILLED;
			
			if ( s._class === 'sdBlock' )
			{
				if ( s.material === sdBlock.MATERIAL_PRESET_SPECIAL_ANY_GROUND )
				{
					bit = sdPresetEditor.BIT_GROUND;
					requires_ground++;
				}
				else
				if ( s.material === sdBlock.MATERIAL_PRESET_SPECIAL_FORCE_AIR )
				{
					bit = sdPresetEditor.BIT_AIR;
					requires_air++;
				}
			}
			
			let class_proto = sdWorld.entity_classes[ s._class ].prototype;
			
			let hitbox_x1 = Object.getOwnPropertyDescriptor( class_proto, 'hitbox_x1' ).get.call( s );
			let hitbox_x2 = Object.getOwnPropertyDescriptor( class_proto, 'hitbox_x2' ).get.call( s );
			let hitbox_y1 = Object.getOwnPropertyDescriptor( class_proto, 'hitbox_y1' ).get.call( s );
			let hitbox_y2 = Object.getOwnPropertyDescriptor( class_proto, 'hitbox_y2' ).get.call( s );
			
			let x = Math.floor( ( s.x - preset_data.relative_x + hitbox_x1 ) / 16 );
			let x2 = Math.floor( ( s.x - preset_data.relative_x + hitbox_x2 ) / 16 );
			let y = Math.floor( ( s.y - preset_data.relative_y + hitbox_y1 ) / 16 );
			let y2 = Math.floor( ( s.y - preset_data.relative_y + hitbox_y2 ) / 16 );
			
			if ( y === y2 )
			y2++;
			
			if ( x === x2 )
			x2++;
			
			for ( let yy = y; yy < y2; yy++ )
			for ( let xx = x; xx < x2; xx++ )
			{
				if ( xx >= bit_width )
				throw new Error();
			
				if ( yy >= bit_height )
				throw new Error();
				
				let hash = yy * bit_width + xx;
				bitmask[ hash ] = Math.max( bitmask[ hash ], bit );
			}
		}
		
		requires_air = Math.max( 1, requires_air );
		requires_ground = Math.max( 1, requires_ground );
		
		let best_new_relative_x = 0;
		let best_new_relative_y = 0;
		let best_score = -Infinity;
		//let best_overlapped_entities = null;
		let best_new_bitmask_existing_overlaps = null;
			
		let safe_bound = 0.0001;
		
		//let overlapped_entities = null;
		let latest_overlap_block = null;
		let latest_overlap_bg = null;
		let current_overlap_set = null;
		let unsuitable_entity_found = false;
		
		const custom_filtering_method = ( e )=>
		{
			let is_bg_entity = e.IsBGEntity();
			if ( is_bg_entity === 0 || is_bg_entity === 1 )
			{
				// Fail if disconnected player ended up under preset area, same for rescue teleports and BSU protected entities, non empty storage crates and vehicles
				if ( e.IsPlayerClass() || 
					 ( e._shielded && !e._shielded._is_being_removed ) || 
					 ( e.is( sdRescueTeleport ) && e.owner_biometry !== -1 ) ||
					 e.IsInSafeArea() ||
					 ( e.is( sdStorage ) && e._stored_items.length > 0 ) ||
					 e.IsVehicle() ||
					 e.is( sdBeacon ) )
				{
					unsuitable_entity_found = true;
					return true;
				}
				
				//overlapped_entities.add( e );
				current_overlap_set.add( e );
				
				/*if ( is_bg_entity === 0 )
				if ( !latest_overlap )
				if ( e.hard_collision )
				latest_overlap = e;*/
	
				if ( is_bg_entity === 0 )
				if ( e.is( sdBlock ) )
				latest_overlap_block = e;
	
				if ( is_bg_entity === 1 )
				if ( e.is( sdBG ) )
				latest_overlap_bg = e;
			}
			
			return false;
		};
		
		let assumed_player_view_range = 800;
		
		const Try = ( new_relative_x, new_relative_y )=>
		{
			let score = 0;
			
			if ( new_relative_x < sdWorld.world_bounds.x1 )
			return;
			
			if ( new_relative_y < sdWorld.world_bounds.y1 )
			return;
			
			if ( new_relative_x > sdWorld.world_bounds.x2 - preset_data.width )
			return;
			
			if ( new_relative_y > sdWorld.world_bounds.y2 - preset_data.height )
			return;
		
			// Keep away from BSUs
			for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
			{
				let bsu = sdBaseShieldingUnit.all_shield_units[ i ];
				
				if ( bsu.enabled )
				{
					if ( new_relative_x + preset_data.width < bsu.x - sdBaseShieldingUnit.protect_distance_stretch ||
						 new_relative_x > bsu.x + sdBaseShieldingUnit.protect_distance_stretch ||
						 new_relative_y + preset_data.height < bsu.y - sdBaseShieldingUnit.protect_distance_stretch ||
						 new_relative_y > bsu.y + sdBaseShieldingUnit.protect_distance_stretch )
					{
					}
					else
					{
						return;
					}
				}
			}
			
			// Keep away from online players
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				let c = sdWorld.sockets[ i ].character;
				
				if ( c )
				{
					if ( new_relative_x + preset_data.width < c.x - assumed_player_view_range ||
						 new_relative_x > c.x + assumed_player_view_range ||
						 new_relative_y + preset_data.height < c.y - assumed_player_view_range ||
						 new_relative_y > c.y + assumed_player_view_range )
					{
					}
					else
					{
						return;
					}
				}
			}
			
			for ( let i = 0; i < sdLongRangeTeleport.long_range_teleports.length; i++ )
			{
				let c = sdLongRangeTeleport.long_range_teleports[ i ];
				
				if ( c )
				{
					if ( !c.is_server_teleport ) // Make sure we check server / red LRTP's only for now.
					{
						return;
					}
				
					if ( new_relative_x + preset_data.width < c.x - assumed_player_view_range ||
						 new_relative_x > c.x + assumed_player_view_range ||
						 new_relative_y + preset_data.height < c.y - assumed_player_view_range ||
						 new_relative_y > c.y + assumed_player_view_range )
					{
					}
					else
					{
						return;
					}
				}
			}
				
			
			// Keep away from deep sleep areas
			if ( sdWorld.CheckSolidDeepSleepExistsAtBox( new_relative_x, new_relative_y, new_relative_x + preset_data.width, new_relative_y + preset_data.height ) )
			{
				return;
			}
				
			
			//overlapped_entities = new Set();
			
			// TODO: Test BSU, RTP, LRTP, nearby players first
			
			let new_bitmask_existing_overlaps = bitmask_existing_overlaps.slice();
			
			//let cells = sdWorld.GetCellsInRect( new_relative_x, new_relative_y, new_relative_x+preset_data.width, new_relative_y+preset_data.height );
			
			both:
			for ( let yy = 0; yy < bit_height; yy++ )
			for ( let xx = 0; xx < bit_width; xx++ )
			{
				let hash = yy * bit_width + xx;
				
				let bit = bitmask[ hash ];
				
				//latest_overlap = null;
				latest_overlap_block = null;
				latest_overlap_bg = null;
				unsuitable_entity_found = false;
				new_bitmask_existing_overlaps[ hash ] = current_overlap_set = new Set();
				// Scan all existing entities there
				sdWorld.CheckWallExistsBox( 
						new_relative_x + xx * 16 + safe_bound, 
						new_relative_y + yy * 16 + safe_bound, 
						new_relative_x + xx * 16 + 16 - safe_bound, 
						new_relative_y + yy * 16 + 16 - safe_bound, null, null, null, custom_filtering_method );
						
				if ( unsuitable_entity_found )
				{
					return;
				}
				
				if ( bit === sdPresetEditor.BIT_EMPTY )
				{
					if ( latest_overlap_block === null && latest_overlap_bg === null )
					score++;
					else
					score--;
				}
				else
				if ( bit === sdPresetEditor.BIT_FILLED )
				{
					if ( latest_overlap_block !== null )
					score--;
					else
					score++;
				}
				else
				if ( bit === sdPresetEditor.BIT_AIR )
				{
					if ( latest_overlap_block === null && latest_overlap_bg === null )
					score += bit_height * bit_width / requires_air;
					else
					score -= bit_height * bit_width / requires_air;
				}
				else
				if ( bit === sdPresetEditor.BIT_GROUND )
				{
					if ( latest_overlap_block !== null && latest_overlap_block.is( sdBlock ) && latest_overlap_block.DoesRegenerate() && latest_overlap_block.width === 16 && latest_overlap_block.height === 16 )
					score += bit_height * bit_width / requires_ground;
					else
					score -= bit_height * bit_width / requires_ground;
				}
			}
			
			if ( score > best_score )
			{
				if ( options.debug )
				trace( 'New preset spawn attempt score: ' + score );
				
				best_score = score;
				best_new_relative_x = new_relative_x;
				best_new_relative_y = new_relative_y;
				//best_overlapped_entities = overlapped_entities;
				best_new_bitmask_existing_overlaps = new_bitmask_existing_overlaps;
			}
		};
		
		let tr = 10000;
		
		const Iteration = ()=>
		{
			let t = Date.now();
			let t2 = t;
		
			//for ( let c = 0; c < 50 && tr > 0 && t2 - t < 5; c++, tr-- )
			for ( ; tr > 0 && t2 - t < 4; tr-- )
			{
				let e = sdEntity.GetRandomEntity();
				
				if ( e )
				{

					let morph_x = Math.random();
					let morph_y = Math.random();

					let new_relative_x = Math.floor( (
														( e.x + e._hitbox_x1 - preset_data.width ) * ( 1 - morph_x ) + ( e.x + e._hitbox_x2 ) * morph_x
											) / 16 ) * 16;

					let new_relative_y = Math.floor( (
														( e.y + e._hitbox_y1 - preset_data.height ) * ( 1 - morph_y ) + ( e.y + e._hitbox_y2 ) * morph_y
											) / 16 ) * 16;

					Try( new_relative_x, new_relative_y );		

					t2 = Date.now();
				
				}
			}

			if ( options.debug )
			trace( 'SpawnPresetInWorld\'s Iteration ('+tr+' left) took', t2-t );

			if ( tr <= 0 ) // Done, just validate score of best option
			{
				sdPresetEditor.active_async_preset_spawn_tasks--;
				
				let editor = null;
				
				if ( best_score > Number.MIN_SAFE_INTEGER ) // Prevent completely failed placements as these will often destroy protected bases or even players
				{
					let old_best_score = best_score;
					
					best_score = -Infinity;
					
					Try( best_new_relative_x, best_new_relative_y );
					
					if ( best_score >= old_best_score )
					{
						editor = new sdPresetEditor({ w:preset_data.width, h:preset_data.height, x:best_new_relative_x, y:best_new_relative_y });
						sdEntity.entities.push( editor );
						editor.LoadPreset( null, preset_name, false, true, false );

						let last_inserted_entities_array = editor._last_inserted_entities_array;
						editor.remove();

						for ( let i = 0; i < last_inserted_entities_array.length; i++ )
						{
							let e = last_inserted_entities_array[ i ];
							if ( e.is( sdBlock ) )
							if ( e.material === sdBlock.MATERIAL_PRESET_SPECIAL_ANY_GROUND || e.material === sdBlock.MATERIAL_PRESET_SPECIAL_FORCE_AIR )
							{
								e.remove();
								e._broken = false;
							}
						}

						for ( let yy = 0; yy < bit_height; yy++ )
						for ( let xx = 0; xx < bit_width; xx++ )
						{
							let hash = yy * bit_width + xx;

							/*if ( true ) // Debugging, the false part is the correct one
							{
								for ( let e of best_new_bitmask_existing_overlaps[ hash ] )
								if ( !e._is_being_removed )
								{
									trace( '/del '+e.GetClass() );
									//e.remove();
									//e._broken = false;

									if ( e.is( sdBlock ) )
									{
										e.material = sdBlock.MATERIAL_TRAPSHIELD;
										e._update_version++;


										if ( sdWorld.sockets[ 0 ] )
										if ( sdWorld.sockets[ 0 ].character )
										{
											sdWorld.sockets[ 0 ].character.x = e.x;
											sdWorld.sockets[ 0 ].character.y = e.y;
										}
									}
								}
							}
							else*/
							{
								let bit = bitmask[ hash ];

								if ( bit === sdPresetEditor.BIT_AIR || bit === sdPresetEditor.BIT_GROUND || bit === sdPresetEditor.BIT_FILLED )
								for ( let e of best_new_bitmask_existing_overlaps[ hash ] )
								if ( !e._is_being_removed )
								{
									e.remove();
									e._broken = false;
								}

								if ( bit === sdPresetEditor.BIT_GROUND )
								{
									sdWorld.AttemptWorldBlockSpawn(
										best_new_relative_x + xx * 16, 
										best_new_relative_y + yy * 16 
									);
								}
							}
						}
						
						/*if ( sdWorld.sockets[ 0 ] )
						if ( sdWorld.sockets[ 0 ].character )
						{
							sdWorld.sockets[ 0 ].character.x = editor.x;
							sdWorld.sockets[ 0 ].character.y = editor.y;
						}*/
					}
					else
					{
						// Failure - best position is no longer relevant...
						console.warn( 'SpawnPresetInWorld Failure - best position is no longer relevant' );
					}
				}
				else
				{
					// Failure - nowhere to place at all
					console.warn( 'SpawnPresetInWorld Failure - nowhere to place at all' );
				}

				if ( then_callback )
				then_callback( editor );
			}
			else
			{
				setTimeout( Iteration, 8 );
			}
		};
		
		Iteration();
	}
	
	LoadPreset( initiator = null, preset_name = '', delete_preset_editor = false, force_load = true, deal_with_entities_inside=true )
	{
		//if ( preset_name === '' )
		//return false;
	
		if ( this.IsFileNameInvalid( preset_name ) )
		return false;
		
		const preset_data = sdPresetEditor.GetPresetData( preset_name );
		//console.log( preset_data.name );

		if ( preset_data === null )
		{
		}
		else
		{
			this.preset_name = preset_data.name;
			this.tags = preset_data.tags;
			this.authors = preset_data.authors;
			this.w = preset_data.width;
			this.h = preset_data.height;
			this._update_version++;

			let snapshots = preset_data.snapshots;

			if ( !deal_with_entities_inside || this.CanLoadPreset( force_load ) )
			this.InsertEntities( snapshots, preset_data.relative_x, preset_data.relative_y );
		}

		// Delete anyway if needed
		if ( delete_preset_editor ) 
		this.remove();
	
		return ( preset_data ) ? true : false;
	}
	
	InsertEntities( snapshots, relative_x, relative_y )
	{
		let one_time_keys = [];
		
		let net_id_remap = new Map();
		
		sdWorld.unresolved_entity_pointers = [];
	
		//if ( snapshots.length > 0 )
		//sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
	
		let new_entities = [];
		this._last_inserted_entities_array = new_entities;
		
		/*const custom_filtering_method = ( e )=>
		{
			if ( e === this )
			return false;
			
			if ( new_entities.indexOf( e ) === -1 )
			return true;
		
			return false;
		};*/
		
		//this._last_overlap_issue_entities = [];
		
						
		for ( let i = 0; i < snapshots.length; i++ )
		{
			let snapshot = snapshots[ i ];
			net_id_remap.set( snapshot._net_id, sdEntity.entity_net_ids );
			snapshot._net_id = sdEntity.entity_net_ids++;
			
			
			snapshot.x = snapshot.x - relative_x + this.x;
			snapshot.y = snapshot.y - relative_y + this.y;
			
			if ( snapshot._class ==='sdDoor' )
			{
				snapshot.x0 = snapshot.x0 - relative_x + this.x;
				snapshot.y0 = snapshot.y0 - relative_y + this.y;
			}
				
			
			let ent = sdEntity.GetObjectFromSnapshot( snapshot );
			
			if ( ent )
			if ( !ent._is_being_removed )
			{
				if ( ent._affected_hash_arrays.length > 0 ) // Easier than checking for hiberstates
				sdWorld.UpdateHashPosition( ent, false, false );
			
				//sdWorld.SendEffect({ x:ent.x + (ent.hitbox_x1+ent.hitbox_x2)/2, y:ent.y + (ent.hitbox_y1+ent.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });
				
				/*if ( ent.IsPlayerClass() )
				{
					ent._respawn_protection = 30 * 10; // 10 seconds of protection once teleported
					ent._god = false;
				}
				
				if ( !ent.CanMoveWithoutOverlap( ent.x, ent.y, 0, custom_filtering_method ) || 
					 !sdWorld.CheckLineOfSight( this.x, this.y, ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2, ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2, null, null, [ 'sdBlock', 'sdDoor' ] ) )
				
				this._last_overlap_issue_entities.push( sdWorld.last_hit_entity );*/
				if ( ent.is( sdBlock ) )
				ent._plants = null; // We reassign the _plants from sdGrass since they have entity pointers
				new_entities.push( ent );
			}
			
			
			
			/*let key = {
				hash: Math.random()+''+Math.random()+''+Math.random()+''+Math.random(),
				ent: ent,
				until: sdWorld.time + 30 * 1000
			};
			
			sdLongRangeTeleport.one_time_keys.push( key );
			
			one_time_keys[ i ] = key.hash;
			*/
			
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
		
		// Grass compatibility
		for ( let i = 0; i < new_entities.length; i++ )
		{
			if ( new_entities[ i ].GetClass() === 'sdBlock' )
			for ( let j = 0; j < new_entities.length; j++ )
			{
				if ( new_entities[ j ].GetClass() === 'sdGrass' )
				if ( new_entities[ j ]._block._net_id === new_entities[ i ]._net_id )
				{
					if ( !new_entities[ i ]._plants )
					new_entities[ i ]._plants = [ new_entities[ j ]._net_id ];
					else
					new_entities[ i ]._plants.push( new_entities[ j ]._net_id );
				}
			}
		}
		
		return one_time_keys;
	}
	
	Draw( ctx, attached )
	{
	}
	DrawFG( ctx, attached )
	{
		let alpha = ( sdWorld.hovered_entity === this ) ? 1 : 0.333;
		
		ctx.globalAlpha = 0.3 * alpha;
		
		ctx.fillStyle = '#ffffff';
		
		if ( this.IsOutsideWorldBounds() )
		ctx.fillStyle = '#ff0000'; // Highlight the region red to let player know it can't load outside world bounds
		//ctx.sd_color_mult_r = this.r / 255;
		//ctx.sd_color_mult_g = this.g / 255;
		//ctx.sd_color_mult_b = this.b / 255;
		
		//ctx.fillRect( 0, 0, this._hitbox_x2, this._hitbox_y2 );
		
		ctx.globalAlpha = 0.6 * alpha;
		ctx.fillRect( 0, 0, 1, this._hitbox_y2 );
		ctx.fillRect( 0, 0, this._hitbox_x2, 1 );
		ctx.fillRect( this._hitbox_x2 - 1, 0, 1, this._hitbox_y2 );
		ctx.fillRect( 0, this._hitbox_y2 - 1, this._hitbox_x2, 1 );
		
		ctx.globalAlpha = 1;
		
		ctx.font = "7px Verdana";
		ctx.textAlign = 'left';

		let t = this.preset_name ? this.preset_name : 'Untitled preset';
		
		if ( sdShop.isDrawing )
		{
			ctx.textAlign = 'center';
			t = 'Preset Editor';
		}

		ctx.fillStyle = '#ffffff';
		ctx.fillText( t, 0, -8 );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		// For hover reaction?
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( exectuter_character._god )
			{
				if ( command_name === 'CHECK' )
				{
					this.GetEntitiesInside( exectuter_character, true );
				}
				if ( command_name === 'ADDTAG' )
				{
					let proper_name = true;
					let potential_name = parameters_array[ 0 ];
					for ( let i = 0; i < potential_name.length; i++ )
					{
						if ( ( potential_name[ i ] >= 'a' && potential_name[ i ] <= 'z' ) || 
						( potential_name[ i ] >= 'A' && potential_name[ i ] <= 'Z' ) ||
						( potential_name[ i ] >= '0' && potential_name[ i ] <= '9' ) ||
						( potential_name[ i ] === '_' || potential_name[ i ] === '-' || potential_name[ i ] === ' ' ) )
						{
							// Ensure only alphanumerical, dash and underscore are proper characters for preset name saving
						}
						else
						proper_name = false;
					}
					if ( !proper_name )
					executer_socket.SDServiceMessage( 'Your tag contains invalid characters. Please use alphabetical, numerical or _ , -' );
					
					
					if ( proper_name )
					{
						let tag_exists = false;
						for( let i = 0; i < this.tags.length; i++ )
						{
							if ( parameters_array[ 0 ] === this.tags[ i ] )
							tag_exists = true;
						}
					
						if ( !tag_exists )
						{
							this.tags.push( parameters_array[0] );
							executer_socket.SDServiceMessage( 'Tag added' );
						}
						else
						executer_socket.SDServiceMessage( 'Tag already exists' );
					}
				}
				if ( command_name === 'REMOVETAG' )
				{
					let remove_tag_index = -1;
					for( let i = 0; i < this.tags.length; i++ )
					{
						if ( parameters_array[ 0 ] === this.tags[ i ] )
						remove_tag_index = i;
					}
					if ( remove_tag_index !== -1 )
					{
						this.tags.splice( remove_tag_index, 1 );
						executer_socket.SDServiceMessage( 'Tag removed' );
					}
					
				}
				if ( command_name === 'ADDAUTHOR' )
				{
					let proper_name = true;
					let potential_name = parameters_array[ 0 ];
					for ( let i = 0; i < potential_name.length; i++ )
					{
						if ( ( potential_name[ i ] >= 'a' && potential_name[ i ] <= 'z' ) || 
						( potential_name[ i ] >= 'A' && potential_name[ i ] <= 'Z' ) ||
						( potential_name[ i ] >= '0' && potential_name[ i ] <= '9' ) ||
						( potential_name[ i ] === '_' || potential_name[ i ] === '-' || potential_name[ i ] === ' ' ) )
						{
							// Ensure only alphanumerical, dash and underscore are proper characters for preset name saving
						}
						else
						proper_name = false;
					}
					if ( !proper_name )
					executer_socket.SDServiceMessage( 'Your author contains invalid characters. Please use alphabetical, numerical or _ , -' );
					
					
					if ( proper_name )
					{
						let author_exists = false;
						for( let i = 0; i < this.authors.length; i++ )
						{
							if ( parameters_array[ 0 ] === this.authors[ i ] )
							author_exists = true;
						}
					
						if ( !author_exists )
						{
							this.authors.push( parameters_array[0] );
							executer_socket.SDServiceMessage( 'Author added' );
						}
						else
						executer_socket.SDServiceMessage( 'Author already exists' );
					}
				}
				if ( command_name === 'REMOVEAUTHOR' )
				{
					let remove_aut_index = -1;
					for( let i = 0; i < this.authors.length; i++ )
					{
						if ( parameters_array[ 0 ] === this.authors[ i ] )
						remove_aut_index = i;
					}
					if ( remove_aut_index !== -1 )
					{
						this.tags.splice( remove_aut_index, 1 );
						executer_socket.SDServiceMessage( 'Author removed' );
					}
					
				}
				if ( command_name === 'SAVE' )
				{
					let proper_name = true;
					let potential_name = parameters_array[ 0 ];
					for ( let i = 0; i < potential_name.length; i++ )
					{
						if ( ( potential_name[ i ] >= 'a' && potential_name[ i ] <= 'z' ) || 
						( potential_name[ i ] >= 'A' && potential_name[ i ] <= 'Z' ) ||
						( potential_name[ i ] >= '0' && potential_name[ i ] <= '9' ) ||
						( potential_name[ i ] === '_' || potential_name[ i ] === '-' ) )
						{
							// Ensure only alphanumerical, dash and underscore are proper characters for preset name saving
						}
						else
						proper_name = false;
					}
					
					if ( proper_name )
					this.preset_name = potential_name;
					else
					executer_socket.SDServiceMessage( 'Your preset name contains invalid characters. Please use alphabetical, numerical or _ , -' );
					if ( proper_name )
					{
						if ( this.preset_name === '' )
						executer_socket.SDServiceMessage( 'Your preset needs a name.' );
						else
						if ( this.SaveEntitiesInsidePreset( exectuter_character ) )
						executer_socket.SDServiceMessage( 'Preset saved successfully!' );
						else
						executer_socket.SDServiceMessage( 'Error! Cannot save preset. Maybe you don\'t have permissions to do so?' );
						//executer_socket.SDServiceMessage( 'Not implemented yet' );
					
						this._update_version++;
					}
				}
				if ( command_name === 'LOAD' )
				{
					if ( parameters_array[ 0 ] !== '' )
					this.LoadPreset( exectuter_character, parameters_array[ 0 ], false, true );
					//executer_socket.SDServiceMessage( 'Not implemented yet' );
				}
				if ( command_name === 'LOAD_DEL' )
				{
					if ( parameters_array[ 0 ] !== '' )
					this.LoadPreset( exectuter_character, parameters_array[ 0 ], true );
					//executer_socket.SDServiceMessage( 'Not implemented yet' );
				}
				if ( command_name === 'SOFT_LOAD' )
				{
					if ( parameters_array[ 0 ] !== '' )
					this.LoadPreset( exectuter_character, parameters_array[ 0 ], false, false );
					//executer_socket.SDServiceMessage( 'Not implemented yet' );
				}
				if ( command_name === 'SOFT_LOAD_DEL' )
				{
					if ( parameters_array[ 0 ] !== '' )
					this.LoadPreset( exectuter_character, parameters_array[ 0 ], true, false );
					//executer_socket.SDServiceMessage( 'Not implemented yet' );
				}
				if ( command_name === 'TIMESCALE' )
				{
					this.time_scale = parseFloat( parameters_array[ 0 ] ) * 1000;
					
					if ( isNaN( this.time_scale ) || this.time_scale < 0 )
					this.time_scale = 0;
				
					if ( this.time_scale > 10 * 1000 )
					this.time_scale = 10 * 1000;
				
					this._update_version++;
				}
				if ( command_name === 'ERASE' )
				{
					this.EraseEntitiesInEditor( exectuter_character );
				}
				if ( command_name === 'CANCEL' )
				{
					this.remove();
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			//if ( exectuter_character._god )
			//if ( this.owner !== exectuter_character )
			//{
			//	this.AddContextOption( 'sudo own', 'OWN', [] );
			//}

			//if ( this.owner )
			//if ( this.owner === exectuter_character )
			if ( exectuter_character._god )
			{
				this.AddContextOption( 'Check saveable content', 'CHECK', [] );
				this.AddPromptContextOption( 'Save preset...', 'SAVE', [ undefined ], 'Enter preset name to save as (will override if exists)', this.preset_name, 300 );
				this.AddPromptContextOption( 'Load preset...', 'LOAD', [ undefined ], 'Enter preset name to load from', this.preset_name, 300 );
				this.AddPromptContextOption( 'Load preset without editor', 'LOAD_DEL', [ undefined ], 'Enter preset name to load from', this.preset_name, 300 );
				this.AddPromptContextOption( 'Soft load preset...', 'SOFT_LOAD', [ undefined ], 'Enter preset name to load from', this.preset_name, 300 );
				this.AddPromptContextOption( 'Soft load preset without editor', 'SOFT_LOAD_DEL', [ undefined ], 'Enter preset name to load from', this.preset_name, 300 );
				
				this.AddPromptContextOption( 'Add tags', 'ADDTAG', [ undefined ], 'Enter tag name', this.tags, 300 );
				this.AddPromptContextOption( 'Remove tags', 'REMOVETAG', [ undefined ], 'Enter tag name', this.tags, 300 );
				
				this.AddPromptContextOption( 'Add author', 'ADDAUTHOR', [ undefined ], 'Enter author name', this.authors, 300 );
				this.AddPromptContextOption( 'Remove author', 'REMOVEAUTHOR', [ undefined ], 'Enter author name', this.authors, 300 );
				
				this.AddPromptContextOption( 'Set timescale', 'TIMESCALE', [ undefined ], 'Enter new timescale', (this.time_scale/1000)+'', 300 );
				
				this.AddContextOption( 'Erase entities in region', 'ERASE', [] );
				
				this.AddContextOption( 'Cancel preset region', 'CANCEL', [] );
			}
		}
	}
}
//sdPresetEditor.init_class();

export default sdPresetEditor;
