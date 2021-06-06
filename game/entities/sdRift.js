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
import sdJunk from './sdJunk.js';


import sdRenderer from '../client/sdRenderer.js';


class sdRift extends sdEntity
{
	static init_class()
	{
		sdRift.img_rift_anim = sdWorld.CreateImageFromFile( 'rift_anim' );
		sdRift.portals = 0;
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
		this._teleport_timer = 30 * 60 * 10; // Time for the portal to switch location
		this._time_until_teleport = this._teleport_timer;
		this.type = params.type || 1; // Default is the weakest variation of the rift ( Note: params.type as 0 will be defaulted to 1, implement typeof check here if 0 value is needed )
		this._rotate_timer = 10; // Timer for rotation sprite index
		this.frame = 0; // Rotation sprite index
		this.scale = 1; // Portal scaling when it's about to be destroyed/removed
		this.teleport_alpha = 0; // Alpha/transparency ( divided by 60 in draw code ) when portal is about to change location

		/*if ( this.type === 1 )
		this.filter = 'hue-rotate(' + 75 + 'deg)';
		if ( this.type === 2 )
		this.filter = 'none';*/

		sdRift.portals++;
	}
	GetFilterColor()
	{
		/*if ( this.type === 1 )
		this.filter = 'hue-rotate(' + 75 + 'deg)';
		if ( this.type === 2 )
		this.filter = 'none';*/
	
		if ( this.type === 1 )
		return 'hue-rotate(' + 75 + 'deg)';
	
		if ( this.type === 2 )
		return 'none';
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( this._rotate_timer > 0 ) // Sprite animation handling
			this._rotate_timer -= GSPEED;
			else
			{
				this.frame++;
				if ( this.frame > 6 )
				this.frame = 0;
				this._rotate_timer = 10 * this.scale;
			}
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
				sdSound.PlaySound({ name:'rift_spawn1', x:this.x, y:this.y, volume:2 });
				
				// Delaying to match sound
				setTimeout( ()=>
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
								type:2
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
								kind: ( ( sdCube.alive_huge_cube_counter < sdWorld.GetPlayingPlayersCount() ) && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.1 ) ) ?
										 1 : ( sdCube.alive_white_cube_counter < 1 && ( sdCube.alive_cube_counter >= 2 && Math.random() < 0.04 ) ) ? 
										 2 : ( sdCube.alive_pink_cube_counter < 2 && ( sdCube.alive_cube_counter >= 1 && Math.random() < 0.14 ) ) ? 3 : 0 // _kind = 1 -> is_huge = true , _kind = 2 -> is_white = true , _kind = 3 -> is_pink = true
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
				}, 1223 );

				this._spawn_timer_cd = this._spawn_timer; // Reset spawn timer countdown
			}
			
			if ( this.matter_crystal > 0 ) // Has the rift drained any matter?
			{
				this.hea = Math.max( this.hea - 1, 0 );
				this.matter_crystal--;
				this._update_version++;
			}
			if ( this._time_until_teleport > 0 )
			{
				this._time_until_teleport -= GSPEED;
				this.teleport_alpha = Math.min( this.teleport_alpha + GSPEED, 60 );
			}
			else
			if ( this._time_until_teleport <= 0 )
			this.teleport_alpha = Math.max( this.teleport_alpha - GSPEED, 0 );
			if ( this.teleport_alpha <= 0 && this._time_until_teleport <= 0 ) // Relocate the portal
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
						x + this._hitbox_x1 - 16, 
						y + this._hitbox_y1 - 16, 
						x + this._hitbox_x2 + 16, 
						y + this._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
					{
						this.x = x;
						this.y = y;
					}
				}  while( tr > 0 );
				this._time_until_teleport = this._teleport_timer;
			}

			if ( this.hea <= 0 )
			{
				this.scale -= 0.0025 / GSPEED;
			}
			if ( this.scale <= 0 )
			{
				let r = Math.random();

				if ( r < ( 0.13 + ( 0.05 * this.type ) ) )
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

		if ( this.teleport_alpha < 55 ) // Prevent crystal feeding if it's spawning or dissapearing
		return;

		if ( from_entity.is( sdCrystal ) )
		{
			if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
			{
				sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2 });

				this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + from_entity.matter_max); // Drain the crystal for it's max value and destroy it
				this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating if it didn't drain matter
				this._update_version++;
				from_entity.remove();
			}
		}

		if ( from_entity.is( sdJunk ) )
		if ( from_entity.type === 1 ) // Is it an alien battery?
		if ( this.type !== 2 ) // The portal is not a "cube" one?
		{
			this.type = 2;
			//this.GetFilterColor();
			this._regen_timeout = 30 * 60 * 20; // 20 minutes until it starts regenerating
			this._update_version++;

			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius:30,
				damage_scale: 0.01, // Just a decoration effect
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this,
				color:'#33FFFF' 
			});

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
		let frame = this.frame;
		
		ctx.filter = this.GetFilterColor(); // this.filter;
		
		ctx.globalAlpha = this.teleport_alpha / 60;
		ctx.scale( 0.75 * this.scale + ( 0.25 * this.hea / this.hmax ), 0.75 * this.scale + ( 0.25 * this.hea / this.hmax ) );
		ctx.drawImageFilterCache( sdRift.img_rift_anim, frame * 32, 0, 32, 32, - 16, - 16, 32,32 );
		ctx.globalAlpha = 1;
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
		sdRift.portals--;
		//this.onRemoveAsFakeEntity();

		if ( this._broken )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:30,
			damage_scale: 0.01, // Just a decoration effect
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this,
			color:'#FFFFFF' 
		});
	}
	onRemoveAsFakeEntity()
	{
	}
}
//sdRift.init_class();

export default sdRift;
