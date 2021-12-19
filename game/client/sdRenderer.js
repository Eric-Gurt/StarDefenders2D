
/* global FakeCanvasContext */

import sdWorld from '../sdWorld.js';
import sdShop from '../client/sdShop.js';
import sdChat from '../client/sdChat.js';
import sdContextMenu from '../client/sdContextMenu.js';

import sdPathFinding from '../ai/sdPathFinding.js';

import sdEntity from '../entities/sdEntity.js';
import sdWeather from '../entities/sdWeather.js';
import sdBlock from '../entities/sdBlock.js';
import sdEffect from '../entities/sdEffect.js';
import sdGun from '../entities/sdGun.js';
import sdTheatre from '../entities/sdTheatre.js';

import sdLamp from '../entities/sdLamp.js';

class sdRenderer
{
	static init_class()
	{
		console.warn('sdRenderer class initiated');
		
		if ( typeof window === 'undefined' )
		return;
	
		sdRenderer.resolution_quality = 1;
	
		var canvas = document.createElement('canvas');
		canvas.id     = "SD2D";
		
		canvas.width  = 800;
		canvas.height = 400;
				
		//canvas.style.transform = 'scale(' + ( 1 / sdRenderer.resolution_quality ) + ')';
		//canvas.style.transformOrigin = '0 0';

		canvas.style.position = "fixed";
		canvas.style.left = '0px';
		canvas.style.top = '0px';
		canvas.style.cursor = 'none';
		
		canvas.style.display = 'none';
		
		canvas.style.imageRendering = 'pixelated';
		
		sdRenderer.canvas = canvas;
		sdRenderer.screen_width = canvas.width;
		sdRenderer.screen_height = canvas.height;
		
		sdRenderer.service_mesage_until = 0;
		sdRenderer.service_mesage = '';
		
		sdRenderer.last_source_change = sdWorld.time;
		sdRenderer.last_source_entity = null;
		sdRenderer.last_source_cmd = '';
		
		//canvas.style.width = '100%';
		
		//canvas.style.transform = 'scale(' + window.innerWidth / 800 + ')';
		//canvas.style.imageRendering = 'pixelated';
		
		sdRenderer.canvas = canvas;
		
		document.body.insertBefore( canvas, null );
		
		sdRenderer._visual_settings = 0;
		
		sdRenderer.show_leader_board = true;
		
		//sdRenderer.ctx = canvas.getContext("2d");
		//sdRenderer.ctx = canvas.getContext('webgl-2d');
		//sdRenderer.ctx = new FakeCanvasContext( canvas );
		sdRenderer.ctx = null;
		
		//sdRenderer.lumes_cache = {};
		//sdRenderer.lumes_cache_hashes = [];
		//sdRenderer.lumes_cache_hash_i = 0;
		sdRenderer.lumes_weak_cache = new WeakMap();
		
		if ( typeof window !== 'undefined' )
		{
			window.onresize = function( event )
			{
				let clientWidth = document.body.clientWidth * sdRenderer.resolution_quality;
				let clientHeight = document.body.clientHeight * sdRenderer.resolution_quality;
				
				let innerWidth = window.innerWidth * sdRenderer.resolution_quality;
				let innerHeight = window.innerHeight * sdRenderer.resolution_quality;

				canvas.width = clientWidth;
				canvas.height = clientHeight;
				
				canvas.style.transform = 'scale(' + ( 1 / sdRenderer.resolution_quality ) + ')';
				canvas.style.transformOrigin = '0 0';
				
				// Rounding errors may cause gaps in blocks
				sdRenderer.screen_width = Math.round( canvas.width / 2 ) * 2;
				sdRenderer.screen_height = Math.round( canvas.height / 2 ) * 2;
				
				sdWorld.target_scale = 2 / 800 * sdRenderer.screen_width;
				sdWorld.target_scale = Math.round( sdWorld.target_scale * 8 ) / 8; // Should be rounded too
				
				if ( sdRenderer.ctx )
				{
					if ( sdRenderer.ctx.renderer )
					{
						sdRenderer.ctx.camera.aspect = innerWidth / innerHeight;
						sdRenderer.ctx.renderer.setSize( innerWidth, innerHeight );

						sdRenderer.ctx.camera.position.x = innerWidth / 2;
						sdRenderer.ctx.camera.position.y = innerHeight / 2;
						sdRenderer.ctx.camera.position.z = -811 * ( 1 * innerHeight / 937 );
						
						sdRenderer.ctx.camera.near = 400 * ( 1 * innerHeight / 937 );
						sdRenderer.ctx.camera.far = 1000 * ( 1 * innerHeight / 937 );

						sdRenderer.ctx.camera.updateProjectionMatrix();
					}

					sdRenderer.sky_gradient = sdRenderer.ctx.createLinearGradient( 0, 0, 0, sdRenderer.screen_height );
					sdRenderer.sky_gradient.addColorStop( 0, '#7b3219' );
					sdRenderer.sky_gradient.addColorStop( 1, '#b75455' );
				}
			};
			//window.onresize();
			
			sdRenderer.img_dark_lands = sdWorld.CreateImageFromFile( 'dark_lands' );
		}
		
		sdRenderer.image_filter_cache = new Map();
		
		sdRenderer.unavailable_image_collector = null; // Fills up indefinitely if array
	
		sdRenderer.AddCacheDrawMethod = function( ctx0 )
		{
			ctx0.sd_filter = null;
			ctx0.sd_tint_filter = null;
			
			ctx0.drawImageFilterCache = function( ...args )
			{
				if ( args[ 0 ].loaded === false )
				{
					if ( sdRenderer.unavailable_image_collector !== null )
					{
						if ( sdRenderer.unavailable_image_collector.indexOf( args[ 0 ] ) === -1 )
						{
							sdRenderer.unavailable_image_collector.push( args[ 0 ] );
							
							if ( sdRenderer.unavailable_image_collector.length > 100 )
							debugger;
						}
					}
					
					args[ 0 ].RequiredNow();
					return;
				}
				
				if ( args[ 0 ].canvas_override )
				args[ 0 ] = args[ 0 ].canvas_override;
				
				const filter = ctx0.filter; // native
				const sd_filter = ctx0.sd_filter; // custom filter, { colorA:replacementA, colorB:replacementB }
				const sd_tint_filter = ctx0.sd_tint_filter; // custom filter, [ r, g, b ], multiplies


				if ( sd_filter || sd_tint_filter || filter !== 'none' )
				{
					if ( sd_filter )
					{
						if ( sd_filter.s === undefined )
						{
							// Just draw old sd_filter properly while updating cache. Server in many cases won't be able to realize it sends this old sd_filter anyway
							
							//throw new Error( 'Old sd_filter used. New one should have structure as follows: { s: "AAAAAABBBBBBCCCCCCDDDDDD" }' );
							
							debugger;
							console.warn( 'Old sd_filter is being drawn. Issues can be ignored but will cause slight performance issues' );
							
							sd_filter.s = sdWorld.GetVersion2SDFilterFromVersion1SDFilter( sd_filter ).s; // Do not replace object just so it can be reused on client-side
						}
					}
					
					//const complex_filter_name = filter + '/' + ( sd_filter ? JSON.stringify( sd_filter ) : '' ) + '/' + ( sd_tint_filter ? JSON.stringify( sd_tint_filter ) : '' );
					const complex_filter_name = filter + '/' + ( sd_filter ? sd_filter.s : '' ) + '/' + ( sd_tint_filter ? JSON.stringify( sd_tint_filter ) : '' );

					let image_obj = args[ 0 ];

					let image_obj_cache = null;

					if ( sdRenderer.image_filter_cache.has( image_obj ) )
					image_obj_cache = sdRenderer.image_filter_cache.get( image_obj );
					else
					{
						// Make
						//image_obj_cache = {};
						image_obj_cache = new Map();
						sdRenderer.image_filter_cache.set( image_obj, image_obj_cache );
					}
					
					let image_obj_cache_named_item = image_obj_cache.get( complex_filter_name );
					
					//if ( typeof image_obj_cache[ complex_filter_name ] === 'undefined' )
					if ( !image_obj_cache_named_item )
					{
						if ( typeof OffscreenCanvas !== 'undefined' )
						{
							//image_obj_cache[ complex_filter_name ] = new OffscreenCanvas( image_obj.width, image_obj.height );
							image_obj_cache_named_item = new OffscreenCanvas( image_obj.width, image_obj.height );
						}
						else
						{
							//image_obj_cache[ complex_filter_name ] = document.createElement('canvas');
							//image_obj_cache[ complex_filter_name ].width = image_obj.width;
							//image_obj_cache[ complex_filter_name ].height = image_obj.height;
							
							image_obj_cache_named_item = document.createElement('canvas');
							image_obj_cache_named_item.width = image_obj.width;
							image_obj_cache_named_item.height = image_obj.height;
						}
						image_obj_cache.set( complex_filter_name, image_obj_cache_named_item );
							
						//let ctx = image_obj_cache[ complex_filter_name ].getContext("2d");
						let ctx = image_obj_cache_named_item.getContext("2d");
						
						let apply_sd_filter = false;
						
						if ( sd_filter )
						if ( sd_filter.s.length > 0 )
						//for ( let color in sd_filter )
						{
							apply_sd_filter = true;
							//break;
						}

						if ( apply_sd_filter || sd_tint_filter )
						{

						}
						else
						ctx.filter = filter;

						let args2 = args.slice( 0 ); // Copy
						args2[ 1 ] = 0; // Reset position
						args2[ 2 ] = 0;
						//ctx.drawImage( ...args2 );
						ctx.drawImage( args[ 0 ], 0, 0 );
						
						if ( apply_sd_filter || sd_tint_filter )
						{
							let image_data = ctx.getImageData( 0, 0, ctx.canvas.width, ctx.canvas.height );
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
							let r,g,b,arr;
							
							if ( sd_filter )
							{
								//debugger
								let structured_sd_filter = {};
								for ( let i = 0; i < sd_filter.s.length; i += 12 )
								{
									r = parseInt( sd_filter.s.substring( i, i + 2 ), 16 );
									g = parseInt( sd_filter.s.substring( i + 2, i + 4 ), 16 );
									b = parseInt( sd_filter.s.substring( i + 4, i + 6 ), 16 );
									
									let r2 = parseInt( sd_filter.s.substring( 6+ i, 6+ i + 2 ), 16 );
									let g2 = parseInt( sd_filter.s.substring( 6+ i + 2, 6+ i + 4 ), 16 );
									let b2 = parseInt( sd_filter.s.substring( 6+ i + 4, 6+ i + 6 ), 16 );
									
									//console.log( r,g,b, '::', r2,g2,b2 );
									
									//if ( isNaN( r2 ) )
									//debugger;
									
									structured_sd_filter[ r * 256 * 256 + g * 256 + b ] = [ r2, g2, b2 ];
								}
								for ( let i = 0; i < data.length; i += 4 )
								{
									r = data[ i ];
									g = data[ i + 1 ];
									b = data[ i + 2 ];
									
									arr = structured_sd_filter[ r * 256 * 256 + g * 256 + b ];
									if ( arr )
									{
										data[ i ] = arr[ 0 ];
										data[ i + 1 ] = arr[ 1 ];
										data[ i + 2 ] = arr[ 2 ];
									}
								}
							}
							/*for ( let i = 0; i < data.length; i += 4 )
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
							}*/
							
							if ( sd_tint_filter )
							for ( let i = 0; i < data.length; i += 4 )
							if ( data[ i+3 ] > 0 )
							{
								data[ i ] *= sd_tint_filter[ 0 ];
								data[ i+1 ] *= sd_tint_filter[ 1 ];
								data[ i+2 ] *= sd_tint_filter[ 2 ];
							}

							ctx.putImageData( image_data, 0, 0 );

							if ( filter !== 'none' )
							{
					        	ctx.filter = filter;
                                ctx.globalCompositeOperation='copy';
					        	//ctx.drawImage( image_obj_cache[ complex_filter_name ], 0, 0 );
					        	ctx.drawImage( image_obj_cache_named_item, 0, 0 );
                                ctx.globalCompositeOperation='source-over';
							}
						}
						
						
						//image_obj_cache_named_item = hqx( image_obj_cache_named_item, 3 );
						//image_obj_cache.set( complex_filter_name, image_obj_cache_named_item );
					}
					
					ctx0.filter = 'none';

					//ctx0.drawImage( image_obj_cache[ complex_filter_name ], ...args.slice( 1 ) );
					//ctx0.drawImage( image_obj_cache[ complex_filter_name ], ...args.slice( 1 ) );
					ctx0.drawImage( image_obj_cache_named_item, ...args.slice( 1 ) );
					
					
					ctx0.filter = filter;

					return;
				}
				else
				//if ( args.length === 3 )
				ctx0.drawImage( ...args );

			};
		};
	}
	
