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
	}
	get hitbox_x1() { return -14; }
	get hitbox_x2() { return 14; }
	get hitbox_y1() { return -14; }
	get hitbox_y2() { return 14; }

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
		
		this._hea -= dmg;
		
		sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	GetShieldHealth( shield_type = 0 )
	{
		if ( shield_type === sdBubbleShield.TYPE_VELOX_SHIELD )
		return 300;
		
		
		return 200;
	}

	GetShieldDuration( shield_type = 0 )
	{
		if ( shield_type === sdBubbleShield.TYPE_VELOX_SHIELD )
		return 300;
		
		
		return 30 * 20;
		
		 // Shield duration. -1 = infinite shield, has to be depleted
	}
	constructor( params )
	{
		super( params );
		
		this.type = params.type || 0; // Shield type
		this._hmax = this.GetShieldHealth( this.type );
		this._hea = this._hmax;
		this.for_ent = params.for_ent || null;
		this.sx = 0;
		this.sy = 0;
		
		this._time_left = this.GetShieldDuration( this.type );
		
		sdBubbleShield.shields.push( this );
	}
	/*ExtraSerialzableFieldTest( prop )
	{
		if ( prop === 'for_ent' ) return true;
		
		
		return false;
	}
	*/
	/*GetFilterColor()
	{
	
		if ( this.type === sdBubbleShield.TYPE_SD )
		return 'hue-rotate(' + 75 + 'deg)';
	}*/
	static ApplyShield( for_entity = null, shield_type = 0 )
	{
		if ( !for_entity )
		return;
	
		let has_shield = false;
		for( let i = 0; i < sdBubbleShield.shields.length; i++ )
		{
			let shield = sdBubbleShield.shields[ i ];
			if ( shield.for_ent === for_entity ) // Already has shield?
			{
				shield._hea = shield.GetShieldHealth( shield.type ); // Refresh shield value
				shield._time_left = shield.GetShieldDuration( shield.type ); // Refresh duration
				has_shield = true;
			}
		}
		
		if ( !has_shield )
		{
			let new_shield = new sdBubbleShield({ x:for_entity.x, y:for_entity.y, for_ent: for_entity, type: shield_type });
			sdEntity.entities.push( new_shield );
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
			this.x = this.for_ent.x;
			this.y = this.for_ent.y;
			this.sx = this.for_ent.sx;
			this.sy = this.for_ent.sy;
		}
		if ( sdWorld.is_server )
		{
			if ( this.for_ent )
			{
				this.x = this.for_ent.x;
				this.y = this.for_ent.y;
				this.sx = this.for_ent.sx;
				this.sy = this.for_ent.sy;
			}
			else
			this.remove(); // Nothing to protect? Why exist?
		
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
		
		let cur_img = sdWorld.time % 3200;
		cur_img = Math.round( 15 * cur_img / 3200 );
		let size_x = 32;
		let size_y = 32;
	
		if ( this.for_ent )
		{
			size_x = Math.max( 32, Math.ceil( 16 * ( Math.abs( this.for_ent._hitbox_x1 ) + Math.abs( this.for_ent._hitbox_x2 ) ) / 16 ) );
			size_y = Math.max( 32, Math.ceil( 16 * ( Math.abs( this.for_ent._hitbox_y1 ) + Math.abs( this.for_ent._hitbox_y2 ) ) / 16 ) );
		}
		ctx.drawImageFilterCache( sdBubbleShield.img_shield, cur_img * 32, 0, 32, 32, - size_x / 2, - size_y / 2, size_x, size_y );
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

	}
}
//sdBubbleShield.init_class();

export default sdBubbleShield;
