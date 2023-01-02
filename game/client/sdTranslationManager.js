/*

	Ideally, this will auto-translate lines by sending requests to a main server and then updating unknown texts live, if such translation provided.
	There would be database of translations on server-side which players will download automatically when game starts. Or we actually might send translations as part of event model.

	Server staff could see requested lines and update them accordingly, or mark as untranslateable. And only for languages that are needed.

	Texts with HTML elements are prepared to be passed as arrays of tokens, where elements 1, 3, 5... can be provided with translation, while 2, 4, 6... can not be provided - for security reasons.

	Make sure <, > and " characters can't be provided in translations - just so anybody could manage translations. Use &lt; &gt; &quot; instead.

	It all likely needs to work on top of database, which is also not ready for now...



	Usage could be something like: 

		this.title = T( 'Virus' ); // For JS version, but, to be fair, it probably could make sense to translate all titles by default, except for user generated ones.

	and for HTML pages this could be called (as many times as needed since it remembers which HTML elements are translated):

		sdTranslationManager.TranslateHTMLPage();


	Usually < and > means substring which should also be translated

	[ and ] means substrings that should not be translated, for example nicknames and matter amount

*/

/* global globalThis, sd_events */

class sdTranslationManager
{
	static init_class()
	{
		globalThis.T = sdTranslationManager.GetTranslationOrScheduleWithCalback;
		
		sdTranslationManager.language = 'en';
		
		try
		{
			sdTranslationManager.language = localStorage.getItem( 'language' ) || 'en';
		}
		catch(e)
		{
		}
		
		sdTranslationManager.translations = new Map(); // English string -> { requested_languages:new Set(), en:string, ua:string, callbacks } // These are requested in bulk manner, whenever language changes - it re-requests translations for new language
		
		sdTranslationManager.bulk_collector_timeout = null;
	}
	
	static GetTranslationObjectFor( text, old_version=null )
	{
		if ( !old_version )
		old_version = { text:'', preformatted:null, nested_translateables:null, untranslateables:null, stripped_tags:'' };
		
		if ( old_version.text !== text ) // Retranslate needed?
		{
			old_version.text = text;
			
			[
				old_version.preformatted,
				old_version.nested_translateables,
				old_version.untranslateables,
				old_version.stripped_tags
			] = sdTranslationManager.DecodeAndReplaceTagsFromPhrase( text );
			
			old_version.GetTranslated = ()=>
			{
				return sdTranslationManager.TranslateConsideringTags( T( old_version.preformatted ), old_version.nested_translateables, old_version.untranslateables );
			};
		}
		
		return old_version;
	}
	static DecodeAndReplaceTagsFromPhrase( text )
	{
		let nested_translateables = [];
		let untranslateables = [];
		
		let stripped_tags = text.split('<').join('').split('>').join('').split('[').join('').split(']').join('');

		while ( true )
		{
			let ptr = text.indexOf( '<' );
			if ( ptr === -1 )
			break;

			let ptr2 = text.indexOf( '>', ptr );
			if ( ptr2 === -1 )
			break;

			nested_translateables.push( text.substring( ptr + 1, ptr2 ) );

			text = text.substring( 0, ptr ) + '{'+(nested_translateables.length)+'}' + text.substring( ptr2 + 1 );
		}

		while ( true )
		{
			let ptr = text.indexOf( '[' );
			if ( ptr === -1 )
			break;

			let ptr2 = text.indexOf( ']', ptr );
			if ( ptr2 === -1 )
			break;

			untranslateables.push( text.substring( ptr + 1, ptr2 ) );

			text = text.substring( 0, ptr ) + '{'+(-untranslateables.length)+'}' + text.substring( ptr2 + 1 );
		}

		return [ text, nested_translateables, untranslateables, stripped_tags ];
	}
	static TranslateConsideringTags( t, nested_translateables, untranslateables )
	{
		t = T( t );
				
		if ( nested_translateables )
		{
			for ( let i = 0 ; i < nested_translateables.length; i++ )
			t = t.split( '{'+(i+1)+'}' ).join( T( nested_translateables[ i ] ) );
		}
		if ( untranslateables )
		{
			for ( let i = 0 ; i < untranslateables.length; i++ )
			t = t.split( '{'+(-(i+1))+'}' ).join( untranslateables[ i ] );
		}
		
		return t;
	}
	
	static GetMakeTranslationObject( str )
	{
		let translation_obj = sdTranslationManager.translations.get( str );
		
		if ( translation_obj === undefined )
		{
			translation_obj = {
				requested_languages: new Set(),
				en: str,
				callbacks: [] // Callbacks are actually stacked indefinitely
			};
			sdTranslationManager.translations.set( str, translation_obj );
		}
		
		return translation_obj;
	}
	
