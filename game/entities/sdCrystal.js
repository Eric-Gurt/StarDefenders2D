
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdStorage from './sdStorage.js';
import sdPlayerDrone from './sdPlayerDrone.js';
import sdMatterAmplifier from './sdMatterAmplifier.js';
import sdCube from './sdCube.js';
import sdCom from './sdCom.js';
import sdWater from './sdWater.js';
import sdEffect from './sdEffect.js';
import sdGrass from './sdGrass.js';
import sdGuanako from './sdGuanako.js';


class sdCrystal extends sdEntity
{
	static init_class()
	{
		sdCrystal.img_crystal = sdWorld.CreateImageFromFile( 'crystal' );
		sdCrystal.img_crystal_empty = sdWorld.CreateImageFromFile( 'crystal_empty' );
		
		sdCrystal.img_crystal_artificial = sdWorld.CreateImageFromFile( 'crystal_artificial' );
		sdCrystal.img_crystal_artificial_empty = sdWorld.CreateImageFromFile( 'crystal_artificial_empty' );

		sdCrystal.img_crystal_cluster = sdWorld.CreateImageFromFile( 'crystal_cluster' ); // Sprite by HastySnow / LazyRain
		sdCrystal.img_crystal_cluster_empty = sdWorld.CreateImageFromFile( 'crystal_cluster_empty' ); // Sprite by HastySnow / LazyRain

		sdCrystal.img_crystal_cluster2 = sdWorld.CreateImageFromFile( 'crystal_cluster2' ); // Sprite by Darkstar1
		sdCrystal.img_crystal_cluster2_empty = sdWorld.CreateImageFromFile( 'crystal_cluster2_empty' ); // Sprite by Darkstar1
		
		sdCrystal.img_crystal_balloon = sdWorld.CreateImageFromFile( 'crystal_balloon' );
		sdCrystal.img_crystal_balloon_empty = sdWorld.CreateImageFromFile( 'crystal_balloon_empty' );
		
		sdCrystal.img_crystal_crab = sdWorld.CreateImageFromFile( 'sdCrystalCrab' );
		
		sdCrystal.img_crystal_corrupted = sdWorld.CreateImageFromFile( 'crystal_corrupted' );
		
		sdCrystal.img_crystal_crab_big = sdWorld.CreateImageFromFile( 'sdCrystalCrabBig' ); // Sprite by Mrnat444
		
		sdCrystal.anticrystal_value = 5120 * 16; // 10240;
		
		sdCrystal.TYPE_CRYSTAL = 1;
		sdCrystal.TYPE_CRYSTAL_BIG = 2;
		sdCrystal.TYPE_CRYSTAL_CRAB = 3;
		sdCrystal.TYPE_CRYSTAL_CORRUPTED = 4;
		sdCrystal.TYPE_CRYSTAL_ARTIFICIAL = 5;
		sdCrystal.TYPE_CRYSTAL_CRAB_BIG = 6;
		sdCrystal.TYPE_CRYSTAL_BALLOON = 7; // Fragile, grow on trees?
		
		sdCrystal.max_seek_range = 500; // For big crystal crabs

		sdCrystal.recharges_until_depleated = 100;
		
		sdCrystal.hitpoints_artificial = 140;
		
		sdCrystal.lowest_matter_regen = 0; // 20;
		
		sdCrystal.ignored_classes_array = [ 'sdLifeBox' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	/*get hitbox_x1() { return this.should_draw === 0 ? -2 : this.type === 2 ? -14 : -4; }
	get hitbox_x2() { return this.should_draw === 0 ? 2 : this.type === 2 ? 14 : 5; }
	get hitbox_y1() { return this.should_draw === 0 ? -2 : this.type === 2 ? -14 : -7; }
	get hitbox_y2() { return this.should_draw === 0 ? 2 : this.type === 2 ? 16 : 5; }*/
	get hitbox_x1() { return this.type === sdCrystal.TYPE_CRYSTAL_BALLOON ? -6 : this.type === sdCrystal.TYPE_CRYSTAL_BIG || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ? -14 : -4; }
	get hitbox_x2() { return this.type === sdCrystal.TYPE_CRYSTAL_BALLOON ? 7 : this.type === sdCrystal.TYPE_CRYSTAL_BIG || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ? 14 : 5; }
	get hitbox_y1() { return this.type === sdCrystal.TYPE_CRYSTAL_BALLOON ? -6 : this.type === sdCrystal.TYPE_CRYSTAL_BIG || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ? -14 : this.type === sdCrystal.TYPE_CRYSTAL_ARTIFICIAL ? -4 : -7; }
	get hitbox_y2() { return this.type === sdCrystal.TYPE_CRYSTAL_BALLOON ? 7 : this.type === sdCrystal.TYPE_CRYSTAL_BIG || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ? 16 : 5; }
	
	get hard_collision() // For world geometry where players can walk
	//{ return this.held_by !== null ? false : true; }
	{ return true; }
	
	/* Causes client-side falling through unsynced ground, probably bad thing to do and it won't be complex entity after sdSnapPack is added
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }*/
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( this.held_by )
		if ( this.held_by.shielded )
		return false;
	
		return true;
	}
	
	get title()
	{
		if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
		return this.is_anticrystal ? T('Balloon-like anti-crystal') : T('Balloon-like crystal');
		
		if ( this.is_anticrystal )
		{
			if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
			return T('Anti-crystal crab');
			else
			return T('Anti-crystal');
		}
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
		return T('Crystal crab');
		else
		return T('Crystal');
	}
	
	/*get should_draw()
	{
		throw new Error('Obsolete, use this.held_by instead');
	}
	set should_draw( v )
	{
		throw new Error('Obsolete, use this.held_by instead');
	}*/
	
	/*getRequiredEntities() // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.held_by )
		return [ this.held_by ]; 
	
		return [];
	}*/
	
	get is_natural()
	{ return ( this.type !== sdCrystal.TYPE_CRYSTAL_ARTIFICIAL ); }
	
	get is_big()
	{ return ( this.type === sdCrystal.TYPE_CRYSTAL_BIG || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ); }
	
	get is_crab()
	{ return ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ); }
	
