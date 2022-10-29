
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

// This is an entity which spawns humanoids and drones of specific factions inside generated outposts.

class sdFactionSpawner extends sdEntity
{
	static init_class()
	{
		sdFactionSpawner.img_falkok_spawner = sdWorld.CreateImageFromFile( 'falkok_teleporter' );

		sdFactionSpawner.falkok_spawners = 0;
		sdFactionSpawner.sarrorian_spawners = 0;
		sdFactionSpawner.council_spawners = 0;
		sdFactionSpawner.tzyrg_spawners = 0;

		sdFactionSpawner.FALKOK_SPAWNER = 1;
		sdFactionSpawner.SARRORIAN_SPAWNER = 2;
		sdFactionSpawner.COUNCIL_SPAWNER = 3;
		sdFactionSpawner.TZYRG_SPAWNER = 4;
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -20; }
	get hitbox_x2() { return 20; }
	get hitbox_y1() { return 12; }
	get hitbox_y2() { return 16; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		

		this._regen_timeout = 0;

		this.type = params.type || 1;

		this.hmax = 1000;
		this.hea = this.hmax;
		this._last_damage = 0; // Sound flood prevention
		this._next_spawn_in = 30 * 15; // TImer for spawning entities

		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		sdFactionSpawner.falkok_spawners++;
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

		if ( this._next_spawn_in > 0 )
		this._next_spawn_in -= GSPEED;
		else
		if ( this.CanMoveWithoutOverlap( this.x, this.y - 8, 4 ) )
		{

			let ais = 0;
			for ( var i = 0; i < sdCharacter.characters.length; i++ )
			if ( sdCharacter.characters[ i ].hea > 0 )
			if ( !sdCharacter.characters[ i ]._is_being_removed )
			if ( sdCharacter.characters[ i ]._ai )
			if ( sdCharacter.characters[ i ]._ai_team === this.type )
			{
				ais++;
			}

			if ( this.type === sdFactionSpawner.FALKOK_SPAWNER && ais < sdWorld.entity_classes.sdWeather.only_instance._max_ai_count ) // Falkok spawner
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

				this._next_spawn_in = 30 * 15;
				//if ( Math.random() < 0.666 ) // 66% chance a humanoid spawns
				{
					let character_entity = new sdCharacter({ x:this.x, y:this.y - 8, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

					sdEntity.entities.push( character_entity );

					{
						{	
							{

								//sdWorld.UpdateHashPosition( ent, false );
								if ( Math.random() < 0.07 )
								{
									if ( Math.random() < 0.2 )
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }) );
										character_entity._ai_gun_slot = 4;
									}
									else
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN }) );
										character_entity._ai_gun_slot = 3;
									}
								}
								else
								{ 
									if ( Math.random() < 0.1 )
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }) );
										character_entity._ai_gun_slot = 2;
									}
									else
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );
										character_entity._ai_gun_slot = 2;
									}
								}
								let falkok_settings;
								if ( character_entity._ai_gun_slot === 2 )
								falkok_settings = {"hero_name":"Falkok","color_bright":"#6b0000","color_dark":"#420000","color_bright3":"#6b0000","color_dark3":"#420000","color_visor":"#5577b9","color_suit":"#240000","color_suit2":"#2e0000","color_dark2":"#560101","color_shoes":"#000000","color_skin":"#240000","color_extra1":"#240000","helmet1":false,"helmet2":true,"body60":true,"legs60":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":true};
								if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If Falkok spawns with Raygun or PSI-Cutter, change their looks Phoenix Falkok
								falkok_settings = {"hero_name":"Phoenix Falkok","color_bright":"#ffc800","color_dark":"#a37000","color_bright3":"#ffc800","color_dark3":"#a37000","color_visor":"#000000","color_suit":"#ffc800","color_suit2":"#ffc800","color_dark2":"#000000","color_shoes":"#a37000","color_skin":"#a37000","helmet1":false,"helmet12":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":true};

								character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( falkok_settings );
								character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( falkok_settings );
								character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( falkok_settings );
								character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( falkok_settings );
								character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( falkok_settings );
								character_entity.title = falkok_settings.hero_name;
								if ( character_entity._ai_gun_slot === 2 ) // If a regular falkok spawns
								{
									character_entity.matter = 75;
									character_entity.matter_max = 75;
	
									character_entity.hea = 115; // 105 so railgun requires at least headshot to kill and body shot won't cause bleeding
									character_entity.hmax = 115;
	
									//character_entity._damage_mult = 1 / 2.5; // 1 / 4 was too weak
								}
	
								if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // If a Phoenix Falkok spawns
								{
									character_entity.matter = 100;
									character_entity.matter_max = 100;
	
									character_entity.hea = 250; // It is a stronger falkok after all, although revert changes if you want
									character_entity.hmax = 250;
	
									//character_entity._damage_mult = 1 / 1.5; // Rarer enemy therefore more of a threat?
								}	
								character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
								//character_entity._ai_enabled = sdCharacter.AI_MODEL_FALKOK;
											
								character_entity._ai_level = Math.floor( Math.random() * 2 ); // Either 0 or 1
											
								character_entity._matter_regeneration = 1 + character_entity._ai_level; // At least some ammo regen
								character_entity._jetpack_allowed = true; // Jetpack
								//character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ) ; // Small recoil reduction based on AI level
								character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
								character_entity._ai_team = 1; // AI team 1 is for Falkoks, preparation for future AI factions
								character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
							}
						}
					}
				}
				/*else // Spawn the drone instead
				{
					let drone = new sdDrone({ x:this.x, y:this.y - 16, _ai_team: 1});
					sdEntity.entities.push( drone );
				}*/

				// Drone spawns are disabled due to them attacking interior walls
			}
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER )
		sdEntity.Tooltip( ctx, "Falkonian teleporter" );
	
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		//ctx.filter = this.filter;
		
		if ( this.type === sdFactionSpawner.FALKOK_SPAWNER ) // Falkok spawner
		{
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

		sdWorld.BasicEntityBreakEffect( this, 10 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdFactionSpawner.init_class();

export default sdFactionSpawner;
