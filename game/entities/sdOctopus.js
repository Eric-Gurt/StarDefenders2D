
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBlock from './sdBlock.js';

class sdOctopus extends sdEntity
{
	static init_class()
	{
		sdOctopus.img_octopus_idle1 = sdWorld.CreateImageFromFile( 'octopus_idle1' );
		sdOctopus.img_octopus_idle2 = sdWorld.CreateImageFromFile( 'octopus_idle2' );
		sdOctopus.img_octopus_idle3 = sdWorld.CreateImageFromFile( 'octopus_idle3' );
		sdOctopus.img_octopus_jump = sdWorld.CreateImageFromFile( 'octopus_jump' );
		
		sdOctopus.death_imgs = [
			sdWorld.CreateImageFromFile( 'octopus_death1' ),
			sdWorld.CreateImageFromFile( 'octopus_death2' ),
			sdWorld.CreateImageFromFile( 'octopus_death3' ),
			sdWorld.CreateImageFromFile( 'octopus_death4' )
		];
		sdOctopus.death_duration = 30;
		sdOctopus.post_death_ttl = 30 * 6;
		
		sdOctopus.max_seek_range = 1000;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	// 8 as max dimension so it can fit into one block
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -8; }
	get hitbox_y2() { return 7; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 1000; // Was 2000, but too boring to kill them
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		
		this.hurt_timer = 0;
		
		this.tenta_x = 0;
		this.tenta_y = 0;
		this.tenta_tim = 0;
		
		this.side = 1;
		
		this._anim_shift = ~~( Math.random() * 10000 );
		
		//this._consumed_matter = [];
		this._consumed_guns = [];
		
		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdOctopus.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				sdSound.PlaySound({ name:'octopus_alert', x:this.x, y:this.y, volume: 0.5 });
			}
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		return this.filter;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			//sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 });
			
			sdSound.PlaySound({ name:'octopus_death', x:this.x, y:this.y, volume: 0.5 });

			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 20;
	
			/*while ( this._consumed_matter.length > 0 )
			{
				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 1, this._consumed_matter[ 0 ].extra / sdWorld.crystal_shard_value ); // Probably error here, shards do not appear to be pickable, possibly due to NaN here
				
				this._consumed_matter.shift();
			}*/
			
