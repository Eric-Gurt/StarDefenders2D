/*

	Better performance by using significantly smaller number of textures, materials geometry, sharing basically. Recycling outdated areas of textures as well.

	TODO: Make logic to swap dedicated spaces between frequently and rarely updated geometries

	Note: DrawDot is fast to send to GPU but GPU isn't as fast to render it which can cause extra lags

*/

/* global THREE, FakeCanvasContext, this */

import sdWorld from '../sdWorld.js';
import sdRenderer from './sdRenderer.js';
import sdShop from './sdShop.js';
import sdWeather from '../entities/sdWeather.js';
import sdLamp from '../entities/sdLamp.js';
import sdCharacter from '../entities/sdCharacter.js';
import sdWater from '../entities/sdWater.js';


class sdSpaceDedication
{
	constructor( x, y, w, h, super_texture )
	{
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.super_texture = super_texture;
		this.last_time_used = sdWorld.time;
	}
}
class sdSuperTexture
{
	constructor( is_transparent_int=sdAtlasMaterial.GROUP_OPAQUE )
	{
		this.canvas = document.createElement( 'canvas' );
		this.canvas.width = sdAtlasMaterial.super_texture_width;
		this.canvas.height = sdAtlasMaterial.super_texture_height;
		
		this.is_transparent_int = is_transparent_int;
		
		this.canvas_size_scale_down_vector = new THREE.Vector2( 1 / this.canvas.width, 1 / this.canvas.height );
		
		this.ctx = this.canvas.getContext( '2d' );

		this.texture = new THREE.CanvasTexture( this.canvas );
		
		Object.assign( this.texture, {
			canvas: this.canvas,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			generateMipmaps: false,
			flipY: false
		});
		
		let transparent = ( 
			is_transparent_int !== sdAtlasMaterial.GROUP_OPAQUE &&
			is_transparent_int !== sdAtlasMaterial.GROUP_OPAQUE_DECAL 
		);
		
		let depthTest = ( 
			is_transparent_int === sdAtlasMaterial.GROUP_OPAQUE ||
			is_transparent_int === sdAtlasMaterial.GROUP_OPAQUE_DECAL ||
			is_transparent_int === sdAtlasMaterial.GROUP_TRANSPARENT ||
			is_transparent_int === sdAtlasMaterial.GROUP_TRANSPARENT_ADDITIVE
		);

		let additive = ( is_transparent_int === sdAtlasMaterial.GROUP_TRANSPARENT_ADDITIVE );

		const hueShift_function = `
		
			vec3 hueShift( vec3 color, float hue ) 
			{
				const vec3 k = vec3(0.57735, 0.57735, 0.57735);
				float cosAngle = cos(hue);
				return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
			}
		
		`;
		
		this.material_mesh;
		//this.material_dots;
		{
			this.material_mesh = new THREE.ShaderMaterial({

				uniforms:
				{
					tDiffuse: { type: "t", value: this.texture }
				},
				
				// Copy [ 1 / 2 ]
				side: THREE.DoubleSide,
				depthTest: depthTest,
				depthFunc: transparent ? THREE.LessDepth : THREE.LessEqualDepth,
				depthWrite: !transparent,
				transparent: transparent, 
				flatShading: true,
				
				blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,

				vertexShader: `
				
					attribute vec4 color; // From custom attributes
					attribute float hue_rotation; // From custom attributes
				
					varying vec2 uv_current; // Give it to fragment shader
					varying vec4 color_current; // Give it to fragment shader
					varying float hue_rotation_current; // Give it to fragment shader
				
					void main() 
					{
						uv_current = uv;
				
						color_current.rgba = color.rgba;
				
						hue_rotation_current = hue_rotation;
				
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
					}
				`,

				fragmentShader: `

					uniform sampler2D tDiffuse;
				
					varying vec2 uv_current; // Take value from vertex shader (for fragment shader-only)
					varying vec4 color_current; // Take value from vertex shader (for fragment shader-only)
					varying float hue_rotation_current; // Take value from vertex shader (for fragment shader-only)
					
					${ hueShift_function }
					
					void main()
					{
						if ( color_current.a <= 0.0 || texture2D( tDiffuse, uv_current ).a <= 0.0 )
						discard;
				
						gl_FragColor.rgba = texture2D( tDiffuse, uv_current ).rgba * color_current.rgba;
				
						if ( hue_rotation_current != 0.0 )
						{
							gl_FragColor.rgb = hueShift( gl_FragColor.rgb, hue_rotation_current );
						}
					}
				`
			});
			/*
			this.material_dots = new THREE.ShaderMaterial({

				uniforms:
				{
					tDiffuse: { type: "t", value: this.texture },
					global_dot_scale: { type: "f", value: sdRenderer.screen_height },
					
					canvas_w: { type: "f", value: this.canvas.width },
					canvas_h: { type: "f", value: this.canvas.height }
				},
				
				// Copy [ 2 / 2 ]
				side: THREE.DoubleSide,
				depthTest: depthTest,
				depthFunc: transparent ? THREE.LessDepth : THREE.LessEqualDepth,
				depthWrite: !transparent,
				transparent: transparent, 
				flatShading: true,

				vertexShader: `

					uniform float global_dot_scale; // From material.uniform
				
					attribute vec3 dot_scale_and_size; // From custom attributes
					attribute vec2 uv2; // From custom attributes
					attribute float rotation; // From custom attributes
					attribute vec4 color; // From custom attributes
					attribute float hue_rotation; // From custom attributes

					varying vec2 uv_current; // Give it to fragment shader
					varying vec3 size_current; // Give it to fragment shader
					varying float rotation_current; // Give it to fragment shader
					varying vec4 color_current; // Give it to fragment shader
					varying float hue_rotation_current; // Give it to fragment shader
				
					void main() 
					{
						uv_current.xy = uv2.xy;
						size_current = dot_scale_and_size;
						rotation_current = rotation;
				
						color_current.rgba = color.rgba;
				
						hue_rotation_current = hue_rotation;
				
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
				
						//gl_PointSize = global_dot_scale / 2.0 * dot_scale_and_size.z / gl_Position.z;
				
						//size_current.z = size_current.z / gl_Position.z;
				
						gl_PointSize = 64.0;
					}
				`,

				fragmentShader: `

					uniform sampler2D tDiffuse;
				
					varying vec2 uv_current; // Take value from vertex shader (for fragment shader-only)
					varying vec3 size_current; // Take value from vertex shader (for fragment shader-only)
					varying float rotation_current; // Take value from vertex shader (for fragment shader-only)
					varying vec4 color_current; // Take value from vertex shader (for fragment shader-only)
					varying float hue_rotation_current; // Take value from vertex shader (for fragment shader-only)

					uniform float canvas_w; // From material.uniform
					uniform float canvas_h; // From material.uniform
				
					${ hueShift_function }
					
					void main()
					{
						// discard;

						
						vec2 rotated = gl_PointCoord;

						rotated.x -= 0.5;
						rotated.y -= 0.5;
						
						rotated.x *= size_current.z;
						rotated.y *= size_current.z;
						
						if ( rotation_current != 0.0 )
						{
							float _cos = cos( rotation_current );
							float _sin = sin( rotation_current );
							float x = _cos * rotated.x - _sin * rotated.y;
							float y = _sin * rotated.x + _cos * rotated.y;
				
							rotated.x = x;
							rotated.y = y;
						}
				
						rotated.x = uv_current.x + rotated.x / canvas_w * size_current.x;
						rotated.y = uv_current.y + rotated.y / canvas_h * size_current.y;
				
						gl_FragColor.rgba = texture2D( tDiffuse, rotated ).rgba;
				
						if ( hue_rotation_current != 0.0 )
						{
							gl_FragColor.rgb = hueShift( gl_FragColor.rgb, hue_rotation_current );
						}
				
						gl_FragColor.a = 0.1 + gl_FragColor.a * 0.9;
						
				
						//gl_FragColor.rgba = vec4( 1.0, 0.0, 0.0, 1.0 );
					}
				`
			});*/
		}
		
		this.offset_x = 0;
		this.offset_y = 0;
		
		this.max_line_height = 0;
		
		this.dedications = [];
		
		//this.last_vertices = new Map(); // Useful to save on memory but it really is computationally heavier
		
		this.geometry_mesh = new THREE.BufferGeometry();
		//this.geometry_dots = new THREE.BufferGeometry();
		
		this.mesh = new THREE.Mesh( this.geometry_mesh, this.material_mesh );
		//this.dots = new THREE.Points( this.geometry_dots, this.material_dots );
		
		this.mesh.frustumCulled = false;
		//this.dots.frustumCulled = false;
		
		this.mesh.renderOrder = is_transparent_int;
		//this.dots.renderOrder = is_transparent_int;
		
		
		sdRenderer.ctx.scene.add( this.mesh );
		//sdRenderer.ctx.scene.add( this.dots );
		sdRenderer.ctx.scene.children.sort( ( a,b )=>{ return a.renderOrder - b.renderOrder; } ); // For whatever reason sorting does not happen it seems
		
		//this.Preview();
		
		this.geometry_mesh.last_offset_indices = 0;
		//this.geometry_dots.last_offset = 0;
		
		// Init buffers
		
		{
			let geometry = this.geometry_mesh;

			geometry.index = new THREE.BufferAttribute( new Uint16Array( 3 * sdAtlasMaterial.maximum_dots_per_super_texture ), 1 ); // Uint16, but can be redefined to allow larger indices
			geometry.index_dataView = new DataView( geometry.index.array.buffer );
			geometry.setIndex( geometry.index );

			geometry.position = new THREE.BufferAttribute( new Float32Array( 3 * sdAtlasMaterial.maximum_dots_per_super_texture ), 3 );
			geometry.position_dataView = new DataView( geometry.position.array.buffer );
			geometry.setAttribute( 'position', geometry.position );

			geometry.uv = new THREE.BufferAttribute( new Float32Array( 2 * sdAtlasMaterial.maximum_dots_per_super_texture ), 2 );
			geometry.uv_dataView = new DataView( geometry.uv.array.buffer );
			geometry.setAttribute( 'uv', geometry.uv );

			// Color multiplier + alpha
			geometry.color = new THREE.BufferAttribute( new Float32Array( 4 * sdAtlasMaterial.maximum_dots_per_super_texture ), 4 );
			geometry.color_dataView = new DataView( geometry.color.array.buffer );
			geometry.setAttribute( 'color', geometry.color );

			geometry.hue_rotation = new THREE.BufferAttribute( new Float32Array( 1 * sdAtlasMaterial.maximum_dots_per_super_texture ), 1 );
			geometry.hue_rotation_dataView = new DataView( geometry.hue_rotation.array.buffer );
			geometry.setAttribute( 'hue_rotation', geometry.hue_rotation );
		}
		/*{
			let geometry = this.geometry_dots;
			
			geometry.position = new THREE.BufferAttribute( new Float32Array( 3 * sdAtlasMaterial.maximum_dots_per_super_texture ), 3 );
			geometry.position_dataView = new DataView( geometry.position.array.buffer );
			geometry.setAttribute( 'position', geometry.position );
			
			geometry.dot_scale_and_size = new THREE.BufferAttribute( new Float32Array( 3 * sdAtlasMaterial.maximum_dots_per_super_texture ), 3 );
			geometry.dot_scale_and_size_dataView = new DataView( geometry.dot_scale_and_size.array.buffer );
			geometry.setAttribute( 'dot_scale_and_size', geometry.dot_scale_and_size );
			
			geometry.rotation = new THREE.BufferAttribute( new Float32Array( 1 * sdAtlasMaterial.maximum_dots_per_super_texture ), 1 );
			geometry.rotation_dataView = new DataView( geometry.rotation.array.buffer );
			geometry.setAttribute( 'rotation', geometry.rotation );
			
			geometry.uv2 = new THREE.BufferAttribute( new Float32Array( 2 * sdAtlasMaterial.maximum_dots_per_super_texture ), 2 );
			geometry.uv2_dataView = new DataView( geometry.uv2.array.buffer );
			geometry.setAttribute( 'uv2', geometry.uv2 );
			
			geometry.color = new THREE.BufferAttribute( new Float32Array( 4 * sdAtlasMaterial.maximum_dots_per_super_texture ), 4 );
			geometry.color_dataView = new DataView( geometry.color.array.buffer );
			geometry.setAttribute( 'color', geometry.color );
			
			geometry.hue_rotation = new THREE.BufferAttribute( new Float32Array( 1 * sdAtlasMaterial.maximum_dots_per_super_texture ), 1 );
			geometry.hue_rotation_dataView = new DataView( geometry.hue_rotation.array.buffer );
			geometry.setAttribute( 'hue_rotation', geometry.hue_rotation );
		}*/
		
		//this.color_native = [];
		//this.hue_rotation_native = [];
		
		this.FrameStart(); // It usually skips start
		
		Object.seal( this );
	}
	
