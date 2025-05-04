/*

	Caption with text

*/
/* global sdModeration */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';


class sdCaption extends sdEntity
{
	static init_class()
	{
		sdCaption.img_caption = sdWorld.CreateImageFromFile( 'caption' );
		
		sdCaption.colors = [
			'none', '#bb6666', '#ffeeee',
			'hue-rotate(100deg)', '#82bb66', '#f4ffee',
			'hue-rotate(180deg)', '#66bbbb', '#eeffff',
			'hue-rotate(-140deg)', '#6682bb', '#eef4ff',
			'hue-rotate(-77deg)', '#a366bb', '#faeeff',
			'hue-rotate(-52deg)', '#bb66af', '#ffeefd'
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 4; }
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Caption';
	}
	get description()
	{
		return `You can write arbitrary text on these.`;
	}
	
	//IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	//{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 250; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this.text = '';
		this.text_censored = 0;
		
		this.type = params.type;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		ctx.filter = sdCaption.colors[ this.type * 3 ];
		
		ctx.drawImageFilterCache( sdCaption.img_caption, -16, -16, 32,32 );
		
		ctx.filter = 'none';

		ctx.font = "7px Verdana";
		ctx.textAlign = 'center';
		
		let t = this.text;
		
		if ( sdWorld.client_side_censorship && this.text_censored )
		t = sdWorld.CensoredText( t );

		ctx.fillStyle = sdCaption.colors[ this.type * 3 + 1 ];
		ctx.fillText( t, 0, 3.15 );
		
		ctx.fillStyle = sdCaption.colors[ this.type * 3 + 2 ];
		ctx.fillText( t, 0, 2.5 );
	}
	MeasureMatterCost()
	{
		return 50;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( command_name === 'SET_TEXT' )
			if ( parameters_array.length === 1 )
			if ( typeof parameters_array[ 0 ] === 'string' )
			{
				if ( parameters_array[ 0 ].length < 100 )
				{
					this.text = parameters_array[ 0 ];
					this.text_censored = sdModeration.IsPhraseBad( parameters_array[ 0 ], executer_socket );

					this._update_version++;
					executer_socket.SDServiceMessage( 'Text updated' );
				}
				else
				executer_socket.SDServiceMessage( 'Text appears to be too long' );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			this.AddPromptContextOption( 'Change text', 'SET_TEXT', [ undefined ], 'Enter caption text', ( sdWorld.client_side_censorship && this.text_censored ) ? sdWorld.CensoredText( this.text ) : this.text, 100 );
		}
	}
}
//sdCaption.init_class();

export default sdCaption;
