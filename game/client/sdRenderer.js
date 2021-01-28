
import sdWorld from '../sdWorld.js';
import sdShop from '../client/sdShop.js';
import sdChat from '../client/sdChat.js';
import sdContextMenu from '../client/sdContextMenu.js';

import sdEntity from '../entities/sdEntity.js';
import sdWeather from '../entities/sdWeather.js';

class sdRenderer
{
	static init_class()
	{
		console.warn('sdRenderer class initiated');
		
		if ( typeof window === 'undefined' )
		return;
	
		var canvas = document.createElement('canvas');
		canvas.id     = "SD2D";
		//canvas.width  = 800;
		//canvas.height = 400;
		canvas.width  = 800;
		canvas.height = 400;
		canvas.style.position = "fixed";
		canvas.style.left = '0px';
		canvas.style.top = '0px';
		canvas.style.cursor = 'none';
		
		canvas.style.display = 'none';
		
		sdRenderer.canvas = canvas;
		sdRenderer.screen_width = canvas.width;
		sdRenderer.screen_height = canvas.height;
		
		sdRenderer.service_mesage_until = 0;
		sdRenderer.service_mesage = '';
		
		//canvas.style.width = '100%';
		
		//canvas.style.transform = 'scale(' + window.innerWidth / 800 + ')';
		//canvas.style.imageRendering = 'pixelated';
		
		sdRenderer.canvas = canvas;
		
		document.body.insertBefore( canvas, null );
		
		sdRenderer.ctx = canvas.getContext("2d");
		
		
		if ( typeof window !== 'undefined' )
		{
			window.onresize = function( event )
			{
				canvas.width = document.body.clientWidth;
				canvas.height = document.body.clientHeight;
				
				// Rounding errors may cause gaps in blocks
				sdRenderer.screen_width = Math.round( canvas.width / 2 ) * 2;
				sdRenderer.screen_height = Math.round( canvas.height / 2 ) * 2;
				
				sdWorld.target_scale = 2 / 800 * sdRenderer.screen_width;
				sdWorld.target_scale = Math.round( sdWorld.target_scale * 8 ) / 8; // Should be rounded too
				
				sdRenderer.sky_gradient = sdRenderer.ctx.createLinearGradient( 0, 0, 0, sdRenderer.screen_height );
				sdRenderer.sky_gradient.addColorStop( 0, '#7b3219' );
				sdRenderer.sky_gradient.addColorStop( 1, '#b75455' );
			};
			window.onresize();
		}
		
		sdRenderer.image_filter_cache = new Map();
	
		sdRenderer.AddCacheDrawMethod = function( ctx0 )
		{
			ctx0.drawImageFilterCache = function( ...args )
			{
				if ( args[ 0 ].loaded === false )
				return;
				
				const filter = ctx0.filter; // native
				const sd_filter = ctx0.sd_filter; // custom filter, { colorA:replacementA, colorB:replacementB }


				if ( sd_filter || filter !== 'none' )
				{
					const complex_filter_name = filter + '/' + JSON.stringify( sd_filter );

					let image_obj = args[ 0 ];

					let image_obj_cache = null;

					if ( sdRenderer.image_filter_cache.has( image_obj ) )
					image_obj_cache = sdRenderer.image_filter_cache.get( image_obj );
					else
					{
						// Make
						image_obj_cache = {};
						sdRenderer.image_filter_cache.set( image_obj, image_obj_cache );
					}
					
					if ( typeof image_obj_cache[ complex_filter_name ] === 'undefined' )
					{
						if ( typeof OffscreenCanvas !== 'undefined' )
						image_obj_cache[ complex_filter_name ] = new OffscreenCanvas( 32, 32 );
						else
						{
							image_obj_cache[ complex_filter_name ] = document.createElement('canvas');
							image_obj_cache[ complex_filter_name ].width = image_obj_cache[ complex_filter_name ].height = 32;
						}
						let ctx = image_obj_cache[ complex_filter_name ].getContext("2d");

						ctx.filter = filter;

						let args2 = args.slice( 0 ); // Copy
						args2[ 1 ] = 0; // Reset position
						args2[ 2 ] = 0;
						ctx.drawImage( ...args2 );
						
						let apply_sd_filter = false;
						
						if ( sd_filter )
						for ( let color in sd_filter )
						{
							apply_sd_filter = true;
							break;
						}
						
						if ( apply_sd_filter )
						{
							let image_data = ctx.getImageData(0,0,32,32);
							let data = image_data.data; // Uint8ClampedArray
							/*
							let array_buffer = data.buffer;
							let data_view = new DataView( array_buffer );
							
							for ( let i = 0; i < data_view.length; i += 4 )
							{
								data_view.setUint8( i, 255 );
								data_view.setUint8( i+1, 255 );
								data_view.setUint8( i+2, 255 );
								data_view.setUint8( i+3, 255 );
							}
							debugger;*/
							let r,g,b;
							for ( let i = 0; i < data.length; i += 4 )
							{
								//data[ i ] = 255;
								r = data[ i ];
								
								if ( typeof sd_filter[ r ] !== 'undefined' )
								{
									g = data[ i+1 ];
									if ( typeof sd_filter[ r ][ g ] !== 'undefined' )
									{
										b = data[ i+2 ];
										if ( typeof sd_filter[ r ][ g ][ b ] !== 'undefined' )
										{
											data[ i ] = sd_filter[ r ][ g ][ b ][ 0 ];
											data[ i+1 ] = sd_filter[ r ][ g ][ b ][ 1 ];
											data[ i+2 ] = sd_filter[ r ][ g ][ b ][ 2 ];
										}
									}
								}
							}
							ctx.putImageData( image_data, 0, 0 );
						}
					}
					
					ctx0.filter = 'none';

					ctx0.drawImage( image_obj_cache[ complex_filter_name ], ...args.slice( 1 ) );
					
					ctx0.filter = filter;

					return;
				}

				//if ( args.length === 3 )
				ctx0.drawImage( ...args );

			};
		};
		sdRenderer.AddCacheDrawMethod( sdRenderer.ctx );
	}
	static UseCrosshair()
	{
		if ( sdShop.open || sdContextMenu.open )
		return false;
	
		return true;
	}
	static UpdateCursor()
	{
		//if ( sdRenderer.UseCrosshair() )
		sdRenderer.canvas.style.cursor = 'none';
		//else
		//sdRenderer.canvas.style.cursor = '';
	}
	static Render()
	{
		/*if ( !document.hasFocus() ) Can be inaccurate
		if ( Math.random() > 0.1 )
		return;*/
		
		var ctx = sdRenderer.ctx;
		
		ctx.imageSmoothingEnabled = false;
		
		// BG
		{
			//ctx.fillStyle = "#7b3219";
			
			
			ctx.fillStyle = sdRenderer.sky_gradient;
			ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
			
			if ( sdWeather.only_instance )
			{
				ctx.fillStyle = '#000000';
				ctx.globalAlpha = Math.cos( sdWeather.only_instance.day_time / ( 30 * 60 * 24 ) * Math.PI * 2 ) * 0.5 + 0.5;
				ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
				ctx.globalAlpha = 1;
			}
		}
		
		ctx.translate( sdRenderer.screen_width / 2, sdRenderer.screen_height / 2 );
		ctx.scale( sdWorld.camera.scale, 
				   sdWorld.camera.scale );
		ctx.translate( -sdRenderer.screen_width / 2, -sdRenderer.screen_height / 2 );
		
		ctx.translate( -sdWorld.camera.x, -sdWorld.camera.y );
		
		ctx.translate( sdRenderer.screen_width / 2, sdRenderer.screen_height / 2 );
		
		// In-world
		{
			//ctx.fillStyle = '#7b3219';
			//ctx.fillRect( sdWorld.camera.x - sdRenderer.screen_width, 0, sdRenderer.screen_width * 2, sdRenderer.screen_height );
			
			
			/*for ( var x = 0; x < 20; x++ )
			for ( var y = 0; y < 10; y++ )
			{
				var xx = ( Math.floor( sdWorld.camera.x / 32 ) * 32 + ( x - 10 ) * 32 );
				var yy = ( Math.floor( sdWorld.camera.y / 32 ) * 32 + ( y - 5 ) * 32 );
				
				if ( yy < 0 )
				ctx.drawImage( sdWorld.img_tile, 
					xx, 
					yy, 32,32 );
			}*/
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			if ( sdEntity.entities[ i ].DrawBG !== sdEntity.prototype.DrawBG )
			{
				ctx.save();
				try
				{
					ctx.translate( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
		
					// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
					sdEntity.entities[ i ].DrawBG( ctx, false );
				}
				catch( e )
				{
					console.log( 'Image could not be drawn for ',sdEntity.entities[ i ],e );
				}
				ctx.restore();
			}
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			{
				ctx.save();
				try
				{
					ctx.translate( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
		
					// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
					sdEntity.entities[ i ].Draw( ctx, false );
				}
				catch( e )
				{
					console.log( 'Image could not be drawn for ',sdEntity.entities[ i ],e );
				}
				ctx.restore();
			}
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			if ( sdEntity.entities[ i ].DrawFG !== sdEntity.prototype.DrawFG )
			{
				ctx.save();
				try
				{
					ctx.translate( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y );
		
					// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
					sdEntity.entities[ i ].DrawFG( ctx, false );
				}
				catch( e )
				{
					console.log( 'Image could not be drawn for ',sdEntity.entities[ i ],e );
				}
				ctx.restore();
			}
			
			ctx.fillStyle = '#000000';
			for ( var step = 1; step <= 4; step++ )
			{
				ctx.globalAlpha = 1 - ( step / 5 );
				
				ctx.fillRect(	sdWorld.world_bounds.x1 + 10 * ( step - 1 ), 
								sdWorld.world_bounds.y1 + 10 * ( step - 1 ), 
								10, 
								sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 - 20 * ( step - 1 ) );
								
				ctx.fillRect(	sdWorld.world_bounds.x2 - 10 * step, 
								sdWorld.world_bounds.y1 + 10 * ( step - 1 ), 
								10, 
								sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 - 20 * ( step - 1 ) );
								
				ctx.fillRect(	sdWorld.world_bounds.x1 + 10 * step, 
								sdWorld.world_bounds.y1 + 10 * ( step - 1 ), 
								sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 20 * step, 
								10 );
								
				ctx.fillRect(	sdWorld.world_bounds.x1 + 10 * step, 
								sdWorld.world_bounds.y2 - 10 * ( step ), 
								sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 - 20 * step, 
								10 );
			}				
			ctx.globalAlpha = 1;
			


			ctx.fillRect(	sdWorld.world_bounds.x1 - sdRenderer.screen_width, 
							sdWorld.world_bounds.y1 - sdRenderer.screen_height, 
							sdRenderer.screen_width, 
							sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 + sdRenderer.screen_height * 2 );

			ctx.fillRect(	sdWorld.world_bounds.x2, 
							sdWorld.world_bounds.y1 - sdRenderer.screen_height, 
							sdRenderer.screen_width, 
							sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 + sdRenderer.screen_height * 2 );

			ctx.fillRect(	sdWorld.world_bounds.x1, 
							sdWorld.world_bounds.y1 - sdRenderer.screen_height, 
							sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1, 
							sdRenderer.screen_height );

			ctx.fillRect(	sdWorld.world_bounds.x1, 
							sdWorld.world_bounds.y2, 
							sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1, 
							sdRenderer.screen_height );





			
			if ( sdWorld.my_entity )
			if ( !sdWorld.my_entity._is_being_removed )
			{
				ctx.save();
				try
				{
					ctx.translate( sdWorld.my_entity.x, sdWorld.my_entity.y );
		
					// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
					sdWorld.my_entity.DrawHUD( ctx, false );
				}
				catch( e )
				{
					console.log( 'Image could not be drawn for ',sdWorld.my_entity,e );
				}
				ctx.restore();
				
				var best_ent = null;
				var best_di = -1;
				
				for ( var i = 0; i < sdEntity.entities.length; i++ )
				if ( sdEntity.entities[ i ].DrawHUD !== sdEntity.prototype.DrawHUD )
				{
					var di = sdWorld.inDist2D( sdWorld.my_entity.look_x, sdWorld.my_entity.look_y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, 32 );
					if ( di >= 0 )
					{
						if ( di < best_di || best_ent === null )
						{
							best_ent = sdEntity.entities[ i ];
							best_di = di;
						}
					}
				}
				if ( best_ent )
				if ( best_ent !== sdWorld.my_entity )
				{
					ctx.save();
					try
					{
						ctx.translate( best_ent.x, best_ent.y );

						// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
						best_ent.DrawHUD( ctx, false );
					}
					catch( e )
					{
						console.log( 'Image could not be drawn for ',best_ent,e );
					}
					ctx.restore();
				}
				
				sdWorld.hovered_entity = best_ent;
			}
			
			
			
			// Ingame hud
			if ( sdWorld.my_entity )
			if ( sdRenderer.UseCrosshair() )
			{
				if ( sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ] &&
					 sdGun.classes[ sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].class ].is_build_gun )
				{
					ctx.drawImage( sdWorld.img_crosshair_build, 
						sdWorld.my_entity.look_x - 16, 
						sdWorld.my_entity.look_y - 16, 32,32 );
						
					ctx.font = "5.5px Verdana";
					ctx.textAlign = 'left';
					ctx.fillStyle = '#ffff00';
					let cost = sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].GetBulletCost( false );
					ctx.fillText("Matter cost: " + ( cost === Infinity ? '-' : Math.ceil( cost ) ), sdWorld.my_entity.look_x + 20, sdWorld.my_entity.look_y - 2 );
					ctx.fillStyle = '#00ffff';
					ctx.fillText("Matter carried: " + Math.floor( sdWorld.my_entity.matter ), sdWorld.my_entity.look_x + 20, sdWorld.my_entity.look_y + 5 );
				}
				else
				ctx.drawImage( sdWorld.img_crosshair, 
					sdWorld.my_entity.look_x - 16, 
					sdWorld.my_entity.look_y - 16, 32,32 );
			}
		}
		
