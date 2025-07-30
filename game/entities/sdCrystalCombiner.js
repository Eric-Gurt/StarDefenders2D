
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdBullet from './sdBullet.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdGun from './sdGun.js';
import sdTimer from './sdTimer.js';

class sdCrystalCombiner extends sdEntity
{
	static init_class()
	{
		sdCrystalCombiner.img_crystal_combiner = sdWorld.CreateImageFromFile( 'crystal_combiner' ); // Image by LazyRain
		sdCrystalCombiner.img_crystal_combiner2 = sdWorld.CreateImageFromFile( 'crystal_combiner2' );
		sdCrystalCombiner.img_crystal_combiner3 = sdWorld.CreateImageFromFile( 'crystal_combiner3' );
		//sdCrystalCombiner.img_crystal = sdWorld.CreateImageFromFile( 'crystal' );
		//sdCrystalCombiner.img_crystal_empty = sdWorld.CreateImageFromFile( 'crystal_empty' );

		sdCrystalCombiner.TYPE_DEFAULT = 0; // Regular crystal combiner
		sdCrystalCombiner.TYPE_IMPROVED = 1; // Improved version, from workbench
		sdCrystalCombiner.TYPE_AUTOMATED = 2; // Upside-down version and combines automatically
		
		sdCrystalCombiner.AUTO_MODE_IDLE = 0;
		sdCrystalCombiner.AUTO_MODE_COMBINE = 1;
		sdCrystalCombiner.AUTO_MODE_DRAIN1 = 2;
		sdCrystalCombiner.AUTO_MODE_DRAIN2 = 3;
		sdCrystalCombiner.auto_mode_titles = [
			'Idle mode',
			'Combine mode',
			'Drain left mode',
			'Drain right mode'
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -18; }
	get hitbox_x2() { return 18; }
	get hitbox_y1() { return ( this.type === sdCrystalCombiner.TYPE_AUTOMATED ) ? -8 : 7; }
	get hitbox_y2() { return ( this.type === sdCrystalCombiner.TYPE_AUTOMATED ) ? -2 : 14; }
	
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

		this.type = params.type || 0; // Type of crystal combiner
	   
		this.crystal0 = null;
		this.crystal1 = null;
		
		this.drain_direction = 0;
	   
		this._hmax = 600 * 4;
		this.hea = this._hmax;
		
		this.fire_detected = 0;
		
		this._ignore_pickup_tim = 0;
		
		this._regen_timeout = 0;
		
		this.auto_mode = sdCrystalCombiner.AUTO_MODE_COMBINE;
		
		this.prog = 0; // progress
		
		this._time_amplification = 0;
		
		this.SetMethod( 'MergeCollisionTest', this.MergeCollisionTest ); // Here it used for "this" binding so method can be passed to collision logic
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		
		this.hea -= dmg;
		
		if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
		if ( this.hea < this._hmax * 0.333 )
		if ( !this.fire_detected )
		{
			this.fire_detected = 1;
			
			sdSound.PlaySound({ name:'fire_detected', x:this.x, y:this.y, volume:1 });
		}
		
		if ( this.hea <= 0 )
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
			
				/*if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
				ent.y = this.y + this._hitbox_y2 - ent._hitbox_y1 + 0.1;
				else
				ent.y = this.y + 7 - ent._hitbox_y2 - 0.1;*/
				ent.y = this.GetYFor( ent );
				
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
		GSPEED = sdGun.HandleTimeAmplification( this, GSPEED );
		
		//this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 ); // Commented to not deal with matter regen, which is probably a bad approach. Keep crystals as real entities instead?
		
		/*if ( this._last_matter_max !== this.matter_max )
		{
			 // Change will cause hash update as matter_max value specifies hitbox size
			this._last_matter_max = this.matter_max;
			sdWorld.UpdateHashPosition( this, false );
		}*/
		
		let can_hibernate = true;
		
		if ( this._ignore_pickup_tim > 0 )
		{
			this._ignore_pickup_tim = Math.max( 0, this._ignore_pickup_tim - GSPEED );
			can_hibernate = false;
		}
		
		if ( this._regen_timeout > 0 )
		{
			this._regen_timeout -= GSPEED;
			can_hibernate = false;
		}
		else
		{
			if ( this.hea < this._hmax )
			{
				this.hea = Math.min( this.hea + GSPEED, this._hmax );
				can_hibernate = false;
				
				if ( this.hea >= this._hmax )
				if ( this.fire_detected )
				{
					this.fire_detected = 0;
					
					sdSound.PlaySound({ name:'fire_gone', x:this.x, y:this.y, volume:1 });
				}
			}
		}
		
		//this.MatterGlow( 0.01, 50, GSPEED );
		
		if ( this.prog > 0 )
		{
			can_hibernate = false;
			
			let prog0 = this.prog;
			
			let duration = this.GetBaseAnimDuration() + 30;
			
			let X = duration - 30;
			
			//if ( this.prog > X )
			//GSPEED *= 0.2;
			
			if ( this.fire_detected )
			{
			}
			else
			{
				this.prog += GSPEED * ( 1 + this.type );

				if ( sdWorld.is_server )
				this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t: 27 * GSPEED, initiator: null }); // Overheat
			}
			
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

