
import { parentPort } from 'worker_threads';
import WorkerServiceLogic from './worker_service_logic.js';

parentPort.postMessage({ welcome: 'I\'m awake ~' });

const response = ( data )=>
{
	parentPort.postMessage( data );
};

parentPort.on('message', ( command )=>{
	
	WorkerServiceLogic.HandleCommand( command, response );
} );