
/* global FakeCanvasContext */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCrystal from './sdCrystal.js';
import sdTimer from './sdTimer.js';
import sdWater from './sdWater.js';
import sdWeather from './sdWeather.js';
import sdTurret from './sdTurret.js';
//import sdPlayerSpectator from './sdPlayerSpectator.js';

import sdRenderer from '../client/sdRenderer.js';


class sdGrass extends sdEntity
{
	static init_class()
	{
		sdGrass.img_grass_merged = sdWorld.CreateImageFromFile( 'sdGrass' ); // grass by LazyRain, bush by PeacyQuack, tree by Eric Gurt
		//sdGrass.img_grass = sdWorld.CreateImageFromFile( 'grass' );
		//sdGrass.img_grass2 = sdWorld.CreateImageFromFile( 'grass2' ); // sprite by LazyRain
		//sdGrass.img_grass3 = sdWorld.CreateImageFromFile( 'grass3' ); // sprite by LazyRain
		
		sdGrass.VARIATION_LOW_GRASS = 0;
		sdGrass.VARIATION_MID_GRASS = 1;
		sdGrass.VARIATION_HIGH_GRASS = 2;
		sdGrass.VARIATION_BUSH = 3;
		sdGrass.VARIATION_TREE = 4;
		sdGrass.VARIATION_TREE_BARREN = 5;
		sdGrass.VARIATION_TREE_LARGE = 6;
		sdGrass.VARIATION_TREE_LARGE_BARREN = 7;
		sdGrass.VARIATION_NEW_YEAR_TREE = 8;
		
		sdGrass.crops = [];
		sdGrass.crops[ sdGrass.VARIATION_LOW_GRASS ] = { x:1, y:0, w:16, h:31 }; // Same y and h for all grass sprites so wind effect would not tear them apart
		sdGrass.crops[ sdGrass.VARIATION_MID_GRASS ] = { x:18, y:0, w:16, h:31 };
		sdGrass.crops[ sdGrass.VARIATION_HIGH_GRASS ] = { x:35, y:0, w:16, h:31 };
		sdGrass.crops[ sdGrass.VARIATION_BUSH ] = { x:52, y:19, w:17, h:12, half_width_collision_override:7 };
		sdGrass.crops[ sdGrass.VARIATION_TREE ] = { x:72, y:4, w:21, h:27, half_width_collision_override:7 };
		sdGrass.crops[ sdGrass.VARIATION_TREE_BARREN ] = { x:72, y:36, w:21, h:27, half_width_collision_override:7 };
		sdGrass.crops[ sdGrass.VARIATION_TREE_LARGE ] = { x:96, y:0, w:46, h:54, half_width_collision_override:10 };
		sdGrass.crops[ sdGrass.VARIATION_TREE_LARGE_BARREN ] = { x:96, y:63, w:46, h:54, half_width_collision_override:10 };
		sdGrass.crops[ sdGrass.VARIATION_NEW_YEAR_TREE ] = { x:1, y:32, w:17, h:42, half_width_collision_override:10 };
		
		sdGrass.heights = [ 8, 14, 27 ]; // by variation. Also determines how much regen it will give
		
		sdGrass.max_tree_age = 30;
		
		//sdGrass.empty_dirt_brightness = 50; // Out of 100
		//sdGrass.dirt_brightness_decrease = 5;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get title()
	{
		return	this.variation === sdGrass.VARIATION_BUSH ? "Bush" : 
				this.variation === sdGrass.VARIATION_NEW_YEAR_TREE ? "New Year Tree" : 
				this.variation === sdGrass.VARIATION_TREE ? 'Tree' : 
				this.variation === sdGrass.VARIATION_TREE_BARREN ? 'Barren tree' : 
				this.variation === sdGrass.VARIATION_TREE_LARGE ? 'Tree' :
				this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN ? 'Barren tree' :
				'Grass';
	}
	/*get hitbox_x1() { return 0; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return ( 16 - sdGrass.heights[ this.variation ] || ( sdGrass.crops[ this.variation ] && sdGrass.crops[ this.variation ].h ) ) || 0; }
	get hitbox_y2() { return 16; }*/

	get hitbox_x1() { return sdGrass.crops[ this.variation ] && sdGrass.crops[ this.variation ].half_width_collision_override ? -sdGrass.crops[ this.variation ].half_width_collision_override : 0; }
	get hitbox_x2() { return sdGrass.crops[ this.variation ] && sdGrass.crops[ this.variation ].half_width_collision_override ? sdGrass.crops[ this.variation ].half_width_collision_override : 16; }
	get hitbox_y1() { return /*sdGrass.crops[ this.variation ] ? -sdGrass.crops[ this.variation ].h : */sdGrass.heights[ this.variation ] || ( this.variation === undefined ) ? ( ( 16 - sdGrass.heights[ this.variation ] ) || 0 ) : -sdGrass.crops[ this.variation ].h; }
	get hitbox_y2() { return /*sdGrass.crops[ this.variation ] ? 0 : 16*/sdGrass.heights[ this.variation ] ? 16 : 0; }
	
	IsTargetable( by_entity ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( by_entity && by_entity.is( sdBullet ) )
		{
			if ( by_entity._admin_picker )
			return true;
			
			if ( this.variation === sdGrass.VARIATION_TREE || this.variation === sdGrass.VARIATION_TREE_BARREN || this.variation === sdGrass.VARIATION_TREE_LARGE || this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN )
			if ( !by_entity._gun )
			if ( !by_entity.IsPlayerClass() )
			if ( !by_entity.is( sdTurret ) )
			{
				return true;
			}

			if ( this.variation >= sdGrass.VARIATION_BUSH )
			if ( by_entity._gun && sdWorld.entity_classes.sdGun.classes[ by_entity._gun.class ] )
			{

				if ( 
					sdWorld.entity_classes.sdGun.classes[ by_entity._gun.class ].is_sword ||
					sdWorld.entity_classes.sdGun.classes[ by_entity._gun.class ].slot === 0 )
				return true;
			}
		}
		
		return false;
	}
	
	DrawIn3D()
	{
		if ( this.variation === sdGrass.VARIATION_TREE || 
			 this.variation === sdGrass.VARIATION_TREE_BARREN || 
			 this.variation === sdGrass.VARIATION_TREE_LARGE || 
			 this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN || 
			 this.variation === sdGrass.VARIATION_NEW_YEAR_TREE )
		return FakeCanvasContext.DRAW_IN_3D_GRASS_SINGLE_LAYER;
		//return FakeCanvasContext.DRAW_IN_3D_FLAT; 
	
		return FakeCanvasContext.DRAW_IN_3D_GRASS; 
	}
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Grow()
	{
		if ( this.variation < 2 )
		{
			this.variation++;
			this._update_version++;
		}
	}
	Damage( dmg, initiator=null ) // Case of lava damage? Also throwable swords.
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.crystal && !this.crystal._is_being_removed )
		{
			this.DropCrystal();
			return;
		}
	
