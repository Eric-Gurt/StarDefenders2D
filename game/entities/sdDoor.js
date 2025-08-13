
/* global sdShop */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdCom from './sdCom.js';
import sdWater from './sdWater.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdSensorArea from './sdSensorArea.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
import sdButton from './sdButton.js';
import sdLongRangeTeleport from './sdLongRangeTeleport.js';


import sdRenderer from '../client/sdRenderer.js';


class sdDoor extends sdEntity
{
	static init_class()
	{
		/*sdDoor.img_door = sdWorld.CreateImageFromFile( 'door' );
		sdDoor.img_door_closed = sdWorld.CreateImageFromFile( 'door2' );
		
		sdDoor.img_adoor = sdWorld.CreateImageFromFile( 'adoor' );
		sdDoor.img_adoor_closed = sdWorld.CreateImageFromFile( 'adoor2' );

		sdDoor.img_a2door = sdWorld.CreateImageFromFile( 'a2door' );
		sdDoor.img_a2door_closed = sdWorld.CreateImageFromFile( 'a2door2' );
		*/
		sdDoor.img_door_path = sdWorld.CreateImageFromFile( 'door_open2' );
		/*
		sdDoor.img_door_no_matter = sdWorld.CreateImageFromFile( 'door_no_matter' );
		sdDoor.img_door_no_matter2 = sdWorld.CreateImageFromFile( 'door_no_matter2' );
		
		sdDoor.img_adoor_no_matter = sdWorld.CreateImageFromFile( 'adoor_no_matter' ); // Reinforced doors, level 1
		sdDoor.img_adoor_no_matter2 = sdWorld.CreateImageFromFile( 'adoor_no_matter2' );

		sdDoor.img_a2door_no_matter = sdWorld.CreateImageFromFile( 'a2door_no_matter' ); // Reinforced doors, level 2
		sdDoor.img_a2door_no_matter2 = sdWorld.CreateImageFromFile( 'a2door_no_matter2' );
		
		sdDoor.img_falkok_door = sdWorld.CreateImageFromFile( 'door_falkok' );*/
		sdDoor.img_door = sdWorld.CreateImageFromFile( 'sdDoor' );
		
		sdDoor.MODEL_BASIC = 1;
		sdDoor.MODEL_ARMORED = 2;
		sdDoor.MODEL_ARMORED_LVL2 = 3;
		sdDoor.MODEL_FALKOK = 4;
		sdDoor.MODEL_BASIC_SMALL = 5;
		sdDoor.MODEL_ARMORED_SMALL = 6;
		sdDoor.MODEL_CIRCULAR_LIGHTS_SMALL = 7;
		
		sdDoor.OPEN_TYPE_COM_NODE = 0;
		sdDoor.OPEN_TYPE_AI_TEAM = 1;
		sdDoor.OPEN_TYPE_BUTTON = 2;

		sdDoor.metal_reinforces = [ 
			null,
			sdWorld.CreateImageFromFile( 'metal_d_reinforced1' ),
			sdWorld.CreateImageFromFile( 'metal_d_reinforced2' ),
			sdWorld.CreateImageFromFile( 'metal_d_reinforced3' ),
			sdWorld.CreateImageFromFile( 'metal_d_reinforced4' )
		];
		
		sdDoor.ignored_entity_classes = [ 'sdBlock', 'sdBaseShieldingUnit' ];
		sdDoor.ignored_entity_classes_travel = [];
		
		sdDoor.unignored_entity_classes = [ 'sdBlock' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -this.w / 2; }
	get hitbox_x2() { return this.w / 2; }
	get hitbox_y1() { return -this.h / 2; }
	get hitbox_y2() { return this.h / 2; }
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_BOX; }
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		if ( layer === -1 )
		return [ 0, 0, -0.01 ];
	
