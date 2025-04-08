
/* global sdShop, Infinity */

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCom from './sdCom.js';
import sdArea from './sdArea.js';
import sdTask from './sdTask.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';

import sdRenderer from '../client/sdRenderer.js';


class sdRescueTeleport extends sdEntity
{
	static init_class()
	{
		sdRescueTeleport.img_rescue_teleport_sheet = sdWorld.CreateImageFromFile( 'sdRescueTeleport' );
		
		/*sdRescueTeleport.img_teleport = sdWorld.CreateImageFromFile( 'rescue_portal' );
		sdRescueTeleport.img_teleport_offline = sdWorld.CreateImageFromFile( 'rescue_portal_offline' );
		sdRescueTeleport.img_teleport_no_matter = sdWorld.CreateImageFromFile( 'rescue_portal_no_matter' ); // 2 imgs

		sdRescueTeleport.img_teleport_short = sdWorld.CreateImageFromFile( 'rescue_portal_short' ); // Short range rescue teleporter, rescues up to 1200 untis in distance ( approx 3 screen widths I think )
		sdRescueTeleport.img_teleport_short_offline = sdWorld.CreateImageFromFile( 'rescue_portal_short_offline' );
		sdRescueTeleport.img_teleport_short_no_matter = sdWorld.CreateImageFromFile( 'rescue_portal_short_no_matter' ); // 2 imgs
		*/
		sdRescueTeleport.max_matter = 1700;
		sdRescueTeleport.max_matter_short = 400;
		sdRescueTeleport.max_matter_cloner = 40000 * 3; // 40k can be charged rather quickly. It is a last resort escape thing after all.
		sdRescueTeleport.max_matter_respawn_point = 100;
		
		sdRescueTeleport.clonning_time = 30 * 60 * 3;// 3 minutes

		sdRescueTeleport.max_short_range_distance = 2400;
		sdRescueTeleport.max_default_range_distance = 10000;
		
		sdRescueTeleport.rescue_teleports = [];
		
		sdRescueTeleport.global_think_next = 0;
		
		//sdRescueTeleport.delay_1st = 30 * 60 * 3; // 3 minutes
		//sdRescueTeleport.delay_2nd = 30 * 60 * 5; // 5 minutes
		
		sdRescueTeleport.delay_simple = 3 * 10; // 3 seconds
		
		//sdRescueTeleport.delay_cloner = 30 * 60 * 30; // 30 minutes

		sdRescueTeleport.TYPE_INFINITE_RANGE = 0; // Infinite range rescue teleporter
		sdRescueTeleport.TYPE_SHORT_RANGE = 1; // Short range teleporter
		sdRescueTeleport.TYPE_CLONER = 2; // Long recharge, high cost, but can respawn in case player was lost
		sdRescueTeleport.TYPE_RESPAWN_POINT = 3; // Same as cloner, but instantly. Resets player's level and items.
		
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
				if ( sdShop.options[ i ].type !== sdRescueTeleport.TYPE_RESPAWN_POINT )
				{
					sdRescueTeleport.players_can_build_rtps =  true;
					break;
				}
			}
			
