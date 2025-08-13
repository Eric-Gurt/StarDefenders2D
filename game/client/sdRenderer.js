
/* global FakeCanvasContext, userAgent, globalThis, Infinity, sdMatterAmplifier, sdCrystal, Coloris, BROWSER_GECKO, sdMusic */

import sdWorld from '../sdWorld.js';
import sdShop from '../client/sdShop.js';
import sdChat from '../client/sdChat.js';
import sdContextMenu from '../client/sdContextMenu.js';

import sdPathFinding from '../ai/sdPathFinding.js';

import sdEntity from '../entities/sdEntity.js';
import sdWeather from '../entities/sdWeather.js';
import sdBlock from '../entities/sdBlock.js';
import sdDoor from '../entities/sdDoor.js';
import sdEffect from '../entities/sdEffect.js';
import sdGun from '../entities/sdGun.js';
import sdTheatre from '../entities/sdTheatre.js';
import sdTask from '../entities/sdTask.js';
import sdLamp from '../entities/sdLamp.js';
import sdFaceCrab from '../entities/sdFaceCrab.js';
import sdStatusEffect from '../entities/sdStatusEffect.js';
import sdCharacter from '../entities/sdCharacter.js';
import sdPlayerSpectator from '../entities/sdPlayerSpectator.js';
import sdOctopus from '../entities/sdOctopus.js';
import sdWanderer from '../entities/sdWanderer.js';

import sdAtlasMaterial from './sdAtlasMaterial.js';

class sdRenderer
{
	static init_class()
	{
		//console.warn('sdRenderer class initiated');
		
		if ( typeof window === 'undefined' )
		return;
	
		sdRenderer.img_sun = sdWorld.CreateImageFromFile( 'sun' );
		
		sdRenderer.ad_happens = false;
		
		sdRenderer.dark_tint = 1;
		
		sdRenderer.debug_nothing_screen = false;
		sdRenderer._quake_screen_shake_since = 0;
		
		sdRenderer.line_of_sight_mode = true;
		
		sdRenderer.single_player_visibles_array = [];
	
		sdRenderer.distance_scale_background = 1.4; // 1.2
		sdRenderer.distance_scale_in_world = 1; // Can be altered with .CameraDistanceScale3D
		sdRenderer.distance_scale_fading_world_edges = 0.8;
		sdRenderer.distance_scale_in_game_hud = 0.7;
		sdRenderer.distance_scale_on_screen_hud = 0.6; // Hitpoints, tasks
		sdRenderer.distance_scale_on_screen_foreground = 0.5; // Shop, chat, context menu
				
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
		sdRenderer.service_mesage_untranslateables = null;
		sdRenderer.service_mesage_color = null;
		
		sdRenderer.last_source_change = sdWorld.time;
		sdRenderer.last_source_entity = null;
		sdRenderer.last_source_cmd = '';
		
		sdRenderer.show_key_hints = 0;
		
		//canvas.style.width = '100%';
		
		//canvas.style.transform = 'scale(' + window.innerWidth / 800 + ')';
		//canvas.style.imageRendering = 'pixelated';
		
		sdRenderer.canvas = canvas;
		
		document.body.insertBefore( canvas, null );
		
		//sdRenderer._visual_settings = 0;
		sdRenderer.visual_settings = 0; // 0; // Still used at some parts of code
		sdRenderer.shading = true; // New approach, affects shading and line of sight stuff
		sdRenderer.effects_quality = 2; // Smoke and gore
		
		sdRenderer.show_leader_board = 1; // Used for displaying tasks too
		sdRenderer.display_coords = 0;
		
		//sdRenderer.ctx = canvas.getContext("2d");
		//sdRenderer.ctx = canvas.getContext('webgl-2d');
		//sdRenderer.ctx = new FakeCanvasContext( canvas );
		sdRenderer.ctx = null;
		
		//sdRenderer.lumes_cache = {};
		//sdRenderer.lumes_cache_hashes = [];
		//sdRenderer.lumes_cache_hash_i = 0;
		//sdRenderer.lumes_weak_cache = new WeakMap();
		
		sdRenderer.known_light_sources_previous = [];
		sdRenderer.known_light_sources = []; // Array of entities
		
		sdRenderer.visible_chunks = new Map(); // hash -> { x, y, last_active_visibility_time, active_visibility, opacity }
		
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
				
				sdWorld.target_scale = sdWorld.current_zoom / 800 * sdRenderer.screen_width;
				sdWorld.target_scale = Math.round( sdWorld.target_scale * 8 ) / 8; // Should be rounded too
				
				if ( sdRenderer.ctx )
				{
					if ( sdRenderer.ctx.renderer )
					{
						sdRenderer.ctx.camera.aspect = innerWidth / innerHeight;
						sdRenderer.ctx.renderer.setSize( innerWidth, innerHeight );

						/*if ( sdRenderer.visual_settings === 4 )
						{
						}
						else*/
						{

							sdRenderer.ctx.camera.position.x = innerWidth / 2;
							sdRenderer.ctx.camera.position.y = innerHeight / 2;
							sdRenderer.ctx.camera.position.z = -811 * ( 1 * innerHeight / 937 );

							sdRenderer.ctx.camera.near = 400 * ( 1 * innerHeight / 937 );
							sdRenderer.ctx.camera.far = 1200 * ( 1 * innerHeight / 937 );
						}

						sdRenderer.ctx.camera.updateProjectionMatrix();
						
						sdAtlasMaterial.UpdateDotsScale();
					}

					sdRenderer.sky_gradient = sdRenderer.ctx.createLinearGradient( 0, 0, 0, sdRenderer.screen_height );
					sdRenderer.sky_gradient.addColorStop( 0, '#7b3219' );
					sdRenderer.sky_gradient.addColorStop( 1, '#b75455' );
				}
				
				globalThis.startupScreenOnResize();
			};
			//window.onresize();
			
