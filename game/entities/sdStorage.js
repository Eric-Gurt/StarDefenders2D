/*

	Stores other entities, depending on type

	TODO: Optimize snapshot data in a way where only string representation of contents item title will be given to players nearby?

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdAsteroid from './sdAsteroid.js';
import sdGun from './sdGun.js';
import sdCrystal from './sdCrystal.js';
import sdJunk from './sdJunk.js';
import sdBarrel from './sdBarrel.js';
import sdFaceCrab from './sdFaceCrab.js';
import sdLost from './sdLost.js';


class sdStorage extends sdEntity
{
	static init_class()
	{
		sdStorage.img_storage = sdWorld.CreateImageFromFile( 'storage_sheet' );

		sdStorage.access_range = 64;
		//sdStorage.slots_tot = 6;
		
		sdStorage.TYPE_GUNS = 0;
		sdStorage.TYPE_PORTAL = 1;
		sdStorage.TYPE_CRYSTALS = 2;
		sdStorage.TYPE_CARGO = 3;
		sdStorage.TYPE_CRYSTALS_PORTAL = 4;
		
		sdStorage.ignored_ents = [ 'sdLifeBox' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === sdStorage.TYPE_CRYSTALS_PORTAL ? -15 : this.type === sdStorage.TYPE_CARGO ? -13 : this.type === sdStorage.TYPE_CRYSTALS ? -13 : this.type === sdStorage.TYPE_PORTAL ? -4 : -7; }
	get hitbox_x2() { return this.type === sdStorage.TYPE_CRYSTALS_PORTAL ? 15 :  this.type === sdStorage.TYPE_CARGO ? 13 :  this.type === sdStorage.TYPE_CRYSTALS ? 13 :  this.type === sdStorage.TYPE_PORTAL ? 4 : 7; }
	get hitbox_y1() { return this.type === sdStorage.TYPE_CRYSTALS_PORTAL ? -11 :  this.type === sdStorage.TYPE_CARGO ? -11 : this.type === sdStorage.TYPE_CRYSTALS ? -9 :  this.type === sdStorage.TYPE_PORTAL ? -4 : -5; }
	get hitbox_y2() { return this.type === sdStorage.TYPE_CRYSTALS_PORTAL ? 6 :   this.type === sdStorage.TYPE_CARGO ? 13 :  this.type === sdStorage.TYPE_CRYSTALS ? 6 :   this.type === sdStorage.TYPE_PORTAL ? 4 : 6; }
	
	GetSlotsTotal()
	{
		return ( this.type === sdStorage.TYPE_CRYSTALS_PORTAL || this.type === sdStorage.TYPE_PORTAL ) ? 24 : 6;
	}
	
	IsPortal()
	{
		return ( this.type === sdStorage.TYPE_CRYSTALS_PORTAL || this.type === sdStorage.TYPE_PORTAL );
	}
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }

	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Crates are not targetable when stored, same for crystals and guns
	{
		if ( !super.IsTargetable( by_entity, ignore_safe_areas ) )
		return false;
		
		return true;
	}
	
	GetSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null )
	{
		if ( save_as_much_as_possible || observer_entity === null )
		return super.GetSnapshot( current_frame, save_as_much_as_possible, observer_entity );
		
		
		let hide_contents = false;
		
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, observer_entity.x, observer_entity.y, sdStorage.access_range ) )
		{
		}
		else
		{
			current_frame -= 100; // Make it so frame is different for case of obfuscation. Otherwise 1 out of 2 players seeing this entity might get wrong mixed snapshots
			hide_contents = true;
		}
		
		let snapshot = super.GetSnapshot( current_frame, save_as_much_as_possible, observer_entity );
		
		if ( hide_contents )
		{
			snapshot.stored_names = [];
			snapshot.is_armable = [];
		}
		
		return snapshot;
	}
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.type = params.type || 0;
		
		this._hmax = ( this.type === sdStorage.TYPE_CARGO ? 800 : ( this.type === sdStorage.TYPE_CRYSTALS || this.type === sdStorage.TYPE_CRYSTALS_PORTAL ) ? 500 : 300 );
		this._hea = this._hmax;

		this.held_by = null; // Might still remain for cargo ships?
		
		this._regen_timeout = 0;

		this.stored_names = [];
		this.is_armable = [];
		this._stored_items = [];
		
		/*let slots_total = this.GetSlotsTotal();
		
		for ( var i = 0; i < slots_total; i++ )
		this[ 'item' + i ] = null; // This should be removed later since it is not needed beside storage crates rework storing pre-rework items - Booraz149
		*/
		this._allow_pickup = false;
		
		this.awake = 1; // Magic property name
		
		// If these two match - storage is armed with explosive, usually sdJunk but can be sdBarrel too
		//this.armed_pass = Math.floor( Math.random() * 9007199254740991 );
		//this._real_armed_pass = -1;
		this._armed_with = []; // Always 1 item at most. Array is used for easier snapshot saving // Snapshot of entity it is armed with. Usually it is sdJunk but can be sdBarrel too. Can not be overriden
		
		this._owner = params.owner || null;
		//this.owner_net_id = null;
		//this.owner_title = '';
		this.owner_biometry = -1;
		this.disarm_until = 0;
		
		this._open_anim = 0;
		
		this.filter = params.filter || 'saturate(0)';
	}
	onSnapshotApplied() // To override
	{
		while ( this.is_armable.length < this._stored_items.length )
		this.is_armable.push( 0 );
	}
	onBuilt()
	{
		this._allow_pickup = true;
		
		if ( this._owner )
		this.owner_biometry = this._owner.biometry;
	}
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdStorage.ignored_ents;
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		//if ( this.held_by !== null )
		//return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		this._regen_timeout = 60;
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	
	get mass() { return this.type === sdStorage.TYPE_PORTAL ? 10 : 30; }
	Impulse( x, y )
	{
		if ( this.held_by )
		return;
			
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		if ( isNaN( this.sx ) )
		throw new Error('sdStorage got x impulse '+x+' which caused NaN at stStorage.prototype.sx' );
	}
	
	IsVisible( observer_character ) // Can be used to hide storage crates that are held by cargo storage crates
	{
		return true;
		
		return false;
	}
	/*UpdateHeldPosition()
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
	}*/
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
		
		if ( sdWorld.is_server || this.awake )
		{
			if ( !this.held_by )
			{
				this.sy += sdWorld.gravity * GSPEED;
				
				this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			}
		}
		
		// Patch: Old to new storage method (TODO: Remove this code after June 2022)
		/*if ( sdWorld.is_server )
		{
			let slots_total = this.GetSlotsTotal();
			
			for ( var i = 0; i < slots_total; i++ )
			if ( this[ 'item' + i ] )
			{
				if ( typeof this[ 'item' + i ]._held_by !== 'undefined' )
				this[ 'item' + i ]._held_by = null;
			
				if ( typeof this[ 'item' + i ].held_by !== 'undefined' )
				this[ 'item' + i ].held_by = null;
				
				this.onMovementInRange( this[ 'item' + i ] );
				
				this[ 'item' + i ] = null;
			}
		}*/
		// End of patch
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		if ( !this.IsPortal() )
		{
			let old_open = this._open_anim;
			
			if ( sdContextMenu.open && this.stored_names.length > 0 && sdContextMenu.current_target === this && sdWorld.my_entity && sdWorld.inDist2D_Boolean( this.x, this.y, sdWorld.my_entity.x, sdWorld.my_entity.y, sdStorage.access_range ) )
			this._open_anim = Math.min( 1, this._open_anim + GSPEED * 0.35 );
			else
			this._open_anim = Math.max( 0, this._open_anim - GSPEED * 0.1 );
		
			if ( this._open_anim !== old_open )
			{
				if ( old_open === 0 )
				sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:10, _server_allowed:true });
			
				if ( this._open_anim === 0 )
				sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:8, _server_allowed:true });
			}
		}
		
		if ( this._phys_sleep <= 0 && this._hea >= this._hmax )
		{
			if ( sdWorld.is_server )
			this.awake = 0;
		
			if ( sdWorld.is_server || this._open_anim <= 0 )
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
		if ( this.type === sdStorage.TYPE_GUNS )
		return 'Storage crate';

		if ( this.type === sdStorage.TYPE_PORTAL )
		return 'Portal storage device';

		if ( this.type === sdStorage.TYPE_CRYSTALS )
		return 'Crystal storage crate';

		if ( this.type === sdStorage.TYPE_CARGO )
		return 'Cargo storage crate';

		if ( this.type === sdStorage.TYPE_CRYSTALS_PORTAL )
		return 'Crystal storage portal crate';
	}
	get description()
	{
		if ( this.type === sdStorage.TYPE_GUNS )
		return `${ this.title } can be used to store weapons and other held items. Can store 6 items.`;

		if ( this.type === sdStorage.TYPE_PORTAL )
		return `${ this.title } can be used to store weapons and other held items, but in more compact way. Can store 24 items.`;

		if ( this.type === sdStorage.TYPE_CRYSTALS )
		return `${ this.title } can be used to store and safely transport crystals as well as various types of barrels. These can be made trapped using items put into them. Can store 6 items.`;

		if ( this.type === sdStorage.TYPE_CARGO )
		return `${ this.title } can be used to store storage crates that hold guns & items. Can store 6 items.`;
	
		if ( this.type === sdStorage.TYPE_CRYSTALS_PORTAL )
		return `${ this.title } can be used to store and safely transport crystals as well as various types of barrels. These can be made trapped using items put into them. Can store 24 items.`;

	}
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.held_by )
		return [ this.held_by ]; 
	
		return [];
	}
	/*IsCarriable( by_entity ) // In hands
	{
		return !this.is_big;
	}*/
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );

		this.BasicCarryTooltip( ctx, 8 );
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		
		let yy = Math.round( ( 1 - ( Math.cos( this._open_anim * Math.PI ) * 0.5 + 0.5 ) ) * 2 );
		
		if ( this.type === sdStorage.TYPE_PORTAL || this.type === sdStorage.TYPE_CRYSTALS_PORTAL )
		{
			yy = Math.floor( sdWorld.time / 1000 + ( this._net_id || 0 ) ) % 3;
		}

		if ( this.held_by === null || attached )
		{
			ctx.filter = this.filter;
			if ( this.type === sdStorage.TYPE_GUNS )
			xx = 0;

			if ( this.type === sdStorage.TYPE_PORTAL )
			xx = 3;

			if ( this.type === sdStorage.TYPE_CRYSTALS )
			xx = 1;

			if ( this.type === sdStorage.TYPE_CARGO )
			xx = 2;

			if ( this.type === sdStorage.TYPE_CRYSTALS_PORTAL )
			xx = 4;
		
			ctx.drawImageFilterCache( sdStorage.img_storage, xx * 32, yy * 32, 32, 32, - 16, - 16, 32,32 );
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
			
			for ( var i = this._stored_items.length - 1; i >= 0; i-- )
			{
				let ent = this.ExtractItem( i );
				if ( ent )
				{
					// We need to make sure items have restored their collisions before we could try placing them
					ent._hard_collision = ent.hard_collision; // These are cached

					dropped_items.push( ent );
				}
			}
			
			if ( this.type === sdStorage.TYPE_GUNS || this.type === sdStorage.TYPE_PORTAL ) // Weapon storages
			{
				for ( let i = 0; i < dropped_items.length; i++ )
				{
					let ang = Math.random() * Math.PI * 2;
					let power = Math.random() * 2.5;
					dropped_items[ i ].sx = this.sx + Math.sin( ang ) * power;
					dropped_items[ i ].sy = this.sy + Math.cos( ang ) * power - 3;
				}
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
			
			this.ActivateTrap();
		}
		else
		{
		}
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_stored_items' || prop === '_armed_with' );
	}
	MeasureMatterCost()
	{
		if ( this.type === sdStorage.TYPE_GUNS )
		return this._hmax * sdWorld.damage_to_matter;
	
		if ( this.type === sdStorage.TYPE_PORTAL )
		return 900 + this._hmax * sdWorld.damage_to_matter;
	
		if ( this.type === sdStorage.TYPE_CRYSTALS )
		return 80 + this._hmax * sdWorld.damage_to_matter;
	
		if ( this.type === sdStorage.TYPE_CARGO )
		return 160 + this._hmax * sdWorld.damage_to_matter;
	
		if ( this.type === sdStorage.TYPE_CRYSTALS_PORTAL )
		return 980 + this._hmax * sdWorld.damage_to_matter;
	}
						
	static GetTitleForCrystal( from_entity )
	{
		return ( from_entity.title+' ( ' + sdWorld.RoundedThousandsSpaces(from_entity.matter_max) + ' max matter, ' + (~~from_entity.matter_regen) + '% regen rate )' );
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
		
		let is_for_guns = ( this.type === sdStorage.TYPE_GUNS || this.type === sdStorage.TYPE_PORTAL );
		let is_for_crystals = ( this.type === sdStorage.TYPE_CRYSTALS || this.type === sdStorage.TYPE_CRYSTALS_PORTAL );
		
		if ( 
				( 
					is_for_guns
					&& 
					from_entity.is( sdGun ) 
					&& 
					!from_entity._held_by // Guns can still be held by sdCharacter
					&&
					from_entity.class !== sdGun.CLASS_SCORE_SHARD
				) 
		
				|| 
				
				( 
					is_for_crystals && 
					from_entity.is( sdCrystal ) && !from_entity.held_by // sdCrystals would be held by amplifiers and other things
					&& 
					from_entity.type !== sdCrystal.TYPE_CRYSTAL_BIG 
					&& 
					from_entity.type !== sdCrystal.TYPE_CRYSTAL_CRAB_BIG 
				) 

				||

				( 
					is_for_crystals 
					&& 
					from_entity.is( sdJunk )
					&& 
					( 
						from_entity.type === sdJunk.TYPE_ALIEN_BATTERY || 
						from_entity.type === sdJunk.TYPE_LOST_CONTAINER || 
						from_entity.type === sdJunk.TYPE_FREEZE_BARREL ||
						from_entity.type === sdJunk.TYPE_FIRE_BARREL ||
						from_entity.type === sdJunk.TYPE_METAL_CHUNK /* ||
						from_entity.type === sdJunk.TYPE_UNKNOWN_OBJECT */
					)
				) 

				||

				( 
					is_for_crystals 
					&& 
					from_entity.is( sdLost )
					&& 
					( 
						from_entity._copy_of_class === 'sdCrystal'
					)
				) 

				||

				( 
					is_for_crystals 
					&& 
					from_entity.is( sdAsteroid )
					&& 
					( 
						from_entity.type === sdAsteroid.TYPE_MISSILE
					)
				) 

				||

				( 
					( 
						is_for_crystals 
						||
						is_for_guns 
					) 
					&& 
					from_entity.is( sdFaceCrab )
					&&
					from_entity._hea > 0
				) 

				||

				( 
					is_for_crystals
					&& 
					from_entity.is( sdBarrel )
				) 
		
				|| 
				
				( 
					this.type === sdStorage.TYPE_CARGO && 
					from_entity !== this && 
					from_entity.is( sdStorage ) && 
					( from_entity.type === sdStorage.TYPE_GUNS || from_entity.type === sdStorage.TYPE_PORTAL ) 
				) 
			)
		{
			//if ( from_entity._held_by === null )
			if ( !from_entity._is_being_removed )
			{
				let free_slot = -1;
				
				let slots_total = this.GetSlotsTotal();
				
				for ( var i = 0; i < slots_total; i++ )
				{
					//if ( i + 1 > this._stored_items.length )
					if ( i >= this._stored_items.length )
					{
						this._stored_items.push( from_entity.GetSnapshot( GetFrame(), true ) );
						
						//console.log( this._stored_items );
						let name = '?';
						
						let is_armable = 0;
						
						if ( from_entity.is( sdLost ) )
						name = from_entity._title_as_storage_item;
						else
						if ( from_entity.is( sdGun ) )
						name = ( sdEntity.GuessEntityName( from_entity._net_id ) );
						else
						if ( from_entity.is( sdCrystal ) )
						name = sdStorage.GetTitleForCrystal( from_entity );
						else
						if ( from_entity.is( sdJunk ) )
						{
							is_armable = 1;
						
							if ( from_entity.type === sdJunk.TYPE_ALIEN_BATTERY )
							name = ( 'Alien battery' );
							else
							if ( from_entity.type === sdJunk.TYPE_LOST_CONTAINER )
							name = ( 'Lost particle container' );
							else
							if ( from_entity.type === sdJunk.TYPE_FREEZE_BARREL )
							name = ( 'Cryo-substance barrel' );
							else
							if ( from_entity.type === sdJunk.TYPE_FIRE_BARREL )
							name = ( 'Flammable-substance barrel' );
							else
							if ( from_entity.type === sdJunk.TYPE_METAL_CHUNK )
							{
								name = ( 'Metal chunk' );
								is_armable = 0;
							}
							/* else
							if ( from_entity.type === sdJunk.TYPE_UNKNOWN_OBJECT )
							{
								name = ( '???' );
								is_armable = 0;
							} */
					
						}
						else
						if ( from_entity.is( sdBarrel ) )
						{
							is_armable = 1;
							
							name = ( 'Barrel' );
						}
						else
						if ( from_entity.is( sdStorage ) )
						name = ( from_entity.title );
						else
						if ( from_entity.is( sdFaceCrab ) )
						{
							is_armable = 1;
							
							name = 'Face crab';
						}

						if ( from_entity.is( sdAsteroid ) )
						{
							is_armable = 1;

							name = 'Cruise missile';
						}

						
						
						this.stored_names.push( name );
						
						this.is_armable.push( is_armable );
						
						//console.log( this.stored_names );
						from_entity.remove();
						from_entity._broken = false;
						
						if ( this.IsPortal() )
						sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume: 1, pitch: 5 });
						else
						if ( this.type === sdStorage.TYPE_GUNS )
						sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
						else
						if ( this.type === sdStorage.TYPE_CRYSTALS )
						sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
						else
						if ( this.type === sdStorage.TYPE_CARGO )
						sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:3 });

						return;
					}
					else
					if ( free_slot === -1 )
					free_slot = i;
				}
			}
		}
	}
	GetItems() // As simple array
	{
		let arr = [];
		
		let slots_total = this.GetSlotsTotal();
		
		for ( var i = 0; i < slots_total; i++ )
		if ( i < this.stored_names.length )
		arr.push( this.stored_names[ i ] );
		
		return arr;
	}
	DropSpecificWeapon( ent ) // Outdated method for guns. Method is still used by some other entities that can hold items
	{
	}
	ExtractItem( slot, initiator_character=null, use_place_coordinates=false, place_x=0, place_y=0 ) // x and y are used if use_place_coordinates is true
	{
		let ent = null;

		if ( slot >= 0 && slot < this._stored_items.length )
		{
			if ( this._stored_items[ slot ] )
			{
				ent = sdEntity.GetObjectFromSnapshot( this._stored_items[ slot ] );
			}

			if ( this._stored_items[ slot ] !== null && this._stored_items[ slot ] !== undefined ) // Holey array recovery test
			this._stored_items.splice( slot, 1 );
		
			if ( this.is_armable[ slot ] !== null && this.is_armable[ slot ] !== undefined ) // Holey array recovery test
			this.is_armable.splice( slot, 1 );
		
			if ( this.stored_names[ slot ] !== null && this.stored_names[ slot ] !== undefined ) // Holey array recovery test
			this.stored_names.splice( slot, 1 );

			if ( ent )
			{
				if ( !initiator_character )
				{
					ent.x = this.x;
					ent.y = this.y;
					ent.sx = this.sx;
					ent.sy = this.sy;
				}
				if ( initiator_character )
				{
					ent.x = initiator_character.x;
					ent.y = initiator_character.y;
					ent.sx = initiator_character.sx;
					ent.sy = initiator_character.sy;
				}

				if ( typeof ent.held_by !== 'undefined' )
				ent.held_by = null;

				if ( typeof ent._held_by !== 'undefined' ) // For sdGun? - Booraz149
				ent._held_by = null;
			}
			else
			{
				console.warn( 'Entity snapshot does not exist in storage: ', slot, this.is_armable, this.stored_names, this._stored_items );

				if ( initiator_character )
				if ( initiator_character._socket )
				initiator_character._socket.SDServiceMessage( 'Storage slot mismatch or holey array - extracted item ID does not exist' );
			}
		}

		//let item = this.ExtractEntityFromSnapshotAtSlot( slot, initiator_character );
		let returned_ent = ent;

		if ( ent )
		{
		}
		else
		{
			if ( initiator_character )
			if ( initiator_character._socket )
			initiator_character._socket.SDServiceMessage( 'Item is already taken' );

			return null;
		}
		
		if ( ent.is( sdGun ) )
		ent.ttl = sdGun.disowned_guns_ttl; // Reset despawn timer for guns

		if ( initiator_character )
		{
			if ( this.type === sdStorage.TYPE_GUNS || this.type === sdStorage.TYPE_PORTAL ) // For this one I don't know if it's needed but it is for the other two
			{
				ent.x = initiator_character.x;
				ent.y = initiator_character.y;
			}
			else
			{
				let x0 = initiator_character.x + ( initiator_character._side * 18 );
				let y0 = initiator_character.y - 4;

				let off = initiator_character.GetBulletSpawnOffset();

				let placed = false;

				both:
				for ( let di = 0; di < 32; di += 2 )
				for ( let a = 0; a < 16; a++ )
				{
					let an = a / 16 * Math.PI * 2;

					let xx = x0 + Math.sin( an ) * di;
					let yy = y0 + Math.cos( an ) * di;// * 0.75; // Less priority for height just so it would rather drop on the other side of a player

					if ( xx + ent._hitbox_x2 < this.x + this._hitbox_x1 || xx + ent._hitbox_x1 > this.x + this._hitbox_x2 || yy + ent._hitbox_y1 > this.y + this._hitbox_y2 || yy + ent._hitbox_y2 < this.y + this._hitbox_y1 - ( this._hitbox_y2 - this._hitbox_y1 ) ) // Place on left, on right, right under and on top but with gap equal to the height of this storage
					if ( ent.CanMoveWithoutOverlap( xx, yy, 0 ) )
					if ( sdWorld.CheckLineOfSight( initiator_character.x + off.x, initiator_character.y + off.y, xx, yy, null, null, null, sdWorld.FilterOnlyVisionBlocking ) ) // Make sure item can be seen by player
					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, null, null, null, sdWorld.FilterOnlyVisionBlocking ) ) // And by storage
					{
						placed = true;
						ent.x = xx;
						ent.y = yy;
						break both;
					}

					if ( di === 0 )
					break; // Skip zero offset with different angles
				}

				if ( !placed )
				{
					initiator_character._socket.SDServiceMessage( 'Not enough space to extract item' );
					ent.x = this.x; // Put it back in crate to prevent glitching
					ent.y = this.y;
					returned_ent = null;
				}
			}
		}
		else
		{
			if ( use_place_coordinates )
			{
				if ( ent.CanMoveWithoutOverlap( place_x, place_y, 0 ) )
				{
					ent.x = place_x;
					ent.y = place_y;
				}
				else
				{
					ent.x = this.x; // Put it back in crate to prevent glitching
					ent.y = this.y;
					returned_ent = null;
				}
			}
		}

		ent.PhysWakeUp();

		return returned_ent;

	}
	
	ActivateTrap( at=null, disarm_mode=false )
	{
		// Fix for testing bug, can be removed later
		if ( this._armed_with instanceof Array )
		{
		}
		else
		this._armed_with = [];
		
		if ( this._armed_with.length > 0 )
		{
			if ( !at )
			at = this;
			
			let ent = sdEntity.GetObjectFromSnapshot( this._armed_with[ 0 ] );

			ent.x = at.x;
			ent.y = at.y;
			ent.sx = 0;
			ent.sy = 0;

			if ( disarm_mode )
			{
			}
			else
			{
				if ( typeof ent._storage_trap_mode_for !== 'undefined' )
				ent._storage_trap_mode_for = at;

				if ( ent.is( sdFaceCrab ) )
				{
					ent.attached_to = null;
				}
				else
				ent.DamageWithEffect( ent.hea || ent._hea || 0 );
			}

			this._armed_with.length = 0;
		}
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdStorage.access_range ) )
		{
			if ( exectuter_character.canSeeForUse( this ) )
			{
				if ( this._armed_with.length > 0 )
				{
					if ( exectuter_character.biometry === this.owner_biometry )
					{
						if ( command_name === 'DISARM' )
						{
							let slots_total = this.GetSlotsTotal();
							
							// Extract last entity if full
							if ( this._stored_items.length === slots_total )
							{
								let ent = this.ExtractItem( slots_total - 1, exectuter_character );
								
								if ( !ent )
								{
									executer_socket.SDServiceMessage( 'No space to extract last item. Disarm failed' );
									return;
								}
							}
					
							this.ActivateTrap( null, true );
							executer_socket.SDServiceMessage( 'Disarmed' );
						}
						else
						{
							executer_socket.SDServiceMessage( 'Storage has not been disarmed' );
							this.disarm_until = sdWorld.time + 5000;
						}
						
						return;
					}
					else
					{
						this.ActivateTrap( exectuter_character );
						executer_socket.SDServiceMessage( 'Storage had a trap' );
						return;
					}
				}

				if ( command_name === 'STORAGE_GET' )
				{
					let slot = parameters_array[ 0 ];

					this.ExtractItem( slot, exectuter_character );
				}
				else
				if ( command_name === 'STORAGE_TRAP' )
				{
					let slot = parameters_array[ 0 ];

					if ( slot >= 0 && slot < this._stored_items.length && this.is_armable[ slot ] )
					{
						this._armed_with[ 0 ] = this._stored_items[ slot ];

						this._stored_items.splice( slot, 1 );
						this.is_armable.splice( slot, 1 );
						this.stored_names.splice( slot, 1 );
						
						sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
						
						executer_socket.SDServiceMessage( 'Storage is trapped now. Anyone but you will trigger the trap' );
						//this.disarm_until = sdWorld.time + 5000;
					}
					else
					executer_socket.SDServiceMessage( 'Item can not be found' );
				}

			}
			else
			executer_socket.SDServiceMessage( 'Can\'t access storage through walls' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdStorage.access_range ) )
		{
			//if ( this.held_by === null )
			{
				let items = this.GetItems();

				for ( let i = 0; i < items.length; i++ )
				{
					let item = items[ i ]; // Name of the item
					
					this.AddContextOption( 'Get ' + item, 'STORAGE_GET', [ i ] );
				}
				for ( let i = 0; i < items.length; i++ )
				{
					let item = items[ i ]; // Name of the item
					
					if ( this.is_armable[ i ] )
					this.AddContextOption( 'Use ' + item + ' as access trap', 'STORAGE_TRAP', [ i ], true, { color: '#ff0000' } );
				}
				
				if ( sdWorld.time < this.disarm_until )
				if ( exectuter_character.biometry === this.owner_biometry )
				{
					this.AddContextOption( 'Disarm', 'DISARM', [ ], true, { color: '#ffff00' } );
				}
			}
		}
	}
}
//sdStorage.init_class();

export default sdStorage;
