/*

	Something that controls almost any creature (tells whether to dig, attack or walk/jump).

*/




class sdPathFinding
{
	static init_class()
	{
		sdPathFinding.rect_space_maps = new Map(); // entity => RectSpaceMap
	}
	
	constructor()
	{
	}
}

// Slowly built around each target so travelers can reach it
class RectSpaceMap
{
	constructor( ent )
	{
		this.rects = [];
	}
	
	Iteration()
	{
		if ( this.rects.length === 0 )
		{
			// Start from first rect then grow
		}
		else
		{
			// Check if target left first rect, then recursively remove rects which had towards_rect. Or do something else that would be more correct
			
			// Then grow rects around existing rects, maybe even find one that is closest to each of travelers
		}
	}
}

class Rect
{
	constructor( x1, y1, x2, y2, toward_target=null )
	{
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		
		this.toward_target = toward_target;
		
		this.spawned_child_rects = false;
		
		this.is_fully_grown = false;
	}
	
	Grow()
	{
		// Expand while can, or at least by 1 step at a time
	}
}




export default sdPathFinding;