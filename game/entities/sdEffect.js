
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';

import sdRenderer from '../client/sdRenderer.js';

		
class sdEffect extends sdEntity
{
	static init_class()
	{
		console.log('sdEffect class initiated');
		
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
		
		sdEffect.default_explosion_color = '#ffca9e';
		
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
			blood_cloud: sdWorld.CreateImageFromFile( 'blood_cloud' ),
			speed: 0.2,
			random_flip: true
		};
		sdEffect.types[ sdEffect.TYPE_WALL_HIT ] = {
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
			sound_to_play_volume: 0.25
		};
		sdEffect.types[ sdEffect.TYPE_BEAM ] = {
			images: [ 2, 1, 0.5, 0.25 ],
			speed: 0.4,
			random_flip: false
		};
		sdEffect.types[ sdEffect.TYPE_EXPLOSION ] = {
			images: [ sdWorld.CreateImageFromFile( 'explosion' ) ],
			duration: 30,
			speed: 1.5,
			random_flip: true,
			random_rotation: true,
			sound_to_play: 'explosion',
			sound_to_play_volume: 0.5
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
			blood_cloud: sdWorld.CreateImageFromFile( 'blood_cloudg' ),
			speed: 0.2,
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
			speed: 1 / ( 15 * 30 )
		};
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -1; }
	get hitbox_x2() { return 1; }
	get hitbox_y1() { return -1; }
	get hitbox_y2() { return 1; }
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return ( this._type === sdEffect.TYPE_CHAT ) ? 0.8 : 1; }
	
	constructor( params )
	{
		super( params );
		
		if ( sdWorld.is_server )
		{
			throw new Error('Server should not spawn these ever - they will at very least be missing proper description');
		}
		
		this._ani = 0;
		this._type = params.type || 0;
		
		this._decay_speed = sdEffect.types[ this._type ].speed * ( 1 - ( sdEffect.types[ this._type ].random_speed_percentage || 0 ) * Math.random() );
		
		this._radius = params.radius;
		this._x2 = params.x2;
		this._y2 = params.y2;
		this._color = params.color;
		
		this._scale = params.scale || 1;
		
		this._sd_tint_filter = null;//sdWorld.hexToRgb( params.color );
		
		/*
		if ( this._type === sdEffect.TYPE_EXPLOSION )
		if ( this._color === undefined )
		throw new Error('Should not happen');
		*/
		this._duration = sdEffect.types[ this._type ].duration || sdEffect.types[ this._type ].images.length;
		
		this._xscale = ( sdEffect.types[ this._type ].random_flip && Math.random() < 0.5 ) ? -1 : 1;
		this._rotation = sdEffect.types[ this._type ].random_rotation ? Math.random() * Math.PI * 2 : 0;
		
		this._text = ( params.text !== undefined ) ? params.text : null;
		//this._attachment = params.attachment || null;
		
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
		
		if ( sdEffect.types[ this._type ].sound_to_play )
		sdSound.PlaySound({ name:sdEffect.types[ this._type ].sound_to_play, x:this.x, y:this.y, volume:sdEffect.types[ this._type ].sound_to_play_volume, _server_allowed:true });
		
		this._filter = params.filter || '';
		
		if ( this._text )
		if ( params.voice )
		{
			let spoken = this._text;
			
			if ( spoken === 'ty' )
			spoken = 'thank you';
			
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
			spoken = 'joking';
			
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
			
			let that = this;
			
			let since = sdWorld.time;
			
			let t = meSpeak.speak( spoken, {
					amplitude: 100 * sdSound.volume_speech * sdSound.GetDistanceMultForPosition( this.x, this.y ),
					wordgap: params.voice.wordgap,
					pitch: params.voice.pitch,
					speed: params.voice.speed,
					variant: params.voice.variant
				}, 
				(e)=>
				{ 
					if ( sdWorld.time - since < 3000 )
					setTimeout(()=>{ that.remove();},3000);
					else
					setTimeout(()=>{ that.remove();},100);
				} 
			);
	
			if ( this._attachment )
			{
				if ( this._attachment._speak_id !== -1 )
				meSpeak.stop( this._attachment._speak_id );
				
				this._attachment._speak_id = t;
			}
			  //debugger;
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
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdCharacter', 'sdVirus', 'sdQuickie', 'sdOctopus', 'sdCrystal', 'sdAsp', 'sdSandWorm' ];
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
		this.remove();
	}
	Draw( ctx, attached )
	{
		var y = 0;
	
		ctx.filter = this._filter;
		
		if ( this._scale !== 1 )
		ctx.scale( this._scale, this._scale );
		
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
					ctx.fillStyle = '#FFFFFF';
					ctx.fillRect( -0.5 * width, 0, 1 * width, vel );
				}
			}
		}
		else
		{
			
			ctx.scale( this._xscale, 1 );
			ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ ~~this._ani ], - 16, y - 16, 32,32 );
		}
			
		ctx.filter = 'none';
	}
	DrawFG( ctx, attached )
	{
		if ( this._type === sdEffect.TYPE_CHAT )
		{
			ctx.font = "6px Verdana";
			ctx.textAlign = 'center';
			
			let details = ctx.measureText( this._text );
			
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
			
			ctx.fillStyle = 'rgb(0,0,0)';
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
			ctx.fillText( this._text, 0, 0 );
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
			/*
			var canvas2 = sdEffect.explosion_canvas;
			var ctx2 = sdEffect.explosion_ctx;
			{
				ctx2.fillStyle = this._color;
				ctx2.fillRect( 0, 0, w, h );
			  
				ctx2.globalCompositeOperation = "destination-in";
				ctx2.drawImage( sdEffect.types[ this._type ].images[ 0 ], xx*w, yy*h+1, w,h-2, 0,0,w,h );

				ctx2.globalCompositeOperation = "source-over";
			}
			ctx.globalCompositeOperation = "lighter";
			ctx.drawImage( canvas2,0,0 );
			ctx.globalCompositeOperation = "source-over";*/
			
			if ( this._sd_tint_filter === null )
			{
				this._sd_tint_filter = sdWorld.hexToRgb( this._color );
				this._sd_tint_filter[ 0 ] /= 255;
				this._sd_tint_filter[ 1 ] /= 255;
				this._sd_tint_filter[ 2 ] /= 255;
			}
			
			ctx.blend_mode = THREE.AdditiveBlending;
			{
				ctx.sd_tint_filter = this._sd_tint_filter;
				ctx.drawImageFilterCache( sdEffect.types[ this._type ].images[ 0 ], xx*w, yy*h+1, w,h-2, 0,0,w,h );
				ctx.sd_tint_filter = null;
			}
			ctx.blend_mode = THREE.NormalBlending;
		}
	}
}
//sdEffect.init_class();

export default sdEffect;