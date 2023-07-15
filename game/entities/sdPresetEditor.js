/*

	Players can create these to save/load presets, perhaps.

	TODO: This is unfinished. Could be used to make presets which later could be used with more meaning. It works but simply does not do anything as of yet

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdStatusEffect from './sdStatusEffect.js';

import sdRenderer from '../client/sdRenderer.js';

let fs = null;

class sdPresetEditor extends sdEntity
{
	static init_class()
	{
		//sdPresetEditor.PROGRAM_DO_NOTHING = 0;
		
		sdPresetEditor.regions = [];
		
		fs = globalThis.fs;
		
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
		return true;
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
				//if ( ent.is_static || ent.IsBGEntity() !== 0 || ent._is_being_removed || ( ent.hea || ent._hea ) === undefined )
				/*if ( typeof ent.sx === 'undefined' || typeof ent.sy === 'undefined' || ent.IsBGEntity() !== 0 || ent._is_being_removed || ( ent.hea || ent._hea ) === undefined ) // This will prevent tasks and status effects, but these will be caught later
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
	
	SaveEntitiesInsidePreset( initiator = null )
	{
		if ( this.preset_name === '' ) // Just in case
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
			last_edit_time: current_frame,
			relative_x: this.x,
			relative_y: this.y,
			width: this.w,
			height: this.h,
			snapshots: snapshots
		} // Create JSON object
		
		const data = JSON.stringify( pres ); // Convert JSON object to string
		
		fs.writeFile( globalThis.presets_folder + '/' + this.preset_name + '.json', data, err => {
				if ( err )
				trace( 'Unable to save preset data to file: ' + err );
			return false;
		})
		
		return true;
		//Maybe I should use sdWorld.time for last_edit_time? - Booraz149
		
		//return snapshots;
	}
	
	LoadPreset( initiator = null, preset_name = '', delete_preset = false )
	{
		if ( preset_name === '' )
		return;
	
			try
			{
				//console.log( preset_name );
				let preset_str = fs.readFileSync( globalThis.presets_folder + '/' + preset_name + '.json', 'utf8' ); // Try to load file for parsing
				const loaded_arr = JSON.parse( preset_str );
				//console.log( loaded_arr.name );
				
				this.preset_name = loaded_arr.name;
				this.tags = loaded_arr.tags;
				this.authors = loaded_arr.authors;
				this.w = loaded_arr.width;
				this.h = loaded_arr.height;
				this._update_version++;
				
				let snapshots = loaded_arr.snapshots;
				
				this.InsertEntities( snapshots, loaded_arr.relative_x, loaded_arr.relative_y );
				
				if ( delete_preset ) 
				this.remove();
			}
			catch ( e )
			{
				trace( 'File not found' + e );
			}
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
		
		const custom_filtering_method = ( e )=>
		{
			if ( e === this )
			return false;
			
			if ( new_entities.indexOf( e ) === -1 )
			return true;
		
			return false;
		};
		
		//this._last_overlap_issue_entities = [];
		
						
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
				trace( 'Warning: Pointer is impossible to resolve - entity was not recreated in new world. Pointer will likely be set to null. Pointer: ', sdWorld.unresolved_entity_pointers[ i ] );
				sdWorld.unresolved_entity_pointers[ i ][ 3 ] = -1;
			}
		}
		//sdWorld.unresolved_entity_pointers.push([ this, prop, snapshot[ prop ]._class, snapshot[ prop ]._net_id ]);
		
		
		sdWorld.SolveUnresolvedEntityPointers();
		sdWorld.unresolved_entity_pointers = null;
		
		// Grass compability
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
						executer_socket.SDServiceMessage( 'Error! Cannot save preset.' );
						//executer_socket.SDServiceMessage( 'Not implemented yet' );
					
						this._update_version++;
					}
				}
				if ( command_name === 'LOAD' )
				{
					if ( parameters_array[ 0 ] !== '' )
					this.LoadPreset( exectuter_character, parameters_array[ 0 ] );
					//executer_socket.SDServiceMessage( 'Not implemented yet' );
				}
				if ( command_name === 'LOAD_DEL' )
				{
					if ( parameters_array[ 0 ] !== '' )
					this.LoadPreset( exectuter_character, parameters_array[ 0 ], true );
					//executer_socket.SDServiceMessage( 'Not implemented yet' );
				}
				if ( command_name === 'TIMESCALE' )
				{
					this.time_scale = parseFloat( parameters_array[ 0 ] ) * 1000;
					if ( isNaN( this.time_scale ) )
					this.time_scale = 0;
				
					this._update_version++;
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
				
				this.AddPromptContextOption( 'Add tags', 'ADDTAG', [ undefined ], 'Enter tag name', this.tags, 300 );
				this.AddPromptContextOption( 'Remove tags', 'REMOVETAG', [ undefined ], 'Enter tag name', this.tags, 300 );
				
				this.AddPromptContextOption( 'Add author', 'ADDAUTHOR', [ undefined ], 'Enter author name', this.authors, 300 );
				this.AddPromptContextOption( 'Remove author', 'REMOVEAUTHOR', [ undefined ], 'Enter author name', this.authors, 300 );
				
				this.AddPromptContextOption( 'Set timescale', 'TIMESCALE', [ undefined ], 'Enter new timescale', (this.time_scale/1000)+'', 300 );
				
				this.AddContextOption( 'Cancel preset region', 'CANCEL', [] );
			}
		}
	}
}
//sdPresetEditor.init_class();

export default sdPresetEditor;