/*

	Something that controls almost any creature (tells whether to dig, attack or walk/jump).

	Test (type at client's console on DevTools):

		new sdPathFinding({ target: sdWorld.my_entity, traveler:  sdWorld.my_entity, options:[sdPathFinding.OPTION_CAN_CRAWL, sdPathFinding.OPTION_CAN_SWIM] });

		new sdPathFinding({ target: sdWorld.my_entity, traveler:  sdWorld.my_entity, options:[sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS, sdPathFinding.OPTION_CAN_SWIM] });


	BUG: sdBadDog keeps running right when standing on sdCom at test map, even when client-side simulation says it should go left. Issue in navigation when 9 cells are tested?

*/



/* global Infinity, globalThis */

import sdWorld from '../sdWorld.js';
import sdCom from '../entities/sdCom.js';
import sdWater from '../entities/sdWater.js';

const ALLOW_AI_IMPORVEMENT_WARNINGS = false;

class sdPathFinding
{
	static init_class()
	{
		/*sdPathFinding.MOVEMENT_MODEL_CHARACTER = {
			moves:
			[
				{
					dx: -1,
					dy: 0,
					cost: 1,
					through_wall: false,
					action: ( entity, GSPEED )=>
					{
						entity.
					}
				}
			]
		};*/
		
		// x2 each time
		sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS = 1;
		sdPathFinding.OPTION_CAN_FLY = 2;
		sdPathFinding.OPTION_CAN_CRAWL = 4; // Crawl up the walls
		sdPathFinding.OPTION_CAN_SWIM = 8;
		
		sdPathFinding.allow_client_side = false;
		
		sdPathFinding.exist_until_extra_time = 7000; // 5000 was not enough by something like 860 ms, 1326 ms
		
		sdPathFinding.max_range_from_target = 2048; // Could be too small? But also smaller range is saving on memory (there is one range map per each target, meaning multiple travelers will reuse same map)
		
		//sdPathFinding.STRATEGY_FOLLOW = 1;
		
		sdPathFinding.rect_space_maps_by_entity = new WeakMap(); // entity => [ RectSpaceMap, RectSpaceMap, RectSpaceMap... ]
		sdPathFinding.rect_space_maps = [];
		
		sdWorld.static_think_methods.push( sdPathFinding.StaticThink );
	}
	
	constructor( params )
	{
		this.target = null;
		this.rect_space_map = null; // Rect space map of target entity
		
		this.control_pattern = { act_x:0, act_y:0, look_x:0, look_y:0, attack_target:null }; // Reusable object that is returned as a result of Think call
		
		this.params = params; // Will be used to recreate

		this.Reinit();
		
		this.traveler = params.traveler;
		
		this.attack_range = params.attack_range || 0;
		
		this.next_line_of_sight_test = 0;
		this.last_line_of_sight_test_result = false;
		
		if ( !this.traveler )
		throw new Error('sdPathFinding needs to know who\'s movement it controls (.traveler is not passed to constructor)');
	}
	
	Reinit()
	{
		let params = this.params;
		
		if ( params.target )
		if ( sdWorld.inDist2D_Boolean( params.traveler.x, params.traveler.y, params.target.x, params.target.y, sdPathFinding.max_range_from_target ) )
		{
			this.target = params.target;
			
			//let rect_space_map = new RectSpaceMap( this.target, false );
			let rect_space_map = null;
			
			let space_maps_by_entity = sdPathFinding.rect_space_maps_by_entity.get( this.target );
			
			if ( space_maps_by_entity === undefined )
			{
				space_maps_by_entity = [];
				
				sdPathFinding.rect_space_maps_by_entity.set( this.target, space_maps_by_entity );
			}
			
			let hash = 0;
			
			let options = params.options || [];
			
			for ( let i = 0; i < options.lenth; i++ )
			hash += options[ i ];
			
			for ( let i = 0; i < space_maps_by_entity.length; i++ )
			if ( space_maps_by_entity[ i ].hash === hash )
			{
				rect_space_map = space_maps_by_entity[ i ];
				break;
			}
			
			if ( !rect_space_map )
			{
				rect_space_map = new RectSpaceMap( this.target, options, hash );
				
				space_maps_by_entity.push( rect_space_map );

				sdPathFinding.rect_space_maps.push( rect_space_map );
			}
			
			this.rect_space_map = rect_space_map;
		}
	}
	
