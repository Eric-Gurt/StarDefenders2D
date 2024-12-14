
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdCube from './sdCube.js';
import sdLost from './sdLost.js';
import sdCrystal from './sdCrystal.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
import sdFactions from './sdFactions.js';

// This is an entity which spawns humanoids and drones of specific factions inside generated outposts.

class sdFactionSpawner extends sdEntity
{
	static init_class()
	{
		sdFactionSpawner.img_falkok_spawner = sdWorld.CreateImageFromFile( 'falkok_teleporter' );
		sdFactionSpawner.img_tzyrg_spawner = sdWorld.CreateImageFromFile( 'tzyrg_constructor' );

		sdFactionSpawner.falkok_spawners = 0;
		sdFactionSpawner.sarronian_spawners = 0;
		sdFactionSpawner.council_spawners = 0;
		sdFactionSpawner.tzyrg_spawners = 0;

		sdFactionSpawner.FALKOK_SPAWNER = 1;
		sdFactionSpawner.SARRONIAN_SPAWNER = 2;
		sdFactionSpawner.COUNCIL_SPAWNER = 3;
		sdFactionSpawner.TZYRG_SPAWNER = 4;
		
		sdFactionSpawner.bounds_by_type = []; // Hitboxes
		sdFactionSpawner.bounds_by_type[ sdFactionSpawner.FALKOK_SPAWNER ] = { x1: -20, x2: 20, y1: 12, y2: 16 };
		sdFactionSpawner.bounds_by_type[ sdFactionSpawner.TZYRG_SPAWNER ] = { x1: -24, x2: 24, y1: -16, y2: 32 };
		
		//sdFactionSpawner.ignored_classes_arr = [ 'sdGun', 'sdBullet', 'sdCharacter', 'sdDrone' ];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return sdFactionSpawner.bounds_by_type[ this.type ] ? sdFactionSpawner.bounds_by_type[ this.type ].x1 : -20; }
	get hitbox_x2() { return sdFactionSpawner.bounds_by_type[ this.type ] ? sdFactionSpawner.bounds_by_type[ this.type ].x2 : 20; }
	get hitbox_y1() { return sdFactionSpawner.bounds_by_type[ this.type ] ? sdFactionSpawner.bounds_by_type[ this.type ].y1 : -12; }
	get hitbox_y2() { return sdFactionSpawner.bounds_by_type[ this.type ] ? sdFactionSpawner.bounds_by_type[ this.type ].y2 : 16; }
	
	get hard_collision() // For world geometry where players can walk
	{ 
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		return false;
	
	
		return true;
	}
	
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		return sdFactionSpawner.ignored_classes_arr;
		
		return null;
	}*/
	
	constructor( params )
	{
		super( params );
		

		this._regen_timeout = 0;

		this.type = params.type || 1;

		this.hmax = this.GetHealthFromType();
		this.hea = this.hmax;
		this._last_damage = 0; // Sound flood prevention
		this.next_spawn_in = this.GetSpawnSpeedFromType(); // Timer for spawning entities
		
		this._ai_team = this.GetAITeamFromType();

		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		sdFactionSpawner.falkok_spawners++;

		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		sdFactionSpawner.tzyrg_spawners++;
	}
	
	GetHealthFromType()
	{
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		return 1000;
		
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		return 4000;
	
		return 1000;
	}
	
	GetAITeamFromType()
	{
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		return 1;
		
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		return 8;
	
		return 0;
	}
	GetSpawnSpeedFromType()
	{
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		return 30 * 15;
		
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		return 30 * 8;
	
		return 30 * 15;
	}

	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;

		this._regen_timeout = 60;
		
		if ( this.hea <= 0 && was_alive )
		{
			this.remove();
		}
		
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;

		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		this.hea = Math.min( this.hea + GSPEED, this.hmax );
	
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		{
			if ( this.next_spawn_in < 80 )
			this._update_version++;
			if ( this.next_spawn_in > 240 - 80 )
			this._update_version++;
		
			// Unfortunately needed for spawn animation
		}

