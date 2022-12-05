/*

	No longer recursive. sdTurrets will now scan network to find first sdCom




*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';


class sdCom extends sdEntity
{
	static init_class()
	{
		sdCom.img_com = sdWorld.CreateImageFromFile( 'com' );
		sdCom.img_com_darkblue = sdWorld.CreateImageFromFile( 'com_darkblue' ); // Level 2
		sdCom.img_com_purple = sdWorld.CreateImageFromFile( 'com_purple' ); // Level 3
		sdCom.img_com_green = sdWorld.CreateImageFromFile( 'com_green' ); // Level 4
		sdCom.img_com_yellow = sdWorld.CreateImageFromFile( 'com_yellow' ); // Level 5
		sdCom.img_com_pink = sdWorld.CreateImageFromFile( 'com_pink' ); // Level 6
		sdCom.img_com_red = sdWorld.CreateImageFromFile( 'com_red' ); // Level 7
		sdCom.img_com_orange = sdWorld.CreateImageFromFile( 'com_orange' ); // Level 8
		
		sdCom.action_range = 32; // How far character needs to stand in order to manipualte it
		sdCom.action_range_command_centre = 64; // How far character needs to stand in order to manipualte it
		sdCom.vehicle_entrance_radius = 64;
		
		sdCom.retransmit_range = 200; // Messages within this range are retransmitted to other coms
		sdCom.max_subscribers = 32;
		
		//sdCom.com_visibility_ignored_classes = [ 'sdBG', 'sdWater', 'sdCom', 'sdDoor', 'sdTurret', 'sdCharacter', 'sdVirus', 'sdQuickie', 'sdOctopus', 'sdMatterContainer', 'sdTeleport', 'sdCrystal', 'sdLamp', 'sdCube' ];

		sdCom.com_visibility_ignored_classes = [ 'sdBG', 'sdWater', 'sdCom', 'sdDoor', 'sdTurret', 'sdCharacter', 'sdVirus', 'sdQuickie', 'sdOctopus', 'sdTeleport', 'sdCube', 'sdEnemyMech', 'sdBadDog', 'sdShark', 'sdDrone', 'sdBeamProjector', 'sdSandWorm', 'sdAmphid', 'sdAbomination', 'sdAsp', 'sdBiter', 'sdCouncilMachine', 'sdPlayerOverlord' ]; // Used for sdCube pathfinding now...
		sdCom.com_visibility_unignored_classes = [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier', 'sdCommandCentre', 'sdLongRangeTeleport' ]; // Used for early threat logic now. Coms don't really trace raycasts anymore. These arrays are a mess though.

		sdCom.com_creature_attack_unignored_classes = [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ]; // Used by sdVirus so far. Also for rain that spawns grass
		
		sdCom.com_vision_blocking_classes = [ 'sdBlock', 'sdDoor' ];
		
		sdCom.com_visibility_unignored_classes_plus_erthals = sdCom.com_visibility_unignored_classes.slice();
		sdCom.com_visibility_unignored_classes_plus_erthals.push( 'sdSpider', 'sdDrone' ); // All drones, but this should be enough to check if player aims as current entity
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -4; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 7; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Communication node';
	}
	
	//IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	//{ return true; }
	
	// Imaging creating fake com so people inside base connect it to everything. That would be fun
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
		
		this.variation = params.variation || 0;
		this._hmax = ( 100 + ( 50 * this.variation ) ) * 4; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;

		this.subscribers = []; // works with _net_ids but should use biometry now
		
		this._owner = null; // Only used to add creator to subscribers list on spawn
		
		/*if ( sdWorld.is_server )
		{
			this.NotifyAboutNewSubscribers( 2 );
		}*/
		this._matter = 0; // Just so it can transfer matter in cable network
		this._matter_max = 20;
	}
	onBuilt()
	{
		if ( this._owner )
		this.NotifyAboutNewSubscribers( 1, [ this._owner.biometry ] );
		//this.NotifyAboutNewSubscribers( 1, [ this._owner._net_id ] );
	}
	NotifyAboutNewSubscribers( append1_or_remove0_or_inherit_back2, subs, counter_recursive_array=null ) // inherit_back is for new coms
	{
		if ( counter_recursive_array === null )
		counter_recursive_array = [];
	
		if ( counter_recursive_array.indexOf( this ) !== -1 )
		return;
	
		if ( append1_or_remove0_or_inherit_back2 !== 2 )
		{
			counter_recursive_array.push( this );
			for ( var i = 0; i < subs.length; i++ )
			{
				if ( append1_or_remove0_or_inherit_back2 === 1 )
				{
					if ( this.subscribers.indexOf( subs[ i ] ) === -1 )
					{
						if ( this.subscribers.length + 1 > sdCom.max_subscribers )
						{
							//this.remove();
							return;
						}
						this.subscribers.push( subs[ i ] );
						this._update_version++;
					}
				}
				else
				if ( append1_or_remove0_or_inherit_back2 === 0 )
				{
					if ( this.subscribers.indexOf( subs[ i ] ) !== -1 )
					{
						this.subscribers.splice( this.subscribers.indexOf( subs[ i ] ), 1 );
						this._update_version++;
					}
				}
			}
		}
	}
	
	/*onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}*/
	
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return true;
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
		
		//this.DrawConnections( ctx );
	}
	
	onRemove()
	{
		// Just notify everything for sprite updates // Bad approach, something like teleports will still won't update
		/*this.GetComWiredCache( ( ent )=>{
			
			if ( ent._hiberstate === sdEntity.HIBERSTATE_HIBERNATED )
			ent.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
			if ( typeof ent._update_version !== 'undefined' )
			ent._update_version++;
			
			return false;
		});*/
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	Draw( ctx, attached )
	{
		if ( this.variation === 0 )
		ctx.drawImageFilterCache( sdCom.img_com, -16, -16, 32,32 );
		if ( this.variation === 1 )
		ctx.drawImageFilterCache( sdCom.img_com_darkblue, -16, -16, 32,32 );
		if ( this.variation === 2 )
		ctx.drawImageFilterCache( sdCom.img_com_purple, -16, -16, 32,32 );
		if ( this.variation === 3 )
		ctx.drawImageFilterCache( sdCom.img_com_green, -16, -16, 32,32 );
		if ( this.variation === 4 )
		ctx.drawImageFilterCache( sdCom.img_com_yellow, -16, -16, 32,32 );
		if ( this.variation === 5 )
		ctx.drawImageFilterCache( sdCom.img_com_pink, -16, -16, 32,32 );
		if ( this.variation === 6 )
		ctx.drawImageFilterCache( sdCom.img_com_red, -16, -16, 32,32 );
		if ( this.variation === 7 )
		ctx.drawImageFilterCache( sdCom.img_com_orange, -16, -16, 32,32 );
	}
	MeasureMatterCost()
	{
		return 60;
	}
	RequireSpawnAlign()
	{ return false; }
}
//sdCom.init_class();

export default sdCom;