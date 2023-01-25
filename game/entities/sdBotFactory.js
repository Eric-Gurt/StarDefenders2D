/*

	Makes repair/attack bots, maybe also lets control them (unless I will move logic programming to sdCom)

*/
/* global sdCodeEditor, sdShop */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdProgram from './sdProgram.js';


class sdBotFactory extends sdEntity
{
	static init_class()
	{
		sdBotFactory.img_bot_stuff = sdWorld.CreateImageFromFile( 'sdRepairBot' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -23; }
	get hitbox_x2() { return 23; }
	get hitbox_y1() { return -12; }
	get hitbox_y2() { return 15; }
	
	get hard_collision()
	{ return true; }
	
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }
	
	get title()
	{
		return 'Bot factory';
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 4000; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._matter_max = 1000;
		this.matter = 0;
		
		this.progress = 0; // Building progress
		this._building_kind = -1;
		
		this._bot_net_ids = [];
		
		this._code = 
`while ( true )
{
	if ( CountBots( BOT_KIND_REPAIR ) < 2 )
	if ( !IsBuilding() )
	{
		BuildBot( BOT_KIND_REPAIR );
	}
		
	if ( CountBots( BOT_KIND_ATTACK ) < 2 )
	if ( !IsBuilding() )
	{
		BuildBot( BOT_KIND_ATTACK );
		continue;
	}
		
	Sleep( 1000 );
}`;
		
		this._developer = null;
		
		this._program = null;
		this.program_stopped = true;
		this._program_message = null;
		this._program_globals = {
			
			trace: ( ...m )=>
			{
				this._program_message = m.join( ' ' ) + '';
				
				if ( this._developer )
				if ( this._developer._socket )
				this._developer._socket.CommandFromEntityClass( sdBotFactory, 'MESSAGE', [ this._net_id, this._program_message ] ); // class, command_name, parameters_array
			},
			
			Sleep: sdProgram.Sleep,
			
			onError: ( message )=>
			{
				this._program_message = 'Error: ' + message;
				
				if ( this._developer )
				if ( this._developer._socket )
				this._developer._socket.CommandFromEntityClass( sdBotFactory, 'MESSAGE', [ this._net_id, this._program_message ] ); // class, command_name, parameters_array
			},
			
			BOT_KIND_REPAIR: 0,
			BOT_KIND_ATTACK: 1,
			
			CountBots: ( specific_kind=-1 )=>{ return this.CountBots( specific_kind ) },
			
			IsBuilding: ()=>
			{
				return ( this._building_kind !== -1 );
			},
			
			BuildBot: ( kind )=>
			{
				if ( kind !== 0 )
				if ( kind !== 1 )
				throw new Error( 'Bot kind is not supported. Use BOT_KIND_REPAIR or BOT_KIND_ATTACK' );
				
				if ( this._building_kind === -1 )
				{
					this._building_kind = kind;
					sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, volume:0.25, pitch:2 });
				}
				else
				{
					throw new Error( 'Previous bot is in progress. Use IsBuilding() function' );
				}
			}
		};
	}
	
	CountBots( specific_kind=-1 )
	{
		let this_kind = 0;
		
		for ( let i = 0; i < this._bot_net_ids.length; i++ )
		{
			let ent = sdEntity.GetObjectByClassAndNetId( 'auto', this._bot_net_ids[ i ] );
			if ( !ent || ent._is_being_removed )
			{
				this._bot_net_ids.splice( i, 1 );
				i--;
				continue;
			}
			
			if ( specific_kind !== -1 )
			if ( ent.kind === specific_kind )
			this_kind++;
		}
		
		if ( specific_kind === -1 )
		return this._bot_net_ids.length;
	
		return this_kind;
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_bot_net_ids' );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		//else
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		
		if ( !this.program_stopped )
		if ( this._code !== null )
		{
			if ( this._program === null )
			{
				this._program_globals.trace( 'Program started' );
				this._program = sdProgram.StartProgram( this._code, this._program_globals );
			}
		
			this._program.Think( GSPEED );
		}
		
		if ( this.matter >= 1 )
		if ( this._building_kind !== -1 )
		{
			this.progress += GSPEED * 100 / ( 10 * 30 );
			if ( this.progress >= 100 )
			{
				this.progress = 0;
				this._building_kind = -1;
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 10 );
	}
	Draw( ctx, attached )
	{
		//ctx.apply_shading = false;
		
		let frame = 0;
		
		if ( !sdShop.isDrawing )
		{
			if ( this.matter < 1 )
			{
				frame = ( sdWorld.time % 4000 < 2000 ) ? 3 : 2;
			}
			else
			if ( this.progress > 0 )
			{
				frame = ( sdWorld.time % 4000 < 2000 ) ? 1 : 0;
			}
		}
		
		ctx.drawImageFilterCache( sdBotFactory.img_bot_stuff, frame * 48,64,48,32, -24,-16,48,32 );
		
		ctx.fillStyle = '#00ffff';
		ctx.fillRect( -6, 9, 12 * this.progress / 100, 1 );
		
		ctx.filter = 'none';
	}
	MeasureMatterCost()
	{
		return 2000;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	
	static ReceivedCommandFromEntityClass( command_name, parameters_array )
	{
		sdCodeEditor.HandleServerCommand( command_name, parameters_array );
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( this.inRealDist2DToEntity_Boolean( exectuter_character, 32 ) )
		{
			/*if ( command_name === 'SET_TEXT' )
			if ( parameters_array.length === 1 )
			if ( typeof parameters_array[ 0 ] === 'string' )
			{
				if ( parameters_array[ 0 ].length < 100 )
				{
					this.text = parameters_array[ 0 ];
					this.text_censored = sdModeration.IsPhraseBad( parameters_array[ 0 ], executer_socket );

					this._update_version++;
					executer_socket.SDServiceMessage( 'Text updated' );
				}
				else
				executer_socket.SDServiceMessage( 'Text appears to be too long' );
			}*/
			
			if ( command_name === 'SET_CODE' )
			{
				if ( typeof parameters_array[ 0 ] === 'string' )
				if ( parameters_array[ 0 ].length < 10000 )
				{
					this._code = parameters_array[ 0 ];
					this._program = null;
					this.program_stopped = true;

					if ( this._program_message === 'Program started' || this._program_message === null )
					this._program_globals.trace( 'Program was updated and awaits restart' );
				}
			}
			else
			if ( command_name === 'EDIT' )
			{
				executer_socket.CommandFromEntityClass( sdBotFactory, 'OPEN_CODE_EDITOR', [ this._net_id, this._code, this._program_message ] ); // class, command_name, parameters_array
				
				this._developer = exectuter_character;
			}
			else
			if ( command_name === 'RESUME' )
			{
				this.program_stopped = false;
				
				if ( this._code === null )
				executer_socket.SDServiceMessage( 'Program was not specified yet' );
			}
			else
			if ( command_name === 'STOP' )
			{
				this.program_stopped = true;
				
				if ( this._code === null )
				executer_socket.SDServiceMessage( 'Program was not specified yet' );
			
				if ( this._program_message === 'Program started' || this._program_message === null )
				this._program_globals.trace( 'Program stopped' );
			}
			else
			if ( command_name === 'START' )
			{
				this._program = null;
				this._program_message = null;
				this.program_stopped = false;
				
				if ( this._code === null )
				executer_socket.SDServiceMessage( 'Program was not specified yet' );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( this.inRealDist2DToEntity_Boolean( exectuter_character, 32 ) )
		{
			//this.AddPromptContextOption( 'Change text', 'SET_TEXT', [ undefined ], 'Enter caption text', ( sdWorld.client_side_censorship && this.text_censored ) ? sdWorld.CensoredText( this.text ) : this.text, 100 );
			
			this.AddContextOption( 'Edit program', 'EDIT', [] );
			
			if ( this.program_stopped )
			this.AddContextOption( 'Resume program', 'RESUME', [] );
			else
			this.AddContextOption( 'Stop program', 'STOP', [] );
		
			this.AddContextOption( 'Restart program', 'START', [] );
		}
	}
}
//sdBotFactory.init_class();

export default sdBotFactory;