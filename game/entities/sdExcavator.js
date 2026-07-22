import sdShop from '../client/sdShop.js';
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdTask from './sdTask.js';
import sdBullet from './sdBullet.js';
import sdWeather from './sdWeather.js';
import sdGib from './sdGib.js';
import sdGun from './sdGun.js';
import sdLost from './sdLost.js';
import sdSandWorm from './sdSandWorm.js';
import sdJunk from './sdJunk.js';
import sdBomb from './sdBomb.js';
import sdBarrel from './sdBarrel.js';
import sdDrone from './sdDrone.js';
import sdRenderer from '../client/sdRenderer.js';

/*
	Excavator is an entity which digs below it as long as it's powered.
	Occasionally the Mothership will send an excavator to the planet
	and SD's will need to start it up. The excavator only has power to run for 2 minutes
	but players can power it up with Cube shards and Erthal energy cells so it can last longer (1 minute per shard).
	They can also repair it with metal shards should it lose health.
	
	The excavator eats crystals, gains matter like green BSU does.
	After it's excavation process is done - it spits out an unique crystal which always glows white.
	The matter of that crystal depends on how much crystals/matter the excavator ate, up to it's matter_max value.
*/


class sdExcavator extends sdEntity
{
	static init_class()
	{
		sdExcavator.img_excavator = sdWorld.CreateImageFromFile( 'sdExcavator' );

		sdExcavator.TYPE_LARGE = 0;
		sdExcavator.TYPE_SMALL = 1;
		sdExcavator.TYPE_COUNCIL = 2; // Council "excavator" tasks which need to destroy these
		
		sdExcavator.council_excavators = [];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === sdExcavator.TYPE_LARGE ? -23.5 : this.type === sdExcavator.TYPE_SMALL ? -15 : -12; }
	get hitbox_x2() { return this.type === sdExcavator.TYPE_LARGE ? 23.5 : this.type === sdExcavator.TYPE_SMALL ? 15 : 12; }
	get hitbox_y1() { return this.type === sdExcavator.TYPE_LARGE ? -18 : this.type === sdExcavator.TYPE_SMALL ? -18 : -15; }
	get hitbox_y2() { return 16; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.type !== sdExcavator.TYPE_COUNCIL )
		dmg = Math.min( 100, Math.abs( dmg ) ); // Capping damage it can take in a single hit so it is less prone to one shots
		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			let old_hea = this.hea + dmg;
			
