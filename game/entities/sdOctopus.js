
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';
//import sdPlayerOverlord from './sdPlayerOverlord.js';

class sdOctopus extends sdEntity
{
	static init_class()
	{
		sdOctopus.img_octopus = sdWorld.CreateImageFromFile( 'sdOctopus' );
		
		/*sdOctopus.img_octopus_idle1 = sdWorld.CreateImageFromFile( 'octopus_idle1' );
		sdOctopus.img_octopus_idle2 = sdWorld.CreateImageFromFile( 'octopus_idle2' );
		sdOctopus.img_octopus_idle3 = sdWorld.CreateImageFromFile( 'octopus_idle3' );
		sdOctopus.img_octopus_jump = sdWorld.CreateImageFromFile( 'octopus_jump' );
		
		sdOctopus.death_imgs = [
			sdWorld.CreateImageFromFile( 'octopus_death1' ),
			sdWorld.CreateImageFromFile( 'octopus_death2' ),
			sdWorld.CreateImageFromFile( 'octopus_death3' ),
			sdWorld.CreateImageFromFile( 'octopus_death4' )
		];*/
		sdOctopus.death_duration = 30;
		sdOctopus.post_death_ttl = 30 * 6;
		
		sdOctopus.TYPE_GUN_TAKER = 0;
		sdOctopus.TYPE_PLAYER_TAKER = 1;
		
		sdOctopus.max_seek_range = 1000;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdOctopus.driver_position_offset = { x:0, y:-8 };
	}
	// 8 as max dimension so it can fit into one block
	get hitbox_x1() { return -7.9; }
	get hitbox_x2() { return 7.9; }
	get hitbox_y1() { return -7.9; }
	get hitbox_y2() { return 6; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	IsVehicle()
	{
		return ( this.type === sdOctopus.TYPE_PLAYER_TAKER );
	}
	GetDriverPositionOffset( character )
	{
		return sdOctopus.driver_position_offset;
	}
	VehicleAllowsDriverCombat( character )
	{
		return true;
	}
	GetPitch()
	{
		return ( this.type === sdOctopus.TYPE_PLAYER_TAKER ) ? 0.8 : 1;
	}
	GetDriverSlotsCount() // Not specfiying this will cause phantom effect on drivers after entity was destroyed
	{
		return 3;
	}
	get _doors_locked()
	{
		return true;
	}
	GetDriverZoom()
	{
		return sdWorld.default_zoom;// * 1.5;
	}
	
	GetRange()
	{
		return ( this.type === sdOctopus.TYPE_GUN_TAKER ) ? 170 : 64;
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.driver0 = null;
		this.driver1 = null;
		this.driver2 = null;
		
		this._hmax = 800; // Was 2000, but too boring to kill them
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		
		this._last_digestion = 0;
		
		this.hurt_timer = 0;
		
		this.tenta_x = 0;
		this.tenta_y = 0;
		this.tenta_tim = 0;
		this.tenta_target = null;
		this._tenta_hold_duration = 0; // For gun disabling
		
		this.type = ( params.type !== undefined ) ? params.type : ~~( Math.random() * 2 );
		
		this.side = 1;
		
		this._anim_shift = ~~( Math.random() * 10000 );
		
		//this._consumed_matter = [];
		//this._consumed_guns = [];
		this._consumed_guns_snapshots = [];
		
		this.hue = ~~( Math.random() * 360 );
		
		if ( this.type === sdOctopus.TYPE_GUN_TAKER )
		this.filter = 'saturate(0.5)';
		else
		if ( this.type === sdOctopus.TYPE_PLAYER_TAKER )
		this.filter = 'saturate(0.25)';
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_consumed_guns_snapshots' );
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( character.driver_of )
		{
			if ( character.driver_of.is( sdOctopus ) )
			return;
		
			character = character.driver_of;
		}
		
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( ( character.hea || character._hea ) > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdOctopus.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea || 0 ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				let from_entity = character;
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;
				
				if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
				{
					this._current_target = character;

					sdSound.PlaySound({ name:'octopus_alert', x:this.x, y:this.y, volume: 0.5, pitch: this.GetPitch() });
				}
			}
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectHue()
	{
		return this.hue;
	}
	GetBleedEffectFilter()
	{
		return this.filter;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			//sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			
			sdSound.PlaySound({ name:'octopus_death', x:this.x, y:this.y, volume: 0.5, pitch: this.GetPitch() });

			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_FREQUENTLY_LETHAL_MOB );
	
			/*while ( this._consumed_matter.length > 0 )
			{
				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 1, this._consumed_matter[ 0 ].extra / sdWorld.crystal_shard_value ); // Probably error here, shards do not appear to be pickable, possibly due to NaN here
				
				this._consumed_matter.shift();
			}*/
			
			/*while ( this._consumed_guns.length > 0 )
			{
				let ent = new sdGun({ class:this._consumed_guns[ 0 ], x: this.x, y:this.y });
				ent.sx = this.sx + Math.random() * 8 - 4;
				ent.sy = this.sy + Math.random() * 8 - 4;
				ent.ttl = sdGun.disowned_guns_ttl;
				sdEntity.entities.push( ent );
				
				this._consumed_guns.shift();
			}*/
			while ( this._consumed_guns_snapshots.length > 0 )
			{
				let snapshot = this._consumed_guns_snapshots.shift();
				try
				{
					let ent = sdEntity.GetObjectFromSnapshot( snapshot );
					ent.x = this.x;
					ent.y = this.y;
					ent.sx = this.sx + Math.random() * 8 - 4;
					ent.sy = this.sy + Math.random() * 8 - 4;
					ent.ttl = sdGun.disowned_guns_ttl;
					ent._held_by = null;
					sdEntity.entities.push( ent );
					
					sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs
				}
				catch ( e )
				{
					trace( 'Octopus can\'t drop consumed weapon', snapshot );
				}
			}
		}
		else
		{
			if ( this._hea > 0 )
			if ( this.hurt_timer === 0 )
			if ( Math.floor( ( this._hea ) / this._hmax * 5 ) !== Math.floor( ( this._hea + dmg ) / this._hmax * 5 ) )
			{
				sdSound.PlaySound({ name:'octopus_hurt2', x:this.x, y:this.y, volume: 0.5, pitch: this.GetPitch() });
				this.hurt_timer = 1;
				
				this.tenta_target = null; // Release any target that it is holding
				
				if ( initiator )
				this.SyncedToPlayer( initiator );
			}
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	get mass() { return 300; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	/* Default fall damage
	Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	GenericOctoAttack( from_entity, will_play_damage_effect_and_sound=true )
	{
		let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
		let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;
				
		if ( from_entity.GetClass() === 'sdGun' && !from_entity._is_being_removed )
		{
			if ( this._consumed_guns_snapshots.length < 64 )
			{
				// For some reason guns can disappear completely at random which is bad considering how some guns are very important to keep
				if ( from_entity._hea < 50 )
				from_entity._hea = 50;

				this._consumed_guns_snapshots.push( from_entity.GetSnapshot( globalThis.GetFrame(), true ) );
				from_entity.remove();
			}
		}
		else
		{
			from_entity.DamageWithEffect( 35, this );

			if ( this.type === sdOctopus.TYPE_PLAYER_TAKER )
			{
				if ( from_entity.IsPlayerClass() )
				if ( !from_entity.is( sdWorld.entity_classes.sdPlayerOverlord ) )
				if ( !from_entity.driver_of )
				if ( !from_entity._god )
				{
					if ( sdWorld.is_server )
					{
						if ( from_entity.scale < 250 )
						if ( !from_entity._shield_ent )
						if ( this.AddDriver( from_entity, true ) )
						{
						}
					}
				}
			}
		}

		this._hea = Math.min( this._hmax, this._hea + 15 );

		if ( will_play_damage_effect_and_sound )
		{
			from_entity.PlayDamageEffect( xx, yy );

			sdSound.PlaySound({ name:'tentacle_end', x:xx, y:yy, pitch: this.GetPitch() });

			let di = sdWorld.Dist2D_Vector( this.tenta_x, this.tenta_y );
			if ( di > 0 )
			from_entity.Impulse( this.tenta_x / di * 20, this.tenta_y / di * 20 );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdOctopus.death_duration + sdOctopus.post_death_ttl )
			{
				if ( !this.driver0 && !this.driver1 && !this.driver2 )
				this.death_anim += GSPEED;
			}
			else
			this.remove();
		}
		else
		{
			let dmg_speed = 20;
			
			let digest = ( Math.abs( sdWorld.time - this._last_digestion ) > 1000 );
			
			if ( digest )
			this._last_digestion = sdWorld.time;
			
			for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
			if ( this[ 'driver' + i ] )
			{
				let driver = this[ 'driver' + i ];
				
				if ( driver._is_being_removed )
				{
					this[ 'driver' + i ] = null;
					continue;
				}

				driver.DamageStability( GSPEED * 1000 );
				
				if ( digest )
				{
					let old_hea = driver.hea;

					driver.DamageWithEffect( dmg_speed, this );
					this._hea = Math.min( this._hmax, this._hea + dmg_speed );

					if ( driver._is_being_removed )
					{
						driver._broken = false;

						this[ 'driver' + i ] = null;
						continue;
					}

					if ( driver._socket )
					{
						if ( driver.hea > 0 )
						{
							if ( Math.random() < 0.6 )
							driver.Say( [ 
								'Yikes! I\'m inside of it!',
								'It is eating me!',
								'Not like this!',
								'Somebody kill this thing!',
								'It stinks here!'
							][ ~~( Math.random() * 5 ) ] );
						}
						else
						if ( old_hea > 0 )
						{
							driver.Say( [ 
								'Screw you and your '+this.title+'!..',
								'Aaaaa!..',
								'It is almost too late...',
								'I\'m blacking out...',
								'Well...'
							][ ~~( Math.random() * 5 ) ] );
						}
					}
				}
			}
	
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdOctopus.max_seek_range + 32 )
				this._current_target = null;
				else
				{
					this.side = ( this._current_target.x > this.x ) ? 1 : -1;

					if ( this._last_jump < sdWorld.time - ( this.type === sdOctopus.TYPE_PLAYER_TAKER ? 100 : 500 ) )
					//if ( this._last_stand_on )
					if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
					{
						this._last_jump = sdWorld.time;

						let dx = ( this._current_target.x - this.x );
						let dy = ( this._current_target.y - this.y );

						//dy -= Math.abs( dx ) * 0.5;

						if ( dx > 0 )
						dx = 2;
						else
						dx = -2;

						if ( dy > 0 )
						dy = 1;
						else
						dy = -1;

						let di = sdWorld.Dist2D_Vector( dx, dy );
						if ( di > 2 )
						{
							dx /= di;
							dy /= di;

							dx *= 2;
							dy *= 2;
						}

						this.sx = dx;
						this.sy = dy;


						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		//if ( sdWorld.is_server )
		if ( this.tenta_tim > 0 )
		{
			let old_tenta_tim = this.tenta_tim;
			
			let hit_time = 70;
			
			if ( this.tenta_target )
			if ( this.tenta_target._is_being_removed )
			this.tenta_target = null;
	
			let will_damage = true;
			let will_play_damage_effect_and_sound = true;

			if ( this.type === sdOctopus.TYPE_GUN_TAKER && this.tenta_target && this.tenta_target.is( sdGun ) && this.tenta_target._held_by && this.tenta_target._held_by.IsPlayerClass() && !this.tenta_target._held_by._is_being_removed )
			{
				let from_entity = this.tenta_target;

				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

				if ( this.tenta_tim >= hit_time && 
					 sdWorld.inDist2D_Boolean( this.x, this.y, xx, yy, this.GetRange() + 64 ) &&
					 sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
				{
					this.tenta_tim = Math.max( hit_time, this.tenta_tim - GSPEED * 5 );
					this._last_bite = sdWorld.time;

					this.tenta_x = xx - this.x;
					this.tenta_y = yy - this.y;
					
					from_entity._held_by.weapon_stun_timer = Math.max( from_entity._held_by.weapon_stun_timer, 5 );
					
					will_damage = false;
					
					//if ( this.tenta_tim <= hit_time && old_tenta_tim > hit_time )
					if ( this.tenta_tim === hit_time )
					{
						let old_tenta_hold_duration = this._tenta_hold_duration;
						
						this._tenta_hold_duration += GSPEED;
						
						if ( this._tenta_hold_duration > 0 && old_tenta_hold_duration <= 0 )
						{
							//sdSound.PlaySound({ name:'tentacle_end', x:xx, y:yy, pitch: this.GetPitch() });
							
							this.GenericOctoAttack( from_entity._held_by, true );
						}
						
						if ( this._tenta_hold_duration > 30 && old_tenta_hold_duration <= 30 )
						this.tenta_target._held_by.Say( [ 
									'Hey, how about releasing my gun?',
									'It holds my weapon',
									'Hey, let it go!',
									'And what do you think you are doing?',
									'Can\'t shoot',
									'Give it back, you!',
									'Disgusting!',
									'It tries to take my gun!'
						][ ~~( Math.random() * 8 ) ] );
						

						if ( this._tenta_hold_duration > 30 * 4.7 && old_tenta_hold_duration <= 30 * 4.7 )
						this.tenta_target._held_by.Say( [ 
									'Hey, it took my gun',
									'No, my gun!',
									'I lost a gun',
									'His tentacle is too strong',
									'I can\'t hold anymore',
									'Here goes my gun'
						][ ~~( Math.random() * 6 ) ] );

						if ( this._tenta_hold_duration > 30 * 5 )
						{
							will_damage = true;
							will_play_damage_effect_and_sound = false;
						}
					}
				}
				else
				this.tenta_tim = Math.max( 0, this.tenta_tim - GSPEED * 5 );
			}
			else
			this.tenta_tim = Math.max( 0, this.tenta_tim - GSPEED * 5 );
			
			if ( sdWorld.is_server )
			if ( will_damage )
			if ( this._hea > 0 )
			if ( this.tenta_target )
			if ( ( this.tenta_tim <= hit_time && old_tenta_tim > hit_time ) || !will_play_damage_effect_and_sound ) // Time of hit or taking gun due to logic above
			{
				let from_entity = this.tenta_target;

				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

				if ( sdWorld.inDist2D_Boolean( this.x, this.y, xx, yy, this.GetRange() + 64 ) &&
					 sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
				{
					this.GenericOctoAttack( from_entity, will_play_damage_effect_and_sound );

					this.tenta_target = null;

				}
			}
		}

		if ( this.death_anim === 0 )
		{
			if ( this.hurt_timer > 0 )
			this.hurt_timer = Math.max( 0, this.hurt_timer - GSPEED * 0.075 );
		
			if ( this.hurt_timer <= 0 ) // Allow being stunned from damage since they deal higher damage now
			if ( this._current_target )
			if ( this._last_bite < sdWorld.time - ( this.type === sdOctopus.TYPE_PLAYER_TAKER ? 500 : 1000 ) )
			{
				this._last_bite = sdWorld.time; // So it is not so much calc intensive
						
					
				let nears_raw = this.GetAnythingNearCache( this.x, this.y, this.GetRange() );
				let from_entity;
				
				let nears = [];
				for ( var i = 0; i < nears_raw.length; i++ )
				{
					from_entity = nears_raw[ i ];
					if ( ( from_entity.GetClass() === 'sdCharacter' && from_entity.IsVisible( this ) ) ||
						 ( from_entity.GetClass() === 'sdBlock' && ( !from_entity._natural || !from_entity.IsDefaultGround() ) ) ||
						 from_entity.GetClass() === 'sdCom' ||
						 from_entity.GetClass() === 'sdNode' ||
						 from_entity.GetClass() === 'sdBot' ||
						 from_entity.GetClass() === 'sdCrystal' ||
						 from_entity.GetClass() === 'sdTurret' ||
						 from_entity.GetClass() === 'sdDoor' ||
						 from_entity.GetClass() === 'sdStorage' ||
						 from_entity.GetClass() === 'sdConveyor' ||
						 ( from_entity.GetClass() === 'sdBadDog' && from_entity.master ) ||
						 from_entity.GetClass() === 'sdHover' ||
						 from_entity.GetClass() === 'sdAntigravity' ||
						 from_entity.GetClass() === 'sdMatterContainer' ||
						 from_entity.GetClass() === 'sdCommandCentre' ||
						 ( from_entity.GetClass() === 'sdGun' /*&& from_entity.class !== sdGun.CLASS_BUILD_TOOL && from_entity.class !== sdGun.CLASS_MEDIKIT && ( from_entity._held_by === null || from_entity._held_by.gun_slot === sdGun.classes[ from_entity.class ].slot )*/ ) || // Yes, held guns too, but only currently held guns. Except for build tool and medikit
						 from_entity.GetClass() === 'sdTeleport' ||
						 from_entity.GetClass() === 'sdVirus' ||
						 from_entity.GetClass() === 'sdGuanako' ||
						 ( typeof from_entity.hea !== 'undefined' && from_entity.hea <= 0 ) ||
						 ( typeof from_entity._hea !== 'undefined' && from_entity._hea <= 0 ) ||
						 from_entity === this._current_target )
					if ( from_entity.IsTargetable( this ) )
					if ( !from_entity._is_being_removed )
					{
						let rank = Math.random() * 0.1;
						
						if ( ( from_entity.hea || from_entity._hea ) > 0 )
						rank += 100 / ( 100 + ( from_entity.hea || from_entity._hea ) );
						
						if ( from_entity._held_by )
						rank += 2;
						
						if ( ( from_entity === this._current_target || from_entity.IsPlayerClass() ) /*from_entity.GetClass() === 'sdCharacter'*/ && ( from_entity.hea || from_entity._hea || 0 ) > 0 )
						rank += 1;
					
						if ( this.type === sdOctopus.TYPE_PLAYER_TAKER )
						{
							if ( from_entity.IsPlayerClass() )
							{
								rank += 3;
							}
						}
						
						if ( from_entity._held_by && from_entity._held_by._ai_team === 10 )
						{
							// No cheesing the Time Shifter
						}
						else
						nears.push( { ent: from_entity, rank: rank } );
					}
				}
				
