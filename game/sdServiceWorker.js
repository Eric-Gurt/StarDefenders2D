
// FAQ.
// Q. Why can't I use `window`?
// A. In web workers, the reason for that is because it has its own separate thread,
// you're going to use `self` if you need to access anything.

// This is a file to handle caching, speaking, whatever in this file.
// This is also a file which can't use any ES modules (for now)

// TODO: fix onfetch not initiating properly (currently takes a restart to do it)
// Can't figure this out yet ^

self.oninstall = async event => {
	await ( await caches.open( "sdCache-v1" ) ).addAll( [
			"/",
			"/index.html",
			"/style.css",
			"/assets/fonts/CozetteVector.ttf",
			"/assets/fonts/Oswald-Light.ttf",
			"/assets/bg.png",
			"/assets/ground_8x8.png",
			"/favicon.png",
			"/favicon.ico",
			"/client/sdUserAgent.js",
			"/client/sdErrorReporter.js",
			"/client/sdTheatreAPIs.js",
			"/libs/coloris/coloris.min.css",
			"/libs/coloris/coloris.min.js",
			"/libs/localforage.nopromises.min.js",
			"/socketio/socketio.new.js",
			"/libs/three.js",
			"/libs/three-examples/BufferGeometryUtils.js",
			"/libs/three-examples/MeshLine.js",
			"/mespeak/mespeak.js",
			"/libs/howler.js.min.js",
			"/libs/acorn.cjs",
			"/client/sdTranslationManager.js",
			"/client/sdMobileKeyboard.js",
			"/game.js",
			"/client/sdMusic.js"
	] );
};

self.onfetch = async event => {

	// console.log( event.request );

	if ( ( event.request.destination === "" && !( event.request.url.includes( ".wav" ) ) ) || event.request.method !== "GET" ) return; // Handle it differently
	if ( event.request.url.includes( ".mp3" ) ) return; // Causes 206 Partial Content here

	event.respondWith(
		( async () => {
			const cache = await caches.open( "sdCache-v1" );
			const cachedResponse = await cache.match( event.request );

			if ( cachedResponse ) {
				// Assuming it has the cached response

				// Update the entry too
				// event.waitUntil( cache.add( event.request ) );
				return cachedResponse;
			}

			// Assuming we haven't found a cached response yet
			const file = await fetch( event.request );

			const fileClone = file.clone(); // Clone, so that it wouldn't error on the original one
			await cache.put( event.request, fileClone );

			return file;
		} )() );
};

// Debug
/* self.serviceWorker.onstatechange = event => {
	console.log( "Current state:", event.target.state );
}; */