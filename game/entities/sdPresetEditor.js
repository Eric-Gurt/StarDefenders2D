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

class sdPresetEditor extends sdEntity
{
	static init_class()
	{
		//sdPresetEditor.PROGRAM_DO_NOTHING = 0;
		
		sdPresetEditor.regions = [];
		
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

	GetEntitiesInside( initiator = null )
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
		
		for ( let i = 0; i < ents_final.length; i++ )
		{
			let net_ids = [];
			net_ids.push( ents_final[ i ]._net_id );
				
			ents_final[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, observer: initiator });
				
			ents_final[ i ]._steering_wheel_net_id = this._net_id;
		}
		return ents_final;
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
					this.GetEntitiesInside( exectuter_character );
				}
				if ( command_name === 'SAVE' )
				{
					//this.GetEntitiesInside( exectuter_character );
					executer_socket.SDServiceMessage( 'Not implemented yet' );
				}
				if ( command_name === 'LOAD' )
				{
					executer_socket.SDServiceMessage( 'Not implemented yet' );
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
				
				this.AddPromptContextOption( 'Set timescale', 'TIMESCALE', [ undefined ], 'Enter new timescale', (this.time_scale/1000)+'', 300 );
				
				this.AddContextOption( 'Cancel preset region', 'CANCEL', [] );
			}
		}
	}
}
//sdPresetEditor.init_class();

export default sdPresetEditor;