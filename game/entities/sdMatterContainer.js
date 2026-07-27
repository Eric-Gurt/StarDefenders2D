
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdGun from './sdGun.js';

class sdMatterContainer extends sdEntity
{
	static init_class()
	{
		// Regular matter container
		sdMatterContainer.img_matter_container = sdWorld.CreateImageFromFile( 'matter_container' );
		//sdMatterContainer.img_matter_container_empty = sdWorld.CreateImageFromFile( 'matter_container_empty' );
		// Advanced matter container
		sdMatterContainer.img_matter_container2 = sdWorld.CreateImageFromFile( 'matter_container2' );
		//sdMatterContainer.img_matter_container2_empty = sdWorld.CreateImageFromFile( 'matter_container2_empty' );
		// Upgraded advanced matter container
		sdMatterContainer.img_matter_container3 = sdWorld.CreateImageFromFile( 'matter_container3' );
		//sdMatterContainer.img_matter_container3_empty = sdWorld.CreateImageFromFile( 'matter_container3_empty' );
		
		sdMatterContainer.MODE_EQUALIZE = 0;
		sdMatterContainer.MODE_COLLECT = 1;
		sdMatterContainer.MODE_RELEASE = 2;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return ( -6 * this.containers ) + ( this.is_advanced_container ? -11 : -10 ); }
	get hitbox_x2() { return ( 6 * this.containers ) + ( this.is_advanced_container ? 11 : 10 );}
	get hitbox_y1() { return this.is_advanced_container ? -15 : -14; }
	get hitbox_y2() { return this.is_advanced_container ? 16.5 : 14; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get mass()
	{ return 60 + ( 30 * this.containers ); }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return !this.is_advanced_container; }
	
	get is_advanced_container()
	{ return this.matter_max / ( 1 + this.containers ) >= 5120 * 80; }
	
