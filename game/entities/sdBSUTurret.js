/*

	Cable connection node, does nothing, stores some amount of matter just so it can transfer it

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';


class sdBSUTurret extends sdEntity
{
	static init_class()
	{
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -5; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	get hard_collision()
	{ return true; }
	
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }
	
	get title()
	{
		return 'Base shielding unit turret';
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
		if ( this._hea > 0 )
		{
			this._hea -= dmg;

			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this.frame = 0;
		
		this._bsu = params.bsu;
		this.ang = 0;
		
		// Extrusion offset, used to draw hole
		this.dx = 0;
		this.dy = 0;
		
		this.x0 = this.x;
		this.y0 = this.y;
		
		this.open = 0;
		
		this._hmax = 200; // Stronger variations have more health
		this._hea = this._hmax;
		this._regen_timeout = 0;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove()
	{
		if ( this._bsu )
		{
			this._bsu._revenge_turret = null;
			this._bsu._revenge_turret_parent = null;
		}
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	Draw( ctx, attached )
	{
		if ( this.frame === 1 )
		ctx.apply_shading = false;
		
		ctx.save();
		{
			ctx.translate( -this.dx, -this.dy );
			
			if ( this.dy !== 0 )
			ctx.rotate( Math.PI / 2 );
		
			ctx.drawImageFilterCache( sdBaseShieldingUnit.img_unit, 32*2,32,32,32, -16, -16, 32,32 );
		}
		ctx.restore();
		
		ctx.save();
		{
			ctx.rotate( this.ang / 100 );

			ctx.drawImageFilterCache( sdBaseShieldingUnit.img_unit, 32*(2+this.frame),0,32,32, -16, -16, 32,32 );
		}
		ctx.restore();
		
		ctx.save();
		{
			ctx.translate( this.x0 - this.x, this.y0 - this.y );
			//ctx.drawImageFilterCache( sdBaseShieldingUnit.img_unit, 32*2,32,32,32, -16, -16, 32,32 );
			
			let old_volumetric_mode = ctx.volumetric_mode;
			ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX_DECAL;
			{
				//ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], 0, 0, w,h, -16,-4, w,h );
				//ctx.fillStyle = '#000000';
				
				/*if ( this.dy !== 0 )
				ctx.fillRect( -5, -0.1, 10, 0.2 );
				else
				ctx.fillRect( -0.1, -5, 0.2, 10 );*/
			
			
				if ( this.dy !== 0 )
				ctx.drawImageFilterCache( sdBaseShieldingUnit.img_unit, 32*3,32,32,32, -16 * this.open / 100, -0.1, 32 * this.open / 100, 0.2 );
				else
				ctx.drawImageFilterCache( sdBaseShieldingUnit.img_unit, 32*3,32,32,32, -0.1, -16 * this.open / 100, 0.2, 32 * this.open / 100 );
			}
			ctx.volumetric_mode = old_volumetric_mode;
		}
		ctx.restore();
	}
}
//sdBSUTurret.init_class();

export default sdBSUTurret;