	Think( GSPEED )
	{
		if ( !sdWorld.is_server && !sdPathFinding.allow_client_side )
		return this.control_pattern;
	
		if ( this.rect_space_map === null ) // This will happen if target was never near within sdPathFinding.max_range_from_target range from traveler
		return null;
			
		if ( this.rect_space_map._is_being_removed )
		{
			// Can cause stop of follow towards simple coordinates
			if ( this.target )
			{
				if ( !this.target._is_being_removed )
				{
					if ( ALLOW_AI_IMPORVEMENT_WARNINGS )
					if ( sdWorld.time - this.rect_space_map.exist_until < 30000 )
					console.warn( '[1] rect_space_map has already expired - possibly inefficient usage of pathfinding. Will recreate (expired by '+( sdWorld.time - this.rect_space_map.exist_until )+'ms)' );
			
					this.Reinit();
				}
				else
				return null;
			}
			else
			{
				if ( ALLOW_AI_IMPORVEMENT_WARNINGS )
				if ( sdWorld.time - this.rect_space_map.exist_until < 30000 )
				console.warn( '[2] rect_space_map has already expired - possibly inefficient usage of pathfinding. Will recreate (expired by '+( sdWorld.time - this.rect_space_map.exist_until )+'ms)' );
		
				this.Reinit();
			}
		}
		/*if ( !globalThis.Pathfuinding_debug )
		{
			console.warn('Pathfuinding is disabled -- in progress');
			globalThis.Pathfuinding_debug = true;
		}
		return null;*/
		
		this.rect_space_map.exist_until = sdWorld.time + sdPathFinding.exist_until_extra_time;
		
		// TODO: Return preferred action or maybe even simply move traveler in some optimized way towards .target (without actual hit detections of any kind, at least on server) while triggering collision events?
		
		if ( this.attack_range > 0 )
		if ( sdWorld.Dist2D_Vector( this.traveler.x - this.target.x, this.traveler.y - this.target.y ) < this.attack_range )
		{
			if ( sdWorld.time > this.next_line_of_sight_test )
			{
				this.next_line_of_sight_test = sdWorld.time + 100 + Math.random() * 200;
				this.last_line_of_sight_test_result = sdWorld.CheckLineOfSight( this.traveler.x, this.traveler.y, this.target.x, this.target.y, null, null, sdCom.com_visibility_unignored_classes, null );
			}
			
			if ( this.last_line_of_sight_test_result )
			{
				this.control_pattern.act_x = 0;
				this.control_pattern.act_y = 0;

				this.control_pattern.look_x = this.target.x;
				this.control_pattern.look_y = this.target.y;

				this.control_pattern.attack_target = this.target;

				return this.control_pattern;
			}
		}
		
		let best_dx = 0;
		let best_dy = 0;
		let best_di = Infinity;
		let best_is_wall = null;
		
		let offset_current = this.rect_space_map.GetBitOffsetFromXY( this.traveler.x, this.traveler.y );

		let version_at_traveler = this.rect_space_map.bitmap_dataView.getUint32( BYTES_PER_VALUE * ( offset_current + OFFSET_VERSION ) );
		
		//let hitbox_radius = Math.max( Math.abs( this.traveler._hitbox_x2 ), Math.abs( this.traveler._hitbox_x1 ), Math.abs( this.traveler._hitbox_y2 ), Math.abs( this.traveler._hitbox_y1 ) );
		
		//trace( hitbox_radius, test_positions_scale );
		
		for ( let dx = -1; dx <= 1; dx++ )
		for ( let dy = -1; dy <= 1; dy++ )
		if ( dx !== 0 || dy !== 0 )
		{
			let offset = this.rect_space_map.GetBitOffsetFromXY( this.traveler.x + dx * 16, this.traveler.y + dy * 16 );
			let di = this.rect_space_map.bitmap_dataView.getUint16( BYTES_PER_VALUE * ( offset + OFFSET_DISTANCE_TO_TARGET ) );
			
			if ( di !== 0 )
			if ( di < best_di || ( di === best_di && ( Math.abs( dx ) < Math.abs( best_dx ) || Math.abs( dy ) < Math.abs( best_dy ) ) ) ) // Also prefer non-diagonal moves
			{
				best_di = di;
				best_dx = dx;
				best_dy = dy;
				
				//let x = Math.floor( this.traveler.x / 16 + dx ) * 16;
				//let y = Math.floor( this.traveler.y / 16 + dy ) * 16;
				
				best_is_wall = null;
				//if ( sdWorld.CheckWallExistsBox( x + 1, y + 1, x + 15, y + 15, null, null, sdCom.com_visibility_unignored_classes, null ) )
				//if ( sdWorld.CheckWallExistsBox( x + 1, y + 1, x + 15, y + 15, this.traveler, null, null, null ) ) // Attack anything really - there can be even crystals on a way
				if ( sdWorld.CheckWallExistsBox( 
						this.traveler.x + this.traveler._hitbox_x1 + dx * 16 + 1, 
						this.traveler.y + this.traveler._hitbox_y1 + dy * 16 + 1, 
						this.traveler.x + this.traveler._hitbox_x2 + dx * 16 - 1, 
						this.traveler.y + this.traveler._hitbox_y2 + dy * 16 - 1, 
						this.traveler, null, null, null ) ) // Attack anything really - there can be even crystals in a way
				{
					best_is_wall = sdWorld.last_hit_entity;
				}
			}
		}
		
		// Make sure position is updated if some long no-solve rest happened
		if ( sdWorld.time > this.rect_space_map.solve_until )
		{
			this.rect_space_map.UpdateTargetPosition();
		}
		
		if ( ( best_dx === 0 && best_dy === 0 ) || version_at_traveler !== this.rect_space_map.version )
		{
			if ( sdWorld.time > this.rect_space_map.solve_until - 1000 || // Keep in runnin if nobody needs it
				 Math.random() < 0.1 ) // In case if there is more than one traveler
			{
				this.rect_space_map.solve_until = sdWorld.time + sdPathFinding.exist_until_extra_time;
				this.rect_space_map.solve_near_x = this.traveler.x;
				this.rect_space_map.solve_near_y = this.traveler.y;
			}
		}
		
		if ( best_dx !== 0 || best_dy !== 0 )
		{
			let xx = Math.floor( this.traveler.x / 16 ) * 16;
			let yy = Math.floor( this.traveler.y / 16 ) * 16;
			
			// Make sure it fits cell. If not - aim at center of cell edge
			if ( this.traveler.x + this.traveler._hitbox_x1 < xx || this.traveler.x + this.traveler._hitbox_x2 > xx + 16 )
            best_dx = xx + 8 + best_dx * 16 - this.traveler.x;
		
			if ( this.traveler.y + this.traveler._hitbox_y1 < yy || this.traveler.y + this.traveler._hitbox_y2 > yy + 16 )
            best_dy = yy + 8 + best_dy * 16 - this.traveler.y;
			
			//if ( best_dx !== 0 && best_dy !== 0 )
			if ( best_dx !== 0 || best_dy !== 0 )
			{
				let di = Math.max( 1, sdWorld.Dist2D_Vector( best_dx, best_dy ) );
				best_dx = best_dx / di;
				best_dy = best_dy / di;
			}
			
			this.control_pattern.act_x = best_dx;
			this.control_pattern.act_y = best_dy;
			
			this.control_pattern.look_x = this.traveler.x + best_dx * 32;
			this.control_pattern.look_y = this.traveler.y + best_dy * 32;
			
			if ( this.rect_space_map.can_dig )
			this.control_pattern.attack_target = best_is_wall;
			else
			this.control_pattern.attack_target = null;
			
			return this.control_pattern;
		}
		return null;
	}
	
