
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdBullet from './sdBullet.js';
//import sdWorld.entity_classes.sdPlayerDrone from './sdWorld.entity_classes.sdPlayerDrone.js';

class sdMatterAmplifier extends sdEntity
{
	static init_class()
	{
		sdMatterAmplifier.img_matter_amplifier = sdWorld.CreateImageFromFile( 'matter_amplifier' );
		sdMatterAmplifier.img_matter_amplifier2 = sdWorld.CreateImageFromFile( 'matter_amplifier2' ); // 2nd variation
		sdMatterAmplifier.img_matter_amplifier3 = sdWorld.CreateImageFromFile( 'matter_amplifier3' ); // 3rd variation
		sdMatterAmplifier.img_matter_amplifier4 = sdWorld.CreateImageFromFile( 'matter_amplifier4' ); // 4th variation
		sdMatterAmplifier.img_matter_amplifier_beam = sdWorld.CreateImageFromFile( 'matter_amplifier_beam' );
		sdMatterAmplifier.img_matter_amplifier_beam2 = sdWorld.CreateImageFromFile( 'matter_amplifier_beam2' ); // 2nd variation
		sdMatterAmplifier.img_matter_amplifier_beam3 = sdWorld.CreateImageFromFile( 'matter_amplifier_beam3' ); // 3rd variation
		sdMatterAmplifier.img_matter_amplifier_beam4 = sdWorld.CreateImageFromFile( 'matter_amplifier_beam4' ); // 4th variation
		sdMatterAmplifier.img_matter_amplifier_shield = sdWorld.CreateImageFromFile( 'matter_amplifier_shield' );
		sdMatterAmplifier.img_matter_amplifier_shield2 = sdWorld.CreateImageFromFile( 'matter_amplifier_shield2' ); // 2nd variation
		sdMatterAmplifier.img_matter_amplifier_shield3 = sdWorld.CreateImageFromFile( 'matter_amplifier_shield3' ); // 3rd variation
		sdMatterAmplifier.img_matter_amplifier_shield4 = sdWorld.CreateImageFromFile( 'matter_amplifier_shield4' ); // 4th variation
		//sdMatterAmplifier.img_matter_amplifier_empty = sdWorld.CreateImageFromFile( 'matter_amplifier_empty' );
		
		sdMatterAmplifier.relative_regen_amplification_to_crystals = 5;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -10; }
	get hitbox_x2() { return 10; }
	get hitbox_y1() { return ( this.crystal && this.shielded ) ? -10 : 7; }
	get hitbox_y2() { return 14; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	RequireSpawnAlign()
	{ return true; }
	
	getRequiredEntities() // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.crystal )
		return [ this.crystal ]; 
		
		return [];
	}
	GetAutoConnectedEntityForMatterFlow()
	{
		return this.crystal;
	}
	constructor( params )
	{
		super( params );
		
		/*this.matter_max = 0;
		this._last_matter_max = this.matter_max; // Change will cause hash update
		this.matter = this.matter_max;
		this.matter_regen = 0; // Matter regen rate taken from crystals that are put into amplifiers
		this._last_sync_matter = this.matter;*/
		
		// Buffer for being able to give away matter from crystal
		this._matter_max = 20;
		this._matter = 0;
		
		this.crystal = null;
		
		this.multiplier = params.multiplier || 1; // Crystal regeneration multiplier, used for higher tier matter amplifiers. Only power of 2 values
		this._hmax = 1;// = ( 160 + ( 160 * this.multiplier ) ) * 4; // Regular matter amplifier has 160 + 160 hp which is 320
		this.UpdatePropertiesDueToUpgrade();
		this._hea = this._hmax;
		
		this.shielded = false;
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;
	}
	UpdatePropertiesDueToUpgrade()
	{
		this._hmax = ( 160 + ( 160 * this.multiplier ) ) * 4; // Regular matter amplifier has 160 + 160 hp which is 320
	}
	onSnapshotApplied() // To override
	{
		if ( this.multiplier === 3 )
		this.multiplier = 4;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		if ( this.shielded && this.crystal )
		//if ( this.matter_max > 0 )
		{
			dmg *= 0.333;
			sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
		}
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		this.remove();
	
		this._regen_timeout = 60;
		
		this._update_version++; // Just in case
	}
	ToggleShields()
	{
		this.shielded = !this.shielded;
		
		this._hitbox_y1 = this.hitbox_y1;
		sdWorld.UpdateHashPosition( this, false );
		this._update_version++;
	}
	onServerSideSnapshotLoaded( snapshot )
	{
		// Amplifier version upgrade
		if ( typeof snapshot.matter_max !== 'undefined' )
		if ( snapshot.matter_max > 0 )
		{
			trace( 'upgrading amplifier',snapshot );
			
			let ent = new sdCrystal({  });

			ent.x = this.x;
			ent.y = this.y + 7 - ent._hitbox_y2 - 0.1; // 7 instead of this._hitbox_y1 because we need final y1

			ent.matter_max = snapshot.matter_max;
			ent.matter = snapshot.matter;
			ent.matter_regen = snapshot.matter_regen;
			
			sdEntity.entities.push( ent );
		}
	}
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return ( this.crystal || this._matter > 1 );
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
		
		if ( this.crystal )
		{
			//this.MatterGlow( 0.01, 0, GSPEED );
			
			this.crystal.x = this.x;
			this.crystal.y = this.y + 7 - this.crystal._hitbox_y2;
			this.crystal.sx = 0;
			this.crystal.sy = 0;
		}
		/*else
		{
			if ( this._hea >= this._hmax )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}*/
			