	UpdateDotsScale()
	{
		//this.material_dots.uniforms.global_dot_scale.value = sdRenderer.screen_height;
	}
	
	FrameStart()
	{
		this.geometry_mesh.offset = 0;
		this.geometry_mesh.offset_indices = 0;
		
		//this.geometry_dots.offset = 0;
		
		//this.last_vertices.clear();
	}
	FrameEnd( draw )
	{
		{
			const geometry = this.geometry_mesh;

			if ( geometry.offset > 0 )
			{
				geometry.position.updateRange.count = geometry.offset * 3;
				geometry.uv.updateRange.count = geometry.offset * 2;
				geometry.color.updateRange.count = geometry.offset * 4;
				geometry.hue_rotation.updateRange.count = geometry.offset * 1;
				geometry.index.updateRange.count = geometry.offset_indices;

				geometry.position.needsUpdate = true;
				geometry.uv.needsUpdate = true;
				geometry.color.needsUpdate = true;
				geometry.hue_rotation.needsUpdate = true;
				geometry.index.needsUpdate = true;

				const last_offset_indices = geometry.last_offset_indices;
				if ( geometry.offset_indices < last_offset_indices )
				{
					for ( let i = geometry.offset_indices; i < last_offset_indices; i += 4 )
					geometry.index_dataView.setFloat64( i * 2, 0 );

					geometry.index.updateRange.count = last_offset_indices;

					geometry.index.needsUpdate = true;
				}

				geometry.last_offset_indices = geometry.offset_indices;

				this.mesh.visible = draw && true;
			}
			else
			{
				this.mesh.visible = false;
			}
		}
		/*{
			const geometry = this.geometry_dots;

			if ( geometry.offset > 0 )
			{
				geometry.position.updateRange.count = geometry.offset * 3;
				geometry.dot_scale_and_size.updateRange.count = geometry.offset * 3;
				geometry.rotation.updateRange.count = geometry.offset * 1;
				geometry.uv2.updateRange.count = geometry.offset * 2;
				geometry.color.updateRange.count = geometry.offset * 4;
				geometry.hue_rotation.updateRange.count = geometry.offset * 1;
				
				geometry.position.needsUpdate = true;
				geometry.dot_scale_and_size.needsUpdate = true;
				geometry.rotation.needsUpdate = true;
				geometry.uv2.needsUpdate = true;
				geometry.color.needsUpdate = true;
				geometry.hue_rotation.needsUpdate = true;

				const last_offset = geometry.last_offset;
				
				if ( geometry.offset < last_offset )
				{
					for ( let i = geometry.offset; i < last_offset; i++ )
					{
						geometry.position_dataView.setFloat32( i * 4 * 3 + 0, -10000, true );
						
						//geometry.dot_scale_and_size_dataView.setFloat32( i * 4 * 3, 0 );
						//geometry.dot_scale_and_size_dataView.setFloat32( i * 4 * 3 + 4, 0 );
						//geometry.dot_scale_and_size_dataView.setFloat32( i * 4 * 3 + 8, 0 );
					}

					//geometry.dot_scale_and_size.updateRange.count = last_offset;
					//eometry.dot_scale_and_size.needsUpdate = true;
					
					geometry.position.updateRange.count = last_offset * 3;
					geometry.position.needsUpdate = true;
				}

				geometry.last_offset = geometry.offset;

				this.dots.visible = draw && true;
			}
			else
			{
				this.dots.visible = false;
			}
		}*/
	}
	
