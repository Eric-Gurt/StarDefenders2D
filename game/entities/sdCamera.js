/*

	Records stuff to the log which can later be read in some way

	Does not do anything currently. Perhaps could save events such as appearance/disappearance/storage access/hooking? Or could act as proper player that records lots of data, but that would require good optimized servers.

	Alternatively could just report stuff to players via e-mail or I don't know really. Anybody wants to make Viber/Discord/WhatsUp integration?

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdWeather from './sdWeather.js';
import sdSound from '../sdSound.js';


class sdCamera extends sdEntity
{
	static init_class()
	{
		sdCamera.img_camera = sdWorld.CreateImageFromFile( 'camera' );
		
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
		
		this._hmax = 300; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this.logs = [];
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
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
			/*else
			if ( this._matter < 0.05 || this._matter >= this._matter_max )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );*/
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
}
//sdCamera.init_class();

export default sdCamera;