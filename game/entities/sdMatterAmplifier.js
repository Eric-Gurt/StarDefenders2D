
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdBullet from './sdBullet.js';

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
	get hitbox_y1() { return ( this.matter_max > 0 ) ? ( this.shielded ? -10 : -6 ) : 7; }
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
		
		this.multiplier = params.multiplier || 1; // Crystal regeneration multiplier, used for higher tier matter amplifiers
		this._hmax = 160 + ( 160 * this.multiplier ) );
		this._hea = this._hmax;
		
		this.shielded = false;
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this.shielded )
		if ( this.matter_max > 0 )
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
		this._update_version++;
		sdWorld.UpdateHashPosition( this, false );
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 * ( sdMatterAmplifier.relative_regen_amplification_to_crystals * this.multiplier ) );
		
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
		/*
		var x = this.x;
		var y = this.y;
		for ( var xx = -2; xx <= 2; xx++ )
		for ( var yy = -2; yy <= 2; yy++ )
		//for ( var xx = -1; xx <= 1; xx++ )
		//for ( var yy = -1; yy <= 1; yy++ )
		{
			var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
			for ( var i = 0; i < arr.length; i++ )
			if ( typeof arr[ i ].matter !== 'undefined' || typeof arr[ i ]._matter !== 'undefined' )
			if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 50 ) >= 0 )
			if ( arr[ i ] !== this )
			{
				this.TransferMatter( arr[ i ], 0.01, GSPEED );
			}
		}*/
		
		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.matter_max === 0 )
		sdEntity.Tooltip( ctx, "Matter amplifier (no crystal)" );
		else
		sdEntity.Tooltip( ctx, "Matter amplifier ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
	}
	Draw( ctx, attached )
	{
		/*
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier_empty, - 16, - 16, 32,32 );
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( this.matter_max );
	
		ctx.globalAlpha = this.matter / this.matter_max;
		ctx.drawImageFilterCache( sdMatterAmplifier.img_matter_amplifier, - 16, - 16, 32,32 );

		ctx.globalAlpha = 1;
		ctx.filter = 'none';*/
		
		if ( this.matter_max > 0 )
		{
			
			const offset_y = 2;
			
			ctx.drawImageFilterCache( sdCrystal.img_crystal_empty, - 16, - 16 + offset_y, 32,32 );
		
			ctx.filter = sdWorld.GetCrystalHue( this.matter_max );

			ctx.globalAlpha = this.matter / this.matter_max;

			ctx.drawImageFilterCache( sdCrystal.img_crystal, - 16, - 16 + offset_y, 32,32 );

			ctx.globalAlpha = 1;
			ctx.filter = 'none';
			
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
	onRemove() // Class-specific, if needed
	{
		this.DropCrystal();
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
	
	DropCrystal()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.matter_max > 0 )
		{
			let ent = new sdCrystal({  });

			ent.x = this.x;
			ent.y = this.y + 7 - ent.hitbox_y2 - 0.1; // 7 instead of this.hitbox_y1 because we need final y1

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
	
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.matter_max === 0 )
		{
			if ( this._ignore_pickup_tim === 0 )
			if ( from_entity.is( sdCrystal ) )
			if ( sdWorld.Dist2D_Vector( from_entity.sx, from_entity.sy ) < 1.5 )
			{
				//console.log( 'vel ',sdWorld.Dist2D_Vector( from_entity.sx, from_entity.sy ));
				
				
				
				// Prevent catching pulled crystals
				for ( var i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.hook_x !== 0 || sdWorld.sockets[ i ].character.hook_y !== 0 )
				if ( sdWorld.sockets[ i ].character._hook_relative_to === from_entity )
				return;
				
				this.matter_max = from_entity.matter_max;
				this.matter = from_entity.matter;

				// Update hitbox size (won't happen for static entities because their _last_x/y never change)
				//sdWorld.UpdateHashPosition( this, false ); // Optional, but will make it visible as early as possible
			
				from_entity.onRemove = from_entity.onRemoveAsFakeEntity; // Disable any removal logic
				from_entity.remove();

				this._update_version++;
			}
		}
		else
		{
			if ( !this.shielded )
			if ( from_entity.is( sdBullet ) )
			{
				this.DropCrystal();
			}
		}
	}
	
	MeasureMatterCost()
	{
	//	return 0; // Hack
		if ( this.multiplier === 1 )
		return 300 + this._hmax * sdWorld.damage_to_matter + this.matter;
		if ( this.multiplier === 2 )
		return 600 + this._hmax * sdWorld.damage_to_matter + this.matter;
		if ( this.multiplier === 4 )
		return 1200 + this._hmax * sdWorld.damage_to_matter + this.matter;
		if ( this.multiplier === 8 ) // Needs cube shards matter upgrades to be placable
		return 2400 + this._hmax * sdWorld.damage_to_matter + this.matter;
	}
}
//sdMatterAmplifier.init_class();

export default sdMatterAmplifier;