	IsPhysicallyMovable() // By physics (not steering wheels). Incorrect value can crash the game or cause players to stuck in place when trying to push entity
	{
		return this.is_advanced_container;
	}
	
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }

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
	
	constructor( params )
	{
		super( params );
		
		//this.matter_max = params.matter_max || 640;
		this.matter_max = params.matter_max || 2048;
		
		//this.matter = this.matter_max;
		this.matter = params.matter || 0;
		
		this.containers = 0; // How many additional containers are combined into a single one?
		
		// Needed for advanced containers, unfortunately
		this.sx = 0;
		this.sy = 0;
		
		this._last_sync_matter = this.matter;
		
		this._hmax = this.matter_max >= 5120 * 80 ? 4000 : 400 * 4;
		this._hea = this._hmax;
		
		this._regen_timeout = 0;
		
		this.mode = sdMatterContainer.MODE_EQUALIZE;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		this.remove();
	
		this._regen_timeout = 60;
		
		if ( !this.is_advanced_container )
		this._update_version++; // Just in case
	}
	onBuilt()
	{
		// Advanced containers only merge through an explicit context command (see ExecuteContextCommand's ADV_MERGE)
		// so players don't lose track of matter/capacity by accidentally building next to another advanced container.
		if ( !this.is_advanced_container )
		this.CheckNearbyContainersForMerging();
	}
	CheckNearbyContainersForMerging()
	{
		if ( this.containers > 0 )
		return;

		if ( this._is_being_removed )
		return;

		let ents = sdWorld.GetAnythingNear( this.x, this.y, 48 );
		for ( let i = 0; i < ents.length; i++ )
		{
			if ( ents[ i ].is ( sdMatterContainer ) && !ents[ i ]._is_being_removed && ents[ i ] !== this && ( ents[ i ].matter_max / ( 1 + ents[ i ].containers ) === this.matter_max ) )
			{
				let container = ents[ i ];
				if ( container.y === this.y && container.containers < 3 ) // Same Y coordinate? Also container not too big?
				{
					let prev_x = container.x;
					let prev_containers = container.containers;

					if ( this.x > container.x )
					container.x += 6;
					else
					container.x -= 6;

					container.containers++; // Increase "containerss" merged by 1 (also widens its hitbox)
					container._hitbox_last_update = -1; // Force hitbox recompute so the occupancy check below sees the post-merge size/position

					// "this" is still physically sitting right next to "container" (that's what triggered the
					// merge) and is about to be consumed by it, so it must not count as an obstacle for the
					// occupancy check below - otherwise container's widened/shifted hitbox always reports as
					// blocked by "this" whenever the two are actually adjacent, and merging only ever appears
					// to succeed when they happen to already have unnatural extra space between them.
					this._is_being_removed = true;
					let can_move = container.CanMoveWithoutOverlap( container.x, container.y, 1 );
					this._is_being_removed = false;

					if ( !can_move )
					{
						// Merging here would wedge the container inside another entity - roll back and try the next candidate instead
						container.x = prev_x;
						container.containers = prev_containers;
						container._hitbox_last_update = -1;
						continue;
					}

					let matter_to_add = this.matter || 0;

					container.UpdateContainerPropertiesOnMerge( matter_to_add ); // Update properties

					if ( this.is_advanced_container )
					sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

					this.remove();
					this._broken = false;

					break;

					// Container hitboxes increase by 16 per container merge. Stacks up to "4" containers (3 merges)
				}
			}
		}
	}
	UnmergeOneContainer() // Splits one container off an advanced container stack, reversing CheckNearbyContainersForMerging. Returns true if it found room, false (and leaves state untouched) otherwise
	{
		if ( !sdWorld.is_server )
		return false;

		if ( !this.is_advanced_container )
		return false;

		if ( this.containers <= 0 )
		return false;

		if ( this._is_being_removed )
		return false;

		let split_hmax = this._hmax / ( this.containers + 1 );
		let split_matter_max = this.matter_max / ( this.containers + 1 );
		let split_matter = Math.min( this.matter / 2, split_matter_max ); // Even split of current matter, capacity-clamped for the new container

		let old_x = this.x;
		let old_containers = this.containers;
		let old_hmax = this._hmax;
		let old_matter_max = this.matter_max;
		let old_matter = this.matter;

		for ( let dir = -1; dir <= 1; dir += 2 ) // Try shrinking towards either side, whichever has room
		{
			this.containers = old_containers - 1;
			this._hmax = old_hmax - split_hmax;
			this.matter_max = old_matter_max - split_matter_max;
			this.matter = old_matter - split_matter;
			this.x = old_x + dir * 6;
			this._hitbox_last_update = -1; // Force hitbox recompute for the shrunk container count/position

			if ( this.CanMoveWithoutOverlap( this.x, this.y, 1 ) )
			{
				let spawn_x = this.x - dir * ( Math.abs( this.hitbox_x2 ) + 11 );

				let new_container = sdEntity.Create( sdMatterContainer, { x: spawn_x, y: this.y, matter_max: split_matter_max, matter: split_matter } );

				if ( new_container && new_container.CanMoveWithoutOverlap( new_container.x, new_container.y, 1 ) )
				{
					sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

					return true; // Committed
				}

				if ( new_container )
				{
					// This is a rollback of a split attempt that didn't find room, not a real
					// destruction - new_container never really "existed" from the player's
					// perspective. remove() defaults _broken to true (set internally, so it must be
					// overridden AFTER calling remove(), same as the merge success path below does),
					// which would otherwise make onRemove() dump the matter it was holding as a pile
					// of crystal shards purely as a side effect of a no-space rollback.
					new_container.remove();
					new_container._broken = false;
				}
			}

			// Roll back this attempt before trying the other direction
			this.containers = old_containers;
			this._hmax = old_hmax;
			this.matter_max = old_matter_max;
			this.matter = old_matter;
			this.x = old_x;
			this._hitbox_last_update = -1;
		}

		return false;
	}
	UpdateContainerPropertiesOnMerge( matter_to_add = 0 )
	{
		if ( this.containers === 0 )
		return;
	
		{
			let init_hmax = this._hmax / ( this.containers );
			this._hmax += init_hmax;
			let matter_to_increase = this.matter_max / ( this.containers );
			this.matter_max += matter_to_increase;
			this.matter += matter_to_add;
		}

		if ( !this.is_advanced_container )
		this._update_version++;
	}
	
	PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return true;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		// No regen, just give away matter
		//this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		
		if ( this.mode === sdMatterContainer.MODE_EQUALIZE )
		this.MatterGlow( 0.01, 50, GSPEED );
	
		if ( this.mode === sdMatterContainer.MODE_RELEASE )
		this.MatterGlow( 0.3, 50, GSPEED );
		
		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			if ( !this.is_advanced_container )
			this._update_version++;
		}
		
		if ( this.is_advanced_container )
		{
			this.sy += sdWorld.gravity * GSPEED;
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( !from_entity._is_being_removed && !this.is_being_removed )
		{
			if ( from_entity.is( sdGun ) && this.is_advanced_container && this.containers === 0 )
			{
				if ( from_entity.class === sdGun.CLASS_MATTER_CONTAINER_CHIPSET && this.matter_max === 5120 * 8 * 10 ) // Matter container chipset, and container is not upgraded?
				{
					this.matter_max = 5120 * 8 * 10 * 2; // Double the matter capacity
					this._hmax = this._hmax * 1.5; // Increase health by 50%
					this._hea = this._hmax;
					from_entity.remove();
					
					sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });
				}
			}
			//if ( from_entity.is( sdMatterContainer ) && this.is_advanced_container && from_entity.is_advanced_container )
			//this.CheckNearbyContainersForMerging();
		}
	}
    IsAttachableToSteeringWheel()
	{
		return !this.is_advanced_container;
	}
	get title()
	{
		if ( this.is_advanced_container )
		return 'Advanced matter container';
		else
		return 'Matter container';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )" );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		let xx = 0;
		
		let yy = this.containers;
		
		if ( !this.is_advanced_container )
		{
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, xx * 96, yy * 64, 96, 64, -48, -32, 96, 64 );
				
				//if ( this.matter_max > 40 )
				//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
			
				ctx.filter = sdWorld.GetCrystalHue( ( this.matter_max / 2 ) / ( 1 + this.containers ) );
				
				//ctx.filter = sdWorld.GetCrystalHue( -1 );
			
				ctx.globalAlpha = sdShop.isDrawing ? 1 : this.matter / this.matter_max;
				
				xx = 1;
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container, xx * 96, yy * 64, 96, 64, -48, -32, 96, 64 );
			}
		}
		else
		{
			// If container is not upgraded via chipset
			if ( this.matter_max / ( 1 + this.containers ) === 5120 * 80 )
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container2, xx * 96, yy * 64, 96, 64, -48, -32, 96, 64 );
				
				//if ( this.matter_max > 40 )
				//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
			
				ctx.filter = sdWorld.GetCrystalHue( -1 );
				
				//ctx.filter = sdWorld.GetCrystalHue( -1 );
			
				ctx.globalAlpha = sdShop.isDrawing ? 1 : this.matter / this.matter_max;
				
				xx = 1;
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container2, xx * 96, yy * 64, 96, 64, -48, -32, 96, 64 );
			}
			else // Upgraded
			{
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container3, xx * 96, yy * 64, 96, 64, -48, -32, 96, 64 );
				
				//if ( this.matter_max > 40 )
				//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
			
				ctx.filter = sdWorld.GetCrystalHue( -1 );
				
				//ctx.filter = sdWorld.GetCrystalHue( -1 );
			
				ctx.globalAlpha = sdShop.isDrawing ? 1 : this.matter / this.matter_max;
				
				xx = 1;
				ctx.drawImageFilterCache( sdMatterContainer.img_matter_container3, xx * 96, yy * 64, 96, 64, -48, -32, 96, 64 );
			}
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

			sdWorld.DropShards( this.x, this.y, 0, 0, 
				Math.floor( Math.max( 0, this.matter / this.matter_max * 80 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 80,
				10
			);

			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
	}
	
	MeasureMatterCost()
	{
	//	return 0; // Hack
		
		//return this._hmax * sdWorld.damage_to_matter + this.matter;
		if ( this.matter_max === 2560 * 2 || this.matter_max === 5120 * 2 || this.matter_max === 10240 * 2 || this.matter_max === 20480 * 2 )
		return this._hmax * sdWorld.damage_to_matter + this.matter_max * 0.05;
		if ( this.matter_max === 40960 * 2 )
		return this._hmax * sdWorld.damage_to_matter + this.matter_max * 0.0275;
	}
	ExecuteContextCommand( command_name, parameters_array, executer_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). executer_character can be null, socket can't be null
	{
		if ( executer_character )
		if ( executer_character.hea > 0 )
		{
			if ( this.inRealDist2DToEntity_Boolean( executer_character, 64 ) && executer_socket.character.canSeeForUse( this ) )
			{
				if ( command_name === 'MODE' )
				{
					if ( parameters_array[ 0 ] === 0 || parameters_array[ 0 ] === 1 || parameters_array[ 0 ] === 2 )
					{
						this.mode = parameters_array[ 0 ];
						if ( !this.is_advanced_container )
						this._update_version++;
					}
				}
				if ( command_name === 'ADV_MERGE' )
				{
					this.CheckNearbyContainersForMerging();
				}
				if ( command_name === 'ADV_UNMERGE' )
				{
					if ( !this.UnmergeOneContainer() )
					executer_socket.SDServiceMessage( 'Not enough space to unmerge this container' );
				}
			}
			else
			executer_socket.SDServiceMessage( 'Matter container is too far' );
		}
	}
	PopulateContextOptions( executer_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( executer_character )
		if ( executer_character.hea > 0 )
		if ( executer_character._god || this.inRealDist2DToEntity_Boolean( executer_character, 64 ) )
		{
			let active_mode_text = ' ( ' + T( 'active' ) + ' )';
			this.AddContextOptionNoTranslation( T( 'Set mode to Equalize' ) + (( this.mode === 0 ) ? active_mode_text : ''), 'MODE', [ 0 ] );
			this.AddContextOptionNoTranslation( T( 'Set mode to Collect' ) + (( this.mode === 1 ) ? active_mode_text : ''), 'MODE', [ 1 ] );
			this.AddContextOptionNoTranslation( T( 'Set mode to Release' ) + (( this.mode === 2 ) ? active_mode_text : ''), 'MODE', [ 2 ] );
			
			if ( this.is_advanced_container && this.containers === 0 )
			this.AddContextOptionNoTranslation( T( 'Attempt nearby container merging' ), 'ADV_MERGE' );

			if ( this.is_advanced_container && this.containers > 0 )
			this.AddContextOptionNoTranslation( T( 'Unmerge one container' ), 'ADV_UNMERGE' );
		}
	}
}
//sdMatterContainer.init_class();

export default sdMatterContainer;
