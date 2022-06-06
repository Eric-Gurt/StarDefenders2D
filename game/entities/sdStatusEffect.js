/*

	Status effects that are attached to other entities. These are capable of modifying how entities look

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';

import sdRenderer from '../client/sdRenderer.js';

class sdStatusEffect extends sdEntity
{
	static init_class()
	{
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		//sdStatusEffect.img_red_arrow = sdWorld.CreateImageFromFile( 'task_offscreen' );
		
		sdStatusEffect.types = [];
		
		sdStatusEffect.types[ sdStatusEffect.TYPE_DAMAGED = 0 ] = 
		{
			remove_if_for_removed: false,
	
			onMade: ( status_entity, params )=>
			{
				status_entity.progress = 0;
				status_entity._max_progress = 700 / 30;
				
				status_entity.dmg = params.dmg || 0;
				
				status_entity._observers = new WeakSet(); // Damage initiators
				
				if ( params.by )
				status_entity._observers.add( params.by );
				
				//status_entity.progress = 100 / 1000 * 30;
			},
			onStatusOfSameTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				//if ( status_entity.by === params.by )
				//{
					status_entity.progress = 0;
					status_entity.dmg += params.dmg || 0;
					status_entity._update_version++;

					//status_entity.progress = 100 / 1000 * 30;
					return true; // Cancel merge process
				//}
				//return false; // Do not stop merge process
			},
			onStatusOfDifferentTypeApplied: ( status_entity, params )=> // status_entity is an existing status effect entity
			{
				return false; // Do not stop merge process
				
				//return true; // Cancel merge process
			},
			IsVisible: ( status_entity, observer_entity )=>
			{
				//return true;
				return ( observer_entity === status_entity.for || status_entity._observers.has( observer_entity ) );
			},
			onThink: ( status_entity, GSPEED )=>
			{
				status_entity.progress += GSPEED;
				return ( status_entity.progress > status_entity._max_progress ); // return true = delete
			},
			onBeforeEntityRender: ( status_entity, ctx, attached )=>
			{
				if ( status_entity.progress < 200 / 1000 * 30 )
				{
					if ( status_entity.dmg > 0 )
					{
						ctx.sd_status_effect_filter = { s:'ffffff' };
					}
					else
					{
						//ctx.sd_status_effect_filter = { s:'66ff66' };
						ctx.sd_status_effect_tint_filter = [ 0.75, 1.5, 0.75 ];
					}
				}
			},
			onAfterEntityRender: ( status_entity, ctx, attached )=>
			{
				ctx.sd_status_effect_filter = null;
				ctx.sd_status_effect_tint_filter = null;
			},
			DrawFG: ( status_entity, ctx, attached )=>
			{
				if ( status_entity.dmg === 0 )
				return;
			
				ctx.textAlign = 'center';
				ctx.font = "5px Verdana";
				
				/*for ( let sh = 0; sh < 1; sh++ )
				for ( let x = -1; x <= 1; x++ )
				for ( let y = -1; y <= 1; y++ )*/
				{
					//if ( x === 0 && y === 0 )
					{
						//if ( sh !== 1 )
						//continue;
					
						if ( status_entity.dmg > 200 )
						ctx.fillStyle = '#ff0000';
						else
						if ( status_entity.dmg > 100 )
						ctx.fillStyle = '#ff6666';
						else
						if ( status_entity.dmg > 50 )
						ctx.fillStyle = '#ffaaaa';
						else
						if ( status_entity.dmg > 0 )
						ctx.fillStyle = '#ffeeee';
						else
						ctx.fillStyle = '#aaffaa';
					}
					/*else
					{
						if ( sh !== 0 )
						continue;
					
						ctx.fillStyle = '#000000';
					}*/

					ctx.globalAlpha = Math.min( 1, ( 1 - status_entity.progress / status_entity._max_progress ) * 2 );
					
					let xx = 0;
					let yy = -2.5 - status_entity.progress * 1 + Math.pow( status_entity.progress, 2 ) * 0.1;

					if ( status_entity.dmg > 0 )
					ctx.fillText( status_entity.dmg + '', xx, yy );
					else
					ctx.fillText( '+' + Math.abs( status_entity.dmg ) + '', xx, yy ); 

				}
				
				ctx.globalAlpha = 1;
			}
		};
		
		sdStatusEffect.status_effects = [];
		
		sdStatusEffect.entity_to_status_effects = new WeakMap(); // entity => [ eff1, eff2 ... ].inversed = [ ... eff2, eff1 ]
	}
	static DrawEffectsFor( entity, destination, start0_end1, ctx, attached ) // destination: 0 = BG, 1 = Normal, 2 = FG
	{
		let arr = sdStatusEffect.entity_to_status_effects.get( entity );
		if ( arr !== undefined )
		{
			if ( start0_end1 === 1 )
			arr = arr.inversed;
			
			for ( let i = 0; i < arr.length; i++ )
			{
				let type = sdStatusEffect.types[ arr[ i ].type ];
				
				if ( type )
				{
					//console.warn('destination: '+destination+', start0_end1: ' + start0_end1);
		
					if ( start0_end1 === 0 )
					{
						if ( type.onBeforeEntityRender )
						type.onBeforeEntityRender( arr[ i ], ctx, attached );
					}
					else
					{
						if ( type.onAfterEntityRender )
						type.onAfterEntityRender( arr[ i ], ctx, attached );
					}
					
					if ( destination === 0 && start0_end1 === 1 )
					if ( type.DrawBG )
					type.DrawBG( arr[ i ], ctx, attached );
			
					if ( destination === 1 && start0_end1 === 1 )
					if ( type.Draw )
					type.Draw( arr[ i ], ctx, attached );
			
					if ( destination === 2 && start0_end1 === 1 )
					if ( type.DrawFG )
					type.DrawFG( arr[ i ], ctx, attached );
				}
			}
		}
	}
	
	
	static WakeUpStatusEffectsFor( character )
	{
		for ( let i = 0; i < sdStatusEffect.status_effects.length; i++ )
		{
			if ( sdStatusEffect.status_effects[ i ].for === character )
			if ( !sdStatusEffect.status_effects[ i ]._is_being_removed )
			sdStatusEffect.status_effects[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	
	static ApplyStatusEffectForEntity( params )
	{
		for ( let i = 0; i < sdStatusEffect.status_effects.length; i++ )
		{
			let old_status = sdStatusEffect.status_effects[ i ];
			
			if ( old_status.for === params.for )
			{
				let status_type = sdStatusEffect.types[ old_status.type ];
		
				if ( status_type )
				{
					if ( old_status.type === params.type )
					{
						if ( status_type.onStatusOfSameTypeApplied )
						if ( status_type.onStatusOfSameTypeApplied( old_status, params ) )
						return;
					}
					else
					{
						if ( status_type.onStatusOfDifferentTypeApplied )
						if ( status_type.onStatusOfDifferentTypeApplied( old_status, params ) )
						return;
					}
				}
			}
		}
	
		let task = new sdStatusEffect( params );
		sdEntity.entities.push( task );
	}
	
	IsVisible( observer_entity )
	{
		let type = sdStatusEffect.types[ this.type ];
		
		if ( type )
		if ( type.IsVisible )
		return type.IsVisible( this, observer_entity );
		
		return this.for.IsVisible( observer_entity );
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === 'for' ) return true;
		
		return false;
	}
	
	constructor( params )
	{
		super( params );
		
		this.for = params.for || null; // Target. Who has this status effect
		this._for_confirmed = false;

		this.type = params.status_type || 0;
		
		let status_type = sdStatusEffect.types[ this.type ];
		
		if ( status_type )
		{
			if ( status_type.onMade )
			status_type.onMade( this, params );
		
			if ( status_type.remove_if_for_removed === false )
			this.remove_if_for_removed = false;
		}
		
		sdStatusEffect.status_effects.push( this );
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }
	
	/*SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
	}*/
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	IsBGEntity() // Check sdEntity for meaning
	{ return 6; }
	
	
	onRemoveAsFakeEntity()
	{
		sdStatusEffect.status_effects.splice( sdStatusEffect.status_effects.indexOf( this ), 1 );
		
		if ( this._for_confirmed )
		if ( this.for ) // Can be null if removed, which is fine
		{
			let arr = sdStatusEffect.entity_to_status_effects.get( this.for );
			arr.splice( arr.indexOf( this ), 1 );
			arr.inversed.splice( arr.inversed.indexOf( this ), 1 );
		}
	}
	onBeforeRemove()
	{
		sdStatusEffect.status_effects.splice( sdStatusEffect.status_effects.indexOf( this ), 1 );
		
		if ( this._for_confirmed )
		if ( this.for ) // Can be null if removed, which is fine
		{
			let arr = sdStatusEffect.entity_to_status_effects.get( this.for );
			
			arr.splice( arr.indexOf( this ), 1 );
			arr.inversed.splice( arr.inversed.indexOf( this ), 1 );
		}
	}
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.95; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		let isforless = false;
		
		if ( this._for_confirmed )
		{
			if ( !this.for || this.for._is_being_removed )
			{
				this.for = null;
				isforless = true;
			}
		}
		else
		if ( this.for )
		{
			let arr = sdStatusEffect.entity_to_status_effects.get( this.for );

			this._for_confirmed = true;

			if ( arr )
			{
				arr.push( this );
				arr.inversed.unshift( this );
			}
			else
			{
				arr = [ this ];
				arr.inversed = [ this ];
				sdStatusEffect.entity_to_status_effects.set( this.for, arr );
			}
		}
		else
		{
			isforless = true;
		}

		if ( !isforless )
		{
			this.x = this.for.x + ( this.for._hitbox_x1 + this.for._hitbox_x2 ) / 2;
			this.y = this.for.y + ( this.for._hitbox_x2 + this.for._hitbox_x2 ) / 2;
		}
		
		let status_type = sdStatusEffect.types[ this.type ];
		
		if ( status_type )
		{
			if ( status_type.onThink )
			if ( status_type.onThink( this, GSPEED ) )
			{
				this.remove();
				return true;
			}
		}
		
		if ( isforless )
		if ( this.remove_if_for_removed )
		{
			this.remove();
			return true;
		}
	}
	
	/*Draw( ctx, attached )
	{
		ctx.fillStyle = '#00ff00';
		ctx.fillRect( -50, -50, 100, 100 );
	}*/
	
	DrawFG( ctx, attached )
	{
		let status_type = sdStatusEffect.types[ this.type ];
		
		if ( status_type )
		if ( status_type.DrawFG )
		status_type.DrawFG( this, ctx, attached );
	}
}
export default sdStatusEffect;
