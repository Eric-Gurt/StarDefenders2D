/*

	Makes repair/attack bots, maybe also lets control them (unless I will move logic programming to sdCom)

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdBot from './sdBot.js';
import sdBotFactory from './sdBotFactory.js';


class sdBotCharger extends sdEntity
{
	static init_class()
	{
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdBotCharger.chargers = [];
	}
	get hitbox_x1() { return -15; }
	get hitbox_x2() { return 14; }
	get hitbox_y1() { return -6; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Bot charger';
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
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
		
		this._hmax = 400; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._matter_max = 300;
		this.matter = 0;
		
		this._charge_target = null;
		
		sdBotCharger.chargers.push( this );
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
	
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdBot ) )
		if ( from_entity.hea > 0 )
		{
			this.TransferMatter( from_entity, this.matter, 1 );
			
			if ( this.matter > 0 )
			{
				let delta = Math.min( ( from_entity.hmax - from_entity.hea ) * sdWorld.damage_to_matter, this.matter );
				
				from_entity.hea += delta / sdWorld.damage_to_matter;
				
				this.matter -= delta;
				
				if ( this.matter < -1 )
				throw new Error();
				
				if ( from_entity.hea > from_entity.hmax + 1 )
				throw new Error();
			}
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + ' ( '+(~~this.matter)+' / '+this._matter_max+' )' );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		let id = sdBotCharger.chargers.indexOf( this );
		if ( id !== -1 )
		sdBotCharger.chargers.splice( id, 1 );
	}
	Draw( ctx, attached )
	{
		//ctx.apply_shading = false;
		
		let frame = 0;
		
		if ( !sdShop.isDrawing )
		if ( this.matter < 1 )
		{
			frame = ( sdWorld.time % 4000 < 2000 ) ? 2 : 1;
		}
		
		ctx.drawImageFilterCache( sdBotFactory.img_bot_stuff, frame * 32,96,32,32, -16,-16,32,32 );
		
		ctx.filter = 'none';
	}
	MeasureMatterCost()
	{
		return 400;
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
			/*if ( command_name === 'SET_TEXT' )
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
			}*/
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			//this.AddPromptContextOption( 'Change text', 'SET_TEXT', [ undefined ], 'Enter caption text', ( sdWorld.client_side_censorship && this.text_censored ) ? sdWorld.CensoredText( this.text ) : this.text, 100 );
		}
	}
}
//sdBotCharger.init_class();

export default sdBotCharger;