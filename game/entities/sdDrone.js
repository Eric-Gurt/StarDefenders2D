
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdGib from './sdGib.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCube from './sdCube.js';
import sdCharacter from './sdCharacter.js';
import sdSpider from './sdSpider.js';
import sdJunk from './sdJunk.js';

import sdPathFinding from '../ai/sdPathFinding.js';

class sdDrone extends sdEntity
{
	static init_class()
	{
		sdDrone.img_drone_falkok = sdWorld.CreateImageFromFile( 'drone_falkok_sprite' );
		sdDrone.img_drone_erthal = sdWorld.CreateImageFromFile( 'drone_erthal' );

		/*
		sdDrone.img_drone_falkok = sdWorld.CreateImageFromFile( 'drone_falkok' );
		sdDrone.img_drone_falkok_attack = sdWorld.CreateImageFromFile( 'drone_falkok_attack' );
		sdDrone.img_drone_falkok_destroyed = sdWorld.CreateImageFromFile( 'drone_falkok_destroyed' );
		*/

		// Maybe we should make sprite sheets too for "sdPlayerDrone"s? - Molis
		sdDrone.img_drone_robot = sdWorld.CreateImageFromFile( 'drone_robot2' );
		sdDrone.img_drone_robot_attack = sdWorld.CreateImageFromFile( 'drone_robot_attack2' );
		sdDrone.img_drone_robot_destroyed = sdWorld.CreateImageFromFile( 'drone_robot_destroyed2' );
		sdDrone.img_drone_robot_hurt = sdWorld.CreateImageFromFile( 'drone_robot_hurt' );

		sdDrone.img_drone_alien = sdWorld.CreateImageFromFile( 'drone_alien_sprite' );
		sdDrone.img_drone_alien2 = sdWorld.CreateImageFromFile( 'drone_alien2_sprite' );

		/*
		sdDrone.img_drone_alien = sdWorld.CreateImageFromFile( 'drone_alien' );
		sdDrone.img_drone_alien_attack = sdWorld.CreateImageFromFile( 'drone_alien_attack' );
		sdDrone.img_drone_alien_destroyed = sdWorld.CreateImageFromFile( 'drone_alien_destroyed' );


		sdDrone.img_drone_alien2 = sdWorld.CreateImageFromFile( 'drone_alien2' );
		sdDrone.img_drone_alien2_attack = sdWorld.CreateImageFromFile( 'drone_alien2_attack' );
		sdDrone.img_drone_alien2_destroyed = sdWorld.CreateImageFromFile( 'drone_alien2_destroyed' );
		*/

		sdDrone.img_drone_alien3 = sdWorld.CreateImageFromFile( 'drone_alien3' );
		//sdDrone.img_drone_alien3_attack = sdWorld.CreateImageFromFile( 'drone_alien3_attack' );
		//sdDrone.img_drone_alien3_destroyed = sdWorld.CreateImageFromFile( 'drone_alien3_destroyed' );

		sdDrone.img_drone_council = sdWorld.CreateImageFromFile( 'drone_council_sprite' );
		sdDrone.img_drone_setr = sdWorld.CreateImageFromFile( 'drone_setr_sprite' );

		sdDrone.img_drone_tzyrg = sdWorld.CreateImageFromFile( 'drone_tzyrg_sprite' ); // By floor/flora
		sdDrone.img_drone_tzyrg2 = sdWorld.CreateImageFromFile( 'drone_tzyrg2_sprite' ); // By floor/flora

		/*
		sdDrone.img_drone_council = sdWorld.CreateImageFromFile( 'drone_council' );
		sdDrone.img_drone_council_attack = sdWorld.CreateImageFromFile( 'drone_council_attack' );
		sdDrone.img_drone_council_destroyed = sdWorld.CreateImageFromFile( 'drone_council_destroyed' );

		sdDrone.img_drone_setr = sdWorld.CreateImageFromFile( 'drone_setr' );
		sdDrone.img_drone_setr_attack = sdWorld.CreateImageFromFile( 'drone_setr_attack' );
		sdDrone.img_drone_setr_destroyed = sdWorld.CreateImageFromFile( 'drone_setr_destroyed' );

		sdDrone.img_drone_tzyrg = sdWorld.CreateImageFromFile( 'drone_tzyrg' ); // By floor/flora
		sdDrone.img_drone_tzyrg_attack = sdWorld.CreateImageFromFile( 'drone_tzyrg_attack' ); // By floor/flora
		sdDrone.img_drone_tzyrg_destroyed = sdWorld.CreateImageFromFile( 'drone_tzyrg_destroyed' ); // By floor/flora


		sdDrone.img_drone_tzyrg2 = sdWorld.CreateImageFromFile( 'drone_tzyrg2' ); // By floor / flora
		sdDrone.img_drone_tzyrg2_attack = sdWorld.CreateImageFromFile( 'drone_tzyrg2_attack' ); // By floor / flora
		sdDrone.img_drone_tzyrg2_destroyed = sdWorld.CreateImageFromFile( 'drone_tzyrg2_destroyed' ); // By floor / flora
		*/
		
		sdDrone.death_duration = 15;
		sdDrone.post_death_ttl = 30 * 10;
		
		sdDrone.max_seek_range = 1000;
		
		sdDrone.drones_tot = 0;

		sdDrone.DRONE_FALKOK = 1;
		sdDrone.DRONE_ERTHAL = 2;
		sdDrone.DRONE_SARRORIAN = 3;
		sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER = 4;
		sdDrone.DRONE_SARRORIAN_DETONATOR = 5;
		sdDrone.DRONE_COUNCIL = 6;
		sdDrone.DRONE_SETR = 7;
		sdDrone.DRONE_TZYRG = 8;
		sdDrone.DRONE_TZYRG_WATCHER = 9;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( this.type === sdDrone.DRONE_SARRORIAN || this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER || this.type === sdDrone.DRONE_TZYRG_WATCHER ) ? -11 : this.type === sdDrone.DRONE_FALKOK ? -10 : -6; }
	get hitbox_x2() { return ( this.type === sdDrone.DRONE_SARRORIAN || this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER || this.type === sdDrone.DRONE_TZYRG_WATCHER ) ? 11 : this.type === sdDrone.DRONE_FALKOK ? 10 : 6; }
	get hitbox_y1() { return ( this.type === sdDrone.DRONE_SARRORIAN || this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER || this.type === sdDrone.DRONE_TZYRG_WATCHER ) ? -11 : this.type === sdDrone.DRONE_FALKOK ? -10 : -6; }
	get hitbox_y2() { return ( this.type === sdDrone.DRONE_SARRORIAN || this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER || this.type === sdDrone.DRONE_TZYRG_WATCHER ) ? 11 : this.type === sdDrone.DRONE_FALKOK ? 10 : 6; }
	
