
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdLost from './sdLost.js';
import sdCrystal from './sdCrystal.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
import sdTask from './sdTask.js';
import sdWeather from './sdWeather.js';
import sdBlock from './sdBlock.js';
import sdFactions from './sdFactions.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdBubbleShield from './sdBubbleShield.js';
import sdEnemyMech from './sdEnemyMech.js';

class sdVeloxFortifier extends sdEntity
{
	static init_class()
	{
		sdVeloxFortifier.img_fortifier = sdWorld.CreateImageFromFile( 'sdVeloxFortifier' );

		sdVeloxFortifier.ents = 0;
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -21; }
	get hitbox_x2() { return 21; }
	get hitbox_y1() { return -15; }
	get hitbox_y2() { return 15; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.hmax = 15000;
		this.hea = this.hmax;
		
		this._ai_team = 5;
		
		this._next_fortify_in = 60; // When does it give armor/shield to Velox units?
		this._spawn_velox = true; // Spawn Velox humanoids to protect this entity?

		sdVeloxFortifier.ents++;

	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		let half_hp = this.hea > this.hmax / 2;
		
		this.hea -= dmg;
		
		if ( ( this.hea < this.hmax / 2 ) && half_hp )
		this._spawn_velox = true; // Spawn Velox one more time
		
		if ( this.hea <= 0 && was_alive )
		{
			let x = this.x;
			let y = this.y;
			let sx = this.sx;
			let sy = this.sy;
			
			// Remove armor from all Velox humanoids
			/*for ( let i = 0; i < sdCharacter.characters.length; i++ )
			{
				let character = sdCharacter.characters[ i ];
				if ( character._ai_team === 5 ) // Is this humanoid a part of Velox faction?
				{
					character.RemoveArmor();
				}
			}*/

			setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

			let gun;
			gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
			gun.extra = 1;

			//gun.sx = sx;
			//gun.sy = sy;
			sdEntity.entities.push( gun );

			}, 500 );
			
			this.remove();
		}
	}
	
	get mass() { return 800; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{

		this.sy += sdWorld.gravity * GSPEED;

		if ( sdWorld.is_server )
		{
			if ( this._next_fortify_in > 0 )
			this._next_fortify_in -= GSPEED;
			else
			{
				this._next_fortify_in = 150;
				// Fortify / give shield to all Velox humanoids. Make them difficult to kill.
				for ( let i = 0; i < sdCharacter.characters.length; i++ )
				{
					let character = sdCharacter.characters[ i ];
					if ( character._ai_team === 5 && character.hea > 0 ) // Is this humanoid a part of Velox faction?
					{
						//character.ApplyArmor({ armor: 200, _armor_absorb_perc: 0.95, armor_speed_reduction: 0 }); // Give armor
						sdBubbleShield.ApplyShield( character, sdBubbleShield.TYPE_VELOX_SHIELD, true, 32, 32 ); // Apply shield
					}
				}
				// Also for Velox mechs
				for ( let i = 0; i < sdEnemyMech.mechs.length; i++ )
				{
					let mech = sdEnemyMech.mechs[ i ];
					if ( mech._ai_team === 5 && mech.hea > 0 ) // Is this mech
					{
						sdBubbleShield.ApplyShield( mech, sdBubbleShield.TYPE_VELOX_SHIELD, true, 60, 112 ); // Apply shield
					}
				}
				
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'DESTROY-'+this._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: this,
						mission: sdTask.MISSION_DESTROY_ENTITY,
						difficulty: 0.2,
						title: 'Destroy Velox Fortifier',
						description: 'Velox have placed a device which grants them shielding capabilities. It is imperative that you destroy it, they are already a nuisance without shields!'
					});
				}
			}
			if ( this._spawn_velox ) // Spawn random Velox soldier which guards the Fortifier
			{
				{

					let velox_soldiers = 0;
					let velox_soldiers_tot = 2;

					let left_side = ( Math.random() < 0.5 );

					while ( velox_soldiers < velox_soldiers_tot )
					{

						let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });

						sdEntity.entities.push( character_entity );

						{
							let x,y;
							let tr = 1000;
							do
							{
								if ( left_side )
								{
									x = this.x + 16 + 16 * velox_soldiers + ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * velox_soldiers + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * velox_soldiers - ( Math.random() * 192 );
								}
								else
								{
									x = this.x - 16 - 16 * velox_soldiers - ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * velox_soldiers + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * velox_soldiers - ( Math.random() * 192 );
								}

								y = this.y + 192 - ( Math.random() * ( 384 ) );
								if ( y < sdWorld.world_bounds.y1 + 32 )
								y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( y > sdWorld.world_bounds.y2 - 32 )
								y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
								if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, character_entity, sdCom.com_visibility_ignored_classes, null ) )
								//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
								//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
								{
									character_entity.x = x;
									character_entity.y = y;

									sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_VELOX );
									character_entity._ai_stay_near_entity = this;
									character_entity._ai_stay_distance = 64;
									
									sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
									sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT });
									
									break;
								}

								tr--;
								if ( tr < 0 )
								{
									character_entity.remove();
									character_entity._broken = false;
									break;
								}
							} while( true );
						}
						velox_soldiers++;
						this._spawn_velox = false;
					}
				}
			}
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T("Velox Fortifier"), 0, -16 );
		this.DrawHealthBar( ctx );
	}
	Draw( ctx, attached )
	{
		//ctx.apply_shading = false;

		//ctx.filter = this.filter;
		
        ctx.drawImageFilterCache( sdVeloxFortifier.img_fortifier, 0, 0, 64, 64, - 32, - 32, 64, 64 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdVeloxFortifier.ents--;
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdVeloxFortifier.init_class();

export default sdVeloxFortifier;
