/*

	Part of a task that makes you carry this thing and scan blocks for cookies.

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdVirus from './sdVirus.js';
import sdQuickie from './sdQuickie.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdStatusEffect from './sdStatusEffect.js';

import sdRenderer from '../client/sdRenderer.js';

class sdLandScanner extends sdEntity
{
	static init_class()
	{
		sdLandScanner.img_unit = sdWorld.CreateImageFromFile( 'land_scanner' );
		
		sdLandScanner.all_scan_units = [];

		sdLandScanner.scan_distance = 64;
		
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -7; }
	get hitbox_x2() { return 7; }
	get hitbox_y1() { return -12; }
	get hitbox_y2() { return 16; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }

	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	

	Impact( vel ) // fall damage basically
	{
		// No impact damage if has driver (because no headshot damage)
		if ( vel > 5 )
		{
			this.DamageWithEffect( ( vel - 3 ) * 25 );
		}
	}
	RequireSpawnAlign() 
	{ return false; }

	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 500 * 4;
		this.hea = this.hmax;
		//this._hmax_old = this.hmax;
		this.regen_timeout = 0;
		this.scan_timer = 0;
		this._next_beep = 20; // for beep sfx
		//this._scanned_entities = []; The issue here is that world snapshot has no information whether some array is an array of objects or numbers or strings, or non-entity objects (it checks only top-level properties of each entity). Because of that it just runs JSON.stringify on them and would throw an infinite recursion error if array contains sdEntity kinds of entities. Store just _net_id-s whenever possible in cases like these -- Eric Gurt
		this._scanned_entity_net_ids = [];
		this.enabled = false;
		this.charge = 0;
		this.matter_max = 500;
		this.matter = 0;
		this.scanned_ents = 0; // How many unique dirt has this scanner scanned?
		this._removed_in = params.removed_in || 30 * 60 * 15; // 15 minutes until it destroys since it's a task only entity, or less depending on when player claims the entity
		
		this._intel_receiver = null;
		//this._last_shield_sound_played = 0;
		// 1 slot
		
		sdLandScanner.all_scan_units.push( this );
	}
	ExtraSerialzableFieldTest( prop )
	{
		//return ( prop === '_scanned_entities' );
		return ( prop === '_scanned_entity_net_ids' );
	}
				

	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = Math.abs( dmg );
		
		
		//let old_hea = this.hea;
		
		this.hea -= dmg;

		if ( this.hea <= 0 )
		this.remove();
	
		this.regen_timeout = 30;

	}
	SetScanState( enable=false )
	{
		if ( enable === this.enabled )
		{
			return;
		}
		
		if ( this.matter < 100 && !this.enabled )
		return;
		this.enabled = enable;
		if ( !this.enabled ) // Disabled protected blocks and doors
		{
			sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:1, pitch:1.5 });
		}

		if ( this.enabled ) // Scan unprotected blocks and fortify them
		{
			//sdSound.PlaySound({ name:'overlord_cannon3', x:this.x, y:this.y, volume:2, pitch:1.75 });
			sdSound.PlaySound({ name:'tzyrg_fire', x:this.x, y:this.y, volume:0.5, pitch:3 });
			
			this._next_beep = 0;
		}
		//this.matter = 0;
	}
	get mass() { return 35; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this._removed_in -= GSPEED;
		if ( this._removed_in < 0 )
		this.remove();

		if ( this.enabled )
		{
			if ( sdWorld.is_server )
			{
				if ( this.charge < 100 )
				this.charge = Math.min( 100, this.charge + GSPEED * 1 );

				this._next_beep -= GSPEED;
				if ( this._next_beep < 0 )
				{
					this._next_beep = 30;
					sdSound.PlaySound({ name:'council_teleport', x:this.x, y:this.y, volume:0.2, pitch:6 * ( 1 + this.charge / 300 ) });
				}

				if ( this.charge >= 100 )
				{
					let blocks = sdWorld.GetAnythingNear( this.x, this.y + 76, sdLandScanner.scan_distance, null, [ 'sdBlock' ] );
					
					
					for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
					{
						if ( blocks[ i ].DoesRegenerate() || blocks[ i ]._merged )
						{
							if ( this._intel_receiver )
							if ( blocks[ i ]._contains_class )
							blocks[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c:[ 2, 2, 2 ], observer: this._intel_receiver });

							let scanned_before = false;
							for ( let j = 0; j < this._scanned_entity_net_ids.length; j++ )
							{
								if ( blocks[ i ]._net_id === this._scanned_entity_net_ids[ j ] ) // Has this block been scanned before by this land scnaner?
								scanned_before = true;
							}
							if ( scanned_before === false && this.scanned_ents < 350 ) // 350 is max capacity
							{
								if ( blocks[ i ]._merged ) // Merged blocks should probably just count all the merged blocks
								this.scanned_ents = Math.min( 350, this.scanned_ents + Math.round( blocks[ i ].height / 16 ) );
								else
								this.scanned_ents++;
							
								this._scanned_entity_net_ids.push( blocks[ i ]._net_id );
							}
						}
					}
					this.matter = Math.max( 0, this.matter - 100 );
					this.charge = 0;
					this.SetScanState();
				}
			}
		}
		else
		{
			this.charge = 0;
		}

		this.sy += sdWorld.gravity * GSPEED;

		this.ApplyVelocityAndCollisions( GSPEED, 0, true );	
	}

	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea <= 0 )
		return;
	
		sdEntity.TooltipUntranslated( ctx, T("Land scanner") + " ( " + ~~(this.matter) + " / " + ~~(this.matter_max) + " )", 0, -6 );
		sdEntity.TooltipUntranslated( ctx, T("Scan data capacity") + ": " + ~~( this.scanned_ents * 100 / 350 ) +"%",0, 2 );

		let w = 30;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		
		this.DrawConnections( ctx );
	}

	DrawConnections( ctx )
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;

		ctx.beginPath();
		ctx.arc( 0, 76, sdLandScanner.scan_distance, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}

	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		ctx.drawImageFilterCache( sdLandScanner.img_unit, (this.charge % 20 < 10 ) ? 0 : 32, 0, 32, 32, - 16, - 16, 32,32 );
		//ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
		
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		this.SetScanState( false );
		
		let id = sdLandScanner.all_scan_units.indexOf( this );
		if ( id !== -1 )
		sdLandScanner.all_scan_units.splice( id, 1 );
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return Infinity;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
			{
				if ( command_name === 'SCAN_DIRT' )
				{
					{
						if ( this.matter >= 100 )
						{
							this._intel_receiver = exectuter_character;
							this.SetScanState( true );
						}
						else
						executer_socket.SDServiceMessage( 'Land scanner needs at least 100 matter' );
					}
				}
			}
			else
			executer_socket.SDServiceMessage( 'Land scanner is too far' );
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
			if ( sdWorld.my_entity )
			{
				if ( this.enabled === false )
				this.AddContextOption( 'Scan nearby ground (100 matter)', 'SCAN_DIRT', [] );
			}
		}
	}
}
//sdLandScanner.init_class();

export default sdLandScanner;
