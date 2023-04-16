
/* global sdModeration, sdShop, THREE */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdBotFactory from './sdBotFactory.js';
import sdProgram from './sdProgram.js';
import sdBeacon from './sdBeacon.js';
import sdPlayerDrone from './sdPlayerDrone.js';
import sdBullet from './sdBullet.js';
import sdBotCharger from './sdBotCharger.js';
import sdTurret from './sdTurret.js';

import sdPathFinding from '../ai/sdPathFinding.js';

class sdBot extends sdEntity
{
	static init_class()
	{
		//sdBot.img_beacon = sdWorld.CreateImageFromFile( 'beacon' );
		
		// Additionally hardcoded into sdBotFactory's ._program_globals
		sdBot.BOT_KIND_REPAIR = 0;
		sdBot.BOT_KIND_ATTACK = 1;
		
		sdBot.function_descriptions = null; // Used for code editor
		let s = sdBot.toString();
		s = s.substring( s.indexOf( '/*HINT_'+'START*/' ), s.indexOf( '/*HINT_'+'END*/' ) );
		let obj;
		eval( 'obj = '+s );
		sdBot.function_descriptions = sdProgram.PrepareFunctionDescriptions( obj );
		
		sdBot.ignored_classes = [ 'sdBotFactory', 'sdBotCharger' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	/*static init()
	{
		sdBot.ignored_classes = [ sdBotFactory ];
	}*/
	get hitbox_x1() { return this.kind === sdBot.BOT_KIND_REPAIR ? -7.9 : -7.9; }
	get hitbox_x2() { return this.kind === sdBot.BOT_KIND_REPAIR ? 7.9 : 7.9; }
	get hitbox_y1() { return this.kind === sdBot.BOT_KIND_REPAIR ? -5 : -6; }
	get hitbox_y2() { return this.kind === sdBot.BOT_KIND_REPAIR ? 4 : 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return ( this.frame < 3 ); }
	
	//
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdBot.ignored_classes;
	}
	
	SetCarrying( ent )
	{
		if ( this.carrying !== ent )
		{
			if ( this.kind === sdBot.BOT_KIND_REPAIR )
			{
				this.carrying = ent;
				
				if ( ent )
				{
					this.carrying.PhysWakeUp();
					this.carrying.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					
					sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:0.5, pitch:2 });
				}
				else
				{
					//this._pathfinding_carrying = null;
					sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:2, pitch:0.5 });
				}
				
				if ( ent )
				this._trail = [ this.carrying.x, this.carrying.y, this.x, this.y ];
				else
				this._trail = null;