	/*GetBrightnessInt( xx0, yy0 )
	{
		let hash = yy0 * sdAtlasMaterial.brightness_map_width * 3 + xx0;
		
		let v = sdAtlasMaterial.brightness_map.get( hash );
		
		if ( v === undefined )
		{
			//v = 0.5 + Math.random();
			
			v = 4;
			
			//let wx = sdWorld.camera.x + ( xx0 / sdAtlasMaterial.brightness_map_width - 0.5 ) * sdRenderer.screen_width;
			//let wy = sdWorld.camera.y + ( yy0 / sdAtlasMaterial.brightness_map_height - 0.5 ) * sdRenderer.screen_height;
			
			let wx = xx0 / sdAtlasMaterial.brightness_map_width * sdRenderer.screen_width / sdWorld.camera.scale + sdWorld.camera.x - sdRenderer.screen_width / 2 / sdWorld.camera.scale;
			let wy = yy0 / sdAtlasMaterial.brightness_map_height * sdRenderer.screen_height / sdWorld.camera.scale + sdWorld.camera.y - sdRenderer.screen_height / 2 / sdWorld.camera.scale;
			
			//let wx = xx0 / sdAtlasMaterial.brightness_map_width * sdRenderer.screen_width;
			//let wy = yy0 / sdAtlasMaterial.brightness_map_height * sdRenderer.screen_height;
			
			//globalThis.last_w = [ xx0, yy0, wx, wy ];
			
			let w = 1 / sdAtlasMaterial.brightness_map_width * sdRenderer.screen_width / sdWorld.camera.scale;
			let h = 1 / sdAtlasMaterial.brightness_map_height * sdRenderer.screen_height / sdWorld.camera.scale;
			
			if ( sdWorld.CheckWallExistsBox( wx - w / 2, wy - h / 2, wx + w, wy + h, null, null, [ 'sdBlock' ] ) )
			{
				v = 0.25;
			}
			
			sdAtlasMaterial.brightness_map.set( hash, v );
		}
		
		return v;
	}
	GetBrightness( x1, y1 )
	{
		x1 = ( x1 ) / sdRenderer.screen_width * sdAtlasMaterial.brightness_map_width;
		y1 = ( y1 ) / sdRenderer.screen_height * sdAtlasMaterial.brightness_map_height;
		//x1 = ( x1 / sdWorld.camera.scale + sdWorld.camera.x ) / sdRenderer.screen_width * sdAtlasMaterial.brightness_map_width;
		//y1 = ( y1 / sdWorld.camera.scale + sdWorld.camera.y ) / sdRenderer.screen_height * sdAtlasMaterial.brightness_map_height;
		
		let xx0 = Math.floor( x1 );
		let xx1 = Math.ceil( x1 );
		
		let yy0 = Math.floor( y1 );
		let yy1 = Math.ceil( y1 );
		
		let prog_x = x1 - xx0;
		let prog_y = y1 - yy0;
		
		let br = ( this.GetBrightnessInt( xx0, yy0 ) * ( 1 - prog_x ) +
				   this.GetBrightnessInt( xx1, yy0 ) * ( prog_x ) ) * ( 1 - prog_y ) +
				 ( this.GetBrightnessInt( xx0, yy1 ) * ( 1 - prog_x ) +
				   this.GetBrightnessInt( xx1, yy1 ) * ( prog_x ) ) * ( prog_y );
		   
		return br;
	}*/
	GetVertex( 
				x1,y1,z1, 
				u1,v1, 
				geometry,r,g,b,a, 
				hue_rotation, 
				wx,wy,cache_slot,
				apply_shading )
	{
		//trace( x1,y1,z1, u1,v1, geometry,r,g,b,a, hue_rotation );
		
		/*let similar = this.last_vertices.get( x1 + y1 + u1 + v1 );
		if ( similar )
		{
			if ( similar.u === u1 &&
				 similar.v === v1 &&
				 similar.x === x1 &&
				 similar.y === y1 &&
				 similar.z === z1 &&
				 similar.r === r &&
				 similar.g === g &&
				 similar.b === b &&
				 similar.a === a )
			{
				//sdAtlasMaterial.get_vertex_hits++;
				return similar.i;
			}
		}*/
		
		/*let br = this.GetBrightness( x1, y1 );
		
		r *= br;
		g *= br;
		b *= br;*/

		const offset = geometry.offset;
		
		const offset_4_1 = offset * 4 * 1;
		const offset_4_2 = offset * 4 * 2;
		const offset_4_3 = offset * 4 * 3;
		const offset_4_4 = offset * 4 * 4;

		const position_dataView = geometry.position_dataView;
		const uv_dataView = geometry.uv_dataView;
		const color_dataView = geometry.color_dataView;
		const hue_rotation_dataView = geometry.hue_rotation_dataView;

		position_dataView.setFloat32( offset_4_3 + 0, x1, true );
		position_dataView.setFloat32( offset_4_3 + 4, y1, true );
		position_dataView.setFloat32( offset_4_3 + 8, z1, true );

		uv_dataView.setFloat32( offset_4_2 + 0, u1, true );
		uv_dataView.setFloat32( offset_4_2 + 4, v1, true );
		
		if ( sdRenderer.shading )
		if ( apply_shading )
		if ( sdWeather.only_instance )
		{
			let sum = 0;
			
			const OFFSET_TARGET_RESULT = 0;
			const OFFSET_AVERAGE_RESULT = 1;
			const OFFSET_RECALC_FRAME = 2;

			let next_recalc = sdAtlasMaterial.brightness_cache_buffer_dataView.getUint32( cache_slot + OFFSET_RECALC_FRAME );
			
			if ( sdAtlasMaterial.brightness_recalculation_frame > next_recalc )
			{
				let sun_intensity = sdWeather.only_instance.GetSunIntensity();

				sum += Math.max( 0.5, Math.min( 1, ( 32 - wy ) / 64 ) * sun_intensity * 2 );

				let range;
				let intenisty;

				for ( let i2 = 0; i2 < sdRenderer.known_light_sources_previous.length; i2++ )
				{
					let e = sdRenderer.known_light_sources_previous[ i2 ];

					switch ( e._class_id )
					{
						//if ( e.is( sdLamp ) )
						case sdLamp.class_id:
						{
							range = 200;
							intenisty = 1;
						}
						break;
						//else
						//if ( e.is( sdWater ) )
						case sdWater.class_id:
						{
							range = 100;
							intenisty = 1;
						}
						break;
						//else
						default:
						{
							range = 50;
							intenisty = 0.3;
						}
						break;
					}

					let di = sdWorld.inDist2D( wx, wy, e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2, e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2, range );
					if ( di >= 0 )
					{
						sum += intenisty * ( 1 - di / range );
						//sum += intenisty * ( 30 / ( 30 + 200 * di / range ) );
					}
				}
				for ( let i = 0; i < sdCharacter.characters.length; i++ )
				{
					let e = sdCharacter.characters[ i ];
					if ( e.flashlight )
					if ( e.hea > 0 )
					{
						range = 150;
						intenisty = 0.7;

						let di = sdWorld.inDist2D( wx, wy, e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2, e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2, range );
						if ( di >= 0 )
						{
							sum += 0.7 * ( 1 - di / range );
							//sum += intenisty * ( 30 / ( 30 + 200 * di / range ) );
						}
					}
				}

				if ( sum > 1 )
				sum = 1;

				sdAtlasMaterial.brightness_cache_buffer_dataView.setUint8( cache_slot + OFFSET_TARGET_RESULT, sum * 255 );
				sdAtlasMaterial.brightness_cache_buffer_dataView.setUint32( cache_slot + OFFSET_RECALC_FRAME, sdAtlasMaterial.brightness_recalculation_frame + 1 );
				//sdAtlasMaterial.brightness_cache_buffer_dataView.setUint32( cache_slot + OFFSET_RECALC_FRAME, sdAtlasMaterial.brightness_recalculation_frame + 32 + ~~( Math.random() * 32 ) );
			}
			else
			{
				sum = sdAtlasMaterial.brightness_cache_buffer_dataView.getUint8( cache_slot + OFFSET_TARGET_RESULT ) / 255;
			}
			
			if ( sum < 1 )
			{
				r *= sum;
				g *= sum;
				b *= sum;
			}
		}
		/*if ( sdRenderer.shading )
		if ( apply_shading ) // 2 ms
		if ( sdAtlasMaterial.brightness_cache_buffer_dataView !== null ) // 46 ms
		{
			const x = wx;
			const y = wy;
			
			const OFFSET_TARGET_RESULT = 0;
			const OFFSET_AVERAGE_RESULT = 1;
			const OFFSET_RECALC_FRAME = 2;

			let next_recalc = sdAtlasMaterial.brightness_cache_buffer_dataView.getUint32( cache_slot + OFFSET_RECALC_FRAME );

			let target_result = 255;
			
			let current_result;
			
			if ( sdAtlasMaterial.brightness_recalculation_frame > next_recalc )
			{
				let screen_top_y = Math.max( sdWorld.world_bounds.y1 + 8, sdAtlasMaterial.brightness_cache_cam_y + ( - 0.5 ) * sdAtlasMaterial.brightness_cache_mult_y - 400 );

				let rays = 0;
				
				const rays_total = 1; // 3
				
				function TraceRayTowards( x2, y2 )
				{
					sdWorld.last_hit_entity = null;
					
					if ( !sdWeather.only_instance )
					rays += ( 1 + 0.5 );
					else
					if ( sdWorld.CheckLineOfSight( x, y, x2, y2, null, null, null, sdWorld.FilterVisionBlocking ) || !sdWorld.last_hit_entity ) // Count world edges too
					rays += ( 1 * sdWeather.only_instance.GetSunIntensity() + 0.5 );
				}

				TraceRayTowards( x, screen_top_y );
				
				let fast_recalc = false;
				
				if ( rays < rays_total )
				for ( let i2 = 0; i2 < sdRenderer.known_light_sources_previous.length; i2++ )
				{
					let e = sdRenderer.known_light_sources_previous[ i2 ];
					
					// Blinking bug? Check this
					if ( 0 )
					{
						if ( 
							isNaN( e.x ) ||
							isNaN( e.y ) ||
							isNaN( e._hitbox_x1 ) ||
							isNaN( e._hitbox_x2 ) ||
							isNaN( e._hitbox_y1 ) ||
							isNaN( e._hitbox_y2 )
						)
						debugger;
					}
					
					let range = e.is( sdLamp ) ? 200 : e.is( sdWater ) ? 100 : 50;
					
					if ( !fast_recalc )
					if ( e.is( sdCharacter ) || e.is( sdEffect ) || e.is( sdBullet ) || e.is( sdHover ) )
					if ( sdWorld.inDist2D_Boolean( x, y, e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2, e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2, range + 100 ) )
					fast_recalc = true;
					
					if ( sdWorld.inDist2D_Boolean( x, y, e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2, e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2, range ) )
					if ( sdWorld.CheckLineOfSight( x, y, e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2, e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2, e, null, null, sdWorld.FilterVisionBlocking ) )
					{
						rays += rays_total;

						if ( rays >= rays_total )
						{
							rays = rays_total;
							break;
						}
					}
				}
				
				target_result *= ( rays / rays_total ) * 0.9 + 0.1;
				
				if ( target_result > 255 )
				target_result = 255;
				else
				target_result = ~~target_result;
			
				if ( fast_recalc )
				next_recalc = sdAtlasMaterial.brightness_recalculation_frame + 1;
				else
				next_recalc = sdAtlasMaterial.brightness_recalculation_frame + 32 + ~~( Math.random() * 32 );
				
				sdAtlasMaterial.brightness_cache_buffer_dataView.setUint8( cache_slot + OFFSET_TARGET_RESULT, target_result );
				sdAtlasMaterial.brightness_cache_buffer_dataView.setUint32( cache_slot + OFFSET_RECALC_FRAME, next_recalc );
				
				let tot = 0;
				
				function GetFinalBrightnessFor( cache_slot )
				{
					if ( cache_slot < 0 )
					return -1;

					if ( cache_slot >= sdAtlasMaterial.brightness_cache_buffer.byteLength )
					return -1;
				
					let last_recalc = sdAtlasMaterial.brightness_cache_buffer_dataView.getUint32( cache_slot + OFFSET_RECALC_FRAME );
					
					if ( last_recalc <= 0  )
					return -1;

					target_result = sdAtlasMaterial.brightness_cache_buffer_dataView.getUint8( cache_slot + OFFSET_TARGET_RESULT );

					return target_result;
				}

				current_result = target_result; tot++;
				
			   
				for ( let xx = -2; xx <= 2; xx++ )
				for ( let yy = -2; yy <= 2; yy++ )
				{
					let near = GetFinalBrightnessFor( 
									cache_slot + 
										sdAtlasMaterial.brightness_cache_buffer_group_size * xx + 
										sdAtlasMaterial.brightness_cache_buffer_group_size * sdAtlasMaterial.brightness_cache_buffer_width * yy 
					);
					
					if ( near !== -1 )
					{
						current_result += near;
						tot++;
					}
					
				}
				
				current_result /= tot;

				current_result = ~~current_result;

				sdAtlasMaterial.brightness_cache_buffer_dataView.setUint8( cache_slot + OFFSET_AVERAGE_RESULT, current_result );
			}
			else
			{
				current_result = sdAtlasMaterial.brightness_cache_buffer_dataView.getUint8( cache_slot + OFFSET_AVERAGE_RESULT );
			}
			
			if ( current_result < 255 )
			{
				const soft_end = 32;
				
				for ( let i = 0; i < sdCharacter.characters.length; i++ )
				{
					let char = sdCharacter.characters[ i ];
					if ( char.flashlight )
					if ( char.hea > 0 )
					{
						let firstAngle = Math.atan2( char.look_x - char.x, char.look_y - char.y );
						let secondAngle = Math.atan2( wx - char.x, wy - char.y );

						let an = firstAngle - secondAngle;

						if ( an > Math.PI )
						an -= Math.PI * 2;

						if ( an < -Math.PI )
						an += Math.PI * 2;

						an = Math.abs( an ) / 0.5;

						if ( an < 1 )
						{
							let di = sdWorld.Dist2D_Vector( wx - char.x, wy - char.y );

							if ( di < 400 )
							{
								let entity_cache = sdAtlasMaterial.quick_radial_traces_cache.get( char );
								if ( entity_cache === undefined )
								{
									entity_cache = new Map();
									sdAtlasMaterial.quick_radial_traces_cache.set( char, entity_cache );
								}

								let rounded_secondAngle = ~~( secondAngle * 150 );

								let length = entity_cache.get( rounded_secondAngle );
								if ( length === undefined )
								{
									let dx = wx - char.x;
									let dy = wy - char.y;

									//let di = sdWorld.Dist2D_Vector( dx, dy );

									if ( di > 1 )
									{
										dx /= di;
										dy /= di;
									}

									sdWorld.TraceRayPoint( char.x, char.y, char.x + dx * 400, char.y + dy * 400, null, null, null, sdWorld.FilterOnlyVisionBlocking );

									length = sdWorld.Dist2D_Vector( sdWorld.reusable_closest_point.x - char.x, sdWorld.reusable_closest_point.y - char.y ) + soft_end;

									entity_cache.set( rounded_secondAngle, length );
								}

								//if ( sdWorld.CheckLineOfSight( char.x, char.y, wx, wy, null, null, sdCom.com_vision_blocking_classes ) )
								//if ( sdWorld.CheckLineOfSight( char.x, char.y, wx, wy, null, null, null, sdWorld.FilterOnlyVisionBlocking ) )
								if ( di < length )
								{
									let mult = 255;

									mult *= ( 1 - an );

									mult *= ( 1 - di / 400 );

									if ( di > length - soft_end )
									mult *= 1 - ( di - ( length - soft_end ) ) / soft_end;

									current_result = Math.min( 255, Math.max( current_result, mult ) );
								}
							}
						}
					}
				}
			}

			current_result /= 255;
			
			r *= current_result;
			g *= current_result;
			b *= current_result;
		}*/
		
		color_dataView.setFloat32( offset_4_4 + 0, r, true );
		color_dataView.setFloat32( offset_4_4 + 4, g, true );
		color_dataView.setFloat32( offset_4_4 + 8, b, true );
		color_dataView.setFloat32( offset_4_4 + 12, a, true );

		hue_rotation_dataView.setFloat32( offset_4_1, hue_rotation, true );

		//this.last_vertices.set( x1 + y1 + u1 + v1, { x:x1, y:y1, z:z1, u:u1, v:v1, r:r,g:g,b:b,a:a, i:offset });

		geometry.offset++;

		//sdAtlasMaterial.get_vertex_misses++;
		return offset;
	}
	
