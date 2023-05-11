/*

	Anti-skybase and anti-anything in general, just needs much more matter

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdBlock from './sdBlock.js';
import sdDoor from './sdDoor.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdWeather from './sdWeather.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdSound from '../sdSound.js';


class sdManualTurret extends sdEntity
{
	static init_class()
	{
		sdManualTurret.img_turret_sheet = sdWorld.CreateImageFromFile( 'manual_turret' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -11; }
	get hitbox_x2() { return 11; }
	get hitbox_y1() { return -11; }
	get hitbox_y2() { return 11; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get title()
	{
		return 'Manual anti-shield turret';
	}
	
	//IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	//{ return true; }
	
	
	onMatterChanged( by=null ) // Something like sdLongRangeTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			this._regen_timeout = 60;

			if ( this.hea <= 0 )
			{
				this.remove();
			}
			
			this._update_version++;
		}
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 8000;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		
		this.matter = 0;
		this.matter_max = 5120;
		
		this.look_x = 100; // Relative
		this.look_y = 0; // Relative
		//this.ang = 0; // Rotation
		
		this.attack_tim = 0;
		this.reload_tim = 0;
		
		this.can_shoot = false;
		
		this.filter = params.filter || 'none';
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.attack_tim > 0 )
		{
			this.attack_tim = Math.max( 0, this.attack_tim - GSPEED );
			if ( this.attack_tim === 0 )
			this._update_version++;
		}
		
		if ( this.matter >= this.matter_max )
		if ( this.reload_tim > 0 )
		{
			this.reload_tim = Math.max( 0, this.reload_tim - GSPEED );
			if ( this.reload_tim === 0 )
			this._update_version++;
		}
	
		let no_driver = true;
		
		this.can_shoot = false;
		
		if ( this.reload_tim <= 0 )
		{
			let steering_wheel = ( this._steering_wheel_net_id === -1 ) ? null : sdEntity.entities_by_net_id_cache_map.get( this._steering_wheel_net_id );

			let dx = 0;
			let dy = 0;

			if ( steering_wheel )
			{
				if ( steering_wheel.driver0 )
				if ( steering_wheel.driver0.hea > 0 )
				{
					no_driver = false;
					
					let target_look_x = steering_wheel.driver0.look_x - this.x;
					let target_look_y = steering_wheel.driver0.look_y - this.y;

					let target_di = sdWorld.Dist2D_Vector( target_look_x, target_look_y );

					if ( target_di > 1 )
					{
						target_look_x = target_look_x / target_di * 100;
						target_look_y = target_look_y / target_di * 100;

						let di2 = sdWorld.Dist2D_Vector( this.look_x, this.look_y );

						if ( di2 > 0.1 )
						{
							this.look_x = this.look_x / di2 * 100;
							this.look_y = this.look_y / di2 * 100;
						}
						else
						{
							this.look_x = 100;
							this.look_y = 0;
						}


						//dx = steering_wheel.driver0.look_x - ( this.x + this.look_x );
						//dy = steering_wheel.driver0.look_y - ( this.y + this.look_y );

						dx = target_look_x - this.look_x;
						dy = target_look_y - this.look_y;
						
						let di = sdWorld.Dist2D_Vector( dx, dy );
						if ( di > 0 )
						{
							if ( di > 2 * GSPEED )
							{
								dx = dx / di * 2 * GSPEED;
								dy = dy / di * 2 * GSPEED;
							}

							this.look_x += dx;
							this.look_y += dy;

							this._update_version++;
						}

						if ( di < 10 )
						if ( this.matter >= this.matter_max )
						if ( steering_wheel.driver0._key_states.GetKey( 'Mouse1' ) )
						{
							if ( sdWorld.CheckLineOfSight( this.x, this.y, this.x + this.look_x / 100 * 64, this.y + this.look_y / 100 * 64, this, null, sdCom.com_visibility_unignored_classes ) )
							{
								this.can_shoot = true;
							}
							
							if ( this.can_shoot )
							{
								let will_shoot = true;

								for ( let i = 0; i < steering_wheel._scan.length; i++ )
								{
									let e = steering_wheel._scan[ i ];

									if ( e.is( sdManualTurret ) )
									if ( ( e.matter >= e.matter_max && e.reload_tim <= 0 && e.can_shoot && e._net_id < this._net_id ) || e.attack_tim > 0 )
									{
										will_shoot = false;
										break;
									}
								}

								if ( will_shoot )
								{
									this._update_version++;

									this.attack_tim = 7;
									this.reload_tim = 30 * 5;
									this.matter = 0;

									sdSound.PlaySound({ name:'gun_psicutter', x:this.x, y:this.y, volume:3, pitch:0.25 });

									let bullet_obj = new sdBullet({ x: this.x, y: this.y });

									bullet_obj._owner = steering_wheel.driver0;
									bullet_obj._owner2 = this;

									bullet_obj.sx = this.look_x / 100;
									bullet_obj.sy = this.look_y / 100;
									bullet_obj.x += bullet_obj.sx * 5;
									bullet_obj.y += bullet_obj.sy * 5;

									bullet_obj.sx *= 15;
									bullet_obj.sy *= 15;

									bullet_obj.time_left = 45;

									bullet_obj.model = 'rocket_proj';
									bullet_obj._damage = 350 * 4; // 25 * 3; // 350 * 2 = strong as tank
									bullet_obj.explosion_radius = 100; // But larger radius
									bullet_obj.color = '#80ffff';
									bullet_obj._rail = true;


									bullet_obj._custom_target_reaction = sdBullet.AntiShieldBulletReaction;

									bullet_obj._anti_shield_damage_bonus = 200000;

									sdEntity.entities.push( bullet_obj );
								}
							}
						}
					}
				}
			}

			
		}
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this.hea < this.hmax )
		this.hea = Math.min( this.hea + GSPEED, this.hmax );
		else
		if ( this.attack_tim <= 0 )
		if ( this.reload_tim <= 0 || this.matter < this.matter_max )
		if ( no_driver )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + " ( " + this.matter + " / " + this.matter_max + " )" );
		
		this.DrawHealthBar( ctx, undefined, 10 );
	}
	onRemove()
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 6 );
	}
	Draw( ctx, attached )
	{
		let frame = 0;
		
		if ( this.matter >= this.matter_max && this.reload_tim <= 0 )
		frame = 2;
		
		if ( this.attack_tim > 0 )
		frame = 1;
		
		if ( frame === 1 )
		ctx.apply_shading = false;
		
		ctx.filter = this.filter;
		
		ctx.rotate( Math.atan2( this.look_y, this.look_x ) );
		
		ctx.drawImageFilterCache( sdManualTurret.img_turret_sheet, 0, frame * 32, 96, 32, - 16, - 16, 96, 32 );
		
		ctx.filter = 'none';
	}
	MeasureMatterCost()
	{
		return 1000;
	}
	RequireSpawnAlign()
	{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
}
//sdManualTurret.init_class();

export default sdManualTurret;