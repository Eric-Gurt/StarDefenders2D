
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
import sdRescueTeleport from './sdRescueTeleport.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
import sdTask from './sdTask.js';
import sdWeather from './sdWeather.js';
import sdRift from './sdRift.js';
import sdBlock from './sdBlock.js';
import sdSandWorm from './sdSandWorm.js';
import sdFactions from './sdFactions.js';

class sdCouncilMachine extends sdEntity
{
	static init_class()
	{
		sdCouncilMachine.img_council_pm = sdWorld.CreateImageFromFile( 'council_machine' ); // resprite by Flora

		sdCouncilMachine.ents_left = 0; // Entities left to spawn, determined when event rolls in sdWeather.
		sdCouncilMachine.ents = 0;
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -28; }
	get hitbox_x2() { return 28; }
	get hitbox_y1() { return -16; }
	get hitbox_y2() { return 36; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.hmax = 6000;
		this.hea = this.hmax;

		// Variables for Council portal machine
		this.glow_animation = 0; // Glow animation for the bomb
		this._glow_fade = 0; // Should the glow fade or not?
		this.detonation_in = params.detonation_in || 30 * 60 * 15; // 15 minutes until the bomb explodes
		this._rate = 120;
		this._spawn_timer = 60; // Spawn Council timer
		this._regen_timeout = 0; // Regen timeout;
		
		this._one_time_spawn = params.one_time_spawn || false; // For beam projector so the rewards are weaker since only one spawns
		
		this._ai_team = 3;

		if ( this._one_time_spawn === false )
		sdCouncilMachine.ents++;

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
			
		if ( Math.round( old_hea / ( this.hmax / 8 ) ) > Math.round( this.hea / ( this.hmax / 8 ) ) ) // Should spawn about 8 assault drones per machine
		{
			if ( initiator )
			if ( !sdWeather.only_instance._chill )
			{
				let drone = new sdDrone({ x:0, y:0 , type: 18});

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
		
		if ( this.hea <= 0 && was_alive )
		{
			let spawned_ent = false;
			if ( sdCouncilMachine.ents_left > 0 && this._one_time_spawn === false )
			{
				sdCouncilMachine.ents_left--;
				let instances = 0;
				let instances_tot = 1;

				if ( !sdWeather.only_instance._chill )
				while ( instances < instances_tot && sdCouncilMachine.ents < 2 ) // Spawn another council machine until last one
				{
					//let points = sdCouncilMachine.ents_left === 0 ? 0.25: 0;

					//let machine = new sdCouncilMachine({ x:0, y:0 });

					//sdEntity.entities.push( machine );
					
					let machine = [];
					
					sdWeather.SimpleSpawner({
						
						count: [ 1, 1 ],
						class: sdCouncilMachine,
						store_ents: machine,
						aerial: true,
						aerial_radius: 128
						
					})
					
					if ( machine.length > 0 ) // Spawned the machine?
					{
						spawned_ent = true;
						machine[ 0 ].detonation_in = this.detonation_in;
					}

					instances++;
				}


			}

			if ( spawned_ent === true )
			{
				for ( let i = 0; i < sdTask.tasks.length; i++ ) // All tasks related to this entity will set reward to 0 since it's not the last machine of the event.
				{
					let task = sdTask.tasks[ i ];
					if ( task._target === this ) // Make sure this is the target. Maybe it should check if the mission is "destroy entity", but nothing else uses this as a task target anyway.
					task._difficulty = 0;
				}
			}
			else // If it's the last one or it didn't spawn next one due to limited space or something, end the event and reward players
			{
				for ( let i = 0; i < sdTask.tasks.length; i++ ) // All tasks related to this entity will set reward to 0.25 since it's the last machine.
				{
					let task = sdTask.tasks[ i ];
					if ( task._target === this ) // Make sure this is the target. Maybe it should check if the mission is "destroy entity", but nothing else uses this as a task target anyway.
					{
						if ( this._one_time_spawn === false )
						task._difficulty = 0.40;
						else
						task._difficulty = 0.10; // Beam projector scenario
					}
				}

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
				if ( ( r < 0.03 && this._one_time_spawn === false ) || ( r < 0.005 && this._one_time_spawn ) ) // 3% chance to drop Exalted core on task completion (0.5% if from beam projector)
				{
					let x = this.x;
					let y = this.y;
					let sx = this.sx;
					let sy = this.sy;

					setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

						let random_value = Math.random();

						let gun;

						//if ( random_value < 0.45 )
						//gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
						//else
						{
							gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_EXALTED_CORE });
						}

						gun.sx = sx;
						gun.sy = sy;
						sdEntity.entities.push( gun );

					}, 500 );
				}
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
			let old = this.detonation_in;

			this.detonation_in -= GSPEED;

			let rate = 120;

			if ( this.detonation_in < 30 * 60 )
			rate = 30;
			else
			if ( this.detonation_in < 30 * 60 * 4 )
			rate = 60;
			else
			if ( this.detonation_in < 30 * 60 * 10 )
			rate = 120;

			this._rate = rate;

			if ( old % rate >= rate / 2 )
			if ( this.detonation_in % rate < rate / 2 )
			{
				// Beep
				//sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.25, pitch:2 });
				if ( this.detonation_in > 30 * 5 )
				{
					for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
					{
						let desc;
						if ( sdCouncilMachine.ents_left >= 2 )
						desc = 'Council plans to invade this planet. We detected a few of their portal machines, destroy them before it is too late!';
						else
						if ( sdCouncilMachine.ents_left !== 0 )
						desc = 'There is not many of them left, be quick now and destroy the remaining machines!';
						else
						desc = 'We located the last remaining Council portal machine. Get rid of it before they invade us, quickly!';
					
						if ( this._one_time_spawn === true )
						desc = 'The Council is attempting to invade near the dark matter beam projector. Destroy the device!';

						let diff = 0.001; // 0 sets it to 0.1 since it doesn't count as a parameter? It gets set to 0 when damaged enough before being destroyed if not the last one, just in case.
						
						if ( sdCouncilMachine.ents_left === 0 )
						diff = 0.3; // Only last machine counts towards task points when destroyed, so the task is 100% complete
					
						if ( this._one_time_spawn )
						diff = 0.2;

						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'DESTROY-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_DESTROY_ENTITY,
							difficulty: diff * sdTask.GetTaskDifficultyScaler(),
							time_left: ( this.detonation_in - 30 * 2 ),
							title: 'Destroy Council portal machine',
							description: desc
						});
					}
				}
			}

			if ( this.detonation_in <= 0 )
			{
				// Explosion
				
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:10, // run
					damage_scale: 2,
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this._owner,
					can_hit_owner: true,
					color:sdEffect.default_explosion_color
				});

				// Spawn Council portal as punishment

				setTimeout(()=>{//Just in case
					let portal = new sdRift({x: this.x, y:this.y, type:5 });
					sdEntity.entities.push( portal );
				}, 500 );

				this.remove();
			}

			if ( this._spawn_timer > 0 )
			this._spawn_timer -= GSPEED;

			if ( !sdWeather.only_instance._chill )
			if ( this._spawn_timer <= 0 )
			{
				this._spawn_timer = 600; // Not too frequent spawns means players can focus on destroying the portal machine
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
					let councils_tot = Math.min( 4, Math.max( 2, 1 + sdWorld.GetPlayingPlayersCount() ) );

					while ( councils < councils_tot )
					{

						let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

						sdEntity.entities.push( character_entity );
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
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
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
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
											character_entity.remove();

											character_entity._broken = false;
										}
									}, 20000 ); // Despawn the Council Vanquishers if they are in world longer than intended

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
					// Spawn a council support drone
					if ( this.hea < ( this.hmax * 0.75 ) )
					{
						if ( Math.random() < 0.8 ) // 80% it spawns a support healing Drone
						{
							let drone = new sdDrone({ x:0, y:0 , _ai_team: 3, type: 6});

							sdEntity.entities.push( drone );

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
									//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
									//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
									{
										drone.x = x;
										drone.y = y;

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
						else // Worm time
						{
							let worm = new sdSandWorm({ x:0, y:0 , kind:3, scale:0.5});

							sdEntity.entities.push( worm );

							{
								let x,y;
								let tr = 100;
								do
								{
									{
										x = this.x + 192 - ( Math.random() * 384 );

										if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
										x = sdWorld.world_bounds.x1 + 32 + 16 + 16 + ( Math.random() * 192 );

										if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
										x = sdWorld.world_bounds.x2 - 32 - 16 - 16 - ( Math.random() * 192 );
									}

									y = this.y + 192 - ( Math.random() * ( 384 ) );
									if ( y < sdWorld.world_bounds.y1 + 32 )
									y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

									if ( y > sdWorld.world_bounds.y2 - 32 )
									y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

									if ( worm.CanMoveWithoutOverlap( x, y, 0 ) )
									if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, worm, sdCom.com_visibility_ignored_classes, null ) )
									//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
									//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
									{
										worm.x = x;
										worm.y = y;

										sdSound.PlaySound({ name:'council_teleport', x:worm.x, y:worm.y, volume:0.5 });
										sdWorld.SendEffect({ x:worm.x, y:worm.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

										//worm.SetTarget( this );

										sdWorld.UpdateHashPosition( worm, false );
										//console.log('worm spawned!');
										break;
									}


									tr--;
									if ( tr < 0 )
									{
										worm.remove();
										worm._broken = false;
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
	
	DrawHUD( ctx, attached ) // foreground layer
	{

		{
			sdEntity.TooltipUntranslated( ctx, T("Council portal machine") + " (" + ~~( this.detonation_in / ( 30 * 60 ) ) + " minutes, "+  ~~ ~~( this.detonation_in % ( 30 * 60 ) / 30 ) + " seconds)", 0, -24 );
			this.DrawHealthBar( ctx );
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;

		//ctx.filter = this.filter;
		
         {
            ctx.drawImageFilterCache( sdCouncilMachine.img_council_pm, 0, 0, 64, 64, - 64, - 64, 128, 128 );
            ctx.globalAlpha = Math.min( 1, this.glow_animation / 30 );
            ctx.filter = ' drop-shadow(0px 0px 8px #FFF000)';
            ctx.drawImageFilterCache( sdCouncilMachine.img_council_pm, 64, 0, 64, 64, - 64, - 64, 128, 128 );
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
		if ( this._one_time_spawn === false )
		sdCouncilMachine.ents--;
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdCouncilMachine.init_class();

export default sdCouncilMachine;