	DrawTriangle(	x1,y1,z1, 
					x2,y2,z2, 
					x3,y3,z3, 
					u1,v1, 
					u2,v2, 
					u3,v3, 
					r,g,b, 
					a,a2,a3, 
					hue_rotation, 
					wx1,wy1,cache_slot1, 
					wx2,wy2,cache_slot2, 
					wx3,wy3,cache_slot3,
					apply_shading )
	{
		const geometry = this.geometry_mesh;
		
		if ( geometry.offset + 3 >= sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
		
		if ( geometry.offset_indices + 3 >= 3 * sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
	
		let p1 = this.GetVertex( x1,y1,z1, u1,v1, geometry,r,g,b,a , hue_rotation, wx1,wy1,cache_slot1, apply_shading );
		let p2 = this.GetVertex( x2,y2,z2, u2,v2, geometry,r,g,b,a2, hue_rotation, wx2,wy2,cache_slot2, apply_shading );
		let p3 = this.GetVertex( x3,y3,z3, u3,v3, geometry,r,g,b,a3, hue_rotation, wx3,wy3,cache_slot3, apply_shading );
		
	
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			p1
			, true );
			
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			p2
			, true );
		
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			p3
			, true );
			
		//globalThis.super_texture_with_triangle = this;
	}
	DrawQuad(	x1,y1,z1, 
				x2,y2,z2, 
				x3,y3,z3, 
				x4,y4,z4, 
				u1,v1, 
				u2,v2, 
				u3,v3, 
				u4,v4, 
				r,g,b,a, 
				hue_rotation, 
				wx1,wy1,cache_slot1, 
				wx2,wy2,cache_slot2, 
				wx3,wy3,cache_slot3, 
				wx4,wy4,cache_slot4,
				apply_shading ) // left-top, right-top, bottom-left, bottom-right
	{
		const geometry = this.geometry_mesh;
		
		if ( geometry.offset + 4 >= sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
		
		if ( geometry.offset_indices + 6 >= 3 * sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
	
		let lt = this.GetVertex( x1,y1,z1, u1,v1, geometry,r,g,b,a, hue_rotation, wx1,wy1,cache_slot1, apply_shading );
		let rt = this.GetVertex( x2,y2,z2, u2,v2, geometry,r,g,b,a, hue_rotation, wx2,wy2,cache_slot2, apply_shading );
		let lb = this.GetVertex( x3,y3,z3, u3,v3, geometry,r,g,b,a, hue_rotation, wx3,wy3,cache_slot3, apply_shading );
		let rb = this.GetVertex( x4,y4,z4, u4,v4, geometry,r,g,b,a, hue_rotation, wx4,wy4,cache_slot4, apply_shading );
	
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			lt
			, true );
			
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			rt
			, true );
		
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			lb
			, true );
			
			
			//return; // Hack
			
			
	
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			rt
			, true );
		
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			lb
			, true );
			
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			rb
			, true );
			
	}
	
	/*DrawDot( x, y, z, sx, sy, rotation, dedicated_space, r,g,b,a, hue_rotation )
	{
		const geometry = this.geometry_dots;
		
		const color_dataView = geometry.color_dataView;
		const hue_rotation_dataView = geometry.hue_rotation_dataView;
		
		const offset = geometry.offset;
		
		const offset_4_1 = offset * 4 * 1;
		const offset_4_2 = offset * 4 * 2;
		const offset_4_3 = offset * 4 * 3;
		const offset_4_4 = offset * 4 * 4;
		
		geometry.position_dataView.setFloat32( offset_4_3 + 0, x, true );
		geometry.position_dataView.setFloat32( offset_4_3 + 4, y, true );
		geometry.position_dataView.setFloat32( offset_4_3 + 8, z, true );
		
		let size = Math.max( sx, sy ) / Math.sin( Math.PI / 4 );
		
		geometry.dot_scale_and_size_dataView.setFloat32( offset_4_3 + 0, sx, true ); // x
		geometry.dot_scale_and_size_dataView.setFloat32( offset_4_3 + 4, sy, true ); // y
		geometry.dot_scale_and_size_dataView.setFloat32( offset_4_3 + 8, size, true ); // z
		
		geometry.rotation_dataView.setFloat32( offset_4_1, rotation, true );
		
		geometry.uv2_dataView.setFloat32( offset_4_2 + 0, ( dedicated_space.x + dedicated_space.w / 2 ) / this.canvas.width, true );
		geometry.uv2_dataView.setFloat32( offset_4_2 + 4, ( dedicated_space.y + dedicated_space.h / 2 ) / this.canvas.height, true );
		

		color_dataView.setFloat32( offset_4_4 + 0, r, true );
		color_dataView.setFloat32( offset_4_4 + 4, g, true );
		color_dataView.setFloat32( offset_4_4 + 8, b, true );
		color_dataView.setFloat32( offset_4_4 + 12, a, true );

		hue_rotation_dataView.setFloat32( offset_4_1, hue_rotation, true );
		
		
		geometry.offset++;
	
		geometry.position.needsUpdate = true;
		geometry.dot_scale_and_size.needsUpdate = true;
		geometry.rotation.needsUpdate = true;
		geometry.uv2.needsUpdate = true;
		geometry.hue_rotation.needsUpdate = true;
	}*/
	
	DedicateSpace( w, h )
	{
		if ( w > sdAtlasMaterial.super_texture_width || h > sdAtlasMaterial.super_texture_height )
		throw new Error();
	
		//if ( w > 64 || h > 64 )
		//throw new Error();
		
		const safe_area = 1;
		
		w += safe_area * 2;
		h += safe_area * 2;
	
		let dedication = null;
		
		if ( this.offset_x + w > this.canvas.width )
		{
			this.offset_x = 0;
			this.offset_y += this.max_line_height;
			
			this.max_line_height = 0;
		}
		
		if ( this.offset_x + w <= this.canvas.width )
		{
			if ( this.offset_y + h <= this.canvas.height )
			{
				// Fits
				dedication = new sdSpaceDedication( this.offset_x, this.offset_y, w, h, this );
		
				dedication.x += safe_area;
				dedication.y += safe_area;
				dedication.w -= safe_area * 2;
				dedication.h -= safe_area * 2;

				this.dedications.push( dedication );
				
				sdAtlasMaterial.images_total_counter++;
				
				this.offset_x += w;
				
				this.max_line_height = Math.max( this.max_line_height, h );
			}
		}
		
		return dedication;
	}
	
	Preview()
	{
		//document.body.appendChild( this.canvas );
		//this.canvas.style.cssText = `position:fixed;left:0px;top:0px;border:1px solid grey;`;
		
		sdAtlasMaterial.PreviewCanvas( this.canvas );
	}
}

