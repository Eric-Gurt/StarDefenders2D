
/* global sdShop */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdBullet from './sdBullet.js';
import sdLost from './sdLost.js';

//import sdWorld.entity_classes.sdPlayerDrone from './sdWorld.entity_classes.sdPlayerDrone.js';

class sdMatterAmplifier extends sdEntity
{
	static init_class()
	{
		sdMatterAmplifier.img = sdWorld.CreateImageFromFile( 'sdMatterAmplifier' );
		
		/*sdMatterAmplifier.img_matter_amplifier = sdWorld.CreateImageFromFile( 'matter_amplifier' );
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
		*/
		sdMatterAmplifier.relative_regen_amplification_to_crystals = 5;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -10 * this.width; }
	get hitbox_x2() { return 10 * this.width; }
	get hitbox_y1() { return ( this.crystal && this.shielded ) ? ( this.width === 1 ? -10 : ( 7 - 17 * this.width ) ) : 7; }
	get hitbox_y2() { return 14; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	RequireSpawnAlign()
	{ return true; }
	
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
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
		
		// Buffer for being able to give away matter from crystal
		this._matter_max = 20;
		this._matter = 0;
		
		this.crystal = null;
		
		this.width = params.width || 1;
		
		this.multiplier = params.multiplier || 1; // Crystal regeneration multiplier, used for higher tier matter amplifiers. Only power of 2 values
		this._hmax = 1;// = ( 160 + ( 160 * this.multiplier ) ) * 4; // Regular matter amplifier has 160 + 160 hp which is 320
		this.UpdatePropertiesDueToUpgrade();
		this._hea = this._hmax;
		
		this.shielded = false;
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;
		
		this._last_damage = 0;
	}
	UpdatePropertiesDueToUpgrade()
	{
		this._hmax = ( 160 + ( 160 * this.multiplier ) ) * 4 * this.width; // Regular matter amplifier has 160 + 160 hp which is 320
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
			
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
			}
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
	get title()
	{
		return ( this.width === 1 ) ? "Matter amplifier" : "Wide matter amplifier";
	}
	get description()
	{
		return `Matter amplifiers are used to hold, protect and amplify matter regeneration of crystals. Additionally, matter amplifiers are the main source of matter once crystal has been up into them. Right click on matter amplifiers to toggle shields for held crystals. You can drag crystals in/out of matter amplifiers with grappling hook (mouse wheel click) which is available in character upgrades category.`;
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		if ( this.crystal )
		ctx.apply_shading = false;
		
		let mult_to_tier = [];
		mult_to_tier[ 1 ] = 0;
		mult_to_tier[ 2 ] = 1;
		mult_to_tier[ 4 ] = 2;
		mult_to_tier[ 8 ] = 3;
		
		let img_size = 32;
		let offset_x = 0;
		let place_offset_y = -16;
		let place_offset_x = -16;
		
		if ( this.width === 2 )
		{
			img_size = 64;
			offset_x = 128;
			place_offset_y = -48;
			
			place_offset_x -= 8;
		}
		
		offset_x += img_size*mult_to_tier[ this.multiplier ];
			
		if ( this.crystal )
		{
			ctx.save();
			{
				ctx.translate( this.crystal.x - this.x, this.crystal.y - this.y );
				
				this.crystal.DrawWithStatusEffects( ctx, true );
			}
			ctx.restore();
			
			ctx.globalAlpha = 0.75 + Math.sin( sdWorld.time / 300 ) * 0.25;
			
			
			ctx.drawImageFilterCache( sdMatterAmplifier.img, offset_x,img_size,img_size,img_size, place_offset_x, place_offset_y, img_size,img_size );
			
			if ( this.shielded )
			{
				ctx.globalAlpha = 1;
				
				ctx.drawImageFilterCache( sdMatterAmplifier.img, offset_x,img_size*2,img_size,img_size, place_offset_x, place_offset_y, img_size,img_size );
			}
		}
		
		ctx.globalAlpha = 1;
		
		ctx.drawImageFilterCache( sdMatterAmplifier.img, offset_x,0,img_size,img_size, place_offset_x, place_offset_y, img_size,img_size );
	}
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		this.DropCrystal();
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
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
				
				// Reset velocity which crystal had when it was put into amplifier
				this.crystal.sx = 0;
				this.crystal.sy = 0;
				
				this.crystal.held_by = null;
				this.crystal.onCarryEnd();
				this.crystal = null;
				
				this._matter_max = 0;
				
				
			}
			
			this._ignore_pickup_tim = 30;
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

			this._hitbox_y1 = this.hitbox_y1;
			sdWorld.UpdateHashPosition( this, false ); // Hitbox update
			this._update_version++;

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
			if ( from_entity.is( sdCrystal ) || ( from_entity.is( sdLost ) && from_entity._copy_of_class === 'sdCrystal' ) )
			//if ( from_entity._held_by === null && from_entity.type === 1 ) // Prevent crystals which are stored in a crate
			if ( from_entity.held_by === null ) // Prevent crystals which are stored in a crate/other amplifier
			if ( from_entity._hitbox_x2 - from_entity._hitbox_x1 <= 16 * this.width ) // Only small enough ones
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

					this._matter_max = 20; // Math.max( 20, this.crystal.matter_max / 10 ); What was this for?

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
		if ( this.width === 2 )
		return ( 800 ) * this.multiplier + this._hmax * sdWorld.damage_to_matter;
		
		return ( 200 ) * this.multiplier + this._hmax * sdWorld.damage_to_matter;
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
							
							cost = Math.min( 1800, cost ); // Keep it available even if wide version has crazy multipliers

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