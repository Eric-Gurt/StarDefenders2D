/*

	Something that controls almost any creature (tells whether to dig, attack or walk/jump).

	Test (type at client's console on DevTools):

		new sdPathFinding({ target: sdWorld.my_entity });

*/



import sdWorld from '../sdWorld.js';
import sdCom from '../entities/sdCom.js';

class sdPathFinding
{
	static init_class()
	{
		sdPathFinding.rect_space_maps_by_entity = new WeakMap(); // entity => RectSpaceMap
		sdPathFinding.rect_space_maps = [];
		
		sdWorld.static_think_methods.push( sdPathFinding.StaticThink );
	}
	
	constructor( params )
	{
		this.target = null;
		
		if ( params.target )
		{
			this.target = params.target;
			
			let rect_space_map = new RectSpaceMap( this.target, true );
			
			sdPathFinding.rect_space_maps_by_entity.set( this.target, rect_space_map );
			sdPathFinding.rect_space_maps.push( rect_space_map );
		}
	}
	
	Think( GSPEED )
	{
		let rect_space_map = sdPathFinding.rect_space_maps_by_entity.get( this.target );
		rect_space_map.time_to_live = sdWorld.time + 5000;
		
		// TODO: Return preferred action or maybe even simply move traveler in some optimized way towards .target (without actual hit detections of any kind, at least on server) while triggering collision events?
	}
	
	static StaticThink( GSPEED )
	{
		for ( let i = 0; i < sdPathFinding.rect_space_maps.length; i++ )
		{
			let rect_space_map = sdPathFinding.rect_space_maps[ i ];
			
			if ( rect_space_map.Iteration( GSPEED ) )
			{
				sdPathFinding.rect_space_maps_by_entity.delete( rect_space_map.target );
				sdPathFinding.rect_space_maps.splice( i, 1 );
				i--;
				continue;
			}
		}
	}
	