			if ( this.type === sdExcavator.TYPE_COUNCIL )
			{
				// Council excavators still have drone support
				if ( Math.round( old_hea / ( this.hmax / 5 ) ) > Math.round( this.hea / ( this.hmax / 5 ) ) ) // Should spawn about 5 assault drones per machine
				{
					if ( initiator )
					if ( !sdWeather.only_instance._chill )
					{
						let drone = new sdDrone({ x:0, y:0 , type: sdDrone.DRONE_COUNCIL_ATTACK });

						sdEntity.AddEntityToEntitiesArray( drone );
										
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

						sdEntity.AddEntityToEntitiesArray( drone );
										
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
			}
			//this._update_version++;
			if ( this.hea <= 0 && old_hea > 0 && this.type === sdExcavator.TYPE_COUNCIL )
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
					sdEntity.AddEntityToEntitiesArray( gun );

					}, 500 );
				}
				let r = Math.random();
				if ( r < 0.03 && sdExcavator.council_excavators.length < 2 ) // 3% chance to drop Exalted core on last excavator
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
						sdEntity.AddEntityToEntitiesArray( gun );

					}, 500 );
				}


				this.remove();
			}
			if ( this.hea <= 0 )
			{
				this.remove();
			}
		}
	}
	constructor( params )
	{
		super( params );

		this.sx = 0;
		this.sy = 0;
		
		this.type = params.type || sdExcavator.TYPE_LARGE;
		
		this.hmax = this.type === sdExcavator.TYPE_LARGE ? 10000 : this.type === sdExcavator.TYPE_SMALL ? 6000 : 7000;
		this.hea = this.hmax;
		this._check_for_players = 30;
		this._next_dig_in = 30;
		this.activated = false; // Startup of the excavation process.
		
		
		this.image = 0; // Which sprite should it display?
		
		this._ai_team = this.type === sdExcavator.TYPE_COUNCIL ? 3 : 0;
		
		//this._event_to_spawn = sdWeather.only_instance._potential_invasion_events[ Math.floor( Math.random() * sdWeather.only_instance._potential_invasion_events.length ) ] || -1; // Random event which are usually invasions is selected.
		
		this.crystal_matter = 0;
		this.crystal_matter_max = 5120 * 8; // 40k is max value the excavator can digest and convert
		
		this.time_left = this.type === sdExcavator.TYPE_COUNCIL ? 30 * 60 * 4 : 30 * 60 * 2; // Default excavation time is 2 minutes (4 for Council since it's task )
		
		this.SetMethod( 'CollisionFiltering', this.CollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
		if ( this.type === sdExcavator.TYPE_COUNCIL )
		sdExcavator.council_excavators.push( this );
	
		this._extended_time = false; // For Council excavators
		//this._regen_mult = 1;
	}

	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdGun.as_class_list;
	}
	
	CollisionFiltering( from_entity )
	{
		if ( from_entity._is_bg_entity !== this._is_bg_entity || !from_entity._hard_collision )
		return false;
		
		if ( from_entity.is( sdSandWorm ) ) // Worm?
		{
			if ( from_entity.death_anim === 1 ) // Dead worm?
			return false; // Pass through
		}
		
		return true;
	}

	/*onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
	}*/

	get mass() { return this.type === sdExcavator.TYPE_LARGE ? 350 : 180; } // Recommended to move with vehicles if blocked by something
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, this.CollisionFiltering );

		if ( !sdWorld.is_server )
		return;
		
		if ( this.type === sdExcavator.TYPE_LARGE || this.type === sdExcavator.TYPE_COUNCIL ) // Large/Council excavators are spawned randomly - thus should show up as tasks
		{
			if ( this._check_for_players > 0 )
			{
				this._check_for_players -= GSPEED;
			}
			else
			{
				this._check_for_players = 150; // So it doesn't spam GetAnythingNear
				
				if ( this.type === sdExcavator.TYPE_LARGE )
				{
					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].character )
					{
						let desc = 'We placed an excavator nearby and we need you to start it up.';
						let exc_title = 'Power up the excavator';
						if ( this.activated )
						{
							desc = 'Keep the excavator powered so the mining potential can be maximized. You can power it with Cube shards and Erthal energy cells, while you can use metal shards to repair it.';
							exc_title = 'Keep the excavator powered';
						}
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'PROTECT-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_TRACK_ENTITY,				
							title: exc_title,
							description: desc,
						});
					}
				}
				if ( this.type === sdExcavator.TYPE_COUNCIL )
				{
					this.activated = true;
					if ( this._extended_time === false )
					{
						this.time_left = ( 30 * 60 * 4 * ( 1 + sdExcavator.council_excavators.length ) ); // Extend excavator durations by their count, 4 min per excavator
						this._extended_time = true;
					}
					// Similarity hash stops each excavator from creating the task
					let excavator_net_ids = [];
					for ( let i = 0; i < sdExcavator.council_excavators.length; i++ )
					{
						excavator_net_ids.push( sdExcavator.council_excavators[ i ]._net_id );
						// Tasks with multiple destroy objectives take arrays of net_id then fetch entities inside later.
					}
					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].character && this.time_left > 30 * 10 )
					{
						sdTask.MakeSureCharacterHasTask({
								similarity_hash:'DESTROYALL-COUNCILEXCAVATORS', 
								executer: sdWorld.sockets[ i ].character,
								all_targets: excavator_net_ids,
								mission: sdTask.MISSION_DESTROY_ALL_ENTITIES,
								difficulty: 0.3, // 30% per excavator (updated in onMade inside sdTask I believe)
								time_left: this.time_left - ( 30 * 5 ),
								title: 'Disrupt Council excavation operations',
								description: 'The Council wants to excavate resources and artifacts on this planet. Destroy their excavators, the resources are crucial for our survival!'
							});
					}
					
				}
			
				/*if ( !this.activated )
				{
					let players = sdWorld.GetAnythingNear( this.x, this.y, 192, null, [ 'sdCharacter', 'sdPlayerDrone' ] );
					for ( let i = 0; i < players.length; i++ )
					{
						if ( players[ i ].IsPlayerClass() && !players[ i ]._ai && players[ i ]._ai_team === 0  && players[ i ].hea > 0 )
						if ( players[ i ]._socket !== null )
						{
							if ( sdWorld.CheckLineOfSight( this.x, this.y - 16, players[ i ].x, players[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) ) // Needs line of sight with players, otherwise it doesn't work
							{
								this.activated = true;
								sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:0.5, pitch:4 });
							}
						}
					}
				}*/
				// On SD excavators, activation is now done via right click.
			}
		}
		if ( this.activated )
		{
			this.time_left -= GSPEED;
			
			if ( this.time_left <= 0 || this.crystal_matter === this.crystal_matter_max ) // Finished excavation?
			{
				// Drop the Excavator Quartz which has the matter value of dug up crystals
				let crystal = new sdCrystal({ x: this.x, y: this.y, type: sdCrystal.TYPE_EXCAVATOR_QUARTZ });
				crystal.matter_max = Math.max( 40, this.crystal_matter );
				crystal.matter = this.crystal_matter;
				
				sdEntity.AddEntityToEntitiesArray( crystal );
				
				// Make the excavator disappear
				this.remove();
				//this._broken = false;
			}
			
			if ( this.type === sdExcavator.TYPE_LARGE || this.type === sdExcavator.TYPE_SMALL )
			this.image += GSPEED;
			
			if ( this.image > 16 )
			this.image -= 16;
		
			this._next_dig_in -= GSPEED;
			
			if ( this._next_dig_in <= 10 && this.type === sdExcavator.TYPE_COUNCIL )
			{
				this.image = 0;
				if ( this._next_dig_in <= 3 ) // Maybe expand just slightly before the attack?
				this.image = 15;
			}
			
			if ( this._next_dig_in <= 0 ) // Mining
			{
				if ( this.type === sdExcavator.TYPE_LARGE ) // Large excavator - 6 drills
				{
					this._next_dig_in = 9;
					
					this.PhysWakeUp();
					//if ( this.sy < 0.1 && this.sy > -0.1 )
					//this.sy += 0.1; // Hopefully prevents it from freezing in place in air
					
					
					let bullet_obj = new sdBullet({ x: this.x - 18, y: this.y -8, time_left: 2 }); // Left

					bullet_obj._owner = this;
					bullet_obj.sx = 0;
					bullet_obj.sy = 1;
					bullet_obj.color = 'transparent';
					bullet_obj._damage = 100;
					bullet_obj._dirt_mult = 3;
					bullet_obj._rail = true;
					
					bullet_obj._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							{
								bullet._damage = bullet._damage / 4; // Less damage for smaller crystals
								if ( bullet._owner )
								bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
							}
						}
					};
					
					sdEntity.AddEntityToEntitiesArray( bullet_obj );
					
					let bullet_obj2 = new sdBullet({ x: this.x + 18, y: this.y - 8, time_left: 2 }); // Right

					bullet_obj2._owner = this;
					bullet_obj2.sx = 0;
					bullet_obj2.sy = 1;
					bullet_obj2.color = 'transparent';
					bullet_obj2._damage = 100;
					bullet_obj2._dirt_mult = 3;
					bullet_obj2._rail = true;
					
					bullet_obj2._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							bullet._damage = bullet._damage / 4;
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							if ( bullet._owner )
							bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
						}
					};
					
					sdEntity.AddEntityToEntitiesArray( bullet_obj2 );
					// Center left excavating point
					let bullet_obj3 = new sdBullet({ x: this.x - 4, y: this.y - 8, time_left: 2 }); // Center left

					bullet_obj3._owner = this;
					bullet_obj3.sx = 0;
					bullet_obj3.sy = 1;
					bullet_obj3.color = 'transparent';
					bullet_obj3._damage = 100;
					bullet_obj3._dirt_mult = 3;
					bullet_obj3._rail = true;
					
					bullet_obj3._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							bullet._damage = bullet._damage / 4;
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							if ( bullet._owner )
							bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
						}
					};
					
					sdEntity.AddEntityToEntitiesArray( bullet_obj3 );
					// Center right excavating point
					let bullet_obj4 = new sdBullet({ x: this.x + 4, y: this.y - 8, time_left: 2 }); // Center right

					bullet_obj4._owner = this;
					bullet_obj4.sx = 0;
					bullet_obj4.sy = 1;
					bullet_obj4.color = 'transparent';
					bullet_obj4._damage = 100;
					bullet_obj4._dirt_mult = 3;
					bullet_obj4._rail = true;
					
					bullet_obj4._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							bullet._damage = bullet._damage / 4;
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							if ( bullet._owner )
							bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
						}
					};
					
					sdEntity.AddEntityToEntitiesArray( bullet_obj4 );
					// Middle left excavating point
					let bullet_obj5 = new sdBullet({ x: this.x - 11, y: this.y -8, time_left: 2 }); // Left

					bullet_obj5._owner = this;
					bullet_obj5.sx = 0;
					bullet_obj5.sy = 1;
					bullet_obj5.color = 'transparent';
					bullet_obj5._damage = 100;
					bullet_obj5._dirt_mult = 3;
					bullet_obj5._rail = true;
					
					bullet_obj5._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							{
								bullet._damage = bullet._damage / 4; // Less damage for smaller crystals
								if ( bullet._owner )
								bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
							}
						}
					};
					sdEntity.AddEntityToEntitiesArray( bullet_obj5 );
					// Middle right excavating point
					let bullet_obj6 = new sdBullet({ x: this.x + 11, y: this.y -8, time_left: 2 }); // Right

					bullet_obj6._owner = this;
					bullet_obj6.sx = 0;
					bullet_obj6.sy = 1;
					bullet_obj6.color = 'transparent';
					bullet_obj6._damage = 100;
					bullet_obj6._dirt_mult = 3;
					bullet_obj6._rail = true;
					
					bullet_obj6._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							{
								bullet._damage = bullet._damage / 4; // Less damage for smaller crystals
								if ( bullet._owner )
								bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
							}
						}
					};
					sdEntity.AddEntityToEntitiesArray( bullet_obj6 );
				}
				if ( this.type === sdExcavator.TYPE_SMALL ) // Small excavator - 3 drills
				{
					this._next_dig_in = 9;
					
					this.PhysWakeUp();
					//if ( this.sy < 0.1 && this.sy > -0.1 )
					//this.sy += 0.1; // Hopefully prevents it from freezing in place in air
					
					
					let bullet_obj = new sdBullet({ x: this.x - 8, y: this.y -8, time_left: 2 }); // Left

					bullet_obj._owner = this;
					bullet_obj.sx = 0;
					bullet_obj.sy = 1;
					bullet_obj.color = 'transparent';
					bullet_obj._damage = 100;
					bullet_obj._dirt_mult = 3;
					bullet_obj._rail = true;
					
					bullet_obj._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							{
								bullet._damage = bullet._damage / 4; // Less damage for smaller crystals
								if ( bullet._owner )
								bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
							}
						}
					};
					
					sdEntity.AddEntityToEntitiesArray( bullet_obj );
					
					let bullet_obj2 = new sdBullet({ x: this.x + 8, y: this.y - 8, time_left: 2 }); // Right

					bullet_obj2._owner = this;
					bullet_obj2.sx = 0;
					bullet_obj2.sy = 1;
					bullet_obj2.color = 'transparent';
					bullet_obj2._damage = 100;
					bullet_obj2._dirt_mult = 3;
					bullet_obj2._rail = true;
					
					bullet_obj2._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							bullet._damage = bullet._damage / 4;
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							if ( bullet._owner )
							bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
						}
					};
					
					sdEntity.AddEntityToEntitiesArray( bullet_obj2 );
					// Center excavating point
					let bullet_obj3 = new sdBullet({ x: this.x, y: this.y - 8, time_left: 2 }); // Center

					bullet_obj3._owner = this;
					bullet_obj3.sx = 0;
					bullet_obj3.sy = 1;
					bullet_obj3.color = 'transparent';
					bullet_obj3._damage = 100;
					bullet_obj3._dirt_mult = 3;
					bullet_obj3._rail = true;
					
					bullet_obj3._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
					{
						if ( target_entity.is( sdCrystal ) )
						{
							bullet._damage = bullet._damage / 4;
							if ( target_entity.is_big )
							target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
							else
							if ( bullet._owner )
							bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
						}
					};
					
					sdEntity.AddEntityToEntitiesArray( bullet_obj3 );
				}
				if ( this.type === sdExcavator.TYPE_COUNCIL )
				{
					// Area of effect radius attack. Steals stuff like crystals and junk.
					this.image = 15;
					this._next_dig_in = 18;
					this.PhysWakeUp();
					let nears = null;
					if ( !nears )
					{
						nears = sdWorld.GetAnythingNearWithLOS( this.x, this.y, 48 );
					}
				
					//let damaged_ents_set = new Set();
					
					for ( let i = 0; i < nears.length; i++ )
					{
						let ent = nears[ i ];
						
						if ( ent && ent !== this && !ent._is_being_removed )
						if ( ent.IsTargetable( this ) )
						if ( ent._is_bg_entity === this._is_bg_entity )
						{
							if ( ent.is( sdCrystal ) || ent.is( sdJunk ) || ent.is( sdBomb ) || ent.is( sdBarrel ) ) // These are stolen by the excavator
							{
								if ( !ent.is( sdJunk ) )
								{
									sdSound.PlaySound({ name:'council_teleport', x:ent.x, y:ent.y, volume:0.5 });
									sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
									sdCrystal.ZapLine( this.x, this.y + 7, ent.x + ( ent.hitbox_x1 + ent.hitbox_x2 ) / 2 , ent.y + ( ent.hitbox_y1 + ent.hitbox_y2 ) / 2, '#00ffff' );
									ent.remove();
									ent._broken = false;
								}
								else
								if ( ( Math.abs( ent._hitbox_x1 ) + Math.abs( ent._hitbox_x2 ) + Math.abs( ent._hitbox_y1 ) + Math.abs( ent._hitbox_y2 ) ) < 80 ) // Small enough in terms of hitbox sizes?
								{
									sdSound.PlaySound({ name:'council_teleport', x:ent.x, y:ent.y, volume:0.5 });
									sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });
									sdCrystal.ZapLine( this.x, this.y + 7, ent.x + ( ent.hitbox_x1 + ent.hitbox_x2 ) / 2 , ent.y + ( ent.hitbox_y1 + ent.hitbox_y2 ) / 2, '#00ffff' );
									ent.remove();
									ent._broken = false;
								}	
							}
							else
							if ( typeof ent._ai_team === "undefined" ) // No ai team?
							{
								let dmg = 50;
								if ( ent.is( sdBlock ) )
								{
									if ( ent._natural )
									dmg = 150;
									else
									dmg = 25;
									
								}
								ent.DamageWithEffect( dmg, this ); // Damage
								sdCrystal.ZapLine( this.x, this.y - 6, ent.x + ( ent.hitbox_x1 + ent.hitbox_x2 ) / 2 , ent.y + ( ent.hitbox_y1 + ent.hitbox_y2 ) / 2, '#ffff00' );
							}
							else
							if ( ent._ai_team !== 3 ) // Not council faction?
							{
								let dmg = ent.is( sdBlock ) ? 150 : 50;
								ent.DamageWithEffect( dmg, this ); // Damage
								sdCrystal.ZapLine( this.x, this.y - 6, ent.x + ( ent.hitbox_x1 + ent.hitbox_x2 ) / 2 , ent.y + ( ent.hitbox_y1 + ent.hitbox_y2 ) / 2, '#ffff00' );
							}
						}
					}
				}
			}
		}
	}
	onMovementInRange( from_entity )
	{
		if ( this.type === sdExcavator.TYPE_COUNCIL )
		return;
	
		if ( this.activated )
		{
			if ( from_entity.is( sdCrystal ) )
			{
				if ( from_entity.y > this.y + this._hitbox_y2 )
				if ( from_entity.held_by === null && from_entity.type !== 2 && from_entity.type !== 6 ) // Prevent crystals which are stored in a crate
				if ( from_entity._damagable_in > sdWorld.time - 5000 ) // Grace period, disallow non freshly mined crystals to enter excavator
				{
					if ( !from_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2, pitch:2 });
				
						let matter_to_feed = from_entity.matter_max * ( from_entity.matter_regen / 100 );
						this.crystal_matter = Math.min( this.crystal_matter_max, this.crystal_matter + matter_to_feed ); // Drain the crystal for it's max value and destroy it
						//this._update_version++;
						from_entity.remove();
					}
				}
			}
			if ( from_entity.is( sdGun ) )
			{
				if ( this.type === sdExcavator.TYPE_LARGE || this.type === sdExcavator.TYPE_SMALL )
				{
					if ( from_entity.class === sdGun.CLASS_CRYSTAL_SHARD && ( from_entity.extra && from_entity.extra[ 0 ] ) )
					{
						if ( !from_entity._is_being_removed )
						{
							//sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2, pitch:2 });
							let mult = 0.1;
							if ( this.type === sdExcavator.TYPE_LARGE )
							mult = mult * 1.5;
							if ( this.type === sdExcavator.TYPE_SMALL ) 
							mult = mult * 0.75;
						
							let matter_to_feed = Math.max( 1, (from_entity.extra[ 0 ] * mult ) );
							
						
							this.crystal_matter = Math.min( this.crystal_matter_max, this.crystal_matter + matter_to_feed ); // Drain the shard for it's max value and destroy it
							//this._update_version++;
							from_entity.remove();
						}
					}
				}
			}
			
			if ( from_entity.is( sdLost ) || from_entity.is( sdGib ) )
			from_entity.remove();
		}
		
		if ( from_entity.is( sdGun ) )
		{
			if ( from_entity.class === sdGun.CLASS_CUBE_SHARD || from_entity.class === sdGun.CLASS_ERTHAL_ENERGY_CELL )
			if ( !from_entity._is_being_removed )
			{
				this.time_left += 30 * 60; // Extend by 1 minute
				from_entity.remove();
			}
			if ( from_entity.class === sdGun.CLASS_METAL_SHARD )
			if ( !from_entity._is_being_removed && this.hea < this.hmax * 0.65 ) // Allow only if it can fully utilize the shard
			{
				this.hea = Math.min( this.hea + this.hmax * 0.35, this.hmax );
				from_entity.remove();
			}
		}
	}
	get title()
	{
		if ( this.type === sdExcavator.TYPE_COUNCIL )
		return 'Council excavator';
	
		return 'Excavator';
	}
	ExecuteContextCommand( command_name, parameters_array, executer_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). executer_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( executer_character )
		if ( executer_character.hea > 0 )
		{
			if ( command_name === 'ACTIVATE' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, executer_character.x, executer_character.y, 64 ) )
				{
					if ( !this.activated )
					{
						this.activated = true;
						sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:0.5, pitch:4 });
					}
				}
				else
				{
					executer_socket.SDServiceMessage( this.title + ' is too far' );
					return;
				}
			}
		}
	}
	PopulateContextOptions( executer_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( executer_character )
		if ( executer_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, executer_character.x, executer_character.y, 64 ) )
			{
				if ( this.type === sdExcavator.TYPE_LARGE || this.type === sdExcavator.TYPE_SMALL )
				this.AddContextOption( 'Activate excavator', 'ACTIVATE', [] );
			}
		}
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		let yy = 0;
		
		if ( this.type === sdExcavator.TYPE_SMALL )
		yy = 1;
		if ( this.type === sdExcavator.TYPE_COUNCIL )
		{
			yy = 2;
			ctx.apply_shading = false;
		}
	
		if ( this.type === sdExcavator.TYPE_LARGE || this.type === sdExcavator.TYPE_SMALL )
		xx = Math.min( 3, Math.floor( this.image / 4 ) );
	
		if ( this.type === sdExcavator.TYPE_COUNCIL )
		{
			xx = Math.min( 1, Math.floor( this.image / 8 ) );
		}
		
		ctx.drawImageFilterCache( sdExcavator.img_excavator, xx * 64, yy * 64, 64, 64, -32, -32, 64, 64 );
		
		if ( this.type === sdExcavator.TYPE_LARGE || this.type === sdExcavator.TYPE_SMALL )
		{
			xx = 4;
			ctx.globalAlpha = Math.min( 1, 1.25 * this.crystal_matter / this.crystal_matter_max )
			ctx.drawImageFilterCache( sdExcavator.img_excavator, xx * 64, yy * 64, 64, 64, -32, -32, 64, 64 );
		}
		if ( this.type === sdExcavator.TYPE_COUNCIL )
		{
			
		}

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.apply_shading = true;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.type === sdExcavator.TYPE_LARGE || this.type === sdExcavator.TYPE_SMALL )
		{
			if ( this.activated )
			sdEntity.TooltipUntranslated( ctx, T("Excavator")+" (" + ~~( this.time_left / ( 30 * 60 ) ) + " minutes, "+  ~~ ~~( this.time_left % ( 30 * 60 ) / 30 ) + " seconds)" + " ( " + sdWorld.RoundedThousandsSpaces(this.crystal_matter) + " / " + sdWorld.RoundedThousandsSpaces(this.crystal_matter_max) + " )", 0, -14 );
			else
			sdEntity.TooltipUntranslated( ctx, T("Excavator (disabled)") + " ( " + sdWorld.RoundedThousandsSpaces(this.crystal_matter) + " / " + sdWorld.RoundedThousandsSpaces(this.crystal_matter_max) + " )", 0, -14 );
		}
		if ( this.type === sdExcavator.TYPE_COUNCIL )
		{
			if ( this.activated )
			sdEntity.TooltipUntranslated( ctx, T("Council excavator")+" (" + ~~( this.time_left / ( 30 * 60 ) ) + " minutes, "+  ~~ ~~( this.time_left % ( 30 * 60 ) / 30 ) + " seconds)", 0, -18 );
			else
			sdEntity.TooltipUntranslated( ctx, T("Council excavator (disabled)"), 0, -18 );
		}
		
		if ( this.type !== sdExcavator.TYPE_COUNCIL )
		{
			let w = 40;
			{
				ctx.fillStyle = '#000000';
				ctx.fillRect( 0 - w / 2, 0 - 32, w, 3 );

				ctx.fillStyle = '#FF0000';
				ctx.fillRect( 1 - w / 2, 1 - 32, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
			}
		}
		else
		this.DrawHealthBar( ctx );
	}
	
	/*onRemoveAsFakeEntity()
	{
		let i = sdExcavator.panels.indexOf( this );
		
		if ( i !== -1 )
		sdExcavator.panels.splice( i, 1 );
	}*/
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	}
	onRemoveAsFakeEntity()
	{
		//sdOverlord.overlord_tot--;
		
		let i = sdExcavator.council_excavators.indexOf( this );
		
		if ( i !== -1 )
		sdExcavator.council_excavators.splice( i, 1 );

	}
}
//sdExcavator.init_class();

export default sdExcavator;
