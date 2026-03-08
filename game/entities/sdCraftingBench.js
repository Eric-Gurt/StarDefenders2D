
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';

import sdEffect from './sdEffect.js';

class sdCraftingBench extends sdEntity
{
	static init_class()
	{
		sdCraftingBench.img_merger = sdWorld.CreateImageFromFile( 'sdCraftingBench' );
		
		sdCraftingBench.access_range = 64;
		
		sdCraftingBench.slots_tot = 9;
		
		sdCraftingBench.max_matter = 20000; // Matter cost for merging guns
        
        // Positions in array
        sdCraftingBench.WEAPONS_NEEDED = 0;
        sdCraftingBench.CRAFT_RESULT = 1;
        sdCraftingBench.MATTER_COST = 2;

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return -24; }
	get hitbox_x2()  { return 24; }
	get hitbox_y1()  { return 5; }
	get hitbox_y2()  { return 16; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		//this.sx = 0;
		//this.sy = 0;

		this._hea = 1200;
		this._hmax = 1200;
		
		this.matter = 0;
		this._matter_max = sdCraftingBench.max_matter;
		this._regen_timeout = 0;
		
		this.power0 = -1; // Displays power of left slot weapon
		this.power1 = -1; // Displays power of right slot weapon

		//this.upgraded_dur = false; // Apparently I need a public variable for "this.AddContextOption" for durability upgrading so this is the one - Booraz149
		
		this._current_category_stack = [];
		
		//this._held_items = [];
		//this.held_net_ids = [];
		
		for ( var i = 0; i < sdCraftingBench.slots_tot; ++i )
		this[ 'item' + i ] = null;
	}
    GetCrafts() // So multiple variants could exist eventually
    {
        return [
            [ [ sdGun.CLASS_TOPS_PLASMA_RIFLE, sdGun.CLASS_DRAIN_SNIPER, sdGun.CLASS_ETERNAL_SHARD ], [ sdGun.CLASS_PHASE_RIFLE ] ],
            // Tests
            [ [ sdGun.CLASS_RIFLE, sdGun.CLASS_RIFLE ], [ sdGun.CLASS_SHOTGUN, sdGun.CLASS_RAILGUN ] ],
            [ [ sdGun.CLASS_SNIPER, sdGun.CLASS_PISTOL ], [ sdGun.CLASS_SPARK ] ],
            [ [ sdGun.CLASS_CUBE_SHARD,  sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD, ], [ sdGun.CLASS_TRIPLE_RAIL ] ],
        ]
    }
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		this._regen_timeout = 60;
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	
	onMatterChanged( by=null ) // Update version so it is consistent
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
    CraftWeapon( index )
    {
        const items = this.GetItems();

        if ( !items )
        return;

        if ( this.matter !== this._matter_max )
		return; // Just in case
        
        const crafts = this.GetAnyCraft( items );
        if ( !crafts )
        return;

        const type = crafts[ index ];
        if ( !type )
        return;

        for ( const item of items )
        item.remove();

        for ( let i = 0; i < sdCraftingBench.slot_tot; ++i )
        this[ 'item' + i ] = null;

        this.matter = 0;

        const gun = new sdGun({ class: type, x: this.x, y: this.y });
        gun._held_by = this;
        gun.ttl = -1;
        this.item0 = gun; // move to middle
        sdEntity.entities.push( gun );
        
        sdWorld.SendEffect({ x:this.x - 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT });
        sdWorld.SendEffect({ x:this.x, y:this.y - 1, type:sdEffect.TYPE_TELEPORT });
        sdWorld.SendEffect({ x:this.x + 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT });
    }
    
