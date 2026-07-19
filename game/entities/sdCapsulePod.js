/*

	sdLifeBox redesign basically

*/

/* global Infinity, sdModeration, sdShop */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdGun from './sdGun.js';
import sdCom from './sdCom.js';
import sdTimer from './sdTimer.js';

import sdSound from '../sdSound.js';

import sdRenderer from '../client/sdRenderer.js';

class sdCapsulePod extends sdEntity
{
	static init_class()
	{
		sdCapsulePod.img = sdWorld.CreateImageFromFile( 'sdLifeBox' );
		
		sdCapsulePod.ACTION_IDLING = 0;
		sdCapsulePod.ACTION_CHECKING_PHONE_START1 = 1;
		sdCapsulePod.ACTION_CHECKING_PHONE_START2 = 2;
		sdCapsulePod.ACTION_CHECKING_PHONE_IDLING = 3;
		sdCapsulePod.ACTION_CHECKING_PHONE_STOP1 = 4;
		sdCapsulePod.ACTION_CHECKING_PHONE_STOP2 = 5;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
		
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -8; }
	get hitbox_y2() { return 8; }

	ObjectOffset3D( layer ) // Layer values: -1 for BG, 0 for normal, 1 for FG. Returns [ x, y, z ] offset or null
	{ 
		return [ 0, 0, -32.1 ];
	}
	
