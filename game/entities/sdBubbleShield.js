import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdQuickie from './sdQuickie.js';
import sdAsp from './sdAsp.js';
import sdCrystal from './sdCrystal.js';
import sdBG from './sdBG.js';
import sdBlock from './sdBlock.js';
import sdCube from './sdCube.js';
import sdJunk from './sdJunk.js';
import sdLost from './sdLost.js';
import sdStorage from './sdStorage.js';
import sdAsteroid from './sdAsteroid.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdWeather from './sdWeather.js';

import sdTask from './sdTask.js';
import sdFactions from './sdFactions.js';


import sdRenderer from '../client/sdRenderer.js';


class sdBubbleShield extends sdEntity
{
	static init_class()
	{
		sdBubbleShield.img_shield = sdWorld.CreateImageFromFile( 'bubble_shield' );
		sdBubbleShield.shields = [];
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdBubbleShield.TYPE_VELOX_SHIELD = 0; // Velox shields
		sdBubbleShield.TYPE_STAR_DEFENDER_SHIELD = 1; // SD shields
		sdBubbleShield.TYPE_COUNCIL_SHIELD = 2; // Council shield
	}

	get hard_collision()
	{ return false; }
	
	//IsBGEntity() // 1 for BG entities, should handle collisions separately
	//{ return 1; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		this.hea -= dmg;
		
		this._regen_timeout = 30;
		
		if ( dmg > 5 )
		sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
		
