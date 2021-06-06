
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';

class sdStorage extends sdEntity
{
	static init_class()
	{
		sdStorage.img_storage = sdWorld.CreateImageFromFile( 'storage2' );
		
		sdStorage.access_range = 64; // Used by sdMatterAmplifier as well
		sdStorage.slots_tot = 6;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 6; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hea = 100;
		this._hmax = 100;
		
		this._regen_timeout = 0;
		
		//this._held_items = [];
		//this.held_net_ids = [];
		
		for ( var i = 0; i < sdStorage.slots_tot; i++ )
		this[ 'item' + i ] = null;
	
		this._allow_pickup = false;
		
		this.filter = params.filter || 'saturate(0)';
	}
	onBuilt()
	{
		this._allow_pickup = true;
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		this._regen_timeout = 60;
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	
	get mass() { return 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
		
		if ( isNaN( this.sx ) )
		throw new Error('sdStorage got x impulse '+x+' which caused NaN at stStorage.prototype.sx' );
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
		
		for ( var i = 0; i < sdStorage.slots_tot; i++ )
		if ( this[ 'item' + i ] )
		this[ 'item' + i ].UpdateHeldPosition();
		
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this._phys_sleep <= 0 && this._hea >= this._hmax )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Storage crate" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.drawImageFilterCache( sdStorage.img_storage, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			for ( var i = 0; i < sdStorage.slots_tot; i++ )
			this.DropSlot( i );

			sdWorld.BasicEntityBreakEffect( this, 5 );
		}
		else
		{
			for ( var i = 0; i < sdStorage.slots_tot; i++ )
			if ( this[ 'item' + i ] )
			this[ 'item' + i ].remove();
		}
	}
	MeasureMatterCost()
	{
		//return 0;
		
		return this._hmax * sdWorld.damage_to_matter;
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( !this._allow_pickup )
		{
			console.warn('Removing outdated sdStorage. Should not happen for newly spawned ones!');
			this.remove();
			return;
			//throw new Error('Should not happen');
		}
	
		if ( from_entity.is( sdGun ) )
		{
			if ( from_entity._held_by === null )
			{
				let free_slot = -1;
				
				for ( var i = 0; i < sdStorage.slots_tot; i++ )
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
					
					if ( from_entity._dangerous )
					{
						from_entity._dangerous = false;
						from_entity._dangerous_from = null;
					}
					
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:5 });
				}
			}
		}
	}
	GetItems() // As simple array
	{
		let arr = [];
		
		for ( var i = 0; i < sdStorage.slots_tot; i++ )
		if ( this[ 'item' + i ] )
		arr.push( this[ 'item' + i ] );
		
		return arr;
	}
	DropSpecificWeapon( ent ) // sdGun keepers need this method for case of sdGun removal
	{
		this.ExtractItem( ent._net_id, null, sdWorld.is_server ); // Only throw for server's case. Clients will have guns locally disappearing when players move away from sdStorage
	}
	ExtractItem( item_net_id, initiator_character=null, throw_on_not_found=false )
	{
		let slot = -1;
		for ( var i = 0; i < sdStorage.slots_tot; i++ )
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
			throw new Error('Should not happen');
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
	}
}
//sdStorage.init_class();

export default sdStorage;