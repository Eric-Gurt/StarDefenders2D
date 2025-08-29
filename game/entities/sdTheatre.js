
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdEffect from './sdEffect.js';
import sdSound from '../sdSound.js';

import sdRenderer from '../client/sdRenderer.js';


class sdTheatre extends sdEntity
{
	static init_class()
	{
		sdTheatre.img_theatre = sdWorld.CreateImageFromFile( 'theatre' );
		
		sdTheatre.theatres = [];
		
		sdTheatre.music_lock_until = 0;
		
		sdTheatre.programs = {
			'PONG':
			{
				PLAYER1_Y: 0,
				PLAYER2_Y: 1,
				PLAYER1_SY: 2,
				PLAYER2_SY: 3,
				BALL_X: 4,
				BALL_Y: 5,
				BALL_SX: 6,
				BALL_SY: 7,
				BALL_HELD: 8,
				SCORE1: 9,
				SCORE2: 10,
				
				player_height: 10,
				player_width: 2,
				ball_radius: 2,
				margin: 2,
				
				ProgramStarted: ( theatre, program )=>
				{
					const data = [];
					
					data[ program.PLAYER1_Y ] = - program.player_height / 2;
					data[ program.PLAYER2_Y ] = - program.player_height / 2;
					data[ program.PLAYER1_SY ] = 0;
					data[ program.PLAYER2_SY ] = 0;
					data[ program.BALL_X ] = theatre._hitbox_x1 + program.margin + program.player_width + program.ball_radius;
					data[ program.BALL_Y ] = 0;
					data[ program.BALL_SX ] = 0;
					data[ program.BALL_SY ] = 0;
					data[ program.BALL_HELD ] = 1;
					data[ program.SCORE1 ] = 0;
					data[ program.SCORE2 ] = 0;
					
					theatre.program_data = data;
				},
				ProgramThink: ( theatre, program, GSPEED )=>
				{
					const data = theatre.program_data;
					
					// Prevent overshooting
					if ( GSPEED > 1 )
					GSPEED = 1;
					
					for ( let i = 0; i < 2; i++ )
					{
						const position_offset = 0 + i;
						const velocity_offset = 2 + i;
						
						const c = theatre[ 'driver' + i ];
						if ( c )
						{
							data[ velocity_offset ] += c.act_y * GSPEED * 0.5;
						}
						
						data[ velocity_offset ] = sdWorld.MorphWithTimeScale( data[ velocity_offset ], 0, 0.9, GSPEED );
						
						data[ position_offset ] += data[ velocity_offset ] * GSPEED;
						
						if ( data[ position_offset ] < theatre._hitbox_y1 + program.margin )
						{
							data[ position_offset ] = theatre._hitbox_y1 + program.margin;
							data[ velocity_offset ] = 0;
						}
						
						if ( data[ position_offset ] > theatre._hitbox_y2 - program.player_height - program.margin )
						{
							data[ position_offset ] = theatre._hitbox_y2 - program.player_height - program.margin;
							data[ velocity_offset ] = 0;
						}
						
						if ( data[ program.BALL_HELD ] && ( ( data[ program.BALL_X ] < 0 ) === ( i === 0 ) ) )
						{
							data[ program.BALL_SX ] = 0;
							data[ program.BALL_SY ] = data[ velocity_offset ];
							
							data[ program.BALL_X ] = ( i === 0 ) ? theatre._hitbox_x1 + program.margin + program.player_width + program.ball_radius : theatre._hitbox_x2 - program.player_width - program.margin - program.ball_radius;
							data[ program.BALL_Y ] = data[ position_offset ] + program.player_height / 2;
							
							if ( c && ( c._key_states.GetKey( 'Mouse1' ) || c.act_x !== 0 ) )
							{
								data[ program.BALL_HELD ] = 0;
								data[ program.BALL_SX ] = -Math.sign( data[ program.BALL_X ] ) * 1.5;
							}
						}
						
						if ( !data[ program.BALL_HELD ] )
						if ( ( data[ program.BALL_SX ] < 0 ) === ( i === 0 ) )
						{
							let x = ( i === 0 ) ? theatre._hitbox_x1 + program.margin : theatre._hitbox_x2 - program.margin;
							let y1 = data[ position_offset ];
							let y2 = data[ position_offset ] + program.player_height;
							
							let y = sdWorld.limit( y1, data[ program.BALL_Y ], y2 );
							
							//let t = 1;//100;
							//while ( t-- > 0 )
							//{
								let di = sdWorld.inDist2D( x,y, data[ program.BALL_X ], data[ program.BALL_Y ], program.ball_radius + program.player_width );
								if ( di > 0 )
								{
									/*let dx = data[ program.BALL_X ] - x;
									let dy = data[ program.BALL_Y ] - y;

									dx /= di;
									dy /= di;
									
									dx *= 0.1;
									dy *= 0.1;
									
									//data[ program.BALL_X ] += dx;
									//data[ program.BALL_Y ] += dy;
									
									data[ program.BALL_SX ] += dx;
									data[ program.BALL_SY ] += dy;*/
								
									data[ program.BALL_SX ] = -data[ program.BALL_SX ];
									data[ program.BALL_SY ] += data[ velocity_offset ];
									
									sdSound.PlaySound({ name:'player_step', x:theatre.x, y:theatre.y, volume:0.5, pitch: data[ program.BALL_X ] < 0 ? 3 : 4 });
									
									if ( Math.abs( data[ program.BALL_SX ] ) < ( program.ball_radius + program.player_width ) )
									{
										data[ program.BALL_SX ] *= 1.05;
										data[ program.BALL_SY ] *= 1.05;
									}
								}
								//else
								//break;
							//}
							//if ( Math.abs( data[ program.BALL_SX ] ) < 0.5 )
							//data[ program.BALL_SX ] = ( data[ program.BALL_SX ] < 0 ) ? -0.5 : 0.5;
						}
					}
					
					if ( !data[ program.BALL_HELD ] )
					{
						data[ program.BALL_X ] += data[ program.BALL_SX ] * GSPEED;
						data[ program.BALL_Y ] += data[ program.BALL_SY ] * GSPEED;

						if ( data[ program.BALL_Y ] < theatre._hitbox_y1 + program.margin + program.ball_radius )
						{
							data[ program.BALL_Y ] = theatre._hitbox_y1 + program.margin + program.ball_radius;
							data[ program.BALL_SY ] = Math.abs( data[ program.BALL_SY ] );
							
							sdSound.PlaySound({ name:'player_step', x:theatre.x, y:theatre.y, volume:0.5, pitch: 2 });
						}

						if ( data[ program.BALL_Y ] > theatre._hitbox_y2 - program.margin - program.ball_radius )
						{
							data[ program.BALL_Y ] = theatre._hitbox_y2 - program.margin - program.ball_radius;
							data[ program.BALL_SY ] = -Math.abs( data[ program.BALL_SY ] );
							
							sdSound.PlaySound({ name:'player_step', x:theatre.x, y:theatre.y, volume:0.5, pitch: 2 });
						}

						if ( Math.abs( data[ program.BALL_X ] ) > theatre._hitbox_x2 )
						{
							data[ program.BALL_HELD ] = 1;
							
							if ( data[ program.BALL_X ] < 0 )
							data[ program.SCORE2 ]++;
							else
							data[ program.SCORE1 ]++;
							
							sdSound.PlaySound({ name:'pop', x:theatre.x, y:theatre.y, volume:1, pitch: 0.25 });
						}
					}
				},
				ProgramRender: ( theatre, program, ctx )=>
				{
					const data = theatre.program_data;
					
					sdTheatre.ProgramPartialBackgroundFill( theatre, ctx, '#000000' );
					
					ctx.globalAlpha = 1;
					ctx.fillStyle = '#ffffff';
					ctx.fillRect( theatre._hitbox_x1 + program.margin, data[ program.PLAYER1_Y ], program.player_width, program.player_height );
					ctx.fillRect( theatre._hitbox_x2 - program.player_width - program.margin, data[ program.PLAYER2_Y ], program.player_width, program.player_height );
					
					let clip_left = 0;
					let clip_right = 0;
					
					if ( data[ program.BALL_X ] - program.ball_radius < theatre._hitbox_x1 )
					clip_left = theatre._hitbox_x1 - ( data[ program.BALL_X ] - program.ball_radius );
					
					if ( data[ program.BALL_X ] + program.ball_radius > theatre._hitbox_x2 )
					clip_right = ( data[ program.BALL_X ] + program.ball_radius ) - theatre._hitbox_x2;
					
					ctx.fillRect( data[ program.BALL_X ] - program.ball_radius + clip_left, data[ program.BALL_Y ] - program.ball_radius, program.ball_radius*2 - clip_left - clip_right, program.ball_radius*2 );
					
					ctx.font = "5.5px Verdana";
					
					ctx.textAlign = 'right';
					ctx.fillText( data[ program.SCORE1 ], -2, theatre._hitbox_y2 - 5 ); 
					
					ctx.textAlign = 'left';
					ctx.fillText( data[ program.SCORE2 ], 2, theatre._hitbox_y2 - 5 ); 
				}
			}
		};
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
					
	static ProgramPartialBackgroundFill( theatre, ctx, color )
	{
		ctx.globalAlpha = 0.6;
		ctx.fillStyle = color;
		ctx.fillRect( theatre._hitbox_x1, theatre._hitbox_y1, theatre._hitbox_x2 - theatre._hitbox_x1, theatre._hitbox_y2 - theatre._hitbox_y1 );
		ctx.globalAlpha = 1;
	}

	get hitbox_x1() { return - 128 / 2; }
	get hitbox_x2() { return 128 / 2; }
	get hitbox_y1() { return - 64 / 2; }
	get hitbox_y2() { return 64 / 2; }
	
	get hard_collision()
	{ return true; }
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 1; }
	
