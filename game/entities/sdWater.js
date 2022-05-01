
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdBG from './sdBG.js';
import sdDoor from './sdDoor.js';
import sdGun from './sdGun.js';
import sdCharacter from './sdCharacter.js';
import sdBullet from './sdBullet.js';

import sdRenderer from '../client/sdRenderer.js';


class sdWater extends sdEntity
{
	static init_class()
	{
		sdWater.TYPE_WATER = 0;
		sdWater.TYPE_ACID = 1;
		sdWater.TYPE_LAVA = 2;
		sdWater.TYPE_TOXIC_GAS = 3;
		
		sdWater.damage_by_type = [ 0, 1, 5, 0 ];
		sdWater.never_sleep_by_type = [ 0, 0, 0, 1 ];
		
		sdWater.DEBUG = false;
		
		sdWater.classes_to_interact_with = [ 'sdBlock', 'sdDoor' ];
		sdWater.water_class_array = [ 'sdWater' ];
		
		//sdWater.img_water_flow = sdWorld.CreateImageFromFile( 'water_flow' );
		sdWater.img_lava = sdWorld.CreateImageFromFile( 'lava2' );
		
		sdWater.all_swimmers = new Set(); // Prevent multiple damage water objects from applying damage onto same entity. Also handles more efficient is_in_water checks for entities
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return 0; }
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
			