		if ( this.hea <= 0 )
		{
			if ( this.type !== sdBubbleShield.TYPE_STAR_DEFENDER_SHIELD )
			this.remove();
			else
			this.hea = Math.max( -150, this.hea );
		}
	}
	GetShieldHealth( shield_type = 0 )
	{
		if ( shield_type === sdBubbleShield.TYPE_VELOX_SHIELD )
		return 300;
		
		if ( shield_type === sdBubbleShield.TYPE_COUNCIL_SHIELD ) // When these appear, they're mostly a timer thing
		return 10000;
		
		return 200;
	}

	GetShieldDuration( shield_type = 0 )
	{
		if ( shield_type === sdBubbleShield.TYPE_VELOX_SHIELD )
		return 300;
	
		if ( shield_type === sdBubbleShield.TYPE_STAR_DEFENDER_SHIELD )
		return -1; // Must be activated / deactivated manually
		
		if ( shield_type === sdBubbleShield.TYPE_COUNCIL_SHIELD )
		return 300;
		
		return 30 * 20;
		
		 // Shield duration. -1 = infinite shield, has to be depleted
	}
	static GetShieldOfEntity( ent ) // Return entity which shields ent, used by sdCharacter for now
	{
		return ( ent._shield_ent || null );
	}
	static DidShieldProtectFromDamage( ent, dmg, initiator )
	{
		if ( dmg <= 0 )
		return false;
	
		let s = sdBubbleShield.GetShieldOfEntity( ent );
		
		if ( s && s.hea > 0 )
		{
			s.Damage( dmg, initiator );
			return true;
		}
		return false;
	}
	constructor( params )
	{
		super( params );
		
		this.type = params.type || 0; // Shield type
		this._hmax = this.GetShieldHealth( this.type );
		this.hea = this._hmax;
		this.for_ent = params.for_ent || null;
		this.sx = 0;
		this.sy = 0;
		this.xscale = params.xscale || 32; // For hitbox and sprites
		this.yscale = params.yscale || 32;
		
		
		if ( this.type === sdBubbleShield.TYPE_STAR_DEFENDER_SHIELD )
		this.hea = this.hea * 0.1; // It must regenerate first, otherwise players can spam E button to get full shields
		
		this._regen_timeout = 30; // Some shields should regenerate, like SD shield for example.
		
		this._manual_hitbox_override = params.manual_hitbox_override || false;
		
		if ( this.for_ent && !this._manual_hitbox_override )
		{
			this.xscale = Math.max( 32, 16 * Math.ceil( ( ( Math.abs( this.for_ent._hitbox_x1 ) + Math.abs( this.for_ent._hitbox_x2 ) ) / 12 ) ) );
			this.yscale = Math.max( 32, 16 * Math.ceil( ( ( Math.abs( this.for_ent._hitbox_y1 ) + Math.abs( this.for_ent._hitbox_y2 ) ) / 12 ) ) );
			//Hitboxes of shield should be slightly larger than entities due to how shield sprite is a circle
		}
		
		this._time_left = this.GetShieldDuration( this.type );
		
		//this.filter = null;
		
		sdBubbleShield.shields.push( this );
	}
	get hitbox_x1() { return ( this.hea <= 0 ) ? 0 : ( -this.xscale / 2 ); }
	get hitbox_x2() { return ( this.hea <= 0 ) ? 0 : ( this.xscale / 2 ); }
	get hitbox_y1() { return ( this.hea <= 0 ) ? 0 : ( -this.yscale / 2 ); }
	get hitbox_y2() { return ( this.hea <= 0 ) ? 0 : ( this.yscale / 2 ); }
	//Shields should be unhittable if below 0 HP, as this case can happen for Star Defender shields which regenerate over time when their health reaches 0
	
	
	/*ExtraSerialzableFieldTest( prop )
	{
		if ( prop === 'for_ent' ) return true;
		
		
		return false;
	}
	*/
	GetFilterColor()
	{
		if ( this.type === sdBubbleShield.TYPE_VELOX_SHIELD )
		return 'none';
	
		if ( this.type === sdBubbleShield.TYPE_STAR_DEFENDER_SHIELD )
		return 'hue-rotate(' + 300 + 'deg) brightness( 2 )';
	
		if ( this.type === sdBubbleShield.TYPE_COUNCIL_SHIELD )
		return 'hue-rotate(' + 180 + 'deg) brightness( 2 )';
		//return 'hue-rotate(' + 270 + 'deg) brightness( 1 ) contrast( 4 )';
	}
	static ApplyShield( for_entity = null, shield_type = 0, manual_override = false, xsize = 32, ysize = 32 )
	{
		if ( !for_entity )
		return;
	
		let shield = sdBubbleShield.GetShieldOfEntity( for_entity );
	
		if ( shield )
		{
			shield.type = shield_type;
			shield.hea = shield.GetShieldHealth( shield_type ); // Override shield value
			shield._time_left = shield.GetShieldDuration( shield_type ); // Override duration
			
			if ( manual_override )
			{
				shield.xscale = xsize;
				shield.yscale = ysize;
			}
		}
		else
		{
			let new_shield = new sdBubbleShield({ x:for_entity.x, y:for_entity.y, for_ent: for_entity, type: shield_type, manual_hitbox_override: manual_override, xscale: xsize, yscale: ysize });
			sdEntity.entities.push( new_shield );
			
			if ( typeof for_entity._shield_ent === 'undefined' )
			throw new Error( 'sdBubbleShield now requires entity it is made for to have property ._shield_ent = null;' );
			
			for_entity._shield_ent = new_shield;
		}
		
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.for_ent )
		{
			this.x = this.for_ent.x + ( this.for_ent._hitbox_x1 + this.for_ent._hitbox_x2 )/ 2;
			this.y = this.for_ent.y + ( this.for_ent._hitbox_y1 + this.for_ent._hitbox_y2 )/ 2;
			this.sx = this.for_ent.sx;
			this.sy = this.for_ent.sy;
		}
		if ( sdWorld.is_server )
		{
			if ( this.for_ent && !this.for_ent._is_being_removed )
			{
				this.x = this.for_ent.x + ( this.for_ent._hitbox_x1 + this.for_ent._hitbox_x2 )/ 2;
				this.y = this.for_ent.y + ( this.for_ent._hitbox_y1 + this.for_ent._hitbox_y2 )/ 2;
				this.sx = this.for_ent.sx;
				this.sy = this.for_ent.sy;
			}
			else
			this.remove(); // Nothing to protect? Why exist?
		
			if ( this.type === sdBubbleShield.TYPE_STAR_DEFENDER_SHIELD )
			{
				if ( this._regen_timeout <= 0 )
				{
					let mult = ( this.hea ) <= 0 ? 6 : 2; // Faster regen when shield is destroyed
					this.hea = Math.min( this.hea + ( GSPEED * mult ), this._hmax );
				}
				else
				this._regen_timeout -= GSPEED;
				
			}
		
			if ( this._time_left > 0 )
			this._time_left = Math.max( 0, this._time_left - GSPEED );
			if ( this._time_left === 0 )
			this.remove();
		}
	}
	get title()
	{
		return 'Bubble shield';
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		ctx.filter = this.GetFilterColor();
		
		ctx.globalAlpha = Math.max( 0, this.hea / this.GetShieldHealth( this.type ) );
		
		let cur_img = sdWorld.time % 3200;
		cur_img = Math.round( 15 * cur_img / 3200 );
		//let size_x = 32;
		//let size_y = 32;
	
		ctx.drawImageFilterCache( sdBubbleShield.img_shield, cur_img * 32, 0, 32, 32, - this.xscale * 1.1 / 2, - this.yscale * 1.1 / 2, this.xscale * 1.1, this.yscale * 1.1 );
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*DrawHUD( ctx, attached ) // foreground layer
	{
	}*/
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();

		/*if ( this._broken )
		sdWorld.SendEffect({ 
			x:this.x, 
			y:this.y, 
			radius:30,
			damage_scale: 0.01, // Just a decoration effect
			type:sdEffect.TYPE_EXPLOSION, 
			owner:this,
			color:'#FFFFFF' 
		});
		*/
	}
	onRemoveAsFakeEntity()
	{
		
		let i = sdBubbleShield.shields.indexOf( this );
		
		if ( i !== -1 )
		sdBubbleShield.shields.splice( i, 1 );

		if ( this.for_ent )
		{
			if ( this.for_ent._shield_ent === this )
			this.for_ent._shield_ent = null;
			else
			if ( sdWorld.is_server )
			debugger; // How? Are you making shields with ApplyShield method?
		}
	}
}
//sdBubbleShield.init_class();

export default sdBubbleShield;