    GetAnyCraft( weapons )
    {
        const input = [];

        for ( const weapon of weapons )
        input.push( weapon.class );
        input.sort();

        for ( const [ needed, result ] of this.GetCrafts() )
        {
            const sorted = needed.slice().sort()

            if ( sorted.length === input.length && sorted.every( ( v, i ) => v === input[ i ] ) )
            return result;
        }

        return false;
    }
        
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
			}
		}
		for ( let i = 0; i < sdCraftingBench.slots_tot; ++i )
		{
			let item = this[ 'item' + i ];
			if ( item )
			item.UpdateHeldPosition();
		}
		
		if ( this._hea >= this._hmax )
		{
            this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}
    GetItemOffset ( slot ) // Cleaner way
	{
        const rows = 3;

        const space_x = 16;
        const space_y = 16;

        const offset_x = -16
        const offset_y = -20
        return { 
            x: offset_x + ( slot % rows ) * space_x,
            y: offset_y + Math.floor( slot / rows ) * space_y
        };
	}

	get title()
	{
		return 'Crafting bench';
	}
	get description()
	{
		return `Can be used to craft items and weapons.`;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T( this.title ) );
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdCraftingBench.img_merger, 0, 0, 64,64, - 32, - 32, 64, 64 );
		for ( let i = 0; i < sdCraftingBench.slots_tot; ++i )
        {
            const item = this[ 'item' + i ];
            if ( !item )
            continue;
            ctx.save();
            const offsets = this.GetItemOffset( i );
            ctx.translate( offsets.x, offsets.y );
            item.Draw( ctx, true );
            ctx.restore();
        }
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
            for ( var i = 0; i < sdCraftingBench.slots_tot; ++i )
            {
                const item = this[ 'item' + i ];
                if ( item )
                {
                    this.DropSlot( i );

                    const offsets = this.GetItemOffset ( i );
                    item.x = offsets.x + this.x;
                    item.y = offsets.y + this.y;
                }
            }

			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
		else
		{
			for ( var i = 0; i < sdCraftingBench.slots_tot; ++i )
			if ( this[ 'item' + i ] )
			this[ 'item' + i ].remove();
		}
	}
	MeasureMatterCost()
	{
		return 1600;
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( from_entity.is( sdGun ) )
		{
			if ( from_entity._held_by === null )
			{
				let free_slot = -1;
				
				for ( var i = 0; i < sdCraftingBench.slots_tot; ++i )
				{
					if ( this[ 'item' + i ] )
					{
						if ( this[ 'item' + i ] === from_entity )
						return;
					}
					else
					if ( free_slot === -1 )
					free_slot = i;
				}

				if ( free_slot !== -1 )
				{
					this[ 'item' + free_slot ] = from_entity;

					from_entity.ttl = -1;
					from_entity._held_by = this;
					
					from_entity.tilt = 0;
					
					from_entity.sx = 0;
					from_entity.sy = 0;
					
					if ( from_entity._dangerous )
					{
						from_entity._dangerous = false;
						from_entity._dangerous_from = null;
					}
					sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
					
					this._update_version++;
				}
			}
		}
	}
	GetItems() // As simple array
	{
		let arr = [];
		for ( var i = 0; i < sdCraftingBench.slots_tot; ++i )
		if ( this[ 'item' + i ] )
		arr.push( this[ 'item' + i ] );
		return arr;
	}
    getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
        return [ this, ...this.GetItems() ];
	}
	DropSpecificWeapon( ent ) // sdGun keepers need this method for case of sdGun removal
	{
		this.ExtractItem( ent._net_id, null, sdWorld.is_server ); // Only throw for server's case. Clients will have guns locally disappearing when players move away from sdCraftingBench
	}
	ExtractItem( item_net_id, initiator_character=null, throw_on_not_found=false )
	{
		let slot = -1;
		for ( var i = 0; i < sdCraftingBench.slots_tot; ++i )
		if ( this[ 'item' + i ] )
		if ( this[ 'item' + i ]._net_id === item_net_id )
		{
			slot = i;
			break;
		}
		
		if ( slot === -1 )
		{
			if ( initiator_character )
			if ( initiator_character._socket )
			initiator_character._socket.SDServiceMessage( 'Item is already taken' );
	
			if ( throw_on_not_found )
			throw new Error( 'Should not happen' );
		}
		else
		{
			let item = this[ 'item' + slot ];
			
			this.DropSlot( slot );
			if ( initiator_character )
			{
				item.x = initiator_character.x;
				item.y = initiator_character.y;
			}
		}
	}
	DropSlot( slot )
	{
		let item = this[ 'item' + slot ];
		
		if ( item )
		{
			this[ 'item' + slot ] = null;
			
			item.ttl = sdGun.disowned_guns_ttl;
			item._held_by = null;
			item.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			item.PhysWakeUp();
		}

		//this.upgraded_dur = false;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdCraftingBench.access_range ) )
			{
                if ( command_name === 'CRAFT' )
                {
                    this.CraftWeapon( parameters_array[ 0 ] );
                }
                if ( command_name === 'GET' )
                {
                    let slot = parameters_array[ 0 ];
					
                    if ( this[ 'item' + slot ] )
                    {
                        this.ExtractItem( this[ 'item' + slot ]._net_id, exectuter_character );
                    }

                    this._update_version++;
                }
            }
            else
            executer_socket.SDServiceMessage( 'Not enough matter' );

            this._update_version++;
        }
        else
        {
            executer_socket.SDServiceMessage( 'Too far' );
        }
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdCraftingBench.access_range ) )
		{
			for ( let i = 0; i < sdCraftingBench.slots_tot; ++i )
			{
				const item = this[ 'item' + i ]
				if ( item )
                this.AddContextOption( 'Get ' + sdEntity.GuessEntityName( item._net_id ), 'GET', [ i ] );
			}
            const crafts = this.GetAnyCraft( this.GetItems() );
            for ( let i = 0; i < crafts.length; ++i )
            {
                const craft = crafts[ i ];
                this.AddContextOption( `Craft ${ sdGun.classes[ craft ].title }`, 'CRAFT', [ i ] );
            }
		}
	}
}
//sdCraftingBench.init_class();

export default sdCraftingBench;
