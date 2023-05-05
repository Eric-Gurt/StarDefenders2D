
/* global THREE */

// FakeCanvasContext by Eric Gurt (C) 2021, made possible thanks to to THREE.JS 

class FakeCanvasContext
{
	static init_class()
	{	
		FakeCanvasContext.DRAW_IN_3D_FLAT = 0;
		FakeCanvasContext.DRAW_IN_3D_BOX = 1;
		FakeCanvasContext.DRAW_IN_3D_LIQUID = 2;
		FakeCanvasContext.DRAW_IN_3D_GRASS = 3;
		FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT = 4;
		FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT = 5;
		FakeCanvasContext.DRAW_IN_3D_BOX_DECAL = 6;
		
		FakeCanvasContext.LIQUID_OPACITY_STEPS = 5;
		FakeCanvasContext.GRASS_OPACITY_STEPS = 4;
	}

	/*set filter( v )
	{
		if ( this._filter !== v )
		{
			if ( sdRenderer.visual_settings === 4 )
			{
				this.sd_hue_rotation = 0;

				let parts = v.split( ')' );

				for ( let i = 0; i < parts.length; i++ )
				{
					let part = parts[ i ];
					part = part.trim();
					
					if ( part.length > 0 )
					{
						let parts2 = part.split( '(' );

						let func_name = parts2[ 0 ];
						let value_str = parts2[ 1 ];

						let keep = true;

						if ( func_name === 'hue-rotate' )
						{
							this.sd_hue_rotation = parseFloat( value_str );
							keep = false;
						}

						if ( keep )
						{
							if ( part[ part.length - 1 ] !== ')' )
							part += ')';
						}
						else
						part = '';

						parts[ i ] = part;
					}
				}

				this._filter = parts.join('');
			}
			else
			this._filter = v;
		}
	}
	get filter( )
	{
		return this._filter;
	}*/
	constructor( old_canvas )
	{
		this.camera = null;
		this.scene = null;
		this.renderer = null;
		
		this.apply_shading = false;
		
		this.draws = []; // arr of Mesh
		this.sold_meshes = new Map(); // map[ mat ] of maps[ geom ] of meshes that are not needed and can potentially be reused in next frame
		
		const texture = new THREE.TextureLoader().load( "assets/bg.png" );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		//texture.repeat.set( 4, 4 );
		
		this.texture_cache = new Map();
		this.texture_cache_keys = []; // Just keys, for GC looping
		
		this.matrix_reusable = new THREE.Matrix4();
		
		let geometry_plane = new THREE.PlaneGeometry( 1, 1 );
			geometry_plane.scale( 1, 1, 1 );
			geometry_plane.translate( 0.5, 0.5, 0 );

			
		
		let geometry_box = new THREE.BoxGeometry( 1, 1, 1 );
			geometry_box.scale( 1, 1, 1 );
			geometry_box.translate( 0.5, 0.5, 0 );
		
		let uv = geometry_box.getAttribute( 'uv' ).array;
		for ( let i = 0; i < uv.length; i += 2 ) {
			uv[ i ] = 1 - uv[ i ];
		}
			
		let arr = [];
		for ( let i = 0; i < FakeCanvasContext.LIQUID_OPACITY_STEPS; i++ )
		{
			let geometry_liquid1 = new THREE.PlaneGeometry( 1, 1 );
				geometry_liquid1.scale( 1, 1, 1 );
				//geometry_liquid1.translate( 0.5, 0.5, ( -0.5 + i / ( FakeCanvasContext.LIQUID_OPACITY_STEPS - 1 ) ) * 0.99 );
				geometry_liquid1.translate( 0.5, 0.5, -( -0.5 + i / ( FakeCanvasContext.LIQUID_OPACITY_STEPS - 1 ) ) * 0.99 );

			arr.push( geometry_liquid1 );
		}
		let geometry_liquid = THREE.BufferGeometryUtils.mergeBufferGeometries( arr, false );
		
		arr = [];
		for ( let i = 0; i < FakeCanvasContext.GRASS_OPACITY_STEPS; i++ )
		{
			let geometry_grass1 = new THREE.PlaneGeometry( 1, 1 );
				geometry_grass1.scale( 1, 1, 1 );
				geometry_grass1.translate( 0.5 + ( i % 2 === 0 ? -0.1 : 0.1 ), 0.5, -( -0.5 + i / ( FakeCanvasContext.GRASS_OPACITY_STEPS - 1 ) ) * 0.99 );

			arr.push( geometry_grass1 );
		}
		let geometry_grass = THREE.BufferGeometryUtils.mergeBufferGeometries( arr, false );
		
		let indices_to_animate = [];
		let value0 = [];
		for ( let i = 0; i < geometry_grass.attributes.position.array.length; i += 3 )
		{
			if ( geometry_grass.attributes.position.array[ i + 1 ] < 0.5 )
			{
				indices_to_animate.push( i );
				value0.push( geometry_grass.attributes.position.array[ i ] );
			}
		}
		
		let t = 0;
		// Grass animation
		setInterval( ()=>
		{
			t += Math.PI / 4;
			let dx = Math.sin( t ) * 0.1;
			for ( let i = 0; i < indices_to_animate.length; i++ )
			geometry_grass.attributes.position.array[ indices_to_animate[ i ] ] = value0[ i ] + dx;
			
			//geometry_grass.attributes.position.updateRange.offset = 0;
	        //geometry_grass.attributes.position.updateRange.count = geometry_grass.attributes.position.array.length;
			geometry_grass.attributes.position.needsUpdate = true;
			
		}, 300 );
		
		this.geometries_by_draw_in = [ 
			geometry_plane, 
			geometry_box, 
			geometry_liquid, 
			geometry_grass, 
			geometry_box,
			geometry_plane
		];
		
		
		let geometry, material, mesh;

		this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 400, 1000 );
		
		this.camera.position.z = -811;
		this.camera.rotation.x = Math.PI;
		this.camera.far = 2000;
		this.camera.near = 1;
		this.camera.updateProjectionMatrix();

		this.scene = new THREE.Scene();


