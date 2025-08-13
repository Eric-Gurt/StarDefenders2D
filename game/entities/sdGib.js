/*

	Warning: Carrier needs to call .UpdateHeldPosition() on carried sdGibs or else they can appear at old positions logically, which will mean removal when world bounds move. Carried guns won't update their positions because they will hibernate once hidden

*/
/* global Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdStorage from './sdStorage.js';
import sdBlock from './sdBlock.js';
import sdCom from './sdCom.js';
import sdBG from './sdBG.js';
import sdArea from './sdArea.js';
import sdWater from './sdWater.js';

import sdGibClass from './sdGibClass.js';

import sdShop from '../client/sdShop.js';

// Gibs
class sdGib extends sdEntity
{
	static init_class()
	{
		if ( !sdEffect.initiated )
		sdEffect.init_class();
		
		
		sdGib.img_present = sdWorld.CreateImageFromFile( 'present' );
		
		sdGib.disowned_gibs_ttl = 30 * 10; // 10 seconds
		
		//sdGib.default_projectile_velocity = 20; // 16
		
		sdGib.tilt_scale = 200;
		
		
		
		sdGib.classes = [];
		
		sdGibClass.init_class(); // Will populate sdGib.classes array

		sdGib.as_class_list = [ 'sdGib' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this._hx1 * ( this.s / 100 ); }
	get hitbox_x2() { return this._hx2 * ( this.s / 100 ); }
	get hitbox_y1() { return this._hy1 * ( this.s / 100 ); }
	get hitbox_y2() { return this._hy2 * ( this.s / 100 ); }

	get bounce_intensity()
	{
		//return 0.2 + Math.random() * 0.2;
	
		return 0;
	}
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 3 )
		{
			if ( !sdWorld.is_server )
			{
				if ( sdWorld.time > this._last_hit_sound )
				if ( this.GetBleedEffect() === sdEffect.TYPE_WALL_HIT )
				{
					sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.3, volume: Math.min( 0.25, 0.1 * vel ), _server_allowed:true });
				}
				
				this._last_hit_sound = sdWorld.time + 100;
			}
		}
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdGib.as_class_list;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this._iframes > 0 )
		return;
	
		dmg /= ( this.s / 100 ); // White and yellow cube case
		this._hea -= dmg;
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}

	get mass() 
	{ 
		return ( this.s / 100 ) * ( sdGib.classes[ this.class ].mass || 30 ); 
	}
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.s = params.s || 100; // Scale, same as characters (used for cube gibs for now)
		//hitbox values
		this._hx1 = -2;
		this._hx2 = 2;
		this._hy1 = -2;
		this._hy2 = 2;
		//
		//this._remove_stack_trace = null;
		
		this._last_hit_sound = 0;
		
		this.tilt = 0;

		this.side = params.side || 1;

		this.image = params.image || 0; // For spritesheet functionality / sprite index inside sheet
		
		//this.dangerous = false; // Maybe larger gibs can damage players on impact? Although feels like gibs with enough mass already do that.
		//this._dangerous_from = null;

		this._ignore_collisions_with = null;
		
		//this.extra = ( params.extra === undefined ) ? 0 : params.extra; // shard value will be here

		this.sd_filter = ( params.sd_filter === undefined ) ? null : params.sd_filter;
		this.class = params.class || 0;
		this._sound = '';
		this._sound_pitch = 1;
		this._hea = 100;
		this._iframes = 5; // Prevents damage while larger than 0

		this._effect = true; // Entity break effect?

		this._blood_type = 0;

		this.filter = ( params.filter === undefined ) ? null : params.filter;
		
		this._can_infect_water = true; // Can do this just once, with some low probability too. Infected water can spawn sdShark


		this.blood_filter = ( params.blood_filter === undefined ) ? '' : params.blood_filter;
		
		this.ttl = params.ttl || sdGib.disowned_gibs_ttl;
		
		let has_class = sdGib.classes[ this.class ];
		
		if ( has_class )
		{
			this._hx1 = sdGib.classes[ this.class ].hitbox_x1;
			this._hx2 = sdGib.classes[ this.class ].hitbox_x2;
			this._hy1 = sdGib.classes[ this.class ].hitbox_y1;
			this._hy2 = sdGib.classes[ this.class ].hitbox_y2;
			this._hea = sdGib.classes[ this.class ].health;
			this._blood_type = sdGib.classes[ this.class ].blood;
			this._effect = sdGib.classes[ this.class ].effect_when_removed || true;
		}
		this.SetMethod( 'CollisionFiltering', this.CollisionFiltering ); // Here it used for "this" binding so method can be passed to collision logic
	}
	
	CollisionFiltering( from_entity )
	{
		if ( from_entity._is_bg_entity !== this._is_bg_entity || !from_entity._hard_collision )
		return false;
		
		return ( this._ignore_collisions_with !== from_entity );
	}
	onRemove()
	{
		if ( this._broken && this._effect === true )
		{
			if ( this._blood_type === 0 )
			sdWorld.BasicEntityBreakEffect( this, 5, 3, 0.75, 0.75 );
		}

	}
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		//if ( sdWorld.is_server )
		//this._remove_stack_trace = getStackTrace();
	}
	
	get hard_collision() // For world geometry where players can walk
	{ return false; }
	

	GetBleedEffect()
	{
		if ( this._blood_type === 0 )
		return sdEffect.TYPE_WALL_HIT;

		if ( this._blood_type === 1 )
		return sdEffect.TYPE_BLOOD_GREEN;


		if ( this._blood_type === 2 )
		return sdEffect.TYPE_BLOOD;
	}
	/*GetBleedEffectHue()
	{
		return this.hue;
	}*/

	GetBleedEffectFilter()
	{
		return this.blood_filter;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		let in_water = sdWater.all_swimmers.has( this );

		if ( sdWorld.is_server )
		{
			//this.sy += sdWorld.gravity * GSPEED;
			

			if ( this._iframes > 0 )
			this._iframes -= GSPEED;

			this.ttl -= GSPEED;
			if ( this.ttl <= 0 )
			{
				this.remove();
				this._broken = false;
				return;
			}
			
		}

		{
			//if ( sdWorld.last_hit_entity )
			//this.tilt += -Math.sin( this.tilt / sdGib.tilt_scale * 2 ) * 0.4 * sdGib.tilt_scale;
			//else
			this.tilt += this.sx * 20 * GSPEED;
		}

		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}

		this.sy += sdWorld.gravity * GSPEED;

		if ( this._ignore_collisions_with === null )
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1 );
		else
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, this.CollisionFiltering );

		/*if ( sdWorld.is_server )
		if ( allow_hibernation_due_to_logic )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED ); // Note: Such hibernation will casue weapon to logically appear behind carrier. It means that carrier now should handle position logic
		}*/
	}
	get title()
	{
		return 'Gib';
	}
	Draw( ctx, attached )
	{
		let image;
		let has_class = sdGib.classes[ this.class ];
		
		if ( has_class )
		{
			let offset_x = ( has_class.image_offset_x || 0 );
			let offset_y = ( has_class.image_offset_y || 0 );
			
			ctx.translate( offset_x, offset_y );
			
			ctx.apply_shading = ( has_class.apply_shading === undefined ) ? true : has_class.apply_shading;
		}


		{
			if ( has_class )
			{
				image = has_class.image;
				ctx.rotate( this.tilt / sdGib.tilt_scale );

				ctx.scale( this.side * ( this.s / 100 ), 1 * ( this.s / 100 ) );

				if ( this.ttl >= 0 && this.ttl < 30 )
				ctx.globalAlpha = 0.5;

				if ( this.sd_filter )
				{
					ctx.sd_filter = this.sd_filter;
				}

				if ( this.filter )
				{
					ctx.filter = this.filter;
				}
			}

			/*if ( has_class.image_frames )
			{
				let frame = Math.floor( ( sdWorld.time + this._net_id * 2154 ) / has_class.image_duration ) % has_class.image_frames;
				ctx.drawImageFilterCache( image, 0 + frame * 32,0,32,32,  - 16, - 16, 32,32 );
			}
			else*/
			{
				ctx.drawImageFilterCache( image,  0 + this.image * 32,0,32,32,  - 16, - 16, 32,32 );
			}
			
			ctx.filter = 'none';
			ctx.sd_filter = null;
			
			
			ctx.globalAlpha = 1;
		}
	}
	MeasureMatterCost()
	{
		return 30;
	}
}
//sdGib.init_class();

export default sdGib;