	static GetTranslationOrScheduleWithCalback( str, callback=null )
	{
		if ( sdTranslationManager.language === 'en' )
		return str;
	
		//if ( str === 'Eric Gurt' )
		//debugger;
		
		let translation_obj = sdTranslationManager.GetMakeTranslationObject( str );
		
		if ( callback )
		{
			if ( translation_obj.callbacks.indexOf( callback ) === -1 )
			translation_obj.callbacks.push( callback );
		}

		if ( translation_obj[ sdTranslationManager.language ] !== undefined )
		{
			if ( callback )
			callback( translation_obj[ sdTranslationManager.language ] );
		
			return translation_obj[ sdTranslationManager.language ];
		}
		else
		{
			sdTranslationManager.RequireSync();
		
			return str;
		}
	}
	
	static RequireSync()
	{
		if ( sdTranslationManager.bulk_collector_timeout === null )
		sdTranslationManager.bulk_collector_timeout = setTimeout( sdTranslationManager.ReqeustTranslations, 50 );
	}
	
	static TranslationArrived( lang, en, translated )
	{
		let translation_obj = sdTranslationManager.GetMakeTranslationObject( en );
		
		if ( translation_obj[ lang ] !== translated )
		{
			translation_obj[ lang ] = translated;
			
			translation_obj.requested_languages.add( lang ); // Prevent further requesting

			if ( lang === sdTranslationManager.language )
			for ( let i = 0; i < translation_obj.callbacks.length; i++ )
			{
				try
				{
					translation_obj.callbacks[ i ]( translated );
				}
				catch( e )
				{
					translation_obj.callbacks.splice( i, 1 );
					i--;
					continue;
				}
			}
		}
	}
	
	static ReqeustTranslations()
	{
		let arr = [];
		
		sdTranslationManager.translations.forEach( ( translation_obj, en )=>
		{
			if ( !translation_obj.requested_languages.has( sdTranslationManager.language ) )
			{
				translation_obj.requested_languages.add( sdTranslationManager.language );
				
				arr.push( en );
			}
		});
		
		if ( arr.length > 0 )
		sd_events.push( [ 'T', sdTranslationManager.language, arr ] );
	
		sdTranslationManager.bulk_collector_timeout = null;
	}
	
	/*static Translate( str )
	{
		let r = '';
		for ( let i = 0; i < str.length; i++ )
		{
			if ( str.charAt( i ) === '\n' )
			r += '\n';
			else
			if ( str.charAt( i ) === ' ' || str.charAt( i ) === '\t' )
			r += ' ';
			else
			r += 'X';
		}
		return r;
	}*/
	
	/*static ConvertToTagPattern( str )
	{
		str = str.trim();
		
		// Remove whitespaces, tabs, line breaks that don't matter, replace with single spaces any of such sequences
		str = str.replace(/\s\s+/g, ' ');
		
		let parts = [];
		
		let pos = 0;
		
		let search_options = [ '<', '>' ];
		
		while ( true )
		{
			let new_pos = str.indexOf( search_options[ parts.length % 2 ], pos );
			
			if ( new_pos === -1 )
			{
				parts.push( str.substring( pos ).trim() );
				break;
			}
			else
			{
				if ( parts.length % 2 === 0 )
				{
					parts.push( str.substring( pos, new_pos ).trim() );
					pos = new_pos;
				}
				else
				{
					parts.push( str.substring( pos, new_pos + 1 ) );
					pos = new_pos + 1;
				}
			}
			
		}
		
		if ( parts.length === 1 )
		return str;
		
		return parts;
	}*/
	
	static TranslateHTMLPage() // Will be called multiple times for same data
	{
		if ( globalThis.sd_events === undefined )
		return;
		
		
		let elements = [];
		
		function AddBySelector( selector )
		{
			let arr = document.body.querySelectorAll( selector );
			for ( let i = 0; i < arr.length; i++ )
			elements.push( arr[ i ] );
		}
		
		AddBySelector( '.sdgroup' );
		AddBySelector( '.sdtitle' );
		AddBySelector( 'input[type="button"]' );
		AddBySelector( 'label' );
		
		for ( let i = 0; i < elements.length; i++ )
		if ( !elements[ i ].dont_translate )
		{
			elements[ i ].dont_translate = true;
			
			function Scan( e )
			{
				if ( e.nodeType === e.TEXT_NODE )
				{
					let str = e.textContent;
					str = str.replace(/\s\s+/g, ' ');
					
					if ( str.length > 0 && str !== ' ' )
					{
						sdTranslationManager.GetTranslationOrScheduleWithCalback( str, ( translated )=>
						{
							e.textContent = translated;
						});
					}
				}
				else
				if ( e.value )
				{
					let old_value = e.value;
					sdTranslationManager.GetTranslationOrScheduleWithCalback( e.value, ( translated )=>
					{
						// Check whether button was renamed from outside
						if ( e.value === old_value )
						{
							e.value = translated;
							old_value = e.value;
						}
						else
						{
							throw 'Remove callback';
						}
					});
				}
				else
				{
					let nodes = e.childNodes;

					for ( let i = 0; i < nodes.length; i++ )
					{
						Scan( nodes[ i ] );
					}
				}
			}
			
			Scan( elements[ i ] );
		}
	}
}

globalThis.sdTranslationManager = sdTranslationManager;

export default sdTranslationManager;