
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
import sdSandWorm from './sdSandWorm.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdFactions from './sdFactions.js';

class sdJunk extends sdEntity
{
	static init_class()
	{
		sdJunk.img_cube_unstable = sdWorld.CreateImageFromFile( 'cube_unstable_corpse' );
		sdJunk.img_cube_unstable_detonate = sdWorld.CreateImageFromFile( 'cube_unstable_corpse_on' );
		sdJunk.img_cube_unstable2 = sdWorld.CreateImageFromFile( 'cube_unstable_corpse2' );
		sdJunk.img_cube_unstable2_empty = sdWorld.CreateImageFromFile( 'cube_unstable_corpse2_empty' );
		sdJunk.img_cube_unstable2_detonate = sdWorld.CreateImageFromFile( 'cube_unstable_corpse2_on' );
		sdJunk.img_cube_unstable3 = sdWorld.CreateImageFromFile( 'cube_unstable_corpse3' );
		sdJunk.img_cube_unstable3_detonate = sdWorld.CreateImageFromFile( 'cube_unstable_corpse3_on' );

		sdJunk.img_crystal_map_drainer_empty = sdWorld.CreateImageFromFile( 'crystal_cluster3_empty' ); // Sprite by HastySnow / LazyRain
		sdJunk.img_crystal_map_drainer = sdWorld.CreateImageFromFile( 'crystal_cluster3' ); // Sprite by HastySnow / LazyRain

		sdJunk.img_council_bomb = sdWorld.CreateImageFromFile( 'council_bomb' );
		sdJunk.img_council_bomb2 = sdWorld.CreateImageFromFile( 'council_bomb2' );

		sdJunk.img_erthal_beacon = sdWorld.CreateImageFromFile( 'erthal_distress_beacon2' );

		sdJunk.img_matter_container2 = sdWorld.CreateImageFromFile( 'matter_container2' );
		sdJunk.img_matter_container2_empty = sdWorld.CreateImageFromFile( 'matter_container2_empty' );

		sdJunk.img_freeze_barrel = sdWorld.CreateImageFromFile( 'barrel_freeze' );

		sdJunk.img_alien_artifact = sdWorld.CreateImageFromFile( 'artifact1' );
		sdJunk.img_stealer_artifact = sdWorld.CreateImageFromFile( 'artifact2' );

		sdJunk.anti_crystals = 0;
		sdJunk.council_bombs = 0;
		sdJunk.erthal_beacons = 0;

		sdJunk.TYPE_UNSTABLE_CUBE_CORPSE = 0;
		sdJunk.TYPE_ALIEN_BATTERY = 1;
		sdJunk.TYPE_LOST_CONTAINER = 2;
		sdJunk.TYPE_PLANETARY_MATTER_DRAINER = 3;
		sdJunk.TYPE_COUNCIL_BOMB = 4;
		sdJunk.TYPE_ERTHAL_DISTRESS_BEACON = 5;
		sdJunk.TYPE_ADVANCED_MATTER_CONTAINER = 6;
		sdJunk.TYPE_FREEZE_BARREL = 7;
		sdJunk.TYPE_ALIEN_ARTIFACT = 8;
		sdJunk.TYPE_STEALER_ARTIFACT = 9;
		sdJunk.ScoreScaleByType = ( t )=>
		{
			if ( t === sdJunk.TYPE_ALIEN_ARTIFACT || t === sdJunk.TYPE_STEALER_ARTIFACT )
			return 20;
			
			return 5;
		};

		sdJunk.bounds_by_type = [];
		sdJunk.bounds_by_type[ sdJunk.TYPE_UNSTABLE_CUBE_CORPSE ] = { x1: -5, x2: 5, y1: -5, y2: 5 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_ALIEN_BATTERY ] = { x1: -6, x2: 5, y1: -8, y2: 8 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_LOST_CONTAINER ] = { x1: -6, x2: 5, y1: -8, y2: 8 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_PLANETARY_MATTER_DRAINER ] = { x1: -28, x2: 28, y1: 0, y2: 23 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_COUNCIL_BOMB ] = { x1: -11, x2: 11, y1: -30, y2: 31 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ] = { x1: -11, x2: 11, y1: -21, y2: 29 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ] = { x1: -11, x2: 11, y1: -15, y2: 17 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_FREEZE_BARREL ] = { x1: -8, x2: 8, y1: -8, y2: 8 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_ALIEN_ARTIFACT ] = { x1: -3, x2: 3, y1: -3, y2: 3 };
		sdJunk.bounds_by_type[ sdJunk.TYPE_STEALER_ARTIFACT ] = { x1: -3, x2: 3, y1: -3, y2: 3 };
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return sdJunk.bounds_by_type[ this.type ] ? sdJunk.bounds_by_type[ this.type ].x1 : -8; }
	get hitbox_x2() { return sdJunk.bounds_by_type[ this.type ] ? sdJunk.bounds_by_type[ this.type ].x2 : 8; }
	get hitbox_y1() { return sdJunk.bounds_by_type[ this.type ] ? sdJunk.bounds_by_type[ this.type ].y1 : -8; }
	get hitbox_y2() { return sdJunk.bounds_by_type[ this.type ] ? sdJunk.bounds_by_type[ this.type ].y2 : 8; }
	/*
	get hitbox_x1() { return this.type === sdJunk.TYPE_ALIEN_ARTIFACT ? -3 : this.type === sdJunk.TYPE_FREEZE_BARREL ? -8 : this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ? -11 : this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ? - 11 : this.type === sdJunk.TYPE_COUNCIL_BOMB ? -11 : this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ? -28 : -5; }
	get hitbox_x2() { return this.type === sdJunk.TYPE_ALIEN_ARTIFACT ? 3 : this.type === sdJunk.TYPE_FREEZE_BARREL ? 8 : this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ? 11 : this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ? 11 : this.type === sdJunk.TYPE_COUNCIL_BOMB ? 11 : this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ? 28 : 5; }
	get hitbox_y1() { return this.type === sdJunk.TYPE_ALIEN_ARTIFACT ? -3 : this.type === sdJunk.TYPE_FREEZE_BARREL ? -8 : this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ? -15 : this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ? - 21 : this.type === sdJunk.TYPE_COUNCIL_BOMB ? -30 : this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ? 0 : -5; }
	get hitbox_y2() { return this.type === sdJunk.TYPE_ALIEN_ARTIFACT ? 3 : this.type === sdJunk.TYPE_FREEZE_BARREL ? 8 : this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ? 17 : this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ? 29 : this.type === sdJunk.TYPE_COUNCIL_BOMB ? 31 : this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ? 23 : 5; }
	*/
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.regen_timeout = 0;

