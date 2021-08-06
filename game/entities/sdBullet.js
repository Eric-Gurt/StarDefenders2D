
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';

import sdEffect from './sdEffect.js';
import sdCube from './sdCube.js';
import sdCharacter from './sdCharacter.js';
import sdSound from '../sdSound.js';
import sdBlock from './sdBlock.js';
import sdAntigravity from './sdAntigravity.js';
import sdDoor from './sdDoor.js';
import sdGun from './sdGun.js';
import sdArea from './sdArea.js';
import sdRift from './sdRift.js';



class sdBullet extends sdEntity
{
	static init_class()
	{
		sdBullet.images = {
			'ball': sdWorld.CreateImageFromFile( 'ball' ),
			'ball_g': sdWorld.CreateImageFromFile( 'ball_g' ),
			'rocket_proj': sdWorld.CreateImageFromFile( 'rocket_proj' ),
			'grenade': sdWorld.CreateImageFromFile( 'grenade' ),
			'f_psicutter_proj': sdWorld.CreateImageFromFile( 'f_psicutter_proj' ),
			'ball_charged':  sdWorld.CreateImageFromFile( 'ball_charged' ),
			'mini_rocket':  sdWorld.CreateImageFromFile( 'mini_rocket' ),
			'mini_rocket_green':  sdWorld.CreateImageFromFile( 'mini_rocket_green' ),
			'gauss_rifle_proj':  sdWorld.CreateImageFromFile( 'gauss_rifle_proj' ),
			'mini_missile_p241':  sdWorld.CreateImageFromFile( 'mini_missile_p241' )
		};
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.is_grenade || this.ac > 0 ? -2 : 0; }
	get hitbox_x2() { return this.is_grenade || this.ac > 0 ? 2 : 0; }
	get hitbox_y1() { return this.is_grenade || this.ac > 0 ? -2 : 0; }
	get hitbox_y2() { return this.is_grenade || this.ac > 0 ? 2 : 0; }
	
	get substeps() // Bullets will need more
	{ return 6; } // 3 was generally fine expect for sniper

	get hard_collision() // For world geometry where players can walk
	{ return this.is_grenade; }
	
	get mass() { return 5; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	
	get progress_until_removed()
	{ return this._rail || this._hook || this._wave; }
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( this._rail || this._hook || this._wave )
		return false;
	
		if ( this.color === 'transparent' )
		return false;
	
		return true;
	}
	
