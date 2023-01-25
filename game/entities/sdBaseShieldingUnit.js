/*

	
	"If bases won't be possible to destroy with heavy armory vehicles and nuclear strikes - I'll be sad. 
	It would be cool if some combat tank could be made with the cost of some anti-crystal and long construction process though."
																											- Eric Gurt


*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdVirus from './sdVirus.js';
import sdQuickie from './sdQuickie.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';
import sdCamera from './sdCamera.js';
import sdStatusEffect from './sdStatusEffect.js';

import sdRenderer from '../client/sdRenderer.js';

class sdBaseShieldingUnit extends sdEntity
{
	static init_class()
	{
		sdBaseShieldingUnit.img_unit = sdWorld.CreateImageFromFile( 'shield_unit_sheet' );
		/*
		sdBaseShieldingUnit.img_unit = sdWorld.CreateImageFromFile( 'shield_unit' );
		sdBaseShieldingUnit.img_unit_repair = sdWorld.CreateImageFromFile( 'shield_unit_repair' );
		
		sdBaseShieldingUnit.img_unit2 = sdWorld.CreateImageFromFile( 'shield_unit2' );
		sdBaseShieldingUnit.img_unit2_repair = sdWorld.CreateImageFromFile( 'shield_unit2_repair' );
		*/

		sdBaseShieldingUnit.protect_distance = 275; // Used for breathing when there is no air and if BSU is enabled
		sdBaseShieldingUnit.protect_distance_stretch = sdBaseShieldingUnit.protect_distance + 100; // If BSU moves...
				
		sdBaseShieldingUnit.regen_matter_cost_per_1_hp = 0.002; // Much less than player's automatic regeneration
		sdBaseShieldingUnit.regen_matter_cost_per_1_hp_matter_type = 0.075; // 0.15 / 1.32 * 0.66; // Was 0.15 but ( / 1.32 * 0.66 ) makes it equal to average matter cost of a weapon. It is slightly less effective for non-sword weapons such as bullets or rails
		
		sdBaseShieldingUnit.all_shield_units = [];
		
		sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER = 0;
		sdBaseShieldingUnit.TYPE_MATTER = 1;
		
		sdBaseShieldingUnit.longer_time_protected_bsu_priority = 9; // 5 // It is added to 1
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -7; }
	get hitbox_y2() { return 8; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }

	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }

	Impact( vel ) // fall damage basically
	{
		// No impact damage if has driver (because no headshot damage)
		if ( vel > 5 )
		{
			this.DamageWithEffect( ( vel - 3 ) * 25 );
		}
	}
	RequireSpawnAlign() 
	{ return false; }

	constructor( params )
	{
		super( params );
		
		this.type = params.type || sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER;
		
		this.sx = 0;
		this.sy = 0;
		
		this._connected_cameras_cache = [];
		this._connected_cameras_cache_last_rethink = 0;
		
		this._dmg_to_report = 0;
		
		this._last_damage = 0; // Sound flood prevention
		
		this.hmax = 500 * 4; // * 3 when enabled * construction hitpoints upgrades - Just enough so players don't accidentally destroy it when stimpacked and RTP'd
		this.hea = this.hmax;
		//this._hmax_old = this.hmax;
		this.regen_timeout = 0;
		//this._last_sync_matter = 0;
		//this.matter_crystal_max = 2000000;
		this.matter_crystal = 0; // Named differently to prevent matter absorption from entities that emit matter
		this._protected_entities = [];
		this.enabled = false;
		this.attack_other_units = true;
		this._matter_drain = 0;
		
		this.prevent_hostile_shielding = true; // Prevent bases from being "sealed forever", at least at zero range
		
		this.matter_max = ( this.type === sdBaseShieldingUnit.TYPE_MATTER ) ? 1000 : 0;
		this.matter = 0;
		this.timer_to_expect_matter = 30 * 10; // Goes down when out of matter so big explosions could not destroy BSU if there is more matter
		
		this.charge = 0; // Goes up while shield is activated - makes lose less matter on BSU-BSU attacks (TYPE_MATTER only)
		this.charge_blocked_until = 0; // Set during attacking
		
		this._last_x_for_charge_reset = 0;
		this._last_y_for_charge_reset = 0;

		this._check_blocks = 30; // Temporary, checks for old pre-rework BSU's protected blocks and applies cost for "this._matter_drain" which is now used when BSU attacks BSU. Will be commented out / removed later.
		
		//this.filter = params.filter || 'none';

		//this._repair_timer = 0;
		this._attack_timer = 0;
		this.attack_anim = 0; //Animation

		this._target = null;
		
		this._last_sheild_sound_played = 0;
		// 1 slot
		
		this._last_value_share = 0;
		
		sdBaseShieldingUnit.all_shield_units.push( this );
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_protected_entities' );
	}
	
	ShareValueIfHadntRecently( destroy=false )
	{
		if ( this.type !== sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		return false;
	
		if ( this._is_being_removed )
		return false;
		
		if ( sdWorld.time > this._last_value_share + 2000 || destroy )
		{
			let friendly_shields = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
			
			let id = friendly_shields.indexOf( this );
			if ( id === -1 )
			friendly_shields.push( this );
		
			for ( let i = 0; i < friendly_shields.length; i++ )
			{
				if ( friendly_shields[ i ].type !== this.type || friendly_shields[ i ]._is_being_removed )
				{
					friendly_shields.splice( i, 1 );
					i--;
					continue;
				}
			}
			
			let sum_matter = 0;
			
			for ( let i = 0; i < friendly_shields.length; i++ )
			sum_matter += friendly_shields[ i ].matter_crystal;
		
		
			if ( friendly_shields.length <= 1 )
			return false;
			
			if ( destroy )
			{
				id = friendly_shields.indexOf( this );
				
				if ( id !== -1 )
				friendly_shields.splice( id, 1 );
			
				this.remove();
			}
			
			
				
			sum_matter /= friendly_shields.length;
			
			for ( let i = 0; i < friendly_shields.length; i++ )
			{
				friendly_shields[ i ].matter_crystal = sum_matter;
				
				friendly_shields[ i ]._last_value_share = sdWorld.time;
			}
			
			return true;
		}
		
		return false;
	}
				
	ProtectedEntityAttacked( ent, dmg, initiator )
	{
		let fx = ( sdWorld.time > this._last_sheild_sound_played + 100 );
		
		if ( initiator )
		if ( initiator._socket )
		{
			if ( initiator._last_damage_upg_complain < sdWorld.time - 1000 * 10 )
			{
				initiator._last_damage_upg_complain = sdWorld.time;

				switch ( ~~( Math.random() * 7 ) )
				{
					case 0: initiator.Say( 'This entity is protected by a base shielding unit', true, false, true ); break;
					case 1: initiator.Say( 'A base shielding unit is protecting this', true, false, true ); break;
					case 2: initiator.Say( 'Entity can not be damaged until base shielding unit is disabled', true, false, true ); break;
					case 3: initiator.Say( 'Can\'t damage due to base shielding unit', true, false, true ); break;
					case 4: initiator.Say( 'This entity is within range of base shielding unit', true, false, true ); break;
					case 5: initiator.Say( 'Base shielding units can be attacked by other base shielding units', true, false, true ); break;
					case 6: initiator.Say( 'Some base shielding units are vulnerable to anti-crystals', true, false, true ); break;
				}
			}

			if ( fx )
			{
				//ent.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 1, 6, 1 ], observer: initiator });
				this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 6, 6, 6 ], observer: initiator });
			}
		}
		
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		{
			this.matter_crystal = Math.max( 0, this.matter_crystal - dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp );

			if ( this.matter_crystal >= 50000 )
			{
				if ( initiator )
				if ( !initiator._is_being_removed )
				{
					if ( !sdWorld.inDist2D_Boolean( initiator.x, initiator.y, this.x, this.y, sdBaseShieldingUnit.protect_distance - 64 ) ) // Check if it is far enough from the shield to prevent players in base take damage
					{
						initiator.DamageWithEffect( 5 );
						
						if ( fx )
						{
							sdWorld.SendEffect({ x:this.x, y:this.y, x2:this.x + ( this._hitbox_x2 / 2 ), y2:ent.y + ( ent._hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							sdWorld.SendEffect({ x:ent.x + ( ent._hitbox_x2 / 2 ), y:ent.y + ( ent._hitbox_y2 / 2 ), x2:initiator.x, y2:initiator.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
						}
					}
				}
			}
		}
		else
		{
			//trace( 'BSU matter wasted per damage: ', dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp_matter_type );
			
			this.matter = Math.max( 0, this.matter - dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp_matter_type );
			this.WakeUpMatterSources();
		}
		
		this._dmg_to_report += dmg;
		if ( this._dmg_to_report > 500 )
		{
			this._dmg_to_report = 0;
			
			let cameras = this.GetConnectedCameras();
			for ( let i = 0; i < cameras.length; i++ )
			cameras[ i ].Trigger( sdCamera.DETECT_BSU_DAMAGE );
		}
		
		if ( fx )
		{
			sdSound.PlaySound({ name:'shield', x:ent.x, y:ent.y, volume:0.2 });
			
			this._last_sheild_sound_played = sdWorld.time;
		}
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = Math.abs( dmg );
		
		if ( this.enabled )
		{
			dmg *= 0.333;
			
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
			}
		}
		
		//let old_hea = this.hea;
		
		this.hea -= dmg;
		
		
		if ( !this.attack_other_units )
		if ( this.hea < this.hmax * 0.75 )
		{
			let cameras = this.GetConnectedCameras();
			for ( let i = 0; i < cameras.length; i++ )
			cameras[ i ].Trigger( sdCamera.DETECT_BSU_DAMAGE );
		}
	
		this.regen_timeout = 30;

		if ( this.hea <= 0 )
		this.remove();

		//console.log( this._protected_entities );

		//this._update_version++; // Just in case
	}
	SetShieldState( enable=false, observer_character=null )
	{
		if ( enable === this.enabled )
		{
			return;
		}
		
		if ( !enable )
		{
			let cameras = this.GetConnectedCameras();
			for ( let i = 0; i < cameras.length; i++ )
			cameras[ i ].Trigger( sdCamera.DETECT_BSU_DEACTIVATION );
		}
		
		this.enabled = enable;
		if ( !this.enabled ) // Disabled protected blocks and doors
		{
			sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:2, pitch:0.25 });
			
			let obj;
			
			let effect_for = [];
			
			for ( let j = 0; j < this._protected_entities.length; j++ )
			{
				obj = sdEntity.entities_by_net_id_cache_map.get( this._protected_entities[ j ] );
				if ( obj ) // If not - admin removed it. Or world border
				if ( !obj._is_being_removed )
				if ( obj._shielded === this )
				{
					obj._shielded = null;
						
					effect_for.push( obj );
						
					//sdWorld.SendEffect({ x:this.x, y:this.y, x2:obj.x + ( obj._hitbox_x2 / 2 ), y2:obj.y + ( obj._hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#855805' });
				}
			}
			
			for ( let t = 0; t < 30 && effect_for.length > 0; t++ )
			{
				let p = ~~( Math.random() * effect_for.length );
				
				let b = effect_for[ p ];
				
				sdWorld.SendEffect({ x:this.x, y:this.y, x2:b.x + ( b.hitbox_x2 / 2 ), y2:b.y + ( b.hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#855805' });
				
				effect_for.splice( p, 1 );
			}
			
			this._protected_entities = [];
			this._matter_drain = 0; // Reset matter drain
		}

		if ( this.enabled ) // Scan unprotected blocks and fortify them
		{
			//this.sx = 0; // Without this, players can "launch/catapult" shield units by running into them and disabling them
			//this.sy = 0;
			
			this.charge_blocked_until = sdWorld.time + 3000;
			
			sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:2, pitch:0.5 });

			let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, [ 'sdBlock', 'sdDoor' ] );
			
			let effect_for = [];
			
			let friendly_shields = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
			let unfriendly_shields = []; // These will prevent protecting walls nearby other shields
			
			for ( let i = 0; i < sdBaseShieldingUnit.all_shield_units.length; i++ )
			{
				let s = sdBaseShieldingUnit.all_shield_units[ i ];
				
				if ( s.prevent_hostile_shielding )
				if ( s !== this )
				if ( ( s.charge >= this.charge && s.charge > 0 ) || ( s.type !== this.type && s.enabled ) )
				if ( friendly_shields.indexOf( s ) === -1 )
				unfriendly_shields.push( s );
			}
			
			function CheckIfNearUnfriendly( e )
			{
				for ( let i = 0; i < unfriendly_shields.length; i++ )
				{
					let s = unfriendly_shields[ i ];
					if ( e.inRealDist2DToEntity_Boolean( s, sdBaseShieldingUnit.protect_distance + 32 ) )
					return true;
				}

				return false;
			}
			
			let tell_about_disputable_entities = false;

			for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
			{
				let e = blocks[ i ];
				
				if ( e.is( sdBlock ) )
				{
					if ( e.material === sdBlock.MATERIAL_WALL || 
						 e.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || 
						 e.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 ) // Only walls, no trap or shield blocks
					if ( e._shielded === null || e._shielded._is_being_removed )
					{
						if ( CheckIfNearUnfriendly( e ) )
						{
							//if ( observer_character )
							//e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 0, 0, 0 ], observer: observer_character });
						
							tell_about_disputable_entities++;
						
							continue;
						}
						
						e._shielded = this;
						
						effect_for.push( e );
						
						this._protected_entities.push( e._net_id ); // Since for some reason arrays don't save _net_id's in this entity, this is obsolete
						this._matter_drain += ( e.height + e.width ) / 32;
						

						if ( observer_character )
						e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 1, 2, 1 ], observer: observer_character });
					}
				}
				else
				if ( e.is( sdDoor ) )
				{
					if ( e._shielded === null || e._shielded._is_being_removed )
					{
						if ( CheckIfNearUnfriendly( e ) )
						{
							//if ( observer_character )
							//e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 0, 0, 0 ], observer: observer_character });
						
							tell_about_disputable_entities++;
						
							continue;
						}
					
						e._shielded = this;
						
						effect_for.push( e );
						
						this._protected_entities.push( e._net_id );
						this._matter_drain += ( e.height + e.width ) / 32;
						
						if ( observer_character )
						e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 1, 2, 1 ], observer: observer_character });
					}
				}
			}
			
			for ( let t = 0; t < 30 && effect_for.length > 0; t++ )
			{
				let p = ~~( Math.random() * effect_for.length );
				
				let b = effect_for[ p ];
				
				sdWorld.SendEffect({ x:this.x, y:this.y, x2:b.x + ( b.hitbox_x2 / 2 ), y2:b.y + ( b.hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
				
				effect_for.splice( p, 1 );
			}
			
			if ( tell_about_disputable_entities > 0 )
			if ( observer_character )
			if ( observer_character._socket )
			{
				observer_character._socket.SDServiceMessage( '{1} entities are disputable and were not protected. Try connecting base shielding units with a cable tool.', [ tell_about_disputable_entities ] );
			}
		}
		
		this.ShareValueIfHadntRecently();
	}
	SetAttackState()
	{
		if ( this.enabled )
		{
			this.attack_other_units = !this.attack_other_units;

			if ( !this.attack_other_units )
			{
				let cameras = this.GetConnectedCameras();
				for ( let i = 0; i < cameras.length; i++ )
				cameras[ i ].Trigger( sdCamera.DETECT_BSU_DEACTIVATION );
			}
			
			sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
		}
	}
	get mass() { return ( this.enabled ) ? 500 : 35; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	
	GetConnectedCameras()
	{
		if ( sdWorld.time > this._connected_cameras_cache_last_rethink + 3000 )
		{
			let old_cameras = this._connected_cameras_cache.slice();
			
				
			this._connected_cameras_cache_last_rethink = sdWorld.time;
			this._connected_cameras_cache = this.FindObjectsInACableNetwork( null, sdCamera );
			
			if ( old_cameras.length !== this._connected_cameras_cache.length )
			{
				for ( let i = 0; i < old_cameras.length; i++ )
				{
					let c = old_cameras[ i ];
					
					if ( !c._is_being_removed )
					if ( this._connected_cameras_cache.indexOf( c ) === -1 )
					c.Trigger( sdCamera.DETECT_BSU_DEACTIVATION );
				}
			}
		}
		
		return this._connected_cameras_cache;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.enabled )
		{
			this.sx = 0;
			this.sy = 0;
			
			if ( sdWorld.time > this.charge_blocked_until )
			if ( this.matter >= 320 )
			if ( this.charge < 100 )
			this.charge = Math.min( 100, this.charge + GSPEED * 0.25 );
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			
			if ( this.charge > 0 )
			this.charge = Math.max( 0, this.charge - GSPEED * 0.25 );
		}
		
		let delta_pos = sdWorld.Dist2D_Vector( this.x - this._last_x_for_charge_reset, this.y - this._last_y_for_charge_reset );
		this.charge = Math.max( 0, this.charge - delta_pos / 16 * 100 );
		this._last_x_for_charge_reset = this.x;
		this._last_y_for_charge_reset = this.y;
		
		if ( !sdWorld.is_server)
		return;
	

		//if ( this._repair_timer > 0 )
		//this._repair_timer -= GSPEED;

		if ( this._attack_timer > 0 )
		this._attack_timer -= GSPEED;


		if ( this.attack_anim > 0 )
		this.attack_anim -= GSPEED;

		if ( this.regen_timeout > 0 )
		this.regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			{
				//let heal = Math.min( this.hea + 2 * ( GSPEED ), this.hmax ) - this.hea;
				let heal = Math.min( this.hea + 1.5 * ( GSPEED ), this.hmax ) - this.hea;

				this.hea += heal;

				/*if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
				{
					this.matter_crystal -= heal * sdBaseShieldingUnit.regen_matter_cost_per_1_hp * 3; // 3 for shield effect
				}*/
			}
		}

		if ( this._check_blocks > 0 && this.enabled )
		this._check_blocks -= GSPEED;
		else
		if ( this._matter_drain === 0 && this.enabled )
		{
			let blocks = this._protected_entities;
			for ( let i = 0; i < this._protected_entities.length; i++ ) // For non-reworked BSU's that exist pre-update
			{
				this._matter_drain += ( blocks[ i ].height + blocks[ i ].width ) / 32;
			}
		}

		if ( this.enabled )
		{
			if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER && this.matter_crystal < 800 )
			{
				this.SetShieldState( false ); // Shut down if no matter
				if ( this.attack_other_units )
				this.attack_other_units = false;
			}
			else
			if ( this.type === sdBaseShieldingUnit.TYPE_MATTER && this.matter < 320 )
			{
				if ( this.timer_to_expect_matter > 0 )
				{
					let previous_value = this.timer_to_expect_matter;
					this.timer_to_expect_matter -= GSPEED;
					
					if ( ~~( this.timer_to_expect_matter / 30 ) !== ~~( previous_value / 30 ) )
					{
						let pitch = 0.5 * ( 0.9 + 0.1 * this.timer_to_expect_matter / ( 30 * 10 ) );
						
						if ( pitch > 0 )
						sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.25, pitch: pitch });
					}
				}
				else
				{
					sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
					sdSound.PlaySound({ name:'gun_needle', x:this.x, y:this.y, volume:4, pitch: 0.2 });
					
					let that = this;
					for ( var i = 0; i < 20; i++ )
					{
						let an = Math.random() * Math.PI * 2;
						let d = ( i === 0 ) ? 0 : Math.random() * 20;
						let r = ( i === 0 ) ? 50 : ( 10 + Math.random() * 20 );

						setTimeout( ()=>
						{
							if ( !that._is_being_removed || i === 0 )
							if ( !that.enabled )
							{
								var a = Math.random() * 2 * Math.PI;
								var s = Math.random() * 10;

								var k = 1;

								var x = that.x + that._hitbox_x1 + Math.random() * ( that._hitbox_x2 - that._hitbox_x1 );
								var y = that.y + that._hitbox_y1 + Math.random() * ( that._hitbox_y2 - that._hitbox_y1 );

								that.sx -= Math.sin( an ) * d * r * 0.005;
								that.sy -= Math.cos( an ) * d * r * 0.005;

								sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: that.sx*k + Math.sin(a)*s, sy: that.sy*k + Math.cos(a)*s, filter:'hue-rotate(-90deg) saturate(1.5)' });

								sdWorld.SendEffect({ 
									x: that.x + Math.sin( an ) * d, 
									y: that.y + Math.cos( an ) * d, 
									radius: r, 
									damage_scale: 1, 
									type: sdEffect.TYPE_EXPLOSION,
									owner: that,
									can_hit_owner: false,
									color: '#55aaff'
								});
								
								that.DamageWithEffect( this.hmax / 20 * 0.95 ); // Leave with 5 hitpoints
							}
						}, i * 150 );
					}


					this.SetShieldState( false ); // Shut down if no matter
					if ( this.attack_other_units )
					this.attack_other_units = false;
				}
			}
			else
			{
				//if ( this.hea > 0 )
				//{
					if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
					if ( this.timer_to_expect_matter < 30 * 10 )
					{
						this.timer_to_expect_matter = 30 * 10;
					}
				//}
			}
		}

		if ( this.attack_other_units )
		if ( this.enabled )
		if ( this._attack_timer <= 0 )
		{
			this._attack_timer = 30 + Math.random() * 30; // Idling, do not check in each frame since this whole test can be complex enough
			
			//let units = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance + 64, null, [ 'sdBaseShieldingUnit' ] );
			
			const units = sdBaseShieldingUnit.all_shield_units;
			
			const range = ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER ) ? 
				sdBaseShieldingUnit.protect_distance + 64 :
				sdBaseShieldingUnit.protect_distance * 1.5;
		
			let friendly_shields = this.FindObjectsInACableNetwork( null, sdBaseShieldingUnit );
			
			for ( let i = 0; i < units.length; i++ ) // Protect nearby entities inside base unit's radius
			if ( units[ i ].type === this.type )
			{
				let unit = units[ i ];
				
				let distance = sdWorld.Dist2D( this.x, this.y, unit.x, unit.y )
				
				if ( ( distance < range ) ) // Only attack close range shields can be attacked
				if ( unit !== this )
				if ( unit.enabled === true )
				if ( friendly_shields.indexOf( unit ) === -1 ) // Do not attack same base's shields
				{
					if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
					{
						if ( unit.matter_crystal > 80 ) // Not really needed since the units turn off below 800 matter
						{
							unit.matter_crystal -= 80;
							this.matter_crystal -= 80;
							
							{
								let cameras = this.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}
							{
								let cameras = unit.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}

							if ( false ) // Something does not feel right here, yet (no damage is registered in some cases, possibly due to _matter_drain being 0, though I haven't checked)
							{
								if ( unit._matter_drain - this._matter_drain > 0 )
								{
									unit.matter_crystal -= ( unit.matter_crystal > 100000 ? 0.9 : 1 ) * ( unit._matter_drain - this._matter_drain );
									this.matter_crystal -= ( unit._matter_drain - this._matter_drain );
								}
							}
							sdWorld.SendEffect({ x:this.x, y:this.y, x2:unit.x, y2:unit.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							this._attack_timer = 30;
							this.attack_anim = 20;
							
							if ( unit.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
							unit.ShareValueIfHadntRecently();
							
							if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
							this.ShareValueIfHadntRecently();
						}
					}
					else
					if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
					{
						let my_scale = ( 1 + sdBaseShieldingUnit.longer_time_protected_bsu_priority * this.charge / 100 );
						let their_scale = ( 1 + sdBaseShieldingUnit.longer_time_protected_bsu_priority * unit.charge / 100 );
						
						let my_matter_scaled = this.matter * my_scale; // 10 times more if charged
						let their_matter_scaled = unit.matter * their_scale; // 10 times more if charged
						
						let least_matter = Math.min( my_matter_scaled, their_matter_scaled, 500 );
						
						let intensity = Math.min( 1, 10 - distance / range * 10 ); // Further sheilds are - less matter is wasted by both, 10% of soft waste
						least_matter *= intensity;
						
						if ( least_matter > 0 )
						{
							//trace( 'my matter damage: '+(least_matter / my_scale),', their matter damage: '+(least_matter / their_scale) );

							this.matter -= least_matter / my_scale;
							unit.matter -= least_matter / their_scale;
							
							{
								let cameras = this.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}
							{
								let cameras = unit.GetConnectedCameras();
								for ( let i = 0; i < cameras.length; i++ )
								cameras[ i ].Trigger( sdCamera.DETECT_BSU_ATTACKS );
							}

							this._attack_timer = 60;
							//unit._attack_timer = 60;

							this.attack_anim = 20;
							unit.attack_anim = 20;

							this.charge_blocked_until = sdWorld.time + 3000;
							unit.charge_blocked_until = sdWorld.time + 3000;

							this.WakeUpMatterSources();
							unit.WakeUpMatterSources();

							if ( intensity < 1 )
							sdWorld.SendEffect({ x:this.x, y:this.y, x2:unit.x, y2:unit.y, type:sdEffect.TYPE_BEAM, color:'#f90000' });
							else
							sdWorld.SendEffect({ x:this.x, y:this.y, x2:unit.x, y2:unit.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });

							sdSound.PlaySound({ name:'zombie_alert2', x:this.x, y:this.y, volume:0.375 * intensity, pitch:3 });
							sdSound.PlaySound({ name:'zombie_alert2', x:unit.x, y:unit.y, volume:0.375 * intensity, pitch:3 });
						}
					}
				}
			}
		}
		/*if ( this._repair_timer <= 0 ) // Realtime fortifying replaced with turning unit on/off since now it is static when it is turned on
		{
			{
				for ( let j = 0; j < this._protected_entities.length; j++ )
				{
					if ( ( sdWorld.Dist2D( this.x, this.y, this._protected_entities[ j ].x, this._protected_entities[ j ].y ) > sdBaseShieldingUnit.protect_distance ) || ( !this.enabled ) ) // If an entity is too far away, let players know it's not protected anymore
					if ( this._protected_entities[ j ]._shielded === this )
					{
						this._protected_entities[ j ]._shielded = null;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:this._protected_entities[ j ].x + ( this._protected_entities[ j ].hitbox_x2 / 2 ), y2:this._protected_entities[ j ].y + ( this._protected_entities[ j ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#855805' });
					}
				}
				this._repair_timer = 210; // 7 seconds
				if ( this.enabled )
				{
					let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, [ 'sdBlock', 'sdDoor' ] );
					for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
					{
						if ( blocks[ i ].GetClass() === 'sdBlock' )
						{
							if ( blocks[ i ].material === sdBlock.MATERIAL_WALL || blocks[ i ].material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ) // Only walls, no trap or shield blocks
							if ( blocks[ i ]._shielded === null )
							{
								blocks[ i ]._shielded = this;
								sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
								this._protected_entities.push( blocks[ i ] );
							}
						}
						
						if ( blocks[ i ].GetClass() === 'sdDoor' )
						{
							if ( blocks[ i ]._shielded === null )
							{
								blocks[ i ]._shielded = this;
								sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
								this._protected_entities.push( blocks[ i ] );
							}
						}
					}
				}
			}
		}*/
		
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.01 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}*/
		//sdWorld.last_hit_entity = null;
		
		//this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		if ( from_entity.is( sdCrystal ) )
		if ( from_entity.held_by === null && from_entity.type !== 2 && from_entity.type !== 6 ) // Prevent crystals which are stored in a crate
		//if ( this.matter_crystal < this.matter_crystal_max )
		{
			if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
			{
				sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2, pitch:2 });
				
				let matter_to_feed = from_entity.matter_max;
				/* Likely won't work properly with value sharing green BSUs have now
				let matter_to_feed = ( this.matter_crystal < 50000 ? 1.2 : this.matter_crystal < 100000 ? 1.1 : 1 ) * from_entity.matter_max;
				let old_matter = this.matter_crystal;
				if ( this.matter_crystal < 50000 )
				if ( this.matter_crystal + matter_to_feed > 50000 )
				{
					this.matter_crystal = 50000;
					matter_to_feed = ( ( matter_to_feed - ( this.matter_crystal - old_matter ) ) / 1.2 ) * 1.1;
				}
				if ( this.matter_crystal > 50000 && this.matter_crystal < 100000 )
				if ( this.matter_crystal + matter_to_feed > 100000 )
				{
					this.matter_crystal = 100000;
					matter_to_feed = ( matter_to_feed - ( this.matter_crystal - old_matter ) ) / 1.1;
				}*/

				//this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + matter_to_feed); // Drain the crystal for it's max value and destroy it
				this.matter_crystal = Math.min( Number.MAX_SAFE_INTEGER, this.matter_crystal + matter_to_feed ); // Drain the crystal for it's max value and destroy it
				//this._update_version++;
				from_entity.remove();
			}
		}
	}

	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.hea <= 0 )
		//return;
	
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		sdEntity.TooltipUntranslated( ctx, T("Crystal-based base shielding unit") + " ( " + ~~(this.matter_crystal) + " )" );
		if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
		{
			sdEntity.TooltipUntranslated( ctx, T("Matter-based base shielding unit") + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )", 0, -8 );
			
			let allow_protection_claim_str = ', ' + T( ( this.prevent_hostile_shielding ) ? 'nearby claiming disallowed' : 'nearby claiming allowed' );
			
			let active_str = T( ( this.attack_other_units ) ? 'active' : 'passive' );
				
			sdEntity.TooltipUntranslated( ctx, T('Anti-raid protection') + ': ' + ~~(this.charge) + '% (' + active_str + allow_protection_claim_str + ')', 0, 0, ( this.charge < 50 || !this.prevent_hostile_shielding || !this.attack_other_units ) ? '#ff6666' : '#66ff66' );
		}

		let w = 30;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		
		this.DrawConnections( ctx );
	}

	DrawConnections( ctx )
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;
/*
		for ( var i = 0; i < sdEntity.entities.length; i++ )
		if ( sdEntity.entities[ i ].GetClass() === 'sdCom' )
		if ( sdWorld.Dist2D( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this.x, this.y ) < sdCom.retransmit_range )
		//if ( sdWorld.CheckLineOfSight( this.x, this.y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) )
		if ( sdWorld.CheckLineOfSight( this.x, this.y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, null, sdCom.com_visibility_unignored_classes ) )
		{
			ctx.beginPath();
			ctx.moveTo( sdEntity.entities[ i ].x - this.x, sdEntity.entities[ i ].y - this.y );
			ctx.lineTo( 0,0 );
			ctx.stroke();
		}
*/
		ctx.beginPath();
		ctx.arc( 0,0, sdBaseShieldingUnit.protect_distance, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}

	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;

		let xx = 0;
		let yy = 0;
		
		if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
		xx = Math.min( ( this.enabled ) ? 1 : 0 );
		//ctx.drawImageFilterCache( ( this.enabled ) ? sdBaseShieldingUnit.img_unit_repair : sdBaseShieldingUnit.img_unit, - 16, -16, 32, 32 );
		else
		if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
		{
			if ( this.enabled && this.timer_to_expect_matter < 30 * 9 )
			{
				ctx.filter = ( sdWorld.time % 200 < 100 ) ? 'brightness(0.5)' : 'brightness(1.5)';
			}
			xx = Math.min( ( this.enabled ) ? 1 : 0 );
			yy = 1;
			//ctx.drawImageFilterCache( ( this.enabled ) ? sdBaseShieldingUnit.img_unit2_repair : sdBaseShieldingUnit.img_unit2, - 16, -16, 32, 32 );
		}
		ctx.drawImageFilterCache( sdBaseShieldingUnit.img_unit, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );
		//ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
		
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		this.SetShieldState( false );
		
		let id = sdBaseShieldingUnit.all_shield_units.indexOf( this );
		if ( id !== -1 )
		sdBaseShieldingUnit.all_shield_units.splice( id, 1 );
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return sdWorld.damage_to_matter + 600;
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		//this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		this.ShareValueIfHadntRecently();
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		//if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
			{
				if ( command_name === 'SHIELD_ON' )
				{
					if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
					{
						if ( this.matter_crystal >= 800 )
						this.SetShieldState( true, exectuter_character );
						else
						executer_socket.SDServiceMessage( 'Base shield unit needs at least 800 matter' );
					}
					else
					{
						if ( this.matter >= 320 )
						this.SetShieldState( true, exectuter_character );
						else
						executer_socket.SDServiceMessage( 'Base shield unit needs at least 320 matter' );
					}
				}
				if ( command_name === 'SHIELD_OFF' )
				{
					if ( this.enabled === true )
					this.SetShieldState();
				}
				if ( command_name === 'ATTACK' )
				{
					if ( this.enabled )
					{
						this.SetAttackState();
					}
					else
					executer_socket.SDServiceMessage( 'Base shield unit needs to be enabled' );
				}
				
				if ( command_name === 'PREVENT_HOSTILE_SHIELDING' )
				{
					this.prevent_hostile_shielding = !this.prevent_hostile_shielding;
					sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:2, pitch:0.5 });
				}
				
				if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
				{
					if ( command_name === 'CAPACITY' )
					{
						let cap = parseInt( parameters_array[ 0 ] );

						if ( cap === 1000 || cap === 10000 )
						{
							if ( this.matter > cap )
							executer_socket.SDServiceMessage( 'Base shielding unit still has matter capacity over target capacity' );

							this.matter_max = Math.max( cap, this.matter );

							sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:0.25 });
						}
					}
				}
				else
				{
					if ( command_name === 'DESTROY_AND_GIVE_MATTER_OUT' )
					{
						if ( this.ShareValueIfHadntRecently( true ) )
						{
							sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:0.25 });
						}
						else
						executer_socket.SDServiceMessage( 'Shield must be connected to other shields of a same type with a cable' );
					}
				}
				/*if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
				if ( command_name === 'CAPACITY_CONSUMER' )
				{
					let cap = parseInt( parameters_array[ 0 ] );
					
					if ( cap === 4000000 )
					{
						if ( this.matter_crystal > cap )
						executer_socket.SDServiceMessage( 'Base shielding unit still has matter capacity over target capacity' );
						
						this.matter_crystal_max = Math.max( cap, this.matter_crystal );
						
						sdSound.PlaySound({ name:'spider_deathC3', x:this.x, y:this.y, volume:1, pitch:0.25 });
					}
				}*/
				//Not sure if Crystal-based BSU should have extended matter capacity, I don't know - Booraz149
			}
			else
			executer_socket.SDServiceMessage( 'Base shielding unit is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		//if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( sdWorld.my_entity )
			{
				if ( this.enabled === false )
				{
					if ( this.type === sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER )
					this.AddContextOption( 'Scan nearby unprotected entities ( 800 matter )', 'SHIELD_ON', [] );
					else
					this.AddContextOption( 'Scan nearby unprotected entities ( 320 matter )', 'SHIELD_ON', [] );
				}
				else
				{
					this.AddContextOption( 'Turn the shields off', 'SHIELD_OFF', [] );
					
					if ( !this.attack_other_units )
					this.AddContextOption( 'Attack nearby shield units', 'ATTACK', [] );
					else
					this.AddContextOption( 'Stop attacking nearby shield units', 'ATTACK', [] );
				
				
					
					if ( this.prevent_hostile_shielding )
					this.AddContextOption( 'Allow nearby shielding claim by disconnected shields', 'PREVENT_HOSTILE_SHIELDING', [] );
					else
					this.AddContextOption( 'Disallow nearby shielding claim by disconnected shields', 'PREVENT_HOSTILE_SHIELDING', [] );
				}
				
				if ( this.type === sdBaseShieldingUnit.TYPE_MATTER )
				{
					if ( this.matter_max !== 10000 )
					this.AddContextOption( 'Increase matter capacity to 10k', 'CAPACITY', [ 10000 ] );
					
					if ( this.matter_max !== 1000 )
					this.AddContextOption( 'Decrease matter capacity to 1k', 'CAPACITY', [ 1000 ] );
				}
				else
				{
					this.AddContextOption( 'Destroy and give matter out', 'DESTROY_AND_GIVE_MATTER_OUT', [] );
				}
			}
		}
	}
}
//sdBaseShieldingUnit.init_class();

export default sdBaseShieldingUnit;
