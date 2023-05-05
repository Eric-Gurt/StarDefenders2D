
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
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.width; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.height; }
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_BOX; }
	
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
		
		if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
		{
			this.remove();
		}
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
		
		this.hue = params.hue || 0;
		this.br = params.br || 100;
		this.filter = params.filter || '';
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._decals = null; // array of _net_id-s of sdBloodDecal-s
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		
		this.InstallBoxCapVisibilitySupport();
		
		this.onSnapshotApplied();
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_decals' );
	}
	MeasureMatterCost()
	{
		return this.width / 16 * this.height / 16;
	}
	
	get spawn_align_x(){ return Math.min( this.width, 16 ); };
	get spawn_align_y(){ return Math.min( this.height, 16 ); };
	
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
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
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
		
			ctx.drawImageFilterCache( img, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBG.MATERIAL_PLATFORMS_COLORED ) // Never use this one again
		ctx.drawImageFilterCache( sdBG.img_bg22_blue, 0, 0, w,h, 0,0, w,h );
		else
		if ( this.material === sdBG.MATERIAL_GROUND )
		{
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