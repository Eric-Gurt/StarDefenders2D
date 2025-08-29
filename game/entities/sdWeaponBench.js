
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';


class sdWeaponBench extends sdEntity
{
	static init_class()
	{
		sdWeaponBench.img_weapon_workbench = sdWorld.CreateImageFromFile( 'weapon_bench' );
		sdWeaponBench.img_weapon_locker = sdWorld.CreateImageFromFile( 'sdWeaponDisplay' );
		
		sdWeaponBench.access_range = 64;
		
		sdWeaponBench.TYPE_UPGRADE_BENCH = 0;
		sdWeaponBench.TYPE_DISPLAY = 1;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1()  { return this.type === sdWeaponBench.TYPE_DISPLAY ? -31 : -9; }
	get hitbox_x2()  { return this.type === sdWeaponBench.TYPE_DISPLAY ? 31 : 8; }
	get hitbox_y1()  { return this.type === sdWeaponBench.TYPE_DISPLAY ? -24 : -11; }
	get hitbox_y2()  { return this.type === sdWeaponBench.TYPE_DISPLAY ? 24 : 0; }
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{
		if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
		return null;
		
		if ( this.type === sdWeaponBench.TYPE_DISPLAY )
		return [ 0, 0, -40 ];
	}
	
	GetSlotsTotal()
	{
		return this.type === sdWeaponBench.TYPE_DISPLAY ? 8 : 1;
	}
	
	GetRandomColor()
	{
		let hex = '#';
		let str = '0123456789abcdef';
		for ( let i = 0; i < 6; i++ )
		hex += str.charAt( ~~( Math.random() * str.length ) );
	
		return hex;
	}
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.type !== sdWeaponBench.TYPE_DISPLAY; }
	
