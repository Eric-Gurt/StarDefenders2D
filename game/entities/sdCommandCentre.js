
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
				if ( sdWorld.sockets[ i ].command_centre === this )
				sdWorld.sockets[ i ].emit( 'SERVICE_MESSAGE', 'Your respawn point Command Centre has been destroyed!' );

				this.remove();
			}
			else
			{
				if ( this._regen_timeout <= 0 )
				{
					for ( var i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].command_centre === this )
					sdWorld.sockets[ i ].emit( 'SERVICE_MESSAGE', 'Your respawn point Command Centre is under attack!' );
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
		
		this.self_destruct_on = sdWorld.time + sdCommandCentre.time_to_live_without_matter_keepers_near; // Exists for 24 hours by default
		
		sdCommandCentre.centres.push( this );
	}
	onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
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
			sdWorld.sockets[ i ].emit( 'SERVICE_MESSAGE', 'Some Command Centre has expired' );
		
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
		ctx.drawImage( sdCommandCentre.img_cc, -16, -16 - 32, 32,64 );
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
		let i = sdCommandCentre.centres.indexOf( this );
		if ( i !== -1 )
		sdCommandCentre.centres.splice( i, 1 );
		
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
}
//sdCommandCentre.init_class();

export default sdCommandCentre;