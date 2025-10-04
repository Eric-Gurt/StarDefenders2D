/*

	Status effects that are attached to other entities. These are capable of modifying how entities look.

	These can maybe even work as held item containers + multipliers? If these will work well across long-range teleporters.

*/
/* global FakeCanvasContext, sdSound, THREE */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBullet from './sdBullet.js';
import sdGun from './sdGun.js';
import sdWeather from './sdWeather.js';
import sdCrystal from './sdCrystal.js';
import sdLost from './sdLost.js';
import sdCom from './sdCom.js';
import sdCable from './sdCable.js';
import sdBG from './sdBG.js';
import sdBlock from './sdBlock.js';
import sdWater from './sdWater.js';
import sdCharacter from './sdCharacter.js';

import sdRenderer from '../client/sdRenderer.js';

class sdStatusEffect extends sdEntity
{
	static init_class()
	{
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdStatusEffect.img_level_up = sdWorld.CreateImageFromFile( 'level_up' );
		sdStatusEffect.img_bubble_shield = sdWorld.CreateImageFromFile( 'bubble_shield' );
		sdStatusEffect.img_attack_indicator_beam = sdWorld.CreateImageFromFile( 'attack_indicator_beam' );
		sdStatusEffect.img_pulse = sdWorld.CreateImageFromFile( 'em_anomaly' );
		sdStatusEffect.img_light = sdWorld.CreateImageFromFile( 'lens_flare' );
		sdStatusEffect.img_warning = sdWorld.CreateImageFromFile( 'warning' );
		
		sdStatusEffect.types = [];
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_DAMAGED = 0 ] = 
		{
			remove_if_for_removed: false, // Damage numbers can stay for a little while, they are removed eventually
	
			is_emote: false,
			
			is_static: true,
	
			onMade: ( status_entity, params )=>
			{
				status_entity._progress = 0;
				status_entity._max_progress = 700 / 30;
				
				status_entity.merges = 0; // To make it more smooth - client will automatically reset _progress when merge count goes up
				status_entity._last_merges = 0;
				
				status_entity.dmg = params.dmg || 0;
				status_entity.crit = params.crit || false;
				
				status_entity._observers = new WeakSet(); // Damage initiators
				
				if ( params.by )
				status_entity._observers.add( params.by );
				
				//status_entity._progress = 100 / 1000 * 30;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				if ( status_entity.crit !== params.crit )
				return false;

				status_entity.dmg += params.dmg || 0;

				status_entity.merges++;

				status_entity._update_version++;

				if ( params.by )
				status_entity._observers.add( params.by );
				
				return true; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				//return true;
				return ( observer_entity === status_entity.for || status_entity._observers.has( observer_entity ) );
			},
			onThink: ( status_entity, GSPEED )=>
			{
				if ( status_entity._last_merges !== status_entity.merges )
				{
					status_entity._last_merges = status_entity.merges;
					status_entity._progress = 0;
				}
				else
				{
					status_entity._progress += GSPEED;
				}
			
				return ( status_entity._progress > status_entity._max_progress ); // return true = delete
			},
			onBeforeRemove: ( status_entity )=>
			{
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
				
				if ( status_entity._progress < 200 / 1000 * 15 )
				{
					if ( status_entity.dmg > 0 )
					{
						{
							if ( status_entity._progress < 200 / 1000 * 7.5 )
							ctx.sd_status_effect_tint_filter = [ 1.75, 1.75, 1.75 ];
							else
							ctx.sd_status_effect_tint_filter = [ 1.5, 1.5, 1.5 ];
						}
					}
					else
					{
						ctx.sd_status_effect_tint_filter = [ 0.75, 1.5, 0.75 ]; // Heal
					}
				}
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				ctx.sd_status_effect_filter = null;
				ctx.sd_status_effect_tint_filter = null;
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
				if ( status_entity.dmg === 0 )
				return;
			
				ctx.textAlign = 'center';
				ctx.font = ( status_entity.crit ? "7" : "5" ) + "px Verdana";
				
				/*for ( let sh = 0; sh < 1; sh++ )
				for ( let x = -1; x <= 1; x++ )
				for ( let y = -1; y <= 1; y++ )*/
				{
					//if ( x === 0 && y === 0 )
					{
						//if ( sh !== 1 )
						//continue;
					
						if ( status_entity.dmg > 200 )
						ctx.fillStyle = '#ff0000';
						else
						if ( status_entity.dmg > 100 )
						ctx.fillStyle = '#ff6666';
						else
						if ( status_entity.dmg > 50 )
						ctx.fillStyle = '#ffaaaa';
						else
						if ( status_entity.dmg > 0 )
						ctx.fillStyle = '#ffeeee';
						else
						ctx.fillStyle = '#aaffaa';
					}
					/*else
					{
						if ( sh !== 0 )
						continue;
					
						ctx.fillStyle = '#000000';
					}*/

					ctx.globalAlpha = Math.min( 1, ( 1 - status_entity._progress / status_entity._max_progress ) * 2 );
					
					let xx = 0;
					let yy = -2.5 - status_entity._progress * 1 + Math.pow( status_entity._progress, 2 ) * 0.1;
					
					ctx.apply_shading = false;

					if ( status_entity.dmg > 0 )
					ctx.fillText( Math.floor( status_entity.dmg ) + ( status_entity.crit ? ' CRIT' : '' ), xx, yy );
					else
					ctx.fillText( '+' + Math.abs( Math.floor( status_entity.dmg ) ) + '', xx, yy ); 

					ctx.apply_shading = true;
				}
				
				ctx.globalAlpha = 1;
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_HEARTS = 1 ] = 
		{
			is_emote: true, // Used as a sign for removal with context option
	
			onMade: ( status_entity, params )=>
			{
				//trace('-- Hearts made');
				
				status_entity._ttl = 0; // 0 = permanent
				status_entity._next_spawn = 0;
				
				status_entity._effects = [];
				
				if ( params.ttl !== undefined )
				status_entity._ttl = params.ttl;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{

				return true; // Cancel merge process
			},
			
			onThink: ( status_entity, GSPEED )=>
			{
				if ( !sdWorld.is_server || sdWorld.is_singleplayer )
				if ( status_entity.for.hea > 0 )
				{
					status_entity._next_spawn -= GSPEED;
					
					const up_velocity = -0.1;
					const y_offset = status_entity.for._hitbox_y1 + 3;
					const range = 16;
					const range_affection = 16;

					if ( status_entity._next_spawn <= 0 )
					{
						status_entity._next_spawn = 5 + Math.random() * 10;

						let a = Math.random() * Math.PI * 2;

						let r = Math.pow( Math.random(), 0.5 ) * range;

						let xx = status_entity.for.x + Math.sin( a ) * r;
						let yy = status_entity.for.y + y_offset + Math.cos( a ) * r;

						let ent = new sdEffect({ x: xx, y: yy, type:sdEffect.TYPE_HEARTS, sx: 0, sy: up_velocity });
						sdEntity.entities.push( ent );
						
						status_entity._effects.push( ent );
					}
					
					while ( status_entity._effects.length > 0 && status_entity._effects[ 0 ]._is_being_removed )
					status_entity._effects.shift();
				
					for ( let i = 0; i < status_entity._effects.length; i++ )
					{
						let ent = status_entity._effects[ i ];
						
						let di = sdWorld.inDist2D( ent.x, ent.y, status_entity.for.x, status_entity.for.y + y_offset, range_affection );
						
						if ( di >= 0 )
						{
							ent.sx = sdWorld.MorphWithTimeScale( ent.sx, status_entity.for.sx, 0.95, GSPEED * ( range_affection - di ) );
							ent.sy = sdWorld.MorphWithTimeScale( ent.sy, status_entity.for.sy + up_velocity, 0.95, GSPEED * ( range_affection - di ) );
						}

						ent.sx = sdWorld.MorphWithTimeScale( ent.sx, 0, 0.95, GSPEED );
						ent.sy = sdWorld.MorphWithTimeScale( ent.sy, up_velocity, 0.95, GSPEED );
					}
				}
				
				if ( status_entity._ttl > 0 )
				{
					status_entity._ttl -= GSPEED;

					return ( status_entity._ttl <= 0 ); // return true = delete
				}
				
				return false; // Keep
			}
		};
		const temperature_normal = 20; // Copy
		const temperature_fire = 700;
		const temperature_frozen = -50;
		
		sdStatusEffect.temperature_normal = temperature_normal;
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_TEMPERATURE = 2 ] = 
		{
			remove_on_rescue_teleport_use: true,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.t = temperature_normal; // Temperature
				
				status_entity._normal_temperature_removal_timer = 30; // Resets if temperature is being added, for example due to overheating
				
				status_entity._next_spawn = 0;
				status_entity._next_smoke_spawn = 0;
				status_entity._next_damage = 10;
				
				status_entity._effects = [];
				
				status_entity._saved_world_time = 0;
				status_entity._last_world_time = sdWorld.time; // Used to save temporery world time values to mimic frozen animation
				
				status_entity._initiator = params.initiator || null;
				
				if ( params.t !== undefined )
				status_entity.t += params.t / ( ( params.for.hmax || params.for._hmax || 300 ) / 300 ); // Copy [ 1 / 2 ]
			
				status_entity._every_synced = false;
				
				let water_to_wake_up = sdWater.all_swimmers.get( params.for );
				if ( water_to_wake_up )
				if ( !water_to_wake_up._is_being_removed )
				water_to_wake_up.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			},
			
			onNotMergedAndAboutToBeMade: ( params )=>
			{
				/*if ( sdWorld.is_server )
				if ( params.for.is( sdWorld.entity_classes.sdCharacter ) && params.for._net_id === 85738 )
				trace( 'onNotMergedAndAboutToBeMade' );*/
				
				if ( params.target_value === temperature_normal || params.target_value_rise < temperature_normal || params.t === 0 )
				return false; // Do not make
			
				return true; // Make this effect
			},
			
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				/*if ( sdWorld.is_server )
				if ( params.for.is( sdWorld.entity_classes.sdCharacter ) && params.for._net_id === 85738 )
				trace( 'onStatusOfSameTypeApplied' );*/
				
				if ( params.t )
				{
					status_entity.t += params.t / ( ( params.for.hmax || params.for._hmax || 300 ) / 300 ); // Copy [ 2 / 2 ]
					status_entity._update_version++;
					
					if ( status_entity._normal_temperature_removal_timer < 30 )
					status_entity._normal_temperature_removal_timer = 30;
					
					if ( ( params.t > 0 ) === ( status_entity.t > 0 ) )
					status_entity._initiator = params.initiator || status_entity._initiator || null;
				}
				
				// For water cooling
				if ( params.remain_part !== undefined )
				if ( params.target_value !== undefined || ( params.target_value_rise !== undefined && status_entity.t < params.target_value_rise ) )
				if ( params.GSPEED !== undefined )
				{
					status_entity.t = sdWorld.MorphWithTimeScale( status_entity.t, ( params.target_value !== undefined ) ? params.target_value : params.target_value_rise, params.remain_part, params.GSPEED );
					status_entity._update_version++;
				}
				
				return true; // Do not create new status effect
			},
			
