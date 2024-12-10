
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBullet from './sdBullet.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdGib from './sdGib.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';
import sdVirus from './sdVirus.js';
import sdAsp from './sdAsp.js';
import sdAbomination from './sdAbomination.js';
import sdFleshGrabber from './sdFleshGrabber.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdGrass from './sdGrass.js';
import sdCom from './sdCom.js';
import sdAsteroid from './sdAsteroid.js';

class sdMimic extends sdEntity
{
	static init_class()
	{
		sdMimic.img_mimic = sdWorld.CreateImageFromFile( 'sdMimic' );
		/*
		sdMimic.img_quickie_idle1 = sdWorld.CreateImageFromFile( 'quickie_idle1' );
		sdMimic.img_quickie_idle2 = sdWorld.CreateImageFromFile( 'quickie_idle2' );
		sdMimic.img_quickie_walk1 = sdWorld.CreateImageFromFile( 'quickie_walk1' );
		sdMimic.img_quickie_walk2 = sdWorld.CreateImageFromFile( 'quickie_walk2' );
		
		sdMimic.death_imgs = [
			sdWorld.CreateImageFromFile( 'quickie_death1' ),
			sdWorld.CreateImageFromFile( 'quickie_death2' ),
			sdWorld.CreateImageFromFile( 'quickie_death3' )
		];
		*/
		sdMimic.death_duration = 10;
		sdMimic.post_death_ttl = 180;
		
		sdMimic.max_seek_range = 64;
		sdMimic.max_seek_range_damaged = 800;
		
		sdMimic.talk_mimicing = new WeakMap(); // sdCharacter => { words:[], voice:Object }
		sdMimic.normal_talk_delay = 5 * 1000;
		sdMimic.random_talk_delay = 15 * 1000;
		
		sdMimic.mimics = [];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( -7 ) * ( 1 - this.morph / 100 ) + ( this.x1 ) * ( this.morph / 100 ); }
	get hitbox_x2() { return ( 7 ) * ( 1 - this.morph / 100 ) + ( this.x2 ) * ( this.morph / 100 ); }
	get hitbox_y1() { return ( -7 ) * ( 1 - this.morph / 100 ) + ( this.y1 ) * ( this.morph / 100 ); }
	get hitbox_y2() { return ( 7 ) * ( 1 - this.morph / 100 ) + ( this.y2 ) * ( this.morph / 100 ); }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	static RegisterTalkIfNear( character, voice, phrase )
	{
		let any_near = false;
		
		for ( let i = 0; i < sdMimic.mimics.length; i++ )
		if ( sdWorld.inDist2D_Boolean( sdMimic.mimics[ i ].x, sdMimic.mimics[ i ].y, character.x, character.y, 1600 ) )
		{
			any_near = true;
			break;
		}
		
		if ( !any_near )
		return;
		
		let words = phrase.split('.').join(' ').split(',').join(' ').split('!').join(' ').split('?').join(' ').split(' ');
		
		let info = sdMimic.talk_mimicing.get( character );
		if ( !info )
		{
			info = {
				words: [],
				voice: null,
				spoken_times: 0,
				spoken_words_total: 0
			};
			sdMimic.talk_mimicing.set( character, info );
		}
		
		info.voice = voice;
		info.spoken_times++;
		info.spoken_words_total += words.length;
		
		for ( let i = 0; i < words.length; i++ )
		{
			let word = words[ i ];
			
			if ( word.length < 2 )
			{
			}
			else
			{
				if ( info.words.indexOf( word ) === -1 )
				{
					if ( info.words.length > 128 )
					{
						let id = ~~( Math.random() * info.words.length );
						info.words.splice( id, 1 );
					}

					info.words.push( word );
				}
			}
		}
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 300;
	
		this._hea = this._hmax;
		//this.gibbed = false; 
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = 0;
		this._next_mimic_attempt = 0;
		this._freeze_until = 0;
		
		this._next_chatter = sdWorld.time + sdMimic.normal_talk_delay + Math.random() * sdMimic.random_talk_delay;
		
		this._regen_timeout = 0;
		
		this.attacking = 0;
		this._mimicked_entity = null;
		
		this._speak_id = -1; // Required by speak effects // last voice message
		
		this._hibernation_check_timer = 30;
		
		//this.side = 1;
		
		this.d3d = 0;
		this.d = null; // Disguise
		this.title_str = null;
		this.f = 'none';
		/*this.hue = 0;
		this.br = 100;*/
		this.sh = 1;
		
		this.x1 = params.x1 || 0;
		this.y1 = params.y1 || 0;
		this.x2 = params.x2 || 0;
		this.y2 = params.y2 || 0;
		
		this.morph = 0; // 0...100, morphing into thi.d snapshot

		//this.sd_filter = params.sd_filter || null; // Custom per-pixel filter
		this.filter = null;
		
		sdMimic.mimics.push( this );
	}
	onPhysicallyStuck()
	{
		return true; // Unstuck
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.driver_of )
		character = character.driver_of;
		
