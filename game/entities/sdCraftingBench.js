
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';

import sdEffect from './sdEffect.js';

class sdCraftingBench extends sdEntity
{
	static init_class()
	{
		sdCraftingBench.img_merger = sdWorld.CreateImageFromFile( 'sdCraftingBench' ); // by The Commander
		
		sdCraftingBench.access_range = 64;
		
		sdCraftingBench.slots_tot = 8 + 1;
		
		sdCraftingBench.max_matter = 10000;
        
        sdCraftingBench.cube_items_filter = sdWorld.CreateSDFilter();
		sdWorld.ReplaceColorInSDFilter_v2( sdCraftingBench.cube_items_filter, '#00fff6', '#555555' );

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return -24; }
	get hitbox_x2()  { return 24; }
	get hitbox_y1()  { return -24; }
	get hitbox_y2()  { return 24; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
    
    ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{
		return [ 0, 0, -40 ];
	}
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	constructor( params )
	{
		super( params );

		this._hea = 2500;
		this._hmax = 2500;
		
		this.matter = 0;
		this._matter_max = sdCraftingBench.max_matter;
		this._regen_timeout = 0;
		
		for ( var i = 0; i < sdCraftingBench.slots_tot; ++i )
		this[ 'item' + i ] = null;
	}
    GetCrafts() // So multiple variants could exist eventually
    {
        return [
            {
                needed: [ sdGun.CLASS_TOPS_PLASMA_RIFLE, sdGun.CLASS_DRAIN_SNIPER, sdGun.CLASS_CUBE_FUSION_CORE ], 
                options: [ sdGun.CLASS_PHASE_RIFLE ],
                cost: 5000,
                callback: null
            },
            {
                needed: [ sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD ],
                options: [ sdGun.CLASS_RAIL_PISTOL ],
                cost: 500,
                callback: ( gun ) => {
                    gun.sd_filter = sdWorld.CreateSDFilter();
                    gun.sd_filter.s = sdCraftingBench.cube_items_filter.s;
                }
            },
            {
                needed: [ sdGun.CLASS_RAIL_PISTOL, sdGun.CLASS_RAIL_PISTOL, sdGun.CLASS_RAIL_PISTOL ],
                options: [ sdGun.CLASS_RAIL_PISTOL2, sdGun.CLASS_TRIPLE_RAIL, sdGun.CLASS_RAIL_SHOTGUN ],
                cost: 1500,
                callback: ( gun ) => {
                    gun.sd_filter = sdWorld.CreateSDFilter();
                    gun.sd_filter.s = sdCraftingBench.cube_items_filter.s;
                }
            },
            {
                needed: [ sdGun.CLASS_TRIPLE_RAIL, sdGun.CLASS_TRIPLE_RAIL, sdGun.CLASS_TRIPLE_RAIL ],
                options: [ sdGun.CLASS_TRIPLE_RAIL2 ],
                cost: 4500,
                callback: ( gun ) => {
                    gun.sd_filter = sdWorld.CreateSDFilter();
                    gun.sd_filter.s = gun.sd_filter.s = sdCraftingBench.cube_items_filter.s;
                }
            },
            {
                needed: [ sdGun.CLASS_RAIL_SHOTGUN, sdGun.CLASS_RAIL_SHOTGUN, sdGun.CLASS_RAIL_SHOTGUN ],
                options: [ sdGun.CLASS_RAIL_SHOTGUN2 ],
                cost: 4500,
                callback: ( gun ) => {
                    gun.sd_filter = sdWorld.CreateSDFilter();
                    gun.sd_filter.s = gun.sd_filter.s = sdCraftingBench.cube_items_filter.s;
                }
            },
            {
                needed: [ sdGun.CLASS_CUBE_SHARD,  sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD, sdGun.CLASS_CUBE_SHARD ],
                options: [ sdGun.CLASS_CUBE_FUSION_CORE ],
                cost: 7500,
                callback: ( gun ) => {
                    gun.sd_filter = sdWorld.CreateSDFilter();
                    gun.sd_filter.s = gun.sd_filter.s = sdCraftingBench.cube_items_filter.s;
                }
            }
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
        const items = this.GetItems( false );

        if ( !items )
        return false;
        
        const craft = this.GetAnyCraft( items );
        if ( !craft )
        return false;
    
        if ( this.matter - craft.cost < 0 )
        return false;

        const type = craft.options[ index ]
        if ( !type )
        return;

        for ( let i = 0; i < sdCraftingBench.slots_tot; ++i )
        {
            if ( this[ 'item' + i ] )
            {
                const offset = this.GetItemOffset( i );
                sdWorld.SendEffect({ x: this.x + offset.x, y: this.y + offset.y, scale: 3, radius: 3, type: sdEffect.TYPE_LENS_FLARE, color: '#ffffff' });
                sdWorld.SendEffect({ x: this.x + offset.x, y: this.y + offset.y, x2: this.x, y2: this.y, type: sdEffect.TYPE_ALT_RAIL, color: '#ffffff' });
                this[ 'item' + i ].remove();
                this[ 'item' + i ] = null;
            }
        }
        sdWorld.SendEffect({ x: this.x, y: this.y, type: sdEffect.TYPE_LENS_FLARE, scale: 3, radius: 6, color: '#ffffff' });
        sdSound.PlaySound({ name:'gun_psicutter', x:this.x, y:this.y, volume:2, pitch: 1.2 });

        this.matter -= craft.cost;
        this.WakeUpMatterSources();
        const gun = new sdGun({ class: type, x: this.x, y: this.y });
        gun._held_by = this;
        gun.ttl = -1;
        this.item8 = gun; // move to middle

        if ( craft.callback )
        craft.callback( gun );

        sdEntity.entities.push( gun );
        
        return true;
    }
    
    GetAnyCraft( weapons )
    {
        if ( this.item8 )
        return false; // No crafts if theres a result already

        const input = [];

        for ( const weapon of weapons )
        input.push( weapon.class );

        input.sort(); // so they are always on the same order regardless of how they were entered

        for ( const craft of this.GetCrafts() )
        {
            const needed = craft.needed;
            const sorted = needed.slice().sort();

            if ( sorted.length === input.length && sorted.every( ( v, i ) => v === input[ i ] ) )
            return craft;
        }

        return false; // No crafts with given items
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
        if ( slot === 8 ) // result
        return { x: 0, y: 0 };
    
        const PI2 = Math.PI * 2;
        const angle = PI2 * ( slot / ( sdCraftingBench.slots_tot - 1 ) ) - Math.PI / 2;
        const distance = 26;

        return { 
            x: Math.cos( angle ) * distance,
            y: Math.sin( angle ) * distance
        };
	}

	get title()
	{
		return 'Crafting bench';
	}
	get description()
	{
		return `Can be used to craft items and weapons by combining them.`;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, `${ T( this.title ) } ( ${ sdWorld.RoundedThousandsSpaces( this.matter ) } / ${ sdWorld.RoundedThousandsSpaces( this._matter_max ) } )`, 0, -8 );
	}
	DrawBG( ctx, attached )
	{
        if ( sdShop.isDrawing )
        {
            ctx.scale( 0.75, 0.75 );
           // ctx.translate( 0, 12 );
        }

		ctx.drawImageFilterCache( sdCraftingBench.img_merger, 0, 0, 64, 64, -32, -32, 64, 64 );
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

        const craft = this.GetAnyCraft( this.GetItems( false ) );
        if ( craft.options )
        {
            for ( let i = 0; i < craft.options.length; ++i )
            {
                const option = craft.options[ Math.floor( ( sdWorld.time / 3000 ) % craft.options.length ) ];
                const has_matter = this.matter - craft.cost > -0.01; // Hack due to float rounding problems
                const gun = sdGun.classes[ option ];

                ctx.sd_color_mult_r = has_matter ? 0 : 1;
                ctx.sd_color_mult_g = ctx.sd_color_mult_b = has_matter ? 1 : 0;

                ctx.filter = 'brightness(1.5) saturate(0.5)'

                ctx.globalAlpha = Math.sin( ( sdWorld.time % 3000 ) / 3000 * Math.PI );
                
                if ( gun.image )
                ctx.drawImageFilterCache( gun.image, -16, -16, 32, 32 );
            
                if ( gun.image_body )
                ctx.drawImageFilterCache( gun.image_body, -16, -16, 32, 32 );

                if ( gun.image_blade )
                ctx.drawImageFilterCache( gun.image_blade, -16, -16, 32, 32 );

                if ( gun.image_barrel )
                ctx.drawImageFilterCache( gun.image_barrel, -16, -16, 32, 32 );
            
                if ( gun.image_glow )
                ctx.drawImageFilterCache( gun.image_glow, -16, -16, 32, 32 );

                ctx.globalAlpha = 1;

                ctx.sd_color_mult_r = 1;
                ctx.sd_color_mult_g = 1;
                ctx.sd_color_mult_b = 1;

                ctx.filter = 'none';
            }
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
			if ( from_entity._held_by === null && from_entity.held_by === null )
			{
				let free_slot = -1;
				
				for ( var i = 0; i < sdCraftingBench.slots_tot - 1; ++i )
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
	GetItems( include_result=true ) // As simple array
	{
		let arr = [];
        const count = include_result ? sdCraftingBench.slots_tot : sdCraftingBench.slots_tot - 1;

		for ( var i = 0; i < count; ++i )
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
        if ( parameters_array )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdCraftingBench.access_range ) )
			{
                if ( command_name === 'CRAFT' )
                {
                    const success = this.CraftWeapon( parameters_array[ 0 ] );
                    if ( !success )
                    executer_socket.SDServiceMessage( 'Not enough matter' );
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
            const craft = this.GetAnyCraft( this.GetItems( false ) );
            if ( craft.options )
            {
                for ( let i = 0; i < craft.options.length; ++i )
                {
                    const option = craft.options[ i ]
                    this.AddContextOption( `Craft ${ sdGun.classes[ option ].title } (${ sdWorld.RoundedThousandsSpaces( craft.cost ) } matter)`, 'CRAFT', [ i ] );
                }
            }
		}
	}
}
//sdCraftingBench.init_class();

export default sdCraftingBench;
