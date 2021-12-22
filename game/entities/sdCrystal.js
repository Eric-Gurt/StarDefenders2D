
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdStorage from './sdStorage.js';
import sdPlayerDrone from './sdPlayerDrone.js';

class sdCrystal extends sdEntity
{
	static init_class()
	{
		sdCrystal.img_crystal = sdWorld.CreateImageFromFile( 'crystal' );
		sdCrystal.img_crystal_empty = sdWorld.CreateImageFromFile( 'crystal_empty' );

		sdCrystal.img_crystal_cluster = sdWorld.CreateImageFromFile( 'crystal_cluster' ); // Sprite by HastySnow / LazyRain
		sdCrystal.img_crystal_cluster_empty = sdWorld.CreateImageFromFile( 'crystal_cluster_empty' ); // Sprite by HastySnow / LazyRain

		sdCrystal.img_crystal_cluster2 = sdWorld.CreateImageFromFile( 'crystal_cluster2' ); // Sprite by Darkstar1
		sdCrystal.img_crystal_cluster2_empty = sdWorld.CreateImageFromFile( 'crystal_cluster2_empty' ); // Sprite by Darkstar1
		
		sdCrystal.img_crystal_crab = sdWorld.CreateImageFromFile( 'sdCrystalCrab' );
		
		sdCrystal.anticrystal_value = 10240;
		
		sdCrystal.TYPE_CRYSTAL = 1;
		sdCrystal.TYPE_CRYSTAL_BIG = 2;
		sdCrystal.TYPE_CRYSTAL_CRAB = 3;
		
		sdCrystal.recharges_until_depleated = 100;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	/*get hitbox_x1() { return this.should_draw === 0 ? -2 : this.type === 2 ? -14 : -4; }
	get hitbox_x2() { return this.should_draw === 0 ? 2 : this.type === 2 ? 14 : 5; }
	get hitbox_y1() { return this.should_draw === 0 ? -2 : this.type === 2 ? -14 : -7; }
	get hitbox_y2() { return this.should_draw === 0 ? 2 : this.type === 2 ? 16 : 5; }*/
	get hitbox_x1() { return this.type === sdCrystal.TYPE_CRYSTAL_BIG ? -14 : -4; }
	get hitbox_x2() { return this.type === sdCrystal.TYPE_CRYSTAL_BIG ? 14 : 5; }
	get hitbox_y1() { return this.type === sdCrystal.TYPE_CRYSTAL_BIG ? -14 : -7; }
	get hitbox_y2() { return this.type === sdCrystal.TYPE_CRYSTAL_BIG ? 16 : 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.held_by !== null ? false : true; }
	
	/* Causes client-side falling through unsynced ground, probably bad thing to do and it won't be complex entity after sdSnapPack is added
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }*/
	
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		return ( this.held_by === null );
	}
	
	get title()
	{
		if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type !== 2 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
		{
			if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
			return 'Anti-crystal crab';
			else
			return 'Anti-crystal';
		}
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
		return 'Crystal crab';
		else
		return 'Crystal';
	}
	
	get should_draw()
	{
		throw new Error('Obsolete, use this.held_by instead');
	}
	set should_draw( v )
	{
		throw new Error('Obsolete, use this.held_by instead');
	}
	
