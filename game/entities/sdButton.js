/*

	TODO:
		Make it open doors that are locked with only keycards or requires adminstrational access from a subscribed player
		Make use of keycard registeration, like ._net_id, could be seperated with sdInventory or sdWhateverItsCalled
		sdCable support on sdButton

*/

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdGun from './sdGun.js';
import sdDoor from './sdDoor.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdAntigravity from './sdAntigravity.js';
import sdNode from './sdNode.js';

import sdSound from '../sdSound.js';

import sdRenderer from '../client/sdRenderer.js';

class sdButton extends sdEntity
{
	static init_class()
	{
		sdButton.img_button = sdWorld.CreateImageFromFile( 'sdButton' );
		
		sdButton.TYPE_WALL_BUTTON = 0;
		sdButton.TYPE_FLOOR_SENSOR = 1;
		sdButton.TYPE_WALL_SENSOR = 2;
		sdButton.TYPE_WALL_MATTER_SENSOR = 3;
		// If you are going to make new button visual variations - make some kind of texture_id property instead of copying types
		
		// These are indices in array
		sdButton.FILTER_OPTION_CURRENT = 0; // Can be mass or matter
		sdButton.FILTER_OPTION_CONDITION = 1;
		sdButton.FILTER_OPTION_REFERENCE = 2;
		

		sdButton.buttons = []; // For global detections

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
		
	get hitbox_x1() { return ( this.type === sdButton.TYPE_WALL_SENSOR ) ? -3 : -8; }
	get hitbox_x2() { return ( this.type === sdButton.TYPE_WALL_SENSOR ) ? 3 : 8; }
	get hitbox_y1() { return ( this.type === sdButton.TYPE_FLOOR_SENSOR ) ? -3 : ( this.type === sdButton.TYPE_WALL_SENSOR ) ? -3 : -8; }
	get hitbox_y2() { return ( this.type === sdButton.TYPE_FLOOR_SENSOR ) ? 0 : ( this.type === sdButton.TYPE_WALL_SENSOR ) ? 3 : 8; }

	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		if ( this.type === sdButton.TYPE_FLOOR_SENSOR )
		return null;
	
		return [ 0, 0, -40 ];
	}
	
