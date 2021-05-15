import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdQuickie from './sdQuickie.js';
import sdAsp from './sdAsp.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdCube from './sdCube.js';


import sdRenderer from '../client/sdRenderer.js';


class sdRift extends sdEntity
{
	static init_class()
	{
		sdRift.img_rift = sdWorld.CreateImageFromFile( 'rift' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -15; }
	get hitbox_y2() { return 15; }

	get hard_collision()
	{ return false; }
	
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null ) // Not that much useful since it cannot be damaged by anything but matter it contains.
	{
		if ( !sdWorld.is_server )
		return;
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 2560; // a 2560 matter crystal is enough for a rift to be removed over time
		this.hea = this.hmax;
		this._regen_timeout = 0;
		this._cooldown = 0;
		this.matter_crystal_max = 5120; // a 5K crystal is max what it can be fed with
		this.matter_crystal = 0; // Named differently to prevent matter absorption from entities that emit matter
		this._spawn_timer = params._spawn_timer || 30 * 60; // Either defined by spawn or 60 seconds
		this._spawn_timer_cd = this._spawn_timer; // Countdown/cooldown for spawn timer
		this._time_until_teleport = 30 * 1; // Time for the portal to switch location
		this._teleport_timer = 30 * 1;
		this.type = params.type || 1; // Default is the weakest variation of the rift

		if ( this.type === 1 )
		this.filter = 'none';
		if ( this.type === 2 )
		this.filter = 'hue-rotate(' + 300 + 'deg) saturate( 1 )';
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._spawn_timer_cd > 0 ) // Spawn entity timer
			this._spawn_timer_cd -= GSPEED;
			if ( this._regen_timeout > 0 )
			this._regen_timeout -= GSPEED;
			else
			{
				if ( this.hea < this.hmax )
				{
					this.hea = Math.min( this.hea + GSPEED, this.hmax );
				
					//if ( sdWorld.is_server )
					//this.hea = this.hmax; // Hack
				
					this._update_version++;
				}
			}
			if ( this._spawn_timer_cd <= 0 ) // Spawn an entity
			if ( this.CanMoveWithoutOverlap( this.x, this.y, 0 ) )
			{
				if ( this.type === 1 ) // Quickies and Asps
				{
					let spawn_type = Math.random();
					if ( spawn_type < 0.333 )
					{
						if ( sdAsp.asps_tot < 25 ) // Same amount as in sdWeather
						{
							let asp = new sdAsp({ 
								x:this.x,
								y:this.y
							});
							sdEntity.entities.push( asp );
							sdWorld.UpdateHashPosition( asp, false ); // Prevent intersection with other ones
						}
					}
					else
					if ( sdQuickie.quickies_tot < 25 )
					{
						let quickie = new sdQuickie({ 
							x:this.x,
							y:this.y,
							type:2,
						});
						let quickie_filter = {};
					        sdWorld.ReplaceColorInSDFilter( quickie_filter, '#000000', '#FF00FF' ) // Pink, stronger quickies
						quickie.sd_filter = quickie_filter;
						sdEntity.entities.push( quickie );
						sdWorld.UpdateHashPosition( quickie, false ); // Prevent intersection with other ones
					}
				}
				if ( this.type === 2 ) // Cube portal
				{
					if ( sdCube.alive_cube_counter < 20 )
					{
						let cube = new sdCube({ 
							x:this.x,
							y:this.y,
							is_huge: ( sdCube.alive_huge_cube_counter >= sdWorld.GetPlayingPlayersCount() ) ? false : ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.1 )
						});
						cube.sy += ( 10 - ( Math.random() * 20 ) );
						cube.sx += ( 10 - ( Math.random() * 20 ) );
						sdEntity.entities.push( cube );

						if ( !cube.CanMoveWithoutOverlap( cube.x, cube.y, 0 ) )
						{
							cube.remove();
						}
						else
						sdWorld.UpdateHashPosition( cube, false ); // Prevent inersection with other ones
					}
				}

				this._spawn_timer_cd = this._spawn_timer; // Reset spawn timer countdown
			}
				if ( this.matter_crystal > 0 ) // Has the rift drained any matter?
				{
					this.hea--;
					this.matter_crystal--;
					this._update_version++;
				}
				if ( this._time_until_teleport > 0 )
				{
					this._time_until_teleport -= GSPEED;
				}
				else // Relocate the portal
				{
					let x,y,i;
					let tr = 1000;
					do
					{
						tr--;
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

						if ( this.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !this.CanMoveWithoutOverlap( x, y + 24, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
							x + this.hitbox_x1 - 16, 
							y + this.hitbox_y1 - 16, 
							x + this.hitbox_x2 + 16, 
							y + this.hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							/*let di_allowed = true;
										
										for ( i = 0; i < sdWorld.sockets.length; i++ )
										if ( sdWorld.sockets[ i ].character )
										{
											let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
											
											if ( di < 500 )
											{
												di_allowed = false;
												break;
											}
										}
							if ( di_allowed === true )*/
							{
								this.x = x;
								this.y = y;
							}
						}
					}  while( tr > 0 );
					this._time_until_teleport = this._teleport_timer;
				}
				if ( this.hea <= 0 )
				{
					let r = Math.random();
			
					if ( r < 0.125 )
					{
						let x = this.x;
						let y = this.y;
						//let sx = this.sx;
						//let sy = this.sy;

						setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

						let gun;
						gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
						gun.extra = 1;

						//gun.sx = sx;
						//gun.sy = sy;
						sdEntity.entities.push( gun );
				
						}, 500 );
					}
					this.remove();
					return;
				}
		}
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;

		if ( from_entity.is( sdCrystal ) )
		{
			this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + from_entity.matter_max); // Drain the crystal for it's max value and destroy it
			this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating if it didn't drain matter
			this._update_version++;
			from_entity.remove();
		}
	}
	get title()
	{
		//if ( this.matter_crystal < this.hea)
		return 'Dimensional portal';
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		ctx.scale( 0.75 + ( 0.25 * this.hea / this.hmax ), 0.75 + ( 0.25 * this.hea / this.hmax ) );
		ctx.drawImageFilterCache( sdRift.img_rift, -16, -16, 32, 32);
		ctx.filter = 'none';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.matter_crystal < this.hea )
		sdEntity.Tooltip( ctx, "Dimensional portal", 0, 0 );
		else
		sdEntity.Tooltip( ctx, "Dimensional portal (overcharged)", 0, 0 ); // Lets players know it has enough matter to destroy itself
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
	}
}
//sdRift.init_class();

export default sdRift;
