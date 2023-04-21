
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
		
		sdBeacon.beacons = [];
		
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
		
		this.hea = 100 * 4;
		
		this.biometry = ( 1000 + Math.floor( Math.random() * 8999 ) ) + '';
		this.biometry_censored = '';
		
		this._owner = null;
		
		sdBeacon.beacons.push( this );
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 5 );
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
		let t = this.biometry;

		if ( sdWorld.client_side_censorship && this.biometry_censored )
		t = sdWorld.CensoredText( t );

		sdEntity.Tooltip( ctx, "Beacon", 0, -8 );
		sdEntity.TooltipUntranslated( ctx, "ID: " + t, 0, 0, '#666666' );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		ctx.drawImageFilterCache( sdBeacon.img_beacon, - 16, - 16, 32,32 );
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	onBeforeRemove() // Right when .remove() is called for the first time. This method won't be altered by build tool spawn logic
	{
		let id = sdBeacon.beacons.indexOf( this );
		if ( id !== -1 )
		sdBeacon.beacons.splice( id, 1 );
	}
	MeasureMatterCost()
	{
		return 100;
	}
	
	
	
	
	AllowContextCommandsInRestirectedAreas( exectuter_character, executer_socket ) // exectuter_character can be null
	{
		return [ 'TRACK', 'STOP' ];
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			if ( exectuter_character.canSeeForUse( this ) )
			{
				if ( command_name === 'SET_TEXT' )
				{
					if ( parameters_array.length === 1 )
					if ( typeof parameters_array[ 0 ] === 'string' )
					{
						if ( parameters_array[ 0 ].length < 100 )
						{
							this.biometry = parameters_array[ 0 ];
							this.biometry_censored = sdModeration.IsPhraseBad( parameters_array[ 0 ], executer_socket );

							executer_socket.SDServiceMessage( 'ID updated' );
						}
						else
						executer_socket.SDServiceMessage( 'Text appears to be too long' );
					}
				}
			}
			
			if ( command_name === 'TRACK' )
			{
				sdTask.MakeSureCharacterHasTask({ 
					similarity_hash:'TRACK-BEACON'+this.biometry, 
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
		{
			this.AddContextOption( 'Track this beacon', 'TRACK', [] );
			this.AddContextOption( 'Stop tracking this beacon', 'STOP', [] );
			
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			if ( exectuter_character.canSeeForUse( this ) )
			{
				this.AddPromptContextOption( 'Set an ID', 'SET_TEXT', [ undefined ], 'Enter new ID', ( sdWorld.client_side_censorship && this.biometry_censored ) ? sdWorld.CensoredText( this.biometry ) : this.biometry, 100 );
			}
		}
	}
}
export default sdBeacon;