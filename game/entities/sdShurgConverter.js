
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
import sdShurgTurret from './sdShurgTurret.js';
import sdTimer from './sdTimer.js';

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
		this._ai_team = 9;
		this.should_drain_timer = 30; // Unless this is 0 or below 0, don't drain player oxyge ( sdShop bug fix )
		//this._drain_entities = []; // Array which stores which players to drain oxygen from when they are close enough
		//Not needed
		
		this._turrets = null;

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
	
	static DoSequentualSpawn( initial=true )
	{
		let converter = [];
		let turrets = [];

		sdWeather.SimpleSpawner({

			count: [ 1, 1 ],
			class: sdShurgConverter,
			store_ents: converter,
			aerial: true,
			aerial_radius: 128

		});

		if ( converter.length > 0 ) // Successful spawn?
		{
			if ( initial )
			sdShurgConverter.ents_left = 2; // 3 converters to destroy

			sdWeather.SimpleSpawner({

				count: [ 2, 2 ],
				class: sdShurgTurret,
				aerial:true,
				aerial_radius: 128,
				group_radius: 800,
				near_entity: converter[ 0 ],
				store_ents: turrets

			});
			sdWeather.SimpleSpawner({

				count: [ 3, 3 ],
				class: sdShurgTurret,
				params: { type: sdShurgTurret.TURRET_FLYING }, // 2 flying turrets
				group_radius: 400,
				near_entity: converter[ 0 ],
				aerial: true,
				store_ents: turrets

			});

			converter[ 0 ]._turrets = turrets;
			
			return true;
		}
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let was_alive = this.hea > 0;
		
		this.hea -= dmg;
		
		if ( this.hea <= 0 && was_alive )
		{
			if ( this._turrets )
			{
				for ( let i = 0; i < this._turrets.length; i++ )
				{
					let t = this._turrets[ i ];
					
					sdTimer.ExecuteWithDelay( ( timer )=>{

						if ( !t._is_being_removed )
						t.Damage( t.hea + 1, initiator );

					}, 1000 + i * 300 );
				}
				this._turrets = null;
			}
			
			let spawned_ent = false;
			if ( sdShurgConverter.ents_left > 0 )
			{
				sdShurgConverter.ents_left--;
				
				if ( sdShurgConverter.DoSequentualSpawn( false ) )
				{
					spawned_ent = true;
				}
			}

			if ( spawned_ent === true )
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
					task._difficulty = 0.2;
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
			if ( this.should_drain_timer > 0 ) // A poor bugfix implementation when admins select the converter in devtools
			this.should_drain_timer -= GSPEED; 

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
					diff = 0.15; // Only last machine counts towards task points when destroyed, so the task is 100% complete

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
			sdEntity.Tooltip( ctx, 'Depletes oxygen within range', 0, -24 + 10, '#ff0000' );
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
