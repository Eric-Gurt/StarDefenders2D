/*

	Art by Silk1

	Implemented by Eric Gurt

*/
/* global FakeCanvasContext */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
//import sdCrystal from './sdCrystal.js';
//import sdVirus from './sdVirus.js';
import sdEffect from './sdEffect.js';
//import sdWater from './sdWater.js';
//import sdBG from './sdBG.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdButton from './sdButton.js';
import sdNode from './sdNode.js';

import sdRenderer from '../client/sdRenderer.js';

import sdSound from '../sdSound.js';

class sdConveyor extends sdEntity
{
	static init_class()
	{
		sdConveyor.img_conveyor = sdWorld.CreateImageFromFile( 'conveyor' );
		
		//sdConveyor.belts = [];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 4; }
	
	DrawIn3D()
	{
		return FakeCanvasContext.DRAW_IN_3D_BOX; 
	}
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	get mass() { return 200; } // Better to override Impact method for sdConveyor to not take damage in case of being reinforced. Or in else case too high mass occasional hits would just damage vehicles too heavily (in case of unintended impacts, like spawning sdHover on top of reinforced walls). Also there might end up being other entities that could damage walls with impact eventually
	
	Impact( vel, initiator=null ) // fall damage basically
	{
		if ( vel > 6 ) // For new mass-based model
		{
			this.DamageWithEffect( ( vel - 3 ) * 15, initiator );
		}
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this._hea > 0 )
		{
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;

				this.HandleDestructionUpdate();

				this._regen_timeout = 60;

				if ( this._hea <= 0 )
				{
					this.remove();
				}
			}
		}
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 200 * 4;
		
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this._left_belt = null;
		this._right_belt = null;
		
		this._transported_entities = [];
		
		this.filter = params.filter || '';
		
		this.dir = 0;
		
		this.toggle_enabled = true;
		this._toggle_source_current = null;
		this._toggle_direction_current = null;
		
		this.destruction_frame = 0;
		this.HandleDestructionUpdate();
		
