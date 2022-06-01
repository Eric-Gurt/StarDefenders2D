/*

	Better performance by using significantly smaller number of textures, materials geometry, sharing basically. Recycling outdated areas of textures as well.

	TODO: Make logic to swap dedicated spaces between frequently and rarely updated geometries

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
		
		this.ctx = this.canvas.getContext( '2d' );

		this.texture = new THREE.CanvasTexture( this.canvas );
		
		Object.assign( this.texture, {
			canvas: this.canvas,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
			generateMipmaps: false,
			flipY: false
		});
		
		let transparent = ( is_transparent_int === sdAtlasMaterial.GROUP_TRANSPARENT );
		
		this.material_mesh;
		//this.material_dots;
		{
			this.material_mesh = new THREE.ShaderMaterial({

				uniforms:
				{
					tDiffuse: { type: "t", value: this.texture }
				},
				
				side: THREE.DoubleSide,

				depthTest: true,
				//depthFunc: THREE.LessEqualDepth,
				depthWrite: transparent ? false : true,
				//transparent: false, 
				transparent: true,//transparent, 
				flatShading: true,

				vertexShader: `
				
					attribute vec4 color; // From custom attributes
				
					varying vec2 uv_current; // Give it to fragment shader
					varying vec4 color_current; // Give it to fragment shader
				
					void main() 
					{
						uv_current = uv;
				
						color_current.rgba = color.rgba;
				
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
					}
				`,

				fragmentShader: `

					uniform sampler2D tDiffuse;
				
					varying vec2 uv_current; // Take value from vertex shader (for fragment shader-only)
					varying vec4 color_current; // Take value from vertex shader (for fragment shader-only)
					
					void main()
					{
						if ( color_current.a <= 0.0 || texture2D( tDiffuse, uv_current ).a <= 0.0 )
						discard;
				
						//gl_FragColor.rgba = vec4( 1.0, 0.0, 0.0, 1.0 );
						gl_FragColor.rgba = texture2D( tDiffuse, uv_current ).rgba * color_current.rgba;
				
						//gl_FragColor.rgba = vec4( 1.0, 0.0, 0.0, 0.5 );
					}
				`
			});

			if ( false )
			this.material_dots = new THREE.ShaderMaterial({

				uniforms:
				{
					tDiffuse: { type: "t", value: this.texture },
					global_dot_scale: { type: "f", value: 1 },
					
					canvas_w: { type: "f", value: this.canvas.width },
					canvas_h: { type: "f", value: this.canvas.height }
				},

				depthWrite: true,
				transparent: true, 
				flatShading: true,

				vertexShader: `

					uniform float global_dot_scale; // From material.uniform
				
					attribute vec3 dot_scale_and_size; // From custom attributes
					attribute vec2 uv2; // From custom attributes
					attribute float rotation; // From custom attributes

					varying vec2 uv_current; // Give it to fragment shader
					varying vec3 size_current; // Give it to fragment shader
					varying float rotation_current; // Give it to fragment shader
				
					void main() 
					{
						uv_current.xy = uv2.xy;
						size_current = dot_scale_and_size;
						rotation_current = rotation;
				
						gl_PointSize = global_dot_scale * dot_scale_and_size.z;
				
						gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
					}
				`,

				fragmentShader: `

					uniform sampler2D tDiffuse;
				
					varying vec2 uv_current; // Take value from vertex shader (for fragment shader-only)
					varying vec3 size_current; // Take value from vertex shader (for fragment shader-only)
					varying float rotation_current; // Take value from vertex shader (for fragment shader-only)

					uniform float canvas_w; // From material.uniform
					uniform float canvas_h; // From material.uniform
				
					void main()
					{
						// discard;

						vec2 rotated = gl_PointCoord;

						rotated.x -= 0.5;
						rotated.y -= 0.5;
						
						//rotated.x *= size_current.x;
						//rotated.y *= size_current.y;
						
						rotated.x *= size_current.z;
						rotated.y *= size_current.z;
						
						//rotated.x *= 64.0;
						//rotated.y *= 64.0;

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
				
						gl_FragColor.a = 0.1 + gl_FragColor.a * 0.9;
					}
				`
			});
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
		
		sdRenderer.ctx.scene.add( this.mesh );
		//sdRenderer.ctx.scene.add( this.dots );
		
		//this.Preview();
		
		this.mesh.renderOrder = transparent ? 2 : 1;
		
		this.geometry_mesh.last_offset_indices = 0;
		//this.geometry_dots.last_offset_indices = 0;
	}
	
	FrameStart()
	{
		const geometry = this.geometry_mesh;
	
		geometry.offset = 0;
		geometry.offset_indices = 0;
		
		//this.last_vertices.clear();
	}
	FrameEnd( draw )
	{
		const geometry = this.geometry_mesh;
		
		if ( geometry.offset_indices > 0 )
		{
			const last_offset_indices = geometry.last_offset_indices;
			if ( geometry.offset_indices < last_offset_indices )
			{
				//for ( let i = geometry.offset_indices; i < last_offset_indices; i++ )
				//geometry.index_dataView.setUint16( i * 2, 0, true );
			
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
	
	DrawPolygon( x1,y1,z1, x2,y2,z2, x3,y3,z3, u1,v1, u2,v2, u3,v3, r,g,b,a )
	{
		const geometry = this.geometry_mesh;
		
		//this.draws.push( [ x1,y1,z1, x2,y2,z2, x3,y3,z3, u1,v1, u2,v2, u3,v3, r,g,b,a ] );
		
		if ( !geometry.position )
		{
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
		}
		
		if ( geometry.offset + 3 >= sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
		
		if ( geometry.offset_indices + 3 >= 3 * sdAtlasMaterial.maximum_dots_per_super_texture )
		return;
		
		const GetVertex = ( x1,y1,z1, u1,v1 )=>
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
			
			let vertex1 = geometry.offset;
			
			geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 0, x1, true );
			geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 4, y1, true );
			geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 8, z1, true );

			geometry.uv_dataView.setFloat32( geometry.offset * 4 * 2 + 0, u1, true );
			geometry.uv_dataView.setFloat32( geometry.offset * 4 * 2 + 4, v1, true );

			geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 0, r, true );
			geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 4, g, true );
			geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 8, b, true );
			geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 12, a, true );
			
			//this.last_vertices.set( x1 + y1 + u1 + v1, { x:x1, y:y1, z:z1, u:u1, v:v1, r:r,g:g,b:b,a:a, i:vertex1 });

			geometry.offset++;
			
			//sdAtlasMaterial.get_vertex_misses++;
			return vertex1;
		};
	
		let vertex1 = GetVertex( x1,y1,z1, u1,v1 );
		let vertex2 = GetVertex( x2,y2,z2, u2,v2 );
		let vertex3 = GetVertex( x3,y3,z3, u3,v3 );
		//
		/*
		let vertex2 = geometry.offset;
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 0, x2, true );
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 4, y2, true );
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 8, z2, true );
		
		geometry.uv_dataView.setFloat32( geometry.offset * 4 * 2 + 0, u2, true );
		geometry.uv_dataView.setFloat32( geometry.offset * 4 * 2 + 4, v2, true );
		
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 0, r, true );
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 4, g, true );
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 8, b, true );
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 12, a, true );
		
		geometry.offset++;
		//
		
		let vertex3 = geometry.offset;
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 0, x3, true );
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 4, y3, true );
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 8, z3, true );
		
		geometry.uv_dataView.setFloat32( geometry.offset * 4 * 2 + 0, u3, true );
		geometry.uv_dataView.setFloat32( geometry.offset * 4 * 2 + 4, v3, true );
		
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 0, r, true );
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 4, g, true );
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 8, b, true );
		geometry.color_dataView.setFloat32( geometry.offset * 4 * 4 + 12, a, true );
		
		geometry.offset++;
		//
		*/
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, vertex1, true );
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, vertex2, true );
		geometry.index_dataView.setUint16( ( geometry.offset_indices++ ) * 2, vertex3, true );
		
		geometry.position.updateRange.count = geometry.offset * 3;
		geometry.uv.updateRange.count = geometry.offset * 2;
		geometry.color.updateRange.count = geometry.offset * 4;
		geometry.index.updateRange.count = geometry.offset_indices;
		
		geometry.position.needsUpdate = true;
		geometry.uv.needsUpdate = true;
		geometry.color.needsUpdate = true;
		geometry.index.needsUpdate = true;
	}
	/*
	DrawDot( x, y, z, sx, sy, rotation, dedicated_space )
	{
		const geometry = this.geometry_dots;
		
		//const this.geometry_dots.;
		
		
		if ( !geometry.position )
		{
			//geometry.index = geometry.getIndex();
			
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
		}
		
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 0, x, true );
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 4, y, true );
		geometry.position_dataView.setFloat32( geometry.offset * 4 * 3 + 8, z, true );
		
		let size = Math.max( sx, sy ) / Math.sin( Math.PI / 4 );
		
		geometry.dot_scale_and_size_dataView.setFloat32( geometry.offset * 4 * 3 + 0, sx, true ); // x
		geometry.dot_scale_and_size_dataView.setFloat32( geometry.offset * 4 * 3 + 4, sy, true ); // y
		geometry.dot_scale_and_size_dataView.setFloat32( geometry.offset * 4 * 3 + 8, size, true ); // z
		
		geometry.rotation_dataView.setFloat32( geometry.offset * 4 * 1, rotation, true );
		
		geometry.uv2_dataView.setFloat32( geometry.offset * 4 * 2 + 0, ( dedicated_space.x + dedicated_space.w / 2 ) / this.canvas.width, true );
		geometry.uv2_dataView.setFloat32( geometry.offset * 4 * 2 + 4, ( dedicated_space.y + dedicated_space.h / 2 ) / this.canvas.height, true );
		
		
		
		geometry.offset++;
	
		//geometry.index.needsUpdate = true;
		geometry.position.needsUpdate = true;
		geometry.dot_scale_and_size.needsUpdate = true;
		geometry.rotation.needsUpdate = true;
		geometry.uv2.needsUpdate = true;
	}*/
	
	DedicateSpace( w, h )
	{
		if ( w > sdAtlasMaterial.super_texture_width || h > sdAtlasMaterial.super_texture_height )
		throw new Error();
	
		//if ( w > 64 || h > 64 )
		//throw new Error();
	
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
				this.dedications.push( dedication );
				
				this.offset_x += w;
				
				this.max_line_height = Math.max( this.max_line_height, h );
			}
		}
		
		return dedication;
	}
	
	Preview()
	{
		document.body.appendChild( this.canvas );
		this.canvas.style.cssText = `position:fixed;left:0px;top:0px;border:1px solid grey;`;
	}
}