		let r = Math.random();
		let t_s = 0;

		if ( r < 0.25 )
		t_s = sdJunk.TYPE_FREEZE_BARREL;
		else
		if ( r < 0.5 )
		t_s = sdJunk.TYPE_LOST_CONTAINER;
		else
		if ( r < 0.75 )
		t_s = sdJunk.TYPE_ALIEN_BATTERY;
		else
		t_s = sdJunk.TYPE_UNSTABLE_CUBE_CORPSE;

		this.type = ( params.type !== undefined ) ? params.type : t_s;

		if ( this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ) // Task reward matter container
		this.hmax = 4000;
		if ( this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ) // Erthal distress beacon
		this.hmax = 25000;
		if ( this.type === sdJunk.TYPE_COUNCIL_BOMB ) // Council bomb
		this.hmax = 50000;
		if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ) // Large anti-crystal
		this.hmax = 1000;
		else
		if ( this.type === sdJunk.TYPE_ALIEN_BATTERY || this.type === sdJunk.TYPE_LOST_CONTAINER || this.type === sdJunk.TYPE_FREEZE_BARREL ) // Current barrels ( 1 = Alien battery, 2 = Lost Particle Container, 7 = Freeze barrel )
		this.hmax = 150;
		else
		if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE || this.type === sdJunk.TYPE_ALIEN_ARTIFACT || this.type === sdJunk.TYPE_STEALER_ARTIFACT )
		this.hmax = 500;

		// Variables for large anti-crystal
		this._next_score_at = this.hmax; // To prevent spark or erthal blaster score abuse, score is now given to player on every 100+ damage.
		this._time_to_drain = 30 * 1;
		this._time_to_drain_more = 30 * 60 * 40; // 40 minutes, every 10 minutes it increases matter drain percentage
		//this._time_to_drain_rtps = 30 * 60 * 30; // 30 minutes until it also starts draining matter from rescue teleporters
		this._last_damage = 0; // Sound flood prevention

		// Variables for Council bomb
		this.glow_animation = 0; // Glow animation for the bomb
		this._glow_fade = 0; // Should the glow fade or not?
		this.detonation_in = 30 * 60 * 10; // 10 minutes until the bomb explodes
		this._rate = 120;
		this._max_damage = 4000; // Max damage the council bomb can take under a timer
		this._max_damage_timer = 30; // Timer which resets max damage the Council bomb can recieve in a second ( counters barrel spam )
		this._current_minions_count = 0; // Minion counter
		//
		this.hea = this.hmax;
		this.matter_max = this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ? ( 5120 * 8 * 10 ) : 320; // Why take 40k container when 3 5K's generate over 1 million matter overall? Make them 400k and they're sort of a short-term reward / good matter storage.
		this.matter = this.matter_max;
		this._damagable_in = sdWorld.time + 1500; // Copied from sdCrystal to prevent high ping players injure themselves, will only work for sdCharacter damage
		this._spawn_ent_in = 60; // Used in Council Bomb, although could be used in other things
		this._spawn_ent_in_delay = 30 * 30; // 30 seconds but grows evert time spawn happens to avoid too much flood
		this._regen_timeout = 0; // Regen timeout for task reward matter container, although could be used in other things in future
		this._notify_players_in = 30; // Notify players about tasks ( Erthal beacon )
		
		this._ai_team = -1; // For Council bomb and Erthal beacon

		if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER )
		sdJunk.anti_crystals++;

		if ( this.type === sdJunk.TYPE_COUNCIL_BOMB )
		{
			sdJunk.council_bombs++;
			this._ai_team = 3;
		}

		if ( this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON )
		{
			sdJunk.erthal_beacons++;
			this._ai_team = 2;
		}
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
		
		this._storage_trap_mode_for = null; // Trap activating sdCharacter
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
	
		if ( this.type === sdJunk.TYPE_COUNCIL_BOMB )
		if ( this._max_damage <= 0 )
		return;

		//if ( initiator !== null )
		if ( initiator === null || initiator.IsPlayerClass() )
		if ( sdWorld.time < this._damagable_in )
		if ( !( initiator && initiator.IsPlayerClass() && initiator.power_ef > 0 ) )
		{
			if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER )
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });

			return;
		}
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;

		if ( this.type === sdJunk.TYPE_COUNCIL_BOMB )
		{
			this._max_damage -= dmg;
			this._spawn_ent_in -= dmg / 500; // Speed up council spawning when taking damage
			if ( this._max_damage < 0 ) // If the max damage threshold per timer was crossed
			{
				this.hea -= this._max_damage; // Refund health above threshold
				this._spawn_ent_in -= this._max_damage / 500; // Refund spawn timer when it can't deal damage
				this._max_damage = 0;
			}
			
			let old_hea = this.hea + dmg;
			
			if ( Math.round( old_hea / ( this.hmax / 25 ) ) > Math.round( this.hea / ( this.hmax / 25 ) ) ) // Should spawn about 25 assault drones throughout the fight
			{
				if ( initiator )
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
		}

		if ( this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER )
		this._regen_timeout = 60;

		
		this.regen_timeout = Math.max( this.regen_timeout, 60 );

		if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER || this.type === sdJunk.TYPE_COUNCIL_BOMB ) // Recieve score for damaging the crystal or council bomb
		{
			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			{
				if ( this.hea <= this._next_score_at )
				{
					//initiator._score += 1;
					this._next_score_at = this.hea - 80;
				}
			}
		}
		
		if ( this.hea <= 0 && was_alive )
		{
			if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE ) // Actual cube corpses explode into rails.
			{
				if ( Math.random() < 0.1 ) // 10% chance to stabilize/revive the cube instead, idea by Bandit
				{
					let cube = new sdCube({ x: this.x, y: this.y });
					sdEntity.entities.push( cube );
					this.remove();
					return; // Prevents spawning cube shard when a cube stabilizes
				}
				else
				{
					let bullet_obj1 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj1._owner = this;
								bullet_obj1.sx = -1;
								bullet_obj1.sy = 0
								//bullet_obj1.x += bullet_obj1.sx * 5;
								//bullet_obj1.y += bullet_obj1.sy * 5;

								bullet_obj1.sx *= 16;
								bullet_obj1.sy *= 16;
						
								bullet_obj1.time_left = 30;

								bullet_obj1._rail = true;
								bullet_obj1.color = '#62c8f2';

								bullet_obj1._damage = 150;

								sdEntity.entities.push( bullet_obj1 );

					let bullet_obj2 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj2._owner = this;
								bullet_obj2.sx = 0;
								bullet_obj2.sy = 1;
								//bullet_obj2.x += bullet_obj2.sx * 5;
								//bullet_obj2.y += bullet_obj2.sy * 5;

								bullet_obj2.sx *= 16;
								bullet_obj2.sy *= 16;
						
								bullet_obj2.time_left = 30;

								bullet_obj2._rail = true;
								bullet_obj2.color = '#62c8f2';

								bullet_obj2._damage = 150;
								sdEntity.entities.push( bullet_obj2 );

					let bullet_obj3 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj3._owner = this;
								bullet_obj3.sx = 1;
								bullet_obj3.sy = 0
								//bullet_obj3.x += bullet_obj3.sx * 5;
								//bullet_obj3.y += bullet_obj3.sy * 5;

								bullet_obj3.sx *= 16;
								bullet_obj3.sy *= 16;
						
								bullet_obj3.time_left = 30;

								bullet_obj3._rail = true;
								bullet_obj3.color = '#62c8f2';

								bullet_obj3._damage = 150;

								sdEntity.entities.push( bullet_obj3 );

					let bullet_obj4 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj4._owner = this;
								bullet_obj4.sx = 0;
								bullet_obj4.sy = -1;
								//bullet_obj4.x += bullet_obj4.sx * 5;
								//bullet_obj4.y += bullet_obj4.sy * 5;

								bullet_obj4.sx *= 16;
								bullet_obj4.sy *= 16;
						
								bullet_obj4.time_left = 30;

								bullet_obj4._rail = true;
								bullet_obj4.color = '#62c8f2';	

								bullet_obj4._damage = 150;
								sdEntity.entities.push( bullet_obj4 );
				}
			}
			if ( this.type === sdJunk.TYPE_ALIEN_BATTERY  ) // Cube "barrels" explode
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:60, // 80 was too much?
					damage_scale: 2 + ( 1 * ( this.matter / 90 ) ), // Weaker explosion if you drain it's matter before that, more lethal than regular cube explosion if it's matter is max
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:'#33FFFF' 
				});
			}
			if ( this.type === sdJunk.TYPE_LOST_CONTAINER  ) // Cube yellow "barrels" use Lost affection, check code in case if I made a mistake somehow
			{
				let bullet = new sdBullet({ x: this.x, y: this.y });
				bullet.model = 'ball_charged';
				bullet._damage = 0;
				bullet.owner = this;
				bullet.time_left = 0; 
				bullet._custom_detonation_logic = ( bullet )=>
				{
					{
						sdWorld.SendEffect({ 
							x:bullet.x, 
							y:bullet.y, 
							radius:30,
							damage_scale: 0, // Just a decoration effect
							type:sdEffect.TYPE_EXPLOSION, 
							owner:this,
							color:'#ffff66' 
						});

						let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 48 );

						for ( let i = 0; i < nears.length; i++ )
						{
							if ( this._storage_trap_mode_for === nears[ i ] )
							sdLost.ApplyAffection( nears[ i ], 110 * 3, bullet );
							else
							sdLost.ApplyAffection( nears[ i ], 110, bullet );
						}
					}
				};
				sdEntity.entities.push( bullet );
			}
			if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ) // Large Anti-crystal degrades into a big Anti-crystal
			{

				sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.5 });

				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
					Math.ceil( Math.max( 5, sdCrystal.anticrystal_value * 4 / sdCrystal.anticrystal_value * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					sdCrystal.anticrystal_value * 4 / 160,
					8
				);

				let ent = new sdCrystal({x: this.x, y: this.y, sx: this.sx, sy: this.sy, type:2 });
				ent.y = this.y + this._hitbox_y2 - ent.hitbox_y2;

				ent.matter_max = sdCrystal.anticrystal_value * 4;
				ent.matter = 0;

				sdEntity.entities.push( ent );
				sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible
				
				let ent2 = new sdCube({ x: this.x, y: ent.y + ent.hitbox_y1 - 5, sx: this.sx, sy: this.sy, kind: sdCube.KIND_MATTER_STEALER });
				sdEntity.entities.push( ent2 );
				sdWorld.UpdateHashPosition( ent2, false ); // Optional, but will make it visible as early as possible
			}

			if ( this.type === sdJunk.TYPE_COUNCIL_BOMB || this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON )
			{
				let x = this.x;
				let y = this.y;
				//let sx = this.sx;
				//let sy = this.sy;

				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

				let gun;
				gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
				gun.extra = this.type === sdJunk.TYPE_COUNCIL_BOMB ? 2 : 1;

				//gun.sx = sx;
				//gun.sy = sy;
				sdEntity.entities.push( gun );

				}, 500 );
				
				if ( this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON && Math.random() < 0.25 ) // 25% chance for energy cell drop
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

				let gun2;
				gun2 = new sdGun({ x:x, y:y, class:sdGun.CLASS_ERTHAL_ENERGY_CELL });

				//gun.sx = sx;
				//gun.sy = sy;
				sdEntity.entities.push( gun2 );

				}, 500 );

				if ( this.type === sdJunk.TYPE_COUNCIL_BOMB && Math.random() < 0.10 ) // 10% chance for Council Immolator
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

				let gun2;
				gun2 = new sdGun({ x:x, y:y, class:sdGun.CLASS_COUNCIL_IMMOLATOR });

				//gun.sx = sx;
				//gun.sy = sy;
				sdEntity.entities.push( gun2 );

				}, 500 );
				
				if ( this.type === sdJunk.TYPE_COUNCIL_BOMB && Math.random() < 0.02 ) // 2% chance for Exalted core
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

				let gun2;
				gun2 = new sdGun({ x:x, y:y, class:sdGun.CLASS_EXALTED_CORE });

				//gun.sx = sx;
				//gun.sy = sy;
				sdEntity.entities.push( gun2 );

				}, 500 );
			}

			if ( this.type === sdJunk.TYPE_FREEZE_BARREL ) // Freeze "barrels" freeze stuff
			{
				let bullet = new sdBullet({ x: this.x, y: this.y });
				bullet.model = 'ball_charged';
				bullet._damage = 1;
				bullet.owner = this;
				bullet.time_left = 0; 
				bullet._custom_detonation_logic = ( bullet )=>
				{
					sdWorld.SendEffect({ 
						x:bullet.x, 
						y:bullet.y, 
						radius:30,
						damage_scale: 0, // Just a decoration effect
						type:sdEffect.TYPE_EXPLOSION, 
						owner:this,
						color:'#33FFFF' 
					});

					let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 40 );

					for ( let i = 0; i < nears.length; i++ )
					{
						if ( nears[ i ].IsTargetable( this ) )
						if ( nears[ i ]._is_bg_entity === this._is_bg_entity )
						nears[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t: -250, initiator: this._owner }); // Freeze nearby objects
					}
				};
				sdEntity.entities.push( bullet );
			}

			let r = Math.random();

			r = Math.random(); // Cube shard dropping roll
			if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE || this.type === sdJunk.TYPE_ALIEN_BATTERY ) // unstable cube corpses
			if ( r < 0.1 )
			{
				let x = this.x;
				let y = this.y;
				let sx = this.sx;
				let sy = this.sy;

				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun;
					gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_CUBE_SHARD });
					gun.sx = sx;
					gun.sy = sy;
					sdEntity.entities.push( gun );

				}, 500 );
			}

			this.remove();
		}
		else
		if ( sdWorld.time > this._last_damage + 50 )
		if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER )
		{
			this._last_damage = sdWorld.time;
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
		}
		
	}
	
	get mass() { return this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ? 60 : this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ? 800 : this.type === sdJunk.TYPE_COUNCIL_BOMB ? 1000 : this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ? 500 : 30; }
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
		if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER )
		GSPEED *= 0.25;

		this.sy += sdWorld.gravity * GSPEED;

		if ( sdWorld.is_server )
		{
			if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE || this.type === sdJunk.TYPE_ALIEN_BATTERY )
			{
				this.MatterGlow( 0.01, 30, GSPEED );
			}
			if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE || ( this.type === sdJunk.TYPE_ALIEN_BATTERY && this.hea !== this.hmax ) || ( this.type === sdJunk.TYPE_LOST_CONTAINER && this.hea !== this.hmax ) )
			this.Damage( GSPEED );

			if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER )
			{
				this._time_to_drain -= GSPEED;
				this._time_to_drain_more = Math.max( this._time_to_drain_more - GSPEED, 0 );
				//this._time_to_drain_rtps = Math.max( this._time_to_drain_rtps - GSPEED, 0 );

				if ( this._time_to_drain <= 0 )
				{
					this._time_to_drain = 30 * 1;

					let multiplier = 0.98;
					let di_mult = 1; // Distance multiplier, the closer the player, the faster the drain.
					let di = 2000;

					if ( this._time_to_drain_more <= 0 )
					multiplier = 0.90;
					else
					if ( this._time_to_drain_more <= ( 30 * 60 * 10 ) )
					multiplier = 0.92;
					else
					if ( this._time_to_drain_more <= ( 30 * 60 * 20 ) )
					multiplier = 0.94;
					else
					if ( this._time_to_drain_more <= ( 30 * 60 * 30 ) )
					multiplier = 0.96;

					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					{
						di_mult = 1;

						if ( sdWorld.sockets[ i ].character !== null )
						if ( !sdWorld.sockets[ i ].character._is_being_removed )
						if ( sdWorld.sockets[ i ].character.hea > 0 )
						{
							//if ( sdWorld.sockets[ i ].character.build_tool_level > 0 )
							{
								di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, this.x, this.y );
								if ( di < 300 )
								di_mult = 0.6;
								else
								if ( di < 600 )
								di_mult = 0.7;
								else
								if ( di < 900 )
								di_mult = 0.8;
								else
								if ( di < 1200 )
								di_mult = 0.9;

								if ( di < 1500 )
								{
									sdWorld.sockets[ i ].character.matter = sdWorld.sockets[ i ].character.matter * multiplier * di_mult;
									
									sdTask.MakeSureCharacterHasTask({ 
										similarity_hash:'DESTROY-'+this._net_id, 
										executer: sdWorld.sockets[ i ].character,
										target: this,
										mission: sdTask.MISSION_DESTROY_ENTITY,
										difficulty: 0.125 * sdTask.GetTaskDifficultyScaler(),
										title: 'Destroy planetary matter drainer',
										description: 'There is a planetary matter drainer spotted nearby. Destroy it before it drains all our matter!'
									});
								}
							}
						}
					}
					/*if ( this._time_to_drain_rtps <= 0 )
					{
						for ( var i = 0; i < sdRescueTeleport.rescue_teleports.length; i++ )
						{
							sdRescueTeleport.rescue_teleports[ i ].matter = sdRescueTeleport.rescue_teleports[ i ].matter * multiplier / 3;
						}						
					}*/
				}
			}

			if ( this.type === sdJunk.TYPE_COUNCIL_BOMB ) // Council bomb
			{
				this._max_damage_timer -= GSPEED;
				if ( this._max_damage_timer < 0 )
				{
					this._max_damage_timer = 30;
					this._max_damage = 4000;
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
					sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.25, pitch:2 });
					if ( this.detonation_in > 30 * 5 )
					{
						for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be defused
						{
							sdTask.MakeSureCharacterHasTask({ 
								similarity_hash:'DESTROY-'+this._net_id, 
								executer: sdWorld.sockets[ i ].character,
								target: this,
								mission: sdTask.MISSION_DESTROY_ENTITY,
								difficulty: 0.334,
								time_left: ( this.detonation_in - 30 * 2 ),
								title: 'Disarm Council bomb',
								description: 'Looks like Council paid us a visit and decided to bomb some parts of the planet. Stop them!'
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
						radius:120, // run
						damage_scale: 80,
						type:sdEffect.TYPE_EXPLOSION, 
						owner:this._owner,
						can_hit_owner: true,
						color:sdEffect.default_explosion_color
					});

					// Spawn Council mecha worm as a punishment aswell

					setTimeout(()=>{//Just in case
						let worm = new sdSandWorm({x: this.x, y:this.y, kind: sdSandWorm.KIND_COUNCIL_WORM, scale: 1});
						sdEntity.entities.push( worm );
					}, 500 );

					// Will ignore ones who disconnected during explosion
					//for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Punish players for not defusing the bomb
					//if ( sdWorld.sockets[ i ].character )
					//sdWorld.sockets[ i ].character._nature_damage += 100000;
					
					for ( let i = 0; i < sdCharacter.characters.length; i++ )
					sdCharacter.characters[ i ]._nature_damage += 100000;

					if ( sdWeather.only_instance._daily_events.length > 0 )
					{
						let n = 0;
						let spawn_cubes = false;
						for( let i = 0; i < sdWeather.only_instance._daily_events.length; i++)
						{
							n = sdWeather.only_instance._daily_events[ i ];
							if ( n === 2 ) // Are cubes possible spawns on planet?
							{
								spawn_cubes = true;
								break;
							}
						}
						if ( spawn_cubes === true ) // Spawn a ton of cubes
						{
							sdWeather.only_instance.ExecuteEvent({
								event: 2,
								near_entity: this,
								group_radius: 3000
							});
							sdWeather.only_instance.ExecuteEvent({
								event: 2,
								near_entity: this,
								group_radius: 3000
							});
							sdWeather.only_instance.ExecuteEvent({
								event: 2,
								near_entity: this,
								group_radius: 3000
							});
						}
					}
					

					this.remove();
				}
				if ( this._spawn_ent_in > 0 )
				this._spawn_ent_in -= GSPEED;

				if ( this._spawn_ent_in <= 0 && this.detonation_in > 30 * 60 )
				{
					this._spawn_ent_in = 660 - Math.min( 180, 30 * sdWorld.GetPlayingPlayersCount() ); // Was 330 but made council a bit too annoying since they spawned too frequently and could not be killed as fast
					let ais = 0;
					//let percent = 0;
					for ( var i = 0; i < sdCharacter.characters.length; i++ )
					{
						if ( sdCharacter.characters[ i ].hea > 0 )
						if ( !sdCharacter.characters[ i ]._is_being_removed )
						if ( sdCharacter.characters[ i ]._ai_team === 3 )
						{
							ais++;
							//console.log(ais);
						}
					}
					{

						let councils = 0;
						let councils_tot = Math.min( 4, Math.max( 2, 1 + sdWorld.GetPlayingPlayersCount() ) );

						let left_side = ( Math.random() < 0.5 );

						while ( councils < councils_tot ) // No need for capping spawns since they despawn after 30 seconds anyway
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
										character_entity._ai_stay_distance = 128; // A little closer than to the portal machine

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
					}
					{
						// Spawn a council support drone
						if ( this.hea < ( this.hmax * 0.85 ) )
						{
							if ( Math.random() < 0.8 ) // 80% it spawns a support healing Drone
							{
								let spawn_count = ( this.hea < this.hmax * 0.5 ) ? 2 : 1;
								for ( let i = 0; i < spawn_count; i++ )
								{
									if ( this._current_minions_count < 3 )
									{
										let drone = new sdDrone({ x:0, y:0 , _ai_team: 3, type: 6, minion_of: this });

										sdEntity.entities.push( drone );
										
										let x,y;
										let tr = 100;
										do
										{
											{
												x = this.x + 192 - ( Math.random() * 384 );

												if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
												x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

												if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
												x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );
											}

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

			if ( this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ) // Erthal distress beacon
			{
				if ( this._notify_players_in > 0 ) // task notification timer
				this._notify_players_in -= GSPEED;
				else
				{
					this._notify_players_in = 30 * 2;
					for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
					{
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'DESTROY-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_DESTROY_ENTITY,
							difficulty: 0.167 * sdTask.GetTaskDifficultyScaler(),
							title: 'Destroy Erthal distress beacon',
							description: 'The Erthals have placed a distress beacon nearby and are rallying their troops! Destroy the beacon before they overflow the land!'
						});
					}
				}
				if ( this._spawn_ent_in > 0 ) // spawn timer
				this._spawn_ent_in -= GSPEED;
				else
				{
					this._spawn_ent_in = this._spawn_ent_in_delay; // 30 seconds
					this._spawn_ent_in_delay *= 1.1; // 1.25 seemed way too weak
					sdWeather.only_instance.ExecuteEvent({
						event: 11,
						near_entity: this,
						group_radius: 3000
					}); // Execute Erthal spawn event
					
					if ( this._spawn_ent_in_delay > 60 * 60 * 24 )
					{
						this.remove(); // Remove and maybe give task reward
					}
				}
			}
			if ( this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ) // Task reward matter container
			{
				this.MatterGlow( 0.01, 30, GSPEED );

				if ( this._regen_timeout > 0 )
				this._regen_timeout -= GSPEED;
				else
				{
					if ( this.hea < this.hmax )
					{
						this.hea = Math.min( this.hea + GSPEED, this.hmax );
					}
				}
			}
			if ( this.type === sdJunk.TYPE_ALIEN_ARTIFACT || this.type === sdJunk.TYPE_STEALER_ARTIFACT )
			{
				this._time_to_drain -= GSPEED; // Just so it doesn't spam sdTask.MakeSureCharacterHasTask

				if ( this._time_to_drain <= 0 )
				{
					this._time_to_drain = 30 * 1;

					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					{

						if ( sdWorld.sockets[ i ].character !== null )
						if ( !sdWorld.sockets[ i ].character._is_being_removed )
						if ( sdWorld.sockets[ i ].character.hea > 0 )
						{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, this.x, this.y );
								if ( di < 400 ) // If someone decides to keep the artifact rather than delivering, it used to display task regardless of distance.
								{
									sdTask.MakeSureCharacterHasTask({ 
										similarity_hash:'EXTRACT-'+this._net_id, 
										executer: sdWorld.sockets[ i ].character,
										target: this,
										mission: sdTask.MISSION_LRTP_EXTRACTION,
										difficulty: 0.075 * sdTask.GetTaskDifficultyScaler(),
										title: 'Extract alien artifact',
										description: 'We would like to investigate this artifact you have found. Can you deliver it to the mothership using a long range teleporter?'
									});
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
		if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE )
		sdEntity.Tooltip( ctx, "Unstable cube corpse" );
	
		if ( this.type === sdJunk.TYPE_ALIEN_BATTERY )
		sdEntity.Tooltip( ctx, "Alien battery" );
	
		if ( this.type === sdJunk.TYPE_LOST_CONTAINER )
		sdEntity.Tooltip( ctx, "Lost particle container" );
	
		if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER )
		{
			sdEntity.Tooltip( ctx, "Planetary matter drainer", 0, -8 );
			this.DrawHealthBar( ctx );
		}
		if ( this.type === sdJunk.TYPE_COUNCIL_BOMB )
		{
			sdEntity.TooltipUntranslated( ctx, T("Council bomb")+" (" + ~~( this.detonation_in / ( 30 * 60 ) ) + " minutes, "+  ~~ ~~( this.detonation_in % ( 30 * 60 ) / 30 ) + " seconds)", 0, -32 );
			this.DrawHealthBar( ctx );
		}
		if ( this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON )
		{
			sdEntity.Tooltip( ctx, "Erthal distress beacon", 0, -24 );
			this.DrawHealthBar( ctx );
		}

		if ( this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER )
		{
			sdEntity.TooltipUntranslated( ctx, T("Advanced matter container") + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
		}

		if ( this.type === sdJunk.TYPE_FREEZE_BARREL )
		sdEntity.Tooltip( ctx, "Cryo-substance barrel" );

		if ( this.type === sdJunk.TYPE_ALIEN_ARTIFACT || this.type === sdJunk.TYPE_STEALER_ARTIFACT )
		sdEntity.Tooltip( ctx, "Strange artifact" );
	}
	Draw( ctx, attached )
	{
		if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE || this.type === sdJunk.TYPE_ALIEN_BATTERY || this.type === sdJunk.TYPE_LOST_CONTAINER || this.type === sdJunk.TYPE_COUNCIL_BOMB || this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON || this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER )
		ctx.apply_shading = false;
		//ctx.filter = this.filter;
		
		{
			if ( this.type === sdJunk.TYPE_UNSTABLE_CUBE_CORPSE ) // First unstable cube corpse
			{
				if ( this.hea % 15 < ( this.hea / this.hmax ) * 9 )
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable, - 16, - 16, 32,32 );
				else
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable_detonate, - 16, - 16, 32,32 );
			}
			if ( this.type === sdJunk.TYPE_ALIEN_BATTERY ) // Alien battery
			{
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable2_empty, - 16, - 16, 32,32 );

				if ( this.hea % 15 < ( this.hea / this.hmax ) * 9 )
				{
					ctx.globalAlpha = ( this.matter/this.matter_max );
					ctx.drawImageFilterCache( sdJunk.img_cube_unstable2, - 16, - 16, 32,32 );
				}
				else
				{
					ctx.globalAlpha = 1;
					ctx.drawImageFilterCache( sdJunk.img_cube_unstable2_detonate, - 16, - 16, 32,32 );
				}
			}
			if ( this.type === sdJunk.TYPE_LOST_CONTAINER ) // Lost converter cube barrel
			{
				if ( this.hea % 15 < ( this.hea / this.hmax ) * 9 )
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable3, - 16, - 18, 32,32 );
				else
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable3_detonate, - 16, - 18, 32,32 );
			}
			if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER ) // Large Anti-crystal, drains percentage of matter in active/online players
			{
				ctx.drawImageFilterCache( sdJunk.img_crystal_map_drainer_empty, - 48, - 48, 96, 96 );

				ctx.filter = sdWorld.GetCrystalHue( sdCrystal.anticrystal_value );
				ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;

				ctx.drawImageFilterCache( sdJunk.img_crystal_map_drainer, - 48, - 48, 96, 96 );
			}
			if ( this.type === sdJunk.TYPE_COUNCIL_BOMB ) // Council bomb
			{
				if ( this.detonation_in % this._rate < this._rate / 2 )
				{
					ctx.drawImageFilterCache( sdJunk.img_council_bomb2, 0, 0, 64, 96, - 32, - 48, 64, 96 );
					ctx.globalAlpha = Math.min( 1, this.glow_animation / 30 );
					ctx.filter = ' drop-shadow(0px 0px 8px #FFF000)';
					ctx.drawImageFilterCache( sdJunk.img_council_bomb2, 64, 0, 64, 96, - 32, - 48, 64, 96 );
				}
				else
				{
					ctx.drawImageFilterCache( sdJunk.img_council_bomb, 0, 0, 64, 96, - 32, - 48, 64, 96 );
					ctx.globalAlpha = Math.min( 1, this.glow_animation / 30 );
					ctx.filter = ' drop-shadow(0px 0px 8px #FFF000)';
					ctx.drawImageFilterCache( sdJunk.img_council_bomb, 64, 0, 64, 96, - 32, - 48, 64, 96 );
				}
			}
			if ( this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON ) // Erthal distress beacon
			{
				ctx.drawImageFilterCache( sdJunk.img_erthal_beacon, - 32, - 32, 64, 64 );
			}
			if ( this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER ) // Task reward / Advanced matter container
			{

				ctx.drawImageFilterCache( sdJunk.img_matter_container2_empty, - 32, - 32, 64, 64 );
		
				ctx.filter = sdWorld.GetCrystalHue( -1 );
	
				ctx.globalAlpha = this.matter / this.matter_max;
		
				ctx.drawImageFilterCache( sdJunk.img_matter_container2, - 32, - 32, 64, 64 );
		
			}
			if ( this.type === sdJunk.TYPE_FREEZE_BARREL ) // Freeze barrel
			{
				//if ( this.hea < this.hmax / 2 )
				//ctx.drawImageFilterCache( sdJunk.img_cube_unstable3, - 16, - 18, 32,32 );
				//else
				ctx.drawImageFilterCache( sdJunk.img_freeze_barrel, 0 + ( this.hea < this.hmax / 2 ? 32 : 0 ) , 0, 32, 32, - 16, - 16, 32, 32 );
			}
			if ( this.type === sdJunk.TYPE_ALIEN_ARTIFACT ) // Alien / strange artifact from obelisk
			{
				ctx.drawImageFilterCache( sdJunk.img_alien_artifact, - 16, - 16, 32,32 );
			}
			if ( this.type === sdJunk.TYPE_STEALER_ARTIFACT ) // Alien / strange artifact from stealer
			{
				ctx.drawImageFilterCache( sdJunk.img_stealer_artifact, - 16, - 16, 32,32 );
			}

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
		if ( this.type === sdJunk.TYPE_PLANETARY_MATTER_DRAINER )
		sdJunk.anti_crystals--;

		if ( this.type === sdJunk.TYPE_COUNCIL_BOMB )
		{
			sdJunk.council_bombs--;
			if ( this._broken )
			sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
		}
		if ( this.type === sdJunk.TYPE_ERTHAL_DISTRESS_BEACON )
		{
			sdJunk.erthal_beacons--;
			if ( this._broken )
			sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
		}
		if ( this.type === sdJunk.TYPE_ADVANCED_MATTER_CONTAINER )
		{
			if ( this._broken )
			{
				sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

				sdWorld.DropShards( this.x, this.y, 0, 0, 
					Math.floor( Math.max( 0, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					this.matter_max / 40,
					10
				);

				sdWorld.BasicEntityBreakEffect( this, 10 );
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdJunk.init_class();

export default sdJunk;
