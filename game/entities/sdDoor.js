
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdCom from './sdCom.js';
import sdWater from './sdWater.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdSensorArea from './sdSensorArea.js';


import sdRenderer from '../client/sdRenderer.js';


class sdDoor extends sdEntity
{
	static init_class()
	{
		sdDoor.img_door = sdWorld.CreateImageFromFile( 'door' );
		sdDoor.img_door_closed = sdWorld.CreateImageFromFile( 'door2' );
		
		sdDoor.img_adoor = sdWorld.CreateImageFromFile( 'adoor' );
		sdDoor.img_adoor_closed = sdWorld.CreateImageFromFile( 'adoor2' );

		sdDoor.img_a2door = sdWorld.CreateImageFromFile( 'a2door' );
		sdDoor.img_a2door_closed = sdWorld.CreateImageFromFile( 'a2door2' );
		
		sdDoor.img_door_path = sdWorld.CreateImageFromFile( 'door_open2' );
		
		sdDoor.img_door_no_matter = sdWorld.CreateImageFromFile( 'door_no_matter' );
		sdDoor.img_door_no_matter2 = sdWorld.CreateImageFromFile( 'door_no_matter2' );
		
		sdDoor.img_adoor_no_matter = sdWorld.CreateImageFromFile( 'adoor_no_matter' ); // Reinforced doors, level 1
		sdDoor.img_adoor_no_matter2 = sdWorld.CreateImageFromFile( 'adoor_no_matter2' );

		sdDoor.img_a2door_no_matter = sdWorld.CreateImageFromFile( 'a2door_no_matter' ); // Reinforced doors, level 2
		sdDoor.img_a2door_no_matter2 = sdWorld.CreateImageFromFile( 'a2door_no_matter2' );
		
		sdDoor.MODEL_BASIC = 1;
		sdDoor.MODEL_ARMORED = 2;
		sdDoor.MODEL_ARMORED_LVL2 = 3;

		sdDoor.metal_reinforces = [ 
			null,
			sdWorld.CreateImageFromFile( 'metal_d_reinforced1' ),
			sdWorld.CreateImageFromFile( 'metal_d_reinforced2' ),
			sdWorld.CreateImageFromFile( 'metal_d_reinforced3' ),
			sdWorld.CreateImageFromFile( 'metal_d_reinforced4' )
		];
		
		sdDoor.ignored_entity_classes = [ 'sdBlock' ];
		sdDoor.ignored_entity_classes_travel = [];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -16; }
	get hitbox_y2() { return 16; }
	
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

