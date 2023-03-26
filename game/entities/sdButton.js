/*

	TODO:
		Make it open doors that are locked with only keycards or requires adminstrational access from a subscribed player
		Make use of keycard registeration, like ._net_id, could be seperated with sdInventory or sdWhateverItsCalled
		sdCable support on sdButton

*/

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdSound from '../sdSound.js';

import sdRenderer from '../client/sdRenderer.js';

class sdButton extends sdEntity
{
	static init_class()
	{
		sdButton.img_button = sdWorld.CreateImageFromFile( 'sdButton' );

		sdButton.buttons = []; // For global detections

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
		
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -8; }
	get hitbox_y2() { return 8; }

	get hard_collision()
	{ return true; }
		
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }

	get title()
	{
		return 'Button';
	}
		
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
			{
				sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.25, pitch: 1.3 });
				this.remove();
			}
			
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );

		this._hmax = 100;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		this.activated = false;

		sdButton.buttons.push( this );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
		
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		let i = sdButton.buttons.indexOf( this );
		if ( i !== -1 )
		sdButton.buttons.splice( i, 1 );
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if (
				(
					sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 46 )
					&&
					executer_socket.character.canSeeForUse( this )
				)
			)
		{
			{
				if ( command_name === 'PRESS_BUTTON' )
				{
					this.activated = true;
					this._update_version++;

					sdSound.PlaySound({ name:'hover_start', pitch: 2, x:this.x, y:this.y, volume:1 }); // Placeholder sound
				}
	
				if ( command_name === 'UNPRESS_BUTTON' )
				{
					this.activated = false;
					this._update_version++;

					sdSound.PlaySound({ name:'hover_start', pitch: 0.5, x:this.x, y:this.y, volume:1 }); // Placeholder sound
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 46 ) )
		{
			this.AddContextOption( 'Activate Button', 'PRESS_BUTTON', [ undefined ] );
			this.AddContextOption( 'Deactivate Button', 'UNPRESS_BUTTON', [ undefined ] );

			// Unused stuff that I can't do yet

			//this.AddContextOption( 'Register Keycard', 'REGISTER_KEYCARD', [ undefined ] )
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		var activated = this.activated ? 3 : 2;

		ctx.apply_shading = true;
		ctx.drawImageFilterCache( sdButton.img_button, 0,0, 32,32,-16,-16,32,32 ); // TODO: Make the sprite look like a button
		
		ctx.apply_shading = false;
		ctx.drawImageFilterCache( sdButton.img_button, activated * 32,0, 32,32,-16,-16,32,32 );
	}
	
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}

export default sdButton;