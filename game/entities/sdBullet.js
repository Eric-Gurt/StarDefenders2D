
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';

import sdEffect from './sdEffect.js';
import sdSound from '../sdSound.js';


class sdBullet extends sdEntity
{
	static init_class()
	{
		sdBullet.images = {
			'ball': sdWorld.CreateImageFromFile( 'ball' ),
			'rocket_proj': sdWorld.CreateImageFromFile( 'rocket_proj' ),
			'grenade': sdWorld.CreateImageFromFile( 'grenade' )
		};
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.is_grenade ? -2 : 0; }
	get hitbox_x2() { return this.is_grenade ? 2 : 0; }
	get hitbox_y1() { return this.is_grenade ? -2 : 0; }
	get hitbox_y2() { return this.is_grenade ? 2 : 0; }
	
	get substeps() // Bullets will need more
	{ return 6; } // 3 was generally fine expect for sniper
	
	get progress_until_removed()
	{ return this._rail || this._hook || this._wave; }
	
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( this._rail || this._hook || this._wave )
		return false;
	
		if ( this.color === 'transparent' )
		return false;
	
		return true;
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		this.color = '#FFFF00';
		
		//globalThis.EnforceChangeLog( this, 'color' );
		
		this._start_x = this.x;
		this._start_y = this.y;
		//sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_BLOOD });
		
		this._damage = 10;
		this.time_left = 30;
		
		this._rail = false;
		this._explosion_radius = 0;
		this.model = null; // Custom image model
		this._knock_scale = 0.05;
		this._hook = false;
		this._wave = false; // hidden & instant
		
		this._last_target = null; // what bullet did hit
		
		this.is_grenade = false;
		
		this._bg_shooter = false;
		
		this._owner = null;
	}
	onRemove()
	{
		if ( this._rail )
		sdWorld.SendEffect({ x:this._start_x, y:this._start_y, x2:this.x, y2:this.y, type:sdEffect.TYPE_BEAM, color:this.color });
	
		if ( this._explosion_radius > 0 )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:this._explosion_radius, 
			damage_scale: ( this._owner && this._owner.GetClass() === 'sdCharacter' ? this._owner._damage_mult : 1 ), 
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this._owner,
			color:this.color 
		});
	
		if ( this._hook )
		{
			if ( this._owner )
			if ( this._owner.GetClass() === 'sdCharacter' )
			{
				this._owner.hook_x = this.x;
				this._owner.hook_y = this.y;
				
				if ( this._last_target )
				{
					this._owner._hook_relative_to = this._last_target;
					this._owner._hook_relative_x = this.x - this._last_target.x;
					this._owner._hook_relative_y = this.y - this._last_target.y;
				}
				else
				{
					this._owner._hook_relative_to = null;
					this._owner._hook_relative_x = 0;
					this._owner._hook_relative_y = 0;
				}

			}
		}
	
		if ( this._damage < 0 ) // healgun
		{
			if ( this._owner )
			{
				this._owner.Damage( this._damage );
				this._damage = 0;
			}
		}
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdCharacter', 'sdVirus' ];
	}
	
	get bounce_intensity()
	{ return 0.3; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.time_left -= GSPEED;
		if ( this.time_left <= 0 )
		{
			this._hook = false;
			this.remove();
			return;
		}
		
		if ( this.is_grenade )
		{
			this.sy += sdWorld.gravity * GSPEED;

			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		else
		{
			this.x += this.sx * GSPEED;
			this.y += this.sy * GSPEED;

			if ( this.y > sdWorld.world_bounds.y2 )
			{
				if ( !this._wave )
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_WALL_HIT });
				this.remove();
				return;
			}
		}
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD || from_entity.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN )
		//if ( from_entity.GetClass() === 'sdCharacter' || 
		//	 from_entity.GetClass() === 'sdVirus' )
		{
			if ( this._owner !== from_entity )
			{
				if ( sdWorld.is_server ) // Or else fake self-knock
				if ( this._damage !== 0 )
				{
					if ( this._damage > 1 )
					if ( from_entity._last_hit_time !== sdWorld.time ) // Prevent flood from splash damage bullets
					{
						from_entity._last_hit_time = sdWorld.time;
						sdSound.PlaySound({ name:'player_hit', x:this.x, y:this.y, volume:0.5 });
					}
					
					sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });

					from_entity.Damage( from_entity.GetHitDamageMultiplier( this.x, this.y ) * this._damage, this._owner );
					from_entity.Impulse( this.sx * Math.abs( this._damage ) * this._knock_scale, 
										 this.sy * Math.abs( this._damage ) * this._knock_scale );
										 
					this._damage = 0; // for healguns
				}
				
				this._last_target = from_entity;
			
				this.remove();
				return;
			}
		}
		else
		if ( !this.is_grenade )
		//if ( from_entity.GetClass() === 'sdBlock' || from_entity.GetClass() === 'sdCrystal' ) // Including any else rigid bodies
		if ( typeof from_entity.hea !== 'undefined' || typeof from_entity._hea !== 'undefined' || ( this._bg_shooter && from_entity.GetClass() === 'sdBG' ) )
		if ( from_entity.GetClass() !== 'sdGun' || from_entity._held_by === null ) // guns can be hit only when are not held by anyone
		{
			if ( sdWorld.is_server ) // Or else fake self-knock
			if ( this._damage !== 0 )
			{
				if ( !this._wave )
				sdWorld.SendEffect({ x:this.x, y:this.y, type:from_entity.GetBleedEffect() });
			
				from_entity.Damage( this._damage, this._owner );
				
				from_entity.Impulse( this.sx * Math.abs( this._damage ) * this._knock_scale, 
									 this.sy * Math.abs( this._damage ) * this._knock_scale );
									 
				this._damage = 0; // for healguns
			}
			
			this._last_target = from_entity;
			
			this.remove();
			return;
		}
	}
	Draw( ctx, attached )
	{
		
		if ( this.model )
		{
			ctx.rotate( Math.atan2( this.sy, this.sx ) );
		
			ctx.drawImage( sdBullet.images[ this.model ], - 16, - 16, 32,32 );
		}
		else
		{
			ctx.rotate( Math.atan2( this.sy, this.sx ) + Math.PI / 2 );
		
			let vel = Math.sqrt( this.sx * this.sx + this.sy * this.sy ) * 0.7;

			ctx.fillStyle = this.color;
			ctx.fillRect( -0.5, -vel/2, 1, vel );
		}
	}
}
//sdBullet.init_class();

export default sdBullet;
	