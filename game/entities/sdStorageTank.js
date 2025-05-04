
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdWater from './sdWater.js';
import sdBlock from './sdBlock.js';
import sdEffect from './sdEffect.js';
import sdCrystal from './sdCrystal.js';

class sdStorageTank extends sdEntity
{
	static init_class()
	{
		sdStorageTank.img_storage_tank = sdWorld.CreateImageFromFile( 'storage_tank' );

		sdStorageTank.TYPE_LARGE = 0;
		sdStorageTank.TYPE_PORTABLE = 1;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === sdStorageTank.TYPE_PORTABLE ? -10 : -14; }
	get hitbox_x2() { return this.type === sdStorageTank.TYPE_PORTABLE ? 10 : 14; }
	get hitbox_y1() { return this.type === sdStorageTank.TYPE_PORTABLE ? -17 : -31; }
	get hitbox_y2() { return 16; }
	
	get spawn_align_x(){ return 16; };
	get spawn_align_y(){ return 16; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	// get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	// { return this.type === sdStorageTank.TYPE_LARGE; }
	
	RequireSpawnAlign()
	{ return this.type === sdStorageTank.TYPE_LARGE; }

	get mass() { return this.type === sdStorageTank.TYPE_PORTABLE ? ( 30 + ( this.liquid.amount * ( this.liquid.type === sdWater.TYPE_TOXIC_GAS || this.liquid.type === sdWater.TYPE_ANTIMATTER ? 0 : 0.06 ) ) ) : 1000; }
	constructor( params )
	{
		super( params );

		this.type = params.type || sdStorageTank.TYPE_LARGE;

		if ( this.type === sdStorageTank.TYPE_PORTABLE )
		{
			this.sx = 0;
			this.sy = 0;
		}

		this.liquid = { 
			max: this.type === sdStorageTank.TYPE_PORTABLE ? 500 : 1000, // 5 & 10 water entities worth
			amount: 0, 
			type: -1, 
			extra: 0 // Used for essence
		};
		
		this._transfer_mode = 0;
		
		this._last_sync_liquid = this.liquid.amount;
		
		this._hmax = sdStorageTank.TYPE_PORTABLE ? 1280 : 2560;
		this.hea = this._hmax;
		
		this._ignore_pickup_tim = 0;

		this._regen_timeout = 0;

		this._offset_x = ~~( Math.random() * 32 );

		this.destruction_frame = 0;
		this.HandleDestructionUpdate();
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.hea -= dmg;

		this.HandleDestructionUpdate();
		
		if ( this.hea <= 0 )
		this.remove();
	
		this._regen_timeout = 60;
		
		// if ( this.is_static )
		// this._update_version++; // Just in case
	}
	LiquidTransferMode() // 0 - balance liquids, 1 - only give liquids, 2 - only take liquids
	{
		return this._transfer_mode;
	}
	SetTransferMode( to )
	{
		this._transfer_mode = to;

		// this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

		// if ( this.is_static )
		// this._update_version++;
	}
	IsLiquidTypeAllowed( type )
	{
		if ( type === -1 )
		return true;

		return ( this.liquid.type === -1 || this.liquid.type === type ); // Accepts all liquid types
	}
	HandleDestructionUpdate()
	{
		let old_destruction_frame = this.destruction_frame;
		
		if ( this.hea > this._hmax / 4 * 3 )
		this.destruction_frame = 0;
		else
		if ( this.hea > this._hmax / 4 * 2 )
		this.destruction_frame = 1;
		else
		if ( this.hea > this._hmax / 4 * 1 )
		this.destruction_frame = 2;
		else
		this.destruction_frame = 3;
		
		// if ( this.is_static )
		// if ( this.destruction_frame !== old_destruction_frame )
		// this._update_version++;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.type === sdStorageTank.TYPE_PORTABLE )
		this.sy += sdWorld.gravity * GSPEED;
		
		// let can_hibernate1 = false;
		// let can_hibernate2 = false;
		
		if ( this._ignore_pickup_tim > 0 )
		this._ignore_pickup_tim = Math.max( 0, this._ignore_pickup_tim - GSPEED );
		// else
		// can_hibernate1 = true;

		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this._hmax )
			{
				this.hea = Math.min( this.hea + GSPEED, this._hmax );
			}
			// else
			// can_hibernate2 = true;

			if ( this.type === sdStorageTank.TYPE_LARGE )
			this.HandleDestructionUpdate();
		}

		this.GiveLiquid( 0.01, GSPEED );

		if ( this.liquid.amount <= 0 || ( this.liquid.type === sdWater.TYPE_ESSENCE && this.liquid.extra <= 0 ) )
		{
			this.liquid.amount = 0;
			this.liquid.type = -1;
			this.liquid.extra = 0;
		}

		/*if ( can_hibernate1 && can_hibernate2 )
		if ( sdWorld.is_server ) // Server-only. Clients will have to update hitbox
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );*/

