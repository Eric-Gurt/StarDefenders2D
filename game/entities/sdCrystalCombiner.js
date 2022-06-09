
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
	
	getRequiredEntities() // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.crystal0 && this.crystal1 )
		return [ this.crystal0, this.crystal1 ]; 
	
		if ( this.crystal0 )
		return [ this.crystal0 ]; 
	
		if ( this.crystal1 )
		return [ this.crystal1 ]; 
		
		return [];
	}
	
	MergeCollisionTest( another_entity )
	{
		if ( another_entity === this.crystal0 )
		return false;
	
		if ( another_entity === this.crystal1 )
		return false;
		
		return true;
	}
	
	constructor( params )
	{
		super( params );
		
		/*this.matter_max = 0;
		this._last_matter_max = this.matter_max; // Change will cause hash update
		this.matter = this.matter_max;
		this._last_sync_matter = this.matter;
		this.crystals = 0;
		this.crystal1_matter_regen = 0; // Matter regen, taken from crystals when they are inserted
		this.crystal2_matter_regen = 0; // For 2nd crystal
		*/
	   
		this.crystal0 = null;
		this.crystal1 = null;
	   
		this._hmax = 600;
		this._hea = this._hmax;
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;
		
		this.prog = 0; // progress
		
		this.SetMethod( 'MergeCollisionTest', this.MergeCollisionTest ); // Here it used for "this" binding so method can be passed to collision logic
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
	
	GetMatterMax()
	{
		let matter_max = 0;
		
		for ( let i = 0; i < 2; i++ )
		if ( this[ 'crystal' + i ] )
		matter_max += this[ 'crystal' + i ].matter_max;

		return matter_max;
	}
	
	GetBaseAnimDuration()
	{
		return Math.max( 30 * 5, this.GetMatterMax() / 80 * 30 ) + 30;
	}

	onServerSideSnapshotLoaded( snapshot )
	{
		if ( snapshot.matter_max > 0 )
		{
			while ( snapshot.crystals > 0)
			{
				let ent = new sdCrystal({  });

				if ( snapshot.crystals === 2 )
				ent.x = this.x + 8;
				else
				ent.x = this.x - 8;
				ent.y = this.y + 7 - ent._hitbox_y2 - 0.1; // 7 instead of this._hitbox_y1 because we need final y1
				
				ent.matter_max = snapshot.matter_max / snapshot.crystals;
				ent.matter = snapshot.matter / snapshot.crystals;
				ent._damagable_in = 0;
				if ( snapshot.crystals === 2 )
				ent.matter_regen = snapshot.crystal2_matter_regen;
				else
				ent.matter_regen = snapshot.crystal1_matter_regen;

				sdEntity.entities.push( ent );
				sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible

				if ( snapshot.crystals === 1 )
				{
					snapshot.matter_max = 0;
					snapshot.matter = 0;
					snapshot.crystal1_matter_regen = 0;
				}
				else
				{
					snapshot.matter_max = snapshot.matter_max / snapshot.crystals;
					snapshot.matter = snapshot.matter / snapshot.crystals;
					snapshot.crystal2_matter_regen = 0;
				}
				
				snapshot.crystals--;
			}
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		//this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 ); // Commented to not deal with matter regen, which is probably a bad approach. Keep crystals as real entities instead?
		
		/*if ( this._last_matter_max !== this.matter_max )
		{
			 // Change will cause hash update as matter_max value specifies hitbox size
			this._last_matter_max = this.matter_max;
			sdWorld.UpdateHashPosition( this, false );
		}*/
		
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
		
		//this.MatterGlow( 0.01, 50, GSPEED );
		
		if ( this.prog > 0 )
		{
			let prog0 = this.prog;
			
			let duration = this.GetBaseAnimDuration() + 30;
			
			let X = duration - 30;
			
			//if ( this.prog > X )
			//GSPEED *= 0.2;
			
			this.prog += GSPEED;
			
			
			if ( sdWorld.is_server && this.prog < X && ( !this.crystal0 || !this.crystal1 ) )
			{
				// Cancel since some of them is broken
				this.prog = 0;
			}
			else
			{
				if ( prog0 < X && this.prog >= X )
				{
					sdSound.PlaySound({ name:'crystal_combiner_end', x:this.x, y:this.y, volume:1 });

					if ( sdWorld.is_server )
					this.CombineCrystalsEnd();
				}

				if ( this.prog >= duration )
				{
					if ( sdWorld.is_server )
					{
						this.prog = 0;

						//this.CombineCrystalsEnd();
						if ( this.crystal0 )
						this.DropCrystal( this.crystal0 );
					}
					else
					{
						this.prog = duration;
					}
				}
			}
			
			this._update_version++;
		}
		
		let merge_prog = this.prog / this.GetBaseAnimDuration();
		let merge_intens = Math.min( 1, Math.pow( merge_prog, 8 ) ) * 8;
		
		
		if ( this.crystal0 )
		{
			this.crystal0.x = this.x - 24 + 16 + merge_intens;
			this.crystal0.y = this.y + 7 - this.crystal0._hitbox_y2;
			this.crystal0.sx = 0;
			this.crystal0.sy = 0;
		}
		if ( this.crystal1 )
		{
			this.crystal1.x = this.x - 8 + 16 - merge_intens;
			this.crystal1.y = this.y + 7 - this.crystal1._hitbox_y2;
			this.crystal1.sx = 0;
			this.crystal1.sy = 0;
		}
		
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this.prog > 0 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}*/
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.prog === 0 )
		sdEntity.Tooltip( ctx, "Crystal combiner" );
		else
		sdEntity.Tooltip( ctx, "Crystal combiner ( combining "+(~~Math.min( 100, this.prog / this.GetBaseAnimDuration() * 100 ))+"% )" );

	}
	Draw( ctx, attached )
	{
		const offset_y = 2;

//		ctx.globalAlpha = 1;
//			ctx.filter = 'none';

		//ctx.globalAlpha = 0.75 + Math.sin( sdWorld.time / 300 ) * 0.25;
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner, - 32, - 16, 64,32 );

		//if ( this.crystals > 0 )
		if ( this.crystal0 || this.crystal1 )
		{
			let merge_prog = this.prog / this.GetBaseAnimDuration();
			let merge_intens = Math.min( 1, Math.pow( merge_prog, 8 ) ) * 8;

			let show_new_crystal = false;

			if ( merge_prog > 1 )
			{
				merge_prog = 1 - ( this.prog - this.GetBaseAnimDuration() ) / 30;
				show_new_crystal = true;
			}

			/*if ( this.crystal0 )
			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_empty, - 24 + merge_intens, - 16 + offset_y, 32,32 );
			
			if ( this.crystal1 && !show_new_crystal )
			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_empty, - 8 - merge_intens, - 16 + offset_y, 32,32 );
			*/
			//ctx.filter = sdWorld.GetCrystalHue( this.matter_max / this.crystals );

			//ctx.globalAlpha = ( this.matter / this.matter_max );

			if ( merge_prog > 0 || show_new_crystal )
			{
				// Most probably alpha is wrong for final crystal during last 1 second, but maybe it is fine with how fast it happens

				if ( show_new_crystal )
				{
					//ctx.filter = sdWorld.GetCrystalHue( this.matter_max );
				}

				ctx.filter += ' saturate(' + (Math.round(( 1 - merge_prog )*10)/10) + ') brightness(' + (Math.round(( 1.5 + merge_prog * 10 )*10)/10) + ')';

				if ( ctx.filter.indexOf( 'drop-shadow' ) === -1 )
				{
					ctx.filter += ' drop-shadow(0px 0px 7px rgba(255,255,255,'+(Math.round(( merge_prog * 5 )*10)/10)+'))';
				}

				ctx.globalAlpha = Math.min( 1, ctx.globalAlpha * merge_prog + 10 * ( 1 - merge_prog ) );
			}

			/*ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal, - 24 + merge_intens, - 16 + offset_y, 32,32 );
			if ( this.crystals === 2 && !show_new_crystal )
			ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal, - 8 - merge_intens, - 16 + offset_y, 32,32 );*/
			
			if ( this.crystal0 )
			{
				ctx.save();
				{
					ctx.translate( this.crystal0.x - this.x, this.crystal0.y - this.y );
					this.crystal0.Draw( ctx, true );
				}
				ctx.restore();
			}
			if ( this.crystal1 )
			{
				ctx.save();
				{
					ctx.translate( this.crystal1.x - this.x, this.crystal1.y - this.y );
					this.crystal1.Draw( ctx, true );
				}
				ctx.restore();
			}
		}

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner, - 32, - 16, 64,32 );
	}
	ModifyHeldCrystalFilter( old_filter )
	{
		let merge_prog = this.prog / this.GetBaseAnimDuration();
		//let merge_intens = Math.min( 1, Math.pow( merge_prog, 8 ) ) * 8;

		let show_new_crystal = false;

		if ( merge_prog > 1 )
		{
			merge_prog = 1 - ( this.prog - this.GetBaseAnimDuration() ) / 30;
			show_new_crystal = true;
		}

		if ( merge_prog > 0 || show_new_crystal )
		{
			// Most probably alpha is wrong for final crystal during last 1 second, but maybe it is fine with how fast it happens

			if ( old_filter === 'none' )
			old_filter = '';

			old_filter += ' saturate(' + (Math.round(( 1 - merge_prog )*10)/10) + ') brightness(' + (Math.round(( 1.5 + merge_prog * 10 )*10)/10) + ')';

			if ( old_filter.indexOf( 'drop-shadow' ) === -1 )
			{
				old_filter += ' drop-shadow(0px 0px 7px rgba(255,255,255,'+(Math.round(( merge_prog * 5 )*10)/10)+'))';
			}

			//ctx.globalAlpha = Math.min( 1, ctx.globalAlpha * merge_prog + 10 * ( 1 - merge_prog ) );
		}
		
		return old_filter;
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
	
		//if ( this.crystals !== 2 )
		if ( !this.crystal0 || !this.crystal1 )
		return;
	
		if ( this.prog === 0 )
		{
			sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, volume:1 });
			
			this.prog = 1;
		}
	}
	
	CombineCrystalsEnd()
	{
		if ( !sdWorld.is_server )
		return;
	
		//if ( this.crystals !== 2 )
		if ( !this.crystal0 || !this.crystal1 )
		return;
	
		//if ( this.matter_max > 0 )
		{
			/*let ent = new sdCrystal({  });

			ent.x = this.x;
			ent.y = this.y + 7 - ent._hitbox_y2 - 0.1; // 7 instead of this._hitbox_y1 because we need final y1

			ent.matter_max = this.matter_max;
			ent.matter = this.matter;
			ent.matter_regen = ( this.crystal1_matter_regen + this.crystal2_matter_regen ) / 2;
			ent._damagable_in = 0;*/
			
			let ent = this.crystal0;
			
			ent.x = this.x;
			ent.y = this.y + 7 - ent._hitbox_y2;
			
			ent.matter_max = this.crystal0.matter_max + this.crystal1.matter_max;
			ent.matter = this.crystal0.matter + this.crystal1.matter;
			ent.matter_regen = ( this.crystal0.matter_regen + this.crystal1.matter_regen ) / 2;
			
			if ( this.crystal0.type === sdCrystal.TYPE_CRYSTAL_CRAB || 
				 this.crystal1.type === sdCrystal.TYPE_CRYSTAL_CRAB )
			{
				sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, volume:0.5 });
			}
			
			ent.type = sdCrystal.TYPE_CRYSTAL_ARTIFICIAL;
			ent._hea = ent._hmax = sdCrystal.hitpoints_artificial;
			
			//this.DropCrystal( this.crystal0 );
			
			let c = this.crystal1;
			c.remove();
			c._broken = false;

			//sdEntity.entities.push( ent );
			//sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible

			//this.matter_max = 0;
			//this.matter = 0;
			
			// Update hitbox size (won't happen for static entities because their _last_x/y never change)
			//sdWorld.UpdateHashPosition( this, false ); // Optional, but will make it visible as early as possible

			this._ignore_pickup_tim = 30;

			this._update_version++;
			//this.crystals = 0;

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
			}, 50 );*/
		}
	}

	DropCrystals()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this.crystal0 )
		this.DropCrystal( this.crystal0 );
	
		if ( this.crystal1 )
		this.DropCrystal( this.crystal1 );
	}
	DropCrystal( crystal_to_drop, initiated_by_player=false )
	{
		if ( !sdWorld.is_server )
		return false;
	
		if ( initiated_by_player )
		if ( this.prog !== 0 )
		{
			return false;
		}
		
		if ( !crystal_to_drop )
		return false;
		
		if ( this.crystal0 === crystal_to_drop || this.crystal1 === crystal_to_drop )
		{
			if ( this.crystal0 === crystal_to_drop )
			{
				this.crystal0.held_by = null;
				this.crystal0.PhysWakeUp();
				this.crystal0 = null;
			}
			else
			//if ( this.crystal0 === crystal_to_drop )
			{
				this.crystal1.held_by = null;
				this.crystal1.PhysWakeUp();
				this.crystal1 = null;
			}
			
			this._ignore_pickup_tim = 30;
			this._update_version++;

			return true;
		}
		
		return false;
	}
	
	/*HookAttempt() // true for allow. from_entity is sdBullet that is hook tracer
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
	
		//if ( this._ignore_pickup_tim === 0 && !from_entity._is_being_removed && from_entity.is( sdCrystal ) && from_entity.matter_max !== sdCrystal.anticrystal_value && from_entity._held_by === null && from_entity.type === 1 )
		if ( this._ignore_pickup_tim === 0 && !from_entity._is_being_removed && from_entity.is( sdCrystal ) && from_entity.matter_max !== sdCrystal.anticrystal_value && from_entity.held_by === null && from_entity._hitbox_x2 - from_entity._hitbox_x1 <= 16 )
		{
			if ( from_entity.held_by === null )
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

				//if ( this.crystals < 2 )
				if ( !this.crystal0 || !this.crystal1 )
				{
					if ( this.crystal0 )
					if ( !this.crystal1 )
					if ( this.crystal0.matter_max !== from_entity.matter_max )
					return;
					
					if ( this.crystal1 )
					if ( !this.crystal0 )
					if ( this.crystal1.matter_max !== from_entity.matter_max )
					return;
		
					if ( from_entity.matter_max % 40 !== 0 ) // Make sure it is compatible with artificial one
					return;
				
					let can_put_left = ( !this.crystal0 && from_entity.CanMoveWithoutOverlap( 
							this.x - 24 + 16, 
							this.y + 7 - from_entity._hitbox_y2, 
							0 ) );
					
					let can_put_right = ( !this.crystal1 && from_entity.CanMoveWithoutOverlap( 
							this.x - 8 + 16, 
							this.y + 7 - from_entity._hitbox_y2, 
							0 ) );
							
					let di0 = Math.abs( ( this.x - 24 + 16 ) - from_entity.x );
					let di1 = Math.abs( ( this.x - 8 + 16 ) - from_entity.x );
					
					let slot = null;
					
					if ( di0 < di1 )
					{
						if ( can_put_left )
						slot = 'crystal0';
						else
						if ( can_put_right )
						slot = 'crystal1';
					}
					else
					{
						if ( can_put_right )
						slot = 'crystal1';
						else
						if ( can_put_left )
						slot = 'crystal0';
					}
					
					if ( slot === null )
					return;
					
					this[ slot ] = from_entity;
				
				
					//
				
					
					from_entity.held_by = this;
					this._update_version++;
					
					/*let crystal_add = 0;
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
					}*/
				}
			}
		}
		else
		{
			/*if ( this.prog === 0 )
			if ( from_entity.is( sdBullet ) )
			{
				this.DropCrystals();
			}*/
		}
	}
	
	MeasureMatterCost()
	{
	//	return 0; // Hack
		return 500 + this._hmax * sdWorld.damage_to_matter;
	}
}
//sdCrystalCombiner.init_class();

export default sdCrystalCombiner;