		return [ 0, 0.01, 0.3 ]; // 0, 0.01, 0.01 was good until I added sdBlock offset that hides seam on high visual settings
	}
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	/*{ return false; } // testing
	
	
	RequireSpawnAlign() 
	{ return true; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };*/
	
	get spawn_align_x(){ return ( this.w !== 32 ) ? 8 : 16; };
	get spawn_align_y(){ return ( this.h !== 32 ) ? 8 : 16; };

	get mass() { return this._reinforced_level > 0 ? 4000 : 100; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = dmg / ( 1 + this._reinforced_level); // Reinforced doors have damage reduction, depending on reinforced level
		
		if ( this._hea > 0 )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
			//if ( this._shielded === null || dmg === Infinity || this._shielded._is_being_removed || !this._shielded.enabled || !sdWorld.inDist2D_Boolean( this.x, this.y, this._shielded.x, this._shielded.y, sdBaseShieldingUnit.protect_distance_stretch ) )
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;
			}
			/*else
			{
				this._shielded.ProtectedEntityAttacked( this, dmg, initiator );
			}*/

			this.HandleDestructionUpdate();
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this.w = params.w || 32;
		this.h = params.h || 32;
		
		this._hmax = 550 * 4 * ( this.w / 32 ) * ( this.h / 32 );
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._owner = null; // Overriden on each open/close action
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		this._reinforced_level = params._reinforced_level || 0;
		this._max_reinforced_level = this._reinforced_level + 2;
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this.x0 = null; // undefined
		this.y0 = null; // undefined
		
		this.dir_x = null; // undefined
		this.dir_y = null; // undefined
		
		this.openness = 0;
		
		this.opening_tim = 0; // Whenever door is touched it goes up to max value and while it is > 0 door is trying to be kept open
		
		this.destruction_frame = 0;
		this.reinforced_frame = 0;
		
		this.malfunction = false; // True if origin sdBlocks were removed, will cause door to close
		
		this.model = params.model || 1;
		
		this._sensor_area = null;
		this._entities_within_sensor_area = []; // _net_ids

		this.open_type = params.open_type || sdDoor.OPEN_TYPE_COM_NODE; // 0 = normal doors, 1 = opens for specific AI team entities ( no communication node needed) , used in faction outpost generation
		this._ai_team = params._ai_team || 0; // Used so AI humanoids don't attack their own base
		
		this.filter = params.filter;
		
		if ( this.open_type === 1 )
		this.Damage( 1 ); // It creates sensor area for outposts this way
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_shielded' || prop === '_sensor_area' || prop === '_entities_within_sensor_area' );
	}
	MeasureMatterCost()
	{
		//return this._hmax + ( 200 * this._reinforced_level ) * sdWorld.damage_to_matter + 20;
		
		return this._hmax * sdWorld.damage_to_matter * ( 1 + this._reinforced_level * 2 ) + 20;
	}
	Sound( s )
	{
		sdSound.PlaySound({ name: ( ( this.model === sdDoor.MODEL_ARMORED || this.model === sdDoor.MODEL_ARMORED_LVL2 ) ? 'a' : '' ) + s, x:this.x, y:this.y, volume: ( this.model === sdDoor.MODEL_ARMORED || this.model === sdDoor.MODEL_ARMORED_LVL2 ) ? 1 : 0.5 });
	}
	SensorAreaMovementCallback( from_entity )
	{
		if ( this.open_type === sdDoor.OPEN_TYPE_COM_NODE ) // Normal doors
		{
			if ( this._entities_within_sensor_area.indexOf( from_entity._net_id ) === -1 )
			{
				let com_near = this.GetComWiredCache();
				
				if ( com_near )
				if (
					com_near.subscribers.indexOf( from_entity._net_id ) !== -1 || 
					com_near.subscribers.indexOf( from_entity.biometry ) !== -1 || 
					com_near.subscribers.indexOf( from_entity.GetClass() ) !== -1 || 
					( com_near.subscribers.indexOf( '*' ) !== -1 && !from_entity.is_static && from_entity._net_id !== undefined )
				)
				{
					this._entities_within_sensor_area.push( from_entity._net_id );
					
					if ( from_entity.IsPlayerClass() )
					{
						this._owner = from_entity;
					}
						
					this.Open();
				}
			}
		}
		if ( this.open_type === sdDoor.OPEN_TYPE_AI_TEAM )
		{
			if ( this._entities_within_sensor_area.indexOf( from_entity._net_id ) === -1 )
			if ( !from_entity.is_static && from_entity._net_id !== undefined )
			//if ( from_entity.GetClass() === 'sdCharacter' || from_entity.GetClass() === 'sdDrone' ) // universal entities which have _ai_team variable
			if ( from_entity.is( sdCharacter ) || from_entity.is( sdDrone ) ) // universal entities which have _ai_team variable
			if ( this._sensor_area )
			if ( from_entity._ai_team === this._ai_team ) // Open only if it's appropriate faction
			{
				this._entities_within_sensor_area.push( from_entity._net_id );
				
				this.Open();
			}
		}
	}
	Fleshify( from=null ) // Fleshify is reused in sdDoor, using pointer
	{
		sdBlock.prototype.Fleshify.call( this, from );
	}
	Open()
	{
		if ( this.opening_tim === 0 )
		{
			this.Sound( 'door_start' );
		}

		this.opening_tim = 15;
		this._update_version++;
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	
	CanOpenInDirection( xx, yy )
	{
		let x = ( this.x0 === null ) ? this.x : this.x0;
		let y = ( this.y0 === null ) ? this.y : this.y0;
		
		let ww = Math.min( 16, this.w );
		let hh = Math.min( 16, this.h );

		let is_suitable_offset = true;

		can_move_there:
		for ( let u = 0; u < this.w; u += ww )
		for ( let v = 0; v < this.h; v += hh )
		{
			let x1,y1,x2,y2;

			if ( xx > 0 )
			{
				x1 = x + this.w / 2 + u;
				x2 = x + this.w / 2 + u + ww;
			}
			else
			if ( xx < 0 )
			{
				x1 = x - this.w / 2 - u - ww;
				x2 = x - this.w / 2 - u;
			}
			else
			{
				x1 = x - this.w / 2 + u;
				x2 = x - this.w / 2 + u + ww;
			}

			if ( yy > 0 )
			{
				y1 = y + this.h / 2 + v;
				y2 = y + this.h / 2 + v + hh;
			}
			else
			if ( yy < 0 )
			{
				y1 = y - this.h / 2 - v - hh;
				y2 = y - this.h / 2 - v;
			}
			else
			{
				y1 = y - this.h / 2 + v;
				y2 = y - this.h / 2 + v + hh;
			}

			if ( sdWorld.CheckWallExistsBox( x1, y1, x2, y2, null, null, sdDoor.unignored_entity_classes, null ) &&
				 sdWorld.last_hit_entity && sdWorld.last_hit_entity.is( sdBlock ) )
			{
			}
			else
			{
				is_suitable_offset = false;
				break can_move_there;
			}
		}
					
		return is_suitable_offset;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		//Reset reinforced levels
		if ( this._reinforced_level > 0 )
		this._reinforced_level = 0;
		//if ( this.model === sdDoor.MODEL_ARMORED )
		//this.model = sdDoor.MODEL_BASIC;
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
				this.HandleDestructionUpdate();
			}
		}
		
		let com_near = this.GetComWiredCache();
		
		let uses_sensor = !( this.open_type === sdDoor.OPEN_TYPE_BUTTON );
				
		if ( ( com_near && this.open_type === sdDoor.OPEN_TYPE_COM_NODE ) || 
			 this.open_type === sdDoor.OPEN_TYPE_AI_TEAM || 
			 this.open_type === sdDoor.OPEN_TYPE_BUTTON )
		{
			if ( sdWorld.is_server )
			if ( uses_sensor )
			{
				if ( this._sensor_area && !this._sensor_area._is_being_removed )
				{
					let tx = this.x0 - 32 - this.w/2;
					let ty = this.y0 - 32 - this.h/2;
					if ( this._sensor_area.x !== tx || this._sensor_area.y !== ty )
					{
						this._sensor_area.x = tx;
						this._sensor_area.y = ty;
						this._sensor_area._update_version++;
						this._sensor_area.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
					}
				}
				else
				{
					this._sensor_area = new sdSensorArea({ 
						x: this.x0 - 32 - this.w/2, 
						y: this.y0 - 32 - this.h/2, 
						w: 64 + this.w, 
						h: 64 + this.h, 
						on_movement_target: this });
					sdEntity.entities.push( this._sensor_area );
				}
			}

			if ( this.x0 === null ) // undefined
			{
				outer2:
				for ( var yy = 1; yy >= -1; yy-- )
				for ( var xx = -1; xx <= 1; xx++ )
				if ( xx === 0 || yy === 0 )
				if ( xx !== 0 || yy !== 0 )
				{
					if ( this.CanOpenInDirection( xx, yy ) )
					{
						this.x0 = this.x;
						this.y0 = this.y;
						this.dir_x = xx;
						this.dir_y = yy;
						this._update_version++;
						break outer2;
					}
					
					/*let blocks_found_in_direction = 0;

					outer:
					for ( var u = -1; u <= 1; u += 2 )
					for ( var v = -1; v <= 1; v += 2 )
					{
						if ( sdWorld.CheckWallExistsBox( this.x + 8 * u + 32 * xx - 8, 
														 this.y + 8 * v + 32 * yy - 8,
														 this.x + 8 * u + 32 * xx + 8,
														 this.y + 8 * v + 32 * yy + 8,
														 this, null ) && 
							 sdWorld.last_hit_entity !== null && sdWorld.last_hit_entity.GetClass() === 'sdBlock' )
						blocks_found_in_direction++;
						else
						break outer;
					}

					if ( blocks_found_in_direction === 4 )
					{
						this.x0 = this.x;
						this.y0 = this.y;
						this.dir_x = xx;
						this.dir_y = yy;
						this._update_version++;
						break outer2;
					}*/
				}
			}
			else
			{
				for ( let i2 = 0; i2 < this._entities_within_sensor_area.length; i2++ )
				{
					let e = sdEntity.entities_by_net_id_cache_map.get( this._entities_within_sensor_area[ i2 ] );
					
					if ( e && !e._is_being_removed &&
							(
								!uses_sensor // Buttons can add themselves
								||
								(
									e.x + e._hitbox_x2 >= this._sensor_area.x + this._sensor_area._hitbox_x1 &&
									e.x + e._hitbox_x1 <= this._sensor_area.x + this._sensor_area._hitbox_x2 &&
									e.y + e._hitbox_y2 >= this._sensor_area.y + this._sensor_area._hitbox_y1 &&
									e.y + e._hitbox_y1 <= this._sensor_area.y + this._sensor_area._hitbox_y2
								)
							)
						)
					{
					}
					else
					{
						this._entities_within_sensor_area.splice( i2, 1 );
						i2--;
						continue;
					}
				}
				
				let allow_decrease = sdWorld.is_server; // Prevent high GSPEED causing doors to constantly open/close offscreeb

				if ( this._entities_within_sensor_area.length > 0 )
				{
					this.Open();
					allow_decrease = false;
				}

				let speed = GSPEED * 2 / ( Math.max( this.w, this.h ) / 32 );

				if ( this.opening_tim > 0 && !this.malfunction )
				{
					if ( this.openness < 32 )
					{
						this.openness = Math.min( 32, this.openness + speed );
						this.x = this.x0 + this.dir_x * this.openness * this.w/32;
						this.y = this.y0 + this.dir_y * this.openness * this.h/32;
						this._update_version++;

						if ( this.openness === 32 )
						this.Sound( 'door_stop' );
					}
					
					if ( allow_decrease )
					this.opening_tim = Math.max( 0, this.opening_tim - GSPEED );

					if ( this.opening_tim === 0 )
					{
						this.Sound( 'door_start' );
						this._update_version++;
					}
				}
				else
				{
					if ( this.openness > 0 )
					{
						let old_openness = this.openness;
						this.openness = Math.max( 0, this.openness - speed );

						let new_x = this.x0 + this.dir_x * this.openness * this.w/32;
						let new_y = this.y0 + this.dir_y * this.openness * this.h/32;

						if ( this.CanMoveWithoutOverlap( new_x, new_y, 0 ) ) // Small gap for doors that are placed too close
						{
							this.x = new_x;
							this.y = new_y;
							this._update_version++;
						}
						else
						{
							let interrupter1 = sdWorld.last_hit_entity;
							
							if ( interrupter1 !== null && interrupter1.is( sdDoor ) )
							{
								this.openness = old_openness;
								
								this.DamageWithEffect( 5 * GSPEED, this );
								
								interrupter1.DamageWithEffect( 5 * GSPEED, this );
							}
							else
							if ( interrupter1 !== null && 
								 sdWorld.last_hit_entity.CanMoveWithoutOverlap( sdWorld.last_hit_entity.x + ( new_x - this.x ), sdWorld.last_hit_entity.y + ( new_y - this.y ), 0 ) && // Small gap for doors that are placed too close (?)
								 !sdWorld.last_hit_entity.IsInSafeArea() && // Do not move entities in safe areas (server LRTP for example)
								 !( sdWorld.last_hit_entity.is( sdLongRangeTeleport ) && sdWorld.last_hit_entity.is_server_teleport )
								 )
							{
								sdWorld.last_hit_entity.x += new_x - this.x;
								sdWorld.last_hit_entity.y += new_y - this.y;

								this.x = new_x;
								this.y = new_y;
								this._update_version++;
							}
							else
							{
								let interrupter2 = sdWorld.last_hit_entity;

								this.openness = old_openness;
								
								this.DamageWithEffect( 5 * GSPEED, this );

								if ( interrupter1 !== null )
								interrupter1.DamageWithEffect( 5 * GSPEED, this );

								if ( interrupter2 !== null )
								interrupter2.DamageWithEffect( 5 * GSPEED, this );
							}
						}

						if ( this.openness === 0 )
						{
							this.Sound( 'door_stop' );
							this._update_version++;
						}
					}
				}

				if ( this.malfunction )
				{
					if ( this.openness === 0 )
					{
						this._update_version++;	
						this.x0 = null; // undefined // Reinit
						this.malfunction = false;
					}
				}
				else
				if ( this.openness > 0 )
				{
					//let ok = false;

					var xx = this.dir_x;
					var yy = this.dir_y;

					/*let blocks_found_in_direction = 0;

					outer:
					for ( var u = -1; u <= 1; u += 2 )
					for ( var v = -1; v <= 1; v += 2 )
					{
						if ( sdWorld.CheckWallExistsBox( 
														this.x0 + 8 * u + 32 * xx - 8, 
														this.y0 + 8 * v + 32 * yy - 8, 
														this.x0 + 8 * u + 32 * xx + 8, 
														this.y0 + 8 * v + 32 * yy + 8, 
														this, null ) && 
							 sdWorld.last_hit_entity !== null && sdWorld.last_hit_entity.GetClass() === 'sdBlock' )
						blocks_found_in_direction++;
						else
						break outer;
					}

					if ( blocks_found_in_direction === 4 )
					ok = true;

					if ( !ok )*/
					if ( !this.CanOpenInDirection( xx, yy ) )
					this.malfunction = true;
				}
			}
			
			if ( this.opening_tim === 0 && this.openness === 0 && !this.malfunction && this._hea >= this._hmax )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
		else
		{
			if ( this._sensor_area && this.open_type === sdDoor.OPEN_TYPE_COM_NODE )
			{
				this._sensor_area.remove();
				this._sensor_area = null;
			}
			
			if ( this._hea >= this._hmax )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdDoor.ignored_entity_classes;
	}
	get title()
	{
		return 'Door';
	}
	get description()
	{
		return `Connect access management node to doors in order to configure which entities should trigger door opening.`;
	}
	DrawBG( ctx, attached )
	{
		if ( this.openness > 0 || typeof ctx.FakeStart !== 'undefined' )
		{
			if ( this.x0 === null ) // undefined
			ctx.drawImageFilterCache( sdDoor.img_door_path, 0,0,this.w,this.h, -this.w / 2, -this.h / 2, this.w,this.h );
			else
			ctx.drawImageFilterCache( sdDoor.img_door_path, 0,0,this.w,this.h, -this.w / 2 - this.x + this.x0, -this.h / 2 - this.y + this.y0, this.w,this.h );
		}
	}
	Draw( ctx, attached )
	{
		//ctx.apply_shading = false;
		
		let com_near = this.GetComWiredCache() || sdShop.isDrawing;
		
		/*let img_no_matter = ( sdWorld.time % 4000 < 2000 ) ? sdDoor.img_door_no_matter : sdDoor.img_door_no_matter2;
		let img_closed = sdDoor.img_door_closed;
		let img_normal = sdDoor.img_door;
		
		if ( this.model === sdDoor.MODEL_ARMORED )
		{
			img_no_matter = ( sdWorld.time % 4000 < 2000 ) ? sdDoor.img_adoor_no_matter : sdDoor.img_adoor_no_matter2;
			img_closed = sdDoor.img_adoor_closed;
			img_normal = sdDoor.img_adoor;
		}
		if ( this.model === sdDoor.MODEL_ARMORED_LVL2 )
		{
			img_no_matter = ( sdWorld.time % 4000 < 2000 ) ? sdDoor.img_a2door_no_matter : sdDoor.img_a2door_no_matter2;
			img_closed = sdDoor.img_a2door_closed;
			img_normal = sdDoor.img_a2door;
		}
		
		if ( this.model === sdDoor.MODEL_FALKOK )
		{
			img_no_matter = sdDoor.img_falkok_door;
			img_closed = sdDoor.img_falkok_door;
			img_normal = sdDoor.img_falkok_door;
		}
		
		let STATE_NO_MATTER = 0;
		let STATE_CLOSED = 1;
		let STATE_NORMAL = 2;
		
		let texture = img_no_matter;
		
		if ( this.x0 === null && this._net_id !== undefined && !sdShop.isDrawing ) // undefined // Client-side doors won't not have any _net_id
		{
			if ( !com_near && this.open_type === sdDoor.OPEN_TYPE_COM_NODE )
			texture = img_no_matter;
			else
			texture = img_closed;
		}
		else
		{
			if ( !com_near && this.open_type === sdDoor.OPEN_TYPE_COM_NODE )
			texture = img_no_matter;
			else
			texture = img_normal;
		}*/
		
		const DrawCap = ()=>
		{
			/*if ( this.w !== 32 || this.h !== 32 )
			{
				if ( this.w < this.h )
				{
					ctx.drawImageFilterCache( texture, 0,0,this.w/2,this.h, -this.w / 2+0.1, -this.h / 2+0.1, this.w/2-0.1,this.h-0.2 );
					ctx.drawImageFilterCache( texture, 32-this.w/2,0,this.w/2,this.h, 0, -this.h / 2+0.1, this.w/2-0.1,this.h-0.2 );
				}
				else
				{
					ctx.drawImageFilterCache( texture, 0,0,this.w,this.h/2, -this.w / 2+0.1, -this.h / 2+0.1, this.w-0.2,this.h/2-0.1 );
					ctx.drawImageFilterCache( texture, 0,32-this.h/2,this.w,this.h/2, -this.w / 2+0.1, 0, this.w-0.2,this.h/2-0.1 );
				}
			}*/
		};
		
		if ( this.openness > 0 )
		if ( !sdWorld.is_server )
		{
			// Do not completely hide door
			let dx = -this.dir_x * 0.1;
			let dy = -this.dir_y * 0.1;
			
			// Prevent z-figthing
			if ( this.dir_y !== 0 )
			dx += ( sdWorld.camera.x < this.x ) ? 0.1 : -0.1;
			else
			dy += ( sdWorld.camera.y < this.y ) ? 0.1 : -0.1;
			
			ctx.translate( dx, dy );
		}
	
		/*if ( texture === img_no_matter )
		{
			ctx.drawImageFilterCache( texture, -this.w / 2, -this.h / 2, this.w,this.h );
			DrawCap();
		}
		else
		{
			ctx.filter = this.filter;
			
			ctx.drawImageFilterCache( texture, -this.w / 2, -this.h / 2, this.w,this.h );
			DrawCap();
			
			ctx.filter = 'none';
		}*/
		
		let xx = 0;
		let yy = this.model - 1;
		
		if ( this.x0 === null && this._net_id !== undefined && !sdShop.isDrawing )
		{
			if ( !com_near && this.open_type === sdDoor.OPEN_TYPE_COM_NODE )
			xx = ( sdWorld.time % 4000 < 2000 ) ? 2 : 3;
			else
			xx = 1;
		}
		else
		{
			if ( !com_near && this.open_type === sdDoor.OPEN_TYPE_COM_NODE )
			xx = ( sdWorld.time % 4000 < 2000 ) ? 2 : 3;
			else
			xx = 0;
		}
		
		let use_filter = ( xx === 0 );
		
		if ( use_filter )
		ctx.filter = this.filter;
	
		if ( this.w === this.h )
		ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32,this.w,this.h, -this.w / 2, -this.h / 2, this.w, this.h );
		else
		{
			let cap_tolerance = 0.01;
			if ( this.w < this.h )
			{
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32,this.w/2,this.h,					-this.w / 2, -this.h / 2,	this.w/2, this.h ); // Left part
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32 + 32-this.w/2,yy*32,this.w/2,this.h,	0, -this.h / 2,				this.w/2, this.h ); // Right part
				
				// Left cap
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32,32,32, -this.w / 2 - cap_tolerance, -this.h / 2, cap_tolerance, this.h );
				
				// Right cap
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32,32,32, this.w / 2, -this.h / 2, cap_tolerance, this.h );
			}
			else
			{
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32,this.w,this.h/2,					-this.w/2, -this.h / 2,	this.w, this.h/2 ); // Top part
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32 + 32-this.h/2,this.w,this.h/2,	-this.w/2, 0,			this.w, this.h/2 ); // Bottom part
				
				// Top cap
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32,32,32,					-this.w/2, -this.h/2 - cap_tolerance,	this.w, cap_tolerance );
				
				// Bottom cap
				ctx.drawImageFilterCache( sdDoor.img_door, xx*32,yy*32,32,32,					-this.w/2, this.h/2,	this.w, cap_tolerance );
			}
		}
		
		if ( use_filter )
		ctx.filter = 'none';
		

		if ( sdBlock.cracks[ this.destruction_frame ] !== null )
		ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], 0,0,this.w,this.h, -this.w / 2, -this.h / 2, this.w,this.h );
		if ( sdDoor.metal_reinforces[ this.reinforced_frame ] !== null )
		ctx.drawImageFilterCache( sdDoor.metal_reinforces[ this.reinforced_frame ], -this.w / 2, -this.h / 2, this.w,this.h );
	}
	
	HandleDestructionUpdate()
	{
		let old_destruction_frame = this.destruction_frame;
		
		if ( this._hea > this._hmax / 4 * 3 )
		this.destruction_frame = 0;
		else
		if ( this._hea > this._hmax / 4 * 2 )
		this.destruction_frame = 1;
		else
		if ( this._hea > this._hmax / 4 * 1 )
		this.destruction_frame = 2;
		else
		this.destruction_frame = 3;
		
		if ( this.destruction_frame !== old_destruction_frame )
		this._update_version++;
	}
	HandleReinforceUpdate()
	{
		let old_reinforced_frame = this.reinforced_frame;
		
		if ( this._reinforced_level === this._max_reinforced_level - 2 )
		this.reinforced_frame = 0;
		else
		if ( this._reinforced_level === this._max_reinforced_level - 1.5 )
		this.reinforced_frame = 1;
		else
		if ( this._reinforced_level === this._max_reinforced_level - 1 )
		this.reinforced_frame = 2;
		else
		if ( this._reinforced_level === this._max_reinforced_level - 0.5 )
		this.reinforced_frame = 3;
		else
		if ( this._reinforced_level === this._max_reinforced_level )
		this.reinforced_frame = 4;
		
		if ( this.reinforced_frame !== old_reinforced_frame )
		this._update_version++;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
		
		//this.DrawConnections( ctx );
	}
	
	onMovementInRange( from_entity )
	{
		//from_entity._net_id
	}
	onRemove()
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity() // Class-specific, if needed
	{
		/*if ( sdWorld.is_server )
		{
			let nears = sdWorld.GetAnythingNear( this.x + 32 / 2, this.y + 32 / 2, Math.max( 32, 32 ) / 2 + 16 );
			for ( let i = 0; i < nears.length; i++ )
			if ( nears[ i ] instanceof sdWater )
			nears[ i ]._sleep_tim = sdWater.sleep_tim_max;
		}*/
						
		if ( this._sensor_area )
		this._sensor_area.remove();

		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'blockB4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdDoor.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,y,a,s;
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			for ( y = step_size / 2; y < 32; y += step_size )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}
		}
	}
}
//sdDoor.init_class();

export default sdDoor;