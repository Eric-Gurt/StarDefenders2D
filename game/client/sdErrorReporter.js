/*

	Made to report iOS-specific errors on screen

*/
/* global globalThis */

if ( false )
{
	let can_show_error = true;
	window.onerror = ( message, source, lineno, colno, error )=>
	{
		if ( !can_show_error )
		return;

		can_show_error = false;

		let div = document.createElement('DIV');
		div.style.cssText = `position:fixed;left:0;top:0;padding:20px;color:red;background:black;pointer-events:none;z-index:1000;`;

		let json='can not set';
		try
		{
			json = error.stack;//JSON.stringify( error );
		}catch(e){}

		div.textContent = 'Star Defenders error: ' + message + '[::]Source: ' + source + '[::]LineNumber: ' + lineno + '[::]ColumnNumber: '+colno + '[::]ErrorObject: '+json;
		div.innerHTML = div.innerHTML.split( '[::]' ).join('<br><br>');

		document.body.append( div );
	};
	globalThis.ModalTrace = ( message )=>
	{
		let div = document.createElement('DIV');
		div.style.cssText = `position:fixed;right:0;bottom:100px;padding:20px;color:white;background:black;pointer-events:none;z-index:1000;`;

		div.textContent = 'Star Defenders modal trace ' + message;
		div.innerHTML = div.innerHTML.split( '[::]' ).join('<br><br>');

		document.body.append( div );
	};
}