	get hard_collision()
	{ return false; }
		
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }

	get title()
	{
		if ( this.type === sdButton.TYPE_WALL_SWITCH )
		return 'Button';
	
		if ( this.type === sdButton.TYPE_FLOOR_SENSOR )
		return 'Weight sensor';
	
		if ( this.type === sdButton.TYPE_WALL_SENSOR )
		return 'Wall sensor';
	
		if ( this.type === sdButton.TYPE_WALL_MATTER_SENSOR )
		return 'Matter capacity sensor';
	
		return 'Button';
	}
		
	PrecieseHitDetection( x, y, bullet=null ) // Teleports use this to prevent bullets from hitting them like they do. Only ever used by bullets, as a second rule after box-like hit detection. It can make hitting entities past outer bounding box very inaccurate. Can be also used to make it ignore certain bullet kinds altogether
	{
		if ( this.type === sdButton.TYPE_FLOOR_SENSOR )
		return true;
			
		if ( bullet )
		{
			if ( bullet._bg_shooter )
			{
				return true;
			}
			else
			if ( bullet._gun && sdWorld.entity_classes.sdGun.classes[ bullet._gun.class ] )
			{
				return ( 
					sdWorld.entity_classes.sdGun.classes[ bullet._gun.class ].is_sword ||
					sdWorld.entity_classes.sdGun.classes[ bullet._gun.class ].slot === 0 || // Some sword-like guns (fists, deconstruction hammers yet can't be thrown to deal damage) have slot 0
					bullet._gun.class === sdGun.CLASS_CABLE_TOOL );
			}
			return false;
		}
		
		return true;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
		if ( this._hea > 0 )
		{
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;

				this._regen_timeout = 60;

				if ( this._hea <= 0 )
				{
					sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.25, pitch: 1.3 });
					this.remove();
				}
			}
			
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );
		
		this.type = params.type || sdButton.TYPE_WALL_BUTTON;

		this._hmax = 100;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		this.activated = false;
		
		this.react_to_doors = false;
		
		//this.owner_biometry = -1;
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._overlapped_net_ids = [];
		
		this.filter = null; // Becomes array [ current value, condition, reference value ], if type is a floor sensor
		
		if ( this.type === sdButton.TYPE_FLOOR_SENSOR )
		this.filter = [ 0, '>', 0 ]; // Measures mass
	
		if ( this.type === sdButton.TYPE_WALL_MATTER_SENSOR )
		this.filter = [ 0, '>', 0 ]; // Measures max_matter
		
		sdButton.buttons.push( this );
	}
	onMovementInRange( from_entity )
	{
		if ( this.type === sdButton.TYPE_FLOOR_SENSOR || this.type === sdButton.TYPE_WALL_SENSOR || this.type === sdButton.TYPE_WALL_MATTER_SENSOR )
		if ( from_entity.IsBGEntity() === 0 )
		if ( this.react_to_doors || !from_entity.is( sdDoor ) )
		if ( !from_entity.is( sdBlock ) )
		{
			if ( this._overlapped_net_ids.indexOf( from_entity._net_id ) === -1 )
			{
				//if ( this._overlapped_net_ids.length === 0 )
				//this.SetActivated( true );

				this._overlapped_net_ids.push( from_entity._net_id );
			}

			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	IsFilterConditionsMet()
	{
		if ( this.filter )
		{
			let condition = this.filter[ sdButton.FILTER_OPTION_CONDITION ];
			
			let v = 0;
			
			if ( this.type === sdButton.TYPE_WALL_MATTER_SENSOR )
			{
				if ( condition === '>' )
				v = 0;
				else
				if ( condition === '<' )
				v = Infinity;
			}
			
			let any_found = false;
			let best_found = false;
			
			for ( let i = 0; i < this._overlapped_net_ids.length; i++ )
			{
				let e = sdEntity.entities_by_net_id_cache_map.get( this._overlapped_net_ids[ i ] );

				if ( !e._is_being_removed )
				{
					any_found = true;
					
					if ( this.type === sdButton.TYPE_FLOOR_SENSOR )
					v += e.mass;
					else
					if ( this.type === sdButton.TYPE_WALL_MATTER_SENSOR )
					{
						if ( condition === '>' )
						v = Math.max( v, ( e.matter_max || e._matter_max || 0 ) );
						else
						if ( condition === '<' )
						v = Math.min( v, ( e.matter_max || e._matter_max || 0 ) );
						else
						if ( condition === '=' )
						{
							if ( !best_found )
							{
								v = ( e.matter_max || e._matter_max || 0 );

								if ( v === this.filter[ sdButton.FILTER_OPTION_REFERENCE ] )
								best_found = true;
							}
						}
					}
				}
			}
			
			if ( !any_found )
			v = 0;
			
			////if ( any_found )
			//{
				if ( this.filter[ sdButton.FILTER_OPTION_CURRENT ] !== v )
				{
					this.filter[ sdButton.FILTER_OPTION_CURRENT ] = v;

					this._update_version++;
				}
			//}
			
			if ( condition === '>' )
			return this.filter[ sdButton.FILTER_OPTION_CURRENT ] > this.filter[ sdButton.FILTER_OPTION_REFERENCE ];
			if ( condition === '<' )
			return this.filter[ sdButton.FILTER_OPTION_CURRENT ] < this.filter[ sdButton.FILTER_OPTION_REFERENCE ];
			if ( condition === '=' )
			return this.filter[ sdButton.FILTER_OPTION_CURRENT ] === this.filter[ sdButton.FILTER_OPTION_REFERENCE ];
		
			return false;
		}
		
		return ( this._overlapped_net_ids.length > 0 );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );

		
		for ( let i = 0; i < this._overlapped_net_ids.length; i++ )
		{
			let e = sdEntity.entities_by_net_id_cache_map.get( this._overlapped_net_ids[ i ] );
					
			if ( e && !e._is_being_removed &&
					(
						e.x + e._hitbox_x2 >= this.x + this._hitbox_x1 &&
						e.x + e._hitbox_x1 <= this.x + this._hitbox_x2 &&
						e.y + e._hitbox_y2 >= this.y + this._hitbox_y1 &&
						e.y + e._hitbox_y1 <= this.y + this._hitbox_y2
					)
				)
			{
			}
			else
			{
				this._overlapped_net_ids.splice( i, 1 );
				i--;
				continue;
			}
		}
		
		if ( sdWorld.is_server )
		{
			if ( this.type === sdButton.TYPE_WALL_BUTTON )
			{
				// These should not auto-activate
			}
			else
			this.SetActivated( this.IsFilterConditionsMet() );
		}
		
		if ( this._overlapped_net_ids.length === 0 && this._hea >= this._hmax )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
		
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		let i = sdButton.buttons.indexOf( this );
		if ( i !== -1 )
		sdButton.buttons.splice( i, 1 );
	}
	
	SetActivated( v )
	{
		if ( this.activated !== v )
		{
			this.activated = v;
			this._update_version++;
			
			let nodes_to_switch_off = [];
			
			const GetFlipLogic = ( path )=>
			{
				let vv = v;
				
				for ( let i = 0; i < path.length; i++ )
				{
					let node = path[ i ];
					if ( node.is( sdNode ) )
					{
						if ( node.type === sdNode.TYPE_SIGNAL_ONCE )
						{
							if ( nodes_to_switch_off.indexOf( node ) === -1 )
							nodes_to_switch_off.push( node );
						}
						else
						if ( node.type === sdNode.TYPE_SIGNAL_ONCE_OFF )
						{
							return undefined;
						}
						else
						if ( node.type === sdNode.TYPE_SIGNAL_FLIPPER )
						vv = !vv;
					}
				}
		
				return vv;
			};
			
			let doors = this.FindObjectsInACableNetwork( null, sdDoor, true ); // { entity: sdEntity, path: [] }
			let antigravities = this.FindObjectsInACableNetwork( null, sdAntigravity, true ); // { entity: sdEntity, path: [] }
			let nodes = this.FindObjectsInACableNetwork( null, sdNode, true );
			
			// Prevents path building through BSUs, LRTPs etc. Only nodes are allowed
			const IsPathTraversable = ( path )=>
			{
				for ( let i2 = 1; i2 < path.length; i2++ ) // 0 is button/sensor
				if ( !path[ i2 ].is( sdNode ) )
				return false;
				
				return true;
			};
			
			for ( let i = 0; i < nodes.length; i++ )
			{
				let node = nodes[ i ].entity;
				
				if ( node._is_being_removed )
				continue;
			
				let path = nodes[ i ].path;
				
				if ( !IsPathTraversable( path ) )
				continue;
				
				let found_switch_off = false;
				
				for ( let i2 = 0; i2 < path.length; i2++ )
				//for ( let i2 = path.length - 1; i2 >= 0; i2-- )
				{
					let earlier_node = path[ i2 ];
					
					if ( earlier_node.is( sdNode ) )
					{
						if ( earlier_node.type === sdNode.TYPE_SIGNAL_ONCE )
						{
							found_switch_off = true;

							if ( nodes_to_switch_off.indexOf( earlier_node ) === -1 )
							nodes_to_switch_off.push( earlier_node );

							break;
						}
						
						if ( earlier_node.type === sdNode.TYPE_SIGNAL_ONCE_OFF )
						{
							found_switch_off = true;
							break;
						}
					}
				}
				
				if ( !found_switch_off )
				if ( node.type === sdNode.TYPE_SIGNAL_ONCE )
				{
					if ( nodes_to_switch_off.indexOf( node ) === -1 )
					nodes_to_switch_off.push( node );
				}
			}
			
			for ( let i = 0; i < doors.length; i++ )
			{
				let door = doors[ i ].entity;
				
				if ( door._is_being_removed )
				continue;
			
				let path = doors[ i ].path;
				
				let vv = GetFlipLogic( path );
				
				if ( vv === undefined )
				continue;
				
				if ( !IsPathTraversable( path ) )
				continue;
				
				door.open_type = sdDoor.OPEN_TYPE_BUTTON;
				
				let id = door._entities_within_sensor_area.indexOf( door._net_id ); // Add itself so multiple sensors/buttons could be used
				
				if ( vv )
				{
					if ( id === -1 )
					{
						door._entities_within_sensor_area.push( door._net_id );
						door.Open();
					}
				}
				else
				if ( id !== -1 )
				{
					door._entities_within_sensor_area.splice( id, 1 );
					door.opening_tim = 0.000001; // Micro value so sound can play
				}
			}
			for ( let i = 0; i < antigravities.length; i++ )
			{
				let antigravity = antigravities[ i ].entity;
				
				if ( antigravity._is_being_removed )
				continue;
			
				let path = antigravities[ i ].path;
				
				let vv = GetFlipLogic( path );
				
				if ( vv === undefined )
				continue;
				
				if ( !IsPathTraversable( path ) )
				continue;
				
				antigravity._update_version++;
				antigravity.toggle_enabled = vv;
				if ( vv )
				antigravity.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
			
			
			// Then burn all the one-time nodes
			for ( let i = 0; i < nodes_to_switch_off.length; i++ )
			{
				let node = nodes_to_switch_off[ i ];
				
				node.type = sdNode.TYPE_SIGNAL_ONCE_OFF;
				node._update_version++;
			}
			
			if ( this.type === sdButton.TYPE_WALL_SWITCH )
			{
				if ( v )
				sdSound.PlaySound({ name:'cut_droid_alert', pitch: 3.5, x:this.x, y:this.y, volume:0.5 });
				else
				sdSound.PlaySound({ name:'cut_droid_alert', pitch: 3, x:this.x, y:this.y, volume:0.5 });
			}
			else
			{
				if ( v )
				sdSound.PlaySound({ name:'cut_droid_alert', pitch: 3.5, x:this.x, y:this.y, volume:0.1 });
				else
				sdSound.PlaySound({ name:'cut_droid_alert', pitch: 3, x:this.x, y:this.y, volume:0.1 });
			}

			/*if ( v )
			sdSound.PlaySound({ name:'hover_start', pitch: 2, x:this.x, y:this.y, volume:1 }); // Placeholder sound
			else
			sdSound.PlaySound({ name:'hover_start', pitch: 0.5, x:this.x, y:this.y, volume:1 }); // Placeholder sound*/
		}
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if (
				(
					sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 46 )
					&&
					executer_socket.character.canSeeForUse( this )
				)
			)
		{
			if ( this.type === sdButton.TYPE_WALL_BUTTON )
			{
				if ( command_name === 'PRESS_BUTTON' )
				this.SetActivated( true );
	
				if ( command_name === 'UNPRESS_BUTTON' )
				this.SetActivated( false );
			}
			
			if ( command_name === 'TOGGLE_DOOR_REACTION' )
			{
				this.react_to_doors = !this.react_to_doors;
				
				this._update_version++;
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
			
			if ( this.filter )
			{
				if ( command_name === 'SET_FILTER_CONDITION' )
				{
					let arr = [ '>', '=', '<' ];
					this.filter[ sdButton.FILTER_OPTION_CONDITION ] = arr[ ( arr.indexOf( this.filter[ sdButton.FILTER_OPTION_CONDITION ] ) + 1 ) % arr.length ];
					
					this._update_version++;
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				}
				if ( command_name === 'SET_FILTER_REFERENCE' )
				{
					let v = parseFloat( parameters_array[ 0 ] );
					if ( !isNaN( v ) )
					{
						this.filter[ sdButton.FILTER_OPTION_REFERENCE ] = v;
						
						this._update_version++;
						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
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
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 46 ) )
		if ( exectuter_character.canSeeForUse( this ) )
		{
			if ( this.type === sdButton.TYPE_WALL_BUTTON )
			{
				if ( this.activated )
				this.AddContextOption( 'Deactivate button (E works too)', 'UNPRESS_BUTTON', [] );
				else
				this.AddContextOption( 'Activate button (E works too)', 'PRESS_BUTTON', [] );

				// Unused stuff that I can't do yet

				//this.AddContextOption( 'Register Keycard', 'REGISTER_KEYCARD', [ undefined ] )
			}
			

			if ( this.type === sdButton.TYPE_FLOOR_SENSOR || this.type === sdButton.TYPE_WALL_SENSOR )
			{
				if ( this.react_to_doors )
				this.AddContextOption( 'Disable door reaction', 'TOGGLE_DOOR_REACTION', [] );
				else
				this.AddContextOption( 'Enable door reaction', 'TOGGLE_DOOR_REACTION', [] );
			}

			
			if ( this.filter )
			{
				this.AddContextOption( 'Toggle filter condition', 'SET_FILTER_CONDITION', [], false );
				this.AddPromptContextOption( 'Set filter reference', 'SET_FILTER_REFERENCE', [ undefined ], 'Enter reference value', this.filter[ sdButton.FILTER_OPTION_REFERENCE ], 100 );
			}
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.filter )
		{
			sdEntity.Tooltip( ctx, this.title, 0, -8 );
			sdEntity.TooltipUntranslated( ctx, this.filter.join(' '), 0, 0, this.IsFilterConditionsMet() ? '#66ff66' : '#ff6666' );
		}
		else
		{
			sdEntity.Tooltip( ctx, this.title );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.type === sdButton.TYPE_FLOOR_SENSOR )
		this.DrawOnALayer( ctx, attached );
	}
	DrawBG( ctx, attached )
	{
		if ( this.type !== sdButton.TYPE_FLOOR_SENSOR )
		this.DrawOnALayer( ctx, attached );
	}
	
	DrawOnALayer( ctx, attached )
	{
		var activated = ( this.activated || ( sdShop.isDrawing && this.type !== sdButton.TYPE_FLOOR_SENSOR ) ) ? 3 : 2;
		
		let yy = this.type * 32;

		ctx.apply_shading = true;
		ctx.drawImageFilterCache( sdButton.img_button, 0,yy, 32,32,-16,-16,32,32 ); // TODO: Make the sprite look like a button
		
		ctx.apply_shading = false;
		ctx.drawImageFilterCache( sdButton.img_button, activated * 32,yy, 32,32,-16,-16,32,32 );
	}
	AddDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
	
		this.ExecuteContextCommand( this.activated ? 'UNPRESS_BUTTON' : 'PRESS_BUTTON', [], c, c._socket );
	}
	
	IsVehicle()
	{
		return true;
	}
	IsFakeVehicleForEKeyUsage()
	{
		return true;
	}
	
	MeasureMatterCost()
	{
		return 30;
	}
	
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}

export default sdButton;