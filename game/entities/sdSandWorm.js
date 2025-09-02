
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdWater from './sdWater.js';
import sdBlock from './sdBlock.js';
import sdCube from './sdCube.js';
import sdGun from './sdGun.js';
import sdCrystal from './sdCrystal.js';
import sdBG from './sdBG.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
import sdBullet from './sdBullet.js';
import sdCom from './sdCom.js';
import sdRift from './sdRift.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';

class sdSandWorm extends sdEntity
{
	static init_class()
	{
		sdSandWorm.img_worm_head_idle = sdWorld.CreateImageFromFile( 'worm_head_idle' );
		sdSandWorm.img_worm_head_attack = sdWorld.CreateImageFromFile( 'worm_head_attack' );
		sdSandWorm.img_worm_body = sdWorld.CreateImageFromFile( 'worm_body' );

		// Sprite by Gashadokuro for spiky worms
		sdSandWorm.img_worm_spiky_head_idle = sdWorld.CreateImageFromFile( 'worm_spiky_head_idle' ); 
		sdSandWorm.img_worm_spiky_head_attack = sdWorld.CreateImageFromFile( 'worm_spiky_head_attack' );
		sdSandWorm.img_worm_spiky_body = sdWorld.CreateImageFromFile( 'worm_spiky_body' );

		sdSandWorm.img_worm_corrupted_head_idle = sdWorld.CreateImageFromFile( 'worm_corrupted_head_idle' );
		sdSandWorm.img_worm_corrupted_head_attack = sdWorld.CreateImageFromFile( 'worm_corrupted_head_attack' );
		sdSandWorm.img_worm_corrupted_body = sdWorld.CreateImageFromFile( 'worm_corrupted_body' );

		// Council mecha worm sprites by 𝔱revoga
		sdSandWorm.img_worm_council_head_idle = sdWorld.CreateImageFromFile( 'worm_council_head_idle' );
		sdSandWorm.img_worm_council_head_attack = sdWorld.CreateImageFromFile( 'worm_council_head_attack' );
		sdSandWorm.img_worm_council_glow = sdWorld.CreateImageFromFile( 'worm_council_glow' );
		sdSandWorm.img_worm_council_glow_body = sdWorld.CreateImageFromFile( 'worm_council_glow_body' );
		sdSandWorm.img_worm_council_body = sdWorld.CreateImageFromFile( 'worm_council_body' );
		
		sdSandWorm.img_crystal_hunting_worm_head_idle = sdWorld.CreateImageFromFile( 'worm_chunter_head_idle' );
		sdSandWorm.img_crystal_hunting_worm_head_attack = sdWorld.CreateImageFromFile( 'worm_chunter_head_attack' );
		sdSandWorm.img_crystal_hunting_worm_body = sdWorld.CreateImageFromFile( 'worm_chunter_body' );
		
		sdSandWorm.post_death_ttl = 30 * 6;
		
		sdSandWorm.max_seek_range = 1000;
		
		sdSandWorm.segment_dist = 18;
		
		sdSandWorm.head_bounds_health = 200;
		
		
		
		sdSandWorm.worms_tot = 0;
		
		
		sdSandWorm.travel_in = [ 'sdBlock', 'sdWater' ];
		
		sdSandWorm.ignoring = [ 'sdWater', 'sdSandWorm' ];
		sdSandWorm.ignoring_dead = [ 'sdSandWorm' ];

		sdSandWorm.KIND_NORMAL_WORM = 0;
		sdSandWorm.KIND_SPIKY_WORM = 1;
		sdSandWorm.KIND_CORRUPTED_WORM = 2;
		sdSandWorm.KIND_COUNCIL_WORM = 3;
		sdSandWorm.KIND_CRYSTAL_HUNTING_WORM = 4;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	// 8 as max dimension so it can fit into one block
	get hitbox_x1() { return -11 * this.scale; }
	get hitbox_x2() { return 11 * this.scale; }
	get hitbox_y1() { return -11 * this.scale; }
	get hitbox_y2() { return 11 * this.scale; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	
	/*
	PreInit() // Best place for NaN tracking methods initialization
	{
		if ( globalThis.CATCH_ERRORS )
		{
			globalThis.EnforceChangeLog( this, 'sx', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 'sy', true, 'nan_catch' );
			
			globalThis.EnforceChangeLog( this, 'x', true, 'nan_catch' );
			globalThis.EnforceChangeLog( this, 'y', true, 'nan_catch' );
		}
	}*/
	
	constructor( params )
	{
		super( params );
		
		if ( params.tag )
		{
			if ( params.tag === 'corrupted' )
			params.tag = sdSandWorm.KIND_CORRUPTED_WORM;
			
			if ( typeof params.tag === 'string' )
			//if ( sdSandWorm[ params.tag ] !== undefined )
			params.kind = sdSandWorm[ params.tag ];
			else
			if ( typeof params.tag === 'number' )
			{
			}
			else
			debugger;
		}
		
		this.sx = 0;
		this.sy = 0;

		this.kind = params.kind || 0;
		
		this._ai_team = -1; // Default set to -1

		//if ( is_corrupted )
		//this.kind = sdSandWorm.KIND_CORRUPTED_WORM;

		this.scale = params.scale || Math.max( 0.6, Math.random() * 2 );
		
		if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM )
		{
			this._regen_timeout = 0; // For HP regen
			this.scale = params.scale || 1;
			this._ai_team = 3; // So other Council stuff doesn't attack it
		}
		
		if ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
		{
			this.scale = 0.6;
		}

		this._hmax = ( this.kind === sdSandWorm.KIND_COUNCIL_WORM ? ( this.scale >= 1 ? 12 : 4 ) : this.kind === sdSandWorm.KIND_CORRUPTED_WORM ? 1.5 : 1 ) * 700 * Math.pow( this.scale, 2 );// Bigger worms = more health
		this._hea = this._hmax;

		this._regen_timeout = 0; // For council worm HP regen, for some reason it claims object is not extensible if placed in brackets below which check if the worm is council one.

		this._spawn_wyrmhide_on_death = false; // Should this body part spawn Wyrmhide on death?
		
		this._time_until_full_remove = 30 * 10 + Math.random() * 30 * 10; // 10-20 seconds to get removed
		
		this._current_target = null;
		
		this.death_anim = 0;
		
		this.towards_head = null;
		this.towards_tail = null;
		
		this.model = 0;
		
		this._an = 0;
		this.forced_x = 0; // Attacks turn head using this var
		this.forced_y = 0; // Attacks turn head using this var
		
		this._hp_main_max = this._hmax * 7;
		this._hp_main = this._hp_main_max; // Actual hitpoints
		
		this._in_surface_time = sdWorld.time;
		this._in_surface = null;
		this._in_water = null;
		
		this._last_attack = sdWorld.time;
		
		this._last_found_target = 0; // When has it last time found a target? Used for Crystal Hunting Worm.
		
		
		this._hibernation_check_timer = 30;
		
		sdSandWorm.worms_tot++;
		
		this.hue = ~~( Math.random() * 360 );
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
		this.filter = 'saturate(0.5)';
		
		
		this._can_spawn_more = true;
	}
	
	isFireAndAcidDamageResistant()
	{
		return ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM );
	}
	
