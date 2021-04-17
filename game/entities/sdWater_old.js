
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';

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
		
		sdWater.sleep_tim_max = 30;
		sdWater.considerable_delata_volume_for_awakeness = 0.001;
		
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
		//this.can_flow_sideways = false;
		//this.wall_under = false;
		
		this._sleep_tim = sdWater.sleep_tim_max; // When it reaches 0 - it freezes
		
		if ( sdWater.DEBUG )
		this.a = false; // awakeness for client, for debugging
		
		this.v = 100; // rounded volume for clients
		
		//this._rare_tim = ~~Math.random() * 10;
			
		if ( sdWorld.is_server )
		{
			/*
			if ( !sdEntity.entities_tot_max )
			sdEntity.entities_tot_max = 0;
		
			if ( sdEntity.entities_tot_max < sdEntity.entities.length )
			{
				sdEntity.entities_tot_max = sdEntity.entities.length;
				console.log( 'sdEntity.entities.length becomes '+sdEntity.entities.length );
			}*/
		
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
			/*
			for ( var i = 0; i < sdEntity.entities.length; i++ )
			{
				if ( sdEntity.entities[ i ] instanceof sdWater )
				if ( sdEntity.entities[ i ].x === this.x )
				if ( sdEntity.entities[ i ].y === this.y )
				{
					throw new Error('What are we doing here?');
				}
			}*/
			
			sdWorld.UpdateHashPosition( this, false ); // Without this, new water objects will only discover each other after one first think event (and by that time multiple water objects will overlap each other). This could be called at sdEntity super constructor but some entities don't know their bounds by that time
		}
	}
	
	/*IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		return ( this._volume > 0.1 );
	}*/
	
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
			return arr_under[ i ];
		}
	}
				
	FlowTowards( nx, ny, my_share_amount )
	{
		if ( my_share_amount > this._volume ) // Happens rarely
		my_share_amount = this._volume;
	
		if ( nx >= sdWorld.world_bounds.x2 || nx <= sdWorld.world_bounds.x1 || 
			 ny >= sdWorld.world_bounds.y2 || ny <= sdWorld.world_bounds.y1 )
		return false;

		let arr_under = sdWorld.RequireHashPosition( nx, ny );

		let water_under = false;

		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ] instanceof sdWater )
			if ( arr_under[ i ].x === nx && arr_under[ i ].y === ny )
			{
				let can_share = Math.min( 1 - arr_under[ i ]._volume, my_share_amount );
				
				if ( this.y === arr_under[ i ].y )
				{
					if ( this._volume <= arr_under[ i ]._volume )
					return false;
				
					if ( this._volume - can_share < arr_under[ i ]._volume + can_share )
					{
						// this._volume - can_share = arr_under[ i ]._volume + can_share
						// this._volume = arr_under[ i ]._volume + 2 * can_share
						// this._volume - arr_under[ i ]._volume = 2 * can_share
						// ( this._volume - arr_under[ i ]._volume ) / 2 = can_share
						can_share = ( this._volume - arr_under[ i ]._volume ) / 2;
					}
				}
				
				if ( can_share > 0 )
				{
					arr_under[ i ]._volume += can_share;
					this._volume -= can_share;

					//arr_under[ i ]._update_version++;
					//this._update_version++;
					
					if ( can_share > sdWater.considerable_delata_volume_for_awakeness )
					{
						this.AwakeSelfAndNear();
						arr_under[ i ].AwakeSelfAndNear();
						//this._sleep_tim = arr_under[ i ]._sleep_tim = sdWater.sleep_tim_max;
					}
					else
					this._sleep_tim = arr_under[ i ]._sleep_tim = Math.max( this._sleep_tim, arr_under[ i ]._sleep_tim );
					
					if ( this._volume <= 0 )
					{
						this.remove();
						return false;
					}
				}
				else
				return true; // flow sideways
			
				water_under = true;
				break;
			}
		}
		if ( !water_under )
		{
			if ( ny > this.y || my_share_amount === this._volume )
			{
				if ( this._volume > sdWater.considerable_delata_volume_for_awakeness )
				{
					this.AwakeSelfAndNear();
					//this._sleep_tim = sdWater.sleep_tim_max;
				}
				
				this.x = nx;
				this.y = ny;
				this._update_version++;
				
				if ( this._volume > sdWater.considerable_delata_volume_for_awakeness )
				{
					this.AwakeSelfAndNear();
					//this._sleep_tim = sdWater.sleep_tim_max;
				}
				//this._update_version++;
			}
			else
			{
				let ent = new sdWater({ x:nx, y:ny, type:this.type });
				ent._volume = my_share_amount;
				this._volume -= my_share_amount;
				sdEntity.entities.push( ent );
				
				sdWorld.UpdateHashPosition( ent, false ); // Might be useful against memory leaks?
				
				

				if ( my_share_amount > sdWater.considerable_delata_volume_for_awakeness )
				{
					//this._sleep_tim = ent._sleep_tim = sdWater.sleep_tim_max;
					this.AwakeSelfAndNear();
					ent.AwakeSelfAndNear();
				}
				else
				this._sleep_tim = ent._sleep_tim = this._sleep_tim;

				
				
				//this._update_version++;
				
				if ( this._volume <= 0 )
				this.remove();
			}
			
			return false;
		}
		
		return false;
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
		
		this._sleep_tim = sdWater.sleep_tim_max;
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		let e;
		
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
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;
	
		/*this._rare_tim--;
		if ( this._rare_tim < 0 )
		{
			this._rare_tim += 10;
			GSPEED *= 10;
		}
		else
		return;*/
	
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