			params.x = Math.floor( params.x / 16 ) * 16;
			params.y = Math.floor( params.y / 16 ) * 16;
		}
		
		super( params );
		
		this.type = params.type || sdWater.TYPE_WATER;
		
		this._volume = params.volume || 1;
		
		if ( sdWater.DEBUG )
		this.a = false; // awakeness for client, for debugging
		
		this.v = 100; // rounded volume for clients
		
		this._sy = 0; // How fast it flows down
		
		this._swimmers = new Set();
		
		this._think_offset = ~~( Math.random() * 16 );
		
		if ( sdWorld.is_server )
		{
			
			// Remove existing water, just in case
			let arr_under = sdWorld.RequireHashPosition( this.x, this.y );
			for ( var i = 0; i < arr_under.length; i++ )
			{
				if ( arr_under[ i ] instanceof sdWater )
				if ( arr_under[ i ].x === this.x && arr_under[ i ].y === this.y )
				if ( arr_under[ i ] !== this )
				{
					arr_under[ i ]._volume = Math.min( 1, arr_under[ i ]._volume + this._volume );
					this.remove();
				}
			}
			
			sdWorld.UpdateHashPosition( this, false ); // Without this, new water objects will only discover each other after one first think event (and by that time multiple water objects will overlap each other). This could be called at sdEntity super constructor but some entities don't know their bounds by that time
		}
	}
	
	
	MeasureMatterCost()
	{
		// hack
		//return 0;
		
		return 5;
	}
	
	static GetWaterObjectAt( nx, ny ) // for visuals, also for chain-awake
	{
		if ( nx >= sdWorld.world_bounds.x2 || nx <= sdWorld.world_bounds.x1 || 
			 ny >= sdWorld.world_bounds.y2 || ny <= sdWorld.world_bounds.y1 )
		return null;
	
		let arr_under = sdWorld.RequireHashPosition( nx, ny );
		
		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ] instanceof sdWater )
			if ( arr_under[ i ].x === nx && arr_under[ i ].y === ny )
			if ( !arr_under[ i ]._is_being_removed )
			return arr_under[ i ];
		}
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
				let ent = new sdBlock({ 
					x: another.x, 
					y: another.y, 
					width: 16, 
					height: 16,
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
				sdEntity.entities.push( ent );

				this.remove();
				another.remove();

				return true; // Delete both
			}
		}
		return false;
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
							if ( !e.isWaterDamageResistant() )
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
									e.Damage( 0.5 * GSPEED * this._volume, this );
								}
							}
							if ( sdWater.damage_by_type[ this.type ] !== 0 )
							if ( this.type === sdWater.TYPE_LAVA || ( this.type === sdWater.TYPE_ACID && e_is_organic ) )
							if ( !e.isWaterDamageResistant() )
							e.Damage( sdWater.damage_by_type[ this.type ] * GSPEED ); 
						}
					}
					else
					{
						this._swimmers.delete( e );
						sdWater.all_swimmers.delete( e );
					}
				});
			}
		}
		
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
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
		}
		
		if ( !sdWorld.is_server )
		return;
	
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
				
				if ( this.v !== Math.ceil( this._volume * 100 ) )
				{
					this.v = Math.ceil( this._volume * 100 );
					this._update_version++;
				}
			}
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
	
		var arr = sdWorld.RequireHashPosition( this.x + 8, this.y + 8 + 16 );
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
			if ( arr[ i ].is( sdWater ) || arr[ i ].is( sdBlock ) || arr[ i ].is( sdDoor ) )
			if ( arr[ i ].x + arr[ i ]._hitbox_x1 < this.x + 16 )
			if ( arr[ i ].x + arr[ i ]._hitbox_x2 > this.x )
			if ( arr[ i ].y + arr[ i ]._hitbox_y1 < this.y + 16 + 16 )
			if ( arr[ i ].y + arr[ i ]._hitbox_y2 > this.y + 16 )
			if ( this !== arr[ i ] )
			{
				if ( this.BlendWith( arr[ i ] ) )
				return;
				
				var can_flow_left = true;
				var can_flow_right = true;
				
				if ( this.y + 16 >= sdWorld.world_bounds.y2 )
				{
					can_flow_left = false;
					can_flow_right = false;
				}
				else
				{
					var down_left = sdWorld.RequireHashPosition( this.x + 8 - 16, this.y + 8 + 16 );
					var down_right = sdWorld.RequireHashPosition( this.x + 8 + 16, this.y + 8 + 16 );

					for ( var i2 = 0; i2 < down_left.length; i2++ )
					{
						if ( down_left[ i2 ].is( sdWater ) || down_left[ i2 ].is( sdBlock ) || down_left[ i2 ].is( sdDoor ) )
						if ( down_left[ i2 ].x + down_left[ i2 ]._hitbox_x1 < this.x + 16 - 16 )
						if ( down_left[ i2 ].x + down_left[ i2 ]._hitbox_x2 > this.x - 16 )
						if ( down_left[ i2 ].y + down_left[ i2 ]._hitbox_y1 < this.y + 16 + 16 )
						if ( down_left[ i2 ].y + down_left[ i2 ]._hitbox_y2 > this.y + 16 )
						{
							if ( this.BlendWith( down_left[ i2 ] ) )
							return;

							can_flow_left = false;
							break;
						}
					}

					for ( var i2 = 0; i2 < down_right.length; i2++ )
					{
						if ( down_right[ i2 ].is( sdWater ) || down_right[ i2 ].is( sdBlock ) || down_right[ i2 ].is( sdDoor ) )
						if ( down_right[ i2 ].x + down_right[ i2 ]._hitbox_x1 < this.x + 16 + 16 )
						if ( down_right[ i2 ].x + down_right[ i2 ]._hitbox_x2 > this.x + 16 )
						if ( down_right[ i2 ].y + down_right[ i2 ]._hitbox_y1 < this.y + 16 + 16 )
						if ( down_right[ i2 ].y + down_right[ i2 ]._hitbox_y2 > this.y + 16 )
						{
							if ( this.BlendWith( down_right[ i2 ] ) )
							return;
					
							can_flow_right = false;
							break;
						}
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
				if ( can_flow_right )
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
					if ( sdWater.never_sleep_by_type[ this.type ] )
					if ( this._swimmers.size === 0 )
					this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
				
					this._sy = 0;
					return;
				}
			}
		}
		
		if ( this.y + 16 >= sdWorld.world_bounds.y2 )
		{
			if ( sdWater.never_sleep_by_type[ this.type ] )
			if ( this._swimmers.size === 0 )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		
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
	
		/*
		if ( sdWater.DEBUG )
		this.a = this._sleep_tim > 0;
	
		if ( this._sleep_tim > 0 )
		{
			this._sleep_tim = Math.max( 0, this._sleep_tim - GSPEED );
			
			if ( this._volume <= 0.05 ) // Some evaporation
			{
				this._volume -= 0.0001 * GSPEED;

				if ( this._volume <= 0 || this._sleep_tim <= 0 )
				{
					this.remove();
					return;
				}
			}

			let old_v = this.v;
			this.v = Math.floor( this._volume * 100 );
			if ( this.v !== old_v )
			{
				this._update_version++;
			}

			//let arr_here = this._hash_position;

			//if ( arr_here !== null )
			{
				let wall_under = sdWorld.CheckWallExists( this.x + 8, this.y + 16 + 8, null, null, sdWater.classes_to_interact_with );

				if ( GSPEED > 1 )
				GSPEED = 1;

				let can_flow_sideways = false;

				if ( wall_under )
				can_flow_sideways = true;
				else
				if ( this.FlowTowards( this.x, this.y + 16, this._volume < 0.01 ? this._volume : ( this._volume * 0.2 * GSPEED ) ) )
				can_flow_sideways = true;
		
				if ( can_flow_sideways )
				{
					let volume = this._volume * 0.5 * GSPEED;

					let wall_on_left = sdWorld.CheckWallExists( this.x + 8 - 16, this.y + 8, null, null, sdWater.classes_to_interact_with );
					let wall_on_right = sdWorld.CheckWallExists( this.x + 8 + 16, this.y + 8, null, null, sdWater.classes_to_interact_with );

					if ( wall_on_left )
					{
						if ( wall_on_right )
						{
						}
						else
						this.FlowTowards( this.x + 16, this.y, this._volume < 0.01 ? this._volume : volume );
					}
					else
					{
						if ( wall_on_right )
						this.FlowTowards( this.x - 16, this.y, this._volume < 0.01 ? this._volume : volume );
						else
						{
							if ( this._volume < 0.01 )
							{
								if ( Math.random() < 0.5 )
								this.FlowTowards( this.x - 16, this.y, this._volume );
								else
								this.FlowTowards( this.x + 16, this.y, this._volume );
							}
							else
							{
								this.FlowTowards( this.x - 16, this.y, volume );
								this.FlowTowards( this.x + 16, this.y, volume );
							}
						}
					}
				}

				//this.wall_under = wall_under;
				//this.can_flow_sideways = can_flow_sideways;
			}
		}
		else
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
		*/
	}
	onMovementInRange( from_entity )
	{
		if ( !from_entity.is( sdWater ) )
		if ( !from_entity.is( sdBG ) )
		if ( !from_entity.is( sdBlock ) || ( ( sdWorld.is_server && !from_entity._natural ) || ( !sdWorld.is_server && from_entity.material !== sdBlock.MATERIAL_GROUND ) ) )
		if ( !from_entity.is( sdDoor ) )
		if ( !from_entity.is( sdEffect ) )
		if ( !from_entity.is( sdGun ) || from_entity._held_by === null )
		{
			//if ( this.type === sdWater.TYPE_LAVA || this.type === sdWater.TYPE_ACID )
			{
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				
				//from_entity.Damage( GSPEED * 5 );
				if ( !sdWater.all_swimmers.has( from_entity ) )
				if ( !this._swimmers.has( from_entity ) )
				{
					this._swimmers.add( from_entity );
					
					if ( this.type !== sdWater.TYPE_TOXIC_GAS )
					{
						sdWater.all_swimmers.add( from_entity );
						/* Buggy
						if ( !sdWorld.is_server )
						{
						
							let e = null;

							if ( this.type === sdWater.TYPE_ACID )
							e = new sdEffect({ x:from_entity.x, y:from_entity.y, type:sdEffect.TYPE_BLOOD_GREEN, filter:'opacity('+(~~((1 * 0.5)*10))/10+')' });
							else
							if ( this.type === sdWater.TYPE_WATER )
							e = new sdEffect({ x:from_entity.x, y:from_entity.y, type:sdEffect.TYPE_BLOOD_GREEN, filter:'hue-rotate(90deg) opacity('+(~~((1 * 0.5)*10))/10+')' });

							if ( e )
							{
								sdEntity.entities.push( e );
							}
						}*/
					}
				}
			}
		}
	}
			
	DrawFG( ctx, attached )
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

			if ( this.type === sdWater.TYPE_LAVA )
			{
				ctx.fillStyle = '#FFAA00';
				
				let xx = this.x + ( Math.floor( sdWorld.time / 500 ) % 32 );
				
				ctx.drawImageFilterCache( sdWater.img_lava, xx - Math.floor( xx / 32 ) * 32, this.y - Math.floor( this.y / 32 ) * 32, 16,16, 0,0, 16,16 );
			}
			else
			if ( this.type === sdWater.TYPE_TOXIC_GAS )
			{
				ctx.fillStyle = '#ff77ff';
				ctx.globalAlpha = 0.3 * this.v / 100;
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
					//ctx.fillRect( 0, 16 - this.v / 100 * 16, 16,16 * this.v / 100 );
					ctx.fillRect( 0, 0, 16, 16 );
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
			ctx.textAlign = 'right';
			ctx.fillText( this.v, 0, -50 );
			
			ctx.globalAlpha = 1;
		}

		//ctx.fillStyle = '#ff0000';
		//ctx.fillRect( 0, 0, 1 + 15 * this._volume, 4 );
		
	}
	
	FullRemove()
	{
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
}
//sdWater.init_class();

export default sdWater;