class sdAtlasMaterial
{
	static PreviewCanvas( canvas )
	{
		document.body.appendChild( canvas );
		canvas.style.cssText = `position:fixed;left:${ sdAtlasMaterial.preview_offset }px;top:0px;border:1px solid grey;`;
		
		sdAtlasMaterial.preview_offset += canvas.width + 2;
	}
	static init_class()
	{
		sdAtlasMaterial.preview_offset = 0;
		
		sdAtlasMaterial.images_total_counter = 0;
		sdAtlasMaterial.textures_total_counter = 0;
		
		sdAtlasMaterial.super_texture_width = -1;//2048;
		sdAtlasMaterial.super_texture_height = -1;//2048;
		// Will be overriden later ^
		
		sdAtlasMaterial.maximum_dots_per_super_texture = 65535;//2048;
		
		sdAtlasMaterial.GROUP_OPAQUE = 0;
		sdAtlasMaterial.GROUP_OPAQUE_DECAL = 1;
		sdAtlasMaterial.GROUP_TRANSPARENT = 2;
		sdAtlasMaterial.GROUP_TRANSPARENT_ADDITIVE = 3;
		sdAtlasMaterial.GROUP_TRANSPARENT_UNSORTED = 4;
		//sdAtlasMaterial.GROUP_TRANSPARENT_IN_GAME_HUD = 2;
		//sdAtlasMaterial.GROUP_TRANSPARENT_ONSCREEN_HUD = 3;
		//sdAtlasMaterial.GROUP_TRANSPARENT_ONSCREEN_FOREGROUND = 4;

		sdAtlasMaterial.super_textures = [ [], [], [], [], [] ]; // arr of arr-groups of sdSuperTexture
		
		sdAtlasMaterial.get_vertex_hits = 0;
		sdAtlasMaterial.get_vertex_misses = 0;
		sdAtlasMaterial.get_vertex_cache_length = 1024;
		
		// Reusable vectors
		sdAtlasMaterial.a = new THREE.Vector2();
		sdAtlasMaterial.b = new THREE.Vector2();
		sdAtlasMaterial.c = new THREE.Vector2();
		sdAtlasMaterial.d = new THREE.Vector2();
		
		// Reusable screen bounds, to find position of vertex in world for shading
		sdAtlasMaterial.left_top = new THREE.Vector2();
		sdAtlasMaterial.right_bottom = new THREE.Vector2();
		sdAtlasMaterial.one_div_right_minus_left_x = 1;
		sdAtlasMaterial.one_div_right_minus_left_y = 1;
		
		sdAtlasMaterial.uv_a = new THREE.Vector2();
		sdAtlasMaterial.uv_b = new THREE.Vector2();
		sdAtlasMaterial.uv_c = new THREE.Vector2();
		sdAtlasMaterial.uv_d = new THREE.Vector2();
		
		sdAtlasMaterial.cam_xy = new THREE.Vector2();
		
		sdAtlasMaterial.white_pixel = document.createElement('canvas');
		sdAtlasMaterial.white_pixel.width = 1;
		sdAtlasMaterial.white_pixel.height = 1;
		let ctx = sdAtlasMaterial.white_pixel.getContext("2d");
		ctx.fillStyle = '#ffffff';
		ctx.fillRect( 0,0,1,1 );
		
		sdAtlasMaterial.global_font_scale = 11;
		sdAtlasMaterial.global_font_offset_y = 10;
		
		sdAtlasMaterial.character_images = new Map(); // Cache each new character
		
		//sdAtlasMaterial.brightness_cache = [];
		sdAtlasMaterial.brightness_recalculation_frame = 0;
		sdAtlasMaterial.brightness_cache_buffer = null; // 1 byte per target target_result + 1 byte per smoothed result + 4 bytes per recalc timestamp
		sdAtlasMaterial.brightness_cache_buffer_dataView = null;
		sdAtlasMaterial.brightness_cache_buffer_width = 0;
		sdAtlasMaterial.brightness_cache_buffer_height = 0;
		sdAtlasMaterial.brightness_cache_buffer_group_size = 1 + 1 + 4;
		sdAtlasMaterial.brightness_cache_cam_x = 0;
		sdAtlasMaterial.brightness_cache_cam_y = 0;
		sdAtlasMaterial.brightness_cache_mult_x = 0;
		sdAtlasMaterial.brightness_cache_mult_y = 0;
		
		sdAtlasMaterial.quick_radial_traces_cache = new Map(); // Map( entity => Map( secondAngle, length ) )
		
		/*sdAtlasMaterial.brightness_map_width = 26;
		sdAtlasMaterial.brightness_map_height = 13;
		sdAtlasMaterial.brightness_map = new Map();*/
	}
	
	static CreateLinearGradientImage( obj )
	{
		let stops = obj.stops;
		
		if ( stops.length !== 2 )
		debugger;
	
		let canvas = document.createElement('canvas');
		
		canvas.width = 1;
		canvas.height = stops.length;
		let ctx = canvas.getContext("2d");
		for ( let y = 0; y < stops.length; y++ )
		{
			ctx.fillStyle = stops[ y ][ 1 ];
			ctx.fillRect( 0, y, 1, 1 );
		}
		return canvas;
	}
	
	static CreateImageForCharacter( char )
	{
		//sdAtlasMaterial.character_images
		
		if ( !document.fonts.check("12px ui_font") )
		return undefined;
		
		let canvas = document.createElement('canvas');
		
		canvas.width = 7;
		canvas.height = 13;
		
		let ctx = canvas.getContext("2d");
		
		/*ctx.imageSmoothingEnabled = false;
		
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.shadowBlur = 1;
		ctx.shadowColor = 'rgba(0,0,0,0)';*/
		
		ctx.fillStyle = '#ffffff';
		ctx.font = '12px ui_font';
		ctx.fillText( String.fromCharCode( char ), 0, 10 );
		
		let myImageData = ctx.getImageData( 0, 0, 7, 13 );
		
		// Sharpen becaue browsers don't have antialiasing
		for ( let i = 0; i < myImageData.data.length; i += 4 )
		if ( myImageData.data[ i + 3 ] !== 0 )
		myImageData.data[ i + 3 ] = ( myImageData.data[ i + 3 ] < 200 ) ? 0 : 255;
		//myImageData.data[ i + 3 ] = ( myImageData.data[ i + 3 ] < 127 ) ? 0 : 255;
		
		ctx.putImageData( myImageData, 0, 0 );
		
		//trace( 'Character: '+ String.fromCharCode( char ) );
		//sdAtlasMaterial.PreviewCanvas( canvas );
		
		return canvas;
	}
	
	static DedicateSpace( w, h, is_transparent_int=sdAtlasMaterial.GROUP_OPAQUE )
	{
		if ( sdAtlasMaterial.super_textures.length === 0 )
		{
		}
		else
		for ( let i = 0; i < sdAtlasMaterial.super_textures[ is_transparent_int ].length; i++ )
		{
			let dedication = sdAtlasMaterial.super_textures[ is_transparent_int ][ i ].DedicateSpace( w, h );
			
			if ( dedication )
			return dedication;
		}
		
		let new_super_texture = new sdSuperTexture( is_transparent_int );
		sdAtlasMaterial.textures_total_counter++;
		
		sdAtlasMaterial.super_textures[ is_transparent_int ].push( new_super_texture );
		
		return new_super_texture.DedicateSpace( w, h );
	}
	
