/*

	Will be used for Hooks which can be listened to by star-defenders-notificator application (by anything else really)

	TODO: Track server is online statuses

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdWeather from './sdWeather.js';
import sdCrystal from './sdCrystal.js';
import sdCharacter from './sdCharacter.js';
import sdSound from '../sdSound.js';


class sdCamera extends sdEntity
{
	static init_class()
	{
		sdCamera.img_camera = sdWorld.CreateImageFromFile( 'camera' );
		
		let i = 0;
		// WARNING: Don't insert hook_ids in a middle - it will mess up existing hooks of players
		sdCamera.DETECT_VISIBLE_MOVEMENT = i++; // 0
		sdCamera.DETECT_VISIBLE_PLAYERS = i++; // 1
		sdCamera.DETECT_VISIBLE_UNSUBSCRIBED_PLAYERS = i++; // 2
		sdCamera.DETECT_BSU_ATTACKS = i++; // 3
		sdCamera.DETECT_BSU_DAMAGE = i++; // 4
		sdCamera.DETECT_BSU_DEACTIVATION = i++; // 5
		sdCamera.DETECT_PLAYER_CONNECTIONS = i++; // 6 Disabled
		sdCamera.DETECT_PLAYER_CONNECTIONS_3 = i++; // 7
		sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER = i++; // 8
		sdCamera.DETECT_SERVER_STARTS_AND_SHUTDOWNS = i++; // 9
		sdCamera.DETECT_PLAYER_CONNECTIONS_6 = i++; // 10
		sdCamera.DETECT_VISIBLE_CRYSTAL_MOVEMENT_IN_AMPLIFIERS = i++; // 11
		sdCamera.detect_ids_total = i;
		
		sdCamera.default_triggered_messages = [];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_VISIBLE_MOVEMENT ] = [ 'No movement', 'Something moves', 'idle' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_VISIBLE_PLAYERS ] = [ 'No players seen', 'Player is seen', 'idle' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_VISIBLE_UNSUBSCRIBED_PLAYERS ] = [ 'No unsubscribed players seen', 'Unsubscribed player is seen', 'idle' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_BSU_ATTACKS ] = [ 'BSU is not attacked by other BSUs', 'BSU is attacked by other BSU', 'bsu' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_BSU_DAMAGE ] = [ 'BSU is not taking damage', 'BSU is taking damage', 'bsu' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_BSU_DEACTIVATION ] = [ 'BSU is active', 'BSU is deactivated', 'bsu' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_PLAYER_CONNECTIONS ] = [ 'Server has no players', 'Player enters the world', 'idle' ]; // Disabled
		sdCamera.default_triggered_messages[ sdCamera.DETECT_PLAYER_CONNECTIONS_3 ] = [ 'Server has less than 3 players', '3+ players entered the world', 'idle' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER ] = [ 'No low matter high tier crystals', 'Seeing low matter high tier crystals', 'crystal' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_SERVER_STARTS_AND_SHUTDOWNS ] = [ 'Server is running same instance', 'Server has been restarted', 'com16' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_PLAYER_CONNECTIONS_6 ] = [ 'Server has less than 6 players', '6+ players entered the world', 'idle' ];
		sdCamera.default_triggered_messages[ sdCamera.DETECT_VISIBLE_CRYSTAL_MOVEMENT_IN_AMPLIFIERS ] = [ 'Crystals are untoched', 'Visible crystal count changes', 'crystal' ];
		
		sdCamera.cameras = []; // For global detections
		
		sdCamera.hook_expire_time = 60 * 60 * 24;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 4; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Security camera';
	}
	
	//IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	//{ return true; }
	
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
			{
				sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.25, pitch: 1.3 });
				this.remove();
			}
			
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 100;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._next_scan_in = 0;
		
		//this.logs = [];
		
		this._password = Math.floor( Math.random() * 9007199254740991 ) + '-' + Math.floor( Math.random() * 9007199254740991 ) + '-' + Math.floor( Math.random() * 9007199254740991 ) + '-' + Math.floor( Math.random() * 9007199254740991 ) + '-' + Math.floor( Math.random() * 9007199254740991 );
		this._hook_trigger_counters = {}; // Key is detect_id, value is how many times it was triggered
		this._hook_trigger_messages = {}; // Key is detect_id, value is last trigger message
		this._hook_last_calls = {};
		
		this._angular_cache = []; // For movement detection
		this._angular_cache_crystals_only = []; // For movement detection
		
		this._last_hook_call = sdWorld.time; // For hibernation
		
		sdCamera.cameras.push( this );
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_hook_trigger_counters' ) return true;
		if ( prop === '_hook_trigger_messages' ) return true;
		if ( prop === '_hook_last_calls' ) return true;
		if ( prop === '_password' ) return true;
		
		return false;
	}
	
	Trigger( hook_id, message='' )
	{
		if ( this._is_being_removed )
		return;
		
		if ( !this._hook_trigger_counters[ hook_id ] )
		this._hook_trigger_counters[ hook_id ] = 1;
		else
		this._hook_trigger_counters[ hook_id ]++;
	
		this._hook_trigger_messages[ hook_id ] = message;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			let com_near = null;
			let com_near_scanned_for = false;
			
			if ( sdWorld.time > this._next_scan_in )
			{
				this._next_scan_in = sdWorld.time + 200 + Math.random() * 100;
				
				this._hook_trigger_counters[ sdCamera.DETECT_SERVER_STARTS_AND_SHUTDOWNS ] = sdWorld.startup_hash;
		
				if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_MOVEMENT ] + sdCamera.hook_expire_time ||
					 sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_PLAYERS ] + sdCamera.hook_expire_time ||
					 sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_UNSUBSCRIBED_PLAYERS ] + sdCamera.hook_expire_time ||
					 sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER ] + sdCamera.hook_expire_time ||
					 sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_CRYSTAL_MOVEMENT_IN_AMPLIFIERS ] + sdCamera.hook_expire_time 
					 )
				{
					let x0 = this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2;
					let y0 = this.y + ( this._hitbox_y1 + this._hitbox_y2 ) / 2;

					for ( let i = 0; i < 64; i++ )
					{
						let old_ent = null;
						
						if ( this._angular_cache[ i ] && this._angular_cache[ i ]._is_being_removed )
						this._angular_cache[ i ] = null;

						//if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_MOVEMENT ] + sdCamera.hook_expire_time )
						old_ent = this._angular_cache[ i ];


						let an = i / 64 * Math.PI * 2;

						let xx = x0 + Math.sin( an ) * 800;
						let yy = y0 + Math.cos( an ) * 800;

						sdWorld.last_hit_entity = null;
						//sdWorld.TraceRayPoint( x0, y0, xx, yy, null, null, null, sdWorld.FilterOnlyVisionBlocking );
						sdWorld.TraceRayPoint( x0, y0, xx, yy, this, [ 'sdMatterAmplifier' ] ); // Otherwise it won't see crystals
						let new_ent = sdWorld.last_hit_entity;
						
						let new_ent_crystals_only = null;
						if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_CRYSTAL_MOVEMENT_IN_AMPLIFIERS ] + sdCamera.hook_expire_time ||
							 sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER ] + sdCamera.hook_expire_time )
						{
							if ( this._angular_cache_crystals_only[ i ] && this._angular_cache_crystals_only[ i ]._is_being_removed )
							this._angular_cache_crystals_only[ i ] = null;
							
							let old_ent_crystals_only = this._angular_cache_crystals_only[ i ];
							sdWorld.last_hit_entity = null;
							sdWorld.TraceRayPoint( x0, y0, xx, yy, this, null, [ 'sdBlock', 'sdDoor', 'sdCrystal' ] ); // Otherwise it won't see crystals
							new_ent_crystals_only = sdWorld.last_hit_entity;
							
							
							if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER ] + sdCamera.hook_expire_time )
							if ( new_ent_crystals_only )
							if ( new_ent_crystals_only.is( sdCrystal ) )
							if ( !new_ent_crystals_only.is_anticrystal )
							if ( new_ent_crystals_only.matter_max >= 5120 )
							if ( !new_ent_crystals_only.is_anticrystal )
							//if ( new_ent_crystals_only.matter < new_ent_crystals_only.matter_max - 5120 * 0.666 && new_ent_crystals_only.matter < new_ent_crystals_only.matter_max * 0.8 )
							if ( new_ent_crystals_only.matter < new_ent_crystals_only.matter_max * 0.5 )
							{
								this.Trigger( sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER, 'Seeing crystal with low matter ( '+(~~new_ent_crystals_only.matter)+' / '+new_ent_crystals_only.matter_max+' )' );
							}
							
							// ------ Past this point new_ent_crystals_only no longer points to non-held crystals ------ 
							
							if ( new_ent_crystals_only )
							if ( new_ent_crystals_only.is( sdCrystal ) )
							if ( !new_ent_crystals_only.held_by )
							new_ent_crystals_only = null;
							
							if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_CRYSTAL_MOVEMENT_IN_AMPLIFIERS ] + sdCamera.hook_expire_time )
							if ( new_ent_crystals_only !== old_ent_crystals_only && old_ent_crystals_only !== undefined && old_ent_crystals_only !== null )
							{
								let t = null;
								
								if ( new_ent_crystals_only && new_ent_crystals_only.is( sdCrystal ) )
								{
									t = 'Crystal ( ' +new_ent_crystals_only.matter_max+ ' ) is being';
									
									if ( new_ent_crystals_only.held_by )
									t += ' put into amplifier';
									else
									t += ' taken out of amplifier';
									
									for ( let i = 0; i < sdCharacter.characters.length; i++ )
									{
										let c = sdCharacter.characters[ i ];
										if ( c.hook_relative_to === new_ent_crystals_only ||
											 c.grabbed === new_ent_crystals_only // Drones
										)
										{
											t += ' by ' + sdWorld.ClassNameToProperName( c.GetClass(), c );
											break;
										}
									}
								}
								else
								if ( old_ent_crystals_only && old_ent_crystals_only.is( sdCrystal ) )
								{
									t = 'Crystal ( ' +old_ent_crystals_only.matter_max+ ' ) is being';
									
									if ( old_ent_crystals_only.held_by )
									t += ' put into amplifier';
									else
									t += ' taken out of amplifier';
									
									for ( let i = 0; i < sdCharacter.characters.length; i++ )
									{
										let c = sdCharacter.characters[ i ];
										if ( c.hook_relative_to === old_ent_crystals_only ||
											 c.grabbed === old_ent_crystals_only // Drones
										)
										{
											t += ' by ' + sdWorld.ClassNameToProperName( c.GetClass(), c );
											break;
										}
									}
								}
								
								if ( t )
								{
									this.Trigger( sdCamera.DETECT_VISIBLE_CRYSTAL_MOVEMENT_IN_AMPLIFIERS, t );
								}
							}
							
							
							this._angular_cache_crystals_only[ i ] = new_ent_crystals_only;
						}

						if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_MOVEMENT ] + sdCamera.hook_expire_time )
						if ( new_ent !== old_ent && old_ent !== undefined && old_ent !== null )
						{
							let t = '?';
							
							if ( new_ent && old_ent )
							{
								if ( old_ent.is_static )
								t = sdWorld.ClassNameToProperName( old_ent.GetClass(), new_ent );
								else
								t = sdWorld.ClassNameToProperName( old_ent.GetClass(), old_ent );
							}
							else
							{
								if ( new_ent )
								t = sdWorld.ClassNameToProperName( new_ent.GetClass(), new_ent );
								else
								if ( old_ent )
								t = sdWorld.ClassNameToProperName( old_ent.GetClass(), old_ent );
							}

							this.Trigger( sdCamera.DETECT_VISIBLE_MOVEMENT, 'Near ' + t );
						}

						if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_PLAYERS ] + sdCamera.hook_expire_time )
						{
							if ( new_ent )
							if ( new_ent.IsPlayerClass() )
							{
								let t = sdWorld.ClassNameToProperName( new_ent.GetClass(), new_ent );

								this.Trigger( sdCamera.DETECT_VISIBLE_PLAYERS, t );
							}
						}

						if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_UNSUBSCRIBED_PLAYERS ] + sdCamera.hook_expire_time )
						{
							if ( new_ent )
							if ( new_ent.IsPlayerClass() )
							{
								if ( !com_near_scanned_for )
								{
									com_near = this.GetComWiredCache();
									com_near_scanned_for = true;
								}

								if ( com_near )
								if (
										com_near.subscribers.indexOf( new_ent._net_id ) === -1 &&
										com_near.subscribers.indexOf( new_ent.biometry ) === -1 &&
										com_near.subscribers.indexOf( new_ent.GetClass() ) === -1 
								)
								{
									let t = sdWorld.ClassNameToProperName( new_ent.GetClass(), new_ent );

									this.Trigger( sdCamera.DETECT_VISIBLE_UNSUBSCRIBED_PLAYERS, t );
								}
							}
						}
						/*
						if ( sdWorld.time < this._hook_last_calls[ sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER ] + sdCamera.hook_expire_time )
						{
							if ( new_ent )
							if ( new_ent.is( sdCrystal ) )
							{
								if ( !new_ent.is_anticrystal )
								if ( new_ent.matter_max >= 5120 )
								if ( !new_ent.is_anticrystal )
								if ( new_ent.matter < new_ent.matter_max - 5120 * 0.666 && new_ent.matter < new_ent.matter_max * 0.8 )
								{
									this.Trigger( sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER, 'Seeing crystal with low matter ( '+(~~new_ent.matter)+' / '+new_ent.matter_max+' )' );
								}
							}
						}*/
						

						this._angular_cache[ i ] = new_ent;
					}
				}
			}

			
			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED;
			else
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
			else
			if ( this._last_hook_call < sdWorld.time - sdCamera.hook_expire_time ) // 24 hours
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		let i = sdCamera.cameras.indexOf( this );
		if ( i !== -1 )
		sdCamera.cameras.splice( i, 1 );
	}
	Draw( ctx, attached )
	{
		if ( sdWorld.time % 2000 < 1000 )
		ctx.drawImageFilterCache( sdCamera.img_camera, 32, 0, 32, 32, - 16, - 16, 32, 32 );
		else
		ctx.drawImageFilterCache( sdCamera.img_camera, 0, 0, 32, 32, - 16, - 16, 32, 32 );
	}
	MeasureMatterCost()
	{
		return 400;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( parameters_array instanceof Array )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 46 ) )
			{
				if ( command_name === 'GET_HOOK_URL' )
				{
					let json_obj = {
						hook_id: parameters_array[ 0 ],
						password: this._password
						// Notificator will also add property .first_sync on addition and URL change just so alarm_messages could be synced
					};
					
					let hook_url = '{GAME_URL}sd_hook?' + this._net_id + JSON.stringify( json_obj );
					executer_socket.SDSetClipboard( hook_url );
				}
			}
			else
			executer_socket.SDServiceMessage( 'Security camera is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 46 ) )
		{
			//this.AddContextOption( 'Detect players connecting to world', 'GET_HOOK_URL', [ sdCamera.DETECT_PLAYER_CONNECTIONS ] );
			this.AddContextOption( 'Detect 3+ players connecting to world', 'GET_HOOK_URL', [ sdCamera.DETECT_PLAYER_CONNECTIONS_3 ] );
			this.AddContextOption( 'Detect 6+ players connecting to world', 'GET_HOOK_URL', [ sdCamera.DETECT_PLAYER_CONNECTIONS_6 ] );
			
			this.AddContextOption( 'Detect server starts/shutdowns', 'GET_HOOK_URL', [ sdCamera.DETECT_SERVER_STARTS_AND_SHUTDOWNS ] );
			
			this.AddContextOption( 'Detect directly visible movement', 'GET_HOOK_URL', [ sdCamera.DETECT_VISIBLE_MOVEMENT ] );
			this.AddContextOption( 'Detect directly visible players', 'GET_HOOK_URL', [ sdCamera.DETECT_VISIBLE_PLAYERS ] );
			this.AddContextOption( 'Detect directly visible unsubscribed players', 'GET_HOOK_URL', [ sdCamera.DETECT_VISIBLE_UNSUBSCRIBED_PLAYERS ] );
			
			this.AddContextOption( 'Detect directly visible low matter crystals', 'GET_HOOK_URL', [ sdCamera.DETECT_VISIBLE_HIGH_TIER_CRYSTALS_WITH_LOW_MATTER ] );
			this.AddContextOption( 'Detect directly visible crystal movement in amplifiers', 'GET_HOOK_URL', [ sdCamera.DETECT_VISIBLE_CRYSTAL_MOVEMENT_IN_AMPLIFIERS ] );
			
			this.AddContextOption( 'Detect connected Base Shielding Unit attacks', 'GET_HOOK_URL', [ sdCamera.DETECT_BSU_ATTACKS ] );
			this.AddContextOption( 'Detect connected Base Shielding Unit damage', 'GET_HOOK_URL', [ sdCamera.DETECT_BSU_DAMAGE ] );
			this.AddContextOption( 'Detect connected Base Shielding Unit deactivation', 'GET_HOOK_URL', [ sdCamera.DETECT_BSU_DEACTIVATION ] );
		}
	}
	//HandleHookReply( hook_id, password )
	HandleHookReply( json_obj )
	{
		let hook_id = parseInt( json_obj.hook_id );
		let password = json_obj.password;
		
		if ( password === this._password )
		if ( !isNaN( hook_id ) )
		if ( hook_id >= 0 )
		if ( hook_id < sdCamera.detect_ids_total )
		{
			this._hook_last_calls[ hook_id ] = sdWorld.time;
			this._last_hook_call = sdWorld.time;
			
			let ret = {
				counter: this._hook_trigger_counters[ hook_id ] || 0
			};
			
			if ( this._hook_trigger_messages[ hook_id ] )
			ret.message = this._hook_trigger_messages[ hook_id ] || 0;
			
			if ( json_obj.first_sync === 1 )
			{
				ret.alarm_messages = sdCamera.default_triggered_messages[ hook_id ] || '';
				
				if ( hook_id === sdCamera.DETECT_SERVER_STARTS_AND_SHUTDOWNS )
				{
					ret.alarm_on_connection_errors = 1;
				}
			}
		
			ret.update_delay = sdWorld.GetPlayingPlayersCount() === 0 ? 15000 : 3000;
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
			return ret;
		}
		
		return null;
	}
}
//sdCamera.init_class();

export default sdCamera;