	static StaticThink( GSPEED )
	{
		if ( sdWorld.is_server || sdPathFinding.allow_client_side )
		{
			let iterations = Math.ceil( sdPathFinding.rect_space_maps.length / 10 ); // 5 was really fast // 10 seems like 0.01% which is also very good, though it will be more with more targets
			
			for ( let i = 0; i < sdPathFinding.rect_space_maps.length; i++ )
			{
				let rect_space_map = sdPathFinding.rect_space_maps[ i ];

				if ( rect_space_map.Iteration( iterations ) )
				{
					rect_space_map._is_being_removed = true;

					let space_maps_by_entity = sdPathFinding.rect_space_maps_by_entity.get( rect_space_map.target );
					
					if ( space_maps_by_entity ) // For some reason it does happen to be undefined, but very rarely
					{
						let i2 = space_maps_by_entity.indexOf( rect_space_map );
						if ( i2 !== -1 )
						space_maps_by_entity.splice( i2, 1 );
						else
						debugger;

						if ( space_maps_by_entity.length === 0 )
						sdPathFinding.rect_space_maps_by_entity.delete( rect_space_map.target );
					}

					sdPathFinding.rect_space_maps.splice( i, 1 );
					i--;
					continue;
				}
			}
		}
	}
	
	static StaticRender( ctx )
	{
		const sdRenderer = globalThis.sdRenderer;
		
		if ( sdPathFinding.allow_client_side )
		for ( let i = 0; i < sdPathFinding.rect_space_maps.length; i++ )
		{
			let rect_space_map = sdPathFinding.rect_space_maps[ i ];
			
			let offset_x = Math.floor( ( sdWorld.camera.x - sdRenderer.screen_width / 2 / sdWorld.camera.scale ) / 16 );
			let offset_y = Math.floor( ( sdWorld.camera.y - sdRenderer.screen_height / 2 / sdWorld.camera.scale ) / 16 );
			
			let w = Math.ceil( sdRenderer.screen_width / 16 );
			let h = Math.ceil( sdRenderer.screen_height / 16 );
			
			ctx.globalAlpha = 0.5;
				
			for ( let y = 0; y < h; y++ )
			for ( let x = 0; x < w; x++ )
			{
				let offset = rect_space_map.GetBitOffsetFromXY( ( offset_x + x ) * 16, ( offset_y + y ) * 16 );
				let distance = -1;
				let draw_quad = true;
				
				if ( offset === 0 ) // Out of bounds or actually 0
				{
					ctx.fillStyle = '#0000ff';
				}
				else
				{
					distance = rect_space_map.bitmap_dataView.getUint16( BYTES_PER_VALUE * ( offset + OFFSET_DISTANCE_TO_TARGET ) );
					
					if ( distance > 0 )
					{
						//ctx.fillStyle = '#ff0000';
						ctx.fillStyle = `rgb(${distance%256},0,0)`;
					}
					else
					{
						//continue;
						draw_quad = false;
					}
				}
				
				if ( draw_quad )
				{
					ctx.fillRect( ( offset_x + x ) * 16 + 1, ( offset_y + y ) * 16 + 1, 14, 14 );

					ctx.font = "4px Verdana";
					ctx.textAlign = 'center';
					ctx.fillStyle = '#ffffff';
					ctx.fillText( distance+'', ( offset_x + x ) * 16 + 8, ( offset_y + y ) * 16 + 8 );
				}
			}
			/*
			for ( let r = 0; r < rect_space_map.rects.length; r++ )
			{
				let rect = rect_space_map.rects[ r ];
				
				ctx.globalAlpha = 0.5;

				ctx.fillStyle = rect.is_ground ? '#0000ff' : '#ff0000';
				ctx.fillRect( rect.x1 + 1, rect.y1 + 1, rect.x2 - rect.x1 - 2, rect.y2 - rect.y1 - 2 );
				
				ctx.font = "5.5px Verdana";
				ctx.textAlign = 'center';
				ctx.fillStyle = '#ffffff';
				ctx.fillText( rect.distance_to_target+'', (rect.x1+rect.x2)/2, (rect.y1+rect.y2)/2 );
			}*/
		}
	}
}

const BYTES_PER_VALUE = 1; // Obsolete 2; // uint16 is 2 bytes

const DATA_PER_CELL = 7; // Bytes per cell (sum of all values below)
const OFFSET_DISTANCE_TO_TARGET = 0; // uint16 = 2 bytes // 0 - undefined, 1+ - means distance from this cell towards cell with target. Pathfinding then would scan nearby cells and go towards smallest value that is not 0
const OFFSET_VERSION = 2; // uint32 = 4 bytes // Updates every time target moves. Is a reason of all cells to be slowly recalculated
const OFFSET_IS_FULLY_SOLVED = 6; // uint8 = 1 byte // 0 or 1 // When cell already dealt with all nearby cells and received/sent optimized distance to target

