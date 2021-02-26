
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';


import sdRenderer from '../client/sdRenderer.js';


class sdCommandCentre extends sdEntity
{
	static init_class()
	{
		sdCommandCentre.img_cc = sdWorld.CreateImageFromFile( 'command_centre' );
		
		sdCommandCentre.centres = [];
		
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
		
		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			this._update_version++;
			
			this._regen_timeout = 30 * 10;

			if ( this.hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 10000;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		this.delay = 0;
		//this._update_version++
		
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
		this._armor_protection_level = 0; // Never has protection unless full health reached
			
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
			this._armor_protection_level = 4;
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
		sdEntity.Tooltip( ctx, this.title );
		
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
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