	Impact( vel ) // fall damage basically
	{
		if ( this.is_grenade )
		if ( vel > 3 )
		{
			if ( !sdWorld.is_server )
			sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:5, volume: Math.min( 0.25, 0.1 * vel ), _server_allowed:true });
		}
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		this.color = '#FFFF00';
		
		//globalThis.EnforceChangeLog( this, 'color' );
		
		this._start_x = this.x;
		this._start_y = this.y;
		//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_BLOOD });
		
		this._damage = 10;
		this.time_left = 30;
		
		this._return_damage_to_owner = false; // Stimpack and medikit
		this._custom_target_reaction = null;
		this._custom_detonation_logic = null;
		
		this._armor_penetration_level = 10; // Defines damage that is compared to target's ._armor_level in order to potentially be able or unable to deal any damage
		this._reinforced_level = 0; // For "reinforced" blocks which are unlocked from shop / build tool upgrades
		
		this._rail = false;
		this.explosion_radius = 0;
		this.model = null; // Custom image model
		
		//this._knock_scale = 0.05 * 8; // Without * 8 in old mass model
		this._knock_scale = 0.01 * 8; // Less and standartized now, except for swords
		
		this._hook = false;
		this._wave = false; // hidden & instant
		
		this._last_target = null; // what bullet did hit
		
		this.is_grenade = false;
		
		this._bg_shooter = false;
		
		this.penetrating = false;
		this._penetrated_list = [];

		this._emp = false; // EMP effect, used for turrets to set them to "sleep mode"
		this._emp_mult = 1; // How long will the turret sleep ( 1 = 5 seconds )

		this._dirt_mult = 0; // Damage bonus multiplier (relative to initial damage) against dirt blocks, used in Laser Drill weapon
		this._shield_block_mult = 0; // Damage bonus multiplier (relative to initial damage) against shield blocks, used in Life Box
		
		this._bouncy = false;
		
		this._owner = null;
		this._owner2 = null; // Usually vehicle which _owner uses to shoot (or sdTurret?). Participates in collision ignoring as well
		this._can_hit_owner = false;
		
		this._admin_picker = false; // Whether it can hit anything including rift portals
		
		this._soft = false; // Punches
		
		this._hea = 80; // For grenades to be hittable
		
		// Rockets
		this.ac = 0; // Intensity
		this.acx = 0;
		this.acy = 0;
		
		this._homing = false; // is the bullet homing towards mouse?
		this._homing_mult = 0; // How fast/strong does it home towards target?
		
		this._first_frame = true; // Bad approach but early removal isn't good either. Also impossible to know if projectile is hook this early so far
		
		// Defining this in method that is not called on this object and passed as collision filtering thing
		//this.BouncyCollisionFiltering = this.BouncyCollisionFiltering.bind( this ); Bad, snapshot will enumerate it
		/*Object.defineProperty( this, 'BouncyCollisionFiltering',
		{
			value: this.BouncyCollisionFiltering.bind( this ),
			enumerable: false
		});
		Object.defineProperty( this, 'RegularCollisionFiltering',
		{
			value: this.RegularCollisionFiltering.bind( this ),
			enumerable: false
		});*/
		this.SetMethod( 'BouncyCollisionFiltering', this.BouncyCollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
		this.SetMethod( 'RegularCollisionFiltering', this.RegularCollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
	}
	onRemove()
	{
		if ( this._rail )
		sdWorld.SendEffect({ x:this._start_x, y:this._start_y, x2:this.x, y2:this.y, type:sdEffect.TYPE_BEAM, color:this.color });
	
		if ( this._custom_detonation_logic )
		this._custom_detonation_logic( this );
	
		if ( this.explosion_radius > 0 )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:this.explosion_radius, 
			damage_scale: ( this._owner && this._owner.IsPlayerClass() ? this._owner._damage_mult : 1 ), 
			type:sdEffect.TYPE_EXPLOSION,
			armor_penetration_level: this._armor_penetration_level,
			owner:this._owner,
			color:this.color 
		});
	
		if ( this._hook )
		{
			if ( this._owner )
			if ( this._owner.IsPlayerClass() )
			{
				this._owner.hook_x = this.x;
				this._owner.hook_y = this.y;
				
				if ( this._last_target && this._last_target.HookAttempt( this ) )
				{
					this._owner._hook_relative_to = this._last_target;
					this._owner._hook_relative_x = this.x - this._last_target.x;
					this._owner._hook_relative_y = this.y - this._last_target.y;
				}
				else
				{
					this._owner._hook_relative_to = null;
					this._owner._hook_relative_x = 0;
					this._owner._hook_relative_y = 0;
				}

			}
		}
	
		//if ( this._damage < 0 ) // healgun
		if ( this._damage !== 0 ) // Didn't hit anyting
		if ( this._return_damage_to_owner )
		{
			if ( this._owner )
			if ( !this._owner._is_being_removed )
			{
				this._owner.Damage( this._damage, null, false, false );
				
				if ( this._custom_target_reaction )
				this._custom_target_reaction( this, this._owner );
			
				this._damage = 0;
			}
		}
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return this._bouncy ? null : ( this.is_grenade ? [ 'sdCharacter' ] : [ 'sdCharacter', 'sdTurret', 'sdHover', 'sdEnemyMech' , 'sdCube', 'sdAsp', 'sdJunk', 'sdRift', 'sdDrone', 'sdLifeBox' ] );
	}
	get bounce_intensity()
	{ return this._bouncy ? 0.8 : ( this.is_grenade ? 0.55 : 0.3 ); } // 0.3 not felt right for grenades
	
	get friction_remain()
	{ return this._bouncy ? 0.8 : ( this.is_grenade ? 0.8 : 0.3 ); }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			this.remove();
		}
	}
	
	static IsTrapShieldIgonred( owner_ent, trap_shield_block )
	{
		return sdWorld.inDist2D_Boolean( owner_ent.x, owner_ent.y, trap_shield_block.x + trap_shield_block.width/2, trap_shield_block.y + trap_shield_block.height/2, 32 );
	}
	
	RegularCollisionFiltering( from_entity )
	{
		if ( this._can_hit_owner )
		{
		}
		else
		{
			if ( from_entity === this._owner || from_entity === this._owner2 )
			return false;

			if ( from_entity.is( sdBullet ) )
			{
				if ( this._owner )
				if ( this._owner === from_entity._owner )
				return false;

				if ( this._owner2 )
				if ( this._owner2 === from_entity._owner2 )
				return false;
			}


			// Generally not having hitpoints and being included in GetIgnoredEntityClasses is enough for bullets to ignore something. But watch out for throwable swords at sdGun at movement in range method

			if ( from_entity.is( sdBlock ) && from_entity.material === sdBlock.MATERIAL_TRAPSHIELD )
			if ( this._owner === null || ( ( !this._owner._key_states || !this._owner._key_states.GetKey( 'ShiftLeft' ) ) && sdBullet.IsTrapShieldIgonred( this._owner, from_entity ) ) )
			{
				return false;
			}
		}
		
		if ( this._admin_picker )
		return true;

		if ( from_entity.is( sdRift ) ) // Ignore portals
		{
			return false;
		};
		
		return true;
	}
	
	BouncyCollisionFiltering( from_entity ) // Without this logic bullets will stuck in initiator on spawn. Though GetIgnoredEntityClasses will implement simpler logic which could work more efficient for normal cases
	{
		if ( from_entity === this._owner || from_entity === this._owner2 )
		return false;
	
		if ( !this.RegularCollisionFiltering( from_entity ) )
		return false;
	
		if ( this._owner === from_entity )
		return false;
	
		if ( this._owner2 === from_entity )
		return false;
	
		return true;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._first_frame )
		{
			this._first_frame = false;
			if ( !this._hook && !this._admin_picker )
			if ( !sdArea.CheckPointDamageAllowed( this.x, this.y ) )
			{
				if ( this._owner && this._owner._god )
				{
				}
				else
				if ( this._owner2 && this._owner2._god )
				{
				}
				else
				{
					this.remove();
					return;
				}
			}
		}
		
		this.time_left -= GSPEED;
		if ( this.time_left <= 0 )
		{
			this._hook = false;
			this.remove();
			return;
		}
		
		if ( this.ac > 0 )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.93, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.93, GSPEED );

			if ( this._homing && this._owner )
			{
				let di_targ = sdWorld.Dist2D_Vector( this._owner.look_x - this.x, this._owner.look_y - this.y );
				let xx = 1 * ( this._owner.look_x - this.x ) - this.sx * di_targ / 15;
				let yy = 1 * ( this._owner.look_y - this.y ) - this.sy * di_targ / 15;

				let di = sdWorld.Dist2D_Vector( xx, yy );
				if ( di > 0.01 )
				{
					this.acx = sdWorld.MorphWithTimeScale( this.acx, xx / di * 50, 1 - this._homing_mult, GSPEED );
					this.acy = sdWorld.MorphWithTimeScale( this.acy, yy / di * 50, 1 - this._homing_mult, GSPEED );
				}
			}
			
			this.sx += this.acx * GSPEED * this.ac * 1;
			this.sy += this.acy * GSPEED * this.ac * 1;
		}

		
		if ( this.is_grenade )
		{
			this.sy += sdWorld.gravity * GSPEED;

			this.ApplyVelocityAndCollisions( GSPEED, 0, true, 0, this.RegularCollisionFiltering );
		}
		else
		{
			if ( this.penetrating || this._rail )
			{
				this.x += this.sx * GSPEED;
				this.y += this.sy * GSPEED;
			}
			else
			{
				let vel = this.sx * this.sx + this.sy * this.sy;

				sdWorld.last_hit_entity = null;

				this.ApplyVelocityAndCollisions( GSPEED, 0, true, 0, this._bouncy ? this.BouncyCollisionFiltering : this.RegularCollisionFiltering );

				let vel2 = this.sx * this.sx + this.sy * this.sy;

				if ( !this._bouncy )
				if ( vel2 < vel )
				{
					vel = Math.sqrt( vel );
					vel2 = Math.sqrt( vel2 );
					
					if ( vel2 < vel * 0.5 )
					{
						this.remove();
						return true;
					}

					if ( vel > 0.001 )
					this._damage = this._damage / vel * vel2;

					if ( !sdWorld.is_server )
					if ( sdWorld.last_hit_entity === null || !this.CanBounceOff( sdWorld.last_hit_entity ) )
					{
						this.remove();
						return true;
					}
				}
			}

			if ( this.y > sdWorld.world_bounds.y2 )
			{
				if ( !this._wave )
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });
				this.remove();
				return;
			}
		}
	}

	CanBounceOff( from_entity )
	{
		if ( this._bouncy )
		return true;
	
		if ( this.explosion_radius > 0 )
		return false;
	
		if ( !this._wave )
		if ( !this._rail )
		if ( !this._hook )
		if ( this._damage > 0 )
		{
			if ( this.penetrating )
			return ( from_entity.is( sdBlock ) && from_entity._shielded === null && this._reinforced_level >= from_entity._reinforced_level) || from_entity.is( sdAntigravity ) || ( from_entity.is( sdDoor ) && from_entity._shielded === null && this._reinforced_level >= from_entity._reinforced_level );
			else
			return ( from_entity.is( sdBlock ) && from_entity.material === sdBlock.MATERIAL_WALL ) || from_entity.is( sdAntigravity ) || from_entity.is( sdDoor );
		}
		
		return false;
	}

	onMovementInRange( from_entity )
	{
		if ( !this._hook && !this._admin_picker )
		{
			if ( from_entity.is( sdGun ) )
			return;
		
			if ( this._owner && this._owner._god )
			{
			}
			else
			if ( this._owner2 && this._owner2._god )
			{
			}
			else
			{
				if ( from_entity.is( sdArea ) )
				{
					if ( from_entity.type === sdArea.TYPE_PREVENT_DAMAGE )
					{
						this.remove();
						return;
					}
				}
				else
				{
					if ( !sdArea.CheckPointDamageAllowed( from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2, from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2 ) )
					{
						this.remove();
						return;
					}
				}
			}
		}

		if ( !this.RegularCollisionFiltering( from_entity ) )
		return;
	
		if ( ( 
				this._owner !== from_entity && ( !this._owner || !this._owner._owner || this._owner._owner !== from_entity ) &&
				this._owner2 !== from_entity 
				
			 ) || this._can_hit_owner ) // 2nd rule is for turret bullet to not hit turret owner
		{
			if ( from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD || from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN || from_entity.IsPlayerClass() )
			//if ( from_entity.GetClass() === 'sdCharacter' || 
			//	 from_entity.GetClass() === 'sdVirus' )
			{
				if ( from_entity.IsTargetable( this, !this._hook ) ) // Ignore safe areas only if not a hook
				if ( !sdWorld.server_config.GetHitAllowed || sdWorld.server_config.GetHitAllowed( this, from_entity ) )
				if ( this._damage < 0 || !this._owner || !from_entity.IsPlayerClass() || !this._owner.IsPlayerClass() || from_entity.cc_id === 0 || from_entity.cc_id !== this._owner.cc_id )
				{
					if ( sdWorld.is_server ) // Or else fake self-knock
					if ( this._damage !== 0 )
					{
						if ( this.explosion_radius <= 0 )
						if ( !this._wave )
						if ( this.color !== 'transparent' )
						sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_GLOW_HIT, color:this.color });

						if ( this._damage > 1 )
						if ( from_entity._last_hit_time !== sdWorld.time ) // Prevent flood from splash damage bullets
						{
							from_entity._last_hit_time = sdWorld.time;
							sdSound.PlaySound({ name:'player_hit', x:this.x, y:this.y, volume:0.5 });
						}
						
						let limb_mult = from_entity.GetHitDamageMultiplier( this.x, this.y );

						if ( !this._soft )
						sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter(), scale:( limb_mult === 1 ? 1 : 1.65 ) });
						
						let dmg = limb_mult * this._damage;
						
						let old_hea = ( from_entity.hea || from_entity._hea || 0 );
						
						// Some entities need to inherit impact velocity on damage so it is higher now
						from_entity.Impulse( this.sx * Math.abs( this._damage ) * this._knock_scale, 
											 this.sy * Math.abs( this._damage ) * this._knock_scale );

						from_entity.Damage( dmg, this._owner, limb_mult !== 1 );
						
						if ( this._custom_target_reaction )
						this._custom_target_reaction( this, from_entity );
						
						if ( this._owner )
						if ( old_hea > 0 )
						if ( old_hea !== ( from_entity.hea || from_entity._hea || 0 ) ) // Any damage actually dealt
						{
							if ( from_entity.IsPlayerClass() && !sdCube.IsTargetFriendly( from_entity ) )
							{
								if ( typeof this._owner._player_damage !== 'undefined' )
								this._owner._player_damage += dmg;
							}
							else
							{
								if ( typeof this._owner._nature_damage !== 'undefined' )
								this._owner._nature_damage += dmg;
							}
						}

						if ( this._bouncy )
						this._damage *= 0.8;
						else
						this._damage = 0; // for healguns
					}

					this._last_target = from_entity;

					if ( this._damage === 0 || !sdWorld.is_server )
					{
						this.remove();
						return;
					}
				}
			}
			else
			if ( !this.is_grenade )
			//if ( typeof from_entity.hea !== 'undefined' || typeof from_entity._hea !== 'undefined' || ( this._bg_shooter && !this._bouncy && from_entity.GetClass() === 'sdBG' ) || ( this._admin_picker && ( this._bg_shooter || from_entity.GetClass() !== 'sdBG' ) ) )
			//if ( typeof from_entity.hea !== 'undefined' || typeof from_entity._hea !== 'undefined' || ( this._bg_shooter && !this._bouncy && from_entity.IsBGEntity() === 1 ) || ( this._admin_picker && ( this._bg_shooter || from_entity.IsBGEntity() !== 1 ) ) )
			if ( ( from_entity.IsBGEntity() === 0 && ( typeof from_entity.hea !== 'undefined' || typeof from_entity._hea !== 'undefined' ) ) || ( this._bg_shooter && !this._bouncy && from_entity.IsBGEntity() === 1 ) || ( this._admin_picker && ( this._bg_shooter || from_entity.IsBGEntity() !== 1 ) ) )
			if ( from_entity.IsTargetable( this, !this._hook ) ) // Ignore safe areas only if not a hook
			{
				let will_bounce = false;
				//let dmg_mult = 1;
	
				
				if ( this.CanBounceOff( from_entity ) )
				{
					if ( this.penetrating )
					{
						if ( this._penetrated_list.indexOf( from_entity ) === -1 )
						this._penetrated_list.unshift( from_entity );
						else
						{
							return; // Ignore collision
						}
					}
					
					//dmg_mult = 0.65;
					will_bounce = true;
				}

				if ( this._damage !== 0 )
				{
					if ( sdWorld.is_server ) // Or else fake self-knock
					{
						if ( this.explosion_radius <= 0 )
						if ( !this._wave )
						if ( this.color !== 'transparent' )
						sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_GLOW_HIT, color:this.color });

						if ( this._soft )
						{
							sdSound.PlaySound({ name:'player_step', x:this.x, y:this.y, volume:0.5, pitch:1.8 });
						}

						if ( ( typeof from_entity._armor_protection_level === 'undefined' || this._armor_penetration_level >= from_entity._armor_protection_level ) &&
							 ( typeof from_entity._reinforced_level === 'undefined' || this._reinforced_level >= from_entity._reinforced_level ) /*&&
								 ( typeof from_entity._shielded === 'undefined' || from_entity._shielded === null )*/ )
						{
							if ( !this._wave )
							{
								if ( !this._soft )
								sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect() });
							}

							let dmg = this._damage;// * dmg_mult;

							if ( this.ac > 0 )
							{
								dmg *= from_entity.GetRocketDamageScale();
							}

							// Some entities need to inherit impact velocity on damage so it is higher now
							from_entity.Impulse( this.sx * Math.abs( dmg ) * this._knock_scale, 
												 this.sy * Math.abs( dmg ) * this._knock_scale );

							let old_hea = ( from_entity.hea || from_entity._hea || 0 );
							//if ( from_entity.GetClass() !== 'sdBlock' && from_entity.GetClass() !== 'sdDoor'  )
							from_entity.Damage( dmg, this._owner );
							/*else
							if ( from_entity._reinforced_level <= this._reinforced_level )
							from_entity.Damage( dmg, this._owner );
							else
							if ( this._owner )
							if ( this._owner.is( sdCharacter ) )
							if ( this._owner._last_damage_upg_complain < sdWorld.time - 1000 * 10 )
							{
								this._owner._last_damage_upg_complain = sdWorld.time;

								if ( Math.random() < 0.5 )
								this._owner.Say( 'I could do with a Deconstructor Hammer' );
								else
								this._owner.Say( 'I need a Deconstructor Hammer to damage this' );
							}*/

							if ( this._custom_target_reaction )
							this._custom_target_reaction( this, from_entity );
							if ( from_entity.GetClass() === 'sdLifeBox' )
							if ( from_entity.driver0 )
							if ( this.y <= from_entity.y )
							from_entity.Damage( dmg, this._owner, true );

							if ( from_entity.GetClass() === 'sdTurret' && this._emp === true ) // Disable turrets if they're hit by an EMP bullet
							{
								from_entity.disabled = true;
								from_entity._disabled_timeout = 150 * this._emp_mult;
							}

							if ( from_entity.GetClass() === 'sdLifeBox' )
							//if ( from_entity.driver0 )
							if ( this._bouncy && !this.is_grenade )
							this.remove(); // Prevent falkonian PSI cutter oneshotting lifebox

							if ( from_entity.GetClass() === 'sdBlock' && from_entity.material === sdBlock.MATERIAL_GROUND ) // Dirt damage bonus multiplier (relative to initial damage)
							from_entity.Damage( dmg * this._dirt_mult, this._owner );

							if ( from_entity.GetClass() === 'sdBlock' && from_entity.material === sdBlock.MATERIAL_TRAPSHIELD ) // Shield block damage bonus multiplier (relative to initial damage)
							from_entity.Damage( dmg * this._shield_block_mult, this._owner );

							if ( this._owner )
							if ( old_hea > 0 )
							if ( old_hea !== ( from_entity.hea || from_entity._hea || 0 ) ) // Any damage actually dealt
							{
								if ( from_entity.GetClass() === 'sdCube' || from_entity.GetClass() === 'sdCrystal' )
								if ( typeof this._owner._nature_damage !== 'undefined' )
								this._owner._nature_damage += dmg;
							}
						}
						else
						{
							//if ( this.penetrating )
							//will_bounce = false;

							if ( this._custom_target_reaction_protected )
							this._custom_target_reaction_protected( this, from_entity );

							if ( !this._wave )
							{
								if ( !this._soft )
								sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });

								sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });

								if ( this._owner )
								if ( this._owner.IsPlayerClass() )
								{
									if ( this._owner._last_damage_upg_complain < sdWorld.time - 1000 * 10 )
									{
										this._owner._last_damage_upg_complain = sdWorld.time;

										/*if ( from_entity._shielded !== null )
										{
											if ( Math.random() < 0.5 )
											this._owner.Say( 'This entity is protected by a base shielding unit' );
											else
											this._owner.Say( 'A base shielding unit is protecting this' );
										}
										else*/
										if ( from_entity._reinforced_level > 0 )
										{
											if ( Math.random() < 0.5 )
											this._owner.Say( 'I could do with a Deconstructor Hammer' );
											else
											this._owner.Say( 'I need a Deconstructor Hammer to damage this' );
										}
										else
										{
											if ( from_entity._armor_protection_level > 3 )
											this._owner.Say( 'Regular weapons won\'t work here. What about big explosions?' );
											else
											{
												if ( Math.random() < 0.5 )
												this._owner.Say( 'Can\'t damage that' );
												else
												this._owner.Say( 'I need damage upgrade' );
											}
										}
									}
								}
							}
						}
					}

					//this._damage *= ( 1 - dmg_mult ); // for healguns it is important to be at 0

					if ( !will_bounce )
					this._damage = 0; // for healguns it is important to be at 0
					else
					if ( this.penetrating )
					{
						this._damage *= 0.5;
						this.sx *= 0.5;
						this.sy *= 0.5;

						//console.log( 'vel = '+sdWorld.Dist2D_Vector( this.sx, this.sy ) );

						if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 10 )
						this._damage = 0;
					}

				}

				//if ( will_bounce ) Bounce is done at bullet logic now, naturally
				/*if ( dmg_mult !== 1 )
				{
					this.sx *= ( 1 - dmg_mult );
					this.sy *= ( 1 - dmg_mult );
				}*/

				if ( this._damage === 0 )
				{
					this._last_target = from_entity;

					this.remove();
				}
				return;
			}
		}
	}
	Draw( ctx, attached )
	{
		
		if ( this.model )
		{
			ctx.rotate( Math.atan2( this.sy, this.sx ) );
		
			//ctx.drawImage( sdBullet.images[ this.model ], - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdBullet.images[ this.model ], - 16, - 16, 32,32 );
			
		}
		else
		{
			ctx.rotate( Math.atan2( this.sy, this.sx ) + Math.PI / 2 );
		
			let vel = Math.sqrt( this.sx * this.sx + this.sy * this.sy ) * 0.7;

			/*ctx.fillStyle = this.color;
			ctx.fillRect( -0.5 * 0.666, -vel/2, 1 * 0.666, vel );
			
			ctx.globalAlpha = 0.03;
			ctx.fillRect( -0.5 - 5, -vel/2 - 5, 1 + 10, vel + 10 );
			*/

			ctx.globalAlpha = 0.5;
			ctx.fillStyle = this.color;
			ctx.fillRect( -0.5, -vel/2, 1, vel );
			
			ctx.globalAlpha = 0.03;
			ctx.fillRect( -0.5 - 5, -vel/2 - 5, 1 + 10, vel + 10 );

			ctx.fillStyle = '#ffffff';
			ctx.globalAlpha = 1;
			const b = 0.3 * 0.666;
			ctx.fillRect( -0.5 * 0.666 + b, -vel/2 + b, 1 * 0.666 - 2*b, vel - 2*b );
		}
	}
}
//sdBullet.init_class();

export default sdBullet;
	
