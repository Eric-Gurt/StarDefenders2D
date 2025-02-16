if ( "serviceWorker" in navigator ) {
	navigator.serviceWorker.onmessage = event => {
		console.log( "sdServiceWorker sent message:", event );
	};

	navigator.serviceWorker.onmessageerror = event => {
		console.log( "sdServiceWorker encountered an error when sending a message:", event );
	};

	let sw = await navigator.serviceWorker.getRegistration( "/" ); // "/" for main URL

	if ( !sw ) {
		// So there's no current service worker registration,
		// let's setup one.

		sw = await navigator.serviceWorker.register( "./sdServiceWorker.js",
			{
				updateViaCache: "none" // No HTTP Cache.
			} );
	}

	if ( !sw ) {
		// This can usually happen if the internet goes down.
		throw new Error( "sdServiceWorker initialization failed :(" );
	}

	sw.addEventListener( "updatefound", event => {
		console.log( "sdServiceWorker update found" );
	} );

	await sw.update(); // Just in case

	globalThis.sw = sw;
} else {
	throw new Error( "Service Worker is required to run the game properly." );
}