const COST_MOVE = 1;
const COST_BREAK_WALL = 11;
const COST_SWIM = 3;
//const COST_FLY = 3;

// Slowly built around each target so travelers can reach it
class RectSpaceMap
{
	constructor( ent, options, hash )
	{
		this.hash = hash;
		//this.options = options;
		
		this.active_bits_set = undefined;
		
		this.target = ent;
		this.can_dig = options.indexOf( sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS ) !== -1;
		this.can_fly = options.indexOf( sdPathFinding.OPTION_CAN_FLY ) !== -1;
		this.can_crawl = options.indexOf( sdPathFinding.OPTION_CAN_CRAWL ) !== -1;
		this.can_swim = options.indexOf( sdPathFinding.OPTION_CAN_SWIM ) !== -1;
		
		this.exist_until = sdWorld.time + sdPathFinding.exist_until_extra_time;
		
		this.solve_until = sdWorld.time + sdPathFinding.exist_until_extra_time;
		this.solve_near_x = 0;
		this.solve_near_y = 0;
		
		this._is_being_removed = false;
		
		this.Reinit();
	}
	
	Reinit()
	{
		// TODO: Somehow prioritize rect Iterating for those that are closest to known travelers
		
		//if ( sdWorld.server_config.enable_bounds_move )
		//{
			this.x1 = Math.floor( ( this.target.x - sdPathFinding.max_range_from_target ) / 16 ) * 16;
			this.y1 = Math.floor( ( this.target.y - sdPathFinding.max_range_from_target ) / 16 ) * 16;
			this.x2 = Math.floor( ( this.target.x + sdPathFinding.max_range_from_target ) / 16 ) * 16;
			this.y2 = Math.floor( ( this.target.y + sdPathFinding.max_range_from_target ) / 16 ) * 16;
		/*}
		else
		{
			this.x1 = sdWorld.world_bounds.x1;
			this.y1 = sdWorld.world_bounds.y1;
			this.x2 = sdWorld.world_bounds.x2;
			this.y2 = sdWorld.world_bounds.y2;
		}*/
		
		this.w = Math.floor( ( this.x2 - this.x1 ) / 16 );
		this.h = Math.floor( ( this.y2 - this.y1 ) / 16 );
		
		if ( sdWorld.is_server || sdPathFinding.allow_client_side )
		{
			// Nothing can work faster than these in v8's JS (arrays and objects as slow)
			this.bitmap = new ArrayBuffer( this.w * this.h * DATA_PER_CELL * BYTES_PER_VALUE );
			this.bitmap_dataView = new DataView( this.bitmap );

			this.active_bits_arr = []; // arr of { offset, x, y }, will be reordered to favor closest cells to travelers
			this.active_bits_set = new Set(); // Same but offsets are keys
		}
		
		/*this.active_bits = []; // Where iterative calculation should happen. This is an offset
		this.active_bits_x = []; // Same as above but X
		this.active_bits_y = []; // Same as above but Y*/
		
		this.version = 0; // Version might go up every time target moves from rect to rect. Then all versions of all rects and towards_target-s will be updated.
		
		this.last_player_offset = -1;
		
		if ( sdWorld.is_server || sdPathFinding.allow_client_side )
		{
			this.UpdateTargetPosition();
		}
	}
	
	ScheduleCellUpdate( offset, x, y )
	{
		if ( !this.active_bits_set.has( offset ) )
		{
			this.active_bits_set.add( offset );
			this.active_bits_arr.push({ offset:offset, x:x, y:y, di:-1 });
		}
	}
	
	MarkAsDistanceToTarget( offset, x, y, distance )
	{
		this.ScheduleCellUpdate( offset, x, y );
		
		// uint16 max value is 65535
		this.bitmap_dataView.setUint16( BYTES_PER_VALUE * ( offset + OFFSET_DISTANCE_TO_TARGET ), distance ); // Distance limit is 65535 cells * 16 px = 1048560 px
		this.bitmap_dataView.setUint32( BYTES_PER_VALUE * ( offset + OFFSET_VERSION ), this.version );
		this.bitmap_dataView.setUint8( BYTES_PER_VALUE * ( offset + OFFSET_IS_FULLY_SOLVED ), 0 );
	}
	
	UpdateTargetPosition()
	{
		let x = Math.floor( ( this.target.x + ( this.target._hitbox_x1 + this.target._hitbox_x2 ) / 2 ) / 16 ) * 16;
		let y = Math.floor( ( this.target.y + ( this.target._hitbox_y1 + this.target._hitbox_y2 ) / 2 ) / 16 ) * 16;
		let offset = this.GetBitOffsetFromXY( x, y );
		
		if ( this.last_player_offset !== offset )
		//if ( this.last_player_offset !== offset || this.active_bits_arr.length === 0 ) // Keep pinging?
		{
			this.last_player_offset = offset;
			
			this.version = this.version + 1;//( this.version + 1 ) % 65535; // Likely to never loop
			
			this.MarkAsDistanceToTarget( offset, x, y, 1 );
			/*this.MarkAsDistanceToTarget( this.GetBitOffsetFromXY( x-16, y ), x-16, y, 2 ); Kind of bad as it paints unreachable walls as accessible, then it makes drones to stuck at this place
			this.MarkAsDistanceToTarget( this.GetBitOffsetFromXY( x+16, y ), x+16, y, 2 );
			this.MarkAsDistanceToTarget( this.GetBitOffsetFromXY( x, y-16 ), x, y-16, 2 );
			this.MarkAsDistanceToTarget( this.GetBitOffsetFromXY( x, y+16 ), x, y+16, 2 );*/
		}
	}
	
