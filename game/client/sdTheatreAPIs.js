


	globalThis.twitch_player_div = document.getElementById( 'twitch_player_div' );
	globalThis.youtube_player_div = document.getElementById( 'youtube_player_div' );
	{
		let twitch_player = null;
		let youtube_player = null;
		
		let twitch_player_load_callback = null;
		let youtube_player_load_callback = null;
		
		let twitch_loaded = false;
		let youtube_loaded = false;
		
		let player_volume = 0.01;
		
		globalThis.SetPlayerVolume = ( v )=>
		{
		    if ( v !== player_volume )
		    {
				player_volume = v;

				if ( twitch_loaded )
				twitch_player.setVolume( v );

				if ( youtube_loaded )
				youtube_player.setVolume( v * 100 );
		    }
		};
		globalThis.RequireTwitchPlayerAndDo = ( cb )=>
		{
		    if ( twitch_loaded )
			{
				cb( twitch_player );
		    }
		    else
		    {
				twitch_player_load_callback = cb;

				if ( !twitch_player )
				{
					twitch_player = new Twitch.Player( "twitch_player_div", {
					width: 600, // 128 / 64 * 300, // 400,
					height: 300, // 64 / 64 * 300,

					video: '1031472157', // Plazma Burst 2 in 46:08 by xCape

					//parent: [ window.location.href.split('/').slice( 2, 3 ).join('/') ], ports don't work
					parent: [ window.location.hostname ],
					muted: true
					});

					let next = ()=>
					{
					next = ()=>{};

					twitch_player.disableCaptions();
					twitch_player.setVolume( player_volume );
					twitch_player.setMuted( false );

					twitch_loaded = true;

					//twitch_player.setChannel( 'monstercat' );
					if ( twitch_player_load_callback )
					{
						twitch_player_load_callback( twitch_player );
						twitch_player_load_callback = null;
					}
					};
					let error = ()=>
					{
					};
					twitch_player.addEventListener( Twitch.Player.READY, next );
					twitch_player.addEventListener( Twitch.Player.ERROR, error );
				}
		    }
		};
		globalThis.RequireYoutubePlayerAndDo = ( cb )=>
		{
		    if ( youtube_loaded )
		    {
				cb( youtube_player );
		    }
		    else
		    {
			// Load the IFrame Player API code asynchronously.
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/player_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );

			// Replace the 'ytplayer' element with an <iframe> and
			// YouTube player after the API code downloads.
			globalThis.onYouTubePlayerAPIReady = ()=>
			{
			    youtube_player = new YT.Player( 'youtube_player_div', 
			    {
					width: '600',
					height: '300',
					//videoId: 'null', // 'M7lc1UVf-VE',
					autoplay: '0',
					controls: '0',
					disablekb: '1',
					enablejsapi: '1',
					modestbranding: '1',
					origin: window.location.hostname,
					events: {
						'onReady': onPlayerReady
						//'onStateChange': onPlayerStateChange
					}

			    });
			    
			    function onPlayerReady()
			    {
					globalThis.youtube_player_div = document.getElementById( 'youtube_player_div' );

					youtube_player.mute();
					youtube_player.setVolume( player_volume );

					youtube_loaded = true;

					if ( youtube_player_load_callback )
					{
						youtube_player_load_callback( youtube_player );
						youtube_player_load_callback = null;
					}
			    }
			};
		}
	};
}