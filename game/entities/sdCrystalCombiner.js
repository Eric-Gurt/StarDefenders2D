
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdBullet from './sdBullet.js';

class sdCrystalCombiner extends sdEntity
{
	static init_class()
	{
		sdCrystalCombiner.img_crystal_combiner = sdWorld.CreateImageFromFile( 'crystal_combiner' );
		sdCrystalCombiner.img_crystal = sdWorld.CreateImageFromFile( 'crystal' );
		sdCrystalCombiner.img_crystal_empty = sdWorld.CreateImageFromFile( 'crystal_empty' );
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -18; }
	get hitbox_x2() { return 18; }
	get hitbox_y1() { return 7; }
	get hitbox_y2() { return 14; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	RequireSpawnAlign()
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.matter_max = 0;
		this._last_matter_max = this.matter_max; // Change will cause hash update
		
		this.matter = this.matter_max;
		
		this._last_sync_matter = this.matter;
		
		this._hmax = 600;
		this._hea = this._hmax;
		
		this.crystals = 0;
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;
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
		
		this._update_version++; // Just in case
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
		
		if ( this._last_matter_max !== this.matter_max )
		{
			 // Change will cause hash update as matter_max value specifies hitbox size
			this._last_matter_max = this.matter_max;
			sdWorld.UpdateHashPosition( this, false );
		}
		
		if ( this._ignore_pickup_tim > 0 )
		this._ignore_pickup_tim = Math.max( 0, this._ignore_pickup_tim - GSPEED );
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
			}
		}
		
		this.MatterGlow( 0.01, 50, GSPEED );
		
		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.crystals === 0 )
		sdEntity.Tooltip( ctx, "Crystal combiner (no crystals)" );
		else
		sdEntity.Tooltip( ctx, "Crystal combiner ( " + ~~(this.crystals) + " crystals , " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
	}
	Draw( ctx, attached )
	{
			const offset_y = 2;

	//		ctx.globalAlpha = 1;
	//			ctx.filter = 'none';
			
			//ctx.globalAlpha = 0.75 + Math.sin( sdWorld.time / 300 ) * 0.25;
			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner, - 32, - 16, 64,32 );

			if ( this.crystals > 0 )
			{
				ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_empty, - 24, - 16 + offset_y, 32,32 );
				if ( this.crystals === 2 )
				ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_empty, - 8, - 16 + offset_y, 32,32 );

				ctx.filter = sdWorld.GetCrystalHue( this.matter_max / this.crystals );

				ctx.globalAlpha = ( this.matter / this.matter_max );

				ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal, - 24, - 16 + offset_y, 32,32 );
				if ( this.crystals === 2 )
				ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal, - 8, - 16 + offset_y, 32,32 );
			}
			
			ctx.globalAlpha = 1;
			ctx.filter = 'none';
			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner, - 32, - 16, 64,32 );
	}
	onRemove() // Class-specific, if needed
	{
		this.DropCrystals();

		sdWorld.BasicEntityBreakEffect( this, 10 );
	}
	
	CombineCrystals()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.matter_max > 0 )
		{
			let ent = new sdCrystal({  });

			ent.x = this.x;
			ent.y = this.y + 7 - ent._hitbox_y2 - 0.1; // 7 instead of this._hitbox_y1 because we need final y1

			ent.matter_max = this.matter_max;
			ent.matter = this.matter;
			ent._damagable_in = 0;

			sdEntity.entities.push( ent );
			sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible

			this.matter_max = 0;
			this.matter = 0;
			
			// Update hitbox size (won't happen for static entities because their _last_x/y never change)
			//sdWorld.UpdateHashPosition( this, false ); // Optional, but will make it visible as early as possible

			this._ignore_pickup_tim = 30;

			this._update_version++;
			this.crystals = 0;

			let that = this;

			// Wait for hook target to finalize
			setTimeout( ()=>
			{
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.hook_x !== 0 || sdWorld.sockets[ i ].character.hook_y !== 0 )
				if ( sdWorld.sockets[ i ].character._hook_relative_to === that )
				{
					sdWorld.sockets[ i ].character._hook_relative_to = ent;
					//sdWorld.sockets[ i ].character.hook_x = ent.x;
					//sdWorld.sockets[ i ].character.hook_y = ent.y;
					sdWorld.sockets[ i ].character._hook_relative_x = 0;
					sdWorld.sockets[ i ].character._hook_relative_y = 0;
					//debugger;
				}
			}, 50 );
		}
	}

	DropCrystals()
	{
		if ( !sdWorld.is_server )
		return;
		if ( this.matter_max > 0 )
		{
			while ( this.crystals > 0)
			{
				let ent = new sdCrystal({  });

				if ( this.crystals === 2 )
				ent.x = this.x + 8;
				else
				ent.x = this.x - 8;
				ent.y = this.y + 7 - ent._hitbox_y2 - 0.1; // 7 instead of this._hitbox_y1 because we need final y1

				ent.matter_max = this.matter_max / this.crystals;
				ent.matter = this.matter / this.crystals;
				ent._damagable_in = 0;

				sdEntity.entities.push( ent );
				sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible

				if ( this.crystals === 1 )
				{
				this.matter_max = 0;
				this.matter = 0;
				}
				else
				{
				this.matter_max = this.matter_max / this.crystals;
				this.matter = this.matter / this.crystals;
				}
				// Update hitbox size (won't happen for static entities because their _last_x/y never change)
				//sdWorld.UpdateHashPosition( this, false ); // Optional, but will make it visible as early as possible

				this._ignore_pickup_tim = 30;

				this._update_version++;
				this.crystals--;

				let that = this;

				// Wait for hook target to finalize
				setTimeout( ()=>
				{
					for ( var i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].character )
					if ( sdWorld.sockets[ i ].character.hook_x !== 0 || sdWorld.sockets[ i ].character.hook_y !== 0 )
					if ( sdWorld.sockets[ i ].character._hook_relative_to === that )
					{
						sdWorld.sockets[ i ].character._hook_relative_to = ent;
						//sdWorld.sockets[ i ].character.hook_x = ent.x;
						//sdWorld.sockets[ i ].character.hook_y = ent.y;
						sdWorld.sockets[ i ].character._hook_relative_x = 0;
						sdWorld.sockets[ i ].character._hook_relative_y = 0;
						//debugger;
					}
				}, 50 );
			}
		}
	}
	
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
		if ( this._ignore_pickup_tim === 0 )
		if ( from_entity.is( sdCrystal ) && from_entity.matter_max !== sdCrystal.anticrystal_value )
		{
			if ( sdWorld.Dist2D_Vector( from_entity.sx, from_entity.sy ) < 1.5 )
			{
				//console.log( 'vel ',sdWorld.Dist2D_Vector( from_entity.sx, from_entity.sy ));

				// Prevent catching pulled crystals
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.hook_x !== 0 || sdWorld.sockets[ i ].character.hook_y !== 0 )
				if ( sdWorld.sockets[ i ].character._hook_relative_to === from_entity )
				return;

				if ( this.crystals < 2 )
				{
					let crystal_add = 0;
					if ( this.crystals === 1 )
					if ( this.matter_max === from_entity.matter_max )
					{
						this.matter_max += from_entity.matter_max;
						this.matter += from_entity.matter;
						crystal_add = 1;
					}
					//if ( this.crystals === 0 && from_entity.matter_max < 5120 ) // Can't put orange crystals into the combiner
					if ( this.crystals === 0 && from_entity.matter_max < 10240 ) // Orange crystals can be put but they will cause anti crysytal
					{
						this.matter_max = from_entity.matter_max;
						this.matter = from_entity.matter;
						crystal_add = 1;
					}
					// Update hitbox size (won't happen for static entities because their _last_x/y never change)
					//sdWorld.UpdateHashPosition( this, false ); // Optional, but will make it visible as early as possible
					if ( crystal_add === 1 ) // Prevent destroying crystals that don't match the first one in the crystal combiner
					{
						//from_entity.onRemove = from_entity.onRemoveAsFakeEntity; // Disable any removal logic
						from_entity.SetMethod( 'onRemove', from_entity.onRemoveAsFakeEntity ); // Disable any removal logic
						from_entity.remove();
						from_entity._remove();

						this._update_version++;
						this._ignore_pickup_tim = 30;
						this.crystals++;
					}
				}
			}
		}
		else
		{
			if ( from_entity.is( sdBullet ) )
			{
				this.DropCrystals();
			}
		}
	}
	
	MeasureMatterCost()
	{
	//	return 0; // Hack
		return 1500 + this._hmax * sdWorld.damage_to_matter + this.matter;
	}
}
//sdCrystalCombiner.init_class();

export default sdCrystalCombiner;
