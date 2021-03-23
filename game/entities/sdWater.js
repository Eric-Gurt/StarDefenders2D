
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';

import sdRenderer from '../client/sdRenderer.js';


class sdWater extends sdEntity
{
	static init_class()
	{
		sdWater.TYPE_WATER = 0;
		sdWater.TYPE_ACID = 1;
		
		sdWater.DEBUG = false;
		
		sdWater.classes_to_interact_with = [ 'sdBlock', 'sdDoor' ];
		sdWater.water_class_array = [ 'sdWater' ];
		
		sdWater.img_water_flow = sdWorld.CreateImageFromFile( 'water_flow' );
		
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 16; }
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_LIQUID; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.type = params.type || sdWater.TYPE_WATER;
		
		this._volume = params.volume || 1;
		
		if ( sdWater.DEBUG )
		this.a = false; // awakeness for client, for debugging
		
		this.v = 100; // rounded volume for clients
		
		this._think_offset = ~~( Math.random() * 15 );
		
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
	
	GetWaterObjectAt( nx, ny ) // for visuals, also for chain-awake
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
				e = this.GetWaterObjectAt( this.x + x * 16, this.y + y * 16 );
				if ( e )
				e.AwakeSelfAndNear( recursive_catcher );
			}
		}
		/*
		e = this.GetWaterObjectAt( this.x, this.y - 16 );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
	
		e = this.GetWaterObjectAt( this.x - 16, this.y );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
	
		e = this.GetWaterObjectAt( this.x + 16, this.y );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
	
		e = this.GetWaterObjectAt( this.x, this.y + 16 );
		if ( e )
		e.AwakeSelfAndNear( recursive_catcher );
		//e._sleep_tim = sdWater.sleep_tim_max;
		*/
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;
	
		this._think_offset--;
		
		if ( this._think_offset < 0 )
		{
			this._think_offset += 15;
		}
		else
		return;
	
		var arr = sdWorld.RequireHashPosition( this.x + 8, this.y + 8 + 16 );
		/*for ( var i = 0; i < arr.length; i++ )
		{
			if ( arr[ i ].is( sdBlock ) || arr[ i ].is( sdDoor ) )
			if ( arr[ i ].x + arr[ i ].hitbox_x1 < this.x + 16 )
			if ( arr[ i ].x + arr[ i ].hitbox_x2 > this.x )
			if ( arr[ i ].y + arr[ i ].hitbox_y1 < this.y + 16 + 16 )
			if ( arr[ i ].y + arr[ i ].hitbox_y2 > this.y + 16 )
			{
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
				return;
			}
		}*/
		for ( var i = 0; i < arr.length; i++ )
		{
			if ( arr[ i ].is( sdWater ) || arr[ i ].is( sdBlock ) || arr[ i ].is( sdDoor ) )
			if ( arr[ i ].x + arr[ i ].hitbox_x1 < this.x + 16 )
			if ( arr[ i ].x + arr[ i ].hitbox_x2 > this.x )
			if ( arr[ i ].y + arr[ i ].hitbox_y1 < this.y + 16 + 16 )
			if ( arr[ i ].y + arr[ i ].hitbox_y2 > this.y + 16 )
			if ( this !== arr[ i ] )
			{
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
						if ( down_left[ i2 ].x + down_left[ i2 ].hitbox_x1 < this.x + 16 - 16 )
						if ( down_left[ i2 ].x + down_left[ i2 ].hitbox_x2 > this.x - 16 )
						if ( down_left[ i2 ].y + down_left[ i2 ].hitbox_y1 < this.y + 16 + 16 )
						if ( down_left[ i2 ].y + down_left[ i2 ].hitbox_y2 > this.y + 16 )
						{
							can_flow_left = false;
							break;
						}
					}

					for ( var i2 = 0; i2 < down_right.length; i2++ )
					{
						if ( down_right[ i2 ].is( sdWater ) || down_right[ i2 ].is( sdBlock ) || down_right[ i2 ].is( sdDoor ) )
						if ( down_right[ i2 ].x + down_right[ i2 ].hitbox_x1 < this.x + 16 + 16 )
						if ( down_right[ i2 ].x + down_right[ i2 ].hitbox_x2 > this.x + 16 )
						if ( down_right[ i2 ].y + down_right[ i2 ].hitbox_y1 < this.y + 16 + 16 )
						if ( down_right[ i2 ].y + down_right[ i2 ].hitbox_y2 > this.y + 16 )
						{
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
					this._update_version++;
					sdWorld.UpdateHashPosition( this, false );
					
					this.AwakeSelfAndNear( catcher );
					return;
				}
				else
				{
					this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
					return;
				}
			}
		}
		
		if ( this.y + 16 >= sdWorld.world_bounds.y2 )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
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
	DrawFG( ctx, attached )
	{
		ctx.globalAlpha = 0.8;
		
		let wall_below = sdWorld.CheckWallExists( this.x + 8, this.y + 16 + 8, null, null, sdWater.classes_to_interact_with );
		
		let below = this.GetWaterObjectAt( this.x, this.y + 16 );
		let left = this.GetWaterObjectAt( this.x - 16, this.y );
		let right = this.GetWaterObjectAt( this.x + 16, this.y );
		
		let drawn = false;
		
		if ( ( !below || below.v < 100 ) && !wall_below )
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
		}
		
		if ( !drawn )
		{
			let wall_left = sdWorld.CheckWallExists( this.x + 8 - 16, this.y + 8, null, null, sdWater.classes_to_interact_with );
			let wall_right = sdWorld.CheckWallExists( this.x + 8 + 16, this.y + 8, null, null, sdWater.classes_to_interact_with );

			
			let left_v = ( left ? ( this.v + left.v ) / 2 : ( wall_left ? this.v : 0 ) );
			let right_v = ( right ? ( this.v + right.v ) / 2 : ( wall_right ? this.v : 0 ) );


			//ctx.globalAlpha = 0.2;

			ctx.fillStyle = '#008000';
				
			if ( this.v === left_v && this.v === right_v )
			{
				//ctx.globalAlpha = this._volume * 0.9 + 0.1;
				ctx.fillRect( 0, 16 - this.v / 100 * 16, 16,16 * this.v / 100 );
				//ctx.globalAlpha = 1;
			}
			else
			{
				ctx.beginPath();
				ctx.moveTo( 0, 16 - ( left_v ) / 100 * 16 );
				ctx.lineTo( 8, 16 - ( this.v ) / 100 * 16 );
				ctx.lineTo( 16, 16 - ( right_v ) / 100 * 16 );
				ctx.lineTo( 16, 16 );
				ctx.lineTo( 0, 16 );
				ctx.fill();
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
			if ( this.a )
			{
				ctx.fillStyle = '#00ff00';
				ctx.fillRect( 2, 2, 2,2 );
			}

			ctx.fillStyle = '#ffffff';
			ctx.font = "4.5px Verdana";
			ctx.textAlign = 'right';
			ctx.fillText( this.v, 0, -50 );
		}

		//ctx.fillStyle = '#ff0000';
		//ctx.fillRect( 0, 0, 1 + 15 * this._volume, 4 );
		
		ctx.globalAlpha = 1;
	}
	
	onRemove() // Class-specific, if needed
	{
		
	}
}
//sdWater.init_class();

export default sdWater;