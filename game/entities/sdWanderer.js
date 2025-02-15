import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdBG from './sdBG.js';
import sdWeather from './sdWeather.js';


/*
	Not a mob spawner, just an entity which draws a random (probably flying) mob in the background around players.
	Made to give the background a little more life.
*/

class sdWanderer extends sdEntity
{
	static init_class()
	{
		sdWanderer.wanderers = []; // For sdRenderer
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdWanderer.MODEL_SD_HOVER = 0; // SD hover sprite
		sdWanderer.MODEL_SD_FIGHTER_HOVER = 1; // SD fighter hover sprite
		sdWanderer.MODEL_SD_TANK_HOVER = 2; // SD tank hover sprite
		sdWanderer.MODEL_CUBE = 3; // The good old cyan cube
		sdWanderer.MODEL_FALKOK_DRONE = 4; // Falkok drone
		sdWanderer.MODEL_FALKOK_DRONE2 = 5; // Falkok 2nd drone
		sdWanderer.MODEL_VELOX_MECH = 6; // Velox flying mech
		sdWanderer.MODEL_ERTHAL_DRONE = 7; // Erthal drone
		sdWanderer.MODEL_SARRONIAN_DRONE = 8; // Sarronian drone
		sdWanderer.MODEL_SARRONIAN_DRONE2 = 9; // Sarronian 2nd drone - There's 5 of these. Let's keep it at 2 spawning for now.
		sdWanderer.MODEL_SETR_DRONE = 10; // Setr drone
		sdWanderer.MODEL_SETR_DESTROYER = 11; // Setr destroyer
		sdWanderer.MODEL_TZYRG_DRONE = 12; // Tzyrg drone
		sdWanderer.MODEL_TZYRG_DRONE2 = 13; // Tzyrg 2nd drone 
		sdWanderer.MODEL_ZEKTARON_DREADNOUGHT = 14; // Zektaron dreadnought
		sdWanderer.MODEL_FALKOK_HOVER = 15; // Falkok hover
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }
	
	IsTargetable( by_entity=null, ignore_safe_areas=false )
	{
		return false; // Ignore bullets
	}

	get hard_collision()
	{ return false; }
	
	IsBGEntity()
	{ return 5; }
	
