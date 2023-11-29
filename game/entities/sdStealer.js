
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdCrystal from './sdCrystal.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdJunk from './sdJunk.js';

class sdStealer extends sdEntity
{
	static init_class()
	{
		sdStealer.img_stealer = sdWorld.CreateImageFromFile( 'sdStealer' );
		
		sdStealer.stealers_counter = 0;
		
		sdStealer.death_duration = 30;
		sdStealer.post_death_ttl = 120;
		
		sdStealer.attack_range = 375;
		
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -16; }
	get hitbox_y2() { return 16; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.regen_timeout = 0;
		
		this._hmax = 2000;
		this.hea = this._hmax;

		
		this._move_dir_x = 0;
		this._move_dir_y = 0;
		this._move_dir_timer = 0;
		
		this.attack_anim = 0;
		this._attack_timer = 30;
		
		this._current_target = null;
		
		this._last_found_target = 0;

		
		//this.side = 1;
		
		
		sdStealer.stealers_counter++;
		
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		//this.regen_timeout = Math.max( this.regen_timeout, 60 );
		
		if ( this.hea <= 0 && was_alive )
		{	//sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
	
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_CHALLENGING_MOB ); // Some score since it's hard to find and destroy usually
	
			sdWorld.SendEffect({ 
				x: this.x,
				y: this.y,
				radius: 16, 
				damage_scale: 0.1, 
				type: sdEffect.TYPE_EXPLOSION,
				owner: this,
				can_hit_owner: true,
				color: 'FF0000'
			});

			if ( Math.random() < 0.25 ) // They're difficult to find and destroy anyway
			{
				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let artifact = new sdJunk({ x:this.x, y:this.y, type: sdJunk.TYPE_STEALER_ARTIFACT });
					artifact.sx = this.sx;
					artifact.sy = this.sy;
					sdEntity.entities.push( artifact );

				}, 500 );
				
			}
			this.remove();
		}
		
		//if ( this.hea < -this._hmax / 80 * 100 )
		//this.remove();
	}
	
	IsEntFarEnough( ent ) // Check if entity is outside BSU and far away from player's views
	{
		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		if ( sdWorld.sockets[ i ].character )
		{
			let player = sdWorld.sockets[ i ].character;
			if ( sdWorld.Dist2D( ent.x, ent.y, player.x, player.y ) < 500 || !sdBaseShieldingUnit.TestIfPointIsOutsideOfBSURanges( ent.x, ent.y ) )
			return false;
		}
		
		return true;
	}
	
	GetRandomCrystal()
	{
		let ent = sdEntity.GetRandomActiveEntity();
		if ( ent.is( sdCrystal ) ) // Is it a crystal?
			{
				if ( this.IsEntFarEnough( ent ) ) // Crystal far enough from BSUs and players?
				{
					this._last_found_target = 0;
					return ent; // Target it
				}
			}
		return null;
	}
	
	StealNearbyCrystals(){
		let attack_entities = sdWorld.GetAnythingNear( this.x, this.y, 192 );
		let stolen_crystals = 0; // How much crystals did it steal?
		if ( attack_entities.length > 0 )
		for ( let i = 0; i < attack_entities.length; i++ )
		{
			let e = attack_entities[ i ];
			if ( !e._is_being_removed )
			{
				if ( e.is( sdCrystal ) || e.is( sdGun ) )
				{
					{
						let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
						let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
						if ( !sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, this ) )
						{
							if ( sdWorld.last_hit_entity )
							{
								if ( e === sdWorld.last_hit_entity ) 
								{
									e.remove();
									e._broken = false;
									
									stolen_crystals++;
									
									sdWorld.SendEffect({ x: this.x, y:this.y, x2:xx, y2:yy, type:sdEffect.TYPE_BEAM, color:'#ffffff' });
									sdSound.PlaySound({ name:'teleport', x:xx, y:yy, pitch: 1, volume:0.5 });
									
									sdWorld.SendEffect({ x:e.x, y:e.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
								}
							}
						}
					}
				}
			}
		}
		return stolen_crystals;
	}
	AttemptTeleportToTarget(){
		let i = 0;
		let xx;
		let yy;
		while ( i < 60 )
		{
			xx = this._current_target.x - 192 + Math.random() * 384;
			yy = this._current_target.y - 192 + Math.random() * 384;
									
			if ( sdWorld.CheckLineOfSight( this._current_target.x, this._current_target.y, xx, yy, this._current_target, sdCom.com_visibility_ignored_classes, null ) && this.CanMoveWithoutOverlap( xx, yy, 4 ) )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
										
				this.x = xx;
				this.y = yy;
										
				sdSound.PlaySound({ name:'teleport', x:xx, y:yy, volume:0.5 });
				sdWorld.SendEffect({ x:xx, y:yy, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
				return true;
			}
			i++;
		}
		
		return false;
	}
	
	get mass() { return 100; }
	Impulse( x, y )
	{
		this.sx += x / ( this.mass );
		this.sy += y / ( this.mass );
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.hea <= 0 )
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.88, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.88, GSPEED );
			
			if ( sdWorld.is_server )
			{
				if ( !this._current_target || this._current_target._is_being_removed )
				this._current_target = null;
			
				if ( this._move_dir_timer <= 0 )
				{
					this._move_dir_timer = 5;

					{
						let an = Math.random() * Math.PI * 2;

						this._move_dir_x = Math.cos( an );
						this._move_dir_y = Math.sin( an );
					}
				}
				else
				this._move_dir_timer -= GSPEED;
			}
		
			let v = 0.15;
				
			if ( 
					this.y > sdWorld.world_bounds.y1 + 200 &&
					sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_x * 50, this.y + this._move_dir_y * 50, this, sdCom.com_visibility_ignored_classes, null ) &&  // Can move forward
				( 
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_x * 200, this.y + this._move_dir_y * 200, this, sdCom.com_visibility_ignored_classes, null ) || // something is in front in distance
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x - this._move_dir_x * 100, this.y - this._move_dir_y * 100, this, sdCom.com_visibility_ignored_classes, null ) || // allow retreat from wall behind
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x - this._move_dir_y * 100, this.y + this._move_dir_x * 100, this, sdCom.com_visibility_ignored_classes, null ) || // side
				   !sdWorld.CheckLineOfSight( this.x, this.y, this.x + this._move_dir_y * 100, this.y - this._move_dir_x * 100, this, sdCom.com_visibility_ignored_classes, null ) // side
				   ) )
			{
				
				this.sx += this._move_dir_x * ( v ) * GSPEED;
				this.sy += this._move_dir_y * ( v ) * GSPEED;
			}
			else
			{
				this._move_dir_timer = 0;
				this.sy += 0.1 * GSPEED;
			}
			
		
			this.PhysWakeUp();
		}
		
		if ( sdWorld.is_server )
		{
			if ( this._attack_timer > 0 )
			this._attack_timer -= GSPEED;
			else
			{
				this._attack_timer = 180; // Every 6 seconds it should either look for a new crystal, steal one near it or teleport away
				/* It should probably teleport away from players and teleport crystals, aswell as check if it can teleport to a new location
				where crystals are outside of BSU and player range. Should be much more efficient at doing that rather than 
				the crystal hunting worm, which would become obsolete since this entity will replace it.
				Basically this steals crystals, maybe more entities will be needed to "steal" in future. */
				
				if ( this._last_found_target > 180 || ( this.hea < this._hmax * 0.2 && !this.IsEntFarEnough( this ) ) ) // Disappear if it can't find crystals or near players and low HP
				{
					sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
					sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });
					
					this.remove();
					this._broken = false;
				}
				else
				{
					if ( this.IsEntFarEnough( this ) ) // Far away from players and BSUs?
					{
						let stolen_crystals = this.StealNearbyCrystals();
						if ( stolen_crystals === 0 && !this._current_target ) // No crystals stolen? Relocate
						{
							let i = 0;
							while ( i < 60 )
							{
								if ( !this._current_target ) // No target? Find it
								{
									this._current_target = this.GetRandomCrystal();
									this._last_found_target++;
								}
								else
								{
									if ( this.AttemptTeleportToTarget() )
									i = 60;
								}
								i++;
							}
						}
						else
						this._attack_timer = 30 + Math.random() * 30; // Speed up stealing
					}
					else
					{
						this._current_target = null;
						let i = 0;
						while ( i < 60 )
						{
							if ( !this._current_target ) // No target? Find it
							{
								this._current_target = this.GetRandomCrystal();
								this._last_found_target++;
							}
							else
							{
								if ( this.AttemptTeleportToTarget() )
								i = 60;
							}
							i++;
						}
					}
				}
				
			}
		}
		
			
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Stealer" );
		this.DrawHealthBar( ctx, undefined, 4 );
	}
	Draw( ctx, attached )
	{
	
		//ctx.rotate( this.tilt / 100 );
		//ctx.filter = this.filter;
		let xx = 19;
		
		ctx.drawImageFilterCache( sdStealer.img_stealer, xx * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		
		let cur_img = sdWorld.time % 3400;
		if ( cur_img < 850 )
		xx = 0;
		else
		if ( cur_img < 1750 )
		xx = Math.round( 9 * ( ( cur_img - 850 ) / 900 ) );
		else
		if ( cur_img < 2600 )
		xx = 10;
		else
		xx = 10 + Math.round( 8 * ( ( cur_img - 2600 ) / 800 ) );
		ctx.drawImageFilterCache( sdStealer.img_stealer, xx * 32, 0, 32, 32, - 16, - 16, 32, 32 );
		
		
		ctx.globalAlpha = 1;
		//ctx.filter = 'none';
		//ctx.sd_filter = null;
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdStealer.stealers_counter--;
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdStealer.init_class();

export default sdStealer;