	static drawTriangle( x,y, x2,y2, x3,y3, cr,cg,cb, a1,a2,a3 )
	{
		if ( sdRenderer.ctx.globalAlpha <= 0 )
		return;
	
		let img = sdAtlasMaterial.white_pixel;
		/*
		if ( img.loaded !== false ) // Offscreen canvas may appear here too
		{
		}
		else
		{
			img.RequiredNow();
			return;
		}
		*/
		let is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT;//~~Math.random() * 4;//GROUP_TRANSPARENT_UNSORTED;
		
		let super_texture;
		let dedication;
		
		[ dedication, super_texture ] = sdAtlasMaterial.DedicateSpaceAndGetDedicationAndSuperTexture( img, is_transparent_int );

		const canvas_size = super_texture.canvas_size_scale_down_vector;//new THREE.Vector2( 1 / super_texture.canvas.width, 1 / super_texture.canvas.height );
		const mat = sdRenderer.ctx._matrix3;//.clone().invert();
		
		const a = sdAtlasMaterial.a.set( x, y ); // Left-top
		const b = sdAtlasMaterial.b.set( x2, y2 ); // Right-top
		const c = sdAtlasMaterial.c.set( x3, y3 ); // Left-bottom

		a.applyMatrix3( mat );
		b.applyMatrix3( mat );
		c.applyMatrix3( mat );
			
		let z_position = -sdRenderer.ctx.z_offset;
		
		let sx = 0;
		let sy = 0;
		let sWidth = 1;
		let sHeight = 1;
		
		sx += dedication.x;
		sy += dedication.y;
		
		const uv_a = sdAtlasMaterial.uv_a.set( sx, sy ); // Left-top
		const uv_b = sdAtlasMaterial.uv_b.set( sx + sWidth, sy ); // Right-top
		const uv_c = sdAtlasMaterial.uv_c.set( sx, sy + sHeight ); // Left-bottom
		//const uv_d = sdAtlasMaterial.uv_d.set( sx + sWidth, sy + sHeight ); // Right-bottom

		uv_a.multiply( canvas_size );
		uv_b.multiply( canvas_size );
		uv_c.multiply( canvas_size );
		//uv_d.multiply( canvas_size );
		
		if ( sdRenderer.ctx.camera_relative_world_scale !== 1 )
		{
			//const cam_xy = new THREE.Vector2( sdRenderer.ctx.camera.position.x, sdRenderer.ctx.camera.position.y );
			const cam_xy = sdAtlasMaterial.cam_xy.set( sdRenderer.ctx.camera.position.x, sdRenderer.ctx.camera.position.y );

			a.sub( cam_xy );
			b.sub( cam_xy );
			c.sub( cam_xy );

			a.multiplyScalar( sdRenderer.ctx.camera_relative_world_scale );
			b.multiplyScalar( sdRenderer.ctx.camera_relative_world_scale );
			c.multiplyScalar( sdRenderer.ctx.camera_relative_world_scale );

			a.add( cam_xy );
			b.add( cam_xy );
			c.add( cam_xy );
		}
		
		/*a.x = 0;
		a.y = 0;
		
		b.x = 100;
		b.y = 0;
		
		c.x = 0;
		c.y = -100;
		
		a1=a2=a3 = 1;
		
		z_position = 0;
		super_texture.DrawQuad( a.x, a.y, z_position, a.x, a.y, z_position, b.x, b.y, z_position, c.x, c.y, z_position, 0,0, 0,0, 0,0, 0,0, cr,cg,cb, a1, 0 ) // left-top, right-top, bottom-left, bottom-right
	*/
		super_texture.DrawTriangle( 
				a.x, a.y, z_position,
				b.x, b.y, z_position,
				c.x, c.y, z_position,
				
				uv_a.x,uv_a.y,
				uv_b.x,uv_b.y,
				uv_c.x,uv_c.y,

				cr,cg,cb,
				
				a1,
				a2,
				a3,
				
				0,
				
				0,0,0,
				0,0,0,
				0,0,0,
				false
		);
	}
	
	static DedicateSpaceAndGetDedicationAndSuperTexture( img, is_transparent_int )
	{
		let dedication, super_texture;
		
		if ( !img.super_textures )
		{
			img.super_textures = [];
			for ( let i = 0; i < sdAtlasMaterial.super_textures.length; i++ )
			img.super_textures[ i ] = null;
		}
		
		if ( img.super_textures[ is_transparent_int ] )
		{
			dedication = img.super_textures[ is_transparent_int ];
			super_texture = dedication.super_texture;
		}
		else
		{
			dedication = sdAtlasMaterial.DedicateSpace( img.width, img.height, is_transparent_int );
			img.super_textures[ is_transparent_int ] = dedication;
			super_texture = dedication.super_texture;
			super_texture.ctx.drawImage( img, dedication.x, dedication.y, img.width, img.height );
			super_texture.texture.needsUpdate = true;
		}
		
		dedication.last_time_used = sdWorld.time;
		
		return [ dedication, super_texture ];
	}
	