			IsVisible: ( status_entity, observer_entity )=>
			{
				if ( status_entity.t >= temperature_fire || status_entity.t <= temperature_frozen || status_entity._every_synced )
				if ( status_entity.for && !status_entity.for._is_being_removed )
				{
					status_entity._every_synced = true;
					return status_entity.for.IsVisible( observer_entity );
				}
			},
			
			onThink: ( status_entity, GSPEED )=>
			{
				/*let arr = sdStatusEffect.entity_to_status_effects.get( status_entity.for );
				
				if ( arr.indexOf( status_entity ) === -1 )
				throw new Error( 'How?' );*/
				
				if ( status_entity.for._god || ( status_entity.for._shielded && !status_entity.for._shielded._is_being_removed && status_entity.for._shielded.enabled ) )
				return true; // Cancel for gods
				
				if ( !sdWorld.is_server || sdWorld.is_singleplayer )
				{
					let area = ( status_entity.for._hitbox_x2 - status_entity.for._hitbox_x1 ) * ( status_entity.for._hitbox_y2 - status_entity.for._hitbox_y1 ) / ( 24 * 24 );
					
					status_entity._next_spawn -= GSPEED * area;
					status_entity._next_smoke_spawn -= GSPEED * area;						
					const up_velocity = ( status_entity.t >= temperature_fire ) ? 0 : 0.05;//-0.4;
					const range = 4;
					const y_offset = 0;
					const range_affection = 16;
					
					if ( sdRenderer.effects_quality >= 2 && status_entity.t >= temperature_fire && status_entity._next_smoke_spawn <= 0 )
					{
						let s = new sdEffect({ type: sdEffect.TYPE_SMOKE, x:status_entity.for.x, y:status_entity.for.y, sx: -Math.random() + Math.random(), sy:-1 - Math.random() * 2, scale:1, radius:1/3, color:sdEffect.GetSmokeColor( sdEffect.smoke_colors ), spark_color: '#FF8800'});
						status_entity._next_smoke_spawn = 1;
						sdEntity.entities.push( s );
					}

					if ( status_entity._next_spawn <= 0 )
					{
						if ( status_entity.t >= temperature_fire || status_entity.t <= temperature_frozen )
						{
							status_entity._next_spawn = 2 + Math.random() * 2; // We can go faster with how optimized rendering is now

							let a = Math.random() * Math.PI * 2;

							let r = Math.pow( Math.random(), 0.5 ) * range;

							let xx = status_entity.for.x + status_entity.for._hitbox_x1 + ( status_entity.for._hitbox_x2 - status_entity.for._hitbox_x1 ) * Math.random() + Math.sin( a ) * r;
							let yy = status_entity.for.y + status_entity.for._hitbox_y1 + ( status_entity.for._hitbox_y2 - status_entity.for._hitbox_y1 ) * Math.random() + Math.cos( a ) * r;
							
							if ( status_entity.for.DrawIn3D() === FakeCanvasContext.DRAW_IN_3D_BOX )
							{
								if ( Math.random() < 0.5 )
								{
									xx = status_entity.for.x + status_entity.for._hitbox_x1 + ( status_entity.for._hitbox_x2 - status_entity.for._hitbox_x1 ) * Math.random();
									yy = status_entity.for.y + status_entity.for._hitbox_y1 + ( status_entity.for._hitbox_y2 - status_entity.for._hitbox_y1 ) * ( (Math.random() < 0.5) ? 0 : 1 );
								}
								else
								{
									xx = status_entity.for.x + status_entity.for._hitbox_x1 + ( status_entity.for._hitbox_x2 - status_entity.for._hitbox_x1 ) * ( (Math.random() < 0.5) ? 0 : 1 );
									yy = status_entity.for.y + status_entity.for._hitbox_y1 + ( status_entity.for._hitbox_y2 - status_entity.for._hitbox_y1 ) * Math.random();
								}
							}

							let ent = new sdEffect({ x: xx, y: yy, type: ( status_entity.t >= temperature_fire ) ? sdEffect.TYPE_FIRE : sdEffect.TYPE_FROZEN, sx: 0, sy: up_velocity * ( 0.5 + 0.5 * Math.random() ) });
						
							sdEntity.entities.push( ent );

							status_entity._effects.push( ent );
						}

					}
					
					while ( status_entity._effects.length > 0 && status_entity._effects[ 0 ]._is_being_removed )
					status_entity._effects.shift();
				
					for ( let i = 0; i < status_entity._effects.length; i++ )
					{
						let ent = status_entity._effects[ i ];
						
						let di = sdWorld.inDist2D( ent.x, ent.y, status_entity.for.x, status_entity.for.y + y_offset, range_affection );
						
						if ( di >= 0 )
						{
							ent.sx = sdWorld.MorphWithTimeScale( ent.sx, ( status_entity.for.sx || 0 ), 0.95, GSPEED * ( range_affection - di ) );
							ent.sy = sdWorld.MorphWithTimeScale( ent.sy, ( status_entity.for.sy || 0 ) + up_velocity, 0.95, GSPEED * ( range_affection - di ) );
						}

						ent.sx = sdWorld.MorphWithTimeScale( ent.sx, 0, 0.95, GSPEED );
						ent.sy = sdWorld.MorphWithTimeScale( ent.sy, up_velocity, 0.95, GSPEED );
					}
				}
				if ( sdWorld.is_server )
				{
					status_entity._normal_temperature_removal_timer -= GSPEED;
					
					status_entity._next_damage -= GSPEED;
					if ( status_entity._next_damage <= 0 )
					{
						status_entity._next_damage = 10;
						
						if ( status_entity.t >= temperature_fire )
						{
							let burn_intensity = 1 + ( status_entity.t - temperature_fire ) / 500;
							
							if ( !status_entity.for.isFireAndAcidDamageResistant() )
							status_entity.for.DamageWithEffect( 4 * burn_intensity, status_entity._initiator );
							
							let nearby = sdWorld.GetAnythingNear( status_entity.for.x + ( status_entity.for._hitbox_x1 + status_entity.for._hitbox_x2 ) / 2, status_entity.for.y + ( status_entity.for._hitbox_y1 + status_entity.for._hitbox_y2 ) / 2, sdWorld.Dist2D( status_entity.for._hitbox_x1, status_entity.for._hitbox_y1, status_entity.for._hitbox_x2, status_entity.for._hitbox_y2 ) / 2 + 4, null, null, null );
							
							//if ( nearby.length > 0 )
							for ( let i = 0; i < nearby.length; i++ )
							{
								let e = nearby[ i ];
								
								if ( e )
								if ( e !== status_entity.for )
								if ( e.IsBGEntity() === status_entity.for.IsBGEntity() )//|| e.IsBGEntity() === 1 )
								if ( e.IsTargetable( status_entity.for ) )
								{
									let strength = 1;
									
									if ( e.is( sdCrystal ) && e.held_by )
									strength = 0;//0.005;
								
									/*if ( e.is( sdStorage ) )
									strength = 0;
								
									if ( e.is( sdBaseShieldingUnit ) )
									strength = 0;
								
									if ( e.is( sdRescueTeleport ) )
									strength = 0;*/
									
									//if ( e.IsBGEntity() === 1 )
									//strength = 0.1;
									
									// Merged blocks scenario
									if ( e.is( sdBlock ) || e.is( sdBG ) )
									if ( e._merged )
									{
										let ents;
										if ( e.is( sdBlock ) )
										ents = e.UnmergeBlocks();
										if ( e.is( sdBG ) )
										ents = e.UnmergeBackgrounds();
										// Set closest block/BG as entity to apply status effect
										if ( ents.length > 0 )
										{
											let closest = ents[ 0 ];
											let closest_di = sdWorld.Dist2D( status_entity.for.x + ( status_entity.for._hitbox_x1 + status_entity.for._hitbox_x2 ) / 2, status_entity.for.y + ( status_entity.for._hitbox_y1 + status_entity.for._hitbox_y2 ) / 2, ents[ 0 ].x + ents[ 0 ].width / 2, ents[ 0 ].y + ents[ 0 ].height / 2 );
											for ( let j = 0; j < ents.length; j++ )
											{
												let di = sdWorld.Dist2D( status_entity.for.x + ( status_entity.for._hitbox_x1 + status_entity.for._hitbox_x2 ) / 2, status_entity.for.y + ( status_entity.for._hitbox_y1 + status_entity.for._hitbox_y2 ) / 2, ents[ j ].x + ents[ j ].width / 2, ents[ j ].y + ents[ j ].height / 2 );
												if ( di < closest_di )
												{
													closest = ents[ j ];
													closest_di = di;
												}
											}
											e = closest;
										}
										else
										strength = 0;
									}
									
									if ( strength > 0 )
									{
										e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, target_value_rise:status_entity.t * ( 0.7 + Math.random() * 0.1 ), remain_part: 0.9, GSPEED:1 * strength });
										//e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TEMPERATURE, t: ( 0.025 + Math.random() * 0.05 ) * strength * status_entity.t, initiator: null }); // Overheat
									}
								}
							}
						}
						else
						if ( status_entity.t <= temperature_frozen )
						{
							let e = status_entity.for;
							let e_is_organic = ( ( e.IsPlayerClass() || e.GetBleedEffect() === sdEffect.TYPE_BLOOD || e.GetBleedEffect() === sdEffect.TYPE_BLOOD_GREEN ) );
							
							if ( e_is_organic )
							{
								if ( status_entity.for.IsPlayerClass() )
								{
									let any_nearby_players = false;
									
									for ( let i = 0; i < sdWorld.sockets.length; i++ )
									if ( sdWorld.sockets[ i ].character )
									if ( !sdWorld.sockets[ i ].character._is_being_removed )
									if ( sdWorld.sockets[ i ].character.hea > 0 && sdWorld.sockets[ i ].character._frozen <= 0 )
									if ( sdWorld.sockets[ i ].character.is( sdWorld.entity_classes.sdCharacter ) || sdWorld.sockets[ i ].character.is( sdWorld.entity_classes.sdPlayerDrone ) )
									if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, status_entity.for.x, status_entity.for.y, 400 ) )
									{
										any_nearby_players = true;
										break;
									}
									
									if ( any_nearby_players )
									status_entity.for.Damage( 1, status_entity._initiator );
									else
									status_entity.for.Damage( 10, status_entity._initiator );
								}
								else
								status_entity.for.Damage( 1, status_entity._initiator );
							}
						}
				
						status_entity.t = ( status_entity.t - temperature_normal ) * 0.95 + temperature_normal; // Go towards normal temperature. It can go towards any desired value really, depending on environment
						status_entity._update_version++;
					}
				}
				
				if ( status_entity._is_being_removed )
				return true; // Delete (already removed by something like RTP, thus we should not change _frozen property of .for !)
				
				//if ( sdWorld.is_server )
				//if ( status_entity.for.is( sdWorld.entity_classes.sdCharacter ) && status_entity.for._net_id === 85738 )
				//trace( 'onThink called by '+status_entity._net_id+' on '+status_entity.for._net_id+', ._frozen = ' + Math.max( 0, temperature_frozen - status_entity.t + 1 ) );
		
				status_entity.for._frozen = Math.max( 0, temperature_frozen - status_entity.t + 1 ); //( status_entity.t <= temperature_frozen );
				
				//if ( status_entity._is_being_removed )
				//throw new Error( 'How?' );
				
				if ( status_entity.t > temperature_frozen )
				status_entity._last_world_time = sdWorld.time;
						
				if ( status_entity._normal_temperature_removal_timer < 0 )
				if ( status_entity.t > temperature_normal - 10 )
				if ( status_entity.t < temperature_normal + 10 )
				return true; // Delete
				
				return false; // Keep
			},
			
			onBeforeRemove: ( status_entity )=>
			{
				/*if ( sdWorld.is_server )
				if ( status_entity.for )
				if ( status_entity.for.is( sdWorld.entity_classes.sdCharacter ) && status_entity.for._net_id === 85738 )
				trace( 'onBeforeRemove called, .for = ' + status_entity.for );
				*/
				if ( status_entity.for )
				status_entity.for._frozen = 0;
			
				/*if ( sdWorld.is_server )
				if ( !status_entity.for )
				trace( 'onBeforeRemove called, .for = ' + null );*/
			},
			
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				status_entity._saved_world_time = sdWorld.time;
				
				if ( !status_entity.for )
				return;
			
				if ( status_entity.t >= temperature_fire )
				{
					ctx.sd_status_effect_tint_filter = [ 2, 1.5, 0.25 ];
					ctx.hue_rotate = 0;
				}
				else
				if ( status_entity.t <= temperature_frozen )
				{
					ctx.sd_status_effect_tint_filter = [ 0.25, 1.25, 1.5 ];
					ctx.hue_rotate = 0;
					
					sdWorld.time = status_entity._last_world_time;
				}
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				ctx.sd_status_effect_filter = null;
				ctx.sd_status_effect_tint_filter = null;
				
				sdWorld.time = status_entity._saved_world_time;
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_STEERING_WHEEL_PING = 3 ] = 
		{
			onMade: ( status_entity, params )=>
			{
				status_entity._ttl = 30 * 5;
				status_entity.c = params.c || [ 1, 2, 2 ];
				status_entity._observers = new WeakSet(); // Damage initiators
				
				if ( params.observer )
				status_entity._observers.add( params.observer );
			},
			
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				status_entity._ttl = 30 * 5;
				status_entity.c = params.c || [ 1, 2, 2 ];
				status_entity._update_version++;
				
				if ( params.observer )
				status_entity._observers.add( params.observer );
				
				return true; // Cancel merge
			},
			
			IsVisible: ( status_entity, observer_entity )=>
			{
				return ( status_entity._observers.has( observer_entity ) );
			},
			onThink: ( status_entity, GSPEED )=>
			{
				status_entity._ttl -= GSPEED;
			
				return ( status_entity._ttl <= 0 ); // return true = delete
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
				
				if ( sdWorld.time % 1000 < 500 )
				ctx.sd_status_effect_tint_filter = status_entity.c;
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				ctx.sd_status_effect_tint_filter = null;
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_STEERING_WHEEL_MOVEMENT_SMOOTH = 4 ] = 
		{
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				if ( params.for )
				{
					status_entity._x = params.for.x;
					status_entity._y = params.for.y;
				}
				else
				{
					status_entity._x = 0;
					status_entity._y = 0;
				}
				
				status_entity._dx = 0;
				status_entity._dy = 0;
				
				status_entity.tx = params.tx;
				status_entity.ty = params.ty;
				
				status_entity._initialized = false;
				
				status_entity._rare_update_timer = 0;
				
				status_entity._ttl = 30;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				status_entity._ttl = 30;
				
				if ( status_entity.tx !== params.tx || status_entity.ty !== params.ty )
				{
					status_entity.tx = params.tx;
					status_entity.ty = params.ty;
				}
				
				return true; // Do not create new status effect
			},
			
			onBeforeRemove: ( status_entity )=>
			{
				if ( sdWorld.is_server )
				if ( status_entity.for )
				if ( !status_entity.for._is_being_removed )
				{
					if ( typeof status_entity.for._update_version !== 'undefined' ) // Happens rarely
					status_entity.for._update_version++;
				
					status_entity.for.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
				}
			},
			
			onThink: ( status_entity, GSPEED )=>
			{
				if ( !sdWorld.is_server )
				{
					if ( !status_entity._initialized && status_entity.for )
					{
						status_entity._initialized = true;
						status_entity._x = status_entity.for.x;
						status_entity._y = status_entity.for.y;
					}
					
					if ( status_entity._initialized )
					{
						status_entity._dx = sdWorld.MorphWithTimeScale( status_entity._dx, status_entity.tx - status_entity._x, 0.8, GSPEED );
						status_entity._dy = sdWorld.MorphWithTimeScale( status_entity._dy, status_entity.ty - status_entity._y, 0.8, GSPEED );

						status_entity._x = sdWorld.MorphWithTimeScale( status_entity._x, status_entity.tx + status_entity._dx, 0.8, GSPEED );
						status_entity._y = sdWorld.MorphWithTimeScale( status_entity._y, status_entity.ty + status_entity._dy, 0.8, GSPEED );
					}
					
					return false; // Keep
				}
				
				status_entity._rare_update_timer += GSPEED;
				if ( status_entity._rare_update_timer > 15 )
				{
					status_entity._rare_update_timer = 0;
					
					if ( typeof status_entity.for._update_version !== 'undefined' ) // Happens rarely
					status_entity.for._update_version++;
				
					status_entity.for.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
				
					status_entity._update_version++;
					
					

					let cables_set = sdCable.cables_per_entity.get( status_entity.for );
					if ( cables_set !== undefined )
					for ( let cable of cables_set )
					{
						cable.Wakeup();
						cable._update_version++;
					}
				}
			
				status_entity._ttl -= GSPEED;
				
				if ( Math.abs( status_entity.for.x - status_entity.tx ) > 8 || Math.abs( status_entity.for.y - status_entity.ty ) > 8 )
				return true; // Moved into amplifier/combiner or teleported
			
				return ( status_entity._ttl <= 0 ); // return true = delete
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
				
				ctx.save();
				
				if ( status_entity._initialized )
				ctx.translate( status_entity._x - status_entity.for.x, status_entity._y - status_entity.for.y );
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
				
				ctx.restore();
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_FALLING_STATIC_BLOCK = 5 ] = 
		{
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity._ttl = 30 * 30; // Fall for 30 seconds at max
				status_entity._sy = 0;
				
				status_entity._fell = false;
				
				status_entity._lying_for = 0;
				
				status_entity._ignored_classes_cache = null;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				if ( !sdWorld.is_server )
				{
					return false; // Keep
				}
				
				status_entity._ttl -= GSPEED;
				
				let current = status_entity.for;
				
				status_entity._sy += sdWorld.gravity * GSPEED;
				
				let yy = Math.round( status_entity._sy * GSPEED );
				
				if ( yy >= 1 )
				{
					if ( yy > 8 )
					yy = 8;
				
					// new_x, new_y, safe_bound=0, custom_filtering_method=null, alter_ignored_classes=null
					
					if ( !status_entity._ignored_classes_cache )
					{
						status_entity._ignored_classes_cache = current.GetIgnoredEntityClasses();
						
						if ( status_entity._ignored_classes_cache )
						{
							let unique = false;

							// Some entities like sdDoor do fall through walls since they ignore them... It is bad as it can lead to bug raiding when door is being dropped and is being conntrolled with another steering wheel from outside of a base

							let id = status_entity._ignored_classes_cache.indexOf( 'sdBlock' );
							if ( id !== -1 )
							{
								if ( !unique )
								{
									status_entity._ignored_classes_cache = status_entity._ignored_classes_cache.slice();
									unique = true;
								}
								status_entity._ignored_classes_cache.splice( id, 1 );
							}

							id = status_entity._ignored_classes_cache.indexOf( 'sdDoor' );
							if ( id !== -1 )
							{
								if ( !unique )
								{
									status_entity._ignored_classes_cache = status_entity._ignored_classes_cache.slice();
									unique = true;
								}
								status_entity._ignored_classes_cache.splice( id, 1 );
							}
						}
					}
					
					if ( current.CanMoveWithoutOverlap( current.x, current.y + yy, 0, null, status_entity._ignored_classes_cache ) )
					{
						current.y += yy;
						
						current.ManageTrackedPhysWakeup();

						current.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_MOVEMENT_SMOOTH, tx:current.x, ty:current.y });
						
						current.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
					else
					{
						status_entity._sy = 0;
						
						if ( !status_entity._fell )
						{
							status_entity._fell = true;
							
							current.Damage( ( current.hea || current._hea || 0 ) * 0.9 );
						}
						
						status_entity._lying_for += GSPEED;
						
						if ( status_entity._lying_for > 30 )
						return true;
					}
				}
			
				return ( status_entity._ttl <= 0 ); // return true = delete
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_LEVEL_UP = 6 ] = 
		{
			remove_if_for_removed: true,
	
			is_emote: false,
			
			is_static: true,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.is_level_up = params.is_level_up || 0;
				status_entity.level = params.level || 0;
				
				status_entity._progress = 0;
				status_entity._max_progress = 5000 / 30;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				status_entity._progress += GSPEED;
				
				return ( status_entity._progress > status_entity._max_progress ); // return true = delete
			},
			onBeforeRemove: ( status_entity )=>
			{
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
				
				if ( sdWorld.time % 1000 < 500 )
				ctx.sd_status_effect_tint_filter = [ 1.5, 1.5, 1.5 ];
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				ctx.sd_status_effect_filter = null;
				ctx.sd_status_effect_tint_filter = null;
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
				if ( status_entity.dmg === 0 )
				return;
			
				ctx.textAlign = 'center';
				ctx.font = "5px Verdana";
				
				{
					ctx.fillStyle = '#aaffaa';
					
					ctx.globalAlpha = Math.min( 1, ( 1 - status_entity._progress / status_entity._max_progress ) * 2 );
					
					let xx = 0;
					let yy = - 32 - status_entity._progress * 0.2;

					ctx.fillText( 'Level up!', xx, yy );
					
					ctx.fillStyle = '#ffffff';
					ctx.fillText( 'Level ' + status_entity.level, xx, yy + 10 );

					ctx.drawImageFilterCache( sdStatusEffect.img_level_up, - 16, - 16 - 32, 32,64 );
				}
				
				ctx.globalAlpha = 1;
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_TIME_AMPLIFICATION = 7 ] = 
		{
			remove_if_for_removed: true,
	
			is_emote: false,
			
			is_static: true,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.t = params.t;
				status_entity._next_spawn = 0;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				status_entity.t = params.t;
				status_entity._update_version++;

				return true; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return status_entity.for.IsVisible( observer_entity );
			},
			onThink: ( status_entity, GSPEED )=>
			{
				status_entity.t -= GSPEED;
				
				if ( !sdWorld.is_server || sdWorld.is_singleplayer )
				{
					status_entity._next_spawn -= GSPEED;

					if ( status_entity._next_spawn <= 0 )
					{
						status_entity._next_spawn = 15;

						const range = Math.max( status_entity.for._hitbox_x2 - status_entity.for._hitbox_x1, status_entity.for._hitbox_y2 - status_entity.for._hitbox_y1 ) / 2;
						const y_offset = 0;

						let a = Math.random() * Math.PI * 2;

						let r = Math.pow( Math.random(), 0.5 ) * range;

						let xx = status_entity.for.x + ( status_entity.for._hitbox_x1 + status_entity.for._hitbox_x2 ) / 2 + Math.sin( a ) * r;
						let yy = status_entity.for.y + ( status_entity.for._hitbox_y1 + status_entity.for._hitbox_y2 ) / 2 + Math.cos( a ) * r;

						let ent = new sdEffect({ x: xx, y: yy, type:sdEffect.TYPE_SPEED, sx: 0, sy: -0.5 });
						sdEntity.entities.push( ent );
					}
				}
				
				if ( typeof status_entity.for._time_amplification !== 'undefined' )
				status_entity.for._time_amplification = Math.max( 0, status_entity.t );
				else
				return true;
			
				return ( status_entity.t <= 0 ); // return true = delete
			},
			onBeforeRemove: ( status_entity )=>
			{
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
			
				//ctx.sd_status_effect_tint_filter = [ sdGun.time_amplification_gspeed_scale, sdGun.time_amplification_gspeed_scale, sdGun.time_amplification_gspeed_scale ];
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				//ctx.sd_status_effect_tint_filter = null;
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
			}
		};

		sdStatusEffect.types[ sdStatusEffect.TYPE_TIME_SHIFTER_PROPERTIES = 8 ] = 
		{
			remove_if_for_removed: true,
	
			is_emote: false,
			
			is_static: true,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.charges_left = params.charges_left || 3;
				status_entity.low_hp = false; // Has Time Shifter reached low HP after losing all "charges"?
				status_entity.time_to_defeat = 30 * 60 * 10; // 10 minutes per "charge"
				status_entity._teleport_timer = 36; // Timer when Time Shifter teleports around target
				
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				if ( sdWorld.is_server )
				{
					if ( status_entity._teleport_timer > 30 )
					status_entity.for._weapon_draw_timer = 15 + ( 3 * status_entity.charges_left ); // This prevents Time Shifter from attacking after teleport
				
					if ( status_entity._teleport_timer && status_entity.for._ai && typeof status_entity.for._ai.target !== 'undefined' ){
						if ( status_entity.for._ai.target )
						status_entity._teleport_timer -= GSPEED;
						if ( status_entity._teleport_timer <= 0 && status_entity.for._ai.target && sdWorld.Dist2D(status_entity.for.x, status_entity.for.y, status_entity.for._ai.target.x, status_entity.for._ai.target.y ) < 300 ) // Time to teleport?
						{
							status_entity._teleport_timer = 36;
							let i = 0;
							let xx;
							let yy;
							while ( i < 60 )
							{
								xx = status_entity.for._ai.target.x - 128 + Math.random() * 256;
								yy = status_entity.for._ai.target.y - 128 + Math.random() * 256;
														
								if ( sdWorld.CheckLineOfSight( status_entity.for.x, status_entity.for.y, xx, yy, status_entity.for, sdCom.com_visibility_ignored_classes, null ) && status_entity.for.CanMoveWithoutOverlap( xx, yy, 4 ) )
								{
									//sdSound.PlaySound({ name:'teleport', x:status_entity.for.x, y:status_entity.for.y, volume:0.5 });
									sdWorld.SendEffect({ x:status_entity.for.x, y:status_entity.for.y, type:sdEffect.TYPE_TELEPORT });
									
									let scenario = Math.round( Math.random() ); // RNG scenario
									let potential_clones = sdWorld.GetAnythingNear( status_entity.for.x, status_entity.for.y, 128, null, [ 'sdLost' ] ); // Seek "clones" to morph into
									
									if ( potential_clones.length === 0 ) // Nothing to morph into?
									scenario = 0;
									else
									if ( scenario === 1 ) // Is the scenario selected?
									{
										sdWorld.shuffleArray( potential_clones );
										scenario = 0; // Default to 0 if bottom part finds no suitable clone
										for ( let j = 0; j < potential_clones.length; j++ )
										{
											if ( potential_clones[ j ].t === 'Time Shifter' && potential_clones[ j ].f === sdLost.FILTER_NONE ) // Is this the clone?
											{
												scenario = 1; // Suitable clone found
												break;
											}
											
										}
									}
									
									if ( scenario === 0 ) // First one, teleport to fit location and occasionally drop "clone" of self, if first phase is done
									{
										if ( Math.random() < 0.5 && status_entity.charges_left < 3 )
										sdLost.CreateLostCopy( status_entity.for, 'Time Shifter', sdLost.FILTER_NONE, 300 );
																
										status_entity.for.x = xx;
										status_entity.for.y = yy;
										
										status_entity.for.sx = 0;
										status_entity.for.sy = 0;
										
										if ( status_entity.for.IsPlayerClass() )
										status_entity.for.ApplyServerSidePositionAndVelocity( true );
																
										//sdSound.PlaySound({ name:'teleport', x:xx, y:yy, volume:0.5 });
										sdWorld.SendEffect({ x:xx, y:yy, type:sdEffect.TYPE_TELEPORT });
										i = 60;
									}
									if ( scenario === 1 ) // Second scenario, swap body with one of the clones if clones are available
									{
										sdLost.CreateLostCopy( status_entity.for, 'Time Shifter', sdLost.FILTER_NONE, 300 );
										
										for ( let j = 0; j < potential_clones.length; j++ )
										{
											if ( potential_clones[ j ].t === 'Time Shifter' && potential_clones[ j ].f === sdLost.FILTER_NONE ) // Is this the clone?
											{
												status_entity.for.x = potential_clones[ j ].x; // Take position
												status_entity.for.y = potential_clones[ j ].y;
												potential_clones[ j ].remove(); // Remove "clone"
												break;
											}
										}
																
										status_entity.for.sx = 0;
										status_entity.for.sy = 0;
										
										if ( status_entity.for.IsPlayerClass() )
										status_entity.for.ApplyServerSidePositionAndVelocity( true );
																
										//sdSound.PlaySound({ name:'teleport', x:xx, y:yy, volume:0.5 });
										//sdWorld.SendEffect({ x:xx, y:yy, type:sdEffect.TYPE_TELEPORT });
										i = 60;
									}
								}
								i++;
							}
						}
					}
				}
				if ( status_entity.charges < 3 )
				status_entity.time_to_defeat -= GSPEED;
				if ( status_entity.for.hea < 500 && status_entity.charges_left > 0 )
				{
					status_entity.charges_left--;
					status_entity.time_to_defeat += 30 * 60 * 5; // Add 5 minutes every time Time Shifter teleports / reaches low HP
					sdSound.PlaySound({ name:'teleport', x:status_entity.for.x, y:status_entity.for.y, volume:0.5 });
					sdWorld.SendEffect({ x:status_entity.for.x, y:status_entity.for.y, type:sdEffect.TYPE_TELEPORT/*, hue:170, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
					sdWeather.SetRandomSpawnLocation( status_entity.for );
					status_entity.for.hea = status_entity.for.hmax;
				}
				if ( ( status_entity.for.hea < 800 && status_entity.charges_left <= 0 ) || status_entity.time_to_defeat < 0 )
				{
					//status_entity.for.gun_slot = 0; // This way the blade in the inventory does not drop
					sdSound.PlaySound({ name:'teleport', x:status_entity.for.x, y:status_entity.for.y, volume:0.5 });
					sdWorld.SendEffect({ x:status_entity.for.x, y:status_entity.for.y, type:sdEffect.TYPE_TELEPORT/*, hue:170, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
					status_entity.for.remove();
					status_entity.for._broken = false;
					status_entity.for.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_BOSS );
					return true;
				}
				if ( ( ( status_entity.for.hea < 1250 && status_entity.charges_left <= 0 ) || status_entity.time_to_defeat < 30 * 5 ) && status_entity.low_hp === false )
				{
					if ( status_entity.time_to_defeat < 30 * 5 )
					{
						status_entity.low_hp = true;
						status_entity.for.Say( [ 
							'I have to go, my planet needs me.',
							'I will deal with you later.',
							'I do not plan on dying today.',
							'Until next time!'
						][ ~~( Math.random() * 4 ) ], false, false, false );
					}
					if ( status_entity.for.hea < 1250 && sdWorld.is_server )
					{
						status_entity.low_hp = true;
						if ( Math.random() < 0.125 ) // 12.5% chance for blade to drop
						{
							status_entity.for.Say( [ 
							'Well, well. You disarmed me. See you soon.',
							'No! I lost my blade! I will get you next time!',
							'I lost my sword, but I do not die today!',
							'Agh, my blade! You will pay for this in time!'
							][ ~~( Math.random() * 4 ) ], false, false, false );
							status_entity.for._ai_gun_slot = -1;
							status_entity.for.gun_slot = -1; // Hide the equipped weapon
							sdEntity.entities.push( new sdGun({ x:status_entity.for.x, y:status_entity.for.y, sx: status_entity.for.sx, sy: status_entity.for.sy, class:sdGun.CLASS_TELEPORT_SWORD }) );
						}
						// Spawn the weapon for players to pick up if they "beat" the Time Shifter
						status_entity.time_to_defeat = 30 * 5; // Teleport away in 5 seconds
						status_entity.for.Say( [ 
							'I have to go, my planet needs me.',
							'I will deal with you later.',
							'I do not plan on dying today.',
							'Until next time!'
						][ ~~( Math.random() * 4 ) ], false, false, false );
					}
				}
				else
				{
					if (status_entity.for._in_water ) // If Time shifter is in a liquid, he will teleport away
					{
						sdSound.PlaySound({ name:'teleport', x:status_entity.for.x, y:status_entity.for.y, volume:0.5 });
						sdWorld.SendEffect({ x:status_entity.for.x, y:status_entity.for.y, type:sdEffect.TYPE_TELEPORT/*, hue:170, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
						sdWeather.SetRandomSpawnLocation( status_entity.for );
					}
				}
				
				//return ( status_entity._progress > status_entity._max_progress ); // return true = delete
			},
			onBeforeRemove: ( status_entity )=>
			{
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_ANCIENT_WALL_PROPERTIES = 9 ] = 
		{
			remove_if_for_removed: true,
			// This effect grants matter emission to ancient walls.
			is_emote: false,
			
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity._matter_max = params.matter_max || 30;
				status_entity.matter = status_entity._matter_max;
				status_entity._next_anything_near_rethink = 0;
				status_entity._anything_near = null;
				status_entity._anything_near_range = null;
				// Without these variables, status effect causes crash when loaded from preset editor
				
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				status_entity.x = status_entity.for.x + ( status_entity.for.hitbox_x2 / 2 );
				status_entity.y = status_entity.for.y + ( status_entity.for.hitbox_y2 / 2 );
				status_entity.matter = Math.min( status_entity._matter_max, status_entity.matter + ( GSPEED / 180 ) ); // Regenerate about 1 matter every 6 seconds
				status_entity.for.br = 10 + ( status_entity.matter / status_entity._matter_max ) * 90;
				status_entity.MatterGlow( 0.01, 30, GSPEED ); // Emit matter
			},
			onBeforeRemove: ( status_entity )=>
			{
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_STIMPACK_EFFECT = 10 ] = 
		{
			remove_if_for_removed: true,
	
			is_emote: false,
			
			is_static: true,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.t = params.t;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				status_entity.t = params.t;
				status_entity._update_version++;

				return true; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return status_entity.for.IsVisible( observer_entity );
			},
			onThink: ( status_entity, GSPEED )=>
			{
				status_entity.t -= GSPEED;
				
				return ( status_entity.t <= 0 ); // return true = delete
			}
		};

		sdStatusEffect.types[ sdStatusEffect.TYPE_PULSE_EFFECT = 11 ] = 
		{
			// Just a single "pulse" that appears on an object, colorable.
			remove_if_for_removed: true,
	
			is_emote: false,
			
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.t = sdWorld.time; // Gets removed after 1 pulse, which is about 3 seconds.
				status_entity.filter = params.filter || 'none';
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				//status_entity.t = params.t;
				status_entity._update_version++;

				return true; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				if ( !sdWorld.is_server || sdWorld.is_singleplayer )
				{
				}
				
				if ( status_entity.for )
				{
					status_entity.x = status_entity.for.x;
					status_entity.y = status_entity.for.y;
				}
			
				return ( status_entity.t + 3000 <= sdWorld.time ); // return true = delete
			},
			onBeforeRemove: ( status_entity )=>
			{
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				//if ( !status_entity.for )
				//return;
				//ctx.sd_status_effect_tint_filter = [ sdGun.time_amplification_gspeed_scale, sdGun.time_amplification_gspeed_scale, sdGun.time_amplification_gspeed_scale ];
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
			
				ctx.filter = status_entity.filter;
			
				if ( sdWorld.time - status_entity.t <= 1500 )
				ctx.globalAlpha = ( 0.9 * ( sdWorld.time - status_entity.t ) / 1500 );
				else
				ctx.globalAlpha = 1.8 - ( 0.9 * ( sdWorld.time - status_entity.t ) / 1500 );
			
				ctx.scale( ( 0.8 * ( sdWorld.time - status_entity.t ) / 1500 ), ( 0.8 * ( sdWorld.time - status_entity.t ) / 1500 ) );
				ctx.drawImageFilterCache( sdStatusEffect.img_pulse, 0, 0, 32, 32, - 16, - 16, 32, 32 );
				
				ctx.filter = 'none';
			}
		};

		sdStatusEffect.types[ sdStatusEffect.TYPE_CUBE_BOSS_PROPERTIES = 12 ] = 
		{
			remove_if_for_removed: true,
			is_emote: false,
			
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity._ttl = params.ttl;
				status_entity._next_spawn = 0;
				status_entity._next_smoke_spawn = 0;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				status_entity._ttl = params.ttl;
				status_entity._update_version++;

				return true; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				let attack_entities = sdWorld.GetAnythingNear( status_entity.x, status_entity.y, 64 );
	
				if ( sdWorld.is_server )
				if ( attack_entities.length > 0 )
				for ( let i = 0; i < attack_entities.length; i++ )
				{
					let e = attack_entities[ i ];
					if ( !e._is_being_removed )
					{
						if ( e.GetClass() === 'sdBullet' && e._owner !== status_entity.for ) 
						{
							sdCrystal.Zap( status_entity, e, '#ffffff' );
							sdSound.PlaySound({ name:'cube_attack', x:e.x, y:e.y, volume:0.5, pitch:2 });
							sdWorld.SendEffect({ x:e.x , y:e.y , type:sdEffect.TYPE_SHIELD });

							e._owner = status_entity.for;

							e.sx = -e.sx;
							e.sy = -e.sy;
							e.time_left *= 2;

							e.Damage( 20 ); // Prevent bullet from being endlessly reflected between 2 entities with this effect

							sdLost.ApplyAffection( status_entity.for, 2.5, null, sdLost.FILTER_VOID );
							//e.remove();
						}
					}
				}
				if ( !sdWorld.is_server || sdWorld.is_singleplayer )
				{
					status_entity._next_spawn -= GSPEED;
					status_entity._next_smoke_spawn -= GSPEED;
					
					if ( sdRenderer.effects_quality >= 2 && status_entity._next_smoke_spawn <= 0 )
					{
						let s = new sdEffect({ type: sdEffect.TYPE_SMOKE, x:status_entity.for.x, y:status_entity.for.y, sx: -Math.random() + Math.random(), sy:-1 - Math.random() * 3, scale:1, radius:1/3, color: Math.random() > 0.5 ? '#000000' : '#200000' });
						s._spark_color = s._color; 
						status_entity._next_smoke_spawn = 2;
						sdEntity.entities.push( s );
					}

					if ( status_entity._next_spawn <= 0 )
					{
						status_entity._next_spawn = 10;

						const range = Math.max( status_entity.for._hitbox_x2 - status_entity.for._hitbox_x1, status_entity.for._hitbox_y2 - status_entity.for._hitbox_y1 ) / 2;
						const y_offset = 0;

						let a = Math.random() * Math.PI * 2;

						let r = Math.pow( Math.random(), 0.5 ) * range;

						let xx = status_entity.for.x + ( status_entity.for._hitbox_x1 + status_entity.for._hitbox_x2 ) / 2 + Math.sin( a ) * r;
						let yy = status_entity.for.y + ( status_entity.for._hitbox_y1 + status_entity.for._hitbox_y2 ) / 2 + Math.cos( a ) * r;

						let ent = new sdEffect({ x: xx, y: yy, type:sdEffect.TYPE_VOID_FIRE, sx: 0, sy: -0.5 });
						sdEntity.entities.push( ent );
					}
				}

				if ( status_entity._ttl > 0 )
				{
					status_entity._ttl -= GSPEED;

					if ( status_entity._ttl <= 0 ) status_entity.remove();
				}
			},

			onBeforeRemove: ( status_entity )=>
			{
			}
		};

		sdStatusEffect.types[ sdStatusEffect.TYPE_ATTACK_INDICATOR = 13 ] = 
		{
			// Applied to the target instead of the attacker so that targeted players can see it even when the attacking entity is not visible

			remove_if_for_removed: true,
			is_emote: false,
			
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity._attacker = params.attacker || null;

				status_entity.ttl = params.ttl || 30;
				status_entity.range = params.range || 10;
				status_entity.sd_filter = ( params.color ? sdWorld.ReplaceColorInSDFilter_v2( sdWorld.CreateSDFilter(), '#ffffff', params.color ) : null );

				status_entity.x2 = 0;
				status_entity.y2 = 0;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				if ( status_entity._attacker )
				{
					let ent = status_entity._attacker;

					if ( ent._is_being_removed || ( ent.hea || ent._hea || 0 ) <= 0 || ent._frozen > 0 )
					return true;

					status_entity.x2 = status_entity._attacker.GetCenterX();
					status_entity.y2 = status_entity._attacker.GetCenterY();
				}
				else
				if ( sdWorld.is_server )
				return true;

				status_entity.ttl -= GSPEED;

				return ( status_entity.ttl <= 0 );
			},
			onBeforeRemove: ( status_entity )=>
			{
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
				if ( status_entity.sd_filter )
				ctx.sd_filter = status_entity.sd_filter;

				ctx.blend_mode = THREE.AdditiveBlending;

				ctx.globalAlpha = ( status_entity.ttl < 30 && status_entity.ttl % 10 > 5 ) ? 0 : 0.5;

				let range = status_entity.range;

				let xx = status_entity.x;
				let yy = status_entity.y;

				let di = sdWorld.Dist2D( xx, yy, status_entity.x2, status_entity.y2 );

				/*let point = sdWorld.TraceRayPoint( status_entity.x2, status_entity.y2, xx, yy, status_entity.for, null, sdCom.com_vision_blocking_classes );
				if ( point )
				{
					xx = point.x;
					yy = point.y;

					range = sdWorld.Dist2D( xx, yy, status_entity.x2, status_entity.y2 );
				}*/
				
				ctx.rotate( Math.atan2( status_entity.y2 - status_entity.y, status_entity.x2 - status_entity.x ) );
				ctx.translate( di - range, 0 );

				ctx.drawImageFilterCache( sdStatusEffect.img_attack_indicator_beam, range,-8, -range,16 );

				ctx.sd_filter = null;
				ctx.blend_mode = THREE.NormalBlending;
				ctx.globalAlpha = 1;
			}
		};
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_PSYCHOSIS = 14 ] = 
		{
			remove_if_for_removed: true,
			is_emote: false,
			
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity._next_spawn = 0;
				status_entity._ttl = params.ttl;
				status_entity._first_team = null;
				status_entity._first_chat_color = null;
				
				status_entity._owner = params.owner || null;
				status_entity._controllable = params.controllable || false;
				
				status_entity.visual = params.visual || false; // Ignore extra logic and only show blinking light sprite
				
				if ( status_entity.for )
				if ( status_entity.for.is( sdWorld.entity_classes.sdCharacter ) )
				{
					status_entity._first_chat_color = status_entity.for._chat_color;
					status_entity.for._chat_color = '#ff0000';
					
					if ( status_entity.visual ) return; // No need for AI logic
					
					if ( status_entity.for._ai_enabled )
					{
						status_entity._first_team = status_entity.for._ai_team; // Fix client-side errors
					
						status_entity.for._ai_team = 11; // Clones
						
						if ( status_entity._owner )
						{
							status_entity.for._ai_team = status_entity._owner._ai_team;
							// Bad idea ahead
							/*
							status_entity.for.cc_id = status_entity._owner.cc_id;
							status_entity.for._owner = status_entity._owner;
							*/
						}
						
						if ( status_entity.for._ai && status_entity.for._ai.target )
						status_entity.for._ai.target = null; // Reset current target
						
						// console.log ( status_entity.for._ai_team, status_entity._first_team )
					}
				}
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				status_entity._ttl = params.ttl;
				status_entity._update_version++;

				return true; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				if ( status_entity._ttl > 0 )
				{
					status_entity._ttl -= GSPEED;

					if ( status_entity._ttl <= 0 )
					status_entity.remove();
				}
				if ( sdWorld.is_server )
				if ( status_entity._controllable )
				if ( status_entity._owner && status_entity._owner._key_states.GetKey( 'Mouse1' ) )
				{
					if ( status_entity.for )
					if ( status_entity.for.is( sdWorld.entity_classes.sdCharacter ) )
					if ( status_entity.for._ai_enabled )
					{
						if ( status_entity.for._ai && status_entity.for._ai.target )
						status_entity.for._ai.target = null; // Reset current target before doing anything
					
						status_entity.for.look_x = status_entity._owner.look_x;
						status_entity.for.look_y = status_entity._owner.look_y;
						
						if ( !status_entity._is_being_removed ) // Prevents infinite fire
						status_entity.for._ai_force_fire = true;
					}
				}
				else
				status_entity.for._ai_force_fire = false;
			
				if ( status_entity.visual ) return;
				
				if ( !sdWorld.is_server || sdWorld.is_singleplayer )
				{
					let e = sdWorld.my_entity;
					if ( status_entity.for !== e )
					return;
				
					status_entity._next_spawn -= GSPEED;

					if ( status_entity._next_spawn <= 0 )
					{
						status_entity._next_spawn = 75;

						switch ( Math.round( Math.random() * 5 ) )
						{	
							case 1:
							{
								let ent1 = new sdEffect({ type: sdEffect.TYPE_LENS_FLARE, x:status_entity.for.x, y:status_entity.for.y - 32, sx:0, sy:10, scale:5, radius:1, color:'#FF0000' });
							
								let ent2 = new sdEffect({ type: sdEffect.TYPE_LENS_FLARE, x:status_entity.for.x - 8, y:status_entity.for.y - 48, sx:0, sy:10, scale:5, radius:1, color:'#FF0000' });
							
								let ent3 = new sdEffect({ type: sdEffect.TYPE_LENS_FLARE, x:status_entity.for.x + 8, y:status_entity.for.y - 48, sx:0, sy:10, scale:5, radius:1, color:'#FF0000' });
								sdEntity.entities.push( ent1, ent2, ent3 );
							
								break;
							}
							case 2:
							{
								sdSound.PlaySound({ name: 'sd_death2', x:status_entity.x, y:status_entity.y, volume: 0.5, pitch: 0.5, _server_allowed: true });
								break;
							}
							case 3:
							{
								sdSound.PlaySound({ name: 'zombie_alert2', x:status_entity.x, y:status_entity.y, volume: 1.5, pitch: 0.75 });
								break;
							}
							case 4:
							{
								let ent = new sdEffect({ type: sdEffect.TYPE_LENS_FLARE, x:status_entity.for.x, y:status_entity.for.y - 32, sx:0, sy:-5, scale:5, radius:5, color:'#00FFFF' });
								sdEntity.entities.push( ent );
							
								break;
							}
							default:
							{
								let t = sdWorld.AnyOf( [ 
									'You will die. Stop delaying the inevitable. Give in and let it happen.',
									'You do not belong here. Go away, this is not your world.',
									'You can\'t run forever.',
									'I can see you. You can\'t hide from me',
									'Surrender to me. You will not get away this time.',
									'Close your eyes. Embrace the eternal sleep.'
								] );
								
								let chat_ent = new sdEffect ({
									x:status_entity.for.x + ( Math.random() * 100  - Math.random() * 100 ), 
									y:status_entity.for.y + ( Math.random() * 100  - Math.random() * 100 ), 
									type:sdEffect.TYPE_CHAT,
									text:t,
									color: '#FF0000',
									voice: { 
										wordgap: 0,
										pitch: 5,
										speed: 50,
										variant: 'klatt3',
										voice: 'en'
									}
								});
								
								sdEntity.entities.push( chat_ent );
								
								break;
							}
						}
					}
				}
			},

			onBeforeRemove: ( status_entity )=>
			{
				if ( !sdWorld.is_server ) return;

				if ( status_entity.for && !status_entity.for._is_being_removed )
				{
					status_entity.for._chat_color = status_entity._first_chat_color;
					if ( status_entity.visual ) return;
					
					if ( status_entity.for._ai_enabled )
					{
						if ( status_entity._first_team !== null )
						status_entity.for._ai_team = status_entity._first_team;
					
						if ( status_entity.for._ai && status_entity.for._ai.target )
						status_entity.for._ai.target = null; // Reset current target
					
						status_entity.for._ai_force_fire = false;
					}
					// console.log ( status_entity.for._ai_team, status_entity._first_team )
				}
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
				if ( !status_entity.for )
				return;
			
				if ( status_entity.for.is( sdCharacter ) )
				if ( status_entity.for._ragdoll )
				if ( status_entity.for._ragdoll.head )
				{
					ctx.translate( status_entity.for._ragdoll.head.x - status_entity.x, status_entity.for._ragdoll.head.y - status_entity.y );
				}
				
				ctx.blend_mode = THREE.AdditiveBlending;
				ctx.globalAlpha = Math.sin( ( sdWorld.time % 1000 ) / 1000 * Math.PI );
			
				ctx.sd_color_mult_r = 1;
				ctx.sd_color_mult_g = 0;
				ctx.sd_color_mult_b = 0;
		
				ctx.drawImageFilterCache( sdStatusEffect.img_light, -32, -32, 64, 64 );
				
				/*
				ctx.font = "6px Verdana";
				ctx.textAlign = 'left';
				ctx.fillStyle = '#ff0000';
				ctx.fillText( status_entity._ttl, 16, 16 );
				*/
				
				ctx.blend_mode = THREE.NormalBlending;
				ctx.sd_color_mult_r = 1;
				ctx.sd_color_mult_g = 1;
				ctx.sd_color_mult_b = 1;
				ctx.globalAlpha = 1;
			}
		};
		
		/*sdStatusEffect.types[ sdStatusEffect.TYPE_VOID_SHARD_EFFECT = 15 ] = 
		{
			remove_if_for_removed: true,
	
			is_emote: false,
			
			is_static: true,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.t = params.t;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				status_entity.t = params.t;
				status_entity._update_version++;

				return true; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return status_entity.for.IsVisible( observer_entity );
			},
			onThink: ( status_entity, GSPEED )=>
			{
				status_entity.t -= GSPEED;
				
				if ( typeof status_entity.for.matter !== 'undefined' )
				{
					status_entity.for.matter = 0;
				}
				
				if ( typeof status_entity.for._matter !== 'undefined' )
				{
					status_entity.for._matter = 0;
				}
				
				return ( status_entity.t <= 0 ); // return true = delete
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				//ctx.filter = 'brightness(0)blur(2px)opacity(0.5)';
				ctx.sd_status_effect_tint_filter = [ 0.3,0.3,0.3 ];
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				//ctx.filter = 'none';
				ctx.sd_status_effect_tint_filter = null;
			}
		};*/
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_ASTEROID_WARNING = 16 ] = 
		{
			remove_if_for_removed: true,
			is_emote: false,
			
			is_static: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity._asteroid = params.asteroid || null;

				status_entity.x2 = 0;
				status_entity.y2 = 0;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Cancel merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				return true;
			},
			onThink: ( status_entity, GSPEED )=>
			{
				if ( sdWorld.is_server )
				{
					let ent = status_entity._asteroid;

					let for_y = status_entity.for.y;

					if ( ent && !ent._is_being_removed && !ent.landed )
					{
						status_entity.x2 = ent.x + ent.sx * Math.abs( ent.y - for_y ) / ent.sy;
						status_entity.y2 = ent.y;
					}
					else
					return true;
				}

				return false;
			},
			onBeforeRemove: ( status_entity )=>
			{
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
				ctx.apply_shading = false;

				let yy = sdWorld.camera.y - status_entity.for.y + 20 - sdRenderer.screen_height / sdWorld.camera.scale / 2;

				if ( status_entity.y2 > sdWorld.my_entity.y - 100 )
				ctx.globalAlpha = 0;
				else
				if ( status_entity.y2 > sdWorld.my_entity.y - 600 )
				ctx.globalAlpha = ( 1 + Math.sin( ( ( sdWorld.time / 75 ) % 75 ) ) ) / 2;

				ctx.translate( status_entity.x2 - status_entity.for.x, yy );

				ctx.drawImageFilterCache( sdStatusEffect.img_warning, -16,-16, 32,32 );

				ctx.globalAlpha = 1;
			}
		};

		sdStatusEffect.status_effects = [];
		
		sdStatusEffect.entity_to_status_effects = new WeakMap(); // entity => [ eff1, eff2 ... ].inversed = [ ... eff2, eff1 ]
		
		//sdStatusEffect.line_of_sight_visibility_cache = new WeakMap(); // entity => { next_update_time, result, result_soft, lx, ly }
	}
	
	static DrawEffectsFor( entity, destination, start0_end1, ctx, attached ) // destination: 0 = BG, 1 = Normal, 2 = FG
	{
		let arr = sdStatusEffect.entity_to_status_effects.get( entity );
		if ( arr !== undefined )
		{
			if ( start0_end1 === 1 )
			arr = arr.inversed;
			
			for ( let i = 0; i < arr.length; i++ )
			{
				let type = sdStatusEffect.types[ arr[ i ].type ];
				
				if ( type )
				{
					//console.warn('destination: '+destination+', start0_end1: ' + start0_end1);
		
					if ( start0_end1 === 0 )
					{
						if ( type.onBeforeEntityRender )
						type.onBeforeEntityRender( arr[ i ], ctx, attached );
					}
					else
					{
						if ( type.onAfterEntityRender )
						type.onAfterEntityRender( arr[ i ], ctx, attached );
					}
					
					// These will be drawn at zero coordinates... Proper draws will be called eventually since they are regular entities
					/*if ( destination === 0 && start0_end1 === 1 )
					if ( type.DrawBG )
					type.DrawBG( arr[ i ], ctx, attached );
			
					if ( destination === 1 && start0_end1 === 1 )
					if ( type.Draw )
					type.Draw( arr[ i ], ctx, attached );
			
					if ( destination === 2 && start0_end1 === 1 )
					if ( type.DrawFG )
					type.DrawFG( arr[ i ], ctx, attached );*/
				}
			}
		}
		
		// Line of sight test. Not the best looking one
		/*
		if ( sdWorld.my_entity )
		{
			if ( start0_end1 === 0 )
			{
				let cache = sdStatusEffect.line_of_sight_visibility_cache.get( entity );
				
				if ( !cache )
				{
					let instant = entity.is( sdEffect ) || entity.is( sdBullet );
					
					cache = { next_update_time: instant ? 0 : ( sdWorld.time + Math.random() * 100 ), result:0, result_soft:0, lx:Math.random(), ly:Math.random() };
					sdStatusEffect.line_of_sight_visibility_cache.set( entity, cache );
				}
				
				if ( cache.next_update_time < sdWorld.time )
				{
					let r = 0;
							
					let x,y;
					
					if ( cache.result === 1 )
					{
						x = cache.lx;
						y = cache.ly;
					}
					else
					{
						// Only place point on edges
						if ( Math.random() < 0.5 )
						{
							x = cache.lx = 0.01 + Math.random() * 0.98;
							y = cache.ly = 0.01 + ( Math.random() < 0.5 ? 0 : 1 ) * 0.98;
						}
						else
						{
							x = cache.lx = 0.01 + ( Math.random() < 0.5 ? 0 : 1 ) * 0.98;
							y = cache.ly = 0.01 + Math.random() * 0.98;
						}
					}
					
					//both:
					//for ( let x = 0.01; x < 1; x += 0.98 )
					//for ( let y = 0.01; y < 1; y += 0.98 )
					{
						let x2 = entity.x + entity._hitbox_x1 + x * ( entity._hitbox_x2 + entity._hitbox_x1 );
						let y2 = entity.y + entity._hitbox_y1 + y * ( entity._hitbox_y2 + entity._hitbox_y1 );
						
						let dx = x2 - sdWorld.my_entity.x;
						let dy = y2 - sdWorld.my_entity.y;
						
						let di = sdWorld.Dist2D_Vector( dx, dy );
						
						if ( di > 1 )
						{
							dx /= di;
							dy /= di;
						}
						
						di = Math.max( 0, di - 32 );
						
						dx *= di;
						dy *= di;
						
						//if ( sdWorld.CheckLineOfSight( entity.x + entity._hitbox_x1 + x * ( entity._hitbox_x2 + entity._hitbox_x1 ), entity.y + entity._hitbox_y1 + y * ( entity._hitbox_y2 + entity._hitbox_y1 ), sdWorld.my_entity.x, sdWorld.my_entity.y, entity, null, sdCom.com_visibility_unignored_classes, null ) || sdWorld.last_hit_entity === sdWorld.my_entity || sdWorld.last_hit_entity === sdWorld.my_entity.driver_of )
						if ( sdWorld.CheckLineOfSight( 
								sdWorld.my_entity.x, 
								sdWorld.my_entity.y, 
								sdWorld.my_entity.x + dx, 
								sdWorld.my_entity.y + dy, 
								sdWorld.my_entity, null, sdCom.com_vision_blocking_classes, null ) || sdWorld.last_hit_entity === entity )
						{
							r = 1;
							//break both;
						}
						//ctx.sd_status_effect_filter = { s:'000000' };
					}
					cache.result = r;
					
					if ( r )
					cache.next_update_time = sdWorld.time + 2000 + Math.random() * 1000;
					else
					cache.next_update_time = sdWorld.time + 500 + Math.random() * 500;
					
				}
				
				if ( cache.result_soft < cache.result )
				cache.result_soft = Math.min( cache.result_soft + 0.075, cache.result );
				else
				if ( cache.result_soft > cache.result )
				cache.result_soft = Math.max( cache.result_soft - 0.02, cache.result );
		
				if ( ctx.sd_status_effect_tint_filter )
				{
					ctx.sd_status_effect_tint_filter[ 0 ] *= cache.result_soft;
					ctx.sd_status_effect_tint_filter[ 1 ] *= cache.result_soft;
					ctx.sd_status_effect_tint_filter[ 2 ] *= cache.result_soft;
				}
				else
				{
					ctx.sd_status_effect_tint_filter = [ cache.result_soft, cache.result_soft, cache.result_soft ];
				}
			}
			else
			{
				ctx.sd_status_effect_tint_filter = null;
			}
		}*/
	}
	
	
	static WakeUpStatusEffectsFor( character )
	{
		// TODO: Optimzie using map (though map is delayed and can cause other issues?)
		
		for ( let i = 0; i < sdStatusEffect.status_effects.length; i++ )
		{
			if ( sdStatusEffect.status_effects[ i ].for === character )
			if ( !sdStatusEffect.status_effects[ i ]._is_being_removed )
			sdStatusEffect.status_effects[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	
	static PerformActionOnStatusEffectsOf( character, action )
	{
		// TODO: Optimzie using map (though map is delayed and can cause other issues?)
		
		for ( let i = 0; i < sdStatusEffect.status_effects.length; i++ )
		{
			if ( sdStatusEffect.status_effects[ i ].for === character )
			if ( !sdStatusEffect.status_effects[ i ]._is_being_removed )
			action( sdStatusEffect.status_effects[ i ] );
		}
	}
	
	static ApplyStatusEffectForEntity( params )
	{
		// TODO: Optimzie using map (though map is delayed and can cause other issues?)
		
		let status_effects_on_entity = sdStatusEffect.entity_to_status_effects.get( params.for );
		
		if ( status_effects_on_entity !== undefined )
		//for ( let i = 0; i < sdStatusEffect.status_effects.length; i++ )
		for ( let i = 0; i < status_effects_on_entity.length; i++ )
		{
			//let old_status = sdStatusEffect.status_effects[ i ];
			let old_status = status_effects_on_entity[ i ];
			
			//if ( old_status.for === params.for )
			{
				let status_type = sdStatusEffect.types[ old_status.type ];
		
				if ( status_type )
				{
					if ( old_status.type === params.type )
					{
						if ( status_type.onStatusOfSameTypeApplied )
						if ( status_type.onStatusOfSameTypeApplied( old_status, params ) )
						return;
					}
					else
					{
						if ( status_type.onStatusOfDifferentTypeApplied )
						if ( status_type.onStatusOfDifferentTypeApplied( old_status, params ) )
						return;
					}
				}
			}
		}
		
		let status_type = sdStatusEffect.types[ params.type ];
		
		if ( !status_type.onNotMergedAndAboutToBeMade || status_type.onNotMergedAndAboutToBeMade( params ) )
		{
			let task = new sdStatusEffect( params );
			sdEntity.entities.push( task );

			task.onThink( 0 ); // Assign .for property instantly so sdStatusEffect.entity_to_status_effects is updated in case of multiple effects are going to be applied during same frame
		}
	}
	
	static GetTemperature( e )
	{
		let status_effects_on_entity = sdStatusEffect.entity_to_status_effects.get( e );
		
		if ( status_effects_on_entity !== undefined )
		for ( let i = 0; i < status_effects_on_entity.length; i++ )
		if ( status_effects_on_entity[ i ].type === sdStatusEffect.TYPE_TEMPERATURE )
		return status_effects_on_entity[ i ].t;
		
		const temperature_normal = 20; // Copy
		
		return temperature_normal;
	}
	
	IsVisible( observer_entity )
	{
		if ( !sdWorld.is_server )
		if ( !sdWorld.is_singleplayer )
		return true; // If it was synced in first place - means it is visible. Otherwise observer map for damage won't be transferred and players won't see damage numbers
		
		let type = sdStatusEffect.types[ this.type ];
		
		if ( !this.for || this.for._is_being_removed )
		return false;
		
		if ( type )
		if ( type.IsVisible )
		return type.IsVisible( this, observer_entity );
		
		if ( this.for && !this.for._is_being_removed )
		return this.for.IsVisible( observer_entity );
	
		return false;
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === 'for' ) return true;
		
		return false;
	}
	
	GetStatusType()
	{
		return sdStatusEffect.types[ this.type ];
	}
	
	constructor( params )
	{
		super( params );
		
		//traceOnce( 'Status effect created at: ' + globalThis.getStackTrace() );
		
		this.type = params.type || 0;
		let status_type = sdStatusEffect.types[ this.type ];
		
		this._is_static = status_type ? ( ( status_type.is_static !== undefined ) ? status_type.is_static : true ) : false;
		
		this.for = params.for || null; // Target. Who has this status effect
		this._for_confirmed = false;
		
		this.remove_if_for_removed = true;
		
		if ( status_type )
		{
			if ( status_type.onMade )
			status_type.onMade( this, params );
		
			if ( status_type.remove_if_for_removed === false )
			this.remove_if_for_removed = false;
			else
			this.remove_if_for_removed = true;
		}
		
		sdStatusEffect.status_effects.push( this );
	}
	
	onServerSideSnapshotLoaded() // Something like LRT will use this to reset phase on load
	{
		this._for_confirmed = false; // Reset this one since we need to update map
		//trace( this._net_id + '._for_confirmed = false');
	}
	
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }
	
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
	}*/
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{
		return ( this._is_static === undefined ) ? true : this._is_static; 
	}
	
	IsBGEntity() // Check sdEntity for meaning
	{ return 6; }
	
	
	onRemoveAsFakeEntity()
	{
		let status_type = sdStatusEffect.types[ this.type ];
		if ( status_type.onBeforeRemove )
		status_type.onBeforeRemove( this );
		
		sdStatusEffect.status_effects.splice( sdStatusEffect.status_effects.indexOf( this ), 1 );
		
		if ( this._for_confirmed )
		if ( this.for ) // Can be null if removed, which is fine
		{
			let arr = sdStatusEffect.entity_to_status_effects.get( this.for );
			
			arr.splice( arr.indexOf( this ), 1 );
			arr.inversed.splice( arr.inversed.indexOf( this ), 1 );
		}
	}
	onBeforeRemove()
	{
		let status_type = sdStatusEffect.types[ this.type ];
		if ( status_type.onBeforeRemove )
		status_type.onBeforeRemove( this );
	
		let id0 = sdStatusEffect.status_effects.indexOf( this );
		if ( id0 !== -1 )
		sdStatusEffect.status_effects.splice( id0, 1 );
		else
		debugger;
		
		if ( this._for_confirmed )
		if ( this.for ) // Can be null if removed, which is fine
		if ( !this.for._is_being_removed )
		{
			let arr = sdStatusEffect.entity_to_status_effects.get( this.for );
			
			if ( arr === undefined )
			{
				// Should not happen but for some reason happens sometimes, for example when big bases are moved fast enough diagonally
			}
			else
			{
				let id = arr.indexOf( this );
				if ( id !== -1 ) // Happens on client side and even server-side after loading from snapshot...
				arr.splice( id, 1 );

				let id2 = arr.inversed.indexOf( this );
				if ( id2 !== -1 ) // Happens on client side and even server-side after loading from snapshot...
				arr.inversed.splice( id2, 1 );
			}
		}
	}
	IsTargetable( by_entity=null, ignore_safe_areas=false ) // Guns are not targetable when held, same for sdCharacters that are driving something
	{
		return false;
	}
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.95; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		//let isforless = false;
		
		if ( !this._for_confirmed )
		{
			let arr = sdStatusEffect.entity_to_status_effects.get( this.for );

			this._for_confirmed = true;

			if ( arr )
			{
				arr.push( this );
				arr.inversed.unshift( this );
			}
			else
			{
				if ( this.for )
				{
					arr = [ this ];
					arr.inversed = [ this ];
					sdStatusEffect.entity_to_status_effects.set( this.for, arr );
				}
			}
		}
		
		if ( this.for )
		{
			this.x = this.for.x + ( this.for._hitbox_x1 + this.for._hitbox_x2 ) / 2;
			this.y = this.for.y + ( this.for._hitbox_y1 + this.for._hitbox_y2 ) / 2;
		}

		if ( !this.for || this.for._is_being_removed )
		{
			if ( this.remove_if_for_removed )
			{
				this.remove();
				return true;
			}

			this.for = null;
			//isforless = true;
		}

		/*if ( isforless )
		{
		}
		else
		{
			this.x = this.for.x + ( this.for._hitbox_x1 + this.for._hitbox_x2 ) / 2;
			this.y = this.for.y + ( this.for._hitbox_y1 + this.for._hitbox_y2 ) / 2;
		}*/
		
		let status_type = sdStatusEffect.types[ this.type ];
		
		if ( status_type )
		{
			//if ( status_type._is_being_removed )
			//throw new Error( 'How?' );
			
			if ( this._is_being_removed )
			throw new Error( 'How?' );
			
			if ( status_type.onThink )
			if ( status_type.onThink( this, GSPEED ) )
			{
				if ( sdWorld.is_server )
				this.remove();
			
				return true;
			}
		}
		return false;
	}
	
	/*Draw( ctx, attached )
	{
		ctx.fillStyle = '#00ff00';
		ctx.fillRect( -50, -50, 100, 100 );
	}*/
	
	DrawFG( ctx, attached )
	{
		let status_type = sdStatusEffect.types[ this.type ];
		
		if ( status_type )
		if ( status_type.DrawFG )
		status_type.DrawFG( this, ctx, attached );
	}
}
export default sdStatusEffect;
