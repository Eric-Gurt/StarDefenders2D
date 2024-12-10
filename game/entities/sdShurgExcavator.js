
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdDrone from './sdDrone.js';
import sdPathFinding from '../ai/sdPathFinding.js';

import sdBlock from './sdBlock.js';

class sdShurgExcavator extends sdEntity
{
	static init_class()
	{
		sdShurgExcavator.img_excavator = sdWorld.CreateImageFromFile( 'sdShurgExcavator' );
		//sdShurgExcavator.img_turret = sdWorld.CreateImageFromFile( 'shurg_turret_gun2' );
		

		
		sdShurgExcavator.max_seek_range = 160;
		
		sdShurgExcavator.miners_counter = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 6; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 4; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		sdShurgExcavator.miners_counter++;
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 120;
		this.hea = this.hmax;

		this._ai_team = 9; // 9 is AI team for Shurgs
		
		//this.death_anim = 0;
		this.excavate = 0;

		this.flying = false;
		
		this._current_target = null;
		this._mining_target = null; // When excavator stumbles into natural ground ( left or right side ), it considers it a target
		
		
		this._regen_timeout = 0;
		
		this.side = 1;
		
		//this.turret_timer = 0; // Negative value = not installed, anything above is shoot delay. 0 = can shoot
		//this.turret_ang = 0;
		//this.turret_level = 0;
		//this._last_turret_attack_attempt = 0; // Failed one
		
		this._pathfinding = null;
	}
	