		//sdConveyor.belts.push( this );
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdConveyor can kill player-initiator and cause server crash)
	}
	onBuilt()
	{
		this.RequireBelt( -1 );
		this.RequireBelt( 1 );
	}
	static AppendConnectedConveyorsToArray( arr ) // Used by sdButton
	{
		
		let visited = new Set();
		for ( let i = 0; i < arr.length; i++ )
		visited.add( arr[ i ].entity );
	
		let Append = ( e, details_reference )=>
		{
			if ( e )
			if ( !e._is_being_removed )
			//if ( arr.indexOf( e ) === -1 )
			if ( !visited.has( e ) )
			{
				let details = Object.assign( {}, details_reference );
				details.entity = e;
				
				visited.add( e );
				
				arr.push( details );
			}
		};
		
		for ( let i = 0; i < arr.length; i++ )
		{
			let details = arr[ i ];
			
			Append( details.entity._left_belt, details );
			Append( details.entity._right_belt, details );
		}
		return arr;
	}
	onToggleEnabledChange() // Called via sdButton
	{
		/*if ( this.toggle_enabled )
		{
			if ( this._toggle_source_current )
			{
				if ( this._toggle_source_current.is( sdButton ) )
				{
				}
			}
		}*/
		if ( this._toggle_direction_current )
		{
			if ( this._toggle_direction_current.is( sdButton ) )
			{
				if ( this._toggle_direction_current.type === sdButton.TYPE_WALL_BUTTON )
				{
					if ( this._toggle_direction_current.kind === sdButton.BUTTON_KIND_TAP_LEFT )
					this.dir = -Math.abs( this.dir );
					else
					if ( this._toggle_direction_current.kind === sdButton.BUTTON_KIND_TAP_RIGHT )
					this.dir = Math.abs( this.dir );
				}
			}
			else
			if ( this._toggle_direction_current.is( sdNode ) )
			{
				if ( this._toggle_direction_current.type === sdNode.TYPE_SIGNAL_TURRET_ENABLER )
				{
					if ( this._toggle_direction_current.variation === 6 ) // Left
					this.dir = -Math.abs( this.dir );
					else
					if ( this._toggle_direction_current.variation === 2 ) // Right
					this.dir = Math.abs( this.dir );
				}
			}
		}
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter * 3;
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	HandleDestructionUpdate()
	{
		let old_destruction_frame = this.destruction_frame;
		
		if ( this._hea > this._hmax / 4 * 3 )
		this.destruction_frame = 0;
		else
		if ( this._hea > this._hmax / 4 * 2 )
		this.destruction_frame = 1;
		else
		if ( this._hea > this._hmax / 4 * 1 )
		this.destruction_frame = 2;
		else
		this.destruction_frame = 3;
		
		if ( this.destruction_frame !== old_destruction_frame )
		this._update_version++;
	}
	GetBeltAtPosition( xx, yy )
	{
		let ents = sdWorld.GetAnythingNear( xx, yy, 9, null, [ 'sdConveyor' ] );
		for ( let i = 0; i < ents.length; i++ )
		if ( ents[ i ].x === xx )
		if ( ents[ i ].y === yy || ents[ i ].y === yy - 8 || ents[ i ].y === yy + 8 )
		if ( ents[ i ] !== this )
		{
			if ( this.dir === 0 )
			if ( ents[ i ].dir !== 0 )
			this.dir = ents[ i ].dir;
		
			return ents[ i ];
		}
		
		return null;
	}
	RequireBelt( direction )
	{
		if ( direction === 1 )
		{
			if ( this._right_belt )
			if ( this._right_belt._is_being_removed )
			this._right_belt = null;
	
			if ( this._right_belt )
			return;
			else
			this._right_belt = this.GetBeltAtPosition( this.x + 32, this.y );
		}
		else
		{
			if ( this._left_belt )
			if ( this._left_belt._is_being_removed )
			this._left_belt = null;
	
			if ( this._left_belt )
			return;
			else
			this._left_belt = this.GetBeltAtPosition( this.x - 32, this.y );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
				
				this.HandleDestructionUpdate();
			}
		}
		
		let recheck_nearby_belts_once = true;
		
		for ( let i = 0; i < this._transported_entities.length; i++ )
		{
			let another_entity = this._transported_entities[ i ];
			
			if ( !another_entity._is_being_removed &&
				 this.x + this._hitbox_x2 > another_entity.x + another_entity._hitbox_x1 - 3 &&
				 this.x + this._hitbox_x1 < another_entity.x + another_entity._hitbox_x2 + 3 &&
				 this.y + this._hitbox_y2 > another_entity.y + another_entity._hitbox_y1 - 3 &&
				 this.y + this._hitbox_y1 < another_entity.y + another_entity._hitbox_y2 + 3 )
			{
				if ( this.dir !== 0 && this.toggle_enabled )
				{
					if ( Math.abs( this.dir ) >= 10 )
					if ( another_entity.is( sdCharacter ) )
					{
						//another_entity.tilt_speed += Math.sin( another_entity.tilt / 100 * 2 + Math.random() * 0.2 - 0.1 ) * 0.5 * Math.abs( this.dir ) * GSPEED;
						another_entity.DamageStability( 100 );
					}
					
					another_entity.PhysWakeUp();
					
					if ( recheck_nearby_belts_once )
					{
						recheck_nearby_belts_once = false;
						
						if ( this._right_belt )
						if ( this._right_belt._is_being_removed || !this.DoesOverlapWith( this._right_belt, 4 ) )
						{
							if ( this._right_belt._left_belt === this )
							this._right_belt._left_belt = null;
							
							this._right_belt = null;
						}
						
						if ( this._left_belt )
						if ( this._left_belt._is_being_removed || !this.DoesOverlapWith( this._left_belt, 4 ) )
						{
							if ( this._left_belt._right_belt === this )
							this._left_belt._right_belt = null;
						
							this._left_belt = null;
						}
					}
					
					if ( another_entity.y + another_entity._hitbox_y2 < this.y + 4 ) // On top
					{
                        another_entity.sx = sdWorld.MorphWithTimeScale( another_entity.sx, this.dir * 1.5, 0.9, GSPEED );

                        if ( this.dir > 0 && this._right_belt && this._right_belt.y < this.y )
                        if ( another_entity.x + another_entity._hitbox_x2 > this._right_belt.x + this._right_belt._hitbox_x1 - 1 )
                        if ( another_entity.CanMoveWithoutOverlap( another_entity.x, this._right_belt.y + this._right_belt._hitbox_y1 - another_entity._hitbox_y2 - 1 ) )
                        another_entity.y = this._right_belt.y + this._right_belt._hitbox_y1 - another_entity._hitbox_y2 - 1;

                        if ( this.dir < 0 && this._left_belt && this._left_belt.y < this.y )
                        if ( another_entity.x + another_entity._hitbox_x1 < this._left_belt.x + this._left_belt._hitbox_x2 + 1 )
                        if ( another_entity.CanMoveWithoutOverlap( another_entity.x, this._left_belt.y + this._left_belt._hitbox_y1 - another_entity._hitbox_y2 - 1 ) )
                        another_entity.y = this._left_belt.y + this._left_belt._hitbox_y1 - another_entity._hitbox_y2 - 1;
					}
					else
				    if ( another_entity.y + another_entity._hitbox_y1 > this.y + 4 ) // Under
					{
                        another_entity.sx = sdWorld.MorphWithTimeScale( another_entity.sx, -this.dir * 1.5, 0.9, GSPEED );

                        if ( this.dir < 0 && this._right_belt && this._right_belt.y > this.y )
                        if ( another_entity.x + another_entity._hitbox_x2 > this._right_belt.x + this._right_belt._hitbox_x1 - 1 )
                        if ( another_entity.CanMoveWithoutOverlap( another_entity.x, this._right_belt.y + this._right_belt._hitbox_y2 - another_entity._hitbox_y1 + 1 ) )
                        another_entity.y = this._right_belt.y + this._right_belt._hitbox_y2 - another_entity._hitbox_y1 + 1;

                        if ( this.dir > 0 && this._left_belt && this._left_belt.y > this.y )
                        if ( another_entity.x + another_entity._hitbox_x1 < this._left_belt.x + this._left_belt._hitbox_x2 + 1 )
                        if ( another_entity.CanMoveWithoutOverlap( another_entity.x, this._left_belt.y + this._left_belt._hitbox_y2 - another_entity._hitbox_y1 + 1 ) )
                        another_entity.y = this._left_belt.y + this._left_belt._hitbox_y2 - another_entity._hitbox_y1 + 1;
					}
				}
			}
			else
			{
				this._transported_entities.splice( i, 1 );
				i--;
				continue;
			}
		}
		
		if ( sdWorld.is_server )
		{
			this._update_version++;
			
			if ( this._hea === this._hmax && ( this.dir === 0 || this._transported_entities.length === 0 ) )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
		else
		{
			this.RequireBelt( -1 );
			this.RequireBelt( 1 );
		}
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity._is_bg_entity === this._is_bg_entity )
		{
			if ( typeof from_entity.sx !== 'undefined' )
			if ( typeof from_entity.sy !== 'undefined' )
			{
				if ( this._transported_entities.indexOf( from_entity ) === -1 )
				{
					this.RequireBelt( -1 );
					this.RequireBelt( 1 );
					
					if ( this._right_belt )
					{
						let ind_in_right = this._right_belt._transported_entities.indexOf( from_entity );
						if ( ind_in_right !== -1 )
						this._right_belt._transported_entities.splice( ind_in_right, 1 );
					}
					
					if ( this._left_belt )
					{
						let ind_in_left = this._left_belt._transported_entities.indexOf( from_entity );
						if ( ind_in_left !== -1 )
						this._left_belt._transported_entities.splice( ind_in_left, 1 );
					}

					this._transported_entities.push( from_entity );
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
				}
			}
		}
	}
	Draw( ctx, attached )
	{
		var w = 32;
		var h = 8;
		
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		/*
		let lumes = sdWorld.GetClientSideGlowReceived( this.x + w / 2, this.y + h / 2, this );
		
		if ( lumes > 0 )
		ctx.filter = ctx.filter + 'brightness('+(1+lumes)+')';
		*/

		//ctx.translate( 0, Math.sin( this._net_id * 2 ) * 50 - 80 );

		let right_belt_exists = this._right_belt ? 1 : 0;
		let left_belt_exists = this._left_belt ? 1 : 0;
		
		if ( this._right_belt )
		if ( this.y < this._right_belt.y )
		{
			ctx.translate( -16, 0 );
		    ctx.rotate( -Math.PI / 2 - Math.atan2( this.x - this._right_belt.x, this.y - this._right_belt.y ) );
		    ctx.translate( 16, 0 );
		}
		
		if ( this._left_belt )
		if ( this.y < this._left_belt.y )
		{
			ctx.translate( 16, 0 );
			ctx.rotate( Math.PI / 2 - Math.atan2( this.x - this._left_belt.x, this.y - this._left_belt.y ) );
			ctx.translate( -16, 0 );
		}
        /*
        if ( right_belt_exists )
		if ( this.y !== this._right_belt.y )
		right_belt_exists = 0;
		
        if ( left_belt_exists )
		if ( this.y !== this._left_belt.y )
		left_belt_exists = 0;*/
		
		let offset_x;
		
		if ( !this.toggle_enabled )
		offset_x = 0;
		else
		if ( this.dir >= 0 )
		offset_x = Math.floor( ( sdWorld.time * Math.abs( this.dir ) % 250 ) / 250 * 4 );
		else
		offset_x = 3 - Math.floor( ( sdWorld.time * Math.abs( this.dir ) % 250) / 250 * 4 );
		
		let xx = -16;
		let yy = -4;
		
		ctx.drawImageFilterCache( sdConveyor.img_conveyor, 32-2-offset_x, 0, w,1, xx+0,yy+0.005, w,1-0.005 ); // Top belt
		
		ctx.drawImageFilterCache( sdConveyor.img_conveyor, offset_x, 0, w,1, xx+0,yy+7, w,1-0.005 ); // Bottom belt
		
		if ( !right_belt_exists )
		ctx.drawImageFilterCache( sdConveyor.img_conveyor, 34+offset_x, 12, 1,8, xx+32,yy+0+0.005, 1,8-0.005 ); // Right belt
		
		if ( !left_belt_exists )
		ctx.drawImageFilterCache( sdConveyor.img_conveyor, 32 + 16 - offset_x, 12, 1,8, xx-1,yy+0+0.005, 1,8-0.005 ); // Left belt
		
		ctx.drawImageFilterCache( sdConveyor.img_conveyor, offset_x+3+right_belt_exists, 0, w+2-left_belt_exists-right_belt_exists,1, xx-1+left_belt_exists,yy+0, w+2-left_belt_exists-right_belt_exists,0 ); // Top cap
		ctx.drawImageFilterCache( sdConveyor.img_conveyor, 32-3-offset_x+right_belt_exists, 0, w+2-left_belt_exists-right_belt_exists,1, xx-1+left_belt_exists,yy+8, w+2-left_belt_exists-right_belt_exists,0 ); // Bottom cap

        if ( offset_x % 4 === 0 )
		ctx.scale( 1, 1 );
        if ( offset_x % 4 === 1 )
		ctx.scale( -1, 1 );
        if ( offset_x % 4 === 2 )
		ctx.scale( -1, -1 );
        if ( offset_x % 4 === 3 )
		ctx.scale( 1, -1 );
		ctx.drawImageFilterCache( sdConveyor.img_conveyor, 0, 13, w,6, xx+0-0.1,yy+1-0.1, w+0.2,6+0.2 ); // Inner static part


		ctx.filter = 'none';
		
		if ( sdBlock.cracks[ this.destruction_frame ] !== null )
		{
			let old_volumetric_mode = ctx.volumetric_mode;
			ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX_DECAL;
			{
				ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], 0, 0, w,h, -16,-4, w,h );
			}
			ctx.volumetric_mode = old_volumetric_mode;
		} 
	}
	
	onRemove() // Class-specific, if needed
	{
		/*let id = sdConveyor.belts.indexOf( this );
		if ( id !== -1 )
		sdConveyor.belts.splice( id, 1 );*/
	
		if ( sdWorld.is_server )
		{

		}
		else
		{
			if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
			if ( this._broken )
			{
				sdSound.PlaySound({ name:'blockB4', 
					x:this.x + 32 / 2, 
					y:this.y + 8 / 2, 
					volume:( 32 / 32 ) * ( 8 / 32 ), 
					pitch: 1,
					_server_allowed:true });

				let x,y,a,s;
				let step_size = 4;
				for ( x = step_size / 2; x < 32; x += step_size )
				for ( y = step_size / 2; y < 8; y += step_size )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;
					let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 4, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
					sdEntity.entities.push( ent );
				}
			}
		}
	}
	get title()
	{
		return "Conveyor";
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea <= 0 )
		return;
	
		sdEntity.Tooltip( ctx, this.title );
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
					if ( command_name === 'SET_DIR' )
					{
						let velocities = [ -20, -10, -5, -2, -1, 0, 1, 2, 5, 10, 20 ];

						let i = velocities.indexOf( parameters_array[ 0 ] );

						if ( i !== -1 )
						{
							i = velocities[ i ];

							let arr = [];
							let next = [ this ];
							while ( next.length > 0 )
							{
								next[ 0 ].dir = i;
								next[ 0 ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );

								arr.push( next[ 0 ] );

								next[ 0 ].RequireBelt( -1 );
								next[ 0 ].RequireBelt( 1 );

								if ( next[ 0 ]._right_belt )
								if ( arr.indexOf( next[ 0 ]._right_belt ) === -1 )
								next.push( next[ 0 ]._right_belt );

								if ( next[ 0 ]._left_belt )
								if ( arr.indexOf( next[ 0 ]._left_belt ) === -1 )
								next.push( next[ 0 ]._left_belt );

								next.shift();
							}
						}
					}
				}
				else
				executer_socket.SDServiceMessage( 'Conveyor is behind wall' );
			}
			else
			executer_socket.SDServiceMessage( 'Conveyor is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		if ( exectuter_character.canSeeForUse( this ) )
		{
			if ( sdWorld.my_entity )
			{
				let velocities = [ -20, -10, -5, -2, -1, 0, 1, 2, 5, 10, 20 ];
				
				for ( let i = 0; i < velocities.length; i++ )
				//this.AddContextOption( 'Set direction to ' + velocities[ i ], 'SET_DIR', [ velocities[ i ] ] );
				this.AddContextOptionNoTranslation( T('Set direction to ') + velocities[ i ], 'SET_DIR', [ velocities[ i ] ], true, ( this.dir === velocities[ i ] ) ? { color:'#00ff00' } : {} );
			}
		}
	}
}
//sdConveyor.init_class();

export default sdConveyor;