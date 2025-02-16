
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
		this.item_dps = 1; // Value is given when item is placed on bench. Needed public variable so damage upgrade can have correct DPS for matter cost calculation - Booraz149
		
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
		return 'Weapon modification bench';
	}
	get description()
	{
		return `Can be used to customize appearance and upgrade properties of your weapons. In order to drop weapon onto weapon modification bench - press V. Then right click on weapon modification bench for more options.`;
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
				
				let has_exalted_core = ( gun.extra[ 19 ] ) ? gun.extra[ 19 ] : 0;
				
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
				sdEntity.TooltipUntranslated( ctx, T('Damage')+': ' + Math.round( 25 * this.item0.extra[ ID_DAMAGE_MULT ] * ( ( has_exalted_core === 1 ) ? 1.25 : 1 ) ), 0, -50, '#ffaaaa' );
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
				
				let has_exalted_core = ( gun.extra[ 19 ] ) ? gun.extra[ 19 ] : 0;
				
				//let ID_MAGAZINE = 2;
		
				let ID_DAMAGE_MULT = 7;
				//let ID_FIRE_RATE = 8;
				let ID_RECOIL_SCALE = 9;
				let ID_DAMAGE_VALUE = 17;
				let ID_ALT_DAMAGE_VALUE = 18;

				if ( this.item0.extra[ ID_DAMAGE_VALUE ] )
				sdEntity.TooltipUntranslated( ctx, T('Damage') + ': ' + Math.round( this.item0.extra[ ID_DAMAGE_VALUE ] * this.item0.extra[ ID_DAMAGE_MULT ] * ( ( has_exalted_core === 1 ) ? 1.25 : 1 ) ), 0, -40, '#ffaaaa' );
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
		if ( from_entity.class !== sdGun.CLASS_SCORE_SHARD && from_entity.class !== sdGun.CLASS_CRYSTAL_SHARD && from_entity.class !== sdGun.CLASS_CUBE_SHARD && from_entity.class !== sdGun.CLASS_ERTHAL_ENERGY_CELL )
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
					
					from_entity.sx = 0;
					from_entity.sy = 0;
					
					if ( from_entity._dangerous )
					{
						from_entity._dangerous = false;
						from_entity._dangerous_from = null;
					}
					sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
					
					this.item_dps = from_entity._max_dps || 100;
					
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
							if ( upgrades[ i ].title === "Increase damage" && upgrades[ i ].cost === 2 ) // Normal gun damage upgrade price
							{
								let slot_mult = 1;
								if ( sdGun.classes[ this.item0.class ].slot === 0 || sdGun.classes[ this.item0.class ].slot === 1 )
								slot_mult = 0.7;
								//if ( sdGun.classes[ this.item0.class ].slot === 2 )
								//slot_mult = 1.5;
								//let matter_cost_durability = sdGun.classes[ this.item0.class ].spawnable !== false ? ( sdGun.classes[ this.item0.class ].matter_cost * 2 || 60 ) : 300; // Matter cost for durability is either equal to cost to build or 300 for non-buildable items
								let matter_cost_dps = Math.max( 50, 100 * ( Math.pow( this.item_dps / 200, 1.5 ) ) ); // Starter guns should be cheap, while endgame guns should be at 500 matter for damage
								let normal_cost = Math.min( 500, ~~( matter_cost_dps * slot_mult ) );
								if ( exectuter_character.matter >= ( normal_cost || 0 ) )
								{
									let result = true;
									
									if ( upgrades[ i ].action )
									{
										if ( false === upgrades[ i ].action( this.item0, exectuter_character, ...parameters_array.slice( 1 ) ) )
										result = false;
									}

									if ( result )
									{
										sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

										exectuter_character.matter -= ( normal_cost || 0 );	
									}

									this._update_version++;
								}
								else
								executer_socket.SDServiceMessage( 'Not enough matter' );
							}
							else
							if ( upgrades[ i ].title === "Improve recoil control" && upgrades[ i ].cost === 1 ) // Normal gun recoil upgrade price
							{
								let slot_mult = 1;
								if ( sdGun.classes[ this.item0.class ].slot === 0 || sdGun.classes[ this.item0.class ].slot === 1 )
								slot_mult = 0.7;
								//if ( sdGun.classes[ this.item0.class ].slot === 2 )
								//slot_mult = 1.5;
								//let matter_cost_durability = sdGun.classes[ this.item0.class ].spawnable !== false ? ( sdGun.classes[ this.item0.class ].matter_cost * 2 || 60 ) : 300; // Matter cost for durability is either equal to cost to build or 300 for non-buildable items
								let matter_cost_dps = Math.max( 50, 100 * ( Math.pow( this.item_dps / 200, 1.5 ) ) );
								let normal_cost = Math.min( 250, ~~( matter_cost_dps * slot_mult ) / 2 );
								if ( exectuter_character.matter >= ( normal_cost || 0 ) )
								{
									let result = true;
									
									if ( upgrades[ i ].action )
									{
										if ( false === upgrades[ i ].action( this.item0, exectuter_character, ...parameters_array.slice( 1 ) ) )
										result = false;
									}

									if ( result )
									{
										sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

										exectuter_character.matter -= ( normal_cost || 0 );	
									}
									
									this._update_version++;
								}
								else
								executer_socket.SDServiceMessage( 'Not enough matter' );
							}
							else
							if ( exectuter_character.matter >= ( upgrades[ i ].cost || 0 ) )
							{
								let result = true;

								if ( upgrades[ i ].action )
								{
									if ( false === upgrades[ i ].action( this.item0, exectuter_character, ...parameters_array.slice( 1 ) ) )
									result = false;
								}

								if ( result )
								{
									sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

									exectuter_character.matter -= ( upgrades[ i ].cost || 0 );
								}

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
					else
					if ( command_name === 'SET_BIOMETRY' ) // For non custom guns and for non "Lost damage" guns
					{
						if ( this.item0 )
						{
							let matter_cost = 500;
							let player_has_weapon_with_biometry = false;
							if ( !this.item0.IsGunRecoverable() ) // Just in case
							executer_socket.SDServiceMessage( 'This weapon cannot have retrieval.' );
							else
							if ( exectuter_character.matter >= ( matter_cost ) )
							{

								sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

								exectuter_character.matter -= matter_cost;

								if ( this.item0.biometry_lock === -1 )
								this.item0.biometry_lock = exectuter_character.biometry;
								else
								this.item0.biometry_lock = -1;
							
								for ( let i = 0; i < exectuter_character._inventory.length; i++ )
								{
									if ( exectuter_character._inventory[ i ] )
									{
										if ( exectuter_character._inventory[ i ].biometry_lock === exectuter_character.biometry )
										{
											player_has_weapon_with_biometry = true;
											break;
										}
									}
								}
								if ( this.item0.biometry_lock !== -1 )
								{
									if ( !player_has_weapon_with_biometry )
									{
										exectuter_character.Say( [ 
							'In case of my demise, someone is in for a surprise.', 
							'It should automatically teleport back to the Mothership if forcefully removed.', 
							'This weapon will automatically recall into the Mothership if I disappear whilst having it.',
							'I guess this now has extended warranty, heh.',
							'If I forcefully lose possession of this item, it will recall into the Mothership.',
							'As long as only one item prioritizes retrieval, it will always be that one.'
						][ ~~( Math.random() * 5 ) ] );
						
										executer_socket.SDServiceMessage( 'This weapon will be teleported to the Mothership storage on death.' );
									}
									else
									{
										exectuter_character.Say( [ 
							'I already have a weapon to prioritize saving.', 
							'Having multiple of these will not work.', 
							'I can only save one weapon, in case of death.',
							'They will not save more than one weapon with this feature.',
							'I can\'t save multiple weapons on death. I should pick only one.'
						][ ~~( Math.random() * 4 ) ] );
										executer_socket.SDServiceMessage( 'Equipping multiple priority retrieval weapons will save a stronger one.' );
									}
								}
								else
									{
									exectuter_character.Say( [ 
						'Priority retrieval disabled for this item.', 
						'It will no longer attempt retrieval to Mothership on death, if equipped'
					][ ~~( Math.random() * 1 ) ] );
									executer_socket.SDServiceMessage( 'Priority retrieval disabled for this weapon.' );
								}
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
			
				if ( this.item0.IsGunRecoverable() && this.item0.class !== sdGun.CLASS_CUSTOM_RIFLE )
				this.AddContextOption( 'Prioritize weapon retrieval on death ('+ 500 +' matter)', 'SET_BIOMETRY', [ ], false );
				
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
						if ( upgrade.color_picker_for )
						{
							if ( upgrade.color_picker_for.length === 7 )
							upgrade.color_picker_for = upgrade.color_picker_for.substring( 1 ); // Skip #
							
							let color = upgrade.color_picker_for;
							
							if ( this.item0.sd_filter ) // Replace with whatever is currently picked
							color = sdWorld.GetColorOfSDFilter( this.item0.sd_filter, color );
						
							this.AddColorPickerContextOption( upgrade.title + ( ( upgrade.cost || 0 ) > 0 ? ' (' + ( upgrade.cost || 0 ) + ' matter)' : '' ), 'UPGRADE', [ i, undefined ], false, '#' + color );
						}
						else
						if ( upgrade.title === "Increase damage" && upgrade.cost === 2 ) // Non "custom" gun damage
						{
							let slot_mult = 1;
							if ( sdGun.classes[ this.item0.class ].slot === 0 || sdGun.classes[ this.item0.class ].slot === 1 )
							slot_mult = 0.7;
							//if ( sdGun.classes[ this.item0.class ].slot === 2 )
							//slot_mult = 1.5;
							let matter_cost_dps = Math.max( 50, 100 * ( Math.pow( this.item_dps / 200, 1.5 ) ) );
							let normal_cost = Math.min( 500, ~~( matter_cost_dps * slot_mult ) );
							this.AddContextOption( upgrade.title + ( ( normal_cost || 0 ) > 0 ? ' (' + ( normal_cost || 0 ) + ' matter)' : '' ), 'UPGRADE', [ i ], false, { hint_color: upgrade.hint_color } );
						}
						else
						if ( upgrade.title === "Improve recoil control" && upgrade.cost === 1 ) // Non "custom" gun recoil
						{
							let slot_mult = 1;
							if ( sdGun.classes[ this.item0.class ].slot === 0 || sdGun.classes[ this.item0.class ].slot === 1 )
							slot_mult = 0.7;
							//if ( sdGun.classes[ this.item0.class ].slot === 2 )
							//slot_mult = 1.5;
							let matter_cost_dps = Math.max( 50, 100 * ( Math.pow( this.item_dps / 200, 1.5 ) ) );
							let normal_cost = Math.min( 250, ~~( matter_cost_dps * slot_mult ) / 2 );
							this.AddContextOption( upgrade.title + ( ( normal_cost || 0 ) > 0 ? ' (' + ( normal_cost || 0 ) + ' matter)' : '' ), 'UPGRADE', [ i ], false, { hint_color: upgrade.hint_color } );
						}
						else
						{
							this.AddContextOption( upgrade.title + ( ( upgrade.cost || 0 ) > 0 ? ' (' + ( upgrade.cost || 0 ) + ' matter)' : '' ), 'UPGRADE', [ i ], false, { hint_color: upgrade.hint_color } );
						}
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
