
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

class sdJunk extends sdEntity
{
	static init_class()
	{
		sdJunk.img_cube_unstable = sdWorld.CreateImageFromFile( 'cube_unstable_corpse' );
		sdJunk.img_cube_unstable_detonate = sdWorld.CreateImageFromFile( 'cube_unstable_corpse_on' );
		sdJunk.img_cube_unstable2 = sdWorld.CreateImageFromFile( 'cube_unstable_corpse2' );
		sdJunk.img_cube_unstable2_empty = sdWorld.CreateImageFromFile( 'cube_unstable_corpse2_empty' );
		sdJunk.img_cube_unstable2_detonate = sdWorld.CreateImageFromFile( 'cube_unstable_corpse2_on' );
		sdJunk.img_cube_unstable3 = sdWorld.CreateImageFromFile( 'cube_unstable_corpse3' );
		sdJunk.img_cube_unstable3_detonate = sdWorld.CreateImageFromFile( 'cube_unstable_corpse3_on' );

		sdJunk.img_crystal_map_drainer_empty = sdWorld.CreateImageFromFile( 'crystal_cluster_empty' ); // Sprite by HastySnow / LazyRain
		sdJunk.img_crystal_map_drainer = sdWorld.CreateImageFromFile( 'crystal_cluster' ); // Sprite by HastySnow / LazyRain

		sdJunk.anti_crystals = 0;
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.type === 3 ? -28 : -5; }
	get hitbox_x2() { return this.type === 3 ? 28 : 5; }
	get hitbox_y1() { return this.type === 3 ? -28 : -5; }
	get hitbox_y2() { return this.type === 3 ? 32 : 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.regen_timeout = 0;

		let r = Math.random();
		let t_s = 0;

		if ( r < 0.3 )
		t_s = 2;
		else
		if ( r < 0.6 )
		t_s = 1;
		else
		t_s = 0;

		this.type = params.type || t_s;

		if ( this.type === 3 )
		this.hmax = 10000;
		else
		if ( this.type === 1 || this.type === 2 ) // Current barrels
		this.hmax = 150;
		else
		if ( this.type === 0 )
		this.hmax = 500;

		// Variables for large anti-crystal
		this._time_to_drain = 30 * 1;
		this._time_to_drain_more = 30 * 60 * 40; // 40 minutes, every 10 minutes it increases matter drain percentage
		//this._time_to_drain_rtps = 30 * 60 * 30; // 30 minutes until it also starts draining matter from rescue teleporters
		this._last_damage = 0; // Sound flood prevention
		//
		this.hea = this.hmax;
		this.matter_max = 320;
		this.matter = this.matter_max;
		this._damagable_in = sdWorld.time + 1500; // Copied from sdCrystal to prevent high ping players injure themselves, will only work for sdCharacter damage

		if ( this.type === 3 )
		sdJunk.anti_crystals++;		
		//this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
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
	
		//if ( initiator !== null )
		if ( initiator === null || initiator.IsPlayerClass() )
		if ( sdWorld.time < this._damagable_in )
		if ( !( initiator && initiator.IsPlayerClass() && initiator.power_ef > 0 ) )
		{
			if ( this.type === 3 )
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, pitch: 0.75 });