	static set visual_settings( v )
	{
		if ( v === sdRenderer._visual_settings )
		return;
	
		if ( sdRenderer._visual_settings === 0 )
		{
			sdRenderer._visual_settings = v;
			
			if ( v === 1 )
			sdRenderer.ctx = sdRenderer.canvas.getContext("2d");
			else
			sdRenderer.ctx = new FakeCanvasContext( sdRenderer.canvas );
		
			sdRenderer.AddCacheDrawMethod( sdRenderer.ctx );
			
			if ( v === 2 )
			{
				if ( sdRenderer.ctx.sky.parent );
				sdRenderer.ctx.sky.parent.remove( sdRenderer.ctx.sky );
				
				if ( sdRenderer.ctx.sun.parent );
				sdRenderer.ctx.sun.parent.remove( sdRenderer.ctx.sun );
				
				sdRenderer.ctx.renderer.shadowMap.enabled = false;
			}
			else
			if ( v === 3 )
			{
				if ( !sdRenderer.ctx.sky.parent );
				sdRenderer.ctx.sky.parent.add( sdRenderer.ctx.sky );
				
				if ( !sdRenderer.ctx.sun.parent );
				sdRenderer.ctx.sun.parent.add( sdRenderer.ctx.sun );
				
				sdRenderer.ctx.renderer.shadowMap.enabled = true;
			}
			
			if ( v === 2 || v === 3 )
			{
				sdBlock.Install3DSupport();
			}
			
			window.onresize();
		}
		else
		alert('Application restart required for visual settings to change once again');
	}
	static get visual_settings()
	{
		return sdRenderer._visual_settings;
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
		
		if ( ctx === null )
		{
			return; // Context settings are not decided yet
		}
		
		/*if ( sdRenderer.lumes_cache_hashes.length > 0 )
		{
			sdRenderer.lumes_cache_hash_i = ( sdRenderer.lumes_cache_hash_i + 1 ) % sdRenderer.lumes_cache_hashes.length;
			if ( sdRenderer.lumes_cache_hash_i < sdRenderer.lumes_cache_hashes.length )
			{
				if ( sdRenderer.lumes_cache[ sdRenderer.lumes_cache_hashes[ sdRenderer.lumes_cache_hash_i ] ].expiration < sdWorld.time - 20000 )
				{
					delete sdRenderer.lumes_cache[ sdRenderer.lumes_cache_hashes[ sdRenderer.lumes_cache_hash_i ] ];
					sdRenderer.lumes_cache_hashes.splice( sdRenderer.lumes_cache_hash_i, 1 );
				}
			}
		}*/
		
		if ( typeof ctx.FakeStart !== 'undefined' )
		ctx.FakeStart();
	
		ctx.z_offset = 0;
		ctx.z_depth = 0;
		ctx.draw_offset = -100;
		ctx.camera_relative_world_scale = 1.2;
		
		ctx.imageSmoothingEnabled = false;
		
		// BG
		{
			//ctx.fillStyle = "#7b3219";
			
			
			ctx.fillStyle = sdRenderer.sky_gradient;
			ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
			
			//ctx.drawImage( sdRenderer.img_dark_lands, 0,0, sdRenderer.screen_width, sdRenderer.screen_height );
			
			if ( sdWeather.only_instance )
			{
				ctx.fillStyle = '#000000';
				ctx.globalAlpha = Math.cos( sdWeather.only_instance.day_time / ( 30 * 60 * 24 ) * Math.PI * 2 ) * 0.5 + 0.5;
				if ( ctx.sky )
				{	
					let br = false;
					
					if ( sdWorld.my_entity )
					{
						for ( var i = 0; i < sdLamp.lamps.length; i++ )
						if ( sdWorld.inDist2D( sdLamp.lamps[ i ].x, sdLamp.lamps[ i ].y, sdWorld.my_entity.x, sdWorld.my_entity.y, 800 ) > 0 )
						if ( sdWorld.CheckLineOfSight( sdLamp.lamps[ i ].x, sdLamp.lamps[ i ].y, sdWorld.my_entity.x, sdWorld.my_entity.y, sdLamp.lamps[ i ], null, [ 'sdBlock', 'sdDoor' ] ) )
						{
							br = true;
							break;
						}
					}
					
					let GSPEED = sdWorld.GSPEED;
					
					if ( br )
					{
						ctx.sky.intensity = sdWorld.MorphWithTimeScale( ctx.sky.intensity, 1, 0.98, GSPEED );
						ctx.sun.intensity = sdWorld.MorphWithTimeScale( ctx.sun.intensity, 0.4, 0.98, GSPEED );
					}
					else
					{
						ctx.sky.intensity = sdWorld.MorphWithTimeScale( ctx.sky.intensity, ( 1 - ctx.globalAlpha * 0.5 ) * 0.7, 0.98, GSPEED );
						ctx.sun.intensity = sdWorld.MorphWithTimeScale( ctx.sun.intensity, ( 1 - ctx.globalAlpha * 0.5 ), 0.98, GSPEED );
					}
				}
			
				
			
				//ctx.drawImage( sdRenderer.img_dark_lands, 0,0, sdRenderer.screen_width, sdRenderer.screen_height );
				ctx.drawImageFilterCache( sdRenderer.img_dark_lands, 0,0, sdRenderer.screen_width, sdRenderer.screen_height );
				
				ctx.globalAlpha = 1;
				
			}
			
			if ( sdWorld.time > sdRenderer.last_source_change + 5000 )
			{
				let best_source = null;
				let best_di = Infinity;
				for ( let i = 0; i < sdTheatre.theatres.length; i++ )
				{
					let e = sdTheatre.theatres[ i ];
					let di = sdWorld.Dist2D_Vector( sdWorld.my_entity.x - e.x, sdWorld.my_entity.y - e.y );
					if ( di < best_di )
					{
						best_di = di;
						best_source = e;
					}
				}
				
				let best_source_cmd = sdRenderer.last_source_entity ? ( sdRenderer.last_source_entity.service + '.' + sdRenderer.last_source_entity.video + '.' + sdRenderer.last_source_entity.channel ) : '';
				
				if ( best_source !== sdRenderer.last_source_entity || sdRenderer.last_source_cmd !== best_source_cmd )
				{
					sdRenderer.last_source_change = sdWorld.time;
					sdRenderer.last_source_entity = best_source;
					sdRenderer.last_source_cmd = best_source_cmd;
					
					if ( sdRenderer.last_source_entity )
					{
						if ( sdRenderer.last_source_entity.service === 'twitch' )
						{
							globalThis.RequireTwitchPlayerAndDo( ( twitch_player )=>
							{
								if ( !sdRenderer.last_source_entity || sdRenderer.last_source_entity._is_being_removed || sdRenderer.last_source_entity.service !== 'twitch' )
								return;
							
								if ( sdRenderer.last_source_entity.video )
								{
									twitch_player.setVideo( sdRenderer.last_source_entity.video );
									twitch_player.setMuted( false );
									
									sdRenderer.last_source_entity.UpdateVolume();
								}
								else
								if ( sdRenderer.last_source_entity.channel )
								{
									twitch_player.setChannel( sdRenderer.last_source_entity.channel );
									twitch_player.setMuted( false );
									
									sdRenderer.last_source_entity.UpdateVolume();
								}
							});
							globalThis.RequireYoutubePlayerAndDo( ( youtube_player )=>
							{
								youtube_player.stopVideo();
							});
						}
						else
						if ( sdRenderer.last_source_entity.service === 'youtube' )
						{
							globalThis.RequireYoutubePlayerAndDo( ( youtube_player )=>
							{
								if ( !sdRenderer.last_source_entity || sdRenderer.last_source_entity._is_being_removed || sdRenderer.last_source_entity.service !== 'youtube' )
								return;
							
								if ( sdRenderer.last_source_entity.video )
								{
									if ( youtube_player.getVideoData() === undefined || youtube_player.getVideoData().video_id !== sdRenderer.last_source_entity.video )
									{
										youtube_player.loadVideoById( sdRenderer.last_source_entity.video );
									}
									youtube_player.seekTo( sdRenderer.last_source_entity.playing_offset / 1000 );
									youtube_player.unMute();
									
									sdRenderer.last_source_entity.UpdateVolume();
								}
							});
							globalThis.RequireTwitchPlayerAndDo( ( twitch_player )=>
							{
								twitch_player.pause();
							});
						}
					}
				}
			}
		}
		
		ctx.translate( sdRenderer.screen_width / 2, sdRenderer.screen_height / 2 );
		ctx.scale( sdWorld.camera.scale, 
				   sdWorld.camera.scale );
		ctx.translate( -sdRenderer.screen_width / 2, -sdRenderer.screen_height / 2 );
		
		ctx.translate( -sdWorld.camera.x, -sdWorld.camera.y );
		
		if ( sdWorld.entity_classes.sdWeather.only_instance )
		{
			ctx.translate( 0, Math.sin( sdWorld.time / 30 ) * sdWorld.entity_classes.sdWeather.only_instance.quake_intensity / 100 );
		}
		
		ctx.translate( sdRenderer.screen_width / 2, sdRenderer.screen_height / 2 );
		
		// In-world
		{
			ctx.draw_offset = 0;
			ctx.camera_relative_world_scale = 1;
			
			

			let min_x = sdWorld.camera.x - 800/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width - 64;
			let max_x = sdWorld.camera.x + 800/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width + 64;

			let min_y = sdWorld.camera.y - 400/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width - 64;
			let max_y = sdWorld.camera.y + 400/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width + 64;
			
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
			ctx.z_offset = -32 * sdWorld.camera.scale;
			ctx.z_depth = 16 * sdWorld.camera.scale;
			
			const void_draw = sdEntity.prototype.DrawBG;
			
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			{
				const e = sdEntity.entities[ i ];
				if ( e.DrawBG !== void_draw )
				if ( e.x + e._hitbox_x2 > min_x )
				if ( e.x + e._hitbox_x1 < max_x )
				if ( e.y + e._hitbox_y2 > min_y )
				if ( e.y + e._hitbox_y1 < max_y )
				{
					ctx.volumetric_mode = e.DrawIn3D( -1 );
					ctx.object_offset = e.ObjectOffset3D( -1 );

					ctx.save();
					try
					{
						ctx.translate( e.x, e.y );

						// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
						e.DrawBG( ctx, false );
					}
					catch( err )
					{
						console.log( 'Image could not be drawn for ', e, err );
					}
					ctx.restore();
				}
			}
			
			ctx.z_offset = -16 * sdWorld.camera.scale;
			ctx.z_depth = 16 * sdWorld.camera.scale;
			
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			{
				const e = sdEntity.entities[ i ];
				
				if ( ( e.x + e._hitbox_x2 > min_x &&
					   e.x + e._hitbox_x1 < max_x &&
					   e.y + e._hitbox_y2 > min_y &&
					   e.y + e._hitbox_y1 < max_y ) ||
					   e === sdWeather.only_instance ||
					   ( e.__proto__.constructor === sdEffect.prototype.constructor && e._type === sdEffect.TYPE_BEAM ) ) // sdWorld.my_entity.__proto__.constructor
				{
					ctx.volumetric_mode = e.DrawIn3D( 0 );
					ctx.object_offset = e.ObjectOffset3D( 0 );

					ctx.save();
					try
					{
						ctx.translate( e.x, e.y );

						// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
						e.Draw( ctx, false );
					}
					catch( err )
					{
						console.log( 'Image could not be drawn for ', e, err );
					}
					ctx.restore();
				}
			}
			
			ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT;
			
			const void_draw_fg = sdEntity.prototype.DrawFG;
			
			//ctx.z_offset = 0 * sdWorld.camera.scale;
			//ctx.z_depth = 16 * sdWorld.camera.scale;
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			{
				const e = sdEntity.entities[ i ];
				
				if ( e.DrawFG !== void_draw_fg )
				{
					ctx.volumetric_mode = e.DrawIn3D( 1 );
					ctx.object_offset = e.ObjectOffset3D( 1 );
					ctx.camera_relative_world_scale = e.CameraDistanceScale3D( 1 );

					if ( ctx.camera_relative_world_scale < 1 ||
						 ( e.x + e._hitbox_x2 > min_x &&
						   e.x + e._hitbox_x1 < max_x &&
						   e.y + e._hitbox_y2 > min_y &&
						   e.y + e._hitbox_y1 < max_y ) )
					{
						ctx.save();
						try
						{
							ctx.translate( e.x, e.y );

							// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
							e.DrawFG( ctx, false );
						}
						catch( err )
						{
							console.log( 'Image could not be drawn for ', e, err );
						}
						ctx.restore();
					}
				}
			}
			
			//ctx.draw_offset = 0;
			
			ctx.object_offset = null;
			
			ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT;
			ctx.camera_relative_world_scale = 0.5;
			
			ctx.fillStyle = '#000000';
			for ( var step = 1; step <= 4; step++ )
			{
				ctx.globalAlpha = ( 1 - ( step / 5 ) ) * 0.5;
				
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
		
					// TODO: Add bounds check, though that is maybe pointless if server won't tell offscreen info
					
					if ( sdWorld.my_entity.driver_of )
					sdWorld.my_entity.driver_of.DrawHUD( ctx, false );
					else
					sdWorld.my_entity.DrawHUD( ctx, false );
				}
				catch( e )
				{
					console.log( 'Image could not be drawn for ',sdWorld.my_entity,e );
				}
				ctx.restore();
				
				if ( !sdContextMenu.open )
				{
					var best_ent = null;
					var best_di = -1;

					for ( var i = 0; i < sdEntity.entities.length; i++ )
					if ( sdEntity.entities[ i ].DrawHUD !== sdEntity.prototype.DrawHUD )
					{
						// If cursor overlaps
						var di = sdEntity.entities[ i ].GetAccurateDistance( sdWorld.my_entity.look_x, sdWorld.my_entity.look_y );
						
						/*
						
						var di = sdWorld.inDist2D(	sdWorld.my_entity.look_x, 
													sdWorld.my_entity.look_y, 
													Math.min( Math.max( sdEntity.entities[ i ].x + sdEntity.entities[ i ]._hitbox_x1, sdWorld.my_entity.look_x ), sdEntity.entities[ i ].x + sdEntity.entities[ i ]._hitbox_x2 ), 
													Math.min( Math.max( sdEntity.entities[ i ].y + sdEntity.entities[ i ]._hitbox_y1, sdWorld.my_entity.look_y ), sdEntity.entities[ i ].y + sdEntity.entities[ i ]._hitbox_y2 ), 8 );
													
						if ( di >= 0 ) */
						if ( di < 12 )
						{
							if ( di <= 0 )
							di -= 1;
						
							// Prioritize physical center
							di += sdWorld.Dist2D( sdWorld.my_entity.look_x, 
												  sdWorld.my_entity.look_y,
												  sdEntity.entities[ i ].x + ( sdEntity.entities[ i ]._hitbox_x1 + sdEntity.entities[ i ]._hitbox_x2 ) / 2,
												  sdEntity.entities[ i ].y + ( sdEntity.entities[ i ]._hitbox_y1 + sdEntity.entities[ i ]._hitbox_y2 ) / 2 ) * 0.001;

							if ( di < best_di || best_ent === null )
							{
								best_ent = sdEntity.entities[ i ];
								best_di = di;
							}
						}
					}
					if ( best_ent )
					if ( best_ent !== sdWorld.my_entity )
					if ( best_ent !== sdWorld.my_entity.driver_of )
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
				

				if ( sdWeather.only_instance )
				if ( false )
				{
					if ( sdWorld.my_entity )
					{
						//ctx.drawImage( sdWeather.img_scary_mode, sdWorld.my_entity.x - 250, sdWorld.my_entity.y - 250, 500, 500 );
						ctx.drawImageFilterCache( sdWeather.img_scary_mode, sdWorld.my_entity.x - 250, sdWorld.my_entity.y - 250, 500, 500 );
						
						//sdWorld.target_scale = 0.5;
						
						ctx.fillStyle = '#000000';
						
						ctx.fillRect(	sdWorld.my_entity.x + 250, 
										sdWorld.my_entity.y - sdRenderer.screen_height, 
										sdRenderer.screen_width, 
										sdRenderer.screen_height * 2 );
										
						ctx.fillRect(	sdWorld.my_entity.x - 250 - sdRenderer.screen_width, 
										sdWorld.my_entity.y - sdRenderer.screen_height, 
										sdRenderer.screen_width, 
										sdRenderer.screen_height * 2 );
										
						ctx.fillRect(	sdWorld.my_entity.x - sdRenderer.screen_width, 
										sdWorld.my_entity.y - 250 - sdRenderer.screen_height, 
										sdRenderer.screen_width * 2, 
										sdRenderer.screen_height );
										
						ctx.fillRect(	sdWorld.my_entity.x - sdRenderer.screen_width, 
										sdWorld.my_entity.y + 250, 
										sdRenderer.screen_width * 2, 
										sdRenderer.screen_height );
					}
				}
			}
			
			
			
			ctx.z_offset = 0;
			ctx.z_depth = 0;
			ctx.draw_offset = 100;
			ctx.camera_relative_world_scale = 0.5;
			
			// Ingame hud
			if ( sdWorld.my_entity )
			if ( sdRenderer.UseCrosshair() )
			{
				if ( sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ] &&
					 sdGun.classes[ sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].class ].is_build_gun )
				{
					/*ctx.drawImage( sdWorld.img_crosshair_build, 
						sdWorld.my_entity.look_x - 16, 
						sdWorld.my_entity.look_y - 16, 32,32 );*/
						
					ctx.drawImageFilterCache( sdWorld.img_crosshair_build, 
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
				{
					/*ctx.drawImage( sdWorld.img_crosshair, 
						sdWorld.my_entity.look_x - 16, 
						sdWorld.my_entity.look_y - 16, 32,32 );*/
						
					ctx.drawImageFilterCache( sdWorld.img_crosshair, 
						sdWorld.my_entity.look_x - 16, 
						sdWorld.my_entity.look_y - 16, 32,32 );
				}
			}
		}
		
		sdPathFinding.StaticRender( ctx );
		
		ctx.resetTransform();
		
		ctx.z_offset = 0;
		ctx.z_depth = 0;
		ctx.draw_offset = 100;
		ctx.camera_relative_world_scale = 0.5;
		
		// On-screen foregroud
		if ( sdWorld.my_entity )
		{
			let scale = ( 0.3 + 0.7 * sdRenderer.resolution_quality );
			
			ctx.globalAlpha = 0.5;
			ctx.fillStyle = '#000000';
			ctx.fillRect( 5, 5, 445 * scale, 17 );
			
			if ( sdRenderer.show_leader_board )
			ctx.fillRect( sdRenderer.screen_width - 200 * scale - 5, 5, 200 * scale, 20 + 20 * sdWorld.leaders.length * scale + 5 );
			
			ctx.globalAlpha = 1;
			
			ctx.fillStyle = '#ff0000';
			//ctx.fillRect( 7, 7, 296 * sdWorld.my_entity.hea / sdWorld.my_entity.hmax, 2 );
			ctx.font = 11*scale + "px Verdana";
			ctx.textAlign = 'left';
			ctx.fillStyle = '#ff0000';
			ctx.fillText("Health: " + Math.ceil( sdWorld.my_entity.hea ), 5 + 5 * scale, 17 );

			ctx.fillStyle = '#77aaff';
			ctx.fillText("Armor: " + Math.ceil( sdWorld.my_entity.armor ), 5 + 95 * scale, 17 );			

			ctx.fillStyle = '#00ffff';
			ctx.fillText("Matter: " + Math.floor( sdWorld.my_entity.matter ), 5 + 185 * scale, 17 );
			
			ctx.fillStyle = '#ffff00';
			ctx.fillText("Score: " + Math.floor( sdWorld.my_score ), 5 + 275 * scale, 17 );

			ctx.fillStyle = '#ffff00';
			ctx.fillText("Level: " + Math.floor( sdWorld.my_entity.build_tool_level ), 5 + 370 * scale, 17 );

			if ( globalThis.enable_debug_info )
			{
				ctx.fillStyle = '#AAAAff';
				ctx.fillText("Last long server frame time took: " + Math.floor( sdWorld.last_frame_time ) + "ms (slowest case entity was "+sdWorld.last_slowest_class+")", 5 + 445 * scale, 17 );
				
				ctx.fillStyle = '#AAAAff'; // By MrMcShroom / ZapruderFilm // EG: Could be also nice to eventually not let players know where they are exactly - maybe some in-game events would lead to that
           		//ctx.fillText("Coordinates: X = " + sdWorld.my_entity.x.toFixed(0) + ", Y = " + sdWorld.my_entity.y.toFixed(0), 420, 50 );	
           		ctx.fillText("Coordinates: X = " + sdWorld.my_entity.x.toFixed(0) + ", Y = " + sdWorld.my_entity.y.toFixed(0), 5 + 445 * scale, 30 );	
			}
			
			if ( sdRenderer.show_leader_board )
			{
				ctx.fillStyle = '#AAAAAA';
				ctx.fillText("Leaderboard:", sdRenderer.screen_width - 200 * scale - 5 + 5, 20 );

				ctx.textAlign = 'right';
				ctx.fillStyle = '#AAAAAA';
				ctx.fillText( globalThis.players_playing+ " alive", sdRenderer.screen_width - 5 - 5, 20 );

				//for ( var i = 0; i < sdWorld.leaders.length; i++ )
				for ( var i = 0; i < sdWorld.leaders.length; i++ )
				{
					ctx.textAlign = 'left';

					let main_color = '#FFFFFF';

					if ( sdWorld.leaders[ i ].name === sdWorld.my_entity.title )
					if ( sdWorld.leaders[ i ].score === sdWorld.my_score )
					main_color = '#66ff66';
					
					if ( sdWorld.leaders[ i ].here )
					{
					    ctx.fillStyle = main_color;
					}
					else
					ctx.fillStyle = '#666666';
				
					if ( sdWorld.client_side_censorship && sdWorld.leaders[ i ].name_censored )
					ctx.fillText( (i+1)+". " + ( ( i < sdWorld.leaders.length ) ? 'Censored Defender' : '' ), sdRenderer.screen_width - 200 * scale - 5 + 5, 20 + ( i + 1 ) * 20 * scale );
					else
					ctx.fillText( (i+1)+". " + ( ( i < sdWorld.leaders.length ) ? sdWorld.leaders[ i ].name : '' ), sdRenderer.screen_width - 200 * scale - 5 + 5, 20 + ( i + 1 ) * 20 * scale );

					ctx.fillStyle = main_color;

					ctx.textAlign = 'right';
					ctx.fillText( ( ( i < sdWorld.leaders.length ) ? sdWorld.leaders[ i ].score : '' ), sdRenderer.screen_width - 15, 20 + ( i + 1 ) * 20 * scale );
				}
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
				/*ctx.drawImage( sdWorld.img_cursor, 
					sdWorld.mouse_screen_x, 
					sdWorld.mouse_screen_y, 64,64 );*/
					
				ctx.drawImageFilterCache( sdWorld.img_cursor, 
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
		
		if ( typeof ctx.FakeEnd !== 'undefined' )
		ctx.FakeEnd();
	}
}
//sdRenderer.init_class();

export default sdRenderer;