		this.renderer = new THREE.WebGLRenderer( { antialias: false, canvas: old_canvas } );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		
		this.renderer.debug.checkShaderErrors = false; // Costs performance
		
		this.renderer.setClearColor( new THREE.Color( 0x330000 ), 1 );
		
		this.renderer.sortObjects = false;
		
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		//this.renderer.shadowMap.type = THREE.PCFShadowMap;
		
		//this.renderer.physicallyCorrectLights = true;
		
		const alight = new THREE.AmbientLight( 0xffffff, 0.7 ); // 0.5
		this.scene.add( alight );

		this.sky = alight;
		//for ( var x = 0; x < 1; x++ )
		{
			//Create a PointLight and turn on shadows for the light
			/*const light = new THREE.PointLight( 0xffffff, 1, 0, 2 );
			this.scene.add( light );*/
			
			const light = new THREE.DirectionalLight( 0xffffff, 1 ); // 1
			light.position.set( window.innerWidth / 2, 0, -300 );
			light.target.position.set( window.innerWidth / 2, window.innerHeight, 0 );
			light.castShadow = true; // default false
			this.scene.add( light );
			this.scene.add( light.target );

			//Set up shadow properties for the light
			light.shadow.mapSize.width = 1024;
			light.shadow.mapSize.height = 512; 
			light.shadow.camera.near = 0.5;
			light.shadow.camera.far = 3000;
			//light.distance = 3000;
			//light.intensity = 1;
			light.shadow.bias = -0.01;
			
			light.shadow.camera.left = -1300;
			light.shadow.camera.right = 1300;
			light.shadow.camera.bottom = -1300;
			light.shadow.camera.top = 1300;
			light.shadow.camera.updateProjectionMatrix();
			
			this.sun = light;
		}
		
		//Create a helper for the shadow camera (optional)
		//const helper = new THREE.CameraHelper( light.shadow.camera );
		//this.scene.add( helper );
		/*
		const light = new THREE.DirectionalLight( 0xffffff, 1 );
		light.position.set( window.innerWidth / 2, window.innerWidth / 2 - 1000, 0 ); //default; light shining from top
		//light.rotation.set( 0,0,0 );,
		
		light.target.position.set( window.innerWidth / 2, window.innerWidth / 2, 0 );
		light.target.updateMatrixWorld();
		
		light.castShadow = true; // default false
		light.shadow.mapSize.width = 2048; // default
		light.shadow.mapSize.height = 2048; // default
		light.shadow.camera.near = 100; // default
		light.shadow.camera.far = 2000; // default
		light.shadow.camera.left = -500;
		light.shadow.camera.bottom = -500;
		light.shadow.camera.right = 500;
		light.shadow.camera.top = 500;
		light.shadow.bias = 0.1;
		//light.shadow.camera.lookAt( window.innerWidth / 2, window.innerWidth / 2, 0 );
		this.scene.add( light );
		const helper = new THREE.CameraHelper( light.shadow.camera );
		this.scene.add( helper );*/
		
		this.transform = new THREE.Matrix4();
		this.save_stack = [];
		//this.matrix3_stack = [];
		
		this.z_offset = 0;
		this.z_depth = 0;
		this.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT;
		this.draw_offset = 0; // order of rendering
		this.object_offset = null; // Array of x, y and z offset for model
		this.camera_relative_world_scale = 1;
		
		this.globalAlpha = 1;
		this.sd_hue_rotation = 0;
		this.filter = 'none';
		this.sd_color_mult_r = 1;
		this.sd_color_mult_g = 1;
		this.sd_color_mult_b = 1;
		
		this.line_dash_arr = [];
		this.lineDashOffset = 0;
		
		this.frame = 0;
		this.gc_loopie = 0;
		
		
		let canvas_text_measure = document.createElement('canvas');
		canvas_text_measure.width = 1;
		canvas_text_measure.height = 1;
		this.ctx_text_measure = canvas_text_measure.getContext("2d");
		
		// Shape stuff
		this.current_shape = null;
		this.shapes = null;
		
		this.debug_new = false;
		
		this.graphics_complain_skips = 30;
		this.graphics_complain_spoken = false;
		
		this._stroke_ptr = {};
		
		this.blend_mode = THREE.NormalBlending;
		
		this.box_caps = {
			top: true,
			left: true,
			bottom: true,
			right: true,
			is_rotated: false // Disables camera-relative optimizations
		};

		this._gl = this.renderer.getContext();
		this._debugInfo = this._gl.getExtension('WEBGL_debug_renderer_info');
		this._renderer = this._debugInfo ? this._gl.getParameter( this._debugInfo.UNMASKED_RENDERER_WEBGL ) : null;
		this._vendor = this._debugInfo ? this._gl.getParameter( this._debugInfo.UNMASKED_VENDOR_WEBGL ) : null;
		
		this._matrix3 = new THREE.Matrix3();
		
		this.imageSmoothingEnabled = false;
		this.fillStyle = '#000000';
		this.font = '14px Verdana';
		this.textAlign = 'left';
		this.lineWidth = 1;
		this.strokeStyle = '#000000';
		
		this.hue_rotate = 0;
		
		this.reusable_matrix3 = new THREE.Matrix3();
		
		sdRenderer.AddCacheDrawMethod( this );
		