	get is_anticrystal()
	{
		if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
		return this.matter_max === sdCrystal.anticrystal_value * 0.25;
		
		return ( 
				this.matter_max === sdCrystal.anticrystal_value && 
				this.type !== sdCrystal.TYPE_CRYSTAL_BIG && 
				this.type !== sdCrystal.TYPE_CRYSTAL_CRAB_BIG 
			)
			|| 
			( 
				this.matter_max === sdCrystal.anticrystal_value * 4 && 
				( 
					this.type === sdCrystal.TYPE_CRYSTAL_BIG || 
					this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG 
				)
			);
	}
	
	get is_depleted()
	{ return ( this.matter_regen <= 33 ); }
	
	get is_very_depleted()
	{ return ( this.matter_regen <= 5 ); }
	
	get is_overcharged()
	{ return ( this.matter_regen > 133 ); }
	
	GetAutoConnectedEntityForMatterFlow()
	{
		return this.held_by;
	}
	
	get bounce_intensity()
	{ return this.type === sdCrystal.TYPE_CRYSTAL_BALLOON ? 0.7 : 0; }
	
	get friction_remain()
	{ return this.type === sdCrystal.TYPE_CRYSTAL_BALLOON ? 0.9 : 0.8; }
	
	constructor( params )
	{
		super( params );
		
		//let is_really_deep = params.tag && params.tag.indexOf( 'really_deep' ) !== -1; // params.tag === 'deep' || params.tag === 'deep_crab';
		
		let is_deep = params.tag && params.tag.indexOf( 'deep' ) !== -1; // params.tag === 'deep' || params.tag === 'deep_crab';
		
		if ( params.tag )
		{
			if ( params.tag.indexOf( 'crab' ) !== -1 && params.type !== sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
			params.type = sdCrystal.TYPE_CRYSTAL_CRAB;
			else
			if ( params.tag.indexOf( 'corrupted' ) !== -1 )
			params.type = sdCrystal.TYPE_CRYSTAL_CORRUPTED;
		}
		
		this.sx = 0;
		this.sy = 0;
		this.type = params.type || 1;
		this.matter_max = ( this.type === sdCrystal.TYPE_CRYSTAL_BIG || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ) ? 160 : 40;
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
		this.matter_max	= 10;
			
		this._time_amplification = 0;
		
		this._being_sawed_time = 0; // By saw. If broken near this time - clusters break into 4 smaller crystals instead

		this.held_by = null; // For amplifiers
		//this.should_draw = 1; // For storage crates, guns have ttl which can make them dissapear // EG: I think I'm missing something, but ttl is for deletion rather than being drawn? Revert to .should_draw if my changes break anything
		
		let bad_luck = 1; // 1.45; // High value crystals are more rare if this value is high
		
		let r = 1 - Math.pow( Math.random(), bad_luck );
		//let r = Math.random();
		
		//r = 0; // Hack
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
		{
			this._next_action = sdWorld.time + 2000;
			this.walk_direction = 0;
			this.side = -1;
			this.blink = 0;
			this._blink_until = 0;
			this._last_stand_when = 0;
			this.attack_anim = 0; // For big crystal crabs
		}
		
		//if ( is_really_deep )
		//r *= 0.25;
		
		
		let depth_tier = Math.max( 0, Math.floor( params.y / 1500 ) );
		r /= Math.pow( 2, Math.random() * depth_tier );
		
		if ( r < 0.00390625 / 8 && is_deep ) // matter consuming crystal
		this.matter_max *= 2048;
		else
		if ( r < 0.00390625 / 4 && is_deep ) // new 2022
		this.matter_max *= 1024;
		else
		if ( r < 0.00390625 / 2 && is_deep ) // new 2022
		this.matter_max *= 512;
		else
		if ( r < 0.00390625 && is_deep ) // new 2022
		this.matter_max *= 256;
		else
		if ( r < 0.0078125 && is_deep ) // glowing, new
		this.matter_max *= 128;
		else
		if ( r < 0.015625 && is_deep ) // Red, new
		this.matter_max *= 64;
		else
		if ( r < 0.03125 && is_deep ) // Pink variation, new (old red)
		this.matter_max *= 32;
		else
		if ( r < 0.0625 )
		this.matter_max *= 16;
		else
		if ( r < 0.125 )
		this.matter_max *= 8;
		else
		if ( r < 0.25 )
		this.matter_max *= 4;
		else
		if ( r < 0.5 )
		this.matter_max *= 2;
		
		this._last_damage = 0; // Sound flood prevention

		this.matter_regen = params.matter_regen || 100; // Matter regeneration rate/percentage, depends on crystal and drains as crystal regenerates matter
		
		if ( typeof params.matter_max !== 'undefined' )
		this.matter_max = params.matter_max;
	
		if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type === 1 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && ( this.type === 2 || this.type === 6 ) ) )
		{
			this.matter = 0;
			this._hea = this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ? 800 : 600;
			this._damagable_in = 0;
		}
		else
		{
			this.matter = this.matter_max;
			this._hea = this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ? 300 : this.type === sdCrystal.TYPE_CRYSTAL_BIG ? 240 : 60;
			this._damagable_in = sdWorld.time + 1000; // Suggested by zimmermannliam, will only work for sdCharacter damage		
		}
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
		{
			this._hea = 15;
			this._spawn_anim = 0;
		}
		
