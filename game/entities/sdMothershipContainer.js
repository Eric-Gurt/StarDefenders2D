
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCrystal from './sdCrystal.js';
import sdCom from './sdCom.js';
import sdSolarMatterDistributor from './sdSolarMatterDistributor.js';
import sdJunk from './sdJunk.js';

import sdFactions from './sdFactions.js';
import sdTask from './sdTask.js';
import sdWeather from './sdWeather.js';

class sdMothershipContainer extends sdEntity
{
	static init_class()
	{
		sdMothershipContainer.img_matter_container = sdWorld.CreateImageFromFile( 'sdMothershipContainer' );
		
		sdMothershipContainer.containers = [];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -42; }
	get hitbox_x2() { return 42; }
	get hitbox_y1() { return -21; }
	get hitbox_y2() { return 25; }
	
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	
	constructor( params )
	{
		super( params );
		
		this.matter_max = 2048 * 5120; // 10485760 matter.
		
		this.matter = 0;
		
		this.sx = 0;
		this.sy = 0;
		
		this._ai_team = 0;
		
		//this._last_sync_matter = this.matter;
		
		this.progress = 0;
		
		this.hmax = 40000; // Tanky enough? Should be able to survive up to 2 council bombs probably
		this.hea = this.hmax;
		
		this._next_distributor_spawn = sdWorld.time + ( 1000 * 60 * 20 ); // Spawn solar distributors
		this._next_council_bomb = sdWorld.time + ( 1000 * 60 * 60 ); // Spawn council bomb
		
		// Better to use sdWorld.time for those spawns so if offscreen simulation is slown down, spawn time remains unaffected
		
		this._next_task_refresh = 30; // Timer to assign task to players
		
		this._last_spawned_distributor = null; // Last spawned distributor
		
		this._last_progress = 0; // For additional council bomb spawns
		
		this._damagable_in = 60;
		
		/*	
			This way we can check if players are completing the distributors spawned by the container
			and if they aren't completing them, don't spawn them so the planets don't get flooded with
			solar matter distributors
		*/
		
		this._regen_timeout = 0;
		
		this._spawned_ai = false;
		
		this._time_until_remove = 30 * 60 * 60 * 24 * 7; // One week of gameplay until it despawns
		
		// Maybe I should use sdWorld.time for this one aswell? - Booraz
		
		sdMothershipContainer.containers.push( this );
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_last_spawned_distributor' ) return true;

		return false;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._damagable_in > 0 )
		return;
	
		dmg = Math.abs( dmg );
		
		this.hea -= dmg;
		