		if ( can_hibernate1 && can_hibernate2 )
		if ( sdWorld.is_server ) // Server-only. Clients will have to update hitbox
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			
		//if ( this.PrioritizeGivingMatterAway() )
		//this.MatterGlow( 0.1, 0, GSPEED ); // 0 radius means only towards cables
	
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Matter amplifier" );
		
		/*if ( this.matter_max === 0 )
		sdEntity.Tooltip( ctx, "Matter amplifier (no crystal)" );
		else
		sdEntity.Tooltip( ctx, "Matter amplifier ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " ) (" + ~~(this.matter_regen ) + "%)" );*/
		//sdEntity.Tooltip( ctx, "Matter amplifier ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
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
			
			ctx.globalAlpha = 0.75 + Math.sin( sdWorld.time / 300 ) * 0.25;
			if ( this.multiplier === 1 )
			ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_beam, - 16, - 16, 32,32 )
			if ( this.multiplier === 2 )
			ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_beam2, - 16, - 16, 32,32 );
			if ( this.multiplier === 4 )
			ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_beam3, - 16, - 16, 32,32 );
			if ( this.multiplier === 8 )
			ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_beam4, - 16, - 16, 32,32 );
			
			if ( this.shielded )
			{
				ctx.globalAlpha = 1;
				if ( this.multiplier === 1 )
				ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_shield, - 16, - 16, 32,32 );
				if ( this.multiplier === 2 )
				ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_shield2, - 16, - 16, 32,32 );
				if ( this.multiplier === 4 )
				ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_shield3, - 16, - 16, 32,32 );
				if ( this.multiplier === 8 )
				ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_shield4, - 16, - 16, 32,32 );
			}
		}
		
		ctx.globalAlpha = 1;
		if ( this.multiplier === 1 )
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier, - 16, - 16, 32, 32 );
		if ( this.multiplier === 2 )
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier2, - 16, - 16, 32, 32 );
		if ( this.multiplier === 4 )
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier3, - 16, - 16, 32, 32 );
		if ( this.multiplier === 8 )
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier4, - 16, - 16, 32, 32 );
	}
	onBeforeRemove() // Right when .remove() is called for the first time
	{
		this.DropCrystal();
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
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
	
		if ( initiated_by_player )
		if ( this.shielded )
		{
			return false;
		}
	
		if ( this.crystal )
		{
			let ent;
			
			if ( this.crystal )
			{
				ent = this.crystal;
				
				this.crystal.held_by = null;
				
				this.crystal.PhysWakeUp();
				
				this._matter_max = 0;
				
				this.crystal = null;
				
			}
			
			this._ignore_pickup_tim = 30;
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

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
					this.crystal = from_entity;

					this._matter_max = Math.max( 20, this.crystal.matter_max / 10 );

					this._hitbox_y1 = this.hitbox_y1;
					sdWorld.UpdateHashPosition( this, false ); // Hitbox update
					this._update_version++;
					
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
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
			if ( !this.shielded )
			if ( from_entity.is( sdBullet ) )
			{
				this.DropCrystal();
			}
		}
	}
	
	MeasureMatterCost()
	{
		return 200 * this.multiplier + this._hmax * sdWorld.damage_to_matter;
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
				if ( command_name === 'SHIELD_TOGGLE' )
				{
					this.ToggleShields();
				}
				else
				if ( command_name === 'UPGRADE' || command_name === 'UPGRADE_MAX' )
				{
					let upgraded = false;
					let can_upgrade = true;
					
					for ( let tr = ( command_name === 'UPGRADE' ) ? 1 : 10; tr > 0; tr-- )
					{
						let best_option = null;

						for ( let i = 0; i < sdShop.options.length; i++ )
						{
							let option = sdShop.options[ i ];
							if ( option._class === this.GetClass() )
							{
								if ( option.multiplier !== undefined )
								if ( option.multiplier > this.multiplier && ( !best_option || option.multiplier < best_option.multiplier ) )
								if ( exectuter_character.build_tool_level >= ( option._min_build_tool_level || 0 ) )
								best_option = option;
							}
						}

						if ( best_option )
						{
							let cost_this = this.MeasureMatterCost();
							let multiplier_old = this.multiplier;

							this.multiplier = best_option.multiplier;
							this.UpdatePropertiesDueToUpgrade();

							let cost_new = this.MeasureMatterCost();

							let cost = ~~( cost_new - cost_this + 300 );

							if ( exectuter_character.matter >= cost )
							{
								exectuter_character.matter -= cost;
								
								this._update_version++;
								this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
								
								upgraded = true;
							}
							else
							{
								this.multiplier = multiplier_old;
								this.UpdatePropertiesDueToUpgrade();
								
								can_upgrade = false;

								executer_socket.SDServiceMessage( 'Not enough matter. Upgrade costs ' + cost + ' matter' );
								break;
							}
						}
						else
						{
							break;
						}
					}
					
					if ( upgraded )
					sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });
					else
					if ( can_upgrade )
					executer_socket.SDServiceMessage( 'No upgrades available' );
				}
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
			this.AddContextOption( 'Toggle shields', 'SHIELD_TOGGLE', [] );
			this.AddContextOption( 'Upgrade tier', 'UPGRADE', [] );
			this.AddContextOption( 'Upgrade tier to max', 'UPGRADE_MAX', [] );
		}
	}
}
//sdMatterAmplifier.init_class();

export default sdMatterAmplifier;