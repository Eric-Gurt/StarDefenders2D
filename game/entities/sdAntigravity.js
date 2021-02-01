
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';

import sdRenderer from '../client/sdRenderer.js';


class sdAntigravity extends sdEntity
{
	static init_class()
	{
		sdAntigravity.img_antigravity = sdWorld.CreateImageFromFile( 'antigravity' );
		
		let that = this; setTimeout( ()=>{ sdWorld.entity_classes[ that.name ] = that; }, 1 ); // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		
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
		
		this._hmax = 200;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		//this._update_version++
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter + 50;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
		}
		
		var x = this.x;
		var y = this.y;
		for ( var xx = -2; xx <= 2; xx++ )
		for ( var yy = -12; yy <= 2; yy++ )
		{
			var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
			for ( var i = 0; i < arr.length; i++ )
			if ( arr[ i ] !== this )
			if ( Math.abs( arr[ i ].x - this.x ) < 16 )
			if ( arr[ i ].y < this.y )
			if ( !arr[ i ].is_static )
			if ( sdWorld.CheckLineOfSight( this.x, this.y, arr[ i ].x, arr[ i ].y, this, null, [ 'sdBlock' ] ) )
			{
				//if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 30 ) >= 0 )
				{
					arr[ i ].sy -= GSPEED * sdWorld.gravity * 0.9;
					
					if ( arr[ i ].GetClass() === 'sdCharacter' )
					{
						if ( arr[ i ].hea > 0 )
						arr[ i ].sy += GSPEED * arr[ i ].act_y * 0.1;
					}
				}
			}
		}
	}
	get title()
	{
		return 'Antigravity field';
	}
	Draw( ctx, attached )
	{
		ctx.drawImage( sdAntigravity.img_antigravity, -16, -16, 32,32 );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove() // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'block4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdAntigravity.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,a,s;
			
			let y = 0;
			
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			//for ( y = step_size / 2; y < 32; y += step_size )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}
		}
	}
}
//sdAntigravity.init_class();

export default sdAntigravity;