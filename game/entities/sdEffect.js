/*

	Server-side effect test:
	sdWorld.SendEffect({ x: , y: , type:sdEffect.TYPE_WALL_HIT });

	Client-side effect test:
	sdEntity.entities.push( new sdWorld.entity_classes.sdEffect({ x:bone_to.x, y:bone_to.y, type:sdWorld.entity_classes.sdEffect.TYPE_WALL_HIT }) );

*/
/* global THREE, sdMusic */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';

import sdRenderer from '../client/sdRenderer.js';

		
class sdEffect extends sdEntity
{
	static init_class()
	{
		if ( sdEffect.initiated )
		return;
		else
		sdEffect.initiated = true;
	
		sdEffect.local_effect_counter = 0;
		
		//console.log('sdEffect class initiated');
		
		/*sdEffect.ignored_entity_classes_arr = [ 
			'sdCharacter', 'sdVirus', 'sdQuickie', 'sdOctopus', 'sdCrystal', 'sdAsp', 'sdSandWorm', 'sdSlug', 'sdAmphid', 'sdJunk', 
			'sdTutel', 'sdGrub', 'sdBadDog', 'sdBiter', 'sdAbomination', 'sdMimic', 'sdDrone', 'sdBot', 'sdFaceCrab', 'sdTurret'
		];*/
		sdEffect.unignored_entity_classes_arr = [ 
			'sdBlock', 'sdDoor', 'sdConveyor'
		];
		
		sdEffect.TYPE_BLOOD = 0;
		sdEffect.TYPE_WALL_HIT = 1;
		sdEffect.TYPE_BEAM = 2;
		sdEffect.TYPE_EXPLOSION = 3;
		sdEffect.TYPE_CHAT = 4;
		sdEffect.TYPE_ROCK = 5;
		sdEffect.TYPE_GIB = 6;
		sdEffect.TYPE_BLOOD_GREEN = 7;
		sdEffect.TYPE_GIB_GREEN = 8;
		sdEffect.TYPE_LAG = 9;
		sdEffect.TYPE_GLOW_HIT = 10;
		sdEffect.TYPE_POPCORN = 11;
		sdEffect.TYPE_TELEPORT = 12;
		sdEffect.TYPE_SHELL = 13;
		sdEffect.TYPE_HEARTS = 14;
		sdEffect.TYPE_FIRE = 15;
		sdEffect.TYPE_FROZEN = 16;
		sdEffect.TYPE_RAIL_TRAIL = 17;
		sdEffect.TYPE_RAIL_HIT = 18;
		sdEffect.TYPE_BEAM_CIRCLED = 19;
		sdEffect.TYPE_SPEED = 20;
		sdEffect.TYPE_ALT_RAIL = 21;
		sdEffect.TYPE_SHIELD = 22;
		sdEffect.TYPE_DIRT_HIT = 23;
		sdEffect.TYPE_EXPLOSION_NON_ADDITIVE = 24;
		sdEffect.TYPE_VOID_FIRE = 25;
		sdEffect.TYPE_BLOOD_DROP = 26;
		sdEffect.TYPE_BLOOD_DROP_GREEN = 27;
		sdEffect.TYPE_SPARK = 28;
		sdEffect.TYPE_SMOKE = 29;
		sdEffect.TYPE_LENS_FLARE = 30;
		sdEffect.TYPE_GLASS = 31;
		sdEffect.TYPE_SHRAPNEL = 32;
		sdEffect.TYPE_GLOW_ALT = 33;
		
		
		sdEffect.default_explosion_color = '#ffca9e';
		
		sdEffect.smoke_colors = ['#444444', '#333333', '#222222', '#111111'];
		
		sdEffect.effect_counters = [];
		
		if ( typeof document !== 'undefined' ) // Server won't have it
		{
			if ( typeof OffscreenCanvas !== 'undefined' ) // Server won't have it
			{
				sdEffect.explosion_canvas = new OffscreenCanvas( 50, 37 );
				sdEffect.explosion_ctx = sdEffect.explosion_canvas.getContext("2d");
			}
			else
			{
				sdEffect.explosion_canvas = document.createElement('canvas');
				sdEffect.explosion_canvas.wdith = 50;
				sdEffect.explosion_canvas.height = 37;
				sdEffect.explosion_ctx = sdEffect.explosion_canvas.getContext("2d");
			}
		}
		sdEffect.types = [];
		sdEffect.types[ sdEffect.TYPE_BLOOD ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'blood1' ), 
				sdWorld.CreateImageFromFile( 'blood2' ), 
				sdWorld.CreateImageFromFile( 'blood3' ) 
			],
			//blood_cloud: sdWorld.CreateImageFromFile( 'blood_cloud' ),
			speed: 0.3,
			gravity: true,
			random_rotation90: true,
			random_flip: true
		};
		/*sdEffect.types[ sdEffect.TYPE_WALL_HIT ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'hit1' ), 
				sdWorld.CreateImageFromFile( 'hit2' ), 
				sdWorld.CreateImageFromFile( 'hit3' ), 
				sdWorld.CreateImageFromFile( 'hit4' ), 
				sdWorld.CreateImageFromFile( 'hit5' ) 
			],
			speed: 0.2,
			random_flip: true,
			sound_to_play: 'world_hit',
			sound_to_play_volume: 0.25,
			apply_shading: false
		};*/
		
		sdEffect.types[ sdEffect.TYPE_WALL_HIT ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_wall_hit' ) ],
			duration: 5,
			random_flip: true,
			random_rotation: true,
			speed: 0.6, // 0.2
			random_speed_percentage: 0.1,
			spritesheet: true,
			apply_shading: false,
			
			sound_to_play: 'world_hit2',
			sound_to_play_volume: 0.25,
		};
		sdEffect.types[ sdEffect.TYPE_DIRT_HIT ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_dirt_hit' ) ],
			duration: 5,
			random_flip: true,
			random_rotation: true,
			speed: 0.5,
			random_speed_percentage: 0.1,
			spritesheet: true,
			apply_shading: false,
			
			sound_to_play: 'world_hit2',
			sound_to_play_volume: 0.2,
			
			sound_to_play2: [ 'digA', 'digB', 'digC', 'digD' ],
			sound_to_play2_volume: 0.25,
		};
		
		sdEffect.types[ sdEffect.TYPE_BEAM ] = {
			images: [ 2, 1, 0.5, 0.25 ],
			speed: 0.4,
			random_flip: false,
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_BEAM_CIRCLED ] = {
			images: [ 2, 1, 0.5, 0.25 ],
			speed: 0.4,
			random_flip: false,
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_EXPLOSION ] = 
			sdEffect.types[ sdEffect.TYPE_EXPLOSION_NON_ADDITIVE ] = {
				images: [ sdWorld.CreateImageFromFile( 'explosion' ) ],
				duration: 30,
				speed: 1.5,
				random_flip: true,
				random_rotation: true,
				sound_to_play: 'explosion3',
				sound_to_play_volume: 1.5,
				apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_CHAT ] = {
			images: [],
			duration: 120,
			speed: 1,
			random_flip: false,
			random_rotation: false
		};
		sdEffect.types[ sdEffect.TYPE_ROCK ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'rock' ),
				sdWorld.CreateImageFromFile( 'rock2' )
			],
			speed: 1 / 90,
			random_speed_percentage: 0.5,
			random_flip: true,
			gravity: true,
			collisions: true
		};
		sdEffect.types[ sdEffect.TYPE_GIB ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'gib' ),
				sdWorld.CreateImageFromFile( 'gib2' )
			],
			speed: 1 / 90,
			random_speed_percentage: 0.5,
			random_flip: true,
			gravity: true,
			collisions: true
		};
		sdEffect.types[ sdEffect.TYPE_BLOOD_GREEN ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'blood1g' ), 
				sdWorld.CreateImageFromFile( 'blood2g' ), 
				sdWorld.CreateImageFromFile( 'blood3g' ) 
			],
			//blood_cloud: sdWorld.CreateImageFromFile( 'blood_cloudg' ),
			speed: 0.3,
			gravity: true,
			random_rotation90: true,
			random_flip: true
		};
		sdEffect.types[ sdEffect.TYPE_GIB_GREEN ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'gibg' ),
				sdWorld.CreateImageFromFile( 'gib2g' )
			],
			speed: 1 / 90,
			random_speed_percentage: 0.5,
			random_flip: true,
			gravity: true,
			collisions: true
		};
		sdEffect.types[ sdEffect.TYPE_LAG ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'lag' )
			],
			speed: 1 / ( 15 * 30 ),
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_GLOW_HIT ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'hit_glow' )
			],
			speed: 1 / 10,
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_POPCORN ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'popcorn_particle' )
			],
			speed: 1 / 90,
			random_speed_percentage: 0.2,
			random_flip: false,
			gravity: true,
			collisions: true
		};
		sdEffect.types[ sdEffect.TYPE_TELEPORT ] = {
			images: [ sdWorld.CreateImageFromFile( 'long_range_teleport' ) ],
			duration: 9,
			speed: 0.3,
			random_flip: true,
			random_rotation: false,
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_SHELL ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'shell' ),
			],
			speed: 1 / 90,
			random_speed_percentage: 0.1,
			random_flip: false,
			gravity: true,
			collisions: true,
			bounce_intensity: 0.333
		};
		sdEffect.types[ sdEffect.TYPE_HEARTS ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_hearts' ) ],
			duration: 3,
			random_flip: false,
			random_rotation: false,
			speed: 1 / 30,
			spritesheet: true,
			apply_shading: false,
			
			onBeforeRemove: ( effect_entity )=>
			{
				if ( Math.random() < 0.5 )
				sdSound.PlaySound({ name:'pop', x:effect_entity.x, y:effect_entity.y, volume:0.05 + Math.random() * 0.05, pitch:0.9 + Math.random() * 0.2, _server_allowed:true });
			}
		};
		
		sdEffect.types[ sdEffect.TYPE_SPEED ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_speed' ) ],
			duration: 3,
			random_flip: false,
			random_rotation: false,
			speed: 1 / 15,
			spritesheet: true,
			apply_shading: false
		};
		
		sdEffect.types[ sdEffect.TYPE_FIRE ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_fire' ) ],
			duration: 8,
			random_flip: true,
			random_rotation: false,
			speed: 6 / 30,
			random_speed_percentage: 0.2,
			spritesheet: true,
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_FROZEN ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_frozen' ) ],
			duration: 5,
			random_flip: true,
			random_rotation: false,
			speed: 3 / 30,
			random_speed_percentage: 0.2,
			spritesheet: true
		};
		sdEffect.types[ sdEffect.TYPE_RAIL_TRAIL ] = {
			images: [ sdWorld.CreateImageFromFile( 'rail_trail' ) ],
			duration: 4,
			random_flip: false,
			random_rotation: false,
			speed: 10 / 30,
			spritesheet: true,
			opacity: 0.5,
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_RAIL_HIT ] = {
			images: [ sdWorld.CreateImageFromFile( 'rail_hit' ) ],
			duration: 4,
			random_flip: true,
			random_rotation90: true,
			speed: 10 / 30,
			spritesheet: true,
			apply_shading: false
		};
		sdEffect.types[ sdEffect.TYPE_ALT_RAIL ] = {
			images: [ sdWorld.CreateImageFromFile( 'bullet2' ) ],
			duration: 30,
			speed: 0.8,
			apply_shading: false,
			random_speed_percentage: 0.25
		};
		
		sdEffect.types[ sdEffect.TYPE_SHIELD ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_shield' ) ],
			duration: 4,
			random_flip: false,
			random_rotation: false,
			speed: 40 / 30,
			spritesheet: true,
			apply_shading: false,
			camera_relative_world_scale: 0.9
		};

		sdEffect.types[ sdEffect.TYPE_VOID_FIRE ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_void_fire' ) ],
			duration: 8,
			random_flip: true,
			random_rotation: false,
			speed: 6 / 30,
			random_speed_percentage: 0.2,
			spritesheet: true,
			apply_shading: false
		};
		
		sdEffect.types[ sdEffect.TYPE_BLOOD_DROP ] = {
			images: [ sdWorld.CreateImageFromFile( 'effect_blood_drop' ) ],
			duration: 4,
			random_rotation: false,
			spritesheet: true,
			apply_shading: true,
			speed: 1 / 6,
			random_speed_percentage: 0.5,
			random_flip: true,
			gravity: true,
			collisions: true,
			friction_remain: 0
		};
		sdEffect.types[ sdEffect.TYPE_BLOOD_DROP_GREEN ] = Object.assign( {}, sdEffect.types[ sdEffect.TYPE_BLOOD_DROP ] );
		sdEffect.types[ sdEffect.TYPE_BLOOD_DROP_GREEN ].images = [ sdWorld.CreateImageFromFile( 'effect_blood_drop_green' ) ];
		
		sdEffect.types[ sdEffect.TYPE_SPARK ] = Object.assign( {}, sdEffect.types[ sdEffect.TYPE_BLOOD_DROP_GREEN ] );
		sdEffect.types[ sdEffect.TYPE_SPARK ].images = [ sdWorld.CreateImageFromFile( 'effect_spark' ) ];
		sdEffect.types[ sdEffect.TYPE_SPARK ].collisions = false;
		sdEffect.types[ sdEffect.TYPE_SPARK ].gravity = false;
		sdEffect.types[ sdEffect.TYPE_SPARK ].speed = 1 / 3;
		
		sdEffect.types[ sdEffect.TYPE_SMOKE ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'hit_glow' )
			],
			speed: 1 / 30,
			apply_shading: false,
			random_rotation: true
		};
		
		sdEffect.types[ sdEffect.TYPE_LENS_FLARE ] = {
			images: [ 
				sdWorld.CreateImageFromFile( 'lens_flare' )
			],
			speed: 1 / 20,
			apply_shading: false
		};
		
		sdEffect.types[ sdEffect.TYPE_GLASS ] = {
			images: [ sdWorld.CreateImageFromFile( 'glass' ) ],
			speed: 1 / 180,
			random_speed_percentage: 0.5,
			random_flip: true,
			random_rotation: true,
			gravity: true,
			collisions: true,
			bounce_intensity: 0.25,
			apply_shading: false
		};
		
		sdEffect.types[ sdEffect.TYPE_SHRAPNEL ] = Object.assign( {}, sdEffect.types[ sdEffect.TYPE_SPARK ] );
		//sdEffect.types[ sdEffect.TYPE_SHRAPNEL ].collisions = true;
		//sdEffect.types[ sdEffect.TYPE_SHRAPNEL ].gravity = true;
		
		sdEffect.types[ sdEffect.TYPE_GLOW_ALT ] = Object.assign( {}, sdEffect.types[ sdEffect.TYPE_GLOW_HIT ] );
		sdEffect.types[ sdEffect.TYPE_GLOW_ALT ].images = [ sdWorld.CreateImageFromFile( 'glow_alt' ) ];
		sdEffect.types[ sdEffect.TYPE_GLOW_ALT ].random_flip = true;
		sdEffect.types[ sdEffect.TYPE_GLOW_ALT ].random_rotation = true;
		
		
		sdEffect.translit_result_assumed_language = null;
		sdEffect.translit_map_ru = {
			"Ё":"YO",
			"Й":"I",
			"Ц":"TS",
			"У":"U",
			"К":"K",
			"Е":"E",
			"Н":"N",
			"Г":"G",
			"Ш":"SH",
			"Щ":"SCH",
			"З":"Z",
			"Х":"H",
			"Ъ":"'",
			"ё":"yo",
			"й":"i",
			"ц":"ts",
			"у":"u",
			"к":"k",
			"е":"e",
			"н":"n",
			"г":"g",
			"ш":"sh",
			"щ":"sch",
			"з":"z",
			"х":"h",
			"ъ":"'",
			"Ф":"F",
			"Ы":"I",
			"В":"V",
			"А":"a",
			"П":"P",
			"Р":"R",
			"О":"O",
			"Л":"L",
			"Д":"D",
			"Э":"E",
			"ф":"f",
			"ы":"i",
			"в":"v",
			"а":"a",
			"п":"p",
			"р":"r",
			"о":"o",
			"л":"l",
			"д":"d",
			"э":"e",
			"Я":"Ya",
			"Ч":"CH",
			"С":"S",
			"М":"M",
			"И":"I",
			"Т":"T",
			"Ь":"'",
			"Б":"B",
			"Ю":"YU",
			"я":"ya",
			"ч":"ch",
			"с":"s",
			"м":"m",
			"и":"i",
			"т":"t",
			"ь":"'",
			"б":"b",
			"ю":"yu",
			
			//"Ж":"ZH",
			//"ж":"zh",
			
			"Ж":"J",
			"ж":"j",
			
			"Є":"E",
			"є":"e",
			
			"І":"I",
			"і":"i"
		};

		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -1; }
	get hitbox_x2() { return 1; }
	get hitbox_y1() { return -1; }
	get hitbox_y2() { return 1; }
	
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return ( this._type === sdEffect.TYPE_CHAT ) ? 0.8 : 1; }
	
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		return false;
	}
	
	
	get bounce_intensity()
	{ 
		let v = sdEffect.types[ this._type ].bounce_intensity;
		return ( v === undefined ) ? 0 : v; 
	}
	
	get friction_remain()
	{
		let v = sdEffect.types[ this._type ].friction_remain;
		return ( v === undefined ) ? 0.8 : v; 
	}
	
	constructor( params )
	{
		super( params );
		
		this._local_uid = sdEffect.local_effect_counter++;
		
		if ( sdWorld.is_server && !sdWorld.is_singleplayer )
		{
			throw new Error('Server should not spawn these ever - they will at very least be missing proper description');
		}
		
		// Debugging NaN x/y of broken particles
		//this._stack_trace = globalThis.getStackTrace();
		
		this._ani = 0;
		this._type = params.type || 0;
		
		if ( typeof sdEffect.effect_counters[ this._type ] === 'undefined' )
		sdEffect.effect_counters[ this._type ] = 1;
		else
		{
			sdEffect.effect_counters[ this._type ]++;
			
			if ( sdEffect.effect_counters[ this._type ] > 128 * sdRenderer.effects_quality )
			this.remove();
		}
		
		this._decay_speed = sdEffect.types[ this._type ].speed * ( 1 - ( sdEffect.types[ this._type ].random_speed_percentage || 0 ) * Math.random() );
		
		this._radius = params.radius || 0;
		this._x2 = params.x2;
		this._y2 = params.y2;
		this._color = params.color || '#ffffff';
		
		//if ( this._color.indexOf(' ') !== -1 )
		//debugger;
		
		this._scale = params.scale || 1;
		
		this._sd_tint_filter = null;//sdWorld.hexToRgb( params.color );
		

		this._duration = sdEffect.types[ this._type ].duration || sdEffect.types[ this._type ].images.length;
		
		this._xscale = ( sdEffect.types[ this._type ].random_flip && Math.random() < 0.5 ) ? -1 : 1;
		//this._rotation = ( sdEffect.types[ this._type ].random_rotation * sdEffect.types[ this._type ].random_rotation90 ) ? Math.random() * Math.PI * 2 : 0;
		this._rotation = ( sdEffect.types[ this._type ].random_rotation ) ? Math.random() * Math.PI * 2 : 0;
		
		if ( sdEffect.types[ this._type ].random_rotation90 )
		this._rotation = Math.round( this._rotation / ( Math.PI / 2 ) ) * ( Math.PI / 2 );
	
		this._no_smoke = params.no_smoke || false;
		this._smoke_color = params.smoke_color || '';
		this._spark_color = params.spark_color || sdEffect.default_explosion_color;
		this._shrapnel = params.shrapnel || false;
		
		this._extra_eff_timer = 0; // Secondary particle effect
		
		this._text = ( params.text !== undefined ) ? params.text : null;
		this._text_censored = ( params.text_censored !== undefined ) ? params.text_censored : null;
		//this._attachment = params.attachment || null;
		
		//this._nested_translateables = null;
		//this._untranslateables = null;
		
		//this._will_translate = false;
		
		this._translation_object = null; 
		
		if ( sdWorld.client_side_censorship && this._text_censored )
		this._text = sdWorld.CensoredText( this._text );
		else
		if ( params.t )
		{
			this._translation_object = sdTranslationManager.GetTranslationObjectFor( this._text );
			
			this._text = this._translation_object.stripped_tags;
			
			//if ( sdTranslationManager.language !== 'en' )
			//{
				//this._will_translate = true;
				
				//[ this._text, this._nested_translateables, this._untranslateables ] = 
				//		sdTranslationManager.DecodeAndReplaceTagsFromPhrase( this._text );
				
				/*let nested_translateables = [];
				let untranslateables = [];
				
				while ( true )
				{
					let ptr = this._text.indexOf( '<' );
					if ( ptr === -1 )
					break;

					let ptr2 = this._text.indexOf( '>', ptr );
					if ( ptr2 === -1 )
					break;

					nested_translateables.push( this._text.substring( ptr + 1, ptr2 ) );

					this._text = this._text.substring( 0, ptr ) + '{'+(nested_translateables.length)+'}' + this._text.substring( ptr2 + 1 );
				}
				
				while ( true )
				{
					let ptr = this._text.indexOf( '[' );
					if ( ptr === -1 )
					break;

					let ptr2 = this._text.indexOf( ']', ptr );
					if ( ptr2 === -1 )
					break;

					untranslateables.push( this._text.substring( ptr + 1, ptr2 ) );

					this._text = this._text.substring( 0, ptr ) + '{'+(-untranslateables.length)+'}' + this._text.substring( ptr2 + 1 );
				}
				
				if ( nested_translateables.length > 0 )
				this._nested_translateables = nested_translateables;
				
				if ( untranslateables.length > 0 )
				this._untranslateables = untranslateables;*/
			//}
		}
		
		if ( params.attachment instanceof Array )
		this._attachment = params.attachment ? sdEntity.GetObjectByClassAndNetId( params.attachment[ 0 ], params.attachment[ 1 ] ) : null;
		else
		if ( params.attachment instanceof sdEntity )
		this._attachment = params.attachment;
		else
		this._attachment = null;

		this._attachment_x = params.attachment_x;
		this._attachment_y = params.attachment_y;
		
		this._attachment_rise = 0;
		
		this.sx = params.sx || 0;
		this.sy = params.sy || 0;
		
		if ( this._type === sdEffect.TYPE_BLOOD || this._type === sdEffect.TYPE_BLOOD_GREEN )
		{
			this.sy -= 1;
		}
		
		if ( this._type === sdEffect.TYPE_BEAM_CIRCLED )
		{
			let dx = this._x2 - this.x;
			let dy = this._y2 - this.y;
			
			let steps = ~~( sdWorld.Dist2D_Vector( dx, dy ) / 16 );
			
			if ( steps > 0 )
			{
				dx /= steps;
				dy /= steps;
				let xx = this.x;
				let yy = this.y;
				for ( let i = 0; i < steps; i++ )
				{
					if ( i > 0 )
					{
						let ent = new sdEffect({ x: xx, y: yy, type:sdEffect.TYPE_RAIL_TRAIL, color:this._color });
						sdEntity.entities.push( ent );
					}
					
					xx += dx;
					yy += dy;
				}
			}
			
			let ent = new sdEffect({ x: this._x2, y: this._y2, type:sdEffect.TYPE_RAIL_HIT, color:this._color });
			sdEntity.entities.push( ent );
		}
		
		let s = sdEffect.types[ this._type ].sound_to_play;
		if ( s )
		{
			if ( typeof s === 'string' )
			sdSound.PlaySound({ name:s, x:this.x, y:this.y, volume:sdEffect.types[ this._type ].sound_to_play_volume, _server_allowed:true });
			else
			sdSound.PlaySound({ name:s[ ~~( Math.random() * s.length ) ], x:this.x, y:this.y, volume:sdEffect.types[ this._type ].sound_to_play_volume, _server_allowed:true });
		}
		s = sdEffect.types[ this._type ].sound_to_play2;
		if ( s )
		{
			if ( typeof s === 'string' )
			sdSound.PlaySound({ name:s, x:this.x, y:this.y, volume:sdEffect.types[ this._type ].sound_to_play2_volume, _server_allowed:true });
			else
			sdSound.PlaySound({ name:s[ ~~( Math.random() * s.length ) ], x:this.x, y:this.y, volume:sdEffect.types[ this._type ].sound_to_play2_volume, _server_allowed:true });
		}
		
		this._hue = params.hue || 0;
		this._filter = params.filter || '';
		
		this._silences_music = ( this._text && params.voice && !params.no_ef );
		if ( this._silences_music )
		sdMusic.SpeakStart();
		
		if ( this._text )
		if ( params.voice )
		{
			if ( params.no_ef )
			{
				this.remove();
			}
			

			let spoken = this._text;

			if ( spoken === 'ty' )
			spoken = 'thank you';
		
			if ( spoken === 'thx' )
			spoken = 'thanks';
		
			if ( spoken === 'fr' )
			spoken = 'for real';
		
			if ( spoken === 'fr fr' )
			spoken = 'for real for real';
		
			if ( spoken === 'ong' )
			spoken = 'on god';

			if ( spoken === 'ikr' )
			spoken = 'i know right';

			if ( spoken === 'ily' )
			spoken = 'i love you';

			if ( spoken === 'np' )
			spoken = 'no problems';

			if ( spoken === 'smh' )
			spoken = 'shaking my head';

			if ( spoken === 'ngl' )
			spoken = 'not gonna lie';

			if ( spoken === 'afk' )
			spoken = 'away from keyboard';

			if ( spoken === 'ig' )
			spoken = 'I guess';

			if ( spoken === 'brb' )
			spoken = 'be right back';

			if ( spoken === 'idk' )
			spoken = 'i don\'t know';

			if ( spoken === 'jk' )
			spoken = 'just kidding';

			if ( spoken === 'wdym' || spoken === 'wdym?' )
			spoken = 'what do you mean?';

			if ( spoken === 'kys' )
			spoken = 'please commit no live';

			if ( spoken === 'btw' )
			spoken = 'by the way';

			if ( spoken === 'tf' )
			spoken = 'the fuck';

			if ( spoken === 'gj' )
			spoken = 'good job';

			if ( spoken === 'ffs' )
			spoken = 'for the fuck\'s sake';

			if ( spoken === 'fk' )
			spoken = 'fuck';

			if ( spoken === 'nvm' )
			spoken = 'nevermind';

			if ( spoken.charAt( 0 ) === '-' )
			spoken = 'minus ' + spoken.slice( 1 );

			if ( spoken.charAt( 0 ) === '+' )
			spoken = 'plus ' + spoken.slice( 1 );

			spoken = spoken.split('-').join('');

			spoken = spoken.split(':)').join('smileyface');
			spoken = spoken.split(':)').join('smileyface');
			spoken = spoken.split(':]').join('smileyface');
			spoken = spoken.split(':}').join('smileyface');

			spoken = spoken.split('>:(').join('madface');
			spoken = spoken.split('>:D').join('madhappyface');
			spoken = spoken.split(':(').join('sadface');
			spoken = spoken.split(':<').join('sadface');
			spoken = spoken.split(':[').join('sadface');

			spoken = spoken.split('^').join(' caret ');

			spoken = ( ' ' + spoken ).split(' im ').join(' i am ').slice( 1 );

			spoken = spoken.split(':D').join('happy face');

			spoken = spoken.split('Z').join('z'); // pronounce bug

			let voice = params.voice.voice; // Language

			spoken = sdEffect.Transliterate( spoken );

			if ( voice === 'en' )
			voice = 'en/en';

			if ( sdEffect.translit_result_assumed_language )
			voice = sdEffect.translit_result_assumed_language;

			let that = this;

			let since = sdWorld.time;

			let t = -1;

			if ( sdWorld.client_side_censorship && this._text_censored )
			{
				sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.35, pitch:0.4, _server_allowed: true });
			}
			else
			{
				if ( params.voice.variant !== 'silence' && !sdWorld.mobile )
				{
					t = meSpeak.speak( spoken, {
							amplitude: 100 * sdSound.volume_speech * sdSound.GetDistanceMultForPosition( this.x, this.y ),
							wordgap: params.voice.wordgap,
							pitch: params.voice.pitch,
							speed: params.voice.speed,
							variant: params.voice.variant,
							voice: voice
						}, 
						(e)=>
						{ 
							if ( sdWorld.time - since < 3000 )
							setTimeout(()=>{ that.remove();},3000);
							else
							setTimeout(()=>{ that.remove();},100);
						} 
					);
				}
				else
				{
					setTimeout(()=>{ that.remove();}, spoken.length * 120 + 100);
				}
			}

			if ( this._attachment )
			{
				if ( this._attachment._speak_id !== -1 )
				meSpeak.stop( this._attachment._speak_id );

				this._attachment._speak_id = t;
			}
			  //debugger;
		}

		
		if ( typeof params.rotation !== 'undefined' )
		{
			this._rotation = params.rotation;
		}
		
		// Kind of pointless. It was originally needed in order to prevent block break effect when world bounds are shifting
		/*if ( this.x < sdWorld.world_bounds.x1 )
		this.remove();
		if ( this.x >= sdWorld.world_bounds.x2 )
		this.remove();
		
		if ( this.y < sdWorld.world_bounds.y1 )
		this.remove();
		if ( this.y >= sdWorld.world_bounds.y2 )
		this.remove();*/
		
		/*
		EnforceChangeLog( this, 'x', false, true );
		EnforceChangeLog( this, 'y', false, true );
		EnforceChangeLog( this, 'sx', false, true );
		EnforceChangeLog( this, 'sy', false, true );*/
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		if ( this._type === sdEffect.TYPE_BLOOD || this._type === sdEffect.TYPE_BLOOD_GREEN || this._type === sdEffect.TYPE_EXPLOSION || this._type === sdEffect.TYPE_EXPLOSION_NON_ADDITIVE )
		{
			if ( this._type === sdEffect.TYPE_BLOOD || this._type === sdEffect.TYPE_BLOOD_GREEN )
			for ( let i = 0; i < Math.min( 8, 5 * sdRenderer.effects_quality ); i++ )
			{
				let r = Math.pow( ( 1 - Math.pow( Math.random(), 2 ) ), 1.5 ) * 1.75;
				let an = Math.random() * Math.PI * 2;
				let xx = Math.sin( an ) * r;
				let yy = Math.cos( an ) * r;

				if ( this._type === sdEffect.TYPE_BLOOD || this._type === sdEffect.TYPE_BLOOD_GREEN ) 
				{
					let e = new sdEffect({ type: ( this._type === sdEffect.TYPE_BLOOD ) ? sdEffect.TYPE_BLOOD_DROP : sdEffect.TYPE_BLOOD_DROP_GREEN, 
						x:this.x+xx*2, y:this.y+yy*2, sx:this.sx+xx, sy:this.sy+yy, hue:this._hue, filter:this._filter });
					sdEntity.entities.push( e );
				}
			}
			else
			if ( this._type === sdEffect.TYPE_EXPLOSION || this._type === sdEffect.TYPE_EXPLOSION_NON_ADDITIVE )
			{
				for ( let i = 0; i < 5 * sdRenderer.effects_quality; i++ )
				{
					if ( !this._no_smoke )
					{
						let an = Math.random() * Math.PI / 2;
					
						let zx = Math.sin( an ) * ( -Math.random() * 2 + Math.random() * 2 );
						let zy = Math.cos( an ) * ( -2 * Math.random() - ( Math.random() * 0.5 * Math.max( 1, this._radius / 20 ) ) );
					
						let e = new sdEffect({ type: sdEffect.TYPE_SMOKE, x:this.x, y:this.y, sx: zx, sy:zy, scale:this._radius / 20, radius:this._radius / 20, color:this._smoke_color || sdEffect.GetSmokeColor( sdEffect.smoke_colors ), spark_color: this._color });
						sdEntity.entities.push( e );
					}
					
					if ( sdRenderer.effects_quality >= 3 )
					if ( this._radius / 20 > 0.5 )
					{
						let an = Math.random() * Math.PI * 2;
						
						let xx = Math.sin( an ) * Math.random() * 4 * Math.min( 3, ( this._radius / 20 ) );
						let yy = -( Math.cos( an ) * Math.random() * 4 * Math.min( 3, ( this._radius / 20 ) ) );

						let type = this._shrapnel ? sdEffect.TYPE_SHRAPNEL : sdEffect.TYPE_SPARK;
						let mult = type === sdEffect.TYPE_SHRAPNEL ? 2 / 3 : 1;
						
						let s = new sdEffect({ type:type, x:this.x, y:this.y, sx:xx*mult, sy:yy*mult, color: this._color });
						sdEntity.entities.push( s );
					}
				}
			}
		}
	}
	static Transliterate( word )
	{
		sdEffect.translit_result_assumed_language = null;
		
		return word.split('').map(function (char) 
		{ 
			if ( sdEffect.translit_result_assumed_language === null )
			{
				if ( sdEffect.translit_map_ru[char] )
				sdEffect.translit_result_assumed_language = 'pl';
			}
			
			return sdEffect.translit_map_ru[char] || char; 
		}).join("");
	}


	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdEffect.ignored_entity_classes_arr;
	}*/
	GetNonIgnoredEntityClasses()
	{
		return sdEffect.unignored_entity_classes_arr;
	}

	get _text_target_x()
	{
		return this._attachment.x + this._attachment_x;
	}
	get _text_target_y()
	{
		return this._attachment.y + this._attachment_y - this._attachment_rise * 15;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._type === sdEffect.TYPE_EXPLOSION || this._type === sdEffect.TYPE_EXPLOSION_NON_ADDITIVE )
		this._ani += GSPEED * this._decay_speed * ( 20 / this._radius ) / this._scale;
		else
		this._ani += GSPEED * this._decay_speed / this._scale;

		if ( this._attachment )
		{
			//let rise = 0;
			
			for ( let i = sdEntity.entities.length - 1; i >= 0; i-- )
			{
				let e = sdEntity.entities[ i ];
				
				if ( e.is( sdEffect ) )
				if ( e._attachment )
				{
					/*if ( this._attachment === sdEntity.entities[ i ]._attachment )
					{
						if ( sdEntity.entities[ i ] === this )
						break;

						rise++;
					}*/

					if ( Math.abs( this._text_target_x - e._text_target_x ) < 200 )
					if ( Math.abs( this._text_target_y - e._text_target_y ) < 15 )
					if ( e !== this )
					{
						let c = ( this._local_uid < e._local_uid );
						let a = c ? this : e;
						let b = (!c) ? this : e;

						a._attachment_rise += GSPEED * 0.5;
						//b._attachment_rise -= GSPEED * 0.5;
					}
				}
			}
			
			//rise = this._attachment_rise;
			
			this.x = sdWorld.MorphWithTimeScale( this.x, this._text_target_x, 0.8, GSPEED );
			this.y = sdWorld.MorphWithTimeScale( this.y, this._text_target_y, 0.8, GSPEED );
			
			//this.x = this._attachment.x + this._attachment_x;
			//this.y = this._attachment.y + this._attachment_y;
		}

		if ( sdEffect.types[ this._type ].gravity )
		this.sy += sdEffect.types[ this._type ].gravity_mult || 1 * sdWorld.gravity * GSPEED;
		
		if ( sdEffect.types[ this._type ].collisions )
		{
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		else
		{
			this.x += this.sx * GSPEED;
			this.y += this.sy * GSPEED;
		}
		
		
		// Keep chan within world bounds
		if ( this._type === sdEffect.TYPE_CHAT )
		this.y = Math.max( this.y, sdWorld.world_bounds.y1 + 8 );
	
		if ( this._type === sdEffect.TYPE_SMOKE )
		{
			if ( this._radius < 32 )
			this._radius += this._radius / 75 * GSPEED;
			
			if ( sdRenderer.effects_quality >= 2 && this._spark_color && Math.random() < 0.005 && this._ani < 0.5 )
			{
				let e = new sdEffect({ type:sdEffect.TYPE_SPARK, x:this.x, y:this.y, sx:this.sx + ( Math.random() * 3 - Math.random() * 3 ), sy:this.sy * Math.random() * 2, color: this._spark_color });
				sdEntity.entities.push( e );
			}
		}
		
		if ( this._type === sdEffect.TYPE_SHRAPNEL )
		{
			if ( this._extra_eff_timer > 0 )
			this._extra_eff_timer -= GSPEED;
			
			if ( this._extra_eff_timer <= 0 )
			{
				let e = new sdEffect({ type:sdEffect.TYPE_SPARK, x:this.x, y:this.y, sx:this.sx * 0.8, sy:this.sy * 0.8, color: this._color });
				sdEntity.entities.push( e );
				
				this._extra_eff_timer = 2.5;
			}
		}
		
		if ( this._type === sdEffect.TYPE_GLASS || this._type === sdEffect.TYPE_SHELL )
		{
			this._rotation += this.sx * 0.5 * GSPEED;
		}

		if ( this._ani >= this._duration )
		{
			if ( sdEffect.types[ this._type ].onBeforeRemove )
			sdEffect.types[ this._type ].onBeforeRemove( this );
		
			this.remove();
		}
	}
	Draw( ctx, attached )
	{
		if ( this._is_being_removed )
		return;
	
		ctx.apply_shading = ( sdEffect.types[ this._type ].apply_shading === undefined ) ? true : sdEffect.types[ this._type ].apply_shading;
	
		var y = 0;
	
		ctx.sd_hue_rotation = this._hue;
		ctx.filter = this._filter;
		
		if ( this._scale !== 1 )
		ctx.scale( this._scale, this._scale );
	
		if ( this._rotation !== 0 )
		ctx.rotate( this._rotation );
		
		//if ( this._type === sdEffect.TYPE_BLOOD )
		if ( sdEffect.types[ this._type ].blood_cloud )
		{
			
			y -= Math.sin( this._ani * 1.3 ) * 4;
			
			ctx.save();
			ctx.scale( 0.3 + this._ani / this._duration * 0.7, 0.3 + this._ani / this._duration * 0.7 );
			ctx.globalAlpha = ( 1 - this._ani / this._duration );
			ctx.drawImageFilterCache( sdEffect.types[ this._type ].blood_cloud, - 16, y - 16, 32,32 );
			ctx.globalAlpha = 1;
			ctx.restore();
			
		}
		
		
		if ( this._type === sdEffect.TYPE_LAG )
		{
			if ( !globalThis.enable_debug_info )
			return;
		
			ctx.font = "6px Verdana";
			ctx.textAlign = 'left';
			
			ctx.fillStyle = '#ff0000';
			ctx.fillText( this._text, 16, 16 );
			
		}
	
		if ( this._type === sdEffect.TYPE_CHAT )
		{
		}
		else
		if ( this._type === sdEffect.TYPE_EXPLOSION || this._type === sdEffect.TYPE_EXPLOSION_NON_ADDITIVE )
		{
		}
		else
		if ( this._type === sdEffect.TYPE_GLOW_HIT || this._type === sdEffect.TYPE_GLOW_ALT )
		{
		}
		else
		if ( this._type === sdEffect.TYPE_SMOKE )
		{
		}
		else
		if ( this._type === sdEffect.TYPE_LENS_FLARE )
		{
		}
		else
		if ( this._type === sdEffect.TYPE_TELEPORT )
		{
		}
		else
		//if ( this._type === sdEffect.TYPE_HEARTS || this._type === sdEffect.TYPE_FIRE || this._type === sdEffect.TYPE_FROZEN )
		if ( sdEffect.types[ this._type ].spritesheet )
		{
		}
		else
		if ( typeof sdEffect.types[ this._type ].images[ ~~this._ani ] === 'number' )
		{
			let width = sdEffect.types[ this._type ].images[ ~~this._ani ];
			
			if ( this._x2 !== undefined ) // beam
			{
				ctx.rotate( Math.atan2( this._y2 - this.y, this._x2 - this.x ) - Math.PI / 2 );

				let vel = sdWorld.Dist2D( this.x, this.y, this._x2, this._y2 );

				ctx.fillStyle = this._color;
				ctx.fillRect( -0.5 * width, 0, 1 * width, vel );

				width -= 1;

				if ( width > 0 )
				{
					//ctx.sd_color_mult_r = 20;
					//ctx.sd_color_mult_g = 20;
					//ctx.sd_color_mult_b = 20;
					
					let color_arr = sdWorld.hexToRgb( this._color );
					
					color_arr[ 0 ] *= 4;
					color_arr[ 1 ] *= 4;
					color_arr[ 2 ] *= 4;
					
					ctx.fillStyle = '#' + sdWorld.ColorArrayToHex( color_arr );
					//ctx.fillStyle = '#FFFFFF';
					ctx.fillRect( -0.5 * width, 0, 1 * width, vel );

					//ctx.sd_color_mult_r = 1;
					//ctx.sd_color_mult_g = 1;
					//ctx.sd_color_mult_b = 1;
				}
			}
		}
		else
		if ( this._type === sdEffect.TYPE_ALT_RAIL )
		{
			//ctx.rotate( Math.atan2( this.y - this._y2, this.x - this._x2 ) );
				
			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				if ( this._sd_tint_filter )
				{
					this._sd_tint_filter[ 0 ] /= 255;
					this._sd_tint_filter[ 1 ] /= 255;
					this._sd_tint_filter[ 2 ] /= 255;
				}
			}
			
			ctx.blend_mode = THREE.AdditiveBlending;
			{
				// Projectile coloring
				ctx.sd_tint_filter = this._sd_tint_filter;
				ctx.globalAlpha = ( 1 - this._ani / this._duration );
				ctx.rotate( Math.atan2( this._y2 - this.y, this._x2 - this.x ) );
				let vel = sdWorld.Dist2D( this.x, this.y, this._x2, this._y2 );
				ctx.scale( 1 * vel / 32, 0.5 );
				ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], 0, - 16, 32, 32 );
				ctx.globalAlpha = 1;
				ctx.sd_tint_filter = null;
			}
			ctx.blend_mode = THREE.NormalBlending;
			
		}
		else
		if ( this._type === sdEffect.TYPE_SPARK || this._type === sdEffect.TYPE_SHRAPNEL )
		{	
			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				if ( this._sd_tint_filter )
				{
					this._sd_tint_filter[ 0 ] /= 255;
					this._sd_tint_filter[ 1 ] /= 255;
					this._sd_tint_filter[ 2 ] /= 255;
				}
			}
		}
		else
		{
			
			ctx.scale( this._xscale, 1 );
			ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ ~~this._ani ], - 16, y - 16, 32,32 );
		}
			
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
	}
	DrawFG( ctx, attached )
	{
		if ( this._is_being_removed )
		return;
	
		ctx.apply_shading = ( sdEffect.types[ this._type ].apply_shading === undefined ) ? false : sdEffect.types[ this._type ].apply_shading;
		
		if ( this._type === sdEffect.TYPE_CHAT )
		{
			ctx.font = "6px Verdana";
			ctx.textAlign = 'center';
			
			let t = this._text;
			
			//if ( this._will_translate )
			if ( this._translation_object )
			{
				//t = sdTranslationManager.TranslateConsideringTags( t, this._nested_translateables, this._untranslateables );
				t = this._translation_object.GetTranslated();
				/*
				t = T( t );
				
				if ( this._nested_translateables )
				{
					for ( let i = 0 ; i < this._nested_translateables.length; i++ )
					t = t.split( '{'+(i+1)+'}' ).join( T( this._nested_translateables[ i ] ) );
				}
				if ( this._untranslateables )
				{
					for ( let i = 0 ; i < this._untranslateables.length; i++ )
					t = t.split( '{'+(-(i+1))+'}' ).join( this._untranslateables[ i ] );
				}*/
			}
			
			let details = ctx.measureText( t );
			
			//if ( !this._attachment )
            {
                if ( this.x < sdWorld.camera.x - sdRenderer.screen_width / 2 / sdWorld.camera.scale + details.width / 2 + 10 )
                ctx.translate( sdWorld.camera.x - sdRenderer.screen_width / 2 / sdWorld.camera.scale + details.width / 2 + 10 - this.x, 0 );
                
                if ( this.x > sdWorld.camera.x + sdRenderer.screen_width / 2 / sdWorld.camera.scale - details.width / 2 - 10 )
				ctx.translate( sdWorld.camera.x + sdRenderer.screen_width / 2 / sdWorld.camera.scale - details.width / 2 - 10 - this.x, 0 );
               
                
                if ( this.y > sdWorld.camera.y + sdRenderer.screen_height / 2 / sdWorld.camera.scale - 10 )
                ctx.translate( 0, sdWorld.camera.y + sdRenderer.screen_height / 2 / sdWorld.camera.scale - 10 - this.y );
                
                if ( this.y < sdWorld.camera.y - sdRenderer.screen_height / 2 / sdWorld.camera.scale + 15 )
                ctx.translate( 0, sdWorld.camera.y - sdRenderer.screen_height / 2 / sdWorld.camera.scale + 15 - this.y );
            }
			
			ctx.fillStyle = '#000000';
			ctx.globalAlpha = 0.7;
			ctx.fillRect( -details.width / 2 - 2, -7, details.width + 4, 10 );
			ctx.globalAlpha = 1;

			
			if ( this._attachment )
			{
				ctx.beginPath();

				let arrow_size = 3;

				let arrow_x = this._attachment.x - this.x;

				if ( arrow_x < -details.width / 2 - 2 + arrow_size )
				arrow_x = -details.width / 2 - 2 + arrow_size;
				if ( arrow_x > details.width / 2 + 2 - arrow_size )
				arrow_x = details.width / 2 + 2 - arrow_size;

				ctx.moveTo( arrow_x - arrow_size, -7 + 10 );
				ctx.lineTo( arrow_x + arrow_size, -7 + 10 );
				ctx.lineTo( arrow_x, -7 + 10 + arrow_size );

				ctx.fill();
			}
			
			ctx.fillStyle = this._color;
			ctx.fillText( t, 0, 0 );
		}
		else
		if ( this._type === sdEffect.TYPE_EXPLOSION || this._type === sdEffect.TYPE_EXPLOSION_NON_ADDITIVE )
		{
			ctx.scale( this._xscale * this._radius / 20, 1 * this._radius / 20 );
			ctx.rotate( this._rotation );
			
			let xx = 0;
			let yy = 0;
			
			xx = Math.floor( this._ani );
			while ( xx >= 5 )
			{
				xx -= 5;
				yy += 1;
			}
			
			let w = 50;
			let h = 37;
			
			ctx.translate( -w/2, -h/2 );

			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				if ( this._sd_tint_filter )
				{
					this._sd_tint_filter[ 0 ] /= 255;
					this._sd_tint_filter[ 1 ] /= 255;
					this._sd_tint_filter[ 2 ] /= 255;
				}
			}
			
			if ( this._type === sdEffect.TYPE_EXPLOSION )
			ctx.blend_mode = THREE.AdditiveBlending;
			{
				ctx.sd_tint_filter = this._sd_tint_filter;
				ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], xx*w, yy*h+1, w,h-2, 0,0,w,h );
				ctx.sd_tint_filter = null;
			}
			ctx.blend_mode = THREE.NormalBlending;
		}
		else
		if ( this._type === sdEffect.TYPE_GLOW_HIT || this._type === sdEffect.TYPE_GLOW_ALT )
		{
			if ( this._radius !== 0 )
			ctx.scale( 1 + this._radius, 1 + this._radius );
			if ( this._rotation !== 0 )
			ctx.rotate( this._rotation );
		
			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				this._sd_tint_filter[ 0 ] /= 255;
				this._sd_tint_filter[ 1 ] /= 255;
				this._sd_tint_filter[ 2 ] /= 255;
			}
			
			ctx.globalAlpha = Math.pow( 1 - this._ani, 2 );
			
			ctx.blend_mode = THREE.AdditiveBlending;
			{
				ctx.sd_tint_filter = this._sd_tint_filter;
				ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], -8, -8, 16, 16 );
				ctx.sd_tint_filter = null;
			}
			ctx.blend_mode = THREE.NormalBlending;
		}
		else
		if ( this._type === sdEffect.TYPE_SMOKE )
		{
			if ( this._radius !== 0 )
			ctx.scale( 1 + this._radius, 1 + this._radius );
		
			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				this._sd_tint_filter[ 0 ] /= 255;
				this._sd_tint_filter[ 1 ] /= 255;
				this._sd_tint_filter[ 2 ] /= 255;
			}
			
			ctx.globalAlpha = Math.pow( 1 - this._ani, 2 );
			
			//ctx.blend_mode = THREE.AdditiveBlending;
			{
				ctx.sd_tint_filter = this._sd_tint_filter;
				ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], -8, -8, 16, 16 );
				ctx.sd_tint_filter = null;
			}
			ctx.blend_mode = THREE.NormalBlending;
		}
		else
		if ( this._type === sdEffect.TYPE_LENS_FLARE )
		{
			if ( this._radius !== 0 )
			ctx.scale( 1 + this._radius, 1 + this._radius );
		
			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				this._sd_tint_filter[ 0 ] /= 255;
				this._sd_tint_filter[ 1 ] /= 255;
				this._sd_tint_filter[ 2 ] /= 255;
			}
			
			ctx.globalAlpha = Math.pow( 1 - this._ani, 2 );
			
			ctx.blend_mode = THREE.AdditiveBlending;
			{
				ctx.sd_tint_filter = this._sd_tint_filter;
				ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], -8, -8, 16, 16 );
				ctx.sd_tint_filter = null;
			}
			ctx.blend_mode = THREE.NormalBlending;
		}
		else
		if ( this._type === sdEffect.TYPE_TELEPORT )
		{
			let frame = ~~( this._ani );
			ctx.filter = this._filter;
			ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], 96 + (frame%3)*32, 0 + ~~(frame/3)*32, 32,32, -16,-16,32,32 );
			ctx.filter = 'none';
		}
		else
		if ( this._type === sdEffect.TYPE_GLASS )
		{
			ctx.rotate( this._rotation );
		}
		else
		if ( sdEffect.types[ this._type ].spritesheet )
		//if ( this._type === sdEffect.TYPE_HEARTS || this._type === sdEffect.TYPE_FIRE || this._type === sdEffect.TYPE_FROZEN )
		{
			if ( sdEffect.types[ this._type ].camera_relative_world_scale !== undefined )
			ctx.camera_relative_world_scale *= sdEffect.types[ this._type ].camera_relative_world_scale;
			
			if ( this._scale !== 1 )
			ctx.scale( this._scale, this._scale );

			if ( this._rotation !== 0 )
			ctx.rotate( this._rotation );

			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				if ( this._sd_tint_filter )
				{
					this._sd_tint_filter[ 0 ] /= 255;
					this._sd_tint_filter[ 1 ] /= 255;
					this._sd_tint_filter[ 2 ] /= 255;
				}
			}
			
			ctx.sd_color_mult_r = this._sd_tint_filter[ 0 ];
			ctx.sd_color_mult_g = this._sd_tint_filter[ 1 ];
			ctx.sd_color_mult_b = this._sd_tint_filter[ 2 ];
			
			if ( sdEffect.types[ this._type ].opacity !== undefined )
			ctx.globalAlpha = sdEffect.types[ this._type ].opacity;
		
			let img = sdEffect.types[ this._type ].images[ 0 ];
			let frame_size = img.height;
			
			let frame = ~~( this._ani );
			ctx.sd_hue_rotation = this._hue;
			ctx.filter = this._filter;
			//ctx.drawImageFilterCache( img, 0 + frame*16, 0, 16,16, -8,-8,16,16 );
			ctx.drawImageFilterCache( img, 0 + frame*frame_size, 0, frame_size,frame_size, -frame_size/2,-frame_size/2,frame_size,frame_size );
			ctx.filter = 'none';
			
			ctx.sd_color_mult_r = 1;
			ctx.sd_color_mult_g = 1;
			ctx.sd_color_mult_b = 1;
			ctx.globalAlpha = 1;
			ctx.sd_hue_rotation = 0;
			
			if ( sdEffect.types[ this._type ].camera_relative_world_scale !== undefined )
			ctx.camera_relative_world_scale /= sdEffect.types[ this._type ].camera_relative_world_scale;
		}
		
		//ctx.apply_shading = true;
	}
	
	static GetSmokeColor( hex_color_arr )
	{
		 return hex_color_arr[( Math.floor( Math.random() * hex_color_arr.length ))];
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this._silences_music )
		sdMusic.SpeakStop();
	
		sdEffect.effect_counters[ this._type ]--;
	}
}
//sdEffect.init_class();

export default sdEffect;