		Object.seal( this );
	}
	
	
	RequireMaterial( image, source_x, source_y, source_w, source_h, volumetric_mode, opacity, quality_scale=1 )
	{
		/*
			Debugging in console:
		
			this.texture_cache.forEach((a,b)=>{
			if ( Object.keys( a ).length > 50 )
			console.log( a );
			});
		
		*/
		let r = null;
		
		const opacity_steps = 50;
		
		opacity = Math.max( 0, Math.min( opacity_steps, Math.round( opacity * opacity_steps ) ) );
		
		if ( image === this._stroke_ptr )
		{
			if ( this.line_dash_arr.length === 0 )
			{
				quality_scale = 1;
			}
			else
			{
				quality_scale = Math.round( quality_scale * 1000 ) / 1000;
			}
			source_y = Math.round( source_y * 1000 ) / 1000;
		}
		else
		{
			quality_scale = Math.round( quality_scale * 100 ) / 100;
		}
		
		let crop_hash = source_x+'/'+source_y+'/'+source_w+'/'+(source_h||'')+'/'+volumetric_mode+'/'+opacity+'/'+quality_scale;
		
		let image_specific_hash_keeper;// = null;
		
		image_specific_hash_keeper = this.texture_cache.get( image );

		//if ( !this.texture_cache.has( image ) )
		if ( image_specific_hash_keeper === undefined )
		{
			/*image_specific_hash_keeper = {
				_last_used: this.frame
			};*/
			
			image_specific_hash_keeper = new Map();
			image_specific_hash_keeper._last_used = this.frame;
			
			this.texture_cache.set( image, image_specific_hash_keeper );
			this.texture_cache_keys.push( image );
		}
		else
		{
			//image_specific_hash_keeper = this.texture_cache.get( image );
			image_specific_hash_keeper._last_used = this.frame;
		}
	
		r = image_specific_hash_keeper.get( crop_hash );
		
		/*if ( typeof image_specific_hash_keeper[ crop_hash ] !== 'undefined' )
		{
			r = image_specific_hash_keeper[ crop_hash ];
		}
		else*/
		if ( r === undefined )
		{
			if ( image === this._stroke_ptr )
			{
				let strokeStyle = source_x;
				let lineWidth = source_y;
				let line_dash_arr0 = source_w;
				let line_dash_arr1 = source_h;
				let scale = quality_scale;
				
				r = 
                    ( this.line_dash_arr.length === 0 ) ?
                    
					new MeshLineMaterial({
						color: new THREE.Color( strokeStyle ),
						lineWidth: lineWidth,
						sizeAttenuation: true
					})
					:
					new MeshLineMaterial({
						dashArray: line_dash_arr0 * scale,
						dashRatio: line_dash_arr0 / ( line_dash_arr0 + line_dash_arr1 ),
						alphaTest: 0.5,
						color: new THREE.Color( strokeStyle ),
						dashOffset: this.lineDashOffset * scale,
						lineWidth: lineWidth,
						sizeAttenuation: true,
						transparent: true
					});
				
				/*r = 
					( line_dash_arr0 === undefined ) ?
					new THREE.LineBasicMaterial( { color: strokeStyle, linewidth: lineWidth } ) :
					new THREE.LineDashedMaterial( { color: strokeStyle, linewidth: lineWidth, dashSize:line_dash_arr0, gapSize:line_dash_arr1 } );*/
			}
			else
			if ( typeof source_x === 'string' ) // text?
			{
				let text = image;
				let font = source_x;
				let textAlign = source_y;
				let fillStyle = source_w;
				let max_width = source_h;
				
				let canvas = document.createElement('canvas');
				
				let ctx2 = canvas.getContext("2d");
				ctx2.font = font;
				ctx2.textAlign = 'left';
				ctx2.fillStyle = fillStyle;
				
				//console.log('String ', [text,font,textAlign,fillStyle]);
				
				const scale = quality_scale;
				
				canvas.width = Math.ceil( Math.min( max_width || Infinity, ctx2.measureText( text ).width ) * scale );
				canvas.height = Math.ceil( 32 * scale );

				//ctx2.fillStyle = '#ffffff';
				//ctx2.fillRect(0,0,canvas.width,1);
				
				ctx2.scale( scale, scale );
				
				ctx2.font = font;
				ctx2.textAlign = 'left';
				ctx2.fillStyle = fillStyle;
				ctx2.fillText( text, 0, canvas.height / 2 / scale, max_width );
				
				let t = new THREE.Texture( canvas );
				t.needsUpdate = true;
				t.magFilter = t.minFilter = THREE.NearestFilter;
				t.generateMipmaps = false;
				t.flipY = false;
				
				r = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: t });
				
				r.userData.width = canvas.width / scale;
				r.userData.height = canvas.height / scale;
				r.userData.textAlign = textAlign;
			}
			else
			if ( typeof image === 'string' ) // color?
			{
				r = new THREE.MeshBasicMaterial({ color: image, side: THREE.DoubleSide });
			}
			else
			if ( typeof image.isLinearGradient !== 'undefined' ) // gradient?
			{
				let canvas = document.createElement('canvas');
				canvas.width  = Math.max( 1, Math.max( image.x0, image.x1 ) );
				canvas.height = Math.max( 1, Math.max( image.y0, image.y1 ) );

				let ctx2 = canvas.getContext("2d");
				let gr = ctx2.createLinearGradient( image.x0, image.y0, image.x1, image.y1 ); // Could be improved
				for ( let i = 0; i < image.stops.length; i++ )
				gr.addColorStop( image.stops[ i ][ 0 ], image.stops[ i ][ 1 ] );
			
				ctx2.fillStyle = gr;
				ctx2.fillRect( 0, 0, canvas.width, canvas.height );
				
				let t = new THREE.Texture( canvas );
				t.needsUpdate = true;
				t.magFilter = t.minFilter = THREE.NearestFilter;
				t.generateMipmaps = false;
				t.flipY = false;
				
				r = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: t });
			}
			else
			{
				let t = new THREE.Texture( image );
				t.needsUpdate = true;
				t.magFilter = t.minFilter = THREE.NearestFilter;
				t.generateMipmaps = false;
				t.flipY = false;
				
				t.repeat.x = source_w / image.width;
				t.repeat.y = source_h / image.height;
				t.offset.x = source_x / image.width;
				t.offset.y = source_y / image.height;
				
				if ( this.draw_offset === 0 && this.camera_relative_world_scale === 1 && sdRenderer._visual_settings === 3 )
				{
					//r = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: t }); Accurate when it comes to lights and pretty slow
					r = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: t });
				}
				else
				r = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, map: t });
			
				//r = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.FrontSide, map: t });
				
				if ( image.expand )
				{
					r.polygonOffset = true;
					r.polygonOffsetUnits = -1;
				}
			}
			
			r.blending = this.blend_mode;
			
			if ( volumetric_mode === FakeCanvasContext.DRAW_IN_3D_BOX )
			{
				r.depthTest = true;
				r.depthWrite = true;
				r.transparent = false; // Binary transparency is good enough
				r.alphaTest = 0.01;
			}
			else
			{
				r.depthTest = true;
				r.depthWrite = false;
				r.transparent = true;
				r.alphaTest = 0.01;
				
				
				if ( volumetric_mode === FakeCanvasContext.DRAW_IN_3D_FLAT )
				{
					r.userData.customDepthMaterial = new THREE.MeshDepthMaterial( {

						depthPacking: THREE.RGBADepthPacking,

						map: r.map,

						alphaTest: 0.5

					} );
				}
			}
			
			r.opacity = opacity / opacity_steps;
			
			if ( volumetric_mode === FakeCanvasContext.DRAW_IN_3D_LIQUID )
			{
				r.depthWrite = false;
				r.opacity /= 5;
			}
			else
			if ( volumetric_mode === FakeCanvasContext.DRAW_IN_3D_GRASS )
			{
				if ( r.opacity >= 1 )
				{
					r.depthWrite = true;
					r.depthTest = true;
					r.transparency = false;
				}
			}
			
			
			//image_specific_hash_keeper[ crop_hash ] = r;
			image_specific_hash_keeper.set( crop_hash, r );
			
			//if ( this.debug_new )
			//console.warn( 'New crop_hash: ', image, crop_hash );
		}
		
		return r;
	}
	
	createLinearGradient( x0, y0, x1, y1 )
	{
		let obj = 
		{
			isLinearGradient: true,
			x0: x0, 
			y0: y0, 
			x1: x1, 
			y1: y1,
			stops: [],
			addColorStop: ( pos, color )=>
			{
				obj.stops.push([ pos, color ]);
			}
		};
		return  obj;
	}
	
	GetDrawOffset()
	{
		//this.draw_offset += 0.000001; // Bad, door will appear on top of players who near it then
		return this.draw_offset;
	}
	
	drawTriangle( ...args ) // ( x,y, x2,y2, x3,y3, r,g,b, a,a2,a3 )
	{
		sdAtlasMaterial.drawTriangle( ...args );
	}
	
	fillRect( destination_x, destination_y, destination_w, destination_h )
	{
		if ( sdRenderer.visual_settings === 4 )
		{
			let img = sdAtlasMaterial.white_pixel;
			
			//this.fillStyle;
			
			if ( this.fillStyle.isLinearGradient )
			{
				img = this.fillStyle.cached_canvas;
				
				if ( !img )
				{
					img = this.fillStyle.cached_canvas = sdAtlasMaterial.CreateLinearGradientImage( this.fillStyle );
				}
			}
			else
			{
				img = sdAtlasMaterial.white_pixel;
				
				let rgb_or_null = sdWorld.hexToRgb( this.fillStyle );
				
				if ( rgb_or_null === null )
				{
					debugger;
					return;
				}
				
				this.sd_color_mult_r = rgb_or_null[ 0 ] / 255;
				this.sd_color_mult_g = rgb_or_null[ 1 ] / 255;
				this.sd_color_mult_b = rgb_or_null[ 2 ] / 255;
			}
			
			let old_mode = this.volumetric_mode;
			
			if ( this.globalAlpha < 1 )
			{
				if ( this.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_FLAT )
				this.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT;
			}
			
			// ctx0.sd_tint_filter[0]*ctx0.sd_status_effect_tint_filter[0]
			if ( this.sd_tint_filter )
			{
				this.sd_color_mult_r *= this.sd_tint_filter[ 0 ];
				this.sd_color_mult_g *= this.sd_tint_filter[ 1 ];
				this.sd_color_mult_b *= this.sd_tint_filter[ 2 ];
			}
			if ( this.sd_status_effect_tint_filter )
			{
				this.sd_color_mult_r *= this.sd_status_effect_tint_filter[ 0 ];
				this.sd_color_mult_g *= this.sd_status_effect_tint_filter[ 1 ];
				this.sd_color_mult_b *= this.sd_status_effect_tint_filter[ 2 ];
			}
			
			
			sdAtlasMaterial.drawImage( img, 0, 0, 1, 1, destination_x, destination_y, destination_w, destination_h );
			
			this.volumetric_mode = old_mode;
			this.sd_color_mult_r = 1;
			this.sd_color_mult_g = 1;
			this.sd_color_mult_b = 1;
			return;
		}
	
		let m = this.RequireMesh( this.geometries_by_draw_in[ this.volumetric_mode ], this.RequireMaterial( this.fillStyle, 0, 0, 32, 32, this.volumetric_mode, this.globalAlpha ) );
		
		this.DrawObject( m, destination_x, destination_y, destination_w, destination_h );
	}
	translate( x, y )
	{
		if ( sdRenderer.visual_settings === 4 )
		{
			let m = this.reusable_matrix3;
			m.identity();
			
			//x = Math.round( x * 100 ) / 100;
			//y = Math.round( y * 100 ) / 100;
			
			m.translate( x, y );
			
			this._matrix3.multiply( m );
		}
		else
		this.transform.multiply( new THREE.Matrix4().makeTranslation( x, y, 0 ) );
	}
	scale( x, y )
	{
		if ( sdRenderer.visual_settings === 4 )
		{
			let m = this.reusable_matrix3;
			m.identity();
			
			//x = Math.round( x * 100 ) / 100;
			//y = Math.round( y * 100 ) / 100;
			
			m.scale( x, y );
			
			this._matrix3.multiply( m );
		}
		else
		this.transform.multiply( new THREE.Matrix4().makeScale( x, y, 1 ) );
	}
	rotate( a )
	{
		if ( sdRenderer.visual_settings === 4 )
		{
			let m = this.reusable_matrix3;
			m.identity();
			
			//a = Math.round( a * 10000 ) / 10000;
			
			m.rotate( -a );
			
			this._matrix3.multiply( m );
		}
		else
		this.transform.multiply( new THREE.Matrix4().makeRotationZ( a ) );
	}
	save()
	{
		if ( sdRenderer.visual_settings === 4 )
		{
			this.save_stack.push( [ this._matrix3.clone(), this.globalAlpha, this.apply_shading ] );
		}
		else
		this.save_stack.push( [ this.transform.clone(), this.globalAlpha, this.apply_shading ] );
	}
	restore()
	{
		let save = this.save_stack.pop();
		
		if ( sdRenderer.visual_settings === 4 )
		this._matrix3 = save[ 0 ];
		else
		this.transform = save[ 0 ];
	
		this.globalAlpha = save[ 1 ];
	
		this.apply_shading = save[ 2 ];
	}
	resetTransform()
	{
		this.save_stack.length = 0;
		
		if ( sdRenderer.visual_settings === 4 )
		this._matrix3.identity();
		else
		this.transform.identity();
	}
	fillText( text, x, y, max_width=undefined )
	{	
		if ( sdRenderer.visual_settings === 4 )
		{
			text += '';
			
			let max_width_x = x + max_width;
			
			let size = parseFloat( this.font.split( ' ', 1 )[ 0 ] ) / sdAtlasMaterial.global_font_scale;
			
			y -= sdAtlasMaterial.global_font_offset_y * size;
			
			if ( this.textAlign === 'center' )
			x -= this.measureText( text, false ).width / 2 * size;
			else
			if ( this.textAlign === 'right' )
			x -= this.measureText( text, false ).width * size;
	
			let rgb_or_null = sdWorld.hexToRgb( this.fillStyle );

			if ( rgb_or_null === null )
			{
				debugger;
				return;
			}

			this.sd_color_mult_r = rgb_or_null[ 0 ] / 255;
			this.sd_color_mult_g = rgb_or_null[ 1 ] / 255;
			this.sd_color_mult_b = rgb_or_null[ 2 ] / 255;
			
			let old_mode = this.volumetric_mode;
			
			if ( this.globalAlpha < 1 )
			{
				if ( this.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_FLAT )
				this.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT;
			}
			
			let scale_x = 1;
			/*let scroll_x = 0;
			
			if ( x + (text.length+1) * 7 * size > max_width_x )
			{
				scroll_x = sdWorld.time % 
			}*/
			if ( x + (text.length+1) * 7 * size > max_width_x )
			{
				//x + (text.length+1) * 7 * size * scale_x = max_width_x;
				//(text.length+1) * 7 * size * scale_x = max_width_x - x;
				scale_x = ( max_width_x - x ) / ( (text.length+1) * 7 * size );
			}
			
			const character_images = sdAtlasMaterial.character_images;
			const drawImage = sdAtlasMaterial.drawImage;
			
			for ( let i = 0; i < text.length; i++ )
			{
				let char = text.charCodeAt( i );
				
				let img = character_images.get( char );
				
				if ( !img )
				{
					character_images.set( char, img = sdAtlasMaterial.CreateImageForCharacter( char ) );
				}
				
				/*if ( x + (i+1) * 7 * size > max_width_x )
				{
					break;
				}*/
				
				if ( img )
				drawImage( img, 0, 0, 7, 13, x + i * 7 * size * scale_x, y, 7 * size, 13 * size );
				//sdAtlasMaterial.drawImage( img, 0, 0, 7, 13, x + i * 7 * size * scale_x, y, 7 * size, 13 * size );
			}
			
			this.volumetric_mode = old_mode;
			this.sd_color_mult_r = 1;
			this.sd_color_mult_g = 1;
			this.sd_color_mult_b = 1;
			return;
		}
	
		let mat = this.RequireMaterial( text, this.font, this.textAlign, this.fillStyle, max_width, FakeCanvasContext.DRAW_IN_3D_FLAT, this.globalAlpha, 1 * this.transform.elements[ 5 ] );
		
		let m = this.RequireMesh( this.geometries_by_draw_in[ FakeCanvasContext.DRAW_IN_3D_FLAT ], mat );
		
		if ( mat.userData.textAlign === 'left' )
		this.DrawObject( m, x, y - mat.userData.height / 2, mat.userData.width, mat.userData.height );
		else
		if ( mat.userData.textAlign === 'center' )
		this.DrawObject( m, x - mat.userData.width / 2, y - mat.userData.height / 2, mat.userData.width, mat.userData.height );
		else
		if ( mat.userData.textAlign === 'right' )
		this.DrawObject( m, x - mat.userData.width, y - mat.userData.height / 2, mat.userData.width, mat.userData.height );
	}
	measureText( text, scaled=true )
	{
		if ( sdRenderer.visual_settings === 4 )
		{
			let size = scaled ? parseFloat( this.font.split( ' ', 1 )[ 0 ] ) / sdAtlasMaterial.global_font_scale : 1;
			
			return { width: text.length * 7 * size };
		}
		this.ctx_text_measure.font = this.font;
		
		return this.ctx_text_measure.measureText( text );
	}
	
	RequireMesh( geom, mat )
	{
		let r = null;
		
		if ( this.sold_meshes.has( mat ) )
		{
			let map_of_geom_arrays = this.sold_meshes.get( mat );
			
			if ( map_of_geom_arrays.has( geom ) )
			{
				let arr_of_geoms = map_of_geom_arrays.get( geom );
				
				//if ( arr_of_geoms.length > 0 )
				//{
					r = arr_of_geoms.shift();
					
					if ( arr_of_geoms.length === 0 )
					{
						if ( map_of_geom_arrays.size === 1 )
						{
							this.sold_meshes.delete( mat );
						}
						else
						{
							map_of_geom_arrays.delete( geom );

							if ( map_of_geom_arrays.size === 0 )
							this.sold_meshes.delete( mat );
						}
					}

				//}
			}
		}
		
		/*for ( var i = 0; i < this.sold_meshes.length; i++ )
		{
			var d = this.sold_meshes[ i ];
			
			if ( d.material === mat )
			if ( d.geometry === geom )
			{
				this.sold_meshes.splice( i, 1 );
				return d;
			}
		}*/
		
		if ( r )
		return r;
	
		return new THREE.Mesh( geom, mat );
	}
	
	DrawLamp( x, y ) // World coordinates
	{
		//this.lamps.push( { x:x, y:y, color:'#ffffff' } );
		// Too slow
		/*let m;

		//let m = new THREE.PointLight( 0xffffff, 1, 0, 1 );
		m = new THREE.SpotLight( 0xffffff, 10, 1000, Math.PI / 2 * 0.6, 1 );
		m.add( m.target );
		m.target.position.z = 100;    

        //m.castShadow = false;
        //m.shadow.camera.far = 100;
		//m.shadow.camera.near = 0.01;
		//m.shadow.bias = 0.02;
		m.shadow.normalBias = 3;

		//m.shadow.camera.updateProjectionMatrix();



		this.z_offset += 64;

		this.DrawObject( m, destination_x, destination_y, 1, 1 );

		this.z_offset -= 64;*/
	}
	
	drawImage( image, ...args )
	{
		if ( image.loaded === false )
		return;
		
		let source_x = 0;
		let source_y = 0;
		let source_w = image.width;
		let source_h = image.height;
		
		let destination_x = 0;
		let destination_y = 0;
		let destination_w = image.width;
		let destination_h = image.height;
		
		if ( args.length === 8 )
		{
			source_x = args[ 0 ];
			source_y = args[ 1 ];
			source_w = args[ 2 ];
			source_h = args[ 3 ];
			
			destination_x = args[ 4 ];
			destination_y = args[ 5 ];
			destination_w = args[ 6 ];
			destination_h = args[ 7 ];
		}
		else
		if ( args.length === 4 )
		{
			destination_x = args[ 0 ];
			destination_y = args[ 1 ];
			destination_w = args[ 2 ];
			destination_h = args[ 3 ];
		}
		else
		if ( args.length === 2 )
		{
			destination_x = args[ 0 ];
			destination_y = args[ 1 ];
		}
		else
		{
			debugger;
		}
		
		if ( sdRenderer.visual_settings === 4 )
		{
			if ( this.sd_tint_filter || this.sd_status_effect_tint_filter )
			{
				let old_r = this.sd_color_mult_r;
				let old_g = this.sd_color_mult_g;
				let old_b = this.sd_color_mult_b;

				if ( this.sd_tint_filter )
				{
					this.sd_color_mult_r *= this.sd_tint_filter[ 0 ];
					this.sd_color_mult_g *= this.sd_tint_filter[ 1 ];
					this.sd_color_mult_b *= this.sd_tint_filter[ 2 ];
				}
				if ( this.sd_status_effect_tint_filter )
				{
					this.sd_color_mult_r *= this.sd_status_effect_tint_filter[ 0 ];
					this.sd_color_mult_g *= this.sd_status_effect_tint_filter[ 1 ];
					this.sd_color_mult_b *= this.sd_status_effect_tint_filter[ 2 ];
				}

				sdAtlasMaterial.drawImage( image, source_x, source_y, source_w, source_h, destination_x, destination_y, destination_w, destination_h );

				this.sd_color_mult_r = old_r;
				this.sd_color_mult_g = old_g;
				this.sd_color_mult_b = old_b;
			}
			else
			{
				sdAtlasMaterial.drawImage( image, source_x, source_y, source_w, source_h, destination_x, destination_y, destination_w, destination_h );
			}
		}
		else
		{
			let m = this.RequireMesh( this.geometries_by_draw_in[ this.volumetric_mode ], this.RequireMaterial( image, source_x, source_y, source_w, source_h, this.volumetric_mode, this.globalAlpha ) );

			this.DrawObject( m, destination_x, destination_y, destination_w, destination_h );
		}
	}
	
	DrawObject( m, destination_x, destination_y, destination_w, destination_h )
	{
		m.matrixAutoUpdate = false;
		
		m.matrix.copy( this.transform );
		
		if ( this.object_offset === null )
		{
			m.matrix.multiply( this.matrix_reusable.makeTranslation( destination_x, destination_y, -this.z_offset ) );
		}
		else
		{
			m.matrix.multiply( this.matrix_reusable.makeTranslation( destination_x + this.object_offset[ 0 ], destination_y + this.object_offset[ 1 ], -this.z_offset + this.object_offset[ 2 ] ) );
		}
		m.matrix.multiply( this.matrix_reusable.makeScale( destination_w, destination_h, this.z_depth ) );
		
		m.updateMatrixWorld();
		
		m.frustumCulled = false;
		
		m.renderOrder = this.GetDrawOffset();
		
		if ( this.camera_relative_world_scale !== 1 )
		{
			m.matrix.premultiply( this.matrix_reusable.makeTranslation( -this.camera.position.x, -this.camera.position.y, -this.camera.position.z ) );
			m.matrix.premultiply( this.matrix_reusable.makeScale( this.camera_relative_world_scale, this.camera_relative_world_scale, this.camera_relative_world_scale ) );
			m.matrix.premultiply( this.matrix_reusable.makeTranslation( this.camera.position.x, this.camera.position.y, this.camera.position.z ) );
		}
		
		if ( this.draw_offset === 0 && this.camera_relative_world_scale === 1 )
		{
			if ( this.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_LIQUID || this.volumetric_mode === FakeCanvasContext.DRAW_IN_3D_GRASS )
			m.castShadow = false;
			else
			m.castShadow = true;
		
			m.receiveShadow = true;
		}
		
		if ( m.material )
		{
			if ( typeof m.material.userData.customDepthMaterial !== 'undefined' )
			m.customDepthMaterial = m.material.userData.customDepthMaterial;
		}

		this.scene.add( m );
		this.draws.push( m );
	}
	
	beginPath()
	{
		this.current_shape = null;
		this.shapes = [];
	}
	moveTo( x, y )
	{
		this.current_shape = [ { x, y } ];
		this.shapes.push( this.current_shape );
	}
	lineTo( x, y )
	{
		this.current_shape.push( { x, y } );
	}
	arc( x, y, di, from_an, to_an )
	{
		//if ( sdRenderer.visual_settings === 4 )
		//return;
	
		//if ( isNaN( x ) || isNaN( y ) || isNaN( di ) )
		//debugger
				
		// ctx.arc( this.x0 - this.x, this.y0 - this.y, sdDoor.connection_range, 0, Math.PI*2 );
		var steps = Math.min( 50, Math.max( 16, ~~( Math.PI * di * ( to_an - from_an ) / 50 ) ) );
		
		for ( var i = 0; i <= steps; i++ )
		{
			var an = from_an + ( to_an - from_an ) * i / steps;
			
			if ( i === 0 )
			this.moveTo( x + Math.cos( an ) * di, y + Math.sin( an ) * di );
			else
			this.lineTo( x + Math.cos( an ) * di, y + Math.sin( an ) * di );
		}
	}
	rect( x0, y0, x1, y1 )
	{
	}
	fill()
	{
	}
	stroke()
	{	
		if ( sdRenderer.visual_settings === 4 )
		{
			const ctx = this;
			const radius = ctx.lineWidth / 2;
			
			let old_fillStyle = ctx.fillStyle;
			ctx.fillStyle = ctx.strokeStyle;
			{

				for ( var s = 0; s < this.shapes.length; s++ )
				{
					const points = this.shapes[ s ];

					/*let full_length = 0;

					for ( var i2 = 0; i2 < this.shapes[ i ].length; i2++ )
					{
						//points.push( this.shapes[ i ][ i2 ].x, this.shapes[ i ][ i2 ].y, 0 );
						points.push( this.shapes[ i ][ i2 ] );



						if ( i2 > 0 )
						{
							full_length += sdWorld.Dist2D_Vector( ( points[ points.length - 3 ] - points[ points.length - 6 ] ) * this.renderer.domElement.width / this.renderer.domElement.height, 
																  ( points[ points.length - 2 ] - points[ points.length - 5 ] ) );
						}

					}*/
					
					//let dash_current = 0;
					//let dash_is_filling = true;

					for ( let i = 0; i < points.length - 1; i++ )
					{
						ctx.save();
						{
							let dx = points[ i + 1 ].x - points[ i ].x;
							let dy = points[ i + 1 ].y - points[ i ].y;

							ctx.translate( points[ i ].x, points[ i ].y );

							ctx.rotate( Math.atan2( dy, dx ) - Math.PI / 2 );

							//if ( this.line_dash_arr.length === 0 )
							//{
								ctx.fillRect( -radius, -radius, radius * 2, radius * 2 + sdWorld.Dist2D_Vector( dx,dy ) );
							//}
							//else
							//{
							//	ctx.fillRect( -radius, 0, radius * 2, sdWorld.Dist2D_Vector( dx,dy ) );
							//}
						}
						ctx.restore();
					}
				}
			}
			ctx.fillStyle = old_fillStyle;
			
			return;
		}
	
		for ( var i = 0; i < this.shapes.length; i++ )
		{
			const points = [];
				
			let full_length = 0;
				
			for ( var i2 = 0; i2 < this.shapes[ i ].length; i2++ )
			{
				//let p = new THREE.Vector3( this.shapes[ i ][ i2 ].x, this.shapes[ i ][ i2 ].y, 0 );

				//points.push( p );
				points.push( this.shapes[ i ][ i2 ].x / this.renderer.domElement.width * this.renderer.domElement.height, this.shapes[ i ][ i2 ].y, 0 );
				
				if ( i2 > 0 )
				{
					full_length += sdWorld.Dist2D_Vector( ( points[ points.length - 3 ] - points[ points.length - 6 ] ) * this.renderer.domElement.width / this.renderer.domElement.height, 
														  ( points[ points.length - 2 ] - points[ points.length - 5 ] ) );
				}
				
			}
			if ( points.length > 1 )
			{
				/*const geometry = new THREE.BufferGeometry().setFromPoints( points );
				
				const material = this.RequireMaterial( this._stroke_ptr, this.strokeStyle, this.lineWidth * this.transform.elements[ 5 ], this.line_dash_arr[ 0 ], this.line_dash_arr[ 1 ], FakeCanvasContext.DRAW_IN_3D_FLAT, this.globalAlpha );
				
				const line = new THREE.Line( geometry, material );
				
				line.userData.disposer = this.disposer;
				
				this.DrawObject( line, 0, 0, 1, 1 );*/
			
				let scale = 1 / full_length; // sdWorld.Dist2D_Vector( ( points[ 0 ] - points[ 3 ] ) * this.renderer.domElement.width / this.renderer.domElement.height, points[ 1 ] - points[ 4 ] );
				
				const line = new MeshLine(); // Buffer geometry
				
				const material = this.RequireMaterial( this._stroke_ptr, this.strokeStyle, this.lineWidth * this.transform.elements[ 5 ], this.line_dash_arr.length === 0 ? 0 : this.line_dash_arr[ 0 ], this.line_dash_arr.length === 0 ? 0 : this.line_dash_arr[ 1 ], FakeCanvasContext.DRAW_IN_3D_FLAT, this.globalAlpha, scale );
				material.dashOffset = this.lineDashOffset * scale;

				line.setPoints( points );
				
				let m = this.RequireMesh( line, material );
				
				m.userData.disposer = this.disposer;
				
				
				this.DrawObject( m, 0, 0, 1 * this.renderer.domElement.width / this.renderer.domElement.height, 1 );
			}
		}
	}
	disposer( line ) // Lazy disposing for line meshes (their geometry and material)
	{
		//line.material.dispose();
		
		/*if ( line instanceof MeshLine )
		{
			debugger;
		}*/
		
		line.material.dispose();
		line.geometry.dispose();
	}
	clip( path, method )
	{
	}
	setLineDash( arr )
	{
		this.line_dash_arr = arr;
	}
	
	FakeStart()
	{		
		if ( sdRenderer.visual_settings === 4 )
		{
			sdAtlasMaterial.FrameStart();
		}
		
		
		this.box_caps.top = true;
		this.box_caps.right = true;
		this.box_caps.bottom = true;
		this.box_caps.left = true;
		
		
		this.z_offset = 0;
		this.z_depth = 0;
		
		if ( this.texture_cache_keys.length > 200 )
		for ( let tr = Math.floor( this.texture_cache_keys.length * 0.01 ); tr > 0; tr-- )
		{
			this.gc_loopie = ( this.gc_loopie + 1 ) % this.texture_cache_keys.length;
			
			var cache = this.texture_cache.get( this.texture_cache_keys[ this.gc_loopie ] );
			
			if ( cache._last_used < this.frame - 30 ) // At least 1 second old, useful for rain case
			{
				/*for ( var key in cache )
				if ( key !== '_last_used' )
				{
					var m = cache[ key ];
					m.dispose();
					if ( typeof m.userData.customDepthMaterial !== 'undefined' )
					m.userData.customDepthMaterial.dispose();
				}*/
				
				cache.forEach( ( m, key )=>
				{
					m.dispose();
					
					if ( typeof m.userData.customDepthMaterial !== 'undefined' )
					m.userData.customDepthMaterial.dispose();
				});
				
				this.texture_cache.delete( this.texture_cache_keys[ this.gc_loopie ] );
				this.texture_cache_keys.splice( this.gc_loopie, 1 );
			}
		}

		this.frame++;
	}
	FakeEnd()
	{
		if ( sdRenderer.visual_settings === 4 )
		{
			sdAtlasMaterial.FrameEnd();
		}
		
		let time_start = Date.now();
		
		this.renderer.render( this.scene, this.camera );
		
		let time_end = Date.now();
		
		// Remove unneded sold meshes
		this.sold_meshes.forEach( ( value )=>
		{
			value.forEach( ( arr_of_geoms )=>
			{
				for ( var i = 0; i < arr_of_geoms.length; i++ )
				{
					var d = arr_of_geoms[ i ];

					if ( typeof d.userData.disposer !== 'undefined' )
					d.userData.disposer( d );
				}
			} );
		} );
		/*for ( const map_of_geom_arrs of this.sold_meshes )
		for ( const arr_of_geoms of map_of_geom_arrs )
		{
			for ( var i = 0; i < arr_of_geoms.length; i++ )
			{
				var d = arr_of_geoms[ i ];

				if ( typeof d.userData.disposer !== 'undefined' )
				d.userData.disposer( d );
			}
		}*/
		this.sold_meshes.clear();
		
		for ( var i = this.draws.length - 1; i >= 0; i-- )
		{
			var d = this.draws[ i ];
			
			this.scene.remove( d );
			
			//if ( typeof d.userData.disposer !== 'undefined' )
			//d.userData.disposer( d );
		
			//this.sold_meshes.push( d ); 
		
			// Schedule for either reuse or remove
			if ( d.material ) // Actual Mesh, not a lamp
			{
				if ( !this.sold_meshes.has( d.material ) )
				this.sold_meshes.set( d.material, new Map() );

				let map_of_geom_arrs = this.sold_meshes.get( d.material );

				if ( !map_of_geom_arrs.has( d.geometry ) )
				map_of_geom_arrs.set( d.geometry, [ d ] );
				else
				map_of_geom_arrs.get( d.geometry ).push( d );
			}
			
			
			this.draws.splice( i, 1 );
			continue;
		}
		
		if ( time_end - time_start > 16 )
		{
			if ( !this.graphics_complain_spoken )
			if ( this.graphics_complain_skips-- <= 0 )
			if ( sdRenderer.service_mesage_until - sdWorld.time < 1000 )
			{
				//this.graphics_complain_spoken = true;
				
				let details = 'Details: ?';
				let msg = 'Note: Low framerate. Game might run better once "Visual settings" will be changed at game start. Also, make sure "Use hardware acceleration when available" is enabled at your browser\'s settings.';

				if ( !this._gl )
				{
					msg = 'Error: No WebGL. Was it disabled by editing web browser shortcut to include " -disable-webgl"? Because of lack of WebGL game won\'t be able to appear on your screen.';
					return;
				}
				else
				{
					if ( this._debugInfo )
					{
						details = 'Vendor: ' + this._vendor + ' :: Renderer: ' + this._renderer;

						if ( this._renderer === 'Google SwiftShader' )
						{
							msg = 'Note: Looks like "Use hardware acceleration when available" is not enabled at your browser\'s settings. Lack of this setting most probably will cause bad performance in-game.';
						}
						else
						if ( this._renderer.indexOf( 'Intel(R) HD Graphics' ) !== -1 )
						{
							msg = 'Note: Integrated graphics adapter is being used by your web browser. In case if you have non-integreated graphics adapter - we recommend configuring it for your web browser in order to have better performance. It is also known to be an issue where some browsers simply can not be set to use more efficient graphics adapter even if one was clearly configured to be used (any non-Microsoft Edge browsers under Windows 10). Also, make sure "Use hardware acceleration when available" is enabled at your browser\'s settings - this might help too.';
						}
						else
						{
							//msg = 'No potential performance issues were found based on detected graphics adapter.'
						}
					} 
					else
					details = 'Note: No WEBGL_debug_renderer_info (WebGL is available but details could not be retrieved).';

					if ( navigator.userAgent.toLowerCase().indexOf('firefox') > -1 )
					msg = 'Note: This game\'s performance under Firefox web browser can appear worse if compared to game\'s performance under webkit-based web browsers, like Microsoft Edge or at least Google Chrome (Chrome might have certain performance issues as well due to hardware acceleration not working. You can chek if this message appears in it though).';
				}
				
				
				if ( sdWorld.my_key_states.GetKey( 'KeyI' ) )
				{
					alert( msg + '\n\n' + details );
					this.graphics_complain_spoken = true;
				}
				else
				if ( sdWorld.my_key_states.GetKey( 'KeyK' ) )
				{
					sdRenderer.service_mesage_until = 0;
					this.graphics_complain_spoken = true;
				}
				else
				{
					sdRenderer.service_mesage_until = sdWorld.time + 1000;
					//sdRenderer.service_mesage = msg + ' ("i" for adapter info, "k" to close)';
					sdRenderer.service_mesage = 'Low framerate. Press "i" key for performance details & suggestions (you might be disconnected), or press "k" to ignore.';
				}
			}
		}
		else
		{
			this.graphics_complain_skips = 60;
		}
	}
}
FakeCanvasContext.init_class();

export default FakeCanvasContext;