	static StaticRender( ctx )
	{
		for ( let i = 0; i < sdPathFinding.rect_space_maps.length; i++ )
		{
			let rect_space_map = sdPathFinding.rect_space_maps[ i ];
			
			debugger; // Preview is made for previous version
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
		
// Slowly built around each target so travelers can reach it
class RectSpaceMap
{
	constructor( ent, include_ground=false )
	{
		this.target = ent;
		this.include_ground = include_ground;
		
		this.time_to_live = sdWorld.time + 5000;
		
		this.Reinit();
	}
	
	Reinit()
	{
		// TODO: Somehow prioritize rect Iterating for those that are closest to known travelers
		
		this.x1 = sdWorld.world_bounds.x1;
		this.y1 = sdWorld.world_bounds.y1;
		this.x2 = sdWorld.world_bounds.x2;
		this.y2 = sdWorld.world_bounds.y2;
		
		this.w = Math.floor( ( this.x2 - this.x1 ) / 16 );
		this.h = Math.floor( ( this.y2 - this.y1 ) / 16 );
		
		// Nothing can work faster than these in v8's JS (arrays and objects as slow)
		this.bitmap = new ArrayBuffer( this.w * this.h * DATA_PER_CELL * BYTES_PER_VALUE );
		this.bitmap_dataView = new DataView( this.bitmap );
		
		this.active_bits = []; // Where iterative calculation should happen
		
		this.version = 0; // Version might go up every time target moves from rect to rect. Then all versions of all rects and towards_target-s will be updated.
		
		this.last_player_offset = -1;
		
		this.UpdateTargetPosition();
	}
	
	UpdateTargetPosition()
	{
		let offset = this.GetBitOffsetFromXY( this.target.x + ( this.target._hitbox_x1 + this.target._hitbox_x2 ) / 2, this.target.y + ( this.target._hitbox_y1 + this.target._hitbox_y2 ) / 2 );
		
		if ( this.last_player_offset !== offset )
		{
			if ( this.active_bits.indexOf( offset ) === -1 )
			this.active_bits.push( offset );
		
			this.last_player_offset = offset;
			
			this.version = this.version + 1;//( this.version + 1 ) % 65535; // Likely to never loop
			
			// uint16 max value is 65535
			this.bitmap_dataView.setUint16( BYTES_PER_VALUE * ( offset + OFFSET_DISTANCE_TO_TARGET ), 1 ); // Distance limit is 65535 cells * 16 px = 1048560 px
			this.bitmap_dataView.setUint32( BYTES_PER_VALUE * ( offset + OFFSET_VERSION ), this.version );
			this.bitmap_dataView.setUint8( BYTES_PER_VALUE * ( offset + OFFSET_IS_FULLY_SOLVED ), 0 );
		}
	}
	
	GetBitOffsetFromXY( _x, _y )
	{
		let x = Math.floor( _x / 16 );
		let y = Math.floor( _y / 16 );
		
		if ( x < this.x1 || y < this.y1 || x >= this.x2 || y > this.y2 )
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
		
			if ( _x >= sdWorld.world_bounds.x1 )
			if ( _x < sdWorld.world_bounds.x2 )
			if ( _y >= sdWorld.world_bounds.y1 )
			if ( _y < sdWorld.world_bounds.y2 )
			{
				trace( 'Pathfinding issue - bit offset detection outside of rect space map is not yet implemented. So far it will happen when target moves out of playable are or world bounds shift. Whole RectSpaceMap will be simply reinitialized when this happens. Coordinates: '+_x+', '+_y );
				//throw new Error( 'Pathfinding issue - bit offset detection outside of rect space map is not yet implemented. So far it will happen when target moves out of playable are or world bounds shift. Whole RectSpaceMap can be simply reinitialized when this happens probably. Coordinates: '+_x+', '+_y );

				this.Reinit();
				return GetBitOffsetFromXY( _x, _y );
			}
			
			debugger;
			return 0;
		}
		
		x -= this.x1 / 16;
		y -= this.y1 / 16;
		
		return ( y * this.w + x ) * DATA_PER_CELL * BYTES_PER_VALUE;
	}
	
	GetXYFromBitOffset( offset )
	{
		offset /= DATA_PER_CELL * BYTES_PER_VALUE;
		return [ offset % this.w + this.x1 * 16, Math.ceil( offset / this.w ) + this.y1 * 16 ];
	}
	
	Iteration( GSPEED )
	{
		if ( this.target._is_being_removed )
		return true; // Delete
	
		// TODO: Add removal logic for case when nobody is looking for target for few seconds
		
		this.active_bits;
		
		let active_bits_to_handle = 1;//Math.ceil( this.active_bits.length * 0.1 );
		
		for ( let b = 0; b < this.active_bits.length; b++ )
		{
			if ( active_bits_to_handle-- <= 0 )
			break;
			
			let offset = this.active_bits.shift(); // this.active_bits[ b ];
			
			let [ active_cell_x, active_cell_y ] = this.GetXYFromBitOffset( offset );
			
			let active_cell_version = this.bitmap_dataView.getUint8( BYTES_PER_VALUE * ( offset + OFFSET_VERSION ) );
			
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
				
				let nearby_version = this.bitmap_dataView.getUint8( BYTES_PER_VALUE * ( offset_nearby + OFFSET_VERSION ) );
				
				// Rule: Sometimes it will be +10 instead of +1, but only when nearby cell is in the wall. Only entrance into cell counts as extra distance penalty.
				// Basically leaving wall does not have penalty, but entering wall has penalty.
				
				if ( nearby_version < active_cell_version )
				{
					// TODO: Update version and set distance for nearby cell as current +1
					
					// TODO: Add nearby cell to .active_bits
				}
				else
				if ( nearby_version === active_cell_version )
				{
					// TODO: Same version, can either take near cell's path distance as +1 or give own path distance as +1
					
					// TODO: Add to .active_bits either this or near cell again if they did exchange path distances. If not - continue to another nearby cell
				}
				else
				{
					// TODO: Newer version cell found - it is a sign to simply remove this cell from active cells and any logic will be done by newer cell anyway
				}
			}
		}
		
		// Check if target moved from previous cell and if so - update version and add new active cell
		this.UpdateTargetPosition();
		
		// TODO: Sort active cells by being close to travelers so we get faster path build where it needs to be built. Maybe also prioritize greatly active cells that have higher version (by ranking down any cell with (this.version - cell_version)*5 )
		
		// TODO: Disable any iteration logic if all travelers have cell with path AND travelers are on cells that have same version as this whole RectSpaceMap
		
		return false; // Keep
	}
}	
/*
// Slowly built around each target so travelers can reach it
class RectSpaceMap
{
	constructor( ent, include_ground=false )
	{
		// TODO: Somehow prioritize rect Iterating for those that are closest to known travelers
		
		this.rects = [];
		
		this.target = ent;
		
		this.version = 0; // Version might go up every time target moves from rect to rect. Then all versions of all rects and towards_target-s will be updated.
		
		this.include_ground = include_ground;
		
		this.time_to_live = sdWorld.time + 5000;
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

								if ( this.rect_space_map.include_ground )
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