	/*ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		return [ 0, 0, 0 ]; // 0, 0.01, 0.01 was good until I added sdBlock offset that hides seam on high visual settings
	}*/
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		this.hea -= dmg;
		this._regen_timeout = 60;
		//this._update_version++;
		
		if ( this.hea <= 0 )
		{
			sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.5, pitch: 0.5 });
			this.remove();
		}
		else
		{
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1, pitch: 0.5 });
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 100 * 4;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		//this.source = 'twitch.video.1031472157';
		
		this.service = 'none';
		
		this.driver0 = null;
		this.driver1 = null;
		this.driver2 = null;
		this.driver3 = null;
		
		this.program_data = null; // Synced part, might use some internal variables
		this.program_name = '';
		//this._program = null; // Internal part, pointer towards global program. Has methods and in theory can have properties that are not saved with server snapshots (for now)
		
		//this.video = '1031472157';
		this.video = '';
		this.channel = null;
		
		this.volume = 50;
		
		this.looping = 0;
		
		this._playing_since = 0;
		this.playing_offset = 0;
		
		this._next_seek_allowed_in = 0;
		
		sdTheatre.theatres.push( this );
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
	}
	
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		this;
	}*/
	IsVehicle()
	{
		return true;
	}
	VehicleHidesDrivers()
	{
		return false;
	}
	VehicleHidesLegs()
	{
		return false;
	}
	DrawsHUDForDriver()
	{
		return false;
	}
	
	GetDriverSlotsCount()
	{
		return 4;
	}
	
	AddDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.program_name === '' || !this.program_data )
		return;
	
		var best_slot = -1;
		
		for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
		{
			if ( this[ 'driver' + i ] === null )
			{
				best_slot = i;
				break;
			}
		}
		
		if ( best_slot >= 0 )
		{
			this[ 'driver' + best_slot ] = c;
			
			c.driver_of = this;

			if ( c._socket )
			c._socket.SDServiceMessage( 'Picking gamepad up' );

			if ( this.type === 3 && best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1, pitch:2 });
		
			else
			if ( best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1 });
		}
		else
		{
			if ( c._socket )
			c._socket.SDServiceMessage( 'No gamepads left' );
		}
	}
	ExcludeDriver( c, force=false )
	{
		if ( !force )
		if ( !sdWorld.is_server )
		return;
		
		for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
		{
			if ( this[ 'driver' + i ] === c )
			{
				this[ 'driver' + i ] = null;
				c.driver_of = null;

				c.PhysWakeUp();
				
				if ( c._socket )
				c._socket.SDServiceMessage( 'Putting gamepad down' );
		
				return;
			}
		}
		
		if ( c._socket )
		c._socket.SDServiceMessage( 'Error: Attempted leaving vehicle in which character is not located.' );
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		/*if ( !sdWorld.is_server )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			return;
		}*/
		
		this.playing_offset = sdWorld.time - this._playing_since;
	
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this.hea < this.hmax )
		{
			this.hea = Math.min( this.hea + GSPEED, this.hmax );
			//this._update_version++;
		}
		
		if ( this.program_name !== '' )
		if ( this.program_data )
		{
			let program = sdTheatre.programs[ this.program_name ];

			if ( program.ProgramThink )
			program.ProgramThink( this, program, GSPEED );
		}
		
		
		//else
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}

	MeasureMatterCost()
	{
		return 800;
	}
	
	RequireSpawnAlign()
	{ return true; }
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	get title()
	{
		return ( this.program_name ) ? 'Computer' : 'Theatre';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.program_name )
		sdEntity.TooltipUntranslated( ctx, T( this.title + ' ( application: "')+ this.program_name+'.sd" )', 0, -10 );
		else
		sdEntity.TooltipUntranslated( ctx, T( this.title + ' ( channel: "')+this.service + ' > ' + ( this.channel || this.video ) + T('", volume: ')+this.volume+'% )', 0, -10 );
	}
	
	DrawBG( ctx, attached )
	//Draw( ctx, attached )
	{
		if ( sdShop.isDrawing )
		ctx.scale( 0.25,0.25 );
		
		ctx.drawImageFilterCache( sdTheatre.img_theatre, 0, 0, 128,64, -128/2,-64/2, 128,64 ); // Reinforced walls etc
		
		let destruction_frame;
		
		if ( this.hea > this.hmax / 4 * 3 )
		destruction_frame = 0;
		else
		if ( this.hea > this.hmax / 4 * 2 )
		destruction_frame = 1;
		else
		if ( this.hea > this.hmax / 4 * 1 )
		destruction_frame = 2;
		else
		destruction_frame = 3;
	
		if ( !sdShop.isDrawing )
		if ( destruction_frame !== 0 )
		ctx.drawImageFilterCache( sdBlock.cracks[ destruction_frame ], 0, 0, 32,32,  -128/2,-64/2, 128,64 );

		if ( sdRenderer.last_source_entity === this )
		{
			let scale = sdWorld.camera.scale * 0.84;
			
			if ( sdRenderer._visual_settings === 1 )
			scale = sdWorld.camera.scale;

			let width = ( ( ( this.x + this.hitbox_x2 - ( sdWorld.camera.x ) ) ) - ( ( this.x + this.hitbox_x1 - ( sdWorld.camera.x ) ) ) ) * scale;

            let s = 1 / 600 * width / sdRenderer.resolution_quality;
			
			let divs = [ globalThis.twitch_player_div, globalThis.youtube_player_div ];
			let services = [ 'twitch', 'youtube' ];
			
			for ( let i = 0; i < 2; i++ )
			{
				let div = divs[ i ];
				if ( this.service !== services[ i ] || sdRenderer.ad_happens )
				{
					div.style.display = 'none';
				}
				else
				{
					div.style.display = 'block';
					
					sdTheatre.music_lock_until = sdWorld.time + 1000;

					div.style.left = ( ( this.x + this.hitbox_x1 - ( sdWorld.camera.x ) ) * scale + sdRenderer.screen_width / 2 ) / sdRenderer.resolution_quality + 'px';
					div.style.top = ( ( this.y + this.hitbox_y1 - ( sdWorld.camera.y ) ) * scale + sdRenderer.screen_height / 2 + Math.sin( sdWorld.time / 30 ) * sdWorld.entity_classes.sdWeather.only_instance.quake_intensity / 100 ) / sdRenderer.resolution_quality + 'px';
					
					div.style.transform = 'scale(' + s + ')';
					div.style.transformOrigin = 'left top';

					if ( sdShop.open || sdContextMenu.open || ( sdChat.open && sdChat.style !== sdChat.STYLE_CHATBOX ) )
					div.style.opacity = '0.1';
					else
					div.style.opacity = '0.7';
				}
			}
			
			if ( this.service === 'youtube' )
			{
				globalThis.RequireYoutubePlayerAndDo( ( player )=>
				{
					if ( this.looping )
					{
						if ( this.playing_offset / 1000 > player.getDuration() )
						{
							//this.playing_offset / 1000 = this.playing_offset / 1000 % player.getDuration();
							this.playing_offset = ( ( this.playing_offset / 1000 ) % player.getDuration() ) * 1000;
						}
					}
					
					if ( Math.abs( player.getCurrentTime() - this.playing_offset / 1000 ) > 1 )
					if ( sdWorld.time > this._next_seek_allowed_in )
					{
						this._next_seek_allowed_in = sdWorld.time + 2000;
						player.seekTo( this.playing_offset / 1000 );
					}
				});
			}
			
			this.UpdateVolume();
		}
		
		if ( this.program_name !== '' )
		if ( this.program_data )
		{
			let program = sdTheatre.programs[ this.program_name ];

			if ( program.ProgramThink )
			program.ProgramRender( this, program, ctx );
		}
	}
	UpdateVolume() // Called by theatre's render and on unmute by sdRenderer.js
	{
		globalThis.SetPlayerVolume( this.volume / 100 * sdSound.GetDistanceMultForPosition( this.x, this.y ) * sdSound.volume );
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 20, 3, 0.75, 0.75, 'glass12', sdEffect.TYPE_GLASS );
	
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		var i = sdTheatre.theatres.indexOf( this );
		if ( i !== -1 )
		sdTheatre.theatres.splice( i, 1 );
	
		if ( sdRenderer.last_source_entity === this )
		{
			globalThis.RequireTwitchPlayerAndDo( ( twitch_player )=>
			{
				globalThis.twitch_player_div.style.display = 'none';
				twitch_player.setMuted( true );
			});
			globalThis.RequireYoutubePlayerAndDo( ( youtube_player )=>
			{
				globalThis.youtube_player_div.style.display = 'none';
				youtube_player.mute();
			});
		}
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 128 ) )
		{
			if ( command_name === 'SET_SOURCE' )
			if ( parameters_array.length === 1 )
			if ( typeof parameters_array[ 0 ] === 'string' )
			{
				let len1 = parameters_array[ 0 ].length;
				
				parameters_array[ 0 ] = parameters_array[ 0 ].split( 'https://www.twitch.tv/' ).join( '' );
				
				let len2 = parameters_array[ 0 ].length;
				
				parameters_array[ 0 ] = parameters_array[ 0 ].split( 'https://www.youtube.com/watch?v=' ).join( '' );
				
				let len3 = parameters_array[ 0 ].length;
				
				if ( parameters_array[ 0 ].length < 64 )
				{
					if ( len1 !== len2 )
					{
						this.service = 'twitch';

						this.channel = parameters_array[ 0 ];
						this.video = null;
					}
					else
					if ( len2 !== len3 )
					{
						this.service = 'youtube';
						
						this.channel = null;
						this.video = parameters_array[ 0 ];
					}
					else
					{
						executer_socket.SDServiceMessage( 'Unknown source. Try YouTube links or Twitch streams.' );
						return;
					}

					//this._update_version++;
					executer_socket.SDServiceMessage( 'Source updated' );
					
					this.program_data = null;
					this.program_name = '';
					
					this._playing_since = sdWorld.time;
				}
				else
				executer_socket.SDServiceMessage( 'Source appears to be too long' );
			}
			
			if ( command_name === 'SET_VOLUME' )
			if ( parameters_array.length === 1 )
			if ( parameters_array[ 0 ] === 100 || parameters_array[ 0 ] === 50 || parameters_array[ 0 ] === 25 || parameters_array[ 0 ] === 12 )
			{
				this.volume = parameters_array[ 0 ];
				//this._update_version++;
				executer_socket.SDServiceMessage( 'Volume updated' );
			}
			
			if ( command_name === 'REPLAY' )
			{
				this._playing_since = sdWorld.time;
			}
			
			if ( command_name === 'LOOP' )
			{
				this.looping = 1 - this.looping;
			}
			
			if ( command_name === 'SHIFT' )
			if ( parameters_array.length === 1 )
			{
				this._playing_since += parseInt( parameters_array[ 0 ] );
				if ( this._playing_since > sdWorld.time )
				this._playing_since = sdWorld.time;
				
				if ( isNaN( this._playing_since ) )
				this._playing_since = sdWorld.time;
			}
			
			if ( command_name === 'GO_TO_TIME' )
			if ( parameters_array.length === 1 )
			if ( typeof parameters_array[ 0 ] === 'string' )
			{
				let time = parseFloat( parameters_array[ 0 ] );
				
				this._playing_since = sdWorld.time - time * 60 * 1000;
				
				if ( isNaN( this._playing_since ) )
				this._playing_since = sdWorld.time;
			}
			
			if ( command_name === 'SET_PROGRAM' )
			if ( typeof parameters_array[ 0 ] === 'string' )
			{
				if ( sdTheatre.programs.hasOwnProperty( parameters_array[ 0 ] ) )
				{
					//this._program = sdTheatre.programs[ parameters_array[ 0 ] ];
					
					this.service = 'none';
					this.video = '';
					this.channel = null;
					
					this.program_name = parameters_array[ 0 ];
					
					let program = sdTheatre.programs[ this.program_name ];
					
					if ( program.ProgramStarted )
					program.ProgramStarted( this, program );
				
					sdSound.PlaySound({ name:'powerup_or_exp_pickup', x:this.x, y:this.y, volume:1, pitch: 0.25 });
				}
				else
				executer_socket.SDServiceMessage( 'Program not found' );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 128 ) )
		{
			this.AddPromptContextOption( 'Change video URL', 'SET_SOURCE', [ undefined ], 'Enter video or livestream URL', '', 128 );
			//this.AddPromptContextOption( 'Set to twitch live stream', 'SET_TWITCH', [ undefined ], 'Enter or paste only the channel name', this.channel, 64 );
			//this.AddPromptContextOption( 'Set to YouTube video', 'SET_YOUTUBE', [ undefined ], 'Enter or paste only the channel name', this.channel, 64 );
			this.AddContextOption( 'Set volume to 100%', 'SET_VOLUME', [ 100 ] );
			this.AddContextOption( 'Set volume to 50%', 'SET_VOLUME', [ 50 ] );
			this.AddContextOption( 'Set volume to 25%', 'SET_VOLUME', [ 25 ] );
			this.AddContextOption( 'Set volume to 12%', 'SET_VOLUME', [ 12 ] );
			this.AddContextOption( 'Replay video', 'REPLAY', [] );
			
			if ( this.looping )
			this.AddContextOption( 'Disable looping', 'LOOP', [] );
			else
			this.AddContextOption( 'Enable looping', 'LOOP', [] );
			
			this.AddContextOption( 'Go to 30 seconds in past', 'SHIFT', [ 1000 * 30 ] );
			this.AddContextOption( 'Go to 30 seconds in future', 'SHIFT', [ -1000 * 10 ] );
			this.AddPromptContextOption( 'Go to time', 'GO_TO_TIME', [ undefined ], 'Enter time, in number of minutes', '', 32 );
			
			this.AddContextOption( 'Run PONG.sd', 'SET_PROGRAM', [ 'PONG' ] );
		}
	}
}

export default sdTheatre;
