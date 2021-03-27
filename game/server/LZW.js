/*

	From https://gist.github.com/revolunet/843889

	Note: It is useless to try over-opptimize it again - UTF-8 loses random high characters during send operations... In fact, it might happen due to compression at any moment too...

*/


	class LZW
	{
		static init_class()
		{
		}
	}
	
	//LZW.safe_pack_code = 256; // High strings apparently can still cause some problems with data missmatch... I wonder if it will be happening on release.
	LZW.safe_pack_code = 127; // This value will also influence number compression intensity // Safer version? High strings apparently can still cause some problems with data missmatch... I wonder if it will be happening on release (big maps case).


	//Yes, it fails at true UTF-8. Thus correcting value of "code"...

	LZW.dict_reset_version = 300; // -1 = 9% for server // 100 = 7.7% for server // 300 = 7.3% for server // unlimited = 7.8% for server // works with Number.MAX_SAFE_INTEGER too, if server has enough memory for sure.

	// LZW-compress a string
	LZW.encode_dict = {};
	LZW.encode_dict_version = {};
	LZW.encode_version = 0;
	//LZW.actual_lzw_encode = function(s) {
	LZW.lzw_encode = function(s) {

		LZW.encode_version++;

		if ( LZW.encode_version > LZW.dict_reset_version ) // can be greater by 1
		{
			LZW.encode_dict = {};
			LZW.encode_dict_version = {};
			LZW.encode_version = 0;
		}

		var dict = LZW.encode_dict;//{};
		var out = [];
		var currChar;
		var phrase = s.charAt( 0 );
		var code = LZW.safe_pack_code;//256; // Apparently will fail in cases of multibyte characters
		for (var i=1; i<s.length; i++) {
			currChar=s.charAt( i );

			var phrase_plus_currChar = phrase + currChar;

			if ( LZW.encode_dict_version[ phrase_plus_currChar ] !== LZW.encode_version )
			{
				out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));

				dict[ phrase_plus_currChar ] = code;
				LZW.encode_dict_version[ phrase_plus_currChar ] = LZW.encode_version;

				code++;
				phrase=currChar;
			}
			else
			{
				phrase += currChar;
			}
		}
		out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
		for (var i=0; i<out.length; i++) {
			out[i] = String.fromCharCode(out[i]);
		}
		return out.join("");
	};

	// Twice as better with dictionary like this
	LZW.decode_dict = {}; // Will try to reuse
	LZW.decode_dict_version = {};
	LZW.decode_version = 0;
	// Decompress an LZW-encoded string
	//LZW.actual_lzw_decode = function(s) {
	LZW.lzw_decode = function(s) {

		LZW.decode_version++;

		if ( LZW.decode_version > LZW.dict_reset_version ) // can be greater by 1
		{
			LZW.decode_dict = {};
			LZW.decode_dict_version = {};
			LZW.decode_version = 0;
		}

		var dict = LZW.decode_dict;//{};
		var currChar = s.charAt( 0 );
		var oldPhrase = currChar;
		var out = [currChar];
		var code = LZW.safe_pack_code;//256;
		var phrase;
		for (var i=1; i<s.length; i++) {
			var currCode = s.charCodeAt( i );
			//if (currCode < 256) {
			if (currCode < LZW.safe_pack_code)
			{
				phrase = s.charAt( i );
			}
			else 
			{
				if ( LZW.decode_dict_version[ currCode ] === LZW.decode_version )
				phrase = dict[currCode];
				else
				phrase = oldPhrase + currChar;

				//phrase = dict[currCode] ? dict[currCode] : ( oldPhrase + currChar );
			}
			out.push(phrase);
			currChar = phrase.charAt(0);

			//if ( i%2===0 )
			dict[code] = oldPhrase + currChar;
			//else
			//dict[code] = oldPhrase.concat( currChar ); worse slightly

			LZW.decode_dict_version[ code ] = LZW.decode_version;

			code++;
			oldPhrase = phrase;
		}
		return out.join("");

	};
/*

	LZW.lzw_encode_bi = function(s) {

		if ( s.length > 65535 )
		throw new Error('Compression for strings of size '+s.length+' is not supported (yet?)');

		var ret = '';

		ret += String.fromCharCode( s.length ); // Here we go, 65535 characters limit. But that is enough? Might be not in case of maps?
		
		// Fine method too: ...
		for ( var i = 0; i < s.length; i += 2 )
		{
			var code1 = s.charCodeAt( i ) - LZW.min_char_code;
			var code2 = s.charCodeAt( i + 1 ) - LZW.min_char_code;

			if ( code1 >= LZW.delta_char_code )
			{
				console.warn('Out of range charCode: '+code1);
				code1 = '?'.charCodeAt(0);
			}

			if ( code2 >= LZW.delta_char_code )
			{
				console.warn('Out of range charCode: '+code2);
				code1 = '?'.charCodeAt(0);
			}

			var unicode = code1 * LZW.delta_char_code + code2;

			ret += String.fromCharCode( unicode );
		}

		return ret;
	};
	LZW.lzw_decode_bi = function(s) {

		var final_length = s.charCodeAt( 0 );

		var cur_length = 0;

		var ret = '';
	
		for ( var i = 1; i < s.length; i++ ) // Skip first
		{
			var unicode = s.charCodeAt( i );

			//ret += unicode + ' '; // hack
			//continue; // hack

			var code2 = unicode % LZW.delta_char_code;
			var code1 = ( unicode - code2 ) / LZW.delta_char_code;

			ret += String.fromCharCode( code1 + LZW.min_char_code );
			cur_length++;

			if ( cur_length >= final_length )
			break;

			ret += String.fromCharCode( code2 + LZW.min_char_code );
			cur_length++;
		}
		ret += '</end>';

		return ret;
	};
*/


export default LZW;