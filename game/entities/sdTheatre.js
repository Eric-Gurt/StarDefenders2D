
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdSound from '../sdSound.js';

import sdRenderer from '../client/sdRenderer.js';


class sdTheatre extends sdEntity
{
	static init_class()
	{
		sdTheatre.img_theatre = sdWorld.CreateImageFromFile( 'theatre' );
		
		sdTheatre.theatres = [];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return - 128 / 2; }
	get hitbox_x2() { return 128 / 2; }
	get hitbox_y1() { return - 64 / 2; }
	get hitbox_y2() { return 64 / 2; }
	
	get hard_collision()
	{ return true; }
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 1; }
	
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
			sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.5, pitch: 0.5 });
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
		
		this.hmax = 100;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		//this.source = 'twitch.video.1031472157';
		
		this.service = 'twitch';
		
		this.video = '1031472157';
		this.channel = null;
		
		this.volume = 50;
		
		this._playing_since = 0;
		this.playing_offset = 0;
		
		this._next_seek_allowed_in = 0;
		
		sdTheatre.theatres.push( this );
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
	}
	
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		this;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			return;
		}
		
		this.playing_offset = sdWorld.time - this._playing_since;
	
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this.hea < this.hmax )
		{
			this.hea = Math.min( this.hea + GSPEED, this.hmax );
			//this._update_version++;
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
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, 'Theatre ( channel: "'+this.service + ' > ' + ( this.channel || this.video ) + '", volume: '+this.volume+'% )', 0, -10 );
	}
	
	DrawBG( ctx, attached )
	//Draw( ctx, attached )
	{
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

			let width = ( ( ( this.x + this.hitbox_x2 - ( sdWorld.camera.x ) ) ) - ( ( this.x + this.hitbox_x1 - ( sdWorld.camera.x ) ) ) ) * scale;

            let s = 1 / 600 * width;
			
			let divs = [ globalThis.twitch_player_div, globalThis.youtube_player_div ];
			let services = [ 'twitch', 'youtube' ];
			
			for ( let i = 0; i < 2; i++ )
			{
				let div = divs[ i ];
				if ( this.service !== services[ i ] )
				{
					div.style.display = 'none';
				}
				else
				{
					div.style.display = 'block';


					div.style.left = ( ( this.x + this.hitbox_x1 - ( sdWorld.camera.x ) ) * scale + sdRenderer.screen_width / 2 ) + 'px';
					div.style.top = ( ( this.y + this.hitbox_y1 - ( sdWorld.camera.y ) ) * scale + sdRenderer.screen_height / 2 + Math.sin( sdWorld.time / 30 ) * sdWorld.entity_classes.sdWeather.only_instance.quake_intensity / 100 ) + 'px';

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
					if ( Math.abs( player.getCurrentTime() - this.playing_offset / 1000 ) > 1 )
					if ( sdWorld.time > this._next_seek_allowed_in )
					{
						this._next_seek_allowed_in = sdWorld.time + 2000;
						player.seekTo( this.playing_offset / 1000 );
					}
				});
			}
			
			// TODO: Volume control
			globalThis.SetPlayerVolume( this.volume / 100 * sdSound.GetDistanceMultForPosition( this.x, this.y ) * sdSound.volume );
		}
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 10 );
	
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
			this.AddContextOption( 'Go to 30 seconds in past', 'SHIFT', [ 1000 * 30 ] );
			this.AddContextOption( 'Go to 30 seconds in future', 'SHIFT', [ -1000 * 10 ] );
			this.AddPromptContextOption( 'Go to time', 'GO_TO_TIME', [ undefined ], 'Enter time, in number of minutes', '', 32 );
		}
	}
}

export default sdTheatre;