	constructor( params )
	{
		super( params );
		this._regen_timeout = 0;
		this._last_damage = 0; // Prevent sound spam

		this.upgraded_dur = false; // Apparently I need a public variable for "this.AddContextOption" for durability upgrading so this is the one - Booraz149
		this.item_dps = 1; // Value is given when item is placed on bench. Needed public variable so damage upgrade can have correct DPS for matter cost calculation - Booraz149
		
		this.type = params.type || sdWeaponBench.TYPE_UPGRADE_BENCH;
		this.locked = false;
		
		this._hmax = this.type === sdWeaponBench.TYPE_DISPLAY ? 5000 : 800;
		this._hea = this._hmax;
		
		this._last_locked = 0; // sdWorld.time;
		this._last_key_created = 0; // sdWorld.time;
		this._access_id = Math.round( Math.random() * Number.MAX_SAFE_INTEGER );
	
		this._key_color = this.GetRandomColor();
		
		this.gun_password = null;
		
		this._current_category_stack = [];
		
		for ( var i = 0; i < this.GetSlotsTotal(); i++ )
		this[ 'item' + i ] = null;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		this._regen_timeout = 60;
		
		if ( this.locked )
		if ( sdWorld.time > this._last_damage + 50 )
		{
			this._last_damage = sdWorld.time;
			sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 100 ) });
		}
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	GetItemOffset ( slot ) // Cleaner way
	{
		if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
		return { x: 1, y: -16 };
	
		if ( this.type === sdWeaponBench.TYPE_DISPLAY )
		{
			/*
				Draw items in pattern:
				[ 1 ] [ 3 ] [ 5 ] [ 7 ]
				[ 2 ] [ 4 ] [ 6 ] [ 8 ]
			*/
			// Variable names might be wrong - was changed from being veritcal to horizontal
			
			let start_x = -14

			let row_height = 11;
			let row_offset_x = 11.5
			let row_offset_y = 7.5;
		
			return { 
				x: ( slot - slot % 2 + row_height + start_x ) * row_offset_y,
				y: row_offset_x * ( slot % 2 === 0 ? -1 : 1 )
			};
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
		for ( let i = 0; i < this.GetSlotsTotal(); i++ )
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
	get title()
	{
		if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
		return 'Weapon modification bench';
	
		if ( this.type === sdWeaponBench.TYPE_DISPLAY )
		return 'Weapon display locker';
	}
	get description()
	{
		if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
		return `Can be used to customize appearance and upgrade properties of your weapons. In order to drop weapon onto weapon modification bench - press V. Then right click on weapon modification bench for more options.`;
	
		if ( this.type === sdWeaponBench.TYPE_DISPLAY )
		return `Allows for secure item storage, can be locked via access keys and will self destruct in case of an intrusion attempt. Right click on weapon display locker for configuration and more options.`;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		if ( this.type === sdWeaponBench.TYPE_DISPLAY )
		return;
	
		ctx.drawImageFilterCache( sdWeaponBench.img_weapon_workbench, - 16, - 16, 32,32 );
	
		for ( var i = 0; i < this.GetSlotsTotal(); i++ )
		{
			let item = this[ 'item' + i ];
			
			if ( item )
			{
				if ( this.locked )
				return;

				let offsets = this.GetItemOffset( i );
			
				ctx.save();
				{
					ctx.translate( offsets.x, offsets.y );
			
					item.Draw( ctx, true );
					{
						let has_class = sdGun.classes[ item.class ];
			
						if ( has_class.use_parts_rendering )
						{
							let gun = item;

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
							sdEntity.TooltipUntranslated( ctx, T('Damage')+': ' + Math.round( 25 * item.extra[ ID_DAMAGE_MULT ] * ( ( has_exalted_core === 1 ) ? 1.25 : 1 ) ), 0, -50, '#ffaaaa' );
							sdEntity.TooltipUntranslated( ctx, T('Recoil')+': ' + Math.round( 100 * item.extra[ ID_DAMAGE_MULT ] * item.extra[ ID_RECOIL_SCALE ] ) + '%', 0, -40, '#ffffaa' );
				
							let reload_time = ( gun.extra[ ID_HAS_RAIL_EFFECT ] ? 2 : 1 ) * ( gun.extra[ ID_HAS_SHOTGUN_EFFECT ] ? 5 : 1 ) * ( sdGun.classes[ gun.class ].reload_time / sdGun.classes[ gun.class ].parts_magazine[ gun.extra[ ID_MAGAZINE ] ].rate ) * gun.extra[ ID_FIRE_RATE ];
				
							if ( Math.round( reload_time / 30 * 1000 ) < 16 )
							sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + T('16ms (capped)'), 0, -30, '#aaffaa' );
							else
							sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + Math.round( reload_time / 30 * 1000 ) + 'ms', 0, -30, '#aaffaa' );
			
							sdEntity.TooltipUntranslated( ctx, T('Temperature') + ': ' + Math.round( item.extra[ ID_TEMPERATURE_APPLIED ] ) + '°C', 0, -20, '#aaffff' );
				
							sdEntity.TooltipUntranslated( ctx, T('Magazine capacity') + ': ' + item.GetAmmoCapacity(), 0, -10, '#ffffff' );
				
							sdEntity.TooltipUntranslated( ctx, T('Ammo cost') + ': ' + Math.round( item.GetBulletCost( false, false ) * 1000 ) / 1000, 0, 0, '#aaaaaa' );
				
							sdEntity.TooltipUntranslated( ctx, T('Biometry lock') + ': ' + ( ( item.biometry_lock !== -1 ) ? 'YES' : 'NO' ), 0, 10, '#333333' );
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

							if ( item.extra[ ID_DAMAGE_VALUE ] )
							sdEntity.TooltipUntranslated( ctx, T('Damage') + ': ' + Math.round( item.extra[ ID_DAMAGE_VALUE ] * item.extra[ ID_DAMAGE_MULT ] * ( ( has_exalted_core === 1 ) ? 1.25 : 1 ) ), 0, -40, '#ffaaaa' );
					
							if ( item.extra[ ID_ALT_DAMAGE_VALUE ] )
							sdEntity.TooltipUntranslated( ctx, T('Alt mode damage') + ': ' + Math.round( item.extra[ ID_ALT_DAMAGE_VALUE ] * item.extra[ ID_DAMAGE_MULT ] ), 0, -50, '#ffaaaa' );
					
							if ( item.extra[ ID_RECOIL_SCALE ] )
							sdEntity.TooltipUntranslated( ctx, T('Recoil') + ': ' + Math.round( 100 * item.extra[ ID_DAMAGE_MULT ] * item.extra[ ID_RECOIL_SCALE ] ) + '%', 0, -30, '#ffffaa' );
				
							let reload_time = sdGun.classes[ gun.class ].reload_time; // Best to keep it simple.
				
							if ( Math.round( reload_time / 30 * 1000 ) < 16 )
							sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + T('16ms (capped)'), 0, -20, '#aaffaa' );
							else
							sdEntity.TooltipUntranslated( ctx, T('Cooldown') + ': ' + Math.round( reload_time / 30 * 1000 ) + 'ms', 0, -20, '#aaffaa' );
			
							if ( item.GetAmmoCapacity() !== -1 )
							sdEntity.TooltipUntranslated( ctx, T('Magazine capacity') + ': ' + item.GetAmmoCapacity(), 0, -10, '#ffffff' );

							sdEntity.TooltipUntranslated( ctx, T('Ammo cost') + ': ' + Math.round( item.GetBulletCost( false, false ) * 1000 ) / 1000, 0, 0, '#aaaaaa' );
							
							if ( this.gun_password )
							sdEntity.TooltipUntranslated( ctx, T('Access ID') + ': ' + this.gun_password, 0, -10, '#333333' );
						}
					}
					ctx.restore();
				}
			}
		}
	}
	DrawBG( ctx, attached )
	{
		if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
		return;
	
		if ( sdShop.isDrawing )
		{
			ctx.scale( 0.75, 0.75 );
		}

		let xx = 0;
		let yy = 0;

		if ( this.locked )
		xx = 1;
	
		ctx.drawImageFilterCache( sdWeaponBench.img_weapon_locker, xx * 64, 0, 64, 48, - 32, - 24, 64, 48);
	
		for ( var i = 0; i < this.GetSlotsTotal(); i++ )
		{
			let item = this[ 'item' + i ];
			
			if ( item )
			{
				if ( this.locked )
				return;

				let offsets = this.GetItemOffset( i );
			
				ctx.save();
				{
					ctx.translate( offsets.x, offsets.y );
			
					item.Draw( ctx, true );
					
					ctx.restore();
				}
			}
		}
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			if ( !this.locked )
			{
				for ( var i = 0; i < this.GetSlotsTotal(); i++ )
				if ( this[ 'item' + i ] )
				{
					let item = this[ 'item' + i ];
					this.DropSlot( i );
					let offsets = this.GetItemOffset ( i );
					
					item.x = offsets.x + this.x;
					item.y = offsets.y + this.y;
				}
			}
		
			if ( this.locked )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 70, 
					damage_scale: 7,
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					can_hit_owner: false,
					color: sdEffect.default_explosion_color
				});
				
				for ( var i = 0; i < this.GetSlotsTotal(); i++ )
				if ( this[ 'item' + i ] )
				this[ 'item' + i ].remove();
			}

			sdWorld.BasicEntityBreakEffect( this, 8 );
		}
		else
		{
			for ( var i = 0; i < this.GetSlotsTotal(); i++ )
			if ( this[ 'item' + i ] )
			this[ 'item' + i ].remove();
		}
	}
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		let ents = [];
		for ( var i = 0; i < this.GetSlotsTotal(); i++ )
		if ( this[ 'item' + i ] )
		{
			let item = this[ 'item' + i ];
			ents.push( item );
		}
		return ents;
	}
	MeasureMatterCost()
	{
		return 550;
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( this.locked )
		return;
	
		let allow_ignored_items = this.type === sdWeaponBench.TYPE_DISPLAY;
		
		if ( from_entity.is( sdGun ) )
		if ( !sdGun.classes[ from_entity.class ].ignore_slot || allow_ignored_items ) // Allow some un-upgradable items for display only
		{
			if ( from_entity._held_by === null )
			{
				let free_slot = -1;
				
				for ( var i = 0; i < this.GetSlotsTotal(); i++ )
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
					
					if ( from_entity.class === sdGun.CLASS_ACCESS_KEY )
					this.gun_password = from_entity._access_id;
					else
					this.gun_password = null;
					
					this._current_category_stack = [];
					
					this._update_version++;
				}
			}
		}
	}
	GetItems() // As simple array
	{
		let arr = [];
		
		for ( var i = 0; i < this.GetSlotsTotal(); i++ )
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
		for ( var i = 0; i < this.GetSlotsTotal(); i++ )
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
	
	LockLogic( character, key )
	{
		if ( character )
		if ( character.hea > 0 )
		{
			if ( key )
			{
				if ( key._access_id === this._access_id )
				{
					this.locked = !this.locked; // Lock / unlock depending on current status
					
					sdSound.PlaySound({ name:'gun_defibrillator', x:this.x, y:this.y, volume:1, pitch:1.5 });
					sdSound.PlaySound({ name:'adoor_start', x:this.x, y:this.y, volume:1.5, pitch:1.2 });
					
					this._last_locked = sdWorld.time;

					this._update_version++;
				}
				else
				{
					let t = sdWorld.AnyOf( [ 
						'Wrong key...',
						'Why is this not working?',
						'Perhaps I should generate a new key?',
						'Not again...',
						'Insanity is doing the same thing over and over again and expecting different results'
					] );
					character.Say( t );
				}
			}
			else
			{
				let t = sdWorld.AnyOf( [ 
					'I forgot my key',
					'I need a key to do that',
					'I don\'t have the key on me right now',
					'No key... But have I tried looking under the mat?',
					'I\'ve got to find the key, it has to be somewhere nearby...'
				] );
				character.Say ( t );
			}
		}
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
				let key = null;
				let potential_key = exectuter_character._inventory[ sdGun.classes [ sdGun.CLASS_ACCESS_KEY ].slot ];
				if ( potential_key && potential_key.class === sdGun.CLASS_ACCESS_KEY )
				key = potential_key;

				if ( command_name === 'CREATE_KEY' )
				if ( this.type === sdWeaponBench.TYPE_DISPLAY )
				if ( sdWorld.time > this._last_key_created + 3000 )
				{
					if ( this.locked && !exectuter_character._god )
					return;
				
					let keycard = new sdGun({ x:exectuter_character.x, y:exectuter_character.y, access_id: this._access_id, class:sdGun.CLASS_ACCESS_KEY });
					
					sdEntity.entities.push( keycard );
				
					keycard.sd_filter = sdWorld.CreateSDFilter( true );
					sdWorld.ReplaceColorInSDFilter_v2( keycard.sd_filter, '#00ff00', this._key_color );
					
					this._last_key_created = sdWorld.time;
					
					return;
				}
				
				if ( command_name === 'SET_KEY' )
				if ( this.type === sdWeaponBench.TYPE_DISPLAY )
				{
					if ( this.locked && !exectuter_character._god )
					return;
				
					if ( typeof parameters_array[ 0 ] === 'string' )
					{
						if ( parameters_array[ 0 ].length < 32 )
						{
							this._access_id = parameters_array[ 0 ];
							
							this._key_color = this.GetRandomColor();
							
							if ( parameters_array[ 0 ].length <= 3 || parameters_array[ 0 ] === '123456' )
							{
								let t = sdWorld.AnyOf( [ 
									'I don\'t think this was the best idea...',
									'I have a feeling my items wont be so safe here',
									'Can this thing get hacked?',
									'What\'s the worst that could happen?',
									'Is that all I can come up with?',
									'I mean, who else is gonna use this thing? Hopefully only me'
								] );
							
								exectuter_character.Say ( t );
							}

							this._update_version++;
							executer_socket.SDServiceMessage( 'Access ID updated, revoked old keys' );
						}
						else
						executer_socket.SDServiceMessage( 'Access ID is too long' );
					}
					
					return;
				}

				if ( command_name === 'SET_KEY_ID' ) // For keycard item, not this entity
				if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
				{
					if ( typeof parameters_array[ 0 ] === 'string' )
					{
						if ( parameters_array[ 0 ].length < 32 )
						{
							if ( this.item0.class === sdGun.CLASS_ACCESS_KEY )
							{
								this.item0._access_id = parameters_array[ 0 ];
								
								this.gun_password = parameters_array[ 0 ];

								this._update_version++;
								executer_socket.SDServiceMessage( 'Keycard access ID updated' );
							}
						}
						else
						executer_socket.SDServiceMessage( 'Access ID is too long' );
					}
					
					return;
				}
				
				if ( command_name === 'SET_KEY_HINT' ) // For keycard item, not this entity
				if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
				{
					if ( typeof parameters_array[ 0 ] === 'string' )
					{
						if ( parameters_array[ 0 ].length < 32 )
						{
							if ( this.item0.class === sdGun.CLASS_ACCESS_KEY )
							{
								if ( this.item0.extra )
								{
									this.item0.extra[ 15 ] = parameters_array[ 0 ]; // ID_TITLE = 15
									this.item0.title_censored = sdModeration.IsPhraseBad( parameters_array[ 0 ], executer_socket );
								
									this._update_version++;
									executer_socket.SDServiceMessage( 'Keycard hint has been set' );
								}
							}
						}
						else
						executer_socket.SDServiceMessage( 'Hint is too long' );
					}
					
					return;
				}
				
				if ( command_name === 'LOCK' )
				if ( this.type === sdWeaponBench.TYPE_DISPLAY )
				if ( sdWorld.time > this._last_locked + 1000 ) // No sound spam
				{	
					this.LockLogic( exectuter_character, key );
				
					return;
				}
				let item = this.type === sdWeaponBench.TYPE_DISPLAY ? this[ 'item' + parameters_array[ 0 ] ] : this.item0; // Workaround
				if ( item )
				{
					if ( command_name === 'GET' )
					{
						if ( this.locked )
						return;
					
						let slot = parameters_array[ 0 ];
					
						if ( this[ 'item' + slot ] )
						{
							this.ExtractItem( this[ 'item' + slot ]._net_id, exectuter_character );
							this.gun_password = null;
						}

						this._update_version++;
					}
					else
					if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
					{
						if ( item.biometry_lock !== -1 && item.biometry_lock !== exectuter_character.biometry )
						{
							executer_socket.SDServiceMessage( 'This weapon is biometry-locked' );
							return;
						}
						
						if ( command_name === 'UPGRADE' )
						{
							let upgrades = sdGun.classes[ item.class ].upgrades;

							let i = parseInt( parameters_array[ 0 ] );

							if ( i >= 0 & i < upgrades.length )
							{
								if ( upgrades[ i ].title === "Increase damage" && upgrades[ i ].cost === 2 ) // Normal gun damage upgrade price
								{
									let slot_mult = 1;
									if ( sdGun.classes[ item.class ].slot === 0 || sdGun.classes[ item.class ].slot === 1 )
									slot_mult = 0.7;
							
									let matter_cost_dps = Math.max( 50, 100 * ( Math.pow( this.item_dps / 200, 1.5 ) ) );
									let normal_cost = Math.min( 500, ~~( matter_cost_dps * slot_mult ) );
									if ( exectuter_character.matter >= ( normal_cost || 0 ) )
									{
										let result = true;
									
										if ( upgrades[ i ].action )
										{
											if ( false === upgrades[ i ].action( item, exectuter_character, ...parameters_array[ 0 ].slice ( 1 ) ) )
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
									if ( sdGun.classes[ item.class ].slot === 0 || sdGun.classes[ item.class ].slot === 1 )
									slot_mult = 0.7;

									let matter_cost_dps = Math.max( 50, 100 * ( Math.pow( this.item_dps / 200, 1.5 ) ) );
									let normal_cost = Math.min( 250, ~~( matter_cost_dps * slot_mult ) / 2 );
									if ( exectuter_character.matter >= ( normal_cost || 0 ) )
									{
										let result = true;
									
										if ( upgrades[ i ].action )
										{
											if ( false === upgrades[ i ].action( item, exectuter_character, ...parameters_array.slice( 1 ) ) )
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
										if ( false === upgrades[ i ].action( item, exectuter_character, ...parameters_array.slice( 1 ) ) )
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
							if ( item )
							{
								let matter_cost = sdGun.classes[ item.class ].spawnable !== false ? ( sdGun.classes[ item.class ].matter_cost || 30 ) : 300;
								if ( exectuter_character.matter >= ( matter_cost ) )
								{
									sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

									exectuter_character.matter -= matter_cost;

									item._hea = 500;

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
							if ( item )
							{
								let matter_cost = 500;
								let player_has_weapon_with_biometry = false;
								if ( !item.IsGunRecoverable() ) // Just in case
								executer_socket.SDServiceMessage( 'This weapon cannot have retrieval.' );
								else
								if ( exectuter_character.matter >= ( matter_cost ) )
								{

									sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

									exectuter_character.matter -= matter_cost;

									if ( item.biometry_lock === -1 )
									item.biometry_lock = exectuter_character.biometry;
									else
									item.biometry_lock = -1;
							
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
									if ( item.biometry_lock !== -1 )
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
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdWeaponBench.access_range ) )
		{
			if ( !this.locked )
			for ( let i = 0; i < this.GetSlotsTotal(); i++ )
			{
				let item = this[ 'item' + i ]
				if ( item )
				{
					
					this.AddContextOption( 'Get ' + sdEntity.GuessEntityName( item._net_id ), 'GET', [ i ] );
					let matter_cost_durability = sdGun.classes[ item.class ].spawnable !== false ? ( sdGun.classes[ item.class ].matter_cost || 30 ) : 300; // Matter cost for durability is either equal to cost to build or 300 for non-buildable items
				
					if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
					if ( this.upgraded_dur === false )
					this.AddContextOption( 'Upgrade weapon durability ('+ matter_cost_durability +' matter)', 'INCREASE_HP', [ ], false );
			
					if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
					if ( item.IsGunRecoverable() && item.class !== sdGun.CLASS_CUSTOM_RIFLE )
					this.AddContextOption( 'Prioritize weapon retrieval on death ('+ 500 +' matter)', 'SET_BIOMETRY', [ ], false );
				
					if ( this._current_category_stack.length > 0 )
					this.AddClientSideActionContextOption( 'Go back...', ()=>
					{
						this._current_category_stack.pop();
						this.RebuildContextMenu();
					}, false );
					
					if ( this.type === sdWeaponBench.TYPE_UPGRADE_BENCH )
					{
						let upgrades = sdGun.classes[ item.class ].upgrades;
				
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
							
									if ( item.sd_filter ) // Replace with whatever is currently picked
									color = sdWorld.GetColorOfSDFilter( item.sd_filter, color );
						
									this.AddColorPickerContextOption( upgrade.title + ( ( upgrade.cost || 0 ) > 0 ? ' (' + ( upgrade.cost || 0 ) + ' matter)' : '' ), 'UPGRADE', [ i, undefined ], false, '#' + color );
								}
								else
								if ( upgrade.title === "Increase damage" && upgrade.cost === 2 ) // Non "custom" gun damage
								{
									let slot_mult = 1;
									if ( sdGun.classes[ item.class ].slot === 0 || sdGun.classes[ item.class ].slot === 1 )
									slot_mult = 0.7;
							
									let matter_cost_dps = Math.max( 50, 100 * ( Math.pow( this.item_dps / 200, 1.5 ) ) );
									let normal_cost = Math.min( 500, ~~( matter_cost_dps * slot_mult ) );
									this.AddContextOption( upgrade.title + ( ( normal_cost || 0 ) > 0 ? ' (' + ( normal_cost || 0 ) + ' matter)' : '' ), 'UPGRADE', [ i ], false, { hint_color: upgrade.hint_color } );
								}
								else
								if ( upgrade.title === "Improve recoil control" && upgrade.cost === 1 ) // Non "custom" gun recoil
								{
									let slot_mult = 1;
									if ( sdGun.classes[ item.class ].slot === 0 || sdGun.classes[ item.class ].slot === 1 )
									slot_mult = 0.7;

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
						if ( item.class === sdGun.CLASS_ACCESS_KEY )
						{
							this.AddPromptContextOption( 'Set keycard access ID', 'SET_KEY_ID', [ undefined ], 'Enter new ID', ( this.gun_password || '' ), 32 );
							this.AddPromptContextOption( 'Set keycard hint', 'SET_KEY_HINT', [ undefined ], 'Enter hint', ( item.extra ? item.extra[ 15 ] : '' ), 32 ); // ID_TITLE = 15;
						}
					}
				}
			}
			if ( this.type === sdWeaponBench.TYPE_DISPLAY )
			{
				this.AddContextOption( 'Toggle lock', 'LOCK', [ ] );
				
				if ( !this.locked || exectuter_character._god )
				{
					this.AddPromptContextOption( 'Set access ID', 'SET_KEY', [ undefined ], 'Enter new ID', '', 32 );
				
					this.AddContextOption( 'Generate access key', 'CREATE_KEY', [ ] );
				}
			}
		}
	}
}
//sdWeaponBench.init_class();

export default sdWeaponBench;
