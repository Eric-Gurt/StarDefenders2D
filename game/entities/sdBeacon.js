
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdTask from './sdTask.js';

class sdBeacon extends sdEntity
{
	static init_class()
	{
		sdBeacon.img_beacon = sdWorld.CreateImageFromFile( 'beacon' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return -3; }
	get hitbox_y2() { return 3; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hea = 100;
		
		this.biometry = 1000 + Math.floor( Math.random() * 8999 );
		
		this._owner = null;
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.Damage( ( vel - 4 ) * 5 );
		}
	}
	Impulse( x, y )
	{
		this.sx += x * 0.03;
		this.sy += y * 0.03;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		let old_hp = this.hea;
	
		this.hea -= Math.abs( dmg );
		
		if ( this.hea <= 0 )
		if ( old_hp > 0 )
		sdSound.PlaySound({ name:'sd_beacon_disarm', x:this.x, y:this.y, pitch: 2, volume:1 });
		
		if ( this.hea <= 0 )
		{
			this.remove();
		}
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Beacon" );
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdBeacon.img_beacon, - 16, - 16, 32,32 );
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	MeasureMatterCost()
	{
		return 100;
	}
	
	
	
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( command_name === 'TRACK' )
			{
				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'TRACK-'+this.biometry, 
					executer: exectuter_character,
					target: this,
					mission: sdTask.MISSION_TRACK_ENTITY,

					title: 'Tracking beacon',
					description: 'Beacon ID: ' + this.biometry
				});
			}
			
			if ( command_name === 'STOP' )
			{
				for ( let i = 0; i < sdTask.tasks.length; i++ )
				{
					if ( sdTask.tasks[ i ]._executer === exectuter_character )
					if ( sdTask.tasks[ i ]._target === this )
					{
						sdTask.tasks[ i ].remove();
					}
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
			this.AddContextOption( 'Track this beacon ('+this.biometry+')', 'TRACK', [] );
			this.AddContextOption( 'Stop tracking this beacon', 'STOP', [] );
		}
	}
}
export default sdBeacon;