	GetBitOffsetFromXY( _x, _y )
	{
		let x = Math.floor( ( _x - this.x1 ) / 16 );
		let y = Math.floor( ( _y - this.y1 ) / 16 );
		
		//x -=  / 16;
		//y -= this.y1 / 16;
		
		//if ( x < this.x1 || y < this.y1 || x >= this.x2 || y > this.y2 )
		if ( x < 0 || y < 0 || x >= this.w || y >= this.h )
		{
			if ( isNaN( x ) )
			{
				debugger;
				x = 0;
			}
			
			if ( isNaN( y ) )
			{
				debugger;
				y = 0;
			}
		
			//if ( sdWorld.server_config.enable_bounds_move )
			//{
				if ( Math.abs( this.target.x - ( this.x1 + this.x2 ) / 2 ) > sdPathFinding.max_range_from_target * 0.25 ||
					 Math.abs( this.target.y - ( this.y1 + this.y2 ) / 2 ) > sdPathFinding.max_range_from_target * 0.25 )
				{
					this.Reinit();
					return this.GetBitOffsetFromXY( _x, _y );
				}
			/*}
			else
			if ( _x >= sdWorld.world_bounds.x1 )
			if ( _x < sdWorld.world_bounds.x2 )
			if ( _y >= sdWorld.world_bounds.y1 )
			if ( _y < sdWorld.world_bounds.y2 )
			{
				trace( 'Pathfinding issue - bit offset detection outside of rect space map is not yet implemented. So far it will happen when target moves out of playable area or world bounds shift. Whole RectSpaceMap will be simply reinitialized when this happens. Coordinates: '+_x+', '+_y );
				//throw new Error( 'Pathfinding issue - bit offset detection outside of rect space map is not yet implemented. So far it will happen when target moves out of playable are or world bounds shift. Whole RectSpaceMap can be simply reinitialized when this happens probably. Coordinates: '+_x+', '+_y );

				this.Reinit();
				return this.GetBitOffsetFromXY( _x, _y );
			}*/
			
			//debugger;
			return 0;
		}
		
		return ( y * this.w + x ) * DATA_PER_CELL * BYTES_PER_VALUE;
	}
	
	GetXYFromBitOffset( offset )
	{
		offset /= DATA_PER_CELL * BYTES_PER_VALUE;
		return [ ( offset % this.w ) * 16 + this.x1, Math.floor( offset / this.w ) * 16 + this.y1 ];
	}
	
