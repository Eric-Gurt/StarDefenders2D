/*

	Cable connection node, does nothing, stores some amount of matter just so it can transfer it

*/
/* global sdShop, Set */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCable from './sdCable.js';
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
		sdNode.TYPE_SIGNAL_TURRET_ENABLER = 4; // Makes turret shoot in specified direction
		sdNode.TYPE_SIGNAL_DELAYER = 5;
		sdNode.TYPE_SIGNAL_WIRELESS = 6;
		
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
	
		if ( this.type === sdNode.TYPE_SIGNAL_TURRET_ENABLER )
		return 'Turret-enabling cable connection node';
	
		if ( this.type === sdNode.TYPE_SIGNAL_DELAYER )
		return 'Signal-delaying cable connection node';
	
		if ( this.type === sdNode.TYPE_SIGNAL_WIRELESS )
		return 'Wireless connection node';
	
		return 'Cable connection node';
	}
	get description()
	{
		return 'Cable connection nodes can be used to connect base equipment entities that are located far away from each other. Some types of cable connection nodes can have additional effect when used with buttons & sensors.';
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
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
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
		
		this.variation = params.variation || 0; // In case of sdNode.TYPE_SIGNAL_TURRET_ENABLER it is an angle
		this.delay = params.delay || 500; // For sdNode.TYPE_SIGNAL_DELAYER, can't use variation because variation reflects status for these
		
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
		if ( this.type === sdNode.TYPE_SIGNAL_ONCE || ( this.type === sdNode.TYPE_SIGNAL_DELAYER && this.variation === 1 ) )
		ctx.apply_shading = false;
			
		let xx = 0;
		
		if ( this.type === sdNode.TYPE_SIGNAL_TURRET_ENABLER )
		xx = this.variation * 16;
		
		if ( this.type === sdNode.TYPE_SIGNAL_DELAYER )
		xx = this.variation * 16;
	
		if ( this.type === sdNode.TYPE_SIGNAL_WIRELESS )
		{
			if ( sdShop.isDrawing )
			xx = 16;
			else
			xx = ( ( sdWorld.time + this._net_id * 482 ) % 5000 < 200 ) ? 0: 16;
			
			if ( this.variation === 1 ) ctx.sd_hue_rotation = -90;
			if ( this.variation === 2 ) ctx.sd_hue_rotation = 120;
			if ( this.variation === 3 ) ctx.filter = 'saturate(0)'; 
			if ( this.variation === 4 ) ctx.sd_hue_rotation = 60;
			if ( this.variation === 5 ) ctx.sd_hue_rotation = -60;
		}
		
		ctx.drawImageFilterCache( sdNode.img_node, xx,this.type * 16,16,16, -8, -8, 16,16 );
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
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
			
			if ( this.type === sdNode.TYPE_SIGNAL_TURRET_ENABLER )
			{
				if ( command_name === 'VARIATION' )
				if ( typeof parameters_array[ 0 ] === 'number' )
				if ( !isNaN( parameters_array[ 0 ] ) )
				if ( parameters_array[ 0 ] >= 0 && parameters_array[ 0 ] <= 7 )
				{
					this.variation = ~~( parameters_array[ 0 ] );
					this._update_version++;
				}
			}
			
			if ( this.type === sdNode.TYPE_SIGNAL_DELAYER )
			{
				if ( command_name === 'SET_DELAY' )
				if ( typeof parameters_array[ 0 ] === 'number' )
				if ( !isNaN( parameters_array[ 0 ] ) )
				{
					this.delay = Math.max( 125, Math.min( 64000, ~~( parameters_array[ 0 ] ) ) );
					this._update_version++;
				}
			}
			
			if ( this.type === sdNode.TYPE_SIGNAL_WIRELESS )
			{
				if ( command_name === 'CUT_CABLES_BY_TYPE' )
				{
					let cable_type = parameters_array[ 0 ];
					if ( typeof cable_type === 'number' )
					{
						let set = sdCable.cables_per_entity.get( this );
						if ( set )
						for ( let cable of set )
						if ( cable.t === cable_type )
						cable.remove();
					}
				}
				if ( command_name === 'WIRELESS_COLOR' )
				{
					let v = ~~( parameters_array[ 0 ] );
					
					if ( typeof v === 'number' )
					if ( v >= 0 )
					if ( v < 6 )
					if ( !isNaN( v ) )
					{
						this.variation = v;
						this._update_version++;
						
						let set = sdCable.cables_per_entity.get( this );
						if ( set )
						for ( let cable of set )
						if ( cable.t === sdCable.TYPE_WIRELESS )
						{
							cable.v = this.variation;
							cable._update_version++;
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
			if ( this.type === sdNode.TYPE_SIGNAL_TURRET_ENABLER )
			{
				for ( let i = 0; i < 8; i++ )
				{
					let a = Math.round( i / 8 * 360 );
					
					if ( a > 180 )
					a -= 360;
					
					//this.AddContextOption( 'Set angle to ' + a + ' degrees', 'VARIATION', [ i ] );
					this.AddContextOptionNoTranslation( T('Set angle to ') + a + T(' degrees'), 'VARIATION', [ i ], true, ( this.variation === i ) ? { color:'#00ff00' } : {} );
				}
			}
			if ( this.type === sdNode.TYPE_SIGNAL_DELAYER )
			{
				for ( let a = 125; a <= 64000; a *= 2 )
				this.AddContextOptionNoTranslation( T('Set delay to') + ' ' + a/1000 + ' ' +( ( a === 1000 ) ? T('second') : T('seconds') ), 'SET_DELAY', [ a ], true, ( this.delay === a ) ? { color:'#00ff00' } : {} );
			}
			if ( this.type === sdNode.TYPE_SIGNAL_WIRELESS )
			{
				this.AddContextOption( 'Terminate all connections', 'CUT_CABLES_BY_TYPE', [ sdCable.TYPE_WIRELESS ] );
				this.AddContextOption( 'Show connections as green', 'WIRELESS_COLOR', [ 0 ] );
				this.AddContextOption( 'Show connections as red', 'WIRELESS_COLOR', [ 1 ] );
				this.AddContextOption( 'Show connections as blue', 'WIRELESS_COLOR', [ 2 ] );
				this.AddContextOption( 'Show connections as white', 'WIRELESS_COLOR', [ 3 ] );
				this.AddContextOption( 'Show connections as cyan', 'WIRELESS_COLOR', [ 4 ] );
				this.AddContextOption( 'Show connections as yellow', 'WIRELESS_COLOR', [ 5 ] );
			}
		}
	}
}
//sdNode.init_class();

export default sdNode;