			if ( sdRescueTeleport.players_can_build_rtps )
			{
				if ( sdWorld.time > sdRescueTeleport.global_think_next )
				{
					sdRescueTeleport.global_think_next = sdWorld.time + 1000;
					
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

								//let suits = ( range === Infinity || sdWorld.inDist2D_Boolean( rtp.x, rtp.y, character.x, character.y, range ) ) && ( rtp.matter >= cost );
								let suits = !rtp.IsCloner() && ( range === Infinity || sdWorld.inDist2D_Boolean( rtp.x, rtp.y, character.x, character.y, range ) ) && ( rtp.matter >= cost );

								// Warn about cloner-only RTPs being available

								if ( suits )
								{
									//let t = rtp;
									if ( rtp.GetRTPPotentialPlayerPlacementTestResult( character ) )
									//if ( sdWorld.CheckLineOfSight( t.x - t._hitbox_x1, t.y + t._hitbox_y1 - character._hitbox_y2 - 1, t.x + t._hitbox_x1, t.y + t._hitbox_y1 - character._hitbox_y2 - 12, t, null, sdCom.com_vision_blocking_classes ) )
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
	}
	
	IsCloner()
	{
		return ( this.type === sdRescueTeleport.TYPE_CLONER );
	}
	
	IsVehicle()
	{
		return ( this.type === sdRescueTeleport.TYPE_CLONER );
	}
	AddDriver( c, force=false )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( force )
		if ( !this.driver0 )
		{
			this.driver0 = c;

			c.driver_of = this;
			
			this.cloning_progress = 0;
			
			this.SetDelay( 90 );
		}
	}
	
	ExcludeDriver( c, force=false )
	{
		if ( !sdWorld.is_server )
		return;

		if ( force )
		if ( this.driver0 === c )
		{
			this.SetDelay( 90 );
			
			this.driver0 = null;
			
			if ( !c._is_being_removed )
			{
				c.driver_of = null;
			
				c.x = this.x;
				c.y = this.y;

				if ( this.cloning_progress >= sdRescueTeleport.clonning_time )
				{
					if ( c.CanMoveWithoutOverlap( this.x + this.hitbox_x1 - c.hitbox_x2, c.y, 1 ) )
					c.x = this.x + this.hitbox_x1 - c.hitbox_x2;
					else
					if ( c.CanMoveWithoutOverlap( this.x + this.hitbox_x2 - c.hitbox_x1, c.y, 1 ) )
					c.x = this.x + this.hitbox_x2 - c.hitbox_x1;
				}
				else
				{
					//if ( this._rescuing_from_lost_effect )
					//{
						c.remove();
					//}
					/*else No because it causes abuse of cloner in a way where player could get into cloner and then to short range teleports - effectively RTP-ing for free after dying far from the base
					{
						if ( !c.AttemptTeleportOut( null, false ) )
						{
							this.AddDriver( c, true );
							return false;
						}
						//c.Damage( c.hea + 1, null, false, false ); // Send player to some else RTP
					}*/
				}
			}
			return false;
		}
		
		return false;
	}
	
	onRescued( c )
	{
		/*if ( this.type === sdRescueTeleport.TYPE_RESPAWN_POINT )
		{
			if ( c._save_file )
			{
				let player_settings = c._save_file;
				let character_entity = c;
				
				// Spawn starter items based off what player wants to spawn with
				let guns = [ sdGun.CLASS_BUILD_TOOL, sdGun.CLASS_MEDIKIT, sdGun.CLASS_CABLE_TOOL, sdGun.CLASS_PISTOL ];

				if ( player_settings.start_with1 )
				guns.unshift( sdGun.CLASS_SWORD );
				else
				if ( player_settings.start_with2 )
				guns.unshift( sdGun.CLASS_SHOVEL );

				if ( character_entity.is( sdCharacter ) )
				for ( var i = 0; i < sdGun.classes.length; i++ )
				if ( guns.indexOf( i ) !== -1 )
				{
					let gun = new sdGun({ x:character_entity.x, y:character_entity.y, class: i });
					sdEntity.entities.push( gun );

					character_entity.onMovementInRange( gun );
				}

				character_entity.gun_slot = 1;
			}
		}*/
	}
	
	get hitbox_x1() { return ( this.type === sdRescueTeleport.TYPE_CLONER ) ? -8 : -11; }
	get hitbox_x2() { return ( this.type === sdRescueTeleport.TYPE_CLONER ) ? 8 : 11; }
	get hitbox_y1() { return ( this.type === sdRescueTeleport.TYPE_CLONER ) ? -15 : 10; }
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

		this._time_amplification = 0;
		
		this.type = params.type || sdRescueTeleport.TYPE_INFINITE_RANGE;
		
		this._hmax = 500 * 4;
		
		if ( this.type === sdRescueTeleport.TYPE_CLONER )
		this._hmax = 500;
		
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		
		//this._is_cable_priority = true;
		
		//this.delay = sdRescueTeleport.delay_1st;
		this.delay = sdRescueTeleport.delay_simple;
		//this._update_version++
		
		this.driver0 = null;
		this.cloning_progress = 0;
		//this._rescuing_from_lost_effect = false; Always true
		
		this._owner = params.owner || null;
		//this.owner_net_id = null;
		this.owner_title = '';
		this.owner_biometry = -1;
		this._owner_hash = null; // Used by respawn points
		
		this.UpdateMaxMatter(); // Update max matter so old snapshots are updated
		/*this._matter_max = 
			this.type === sdRescueTeleport.TYPE_INFINITE_RANGE ? sdRescueTeleport.max_matter : 
			this.type === sdRescueTeleport.TYPE_CLONER ? sdRescueTeleport.max_matter_cloner : 
			sdRescueTeleport.max_matter_short;*/
	
		this.matter = 100; // When built it now has 100 starting matter so the first charge is easier to achieve
		
		this.allowed = true;
		
		//this.owner_net_id = this._owner ? this._owner._net_id : null;
		
		sdRescueTeleport.rescue_teleports.push( this );
	}
	UpdateMaxMatter()
	{
		this._matter_max = 
			this.type === sdRescueTeleport.TYPE_INFINITE_RANGE ? sdRescueTeleport.max_matter : 
			this.type === sdRescueTeleport.TYPE_CLONER ? sdRescueTeleport.max_matter_cloner : 
			this.type === sdRescueTeleport.TYPE_RESPAWN_POINT ? sdRescueTeleport.max_matter_respawn_point : 
			sdRescueTeleport.max_matter_short;
	}
	onSnapshotApplied() // To override
	{
		this.UpdateMaxMatter();
	}
	GetRTPRange( character )
	{
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
		return sdRescueTeleport.max_default_range_distance;
	
		if ( this.type === sdRescueTeleport.TYPE_CLONER )
		return Infinity;
	
		if ( this.type === sdRescueTeleport.TYPE_RESPAWN_POINT )
		return -1; // Essentially always skipped in sdCharacter logic. These are only used at server's full respawn logic
	
		return sdRescueTeleport.max_short_range_distance;
	}
	GetRTPMatterCost( character )
	{
		let tele_cost = 
			this.type === sdRescueTeleport.TYPE_INFINITE_RANGE ? sdRescueTeleport.max_matter : 
			this.type === sdRescueTeleport.TYPE_CLONER ? sdRescueTeleport.max_matter_cloner : 
			sdRescueTeleport.max_matter_short; // Needed so short range RTPs work

		if ( !character.is( sdCharacter ) )
		tele_cost = 100;
	
		if ( this.type === sdRescueTeleport.TYPE_RESPAWN_POINT )
		tele_cost = sdRescueTeleport.max_matter_respawn_point;
	
		return tele_cost;
	}
	GetRTPPotentialPlayerPlacementTestResult( character )
	{
		if ( this.IsCloner() )
		return true;
	
		const t = this;
		
		return ( sdWorld.CheckLineOfSight( t.x - t._hitbox_x1, t.y + t._hitbox_y1 - character._hitbox_y2 - 1, t.x + t._hitbox_x1, t.y + t._hitbox_y1 - character._hitbox_y2 - 12, t, null, sdCom.com_vision_blocking_classes ) );
	}
	onBuilt()
	{
		if ( this._owner )
		{
			this.owner_biometry = this._owner.biometry;
			this._owner_hash = this._owner._my_hash;
		}
		
	}
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_owner' ) return true;
		
