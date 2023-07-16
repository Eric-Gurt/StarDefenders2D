globalThis.BROWSER_WEBKIT = 0;
globalThis.BROWSER_BLINK = 1;
globalThis.BROWSER_GECKO = 2;

function getBrowser()
{
	const canvas = document.createElement("canvas");

	let browser = "Unknown";
	let browserID = -1;

	// Turns out I didn't need them after all
	// maybe listedItems will come back one day - Molis

	/*const listedItems = [ canvas.mozOpaque,
	window.BeforeInstallPrompt,
	window.ongesturechanged ];

	const clearItems = function()
	{
		listedItems.length = 0;
	};*/

	// Gecko
	// In case if mozOpaque gets removed in Firefox, mozInnerScreenX will replace it
	if ( canvas.mozOpaque !== undefined || window.mozInnerScreenX !== undefined )
	{
		browser = "Gecko";
		browserID = BROWSER_GECKO;
	}
		
	// Blink
	if ( window.BeforeInstallPromptEvent !== undefined )
	{
		browser = "Blink";
		browserID = BROWSER_BLINK;
	}
		
	// WebKit
	if ( window.ongesturechange !== undefined || window.onwebkitmouseforcechanged !== undefined )
	{
		browser = "WebKit";
		browserID = BROWSER_WEBKIT;
	}

	return Object.freeze([browser, browserID]);
};
const userAgent = getBrowser();