		this._hmax = this._hea; // For repair logic
		
		// Crabs can be healed x2 from original health (from grass)
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
		this._hmax *= 2; 

		this._current_target = null; // For big crystal crabs
	}
	
	onSnapshotApplied() // To override
	{
		if ( sdWorld.is_server )
		if ( !sdWorld.is_singleplayer )
		{
			//if ( sdWorld.time < 1692486127166 + 1000 * 60 * 60 * 24 * 30 * 1 ) // 1 year for patch to be applied everywhere? Trying to prevent improper crystal attachment to trees
			// Issue still kind of exists on one of servers... 1000 active balloon crystals just lying around
			if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON && ( this.held_by === null || this.held_by.crystal !== this ) )
			{
				this.remove();
				this._broken = false;
			}
		}
	}

	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdCrystal.ignored_classes_array;
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( initiator._is_being_removed )
		initiator = null;

		if ( initiator )
		if ( initiator.is( sdGuanako ) )
		return;

		//if ( this.held_by !== null )
		//return;
		
		if ( this.held_by )
		if ( typeof this.held_by.DropCrystal !== 'undefined' )
		{
			this.held_by.DropCrystal( this, true );
		}
	
		//if ( initiator !== null )
		if ( initiator === null || initiator.IsPlayerClass() )
		if ( sdWorld.time < this._damagable_in )
		if ( !( initiator && initiator.IsPlayerClass() && initiator.power_ef > 0 ) )
		{
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });
			return;
		}

		if ( initiator )
		if ( !initiator.is( sdCrystal ) )
		if ( !initiator.is( sdCube ) )
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
		{
			this._current_target = initiator;
			this._next_action = sdWorld.time;
		}
		
		dmg = Math.abs( dmg );
		
		let was_alive = ( this._hea > 0 );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		{
			if ( was_alive )
			{
				if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
				{
					sdSound.PlaySound({ name:'pop', x:this.x, y:this.y, volume:0.5, pitch:1.3 });
					sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.1, pitch:0.95 + Math.random() * 0.2 });
				}
				else
				{
					//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:1 });
					sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.5, pitch:0.95 + Math.random() * 0.2 });
				}
				
				if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
				sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, pitch: this.type === 3 ? 1 : 0.5, volume:0.5 });
				
				let replacement_entity = null;
				let drop_reward = true;
				
				// DropShards( x,y,sx,sy, tot, value_mult, radius=0, shard_class_id=sdGun.CLASS_CRYSTAL_SHARD, normal_ttl_seconds=9, ignore_collisions_with=null, follow=null )
				
				if ( this.type === sdCrystal.TYPE_CRYSTAL_BIG || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ) // Big crystals/big crystal crabs
				{
					let xx_tot = 1;
					let yy_tot = 1;
					
					if ( Math.abs( sdWorld.time - this._being_sawed_time ) < 1500 )
					{
						xx_tot = 2;
						yy_tot = 2;
						drop_reward = false;
					}
					
					for ( let xx = 0; xx < xx_tot; xx++ )
					for ( let yy = 0; yy < yy_tot; yy++ )
					{
						let ent = new sdCrystal({ 
							x: this.x, 
							y: this.y, 
							sx: this.sx, 
							sy: this.sy, 
							type: 1 
						});
						
						if ( xx_tot === 2 && yy_tot === 2 )
						{
							if ( xx === 0 )
							ent.x -= 5.5;
							else
							ent.x += 5.5;
						
							if ( yy === 0 )
							ent.y -= 12;
						}
						
						ent.matter_max = this.matter_max / 4;
						ent.matter = this.matter / 4;
						ent.matter_regen = this.matter_regen;

						sdEntity.entities.push( ent );
						sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible

						replacement_entity = ent;
					}

					
					sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
						Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ) * ( 4 - xx_tot * yy_tot ),
						this.matter_max / 160,
						8,
						undefined,
						undefined,
						replacement_entity
					);
				}
				else
				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
					Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					this.matter_max / 40,
					5,
					undefined,
					undefined,
					replacement_entity
				);
		
				if ( drop_reward )
				{
					let reward_amount = sdEntity.SCORE_REWARD_BROKEN_5K_CRYSTAL * this.matter_max / 5120;

					reward_amount *= this.matter_regen / 100;

					if ( this.is_crab )
					{
						reward_amount = Math.max( reward_amount, sdEntity.SCORE_REWARD_BROKEN_CRAB_CRYSTAL );

						if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
						reward_amount = Math.max( reward_amount, sdEntity.SCORE_REWARD_BROKEN_BIG_CRAB_CRYSTAL );
					}
					else
					if ( this.is_anticrystal || this.matter_max >= 180000 || this.matter_regen >= 450 ) // Too high matter and regeneration will crash the server ( Preset Editor )
					{
						reward_amount = 0;
					}

					reward_amount = ~~( reward_amount );

					if ( reward_amount > 0 )
					{
						//this.GiveScoreToLastAttacker( reward_amount );
						sdWorld.GiveScoreToPlayerEntity( reward_amount, replacement_entity || this, true, null );
					}
				}

				this.remove();
			}
		}
		else
		{
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
				
				if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
				{
					sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, pitch: this.type === 3 ? 1.5 : 0.8, volume:0.3 });
					
					this._blink_until = sdWorld.time + 1000;
				}
			}
		}
	}
	
	get mass() { return this.type === sdCrystal.TYPE_CRYSTAL_BALLOON ? 5 : ( this.type === 2 || this.type === 6 ) ? 120 : 30; }
	Impulse( x, y )
	{
		if ( this.held_by )
		return;
	
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	
	Impact( vel ) // fall damage basically. Values below 5 won't be reported due to no-damage area lookup optimization
	{
		let min_vel = 6;
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
		min_vel = 6.2;
		
		if ( vel > min_vel ) // For new mass-based model
		{
			this.DamageWithEffect( ( vel - 3 ) * 15 );
		}
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.is_anticrystal )
		GSPEED *= 0.25;
	
		let GSPEED_scaled = sdGun.HandleTimeAmplification( this, GSPEED );
		
		if ( this.held_by )
		{
			// Usually all crystals can regenerate when they are in some amplifiers
			
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hmax, this._hea + GSPEED * 0.01 ); // Quite slow
		
			if ( sdWorld.server_config.base_degradation )
			if ( sdWorld.server_config.base_shielding_units_passive_drain_per_week_blue > 0 )
			if ( this.held_by.is( sdMatterAmplifier ) )
			this.matter_regen = sdWorld.MorphWithTimeScale( this.matter_regen, 0, 1 - sdWorld.server_config.base_shielding_units_passive_drain_per_week_blue, GSPEED * this.held_by.multiplier/8 / ( 30 * 60 * 60 * 24 * 7 ) ); // 20% per week on highest tier
		}
		else
		{
			
			if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
			{
				let in_water = sdWater.all_swimmers.has( this );
				
				if ( in_water )
				this.sy -= sdWorld.gravity * GSPEED;
				else
				this.sy += sdWorld.gravity * GSPEED * 0.333;
			
				this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.96, GSPEED );
				this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.96, GSPEED );
			}
			else
			{
				this.sy += sdWorld.gravity * GSPEED;
			}
		}
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
		{
			if ( sdWorld.is_server )
			{
				if ( this.attack_anim > 0 )
				this.attack_anim -= GSPEED;

				if ( this.matter > 5 )
				{
					if ( sdWorld.time > this._next_action )
					{
						if ( this._current_target ) // If big crystal crab
						{
							if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdCrystal.max_seek_range + 32 || ( this._current_target.hea || this._current_target._hea || 0 ) <= 0 )
							this._current_target = null;
							else
							if ( !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
							{
								this._next_action = sdWorld.time + ( this.matter_max === sdCrystal.anticrystal_value * 4 ? 1600 : 400 );

								this.side = ( this._current_target.x > this.x ) ? 1 : -1;

								this.walk_direction = this.side * 80;

								if ( Math.random() < 0.333 || ( this.sx === 0 && this.y + 50 > this._current_target.y ) )
								{
									this.sy -= 4;
									this.sx += this.side * 0.3;
								}
								this.PhysWakeUp();

								if ( 
					
								this.x + this._hitbox_x2 > this._current_target.x + this._current_target._hitbox_x1 - 5 &&
								this.x + this._hitbox_x1 < this._current_target.x + this._current_target._hitbox_x2 + 5 &&
								this.y + this._hitbox_y2 > this._current_target.y + this._current_target._hitbox_y1 - 5 &&
								this.y + this._hitbox_y1 < this._current_target.y + this._current_target._hitbox_y2 + 5
								
								)
								{
									let xx = this._current_target.x + ( this._current_target._hitbox_x1 + this._current_target._hitbox_x2 ) / 2;
									let yy = this._current_target.y + ( this._current_target._hitbox_y1 + this._current_target._hitbox_y2 ) / 2;
									
									if ( this._current_target.IsTargetable() )
									if ( sdWorld.CheckLineOfSight( this.x, this.y, this._current_target.x, this._current_target.y, null, null, sdCom.com_creature_attack_unignored_classes ) )
									{
										this._next_action += 400;

										this.attack_anim = 8;
										
										this._current_target.DamageWithEffect( 30, this );
					
										this._current_target.PlayDamageEffect( xx, yy );
										//sdWorld.SendEffect({ x:xx, y:yy, type:this._current_target.GetBleedEffect(), filter:this._current_target.GetBleedEffectFilter() });
										
										sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1.3, pitch: 0.3 });
									}
									
								}
							}
						}
						else
						{
							this._next_action = sdWorld.time + 1500 + Math.random() * 6000;

							let r = Math.random();

							if ( r < 0.333 )
							this._blink_until = sdWorld.time + 200 + Math.random() * 200;
							else
							if ( r < 0.5 )
							{
								//this.side = Math.random() < 0.5 ? 1 : -1;
								this.sy -= ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ) ? 4 : 3;
								this.walk_direction = this.side * 60;
								this.PhysWakeUp();
							}
							else
							{
								this.walk_direction = -100 + Math.random() * 200;
								this.side = this.walk_direction > 0 ? 1 : -1;
							}
						}
					}
					this.blink = sdWorld.time < this._blink_until;
				}
				else
				this.blink = 1;
			}

			if ( !this.held_by )
			{
				if ( this.walk_direction !== 0 )
				{
					if ( sdWorld.time < this._last_stand_when + 50 )
					{
						this.sx += this.walk_direction * 0.01 * GSPEED;
					}

					this.PhysWakeUp();

					if ( this.walk_direction > 0 )
					this.walk_direction = Math.max( 0, this.walk_direction - GSPEED );
					else
					this.walk_direction = Math.min( 0, this.walk_direction + GSPEED );
				}

				sdWorld.last_hit_entity = null;

				this.ApplyVelocityAndCollisions( GSPEED, 0, this.sy >= 0 );

				if ( sdWorld.last_hit_entity )
				{
					this._last_stand_when = sdWorld.time;
				}
			}
		}
		else
		{
			if ( !this.held_by )
			{
				if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
				this.ApplyVelocityAndCollisions( GSPEED, 8.1, true );
				else
				this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			}
		}
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
		{
			if ( this._spawn_anim < 1 )
			{
				if ( this.held_by && this.held_by.is( sdGrass ) )
				this._spawn_anim = Math.min( 1, this._spawn_anim + GSPEED * 0.01 );
				else
				this._spawn_anim = 1;
			}
		}
		
		
		//if ( this.held_by === null ) // Don't emit matter if inside a crate

		if ( this.held_by && this.held_by.is( sdGrass ) )
		{
			// Don't emit matter on trees
		}
		else
		{
			if ( this.is_anticrystal )
			{
				if ( this.held_by === null || !this.held_by.shielded )
				{
					this.HungryMatterGlow( 0.01, 100, GSPEED_scaled );
					this.matter = Math.max( 0, this.matter - GSPEED_scaled * 0.01 * this.matter );
				}
			}
			else
			{
				let matter_before_regen = this.matter;

				if ( this.held_by && this.held_by.is( sdMatterAmplifier ) )
				this.matter = Math.min( this.matter_max, this.matter + GSPEED_scaled * 0.001 * this.matter_max / 80 * ( this.matter_regen / 100 ) * ( sdMatterAmplifier.relative_regen_amplification_to_crystals * ( this.held_by.multiplier ) ) );
				else
				this.matter = Math.min( this.matter_max, this.matter + GSPEED_scaled * 0.001 * this.matter_max / 80 * ( this.matter_regen / 100 ) );

				if ( sdWorld.server_config.base_degradation )
				this.matter_regen = Math.max( sdCrystal.lowest_matter_regen, this.matter_regen - ( this.matter - matter_before_regen ) / this.matter_max * 100 / sdCrystal.recharges_until_depleated ); // 30 full recharges

				this.MatterGlow( 0.01, 30, GSPEED_scaled );
			}
		}
		
		// Similar to sdMatterContainers but not really, since it can have consistent slight movement unlike containers
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.1 || Math.abs( this._last_sync_x - this.x ) >= 1 || Math.abs( this._last_sync_y - this.y ) >= 1 )
		{
			this._last_sync_matter = this.matter;
			this._last_sync_x = this.x;
			this._last_sync_y = this.y;
			this._update_version++;
		}*/
	}
	
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		// Easier crystal combining
		if ( this.held_by )
		{
			if ( this.held_by.is( sdGrass ) ) // On a tree
			if ( from_entity.IsPlayerClass() )
			if ( from_entity.hard_collision )
			{
				this.held_by.DropCrystal();
				return;
			}
			
			if ( from_entity )
			if ( from_entity.is( sdCrystal ) )
			if ( from_entity.held_by !== this.held_by )
			{
				this.held_by.onMovementInRange( from_entity );
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.should_draw === 1 )
		//if ( this.held_by === null )
		{
			if ( this.is_anticrystal )
			sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )" );
			else
			{
				// Limit vision to cable managment owner
				if ( sdWorld.my_entity.is( sdPlayerDrone ) ||
					( sdWorld.my_entity._inventory[ sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].slot ] && 
					  sdWorld.my_entity._inventory[ sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].slot ].class === sdGun.CLASS_CABLE_TOOL ) )
				sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " ) (matter regeneration rate: " + ~~(this.matter_regen ) + "%)" );
				else
				{
					if ( this.is_depleted )
					sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " ) (depleted)" );
					else
					sdEntity.TooltipUntranslated( ctx, this.title + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )" );
				}
			}
		}
	}
	HookAttempt() // true for allow. this._current_target is sdBullet that is hook tracer
	{
		if ( !sdWorld.is_server )
		return false;
				
		if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
		{
			setTimeout( ()=>{
				if ( !this._is_being_removed )
				{
					this._damagable_in = 0;
					this.DamageWithEffect( 15 );
				}
			}, 300 );
			//return false;
		}
	
		if ( this.held_by )
		if ( typeof this.held_by.DropCrystal !== 'undefined' )
		{
			this.held_by.DropCrystal( this, true );
		}
		
		return true;
	}
	static DoNothing( filter )
	{
		return filter;
	}
	Draw( ctx, attached )
	{
		let filter_brightness_effect = sdCrystal.DoNothing;
		
		ctx.apply_shading = false;
		
		if ( attached )
		if ( this.held_by )
		if ( this.held_by.ModifyHeldCrystalFilter )
		filter_brightness_effect = ( f )=>{ return this.held_by.ModifyHeldCrystalFilter( f ) };
		
		const setFilter = ( crystal_hue_filter )=>
		{
			let f = crystal_hue_filter;

			if ( this.is_very_depleted )
			f += 'saturate(0.15) hue-rotate(-20deg)';
			else
			if ( this.is_depleted )
			f += 'saturate(0.5) hue-rotate(-20deg)';
			else
			if ( this.is_overcharged )
			f += 'saturate(2) brightness(1.5)';

			ctx.filter = filter_brightness_effect( f );
		};
		
		//for ( let test = 0; test < 3; test++ )
		{
			if ( this.held_by === null || attached )
			{
				if (	this.type === sdCrystal.TYPE_CRYSTAL || 
						this.type === sdCrystal.TYPE_CRYSTAL_CORRUPTED || 
						this.type === sdCrystal.TYPE_CRYSTAL_ARTIFICIAL ||
						this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
				{
					let empty_img = sdCrystal.img_crystal_empty;
					let full_img = sdCrystal.img_crystal;
					let visual_matter_mult = 1;
					let alpha_mult = 1;
					
					if ( this.type === sdCrystal.TYPE_CRYSTAL_ARTIFICIAL )
					{
						empty_img = sdCrystal.img_crystal_artificial_empty;
						full_img = sdCrystal.img_crystal_artificial;
					}
					
					if ( this.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
					{
						empty_img = sdCrystal.img_crystal_balloon_empty;
						full_img = sdCrystal.img_crystal_balloon;
						visual_matter_mult = 4;
						alpha_mult = 0.85;
						
						if ( !sdShop.isDrawing )
						{
							let s = ( 1 - ( Math.cos( this._spawn_anim * Math.PI ) * 0.5 + 0.5 ) ) * 0.9 + 0.1;
							ctx.scale( s, s );
						}
					}
					
					let visual_matter_max = this.matter_max * visual_matter_mult;
					let visual_matter = this.matter * visual_matter_mult;
					ctx.drawImageFilterCache( empty_img, - 16, - 16, 32, 32 );

					setFilter( sdWorld.GetCrystalHue( visual_matter_max ) );

					if ( visual_matter_max === sdCrystal.anticrystal_value )
					ctx.globalAlpha = ( 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1 ) * alpha_mult;
					else
					ctx.globalAlpha = ( visual_matter / visual_matter_max ) * alpha_mult;

					ctx.drawImageFilterCache( full_img, - 16, - 16, 32, 32 );

					ctx.globalAlpha = 1;
					ctx.filter = 'none';

					if ( this.type === sdCrystal.TYPE_CRYSTAL_CORRUPTED )
					{
						ctx.drawImageFilterCache( sdCrystal.img_crystal_corrupted, - 16, - 16, 32, 32 );
					}
				}
				else
				if ( this.type === sdCrystal.TYPE_CRYSTAL_BIG )
				{
					ctx.drawImageFilterCache( sdCrystal.img_crystal_cluster2_empty, - 24, - 24, 48, 48 );

					//ctx.filter = filter_brightness_effect( sdWorld.GetCrystalHue( this.matter_max / 4 ) );
					setFilter( sdWorld.GetCrystalHue( this.matter_max / 4 ) );

					if ( this.matter_max === sdCrystal.anticrystal_value * 4 )
					ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
					else
					ctx.globalAlpha = this.matter / this.matter_max;

					ctx.drawImageFilterCache( sdCrystal.img_crystal_cluster2, - 24, - 24, 48, 48 );

					ctx.globalAlpha = 1;
					ctx.filter = 'none';
				}
				else
				if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB || this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
				{
					ctx.scale( -this.side, 1 );

					let frame = 0;

					if ( this.walk_direction !== 0 && this.attack_anim <= 0 )
					{
						frame = [ 0, 1, 0, 2 ][ ~~( Math.abs( this.walk_direction / 4 ) % 4 ) ];
					}
					else
					if ( this.blink )
					frame = 3;
					else
					if ( this.attack_anim > 0 )
					frame = 4;

					if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
					ctx.drawImageFilterCache( sdCrystal.img_crystal_crab, frame*32,32,32,32, - 16, - 16, 32,32 );
					else
					ctx.drawImageFilterCache( sdCrystal.img_crystal_crab_big, frame*48,48,48,48, - 24, - 24, 48,48 );

					//ctx.filter = filter_brightness_effect( sdWorld.GetCrystalHue( (this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ) ? this.matter_max / 4: this.matter_max, 0.75, 'aa' ) );
					setFilter( sdWorld.GetCrystalHue( (this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG ) ? this.matter_max / 4: this.matter_max, 0.75, 'aa' ) );

					if ( ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB && this.matter_max === sdCrystal.anticrystal_value ) || ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG && this.matter_max === sdCrystal.anticrystal_value * 4 ) )
					ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
					else
					ctx.globalAlpha = this.matter / this.matter_max;

					if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
					ctx.drawImageFilterCache( sdCrystal.img_crystal_crab, frame*32,0,32,32, - 16, - 16, 32,32 );
					else
					ctx.drawImageFilterCache( sdCrystal.img_crystal_crab_big, frame*48,0,48,48, - 24, - 24, 48,48 );

					ctx.globalAlpha = 1;
					ctx.filter = 'none';
				}

			}
			
			//ctx.translate( 0, -16 );
		}
		
		//ctx.apply_shading = true;
	}
	onBeforeRemove() // Class-specific, if needed
	{
		if ( this.held_by )
		if ( typeof this.held_by.DropCrystal !== 'undefined' )
		{
			this.held_by.DropCrystal( this );
		}
		
		/*if ( this._hea <= 0 ) // In else case it was just removed (not best way to check)
		{
			sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
				Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 40
			);
		}*/
	}
	MeasureMatterCost()
	{
		return 0; // Hack
		
		//return this._hmax * sdWorld.damage_to_matter + this.matter;
	}
	
}
//sdCrystal.init_class();

export default sdCrystal;
