
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdBG from './sdBG.js';
import sdDoor from './sdDoor.js';
import sdGun from './sdGun.js';
import sdCharacter from './sdCharacter.js';
import sdBullet from './sdBullet.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdDeepSleep from './sdDeepSleep.js';
import sdCrystal from './sdCrystal.js';
import sdGib from './sdGib.js';
import sdTimer from './sdTimer.js';
import sdShark from './sdShark.js';

import sdRenderer from '../client/sdRenderer.js';


class sdWater extends sdEntity
{
	static init_class()
	{
		sdWater.TYPE_WATER = 0;
		sdWater.TYPE_ACID = 1;
		sdWater.TYPE_LAVA = 2;
		sdWater.TYPE_TOXIC_GAS = 3;
		sdWater.TYPE_ESSENCE = 4;
		sdWater.TYPE_ANTIMATTER = 5;
		sdWater.reference_colors = [ '#518ad1', '#00ba01', '#ff8600', '#a277a2', '#b0ffff', '#040408' ]; // For liquid carrier recolors
		
		sdWater.damage_by_type = [ 0, 1, 5, 0, 0, 0 ];
		sdWater.never_sleep_by_type = [ 0, 0, 0, 1, 0, 0 ];
		//sdWater.can_sleep_if_has_entities = [ 1, 0, 0, 0 ];
		
		sdWater.DEBUG = false;
		
		sdWater.classes_to_interact_with = [ 'sdBlock', 'sdDoor' ];
		sdWater.water_class_array = [ 'sdWater' ];
		
		sdWater.img_water_flow = sdWorld.CreateImageFromFile( 'water_flow' );
		sdWater.img_lava = sdWorld.CreateImageFromFile( 'lava2' );
		sdWater.img_essence = sdWorld.CreateImageFromFile( 'essence' );
		
		sdWater.all_swimmers = new Map(); // swimming sdEntity -> sdWater where it swims // Prevent multiple damage water objects from applying damage onto same entity. Also handles more efficient is_in_water checks for entities
		sdWater.all_swimmers_previous_frame_exit = new Set();
		sdWater.all_swimmers_previous_frame_exit_swap = new Set();
		
		sdWater.all_waters = []; // Only for client-side
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return ( this.type === sdWater.TYPE_TOXIC_GAS ) ? 0 : 16 - this.v / 100 * 16; }
	get hitbox_y2() { return 16; }
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	
	IsTargetable( by_entity ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( by_entity )
		if ( by_entity.is( sdBullet ) )
		if ( by_entity._admin_picker )
		return true;
	
		return false;
	}
	