		return false;
	}
	
	MeasureMatterCost()
	{
		if ( this.type === sdRescueTeleport.TYPE_RESPAWN_POINT )
		return this._hmax * sdWorld.damage_to_matter + 200; 
		
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE || this.type === sdRescueTeleport.TYPE_CLONER )
		return this._hmax * sdWorld.damage_to_matter + 2000;
		else
		return this._hmax * sdWorld.damage_to_matter + 200; // 1700
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;
	
		GSPEED = sdGun.HandleTimeAmplification( this, GSPEED );
	
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
	
		this.allowed = sdWorld.server_config.allow_rescue_teleports && ( sdWorld.server_config.allowed_rescue_teleports === null || sdWorld.server_config.allowed_rescue_teleports.indexOf( this.type ) !== -1 );
	
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
		
		if ( this.driver0 && this.driver0._is_being_removed )
		this.ExcludeDriver( this.driver0, true );
		
		let cloner_sequence_active = this.IsCloner() && this.driver0;
		
		if ( this.matter >= this._matter_max || cloner_sequence_active )
		{
			if ( this.delay > 0 )
			{
				//if ( this.type === sdRescueTeleport.TYPE_CLONER && this.driver0 )
				if ( cloner_sequence_active )
				{
					// Pause delay when someone's in
					
					let delta = GSPEED * this._matter_max / sdRescueTeleport.clonning_time * 0.9; // Consider accuracy error
					
					if ( this.matter - delta >= 0 )
					{
						this.matter -= delta;
						
						this.cloning_progress = this.cloning_progress + GSPEED;

						if ( this.cloning_progress >= sdRescueTeleport.clonning_time )
						{
							this.ExcludeDriver( this.driver0, true );
						}
						
						this._update_version++;
					}
				}
				else
				this.SetDelay( this.delay - GSPEED );
			}
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
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
		return 'Rescue teleport';

		if ( this.type === sdRescueTeleport.TYPE_SHORT_RANGE )
		return 'Short-range rescue teleport';

		if ( this.type === sdRescueTeleport.TYPE_CLONER )
		return 'Rescue cloner';

		if ( this.type === sdRescueTeleport.TYPE_RESPAWN_POINT )
		return 'Respawn point';
	}
	get description()
	{
		if ( this.type === sdRescueTeleport.TYPE_INFINITE_RANGE )
		return 'Don\'t you hate dying? This rescue teleport can teleport you back to it when you are in critical state, essentially saving you in exchange for '+sdRescueTeleport.max_matter+' matter. Works on long ranges but still has limited range. It makes sense to wire this rescue teleport to matter amplifiers using cable management tool.';

		if ( this.type === sdRescueTeleport.TYPE_SHORT_RANGE )
		return 'Don\'t you hate dying? This rescue teleport can teleport you back to it when you are in critical state, essentially saving you in exchange for '+sdRescueTeleport.max_matter_short+' matter. Only works on short ranges, will be prioritized. It makes sense to wire this rescue teleport to matter amplifiers using cable management tool.';

		if ( this.type === sdRescueTeleport.TYPE_CLONER )
		return 'Prints a new you in case you die. Costs a lot of matter and 20 minutes to fully restore you. Your items won\'t be kept, only upgrades. It makes sense to wire this cloner to matter amplifiers using cable management tool.';
	
		if ( this.type === sdRescueTeleport.TYPE_RESPAWN_POINT )
		return 'This is a respawn point. It does not save you from dying, but will bring you back to your base with no items nor score.';
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	VehicleHidesLegs()
	{
		return false;
	}
	
	Draw( ctx, attached )
	{
		let xx = 0;
		let yy = this.type;
		
		if ( this.allowed && ( this.matter >= this._matter_max || sdShop.isDrawing || ( this.driver0 && this.matter > this._matter_max * 0.05 ) ) )
		{
			ctx.apply_shading = false;
			
			if ( this.delay === 0 || sdShop.isDrawing )
			xx = 0;
			else
			xx = 1;
		}
		else
		xx = ( sdWorld.time % 4000 < 2000 ? 2 : 3 );
	
		for ( var i = 0; i < 1; i++ )
		{
			if ( this[ 'driver' + i ] )
			{
				ctx.save();
				{
					ctx.globalAlpha = this.cloning_progress / sdRescueTeleport.clonning_time;
					//let old_x = this[ 'driver' + i ].look_x;
					//let old_y = this[ 'driver' + i ].look_y;

					//this[ 'driver' + i ]._side = 1;
					//this[ 'driver' + i ].look_x = this[ 'driver' + i ].x + 100;
					//this[ 'driver' + i ].look_y = this[ 'driver' + i ].y;

					ctx.scale( 0.7, 0.7 );

					//ctx.translate( 0, 0 );

					this[ 'driver' + i ].Draw( ctx, true );

					//this[ 'driver' + i ].look_x = old_x;
					//this[ 'driver' + i ].look_y = old_y;
				}
				ctx.restore();
			}
		}
	
		ctx.drawImageFilterCache( sdRescueTeleport.img_rescue_teleport_sheet, xx*32,yy*32,32,32, -16,-16,32,32 );
		
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.allowed )
		{
			let postfix;

			if ( this.driver0 )
			postfix = " ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this._matter_max) + ", " + T("cloning") + " "+(~~Math.min( 100, this.cloning_progress / sdRescueTeleport.clonning_time * 100 ))+"% )";
			else
			postfix = "  ( " + sdWorld.RoundedThousandsSpaces(this.matter) + " / " + sdWorld.RoundedThousandsSpaces(this._matter_max) + " )";

			if ( this.owner_biometry === -1 )
			sdEntity.TooltipUntranslated( ctx, T( this.title ) + postfix );
			else
			sdEntity.TooltipUntranslated( ctx, this.owner_title + T( '\'s ' + this.title.toLowerCase() ) + postfix );
		}
		else
		sdEntity.Tooltip( ctx, this.title + ' ( disabled on this server )' );
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
	
		if ( this.driver0 )
		this.ExcludeDriver( this.driver0, true );
	
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shope
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 3 );
				
			/*
			sdSound.PlaySound({ name:'blockB4', 
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
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			{
				if ( exectuter_character.canSeeForUse( this ) )
				{
					if ( this.type === sdRescueTeleport.TYPE_CLONER && this.driver0 )
					{
						if ( this.driver0 !== exectuter_character )
						{
							if ( command_name === 'SABOTAGE' )
							{
								this.ExcludeDriver( this.driver0, true );
							}
						}
						else
						{
							if ( command_name === 'CANCEL' )
							{
								//if ( this._rescuing_from_lost_effect )
								//{
									executer_socket.SDServiceMessage( 'Your previous body does no longer exist. Cloning procedure needs to be completed. Does anyone have "Area amplifier" device?' );
								/*}
								else
								{
									if ( !this.ExcludeDriver( this.driver0, true ) )
									executer_socket.SDServiceMessage( 'No other rescue devices were found' );
								}*/
							}
						}
					}
					
					if ( command_name === 'RESCUE_HERE' )
					{
						//if ( this._owner === null || ( this._owner.hea || this._owner._hea ) <= 0 || this._owner._is_being_removed )
						//{
							this._owner = exectuter_character;
							this.owner_biometry = exectuter_character.biometry;
							this._owner_hash = exectuter_character._my_hash;

							this._update_version++;

							this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // .owner_net_id won't update without this

							executer_socket.SDServiceMessage( this.title+' is now owned by you' );
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
							this._owner_hash = null;

							this._update_version++;

							this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // .owner_net_id won't update without this

							executer_socket.SDServiceMessage( this.title+' is no longer owned' );
						//}
						//else
						//executer_socket.SDServiceMessage( 'Rescue teleport is owned by someone else' );
					}
				}
				else
				executer_socket.SDServiceMessage( this.title+' is behind wall' );
			}
			else
			executer_socket.SDServiceMessage( this.title+' is too far' );
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
			if ( this.type === sdRescueTeleport.TYPE_CLONER && this.driver0 )
			{
				if ( this.driver0 !== exectuter_character )
				this.AddContextOption( 'Sabotage cloning', 'SABOTAGE', [] );
				else
				this.AddContextOption( 'Continue at rescue teleport instead', 'CANCEL', [] );
			}
			
			//if ( sdWorld.my_entity && this.owner_net_id === sdWorld.my_entity._net_id )
			if ( this.owner_biometry !== -1 )
			{
				if ( this.owner_biometry === exectuter_character.biometry )
				this.AddContextOption( 'Lose ownership', 'UNRESCUE_HERE', [] );
				else
				this.AddContextOption( 'Reset ownership', 'UNRESCUE_HERE', [] );
			}
			else
			this.AddContextOption( 'Set as personal '+this.title, 'RESCUE_HERE', [] );
		}
	}
}
//sdRescueTeleport.init_class();

export default sdRescueTeleport;