			while ( this._consumed_guns.length > 0 )
			{
				let ent = new sdGun({ class:this._consumed_guns[ 0 ], x: this.x, y:this.y });
				ent.sx = this.sx + Math.random() * 8 - 4;
				ent.sy = this.sy + Math.random() * 8 - 4;
				ent.ttl = sdGun.disowned_guns_ttl;
				sdEntity.entities.push( ent );
				
				this._consumed_guns.shift();
			}
		}
		else
		{
			if ( this._hea > 0 )
			if ( this.hurt_timer === 0 )
			if ( Math.floor( ( this._hea ) / this._hmax * 5 ) !== Math.floor( ( this._hea + dmg ) / this._hmax * 5 ) )
			{
				sdSound.PlaySound({ name:'octopus_hurt2', x:this.x, y:this.y, volume: 0.5 });
				this.hurt_timer = 1;
			}
		}
		
		if ( this._hea < -this._hmax / 80 * 100 )
		this.remove();
	}
	get mass() { return 300; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	/* Default fall damage
	Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdOctopus.death_duration + sdOctopus.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible() || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdOctopus.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 500 )
				//if ( this._last_stand_on )
				if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x - this.x );
					let dy = ( this._current_target.y - this.y );
					
					//dy -= Math.abs( dx ) * 0.5;
					
					if ( dx > 0 )
					dx = 2;
					else
					dx = -2;
					
					if ( dy > 0 )
					dy = 1;
					else
					dy = -1;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 2 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 2;
						dy *= 2;
					}
					
					this.sx = dx;
					this.sy = dy;

					
					//this._last_stand_on = null; // wait for next collision
				}
			}
		}
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this.death_anim === 0 )
		{
			if ( this.tenta_tim > 0 )
			this.tenta_tim = Math.max( 0, this.tenta_tim - GSPEED * 15 );
		
			if ( this.hurt_timer > 0 )
			this.hurt_timer = Math.max( 0, this.hurt_timer - GSPEED * 0.075 );
		
			if ( this.hurt_timer <= 0 ) // Allow being stunned from damage since they deal higher damage now
			if ( this._current_target )
			if ( this._last_bite < sdWorld.time - 1000 )
			{
				this._last_bite = sdWorld.time; // So it is not so much calc intensive
						
				//let nears_raw = sdWorld.GetAnythingNear( this.x, this.y, 170 );
				let nears_raw = this.GetAnythingNearCache( this.x, this.y, 170 );
				let from_entity;
				
				let nears = [];
				for ( var i = 0; i < nears_raw.length; i++ )
				{
					from_entity = nears_raw[ i ];
					
					if ( ( from_entity.GetClass() === 'sdCharacter' && from_entity.IsVisible() ) ||
						 ( from_entity.GetClass() === 'sdBlock' && !from_entity._natural ) ||
						 from_entity.GetClass() === 'sdCom' ||
						 from_entity.GetClass() === 'sdCrystal' ||
						 from_entity.GetClass() === 'sdTurret' ||
						 from_entity.GetClass() === 'sdDoor' ||
						 from_entity.GetClass() === 'sdStorage' ||
						 ( from_entity.GetClass() === 'sdBadDog' && from_entity.master ) ||
						 from_entity.GetClass() === 'sdHover' ||
						 from_entity.GetClass() === 'sdAntigravity' ||
						 from_entity.GetClass() === 'sdMatterContainer' ||
						 from_entity.GetClass() === 'sdCommandCentre' ||
						 ( from_entity.GetClass() === 'sdGun' /*&& from_entity.class !== sdGun.CLASS_BUILD_TOOL && from_entity.class !== sdGun.CLASS_MEDIKIT && ( from_entity._held_by === null || from_entity._held_by.gun_slot === sdGun.classes[ from_entity.class ].slot )*/ ) || // Yes, held guns too, but only currently held guns. Except for build tool and medikit
						 from_entity.GetClass() === 'sdTeleport' ||
						 from_entity.GetClass() === 'sdVirus' ||
						 ( typeof from_entity.hea !== 'undefined' && from_entity.hea <= 0 ) ||
						 ( typeof from_entity._hea !== 'undefined' && from_entity._hea <= 0 ) ||
						 from_entity === this._current_target )
					if ( from_entity.IsTargetable( this ) )
					if ( !from_entity._is_being_removed )
					{
						let rank = Math.random() * 0.1;
						
						if ( ( from_entity.hea || from_entity._hea ) > 0 )
						rank += 100 / ( 100 + ( from_entity.hea || from_entity._hea ) );
						
						if ( from_entity._held_by )
						rank += 2;
						
						if ( from_entity.GetClass() === 'sdCharacter' && from_entity.hea > 0 )
						rank += 1;
						
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

					/*if ( from_entity.GetClass() === 'sdCharacter' ||
						 ( from_entity.GetClass() === 'sdBlock' && !from_entity._natural ) ||
						 from_entity.GetClass() === 'sdCom' ||
						 from_entity.GetClass() === 'sdCrystal' ||
						 from_entity.GetClass() === 'sdTurret' ||
						 from_entity.GetClass() === 'sdDoor' ||
						 from_entity.GetClass() === 'sdMatterContainer' ||
						 ( from_entity.GetClass() === 'sdGun' && from_entity.class !== sdGun.CLASS_BUILD_TOOL && from_entity.class !== sdGun.CLASS_MEDIKIT && ( from_entity._held_by === null || from_entity._held_by.gun_slot === sdGun.classes[ from_entity.class ].slot ) ) || // Yes, held guns too, but only currently held guns. Except for build tool and medikit
						 from_entity.GetClass() === 'sdTeleport' ||
						 from_entity.GetClass() === 'sdVirus' ||
						 ( typeof from_entity.hea !== 'undefined' && from_entity.hea <= 0 ) ||
						 ( typeof from_entity._hea !== 'undefined' && from_entity._hea <= 0 ) )*/
					if ( sdWorld.CheckLineOfSight( this.x, this.y, xx, yy, from_entity, null, sdCom.com_creature_attack_unignored_classes ) )
					{
						if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdDoor' )
						{
							if ( from_entity._reinforced_level > 0 ) // Octopus should not damage reinforced blocks to prevent raiders using them
							{
								// No damage
							}
							else
							from_entity.Damage( 75, this );
						}
						else
						from_entity.Damage( 75, this );
						
						if ( from_entity._is_being_removed )
						if ( from_entity.GetClass() === 'sdGun' )
						{
							if ( from_entity.class === sdGun.CLASS_CRYSTAL_SHARD )
							{
								//this._consumed_matter.push( from_entity.extra );
							}
							else
							this._consumed_guns.push( from_entity.class );
						}
						
						this._hea = Math.min( this._hmax, this._hea + 25 );

						sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });

						this.tenta_x = xx - this.x;
						this.tenta_y = yy - this.y;
						this.tenta_tim = 100;
						
						let di = sdWorld.Dist2D_Vector( this.tenta_x, this.tenta_y );
						if ( di > 0 )
						from_entity.Impulse( this.tenta_x / di * 20, this.tenta_y / di * 20 );

						//hits_left--;
						//if ( hits_left <= 0 )
						break;
					}
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Octopus" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdOctopus.death_duration + sdOctopus.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdOctopus.death_imgs.length - 1, ~~( ( this.death_anim / sdOctopus.death_duration ) * sdOctopus.death_imgs.length ) );
			ctx.drawImageFilterCache( sdOctopus.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( this.tenta_tim > 0 )
			{
				let morph = ( Math.sin( this.tenta_tim / 100 * Math.PI ) );
				
				for ( let layer = 0; layer < 2; layer++ )
				{
					if ( layer === 0 )
					ctx.strokeStyle = '#000000';
					else
					ctx.strokeStyle = '#008000';
					
					for ( let prog = 0; prog < 10; prog++ )
					{
						let morph1 = ( prog + 0 ) / 10;
						let morph2 = ( prog + 1 ) / 10;
						
						ctx.lineWidth = 7 * Math.pow( 1 - prog / 10, 2 ) + ( 1 - layer ) * 2;
						ctx.beginPath(); 
						ctx.moveTo( morph1 * this.tenta_x * morph * this.side, morph1 * this.tenta_y * morph );
						ctx.lineTo( morph2 * this.tenta_x * morph * this.side, morph2 * this.tenta_y * morph );
						ctx.stroke();
					}
				}
			}
			
			if ( this.hurt_timer > 0 )
			{
				ctx.drawImageFilterCache( sdOctopus.death_imgs[ 0 ], - 16, - 16, 32,32 );
			}
			else
			if ( Math.abs( this.sx ) < 1 )
			ctx.drawImageFilterCache( ( (sdWorld.time+this._anim_shift) % 5000 < 200 ) ? sdOctopus.img_octopus_idle2 : ( (sdWorld.time+this._anim_shift) % 5000 < 400 ) ? sdOctopus.img_octopus_idle3 : sdOctopus.img_octopus_idle1, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( sdOctopus.img_octopus_jump, - 16, - 16, 32,32 );
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
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdOctopus.death_duration + sdOctopus.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
				y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );
				
				//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter() });
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdOctopus.init_class();

export default sdOctopus;
