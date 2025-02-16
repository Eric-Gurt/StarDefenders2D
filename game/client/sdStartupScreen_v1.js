let input_elements = document.body.querySelectorAll("input[type=color]");
	if ( userAgent[0] === "Gecko" && userAgent[1] === BROWSER_GECKO )
	for( let i = 0; i < input_elements.length; i++ )
	{
		input_elements[i].className = "gecko";
	}
	Run();
	
	function Run()
	{
	    if ( typeof sdCharacter === 'undefined' ||
		 sdCharacter.helmet_file_names_with_actual_names === undefined )
	    {
		setTimeout( Run, 50 );
		return;
	    }
		
	    globalThis.connection_established = false;
	    
	    let settings_container = document.getElementById( 'settings_container' );
	    let start_btn = document.getElementById( 'start_btn' );
	    //let start_offline_btn = document.getElementById( 'start_offline_btn' );
	    
	    //let my_hash_input = document.getElementById( 'my_hash' );
	    //let volume_input = document.getElementById( 'volume' );
	    
	    let inputs = [];
	    let inputs_hash = {};
	    
	    let skin_preview = document.getElementById( 'skin_preview' );
	    let ctx = skin_preview.getContext("2d");
	    ctx.imageSmoothingEnabled = false;
	    
	    globalThis.settings_container = settings_container;
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
		cursor_x = e.offsetX;
		cursor_y = e.offsetY;
	    };
	    skin_preview.onmousedown = ( e )=>
	    {
		cursor_x = e.offsetX;
		cursor_y = e.offsetY;
		
		var p = ctx.getImageData( cursor_x, cursor_y, 1, 1 ).data; 
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
	    };
	    
	    globalThis.preview_fnc = ()=>{ 
		globalThis.DrawPreview( hovered_preview, forced_time, settings_container, ctx, start_btn, inputs_hash, cursor_x, cursor_y, inputs, format, hovered_color );
		
		if ( globalThis.preview_interval )
		requestAnimationFrame( globalThis.preview_fnc );
	    };
	    globalThis.preview_interval = requestAnimationFrame( globalThis.preview_fnc );
	    
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
	    
	    // Create helmet/body/legs options
	    {
		let place_helmets_here = document.getElementById( 'place_helmets_here' );
		let place_bodies_here = document.getElementById( 'place_bodies_here' );
		let place_legs_here = document.getElementById( 'place_legs_here' );

		let compiled_helmets = '';
		let compiled_bodies = '';
		let compiled_legs = '';

		function ItemSorter( a, b )
		{
		    var textA = a.name.toUpperCase();
		    var textB = b.name.toUpperCase();
		    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
		}

		let sorted_helmet_info = sdCharacter.helmet_file_names_with_actual_names.slice().sort( ItemSorter );
		let sorted_skin_info = sdCharacter.skin_file_names_with_actual_names.slice().sort( ItemSorter );

		for ( let i = 0; i < sorted_helmet_info.length; i++ )
		if ( sorted_helmet_info[ i ].file !== '' )
		{
		    let item = sorted_helmet_info[ i ];

		    if ( compiled_helmets.length > 0 )
		    compiled_helmets += `<br>`;

		    compiled_helmets += 
		    `<input type="checkbox" id="helmet${ item.id }" value="${ item.id }">
		    <label for="helmet${ i }">${ item.name }</label>`;
		}

		for ( let i = 0; i < sorted_skin_info.length; i++ )
		if ( sorted_skin_info[ i ].file !== '' )
		{
		    let item = sorted_skin_info[ i ];

		    if ( compiled_bodies.length > 0 )
		    {
			compiled_bodies += `<br>`;
			compiled_legs += `<br>`;
		    }

		    compiled_bodies += 
		    `<input type="checkbox" id="body${ item.id }" value="${ item.id }">
		    <label for="body${ i }">${ item.name }</label>`;

		    compiled_legs += 
		    `<input type="checkbox" id="legs${ item.id }" value="${ item.id }">
		    <label for="legs{ i }">${ item.name }</label>`;
		}

		place_helmets_here.innerHTML += compiled_helmets;
		place_bodies_here.innerHTML += compiled_bodies;
		place_legs_here.innerHTML += compiled_legs;
	    }
			
	    let LoopThrough = ( settings_container )=>
	    {
		for ( let i = 0; i < settings_container.childNodes.length; i++ )
		{
		    if ( settings_container.childNodes[ i ].childNodes.length > 0 )
		    {
			LoopThrough( settings_container.childNodes[ i ] );
		    }
		    
		    
		    if ( settings_container.childNodes[ i ].nodeName.charAt( 0 ) !== '#' )
		    if ( settings_container.childNodes[ i ].getAttribute( 'mycondition' ) )
		    {
			conditional_elements.push( settings_container.childNodes[ i ] );
		    }
		    
		    if ( settings_container.childNodes[ i ].nodeName === 'INPUT' )
		    if ( settings_container.childNodes[ i ].id )
		    if ( settings_container.childNodes[ i ].type !== 'button' )
		    {
			
			let obj = { 
			    el: settings_container.childNodes[ i ],
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
				    this.checked = value; }
			    });
			}

			if ( obj.default_value !== NO_DEFAULT_VALUE_PTR )
			obj.default_value = settings_container.childNodes[ i ].value;

			inputs.push( obj );
			inputs_hash[ settings_container.childNodes[ i ].id ] = obj;

			try {
			    let v = localStorage.getItem( obj.el.id );
			    if ( v !== null )
			    obj.el.value = v;
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
	    
	    let JustOne = function( prefix, last_changed_el )
	    {
		let els = [];
		
		for ( let i = 1; inputs_hash[ prefix + i ]; i++ )
		els.push( inputs_hash[ prefix + i ].el );
	    
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
		
		JustOne( 'start_with', last_changed_el );
		JustOne( 'voice', last_changed_el );
		//JustOne( 'voice_chat', last_changed_el );
		JustOne( 'hints', last_changed_el );
		JustOne( 'bugs', last_changed_el );
		JustOne( 'helmet', last_changed_el );
		JustOne( 'drone_helmet', last_changed_el );
		JustOne( 'camera', last_changed_el );
		JustOne( 'body', last_changed_el );
		JustOne( 'legs', last_changed_el );
		JustOne( 'entity', last_changed_el );
		JustOne( 'censorship', last_changed_el );
		JustOne( 'selftalk', last_changed_el );
		JustOne( 'music', last_changed_el );
		JustOne( 'shading', last_changed_el );
		
		for ( let i = 0; i < conditional_elements.length; i++ )
		{
		    let cond = conditional_elements[ i ].getAttribute( 'mycondition' );
		    
		    let cond_parts = cond.split('||');
		    
		    let vis = false;
		    
		    for ( let i2 = 0; i2 < cond_parts.length; i2++ )
		    {
			if ( inputs_hash[ cond_parts[ i2 ].trim() ].el.checked )
			vis = true;
		    }
		    
		    conditional_elements[ i ].style.display = vis ? '' : 'none';
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
	}