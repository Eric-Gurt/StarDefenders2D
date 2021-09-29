
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';


class sdAmphid extends sdEntity
{
	static init_class()
	{
		sdAmphid.img_amphid_idle1 = sdWorld.CreateImageFromFile( 'amphid_idle1' );
		sdAmphid.img_amphid_idle2 = sdWorld.CreateImageFromFile( 'amphid_idle2' );
		sdAmphid.img_amphid_jump = sdWorld.CreateImageFromFile( 'amphid_jump' );
		
		sdAmphid.death_imgs = [
			sdWorld.CreateImageFromFile( 'amphid_death3' ),
			sdWorld.CreateImageFromFile( 'amphid_death4' ),
			sdWorld.CreateImageFromFile( 'amphid_death2' ),
			sdWorld.CreateImageFromFile( 'amphid_death5' ),
			sdWorld.CreateImageFromFile( 'amphid_death1' ),
		];
		sdAmphid.death_duration = 15;
		sdAmphid.post_death_ttl = 90;
		
		sdAmphid.max_seek_range = 1000;

		sdAmphid.amphids_tot = 0; // Will bug out in case of manual creation with build tool - because onRemoveAsFakeEntity will be called instead of onRemove
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -5; }
	get hitbox_y2() { return 5; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 120;
		this._hea = this.hmax;

		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		this._last_target_change = 0;
		
		this.side = 1;

		sdAmphid.amphids_tot++;
		
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsTargetable() && character.IsVisible() )
		if ( character.hea > 0 )
		if ( this._last_target_change < sdWorld.time - 2000 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdAmphid.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;
				
				this._last_target_change = sdWorld.time;

				sdSound.PlaySound({ name:'bad_dog_hurt', x:this.x, y:this.y, volume: 1, pitch: 0.6 });
			}
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		return 'hue-rotate(-40deg)'; // Green
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;

		this._last_bite = sdWorld.time;
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 });

			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 1 ;
		}
		
		if ( this._hea < -this.hmax / 80 * 100 )
		this.remove();
	}
	
	get mass() { return 40; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	Impact( vel ) // fall damage basically
	{
		if ( vel > 13 ) // less fall damage
		{
			this.Damage( ( vel - 4 ) * 12 );
		}
	}
	CustomFilteringMethod( hit_entity )
	{
		if ( 
		hit_entity.GetClass() === 'sdBlock' ||
		hit_entity.GetClass() === 'sdCommandCentre' ||
		hit_entity.GetClass() === 'sdCrystalCombiner' ||
		hit_entity.GetClass() === 'sdDoor' ||
		hit_entity.GetClass() === 'sdMatterAmplifier' ||
		hit_entity.GetClass() === 'sdMatterContainer' ||
		hit_entity.GetClass() === 'sdUpgradeStation' )
		
		return true;
		
		return false;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );

		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdAmphid.death_duration + sdAmphid.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		{
			if ( this._current_target )
			{
				if ( this._current_target._is_being_removed || !this._current_target.IsTargetable() || !this._current_target.IsVisible() || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdAmphid.max_seek_range + 32 )
				this._current_target = null;
				else
				{
					
					if ( this.death_anim === 0 )
					if ( !in_water && this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
					{
						this._last_jump = sdWorld.time;
					}
					else
					{
						this.side = ( this._current_target.x > this.x ) ? 1 : -1;
					}
					if ( this._last_jump < sdWorld.time - ( in_water ? 500 : 1000 ) )
					//if ( this._last_stand_on )
					{
						this._last_jump = sdWorld.time;
						let dx = ( this._current_target.x - this.x ) * 0.1;
						let dy = ( this._current_target.y - this.y ) * 0.1;
					
						dy -= Math.abs( dx ) * 0.25;
					
						let di = sdWorld.Dist2D_Vector( dx, dy );
						if ( di > 12 || in_water )
						{
							dx /= di;
							dy /= di;
							
							dx *= 12;
							dy *= in_water ? 6 : 12;
						}
						dx += ( 0.2 * this.side );

						this.sx = dx;
						this.sy = dy;

					
						//this._last_stand_on = null; // wait for next collision
					}
				}
			}
		}

		sdWorld.last_hit_entity = null;
		
		//let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );

		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );

			if ( this._hea > 0 )
			if ( this._last_jump < sdWorld.time - 400 )
			this.sy -= sdWorld.gravity * GSPEED * 2;
		}

		if ( this.CanMoveWithoutOverlap( this.x, this.y, -3, this.CustomFilteringMethod ) )
		this.sy += sdWorld.gravity * GSPEED;
		

		// Sometimes amphids won't stick to blocks while jumping against them, I noticed some other mobs do this but it's less significant for them due to their higher jump rates
		if ( this.sx < 0.1 || this.sy < 0.1 )
		if ( this._last_jump < sdWorld.time - 20 )
		if ( !this.CanMoveWithoutOverlap( this.x, this.y, -3, this.CustomFilteringMethod ) ) 
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.5, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.5, GSPEED );
		}
		
		this.ApplyVelocityAndCollisions( GSPEED, 5, true );
		
		if ( this.death_anim === 0 )
		if ( this._current_target )
		if ( this._last_bite < sdWorld.time - 1000 )
		if ( sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) < 25 )
		if ( Math.abs( this.sx ) > 0.1 || Math.abs( this.sy ) > 0.1 )
		{
			this._last_bite = sdWorld.time;

			let nears = sdWorld.GetAnythingNear( this.x, this.y, 25 );
			let from_entity;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
					
				let xx = from_entity.x + ( from_entity._hitbox_x1 + from_entity._hitbox_x2 ) / 2;
				let yy = from_entity.y + ( from_entity._hitbox_y1 + from_entity._hitbox_y2 ) / 2;
				
				if ( from_entity.is( sdCharacter ) || from_entity === this._current_target )
				if ( from_entity.IsTargetable() )
				if ( sdWorld.CheckLineOfSight( this.x, this.y, from_entity.x, from_entity.y, null, null, sdCom.com_creature_attack_unignored_classes ) )
				{
					from_entity.Damage( 50, this );
					
					this._hea = Math.min( this.hmax, this._hea + 15 );

					sdWorld.SendEffect({ x:xx, y:yy, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					break;
				}
			}
		}
		
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Amphid" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdAmphid.death_duration + sdAmphid.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdAmphid.death_imgs.length - 1, ~~( ( this.death_anim / sdAmphid.death_duration ) * sdAmphid.death_imgs.length ) );
			ctx.drawImageFilterCache( sdAmphid.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		{
			if ( Math.abs( this.sx ) > 2 || Math.abs( this.sy ) > 2 )
			ctx.drawImageFilterCache( sdAmphid.img_amphid_jump, - 16, - 16, 32,32 );
			else
			ctx.drawImageFilterCache( ( sdWorld.time % 1600 < 800 ) ? sdAmphid.img_amphid_idle1 : sdAmphid.img_amphid_idle2, - 16, - 16, 32,32 );

		}
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		sdAmphid.amphids_tot--;

		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdAmphid.death_duration + sdAmphid.post_death_ttl ) // not gone by time
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
//sdAmphid.init_class();

export default sdAmphid;
