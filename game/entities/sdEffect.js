/*

	Server-side effect test:
	sdWorld.SendEffect({ x: , y: , type:sdEffect.TYPE_WALL_HIT });

*/
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
		
		console.log('sdEffect class initiated');
		
		sdEffect.ignored_entity_classes_arr = [ 'sdCharacter', 'sdVirus', 'sdQuickie', 'sdOctopus', 'sdCrystal', 'sdAsp', 'sdSandWorm', 'sdSlug', 'sdAmphid', 'sdJunk', 'sdTutel', 'sdGrub', 'sdBadDog', 'sdBiter', 'sdAbomination', 'sdMimic' ];
		
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
		
		
		sdEffect.default_explosion_color = '#ffca9e';
		
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
			
			sound_to_play: 'world_hit',
			sound_to_play_volume: 0.25,
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
		sdEffect.types[ sdEffect.TYPE_EXPLOSION ] = {
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
			collisions: true
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
	
	constructor( params )
	{
		super( params );
		
		if ( sdWorld.is_server && !sdWorld.is_singleplayer )
		{
			throw new Error('Server should not spawn these ever - they will at very least be missing proper description');
		}
		
		this._ani = 0;
		this._type = params.type || 0;
		
		if ( typeof sdEffect.effect_counters[ this._type ] === 'undefined' )
		sdEffect.effect_counters[ this._type ] = 1;
		else
		{
			sdEffect.effect_counters[ this._type ]++;
			
			if ( sdEffect.effect_counters[ this._type ] > 128 )
			this.remove();
		}
		
		this._decay_speed = sdEffect.types[ this._type ].speed * ( 1 - ( sdEffect.types[ this._type ].random_speed_percentage || 0 ) * Math.random() );
		
		this._radius = params.radius;
		this._x2 = params.x2;
		this._y2 = params.y2;
		this._color = params.color || '#ffffff';
		
		//if ( this._color.indexOf(' ') !== -1 )
		//debugger;
		
		this._scale = params.scale || 1;
		
		this._sd_tint_filter = null;//sdWorld.hexToRgb( params.color );
		
		/*
		if ( this._type === sdEffect.TYPE_EXPLOSION )
		if ( this._color === undefined )
		throw new Error('Should not happen');
		*/
		this._duration = sdEffect.types[ this._type ].duration || sdEffect.types[ this._type ].images.length;
		
		this._xscale = ( sdEffect.types[ this._type ].random_flip && Math.random() < 0.5 ) ? -1 : 1;
		//this._rotation = ( sdEffect.types[ this._type ].random_rotation * sdEffect.types[ this._type ].random_rotation90 ) ? Math.random() * Math.PI * 2 : 0;
		this._rotation = ( sdEffect.types[ this._type ].random_rotation ) ? Math.random() * Math.PI * 2 : 0;
		
		if ( sdEffect.types[ this._type ].random_rotation90 )
		this._rotation = Math.round( this._rotation / ( Math.PI / 2 ) ) * ( Math.PI / 2 );
		
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
		
		if ( sdEffect.types[ this._type ].sound_to_play )
		sdSound.PlaySound({ name:sdEffect.types[ this._type ].sound_to_play, x:this.x, y:this.y, volume:sdEffect.types[ this._type ].sound_to_play_volume, _server_allowed:true });
		
		this._hue = params.hue || 0;
		this._filter = params.filter || '';
		
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
		
		if ( this.x < sdWorld.world_bounds.x1 )
		this.remove();
		if ( this.x >= sdWorld.world_bounds.x2 )
		this.remove();
		
		if ( this.y < sdWorld.world_bounds.y1 )
		this.remove();
		if ( this.y >= sdWorld.world_bounds.y2 )
		this.remove();
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


	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdEffect.ignored_entity_classes_arr;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._type === sdEffect.TYPE_EXPLOSION )
		this._ani += GSPEED * this._decay_speed * ( 20 / this._radius ) / this._scale;
		else
		this._ani += GSPEED * this._decay_speed / this._scale;

		if ( this._attachment )
		{
			let rise = 0;
			
			for ( let i = sdEntity.entities.length - 1; i >= 0; i-- )
			{
				if ( this._attachment === sdEntity.entities[ i ]._attachment )
				{
					if ( sdEntity.entities[ i ] === this )
					break;
				
					rise++;
				}
			}
			
			this.x = sdWorld.MorphWithTimeScale( this.x, this._attachment.x + this._attachment_x, 0.8, GSPEED );
			this.y = sdWorld.MorphWithTimeScale( this.y, this._attachment.y + this._attachment_y - rise * 15, 0.8, GSPEED );
			
			//this.x = this._attachment.x + this._attachment_x;
			//this.y = this._attachment.y + this._attachment_y;
		}
		
		if ( sdEffect.types[ this._type ].gravity )
		this.sy += sdWorld.gravity * GSPEED;
		
		if ( sdEffect.types[ this._type ].collisions )
		{
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		else
		{
			this.x += this.sx * GSPEED;
			this.y += this.sy * GSPEED;
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
		if ( this._type === sdEffect.TYPE_EXPLOSION )
		{
		}
		else
		if ( this._type === sdEffect.TYPE_GLOW_HIT )
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
			
			ctx.fillStyle = '#ffffff';
			ctx.fillText( t, 0, 0 );
		}
		else
		if ( this._type === sdEffect.TYPE_EXPLOSION )
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
			
			ctx.blend_mode = THREE.AdditiveBlending;
			{
				ctx.sd_tint_filter = this._sd_tint_filter;
				ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], xx*w, yy*h+1, w,h-2, 0,0,w,h );
				ctx.sd_tint_filter = null;
			}
			ctx.blend_mode = THREE.NormalBlending;
		}
		else
		if ( this._type === sdEffect.TYPE_GLOW_HIT )
		{
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
		if ( sdEffect.types[ this._type ].spritesheet )
		//if ( this._type === sdEffect.TYPE_HEARTS || this._type === sdEffect.TYPE_FIRE || this._type === sdEffect.TYPE_FROZEN )
		{
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
			ctx.filter = this._filter;
			//ctx.drawImageFilterCache( img, 0 + frame*16, 0, 16,16, -8,-8,16,16 );
			ctx.drawImageFilterCache( img, 0 + frame*frame_size, 0, frame_size,frame_size, -frame_size/2,-frame_size/2,frame_size,frame_size );
			ctx.filter = 'none';
			
			ctx.sd_color_mult_r = 1;
			ctx.sd_color_mult_g = 1;
			ctx.sd_color_mult_b = 1;
			ctx.globalAlpha = 1;
		}
		
		//ctx.apply_shading = true;
	}
	onRemove() // Class-specific, if needed
	{
		sdEffect.effect_counters[ this._type ]--;
	}
}
//sdEffect.init_class();

export default sdEffect;