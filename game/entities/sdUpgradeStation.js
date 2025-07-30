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
		sdUpgradeStation.img_us = sdWorld.CreateImageFromFile( 'upgrade_station_disabled' ); // Re-skin by Flora
		sdUpgradeStation.img_hologram = sdWorld.CreateImageFromFile( 'upgrade_station_hologram' ); // Re-skin by Flora

		sdUpgradeStation.ignored_classes_arr = [ 'sdGun', 'sdBullet', 'sdCharacter' ];
		
		sdUpgradeStation.MAX_STATION_LEVEL = 10;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -10; }
	get hitbox_x2() { return 10; }
	get hitbox_y1() { return -2; }
	get hitbox_y2() { return 16; }
	
	get hard_collision()
	{ return true; }
	
	// Because of matter steal
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	IsVehicle()
	{
		return true;
	}
	AddDriver( c )
	{
		//if ( !sdWorld.is_server )
		return;
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this.hea > 0 )
		{
			this.hea -= dmg;

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
			if ( sdShop.options[ i ]._category === 'Upgrades' )
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
		sdWorld.UpdateHashPosition( this, false );
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdUpgradeStation.ignored_classes_arr;
	}
	UpgradeStation()
	{
		//if ( character.build_tool_level > this.level )
		{
			this.level++;
			this.hmax = ( 5000 * 2 ) + ( 500 * this.level );
			this.matter_max = 5000 + ( 500 * this.level );
			//this.matter -= 5000;
			this.WakeUpMatterSources();
			sdWorld.UpdateHashPosition( this, false );
			
			sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });
		}
	}
	DropBasicEquipment( character )
	{
		setTimeout(()=> // Just in case, unsure if needed
		{
			let items = [ ];
			
			switch ( this.level )
			{
				case 1:
				items = [ sdGun.CLASS_PISTOL, sdGun.CLASS_RIFLE, sdGun.CLASS_SHOTGUN, sdGun.CLASS_SWORD, sdGun.CLASS_MEDIKIT, sdGun.CLASS_BUILD_TOOL ];
				break;
				case 2:
				items = [ sdGun.CLASS_LASER_PISTOL, sdGun.CLASS_LMG, sdGun.CLASS_SHOTGUN_MK2, sdGun.CLASS_SABER, sdGun.CLASS_MEDIKIT, sdGun.CLASS_BUILD_TOOL ];
				break;
				default: // Level 3 or higher
				items = [ sdGun.CLASS_SMG, sdGun.CLASS_LMG, sdGun.CLASS_SHOTGUN_MK2, sdGun.CLASS_SABER, sdGun.CLASS_MEDIKIT, sdGun.CLASS_BUILD_TOOL ];
				break;
			}
			
			for ( let i = 0; i < 6; i++ )
			{
				let gun = new sdGun({ x:character.x, y:character.y, class:items[ i ] });
				sdEntity.entities.push( gun );
			}
		}, 500 );
		this.cooldown = 900; // 30 second cooldown so it does not get spammed.
		this.matter -= 500;
		this.WakeUpMatterSources();
		sdWorld.UpdateHashPosition( this, false );
	}
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 5000 * 2;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		this.cooldown = 0;
		this.matter_max = 5500;
		this.matter = 100;
		this.level = 1;
		
		this.armor_to_build = sdGun.CLASS_ARMOR_STARTER; // Standard armor defined at start, so players can know it can spawn armor now.
		this._armor_cooldown = 0; // Cooldown for armor spawning
		
		this._armor_protection_level = 0;

		// client-side
		this._hologram = true;
		this._hologram_timer = 0;
	}
	get mass()
	{
		return 60;
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
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( this._hologram_timer > 0 )
			this._hologram_timer -= GSPEED;
		}

		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;

		if ( this.cooldown > 0 )
		this.cooldown -= GSPEED;
	
		if ( this._armor_cooldown > 0 )
		this._armor_cooldown -= GSPEED;

		else
		{
			if ( this.hea < this.hmax )
			{
				this.hea = Math.min( this.hea + GSPEED, this.hmax );
				
				//if ( sdWorld.is_server )
				//this.hea = this.hmax; // Hack
			}
			if ( this.level > 1 )
			this._armor_protection_level = 4; // If upgraded at least once - it can be only destroyed with big explosions
		}

		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		if ( this._hologram_timer <= 0 ) // A bit messy perhaps?
		{
			let ents = sdWorld.GetAnythingNear( this.x, this.y, 32 );
	
			for ( let i = 0; i < ents.length; i++ )
			{
				let e = ents[ i ];
				{
					if ( e.IsPlayerClass() ) 
					{
						this._hologram = true;
						this._hologram_timer = 10; // Can be low since it does not have to be server-sided

						break;
					}
					this._hologram = false;
				}
			}
		}
		this.sy += sdWorld.gravity * GSPEED;
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		{
			if ( !from_entity._is_being_removed )
			{
				if ( from_entity.is( sdGun ) )
				{
					if ( from_entity.class === sdGun.CLASS_UPGRADE_STATION_CHIPSET )
					if ( this.level < sdUpgradeStation.MAX_STATION_LEVEL )
					{
						this.UpgradeStation();
						
						//sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
						
						from_entity.remove();
					}
					
					/*if ( from_entity.class === sdGun.CLASS_LVL1_LIGHT_ARMOR || from_entity.class === sdGun.CLASS_LVL1_MEDIUM_ARMOR || from_entity.class === sdGun.CLASS_LVL1_HEAVY_ARMOR ||
						 from_entity.class === sdGun.CLASS_LVL2_LIGHT_ARMOR || from_entity.class === sdGun.CLASS_LVL2_MEDIUM_ARMOR || from_entity.class === sdGun.CLASS_LVL2_HEAVY_ARMOR ||
						 from_entity.class === sdGun.CLASS_LVL3_LIGHT_ARMOR || from_entity.class === sdGun.CLASS_LVL3_MEDIUM_ARMOR || from_entity.class === sdGun.CLASS_LVL3_HEAVY_ARMOR ||
						 from_entity.class === sdGun.CLASS_ARMOR_STARTER ) */
						 
					// Maybe I should just add "is_armor:true" inside sdGunClass for those - Booraz
						 
					if ( sdGun.classes[ from_entity.class ].armor_properties ) // Better?
					{
						if ( sdGun.classes[ from_entity.class ].spawnable !== false ) // Make sure players can build it
						{
							this.armor_to_build = from_entity.class;
							from_entity.remove();
							sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
						}
					}
				}
				// Armor auto-building
				if ( from_entity.is( sdCharacter ) && this.armor_to_build !== -1 && this._armor_cooldown <= 0 )
				{
					if ( this.matter >= sdGun.classes[ this.armor_to_build ].matter_cost ) // Enough matter?
					{
						if ( from_entity.ApplyArmor( sdGun.classes[ this.armor_to_build ].armor_properties ) ) // If armor is applied
						{
							this.matter -= sdGun.classes[ this.armor_to_build ].matter_cost; // Reduce matter as the equalivent of building it
							this._armor_cooldown = 30; // 1 second cooldown
							sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });
						}
					}
				}
			}
		}
	}
	get title()
	{
		return 'Upgrade Station';
	}
	Draw( ctx, attached )
	{
		if ( this._hologram )
		{
			ctx.blend_mode = THREE.AdditiveBlending;
			ctx.globalAlpha = Math.sin( ( sdWorld.time % 1000 ) / 1000 * Math.PI );
			if ( this.cooldown > 0 )
			ctx.filter = 'hue-rotate(270deg)';
		
			ctx.drawImageFilterCache( sdUpgradeStation.img_hologram, -16, -16 - 31, 32,64 );

			ctx.blend_mode = THREE.NormalBlending;
			ctx.globalAlpha = 1;
			ctx.filter = 'none';
		}
		ctx.drawImageFilterCache( sdUpgradeStation.img_us, -16, -16 - 31, 32,64 );

		if ( this.armor_to_build !== -1 )
		{
			ctx.drawImageFilterCache( sdGun.classes[ this.armor_to_build ].image, - 16, -8, 32,32 );
		}
		
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Upgrade station ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )", 0, -10 );

		sdEntity.Tooltip( ctx, "Level " + this.level, 0, -3, '#66ff66' );
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 23, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 23, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
		//this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'UPGRADE_GET_EQUIP' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
					if ( this.cooldown <= 0 )
					{
						if ( this.matter >= 500 )
						this.DropBasicEquipment( executer_socket.character );
						else
						executer_socket.SDServiceMessage( 'Upgrade station needs at least 500 matter!' );
					}
					else
					executer_socket.SDServiceMessage( 'Upgrade station is generating new weapons, please wait ' + ~~( this.cooldown / 30 ) + ' seconds.' );
				}
				else
				{
					executer_socket.SDServiceMessage( 'Upgrade station is too far' );
					return;
				}
			}
			if ( command_name === 'UPGRADE_CHAR' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
					if ( this.matter >= 5000 )
					this.UpgradeCharacter( executer_socket.character );
					else
					executer_socket.SDServiceMessage( 'Upgrade station needs at least 5000 matter!' );
				}
				else
				{
					executer_socket.SDServiceMessage( 'Upgrade station is too far' );
					return;
				}
			}
			if ( command_name === 'REMOVE_AUTOBUILD' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
				{
					if ( this.armor_to_build !== -1 )
					this.armor_to_build = -1;
					else
					executer_socket.SDServiceMessage( 'Auto-build option already removed' );
				}
				else
				{
					executer_socket.SDServiceMessage( 'Upgrade station is too far' );
					return;
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		{
			this.AddContextOption( 'Upgrade character (5000 matter cost)', 'UPGRADE_CHAR', [] );
		
			//if ( exectuter_character._god )
			this.AddContextOption( 'Get basic equipment (500 matter cost)', 'UPGRADE_GET_EQUIP', [] );
		
			if ( this.armor_to_build !== -1 )
			this.AddContextOption( 'Remove current auto-build armor (' + sdGun.classes[ this.armor_to_build ].title +')' , 'REMOVE_AUTOBUILD', [] );
		}
	}
}
//sdUpgradeStation.init_class();

export default sdUpgradeStation;
