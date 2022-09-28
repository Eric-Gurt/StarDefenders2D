import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdQuickie from './sdQuickie.js';
import sdAsp from './sdAsp.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdCube from './sdCube.js';
import sdJunk from './sdJunk.js';
import sdLost from './sdLost.js';
import sdAsteroid from './sdAsteroid.js';

import sdTask from './sdTask.js';


import sdRenderer from '../client/sdRenderer.js';


class sdRift extends sdEntity
{
	static init_class()
	{
		sdRift.img_rift_anim = sdWorld.CreateImageFromFile( 'rift_anim' );
		sdRift.portals = 0;
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -15; }
	get hitbox_y2() { return 15; }

	get hard_collision()
	{ return false; }
	
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null ) // Not that much useful since it cannot be damaged by anything but matter it contains.
	{
		if ( !sdWorld.is_server )
		return;
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = this.type === 5 ? 36000 : 2560; // a 2560 matter crystal is enough for a rift to be removed over time
		this.hea = this.hmax;
		this._regen_timeout = 0;
		//this._cooldown = 0;
		this.matter_crystal_max = 5120; // a 5K crystal is max what it can be fed with
		this.matter_crystal = 0; // Named differently to prevent matter absorption from entities that emit matter
		this._spawn_timer = params._spawn_timer || 30 * 60; // Either defined by spawn or 60 seconds
		this._spawn_timer_cd = this._spawn_timer; // Countdown/cooldown for spawn timer
		this._teleport_timer = 30 * 60 * 10; // Time for the portal to switch location
		this._time_until_teleport = this._teleport_timer;
		this.type = params.type || 1; // Default is the weakest variation of the rift ( Note: params.type as 0 will be defaulted to 1, implement typeof check here if 0 value is needed )
		this._rotate_timer = 10; // Timer for rotation sprite index
		this.frame = 0; // Rotation sprite index
		this.scale = 1; // Portal scaling when it's about to be destroyed/removed
		this.teleport_alpha = 0; // Alpha/transparency ( divided by 60 in draw code ) when portal is about to change location

		/*if ( this.type === 1 )
		this.filter = 'hue-rotate(' + 75 + 'deg)';
		if ( this.type === 2 )
		this.filter = 'none';*/

		if ( this.type !== 5 ) // Council portals don't count towards other portal types so they don't prevent spawning of those other portals
		sdRift.portals++;
	}
	GetFilterColor()
	{
		/*if ( this.type === 1 )
		this.filter = 'hue-rotate(' + 75 + 'deg)';
		if ( this.type === 2 )
		this.filter = 'none';*/
	
		if ( this.type === 1 )
		return 'hue-rotate(' + 75 + 'deg)';
	
		if ( this.type === 2 )
		return 'none';

		if ( this.type === 3 )
		return 'hue-rotate(' + 180 + 'deg)';

		if ( this.type === 4 )
		return 'saturate(0.1) brightness(0.4)';

		if ( this.type === 5 )
		return 'brightness(2) saturate(0.1)';
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._rotate_timer > 0 ) // Sprite animation handling
			this._rotate_timer -= GSPEED;
			else
			{
				this.frame++;
				if ( this.frame > 6 )
				this.frame = 0;
				this._rotate_timer = 10 * this.scale;

				if ( this.frame % 3 === 0 )
				if ( this.type === 4 ) // Black portal / Black hole attack
				{
					let ents = sdWorld.GetAnythingNear( this.x, this.y, 192 );
					for ( let i = 0; i < ents.length; i++ )
					{
						if ( sdWorld.CheckLineOfSight( this.x, this.y, ents[ i ].x, ents[ i ].y, ents[ i ] ) )
						{
							if ( typeof ents[ i ].sx !== 'undefined' )
							ents[ i ].sx -= ( ents[ i ].x - this.x ) / 10;
							if ( typeof ents[ i ].sy !== 'undefined' )
							ents[ i ].sy -= ( ents[ i ].y - this.y ) / 10;


							if ( ents[ i ].GetClass() === 'sdCharacter' )
							{
								ents[ i ].stability = Math.min( 0, ents[ i ].stability );
								if ( ents[ i ].gun_slot !== 9 )
								ents[ i ].DropWeapon( ents[ i ].gun_slot );
							}

							if ( ents[ i ].IsPlayerClass() )
							ents[ i ].ApplyServerSidePositionAndVelocity( true, ( ( ents[ i ].x - this.x ) / 20 ), ( ( ents[ i ].y - this.y ) / 20 ) );

							if ( ents[ i ].GetClass() !== 'sdGun' && ents[ i ].GetClass() !== 'sdCrystal' && ents[ i ].GetClass() !== 'sdBG' )
							{
								if ( ents[ i ].GetClass() === 'sdBlock' )
								ents[ i ].DamageWithEffect( 8 );
								//else
								//if ( sdWorld.inDist2D( ents[ i ].x, ents[ i ].y, this.x, this.y ) < 16 )
								//ents[ i ].DamageWithEffect( 16 );
							}
							else
							{
								if ( ents[ i ].GetClass() === 'sdBG' )
								if ( Math.random() < 0.01 )
								ents[ i ].DamageWithEffect( 16 );
							}
						}
					}

					//Set task for players to remove the dimensional tear
					for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be closed
					{
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'DESTROY-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_DESTROY_ENTITY,
							difficulty: 0.167,		
							title: 'Close the dimensional tear',
							description: 'A dimensional tear appeared on this planet. It should be closed down before it destroys large chunks of the planet. We can close it using an Anti-crystal.'
						});
					}
				}
			}
			if ( this._spawn_timer_cd > 0 ) // Spawn entity timer
			this._spawn_timer_cd -= GSPEED;
			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED;
			else
			{
				if ( this.hea < this.hmax && this.type !== 5 )
				{
					this.hea = Math.min( this.hea + GSPEED, this.hmax );
				
					//if ( sdWorld.is_server )
					//this.hea = this.hmax; // Hack
				
					//this._update_version++;
				}
			}
			if ( this._spawn_timer_cd <= 0 ) // Spawn an entity
			if ( this.CanMoveWithoutOverlap( this.x, this.y, 0 ) )
			if ( this.type !== 4 ) // Black portals / Black holes do not spawn things
			{
				sdSound.PlaySound({ name:'rift_spawn1', x:this.x, y:this.y, volume:2 });
				
				// Delaying to match sound
				setTimeout( ()=>
				{

					if ( this.type === 1 ) // Quickies and Asps
					{
						let spawn_type = Math.random();
						if ( spawn_type < 0.333 )
						{
							if ( sdAsp.asps_tot < 25 ) // Same amount as in sdWeather
							{
								let asp = new sdAsp({ 
									x:this.x,
									y:this.y,
									_tier: 2
								});
								asp.filter = 'invert(1) sepia(1) saturate(100) hue-rotate(270deg) opacity(0.45)';
								sdEntity.entities.push( asp );
								sdWorld.UpdateHashPosition( asp, false ); // Prevent intersection with other ones
							}
						}
						else
						if ( sdQuickie.quickies_tot < 25 )
						{
							let quickie = new sdQuickie({ 
								x:this.x,
								y:this.y,
								_tier:2
							});
							//let quickie_filter = {};
							//let quickie_filter = sdWorld.CreateSDFilter();
								//sdWorld.ReplaceColorInSDFilter_v2( quickie_filter, '#000000', '#ff00ff' ) // Pink, stronger quickies
							//quickie.sd_filter = quickie_filter;
							quickie.filter = 'invert(1) sepia(1) saturate(100) hue-rotate(270deg) opacity(0.45)';
							sdEntity.entities.push( quickie );
							sdWorld.UpdateHashPosition( quickie, false ); // Prevent intersection with other ones
						}
					}
					if ( this.type === 2 ) // Cube portal
					{
						if ( sdCube.alive_cube_counter < sdCube.GetMaxAllowedCubesOfKind( 0 ) ) // 20
						{
							let cube = new sdCube({ 
								x:this.x,
								y:this.y,
								kind: sdCube.GetRandomKind()/*( ( sdCube.alive_huge_cube_counter < sdWorld.GetPlayingPlayersCount() ) && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.1 ) ) ?
										 1 : ( sdCube.alive_white_cube_counter < 1 && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.04 ) ) ? 
										 2 : ( sdCube.alive_pink_cube_counter < 2 && ( sdCube.alive_cube_counter >= 1 && Math.random() < 0.14 ) ) ? 3 : 0*/ // _kind = 1 -> is_huge = true , _kind = 2 -> is_white = true , _kind = 3 -> is_pink = true
							});
							cube.sy += ( 10 - ( Math.random() * 20 ) );
							cube.sx += ( 10 - ( Math.random() * 20 ) );

							sdEntity.entities.push( cube );

							if ( !cube.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
							{
								cube.remove();
							}
							else
							sdWorld.UpdateHashPosition( cube, false ); // Prevent inersection with other ones
						}
					}
					if ( this.type === 3 ) // Asteroid portal, always creates asteroids which explode on impact
					{
						{
							let asteroid = new sdAsteroid({ 
								x:this.x,
								y:this.y
							});
							asteroid._type = 0;
							asteroid.sy += ( 10 - ( Math.random() * 20 ) );
							asteroid.sx += ( 10 - ( Math.random() * 20 ) );

							sdEntity.entities.push( asteroid );

							/*if ( !asteroid.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
							{
								asteroid.remove();
							}
							else
							sdWorld.UpdateHashPosition( asteroid, false ); // Prevent inersection with other ones*/
						}
					}
				}, 1223 );

					if ( this.type === 5 )
					{
						let ais = 0;
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
							let councils_tot = 1;

							let left_side = ( Math.random() < 0.5 );

							while ( councils < councils_tot && ais < 6 )
							{

								let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

								sdEntity.entities.push( character_entity );
								character_entity.s = 110;
								{
								let x,y;
								{
									x = this.x
									y = this.y;
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
										//character_entity._recoil_mult = 1 - ( 0.0055 * character_entity._ai_level ) ; // Small recoil reduction based on AI level
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
	
										break;
								}
							}
						}
						councils++;
						ais++;
						}
					}
				}

				//this._spawn_timer_cd = ( this.type === 3 ? 0.25 : 1 ) * this._spawn_timer * Math.max( 0.1, this.hea / this.hmax ); // Reset spawn timer countdown, depending on HP left off the portal
				this._spawn_timer_cd = ( this.type === 5 ? 0.5 : this.type === 3 ? 0.25 : 1 ) * this._spawn_timer * Math.max( 0.1, Math.pow( Math.random(), 0.5 ) ); // Reset spawn timer countdown, but randomly while prioritizing longer spawns to prevent farming or not feeding any crystals to portal for too long
			}
			
			if ( this.matter_crystal > 0 ) // Has the rift drained any matter?
			{
				this.hea = Math.max( this.hea - 1, 0 );
				this.matter_crystal--;
				//this._update_version++;
			}
			if ( this.type === 5 ) // Council portal fades away on it's own
			this.hea -= GSPEED; // But for a really long time, 20 minutes ( 36000 / 30 = 1200 seconds )
			if ( this._time_until_teleport > 0 )
			{
				this._time_until_teleport -= GSPEED;
				this.teleport_alpha = Math.min( this.teleport_alpha + GSPEED, 60 );
			}
			else
			if ( this._time_until_teleport <= 0 )
			this.teleport_alpha = Math.max( this.teleport_alpha - GSPEED, 0 );
			if ( this.teleport_alpha <= 0 && this._time_until_teleport <= 0 ) // Relocate the portal
			{
				let x,y,i;
				let tr = 1000;
				do
				{
					tr--;
					x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
					y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

					if ( this.CanMoveWithoutOverlap( x, y, 0 ) )
					if ( !this.CanMoveWithoutOverlap( x, y + 24, 0 ) )
					if ( sdWorld.last_hit_entity )
					if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
					if ( !sdWorld.CheckWallExistsBox( 
						x + this._hitbox_x1 - 16, 
						y + this._hitbox_y1 - 16, 
						x + this._hitbox_x2 + 16, 
						y + this._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
					{
						this.x = x;
						this.y = y;
					}
				}  while( tr > 0 );
				this._time_until_teleport = this._teleport_timer;
			}

			if ( this.hea <= 0 )
			{
				this.scale -= 0.0025 / GSPEED;
			}
			if ( this.scale <= 0 )
			{
				let r = Math.random();

				if ( r < ( 0.23 + ( 0.05 * this.type ) ) )
				{
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

					}, 500 );
				}
				this.remove();
				return;
			}
		}
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.teleport_alpha < 55 ) // Prevent crystal feeding if it's spawning or dissapearing
		return;

		if ( this.type === 5 ) // No feeding for council portals
		return;

		if ( this.type === 4 ) // Black portal deals damage / vacuums stuff inside
		{
			from_entity.DamageWithEffect( 0.25 );
			if ( typeof from_entity.sx !== 'undefined' )
			from_entity.sx -= ( from_entity.x - this.x ) / 40;
			if ( typeof from_entity.sy !== 'undefined' )
			from_entity.sy -= ( from_entity.y - this.y ) / 40;
		}

		if ( from_entity.is( sdCrystal ) )
		if ( from_entity.held_by === null ) // Prevent crystals which are stored in a crate
		{
			if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
			{
				sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2 });
				if ( this.type !== 4 ) // Black portal needs anticrystal to be shut down
				{
					this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + from_entity.matter_max ); // Drain the crystal for it's max value and destroy it
					this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating if it didn't drain matter
				}
				else
				{
					if ( from_entity.type !== sdCrystal.TYPE_CRYSTAL_BIG && from_entity.type !== sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
					{
						if ( from_entity.matter_max === sdCrystal.anticrystal_value )
						{
							this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + from_entity.matter_max ); // Drain the crystal for it's max value and destroy it
							this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating if it didn't drain matter
						}
					}
					else
					if ( from_entity.matter_max === sdCrystal.anticrystal_value * 4 )
					{
						this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + from_entity.matter_max ); // Drain the crystal for it's max value and destroy it
						this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating if it didn't drain matter
					}
				}
				//this._update_version++;
				from_entity.remove();
			}
		}

		if ( from_entity.is( sdLost ) )
		{
			if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
			{
				sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2 });

				this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + from_entity._matter_max ); // Lost entities are drained from it's matter capacity.
				this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating if it didn't drain matter
				//this._update_version++;
				from_entity.remove();
			}
		}

		if ( from_entity.is( sdJunk ) )
		if ( from_entity.type === 1 ) // Is it an alien battery?
		if ( this.type !== 2 && this.type !== 4 ) // The portal is not a "cube" one?
		{
			this.type = 2;
			//this.GetFilterColor();
			this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating
			//this._update_version++;

			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius:30,
				damage_scale: 0.01, // Just a decoration effect
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this,
				color:'#33FFFF' 
			});

			from_entity.remove();
		}
	}
	get title()
	{
		//if ( this.matter_crystal < this.hea)
		return 'Dimensional portal';
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		let frame = this.frame;
		
		ctx.filter = this.GetFilterColor(); // this.filter;
		
		ctx.globalAlpha = this.teleport_alpha / 60;
		ctx.scale( 0.75 * this.scale + ( 0.25 * this.hea / this.hmax ), 0.75 * this.scale + ( 0.25 * this.hea / this.hmax ) );
		ctx.drawImageFilterCache( sdRift.img_rift_anim, frame * 32, 0, 32, 32, - 16, - 16, 32,32 );
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.matter_crystal < this.hea )
		sdEntity.Tooltip( ctx, "Dimensional portal", 0, 0 );
		else
		sdEntity.Tooltip( ctx, "Dimensional portal (overcharged)", 0, 0 ); // Lets players know it has enough matter to destroy itself
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this.type !== 5 ) // Council portals don't count towards other portal types so they don't prevent spawning of those other portals
		sdRift.portals--;
		//this.onRemoveAsFakeEntity();

		if ( this._broken )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:30,
			damage_scale: 0.01, // Just a decoration effect
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this,
			color:'#FFFFFF' 
		});
	}
	onRemoveAsFakeEntity()
	{
	}
}
//sdRift.init_class();

export default sdRift;
