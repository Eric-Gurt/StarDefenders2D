import sdShop from '../client/sdShop.js';
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdGun from './sdGun.js';
import sdTask from './sdTask.js';
import sdFactions from './sdFactions.js';
import sdWeather from './sdWeather.js';
import sdMothershipContainer from './sdMothershipContainer.js';


import sdRenderer from '../client/sdRenderer.js';


class sdSolarMatterDistributor extends sdEntity
{
	static init_class()
	{
		sdSolarMatterDistributor.img_distributor = sdWorld.CreateImageFromFile( 'sdSolarMatterDistributor' );

		
		//sdSolarMatterDistributor.panels = []; // Antenna array, will be used so LRTPs can teleport to nearest one
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -14; }
	get hitbox_x2() { return 14; }
	get hitbox_y1() { return -16; }
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
			/*else
			{
				this._regen_timeout = 30 * 10;
			}*/
		}
	}
	constructor( params )
	{
		super( params );

		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 6000;
		this.hea = this.hmax;
		this._regen_timeout = 30;
		this._cooldown = 0;
		//this.has_anticrystal = false;
		this.has_players_nearby = false; // Once a second it checks if any players are close to it so it can progress. Incentivizes defending by standing near it. Also works as "activation"
		this._spawn_timer = 30;
		this._enemies_spawned = 0; 
		
		this._ai_team = 0;
		
		this.progress = 0; // Task progress - needed for "Protect" task types
		
		this._spawned_ai = false; // Spawn SD AI
		
		this._event_to_spawn = sdWeather.only_instance ? sdWeather.only_instance._potential_invasion_events[ Math.floor( Math.random() * sdWeather.only_instance._potential_invasion_events.length ) ] || -1 : -1; // Random event which are usually invasions is selected. // UPD: sdWeather.only_instance can be missing on client-side
		
		this.matter_max = 4000;
		this.matter = 100;
		
		this._ai_told_player = false; // Intro message from SD soldier to a player
		
		this._next_trace_rethink = 0;
		this._sun_reaches = false;
		
		this._multiplier = 32; // As strong as 4 T4 solar panels
		
		this._time_left = 30 * 60 * 60; // 1 hour from activation, it will teleport away
		
		
		//sdSolarMatterDistributor.panels.push( this );
		//this._regen_mult = 1;
	}
	

	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdGun', 'sdBullet', 'sdCharacter' ];
	}*/

	/*onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
	}*/

	get mass() { return 180; } // Recommended to move with vehicles if blocked by something
	/*MeasureMatterCost()
	{
		//return 0; // Hack
		
		return 2000;
	}
	*/
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );

		if ( !sdWorld.is_server )
		return;

		if ( this.progress >= 100 )
		{
			let sun_intensity = 1;

			sun_intensity *= sdWeather.only_instance.GetSunIntensity();

			if ( sdWorld.time > this._next_trace_rethink )
			{
				this._sun_reaches = sdWeather.only_instance.TraceDamagePossibleHere( this.x, this.y + this.hitbox_y1, Infinity, true );

				this._next_trace_rethink = sdWorld.time + 5000 + Math.random() * 10000;
				if ( sdMothershipContainer.containers.length > 0 ) // A Mothership container needs filling?
				for ( let i = 0; i < sdMothershipContainer.containers.length; i++ ) // Just in case multiple of those exist for some reason in future
				{
					let matter_to_give = Math.min( sdMothershipContainer.containers[ i ].matter_max - sdMothershipContainer.containers[ i ].matter, this.matter / sdMothershipContainer.containers.length );
					sdMothershipContainer.containers[ i ].matter = Math.min( sdMothershipContainer.containers[ i ].matter_max, sdMothershipContainer.containers[ i ].matter + matter_to_give );
					this.matter -= matter_to_give;
				}
				else
				{
					let players_in_need_of_matter = [];
					let i = 0;
					for ( i = 0; i < sdWorld.sockets.length; i++ )
					{
						if ( sdWorld.sockets[ i ].character )
						{
							if ( sdWorld.sockets[ i ].character.build_tool_level <= 10 && sdWorld.sockets[ i ].character.matter < ( sdWorld.sockets[ i ].character.matter_max * 0.8 ) )
							players_in_need_of_matter.push( sdWorld.sockets[ i ].character );
						}
					}
					
					for ( i = 0; i < players_in_need_of_matter.length; i++ )
					{
						let matter_to_give = Math.min( players_in_need_of_matter[ i ].matter_max * 0.8 - players_in_need_of_matter[ i ].matter, this.matter / players_in_need_of_matter.length ); // Make sure all players which fit criteria get equal unless they need less than the others
						players_in_need_of_matter[ i ].matter = Math.min( players_in_need_of_matter[ i ].matter_max * 0.8, players_in_need_of_matter[ i ].matter + matter_to_give );
						this.matter -= matter_to_give;
					}
				}
			}


			if ( !this._sun_reaches )
			sun_intensity = 0;

			if ( sun_intensity > 0.2 )
			{
				this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * 1000 / 80 * sun_intensity * this._multiplier );
				//this.MatterGlow( 0.01, 50, GSPEED );
			}
			
			this._time_left -= GSPEED;
			
			if ( this._time_left <= 0 )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });
				this.remove();
				this._broken = false;
				
			}
			
			return;
		}		

		{	
			if ( this._spawn_timer > 0 && this.progress < 100 && this.has_players_nearby )
			this._spawn_timer -= GSPEED;
			else
			if ( this.has_players_nearby && this.progress < 100 )
			{
				this._spawn_timer = 150 + Math.random() * 150;

				sdWeather.only_instance.ExecuteEvent({ 
					event: this._event_to_spawn,
					near_entity: this,
					group_radius: 3000,
					target_entity: this,
					unlimited_range: true
				});
			}
		
			if ( !this._spawned_ai ) // Spawn random SD soldier which will stand near the beam projector
			{
				{

					let sd_soldiers = 0;
					let sd_soldiers_tot = 2;

					let left_side = ( Math.random() < 0.5 );

					while ( sd_soldiers < sd_soldiers_tot )
					{

						let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });

						sdEntity.entities.push( character_entity );

						{
							let x,y;
							let tr = 1000;
							do
							{
								if ( left_side )
								{
									x = this.x + 16 + 16 * sd_soldiers + ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * sd_soldiers + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * sd_soldiers - ( Math.random() * 192 );
								}
								else
								{
									x = this.x - 16 - 16 * sd_soldiers - ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * sd_soldiers + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * sd_soldiers - ( Math.random() * 192 );
								}

								y = this.y + 192 - ( Math.random() * ( 384 ) );
								if ( y < sdWorld.world_bounds.y1 + 32 )
								y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( y > sdWorld.world_bounds.y2 - 32 )
								y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
								if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, character_entity, sdCom.com_visibility_ignored_classes, null ) )
								//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
								//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
								{
									character_entity.x = x;
									character_entity.y = y;

									sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_STAR_DEFENDERS );
									character_entity._ai_stay_near_entity = this;
									character_entity._ai_stay_distance = 64;
									
									sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
									sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT });

									const logic = ()=>
									{
										if ( character_entity.hea <= 0 )
										if ( !character_entity._is_being_removed )
										{
											sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT });
											character_entity.remove();
										}
										
										if ( character_entity._is_being_removed )
										clearInterval( logic, 1000 );
									};
									
									setInterval( logic, 1000 );
									
									break;
								}

								tr--;
								if ( tr < 0 )
								{
									character_entity.remove();
									character_entity._broken = false;
									break;
								}
							} while( true );
						}
						sd_soldiers++;
						this._spawned_ai = true;
					}
				}
			}
		}
		if ( this._regen_timeout > 0 )
		{
			this._regen_timeout -= GSPEED;
		}
		else
		{
			this._regen_timeout = 150; // So it doesn't spam GetAnythingNear when _regen_timeout is 0
			for ( let i = 0; i < sdWorld.sockets.length; i++ )
			if ( sdWorld.sockets[ i ].character && this.progress < 100 )
			{
				let desc = 'We placed a solar powered matter distributor - to help out freshly deployed Star defenders which struggle with matter management. You need to protect it so it can start up.';
				if ( sdMothershipContainer.containers.length > 0 )
				desc = 'We placed a solar powered matter distributor - to speed up fueling the Mothership matter container. You need to protect it so it can start up.';
				if ( this._ai_told_player )
				desc = 'Protect the solar powered matter distributor until it starts functioning.';
				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'PROTECT-'+this._net_id, 
					executer: sdWorld.sockets[ i ].character,
					target: this,
					mission: sdTask.MISSION_PROTECT_ENTITY,				
					title: 'Protect solar powered matter distributor',
					description: desc,
					difficulty: 0.2
				});
			}
			this.has_players_nearby = false;
			//this._update_version++;
			let players = sdWorld.GetAnythingNear( this.x, this.y, 192, null, [ 'sdCharacter', 'sdPlayerDrone' ] );
			for ( let i = 0; i < players.length; i++ )
			{
				if ( players[ i ].IsPlayerClass() && !players[ i ]._ai && players[ i ]._ai_team === 0  && players[ i ].hea > 0 )
				if ( players[ i ]._socket !== null )
				{
					if ( sdWorld.CheckLineOfSight( this.x, this.y - 16, players[ i ].x, players[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) ) // Needs line of sight with players, otherwise it doesn't work
					{
						//if ( this.hea < this.hmax )
						{
							//if ( sdWorld.is_server )
							//this.hea = this.hmax; // Hack
							this._regen_timeout = 30;
							this.has_players_nearby = true;
						}
					}
				}
				
				if ( players[ i ]._ai && players[ i ]._ai_team === 0 && !this._ai_told_player ) // Is detected entity friendly AI?
				{
					this._ai_told_player = true;
					let potential_dialogue = sdWorld.AnyOf( [ 
						'Hello, can you help start this? Let\'s do this!',
						'Activating this we will be able to give matter to Star Defenders running low on it.',
						'Watch out, it is known that Asps and Biters dislike this device for some reason.',
						'I can\'t wait to get back to the Mothership after this.',
						'This device helps Star Defenders running low on matter, as long as it can generate it.',
						'This device streams matter into our suits if it detects we are low on it.'
					] );
					
					if ( sdMothershipContainer.containers.length > 0 ) // Mothership containers exist?
					potential_dialogue = sdWorld.AnyOf( [ 
						'Help us boot the distributor so it can transfer matter to the Mothership matter container!',
						'This device helps filling up the Mothership matter container we placed on this planet.',
						'We are tasked to start this device so the Mothership matter container can fill up faster.',
						'I\'ve heard they reward people well for filling their Mothership matter containers.',
						'Mothership matter containers are used to power the Mothership and create artificial crystals. Make it happen.'
					] );
					players[ i ].Say( potential_dialogue, false, false, false );
					
				}
			}
			if ( this.has_players_nearby )
			this.progress = Math.min( this.progress + 1.35, 100 ); // 0.45 feels painfully slow
		}
	}
	onMovementInRange( from_entity )
	{
		/*if ( from_entity.is( sdCrystal ) )
		if ( !from_entity._is_being_removed )
		if ( from_entity.matter_max === sdCrystal.anticrystal_value && from_entity.type === sdCrystal.TYPE_CRYSTAL && from_entity.held_by === null )
		if ( !this.has_anticrystal )
		{
			this.has_anticrystal = true;
			this.hmax = 30000;
			this.hea = 1000;
			from_entity.remove();
			//this._update_version++;
		}
		*/
		if ( from_entity.IsPlayerClass() )
		if ( from_entity.hea > 0 )
		if ( !from_entity._ai )
		{
			this.has_players_nearby = true;
			this._regen_timeout = Math.min( this._regen_timeout, 30 );
		}
		
	}
	get title()
	{
		return 'Solar powered matter distributor';
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		
		if ( this.has_players_nearby === true )
		xx = ( this.progress >= 100 ) ? 3 : ( sdWorld.time % 1000 < 500 ) ? 2 : 1;
		else
		xx = 0;
		ctx.drawImageFilterCache( sdSolarMatterDistributor.img_distributor, xx * 48, 0, 48,48, -24, -24, 48,48 );

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		//if ( !this.has_anticrystal )
		//sdEntity.Tooltip( ctx, "Dark matter beam projector (needs natural Anti-crystal) ", 0, -10 );
		//else
		if ( this.has_players_nearby )
		sdEntity.TooltipUntranslated( ctx, T("Solar powered matter distributor") + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )", 0, -10 );
		else
		sdEntity.TooltipUntranslated( ctx, T("Solar powered matter distributor (disabled)") + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )", 0, -10 );

		let w = 40;
		//if ( this.has_anticrystal )
		{
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 32, w, 3 );

			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - 32, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		}
		
		if ( this.progress < 100 )
		{
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 28, w, 3 );
			
			ctx.fillStyle = '#aabbff';
			ctx.fillRect( 1 - w / 2, 1 - 28, ( w - 2 ) * Math.max( 0, this.progress / 100 ), 1 );
		}
	}
	
	/*onRemoveAsFakeEntity()
	{
		let i = sdSolarMatterDistributor.panels.indexOf( this );
		
		if ( i !== -1 )
		sdSolarMatterDistributor.panels.splice( i, 1 );
	}*/
	
	onRemove() // Class-specific, if needed
	{
		//this.onRemoveAsFakeEntity();
		
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	}
}
//sdSolarMatterDistributor.init_class();

export default sdSolarMatterDistributor;
