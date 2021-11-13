
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdBullet from './sdBullet.js';
//import sdWorld.entity_classes.sdPlayerDrone from './sdWorld.entity_classes.sdPlayerDrone.js';

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

		this.crystal1_matter_regen = 0; // Matter regen, taken from crystals when they are inserted

		this.crystal2_matter_regen = 0; // For 2nd crystal
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;
		
		this.prog = 0; // progress
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
	
	GetBaseAnimDuration()
	{
		return Math.max( 30 * 5, this.matter_max / 80 * 30 ) + 30;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		//this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
		
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
		
		if ( this.prog > 0 )
		{
			let prog0 = this.prog;
			
			let duration = this.GetBaseAnimDuration() + 30;
			
			let X = duration - 30;
			
			//if ( this.prog > X )
			//GSPEED *= 0.2;
			
			this.prog += GSPEED;
			
			if ( prog0 < X && this.prog >= X )
			{
				sdSound.PlaySound({ name:'crystal_combiner_end', x:this.x, y:this.y, volume:1 });
			}
			
			if ( this.prog >= duration )
			{
				if ( sdWorld.is_server )
				{
					this.prog = 0;

					this.CombineCrystalsEnd();
				}
				else
				{
					this.prog = duration;
				}
			}
		}
		
		if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this.prog > 0 || this._last_x !== this.x || this._last_y !== this.y )
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
		{
			if ( this.prog === 0 )
			sdEntity.Tooltip( ctx, "Crystal combiner ( " + ~~(this.crystals) + " crystals, " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
			else
			sdEntity.Tooltip( ctx, "Crystal combiner ( combining "+(~~Math.min( 100, this.prog / this.GetBaseAnimDuration() * 100 ))+"%, " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
		}
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
			let merge_prog = this.prog / this.GetBaseAnimDuration();
			let merge_intens = Math.min( 1, Math.pow( merge_prog, 8 ) ) * 8;

			let show_new_crystal = false;

			if ( merge_prog > 1 )
			{
				merge_prog = 1 - ( this.prog - this.GetBaseAnimDuration() ) / 30;
				show_new_crystal = true;
			}

			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_empty, - 24 + merge_intens, - 16 + offset_y, 32,32 );
			if ( this.crystals === 2 && !show_new_crystal )
			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_empty, - 8 - merge_intens, - 16 + offset_y, 32,32 );

			ctx.filter = sdWorld.GetCrystalHue( this.matter_max / this.crystals );

			ctx.globalAlpha = ( this.matter / this.matter_max );

			if ( merge_prog > 0 || show_new_crystal )
			{
				// Most probably alpha is wrong for final crystal during last 1 second, but maybe it is fine with how fast it happens

				if ( show_new_crystal )
				{
					ctx.filter = sdWorld.GetCrystalHue( this.matter_max );
				}

				ctx.filter += ' saturate(' + (Math.round(( 1 - merge_prog )*10)/10) + ') brightness(' + (Math.round(( 1.5 + merge_prog * 10 )*10)/10) + ')';

				if ( ctx.filter.indexOf( 'drop-shadow' ) === -1 )
				{
					ctx.filter += ' drop-shadow(0px 0px 7px rgba(255,255,255,'+(Math.round(( merge_prog * 5 )*10)/10)+'))';
				}

				ctx.globalAlpha = Math.min( 1, ctx.globalAlpha * merge_prog + 10 * ( 1 - merge_prog ) );
			}

			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal, - 24 + merge_intens, - 16 + offset_y, 32,32 );
			if ( this.crystals === 2 && !show_new_crystal )
			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal, - 8 - merge_intens, - 16 + offset_y, 32,32 );
		}

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner, - 32, - 16, 64,32 );
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			this.DropCrystals();

			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
	}
	
	CombineCrystals()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.crystals !== 2 )
		return;
	
		if ( this.prog === 0 )
		{
			sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, volume:1 });
			
			this.prog = 1;

			/*setTimeout(()=>
			{
				this.CombineCrystalsEnd();

			}, 5000 );*/
		}
	}
	
	CombineCrystalsEnd()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.crystals !== 2 )
		return;
	
		if ( this.matter_max > 0 )
		{
			let ent = new sdCrystal({  });

			ent.x = this.x;
			ent.y = this.y + 7 - ent._hitbox_y2 - 0.1; // 7 instead of this._hitbox_y1 because we need final y1

			ent.matter_max = this.matter_max;
			ent.matter = this.matter;
			ent.matter_regen = ( this.crystal1_matter_regen + this.crystal2_matter_regen ) / 2;
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
						if ( s.character._hook_relative_to === that )
						{
							s.character._hook_relative_to = ent;
							//s.character.hook_x = ent.x;
							//s.character.hook_y = ent.y;
							s.character._hook_relative_x = 0;
							s.character._hook_relative_y = 0;
							//debugger;
						}
					}
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
				if ( this.crystals === 2 )
				ent.matter_regen = this.crystal2_matter_regen;
				else
				ent.matter_regen = this.crystal1_matter_regen;

				sdEntity.entities.push( ent );
				sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible

				if ( this.crystals === 1 )
				{
					this.matter_max = 0;
					this.matter = 0;
					this.crystal1_matter_regen = 0;
				}
				else
				{
					this.matter_max = this.matter_max / this.crystals;
					this.matter = this.matter / this.crystals;
					this.crystal2_matter_regen = 0;
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
							if ( s.character._hook_relative_to === that )
							{
								s.character._hook_relative_to = ent;
								//s.character.hook_x = ent.x;
								//s.character.hook_y = ent.y;
								s.character._hook_relative_x = 0;
								s.character._hook_relative_y = 0;
								//debugger;
							}
						}
					}
				}, 50 );
			}
		}
	}
	/*HookAttempt( from_entity ) // true for allow. from_entity is sdBullet that is hook tracer
	{
		if ( !sdWorld.is_server )
		return;
	
		this.DropCrystals();
		
		return true;
	}*/
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		// Uncomment this if but still happens. Normally .onMovementInRange should never be called if one of entities is already being removed. Previously this was a problem at sdEntity physic simulation logic
		//if ( from_entity._is_being_removed )
		//return;
	
		if ( this._ignore_pickup_tim === 0 && !from_entity._is_being_removed && from_entity.is( sdCrystal ) && from_entity.matter_max !== sdCrystal.anticrystal_value && from_entity._held_by === null && from_entity.type === 1 )
		{
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
						if ( s.character.hook_x !== 0 || s.character.hook_y !== 0 )
						if ( s.character._hook_relative_to === from_entity )
						return;
					}
				}

				if ( this.crystals < 2 )
				{
					let crystal_add = 0;
					if ( this.crystals === 1 )
					if ( this.matter_max === from_entity.matter_max )
					{
						this.matter_max += from_entity.matter_max;
						this.matter += from_entity.matter;
						this.crystal2_matter_regen = from_entity.matter_regen;
						crystal_add = 1;
					}
					//if ( this.crystals === 0 && from_entity.matter_max < 5120 ) // Can't put orange crystals into the combiner
					if ( this.crystals === 0 && from_entity.matter_max < 10240 ) // Orange crystals can be put but they will cause anti crysytal
					{
						this.matter_max = from_entity.matter_max;
						this.matter = from_entity.matter;
						this.crystal1_matter_regen = from_entity.matter_regen;
						crystal_add = 1;
					}
					// Update hitbox size (won't happen for static entities because their _last_x/y never change)
					//sdWorld.UpdateHashPosition( this, false ); // Optional, but will make it visible as early as possible
					if ( crystal_add === 1 ) // Prevent destroying crystals that don't match the first one in the crystal combiner
					{
						//from_entity.onRemove = from_entity.onRemoveAsFakeEntity; // Disable any removal logic
						//from_entity.SetMethod( 'onRemove', from_entity.onRemoveAsFakeEntity ); // Disable any removal logic
						from_entity.remove();
						//from_entity._remove();

						this._update_version++;
						this._ignore_pickup_tim = 1; // Why 30? Makes it slower to put 2 crystals at once
						this.crystals++;
					}
				}
			}
		}
		else
		{
			if ( this.prog === 0 )
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
