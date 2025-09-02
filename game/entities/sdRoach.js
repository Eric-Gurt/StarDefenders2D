
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdBG from './sdBG.js';
import sdBloodDecal from './sdBloodDecal.js';
import sdCrystal from './sdCrystal.js';
import sdStorage from './sdStorage.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdCom from './sdCom.js';
import sdLamp from './sdLamp.js';

class sdRoach extends sdEntity
{
	static init_class()
	{
		sdRoach.img_roach = sdWorld.CreateImageFromFile( 'sdRoach' ); // Sprite by floor
		
		sdRoach.TYPE_ROACH = 0;
		sdRoach.TYPE_MOTH = 1;
		
		sdRoach.light_ents = [ 'sdLamp', 'sdCrystal' ]; // Same classes [ 1 / 2 ]
		sdRoach.ignored_ents = [ 'sdRoach' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	static IsLightSource( ent )
	{
		return ( ent.is( sdLamp ) || ent.is( sdCrystal ) ); // Same classes [ 2 / 2 ]
	}
	get hitbox_x1() { return ( this.bgcrawl === 1 && this.fr <= 2 ) ? -5 : -5; }
	get hitbox_x2() { return ( this.bgcrawl === 1 && this.fr <= 2 ) ? 5 : 5; }
	get hitbox_y1() { return ( this.bgcrawl === 1 && this.fr <= 2 ) ? -5 : -1; }
	get hitbox_y2() { return ( this.bgcrawl === 1 && this.fr <= 2 ) ? 5 : 3; }
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		return [ 0, 0, 30 ];
	}
	
	get hard_collision() // For world geometry where players can walk
	{ return this.fr < 5; }
	
	GetIgnoredEntityClasses()
	{
		return sdRoach.ignored_ents;
	}
	
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		this._lives_until = sdWorld.time + 1000 * 60 * 5; // Lives for 5 minutes without anybody near
	}*/
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.type = params.type || sdRoach.TYPE_ROACH;
		
		this._hea = this._hmax = this.type === sdRoach.TYPE_MOTH ? 100 : 30;
		
		this.bgcrawl = 1; // 1 if crawles on background wall, 0 if on the ground. Always tries to crawle on bg walls if there are any
		
		this.an = Math.random() * Math.PI * 2 * 100;
		this.dx = -Math.sin( this.an / 100 ) * 100;
		this.dy = -Math.cos( this.an / 100 ) * 100;
		this._walk_delay = 0;
		this._walk_duration = 0;
		
		this.fr = 0; // Frame x number basically
		this._frame_time_left = 0;
		
		this._bg_attached_to = null;
		this._decal_to_feed_from = null;
		
		this._decal_rethink_frame = 0;
		
		this._hunger = 100; // Won't eat decals if not hungry - will bite base contents randomly instead
		
		this._random_bite_timeout = 0;
		
		this.nick = '';
		this.nick_censored = '';
		
		this.strength = 1;
		
