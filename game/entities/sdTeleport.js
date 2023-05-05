
/* global sdShop, FakeCanvasContext */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCom from './sdCom.js';
import sdCable from './sdCable.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';


import sdRenderer from '../client/sdRenderer.js';


class sdTeleport extends sdEntity
{
	static init_class()
	{
		sdTeleport.img_teleport = sdWorld.CreateImageFromFile( 'sdTeleport' );

		/*sdTeleport.img_teleport = sdWorld.CreateImageFromFile( 'teleport' );
		sdTeleport.img_teleport_offline = sdWorld.CreateImageFromFile( 'teleport_offline' );
		sdTeleport.img_teleport_no_matter = sdWorld.CreateImageFromFile( 'teleport_no_matter' );*/
		
		sdTeleport.connection_range = 400;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -16; }
	get hitbox_y2() { return 16; }
	
	PrecieseHitDetection( x, y, bullet=null ) // Teleports use this to prevent bullets from hitting them like they do. Only ever used by bullets, as a second rule after box-like hit detection. It can make hitting entities past outer bounding box very inaccurate
	{
		return ( Math.abs( this.x - x ) > 8 && Math.abs( this.y - y ) > 8 );
	}
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_BOX; }
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		if ( layer === 0 )
		return [ 0.01, 0.01, -0.01 ];
	}
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this._hea > 0 )
		{
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;

				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

				this.SetDelay( 90 );

				this._regen_timeout = 60;

				if ( this._hea <= 0 )
				this.remove();
			}
		}
	}
	SetDelay( v )
	{
		if ( v < 0 )
		v = 0;
	
		if ( ( v > 0 ) !== ( this.delay > 0 ) )
		{
			if ( v === 0 )
			sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:1 });
			
			this._update_version++;
		}
		this.delay = v;
	}
	constructor( params )
	{
		super( params );
		
		//this._is_cable_priority = true;
		
		this._hmax = 600;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this.delay = 0;
		//this._update_version++
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter + 50;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		let can_hibernateA = false;
		let can_hibernateB = false;
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
			else
			can_hibernateA = true;
		}
		
		let com_near = this.GetComWiredCache();
		
		//if ( com_near )
		//{
			if ( this.delay > 0 && com_near )
			this.SetDelay( this.delay - GSPEED );
			else
			can_hibernateB = true;
		//}
	
		if ( can_hibernateA && can_hibernateB )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
	}
	get title()
	{
		return 'Teleport node';
	}
	Draw( ctx, attached )
	{
		if ( this.delay === 0 )
		ctx.apply_shading = false;
		
		let xx = 0;

		if ( this.GetComWiredCache() || sdShop.isDrawing )
		{
			if ( this.delay === 0 || sdShop.isDrawing )
			xx = 0;
			//ctx.drawImageFilterCache( sdTeleport.img_teleport, -16, -16, 32,32 );
			else
			xx = 1;
			//ctx.drawImageFilterCache( sdTeleport.img_teleport_offline, -16, -16, 32,32 );
		}
		else
		//ctx.drawImageFilterCache( sdTeleport.img_teleport_no_matter, -16, -16, 32,32 );
		xx = 2;
		ctx.drawImageFilterCache( sdTeleport.img_teleport, xx * 32, 0, 32, 32, - 16, - 16, 32,32 );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
		
		//this.DrawConnections( ctx );
	}

	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( this.delay === 0 )
		if ( !from_entity.is_static )
		if ( from_entity.GetClass() !== 'sdEffect' )
		if ( from_entity.GetClass() !== 'sdGun' || from_entity._held_by === null )
		if ( this.DoesOverlapWith( from_entity ) ) // Prevent bug that causes overlapping 2 telerpots make player teleports twice as further and raid some bases
		{
			let com_near = this.GetComWiredCache();

			if ( com_near )
			{
				let allowed = false;

				if ( 
						com_near.subscribers.indexOf( from_entity._net_id ) !== -1 || 
						com_near.subscribers.indexOf( from_entity.biometry ) !== -1 || 
						com_near.subscribers.indexOf( from_entity.GetClass() ) !== -1 || 
						com_near.subscribers.indexOf( '*' ) !== -1 )
				{
					allowed = true;
				}


				if ( allowed )
				{
				
					let from_entity_group = from_entity.getTeleportGroup();

					let best_tele = this.GetComWiredCache( ( tele )=>
					{
						if ( tele.is( sdTeleport ) )
						if ( tele.delay === 0 ) // is active
						{
								
							for ( let i = 0; i < from_entity_group.length; i++ )
							{
								let e = from_entity_group[ i ];

								if ( !e.CanMoveWithoutOverlap( e.x + tele.x - this.x, 
															  e.y + tele.y - this.y, 0 ) )
								return false;
							}
								
							return true;
						}
						return false;
					});

					if ( best_tele )
					{
						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						best_tele.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

						this.SetDelay( 90 );
						best_tele.SetDelay( 90 );

						sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
						sdSound.PlaySound({ name:'teleport', x:best_tele.x, y:best_tele.y, volume:0.5 });
						
						for ( let i = 0; i < from_entity_group.length; i++ )
						{
							let e = from_entity_group[ i ];
							
							sdWorld.SendEffect({ x:e.x + (e.hitbox_x1+e.hitbox_x2)/2, y:e.y + (e.hitbox_y1+e.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });

							from_entity.x += best_tele.x - this.x;
							from_entity.y += best_tele.y - this.y;

							if ( e.IsPlayerClass() )
							{
								from_entity.ApplyServerSidePositionAndVelocity( true, 0, 0 );
							}

							if ( e.is( sdBaseShieldingUnit ) )
							{
								from_entity.charge = 0;
							}

							sdWorld.SendEffect({ x:e.x + (e.hitbox_x1+e.hitbox_x2)/2, y:e.y + (e.hitbox_y1+e.hitbox_y2)/2, type:sdEffect.TYPE_TELEPORT });
						}
					}
				}
			}
		}
	}
	onRemove() // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'block4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdTeleport.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,y,a,s;
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			for ( y = step_size / 2; y < 32; y += step_size )
			if ( Math.abs( 16 - x ) > 7 && Math.abs( 16 - y ) > 7 )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}
		}
	}
}
//sdTeleport.init_class();

export default sdTeleport;