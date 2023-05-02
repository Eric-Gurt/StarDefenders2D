
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdCube from './sdCube.js';
import sdLost from './sdLost.js';
import sdCrystal from './sdCrystal.js';
import sdRescueTeleport from './sdRescueTeleport.js';
import sdCharacter from './sdCharacter.js';
import sdDrone from './sdDrone.js';
import sdTask from './sdTask.js';
import sdWeather from './sdWeather.js';
import sdRift from './sdRift.js';
import sdBlock from './sdBlock.js';
import sdFactions from './sdFactions.js';

class sdShurgConverter extends sdEntity
{
	static init_class()
	{
		sdShurgConverter.img_converter = sdWorld.CreateImageFromFile( 'shurg_converter' );

		sdShurgConverter.ents_left = 0; // Entities left to spawn, determined when event rolls in sdWeather.
		sdShurgConverter.converters = [];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -15; }
	get hitbox_x2() { return 15; }
	get hitbox_y1() { return -16; }
	get hitbox_y2() { return 16; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.hmax = 1500;
		this.hea = this.hmax;

		//this._spawn_timer = 30 * 60 * 5; // Spawn Shurg timer
		this._regen_timeout = 0; // Regen timeout;
		this.matter = 0;
		this.matter_max = 300;
		this._notify_in = 30; // Notify players of the task every second, also drains player oxygen if they're nearby

		//this._drain_entities = []; // Array which stores which players to drain oxygen from when they are close enough
		//Not needed

		sdShurgConverter.converters.push( this );

	}
	/*GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}*/
	/*GetBleedEffectFilter()
	{
		return this.filter;
	}*/
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea <= 0 && was_alive )
		{
			let spawned_ent = false;
			if ( sdShurgConverter.ents_left > 0 )
			{
				sdShurgConverter.ents_left--;
				let instances = 0;
				let instances_tot = 1;

				while ( instances < instances_tot && sdShurgConverter.converters.length < 2 ) // Spawn another Shurg converter until last one
				{
					//let points = sdShurgConverter.ents_left === 0 ? 0.25: 0;
					//let converter = new sdShurgConverter({ x:0, y:0 });

					sdWeather.SimpleSpawner({
						
						count: [ 1, 1 ],
						class: sdShurgConverter,
						params: {}
						
					});

					//sdEntity.entities.push( converter );

					/*let x,y,i;
					let tr = 1000;
					do
					{
						x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
						y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );


						if ( converter.CanMoveWithoutOverlap( x, y - 32, 0 ) )
						if ( converter.CanMoveWithoutOverlap( x, y, 0 ) )
						if ( !converter.CanMoveWithoutOverlap( x, y + 32, 0 ) )
						if ( sdWorld.last_hit_entity )
						if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND && sdWorld.last_hit_entity._natural )
						if ( !sdWorld.CheckWallExistsBox( 
								x + converter._hitbox_x1 - 16, 
								y + converter._hitbox_y1 - 16, 
								x + converter._hitbox_x2 + 16, 
								y + converter._hitbox_y2 + 16, null, null, [ 'sdWater' ], null ) )
						{
							let di_allowed = true;
									
							for ( i = 0; i < sdWorld.sockets.length; i++ )
							if ( sdWorld.sockets[ i ].character )
							{
								let di = sdWorld.Dist2D( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y );
										
								if ( di < 500 )
								{
									di_allowed = false;
									break;
								}
							}
									
							if ( di_allowed )
							{
								converter.x = x;
								converter.y = y;
								spawned_ent = true; // Successfully has space to spawn new converter, otherwise end the task and give reward points
								break;
							}
						}
								


						tr--;
						if ( tr < 0 )
							{
							converter.remove();
							converter._broken = false;
							break;
						}
					} while( true );*/

					instances++;
				}


			}

			//if ( spawned_ent === true )
			if ( sdShurgConverter.converters.length > 1 )
			{
				for ( let i = 0; i < sdTask.tasks.length; i++ ) // All tasks related to this entity will set reward to 0 since it's not the last machine of the event.
				{
					let task = sdTask.tasks[ i ];
					if ( task._target === this ) // Make sure this is the target. Maybe it should check if the mission is "destroy entity", but nothing else uses this as a task target anyway.
					task._difficulty = 0;
				}
			}
			else // If it's the last one or it didn't spawn next one due to limited space or something, end the event and reward players
			{
				for ( let i = 0; i < sdTask.tasks.length; i++ ) // All tasks related to this entity will set reward to 0.25 since it's the last machine.
				{
					let task = sdTask.tasks[ i ];
					if ( task._target === this ) // Make sure this is the target. Maybe it should check if the mission is "destroy entity", but nothing else uses this as a task target anyway.
					task._difficulty = 0.1;
				}

				{
					let x = this.x;
					let y = this.y;
					let sx = this.sx;
					let sy = this.sy;

					setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun;
					gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
					gun.extra = 0;

					//gun.sx = sx;
					//gun.sy = sy;
					sdEntity.entities.push( gun );

					}, 500 );
				}
			}

			this.remove();
		}
		
	}
	
	get mass() { return 800; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 15 );
		}
	}*/
	onThink( GSPEED ) // Class-specific, if needed
	{

		this.sy += sdWorld.gravity * GSPEED;

		if ( sdWorld.is_server )
		{
			if ( this._notify_in > 0 )
			this._notify_in -= GSPEED;
			else
			{
				this._notify_in = 60;
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
				{
					let desc;
					if ( sdShurgConverter.ents_left >= 2 )
					desc = 'The Shurgs deployed devices which drain nearby oxygen. Destroy them before the planet gets drained off of oxygen!';
					else
					if ( sdShurgConverter.ents_left !== 0 )
					desc = 'There is not many of them left, be quick now and destroy the remaining converters!';
					else
					desc = 'We located the last remaining Shurg Converter. Dispose of it, oxygen is more valuable than matter.';

					this._notify_in = 30;

					let diff = 0.001; // 0 sets it to 0.1 since it doesn't count as a parameter? It gets set to 0 when damaged enough before being destroyed if not the last one, just in case.
					if ( sdShurgConverter.ents_left === 0 )
					diff = 0.10; // Only last machine counts towards task points when destroyed, so the task is 100% complete

					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'DESTROY-'+this._net_id, 
						executer: sdWorld.sockets[ i ].character,
						target: this,
						mission: sdTask.MISSION_DESTROY_ENTITY,
						difficulty: diff * sdTask.GetTaskDifficultyScaler(),
						title: 'Destroy Shurg Converter',
						description: desc
					});
				}
			}

			this.matter = Math.min( this.matter_max, this.matter + ( GSPEED / 180 ) );

			this.MatterGlow( 0.01, 30, GSPEED );

		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{

		{
			sdEntity.TooltipUntranslated( ctx, T("Shurg Converter")+ " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )" , 0, -24 );
			this.DrawHealthBar( ctx );
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;

		//ctx.filter = this.filter;
		
		{
			ctx.drawImageFilterCache( sdShurgConverter.img_converter, 0, 0, 32, 32, - 16, - 16, 32, 32 );
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		let i = sdShurgConverter.converters.indexOf( this );
		
		if ( i !== -1 )
		sdShurgConverter.converters.splice( i, 1 );
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdShurgConverter.init_class();

export default sdShurgConverter;