		this.sd_filter = null;
	}
	
	/*Impact( vel ) // fall damage basically
	{
		if ( vel > 30 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 5 );
		}
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
	
		let old_hp = this._hea;
	
		this._hea -= dmg;
		
		this.dx = 0;
		this.dy = 0;
		
		this.strength = 1; // Goes up if roach count is at the limit
		
		if ( this._hea <= 0 )
		{
			if ( old_hp > 0 )
			{
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );
				
				sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
				
				this._frame_time_left = 5;
				this.fr = 3; // Death
				
				this.an = 0;
			}
			//this.remove();
			
			if ( this._hea < -this._hmax / 40 * 100 )
			this.remove();
		}
		else
		{
			this._frame_time_left = 10;
			this.fr = 2; // Hurt
		}
	}
	
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		if ( this.type === sdRoach.TYPE_ROACH )
		return '';
	}
	GetBleedEffectHue()
	{
		if ( this.type === sdRoach.TYPE_MOTH )
		return 180;
	
		return 0;
	}

	get mass() { return 15; }
	
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 3; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
			}
		}
	}
	
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( sdWorld.server_config.base_degradation )
		if ( this.fr < 2 )
		{
			if ( this._random_bite_timeout <= 0 )
			if ( from_entity._is_bg_entity === this._is_bg_entity )
			if ( from_entity.IsTargetable( this ) )
			if ( ( this.nick.length === 0 && !from_entity.is( sdRoach ) ) || ( this.nick.length > 0 && from_entity.is( sdRoach ) && from_entity.nick.length === 0 ) )
			{
				if ( this.type === sdRoach.TYPE_MOTH && sdRoach.IsLightSource( from_entity ) )
				{
					this._walk_duration = 0;
					return;
				}
			
				this._random_bite_timeout = 30;
				
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;
				
				let dmg = this.nick.length > 0 ? 10 : ( 5 * this.strength * this.type === sdRoach.TYPE_MOTH ? 3 : 1 );
				
				if ( from_entity.IsPlayerClass() || from_entity.is( sdCrystal ) || from_entity.is( sdStorage ) )
				dmg = this.type === sdRoach.TYPE_ROACH ? 5 : 15;
				
				from_entity.DamageWithEffect( dmg, this );
				from_entity.PlayDamageEffect( xx, yy );
				
				if ( this.type === sdRoach.TYPE_MOTH )
				if ( from_entity.IsPlayerClass() )
				{
					from_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, ttl: 15 * 20 });
					sdWorld.SendEffect({ x: from_entity.x, y: from_entity.y, type: sdEffect.TYPE_GLOW_ALT, color: '#ff0000', radius: 0.5, scale: 2 });
				}
				
				sdSound.PlaySound({ name:'popcorn', x:xx, y:yy, volume:0.2, pitch:3 });
			}
		}
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._random_bite_timeout > 0 )
			this._random_bite_timeout -= GSPEED;
			
			if ( this._bg_attached_to )
			if ( this._bg_attached_to._is_being_removed || !this.DoesOverlapWith( this._bg_attached_to ) )
			{
				this._bg_attached_to = null;
				this.bgcrawl = 0;
			}
			
			if ( this._decal_to_feed_from )
			if ( this._decal_to_feed_from._is_being_removed )
			{
				this._decal_to_feed_from = null;
			}
			
			if ( this.fr <= 2 )
			{
				if ( this._decal_to_feed_from && this.DoesOverlapWith( this._decal_to_feed_from ) )
				{
					if ( this._hunger > 0 )
					{
						this._hunger -= GSPEED * 0.1;
						this._hea = Math.min( this._hmax, this._hea + GSPEED );
						
						if ( this._decal_to_feed_from.is( sdBloodDecal ) )
						{
							let blood_decal_ent = this._decal_to_feed_from;

							blood_decal_ent.intensity -= 0.1 * GSPEED; // Rather slowly
							if ( blood_decal_ent.intensity < 33 )
							{
								blood_decal_ent.remove();
							}
							else
							{
								blood_decal_ent._update_version++;
							}
						}
					}
				}
				else
				if ( this._hunger < 100 )
				this._hunger += GSPEED * 0.1;
			}

			if ( this.fr < 2 )
			{
				//if ( !this._bg_attached_to )
				{
					this._decal_rethink_frame = ( this._decal_rethink_frame + 1 ) % 30;
					
					both:
					for ( let a = 0; a < this._affected_hash_arrays.length; a++ )
					{
						let arr = this._affected_hash_arrays[ a ].arr;
						for ( let i = 0; i < arr.length; i++ )
						{
							let e = arr[ i ];
							
							if ( !this._bg_attached_to )
							{
								if ( e.is( sdBG ) )
								{
									if ( this.DoesOverlapWith( e ) )
									{
										this._bg_attached_to = e;
										
										if ( this.bgcrawl === 0 )
										{
											this.bgcrawl = 1;
											if ( this.CanMoveWithoutOverlap( this.x, this.y - 2 ) )
											this.y -= 2;
										}
									}
								}
							}
							else
							if ( this._decal_rethink_frame === 0 )
							{
								if ( e.is( sdBloodDecal ) )
								if ( !this._decal_to_feed_from )
								if ( Math.random() < 0.1 ) // Chaotically set other targets
								this._decal_to_feed_from = e;
					
								if ( this.nick.length > 0 )
								{
									// Attack other unnamed roaches
									if ( e.is( sdRoach ) )
									if ( e.nick.length === 0 )
									this._decal_to_feed_from = e;
								}
							}
							else
							{
								break both;
							}
						}
					}
				}
				
				let old_walk_delay = this._walk_delay;

				this._walk_delay -= GSPEED;

				if ( this._walk_delay <= 0 )
				{
					if ( old_walk_delay > 0 )
					{
						if ( this.type === sdRoach.TYPE_ROACH )
						{
							this.an = ( ( this.an + Math.random() * 120 - 60 ) % ( Math.PI * 2 * 100 ) );
						}
						else
						if ( this.type === sdRoach.TYPE_MOTH ) // Attracted to light sources
						{
							this.an = Math.random() * Math.PI * 2 * 100;
							
							let nears = sdWorld.GetAnythingNearWithLOS( this.x, this.y, 192, null, sdRoach.light_ents );
							//let nears = sdWorld.GetAnythingNear( this.x, this.y, 192, null, null, sdRoach.IsLightSource );
							for ( let i = 0; i < nears.length; i++ )
							{
								let ent = nears[ i ];
								
								if ( !ent._is_being_removed )
								//if ( sdRoach.light_ents.includes( ent.GetClass() ) )
								//if ( ent.is( sdLamp ) || ent.is( sdCrystal ) )
								//if ( sdRoach.IsLightSource( ent ) )
								//if ( sdWorld.CheckLineOfSight( this.x, this.y, ent.x, ent.y, null, null, sdCom.com_vision_blocking_classes ) ) 
								{
									this.an = Math.atan2( this.x - ent.x, this.y - ent.y ) * 100;
									break;
								}
							}
						}
						
						this.dx = -Math.sin( this.an / 100 ) * 100;
						this.dy = -Math.cos( this.an / 100 ) * 100;

						this._walk_duration = Math.random() * ( this.type === sdRoach.TYPE_MOTH ? 3 : 1 ) * 100;
						
						/*if ( this._hunger > 90 || ( this._decal_to_feed_from && this._decal_to_feed_from.is( sdRoach ) ) )
						if ( this._decal_to_feed_from )
						{
							let dx = this._decal_to_feed_from.x + ( this._decal_to_feed_from._hitbox_x1 + this._decal_to_feed_from._hitbox_x2 ) / 2 - this.x;
							let dy = this._decal_to_feed_from.y + ( this._decal_to_feed_from._hitbox_y1 + this._decal_to_feed_from._hitbox_y2 ) / 2 - this.y;
							
							let di = sdWorld.Dist2D_Vector( dx, dy );
							
							if ( di > 1 )
							{
								this.dx = dx / di * 100;
								this.dy = dy / di * 100;
								this.an = ( Math.atan2( this.dx, this.dy ) + Math.PI ) * 100;
								this._walk_duration = Math.random() * 50;
							}
							else
							{
								this.an = Math.random() * Math.PI * 2 * 100;
								this._walk_duration = Math.random() * 50;
							}
						}*/
						
						if ( this.bgcrawl === 0 )
						{
							this.dx = Math.sign( this.dx ) * 100;
							this.dy = 0;
						}
					}

					if ( this._walk_delay < -this._walk_duration )
					{
						this._walk_delay = 30 + Math.random() * 30;
						this.dx = 0;
						this.dy = 0;
					}
				}
			}

			this._frame_time_left -= GSPEED;

			if ( this._frame_time_left <= 0 )
			{
				this._frame_time_left = 5;

				if ( this._hea <= 0 )
				{
					//if ( this.fr < 6 ) // Death anim duration
					this.fr++;
					
					if ( this.fr > 30 )
					{
						this.remove();
						this._broken = false;
					}
				}
				else
				{
					if ( this.fr === 2 ) // Hurt frame
					this.fr = 0;
					else
					if ( this.fr === 0 && this._walk_delay <= 0 ) // Idle 1
					this.fr = 1;
					else
					if ( this.fr === 1 && this._walk_delay <= 0 ) // Idle 2
					this.fr = 0;
				}
			}
		}
		
		if ( this.fr >= 2 )//|| this.bgcrawl === 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;

			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		else
		{
			if ( this.fr < 2 )
			{
				if ( this.bgcrawl === 1 )
				{
					let speed = this.type === sdRoach.TYPE_MOTH ? 1 : 0.5
					this.sx += this.dx / 100 * GSPEED * speed;
					this.sy += this.dy / 100 * GSPEED * speed;
					this.PhysWakeUp();

					let vel = sdWorld.Dist2D_Vector_pow2( this.sx, this.sy );

					if ( vel > 0.1 * 0.1 )
					{
						if ( vel < 3 * 3 )
						{
							this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.5, GSPEED );
							this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.5, GSPEED );
						}
						else
						{
							this.sy += sdWorld.gravity * GSPEED;
						}

						this.ApplyVelocityAndCollisions( GSPEED, 0, true );
					}
				}
				else
				{
					this.sx += this.dx / 100 * GSPEED * 0.1;
					this.PhysWakeUp();
					
					this.sy += sdWorld.gravity * GSPEED;
			
					this.ApplyVelocityAndCollisions( GSPEED, 0, true );
				}
			}
		}
	}
	get title()
	{
		if ( this.type === sdRoach.TYPE_ROACH )
		return 'Roach';
	
		if ( this.type === sdRoach.TYPE_MOTH )
		return 'Blood moth';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.type === sdRoach.TYPE_MOTH )
		sdEntity.Tooltip( ctx, this.title );
		else
		if ( this.nick.length > 0 )
		if ( this.fr <= 2 )
		{
			let t = this.nick;
			
			if ( sdWorld.client_side_censorship && this.nick_censored )
			t = sdWorld.CensoredText( t );
		
			sdEntity.Tooltip( ctx, '"' + this.nick + '"' );
		}
	}
	Draw( ctx, attached )
	{
		/*if ( !sdShop.isDrawing )
		{
			if ( sdRenderer.visual_settings === 4 )
			ctx.sd_hue_rotation = ( (( this._net_id )%36) * 10 );
			else
			ctx.filter = 'hue-rotate('+( (( this._net_id )%36) * 10 )+'deg)';
		}
		*/
	   
		ctx.sd_filter = this.sd_filter;
	   
		if ( !sdShop.isDrawing )
		{
			if ( this.bgcrawl === 1 )
			ctx.rotate( -this.an / 100 );
			else
			ctx.scale( Math.sin( this.an / 100 ) < 0 ? 1 : -1, 1 );
		}
		
		let xx = Math.min( this.fr, 6 );
		let yy = this.bgcrawl + this.type * 2;
		
		if ( this.fr > 20 )
		ctx.globalAlpha = 0.5;
	
		if ( this.nick.length === 0 )
		if ( this.strength > 0 )
		if ( this.type !== sdRoach.TYPE_MOTH )
		{
			let f = sdWorld.CreateSDFilter();

			let rgb4 = [ 
				( 255 ),
				( 255 * ( 1 - ( this.strength - 1 ) / 39 ) ),
				( 255 * ( 1 - ( this.strength - 1 ) / 39 ) )
			];

			sdWorld.ReplaceColorInSDFilter_v2( f, '#ffffff', sdWorld.ColorArrayToHex( rgb4 ), false );
			
			ctx.sd_filter = f;
		}
		
		ctx.drawImageFilterCache( sdRoach.img_roach, xx*16,yy*16,16,16, - 8, - 8, 16,16 );
	
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
		ctx.globalAlpha = 1;
		ctx.sd_filter = null;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.type !== sdRoach.TYPE_MOTH )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			if ( command_name === 'SET_TEXT' )
			{
				if ( parameters_array.length === 1 )
				if ( typeof parameters_array[ 0 ] === 'string' )
				{
					if ( parameters_array[ 0 ].length < 100 )
					{
						this.nick = parameters_array[ 0 ];
						this.nick_censored = sdModeration.IsPhraseBad( parameters_array[ 0 ], executer_socket );
						
						if ( this.nick.length > 0 )
						this._hmax = 100;

						executer_socket.SDServiceMessage( 'Nickname updated' );
					}
					else
					executer_socket.SDServiceMessage( 'Text appears to be too long' );
				}
			}
			else
			if ( command_name === 'CREATIVE' )
			{
				this.sd_filter = sdWorld.CreateSDFilter();
				
				let rgb = [ 
					( 255 * Math.random() ),
					( 255 * Math.random() ),
					( 255 * Math.random() )
				];
				let rgb2 = rgb.slice();
				rgb2[ 0 ] *= 0.5;
				rgb2[ 1 ] *= 0.5;
				rgb2[ 2 ] *= 0.5;
				
				let rgb3 = rgb.slice();
				rgb3[ 0 ] *= 1.5;
				rgb3[ 1 ] *= 1.5;
				rgb3[ 2 ] *= 1.5;
				
				rgb3[ 0 ] = Math.min( 255, rgb3[ 0 ] );
				rgb3[ 1 ] = Math.min( 255, rgb3[ 1 ] );
				rgb3[ 2 ] = Math.min( 255, rgb3[ 2 ] );
				
				
				let rgb4 = [ 
					( 255 * Math.random() ),
					( 255 * Math.random() ),
					( 255 * Math.random() )
				];
				
				sdWorld.ReplaceColorInSDFilter_v2( this.sd_filter, '#808080', sdWorld.ColorArrayToHex( rgb ), false );
				sdWorld.ReplaceColorInSDFilter_v2( this.sd_filter, '#404040', sdWorld.ColorArrayToHex( rgb2 ), false );
				sdWorld.ReplaceColorInSDFilter_v2( this.sd_filter, '#c7c7c7', sdWorld.ColorArrayToHex( rgb3 ), false );
				
				sdWorld.ReplaceColorInSDFilter_v2( this.sd_filter, '#ffffff', sdWorld.ColorArrayToHex( rgb4 ), false );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.type !== sdRoach.TYPE_MOTH )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			this.AddPromptContextOption( 'Give a name', 'SET_TEXT', [ undefined ], 'Enter caption text', ( sdWorld.client_side_censorship && this.nick_censored ) ? sdWorld.CensoredText( this.nick ) : this.nick, 100 );
			this.AddContextOption( 'Get creative', 'CREATIVE', [ ], false );
		}
	}
}
//sdRoach.init_class();

export default sdRoach;