		ctx.resetTransform();
		
		// On-screen foregroud
		if ( sdWorld.my_entity )
		{
			ctx.globalAlpha = 0.5;
			ctx.fillStyle = '#000000';
			ctx.fillRect( 5, 5, 300, 17 );
			
			ctx.fillRect( sdRenderer.screen_width - 200 - 5, 5, 200, 20 + 20 * sdWorld.leaders.length + 5 );
			
			ctx.globalAlpha = 1;
			
			ctx.fillStyle = '#ff0000';
			//ctx.fillRect( 7, 7, 296 * sdWorld.my_entity.hea / sdWorld.my_entity.hmax, 2 );
			ctx.font = "11px Verdana";
			ctx.textAlign = 'left';
			ctx.fillStyle = '#ff0000';
			ctx.fillText("Health: " + Math.ceil( sdWorld.my_entity.hea ), 10, 17 );
			
			ctx.fillStyle = '#00ffff';
			ctx.fillText("Matter: " + Math.floor( sdWorld.my_entity.matter ), 100, 17 );
			
			ctx.fillStyle = '#ffff00';
			ctx.fillText("Score: " + Math.floor( sdWorld.my_score ), 190, 17 );
			
			ctx.fillStyle = '#AAAAAA';
			ctx.fillText("Leaderboard:", sdRenderer.screen_width - 200 - 5 + 5, 20 );
			
			ctx.textAlign = 'right';
			ctx.fillStyle = '#AAAAAA';
			ctx.fillText( globalThis.players_playing+ " alive", sdRenderer.screen_width - 5 - 5, 20 );
			
			//for ( var i = 0; i < sdWorld.leaders.length; i++ )
			for ( var i = 0; i < sdWorld.leaders.length; i++ )
			{
				ctx.textAlign = 'left';
				ctx.fillStyle = '#FFFFFF';
				ctx.fillText( (i+1)+". " + ( ( i < sdWorld.leaders.length ) ? sdWorld.leaders[ i ].name : '' ), sdRenderer.screen_width - 200 - 5 + 5, 20 + ( i + 1 ) * 20 );
				
				ctx.textAlign = 'right';
				ctx.fillText( ( ( i < sdWorld.leaders.length ) ? sdWorld.leaders[ i ].score : '' ), sdRenderer.screen_width - 15, 20 + ( i + 1 ) * 20 );
			}
			
			ctx.globalAlpha = 1;
			
			
			
			if ( sdShop.open )
			sdShop.Draw( ctx );
			
			if ( sdChat.open )
			sdChat.Draw( ctx );
			
			if ( sdContextMenu.open )
			sdContextMenu.Draw( ctx );
		
			if ( !sdRenderer.UseCrosshair() )
			{
				ctx.drawImage( sdWorld.img_cursor, 
					sdWorld.mouse_screen_x, 
					sdWorld.mouse_screen_y, 64,64 );
			}
				/*if ( sdWorld.my_entity )
			ctx.drawImage( sdWorld.img_crosshair, 
				sdWorld.my_entity.look_x - 16 * sdWorld.camera.scale, 
				sdWorld.my_entity.look_y - 16 * sdWorld.camera.scale, 32 * sdWorld.camera.scale,32 * sdWorld.camera.scale );*/
			
		}
		
		if ( !sdWorld.my_entity || sdWorld.my_entity.hea < 0 || sdWorld.my_entity._is_being_removed )
		{
			ctx.font = "14px Verdana";
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffffff';
			
			if ( !sdWorld.my_entity || sdWorld.my_entity._is_being_removed )
			ctx.fillText( 'Your character has died. Press Space to restart or press Esc to return to main menu', sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 );
			else
			ctx.fillText( 'Your character has died but still can be revived. Press Space to restart or press Esc to return to main menu', sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 );
		}
		
		if ( sdWorld.time < sdRenderer.service_mesage_until )
		{
			ctx.font = "14px Verdana";
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffff00';
			
			ctx.fillText( sdRenderer.service_mesage, sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 - 30 );
		}
	}
}
//sdRenderer.init_class();

export default sdRenderer;