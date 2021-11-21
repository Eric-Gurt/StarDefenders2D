/*

	Assist class to create and pre-process canvases, for example to bring them Grid9 slicing

*/
class sdBitmap
{
	static CreateBitmap( w=32, h=32 )
	{
		let canvas = null;
		
		/*if ( typeof OffscreenCanvas !== 'undefined' ) // Server won't have it
		{
			canvas = new OffscreenCanvas( w, h );
		}
		else*/
		{
			canvas = document.createElement('canvas');
			canvas.width = w;
			canvas.height = w;
		}
			
		canvas.ctx = canvas.getContext("2d");
		/*
		canvas.loaded = false;
		
		canvas.RequiredNow = ()=>{
		};
		*/
		return canvas;
	}
	
	static Grid9( stack_image_or_canvas, edge_size, new_width, new_height ) // ProduceGrid9BlockTexture
	{
		//let canvas = sdBitmap.CreateBitmap( new_width, new_height );
		let canvas = stack_image_or_canvas.canvas_override;
		
		/*if ( edge_size > new_width / 2 || edge_size > new_height / 2 )
		{
			console.warn( 'Most likely image will look bad' );
			debugger;
		}*/
		
		canvas.width = 32;
		canvas.height = 32;
		
		// LT
		canvas.ctx.drawImage( stack_image_or_canvas, 0,0,edge_size,edge_size, 0,0,edge_size,edge_size );
		// RT
		canvas.ctx.drawImage( stack_image_or_canvas, 32-edge_size,0,edge_size,edge_size, new_width-edge_size,0,edge_size,edge_size );
		
		// LB
		canvas.ctx.drawImage( stack_image_or_canvas, 0,32-edge_size,edge_size,edge_size, 0,new_height-edge_size,edge_size,edge_size );
		// RB
		canvas.ctx.drawImage( stack_image_or_canvas, 32-edge_size,32-edge_size,edge_size,edge_size, new_width-edge_size,new_height-edge_size,edge_size,edge_size );
		
		
		// Top
		canvas.ctx.drawImage( stack_image_or_canvas, edge_size,0,new_width-edge_size-edge_size,edge_size, edge_size,0,new_width-edge_size-edge_size,edge_size );
		// Bottom
		canvas.ctx.drawImage( stack_image_or_canvas, edge_size,32-edge_size,new_width-edge_size-edge_size,edge_size, edge_size,new_height-edge_size,new_width-edge_size-edge_size,edge_size );
		// Left
		canvas.ctx.drawImage( stack_image_or_canvas, 0,edge_size,edge_size,new_height-edge_size-edge_size, 0,edge_size,edge_size,new_height-edge_size-edge_size );
		// Right
		canvas.ctx.drawImage( stack_image_or_canvas, 32-edge_size,edge_size,edge_size,new_height-edge_size-edge_size, new_width-edge_size,edge_size,edge_size,new_height-edge_size-edge_size );
		
		// Fill
		canvas.ctx.drawImage( stack_image_or_canvas, edge_size,edge_size,new_width-edge_size-edge_size,new_height-edge_size-edge_size, edge_size,edge_size,new_width-edge_size-edge_size,new_height-edge_size-edge_size );
		
		//trace( canvas.toDataURL() );
	}
}
export default sdBitmap;