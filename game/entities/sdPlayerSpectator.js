
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';

class sdPlayerSpectator extends sdCharacter
{
	static init_class()
	{
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get hitbox_x1() { return -1; }
	get hitbox_x2() { return 1; }
	get hitbox_y1() { return -1; }
	get hitbox_y2() { return 1; }
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( observer_character )
		{
			if ( observer_character === this )
			return true;
		
			if ( observer_character )
			if ( observer_character.IsPlayerClass() )
			if ( observer_character._god )
			return true;
		}
		
		return false;
	}
	
	Say( t, to_self=true, force_client_side=false, ignore_rate_limit=false, simulate_sound=false, translate=true )
	{
	}
	
	Damage( dmg, initiator=null, headshot=false, affects_armor=true )
	{
		if ( !sdWorld.is_server )
		return;
	
		//trace( 'Damage from ',initiator ); // Lava will damage probably
	}
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( !super.IsTargetable( by_entity, ignore_safe_areas ) )
		return false;
	
		if ( by_entity )
		if ( by_entity.IsPlayerClass() )
		if ( by_entity._god )
		return true;
		
		return false;
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 1;
		this.hea = 1;
		
		this.matter_max = 0;
		this.matter = 0;
		
		this._following = null;
		this._following_timer = 0;
		
		this._boring_net_ids = [];
		
		//globalThis.EnforceChangeLog( this, 'matter', true, true );
	}
	
	IsBGEntity() // 0 for in-game entities, 1 for background entities, 2 is for moderator areas, 3 is for cables/sensor areas, 4 for task in-world interfaces, 5 for wandering around background entities, 6 for status effects, 7 for player-defined regions, 8 for decals. 9 for player spectators Should handle collisions separately
	{ return 9; }
	
	AllowClientSideState() // Conditions to ignore sdWorld.my_entity_protected_vars
	{
		return false;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.ConnecgtedGodLogic( GSPEED );
		
		if ( sdWorld.is_server )
		{
			// Test if player disconnected - stop looking at him for minutes
			if ( this._following )
			if ( !this._following._is_being_removed )
			if ( this._following.IsPlayerClass() )
			if ( !this._following._socket || this._following.hea <= 0 )
			{
				if ( this._following_timer > 30 * 5 )
				this._following_timer = 30 * 5;
			}
			
			if ( !this._following || this._following._is_being_removed || sdWorld.inDist2D_Boolean( this.x, this.y, this._following.x, this._following.y, 300 ) )
			{
				this._following_timer -= GSPEED;
			}
			else
			{
				this._following_timer -= GSPEED * 0.1;
			}
		
			if ( this._following_timer <= 0 )
			{
				let e = null;
				
				if ( Math.random() > 0.2 )
				{
					let i = Math.floor( Math.random() * sdEntity.active_entities.length );

					if ( i < sdEntity.active_entities.length )
					e = sdEntity.active_entities[ i ];
				}
				else
				{
					let i = Math.floor( Math.random() * sdWorld.sockets.length );

					if ( i < sdWorld.sockets.length )
					if ( sdWorld.sockets[ i ].character )
					e = sdWorld.sockets[ i ].character;
				}
			
				if ( e )
				{
					if ( e.IsVisible() )
					if ( this._boring_net_ids.indexOf( e._class ) === -1 )
					if ( this._boring_net_ids.indexOf( e._net_id ) === -1 )
					{
						let di = sdWorld.Dist2D( this.x, this.y, e.x, e.y );
						if ( di < 300 - this._following_timer || Math.random() < 0.05 )
						{
							if ( this._following )
							if ( !this._following._is_being_removed )
							{
								if ( !this._following.IsPlayerClass() )
								this._boring_net_ids.push( this._following._class );

								if ( this._following.IsPlayerClass() && this._following._socket && sdWorld.Dist2D( this._following.sx, this._following.sy, 0, 0 ) > 0.2 )
								{
									// Do not mark moving connected players as boring
								}
								else
								this._boring_net_ids.push( this._following._net_id );

								if ( this._boring_net_ids.length > 40 )
								this._boring_net_ids.splice( 0, 2 );
							}

							if ( e.IsPlayerClass() && e._socket && e.hea > 0 )
							this._following_timer = 60 * 30 * ( 1 + Math.random() * 4 ); // 1-5 minutes
							else
							this._following_timer = 30 * ( 1 + Math.random() * 4 ); // 1-5 seconds

							this._following = e;

							if ( di > 800 )
							{
								this.x = e.x;
								this.y = e.y - 64;
								this.sx = 0;
								this.sy = 0;
								
								this._following_timer = Math.max( this._following_timer, 30 * 10 );
							}
						}
					}
				}
			}

			if ( this._following )
			if ( !this._following._is_being_removed )
			{
				//this.x = sdWorld.MorphWithTimeScale( this.x, this.look_x, 0.99, GSPEED );
				//this.y = sdWorld.MorphWithTimeScale( this.y, this.look_y, 0.99, GSPEED );

				//this.sx += ( this.look_x - this.x ) * GSPEED * 0.002;
				//this.sy += ( this.look_y - this.y ) * GSPEED * 0.002;
				
				let dx = ( this._following.x - this.x );
				let dy = ( this._following.y - this.y );
				
				let di = sdWorld.Dist2D( dx,dy, 0,0 );
				
				if ( di > 200 )
				{
					dx = dx / di * 200;
					dy = dy / di * 200;
				}

				this.sx += dx * GSPEED * 0.002;
				this.sy += dy * GSPEED * 0.002;
			}
		}

		this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.95, GSPEED );
		this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.95, GSPEED );
		
		this.x += this.sx * GSPEED;
		this.y += this.sy * GSPEED;
		
		if ( this.x < sdWorld.world_bounds.x1 )
		this.x = sdWorld.world_bounds.x1;
		
		if ( this.x > sdWorld.world_bounds.x2 )
		this.x = sdWorld.world_bounds.x2;
		
		if ( this.y < sdWorld.world_bounds.y1 )
		this.y = sdWorld.world_bounds.y1;
		
		if ( this.y > sdWorld.world_bounds.y2 )
		this.y = sdWorld.world_bounds.y2;
	
		if ( this._socket )
		{
			this._socket.camera.x = this.x;
			this._socket.camera.y = this.y;
		}
		if ( sdWorld.my_entity === this )
		{
			sdWorld.camera.x = this.x;
			sdWorld.camera.y = this.y;
		}
		
		if ( sdWorld.is_server && !this._socket )
		{
			//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
			this.remove();
		}
		else
		{
			this.hea = this.hmax;
		}
	}
	
	onMovementInRange( from_entity )
	{
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
	}
	
	Draw( ctx, attached )
	{
		/*ctx.fillStyle = '#ff0000';
		ctx.fillRect( -8,-8, 16, 16 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_filter = null;*/
	}
	
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdPlayerSpectator.init_class();

export default sdPlayerSpectator;