	IsGlobalEntity()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null ) // Not that much useful since it cannot be damaged by anything but matter it contains.
	{
		if ( !sdWorld.is_server )
		return;
	}
	constructor( params )
	{
		super( params );
		
		this.model = params.model || Math.round( Math.random() * 2 );
		
		//this.x = 0;
		//this.y = 0;
		
		//this.time_left = 30 * 60 * 60; // Time to move across the screen, in GSPEED units ( 30 GSPEED = 1 second )
		
		this.layer = params.layer || Math.round( Math.random() * 7 ); // Behind which skybox / darklands layer will this entity move?
		
		this.side = params.side || 1;
		
		this.move_x = ( this.x < ( ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ) ? 0.03 : -0.03; // Move from one border to another
		this._move_y = 0 * ( 1 + this.layer );
		
		this.move_x *= Math.max( 1, Math.random() * 4 * ( 1 + this.layer ) );
		
		this.move_x *= 1000; // Rounding errors during sync
		
		//this.move_x = 1;
		
		//this._set_spawn = false; // Set it's coords to world borders when spawned
		
		//if ( this.model !== sdWanderer.MODEL_CUBE )
		//this.side = ( Math.random() < 0.5 ) ? -1 : 1;
		
		//this.layer = params.layer || Math.round( Math.random() * 7 ); // Behind which skybox / darklands layer will this entity move?
		
		sdWanderer.wanderers.push( this );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.x += this.move_x / 1000; // Rounding errors during sync
		this.y += this._move_y;
		
		if ( sdWorld.is_server )
		{
			//this.time_left -= GSPEED;
			
			/*if ( !this._set_spawn )
			{
				if ( this.move_x < 0 )
				this.x = sdWorld.world_bounds.x2 + 64; // From right to left
				else
				this.x = sdWorld.world_bounds.x1 - 64; // From left to right
			
				this._set_spawn = true;
			}*/
			
			if ( this.model !== sdWanderer.MODEL_CUBE )
			{
				if ( this.move_x > 0 )
				this.side = -1;
				else
				this.side = 1;
			}
			
			/*if ( this.x > sdWorld.world_bounds.x2 )
			{
				if ( this.move_x > 0 )
				this.move_x = 8;
				else
				this.move_x = -8;
			}
			else
			if ( this.x < sdWorld.world_bounds.x1 )
			{
				if ( this.move_x > 0 )
				this.move_x = 8;
				else
				this.move_x = -8;
			}
			else
			{
				if ( this.move_x > 0 )
				this.move_x = 2;
				else
				this.move_x = -2;
			}*/
		
			
			//if ( this.time_left <= 0 )
			if ( this.move_x > 0 && this.x > sdWorld.world_bounds.x2 + ( 1600 * 8 ) - ( 1600 * this.layer ) )
			this.remove();
		
			if ( this.move_x <= 0 && this.x < sdWorld.world_bounds.x1 - ( 1600 * 8 ) + ( 1600 * this.layer ) )
			this.remove();
		}
	}
	
	GetImageFromModel() // Find image for specific wanderer "models"
	{

		if ( this.model === sdWanderer.MODEL_SD_HOVER )
		return 'hover_sprite';

		if ( this.model === sdWanderer.MODEL_SD_FIGHTER_HOVER )
		return 'f_hover_sprite';
	
		if ( this.model === sdWanderer.MODEL_SD_TANK_HOVER )
		return 'tank_sprite';
	
		if ( this.model === sdWanderer.MODEL_CUBE )
		return 'sdCube';
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE )
		return 'drone_falkok_sprite2';
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE2 )
		return 'drone_falkok_sprite3';
	
		if ( this.model === sdWanderer.MODEL_VELOX_MECH )
		return 'fmech2_sheet';
	
		if ( this.model === sdWanderer.MODEL_ERTHAL_DRONE )
		return 'drone_erthal';
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE )
		return 'sarronian_drone1';
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE2 )
		return 'sarronian_drone2';
	
		if ( this.model === sdWanderer.MODEL_SETR_DRONE )
		return 'drone_setr_sprite';
	
		if ( this.model === sdWanderer.MODEL_SETR_DESTROYER )
		return 'sdSetrDestroyer';
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE )
		return 'drone_tzyrg_sprite';
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE2 )
		return 'drone_tzyrg2_sprite';
	
		if ( this.model === sdWanderer.MODEL_ZEKTARON_DREADNOUGHT )
		return 'zektaron_dreadnought';
		
		if ( this.model === sdWanderer.MODEL_FALKOK_HOVER )
		return 'falkok_hover';
	}
	GetXOffsetFromModel() // X offset for the image to match a flying animation, for example
	{

		if ( this.model === sdWanderer.MODEL_SD_HOVER )
		return 64;

		if ( this.model === sdWanderer.MODEL_SD_FIGHTER_HOVER )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_SD_TANK_HOVER )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_CUBE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE2 )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_VELOX_MECH )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_ERTHAL_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE2 )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SETR_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SETR_DESTROYER )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE2 )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_ZEKTARON_DREADNOUGHT )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_HOVER )
		return 64;
	}
	
	GetYOffsetFromModel() // Y offset for the image to match a flying animation, for example
	{

		if ( this.model === sdWanderer.MODEL_SD_HOVER )
		return 0;

		if ( this.model === sdWanderer.MODEL_SD_FIGHTER_HOVER )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SD_TANK_HOVER )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_CUBE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE2 )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_VELOX_MECH )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_ERTHAL_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE2 )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SETR_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_SETR_DESTROYER )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE2 )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_ZEKTARON_DREADNOUGHT )
		return 0;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_HOVER )
		return 0;
	
	}
	
	GetWidthFromModel() // Image width value for specific model
	{

		if ( this.model === sdWanderer.MODEL_SD_HOVER )
		return 64;

		if ( this.model === sdWanderer.MODEL_SD_FIGHTER_HOVER )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_SD_TANK_HOVER )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_CUBE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE2 )
		return 48;
	
		if ( this.model === sdWanderer.MODEL_VELOX_MECH )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_ERTHAL_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE )
		return 48;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE2 )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_SETR_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_SETR_DESTROYER )
		return 96;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE2 )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_ZEKTARON_DREADNOUGHT )
		return 224;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_HOVER )
		return 64;

		
	}
	
	GetHeightFromModel() // Image height value for specific model
	{

		if ( this.model === sdWanderer.MODEL_SD_HOVER )
		return 32;

		if ( this.model === sdWanderer.MODEL_SD_FIGHTER_HOVER )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_SD_TANK_HOVER )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_CUBE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_DRONE2 )
		return 48;
	
		if ( this.model === sdWanderer.MODEL_VELOX_MECH )
		return 96;
	
		if ( this.model === sdWanderer.MODEL_ERTHAL_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE )
		return 48;
	
		if ( this.model === sdWanderer.MODEL_SARRONIAN_DRONE2 )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_SETR_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_SETR_DESTROYER )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE )
		return 32;
	
		if ( this.model === sdWanderer.MODEL_TZYRG_DRONE2 )
		return 64;
	
		if ( this.model === sdWanderer.MODEL_ZEKTARON_DREADNOUGHT )
		return 128;
	
		if ( this.model === sdWanderer.MODEL_FALKOK_HOVER )
		return 32;
		
	}
	
	get title(){
		return 'Wanderer';
	}

	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		let i = sdWanderer.wanderers.indexOf( this );
		
		if ( i !== -1 )
		sdWanderer.wanderers.splice( i, 1 );
	}
}
//sdWanderer.init_class();

export default sdWanderer;
