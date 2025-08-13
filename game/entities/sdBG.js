
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';

import sdRenderer from '../client/sdRenderer.js';


class sdBG extends sdEntity
{
	static init_class()
	{
		sdBG.img_bg22 = sdWorld.CreateImageFromFile( 'bg' );
		sdBG.img_bg22_blue = sdWorld.CreateImageFromFile( 'bg_blue' );
		sdBG.img_stripes = sdWorld.CreateImageFromFile( 'bg_stripes' );
		sdBG.img_hex = sdWorld.CreateImageFromFile( 'bg_hex' );
		sdBG.img_hex2 = sdWorld.CreateImageFromFile( 'bg_hex2' );
		sdBG.img_glowing = sdWorld.CreateImageFromFile( 'bg_glowing' );
		sdBG.img_window = sdWorld.CreateImageFromFile( 'bg_window' );
		sdBG.img_elevator_path = sdWorld.CreateImageFromFile( 'bg_elevator' );
		
		// Better to keep these same as in sdBlock, so 3D effects will work as intended
		sdBG.MATERIAL_PLATFORMS = 0;
		sdBG.MATERIAL_GROUND = 1;
		// 2
		sdBG.MATERIAL_PLATFORMS_COLORED = 3; // Obsolete, use texture instead
		// 4 trapshield
		
		let t = 0;
		sdBG.TEXTURE_PLATFORMS = t++;
		sdBG.TEXTURE_STRIPES = t++;
		sdBG.TEXTURE_PLATFORMS_COLORED = t++;
		sdBG.TEXTURE_HEX = t++;
		sdBG.TEXTURE_GLOWING = t++;
		sdBG.TEXTURE_WINDOW = t++;
		sdBG.TEXTURE_ELEVATOR_PATH = t++;
		
		sdBG.as_class_list = [ 'sdBG' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get title()
	{
		if ( this.material === sdBG.MATERIAL_GROUND )
		return 'Background dirt';	
			
		if ( this.texture_id === sdBG.TEXTURE_GLOWING )
		return 'Background light';
	
		if ( this.texture_id === sdBG.TEXTURE_ELEVATOR_PATH )
		return 'Elevator path';
		
		return 'Background wall';
	}
	get description()
	{
		if ( this.texture_id === sdBG.TEXTURE_ELEVATOR_PATH )
		return 'Path for elevator motors to travel through.';
	
		return 'Can be damaged while holding Shift key.';
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.width; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.height; }
	
	DrawIn3D()
	{
		if ( this.texture_id === sdBG.TEXTURE_WINDOW )
		return FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT; 
		else
		return FakeCanvasContext.DRAW_IN_3D_BOX; 
	}
	
	get hard_collision()
	{ return true; }
	
	IsBGEntity() // 1 for BG entities, should handle collisions separately
	{ return 1; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._merged )
		{
			if ( this.UnmergeBackgrounds().length > 0 ) // Unmerged backgrounds?
			return;
			
			// TODO: Deal damage to the background closest to initiator after unmerging
		}
		
		if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
		{
			this._hea -= dmg;
			
			this._regen_timeout = 60;
			
			if ( this._hea <= 0 )
			this.remove();
		}
		
		if ( sdWorld.server_config.enable_background_merging )
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	onSnapshotApplied() // To override
	{
		// Update version where hue is a separate property
		if ( this.filter.indexOf( 'hue-rotate' ) !== -1 || this.filter.indexOf( 'brightness' ) !== -1 )
		{
			[ this.hue, this.br, this.filter ] = sdWorld.ExtractHueRotate( this.hue, this.br, this.filter );
		}
	}
	onBuilt()
	{
		this.onSnapshotApplied();
	}
	constructor( params )
	{
		super( params );
		
		this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdBG.MATERIAL_PLATFORMS;
		
		this.texture_id = params.texture_id || sdBG.TEXTURE_PLATFORMS;
		
		this._natural = ( params.natural === true );
		
		this._hea = 200 * ( this.width / 32 * this.height / 32 );
		
		this._regen_timeout = 60; // Used for merging backgrounds.
		this._merged = false;
		// Same name as health regen variable in case we someday introduce health regen to backgrounds?
		
		this.hue = params.hue || 0;
		this.br = params.br || 100;
		this.filter = params.filter || '';
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._decals = null; // array of _net_id-s of sdBloodDecal-s
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		if ( !sdWorld.server_config.enable_background_merging ) // This way it can attempt merging when created (if enabled)
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		
		this.InstallBoxCapVisibilitySupport();
		
		this.onSnapshotApplied();
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_decals' || prop === '_shielded' );
	}
	MeasureMatterCost()
	{
		return this.width / 16 * this.height / 16;
	}
	static GetBackgroundObjectAt( nx, ny, strict = true ) // for merging
	{
		if ( nx >= sdWorld.world_bounds.x2 || nx <= sdWorld.world_bounds.x1 || 
			 ny >= sdWorld.world_bounds.y2 || ny <= sdWorld.world_bounds.y1 )
		return null;
	
		let arr_under = sdWorld.RequireHashPosition( nx, ny ).arr;
		
		if ( strict )
		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ] instanceof sdBG )
			if ( arr_under[ i ].x === nx && arr_under[ i ].y === ny )
			if ( !arr_under[ i ]._is_being_removed )
			return arr_under[ i ];
		}
		else
		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ] instanceof sdBG )
			if ( nx >= arr_under[ i ].x && ny >= arr_under[ i ].y && nx <= ( arr_under[ i ].x + arr_under[ i ].width ) && ny <= ( arr_under[ i ].y + arr_under[ i ].height ) )
			if ( !arr_under[ i ]._is_being_removed )
			return arr_under[ i ];
		}
		
		return null;
	}
	
	get spawn_align_x(){ return Math.min( this.width, 16 ); };
	get spawn_align_y(){ return Math.min( this.height, 16 ); };
	
	
	SupportsMerging()
	{
		//if ( this._natural === false ) // Natural BG only for now?
		//return false;
	
		if ( this.width !== 16 ) // Maybe let's keep vertical lines only for now.
		return false;
			
		if ( this.height < 16 || this.height % 16 !== 0 ) // Merge only blocks that can be divided by 16, and are at least 16 units
		return false;
		
		if ( this.material === sdBG.MATERIAL_GROUND )
		return true;
		
		return false;
	}
	UnmergeBackgrounds()
	{
		if ( !sdWorld.is_server )
		return [];
	
		if ( !this._merged )
		return [];
	
	
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		// Have to recreate all backgrounds so bullets behave properly - Booraz
		
		// Seems like I also need to return an array of the newly created blocks so bullets 100% don't hit the blocks in the back.
		
		let backgrounds = [];
		
		for ( let i = 0; i < Math.round( this.height / 16 ); i++ )
		{
			let xx = this.x;
			let yy = this.y;
			yy += 16 * i;
		
			/*let contained_class = null;
			let contained_params = null;
			
			if ( this._contains_class )
			{
				if ( typeof this._contains_class !== 'string' && this._contains_class[ i ] ) // Not a string?
				{
					contained_class = this._contains_class[ i ];
				}
			}
			if ( this._contains_class_params )
			{
				if ( this._contains_class_params[ i ] ) // Not a string?
				{
					contained_params = this._contains_class_params[ i ];
				}
			}*/
		
			let ent = sdEntity.Create( sdBG, { 
				x: xx, 
				y: yy,
				width:16, 
				height:16, 
				material:this.material, 
				hue:this.hue,
				br:this.br,
				filter:this.filter, 
				natural: this._natural,
			});
			ent._regen_timeout = 60;
		
		
			backgrounds.push( ent );
		}
		if ( this._decals )
		for ( let i = 0; i < this._decals.length; i++ )
		{
			let ent = sdEntity.entities_by_net_id_cache_map.get( this._decals[ i ] );

			if ( ent && !ent._is_being_removed )
			{
				for ( let j = 0; j < backgrounds.length; j++ )
				{
					if ( ent.x === backgrounds[ j ].x && ent.y === backgrounds[ j ].y )
					{
						ent._bg = backgrounds[ j ];
						//ent._bg_relative_x = 0;
						ent._bg_relative_y = 0;
						if ( backgrounds[ j ]._decals === null )
						backgrounds[ j ]._decals = [ ent._net_id ];
						else
						backgrounds[ j ]._decals.push( ent._net_id );
						ent._update_version++; // Just in case
						//ent.UpdateRelativePosition();
						
					}
				}
			}
			else
			{
				this._decals.splice( i, 1 );
				i--;
				continue;
			}
		}
		this._decals = null;
		this.remove();
		this._broken = false;
	
	
		//this._update_version++;
		return backgrounds;
	}
	AttemptBackgroundMerging()
	{
		if ( this._merged )
		return false;
	
		if ( this._is_being_removed || !this )
		return false;
	
		let ents_to_merge_above = [];
		let ents_to_merge_below = [];
		
		/* Currently how merging works:
			We check for backgrounds above and below which are suitable for merging,
			after that we merge the above ones first - and shift the background on top
			after that, we merge the below ones - done this way so unmerging is consistent
			and merging always catches both top and bottom scenarios
			Limited to 16 backgrounds at the moment so unmerging does not become too problematic.
		*/
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		let i = 1;
		let ent;
		
		function IsCompatible( ent, ent2 )
		{
			if ( !ent || ent._is_being_removed || !ent2 || ent2._is_being_removed )
			return false;
		
			//if ( ent._natural !== ent2._natural )
			//return false;
			// Sometimes this stops merging despite the blocks being natural. How?
		
			//if ( ent._regen_timeout > 1 || ent2._regen_timeout > 1 ) // Make sure all are ready to merge (did not take damage for a while)
			//return false;
			
			//if ( ent._merged || ent2._merged )
			//return false;
		
			if  ( ent.SupportsMerging() )
			{
				if ( ent.material === ent2.material && ent.filter === ent2.filter && ent.hue === ent2.hue && ent.br === ent2.br )
				return true;
				else
				return false;
				
			}
			else
			return false;
		}
		
		if ( !IsCompatible( this, this ) )
		return false;
		
		
		// Attempt vertical merging - go down ( check below )
		while( true ){
			ent = sdBG.GetBackgroundObjectAt( this.x + 8, this.y + 8 + ( 16 * i ), false );
			
			if ( IsCompatible( ent, this ) )
			{
				// Limit to 16 entity merges.
				if ( ( this.height + ( 16 * i ) + ( ent.height - 16 ) ) <= 256 )
				ents_to_merge_below.push( ent );
				else
				break;
			}
			else
			break;
			
			if ( ent ) // Just in case
			i += Math.round( ent.height / 16 );
			else
			break;
		}
		i = 1;
		
		// Attempt vertical merging - go up ( check above )
		while( true ){
			ent = sdBG.GetBackgroundObjectAt( this.x + 8, this.y + 8 - ( 16 * i ), false );
			
			if ( IsCompatible( ent, this ) )
			{
				// Limit to 16 entity merges.
				if ( ( this.height + ( 16 * i ) + ( ent.height - 16 ) ) <= 256 )
				ents_to_merge_above.push( ent );
				else
				break;
			}
			else
			break;
			
			if ( ent ) // Just in case
			i += Math.round( ent.height / 16 );
			else
			break;
		}
		//console.log( this.filter + ',' + this.hue + ',' + this.br );
		//console.log( "Above: " + ents_to_merge_above.length );
		//console.log( "Below: " + ents_to_merge_below.length );
		
		if ( ents_to_merge_above.length > 0 || ents_to_merge_below.length > 0 ) // Any merge possible?
		{
			let contained_decals = [];
			//this.width = 16;
			//this.height = 16 + ( 16 * ents_to_merge.length );
			
			let height_increase = 0;
			if ( ents_to_merge_above.length > 0 )
			for( i = 0; i < ents_to_merge_above.length; i++ )
			{
				height_increase += ents_to_merge_above[ i ].height;
				contained_decals.push( ents_to_merge_above[ i ]._decals );
				ents_to_merge_above[ i ]._decals = null;
				
				ents_to_merge_above[ i ].remove();
				ents_to_merge_above[ i ]._broken = false;
			}
			
			this.height += height_increase; // Increase height by total height of merged blocks
			
			
			
			contained_decals.push( this._decals );
			
			this.y -= height_increase; // Move merged block up
			
			height_increase = 0; // Reset height increase
			
			if ( ents_to_merge_below.length > 0 )
			for( i = 0; i < ents_to_merge_below.length; i++ )
			{
			
				height_increase += ents_to_merge_below[ i ].height;
				contained_decals.push( ents_to_merge_below[ i ]._decals );
				ents_to_merge_below[ i ]._decals = null;
				
				ents_to_merge_below[ i ].remove();
				ents_to_merge_below[ i ]._broken = false;
				
			}
			this.height += height_increase; // Increase height by total height of merged blocks
			// No Y change since we just merged below the block
			
			this._merged = true;
			
			contained_decals = contained_decals.flat(); // Prevents arrays in arrays?
			//console.log( contained_decals );
			
			for ( i = 0; i < contained_decals.length; i++ )
			{
				let ent = sdEntity.entities_by_net_id_cache_map.get( contained_decals[ i ] );

				if ( ent && !ent._is_being_removed )
				{
					ent._bg = this;
					//ent._bg_relative_y = this.y - ent.y;
					//ent.y = this.y;
					ent._update_version++; // Just in case
					//ent.UpdateRelativePosition();
				}
				else
				{
					contained_decals.splice( i, 1 );
					i--;
					continue;
				}
			}
			
			this._decals = contained_decals;
			
			this._update_version++;
			
			sdWorld.UpdateHashPosition( this, true ); // Bullets pass through walls higher than 64 without this?
			
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			
			
			//console.log( 'BG: ' + this.x + ', ' + this.y + ', width:' + this.width + ', height:' + this.height );
			
			//this._hmax = 1;
			//this._hea = 1;
			return true;
		}
		return false;
	}
	
	onThink( GSPEED )
	{
		if ( this._decals )
		{
			for ( let i = 0; i < this._decals.length; i++ )
			{
				let ent = sdEntity.entities_by_net_id_cache_map.get( this._decals[ i ] );

				if ( ent && !ent._is_being_removed )
				ent.UpdateRelativePosition();
				else
				{
					this._decals.splice( i, 1 );
					i--;
					continue;
				}
			}
		}
		if ( sdWorld.is_server )
		{
			if ( sdWorld.server_config.enable_background_merging && this._merged === false )
			{
				if ( this._regen_timeout === 0 )
				{
					this._regen_timeout = -1;
					if ( this.AttemptBackgroundMerging() ) // Attempt merging
					{
						// Success
					}
					// Merging was attempted, so regardless if it merged or not it should hibernate.
					this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // Just in case
				}
				else
				this._regen_timeout = Math.max( 0, this._regen_timeout - GSPEED );
			}
			if ( !sdWorld.server_config.enable_background_merging || this._merged )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		}
	}
	
	onRemove()
	{
		if ( this._decals )
		{
			for ( let i = 0; i < this._decals.length; i++ )
			{
				//let ent = sdEntity.entities_by_net_id_cache[ this._decals[ i ] ];
				let ent = sdEntity.entities_by_net_id_cache_map.get( this._decals[ i ] );

				if ( ent )
				ent.remove();
			}

			this._decals = null;
		}
	}
	
	DrawBG( ctx, attached )
	{
		var w = this.width;
		var h = this.height;
		
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		if ( this.hue !== 0 )
		{
			// Less cache usage by making .hue as something GPU understands, so we don't have as many versions of same images
			if ( sdRenderer.visual_settings === 4 )
			ctx.sd_hue_rotation = this.hue;
			else
			ctx.filter = 'hue-rotate('+this.hue+'deg)' + ctx.filter;
		}
		
		if ( this.br / 100 !== 1 )
		{
			if ( sdRenderer.visual_settings === 4 )
			{
				ctx.sd_color_mult_r = this.br / 100;
				ctx.sd_color_mult_g = this.br / 100;
				ctx.sd_color_mult_b = this.br / 100;
			}
			else
			{
				ctx.filter = 'brightness('+this.br+'%)';
			}
		}
		
		/*let lumes = sdWorld.GetClientSideGlowReceived( this.x + w / 2, this.y + h / 2, this );
		if ( lumes > 0 )
		{
			if ( sdRenderer.visual_settings === 4 )
			{
				ctx.sd_color_mult_r *= (1+lumes);
				ctx.sd_color_mult_g *= (1+lumes);
				ctx.sd_color_mult_b *= (1+lumes);
			}
			else
			ctx.filter = ctx.filter + 'brightness('+(1+lumes)+')';
		}*/

		if ( this.material === sdBG.MATERIAL_PLATFORMS )
		{
			let img = null;
			
			if ( this.texture_id === sdBG.TEXTURE_PLATFORMS )
			img = sdBG.img_bg22;
		
			if ( this.texture_id === sdBG.TEXTURE_PLATFORMS_COLORED )
			img = sdBG.img_bg22_blue;
		
			if ( this.texture_id === sdBG.TEXTURE_STRIPES )
			img = sdBG.img_stripes;
		
			if ( this.texture_id === sdBG.TEXTURE_HEX )
			img = ( sdWorld.time % 4000 < 2000 ) ? sdBG.img_hex : sdBG.img_hex2;
		
			if ( this.texture_id === sdBG.TEXTURE_GLOWING )
			{
				ctx.apply_shading = false;
				img = sdBG.img_glowing;
			}

			if ( this.texture_id === sdBG.TEXTURE_WINDOW )
			img = sdBG.img_window;
		
			if ( this.texture_id === sdBG.TEXTURE_ELEVATOR_PATH )
			img = sdBG.img_elevator_path;
		
			ctx.drawImageFilterCache( img, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBG.MATERIAL_PLATFORMS_COLORED ) // Never use this one again
		ctx.drawImageFilterCache( sdBG.img_bg22_blue, 0, 0, w,h, 0,0, w,h );
		else
		if ( this.material === sdBG.MATERIAL_GROUND )
		{
			if ( h > 16 ) // Vertical merged backgrounds scenario
			{
				ctx.save();
				for ( let i = 0; i < Math.round( h / 16 ); i++ )
				{
					ctx.drawImageFilterCache( sdBlock.img_ground88, this.x - Math.floor( this.x / 256 ) * 256, ( this.y + 16 * i ) - Math.floor( ( this.y + 16 * i ) / 256 ) * 256, 16,16, 0,0, 16,16 );
					ctx.translate( 0, 16 );
				}
				ctx.restore();
			}
			else
			ctx.drawImageFilterCache( sdBlock.img_ground88, this.x - Math.floor( this.x / 256 ) * 256, this.y - Math.floor( this.y / 256 ) * 256, w,h, 0,0, w,h );
		}
		else
		ctx.drawImageFilterCache( sdBG.img_bg22, 0, 0, w,h, 0,0, w,h ); // Reinforced walls etc

		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
		ctx.sd_color_mult_r = 1;
		ctx.sd_color_mult_g = 1;
		ctx.sd_color_mult_b = 1;
	}
}

export default sdBG;