	Iteration( active_bits_to_handle )
	{
		if ( this.target._is_being_removed )
		return true; // Delete
	
		// Removal logic for case when nobody is looking for target for few seconds
		if ( sdWorld.time > this.exist_until )
		return true;
	
		//let v = { x:0, y:0 };
		
		// Disable any iteration logic if all travelers have cell with path AND travelers are on cells that have same version as this whole RectSpaceMap
		if ( sdWorld.time < this.solve_until )
		{
			//let active_bits_to_handle = 5;//Math.ceil( this.active_bits.length * 0.1 );

			// Check if target moved from previous cell and if so - update version and add new active cell
			this.UpdateTargetPosition();

			for ( let b = 0; b < this.active_bits_arr.length; b++ )
			{
				let obj = this.active_bits_arr[ b ];
				
				if ( !sdWorld.inDist2D_Boolean( obj.x, obj.y, this.target.x, this.target.y, sdPathFinding.max_range_from_target ) ) // Segment distance is impossible because traveler is unknown here
				{
					//trace( 'Trying to reach target that is way too far' );
					//debugger;
					continue;
				}
				
				if ( active_bits_to_handle-- <= 0 )
				break;

				this.active_bits_arr.splice( b, 1 );
				b--;
				//let obj = this.active_bits_arr.shift();
				
				this.active_bits_set.delete( obj.offset );

				let offset = obj.offset;
				let active_cell_x = obj.x;
				let active_cell_y = obj.y;

				let active_cell_is_wall = sdWorld.CheckWallExistsBox( active_cell_x + 1, active_cell_y + 1, active_cell_x + 15, active_cell_y + 15, null, null, sdCom.com_visibility_unignored_classes, null );

				if ( active_cell_is_wall )
				if ( !this.can_dig )
				{
					continue;
				}
				
				let active_cell_is_water = sdWater.GetWaterObjectAt( active_cell_x, active_cell_y );
				active_cell_is_water = active_cell_is_water ? active_cell_is_water.type === sdWater.TYPE_WATER : false;
				
				if ( active_cell_is_water )
				if ( !this.can_swim )
				{
					if ( !sdWater.GetWaterObjectAt( active_cell_x, active_cell_y + 16 ) ) // Not even water object under him
					continue;
				}
				
				let active_cell_cost = ( active_cell_is_wall ? COST_BREAK_WALL : COST_MOVE );

				let active_cell_version = this.bitmap_dataView.getUint32( BYTES_PER_VALUE * ( offset + OFFSET_VERSION ) );

				let active_cell_distance = this.bitmap_dataView.getUint16( BYTES_PER_VALUE * ( offset + OFFSET_DISTANCE_TO_TARGET ) );


				for ( let d = 0; d < 4; d++ )
				{
					let x = active_cell_x;
					let y = active_cell_y;
					if ( d === 0 )
					{
						x -= 16;
						if ( x < this.x1 )
						continue;
					}
					else
					if ( d === 1 )
					{
						x += 16;
						if ( x >= this.x2 )
						continue;
					}
					else
					if ( d === 2 )
					{
						y -= 16;
						if ( y < this.y1 )
						continue;
					}
					else
					if ( d === 3 )
					{
						y += 16;
						if ( y >= this.y2 )
						continue;
					}

					let offset_nearby = this.GetBitOffsetFromXY( x, y );
					let nearby_is_wall = sdWorld.CheckWallExistsBox( x + 1, y + 1, x + 15, y + 15, null, null, sdCom.com_visibility_unignored_classes, null );
					let nearby_wall = sdWorld.last_hit_entity;
					//sdWorld.SendEffect({ x: x + 8, y: y + 8, type:sdWorld.entity_classes.sdEffect.TYPE_WALL_HIT });
					
					let nearby_is_water = sdWater.GetWaterObjectAt( x, y );
					nearby_is_water = nearby_is_water ? nearby_is_water.type === sdWater.TYPE_WATER : false;

					if ( nearby_is_water )
					if ( !this.can_swim )
					{
						if ( !sdWater.GetWaterObjectAt( x, y + 16 ) ) // Not even water object under him. Important to build water leaving logic
						continue;
					}
					
					if ( nearby_is_wall )
					{
						if ( !this.can_dig || 
							 ( nearby_wall && typeof nearby_wall._shielded !== 'undefined' && nearby_wall._shielded && !nearby_wall._shielded._is_being_removed && nearby_wall._shielded.enabled ) // Digging mobs should not try to dig through base shielding units it seems like
							)
						{
							continue;
						}
					}
					else
					{
						if ( this.can_fly || ( nearby_is_water && this.can_swim ) )
						{

						}
						else
						{
							if ( d === 2 ) // Only upwards (because any cell can be reached from above
							{

							}
							else
							{
								if ( this.can_crawl )
								{
									if ( sdWorld.CheckWallExistsBox( x - 1, y + 1, x + 17, y + 17 + 16, null, null, sdCom.com_visibility_unignored_classes, null ) )
									{
									}
									else
									{
										continue;
									}
								}
								else
								{
									// Or if near ground, but no wall in cell around fall
									if ( sdWorld.CheckWallExistsBox( x + 1, y + 1, x + 15, y + 15 + 32, null, null, sdCom.com_visibility_unignored_classes, null ) /*&&
										 !sdWorld.CheckWallExistsBox( x - 1, y + 1, x + 17, y + 15, null, null, sdCom.com_visibility_unignored_classes, null )*/ )
									{
									}
									else
									{
										/*if ( this.can_crawl )
										{
											sdWorld.CheckWallExistsBox( x - 1, y + 1, x + 18, y + 15, null, null, sdCom.com_visibility_unignored_classes, null )
										}
										else
										{*/
											continue;
										//}
									}
								}
							}
						}
					}
					
					let nearby_cost = ( nearby_is_wall ? COST_BREAK_WALL : COST_MOVE );

					let nearby_version = this.bitmap_dataView.getUint32( BYTES_PER_VALUE * ( offset_nearby + OFFSET_VERSION ) );

					let nearby_distance = this.bitmap_dataView.getUint16( BYTES_PER_VALUE * ( offset_nearby + OFFSET_DISTANCE_TO_TARGET ) );

					// Rule: Sometimes it will be +10 instead of +1, but only when nearby cell is in the wall. Only entrance into cell counts as extra distance penalty.
					// Basically leaving wall does not have penalty, but entering wall has penalty.

					if ( nearby_version < active_cell_version )
					{
						// Update version and set distance for nearby cell as current +1
						this.bitmap_dataView.setUint16( BYTES_PER_VALUE * ( offset_nearby + OFFSET_DISTANCE_TO_TARGET ), active_cell_distance + nearby_cost );

						this.bitmap_dataView.setUint32( BYTES_PER_VALUE * ( offset_nearby + OFFSET_VERSION ), active_cell_version );

						// Add nearby cell to .active_bits
						this.ScheduleCellUpdate( offset_nearby, x, y );
					}
					else
					if ( nearby_version === active_cell_version )
					{
						// Same version, can either take near cell's path distance as +1 or give own path distance as +1

						// Add to .active_bits either this or near cell again if they did exchange path distances. If not - continue to another nearby cell

						if ( nearby_distance === active_cell_distance )
						{
							// Nothing to do here, they are equally close
						}
						else
						{
							if ( nearby_distance < active_cell_distance )
							{
								// Nearby is closer
								if ( nearby_distance + active_cell_cost < active_cell_distance )
								{
									active_cell_distance = nearby_distance + active_cell_cost;

									this.bitmap_dataView.setUint16( BYTES_PER_VALUE * ( offset + OFFSET_DISTANCE_TO_TARGET ), active_cell_distance );

									this.ScheduleCellUpdate( offset, active_cell_x, active_cell_y );
								}
							}
							else
							{
								// Active is closer
								if ( active_cell_distance + nearby_cost < nearby_distance )
								{
									nearby_distance = active_cell_distance + nearby_cost;

									this.bitmap_dataView.setUint16( BYTES_PER_VALUE * ( offset_nearby + OFFSET_DISTANCE_TO_TARGET ), nearby_distance );

									this.ScheduleCellUpdate( offset_nearby, x, y );
								}
							}
						}
					}
					else
					{
						// Newer version cell found - it is a sign to simply remove this cell from active cells and any logic will be done by newer cell anyway
						break;
					}
				}
			}

			// Sort active cells by being close to travelers so we get faster path build where it needs to be built. Maybe also prioritize greatly active cells that have higher version (by ranking down any cell with (this.version - cell_version)*5 )
			for ( let i = 0; i < this.active_bits_arr.length; i++ )
			{
				let obj = this.active_bits_arr[ i ];
				obj.di = sdWorld.Dist2D_Vector_pow2( obj.x + 8 - this.solve_near_x, obj.y + 8 - this.solve_near_y );
			}
			this.active_bits_arr.sort( this.SortCompare );
		}
		
		return false; // Keep
	}
	
