/*

	Makes repair/attack bots, maybe also lets control them (unless I will move logic programming to sdCom)

*/
/* global sdCodeEditor, sdShop */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdProgram from './sdProgram.js';
import sdBot from './sdBot.js';
import sdBeacon from './sdBeacon.js';


class sdBotFactory extends sdEntity
{
	static init_class()
	{
		sdBotFactory.img_bot_stuff = sdWorld.CreateImageFromFile( 'sdRepairBot' );
		
		sdBotFactory.debug = 0;
		
		sdBotFactory.function_descriptions = null; // Used for code editor
		
		sdBotFactory.default_program = 
`// This block is executed on bot factory
while ( true )
{
	if ( !IsBuilding() )
	{
		if ( CountBots( BOT_KIND_REPAIR ) < 2 ) // Make 2 repair bots
		{
			BuildBot( BOT_KIND_REPAIR, BrainModelA ); // Install BrainModelA
		}
		else
		if ( CountBots( BOT_KIND_ATTACK ) < 2 ) // Make 2 attack bots
		{
			BuildBot( BOT_KIND_ATTACK, BrainModelB ); // Install BrainModelB
		}
		else
		{
			// Once we have nothing more to build - assign attack bots to protect repair bots
		
			var repair_bots = GetBots( BOT_KIND_REPAIR );
			var attack_bots = GetBots( BOT_KIND_ATTACK );
		
			for ( var i = 0; i < repair_bots.length; i++ )
			{
				BroadcastMessageToBot( 
					{ 
						bot_to_protect: repair_bots[ i ] 
					}, 
					attack_bots[ i ] 
				);
			}
		}
	}
	
	Sleep( 100 );
}

function BrainModelA()
{
	trace( 'This is a default repair bot logic' );
	
	MoveTowardsDirection( 0, -1 );
	Sleep( 200 );
	MoveTowardsDirection( 0, 0 );
		
	var item_to_pick = null;
		
	var loops = 0;
		
	var time_to_give_up = 0;
		
	var last_x = 0;
	var last_y = 0;
		
	while ( true )
	{
		loops++;
		
		//ShowExecutionPosition( true, loops + ' loops' );
		
		var bot = GetBot();

		var crystal_storage_beacon = GetBeacon( 4135 ); // To where
		var crystal_lookup_beacon = GetBeacon( 5702 ); // From where
		
		if ( !crystal_storage_beacon )
		trace( 'Can\\'t find storage beacon' );
		
		if ( !crystal_lookup_beacon )
		trace( 'Can\\'t find lookup beacon' );

		if ( IsCarrying() ) // Carrying anything?
		{
			item_to_pick = null;
		
			if ( GetCurrentTime() > time_to_give_up )
			{
				StopCarrying();
			}
			else
			{
				if ( Distance( bot.x, bot.y, last_x, last_y ) > 16 )
				{
					time_to_give_up = GetCurrentTime() + 10 * 1000;
					last_x = bot.x;
					last_y = bot.y;
				}
		
				MoveTowardsEntity( crystal_storage_beacon, 32, false, false );

				var di = DistanceTowardsEntity( crystal_storage_beacon );

				if ( di < 32 )
				StopCarrying();
			}
		}
		else
		if ( bot.hitpoints < bot.hitpoints_max * 0.9 )
		{
			if ( IsCarrying() ) // Carrying anything?
			StopCarrying();
		
			//MoveTowardsEntity( GetFactory(), 0, false, false );
			MoveTowardsEntity( GetClosestCharger(), 0, false, false );
		}
		else
		{
			if ( bot.matter < bot.matter_max * 0.6 )
			{
				MoveTowardsEntity( GetClosestCharger(), 0, false, false );
			}
			else
			{
				if ( item_to_pick )
				{
					if ( GetCurrentTime() > time_to_give_up )
					{
						item_to_pick = null;
					}
					else
					{
						MoveTowardsEntity( entity, 0, false, false );
						CarryIfPossible( entity );
		
						if ( IsCarrying() )
						{
							time_to_give_up = GetCurrentTime() + 10 * 1000;
						}
					}
				}
				else
				{
					var visible_entities = GetVisibleEntities();

					for ( var i = 0; i < visible_entities.length; i++ )
					{
						var entity = visible_entities[ i ];

						if ( entity.entity_class === 'sdCrystal' )
						{
							item_to_pick = entity;
							time_to_give_up = GetCurrentTime() + 10 * 1000;
							break;
						}
					}

					if ( !item_to_pick )
					MoveTowardsEntity( crystal_lookup_beacon, 64, false, false );
				}
			}
		}
		
		Sleep( 100 );
	}
}
function BrainModelB()
{
	trace( 'This is a default attack bot logic' );
	
	MoveTowardsDirection( 0, -1 );
	Sleep( 200 );
	MoveTowardsDirection( 0, 0 );
		
	var entity_to_attack = null;
		
	var last_x = 0;
	var last_y = 0;
	var last_attacker_hitpoints = 0;
		
	var will_protect_entity = null;
	
	while ( true )
	{
		//ShowExecutionPosition( true );
		
		var bot = GetBot();
		
		if ( GetLastAttacker() )
		entity_to_attack = GetLastAttacker();
		
		
		var message;
		while ( message = ReceiveBroadcaseMessage() )
		{
			will_protect_entity = message.bot_to_protect;
		}
		
		if ( entity_to_attack && ( entity_to_attack.hitpoints > 0 || entity_to_attack.entity_class === 'sdCube' ) )
		{
			MoveTowardsEntity( entity_to_attack, 128, false, true );
		}
		else
		{
			if ( will_protect_entity )
			{
				if ( will_protect_entity.hitpoints > 0 )
				MoveTowardsEntity( will_protect_entity, 128, false, false );
				else
				{
					StartDisassemblyTask();
					return;
				}
			}
			else
			{
				MoveTowardsDirection( 0, 0 );
			}
		
			entity_to_attack = null;
		
			var visible_entities = GetVisibleEntities();

			for ( var i = 0; i < visible_entities.length; i++ )
			{
				var entity = visible_entities[ i ];

				if ( 
						entity.entity_class === 'sdCube' || 
						entity.entity_class === 'sdAsp' || 
						entity.entity_class === 'sdAmphid' || 
						entity.entity_class === 'sdBiter' || 
						entity.entity_class === 'sdFaceCrab' || 
						entity.entity_class === 'sdVirus' || 
						entity.entity_class === 'sdBadDog' || 
						entity.entity_class === 'sdTutel' || 
						entity.entity_class === 'sdQuickie' || 
						entity.entity_class === 'sdOctopus' || 
						entity.entity_class === 'sdAbomination' || 
						entity.entity_class === 'sdMimic' || 
						entity.entity_class === 'sdSandWorm' || 
						entity.entity_class === 'sdFlyingMech' ||
						entity.entity_class === 'sdSetrDestroyer' || 
						entity.entity_class === 'sdOverlord' || 
						entity.entity_class === 'sdDrone' || 
						entity.entity_class === 'sdSpiderBot'
					)
				{
					entity_to_attack = entity;
					break;
				}
			}
		}
		
		Sleep( 100 );
	}
}`;
		
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
		
		this._message_timer = null;
		
		this._matter_max = 600;
		this.matter = 0;
		
		this.progress = 0; // Building progress
		this._building_kind = -1;
		this._building_brain_function_code = null; // Assigned to built bots, this is a string.
		
		this._bot_net_ids = [];
		
		//this._known_beacon_ids = [];
		
		this._last_build_entity = null; // For pushing it out purposes
		
		this._code = null; // null means default program
		
		this._developer = null;
		
		this._pending_disassembly = false;
		
		this._program = null;
		this.program_stopped = true;
		this.program_message = null;
		this.program_message_censored = 0;
		this._program_globals = {
			
			trace: ( ...m )=>
			{
				let responsible_socket = null;
				if ( this._developer )
				if ( !this._developer._is_being_removed )
				if ( this._developer._socket )
				responsible_socket = this._developer._socket;
				
				
				this.program_message = m.join( ' ' ) + '';
				this.program_message_censored = sdModeration.IsPhraseBad( this.program_message, responsible_socket );
				
				if ( this._developer )
				if ( !this._developer._is_being_removed )
				if ( this._developer._socket )
				{
					if ( this._message_timer )
					{
						clearTimeout( this._message_timer );
					}
					
					this._message_timer = setTimeout( ()=>
					{
						if ( this._developer )
						if ( !this._developer._is_being_removed )
						if ( this._developer._socket )
						this._developer._socket.CommandFromEntityClass( sdBotFactory, 'MESSAGE', [ this._net_id, this.program_message ] ); // class, command_name, parameters_array
				
						this._message_timer = null;
					}, 500 );
				}
			},
			
			Sleep: sdProgram.Sleep,
			
			onError: ( message )=>
			{
				this._program_globals.trace( 'Error: ' + message );
			},
			
			BOT_KIND_REPAIR: 0,
			BOT_KIND_ATTACK: 1,
			
			GetCurrentTime: ()=>sdWorld.time,
			
			Distance: ( x,y, x2,y2 )=>
			{
				return sdWorld.Dist2D( x,y,x2,y2 );
			},
			
			ShowExecutionPosition: ( mode=true, prefix='' )=>
			{
				if ( mode )
				{
					if ( prefix === '' )
					this._program.report_exec_position_to = this._program_globals.trace;
					else
					this._program.report_exec_position_to = ( s )=>{ this._program_globals.trace( prefix + '; ' + s ); };
				}
				else
				this._program.report_exec_position_to = null;
			},
			
			CountBots: ( specific_kind=-1 )=>
			{ 
				return this.GetBots( specific_kind ).length; 
			},
			
			GetBots: ( specific_kind=-1 )=>
			{
				let arr = this.GetBots( specific_kind );
				
				for ( let i = 0; i < arr.length; i++ )
				{
					let obj = sdProgram.GetShellObjectByEntity( arr[ i ], this._program );
					
					arr[ i ] = obj;
				}
				
				arr = this._program.interpreter.nativeToPseudo( arr );
				
				return arr;
			},
			
			BroadcastMessage: ( pseudo_message, specific_kind=-1 )=>
			{
				let message = this._program.interpreter.pseudoToNative( pseudo_message );
				
				let arr = this.GetBots( specific_kind );
				
				for ( let i = 0; i < arr.length; i++ )
				{
					arr[ i ].ReceiveBroadcast( message );
				}
			},
			
			BroadcastMessageToBot: ( pseudo_message, pseudo_shell_obj )=>
			{
				let message = this._program.interpreter.pseudoToNative( pseudo_message );
				
				let arr = this.GetBots();
				
				let shell_obj = this._program.interpreter.pseudoToNative( pseudo_shell_obj );
				
				let bot = sdProgram.GetEntityByShellObject( shell_obj );
				
				for ( let i = 0; i < arr.length; i++ )
				if ( arr[ i ] === bot )
				{
					arr[ i ].ReceiveBroadcast( message );
					return;
				}
				
				this._program_globals.trace( 'Warning: BroadcastMessageToBot target does not exist' );
			},
			
			ReceiveBroadcaseMessage: ()=>
			{
				let message = ( this._scheduled_broadcasts.length > 0 ) ? this._scheduled_broadcasts.shift() : null;
				
				return this._program.interpreter.nativeToPseudo( message );
			},
			
			IsBuilding: ()=>
			{
				return ( this._building_kind !== -1 );
			},
			
			BuildBot: ( kind, brain_function=null )=>
			{
				if ( kind !== 0 )
				if ( kind !== 1 )
				throw new Error( 'Bot kind is not supported. Use BOT_KIND_REPAIR or BOT_KIND_ATTACK' );
				
				if ( this._building_kind === -1 )
				{
					this._building_kind = kind;
					this._building_brain_function_code = brain_function ? ( this._code || sdBotFactory.default_program ).substring( brain_function.node.start, brain_function.node.end ) : null;
					
					sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, volume:0.25, pitch:2 });
				}
				else
				{
					throw new Error( 'Previous bot building is in progress. Use IsBuilding() function' );
				}
			}
		};
		if ( sdBotFactory.function_descriptions === null )
		{
			sdBotFactory.function_descriptions = sdProgram.PrepareFunctionDescriptions( this._program_globals );
		}
		this._scheduled_broadcasts = [];
	}
	
	GetBots( specific_kind=-1 )
	{
		let this_kind = [];
		
		for ( let i = 0; i < this._bot_net_ids.length; i++ )
		{
			let ent = sdEntity.GetObjectByClassAndNetId( 'auto', this._bot_net_ids[ i ] );
			if ( !ent || ent._is_being_removed )
			{
				this._bot_net_ids.splice( i, 1 );
				i--;
				continue;
			}
			
			if ( specific_kind === -1 || ent.kind === specific_kind )
			this_kind.push( ent );
		}
		
		return this_kind;
	}
	
	ReceiveBroadcast( message )
	{
		if ( this._scheduled_broadcasts.length < 32 )
		this._scheduled_broadcasts.push( message );
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_bot_net_ids' || 
				 prop === '_code' || 
				 prop === '_building_brain_function_code' || 
				 //prop === '_known_beacon_ids' ||
				 prop === '_developer'  ||
				 prop === '_last_build_entity' 
		);
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED;
			else
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
			//else
			//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );

			if ( !this.program_stopped )
			if ( ( this._code || sdBotFactory.default_program ) !== null )
			{
				if ( this._program === null )
				{
					this._program_globals.trace( 'Program started' );
					
					try
					{
						this._program = sdProgram.StartProgram( ( this._code || sdBotFactory.default_program ), this._program_globals );
						
						if ( this._pending_disassembly )
						{
							this._pending_disassembly = false;

							let bots = this.GetBots();

							for ( let i = 0; i < bots.length; i++ )
							bots[ i ].StartDisassemblyTask();
						}
					}
					catch ( e )
					{
						this._program_globals.onError( e );
					}
				}

				if ( this._program )
				this._program.Think( GSPEED );
			}

			//if ( this.matter >= 1 )
			if ( this.matter >= 600 )
			if ( this._building_kind !== -1 )
			{
				let old_progress = this.progress;
				
				//let delta_matter = Math.min( this.matter, GSPEED * 500 / ( 10 * 30 ) );
				
				this.progress += GSPEED * 100 / ( 10 * 30 );
				
				//this.matter -= delta_matter;
				
				
				if ( sdBotFactory.debug )
				this.progress += 2;

				if ( this.progress >= 95 )
				if ( old_progress < 95 )
				{
					sdSound.PlaySound({ name:'crystal_combiner_end', x:this.x, y:this.y, volume:0.25, pitch:2 });
				}

				if ( this.progress >= 100 )
				{
					this.progress = 0;
					
					this.matter -= 600;

					let ent = new sdBot({ x: this.x, y: this.y, owner: this, kind: this._building_kind, code: '('+this._building_brain_function_code+')()' });
					sdEntity.entities.push( ent );

					this._bot_net_ids.push( ent._net_id );

					this._last_build_entity = ent;

					this._building_kind = -1;

					this._building_brain_function_code = null;
				}
			}
			
			if ( this.matter > 600 )
			{
				this.MatterGlow( 0.01, 0, GSPEED ); // Only through cables
			}
			
			if ( this._last_build_entity )
			if ( !this._last_build_entity._is_being_removed )
			if ( this._last_build_entity._hea > 0 )
			{
				if ( this.DoesOverlapWith( this._last_build_entity ) )
				{
					this._last_build_entity.sy = -1;
					this._last_build_entity.PhysWakeUp();
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		//sdEntity.Tooltip( ctx, this.title, 0, -8 );
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + ' ( '+(~~this.matter)+' / '+this._matter_max+' )', 0, -8 );
		
		let t = this.program_message || '';
		
		if ( sdWorld.client_side_censorship && this.program_message_censored )
		t = sdWorld.CensoredText( t );
	
		sdEntity.TooltipUntranslated( ctx, t, 0, 0, ( t.indexOf( 'Error: ' ) === -1 ) ? '#ffff00' : '#ff0000' ); // ( ctx, t, x=0, y=0, color='#ffffff' )
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
	
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdBot ) )
		{
			if ( from_entity._disassembly_task )
			{
				from_entity.remove();
				from_entity._broken = false;
				
				this.matter += 600;
			}
		}
	}
	
	
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
					
					this.progress = 0;
					this._building_kind = -1;
					this._building_brain_function_code = null;
					
					this._pending_disassembly = true;

					if ( this.program_message === 'Program started' || this.program_message === null )
					this._program_globals.trace( 'Program was updated and awaits restart' );
				}
			}
			else
			if ( command_name === 'EDIT' )
			{
				executer_socket.CommandFromEntityClass( sdBotFactory, 'OPEN_CODE_EDITOR', [ this._net_id, ( this._code || sdBotFactory.default_program ), this.program_message ] ); // class, command_name, parameters_array
				
				this._developer = exectuter_character;
			}
			else
			if ( command_name === 'RESUME' )
			{
				this.program_stopped = false;
				
				if ( ( this._code || sdBotFactory.default_program ) === null )
				executer_socket.SDServiceMessage( 'Program was not specified yet' );
			}
			else
			if ( command_name === 'STOP' )
			{
				this.program_stopped = true;
				
				if ( ( this._code || sdBotFactory.default_program ) === null )
				executer_socket.SDServiceMessage( 'Program was not specified yet' );
			
				if ( this.program_message === 'Program started' || this.program_message === null )
				this._program_globals.trace( 'Program stopped' );
			}
			else
			if ( command_name === 'START' )
			{
				this._program = null;
				this.program_message = null;
				this.program_message_censored = 0;
				this.program_stopped = false;
					
				this._pending_disassembly = true;
				
				if ( ( this._code || sdBotFactory.default_program ) === null )
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