						if ( this.crystal0 )
						this.DropCrystal( this.crystal0 );
					
						this.AttemptGrabbingNewCrystals();
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
			can_hibernate = false;
			
			this.crystal0.x = this.x - 24 + 16 + merge_intens;
			//this.crystal0.y = this.y + 7 - this.crystal0._hitbox_y2;
			this.crystal0.y = this.GetYFor( this.crystal0 );
			this.crystal0.sx = 0;
			this.crystal0.sy = 0;
		}
		if ( this.crystal1 )
		{
			can_hibernate = false;
			
			this.crystal1.x = this.x - 8 + 16 - merge_intens;
			//this.crystal1.y = this.y + 7 - this.crystal1._hitbox_y2;
			this.crystal1.y = this.GetYFor( this.crystal1 );
			this.crystal1.sx = 0;
			this.crystal1.sy = 0;
		}
		
		if ( this.drain_direction !== 0 )
		{
			if ( this.crystal0 && this.crystal1 )
			{
				let drain_from = ( this.drain_direction > 0 ) ? this.crystal0 : this.crystal1;
				let drain_to = ( this.drain_direction > 0 ) ? this.crystal1 : this.crystal0;
				
				let drain = Math.min( drain_from.matter_regen, GSPEED * 0.1 / Math.sqrt( drain_from.matter_max / 40 ) );
				
				if ( drain_to.matter_regen + drain > 400 )
				drain = 400 - drain_to.matter_regen;
			
				drain_to.matter_regen += drain;
				drain_from.matter_regen -= drain;
				
				if ( drain > 0 )
				{
					if ( sdWorld.is_server )
					this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t: 27 * GSPEED, initiator: null }); // Overheat
				}
				else
				{
					/*this.drain_direction = 0;
					this._update_version++;
					sdSound.PlaySound({ name:'crystal_combiner_endB', x:this.x, y:this.y, volume:1 });
					*/
					this.DrainWithDirection( 0 );
					
					if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
					{
						this.DropCrystals();
						this.AttemptGrabbingNewCrystals();
					}
				}
			}
			else
			{
				/*this.drain_direction = 0;
				this._update_version++;*/
				this.DrainWithDirection( 0 );
			}
		}
		
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this.prog > 0 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}*/
		if ( can_hibernate )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
	}
	get title()
	{
		if ( this.type === sdCrystalCombiner.TYPE_DEFAULT )
		return "Crystal combiner";
		if ( this.type === sdCrystalCombiner.TYPE_IMPROVED )
		return "Improved crystal combiner";
		if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
		return "Automatic crystal combiner";
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		let t = this.title;
		
		if ( this.prog === 0 )
		sdEntity.Tooltip( ctx, t );
		else
		sdEntity.TooltipUntranslated( ctx, T( t ) + " ( " + T("combining") + " "+(~~Math.min( 100, this.prog / this.GetBaseAnimDuration() * 100 ))+"% )" );
	
		this.DrawHealthBar( ctx, '#FF0000', 28 + ( this._hitbox_y1 - 7 ) );
	}
	Draw( ctx, attached )
	{
		if ( this.prog > 0 )
		ctx.apply_shading = false;
		
		const offset_y = 2;


		/*if ( this.type === sdCrystalCombiner.TYPE_DEFAULT )
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner, - 32, - 16, 64,32 );

		if ( this.type === sdCrystalCombiner.TYPE_IMPROVED )
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner2, - 32, - 16, 64,32 );

		if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner3, - 32, - 16, 64,32 );*/

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
			
			if ( this.drain_direction !== 0 )
			{
				merge_prog = 0.05 + Math.sin( sdWorld.time / 500 ) * 0.025;
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

				//ctx.filter += ' saturate(' + (Math.round(( 1 - merge_prog )*10)/10) + ') brightness(' + (Math.round(( 1.5 + merge_prog * 10 )*10)/10) + ')';

				ctx.sd_color_mult_r = 1 + merge_prog * 10;
				ctx.sd_color_mult_g = 1 + merge_prog * 10;
				ctx.sd_color_mult_b = 1 + merge_prog * 10;

				/*if ( ctx.filter.indexOf( 'drop-shadow' ) === -1 )
				{
					ctx.filter += ' drop-shadow(0px 0px 7px rgba(255,255,255,'+(Math.round(( merge_prog * 5 )*10)/10)+'))';
				}*/

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
					this.crystal0.DrawWithStatusEffects( ctx, true );
				}
				ctx.restore();
			}
			if ( this.crystal1 )
			{
				ctx.save();
				{
					ctx.translate( this.crystal1.x - this.x, this.crystal1.y - this.y );
					this.crystal1.DrawWithStatusEffects( ctx, true );
				}
				ctx.restore();
			}
		}

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
		ctx.sd_color_mult_r = 1;
		ctx.sd_color_mult_g = 1;
		ctx.sd_color_mult_b = 1;
		if ( this.type === sdCrystalCombiner.TYPE_DEFAULT )
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner, - 32, - 16, 64,32 );

		if ( this.type === sdCrystalCombiner.TYPE_IMPROVED )
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner2, - 32, - 16, 64,32 );

		if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
		ctx.drawImageFilterCache( sdCrystalCombiner.img_crystal_combiner3, - 32, - 16, 64,32 );
	}
	ModifyHeldCrystalFilter( old_filter )
	{
		/*
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
		*/
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
	
	DrainWithDirection( direction )
	{
		if ( this.drain_direction !== direction )
		{
			this._update_version++;
			this.drain_direction = direction;
			this.prog = 0;

			if ( direction === 0 )
			sdSound.PlaySound({ name:'crystal_combiner_endB', x:this.x, y:this.y, volume:1 });
			else
			sdSound.PlaySound({ name:'crystal_combiner_startB', x:this.x, y:this.y, volume:1 });
		}
	}
	
	CombineCrystals()
	{
		if ( !sdWorld.is_server )
		return;
	
		//if ( this.crystals !== 2 )
		if ( !this.crystal0 || !this.crystal1 )
		return;
	
		this.drain_direction = 0;
	
		if ( this.prog === 0 )
		{
			sdSound.PlaySound({ name:'crystal_combiner_start', x:this.x, y:this.y, volume:1 });
			
			this.prog = 1;
		}
	}
	
	GetYFor( crystal )
	{
		if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
		return this.y + this._hitbox_y2 - crystal._hitbox_y1 + 0.1;
		else
		return this.y + 7 - crystal._hitbox_y2 - 0.1;
	}
	
	CombineCrystalsEnd()
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( !this.crystal0 || !this.crystal1 )
		return;
	
		{
			let ent = this.crystal0;
			
			ent.x = this.x;
			//ent.y = this.y + 7 - ent._hitbox_y2;
			ent.y = this.GetYFor( ent );
			
			ent.matter_max = this.crystal0.matter_max + this.crystal1.matter_max;
			ent.matter = this.crystal0.matter + this.crystal1.matter;
			ent.matter_regen = ( this.crystal0.matter_regen + this.crystal1.matter_regen ) / 2;
			
			if ( ( this.crystal0.speciality > 0 || this.crystal1.speciality > 0 ) && Math.random() < 0.2 ) // 20% to keep speciality
			ent.speciality = 1;
			else
			ent.speciality = 0;
			
			if ( ent.is_anticrystal )
			ent.matter_regen = 100; // Reset regen in this case as it does not matter for these for them to be properly rated by Rifts, LRTPs and BSUs
			
			if ( this.crystal0.type === sdCrystal.TYPE_CRYSTAL_CRAB || 
				 this.crystal1.type === sdCrystal.TYPE_CRYSTAL_CRAB )
			{
				sdSound.PlaySound({ name:'crystal_crab_death', x:this.x, y:this.y, volume:0.5 });
			}
			
			ent.type = sdCrystal.TYPE_CRYSTAL_ARTIFICIAL;
			ent._hea = ent._hmax = sdCrystal.hitpoints_artificial;
			
			let c = this.crystal1;
			c.remove();
			c._broken = false;

			this._ignore_pickup_tim = 30;

			this._update_version++;
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
				// Reset velocity which crystal had when it was put into amplifier
				this.crystal0.sx = 0;
				this.crystal0.sy = 0;
				
				this.crystal0.held_by = null;
				this.crystal0.PhysWakeUp();
				this.crystal0 = null;
			}
			else
			//if ( this.crystal0 === crystal_to_drop )
			{
				// Reset velocity which crystal had when it was put into amplifier
				this.crystal1.sx = 0;
				this.crystal1.sy = 0;
				
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
	
	AttemptGrabbingNewCrystals()
	{
		let tries = 30; // Try for 3 seconds

		sdTimer.ExecuteWithDelay( ( timer )=>
		{
			if ( this._is_being_removed || ( this.crystal0 && this.crystal1 ) )
			{
				return;
			}

			let arr = this._phys_entities_on_top;
			if ( arr )
			for ( let i = 0; i < arr.length; i++ )
			this.onMovementInRange( arr[ i ] );

			/*this.ManageTrackedPhysWakeup();

			if ( !this.CanMoveWithoutOverlap( this.x, this.y - 1 ) )
			if ( sdWorld.last_hit_entity )
			{
				sdWorld.last_hit_entity.ManageTrackedPhysWakeup();
				this.onMovementInRange( sdWorld.last_hit_entity );
			}*/

			if ( tries-- > 0 )
			timer.ScheduleAgain( 100 );

		}, 100 );
	}
	
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._ignore_pickup_tim === 0 && !from_entity._is_being_removed && from_entity.is( sdCrystal ) && !from_entity.is_anticrystal && from_entity.held_by === null && from_entity._hitbox_x2 - from_entity._hitbox_x1 <= 16 )
		{
			if ( from_entity.held_by === null )
			if ( sdWorld.Dist2D_Vector( from_entity.sx, from_entity.sy ) < 1.5 )
			{
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
					if ( from_entity.matter_max + from_entity.matter_max !== 40 ) // Allow crystals that would result into 40 matter artificial crystal
					return;
				
					let can_put_left = ( !this.crystal0 && from_entity.CanMoveWithoutOverlap( 
							this.x - 24 + 16, 
							this.GetYFor( from_entity ), 
							0 ) );
					
					let can_put_right = ( !this.crystal1 && from_entity.CanMoveWithoutOverlap( 
							this.x - 8 + 16, 
							this.GetYFor( from_entity ), 
							0 ) );
							
				
					// Never swap left and right in case of draining and automatic combiner
					if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
					if ( this.auto_mode === sdCrystalCombiner.AUTO_MODE_DRAIN1 || 
						 this.auto_mode === sdCrystalCombiner.AUTO_MODE_DRAIN2 )
					{
						if ( from_entity.x < this.x )
						can_put_right = false;
						else
						can_put_left = false;
					}
					
					
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
					
					if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
					this.DoAutomaticAction();
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
	
	DoAutomaticAction()
	{
		if ( this.auto_mode === sdCrystalCombiner.AUTO_MODE_COMBINE )
		this.CombineCrystals();

		if ( this.auto_mode === sdCrystalCombiner.AUTO_MODE_DRAIN1 )
		this.DrainWithDirection( 1 );

		if ( this.auto_mode === sdCrystalCombiner.AUTO_MODE_DRAIN2 )
		this.DrainWithDirection( -1 );
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( parameters_array instanceof Array )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			{
				if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
				{
					if ( command_name === 'AUTO_MODE' )
					if ( typeof parameters_array[ 0 ] === 'number' )
					if ( sdCrystalCombiner.auto_mode_titles[ parameters_array[ 0 ] ] )
					if ( this.auto_mode !== parameters_array[ 0 ] )
					{
						this.auto_mode = parameters_array[ 0 ];
						this.DrainWithDirection( 0 );
						this.prog = 0;
						this._update_version++;
						
						this.DoAutomaticAction();
					}
				}
				else
				{
					if ( command_name === 'COMBINE' )
					{
						if ( this.crystal0 && this.crystal1 )
						this.CombineCrystals();
						else
						executer_socket.SDServiceMessage( 'Crystal combiner needs 2 crystals to combine them' );
					}
					if ( this.type === sdCrystalCombiner.TYPE_IMPROVED )
					{
						if ( this.drain_direction === 0 )
						{
							if ( command_name === 'DRAIN1' )
							{
								this.DrainWithDirection( 1 );
							}
							if ( command_name === 'DRAIN2' )
							{
								this.DrainWithDirection( -1 );
							}
						}
						else
						if ( command_name === 'DRAIN_STOP' )
						{
							this.DrainWithDirection( 0 );
						}
					}
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			if ( this.type === sdCrystalCombiner.TYPE_AUTOMATED )
			{
				for ( let i = 0; i < sdCrystalCombiner.auto_mode_titles.length; i++ )
				this.AddContextOption( sdCrystalCombiner.auto_mode_titles[ i ], 'AUTO_MODE', [ i ], true, ( this.auto_mode === i ) ? { color:'#00ff00' } : {} );
			}
			else
			{
				this.AddContextOption( 'Combine crystals', 'COMBINE', [] );

				if ( this.type === sdCrystalCombiner.TYPE_IMPROVED )
				{
					if ( this.drain_direction === 0 )
					{
						this.AddContextOption( 'Drain regeneration rate of left crystal', 'DRAIN1', [] );
						this.AddContextOption( 'Drain regeneration rate of right crystal', 'DRAIN2', [] );
					}
					else
					this.AddContextOption( 'Stop draining', 'DRAIN_STOP', [] );
				}
			}
		}
	}
	
	MeasureMatterCost()
	{
	//	return 0; // Hack
		return 500 + ( 150 * this.type ) + this._hmax * sdWorld.damage_to_matter;
	}
}
//sdCrystalCombiner.init_class();

export default sdCrystalCombiner;