			return;
		}
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		this.regen_timeout = Math.max( this.regen_timeout, 60 );

		if ( this.type === 3 ) // Recieve score for damaging the crystal
		{
			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			{
				initiator._score += Math.max( 1, Math.round( dmg / 100 ) );
			}
		}
		
		if ( this.hea < 0 )
		{
			if ( this.type === 0 ) // Actual cube corpses explode into rails.
			{

				if (Math.random() < 0.1 ) // 10% chance to stabilize/revive the cube instead, idea by Bandit
				{
					let cube = new sdCube({ x: this.x, y: this.y });
					sdEntity.entities.push( cube );
					this.remove();
					return; // Prevents spawning cube shard when a cube stabilizes
				}
				else
				{
					let bullet_obj1 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj1._owner = this;
								bullet_obj1.sx = -1;
								bullet_obj1.sy = 0
								//bullet_obj1.x += bullet_obj1.sx * 5;
								//bullet_obj1.y += bullet_obj1.sy * 5;

								bullet_obj1.sx *= 16;
								bullet_obj1.sy *= 16;
						
								bullet_obj1.time_left = 30;

								bullet_obj1._rail = true;
								bullet_obj1.color = '#62c8f2';

								bullet_obj1._damage = 150;

								sdEntity.entities.push( bullet_obj1 );

					let bullet_obj2 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj2._owner = this;
								bullet_obj2.sx = 0;
								bullet_obj2.sy = 1;
								//bullet_obj2.x += bullet_obj2.sx * 5;
								//bullet_obj2.y += bullet_obj2.sy * 5;

								bullet_obj2.sx *= 16;
								bullet_obj2.sy *= 16;
						
								bullet_obj2.time_left = 30;

								bullet_obj2._rail = true;
								bullet_obj2.color = '#62c8f2';

								bullet_obj2._damage = 150;
								sdEntity.entities.push( bullet_obj2 );

					let bullet_obj3 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj3._owner = this;
								bullet_obj3.sx = 1;
								bullet_obj3.sy = 0
								//bullet_obj3.x += bullet_obj3.sx * 5;
								//bullet_obj3.y += bullet_obj3.sy * 5;

								bullet_obj3.sx *= 16;
								bullet_obj3.sy *= 16;
						
								bullet_obj3.time_left = 30;

								bullet_obj3._rail = true;
								bullet_obj3.color = '#62c8f2';

								bullet_obj3._damage = 150;

								sdEntity.entities.push( bullet_obj3 );

					let bullet_obj4 = new sdBullet({ x: this.x, y: this.y });
								bullet_obj4._owner = this;
								bullet_obj4.sx = 0;
								bullet_obj4.sy = -1;
								//bullet_obj4.x += bullet_obj4.sx * 5;
								//bullet_obj4.y += bullet_obj4.sy * 5;

								bullet_obj4.sx *= 16;
								bullet_obj4.sy *= 16;
						
								bullet_obj4.time_left = 30;

								bullet_obj4._rail = true;
								bullet_obj4.color = '#62c8f2';	

								bullet_obj4._damage = 150;
								sdEntity.entities.push( bullet_obj4 );
				}
			}
			if ( this.type === 1  ) // Cube "barrels" explode
			{
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:60, // 80 was too much?
					damage_scale: 2 + ( 1 * ( this.matter / 90 ) ), // Weaker explosion if you drain it's matter before that, more lethal than regular cube explosion if it's matter is max
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:'#33FFFF' 
				});
			}
			if ( this.type === 2  ) // Cube yellow "barrels" use Lost affection, check code in case if I made a mistake somehow
			{
				let bullet = new sdBullet({ x: this.x, y: this.y });
				bullet.model = 'ball_charged';
				bullet._damage = 0;
				bullet.owner = this;
				bullet.time_left = 0; 
				bullet._custom_detonation_logic = ( bullet )=>
				{
					{
						sdWorld.SendEffect({ 
							x:bullet.x, 
							y:bullet.y, 
							radius:30,
							damage_scale: 0, // Just a decoration effect
							type:sdEffect.TYPE_EXPLOSION, 
							owner:this,
							color:'#ffff66' 
						});

						let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 32 );

						for ( let i = 0; i < nears.length; i++ )
						{
							sdLost.ApplyAffection( nears[ i ], 90, bullet );
						}
					}
				};
				sdEntity.entities.push( bullet );
			}
			if ( this.type === 3 ) // Large Anti-crystal degrades into a big Anti-crystal
			{

				sdSound.PlaySound({ name:'glass10', x:this.x, y:this.y, volume:0.5 });

				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
					Math.ceil( Math.max( 5, sdCrystal.anticrystal_value * 4 / sdCrystal.anticrystal_value * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
					sdCrystal.anticrystal_value * 4 / 160,
					8
				);

				let ent = new sdCrystal({x: this.x, y: this.y + ( this._hitbox_y2 / 2 ), sx: this.sx, sy: this.sy, type:2 });

				ent.matter_max = sdCrystal.anticrystal_value * 4;
				ent.matter = 0;

				sdEntity.entities.push( ent );
				sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible
			}

			let r = Math.random();

			r = Math.random(); // Cube shard dropping roll
			if ( this.type === 0 || this.type === 1 ) // unstable cube corpses
			if ( r < 0.1 )
			{
				let x = this.x;
				let y = this.y;
				let sx = this.sx;
				let sy = this.sy;

				setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun;
					gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_CUBE_SHARD });
					gun.sx = sx;
					gun.sy = sy;
					sdEntity.entities.push( gun );

					}, 500 );
			}

			this.remove();
		}
		else
		if ( sdWorld.time > this._last_damage + 50 )
		if ( this.type === 3 )
		{
			this._last_damage = sdWorld.time;
			sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
		}
		
	}
	
	get mass() { return this.type === 3 ? 500 : 30; }
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
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.type === 3 )
		GSPEED *= 0.25;

		this.sy += sdWorld.gravity * GSPEED;

		if ( sdWorld.is_server )
		{
			if ( this.type === 0 || this.type === 1 )
			{
				this.MatterGlow( 0.01, 30, GSPEED );
			}
			if ( this.type === 0 || ( this.type === 1 && this.hea !== this.hmax ) || ( this.type === 2 && this.hea !== this.hmax ) )
			this.Damage( GSPEED );

			if ( this.type === 3 )
			{
				this._time_to_drain -= GSPEED;
				this._time_to_drain_more = Math.max( this._time_to_drain_more - GSPEED, 0 );
				//this._time_to_drain_rtps = Math.max( this._time_to_drain_rtps - GSPEED, 0 );

				if ( this._time_to_drain <= 0 )
				{
					this._time_to_drain = 30 * 1;

					let multiplier = 0.98;
					let di_mult = 1; // Distance multiplier, the closer the player, the faster the drain.
					let di = 2000;

					if ( this._time_to_drain_more <= 0 )
					multiplier = 0.90;
					else
					if ( this._time_to_drain_more <= ( 30 * 60 * 10 ) )
					multiplier = 0.92;
					else
					if ( this._time_to_drain_more <= ( 30 * 60 * 20 ) )
					multiplier = 0.94;
					else
					if ( this._time_to_drain_more <= ( 30 * 60 * 30 ) )
					multiplier = 0.96;

					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					{
						di_mult = 1;

						if ( sdWorld.sockets[ i ].character !== null )
						if ( sdWorld.sockets[ i ].character.hea > 0 )
						if ( !sdWorld.sockets[ i ].character._is_being_removed )
						{
							//if ( sdWorld.sockets[ i ].character.build_tool_level > 0 )
							{
								di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, this.x, this.y );
								if ( di < 500 )
								di_mult = 0.6;
								else
								if ( di < 1000 )
								di_mult = 0.7;
								else
								if ( di < 1500 )
								di_mult = 0.8;
								else
								if ( di < 2000 )
								di_mult = 0.9;

								if ( di < 2500 )
								sdWorld.sockets[ i ].character.matter = sdWorld.sockets[ i ].character.matter * multiplier * di_mult;
							}
						}
					}
					/*if ( this._time_to_drain_rtps <= 0 )
					{
						for ( var i = 0; i < sdRescueTeleport.rescue_teleports.length; i++ )
						{
							sdRescueTeleport.rescue_teleports[ i ].matter = sdRescueTeleport.rescue_teleports[ i ].matter * multiplier / 3;
						}						
					}*/
				}
			}
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.type === 0 )
		sdEntity.Tooltip( ctx, "Unstable cube corpse" );
		if ( this.type === 1 )
		sdEntity.Tooltip( ctx, "Alien battery" );
		if ( this.type === 2 )
		sdEntity.Tooltip( ctx, "Lost particle container" );
		if ( this.type === 3 )
		sdEntity.Tooltip( ctx, "Large Anti-crystal" );
	}
	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		{
			if ( this.type === 0 ) // First unstable cube corpse
			{
				if ( this.hea % 15 < ( this.hea / this.hmax ) * 9 )
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable, - 16, - 16, 32,32 );
				else
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable_detonate, - 16, - 16, 32,32 );
			}
			if ( this.type === 1 ) // Alien battery
			{
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable2_empty, - 16, - 16, 32,32 );

				if ( this.hea % 15 < ( this.hea / this.hmax ) * 9 )
				{
					ctx.globalAlpha = ( this.matter/this.matter_max );
					ctx.drawImageFilterCache( sdJunk.img_cube_unstable2, - 16, - 16, 32,32 );
				}
				else
				{
					ctx.globalAlpha = 1;
					ctx.drawImageFilterCache( sdJunk.img_cube_unstable2_detonate, - 16, - 16, 32,32 );
				}
			}
			if ( this.type === 2 ) // Lost converter cube barrel
			{
				if ( this.hea % 15 < ( this.hea / this.hmax ) * 9 )
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable3, - 16, - 18, 32,32 );
				else
				ctx.drawImageFilterCache( sdJunk.img_cube_unstable3_detonate, - 16, - 18, 32,32 );
			}
			if ( this.type === 3 ) // Large Anti-crystal, drains percentage of matter in active/online players
			{
				ctx.drawImageFilterCache( sdJunk.img_crystal_map_drainer_empty, - 48, - 48, 96, 96 );

				ctx.filter = sdWorld.GetCrystalHue( sdCrystal.anticrystal_value );
				ctx.globalAlpha = 0.8 + Math.sin( sdWorld.time / 3000 ) * 0.1;

				ctx.drawImageFilterCache( sdJunk.img_crystal_map_drainer, - 48, - 48, 96, 96 );
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
		if ( this.type === 3 )
		sdJunk.anti_crystals--;
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdJunk.init_class();

export default sdJunk;
