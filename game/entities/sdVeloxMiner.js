
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
import sdBlock from './sdBlock.js';
import sdJunk from './sdJunk.js';

class sdVeloxMiner extends sdEntity
{
	static init_class()
	{
		sdVeloxMiner.img_miner = sdWorld.CreateImageFromFile( 'sdVeloxMiner' );
		sdVeloxMiner.death_duration = 15;
		sdVeloxMiner.post_death_ttl = 30 * 10;

		
		//sdVeloxMiner.max_seek_range = 400; // Don't know if this is needed since it uses sdCharacter targetting
		
		sdVeloxMiner.miners_counter = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -12; }
	get hitbox_x2() { return 12; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 7; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		sdVeloxMiner.miners_counter++;
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 250;
		this.hea = this.hmax;
		this.death_anim = 0;
		this._ai_team = 5; // 5 is AI team for Velox
		
		this._next_target_scan = 5;
		this._current_target = null;
		
		this.extended = 0; // Has this device extended it's parts out ( ready to fire cannon? )
		
		this._ammo_left = 4; // This miner fires 4 rail cannon bursts then reloads.
		this._attack_timer = 0;
		this._last_attack = 0; // If it doesn't attack an entity over 5 seconds, it switches to a new one
		
		this._regen_timeout = 0;
		
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
		}

		if ( initiator )
		{
			if ( !initiator.is( sdDrone ) && initiator._ai_team !== this._ai_team )
			if ( !initiator.IsPlayerClass() && initiator._ai_team !== this._ai_team )
			{
				this._current_target = initiator;
			}
			else
			if ( ( initiator.is( sdDrone ) || initiator.IsPlayerClass() ) && initiator._ai_team !== this._ai_team )
			{
				this._current_target = initiator;
			}
			
			//this._last_attack = 0;
		}
		
