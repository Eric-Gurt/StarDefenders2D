
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
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -5; }
	get hitbox_x2() { return 5; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.regen_timeout = 0;
		
		this.type = Math.floor( Math.random() * 3 );
		
		if ( this.type === 1 || this.type === 2 ) // Current barrels
		this.hmax = 150;
		else
		this.hmax = 500;

		this.hea = this.hmax;
		this.matter_max = 320;
		this.matter = this.matter_max;
		this._damagable_in = sdWorld.time + 1500; // Copied from sdCrystal to prevent high ping players injure themselves, will only work for sdCharacter damage		
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
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		this.regen_timeout = Math.max( this.regen_timeout, 60 );
		
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
		
	}
	
	get mass() { return 30; }
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
		if ( sdWorld.is_server )
		{
			this.sy += sdWorld.gravity * GSPEED;
		
			if ( this.type === 0 || this.type === 1 )
			{
			this.MatterGlow( 0.01, 30, GSPEED );
			}
			if ( this.type === 0 || ( this.type === 1 && this.hea != this.hmax ) || ( this.type === 2 && this.hea != this.hmax ) )
			this.Damage( GSPEED );
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
		sdEntity.Tooltip( ctx, "Lost particle container" )
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
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdJunk.init_class();

export default sdJunk;