	SetTarget( ent )
	{
		if ( ent !== this._current_target )
		{
			this._current_target = ent;

			if ( ent )
			this._pathfinding = new sdPathFinding({ target: ent, traveler: this, options: [ sdPathFinding.OPTION_CAN_CRAWL, sdPathFinding.OPTION_CAN_SWIM, sdPathFinding.OPTION_CAN_FLY ] });
			else
			this._pathfinding = null;
		}
	}
	
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this.hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdShurgExcavator.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				//this._current_target = character;
				this.SetTarget( character );
			}
		}
	}

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		//dmg = Math.abs( dmg );
		
		//let was_alive = this.hea > 0;
		let old_hp = this.hea;
		
		if ( dmg > 0 )
		{
			this.hea -= Math.abs( dmg );
			
			this._regen_timeout = 30;

		if ( initiator )
		{
			if ( ( initiator._ai_team || -1 ) !== this._ai_team )
			{
				this.SetTarget( initiator );
			}
		}
		}
		else
		{
			// Only if this.master is set and healed by master
			
			if ( this.hea <= 0 )
			{
				this.hea = 0;
				//this.death_anim = 0;
			}
			this.hea = Math.min( this.hea + Math.abs( dmg ), this.hmax );
			return;
		}
		
		if ( this.hea <= 0 && old_hp > 0 )
		{
			this.remove();
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );
		}
	}
	
	get mass() { return 40; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.2;
		//this.sy += y * 0.2;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		let pathfinding_result = null;
		
		{

			if ( this.turret_timer > 0 )
			this.turret_timer = Math.max( 0, this.turret_timer - GSPEED );


			if ( this.hea < this.hmax )
			{
				this._regen_timeout -= GSPEED;
				if ( this._regen_timeout < 0 )
				{
					this.hea = Math.min( this.hmax, this.hea + ( GSPEED / 10 ) );
				}
			}
			
			if ( sdWorld.is_server )
			{
				if ( this._current_target )
				{
					if ( this._current_target._is_being_removed || ( this._current_target.hea || this._current_target._hea ) <= 0 || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdShurgExcavator.max_seek_range + 32 )
					{
						//this._current_target = null;
						this.SetTarget( null );
					}
					else
					{
					
						pathfinding_result = this._pathfinding.Think( GSPEED );
					
						if ( pathfinding_result )
						{
							if ( this.sx > 0.25 )
							this.side = 1;
							else
							if ( this.sx < -0.25 )
							this.side = -1;

							this.sx += pathfinding_result.act_x * GSPEED * 0.2;
							this.sy += pathfinding_result.act_y * GSPEED * 0.42;
							if ( !in_water && pathfinding_result.act_y < 0 && this.CanMoveWithoutOverlap( this.x, this.y + 2, 0 ) )
							this.flying = true;
							else
							this.flying = false;
							this.excavate = Math.min( 120, this.excavate + ( GSPEED * 2 ) );
						}

						if ( !pathfinding_result ) // If it hadn't figured out what to do yet, do normal behaviour
						{
							this.sx += this.side * GSPEED * 0.2;
							if ( Math.random() < 0.005 ) 
							this.side = -this.side; // Occasionally change direction

							if ( !this._mining_target || this._mining_target._is_being_removed || this._mining_target.y > this.y + 2 || this._mining_target.y < this.y - 8 )
							{
								this._mining_target = null;
								this.excavate = Math.max( 0, this.excavate - GSPEED );
							}
							else
							{
								if ( this.x > this._mining_target + 8 && this.side === 1 )
								this.side -= 1;
								if ( this.x < this._mining_target - 8 && this.side === -1 )
								this.side = 1;
								this.excavate = Math.min( 120, this.excavate + ( GSPEED * 2 ) ); 
							}
						}
					}
				}
				else
				{
					this.sx += this.side * GSPEED * 0.2;
					if ( Math.random() < 0.005 ) 
					this.side = -this.side; // Occasionally change direction

					if ( !this._mining_target || this._mining_target._is_being_removed )
					{
						this._mining_target = null;
						this.excavate = Math.max( 0, this.excavate - ( GSPEED / 90 ) );
					}
					else
					{
						if ( this.x > this._mining_target + 8 && this.side === 1 )
						this.side -= 1;
						if ( this.x < this._mining_target - 8 && this.side === -1 )
						this.side = 1;
						this.excavate = Math.min( 120, this.excavate + ( GSPEED * 2 ) ); 
					}
				}

				if ( this.excavate === 120 )
				{
					this.excavate = 80;
					let bullet_obj = new sdBullet({ x: this.x, y: this.y, time_left: 1});

					bullet_obj._owner = this;
					bullet_obj.sx = this.side;
					bullet_obj.color = 'transparent';
					bullet_obj._damage = 24;
					bullet_obj._dirt_mult = 1;
	
					sdEntity.entities.push( bullet_obj );
								
					sdSound.PlaySound({ name:'cut_droid_attack', x:this.x, y:this.y, volume: 0.33, pitch:2 });
				}
			}
		}

		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			if ( this.hea > 0 )
			this.sy -= sdWorld.gravity * GSPEED * ( pathfinding_result ? 1 : 2 ); // Don't swim up if navigating in water
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( this.death_anim === 0 )
		sdEntity.TooltipUntranslated( ctx, T("Shurg Excavator") );
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );
		
		var frame = 0;

		if ( this.flying )
		frame = 6;

		if ( frame === 6 )
		if ( this.sx > 0.4 || this.sx < -0.4 )
		frame = 7;
		ctx.drawImageFilterCache( sdShurgExcavator.img_excavator, frame*32,0,32,32, - 16, - 16, 32,32 );

		if ( this.excavate > 0 )
		{
			let frame2 = this.excavate > 100 ? 5 : this.excavate > 75 ? 4 : this.excavate > 50 ? 3 : this.excavate > 25 ? 2 : 1;
			ctx.drawImageFilterCache( sdShurgExcavator.img_excavator, frame2*32,0,32,32, - 16, - 16, 32,32 );
		}
		
		ctx.globalAlpha = 1;
		//ctx.filter = 'none';
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdBlock ) && from_entity._natural && from_entity.y < this.y + 2 )
		{
			if ( ( from_entity.x < this.x && this.side === -1 ) || ( from_entity.x > this.x && this.side === 1 ) )
			this._mining_target = from_entity;
		}
	}
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		sdShurgExcavator.miners_counter--;
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 10, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdShurgExcavator.init_class();

export default sdShurgExcavator;