	constructor( params )
	{
		super( params );
		
		let is_deep = params.tag === 'deep' || params.tag === 'deep_crab';
		
		if ( params.tag === 'deep_crab' || params.tag === 'crab' )
		params.type = sdCrystal.TYPE_CRYSTAL_CRAB;
		
		this.sx = 0;
		this.sy = 0;
		this.type = params.type || 1;
		this.matter_max = this.type === sdCrystal.TYPE_CRYSTAL_BIG ? 160 : 40;

		this.held_by = null; // For storage crates
		//this.should_draw = 1; // For storage crates, guns have ttl which can make them dissapear // EG: I think I'm missing something, but ttl is for deletion rather than being drawn? Revert to .should_draw if my changes break anything
		
		let bad_luck = 1.45; // High value crystals are more rare if this value is high
		
		let r = 1 - Math.pow( Math.random(), bad_luck );
		//let r = Math.random();
		
		//r = 0; // Hack
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
		{
			this._next_action = sdWorld.time + 2000;
			this.walk_direction = 0;
			this.side = -1;
			this.blink = 0;
			this._blink_until = 0;
			this._last_stand_when = 0;
		}
		
		if ( r < 0.00390625 && is_deep ) // matter consuming crystal
		this.matter_max *= 256;
		else
		if ( r < 0.0078125 && is_deep ) // glowing, new
		this.matter_max *= 128;
		else
		if ( r < 0.015625 && is_deep ) // Red, new
		this.matter_max *= 64;
		else
		if ( r < 0.03125 && is_deep ) // Pink variation, new (old red)
		this.matter_max *= 32;
		else
		if ( r < 0.0625 )
		this.matter_max *= 16;
		else
		if ( r < 0.125 )
		this.matter_max *= 8;
		else
		if ( r < 0.25 )
		this.matter_max *= 4;
		else
		if ( r < 0.5 )
		this.matter_max *= 2;
		
		this._last_damage = 0; // Sound flood prevention

		this.matter_regen = params.matter_regen || 100; // Matter regeneration rate/percentage, depends on crystal and drains as crystal regenerates matter
		
		if ( typeof params.matter_max !== 'undefined' )
		this.matter_max = params.matter_max;
	
		if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type === 1 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
		{
			this.matter = 0;
			this._hea = 600;
			this._damagable_in = 0;
		}
		else
		{
			this.matter = this.matter_max;
			this._hea = this.type === sdCrystal.TYPE_CRYSTAL_BIG ? 240 : 60;
			this._damagable_in = sdWorld.time + 1000; // Suggested by zimmermannliam, will only work for sdCharacter damage		
		}
		this._hmax = this._hea; // For repair logic
		
		// Crabs can be healed x2 from original health (from grass)
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
		this._hmax *= 2; 
	}

	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdLifeBox' ];
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.held_by !== null )
		return;
	
		//if ( initiator !== null )
		if ( initiator === null || initiator.IsPlayerClass() )
		if ( sdWorld.time < this._damagable_in )
		if ( !( initiator && initiator.IsPlayerClass() && initiator.power_ef > 0 ) )
		{
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });
			return;
		}
		
		dmg = Math.abs( dmg );
		
		let was_alive = ( this._hea > 0 );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		{
			if ( was_alive )
			{
				//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:1 });
				sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.5 });
				
				if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
				sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, volume:0.5 });
				
				if ( this.type === sdCrystal.TYPE_CRYSTAL_BIG ) // Big crystals
				{
					sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
						Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
						this.matter_max / 160,
						8
					);

					let ent = new sdCrystal({x: this.x, y: this.y + 4, sx: this.sx, sy: this.sy, type:1 });

					ent.matter_max = this.matter_max / 4;
					ent.matter = this.matter / 4;

					sdEntity.entities.push( ent );
					sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible
				}
				else
				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
					Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					this.matter_max / 40,
					5
				);
		
		

				this.remove();
			}
		}
		else
		{
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
				
				if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
				{
					sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, pitch:1.5, volume:0.3 });
					
					this._blink_until = sdWorld.time + 1000;
				}
			}
		}
	}
	
	get mass() { return this.type === 2 ? 120 : 30; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	IsVisible( observer_character ) // Can be used to hide crystals that are held by crates
	{
		if ( this.held_by === null )
		return true;
		else
		{
			if ( this.held_by.is( sdStorage ) )
			{
				if ( observer_character )
				if ( sdWorld.inDist2D_Boolean( observer_character.x, observer_character.y, this.x, this.y, sdStorage.access_range ) )
				return true;
			}
			/*else
			if ( this.held_by.is( sdCharacter ) )
			{
				// Because in else case B key won't work
				//if ( sdGun.classes[ this.class ].is_build_gun ) Maybe it should always work better if player will know info about all of his guns. Probably that will be later used in interface anyway
				if ( this.held_by === observer_character )
				return true;
		
				if ( !this.held_by.ghosting || this.held_by.IsVisible( observer_character ) )
				if ( !this.held_by.driver_of )
				{
					return ( this.held_by.gun_slot === sdGun.classes[ this.class ].slot );
				}
			}*/
		}
		
		return false;
	}
	UpdateHeldPosition()
	{
		if ( this.held_by ) // Should not happen but just in case
		{
			let old_x = this.x;
			let old_y = this.y;
			
			this.x = this.held_by.x;
			this.y = this.held_by.y;

			if ( typeof this.held_by.sx !== 'undefined' )
			{
				this.sx = this.held_by.sx;
				this.sy = this.held_by.sy;
				
				if ( isNaN( this.sx ) )
				{
					console.log( 'Entity with corrupted velocity: ', this.held_by );
					throw new Error('sdCrystal is held by entity with .sx as NaN');
				}
			}

			if ( this.x !== old_x || this.y !== old_y )
			sdWorld.UpdateHashPosition( this, false, false );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type !== 2 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
		GSPEED *= 0.25;
			
		this.sy += sdWorld.gravity * GSPEED;
		
		if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
		{
			if ( sdWorld.is_server )
			{
				if ( this.matter > 5 )
				{
					if ( sdWorld.time > this._next_action )
					{
						this._next_action = sdWorld.time + 1500 + Math.random() * 6000;

						let r = Math.random();

						if ( r < 0.333 )
						this._blink_until = sdWorld.time + 200 + Math.random() * 200;
						else
						if ( r < 0.5 )
						{
							//this.side = Math.random() < 0.5 ? 1 : -1;
							this.sy -= 3;
							this.walk_direction = this.side * 60;
							this.PhysWakeUp();
						}
						else
						{
							this.walk_direction = -100 + Math.random() * 200;
							this.side = this.walk_direction > 0 ? 1 : -1;
						}
					}
					this.blink = sdWorld.time < this._blink_until;
				}
				else
				this.blink = 1;
			}

			if ( this.walk_direction !== 0 )
			{
				if ( sdWorld.time < this._last_stand_when + 50 )
				{
					this.sx += this.walk_direction * 0.01 * GSPEED;
				}
				
				this.PhysWakeUp();

				if ( this.walk_direction > 0 )
				this.walk_direction = Math.max( 0, this.walk_direction - GSPEED );
				else
				this.walk_direction = Math.min( 0, this.walk_direction + GSPEED );
			}
			
			sdWorld.last_hit_entity = null;
			
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			
			if ( sdWorld.last_hit_entity )
			{
				this._last_stand_when = sdWorld.time;
			}
		}
		else
		{
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		
		
		
		if ( this.held_by === null ) // Don't emit matter if inside a crate
		{
			if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type !== 2 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
			{
				this.HungryMatterGlow( 0.01, 100, GSPEED );
				this.matter = Math.max( 0, this.matter - GSPEED * 0.01 * this.matter );
			}
			else
			{
				//let matter_to_transfer = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 * ( this.matter_regen / 100 ) ) - this.matter;
				//this.matter_regen = Math.max( 20, this.matter_regen - ( ( matter_to_transfer / this.matter_max ) ) );
				
				let matter_before_regen = this.matter;
				
				this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 * ( this.matter_regen / 100 ) );
				
				this.matter_regen = Math.max( 20, this.matter_regen - ( this.matter - matter_before_regen ) / this.matter_max * 100 / sdCrystal.recharges_until_depleated ); // 30 full recharges
				
				this.MatterGlow( 0.01, 30, GSPEED );
			}
		}
		
		// Similar to sdMatterContainers but not really, since it can have consistent slight movement unlike containers
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.1 || Math.abs( this._last_sync_x - this.x ) >= 1 || Math.abs( this._last_sync_y - this.y ) >= 1 )
		{
			this._last_sync_matter = this.matter;
			this._last_sync_x = this.x;
			this._last_sync_y = this.y;
			this._update_version++;
		}*/
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.should_draw === 1 )
		if ( this.held_by === null )
		{
			if ( ( this.matter_max === sdCrystal.anticrystal_value && this.type !== 2 ) || ( this.matter_max === sdCrystal.anticrystal_value * 4 && this.type === 2 ) )
			sdEntity.Tooltip( ctx, this.title + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
			else
			{
				// Limit vision to cable managment owner
				if ( sdWorld.my_entity.is( sdPlayerDrone ) ||
					( sdWorld.my_entity._inventory[ sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].slot ] && 
					  sdWorld.my_entity._inventory[ sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].slot ].class === sdGun.CLASS_CABLE_TOOL ) )
				sdEntity.Tooltip( ctx, this.title + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " ) (matter regeneration rate: " + ~~(this.matter_regen ) + "%)" );
				else
				{
					if ( this.matter_regen <= 33 )
					sdEntity.Tooltip( ctx, this.title + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " ) (depleted)" );
					else
					sdEntity.Tooltip( ctx, this.title + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
				}
			}
		}
	}
	Draw( ctx, attached )
	{
		//if ( this.should_draw === 1 )
		if ( this.held_by === null )
		{
			if ( this.type === 1 )
			{
				ctx.drawImageFilterCache( sdCrystal.img_crystal_empty, - 16, - 16, 32, 32 );
		
				ctx.filter = sdWorld.GetCrystalHue( this.matter_max );

				if ( this.matter_max === sdCrystal.anticrystal_value )
				ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
				else
				ctx.globalAlpha = this.matter / this.matter_max;
		
				ctx.drawImageFilterCache( sdCrystal.img_crystal, - 16, - 16, 32, 32 );
		
				ctx.globalAlpha = 1;
				ctx.filter = 'none';
			}
			else
			if ( this.type === 2 )
			{
				ctx.drawImageFilterCache( sdCrystal.img_crystal_cluster2_empty, - 24, - 24, 48, 48 );
		
				ctx.filter = sdWorld.GetCrystalHue( this.matter_max / 4 );

				if ( this.matter_max === sdCrystal.anticrystal_value * 4 )
				ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
				else
				ctx.globalAlpha = this.matter / this.matter_max;
		
				ctx.drawImageFilterCache( sdCrystal.img_crystal_cluster2, - 24, - 24, 48, 48 );
		
				ctx.globalAlpha = 1;
				ctx.filter = 'none';
			}
			else
			if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
			{
				ctx.scale( -this.side, 1 );
				
				let frame = 0;
				
				if ( this.walk_direction !== 0 )
				{
					frame = [ 0, 1, 0, 2 ][ ~~( Math.abs( this.walk_direction / 4 ) % 4 ) ];
				}
				else
				if ( this.blink )
				frame = 3;
				
				ctx.drawImageFilterCache( sdCrystal.img_crystal_crab, frame*32,32,32,32, - 16, - 16, 32,32 );
		
				ctx.filter = sdWorld.GetCrystalHue( this.matter_max, 0.75, 'aa' );

				if ( this.matter_max === sdCrystal.anticrystal_value )
				ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;
				else
				ctx.globalAlpha = this.matter / this.matter_max;
				
				ctx.drawImageFilterCache( sdCrystal.img_crystal_crab, frame*32,0,32,32, - 16, - 16, 32,32 );
		
				ctx.globalAlpha = 1;
				ctx.filter = 'none';
			}
		
		}
	}
	onRemove() // Class-specific, if needed
	{
		/*if ( this._hea <= 0 ) // In else case it was just removed (not best way to check)
		{
			sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
				Math.ceil( Math.max( 5, this.matter / this.matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 40
			);
		}*/
	}
	MeasureMatterCost()
	{
		return 0; // Hack
		
		//return this._hmax * sdWorld.damage_to_matter + this.matter;
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
			{
				if ( command_name === 'POKE' )
				{
					if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
					{
						this.type = sdCrystal.TYPE_CRYSTAL;
						sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, volume:0.5 });
					}
					else
					{
						executer_socket.SDServiceMessage( this.title + ' is too far' );
						return;
					}
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
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			if ( this.type === sdCrystal.TYPE_CRYSTAL_CRAB )
			{
				this.AddContextOption( 'Melt into regular crytal', 'POKE', [] );
			}
		}
	}
}
//sdCrystal.init_class();

export default sdCrystal;
