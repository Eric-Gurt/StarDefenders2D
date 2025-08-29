/*

	- Matter cables
	- Air cables (0-oxygen planets)
	- Something else cables




*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdArea from './sdArea.js';
import sdPlayerDrone from './sdPlayerDrone.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdBlock from './sdBlock.js';


import sdRenderer from '../client/sdRenderer.js';


class sdCable extends sdEntity
{
	static init_class()
	{
		sdCable.max_distance = 200; // Same as for sdCom, at least for now
		/*
		sdCable.colors = [ // color, opacity, width
			'#000000', 0.5, 0.25, // any
			'#000000', 0.8, 0.5, // matter
			'#00ff00', 0.4, 0.7, // wireless
			'#161617', 0.8, 1, // liquid, dark
			'#752e2e', 1, 0.5, // io1, red
			'#497d49', 1, 0.5, // io2, green
			'#4a5768', 1, 0.5 // io3, blue
		];*/
		sdCable.type_properties = [];
		
		sdCable.type_properties[ sdCable.TYPE_ANY = 0 ] = null; // Any type will list all connected entities
		
		sdCable.type_properties[ sdCable.TYPE_MATTER = 1 ] = {
			color: '#000000', 
			opacity: 0.8, 
			width: 0.5,
			max_distance: 200
		};
		
		sdCable.type_properties[ sdCable.TYPE_WIRELESS = 2 ] = {
			color: '#00ff00', 
			opacity: 0.4, 
			width: 0.7,
			max_distance: 2000,
			
			by_node_variation:
			[
				'#00ff00',
				'#ff0000',
				'#0000ff',
				'#ffffff',
				'#00ffff',
				'#ffff00'
			]
		};
		
		sdCable.type_properties[ sdCable.TYPE_LIQUID = 3 ] = {
			color: '#161617', 
			opacity: 0.8, 
			width: 1,
			max_distance: 200
		};
		
		sdCable.TYPE_LAST = sdCable.type_properties.length;
		
		sdCable.attacheable_entities = [
			'sdMatterContainer',
			'sdMatterAmplifier',
			'sdDoor',
			'sdTurret',
			'sdCom',
			'sdRescueTeleport',
			'sdCharacter',
			'sdAntigravity',
			'sdHover',
			'sdTeleport',
			'sdUpgradeStation',
			'sdCrystalCombiner',
			'sdNode',
			'sdPlayerDrone',
			'sdSunPanel',
			'sdCommandCentre',
			'sdLongRangeTeleport',
			'sdBaseShieldingUnit',
			'sdJunk',
			'sdCube',
			'sdCamera',
			'sdBotFactory',
			'sdBotCharger',
			'sdButton',
			'sdStorageTank',
			'sdEssenceExtractor',
			'sdSteeringWheel',
			'sdManualTurret',
			'sdWeaponMerger',
			'sdLiquidAbsorber',
			'sdStorage',
			'sdSampleBuilder',
			'sdWorkbench',
			'sdMothershipContainer',
			'sdConveyor'
		];
		
		sdCable.empty_array = [];
		Object.freeze( sdCable.empty_array );
		
		// Override protection
		sdCable.one_cable_entities = [
			'sdDoor',
			'sdTurret',
			'sdTeleport',
			'sdManualTurret',
			'sdSampleBuilder'
		];
		// Flow ranks
		/*sdCable.hungry_entities = new Set([
			sdTurret,
			sdRescueTeleport,
			sdCharacter,
			sdHover,
			sdTeleport,
			sdUpgradeStation
		]);*/
		
		sdCable.cables_per_entity = new WeakMap();
		//sdCable.connected_entities_per_entity = new WeakMap(); // entity => array of entities
		sdCable.connected_entities_per_entity = new Map(); // entity => array of entities // Maps are faster?
		
		sdCable.counter = 0; // For client to minimize point count in case of spam
		
		//sdCable.cables = new Set(); // Just all existing cables
		sdCable.cables = [];
		sdCable.cable_think_offset = 0;
		
		// Turning these getters/setters into enumerable ones
		Object.defineProperty( sdCable.prototype, 'p', { enumerable: true });
		Object.defineProperty( sdCable.prototype, 'c', { enumerable: true });

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return this.p && this.c ? Math.min( this.p.x + this.d[ 0 ], this.c.x + this.d[ 2 ] ) - this.x - 4 : -4; }
	get hitbox_x2() { return this.p && this.c ? Math.max( this.p.x + this.d[ 0 ], this.c.x + this.d[ 2 ] ) - this.x + 4 : 4; }
	get hitbox_y1() { return this.p && this.c ? Math.min( this.p.y + this.d[ 1 ], this.c.y + this.d[ 3 ] ) - this.y - 4 : -4; }
	get hitbox_y2() { return this.p && this.c ? Math.max( this.p.y + this.d[ 1 ], this.c.y + this.d[ 3 ] ) - this.y + 4 : 4; }
	
	IsBGEntity() // 3 = cables
	{ return 3; }
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{ 
		return [ 0, 0, -64 ];
	}
	
	DrawIn3D()
	{ return FakeCanvasContext.DRAW_IN_3D_FLAT; }
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	/*Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		
		this.remove();
	}*/
	constructor( params )
	{
		super( params );
		
		this.t = ( params.type === undefined ) ? sdCable.TYPE_MATTER : params.type; // type
		
		//this._debug_enforced = false;
		
		/*this.p = null;
		this.c = null;
		
		if ( params.parent )
		this.SetParent( params.parent );
		
		if ( params.child )
		this.SetChild( params.child );*/
		
		this.d = params.offsets || [ 0,0, 0,0 ]; // Raw data in format: [ relative to parent x, relative to parent y, relative to child x, relative to child y ]
		
		this._points = null;
		
		if ( sdWorld.is_server && !sdWorld.is_singleplayer )
		{
			//this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		}
		else
		{
			this._points = [ { x:0, y:0, sx:0, sy:0, cache:{x:0,y:0,exists:false} }, { x:0, y:0, sx:0, sy:0, cache:{x:0,y:0,exists:false} } ]; // Non-relative positions
			
			sdCable.counter++;
		}
		
		this.SetMethod( 'Wakeup', this.Wakeup );
		
		this._p = null;
		this._c = null;
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this.v = 0; // Node's variation for wireless cables
		
		Object.defineProperty( this, '_p', { enumerable: false });
		Object.defineProperty( this, '_c', { enumerable: false });
		
		this.p = params.parent || null; // parent entity
		this.c = params.child || null; // child entity
		
		//sdCable.cables.add( this );
		sdCable.cables.push( this );
	}
	
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.p && this.c && !this.p._is_being_removed && !this.c._is_being_removed )
		return [ this.p, this.c ]; 
		
		return [];
	}
	
	MeasureMatterCost()
	{
		return 5;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	//get spawn_align_x(){ return 8; };
	//get spawn_align_y(){ return 8; };
	
	Wakeup()
	{
		// Will cause cable to be removed if connected entities are removed or moved too far from each other
		if ( !this._is_being_removed )
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
	}
	
	
	
	static AddCableForEntity( e, cable )
	{
		let set = sdCable.cables_per_entity.get( e );
			
		if ( !set )
		{
			set = new Set();
			
			let arr = [];
			for ( let i = 0; i < sdCable.TYPE_LAST; i++ )
			arr[ i ] = [];
			
			sdCable.cables_per_entity.set( e, set );
			sdCable.connected_entities_per_entity.set( e, arr ); // Array of connection types
		}
		
		if ( !set.has( cable ) )
		{
			set.add( cable );
			
			if ( !e._is_being_removed )
			e.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
		
		if ( !e._is_being_removed )
		{
			e._connected_ents = null; // Update cache instantly
			
			e.FindObjectsInACableNetwork( sdEntity.CableCacheFlushMethod );
		}
	}
	static RemoveCableFromEntity( e, cable )
	{
		let set = sdCable.cables_per_entity.get( e );
		
		if ( set )
		{
			set.delete( cable );
			
			if ( !e._is_being_removed )
			{
				e.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				e._connected_ents = null; // Update cache instantly
			
				e.FindObjectsInACableNetwork( sdEntity.CableCacheFlushMethod );
			}
			
			if ( set.size === 0 )
			{
				sdCable.cables_per_entity.delete( e );
				sdCable.connected_entities_per_entity.delete( e );
			}
		}
	}
	
	static GetConnectedEntities( e, cable_type=sdCable.TYPE_ANY )
	{
		// Do not create arrays or sets to prevent left over arrays
		
		let set = sdCable.connected_entities_per_entity.get( e );
		
		if ( set )
		return sdCable.connected_entities_per_entity.get( e )[ cable_type ] || sdCable.empty_array;
		else
		return sdCable.empty_array;
	}
	static UpdateConnectedEntities( e )
	{
		if ( e )
		{
			let arr = sdCable.connected_entities_per_entity.get( e );

			if ( arr )
			{
				let set = sdCable.cables_per_entity.get( e );

				for ( let i = 0; i < sdCable.TYPE_LAST; i++ )
				arr[ i ].length = 0;

				set.forEach( ( cable )=>
				{
					if ( !cable.c || !cable.p ) // Happens rarely, on loading from snapshot, and also during creation of cable
					{
						//cable.remove();
					}
					else
					if ( cable.p === e )
					{
						if ( cable.t !== 0 )
						arr[ sdCable.TYPE_ANY ].push( cable.c );
						
						arr[ cable.t ].push( cable.c );
					}
					else
					if ( cable.c === e )
					{
						if ( cable.t !== 0 )
						arr[ sdCable.TYPE_ANY ].push( cable.p );
					
						arr[ cable.t ].push( cable.p );
					}
					else
					throw new Error( 'Completely unrelated cable?' );
				});
			}
			//else
			//debugger; // AddCableForEntity was never called for entity? Can happen as a result of removing last cable from entity
		}
	}
	
	get p()
	{
		return this._p;
	}
	get c()
	{
		return this._c;
	}
	set p( e )
	{
		let old = this.p;
		
		if ( e === old )
		return;
		
		//debugger;
		
		if ( this.p )
		{
			this.p.removeEventListener( 'REMOVAL', this.Wakeup );
			this.p.removeEventListener( 'MOVES', this.Wakeup );
			
			sdCable.RemoveCableFromEntity( this.p, this );
		}
		
		this._p = e;
		
		if ( this.p )
		{
			this.p.addEventListener( 'REMOVAL', this.Wakeup );
			this.p.addEventListener( 'MOVES', this.Wakeup );
			
			sdCable.AddCableForEntity( this.p, this );
		}
		
		sdCable.UpdateConnectedEntities( old );
		sdCable.UpdateConnectedEntities( this.p );
		sdCable.UpdateConnectedEntities( this.c );
		this.ScheduleNetworkEntitiesUpdate();
		this._update_version++;
	}
	set c( e )
	{
		let old = this.c;
		
		if ( e === old )
		return;
		
		//debugger;
		
		if ( this.c )
		{
			this.c.removeEventListener( 'REMOVAL', this.Wakeup );
			this.c.removeEventListener( 'MOVES', this.Wakeup );
			
			sdCable.RemoveCableFromEntity( this.c, this );
		}
		
		this._c = e;
		
		if ( this.c )
		{
			this.c.addEventListener( 'REMOVAL', this.Wakeup );
			this.c.addEventListener( 'MOVES', this.Wakeup );
			
			sdCable.AddCableForEntity( this.c, this );
		}
		
		sdCable.UpdateConnectedEntities( old );
		sdCable.UpdateConnectedEntities( this.p );
		sdCable.UpdateConnectedEntities( this.c );
		this.ScheduleNetworkEntitiesUpdate();
		this._update_version++;
	}
	SetType( type )
	{
		this.t = type;
		
		sdCable.UpdateConnectedEntities( this.p );
		sdCable.UpdateConnectedEntities( this.c );
		this._update_version++;
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity === this.p || from_entity === this.c )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE, false );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !this.p || !this.c )
		{
			if ( sdWorld.is_server )
			{
				debugger; // Should be always connected to something, for example to owner itself while being built. Can end up being not on client due to static entity count limit per sync
			}
			
			if ( sdWorld.is_server )
			this.remove();
		
			return;
		}
		
		if ( this.p._is_being_removed || this.c._is_being_removed )
		{
			if ( sdWorld.is_server )
			this.remove();
			else
			{
				/*if ( !this._debug_enforced )
				{
					this._debug_enforced = true;
					try
					{
						EnforceChangeLog( this.p, '_is_being_removed', false, false );
						EnforceChangeLog( this.c, '_is_being_removed', false, false );
					}catch(e){}
				}*/
				
				// Sometimes p and c can point towards same object by _net_id but removed version, yet client might know about new non-removed one. Not sure why it happens but it happens. Without it cables will float mid-air
				if ( this.p )
				this.p = sdEntity.entities_by_net_id_cache_map.get( this.p._net_id ) || this.p;
			
				if ( this.c )
				this.c = sdEntity.entities_by_net_id_cache_map.get( this.c._net_id ) || this.c;
			}
		
			return;
		}
		
		//if ( this.p.is_static && this.c.is_static )
		{
			if ( sdWorld.is_server )
			{
				this.x = this.p.x + this.d[ 0 ];
				this.y = this.p.y + this.d[ 1 ];
				
				if ( this.hitbox_x1 === this._hitbox_x1 && this.hitbox_x2 === this._hitbox_x2 &&
					 this.hitbox_y1 === this._hitbox_y1 && this.hitbox_y2 === this._hitbox_y2 )
				{
					if ( !sdWorld.is_singleplayer )
					if ( !this.p.IsPlayerClass() )
					if ( !this.c.IsPlayerClass() )
					this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP, false );
				}
				else
				{

					// Update taken area right before hibernation
					this._last_x = undefined;
					this._last_y = undefined;
					this._update_version++;
					/*
					if ( !this.p.hasEventListener( 'REMOVAL', this.Wakeup ) )
					{
						this.p.addEventListener( 'REMOVAL', this.Wakeup );
						this.p.addEventListener( 'MOVES', this.Wakeup );
					}

					if ( !this.c.hasEventListener( 'REMOVAL', this.Wakeup ) )
					{
						this.c.addEventListener( 'REMOVAL', this.Wakeup );
						this.c.addEventListener( 'MOVES', this.Wakeup );
					}*/
				}
			}
		}
		
		let pc_dx = this.p.x + this.d[ 0 ] - ( this.c.x + this.d[ 2 ] );
		let pc_dy = this.p.y + this.d[ 1 ] - ( this.c.y + this.d[ 3 ] );
		
		let di = sdWorld.Dist2D_Vector( pc_dx, pc_dy );
		
		if ( di < 1 )
		di = 1;
	
		let properties = sdCable.type_properties[ this.t ];
		
		if ( this._points )
		{
			if ( GSPEED > 0.6 )
			GSPEED = 0.6;
		
			this._points[ 0 ].x = this.p.x + this.d[ 0 ];
			this._points[ 0 ].y = this.p.y + this.d[ 1 ];
			this._points[ this._points.length - 1 ].x = this.c.x + this.d[ 2 ];
			this._points[ this._points.length - 1 ].y = this.c.y + this.d[ 3 ];
			
			let points_expected = ( di / 8 );
			
			if ( this.t === sdCable.TYPE_WIRELESS )
			points_expected = 2;
			
			if ( points_expected > 4 )
			if ( sdCable.counter > 8 )
			{
				points_expected = Math.max( 4, points_expected / 1.5 );
				//points_expected /= 1 + ( sdCable.counter - 8 ) * 0.3;
				if ( sdCable.counter > 16 )
				{
					//points_expected /= 2;
					points_expected = Math.max( 4, points_expected / 2 );
				}
			}
			
			if ( isNaN( points_expected ) )
			throw new Error( 'points_expected is NaN' );
			
			if ( points_expected > 32 )
			points_expected = 32;
		
			if ( points_expected < 2 )
			points_expected = 2;
		
			points_expected = Math.round( points_expected );
		
			while ( this._points.length < points_expected )
			{
				let r = ~~( Math.random() * ( this._points.length - 1 ) );
				
				this._points.splice( r + 1, 0, {
					x: ( this._points[ r ].x + this._points[ r + 1 ].x ) / 2,
					y: ( this._points[ r ].y + this._points[ r + 1 ].y ) / 2,
					sx: ( this._points[ r ].sx + this._points[ r + 1 ].sx ) / 2,
					sy: ( this._points[ r ].sy + this._points[ r + 1 ].sy ) / 2,
					cache:{x:0,y:0,exists:false}
				});
			}
			
			while ( this._points.length > points_expected )
			{
				let r = 1 + ~~( Math.random() * ( this._points.length - 2 ) );
				
				this._points.splice( r, 1 );
			}
			
			for ( let i = 0; i < this._points.length; i++ )
			{
				if ( i > 0 && i < this._points.length - 1 )
				{
					//this._points[ i ].cache:{x:0,y:0,exists:false}
					
					let xx = this._points[ i ].x + this._points[ i ].sx;
					let yy = this._points[ i ].y + this._points[ i ].sy;
					
					if ( sdWorld.inDist2D_Boolean( this._points[ i ].cache.x, this._points[ i ].cache.y, xx, yy, 5 ) )
					{
					}
					else
					{
						this._points[ i ].cache.x = xx;
						this._points[ i ].cache.y = yy;
						
						this._points[ i ].cache.exists = sdWorld.CheckWallExists( this._points[ i ].x + this._points[ i ].sx, this._points[ i ].y + this._points[ i ].sy, null, null, sdBlock.as_class_list );
					}
					
					//if ( !sdWorld.CheckWallExists( this._points[ i ].x + this._points[ i ].sx, this._points[ i ].y + this._points[ i ].sy, null, null, [ 'sdBlock' ] ) )
					if ( !this._points[ i ].cache.exists )
					{
						this._points[ i ].x += this._points[ i ].sx;
						this._points[ i ].y += this._points[ i ].sy;
						
						this._points[ i ].sy += sdWorld.gravity * GSPEED;
						
						this._points[ i ].sx = sdWorld.MorphWithTimeScale( this._points[ i ].sx, 0, 0.95, GSPEED );
						this._points[ i ].sy = sdWorld.MorphWithTimeScale( this._points[ i ].sy, 0, 0.95, GSPEED );
					}
					else
					{
						this._points[ i ].sx = sdWorld.MorphWithTimeScale( this._points[ i ].sx, 0, 0.7, GSPEED );
						this._points[ i ].sy = sdWorld.MorphWithTimeScale( this._points[ i ].sy, 0, 0.7, GSPEED );
					}
					
					
					//if ( iter === 1 )
					{
						// Forcing linear shape when stretched
						let cx = this._points[ 0 ].x * ( 1 - i / ( this._points.length - 1 ) ) + this._points[ this._points.length - 1 ].x * ( i / ( this._points.length - 1 ) );
						let cy = this._points[ 0 ].y * ( 1 - i / ( this._points.length - 1 ) ) + this._points[ this._points.length - 1 ].y * ( i / ( this._points.length - 1 ) );

						let p2 = Math.pow( Math.min( 1, di / ( properties.max_distance - 32 ) ), 32 ) * 0.5 * GSPEED;
						this._points[ i ].sx += ( cx - this._points[ i ].x ) * p2 * 0.5;
						this._points[ i ].sy += ( cy - this._points[ i ].y ) * p2 * 0.5;
						this._points[ i ].x += ( cx - this._points[ i ].x ) * p2;
						this._points[ i ].y += ( cy - this._points[ i ].y ) * p2;
					}
				}
				
				for ( let iter = 1; iter <= 2; iter++ )
				if ( i < this._points.length - iter )
				{
					let target_di = di / ( this._points.length - 1 ) * iter;
					let cur_di = sdWorld.Dist2D( this._points[ i ].x, this._points[ i ].y, this._points[ i + iter ].x, this._points[ i + iter ].y );

					if ( cur_di > 0.001 )
					{
						let p = 1 / cur_di * Math.min( 10, cur_di - target_di ) * 0.5 * GSPEED;
						
						let dx = ( this._points[ i + iter ].x - this._points[ i ].x );
						let dy = ( this._points[ i + iter ].y - this._points[ i ].y );

						if ( i > 0 && i < this._points.length - 1 )
						{
							this._points[ i ].sx += dx * p;
							this._points[ i ].sy += dy * p;

							this._points[ i ].x += dx * p;
							this._points[ i ].y += dy * p;
							
						}
						
						if ( i + iter > 0 && i + iter < this._points.length - 1 )
						{
							this._points[ i + iter ].sx -= dx * p;
							this._points[ i + iter ].sy -= dy * p;

							this._points[ i + iter ].x -= dx * p;
							this._points[ i + iter ].y -= dy * p;
						}
					}
				}
			
			}
		}
		
		if ( di > properties.max_distance - 32 )
		{
			let force = Math.pow( 1 - ( properties.max_distance - di ) / 32, 2 );
			
			if ( typeof this.p.sx !== 'undefined' )
			{
				this.p.sx -= pc_dx / di * force * 400 / this.p.mass;
				this.p.sy -= pc_dy / di * force * 400 / this.p.mass;
				
				if ( this.p.IsPlayerClass() )
				this.p.ApplyServerSidePositionAndVelocity( true, -pc_dx / di * force * 400 / this.p.mass, -pc_dy / di * force * 400 / this.p.mass );
			
				if ( this.p._hiberstate === sdEntity.HIBERSTATE_HIBERNATED )
				this.p.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
			if ( typeof this.c.sx !== 'undefined' )
			{
				this.c.sx += pc_dx / di * force * 400 / this.c.mass;
				this.c.sy += pc_dy / di * force * 400 / this.c.mass;
				
				if ( this.c.IsPlayerClass() )
				this.c.ApplyServerSidePositionAndVelocity( true, pc_dx / di * force * 400 / this.p.mass, pc_dy / di * force * 400 / this.c.mass );
			
				if ( this.c._hiberstate === sdEntity.HIBERSTATE_HIBERNATED )
				this.c.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
		}
		
		if ( di > properties.max_distance )
		{
			if ( sdWorld.is_server )
			{
				this.remove();
				return;
			}
		}
	}
	
	/*static GlobalCableThink( GSPEED ) 2% of total performance was going there. Replaced with chain reaction-based waking up, which could have similar performance but with possiblity for different parts of cable networks to hibernate
	{
		for ( let i = 0; i < sdCable.cables.length; i++ )
		{
			let cable = sdCable.cables[ i ];
			//sdCable.cables.forEach( ( cable )=>
			//{
				if ( cable.t === sdCable.TYPE_MATTER )
				{
					if ( cable._p )
					if ( cable._c )
					if ( cable._p._hiberstate === sdEntity.HIBERSTATE_ACTIVE || cable._c._hiberstate === sdEntity.HIBERSTATE_ACTIVE )
					{
						cable._p.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						cable._c.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
						
						let hungry_p = cable._p._is_cable_priority;
						let hungry_c = cable._c._is_cable_priority;
						if ( ( hungry_p && hungry_c ) || ( !hungry_p && !hungry_c ) )
						{
							cable._p.TransferMatter( cable._c, 0.1, GSPEED * 4, true ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity
							cable._c.TransferMatter( cable._p, 0.1, GSPEED * 4, true ); // Maximum efficiency over cables? At least prioritizing it should make sense. Maximum efficiency can cause matter being transfered to just like 1 connected entity
						}
						else
						if ( hungry_p )
						{
							cable._c.TransferMatter( cable._p, 0.1, GSPEED * 4, true );
						}
						else
						{
							cable._p.TransferMatter( cable._c, 0.1, GSPEED * 4, true );
						}
					}
				}
			//});
		}
	}
	*/
	
	GetAccurateDistance( xx, yy ) // Used on client-side when right clicking on cables (also during cursor hovering for context menu and hint), also on server when distance between cable and player is measured
	{
		if ( this.t === sdCable.TYPE_WIRELESS )
		{
			let real_di = Math.min( 
					sdWorld.Dist2D(	xx, 
								yy, 
								this.p.x + this.d[ 0 ], 
								this.p.y + this.d[ 1 ]
					),
					sdWorld.Dist2D(	xx, 
								yy, 
								this.c.x + this.d[ 2 ], 
								this.c.y + this.d[ 3 ]
					)
			);
	
			if ( sdWorld.is_server )
			return real_di;
			else
			{
				if ( real_di > 20 )
				return real_di;
			}
		}
		
		if ( this.p && this.c )
		{
			let cursor = { 
							x: xx, 
							y: yy 
						};
			if ( this._points )
			{
				let best_di = Infinity;
				
				for ( let i = 0; i < this._points.length - 1; i++ )
				{
					let di = sdWorld.distToSegment( 
						cursor, 
						this._points[ i ], 
						this._points[ i + 1 ]);
						
					if ( best_di > di )
					best_di = di;
				}
				return best_di;
			}
			else
			{
				return sdWorld.distToSegment( 
						cursor, 
						{
							x: this.p.x + this.d[ 0 ],
							y: this.p.y + this.d[ 1 ]
						}, 
						{
							x: this.c.x + this.d[ 2 ],
							y: this.c.y + this.d[ 3 ]
						}); // p is tested point, v and w is a segment;
			}
		}
	
		return sdWorld.Dist2D(	xx, 
								yy, 
								Math.min( Math.max( this.x + this._hitbox_x1, xx ), this.x + this._hitbox_x2 ), 
								Math.min( Math.max( this.y + this._hitbox_y1, yy ), this.y + this._hitbox_y2 ) );
	}
	
	DrawBG( ctx, attached )
	//Draw( ctx, attached )
	{
		/*ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		ctx.drawImageFilterCache( sdCable.img_lamp, -16, -16 );
		
		if ( typeof ctx.DrawLamp !== 'undefined' )
		{
			ctx.DrawLamp( this.x, this.y );
		}*/
		
		//ctx.fillRect( -4, -4, 8, 8 );
		
		let properties = sdCable.type_properties[ this.t ];
		
		for ( let stage = ( sdWorld.hovered_entity === this ? 0 : 1 ); stage < 2; stage++ )
		//let stage = 1;
		{
			
			ctx.fillStyle = properties.color;
			ctx.globalAlpha = properties.opacity;
			
			if ( this.t === sdCable.TYPE_WIRELESS )
			{
				ctx.fillStyle = properties.by_node_variation[ this.v ];
				
				let exectuter_character = sdWorld.my_entity;
				if ( this.GetAccurateDistance( exectuter_character.x + ( exectuter_character.hitbox_x1 + exectuter_character.hitbox_x2 ) / 2, exectuter_character.y + ( exectuter_character.hitbox_y1 + exectuter_character.hitbox_y2 ) / 2 ) >= 32 )
				{
					ctx.globalAlpha *= 0.15;
				}
			}
		
			let radius = properties.width;

			if ( stage === 0 )
			{
				radius += 0.5;
				
				if ( sdWorld.hovered_entity === this )
				ctx.fillStyle = '#ffffff';
				else
				ctx.fillStyle = '#000000';
			}

			for ( let i = 0; i < this._points.length - 1; i++ )
			{
				ctx.save();
				{
					let dx = this._points[ i + 1 ].x - this._points[ i ].x;
					let dy = this._points[ i + 1 ].y - this._points[ i ].y;

					ctx.translate( -this.x + this._points[ i ].x, -this.y + this._points[ i ].y );

					ctx.rotate( Math.atan2( dy, dx ) - Math.PI / 2 );

					ctx.fillRect( -radius, -radius, radius * 2, radius * 2 + sdWorld.Dist2D_Vector( dx,dy ) );

				}
				ctx.restore();
			}
		}

		ctx.filter = 'none';
	}
	get title()
	{
		return ( this.t === sdCable.TYPE_WIRELESS ) ? 'Wireless connection' : 'Cable';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	
	ScheduleNetworkEntitiesUpdate()
	{
		if ( this.p && this.c )
		{
			const method = ( ent )=>
			{
				if ( ent._hiberstate === sdEntity.HIBERSTATE_HIBERNATED )
				ent.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

				if ( typeof ent._update_version !== 'undefined' )
				ent._update_version++;

				return false;
			};

			this.p.GetComWiredCache( method );
			this.c.GetComWiredCache( method ); // Why was it commented out?
			
			
			this.p.FindObjectsInACableNetwork( sdEntity.CableCacheFlushMethod );
			this.c.FindObjectsInACableNetwork( sdEntity.CableCacheFlushMethod );
		}
		else
		{
		}
	}
	
	_Deletion()
	{
		if ( sdWorld.is_server )
		{
			// Trigger updates for everything within network
			this.ScheduleNetworkEntitiesUpdate();

			this.p = null;
			this.c = null;
			
			/*if ( this.p )
			{
				//if ( this.p.hasEventListener( 'REMOVAL', this.Wakeup ) )
				this.p.removeEventListener( 'REMOVAL', this.Wakeup );
				this.p.removeEventListener( 'MOVES', this.Wakeup );
			}

			if ( this.c )
			{
				//if ( this.c.hasEventListener( 'REMOVAL', this.Wakeup ) )
				this.c.removeEventListener( 'REMOVAL', this.Wakeup );
				this.c.removeEventListener( 'MOVES', this.Wakeup );
			}*/
		}
		else
		{
			// Why not do these here too? Will be used for visuals on client-side
			this.p = null;
			this.c = null;
			
			sdCable.counter--;
		}
		
		//sdCable.cables.delete( this );
		let id = sdCable.cables.indexOf( this );
		if ( id !== -1 )
		sdCable.cables.splice( id, 1 );
		else
		debugger;
	}
	
	onRemove() // Class-specific, if needed
	{
		this._Deletion();
	}
	onRemoveAsFakeEntity() // Will be called instead of onRemove() if entity was never added to world
	{
		this._Deletion();
	}
	
	
	
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdArea.CheckPointDamageAllowed( exectuter_character.x, exectuter_character.y ) || this.p === exectuter_character || this.c === exectuter_character )
			{
				if ( this.GetAccurateDistance( exectuter_character.x + ( exectuter_character.hitbox_x1 + exectuter_character.hitbox_x2 ) / 2, exectuter_character.y + ( exectuter_character.hitbox_y1 + exectuter_character.hitbox_y2 ) / 2 ) < 32 )
				{
					if ( exectuter_character.is( sdPlayerDrone ) ||
						 ( exectuter_character._inventory[ sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].slot ] && 
						   exectuter_character._inventory[ sdGun.classes[ sdGun.CLASS_CABLE_TOOL ].slot ].class === sdGun.CLASS_CABLE_TOOL ) )
					{
						if ( command_name === 'CUT_CABLE' )
						{
							if ( this._shielded && !this._shielded._is_being_removed && this._shielded.protect_cables )
							exectuter_character.Say( 'Protected by the base shielding unit... Really?' );
							else
							this.remove();
						}
						else
						if ( command_name === 'SET_TYPE' )
						{
							if ( this.t !== sdCable.TYPE_WIRELESS )
							if ( typeof parameters_array[ 0 ] === 'number' )
							if ( !isNaN( parameters_array[ 0 ] ) )
							if ( parameters_array[ 0 ] === sdCable.TYPE_MATTER ||
								 parameters_array[ 0 ] === sdCable.TYPE_LIQUID )
							//if ( parameters_array[ 0 ] > sdCable.TYPE_ANY )
							//if ( parameters_array[ 0 ] < sdCable.TYPE_LAST )
							{
								this.SetType( parameters_array[ 0 ] );
								executer_socket.SDServiceMessage( 'Cable transfer resource set' );
							}
						}
					}
					else
					exectuter_character.Say( 'I\'d need cable management tool' );
				}
				else
				{
					if ( this.t === sdCable.TYPE_WIRELESS )
					executer_socket.SDServiceMessage( 'This connection can be only managed near wireless nodes' );
					else
					executer_socket.SDServiceMessage( 'Cable is too far. Try staying near one of cable\'s end points' );
				
					return;
				}
			}
			else
			{
				if ( this.t === sdCable.TYPE_WIRELESS )
				executer_socket.SDServiceMessage( 'Connection is in damage & build restricted area' );
				else
				executer_socket.SDServiceMessage( 'Cable is in damage & build restricted area' );
			
				return;
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		//if ( sdArea.CheckPointDamageAllowed( exectuter_character.x, exectuter_character.y ) || this.p === exectuter_character || this.c === exectuter_character )
		if ( this.GetAccurateDistance( exectuter_character.x + ( exectuter_character.hitbox_x1 + exectuter_character.hitbox_x2 ) / 2, exectuter_character.y + ( exectuter_character.hitbox_y1 + exectuter_character.hitbox_y2 ) / 2 ) < 20 ) // 32 can cause door to be "hackable" if first socket was on top
		{
			if ( this.t === sdCable.TYPE_WIRELESS )
			{
				this.AddContextOption( 'Terminate connection', 'CUT_CABLE', [] );
			}
			else
			{
				this.AddContextOption( 'Cut cable', 'CUT_CABLE', [] );
				this.AddContextOption( 'Transfer matter', 'SET_TYPE', [ sdCable.TYPE_MATTER ] );
				//this.AddContextOption( 'Transfer oxygen', 'SET_TYPE', [ sdCable.TYPE_AIR ] );
				this.AddContextOption( 'Transfer liquid', 'SET_TYPE', [ sdCable.TYPE_LIQUID ] );
				/*this.AddContextOption( 'Transfer IO-1 signals', 'SET_TYPE', [ sdCable.TYPE_IO1 ] );
				this.AddContextOption( 'Transfer IO-2 signals', 'SET_TYPE', [ sdCable.TYPE_IO2 ] );
				this.AddContextOption( 'Transfer IO-3 signals', 'SET_TYPE', [ sdCable.TYPE_IO3 ] );*/
			}
		}
	}
}
//sdCable.init_class();


export default sdCable;