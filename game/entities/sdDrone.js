
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';
import sdBullet from './sdBullet.js';
import sdCube from './sdCube.js';
import sdCharacter from './sdCharacter.js';


class sdDrone extends sdEntity
{
	static init_class()
	{
		sdDrone.img_drone_falkok = sdWorld.CreateImageFromFile( 'drone_falkok' );
		sdDrone.img_drone_falkok_attack = sdWorld.CreateImageFromFile( 'drone_falkok_attack' );
		sdDrone.img_drone_falkok_destroyed = sdWorld.CreateImageFromFile( 'drone_falkok_destroyed' );

		sdDrone.img_drone_robot = sdWorld.CreateImageFromFile( 'drone_robot' );
		sdDrone.img_drone_robot_attack = sdWorld.CreateImageFromFile( 'drone_robot_attack' );
		sdDrone.img_drone_robot_destroyed = sdWorld.CreateImageFromFile( 'drone_robot_destroyed' );
		
		sdDrone.death_duration = 15;
		sdDrone.post_death_ttl = 30 * 10;
		
		sdDrone.max_seek_range = 1000;
		
		sdDrone.drones_tot = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -10; }
	get hitbox_x2() { return 10; }
	get hitbox_y1() { return -10; }
	get hitbox_y2() { return 10; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 400;
		this._hea = this._hmax;
		this._ai_team = params._ai_team || 1;

		this.attack_an = 0;
		this.death_anim = 0;
		this.type = params.type || 1;
		
		this._current_target = null;

		this._attack_timer = 0;
		this._burst_ammo_start = this.type === 2 ? 6 : 0;
		this._burst_ammo = this._burst_ammo_start;
		this._burst_reload = this.type === 2 ? 2 : 0; // Reload time when it's burst firing

		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_attack = sdWorld.time;
		
		this.side = 1;
		
		this.attack_frame = 0;
		
		this._anim_shift = ~~( Math.random() * 10000 );
		
		sdDrone.drones_tot++;
		
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdDrone.max_seek_range )
			if ( this._current_target === null || 
				 ( this._current_target.hea || this._current_target._hea ) <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;
			}
		}
	}

	GetBleedEffect()
	{
		if ( this.type === 2 )
		return sdEffect.TYPE_BLOOD_GREEN;
		else
		return sdEffect.TYPE_WALL_HIT;
	
	}
	GetBleedEffectFilter()
	{
		if ( this.type === 2 )
		return 'hue-rotate(100deg)'; // Blue
	
		return '';
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( initiator )
		if ( !initiator.is( sdDrone ) && initiator._ai_team !== this._ai_team )
		if ( !initiator.is( sdCharacter ) && initiator._ai_team !== this._ai_team )
		this._current_target = initiator;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{

			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 7;
			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius: 25, 
			damage_scale: 2 , 
			type:sdEffect.TYPE_EXPLOSION,
			armor_penetration_level: 0,
			owner:this,
			color:sdEffect.default_explosion_color
			});
	
		}
		
		if ( this._hea < -600 )
		this.remove();
	}
	get mass() { return 500; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 15 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( this._attack_timer > 0 )
		this._attack_timer -= GSPEED;

		if ( this._hea <= 0 )
		{
			this.attack_an += this.sx / 6;

			if ( this.death_anim < sdDrone.death_duration + sdDrone.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdDrone.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				if ( this.attack_frame < 1 ) // Not attacking
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 200 )
				//if ( this._last_stand_on )
				//if ( in_water )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x + ( this._current_target.sx || 0 ) * 10 - this.x - this.sx * 10 );
					let dy = ( this._current_target.y + ( this._current_target.sy || 0 ) * 10 - this.y - this.sy * 10 );
					
					// Bad formula but whatever
					dx += Math.random() * 40 - 20;
					dy += -Math.random() * 20;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 2 )
					{
						dx /= di;
						dy /= di;
						
						//dx *= 2;
						//dy *= 2;
						
						if ( di < 100 + Math.random() * 100 )
						{
							dx *= -0.2;
							dy *= -0.2;
						}
					}
					
					this.sx += dx;
					this.sy += dy;

					//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
					//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );
					
					//this._last_stand_on = null; // wait for next collision
				}
			}
		}
		else
		{
			// No target
			if ( sdWorld.is_server )
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			{
				if ( sdWorld.sockets[ i ].character )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				//if ( sdWorld.sockets[ i ].character.IsVisible( this ) )
				{
					
					let dx = ( sdWorld.sockets[ i ].character.x + Math.random() * 1000 - 500 - this.x );
					let dy = ( sdWorld.sockets[ i ].character.y + Math.random() * 1000 - 500 - this.y );
					
					let di = sdWorld.Dist2D_Vector( dx, dy );

					if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) < 4 )
					if ( di > 1 )
					{
						this.sx += dx / di * 0.2;
						this.sy += dy / di * 0.2;

						//if ( sdWorld.Dist2D_Vector( this.sx, this.sy ) > 6 )
						//console.log( sdWorld.Dist2D_Vector( this.sx, this.sy ) );
						
						break;
					}
				}
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
		}
		
		if ( this.death_anim === 0 )
		{
			if ( this.attack_frame > 0 )
			this.attack_frame = Math.max( 0, this.attack_frame - GSPEED * 0.1 );
			if ( !this.CanMoveWithoutOverlap( this.x, this.y + 48, 0 ) )
			this.sy = Math.min( this.sy, 0 )
			if ( this._current_target )
			if ( this._attack_timer <= 0 )
			{
				this._last_attack = sdWorld.time; // So it is not so much calc intensive
						
				let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 240, null, [ 'sdCharacter', 'sdDrone', 'sdEnemyMech' ] );
				let from_entity;
				
				let nears = [];
				for ( var i = 0; i < nears_raw.length; i++ )
				{
					from_entity = nears_raw[ i ];
					
					if ( ( ( from_entity.GetClass() === 'sdCharacter' && from_entity._ai_team !== this._ai_team || this._current_target === from_entity ) && ( from_entity.hea || from_entity._hea ) > 0 ) )
					{
						let rank = Math.random() * 0.1;
						
						nears.push( { ent: from_entity, rank: rank } );
					}
					if ( from_entity.GetClass() === 'sdDrone' && from_entity._ai_team !== this._ai_team )
					{
						let rank = Math.random() * 0.1;
						
						nears.push( { ent: from_entity, rank: rank } );
					}
					if ( from_entity.GetClass() === 'sdEnemyMech' && from_entity._ai_team !== this._ai_team )
					{
						let rank = Math.random() * 0.1;
						
						nears.push( { ent: from_entity, rank: rank } );
					}
				}
				
				nears.sort((a,b)=>{
					return b.rank - a.rank;
				});
				
				//sdWorld.shuffleArray( nears );

				//let hits_left = 4;

				for ( var i = 0; i < nears.length; i++ )
				{
					from_entity = nears[ i ].ent;
					
					let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
					let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						let dx = xx - this.x;
						let dy = yy - this.y;
						
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
						
						//this.an = Math.atan2( this._target.y + this._target.sy * di / vel - this.y, this._target.x + this._target.sx * di / vel - this.x ) * 100;
						
						//sdSound.PlaySound({ name:'crystal2', x:this.x, y:this.y, volume:0.33, pitch:2.8 });
						if ( this.type === 1  ) // Falkok drones
						{
							let bullet_obj = new sdBullet({ x: this.x, y: this.y });

							bullet_obj._owner = this;

							bullet_obj.sx = dx;
							bullet_obj.sy = dy;
							bullet_obj.x += bullet_obj.sx * 3;
							bullet_obj.y += bullet_obj.sy * 3;

							bullet_obj.sx *= 12;
							bullet_obj.sy *= 12;

							bullet_obj._damage = 15;
							bullet_obj.color = '#ff0000';
						

							sdEntity.entities.push( bullet_obj );
						
							this.attack_frame = 2;
							this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
							this._attack_timer = 7;

							sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:5 });
						}
						if ( this.type === 2  ) // Robot drones ( I have no name for this faction lol )
						{
							let bullet_obj = new sdBullet({ x: this.x, y: this.y });

							bullet_obj._owner = this;

							bullet_obj.sx = dx;
							bullet_obj.sy = dy;
							bullet_obj.x += bullet_obj.sx * 3;
							bullet_obj.y += bullet_obj.sy * 3;

							bullet_obj.sx *= 12;
							bullet_obj.sy *= 12;

							bullet_obj._damage = 15;
							bullet_obj.color = '#00aaff';
						

							sdEntity.entities.push( bullet_obj );
						
							this.attack_frame = 2;
							this.attack_an = ( Math.atan2( -dy, Math.abs( dx ) ) ) * 100;
							this._burst_ammo--;
							if ( this._burst_ammo > 0 )
							this._attack_timer = this._burst_reload;
							else
							{
								this._attack_timer = 35;
								this._burst_ammo = this._burst_ammo_start;
							}

							sdSound.PlaySound({ name:'gun_pistol', x:this.x, y:this.y, volume:0.33, pitch:10 }); // Could maybe do with other sound effect?
						}
						break;
					}
				}
			}
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Drone" );
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		ctx.scale( -this.side, 1 );
		ctx.rotate( this.attack_an / 100 );
		
		if ( this.death_anim === 0 )
		{
			ctx.translate( 0, Math.sin( (sdWorld.time+this._anim_shift) / 1000 * Math.PI ) * 2 );

		}
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdDrone.death_duration + sdDrone.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			if ( this.type === 1  )
			ctx.drawImageFilterCache( sdDrone.img_drone_falkok_destroyed, - 16, - 16, 32, 32 );
			if ( this.type === 2  )
			ctx.drawImageFilterCache( sdDrone.img_drone_robot_destroyed, - 16, - 16, 32, 32 );
		}
		else
		{
			if ( this.attack_frame >= 1 )
			{
				if ( this.type === 1  )
				ctx.drawImageFilterCache( sdDrone.img_drone_falkok_attack, - 16, - 16, 32, 32 );
				if ( this.type === 2  )
				ctx.drawImageFilterCache( sdDrone.img_drone_robot_attack, - 16, - 16, 32, 32 );
			}
			else
			{
				if ( this.type === 1  )
				ctx.drawImageFilterCache( sdDrone.img_drone_falkok, - 16, - 16, 32, 32 );
				if ( this.type === 2  )
				ctx.drawImageFilterCache( sdDrone.img_drone_robot, - 16, - 16, 32, 32 );
			}
		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdDrone.drones_tot--;
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdDrone.init_class();

export default sdDrone;