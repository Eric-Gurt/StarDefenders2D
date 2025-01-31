
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';

import sdEffect from './sdEffect.js';


class sdWeaponMerger extends sdEntity
{
	static init_class()
	{
		sdWeaponMerger.img_merger = sdWorld.CreateImageFromFile( 'sdWeaponMerger' );
		
		sdWeaponMerger.access_range = 64;
		
		sdWeaponMerger.slots_tot = 3; // 2 for guns and 1 for merger core
		
		sdWeaponMerger.max_matter = 20000; // Matter cost for merging guns
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return -27; }
	get hitbox_x2()  { return 27; }
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
		this._matter_max = sdWeaponMerger.max_matter;
		this._regen_timeout = 0;
		
		this.power0 = -1; // Displays power of left slot weapon
		this.power1 = -1; // Displays power of right slot weapon

		//this.upgraded_dur = false; // Apparently I need a public variable for "this.AddContextOption" for durability upgrading so this is the one - Booraz149
		
		this._current_category_stack = [];
		
		//this._held_items = [];
		//this.held_net_ids = [];
		
		for ( var i = 0; i < sdWeaponMerger.slots_tot; i++ )
		this[ 'item' + i ] = null;
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
	MergeWeapons()
	{
		if ( this.matter !== this._matter_max )
		return; // Just in case
	
		if ( !this.item0 || !this.item1 || !this.item2 ) // If any of the items is somehow missing
		return; // Just in case
		
		if ( this.item0.class === sdGun.CLASS_UNSTABLE_CORE && this.item1.class !== sdGun.CLASS_UNSTABLE_CORE )
		return; // Disable unstable core (left) and gun (right)
		
		if ( this.item1.class === sdGun.CLASS_EXALTED_CORE ) // Exalted core scenario
		{
			if ( !this.item0.extra[ 19 ] || this.item0.extra[ 19 ] === 0 ) // Maybe prevent wasting cores this way?
			{
				this.item2.remove(); // Remove merger core
			
				this.item0.extra[ 19 ] = 1; // Add "has exalted core" stat to the weapon
			
				this.item1.remove(); // Also destroy the item on the right
		
				this.item1 = null; // Needed? Not sure.
		
				this.item2 = this.item0; // Move gun to the middle
		
				this.item0 = null;
		
				this.matter = 0;
				
				sdWorld.SendEffect({ x:this.x - 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
				sdWorld.SendEffect({ x:this.x, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
				sdWorld.SendEffect({ x:this.x + 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
			}
		}
		else
		if ( this.item1.class === sdGun.CLASS_CUBE_FUSION_CORE ) // Cube fusion core
		{
			if ( !this.item0.extra[ 20 ] || this.item0.extra[ 20 ] === 0 ) // Maybe prevent wasting cores this way?
			{
				this.item2.remove(); // Remove merger core
			
				this.item0.extra[ 20 ] = 1; // Add "has cube fusion core" stat to the weapon
			
				this.item1.remove(); // Also destroy the item on the right
		
				this.item1 = null; // Needed? Not sure.
		
				this.item2 = this.item0; // Move gun to the middle
		
				this.item0 = null;
		
				this.matter = 0;
				
				sdWorld.SendEffect({ x:this.x - 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
				sdWorld.SendEffect({ x:this.x, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
				sdWorld.SendEffect({ x:this.x + 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
			}
		}
		else
		{
			this.item2.remove();
			let dps_proportions = this.item1._max_dps / this.item0._max_dps; // Basically DPS of the right item should be measured / divided by one on the left
			dps_proportions *= 0.95; // 95% of max DPS of other gun.
			/* Reason for 95% instead of 100% is simple - something like Velox Minigun reaches max DPS with buildup at the start and after firing a while.
			Giving it 100% of DPS to let's say an SD assault rifle just straight up makes the assault rifle much better because of no buildup at the start nor having to fire a while for max DPS.
			At 95% of power most, if not all will still be viable and on par with a weapon like Velox Minigun.
			Also there was a problem where merged gun power could be transfered onto other without any disadvantage, as long as you had merger cores and matter.
			So yeah, 2 birds with 1 stone - Booraz149
			*/
			
			// Unstable core scenario - multiply based off weapon slots for balance
			let mult = 1;
			if ( this.item1.class === sdGun.CLASS_UNSTABLE_CORE ) // Adjust multiplier/power depending on weapon slot
			{
				if ( sdGun.classes[ this.item0.class ].slot === 3 || sdGun.classes[ this.item0.class ].slot === 4 )
				mult = 0.5;
				if ( sdGun.classes[ this.item0.class ].slot === 1 )
				mult = 0.35;
			
				// Unstable core + unstable core scenario
				// Take stronger core's power and add 15% value of the weaker, capping at 600 power
				if ( this.item0.class === sdGun.CLASS_UNSTABLE_CORE )
				{
					if ( this.item0._max_dps < this.item1._max_dps ) // Less power than the other core?
					{
						let bonus = this.item0._max_dps * 0.2;
						this.item0._max_dps = this.item1._max_dps + bonus; // Max power of other core + 20% of own
					}
					else
					this.item0._max_dps += this.item1._max_dps * 0.2; // Just add 20% of the other core
				
					this.item0._max_dps = Math.min( 600, this.item0._max_dps ); // Cap the power
				}
			}
		
			dps_proportions *= mult;
			
			if ( this.item0.class !== sdGun.CLASS_UNSTABLE_CORE )
			{
				this.item0.extra[ 17 ] *= dps_proportions; // So we can apply the right weapon's DPS to the left one
				this.item0._max_dps *= dps_proportions; // Even out max DPS
			}
			//console.log( sdGun.classes[ this.item1.class ].title + ' power transferred to ' + sdGun.classes[ this.item0.class ].title );
			//console.log( this.item1._max_dps + ' -> ' + this.item0._max_dps );
		
			this.item1.remove(); // Also destroy the item on the right
		
			this.item1 = null; // Needed? Not sure.
		
			this.item2 = this.item0;
		
			this.item0 = null;
		
			this.matter = 0;
			
			sdWorld.SendEffect({ x:this.x - 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
			sdWorld.SendEffect({ x:this.x, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
			sdWorld.SendEffect({ x:this.x + 16, y:this.y - 1, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
		}
		
		this._update_version++;
		
	}
	
	IgnoresSlot( weapon )
	{
		if ( weapon.class === sdGun.CLASS_EXALTED_CORE )
		return true;
	
		if ( weapon.class === sdGun.CLASS_CUBE_FUSION_CORE )
		return true;
	
		if ( weapon.class === sdGun.CLASS_UNSTABLE_CORE )
		return true;
	
	
		return false;
		
	}
	
	IsWeaponCompatible( weapon )// Is weapon allowed to be merged in any way?
	{
		if ( weapon.class === sdGun.CLASS_MERGER_CORE || weapon.class === sdGun.CLASS_EXALTED_CORE || weapon.class === sdGun.CLASS_CUBE_FUSION_CORE || weapon.class === sdGun.CLASS_UNSTABLE_CORE )
		return true;
	
		if ( weapon.GetSlot() === 0 || weapon.GetSlot() === 5 || weapon.GetSlot() === 6 || weapon.GetSlot() === 7 || weapon.GetSlot() === 8 ) // Exclude these slots at the moment
		return false;
		
		if ( weapon.class === sdGun.CLASS_SETR_REPULSOR || weapon.class === sdGun.CLASS_CUSTOM_RIFLE ) // Disabled guns due to balance reasons
		return false;
		
		if ( weapon._max_dps === 1 ) // Exclude armor, shards, etc...
		return false;
	
		if ( this.item0 && weapon.GetSlot() !== this.item0.GetSlot() ) // Only allow same slot merging
		return false;
		
		if ( this.item1 && ( weapon.GetSlot() !== this.item1.GetSlot() && !this.IgnoresSlot( this.item1 ) ) ) // Only allow same slot merging, or cores
		return false;
		
		return true;
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
		if ( this.item0 )
		{
			this.item0.UpdateHeldPosition();
			if ( sdWorld.is_server )
			this.power0 = Math.round( this.item0._max_dps );
		}
		else
		this.power0 = -1;
	
		if ( this.item1 )
		{
			this.item1.UpdateHeldPosition();
			if ( sdWorld.is_server )
			this.power1 = Math.round( this.item1._max_dps );
		}
		else
		this.power1 = -1;
	
		if ( this.item2 )
		this.item2.UpdateHeldPosition();
		
		if ( this._hea >= this._hmax )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}
	get title()
	{
		return 'Weapon merging bench';
	}
	get description()
	{
		return `Can be used to transfer one weapons power onto another using a merger core.`;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		let postfix;
		if ( !this.item2 )
		postfix = " (needs merger core) ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this._matter_max) + " )";
		else
		postfix = " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this._matter_max) + " )";

		sdEntity.TooltipUntranslated( ctx, T( this.title ) + postfix );
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdWeaponMerger.img_merger, 0, 0, 64,64, - 32, - 32, 64, 64 );
		
		
		ctx.globalAlpha = ( this.matter / sdWeaponMerger.max_matter );
		
		ctx.drawImageFilterCache( sdWeaponMerger.img_merger, 64, 0, 64,64, - 32, - 32, 64, 64 );
		
		ctx.globalAlpha = 1;
		
		if ( this.item0 )
		{
			ctx.save();
			ctx.translate( -16, -1 );
			this.item0.Draw( ctx, true );
			if ( this.power0 !== -1 )
			sdEntity.TooltipUntranslated( ctx, T('Power') + ': ' + this.power0, -5, -10, '#ffffff' );
			ctx.restore();
		}
		if ( this.item1 )
		{
			ctx.save();
			ctx.translate( 16, -1 );
			this.item1.Draw( ctx, true );
			if ( this.power1 !== -1 )
			{
				if ( this.item1.class !== sdGun.CLASS_UNSTABLE_CORE )
				sdEntity.TooltipUntranslated( ctx, T('Power') + ': ' + this.power1, 5, -10, '#ffffff' );
				else
				{
					if ( !this.item0 )
					sdEntity.TooltipUntranslated( ctx, T('Power') + ': ' + '???', 5, -10, '#ffffff' );
					else
					{
						let mult = 1;
						if ( sdGun.classes[ this.item0.class ].slot === 3 || sdGun.classes[ this.item0.class ].slot === 4 )
						mult = 0.5;
						if ( sdGun.classes[ this.item0.class ].slot === 1 )
						mult = 0.35;
						sdEntity.TooltipUntranslated( ctx, T('Power') + ': ' + this.power1 * mult, 5, -10, '#ffffff' );
					}
					
				}
			}
			ctx.restore();
		}
		if ( this.item2 )
		{
			ctx.save();
			ctx.translate( 0, -1 );
			this.item2.Draw( ctx, true );
			ctx.restore();
		}
			//let has_class = sdGun.classes[ this.item0.class ];
			/*if ( has_class.use_parts_rendering )
			{
				let gun = this.item0;
				
				let ID_MAGAZINE = 2;
		
				let ID_DAMAGE_MULT = 7;
				let ID_FIRE_RATE = 8;
				let ID_RECOIL_SCALE = 9;
				let ID_HAS_EXPLOSION = 10;
				let ID_TEMPERATURE_APPLIED = 11;
				let ID_HAS_SHOTGUN_EFFECT = 12;
				let ID_HAS_RAIL_EFFECT = 13;
				let ID_SLOT = 14;

				//Tooltip( ctx, t, x=0, y=0, color='#ffffff' )
				sdEntity.TooltipUntranslated( ctx, T('Damage')+': ' + Math.round( 25 * this.item0.extra[ ID_DAMAGE_MULT ] ), 0, -50, '#ffaaaa' );
				sdEntity.TooltipUntranslated( ctx, T('Recoil')+': ' + Math.round( 100 * this.item0.extra[ ID_DAMAGE_MULT ] * this.item0.extra[ ID_RECOIL_SCALE ] ) + '%', 0, -40, '#ffffaa' );
				
				let reload_time = ( gun.extra[ ID_HAS_RAIL_EFFECT ] ? 2 : 1 ) * ( gun.extra[ ID_HAS_SHOTGUN_EFFECT ] ? 5 : 1 ) * ( sdGun.classes[ gun.class ].reload_time / sdGun.classes[ gun.class ].parts_magazine[ gun.extra[ ID_MAGAZINE ] ].rate ) * gun.extra[ ID_FIRE_RATE ];
				
				if ( Math.round( reload_time / 30 * 1000 ) < 16 )
				sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + T('16ms (capped)'), 0, -30, '#aaffaa' );
				else
				sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + Math.round( reload_time / 30 * 1000 ) + 'ms', 0, -30, '#aaffaa' );
			
				sdEntity.TooltipUntranslated( ctx, T('Temperature') + ': ' + Math.round( this.item0.extra[ ID_TEMPERATURE_APPLIED ] ) + '°C', 0, -20, '#aaffff' );
				
				sdEntity.TooltipUntranslated( ctx, T('Magazine capacity') + ': ' + this.item0.GetAmmoCapacity(), 0, -10, '#ffffff' );
				
				sdEntity.TooltipUntranslated( ctx, T('Ammo cost') + ': ' + Math.round( this.item0.GetBulletCost( false, false ) * 1000 ) / 1000, 0, 0, '#aaaaaa' );
				
				sdEntity.TooltipUntranslated( ctx, T('Biometry lock') + ': ' + ( ( this.item0.biometry_lock !== -1 ) ? 'YES' : 'NO' ), 0, 10, '#333333' );
			}
			else // Regular guns
			{
				let gun = this.item0;
				
				//let ID_MAGAZINE = 2;
		
				let ID_DAMAGE_MULT = 7;
				//let ID_FIRE_RATE = 8;
				let ID_RECOIL_SCALE = 9;
				let ID_DAMAGE_VALUE = 17;
				let ID_ALT_DAMAGE_VALUE = 18;

				if ( this.item0.extra[ ID_DAMAGE_VALUE ] )
				sdEntity.TooltipUntranslated( ctx, T('Damage') + ': ' + Math.round( this.item0.extra[ ID_DAMAGE_VALUE ] * this.item0.extra[ ID_DAMAGE_MULT ] ), 0, -40, '#ffaaaa' );
				if ( this.item0.extra[ ID_ALT_DAMAGE_VALUE ] )
				sdEntity.TooltipUntranslated( ctx, T('Alt mode damage') + ': ' + Math.round( this.item0.extra[ ID_ALT_DAMAGE_VALUE ] * this.item0.extra[ ID_DAMAGE_MULT ] ), 0, -50, '#ffaaaa' );
				if ( this.item0.extra[ ID_RECOIL_SCALE ] )
				sdEntity.TooltipUntranslated( ctx, T('Recoil') + ': ' + Math.round( 100 * this.item0.extra[ ID_DAMAGE_MULT ] * this.item0.extra[ ID_RECOIL_SCALE ] ) + '%', 0, -30, '#ffffaa' );
				
				let reload_time = sdGun.classes[ gun.class ].reload_time; // Best to keep it simple.
				
				if ( Math.round( reload_time / 30 * 1000 ) < 16 )
				sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + T('16ms (capped)'), 0, -20, '#aaffaa' );
				else
				sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + Math.round( reload_time / 30 * 1000 ) + 'ms', 0, -20, '#aaffaa' );
			
				if ( this.item0.GetAmmoCapacity() !== -1 )
				sdEntity.TooltipUntranslated( ctx, T('Magazine capacity') + ': ' + this.item0.GetAmmoCapacity(), 0, -10, '#ffffff' );
				
				sdEntity.TooltipUntranslated( ctx, T('Ammo cost') + ': ' + Math.round( this.item0.GetBulletCost( false, false ) * 1000 ) / 1000, 0, 0, '#aaaaaa' );
			}
			*/
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			for ( var i = 0; i < sdWeaponMerger.slots_tot; i++ )
			this.DropSlot( i );

			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
		else
		{
			for ( var i = 0; i < sdWeaponMerger.slots_tot; i++ )
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
			if ( from_entity._held_by === null && this.IsWeaponCompatible( from_entity ) ) // Make sure gun has DPS which makes it mergable
			{
				/*let free_slot = -1;
				
				for ( var i = 0; i < sdWeaponMerger.slots_tot; i++ )
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
				*/

				if ( ( !this.item0 && from_entity.x <= ( this.x - 8 ) ) ||
				( !this.item1 && from_entity.x >= ( this.x + 8 ) ) ||
				( !this.item2 && from_entity.class === sdGun.CLASS_MERGER_CORE ) ) // Only merger cores can go in the middle
				{
					let free_slot = -1;
					if ( from_entity.x <= ( this.x - 8 ) ) // Slot 1 goes to the left
					free_slot = 0;
				
					if ( from_entity.x >= ( this.x + 8 ) ) // Slot 2 goes to the right
					free_slot = 1;
				
					if ( from_entity.class === sdGun.CLASS_MERGER_CORE ) // Merger core
					free_slot = 2; // Slot 3 item goes in the middle
					
					if ( from_entity.class === sdGun.CLASS_UNSTABLE_CORE && free_slot === 0 ) // Allow unstable cores on the left aswell
					{
						
					}
					else
					if ( this.IgnoresSlot( from_entity ) ) // Exalted core scenario
					{
						if ( !this.item1 ) // Right slot not taken?
						free_slot = 1;
						else
						return;
						
					}
				
				
					this[ 'item' + free_slot ] = from_entity;

					from_entity.ttl = -1;
					from_entity._held_by = this;
					
					from_entity.tilt = 0;
					
					if ( from_entity._dangerous )
					{
						from_entity._dangerous = false;
						from_entity._dangerous_from = null;
					}
					sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
					
					this._current_category_stack = [];
					
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					
					this._update_version++;
				}
			}
		}
	}
	GetItems() // As simple array
	{
		let arr = [];
		
		for ( var i = 0; i < sdWeaponMerger.slots_tot; i++ )
		if ( this[ 'item' + i ] )
		arr.push( this[ 'item' + i ] );
		
		return arr;
	}
	DropSpecificWeapon( ent ) // sdGun keepers need this method for case of sdGun removal
	{
		this.ExtractItem( ent._net_id, null, sdWorld.is_server ); // Only throw for server's case. Clients will have guns locally disappearing when players move away from sdWeaponMerger
	}
	ExtractItem( item_net_id, initiator_character=null, throw_on_not_found=false )
	{
		let slot = -1;
		for ( var i = 0; i < sdWeaponMerger.slots_tot; i++ )
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

		//this.upgraded_dur = false;
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
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdWeaponMerger.access_range ) )
			{
				if ( this.item0 )
				{
					if ( this.item0.biometry_lock !== -1 && this.item0.biometry_lock !== exectuter_character.biometry )
					{
						executer_socket.SDServiceMessage( 'This weapon is biometry-locked' );
						return;
					}

					if ( command_name === 'GET1' )
					{
						if ( this.item0 )
						this.ExtractItem( this.item0._net_id, exectuter_character );

						this._update_version++;
					}
				}
				if ( this.item1 )
				{
					if ( this.item1.biometry_lock !== -1 && this.item1.biometry_lock !== exectuter_character.biometry )
					{
						executer_socket.SDServiceMessage( 'This weapon is biometry-locked' );
						return;
					}

					if ( command_name === 'GET2' )
					{
						if ( this.item1 )
						this.ExtractItem( this.item1._net_id, exectuter_character );

						this._update_version++;
					}
				}
				if ( this.item2 )
				{
					if ( this.item2.biometry_lock !== -1 && this.item2.biometry_lock !== exectuter_character.biometry )
					{
						executer_socket.SDServiceMessage( 'This weapon is biometry-locked' );
						return;
					}

					if ( command_name === 'GET3' )
					{
						if ( this.item2 )
						this.ExtractItem( this.item2._net_id, exectuter_character );

						this._update_version++;
					}
				}
				
				if ( this.item0 && this.item1 && this.item2 )
				{
					if ( command_name === 'MERGE' )
					{
						if ( this.matter === this._matter_max ) // 10k cost per merge, as well as a merger core
						{
							if ( this.item0 && this.item1 && this.item2 ) // Make sure noone took the items out of the merger
							this.MergeWeapons();
							else
							executer_socket.SDServiceMessage( 'All 3 slots must have a weapon for a merge' );
						}
						else
						executer_socket.SDServiceMessage( 'Not enough matter' );
						this._update_version++;
					}
				}
				/*if ( !this.item0 && !this.item1 && !this.item2 )
				{
					executer_socket.SDServiceMessage( 'No weapon found' );
				}*/
				
			}
			else
			{
				executer_socket.SDServiceMessage( 'Too far' );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdWeaponMerger.access_range ) )
		{
			if ( this.item0 )
			{
				this.AddContextOption( 'Get ' + sdEntity.GuessEntityName( this.item0._net_id ), 'GET1', [ ] );
			}
			
			if ( this.item1 )
			{
				this.AddContextOption( 'Get ' + sdEntity.GuessEntityName( this.item1._net_id ), 'GET2', [ ] );
			}
			
			if ( this.item2 )
			{
				this.AddContextOption( 'Get ' + sdEntity.GuessEntityName( this.item2._net_id ), 'GET3', [ ] );
			}
			
			if ( this.item0 && this.item1 && this.item2 )
			{
				if ( this.item2.class === sdGun.CLASS_MERGER_CORE ) // Bug fix
				this.AddContextOption( 'Transfer power of ' + sdEntity.GuessEntityName( this.item1._net_id ) + ' to ' + sdEntity.GuessEntityName( this.item0._net_id ), 'MERGE', [ ] );
			}
			
			/*
			if ( this.owner === exectuter_character )
			{
				this.AddContextOption( 'Accept everyone', 'ACCEPT_ALL', [ ] );
				this.AddContextOption( 'Reject everyone', 'REJECT_ALL', [ ] );
				this.AddContextOption( 'Kick everyone from team', 'KICK_ALL', [ ] );
					
				for ( var i = 0; i < this.pending_team_joins.length; i++ )
				{
					this.AddContextOption( 'Accept ' + sdEntity.GuessEntityName( this.pending_team_joins[ i ] ), 'ACCEPT', [ this.pending_team_joins[ i ] ] );
					this.AddContextOption( 'Reject ' + sdEntity.GuessEntityName( this.pending_team_joins[ i ] ), 'REJECT', [ this.pending_team_joins[ i ] ] );
				}
			}
			else
			{
				this.AddContextOption( 'Request team join', 'REQUEST', [] );
			}*/
		}
	}
}
//sdWeaponMerger.init_class();

export default sdWeaponMerger;
