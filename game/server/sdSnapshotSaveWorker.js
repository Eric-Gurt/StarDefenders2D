/*
	Dedicated snapshot-save worker (phase: backup-tail-decouple).

	The world backup's compression + disk write are handed here so they complete on time even
	when the main event loop is saturated by per-client snapshot sync (production 5-11 players).
	Measured mechanism: with the old inline `zlib.deflate(json, cb)` the compression finishes
	off-thread on schedule, but its completion callback (and therefore the fs.writeFile) is
	delivered on the busy main loop, so the snapshot lands on disk seconds late and the timings
	report inflates 3-6x. Doing deflate + writeFile + rename inside this worker removes that
	dependency: the file is persisted as soon as compression finishes, regardless of main-thread load.

	Output is byte-identical to the inline path: zlib.deflateSync uses the same defaults
	(Z_DEFAULT_COMPRESSION=6, memLevel 8, default strategy) as zlib.deflate, and the file is
	always re-read with zlib.inflateSync at load time.

	Protocol (parentPort):
	  in : { id, json, temp_path, final_path, do_rename }
	  out: { id, ok:true, bytes, deflate_ms, write_ms } | { id, ok:false, error }
*/
import { parentPort } from 'worker_threads';
import zlib from 'zlib';
import fs from 'fs';

parentPort.on( 'message', ( job )=>
{
	let t0 = Date.now();
	try
	{
		let buffer = zlib.deflateSync( job.json );
		let t1 = Date.now();

		fs.writeFileSync( job.temp_path, buffer );

		if ( job.do_rename && job.temp_path !== job.final_path )
		fs.renameSync( job.temp_path, job.final_path );

		let t2 = Date.now();

		parentPort.postMessage({ id: job.id, ok: true, bytes: buffer.length, deflate_ms: t1 - t0, write_ms: t2 - t1 });
	}
	catch ( e )
	{
		parentPort.postMessage({ id: job.id, ok: false, error: String( ( e && e.stack ) || e ) });
	}
} );
