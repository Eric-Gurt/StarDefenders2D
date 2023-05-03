/*

	For sky bases

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdWeather from './sdWeather.js';
import sdCom from './sdCom.js';
import sdSound from '../sdSound.js';


class sdThruster extends sdEntity
{
	static init_class()
	{
		sdThruster.img_thruster = sdWorld.CreateImageFromFile( 'thruster' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -8; }
	get hitbox_y2() { return 8; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Skybase thruster';
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
				this.remove();
			}
			
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 1000 * 4; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this.enabled = false;
		
		this.filter = params.filter || 'none';
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		if ( this.enabled )
		{
			let nears = this.GetAnythingNearCache( this.x, this.y + this._hitbox_y2 + 16, 16 );
			
			for ( let i = 0; i < nears.length; i++ )
			if ( nears[ i ] !== this )
			if ( nears[ i ].IsBGEntity() === 0 )
			if ( !nears[ i ].is( sdBlock ) )
			if ( !nears[ i ].is( sdDoor ) )
			if ( nears[ i ].IsTargetable( this ) )
			//if ( sdWorld.CheckLineOfSight( this.x, this.y + this._hitbox_y2, nears[ i ].x, nears[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) ) // Otherwise it burns entities through walls
			if ( sdWorld.CheckLineOfSight( this.x, this.y + this._hitbox_y2, nears[ i ].x + ( nears[ i ]._hitbox_x1 + nears[ i ]._hitbox_x2 ) / 2, nears[ i ].y + ( nears[ i ]._hitbox_y1 + nears[ i ]._hitbox_y2 ) / 2, nears[ i ], null, sdCom.com_vision_blocking_classes ) ) // Otherwise it burns entities through walls
			{
				nears[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t:100 * GSPEED }); // Set target on fire
			}
		}
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		if ( !this.enabled )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 6 );
	}
	Draw( ctx, attached )
	{
		if ( this.enabled )
		ctx.apply_shading = false;
		
		ctx.filter = this.filter;
		
		let xx = ( this.enabled || sdShop.isDrawing ) ? 32 : 0;
		ctx.drawImageFilterCache( sdThruster.img_thruster, xx, 0, 32, 64, - 16, - 16, 32, 64 );
		
		ctx.filter = 'none';
	}
	MeasureMatterCost()
	{
		return 1000;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}
//sdThruster.init_class();

export default sdThruster;