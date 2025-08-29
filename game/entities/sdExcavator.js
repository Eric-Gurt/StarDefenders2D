import sdShop from '../client/sdShop.js';
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdTask from './sdTask.js';
import sdBullet from './sdBullet.js';
import sdWeather from './sdWeather.js';
import sdGib from './sdGib.js';
import sdGun from './sdGun.js';
import sdLost from './sdLost.js';

import sdRenderer from '../client/sdRenderer.js';

/*
	Excavator is an entity which digs below it as long as it's powered.
	Occasionally the Mothership will send an excavator to the planet
	and SD's will need to start it up. The excavator only has power to run for 3 minutes
	but players can power it up with Cube shards and Erthal energy cells so it can last longer (1 minute per shard).
	They can also repair it with metal shards should it lose health.
	
	The excavator eats crystals, gains matter like green BSU does.
	After it's excavation process is done - it spits out an unique crystal which always glows white.
	The matter of that crystal depends on how much crystals/matter the excavator ate, up to it's matter_max value.
*/


class sdExcavator extends sdEntity
{
	static init_class()
	{
		sdExcavator.img_excavator = sdWorld.CreateImageFromFile( 'sdExcavator' );

		
		//sdExcavator.panels = []; // Antenna array, will be used so LRTPs can teleport to nearest one
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -15; }
	get hitbox_x2() { return 15; }
	get hitbox_y1() { return -18; }
	get hitbox_y2() { return 16; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );

		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			//this._update_version++;

