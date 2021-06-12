import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';


import sdRenderer from '../client/sdRenderer.js';


class sdWorkbench extends sdEntity
{
	static init_class()
	{
		sdWorkbench.img_wb = sdWorld.CreateImageFromFile( 'workbench2' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return 3; }
	get hitbox_y2() { return 16; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			this._update_version++;

			if ( this.hea <= 0 )
			{
				this.remove();
			}
			else
			{
				this._regen_timeout = 30 * 10;
			}
		}
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 5000;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		this._cooldown = 0;
		this.matter_max = 5500;
		this.matter = 100;
		this.delay = 0;
		this.level = 1;
		this.cube_shards = 0;
		this.cube_shards_max = 10;
	}

	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdGun', 'sdBullet', 'sdCharacter' ];
	}

	onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return 2000;
	}
	UpgradeWorkbench()
	{
		if ( this.cube_shards === this.cube_shards_max )
		{
		this.cube_shards = 0;
		this.cube_shards_max += 5;
		this.level++;
		}
		this._update_version++;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		//this._armor_protection_level = 0; // Never has protection unless full health reached
			
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
			if ( this.level > 1 )
			this._armor_protection_level = 4; // If upgraded at least once - it can be only destroyed with big explosions
		}
		
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdGun ) )
		if ( from_entity.class === sdGun.CLASS_CUBE_SHARD )
		if ( this.cube_shards < this.cube_shards_max )
		{
			this.cube_shards++;
			from_entity.remove();
		}
	}
	get title()
	{
		return 'Workbench';
	}
	Draw( ctx, attached )
	{
		ctx.drawImage( sdWorkbench.img_wb, -16, -16, 32, 32 );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Workbench ( " + ~~(this.cube_shards) + " / " + ~~(this.cube_shards_max) + " )", 0, -10 );

		sdEntity.Tooltip( ctx, "Level " + this.level, 0, -3, '#66ff66' );
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 23, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 23, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	}
	onRemoveAsFakeEntity()
	{
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'UPG_WB' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
				}
				else
				{
					executer_socket.SDServiceMessage( 'Workbench is too far' );
					return;
				}
			}
			
			if ( command_name === 'UPG_WB' )
			{
				if ( this.cube_shards === this.cube_shards_max )
				{
					this.UpgradeWorkbench();
				}
				else
				executer_socket.SDServiceMessage( 'Not enough cube shards are stored inside' );
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( this.level < 2 )
			this.AddContextOption( 'Upgrade workbench (Max Cube shards)', 'UPG_WB', [] );
		}
	}
}
//sdWorkbench.init_class();

export default sdWorkbench;