	SortCompare( a, b )
	{
		return a.di - b.di;
	}
}	
/*
// Slowly built around each target so travelers can reach it
class RectSpaceMap
{
	constructor( ent, can_dig=false )
	{
		// TODO: Somehow prioritize rect Iterating for those that are closest to known travelers
		
		this.rects = [];
		
		this.target = ent;
		
		this.version = 0; // Version might go up every time target moves from rect to rect. Then all versions of all rects and towards_target-s will be updated.
		
		this.can_dig = can_dig;
		
		this.exist_until = sdWorld.time + sdPathFinding.exist_until_extra_time;
	}
	
	Iteration( GSPEED )
	{
		if ( this.target._is_being_removed )
		return true; // Delete
	
		// TODO: Add logic for case when nobody is looking of it for few seconds
		
		if ( this.rects.length === 0 )
		{
			// Start from first rect then grow
			
			this.rects.push( new Rect( 
					Math.floor( ( this.target.x + this.target._hitbox_x1 ) / 16 ) * 16, 
					Math.floor( ( this.target.y + this.target._hitbox_y1 ) / 16 ) * 16, 
					Math.ceil( ( this.target.x + this.target._hitbox_x2 ) / 16 ) * 16, 
					Math.ceil( ( this.target.y + this.target._hitbox_y2 ) / 16 ) * 16,
					null,
					this
			) );
		}
		else
		{
			// Check if target left first rect, then recursively remove rects which had towards_rect. Or do something else that would be more correct. Also probably update .distance_to_target for all rects, maybe via outdating version
			
			// Then grow rects around existing rects, maybe even find one that is closest to each of travelers
			
			for ( let i = 0; i < this.rects.length; i++ )
			{
				if ( this.rects[ i ].Grow() )
				break; // One iteration done, it is enough for now
			}
		}
		
		return false; // Keep
	}
	
	CheckOverlapsWithOtherRects( x1,y1,x2,y2 ) // Can be optimized by keeping bounds of all rects and checking them first
	{
		for ( let i = 0; i < this.rects.length; i++ )
		if ( x2 > this.rects[ i ].x1 )
		if ( x1 < this.rects[ i ].x2 )
		if ( y2 > this.rects[ i ].y1 )
		if ( y1 < this.rects[ i ].y2 )
		return this.rects[ i ];
		
		return null;
	}
}

class Rect
{
	constructor( x1, y1, x2, y2, toward_target, rect_space_map )
	{
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		
		this.toward_target = toward_target;
		
		this.distance_to_target = toward_target ? toward_target.distance_to_target + 1 : 0; // How many rects towards target are still there
		
		this.spawned_child_rects = false;
		
		this.is_fully_grown = false;
		
		this.fully_grown_sides = [ false, false, false, false ];
		
		this.rect_space_map = rect_space_map;
		
		this.version = rect_space_map.version;
		
		this.is_ground = false;
		this.ground_entity = null; // Can be null in case of world bounds
		
		this.connected_rects = [];
	}
	
	remove()
	{
		for ( let i = 0; i < this.connected_rects.length; i++ )
		{
			let id = this.connected_rects[ i ].connected_rects.indexOf( this );
			
			if ( id !== -1 )
			this.connected_rects[ i ].connected_rects.splice( id, 1 );
			else
			debugger; // Strange
		}
		
		let id = this.rect_space_map.rects.indexOf( this );
		
		if ( id !== -1 )
		this.rect_space_map.rects.splice( id, 1 );
		else
		debugger; // Strange
	}
	
	Grow()
	{
		// Expand while can, or at least by 1 step at a time
		
		if ( this.is_fully_grown )
		return false; // Continue logic
	
		let any_in_progress = false;
	
		for ( let s = 0; s < 4; s++ )
		{
			if ( this.fully_grown_sides[ s ] )
			continue;
			
			let x1 = this.x1;
			let y1 = this.y1;
			let x2 = this.x2;
			let y2 = this.y2;
			
			if ( s === 0 )
			{
				x1 = this.x1 - 16;
				x2 = this.x1;
			}
			else
			if ( s === 1 )
			{
				x1 = this.x2;
				x2 = this.x2 + 16;
			}
			else
			if ( s === 2 )
			{
				y1 = this.y1 - 16;
				y2 = this.y1;
			}
			else
			if ( s === 3 )
			{
				y1 = this.y2;
				y2 = this.y2 + 16;
			}
			
			let any_wall = false;
			
			let first_wall_i = -1;
			
			let i = 0;
			
			let met_rects = null;
			
			any_wall_loop:
			for ( let x = x1; x < x2; x += 16 )
			for ( let y = y1; y < y2; y += 16 )
			{
				let is_ground_there = sdWorld.CheckWallExistsBox( x + 1, y + 1, x + 15, y + 15, null, null, sdCom.com_visibility_unignored_classes, null );
				
				if ( this.is_ground !== is_ground_there )
				{
					first_wall_i = i;

					any_wall = true;
					break any_wall_loop;
				}
				else
				{
					let r = this.rect_space_map.CheckOverlapsWithOtherRects( x, y, x + 16, y + 16 );

					if ( r )
					{
						if ( !met_rects )
						met_rects = [ r ];
						else
						met_rects.push( r );

						first_wall_i = i;

						any_wall = true;
						break any_wall_loop;
					}
				}
				
				i++;
			}
			
			if ( any_wall )
			{
				// If any wall met - then separate stuff
				
				this.fully_grown_sides[ s ] = true;
				
				let i = 0;
				
				let prev_rect = null; // Points towards either previously made unrelated rects or towards rects that are made here
				let prev_rect_made_here = false; // Used to merge stripes of new rects made on either side
				
				for ( let x = x1; x < x2; x += 16 )
				for ( let y = y1; y < y2; y += 16 )
				{
					let spawn_rect = false;
					let spawn_rect_is_ground = false;
					let spawn_rect_ground_entity = null;
					
					// Some optimisation - skipping air and wall
					if ( i < first_wall_i )
					{
						// Air
						spawn_rect = true;
						spawn_rect_is_ground = this.is_ground;

						if ( spawn_rect_is_ground )
						spawn_rect_ground_entity = sdWorld.last_hit_entity;
					}
					else
					//if ( i > first_wall_i )
					{
						
						let r = this.rect_space_map.CheckOverlapsWithOtherRects( x, y, x + 16, y + 16 );

						if ( r )
						{
							// Other rect. Connect it with previous made rect too and mark for future connection with next rect

							this.connected_rects.push( r );
							r.connected_rects.push( this );

							if ( prev_rect )
							{
								prev_rect.connected_rects.push( r );
								r.connected_rects.push( prev_rect );
							}

							prev_rect = r;
							prev_rect_made_here = false;
						}
						else
						{
							let is_ground_there = sdWorld.CheckWallExistsBox( x + 1, y + 1, x + 15, y + 15, null, null, sdCom.com_visibility_unignored_classes, null );
							
							if ( this.is_ground !== is_ground_there )
							{
								// Wall

								if ( this.rect_space_map.can_dig )
								{
									spawn_rect = true;
									spawn_rect_is_ground = is_ground_there;
									
									if ( spawn_rect_is_ground )
									spawn_rect_ground_entity = sdWorld.last_hit_entity;
								}
								else
								{
									prev_rect = null;
								}
							}
							else
							{
								// Air
								spawn_rect = true;
								spawn_rect_is_ground = this.is_ground;
									
								if ( spawn_rect_is_ground )
								spawn_rect_ground_entity = sdWorld.last_hit_entity;
							}
						}
						
					}
					
						
					if ( x >= sdWorld.world_bounds.x1 && 
						 x < sdWorld.world_bounds.x2 && 
						 y >= sdWorld.world_bounds.y1 && 
						 y < sdWorld.world_bounds.y2 )
					{
					}
					else
					{
						spawn_rect = false;
					}
					

					if ( spawn_rect )
					{
						// No wall - spawn rect (or if ground is allowed)
						
						let r = new Rect( x, y, x + 16, y + 16, this, this.rect_space_map );
						
						this.rect_space_map.rects.push( r );
						
						r.is_ground = spawn_rect_is_ground;
						r.ground_entity = spawn_rect_ground_entity;
						
						this.connected_rects.push( r );
						r.connected_rects.push( this );
						
						
						if ( this.is_ground )
						if ( !r.is_ground )
						{
							let is_ground_there = sdWorld.CheckWallExistsBox( x + 1, y + 1, x + 15, y + 15, null, null, sdCom.com_visibility_unignored_classes, null );
							//debugger;
							if ( is_ground_there )
							{
								debugger;
							}
						}
						
						if ( prev_rect )
						{
							// Merge with previous rect
							if ( prev_rect_made_here && prev_rect.is_ground === r.is_ground )
							{
								r.x1 = Math.min( r.x1, prev_rect.x1 );
								r.x2 = Math.max( r.x2, prev_rect.x2 );
								r.y1 = Math.min( r.y1, prev_rect.y1 );
								r.y2 = Math.max( r.y2, prev_rect.y2 );
								
								for ( let i = 0; i < prev_rect.connected_rects.length; i++ )
								{
									let id = r.connected_rects.indexOf( prev_rect.connected_rects[ i ] );
									
									if ( id === -1 )
									{
										r.connected_rects.push( prev_rect.connected_rects[ i ] );
										prev_rect.connected_rects[ i ].connected_rects.push( r );
									}
								}
								
								prev_rect.remove();
							}
							else
							{
								// Connect with previous rect
								prev_rect.connected_rects.push( r );
								r.connected_rects.push( prev_rect );
							}
						}
						
						prev_rect = r;
						prev_rect_made_here = true;
					}
					i++;
				}
			}
			else
			{
				if ( s === 0 )
				{
					if ( this.x1 - 16 >= sdWorld.world_bounds.x1 )
					{
						this.x1 -= 16;
						any_in_progress = true;
					}
				}
				else
				if ( s === 1 )
				{
					if ( this.x2 + 16 <= sdWorld.world_bounds.x2 )
					{
						this.x2 += 16;
						any_in_progress = true;
					}
				}
				else
				if ( s === 2 )
				{
					if ( this.y1 - 16 >= sdWorld.world_bounds.y1 )
					{
						this.y1 -= 16;
						any_in_progress = true;
					}
				}
				else
				if ( s === 3 )
				{
					if ( this.y2 + 16 <= sdWorld.world_bounds.y2 )
					{
						this.y2 += 16;
						any_in_progress = true;
					}
				}
			}
		}
		
		if ( !any_in_progress )
		this.is_fully_grown = true;
	
		return true; // Stop logic
	}
}
*/



export default sdPathFinding;