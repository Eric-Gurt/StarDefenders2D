function getBrowser()
{
	const BROWSER_WEBKIT = 0;
	const BROWSER_BLINK = 1;
	const BROWSER_GECKO = 2;

	const canvas = document.createElement("canvas");

	let browser = "Unknown";
	let browserID = -1;

	// Turns out I didn't need them after all
	// maybe listedItems will come back one day - Molis

	/*const listedItems = [ canvas.mozOpaque,
	window.CSSPositionValue,
	window.onwebkitforcechanged ];

	const clearItems = function()
	{
		listedItems.length = 0;
	};*/

	// Gecko
	if ( canvas.mozOpaque !== undefined )
	{
		browser = "Gecko";
		browserID = BROWSER_GECKO;
	}
		
	// Blink
	if ( window.CSSPositionValue !== undefined )
	{
		browser = "Blink";
		browserID = BROWSER_BLINK;
	}
		
	// WebKit
	if ( window.onwebkitforcechanged !== undefined )
	{
		browser = "WebKit";
		browserID = BROWSER_WEBKIT;
	}

	return Object.freeze([browser, browserID]);
};
const userAgent = getBrowser();