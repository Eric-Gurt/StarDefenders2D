
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCrystal from './sdCrystal.js';

import sdRenderer from '../client/sdRenderer.js';


class sdGrass extends sdEntity
{
	static init_class()
	{
		sdGrass.img_grass = sdWorld.CreateImageFromFile( 'grass' );
		sdGrass.img_grass2 = sdWorld.CreateImageFromFile( 'grass2' ); // sprite by LazyRain
		sdGrass.img_grass3 = sdWorld.CreateImageFromFile( 'grass3' ); // sprite by LazyRain
		
		sdGrass.heights = [ 8, 14, 27 ]; // by variation. Also determines how much regen it will give
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return ( 16 - sdGrass.heights[ this.variation ] ) || 0; }
	get hitbox_y2() { return 16; }
	
	IsTargetable( by_entity ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		if ( by_entity && by_entity.is( sdBullet ) && by_entity._admin_picker )
		return true;

		return false;
	}
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_GRASS; }
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Grow()
	{
		if ( this.variation < 2 )
		{
			this.variation++;
			this._update_version++;
		}
	}
	Damage( dmg, initiator=null ) // Case of lava damage? Also throwable swords.
	{
		if ( !sdWorld.is_server )
		return;
		
		this.remove();
	}
	
	onSnapshotApplied() // To override
	{
		// Update version where hue is a separate property
		if ( this.filter.indexOf( 'hue-rotate' ) !== -1 || this.filter.indexOf( 'brightness' ) !== -1 )
		{
			[ this.hue, this.br, this.filter ] = sdWorld.ExtractHueRotate( this.hue, this.br, this.filter );
		}
	}
	constructor( params )
	{
		super( params );
		
		this.variation = 0; // grass variation

		/*this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdGrass.MATERIAL_PLATFORMS;
		*/
		this.hue = params.hue || 0;
		this.br = params.br || 100;
		this.filter = params.filter || '';
		
		this._block = params.block || null;
		
		this.snowed = false;
		
		//this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		
		this.onSnapshotApplied();
		
		//if ( this._block )
		//this._block.ValidatePlants( this );
		
		/*if ( this._block )
		{
			if ( !this._block._plants )
			{
				this._block._plants.push( this._net_id );
			}
			else
			if ( this._block._plants.indexOf( this._net_id ) === -1 )
			{
				this._block._plants.push( this._net_id );
			}
		}*/
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_block' );
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
	
	SetSnowed( v )
	{
		if ( this.snowed !== v )
		{
			this.snowed = v;
			this._update_version++;
		}
	}
	
	DrawFG( ctx, attached )
	{
		var w = 16;
		var h = 16;
		
		if ( sdWorld.my_entity )
		{
			if ( sdWorld.my_entity.look_x >= this.x )
			if ( sdWorld.my_entity.look_x < this.x + 16 )
			if ( sdWorld.my_entity.look_y >= this.y + this._hitbox_y1 )
			if ( sdWorld.my_entity.look_y < this.y + 16 )
			ctx.globalAlpha = 0.15;
		}
		
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
		
		if ( this.snowed )
		{
			ctx.filter += 'saturate(0.05) brightness(2)';
		}
		
		if ( this.variation === 0 )
		{
			ctx.drawImageFilterCache( sdGrass.img_grass, 0, 0, w,h, 0, 0, w, h );
		}
		else
		if ( this.variation === 1 )
		{
			ctx.drawImageFilterCache( sdGrass.img_grass2, 0, 0, w,h, 0, 0, w, h );
		}
		else
		if ( this.variation === 2 )
		{
			h = 32;
			ctx.drawImageFilterCache( sdGrass.img_grass3, 0, 0, w,h, 0, -16, w, h );
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
		if ( this._block )
		{
			if ( !this._block._is_being_removed )
			if ( this._block._plants )
			{
				let id = this._block._plants.indexOf( this._net_id );
				if ( id >= 0 )
				{
					this._block._plants.splice( id, 1 );
					
					if ( this._block._plants.length === 0 )
					this._block._plants = null;
				}
			}
			this._block = null;
		}
	}
	
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( !this._is_being_removed )
		if ( from_entity.is( sdCrystal ) )
		if ( from_entity.type === sdCrystal.TYPE_CRYSTAL_CRAB || from_entity.type === sdCrystal.TYPE_CRYSTAL_CRAB_BIG )
		if ( this.variation < sdGrass.heights.length )
		{
			let coefficient = ( sdGrass.heights[ this.variation ] / 27 );
			
			if ( from_entity.matter_regen < 400 )
			from_entity.matter_regen = Math.min( from_entity.matter_regen + 8 * coefficient, 400 );
		
			from_entity._hea = Math.min( from_entity._hea + 10 * coefficient, from_entity._hmax );
			
			sdSound.PlaySound({ name:'popcorn', x:from_entity.x, y:from_entity.y, volume:0.3, pitch:1.5 });
			
			this.remove();
		}
	}
}
//sdGrass.init_class();

export default sdGrass;