			if ( this.hea <= 0 )
			{
				this.remove();
			}
		}
	}
	constructor( params )
	{
		super( params );

		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 5000;
		this.hea = this.hmax;
		this._check_for_players = 30;
		this._next_dig_in = 30;
		this.activated = false; // Startup of the excavation process.
		
		this.image = 0; // Which sprite should it display?
		
		this._ai_team = 0;
		
		
		//this._event_to_spawn = sdWeather.only_instance._potential_invasion_events[ Math.floor( Math.random() * sdWeather.only_instance._potential_invasion_events.length ) ] || -1; // Random event which are usually invasions is selected.
		
		this.crystal_matter = 0;
		this.crystal_matter_max = 5120 * 8; // 40k is max value the excavator can digest and convert
		
		this.time_left = 30 * 60 * 2; // Default excavation time is 2 minutes
		
		
		//sdExcavator.panels.push( this );
		//this._regen_mult = 1;
	}
	

	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdGun.as_class_list;
	}

	/*onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
	}*/

	get mass() { return 180; } // Recommended to move with vehicles if blocked by something
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );

		if ( !sdWorld.is_server )
		return;
		
		if ( this._check_for_players > 0 )
		{
			this._check_for_players -= GSPEED;
		}
		else
		{
			this._check_for_players = 150; // So it doesn't spam GetAnythingNear
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			if ( sdWorld.sockets[ i ].character )
			{
				let desc = 'We placed an excavator nearby and we need you to start it up.';
				let exc_title = 'Power up the excavator';
				if ( this.activated )
				{
					desc = 'Keep the excavator powered so the mining potential can be maximized. You can power it with Cube shards and Erthal energy cells, while you can use metal shards to repair it.';
					exc_title = 'Keep the excavator powered';
				}
				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'PROTECT-'+this._net_id, 
					executer: sdWorld.sockets[ i ].character,
					target: this,
					mission: sdTask.MISSION_TRACK_ENTITY,				
					title: exc_title,
					description: desc,
				});
			}
			if ( !this.activated )
			{
				let players = sdWorld.GetAnythingNear( this.x, this.y, 192, null, [ 'sdCharacter', 'sdPlayerDrone' ] );
				for ( let i = 0; i < players.length; i++ )
				{
					if ( players[ i ].IsPlayerClass() && !players[ i ]._ai && players[ i ]._ai_team === 0  && players[ i ].hea > 0 )
					if ( players[ i ]._socket !== null )
					{
						if ( sdWorld.CheckLineOfSight( this.x, this.y - 16, players[ i ].x, players[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) ) // Needs line of sight with players, otherwise it doesn't work
						{
							this.activated = true;
							sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:0.5, pitch:4 });
						}
					}
				}
			}
		}
		if ( this.activated )
		{
			this.time_left -= GSPEED;
			
			if ( this.time_left <= 0 || this.crystal_matter === this.crystal_matter_max ) // Finished excavation?
			{
				// Drop the Excavator Quartz which has the matter value of dug up crystals
				let crystal = new sdCrystal({ x: this.x, y: this.y, type: sdCrystal.TYPE_EXCAVATOR_QUARTZ });
				crystal.matter_max = Math.max( 40, this.crystal_matter );
				crystal.matter = this.crystal_matter;
				
				sdEntity.entities.push( crystal );
				
				// Make the excavator disappear
				this.remove();
				//this._broken = false;
			}
			
			this.image += GSPEED;
			
			if ( this.image > 16 )
			this.image -= 16;
		
			this._next_dig_in -= GSPEED;
			
			if ( this._next_dig_in <= 0 ) // Mining
			{
				this._next_dig_in = 9;
				
				if ( this.sy < 0.1 && this.sy > -0.1 )
				this.sy += 0.1; // Hopefully prevents it from freezing in place in air
				
				
				let bullet_obj = new sdBullet({ x: this.x - 10, y: this.y + 8, time_left: 1 }); // Left

				bullet_obj._owner = this;
				bullet_obj.sx = 0;
				bullet_obj.sy = 0.5;
				bullet_obj.color = 'transparent';
				bullet_obj._damage = 100;
				bullet_obj._dirt_mult = 3;
				bullet_obj._rail = true;
				
				bullet_obj._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
				{
					if ( target_entity.is( sdCrystal ) )
					{
						if ( target_entity.is_big )
						target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
						else
						{
							bullet._damage = bullet._damage / 4; // Less damage for smaller crystals
							if ( bullet._owner )
							bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
						}
					}
				};
				
				sdEntity.entities.push( bullet_obj );
				
				let bullet_obj2 = new sdBullet({ x: this.x + 10, y: this.y + 8, time_left: 1 }); // Right

				bullet_obj2._owner = this;
				bullet_obj2.sx = 0;
				bullet_obj2.sy = 0.5;
				bullet_obj2.color = 'transparent';
				bullet_obj2._damage = 100;
				bullet_obj2._dirt_mult = 3;
				bullet_obj2._rail = true;
				
				bullet_obj2._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
				{
					if ( target_entity.is( sdCrystal ) )
					{
						bullet._damage = bullet._damage / 4;
						if ( target_entity.is_big )
						target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
						else
						if ( bullet._owner )
						bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
					}
				};
				
				sdEntity.entities.push( bullet_obj2 );
				
				let bullet_obj3 = new sdBullet({ x: this.x, y: this.y + 8, time_left: 1 }); // Center

				bullet_obj3._owner = this;
				bullet_obj3.sx = 0;
				bullet_obj3.sy = 0.5;
				bullet_obj3.color = 'transparent';
				bullet_obj3._damage = 100;
				bullet_obj3._dirt_mult = 3;
				bullet_obj3._rail = true;
				
				bullet_obj3._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
				{
					if ( target_entity.is( sdCrystal ) )
					{
						bullet._damage = bullet._damage / 4;
						if ( target_entity.is_big )
						target_entity._being_sawed_time = sdWorld.time; // Allow big crystals to destroy into small clusters
						else
						if ( bullet._owner )
						bullet._owner.onMovementInRange( target_entity ); // Small crystals get into the excavator if touched by those
					}
				};
				
				sdEntity.entities.push( bullet_obj3 );
			}
		}
	}
	onMovementInRange( from_entity )
	{
		if ( this.activated )
		{
			if ( from_entity.is( sdCrystal ) )
			{
				if ( from_entity.y > this.y + this._hitbox_y2 )
				if ( from_entity.held_by === null && from_entity.type !== 2 && from_entity.type !== 6 ) // Prevent crystals which are stored in a crate
				if ( from_entity._damagable_in > sdWorld.time - 5000 ) // Grace period, disallow non freshly mined crystals to enter excavator
				{
					if ( !from_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2, pitch:2 });
				
						let matter_to_feed = from_entity.matter_max * ( from_entity.matter_regen / 100 );
						this.crystal_matter = Math.min( this.crystal_matter_max, this.crystal_matter + matter_to_feed ); // Drain the crystal for it's max value and destroy it
						//this._update_version++;
						from_entity.remove();
					}
				}	
			}
			
			if ( from_entity.is( sdLost ) || from_entity.is( sdGib ) )
			from_entity.remove();
		}
		
		if ( from_entity.is( sdGun ) )
		{
			if ( from_entity.class === sdGun.CLASS_CUBE_SHARD || from_entity.class === sdGun.CLASS_ERTHAL_ENERGY_CELL )
			if ( !from_entity._is_being_removed )
			{
				this.time_left += 30 * 60; // Extend by 1 minute
				from_entity.remove();
			}
			if ( from_entity.class === sdGun.CLASS_METAL_SHARD )
			if ( !from_entity._is_being_removed )
			{
				this.hea = Math.min( this.hea + this.hmax * 0.35, this.hmax );
				from_entity.remove();
			}
		}
	}
	get title()
	{
		return 'Excavator';
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		
		xx = Math.min( 3, Math.floor( this.image / 4 ) );
		ctx.drawImageFilterCache( sdExcavator.img_excavator, xx * 64, 0, 64, 64, -32, -32, 64, 64 );
		
		xx = 4;
		ctx.globalAlpha = Math.min( 1, 1.25 * this.crystal_matter / this.crystal_matter_max )
		ctx.drawImageFilterCache( sdExcavator.img_excavator, xx * 64, 0, 64, 64, -32, -32, 64, 64 );

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.activated )
		sdEntity.TooltipUntranslated( ctx, T("Excavator")+" (" + ~~( this.time_left / ( 30 * 60 ) ) + " minutes, "+  ~~ ~~( this.time_left % ( 30 * 60 ) / 30 ) + " seconds)" + " ( " + sdWorld.RoundedThousandsSpaces(this.crystal_matter) + " / " + sdWorld.RoundedThousandsSpaces(this.crystal_matter_max) + " )", 0, -10 );
		else
		sdEntity.TooltipUntranslated( ctx, T("Excavator (disabled)") + " ( " + sdWorld.RoundedThousandsSpaces(this.crystal_matter) + " / " + sdWorld.RoundedThousandsSpaces(this.crystal_matter_max) + " )", 0, -10 );
		
		let w = 40;
		{
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 32, w, 3 );

			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - 32, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		}
	}
	
	/*onRemoveAsFakeEntity()
	{
		let i = sdExcavator.panels.indexOf( this );
		
		if ( i !== -1 )
		sdExcavator.panels.splice( i, 1 );
	}*/
	
	onRemove() // Class-specific, if needed
	{
		//this.onRemoveAsFakeEntity();
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	}
}
//sdExcavator.init_class();

export default sdExcavator;
