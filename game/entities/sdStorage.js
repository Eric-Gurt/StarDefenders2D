/*

	Stores other entities, depending on type

	TODO: Cargo storages? Would maybe need a code check if crashes happen.

	TODO: Optimize snapshot data in a way where only string representation of contents item title will be given to players nearby?

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdCrystal from './sdCrystal.js';

class sdStorage extends sdEntity
{
	static init_class()
	{
		sdStorage.img_storage = sdWorld.CreateImageFromFile( 'storage2' );
		sdStorage.img_storage2 = sdWorld.CreateImageFromFile( 'portal_storage' );
		sdStorage.img_storage3 = sdWorld.CreateImageFromFile( 'storage3' ); // Sprite by LazyRain
		sdStorage.img_storage4 = sdWorld.CreateImageFromFile( 'storage4' );
		
		sdStorage.access_range = 64; // Used by sdMatterAmplifier as well
		sdStorage.slots_tot = 6;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return this.type === 3 ? -13 : this.type === 2 ? -13 : this.type === 1 ? -4 : -7; }
	get hitbox_x2()  { return this.type === 3 ? 13 : this.type === 2 ? 13 : this.type === 1 ? 4 : 7; }
	get hitbox_y1()  { return this.type === 3 ? -11 : this.type === 2 ? -9 : this.type === 1 ? -4 : -5; }
	get hitbox_y2()  { return this.type === 3 ? 13 : this.type === 2 ? 6 : this.type === 1 ? 4 : 6; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.held_by !== null ? false : true; }

	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Crates are not targetable when stored, same for crystals and guns
	{
		return ( this.held_by === null );
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.type = params.type || 0;
		
		this._hea = this.type === 3 ? 600 : this.type === 2 ? 400 : 100;
		this._hmax = this.type === 3 ? 600 : this.type === 2 ? 400 : 100;

		this.held_by = null;
		
		this._regen_timeout = 0;
		
		//this._held_items = [];
		//this.held_net_ids = [];
		
		for ( var i = 0; i < sdStorage.slots_tot; i++ )
		this[ 'item' + i ] = null;
	
		this._allow_pickup = false;
		
		this.awake = 1;
		
		this.filter = params.filter || 'saturate(0)';
	}
	onBuilt()
	{
		this._allow_pickup = true;
	}
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdLifeBox' ];
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.held_by !== null )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		this._regen_timeout = 60;
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	
	get mass() { return this.type === 1 ? 10 : 30; }
	Impulse( x, y )
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
		
		if ( isNaN( this.sx ) )
		throw new Error('sdStorage got x impulse '+x+' which caused NaN at stStorage.prototype.sx' );
	}
	
	IsVisible( observer_character ) // Can be used to hide storage crates that are held by cargo storage crates
	{
		if ( this.held_by === null )
		return true;
		else
		{
			if ( this.held_by.is( sdStorage ) )
			{
				if ( observer_character )
				if ( sdWorld.inDist2D_Boolean( observer_character.x, observer_character.y, this.x, this.y, sdStorage.access_range ) )
				return true;
			}
			/*else
			if ( this.held_by.is( sdCharacter ) )
			{
				// Because in else case B key won't work
				//if ( sdGun.classes[ this.class ].is_build_gun ) Maybe it should always work better if player will know info about all of his guns. Probably that will be later used in interface anyway
				if ( this.held_by === observer_character )
				return true;
		
				if ( !this.held_by.ghosting || this.held_by.IsVisible( observer_character ) )
				if ( !this.held_by.driver_of )
				{
					return ( this.held_by.gun_slot === sdGun.classes[ this.class ].slot );
				}
			}*/
		}
		
		return false;
	}
	UpdateHeldPosition()
	{
		if ( this.held_by ) // Should not happen but just in case
		{
			let old_x = this.x;
			let old_y = this.y;
			
			this.x = this.held_by.x;
			this.y = this.held_by.y;

			if ( typeof this.held_by.sx !== 'undefined' )
			{
				this.sx = this.held_by.sx;
				this.sy = this.held_by.sy;
				
				if ( isNaN( this.sx ) )
				{
					console.log( 'Entity with corrupted velocity: ', this.held_by );
					throw new Error('sdStorage is held by entity with .sx as NaN');
				}
			}

			if ( this.x !== old_x || this.y !== old_y )
			sdWorld.UpdateHashPosition( this, false, false );
		}
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
		/*
		for ( var i = 0; i < sdStorage.slots_tot; i++ )
		if ( this[ 'item' + i ] )
		this[ 'item' + i ].UpdateHeldPosition();
		*/
		// Same but without string operations, it is faster but stould be reverted in case of more/less max items

		if ( this.item0 )
		this.item0.UpdateHeldPosition();
		if ( this.item1 )
		this.item1.UpdateHeldPosition();
		if ( this.item2 )
		this.item2.UpdateHeldPosition();
		if ( this.item3 )
		this.item3.UpdateHeldPosition();
		if ( this.item4 )
		this.item4.UpdateHeldPosition();
		if ( this.item5 )
		this.item5.UpdateHeldPosition();
		
		if ( sdWorld.is_server || this.awake )
		{
			this.sy += sdWorld.gravity * GSPEED;

			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		
		if ( this._phys_sleep <= 0 && this._hea >= this._hmax )
		{
			if ( sdWorld.is_server )
			this.awake = 0;
		
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
		else
		{
			if ( sdWorld.is_server )
			this.awake = 1;
		}
	}
	get title()
	{
		if ( this.type === 0 )
		return 'Storage crate';

		if ( this.type === 1 )
		return 'Portal Storage device';

		if ( this.type === 2 )
		return 'Crystal Storage crate';

		if ( this.type === 3 )
		return 'Cargo Storage crate';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.held_by === null )
		{
			sdEntity.Tooltip( ctx, this.title );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.held_by === null )
		{
			ctx.filter = this.filter;
			if ( this.type === 0 )
			ctx.drawImageFilterCache( sdStorage.img_storage, - 16, - 16, 32,32 );

			if ( this.type === 1 )
			ctx.drawImageFilterCache( sdStorage.img_storage2, - 16, - 16, 32,32 );

			if ( this.type === 2 )
			ctx.drawImageFilterCache( sdStorage.img_storage3, - 16, - 16, 32,32 );

			if ( this.type === 3 )
			ctx.drawImageFilterCache( sdStorage.img_storage4, - 16, - 16, 32,32 );
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		let break_pattern_spin = Math.random() * Math.PI * 2;
		
		if ( this._broken )
		{
			//let save_item = 1; // Only up one for now to prevent crystals stuck in each other
			
			let dropped_items = [];
			
			for ( var i = 0; i < sdStorage.slots_tot; i++ )
			{
				let ent = this.DropSlot( i );
				
				if ( ent )
				{
					// We need to make sure items have restored their collisions before we could try placing them
					ent._hard_collision = ent.hard_collision; // These are cached

					dropped_items.push( ent );
				}
				
				/*if ( ( this.type !== 2 ) || save_item > 0 )
				if ( this.type !== 3 ) // Crates can't save crates since items would get stuck inside last remaining crate which has no space, so players need to build new ones when the large one gets destroyed
				this.DropSlot( i );
				else
				{
					if ( this[ 'item' + i ] )
					this[ 'item' + i ].remove();
				}*/
				//save_item--;
			}
			
			if ( this.type === 0 || this.type === 1 ) // Weapon storages
			{
			}
			else
			for ( let i = 0; i < dropped_items.length; i++ )
			{
				let ent = dropped_items[ i ];
				
				out:
				for ( let r = 0; r < 32; r += 8 )
				for ( let an = 0; an < 16; an++ )
				{
					let ang = an / 16 * Math.PI * 2 + break_pattern_spin;

					let new_x = this.x + Math.sin( ang ) * r;
					let new_y = this.y + Math.cos( ang ) * r;

					if ( ent.CanMoveWithoutOverlap( new_x, new_y, 1 ) )
					{
						ent.x = new_x;
						ent.y = new_y;

						sdWorld.UpdateHashPosition( ent, false ); // Prevent intersection with other ones
						break out;
					}
				}
			}

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
		if ( this.type === 0 )
		return this._hmax * sdWorld.damage_to_matter;
		if ( this.type === 1 )
		return 50 + this._hmax * sdWorld.damage_to_matter;
		if ( this.type === 2 )
		return 80 + this._hmax * sdWorld.damage_to_matter;
		if ( this.type === 3 )
		return 160 + this._hmax * sdWorld.damage_to_matter;
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
		if ( this.type === 0 || this.type === 1 )
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
					if ( this.type === 0 )
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:5 });
					else
					if ( this.type === 1 )
					sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume: 1, pitch: 5 });
				}
			}
		}
		if ( this.type === 2 )
		if ( from_entity.is( sdCrystal ) && from_entity.type !== sdCrystal.TYPE_CRYSTAL_BIG )
		{
			//if ( from_entity._held_by === null )
			if ( from_entity.held_by === null )
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

					//from_entity.should_draw = 0;
					//from_entity._held_by = this;
					from_entity.held_by = this;
					
					if ( this.type === 2 )
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:5 });
				}
			}
		}

		if ( this.type === 3 )
		if ( from_entity !== this )
		if ( from_entity.is( sdStorage ) && ( from_entity.type === 0 || from_entity.type === 1 ) )
		{
			//if ( from_entity._held_by === null )
			if ( from_entity.held_by === null )
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

					//from_entity.should_draw = 0;
					//from_entity._held_by = this;
					from_entity.held_by = this;
					
					if ( this.type === 3 )
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:3 });
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
			if ( this.type === 0 || this.type === 1 )
			if ( initiator_character )
			{
				item.x = initiator_character.x;
				item.y = initiator_character.y;
			}
			if ( this.type === 2 )
			if ( initiator_character )
			{
				if ( item.CanMoveWithoutOverlap( initiator_character.x + ( initiator_character._side * 18 ), initiator_character.y - 4, 0 ) ) // Not ideal, but shouldn't cause a bug since otherwise it just gets put back in the crate I believe - Booraz149
				{
					item.x = initiator_character.x + ( initiator_character._side * 18 );
					item.y = initiator_character.y - 4;
				}
				else
				initiator_character._socket.SDServiceMessage( 'Not enough space to extract item' );
			}
			if ( this.type === 3 )
			if ( initiator_character )
			{
				if ( item.CanMoveWithoutOverlap( initiator_character.x + ( initiator_character._side * 18 ), initiator_character.y - 4, 0 ) ) // Not ideal, but shouldn't cause a bug since otherwise it just gets put back in the crate I believe - Booraz149
				{
					item.x = initiator_character.x + ( initiator_character._side * 18 );
					item.y = initiator_character.y - 4;
				}
				else
				initiator_character._socket.SDServiceMessage( 'Not enough space to extract item' );
			}
		}
	}
	DropSlot( slot )
	{
		let item = this[ 'item' + slot ];
		
		if ( item )
		{
			this[ 'item' + slot ] = null;
			if ( this.type === 0 || this.type === 1 )
			{
				item.ttl = sdGun.disowned_guns_ttl;
				item._held_by = null;
				item.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
				item.PhysWakeUp();
			}
			if ( this.type === 2 ) // Crystals don't have hiberstate
			{
				//item.should_draw = 1;
				//item._held_by = null;
				item.held_by = null;
				//item.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
				item.PhysWakeUp();
			}
			if ( this.type === 3 )
			{
				//item.should_draw = 1;
				//item._held_by = null;
				item.held_by = null;
				item.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
				item.PhysWakeUp();
			}
		}
		
		return item;
	}
}
//sdStorage.init_class();

export default sdStorage;