	get hard_collision() // For world geometry where players can walk
	{ return ( this.death_anim === 0 ); }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		//this._collision = true;
		
		this.type = params.type || 1;
		
		this._hmax =  this.type === sdDrone.DRONE_SETR ? 300 : this.type === sdDrone.DRONE_COUNCIL ? 200 : this.type === sdDrone.DRONE_SARRORIAN_DETONATOR ? 100 : this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER ? 850 : this.type === sdDrone.DRONE_SARRORIAN ? 600 : this.type === sdDrone.DRONE_TZYRG_WATCHER ? 500 : this.type === sdDrone.DRONE_FALKOK ? 130 : 100; // TYPE=1: 1 shot for regular railgun but 2 for mech one, TYPE=2: 1 shot from any railgun
		this._hea = this._hmax;
		this._ai_team = params._ai_team || 1;

		this.attack_an = 0;
		this.death_anim = 0;
		
		this._current_target = null;
		this._pathfinding = null;
		
		this.hurt_timer = 0;

		this._attack_timer = 0;
		this._burst_ammo_start = this.type === sdDrone.DRONE_ERTHAL ? 6 : 0;
		this._burst_ammo = this._burst_ammo_start;
		this._burst_reload = this.type === sdDrone.DRONE_ERTHAL ? 2 : 0; // Reload time when it's burst firing

		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_attack = sdWorld.time;

		this._nature_damage = 0; // For cubes to attack drones
		this._player_damage = 0;

		this._summon_ent_count = 3; // How much entities is ( a specific drone) allowed to create?
		
		this.side = 1;
		
		this.attack_frame = 0;
		
		this._anim_shift = ~~( Math.random() * 10000 );

		this._ignore_collisions_with = null; // Used by Sarrorian Detonators to pass through Detonator Containers.

		
		if ( this.type !== sdDrone.DRONE_SARRORIAN_DETONATOR ) // Detonators don't count towards drone count
		sdDrone.drones_tot++;
		this.SetMethod( 'CollisionFiltering', this.CollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
	}

	CollisionFiltering( from_entity )
	{
		if ( from_entity.IsBGEntity() !== this.IsBGEntity() || !from_entity._hard_collision )
		return false;
		
		return ( this._ignore_collisions_with !== from_entity );
	}
	