class sdAtlasMaterial
{
	static init_class()
	{
		sdAtlasMaterial.super_texture_width = 1024;
		sdAtlasMaterial.super_texture_height = 1024;
		
		sdAtlasMaterial.maximum_dots_per_super_texture = 65535;//2048;
		
		sdAtlasMaterial.GROUP_OPAQUE = 0;
		sdAtlasMaterial.GROUP_TRANSPARENT = 1;

		sdAtlasMaterial.super_textures = [ [], [] ]; // arr of arr-groups of sdSuperTexture
		
		sdAtlasMaterial.get_vertex_hits = 0;
		sdAtlasMaterial.get_vertex_misses = 0;
		sdAtlasMaterial.get_vertex_cache_length = 1024;
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
	
	//}
	//static DrawSprite( img, x, y, z, sx, sy, rotation, r,g,b,a )
	//{
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
		
		switch ( sdRenderer.ctx.volumetric_mode )
		{
			case FakeCanvasContext.DRAW_IN_3D_FLAT:
			{
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
		}
		
		let super_texture;
		let dedication;
		
		let dedicated_super_texture_space_prop = 'dedicated_super_texture_space' + is_transparent_int;
		
		if ( img[ dedicated_super_texture_space_prop ] )
		{
			dedication = img[ dedicated_super_texture_space_prop ];
			
			super_texture = dedication.super_texture;
		}
		else
		{
			dedication = sdAtlasMaterial.DedicateSpace( img.width, img.height, is_transparent_int );
			
			img[ dedicated_super_texture_space_prop ] = dedication;
			
			super_texture = dedication.super_texture;
			
			super_texture.ctx.drawImage( img, dedication.x, dedication.y, img.width, img.height );
			
			super_texture.texture.needsUpdate = true;
		}
		
		img[ dedicated_super_texture_space_prop ].last_time_used = sdWorld.time;
		
		const canvas_size = new THREE.Vector2( 1 / super_texture.canvas.width, 1 / super_texture.canvas.height );
		const mat = sdRenderer.ctx._matrix3;//.clone().invert();

		const cr = 1;
		const cg = 1;
		const cb = 1;
		const ca = sdRenderer.ctx.globalAlpha;

		const a = new THREE.Vector2( dx, dy ); // Left-top
		const b = new THREE.Vector2( dx + dWidth, dy ); // Right-top
		const c = new THREE.Vector2( dx, dy + dHeight ); // Left-bottom
		const d = new THREE.Vector2( dx + dWidth, dy + dHeight ); // Right-bottom
		
		if ( top_x_offset !== 0 )
		{
			a.x += top_x_offset;
			b.x += top_x_offset;
		}

		a.applyMatrix3( mat );
		b.applyMatrix3( mat );
		c.applyMatrix3( mat );
		d.applyMatrix3( mat );

		if ( sdRenderer.ctx.camera_relative_world_scale !== 1 )
		{
			const cam_xy = new THREE.Vector2( sdRenderer.ctx.camera.position.x, sdRenderer.ctx.camera.position.y );

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

		let uv_a = new THREE.Vector2( sx, sy ); // Left-top
		let uv_b = new THREE.Vector2( sx + sWidth, sy ); // Right-top
		let uv_c = new THREE.Vector2( sx, sy + sHeight ); // Left-bottom
		let uv_d = new THREE.Vector2( sx + sWidth, sy + sHeight ); // Right-bottom

		uv_a.multiply( canvas_size );
		uv_b.multiply( canvas_size );
		uv_c.multiply( canvas_size );
		uv_d.multiply( canvas_size );

		for ( let layer = 0; layer < layers; layer++ )
		{
			let z = -sdRenderer.ctx.z_offset;
			let z0 = z;
			
			if ( layers > 1 )
			z += sdRenderer.ctx.z_depth * layer / ( layers - 1 );

			if ( sdRenderer.ctx.camera_relative_world_scale !== 1 )
			{
				let dz = z - sdRenderer.ctx.camera.position.z;

				dz *= sdRenderer.ctx.camera_relative_world_scale;

				z = dz + sdRenderer.ctx.camera.position.z;
			}
			
			if ( connect_layers && layer !== 0 )
			{
				// left ( a + c )
				if ( sdRenderer.screen_width / 2 < a.x )
				{
					super_texture.DrawPolygon( 
							a.x, a.y, z0,
							a.x, a.y, z,
							c.x, c.y, z0,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
					super_texture.DrawPolygon( 
							a.x, a.y, z,
							c.x, c.y, z,
							c.x, c.y, z0,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
				}
		
				// right ( b + d )
				if ( sdRenderer.screen_width / 2 > b.x )
				{
					super_texture.DrawPolygon( 
							b.x, b.y, z0,
							b.x, b.y, z,
							d.x, d.y, z0,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
					super_texture.DrawPolygon( 
							b.x, b.y, z,
							d.x, d.y, z,
							d.x, d.y, z0,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
				}
		
				// bottom ( c + d )
				if ( sdRenderer.screen_height / 2 > c.y )
				{
					super_texture.DrawPolygon( 
							c.x, c.y, z0,
							d.x, d.y, z0,
							c.x, c.y, z,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
					super_texture.DrawPolygon( 
							d.x, d.y, z0,
							d.x, d.y, z,
							c.x, c.y, z,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
				}
		
				// top ( a + b )
				if ( sdRenderer.screen_height / 2 < a.y )
				{
					super_texture.DrawPolygon( 
							a.x, a.y, z,
							b.x, b.y, z,
							a.x, a.y, z0,

							uv_a.x, uv_a.y,
							uv_b.x, uv_b.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
					super_texture.DrawPolygon( 
							b.x, b.y, z,
							b.x, b.y, z0,
							a.x, a.y, z0,

							uv_b.x, uv_b.y,
							uv_d.x, uv_d.y,
							uv_c.x, uv_c.y,

							cr,cg,cb,ca
					);
				}
			}
			else
			{
				// cap
				
				const current_odd_x_offset = ( layer % 2 === 0 ) ? -odd_x_offset : odd_x_offset;
				
				super_texture.DrawPolygon( 
						a.x + current_odd_x_offset, a.y, z,
						b.x + current_odd_x_offset, b.y, z,
						c.x + current_odd_x_offset, c.y, z,

						uv_a.x, uv_a.y,
						uv_b.x, uv_b.y,
						uv_c.x, uv_c.y,

						cr,cg,cb,ca
				);
				super_texture.DrawPolygon( 
						b.x + current_odd_x_offset, b.y, z,
						d.x + current_odd_x_offset, d.y, z,
						c.x + current_odd_x_offset, c.y, z,

						uv_b.x, uv_b.y,
						uv_d.x, uv_d.y,
						uv_c.x, uv_c.y,

						cr,cg,cb,ca
				);
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
		//super_texture.DrawDot( x, y, z, sx, sy, rotation, img.dedicated_super_texture_space );
	}
	
	constructor()
	{
	}
	
	static FrameStart()
	{
		for ( let g = 0; g < 2; g++ )
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
		for ( let g = 0; g < 2; g++ )
		for ( let i = 0; i < sdAtlasMaterial.super_textures[ g ].length; i++ )
		sdAtlasMaterial.super_textures[ g ][ i ].FrameEnd( true );
	}
}

export default sdAtlasMaterial;