	DrawIn3D()
	{ return ( this.type === sdWater.TYPE_LAVA ) ? FakeCanvasContext.DRAW_IN_3D_BOX : FakeCanvasContext.DRAW_IN_3D_LIQUID; }
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		return [ 0, 0, 0.01 ]; // 0, 0.01, 0.01 was good until I added sdBlock offset that hides seam on high visual settings
	}
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		if ( this.type === sdWater.TYPE_WATER )
		return 'Water';
		if ( this.type === sdWater.TYPE_ACID )
		return 'Acid';
		if ( this.type === sdWater.TYPE_LAVA )
		return 'Lava';
		if ( this.type === sdWater.TYPE_TOXIC_GAS )
		return 'Toxic gas';
		if ( this.type === sdWater.TYPE_ESSENCE )
		return 'Essence';
		if ( this.type === sdWater.TYPE_ANTIMATTER )
		return 'Anti-matter';
	
		return 'Liquid ' + this.type;
	}
	
	constructor( params )
	{
		if ( params.tag )
		{
			if ( params.tag === 'water' )
			params.type = sdWater.TYPE_WATER;
		
			if ( params.tag === 'lava' )
			params.type = sdWater.TYPE_LAVA;
		
			if ( params.tag === 'acid' )
			params.type = sdWater.TYPE_ACID;
		
			if ( params.tag === 'toxic' )
			params.type = sdWater.TYPE_TOXIC_GAS;
			
			if ( params.tag === 'essence' )
			params.type = sdWater.TYPE_ESSENCE;
			
			if ( params.tag === 'antimatter' )
			params.type = sdWater.TYPE_ANTIMATTER;
			
			params.x = Math.floor( params.x / 16 ) * 16;
			params.y = Math.floor( params.y / 16 ) * 16;
		}
		
		super( params );
		
		this.type = params.type || sdWater.TYPE_WATER;
		
		this._volume = params.volume || params._volume || 1;
		
		/*this.extra = 0;
		if ( this.type === sdWater.TYPE_ESSENCE )
		{
			if ( typeof params.extra === 'undefined' )
			this.extra = ~~( Math.min( 40 / Math.random(), 40960 ) ); // Should this property be public? Snapshot generation might ignore this property if one sdWater enitites won't have it (value could be reset on world snapshot save/load because of that). Having this property as public (without underscore _ ) will cause extra performance degradation since game will send it for any water object
			else
			this.extra = params.extra;
		}*/
		
		this._spawn_time = sdWorld.time;
		
		if ( sdWater.DEBUG )
		{
			this.a = false; // awakeness for client, for debugging
			this.d = ''; // Debug info
		}
		
		this.v = 100; // rounded volume for clients
		
		this._client_y = 0;
		this._client_vel = 0; // Client-side velocity as part of reaction to items moving in water
		this._client_flow_y = this.y;
		
		this._sy = 0; // How fast it flows down
		
		this._swimmers = new Set();
		
		this._think_offset = ~~( Math.random() * 16 );
		
		//this._stack_trace = globalThis.getStackTrace();
		
		if ( sdWorld.is_server )
		//if ( 0 ) // Hack
		{
			
			// Remove existing water, just in case
			let arr_under = sdWorld.RequireHashPosition( this.x, this.y ).arr;
		
			for ( var i = 0; i < arr_under.length; i++ )
			{
				if ( arr_under[ i ] instanceof sdWater )
				if ( arr_under[ i ].x === this.x && arr_under[ i ].y === this.y )
				if ( arr_under[ i ] !== this )
				{
					//trace( 'Overlapping with existing block, previously made at ', arr_under[ i ]._stack_trace );
					//debugger;
					
					arr_under[ i ]._volume = Math.min( 1, arr_under[ i ]._volume + this._volume );
					arr_under[ i ].v = Math.ceil( arr_under[ i ]._volume * 100 );
					
					this.remove();
				}
			}
			
			
			// Do this manually instead - it interferes with sdDeepSleep
			//sdWorld.UpdateHashPosition( this, false ); // Without this, new water objects will only discover each other after one first think event (and by that time multiple water objects will overlap each other). This could be called at sdEntity super constructor but some entities don't know their bounds by that time
		}
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			sdWater.all_waters.push( this );
		}
	}
	
	
	MeasureMatterCost()
	{
		// hack
		//return 0;
		
		return 5;
	}
	
	static GetWaterObjectAt( nx, ny, type=-1 ) // for visuals, also for chain-awake. Also for liquid carrier guns
	{
		if ( nx >= sdWorld.world_bounds.x2 || nx <= sdWorld.world_bounds.x1 || 
			 ny >= sdWorld.world_bounds.y2 || ny <= sdWorld.world_bounds.y1 )
		return null;
	
		let arr_under = sdWorld.RequireHashPosition( nx, ny ).arr;
		
		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ]._is_bg_entity === 10 )
			{
				//arr_under[ i ].WakeUpArea();
				return null; // Let's not wake up water from hibernated/no-existing cells...
			}
			else
			//if ( arr_under[ i ] instanceof sdWater )
			if ( arr_under[ i ].is( sdWater ) )// instanceof sdWater )
			//if ( arr_under[ i ].x === nx && arr_under[ i ].y === ny )
			if ( nx >= arr_under[ i ].x && nx < arr_under[ i ].x + 16 && 
				 ny >= arr_under[ i ].y && ny < arr_under[ i ].y + 16 )
			if ( !arr_under[ i ]._is_being_removed )
			if ( type === -1 || arr_under[ i ].type === type )
			return arr_under[ i ];
		}
		
		return null;
	}
				
	
	AwakeSelfAndNear( recursive_catcher=null ) // Might need array for recursion
	{
		if ( recursive_catcher === null )
		recursive_catcher = [ this ];
		else
		{
			if ( recursive_catcher.indexOf( this ) !== -1 )
			return;
		
			recursive_catcher.push( this );
		}
		
		//if ( this._hiberstate !== sdEntity.HIBERSTATE_ACTIVE )
		{

			//this._sleep_tim = sdWater.sleep_tim_max;
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			let e;

			for ( var x = -1; x <= 1; x++ )
			for ( var y = -1; y <= 1; y++ )
			if ( x !== 0 || y !== 0 )
			{
				e = sdWater.GetWaterObjectAt( this.x + x * 16, this.y + y * 16 );
				if ( e )
				if ( e._hiberstate !== sdEntity.HIBERSTATE_ACTIVE ) // Make sure it is not already active?
				e.AwakeSelfAndNear( recursive_catcher );
			}
		}
		/*
		e = sdWater.GetWaterObjectAt( this.x, this.y - 16 );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
	
		e = sdWater.GetWaterObjectAt( this.x - 16, this.y );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
	
		e = sdWater.GetWaterObjectAt( this.x + 16, this.y );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
	
		e = sdWater.GetWaterObjectAt( this.x, this.y + 16 );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
		*/
	}
	
	BlendWith( another )
	{
		if ( another.is( sdWater ) )
		{
			if ( ( another.type === sdWater.TYPE_TOXIC_GAS ) !== ( this.type === sdWater.TYPE_TOXIC_GAS ) )
			{
				if ( this.type === sdWater.TYPE_TOXIC_GAS )
				{
					this.remove();
					return true;
				}
				if ( another.type === sdWater.TYPE_TOXIC_GAS )
				{
					another.remove();
					return false;
				}
			}
			
			if ( ( another.type === sdWater.TYPE_LAVA ) !== ( this.type === sdWater.TYPE_LAVA ) )
			{
				let v = Math.max( this._volume, another._volume ) * 16;
				
				v = Math.ceil( v ); // Players would slide and teleport due to rounding errors
				
				let ent = sdEntity.Create( sdBlock, { 
					x: another.x, 
					y: another.y + 16 - v, 
					width: 16, 
					height: v,
					material: sdBlock.MATERIAL_GROUND,
					contains_class: null,
					filter: 'saturate(0) brightness(0.3)',
					natural: true,
					plants: null
					//filter: 'hue-rotate('+(~~(Math.sin( ( Math.min( from_y, sdWorld.world_bounds.y2 - 256 ) - y ) * 0.005 )*360))+'deg)' 
				});
				let hp_mult = 6;
				ent._hea *= hp_mult;
				ent._hmax *= hp_mult;
				//sdEntity.entities.push( ent );

				this.remove();
				another.remove();

				return true; // Delete both
			}
			
			/*if ( another.type === sdWater.TYPE_ESSENCE && this.type === sdWater.TYPE_ESSENCE )
			if ( typeof another.extra !== 'undefined' && typeof this.extra !== 'undefined' )
			{
				if ( Math.round( another.extra / 80 ) !== Math.round( this.extra / 80 ) )
				{
					let extra = Math.round( ( another.extra + this.extra ) / 2 );

					another.extra = extra;
					another._update_version++;

					this.extra = extra;
					this._update_version++;
				}
				return false;
			}*/
			
			if ( another.type === this.type || 
				 ( Math.min( another.type, this.type ) === sdWater.TYPE_WATER && Math.max( another.type, this.type ) === sdWater.TYPE_ACID ) // Let acid blend with water
			)
			{
				if ( another.type !== this.type )
				{
					// Volume-based blend
					
					let morph = this._volume / ( this._volume + another._volume );
					
					let new_type = ( morph < 0.4 + Math.random() * 0.2 ) ? this.type : another.type;
					
					if ( another.type !== new_type )
					{
						another.type = new_type;
						another._update_version++;
						another.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
					if ( this.type !== new_type )
					{
						this.type = new_type;
						this._update_version++;
						//this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
				}
				
				if ( this._volume + another._volume <= 1 )
				{
					another._volume += this._volume;
					another.v = Math.ceil( another._volume * 100 );
					another._update_version++;
					another.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					
					//trace( 'Adding whole value of falling block to the block below' );
					
					this.AwakeSelfAndNear();
					this.remove();
					return true;
				}
				else
				{
					if ( another._volume < 1 )
					{
						let delta = 1 - another._volume;
						
						another._volume = 1;
						another.v = Math.ceil( another._volume * 100 );
						another._update_version++;
						another.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						
						this._volume -= delta;
						this.v = Math.ceil( this._volume * 100 );
						
						//trace( 'Filling block below by the cost of falling block' );
						
						if ( this._volume <= 0 )
						debugger;
					}
					else
					{
						//trace( 'Considering block under as solid since it is full' );
					}
				}
			}
		}
		return false;
	}
	
	TrySleep()
	{
		if ( !sdWater.never_sleep_by_type[ this.type ] )
		{
			let can_sleep = true;
			
			both:
			for ( const e of this._swimmers )
			{
				let arr = sdStatusEffect.entity_to_status_effects.get( e );
				
				if ( arr !== undefined )
				{
					for ( let i = 0; i < arr.length; i++ )
					if ( arr[ i ].type === sdStatusEffect.TYPE_TEMPERATURE )
					{
						can_sleep = false;
						break both;
					}
				}
			}
			/*
			this._swimmers.forEach( ( e )=>
			{
			});*/
			
			//if ( this._swimmers.size === 0 )
			if ( can_sleep )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}

	// For flow only
	CanCollideWithEntity( e, this_x, this_y )
	{
		return (
					( e._is_bg_entity === this._is_bg_entity || e._is_bg_entity === 10 ) && // 10 is sdDeepSleep
					e.x + e._hitbox_x1 < this_x + 16 &&
					e.x + e._hitbox_x2 > this_x &&
					e.y + e._hitbox_y1 < this_y + 16 &&
					e.y + e._hitbox_y2 > this_y &&
					!e._is_being_removed && 
					( e.is( sdWater ) || ( e.is( sdBlock ) && !e.IsLetsLiquidsThrough() ) || e.is( sdDoor ) || ( e.is( sdDeepSleep ) && e.ThreatAsSolid() ) )
				);
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._swimmers.size > 0 ) // Will be empty for water
		{
			//if ( this.type === sdWater.TYPE_LAVA || this.type === sdWater.TYPE_ACID )
			{
				let effect_once = true;
				
				this._swimmers.forEach( ( e )=>
				{
					if ( e.x + e._hitbox_x2 >= this.x + this._hitbox_x1 &&
 						 e.x + e._hitbox_x1 <= this.x + this._hitbox_x2 &&
 						 e.y + e._hitbox_y2 >= this.y + this._hitbox_y1 &&
 						 e.y + e._hitbox_y1 <= this.y + this._hitbox_y2 &&
						 !e._is_being_removed )
					{
						if ( !sdWorld.is_server || sdWorld.is_singleplayer )
						{
							if ( this.type === sdWater.TYPE_LAVA )
							if ( !e.isFireAndAcidDamageResistant() )
							{
								if ( effect_once )
								{
									effect_once = false;
									
									if ( Math.random() < 0.3 )
									{
										let ent = new sdEffect({ x: e.x, y: this.y, type:sdEffect.TYPE_GLOW_HIT, color:'#FFAA33' });
										sdEntity.entities.push( ent );
									}
								}
							}
						}
						
						if ( sdWorld.is_server )
						{
							let e_is_organic = ( ( e.IsPlayerClass() || e.GetBleedEffect() === sdEffect.TYPE_BLOOD || e.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN ) );
							
							if ( this.type === sdWater.TYPE_TOXIC_GAS )
							{
								if ( e.is( sdCharacter ) )
								{
									e._sickness += 0.5 * GSPEED * this._volume;
								}
								else
								if ( e_is_organic )
								{
									e.DamageWithEffect( 0.5 * GSPEED * this._volume, this );
								}
							}
							if ( sdWater.damage_by_type[ this.type ] !== 0 )
							if ( this.type === sdWater.TYPE_LAVA || ( this.type === sdWater.TYPE_ACID && e_is_organic ) )
							if ( !e.isFireAndAcidDamageResistant() )
							//if ( e.Damage !== sdEntity.prototype.Damage )
							{
								e.DamageWithEffect( sdWater.damage_by_type[ this.type ] * GSPEED ); 
								
								if ( this.type === sdWater.TYPE_LAVA )
								e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t: 100 * GSPEED });
							}

							if ( this.type === sdWater.TYPE_ACID || this.type === sdWater.TYPE_WATER )
							e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, target_value:sdStatusEffect.temperature_normal, remain_part: 0.8, GSPEED:GSPEED }); // Neutralize hot values, cold too really, unless target temperature isn't ice by itself
						}
					}
					else
					{
						this._swimmers.delete( e );
						sdWater.all_swimmers.delete( e );
						
						sdWater.all_swimmers_previous_frame_exit.add( e );
					}
				});
			}
		}
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			let capped_GSPEED = Math.min( 1, GSPEED );
			
			if ( this._client_vel > 1 )
			this._client_vel = 1;
			else
			if ( this._client_vel < -1 )
			this._client_vel = -1;
	
			this._client_vel = sdWorld.MorphWithTimeScale( this._client_vel, 0, 0.9, GSPEED );
			this._client_y += this._client_vel * capped_GSPEED;
			
			
			this._client_vel -= this._client_y * 0.5 * capped_GSPEED;
			let w2 = sdWater.GetWaterObjectAt( this.x - 16, this.y );
			if ( w2 )
			w2._client_vel += this._client_y * 0.1 * capped_GSPEED;
			let w3 = sdWater.GetWaterObjectAt( this.x + 16, this.y );
			if ( w3 )
			w3._client_vel += this._client_y * 0.1 * capped_GSPEED;
			
			
			
			
			
			if ( this._client_y > 8 )
			this._client_y = 8;
			else
			if ( this._client_y < -8 )
			this._client_y = -8;
			
			if ( this.type === sdWater.TYPE_LAVA )
			if ( Math.random() < 0.05 )
			{
				let x = this._hitbox_x1 + ( this._hitbox_x2 - this._hitbox_x1 ) * Math.random();
				let y = this._hitbox_y1 + ( this._hitbox_y2 - this._hitbox_y1 ) * Math.random();
				let a = Math.random() * 2 * Math.PI;
				let s = Math.random() * 1;
				let ent;
				
				if ( Math.random() < 0.1 )
				{
					ent = new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_GIB_GREEN, sx: Math.sin(a)*s, sy: Math.cos(a)*s, filter:'hue-rotate(-90deg) saturate(1.5)' });
					sdEntity.entities.push( ent );
				}
				
				ent = new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_BLOOD_GREEN, sx: Math.sin(a)*s, sy: Math.cos(a)*s, filter:'hue-rotate(-90deg) saturate(1.5)' });
				sdEntity.entities.push( ent );
			}
			
			if ( this.type === sdWater.TYPE_ESSENCE ) // Apparently water entites are removed before this can execute on client most of the time
			{
				if ( this._volume > 0 )
				for ( let i = 0; i < Math.ceil( this._volume * 4 ); i++ )
				{
					let ent = new sdEffect({ x: this.x + Math.random() * this.hitbox_x2, y: this.y + Math.random() * ( this.hitbox_y2 - this.hitbox_y1 ), sy:-2, type:sdEffect.TYPE_GLOW_HIT, color:sdWater.reference_colors[ this.type ] });
					sdEntity.entities.push( ent );
				}

				this.v = 0;
			}
		}
		
		if ( !sdWorld.is_server )
		return;
	
	
		if ( sdWater.DEBUG )
		{
			let d = this._volume + '';

			if ( d !== this.d )
			{
				this.d = d;
				this._update_version++;
			}
		}
		
		
	
		if ( sdWorld.is_server )
		{
			if ( this.type === sdWater.TYPE_TOXIC_GAS )
			{
				this._volume = Math.max( this._volume - GSPEED * 0.001 );
				if ( this._volume <= 0 )
				{
					this.remove();
					return;
				}
			}
			else
			if ( this.type === sdWater.TYPE_ANTIMATTER ) // Explodes if ever placed/spawned
			{
				sdWorld.SendEffect({ 
					x:this.x + this.hitbox_x2 / 2, 
					y:this.y + this.hitbox_y2 / 2, 
					radius:this._volume * 100,
					damage_scale: this._volume * 4,
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:sdWater.reference_colors[ sdWater.TYPE_ANTIMATTER ]
				});
				
				this.remove();
				return;
			}
			else
			if ( this.type === sdWater.TYPE_ESSENCE ) // Will just be removed for now so .extra isn't needed. Players don't really have much reason to place essence outside of liquid containers anyway
			{
				this.remove();
				return;
			}
		}

		if ( this.v !== Math.ceil( this._volume * 100 ) )
		{
			this.v = Math.ceil( this._volume * 100 );
			this._update_version++;
		}
	
		if ( this.type === sdWater.TYPE_TOXIC_GAS )
		this._sy += sdWorld.gravity * GSPEED * 0.005;
		else
		this._sy += sdWorld.gravity * GSPEED * 0.5;
	
		//this._think_offset -= Math.min( 16, Math.max( this._sy, 1 ) );
		this._think_offset -= Math.min( 16, Math.max( this._sy, 0.0001 ) );
		
		if ( this._think_offset < 0 )
		{
			this._think_offset += 16;
			GSPEED *= 16;
		}
		else
		return;
	
		var arr = sdWorld.RequireHashPosition( this.x + 8, this.y + 8 + 16 ).arr;
		/*for ( var i = 0; i < arr.length; i++ )
		{
			if ( arr[ i ].is( sdBlock ) || arr[ i ].is( sdDoor ) )
			if ( arr[ i ].x + arr[ i ]._hitbox_x1 < this.x + 16 )
			if ( arr[ i ].x + arr[ i ]._hitbox_x2 > this.x )
			if ( arr[ i ].y + arr[ i ]._hitbox_y1 < this.y + 16 + 16 )
			if ( arr[ i ].y + arr[ i ]._hitbox_y2 > this.y + 16 )
			{
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
				return;
			}
		}*/
						
		for ( var i = 0; i < arr.length; i++ )
		{
			/*if ( arr[ i ].x + arr[ i ]._hitbox_x1 < this.x + 16 )
			if ( arr[ i ].x + arr[ i ]._hitbox_x2 > this.x )
			if ( arr[ i ].y + arr[ i ]._hitbox_y1 < this.y + 16 + 16 )
			if ( arr[ i ].y + arr[ i ]._hitbox_y2 > this.y + 16 )*/
			//if ( this !== arr[ i ] )
			//if ( arr[ i ].is( sdWater ) || ( arr[ i ].is( sdBlock ) && !arr[ i ].IsLetsLiquidsThrough() ) || arr[ i ].is( sdDoor ) || ( arr[ i ].is( sdDeepSleep ) && arr[ i ].ThreatAsSolid() ) )
			if ( this.CanCollideWithEntity( arr[ i ], this.x, this.y + 16 ) )
			{
				if ( this.BlendWith( arr[ i ] ) )
				return;
				
				let can_flow_down_left = true;
				let can_flow_down_right = true;
				
				if ( this.y + 16 >= sdWorld.world_bounds.y2 )
				{
					can_flow_down_left = false;
					can_flow_down_right = false;
				}
				else
				{
					let down_left = sdWorld.RequireHashPosition( this.x + 8 - 16, this.y + 8 + 16 ).arr;
					let down_right = sdWorld.RequireHashPosition( this.x + 8 + 16, this.y + 8 + 16 ).arr;

					for ( let i2 = 0; i2 < down_left.length; i2++ )
					//if ( down_left[ i2 ].is( sdWater ) || ( down_left[ i2 ].is( sdBlock ) && !down_left[ i2 ].IsLetsLiquidsThrough() ) || down_left[ i2 ].is( sdDoor ) || ( down_left[ i2 ].is( sdDeepSleep ) && down_left[ i2 ].ThreatAsSolid() ) )
					if ( this.CanCollideWithEntity( down_left[ i2 ], this.x - 16, this.y + 16 ) )
					//if ( down_left[ i2 ].x + down_left[ i2 ]._hitbox_x1 < this.x + 16 - 16 )
					//if ( down_left[ i2 ].x + down_left[ i2 ]._hitbox_x2 > this.x - 16 )
					//if ( down_left[ i2 ].y + down_left[ i2 ]._hitbox_y1 < this.y + 16 + 16 )
					//if ( down_left[ i2 ].y + down_left[ i2 ]._hitbox_y2 > this.y + 16 )
					{
						if ( this.BlendWith( down_left[ i2 ] ) )
						return;

						can_flow_down_left = false;
						break;
					}

					for ( let i2 = 0; i2 < down_right.length; i2++ )
					//if ( down_right[ i2 ].is( sdWater ) || ( down_right[ i2 ].is( sdBlock ) && !down_right[ i2 ].IsLetsLiquidsThrough() ) || down_right[ i2 ].is( sdDoor ) || ( down_right[ i2 ].is( sdDeepSleep ) && down_right[ i2 ].ThreatAsSolid() ) )
					if ( this.CanCollideWithEntity( down_right[ i2 ], this.x + 16, this.y + 16 ) )
					//if ( down_right[ i2 ].x + down_right[ i2 ]._hitbox_x1 < this.x + 16 + 16 )
					//if ( down_right[ i2 ].x + down_right[ i2 ]._hitbox_x2 > this.x + 16 )
					//if ( down_right[ i2 ].y + down_right[ i2 ]._hitbox_y1 < this.y + 16 + 16 )
					//if ( down_right[ i2 ].y + down_right[ i2 ]._hitbox_y2 > this.y + 16 )
					{
						if ( this.BlendWith( down_right[ i2 ] ) )
						return;

						can_flow_down_right = false;
						break;
					}

					if ( can_flow_down_left )
					if ( this.x - 16 < sdWorld.world_bounds.x1 )
					can_flow_down_left = false;

					if ( can_flow_down_right )
					if ( this.x + 16 >= sdWorld.world_bounds.x2 )
					can_flow_down_right = false;
				}
					
				if ( can_flow_down_left )
				{
					let catcher = [];
					this.AwakeSelfAndNear( catcher );
					
					this.x -= 16;
					this.y += 16;
					this._sy *= 0.2;
					this._update_version++;
					sdWorld.UpdateHashPosition( this, false );
					
					this.AwakeSelfAndNear( catcher );
					return;
				}
				else
				if ( can_flow_down_right )
				{
					let catcher = [];
					this.AwakeSelfAndNear( catcher );
					
					this.x += 16;
					this.y += 16;
					this._sy *= 0.2;
					this._update_version++;
					sdWorld.UpdateHashPosition( this, false );
					
					this.AwakeSelfAndNear( catcher );
					return;
				}
				else
				{
					// And now try to flow horizontally
					
					//let can_flow_down = true;
					let can_flow_left = true;
					let can_flow_right = true;
					
					//let down_ent = null;
					let left_ent = null;
					let right_ent = null;
					
					let subtract = GSPEED * 0.01; // 0.01
					
					if ( this._volume - subtract < 0.2 )
					subtract = this._volume - 0.2;
				
					/*let down = sdWorld.RequireHashPosition( this.x + 8, this.y + 8 + 16 ).arr;
					for ( let i2 = 0; i2 < down.length; i2++ )
					//if ( left[ i2 ].is( sdWater ) || ( left[ i2 ].is( sdBlock ) && !left[ i2 ].IsLetsLiquidsThrough() ) || left[ i2 ].is( sdDoor ) || ( left[ i2 ].is( sdDeepSleep ) && left[ i2 ].ThreatAsSolid() ) )
					if ( this.CanCollideWithEntity( down[ i2 ], throw new Error() ) )
					if ( down[ i2 ].x + down[ i2 ]._hitbox_x1 < this.x + 16 - 16 )
					if ( down[ i2 ].x + down[ i2 ]._hitbox_x2 > this.x - 16 )
					if ( down[ i2 ].y + down[ i2 ]._hitbox_y1 < this.y + 16 + 16 )
					if ( down[ i2 ].y + down[ i2 ]._hitbox_y2 > this.y + 16 )
					{
						//if ( this.BlendWith( left[ i2 ] ) )
						//return;

						down_ent = down[ i2 ];

						can_flow_left = false;
						break;
					}*/

					if ( subtract <= 0 || this.type === sdWater.TYPE_ESSENCE ) // Don't go down 10%. Also Essence does not implement BlendWith like other liquids do so far. The .extra property is also could cause some issues
					{
						can_flow_left = false;
						can_flow_right = false;
					}
					else
					{
						let left = sdWorld.RequireHashPosition( this.x + 8 - 16, this.y + 8 ).arr;
						let right = sdWorld.RequireHashPosition( this.x + 8 + 16, this.y + 8 ).arr;

						for ( let i2 = 0; i2 < left.length; i2++ )
						//if ( left[ i2 ].is( sdWater ) || ( left[ i2 ].is( sdBlock ) && !left[ i2 ].IsLetsLiquidsThrough() ) || left[ i2 ].is( sdDoor ) || ( left[ i2 ].is( sdDeepSleep ) && left[ i2 ].ThreatAsSolid() ) )
						if ( this.CanCollideWithEntity( left[ i2 ], this.x - 16, this.y ) )
						/*if ( left[ i2 ].x + left[ i2 ]._hitbox_x1 < this.x + 16 - 16 )
						if ( left[ i2 ].x + left[ i2 ]._hitbox_x2 > this.x - 16 )
						if ( left[ i2 ].y + left[ i2 ]._hitbox_y1 < this.y + 16 + 16 )
						if ( left[ i2 ].y + left[ i2 ]._hitbox_y2 > this.y + 16 )*/
						{
							//if ( this.BlendWith( left[ i2 ] ) )
							//return;
						
							left_ent = left[ i2 ];

							can_flow_left = false;
							
							if ( left_ent._class_id !== this._class_id ) // Try to find newly built walls so they can stop the flow
							break;
						}

						for ( let i2 = 0; i2 < right.length; i2++ )
						//if ( right[ i2 ].is( sdWater ) || ( right[ i2 ].is( sdBlock ) && !right[ i2 ].IsLetsLiquidsThrough() ) || right[ i2 ].is( sdDoor ) || ( right[ i2 ].is( sdDeepSleep ) && right[ i2 ].ThreatAsSolid() ) )
						if ( this.CanCollideWithEntity( right[ i2 ], this.x + 16, this.y ) )
						/*if ( right[ i2 ].x + right[ i2 ]._hitbox_x1 < this.x + 16 + 16 )
						if ( right[ i2 ].x + right[ i2 ]._hitbox_x2 > this.x + 16 )
						if ( right[ i2 ].y + right[ i2 ]._hitbox_y1 < this.y + 16 + 16 )
						if ( right[ i2 ].y + right[ i2 ]._hitbox_y2 > this.y + 16 )*/
						{
							//if ( this.BlendWith( right[ i2 ] ) )
							//return;
						
							right_ent = right[ i2 ];

							can_flow_right = false;
							
							if ( right_ent._class_id !== this._class_id ) // Try to find newly built walls so they can stop the flow
							break;
						}

						if ( can_flow_left )
						if ( this.x - 16 < sdWorld.world_bounds.x1 )
						can_flow_left = false;

						if ( can_flow_right )
						if ( this.x + 16 >= sdWorld.world_bounds.x2 )
						can_flow_right = false;
					}

					if ( can_flow_left )
					{
						//trace( 'Flow new block to left' );
						this._volume -= subtract;
						this.v = Math.ceil( this._volume * 100 );
						this._update_version++;
						
						let water_ent = new sdWater({ x:this.x - 16, y:this.y, type: this.type });
						water_ent._volume = subtract;
						water_ent.v = Math.ceil( water_ent._volume * 100 );
						sdEntity.entities.push( water_ent );
						sdWorld.UpdateHashPosition( water_ent, false );
						
						this.AwakeSelfAndNear();
					}
					else
					if ( can_flow_right )
					{
						//trace( 'Flow new block to right' );
						this._volume -= subtract;
						this.v = Math.ceil( this._volume * 100 );
						this._update_version++;
						
						let water_ent = new sdWater({ x:this.x + 16, y:this.y, type: this.type });
						water_ent._volume = subtract;
						water_ent.v = Math.ceil( water_ent._volume * 100 );
						sdEntity.entities.push( water_ent );
						sdWorld.UpdateHashPosition( water_ent, false );
						
						this.AwakeSelfAndNear();
					}
					else
					if ( subtract > 0 && left_ent && left_ent._class_id === this._class_id && left_ent.type === this.type && left_ent._volume < this._volume - subtract )
					{
						//trace( 'Flow portion of self to left existing block' );
						
						subtract = Math.min( subtract, 1 - left_ent._volume );
						
						left_ent._volume += subtract;
						this._volume -= subtract;
						
						this.v = Math.ceil( this._volume * 100 );
						left_ent.v = Math.ceil( left_ent._volume * 100 );
						
						left_ent._update_version++;
						this._update_version++;
						
						left_ent.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
					else
					if ( subtract > 0 && right_ent && right_ent._class_id === this._class_id && right_ent.type === this.type && right_ent._volume < this._volume - subtract )
					{
						//trace( 'Flow portion of self to right existing block' );
						
						subtract = Math.min( subtract, 1 - right_ent._volume );
						
						right_ent._volume += subtract;
						this._volume -= subtract;
						
						this.v = Math.ceil( this._volume * 100 );
						right_ent.v = Math.ceil( right_ent._volume * 100 );
						
						right_ent._update_version++;
						this._update_version++;
						
						right_ent.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
					else
					{
						this.TrySleep();
					}

					this._sy = 0;
					return;
				}
			}
		}
		
		
		
		
		if ( this.y + 16 >= sdWorld.world_bounds.y2 )
		{
			this.TrySleep();
			/*if ( !sdWater.never_sleep_by_type[ this.type ] )
			if ( this._swimmers.size === 0 )//|| sdWater.can_sleep_if_has_entities[ this.type ] )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );*/
		
			this._sy = 0;
			return;
		}
		else
		{
			let catcher = [];
			this.AwakeSelfAndNear( catcher );

			this.y += 16;
			this._update_version++;
			sdWorld.UpdateHashPosition( this, false );

			this.AwakeSelfAndNear( catcher );
			return;
		}
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.frame === 0 )
		if ( from_entity.is( sdWater ) )
		{
			this.BlendWith( from_entity );
			
			if ( !this._is_being_removed )
			if ( !from_entity._is_being_removed )
			if ( this.type === from_entity.type )
			{
				this.remove();
			}
			
			return;
		}
		
		if ( from_entity.Damage !== sdEntity.prototype.Damage )
		if ( !from_entity.is( sdWater ) )
		if ( !from_entity.is( sdBG ) )
		if ( !from_entity.is( sdBlock ) || ( ( sdWorld.is_server && !from_entity._natural ) || ( !sdWorld.is_server && from_entity.material !== sdBlock.MATERIAL_GROUND ) ) )
		if ( !from_entity.is( sdDoor ) )
		if ( !from_entity.is( sdEffect ) )
		//if ( !from_entity.is( sdGun ) || from_entity._held_by === null )
		//if ( !from_entity.is( sdStatusEffect ) ) These have regular damage function and ignored earlier
		if ( from_entity.IsTargetable( this, false ) )
		{
			//if ( this.type === sdWater.TYPE_LAVA || this.type === sdWater.TYPE_ACID )
			{
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				
				//from_entity.DamageWithEffect( GSPEED * 5 );
				if ( !sdWater.all_swimmers.has( from_entity ) )
				if ( !this._swimmers.has( from_entity ) )
				{
					this._swimmers.add( from_entity );
					
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					
					if ( this.type !== sdWater.TYPE_TOXIC_GAS )
					{
						//sdWater.all_swimmers.add( from_entity );
						sdWater.all_swimmers.set( from_entity, this );
						
						if ( !sdWorld.is_server || sdWorld.is_singleplayer )
						if ( sdWorld.time > this._spawn_time + 2000 )
						if ( !sdWater.all_swimmers_previous_frame_exit.has( from_entity ) )
						if ( !sdWater.all_swimmers_previous_frame_exit_swap.has( from_entity ) )
						{
							if ( typeof from_entity.sy !== 'undefined' )
							this._client_vel += from_entity.sy * 0.1 * from_entity.mass / 70;
							/*let w2 = sdWater.GetWaterObjectAt( this.x - 16, this.y );
							if ( w2 )
							w2._client_vel += from_entity.sy * 0.05;
							let w3 = sdWater.GetWaterObjectAt( this.x + 16, this.y );
							if ( w3 )
							w3._client_vel += from_entity.sy * 0.05;*/
						
							let e = null;
							
							let xx = from_entity.x;
							let yy = from_entity.y;
							
							xx = Math.max( this.x + this._hitbox_x1, Math.min( xx, this.x + this._hitbox_x2 ) );
							yy = Math.max( this.y + this._hitbox_y1, Math.min( yy, this.y + this._hitbox_y2 ) );

							if ( this.type === sdWater.TYPE_ACID )
							{
								e = new sdEffect({ x:xx, y:yy, type:sdEffect.TYPE_BLOOD_GREEN, filter:'opacity('+(~~((1 * 0.5)*10))/10+')' });
								sdSound.PlaySound({ name:'water_entrance', x:xx, y:yy, _server_allowed: true, volume: 0.1, pitch: 0.75 });
							}
							else
							if ( this.type === sdWater.TYPE_WATER )
							{
								e = new sdEffect({ x:xx, y:yy, type:sdEffect.TYPE_BLOOD_GREEN, filter:'hue-rotate(90deg) opacity('+(~~((1 * 0.5)*10))/10+')' });
								sdSound.PlaySound({ name:'water_entrance', x:xx, y:yy, _server_allowed: true, volume: 0.1, pitch: 1 });
							}
					
							if ( e )
							{
								sdEntity.entities.push( e );
							}
						}
					}
				}
				
				if ( from_entity.is( sdGib ) )
				if ( from_entity._can_infect_water )
				{
					from_entity._can_infect_water = false;
					
					if ( sdWorld.is_server )
					if ( this.type === sdWater.TYPE_WATER || this.type === sdWater.TYPE_ACID )
					if ( from_entity._blood_type !== 0 )
					if ( Math.random() < 0.3 )
					{
						sdTimer.ExecuteWithDelay( ( timer )=>{

							if ( !this._is_being_removed )
							{
								let xx = this.x + 8;
								let yy = this.y + 8;
								
								let ent = new sdShark({ x: xx, y: yy });
								sdEntity.entities.push( ent );

								if ( !ent.CanMoveWithoutOverlap( ent.x, ent.y ) )
								{
									ent.remove();
									ent._broken = false;
								}
								else
								{
									sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs
								}
							}
						
						}, 1000 * 30 + Math.random() * 1000 * 60 * 5 ); // Spawns in 0:30 ... 5:30
					}
				}
			}
		}
	}
			
	static DrawLiquidRect( ctx, ent, liquid, border_x1, border_x2, border_y1, border_y2, offset_x=0 ) // Used by storage tank and essence extractor
	{
		if ( liquid.type === -1 )
		return;

		if ( liquid.type === sdWater.TYPE_LAVA || liquid.type === sdWater.TYPE_ESSENCE )
		ctx.apply_shading = false;

		offset_x = offset_x % 32;

		let w = ( ent.hitbox_x2 - ent.hitbox_x1 ) + border_x1 + border_x2;
		let h = ent.hitbox_y2 - ent.hitbox_y1 + border_y1 + border_y2;
		let dx = ent.hitbox_x1 - border_x1;
		let dy = -h + ent.hitbox_y2 + border_y2;

		let amount_h = liquid.amount / liquid.max * h;
		let amount_dy = -amount_h + ent.hitbox_y2 + border_y2;

		if ( liquid.type === sdWater.TYPE_ANTIMATTER )
		{
			let e = Math.pow( liquid.amount / ent.liquid.max, 0.5 );

			ctx.globalAlpha = e;
			ctx.filter = 'hue-rotate(60deg) saturate(0.1) brightness(0.66) contrast(10)';

			let xx = Math.floor( offset_x + sdWorld.time / 500 ) % 32;

			ctx.drawImageFilterCache( sdWater.img_essence, xx, 0, w, h, dx, dy, w, h );
		}
		else
		if ( liquid.type === sdWater.TYPE_ESSENCE )
		{
			let e = Math.pow( liquid.extra / liquid.amount * 100 / ( sdCrystal.anticrystal_value / 2 ), 0.5 );

			ctx.globalAlpha = 0.4 + e * 0.6;
			ctx.filter = 'brightness(' + ~~( ( 1 + e * 1.2 ) * 100 ) + '%)';

			let xx = Math.floor( offset_x + sdWorld.time / 500 ) % 32;

			ctx.drawImageFilterCache( sdWater.img_essence, xx, 0, w, amount_h, dx, amount_dy, w, amount_h );
		}
		else
		if ( liquid.type === sdWater.TYPE_LAVA )
		{
			ctx.fillStyle = '#FFAA00';
			
			let xx = Math.floor( offset_x + sdWorld.time / 500 ) % 32;
			
			ctx.drawImageFilterCache( sdWater.img_lava, xx, 0, w, amount_h, dx, amount_dy, w, amount_h );
		}
		else
		if ( liquid.type === sdWater.TYPE_TOXIC_GAS )
		{
			ctx.fillStyle = '#ff77ff';
			ctx.globalAlpha = liquid.amount / liquid.max * 0.6;
			ctx.fillRect( dx, dy, w, h );
		}
		else
		{
			if ( liquid.type === sdWater.TYPE_ACID )
			ctx.fillStyle = '#008000';
			else
			ctx.fillStyle = '#0030a0';

			ctx.globalAlpha = 0.6;
	
			//if ( ent.v === left_v && ent.v === right_v )
			//{
				//ctx.globalAlpha = ent._volume * 0.9 + 0.1;
				//ctx.fillRect( 0, 16 - ent.v / 100 * 16, 16,16 * ent.v / 100 );
				ctx.fillRect( dx, amount_dy, w, amount_h );
				//ctx.globalAlpha = 1;
			/*}
			else
			{
				ctx.beginPath();
				ctx.moveTo( 0, 16 - ( left_v ) / 100 * 16 );
				ctx.lineTo( 8, 16 - ( ent.v ) / 100 * 16 );
				ctx.lineTo( 16, 16 - ( right_v ) / 100 * 16 );
				ctx.lineTo( 16, 16 );
				ctx.lineTo( 0, 16 );
				ctx.fill();
			}*/
								
			ctx.globalAlpha = 1;
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	//DrawFG( ctx, attached )
	Draw( ctx, attached )
	{
		//let wall_below = sdWorld.CheckWallExists( this.x + 8, this.y + 16 + 8, null, null, sdWater.classes_to_interact_with );
		
		//let below = sdWater.GetWaterObjectAt( this.x, this.y + 16 );
		//let left = sdWater.GetWaterObjectAt( this.x - 16, this.y );
		//let right = sdWater.GetWaterObjectAt( this.x + 16, this.y );
		
		//let drawn = false;
		
		/*if ( ( !below || below.v < 100 ) && !wall_below )
		{
			let morph;
			
			ctx.globalAlpha = this.v / 100;
			
			if ( left || ( !left && !right ) )
			{
				morph = ( sdWorld.time % 200 ) / 200;
				ctx.drawImage( sdWater.img_water_flow, -16 + 4, -16 + morph * 16 + 8, 32, 32 );
				drawn = true;
			}
			
			if ( right || ( !left && !right ) )
			{
				morph = ( ( sdWorld.time + 100 ) % 200 ) / 200;
				ctx.drawImage( sdWater.img_water_flow, -16 + 12, -16 + morph * 16 + 8, 32, 32 );
				drawn = true;
			}
			
			ctx.globalAlpha = 1;
		}*/
		
		//if ( !drawn )
		{
			//let wall_left = sdWorld.CheckWallExists( this.x + 8 - 16, this.y + 8, null, null, sdWater.classes_to_interact_with );
			//let wall_right = sdWorld.CheckWallExists( this.x + 8 + 16, this.y + 8, null, null, sdWater.classes_to_interact_with );

			
			//let left_v = ( left ? ( this.v + left.v ) / 2 : ( wall_left ? this.v : 0 ) );
			//let right_v = ( right ? ( this.v + right.v ) / 2 : ( wall_right ? this.v : 0 ) );


			//ctx.globalAlpha = 0.2;
			
			let volume = this.v / 100;

			if ( this.type === sdWater.TYPE_ANTIMATTER )
			{
				// Just explodes if spawned, only shown in liquid containers
			}
			/*else
			if ( this.type === sdWater.TYPE_ESSENCE )
			{
				let e = this.extra / ( sdCrystal.anticrystal_value / 2 );

				ctx.globalAlpha = 0.6 + e * 2;
				ctx.filter = 'brightness(' + ~~( ( 1 + e * 1.2 ) * 100 ) + '%)';

				let xx = this.x + ( Math.floor( sdWorld.time / 500 ) % 32 );
				
				ctx.drawImageFilterCache( sdWater.img_essence, xx - Math.floor( xx / 32 ) * 32, this.y - Math.floor( this.y / 32 ) * 32, 16,16, 0,0, 16,16 );

				ctx.filter = 'none';
			}*/
			else
			if ( this.type === sdWater.TYPE_LAVA || this.type === sdWater.TYPE_ESSENCE )
			{
				let xx = this.x + ( Math.floor( sdWorld.time / 500 ) % 32 );

				let yy = this.y + 16 - this.v / 100 * 16;
				
				ctx.apply_shading = false;
				
				let img = 
						( this.type === sdWater.TYPE_LAVA ) ? sdWater.img_lava :
						( this.type === sdWater.TYPE_ESSENCE ) ? sdWater.img_essence : null;
				
				//ctx.drawImageFilterCache( sdWater.img_lava, xx - Math.floor( xx / 32 ) * 32, this.y - Math.floor( this.y / 32 ) * 32, 16,16, 0,0, 16,16 );
				ctx.drawImageFilterCache( img, 
										 xx - Math.floor( xx / 32 ) * 32, 
										 yy - Math.floor( yy / 32 ) * 32, 
										 16,
										 16 * Math.max( 0.4, this.v / 100 ),  
										 
										 0,
										 16 - this.v / 100 * 16, 
										 
										 16,
										 16 * this.v / 100 );
			}
			else
			if ( this.type === sdWater.TYPE_TOXIC_GAS )
			{
				ctx.fillStyle = '#ff77ff';
				ctx.globalAlpha = 0.3 * volume;
				ctx.fillRect( 0, 0, 16, 16 );
				ctx.globalAlpha = 1;
			}
			else
			{
				if ( this.type === sdWater.TYPE_ACID )
				ctx.fillStyle = '#008000';
				else
				ctx.fillStyle = '#0030a0';

				ctx.globalAlpha = 0.8;
		
				//if ( this.v === left_v && this.v === right_v )
				//{
					//ctx.globalAlpha = this._volume * 0.9 + 0.1;
					//ctx.fillRect( 0, 16 - volume * 16, 16,16 * volume );
					//ctx.fillRect( 0, 0, 16, 16 );
					//ctx.globalAlpha = 1;
				/*}
				else
				{
					ctx.beginPath();
					ctx.moveTo( 0, 16 - ( left_v ) / 100 * 16 );
					ctx.lineTo( 8, 16 - ( this.v ) / 100 * 16 );
					ctx.lineTo( 16, 16 - ( right_v ) / 100 * 16 );
					ctx.lineTo( 16, 16 );
					ctx.lineTo( 0, 16 );
					ctx.fill();
				}*/
				
				//let down_ent = null;
				let can_flow_down = true;
				let down = sdWorld.RequireHashPosition( this.x + 8, this.y + 8 + 16 ).arr;
				for ( let i2 = 0; i2 < down.length; i2++ )
				if ( this.CanCollideWithEntity( down[ i2 ], this.x, this.y + 16 ) )
				{
					// Do not stop if about to merge with that one
					if ( down[ i2 ]._class_id === this._class_id )
					if ( down[ i2 ].type === this.type )
					{
						if ( down[ i2 ].v < 100 )
						continue;
					}
						
						
					//down_ent = down[ i2 ];

					can_flow_down = false;

					//if ( down_ent._class_id !== this._class_id ) // Try to find newly built walls so they can stop the flow
					break;
				}
				

				if ( can_flow_down )
				{
					if ( Math.abs( this._client_flow_y - this.y ) > 64 )
					this._client_flow_y = this.y;
				
					this._client_flow_y = sdWorld.MorphWithTimeScale( this._client_flow_y, this.y, 0.6, sdWorld.GSPEED );
					
					if ( this.type === sdWater.TYPE_ACID )
					{
						ctx.sd_color_mult_r = 0.5;
						ctx.sd_color_mult_g = 1;
						ctx.sd_color_mult_b = 0.5;
					}
					else
					{
						ctx.sd_color_mult_r = 1;
						ctx.sd_color_mult_g = 1;
						ctx.sd_color_mult_b = 1;
					}
					
					let xx = 0;
					let yy = 0;
					for ( let i = 0; i < 3; i++ )
					{
						if ( i === 0 )
						{
							xx = 8 - 4;
							yy = 8 + 4;
						}
						if ( i === 1 )
						{
							xx = 8 + 4;
							yy = 8;
						}
						if ( i === 2 )
						{
							xx = 8;
							yy = 8 - 4;
						}
						
						yy = ( yy + sdWorld.time / 50 ) % 16;
							
						ctx.globalAlpha = Math.max( 0.25, this.v / 100 ) * 1;
				
						ctx.drawImageFilterCache( sdWater.img_water_flow, xx - 16, yy - 16 + this._client_flow_y - this.y, 32, 32 );
					}
					ctx.sd_color_mult_r = 1;
					ctx.sd_color_mult_g = 1;
					ctx.sd_color_mult_b = 1;
				}
				else
				{

					let h1 = 16 - volume * 16;
					let h2 = 16 - volume * 16;

					//if ( 0 )
					if ( !sdWater.GetWaterObjectAt( this.x, this.y - 16, this.type ) )
					{
						let dx;
						let dy;

						let water_right = sdWater.GetWaterObjectAt( this.x + 16, this.y - 16, this.type );
						//let water_right = sdWater.GetWaterObjectAt( this.x + 16, this.y, this.type );
						volume += Math.sin( sdWorld.time / 3000 + this.x / 32 ) / 16 - this._client_y;

						if ( !water_right )
						water_right = sdWater.GetWaterObjectAt( this.x + 16, this.y, this.type );

						if ( !water_right )
						water_right = sdWater.GetWaterObjectAt( this.x + 16, this.y + 16, this.type );

						if ( water_right )
						{
							let volume2 = water_right.v / 100;
							volume2 += Math.sin( sdWorld.time / 3000 + water_right.x / 32 ) / 16 - water_right._client_y;

							//if ( volume2 < 0 )
							//volume2 = 0;

							if ( water_right.y + 16 - volume2 * 16 > this.y + 16 )
							volume2 = -( this.y + 16 - water_right.y - 16 ) / 16;

							dx = 16;
							dy = ( water_right.y + 16 - volume2 * 16 ) - ( this.y + 16 - volume * 16 );
						}
						else
						{
							let volume2 = this.v / 100;
							volume2 += Math.sin( sdWorld.time / 3000 + (this.x+16) / 32 ) / 16;

							if ( volume2 < 0 )
							volume2 = 0;

							dx = 16;
							dy = volume2 - volume;
						}

						if ( volume < 0 )
						volume = 0;

						ctx.globalAlpha = 0.3;
						//ctx.apply_shading = false;
						

						let old = ctx.volumetric_mode;
						sdRenderer.ctx.box_caps.bottom = false;
						sdRenderer.ctx.box_caps.left = false;
						sdRenderer.ctx.box_caps.right = false;
						sdRenderer.ctx.box_caps.top = true;
						sdRenderer.ctx.box_caps.is_rotated = true;
						ctx.save();
						{

							if ( this.type === sdWater.TYPE_ACID )
							{
								ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX;
								//ctx.globalAlpha = 0.5;
								ctx.fillStyle = '#117711';
							}
							else
							{
								ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX;
								//ctx.globalAlpha = 1;
								
								if ( sdWeather.only_instance.TraceDamagePossibleHere( this.x + 8, this.y, 32, true, false ) )
								{
									ctx.apply_shading = false;
									ctx.fillStyle = '#f6efff';
									
									let morph = Math.min( Math.max( 0, this.y - sdWorld.camera.y ) / 32, 1 );
									
									ctx.fillStyle = sdWorld.rgbToHex( 0*morph + 246*(1-morph) , 51*morph + 239*(1-morph) , 102*morph + 255*(1-morph) );
									/*246
									239
									255
									
									0
									51
									102*/
								}
								else
								{
									ctx.fillStyle = '#003366';
								}
							}
							
							//
							
							ctx.translate( 0, 16 - volume * 16 );
							ctx.rotate( Math.PI / 2 - Math.atan2( dx, dy ) );

							//ctx.fillRect( 0, 16 - volume * 16, 16,1 );
							ctx.fillRect( 0, -0.5, sdWorld.Dist2D_Vector( dx,dy ),1 );
						}
						ctx.restore();
						ctx.volumetric_mode = old;


						h1 = 16 - volume * 16;
						h2 = 16 - volume * 16 + dy;
					}
					
					ctx.apply_shading = true;
					
					let old = sdRenderer.ctx.z_offset;
					sdRenderer.ctx.z_offset += 32;
					{
						let r,g,b;
						
						if ( this.type === sdWater.TYPE_ACID )
						{
							r = 0;
							g = 128/255;
							b = 0/255;
						}
						else
						{
							r = 0;
							g = 20/255;
							b = 60/255;
						}
						
						
						ctx.drawTriangle( 0,h1, 16,h2, 0,16,  r,g,b, 0.8,0.8,0.8 );
						ctx.drawTriangle( 16,h2, 16,16, 0,16, r,g,b, 0.8,0.8,0.8 );
					}
					sdRenderer.ctx.z_offset = old;
				}
									
				ctx.globalAlpha = 1;
			}

			//ctx.globalAlpha = 1;
		}
		
		/*if ( this.wall_under )
		{
			ctx.fillStyle = '#ff0000';
			ctx.fillRect( 2, 16-4, 16 - 4,2 );
		}
		*/
	   
	   
		if ( sdWater.DEBUG )
		{
			ctx.globalAlpha = 1;
		
			if ( this.a )
			{
				ctx.fillStyle = '#00ff00';
				ctx.fillRect( 2, 2, 2,2 );
			}

			ctx.fillStyle = '#ffffff';
			ctx.font = "4.5px Verdana";
			ctx.textAlign = 'center';
			ctx.fillText( this.d, 0, -64 );
			
			ctx.globalAlpha = 1;
		}

		//ctx.fillStyle = '#ff0000';
		//ctx.fillRect( 0, 0, 1 + 15 * this._volume, 4 );
		
	}
	
	FullRemove()
	{
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			let id = sdWater.all_waters.indexOf( this );
			if ( id !== -1 )
			sdWater.all_waters.splice( id, 1 );
		}
		
		this._swimmers.forEach( ( e )=>
		{
			this._swimmers.delete( e );
			sdWater.all_swimmers.delete( e );
		});
		this._swimmers = null;
	}
	onRemove() // Class-specific, if needed
	{
		this.FullRemove();
	}
	onRemoveAsFakeEntity() // Will be called instead of onRemove() if entity was never added to world
	{
		this.FullRemove();
	}
	static GlobalThink( GSPEED )
	{
		sdWater.all_swimmers_previous_frame_exit_swap = sdWater.all_swimmers_previous_frame_exit;
		
		sdWater.all_swimmers_previous_frame_exit = new Set();
	}
}
//sdWater.init_class();

export default sdWater;