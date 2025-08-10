/*

	No longer recursive. sdTurrets will now scan network to find first sdCom




*/
/* global sdModeration */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCable from './sdCable.js';
import sdDoor from './sdDoor.js';
import sdCharacter from './sdCharacter.js';


class sdCom extends sdEntity
{
	static init_class()
	{
		sdCom.debug_hacking = false;
		
		sdCom.img_com = sdWorld.CreateImageFromFile( 'com' );
		sdCom.img_com_cyan = sdWorld.CreateImageFromFile( 'com_cyan' ); // Level 2
		sdCom.img_com_darkblue = sdWorld.CreateImageFromFile( 'com_darkblue' ); // Level 3
		sdCom.img_com_green = sdWorld.CreateImageFromFile( 'com_green' ); // Level 4
		sdCom.img_com_yellow = sdWorld.CreateImageFromFile( 'com_yellow' ); // Level 5
		sdCom.img_com_pink = sdWorld.CreateImageFromFile( 'com_pink' ); // Level 6
		sdCom.img_com_red = sdWorld.CreateImageFromFile( 'com_red' ); // Level 7
		sdCom.img_com_orange = sdWorld.CreateImageFromFile( 'com_orange' ); // Level 8
		
		sdCom.action_range = 64; // How far character needs to stand in order to manipualte it
		sdCom.action_range_command_centre = 64; // How far character needs to stand in order to manipualte it
		sdCom.vehicle_entrance_radius = 64;
		
		sdCom.retransmit_range = 200; // Only used by GetComsNear/GetComsNearCache
		sdCom.max_subscribers = 32;
		
		sdCom.all_nodes = [];
		
		//sdCom.com_visibility_ignored_classes = [ 'sdBG', 'sdWater', 'sdCom', 'sdDoor', 'sdTurret', 'sdCharacter', 'sdVirus', 'sdQuickie', 'sdOctopus', 'sdMatterContainer', 'sdTeleport', 'sdCrystal', 'sdLamp', 'sdCube' ];

		sdCom.com_visibility_ignored_classes = [ 'sdBG', 'sdWater', 'sdCom', 'sdDoor', 'sdTurret', 'sdCharacter', 'sdVirus', 'sdQuickie', 'sdOctopus', 'sdTeleport', 'sdCube', 'sdEnemyMech', 'sdBadDog', 'sdShark', 'sdDrone', 'sdBeamProjector', 'sdSandWorm', 'sdAmphid', 'sdAbomination', 'sdAsp', 'sdBiter', 'sdCouncilMachine', 'sdPlayerOverlord', 'sdVeloxMiner', 'sdShurgTurret', 'sdTzyrgAbsorber', 'sdSetrDestroyer', 'sdTutel', 'sdAbomination', 'sdMimic', 'sdShurgExcavator', 'sdZektaronDreadnought', 'sdCouncilIncinerator', 'sdLongRangeAntenna', 'sdVeloxFortifier', 'sdSolarMatterDistributor', 'sdCouncilNullifier', 'sdStalker' ]; // Used for sdCube pathfinding now...
		sdCom.com_visibility_unignored_classes = [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier', 'sdCommandCentre', 'sdLongRangeTeleport', 'sdManualTurret' ]; // Used for early threat logic now. Coms don't really trace raycasts anymore. These arrays are a mess though.
		
		sdCom.com_build_line_of_sight_filter_for_early_threats = ( e )=>
		{
			if ( e.is( sdBlock ) || e.is( sdDoor ) )
			return true; // Stop search and fail line of sight test
		
			return false;
		};

		sdCom.com_creature_attack_unignored_classes = [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ]; // Used by sdVirus so far. Also for rain that spawns grass
		
		//sdCom.com_faction_attack_classes = [ 'sdManualTurret', 'sdTurret', 'sdCharacter', 'sdDrone', 'sdEnemyMech', 'sdSpider', 'sdSetrDestroyer', 'sdVeloxMiner', 'sdShurgExcavator', 'sdShurgTurret', 'sdTzyrgAbsorber', 'sdZektaronDreadnought', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdAmphid', 'sdAbomination', 'sdAsp', 'sdBadDog', 'sdBiter', 'sdOctopus', 'sdQuickie', 'sdSandWorm', 'sdVirus', 'sdTutel', 'sdFaceCrab' ]; // Classes which factions can attack (sdDrones, sdCharacters, etc...)
		sdCom.com_faction_attack_classes = [ 'sdManualTurret', 'sdTurret', 'sdCharacter', 'sdDrone', 'sdEnemyMech', 'sdSpider', 'sdSetrDestroyer', 'sdVeloxMiner', 'sdShurgExcavator', 'sdShurgTurret', 'sdTzyrgAbsorber', 'sdZektaronDreadnought', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdAmphid', 'sdAbomination', 'sdAsp', 'sdBadDog', 'sdBiter', 'sdOctopus', 'sdQuickie', 'sdSandWorm', 'sdVirus', 'sdTutel', 'sdFaceCrab', 'sdCube', 'sdCouncilIncinerator', 'sdTzyrgMortar', 'sdStalker' ]; // Classes which factions can attack (sdDrones, sdCharacters, etc...)
		
		sdCom.com_vision_blocking_classes = [ 'sdBlock', 'sdDoor' ];
		sdCom.com_protectable_solid_classes = [ 'sdBlock', 'sdDoor', 'sdBG' ];
		
		sdCom.com_visibility_unignored_classes_plus_erthals = sdCom.com_visibility_unignored_classes.slice();
		sdCom.com_visibility_unignored_classes_plus_erthals.push( 'sdSpider', 'sdDrone' ); // All drones, but this should be enough to check if player aims as current entity
		
		//sdCom.hacking_duration = 30 * 1; // Too quick
		sdCom.hacking_duration = 30 * 30;
		//sdCom.hacking_duration = 30 * 60 * 30;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -4; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 7; }
	
	get hard_collision()
	{ return true; }
	
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }
	
	get title()
	{
		//return 'Communication node';
		return 'Access management node';
	}
	get description()
	{
		return `Access management nodes can be used to grant exclusive access for doors & teleports as well as make turrets not target specific Star Defenders.`;
	}
	
	//IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	//{ return true; }
	
	// Imaging creating fake com so people inside base connect it to everything. That would be fun
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		if ( this.hacking_left > 0 )
		{
			this.hacking_left = 0;
			this._hacker = null;
			//this._update_version++;
			sdSound.PlaySound({ name:'ghost_stop', pitch: 0.5, x:this.x, y:this.y, volume:1 });
		}
			
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
		
		this.variation = params.variation || 0;
		this._hmax = ( 400 + ( 50 * this.variation ) ); // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;

		this.subscribers = []; // works with _net_ids but should use biometry now
		this.subscribers_names = []; // Player names
		this.subscribers_names_censored = [];
		this._cc_id = 0; // Not used as part of regular game
		
		this.through_walls = 0;
		
		this._owner = null; // Only used to add creator to subscribers list on spawn
		
		/*if ( sdWorld.is_server )
		{
			this.NotifyAboutNewSubscribers( 2 );
		}*/
		this._matter = 0; // Just so it can transfer matter in cable network
		this._matter_max = 20;
		
		this.hacking_left = 0; // High tier node can try hacking other nodes?
		this._hacker = null;
		this._hacking_timer_total = 0;
		
		this._awaits_patch = true;
		
		sdCom.all_nodes.push( this );
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_hacker' ) return true;

		return false;
	}
	onSnapshotApplied()
	{
		if ( Date.now() < 1742247297456 ) // Until March 15, 2025
		this._awaits_patch = true;
	}
	static GetNameFor( biometry_or_class )
	{
		if ( typeof biometry_or_class === 'number' )
		for ( let i = 0; i < sdCharacter.characters.length; i++ )
		if ( sdCharacter.characters[ i ].biometry === biometry_or_class )
		return sdCharacter.characters[ i ].title;
		
		return '';
	}
	onBuilt()
	{
		if ( this._owner )
		this.NotifyAboutNewSubscribers( 1, [ this._owner.biometry ] );
		//this.NotifyAboutNewSubscribers( 1, [ this._owner._net_id ] );
	}
	GetSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null )
	{
		if ( save_as_much_as_possible || observer_entity === null )
		return super.GetSnapshot( current_frame, save_as_much_as_possible, observer_entity );
		
		
		let hide_contents = false;
		
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, observer_entity.x, observer_entity.y, sdCom.action_range ) )
		{
		}
		else
		{
			current_frame -= 100; // Make it so frame is different for case of obfuscation. Otherwise 1 out of 2 players seeing this entity might get wrong mixed snapshots
			hide_contents = true;
		}
		
		let snapshot = super.GetSnapshot( current_frame, save_as_much_as_possible, observer_entity );
		
		if ( hide_contents )
		{
			let id = snapshot.subscribers.indexOf( observer_entity.biometry );
			
			if ( id === -1 )
			{
				snapshot.subscribers = [];
				snapshot.subscribers_names = [];
				snapshot.subscribers_names_censored = [];
				snapshot.through_walls = 0;
			}
			else
			{
				snapshot.subscribers = [ snapshot.subscribers[ id ] ];
				snapshot.subscribers_names = [ snapshot.subscribers_names[ id ] ];
				snapshot.subscribers_names_censored = [ snapshot.subscribers_names_censored[ id ] ];
			}
		}
		
		return snapshot;
	}
	NotifyAboutNewSubscribers( append1_or_remove0_or_inherit_back2, subs, counter_recursive_array=null ) // inherit_back is for new coms
	{
		if ( counter_recursive_array === null )
		counter_recursive_array = [];
	
		if ( counter_recursive_array.indexOf( this ) !== -1 )
		return;
	
		if ( append1_or_remove0_or_inherit_back2 !== 2 )
		{
			counter_recursive_array.push( this );
			for ( var i = 0; i < subs.length; i++ )
			{
				if ( append1_or_remove0_or_inherit_back2 === 1 )
				{
					if ( this.subscribers.indexOf( subs[ i ] ) === -1 )
					{
						if ( this.subscribers.length + 1 > sdCom.max_subscribers )
						{
							//this.remove();
							return;
						}
						
						let title = sdCom.GetNameFor( subs[ i ] );
						
						this.subscribers.push( subs[ i ] );
						this.subscribers_names.push( title );
						this.subscribers_names_censored[ i ] = ( typeof sdModeration !== 'undefined' && sdModeration.IsPhraseBad( title, null ) ) ? 1 : 0;
						//this._update_version++;
					}
				}
				else
				if ( append1_or_remove0_or_inherit_back2 === 0 )
				{
					let id = this.subscribers.indexOf( subs[ i ] );
					if ( id !== -1 )
					{
						this.subscribers.splice( id, 1 );
						this.subscribers_names.splice( id, 1 );
						this.subscribers_names_censored.splice( id, 1 );
						//this._update_version++;
					}
				}
			}
		}
	}
	
	/*onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}*/
	
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return true;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._awaits_patch )
		{
			this._awaits_patch = false;
			for ( let i = 0; i < this.subscribers.length; i++ )
			if ( typeof this.subscribers[ i ] === 'number' )
			if ( this.subscribers_names[ i ] === undefined || this.subscribers_names[ i ] === '' )
			{
				this.subscribers_names[ i ] = sdCom.GetNameFor( this.subscribers[ i ] );
				this.subscribers_names_censored[ i ] = ( typeof sdModeration !== 'undefined' && sdModeration.IsPhraseBad( this.subscribers_names[ i ], null ) ) ? 1 : 0;
			}
		}
		
		this.MatterGlow( 0.1, 0, GSPEED ); // 0 radius means only towards cables
		
		if ( this.hacking_left > 0 )
		{
			if ( sdWorld.is_server && ( !this._hacker || this._hacker._is_being_removed || this._hacker.hea <= 0 || !sdWorld.inDist2D_Boolean( this._hacker.x, this._hacker.y, this.x, this.y, 64 ) ) )
			{
				this.hacking_left = 0;
				this._hacker = null;
				//this._update_version++;
				sdSound.PlaySound({ name:'ghost_stop', pitch: 0.5, x:this.x, y:this.y, volume:1 });
			}
			else
			{
				let old = this.hacking_left;
				
				this.hacking_left -= GSPEED;
				
				if ( sdCom.debug_hacking )
				this.hacking_left -= GSPEED * 20;
				
				this._hacking_timer_total += GSPEED;
				
				if ( this.hacking_left <= 0 )
				{
					if ( sdWorld.is_server )
					{
						let near = this.GetHackablesNearby();
							
						let r = Math.random();
						
						if ( r > sdWorld.server_config.com_node_hack_success_rate && !sdCom.debug_hacking ) // 0.15 % chance
						{
							sdSound.PlaySound({ name:'ghost_stop', pitch: 0.5, x:this.x, y:this.y, volume:1 });
							this.hacking_left = sdCom.hacking_duration;
							//this._update_version++;
							
							if ( r > 0.99 )
							if ( this._hacker )
							this._hacker.Say( sdWorld.GetAny([
									'This is fun...',
									'One more hour...',
									'I think I\'m getting close',
									'Huh...',
									'I think they do have antivirus...',
									'Damn, license has expired. Gotta purchase new one...',
									'One more try...'
							]));
						}
						else
						{
							sdSound.PlaySound({ name:'kick_blaster', pitch: 0.2, x:this.x, y:this.y, volume:1 });
							this.hacking_left = 0;
							//this._update_version++;
							this._hacker = null;

							if ( near.length > 0 )
							{
								let e = near[ Math.floor( Math.random() * near.length ) ];
								
								let old_cables_set = sdCable.cables_per_entity.get( e );
								if ( old_cables_set )
								{
									for ( let cable of old_cables_set )
									{
										if ( cable.p.is( sdCom ) || cable.c.is( sdCom ) )
										cable.remove();
									}
								}
								
								if ( e.is( sdDoor ) )
								{
									e.open_type = sdDoor.OPEN_TYPE_COM_NODE;
								}

								let cable = new sdCable({ 
									x: this.x, 
									y: this.y, 
									parent: this,
									child: e,
									offsets: [ 0,0, ( e._hitbox_x1 + e._hitbox_x2 ) / 2, ( e._hitbox_y1 + e._hitbox_y2 ) / 2 ],
									type: sdCable.TYPE_MATTER
								});

								sdEntity.entities.push( cable );

								if ( this._hacker )
								{
									function toHoursAndMinutes(totalSeconds) {
										const totalMinutes = Math.floor(totalSeconds / 60);

										const seconds = totalSeconds % 60;
										const hours = Math.floor(totalMinutes / 60);
										const minutes = totalMinutes % 60;

										return { h: hours, m: minutes, s: seconds };
									}

									let hms = toHoursAndMinutes( Math.ceil( this._hacking_timer_total / 30 ) );
									
									let parts = [];// 'It took' ];
									
									if ( hms.h > 0 )
									parts.push( '<' + hms.h + '> hour' + ( hms.h === 1 ? '' : 's' ) );
									
									if ( hms.m > 0 )
									parts.push( '<' + hms.m + '> minute' + ( hms.m === 1 ? '' : 's' ) );
									
									if ( hms.s > 0 )
									parts.push( '<' + hms.s + '> second' + ( hms.s === 1 ? '' : 's' ) );
								
									if ( parts.length > 1 )
									{
										parts.splice( parts.length - 1, 0, 'and' );
									}
									
									let took = ' It took ' + parts.join(' ');
									
									this._hacker.Say( sdWorld.GetAny([
											'Hey! Would you look at that?!' + took,
											'It is open!' + took,
											'Access granted!' + took,
											'Ha-ha!' + took,
											'Success!' + took
									]));
								}
							}
						}
					}
					else
					{
						this.hacking_left = 0;
						this._hacker = null;
					}
				}
				else
				{
					if ( Math.round( old / 30 ) !== Math.round( this.hacking_left / 30 ) )
					sdSound.PlaySound({ name:'ghost_start', pitch: 0.5 + 0.2 * ( 1 - this.hacking_left / sdCom.hacking_duration ), x:this.x, y:this.y, volume:1 });
				}
			}
		}
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		//if ( this._matter < 0.05 || this._matter >= this._matter_max )
		if ( this.hacking_left <= 0 )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
		
		//this.DrawConnections( ctx );
	
		if ( this.hacking_left > 0 )
		{
			let c = 1 - this.hacking_left / sdCom.hacking_duration;
			
			let w = 16;
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 10, w, 3 );
			
			ctx.fillStyle = '#00aa00';
			ctx.fillRect( 1 - w / 2, 1 - 10, ( w - 2 ) * Math.max( 0, c ), 1 );
		}
	}
	
	onRemoveAsFakeEntity()
	{
		let i = sdCom.all_nodes.indexOf( this );
		if ( i !== -1 )
		sdCom.all_nodes.splice( i, 1 );
	}
	onRemove()
	{
		let i = sdCom.all_nodes.indexOf( this );
		if ( i !== -1 )
		sdCom.all_nodes.splice( i, 1 );

		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	Draw( ctx, attached )
	{
		if ( this.variation === 0 )
		ctx.drawImageFilterCache( sdCom.img_com, -16, -16, 32,32 );
		if ( this.variation === 1 )
		ctx.drawImageFilterCache( sdCom.img_com_cyan, -16, -16, 32,32 );
		if ( this.variation === 2 )
		ctx.drawImageFilterCache( sdCom.img_com_darkblue, -16, -16, 32,32 );
		if ( this.variation === 3 )
		ctx.drawImageFilterCache( sdCom.img_com_green, -16, -16, 32,32 );
		if ( this.variation === 4 )
		ctx.drawImageFilterCache( sdCom.img_com_yellow, -16, -16, 32,32 );
		if ( this.variation === 5 )
		ctx.drawImageFilterCache( sdCom.img_com_pink, -16, -16, 32,32 );
		if ( this.variation === 6 )
		ctx.drawImageFilterCache( sdCom.img_com_red, -16, -16, 32,32 );
		if ( this.variation === 7 )
		ctx.drawImageFilterCache( sdCom.img_com_orange, -16, -16, 32,32 );
	}
	MeasureMatterCost()
	{
		if ( this.variation >= 7 )
		return 400;
		
		return 60;
	}
	
	RequireSpawnAlign()
	{ return true; }
	get spawn_align_x(){ return 4; };
	get spawn_align_y(){ return 4; };
	
	GetHackablesNearby( complain_as=null )
	{
		let near;
		
		
		if ( !complain_as )
		complain_as = this._hacker;
		
		
		near = sdWorld.GetAnythingNear( this.x, this.y, 64 );
		for ( let i = 0; i < near.length; i++ )
		{
			if ( near[ i ] !== this && near[ i ].is( sdCom ) )
			if ( near[ i ].hacking_left > 0 )
			{
				near[ i ].hacking_left = 0;
				near[ i ]._hacker = null;
				//near[ i ]._update_version++;
				
				if ( complain_as )
				{
					complain_as.Say( sdWorld.GetAny([
							'That would have been smart',
							'Yeah, yeah...',
							'I\'d need to focus',
							'Let\'s do one by one'
					]));
						
					complain_as = null;
				}
			}
		}
		
		
		near = sdWorld.GetAnythingNear( this.x, this.y, 16 );
		let connected = sdCable.GetConnectedEntities( this );
		for ( let i = 0; i < near.length; i++ )
		{
			if ( near[ i ].is( sdCom ) || near[ i ].IsPlayerClass() || sdCable.attacheable_entities.indexOf( near[ i ].GetClass() ) === -1 || connected.indexOf( near[ i ] ) !== -1 )
			{
				near.splice( i, 1 );
				i--;
				continue;
			}
		}
		
		return near;
	}
	
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( 
				(
					sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdCom.action_range ) 
					&&
					exectuter_character.canSeeForUse( this )
				)
				||
				( command_name === 'COM_KICK' && parameters_array[ 0 ] === exectuter_character.biometry ) 
			)
		{
			if ( command_name === 'COM_SUB' )
			{
				let new_sub = parameters_array[ 0 ];

				if ( typeof new_sub === 'number' || ( typeof new_sub === 'string' && ( new_sub === '*' || typeof sdWorld.entity_classes[ new_sub ] !== 'undefined' ) ) )
				this.NotifyAboutNewSubscribers( 1, [ new_sub ] );
			}
			else
			if ( command_name === 'COM_KICK' )
			{
				let net_id_to_kick = parameters_array[ 0 ];
				this.NotifyAboutNewSubscribers( 0, [ net_id_to_kick ] );
			}
			else
			if ( command_name === 'ATTACK_THROUGH_WALLS' )
			{
				this.through_walls = ( parameters_array[ 0 ] === 1 );
				//this._update_version++;
			}
			else
			if ( command_name === 'HACKING' )
			{
				if ( !sdWorld.server_config.base_degradation )
				{
					exectuter_character.Say( sdWorld.GetAny([
						'Hacking is illegal, ez',
						'I know nothing about hacking. It is almost like this planet made me forget it was even possible to do in first place',
						'Let\'s challenge them with pong isntead'
					]));
				}
				else
				if ( this.variation >= 7 )
				if ( this.hacking_left <= 0 )
				if ( exectuter_character.build_tool_level >= 14 )
				{
					let near = this.GetHackablesNearby( exectuter_character );

					if ( near.length > 0 )
					{
						exectuter_character.Say( sdWorld.GetAny([
							'Hacking into mainframe',
							'Initiating hacks',
							'Purchasing license for illegal software',
							'This should work, obviously',
							'Mommy told me not to do this but I\'m doing it anyway!',
							'I hope noone will find out',
							'I bet this door has no anti-virus installed',
							'It will be worth it',
							'Boing-boing initiated',
							'Hacking',
							'I did not see anything against it in license agreement'
						]));

						this.hacking_left = sdCom.hacking_duration;
						this._hacker = exectuter_character;
						//this._update_version++;
						this._hacking_timer_total = 0;
						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
					else
					{
						exectuter_character.Say( sdWorld.GetAny([
							'Not much to hack here',
							'Nothing to hack',
							'I should try putting this node closer'
						]));
					}
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, sdCom.action_range ) )
			{
				if ( exectuter_character.canSeeForUse( this ) )
				{
					//this.AddContextOption( 'Get ', 'GET', [ undefined ], 'Enter caption text', ( sdWorld.client_side_censorship && this.text_censored ) ? sdWorld.CensoredText( this.text ) : this.text, 100 );

					if ( this.subscribers.indexOf( sdWorld.my_entity.biometry ) === -1 )
					this.AddContextOption( 'Subscribe myself to network', 'COM_SUB', [ sdWorld.my_entity.biometry ] );

					if ( this.subscribers.indexOf( 'sdCharacter' ) === -1 )
					this.AddContextOption( 'Subscribe all players', 'COM_SUB', [ 'sdCharacter' ] );

					if ( this.subscribers.indexOf( 'sdPlayerDrone' ) === -1 )
					this.AddContextOption( 'Subscribe all player drones', 'COM_SUB', [ 'sdPlayerDrone' ] );

					if ( this.subscribers.indexOf( 'sdCrystal' ) === -1 )
					this.AddContextOption( 'Subscribe all crystals', 'COM_SUB', [ 'sdCrystal' ] );

					if ( this.subscribers.indexOf( 'sdCube' ) === -1 )
					this.AddContextOption( 'Subscribe all Cubes', 'COM_SUB', [ 'sdCube' ] );

					if ( this.subscribers.indexOf( 'sdGuanako' ) === -1 )
					this.AddContextOption( 'Subscribe all Guanako', 'COM_SUB', [ 'sdGuanako' ] );

					if ( this.subscribers.indexOf( 'sdStorage' ) === -1 )
					this.AddContextOption( 'Subscribe all Storage crates', 'COM_SUB', [ 'sdStorage' ] );

					if ( this.subscribers.indexOf( 'sdHover' ) === -1 )
					this.AddContextOption( 'Subscribe all Hovers', 'COM_SUB', [ 'sdHover' ] );

					if ( this.subscribers.indexOf( 'sdGun' ) === -1 )
					this.AddContextOption( 'Subscribe all items', 'COM_SUB', [ 'sdGun' ] );

					if ( this.subscribers.indexOf( 'sdBullet' ) === -1 )
					this.AddContextOption( 'Subscribe projectiles', 'COM_SUB', [ 'sdBullet' ] );

					if ( this.subscribers.indexOf( 'sdBot' ) === -1 )
					this.AddContextOption( 'Subscribe bots', 'COM_SUB', [ 'sdBot' ] );

					if ( this.subscribers.indexOf( 'sdJunk' ) === -1 )
					this.AddContextOption( 'Subscribe dug out junk', 'COM_SUB', [ 'sdJunk' ] );

					if ( this.subscribers.indexOf( '*' ) === -1 )
					this.AddContextOption( 'Subscribe everything (for doors & teleports only)', 'COM_SUB', [ '*' ] );

					for ( var i = 0; i < this.subscribers.length; i++ )
					{
						let net_id_or_biometry = this.subscribers[ i ];
						
						let title;
							
						if ( typeof net_id_or_biometry === 'number' )
						{
							let postfix = '';
							
							if ( sdWorld.my_entity && net_id_or_biometry === sdWorld.my_entity.biometry )
							postfix = ' ( me )';
							else
							{
								for ( let i = 0; i < sdCharacter.characters.length; i++ )
								if ( sdCharacter.characters[ i ].biometry === net_id_or_biometry )
								{
									if ( sdCharacter.characters[ i ].hea > 0 )
									postfix = ' ( nearby )';
									else
									postfix = ' ( nearby, unconcious )';
								
									break;
								}
							}
							
							if ( sdWorld.client_side_censorship && this.subscribers_names_censored[ i ] )
							title = 'Censored Defender' + postfix;
							else
							title = this.subscribers_names[ i ] + postfix;
						}
						else
						title = sdEntity.GuessEntityName( net_id_or_biometry );
						
						this.AddContextOptionNoTranslation( T('Kick ') + title, 'COM_KICK', [ net_id_or_biometry ], true, { color:'#ffff00' } );
					}

					if ( this.through_walls )
					this.AddContextOption( 'Attack players through unprotected walls: Yes', 'ATTACK_THROUGH_WALLS', [ 0 ], true, { color:'#00ff00' } );
					else
					this.AddContextOption( 'Attack players through unprotected walls: No', 'ATTACK_THROUGH_WALLS', [ 1 ], true, { color:'#ff0000' } );

					if ( this.variation >= 7 )
					if ( this.hacking_left <= 0 )
					if ( exectuter_character.build_tool_level >= 14 )
					this.AddContextOption( 'Initiate hacking', 'HACKING', [ 1 ], true, { color:'#006600' } );
				}
			}
			else
			{
				if ( this.subscribers.indexOf( sdWorld.my_entity.biometry ) !== -1 )
				this.AddContextOption( 'Unsubscribe from network', 'COM_KICK', [ sdWorld.my_entity.biometry ] );
			}
		}
	}
}
//sdCom.init_class();

export default sdCom;