		if ( this.hea <= 0 )
		{
			if ( this.progress < 100 )
			this.remove();
			else // "Failsafe" after first phase
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });
				this.remove();
				this._broken = false;
			}
		}
	
		this._regen_timeout = 60;
		
		//this._update_version++; // Just in case
	}
	
	/*PrioritizeGivingMatterAway() // sdNode, sdCom, sdCommandCentre, sdMaterContainer, sdMatterAmplifier all do that in order to prevent slow matter flow through cables
	{
		return true;
	}*/
	// It probably needs matter filling, rather than giving.
	
	get mass() { return ( this.progress < 100 ) ? 1000 : 250; } // Recommended to move with vehicles if blocked by something
	// Easier to move when first phase is completed
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		// No regen, just give away matter
		//this.matter = Math.min( this.matter_max, this.matter + GSPEED * 0.001 * this.matter_max / 80 );
		
		this.sy += sdWorld.gravity * GSPEED;
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			{
				this.hea = Math.min( this.hea + ( GSPEED / 20 ), this.hmax ); // Really slow health regen
			}
		}
		
		if ( sdWorld.is_server )
		{
			if ( this._damagable_in > 0 )
			this._damagable_in -= GSPEED;
			
			
			if ( !this._last_spawned_distributor || this._last_spawned_distributor._is_being_removed )
			this._last_spawned_distributor = null;
			
			this._time_until_remove -= GSPEED;
			if ( this._time_until_remove <= 0 ) // Time's up
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });
				this.remove();
				this._broken = false;
			}
			if ( this.progress < 100 )
			{
				this.progress = ( this.matter / this.matter_max ) * 100; // For task.
				this._next_task_refresh -= GSPEED;
				
				// Maybe "Protect entity" tasks could just use same parameter checks as LRTP extraction tasks, however the progress bar is a good indicator IMO - Booraz
				this._next_distributor_spawn -= GSPEED;
				this._next_council_bomb -= GSPEED;
			
				if ( this._next_distributor_spawn <= sdWorld.time ) // Time to spawn distributor?
				{
					this._next_distributor_spawn = sdWorld.time + ( 1000 * 60 * 18 + ( Math.random() * 1000 * 60 * 4 ) ); // Spawn one every 18-22 minutes
					if ( !this._last_spawned_distributor || ( this._last_spawned_distributor && this._last_spawned_distributor.progress >= 100 ) ) // Don't overflow with spawns if last spawned distributor needs completion
					{
						let has_players_nearby = false;
						for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let's check if there are any players close to the matter container
						{
							let character = sdWorld.sockets[ i ].character;
							if ( character )
							{
								if ( sdWorld.Dist2D( character.x, character.y, this.x, this.y ) < 800 ) // Is player close enough?
								{
									has_players_nearby = true;
									break;
								}
							}
						}
						if ( !has_players_nearby ) // First scenario, spawn a solar matter distributor near the mothership matter container
						{
							let distributors = 0;
							let distributors_tot = 1;

							while ( distributors < distributors_tot )
							{

								let ent = new sdSolarMatterDistributor({ x:0, y:0 });

								sdEntity.entities.push( ent );

								{
									let x,y;
									let tr = 100;
									do
									{
										x = this.x + 192 - ( Math.random() * 384 );

										if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
										x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

										if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
										x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );

										y = this.y + 192 - ( Math.random() * ( 384 ) );
										if ( y < sdWorld.world_bounds.y1 + 32 )
										y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

										if ( y > sdWorld.world_bounds.y2 - 32 )
										y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

										if ( ent.CanMoveWithoutOverlap( x, y, 1 ) )
										if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, this, sdCom.com_visibility_ignored_classes, null ) )
										{
											ent.x = x;
											ent.y = y;

											this._last_spawned_distributor = ent;
											
											break;
										}

										tr--;
										if ( tr < 0 )
										{
											ent.remove();
											ent._broken = false;
											
											break;
										}
									} while( true );
								}
								distributors++;
							}
						}
						if ( has_players_nearby || ( !this._last_spawned_distributor || ( this._last_spawned_distributor && this._last_spawned_distributor.progress >= 100 ) ) ) // Spawn it anywhere, because players are near the container, or it did not spawn despite nothing near it
						{
							let distributors = [];
							sdWeather.SimpleSpawner({
								count: [ 1, 1 ],
								class: sdSolarMatterDistributor,
								store_ents: distributors,
								min_air_height: -400, // Minimum free space above entity placement location
								aerial: true,
								aerial_radius: 128
							});
							
							if ( distributors.length > 0 )
							this._last_spawned_distributor = distributors[ 0 ]; // Assign the spawned ent as the last one
						}
					}
				}
				if ( this._next_council_bomb < sdWorld.time || ( this.progress >= this._last_progress + 10 ) ) // Time to spawn the bomb, or did the container progress enough?
				{
					if ( this._next_council_bomb < sdWorld.time ) // Spawn by time?
					this._next_council_bomb = sdWorld.time + ( 1000 * 60 * 58 + ( Math.random() * 1000 * 60 * 4 ) ); // Spawn one every 58-62 minutes
				
					let ents = 0;
					let ents_tot = 1;
					
					if ( this.progress >= this._last_progress + 10 ) // Spawn by progress?
					{
						this._last_progress = this._last_progress + 10; // Increment spawn requirement by 10
					}

					while ( ents < ents_tot )
					{

						let ent = new sdJunk({ x:0, y:0, type: sdJunk.TYPE_COUNCIL_BOMB });

						sdEntity.entities.push( ent );

						{
							let x,y;
							let tr = 100;
							do
							{
								x = this.x + 96 + ( 100 - tr ) - ( Math.random() * ( 292 - tr ) ); // Potential spawn radius scales over attempts

								if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
								x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

								if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
								x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );

								y = this.y + 96 + ( 100 - tr ) - ( Math.random() * ( 292 - tr ) );
								if ( y < sdWorld.world_bounds.y1 + 32 )
								y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( y > sdWorld.world_bounds.y2 - 32 )
								y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( ent.CanMoveWithoutOverlap( x, y, 1 ) )
								if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, this, sdCom.com_visibility_ignored_classes, null ) )
								{
									ent.x = x;
									ent.y = y;
										
									break;
								}

								tr--;
								if ( tr < 0 )
								{
									ent.remove();
									ent._broken = false;
										
									break;
								}
							} while( true );
						}
						ents++;
					}
				}
				if ( this._next_task_refresh < 0 )
				{
					this._next_task_refresh = 60;
					let desc = 'We need matter for the mothership. We sent one of the containers from our storage which you need to fill up with matter. Cooperate with other Star Defenders on this planet to maximize efficiency. Watch out for the Council. You will be rewarded nicely if you succeed.';
					
					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].character && this._time_until_remove > 30 * 5 )
					{
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'PROTECT-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_PROTECT_ENTITY,				
							title: 'Protect and fill the mothership matter container with matter',
							description: desc,
							difficulty: 1.6,
							time_left: this._time_until_remove - ( 30 * 3 ),
							allow_hibernation: false
						});
						
					}
				}
				
				if ( !this._spawned_ai ) // Spawn random SD soldier which will stand near the matter container
				{
					{

						let sd_soldiers = 0;
						let sd_soldiers_tot = 2;

						while ( sd_soldiers < sd_soldiers_tot )
						{

							let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });

							sdEntity.entities.push( character_entity );

							{
								let x,y;
								let tr = 100;
								do
								{
									x = this.x + 192 - ( Math.random() * 384 );

									if ( x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 64 + ( Math.random() * 192 );

									if ( x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 64 - ( Math.random() * 192 );

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
			else // First phase completed?
			{
				if ( this._time_until_remove > 30 * 60 * 60 )
				this._time_until_remove = 30 * 60 * 60; // Set time to LRTP this to 60 minutes, if not below already
			
			
				this._next_task_refresh -= GSPEED;
				if ( this._next_task_refresh < 0 )
				{
					this._next_task_refresh = 60;
					let desc = 'We need you to teleport the mothership matter container using a long range teleporter, to maximize the usage of stored matter. The container can teleport itself back to the mothership, if the failsafe activates, but it will spend a lot of matter for it.';
					
					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					if ( sdWorld.sockets[ i ].character && this._time_until_remove > 30 * 5 )
					{
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'EXTRACT-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							mission: sdTask.MISSION_LRTP_EXTRACTION,
							title: 'Extract the mothership matter container',
							description: desc,
							difficulty: 0.4,
							for_all_players: true, // Reward everyone if successfully completed
							lrtp_class_proprty_value_array: [ 'sdMothershipContainer', 'matter', this.matter_max ], // And make sure the container is filled
							time_left: this._time_until_remove - ( 30 * 3 )
						});
					}
				}
				
			}
			
		}
		//this.MatterGlow( 0.01, 50, GSPEED ); // Should this thing give away matter? Probably not so the task is completable - Booraz
		
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.05 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			//this._update_version++;
		}*/
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.TooltipUntranslated( ctx, T("Mothership matter container") + " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this.matter_max) + " )", 0, -10 );
		
		let w = 40;
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 32, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 32, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		
		if ( this.progress < 100 )
		{
			
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 28, w, 3 );
			
			ctx.fillStyle = '#aabbff';
			ctx.fillRect( 1 - w / 2, 1 - 28, ( w - 2 ) * Math.max( 0, this.progress / 100 ), 1 );
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		let xx = 0;
		
		
		ctx.drawImageFilterCache( sdMothershipContainer.img_matter_container, xx * 128, 0, 128, 96, - 64, - 48, 128, 96 );
		
		//if ( this.matter_max > 40 )
		//ctx.filter = 'hue-rotate('+( this.matter_max - 40 )+'deg)';
	
		ctx.filter = sdWorld.GetCrystalHue( -1 ); // White
	
		ctx.globalAlpha = sdShop.isDrawing ? 1 : this.matter / this.matter_max;
		
		xx = 1;
		
		ctx.drawImageFilterCache( sdMothershipContainer.img_matter_container, xx * 128, 0, 128, 96, - 64, - 48, 128, 96 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemoveAsFakeEntity()
	{
		
		let i = sdMothershipContainer.containers.indexOf( this );
		
		if ( i !== -1 )
		sdMothershipContainer.containers.splice( i, 1 );

	}
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
		
		if ( this._broken )
		{
			/*sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });

			sdWorld.DropShards( this.x, this.y, 0, 0, 
				Math.floor( Math.max( 0, this.matter / this.matter_max * 80 / sdWorld.crystal_shard_value * 0.5 ) ),
				this.matter_max / 80,
				10
			);*/

			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
	}
	
	/*MeasureMatterCost()
	{
		return Infinity; // Hack
	}
	*/
}
//sdMothershipContainer.init_class();

export default sdMothershipContainer;