				nears.sort((a,b)=>{
					return b.rank - a.rank;
				});
				
				//sdWorld.shuffleArray( nears );

				//let hits_left = 4;

				for ( var i = 0; i < nears.length; i++ )
				{
					from_entity = nears[ i ].ent;
					
					let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
					let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						/*if ( from_entity.GetClass() === 'sdGun' && !from_entity._is_being_removed )
						{
							if ( this._consumed_guns_snapshots.length < 64 )
							{
								this._consumed_guns_snapshots.push( from_entity.GetSnapshot( globalThis.GetFrame(), true ) );
								from_entity.remove();
							}
						}
						else
						{
							if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdDoor' )
							{
								from_entity.DamageWithEffect( 75, this );
							}
							else
							from_entity.DamageWithEffect( 75, this );
						}
						
						this._hea = Math.min( this._hmax, this._hea + 25 );

						from_entity.PlayDamageEffect( xx, yy );*/

						this.tenta_x = xx - this.x;
						this.tenta_y = yy - this.y;
						this.tenta_tim = 100;
						this.tenta_target = from_entity;
						this._tenta_hold_duration = 0;
						
						sdSound.PlaySound({ name:'tentacle_start', x:this.x, y:this.y, volume: 0.5, pitch: this.GetPitch() });
						
						/*let di = sdWorld.Dist2D_Vector( this.tenta_x, this.tenta_y );
						if ( di > 0 )
						from_entity.Impulse( this.tenta_x / di * 20, this.tenta_y / di * 20 );*/

						break;
					}
				}
			}
		}
	}
	get title()
	{
		return 'Octopus';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, this.title );
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
		
		ctx.scale( this.side, 1 );
		
		let xx = 0;
		let yy = 0;
		
		if ( this.tenta_tim > 0 )
		{
			let sprites = [
				3,0,
				2,1,
				3,1
			];
			
			let morph = ( Math.sin( this.tenta_tim / 100 * Math.PI ) );
			let best_id = Math.round( morph * 2 );
			
			let xx = sprites[ best_id * 2 + 0 ];
			let yy = sprites[ best_id * 2 + 1 ];
			
			let di = sdWorld.Dist2D_Vector( this.tenta_x, this.tenta_y ) * ( ( best_id + 1 ) / 3 );
			
			if ( di < 200 )
			{
			    ctx.save();
				{
					ctx.scale( this.side, 1 );
					ctx.rotate( Math.PI / 2 - Math.atan2( this.tenta_x, this.tenta_y ) );
					ctx.drawImageFilterCache( sdOctopus.img_octopus, xx * 32, yy * 32, 32,32, 0, -16, di,32 );
				}
			    ctx.restore();
			}
		}
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdOctopus.death_duration + sdOctopus.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			
			xx = Math.min( 4 - 1, ~~( ( this.death_anim / sdOctopus.death_duration ) * 4 ) );
			yy = 2;
			
			//ctx.drawImageFilterCache( sdOctopus.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{			
			if ( this.hurt_timer > 0 )
			{
				xx = 0;
				yy = 2;
				//ctx.drawImageFilterCache( sdOctopus.death_imgs[ 0 ], - 16, - 16, 32,32 );
			}
			else
			if ( this.tenta_tim > 0 )
			{

				let morph = ( Math.sin( this.tenta_tim / 100 * Math.PI ) );
				let best_id = Math.round( morph * 2 );

				xx = best_id;
				yy = 3;
				/*let morph = ( Math.sin( this.tenta_tim / 100 * Math.PI ) );
				
				for ( let layer = 0; layer < 2; layer++ )
				{
					if ( layer === 0 )
					ctx.strokeStyle = '#000000';
					else
					ctx.strokeStyle = '#008000';
					
					for ( let prog = 0; prog < 10; prog++ )
					{
						let morph1 = ( prog + 0 ) / 10;
						let morph2 = ( prog + 1 ) / 10;
						
						ctx.lineWidth = 7 * Math.pow( 1 - prog / 10, 2 ) + ( 1 - layer ) * 2;
						ctx.beginPath(); 
						ctx.moveTo( morph1 * this.tenta_x * morph * this.side, morph1 * this.tenta_y * morph );
						ctx.lineTo( morph2 * this.tenta_x * morph * this.side, morph2 * this.tenta_y * morph );
						ctx.stroke();
					}
				}*/
			}
			else
			if ( Math.abs( this.sx ) < 1 )
			{
				if ( !sdShop.isDrawing )
				xx = ( (sdWorld.time+this._anim_shift) % 5000 < 200 ) ? 1 : ( (sdWorld.time+this._anim_shift) % 5000 < 400 ) ? 2 : 0;
			
				yy = 0;
				//ctx.drawImageFilterCache( ( (sdWorld.time+this._anim_shift) % 5000 < 200 ) ? sdOctopus.img_octopus_idle2 : ( (sdWorld.time+this._anim_shift) % 5000 < 400 ) ? sdOctopus.img_octopus_idle3 : sdOctopus.img_octopus_idle1, - 16, - 16, 32,32 );
			}
			else
			{
				xx = 0;
				yy = 1;
				//ctx.drawImageFilterCache( sdOctopus.img_octopus_jump, - 16, - 16, 32,32 );
			}
		}
		
		xx += 4 * this.type;
		
		
		ctx.drawImageFilterCache( sdOctopus.img_octopus, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdOctopus.death_duration + sdOctopus.post_death_ttl ) // not gone by time
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
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdOctopus.init_class();

export default sdOctopus;