		if ( this.type === sdStorageTank.TYPE_PORTABLE )
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}

	get title()
	{
		let t = 'Empty';

		if ( this.liquid )
		{
			if ( this.liquid.type === sdWater.TYPE_ANTIMATTER )
			t = 'Antimatter';
			else
			if ( this.liquid.type === sdWater.TYPE_ESSENCE )
			t = 'Liquid Essence';
			else
			if ( this.liquid.type === sdWater.TYPE_TOXIC_GAS )
			t = 'Toxic gas';
			else
			if ( this.liquid.type === sdWater.TYPE_LAVA )
			t = 'Lava';
			else
			if ( this.liquid.type === sdWater.TYPE_ACID )
			t = 'Acid';
			else
			if ( this.liquid.type === sdWater.TYPE_WATER )
			t = 'Water';
		}

		if ( this.type === sdStorageTank.TYPE_PORTABLE )
		{
			if ( t === 'Empty' )
			t = t + ' portable';
			else
			t = 'Portable ' + t.toLowerCase();
		}
		
		t += ' storage tank';
		
		return t;
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		let t = this.title;

		sdEntity.TooltipUntranslated( ctx, T( t ) + ' ( ' + Math.round(this.liquid.amount) + ' / ' + (this.liquid.max) + ' )', 0, ( this.liquid.extra > 0 ? -20 : -10 ) );

		if ( this.liquid.extra > 0 )
		{
			if ( this.liquid.type === sdWater.TYPE_ESSENCE )
			{
				let v = this.liquid.extra / this.liquid.amount * 100 / ( sdCrystal.anticrystal_value / 2 );
				sdEntity.TooltipUntranslated( ctx, T('Purity') + ': ' + ~~( Math.max( 1, Math.min( v * 100, 100 ) ) ) + '% ( ' + Math.round(this.liquid.extra) + ' ' + T('total') + ' )', 0, -10 );
			}
		}
	}
	Draw( ctx, attached )
	{
		if ( sdShop.isDrawing )
		// if ( this.type === sdStorageTank.TYPE_LARGE )
		ctx.scale ( 0.5,0.5 );

		let border_y1 = ( this.type === sdStorageTank.TYPE_PORTABLE ? -3 : -5 );
		let border_y2 = ( this.type === sdStorageTank.TYPE_PORTABLE ? -3 : -4 );

		sdWater.DrawLiquidRect( ctx, this, this.liquid, -3, -3, border_y1, border_y2, this._offset_x );
		
		if ( this.type === sdStorageTank.TYPE_LARGE )
		if ( sdBlock.cracks[ this.destruction_frame ] !== null )
		{
			ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], 0, 0, this.hitbox_x2 * 2, this.hitbox_y2 * 2, -15,-24, this.hitbox_x2 * 2, this.hitbox_y2 * 2 );
		}

		ctx.drawImageFilterCache( sdStorageTank.img_storage_tank, ( this.type === sdStorageTank.TYPE_PORTABLE ? 32 : 0 ), 0, 32, 64, -16, -48, 32,64 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';

	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			if ( this.liquid.amount > 0 )
			{
				let di_x = this.hitbox_x2 - this.hitbox_x1;
				let di_y = this.hitbox_y2 - this.hitbox_y1;
				let tot = Math.ceil( this.liquid.amount / 100 );
				let extra = this.liquid.extra / this.liquid.amount * 100;

				sdWorld.SpawnWaterEntities( this.x, this.y, di_x, di_y, tot, this.liquid.type, extra, this.liquid );
			}

			//this._transfer_mode = 1;
			//this.GiveLiquid( 1, 1, true ); // Give away liquid less than one water entity

			/*
			if ( this.matter_max > 0 )
			{
				sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

				sdWorld.DropShards( this.x, this.y, 0, 0, 
					Math.floor( Math.max( 0, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					this.matter_max / 40
				);
			}
			*/
			sdWorld.BasicEntityBreakEffect( this, 10, 6, 0.5, 1, 'glass12', sdEffect.TYPE_GLASS );
		}
	}
	
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		// For playtesting, possibly a feature of portable storage tanks/new storage tank type
		if ( false )
		if ( !from_entity._is_being_removed )
		{
			// if ( this.type === sdStorageTank.TYPE_PORTABLE )
			if ( this._ignore_pickup_tim === 0 )
			if ( from_entity.is( sdWater ) )
			{
				let amount = Math.round( from_entity._volume * 100 );
				let extra = ( from_entity.extra || 0 );

				if ( this.IsLiquidTypeAllowed( from_entity.type ) )
				if ( this.liquid.amount + amount <= this.liquid.max )
				{
					if ( this.liquid.type === -1 )
					this.liquid.type = from_entity.type;

					this.liquid.amount += amount;
					this.liquid.extra += extra;

					this._ignore_pickup_tim = 10;

					from_entity.remove();

					// this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				}
			}
		}
	}

	MeasureMatterCost()
	{
	//	return 0; // Hack
		
		return 600;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'TRANSFER_MODE' )
			{
				if ( typeof parameters_array[ 0 ] === 'number' )
				if ( !isNaN( parameters_array[ 0 ] ) )
				if ( parameters_array[ 0 ] >= 0 )
				if ( parameters_array[ 0 ] < 3 )
				{
					if ( this.GetAccurateDistance( exectuter_character.x + ( exectuter_character.hitbox_x1 + exectuter_character.hitbox_x2 ) / 2, exectuter_character.y + ( exectuter_character.hitbox_y1 + exectuter_character.hitbox_y2 ) / 2 ) < 32 )
					{
						if ( command_name === 'TRANSFER_MODE' )
						{
							this.SetTransferMode( parameters_array[ 0 ] );
							executer_socket.SDServiceMessage( this.title + ' transfer mode set' );
						}
					}
					else
					{
						executer_socket.SDServiceMessage( 'Too far' );
						return;
					}
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( this.GetAccurateDistance( exectuter_character.x + ( exectuter_character.hitbox_x1 + exectuter_character.hitbox_x2 ) / 2, exectuter_character.y + ( exectuter_character.hitbox_y1 + exectuter_character.hitbox_y2 ) / 2 ) < 20 )
		{
			this.AddContextOption( 'Balance contents', 'TRANSFER_MODE', [ 0 ] );
			this.AddContextOption( 'Only give contents', 'TRANSFER_MODE', [ 1 ] );
			this.AddContextOption( 'Only take contents', 'TRANSFER_MODE', [ 2 ] );
		}
	}
}
//sdStorageTank.init_class();

export default sdStorageTank;
