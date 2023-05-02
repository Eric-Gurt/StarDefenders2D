/*

	Cable connection node, does nothing, stores some amount of matter just so it can transfer it

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';


class sdNode extends sdEntity
{
	static init_class()
	{
		sdNode.img_node = sdWorld.CreateImageFromFile( 'cable_node' );
		
		sdNode.TYPE_NODE = 0;
		sdNode.TYPE_SIGNAL_FLIPPER = 1; // Inverts sdButton signals
		sdNode.TYPE_SIGNAL_ONCE = 2; // Stops working after any signal was transmitted once
		sdNode.TYPE_SIGNAL_ONCE_OFF = 3; // Stops working after any signal was transmitted once
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return -3; }
	get hitbox_y2() { return 3; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		if ( this.type === sdNode.TYPE_SIGNAL_FLIPPER )
		return 'Signal flipping cable connection node';
	
		if ( this.type === sdNode.TYPE_SIGNAL_ONCE )
		return 'One-time cable connection node';
	
		if ( this.type === sdNode.TYPE_SIGNAL_ONCE_OFF )
		return 'One-time cable connection node (needs reactivation)';
	
		return 'Cable connection node';
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
			if ( sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;

				this._regen_timeout = 60;
			}

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this.type = params.type || sdNode.TYPE_NODE;
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._hmax = 100 * 4; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;

		this._matter = 0; // Just so it can transfer matter in cable network
		this._matter_max = 20;

		this._liquid = { // Doesn't hold any, just for detection in cable network
			max: 0, 
			amount: 0, 
			type: -1, 
			extra: 0 // Used for essence
		};
	}
	/*onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}*/
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return true;
	}
	LiquidTransferMode() // 0 - balance liquids, 1 - only give liquids, 2 - only take liquids
	{
		return 1;
	}
	IsLiquidTypeAllowed( type )
	{
		if ( type === -1 )
		return true;

		return ( this._liquid.type === -1 || this._liquid.type === type ); // Accepts all liquid types
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.MatterGlow( 0.1, 0, GSPEED ); // 0 radius means only towards cables
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		//if ( this._matter < 0.05 || this._matter >= this._matter_max )
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
		ctx.drawImageFilterCache( sdNode.img_node, 0,this.type * 16,16,16, -8, -8, 16,16 );
	}
	MeasureMatterCost()
	{
		return 10;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
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
			if ( this.type === sdNode.TYPE_SIGNAL_ONCE_OFF || this.type === sdNode.TYPE_SIGNAL_ONCE )
			{
				if ( command_name === 'REACTIVATE' || command_name === 'REACTIVATE_ALL' )
				{
					if ( this.type === sdNode.TYPE_SIGNAL_ONCE_OFF )
					{
						this.type = sdNode.TYPE_SIGNAL_ONCE;
						this._update_version++;
					}
				}
				
				if ( command_name === 'REACTIVATE_ALL' )
				{
					let nodes = this.FindObjectsInACableNetwork( null, sdNode );
					
					for ( let i = 0; i < nodes.length; i++ )
					{
						const node = nodes[ i ];
						
						if ( node.type === sdNode.TYPE_SIGNAL_ONCE_OFF )
						{
							node.type = sdNode.TYPE_SIGNAL_ONCE;
							node._update_version++;
						}
					}
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
		if ( exectuter_character.canSeeForUse( this ) )
		{
			if ( this.type === sdNode.TYPE_SIGNAL_ONCE_OFF || this.type === sdNode.TYPE_SIGNAL_ONCE )
			{
				this.AddContextOption( 'Reactivate', 'REACTIVATE', [] );
				this.AddContextOption( 'Reactivate all connected', 'REACTIVATE_ALL', [] );

				// Unused stuff that I can't do yet

				//this.AddContextOption( 'Register Keycard', 'REGISTER_KEYCARD', [ undefined ] )
			}
		}
	}
}
//sdNode.init_class();

export default sdNode;