		if ( this.next_spawn_in > 0 )
		this.next_spawn_in -= GSPEED;
		else
		{

			let ais = 0;
			let i;
			for ( i = 0; i < sdCharacter.characters.length; i++ )
			if ( sdCharacter.characters[ i ].hea > 0 )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			if ( sdCharacter.characters[ i ]._ai_team === this._ai_team )
			{
				ais++;
			}
			
			let drones = 0;
			
			for ( i = 0; i < sdDrone.drones.length; i++ )
			if ( sdDrone.drones[ i ].hea > 0 )
			if ( !sdDrone.drones[ i ]._is_being_removed )
			if ( sdDrone.drones[ i ]._ai_team === this._ai_team )
			{
				drones++;
			}

			if ( this.type === sdFactionSpawner.FALKOK_SPAWNER && ais < sdWorld.entity_classes.sdWeather.only_instance._max_ai_count ) // Falkok spawner
			{
				if ( this.CanMoveWithoutOverlap( this.x, this.y - 8, 4 ) )
				{
					sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
					sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

					this.next_spawn_in = this.GetSpawnSpeedFromType();
					//if ( Math.random() < 0.666 ) // 66% chance a humanoid spawns
					{
						let character_entity = new sdCharacter({ x:this.x, y:this.y - 8, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

						sdEntity.entities.push( character_entity );
						sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_FALKOK ); // Give them Falkok properties
					}
				}
			}

			if ( this.type === sdFactionSpawner.TZYRG_SPAWNER ) // Tzyrg spawner
			{
				this.next_spawn_in = this.GetSpawnSpeedFromType();

				if ( ais < sdWorld.entity_classes.sdWeather.only_instance._max_ai_count ) // Check for humanoids
				{
					//if ( Math.random() < 0.666 ) // 66% chance a humanoid spawns
					{
						let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

						sdEntity.entities.push( character_entity );
						sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_TZYRG ); // Give them Tzyrg properties
					}
				}
				else // If no space for humanoids, then try to spawn drones
				if ( drones < sdWorld.entity_classes.sdWeather.only_instance._max_drone_count ) // Check for drones
				{
						let drone = new sdDrone({ x:this.x, y:this.y, type: sdDrone.DRONE_TZYRG, _ai_team: this._ai_team });
						sdEntity.entities.push( drone );
						drone.sy = -2;
						drone.sx = -3 + ( Math.random() * 6 );
				}
			}
		}
	}
	
	onMovementInRange( from_entity )
	{
		if ( !this.hard_collision )
		if ( from_entity.is( sdDrone ) || from_entity.is( sdCharacter ) )
		if ( this._ai_team === from_entity._ai_team )
		{
			if ( from_entity.is( sdCharacter ) )
			if ( from_entity._ai )
			from_entity._ai.target = null;

			if ( from_entity.is ( sdDrone ) )
			from_entity.SetTarget( null );
		}
	}
	get title()
	{
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		return "Falkonian teleporter";
	
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		return "Tzyrg constructor";
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		//ctx.filter = this.filter;
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER ) // Falkok spawner
		{
			ctx.drawImageFilterCache( sdFactionSpawner.img_falkok_spawner, - 24, - 16, 48,32 );
		}
		else
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER ) // Tzyrg spawner
		{
			let xx = 1;

			if ( this.next_spawn_in < 80 )
			xx = Math.max( 1, 10 - Math.round( this.next_spawn_in / 8 ) );
			if ( this.next_spawn_in > 240 - 80 )
			xx = Math.min( 10, Math.round( ( this.next_spawn_in - 150 ) / 8 ) );
		
			ctx.drawImageFilterCache( sdFactionSpawner.img_tzyrg_spawner, 0, 0, 64, 64, - 32, - 32, 64, 64 ); // General structure
			
			ctx.drawImageFilterCache( sdFactionSpawner.img_tzyrg_spawner, xx * 64, 0, 64, 64, - 32, - 32, 64, 64 ); // The doors
		}
		else
		{
			ctx.filter = 'saturate(0)';
			ctx.drawImageFilterCache( sdFactionSpawner.img_falkok_spawner, - 24, - 16, 48,32 );
		}

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		sdFactionSpawner.falkok_spawners--;
	
		if ( this.type === sdFactionSpawner.TZYRG_SPAWNER )
		sdFactionSpawner.tzyrg_spawners--;

		sdWorld.BasicEntityBreakEffect( this, 10 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdFactionSpawner.init_class();

export default sdFactionSpawner;
