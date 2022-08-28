
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdLost from './sdLost.js';

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
		
		sdCube.huge_filter = sdWorld.CreateSDFilter();
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.huge_filter, '#00fff6', '#ffff00' );

		sdCube.white_filter = sdWorld.CreateSDFilter(); // For white cubes
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.white_filter, '#00fff6', '#dddddd' );

		sdCube.pink_filter = sdWorld.CreateSDFilter(); // For white cubes
		sdWorld.ReplaceColorInSDFilter_v2( sdCube.pink_filter, '#00fff6', '#ff00ff' );
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
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
	
	get hitbox_x1() { return -5 * ( this.kind === 2 ? 3 : this.kind === 1 ? 2 : this.kind === 3 ? 0.6 : 1 ); }
	get hitbox_x2() { return 5 * ( this.kind === 2 ? 3 : this.kind === 1 ? 2 : this.kind === 3 ? 0.6 : 1 ); }
	get hitbox_y1() { return -5 * ( this.kind === 2 ? 3 : this.kind === 1 ? 2 : this.kind === 3 ? 0.6 : 1 ); }
	get hitbox_y2() { return 5 * ( this.kind === 2 ? 3 : this.kind === 1 ? 2 : this.kind === 3 ? 0.6 : 1 ); }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._dropped_items = new WeakSet(); // Just so they won't be lost by boss cube
		
		this.regen_timeout = 0;
		this.kind = params.kind || 0;
		//this.is_huge = ( this.kind === 1 ) ? true : false;
		//this.is_white = ( this.kind === 2 ) ? true : false;
		//this.is_pink = ( this.kind === 3 ) ? true : false;
		
		this.hmax = this.kind === 2 ? 1600 : this.kind === 1 ? 800 : 200;
		this.hea = this.hmax;
		
		this._boss_death_ping_timer = 0;
		this._boss_death_pings_left = 0;
		
		//this.death_anim = 0;
		
		//this._current_target = null;
		
		//this._last_stand_on = null;
		//this._last_jump = sdWorld.time;
		//this._last_bite = sdWorld.time;
		
		this._move_dir_x = 0;
		this._move_dir_y = 0;
		this._move_dir_timer = 0;
		
		this._attack_timer = 0;
		this.attack_anim = 0;
		//this._aggressive_mode = false; // Causes dodging and faster movement
		this._charged_shots = 3;

		this._teleport_timer = 36;
		
		//this.side = 1;
		
		this._current_target = null; // Mostly related to following
		this._pathfinding = null;
		
		this._alert_intensity = 0; // Grows until some value and only then it will shoot
		
		this.matter_max = (this.kind === 2 ? 6 : this.kind === 1 ? 4 : 1 ) * 160;
		this.matter = this.matter_max;
		
		sdCube.alive_cube_counter++;
		
		if ( this.kind === 1 )
		sdCube.alive_huge_cube_counter++;

		if ( this.kind === 2 )
		sdCube.alive_white_cube_counter++;

		if ( this.kind === 3 )
		sdCube.alive_pink_cube_counter++;
		
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
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
		if ( this.kind === 3 )
		{
			gun.sd_filter = sdWorld.CreateSDFilter();
			gun.sd_filter.s = sdCube.pink_filter.s;
		}
		if ( this.kind === 2 )
		{
			gun.sd_filter = sdWorld.CreateSDFilter();
			gun.sd_filter.s = sdCube.white_filter.s;
		}
		if ( this.kind === 1 )
		{
			gun.sd_filter = sdWorld.CreateSDFilter();
			gun.sd_filter.s = sdCube.huge_filter.s;
		}
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
	
		//dmg = Math.abs( dmg );
		
		let explode_on_hea = ( this.kind === 2 ? -2000 : -1000 );
		
		let was_existing = ( this.hea > explode_on_hea );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		this.hea = Math.min( this.hea, this.hmax ); // Prevent overhealing
		
		if ( this.hea > 0 )
		{
			if ( this.regen_timeout < 60 )
			sdSound.PlaySound({ name:'cube_hurt', pitch: this.kind === 2 ? 0.4 : this.kind === 1 ? 0.5 : 1, x:this.x, y:this.y, volume:0.66 });
		}
		
		this.regen_timeout = Math.max( this.regen_timeout, 60 );
		
		if ( this.hea <= 0 && was_alive )
		{
			this.regen_timeout = 30 * 15; // Stay dead for at least 15 seconds
			
			this._alert_intensity = 0;
			
			sdSound.PlaySound({ name:'cube_offline', pitch: (this.kind === 1 || this.kind === 2) ? 0.5 : 1, x:this.x, y:this.y, volume:1.5 });
			
			this._boss_death_ping_timer = 0;
			this._boss_death_pings_left = 10;
		}
		
		if ( this.hea <= explode_on_hea && was_existing )
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
				if ( this.kind === 1 || this.kind === 2 )
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
				else
				this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB );
			}
			let r = Math.random();
			
			//console.log( 'CLASS_TRIPLE_RAIL drop chances: ' + r + ' < ' + ( this.kind === 1 ? 0.4 : 0.1 ) * 0.25 );
			
			//if ( r < ( this.kind === 1 ? 0.4 : 0.1 ) * 0.5 ) // 0.25 was not enough for some rather strange reason (something like 1 drop out of 55 cube kills that wasn't even noticed by anyone)
			if ( r < ( this.kind === 2 ? 0.55 : this.kind === 1 ? 0.4 : 0.1 ) * 0.6 ) // Higher chance just for some time at least?
			{
				//if ( r < ( this.kind === 2 ? 0.55 : this.kind === 1 ? 0.4 : 0.1 ) * 1 ) // 2x chance of triple rail to drop, only when triple rail does not drop
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
						
						let total_drop_probability = 0; // In else case it is always pistol or healing ray gun
						
						if ( this.kind === 1 ) // yellow
						total_drop_probability += probability_lost_converter + probability_shotgun + probability_triple_rail;
						else
						if ( this.kind === 2 ) // white
						total_drop_probability += probability_lost_converter + probability_shotgun + probability_triple_rail + probability_teleporter;
						else
						total_drop_probability += probability_shotgun + probability_triple_rail;

						if ( random_value < total_drop_probability && this.kind !== 3 )
						{
							if ( this.kind === 1 )
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
							if ( this.kind === 2 )
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
							else
							{
								if ( random_value < probability_shotgun )
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_RAIL_SHOTGUN });
								else
								gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_TRIPLE_RAIL });
							}
						}
						else
						gun = new sdGun({ x:x, y:y, class:this.kind === 3 ? sdGun.CLASS_HEALING_RAY : sdGun.CLASS_RAIL_PISTOL });

						gun.sx = sx;
						gun.sy = sy;
						//gun.extra = ( this.kind === 3 ? 3 : this.kind === 2 ? 2 : this.kind === 1 ? 1 : 0 ); // Color it
						
						this.ColorGunAccordingly( gun );
						
						sdEntity.entities.push( gun );
						
						this._dropped_items.add( gun );

					}, 500 );
				//}
			}

			r = Math.random(); // Cube shard dropping roll
	
			if ( r < ( this.kind === 2 ? 0.85 : this.kind === 1 ? 0.7 : 0.25 ) * 0.6 ) // Higher chance just for some time at least?
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
					//gun.extra = (this.kind === 3 ? 3 : this.kind === 2 ? 2 : this.kind === 1 ? 1 : 0 ); // Color it
					this.ColorGunAccordingly( gun );
					sdEntity.entities.push( gun );
					
					this._dropped_items.add( gun );

				}, 500 );
			}

			this.remove();
		}
		
		//if ( this.hea < -this.hmax / 80 * 100 )
		//this.remove();
	}
	
	get mass() { return this.kind === 2 ? 30*6 : this.kind === 1 ? 30*4 : 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1 * ( this.kind === 1 ? 0.25 : 1 );
		//this.sy += y * 0.1 * ( this.kind === 1 ? 0.25 : 1 );
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
					bullet_obj1.color = '#FFFFFF';

					bullet_obj1._damage = 15;

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
					bullet_obj2.color = '#FFFFFF';

					bullet_obj2._damage = 15;
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
					bullet_obj3.color = '#FFFFFF';

					bullet_obj3._damage = 15;

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
					bullet_obj4.color = '#FFFFFF';	

					bullet_obj4._damage = 15;
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
			
			sdSound.PlaySound({ name:'cube_teleport', pitch: ( this.kind === 2 || this.kind === 1 ) ? 0.5 : 1, x:this.x, y:this.y, volume:1 });
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
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
		
		let pathfinding_result = null;
		
		// It makes sense to call it at all times because it also handles wall attack logic
		if ( this._current_target )
		pathfinding_result = this._pathfinding.Think( GSPEED );
		
		if ( this.hea <= 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;
		
			if ( this.death_anim < sdCube.death_duration + sdCube.post_death_ttl )
			this.death_anim += GSPEED;
			//else
			//this.remove();
			
			if ( this.kind === 2 ) // Bosses
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
			
			this.MatterGlow( 0.01, 30, GSPEED );
			/*var x = this.x;
			var y = this.y;
			for ( var xx = -1; xx <= 1; xx++ )
			for ( var yy = -1; yy <= 1; yy++ )
			{
				var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
				for ( var i = 0; i < arr.length; i++ )
				if ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' )
				if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 30 ) >= 0 )
				if ( arr[ i ] !== this )
				{
					this.TransferMatter( arr[ i ], 0.01, GSPEED );
				}
			}*/
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
			
			if ( sdWorld.is_server )
			{

				if ( this._teleport_timer <= 0 && this.kind === 2 ) // White cubes can teleport around
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
							
							if ( sdCube.IsTargetFriendly( sdWorld.sockets[ i ].character ) )
							di += 1000;
							
							if ( di < closest_di )
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
						
						// pathfinding_result.attack_target
						
						/*if ( closest_di_real < sdCube.attack_range ) // close enough to dodge obstacles
						{
							let an = Math.random() * Math.PI * 2;

							this._move_dir_x = Math.cos( an );
							this._move_dir_y = Math.sin( an );

							if ( sdCube.IsTargetFriendly( closest ) ) // Don't follow if friendly player near
							{
							}
							else
							if ( !sdWorld.CheckLineOfSight( this.x, this.y, closest.x, closest.y, this, sdCom.com_visibility_ignored_classes, null ) )
							{
								for ( let ideas = Math.max( 5, 40 / sdCube.alive_cube_counter ); ideas > 0; ideas-- )
								{
									var a1 = Math.random() * Math.PI * 2;
									var r1 = Math.random() * 200;

									var a2 = Math.random() * Math.PI * 2;
									var r2 = Math.random() * 200;

									if ( sdWorld.CheckLineOfSight( this.x, this.y, this.x + Math.cos( a1 ) * r1, this.y + Math.sin( a1 ) * r1, this, sdCom.com_visibility_ignored_classes, null ) )
									{
										if ( sdWorld.CheckLineOfSight( closest.x, closest.y, this.x + Math.cos( a1 ) * r1, this.y + Math.sin( a1 ) * r1, this, sdCom.com_visibility_ignored_classes, null ) )
										{
											// Can attack from position 1

											this._move_dir_x = Math.cos( a1 );
											this._move_dir_y = Math.sin( a1 );

											this._move_dir_timer = r1 * 5;

											//sdWorld.SendEffect({ x:this.x + Math.cos( a1 ) * r1, y:this.y + Math.sin( a1 ) * r1, type:sdEffect.TYPE_WALL_HIT });
											break;
										}
										else
										{
											if ( sdWorld.CheckLineOfSight( this.x + Math.cos( a1 ) * r1, 
																		   this.y + Math.sin( a1 ) * r1, 
																		   this.x + Math.cos( a1 ) * r1 + Math.cos( a2 ) * r2, 
																		   this.y + Math.sin( a1 ) * r1 + Math.sin( a2 ) * r2, this, sdCom.com_visibility_ignored_classes, null ) )
											{
												if ( sdWorld.CheckLineOfSight( closest.x, closest.y, 
																			   this.x + Math.cos( a1 ) * r1 + Math.cos( a2 ) * r2, 
																			   this.y + Math.sin( a1 ) * r1 + Math.sin( a2 ) * r2, this, sdCom.com_visibility_ignored_classes, null ) )
												{
													// Can attack from position 2, but will move to position 1 still

													this._move_dir_x = Math.cos( a1 );
													this._move_dir_y = Math.sin( a1 );

													this._move_dir_timer = r1 * 5;
													
													break;
												}
											}
										}
									}
								}
							}
							else
							{

								//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });
							
							}
						}*/
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
				
			/*if ( 
					//this.y > sdWorld.world_bounds.y1 + 200 &&
					sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_x * 50, this.y + this._move_dir_y * 50, this, sdCom.com_visibility_ignored_classes, null ) &&  // Can move forward
				( 
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_x * 200, this.y + this._move_dir_y * 200, this, sdCom.com_visibility_ignored_classes, null ) || // something is in front in distance
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x - this._move_dir_x * 100, this.y - this._move_dir_y * 100, this, sdCom.com_visibility_ignored_classes, null ) || // allow retreat from wall behind
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x - this._move_dir_y * 100, this.y + this._move_dir_x * 100, this, sdCom.com_visibility_ignored_classes, null ) || // side
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_y * 100, this.y - this._move_dir_x * 100, this, sdCom.com_visibility_ignored_classes, null ) // side
				   ) )
			{*/
				
				this.sx += this._move_dir_x * v * GSPEED;
				this.sy += this._move_dir_y * v * GSPEED;
			/*}
			else
			{
				this._move_dir_timer = 0;
				this.sy += 0.03 * GSPEED;
			}*/
			
			if ( sdWorld.is_server )
			{
				if ( this._attack_timer <= 0 )
				{
					this._attack_timer = 3;

					//let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 800 );
					//let targets_raw = sdWorld.GetCharactersNear( this.x, this.y, null, null, 800 );
					let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, sdCube.attack_range, null, [ 'sdCharacter', 'sdPlayerDrone', 'sdTurret', 'sdEnemyMech', 'sdCube', 'sdDrone', 'sdSetrDestroyer' ] );

					let targets = [];
					
					if ( pathfinding_result )
					if ( pathfinding_result.attack_target )
					{
						if ( pathfinding_result.attack_target.IsPlayerClass() )
						{
							if ( sdCube.IsTargetFriendly( pathfinding_result.attack_target ) )
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
							if ( !sdCube.IsTargetFriendly( this._current_target ) )
							targets.push( pathfinding_result.attack_target );
						}
					}

					for ( let i = 0; i < targets_raw.length; i++ )
					if ( this.kind !== 3 ) // Pink cubes heal friendly entities
					{
						if ( ( targets_raw[ i ].IsPlayerClass() && targets_raw[ i ].hea > 0 && !sdCube.IsTargetFriendly( targets_raw[ i ] ) ) ||
							 ( targets_raw[ i ].GetClass() === 'sdTurret' && !sdCube.IsTargetFriendly( targets_raw[ i ] ) ) || 
							 ( targets_raw[ i ].GetClass() === 'sdEnemyMech' && targets_raw[ i ].hea > 0  && !sdCube.IsTargetFriendly( targets_raw[ i ] ) ) ||
							 ( targets_raw[ i ].GetClass() === 'sdSetrDestroyer' && targets_raw[ i ].hea > 0  && !sdCube.IsTargetFriendly( targets_raw[ i ] ) ) )
						{
							if ( sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], [ 'sdCube' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) )
							targets.push( targets_raw[ i ] );
							else
							{
								//if ( targets_raw[ i ].GetClass() === 'sdCharacter' )
								if ( targets_raw[ i ].IsPlayerClass() )
								if ( targets_raw[ i ]._nature_damage >= targets_raw[ i ]._player_damage + ( (this.kind === 1 || this.kind === 2 ) ? 120 : 200 ) ) // Highly wanted by sdCubes in this case
								{
									targets.push( targets_raw[ i ] );
								}
							}
						}
					}
					else
					{
						if ( ( targets_raw[ i ].IsPlayerClass() && targets_raw[ i ].hea < targets_raw[ i ].hmax && sdCube.IsTargetFriendly( targets_raw[ i ] ) && targets_raw[ i ]._socket ) || // Only with socket
							 ( targets_raw[ i ].GetClass() === 'sdCube' && targets_raw[ i ].hea < targets_raw[ i ].hmax && targets_raw[ i ] !== this ) )
							if ( sdWorld.CheckLineOfSight( this.x, this.y, targets_raw[ i ].x, targets_raw[ i ].y, targets_raw[ i ], [ 'sdCube' ], [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdMatterAmplifier' ] ) )
							targets.push( targets_raw[ i ] );
					}
					

					sdWorld.shuffleArray( targets );
					
					for ( let i = 0; i < targets.length; i++ )
					{
						if ( this._alert_intensity < 45 || // Delay attack
							 ( this.regen_timeout > 45 && !this.kind === 1 && !this.kind === 2 ) ) // Hurt stun
						break;

						this.attack_anim = 15;
						
						let targ = targets[ i ];
							
						if ( this.kind === 1 && Math.random() > 0.9 )
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
							
							if ( this.kind === 1 || this.kind === 2 )
							{
								bullet_obj._damage = 18;
							}
							
							if ( this.kind === 3 )
							{
								bullet_obj._damage = -15;
							}
							
							bullet_obj.color = this.kind === 3 ? '#ff00ff' : '#ffffff'; // Cube healing rays are pink to distinguish them from damaging rails

							sdEntity.entities.push( bullet_obj );

							this._charged_shots--;

							if ( this.kind === 2 )
							this.FireDirectionalBeams();

							if ( this._charged_shots <= 0 )
							{
								this._charged_shots = this.kind === 2 ? 5 : 3;
								this._attack_timer = 45;
							}
							sdSound.PlaySound({ name:'cube_attack', pitch: ( this.kind === 2 || this.kind === 1 ) ? 0.5 : 1, x:this.x, y:this.y, volume:0.5 });

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
							if ( this.kind !== 3 )
							sdSound.PlaySound({ name:'cube_alert2', pitch: this.kind === 1 ? 0.5 : 1, x:this.x, y:this.y, volume:1 });
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
	
	static IsTargetFriendly( ent ) // Assumes _nature_damage and _player_damage are defined properties, thus will work mostly only for sdCharacter
	{
		//if ( ent.GetClass() === 'sdCharacter' )
		if ( ent.IsPlayerClass() )
		if ( ent._nature_damage >= ent._player_damage + 60 )
		return false;

		if ( ent.GetClass() === 'sdTurret' )
		if ( ent._target )
		if ( !ent._target._is_being_removed )
		if ( ent._target.GetClass() === 'sdCube' )
		//if ( sdWorld.GetComsNear( ent.x, ent.y, null, 'sdCube', true ).length === 0 )
		return false;
		if ( ent.GetClass() === 'sdEnemyMech' ) // Flying mechs are targetable by cubes now
		return false;

		if ( ent.GetClass() === 'sdSetrDestroyer' ) // Flying mechs are targetable by cubes now
		return false;

		return true;
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Cube" );
		
		if ( this.kind === 1 || this.kind === 2 )
		this.DrawHealthBar( ctx, undefined, 10 );
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		let yy = 0;

		let draw_sprite = false;
		
		if ( this.kind === 1 )
		{
			ctx.scale( 2, 2 );
			ctx.sd_filter = sdCube.huge_filter;
		}

		if ( this.kind === 2 )
		{
			ctx.scale( 3, 3 );
			ctx.sd_filter = sdCube.white_filter;
		}

		if ( this.kind === 3 )
		{
			//ctx.scale( 0.6, 0.6 );
			ctx.sd_filter = sdCube.pink_filter;
			
			yy = 1;
			if ( this.hea > 0 )
			{
				if ( this.attack_anim > 0 )
				xx = 3;
				//ctx.drawImageFilterCache( sdCube.img_cube_attack3, - 16, - 16, 32,32 );
				else
				if ( this.regen_timeout > 45 )
				xx = 2;
				//ctx.drawImageFilterCache( sdCube.img_cube_hurt3, - 16, - 16, 32,32 );
				else
				{
					xx = 0;
					//ctx.drawImageFilterCache( sdCube.img_cube_idle3, - 16, - 16, 32,32 );

					if ( this.matter < this.matter_max )
					{
						draw_sprite = true;
						//ctx.globalAlpha = ( 1 - this.matter / this.matter_max ) * ( Math.sin( sdWorld.time / 2000 * Math.PI ) * 0.5 + 0.5 );
						//xx = 1;
						//ctx.drawImageFilterCache( sdCube.img_cube_sleep3, - 16, - 16, 32,32 );
					}
				}
			}
			else
			xx = 1;
			//ctx.drawImageFilterCache( sdCube.img_cube_sleep3, - 16, - 16, 32,32 );
		}
		else
		{
			yy = 0;
			if ( this.hea > 0 )
			{
				if ( this.attack_anim > 0 )
				xx = 3;
				//ctx.drawImageFilterCache( sdCube.img_cube_attack, - 16, - 16, 32,32 );
				else
				if ( this.regen_timeout > 45 )
				xx = 2;
				//ctx.drawImageFilterCache( sdCube.img_cube_hurt, - 16, - 16, 32,32 );
				else
				{
					xx = 0;
					//ctx.drawImageFilterCache( sdCube.img_cube_idle, - 16, - 16, 32,32 );

					if ( this.matter < this.matter_max )
					{
						draw_sprite = true;
						//ctx.globalAlpha = ( 1 - this.matter / this.matter_max ) * ( Math.sin( sdWorld.time / 2000 * Math.PI ) * 0.5 + 0.5 );
						//xx = 1;
						//ctx.drawImageFilterCache( sdCube.img_cube_sleep, - 16, - 16, 32,32 );
					}
				}
			}
			else
			xx = 1;
			//ctx.drawImageFilterCache( sdCube.img_cube_sleep, - 16, - 16, 32,32 );
		}
		ctx.drawImageFilterCache( sdCube.img_cube, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );

		if ( draw_sprite )
		{
			if ( this.matter < this.matter_max )
			ctx.globalAlpha = ( 1 - this.matter / this.matter_max ) * ( Math.sin( sdWorld.time / 2000 * Math.PI ) * 0.5 + 0.5 );
			
			ctx.drawImageFilterCache( sdCube.img_cube, 64,0, 32,32, -16, -16, 32,32 );
		}
		
		ctx.globalAlpha = 1;
		//ctx.filter = 'none';
		ctx.sd_filter = null;
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdCube.alive_cube_counter--;
								
		if ( this.kind === 1 )
		sdCube.alive_huge_cube_counter--;

		if ( this.kind === 2 )
		sdCube.alive_white_cube_counter--;

		if ( this.kind === 3 )
		sdCube.alive_pink_cube_counter--;
		
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdCube.init_class();

export default sdCube;