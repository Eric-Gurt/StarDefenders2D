
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

class sdTzyrgAbsorber extends sdEntity
{
	static init_class()
	{
		sdTzyrgAbsorber.img_absorber = sdWorld.CreateImageFromFile( 'tzyrg_quake_absorber' );

		sdTzyrgAbsorber.absorbers = [];
	
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -13; }
	get hitbox_x2() { return 13; }
	get hitbox_y1() { return -19; }
	get hitbox_y2() { return 13; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;

		this.hmax = 7500;
		this.hea = this.hmax;
		//this.detonation_in = params.detonation_in || 30 * 60 * 15; // 15 minutes until the bomb explodes
		this._spawn_timer = 30 * 60 * 5; // Spawn Tzyrgs timer
		this._regen_timeout = 0; // Regen timeout;
		this._notify_players = 0;

		sdTzyrgAbsorber.absorbers.push( this );

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
				{
					let x = this.x;
					let y = this.y;
					let sx = this.sx;
					let sy = this.sy;

					setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

					let gun;
					gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
					gun.extra = 1;

					//gun.sx = sx;
					//gun.sy = sy;
					sdEntity.entities.push( gun );

					}, 500 );
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
			if ( this._notify_players > 0 )
			this._notify_players -= GSPEED;
			else
			{
				for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be destroyed
				if ( sdWorld.sockets[ i ].character )
				{
					let di = sdWorld.Dist2D( this.x, this.y, sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y );
					if ( di < 600 )
					{
						let desc;
						desc = 'You located a strange Tzyrg device. Maybe it is best to destroy it since the Tzyrgs are hostile to us, right?';
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'DESTROY-'+this._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: this,
							mission: sdTask.MISSION_DESTROY_ENTITY,
							difficulty: 0.07 * sdTask.GetTaskDifficultyScaler(),
							title: 'Destroy a Tzyrg device',
							description: desc
						});
					}
				}
				this._notify_players = 60;
			}

			if ( this._spawn_timer > 0 )
			this._spawn_timer -= GSPEED;
			else
			{
				this._spawn_timer = 30 * 60 * 5; // Not too frequent spawns of tzyrg faction when the absorber is present
				sdWorld.entity_classes.sdWeather.only_instance.ExecuteEvent( 35 ); // Spawn some Tzyrgs in the world
			}
		}
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	DrawHUD( ctx, attached ) // foreground layer
	{

		{
			sdEntity.TooltipUntranslated( ctx, T("Tzyrg device"), 0, -24 );
			this.DrawHealthBar( ctx );
		}
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = true;

		//ctx.filter = this.filter;
		
		{
			ctx.drawImageFilterCache( sdTzyrgAbsorber.img_absorber, 0, 0, 64, 64, - 32, - 32, 64, 64 );
			//ctx.drawImageFilterCache( sdTzyrgAbsorber.img_absorber, - 32, - 32, 64, 64 );
		}
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		let i = sdTzyrgAbsorber.absorbers.indexOf( this );
		
		if ( i !== -1 )
		sdTzyrgAbsorber.absorbers.splice( i, 1 );

		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 30, 3, 0.75, 0.75 );
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdTzyrgAbsorber.init_class();

export default sdTzyrgAbsorber;
