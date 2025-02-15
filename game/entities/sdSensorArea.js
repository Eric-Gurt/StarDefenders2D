/*

	Doors optimization + allowance for smaller doors that aren't radius-based

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';

import sdRenderer from '../client/sdRenderer.js';


class sdSensorArea extends sdEntity
{
	static init_class()
	{
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.w; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.h; }
	
	IsHittableWithAdminTools() // Admin tool for removal
	{ return false; }
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	IsVisible( observer_entity )
	{
		if ( observer_entity )
		if ( observer_entity.IsPlayerClass() )
		if ( observer_entity._god )
		if ( observer_entity._debug )
		return true;
		
		return false;
	}
	
	constructor( params )
	{
		super( params );
		
		this.w = params.w || 32;
		
		this.h = params.h || 32;
		
		this.on_movement_target = params.on_movement_target;
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
	}
	MeasureMatterCost()
	{
		return Infinity;
	}
	
	onMovementInRange( from_entity )
	{
		//trace( from_entity );
		if ( this.on_movement_target )
		{
			if ( !this.on_movement_target._is_being_removed )
			{
				this.on_movement_target.SensorAreaMovementCallback( from_entity );
				return;
			}
		}
		
		this.remove();
	}
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 3; }
	//RequireSpawnAlign() 
	//{ return true; }
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	Draw( ctx, attached )
	{
		if ( sdWorld.time % 1000 < 500 )
		{
			ctx.globalAlpha = 0.05;
		}
		else
		{
			ctx.globalAlpha = 0.01;
		}
		
		ctx.fillStyle = '#00ff00';
		
		ctx.fillRect( 0, 0, this._hitbox_x2, this._hitbox_y2 );
		
		ctx.globalAlpha = 1;
	}
	DrawFG( ctx, attached )
	{
		this.Draw( ctx, attached );
	}
}
//sdSensorArea.init_class();

export default sdSensorArea;