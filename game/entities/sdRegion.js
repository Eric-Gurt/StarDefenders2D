/*

	Players can create these to save/load presets, perhaps. Also to program repair drones.

	TODO: This is unfinished. Could be used to make presets which later could be used with more meaning. It works but simply does not do anything as of yet

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';

import sdRenderer from '../client/sdRenderer.js';


class sdRegion extends sdEntity
{
	static init_class()
	{
		sdRegion.PROGRAM_DO_NOTHING = 0;
		
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
		{
			if ( observer_entity === this._owner )
			if ( this._owner.gun_slot === 9 )
			return true;
		
			if ( observer_entity.is( sdCharacter ) )
			if ( observer_entity._god )
			return true;
		}

		return false;
	}
	
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
		
		return true; // true = deny animation recovery
	}
	
	constructor( params )
	{
		super( params );
		
		//this.filter = params.filter || '';
		
		this._x0 = this.x;
		this._y0 = this.y;
		
		this.r = 50;
		this.g = 255;
		this.b = 50;
		
		this.w = params.w || 128;
		this.h = params.h || 128;
		
		this.program = sdRegion.PROGRAM_DO_NOTHING;
		
		this.preset_name = 'my_preset' + this._net_id;
		
		this._expiration = sdWorld.time + 1000 * 60; // Expire in 60 seconds
		
		this._owner = params.owner || null;
		
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED, false );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( sdWorld.time > this._expiration )
			this.remove();
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
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	Draw( ctx, attached )
	{
	}
	DrawFG( ctx, attached )
	{
		let alpha = ( sdWorld.hovered_entity === this ) ? 1 : 0.333;
		
		ctx.globalAlpha = 0.3 * alpha;
		
		ctx.fillStyle = '#ffffff';
		ctx.sd_color_mult_r = this.r / 255;
		ctx.sd_color_mult_g = this.g / 255;
		ctx.sd_color_mult_b = this.b / 255;
		
		ctx.fillRect( 0, 0, this._hitbox_x2, this._hitbox_y2 );
		
		ctx.globalAlpha = 0.6 * alpha;
		ctx.fillRect( 0, 0, 1, this._hitbox_y2 );
		ctx.fillRect( 0, 0, this._hitbox_x2, 1 );
		ctx.fillRect( this._hitbox_x2 - 1, 0, 1, this._hitbox_y2 );
		ctx.fillRect( 0, this._hitbox_y2 - 1, this._hitbox_x2, 1 );
		
		ctx.globalAlpha = 1;
	}
	
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			this._expiration = sdWorld.time + 1000 * 60; // Expire in 60 seconds
		
			if ( command_name === 'OWN' )
			{
				if ( exectuter_character._god )
				{
					this.owner = exectuter_character;
				}
			}
			
			if ( this.owner === exectuter_character )
			{
				if ( command_name === 'SAVE' )
				{
					
				}
				if ( command_name === 'RESTORE' )
				{
					
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
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( exectuter_character._god )
			if ( this.owner !== exectuter_character )
			{
				this.AddContextOption( 'sudo own', 'OWN', [] );
			}

			if ( this.owner )
			if ( this.owner === exectuter_character )
			{
				this.AddPromptContextOption( 'Save entities...', 'SAVE', [ undefined ], 'Enter preset name', this.preset_name, 300 );
				this.AddPromptContextOption( 'Restore entities...', 'RESTORE', [ undefined ], 'Enter preset name', this.preset_name, 300 );
				
				//this.AddContextOption( 'Save entities', 'SAVE', [] );
				this.AddContextOption( 'Cancel selection', 'CANCEL', [] );
				
				/*this.AddContextOption( 'Copy entities', 'COPY', [] );
				this.AddContextOption( 'Cut entities', 'CUT', [] );
				this.AddContextOption( 'Paste entities', 'PASTE', [] );
				this.AddContextOption( 'Delete entities', 'DELETE', [] );
				this.AddContextOption( 'Cancel selection', 'CANCEL', [] );*/
			}
		}
	}
}
//sdRegion.init_class();

export default sdRegion;