/*

	Music manager

	Test song:

		sdMusic.situational_songs[ 0 ].play();


	TODO: Add all these songs once again on credits screen, when that will become a thing.

*/
/* global sdSound, sdWorld, sdRenderer, sdEntity */

class sdMusic
{
	static init_classA()
	{
		sdMusic.situational_songs = [];
		
		sdMusic.is_still_playing_intro_song = true;
		
		let CreateSituationalSong = ( params )=>
		{
			params.play_probability = 0 + Math.random() * 0.8;
			
			params.tags_raw = params.tags;
			
			let tags_arr_raw = params.tags.split( ', ' );
			params.tags = [];
			for ( let i = 0; i < tags_arr_raw.length; i++ )
			{
				let tag = tags_arr_raw[ i ];
				if ( tag.charAt( 0 ) === '"' )
				params.tags.push( { tag:tag.substring( 1, tag.length - 1 ), perfect_match:true } );
				else
				params.tags.push( { tag:tag, perfect_match:false } );
			}
			
			params.last_played = 0;
			
			params.play = ()=>
			{
				if ( sdMusic.current_song )
				{
					sdMusic.current_song.howl.stop( sdMusic.current_playback_id );
				}
				
				if ( !params.howl )
				{
					params.howl = new Howl({
						src: [ 'music/' + params.file + '.mp3' ],
						html5: true
					});
					
					params.howl.on( 'end', ()=>
					{
						if ( sdMusic.current_song === params )
						{
							sdMusic.is_still_playing_intro_song = false;
							sdMusic.current_music_info_element.style.display = 'none';
							
							sdMusic.current_song = null;
							sdMusic.current_playback_id = null;
							sdMusic.previous_song_end_time = sdWorld.time;
							params.last_played = sdWorld.time;
							
							sdMusic.Save();
						}
					});
				}

				params.howl.volume( sdSound.volume_music );
				
				let playback_id = params.howl.play();
				//params.howl.volume( sdSound.volume_music, playback_id );
				
				sdMusic.current_song = params;
				sdMusic.current_playback_id = playback_id;
				
				sdMusic.current_music_info_element.style.display = 'block';
				sdMusic.current_music_info_element.innerHTML = 'Track: ' + sdMusic.current_song.title;
				sdMusic.current_music_info_element.onmousedown = ()=>
				{
					GoToScreen( 'screen_credits', ( transition_happened )=>
					{
						document.getElementById( 'music_credits_title' ).scrollIntoView({ behavior:transition_happened ? 'instant' : 'smooth', block:'start' });;
					});
				};
			};
			
			params.CanPlay = ( ignore_global_block=false )=>
			{
				if ( ignore_global_block || !sdMusic.current_song )
				if ( ignore_global_block || sdWorld.time > sdMusic.previous_song_end_time + sdMusic.default_music_cooldown )
				if ( sdWorld.time > params.last_played + sdMusic.default_same_song_cooldown )
				return true;
		
				return false;
			};
			
			params.IncreaseProbability = ( amount )=>
			{
				params.play_probability += amount;
				
				if ( params.play_probability >= 1 )
				{
					if ( params.CanPlay() )
					{
						//trace( 'Playing song '+params.title+', last_played was ' + params.last_played );
						
						params.play_probability = 0;
						params.last_played = sdWorld.time;
						
						params.play();
						
						sdMusic.Save();
					}
				}
			};
			
			sdMusic.situational_songs.push( params );
		};
	   
		// Add songs at the end
		
		// Fighting Velox? Or other bosses?
		CreateSituationalSong({ title: 'Reinnbow - Anarchism', url: 'https://www.newgrounds.com/audio/listen/1378675', file: '1378675_Anarchism_edited', tags: 'velox, white cube, yellow cube, dreadnought, "overlord", destroyer, projectile, sdDrone' });
		// Remove voices - done
		// Can use commercially without contacting author for now
		
		// Wild alien life
		CreateSituationalSong({ title: 'Unimportance - Jackhammer', url: 'https://www.newgrounds.com/audio/listen/1381948', file: '1381948_Jackhammer_edited', tags: 'ruins, ancient, flesh, abomination, mimic, worm, corruption, stealer, anti, gib, zombie, lost, overlord' });
		// Loop-like, doesn't really fade
		// Need to contact author - no usage permission was specified
		// Sent DM on Newgrounds
		// Unimportance replied with: use of course)
		
		// Base building/surrounded by good things
		CreateSituationalSong({ title: 'larrynachos - Tunetober24 #28', url: 'https://www.newgrounds.com/audio/listen/1370925', file: '1370925_Tunetober24-28', tags: 'sdRescueTeleport, sdBaseShieldingUnit, wall, glass, sdCable, tool, score, crystal, matter, portable, hover, solar, quadro, bench, lamp, ball, popcorn, star defender, cable connection node' });
		// Needs start fade
		// Author needs to be contacted
		// Sent DM on Newgrounds
		// larrynachos replied with: Absolutely! Just be sure to credit me and message me a link to the game when it's up! // https://www.newgrounds.com/pm/read/13248548

		//High tier crystals/score progression/adventurous
		CreateSituationalSong({ title: 'BottleTopBillFanclub - Realm', url: 'https://www.newgrounds.com/audio/listen/1345377', file: '1345377_Realm', tags: 'crystal, score, tool upgrade, guanako, thruster, dimensional portal, Crystal storage' });
		// Author needs revenue share
		// Sent DM on Newgrounds
		// BottleTopBillFanclub replied with: Yes, 100% you can use my song.

		// Base cleaning/cables
		CreateSituationalSong({ title: 'pedkan - FACILITY OF DUST', url: 'https://www.newgrounds.com/audio/listen/1328206', file: '1328206_FACILITY-OF-DUST', tags: 'sdCable, roach, mop, antigravity, popcorn, ball, sdCamera, scanner' });
		// Can use commercially without contacting author for now
		
		// Fighting robots/robot bosses(?)
		CreateSituationalSong({ title: 'ConnorGrail - UNGODLY', url: 'https://www.newgrounds.com/audio/listen/1322362', file: '1322362_UNGODLY_edited', tags: 'spider, tank, bot, sdDrone, sword bot, projectile' });
		// Needs start fade - done
		// Can use commercially without contacting author for now
		
		// Fighting Erthals(?)
		CreateSituationalSong({ title: 'Credits & Info - VISION', url: 'https://www.newgrounds.com/audio/listen/1319599', file: '1319599_VISION', tags: 'erthal, spider, distress beacon, council bomb, matter drainer, matter stealer, projectile' });
		// Can use commercially without contacting author for now
		
		// Out for the hunt
		CreateSituationalSong({ title: 'ConnorGrail - CHOKE', url: 'https://www.newgrounds.com/audio/listen/1308840', file: '1308840_CHOKE-Choke-on-Silver-Snow', tags: 'virus, asp, quickie, bad dog, "overlord", shark, amphid, "worm", projectile' });
		// Can use commercially without contacting author for now
		
		// Underground(?)
		CreateSituationalSong({ title: 'Spaze & Ohmterra - Nocturna', url: 'https://www.newgrounds.com/audio/listen/1216643', file: '1216643_Spaze-amp-Ohmterra---Noctu', tags: 'deep, octopus, worm, ancient, excavator, slug, grub, anti, tutel, projectile' });
		// Non-commercial only, can use song freely in web game specifically
	
		// Some cable work/building
		CreateSituationalSong({ title: 'Reinnbow - Adventures Of An Internet Watchdog', url: 'https://www.newgrounds.com/audio/listen/1048016', file: '1048016_Adventures-Of-An-Internet-_edited', tags: '"cable", workbench, wall, glass, cage, trap, shield, turret, amplifier, weapon bench, "cable connection node", door, shielding unit, conveyor, background wall' });
		// Needs some cutting at the start and end
		// Can use commercially without contacting author for now
		
		// Some scary/creepy monsters (flesh-based?)
		CreateSituationalSong({ title: 'AnxLyen - Behold, Death', url: 'https://www.newgrounds.com/audio/listen/1355583', file: '1355583_Behold-Death', tags: 'flesh, abomination, mimic, worm, lost' });
		// UPD 2025: AnxLyen replied with: SURE THING! You can use it
		
	   
		// Add songs at the end, above this line
		
		//CreateSituationalSong({ title: '', url: '', file: '', tags: '' });
		
	}
	static init_classB()
	{
		sdMusic.enabled = false;
		
		sdMusic.debug = 0;
		
		sdMusic.default_music_cooldown = 1000 * 30; // 30 seconds
		sdMusic.default_same_song_cooldown = 1000 * 60 * 60 * 1; // 1 hour
		
		sdMusic.current_song = null;
		sdMusic.current_playback_id = null;
		sdMusic.previous_song_end_time = 0;
		
		sdMusic.current_music_info_element = document.getElementById( 'current_music_info' );
		
		//
		
		sdMusic.recent_key_presses = [];
		sdMusic.active_speakers = 0;
		sdMusic.fading_task_active = false;
		sdMusic.faded_volume = 0.1;
		sdMusic.fade_start_duration = 100;
		sdMusic.fade_end_duration = 1000;
		
		sdMusic.is_theatre_shown = false;
		
		sdMusic.Load();
		
		sdMusic.Think();
	}
	
