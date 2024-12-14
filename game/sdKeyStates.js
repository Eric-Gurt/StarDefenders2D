
/* global sdMusic */

import sdWorld from './sdWorld.js';

class sdKeyStates
{
	static init_class()
	{
		sdKeyStates.default_state = {
			
			KeyD: 0,
			KeyW: 0,
			KeyS: 0,
			KeyA: 0,
			KeyR: 0,
			Space: 0,
			KeyX: 0,
			KeyE: 0,
			KeyG: 0,
			KeyQ: 0,
			KeyC: 0,
			KeyZ: 0,
			KeyV: 0,
			KeyF: 0,
			ShiftLeft: 0,
			Digit1: 0,
			Digit2: 0,
			Digit3: 0,
			Digit4: 0,
			Digit5: 0,
			Digit6: 0,
			Digit7: 0,
			Digit8: 0,
			Digit9: 0,
			Digit0: 0,
			Backquote: 0,
			Mouse1: 0, // Left
			Mouse2: 0, // Middle
			Mouse3: 0, // Right
			KeyI: 0,
			KeyK: 0,
			KeyN: 0
		};
		
		sdKeyStates.default_state_keys = Object.keys( sdKeyStates.default_state );
	}
	constructor()
	{
		this.key_states = Object.assign( {}, sdKeyStates.default_state );
		this.Reset();
	}
	
	Reset()
	{
		this.key_states = Object.assign( this.key_states, sdKeyStates.default_state );
		
		this.one_taps = Object.assign( {}, this.key_states ); // One-taps are for keys that are released faster than game loop tick could happen. This will prevent jumping from being ignored on high ping connections or when server just gets a lag spike.
		
		for ( var i in this.one_taps )
		{
			this.one_taps[ i ] = sdWorld.frame - 1;
		}
	}
	
	GetKey( key )
	{
		if ( typeof this.key_states[ key ] === 'undefined' )
		return 0;
	
		if ( this.one_taps[ key ] === sdWorld.frame )
		return 1;
	
		return this.key_states[ key ];
	}
	SetKey( key, value, reset_one_tap=false )
	{	
		if ( typeof this.key_states[ key ] === 'undefined' )
		return;
	
		//this.key_states[ key ] = ( value === 1 ) ? 1 : 0;
	
		if ( value === 1 )
		{
			if ( !sdWorld.is_server )
			if ( this === sdWorld.my_key_states )
			if ( sdWorld.my_key_states )
			if ( this.key_states[ key ] !== 1 )
			{
				sdMusic.onKeyDown( key );
			}
			
			this.key_states[ key ] = 1;
			this.one_taps[ key ] = sdWorld.frame;
		}
		else
		{
			this.key_states[ key ] = 0;
			
			if ( reset_one_tap )
			if ( this.one_taps[ key ] === sdWorld.frame )
			this.one_taps[ key ]--;
		}
	}
}
sdKeyStates.init_class();

export default sdKeyStates;