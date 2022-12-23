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

*/

/* global globalThis */

class sdTranslationManager
{
	static init_class()
	{
		globalThis.T = sdTranslationManager.Translate;
	}
	
	static Translate( str )
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
	}
	
	static ConvertToTagPattern( str )
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
				parts.push( str.substring( pos ) );
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
	}
	
	static TranslateHTMLPage() // Will be called multiple times for same data
	{
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
		if ( !elements[ i ].translated )
		{
			elements[ i ].translated = true;
			
			let obj = {};
			
			if ( elements[ i ].innerHTML !== undefined )
			obj.innerHTML = sdTranslationManager.ConvertToTagPattern( elements[ i ].innerHTML );
			
			if ( elements[ i ].value !== undefined )
			obj.value = sdTranslationManager.ConvertToTagPattern( elements[ i ].value );
			
			//trace( obj );
		}
	}
}
sdTranslationManager.init_class();

globalThis.sdTranslationManager = sdTranslationManager;

export default sdTranslationManager;