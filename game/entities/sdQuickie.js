
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdGib from './sdGib.js';
import sdBlock from './sdBlock.js';
import sdVirus from './sdVirus.js';
import sdAsp from './sdAsp.js';

class sdQuickie extends sdEntity
{
	static init_class()
	{
		sdQuickie.img_quickie = sdWorld.CreateImageFromFile( 'sdQuickie' );
		/*
		sdQuickie.img_quickie_idle1 = sdWorld.CreateImageFromFile( 'quickie_idle1' );
		sdQuickie.img_quickie_idle2 = sdWorld.CreateImageFromFile( 'quickie_idle2' );
		sdQuickie.img_quickie_walk1 = sdWorld.CreateImageFromFile( 'quickie_walk1' );
		sdQuickie.img_quickie_walk2 = sdWorld.CreateImageFromFile( 'quickie_walk2' );
		
		sdQuickie.death_imgs = [
			sdWorld.CreateImageFromFile( 'quickie_death1' ),
			sdWorld.CreateImageFromFile( 'quickie_death2' ),
			sdWorld.CreateImageFromFile( 'quickie_death3' )
		];
		*/
		sdQuickie.death_duration = 10;
		sdQuickie.post_death_ttl = 180;
		
		sdQuickie.max_seek_range = 800;

		sdQuickie.quickies_tot = 0;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 6; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._tier = params.tier || params._tier || 1; // Used to determine its' HP and damage
		
		this._crystal_worth = params.crystal_worth || ( ( this._tier === 2 ) ? 160 : 0 );

		if ( this._tier === 1 )
		this._hmax = 40;
		else
		if ( this._tier === 2 ) // Crystal quickies were meant to have 2x HP due to turning into crystal shards on death.
		this._hmax = 80;
		else
		this._hmax = 7;
	
		this._hea = this._hmax;
		this.gibbed = false; 
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		
		this.side = 1;

		sdQuickie.quickies_tot++;
		//this.sd_filter = params.sd_filter || null; // Custom per-pixel filter
		this.filter = params.filter || null;
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible( this ) )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdQuickie.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;
				