	get hard_collision()
	{ return false; }
		
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }

	get title()
	{
		return 'Capsule pod';
	}
	get description()
	{
		return `A tiny room to have some peaceful yet slightly claustrophobic time in. Can be protected with Base Shielding Unit.`;
	}
		
	PrecieseHitDetection( x, y, bullet=null ) // Teleports use this to prevent bullets from hitting them like they do. Only ever used by bullets, as a second rule after box-like hit detection. It can make hitting entities past outer bounding box very inaccurate. Can be also used to make it ignore certain bullet kinds altogether
	{
		if ( bullet )
		{
			if ( bullet._bg_shooter )
			{
				return true;
			}
			else
			if ( bullet._gun && sdWorld.entity_classes.sdGun.classes[ bullet._gun.class ] )
			{
				return ( 
					sdWorld.entity_classes.sdGun.classes[ bullet._gun.class ].is_sword ||
					sdWorld.entity_classes.sdGun.classes[ bullet._gun.class ].slot === 0 || // Some sword-like guns (fists, deconstruction hammers yet can't be thrown to deal damage) have slot 0
					bullet._gun.class === sdGun.CLASS_CABLE_TOOL ||
					bullet._gun.class === sdGun.CLASS_WELD_TOOL );
			}
			return false;
		}
		
		return true;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
		if ( this._hea > 0 )
		{
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;

				this._regen_timeout = 60;

				if ( this._hea <= 0 )
				{
					sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.25, pitch: 1.3 });
					this.remove();
				}
			}
			
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 300;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this.driver0 = null;
		this.occupied = 0;
		
		this._action = sdCapsulePod.ACTION_IDLING;
		this._action_change_timer = 0;
		this._phone_brightness = 0;
		
		this._sleep_timer = null;
		
		this.hue = params.hue || 0;
		this.is_sleeping = 0;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );

		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( this.occupied )
			{
				if ( this._action_change_timer <= 0 )
				{
					this._action_change_timer = 30;
					
					if ( this._action === sdCapsulePod.ACTION_IDLING )
					{
						if ( this.is_sleeping )
						{
						}
						else
						{
							this._action = sdCapsulePod.ACTION_CHECKING_PHONE_START1;
							this._action_change_timer = 10;
						}
					}
					else
					if ( this._action === sdCapsulePod.ACTION_CHECKING_PHONE_START1 )
					{
						this._action = sdCapsulePod.ACTION_CHECKING_PHONE_START2;
						this._action_change_timer = 10;
					}
					else
					if ( this._action === sdCapsulePod.ACTION_CHECKING_PHONE_START2 )
					{
						this._action = sdCapsulePod.ACTION_CHECKING_PHONE_IDLING;
						this._action_change_timer = 20;
					}
					else
					if ( this._action === sdCapsulePod.ACTION_CHECKING_PHONE_IDLING )
					{
						if ( this._phone_brightness === 0 )
						{
							this._phone_brightness = 0.3 + Math.random() * 0.7;
							this._action_change_timer = ( 1 + Math.random() * 3 ) * 30;
						}
						else
						{
							if ( this.is_sleeping || Math.random() < 0.2 )
							{
								this._phone_brightness = 0;
								this._action = sdCapsulePod.ACTION_CHECKING_PHONE_STOP1;
								this._action_change_timer = 10;
							}
							else
							{
								this._phone_brightness = 0.3 + Math.random() * 0.7;
								this._action_change_timer = ( 1 + Math.random() * 3 ) * 30;
							}
						}
					}
					else
					if ( this._action === sdCapsulePod.ACTION_CHECKING_PHONE_STOP1 )
					{
						this._action = sdCapsulePod.ACTION_CHECKING_PHONE_STOP2;
						this._action_change_timer = 10;
					}
					else
					if ( this._action === sdCapsulePod.ACTION_CHECKING_PHONE_STOP2 )
					{
						this._action = sdCapsulePod.ACTION_IDLING;
						this._action_change_timer = ( 1 + Math.random() * 15 ) * 30;
					}
				}
				else
				{
					this._action_change_timer -= GSPEED;
				}
			}
			else
			{
				this._phone_brightness = 0;
				this._action_change_timer = ( 1 + Math.random() * 15 ) * 30;
			}
		}
		else
		if ( this._hea >= this._hmax )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	onRemoveAsFakeEntity()
	{
	}
	
	ExecuteContextCommand( command_name, parameters_array, executer_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). executer_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( executer_character )
		if ( executer_character.hea > 0 )
		if (
				(
					sdWorld.inDist2D_Boolean( this.x, this.y, executer_character.x, executer_character.y, 46 )
					&&
					executer_socket.character.canSeeForUse( this )
				)
			)
		{
			if ( command_name === 'PRESS_BUTTON' )
			{
				this.AddDriver( executer_character );
			}
		}
	}
	PopulateContextOptions( executer_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( executer_character )
		if ( executer_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, executer_character.x, executer_character.y, 46 ) )
		if ( executer_character.canSeeForUse( this ) )
		{
			this.AddContextOption( 'Enter', 'PRESS_BUTTON', [] );
		}
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
	}
	DrawBG( ctx, attached )
	{
		this.DrawOnALayer( ctx, attached );
	}
	
	DrawOnALayer( ctx, attached )
	{
		let xx = ( this.occupied || sdShop.isDrawing ) ? 32 : 0;
		let yy = 0;

		ctx.apply_shading = !this.occupied;
		
		if ( xx !== 0 )
		{
			if ( this._action === sdCapsulePod.ACTION_CHECKING_PHONE_START1 ||
				 this._action === sdCapsulePod.ACTION_CHECKING_PHONE_STOP2 )
			yy = 16;
			else
			if ( this._action === sdCapsulePod.ACTION_CHECKING_PHONE_START2 ||
				 this._action === sdCapsulePod.ACTION_CHECKING_PHONE_STOP1 ||
				 this._action === sdCapsulePod.ACTION_CHECKING_PHONE_IDLING )
			yy = 32;
	
			if ( this.is_sleeping && this._action === sdCapsulePod.ACTION_IDLING )
			{
				xx = 64;
				yy = 0;
				ctx.apply_shading = false;
			}
		}
		
		ctx.sd_hue_rotation = this.hue;
		ctx.drawImageFilterCache( sdCapsulePod.img, xx,yy, 32,16,-16,-8,32,16 );
		if ( this._phone_brightness > 0 )
		{
			ctx.globalAlpha = this._phone_brightness;
			ctx.drawImageFilterCache( sdCapsulePod.img, 0,16, 32,16,-16,-8,32,16 );
			ctx.globalAlpha = 1;
		}
		ctx.sd_hue_rotation = 0;
	}
	onAfterDriverAdded( slot )
	{
		this.occupied = 1;
		this.is_sleeping = 0;
		this._update_version++;
		
		if ( this._sleep_timer )
		{
			this._sleep_timer.Cancel();
			this._sleep_timer = null;
		}
		
		this._sleep_timer = sdTimer.ExecuteWithDelay( ( timer )=>{

			if ( !this.driver0 || this.driver0._is_being_removed )
			{
			}
			else
			if ( this.driver0._socket )
			{
				timer.ScheduleAgain( 30 * 1000 );
				return;
			}
			else
			{
				this.is_sleeping = 1;
				this._update_version++;
			}
			this._sleep_timer = null;
				
		}, 30 * 1000 );
	}
	onAfterDriverExcluded( slot, character )
	{
		// Note: exit position is decided in ExcludeDriver (LOS-guarded against the
		// "seal the pod to phase through walls" raid exploit). Do NOT override
		// character.x/character.y here or that protection is defeated.
		this.occupied = 0;
		this._update_version++;

		if ( this._sleep_timer )
		{
			this._sleep_timer.Cancel();
			this._sleep_timer = null;
		}
	}
	HasNearbySlabDoor() // Thin (slab/gate) doors are the only geometry whose hitbox is narrow enough for the unstuck logic to squeeze a sealed-in player through to the far side of a wall. Regular doors and full blocks aren't exploitable this way.
	{
		const margin = 40; // Wide enough to catch a slab door flush against any side of the pod

		return sdWorld.CheckWallExistsBox(
			this.x + this._hitbox_x1 - margin, this.y + this._hitbox_y1 - margin,
			this.x + this._hitbox_x2 + margin, this.y + this._hitbox_y2 + margin,
			null, null, [ 'sdDoor' ], ( e )=>( e.w < 16 || e.h < 16 )
		);
	}
	ExcludeDriver( c, force=false ) // Overridden to guard against the "seal the pod next to a slab door, then wall it in" raid exploit. Away from a slab door, exits stay as permissive as on any other vehicle (never refused) so stacked pods / corner placements can't lock the player in.
	{
		if ( !force )
		if ( !sdWorld.is_server )
		return;

		for ( var i = 0; i < this.GetDriverSlotsCount(); i++ )
		{
			if ( this[ 'driver' + i ] === c )
			{
				let exit_x = this.x;
				let exit_y = this.y;

				if ( !force )
				{
					// Only near a slab door is the exit's line of sight worth checking at all -
					// that's the only geometry thin enough for the unstuck logic to have squeezed
					// a sealed-in player through to the far side of a wall.
					let near_slab_door = this.HasNearbySlabDoor();

					// Candidate exit spots around the pod, cardinal directions.
					let cands = [
						[ this.x,                                  this.y + this._hitbox_y1 - c._hitbox_y2 ], // above
						[ this.x + this._hitbox_x1 - c._hitbox_x2, this.y ],                                  // left
						[ this.x + this._hitbox_x2 - c._hitbox_x1, this.y ],                                  // right
						[ this.x,                                  this.y + this._hitbox_y2 - c._hitbox_y1 ]   // below
					];

					let found = false;

					for ( var ci = 0; ci < cands.length; ci++ )
					{
						let cx = cands[ ci ][ 0 ];
						let cy = cands[ ci ][ 1 ];

						// Spot must be free and, only when a slab door is nearby, also reachable in a
						// straight line from the pod center without crossing a wall - so the player can
						// never be relocated to the far (interior) side of a base wall through one.
						if ( c.CanMoveWithoutOverlap( cx, cy, 0 ) )
						if ( !near_slab_door || sdWorld.CheckLineOfSight( this.x, this.y, cx, cy, this, sdCom.com_visibility_ignored_classes, null ) )
						{
							exit_x = cx;
							exit_y = cy;
							found = true;
							break;
						}
					}

					if ( !found && near_slab_door )
					{
						// Pod is sealed next to a slab door - refuse to eject rather than phase the player through it.
						if ( c._socket )
						c._socket.SDServiceMessage( 'The Capsule pod is sealed - clear the blocks around it before exiting' );

						return;
					}
					// If nothing was found and there's no slab door nearby, exit_x/exit_y stays at the pod
					// center - same as every other vehicle falls back to - rather than trapping the player.
				}

				this[ 'driver' + i ] = null;
				c.driver_of = null;
				c.SetCameraZoom( sdWorld.default_zoom );

				c.x = exit_x;
				c.y = exit_y;

				c.PhysWakeUp();

				if ( c._socket )
				c._socket.SDServiceMessage( 'Leaving vehicle' );

				this.onAfterDriverExcluded( i, c );

				return;
			}
		}

		if ( c._socket )
		c._socket.SDServiceMessage( 'Error: Attempted leaving vehicle in which character is not located.' );
	}
	IsVehicle()
	{
		return true;
	}
	ObfuscateAnyDriverInformation() // In case if vehicle is supposed to hide drivers completely. Use together with altering GetSnapshot to use GetDriverObfuscatingSnapshot
	{
		return true;
	}
	GetSnapshot( current_frame, save_as_much_as_possible=false, observer_entity=null )
	{
		return this.GetDriverObfuscatingSnapshot( current_frame, save_as_much_as_possible, observer_entity );
	}
	
	GetDriverSlotsCount() // Not specfiying this will cause phantom effect on drivers after entity was destroyed
	{
		return 1;
	}
	GetDriverZoom()
	{
		return sdWorld.default_zoom * 2;
	}
	
	MeasureMatterCost()
	{
		return 100;
	}
	
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 8; };
}

export default sdCapsulePod;
