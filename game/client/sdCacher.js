
// Service Worker API rules:
// window isn't defined? use self
// self.onmessage and self.onmessageerror are important factors

class sdCacher {

	/** @type { Cache } */
	static sdFile; // Cache

	static opcodes = {
		get_file: sdCacher.getFileFromCache,
		update_file: sdCacher.updateFileFromCache,
		create_file: sdCacher.createFileAndCache
	}

	static init_class() // static {} // shorter version of init_class() without manually calling it in this file
	{
		// sdCacher -> Initiate class -> Prepare sdFile and sdFile_database
		console.log( "sdCacher class initiated, preparing sdFile and sdFile_database" );

		self.caches.open( "sdFile" ).then( cache =>
		{
			sdCacher.sdFile = cache;
		} );

		/* sdCacher.sdFile_database = self.indexedDB.open( "sdFile_database" );

		sdCacher.sdFile_database.onupgradeneeded = ( event ) => {
			console.log( "(re)creating sdFile_database" );

			/** @type { IDBDatabase } */ /*
			const db = event.target.result; // IDBDatabase
			
			if ( !db.objectStoreNames.contains( "storedFilesData" ) ) {
				db.createObjectStore( "storedFilesData" );
			}
		};

		sdCacher.sdFile_database.onsuccess = ( event ) => {
			console.log( "sdFile_database is now open" );
			sdCacher.sdFile_database_result = sdCacher.sdFile_database.result;

			sdCacher.sdFile_database_result.onclose = event => console.log( "Closing connection" );

			sdCacher.sdFile_database_result.onversionchange = event => console.log( "Switching version " + event.oldVersion + " to " + event.newVersion );
		};

		sdCacher.sdFile_database.onerror = ( event ) => {
			console.log( "sdFile_database has encountered an error, is the sdFile_database corrupted?" );
		}; */
	}

	static async getFileFromCache( fileURL )
	{
		// const currentDate = Date.now();
		if ( typeof fileURL === "string" ) {
			// we may need to update the cache and check for the date it was created in the database

			const file = await sdCacher.sdFile.match( fileURL, { ignoreSearch: true } );

			// Client -> Check cache and file hash -> Check file -> undefined
			if ( !file ) // huh? file doesn't exist? no problem.
			{
				sdCacher.createFileAndCache( fileURL );
				return;
			}

			/* const timeElapsed = currentDate - Number( file.url.split( "?timestamp=" )[1] );
			
			if ( timeElapsed > 60 * 60 * 672 ) {
				sdCacher.updateFileFromCache( fileURL );
				return;
			} */

			// Images


			/* unfinished, probably.
			// Client -> Check cache and file hash -> Check file -> Check file database
			const fileData_transaction = sdCacher.sdFile_database_result.transaction( "storedFilesData", "readonly" );
			const fileData_objectStore = fileData_transaction.objectStore( "storedFilesData" );
			const fileData_cursor = fileData_objectStore.openCursor();
			fileData_cursor.onsuccess = async ( event ) =>
			{
				// Client -> Check cache and file hash -> Check file -> Check file database -> Cursor success

				/** @type { IDBCursorWithValue } */ /*
				const cursor = fileData_cursor.source; // IDBCursorWithValue

				const date_modified = cursor.value.date_modified; // should be number
				const current_date = Date.now();

				// every 1 month we could reset the user's cache database

				const timeElapsed = current_date - date_modified;

				// Client -> Check cache and file hash -> Check file -> Check file database -> Cursor success -> 1 month has passed or is NaN
				if ( timeElapsed > 60 * 60 * 672 )
				if ( timeElapsed === NaN ) // uh oh what now
				{
					sdCacher.updateFileFromCache( fileURL ) // why of course? update.
					return;
				}

				self.serviceWorker.postMessage( file );
			}

			fileData_cursor.onerror = async ( event ) =>
			{
				// Client -> Check cache and file hash -> Check file -> Check file database -> Cursor error
				sdCacher.updateFileFromCache( fileURL ); // maybe it's the records, let's update it

				return;
			}; */
		}
	};

	static async updateFileFromCache( fileURL )
	{
		// const currentDate = Date.now();
		// Client -> Check cache and file hash -> Request and cache file
		if ( typeof fileURL === "string" ) {
			const fileCheck = await sdCacher.sdFile.match( fileURL, { ignoreSearch: true } );

			if ( !fileCheck ) {
				sdCacher.createFileAndCache( fileURL );
				return; // smh. - Molis
			}

			/* const timeElapsed = currentDate - Number( fileCheck.url.split( "?timestamp=" )[1] );

			if ( timeElapsed > 60 * 60 * 672 ) {
				await sdCacher.sdFile.delete( fileURL );

				const file = await fetch( fileURL );

				await sdCacher.sdFile.put( file.url, file );
			} */
		}
	};

	static async createFileAndCache( fileURL )
	{
		// const currentDate = Date.now();
		// Client -> Create file
		if ( typeof fileURL === "string" ) {
			/* const fileCheck = await sdCacher.sdFile.match( fileURL );

			if ( fileCheck ) {
				sdCacher.updateFileFromCache( fileURL );
				return; // smh. - Molis
			} */

			const file = await fetch( fileURL );

			await sdCacher.sdFile.put( file.url, file );

			// For images, we could use `createImageBitmap` and transfer it to the client

			// const fileData_transaction = sdCacher.sdFile_database_result.transaction( "storedFilesData", "readwrite" );
			// const fileData_objectStore = fileData_transaction.objectStore( "storedFilesData" );

			/* try {
				// i don't know what i'm doing wrong here - Molis
				const fileData_index = fileData_objectStore.index( fileURL );
				const fileData_cursor = fileData_index.openCursor();
				fileData_cursor.onsuccess = ( event ) =>
				{
					const cursor = fileData_cursor.result;

					if ( cursor ) // If the records exists
					{
						console.log( "Updating sdFile_database records" );
						sdCacher.updateFileFromCache( fileURL );
						return;
					}
				};

				fileData_cursor.onerror = ( event ) =>
				{
					console.log( "Is the sdFile_database record data corrupted?" );
				};
			}
			catch( error ) {
				console.log( "Uncaught exception " + error );
			}; */

			/* fileData_objectStore.put( {
				filename: fileURL, // i think the full URL definitely needs to be shortened, instead of this https://www.gevanni.com:3000/audio/gun_rayrifle.wav
				date_modified: Date.now()
			}, fileURL ); */
		};
	};
};

sdCacher.init_class();

self.onmessage = ( message ) => {
	console.log( "Client has sent a message to sdCacher.js" );

	// opcodes:
	// get_file (URL)
	// create_file (URL)

	const opcode_full = message.data.split( " " );
	const opcode = sdCacher.opcodes[ opcode_full[0] ];
	const parameters = opcode_full[1]; // should not return blank

	if ( opcode )
	opcode( parameters );
};

self.onmessageerror = ( message ) => {
	console.log( "Client has gotten a message error" );
};