				sdSound.PlaySound({ name:'quickie_alert', x:this.x, y:this.y, volume: 0.2 });
				
			}
		}
	}
	
	GetBleedEffect()
	{
		if ( this._tier === 1 )
		return sdEffect.TYPE_BLOOD_GREEN;
	
		return sdEffect.TYPE_WALL_HIT;
	}
	GetBleedEffectFilter()
	{
		if ( this._tier === 1 )
		return 'hue-rotate(-56deg)';
	
		return '';
	}
	
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;

		let spawn_gib = ( this._hea > -this._hmax / 80 * 100 );
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:4 });

			this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );
		}

		if ( this._tier === 1 )
		if ( this._hea < -this._hmax / 80 * 100 && spawn_gib && this._hea <= 0 )
		{
			sdWorld.SpawnGib( this.x - ( 8 * this.side ), this.y, this.sx + Math.random() * 1 - Math.random() * 1, this.sy - Math.random() * 1.5, -this.side, sdGib.CLASS_QUICKIE_LIMB , 1, this.GetBleedEffectFilter(), 100, this );
			this.gibbed = true;
		}
		if ( this._hea < -this._hmax / 40 * 100 || ( this._hea <= 0 && this._tier === 2 ) ) // used to be only " ||this._tier === 2 " which resulted in instant death for Crystal Quickies, unintentional - Booraz
		this.remove();
	}
	
	get mass() { return 15; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.2;
		//this.sy += y * 0.2;
	}
	/* Default fall damage
	Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 15 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		
		if ( this._hea <= 0 )
		{
			if ( this._tier !== 2 )
			if ( this.death_anim < sdQuickie.death_duration + sdQuickie.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible( this ) || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdQuickie.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 100 )
				//if ( this._last_stand_on )
				if ( in_water || !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x - this.x );
					let dy = ( this._current_target.y - this.y );
					
					//dy -= Math.abs( dx ) * 0.5;
					
					if ( dx > 0 )
					dx = 5;
					else
					dx = -5;
					
					if ( dy > 0 )
					dy = 1;
					else
					dy = -1;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 5 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 5;
						dy *= 5;
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
			
			if ( this._hea > 0 )
			this.sy -= sdWorld.gravity * GSPEED * 2;
		}
		
		this.sy += sdWorld.gravity * GSPEED;
		
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 500 )
		{
			let nears = sdWorld.GetAnythingNear( this.x, this.y, 8 );
			let from_entity;
				
			sdWorld.shuffleArray( nears );
			
			let max_targets = 3;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;

				if ( /*from_entity.GetClass() === 'sdCharacter' ||
					 from_entity.GetClass() === 'sdBlock' ||
					 from_entity.GetClass() === 'sdMatterContainer' ||
					 from_entity.GetClass() === 'sdMatterAmplifier' ||
					 from_entity.GetClass() === 'sdCrystalCombiner' ||
					 from_entity.GetClass() === 'sdConveyor' ||
					 from_entity.GetClass() === 'sdStorage' ||
					 from_entity.GetClass() === 'sdCrystal' ||
					 from_entity.GetClass() === 'sdJunk' ||
					 from_entity.GetClass() === 'sdTeleport' ||
					 from_entity.GetClass() === 'sdDoor' ||
					 from_entity.GetClass() === 'sdCom' ||
					 from_entity.GetClass() === 'sdNode' ||
					 from_entity.GetClass() === 'sdTurret' ||*/
					 ( !from_entity.is( sdQuickie ) && 
					   !from_entity.is( sdAsp ) && 
					   !from_entity.is( sdVirus ) && 
					   from_entity._is_bg_entity === this._is_bg_entity && 
					   from_entity.IsTargetable( this ) 
					 ) ||
					 from_entity === this._current_target 
				)
				if ( from_entity.IsTargetable() )
				{
					this._last_bite = sdWorld.time;
					if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdDoor' )
					{
						/*if ( from_entity._reinforced_level > 0 ) // Quickies should not damage reinforced blocks to prevent raiders using them
						{
							// No damage
						}
						else*/
						from_entity.DamageWithEffect( 18 * this._tier, this );
					}
					else
					from_entity.DamageWithEffect( 15 * this._tier, this );
					
					this._hea = Math.min( this._hmax, this._hea + ( 7 * this._tier ) );

					from_entity.PlayDamageEffect( xx, yy );
					//sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					max_targets--;
					if ( max_targets <= 0 )
					break;
				}
			}
		}
	}
	get title()
	{
		return "Quickie";
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		//ctx.sd_filter = this.sd_filter;
		ctx.scale( this.side, 1 );

		let xx = 0;
		let yy = 0;
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdQuickie.death_duration + sdQuickie.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			xx = Math.min( 3 - 1, ~~( ( this.death_anim / sdQuickie.death_duration ) * 3 ) );
			if ( this.gibbed === true )
			xx = 3;
			yy = 1;
			
			//let frame = Math.min( sdQuickie.death_imgs.length - 1, ~~( ( this.death_anim / sdQuickie.death_duration ) * sdQuickie.death_imgs.length ) );
			//ctx.drawImageFilterCache( sdQuickie.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( Math.abs( this.sx ) < 2 )
			xx = Math.min( ( sdWorld.time % 400 < 200 ) ? 0 : 1 );
			//ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdQuickie.img_quickie_idle1 : sdQuickie.img_quickie_idle2, - 16, - 16, 32,32 );
			else
			xx = Math.min( ( sdWorld.time % 400 < 200 ) ? 2 : 3 );
			//ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdQuickie.img_quickie_walk1 : sdQuickie.img_quickie_walk2, - 16, - 16, 32,32 );
		}

		ctx.drawImageFilterCache( sdQuickie.img_quickie, xx * 32, yy * 32, 32,32, -16, -16, 32,32 );
		
		ctx.globalAlpha = 1;
		//ctx.sd_filter = null;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdQuickie.quickies_tot--;
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdQuickie.death_duration + sdQuickie.post_death_ttl ) // not gone by time
		if ( this._broken )
		{
			let a,s,x,y,k;
			
			if ( this._crystal_worth > 0 )
			{
				sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.25 });


				//let value_mult = this._crystal_worth / 40;
				//sdWorld.DropShards( this.x,this.y,this.sx,this.sy, 3, value_mult, 3 );

				sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
						Math.ceil( Math.max( 5, 1 * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
						this._crystal_worth / 40,
						5
				);
			}
			else
			{
				sdSound.PlaySound({ name:'blockB4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
				for ( let i = 0; i < 6; i++ )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;

					k = Math.random();

					x = this.x + this._hitbox_x1 + Math.random() * ( this._hitbox_x2 - this._hitbox_x1 );
					y = this.y + this._hitbox_y1 + Math.random() * ( this._hitbox_y2 - this._hitbox_y1 );

					//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
					//if ( this._tier !== 2 )
					{
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter(), hue:this.GetBleedEffectHue() });
					}
					/*else
					{
						let value_mult = 4;

						sdWorld.DropShards( this.x,this.y,this.sx,this.sy, 3, value_mult, 3 );
					}*/
				}
			}
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdQuickie.init_class();

export default sdQuickie;