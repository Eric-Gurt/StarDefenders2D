import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdCrystal from './sdCrystal.js';
import sdGuanako from './sdGuanako.js';
import sdTimer from './sdTimer.js';


class sdGuanakoStructure extends sdEntity
{
	static init_class()
	{
		sdGuanakoStructure.img_structure = sdWorld.CreateImageFromFile( 'sdGuanako' );
		sdGuanakoStructure.img_structure_crystal = sdWorld.CreateImageFromFile( 'sdGuanako_tent_crystal' );
		sdGuanakoStructure.img_grave_crystal = sdWorld.CreateImageFromFile( 'sdGuanako_grave_crystal' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -12; }
	get hitbox_x2() { return 14; }
	get hitbox_y1() { return ( this.hea > 0 && this.building_progress >= 100 ) ? -20 : -6; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Guanako tent';
	}
	
	//IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	//{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( dmg > 0 )
		{
			if ( initiator.is( sdGuanako ) )
			{
				return;
			}
		}
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			if ( this.hea <= 0 )
			{
				this.DropCrystalGuanakoOnly();
				
				let old_broken = this._broken;
				this._broken = true;
				{
					sdWorld.BasicEntityBreakEffect( this, 10 );
				}
				this._broken = old_broken;
				
				while ( this._guanakos_inside > 0 )
				this.ReleaseGuanako();
				
				this._update_version++;
			}
			
			this._regen_timeout = 60;
		}
		else
		{
			this.hea -= dmg;
		}

		if ( this.building_progress < 100 )
		{
			if ( this.hea <= 0 )
			{
				this.remove();
				this._broken = true;
			}
		}
		else
		if ( this.hea <= -this.hmax * 0.5 )
		{
			this.remove();
			this._broken = true;
		}
	}
	PickCrystal( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
		
		this.DropCrystalGuanakoOnly( true );
		
		this.crystal = from_entity;
		this.crystal.held_by = this;
		this.crystal.onCarryStart();
		
		this.crystal.sx = 0;
		this.crystal.sy = 0;
		
		this.crystal.x = this.x;
		this.crystal.y = this.y + this._hitbox_y1 - this.crystal._hitbox_y1 + 1;
		
		this._current_highest_crystal_tier = Math.max( this.crystal.GetTier(), this._current_highest_crystal_tier );
		
		this._update_version++;
	}
	DropCrystalGuanakoOnly()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.crystal )
		{
			if ( !this.crystal._is_being_removed )
			{
				this.crystal.sx = 0;
				this.crystal.sy = 0;
				
				this.crystal.held_by = null;
				this.crystal.onCarryEnd();
			}
			else
			{
				this.crystal.held_by = null;
				this.crystal.onCarryEnd();
			}
			this.crystal = null;
			
			this._update_version++;
		}
	}
	get shielded() // Makes it protect crystal from Octopus attack
	{
		return true;
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 600; // Stronger variations have more health
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		this.crystal = null;
		
		this.building_progress = 0;
		
		this._owner_guanako = null;
		
		this._guanakos_inside = 0;
		this._last_highest_crystal_tier = 1;
		this._current_highest_crystal_tier = 1;
		
		this.type = params.type;
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_owner_guanako' );
	}
	CrystalHasHardCollision( crystal )
	{
		return false;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.hea <= 0 )
		{
			//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			this.Damage( GSPEED );
			
			if ( this._is_being_removed )
			this._broken = false;
		}
		else
		if ( this.building_progress < 100 )
		{
			this.building_progress += GSPEED * 0.2;
			this.hea = Math.min( this.hea + GSPEED * 0.2 / 100, this.hmax );
			
			this._update_version++;
		}
		else
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this.hea < this.hmax )
		{
			this.hea = Math.min( this.hea + GSPEED, this.hmax );
			this._update_version++;
		}
		else
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove()
	{
		this.DropCrystalGuanakoOnly();
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 4 );
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( from_entity.is( sdGuanakoStructure ) )
		{
			if ( from_entity.building_progress < this.building_progress )
			{
				from_entity.remove();
			}
			else
			if ( from_entity.building_progress > this.building_progress )
			{
				this.remove();
			}
		}
		if ( this.hea > 0 )
		if ( this.building_progress >= 100 )
		if ( from_entity.is( sdGuanako ) )
		if ( from_entity._home === this )
		{
			if ( this._last_highest_crystal_tier < this._current_highest_crystal_tier )
			{
				// Steal guanako for splitting
				from_entity.remove();
				from_entity._broken = false;
				
				this._guanakos_inside++;
				
				sdTimer.ExecuteWithDelay( ( timer )=>{
					
					if ( this.hea <= 0 )
					return;

					if ( this._last_highest_crystal_tier < this._current_highest_crystal_tier )
					{
						this._guanakos_inside++;
						this._last_highest_crystal_tier *= 2;
						
						timer.ScheduleAgain( 5000 );
					}
					else
					{
						if ( this._guanakos_inside > 0 )
						{
							this.ReleaseGuanako();
							
							timer.ScheduleAgain( 5000 );
						}
					}

				}, 5000 );
			}
		}
		/*if ( this.hea > 0 )
		if ( this.building_progress >= 100 )
		if ( from_entity.is( sdCrystal ) )
		{
			if ( !from_entity.is_big )
			if ( from_entity.held_by === null )
			if ( !from_entity._is_being_removed )
			{
				if ( this.crystal )
				{
					if ( this.crystal.matter_max * this.crystal.matter_regen >= from_entity.matter_max * from_entity.matter_regen )
					return;
				}
				
				//this.DropCrystalGuanakoOnly();
				this.PickCrystal( from_entity );
			}
		}*/
	}
	
	ReleaseGuanako()
	{
		this._guanakos_inside--;
		this._owner_guanako = sdEntity.Create( sdGuanako, { x:this.x - 5 + Math.random() * 10, y:this.y } );
		this._owner_guanako._home = this;
		this._owner_guanako.sx = -2 + Math.random() * 4;
		this._owner_guanako.sy = -1;
		
		this._owner_guanako.y -= this._owner_guanako.hitbox_y2;
	}

	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		//ctx.filter = sdGuanakoStructure.colors[ this.type * 3 ];
		
		let xx = 0;
		
		if ( this.building_progress < 100 && !sdShop.isDrawing )
		{
			if ( this.building_progress < 33 )
			xx = 4;
			else
			if ( this.building_progress < 66 )
			xx = 5;
			else
			xx = 6;
		}
		else
		{
			if ( this.hea <= 0 )
			xx = 2;
		}
		
		ctx.drawImageFilterCache( sdGuanakoStructure.img_structure, xx*32,32,32,32, -16, -32+8-4, 32,32 );
		
		if ( this.crystal )
		{
			let visual_matter_max = this.crystal.matter_max;
			
			if ( this.crystal.type === sdCrystal.TYPE_CRYSTAL_BALLOON )
			visual_matter_max *= 4;
			
			let crystal_hue_filter = sdWorld.GetCrystalHue( visual_matter_max );
			
			this.crystal.SetCrystalFilter( ctx, true, crystal_hue_filter );
			
			ctx.drawImageFilterCache( sdGuanakoStructure.img_structure_crystal, -16, -32+8-4, 32,32 );
		}
		
		ctx.filter = 'none';
		
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}
//sdGuanakoStructure.init_class();

export default sdGuanakoStructure;
