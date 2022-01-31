/*

	Class for wandering mobs in backgrounds. Basically an entity spawner.

	Not finished. Probably needs entitiy despawner as well (for entities that can leave playable area and enter wandering mode)

*/

import sdEntity from './sdEntity.js';
import sdWorld from '../sdWorld.js';
import sdCube from './sdCube.js';
import sdAsp from './sdAsp.js';
import sdDrone from './sdDrone.js';
import sdEnemyMech from './sdEnemyMech.js';
import sdBG from './sdBG.js';

class sdWanderer extends sdEntity
{
	static init_class()
	{
		sdWanderer.spawnable_options = 
		[
			[ 'sdVirus', {} ],
			[ 'sdCube', { kind: 0 } ]
		];
	}
	
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	IsBGEntity() // 0 for in-game entities, 1 for background entities, 2 is for moderator areas, 3 is for cables, 4 for task in-world interfaces, 5 for wandering around background entities. Should handle collisions separately
	{ return 5; }
	
	constructor( params )
	{
		this.far_entity = params.far_entity || 'sdVirus';
		this.far_params = params.far_params || {};
		
		this.approach_progress = 0;
		
		this._can_fly = false;
		
		this._fake_ent = sdWorld.entity_classes[ this.far_entity ]( this.far_params );

		if ( this._fake_ent.is( sdCube ) ||
			 this._fake_ent.is( sdAsp ) ||
			 this._fake_ent.is( sdDrone ) ||
			 this._fake_ent.is( sdEnemyMech ) )
		{
			this._can_fly = true;
		}

		this._direction_x = Math.random() - 0.5;
		this._direction_y = Math.random() - 0.5;
		
		this._far_hitbox_x1 = this._fake_ent.hitbox_x1;
		this._far_hitbox_x2 = this._fake_ent.hitbox_x2;
		this._far_hitbox_y1 = this._fake_ent.hitbox_y1;
		this._far_hitbox_y2 = this._fake_ent.hitbox_y2;
		
		this._far_is_bg_entity = this._fake_ent.IsBGEntity();
		
		if ( sdWorld.is_server )
		{
			this.RemoveFakeEntity();
		}
		else
		{
			let prop = null;
			
			if ( typeof this._fake_ent[ 'side' ] !== 'undefined' )
			prop = 'side';
			
			if ( typeof this._fake_ent[ '_side' ] !== 'undefined' )
			prop = '_side';
			
			if ( typeof this._fake_ent[ 'act_x' ] !== 'undefined' )
			prop = 'act_x';
			
			if ( prop !== null )
			this._fake_ent[ prop ] = ( this._direction_x < 0 ) ? -1 : 1;
		}
		
		this.SetMethod( 'SpawnDetector', this.SpawnDetector ); // Here it used for "this" binding so method can be passed to collision logic
	}
	
	SpawnDetector( from_entity )
	{
		let is_bg = from_entity.IsBGEntity();
		if ( is_bg === 0 )
		{
			return true; // Always blocked by items and walls
		}
		if ( is_bg === 1 ) // Background walls
		{
			if ( from_entity.is( sdBG ) )
			{
				if ( from_entity.material === sdBG.MATERIAL_GROUND )
				{
					return false; // Allow spawns underground
				}
				else
				{
					return true;
				}
			}
			else
			{
				return true; // Always blocked by unknown background items such as theatre
			}
		}
		return false;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			this.x += this._direction_x * ( 1 - this.approach_progress / 100 );
			this.y += this._direction_y * ( 1 - this.approach_progress / 100 );
			
			if ( this.x < sdWorld.world_bounds.x1 ||
				 this.x > sdWorld.world_bounds.x2 ||
				 this.y < sdWorld.world_bounds.y1 ||
				 this.y > sdWorld.world_bounds.y2 )
			{
				this.remove();
			}
			else
			{
				let x1 = this.x + this._far_hitbox_x1;
				let y1 = this.y + this._far_hitbox_y1;
				let x2 = this.x + this._far_hitbox_x2;
				let y2 = this.y + this._far_hitbox_y2;
				
				if ( !sdWorld.CheckWallExistsBox( x1, y1, x2, y2, null, null, null, SpawnDetector ) )
				{
					this.approach_progress += GSPEED;
					
					if ( this.approach_progress >= 100 )
					{
						this.remove();
					}
				}
				else
				{
					this.approach_progress = Math.max( 0, this.approach_progress - GSPEED );
				}
			}
		}
	}
	
	RemoveFakeEntity() // Server does it instantly, but clients do it on removal
	{
		if ( this._fake_ent )
		{
			this._fake_ent.SetMethod( 'onRemove', this._fake_ent.onRemoveAsFakeEntity ); // Disable any removal logic
			this._fake_ent.remove();
			this._fake_ent._remove();
			
			this._fake_ent = null;
		}
	}
	
	onRemove() // Class-specific, if needed
	{
		this.RemoveFakeEntity();
	}
}
export default sdWanderer;