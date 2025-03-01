
// FAQ.
// Q. Why can't I use `window`?
// A. In web workers, the reason for that is because it has its own separate thread,
// you're going to use `self` if you need to access anything.

// This is a file to handle caching, speaking, whatever in this file.
// This is also a file which can't use any ES modules (for now)

self.oninstall = async event => {
	await self.caches.open( "sdCache" );
	self.skipWaiting(); // Skip immediately as we don't need to cache just yet
};

self.onactivate = event => {
	event.waitUntil( clients.claim() ); // Synchronize everything, this will prevent users to refresh page to get it working
};

self.onfetch = async event => {

	// console.log( event.request );

	if ( !event.request.url.includes( location.origin ) ) return;
	if ( ( ( event.request.destination === "" || event.request.url.includes( ".txt" ) ) && !( event.request.url.includes( ".wav" ) ) ) || event.request.method !== "GET" ) return; // Handle it differently
	if ( event.request.url.includes( ".mp3" ) ) return; // Causes 206 Partial Content here for some reason

	event.respondWith(
		( async () => {
			const sdCache = await caches.open( "sdCache" );
			const cachedResponse = await sdCache.match( event.request );

			// console.log( event.request.url.split( location.origin ) );
			let hash_same = false;
			await sdServiceWorker.isFileHashSame( event.request.url.split( location.origin )[ 1 ], event.request.url, hash_same );
			// console.log( shouldUseCacheResponse, event.request.url );

			if ( cachedResponse && hash_same ) {
				// Assuming it has the cached response

				// Update the entry too
				// event.waitUntil( cache.add( event.request ) );
				return cachedResponse;
			}

			// Assuming we haven't found a cached response yet
			const file = await fetch( event.request );

			const fileClone = file.clone(); // Clone, so that it wouldn't error on the original one
			const fileCloneClone = fileClone.clone();
			await sdCache.put( event.request, fileClone );

			// console.log( file.url, file.url === "" );
			const buffer = await fileCloneClone.arrayBuffer();
			await sdServiceWorker.hashFile( file.url, buffer );

			return file;
		} )() );
};

class sdServiceWorker
{
	static
	{
		this.database_request = self.indexedDB.open( "sdFile" );

		this.database_request.onerror = event => {
			console.log( "Failed to load database" );
		};

		this.database_request.onsuccess = event => {
			this.database = this.database_request.result;
			// console.log( this.database );
		};

		this.database_request.onupgradeneeded = event => {
			this.database = this.database_request.result;
			// Without autoIncrement set to true, `put` method would throw an error
			this.database.createObjectStore( "hashes", { autoIncrement: true } );
		};

		// console.log( this.database_request );
	};

	static async isFileHashSame( url, originalURL, hash_same )
	{
		// console.log( url );
		// if ( url === undefined ) return false;

		const hash = await ( await fetch( "/check_file_hash?url=" + url ) ).text();

		const transaction = this.database.transaction( "hashes", "readonly" );
		const hashes = transaction.objectStore( "hashes" );

		const oldHashRequest = hashes.get( originalURL );

		oldHashRequest.onsuccess = event => {
			const oldHash = oldHashRequest.result;
			// console.log( oldHash, hash );

			if ( oldHash === hash ) {
				transaction.commit();
				hash_same = true;
			} else {
				transaction.commit();
				hash_same = false;
			}
		};

		// transaction.commit();
	};

	static async hashFile( url, buffer )
	{
		const sha256Hash = Array.from( new Uint8Array( await crypto.subtle.digest( "SHA-256", buffer ) ) );
		const hash = sha256Hash.map( (byte) => byte.toString( 16 ).padStart( 2, "0" ) ).join("");

		const transaction = this.database.transaction( "hashes", "readwrite" );
		const hashes = transaction.objectStore( "hashes" );

		// data as an object, URL as the key.
		// console.log( url );
		hashes.put( hash, url );
		transaction.commit(); // waiter, we're done!
	};
};