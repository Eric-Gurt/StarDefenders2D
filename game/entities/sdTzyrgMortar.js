
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

class sdTzyrgMortar extends sdEntity
{
	static init_class()
	{
		sdTzyrgMortar.img_mortar = sdWorld.CreateImageFromFile( 'sdTzyrgMortar' );
		
		//sdTzyrgMortar.effect_radius = 800;
		sdTzyrgMortar.attack_distance = 1600;

		sdTzyrgMortar.mortars = [];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -29; }
	get hitbox_x2() { return 29; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 32; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.hmax = 6000;
		this.hea = this.hmax;
		this._regen_timeout = 0; // Regen timeout;
		this._notify_players = 0;

		this._target = null;
		this._ai_team = 8; // 8 is AI team for tzyrgs, so the device doesn't target Tzyrgs
		this._attack_timer = 0;
		this.attack_frame = 0;
		this.attack_an = ( Math.atan2( -1, 0 ) ) * 1000;
		this.side = 1; // For mortar weapon
		this._last_attack = 0;
		
		this._reload_timer = -1;
		this._ammo = 4; // It will fire in volleys of 4
		// This way when it attacks players it'll be easier to determine from which direction the mortar is firing.
		
		//this._armor_protection_level = 4; // Bombs only?

		this._next_scan = 10; // Target scanning so the device doesn't spam GetTarget()
		
		this._time_until_full_remove = 30 * 5 + Math.random() * 30 * 5; // 5-10 seconds to get removed

		sdTzyrgMortar.mortars.push( this );

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
			if ( typeof initiator._ai_team !== 'undefined' )
			{
				if ( initiator._ai_team !== this._ai_team )
				this._target = initiator;	
			}
			else // No faction?	
			this._target = initiator;	
		}
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea <= 0 && was_alive )
		{		
			sdSound.PlaySound({ name:'hover_explosion', x:this.x, y:this.y, volume:2 });
			//this.death_anim = 1;
			//if ( initiator )
			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_BOSS );
		
			let that = this;
			for ( var i = 0; i < 6; i++ )
			{
				let an = Math.random() * Math.PI * 2;
				let d = ( i === 0 ) ? 0 : Math.random() * 20;
				let r = ( i === 0 ) ? 50 : ( 10 + Math.random() * 20 );

				setTimeout( ()=>
				{
					if ( !that._is_being_removed || i === 0 )
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
				}, i * 350 );
			}
		}
		
	}
	
	get mass() { return 3000; }
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
	GetTarget() // Scans random area on map for potential entities
	{

		/*let x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
		let y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );
		
		let targets_raw = sdWorld.GetAnythingNear( this.x, this.y, 256, null, [ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdTurret' , 'sdCube', 'sdDrone', 'sdCommandCentre', 'sdSetrDestroyer', 'sdOverlord', 'sdSpider' ] );
		for ( let i = 0; i < targets_raw.length; i++ )
		{
			i = Math.round( Math.random() * targets_raw.length ); // Randomize it
			return targets_raw[ i ];
		}*/
		
		let e = sdEntity.GetRandomActiveEntity();
		
		if ( e )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, e.x, e.y, sdTzyrgMortar.attack_distance ) )
		if ( sdCom.com_faction_attack_classes.indexOf( e.GetClass() ) !== -1 )
		if ( e.IsVisible( this ) )
		if ( e.IsTargetable( this ) )
		{
			return e;
		}
		
		return null;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{

		this.sy += sdWorld.gravity * GSPEED;

		if ( sdWorld.is_server )
		{
			
			if ( this.hea <= 0 )
			this._time_until_full_remove -= GSPEED;
			if ( this._time_until_full_remove < 0 )
			this.remove();
			if ( this.hea > 0 )
			{
				if ( this._reload_timer > 0 )
				this._reload_timer = Math.max( 0, this._reload_timer - GSPEED );
				if ( this._reload_timer === 0 ) // Reload
				{
					this._ammo = 4;
					this._reload_timer = -1;
				}

				if ( this.attack_frame > 0 )
				this.attack_frame = Math.max( 0, this.attack_frame - GSPEED * 0.1 );


				if ( !this._target || this._target._is_being_removed )
				{
					this._target = null;
					
					if ( this._next_scan <= 0 )
					{
						this._target = this.GetTarget();
						this._next_scan = 30;
					}
					else
					this._next_scan -= GSPEED;
				}
				else
				{
					let dx = ( this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2 ) - this.x;
					let dy = ( this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2 ) - this.y - 320;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );

					if ( di > 1 )
					{
						dx /= di;
						dy /= di;
					}
					
					dx = dx / Math.max( 1, ( 6 - Math.sqrt( ( Math.abs( ( this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2 ) - this.x ) / 50 ) ) ) );
					dy = -0.6;
					
					dx = dx * 20;
					dy = dy * 20;
					this.attack_an = ( Math.atan2( dy, Math.abs( dx ) ) ) * 1000;
					this.side = ( dx > 0 ) ? 1 : -1;
				}

					if ( this._target )
					if ( this._attack_timer <= 0 && sdWorld.inDist2D_Boolean( this.x, this.y, this._target.x, this._target.y, sdTzyrgMortar.attack_distance ) && this._ammo > 0 )
					{
						let xx = ( this._target.x + ( this._target._hitbox_x1 + this._target._hitbox_x2 ) / 2 );
						let yy = ( this._target.y + ( this._target._hitbox_y1 + this._target._hitbox_y2 ) / 2 );

						{
							let dx = xx - this.x;
							let dy = yy - this.y - 320;

							let di = sdWorld.Dist2D_Vector( dx, dy );

							//dx += ( from_entity.sx || 0 ) * di / 12;
							//dy += ( from_entity.sy || 0 ) * di / 12;


							if ( di > 1 )
							{
								dx /= di;
								dy /= di;
							}
							this.side = ( dx > 0 ) ? 1 : -1;
							
							dx = dx / Math.max( 1, ( 6 - Math.sqrt( ( Math.abs( xx - this.x ) / 50 ) ) ) );
							


							let should_fire = true;
							/*if ( !sdWorld.CheckLineOfSight( this.x, this.y - 16, this._target.x, this._target.y, this, null, ['sdCharacter', 'sdDrone' ] ) )
							{
								if ( sdWorld.last_hit_entity && sdWorld.last_hit_entity._ai_team === this._ai_team )
								should_fire = false;
							}*/
							
							if ( dx < 0.1 && dx > -0.1 ) // If the enemy is too close, stop to prevent self damage
							should_fire = false;

							if ( should_fire )
							{
								{
									let bullet_obj = new sdBullet({ x: this.x, y: this.y + 4 });

									bullet_obj._owner = this;

									bullet_obj.sx = dx;
									bullet_obj.sy = -0.6;
									bullet_obj.x += bullet_obj.sx * 16;
									bullet_obj.y += bullet_obj.sy * 16;

									bullet_obj.sx *= 16 + ( Math.random() * 6 ); // Add some "spread" so it's not ideal
									bullet_obj.sy *= 16 + ( Math.random() * 6 );
									bullet_obj.model = 'mortar_shell';
									
									bullet_obj._damage = 2;
									bullet_obj.explosion_radius = 30;
									bullet_obj.color = sdEffect.default_explosion_color;
									//bullet_obj.ac = 1;
									bullet_obj._affected_by_gravity = true;
									bullet_obj.time_left = 600;
									bullet_obj._dirt_mult = 3;
									
									this._last_attack = 0; // Reset "last seen" timer
		
									sdEntity.entities.push( bullet_obj );
								}

								this.attack_frame = 1;
								//this.attack_an = ( Math.atan2( dy, Math.abs( dx ) ) ) * 1000;
								this._attack_timer = 36;
								
								this._ammo--;

								//sdSound.PlaySound({ name:'gun_shotgun', x:this.x, y:this.y, pitch:1.25 });
									
								sdSound.PlaySound({ name:'tzyrg_fire', x:this.x, y:this.y, volume: 1, pitch:0.5 });
								sdSound.PlaySound({ name:'gun_rocket', x:this.x, y:this.y, volume: 1.25, pitch:1.25 });
							}
							else
							this._last_attack++;
						
							if ( this._last_attack > 150 )
							{
								this._target = null;
								this._last_attack = 0;
								
							}
						}
						if ( this._ammo <= 0 && this._reload_timer === -1 ) // No ammo?
						this._reload_timer = 135; // Reload
					}
					else
					{
						if ( !sdWorld.inDist2D_Boolean( this.x, this.y, this._target.x, this._target.y, sdTzyrgMortar.attack_distance ) )
						this._target = null;
					
						this._attack_timer = Math.max( 0, this._attack_timer - GSPEED );
					}

				if ( this._notify_players > 0 )
				this._notify_players -= GSPEED;
				else
				{
					for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
					if ( sdWorld.sockets[ i ].character )
					{
						let di = sdWorld.Dist2D( this.x, this.y, sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y );
						if ( di < 2000 )
						{
							let desc;
							desc = 'The Tzyrgs set up an outpost with mortar emplacements! You need to destroy all mortars in your vicinity before they start raining mortars on our positions!';
							sdTask.MakeSureCharacterHasTask({ 
								similarity_hash:'DESTROY-'+this._net_id, 
								executer: sdWorld.sockets[ i ].character,
								target: this,
								mission: sdTask.MISSION_DESTROY_ENTITY,
								difficulty: 0.3 * sdTask.GetTaskDifficultyScaler(),
								title: 'Destroy Tzyrg mortar',
								description: desc
							});
						}
					}
					this._notify_players = 60;
				}
			}
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{

		{
			sdEntity.TooltipUntranslated( ctx, T("Tzyrg Mortar"), 0, -24 );
			this.DrawHealthBar( ctx );
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = true;

		//ctx.filter = this.filter;
		let xx = this.hea > 0 ? 0 : 64;
		{
			ctx.drawImageFilterCache( sdTzyrgMortar.img_mortar, xx, 0, 64, 64, - 32, - 32, 64, 64 );
			
			if ( this.hea > 0 )
			{
				ctx.save();
				xx = this.attack_frame > 0 ? 64 : 0;
				ctx.scale( this.side, 1 );
				ctx.translate( 0, 4 );
				ctx.rotate( this.attack_an / 1000 );
				ctx.drawImageFilterCache( sdTzyrgMortar.img_mortar, 128 + xx, 0, 64, 64, -32, - 32, 64, 64 );
				ctx.restore();
			}
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		let i = sdTzyrgMortar.mortars.indexOf( this );
		
		if ( i !== -1 )
		sdTzyrgMortar.mortars.splice( i, 1 );

		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdTzyrgMortar.init_class();

export default sdTzyrgMortar;