		if ( this.hea <= 0 && old_hp > 0 )
		{
			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius: 15, 
				damage_scale: 1 , 
				type:sdEffect.TYPE_EXPLOSION,
				armor_penetration_level: 0,
				owner:this,
				color:sdEffect.default_explosion_color
			});
			
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_AVERAGE_MOB );
		}
		
		if ( this.hea <= -250 )
		this.remove();
	}
	
	get mass() { return 80; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.2;
		//this.sy += y * 0.2;
	}
	
	GetRandomBlockOrCrystalNearby()
	{
		let an = Math.random() * Math.PI * 2;

		if ( !sdWorld.CheckLineOfSight( this.x, this.y, this.x + Math.sin( an ) * 300, this.y + Math.cos( an ) * 300, this ) )
		if ( sdWorld.last_hit_entity ) // Needed because it needs to target something
		{
			if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' || sdWorld.last_hit_entity.GetClass() === 'sdCrystal' )
			return sdWorld.last_hit_entity;
			if ( sdWorld.last_hit_entity.GetClass() === 'sdJunk' )
			if ( sdWorld.last_hit_entity.type === sdJunk.TYPE_ALIEN_BATTERY || sdWorld.last_hit_entity.type === sdJunk.TYPE_FREEZE_BARREL )
			return sdWorld.last_hit_entity;
				
		}
		return null;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		{


			
			
			if ( sdWorld.is_server )
			{
				if ( this.hea <= 0 )
				{

					if ( this.death_anim < sdVeloxMiner.death_duration + sdVeloxMiner.post_death_ttl )
					this.death_anim += GSPEED;
					else
					{
						this.remove();
						this._broken = false; // Just vanish - no need to explode
						return;
					}
				}
				else
				{
					if ( this.hea < this.hmax )
					{
						this._regen_timeout -= GSPEED;
						if ( this._regen_timeout < 0 )
						{
							this.hea = Math.min( this.hmax, this.hea + ( GSPEED / 10 ) );
						}
					}
					if ( !this._current_target || this._current_target._is_being_removed )
					{
						this.extended = Math.max( 0, this.extended - GSPEED );
						this._current_target = null;
						if ( this._next_target_scan < 0 )
						{
							this._current_target = sdCharacter.GetRandomEntityNearby( this );
							if ( !this._current_target ) // If it doesn't find a threat/target, target a block or crystal
							this._current_target = this.GetRandomBlockOrCrystalNearby();
							
							this._next_target_scan = 5;
							
							if ( this._current_target )
							this._last_attack = 0;
							
						}
						else
						this._next_target_scan -= GSPEED;
					}
					else
					{
						this._last_attack += GSPEED;
						if ( ( this._current_target.hea || this._current_target._hea || 0 ) > 0 && 
							this._current_target.IsVisible( this ) && 
							sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) < 400 &&
							this._last_attack < 150 )
						{
								
						}
						else
						{
							this._current_target = null;
						}
					
						if ( this._attack_timer < 15 || ( this._attack_timer > 20 && this._attack_timer < 85 ) )
						this.extended = Math.min( 24, this.extended + GSPEED ); // this.extended is also the attack animation so after 5 GSPEED ticks it switches back firing to idle image
					
						if ( this._attack_timer < 0 && this._ammo_left > 0 && this.extended === 24 && this._current_target )
						{
							if ( sdWorld.CheckLineOfSight( this.x, this.y - 4, this._current_target.x, this._current_target.y, this, sdCom.com_visibility_ignored_classes, null ) 
							|| ( !sdWorld.CheckLineOfSight( this.x, this.y - 4, this._current_target.x, this._current_target.y, this, sdCom.com_visibility_ignored_classes, null ) && sdWorld.last_hit_entity === this._current_target ) )
							{
								if ( this._current_target.GetClass() !== 'sdCrystal' && this._current_target.GetClass() !== 'sdJunk' )
								{
									let bullet_obj = new sdBullet({ x: this.x, y: this.y - 4 });
								
								
									let dx = this._current_target.x - this.x;
									let dy = this._current_target.y - ( this.y - 4 );

									bullet_obj.sx = dx / 3;
									bullet_obj.sy = dy / 3;
									bullet_obj._owner = this;
									//bullet_obj.x += bullet_obj.sx * 3;
									//bullet_obj.y += bullet_obj.sy * 3;

									//bullet_obj.sx *= 12;
									//bullet_obj.sy *= 12;

									bullet_obj._damage = 62;
									bullet_obj.color = '#ff0000';
									bullet_obj._rail = true;
									bullet_obj._rail_circled = true;


									sdEntity.entities.push( bullet_obj );

									//this.attack_frame = 2;
									//this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 1000;
									this._ammo_left--;
									this._attack_timer = this._ammo_left > 0 ? 20 : 90;
									if ( this._ammo_left === 0 )
									this._ammo_left = 4;
									this.extended = 31;
									this._last_attack = 0;
									sdSound.PlaySound({ name:'gun_railgun', x:this.x, y:this.y, pitch:0.5, volume: 0.5 });
								
								}
								else // If crystal or alien battery, teleport it away (to who knows where)
								{
									sdWorld.SendEffect({ x: this.x, y:this.y - 4, x2:this._current_target.x, y2:this._current_target.y, type:sdEffect.TYPE_BEAM, color:'#ffffff' });
									sdSound.PlaySound({ name:'teleport', x:this._current_target.x, y:this._current_target.y, pitch: 1, volume:1 });
									sdWorld.SendEffect({ x:this._current_target.x, y:this._current_target.y, type:sdEffect.TYPE_TELEPORT });
								
									this._current_target.remove();
									this._current_target._broken = false;
									
									this._attack_timer = 20;
									this.extended = 31;
									this._last_attack = 0;
								
								}
							}
						}
						else
						this._attack_timer -= GSPEED;
					}
				}
			}
		}

		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			
			if ( this.hea > 0 )
			this.sy -= sdWorld.gravity * GSPEED;
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.TooltipUntranslated( ctx, T("Velox Miner") );
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		
		var frame = 0;
		frame = this.extended > 30 ? 3 : this.extended > 20 ? 2 : this.extended > 10 ? 1 : 0;
		if ( this.death_anim > 0 )
		{
			frame = 4;
			if ( this.death_anim > sdVeloxMiner.death_duration + sdVeloxMiner.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
		}
		ctx.drawImageFilterCache( sdVeloxMiner.img_miner, frame*32,0,32,32, - 16, - 16, 32,32 );

		
		ctx.globalAlpha = 1;
		//ctx.filter = 'none';
	}
	onMovementInRange( from_entity )
	{

	}
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		sdVeloxMiner.miners_counter--;
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 10, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdVeloxMiner.init_class();

export default sdVeloxMiner;
