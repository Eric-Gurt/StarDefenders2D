/*

	Part of a task that makes you carry this thing and scan blocks for cookies.

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdWater from './sdWater.js';
import sdQuickie from './sdQuickie.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';

import sdRenderer from '../client/sdRenderer.js';

class sdLiquidAbsorber extends sdEntity
{
	static init_class()
	{
		sdLiquidAbsorber.img_unit = sdWorld.CreateImageFromFile( 'sdLiquidAbsorber' );
		
		//sdLiquidAbsorber.all_scan_units = [];

		sdLiquidAbsorber.scan_distance = 84;
		sdLiquidAbsorber.cost_per_absorption = 2; // Cost per removed liquid, in matter
		
		sdLiquidAbsorber.cycle_time = 60;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -4; }
	get hitbox_x2() { return 4; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 4; }
	
	
	//Players activate this entity and it removes liquids in it's radius over time for a minor matter cost.
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }

	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	

	Impact( vel ) // fall damage basically
	{
		// No impact damage if has driver (because no headshot damage)
		if ( vel > 5 )
		{
			this.DamageWithEffect( ( vel - 3 ) * 25 );
		}
	}
	
	RequireSpawnAlign()
	{ return true; }
	get spawn_align_x(){ return 4; };
	get spawn_align_y(){ return 4; };

	constructor( params )
	{
		super( params );
		
		//this.sx = 0;
		//this.sy = 0;
		
		this._hmax = 200;
		this._hea = this._hmax;
		//this._hmax_old = this._hmax;
		this._regen_timeout = 0;
		this.enabled = false;
		this.charge = 0;
		this.matter_max = 40;
		this.matter = 0;
		this._allow_liquid_removal = true;
		
		this.toggle_enabled = false; // sdButton thing, makes it work indefinitely
		
		// 1 slot
		
		//sdLiquidAbsorber.all_scan_units.push( this );
	}
	
	get description()
	{
		return 'When placed and charged with matter, liquid absorber absorbs liquid into itself and converts into a toxic gas.';
	}
	onToggleEnabledChange()
	{
		this.SetState();
	}
	SetState()
	{
		if ( this.toggle_enabled )
		{
			if ( !this.enabled )
			{
				this.enabled = true;
				sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:1, pitch:3 });
			}
		}
		else
		{
			this.enabled = !this.enabled;
			sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:1, pitch:3 });
		}
		
		this._update_version++;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = Math.abs( dmg );
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		
		//let old_hea = this._hea;
		
		this._hea -= dmg;

		if ( this._hea <= 0 )
		this.remove();
	
		this._regen_timeout = 30;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		if ( !this.enabled )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	
		if ( this.enabled )
		{
			//this.sx = 0;
			//this.sy = 0;
			if ( this.charge < sdLiquidAbsorber.cycle_time )
			this.charge = Math.min( sdLiquidAbsorber.cycle_time, this.charge + GSPEED );
			else
			{
				this.charge = 0;
				this._allow_liquid_removal = true;
				
				this._update_version++;
			}


			if ( this.charge >= sdLiquidAbsorber.cycle_time )
			{
				//let liquids = sdWorld.GetAnythingNear( this.x, this.y , sdLiquidAbsorber.scan_distance, null, [ 'sdWater' ] );
				let liquids = this.GetAnythingNearCache( this.x, this.y, sdLiquidAbsorber.scan_distance, null, [ 'sdWater' ] );
				
				for ( let i = 0; i < liquids.length; i++ ) // Protect nearby entities inside base unit's radius
				{
					if ( ( liquids[ i ].type === sdWater.TYPE_WATER || liquids[ i ].type === sdWater.TYPE_ACID ) && this._allow_liquid_removal )
					{
						liquids[ i ].remove();
						
						let gas_x = Math.floor( this.x / 16 ) * 16;
						let gas_y = Math.floor( this.y / 16 ) * 16;
						let gas = new sdWater ({ x: gas_x, y: gas_y, type: sdWater.TYPE_TOXIC_GAS });
						sdEntity.entities.push( gas );
						
						this._allow_liquid_removal = false;
						sdSound.PlaySound({ name:'council_teleport', x:this.x, y:this.y, volume:0.2, pitch:15 });
						this.matter = Math.max( 0, this.matter - sdLiquidAbsorber.cost_per_absorption );
						if ( this.matter <= 0 )
						this.SetState();
						break;
						
					}
				}
				if ( this._allow_liquid_removal ) // No liquids were removed
				this.SetState();
				this._update_version++;
			}
		}
		else
		{
			this.charge = 0;
			this._allow_liquid_removal = true;
			this._update_version++;
		}
	}
	
	get title()
	{
		return "Liquid absorber";
	}

	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this._hea <= 0 )
		return;
	
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )", 0, -6 );

		
		this.DrawConnections( ctx );
	}

	DrawConnections( ctx )
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;

		ctx.beginPath();
		ctx.arc( 0, 0, sdLiquidAbsorber.scan_distance, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}

	Draw( ctx, attached )
	{
		let xx = 0;
		if ( this.enabled )
		{
			if ( this.charge >= sdLiquidAbsorber.cycle_time )
			xx = 2;
			else
			xx = 1;
		}
		//ctx.filter = this.filter;
		ctx.drawImageFilterCache( sdLiquidAbsorber.img_unit, xx * 32, 0, 32, 32, - 16, - 16, 32,32 );
		//ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
		
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		
		/*let id = sdLiquidAbsorber.all_scan_units.indexOf( this );
		if ( id !== -1 )
		sdLiquidAbsorber.all_scan_units.splice( id, 1 );*/
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return 300;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
			{
				if ( command_name === 'SCAN_FOR_LIQUIDS' )
				{
					{
						if ( this.matter >= sdLiquidAbsorber.cost_per_absorption )
						this.SetState();
						else
						executer_socket.SDServiceMessage( 'Liquid absorber does not have enough matter.' );
						
						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						this._update_version++;
					}
				}
			}
			else
			executer_socket.SDServiceMessage( 'Liquid absorber is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( sdWorld.my_entity )
			{
				if ( this.enabled === false )
				this.AddContextOption( 'Activate liquid absorber', 'SCAN_FOR_LIQUIDS', [] );
				else
				this.AddContextOption( 'Deactivate liquid absorber', 'SCAN_FOR_LIQUIDS', [] );
			}
		}
	}
}
//sdLiquidAbsorber.init_class();

export default sdLiquidAbsorber;
