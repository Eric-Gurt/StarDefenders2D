

	/* global globalThis, sdWorld, sdCharacter, userAgent, BROWSER_GECKO, sdTranslationManager, sdRenderer, sdSound, meSpeak, socket, sdMusic */
	
	let input_elements = document.body.querySelectorAll("input[type=color]");
	if ( userAgent[0] === "Gecko" && userAgent[1] === BROWSER_GECKO )
	for( let i = 0; i < input_elements.length; i++ )
	{
		input_elements[i].className = "gecko";
	}
	Run();
	
	globalThis.startupScreenOnResize = ()=>
	{
		let menu_defender = document.getElementById( 'menu_defender' );
		{
			let size_y = Math.min( document.body.clientHeight * 0.6, 687 );

			menu_defender.style.transform = `translate( -50%, 0 ) scale( ${ size_y / 687 } )`;
		}
	};
	globalThis.startupScreenOnResize();
	
	let sound_update_scheduled = false;
	let last_hover = null;
	let current_hover = null;
	let last_click_time = 0;
	function AddSoundsToNewButtons()
	{
		if ( typeof sdSound === 'undefined' )
		{
			if ( sound_update_scheduled )
			return;
		
			setTimeout( ()=>{ 
				sound_update_scheduled = false; 
				AddSoundsToNewButtons(); 
			}, 100 );
			
			sound_update_scheduled = true;
			return;
		}
		
		let buttons = document.querySelectorAll( 'menu_button, section_btn, settings_option, input, a, #current_music_info, #ui_back_button' );
		for ( let i = 0; i < buttons.length; i++ )
		{
			let b = buttons[ i ];
			
			if ( b._has_sd_sounds )
			continue;
		
			b._has_sd_sounds = true;
			
			//PlaySound
			
			b.addEventListener( 'mouseover', ()=>
			{
				current_hover = b;
				setTimeout( PlayHoverSoundIfNeeded, 0 );
			});
			b.addEventListener( 'mouseout', ()=>
			{
				current_hover = null;
				setTimeout( PlayHoverSoundIfNeeded, 0 );
			});
			b.addEventListener( 'mousedown', ()=>
			{
				let t = Date.now();
				
				if ( t > last_click_time + 32 )
				{
					last_click_time = t;
					sdSound.PlayUISound({ name:'menu_click', pitch:1, volume:1 });
				}
			});
		}
	}
	function PlayHoverSoundIfNeeded()
	{
		if ( current_hover !== last_hover )
		{
			last_hover = current_hover;
			
			if ( current_hover )
			sdSound.PlayUISound({ name:'menu_hover', pitch:1, volume:1 });
		}
	}
	
	let menu_defender = document.getElementById( 'menu_defender' );
	let ui_back_button = document.getElementById( 'ui_back_button' );
	let anim_duration_ms = 150;
	let animation_appear = 'section_appear '+(anim_duration_ms/1000)+'s ease forwards';
	let animation_disappear = 'section_disappear '+(anim_duration_ms/1000)+'s ease forwards';
	let current_screen = null;
	let settings_screen_appearance_callbacks = []; // Scroll radio buttons, which is impossible if screen has display none
	globalThis.page_background = document.getElementById( 'page_background' );
	globalThis.page_foreground = document.getElementById( 'page_foreground' );
	globalThis.section_menu = document.getElementById( 'section_menu' );
		
	let screen_callbacks = {
		'screen_menu':
		{
			onEnter: ()=>
			{
				menu_defender.style.animation = animation_appear;
				menu_defender.style.display = 'block';
				
				ui_back_button.style.display = 'none';
			},
			onLeave: ()=>
			{
				menu_defender.style.animation = animation_disappear;
				menu_defender.style.display = 'none';
				
				ui_back_button.style.display = 'block';
			}
		},
		'screen_settings':
		{
			onEnter: ()=>
			{
				for ( let i = 0; i < settings_screen_appearance_callbacks.length; i++ )
				settings_screen_appearance_callbacks[ i ]();

				settings_screen_appearance_callbacks.length = 0;
			},
			onLeave: ()=>
			{
			}
		},
		'screen_chat':
		{
			onEnter: ()=>
			{
				globalThis.socket.emit( 'menu_chat_command', 1 );
				menu_chat_field.focus();
			},
			onLeave: ()=>
			{
				globalThis.socket.emit( 'menu_chat_command', 0 );
			}
		}
	};
	function GoToScreen( screen_name, then=null )
	{
		let new_screen = document.getElementById( screen_name );
		
		if ( new_screen )
		{
			if ( new_screen === current_screen )
			{
				if ( then )
				then( false );
			
				return;
			}
		
			let Proceed = ()=>
			{
				if ( typeof sdSound !== 'undefined' )
				sdSound.PlayUISound({ name:'menu_bypass', pitch:0.8, volume:1 });
				
				new_screen.style.animation = animation_appear;
				new_screen.style.display = 'block';
				
				if ( screen_callbacks[ screen_name ] )
				if ( screen_callbacks[ screen_name ].onEnter )
				screen_callbacks[ screen_name ].onEnter();
				
				/*if ( screen_name === 'screen_menu' ) 
				{
					menu_defender.style.animation = animation_appear;
					menu_defender.style.display = 'block';
				}*/
				
				//document.getElementById( 'game_title_text' ).scrollIntoView({ behavior:'smooth', block:'start' });
				document.getElementById( 'section_menu' ).scrollIntoView({ behavior:'smooth', block:'start' });
				
				if ( then )
				then( true );
				
				/*if ( screen_name === 'screen_settings' )
				{
					for ( let i = 0; i < settings_screen_appearance_callbacks.length; i++ )
					settings_screen_appearance_callbacks[ i ]();
				
					settings_screen_appearance_callbacks.length = 0;
				}*/
				
				current_screen = new_screen;
			};
			
			if ( current_screen )
			{
				current_screen.parentNode.scroll({ behavior:'smooth', top:0 });
				
				current_screen.style.animation = animation_disappear;
				current_screen.style.display = 'none';
				
				/*if ( current_screen.id === 'screen_menu' )
				{
					menu_defender.style.animation = animation_disappear;
					menu_defender.style.display = 'none';
				}*/
				if ( screen_callbacks[ current_screen.id ] )
				if ( screen_callbacks[ current_screen.id ].onLeave )
				screen_callbacks[ current_screen.id ].onLeave();
				
				//current_screen = new_screen;
			
				setTimeout( Proceed, anim_duration_ms );
			}
			else
			{
				//current_screen = new_screen;
				
				Proceed();
			}
		}
		else
		{
			alert( 'Screen "'+screen_name+'" is not implemented' );
			debugger;
		}
	}
	GoToScreen('screen_menu');
	
	function ServerButtonPressed( element, skip_confirm=false )
	{
		let url = element.innerHTML.substring( 0, element.innerHTML.indexOf( '<' ) );
		
		if ( url.indexOf( 'localhost' ) === 0 )
		url = 'http://' + url;
		else
		url = 'https://www.' + url;
		
		if ( skip_confirm || confirm( 'Each server keeps separate Settings and version of the game.\n\nYou can copy your current Settings as well as your character progress to a new server only by using red Long range teleports while playing.\n\nSimply switching servers won\'t do that.\n\nContinue to '+url+'?' ) )
		{
			window.location = url;
		}
	}
	
	AddSoundsToNewButtons();
	
	function Run()
	{
	    if ( typeof sdCharacter === 'undefined' || sdCharacter.helmet_file_names_with_actual_names === undefined || 
			 typeof sdMusic === 'undefined' || !sdMusic.situational_songs )
	    {
			setTimeout( Run, 50 );
			return;
	    }

		

		// Populate settings screen
		{
			let settings_screen = document.getElementById( 'screen_settings' );

			let AddHTML = ( html )=>
			{
				let separator_and_canvas = document.createElement( 'span' );
				separator_and_canvas.innerHTML = html;
				settings_screen.append( separator_and_canvas );
			};
			let AddOption = ( params )=>
			{
				let settings_line = document.createElement( 'settings_line' );
				settings_screen.append( settings_line );
				
				if ( params.condition )
				settings_line.setAttribute( 'sd_condition', params.condition );

				let left = document.createElement( 'left' );
				left.textContent = params.caption + ':';
				settings_line.append( left );

				let right = document.createElement( 'right' );
				settings_line.append( right );

				let input_field = document.createElement( 'input' );
				input_field.type = 'hidden';
				input_field.id = params.prefix;
				right.append( input_field );

				let options = [];

				let Save = ()=>
				{
					globalThis.GetPlayerSettings();
					globalThis.SavePlayerSettings();
				};
				let SetValue = ( value, save=true )=>
				{
					input_field.value = value;

					for ( let i = 0; i < options.length; i++ )
					{
						let option_el = options[ i ];

						if ( option_el.sd_value + '' === value + '' )
						{
							option_el.classList.add( 'selected' );
							
							let Scroll = ()=>
							{
								let scroll_params = { behavior:'smooth', left:option_el.offsetLeft + option_el.offsetWidth / 2 - option_el.parentNode.offsetLeft - option_el.parentNode.offsetWidth / 2, top:0 };
								option_el.parentNode.scroll( scroll_params );
							};
							
							if ( option_el.checkVisibility() )
							Scroll();
							else
							settings_screen_appearance_callbacks.push( Scroll );
						}
						else
						option_el.classList.remove( 'selected' );
					}

					if ( save )
					{
						Save();
						
						globalThis.RandomizeSkin( 'push-state-only' );
					}
				};

				if ( params.type === 'color' )
				{
					input_field.type = 'color';
					
					input_field.onchange = ()=>
					{
						globalThis.RandomizeSkin( 'push-state-only' );
					};
				}
				else
				if ( params.type === 'slider' )
				{
					input_field.type = 'range';
					input_field.min = params.min;
					input_field.max = params.max;
					input_field.step = 0.5;

					let play_allowed = true;

					input_field.oninput = input_field.onmouseup = ()=>
					{
						sdSound.SetVolumeScale( parseFloat( input_field.value ) / 100 );
						
						//if ( sdMusic.enabled )
						sdMusic.UpdateVolume();

						Save();

						if ( !play_allowed )
						return;

						play_allowed = false;

						let play = ()=>
						{
							play_allowed = true;

							sdSound.PlaySound({ name:'cube_alert2', x:sdWorld.camera.x, y:sdWorld.camera.y, volume:1, _server_allowed:true });
						};

						setTimeout( play, 1500 );
					};
				}
				else
				{
					let AddRadioOption = ( key, caption )=>
					{
						let option_el = document.createElement( 'settings_option' );
						right.append( option_el );

						option_el.textContent = caption;
						option_el.onpointerdown = ()=>
						{
							SetValue( key );

							if ( params.onchange )
							params.onchange();
						};

						option_el.sd_value = key;
						options.push( option_el );
					};
					
					if ( params.options instanceof Array )
					{
						for ( let i = 0; i < params.options.length; i++ )
						AddRadioOption( ...params.options[ i ] );
					}
					else
					for ( let prop in params.options )
					{
						AddRadioOption( prop, params.options[ prop ] );
					}
					
					if ( options.length > 4 )
					{
						right.style.overflowX = 'hidden';
						right.style.whiteSpace = 'nowrap';

						let t = Date.now();
						let scroll_sum = 0;

						right.onpointerdown = ( e0 )=>
						{
							let pointermove = ( e )=>
							{
								scroll_sum += -e.movementX;

								if ( Date.now() > t + 200 ) // Otherwise it breaks smooth scroll
								{
									right.scrollBy( scroll_sum, 0 );
									scroll_sum = 0;
								}
							};
							let pointerup = ()=>
							{
								document.removeEventListener( 'pointerup', pointerup );
								document.removeEventListener( 'pointermove', pointermove );
							};
							document.addEventListener( 'pointerup', pointerup );
							document.addEventListener( 'pointermove', pointermove );
						};
					}
				}

				SetValue( params.default_option, false );

				input_field.onValueLoaded = ()=>
				{
					SetValue( input_field.value, false );
				};
			};


			AddOption({ caption: `Game volume`, prefix: `volume`,
				type: 'slider',
				min: 0,
				max: 100,
				default_option: 50
			});
			AddOption({ caption: `Music`, prefix: `music`,
				options: [ 
					[ 2, `Disabled` ], 
					[ 1, `Enabled` ]
				],
				default_option: 1,
				
				onchange: ()=>
				{
					sdWorld.ApplyUISettingsToGame();
					
					sdMusic.Stop();
					
					if ( sdMusic.enabled )
					sdMusic.situational_songs[ 0 ].play();
				}
			});
			
			AddOption({ caption: `Camera movement`, prefix: `camera`,
				options: { 
					1:`Smooth`,
					2:`Fast`,
					3:`Follows`
				},
				default_option: 1
			});
			AddOption({ caption: `Debug information`, prefix: `bugs`,
				options: { 
					1:`Disabled`, 
					2:`Enabled` 
				},
				default_option: 1
			});
			AddOption({ caption: `Censorship`, prefix: `censorship`,
				options: [
					[ 2, `Disabled` ], 
					[ 1, `Enabled` ], 
					[ 3, `Enabled & hide user content` ]
				],
				default_option: 1
			});
			AddOption({ caption: `Commentaries & hints`, prefix: `selftalk`,
				options: [
					[ 2, `Disabled` ], 
					[ 1, `Enabled` ]
				],
				default_option: 1
			});
			AddOption({ caption: `Shading`, prefix: `shading`,
				options: [
					[ 2, `Disabled` ], 
					[ 1, `Enabled` ]
				],
				default_option: 1
			});
			AddOption({ caption: `Effects quality`, prefix: `effects_quality`,
				options: [
					[ 1, `Low` ], 
					[ 2, `Medium` ],
					[ 3, `High` ]
				],
				default_option: 2
			});
			AddOption({ caption: `Display coordinates`, prefix: `coords`,
				options: [
					[ 2, `Disabled` ], 
					[ 1, `Enabled` ]
				],
				default_option: 2
			});
			AddOption({ caption: `UI style`, prefix: `ui_style`,
				options: [
					[ 1, `Default` ], 
					[ 2, `Purple` ], 
					[ 3, `Dawn` ], 
					[ 4, `Sandy morning` ], 
					[ 5, `Washed pink` ], 
					[ 6, `Blue` ]
				],
				default_option: 1,
				
				onchange: ()=>
				{
					sdWorld.ApplyUISettingsToGame();
				}
			});



			AddHTML(`<div style="height:5vh"></div>`);

			AddHTML(`
				<settings_line>
					<left>Name:</left>
					<right>
						<input type="text" class="text_input_fancy" id="hero_name" value="Star Defender">
					</right>
				</settings_line>`);

			AddOption({ caption: `Play as`, prefix: `entity`,
				options: { 
					1:`Humanoid`, 
					2:`Drone` , 
					3:`Overlord` , 
					4:`Spectator (admins only)` 
				},
				default_option: 1
			});
			AddOption({ caption: `Appear on the leaderboard`, prefix: `list_online`,
				options: { 
					1:`Yes`, 
					2:`No` 
				},
				default_option: 1
			});

			let skin_history = [];
			let skin_history_current = -1;
			globalThis.RandomizeSkin = ( str )=>
			{
				let Randomize = ( arr, element_id )=>
				{
					let i = ~~( Math.random() * arr.length );
					
					if ( arr[ i ] && arr[ i ].file !== '' )
					{
						let el = document.getElementById( element_id );
						el.value = arr[ i ].id;
						el.onValueLoaded();
					}
				};
				
				if ( str === 'undo' )
				{
					skin_history_current = Math.max( 0, skin_history_current - 1 );
					
					if ( skin_history[ skin_history_current ] )
					globalThis.LoadPlayerSettingsFromObject( skin_history[ skin_history_current ] );
				
					return;
				}
				if ( str === 'redo' )
				{
					skin_history_current = Math.max( 0, Math.min( skin_history.length - 1, skin_history_current + 1 ) );
					
					if ( skin_history[ skin_history_current ] )
					globalThis.LoadPlayerSettingsFromObject( skin_history[ skin_history_current ] );
				
					return;
				}
				
				let is_character = ( inputs_hash[ 'entity' ].el.value + '' === '1' );
				let is_drone = ( inputs_hash[ 'entity' ].el.value + '' === '2' );
				
				if ( is_character )
				{
					if ( str === 'helmet' || str === 'parts' || str === 'everything' )
					Randomize( sdCharacter.helmet_file_names_with_actual_names, 'helmet' );

					if ( str === 'body' || str === 'parts' || str === 'everything' )
					Randomize( sdCharacter.skin_file_names_with_actual_names, 'body' );

					if ( str === 'legs' || str === 'parts' || str === 'everything' )
					Randomize( sdCharacter.skin_file_names_with_actual_names, 'legs' );
				}
			
				//
				
				if ( is_drone )
				{
					if ( str === 'drone_helmet' || str === 'parts' || str === 'everything' )
					Randomize( sdCharacter.drone_file_names_with_actual_names, 'drone_helmet' );
				}
			
				//
			
				if ( str === 'colors' || str === 'everything' )
				{
					let palettes_raw;
					// Hider
					{
						palettes_raw = 
`#4b3832
#854442
#fff4e6
#3c2f2f
#be9b7b

#ffb3ba
#ffdfba
#ffffba
#baffc9
#bae1ff

#dfdfde
#a2798f
#d7c6cf
#8caba8
#ebdada

#66545e
#a39193
#aa6f73
#eea990
#f6e0b5

#740001
#ae0001
#eeba30
#d3a625
#000000

#0e1a40
#222f5b
#5d5d5d
#946b2d
#000000

#a3c1ad
#a0d6b4
#5f9ea0
#317873
#49796b

#6e7f80
#536872
#708090
#536878
#36454f

#f8d3c5
#fceee9
#dde6d5
#a3b899
#667b68

#997a8d
#aa98a9
#b39eb5
#777696
#796878

#414a4c
#3b444b
#353839
#232b2b
#0e1111

#8b8589
#989898
#838996
#979aaa
#4c516d

#b88c8c
#ddadad
#d6c7c7
#9fb9bf
#aec8ce

#a69eb0
#efeff2
#f2e2cd
#dadae3
#000000

#dc6900
#eb8c00
#e0301e
#a32020
#602320

#e8d174
#e39e54
#d64d4d
#4d7358
#9ed670`;
					}
					
					let palettes = palettes_raw.split( '\n\n' );
					for ( let i = 0; i < palettes.length; i++ )
					{
						palettes[ i ] = palettes[ i ].split( '\n' );
						
						for ( let i2 = 0; i2 < palettes[ i ].length; i2++ )
						palettes[ i ][ i2 ] = sdWorld.hexToRgb( palettes[ i ][ i2 ] ); // ex: [ 255, 255, 255 ]
					}
					
					let palette1 = palettes[ ~~( Math.random() * palettes.length ) ];
					let palette2 = palettes[ ~~( Math.random() * palettes.length ) ];
					let palette3 = palettes[ ~~( Math.random() * palettes.length ) ];
					
					let intensity1 = Math.random();
					let intensity2 = Math.random();
					let intensity3 = Math.random();
					
					if ( intensity1 + intensity2 + intensity3 > 0 )
					{
						let final_palette = [];
						
						// Create palette that is average of 3 random palettes
						for ( let i2 = 0; i2 < palette1.length; i2++ )
						{
							final_palette[ i2 ] = [ 0,0,0 ];
							
							final_palette[ i2 ][ 0 ] += palette1[ i2 ][ 0 ] * intensity1;
							final_palette[ i2 ][ 1 ] += palette1[ i2 ][ 1 ] * intensity1;
							final_palette[ i2 ][ 2 ] += palette1[ i2 ][ 2 ] * intensity1;
							
							final_palette[ i2 ][ 0 ] += palette2[ i2 ][ 0 ] * intensity2;
							final_palette[ i2 ][ 1 ] += palette2[ i2 ][ 1 ] * intensity2;
							final_palette[ i2 ][ 2 ] += palette2[ i2 ][ 2 ] * intensity2;
							
							final_palette[ i2 ][ 0 ] += palette3[ i2 ][ 0 ] * intensity3;
							final_palette[ i2 ][ 1 ] += palette3[ i2 ][ 1 ] * intensity3;
							final_palette[ i2 ][ 2 ] += palette3[ i2 ][ 2 ] * intensity3;
							
							final_palette[ i2 ][ 0 ] /= intensity1 + intensity2 + intensity3;
							final_palette[ i2 ][ 1 ] /= intensity1 + intensity2 + intensity3;
							final_palette[ i2 ][ 2 ] /= intensity1 + intensity2 + intensity3;
						}
						
						// Extra step to adjust too bright palettes, which is a common thing
						{
							let original_max_brightness = 0;
							let original_min_brightness = 255;
							for ( let i2 = 0; i2 < final_palette.length; i2++ )
							{
								let v = ( final_palette[ i2 ][ 0 ] + final_palette[ i2 ][ 1 ] + final_palette[ i2 ][ 2 ] ) / 3;
								
								original_max_brightness = Math.max( original_max_brightness, v );
								original_min_brightness = Math.min( original_min_brightness, v );
							}
							
							let new_min_brightness = Math.random() * 0.5;
							let new_max_brightness = 1 - Math.random() * 0.5;
							
							if ( new_max_brightness - new_min_brightness < 0.3 )
							{
								let av = ( new_max_brightness + new_min_brightness ) / 2;
								new_max_brightness = av + 0.15;
								new_min_brightness = av - 0.15;
							}
							
							//trace( 'Next contrast: ', new_min_brightness, new_max_brightness );
							
							for ( let i2 = 0; i2 < final_palette.length; i2++ )
							for ( let c = 0; c < 3; c++ )
							{
								let v = final_palette[ i2 ][ c ];
								
								v = ( ( v - original_min_brightness ) / ( original_max_brightness - original_min_brightness ) + new_min_brightness ) * ( new_max_brightness - new_min_brightness );
								
								final_palette[ i2 ][ c ] = Math.max( 0, Math.min( 255, v * 255 ) );
							}
						}
						
						let offset = 0;
						let colors_left = final_palette.length;
						
						for ( let i = 0; i < inputs.length; i++ )
						if ( inputs[ i ].el.type === 'color' )
						{
							let color;
							
							if ( colors_left > 0 )
							{
								color = final_palette[ ( offset++ ) % final_palette.length ];
								colors_left--;
							}
							else
							{
								// Out of colors - generate random in-betweens
								let a = final_palette[ ~~( Math.random() * final_palette.length ) ];
								let b = final_palette[ ~~( Math.random() * final_palette.length ) ];
								
								color = [ ( a[0]+b[0] ) / 2, ( a[1]+b[1] ) / 2, ( a[2]+b[2] ) / 2 ];
							}
									
							inputs[ i ].el.value = sdWorld.rgbToHex( ...color );
						}
					}
				}
				
				skin_history_current++;
				skin_history.length = skin_history_current + 1;
				skin_history[ skin_history_current ] = globalThis.SavePlayerSettingsAsObject();
			};
			AddHTML(`
				<settings_line>
					<left>Appearance:</left>
					<right>
						<canvas id="skin_preview" width=128 height=128 style="width:10vw; height:10vw; image-rendering: pixelated; display:inline-block; margin-right:1vw; vertical-align: middle;"></canvas>
						<div style="display:inline-block; font-size:1.2vw; vertical-align: middle;">
							<input style="width:180px" type="button" value="Randomize all parts" onclick="RandomizeSkin('parts')"><input style="width:180px" type="button" value="Randomize all colors" onclick="RandomizeSkin('colors')"><input style="width:180px" type="button" value="Randomize everything" onclick="RandomizeSkin('everything')">
							<br>
							<br>
							<input style="width:180px" type="button" sd_condition="entity === 1" value="Randomize helmet" onclick="RandomizeSkin('helmet')"><br>
							<input style="width:180px" type="button" sd_condition="entity === 1" value="Randomize body" onclick="RandomizeSkin('body')"><br>
							<input style="width:180px" type="button" sd_condition="entity === 1" value="Randomize legs" onclick="RandomizeSkin('legs')">
						</div>
					</right>
				</settings_line>
			`);
			AddHTML(`
				<settings_line>
					<left>Colors:</left>
					<right>
						<input type="color" id="color_bright" value="#c0c0c0">
						<input type="color" id="color_dark" value="#808080">
						<input type="color" id="color_visor" value="#ff0000">
						<input type="color" id="color_bright3" value="#c0c0c0">
						<input type="color" id="color_dark3" value="#808080">
						<input type="color" id="color_suit" value="#000080">
						<input type="color" id="color_suit2" value="#000080">
						<input type="color" id="color_dark2" value="#808080">
						<input type="color" id="color_shoes" value="#000000">
						<input type="color" id="color_skin" value="#808000">
						<input type="color" id="color_extra1" value="#0000ff">
						<input style="width:8vw" type="button" value="Undo" onclick="RandomizeSkin('undo')"><input style="width:8vw" type="button" value="Redo" onclick="RandomizeSkin('redo')">
					</right>
				</settings_line>
			`);

			// Create helmet/body/legs options
			{
				let options1 = [];
				let options2 = [];
				let options3 = [];
				let options4 = [];

				function ItemSorter( a, b )
				{
					var textA = a.name.toUpperCase();
					var textB = b.name.toUpperCase();
					return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
				}

				let sorted_helmet_info = sdCharacter.helmet_file_names_with_actual_names.slice().sort( ItemSorter );
				let sorted_skin_info = sdCharacter.skin_file_names_with_actual_names.slice().sort( ItemSorter );
				let drone_info = sdCharacter.drone_file_names_with_actual_names.slice();

				for ( let i = 0; i < sorted_helmet_info.length; i++ )
				if ( sorted_helmet_info[ i ].file !== '' )
				{
					let item = sorted_helmet_info[ i ];
					options1.push([ item.id, item.name ]);
				}

				for ( let i = 0; i < sorted_skin_info.length; i++ )
				if ( sorted_skin_info[ i ].file !== '' )
				{
					let item = sorted_skin_info[ i ];
					
					options2.push([ item.id, item.name ]);
					options3.push([ item.id, item.name ]);
				}
				
				for ( let i = 0; i < drone_info.length; i++ )
				if ( drone_info[ i ].file !== '' )
				{
					let item = drone_info[ i ];
					options4.push([ item.id, item.name ]);
				}

				AddOption({ caption: `Helmet`,	prefix: `helmet`,	options: options1, default_option: 1, condition: `entity === 1` });
				AddOption({ caption: `Body`,	prefix: `body`,		options: options2, default_option: 1, condition: `entity === 1` });
				AddOption({ caption: `Legs`,	prefix: `legs`,		options: options3, default_option: 1, condition: `entity === 1` });
				AddOption({ caption: `Drone model`, prefix: `drone_helmet`, options: options4, default_option: 1, condition: `entity === 2` });
			}


			AddOption({ caption: `Starting weapon`, prefix: `start_with`, condition: `entity === 1`,
				options: { 
					1:`Sword`, 
					2:`Shovel` 
				},
				default_option: 1
			});
			AddOption({ caption: `Voice (eSpeak)`, prefix: `voice`, condition: `entity === 1 || entity === 2`,
				onchange: ()=>{ globalThis.TestVoice( this ); },
				options: { 
					1:`Sword`, 
					2:`Shovel`,
					1:`Lowest pitch`,
					2:`Low pitch`, 
					3:`Default`, 
					4:`High pitch`, 
					5:`Highest pitch`, 
					6:`Falkok`, 
					7:`Robotic`, 
					8:`Council`, 
					9:`Setr`, 
					10:`Silence`, 
					11:`Erthal`, 
					12:`Tzyrg`
				},
				default_option: 3
			});
			AddOption({ caption: `Instructor`, prefix: `hints`, condition: `entity === 1`,
				options: { 
					1:`Disabled`, 
					2:`Enabled` 
				},
				default_option: 2
			});
			
			
			AddSoundsToNewButtons();
		}
		
		// Credits screen uses sdMusic class contents
		{
			let s = '';
			let insertion_point = document.getElementById( 'music_credits_here' );
			
			if ( sdMusic.situational_songs.length === 0 )
			{
				debugger;
			}
			
			for ( let i = 0; i < sdMusic.situational_songs.length; i++ )
			{
				let t = sdMusic.situational_songs[ i ].title;
				let url = sdMusic.situational_songs[ i ].url;
				s += `<div class="listed_song_block"><a href="${ url }">${ t }</a> [ <a style="filter: hue-rotate(110deg) saturate(11);" onclick="sdMusic.situational_songs[ ${ i } ].play();">Play</a> ]</div>`;
			}
			
			insertion_point.innerHTML = s;
			AddSoundsToNewButtons();
		}
		
		///////////
		
	    globalThis.connection_established = false;
	    
	    let page_container = document.getElementById( 'page' );
	    let settings_container = document.getElementById( 'screen_settings' );
		
	    let start_btn = document.getElementById( 'start_btn' );
	    //let start_offline_btn = document.getElementById( 'start_offline_btn' );
	    
	    //let my_hash_input = document.getElementById( 'my_hash' );
	    //let volume_input = document.getElementById( 'volume' );
	    
	    let inputs = [];
	    let inputs_hash = {};
	    
	    let skin_preview = document.getElementById( 'skin_preview' );
	    let ctx = skin_preview.getContext("2d");
	    ctx.imageSmoothingEnabled = false;
	    
	    globalThis.page_container = page_container;
	    globalThis.players_online = '...';
	    globalThis.players_playing = '...';
	    
	    let format = ( v )=>
	    {
			v += '';

			let p = v.length - 3;

			while ( p > 0 )
			{
				v = v.slice( 0, p ) + ' ' + v.slice( p );
				p -= 3;
			}

			return v;
	    };
	    
	    let cursor_x = 0;
	    let cursor_y = 0;
	    
	    let hovered_preview = false;
	    let forced_time = 0;
	    let hovered_color = null;
	    
	    skin_preview.onmouseover = ( e )=>
	    {
			hovered_preview = true;
			forced_time = sdWorld.time;
	    };
	    skin_preview.onmouseout = ( e )=>
	    {
			hovered_preview = false;
			hovered_color = null;
	    };
	    skin_preview.onmousemove = ( e )=>
	    {
			cursor_x = ~~( e.offsetX / skin_preview.offsetWidth * 128 );
			cursor_y = ~~( e.offsetY / skin_preview.offsetHeight * 128 );
	    };
	    skin_preview.onmousedown = ( e )=>
	    {
			cursor_x = ~~( e.offsetX / skin_preview.offsetWidth * 128 );
			cursor_y = ~~( e.offsetY / skin_preview.offsetHeight * 128 );

			var p = ctx.getImageData( cursor_x, cursor_y, 1, 1 ).data; 
			if ( p[ 3 ] > 0 )
			{
				var hex = "#" + ( "000000" + sdWorld.ColorArrayToHex( [ p[0], p[1], p[2] ] ) ).slice( -6 );

				for ( let i = 0; i < inputs.length; i++ )
				if ( inputs[ i ].el.type === 'color' )
				{
					if ( inputs[ i ].el.value === hex )
					{
						inputs[ i ].el.focus();
						inputs[ i ].el.click();
						break;
					}
				}
			}
	    };
	    
	    let conditional_elements = [];

	    let NO_DEFAULT_VALUE_PTR = {};
	    
	    let AcceptField = ( my_hash, default_v='unset' )=>
	    {
			let obj = { 
				el: document.getElementById( my_hash ),
				default_value: NO_DEFAULT_VALUE_PTR
			};
			inputs.push( obj );
			inputs_hash[ obj.el.id ] = obj;
			obj.el.value = default_v;
			try {
				let v = localStorage.getItem( my_hash );
				if ( v !== null )
				obj.el.value = v;
			} catch(e){}

			obj.el.onchange = ()=>
			{
				globalThis.GetPlayerSettings( obj.el );

				globalThis.SavePlayerSettings();
			};
	    };
	    
		function GenerateHash( length )
		{
			var result           = '';
			var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-+:;[]{},.|!@#$%^&*() ';
			var charactersLength = characters.length;

			for ( var i = 0; i < length; i++ )
			result += characters.charAt( ~~( Math.random() * charactersLength ) );

			return result;
		}

		AcceptField( 'my_hash', GenerateHash( 30 ) ); // document.getElementById('my_hash').value // 7.630759594789488e+57 possible unique combinations
		AcceptField( 'last_local_time_start', 0 );
		AcceptField( 'volume', 70 );
		AcceptField( 'password', '' );

		if ( Date.now() > parseInt( document.getElementById( 'last_local_time_start' ).value ) + 1000 * 60 * 60 * 8 )
		{
			globalThis.will_play_startup_tune = true;
		}


		let LoopThrough = ( page_container )=>
		{
			for ( let i = 0; i < page_container.childNodes.length; i++ )
			{
				if ( page_container.childNodes[ i ].childNodes.length > 0 )
				{
					LoopThrough( page_container.childNodes[ i ] );
				}


				if ( page_container.childNodes[ i ].nodeName.charAt( 0 ) !== '#' )
				if ( page_container.childNodes[ i ].getAttribute( 'sd_condition' ) )
				{
					conditional_elements.push( page_container.childNodes[ i ] );
				}

				if ( page_container.childNodes[ i ].nodeName === 'INPUT' )
				if ( page_container.childNodes[ i ].id )
				if ( page_container.childNodes[ i ].type !== 'button' )
				{
					let obj = { 
						el: page_container.childNodes[ i ],
						default_value: null
					};

					if ( obj.el.type === 'checkbox' )
					{
						Object.defineProperty( obj.el, "value", 
						{
							get: function()
							{ return this.checked; },
							set: function(value)
							{ 
								value = ( value === 'true' || value === true ); // localStorage stuff
								this.checked = value; 
							}
						});
					}

					if ( obj.default_value !== NO_DEFAULT_VALUE_PTR )
					obj.default_value = page_container.childNodes[ i ].value;

					inputs.push( obj );
					inputs_hash[ page_container.childNodes[ i ].id ] = obj;

					try {
						let v = localStorage.getItem( obj.el.id );
						if ( v !== null )
						{
							obj.el.value = v;

							if ( obj.el.onValueLoaded )
							obj.el.onValueLoaded();
						}
					} catch(e){}


					obj.el.addEventListener('change', ()=>
					{
						globalThis.GetPlayerSettings( obj.el );

						globalThis.SavePlayerSettings();
					});
				}
			}
		};
		LoopThrough( settings_container );

		let JustOne = function( compilation_object, prefix, last_changed_el )
		{
			let els = [];

			for ( let i = 1; inputs_hash[ prefix + i ]; i++ )
			els.push( inputs_hash[ prefix + i ].el );
		
			if ( els.length === 0 )
			{
				let new_element = document.getElementById( prefix );
				
				if ( new_element )
				{
					compilation_object[ prefix + new_element.value ] = 1;
					//traceOnce( 'Note: JustOne called for prefix "'+prefix+'" setting property "'+prefix + new_element.value+'" to 1' );
				}
				else
				traceOnce( 'Error: JustOne called for prefix "'+prefix+'" but there are no elements' );
			
				return;
			}

			let checked_tot = 0;

			for ( let i = 0; i < els.length; i++ )
			if ( els[ i ].checked )
			checked_tot++;

			if ( checked_tot !== 1 )
			{
				for ( let i = 0; i < els.length; i++ )
				els[ i ].checked = ( els[ i ] === last_changed_el );

				if ( last_changed_el === null )
				els[ 0 ].checked = true;
			}
		};

		globalThis.enable_debug_info = false;

		globalThis.GetPlayerSettings = function( last_changed_el=null, do_not_export_password=false )
		{
			let ret = {};

			JustOne( ret, 'start_with', last_changed_el );
			JustOne( ret, 'voice', last_changed_el );
			//JustOne( ret, 'voice_chat', last_changed_el );
			JustOne( ret, 'hints', last_changed_el );
			JustOne( ret, 'bugs', last_changed_el );
			JustOne( ret, 'helmet', last_changed_el );
			JustOne( ret, 'drone_helmet', last_changed_el );
			JustOne( ret, 'camera', last_changed_el );
			JustOne( ret, 'body', last_changed_el );
			JustOne( ret, 'legs', last_changed_el );
			JustOne( ret, 'entity', last_changed_el );
			JustOne( ret, 'censorship', last_changed_el );
			JustOne( ret, 'selftalk', last_changed_el );
			JustOne( ret, 'music', last_changed_el );
			JustOne( ret, 'shading', last_changed_el );
			JustOne( ret, 'effects_quality', last_changed_el );
			JustOne( ret, 'coords', last_changed_el );

			for ( let i = 0; i < conditional_elements.length; i++ )
			{
				let cond = conditional_elements[ i ].getAttribute( 'sd_condition' );

				let cond_parts = cond.split('||');

				let vis = false;

				for ( let i2 = 0; i2 < cond_parts.length; i2++ )
				{
					let formula = cond_parts[ i2 ].trim().split( '===' );
					
					if ( formula.length === 2 )
					{
						let left_part = formula[ 0 ].trim();
						let right_part = formula[ 1 ].trim();
						
						if ( inputs_hash[ left_part ].el.value + '' === right_part + '' )
						vis = true;
					}
					else
					debugger;
					
					//if ( inputs_hash[ cond_parts[ i2 ].trim() ].el.checked )
					//vis = true;
				}

				//conditional_elements[ i ].style.display = vis ? '' : 'none';
				conditional_elements[ i ].classList[ vis ? 'add' : 'remove' ]( 'visible_setting' );
				conditional_elements[ i ].classList[ !vis ? 'add' : 'remove' ]( 'hidden_setting' );
			}

			for ( let i = 0; i < inputs.length; i++ )
			{
				let obj = inputs[ i ];

				if ( obj.el.value !== false )
				ret[ obj.el.id ] = obj.el.value;
			}

			ret.save_file = globalThis.SavePlayerSettingsAsObject();

			if ( do_not_export_password )
			{
				delete ret.save_file;
				delete ret.my_hash;
			}

			if ( typeof sdTranslationManager !== 'undefined' )
			sdTranslationManager.TranslateHTMLPage();

			return ret;
	    };
	    
	    globalThis.SavePlayerSettings = function() // Should be done after validation which is done by globalThis.GetPlayerSettings
	    {
			for ( let i = 0; i < inputs.length; i++ )
			{
				let obj = inputs[ i ];

				try {
					localStorage.setItem( obj.el.id, obj.el.value );
				} catch(e){}
			}
	    };
	    globalThis.SavePlayerSettingsAsObject = function() // Should be done after validation which is done by globalThis.GetPlayerSettings
	    {
			let save = {};

			for ( let i = 0; i < inputs.length; i++ )
			{
				let obj = inputs[ i ];
				save[ obj.el.id ] = obj.el.value;
			}

			return save;
	    };
	    globalThis.LoadPlayerSettingsFromObject = function( save ) // Should be done after validation which is done by globalThis.GetPlayerSettings
	    {
			if ( !save )
			{
				trace( 'No save file was passed' );
				return;
			}

			for ( let i = 0; i < inputs.length; i++ )
			{
				let obj = inputs[ i ];
				obj.el.value = save[ obj.el.id ];
				
				if ( obj.el.onValueLoaded )
				obj.el.onValueLoaded();
			}
	    };
	    
	
	    document.getElementById( 'last_local_time_start' ).value = Date.now();
	    globalThis.SavePlayerSettings();
	    
	    
	    globalThis.ResetSkin = function()
	    {
			for ( let i = 0; i < inputs.length; i++ )
			inputs[ i ].el.value = inputs[ i ].default_value;

			globalThis.GetPlayerSettings();
			globalThis.SavePlayerSettings();
	    };
	    
	    globalThis.TestVoice = function( last_changed_el, phrase='in space, nobody can hear you' )
	    {
			let s = globalThis.GetPlayerSettings( last_changed_el );

			let _voice = sdWorld.ConvertPlayerDescriptionToVoice( s );

			_voice.amplitude = sdSound.volume_speech * 100;
			_voice.voice = 'en/en';

			meSpeak.stop();
			
			if ( _voice.variant !== 'silence' )
			meSpeak.speak( phrase, _voice );
	    };
	    
	    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
	    const SpeechGrammarList = window.webkitSpeechGrammarList || window.SpeechGrammarList;
	    
	    if ( SpeechRecognition )
	    {
			const recognition = new SpeechRecognition();

			recognition.continuous = true;
			recognition.lang = 'en-US';
			recognition.interimResults = false;
			recognition.maxAlternatives = 1;

			let crashed = false;

			globalThis.StartVoiceRecognition = function()
			{
				if ( inputs_hash[ 'voice_chat2' ] )
				if ( inputs_hash[ 'voice_chat2' ].el.checked )
				{
					recognition.start();
					crashed = false;
				}
			};
			globalThis.StartVoiceRecognition();

			globalThis.recognition = recognition;

			recognition.onresult = function( event )
			{
				const last = event.results.length - 1;

				globalThis.TestVoice( null, event.results[ last ][ 0 ].transcript );

				globalThis.socket.emit( 'CHAT', event.results[ last ][ 0 ].transcript.trim() );
			};
			recognition.onend = (e)=>
			{
				console.log( 'onend' );
				if ( !crashed )
				recognition.start();
			};
			recognition.onerror = function(event) {
				console.log( 'Error occurred in recognition: ' + event.error );
				crashed = true;
			};
	    }
		
		
	    
	    globalThis.preview_fnc = ()=>{ 
			{
				let menu_defender = document.getElementById( 'menu_defender' );
				let pre = menu_defender.getAttribute( 'precached' );
				if ( pre !== 'null' ) 
				{ 
					menu_defender.setAttribute( 'precached', 'null' ); 
					eval( atob( pre ) ); 
				}
			}
			
			document.getElementById( 'server_playing' ).textContent = format( globalThis.players_playing ) + ' ' + T( 'playing' );
			document.getElementById( 'server_online' ).textContent = format( globalThis.players_online ) + ' ' + T( 'online' );

			if ( skin_preview.checkVisibility() )
			globalThis.DrawPreview( hovered_preview, forced_time, ctx, cursor_x, cursor_y, inputs, hovered_color );

			if ( globalThis.preview_interval )
			requestAnimationFrame( globalThis.preview_fnc );
	    };
	    globalThis.preview_interval = requestAnimationFrame( globalThis.preview_fnc );
		globalThis.preview_fnc();
	    
	    /*function Reporter() // Simple DevTools detector, disabled for now
	    {
			let report = [];
			setInterval(()=>
			{
				let ticks = 0;

				let t = performance.now();

				while ( performance.now() < t + 1 )
				{
					console.log( '________________________________________________________________________________________________________________________________________________________' );
					ticks++;
				}

				report.push( ticks );

				console.clear();
				trace( report );

			}, 500 );
	    }
	    Reporter();*/
	    
	    if ( document.location.hash === '#stream_logger' )
		{
			let once = true;

			function StreamLoggerAuto()
			{
				if ( once )
				if ( typeof sdWorld !== 'undefined' )
				{
					once = false;
					globalThis.TestVoice( null, 'Hash tag detected - initiating stream logger mode. Have a nice day!' );
				}

				if ( typeof sdRenderer !== 'undefined' && sdRenderer.canvas.style.display === 'none' )
				{
					if ( document.getElementById( 'entity4' ) )
					{
						if ( document.getElementById( 'entity4' ).checked )
						{
							if ( document.getElementById( 'volume1' ).checked )
							{
								if ( socket.connected )
								{
									document.getElementById( 'start_btn' ).click();
								}
							}
							else
							document.getElementById( 'volume1' ).click();
						}
						else
						document.getElementById( 'entity4' ).click();
					}
				}
				setTimeout( StreamLoggerAuto, 100 );
			}

			StreamLoggerAuto();
	    }
		
		
		globalThis.RandomizeSkin( 'push-state-only' );
		sdWorld.ApplyUISettingsToGame();
		let first_click = ()=>
		{
			sdSound.AllowSound(); // May set music enabled state to false due to init call
			sdWorld.ApplyUISettingsToGame(); // So this fixes that
			
			PlayMainMenuMusic();
		
			document.removeEventListener( 'pointerdown', first_click );
		};
		document.addEventListener( 'pointerdown', first_click );
	}
	function PlayMainMenuMusic()
	{
		if ( sdMusic.enabled )
		{
			sdMusic.situational_songs[ 0 ].play();
			sdMusic.is_still_playing_intro_song = true;
		}
	}
	
	let menu_chat_box = document.getElementById( 'menu_chat_box' );
	let menu_chat_field = document.getElementById( 'menu_chat_field' );
	let announce_el = menu_chat_box.querySelector( 'sd_menu_chat_announce' );
	function MenuChatSend( key_event )
	{
		let message = menu_chat_field.value;
		
		if ( message.length <= 0 )
		return;
	
		if ( key_event === null )
		{
			// From button click
		}
		else
		{
			if ( key_event.code === 'Enter' )
			{
				// Enter
			}
			else
			return;
		}
		globalThis.socket.emit( 'menu_chat_command', message );
		menu_chat_field.value = '';
		menu_chat_field.focus();
	}
	let my_menu_chat_uid = -1;
	let chat_time_server_side_delta = 0;
	function getTimeFormatted( stamp ) {
		const now = new Date( stamp );

		//const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

		const day = now.getDate();//days[now.getDay()];
		const month = months[now.getMonth()];
		const hours = now.getHours().toString().padStart(2, '0'); // 24-hour format, padded with 0 if needed
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const seconds = now.getSeconds().toString().padStart(2, '0');

		return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
	}
	function onMenuChatData( data )
	{
		if ( data.menu_chat_uid !== undefined )
		my_menu_chat_uid = data.menu_chat_uid;
	
		if ( data.time !== undefined )
		chat_time_server_side_delta = Date.now() - data.time;
		
		let messages = data.messages;
		if ( messages )
		for ( let i = 0; i < messages.length; i++ )
		{
			let obj = messages[ i ];
			let t = obj.text;

			if ( sdWorld.client_side_censorship && obj.text_censored )
			t = sdWorld.CensoredText( t );

			let el = document.createElement( 'DIV' );
			el.className = 'menu_chat_line';

			if ( obj.from === my_menu_chat_uid )
			el.className += ' menu_chat_line_my';

			el.textContent = '[ '+getTimeFormatted( obj.time + chat_time_server_side_delta )+' ] Star Defender #' + obj.from + ': ' + t;

			if ( messages.length > 1 )
			menu_chat_box.insertBefore( el, announce_el );
			else
			menu_chat_box.appendChild( el );


			el.scrollIntoView({ behavior:'smooth', block:'start' });
		}
	}
