
/* global sdShop */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdBullet from './sdBullet.js';
import sdWater from './sdWater.js';
import sdMatterAmplifier from './sdMatterAmplifier.js';
//import sdWorld.entity_classes.sdPlayerDrone from './sdWorld.entity_classes.sdPlayerDrone.js';

class sdEssenceExtractor extends sdEntity
{
	static init_class()
	{
		sdEssenceExtractor.img_essence_extractor = sdWorld.CreateImageFromFile( 'essence_extractor' );
		sdEssenceExtractor.img_beam = sdWorld.CreateImageFromFile( 'matter_amplifier_beam4' );

		sdEssenceExtractor.liquid_per_crystal = 20;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -11; }
	get hitbox_x2() { return 11; }
	get hitbox_y1() { return 7; }
	get hitbox_y2() { return 24; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }

	get title()
	{
		return T('Essence extractor');
	}
	
	RequireSpawnAlign()
	{ return true; }
	
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.crystal )
		return [ this.crystal ]; 
		
		return [];
	}
	/*GetAutoConnectedEntityForMatterFlow()
	{
		return this.crystal;
	}*/
	constructor( params )
	{
		super( params );
		
		/*this.matter_max = 0;
		this._last_matter_max = this.matter_max; // Change will cause hash update
		this.matter = this.matter_max;
		this.matter_regen = 0; // Matter regen rate taken from crystals that are put into amplifiers
		this._last_sync_matter = this.matter;*/
		
		this.crystal = null;
		
		this._hmax = 640;// = ( 160 + ( 160 * this.multiplier ) ) * 4; // Regular matter amplifier has 160 + 160 hp which is 320
		this._hea = this._hmax;

		this.liquid = {
			max: 100,
			amount: 0,
			type: -1,
			extra: 0 // Used for essence
		}

		this._transfer_mode = 1;

		this.refine_essence = false;
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;

		this._transfer_timeout = 0;

		this._offset_x = ~~( Math.random() * 32 );
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		// this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		this.remove();
	
		this._regen_timeout = 60;
		
		this._update_version++; // Just in case
	}
	DrainAndDestroyCrystal()
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.crystal )
		if ( this.liquid.type === -1 || ( this.liquid.type === sdWater.TYPE_ANTIMATTER ) === this.crystal.is_anticrystal )
		{
			let amount = Math.min( 100, this.crystal.matter_regen - sdCrystal.lowest_matter_regen ); // Drain up to 100 matter_regen
			//let amount_rounded = Math.round( amount );

			if ( this.liquid.max - this.liquid.amount >= amount )
			{
				this.crystal.matter_regen -= amount;
	
				this.liquid.amount += amount;
	
				if ( !this.crystal.is_anticrystal )
				this.liquid.extra += this.crystal.matter_max * amount / 100;
	
				if ( this.liquid.type === -1 )
				this.liquid.type = ( this.crystal.is_anticrystal ? sdWater.TYPE_ANTIMATTER : sdWater.TYPE_ESSENCE );
	
				if ( this.crystal.matter_regen <= sdCrystal.lowest_matter_regen ) // Don't destroy crystal if it is overcharged
				this.crystal.Damage( this.crystal._hea + 1 );

				this._update_version++;

				return true;
			}
		}

		return false;
	}
	ToggleEssenceRefine()
	{
		this.refine_essence = !this.refine_essence;

		// this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		this._update_version++;
	}
	LiquidTransferMode() // 0 - balance liquids, 1 - only give liquids, 2 - only take liquids
	{
		if ( !this.crystal && this.refine_essence )
		return 2;

		return 1;
	}
	/*SetTransferMode( to )
	{
		this._transfer_mode = to;

		// this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		this._update_version++;
	}*/
	IsLiquidTypeAllowed( type )
	{
		if ( type === -1 )
		return true;

		if ( [ sdWater.TYPE_ESSENCE, sdWater.TYPE_ANTIMATTER ].indexOf( type ) === -1 ) // Only essence and antimatter
		return false;

		return ( this.liquid.type === -1 || this.liquid.type === type );
	}
	onServerSideSnapshotLoaded( snapshot )
	{
		// Amplifier version upgrade
		if ( typeof snapshot.matter_max !== 'undefined' )
		if ( snapshot.matter_max > 0 )
		{
			let ent = new sdCrystal({  });

			ent.x = this.x;
			ent.y = this.y + 7 - ent._hitbox_y2 - 0.1; // 7 instead of this._hitbox_y1 because we need final y1

			ent.matter_max = snapshot.matter_max;
			ent.matter = snapshot.matter;
			ent.matter_regen = snapshot.matter_regen;
			
			sdEntity.entities.push( ent );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		/*if ( this._last_matter_max !== this.matter_max )
		{
			 // Change will cause hash update as matter_max value specifies hitbox size
			this._last_matter_max = this.matter_max;
			sdWorld.UpdateHashPosition( this, false );
		}*/

		//if ( this.multiplier > 4 ) // Revert old max amplifiers to current max, this can be commented out/deleted once it is applied to server and overrides old max amplifiers
		//this.multiplier = 4;
		
		if ( this.crystal )
		{
			//this.MatterGlow( 0.01, 0, GSPEED );
			
			this.crystal.x = this.x;
			this.crystal.y = this.y + 7 - this.crystal._hitbox_y2;
			this.crystal.sx = 0;
			this.crystal.sy = 0;
		}

		let can_hibernate1 = false;
		let can_hibernate2 = false;
		
		if ( this._ignore_pickup_tim > 0 )
		this._ignore_pickup_tim = Math.max( 0, this._ignore_pickup_tim - GSPEED );
		else
		can_hibernate1 = true;
	
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		else
		can_hibernate2 = true;

		if ( sdWorld.is_server )
		{
			if ( this.refine_essence )
			if ( this.liquid.type === sdWater.TYPE_ESSENCE )
			if ( this.liquid.amount > 1 )
			{
				let rate = Math.pow( this.liquid.amount / ( this.liquid.max + this.liquid.extra / this.liquid.amount ), 3 ) * GSPEED; // Using multiple extractors is only more efficient if they can be filled

				//if ( Math.random() < rate )
				{
					//rate = Math.ceil( rate ); // Should only change by integers to avoid floating point errors

					if ( this.liquid.amount - rate > 0 )
					if ( this.liquid.extra / ( this.liquid.amount - rate ) * 100 <= sdCrystal.anticrystal_value / 2 )
					{
						this._transfer_timeout = 30 * 10; // Wait 10 seconds if refining

						this.liquid.amount -= rate;
						this._update_version++;
					}
				}
			}
		}

		this.GiveLiquid( 0.05, GSPEED );

		if ( this.liquid.amount <= 0 || ( this.liquid.type === sdWater.TYPE_ESSENCE && this.liquid.extra <= 0 ) )
		{
			this.liquid.amount = 0;
			this.liquid.type = -1;
			this.liquid.extra = 0;
		}

		/*if ( can_hibernate1 && can_hibernate2 )
		if ( sdWorld.is_server ) // Server-only. Clients will have to update hitbox
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );*/
	
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T(this.title) + ' ( ' + Math.round(this.liquid.amount) + ' / ' + (this.liquid.max) + ' )', 0, ( this.liquid.amount > 0 ? -10 : -0 ) );

		if ( this.liquid.amount > 0 )
		{
			if ( this.liquid.type === sdWater.TYPE_ESSENCE )
			{
				let v = this.liquid.extra / this.liquid.amount * 100 / ( sdCrystal.anticrystal_value / 2 );
				sdEntity.TooltipUntranslated( ctx, T('Essence purity') + ': ' + ~~( Math.max( 1, Math.min( v * 100, 100 ) ) ) + '% ( ' + Math.round(this.liquid.extra) + ' ' + T('total') + ' )', 0, -0 );
			}
			else
			sdEntity.TooltipUntranslated( ctx, 'Antimatter', 0, -0 );
		}
	}
	Draw( ctx, attached )
	{
		if ( this.crystal )
		ctx.apply_shading = false;
		
		/*
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_empty, - 16, - 16, 32,32 );
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max );
	
		ctx.globalAlpha = this.matter / this.matter_max;
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier, - 16, - 16, 32,32 );

		ctx.globalAlpha = 1;
		ctx.filter = 'none';*/
		
		const offset_y = 2;
			
		if ( this.crystal )
		{
			ctx.save();
			{
				ctx.translate( this.crystal.x - this.x, this.crystal.y - this.y );
				this.crystal.Draw( ctx, true );
			}
			ctx.restore();
		}
		
		sdWater.DrawLiquidRect( ctx, this, this.liquid, -2, -2, -3, -3, this._offset_x );
		
		if ( this.crystal )
		{
			ctx.drawImageFilterCache( sdEssenceExtractor.img_beam, - 16, - 16, 32,32 );
		}

		ctx.globalAlpha = 1;

		let refine = this.refine_essence ? 1 : 0;

		ctx.drawImageFilterCache( sdEssenceExtractor.img_essence_extractor, 0, 8, 32, 24, - 16, - 0, 32, 24 );
		// ctx.drawImageFilterCache( sdEssenceExtractor.img_essence_extractor, 32, drain*16, 16, 16, - 16, 8, 16, 16 );
		ctx.drawImageFilterCache( sdEssenceExtractor.img_essence_extractor, refine*16, 0, 16, 8, - 8, 8, 16, 8 );
	}
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		this.DropCrystal();
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
			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
	}
	
	DropCrystal( crystal_to_drop, initiated_by_player=false )
	{
		if ( !sdWorld.is_server )
		return false;
	
		if ( this.crystal )
		{
			let ent;
			
			if ( this.crystal )
			{
				ent = this.crystal;
				
				// Reset velocity which crystal had when it was put into amplifier
				this.crystal.sx = 0;
				this.crystal.sy = 0;
				
				this.crystal.held_by = null;
				this.crystal.onCarryEnd();
				this.crystal = null;
				
			}
			
			this._ignore_pickup_tim = 30;
			
			// this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			this._hitbox_y1 = this.hitbox_y1;
			sdWorld.UpdateHashPosition( this, false ); // Hitbox update
			this._update_version++;

			/*let that = this;

			// Wait for hook target to finalize
			setTimeout( ()=>
			{
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				{
					let s = sdWorld.sockets[ i ];
					
					if ( s.character )
					{
						if ( s.character.is( sdWorld.entity_classes.sdPlayerDrone ) )
						{
							if ( s.character.grabbed === that )
							{
								s.character.grabbed = ent;
							}
						}
						else
						if ( s.character.hook_x !== 0 || s.character.hook_y !== 0 )
						if ( s.character.hook_relative_to === that )
						{
							s.character.hook_relative_to = ent;
							//s.character.hook_x = ent.x;
							//s.character.hook_y = ent.y;
							s.character.hook_relative_x = 0;
							s.character.hook_relative_y = 0;
							//debugger;
						}
					}
				}
			}, 50 );*/
			
			return true;
		}
		
		return false;
	}
	/*HookAttempt() // true for allow. from_entity is sdBullet that is hook tracer
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( !this.shielded )
		{
			this.DropCrystal();
		}
		
		return true;
	}*/
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		// Uncomment this if but still happens. Normally .onMovementInRange should never be called if one of entities is already being removed. Previously this was a problem at sdEntity physic simulation logic
		//if ( from_entity._is_being_removed )
		//return;
	
		if ( !this.crystal && !from_entity.held_by && !from_entity._is_being_removed )
		{
			if ( this._ignore_pickup_tim === 0 )
			if ( from_entity.is( sdCrystal ) )
			//if ( from_entity._held_by === null && from_entity.type === 1 ) // Prevent crystals which are stored in a crate
			if ( from_entity.held_by === null ) // Prevent crystals which are stored in a crate/other amplifier
			if ( from_entity._hitbox_x2 - from_entity._hitbox_x1 <= 16 ) // Only small enough ones
			if ( sdWorld.Dist2D_Vector( from_entity.sx, from_entity.sy ) < 1.5 )
			{
				//console.log( 'vel ',sdWorld.Dist2D_Vector( from_entity.sx, from_entity.sy ));
				
				
				
				// Prevent catching pulled crystals
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				{
					let s = sdWorld.sockets[ i ];
					
					if ( s.character )
					{
						if ( s.character.is( sdWorld.entity_classes.sdPlayerDrone ) )
						{
							if ( s.character.grabbed === from_entity )
							{
								return;
							}
						}
						else
						if ( s.character.hook_relative_to )
						if ( s.character.hook_relative_to === from_entity )
						return;
					}
				}
				
				let can_put = from_entity.CanMoveWithoutOverlap( 
							this.x, 
							this.y + 7 - from_entity._hitbox_y2, 
							0 );
							
				if ( can_put )
				{
					from_entity.held_by = this;
					from_entity.onCarryStart();
					this.crystal = from_entity;

					this._hitbox_y1 = this.hitbox_y1;
					sdWorld.UpdateHashPosition( this, false ); // Hitbox update
					this._update_version++;
					
					// this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				}
			}
		}
		else
		{
			if ( this.crystal )
			{
				// No action in new amplifier version case
			}
			else
			if ( from_entity.is( sdBullet ) )
			{
				this.DropCrystal();
			}
		}
	}
	
	MeasureMatterCost()
	{
		return 400;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( parameters_array instanceof Array )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			{
				if ( command_name === 'DRAIN' )
				{
					if ( this.crystal )
					{
						if ( !this.DrainAndDestroyCrystal() )
						{
							executer_socket.SDServiceMessage( 'Not enough space' );
						}
					}
					else
					{
						executer_socket.SDServiceMessage( 'Needs crystal first' );
					}
				}
				else
				if ( command_name === 'REFINE' )
				{
					this.ToggleEssenceRefine();
				}
				/*else
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
						}
					}
				}*/
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			this.AddContextOption( 'Consume crystal', 'DRAIN', [] );

			if ( !this.refine_essence )
			this.AddContextOption( 'Refine Essence', 'REFINE', [] );
			else
			this.AddContextOption( 'Stop refining essence', 'REFINE', [] );

			/*this.AddContextOption( 'Balance contents', 'TRANSFER_MODE', [ 0 ] );
			this.AddContextOption( 'Only give contents', 'TRANSFER_MODE', [ 1 ] );
			this.AddContextOption( 'Only take contents', 'TRANSFER_MODE', [ 2 ] );*/
		}
	}
}
//sdMatterAmplifier.init_class();

export default sdEssenceExtractor;