	static drawImage( img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight )
	{
		const ctx = sdRenderer.ctx;
		
		if ( ctx.globalAlpha <= 0 )
		return;
	
		if ( img.loaded !== false ) // Offscreen canvas may appear here too
		{
		}
		else
		{
			img.RequiredNow();
			return;
		}
		
		// Keep low values and flip rotation sign
		/*if ( rotation > 0 )
		rotation = -( rotation % ( Math.PI * 2 ) );
		else
		rotation = ( ( -rotation ) % ( Math.PI * 2 ) );*/
		
		let layers = 1;
		let connect_layers = false;
		let is_transparent_int = sdAtlasMaterial.GROUP_OPAQUE;
		let odd_x_offset = 0;
		let top_x_offset = 0;
		let opacity_div = 1;
		
		switch ( ctx.volumetric_mode )
		{
			case FakeCanvasContext.DRAW_IN_3D_FLAT:
			{
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT:
			{
				//is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT;
				
				switch ( ctx.camera_relative_world_scale )
				{
					case sdRenderer.distance_scale_in_game_hud: 
					//	is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT_IN_GAME_HUD;
					//break;
					case sdRenderer.distance_scale_on_screen_hud: 
					//	is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT_ONSCREEN_HUD;
					//break;
					case sdRenderer.distance_scale_on_screen_foreground: 
					//	is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT_ONSCREEN_FOREGROUND;
						is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT_UNSORTED;
					break;
					default:
						is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT;
					break;
				}
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_BOX:
			{
				connect_layers = true;
				layers = 2;
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_LIQUID:
			{
				layers = 5;
				is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT;
				opacity_div = 5;
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_GRASS:
			{
				layers = 4;
					
				odd_x_offset = 0.2 * 16;
				
				top_x_offset = Math.round( Math.sin( sdWorld.time / 500 ) * 0.1 * 16 * 3 ) / 3;
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_GRASS_SINGLE_LAYER:
			{
				layers = 1;
					
				//odd_x_offset = 0.2 * 16;
				
				top_x_offset = Math.round( Math.sin( sdWorld.time / 500 ) * 0.1 * 16 * 3 ) / 3;
				is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT;
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT:
			{
				connect_layers = true;
				layers = 2;
				is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT;
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_BOX_DECAL:
			{
				connect_layers = true;
				layers = 2;
				is_transparent_int = sdAtlasMaterial.GROUP_OPAQUE_DECAL;
			}
			
			break;
		}
		
		if ( ctx.blend_mode === THREE.AdditiveBlending )
		is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT_ADDITIVE;
		
		let super_texture;
		let dedication;
		
		[ dedication, super_texture ] = sdAtlasMaterial.DedicateSpaceAndGetDedicationAndSuperTexture( img, is_transparent_int );
		
		/*
		
		if ( !img.super_textures )
		{
			img.super_textures = [];
			for ( let i = 0; i < sdAtlasMaterial.super_textures.length; i++ )
			img.super_textures[ i ] = null;
		}
		
		if ( img.super_textures[ is_transparent_int ] )
		{
			dedication = img.super_textures[ is_transparent_int ];
			super_texture = dedication.super_texture;
		}
		else
		{
			dedication = sdAtlasMaterial.DedicateSpace( img.width, img.height, is_transparent_int );
			img.super_textures[ is_transparent_int ] = dedication;
			super_texture = dedication.super_texture;
			super_texture.ctx.drawImage( img, dedication.x, dedication.y, img.width, img.height );
			super_texture.texture.needsUpdate = true;
		}
					
		dedication.last_time_used = sdWorld.time;
		*/

		
		const canvas_size = super_texture.canvas_size_scale_down_vector;//new THREE.Vector2( 1 / super_texture.canvas.width, 1 / super_texture.canvas.height );
		const mat = ctx._matrix3;//.clone().invert();

		const cr = ctx.sd_color_mult_r;
		const cg = ctx.sd_color_mult_g;
		const cb = ctx.sd_color_mult_b;
		const ca = ctx.globalAlpha / opacity_div;
		const hue_rotation = ctx.sd_hue_rotation / 180 * Math.PI;
		
		
		//const a = new THREE.Vector2( dx, dy ); // Left-top
		//const b = new THREE.Vector2( dx + dWidth, dy ); // Right-top
		//const c = new THREE.Vector2( dx, dy + dHeight ); // Left-bottom
		//const d = new THREE.Vector2( dx + dWidth, dy + dHeight ); // Right-bottom
		
		const a = sdAtlasMaterial.a.set( dx, dy ); // Left-top
		const b = sdAtlasMaterial.b.set( dx + dWidth, dy ); // Right-top
		const c = sdAtlasMaterial.c.set( dx, dy + dHeight ); // Left-bottom
		const d = sdAtlasMaterial.d.set( dx + dWidth, dy + dHeight ); // Right-bottom
		
		if ( top_x_offset !== 0 )
		{
			a.x += top_x_offset;
			b.x += top_x_offset;
		}

		a.applyMatrix3( mat );
		b.applyMatrix3( mat );
		c.applyMatrix3( mat );
		d.applyMatrix3( mat );
			
		let z_position = -ctx.z_offset;
		
		if ( ctx.object_offset !== null )
		{
			const x = ctx.object_offset[ 0 ];
			const y = ctx.object_offset[ 1 ];
			const z = ctx.object_offset[ 2 ] / 64 * ctx.z_depth;
			
			a.x += x;
			b.x += x;
			c.x += x;
			d.x += x;
			
			a.y += y;
			b.y += y;
			c.y += y;
			d.y += y;
			
			z_position += z;
		}

		if ( ctx.camera_relative_world_scale !== 1 )
		{
			//const cam_xy = new THREE.Vector2( ctx.camera.position.x, ctx.camera.position.y );
			const cam_xy = sdAtlasMaterial.cam_xy.set( ctx.camera.position.x, ctx.camera.position.y );

			a.sub( cam_xy );
			b.sub( cam_xy );
			c.sub( cam_xy );
			d.sub( cam_xy );

			a.multiplyScalar( ctx.camera_relative_world_scale );
			b.multiplyScalar( ctx.camera_relative_world_scale );
			c.multiplyScalar( ctx.camera_relative_world_scale );
			d.multiplyScalar( ctx.camera_relative_world_scale );

			a.add( cam_xy );
			b.add( cam_xy );
			c.add( cam_xy );
			d.add( cam_xy );
		}
		
		sx += dedication.x;
		sy += dedication.y;

		//let uv_a = new THREE.Vector2( sx, sy ); // Left-top
		//let uv_b = new THREE.Vector2( sx + sWidth, sy ); // Right-top
		//let uv_c = new THREE.Vector2( sx, sy + sHeight ); // Left-bottom
		//let uv_d = new THREE.Vector2( sx + sWidth, sy + sHeight ); // Right-bottom

		const uv_a = sdAtlasMaterial.uv_a.set( sx, sy ); // Left-top
		const uv_b = sdAtlasMaterial.uv_b.set( sx + sWidth, sy ); // Right-top
		const uv_c = sdAtlasMaterial.uv_c.set( sx, sy + sHeight ); // Left-bottom
		const uv_d = sdAtlasMaterial.uv_d.set( sx + sWidth, sy + sHeight ); // Right-bottom

		uv_a.multiply( canvas_size );
		uv_b.multiply( canvas_size );
		uv_c.multiply( canvas_size );
		uv_d.multiply( canvas_size );
		
		let a_wx,a_wy,a_cache_slot,
			b_wx,b_wy,b_cache_slot,
			c_wx,c_wy,c_cache_slot,
			d_wx,d_wy,d_cache_slot;
	
		if ( sdShop.isDrawing )
		ctx.apply_shading = false;
		
		if ( ctx.apply_shading )
		{
			const one_div_right_minus_left_x = sdAtlasMaterial.one_div_right_minus_left_x;
			const one_div_right_minus_left_y = sdAtlasMaterial.one_div_right_minus_left_y;
			
			const brightness_cache_mult_x = sdAtlasMaterial.brightness_cache_mult_x;
			const brightness_cache_mult_y = sdAtlasMaterial.brightness_cache_mult_y;
			
			const brightness_cache_cam_x = sdAtlasMaterial.brightness_cache_cam_x;
			const brightness_cache_cam_y = sdAtlasMaterial.brightness_cache_cam_y;
			
			const left_top = sdAtlasMaterial.left_top;
			
			a_wx = brightness_cache_cam_x + ( ( a.x - left_top.x ) * one_div_right_minus_left_x - 0.5 ) * brightness_cache_mult_x;
			a_wy = brightness_cache_cam_y + ( ( a.y - left_top.y ) * one_div_right_minus_left_y - 0.5 ) * brightness_cache_mult_y;
			a_cache_slot = sdAtlasMaterial.GetCacheSlot( a_wx, a_wy );

			b_wx = brightness_cache_cam_x + ( ( b.x - left_top.x ) * one_div_right_minus_left_x - 0.5 ) * brightness_cache_mult_x;
			b_wy = brightness_cache_cam_y + ( ( b.y - left_top.y ) * one_div_right_minus_left_y - 0.5 ) * brightness_cache_mult_y;
			b_cache_slot = sdAtlasMaterial.GetCacheSlot( b_wx, b_wy );

			c_wx = brightness_cache_cam_x + ( ( c.x - left_top.x ) * one_div_right_minus_left_x - 0.5 ) * brightness_cache_mult_x;
			c_wy = brightness_cache_cam_y + ( ( c.y - left_top.y ) * one_div_right_minus_left_y - 0.5 ) * brightness_cache_mult_y;
			c_cache_slot = sdAtlasMaterial.GetCacheSlot( c_wx, c_wy );

			d_wx = brightness_cache_cam_x + ( ( d.x - left_top.x ) * one_div_right_minus_left_x - 0.5 ) * brightness_cache_mult_x;
			d_wy = brightness_cache_cam_y + ( ( d.y - left_top.y ) * one_div_right_minus_left_y - 0.5 ) * brightness_cache_mult_y;
			d_cache_slot = sdAtlasMaterial.GetCacheSlot( d_wx, d_wy );
		}
			
		const apply_shading = ctx.apply_shading;
		
		for ( let layer = 0; layer < layers; layer++ )
		{
			let z0 = z_position;
			let z = z0;
			
			if ( layers > 1 )
			{
				z += ctx.z_depth * layer / ( layers - 1 );
				
				
				
				z -= ctx.z_depth / 2;
				z0 -= ctx.z_depth / 2;
			}

			if ( ctx.camera_relative_world_scale !== 1 )
			{
				let dz = z - ctx.camera.position.z;

				dz *= ctx.camera_relative_world_scale;
				
				z = dz + ctx.camera.position.z;
			}
			
			if ( connect_layers && layer !== 0 )
			{
				
				// left ( a + c )
				if ( ctx.box_caps.left )
				if ( ctx.box_caps.is_rotated || sdRenderer.screen_width / 2 < a.x )
				{
					super_texture.DrawQuad( 
							a.x, a.y, z0,
							a.x, a.y, z,
							c.x, c.y, z0,
							c.x, c.y, z,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,
							uv_d.x, uv_d.y,

							cr,cg,cb,ca,hue_rotation,
							
							a_wx, a_wy, a_cache_slot,
							a_wx, a_wy, a_cache_slot,
							c_wx, c_wy, c_cache_slot,
							c_wx, c_wy, c_cache_slot,
							
							apply_shading
					);
					/*super_texture.DrawPolygon( 
							a.x, a.y, z0,
							a.x, a.y, z,
							c.x, c.y, z0,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);
					super_texture.DrawPolygon( 
							a.x, a.y, z,
							c.x, c.y, z,
							c.x, c.y, z0,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);*/
				}
		
				// right ( b + d )
				if ( ctx.box_caps.right )
				if ( ctx.box_caps.is_rotated || sdRenderer.screen_width / 2 > b.x )
				{
					super_texture.DrawQuad( 
							b.x, b.y, z0,
							b.x, b.y, z,
							d.x, d.y, z0,
							d.x, d.y, z,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,
							uv_d.x, uv_d.y,

							cr,cg,cb,ca,hue_rotation,
							
							b_wx, b_wy, b_cache_slot,
							b_wx, b_wy, b_cache_slot,
							d_wx, d_wy, d_cache_slot,
							d_wx, d_wy, d_cache_slot,
							
							apply_shading
					);
					/*super_texture.DrawPolygon( 
							b.x, b.y, z0,
							b.x, b.y, z,
							d.x, d.y, z0,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);
					super_texture.DrawPolygon( 
							b.x, b.y, z,
							d.x, d.y, z,
							d.x, d.y, z0,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);*/
				}
		
				// bottom ( c + d )
				if ( ctx.box_caps.bottom )
				if ( ctx.box_caps.is_rotated || sdRenderer.screen_height / 2 > c.y )
				{
					super_texture.DrawQuad( 
							c.x, c.y, z0,
							d.x, d.y, z0,
							c.x, c.y, z,
							d.x, d.y, z,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,
							uv_d.x, uv_d.y,

							cr,cg,cb,ca,hue_rotation,
							
							c_wx, c_wy, c_cache_slot,
							d_wx, d_wy, d_cache_slot,
							c_wx, c_wy, c_cache_slot,
							d_wx, d_wy, d_cache_slot,
							
							apply_shading
					);
					/*
					super_texture.DrawPolygon( 
							c.x, c.y, z0,
							d.x, d.y, z0,
							c.x, c.y, z,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);
					super_texture.DrawPolygon( 
							d.x, d.y, z0,
							d.x, d.y, z,
							c.x, c.y, z,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);
					 */
				}
		
				// top ( a + b )
				if ( ctx.box_caps.top )
				if ( ctx.box_caps.is_rotated || sdRenderer.screen_height / 2 < a.y )
				{
					super_texture.DrawQuad( 
							a.x, a.y, z,
							b.x, b.y, z,
							a.x, a.y, z0,
							b.x, b.y, z0,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,
							uv_d.x, uv_d.y,

							cr,cg,cb,ca,hue_rotation,
							
							a_wx, a_wy, a_cache_slot,
							b_wx, b_wy, b_cache_slot,
							a_wx, a_wy, a_cache_slot,
							b_wx, b_wy, b_cache_slot,
							
							apply_shading
					);
					
					/*super_texture.DrawPolygon( 
							a.x, a.y, z,
							b.x, b.y, z,
							a.x, a.y, z0,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);
					super_texture.DrawPolygon( 
							b.x, b.y, z,
							b.x, b.y, z0,
							a.x, a.y, z0,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca,hue_rotation
					);*/
				}
			}
			else
			{
				// cap
				
				const current_odd_x_offset = ( layer % 2 === 0 ) ? -odd_x_offset : odd_x_offset;
				
				// Dot test? Makes GPU a bottleneck instead
				/*if ( dWidth < 128 && dHeight < 128 )
				{
					let scaled_size = sdWorld.Dist2D_Vector( a.x - b.x, a.y - b.y ) / 2;
					
					super_texture.DrawDot( 
						( a.x + b.x + c.x + d.x ) / 4,
						( a.y + b.y + c.y + d.y ) / 4,
						z,
						scaled_size,
						scaled_size,
						Math.atan2( a.x - b.x, a.y - b.y ),
						dedication,
						cr,cg,cb,ca,hue_rotation
					);
				}*/
				//if ( Math.random() < 0.1 )
				super_texture.DrawQuad( 
						a.x + current_odd_x_offset, a.y, z,
						b.x + current_odd_x_offset, b.y, z,
						c.x + current_odd_x_offset, c.y, z,
						d.x + current_odd_x_offset, d.y, z,

						uv_a.x, uv_a.y,
						uv_b.x, uv_b.y,
						uv_c.x, uv_c.y,
						uv_d.x, uv_d.y,

						cr,cg,cb,ca,hue_rotation,
							
							a_wx, a_wy, a_cache_slot,
							b_wx, b_wy, b_cache_slot,
							c_wx, c_wy, c_cache_slot,
							d_wx, d_wy, d_cache_slot,
							
							apply_shading
				);
						
				/*
				super_texture.DrawPolygon( 
						a.x + current_odd_x_offset, a.y, z,
						b.x + current_odd_x_offset, b.y, z,
						c.x + current_odd_x_offset, c.y, z,

						uv_a.x, uv_a.y,
						uv_b.x, uv_b.y,
						uv_c.x, uv_c.y,

						cr,cg,cb,ca,hue_rotation
				);
				super_texture.DrawPolygon( 
						b.x + current_odd_x_offset, b.y, z,
						d.x + current_odd_x_offset, d.y, z,
						c.x + current_odd_x_offset, c.y, z,

						uv_b.x, uv_b.y,
						uv_d.x, uv_d.y,
						uv_c.x, uv_c.y,

						cr,cg,cb,ca,hue_rotation
				);*/
			}
		}
		/*
		super_texture.DrawPolygon( 
				x,y,z, 
				x + right_x, y + right_y, z,
				x + down_x, y + down_y, z,
				
				uv_x, uv_y,
				uv_x2, uv_y,
				uv_x, uv_y2,
				
				r,g,b,a
		);
		super_texture.DrawPolygon( 
				x + right_x, y + right_y, z,
				x + right_x + down_x, y + right_y + down_y, z,
				x + down_x, y + down_y, z,
				
				uv_x2, uv_y,
				uv_x2, uv_y2,
				uv_x, uv_y2,
				
				r,g,b,a
		);*/
		//super_texture.DrawDot( x, y, z, sx, sy, rotation, img.super_texture );
	}
	
	/*static GetCacheSlot( x, y )
	{
		const w = sdAtlasMaterial.brightness_cache_buffer_width;
		const h = sdAtlasMaterial.brightness_cache_buffer_height;
		return ( sdWorld.limit( 0, Math.round((y-sdWorld.world_bounds.y1)/16), h ) * w + sdWorld.limit( 0, Math.round((x-sdWorld.world_bounds.x1)/16), w ) ) * sdAtlasMaterial.brightness_cache_buffer_group_size;
	}*/
	static GetCacheSlot( x, y )
	{
		const w = sdAtlasMaterial.brightness_cache_buffer_width;
		const h = sdAtlasMaterial.brightness_cache_buffer_height;
		
		/*let i = ( 
			sdWorld.limit( 0, sdWorld.FastFloor( ( y - sdWorld.world_bounds.y1 + 8 ) * 0.0625 ), h ) * w + 
			sdWorld.limit( 0, sdWorld.FastFloor( ( x - sdWorld.world_bounds.x1 + 8 ) * 0.0625 ), w ) 
		) * sdAtlasMaterial.brightness_cache_buffer_group_size;*/

		let i = ( 
			sdWorld.limit( 0, sdWorld.FastFloor( ( y - sdWorld.world_bounds.y1 + 8 ) * 0.0625 ), h-1 ) * w + 
			sdWorld.limit( 0, sdWorld.FastFloor( ( x - sdWorld.world_bounds.x1 + 8 ) * 0.0625 ), w-1 ) 
		) * sdAtlasMaterial.brightness_cache_buffer_group_size;
		
		/*if ( i >= sdAtlasMaterial.brightness_cache_buffer_dataView.byteLength )
		{
			debugger;
			i = 0;
		}*/
		
		return i;
	}
	
	constructor()
	{
	}
	
	static FrameStart()
	{
		//sdAtlasMaterial.brightness_map.clear();
		
		sdAtlasMaterial.quick_radial_traces_cache.clear();
		
		for ( let g = 0; g < sdAtlasMaterial.super_textures.length; g++ )
		for ( let i = 0; i < sdAtlasMaterial.super_textures[ g ].length; i++ )
		sdAtlasMaterial.super_textures[ g ][ i ].FrameStart();
	
		/*sdAtlasMaterial.DrawSprite( sdQuickie.img_quickie_idle1, 0, 0, 0, 32, 32, 0, 1,1,1,1 );
		
		sdAtlasMaterial.DrawSprite( sdQuickie.img_quickie_idle1, sdWorld.camera.x, sdWorld.camera.y, 0, 32, 32, Math.PI / 4, 1,1,1,1 );
		
		if ( sdWorld.my_entity )
		{
			sdAtlasMaterial.DrawSprite( sdQuickie.img_quickie_idle1, sdWorld.my_entity.x, sdWorld.my_entity.y, 0, 32, 32, 0, 1,1,1,1 );
			sdAtlasMaterial.DrawSprite( sdHover.img_hover, sdWorld.my_entity.look_x, sdWorld.my_entity.look_y, 0, 64, 32, sdWorld.time / 2000 * Math.PI, 1,1,1,1 );
			
			sdAtlasMaterial.DrawSprite( sdHover.img_hover, sdWorld.my_entity.look_x, sdWorld.my_entity.look_y + 100, 0, 64 * 2, 32 * 2, sdWorld.time / 2000 * Math.PI, 0,1,0,0.5 );
		}*/
	}
	static CameraPositionUpdated()
	{
		sdAtlasMaterial.left_top.set( 0, 0 );
		sdAtlasMaterial.right_bottom.set( sdRenderer.screen_width, sdRenderer.screen_height );
		sdAtlasMaterial.left_top.applyMatrix3( sdRenderer.ctx._matrix3 );
		sdAtlasMaterial.right_bottom.applyMatrix3( sdRenderer.ctx._matrix3 );
		
		sdAtlasMaterial.one_div_right_minus_left_x = 1 / ( sdAtlasMaterial.right_bottom.x - sdAtlasMaterial.left_top.x );
		sdAtlasMaterial.one_div_right_minus_left_y = 1 / ( sdAtlasMaterial.right_bottom.y - sdAtlasMaterial.left_top.y );
		
		sdAtlasMaterial.brightness_recalculation_frame += 1;
		
		let w = ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 ) / 16;
		let h = ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 ) / 16;
		
		if ( w < 400 )
		w = 400;
		if ( h < 200 )
		h = 200;
		
		if ( sdAtlasMaterial.brightness_cache_buffer_width !== w ||
			 sdAtlasMaterial.brightness_cache_buffer_height !== h )
		if ( sdRenderer.shading )
		{
			sdAtlasMaterial.brightness_cache_buffer = new ArrayBuffer( w * h * sdAtlasMaterial.brightness_cache_buffer_group_size );
			sdAtlasMaterial.brightness_cache_buffer_dataView = new DataView( sdAtlasMaterial.brightness_cache_buffer );
			sdAtlasMaterial.brightness_cache_buffer_width = w;
			sdAtlasMaterial.brightness_cache_buffer_height = h;
		}
		
		sdAtlasMaterial.brightness_cache_cam_x = sdWorld.camera.x;
		sdAtlasMaterial.brightness_cache_cam_y = sdWorld.camera.y;
		
		const closer_to_camera_mult = 0.99;

		sdAtlasMaterial.brightness_cache_mult_x = sdRenderer.screen_width / sdWorld.camera.scale * closer_to_camera_mult;
		sdAtlasMaterial.brightness_cache_mult_y = sdRenderer.screen_height / sdWorld.camera.scale * closer_to_camera_mult;
	}
	static FrameEnd()
	{
		for ( let g = 0; g < sdAtlasMaterial.super_textures.length; g++ )
		for ( let i = 0; i < sdAtlasMaterial.super_textures[ g ].length; i++ )
		sdAtlasMaterial.super_textures[ g ][ i ].FrameEnd( true );
	}
	
	static UpdateDotsScale()
	{
		for ( let g = 0; g < sdAtlasMaterial.super_textures.length; g++ )
		for ( let i = 0; i < sdAtlasMaterial.super_textures[ g ].length; i++ )
		sdAtlasMaterial.super_textures[ g ][ i ].UpdateDotsScale();
	}
}

export default sdAtlasMaterial;