	static Save()
	{
		try
		{
			let relative_time = sdWorld.time;
			
			let v = [ relative_time ];
			
			for ( let i = 0; i < sdMusic.situational_songs.length; i++ )
			{
				let song = sdMusic.situational_songs[ i ];
				
				v.push([ relative_time - song.last_played, Math.round( song.play_probability * 100 ) ]);
			}
			
			localStorage.setItem( 'sdMusic', JSON.stringify( v ) );
		}
		catch(e){}
	}
	static Load()
	{
		try
		{
			let v = JSON.parse( localStorage.getItem( 'sdMusic' ) );
			
			if ( v instanceof Array )
			{
				let relative_time = v.shift();
				
				for ( let i = 0; i < sdMusic.situational_songs.length; i++ )
				if ( i < v.length )
				{
					let song = sdMusic.situational_songs[ i ];
					
					song.last_played = -( v[ i ][ 0 ] - relative_time );
					song.play_probability = v[ i ][ 1 ] / 100;
				}
			}
		}
		catch(e){}
	}
	
	static onKeyDown( key_name_string )
	{
		if ( sdMusic.recent_key_presses ) // Call before init case
		sdMusic.recent_key_presses.push( { time: sdWorld.time, key:key_name_string } );
	}
	static SpeakStart()
	{
		if ( sdMusic.fading_task_active )
		{
			setTimeout( sdMusic.SpeakStart, 50 );
			return;
		}
		
		if ( sdMusic.active_speakers === 0 )
		{
			if ( sdMusic.current_song )
			{
				sdMusic.current_song.howl.fade( sdSound.volume_music, sdSound.volume_music * sdMusic.faded_volume, sdMusic.fade_start_duration, sdMusic.current_playback_id );
				
				sdMusic.fading_task_active = true;
				setTimeout( ()=>
				{
					sdMusic.fading_task_active = false;
				}, sdMusic.fade_start_duration );
			}
		}
		
		sdMusic.active_speakers++;
	}
	static SpeakStop()
	{
		if ( sdMusic.fading_task_active )
		{
			setTimeout( sdMusic.SpeakStop, 50 );
			return;
		}
		
		sdMusic.active_speakers--;
		
		if ( sdMusic.active_speakers === 0 )
		{
			if ( sdMusic.current_song )
			{
				sdMusic.current_song.howl.fade( sdSound.volume_music * sdMusic.faded_volume, sdSound.volume_music, sdMusic.fade_end_duration, sdMusic.current_playback_id );
				
				sdMusic.fading_task_active = true;
				setTimeout( ()=>
				{
					sdMusic.fading_task_active = false;
				}, sdMusic.fade_end_duration );
			}
		}
	}
	static UpdateVolume()
	{
		if ( sdMusic.current_song )
		sdMusic.current_song.howl.volume( sdSound.volume_music, sdMusic.current_playback_id );
	}
	static Stop()
	{
		if ( sdMusic.current_song )
		{
			sdMusic.is_still_playing_intro_song = false;
			sdMusic.current_music_info_element.style.display = 'none';
							
			sdMusic.current_song.howl.stop( sdMusic.current_playback_id );
			sdMusic.current_song = null;
		}
	}
	static Think()
	{
		if ( sdMusic.enabled )
		{
			let new_is_theatre_shown = ( sdWorld.time < sdTheatre.music_lock_until );
			if ( sdMusic.is_theatre_shown !== new_is_theatre_shown )
			{
				if ( new_is_theatre_shown )
				{
					sdMusic.Stop();
					sdMusic.SpeakStart();
				}
				else
				{
					sdMusic.SpeakStop();
				}
			
				sdMusic.is_theatre_shown = new_is_theatre_shown;
			}
			
			if ( sdMusic.active_speakers === 0 ) // Do not even try to play new songs when players are talking (they will not have volume fade
			if ( !sdMusic.current_song )
			if ( !document.hidden )
			{
				// Slight random boost of same strength as global probability decay. Might be pointless but will boost chances of rare songs somewhat
				/*let id = Math.floor( Math.random() * sdMusic.situational_songs.length );
				let song = sdMusic.situational_songs[ id ];
				song.IncreaseProbability( 0.001 );*/

				while ( sdMusic.recent_key_presses.length > 0 && sdMusic.recent_key_presses[ 0 ].time < sdWorld.time - 10000 )
				sdMusic.recent_key_presses.shift();

				let intensity = Math.pow( Math.min( 1, sdMusic.recent_key_presses.length / 25 ), 2 ) * 0.1; // 15 when figting, 20 is during intense fight

				if ( sdWorld.my_entity )
				if ( sdWorld.my_entity.hea > 0 )
				{
					if ( sdWorld.my_entity.hea < sdWorld.my_entity.hmax * 0.5 )
					intensity *= 2;

					if ( sdWorld.my_key_states )
					if ( sdWorld.my_key_states.GetKey( 'Mouse1' ) )
					intensity *= 2;
				}

				if ( intensity > 0 )
				{
					let visible_entities = sdRenderer.GetVisibleEntities();

					if ( visible_entities.length > 0 )
					for ( let r = 0; r < 50; r++ )
					//for ( let i = 0; i < visible_entities.length; i++ )
					{
						let i = Math.floor( Math.random() * visible_entities.length );
						let ent = visible_entities[ i ];

						let entity_multiplier = 1;

						if ( ent._hiberstate !== sdEntity.HIBERSTATE_ACTIVE )
						entity_multiplier *= 0.25;

						let hea = ( ent._hmax || ent.hmax || ent.hea || ent._hea || 0 );

						if ( hea >= 20000 )
						entity_multiplier *= 16;
						else
						if ( hea >= 10000 )
						entity_multiplier *= 8;
						else
						if ( hea >= 5000 )
						entity_multiplier *= 4;

						let title = ent.title;
						let class_name = ent.GetClass();

						if ( typeof title === 'string' )
						{
							title = title.toLowerCase();

							for ( let s = 0; s < sdMusic.situational_songs.length; s++ )
							{
								let song = sdMusic.situational_songs[ s ];

								let tags = song.tags;

								for ( let t = 0; t < tags.length; t++ )
								{
									let tag_obj = tags[ t ];

									if ( tag_obj.perfect_match )
									{
										if ( tag_obj.tag === title || tag_obj.tag === class_name )
										{
											song.IncreaseProbability( entity_multiplier * intensity * ( 0.5 + Math.random() * 0.5 ) );
											break; // Only 1 tag per entity
										}
									}
									else
									{
										if ( title.indexOf( tag_obj.tag ) !== -1 || tag_obj.tag === class_name )
										{
											song.IncreaseProbability( entity_multiplier * intensity * ( 0.5 + Math.random() * 0.5 ) );
											break; // Only 1 tag per entity
										}
									}
								}
							}
						}
					}
				}


				let most_probable = null;
				let most_probable_value = -1;

				// Decrease probabilities near high probability so wrong songs aren't played due to nothing intense happening
				for ( let s = 0; s < sdMusic.situational_songs.length; s++ )
				{
					let song = sdMusic.situational_songs[ s ];

					if ( sdMusic.debug )
					if ( song.play_probability > most_probable_value )
					if ( song.CanPlay( true ) )
					{
						most_probable = song;
						most_probable_value = song.play_probability;
					}

					if ( song.play_probability > 0.9 )
					song.play_probability -= 0.001;
				}

				if ( sdMusic.debug )
				{
					sdRenderer.service_mesage_until = sdWorld.time + 3000;
					sdRenderer.service_mesage = 'Gameplay intensity (for music): ' + intensity + ' / Most probable tags ('+Math.floor( most_probable_value * 100 )+'%): ' + ( most_probable ? most_probable.tags_raw.substring( 0, 90 ) : 'All songs are rate-blocked' ) + '...';
				}
			}
		}
		
		setTimeout( sdMusic.Think, 1000 );
	}
}
//sdMusic.init_class(); // Called when game started instead now
sdMusic.init_classA();