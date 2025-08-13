
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdCube from './sdCube.js';
import sdLost from './sdLost.js';
import sdCrystal from './sdCrystal.js';
import sdRescueTeleport from './sdRescueTeleport.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
import sdTask from './sdTask.js';
import sdWeather from './sdWeather.js';
import sdRift from './sdRift.js';
import sdBlock from './sdBlock.js';
import sdFactions from './sdFactions.js';

class sdShurgTurret extends sdEntity
{
	static init_class()
	{
		sdShurgTurret.img_body = sdWorld.CreateImageFromFile( 'shurg_turret' );
		sdShurgTurret.img_body2 = sdWorld.CreateImageFromFile( 'shurg_turret2' );
		sdShurgTurret.img_turret = sdWorld.CreateImageFromFile( 'shurg_turret_gun' );
		
		sdShurgTurret.attack_distance = 450;

		sdShurgTurret.turrets = [];

		sdShurgTurret.TURRET_GROUND = 0;
		sdShurgTurret.TURRET_FLYING = 1;
		
		sdShurgTurret.fire_tracing_classes = [ 'sdCharacter', 'sdDrone', 'sdShurgConverter', 'sdShurgTurret', 'sdShurgExcavator' ];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === sdShurgTurret.TURRET_FLYING ? - 9 : -10; }
	get hitbox_x2() { return this.type === sdShurgTurret.TURRET_FLYING ?  9 : 10; }
	get hitbox_y1() { return this.type === sdShurgTurret.TURRET_FLYING ? - 8 : -10; }
	get hitbox_y2() { return this.type === sdShurgTurret.TURRET_FLYING ? 10 : 13; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.type = params.type || 0;

		this.hmax = 550;
		this.hea = this.hmax;
		this._regen_timeout = 0; // Regen timeout;
		this._notify_players = 0;

		this._target = null;
		this._ai_team = 9; // 9 is AI team for Shurgs
		this._attack_timer = 0;
		this.attack_frame = 0;
		this.attack_an = 0;
		this.side = 1;
		this._last_seen = 0;

		this._starting_y = this.y - 32; // for flying Shurg turrets to keep their altitude

		this._next_scan = 5; // Target scanning so the device doesn't spam GetRandomEntityNearby()

		this._time_until_full_remove = 30 * 5 + Math.random() * 30 * 5; // 5-10 seconds to get removed

		sdShurgTurret.turrets.push( this );

	}
	/*GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}*/
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		if ( initiator )
		{
			if ( ( initiator._ai_team || -1 ) !== this._ai_team )
			{
				this._target = initiator;
			}
		}
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea <= 0 && was_alive )
		{
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_AVERAGE_MOB );
			let that = this;
			for ( var i = 0; i < 6; i++ )
			{
				let i_copy = i;
				let an = Math.random() * Math.PI * 2;
				let d = ( i === 0 ) ? 0 : Math.random() * 20;
				let r = ( i === 0 ) ? 30 : ( 6 + Math.random() * 12 );

				setTimeout( ()=>
				{
					if ( !that._is_being_removed || i_copy === 0 )
					{
						var a = Math.random() * 2 * Math.PI;
						var s = Math.random() * 10;

						var k = 1;

						var x = that.x + that._hitbox_x1 + Math.random() * ( that._hitbox_x2 - that._hitbox_x1 );
						var y = that.y + that._hitbox_y1 + Math.random() * ( that._hitbox_y2 - that._hitbox_y1 );

						that.sx -= Math.sin( an ) * d * r * 0.005;
						that.sy -= Math.cos( an ) * d * r * 0.005;

						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_ROCK, sx: that.sx*k + Math.sin(a)*s, sy: that.sy*k + Math.cos(a)*s });
						sdWorld.SendEffect({ 
							x: that.x + Math.sin( an ) * d, 
							y: that.y + Math.cos( an ) * d, 
							radius: r, 
							damage_scale: 1, 
							type: sdEffect.TYPE_EXPLOSION,
							owner: that,
							can_hit_owner: true,
							color: sdEffect.default_explosion_color 
						});
					}
				}, i * 150 );
			}
			//this.remove();
		}
		
		if ( this.hea < -this.hmax * 0.6 )
		this.remove();
	}
	
	get mass() { return 800; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{

		this.sy += sdWorld.gravity * GSPEED;

		if ( this.hea > 0 )
		{
			if ( sdWorld.is_server )
			{	
				if ( this.type === sdShurgTurret.TURRET_FLYING )
				{
					if ( this.y > ( this._starting_y - ( Math.random() * 64 ) ) )
					this.sy = Math.max( -1.5, this.sy - ( 0.08 + sdWorld.gravity * GSPEED ) );

					if ( this.sx !== 0 )
					{
						this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.98 , GSPEED );
						if ( this.sx > -0.05 && this.sx < 0.05 )
						this.sx = 0;
					}
				}


				if ( this.attack_frame > 0 )
				this.attack_frame = Math.max( 0, this.attack_frame - GSPEED * 0.1 );
	

				if ( !this._target || this._target._is_being_removed )
				{
					this._target = null;
					
					if ( this._next_scan <= 0 )
					{
						this._target = sdCharacter.GetRandomEntityNearby( this );
						this._next_scan = 2;
					}
					else
					this._next_scan -= GSPEED;
				}
				else
				{
					let dx = ( this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2 ) - this.x;
					let dy = ( this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2 ) - this.y + 8;
					this.attack_an = ( Math.atan2( dy, Math.abs( dx ) ) ) * 1000;
					this.side = ( dx > 0 ) ? 1 : -1;
				}
	
					if ( this._target )
					if ( this._attack_timer <= 0 )
					{
						let xx = this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2;
						let yy = this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2;
						let consider_attacking = false;
						if ( this._target.GetClass() !== 'sdBlock' )
						{
							if ( sdWorld.CheckLineOfSight( this.x, this.y - 8, xx, yy, this._target, null, sdCom.com_creature_attack_unignored_classes ) )
							consider_attacking = true;
						}
						else
						if ( this._target.GetClass() === 'sdBlock' )
						consider_attacking = true;

						if ( consider_attacking && sdWorld.inDist2D_Boolean( this.x, this.y, this._target.x, this._target.y, sdShurgTurret.attack_distance ) )
						{
							this._last_seen = 0; // Reset "last seen" timer
							let dx = xx - this.x;
							let dy = yy - this.y + 8;

							let di = sdWorld.Dist2D_Vector( dx, dy );

							//dx += ( from_entity.sx || 0 ) * di / 12;
							//dy += ( from_entity.sy || 0 ) * di / 12;

							di = sdWorld.Dist2D_Vector( dx, dy );

							if ( di > 1 )
							{
								dx /= di;
								dy /= di;
							}
							this.side = ( dx > 0 ) ? 1 : -1;

							let should_fire = true;
							if ( !sdWorld.CheckLineOfSight( this.x, this.y - 16, this._target.x, this._target.y, this, null, sdShurgTurret.fire_tracing_classes ) )
							{
								if ( sdWorld.last_hit_entity && sdWorld.last_hit_entity._ai_team === this._ai_team )
								should_fire = false;
							}

							if ( should_fire )
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y - 8 });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 6;
								bullet_obj.y += bullet_obj.sy * 6;
								bullet_obj.sx = bullet_obj.sx * 18;
								bullet_obj.sy = bullet_obj.sy * 18;
								bullet_obj.color = '#004400';
								bullet_obj._damage = 35;
	
	
								sdEntity.entities.push( bullet_obj );

								this.attack_frame = 1;
								//this.attack_an = ( Math.atan2( dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 10;

								//sdSound.PlaySound({ name:'gun_shotgun', x:this.x, y:this.y, pitch:1.25 });
								
								//sdSound.PlaySound({ name:'gun_needle', x:this.x, y:this.y, volume: 0.4, pitch: 2 });
								sdSound.PlaySound({ name:'shurg_turret_attack', x:this.x, y:this.y, volume: 1.3, pitch: 1 });
								
							}	
						}
						else
						this._last_seen++;
						if ( this._last_seen > 180 )
						{
							this._target = null;
							this._last_seen = 0;
						}
					}
					else
					this._attack_timer = Math.max( 0, this._attack_timer - GSPEED );
			}
		}
		else
		if ( sdWorld.is_server )
		{
			this._time_until_full_remove -= GSPEED;
			if ( this._time_until_full_remove <= 0 )
			this.remove();
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea > 0 )
		sdEntity.TooltipUntranslated( ctx, T("Shurg turret") );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = true;

		//ctx.filter = this.filter;
		let xx = this.hea > 0 ? 0 : 32;
		let xx2 = this.attack_frame > 0 ? 32 : 0;
		let img;
		if ( this.type === sdShurgTurret.TURRET_GROUND )
		img = sdShurgTurret.img_body;
		if ( this.type === sdShurgTurret.TURRET_FLYING )
		img = sdShurgTurret.img_body2;
		{
			ctx.drawImageFilterCache( img, xx, 0, 32, 32, -16, - 16, 32, 32 );
			if ( this.hea > 0 )
			{
				ctx.save();
				ctx.scale( this.side, 1 );
				ctx.translate( 0, -8 );
				ctx.rotate( this.attack_an / 1000 );
				ctx.drawImageFilterCache( sdShurgTurret.img_turret, xx2, 0, 32, 32, -16, - 16, 32, 32 );
				ctx.restore();
			}
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( from_entity.GetClass() !== 'sdBullet' && this.type === sdShurgTurret.TURRET_FLYING )
		{
			if ( from_entity.y > this.y && this.y < this._starting_y )
			{
				this._starting_y = this.y - 64;
			}

			if ( from_entity.y < this.y && this.y > this._starting_y )
			{
				this._starting_y = this.y + 96;
			}
		}
	}
	onRemove() // Class-specific, if needed
	{
		let i = sdShurgTurret.turrets.indexOf( this );
		
		if ( i !== -1 )
		sdShurgTurret.turrets.splice( i, 1 );

		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdShurgTurret.init_class();

export default sdShurgTurret;
