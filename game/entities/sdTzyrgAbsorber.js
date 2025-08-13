
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

class sdTzyrgAbsorber extends sdEntity
{
	static init_class()
	{
		sdTzyrgAbsorber.img_absorber = sdWorld.CreateImageFromFile( 'tzyrg_quake_absorber' );
		sdTzyrgAbsorber.img_turret = sdWorld.CreateImageFromFile( 'tzyrg_absorber_turret' );
		
		sdTzyrgAbsorber.effect_radius = 800;
		sdTzyrgAbsorber.attack_distance = 450;

		sdTzyrgAbsorber.absorbers = [];
		
		sdTzyrgAbsorber.character_and_drone_class_name_list = [ 'sdCharacter', 'sdDrone' ];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -13; }
	get hitbox_x2() { return 13; }
	get hitbox_y1() { return -19; }
	get hitbox_y2() { return 13; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.hmax = 6000;
		this.hea = this.hmax;
		this._spawn_timer = 30 * 60 * 5; // Spawn Tzyrgs timer
		this._regen_timeout = 0; // Regen timeout;
		this._notify_players = 0;

		this._target = null;
		this._ai_team = 8; // 8 is AI team for tzyrgs, so the device doesn't target Tzyrgs
		this._attack_timer = 0;
		this.attack_frame = 0;
		this.attack_an = 0;
		this.side = 1;
		this._last_seen = 0;

		this._next_scan = 10; // Target scanning so the device doesn't spam GetRandomEntityNearby()

		sdTzyrgAbsorber.absorbers.push( this );

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
				{
					let x = this.x;
					let y = this.y;
					let sx = this.sx;
					let sy = this.sy;

					setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun;
					gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
					gun.extra = 0;

					//gun.sx = sx;
					//gun.sy = sy;
					sdEntity.entities.push( gun );

					}, 500 );
				}

			this.remove();
		}
		
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

		if ( sdWorld.is_server )
		{

			if ( this.attack_frame > 0 )
			this.attack_frame = Math.max( 0, this.attack_frame - GSPEED * 0.1 );


			if ( !this._target || this._target._is_being_removed )
			{
				this._target = null;
				
				if ( this._next_scan <= 0 )
				{
					this._target = sdCharacter.GetRandomEntityNearby( this );
					this._next_scan = 3;
				}
				else
				this._next_scan -= GSPEED;
			}
			else
			{
				let dx = ( this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2 ) - this.x;
				let dy = ( this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2 ) - this.y + 16;
				this.attack_an = ( Math.atan2( dy, Math.abs( dx ) ) ) * 1000;
				this.side = ( dx > 0 ) ? 1 : -1;
			}

				if ( this._target )
				if ( this._attack_timer <= 0 && sdWorld.inDist2D_Boolean( this.x, this.y, this._target.x, this._target.y, sdTzyrgAbsorber.attack_distance ) )
				{
					let xx = this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2;
					let yy = this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2;
					let consider_attacking = false;
					if ( this._target.GetClass() !== 'sdBlock' )
					{
						if ( sdWorld.CheckLineOfSight( this.x, this.y - 16, xx, yy, this._target, null, sdCom.com_creature_attack_unignored_classes ) )
						consider_attacking = true;
					}
					else
					if ( this._target.GetClass() === 'sdBlock' )
					consider_attacking = true;

					if ( consider_attacking )
					{
						this._last_seen = 0; // Reset "last seen" timer
						let dx = xx - this.x;
						let dy = yy - this.y + 16;

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
						if ( !sdWorld.CheckLineOfSight( this.x, this.y - 16, this._target.x, this._target.y, this, null, sdTzyrgAbsorber.character_and_drone_class_name_list ) )
						{
							if ( sdWorld.last_hit_entity && sdWorld.last_hit_entity._ai_team === this._ai_team )
							should_fire = false;
						}

						if ( should_fire )
						{
							for ( let i = 0; i < 5; i++ )
							{
								let bullet_obj = new sdBullet({ x: this.x, y: this.y - 16 });

								bullet_obj._owner = this;

								bullet_obj.sx = dx;
								bullet_obj.sy = dy;
								bullet_obj.x += bullet_obj.sx * 6;
								bullet_obj.y += bullet_obj.sy * 6;

								bullet_obj.sx *= 12 + Math.random() * 8 - Math.random() * 8;
								bullet_obj.sy *= 12 + Math.random() * 8 - Math.random() * 8;

								bullet_obj._damage = 15;

	
								sdEntity.entities.push( bullet_obj );
							}

							this.attack_frame = 1;
							//this.attack_an = ( Math.atan2( dy, Math.abs( dx ) ) ) * 1000;
							this._attack_timer = 24;

							//sdSound.PlaySound({ name:'gun_shotgun', x:this.x, y:this.y, pitch:1.25 });
								
							sdSound.PlaySound({ name:'tzyrg_fire', x:this.x, y:this.y, volume: 1 });
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

			if ( this._notify_players > 0 )
			this._notify_players -= GSPEED;
			else
			{
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
				if ( sdWorld.sockets[ i ].character )
				{
					let di = sdWorld.Dist2D( this.x, this.y, sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y );
					if ( di < 600 )
					{
						let desc;
						desc = 'You located a strange Tzyrg device. Maybe it is best to destroy it since the Tzyrgs are hostile to us, right?';
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'DESTROY-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_DESTROY_ENTITY,
							difficulty: 0.3 * sdTask.GetTaskDifficultyScaler(),
							title: 'Destroy a Tzyrg device',
							description: desc
						});
					}
				}
				this._notify_players = 60;
			}

			if ( this._spawn_timer > 0 )
			this._spawn_timer -= GSPEED;
			else
			{
				this._spawn_timer = 30 * 60 * 5; // Not too frequent spawns of tzyrg faction when the absorber is present
				sdWorld.entity_classes.sdWeather.only_instance.ExecuteEvent({
					event: 35,
					near_entity: this,
					group_radius: 3000
				}); // Spawn some Tzyrgs in the world
			}
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{

		{
			sdEntity.TooltipUntranslated( ctx, T("Tzyrg device"), 0, -24 );
			this.DrawHealthBar( ctx );
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = true;

		//ctx.filter = this.filter;
		let xx = this.attack_frame > 0 ? 64 : 0;
		{
			ctx.drawImageFilterCache( sdTzyrgAbsorber.img_absorber, 0, 0, 64, 64, - 32, - 32, 64, 64 );
			ctx.save();
			ctx.scale( this.side, 1 );
			ctx.translate( 0, -16 );
			ctx.rotate( this.attack_an / 1000 );
			ctx.drawImageFilterCache( sdTzyrgAbsorber.img_turret, xx, 0, 64, 64, -32, - 32, 64, 64 );
			ctx.restore();
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		let i = sdTzyrgAbsorber.absorbers.indexOf( this );
		
		if ( i !== -1 )
		sdTzyrgAbsorber.absorbers.splice( i, 1 );

		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdTzyrgAbsorber.init_class();

export default sdTzyrgAbsorber;
