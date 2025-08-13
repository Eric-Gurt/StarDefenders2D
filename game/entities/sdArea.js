/*

	Staff tools for damage prevention of sorts

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdTimer from './sdTimer.js';

import sdRenderer from '../client/sdRenderer.js';


class sdArea extends sdEntity
{
	static init_class()
	{
		sdArea.TYPE_NONE = 0;
		sdArea.TYPE_PREVENT_DAMAGE = 1;
		sdArea.TYPE_ERASER_AREA = 2; // Erases other areas when built on top of them
		
		//sdBlock.img_area_no_dmg = sdWorld.CreateImageFromFile( 'area_no_dmg' );
		//sdBlock.img_area_del = sdWorld.CreateImageFromFile( 'area_del' );
		
		sdArea.as_class_list = [ 'sdArea' ];
		//sdArea.AreaFilteringMethod = ( e ) => e.is( sdArea );
		
		sdArea.entity_to_protecting_areas = new Map();
		sdArea.current_iterator = null;
		
		setTimeout( ()=>
		{
			sdTimer.ExecuteWithDelay( ( timer )=>{

				if ( sdArea.current_iterator === null )
				{
					sdArea.current_iterator = sdArea.entity_to_protecting_areas.keys();
				}

				let iters = Math.max( 100, sdArea.entity_to_protecting_areas.size * 0.1 );

				next_iter:
				while ( iters-- > 0 )
				{
					let ret = sdArea.current_iterator.next();

					if ( ret.done )
					{
						sdArea.current_iterator = null;
						break next_iter;
					}

					let e = ret.value;
					
					if ( e._is_being_removed )
					{
						sdArea.entity_to_protecting_areas.delete( e );
						continue next_iter;
					}
					
					let areas_set = sdArea.entity_to_protecting_areas.get( e );
					for ( let area of areas_set )
					if ( area._is_being_removed || !area.DoesOverlapWith( e ) )
					{
						areas_set.delete( area );
						if ( areas_set.size === 0 )
						{
							sdArea.entity_to_protecting_areas.delete( e );
							continue next_iter;
						}
					}
				}


				timer.ScheduleAgain( 1000 );

			}, 1000 );
		}, 0 );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get title()
	{
		if ( this.type === sdArea.TYPE_PREVENT_DAMAGE )
		return 'No-combat area';
	
		if ( this.type === sdArea.TYPE_ERASER_AREA )
		return 'Area eraser';
	
		return 'Area';
	}

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.size; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.size; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	IsVisible( observer_entity )
	{
		if ( observer_entity )
		if ( observer_entity.IsPlayerClass() )
		if ( observer_entity._god )
		return true;

		return false;
	}
	
	onMovementInRange( from_entity )
	{
		if ( this.type === sdArea.TYPE_PREVENT_DAMAGE )
		{
			let protected_by_set = sdArea.entity_to_protecting_areas.get( from_entity );
			
			if ( !protected_by_set )
			{
				protected_by_set = new Set();
				sdArea.entity_to_protecting_areas.set( from_entity, protected_by_set );
			}
			
			if ( !protected_by_set.has( this ) )
			{
				protected_by_set.add( this );
				//this._protecting.add( from_entity );
			}
		}
	}
	static IsEntityProtected( e )
	{
		return sdArea.entity_to_protecting_areas.has( e );
	}
	
	static CheckPointDamageAllowed( x, y )
	{
		if ( sdWorld.CheckWallExists( x, y, null, null, sdArea.as_class_list ) )
		//if ( sdWorld.CheckWallExists( x, y, null, null, null, sdArea.AreaFilteringMethod ) )
		if ( sdWorld.last_hit_entity )
		if ( sdWorld.last_hit_entity.type === sdArea.TYPE_PREVENT_DAMAGE )
		{
			return false;
		}
		
		return true;
	}
	
	IsAdminEntity() // Influences remover gun hit test
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.filter = params.filter || '';
		
		this.size = params.size || 128;
		
		this.type = params.type || sdArea.TYPE_NONE;
		
		//this._protecting = new Set();
		
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED, false );
		
		if ( this.type === sdArea.TYPE_ERASER_AREA )
		{
			//let that = this;
			// Or else removed too quickly
			setTimeout( ()=>
			{
				this.remove();
				
			}, 1000 );
		}
	}
	onSnapshotApplied() // To override
	{
		sdWorld.UpdateHashPosition( this, false, true ); // Trigger onMovementInRange for any overlapped entities
	}
	
	MeasureMatterCost()
	{
		return Infinity;
	}
	GetNonIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions. Most probably will have conflicts with .GetIgnoredEntityClasses()
	{
		return [ 'sdArea' ];
	}
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 2; }
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		if ( sdWorld.time % 1000 < 500 )
		{
			ctx.globalAlpha = 0.3;
		}
		else
		{
			ctx.globalAlpha = 0.2;
		}
		
		if ( this.type === sdArea.TYPE_PREVENT_DAMAGE )
		{
			ctx.fillStyle = '#33AAFF';
			
			//sdBlock.img_area_no_dmg = sdWorld.CreateImageFromFile( 'area_no_dmg' );
			//sdBlock.img_area_del = sdWorld.CreateImageFromFile( 'area_del' );
		}
		else
		if ( this.type === sdArea.TYPE_ERASER_AREA )
		ctx.fillStyle = '#ff0000';
		else
		ctx.fillStyle = '#ffffff';
		
		ctx.fillRect( 0, 0, this._hitbox_x2, this._hitbox_y2 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	DrawFG( ctx, attached )
	{
		this.Draw( ctx, attached );
	}
}
//sdArea.init_class();

export default sdArea;