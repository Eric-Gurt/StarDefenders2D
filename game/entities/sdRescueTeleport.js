
/* global sdShop */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCom from './sdCom.js';
import sdArea from './sdArea.js';
import sdTask from './sdTask.js';
import sdCharacter from './sdCharacter.js';


import sdRenderer from '../client/sdRenderer.js';


class sdRescueTeleport extends sdEntity
{
	static init_class()
	{
		sdRescueTeleport.img_teleport = sdWorld.CreateImageFromFile( 'rescue_portal' );
		sdRescueTeleport.img_teleport_offline = sdWorld.CreateImageFromFile( 'rescue_portal_offline' );
		sdRescueTeleport.img_teleport_no_matter = sdWorld.CreateImageFromFile( 'rescue_portal_no_matter' ); // 2 imgs

		sdRescueTeleport.img_teleport_short = sdWorld.CreateImageFromFile( 'rescue_portal_short' ); // Short range rescue teleporter, rescues up to 1200 untis in distance ( approx 3 screen widths I think )
		sdRescueTeleport.img_teleport_short_offline = sdWorld.CreateImageFromFile( 'rescue_portal_short_offline' );
		sdRescueTeleport.img_teleport_short_no_matter = sdWorld.CreateImageFromFile( 'rescue_portal_short_no_matter' ); // 2 imgs
		
		sdRescueTeleport.max_matter = 1700;
		sdRescueTeleport.max_matter_short = 500;

		sdRescueTeleport.max_short_range_distance = 1200;
		
		sdRescueTeleport.rescue_teleports = [];
		
		sdRescueTeleport.delay_1st = 30 * 60 * 3; // 3 minutes
		sdRescueTeleport.delay_2nd = 30 * 60 * 5; // 5 minutes
		
		sdRescueTeleport.delay_simple = 3 * 10; // 3 seconds

		sdRescueTeleport.TYPE_INFINITE_RANGE = 0; // Infinite range rescue teleporter
		sdRescueTeleport.TYPE_SHORT_RANGE = 1; // Short range teleporter
		
		sdRescueTeleport.players_can_build_rtps = undefined;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	static GlobalThink( GSPEED )
	{
		if ( sdWorld.is_server )
		{
			if ( sdRescueTeleport.players_can_build_rtps === undefined )
			{
				sdRescueTeleport.players_can_build_rtps = false;
				for ( let i = 0; i < sdShop.options.length; i++ )
				if ( sdShop.options[ i ]._class === 'sdRescueTeleport' )
				{
					sdRescueTeleport.players_can_build_rtps =  true;
					break;
				}
			}
			
			if ( sdRescueTeleport.players_can_build_rtps )
			{
				for ( let i = 0; i < sdWorld.sockets.length; i++ )
				{
					let character = sdWorld.sockets[ i ].character;

					if ( character )
					if ( character.hea > 0 )
					if ( character.is( sdCharacter ) )
					{
						let available_rtps = [];
						let is_suitable = [];
						
						let any_is_suitable = false;
						
						let is_deeply_within_range = false;
						
						for ( let i2 = 0; i2 < sdRescueTeleport.rescue_teleports.length; i2++ )
						{
							let rtp = sdRescueTeleport.rescue_teleports[ i2 ];
							if ( rtp.owner_biometry === character.biometry )
							{
								available_rtps.push( rtp );
								is_suitable.push( false );
							}
						}
						
						for ( let i2 = 0; i2 < available_rtps.length; i2++ )
						{
							let rtp = available_rtps[ i2 ];
							
							let range = rtp.GetRTPRange( character );
							let cost = rtp.GetRTPMatterCost( character );
							
							let suits = ( range === Infinity || sdWorld.inDist2D_Boolean( rtp.x, rtp.y, character.x, character.y, range ) ) && ( rtp.matter >= cost );
							
							if ( suits )
							{
								let t = rtp;
								if ( sdWorld.CheckLineOfSight( t.x - t._hitbox_x1, t.y + t._hitbox_y1 - character._hitbox_y2 - 1, t.x + t._hitbox_x1, t.y + t._hitbox_y1 - character._hitbox_y2 - 12, t, null, sdCom.com_vision_blocking_classes ) )
								{
									is_suitable[ i2 ] = suits;
									any_is_suitable = true;

									if ( !is_deeply_within_range )
									if ( sdWorld.inDist2D_Boolean( rtp.x, rtp.y, character.x, character.y, range - 500 ) )
									is_deeply_within_range = true;
								}
							}
						}
						
						character._has_rtp_in_range = any_is_suitable;
						
						if ( any_is_suitable )
						{
							if ( !is_deeply_within_range )
							sdTask.MakeSureCharacterHasTask({ 
								similarity_hash:'RTP-HINT', 
								executer: character,
								mission: sdTask.MISSION_GAMEPLAY_HINT,
								title: 'Rescue Teleport signal is weak',
								description: 'You are likely leaving effective range of your Rescue Teleport.'
							});
						}
						else
						{
							if ( available_rtps.length === 0 && character._score < 100 )
							sdTask.MakeSureCharacterHasTask({ 
								similarity_hash:'RTP-HINT', 
								executer: character,
								mission: sdTask.MISSION_GAMEPLAY_HINT,
								title: 'Rescue Teleport required',
								description: 'You\'ll need a Rescue Teleport to keep your chances of survival high! You\'ll need matter from crystals to both build and charge it. Use Build Tool (B key) to build.'
							});
							else
							sdTask.MakeSureCharacterHasTask({ 
								similarity_hash:'RTP-HINT', 
								executer: character,
								mission: sdTask.MISSION_GAMEPLAY_HINT,
								title: 'Rescue Teleport signal lost',
								description: 'Signal with your Rescue Teleport has been lost.'
							});
						}
					}
				}
			}
		}
	}
	
	
	
	get hitbox_x1() { return -11; }
	get hitbox_x2() { return 11; }
	get hitbox_y1() { return 10; }
	get hitbox_y2() { return 16; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
			if ( this.delay < 90 )
			this.SetDelay( 90 );
			
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	SetDelay( v )
	{
		if ( v < 0 )
		v = 0;

		if ( ( v > 0 ) !== ( this.delay > 0 ) )
		{
			if ( v === 0 )
			sdSound.PlaySound({ name:'teleport_ready', x:this.x, y:this.y, volume:1 });
		}
		
		if ( Math.ceil( v / 30 ) !== Math.ceil( this.delay / 30 ) )
		{
			this._update_version++;
		}
		
		this.delay = v;

		if ( v > 0 )
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	onMatterChanged( by=null ) // Something like sdRescueTeleport will leave hiberstate if this happens
	{
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 500 * 4;
		this._hea = this._hmax;
		this._regen_timeout = 0;

		this.type = params.type || sdRescueTeleport.TYPE_INFINITE_RANGE;
		
		//this._is_cable_priority = true;
		
		//this.delay = sdRescueTeleport.delay_1st;
		this.delay = sdRescueTeleport.delay_simple;
		//this._update_version++
		
		this._owner = params.owner || null;
		//this.owner_net_id = null;
		this.owner_title = '';
		this.owner_biometry = -1;
		
		this._matter_max = this.type === sdRescueTeleport.TYPE_INFINITE_RANGE ? sdRescueTeleport.max_matter : sdRescueTeleport.max_matter_short;
		this.matter = 0;
		
		//this.owner_net_id = this._owner ? this._owner._net_id : null;
		
		sdRescueTeleport.rescue_teleports.push( this );
	}
	GetRTPRange( character )
	{
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
		return Infinity;
	
		return sdRescueTeleport.max_short_range_distance;
	}
	GetRTPMatterCost( character )
	{
		let tele_cost = this.type === sdRescueTeleport.TYPE_INFINITE_RANGE ? sdRescueTeleport.max_matter : sdRescueTeleport.max_matter_short; // Needed so short range RTPs work

		if ( !character.is( sdCharacter ) )
		tele_cost = 100;
	
		return tele_cost;
	}
	onBuilt()
	{
		if ( this._owner )
		this.owner_biometry = this._owner.biometry;
		
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_owner' ) return true;
		
		return false;
	}
	
	MeasureMatterCost()
	{
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
		return this._hmax * sdWorld.damage_to_matter + 2000;
		else
		return this._hmax * sdWorld.damage_to_matter + 200; // 1700
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._owner )
		if ( this._owner._is_being_removed )
		this._owner = null;
	
		//this.owner_net_id = ( this._owner ) ? this._owner._net_id : null;
		//this.owner_title = ( this._owner && !this._owner._is_being_removed ) ? this._owner.title : '';
		if ( this.owner_biometry !== -1 )
		{
			if ( this._owner )
			this.owner_title = this._owner.title;
		}
		else
		this.owner_title = '';
			
		let can_hibernateA = false;
		let can_hibernateB = false;
		
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
			else
			can_hibernateA = true;
		}
		
		if ( this.matter >= this._matter_max )
		{
			if ( this.delay > 0 )
			this.SetDelay( this.delay - GSPEED );
			else
			can_hibernateB = true;
		}
		else
		can_hibernateB = true;
	
		if ( can_hibernateA && can_hibernateB )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
		}
	}
	get title()
	{
		let postfix = "  ( " + ~~(this.matter) + " / " + ~~(this._matter_max) + " )";
		
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
		{
			//if ( this.owner_title === '' )
			if ( this.owner_biometry === -1 )
			return 'Rescue teleport' + postfix;
			else
			return this.owner_title + '\'s rescue teleport' + postfix;
		}

		if ( this.type === sdRescueTeleport.TYPE_SHORT_RANGE )
		{
			//if ( this.owner_title === '' )
			if ( this.owner_biometry === -1 )
			return 'Short-range rescue teleport' + postfix;
			else
			return this.owner_title + '\'s short-range rescue teleport' + postfix;
		}

	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	Draw( ctx, attached )
	{
		if ( this.matter >= this._matter_max )
		ctx.apply_shading = false;
		
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
		{
			if ( this.matter >= this._matter_max || sdShop.isDrawing )
			{
				if ( this.delay === 0 || sdShop.isDrawing )
				ctx.drawImageFilterCache( sdRescueTeleport.img_teleport, -16, -16, 32,32 );
				else
				ctx.drawImageFilterCache( sdRescueTeleport.img_teleport_offline, -16, -16, 32,32 );
			}
			else
			{
				//ctx.drawImageFilterCache( sdRescueTeleport.img_teleport_no_matter, -16, -16, 32,32 );
				ctx.drawImageFilterCache( sdRescueTeleport.img_teleport_no_matter, ( sdWorld.time % 4000 < 2000 ? 1 : 0 )*32,0,32,32, - 16, - 16, 32,32 );
			}
		}
		if ( this.type === sdRescueTeleport.TYPE_SHORT_RANGE )
		{
			if ( this.matter >= this._matter_max || sdShop.isDrawing )
			{
				if ( this.delay === 0 || sdShop.isDrawing )
				ctx.drawImageFilterCache( sdRescueTeleport.img_teleport_short, -16, -16, 32,32 );
				else
				ctx.drawImageFilterCache( sdRescueTeleport.img_teleport_short_offline, -16, -16, 32,32 );
			}
			else
			{
				//ctx.drawImageFilterCache( sdRescueTeleport.img_teleport_short_no_matter, -16, -16, 32,32 );
				ctx.drawImageFilterCache( sdRescueTeleport.img_teleport_short_no_matter, ( sdWorld.time % 4000 < 2000 ? 1 : 0 )*32,0,32,32, - 16, - 16, 32,32 );
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	
	onRemove() // Class-specific, if needed
	{
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		let i = sdRescueTeleport.rescue_teleports.indexOf( this );
		if ( i !== -1 )
		sdRescueTeleport.rescue_teleports.splice( i, 1 );
	
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 3 );
				
			/*
			sdSound.PlaySound({ name:'block4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdRescueTeleport.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,y,a,s;
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			for ( y = step_size / 2; y < 32; y += step_size )
			if ( Math.abs( 16 - x ) > 7 && Math.abs( 16 - y ) > 7 )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}*/
		}
	}
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
			{
				if ( exectuter_character.canSeeForUse( this ) )
				{
					if ( command_name === 'RESCUE_HERE' )
					{
						//if ( this._owner === null || ( this._owner.hea || this._owner._hea ) <= 0 || this._owner._is_being_removed )
						//{
							this._owner = exectuter_character;
							this.owner_biometry = exectuter_character.biometry;

							this._update_version++;

							this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // .owner_net_id won't update without this

							executer_socket.SDServiceMessage( 'Rescue teleport is now owned by you' );
						//}
						//else
						//executer_socket.SDServiceMessage( 'Rescue teleport is owned by someone else' );
					}
					else
					if ( command_name === 'UNRESCUE_HERE' )
					{
						//if ( exectuter_character === this._owner )
						//{
							this._owner = null;
							this.owner_biometry = -1;

							this._update_version++;

							this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // .owner_net_id won't update without this

							executer_socket.SDServiceMessage( 'Rescue teleport is no longer owned' );
						//}
						//else
						//executer_socket.SDServiceMessage( 'Rescue teleport is owned by someone else' );
					}
				}
				else
				executer_socket.SDServiceMessage( 'Rescue teleport is behind wall' );
			}
			else
			executer_socket.SDServiceMessage( 'Rescue teleport is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 ) )
		if ( exectuter_character.canSeeForUse( this ) )
		{
			//if ( sdWorld.my_entity && this.owner_net_id === sdWorld.my_entity._net_id )
			if ( this.owner_biometry !== -1 )
			{
				if ( this.owner_biometry === exectuter_character.biometry )
				this.AddContextOption( 'Lose ownership', 'UNRESCUE_HERE', [] );
				else
				this.AddContextOption( 'Reset ownership', 'UNRESCUE_HERE', [] );
			}
			else
			this.AddContextOption( 'Set as personal rescue teleport', 'RESCUE_HERE', [] );
		}
	}
}
//sdRescueTeleport.init_class();

export default sdRescueTeleport;