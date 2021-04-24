import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';


import sdRenderer from '../client/sdRenderer.js';


class sdUpgradeStation extends sdEntity
{
	static init_class()
	{
		sdUpgradeStation.img_us = sdWorld.CreateImageFromFile( 'upgrade_station' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -10; }
	get hitbox_x2() { return 15; }
	get hitbox_y1() { return -26; }
	get hitbox_y2() { return 16; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			this._update_version++;

			if ( this.hea <= 0 )
			{
				this.remove();
			}
			else
			{
				this._regen_timeout = 30 * 10;
			}
		}
	}
	UpgradeCharacter( character )
	{
		for ( var i = 0; i < sdShop.options.length; i++ )
		{
			if ( sdShop.options[ i ]._category === 'upgrades' )
			{
			//	console.log("Detected upgrades");
				let max_level = sdShop.upgrades[ sdShop.options[ i ].upgrade_name ].max_level;
				let cur_level = ( character._upgrade_counters[ sdShop.options[ i ].upgrade_name ] || 0 );
			//	console.log("UPGRADE:" + sdShop.options[ i ].upgrade_name + "Max level:" + max_level);
			//	console.log("PLAYER UPGRADE:" + sdShop.options[ i ].upgrade_name + " level:" + cur_level);
				if ( sdShop.options[ i ]._min_build_tool_level <= character.build_tool_level )
				{
					for ( var j = cur_level; j < max_level; j++ )
					{
						character.InstallUpgrade( sdShop.options[ i ].upgrade_name );
					}
				}
			}
		}
		this.matter -= 5000;
		this._update_version++;
		sdWorld.UpdateHashPosition( this, false );
	}

	DropBasicEquipment( character )
	{
		setTimeout(()=>{ // Just in case, unsure if needed

			let gun, gun2, gun3, gun4, gun5, gun6;
			gun = new sdGun({ x:character.x, y:character.y, class:sdGun.CLASS_PISTOL });
			gun.sx = character.sx;
			gun.sy = character.sy;
			sdEntity.entities.push( gun );

			gun2 = new sdGun({ x:character.x, y:character.y, class:sdGun.CLASS_RIFLE });
			gun2.sx = character.sx;
			gun2.sy = character.sy;
			sdEntity.entities.push( gun2 );

			gun3 = new sdGun({ x:character.x, y:character.y, class:sdGun.CLASS_SHOTGUN });
			gun3.sx = character.sx;
			gun3.sy = character.sy;
			sdEntity.entities.push( gun3 );


			gun4 = new sdGun({ x:character.x, y:character.y, class:sdGun.CLASS_SWORD });
			gun4.sx = character.sx;
			gun4.sy = character.sy;
			sdEntity.entities.push( gun4 );

			gun5 = new sdGun({ x:character.x, y:character.y, class:sdGun.CLASS_MEDIKIT });
			gun5.sx = character.sx;
			gun5.sy = character.sy;
			sdEntity.entities.push( gun5 );

			gun6 = new sdGun({ x:character.x, y:character.y, class:sdGun.CLASS_BUILD_TOOL });
			gun6.sx = character.sx;
			gun6.sy = character.sy;
			sdEntity.entities.push( gun6 );

			}, 500 );
		this._cooldown = 900; // 30 second cooldown so it does not get spammed.
		this.matter -= 500;
		this._update_version++;
		sdWorld.UpdateHashPosition( this, false );
	}
	constructor( params )
	{
		super( params );
		
		this.hmax = 5000;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		this._cooldown = 0;
		this.matter_max = 5500;
		this.matter = 100;
		this.delay = 0;
	}
	onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return 2500;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		//this._armor_protection_level = 0; // Never has protection unless full health reached
			
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		if ( this._cooldown > 0 )
		this._cooldown -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			{
				this.hea = Math.min( this.hea + GSPEED, this.hmax );
				
				//if ( sdWorld.is_server )
				//this.hea = this.hmax; // Hack
				
				this._update_version++;
			}
			//else
			//this._armor_protection_level = 4; // Once reached max HP - it can be only destroyed with big explosions
		}
		
	}
	get title()
	{
		return 'Upgrade Station';
	}
	Draw( ctx, attached )
	{
		ctx.drawImage( sdUpgradeStation.img_us, -16, -16 - 32, 32,64 );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Upgrade station ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" );
		
		
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 23, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 23, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
	}
}
//sdUpgradeStation.init_class();

export default sdUpgradeStation;
