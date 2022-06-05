/*

	Better performance by using significantly smaller number of textures, materials geometry, sharing basically. Recycling outdated areas of textures as well.

	TODO: Make logic to swap dedicated spaces between frequently and rarely updated geometries

	Note: DrawDot is fast to send to GPU but GPU isn't as fast to render it which can cause extra lags

*/

import sdWorld from '../sdWorld.js';

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
			is_transparent_int === sdAtlasMaterial.GROUP_TRANSPARENT
		);

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
	GetVertex( x1,y1,z1, u1,v1, geometry,r,g,b,a, hue_rotation )
	{
		
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
	
	/*DrawPolygon( x1,y1,z1, x2,y2,z2, x3,y3,z3, u1,v1, u2,v2, u3,v3, r,g,b,a, hue_rotation )
	{
		const geometry = this.geometry_mesh;
		
		if ( geometry.offset + 3 >= sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
		
		if ( geometry.offset_indices + 3 >= 3 * sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
	
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			this.GetVertex( x1,y1,z1, u1,v1, geometry,r,g,b,a, hue_rotation )
			, true );
			
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			this.GetVertex( x2,y2,z2, u2,v2, geometry,r,g,b,a, hue_rotation )
			, true );
		
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			this.GetVertex( x3,y3,z3, u3,v3, geometry,r,g,b,a, hue_rotation )
			, true );
	}*/
	DrawPolygon()
	{
		debugger;
		return; // Hack
	}
	DrawQuad( x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4, u1,v1, u2,v2, u3,v3, u4,v4, r,g,b,a, hue_rotation ) // left-top, right-top, bottom-left, bottom-right
	{
		const geometry = this.geometry_mesh;
		
		if ( geometry.offset + 4 >= sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
		
		if ( geometry.offset_indices + 6 >= 3 * sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
	
		let lt = this.GetVertex( x1,y1,z1, u1,v1, geometry,r,g,b,a, hue_rotation );
		let rt = this.GetVertex( x2,y2,z2, u2,v2, geometry,r,g,b,a, hue_rotation );
		let lb = this.GetVertex( x3,y3,z3, u3,v3, geometry,r,g,b,a, hue_rotation );
		let rb = this.GetVertex( x4,y4,z4, u4,v4, geometry,r,g,b,a, hue_rotation );
	
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			lt
			, true );
			
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			rt
			, true );
		
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, 
			lb
			, true );
			
			
			
			
			
	
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
		
		sdAtlasMaterial.super_texture_width = 1024;
		sdAtlasMaterial.super_texture_height = 1024;
		
		sdAtlasMaterial.maximum_dots_per_super_texture = 65535;//2048;
		
		sdAtlasMaterial.GROUP_OPAQUE = 0;
		sdAtlasMaterial.GROUP_OPAQUE_DECAL = 1;
		sdAtlasMaterial.GROUP_TRANSPARENT = 2;
		sdAtlasMaterial.GROUP_TRANSPARENT_UNSORTED = 3;
		//sdAtlasMaterial.GROUP_TRANSPARENT_IN_GAME_HUD = 2;
		//sdAtlasMaterial.GROUP_TRANSPARENT_ONSCREEN_HUD = 3;
		//sdAtlasMaterial.GROUP_TRANSPARENT_ONSCREEN_FOREGROUND = 4;

		sdAtlasMaterial.super_textures = [ [], [], [], [] ]; // arr of arr-groups of sdSuperTexture
		
		sdAtlasMaterial.get_vertex_hits = 0;
		sdAtlasMaterial.get_vertex_misses = 0;
		sdAtlasMaterial.get_vertex_cache_length = 1024;
		
		// Reusable vectors
		sdAtlasMaterial.a = new THREE.Vector2();
		sdAtlasMaterial.b = new THREE.Vector2();
		sdAtlasMaterial.c = new THREE.Vector2();
		sdAtlasMaterial.d = new THREE.Vector2();
		
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
		
		sdAtlasMaterial.super_textures[ is_transparent_int ].push( new_super_texture );
		
		return new_super_texture.DedicateSpace( w, h );
	}
	static drawImage( img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight )
	{
		if ( sdRenderer.ctx.globalAlpha <= 0 )
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
		
		switch ( sdRenderer.ctx.volumetric_mode )
		{
			case FakeCanvasContext.DRAW_IN_3D_FLAT:
			{
			}
			break;
			case FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT:
			{
				//is_transparent_int = sdAtlasMaterial.GROUP_TRANSPARENT;
				
				switch ( sdRenderer.ctx.camera_relative_world_scale )
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
		
		let super_texture;
		let dedication;
		
		//const super_texture_prop = 'super_texture' + is_transparent_int;
		
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
		
		/*if ( is_transparent_int )
		{
			if ( img.super_texture_prop1 )
			{
				dedication = img.super_texture_prop1;
				super_texture = dedication.super_texture;
			}
			else
			{
				dedication = sdAtlasMaterial.DedicateSpace( img.width, img.height, is_transparent_int );
				img.super_texture_prop1 = dedication;
				super_texture = dedication.super_texture;
				super_texture.ctx.drawImage( img, dedication.x, dedication.y, img.width, img.height );
				super_texture.texture.needsUpdate = true;
			}
		}
		else
		{
			if ( img.super_texture_prop0 )
			{
				dedication = img.super_texture_prop0;
				super_texture = dedication.super_texture;
			}
			else
			{
				dedication = sdAtlasMaterial.DedicateSpace( img.width, img.height, is_transparent_int );
				img.super_texture_prop0 = dedication;
				super_texture = dedication.super_texture;
				super_texture.ctx.drawImage( img, dedication.x, dedication.y, img.width, img.height );
				super_texture.texture.needsUpdate = true;
			}
		}*/
		
		/*if ( img[ super_texture_prop ] )
		{
			dedication = img[ super_texture_prop ];
			super_texture = dedication.super_texture;
		}
		else
		{
			dedication = sdAtlasMaterial.DedicateSpace( img.width, img.height, is_transparent_int );
			img[ super_texture_prop ] = dedication;
			super_texture = dedication.super_texture;
			super_texture.ctx.drawImage( img, dedication.x, dedication.y, img.width, img.height );
			super_texture.texture.needsUpdate = true;
		}*/
		
		dedication.last_time_used = sdWorld.time;
		
		const canvas_size = super_texture.canvas_size_scale_down_vector;//new THREE.Vector2( 1 / super_texture.canvas.width, 1 / super_texture.canvas.height );
		const mat = sdRenderer.ctx._matrix3;//.clone().invert();

		const cr = sdRenderer.ctx.sd_color_mult_r;
		const cg = sdRenderer.ctx.sd_color_mult_g;
		const cb = sdRenderer.ctx.sd_color_mult_b;
		const ca = sdRenderer.ctx.globalAlpha / opacity_div;
		const hue_rotation = sdRenderer.ctx.sd_hue_rotation / 180 * Math.PI;
		
		
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
			
		let z_position = -sdRenderer.ctx.z_offset;
		
		if ( sdRenderer.ctx.object_offset !== null )
		{
			const x = sdRenderer.ctx.object_offset[ 0 ];
			const y = sdRenderer.ctx.object_offset[ 1 ];
			const z = sdRenderer.ctx.object_offset[ 2 ];
			
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

		if ( sdRenderer.ctx.camera_relative_world_scale !== 1 )
		{
			//const cam_xy = new THREE.Vector2( sdRenderer.ctx.camera.position.x, sdRenderer.ctx.camera.position.y );
			const cam_xy = sdAtlasMaterial.cam_xy.set( sdRenderer.ctx.camera.position.x, sdRenderer.ctx.camera.position.y );

			a.sub( cam_xy );
			b.sub( cam_xy );
			c.sub( cam_xy );
			d.sub( cam_xy );

			a.multiplyScalar( sdRenderer.ctx.camera_relative_world_scale );
			b.multiplyScalar( sdRenderer.ctx.camera_relative_world_scale );
			c.multiplyScalar( sdRenderer.ctx.camera_relative_world_scale );
			d.multiplyScalar( sdRenderer.ctx.camera_relative_world_scale );

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
		
		for ( let layer = 0; layer < layers; layer++ )
		{
			let z0 = z_position;
			let z = z0;
			
			if ( layers > 1 )
			{
				z += sdRenderer.ctx.z_depth * layer / ( layers - 1 );
				
				
				
				z -= sdRenderer.ctx.z_depth / 2;
				z0 -= sdRenderer.ctx.z_depth / 2;
			}

			if ( sdRenderer.ctx.camera_relative_world_scale !== 1 )
			{
				let dz = z - sdRenderer.ctx.camera.position.z;

				dz *= sdRenderer.ctx.camera_relative_world_scale;

				z = dz + sdRenderer.ctx.camera.position.z;
			}
			
			if ( connect_layers && layer !== 0 )
			{
				
				// left ( a + c )
				if ( sdRenderer.ctx.box_caps.left )
				if ( sdRenderer.screen_width / 2 < a.x )
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

							cr,cg,cb,ca,hue_rotation
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
				if ( sdRenderer.ctx.box_caps.right )
				if ( sdRenderer.screen_width / 2 > b.x )
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

							cr,cg,cb,ca,hue_rotation
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
				if ( sdRenderer.ctx.box_caps.bottom )
				if ( sdRenderer.screen_height / 2 > c.y )
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

							cr,cg,cb,ca,hue_rotation
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
				if ( sdRenderer.ctx.box_caps.top )
				if ( sdRenderer.screen_height / 2 < a.y )
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

							cr,cg,cb,ca,hue_rotation
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

						cr,cg,cb,ca,hue_rotation
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
	
	constructor()
	{
	}
	
	static FrameStart()
	{
		//sdAtlasMaterial.brightness_map.clear();
		
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