	get mass() { return this._reinforced_level > 0 ? 4000 : 100; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = dmg / ( 1 + this._reinforced_level); // Reinforced doors have damage reduction, depending on reinforced level
		
		if ( this._hea > 0 )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
			if ( this._shielded === null || dmg === Infinity || this._shielded._is_being_removed || !this._shielded.enabled || !sdWorld.inDist2D_Boolean( this.x, this.y, this._shielded.x, this._shielded.y, sdBaseShieldingUnit.protect_distance_stretch ) )
			{
				this._hea -= dmg;
			}
			else
			{
				this._shielded.ProtectedEntityAttacked( this, dmg, initiator );
				
				/*sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:0.2 });
				this._shielded.matter_crystal = Math.max( 0, this._shielded.matter_crystal - dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp );

				if ( this._shielded.matter_crystal >= 50000 )
				{
					if ( initiator )
					if ( !initiator._is_being_removed )
					{
						if ( !sdWorld.inDist2D_Boolean( initiator.x, initiator.y, this._shielded.x, this._shielded.y, sdBaseShieldingUnit.protect_distance - 64 ) ) // Check if it is far enough from the shield to prevent players in base take damage
						{
							initiator.DamageWithEffect( 5 );
							sdWorld.SendEffect({ x:this._shielded.x, y:this._shielded.y, x2:this.x + ( this._hitbox_x2 / 2 ), y2:this.y + ( this._hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							sdWorld.SendEffect({ x:this.x + ( this._hitbox_x2 / 2 ), y:this.y + ( this._hitbox_y2 / 2 ), x2:initiator.x, y2:initiator.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
						}
					}
				}*/
			}

			/*if ( this._shielded === null || dmg === Infinity )
			this._hea -= dmg;
			else
			{
				let shield = sdEntity.entities_by_net_id_cache_map.get( this._shielded );
				//console.log( shield );
				if ( shield === undefined ) // If the shielding unit doesn't exist, act as a default entity
				{
					this._hea -= dmg;
					this._shielded = null;
				}
				else
				if ( shield.enabled && !shield._is_being_removed )
				if ( sdWorld.Dist2D( this.x, this.y, shield.x, shield.y ) < sdBaseShieldingUnit.protect_distance )
				{
				}
				else
				{
					this._hea -= dmg;
					this._shielded = null;
				}
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
		
		this._hmax = 550 * 4;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
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
		this._entities_within_sensor_area = [];
		
		this.filter = params.filter;
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_shielded' || prop === '_sensor_area' );
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
		if ( this._entities_within_sensor_area.indexOf( from_entity ) === -1 )
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
				this._entities_within_sensor_area.push( from_entity );
				
				this.Open();
			}
		}
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
	onThink( GSPEED ) // Class-specific, if needed
	{
		//if ( this._reinforced_level > 0 )
		//this._reinforced_level = 0;
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
				
		if ( com_near )
		{
			if ( sdWorld.is_server )
			{
				if ( this._sensor_area && !this._sensor_area._is_being_removed )
				{
					let tx = this.x0 - 32 - 16;
					let ty = this.y0 - 32 - 16;
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
					this._sensor_area = new sdSensorArea({ x: this.x0 - 32 - 16, y: this.y0 - 32 - 16, w: 64 + 32, h: 64 + 32, on_movement_target: this });
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
					let blocks_found_in_direction = 0;

					outer:
					for ( var u = -1; u <= 1; u += 2 )
					for ( var v = -1; v <= 1; v += 2 )
					{
						if ( sdWorld.CheckWallExists( this.x + 8 * u + 32 * xx, this.y + 8 * v + 32 * yy, this, null ) && 
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
					}
				}
			}
			else
			{
				//let ents_near = this.GetAnythingNearCache( this.x0, this.y0, 32, null, null, false );
				/*let ents_near = this._entities_within_sensor_area;
				
				if ( ents_near.length > 0 )
				{
					for ( let i2 = 0; i2 < ents_near.length; i2++ )
					{
						let e = ents_near[ i2 ];

						if ( 
								!e._is_being_removed &&
								//e.x + e._hitbox_x1 &&
								(
									com_near.subscribers.indexOf( e._net_id ) !== -1 || 
									com_near.subscribers.indexOf( e.biometry ) !== -1 || 
									com_near.subscribers.indexOf( e.GetClass() ) !== -1 || 
									( com_near.subscribers.indexOf( '*' ) !== -1 && !e.is_static && e._net_id !== undefined )
								)
							)
						{
							if ( this.opening_tim === 0 )
							this.Sound( 'door_start' );

							this.opening_tim = 15;
							this._update_version++;
							break;// outer;
						}
						else
						{
							ents_near.splice( i2, 1 );
							i2--;
							continue;
						}
					}
				}*/
					
				for ( let i2 = 0; i2 < this._entities_within_sensor_area.length; i2++ )
				{
					let e = this._entities_within_sensor_area[ i2 ];
					
					if ( !e._is_being_removed &&
						 e.x + e._hitbox_x2 >= this._sensor_area.x + this._sensor_area._hitbox_x1 &&
						 e.x + e._hitbox_x1 <= this._sensor_area.x + this._sensor_area._hitbox_x2 &&
						 e.y + e._hitbox_y2 >= this._sensor_area.y + this._sensor_area._hitbox_y1 &&
						 e.y + e._hitbox_y1 <= this._sensor_area.y + this._sensor_area._hitbox_y2
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

				if ( this._entities_within_sensor_area.length > 0 )
				{
					this.Open();
				}


				if ( this.opening_tim > 0 && !this.malfunction )
				{
					if ( this.openness < 32 )
					{
						this.openness = Math.min( 32, this.openness + GSPEED * 2 );
						this.x = this.x0 + this.dir_x * this.openness;
						this.y = this.y0 + this.dir_y * this.openness;
						this._update_version++;

						if ( this.openness === 32 )
						this.Sound( 'door_stop' );
						//sdSound.PlaySound({ name:( ( this.model === sdDoor.MODEL_ARMORED || this.model === sdDoor.MODEL_ARMORED_LVL2 ) ? 'a' : '' ) + 'door_stop', x:this.x, y:this.y, volume:0.5 });
					}
					this.opening_tim = Math.max( 0, this.opening_tim - GSPEED );

					if ( this.opening_tim === 0 )
					{
						this.Sound( 'door_start' );
						//sdSound.PlaySound({ name:( ( this.model === sdDoor.MODEL_ARMORED || this.model === sdDoor.MODEL_ARMORED_LVL2 ) ? 'a' : '' ) + 'door_start', x:this.x, y:this.y, volume:0.5 });
						this._update_version++;
					}
				}
				else
				{
					if ( this.openness > 0 )
					{
						let old_openness = this.openness;
						this.openness = Math.max( 0, this.openness - GSPEED * 2 );

						let new_x = this.x0 + this.dir_x * this.openness;
						let new_y = this.y0 + this.dir_y * this.openness;

						//if ( this.CanMoveWithoutOverlap( new_x, new_y, 0.1 ) ) // Small gap for doors that are placed too close
						if ( this.CanMoveWithoutOverlap( new_x, new_y, 0 ) ) // Small gap for doors that are placed too close
						{
							this.x = new_x;
							this.y = new_y;
							this._update_version++;
						}
						else
						{
							let interrupter1 = sdWorld.last_hit_entity;

							//if ( interrupter1 !== null && sdWorld.last_hit_entity.CanMoveWithoutOverlap( sdWorld.last_hit_entity.x + ( new_x - this.x ), sdWorld.last_hit_entity.y + ( new_y - this.y ), 0.1 ) )  // Small gap for doors that are placed too close (?)
							if ( interrupter1 !== null && sdWorld.last_hit_entity.CanMoveWithoutOverlap( sdWorld.last_hit_entity.x + ( new_x - this.x ), sdWorld.last_hit_entity.y + ( new_y - this.y ), 0 ) )  // Small gap for doors that are placed too close (?)
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

								if ( interrupter1 !== null )
								//if ( ( interrupter1._reinforced_level || 0 ) === 0 )
								interrupter1.Damage( 5 * GSPEED );

								if ( interrupter2 !== null )
								//if ( ( interrupter2._reinforced_level || 0 ) === 0 )
								interrupter2.Damage( 5 * GSPEED );
							}
						}

						if ( this.openness === 0 )
						{
							this.Sound( 'door_stop' );
							//sdSound.PlaySound({ name:( ( this.model === sdDoor.MODEL_ARMORED || this.model === sdDoor.MODEL_ARMORED_LVL2 ) ? 'a' : '' ) + 'door_stop', x:this.x, y:this.y, volume:0.5 });
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
					let ok = false;

					var xx = this.dir_x;
					var yy = this.dir_y;

					let blocks_found_in_direction = 0;

					outer:
					for ( var u = -1; u <= 1; u += 2 )
					for ( var v = -1; v <= 1; v += 2 )
					{
						if ( sdWorld.CheckWallExists( this.x0 + 8 * u + 32 * xx, this.y0 + 8 * v + 32 * yy, this, null ) && 
							 sdWorld.last_hit_entity !== null && sdWorld.last_hit_entity.GetClass() === 'sdBlock' )
						blocks_found_in_direction++;
						else
						break outer;
					}

					if ( blocks_found_in_direction === 4 )
					ok = true;

					if ( !ok )
					{
						this.malfunction = true;
						/*
						this.openness = 0;
						this.x = this.x0;
						this.y = this.y0;
						this._update_version++;

						this.x0 = null; // undefined; // Reinit
						*/
						//this.DamageWithEffect( 5 * GSPEED );
					}
				}

				/*if ( this.openness < 32 )
				this.openness += GSPEED;
				else
				this.openness = 0;

				this._update_version++;*/

				//console.log( this.x, this.y );
			}
			
			if ( this.opening_tim === 0 && this.openness === 0 && !this.malfunction )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
		else
		{
			if ( this._sensor_area )
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
	DrawBG( ctx, attached )
	{
		if ( this.openness > 0 || typeof ctx.FakeStart !== 'undefined' )
		{
			if ( this.x0 === null ) // undefined
			ctx.drawImageFilterCache( sdDoor.img_door_path, -16, -16, 32,32 );
			else
			ctx.drawImageFilterCache( sdDoor.img_door_path, -16 - this.x + this.x0, -16 - this.y + this.y0, 32,32 );
		}
	}
	Draw( ctx, attached )
	{
		let com_near = this.GetComWiredCache() || sdShop.isDrawing;
		
		let img_no_matter = ( sdWorld.time % 4000 < 2000 ) ? sdDoor.img_door_no_matter : sdDoor.img_door_no_matter2;
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
		
		if ( this.x0 === null && this._net_id !== undefined && !sdShop.isDrawing ) // undefined // Client-side doors won't not have any _net_id
		{
			if ( !com_near )
			{
				ctx.drawImageFilterCache( img_no_matter, -16, -16, 32,32 );
			}
			else
			{
				ctx.filter = this.filter;
				ctx.drawImageFilterCache( img_closed, -16, -16, 32,32 );
				ctx.filter = 'none';
			}
		
			if ( sdBlock.cracks[ this.destruction_frame ] !== null )
			ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], -16, -16, 32,32 );
			if ( sdDoor.metal_reinforces[ this.reinforced_frame ] !== null )
			ctx.drawImageFilterCache( sdDoor.metal_reinforces[ this.reinforced_frame ], -16, -16, 32,32 );
		}
		else
		{
			if ( this.openness > 0 )
			{
				//ctx.drawImageFilterCache( sdDoor.img_door_path, -16 - this.x + this.x0, -16 - this.y + this.y0, 32,32 );

				ctx.save();
				
				ctx.beginPath();
				{
					ctx.rect(  -16 - this.x + this.x0, -16 - this.y + this.y0, 32,32 );
					ctx.clip();
					
					if ( !com_near )
					{
						ctx.drawImageFilterCache( img_no_matter, -16, -16, 32,32 );
					}
					else
					{
						ctx.filter = this.filter;
						ctx.drawImageFilterCache( img_normal, -16, -16, 32,32 );
						ctx.filter = 'none';
					}
		
					if ( sdBlock.cracks[ this.destruction_frame ] !== null )
					ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], -16, -16, 32,32 );
					if ( sdDoor.metal_reinforces[ this.reinforced_frame ] !== null )
					ctx.drawImageFilterCache( sdDoor.metal_reinforces[ this.reinforced_frame ], -16, -16, 32,32 );
				}
				ctx.restore();
			}
			else
			{
				if ( !com_near )
				{
					ctx.drawImageFilterCache( img_no_matter, -16, -16, 32,32 );
				}
				else
				{
					ctx.filter = this.filter;
					ctx.drawImageFilterCache( img_normal, -16, -16, 32,32 );
					ctx.filter = 'none';
				}
		
				if ( sdBlock.cracks[ this.destruction_frame ] !== null )
				ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], -16, -16, 32,32 );
				if ( sdDoor.metal_reinforces[ this.reinforced_frame ] !== null )
				ctx.drawImageFilterCache( sdDoor.metal_reinforces[ this.reinforced_frame ], -16, -16, 32,32 );
			}
		}
	
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
	/*DrawConnections( ctx )
	{
		var x0 = this.x0 || this.x;
		var y0 = this.y0 || this.y;
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;

		for ( var i = 0; i < sdEntity.entities.length; i++ )
		if ( sdEntity.entities[ i ].GetClass() === 'sdCom' )
		if ( sdWorld.Dist2D( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, x0, y0 ) < sdCom.retransmit_range )
		//if ( sdWorld.CheckLineOfSight( x0, y0, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) )
		if ( sdWorld.CheckLineOfSight( x0, y0, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, null, sdCom.com_visibility_unignored_classes ) )
		{
			ctx.beginPath();
			ctx.moveTo( sdEntity.entities[ i ].x - this.x, sdEntity.entities[ i ].y - this.y );
			ctx.lineTo( x0 - this.x, y0 - this.y );
			ctx.stroke();
		}

		ctx.beginPath();
		ctx.arc( x0 - this.x, y0 - this.y, sdCom.retransmit_range, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}*/
	onMovementInRange( from_entity )
	{
		//from_entity._net_id
		
		/*
		if ( !from_entity.is_static )
		if ( from_entity.GetClass() !== 'sdEffect' )
		if ( from_entity.GetClass() !== 'sdGun' || from_entity._held_by === null )
		{	
			let nearbies = sdWorld.GetAnythingNear( this.x, this.y, sdCom.retransmit_range );
			
			let best_tele = null;
			let best_di = -1;
			for ( var i = 0; i < nearbies.length; i++ )
			{
				if ( nearbies[ i ].GetClass() === 'sdDoor' )
				{
					let tele = nearbies[ i ];
					if ( tele.delay === 0 ) // is active
					if ( tele !== this )
					{
						let di = sdWorld.Dist2D( this.x, this.y, tele.x, tele.y );
						if ( di < best_di || best_tele === null )
						{
							if ( from_entity.CanMoveWithoutOverlap( from_entity.x + best_tele.x - this.x, from_entity.x + best_tele.y - this.y, 1 ) )
							{
								best_tele = tele;
								best_di = di;
							}
						}
					}
				}
			}
			
			if ( best_tele )
			{
				this.SetDelay( 90 );
				best_tele.SetDelay( 90 );
				
				from_entity.x += best_tele.x - this.x;
				from_entity.y += best_tele.y - this.y;
			}
		}*/
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
			sdSound.PlaySound({ name:'block4', 
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