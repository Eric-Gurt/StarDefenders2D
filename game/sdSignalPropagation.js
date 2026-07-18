
/*

	Shared downstream-signal propagation, used by anything that behaves like a boolean signal source
	on the cable network (sdButton presses, and sdNode AND-gate output changes).

	Extracted out of sdButton.SetActivated so sdNode's AND-gate type can drive the exact same
	doors/antigravity/turret/node behavior a button would, without duplicating ~150 lines of it.

	sdNode and sdButton are deliberately looked up via sdWorld.entity_classes instead of static
	imports, to avoid a three-way import cycle with sdButton.js/sdNode.js (both of which import
	this module).

*/

import sdWorld from './sdWorld.js';
import sdEntity from './entities/sdEntity.js';
import sdDoor from './entities/sdDoor.js';
import sdAntigravity from './entities/sdAntigravity.js';
import sdSampleBuilder from './entities/sdSampleBuilder.js';
import sdSteeringWheel from './entities/sdSteeringWheel.js';
import sdConveyor from './entities/sdConveyor.js';
import sdLiquidAbsorber from './entities/sdLiquidAbsorber.js';
import sdTurret from './entities/sdTurret.js';
import sdSound from './sdSound.js';

export function PropagateSignal( source, v ) // source is whatever originated this signal (sdButton, or an sdNode AND gate whose output flipped)
{
	const sdNode = sdWorld.entity_classes.sdNode;
	const sdButton = sdWorld.entity_classes.sdButton;

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

	let doors = source.FindObjectsInACableNetwork( null, sdDoor, true ); // { entity: sdEntity, path: [] }
	let entities_with_toggle_enabled = [
		...source.FindObjectsInACableNetwork( null, sdAntigravity, true ),
		...source.FindObjectsInACableNetwork( null, sdSampleBuilder, true ),
		...source.FindObjectsInACableNetwork( null, sdSteeringWheel, true ),
		...sdConveyor.AppendConnectedConveyorsToArray( source.FindObjectsInACableNetwork( null, sdConveyor, true ) ),
		...source.FindObjectsInACableNetwork( null, sdLiquidAbsorber, true )
	]; // { entity: sdEntity, path: [] }
	let nodes = source.FindObjectsInACableNetwork( null, sdNode, true );
	let turrets = source.FindObjectsInACableNetwork( null, sdTurret, true );

	// Prevents path building through BSUs, LRTPs etc. Only nodes are allowed
	const IsPathTraversable = ( path )=>
	{
		for ( let i2 = 1; i2 < path.length; i2++ ) // 0 is the source (button/sensor/gate)
		if ( !path[ i2 ].is( sdNode ) )
		return false;

		return true;
	};

	const MeasureDelayAndDo = ( path, ent, vv, then )=>
	{
		let delay = 0;

		for ( let i2 = 0; i2 < path.length; i2++ ) // 0 is the source (button/sensor/gate)
		{
			let node = path[ i2 ];

			let i2_copy = i2;
			//
			if ( node.is( sdNode ) )
			if ( node.type === sdNode.TYPE_SIGNAL_DELAYER )
			{
				setTimeout( ()=>
				{

					let fail = false;
					for ( let i2 = 0; i2 <= i2_copy; i2++ )
					if ( path[ i2 ]._is_being_removed )
					{
						fail = true;
						break;
					}

					if ( !fail )
					{
						node.variation = vv ? 1 : 2;
						node._update_version++;

						sdSound.PlaySound({ name:'sd_beacon_disarm', x:node.x, y:node.y, volume:0.5, pitch:8 });
					}
				}, delay );
				setTimeout( ()=>
				{
					if ( !node._is_being_removed )
					{
						node.variation = 0;
						node._update_version++;
					}
				}, delay + node.delay );


				delay += node.delay;
			}
		}

		if ( delay === 0 )
		then();
		else
		{
			setTimeout( ()=>{
				if ( !ent._is_being_removed )
				{
					let fail = false;
					for ( let i2 = 0; i2 < path.length; i2++ )
					if ( path[ i2 ]._is_being_removed )
					{
						fail = true;
						break;
					}

					if ( !fail )
					then();
				}
			}, delay );
		}
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

		MeasureDelayAndDo( path, door, vv, ()=>
		{
			door.open_type = sdDoor.OPEN_TYPE_BUTTON;

			// Keyed by the wired source's own net_id (not the door's), so each button/sensor/gate
			// wired to this door gets its own independent slot - one closing doesn't erase another's "open" vote
			let id = door._entities_within_sensor_area.indexOf( source._net_id );

			if ( vv )
			{
				if ( id === -1 )
				{
					door._entities_within_sensor_area.push( source._net_id );
					door.Open();

					door._owner = source._owner;
				}
			}
			else
			if ( id !== -1 )
			{
				door._entities_within_sensor_area.splice( id, 1 );
				door.opening_tim = 0.000001; // Micro value so sound can play

				door._owner = source._owner;
			}
		});
	}

	//trace( entities_with_toggle_enabled );
	for ( let i = 0; i < entities_with_toggle_enabled.length; i++ )
	{
		let antigravity = entities_with_toggle_enabled[ i ].entity;

		if ( antigravity._is_being_removed )
		continue;

		let path = entities_with_toggle_enabled[ i ].path;

		let vv = GetFlipLogic( path );

		if ( vv === undefined )
		continue;

		if ( !IsPathTraversable( path ) )
		continue;

		MeasureDelayAndDo( path, antigravity, vv, ()=>
		{
			if ( typeof antigravity._update_version !== 'undefined' )
			antigravity._update_version++;

			if ( typeof antigravity._toggle_source_current !== 'undefined' )
			{
				if ( antigravity._toggle_source_current && !antigravity._toggle_source_current._is_being_removed )
				antigravity._toggle_source_current.SetActivated( false );

				antigravity._toggle_source_current = vv ? source : null;
			}

			if ( typeof antigravity._toggle_direction_current !== 'undefined' )
			{
				antigravity._toggle_direction_current = null;
				for ( let i = path.length - 1; i >= 0; i-- )
				{
					let e = path[ i ]
					if ( ( e.is( sdButton ) && ( e.kind >= sdButton.BUTTON_KIND_TAP_UP && e.kind <= sdButton.BUTTON_KIND_TAP_RIGHT ) ) ||
						 ( e.is( sdNode ) && ( e.type === sdNode.TYPE_SIGNAL_TURRET_ENABLER ) ))
					{
						antigravity._toggle_direction_current = e;
						break;
					}
				}
			}


			antigravity.toggle_enabled = vv;
			antigravity.onToggleEnabledChange();

			if ( vv )
			{
				antigravity.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

				if ( typeof antigravity._owner !== 'undefined' )
				antigravity._owner = source._owner;

				if ( typeof antigravity.owner !== 'undefined' )
				antigravity.owner = source.owner;
			}
		});
	}
	for ( let i = 0; i < turrets.length; i++ )
	{
		let turret = turrets[ i ].entity;

		if ( turret._is_being_removed )
		continue;

		let path = turrets[ i ].path;

		let vv = GetFlipLogic( path );

		if ( vv === undefined )
		continue;

		if ( !IsPathTraversable( path ) )
		continue;


		MeasureDelayAndDo( path, turret, vv, ()=>
		{
			turret._update_version++;

			if ( vv )
			{
				// Find last node and use its' direction
				for ( let i = path.length - 1; i >= 0; i-- )
				{
					let node = path[ i ];
					if ( node.is( sdNode ) )
					{
						if ( node.type === sdNode.TYPE_SIGNAL_TURRET_ENABLER )
						{
							turret.auto_attack = node.variation;
							turret._auto_attack_reference = node;
							break;
						}
					}
				}

				turret.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

				if ( turret.kind !== sdTurret.KIND_AUTO_CABLE )
				turret._owner = source._owner;
			}
			else
			{
				for ( let i = path.length - 1; i >= 0; i-- )
				{
					let node = path[ i ];
					if ( node.is( sdNode ) )

					if ( turret.kind === sdTurret.KIND_AUTO_CABLE && node.type === sdNode.TYPE_SIGNAL_FLIPPER )  // Disconnect all cables that were created by it in case of signal flipping node
					{
						for ( const cable of turret._built_cables )
						{
							if ( cable && !cable._is_being_removed )
							cable.remove();
						}
						turret._built_cables = [];
					}
					else
					turret.auto_attack = -1;
					turret._auto_attack_reference = null;
				}
			}
		});
	}


	// Then burn all the one-time nodes
	for ( let i = 0; i < nodes_to_switch_off.length; i++ )
	{
		let node = nodes_to_switch_off[ i ];

		node.type = sdNode.TYPE_SIGNAL_ONCE_OFF;
		node._update_version++;
	}

	// Cascade into any AND-gate cable nodes reachable from here - they re-derive their own
	// output from their live inputs, so this just nudges them to check again right now
	// instead of waiting for their throttled self-check.
	for ( let i = 0; i < nodes.length; i++ )
	{
		let node = nodes[ i ].entity;

		if ( node._is_being_removed )
		continue;

		if ( node === source )
		continue;

		if ( node.type === sdNode.TYPE_SIGNAL_AND_GATE )
		node.Reevaluate();
	}
}

export default PropagateSignal;
