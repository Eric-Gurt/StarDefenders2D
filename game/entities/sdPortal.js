
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCrystal from './sdCrystal.js';

import sdRenderer from '../client/sdRenderer.js';


class sdPortal extends sdEntity
{
	static init_class()
	{
		sdPortal.img_portal = sdWorld.CreateImageFromFile( 'portalgun_portal' );
		
		sdPortal.portals = [];
		
		sdPortal.hitbox_sizes_by_orientation = [
			[ -8, 8, -3, 3 ],
			[ -3, 3, -16, 16 ]
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get hitbox_x1() { return sdPortal.hitbox_sizes_by_orientation[ this.orientation || 0 ][ 0 ]; }
	get hitbox_x2() { return sdPortal.hitbox_sizes_by_orientation[ this.orientation || 0 ][ 1 ]; }
	get hitbox_y1() { return sdPortal.hitbox_sizes_by_orientation[ this.orientation || 0 ][ 2 ]; }
	get hitbox_y2() { return sdPortal.hitbox_sizes_by_orientation[ this.orientation || 0 ][ 3 ]; }
	
	IsTargetable( by_entity ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( by_entity && by_entity.is( sdBullet ) && by_entity._admin_picker )
		return true;

		return false;
	}
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_BOX; }
	
	/*get hard_collision()
	{ return false; }*/
	
	/*get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }*/
	
	constructor( params )
	{
		super( params );
		
		this.attachment = params.attachment || null;
		this.attachment_x = 0;
		this.attachment_y = 0;
		
		if ( params.attachment_x !== undefined )
		this.attachment_x = params.attachment_x;
		
		if ( params.attachment_y !== undefined )
		this.attachment_y = params.attachment_y;
	
		this._owner = params.owner || null;
		
		this._ttl = 30 * 60 * 5;
		
		this._teleport_delay = 0;
		
		this.orientation = params.orientation || 0;
		
		this._output = params.output || null;
		
		this.UpdatePosition();
		
		sdPortal.portals.push( this );
		
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
	}
	UpdatePosition()
	{
		if ( this.attachment )
		{
			this.x = this.attachment.x + this.attachment_x;
			this.y = this.attachment.y + this.attachment_y;
		}
	}
	MeasureMatterCost()
	{
		return 0;
		//return this.width / 16 * this.height / 16;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	Draw( ctx, attached )
	{
		if ( this.orientation === 0 )
		ctx.drawImageFilterCache( sdPortal.img_portal, -8,0, 16, 0 );
		else
		ctx.drawImageFilterCache( sdPortal.img_portal, 0,-16, 0, 32 );
	}

	onRemoveAsFakeEntity()
	{
		sdPortal.portals.splice( sdPortal.portals.indexOf( this ), 1 );
	}
	onBeforeRemove()
	{
		sdPortal.portals.splice( sdPortal.portals.indexOf( this ), 1 );
	}
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.99; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._teleport_delay > 0 )
			{
				this._teleport_delay = Math.max( 0, this._teleport_delay - GSPEED );
			}

			if ( this._ttl > 0 )
			{
				this._ttl = Math.max( 0, this._ttl - GSPEED );
				if ( this._ttl <= 0 )
				{
					this.remove();
					return;
				}
			}
			
			if ( !this.attachment || this.attachment._is_being_removed )
			{
				this.remove();
				return;
			}
			
			this.UpdatePosition();
		}
	}
	
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( this._output )
		if ( this._teleport_delay <= 0 )
		//if ( from_entity.hard_collision )
		if ( typeof from_entity.sx !== 'undefined' )
		{
			if ( this.orientation === 0 )
			{
				if ( from_entity._hitbox_x2 - from_entity._hitbox_x1 > 16 )
				return;
			}
			else
			{
				if ( from_entity._hitbox_y2 - from_entity._hitbox_y1 > 32 )
				return;
			}
			
			let velocity = 0;//( this.orientation === 0 ) ? Math.abs( from_entity.sy ) : Math.abs( from_entity.sx );
			
			if ( this.orientation === 0 )
			{
				if ( this.attachment_y < this.attachment._hitbox_y2 / 2 )
				velocity = from_entity.sy;
				else
				velocity = -from_entity.sy;
			}
			else
			{
				if ( this.attachment_x < this.attachment._hitbox_x2 / 2 )
				velocity = from_entity.sx;
				else
				velocity = -from_entity.sx;
			}
			
			if ( velocity > 0 )
			{

				const Try = ( x, y )=>
				{
					if ( from_entity.CanMoveWithoutOverlap( x, y, 0 ) )
					{
						from_entity.x = x;
						from_entity.y = y;

						if ( this._output.orientation === 0 )
						{
							if ( this._output.y > y )
							from_entity.sy = -velocity;
							else
							from_entity.sy = velocity;
						}
						else
						{
							if ( this._output.x > x )
							from_entity.sx = -velocity;
							else
							from_entity.sx = velocity;
						}

						return false;
					}
					return true;
				};

				if ( Try( this._output.x - from_entity._hitbox_x1 + 0.1, this._output.y ) )
				if ( Try( this._output.x - from_entity._hitbox_x2 - 0.1, this._output.y ) )
				if ( Try( this._output.x, this._output.y - from_entity._hitbox_y1 + 0.1 ) )
				if ( Try( this._output.x, this._output.y - from_entity._hitbox_y2 - 0.1 ) )
				{
					// Nothing worked = not teleported

					return;
				}
				
				if ( from_entity.IsPlayerClass() )
				{
					from_entity.ApplyServerSidePositionAndVelocity( true, 0, 0 );
				}

				sdSound.PlaySound({ name:'portal_through', x:from_entity.x, y:from_entity.y, volume:1 });
				this._teleport_delay = 5;
				this._output._teleport_delay = 5;
			}
		}
		/*if ( from_entity. )
		{
			if ( from_entity.matter_regen < 400 )
			from_entity.matter_regen = Math.min( from_entity.matter_regen + 10, 400 );
		
			from_entity._hea = Math.min( from_entity._hea + 10, from_entity._hmax );
			
			sdSound.PlaySound({ name:'popcorn', x:from_entity.x, y:from_entity.y, volume:0.3, pitch:1.5 });
			
			this.remove();
		}*/
	}
}
//sdPortal.init_class();

export default sdPortal;