
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCom from './sdCom.js';


import sdRenderer from '../client/sdRenderer.js';


class sdTeleport extends sdEntity
{
	static init_class()
	{
		sdTeleport.img_teleport = sdWorld.CreateImageFromFile( 'teleport' );
		sdTeleport.img_teleport_offline = sdWorld.CreateImageFromFile( 'teleport_offline' );
		
		sdTeleport.connection_range = 400;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -16; }
	get hitbox_y2() { return 16; }
	
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
		
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
			this.SetDelay( 90 );
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
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
		
		this._hmax = 500;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
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
		
		if ( this.delay > 0 )
		this.SetDelay( this.delay - GSPEED );
		else
		can_hibernateB = true;
	
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
		ctx.drawImage( sdTeleport.img_teleport, -16, -16, 32,32 );
		else
		ctx.drawImage( sdTeleport.img_teleport_offline, -16, -16, 32,32 );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
		
		this.DrawConnections( ctx );
	}
	DrawConnections( ctx )
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;

		for ( var i = 0; i < sdEntity.entities.length; i++ )
		if ( ( sdEntity.entities[ i ].GetClass() === 'sdCom' && sdWorld.Dist2D( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this.x, this.y ) < sdCom.retransmit_range ) || 
			 ( sdEntity.entities[ i ].GetClass() === 'sdTeleport' && sdWorld.Dist2D( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this.x, this.y ) < sdTeleport.connection_range ) )
		if ( sdWorld.CheckLineOfSight( this.x, this.y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) )
		if ( sdWorld.CheckLineOfSight( this.x, this.y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, null, sdCom.com_visibility_unignored_classes ) )
		{
			ctx.beginPath();
			ctx.moveTo( sdEntity.entities[ i ].x - this.x, sdEntity.entities[ i ].y - this.y );
			ctx.lineTo( 0,0 );
			ctx.stroke();
		}

		ctx.beginPath();
		ctx.arc( 0,0, sdTeleport.connection_range, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( this.delay === 0 )
		if ( !from_entity.is_static )
		if ( from_entity.GetClass() !== 'sdEffect' )
		if ( from_entity.GetClass() !== 'sdGun' || from_entity._held_by === null )
		{
			let coms_near = sdWorld.GetComsNear( this.x, this.y, null, null, true );

			let allowed = ( coms_near.length === 0 );

			for ( let i = 0; i < coms_near.length; i++ )
			if ( coms_near[ i ].subscribers.indexOf( from_entity._net_id ) !== -1 || coms_near[ i ].subscribers.indexOf( from_entity.GetClass() ) !== -1 )
			{
				allowed = true;
				break;
			}

			if ( allowed )
			{
				let nearbies = sdWorld.GetAnythingNear( this.x, this.y, sdTeleport.connection_range );

				let best_tele = null;
				let best_di = -1;
				for ( var i = 0; i < nearbies.length; i++ )
				{
					if ( nearbies[ i ].GetClass() === 'sdTeleport' )
					{
						let tele = nearbies[ i ];
						if ( tele.delay === 0 ) // is active
						if ( tele !== this )
						{
							let di = sdWorld.Dist2D( this.x, this.y, tele.x, tele.y );
							if ( di < best_di || best_tele === null )
							{
								//if ( from_entity.CanMoveWithoutOverlap( from_entity.x + tele.x - this.x, 
								//										from_entity.y + tele.y - this.y, 1 ) )
								if ( from_entity.CanMoveWithoutOverlap( from_entity.x + tele.x - this.x, 
																		from_entity.y + tele.y - this.y, 0 ) )
								{
									best_tele = tele;
									best_di = di;
								}
							}
						}
					}
				}

				if ( best_tele )
				{
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					best_tele.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					
					this.SetDelay( 90 );
					best_tele.SetDelay( 90 );

					from_entity.x += best_tele.x - this.x;
					from_entity.y += best_tele.y - this.y;
					
					if ( from_entity.GetClass() === 'sdCharacter' )
					{
						from_entity.ApplyServerSidePositionAndVelocity( true, 0, 0 );
					}

					sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
					sdSound.PlaySound({ name:'teleport', x:best_tele.x, y:best_tele.y, volume:0.5 });
				}
			}
			else
			{
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					
				// Unauthorized access
				this.SetDelay( 90 );
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