	SetTarget( ent )
	{
		if ( ent !== this._current_target )
		{
			this._current_target = ent;

			if ( ent )
			this._pathfinding = new sdPathFinding({ target: ent, traveler: this, attack_range: 240, options: [ sdPathFinding.OPTION_CAN_FLY, sdPathFinding.OPTION_CAN_GO_THROUGH_WALLS, sdPathFinding.OPTION_CAN_SWIM ] });
			else
			this._pathfinding = null;
		}
	}
	CanAttackEnt( ent )
	{
		if ( this._current_target === ent )
		return true;

		if ( this._ai_team === 1 || this._ai_team === 6 || this._ai_team === 7 || this._ai_team === 8 ) // Falkok, Council, Setr and Tzyrg drones
		return true;
		if ( this._ai_team === 2 ) // Erthal drones
		{
			if ( ent._ai_team === 2 )
			return false;
			else
			{
				if ( ent._ai_team === 0 && ent.matter < 200 && this._current_target !== ent )
				return false;
				else
				{
				this._current_target === ent;
				return true;
				}
			}
		}
		if ( this._ai_team === 4 ) // Sarronian drones
		{
			if ( ent._ai_team === 4  )
			return false;
			else
			{
				if ( ent._ai_team === 0 && ent.matter < 400 && this._current_target !== ent )
				return false;
				else
				{
					this._current_target === ent;
					return true;
				}
			}
		}

	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.driver_of )
		character = character.driver_of;
		
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( ( character.hea || character._hea ) > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdDrone.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				if ( this.CanAttackEnt( character ) )
				{
					//this._current_target = character;
					this.SetTarget( character );
				
					if ( this.type === sdDrone.DRONE_ERTHAL )
					sdSound.PlaySound({ name:'spider_welcomeC', x:this.x, y:this.y, volume: 1, pitch:2 });
				}
			}
		}
	}

	GetBleedEffect()
	{
		if ( this.type === sdDrone.DRONE_ERTHAL )
		return sdEffect.TYPE_BLOOD_GREEN;
		else
		return sdEffect.TYPE_WALL_HIT;
	
	}
	
	GetBleedEffectHue()
	{
		if ( this.type === sdDrone.DRONE_ERTHAL )
		return 100; // Blue
	
		return 0;
	}
	GetBleedEffectFilter()
	{
		//if ( this.type === sdDrone.DRONE_ERTHAL )
		//return 'hue-rotate(100deg)'; // Blue
	
		return '';
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( this.type === sdDrone.DRONE_ERTHAL )
		if ( initiator.is( sdSpider ) || ( initiator.is( sdDrone ) && initiator.type === 2 ) )
		return;
	

		if ( initiator )
		{
			if ( !initiator.is( sdDrone ) && initiator._ai_team !== this._ai_team )
			if ( !initiator.IsPlayerClass() && initiator._ai_team !== this._ai_team )
			{
				//this._current_target = initiator;
				this.SetTarget( initiator );
			}
			else
			if ( ( initiator.is( sdSpider ) || initiator.is( sdDrone ) || initiator.IsPlayerClass() ) && initiator._ai_team !== this._ai_team )
			{
				//this._current_target = initiator;
				this.SetTarget( initiator );
			}
		}

		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;


		if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
		{
			let hp_current_mod = this._hea % 1000;
			let hp_after_mod = ( this._hea - dmg) % 1000;
			if ( hp_current_mod > hp_after_mod )
			this._summon_ent_count = 3;
		}
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			//if ( initiator )
			{
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_AVERAGE_MOB );
			}
	
			if ( this.type === sdDrone.DRONE_FALKOK || this.type === sdDrone.DRONE_COUNCIL || this.type === sdDrone.DRONE_SETR || this.type === sdDrone.DRONE_TZYRG || this.type === sdDrone.DRONE_TZYRG_WATCHER )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 25, 
				damage_scale: 2 , 
				type:sdEffect.TYPE_EXPLOSION,
				armor_penetration_level: 0,
				owner:this,
				color:sdEffect.default_explosion_color
				});

			if ( dmg >= this._hmax * 0.5 && this.type === sdDrone.DRONE_FALKOK ) // Instagib, splits drone into 2 parts ( if you weapon deals enough damage )
			{
				sdWorld.SpawnGib( this.x, this.y + 5, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_DRONE_PARTS , '', '', 100, this );
				sdWorld.SpawnGib( this.x, this.y - 5, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_FALKOK_DRONE_PARTS , '', '', 100, this, 1 );
				this.remove();
			}
			}
			if ( this.type === sdDrone.DRONE_ERTHAL )
			{
				this.sx -= this.side * 2;
				this.sy -= 2;
				
				sdSpider.StartErthalDrop( this, 0.8 );
			
				sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:2 });
			}
			else
			if ( this.type === sdDrone.DRONE_SARRORIAN || this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 50, 
				damage_scale: 1,
				type:sdEffect.TYPE_EXPLOSION,
				armor_penetration_level: 0,
				owner:this,
				color:sdEffect.default_explosion_color
				});
			}
			if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR ) // These are suicide bomber drones basically, lethal drones
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius: 15, 
				damage_scale: 15,
				type:sdEffect.TYPE_EXPLOSION,
				armor_penetration_level: 0,
				owner:this,
				color:sdEffect.default_explosion_color
				});
			}
			if ( Math.random() < 0.2 ) // 20% chance to drop a metal shard on destruction
			{
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun;
					if ( this.type === sdDrone.DRONE_SARRORIAN || this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_ALIEN_ENERGY_RIFLE });
					else
					gun = new sdGun({ x: this.x, y:this.y, class:sdGun.CLASS_METAL_SHARD });

					gun.sx = this.sx + Math.random() - Math.random();
					gun.sy = this.sy + Math.random() - Math.random();
					sdEntity.entities.push( gun );

				}, 500 );
			}
		}
		else
		{
			if ( this.type === sdDrone.DRONE_ERTHAL )
			if ( this._hea > 0 )
			{
				if ( this.hurt_timer <= 0 )
				{
					sdSound.PlaySound({ name:'spider_hurtC', x:this.x, y:this.y, volume: 1, pitch:1 });
					
					this.hurt_timer = 5;
				}
			}
		}
		
		if ( this._hea < -600 || this._hea < 0 && this.type === sdDrone.DRONE_SARRORIAN_DETONATOR )
		this.remove();
	}
	get mass() { return 500; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 15 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		let pathfinding_result = null;
			
		if ( this._hea <= 0 )
		{
			//this.attack_an += this.sx / 6;
			this.attack_an += -this.sx * 20 * GSPEED * this.side;

			if ( this.death_anim < sdDrone.death_duration + sdDrone.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		{

			// It makes sense to call it at all times because it also handles wall attack logic
			if ( this._current_target )
			if ( this._pathfinding )
			pathfinding_result = this._pathfinding.Think( GSPEED );
			
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdDrone.max_seek_range + 32 )
				{
					//this._current_target = null;
					this.SetTarget( null );
				}
				else
				{
					if ( this.attack_frame < 1 ) // Not attacking
					this.side = ( this._current_target.x > this.x ) ? 1 : -1;

					if ( this._last_jump < sdWorld.time - 200 )
					//if ( this._last_stand_on )
					//if ( in_water )
					{
						this._last_jump = sdWorld.time;

						//let dx = ( this._current_target.x + ( this._current_target.sx || 0 ) * 10 - this.x - this.sx * 10 );
						//let dy = ( this._current_target.y + ( this._current_target.sy || 0 ) * 10 - this.y - this.sy * 10 );
						
						let dx = 0;
						let dy = 0;
						
						if ( pathfinding_result && pathfinding_result.attack_target === this._current_target )
						{
							dx = ( this._current_target.x + ( this._current_target.sx || 0 ) * 10 - this.x - this.sx * 10 );
							dy = ( this._current_target.y + ( this._current_target.sy || 0 ) * 10 - this.y - this.sy * 10 );
						}
						else
						if ( pathfinding_result )
						{
							dx = pathfinding_result.act_x;
							dy = pathfinding_result.act_y;
							
							dx += Math.random() * 0.25 - 0.125;
							dy += Math.random() * 0.25 - 0.125;
						}

						// Bad formula but whatever
						//dx += Math.random() * 40 - 20;
						//dy += -Math.random() * 20;
						//dx += Math.random() * 0.25 - 0.125;
						//dy += Math.random() * 0.25 - 0.125;

						let di = sdWorld.Dist2D_Vector( dx, dy );
						if ( di > 2 )
						{
							dx /= di;
							dy /= di;

							if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR )
							{
								if ( di > 100 )
								{
									dx *= 1.2;
									dy *= 1.2;
								}
								else
								if ( di < 50 ) // When closing in, increase speed of the suicide bomber drone
								{
									dx *= 3;
									dy *= 3;
								}
								else
								{
									dx *= 2;
									dy *= 2;
								}
							}

							if ( this.type !== 5 )
							if ( di < 100 + Math.random() * 100 )
							{
								dx *= -0.2;
								dy *= -0.2;
							}
						}

						this.sx += dx;
						this.sy += dy;

						//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
						//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );

						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
			else
			{
				// No target
				if ( sdWorld.is_server )
				for ( let i = 0; i < sdWorld.sockets.length; i++ )
				{
					if ( sdWorld.sockets[ i ].character )
					if ( sdWorld.sockets[ i ].character.hea > 0 )
					if ( !sdWorld.sockets[ i ].character._is_being_removed )
					//if ( sdWorld.sockets[ i ].character.IsVisible( this ) )
					{

						let dx = ( sdWorld.sockets[ i ].character.x + Math.random() * 1000 - 500 - this.x );
						let dy = ( sdWorld.sockets[ i ].character.y + Math.random() * 1000 - 500 - this.y );

						let di = sdWorld.Dist2D_Vector( dx, dy );

						if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 4 )
						if ( di > 1 )
						{
							this.sx += dx / di * 0.2;
							this.sy += dy / di * 0.2;

							//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
							//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );

							break;
						}
					}
				}
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
		}
		
		if ( this.death_anim === 0 )
		{
			if ( this._attack_timer > 0 )
			this._attack_timer -= GSPEED;
			//else
			//if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR )
			//if ( this.CanMoveWithoutOverlap( this.x, this.y, 0 ) )
			//this._collision = true;

			if ( this.hurt_timer > 0 )
			this.hurt_timer = Math.max( 0, this.hurt_timer - GSPEED );

			if ( this.attack_frame > 0 )
			this.attack_frame = Math.max( 0, this.attack_frame - GSPEED * 0.1 );
			else
			if ( sdWorld.is_server )
			if ( this._current_target )
			{
				let dx = this._current_target.x - this.x;
				let dy = this._current_target.y - this.y;
				if ( this.type !== 6 )
				this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
			}

			
			//if ( this.sy > 0 )
			/*if ( !this.CanMoveWithoutOverlap( this.x, this.y + 48, 0 ) )
			{
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.8, GSPEED ); // Slowdown
				this.sy -= 0.4 * GSPEED; // More than gravity
			}*/
		
			if ( this._current_target )
			{
				// Doodging
				if ( this.type === sdDrone.DRONE_ERTHAL )
				{
					if ( this._current_target.IsPlayerClass() )
					if ( Math.random() < 0.3 || ( 
						this._current_target._inventory[ this._current_target.gun_slot ] && 
						!sdGun.classes[ this._current_target._inventory[ this._current_target.gun_slot ].class ].is_sword && 
						this._current_target._key_states.GetKey( 'Mouse1' ) ) )
					{
						let ray_x = this._current_target.look_x - this._current_target.x;
						let ray_y = this._current_target.look_y - this._current_target.y;
						let ray_di = sdWorld.Dist2D_Vector( ray_x, ray_y );
						if ( ray_di > 1 )
						{
							ray_x /= ray_di;
							ray_y /= ray_di;

							let point = sdWorld.TraceRayPoint( this._current_target.x, this._current_target.y, this._current_target.x + ray_x * 1000, this._current_target.y + ray_y * 1000, this._current_target, null, sdCom.com_visibility_unignored_classes_plus_erthals, null );

							if ( point )
							{
								let di = sdWorld.inDist2D( point.x, point.y, this.x, this.y, 32 );
								if ( di > 0 )
								{
									let dx = this.x - point.x;
									let dy = this.y - point.y;
									if ( di > 0.1 )
									{
										dx /= di;
										dy /= di;
									}
									this.sx += dx * 0.1 * GSPEED;
									this.sy += dy * 0.1 * GSPEED;
								}
							}
						}
					}
				}
				
				if ( this._attack_timer <= 0 )
				{
					this._last_attack = sdWorld.time; // So it is not so much calc intensive

					let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 240, null, [ 'sdCharacter', 'sdPlayerDrone', 'sdDrone', 'sdEnemyMech', 'sdSpider' ] );
					let from_entity;

					let nears = [];
					for ( var i = 0; i < nears_raw.length; i++ )
					{
						from_entity = nears_raw[ i ];

						if ( ( ( from_entity.IsPlayerClass() && from_entity._ai_team !== this._ai_team || this._current_target === from_entity ) && ( from_entity.hea || from_entity._hea ) > 0 ) )
						{
							let rank = Math.random() * 0.1;

							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdDrone' && from_entity._ai_team !== this._ai_team )
						{
							let rank = Math.random() * 0.1;

							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdSpider' && from_entity._ai_team !== this._ai_team )
						{
							let rank = Math.random() * 0.1;

							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
						if ( from_entity.GetClass() === 'sdEnemyMech' && from_entity._ai_team !== this._ai_team )
						{
							let rank = Math.random() * 0.1;

							nears.push( { ent: from_entity, rank: rank, ignore_line_of_sight: false } );
						}
					}

					nears.sort((a,b)=>{
						return b.rank - a.rank;
					});

					//sdWorld.shuffleArray( nears );

					//let hits_left = 4;
					
					if ( pathfinding_result && pathfinding_result.attack_target )
					{
						nears.push( { ent: pathfinding_result.attack_target, rank: 0, ignore_line_of_sight: true } ); // Not a priority usually
					}

					for ( var i = 0; i < nears.length; i++ )
					{
						from_entity = nears[ i ].ent;

						let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
						let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

						if ( nears[ i ].ignore_line_of_sight || sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
						{
							let dx = xx - this.x;
							let dy = yy - this.y;

							let di = sdWorld.Dist2D_Vector( dx, dy );

							//dx += ( from_entity.sx || 0 ) * di / 12;
							//dy += ( from_entity.sy || 0 ) * di / 12;

							di = sdWorld.Dist2D_Vector( dx, dy );

							if ( di > 1 )
							{
								dx /= di;
								dy /= di;
							}

							this.side = ( dx > 0 ) ? 1 : -1;
							if ( this.type !== 6 )
							this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;

							//this.an = Math.atan2( this._target.y + this._target.sy * di / vel - this.y, this._target.x + this._target.sx * di / vel - this.x ) * 100;

							//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:0.33, pitch:2.8 });
							if ( this.type === sdDrone.DRONE_FALKOK  ) // Falkok drones
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 15;
								bullet_obj.color = '#ff0000';


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
								this._attack_timer = 7;

								sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:5 });
							}
							if ( this.type === sdDrone.DRONE_ERTHAL  ) // Erthal drones
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 18;
								bullet_obj.sy *= 18;

								bullet_obj._damage = 10; // 15 was too deadly
								bullet_obj.color = '#00aaff';


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								this._burst_ammo--;
								if ( this._burst_ammo > 0 )
								this._attack_timer = this._burst_reload;
								else
								{
									this._attack_timer = 35;
									this._burst_ammo = this._burst_ammo_start;
								}

								sdSound.PlaySound({ name:'spider_attackC', x:this.x, y:this.y, volume:0.33, pitch:6 });
							}
							if ( this.type === sdDrone.DRONE_SARRORIAN )
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 20;
								bullet_obj.color = '#ffc080';
								bullet_obj.explosion_radius = 32;
								bullet_obj.model = 'ball_orange';


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 3;
								this._attack_timer = 65;

								sdSound.PlaySound({ name:'gun_spark', x:this.x, y:this.y, volume:1.25, pitch:0.5 });
							}
							if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
							{
								let drone = new sdDrone({ x: this.x, y: this.y, type: sdDrone.DRONE_SARRORIAN_DETONATOR, _ai_team: this._ai_team });

								drone.sx = dx;
								drone.sy = dy;
								drone.x += drone.sx * 5;
								drone.y += drone.sy * 5;
								drone._ignore_collisions_with = this; // Make sure it can pass through the detonator container 

								sdEntity.entities.push( drone );

								this.attack_frame = 6;
								this._attack_timer = 90;
								//this._collision = false;

								sdSound.PlaySound({ name:'gun_spark', x:this.x, y:this.y, volume:1.25, pitch:0.1 });

								//this._summon_ent_count--;
							
							}
							if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR ) // Detonate if in proximity
							{
								if ( di < 32 )
								this.DamageWithEffect( 1000 );
							}
							if ( this.type === sdDrone.DRONE_COUNCIL ) // Council support drones, heal and repair the council + council bomb which makes them a priority target
							{
								this._attack_timer = 60;
								let entities = sdWorld.GetAnythingNear( this.x, this.y, 128, null, [ 'sdCharacter', 'sdJunk', 'sdCouncilMachine' ] );
								let att_anim = false;
								for ( let i = 0; i < entities.length; i++ )
								{
									if ( entities[ i ].GetClass() === 'sdCharacter' ) // Is it a character?
									{
										if ( entities[ i ]._ai_team === 3 ) // Does it belong to Council faction?
										{
											if ( entities[ i ].hea < entities[ i ].hmax ) // Is it missing armor?
											{
												entities[ i ].hea = Math.min( entities[ i ].hea + 250, entities[ i ].hmax ); // In that case, repair their armor
												att_anim = true;
												sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#fff000' });
											}
										}
										else
										if ( sdWorld.CheckLineOfSight( this.x, this.y, entities[ i ].x, entities[ i ].y, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
										{
												entities[ i ].DamageWithEffect( 30, this ); // Damage it
												if ( entities[ i ].ghosting )
												entities[ i ].TogglePlayerGhosting(); // And remove it's invisibility
												att_anim = true;
												sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y , type:sdEffect.TYPE_BEAM, color:'#ff0000' });
										}
									}
									if ( entities[ i ].GetClass() === 'sdJunk' ) // Is it a junk entity?
									{
										if ( entities[ i ].type === 4 ) // Is it a council bomb?
										if ( entities[ i ].hea < entities[ i ].hmax ) // Does it need repairing?
										{
											entities[ i ].hea = Math.min( entities[ i ].hea + 600, entities[ i ].hmax ); // In that case, repair the bomb
											att_anim = true;
											sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#fff000' });
										}
									}
									if ( entities[ i ].GetClass() === 'sdCouncilMachine' ) // Council portal machine?
									{
										if ( entities[ i ].hea < entities[ i ].hmax ) // Does it need repairing?
										{
											entities[ i ].hea = Math.min( entities[ i ].hea + 600, entities[ i ].hmax ); // In that case, repair the machine
											att_anim = true;
											sdWorld.SendEffect({ x:this.x, y:this.y, x2:entities[ i ].x, y2:entities[ i ].y, type:sdEffect.TYPE_BEAM, color:'#fff000' });
										}
									}
								}
								if ( att_anim === true )
								{
									this.attack_frame = 2;
								}
							}
							if ( this.type === sdDrone.DRONE_SETR ) // Setr drones
							if ( sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) < 128 )
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 20;
								bullet_obj.color = '#0000c8';
								bullet_obj._rail = true;
								bullet_obj._knock_scale = 3; // Low damage, high knockback
								bullet_obj._dirt_mult = 10; // For easier digging blocks when pathfinding
								bullet_obj.time_left = 10;


								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
								this._attack_timer = 37;

								sdSound.PlaySound({ name:'gun_railgun', x:this.x, y:this.y, volume:0.33, pitch:5 });
							}
							if ( this.type === sdDrone.DRONE_TZYRG ) // Tzyrg drones
							{
								let bullet_obj = new sdBullet({ x: this.x - ( Math.sin( this.attack_an ) * 3 ) , y: this.y + ( Math.cos( this.attack_an ) * 3 ) });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 3;
								bullet_obj.y += bullet_obj.sy * 3;

								bullet_obj.sx *= 12;
								bullet_obj.sy *= 12;

								bullet_obj._damage = 15;


								sdEntity.entities.push( bullet_obj );

								let bullet_obj2 = new sdBullet({ x: this.x + ( Math.sin( this.attack_an ) * 3 ) , y: this.y - ( Math.cos( this.attack_an ) * 3 ) });

								bullet_obj2._owner = this;

								bullet_obj2.sx = dx;
								bullet_obj2.sy = dy;
								bullet_obj2.x += bullet_obj2.sx * 3;
								bullet_obj2.y += bullet_obj2.sy * 3;

								bullet_obj2.sx *= 12;
								bullet_obj2.sy *= 12;

								bullet_obj2._damage = 15;


								sdEntity.entities.push( bullet_obj2 );

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
								this._attack_timer = 14;

								sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.5, pitch:4 });
							}
							if ( this.type === sdDrone.DRONE_TZYRG_WATCHER ) // Tzyrg watcher
							{
								for ( let i = 0; i < 5; i++ )
								{
									let bullet_obj = new sdBullet({ x: this.x, y: this.y });

									bullet_obj._owner = this;

									bullet_obj.sx = dx;
									bullet_obj.sy = dy;
									bullet_obj.x += bullet_obj.sx * 3;
									bullet_obj.y += bullet_obj.sy * 3;

									bullet_obj.sx *= 12 + Math.random() * 8 - Math.random() * 8;
									bullet_obj.sy *= 12 + Math.random() * 8 - Math.random() * 8;

									bullet_obj._damage = 15;


									sdEntity.entities.push( bullet_obj );
								}

								this.attack_frame = 2;
								//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
								this._attack_timer = 24;

								sdSound.PlaySound({ name:'gun_shotgun', x:this.x, y:this.y, pitch:1.25 });
							}
							break;
						}
					}
				}
			}
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		
		if ( this._ignore_collisions_with === null )
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1 );
		else
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, this.CollisionFiltering );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		{
			if ( this.type === sdDrone.DRONE_FALKOK )
			sdEntity.Tooltip( ctx, "Falkok Drone" );
			if ( this.type === sdDrone.DRONE_ERTHAL )
			sdEntity.Tooltip( ctx, "Erthal Drone" );
			if ( this.type === sdDrone.DRONE_SARRORIAN )
			sdEntity.Tooltip( ctx, "Sarronian Fighter E3" );
			if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
			sdEntity.Tooltip( ctx, "Sarronian Carrier D7" );
			if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR )
			sdEntity.Tooltip( ctx, "Sarronian Detonator D7" );
			if ( this.type === sdDrone.DRONE_COUNCIL )
			sdEntity.Tooltip( ctx, "Council Support Drone" );
			if ( this.type === sdDrone.DRONE_SETR )
			sdEntity.Tooltip( ctx, "Setr Drone" );
			if ( this.type === sdDrone.DRONE_TZYRG )
			sdEntity.Tooltip( ctx, "Tzyrg Drone" );
			if ( this.type === sdDrone.DRONE_TZYRG_WATCHER )
			sdEntity.Tooltip( ctx, "Tzyrg Watcher" );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.death_anim === 0 )
		if ( this.type === sdDrone.DRONE_ERTHAL )
		ctx.apply_shading = false;
		
		//ctx.filter = this.filter;

		let xx = 0;

		let xxoffset = 32;
		let xyoffset = 16;
		let image = sdDrone.img_drone_falkok;

		let width  = 32;
		let height = 32;
		
		ctx.scale( -this.side, 1 );
		ctx.rotate( this.attack_an / 100 );

		if ( this.type === sdDrone.DRONE_ERTHAL )
		image = sdDrone.img_drone_erthal;

		if ( this.type === sdDrone.DRONE_SARRORIAN )
		image = sdDrone.img_drone_alien;

		if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
		image = sdDrone.img_drone_alien2;

		if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR )
		image = sdDrone.img_drone_alien3;

		if ( this.type === sdDrone.DRONE_COUNCIL )
		image = sdDrone.img_drone_council;

		if ( this.type === sdDrone.DRONE_SETR )
		image = sdDrone.img_drone_setr;

		if ( this.type === sdDrone.DRONE_TZYRG )
		image = sdDrone.img_drone_tzyrg;

		if ( this.type === sdDrone.DRONE_TZYRG_WATCHER )
		{
			image = sdDrone.img_drone_tzyrg2;
			xxoffset = 64;

			xyoffset = 32;
			width = 64;
			height = 64;
		}
		
		if ( this.death_anim === 0 )
		{
			if ( !sdShop.isDrawing )
			ctx.translate( 0, Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2 );
		}
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdDrone.death_duration + sdDrone.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			if ( this.type !== -1 )
			xx = 2;
			/*if ( this.type === sdDrone.DRONE_FALKOK )
			ctx.drawImageFilterCache( sdDrone.img_drone_falkok_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === sdDrone.DRONE_ERTHAL )
			ctx.drawImageFilterCache( sdDrone.img_drone_robot_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === sdDrone.DRONE_SARRORIAN )
			ctx.drawImageFilterCache( sdDrone.img_drone_alien_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
			ctx.drawImageFilterCache( sdDrone.img_drone_alien2_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === sdDrone.DRONE_COUNCIL )
			ctx.drawImageFilterCache( sdDrone.img_drone_council_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === sdDrone.DRONE_SETR )
			ctx.drawImageFilterCache( sdDrone.img_drone_setr_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === sdDrone.DRONE_TZYRG )
			ctx.drawImageFilterCache( sdDrone.img_drone_tzyrg_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === sdDrone.DRONE_TZYRG_WATCHER )
			ctx.drawImageFilterCache( sdDrone.img_drone_tzyrg2_destroyed, - 32, - 32, 64, 64 );*/
		}
		else
		{
			if ( this.attack_frame >= 1 )
			{
				if ( this.type !== -1 )
				xx = 1;
				/*if ( this.type === sdDrone.DRONE_FALKOK )
				ctx.drawImageFilterCache( sdDrone.img_drone_falkok_attack, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_ERTHAL )
				ctx.drawImageFilterCache( sdDrone.img_drone_robot_attack, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_SARRORIAN )
				ctx.drawImageFilterCache( sdDrone.img_drone_alien_attack, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
				ctx.drawImageFilterCache( sdDrone.img_drone_alien2_attack, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_COUNCIL )
				ctx.drawImageFilterCache( sdDrone.img_drone_council_attack, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_SETR )
				ctx.drawImageFilterCache( sdDrone.img_drone_setr_attack, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_TZYRG )
				ctx.drawImageFilterCache( sdDrone.img_drone_tzyrg_attack, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_TZYRG_WATCHER )
				ctx.drawImageFilterCache( sdDrone.img_drone_tzyrg2_attack, - 32, - 32, 64, 64 );*/
			}
			else
			{
				if ( this.type !== 0 )
				xx = 0;
				/*ctx.drawImageFilterCache( sdDrone.img_drone_falkok, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_SARRORIAN )
				ctx.drawImageFilterCache( sdDrone.img_drone_alien, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR_CONTAINER )
				ctx.drawImageFilterCache( sdDrone.img_drone_alien2, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_SARRORIAN_DETONATOR )
				ctx.drawImageFilterCache( sdDrone.img_drone_alien3, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_COUNCIL )
				ctx.drawImageFilterCache( sdDrone.img_drone_council, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_SETR )
				ctx.drawImageFilterCache( sdDrone.img_drone_setr, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_TZYRG )
				ctx.drawImageFilterCache( sdDrone.img_drone_tzyrg, - 16, - 16, 32, 32 );
				if ( this.type === sdDrone.DRONE_TZYRG_WATCHER )
				ctx.drawImageFilterCache( sdDrone.img_drone_tzyrg2, - 32, - 32, 64, 64 );*/
				if ( this.type === sdDrone.DRONE_ERTHAL )
				{
					if ( this.hurt_timer > 0 )
					xx = 3;
					//ctx.drawImageFilterCache( sdDrone.img_drone_robot_hurt, - 16, - 16, 32, 32 );
					else
					xx = 0;
					//ctx.drawImageFilterCache( sdDrone.img_drone_robot, - 16, - 16, 32, 32 );
				}
			}
		}

		if ( this.type !== -1 )
		ctx.drawImageFilterCache( image, xx * xxoffset, 0, width,height, -xyoffset, -xyoffset, width,height );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		if ( this.type !== sdDrone.DRONE_SARRORIAN_DETONATOR )
		sdDrone.drones_tot--;
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 15, 3, 0.75, 0.75 );
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdDrone.init_class();

export default sdDrone;