	CanBuryIntoBlocks()
	{
		if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM )
		return 0;
		
		if ( this.kind === sdSandWorm.KIND_CORRUPTED_WORM )
		return 2;
	
	
		return 1; // 0 = no blocks, 1 = natural blocks, 2 = corruption, 3 = flesh blocks
	}
	
	onBeforeRemove()
	{
		// Forget all pointers
		this._current_target = null;
		this._in_surface = null;
		this._in_water = null;
		
		if ( this.towards_head )
		{
			this.towards_head.towards_tail = null;
			this.towards_head = null;
		}
		if ( this.towards_tail )
		{
			this.towards_tail.towards_head = null;
			this.towards_tail = null;
		}
	}
	GetHeadEntity()
	{
		var ptr = this;
		while ( true )
		{
			if ( ptr.towards_head && !ptr.towards_head._is_being_removed )
			ptr = ptr.towards_head;
			else
			break;
		}
		
		if ( ptr.model !== 2 )
		return ptr;
		else
		return { // Pseudo=entity for case of loaded snapshot
			towards_tail: ptr,
			_hp_main: 0,
			_hea: 0,
			_is_being_removed: true
		};
	}
	
	HasEnoughMatter( ent ) // sdSandWorms will actually hunt entities that have some amount of matter, for example one that is enough to buy damage upgrades. Thus won't target new players
	{
		return ( ent.matter >= ( this.kind === sdSandWorm.KIND_COUNCIL_WORM ? 1000 : this.kind === sdSandWorm.KIND_SPIKY_WORM ? 400 : 200 ) * this.scale ); // I think getting to 100 matter sets worms to hunt players while they're upgrading damage and health, this is more fair IMO - Booraz
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( !this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
		if ( this._hea > 0 )
		if ( character.IsVisible() )
		if ( character.hea > 0 )
		if ( this.HasEnoughMatter( character ) )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdSandWorm.max_seek_range )
			if ( this._current_target === null || 
				 !this._current_target.is( sdCharacter ) ||
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				//sdSound.PlaySound({ name:'quickie_alert', x:this.x, y:this.y, volume: 0.5, pitch: 2 });
			}
		}
	}
	GetBleedEffect()
	{
		return this.kind === sdSandWorm.KIND_COUNCIL_WORM ? sdEffect.TYPE_WALL_HIT : sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectHue()
	{
		return this.kind === sdSandWorm.KIND_COUNCIL_WORM ? 0 : this.hue;
	}
	GetBleedEffectFilter()
	{
		return this.kind === sdSandWorm.KIND_COUNCIL_WORM ? '' : this.filter;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( initiator._is_being_removed )
		initiator = null;

		dmg = Math.abs( dmg );

		if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM )
		this._regen_timeout = 30;
		
		let head_entity = this.GetHeadEntity();

		if ( head_entity !== this && this.kind === sdSandWorm.KIND_SPIKY_WORM ) // Is this the spiky worm?
		dmg = dmg * 0.15; // 85% damage reduction to body damage for spiky worms, to force players to shoot them in the head

	
		if ( head_entity !== this && this.kind === sdSandWorm.KIND_COUNCIL_WORM ) // Is this the council worm?
		dmg = dmg * 0.15; // 85% damage reduction to body damage for council worms, they are sort of a boss after all
		
		if ( initiator )
		//if ( !initiator.is( sdSandWorm ) )
		if ( !initiator.is( sdCube ) )
		head_entity._current_target = initiator;
		
		let this_was_alive = this._hea > 0;
		let was_alive = head_entity._hp_main > 0;
		
		let old_hp_main = Math.max( head_entity._hp_main, 0 );
		
		this._hea -= dmg;
		head_entity._hp_main -= dmg;
		
		if ( this._hea <= sdSandWorm.head_bounds_health && this === head_entity )
		head_entity._hp_main = 0;
		
		if ( this._hea <= 0 && this_was_alive )
		{
			if ( this === head_entity || this.towards_head === head_entity ) // No flying head case
			head_entity._hp_main = 0;
			else
			{
				// Deactivate all parts past this one
				let ptr = this;
				while ( ptr )
				{
					if ( ptr._hea > 0 )
					{
						head_entity._hp_main -= ptr._hea; // Remaining hp damage bonus
					}
				
					head_entity._hp_main -= 300; // Break bonus
					
					ptr.death_anim = 1;

					if ( ptr.towards_tail && ptr.towards_tail._is_being_removed )
					ptr = null;
					else
					ptr = ptr.towards_tail;
				}
			}
		}
		
		if ( head_entity._hp_main <= 0 && was_alive )
		{
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
	
			if ( this.kind !== sdSandWorm.KIND_COUNCIL_WORM )
			sdSound.PlaySound({ name:'octopus_alert', x:head_entity.x, y:head_entity.y, pitch:0.25, volume:4 });
			else
			sdSound.PlaySound({ name:'enemy_mech_alert', x:head_entity.x, y:head_entity.y, pitch:0.25, volume:4 });
	
			let ptr = head_entity;
			while ( ptr )
			{
				ptr.death_anim = 1;
				
				ptr = ptr.towards_tail;
			}
		}
		
		let shake_am = Math.max( 0, Math.min( 200, old_hp_main - Math.max( head_entity._hp_main, 0 ) ) ); // Can cause NaN on Infinity - Infinity
		
		let ptr = head_entity;
		while ( ptr && ptr._hea > 0 && !ptr._is_being_removed )
		{
			if ( ptr.towards_tail )
			{
				let an = Math.random() * Math.PI * 2;
				
				ptr.sx += Math.sin( an ) * shake_am / 50;
				ptr.sy += Math.cos( an ) * shake_am / 50;
				
				ptr.towards_tail.sx -= Math.sin( an ) * shake_am / 50;
				ptr.towards_tail.sy -= Math.cos( an ) * shake_am / 50;
			}

			ptr = ptr.towards_tail;
		}
		
		
		
		if ( this._hea <= 0 )
		{
			if ( this._spawn_wyrmhide_on_death && this.kind !== sdSandWorm.KIND_COUNCIL_WORM && this.kind !== sdSandWorm.KIND_CRYSTAL_HUNTING_WORM ) // Spawn wyrmhide on ground if it's set to true
			{
				let x = this.x;
				let y = this.y;
				let sx = this.sx;
				let sy = this.sy;

				setTimeout(()=>{ // Hacky, without this item does not appear to be pickable or interactable...
					let wyrmhide = new sdGun({ x:x, y:y, class:sdGun.CLASS_WYRMHIDE });
					wyrmhide.sx = sx;
					wyrmhide.sy = sy;
					wyrmhide.extra = this.filter + ' brightness(0.5)';
					sdEntity.entities.push( wyrmhide );
				}, 500 );
			}
			if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM ) // Council mecha worms spawn metal shards on death
			{
				let x = this.x;
				let y = this.y;
				let sx = this.sx;
				let sy = this.sy;

				if ( this.scale >= 1 || ( Math.random() < 0.15 ) ) // Small ones have smaller chance to drop shards
				setTimeout(()=>{ // Hacky, without this item does not appear to be pickable or interactable...
					let shard = new sdGun({ x:x, y:y, class:sdGun.CLASS_METAL_SHARD });
					shard.sx = sx;
					shard.sy = sy;
					sdEntity.entities.push( shard );

				}, 500 );

				if ( this === head_entity && ( ( this.scale >= 1 && Math.random() < 0.05 ) || ( this.scale < 1 && Math.random() < 0.005 ) ) ) // 5% chance for Council Immolator, 0.5% if smaller worm
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

				let gun;
				gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_COUNCIL_IMMOLATOR });

				//gun.sx = sx;
				//gun.sy = sy;
				sdEntity.entities.push( gun );

				}, 500 );
				
				if ( this === head_entity && ( ( this.scale >= 1 && Math.random() < 0.03 ) || ( this.scale < 1 && Math.random() < 0.003 ) ) ) // 3% chance for Exalted core, 0.3% if smaller worm
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

				let gun;
				gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_EXALTED_CORE });

				//gun.sx = sx;
				//gun.sy = sy;
				sdEntity.entities.push( gun );

				}, 500 );
			}
			this.remove();
		}
	}
	get mass() { return 300 * this.scale; }
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
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	IsEntFarEnough( ent ) // Check if entity is outside BSU and far away from player's views
	{
		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character )
		{
			let player = sdWorld.sockets[ i ].character;
			if ( sdWorld.Dist2D( ent.x, ent.y, player.x, player.y ) < 500 || !sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges( ent.x, ent.y ) )
			return false;
		}
		
		return true;
	}
	
	GetRandomCrystal()
	{
		let ent = sdEntity.GetRandomActiveEntity();
		if ( ent )
		if ( ent.is( sdCrystal ) ) // Is it a crystal?
			{
				if ( this.IsEntFarEnough( ent ) && sdWorld.Dist2D( this.x, this.y, ent.x, ent.y ) < 2000 ) // Crystal far enough from BSUs and players, but not too far from the worm?
				{
					this._last_found_target = 0;
					return ent; // Target it
				}
			}
		return null;
	}
	
	AttemptBlockBurying( custom_ent_tag = null )
	{
		// Did it this way, though maybe it should just have a special check if class is sdSandWorm inside sdEntity - Booraz
		if ( !sdWorld.is_server || this.CanBuryIntoBlocks() === 0 )
		return;
	
		let no_players_near = true;
		let i;			
		for ( i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character )
		{
			if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, this.x, this.y, 500 ) ) // A player is too close to it?
			{
				no_players_near = false; // Prevent hibernation
				break;
			}
		}
		if ( no_players_near )
		{
			let potential_hibernation_blocks = sdWorld.GetAnythingNear( this.x, this.y, 96, null, [ 'sdBlock' ] ); // Look for blocks
			// sdWorld.shuffleArray( potential_hibernation_blocks ); // Not sure if needed? Though check will mostly start from left to right of the entity.
			for ( i = 0; i < potential_hibernation_blocks.length; i++ )
			{
				
				let block = potential_hibernation_blocks[ i ];
							
				if ( block )
				{
					if ( this.CanBuryIntoBlocks() === 1 ) // 1st scenario, natural blocks
					{
						if ( !block._is_being_removed && block._natural && !block._contains_class && block.material !== 7 && block.material !== 9 ) // Natural block, no flesh or corruption and nothing inside it?
						{
							if ( !custom_ent_tag )
							block._contains_class = this.GetClass(); // Put the entity in there
							else
							block._contains_class = custom_ent_tag;
						
							this.Damage( this._hea );
							this.remove(); // Disappear
							this._broken = false;
							break;
						}
					}
					if ( this.CanBuryIntoBlocks() === 2 ) // 2nd scenario, corrupted blocks
					{
						if ( !block._is_being_removed && block._natural && !block._contains_class && block.material === 7 ) // Natural corrupted block and nothing inside it?
						{
							if ( !custom_ent_tag )
							block._contains_class = this.GetClass(); // Put the entity in there
							else
							block._contains_class = custom_ent_tag;
						
							this.Damage( this._hea );
							this.remove(); // Disappear
							this._broken = false;
							break;
						}
					}
					if ( this.CanBuryIntoBlocks() === 3 ) // 3rd scenario, flesh blocks
					{
						if ( !block._is_being_removed && block._natural && !block._contains_class && block.material === 9 ) // Natural flesh block and nothing inside it?
						{
							if ( !custom_ent_tag )
							block._contains_class = this.GetClass(); // Put the entity in there
							else
							block._contains_class = custom_ent_tag;
						
							this.Damage( this._hea );
							this.remove(); // Disappear
							this._broken = false;
							break;
						}
					}
				}
			}
		}
	}
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return ( this.death_anim === 0 ) ? sdSandWorm.ignoring : sdSandWorm.ignoring_dead;
	}
	
	get is_alive() // For tasks, also for entities like sdSandWorm to override
	{
		return ( this.death_anim === 0 );
	}
	
	onThinkFrozen( GSPEED )
	{
		this.onThink( GSPEED );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.death_anim > 0 )
		if ( sdWorld.is_server )
		{

			this._time_until_full_remove -= GSPEED;
			if ( this._time_until_full_remove <= 0 )
			{
				//this.sx = 0;
				//this.sy = 0;
				//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
				
				if ( this._spawn_wyrmhide_on_death && this.kind !== sdSandWorm.KIND_COUNCIL_WORM && this.kind !== sdSandWorm.KIND_CRYSTAL_HUNTING_WORM ) // Spawn wyrmhide on ground if it's set to true
				{
					let x = this.x;
					let y = this.y;
					let sx = this.sx;
					let sy = this.sy;

					setTimeout(()=>{ // Hacky, without this item does not appear to be pickable or interactable...
						let wyrmhide = new sdGun({ x:x, y:y, class:sdGun.CLASS_WYRMHIDE });
						wyrmhide.sx = sx;
						wyrmhide.sy = sy;
						wyrmhide.extra = this.filter + ' brightness(0.5)';
						sdEntity.entities.push( wyrmhide );

					}, 500 );
				}
				if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM ) // Council mecha worms spawn metal shards on death
				{
					let x = this.x;
					let y = this.y;
					let sx = this.sx;
					let sy = this.sy;

					if ( this.scale >= 1 || ( Math.random() < 0.15 ) ) // Small ones have smaller chance to drop shards
					setTimeout(()=>{ // Hacky, without this item does not appear to be pickable or interactable...
						let shard = new sdGun({ x:x, y:y, class:sdGun.CLASS_METAL_SHARD });
						shard.sx = sx;
						shard.sy = sy;
						sdEntity.entities.push( shard );

					}, 500 );
				}
				this.remove();
				return;
			}
		}
		
		
		sdWorld.last_hit_entity = null;
		
		// Backwards compatibility - remove this block later
		//
		if ( typeof this._in_surface === 'boolean' )
		this._in_surface = null;
		//
		
		
		if ( this._in_surface )
		if ( Math.abs( this._in_surface_time - sdWorld.time ) > 100 )
		this._in_surface = null;
		
		//let in_surface = sdWorld.CheckWallExists( this.x, this.y, null, null, sdSandWorm.travel_in );
		//let in_surface = ( this.death_anim === 0 ) ? sdWorld.CheckWallExistsBox( this.x + this._hitbox_x1, this.y + this._hitbox_y1, this.x + this._hitbox_x2, this.y + this._hitbox_y2, null, null, sdSandWorm.travel_in ) : this._in_surface;
		let in_surface = this._in_surface;
		
		//if ( sdWorld.last_hit_entity.is( sdBlock )
		
		//let in_water = sdWorld.last_hit_entity && sdWorld.last_hit_entity.is( sdWater );
		let in_water = this._in_surface && this._in_surface.is( sdWater );
		
		if ( in_surface )
		if ( this.death_anim === 0 )
		{
			if ( sdWorld.is_server )
			{
				if ( Math.random() < 0.003 )
				{
					sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, pitch: 0.2, volume: 0.25 });
				}	
			}
			else
			{
				//if ( this._in_surface !== in_surface )
				//if ( Math.random() < 0.1 )
				if ( in_surface )
				if ( in_surface.is( sdBlock ) )
				if ( !sdWorld.CheckWallExists( this.x, this.y, null, null, sdSandWorm.travel_in ) )
				{
					let x = this._hitbox_x1 + ( this._hitbox_x2 - this._hitbox_x1 ) * Math.random();
					let y = this._hitbox_y1 + ( this._hitbox_y2 - this._hitbox_y1 ) * Math.random();
					let a = Math.random() * 2 * Math.PI;
					let s = Math.random() * 4;
					let ent = new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_ROCK, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s });
					sdEntity.entities.push( ent );
				}
			}
		}
		
		//this._in_surface = in_surface;
		this._in_water = in_water;
		
		if ( !this.towards_tail )
		if ( !this.towards_head )
		if ( sdWorld.is_server )
		if ( this.model !== 2 ) // For snapshot loading case
		if ( this._hp_main > 0 ) // For snapshot loading case
		{
			if ( this._can_spawn_more )
			{
				let arr = [ this ];

				let offset = 0;// this.scale * sdSandWorm.segment_dist

				let wyrmhide_chance = 0.25;

				for ( let i = 1; i < 7; i++ )
				{
					let ent_scale = ( 1 - Math.pow( i / 7, 2 ) * 0.5 ) * this.scale;

					offset += ( this.scale + ent_scale ) * sdSandWorm.segment_dist / 2;

					//let ent = new sdSandWorm({ x: this.x + offset, y: this.y });
					let ent = new sdSandWorm({ x: this.x + Math.random() - 0.5, y: this.y + Math.random() - 0.5 });

					ent.hue = this.hue;
					ent.filter = this.filter;
					ent._can_spawn_more = false;

					if ( ( Math.random() < wyrmhide_chance ) || ( i === 5 && wyrmhide_chance > 0 ) ) // Should this part spawn wymrhide when it dies? Should spawn one per worm though.
					{
						ent._spawn_wyrmhide_on_death = true;
						wyrmhide_chance = -1;
					}
					else
					if ( wyrmhide_chance > 0 )
					wyrmhide_chance += 0.1; // Increase the chance

					ent.scale = ent_scale;
					ent.kind = this.kind;
					ent._ai_team = this._ai_team;

					ent.model = 2;

					ent.towards_head = arr[ i - 1 ];
					arr[ i - 1 ].towards_tail = ent;
					sdEntity.entities.push( ent );

					arr[ i ] = ent;
				}

				this._hea += sdSandWorm.head_bounds_health;
				this._hmax += sdSandWorm.head_bounds_health;
				this._can_spawn_more = false;
			}
			else
			{
				let head_entity = this.GetHeadEntity();
		
				if ( head_entity._hp_main > 0 )
				{
					head_entity._hp_main = Math.min( head_entity._hp_main, 0 ); // Part of the worm was likely removed somehow and pointer cleared
					
					let ptr = head_entity;
					while ( ptr )
					{
						ptr.death_anim = 1;

						ptr = ptr.towards_tail;
					}
				}
			}
		}
		
		let an_x = 0;
		let an_y = 0;
		if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM )
		{
			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED;
			else
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
		}
		
		
		if ( this.towards_head )
		if ( !this.towards_head._is_being_removed )
		{
			an_x += this.towards_head.x - this.x;
			an_y += this.towards_head.y - this.y;
		}
		
		if ( this.towards_tail )
		if ( !this.towards_tail._is_being_removed )
		{
			an_x -= this.towards_tail.x - this.x;
			an_y -= this.towards_tail.y - this.y;
			
			for ( let s = 0; s < 2; s++ )
			{
				//let target_di = ( s === 0 ) ? sdSandWorm.segment_dist : ( sdSandWorm.segment_dist * 2 );
				let another_ent = ( s === 0 ) ? this.towards_tail : ( this.towards_tail.towards_tail );
				
				if ( another_ent === null )
				continue;
			
				let force = ( s === 0 ) ? 5 : ( 0.7 );
				
				let target_di = ( s === 0 ) ? 
									( ( this.scale + this.towards_tail.scale ) * sdSandWorm.segment_dist / 2 ) : 
									( ( this.scale + this.towards_tail.scale ) * sdSandWorm.segment_dist / 2 + ( this.towards_tail.scale + another_ent.scale ) * sdSandWorm.segment_dist / 2 );
				
				//console.log( 'target_di = ' + target_di );
				
				let dx = this.x - another_ent.x;
				let dy = this.y - another_ent.y;

				let di = sdWorld.Dist2D_Vector( dx, dy );

				if ( di > 1 ) // sdSandWorm.segment_dist )
				{
					dx = dx / di * ( di - target_di ) / target_di * force;
					dy = dy / di * ( di - target_di ) / target_di * force;
					
					let G = Math.min( 1, GSPEED );


					this.sx -= dx * G;
					this.sy -= dy * G;

					another_ent.sx += dx * G;
					another_ent.sy += dy * G;

					if ( this.CanMoveWithoutOverlap( this.x - dx * G, this.y - dy * G, 0, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null ) )
					if ( sdWorld.CheckLineOfSight( this.x, this.y, this.x - dx * G, this.y - dy * G, this, null, null, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null ) )
					{
						this.x -= dx * G;
						this.y -= dy * G;
					}
					if ( another_ent.CanMoveWithoutOverlap( another_ent.x + dx * G, another_ent.y + dy * G, 0, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null ) )
					if ( sdWorld.CheckLineOfSight( another_ent.x, another_ent.y, another_ent.x + dx * G, another_ent.y + dy * G, another_ent, null, null, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null ) )
					{
						another_ent.x += dx * G;
						another_ent.y += dy * G;
					}
				}
			}
		}

		an_x += this.forced_x;
		an_y += this.forced_y;
		
		this.forced_x = sdWorld.MorphWithTimeScale( this.forced_x, 0, 0.7, GSPEED );
		this.forced_y = sdWorld.MorphWithTimeScale( this.forced_y, 0, 0.7, GSPEED );
		
		if ( an_x !== 0 || an_y !== 0 )
		this._an = -Math.atan2( an_x, an_y ) - Math.PI / 2;
		
		//if ( !this.towards_head ) // Is head
		if ( this.model !== 2 ) // For client-side
		{
			if ( this._hp_main <= 0 )
			{
			}
			else
			{
				if ( sdWorld.is_server )
				{
					//if ( in_surface )
					//{
						//this._last_attack = sdWorld.time - 700;
						//this.model = 0;
					//}
					//console.log( [ this.model, sdWorld.time - this._last_attack ] );
					if ( sdWorld.time > this._last_attack + 1000 )
					{
						if ( this.model === 0 )
						{
							//console.log('SOUND!');
							//console.log( this._last_attack - sdWorld.time  );
							if ( this.kind !== sdSandWorm.KIND_COUNCIL_WORM )
							sdSound.PlaySound({ name:'octopus_death', x:this.x, y:this.y, pitch: 0.5, volume: 0.5 });
							else
							sdSound.PlaySound({ name:'enemy_mech_alert', x:this.x, y:this.y, pitch:0.5, volume:1 });
							this.model = 1;
						}
					}
				}
			
				if ( this._current_target )
				{
					if ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM && !this.IsEntFarEnough( this._current_target ) )
					{
						this._current_target = null;
						return;
					}
					
					if ( this._current_target._is_being_removed || !this._current_target.IsVisible() /*|| sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdSandWorm.max_seek_range + 32*/ )
					this._current_target = null;
					else
					{
						let dx = ( this._current_target.x - this.x ) + Math.sin( sdWorld.time / 600 ) * 40;
						let dy = ( this._current_target.y - this.y ) + Math.sin( sdWorld.time / 400 ) * 40;

						//let power = 1;

						let arr = [];

						let ptr = this;
						while ( ptr && !ptr._is_being_removed )
						{
							if ( ptr._in_surface || !ptr.towards_head )
							arr.push( ptr );
							//power++;

							ptr = ptr.towards_tail;
						}

						let di = sdWorld.Dist2D( dx,dy,0,0 );

						if ( di > 1 )
						{
							for ( let i = 0; i < arr.length; i++ )
							{
								let vel_scale = arr[ i ]._in_water ? 0.05 : 1;
								
								if ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
								vel_scale *= 1.5; // Faster so it eats crystals faster
								
								let dx2 = 0;
								let dy2 = 0;

								if ( !arr[ i ].towards_head )
								{
									if ( arr[ i ]._in_surface )
									{
										arr[ i ].sx += dx / di * 1 * vel_scale;
										arr[ i ].sy += dy / di * 1 * vel_scale;
									}
									else
									{
										arr[ i ].sx += dx / di * 0.5 * vel_scale * arr.length / 7;
										arr[ i ].sy += dy / di * 0.5 * vel_scale * arr.length / 7;
									}

									//if ( arr[ i ].towards_tail )
									//{
										dx2 = -( arr[ i ].towards_tail.x - arr[ i ].x );
										dy2 = -( arr[ i ].towards_tail.y - arr[ i ].y );
									//}
								}
								else
								{
									dx2 = arr[ i ].towards_head.x - arr[ i ].x;
									dy2 = arr[ i ].towards_head.y - arr[ i ].y;
								}

								if ( arr[ i ]._in_surface )
								{
									let di2 = sdWorld.Dist2D_Vector( dx2, dy2 );

									if ( di2 > 1 )
									{
										arr[ i ].sx += dx2 / di2 * 0.7 * vel_scale;
										arr[ i ].sy += dy2 / di2 * 0.7 * vel_scale;
									}
								}

							}
						}
						let head_entity = this.GetHeadEntity();

						if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM && head_entity === this ) // Council worm head fires yellow beams at visible target it's approaching
						if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.x + ( Math.cos( this._an + Math.PI ) * 360 ), this.y + ( Math.sin( this._an + Math.PI ) * 360 ), this ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity === this._current_target ||
						 ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && !sdWorld.last_hit_entity.DoesRegenerate() ) ||
						sdWorld.last_hit_entity.IsVehicle() ) // Shoot any kind of sdBlock if it's not dirt 
						//if ( sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) <= 380 )
						if ( sdWorld.time > this._last_attack + 100 )
						{
						
							//let an = Math.atan2( this._current_target.y + ( this._current_target._hitbox_y1 + this._current_target._hitbox_y2 ) / 2 - this.y, this._current_target.x + ( this._current_target._hitbox_x1 + this._current_target._hitbox_x2 ) / 2 - this.x );
							let bullet_obj = new sdBullet({ x: this.x, y: this.y });
							bullet_obj._owner = this;


							bullet_obj.sx = Math.cos( this._an + Math.PI );
							bullet_obj.sy = Math.sin( this._an + Math.PI );
							bullet_obj.x += 3 * Math.cos( this._an + Math.PI );
							bullet_obj.y += 3 * Math.sin( this._an + Math.PI );

							bullet_obj.sx *= 16;
							bullet_obj.sy *= 16;

							bullet_obj._dirt_mult = 12;
							bullet_obj._temperature_addition = 200; // Set stuff on fire
							bullet_obj._shield_block_mult = 4;
							bullet_obj._vehicle_mult = 4;

							bullet_obj.time_left = 20;

							bullet_obj._rail = true;
							bullet_obj._rail_alt = true;

							bullet_obj._damage = 20;

							bullet_obj.color = '#ffff00'; // Yellow color

							sdEntity.entities.push( bullet_obj );
							this._last_attack = sdWorld.time;

							sdSound.PlaySound({ name:'cube_attack', pitch: 4, x:this.x, y:this.y, volume:0.8 });
							//this.forced_x = ( this._current_target.x + ( this._current_target._hitbox_x1 + this._current_target._hitbox_x2 ) / 2 - this.x ) * 10;
							//this.forced_y = ( this._current_target.y + ( this._current_target._hitbox_y1 + this._current_target._hitbox_y2 ) / 2 - this.y ) * 10;
						}
						// Reset target from time to time if in seek mode
						if ( Math.random() < 0.0001 )
						if ( !this._current_target.is( sdCharacter ) )
						{
							this._current_target = null;
						}
					}
				}
				else
				{
					// No target
					if ( sdWorld.is_server )
					{
						
						
						
						
						/*let closest = null;
						let closest_di = Infinity;
						for ( let i = 0; i < sdWorld.sockets.length; i++ )
						{
							if ( sdWorld.sockets[ i ].character )
							if ( sdWorld.sockets[ i ].character.hea > 0 )
							if ( !sdWorld.sockets[ i ].character._is_being_removed )
							if ( sdWorld.sockets[ i ].character.IsVisible() )
							{
								let di = sdWorld.Dist2D_Vector_pow2( sdWorld.sockets[ i ].character.x - this.x, sdWorld.sockets[ i ].character.y - this.y );
								if ( di < closest_di )
								{
									closest_di = di;
									closest = sdWorld.sockets[ i ].character;
								}
							}
						}
						this._current_target = closest;*/
						
						if ( sdEntity.active_entities.length > 0 ) // Opposite probably can't happen
						{
							this._current_target = sdEntity.active_entities[ Math.floor( Math.random() * sdEntity.active_entities.length ) ];
							
							if ( this._current_target.is( sdSandWorm ) || ( this._current_target.is( sdCharacter ) && !this.HasEnoughMatter( this._current_target ) ) )
							this._current_target = null;
						
							if ( this._current_target )
							if ( ( this._current_target.is( sdCharacter ) || this._current_target.is( sdDrone ) ) && this.kind === sdSandWorm.KIND_COUNCIL_WORM ) // Prevent targetting council humanoids if council worm is in question
							{
								if ( this._ai_team === this._current_target._ai_team )
								this._current_target = null;
							}
						
							if ( this._last_found_target > 250 ) // Over 250 attempts without finding a crystal to eat
							{
								if ( this.IsEntFarEnough( this ) ) // No players nearby?
								this.Damage( 1000000 ); // Die in peace
							}
						
							if ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
							{
								if ( this._current_target ) // Prevents crash
								{
									if ( !this._current_target.is( sdCrystal ) ) // Make sure it goes for crystals only
									{
										this._current_target = this.GetRandomCrystal();
										this._last_found_target++;
									}
								}
								else
								{
									this._current_target = this.GetRandomCrystal(); // Focus on finding crystals anyway
									this._last_found_target++;
								}
							}
						}
					}
				}
			}
		}
		
		if ( in_surface && !in_water )
		{
			//this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			//this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.7, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.7, GSPEED );
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
			
			if ( !in_water )
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		if ( sdWorld.is_server )
		{
			if ( this._last_attack < sdWorld.time - ( 1000 * 60 * 3 ) ) // 3 minutes since last attack?
			{
				this._hibernation_check_timer -= GSPEED;
				
				if ( this._hibernation_check_timer < 0 && ( this.GetHeadEntity() === this ) )
				{
					this._hibernation_check_timer = 30 * 30; // Check if hibernation is possible every 30 seconds
					
					if ( this.kind === sdSandWorm.KIND_NORMAL_WORM || this.kind === sdSandWorm.KIND_SPIKY_WORM )
					this.AttemptBlockBurying(); // Attempt to hibernate inside nearby blocks
					if ( this.kind === sdSandWorm.KIND_CORRUPTED_WORM )
					this.AttemptBlockBurying( 'sdSandWorm.corrupted' );
					if ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
					this.AttemptBlockBurying( 'sdSandWorm.KIND_CRYSTAL_HUNTING_WORM' );
				}
			}
		}
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null );
		/*
		// Simulating physics by entity that is closest to the head, otherwise it will break violently offscreen // UPD: Does not work
		let physics_handler = this;
		while ( true )
		{
			if ( physics_handler.towards_head && !physics_handler.towards_head._is_being_removed )
			physics_handler = physics_handler.towards_head;
			else
			break;
		}
		if ( physics_handler === this )
		{
			//this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null );
			while ( true )
			{
				physics_handler.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, ( physics_handler.death_anim === 0 ) ? physics_handler.CustomGroundFiltering : null );
				
				if ( physics_handler.towards_tail && !physics_handler.towards_tail._is_being_removed )
				physics_handler = physics_handler.towards_tail;
				else
				break;
			}
		}*/
	}
	CustomGroundFiltering( hit_entity )
	{
		if ( hit_entity.is( sdBlock ) )
		{
			if ( hit_entity.material === sdBlock.MATERIAL_WALL || hit_entity.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || hit_entity.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
			return true;

			return false;
		}
		
		if ( !hit_entity.hard_collision )
		{
			if ( hit_entity.is( sdRift ) )
			return false;
		}
		
		return true;

	}
	get title()
	{
		if ( this.kind === sdSandWorm.KIND_NORMAL_WORM )
		return "Worm";

		if ( this.kind === sdSandWorm.KIND_SPIKY_WORM )
		return "Spiky Worm";

		if ( this.kind === sdSandWorm.KIND_CORRUPTED_WORM )
		return "Corrupted Worm";

		if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM )
		return "Council Mecha Worm";

		if ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
		return "Crystal Hunting Worm";

		return 'Worm';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 && ( !this._in_surface || this._in_water ) )
		{
			sdEntity.Tooltip( ctx, this.title );
		}
	}
	Draw( ctx, attached )
	{
		if ( !sdShop.isDrawing )
		{
			ctx.filter = this.filter;
			
			if ( sdRenderer.visual_settings === 4 )
			ctx.sd_hue_rotation = this.hue;
			else
			ctx.filter = 'hue-rotate(' + this.hue + 'deg)' + ctx.filter;
		}
		
		if ( this.death_anim === 1 )
		ctx.filter += ' brightness(0.5)';
		
		ctx.rotate( this._an );
		
		if ( !sdShop.isDrawing )
		ctx.scale( this.scale, this.scale );
		
		if ( this.kind === sdSandWorm.KIND_NORMAL_WORM )
		{
			if ( this.model === 1 /*|| ( this.model === 0 && this._in_surface )*/ )
			ctx.drawImageFilterCache( sdSandWorm.img_worm_head_attack, - 16, - 16, 32,32 );
			else
			if ( this.model === 0 )
			ctx.drawImageFilterCache( sdSandWorm.img_worm_head_idle, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( sdSandWorm.img_worm_body, - 16, - 16, 32,32 );
		}
		if ( this.kind === sdSandWorm.KIND_SPIKY_WORM )
		{
			if ( this.model === 1 /*|| ( this.model === 0 && this._in_surface )*/ )
			ctx.drawImageFilterCache( sdSandWorm.img_worm_spiky_head_attack, - 16, - 16, 32,32 );
			else
			if ( this.model === 0 )
			ctx.drawImageFilterCache( sdSandWorm.img_worm_spiky_head_idle, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( sdSandWorm.img_worm_spiky_body, - 16, - 16, 32,32 );
		}
		if ( this.kind === sdSandWorm.KIND_CORRUPTED_WORM )
		{
			if ( this.model === 1 /*|| ( this.model === 0 && this._in_surface )*/ )
			ctx.drawImageFilterCache( sdSandWorm.img_worm_corrupted_head_attack, - 16, - 16, 32,32 );
			else
			if ( this.model === 0 )
			ctx.drawImageFilterCache( sdSandWorm.img_worm_corrupted_head_idle, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( sdSandWorm.img_worm_corrupted_body, - 16, - 16, 32,32 );
		}
		if ( this.kind === sdSandWorm.KIND_COUNCIL_WORM )
		{
			ctx.filter = 'none';
			//if ( this.death_anim === 1 )
			//ctx.filter = 'brightness(0.5)';
			ctx.sd_hue_rotation = 0;
			if ( this.model === 1 )
			{
				ctx.drawImageFilterCache( sdSandWorm.img_worm_council_head_idle, - 16, - 16, 32,32 );
			
				if ( this.death_anim === 0 )
				{
					ctx.apply_shading = false; // Glow in the dark
			
					ctx.drawImageFilterCache( sdSandWorm.img_worm_council_head_attack, - 16, - 16, 32,32 );
				}
				// ctx.drawImageFilterCache( sdSandWorm.img_worm_council_glow, - 16, - 16, 32,32 );
			}
			else
			if ( this.model === 0 )
			{
				ctx.drawImageFilterCache( sdSandWorm.img_worm_council_head_idle, - 16, - 16, 32,32 );
				
				if ( this.death_anim === 0 )
				{
					ctx.apply_shading = false; // Glow in the dark
			
					ctx.drawImageFilterCache( sdSandWorm.img_worm_council_glow, - 16, - 16, 32,32 );
				}
			}
			else
			{
				ctx.drawImageFilterCache( sdSandWorm.img_worm_council_body, - 16, - 16, 32,32 );
				
				if ( this.death_anim === 0 )
				{
					ctx.apply_shading = false; // Glow in the dark
			
					ctx.drawImageFilterCache( sdSandWorm.img_worm_council_glow_body, - 16, - 16, 32,32 );
				}
			}
		}
		if ( this.kind === sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
		{
			if ( this.model === 1 /*|| ( this.model === 0 && this._in_surface )*/ )
			ctx.drawImageFilterCache( sdSandWorm.img_crystal_hunting_worm_head_attack, - 16, - 16, 32,32 );
			else
			if ( this.model === 0 )
			ctx.drawImageFilterCache( sdSandWorm.img_crystal_hunting_worm_head_idle, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( sdSandWorm.img_crystal_hunting_worm_body, - 16, - 16, 32,32 );
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdSandWorm ) )
		return;
	
		if ( from_entity._is_bg_entity > 0 )
		return;
	
		if ( sdSandWorm.travel_in.indexOf( from_entity.GetClass() ) !== -1 )
		{
			this._in_surface = from_entity;
			this._in_surface_time = sdWorld.time;
		}
		
		//if ( !from_entity._hard_collision ) // No longer ignores non-hard collision entities because it will actually stuck in them
		//return;
	
		if ( !from_entity.IsTargetable() )
		return;
	
		//this._in_surface = true;
		
		if ( sdWorld.is_server )
		if ( this.death_anim === 0 )
		if ( sdWorld.time > this._last_attack + ( !this.towards_head ? 1500 : 500 ) )
		{
			//if ( from_entity.is( sdBG ) )
			//return;
				
			if ( from_entity.is( sdBlock ) )
			if ( from_entity.DoesRegenerate() )
			//if ( this.kind !== sdSandWorm.KIND_CORRUPTED_WORM )
			return;
			//else
			//if ( !this.towards_head ) // Is head
			//from_entity.Corrupt();
			
			this._last_attack = sdWorld.time;

			if ( !this.towards_head ) // Is head
			{
				/*if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdDoor' )
				{
					if ( from_entity._reinforced_level > 0 ) // Worms should not damage reinforced blocks to prevent raiders using them
					from_entity.DamageWithEffect( 0, this );
					else
					from_entity.DamageWithEffect( 300 * this.scale, this );
				}
				else*/
				from_entity.DamageWithEffect( 300 * this.scale, this );
				
				if ( this.kind === sdSandWorm.KIND_CORRUPTED_WORM )
				if ( from_entity.is( sdCharacter ) ) // Copy-pasted from sdBlock.CorruptAttack();
				{
					from_entity._sickness += 30;
					from_entity._last_sickness_from_ent = this;
				}

				this.model = 0;
				
				this.forced_x = ( from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2 - this.x ) * 10;
				this.forced_y = ( from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2 - this.y ) * 10;
				
				//this._hea = Math.min( this._hmax, this._hea + 25 );
				from_entity.PlayDamageEffect( from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2, from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2 );
				//sdWorld.SendEffect({ x:from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2, y:from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
				
				let ptr = this;
				while ( ptr && ptr._hea > 0 && !ptr._is_being_removed )
				{
					ptr._hea = Math.min( ptr._hmax, ptr._hea + 25 );
					this._hp_main = Math.min( this._hp_main_max, this._hp_main + 25 );
			
					ptr = ptr.towards_tail;
				}
			}
			else
			{
				/*if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdDoor' )
				{
					if ( from_entity._reinforced_level > 0 ) // Worms should not damage reinforced blocks to prevent raiders using them
					from_entity.DamageWithEffect( 0, this );
					else
					from_entity.DamageWithEffect( 20 * this.scale, this );
				}
				else*/
				from_entity.DamageWithEffect( ( this.kind === sdSandWorm.KIND_SPIKY_WORM ? 5 : 1 ) * 20 * this.scale, this );
				if ( this.kind === sdSandWorm.KIND_CORRUPTED_WORM )
				if ( from_entity.is( sdCharacter ) ) // Copy-pasted from sdBlock.CorruptAttack();
				{
					from_entity._sickness += 30;
					from_entity._last_sickness_from_ent = this;
				}
			}
		}
	}
	
	getTeleportGroup() // List of entities that will be teleproted together with this entity. For sdSandWorm and sdQuadro-like entities. You might want to use sdWorld.ExcludeNullsAndRemovedEntitiesForArray on returned array to filter out null pointers and removed entities
	{
		let arr = [ this ];
		
		let ptr = this.towards_head;
		
		while ( ptr && !ptr._is_being_removed )
		{
			arr.push( ptr );
			ptr = ptr.towards_head;
		}
		
		ptr = this.towards_tail;
		
		while ( ptr && !ptr._is_being_removed )
		{
			arr.push( ptr );
			ptr = ptr.towards_tail;
		}
		
		return arr;
	}
	
	onRemove() // Class-specific, if needed
	{
		sdSandWorm.worms_tot--;
		
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		//if ( this.death_anim < sdSandWorm.death_duration + sdSandWorm.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
				//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
				if ( this.kind !== sdSandWorm.KIND_COUNCIL_WORM )
				{
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
				}
				else
				sdWorld.BasicEntityBreakEffect( this, 6, 3, 0.25, 1 );
			}
			
			// High price shards
			if ( this.scale > 0.8 )
			sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
				1 + ~~( Math.random() * 4 ),
				( 40 * 128 ) / 40
			);
			
			/*if ( Math.random() < 0.9 ) Improper placement, no use
			{
				let ent = new sdCrystal({ x: this.x, y: this.y });
				sdEntity.entities.push( ent );
				sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible
			}*/
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdSandWorm.init_class();

export default sdSandWorm;