				// TODO: Sound effects
			}
			else
			{
				throw new Error( 'Carrying is not available for this kind of bot' );
			}
		}
	}
	
	StartDisassemblyTask()
	{
		if ( !this._disassembly_task )
		{
			this._disassembly_task = true;
			
			this.MoveTowardsEntity( this._owner, 0, false, false );
			this._code = null;
			this._program = null;
			
			this.program_message = 'Returning for disassembly';
			this.program_message_censored = 0;
			
			this.SetCarrying( null );
		}
	}
	
	MoveTowardsEntity( ent, range=0, dig_through=false, attack_followed_entity=false ) // Same is in code but wityhout pseudo functions
	{
		if ( ent !== this._throttle_towards_entity )
		{
			this._throttle_towards_entity = ent;
			this._throttle_x = 0;
			this._throttle_y = 0;

			this._attack_entity = attack_followed_entity;

			if ( ent )
			this._pathfinding = new sdPathFinding({ target: ent, traveler: this, attack_range: range, options: dig_through ? [ sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS, sdPathFinding.OPTION_CAN_SWIM ] : [ sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_SWIM ] });
			else
			this._pathfinding = null;
		}
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.kind = params.kind || sdBot.BOT_KIND_REPAIR;
		
		this.side = 1;
		
		this.frame = 0;
		
		this.an = 0;
		
		if ( this.kind === 0 )
		this.hmax = 100;
		else
		this.hmax = 100 * 4;
	
		this._disassembly_task = false; // Makes it go to factory and get recycled
	
		this.hea = this.hmax;
		
		this._hurt_timer = 0;
		this._fire_timer = 0;
		
		this._ai_last_attacker = null; // For program logic
		this._ai_last_seen_player = null; // Or driven vehicle
		
		this._matter_max = 300;
		this.matter = 300;
		
		this._look_x = this.x;
		this._look_y = this.y;
		
		this._throttle_x = 0;
		this._throttle_y = 0;
		this._throttle_towards_entity = null;
		this._pathfinding = null;
		//this._pathfinding_carrying = null; // For carried item?
		this._attack_entity = false;
		
		this._trail = []; // When carrying - it assits carried item's movement
		
		this.carrying = null; // Entity
		this._carrying_throttle = false;
		this._carried_teleport_wish = 0;
		
		this._code = params.code || null;
		this._program = null;
		this.program_message = null;
		this.program_message_censored = 0;
		this._program_globals = /*HINT_START*/{
			
			trace: ( ...m )=>
			{
				if ( !sdWorld.is_server )
				return;
				
				let responsible_socket = null;
				if ( this._owner )
				if ( this._owner._developer )
				if ( this._owner._developer._socket )
				responsible_socket = this._owner._developer._socket;
				
				this.program_message = m.join( ' ' ) + '';
				this.program_message_censored = sdModeration.IsPhraseBad( this.program_message, responsible_socket );
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
			
			GetBeacon: ( biometry )=>
			{
				//if ( this._owner && !this._owner._is_being_removed )
				//{
					//for ( let i = 0; i < this._owner._known_beacon_ids.length; i++ )
					for ( let i = 0; i < sdBeacon.beacons.length; i++ )
					{
						/*let ent = sdEntity.GetObjectByClassAndNetId( 'auto', this._owner._known_beacon_ids[ i ] );
						
						if ( !ent )
						{
							this._owner._known_beacon_ids.splice( i, 1 );
							i--;
							continue;
						}*/
						
						let ent = sdBeacon.beacons[ i ];
						
						if ( ent.biometry === biometry )
						{
							let obj = sdProgram.GetShellObjectByEntity( ent, this._program );
							
							obj = this._program.interpreter.nativeToPseudo( obj );
							
							return obj;
						}
					}
				/*}
				else
				{
					this.LostSignalSequence();
				}*/
				
				return null;
			},
			
			MoveTowardsDirection: ( x, y )=>
			{
				this._throttle_towards_entity = null;
				this._throttle_x = parseFloat( x ) || 0;
				this._throttle_y = parseFloat( y ) || 0;
				this._pathfinding = null;
				
				this._attack_entity = false;
			},
			
			IsCarrying: ()=>
			{
				return this.carrying ? true : false;
			},
			
			GetCarriedEntity: ()=>
			{
				let obj = sdProgram.GetShellObjectByEntity( this.carrying, this._program );
				
				obj = this._program.interpreter.nativeToPseudo( obj );
				
				return obj;
			},
			
			CarryIfPossible: ( pseudo_shell_obj )=>
			{
				if ( this.kind !== sdBot.BOT_KIND_REPAIR )
				return;
			
				let shell_obj = this._program.interpreter.pseudoToNative( pseudo_shell_obj );
				
				let ent = sdProgram.GetEntityByShellObject( shell_obj, this._program );
				
				if ( !ent )
				this._program_globals.trace( 'Warning: CarryIfPossible target does not exist' );
				
				if ( ent )
				if ( !ent.is_static )
				if ( typeof ent.sx !== 'undefined' )
				if ( typeof ent.sy !== 'undefined' )
				{
					if ( this.inRealDist2DToEntity_Boolean( ent, 8 ) )
					{
						this.SetCarrying( ent );
					}
				}
			},
			
			StopCarrying: ()=>
			{
				if ( this.carrying )
				{
					this.SetCarrying( null );
				}
				else
				{
					this._program_globals.trace( 'Warning: StopCarrying called but nothing is carried' );
				}
			},
			
			GetBot: ()=>
			{
				let obj = sdProgram.GetShellObjectByEntity( this, this._program );
				
				obj = this._program.interpreter.nativeToPseudo( obj );
				
				return obj;
			},
			
			GetBots: ( specific_kind=-1 )=>
			{
				let arr = this._owner.GetBots( specific_kind );
				
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
				
				let arr = this._owner.GetBots( specific_kind );
				
				for ( let i = 0; i < arr.length; i++ )
				{
					if ( arr[ i ] !== this )
					arr[ i ].ReceiveBroadcast( message );
				}
				this._owner.ReceiveBroadcast( message );
			},
			
			BroadcastMessageToBot: ( pseudo_message, pseudo_shell_obj )=>
			{
				let message = this._program.interpreter.pseudoToNative( pseudo_message );
				
				let arr = this._owner.GetBots();
				
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
			
			GetVisibleEntities: ()=>
			{
				let arr = [];
				
				for ( let i = 0; i < this._visible_entities_buffer.length; i++ )
				arr.push( sdProgram.GetShellObjectByEntity( this._visible_entities_buffer[ i ], this._program ) );
				
				arr = this._program.interpreter.nativeToPseudo( arr );
				
				return arr;
			},
			
			MoveTowardsEntity: ( pseudo_shell_obj, range=0, dig_through=false, attack_followed_entity=false )=>
			{
				let shell_obj = this._program.interpreter.pseudoToNative( pseudo_shell_obj );
				
				let ent = sdProgram.GetEntityByShellObject( shell_obj, this._program );
				
				if ( !ent )
				this._program_globals.trace( 'Warning: MoveTowardsEntity target does not exist' );
				
				this.MoveTowardsEntity( ent, range, dig_through, attack_followed_entity );
			},
			
			GetLastAttacker: ()=>
			{
				let obj = sdProgram.GetShellObjectByEntity( this._ai_last_attacker, this._program );
				
				obj = this._program.interpreter.nativeToPseudo( obj );
				
				return obj;
			},
			
			GetFactory: ()=>
			{
				let obj = sdProgram.GetShellObjectByEntity( this._owner, this._program );
				
				obj = this._program.interpreter.nativeToPseudo( obj );
				
				return obj;
			},
			
			GetClosestCharger: ()=>
			{
				let best_ent = null;
				let best_di = Infinity;
				
				for ( let i = 0; i < sdBotCharger.chargers.length; i++ )
				{
					let ent = sdBotCharger.chargers[ i ];
					
					if ( ent.matter > 30 )
					{
						let di = sdWorld.Dist2D( this.x, this.y, ent.x, ent.y );
						if ( di < best_di )
						{
							best_ent = ent;
							best_di = di;
						}
					}
				}
				
				let obj = sdProgram.GetShellObjectByEntity( best_ent, this._program );
				
				obj = this._program.interpreter.nativeToPseudo( obj );
				
				return obj;
			},
			
			DistanceTowardsEntity: ( pseudo_shell_obj )=>
			{
				let shell_obj = this._program.interpreter.pseudoToNative( pseudo_shell_obj );
				
				let ent = sdProgram.GetEntityByShellObject( shell_obj, this._program );
				
				if ( !ent )
				{
					this._program_globals.trace( 'Warning: DistanceTowardsEntity target does not exist' );
					return Infinity;
				}
				
				return sdWorld.Dist2D( 
					this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2,
					this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2,
					ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2,
					ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2 
				);
			},
			
			StartDisassemblyTask: ()=>
			{
				this.StartDisassemblyTask();
			}
		}/*HINT_END*/;
		
		/*if ( sdBot.function_descriptions === null )
		{
			sdBot.function_descriptions = sdProgram.PrepareFunctionDescriptions( this._program_globals );
		}*/
		
		this._scheduled_broadcasts = [];
		
		//this._known_beacon_ids = params.known_beacon_ids.slice() || [];
		this._visible_entities_buffer = [];
		this._owner = params.owner || null; // sdBotFactory?
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_owner' || 
				 //prop === '_visible_entities_buffer' || 
				 prop === '_code' || 
				 prop === '_throttle_towards_entity' || 
				 prop === '_ai_last_attacker' || 
				 prop === '_ai_last_seen_player'
		);
	}
	LostSignalSequence()
	{
		if ( this.hea > 0 )
		{
			this._program_globals.trace( 'Error: Lost signal' );
			this.Damage( this.hea );
		}
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 5 );
		}
	}
	
	get mass() 
	{ 
		return 100;
	}
	
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	SyncedToPlayer( character )
	{
		if ( character.driver_of )
		character = character.driver_of;
		
		if ( this.hea > 0 )
		if ( character.IsTargetable( this ) && ( this.kind === sdBot.BOT_KIND_ATTACK || character.IsVisible( this ) ) )
		if ( ( character.hea || character._hea ) > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < 800 )
			{
				this._ai_last_seen_player = character;
			}
		}
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		{
			this._ai_last_attacker = initiator;
		}

		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;

		this.hea -= dmg;
		
		if ( this.hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:2 });
		}
		else
		{
			if ( this.hea > 0 )
			{
				if ( this._hurt_timer <= 0 )
				{
					sdSound.PlaySound({ name:'spider_hurtC', x:this.x, y:this.y, volume: 1, pitch:1 });
					
					this._hurt_timer = 5;
				}
			}
		}
		
		if ( this.hea < -this.hmax )
		this.remove();
	}
	
	ReceiveBroadcast( message )
	{
		if ( this._scheduled_broadcasts.length < 32 )
		this._scheduled_broadcasts.push( message );
	}
	
	GetRandomEntityNearby()
	{
		let an = Math.random() * Math.PI * 2;

		if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.x + Math.sin( an ) * 900, this.y + Math.cos( an ) * 900, this ) )
		{
			return sdWorld.last_hit_entity;
		}
		return null;
	}
	
	LookAt( xx, yy )
	{
		let an = Math.atan2( yy - this.y, xx - this.x );

		if ( xx > this.x )
		this.side = 1;
		else
		this.side = -1;

		if ( this.side < 0 )
		{
			this.an = ( an + Math.PI ) * 100;
		}
		else
		{
			this.an = ( -an ) * 100;
		}
		
		this._look_x = xx;
		this._look_y = yy;
		
		return an;
	}
	
	Attack( ent )
	{
		if ( this.kind !== sdBot.BOT_KIND_ATTACK )
		return;
		
		let xx = ent.x + ( ent._hitbox_x1 + ent._hitbox_x2 ) / 2;
		let yy = ent.y + ( ent._hitbox_y1 + ent._hitbox_y2 ) / 2;

		let di = sdWorld.Dist2D( this.x, this.y, xx, yy );

		let vel = 15;
		let an = this.LookAt( xx + (ent.sx||0) * di / vel, yy + (ent.sy||0) * di / vel );/*Math.atan2( yy + (ent.sy||0) * di / vel - this.y, xx + (ent.sx||0) * di / vel - this.x );

		if ( xx > this.x )
		this.side = 1;
		else
		this.side = -1;*/


		if ( this.side < 0 )
		{
			this.an = ( an + Math.PI ) * 100;
		}
		else
		{
			this.an = ( -an ) * 100;
		}

		if ( this._fire_timer <= 0 )
		{
			this._fire_timer = 10;
			
			sdSound.PlaySound({ name:'tzyrg_fire', x:this.x, y:this.y, volume:0.5, pitch: 1 });
			
			let bullet_obj = new sdBullet({ x: this.x, y: this.y });

			bullet_obj._owner = this;

			bullet_obj.sx = Math.cos( an );
			bullet_obj.sy = Math.sin( an );

			bullet_obj.sx *= vel;
			bullet_obj.sy *= vel;

			bullet_obj._damage = 30;
			bullet_obj.color = '#00ffff';

			//this._owner = this.master; // To make bullets pass through master

			sdEntity.entities.push( bullet_obj );
		}
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !this._owner || this._owner._is_being_removed )
		{
			this._owner = null;
			this.LostSignalSequence();
		}

		if ( sdWorld.is_server )
		{
			if ( this.hea <= 0 )
			{
				this.frame = Math.max( 3, this.frame + GSPEED * 0.1 );

				if ( this.frame > 20 + 0.1 * 30 )
				{
					this.remove();
					this._broken = false;
					return true;
				}
			}
			else
			{
				this.frame = 0;

				if ( this._hurt_timer > 0 )
				{
					this._hurt_timer -= GSPEED;
					this.frame = 2;
				}

				if ( this._fire_timer > 0 )
				{
					this._fire_timer -= GSPEED;
				}	
				if ( this._fire_timer > 5 )
				{
					this.frame = 1;
				}
			}
			
			if ( this.carrying )
			if ( this.carrying._is_being_removed || this.hea <= 0 )
			{
				this.SetCarrying( null );
			}
		}
		
		if ( this.frame < 3 && this.matter >= 1 )
		{
			if ( this.matter > 0 )
			this.matter -= GSPEED * 0.01;

			if ( this._pathfinding )
			{
				let pathfinding_result = this._pathfinding.Think( GSPEED );
				
				if ( pathfinding_result )
				{
					this._throttle_x = pathfinding_result.act_x;
					this._throttle_y = pathfinding_result.act_y;
					
					if ( this._fire_timer <= 0 )
					{
						this._look_x += this.sx * GSPEED;
						this._look_y += this.sy * GSPEED;
						
						if ( this._throttle_x !== 0 || this._throttle_y !== 0 )
						{
							this._look_x = sdWorld.MorphWithTimeScale( this._look_x, this.x + this._throttle_x * 32, 0.7, GSPEED );
							this._look_y = sdWorld.MorphWithTimeScale( this._look_y, this.y + this._throttle_y * 32, 0.7, GSPEED );
						}
						this.LookAt( this._look_x, this._look_y );
					}

					if ( pathfinding_result.attack_target )
					{
						if ( 
								( this._attack_entity && pathfinding_result.attack_target === this._throttle_towards_entity ) ||
								( pathfinding_result.attack_target !== this._throttle_towards_entity )
							)
						this.Attack( pathfinding_result.attack_target );
						/*
						if ( pathfinding_result.attack_target === this._throttle_towards_entity )
						{
							if ( this._attack_entity )
							{
							}
						}*/
					}
				}
			}
			
			let dx = this._throttle_x;
			let dy = this._throttle_y;
			
			let di = sdWorld.Dist2D_Vector( dx, dy );
			if ( di > 1 )
			{
				dx /= di;
				dy /= di;
			}
			
			if ( this.carrying && this._carrying_throttle )
			{
				dx *= 0.25;
				dy *= 0.25;
			}
			else
			{
				dx *= 3;
				dy *= 3;
			}
			
			/*if ( this._fire_timer <= 0 )
			{
				if ( this._throttle_x > 0 )
				this.side = 1;
				else
				if ( this._throttle_x < 0 )
				this.side = -1;
			}*/
			
			if ( sdWorld.inDist2D_Boolean( this.sx, this.sy, dx, dy, 0.25 ) )
			{
				// Follow path
				this.sx = dx;
				this.sy = dy;
				
				if ( this.sx !== 0 || this.sy !== 0 )
				this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			}
			else
			{
				// Try to stop intertia
				this.ApplyVelocityAndCollisions( GSPEED, 0, true );
				this.sx = sdWorld.MorphWithTimeScale( this.sx, dx, 0.8, GSPEED );
				this.sy = sdWorld.MorphWithTimeScale( this.sy, dy, 0.8, GSPEED );
			}
			
			for ( let t = 0; t < 1; t++ )
			{
				let ent = this.GetRandomEntityNearby();
				
				if ( ent )
				{
					/*if ( ent.is( sdBeacon ) )
					{
						if ( this._owner )
						this._owner._known_beacon_ids.push( ent._net_id );
					}*/

					if ( this._visible_entities_buffer.indexOf( ent ) === -1 )
					{
						this._visible_entities_buffer.push( ent );

						if ( this._visible_entities_buffer.length > 30 )
						this._visible_entities_buffer.shift();
					}
				}
			}
			
			if ( this._code !== null )
			{
				if ( this._program === null )
				{
					//this._program_globals.trace( 'Program started' );
					this._program = sdProgram.StartProgram( this._code, this._program_globals );
				}

				this._program.Think( GSPEED );
			}
			
			if ( this.carrying )
			{
				let xx = this.x - this._throttle_x * 16;
				let yy = this.y - this._throttle_y * 16;
				
				this._carrying_throttle = false;
				
				//let xx = this.x;
				//let yy = this.y + this._hitbox_y2 - this.carrying._hitbox_y1 + 5;
				
				/*if ( this._pathfinding && this._throttle_towards_entity )
				{
					if ( !this._pathfinding_carrying )
					this._pathfinding_carrying = new sdPathFinding({ target: this._throttle_towards_entity, traveler: this.carrying, attack_range: 0, options: [ sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_SWIM ] })

					let pathfinding2_result = this._pathfinding_carrying.Think( GSPEED );
					if ( pathfinding2_result )
					{
						xx = this.carrying.x + pathfinding2_result.act_x * 32;
						yy = this.carrying.y + pathfinding2_result.act_y * 32;

						//sdWorld.SendEffect({ x: xx, y: yy, type:sdEffect.TYPE_WALL_HIT });
					}
				}*/
							
				/*let lx = this._trail[ this._trail.length - 2 ];
				let ly = this._trail[ this._trail.length - 1 ];
				
				if ( !sdWorld.inDist2D_Boolean( lx, ly, this.x, this.y, 16 ) )
				{
					this._trail.push( this.x, this.y );
				}
				
				let xx = this._trail[ 2 ];
				let yy = this._trail[ 3 ];
				
				let over_x = xx - this._trail[ 0 ];
				let over_y = yy - this._trail[ 1 ];
				
				let over_di = sdWorld.Dist2D_Vector( over_x, over_y );
						
				if ( over_di > 1 )
				{
					over_x /= over_di;
					over_y /= over_di;
				}

				over_x *= 16;
				over_y *= 16;
				
				xx += over_x;
				yy += over_y;
					
				if ( this._trail.length > 4 )
				if ( sdWorld.TraceRayPoint( this.carrying.x, this.carrying.y, this._trail[ 2 ], this._trail[ 3 ], this.carrying ) )
				{
					if ( sdWorld.inDist2D_Boolean( this.carrying.x, this.carrying.y, this._trail[ 2 ], this._trail[ 3 ], 32 ) )
					{
						let disp_x = this._trail[ 4 ] - this._trail[ 2 ];
						let disp_y = this._trail[ 5 ] - this._trail[ 3 ];
						
						let disp_di = sdWorld.Dist2D_Vector( disp_x, disp_y );
						
						if ( disp_di > 0.01 )
						{
							disp_x /= disp_di;
							disp_y /= disp_di;
						}
						
						if ( this.carrying.CanMoveWithoutOverlap( this.carrying.x + disp_x, this.carrying.y + disp_y ) )
						if ( this.carrying.CanMoveWithoutOverlap( this.carrying.x + disp_x * 16, this.carrying.y + disp_y * 16 ) )
						{
							this._trail.splice( 0, 2 );
						}
					}
				}
				
				if ( Math.random() < 0.1 )
				sdWorld.SendEffect({ x: xx, y: yy, type:sdEffect.TYPE_WALL_HIT });*/
				
				let disp_x = xx - this.carrying.x;
				let disp_y = yy - this.carrying.y;

				let disp_di = sdWorld.Dist2D_Vector( disp_x, disp_y );

				if ( disp_di > 0.01 )
				{
					disp_x /= disp_di;
					disp_y /= disp_di;
				}
				
				let wants_teleport = false;

				if ( !this.carrying.CanMoveWithoutOverlap( this.carrying.x + disp_x, this.carrying.y + disp_y ) )
				if ( this.carrying.CanMoveWithoutOverlap( xx, yy ) )
				{
					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, this.carrying, [ 'sdBot' ] ) )
					{
						wants_teleport = true;
					}
					/*else
					{
					//	if ( Math.random() < 0.1 )
						sdWorld.SendEffect({ x: sdWorld.reusable_closest_point.x, y: sdWorld.reusable_closest_point.u, type:sdEffect.TYPE_WALL_HIT });
					}*/
				}
				
				if ( wants_teleport )
				{
					if ( this._carried_teleport_wish < 10 )
					this._carried_teleport_wish += GSPEED;
					else
					{
						this._carried_teleport_wish = 0;
						this.carrying.x = xx;
						this.carrying.y = yy;
					}
				}
				else
				{
					if ( this._carried_teleport_wish > 0 )
					this._carried_teleport_wish -= GSPEED;
				}
				
				let p = 1.5;
				
				//let dx2 = ( xx - this.carrying.x ) + ( this.sx - this.carrying.sx ) * 10;
				//let dy2 = ( yy - this.carrying.y ) + ( this.sy - this.carrying.sy ) * 10;
				let dx2 = ( xx - this.carrying.x ) + ( this.sx - this.carrying.sx ) * 5;
				let dy2 = ( yy - this.carrying.y ) + ( this.sy - this.carrying.sy ) * 5;
				
				let di = sdWorld.Dist2D_Vector( dx2, dy2 );
				

				if ( di > 10 )
				{
					dx2 /= di / 10;
					dy2 /= di / 10;
					
					//this._carrying_throttle = true;
				}
				
				let di_physical = sdWorld.Dist2D( this.x, this.y, this.carrying.x, this.carrying.y );
				
				if ( di_physical > 32 )
				this._carrying_throttle = true;
				
				this.carrying.Impulse( dx2 * p, 
									   dy2 * p );
				
				/*this.Impulse( -dx2 * p, 
							  -dy2 * p );*/
							
							
				this.carrying.PhysWakeUp();
				this.carrying.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			
				if ( di_physical > 128 )
				{
					this.SetCarrying( null );
				}
			}
		}
		else
		{
			this.an = 0;
			
			this.sy += sdWorld.gravity * GSPEED;

			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.frame < 3 )
		{
			sdEntity.TooltipUntranslated( ctx, T("Bot") + ' ( '+(~~this.matter)+' / '+this._matter_max+' )', 0, -8 );
			
			let t = this.program_message || '';

			if ( sdWorld.client_side_censorship && this.program_message_censored )
			t = sdWorld.CensoredText( t );

			sdEntity.TooltipUntranslated( ctx, t, 0, 0, ( t.indexOf( 'Error: ' ) === -1 ) ? '#ffff00' : '#ff0000' ); // ( ctx, t, x=0, y=0, color='#ffffff' )
			
			this.DrawHealthBar( ctx, '#FF0000', 10 );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.frame < 3 )
		ctx.apply_shading = false;
		
		let frame = Math.min( ~~this.frame, 5 );
		
		if ( this.frame > 20 )
		{
			ctx.globalAlpha = 0.5;
		}
		
		
		if ( !sdShop.isDrawing )
		if ( this.matter < 1 )
		{
			ctx.filter = 'brightness(0.1)';
		}
		
		
		
		if ( !sdShop.isDrawing )
		if ( frame < 3 )
		if ( this.matter >= 1 )
		ctx.translate( 0, Math.sin( (sdWorld.time+this._net_id * 318.3127) / 1000 * Math.PI ) * 2 );
	
		ctx.scale( -this.side, 1 );
		
		ctx.rotate( this.an / 100 );
		
		ctx.drawImageFilterCache( sdBotFactory.img_bot_stuff, frame * 32,this.kind*32,32,32, -16,-16,32,32 );
		
		
		
	
		ctx.filter = 'none';
		
		if ( !sdShop.isDrawing )
		if ( sdWorld.time % 4000 < 2000 )
		if ( this.matter < 1 )
		ctx.drawImageFilterCache( sdTurret.img_no_matter, -16, -16, 32,32 );
		
		
		
		
		if ( frame < 3 )
		{
			if ( this.carrying )
			{
				ctx.scale( -this.side, 1 ); // Restore side
		
				ctx.save();
				ctx.blend_mode = THREE.AdditiveBlending;

				ctx.filter = 'none';
				ctx.globalAlpha = 0.5;

				ctx.drawImageFilterCache( sdPlayerDrone.img_glow, - 16, - 16, 32, 32 );

				ctx.translate( this.carrying.x + ( this.carrying._hitbox_x1 + this.carrying._hitbox_x2 ) / 2 - this.x, this.carrying.y + ( this.carrying._hitbox_y1 + this.carrying._hitbox_y2 ) / 2 - this.y );

				ctx.drawImageFilterCache( sdPlayerDrone.img_glow, - 16, - 16, 32, 32 );

				ctx.globalAlpha = 1;
				ctx.blend_mode = THREE.NormalBlending;
				ctx.restore();
			}
		}
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 10, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 100;
	}
	
	
	
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			
		}
	}
}
export default sdBot;