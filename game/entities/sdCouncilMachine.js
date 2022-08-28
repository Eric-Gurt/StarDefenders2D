
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

class sdCouncilMachine extends sdEntity
{
	static init_class()
	{
		sdCouncilMachine.img_council_pm = sdWorld.CreateImageFromFile( 'council_machine' );

		sdCouncilMachine.ents_left = 0; // Entities left to spawn, determined when event rolls in sdWeather.
		sdCouncilMachine.ents = 0;
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -19; }
	get hitbox_x2() { return 19; }
	get hitbox_y1() { return -19; }
	get hitbox_y2() { return 19; }
	
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
		
		if ( this.hea <= 0 && was_alive )
		{
			let spawned_ent = false;
			if ( sdCouncilMachine.ents_left > 0 )
			{
				sdCouncilMachine.ents_left--;
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdCouncilMachine.ents < 2 ) // Spawn another council machine until last one
				{
					let points = sdCouncilMachine.ents_left === 0 ? 0.25: 0;
					let council_mach = new sdCouncilMachine({ x:0, y:0, detonation_in:this.detonation_in });

					sdEntity.entities.push( council_mach );

					let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( council_mach.CanMoveWithoutOverlap( x, y - 32, 0 ) )
						if ( council_mach.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !council_mach.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + council_mach._hitbox_x1 - 16, 
								y + council_mach._hitbox_y1 - 16, 
								x + council_mach._hitbox_x2 + 16, 
								y + council_mach._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
									
							if ( di_allowed )
							{
								council_mach.x = x;
								council_mach.y = y;
								spawned_ent = true; // Successfully has space to spawn new machine, otherwise end the task and give reward points
								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							council_mach.remove();
							council_mach._broken = false;
							break;
						}
					} while( true );

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
					task._difficulty = 0.18;
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
						if ( sdCouncilMachine.ents_left >= 3 )
						desc = 'Council plans to invade this planet. We detected a few of their portal machines, destroy them before it is too late!';
						else
						if ( sdCouncilMachine.ents_left !== 0 )
						desc = 'There is not many of them left, be quick now and destroy the remaining machines!';
						else
						desc = 'We located the last remaining Council portal machine. Get rid of it before they invade us, quickly!';

						let diff = 0.001; // 0 sets it to 0.1 since it doesn't count as a parameter? It gets set to 0 when damaged enough before being destroyed if not the last one, just in case.
						if ( sdCouncilMachine.ents_left === 0 )
						diff = 0.18; // Only last machine counts towards task points when destroyed, so the task is 100% complete

						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'DESTROY-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_DESTROY_ENTITY,
							difficulty: diff,
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
					let councils_tot = Math.min( 6, Math.max( 2, 1 + sdWorld.GetPlayingPlayersCount() ) );

					let left_side = ( Math.random() < 0.5 );

					while ( councils < councils_tot && ais < Math.min( 6, Math.max( 3, sdWorld.GetPlayingPlayersCount() ) ) )
					{

						let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

						sdEntity.entities.push( character_entity );
						character_entity.s = 110;

						{
							let x,y;
							let tr = 1000;
							do
							{

								if ( left_side )
								{
									x = this.x + 16 + 16 * councils + ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * councils + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * councils - ( Math.random() * 192 );
								}
								else
								{
									x = this.x - 16 - 16 * councils - ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * councils + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * councils - ( Math.random() * 192 );
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

									//sdWorld.UpdateHashPosition( ent, false );
									if ( Math.random() > ( 0.1 + ( ( this.hea / this.hmax )* 0.4 ) ) ) // Chances change as the portal machine has less health
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_BURST_RAIL }) );
										character_entity._ai_gun_slot = 4;
									}
									else
									{
										sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_PISTOL }) );
										character_entity._ai_gun_slot = 1;
									}
									let robot_settings;
									//if ( character_entity._ai_gun_slot === 2 )
									robot_settings = {"hero_name":"Council Vanguard","color_bright":"#e1e100","color_dark":"#ffffff","color_bright3":"#ffff00","color_dark3":"#e1e1e1","color_visor":"#ffff00","color_suit":"#ffffff","color_suit2":"#e1e1e1","color_dark2":"#ffe100","color_shoes":"#e1e1e1","color_skin":"#ffffff","color_extra1":"#ffff00","helmet1":false,"helmet23":true,"body11":true,"legs8":true,"voice1":false,"voice2":false,"voice3":true,"voice4":false,"voice5":false,"voice6":false,"voice7":false,"voice8":true};

									character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( robot_settings );
									character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( robot_settings );
									character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( robot_settings );
									character_entity.title = robot_settings.hero_name;
									character_entity.body = sdWorld.ConvertPlayerDescriptionToBody( robot_settings );
									character_entity.legs = sdWorld.ConvertPlayerDescriptionToLegs( robot_settings );
									//if ( character_entity._ai_gun_slot === 4 || character_entity._ai_gun_slot === 1 )
									{
										character_entity.matter = 300;
										character_entity.matter_max = 300; // Let player leech matter off the bodies

										character_entity.hea = 250;
										character_entity.hmax = 250;

										character_entity.armor = 1500;
										character_entity.armor_max = 1500;
										character_entity._armor_absorb_perc = 0.87; // 87% damage absorption, since armor will run out before just a little before health

										//character_entity._damage_mult = 1; // Supposed to put up a challenge
									}
									character_entity._ai = { direction: ( x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
									//character_entity._ai_enabled = sdCharacter.AI_MODEL_AGGRESSIVE;
										
									character_entity._ai_level = 10;
										
									character_entity._matter_regeneration = 10 + character_entity._ai_level; // At least some ammo regen
									character_entity._jetpack_allowed = true; // Jetpack
									character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ) ; // Small recoil reduction based on AI level
									character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
									character_entity._ai_team = 3; // AI team 3 is for the Council
									character_entity._matter_regeneration_multiplier = 10; // Their matter regenerates 10 times faster than normal, unupgraded players
									sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
									character_entity._ai.next_action = 5;

									sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });

									const logic = ()=>
									{
										if ( character_entity.hea <= 0 )
										if ( !character_entity._is_being_removed )
										{
											sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
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
											sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
											character_entity.remove();

											character_entity._broken = false;
										}
									}, 30000 ); // Despawn the Council Vanquishers if they are in world longer than intended

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
				}
			}
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{

		{
			sdEntity.Tooltip( ctx, "Council portal maker (" + ~~( this.detonation_in / ( 30 * 60 ) ) + " minutes, "+  ~~ ~~( this.detonation_in % ( 30 * 60 ) / 30 ) + " seconds)", 0, -8 );
			this.DrawHealthBar( ctx );
		}
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		{
			ctx.drawImageFilterCache( sdCouncilMachine.img_council_pm, 0, 0, 64, 64, - 32, - 32, 64, 64 );
			ctx.globalAlpha = Math.min( 1, this.glow_animation / 30 );
			ctx.filter = ' drop-shadow(0px 0px 8px #FFF000)';
			ctx.drawImageFilterCache( sdCouncilMachine.img_council_pm, 64, 0, 64, 64, - 32, - 32, 64, 64 );
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
