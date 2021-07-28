
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';


import sdRenderer from '../client/sdRenderer.js';


class sdCommandCentre extends sdEntity
{
	static init_class()
	{
		sdCommandCentre.img_cc = sdWorld.CreateImageFromFile( 'command_centre' );
		
		sdCommandCentre.centres = [];
		
		sdCommandCentre.time_to_live_without_matter_keepers_near = 1000 * 60 * 60 * 24; // 24 h
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -10; }
	get hitbox_x2() { return 15; }
	get hitbox_y1() { return -26; }
	get hitbox_y2() { return 16; }
	
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
			this.hea -= dmg;
			
			this._update_version++;

			if ( this.hea <= 0 )
			{
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				//if ( sdWorld.sockets[ i ].command_centre === this )
				if ( sdWorld.sockets[ i ].character === this )
				if ( sdWorld.sockets[ i ].character.cc_id === this._net_id )
				sdWorld.sockets[ i ].SDServiceMessage( 'Your Command Centre has been destroyed!' );

				this.remove();
			}
			else
			{
				if ( this._regen_timeout <= 0 )
				{
					for ( var i = 0; i < sdWorld.sockets.length; i++ )
					//if ( sdWorld.sockets[ i ].command_centre === this )
					if ( sdWorld.sockets[ i ].character === this )
					if ( sdWorld.sockets[ i ].character.cc_id === this._net_id )
					sdWorld.sockets[ i ].SDServiceMessage( 'Your Command Centre is under attack!' );
				}
				this._regen_timeout = 30 * 10;
			}
		}
	}
	// Moved to index.js
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.self_destruct_on < sdCommandCentre.time_to_live_without_matter_keepers_near - 60 ) // Update once per minute
		if ( character.matter > sdCharacter.matter_required_to_destroy_command_center )
		{
			this.self_destruct_on = sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near;
		}
	}*/
	constructor( params )
	{
		super( params );
		
		this.hmax = 10000;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		this.delay = 0;
		//this._update_version++
		
		this.owner = params.owner || null;
		
		this.self_destruct_on = sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near; // Exists for 24 hours by default
		
		this.pending_team_joins = []; // array of net_ids, similar to how coms work. Owner is able to reject and accept these
		
		this._armor_protection_level = 0;
		
		sdCommandCentre.centres.push( this );
	}
	onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.owner )
		{
			this.owner.cc_id = this._net_id;
			this.owner._cc_rank = 0;
		}
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return 1500;
		//return this.hmax * sdWorld.damage_to_matter + 50;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		//this._armor_protection_level = 0; // Never has protection unless full health reached
			
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			{
				this.hea = Math.min( this.hea + GSPEED, this.hmax );
				
				//if ( sdWorld.is_server )
				//this.hea = this.hmax; // Hack
				
				this._update_version++;
			}
			else
			this._armor_protection_level = 4; // Once reached max HP - it can be only destroyed with big explosions
		}
		
		if ( sdWorld.time > this.self_destruct_on )
		{
			for ( var i = 0; i < sdWorld.sockets.length; i++ )
			sdWorld.sockets[ i ].SDServiceMessage( 'Some Command Centre has expired' );
		
			//throw new Error('this.self_destruct_on = '+sdWorld.time+'::'+this.self_destruct_on+'::'+sdCommandCentre.time_to_live_without_matter_keepers_near);
			this.remove();
		}
	}
	get title()
	{
		return 'Command Centre';
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdCommandCentre.img_cc, -16, -16 - 32, 32,64 );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title, 0, -10 );
		
		if ( this.self_destruct_on > sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near - 10 * 1000 )
		sdEntity.Tooltip( ctx, 'No expiration', 0, -3, '#66ff66' );
		else
		sdEntity.Tooltip( ctx, Math.ceil( ( this.self_destruct_on - sdWorld.time ) / ( 1000 * 60 * 60 ) ) + ' hours left', 0, -3, '#ffff66' );
		
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 26, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 26, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		var i = sdCommandCentre.centres.indexOf( this );
		if ( i !== -1 )
		sdCommandCentre.centres.splice( i, 1 );
	
		for ( var i = 0; i < sdCharacter.characters.length; i++ )
		if ( sdCharacter.characters[ i ].cc_id === this._net_id )
		this.KickNetID( sdCharacter.characters[ i ]._net_id, true );
		
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'block4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdCommandCentre.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,y,a,s;
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			for ( y = step_size / 2 - 32; y < 32; y += step_size )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}
		}
	}
	
	
	KickNetID( net_id, allow_owner_kick=false )
	{
		//if ( this.owner || allow_owner_kick )
		{
			if ( allow_owner_kick || !this.owner || net_id !== this.owner._net_id )
			{
				let ent = sdEntity.entities_by_net_id_cache_map.get( net_id );
				
				if ( ent )
				if ( ent.cc_id === this._net_id )
				{
					ent.cc_id = 0;
					
					if ( this.owner === ent )
					{
						this.owner = null;
						this._update_version++;
					}

					if ( ent._socket )
					{
						if ( this.owner )
						{
							if ( this._is_being_removed )
							ent._socket.SDServiceMessage( 'You have been excluded from ' + this.owner.title + '\'s team (Command Centre has been destroyed)' );
							else
							ent._socket.SDServiceMessage( 'You have been excluded from ' + this.owner.title + '\'s team' );
						}
						else
						ent._socket.SDServiceMessage( 'You have been excluded from team (team has no owner)' );
					}
				}
			}
			//else
			//debugger;
		}
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( this.owner === exectuter_character )
			{
				const AcceptNetID = ( net_id )=>
				{
					let ent = sdEntity.entities_by_net_id_cache_map.get( net_id );
					
					if ( ent )
					{
						ent.cc_id = this._net_id;
						ent._cc_rank = 1;

						if ( ent._socket )
						ent._socket.SDServiceMessage( 'You have been accepted to ' + exectuter_character.title + '\'s team!' );
					}
				};
				const RejectNetID = ( net_id )=>
				{
					let ent = sdEntity.entities_by_net_id_cache_map.get( net_id );
					
					if ( ent )
					{
						//ent.cc_id = this._net_id;

						if ( ent._socket )
						ent._socket.SDServiceMessage( 'You have been rejected from joining ' + exectuter_character.title + '\'s team' );
					}
				};
				
				if ( command_name === 'ACCEPT_ALL' )
				{
					for ( var i = 0; i < this.pending_team_joins.length; i++ )
					AcceptNetID( this.pending_team_joins[ i ] );
					this.pending_team_joins.length = 0;
					
					executer_socket.SDServiceMessage( 'All requests were accepted' );
					
					this._update_version++;
				}
				else
				if ( command_name === 'REJECT_ALL' )
				{
					for ( var i = 0; i < this.pending_team_joins.length; i++ )
					RejectNetID( this.pending_team_joins[ i ] );
					this.pending_team_joins.length = 0;
					
					executer_socket.SDServiceMessage( 'All requests were rejected' );
					
					this._update_version++;
				}
				else
				if ( command_name === 'KICK_ALL' )
				{
					for ( var i = 0; i < sdCharacter.characters.length; i++ )
					if ( sdCharacter.characters[ i ].cc_id === this._net_id )
					this.KickNetID( sdCharacter.characters[ i ]._net_id, false );
			
					executer_socket.SDServiceMessage( 'Everyone was kicked' );
					
					this._update_version++;
				}
				else
				if ( command_name === 'ACCEPT' )
				{
					var id = this.pending_team_joins.indexOf( parameters_array[ 0 ] );
					if ( id !== -1 )
					{
						if ( !sdEntity.entities_by_net_id_cache_map.has( parameters_array[ 0 ] ) )
						{
							executer_socket.SDServiceMessage( 'Looks like player no longer exists' );
						}
						else
						{
							AcceptNetID( parameters_array[ 0 ] );
							executer_socket.SDServiceMessage( sdEntity.entities_by_net_id_cache_map.get( parameters_array[ 0 ] ).title + ' has been accepted' );
						}
						
						this.pending_team_joins.splice( id, 1 );
							
						this._update_version++;
					}
					else
					executer_socket.SDServiceMessage( 'Could not find user in list' );
				}
				else
				if ( command_name === 'REJECT' )
				{
					var id = this.pending_team_joins.indexOf( parameters_array[ 0 ] );
					if ( id !== -1 )
					{
						if ( !sdEntity.entities_by_net_id_cache_map.has( parameters_array[ 0 ] ) )
						{
							executer_socket.SDServiceMessage( 'Looks like player no longer exists' );
						}
						else
						{
							RejectNetID( parameters_array[ 0 ] );
							executer_socket.SDServiceMessage( sdEntity.entities_by_net_id_cache_map.get( parameters_array[ 0 ] ).title + ' has been rejected' );
						}
						this.pending_team_joins.splice( id, 1 );
					
						this._update_version++;
					}
					else
					executer_socket.SDServiceMessage( 'Could not find user in list' );
				}
				else
				executer_socket.SDServiceMessage( 'Command is not allowed' );
			}
			else
			{
				if ( command_name === 'REQUEST' )
				{
					if ( !this.owner || this.owner._is_being_removed )
					{
						executer_socket.SDServiceMessage( 'This Command Centre no longer has owner - there is nobody to review team join requests' );
					}
					else
					{
						if ( this.pending_team_joins.length > 8 )
						{
							executer_socket.SDServiceMessage( 'Too many team join requests - wait until Command Centre owner reviews them' );
						}
						else
						if ( this.pending_team_joins.indexOf( exectuter_character._net_id ) !== -1 )
						{
							executer_socket.SDServiceMessage( 'Team join request already sent' );
						}
						else
						{
							this.pending_team_joins.push( exectuter_character._net_id );
							executer_socket.SDServiceMessage( 'Team join request sent' );
					
							this._update_version++;
						}
					}
				}
				else
				executer_socket.SDServiceMessage( 'Command is not allowed' );
			}
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
			if ( this.owner === exectuter_character )
			{
				this.AddContextOption( 'Accept everyone', 'ACCEPT_ALL', [ ] );
				this.AddContextOption( 'Reject everyone', 'REJECT_ALL', [ ] );
				this.AddContextOption( 'Kick everyone from team', 'KICK_ALL', [ ] );
					
				for ( var i = 0; i < this.pending_team_joins.length; i++ )
				{
					this.AddContextOption( 'Accept ' + sdEntity.GuessEntityName( this.pending_team_joins[ i ] ), 'ACCEPT', [ this.pending_team_joins[ i ] ] );
					this.AddContextOption( 'Reject ' + sdEntity.GuessEntityName( this.pending_team_joins[ i ] ), 'REJECT', [ this.pending_team_joins[ i ] ] );
				}
			}
			else
			{
				this.AddContextOption( 'Request team join', 'REQUEST', [] );
			}
		}
	}
}
//sdCommandCentre.init_class();

export default sdCommandCentre;