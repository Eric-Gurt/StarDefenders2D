
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCom from './sdCom.js';
import sdArea from './sdArea.js';

//import sdServerToServerProtocol from '../server/sdServerToServerProtocol.js';

import sdRenderer from '../client/sdRenderer.js';


class sdLongRangeTeleport extends sdEntity
{
	static init_class()
	{
		sdLongRangeTeleport.img_long_range_teleport = sdWorld.CreateImageFromFile( 'long_range_teleport' );
		
		sdLongRangeTeleport.max_matter = 300;
		
		sdLongRangeTeleport.long_range_teleports = [];
		
		//sdLongRangeTeleport.delay_simple = 30 * 10; // 10 seconds
		sdLongRangeTeleport.delay_simple = 30 * 3; // 3 seconds
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -48; }
	get hitbox_x2() { return 48; }
	get hitbox_y1() { return -11; }
	get hitbox_y2() { return 0; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this.hea > 0 )
		{
			if ( !this.is_server_teleport )
			this.hea -= dmg;
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
			if ( this.delay < 90 )
			this.SetDelay( 90 );
			
			this._regen_timeout = 60;

			if ( this.hea <= 0 )
			this.remove();
		}
	}
	SetDelay( v )
	{
		if ( v < 0 )
		v = 0;

		if ( ( v > 0 ) !== ( this.delay > 0 ) )
		{
			if ( v === 0 )
			sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:1 });
		}
		
		if ( Math.ceil( v / 30 ) !== Math.ceil( this.delay / 30 ) )
		{
			this._update_version++;
		}
		
		this.delay = v;

		if ( v > 0 )
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	onMatterChanged( by=null ) // Something like sdLongRangeTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 1500;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		this.delay = sdLongRangeTeleport.delay_simple;
		//this._update_version++
		
		this._matter_max = sdLongRangeTeleport.max_matter;
		this.matter = 0;
		
		this.is_server_teleport = params.is_server_teleport || 0; // 1 if admin creates it, 0 if user (in that case it works as a task completion target). Requires matter in both cases probably
		this.remote_server_url = 'http://localhost:3000';
		this.remote_server_target_net_id = this._net_id + '';
		
		this.is_busy_since = 0; // Used to prevent activations whenever data is being sent/received
		
		//this.owner_net_id = this._owner ? this._owner._net_id : null;
		
		sdLongRangeTeleport.long_range_teleports.push( this );
	}
	/*ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_owner' ) return true;
		
		return false;
	}*/
	
	MeasureMatterCost()
	{
		return this.is_server_teleport ? Infinity : ( this.hmax * sdWorld.damage_to_matter + 100 );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;
	
		let can_hibernateA = false;
		let can_hibernateB = false;
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			this.hea = Math.min( this.hea + GSPEED, this.hmax );
			else
			can_hibernateA = true;
		}
		
		if ( this.matter >= this._matter_max )
		{
			if ( this.delay > 0 )
			this.SetDelay( this.delay - GSPEED );
			else
			can_hibernateB = true;
		}
		else
		can_hibernateB = true;
	
		if ( can_hibernateA && can_hibernateB )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
	}
	get title()
	{
		let postfix = "  ( " + ~~(this.matter) + " / " + ~~(this._matter_max) + " )";
		
		return 'Long-range teleport' + postfix;

	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	Draw( ctx, attached )
	{
		//if ( this.matter >= this._matter_max || sdShop.isDrawing )
		{
			if ( this.delay === 0 || sdShop.isDrawing )
			{
			}
	
			ctx.drawImageFilterCache( sdLongRangeTeleport.img_long_range_teleport, 0,0,96,32, -48,-16,96,32 );
		}
		/*else
		{
			ctx.drawImageFilterCache( sdLongRangeTeleport.img_long_range_teleport_no_matter, ( sdWorld.time % 4000 < 2000 ? 1 : 0 )*32,0,32,32, - 16, - 16, 32,32 );
		}*/
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title, 0, -32 );
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		let i = sdLongRangeTeleport.long_range_teleports.indexOf( this );
		if ( i !== -1 )
		sdLongRangeTeleport.long_range_teleports.splice( i, 1 );
	
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 3 );
				
			/*
			sdSound.PlaySound({ name:'block4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdLongRangeTeleport.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,y,a,s;
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			for ( y = step_size / 2; y < 32; y += step_size )
			if ( Math.abs( 16 - x ) > 7 && Math.abs( 16 - y ) > 7 )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}*/
		}
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( exectuter_character._god || sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 48 ) )
			{
				/*if ( command_name === 'RESCUE_HERE' )
				{
					if ( this._owner === null || ( this._owner.hea || this._owner._hea ) <= 0 || this._owner._is_being_removed )
					{
						this._owner = exectuter_character;
						
						this._update_version++;

						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // .owner_net_id won't update without this
						
						executer_socket.SDServiceMessage( 'Rescue teleport is now owned by you' );
					}
					else
					executer_socket.SDServiceMessage( 'Rescue teleport is owned by someone else' );
				}
				else
				if ( command_name === 'UNRESCUE_HERE' )
				{
					if ( exectuter_character === this._owner )
					{
						this._owner = null;

						this._update_version++;

						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // .owner_net_id won't update without this
						
						executer_socket.SDServiceMessage( 'Rescue teleport is no longer owned by you' );
					}
					else
					executer_socket.SDServiceMessage( 'Rescue teleport is owned by someone else' );
				}*/
				if ( command_name === 'TELEPORT_STUFF' )
				{
					if ( sdWorld.time < this.is_busy_since + 60 * 1000 )
					{
						executer_socket.SDServiceMessage( 'Busy - previous sequence is not finished yet' );
						return;
					}
					else
					{
						executer_socket.SDServiceMessage( 'Doing... (not really. It is in development! ~)' );

						this.SetDelay( sdLongRangeTeleport.delay_simple );
						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						
						sdServerToServerProtocol.SendData(
							this.remote_server_url,
							{
								action: 'Require long-range teleportation',
								target_net_id: this.remote_server_target_net_id
							},
							( response=null )=>
							{
								this.is_busy_since = 0;
								
								if ( response )
								{
									if ( response.message === 'Granted' )
									sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:1 });
								}
								
								executer_socket.SDServiceMessage( 'Remote server responded with: ' + JSON.stringify( response ) );
							}
						);
					}
				}
				else
				if ( exectuter_character._god )
				{
					if ( command_name === 'SET_REMOTE_SERVER_URL' )
					if ( parameters_array.length === 1 && typeof parameters_array[ 0 ] === 'string' && parameters_array[ 0 ].length < 300 )
					{
						this.remote_server_url = parameters_array[ 0 ];
						executer_socket.SDServiceMessage( 'Remote server URL set' );
					}
					
					if ( command_name === 'SET_REMOTE_TARGET_NET_ID' )
					if ( parameters_array.length === 1 && typeof parameters_array[ 0 ] === 'string' && parameters_array[ 0 ].length < 64 )
					{
						this.remote_server_target_net_id = parameters_array[ 0 ];
						executer_socket.SDServiceMessage( 'Remote _net_id set' );
					}
				}
				else
				executer_socket.SDServiceMessage( 'No permissions' );
			}
			else
			executer_socket.SDServiceMessage( 'Long-range teleport is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( exectuter_character._god || sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 48 ) )
		{
			/*if ( sdWorld.my_entity && this.owner_net_id === sdWorld.my_entity._net_id )
			this.AddContextOption( 'Lose ownership', 'UNRESCUE_HERE', [] );
			else
			this.AddContextOption( 'Set as personal rescue teleport', 'RESCUE_HERE', [] );*/
			
			if ( exectuter_character._god )
			{
				this.AddPromptContextOption( 'Set remote server URL', 'SET_REMOTE_SERVER_URL', [ undefined ], 'Enter remote server URL (same as for players)', this.remote_server_url, 300 );
				this.AddPromptContextOption( 'Set remote long-range teleport _net_id', 'SET_REMOTE_TARGET_NET_ID', [ undefined ], 'Enter remote server URL (same as for players)', this.remote_server_target_net_id, 64 );
				this.AddPromptContextOption( 'Get this long-range teleport _net_id', 'GET_REMOTE_TARGET_NET_ID', [ undefined ], 'This is a _net_id of this long-range teleport entity', this._net_id, 64 );
			}
			
			this.AddContextOption( 'Initiate teleportation', 'TELEPORT_STUFF', [] );
		}
	}
}
//sdLongRangeTeleport.init_class();

export default sdLongRangeTeleport;