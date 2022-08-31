
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdEffect from './sdEffect.js';
import sdBG from './sdBG.js';


import sdRenderer from '../client/sdRenderer.js';


class sdBloodDecal extends sdEntity
{
	static init_class()
	{
		sdBloodDecal.img_blood_decal = sdWorld.CreateImageFromFile( 'blood_decal' );
		sdBloodDecal.img_blood_decal_green = sdWorld.CreateImageFromFile( 'blood_decal_green' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.h; }
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		return [ 0, 0, -40 ];
	}
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_FLAT_TRANSPARENT; }
	
	get hard_collision()
	{ return false; }
	
	IsBGEntity() // 0 for in-game entities, 1 for background entities, 2 is for moderator areas, 3 is for cables/sensor areas, 4 for task in-world interfaces, 5 for wandering around background entities, 6 for status effects, 7 for player-defined regions, 8 for decals. Should handle collisions separately
	{ return 8; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	static GetBloodDecalObjectAt( nx, ny ) // for visuals, also for chain-awake. Also for liquid carrier guns
	{
		if ( nx >= sdWorld.world_bounds.x2 || nx <= sdWorld.world_bounds.x1 || 
			 ny >= sdWorld.world_bounds.y2 || ny <= sdWorld.world_bounds.y1 )
		return null;
	
		let arr_under = sdWorld.RequireHashPosition( nx, ny );
		
		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ] instanceof sdBloodDecal )
			//if ( arr_under[ i ].x === nx && arr_under[ i ].y === ny )
			if ( nx >= arr_under[ i ].x && nx < arr_under[ i ].x + 16 && 
				 ny >= arr_under[ i ].y && ny < arr_under[ i ].y + 16 )
			if ( !arr_under[ i ]._is_being_removed )
			return arr_under[ i ];
		}
		
		return null;
	}
	
	constructor( params )
	{
		super( params );
		
		this.variation = 0; // grass variation

		this.effect_type = params.effect_type || sdEffect.TYPE_BLOOD; // Or sdEffect.TYPE_BLOOD_GREEN
		this.hue = params.hue || 0;
		this.filter = params.filter || 'none';
		
		this._bg = null;
		
		this.h = 16;
		
		this.intensity = params.intensity || 33; // 0..100 opacity
		
		this._bg_relative_x = 0;
		this._bg_relative_y = 0;
		
		this._bleed = 0;
		
		this._first_frame = true;
		
		setTimeout( ()=> { this._bleed++; }, 1000 );
		setTimeout( ()=> { this._bleed++; }, 2000 );
		
		this.UpdateHitbox();
	}
	UpdateRelativePosition()
	{
		this.x = this._bg.x + this._bg_relative_x;
		this.y = this._bg.y + this._bg_relative_y;
		this._update_version++;
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
	}
	MeasureMatterCost()
	{
		return 0;
		//return this.width / 16 * this.height / 16;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		if ( this._first_frame )
		{
			this._first_frame = false;
			
			let arr = sdWorld.GetCellsInRect( this.x, this.y, this.x + 16, this.y + this.h );
			
			both:
			for ( let i = 0; i < arr.length; i++ )
			{
				for ( let i2 = 0; i2 < arr[ i ].length; i2++ )
				{
					let from_entity = arr[ i ][ i2 ];

					if ( !from_entity._is_being_removed )
					if ( this.DoesOverlapWith( from_entity, -1 ) )
					{
						if ( from_entity.is( sdBG ) )
						{
							if ( !this._bg )
							{
								this._bg = from_entity;
							
								if ( this.y < this._bg.y )
								this.y = this._bg.y;

								if ( this.y + this.h > this._bg.y + this._bg.height )
								{
									this.h = this._bg.y + this._bg.height - this.y;
									this.UpdateHitbox();
								}
								
								this._bg_relative_x = this.x - this._bg.x;
								this._bg_relative_y = this.y - this._bg.y;

								//trace( '_bg set');

								if ( this._bg._decals === null )
								this._bg._decals = [ this._net_id ];
								else
								this._bg._decals.push( this._net_id );
							}
						}
						else
						if ( from_entity.is( sdBloodDecal ) )
						//if ( from_entity._net_id !== undefined )
						{
							//trace( 'merging' );
							
							//sdWorld.SendEffect({ x:from_entity.x, y:from_entity.y, type:sdEffect.TYPE_WALL_HIT });
							//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });

							if ( from_entity._net_id < this._net_id )
							{
								from_entity.remove();
								this.intensity += from_entity.intensity;
								if ( this.intensity > 200 )
								this.intensity = 200;
								this._update_version++;
							}
							else
							{
								this.remove();
								from_entity.intensity += this.intensity;
								if ( from_entity.intensity > 200 )
								from_entity.intensity = 200;
								from_entity._update_version++;
								//break both;
								return true;
							}
						}
					}
				}
			}
			
			if ( !this._bg )
			{
				this.remove();
			}
		}
		
		//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
	}
	DrawBG( ctx, attached )
	{
		var w = 16;
		var h = this.h;
		
		ctx.sd_hue_rotation = this.hue;
		ctx.globalAlpha = this.intensity / 200;
		ctx.filter = this.filter;
		
		//ctx.globalAlpha /= ( this._bleed + 1 );
		for ( let yy = 0; yy <= this._bleed; yy++ )
		{
			if ( this.effect_type === sdEffect.TYPE_BLOOD )
			ctx.drawImageFilterCache( sdBloodDecal.img_blood_decal, this.x - Math.floor( this.x / 96 ) * 96, this.y - Math.floor( this.y / 96 ) * 96, w,h, 0, yy, w, h );
			else
			ctx.drawImageFilterCache( sdBloodDecal.img_blood_decal_green, this.x - Math.floor( this.x / 96 ) * 96, this.y - Math.floor( this.y / 96 ) * 96, w,h, 0, yy, w, h );
		
			ctx.globalAlpha /= 2;
		}
		
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
		ctx.sd_color_mult_r = 1;
		ctx.sd_color_mult_g = 1;
		ctx.sd_color_mult_b = 1;
		ctx.globalAlpha = 1;
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._bg )
		{
			if ( !this._bg._is_being_removed )
			if ( this._bg._decals )
			{
				let id = this._bg._decals.indexOf( this._net_id );
				if ( id >= 0 )
				this._bg._decals.splice( id, 1 );
			}
			this._bg = null;
		}
	}
}
//sdBloodDecal.init_class();

export default sdBloodDecal;