		this._hea -= dmg;
	
		if ( this._hea <= 0 )
		{
			if ( this.variation === sdGrass.VARIATION_TREE || this.variation === sdGrass.VARIATION_TREE_BARREN || this.variation === sdGrass.VARIATION_TREE_LARGE ||this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN )
			if ( initiator )
			if ( initiator.IsPlayerClass() )
			if ( initiator.build_tool_level === 0 )
			if ( initiator.gun_slot === 0 ) // Swords/fists
			{
				switch ( ~~( Math.random() * 20 ) )
				{
					case 0:  initiator.Say( 'Take this, you tree!', true, false, true ); break;
					case 1:  initiator.Say( 'Can\'t do much fighting back now, huh?!', true, false, true ); break;
					case 2:  initiator.Say( 'I like grass more anyway', true, false, true ); break;
					case 3:  initiator.Say( 'Wood should drop anytime now', true, false, true ); break;
					case 4:  initiator.Say( 'Where is wood?' ); break;
					case 5:  initiator.Say( 'Maybe I should press B instead', true, false, true ); break;
					case 6:  initiator.Say( 'Maybe I should look for matter somewhere else', true, false, true ); break;
					case 7:  initiator.Say( 'That was easy enough. Maybe I should make a business out of tree beating', true, false, true ); break;
					case 8:  initiator.Say( 'Sorry tree, I could not resist the urge', true, false, true ); break;
					case 9:  initiator.Say( 'This is what you get for growing on my way!', true, false, true ); break;
					case 10: initiator.Say( 'This tree was so funny you WOOD not belive it', true, false, true ); break;
					case 11: initiator.Say( 'What did the tree do when the bank closed? It started its own branch', true, false, true ); break;
					case 12: initiator.Say( 'How do trees get online? They just log in', true, false, true ); break;
					case 13: initiator.Say( 'How do you properly identify a dogwood tree? By the bark!', true, false, true ); break;
					case 14: initiator.Say( 'Why was the tree stumped? It couldn\'t get to the root of the problem', true, false, true ); break;
					case 15: initiator.Say( 'What type of tree fits in your hand? A palm tree', true, false, true ); break;
					case 16: initiator.Say( 'Why did the tree need to take a nap? For-rest', true, false, true ); break;
					case 17: initiator.Say( 'Why was the weeping willow so sad? It watched a sappy movie', true, false, true ); break;
					case 18: initiator.Say( 'Why do you never want to invite a tree to your party? Because they never leaf when you want them to', true, false, true ); break;
					case 19: initiator.Say( 'How do you know when a tree doesn\'t know the answer to something? It shrubs', true, false, true ); break;
				}
			}
			
			this.remove();
		}
	}
	
	onSnapshotApplied() // To override
	{
		// Update version where hue is a separate property
		if ( this.filter.indexOf( 'hue-rotate' ) !== -1 || this.filter.indexOf( 'brightness' ) !== -1 )
		{
			[ this.hue, this.br, this.filter ] = sdWorld.ExtractHueRotate( this.hue, this.br, this.filter );
		}
	}
	static GetTreeCrystalSpawnRate()
	{
		//return 100; // Hack
		
		//return 15000 + Math.random() * 1000 * 60 * 3;
		return ( 5000 + Math.random() * 10000 ) * 30;
	}
	constructor( params )
	{
		super( params );
		
		this.variation = params.variation || 0; // grass variation

		/*this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdGrass.MATERIAL_PLATFORMS;
		*/
		this.hue = params.hue || 0;
		this.br = params.br || 100;
		this.filter = params.filter || '';
		
		this._block = params.block || null;
		
		if ( this._block && this._block._is_being_removed )
		throw new Error( 'Spawning grass on a removed block... This should not happen.' );
		
		this.snowed = false;
		
		this._hea = ( this.variation >= sdGrass.VARIATION_BUSH ) ? ( ( this.variation === sdGrass.VARIATION_TREE_LARGE || this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN ) ? 140 : 70 ) : 1;
		this._hmax = this._hea;
		
		this._liquid_sip_timer = null;
		this._liquid_sip_target = null;
		
		//this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		
		this.onSnapshotApplied();
		
		//if ( this._block )
		//this._block.ValidatePlants( this );
		
		/*if ( this._block )
		{
			if ( !this._block._plants )
			{
				this._block._plants.push( this._net_id );
			}
			else
			if ( this._block._plants.indexOf( this._net_id ) === -1 )
			{
				this._block._plants.push( this._net_id );
			}
		}*/
				
		//trace( 'variation', this.variation, params.variation );
				
		if ( this.variation === sdGrass.VARIATION_TREE || this.variation === sdGrass.VARIATION_TREE_LARGE ||
			 this.variation === sdGrass.VARIATION_TREE_BARREN || this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN )
		{
			this.crystal = null;
			
			this.age = 0;
		
			if ( sdWorld.is_server )
			{
				let mult = ( this.variation === sdGrass.VARIATION_TREE_LARGE || this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN ) ? 0.7 : 1; // Large trees spawn crystals faster?
				this._balloon_crystal_spawn_timer = sdTimer.ExecuteWithDelay( ( timer )=>{

					if ( this._is_being_removed )
					{
						// Done
						this._balloon_crystal_spawn_timer = null;
					}
					else
					{
						this._hea = Math.min( this._hea + sdGrass.GetTreeCrystalSpawnRate() / 50, this._hmax );

						//let sun_intensity = sdWeather.only_instance.GetSunIntensity();

						if ( this.variation === sdGrass.VARIATION_TREE || this.variation === sdGrass.VARIATION_TREE_LARGE ) // Prevent barren spawn
						if ( !this.crystal || this.crystal._is_being_removed )
						//if ( Math.random() < 0.3 ) // 30% chance a crystal spawns
						//if ( sun_intensity < 0.5 ) // Only during night
						if ( sdWeather.only_instance.TraceDamagePossibleHere( this.x, this.y + this.hitbox_y1, Infinity, true ) ) // Only if sky is open above
						{
							let nears = sdWorld.GetAnythingNear( this.x, this.y, 8, null, null, ( ent )=>
							{
								if ( ent.is( sdBlock ) )
								if ( ent.IsDefaultGround() )
								//if ( ent.br > sdGrass.empty_dirt_brightness )
								{
									return true;
								}
								return false;
							});

							if ( nears.length > 0 )
							{
								let xx = this.x + ( this._hitbox_x1 + this._hitbox_x2 ) / 2;
								let yy = this.y + ( this._hitbox_y1 * 0.75 + this._hitbox_y2 * 0.25 );

								let an = Math.random() * Math.PI * 2;

								xx += Math.sin( an ) * 8;
								yy += Math.cos( an ) * 4;

								let ent = new sdCrystal({ x: xx, y: yy, tag:'deep', from_tree:this, type:sdCrystal.TYPE_CRYSTAL_BALLOON });
								sdEntity.entities.push( ent );

								if ( !ent.CanMoveWithoutOverlap( ent.x, ent.y ) )
								{
									ent.remove();
									ent._broken = false;
								}
								else
								{
									// Make sure they can be merged at least
									if ( ent.matter_max < 20 )
									ent.matter_max = 20;

									sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs
									ent.held_by = this;
									ent.onCarryStart();
									this.crystal = ent;
									this._update_version++;

									//let brightest = null;

									//for ( let i = 0; i < nears.length; i++ )
									//if ( brightest === null || nears[ i ].br > brightest.br )
									//brightest = nears[ i ];

									//brightest.br -= sdGrass.dirt_brightness_decrease;
									//brightest._update_version++;
									
									

									this.age++;
									this._update_version++;

									if ( this.age >= sdGrass.max_tree_age )
									{
										if ( this.variation === sdGrass.VARIATION_TREE )
										this.variation = sdGrass.VARIATION_TREE_BARREN;
										if ( this.variation === sdGrass.VARIATION_TREE_LARGE )
										this.variation = sdGrass.VARIATION_TREE_LARGE_BARREN;
										//return; // Do not reschedule
									}
								}
							}
						}
						this._balloon_crystal_spawn_timer = timer.ScheduleAgain( sdGrass.GetTreeCrystalSpawnRate() * mult );
					}

				}, sdGrass.GetTreeCrystalSpawnRate() * mult );
			}
		}
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_block' );
	}
	MeasureMatterCost()
	{
		if ( this.variation === sdGrass.VARIATION_TREE )
		return 500;
		
		return 100;
		//return this.width / 16 * this.height / 16;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	SetSnowed( v )
	{
		if ( this.snowed !== v )
		{
			this.snowed = v;
			this._update_version++;
		}
	}
	
	DrawFG( ctx, attached )
	{
		
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		ctx.sd_hue_rotation = this.hue;

		ctx.sd_color_mult_r = this.br / 100;
		ctx.sd_color_mult_g = this.br / 100;
		ctx.sd_color_mult_b = this.br / 100;
		
		if ( this.snowed )
		{
			ctx.filter += 'saturate(0.05) brightness(2)';
		}
		
		let c = sdGrass.crops[ this.variation ];
		
		if ( c.half_width_collision_override )
		ctx.drawImageFilterCache( sdGrass.img_grass_merged, c.x, c.y, c.w,c.h, -c.w/2, -c.h, c.w,c.h );
		else
		ctx.drawImageFilterCache( sdGrass.img_grass_merged, c.x, c.y, c.w,c.h, 0, 16-c.h, c.w,c.h );
		
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
		ctx.sd_color_mult_r = 1;
		ctx.sd_color_mult_g = 1;
		ctx.sd_color_mult_b = 1;
		ctx.globalAlpha = 1;
		
		if ( this.crystal && !this.crystal._is_being_removed )
		{
			ctx.save();
			{
				ctx.translate( this.crystal.x - this.x, this.crystal.y - this.y );
				this.crystal.DrawWithStatusEffects( ctx, true );
			}
			ctx.restore();
		}
	}
	DropCrystal( crystal_to_drop, initiated_by_player=false )
	{
		if ( !sdWorld.is_server )
		return false;
	
		if ( this.crystal )
		{
			this.crystal.sx = 0;
			this.crystal.sy = 0;
			this.crystal.held_by = null;
			this.crystal.onCarryEnd();
			this.crystal = null;
			this._update_version++;
			
			return true;
		}
		
		return false;
	}
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		this.DropCrystal();
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._block )
		{
			if ( !this._block._is_being_removed )
			if ( this._block._plants )
			{
				let id = this._block._plants.indexOf( this._net_id );
				if ( id >= 0 )
				{
					this._block._plants.splice( id, 1 );
					
					if ( this._block._plants.length === 0 )
					this._block._plants = null;
				}
			}
			this._block = null;
		}
		
		if ( this.variation === sdGrass.VARIATION_TREE || this.variation === sdGrass.VARIATION_TREE_BARREN || this.variation === sdGrass.VARIATION_TREE_LARGE || this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN )
		{
			sdWorld.BasicEntityBreakEffect( this, 5 );
		}
	}
	LookupLiquids( from_entity=null )
	{
		if ( typeof this.age === 'undefined' )
		return;
	
		if ( !from_entity )
		{
			from_entity = sdWater.GetWaterObjectAt( this.x - 4, this.y - 1, sdWater.TYPE_WATER );
			
			if ( !from_entity )
			from_entity = sdWater.GetWaterObjectAt( this.x + 4, this.y - 1, sdWater.TYPE_WATER );
		}
		
		if ( !from_entity )
		return;	
		
		if ( from_entity.type === sdWater.TYPE_WATER )
		{
			if ( !this._liquid_sip_timer )
			{
				this._liquid_sip_timer = sdTimer.ExecuteWithDelay( ( timer )=>{
					if ( this._is_being_removed || 
						 !this._liquid_sip_target || 
						 this._liquid_sip_target._is_being_removed || 
						 !this.DoesOverlapWith( this._liquid_sip_target ) )
					{
						// Done
						this._liquid_sip_timer = null;
					}
					else
					{
						if ( this.age > 5 )
						{
							this.age -= 5;
							if ( this.variation === sdGrass.VARIATION_TREE || this.variation === sdGrass.VARIATION_TREE_BARREN )
							this.variation = sdGrass.VARIATION_TREE;
							if ( this.variation === sdGrass.VARIATION_TREE_LARGE || this.variation === sdGrass.VARIATION_TREE_LARGE_BARREN )
							this.variation = sdGrass.VARIATION_TREE_LARGE;
							this._update_version++;
							
							if ( this._liquid_sip_target._volume > 0.2 )
							{
								this._liquid_sip_target._volume -= 0.1;
								this._liquid_sip_target.AwakeSelfAndNear();
							}
							else
							{
								this._liquid_sip_target.AwakeSelfAndNear();
								this._liquid_sip_target.remove();

								this._liquid_sip_target = null;

								/*this._liquid_sip_target = sdWater.GetWaterObjectAt( this.x - 4, this.y - 1, sdWater.TYPE_WATER );

								if ( !this._liquid_sip_target )
								this._liquid_sip_target = sdWater.GetWaterObjectAt( this.x + 4, this.y - 1, sdWater.TYPE_WATER );*/
												
								this.LookupLiquids();
							}
						}

						this._liquid_sip_timer = timer.ScheduleAgain( 3000 );
					}
				}, 3000 );
			}

			this._liquid_sip_target = from_entity;
		}
		else
		if ( from_entity.type === sdWater.TYPE_LAVA || from_entity.type === sdWater.TYPE_ACID )
		{
			this.age = sdGrass.max_tree_age;
			if ( this.variation === sdGrass.VARIATION_TREE )
			this.variation = sdGrass.VARIATION_TREE_BARREN;
			if ( this.variation === sdGrass.VARIATION_TREE_LARGE )
			this.variation = sdGrass.VARIATION_TREE_LARGE_BARREN;
			this._update_version++;
			/*
			if ( this._balloon_crystal_spawn_timer )
			{
				this._balloon_crystal_spawn_timer.Cancel();
				this._balloon_crystal_spawn_timer = null;
			}*/
		}
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( !this._is_being_removed )
		{
			if ( from_entity.IsPlayerClass() && !from_entity.is( sdWorld.entity_classes.sdPlayerSpectator ) )
			this.DropCrystal();
			else
			if ( from_entity.is( sdWater ) )
			{
				this.LookupLiquids( from_entity );
			}
			else
			if ( from_entity.is( sdCrystal ) )
			if ( from_entity.type === sdCrystal.TYPE_CRYSTAL_CRAB || 
				 from_entity.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
			if ( this.variation < sdGrass.heights.length )
			{
				let coefficient = ( sdGrass.heights[ this.variation ] / 27 );

				if ( from_entity.matter_regen < from_entity.max_matter_regen )
				from_entity.matter_regen = Math.min( from_entity.matter_regen + 16 * coefficient, from_entity.max_matter_regen );

				from_entity._hea = Math.min( from_entity._hea + 20 * coefficient, from_entity._hmax );

				sdSound.PlaySound({ name:'popcorn', x:from_entity.x, y:from_entity.y, volume:0.3, pitch:1.5 });

				this.remove();
			}
		}
	}
}
//sdGrass.init_class();

export default sdGrass;