		if ( this._current_target !== character )
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( ( character.hea || character._hea ) > 0 )
		{
			if ( this.d !== null )
			this._freeze_until = sdWorld.time + 5000;
			
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < this.GetMaxSeekRange() )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			if ( this.GetMaxSeekRange() === sdMimic.max_seek_range_damaged || sdWorld.CheckLineOfSight( this.x, this.y, character.x, character.y, this, null, sdCom.com_visibility_unignored_classes ) )
			{
				if ( !this._current_target )
				sdSound.PlaySound({ name:'abomination_alert', x:this.x, y:this.y, pitch:1.5 });
			
				this._current_target = character;
			}
		}
	}
	
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD;
	}
	GetBleedEffectFilter()
	{
		return '';
	}
	
	CanBuryIntoBlocks()
	{
		return 3; // 0 = no blocks, 1 = natural blocks, 2 = corruption, 3 = flesh blocks	
	}
	
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;

		//let spawn_gib = ( this._hea > -this._hmax / 80 * 100 );
		
		this._hea -= dmg;
			
		this._regen_timeout = 30;
		
		if ( initiator )
		if ( this._hea < this._hmax * 0.5 )
		{
			this._current_target = initiator;
		}
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			
			sdSound.PlaySound({ name:'abomination_death', x:this.x, y:this.y, volume: 2, pitch: 1 });

			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
		}

		if ( this._hea <= 0 )
		this.remove();
	}
	
	get mass() { return 50; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.2;
		//this.sy += y * 0.2;
	}
	/* Default fall damage
	Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 15 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	
	GetMaxSeekRange()
	{
		if ( this._hea < this._hmax * 0.75 )
		return sdMimic.max_seek_range_damaged;
	
		return sdMimic.max_seek_range;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdMimic.death_duration + sdMimic.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		{
			if ( this._hea < this._hmax )
			{
				this._regen_timeout -= GSPEED;
				if ( this._regen_timeout < 0 )
				{
					this._hea = Math.min( this._hmax, this._hea + GSPEED * 5 / 30 );
				}
			}
			
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdMimic.max_seek_range_damaged )
				this._current_target = null;
				else
				{
					//this.side = ( this._current_target.x > this.x ) ? 1 : -1;

					//if ( sdWorld.time > this._next_mimic_attempt )
					if ( this._last_jump < sdWorld.time - 100 )
					if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
					{
						//this._next_mimic_attempt = sdWorld.time + 5000;
						this._last_jump = sdWorld.time;

						let dx = ( this._current_target.x - this.x );
						let dy = ( this._current_target.y - this.y );

						let di = sdWorld.Dist2D_Vector( dx, dy );

						//if ( di < 80 )
						{
							dy -= Math.abs( dx ) * 0.5;

							if ( di > 5 )
							{
								dx /= di;
								dy /= di;

								dx *= 5;
								dy *= 5;
							}
						}
						/*else
						{
							if ( dx > 0 )
							dx = 1;
							else
							dx = -1;

							if ( dy > 0 )
							dy = 1;
							else
							dy = -1;
						}*/

						this.sx = dx;
						this.sy = dy;

						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
			else
			{
				// No target

				if ( sdWorld.is_server )
				if ( sdWorld.time > this._freeze_until )
				{
					if ( this._last_jump < sdWorld.time - 500 )
					if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
					{
						//this._next_mimic_attempt = sdWorld.time + 5000;
						this._last_jump = sdWorld.time;

						this.sx = Math.random() < 0.5 ? -2 : 2;

						if ( Math.random() < 0.5 )
						this.sy = -1;
					}
				}

				if ( this.d === null )
				{
					if ( sdWorld.is_server )
					if ( sdWorld.time > this._next_mimic_attempt )
					{
						this._next_mimic_attempt = sdWorld.time + 5000;

						let nears = sdWorld.GetAnythingNear( this.x, this.y, 128 );

						sdWorld.shuffleArray( nears );

						for ( let i = 0; i < nears.length; i++ )
						{
							let ent = nears[ i ];

							//if ( !ent.is( sdBlock ) && !ent.is( sdDoor ) )
							//if ( ent.is( sdCharacter ) )
							if ( !ent.is( sdMimic ) )
							if ( !ent.is( sdAbomination ) )
							if ( !ent.is( sdFleshGrabber ) )
							if ( !ent.is( sdEffect ) )
							if ( !ent.is( sdBullet ) )
							if ( !ent.is( sdAsteroid ) || ent.landed )
							if ( !ent.is( sdCharacter ) || !ent.flying )
							if ( !ent.is( sdGun ) || ent.class !== sdGun.CLASS_SCORE_SHARD )
							if ( ent.GetClass() !== 'sdBone' )
							//if ( ent.DrawIn3D() === FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT || ent.DrawIn3D() === FakeCanvasContext.DRAW_IN_3D_GRASS )
							//if ( ent._is_bg_entity === this._is_bg_entity || ent.is( sdGrass ) )
							if ( ent.DrawIn3D() === FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT )
							if ( ent._is_bg_entity === this._is_bg_entity )
							if ( ent.IsVisible( this ) )
							{
								let d = sdWorld.GetDrawOperations( ent );

								if ( d.length === 0 ) // Held guns
								{

								}
								else
								{
									this.d3d = ent.DrawIn3D();
									this.d = d;
									this.title_str = ent.title_str || null;
									this.sh = 1;

									this.x1 = ent._hitbox_x1;
									this.x2 = ent._hitbox_x2;
									this.y1 = ent._hitbox_y1;
									this.y2 = ent._hitbox_y2;

									this.f = 'none';
									/*this.hue = 0;
									this.br = 100;*/
													
									this._mimicked_entity = ent;

									if ( ent.is( sdCrystal ) )
									{
										if ( ent.is_big )
										this.f = sdWorld.GetCrystalHue( ent.matter_max / 4 );
										else
										this.f = sdWorld.GetCrystalHue( ent.matter_max );

										this.title_str += ' ( ' + (~~(ent.matter)) + ' / ' + ent.matter_max + ' )';
										
										this.sh = 0;
									}

									/*if ( ent.is( sdGrass ) )
									{
										this.f = ent.filter;
										this.hue = ent.hue;
										this.br = ent.br;
									}*/

									break;
								}
							}
						}
					}
				}
				else
				{
					if ( this.morph < 100 )
					this.morph = Math.min( 100, this.morph + GSPEED * 5 );
					else
					{
						if ( sdWorld.time > this._next_chatter )
						{
							this._next_chatter = sdWorld.time + sdMimic.normal_talk_delay + Math.random() * sdMimic.random_talk_delay;
							
							let info = sdMimic.talk_mimicing.get( this._mimicked_entity );
							if ( info )
							if ( info.words.length > 0 )
							{
								let words_total = Math.ceil( info.spoken_words_total / info.spoken_times * ( 0.5 + Math.random() ) );
								
								let phrase_parts = [];
								
								for ( let i = 0; i < words_total; i++ )
								{
									let word = info.words[ ~~( Math.random() * info.words.length ) ];
									
									if ( phrase_parts.indexOf( word ) === -1 )
									phrase_parts.push( word );
								}
								
								if ( phrase_parts.length > 0 )
								{
									let params = { 
										x:this.x, 
										y:this.y - 36, 
										type:sdEffect.TYPE_CHAT, 
										attachment:this, 
										attachment_x: 0,
										attachment_y: -36,
										text: phrase_parts.join(' '),
										text_censored: 0,
										voice:info.voice,
										no_ef:false
									};

									sdWorld.SendEffect( params );
								}
							}
						}
					}
				}
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			if ( this._hea > 0 )
			this.sy -= sdWorld.gravity * GSPEED * 2;
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	
		if ( sdWorld.is_server )
		this.attacking = ( sdWorld.time < this._last_bite + 250 );
		
		if ( this.death_anim === 0 )
		if ( this._current_target )
		{
			if ( this.morph > 0 )
			{
				this.morph = Math.max( 0, this.morph - GSPEED * 5 );
			}
			else
			{
				this.d = null;
			}

			if ( this._last_bite < sdWorld.time - 500 )
			{
				let nears = sdWorld.GetAnythingNear( this.x, this.y, 8 );
				let from_entity;

				sdWorld.shuffleArray( nears );

				let max_targets = 3;

				for ( var i = 0; i < nears.length; i++ )
				{
					from_entity = nears[ i ];

					let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
					let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

					if ( /*from_entity.GetClass() === 'sdCharacter' ||
						 from_entity.GetClass() === 'sdBlock' ||
						 from_entity.GetClass() === 'sdMatterContainer' ||
						 from_entity.GetClass() === 'sdMatterAmplifier' ||
						 from_entity.GetClass() === 'sdCrystalCombiner' ||
						 from_entity.GetClass() === 'sdConveyor' ||
						 from_entity.GetClass() === 'sdStorage' ||
						 from_entity.GetClass() === 'sdCrystal' ||
						 from_entity.GetClass() === 'sdJunk' ||
						 from_entity.GetClass() === 'sdTeleport' ||
						 from_entity.GetClass() === 'sdDoor' ||
						 from_entity.GetClass() === 'sdCom' ||
						 from_entity.GetClass() === 'sdNode' ||
						 from_entity.GetClass() === 'sdTurret' ||*/
						 ( !from_entity.is( sdMimic ) && 
						   !from_entity.is( sdAbomination ) && 
						   !from_entity.is( sdFleshGrabber ) && 
						   ( !from_entity.is( sdBlock ) || !from_entity._natural ) && 
						   from_entity._is_bg_entity === this._is_bg_entity && 
						   from_entity.IsTargetable( this ) 
						 ) ||
						 from_entity === this._current_target 
					)
					if ( from_entity.IsTargetable() )
					{
						this._last_bite = sdWorld.time;
						if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdDoor' )
						{
							/*if ( from_entity._reinforced_level > 0 ) // Quickies should not damage reinforced blocks to prevent raiders using them
							{
								// No damage
							}
							else*/
							from_entity.DamageWithEffect( 40, this );
						}
						else
						from_entity.DamageWithEffect( 40, this );

						this._hea = Math.min( this._hmax, this._hea + ( 20 ) );

						from_entity.PlayDamageEffect( xx, yy );
						//sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });

						if ( max_targets === 3 )
						{
							sdSound.PlaySound({ name:'abomination_attack', x:this.x, y:this.y });
						}

						max_targets--;
						if ( max_targets <= 0 )
						break;
					}
				}
			}
		}
		
		if ( sdWorld.is_server )
		{
			if ( this._last_bite < sdWorld.time - ( 1000 * 60 * 3 ) ) // 3 minutes since last attack?
			{
				this._hibernation_check_timer -= GSPEED;
				
				if ( this._hibernation_check_timer < 0 )
				{
					this._hibernation_check_timer = 30 * 30; // Check if hibernation is possible every 30 seconds
+					this.AttemptBlockBurying(); // Attempt to hibernate inside nearby blocks
				}
			}
		}
	}
	get title()
	{
		return ( this.d === null ) ? "Mimic" : ( this.title_str !== null ) ? this.title_str : '';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		{
			sdEntity.Tooltip( ctx, this.title );
		}
	}
	DrawIn3D()
	{
		if ( this.d === null )
		return FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT;
	
		return this.d3d;
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.globalAlpha = 1 - this.morph / 100;
		
		if ( ctx.globalAlpha > 0 )
		{
			ctx.save();
			{
				//ctx.scale( this.side, 1 );

				ctx.drawImageFilterCache( sdMimic.img_mimic, this.attacking * 32,0, 32,32, -16, -16, 32,32 );
			}
			ctx.restore();
		}
		
		if ( this.d )
		{
			ctx.globalAlpha = this.morph / 100;
			/*ctx.sd_hue_rotation = this.hue;
			ctx.sd_color_mult_r = this.br / 100;
			ctx.sd_color_mult_g = this.br / 100;
			ctx.sd_color_mult_b = this.br / 100;*/
			
			ctx.filter = this.f;
			
			ctx.apply_shading = !!this.sh;
		
			sdWorld.ApplyDrawOperations( ctx, this.d );
		}
			
		/*ctx.sd_hue_rotation = 0;
		ctx.sd_color_mult_r = 1;
		ctx.sd_color_mult_g = 1;
		ctx.sd_color_mult_b = 1;*/
		
		ctx.globalAlpha = 1;
		//ctx.sd_filter = null;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemoveAsFakeEntity()
	{
		let id = sdMimic.mimics.indexOf( this );
		if ( id !== -1 )
		sdMimic.mimics.splice( id, 1 );
	
	
		if ( sdWorld.is_server )
		{
			
		}
		else
		{
			if ( this._speak_id !== -1 )
			{
				meSpeak.stop( this._speak_id );
				this._speak_id = -1;
			}
		}
		
	}
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdMimic.death_duration + sdMimic.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GI, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
				
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdMimic.init_class();

export default sdMimic;