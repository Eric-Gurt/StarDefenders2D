
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';


class sdWeaponBench extends sdEntity
{
	static init_class()
	{
		sdWeaponBench.img_weapon_workbench = sdWorld.CreateImageFromFile( 'weapon_bench' );
		
		sdWeaponBench.access_range = 46;
		
		sdWeaponBench.slots_tot = 1;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return -9; }
	get hitbox_x2()  { return 8; }
	get hitbox_y1()  { return -11; }
	get hitbox_y2()  { return 0; }
	
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

		this._hea = 800;
		this._hmax = 800;
		
		this._regen_timeout = 0;

		this.upgraded_dur = false; // Apparently I need a public variable for "this.AddContextOption" for durability upgrading so this is the one - Booraz149
		
		this._current_category_stack = [];
		
		//this._held_items = [];
		//this.held_net_ids = [];
		
		for ( var i = 0; i < sdWeaponBench.slots_tot; i++ )
		this[ 'item' + i ] = null;
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
		this.item0.UpdateHeldPosition();
		
		if ( this._hea >= this._hmax )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}
	get title()
	{
		return 'Weapon Modification Bench';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdWeaponBench.img_weapon_workbench, - 16, - 16, 32,32 );
		
		if ( this.item0 )
		{
			//ctx.translate( -1, -15 );
			ctx.translate( -1, -17 );
			this.item0.Draw( ctx, true );
			
			let has_class = sdGun.classes[ this.item0.class ];
			
			if ( has_class.use_parts_rendering )
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
				sdEntity.Tooltip( ctx, 'Damage: ' + Math.round( 25 * this.item0.extra[ ID_DAMAGE_MULT ] ), 0, -50, '#ffaaaa' );
				sdEntity.Tooltip( ctx, 'Recoil: ' + Math.round( 100 * this.item0.extra[ ID_DAMAGE_MULT ] * this.item0.extra[ ID_RECOIL_SCALE ] ) + '%', 0, -40, '#ffffaa' );
				
				let reload_time = ( gun.extra[ ID_HAS_SHOTGUN_EFFECT ] ? 5 : 1 ) * ( sdGun.classes[ gun.class ].reload_time / sdGun.classes[ gun.class ].parts_magazine[ gun.extra[ ID_MAGAZINE ] ].rate ) * gun.extra[ ID_FIRE_RATE ];
				
				if ( Math.round( reload_time / 30 * 1000 ) < 16 )
				sdEntity.Tooltip( ctx, 'Cooldown: 16ms (capped)', 0, -30, '#aaffaa' );
				else
				sdEntity.Tooltip( ctx, 'Cooldown: ' + Math.round( reload_time / 30 * 1000 ) + 'ms', 0, -30, '#aaffaa' );
			
				sdEntity.Tooltip( ctx, 'Temperature: ' + Math.round( this.item0.extra[ ID_TEMPERATURE_APPLIED ] ) + '°C', 0, -20, '#aaffff' );
				
				sdEntity.Tooltip( ctx, 'Magazine capacity: ' + this.item0.GetAmmoCapacity(), 0, -10, '#ffffff' );
				
				sdEntity.Tooltip( ctx, 'Ammo cost: ' + Math.round( this.item0.GetBulletCost( false, false ) * 1000 ) / 1000, 0, 0, '#aaaaaa' );
				
				sdEntity.Tooltip( ctx, 'Biometry lock: ' + ( ( this.item0.biometry_lock !== -1 ) ? 'YES' : 'NO' ), 0, 10, '#333333' );
			}
		}
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			for ( var i = 0; i < sdWeaponBench.slots_tot; i++ )
			this.DropSlot( i );

			sdWorld.BasicEntityBreakEffect( this, 5 );
		}
		else
		{
			for ( var i = 0; i < sdWeaponBench.slots_tot; i++ )
			if ( this[ 'item' + i ] )
			this[ 'item' + i ].remove();
		}
	}
	MeasureMatterCost()
	{
		return 550;
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
				
				for ( var i = 0; i < sdWeaponBench.slots_tot; i++ )
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
					
					if ( from_entity._dangerous )
					{
						from_entity._dangerous = false;
						from_entity._dangerous_from = null;
					}
					sdSound.PlaySound({ name:'reload', x:this.x, y:this.y, volume:0.25, pitch:5 });
					
					this._current_category_stack = [];
					
					this._update_version++;
				}
			}
		}
	}
	GetItems() // As simple array
	{
		let arr = [];
		
		for ( var i = 0; i < sdWeaponBench.slots_tot; i++ )
		if ( this[ 'item' + i ] )
		arr.push( this[ 'item' + i ] );
		
		return arr;
	}
	DropSpecificWeapon( ent ) // sdGun keepers need this method for case of sdGun removal
	{
		this.ExtractItem( ent._net_id, null, sdWorld.is_server ); // Only throw for server's case. Clients will have guns locally disappearing when players move away from sdWeaponBench
	}
	ExtractItem( item_net_id, initiator_character=null, throw_on_not_found=false )
	{
		let slot = -1;
		for ( var i = 0; i < sdWeaponBench.slots_tot; i++ )
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

		this.upgraded_dur = false;
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

		this.upgraded_dur = false;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdWeaponBench.access_range ) )
			{
				if ( this.item0 )
				{
					if ( this.item0.biometry_lock !== -1 && this.item0.biometry_lock !== exectuter_character.biometry )
					{
						executer_socket.SDServiceMessage( 'This weapon is biometry-locked' );
						return;
					}

					if ( command_name === 'GET' )
					{
						if ( this.item0 )
						this.ExtractItem( this.item0._net_id, exectuter_character );

						this._update_version++;
					}
					else
					if ( command_name === 'UPGRADE' )
					{
						let upgrades = sdGun.classes[ this.item0.class ].upgrades;

						let i = parseInt( parameters_array[ 0 ] );

						if ( i >= 0 & i < upgrades.length )
						{
							if ( exectuter_character.matter >= ( upgrades[ i ].cost || 0 ) )
							{
								if ( upgrades[ i ].action )
								upgrades[ i ].action( this.item0, exectuter_character );

								sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

								exectuter_character.matter -= ( upgrades[ i ].cost || 0 );

								this._update_version++;
							}
							else
							executer_socket.SDServiceMessage( 'Not enough matter' );
						}
					}
					else
					if ( command_name === 'INCREASE_HP' )
					{
						if ( this.item0 )
						{
							let matter_cost = sdGun.classes[ this.item0.class ].spawnable !== false ? ( sdGun.classes[ this.item0.class ].matter_cost || 30 ) : 300;
							if ( exectuter_character.matter >= ( matter_cost ) )
							{

								sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

								exectuter_character.matter -= matter_cost;

								this.item0._hea = 500;

								this.upgraded_dur = true;

								this._update_version++;
							}
							else
							executer_socket.SDServiceMessage( 'Not enough matter' );
						}
					}
				}
				else
				{
					executer_socket.SDServiceMessage( 'No weapon found' );
				}
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
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdWeaponBench.access_range ) )
		{
			if ( this.item0 )
			{
				this.AddContextOption( 'Get ' + sdEntity.GuessEntityName( this.item0._net_id ), 'GET', [ ] );
				let matter_cost_durability = sdGun.classes[ this.item0.class ].spawnable !== false ? ( sdGun.classes[ this.item0.class ].matter_cost || 30 ) : 300; // Matter cost for durability is either equal to cost to build or 300 for non-buildable items
				
				//if ( this._current_category_stack.length === 0 )
				if ( this.upgraded_dur === false )
				this.AddContextOption( 'Upgrade weapon durability ('+ matter_cost_durability +' matter)', 'INCREASE_HP', [ ], false );
				
				if ( this._current_category_stack.length > 0 )
				this.AddClientSideActionContextOption( 'Go back...', ()=>
				{
					this._current_category_stack.pop();
					this.RebuildContextMenu();
				}, false );
				
				let upgrades = sdGun.classes[ this.item0.class ].upgrades;
				
				if ( upgrades )
				for ( let i in upgrades )
				{
					let upgrade = upgrades[ i ];
					
					if ( ( upgrade.category || undefined ) === this._current_category_stack[ this._current_category_stack.length - 1 ] )
					{
						if ( upgrade.represents_category )
						{
							this.AddClientSideActionContextOption( upgrade.title, ()=>
							{
								this._current_category_stack.push( upgrade.represents_category );
								this.RebuildContextMenu();
							}, false );
						}
						else
						this.AddContextOption( upgrade.title + ( ( upgrade.cost || 0 ) > 0 ? ' (' + ( upgrade.cost || 0 ) + ' matter)' : '' ), 'UPGRADE', [ i ], false );
					}
				}
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
//sdWeaponBench.init_class();

export default sdWeaponBench;
