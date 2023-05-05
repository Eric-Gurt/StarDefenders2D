
import LZW from './LZW.js';
import LZUTF8 from './LZUTF8.js';

// Use globalThis.ExecuteParallel( command, callback ) on main thread

class WorkerServiceLogic
{
	static init_class()
	{
		WorkerServiceLogic.ACTION_LZW = 0;
		WorkerServiceLogic.ACTION_ECHO = 1;
		WorkerServiceLogic.ACTION_EXIT = 2;
		WorkerServiceLogic.ACTION_STRINGIFY = 3;
	}
	static HandleCommand( command, callback )
	{
		//callback( LZW.lzw_encode.toString() );
			
		if ( command.action === WorkerServiceLogic.ACTION_LZW ) // { action: WorkerServiceLogic.ACTION_LZW, data: String }
		{
			callback( LZW.lzw_encode( command.data ) );
		}
		else
		if ( command.action === WorkerServiceLogic.ACTION_ECHO )
		{
			callback( command.data );
		}
		else
		if ( command.action === WorkerServiceLogic.ACTION_EXIT )
		{
			callback( 'Ok, exiting...' );
			setTimeout(()=>{
				
				process.exit();
			
			},1000);
		}
		else
		if ( command.action === WorkerServiceLogic.ACTION_STRINGIFY )
		{
			try
			{
				callback( JSON.stringify( command.data ) );
			}
			catch ( e )
			{
				callback( null );
			}
		}
		else
		throw new Error( 'Unknown worker command: ', command );
	}
}
WorkerServiceLogic.init_class();
export default WorkerServiceLogic;