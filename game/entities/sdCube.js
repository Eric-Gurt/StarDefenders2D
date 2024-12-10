
/* global Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdGib from './sdGib.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdLost from './sdLost.js';
import sdTurret from './sdTurret.js';
import sdEnemyMech from './sdEnemyMech.js';
import sdDrone from './sdDrone.js';
import sdSetrDestroyer from './sdSetrDestroyer.js';
import sdSpider from './sdSpider.js';
import sdOverlord from './sdOverlord.js';
import sdBlock from './sdBlock.js';
import sdCrystal from './sdCrystal.js';
import sdCharacter from './sdCharacter.js';
//import sdPlayerSpectator from './sdPlayerSpectator.js';
import sdZektaronDreadnought from './sdZektaronDreadnought.js';


import sdPathFinding from '../ai/sdPathFinding.js';

class sdCube extends sdEntity
{
	static init_class()
	{
		sdCube.img_cube = sdWorld.CreateImageFromFile( 'sdCube' );
		/*
		sdCube.img_cube_idle = sdWorld.CreateImageFromFile( 'cube_idle' );
		sdCube.img_cube_hurt = sdWorld.CreateImageFromFile( 'cube_hurt' );
		sdCube.img_cube_attack = sdWorld.CreateImageFromFile( 'cube_attack' );
		sdCube.img_cube_sleep = sdWorld.CreateImageFromFile( 'cube_sleep' );
		
		sdCube.img_cube_idle3 = sdWorld.CreateImageFromFile( 'cube_idle3' );
		sdCube.img_cube_hurt3 = sdWorld.CreateImageFromFile( 'cube_hurt3' );
		sdCube.img_cube_attack3 = sdWorld.CreateImageFromFile( 'cube_attack3' );
		sdCube.img_cube_sleep3 = sdWorld.CreateImageFromFile( 'cube_sleep3' );
		*/
		
		sdCube.alive_cube_counter = 0;
		sdCube.alive_huge_cube_counter = 0; // 1
		sdCube.alive_white_cube_counter = 0; // 2
		sdCube.alive_pink_cube_counter = 0; // 3
		
		sdCube.death_duration = 10;
		sdCube.post_death_ttl = 90;
		
		sdCube.attack_range = 450;
		
		sdCube.KIND_CYAN = 0;
		sdCube.KIND_YELLOW = 1;
		sdCube.KIND_WHITE = 2;
		sdCube.KIND_PINK = 3;
		sdCube.KIND_GREEN = 4; // Hides cubes within range
		sdCube.KIND_BLUE = 5; // Gives shields to other cubes
		sdCube.KIND_MATTER_STEALER = 6; // Not a cube, but a mater consumer from the anti-crystal event
		sdCube.KIND_ANCIENT = 7; // Orange-ish? cube which acts like cyan, but it's beams deal lost damage
		
		sdCube.hitbox_scale_per_kind = [
			1,
			2,
			3,
			0.6,
			1,
			1.5,
			1,
			// Just in case to prevent bugs from newer versions:
			1,
			1,
			1,
			1,
			1,
			1,
			1,
			1,
			1,
			1,
			1
		];
		
		sdCube.huge_filter = sdWorld.CreateSDFilter();
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.huge_filter, '#00fff6', '#ffff00' );

		sdCube.white_filter = sdWorld.CreateSDFilter(); // For white cubes
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.white_filter, '#00fff6', '#dddddd' );

		sdCube.pink_filter = sdWorld.CreateSDFilter(); // For white cubes
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.pink_filter, '#00fff6', '#ff00ff' );

		sdCube.green_filter = sdWorld.CreateSDFilter(); 
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.green_filter, '#00fff6', '#a7ff88' );

		sdCube.blue_filter = sdWorld.CreateSDFilter();
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.blue_filter, '#00fff6', '#007eff' );
		
		sdCube.ancient_filter = sdWorld.CreateSDFilter();
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.ancient_filter, '#00fff6', '#d6981e' );
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	/*AttacksTeammates()
	{
		return ( this.kind === sdCube.KIND_PINK || this.kind === sdCube.KIND_BLUE );
	}*/
	
	static GetRandomKind()
	{
		let r = Math.random();
		
		if ( r < 0.1 )
		return sdCube.KIND_YELLOW;
		if ( r < 0.1 + 0.04 )
		return sdCube.KIND_WHITE;
		if ( r < 0.1 + 0.04 + 0.14 )
		return sdCube.KIND_PINK;
	
		if ( sdWorld.server_config.EnableForbiddenCubes() ) // Only if server allows it
		{
			// I hate them - EG
			if ( r < 0.1 + 0.04 + 0.14 + 0.1 )
			return sdCube.KIND_GREEN;
			if ( r < 0.1 + 0.04 + 0.14 + 0.1 + 0.1 ) // 0.48
			return sdCube.KIND_BLUE;
		}
		
		return sdCube.KIND_CYAN;
		
		return ~~( Math.random() * 6 );
	}
	
	static GetMaxAllowedCubesOfKind( kind ) // kind of 0 will return total maximum number
	{
		if ( kind === 0 )
		return Math.max( 20, Math.min( sdWorld.GetPlayingPlayersCount() * 5, 40 ) );
	
		if ( kind === 1 ) // yellow
		return sdWorld.GetPlayingPlayersCount() * 1.5;
	
		if ( kind === 2 ) // white
		return 1;
	
		if ( kind === 3 ) // pink
		return 2;
	
		debugger; // Limit is not set for this kind
		return 1; 
	}
	
	get hitbox_x1() { return -5 * sdCube.hitbox_scale_per_kind[ this.kind ]; }
	get hitbox_x2() { return 5 * sdCube.hitbox_scale_per_kind[ this.kind ]; }
	get hitbox_y1() { return -5 * sdCube.hitbox_scale_per_kind[ this.kind ]; }
	get hitbox_y2() { return 5 * sdCube.hitbox_scale_per_kind[ this.kind ]; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( observer_character )
		{
			let px = Math.max( observer_character.x + observer_character._hitbox_x1, Math.min( this.x, observer_character.x + observer_character._hitbox_x2 ) );
			let py = Math.max( observer_character.y + observer_character._hitbox_y1, Math.min( this.y, observer_character.y + observer_character._hitbox_y2 ) );

			if ( sdWorld.Dist2D( px, py, this.x, this.y ) < 32 )
			return true;
		}
		
		return ( this.alpha > 0 );
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._dropped_items = new WeakSet(); // Just so they won't be lost by boss cube
		
		if ( params.tag )
		{
			if ( sdCube[ params.tag ] !== undefined )
			params.kind = sdCube[ params.tag ];
			else
			debugger;
		}
		
		this.regen_timeout = 0;
		this.kind = params.kind || 0;
		//this.is_huge = ( this.kind === sdCube.KIND_YELLOW ) ? true : false;
		//this.is_white = ( this.kind === sdCube.KIND_WHITE ) ? true : false;
		//this.is_pink = ( this.kind === sdCube.KIND_PINK ) ? true : false;
		
		this.hmax = 
				this.kind === sdCube.KIND_WHITE ? 1600 : 
				this.kind === sdCube.KIND_YELLOW ? 800 : 
				this.kind === sdCube.KIND_MATTER_STEALER ? 600 : 
				this.kind === sdCube.KIND_PINK ? 100 : 
				200;
		this.hea = this.hmax;
		
		this._boss_death_ping_timer = 0;
		this._boss_death_pings_left = 0;
		
		this._matter_stealer_passive_boost = 0;
		
		//this.death_anim = 0;
		
		//this._current_target = null;
		
		//this._last_stand_on = null;
		//this._last_jump = sdWorld.time;
		//this._last_bite = sdWorld.time;
		
		this._invisible_until = 0;
		this.alpha = 100; // 0...100
		this.armor = 0;
		this.armor_max = sdCube.hitbox_scale_per_kind[ this.kind ] * 500;
		
		this._move_dir_x = 0;
		this._move_dir_y = 0;
		this._move_dir_timer = 0;
		
		this._attack_timer = 0;
		this.attack_anim = 0;
		//this._aggressive_mode = false; // Causes dodging and faster movement
		this._charged_shots = 3;

		this._teleport_timer = 36;
		
		this._seen_high_level_player_nearby_until = 0;
		
		//this.side = 1;
		
		this._current_target = null; // Mostly related to following
		this._pathfinding = null;
		
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		this.matter_max = (this.kind === sdCube.KIND_WHITE ? 6 : this.kind === sdCube.KIND_YELLOW ? 4 : 1 ) * 160;
		this.matter = this.matter_max;
		
		this._time_amplification = 0;
		
		//this._targets_raw_cache = [];
		//this._targets_raw_cache_until = 0;
		
		sdCube.alive_cube_counter++;
		
		if ( this.kind === sdCube.KIND_YELLOW )
		sdCube.alive_huge_cube_counter++;

		if ( this.kind === sdCube.KIND_WHITE )
		sdCube.alive_white_cube_counter++;

		if ( this.kind === sdCube.KIND_PINK )
		sdCube.alive_pink_cube_counter++;
		
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	/*GetActiveTargetsCache( range, filter_method=null )
	{
		let targets_raw = this._targets_raw_cache;
		
		if ( sdWorld.time > this._targets_raw_cache_until )
		{
			targets_raw.length = 0;
			
			this._targets_raw_cache_until = sdWorld.time + 200 + Math.random() * 200;
			
			// One method can be faster than another, depending on how many active entities there are on server
			if ( sdWorld.entity_classes.sdEntity.active_entities.length > 3933 * 0.28502415458937197 )
			targets_raw = sdWorld.GetAnythingNear( this.x, this.y, range, targets_raw, null, filter_method );
			else
			targets_raw = sdWorld.GetAnythingNearOnlyNonHibernated( this.x, this.y, range, targets_raw, null, filter_method );
		}
		return targets_raw;
	}*/
	SetTarget( ent )
	{
		if ( ent !== this._current_target )
		{
			this._current_target = ent;

			if ( ent )
			this._pathfinding = new sdPathFinding({ target: ent, traveler: this, attack_range: 1000, options: [ sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS, sdPathFinding.OPTION_CAN_SWIM ] });
			else
			this._pathfinding = null;
		}
	}
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( !character.ghosting )
		if ( character.hea > 0 )
		{
			
		}
	}*/
	/*GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}*/
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/
	
	ColorGunAccordingly( gun )
	{
		if ( this.kind === sdCube.KIND_PINK )
		{
			gun.sd_filter = sdWorld.CreateSDFilter();
			gun.sd_filter.s = sdCube.pink_filter.s;
		}
		if ( this.kind === sdCube.KIND_WHITE )
		{
			gun.sd_filter = sdWorld.CreateSDFilter();
			gun.sd_filter.s = sdCube.white_filter.s;
		}
		if ( this.kind === sdCube.KIND_YELLOW )
		{
			gun.sd_filter = sdWorld.CreateSDFilter();
			gun.sd_filter.s = sdCube.huge_filter.s;
		}
		if ( this.kind === sdCube.KIND_ANCIENT )
		{
			gun.sd_filter = sdWorld.CreateSDFilter();
			gun.sd_filter.s = sdCube.ancient_filter.s;
		}
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.kind !== sdCube.KIND_MATTER_STEALER )
		if ( initiator )
		{
			if ( !initiator.IsPlayerClass() )
			if ( ( initiator.owner || initiator._owner ) )
			initiator = ( initiator.owner || initiator._owner );
			
			if ( initiator.IsPlayerClass() )
			{
				initiator._nature_damage += dmg;
			}
		}
	
		//dmg = Math.abs( dmg );
		
		let explode_on_hea = ( this.kind === sdCube.KIND_WHITE ? -2000 : -1000 );
		
		if ( this.kind === sdCube.KIND_MATTER_STEALER )
		explode_on_hea = 0;
		
		if ( this.kind === sdCube.KIND_PINK )
		explode_on_hea = -200;
		
		let was_existing = ( this.hea > explode_on_hea );
		
		let was_alive = this.hea > 0;
		
		if ( dmg < 0 )
		{
			this.hea -= dmg;
			this.hea = Math.min( this.hea, this.hmax ); // Prevent overhealing
		}
		else
		{
			this.armor -= dmg;
			
			this.alpha = Math.max( this.alpha, 50 );

			if ( this.armor < 0 )
			{
				this.hea += this.armor;
				this.armor = 0;

				if ( this.hea > 0 )
				{
					if ( this.regen_timeout < 60 )
					{
						if ( this.kind === sdCube.KIND_MATTER_STEALER )
						sdSound.PlaySound({ name:'notificator_alertE', pitch: 0.5, x:this.x, y:this.y, volume:0.66 });
						else
						sdSound.PlaySound({ name:'cube_hurt', pitch: this.kind === sdCube.KIND_WHITE ? 0.4 : this.kind === sdCube.KIND_YELLOW ? 0.5 : 1, x:this.x, y:this.y, volume:0.66 });
					}
				}

				this.regen_timeout = Math.max( this.regen_timeout, 60 );
			}
			else
			{
				sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
			}
		}
		
		if ( this.hea <= 0 && was_alive )
		{
			this.regen_timeout = 30 * 15; // Stay dead for at least 15 seconds
			
			this._alert_intensity = 0;
			
			if ( this.kind === sdCube.KIND_MATTER_STEALER )
			sdSound.PlaySound({ name:'red_railgun', pitch: 0.5, x:this.x, y:this.y, volume:1.5 });
			else
			sdSound.PlaySound({ name:'cube_offline', pitch: (this.kind === sdCube.KIND_YELLOW || this.kind === sdCube.KIND_WHITE) ? 0.5 : 1, x:this.x, y:this.y, volume:1.5 });
			
			this._boss_death_ping_timer = 0;
			this._boss_death_pings_left = 10;
		}
		
		if ( this.hea <= explode_on_hea && was_existing )
		{
			if ( this.kind === sdCube.KIND_MATTER_STEALER )
			{
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
				
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:70, // 80 was too much?
					damage_scale: 4.5, // 5 was too deadly on relatively far range
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:'#66FF66' 
				});

				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
					Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					sdCrystal.anticrystal_value / 40,
					5,
					undefined,
					undefined,
					null
				);
			}
			else
			{

				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:70, // 80 was too much?
					damage_scale: 4.5, // 5 was too deadly on relatively far range
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:'#33FFFF' 
				});

				//if ( initiator )
				//if ( typeof initiator._score !== 'undefined' )
				{
					if ( this.kind === sdCube.KIND_YELLOW || this.kind === sdCube.KIND_WHITE )
					this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
					else
					this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
				}

				if ( this.kind !== sdCube.KIND_PINK ) // Pink cube is too small to be gibbed
				{
					//sdWorld.SpawnGib( this.x, this.y - ( 6 * this.kind === sdCube.KIND_WHITE ? 3 : this.kind === sdCube.KIND_YELLOW ? 2 : 1 ) , this.sx + Math.random() * 1 - Math.random() * 1, this.sy + Math.random() * 1 - Math.random() * 1, 1, sdGib.CLASS_CUBE_GIB , null, null, this.kind === sdCube.KIND_WHITE ? 300 : this.kind === sdCube.KIND_YELLOW ? 200 : 100, this )
					
					// ( x, y, 
					// sx = Math.random() * 1 - Math.random() * 1, sy = Math.random() * 1 - Math.random() * 1, 
					// side = 1, gib_class, gib_filter, blood_filter = null, scale = 100, ignore_collisions_with=null, image = 0 )
					
					let scale = this.kind === sdCube.KIND_WHITE ? 300 : this.kind === sdCube.KIND_YELLOW ? 200 : 100;
					let image_id = 0;
					
					let offset = 3 * scale / 100;
					
					let image_id_remap = [ 3, 0, 1, 2 ];
			
					for ( let xx = -1; xx <= 1; xx += 2 )
					for ( let yy = -1; yy <= 1; yy += 2 )
					sdWorld.SpawnGib( this.x + xx * offset, this.y + yy * offset, 
						this.sx + Math.random() * 1 - 0.5, this.sy + Math.random() * 1 - 0.5,
						1, sdGib.CLASS_CUBE_GIB, null, null, scale, this, image_id_remap[ image_id++ ] );
				}

				let r = Math.random();

				//console.log( 'CLASS_TRIPLE_RAIL drop chances: ' + r + ' < ' + ( this.kind === sdCube.KIND_YELLOW ? 0.4 : 0.1 ) * 0.25 );

				//if ( r < ( this.kind === sdCube.KIND_YELLOW ? 0.4 : 0.1 ) * 0.5 ) // 0.25 was not enough for some rather strange reason (something like 1 drop out of 55 cube kills that wasn't even noticed by anyone)
				if ( r < ( this.kind === sdCube.KIND_WHITE ? 0.55 : this.kind === sdCube.KIND_YELLOW ? 0.4 : 0.1 ) * 0.6 ) // Higher chance just for some time at least?
				{
					//if ( r < ( this.kind === sdCube.KIND_WHITE ? 0.55 : this.kind === sdCube.KIND_YELLOW ? 0.4 : 0.1 ) * 1 ) // 2x chance of triple rail to drop, only when triple rail does not drop
					// We actually can get a case when sum of both chances becomes something like 0.4 + ( 1 - 0.4 ) * 0.4 = 0.64 chance of dropping anything from big cubes, maybe it could be too high and thus value of guns could become not so valuable
					//{
						let x = this.x;
						let y = this.y;
						let sx = this.sx;
						let sy = this.sy;

						setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

							let random_value = Math.random();

							let gun;

							const probability_lost_converter = 0.075;
							const probability_shotgun = 0.1;
							const probability_triple_rail = 0.233;
							const probability_teleporter = 0.233;
							const probability_lost_triple_rail = 0.075;

							let total_drop_probability = 0; // In else case it is always pistol or healing ray gun

							if ( this.kind === sdCube.KIND_YELLOW ) // yellow
							total_drop_probability += probability_lost_converter + probability_shotgun + probability_triple_rail;
							else
							if ( this.kind === sdCube.KIND_WHITE ) // white
							total_drop_probability += probability_lost_converter + probability_shotgun + probability_triple_rail + probability_teleporter;
							else
							if ( this.kind === sdCube.KIND_ANCIENT ) // ancient
							total_drop_probability += probability_lost_triple_rail;
							else
							total_drop_probability += probability_shotgun + probability_triple_rail;

							if ( random_value < total_drop_probability && this.kind !== sdCube.KIND_PINK )
							{
								if ( this.kind === sdCube.KIND_YELLOW )
								{
									if ( random_value < probability_lost_converter )
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_LOST_CONVERTER });
									else
									if ( random_value < random_value < probability_lost_converter + probability_shotgun )
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_RAIL_SHOTGUN });
									else
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_TRIPLE_RAIL });
								}
								else
								if ( this.kind === sdCube.KIND_WHITE )
								{
									if ( random_value < probability_lost_converter )
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_CUBE_SPEAR });
									else
									if ( random_value < probability_lost_converter + probability_shotgun )
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_RAIL_SHOTGUN });
									else
									if ( random_value < probability_lost_converter + probability_shotgun + probability_teleporter )
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_CUBE_TELEPORTER });
									else
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_TRIPLE_RAIL });
								}
								if ( this.kind === sdCube.KIND_ANCIENT )
								{
									if ( random_value < probability_lost_triple_rail )
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_ANCIENT_TRIPLE_RAIL });
								}
								else
								{
									if ( random_value < probability_shotgun )
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_RAIL_SHOTGUN });
									else
									gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_TRIPLE_RAIL });
								}
							}
							else
							gun = new sdGun({ x:x, y:y, class:this.kind === sdCube.KIND_ANCIENT ? sdGun.CLASS_CUBE_SHARD : this.kind === sdCube.KIND_PINK ? sdGun.CLASS_HEALING_RAY : sdGun.CLASS_RAIL_PISTOL }); // Ancient cubes can drop additional shard instead of pistol

							gun.sx = sx;
							gun.sy = sy;
							//gun.extra = ( this.kind === sdCube.KIND_PINK ? 3 : this.kind === sdCube.KIND_WHITE ? 2 : this.kind === sdCube.KIND_YELLOW ? 1 : 0 ); // Color it

							this.ColorGunAccordingly( gun );

							sdEntity.entities.push( gun );

							this._dropped_items.add( gun );

						}, 500 );
					//}
				}

				r = Math.random(); // Cube shard dropping roll

				if ( r < ( this.kind === sdCube.KIND_WHITE ? 0.85 : this.kind === sdCube.KIND_YELLOW ? 0.7 : 0.25 ) * 0.6 ) // Higher chance just for some time at least?
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
						//gun.extra = (this.kind === sdCube.KIND_PINK ? 3 : this.kind === sdCube.KIND_WHITE ? 2 : this.kind === sdCube.KIND_YELLOW ? 1 : 0 ); // Color it
						this.ColorGunAccordingly( gun );
						sdEntity.entities.push( gun );

						this._dropped_items.add( gun );

					}, 500 );
				}
				
				

				if ( this.kind === sdCube.KIND_WHITE || ( this.kind === sdCube.KIND_YELLOW && Math.random() < 0.5 ) )
				{
					setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

						let gun;
						gun = new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_BUILDTOOL_UPG });
						gun.extra = 0;

						sdEntity.entities.push( gun );
						//sdWorld.UpdateHashPosition( gun, false );
						
						this._dropped_items.add( gun );
					
					}, 500 );
				}
			}
			this.remove();
		}
		
		//if ( this.hea < -this.hmax / 80 * 100 )
		//this.remove();
	}
	
	get mass() { return this.kind === sdCube.KIND_WHITE ? 30*6 : this.kind === sdCube.KIND_YELLOW ? 30*4 : 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1 * ( this.kind === sdCube.KIND_YELLOW ? 0.25 : 1 );
		//this.sy += y * 0.1 * ( this.kind === sdCube.KIND_YELLOW ? 0.25 : 1 );
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	FireDirectionalBeams() // Fire 4 rail beams in 4 different directions - up, down, left and right
	{
		if ( !sdWorld.is_server )
		return;

		let spear_targer_reaction = ( bullet, target_entity )=>
		{
			
			if ( target_entity.is( sdLost ) )
			{
				target_entity.DamageWithEffect( 10, bullet._owner );
			}
			else
			{
				sdWorld.SendEffect({ 
					x: bullet.x, 
					y: bullet.y, 
					radius: 16,
					damage_scale: 0, // Just a decoration effect
					type: sdEffect.TYPE_EXPLOSION, 
					owner: this,
					color: '#aaaaaa'
				});

				sdLost.ApplyAffection( target_entity, 10, bullet, sdLost.FILTER_WHITE );
			}
		};


		let bullet_obj1 = new sdBullet({ x: this.x, y: this.y });
					bullet_obj1._owner = this;
					bullet_obj1.sx = -1;
					bullet_obj1.sy = 0;
					//bullet_obj1.x += bullet_obj1.sx * 5;
					//bullet_obj1.y += bullet_obj1.sy * 5;

					bullet_obj1.sx *= 16;
					bullet_obj1.sy *= 16;
						
					bullet_obj1.time_left = 30;

					bullet_obj1._rail = true;
					bullet_obj1.color = '#888888';

					bullet_obj1._damage = 1;

					bullet_obj1._custom_target_reaction = spear_targer_reaction;

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
					bullet_obj2.color = '#888888';

					bullet_obj2._damage = 1;

					bullet_obj2._custom_target_reaction = spear_targer_reaction;

					sdEntity.entities.push( bullet_obj2 );

		let bullet_obj3 = new sdBullet({ x: this.x, y: this.y });
					bullet_obj3._owner = this;
					bullet_obj3.sx = 1;
					bullet_obj3.sy = 0;
					//bullet_obj3.x += bullet_obj3.sx * 5;
					//bullet_obj3.y += bullet_obj3.sy * 5;

					bullet_obj3.sx *= 16;
					bullet_obj3.sy *= 16;
						
					bullet_obj3.time_left = 30;

					bullet_obj3._rail = true;
					bullet_obj3.color = '#888888';

					bullet_obj3._damage = 1;

					bullet_obj3._custom_target_reaction = spear_targer_reaction;

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
					bullet_obj4.color = '#888888';	

					bullet_obj4._damage = 1;

					bullet_obj4._custom_target_reaction = spear_targer_reaction;

					sdEntity.entities.push( bullet_obj4 );
	}
	TeleportSomewhere(dist = 1, add_x = 0, add_y = 0) // Dist = distance multiplier in direction it's going, add_x is additional X, add_y is additional Y
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.CanMoveWithoutOverlap( this.x + ( this.sx * dist ) + add_x, this.y  + ( this.sy * dist ) + add_y, 0 ) )
		{
			this.x = this.x + ( this.sx * dist ) + add_x;
			this.y = this.y + ( this.sy * dist ) + add_y;
			
			sdSound.PlaySound({ name:'cube_teleport', pitch: ( this.kind === sdCube.KIND_WHITE || this.kind === sdCube.KIND_YELLOW ) ? 0.5 : 1, x:this.x, y:this.y, volume:1 });
		}
	}
	static FilterCubeTargets( e )
	{
		//[ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdTurret', 'sdEnemyMech', 'sdCube', 'sdDrone', 'sdSetrDestroyer', 'sdSpider', 'sdOverlord' ]
		
		if ( e._hiberstate !== sdEntity.HIBERSTATE_ACTIVE )
		return false;
		
		if ( e.is( sdWorld.entity_classes.sdPlayerSpectator ) )
		return false;
		
		return (	e.IsPlayerClass() || 
					e.is( sdTurret ) || 
					e.is( sdEnemyMech ) || 
					e.is( sdCube ) || 
					e.is( sdDrone ) || 
					e.is( sdSetrDestroyer ) || 
					e.is( sdSpider ) || 
					e.is( sdOverlord ) ||
					e.is( sdZektaronDreadnought ) );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		GSPEED = sdGun.HandleTimeAmplification( this, GSPEED );
		
		let GSPEED_MULT = 1;
		
		if ( this.kind === sdCube.KIND_MATTER_STEALER )
		{
			if ( this._matter_stealer_passive_boost > 0 )
			this._matter_stealer_passive_boost = Math.min( 90, Math.max( 0, this._matter_stealer_passive_boost - GSPEED * 0.3 ) );
			
			let boost = Math.min( 1, 1 - this.hea / this.hmax + this._matter_stealer_passive_boost / 90 );
			
			GSPEED_MULT = 0.5 + 8.5 * boost;
		}
	
		GSPEED *= GSPEED_MULT;
		
		if ( this.regen_timeout <= 0 )
		{
			if ( this.hea < this.hmax )
			{
				this.hea = Math.min( this.hea + GSPEED, this.hmax );
			}
		}
		else
		{
			this.regen_timeout = Math.max( this.regen_timeout - GSPEED, 0 );
		}
		
		if ( sdWorld.time > this._invisible_until || this.hea <= 0 )
		this.alpha = Math.min( this.alpha + GSPEED * 3, 100 );
		else
		this.alpha = Math.max( this.alpha - GSPEED * 3, 0 );
		
		let pathfinding_result = null;
		
		// It makes sense to call it at all times because it also handles wall attack logic
		if ( this._current_target )
		pathfinding_result = this._pathfinding.Think( GSPEED );
		
		if ( this.hea <= 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;
		
			if ( this.death_anim < sdCube.death_duration + sdCube.post_death_ttl )
			this.death_anim += GSPEED;
			
			if ( this.kind === sdCube.KIND_WHITE ) // Bosses
			if ( this._boss_death_pings_left > 0 )
			{
				this._boss_death_ping_timer += GSPEED;
				
				this.regen_timeout = 30;
				
				if ( this._boss_death_ping_timer > 45 )
				{
					this._boss_death_ping_timer -= 45;
				
					sdSound.PlaySound({ name:'cube_boss_ping', pitch: 1 - ( 10 - this._boss_death_pings_left ) / 10 * 0.5, x:this.x, y:this.y, volume:1.5 });
					
					this._boss_death_pings_left--;
					
					if ( this._boss_death_pings_left === 0 )
					{
						for ( let t = 0; t < 5; t++ )
						{
							setTimeout( ()=>{
								
								sdWorld.SendEffect({ 
									x:this.x, 
									y:this.y, 
									radius:32 * t + 32,
									damage_scale: 0, // Just a decoration effect
									type:sdEffect.TYPE_EXPLOSION, 
									owner:this,
									color:'#aaaaaa' 
								});

								let nears = sdWorld.GetAnythingNear( this.x, this.y, 32 * t + 32 );
								
								for ( let i = 0; i < nears.length; i++ )
								{
									if ( this._dropped_items.has( nears[ i ] ) )
									{
									}
									else
									{
										// Normally won't lost guns since they have high HP
										sdLost.ApplyAffection( nears[ i ], 200 / 5, null, sdLost.FILTER_WHITE );
									}
								}
							
							}, t * 700 );
							
							this.DamageWithEffect( 10000 );
						}
					}
				}
			}
			
			
			if ( this.kind === sdCube.KIND_MATTER_STEALER )
			this.HungryMatterGlow( 0.01, 100, 0.25 );
			else
			this.MatterGlow( 0.01, 30, GSPEED ); // Glow + cables
		}
		else
		{
			this.MatterGlow( 0.01, 0, GSPEED ); // Only through cables
			
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
			
			if ( sdWorld.is_server )
			{

				if ( this._teleport_timer <= 0 && this.kind === sdCube.KIND_WHITE ) // White cubes can teleport around
				{
					this.TeleportSomewhere( -128 + ( Math.random() * 256), -64 + ( Math.random() * 128 ),  -64 + ( Math.random() * 128 ) );
					this._teleport_timer = 30 + ( Math.random() * 60 );
				}
				else
				{
					this._teleport_timer = Math.max( this._teleport_timer - GSPEED, 0 );
				}
				if ( this._move_dir_timer <= 0 )
				{
					this._move_dir_timer = 15 + Math.random() * 45;

					let closest = null;
					let closest_di = Infinity;
					let closest_di_real = Infinity;

					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					{
						if ( sdWorld.sockets[ i ].character )
						if ( sdWorld.sockets[ i ].character.hea > 0 )
						if ( !sdWorld.sockets[ i ].character._is_being_removed )
						{
							let di = sdWorld.Dist2D( this.x, this.y, sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y );
							let di_real = di;
							
							if ( sdCube.IsTargetFriendly( sdWorld.sockets[ i ].character, this ) )
							di += 1000;
							
							if ( di < closest_di )
							if ( !sdWorld.sockets[ i ].character.is( sdCharacter ) || sdWorld.sockets[ i ].character.build_tool_level >= 5 ) // Do not crowd near new players
							{
								closest_di = di;
								closest_di_real = di_real;
								closest = sdWorld.sockets[ i ].character;
							}
						}
					}
					
					this.SetTarget( closest );

					if ( closest )
					{
						// Get closer
						
						let travel_speed = 3;
						
						if ( closest_di_real < sdCube.attack_range ) // close enough to dodge obstacles
						{
							travel_speed = 1;
						}
						
						if ( pathfinding_result )
						{
							if ( pathfinding_result.attack_target )
							{
								let an = Math.random() * Math.PI * 2;

								this._move_dir_x = Math.cos( an );
								this._move_dir_y = Math.sin( an );
							}
							else
							{
								this._move_dir_x = pathfinding_result.act_x * travel_speed;
								this._move_dir_y = pathfinding_result.act_y * travel_speed;
							}
						}
						else
						{
							let an_desired = Math.atan2( closest.y - this.y, closest.x - this.x ) - 0.5 + Math.random();

							this._move_dir_x = Math.cos( an_desired ) * travel_speed;
							this._move_dir_y = Math.sin( an_desired ) * travel_speed;
						}
					}
					else
					{
						let an = Math.random() * Math.PI * 2;

						this._move_dir_x = Math.cos( an );
						this._move_dir_y = Math.sin( an );
					}
				}
				else
				this._move_dir_timer -= GSPEED;
			}
		
			let v = ( this.attack_anim > 0 ) ? 0.3 : 0.1;

			this.sx += this._move_dir_x * v * GSPEED;
			this.sy += this._move_dir_y * v * GSPEED;

			if ( sdWorld.is_server )
			{
				if ( this._attack_timer <= 0 )
				{
					this._attack_timer = 3;

					let targets_raw = this.GetActiveTargetsCache( sdCube.attack_range, sdCube.FilterCubeTargets );
							//sdWorld.GetAnythingNearOnlyNonHibernated( this.x, this.y, sdCube.attack_range, null, null, sdCube.FilterCubeTargets );

					let targets = [];
					
					if ( pathfinding_result )
					if ( pathfinding_result.attack_target )
					{
						if ( pathfinding_result.attack_target.IsPlayerClass() )
						{
							if ( sdCube.IsTargetFriendly( pathfinding_result.attack_target, this ) )
							{
							}
							else
							{
								// Non-friendly player seen
							}
						}
						else
						{
							// Block or some else obstacle
							if ( this._current_target )
							if ( !sdCube.IsTargetFriendly( this._current_target, this ) )
							targets.push( pathfinding_result.attack_target );
						}
					}

					for ( let i = 0; i < targets_raw.length; i++ )
					{
						let target = targets_raw[ i ];
						
						if ( target._is_being_removed )
						continue;
						
						if ( this.kind === sdCube.KIND_MATTER_STEALER ) // Pink cubes heal friendly entities
						{
							if ( target !== this )
							targets.push( target );
						}
						else
						if ( this.kind === sdCube.KIND_PINK ) // Pink cubes heal friendly entities
						{
							if ( ( target.IsPlayerClass() && target.hea < target.hmax && sdCube.IsTargetFriendly( target, this ) && target._socket ) || // Only with socket
								 ( target.GetClass() === 'sdCube' && target.hea < target.hmax && target !== this ) )
								if ( sdWorld.CheckLineOfSight( this.x, this.y, target.x, target.y, target, [ 'sdCube' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) )
								targets.push( target );
						}
						else
						if ( this.kind === sdCube.KIND_BLUE )
						{
							if ( sdWorld.time < this._seen_high_level_player_nearby_until )
							if ( ( target.GetClass() === 'sdCube' && target.armor < target.armor_max && target !== this ) )
								if ( sdWorld.CheckLineOfSight( this.x, this.y, target.x, target.y, target, [ 'sdCube' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) )
								targets.push( target );
						}
						else
						if ( this.kind === sdCube.KIND_GREEN )
						{
							if ( sdWorld.time < this._seen_high_level_player_nearby_until )
							if ( ( target.GetClass() === 'sdCube' && target.kind !== sdCube.KIND_GREEN && sdWorld.time > target._invisible_until - 2000 && target !== this ) )
								if ( sdWorld.CheckLineOfSight( this.x, this.y, target.x, target.y, target, [ 'sdCube' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) )
								targets.push( target );
						}
						else
						{
							if ( ( target.IsPlayerClass() && target.hea > 0 && !sdCube.IsTargetFriendly( target, this ) ) ||
								 ( target.GetClass() === 'sdTurret' && !sdCube.IsTargetFriendly( target, this ) ) || 
								 ( target.GetClass() === 'sdEnemyMech' && target.hea > 0  && !sdCube.IsTargetFriendly( target, this ) ) ||
								 ( target.GetClass() === 'sdBot' && target.hea > 0  && !sdCube.IsTargetFriendly( target, this ) ) ||
								 ( target.GetClass() === 'sdSpider' && target._hea > 0  && !sdCube.IsTargetFriendly( target, this ) ) ||
								 ( target.GetClass() === 'sdDrone' && target._hea > 0  && !sdCube.IsTargetFriendly( target, this ) ) ||
								 ( target.GetClass() === 'sdOverlord' && target.hea > 0  && !sdCube.IsTargetFriendly( target, this ) ) ||
								 ( target.GetClass() === 'sdSetrDestroyer' && target.hea > 0  && !sdCube.IsTargetFriendly( target, this ) ) ||
								( target.GetClass() === 'sdZektaronDreadnought' && target.hea > 0  && !sdCube.IsTargetFriendly( target, this ) )								 )
							{
								if ( 
										sdWorld.CheckLineOfSight( this.x, this.y, target.x, target.y, target, [ 'sdCube' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) 
										||
										(
											sdWorld.last_hit_entity 
											&& 
											sdWorld.last_hit_entity.is( sdBlock ) 
											&& 
											( 
												sdWorld.last_hit_entity.material === sdBlock.MATERIAL_TRAPSHIELD || 
												sdWorld.last_hit_entity.material === sdBlock.MATERIAL_SHARP 
											)
										)
									)
								targets.push( target );
								else
								{
									//if ( target.GetClass() === 'sdCharacter' )
									if ( target.IsPlayerClass() )
									if ( target._nature_damage >= target._player_damage + ( (this.kind === sdCube.KIND_YELLOW || this.kind === sdCube.KIND_WHITE ) ? 120 : 200 ) ) // Highly wanted by sdCubes in this case
									{
										targets.push( target );
									}
								}
							}
						}
					}
					

					sdWorld.shuffleArray( targets );
					
					for ( let i = 0; i < targets.length; i++ )
					{
						if ( this._alert_intensity < 45 || // Delay attack
							 ( this.regen_timeout > 45 && !this.kind === sdCube.KIND_YELLOW && !this.kind === sdCube.KIND_WHITE ) || 
							 ( this._alert_intensity < 20 && this.kind === sdCube.KIND_ANCIENT ) ) // Hurt stun
						break;

						this.attack_anim = 15;
						
						let targ = targets[ i ];
							
						if ( this.kind === sdCube.KIND_YELLOW && Math.random() > 0.9 )
						{
							setTimeout(()=>
							{
								if ( !this._is_being_removed )
								if ( this.hea > 0 && this._frozen <= 0 ) // Not disabled in time
								{
									let an = Math.atan2( targ.y + ( targ._hitbox_y1 + targ._hitbox_y2 ) / 2 - this.y, targ.x + ( targ._hitbox_x1 + targ._hitbox_x2 ) / 2 - this.x );

									let bullet_obj = new sdBullet({ x: this.x, y: this.y });
									bullet_obj._owner = this;
									bullet_obj.sx = Math.cos( an );
									bullet_obj.sy = Math.sin( an );

									bullet_obj.sx *= 16;
									bullet_obj.sy *= 16;

									//bullet_obj.time_left = 60;
									bullet_obj.time_left = 90; // overriden later

									for ( var p in sdGun.classes[ sdGun.CLASS_LOST_CONVERTER ].projectile_properties )
									bullet_obj[ p ] = sdGun.classes[ sdGun.CLASS_LOST_CONVERTER ].projectile_properties[ p ];
								
									sdEntity.entities.push( bullet_obj );
									
									sdSound.PlaySound({ name:'supercharge_combined2_part2', pitch: 1, x:this.x, y:this.y, volume:1.5 });
								}
							}, 2200 );
							
							this._attack_timer = 30 * 6;
							
							//sdSound.PlaySound({ name:'supercharge_combined2', pitch: 1, x:this.x, y:this.y, volume:1.5 });
							sdSound.PlaySound({ name:'supercharge_combined2_part1', pitch: 1, x:this.x, y:this.y, volume:1.5 });
						}
						else
						{

							let an = Math.atan2( targ.y + ( targ._hitbox_y1 + targ._hitbox_y2 ) / 2 - this.y, targ.x + ( targ._hitbox_x1 + targ._hitbox_x2 ) / 2 - this.x );


							let bullet_obj = new sdBullet({ x: this.x, y: this.y });
							bullet_obj._owner = this;
							bullet_obj.sx = Math.cos( an );
							bullet_obj.sy = Math.sin( an );

							bullet_obj.sx *= 16;
							bullet_obj.sy *= 16;

							bullet_obj.time_left = 60;

							bullet_obj._rail = true;

							bullet_obj._damage = 15;
							
							if ( this.kind === sdCube.KIND_YELLOW || this.kind === sdCube.KIND_WHITE )
							{
								bullet_obj._damage = 18;
							}
							
							if ( this.kind === sdCube.KIND_PINK )
							{
								bullet_obj._damage = -15;
							}
							
							if ( this.kind === sdCube.KIND_BLUE )
							{
								bullet_obj._damage = 0;
								
								bullet_obj._custom_target_reaction = 
								bullet_obj._custom_target_reaction_protected = ( bullet, hit_entity )=>
								{
									if ( hit_entity )
									if ( hit_entity.is( sdCube ) )
									{
										hit_entity.armor = Math.min( hit_entity.armor + 25, hit_entity.armor_max );
									}
								};
							}
							
							if ( this.kind === sdCube.KIND_GREEN )
							{
								bullet_obj._damage = 0;
								
								bullet_obj._custom_target_reaction = 
								bullet_obj._custom_target_reaction_protected = ( bullet, hit_entity )=>
								{
									if ( hit_entity )
									if ( hit_entity.is( sdCube ) )
									if ( hit_entity.kind !== sdCube.KIND_GREEN )
									{
										hit_entity._invisible_until = sdWorld.time + 10000;
									}
								};
							}
							
							bullet_obj.color = ( this.kind === sdCube.KIND_PINK ) ? '#ff00ff' : '#ffffff'; // Cube healing rays are pink to distinguish them from damaging rails
							
							if ( this.kind === sdCube.KIND_ANCIENT ) // Ancient cube fires cyan rails but they deal lost damage instead of regular. Also different color
							{
								let custom_target_reaction = ( bullet, target_entity )=>
								{
									if ( target_entity.is( sdLost ) )
									{
										target_entity.DamageWithEffect( 10, bullet._owner );
									}

									sdLost.ApplyAffection( target_entity, 15, bullet, sdLost.FILTER_WHITE );
								};
								
								bullet_obj._custom_target_reaction = custom_target_reaction;
								bullet_obj._damage = 0;
								bullet_obj.color = '#d6981e';
							}
							
							if ( this.kind === sdCube.KIND_MATTER_STEALER )
							{
								bullet_obj._damage = 8;
								bullet_obj.color = '#00ff00';
								
								sdSound.PlaySound({ name:'red_railgun', pitch: ( 1 + this._charged_shots * 0.1 ) * ( 0.5 + GSPEED_MULT * 0.5 ), x:this.x, y:this.y, volume:0.5 });
							}
							else
							{
								sdSound.PlaySound({ name:'cube_attack', pitch: ( this.kind === sdCube.KIND_WHITE || this.kind === sdCube.KIND_YELLOW ) ? 0.5 : 1, x:this.x, y:this.y, volume:0.5 });
							}

							sdEntity.entities.push( bullet_obj );

							this._charged_shots--;

							if ( this.kind === sdCube.KIND_WHITE )
							this.FireDirectionalBeams();

							if ( this._charged_shots <= 0 )
							{
								this._charged_shots = ( this.kind === sdCube.KIND_WHITE ) ? 5 : 3;
								this._attack_timer = 45;
							}

						}
						
						break;
					}

					if ( targets.length === 0 ) // lower seek rate when no targets around
					this._attack_timer = 25 + Math.random() * 10;
					else
					{
						if ( this._alert_intensity === 0 )
						{
							this._alert_intensity = 0.0001;
							if ( this.kind !== sdCube.KIND_PINK )
							if ( this.kind !== sdCube.KIND_BLUE )
							{
								if ( this.kind === sdCube.KIND_MATTER_STEALER )
								sdSound.PlaySound({ name:'epic_machine_startup', pitch: 1, x:this.x, y:this.y, volume:1 });
								else
								sdSound.PlaySound({ name:'cube_alert2', pitch: this.kind === sdCube.KIND_YELLOW ? 0.5 : 1, x:this.x, y:this.y, volume:1 });
							}
						}
					}
				}
				else
				this._attack_timer -= GSPEED;
			}
		
			if ( this.attack_anim > 0 )
			this.attack_anim = Math.max( 0, this.attack_anim - GSPEED );
		
			this.PhysWakeUp();
		}
		
		if ( this._alert_intensity > 0 )
		if ( this._alert_intensity < 45 )
		{
			this._alert_intensity += GSPEED;
		}
			
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	PlayerIsHooked( character, GSPEED )
	{
		if ( this.kind === sdCube.KIND_MATTER_STEALER )
		this._matter_stealer_passive_boost += GSPEED * 0.6;
		else
		character._nature_damage += GSPEED;
	}
	static IsTargetFriendly( ent, cube=null ) // Assumes _nature_damage and _player_damage are defined properties, thus will work mostly only for sdCharacter
	{
		if ( cube )
		{
			if ( cube.kind === sdCube.KIND_MATTER_STEALER )
			return false;
		}
		
		//if ( ent.GetClass() === 'sdCharacter' )
		if ( ent.IsPlayerClass() || ent.GetClass() === 'sdDrone' || ent.GetClass() === 'sdSpider' || ent.GetClass() === 'sdOverlord')
		if ( ent._nature_damage >= ent._player_damage + 60 )
		return false;

		if ( ent.GetClass() === 'sdTurret' )
		if ( ent._target )
		if ( !ent._target._is_being_removed )
		if ( ent._target.GetClass() === 'sdCube' )
		return false;
		
		if ( ent.GetClass() === 'sdEnemyMech' || ent.GetClass() === 'sdSetrDestroyer' || ent.GetClass() === 'sdZektaronDreadnought' ) // Bosses are targetable by cubes, bosses fight cubes aswell
		return false;
		
		if ( ent.GetClass() === 'sdBot' )
		return false;


		return true;
	}
	
	get title()
	{
		if ( this.kind === sdCube.KIND_MATTER_STEALER )
		return "Matter stealer";
		else
		if ( this.kind === sdCube.KIND_ANCIENT )
		return "Ancient Cube";
		else
		return "Cube";
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
		
		if ( this.kind === sdCube.KIND_YELLOW || this.kind === sdCube.KIND_WHITE || this.kind === sdCube.KIND_MATTER_STEALER )
		this.DrawHealthBar( ctx, undefined, 10 );
	}
	Draw( ctx, attached )
	{
		if ( this.hea > 0 )
		ctx.apply_shading = false;
		
		let xx = 0;
		let yy = 0;

		let draw_blinking_grey_sprite = false;
		
		let scale = sdCube.hitbox_scale_per_kind[ this.kind ];
		
		if ( this.kind === sdCube.KIND_YELLOW )
		{
			ctx.scale( scale, scale );
			ctx.sd_filter = sdCube.huge_filter;
		}

		if ( this.kind === sdCube.KIND_WHITE )
		{
			ctx.scale( scale, scale );
			ctx.sd_filter = sdCube.white_filter;
		}

		if ( this.kind === sdCube.KIND_PINK )
		{
			ctx.sd_filter = sdCube.pink_filter;
			yy = 1;
		}
		
		if ( this.kind === sdCube.KIND_GREEN )
		{
			ctx.scale( scale, scale );
			ctx.sd_filter = sdCube.green_filter;
			yy = 3;
		}
		if ( this.kind === sdCube.KIND_BLUE )
		{
			ctx.scale( scale, scale );
			ctx.sd_filter = sdCube.blue_filter;
			yy = 2;
		}
		if ( this.kind === sdCube.KIND_MATTER_STEALER )
		{
			ctx.scale( scale, scale );
			yy = 4;
		}
		if ( this.kind === sdCube.KIND_ANCIENT )
		{
			ctx.scale( scale, scale );
			ctx.sd_filter = sdCube.ancient_filter;
			//yy = 5; // Reserved for ancient shotgun cube
		}
		
		if ( this.armor > 1000 )
		ctx.filter = 'drop-shadow(0px 0px 2px #ffaaaa) drop-shadow(0px 0px 2px #ffffff) drop-shadow(0px 0px 2px #007eff)';
		else
		if ( this.armor > 500 )
		ctx.filter = 'drop-shadow(0px 0px 2px #ffffff) drop-shadow(0px 0px 2px #007eff)';
		else
		if ( this.armor > 0 )
		ctx.filter = 'drop-shadow(0px 0px 2px #007eff)';
		
		if ( this.hea > 0 )
		{
			if ( this.attack_anim > 0 )
			xx = 3;
			else
			if ( this.regen_timeout > 45 )
			xx = 2;
			else
			{
				xx = 0;

				if ( this.matter < this.matter_max )
				draw_blinking_grey_sprite = true;
			}
		}
		else
		xx = 1;
	
		let observer_character = sdWorld.my_entity;
		
		ctx.globalAlpha = this.alpha / 100;
		
		if ( observer_character )
		{
			let px = Math.max( observer_character.x + observer_character._hitbox_x1, Math.min( this.x, observer_character.x + observer_character._hitbox_x2 ) );
			let py = Math.max( observer_character.y + observer_character._hitbox_y1, Math.min( this.y, observer_character.y + observer_character._hitbox_y2 ) );

			if ( sdWorld.Dist2D( px, py, this.x, this.y ) < 32 )
			{
				ctx.globalAlpha = Math.max( ctx.globalAlpha, 0.5 );
			}
		}

		ctx.drawImageFilterCache( sdCube.img_cube, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );

		if ( draw_blinking_grey_sprite )
		{
			ctx.globalAlpha *= ( 1 - this.matter / this.matter_max ) * ( Math.sin( sdWorld.time / 2000 * Math.PI ) * 0.5 + 0.5 );

			ctx.drawImageFilterCache( sdCube.img_cube, 32,yy * 32, 32,32, -16, -16, 32,32 );
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_filter = null;
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.build_tool_level > 5 )
		this._seen_high_level_player_nearby_until = sdWorld.time + 1000 * 5 * 60;
	}
	
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
				
	onRemoveAsFakeEntity()
	{
		sdCube.alive_cube_counter--;
								
		if ( this.kind === sdCube.KIND_YELLOW )
		sdCube.alive_huge_cube_counter--;

		if ( this.kind === sdCube.KIND_WHITE )
		sdCube.alive_white_cube_counter--;

		if ( this.kind === sdCube.KIND_PINK )
		sdCube.alive_pink_cube_counter--;
	}
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdCube.init_class();

export default sdCube;