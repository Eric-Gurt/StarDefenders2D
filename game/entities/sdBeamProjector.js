import sdShop from '../client/sdShop.js';
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdGun from './sdGun.js';
import sdTask from './sdTask.js';
import sdFactions from './sdFactions.js';
import sdDrone from './sdDrone.js';
import sdSandWorm from './sdSandWorm.js';
import sdJunk from './sdJunk.js';
import sdCouncilIncinerator from './sdCouncilIncinerator.js';
import sdCouncilMachine from './sdCouncilMachine.js';
import sdCouncilNullifier from './sdCouncilNullifier.js';
import sdWeather from './sdWeather.js';


import sdRenderer from '../client/sdRenderer.js';


class sdBeamProjector extends sdEntity
{
	static init_class()
	{
		sdBeamProjector.img_bp = sdWorld.CreateImageFromFile( 'sdBeamProjector2' );

		/*
		sdBeamProjector.img_bp = sdWorld.CreateImageFromFile( 'beam_projector' );
		sdBeamProjector.img_bp_working = sdWorld.CreateImageFromFile( 'beam_projector_working' );
		sdBeamProjector.img_bp_blocked = sdWorld.CreateImageFromFile( 'beam_projector_blocked' );
		*/
		sdBeamProjector.img_crystal = sdWorld.CreateImageFromFile( 'merger_core' );
		
		sdBeamProjector.projector_counter = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -29; }
	get hitbox_x2() { return 29; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 32; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			//this._update_version++;

			if ( this.hea <= 0 )
			{
				this.remove();
			}
			/*else
			{
				this._regen_timeout = 30 * 10;
			}*/
		}
	}
	constructor( params )
	{
		super( params );

		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 15000;
		this.hea = this.hmax;
		this._regen_timeout = 30;
		//this.has_anticrystal = false;
		this._spawn_event_timer = 30;
		
		this._last_event_entity = null; // Last Council structure that was spawned by the beam projector
		this._add_difficulty = false; // Add some difficulty to projector after destroying event entity?
		
		this._spawn_drones_timer = -1;
		this._drone_count = 0; // How much drones left to spawn?
		this._notify_players_in = 150; // Notify players about the task
		
		this.enabled = true; // Something will be able to disable it? Quite probably.
		
		this._ai_team = 0;
		
		this.progress = 0; // Task progress - needed for "Protect" task types
		
		this._nullifiers_to_spawn = 3;
		
		this._spawned_ai = false; // Spawn SD AI
		
		//this.matter_max = 5500;
		//this.matter = 100;
		
		this._ai_told_player = false; // Intro message from SD soldier to a player
		
		this._armor_protection_level = 0;
		
		sdBeamProjector.projector_counter++;
		//this._regen_mult = 1;
	}

	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdGun', 'sdBullet', 'sdCharacter' ];
	}*/

	/*onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
	}*/

	get mass() { return 300; } // Recommended to move with vehicles if blocked by something
	/*MeasureMatterCost()
	{
		//return 0; // Hack
		
		return 2000;
	}
	*/
	HasPlayersNearby(){
		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		{
			let character = sdWorld.sockets[ i ].character;
			if ( character )
			if ( sdWorld.Dist2D( character.x, character.y, this.x, this.y ) < 600 )
			return true;
		}
		return false;
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_last_event_entity' ) return true;

		return false;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );

		if ( !sdWorld.is_server )
		return;
	
		if ( !this._last_event_entity || this._last_event_entity._is_being_removed )
		{
			this._last_event_entity = null;
			this.enabled = true;
			if ( this._add_difficulty ) // Add difficulty? Only if event entity spawned and was destroyed.
			{
				this._add_difficulty = false;
				this._drone_count += 50; // 50 drones will spawn over time if a task event was destroyed
				this._spawn_drones_timer = 30;
				this._spawn_event_timer = 30 * 60 + Math.random() * 30 * 20; // Spawn next event in 60-80 seconds
				
				if ( this.progress >= 50 ) // 2nd phase? Spawn a mini Council worm aswell
				if ( !sdWeather.only_instance._chill )
				{
					let worm = new sdSandWorm({ x:0, y:0 , kind:3, scale:0.5 });

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
		
		if ( this._spawn_drones_timer > 0 )
		this._spawn_drones_timer = Math.max( 0, this._spawn_drones_timer - GSPEED );
		if ( this._spawn_drones_timer === 0 )
		{
			if ( this._drone_count <= 0 )
			this._spawn_drones_timer = -1; // Disable timer
			else // Spawn drones
			{
				// Doubt the drones will ever reach this count, but just in case of further changes. 
				if ( this._drone_count < 55 )
				this._spawn_drones_timer = 150 + ( Math.random() * 60 ); // Slow down since there's not much drones to spawn
				else
				if ( this._drone_count < 85 )
				this._spawn_drones_timer = 90 + ( Math.random() * 45 ); // Average speed
				else
				if ( this._drone_count < 105 )
				this._spawn_drones_timer = 60 + ( Math.random() * 30 ); // Faster
				else
				this._spawn_drones_timer = 30 + ( Math.random() * 15 ); // Fastest
			
				if ( this.HasPlayersNearby() ) // Only when players are near the projector
				if ( !sdWeather.only_instance._chill )
				{
					let drone = new sdDrone({ x:0, y:0 , type: 18 });

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
						//if ( !mech_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) )
						{
							drone.x = x;
							drone.y = y;
							
							drone._look_x = x + 0.5 - Math.random();
							drone._look_y = y + 0.5 - Math.random();

							sdSound.PlaySound({ name:'council_teleport', x:drone.x, y:drone.y, volume:0.5 });
							sdWorld.SendEffect({ x:drone.x, y:drone.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

							//if ( ( initiator._ai_team || -1 ) !== this._ai_team )
							// Target the beam projector sometimes
							if ( Math.random() < 0.25 )
							drone.SetTarget( this );
						
							drone._attack_timer = 10;

							sdWorld.UpdateHashPosition( drone, false );
							
							this._drone_count--;
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

		if ( this.progress >= 100.1 ) // Remove it after players recieved their rewards
		{
			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius:90, // 80 was too much?
				damage_scale: 0.01, // 5 was too deadly on relatively far range
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this,
				color:'#000000' 
			});

			let x = this.x;
			let y = this.y;
			//let sx = this.sx;
			//let sy = this.sy;

			setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

			let gun;
			gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
			gun.extra = 1;

			//gun.sx = sx;
			//gun.sy = sy;
			sdEntity.entities.push( gun );
			
			gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_UNSTABLE_CORE });

			//gun.sx = sx;
			//gun.sy = sy;
			sdEntity.entities.push( gun );

			}, 500 );

			this.remove();
		}

		if ( this._spawn_event_timer > 0 )
		this._spawn_event_timer -= GSPEED;
		else
		{
			this._spawn_event_timer = 30 * 60 * 8 + ( Math.random() * 30 * 60 * 4 ); // 8-12 minutes per event
			let event_type = Math.floor( Math.random() * 4 );
			let ents = 0;
			let ents_tot = 1;
			let spawned_event = false;

			while ( ents < ents_tot )
			{
				let ent;
				
				// Event type 0 is Council Nullifier, which spawns in the distance rather than next to the beam projector.
				
				if ( event_type === 1 ) // Council bomb?
				ent = new sdJunk({ x:0, y:0, type: sdJunk.TYPE_COUNCIL_BOMB });
				
				if ( event_type === 2 ) // Council incinerator?
				ent = new sdCouncilIncinerator({ x:0, y:0 });
				
				if ( event_type >= 3 ) // Council portal machine?
				ent = new sdCouncilMachine({ x:0, y:0, one_time_spawn: true, detonation_in: 30 * 60 * 3 });
				

				if ( event_type !== 0 ) // Not a Council Nullifier?
					{
						sdEntity.entities.push( ent );
						let x,y;
						let tr = 100;
						do
						{
							x = this.x + 96 + ( 100 - tr ) - ( Math.random() * ( 292 - tr ) ); // Potential spawn radius scales over attempts

							if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
							x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

							if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
							x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );

							y = this.y + 96 + ( 100 - tr ) - ( Math.random() * ( 292 - tr ) );
							if ( y < sdWorld.world_bounds.y1 + 32 )
							y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

							if ( y > sdWorld.world_bounds.y2 - 32 )
							y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

							if ( ent.CanMoveWithoutOverlap( x, y, 1 ) )
							if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, this, sdCom.com_visibility_ignored_classes, null ) )
							{
								ent.x = x;
								ent.y = y;
								this._last_event_entity = ent;
								this._add_difficulty = true;
								spawned_event = true;
								sdSound.PlaySound({ name:'council_teleport', x:ent.x, y:ent.y, volume:0.5 });
								sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
								break;
							}

							tr--;
							if ( tr < 0 )
							{
								ent.remove();
								ent._broken = false;
								spawned_event = false;
								break;
							}
						} while( true );
					}
				ents++;
			}
			if ( !spawned_event || event_type === 0 ) // Didn't spawn one of the regular events (or event_type is 0)? Spawn a nullifier to halt progress instead
			{
				let nullifier = [];

				if ( this._nullifiers_to_spawn > 0 )
				sdWeather.SimpleSpawner({
					count: [ 1, 1 ],
					class: sdCouncilNullifier,
					store_ents: nullifier,
					aerial: true,
					aerial_radius: 128
				});
			
				if ( nullifier.length !== 0 ) // Spawned succesfully?
				{
					this._nullifiers_to_spawn--;
					
					nullifier[ 0 ]._ent_to_nullify = this;
					this._last_event_entity = nullifier[ 0 ]; // Set as event entity
					this.enabled = false; // And disable itself until it nullifier is destroyed
					this._add_difficulty = true;
					sdSound.PlaySound({ name:'council_teleport', x:nullifier[ 0 ].x, y:nullifier[ 0 ].y, volume:0.5 });
					sdWorld.SendEffect({ x:nullifier[ 0 ].x, y:nullifier[ 0 ].y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
				}
				else // Try again in a minute
				this._spawn_event_timer = 30 * 60 + Math.random() * 30 * 20; // Spawn next event in 60-80 seconds
					
			}
		}
		
		if ( !this._spawned_ai ) // Spawn random SD soldier which will stand near the beam projector
		{
			let sd_soldiers = 0;
			let sd_soldiers_tot = 2;

			let left_side = ( Math.random() < 0.5 );

			if ( !sdWeather.only_instance._chill )
			while ( sd_soldiers < sd_soldiers_tot )
			{

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });

				sdEntity.entities.push( character_entity );
				{
					let x,y;
					let tr = 100;
					do
					{
						if ( left_side )
						{
							x = this.x + 16 + 16 * sd_soldiers + ( Math.random() * 192 );

							if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
							x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * sd_soldiers + ( Math.random() * 192 );

							if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
							x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * sd_soldiers - ( Math.random() * 192 );
						}
						else
						{
							x = this.x - 16 - 16 * sd_soldiers - ( Math.random() * 192 );

							if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
							x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * sd_soldiers + ( Math.random() * 192 );

							if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
							x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * sd_soldiers - ( Math.random() * 192 );
						}

						y = this.y + 192 - ( Math.random() * ( 384 ) );
						if ( y < sdWorld.world_bounds.y1 + 32 )
						y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

						if ( y > sdWorld.world_bounds.y2 - 32 )
						y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

						if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, character_entity, sdCom.com_visibility_ignored_classes, null ) )
						{
							character_entity.x = x;
							character_entity.y = y;

							sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_STAR_DEFENDERS );
							character_entity._ai_stay_near_entity = this;
							character_entity._ai_stay_distance = 64;
									
							sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
							sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT });

							const logic = ()=>
							{
								if ( character_entity.hea <= 0 )
								if ( !character_entity._is_being_removed )
								{
									sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
									sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT });
									character_entity.remove();
								}

								if ( character_entity._is_being_removed )
								clearInterval( logic, 1000 );
							
							};
									
							setInterval( logic, 1000 );
									
									
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
					sd_soldiers++;
					this._spawned_ai = true;
			}
		}

		if ( this.enabled )
		{
			this.progress = Math.min( 101, this.progress + ( GSPEED / ( 3 * 6 * 20 ) ) ); // About 20 minutes to complete if it survives
			// GSPEED = 30 per second. / 3 = 10 per second, / 6 = 100/60 -> / 20 = 100 / 1200 ( I think ) - Booraz
			
			
			this._regen_timeout -= GSPEED;
			if ( this._regen_timeout < 0 )
			this._regen_timeout += 40;
			{
				if ( this._regen_timeout <= 30 )
				if ( Math.round( this._regen_timeout % 10 ) === 0 )
				{
					//if ( sdWorld.CheckLineOfSight( this.x, this.y - 16, this.x, sdWorld.world_bounds.y1, this, sdCom.com_visibility_ignored_classes, null ) || sdWorld.last_hit_entity === null )
					if ( sdWeather.only_instance.TraceDamagePossibleHere( this.x, this.y - 16 ) )
					{
						sdWorld.SendEffect({ x: this.x, y:this.y - 27, x2:this.x , y2:sdWorld.world_bounds.y1, type:sdEffect.TYPE_BEAM, color:'#333333' });
					}
					else
					{
						if ( sdWorld.last_hit_entity )
						sdWorld.SendEffect({ x: this.x, y:this.y - 27, x2:this.x , y2:sdWorld.last_hit_entity.y, type:sdEffect.TYPE_BEAM, color:'#333333' });
					}
					if ( this.hea < this.hmax )
					this.hea = Math.min( this.hmax, this.hea + 1 ); // About 3 HP per second, since it regenerates only when beams are sent
				}
			}
		}
		if ( this._notify_players_in < 0 )
		{
			this._notify_players_in = 150;
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			if ( sdWorld.sockets[ i ].character && this.progress < 100 )
			{
				let desc = 'Protect the dark matter beam projector so it can try to shrink parts of the expanding black hole! Watch out for the Council!';
				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'PROTECT-'+this._net_id, 
					executer: sdWorld.sockets[ i ].character,
					target: this,
					mission: sdTask.MISSION_PROTECT_ENTITY,				
					title: 'Protect dark matter beam projector',
					description: desc,
					difficulty: 1
				});
			}
			if ( !this._ai_told_player )
			{
				let players = sdWorld.GetAnythingNear( this.x, this.y, 128, null, [ 'sdCharacter', 'sdPlayerDrone' ] );
				for ( let i = 0; i < players.length; i++ )
				{
					if ( players[ i ]._ai && players[ i ]._ai_team === 0 && !this._ai_told_player ) // Is detected entity friendly AI?
					{
						this._ai_told_player = true;
						let potential_dialogue = sdWorld.AnyOf( [ 
							'Hope this thing does not malfunction...',
							'If we\'re really doing this, we need to make sure it has clear path to the sky.',
							'Hey, can you help me out with this thing? We might need backup soon.',
							'We have to be careful, the Council is onto us because of these devices.',
							'This device? Sends dark matter into the sky. We need to shrink the ever-expanding black hole!',
							'I would advise placing some turrets to provide cover for this thing.'
						] );
						players[ i ].Say( potential_dialogue, false, false, false );
						
						break;
					}
				}
			}
		}
		else
		this._notify_players_in -= GSPEED;
	}
	onMovementInRange( from_entity )
	{
		
	}
	get title()
	{
		return 'Dark matter beam projector';
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		
		if ( this.enabled )
		xx = 1;
		else
		xx = 2;
	
		ctx.drawImageFilterCache( sdBeamProjector.img_bp, xx * 64, 0, 64,64, -32, -32, 64, 64 );

		ctx.globalAlpha = 1;
		ctx.filter = sdWorld.GetCrystalHue( sdCrystal.anticrystal_value );
		//ctx.filter += ' saturate(' + (Math.round(( 2 )*10)/10) + ') brightness(' + 1 + ')';

		//if ( this.has_anticrystal )
		ctx.drawImageFilterCache( sdBeamProjector.img_crystal, -16, -44, 32, 32 );


		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( !this.has_anticrystal )
		//sdEntity.Tooltip( ctx, "Dark matter beam projector (needs natural Anti-crystal) ", 0, -10 );
		//else
		//if ( this.has_players_nearby && this.no_obstacles )
		sdEntity.Tooltip( ctx, "Dark matter beam projector", 0, -10 );
		//else
		//sdEntity.Tooltip( ctx, "Dark matter beam projector (disabled)", 0, -10 );

		let w = 40;
		//if ( this.has_anticrystal )
		{
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 32, w, 3 );

			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - 32, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		}
		
		if ( this.progress < 100 )
		{
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 28, w, 3 );
			
			ctx.fillStyle = '#aabbff';
			ctx.fillRect( 1 - w / 2, 1 - 28, ( w - 2 ) * Math.max( 0, this.progress / 100 ), 1 );
		}
	}
	
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
		//sdBeamProjector.projector_counter--; // Put in onRemoveAsFakeEntity() otherwise spawning it as admin will prevent it from spawning as event
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	}
	onRemoveAsFakeEntity()
	{
		sdBeamProjector.projector_counter--;
	}
}
//sdBeamProjector.init_class();

export default sdBeamProjector;