			sdRenderer.img_dark_lands = sdWorld.CreateImageFromFile( 'dark_lands' );
			sdRenderer.img_dark_lands2 = sdWorld.CreateImageFromFile( 'dark_lands2' ); // For parallax background
			sdRenderer.img_dark_lands3 = sdWorld.CreateImageFromFile( 'dark_lands3' ); // For parallax background
		}
		
		sdRenderer.image_filter_cache = new Map();
		
		sdRenderer.unavailable_image_collector = null; // Fills up indefinitely if array
	
		sdRenderer.last_frame_times = []; // For framerate measurement
	
		sdRenderer.AddCacheDrawMethod = function( ctx0 )
		{
			ctx0.sd_filter = null;
			ctx0.sd_tint_filter = null;
			
			ctx0.sd_status_effect_filter = null;
			ctx0.sd_status_effect_tint_filter = null;
			
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
				//const sd_filter = ctx0.sd_filter; // custom filter, { colorA:replacementA, colorB:replacementB }
				//const sd_tint_filter = ctx0.sd_tint_filter; // custom filter, [ r, g, b ], multiplies
				
				//const sd_status_effect_filter = ctx0.sd_status_effect_filter; // Separate slot to apply sd_fitlers
				
				const sd_filter = ctx0.sd_status_effect_filter ? ctx0.sd_status_effect_filter : ctx0.sd_filter; // custom filter, { colorA:replacementA, colorB:replacementB }
				const sd_tint_filter = null;//ctx0.sd_status_effect_tint_filter ? ( ctx0.sd_tint_filter ? [ ctx0.sd_tint_filter[0]*ctx0.sd_status_effect_tint_filter[0], ctx0.sd_tint_filter[1]*ctx0.sd_status_effect_tint_filter[1], ctx0.sd_tint_filter[2]*ctx0.sd_status_effect_tint_filter[2] ] : ctx0.sd_status_effect_tint_filter ) : ctx0.sd_tint_filter; // custom filter, [ r, g, b ], multiplies

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
					const complex_filter_name = 
							sd_tint_filter ?
								filter + '/' + ( sd_filter ? sd_filter.s : '' ) + '/' + sd_tint_filter[ 0 ] + '/' + sd_tint_filter[ 1 ] + '/' + sd_tint_filter[ 2 ] :
								filter + '/' + ( sd_filter ? sd_filter.s : '' );

					let image_obj = args[ 0 ];

					let image_obj_cache = null;
					
					image_obj_cache = sdRenderer.image_filter_cache.get( image_obj );

					//if ( sdRenderer.image_filter_cache.has( image_obj ) )
					//image_obj_cache = sdRenderer.image_filter_cache.get( image_obj );
					//else
					if ( image_obj_cache === undefined )
					{
						// Make
						//image_obj_cache = {};
						image_obj_cache = new Map();
						sdRenderer.image_filter_cache.set( image_obj, image_obj_cache );
					}
					
					/*if ( complex_filter_name.indexOf( 'hue-rotate' ) !== -1 )
					{
						debugger;
					}*/
					
					//let t0 = Date.now();
					
					let image_obj_cache_named_item = image_obj_cache.get( complex_filter_name );
					
					//let t1 = Date.now();
					
					//if ( image_obj_cache.size > 100 || t1-t0 > 2 )
					//debugger;
					
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


							if ( userAgent[0] === "Gecko" && userAgent[1] === BROWSER_GECKO )
							// Recolor. Firefox supports color correction in the PNG format and isn't supported in most softwares (exc: Microsoft Paint or MSPaint)
							// See https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types#png_portable_network_graphics
							for ( let i = 1; i < data.length; i++ )
							if ( data[ i ] !== 0 )
							// sdRenderer.roundBGRA8( data, data[ i ], sd_filter.is_gun )
							data[ i ] = sdRenderer.applyColorCorrection( data, data[ i ], sd_filter.is_gun );

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
								if ( sd_filter.s.length === 6 ) // Flood fill
								{
									let r2 = parseInt( sd_filter.s.substring( 0, 2 ), 16 );
									let g2 = parseInt( sd_filter.s.substring( 2, 4 ), 16 );
									let b2 = parseInt( sd_filter.s.substring( 4, 6 ), 16 );

									for ( let i = 0; i < data.length; i += 4 )
									if ( data[ i + 3 ] > 0 )
									{
										data[ i ] = r2;
										data[ i + 1 ] = g2;
										data[ i + 2 ] = b2;
									}
								}
								else
								{
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
							}
							
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
					
					//let sd_hue_rotation = ctx0.sd_hue_rotation; // This one is now handled by optimized rendering mode (v4)
					
					ctx0.filter = 'none';
					
					//ctx0.sd_hue_rotation = sd_hue_rotation;

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
		
		sdRenderer.dark_lands_canvases = [];
		sdRenderer.dark_lands_canvases_fill = [];
		sdRenderer.dark_lands_colors = [
			'#050203',
			'#0b0507',
			'#12070a',
			'#1a090d',
			'#250c12',
			'#2d0e14',
			'#40131c',
			'#5a1b27'
		];
		sdRenderer.dark_lands_width = 800;
		
		sdRenderer.visibility_falloff = 64; // 
		sdRenderer.visibility_extra = 0; // 32 - occasionaly unsynced blocks are visible
		
		sdRenderer.last_render = sdWorld.time;
		
		if ( !sdWorld.is_server )
		{
			sdRenderer.old_visibility_map = null;
			sdRenderer.ray_trace_point_results = null; // arr of { x, y, until, hit_entity }
			
			let img_ground88 = sdWorld.CreateImageFromFile( 'ground_8x8' );
		
			function GenerateDarkLands()
			{
				
				let old_seed = sdWorld.SeededRandomNumberGenerator.seed;
				sdWorld.SeededRandomNumberGenerator.seed = 5892489;
				{

					for ( let i = 0; i < sdRenderer.dark_lands_colors.length; i++ )
					{
						let c = document.createElement('canvas');
						c.width = sdRenderer.dark_lands_width;
						c.height = 400;

						let c2 = document.createElement('canvas');
						c2.width = sdRenderer.dark_lands_width;
						c2.height = 400;

						let ctx = c.getContext("2d");
						let ctx2 = c2.getContext("2d");
						//

						let scale = ( 1 / ( sdRenderer.dark_lands_colors.length - i ) );

						ctx2.save();

							let image_scale = scale * 2;

							ctx2.scale( image_scale, image_scale );
							ctx2.filter = 'saturate(0) brightness(3)';
							ctx2.fillStyle = ctx2.createPattern( img_ground88, "repeat" );
							ctx2.fillRect( 0, 0, sdRenderer.dark_lands_width / image_scale, 400 / image_scale );

							ctx2.filter = 'none';
							ctx2.globalCompositeOperation = 'multiply';
							ctx2.fillStyle = sdRenderer.dark_lands_colors[ i ];
							ctx2.fillRect( 0, 0, sdRenderer.dark_lands_width / image_scale, 400 / image_scale );

						ctx2.restore();

						ctx.drawImage( c2, 0,0 );


						ctx.save();

							ctx.globalCompositeOperation = 'destination-atop';

							ctx.beginPath();
							{
								let h = 0;

								let heights = [];
								let iters = ~~( 300 * scale ); // 100 // Noise smooth
								for ( let x = 0; x <= sdRenderer.dark_lands_width; x += 1 )
								{
									let sum = 0;
									for ( let xx = 0; xx < iters; xx++ )
									sum += sdWorld.SeededRandomNumberGenerator.random( ( x + xx ) % sdRenderer.dark_lands_width, i );

									sum /= iters;

									h = ( sum - 0.5 ) * scale * 800; // 400
									heights.push( h );
								}

								let smoothness = ~~( 100 * scale ); // 160
								for ( let s = 0; s < smoothness; s++ ) // Result smooth
								{
									let heights2 = heights.slice();
									for ( let x = 0; x <= sdRenderer.dark_lands_width; x += 1 )
									{
										let x0 = heights[ ( x - 1 + sdRenderer.dark_lands_width ) % sdRenderer.dark_lands_width ];
										let x1 = heights[ x ];
										let x2 = heights[ ( x + 1 ) % sdRenderer.dark_lands_width ];

										heights2[ x ] = ( x0 + x1 + x2 ) / 3;
									}
									heights = heights2;
								}

								for ( let x = 0; x <= sdRenderer.dark_lands_width; x += 1 )
								{
									h = heights[ x ];

									if ( x === 0 )
									ctx.moveTo( x, 200 + h );
									else
									ctx.lineTo( x, 200 + h );
								}
								ctx.lineTo( 800, 200 + h );
								ctx.lineTo( 800, 400 );
								ctx.lineTo( 0, 400 );
							}


							//ctx.globalCompositeOperation = 'source-over';
							//ctx.filter = 'none';
							//ctx.fillStyle = sdRenderer.dark_lands_colors[ i ];
							ctx.fill();

							//ctx.clip();

							//ctx.globalCompositeOperation = 'luminosity';
							//ctx.filter = 'grayscale(1) brightness(2)';

						ctx.restore();

						sdRenderer.dark_lands_canvases.push( c );
						sdRenderer.dark_lands_canvases_fill.push( c2 );
					}
				}
				sdWorld.SeededRandomNumberGenerator.seed = old_seed;
			}
			
			if ( !img_ground88.loaded )
			{
				img_ground88.RequiredNow();
				
				img_ground88.callbacks.push( GenerateDarkLands );
			}
			else
			{
				GenerateDarkLands();
			}
		}
	}

	static applyColorCorrection( data, number = 127, is_gun = false ) // roundBGRA8( data, number = 127, is_gun = false )
	{
		switch( number )
		{
			case 127:
			case 191:
			case 254:
			if ( data.length !== 81920 || number === 191 || number === 254 )
			number++;
			break;

			case 126:
			case 190:
			number += 2;
			break;

			case 124:
			number += 4;
			break;

			case 132:
			number -= 4;
			break;

			case 193:
			case 129:
			number--;
			break;

			case 130:
			number -= 2;
			break;

			case 189:
			case 125:
			number += 3;
			break;

			case 195:
			case 131:
			number -= 3;
			break;

			case 54:
			case 53:
			case 52:
			case 27:
			case 18:
			case 17:
			case 15:
			case 11:
			case 3:
			case 2:
			case 1:
			if ( !is_gun )
			number = 0;
			break;
		}

		return number;
	}
	
	static SaveLightSource( ent )
	{
		//if ( sdRenderer.known_light_sources.indexOf( ent ) === -1 )
		{
			for ( let i = 0; i < sdRenderer.known_light_sources.length; i++ )
			{
				let ent2 = sdRenderer.known_light_sources[ i ];
				
				if ( ent2 === ent )
				return;

				if ( ent2._class_id === ent._class_id )
				if ( sdWorld.inDist2D_Boolean( ent.x, ent.y, ent2.x, ent2.y, 25 ) )
				return;
			}

			sdRenderer.known_light_sources.push( ent );
		}
	}
	
	static InitVisuals()
	{
		if ( sdRenderer.visual_settings !== 4 )
		{
			sdRenderer.visual_settings = 4;
			
			sdRenderer.ctx = new FakeCanvasContext( sdRenderer.canvas );
			//sdRenderer.AddCacheDrawMethod( sdRenderer.ctx );

			sdAtlasMaterial.super_texture_width = 1024;
			if ( userAgent[ 0 ] !== "Gecko" && userAgent[ 1 ] !== BROWSER_GECKO )
			sdAtlasMaterial.super_texture_height = Math.min( sdRenderer.ctx.renderer.capabilities.maxTextureSize, 16384 );
			else // Firefox takes too long on the image if the super texture's height is greater than the value that Firefox expected
			sdAtlasMaterial.super_texture_height = 1024;
			
			if ( sdRenderer.ctx.sky.parent );
			sdRenderer.ctx.sky.parent.remove( sdRenderer.ctx.sky );

			if ( sdRenderer.ctx.sun.parent );
			sdRenderer.ctx.sun.parent.remove( sdRenderer.ctx.sun );

			sdRenderer.ctx.renderer.shadowMap.enabled = false;
			
			window.onresize();
		}
	}
	
	/*static set visual_settings( v )
	{
		v = 4; // Only one rendering mode for now
		
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
			
			if ( v === 2 || v === 4 )
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
			
			
			window.onresize();
		}
		else
		alert('Application restart required for visual settings to change once again');
	}
	static get visual_settings()
	{
		return sdRenderer._visual_settings;
	}*/
	
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
	static GetVisibleEntities()
	{
		return ( sdWorld.is_singleplayer ? sdRenderer.single_player_visibles_array : sdEntity.entities );
	}
	static Render( frame )
	{
		let GSPEED = sdWorld.GSPEED;
		
		/*if ( !document.hasFocus() ) Can be inaccurate
		if ( Math.random() > 0.1 )
		return;*/
												
		let visible_entities = sdEntity.entities;
		
		let min_x = sdWorld.camera.x - 800/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width - 64;
		let max_x = sdWorld.camera.x + 800/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width + 64;

		let min_y = sdWorld.camera.y - 400/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width - 64;
		let max_y = sdWorld.camera.y + 400/2 / sdWorld.camera.scale / 800 * sdRenderer.screen_width + 64;

		if ( sdWorld.is_singleplayer )
		{
			const mark_flag_reference = sdEntity.flag_counter++;
			
			visible_entities = sdRenderer.single_player_visibles_array = [];
			
			let tot = 0;
			
			for ( let yy = Math.round( min_y ); yy < max_y; yy += sdWorld.CHUNK_SIZE )
			for ( let xx = Math.round( min_x ); xx < max_x; xx += sdWorld.CHUNK_SIZE )
			{
				let arr = sdWorld.RequireHashPosition( xx, yy ).arr;
				
				for ( let i = 0; i < arr.length; i++ )
				{
					let e = arr[ i ];
					if ( e._flag2 !== mark_flag_reference )
					{
						e._flag2 = mark_flag_reference;
						visible_entities[ tot++ ] = e;
					}
				}
			}
			visible_entities.length = tot;
		}
			
		const show_hud = ( !sdWorld.my_entity || !sdWorld.my_entity.is( sdPlayerSpectator ) || sdChat.open || sdContextMenu.open );
			
		let ms_since_last_render = sdRenderer.last_render - sdWorld.time;
		sdRenderer.last_render = sdWorld.time;
		
		sdRenderer.known_light_sources_previous = sdRenderer.known_light_sources.slice();
		sdRenderer.known_light_sources.length = 0;
		
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
	
		sdAtlasMaterial.CameraPositionUpdated();
			
		ctx.z_offset = 0;
		ctx.z_depth = 0;
		ctx.draw_offset = -100;
		ctx.camera_relative_world_scale = sdRenderer.distance_scale_background;
		
		ctx.imageSmoothingEnabled = false;
		
		ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT;
		
		
			
		
		
		
			
			
		
		// BG
		{
			//ctx.fillStyle = "#7b3219";
			
			
			ctx.fillStyle = '#000000';
			if ( sdRenderer.debug_nothing_screen )
			ctx.fillStyle = '#0000FF';
			ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
			
			//ctx.drawImage( sdRenderer.img_dark_lands, 0,0, sdRenderer.screen_width, sdRenderer.screen_height );
			
			if ( !sdRenderer.debug_nothing_screen )
			if ( sdWeather.only_instance )
			{
				ctx.fillStyle = '#000000';
				
				if ( ctx.sky )
				{	
					let br = false;
					
					if ( sdWorld.my_entity )
					{
						for ( var i = 0; i < sdLamp.lamps.length; i++ )
						if ( sdWorld.inDist2D( sdLamp.lamps[ i ].x, sdLamp.lamps[ i ].y, sdWorld.my_entity.x, sdWorld.my_entity.y, 800 ) > 0 )
						if ( sdWorld.CheckLineOfSight( sdLamp.lamps[ i ].x, sdLamp.lamps[ i ].y, sdWorld.my_entity.x, sdWorld.my_entity.y, sdLamp.lamps[ i ], null, sdCom.com_vision_blocking_classes ) )
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
			
				/*{
					ctx.globalAlpha = 1;
					
					//ctx.drawImageFilterCache( sdRenderer.img_dark_lands, 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
					//ctx.globalAlpha = 1; // Not sure if parallax stuff in front should be transparent during planet's daylight

					//Parallax background
					ctx.drawImageFilterCache( sdRenderer.img_dark_lands2, - sdRenderer.screen_width - ( ( sdWorld.camera.x / 2 ) % sdRenderer.screen_width ), sdRenderer.screen_height / 4 - ( ( sdWorld.camera.y / sdWorld.world_bounds.y2 ) * ( sdRenderer.screen_height ) ), sdRenderer.screen_width, sdRenderer.screen_height );
					ctx.drawImageFilterCache( sdRenderer.img_dark_lands2, 0 - ( ( sdWorld.camera.x / 2 ) % sdRenderer.screen_width ), sdRenderer.screen_height / 4 - ( ( sdWorld.camera.y / sdWorld.world_bounds.y2 ) * ( sdRenderer.screen_height ) ), sdRenderer.screen_width, sdRenderer.screen_height );
					ctx.drawImageFilterCache( sdRenderer.img_dark_lands2, sdRenderer.screen_width - ( ( sdWorld.camera.x / 2 ) % sdRenderer.screen_width ), sdRenderer.screen_height / 4 - ( ( sdWorld.camera.y / sdWorld.world_bounds.y2 ) * ( sdRenderer.screen_height ) ), sdRenderer.screen_width, sdRenderer.screen_height );

					// Closer parallax background
					ctx.drawImageFilterCache( sdRenderer.img_dark_lands3, - sdRenderer.screen_width - ( ( sdWorld.camera.x ) % sdRenderer.screen_width ), sdRenderer.screen_height / 2 - ( ( sdWorld.camera.y / sdWorld.world_bounds.y2 ) * ( sdRenderer.screen_height * 1.5 ) ), sdRenderer.screen_width, sdRenderer.screen_height * 2 );
					ctx.drawImageFilterCache( sdRenderer.img_dark_lands3, 0 - ( ( sdWorld.camera.x ) % sdRenderer.screen_width ), sdRenderer.screen_height / 2 - ( ( sdWorld.camera.y / sdWorld.world_bounds.y2 ) * ( sdRenderer.screen_height * 1.5 ) ), sdRenderer.screen_width, sdRenderer.screen_height * 2 );
					ctx.drawImageFilterCache( sdRenderer.img_dark_lands3, sdRenderer.screen_width - ( ( sdWorld.camera.x ) % sdRenderer.screen_width ), sdRenderer.screen_height / 2 - ( ( sdWorld.camera.y / sdWorld.world_bounds.y2 ) * ( sdRenderer.screen_height * 1.5 ) ), sdRenderer.screen_width, sdRenderer.screen_height * 2 );
				}*/
				
				let current_camera_scale = ( sdWorld.camera.scale / 4.75 );
				
				let offset_scale = sdRenderer.screen_height / 400;
				let w = offset_scale * 800 * current_camera_scale;
				let h = offset_scale * 400 * current_camera_scale;
				
				// sdWanderer / background entities
				if ( sdWanderer.wanderers.length > 0 )
				{
					// Same as dark land parallax canvas / background
					//ctx.sd_color_mult_r = 
					//ctx.sd_color_mult_g = 
					//ctx.sd_color_mult_b = 1 / ( 1 + Math.max( 0, sdWorld.camera.y - sdWorld.base_ground_level - 256 ) * 0.003 );
					for ( let i = 0; i < sdWanderer.wanderers.length; i++ )
					{
						let wanderer = sdWanderer.wanderers[ i ];
						ctx.camera_relative_world_scale = sdRenderer.distance_scale_background - wanderer.layer * 0.001;
		
						let xx = sdRenderer.screen_width / 2;
						let yy = sdRenderer.screen_height / 2;
			
						let scale = ( 1 / ( sdRenderer.dark_lands_colors.length - wanderer.layer ) ) * offset_scale * current_camera_scale;
					
						xx += ( 0 - sdWorld.camera.x + wanderer.x ) * scale;
						yy += ( sdWorld.base_ground_level + 150 - sdWorld.camera.y + wanderer.y + Math.sin( wanderer._net_id * 21.3281 + sdWorld.time * 0.001 ) * 10 ) * scale;
					
						xx -= sdRenderer.screen_width / 2 * current_camera_scale;
						yy -= sdRenderer.screen_height / 2 * current_camera_scale;
						
					
						yy = Math.max( yy, yy % h - h ); // Faster for "deep down" cases
					
						ctx.globalAlpha = 1; // Just in case
						
						//ctx.drawImageFilterCache( sdWorld.CreateImageFromFile( 'fmech_boost' ), xx, yy, 64 * scale, 64 * scale );
						ctx.drawImageFilterCache( sdWorld.CreateImageFromFile( wanderer.GetImageFromModel() ), wanderer.GetXOffsetFromModel(),wanderer.GetYOffsetFromModel(),
						wanderer.GetWidthFromModel(), wanderer.GetHeightFromModel(), xx, yy,
						wanderer.GetWidthFromModel() * scale * wanderer.side, wanderer.GetHeightFromModel() * scale );
						
						// Not ideal but it works? - Booraz149
					}
				}
				//
				
				
				if ( sdRenderer.dark_lands_canvases )
				for ( let i = 0; i < sdRenderer.dark_lands_colors.length; i++ )
				{
					ctx.sd_color_mult_r = 
					ctx.sd_color_mult_g = 
					ctx.sd_color_mult_b = 1 / ( 1 + Math.max( 0, sdWorld.camera.y - sdWorld.base_ground_level - 256 ) * 0.003 );

					ctx.camera_relative_world_scale = sdRenderer.distance_scale_background - i * 0.001;
		
					let xx = sdRenderer.screen_width / 2;
					let yy = sdRenderer.screen_height / 2;
			
					let scale = ( 1 / ( sdRenderer.dark_lands_colors.length - i ) ) * offset_scale * current_camera_scale;
					
					xx += ( 0 - sdWorld.camera.x ) * scale;
					yy += ( sdWorld.base_ground_level + 150 - sdWorld.camera.y ) * scale;
					
					xx -= sdRenderer.screen_width / 2 * current_camera_scale;
					yy -= sdRenderer.screen_height / 2 * current_camera_scale;
					
					yy = Math.max( yy, yy % h - h ); // Faster for "deep down" cases
					
					ctx.globalAlpha = 1; // Just in case
					
					ctx.sd_hue_rotation = ( sdWorld.mod( sdWorld.camera.x / 16, 360 ) );
					
					if ( yy < sdRenderer.screen_height )
					{
						//while ( xx < 0 )
						//xx += w;
						
						xx = xx % w; // Faster for "far lands" case

						while ( xx > 0 )
						xx -= w;

						while ( xx < sdRenderer.screen_width )
						{
							if ( sdRenderer.dark_lands_canvases[ i ] )
							ctx.drawImageFilterCache( sdRenderer.dark_lands_canvases[ i ], xx, yy, w, h );
							
							let yy2 = yy + h;
							
							while ( yy2 < sdRenderer.screen_height )
							{
								if ( sdRenderer.dark_lands_canvases_fill[ i ] )
								ctx.drawImageFilterCache( sdRenderer.dark_lands_canvases_fill[ i ], xx, yy2, w, h );
								
								yy2 += h;
							}
							
							xx += w;
						}

						/*if ( yy + h < sdRenderer.screen_height )
						{
							ctx.fillStyle = sdRenderer.dark_lands_colors[ i ];
							ctx.fillRect( 0, yy + h, sdRenderer.screen_width, sdRenderer.screen_height );
						}*/
					}
					
					//ctx.sd_hue_rotation = 1;
					ctx.sd_hue_rotation = ( sdWorld.mod( sdWorld.camera.x * 0.8 / 16, 360 ) );
					
					let brightness = 3 / sdRenderer.dark_lands_colors.length;
					
					let day_progress = sdWeather.only_instance.day_time / ( 30 * 60 * 24 ) * Math.PI * 2 - Math.PI;
					
					if ( sdWeather.only_instance._dustiness > 0 )
					brightness += sdWeather.only_instance._dustiness * 6 / sdRenderer.dark_lands_colors.length;
					
					ctx.globalAlpha = Math.min( 0.99, ( Math.cos( day_progress ) * 0.5 + 0.5 ) * brightness );
					ctx.fillStyle = sdRenderer.sky_gradient;
					ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
					
					if ( i === sdRenderer.dark_lands_colors.length - 1 )
					{
						ctx.globalAlpha = ( Math.cos( day_progress ) * 1 ) * ( 1 - sdWeather.only_instance._dustiness * 0.9 ); // Just in case
						
						if ( ctx.globalAlpha > 0 )
						{
							let old_vol = ctx.volumetric_mode;
							ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT;
							ctx.camera_relative_world_scale = sdRenderer.distance_scale_background - 0.001;// - sdRenderer.dark_lands_colors.length * 0.001;

							if ( sdRenderer.img_sun.loaded )
							ctx.drawImageFilterCache( sdRenderer.img_sun, 
								-200 + sdRenderer.screen_width / 2 - Math.sin( day_progress ) * sdRenderer.screen_width / 2 * 0.8, 
								-200 + sdRenderer.screen_height / 2 - Math.cos( day_progress ) * sdRenderer.screen_height / 2 * 0.5 );
							else
							sdRenderer.img_sun.RequiredNow();

							ctx.volumetric_mode = old_vol;
						}
					}
				}
				
				ctx.sd_color_mult_r = 1;
				ctx.sd_color_mult_g = 1;
				ctx.sd_color_mult_b = 1;
				
				//ctx.camera_relative_world_scale = sdRenderer.distance_scale_background + sdRenderer.dark_lands_colors.length + 0.001;
				
				/*ctx.globalAlpha = Math.cos( sdWeather.only_instance.day_time / ( 30 * 60 * 24 ) * Math.PI * 2 ) * 0.5 + 0.5;
				ctx.fillStyle = sdRenderer.sky_gradient;
				ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
				*/
				ctx.globalAlpha = 1; // Just in case
				ctx.sd_hue_rotation = 0;
			}
			
			if ( !sdRenderer.debug_nothing_screen )
			if ( sdWorld.show_videos )
			if ( sdWorld.time > sdRenderer.last_source_change + 5000 )
			{
				let best_source = null;
				let best_di = Infinity;
				if ( sdWorld.my_entity )
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
			if ( sdRenderer._quake_screen_shake_since === 0 )
			sdRenderer._quake_screen_shake_since = sdWorld.time;
			
			let quake_intensity = sdWorld.entity_classes.sdWeather.only_instance.quake_intensity / 100;
			if ( quake_intensity > 0 )
			{
				quake_intensity = Math.max( 0.1, 1 / ( 1 + ( sdWorld.time - sdRenderer._quake_screen_shake_since ) / 1000 ) );
				ctx.translate( 0, Math.sin( sdWorld.time / 30 ) * quake_intensity );
			}
			else
			{
				sdRenderer._quake_screen_shake_since = sdWorld.time;
			}
		}
		
		ctx.translate( sdRenderer.screen_width / 2, sdRenderer.screen_height / 2 );
		
		// In-world
		{
			ctx.draw_offset = 0;
			ctx.camera_relative_world_scale = sdRenderer.distance_scale_in_world;
			
			ctx.apply_shading = true;
			

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
			
			//let double_draw_catcher = new WeakMap();
			
			const STATUS_EFFECT_LAYER_BG = 0;
			const STATUS_EFFECT_LAYER_NORMAL = 1;
			const STATUS_EFFECT_LAYER_FG = 2;
			
			const STATUS_EFFECT_BEFORE = 0;
			const STATUS_EFFECT_AFTER = 1;
			
			const frame_flag_reference = sdEntity.flag_counter++;

			{
				let x = sdWorld.my_entity ? sdWorld.my_entity.x : 0;
				let y = sdWorld.my_entity ? sdWorld.my_entity.y : 0;

				let angles = sdRenderer.old_visibility_map ? sdRenderer.old_visibility_map.length : null;
				for ( let i = 0; i < visible_entities.length; i++ )
				{
					const e = visible_entities[ i ];
					
					if ( !e.IsVisible( sdWorld.my_entity ) || e._is_being_removed )
					{
					}
					else
					if ( 
							e.IsGlobalEntity() || 
							
							( e.is( sdEffect ) && e._type === sdEffect.TYPE_CHAT ) || 
							
							( sdWorld.my_entity && 
								( 
									sdWorld.my_entity === e || 
									sdWorld.my_entity.driver_of === e || 
									
									true
									//!sdRenderer.line_of_sight_mode
								) 
							) 
						)
					{
						e._flag2 = frame_flag_reference;
					}
					/*else
					if ( sdWorld.my_entity )
					if ( sdRenderer.old_visibility_map )
					{
						if (   e.x + e._hitbox_x2 > min_x &&
							   e.x + e._hitbox_x1 < max_x &&
							   e.y + e._hitbox_y2 > min_y &&
							   e.y + e._hitbox_y1 < max_y )
						{
							let ex = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
							let ey = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;

							let m = angles / ( Math.PI * 2 );
							
							let furthest_an = Math.max(
									sdRenderer.old_visibility_map[ Math.round( Math.atan2( e.x + e._hitbox_x1 - sdRenderer.visibility_falloff - x, e.y + e._hitbox_y1 - sdRenderer.visibility_falloff - y ) * m + angles ) % angles ],
									sdRenderer.old_visibility_map[ Math.round( Math.atan2( e.x + e._hitbox_x2 + sdRenderer.visibility_falloff - x, e.y + e._hitbox_y1 - sdRenderer.visibility_falloff - y ) * m + angles ) % angles ],
									sdRenderer.old_visibility_map[ Math.round( Math.atan2( e.x + e._hitbox_x1 - sdRenderer.visibility_falloff - x, e.y + e._hitbox_y2 + sdRenderer.visibility_falloff - y ) * m + angles ) % angles ],
									sdRenderer.old_visibility_map[ Math.round( Math.atan2( e.x + e._hitbox_x2 + sdRenderer.visibility_falloff - x, e.y + e._hitbox_y2 + sdRenderer.visibility_falloff - y ) * m + angles ) % angles ]
							);

							let max_dimension = sdWorld.Dist2D_Vector( e._hitbox_x2 - e._hitbox_x1, e._hitbox_y2 - e._hitbox_y1 );

							if ( sdWorld.inDist2D_Boolean( x, y, ex, ey, furthest_an + sdRenderer.visibility_falloff + max_dimension + 32 ) )
							e._flag2 = frame_flag_reference;
						}
						else
						if (	e.is( sdEffect ) &&
								( e._type === sdEffect.TYPE_BEAM || e._type === sdEffect.TYPE_BEAM_CIRCLED ) )
						{
							
							if ( 
									e._x2 > min_x &&
									e._x2 < max_x &&
									e._y2 > min_y &&
									e._y2 < max_y )
							{
								let ex = e._x2;
								let ey = e._y2;

								let an = Math.round( Math.atan2( ex - x, ey - y ) / ( Math.PI * 2 ) * angles + angles ) % angles;

								let max_dimension = 0;

								if ( sdWorld.inDist2D_Boolean( x, y, ex, ey, sdRenderer.old_visibility_map[ an ] + sdRenderer.visibility_falloff + 32 + max_dimension ) )
								e._flag2 = frame_flag_reference;
							}
						}
					}*/
				}
			}
			
			const box_caps = sdRenderer.ctx.box_caps;
		
			for ( let i = 0; i < visible_entities.length; i++ )
			{
				const e = visible_entities[ i ];
				
				if ( e._flag2 === frame_flag_reference )
				if ( e.DrawBG !== void_draw )
				//if ( e.x + e._hitbox_x2 > min_x )
				//if ( e.x + e._hitbox_x1 < max_x )
				//if ( e.y + e._hitbox_y2 > min_y )
				//if ( e.y + e._hitbox_y1 < max_y )
				{
					/*if ( e.GetClass() === 'sdGrass' )
					{
						if ( double_draw_catcher.has( e ) )
						continue;
						else
						double_draw_catcher.set( e, 'first' );
					}*/
						
					sdStatusEffect.DrawEffectsFor( e, STATUS_EFFECT_LAYER_BG, STATUS_EFFECT_BEFORE, ctx, false );
					
					ctx.volumetric_mode = e.DrawIn3D( -1 );
					ctx.object_offset = e.ObjectOffset3D( -1 );
					
					if ( ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX || 
						 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT || 
						 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_DECAL )
					e.FigureOutBoxCapVisibilities( box_caps );

					ctx.save();
					try
					{
						ctx.translate( e.x, e.y );

						// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
						e.DrawBG( ctx, false );
						
						if ( !ctx.apply_shading )
						sdRenderer.SaveLightSource( e );
					}
					catch( err )
					{
						console.log( 'Image could not be drawn for ', e, err );
					}
					ctx.restore();
					
					sdStatusEffect.DrawEffectsFor( e, STATUS_EFFECT_LAYER_BG, STATUS_EFFECT_AFTER, ctx, false );
				}
			}
			
			ctx.z_offset = -16 * sdWorld.camera.scale;
			ctx.z_depth = 16 * sdWorld.camera.scale;
			
			for ( let i = 0; i < visible_entities.length; i++ )
			{
				const e = visible_entities[ i ];
				
				if ( e._flag2 === frame_flag_reference )
				if ( ( e.x + e._hitbox_x2 > min_x &&
					   e.x + e._hitbox_x1 < max_x &&
					   e.y + e._hitbox_y2 > min_y &&
					   e.y + e._hitbox_y1 < max_y ) ||
					   e === sdWeather.only_instance ||
					   ( e.__proto__.constructor === sdEffect.prototype.constructor && e._type === sdEffect.TYPE_BEAM ) ) // sdWorld.my_entity.__proto__.constructor
				if ( !sdWorld.is_singleplayer || e.IsVisible( sdWorld.my_entity ) )
				{
					sdStatusEffect.DrawEffectsFor( e, STATUS_EFFECT_LAYER_NORMAL, STATUS_EFFECT_BEFORE, ctx, false );
					
					ctx.volumetric_mode = e.DrawIn3D( 0 );
					ctx.object_offset = e.ObjectOffset3D( 0 );
					
					if ( ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX || 
						 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT || 
						 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_DECAL )
					e.FigureOutBoxCapVisibilities( box_caps );

					ctx.save();
					try
					{
						ctx.translate( e.x, e.y );

						e.Draw( ctx, false );
						
						if ( !ctx.apply_shading )
						sdRenderer.SaveLightSource( e );
					}
					catch( err )
					{
						console.log( 'Image could not be drawn for ', e, err );
					}
					ctx.restore();
					
					sdStatusEffect.DrawEffectsFor( e, STATUS_EFFECT_LAYER_NORMAL, STATUS_EFFECT_AFTER, ctx, false );
					
					if ( sdWorld.is_singleplayer )
					{
						if ( e.SyncedToPlayer !== sdEntity.prototype.SyncedToPlayer )
						e.SyncedToPlayer( sdWorld.my_entity );
					}
				}
			}
			
			if ( sdRenderer.line_of_sight_mode )
			if ( sdWorld.my_entity )
			if ( !sdWorld.is_singleplayer )
			{
				ctx.apply_shading = false;
				ctx.fillStyle = '#040422';
				if ( sdRenderer.debug_nothing_screen )
				ctx.fillStyle = '#FF0000';
		
				let z_offset_old = ctx.z_offset;
				ctx.z_offset += 1;
		
				//ctx.draw_offset = 1;
				{
																					
					let CHUNK_SIZE = sdWorld.CHUNK_SIZE;
					
					//for ( let [ hash, info ] of sdRenderer.visible_chunks )
					for ( let x = min_x-CHUNK_SIZE; x < max_x+CHUNK_SIZE; x += CHUNK_SIZE )
					for ( let y = min_y-CHUNK_SIZE; y < max_y+CHUNK_SIZE; y += CHUNK_SIZE )
					{
						const hash = ( sdWorld.FastFloor( (y) / CHUNK_SIZE ) ) * 4098 + sdWorld.FastFloor( (x) / CHUNK_SIZE );
						
						let info = sdRenderer.visible_chunks.get( hash );
						
						let opacity = 1;

						sdRenderer.ctx.box_caps.top =
						sdRenderer.ctx.box_caps.right =
						sdRenderer.ctx.box_caps.bottom =
						sdRenderer.ctx.box_caps.left = true;
						
						if ( info !== undefined )
						{
							if ( info.active_visibility || sdWorld.time < info.last_active_visibility_time + 3000 )
							info.opacity = Math.max( 0, info.opacity - GSPEED / 30 * 3 );
							else
							info.opacity = Math.min( 1, info.opacity + GSPEED / 30 / 2 );
							
							opacity = info.opacity;
							
							if ( opacity < 1 )
							{
								sdRenderer.ctx.box_caps.top =
								sdRenderer.ctx.box_caps.right =
								sdRenderer.ctx.box_caps.bottom =
								sdRenderer.ctx.box_caps.left = false;
							}
						}
						
						if ( opacity <= 0 )
						continue;
						
						ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT;

						ctx.globalAlpha = opacity;
						
						let xx = sdWorld.FastFloor( ( x ) / CHUNK_SIZE ) * CHUNK_SIZE;
						let yy = sdWorld.FastFloor( ( y ) / CHUNK_SIZE ) * CHUNK_SIZE;

						ctx.fillRect( 
							xx,
							yy,
							CHUNK_SIZE,
							CHUNK_SIZE );
					}
				}
				
				ctx.globalAlpha = 1;
				ctx.z_offset = z_offset_old;
				ctx.apply_shading = true;
			}
			/*if ( sdRenderer.line_of_sight_mode )
			{
				ctx.apply_shading = false;
				// Line of sight take 2
				sdRenderer.DrawLineOfSightShading( ctx, ms_since_last_render );

				ctx.apply_shading = true;
			}*/
			
			
			
			ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT;
			
			const void_draw_fg = sdEntity.prototype.DrawFG;
			
			//ctx.z_offset = 0 * sdWorld.camera.scale;
			//ctx.z_depth = 16 * sdWorld.camera.scale;
			for ( let i = 0; i < visible_entities.length; i++ )
			{
				const e = visible_entities[ i ];
				
				if ( e._flag2 === frame_flag_reference )
				if ( e.DrawFG !== void_draw_fg )
				{
					ctx.camera_relative_world_scale = e.CameraDistanceScale3D( 1 );

					if ( ctx.camera_relative_world_scale < 1 ||
						 ( e.x + e._hitbox_x2 > min_x &&
						   e.x + e._hitbox_x1 < max_x &&
						   e.y + e._hitbox_y2 > min_y &&
						   e.y + e._hitbox_y1 < max_y ) )
					{
						ctx.volumetric_mode = e.DrawIn3D( 1 );
						ctx.object_offset = e.ObjectOffset3D( 1 );
					
						if ( ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX || 
							 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT || 
							 ctx.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX_DECAL )
						e.FigureOutBoxCapVisibilities( box_caps );

						/*if ( e.GetClass() === 'sdGrass' )
						{
							if ( double_draw_catcher.has( e ) )
							continue;
							else
							double_draw_catcher.set( e, 'third' );
						}*/

						sdStatusEffect.DrawEffectsFor( e, STATUS_EFFECT_LAYER_FG, STATUS_EFFECT_BEFORE, ctx, false );
					
						ctx.save();
						try
						{
							ctx.translate( e.x, e.y );

							// TODO: Add bounds check, thought that is maybe pointless if server won't tell offscreen info
							e.DrawFG( ctx, false );
						
							//if ( !ctx.apply_shading )
							//sdRenderer.SaveLightSource( e );
						}
						catch( err )
						{
							console.log( 'Image could not be drawn for ', e, err );
						}
						ctx.restore();
						
						sdStatusEffect.DrawEffectsFor( e, STATUS_EFFECT_LAYER_FG, STATUS_EFFECT_AFTER, ctx, false );
					}
				}
			}
			
			
			

			
			
			
			//ctx.draw_offset = 0;
			
			ctx.object_offset = null;
			
			ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT;
			ctx.camera_relative_world_scale = sdRenderer.distance_scale_fading_world_edges;
			
			
			
			
			
			ctx.fillStyle = '#000000';
			if ( sdRenderer.debug_nothing_screen )
			ctx.fillStyle = '#FFFF00';
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
			
			let sw = sdRenderer.screen_width / sdWorld.camera.scale;
			let sh = sdRenderer.screen_height / sdWorld.camera.scale;

			ctx.fillRect(	sdWorld.world_bounds.x1 - sw, 
							sdWorld.world_bounds.y1 - sh, 
							sw, 
							sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 + sh * 2 );

			ctx.fillRect(	sdWorld.world_bounds.x2, 
							sdWorld.world_bounds.y1 - sh, 
							sw, 
							sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 + sh * 2 );

			ctx.fillRect(	sdWorld.world_bounds.x1, 
							sdWorld.world_bounds.y1 - sh, 
							sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1, 
							sh );

			ctx.fillRect(	sdWorld.world_bounds.x1, 
							sdWorld.world_bounds.y2, 
							sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1, 
							sh );
			
			ctx.apply_shading = false;
			
			if ( sdWorld.my_entity )
			if ( !sdWorld.my_entity._is_being_removed )
			{
				ctx.save();
				try
				{
					ctx.translate( sdWorld.my_entity.x, sdWorld.my_entity.y );
		
					// TODO: Add bounds check, though that is maybe pointless if server won't tell offscreen info
					
					if ( sdWorld.my_entity.driver_of )
					{
						if ( sdWorld.my_entity.driver_of.DrawsHUDForDriver() )
						sdWorld.my_entity.driver_of.DrawHUD( ctx, false );
					}
					else
					sdWorld.my_entity.DrawHUD( ctx, false );
				}
				catch( e )
				{
					console.log( 'Image could not be drawn for ',sdWorld.my_entity,e );
				}
				ctx.restore();
				
				//if ( !sdContextMenu.open )
				{
					var best_ent = null;
					var best_di = -1;
					
					if ( sdContextMenu.open )
					{
						best_ent = sdContextMenu.current_target;
					}
					else
					{
						if ( show_hud )
						for ( var i = 0; i < visible_entities.length; i++ )
						if ( visible_entities[ i ]._flag2 === frame_flag_reference )
						if ( visible_entities[ i ].DrawHUD !== sdEntity.prototype.DrawHUD )
						{
							//let cache = sdStatusEffect.line_of_sight_visibility_cache.get( visible_entities[ i ] );

							//if ( cache && ( cache.result > 0 || cache.result_soft > 0 ) ) // If client-side visible
							{
								// If cursor overlaps
								var di = visible_entities[ i ].GetAccurateDistance( sdWorld.mouse_world_x, sdWorld.mouse_world_y );

								if ( di < 12 )
								{
									if ( di <= 0 )
									di -= 1;

									// Prioritize physical center
									di += sdWorld.Dist2D( sdWorld.mouse_world_x, 
														  sdWorld.mouse_world_y,
														  visible_entities[ i ].x + ( visible_entities[ i ]._hitbox_x1 + visible_entities[ i ]._hitbox_x2 ) / 2,
														  visible_entities[ i ].y + ( visible_entities[ i ]._hitbox_y1 + visible_entities[ i ]._hitbox_y2 ) / 2 ) * 0.001;

									if ( di < best_di || best_ent === null )
									{
										best_ent = visible_entities[ i ];
										best_di = di;
									}
								}
							}
						}
					}
					
					sdWorld.hovered_entity = best_ent;
					
					// Context menu prioritizes amplifier
					if ( best_ent )
					if ( best_ent.is( sdCrystal ) )
					if ( best_ent.held_by )
					sdWorld.hovered_entity = best_ent.held_by;
					
					if ( best_ent )
					if ( best_ent !== sdWorld.my_entity )
					if ( best_ent !== sdWorld.my_entity.driver_of )
					{
						// Tooltip/HUD prioritizes crystal
						if ( best_ent.is( sdMatterAmplifier ) )
						if ( best_ent.crystal )
						best_ent = best_ent.crystal;
						
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
				}
				

				/*if ( sdWeather.only_instance )
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
				}*/
			}
			
			
			
			ctx.z_offset = 0;
			ctx.z_depth = 0;
			ctx.draw_offset = 100;
			ctx.camera_relative_world_scale = sdRenderer.distance_scale_in_game_hud;
			
			// Ingame hud
			if ( show_hud )
			if ( sdWorld.my_entity )
			if ( sdRenderer.UseCrosshair() )
			{
				if ( !sdWorld.my_entity._is_being_removed && 
					 sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ] &&
					 sdGun.classes[ sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].class ] &&
					 sdGun.classes[ sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].class ].is_build_gun )
				{
					ctx.drawImageFilterCache( sdWorld.img_crosshair_build, 
						sdWorld.mouse_world_x - 16, 
						sdWorld.mouse_world_y - 16, 32,32 );
						
					ctx.font = "5.5px Verdana";
					ctx.textAlign = 'left';
					
					let item_selected = false; // Will be false for dummy objects
					
					if ( sdWorld.my_entity._build_params )
					{
						let cost = sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].GetBulletCost( false );
							
						if ( cost === Infinity )
						{
						}
						else
						{
							item_selected = true;
							
							ctx.fillStyle = '#ffff00';
							ctx.fillText( T("Matter cost") + ": " + ( cost === Infinity ? '-' : sdWorld.RoundedThousandsSpaces( Math.ceil( cost ) ) ), sdWorld.mouse_world_x + 20, sdWorld.mouse_world_y - 2 );
							ctx.fillStyle = '#00ffff';
							ctx.fillText( T("Matter carried") + ": " + sdWorld.RoundedThousandsSpaces( sdWorld.my_entity.matter ), sdWorld.mouse_world_x + 20, sdWorld.mouse_world_y + 5 );

							if ( sdWorld.my_entity.matter >= cost )
							{
								ctx.fillStyle = '#00ff00';

								if ( sdWorld.my_entity._build_params )
								{
									if ( sdWorld.my_entity._build_params.upgrade_name )
									ctx.fillText( T("Click to install upgrade"), sdWorld.mouse_world_x + 20, sdWorld.mouse_world_y + 5 + 7 );
									else
									ctx.fillText( T("Click to build"), sdWorld.mouse_world_x + 20, sdWorld.mouse_world_y + 5 + 7 );
								}
							}
							else
							{
								ctx.fillStyle = '#ff0000';
								ctx.fillText( T("Not enough matter"), sdWorld.mouse_world_x + 20, sdWorld.mouse_world_y + 5 + 7 );
							}
						}
					}
					
					if ( !item_selected )
					{
						ctx.fillStyle = '#ffff00';
						ctx.fillText( T("Press B to pick item to build"), sdWorld.mouse_world_x + 20, sdWorld.mouse_world_y + 5 + 7 );
					}
				}
				else
				{
					ctx.save();
					{
						ctx.translate( sdWorld.mouse_world_x, sdWorld.mouse_world_y );
						
						//let s = 1 + ( sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ] && sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ].muzzle > 0 ? 0.3 : 0 );
						//ctx.scale( s, s );
						
						ctx.drawImageFilterCache( sdWorld.img_crosshair, 
							- 16, 
							- 16, 32,32 );
					}
					ctx.restore();
				}
			}
		}
		
		sdPathFinding.StaticRender( ctx );
		
		ctx.resetTransform();
		
		ctx.z_offset = 0;
		ctx.z_depth = 0;
		ctx.draw_offset = 100;
		ctx.camera_relative_world_scale = sdRenderer.distance_scale_on_screen_hud;
		ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT;
		
		
		
		
		// Some of dustiness effect in front
		if ( sdWeather.only_instance )
		if ( sdWeather.only_instance._dustiness > 0 )
		{
			ctx.sd_hue_rotation = ( sdWorld.mod( sdWorld.camera.x * 0.8 / 16, 360 ) );

			ctx.globalAlpha = sdWeather.only_instance._dustiness * 0.5;
			ctx.fillStyle = sdRenderer.sky_gradient;
			ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );

			ctx.sd_hue_rotation = 0;
		}
		
		
		
		// On-screen foregroud
		if ( sdWorld.my_entity && show_hud )
		{
			let scale = ( 0.3 + 0.7 * sdRenderer.resolution_quality );
			
			let leaderboard_width = 200 * scale;
			if ( sdWorld.mouse_screen_x > sdRenderer.screen_width - 400 * scale && sdWorld.mouse_screen_y < 20 + 20 * sdWorld.leaders.length * scale + 5 + 5 )
			leaderboard_width = 400 * scale;
				
				
			
			ctx.font = 11*scale + "px Verdana";
			
			ctx.globalAlpha = 0.5;
			ctx.fillStyle = '#000000';
			ctx.fillRect( 5, 5, 445 * scale, 17 );
			
			
			if ( sdRenderer.show_leader_board === 1 || sdRenderer.show_leader_board === 2 )
			ctx.fillRect( sdRenderer.screen_width - leaderboard_width - 5, 5, leaderboard_width, 20 + 20 * sdWorld.leaders.length * scale + 5 );
			
			{
				let i = 0;
				for ( let t = 0; t < 10; t++ )
				{
					i++;
					
					if ( i >= 10 )
					i = 0;

					if ( sdWorld.my_entity._inventory[ i ] )
					{
						let icons_opacity = Math.max( 0, ( sdWorld.my_entity_protected_vars_untils[ 'gun_slot' ] + 1000 - sdWorld.time ) / 1000 );

						ctx.globalAlpha = 0.5;

						if ( sdWorld.my_entity && i === sdWorld.my_entity.gun_slot )
						{
							ctx.globalAlpha = 0.5 + icons_opacity * 0.5;
						}

						ctx.fillStyle = '#000000';
						ctx.fillRect( 5 + t * 35, 5 + 17 + 5, 30, 17 );

						ctx.globalAlpha = ( sdWorld.my_entity && i === sdWorld.my_entity.gun_slot ) ? 1 : 0.5;

						ctx.fillStyle = '#ffffff';
						ctx.textAlign = 'center';
						ctx.fillText( i + '', 5 + t * 35 + 30 / 2, 5 + 17 + 5 + 12 );

						if ( sdWorld.my_entity && i === sdWorld.my_entity.gun_slot )
						{
							ctx.fillStyle = '#00ffff';
							ctx.textAlign = 'left';
							ctx.fillText( sdWorld.my_entity._inventory[ i ].title, 15 + 345 * scale, 40 + 20 );
						}

						//if ( sdWorld.time < sdWorld.my_entity_protected_vars_untils[ 'gun_slot' ] + 1000 )
						if ( icons_opacity > 0 )
						{
							ctx.globalAlpha = icons_opacity;

							ctx.save();
							ctx.translate( 5 + t * 35 + 30 / 2, 5 + 17 + 5 + 30 );
							sdWorld.my_entity._inventory[ i ].Draw( ctx, true );
							ctx.restore();
							
							if ( sdWorld.my_entity && i === sdWorld.my_entity.gun_slot )
							{
								ctx.globalAlpha = 1 - Math.pow( 1 - ctx.globalAlpha, 8 );
								let has_description = sdGun.classes[ sdWorld.my_entity._inventory[ i ].class ].has_description;
								if ( has_description )
								{
									ctx.fillStyle = '#aaffaa';
									ctx.textAlign = 'left';
									for ( let i2 = 0; i2 < has_description.length; i2++ )
									ctx.fillText( has_description[ i2 ], 15 + 345 * scale, 40 + 40 + i2 * 20 );
								}
							}
						}

					}
					else
					{
						ctx.globalAlpha = 0.15;
						ctx.fillStyle = '#000000';
						ctx.fillRect( 5 + t * 35, 5 + 17 + 5, 30, 17 );
					}
				}
			}
			
			if ( sdWorld.my_entity && sdRenderer.show_key_hints > 0 )
			{
				ctx.globalAlpha = Math.min( 1, sdRenderer.show_key_hints );
				sdRenderer.show_key_hints -= sdWorld.GSPEED * 0.1;
				
				let keySuggestions = []; // Such as enter fullscreen - F11, Invisibility - E, Drop weapon V
				keySuggestions.push({ title: 'Fullscreen', key: 'F11' });
				
				if ( sdWorld.my_entity.hea > 0 )
				keySuggestions.push({ title: 'Chat', key: 'Enter' });
				
				if ( sdWorld.my_entity.driver_of )
				keySuggestions.push({ title: 'Leave vehicle', key: 'E' });
				else
				if ( sdWorld.my_entity._potential_vehicle )
				keySuggestions.push({ title: 'Enter vehicle', key: 'E' });
				
				if ( sdWorld.my_entity._upgrade_counters.upgrade_invisibility )
				keySuggestions.push({ title: 'Invisibility', key: 'E' });
			
				if ( sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ] )
				keySuggestions.push({ title: 'Drop weapon', key: 'V' });
				
				if ( sdWorld.my_entity._upgrade_counters.upgrade_hook )
				keySuggestions.push({ title: 'Grappling hook', key: 'C' });
			
				if ( sdWorld.my_entity._inventory[ 9 ] )
				keySuggestions.push({ title: 'Select build item', key: 'B' });
				else
				keySuggestions.push({ title: 'Select build item', key: T('- no build tool -') });
			
				keySuggestions.push({ title: 'Zoom in/out', key: 'Z' });
			
				if ( sdWorld.my_entity.is( sdCharacter ) )
				{
					if ( sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ] )
					keySuggestions.push({ title: 'Fire mode', key: 'N' });
				}

				if ( sdWorld.my_entity.has_flashlight )
				keySuggestions.push({ title: 'Flashlight', key: 'F' });
				//else
				//keySuggestions.push({ title: 'Flashlight', key: '- no flashlight -' });
				
				keySuggestions.push({ title: 'Menu', key: 'Esc' });
			
				for ( let i = 0; i < keySuggestions.length; i++ )
				{
					let s = keySuggestions[ i ];

					ctx.fillStyle = '#ffffff';
					ctx.textAlign = 'center';
					ctx.fillText( T( s.title ), sdRenderer.screen_width - ( i * 120 + 50 ) * scale, sdRenderer.screen_height - 15 );

					if ( s.key.charAt( 0 ) === '-' )
					ctx.fillStyle = '#ff6666';
					else
					ctx.fillStyle = '#ffff00';
				
					ctx.fillText( s.key, sdRenderer.screen_width - ( i * 120 + 50 ) * scale, sdRenderer.screen_height - 28 );
				}
			}
			else
			{
				
			}
			
			
			ctx.globalAlpha = 1;
			
			ctx.fillStyle = '#ff0000';
			//ctx.fillRect( 7, 7, 296 * sdWorld.my_entity.hea / sdWorld.my_entity.hmax, 2 );
			
			ctx.textAlign = 'left';
			ctx.fillStyle = '#ff0000';
			ctx.fillText( T("Health") + ": " + Math.ceil( sdWorld.my_entity.hea ), 5 + 5 * scale, 17 );

			ctx.fillStyle = '#77aaff';
			ctx.fillText( T("Armor") + ": " + Math.ceil( sdWorld.my_entity.armor ), 5 + 95 * scale, 17 );			

			ctx.fillStyle = '#00ffff';
			ctx.fillText( T("Matter") + ": " + Math.floor( sdWorld.my_entity.matter ), 5 + 185 * scale, 17 );
			
			ctx.fillStyle = '#ffff00';
			ctx.fillText( T("Score") + ": " + Math.floor( sdWorld.my_score ), 5 + 275 * scale, 17 );

			ctx.fillStyle = '#ffff00';
			ctx.fillText( T("Level") + ": " + Math.floor( sdWorld.my_entity.build_tool_level ), 5 + 370 * scale, 17 );
			
			if ( sdRenderer.display_coords )
			{
				ctx.fillStyle = '#ffffaa';
				ctx.fillText("Coordinates: X = " + sdWorld.my_entity.x.toFixed(0) + ", Y = " + sdWorld.my_entity.y.toFixed(0), 465 * scale, 17 );
			}
			
			const gun = sdWorld.my_entity._inventory[ sdWorld.my_entity.gun_slot ];
			
			if ( gun )
			if ( !sdGun.classes[ gun.class ].is_build_gun  )
			{
				ctx.fillStyle = '#ffffff';
				ctx.fillText( T("Ammo") + ": " +  ( gun.ammo_left === -1 ? "-" : gun.ammo_left + " / " + gun.GetAmmoCapacity() ) + ` ( ${( gun.GetBulletCost( false, false ) * Math.abs( gun.GetAmmoCapacity() ) ).toFixed( 0 ) } matter )`, 15 + 345 * scale, 40 );
			}
			if ( globalThis.enable_debug_info )
			{
				
				ctx.fillStyle = '#ffffaa'; // By MrMcShroom / ZapruderFilm // EG: Could be also nice to eventually not let players know where they are exactly - maybe some in-game events would lead to that
           		//ctx.fillText("Coordinates: X = " + sdWorld.my_entity.x.toFixed(0) + ", Y = " + sdWorld.my_entity.y.toFixed(0), 420, 50 );	
				
				ctx.fillText( sdRenderer.last_frame_times.length+" FPS", 10 * scale, sdRenderer.screen_height - 70 );
				
				ctx.fillText( "Entities: " + sdEntity.entities.length + " / " + sdEntity.active_entities.length + " / " + sdEntity.global_entities.length + " :: total / active / global" , 10 * scale, sdRenderer.screen_height - 55 );
				
				ctx.fillText("Mouse Coordinates: X = " + sdWorld.my_entity.look_x.toFixed(0) + ", Y = " + sdWorld.my_entity.look_y.toFixed(0), 10 * scale, sdRenderer.screen_height - 40 );
				
				ctx.fillText("Atlas textures and images: "+sdAtlasMaterial.textures_total_counter+" / "+sdAtlasMaterial.images_total_counter, 10 * scale, sdRenderer.screen_height - 25 );
				
				ctx.fillText("Last long server frame time took: " + Math.floor( sdWorld.last_frame_time ) + "ms (slowest case entity was "+sdWorld.last_slowest_class+")", 10 * scale, sdRenderer.screen_height - 10 );
			}
			
			ctx.save();
			ctx.translate( 5 + 5 * scale, 80 );
			for ( let t = 0; t < sdTask.tasks.length; t++ )
			{
				let task = sdTask.tasks[ t ];
				task.DrawTaskInterface( ctx, scale );
			}
			ctx.restore();
			
			if ( sdRenderer.show_leader_board === 1 || sdRenderer.show_leader_board === 2 )
			{
				ctx.fillStyle = '#AAAAAA';
				ctx.fillText( T("Leaderboard") + ":", sdRenderer.screen_width - leaderboard_width - 5 + 5, 20 );

				ctx.textAlign = 'right';
				ctx.fillStyle = '#AAAAAA';
				ctx.fillText( globalThis.players_playing + T(" alive"), sdRenderer.screen_width - 5 - 5, 20 );

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
					ctx.fillText( (i+1)+". " + ( ( i < sdWorld.leaders.length ) ? T('Censored Defender') : '' ), sdRenderer.screen_width - leaderboard_width - 5 + 5, 20 + ( i + 1 ) * 20 * scale );
					else
					ctx.fillText( (i+1)+". " + ( ( i < sdWorld.leaders.length ) ? sdWorld.leaders[ i ].name : '' ), sdRenderer.screen_width - leaderboard_width - 5 + 5, 20 + ( i + 1 ) * 20 * scale );

					ctx.fillStyle = main_color;

					ctx.textAlign = 'right';
					ctx.fillText( ( ( i < sdWorld.leaders.length ) ? (sdWorld.leaders[ i ].score+'').replace(/(?<=[0-9])(?=(?:[0-9]{3})+(?![0-9]))/g, " ") : '' ), sdRenderer.screen_width - 15, 20 + ( i + 1 ) * 20 * scale );
				}
			}
			ctx.globalAlpha = 1;
			
			
			ctx.camera_relative_world_scale = sdRenderer.distance_scale_on_screen_foreground;
			
			
		}
		
		if ( show_hud ) // Makeing it entity-independant for case of game logic crash, to allow admin commands
		{
			if ( sdShop.open )
			sdShop.Draw( ctx );

			if ( sdChat.open )
			sdChat.Draw( ctx );

			if ( sdContextMenu.open )
			sdContextMenu.Draw( ctx );
		}
		
		if ( sdMusic.current_song )
		{
			let raise = 0;
			
			if ( sdWorld.my_entity && sdRenderer.show_key_hints > 0 )
			raise = Math.min( 1, sdRenderer.show_key_hints ) * 40;
			
			ctx.font = "12px Verdana";

			let t = 'Track: ' + sdMusic.current_song.title;

			let text_size = ctx.measureText( t );

			ctx.fillStyle = '#000000';
			ctx.globalAlpha = 0.15;
			ctx.fillRect( sdRenderer.screen_width - text_size.width - 30, sdRenderer.screen_height - 40 - raise, text_size.width + 20, 30 );
			ctx.globalAlpha = 0.7;

			ctx.fillStyle = '#ffffff';
		
			ctx.textAlign = 'left';
			ctx.fillText( t, sdRenderer.screen_width - text_size.width + 10 - 30, sdRenderer.screen_height - 21 - raise );
			
			ctx.globalAlpha = 1;
		}

		if ( !sdRenderer.UseCrosshair() )
		{
			/*ctx.drawImage( sdWorld.img_cursor, 
				sdWorld.mouse_screen_x, 
				sdWorld.mouse_screen_y, 64,64 );*/

			ctx.drawImageFilterCache( sdWorld.img_cursor, 
				sdWorld.mouse_screen_x, 
				sdWorld.mouse_screen_y, 64,64 );
		}
		
		if ( !sdWorld.my_entity || sdWorld.my_entity.hea < 0 || sdWorld.my_entity._is_being_removed )
		{
			ctx.font = "14px Verdana";
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffffff';
			
			if ( sdWorld.my_entity_net_id === undefined )
			{
				ctx.fillText( T('Waiting for server to assign character...'), sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 );
			}
			else
			if ( sdWorld.my_entity_net_id === -101 )
			{
				ctx.fillText( T('Your character has died. Press Space to restart or press Esc to return to main menu'), sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 );
			}
			else
			if ( !sdWorld.my_entity || sdWorld.my_entity._is_being_removed )
			{
				//trace( 'sdWorld.my_entity_net_id whenever death message is visible is ',sdWorld.my_entity_net_id  );
				ctx.fillText( T('Waiting for character sync...'), sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 );
			}
			else
			ctx.fillText( T('Your character has died but still can be revived (it will vanish within a minute if you disconnect). Press Space to restart or press Esc to return to main menu'), sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 );
		}
		
		if ( sdWorld.time < sdRenderer.service_mesage_until )
		{
			ctx.font = "14px Verdana";
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffff00';
			
			if ( sdRenderer.service_mesage_color )
			{
				ctx.fillStyle = sdRenderer.service_mesage_color;
			}
			
			if ( sdRenderer.service_mesage_untranslateables )
			{
				let str = T( sdRenderer.service_mesage );
				
				for ( let i = 0; i < sdRenderer.service_mesage_untranslateables.length; i++ )
				str = str.split( '{'+(i+1)+'}' ).join( sdRenderer.service_mesage_untranslateables[ i ] );
				
				ctx.fillText( str, sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 - 30 );
			}
			else
			ctx.fillText( sdRenderer.service_mesage, sdRenderer.screen_width / 2, sdRenderer.screen_height - 30 - 30 );
		}
		
		if ( sdRenderer.dark_tint > 0 )
		if ( !sdWorld.paused )
		{
			ctx.fillStyle = '#000000';
			ctx.globalAlpha = sdRenderer.dark_tint;
			ctx.fillRect( 0, 0, sdRenderer.screen_width, sdRenderer.screen_height );
			
			sdRenderer.dark_tint -= GSPEED * 0.05;
		}
		
		if ( typeof ctx.FakeEnd !== 'undefined' )
		ctx.FakeEnd();
	
		sdRenderer.last_frame_times.push( sdWorld.time );
		while ( sdRenderer.last_frame_times.length > 0 && sdRenderer.last_frame_times[ 0 ] < sdWorld.time - 1000 )
		sdRenderer.last_frame_times.shift();
	}
	
	// Line of sight take 2
	static DrawLineOfSightShading( ctx, ms_since_last_render )
	{		
		let angles = 64;
		let max_range = Math.sqrt( sdRenderer.screen_width*sdRenderer.screen_width + sdRenderer.screen_height*sdRenderer.screen_height ) / sdWorld.camera.scale;//1000;
		let visibility_map = []; // [ angle ] = distance_until_shade_start

		let close_to_no_vision = false;

		if ( sdWorld.my_entity )
		{
			if ( sdWorld.my_entity.driver_of )
			if ( sdWorld.my_entity.driver_of.is( sdOctopus ) )
			close_to_no_vision = true;
			
			for ( let i2 = 0; i2 < sdFaceCrab.all_face_crabs.length; i2++ )
			if ( sdFaceCrab.all_face_crabs[ i2 ].attached_to === sdWorld.my_entity )
			{
				close_to_no_vision = true;
				break;
			}
		}


		if ( !sdRenderer.old_visibility_map )
		{
			sdRenderer.old_visibility_map = [];
			sdRenderer.ray_trace_point_results = [];

			for ( let i = 0; i < angles; i++ )
			{
				sdRenderer.old_visibility_map[ i ] = 0;
				sdRenderer.ray_trace_point_results[ i ] = null;
			}
		}
		
		function custom_filtering_method( ent )
		{
			if ( ent.is( sdBlock ) )
			{
				if ( ent.material === sdBlock.MATERIAL_TRAPSHIELD || ent.texture_id === sdBlock.TEXTURE_ID_GLASS || ent.texture_id === sdBlock.TEXTURE_ID_CAGE )
				{
				}
				else
				return true;
			}
			else
			if ( ent.is( sdDoor ) )
			{
				return true;
			}
	
			return false;
		}
		
		function SolveDepth( angle )
		{
			if ( !sdWorld.my_entity || close_to_no_vision )
			{
				visibility_map[ angle ] = 0;
			}
			else
			{
				let x = sdWorld.my_entity.x;
				let y = sdWorld.my_entity.y + ( sdWorld.my_entity._hitbox_y1 + sdWorld.my_entity._hitbox_y2 ) / 2;

				let an = angle / angles * Math.PI * 2;

				let x2 = sdWorld.my_entity.x + Math.sin( an ) * max_range;
				let y2 = sdWorld.my_entity.y + Math.cos( an ) * max_range;
				
				let cache = sdRenderer.ray_trace_point_results[ angle ];
				
				if ( cache && sdWorld.time < cache.until )
				{
					let hit = cache;
					
					visibility_map[ angle ] = sdWorld.Dist2D_Vector( hit.x - x, hit.y - y ) + sdRenderer.visibility_extra;
				}
				else
				{
					let hit = sdWorld.TraceRayPoint( x, y, x2, y2, sdWorld.my_entity, null, null, custom_filtering_method );//sdCom.com_vision_blocking_classes );
					
					let hx = x2;
					let hy = y2;

					if ( hit )
					{
						visibility_map[ angle ] = sdWorld.Dist2D_Vector( hit.x - x, hit.y - y ) + sdRenderer.visibility_extra;
						hx = hit.x;
						hy = hit.y;
					}
					else
					visibility_map[ angle ] = max_range;
				
				
				
					if ( !cache )
					sdRenderer.ray_trace_point_results[ angle ] = cache = { x: hx, y: hy, until: sdWorld.time + 100 + Math.random() * 200, hit_entity: sdWorld.last_hit_entity };
					else
					{
						cache.x = hx;
						cache.y = hy;
						cache.until = sdWorld.time + 100 + Math.random() * 200;
						cache.hit_entity = sdWorld.last_hit_entity;
					}
				}
			}
		}

		for ( let i = 0; i < angles; i++ )
		{
			SolveDepth( i );
		}

		for ( let i = 0; i < angles; i++ )
		{
			//visibility_map[ i ] = visibility_map[ i ] * 0.5 + sdRenderer.old_visibility_map[ i ] * 0.5;
			
			if ( ms_since_last_render < 1 )
			ms_since_last_render = 1;
		
			if ( visibility_map[ i ] < sdRenderer.old_visibility_map[ i ] - 32 )
			{
				//let a = 213321;
			}
			else
			visibility_map[ i ] = sdWorld.MorphWithTimeScale( sdRenderer.old_visibility_map[ i ], visibility_map[ i ], 0.9, ms_since_last_render );
		}
		
		sdRenderer.old_visibility_map = visibility_map.slice();

		for ( let sm = 0; sm < 5; sm++ )
		{
			let new_visibility_map = visibility_map.slice();
			for ( let i = 0; i < angles; i++ )
			{
				let i0 = ( i - 1 + angles ) % angles;
				let i2 = ( i + 1 ) % angles;

				new_visibility_map[ i ] = ( visibility_map[ i0 ] + visibility_map[ i ] + visibility_map[ i2 ] ) / 3;
			}

			visibility_map = new_visibility_map;
		}

		let z_offset_old = ctx.z_offset;
		{
			ctx.z_offset = 64;
			//ctx.z_depth = 16 * sdWorld.camera.scale;

			let xx, yy;

			let darkest_alpha = 1;

			if ( sdWorld.my_entity )
			{
				xx = sdWorld.my_entity.x;
				yy = sdWorld.my_entity.y + ( sdWorld.my_entity._hitbox_y1 + sdWorld.my_entity._hitbox_y2 ) / 2;
				
				if ( !sdRenderer.line_of_sight_mode )
				{
					darkest_alpha = 0.6;
				}
			}
			else
			{
				xx = sdWorld.camera.x;
				yy = sdWorld.camera.y;
			}
			
			const r = 0.01;
			const g = 0.02;
			const b = 0.1;

			for ( let i = 0; i < angles; i++ )
			for ( let d = 0; d <= 1; d++ )
			{
				let distance, distance2, distance3, distance4, a1, a2, a3, a4;

				if ( d === 0 )
				{
					distance = visibility_map[ i ];
					distance2 = visibility_map[ i ] + sdRenderer.visibility_falloff;
					distance3 = visibility_map[ ( i + 1 ) % angles ];
					distance4 = visibility_map[ ( i + 1 ) % angles ] + sdRenderer.visibility_falloff;

					a1 = 0;
					a2 = darkest_alpha;
					a3 = 0;
					a4 = darkest_alpha;
				}
				else
				{
					distance = visibility_map[ i ] + sdRenderer.visibility_falloff;
					distance2 = max_range;
					distance3 = visibility_map[ ( i + 1 ) % angles ] + sdRenderer.visibility_falloff;
					distance4 = max_range;

					a1 = darkest_alpha;
					a2 = darkest_alpha;
					a3 = darkest_alpha;
					a4 = darkest_alpha;
				}

				let an = i / angles * Math.PI * 2;
				let an2 = ( ( i + 1 ) % angles ) / angles * Math.PI * 2;

				let x = xx + Math.sin( an ) * distance;
				let y = yy + Math.cos( an ) * distance;

				let x2 = xx + Math.sin( an ) * distance2;
				let y2 = yy + Math.cos( an ) * distance2;

				let x3 = xx + Math.sin( an2 ) * distance3;
				let y3 = yy + Math.cos( an2 ) * distance3;

				let x4 = xx + Math.sin( an2 ) * distance4;
				let y4 = yy + Math.cos( an2 ) * distance4;

				ctx.drawTriangle( x,y, x2,y2, x3,y3, r,g,b, a1,a2,a3 );
				ctx.drawTriangle( x2,y2, x4,y4, x3,y3, r,g,b, a2,a4,a3 ); // 2, 4, 3
			}
		}
		ctx.z_offset = z_offset_old;
	}
	
	static _ColorUpdate( color_hex )
	{
		let p = document.getElementById( 'ingame_color_picker' );
		p.value = color_hex;
	}
	static _SetupColorPickerSettings()
	{
		let p = document.getElementById( 'ingame_color_picker' );
		
		Coloris({ 
			alpha: false, 
			wrap: false,
			themeMode: 'dark', 
			el: '.ingame_color_picker', 
			swatches: p.swatches, 
			onChange: sdRenderer._ColorUpdate,
			closeButton: true
		});
	}
	static GetColorPickerValue( current_css_color='#ff0000', callback=null ) // Test: document.onmousedown = ( e )=>{ if ( e.which === 1 ) sdRenderer.GetColorPickerValue(); }
	{
		let p = document.getElementById( 'ingame_color_picker' );
		
		function PushColor( color_hex )
		{
			if ( !p.swatches )
			{
				p.swatches = [
					'#00fff6',
					'#ffff00',
					'#dddddd',
					'#ff00ff',

					'#fb6464',
					'#31ff6b',
					'#213eec',
					'#434447',
					'#ffa2e1'
				];
			}

			if ( p.swatches.indexOf( color_hex ) === -1 )
			{
				p.swatches.push( color_hex );

				if ( p.swatches.length > 32 )
				p.swatches.shift();
			}
		}
		
		p.value = current_css_color;
		PushColor( current_css_color );
		
		p.style.left = sdWorld.mouse_screen_x + 'px';
		p.style.top = sdWorld.mouse_screen_y + 'px';
		
		sdRenderer._SetupColorPickerSettings();
		
		p.click();
		
		let picker = document.getElementById( 'clr-picker' );
		
		function CancelPicker()
		{
			p.removeEventListener( 'close', CancelPicker );
			window.removeEventListener( 'mousedown', WindowClose );
			sdRenderer.canvas.removeEventListener( 'mousedown', WindowClose );
			
			p.blur();
			
			//trace( 'p.value = ' + p.value );
			
			if ( callback )
			{
				PushColor( p.value );
				callback( p.value );
			}
		}
		
		function WindowClose( e )
		{
			if ( picker.contains( e.target ) )
			return;
		
			e.preventDefault();
			e.stopPropagation();
			
			Coloris.close();
		}
		
		setTimeout( ()=>
		{
			p.addEventListener( 'close', CancelPicker );
			window.addEventListener( 'mousedown', WindowClose );
			sdRenderer.canvas.addEventListener( 'mousedown', WindowClose );
		}, 0 );
		
		/*let p = document.getElementById( 'ingame_color_picker' );
		//p.onchange = 
		//p.onblur = null;
		
		p.style.left = sdWorld.mouse_screen_x + 'px';
		p.style.top = sdWorld.mouse_screen_y + 'px';
		
		p.focus();
		p.value = current_css_color;
		p.click();
		
		p.value = '#00ff00';

		p.onchange = ( e )=>
		{
			p.onchange = null;
			//p.onblur = null;
	
			trace( e, p.value );
			
			if ( callback )
			callback( p.value );
		};*/

		/*setTimeout(()=>{
			
			p.onblur = p.onchange;
			
		},0);*/
	}
}
//sdRenderer.init_class();

export default sdRenderer;
