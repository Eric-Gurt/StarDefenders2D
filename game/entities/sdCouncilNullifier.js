
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
import sdTask from './sdTask.js';
import sdWeather from './sdWeather.js';
import sdBlock from './sdBlock.js';
import sdFactions from './sdFactions.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdArea from './sdArea.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';

class sdCouncilNullifier extends sdEntity
{
	static init_class()
	{
		sdCouncilNullifier.img_council_nullifier = sdWorld.CreateImageFromFile( 'sdCouncilNullifier' );

		sdCouncilNullifier.ents = 0;
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get hitbox_x1() { return -14; }
	get hitbox_x2() { return 14; }
	get hitbox_y1() { return -16; }
	get hitbox_y2() { return 18; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.hmax = 12000;
		this.hea = this.hmax;

		this.glow_animation = 0; // Glow animation for the jnullifier
		this._glow_fade = 0; // Should the glow fade or not?
		this._spawn_effect = 10; // Timer that spawns pulse status effect on entity
		this._spawn_timer = 60; // Spawn Council timer
		this._regen_timeout = 0; // Regen timeout;
		
		this._notify_players_in = 60; // Timer to notify players about the task
		
		this._ent_to_nullify = params.ent_to_nullify || null;
		
		this._set_matter_to = -1; // To how much matter should it drain an entity? -1 = disabled
		
		this._despawn_without_ent = false;
		
		this._ai_team = 3;
		sdCouncilNullifier.ents++;

	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_ent_to_nullify' ) return true;

		return false;
	}
	/*GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}*/
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		let old_hea = this.hea + dmg;
			
		if ( Math.round( old_hea / ( this.hmax / 10 ) ) > Math.round( this.hea / ( this.hmax / 10 ) ) ) // Should spawn about 10 assault drones per machine
		{
			if ( initiator )
			if ( !sdWeather.only_instance._chill )
			{
				let drone = new sdDrone({ x:0, y:0 , type: sdDrone.DRONE_COUNCIL_ATTACK });

				sdEntity.entities.push( drone );
								
				let x,y;
				let tr = 100;
				do
				{
					{
						x = initiator.x + 128 - ( Math.random() * 256 );

						if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
						x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

						if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
						x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );
					}

					y = initiator.y + 128 - ( Math.random() * ( 256 ) );
					if ( y < sdWorld.world_bounds.y1 + 32 )
					y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

					if ( y > sdWorld.world_bounds.y2 - 32 )
					y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

					if ( drone.CanMoveWithoutOverlap( x, y, 0 ) )
					if ( sdWorld.CheckLineOfSight( x, y, initiator.x, initiator.y, drone, sdCom.com_visibility_ignored_classes, null ) )
					if ( sdArea.CheckPointDamageAllowed( x, y ) )
					if ( sdBaseShieldingUnit.IsMobSpawnAllowed( x, y ) )
					//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
					//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
					{
						drone.x = x;
						drone.y = y;
						
						drone._look_x = x + 0.5 - Math.random();
						drone._look_y = y + 0.5 - Math.random();

						sdSound.PlaySound({ name:'council_teleport', x:drone.x, y:drone.y, volume:0.5 });
						sdWorld.SendEffect({ x:drone.x, y:drone.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

						if ( ( initiator._ai_team || -1 ) !== this._ai_team )
						drone.SetTarget( initiator );
						
						drone._attack_timer = 10;

						sdWorld.UpdateHashPosition( drone, false );
						//console.log('Drone spawned!');
						break;
					}


					tr--;
					if ( tr < 0 )
					{
						drone.remove();
						drone._broken = false;
						break;
					}
				} while( true );
			}
		}
		if ( Math.round( old_hea / ( this.hmax / 4 ) ) > Math.round( this.hea / ( this.hmax / 4 ) ) ) // And about 4 support drones
		if ( !sdWeather.only_instance._chill )
		{
			//if ( initiator )
			{
				let drone = new sdDrone({ x:0, y:0 , type: sdDrone.DRONE_COUNCIL });

				sdEntity.entities.push( drone );
								
				let x,y;
				let tr = 100;
				do
				{
					{
						x = this.x + 128 - ( Math.random() * 256 );

						if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
						x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

						if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
						x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );
					}

					y = this.y + 128 - ( Math.random() * ( 256 ) );
					if ( y < sdWorld.world_bounds.y1 + 32 )
					y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

					if ( y > sdWorld.world_bounds.y2 - 32 )
					y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

					if ( drone.CanMoveWithoutOverlap( x, y, 0 ) )
					if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, drone, sdCom.com_visibility_ignored_classes, null ) )
					if ( sdArea.CheckPointDamageAllowed( x, y ) )
					if ( sdBaseShieldingUnit.IsMobSpawnAllowed( x, y ) )
					//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
					//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
					{
						drone.x = x;
						drone.y = y;
						
						drone._look_x = x + 0.5 - Math.random();
						drone._look_y = y + 0.5 - Math.random();

						sdSound.PlaySound({ name:'council_teleport', x:drone.x, y:drone.y, volume:0.5 });
						sdWorld.SendEffect({ x:drone.x, y:drone.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

						drone.SetTarget( this );
						

						sdWorld.UpdateHashPosition( drone, false );
						//console.log('Drone spawned!');
						break;
					}


					tr--;
					if ( tr < 0 )
					{
						drone.remove();
						drone._broken = false;
						break;
					}
				} while( true );
			}
		}
		
		if ( this.hea <= 0 && was_alive )
		{
			{
				let x = this.x;
				let y = this.y;
				let sx = this.sx;
				let sy = this.sy;

				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

				let gun;
				gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
				gun.extra = 1;

				//gun.sx = sx;
				//gun.sy = sy;
				sdEntity.entities.push( gun );

				}, 500 );
			}
			let r = Math.random();
			if ( r < 0.03 ) // 3% chance to drop Exalted core on task completion
			{
				let x = this.x;
				let y = this.y;
				let sx = this.sx;
				let sy = this.sy;

				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let random_value = Math.random();

					let gun;
					{
						gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_EXALTED_CORE });
					}

					gun.sx = sx;
					gun.sy = sy;
					sdEntity.entities.push( gun );

				}, 500 );
			}


			this.remove();
		}
		
	}
	
	get mass() { return 800; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{

		this.sy += sdWorld.gravity * GSPEED;

		if ( sdWorld.is_server )
		{
			if ( this._ent_to_nullify )
			{
				this._despawn_without_ent = true;
				if ( this._set_matter_to > 0 )
				if ( this._ent_to_nullify.matter > this._set_matter_to )
				this._ent_to_nullify.matter = sdWorld.MorphWithTimeScale( this._ent_to_nullify.matter, this._set_matter_to, 0.85, GSPEED );
			
				this._spawn_effect -= GSPEED;
				if ( this._spawn_effect <= 0 )
				{
						
					if ( this._ent_to_nullify.GetClass() === 'sdBeamProjector' ) // Just in case
					this._ent_to_nullify.enabled = false;
					
					this._spawn_effect = 120;
					this._ent_to_nullify.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PULSE_EFFECT, filter: 'hue-rotate(' + 195 + 'deg)' }); // Circular pulse appears on nullified object as an indicator it is nullified
				}
			}
			if ( !this._ent_to_nullify || this._ent_to_nullify._is_being_removed )
			{
				this._ent_to_nullify = null;
				if ( this._despawn_without_ent )
				{
					// Despawn entity and make players fail the task
					for ( let i = 0; i < sdTask.tasks.length; i++ )
					{
						let task = sdTask.tasks[ i ];
						if ( task._target === this ) // Make sure this is the target. Maybe it should check if the mission is "destroy entity", but nothing else uses this as a task target anyway.
						{
							task._difficulty = 0; // Just in case
							task._approached_target = false;
							task._approach_target_check_timer = 600;
							task._update_version++;
							task.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						}
					}
					// Teleport away
					sdSound.PlaySound({ name:'council_teleport', x:this.x, y:this.y, volume:0.5 });
					sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
					this.remove();
					this._broken = false;
				}
			}
				
			if ( this._glow_fade === 0 )
			{
				if ( this.glow_animation < 60 )
				this.glow_animation =  Math.min( this.glow_animation + GSPEED, 60 );
				else
				this._glow_fade = 1;
			}
			else
			{
				if ( this.glow_animation > 0 )
				this.glow_animation = Math.max( this.glow_animation - GSPEED, 0 );
				else
				this._glow_fade = 0;
			}
			
			this._notify_players_in -= GSPEED;
			if ( this._notify_players_in <= 0 && this._ent_to_nullify )
			{
				this._notify_players_in = 60;
				{
					for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
					{
						let desc;
						
						if ( this._ent_to_nullify.GetClass() === 'sdMothershipContainer' )
						desc = 'The Council is using a nullifier to siphon matter from our Mothership container! Stop them as fast as possible!';
						if ( this._ent_to_nullify.GetClass() === 'sdBeamProjector' )
						desc = 'The Council is using a nullifier to halt progress on our dark matter beam projector! We cannot waste any time, destroy it!';


						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'DESTROY-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_DESTROY_ENTITY,
							difficulty: 0.3 * sdTask.GetTaskDifficultyScaler(),
							title: 'Destroy Council nullifier',
							description: desc
						});
					}
				}
			}


			if ( this._spawn_timer > 0 )
			this._spawn_timer -= GSPEED;

			if ( this._spawn_timer <= 0 )
			if ( !sdWeather.only_instance._chill )
			{
				this._spawn_timer = 600; // Not too frequent spawns means players can focus on destroying the machine
				let ais = 0;
				//let percent = 0;
				for ( var i = 0; i < sdCharacter.characters.length; i++ )
				{
					if ( sdCharacter.characters[ i ].hea > 0 )
					if ( !sdCharacter.characters[ i ]._is_being_removed )
					if ( sdCharacter.characters[ i ]._ai_team === 3 )
					{
						ais++;
						//console.log( 'AI count:' + ais );
					}
				}
				{

					let councils = 0;
					let councils_tot = 1; // This is more of a drone focused objective

					while ( councils < councils_tot )
					{
						//let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
						//sdEntity.entities.push( character_entity );
						
						let character_entity = sdEntity.Create( sdCharacter, { x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE } );
						
						character_entity.s = 110;

						{
							let x,y;
							let tr = 100;
							do
							{
								x = this.x + 192 - ( Math.random() * 384 );

								if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
								x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

								if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
								x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );

								y = this.y + 192 - ( Math.random() * ( 384 ) );
								if ( y < sdWorld.world_bounds.y1 + 32 )
								y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( y > sdWorld.world_bounds.y2 - 32 )
								y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
								if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, character_entity, sdCom.com_visibility_ignored_classes, null ) )
								if ( sdArea.CheckPointDamageAllowed( x, y ) )
								if ( sdBaseShieldingUnit.IsMobSpawnAllowed( x, y ) )
								//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
								//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
								{
									character_entity.x = x;
									character_entity.y = y;

									sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_COUNCIL );

									character_entity._ai_stay_near_entity = this;
									character_entity._ai_stay_distance = 192;

									const logic = ()=>
									{
										if ( character_entity.hea <= 0 )
										if ( !character_entity._is_being_removed )
										{
											sdSound.PlaySound({ name:'council_teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
											character_entity.remove();
										}
							
										
									};
						
									setInterval( logic, 1000 );
									setTimeout(()=>
									{
										clearInterval( logic );
							
							
										if ( !character_entity._is_being_removed )
										{
											sdSound.PlaySound({ name:'council_teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
											character_entity.remove();

											character_entity._broken = false;
										}
									}, 20000 ); // Despawn the Council if they are in world longer than intended

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
					councils++;
					ais++;
					}
					// Spawn a Council drone
					{
						{
							let drone_type = ( this.hea > this.hmax / 2 ) ? sdDrone.DRONE_COUNCIL_ATTACK : sdDrone.DRONE_COUNCIL;
							//let drone = new sdDrone({ x:0, y:0 , _ai_team: 3, type: drone_type });
							//sdEntity.entities.push( drone );
							
							let drone = sdEntity.Create( sdDrone, { x:0, y:0 , _ai_team: 3, type: drone_type } );

							{
								let x,y;
								let tr = 100;
								do
								{
									x = this.x + 192 - ( Math.random() * 384 );

									if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

									if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );

									y = this.y + 192 - ( Math.random() * ( 384 ) );
									if ( y < sdWorld.world_bounds.y1 + 32 )
									y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

									if ( y > sdWorld.world_bounds.y2 - 32 )
									y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

									if ( drone.CanMoveWithoutOverlap( x, y, 0 ) )
									if ( sdArea.CheckPointDamageAllowed( x, y ) )
									if ( sdBaseShieldingUnit.IsMobSpawnAllowed( x, y ) )
									//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
									//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
									{
										drone.x = x;
										drone.y = y;

										sdSound.PlaySound({ name:'council_teleport', x:drone.x, y:drone.y, volume:0.5 });
										sdWorld.SendEffect({ x:drone.x, y:drone.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
										if ( drone.type === sdDrone.DRONE_COUNCIL )
										drone.SetTarget( this );

										sdWorld.UpdateHashPosition( drone, false );
										//console.log('Drone spawned!');
										break;
									}


									tr--;
									if ( tr < 0 )
									{
										drone.remove();
										drone._broken = false;
										break;
									}
								} while( true );
							}
						}
					}
				}
			}
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	get title()
	{
		return 'Council nullifier';
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title, 0, -24 );
		this.DrawHealthBar( ctx );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;

		//ctx.filter = this.filter;
		
         {
            ctx.drawImageFilterCache( sdCouncilNullifier.img_council_nullifier, 0, 0, 64, 64, - 32, - 32, 64, 64 );
            ctx.globalAlpha = Math.min( 1, this.glow_animation / 30 );
            ctx.filter = ' drop-shadow(0px 0px 4px #FFF000)';
            ctx.drawImageFilterCache( sdCouncilNullifier.img_council_nullifier, 64, 0, 64, 64, - 32, - 32, 64, 64 );
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
		sdCouncilNullifier.ents--;
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdCouncilNullifier.init_class();

export default sdCouncilNullifier;
