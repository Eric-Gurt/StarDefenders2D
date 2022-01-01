/*

	Task entities that are attached to player

	sdStatusEffects effects could be implemented similarly

*/
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';

import sdRenderer from '../client/sdRenderer.js';

class sdTask extends sdEntity
{
	static init_class()
	{
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
		
		sdTask.img_red_arrow = sdWorld.CreateImageFromFile( 'task_offscreen' );
		
		sdTask.APPEARANCE_ATTACK_POINT = 1; // Attack something, like anti-crystal
		sdTask.APPEARANCE_STARRED = 2; // Players can star their base perhaps? Not sure yet
		sdTask.APPEARANCE_HINT_POINT = 3;
		
		sdTask.missions = [];
		
		let id = 0;
		sdTask.missions[ sdTask.MISSION_NO_MISSION = id++ ] = 
		{
			appearance: sdTask.APPEARANCE_STARRED,
	
			GetDefaultTitle: ( task )=>{
				return 'sdTask.MISSION_NO_MISSION task';
			},
			GetDefaultDescription: ( task )=>{
				return 'You should specify .mission when making new task';
			},
			GetDefaultTimeLeft: ( task )=>
			{
				return -1;
			},
			
			completion_condition: ( task )=>
			{
				return false;
			},
			onCompletion: ( task )=>
			{
				// With LRTs, it is usually impossible to detect if something was removed or just teleported
			},
			onTimeOut: ( task )=>
			{
			}
		};
		sdTask.missions[ sdTask.MISSION_DESTROY_ENTITY = id++ ] = 
		{
			appearance: sdTask.APPEARANCE_ATTACK_POINT,
	
			GetDefaultTitle: ( task )=>{
				return 'Eliminate';
			},
			GetDefaultDescription: ( task )=>{
				return 'There is an unspecified urgency to destroy ' + sdWorld.ClassNameToProperName( task._target.GetClass(), task._target );
			},
			GetDefaultTimeLeft: ( task )=>
			{
				return -1;
			},
			
			completion_condition: ( task )=>
			{
				if ( !task._target || task._target._is_being_removed )
				return true;
			
				return false;
			}
		};
		sdTask.missions[ sdTask.MISSION_TRACK_ENTITY = id++ ] = 
		{
			appearance: sdTask.APPEARANCE_HINT_POINT,
	
			GetDefaultTitle: ( task )=>{
				return 'Track';
			},
			GetDefaultDescription: ( task )=>{
				return 'There is an unspecified urgency to track ' + sdWorld.ClassNameToProperName( task._target.GetClass(), task._target );
			},
			GetDefaultTimeLeft: ( task )=>
			{
				return -1;
			},
			
			completion_condition: ( task )=>
			{
				if ( !task._target || task._target._is_being_removed )
				return true;
			
				return false;
			}
		};
		
		sdTask.tasks = [];
	}
	
	static WakeUpTasksFor( character )
	{
		for ( let i = 0; i < sdTask.tasks.length; i++ )
		{
			if ( sdTask.tasks[ i ]._executer === character )
			if ( !sdTask.tasks[ i ]._is_being_removed )
			sdTask.tasks[ i ].SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		}
	}
	
	static MakeSureCharacterHasTask( params )
	{
		if ( params.similarity_hash === undefined )
		throw new Error( '.similarity_hash is required when calling this method' );
	
		for ( let i = 0; i < sdTask.tasks.length; i++ )
		if ( sdTask.tasks[ i ]._executer === params.executer )
		if ( sdTask.tasks[ i ]._similarity_hash === params.similarity_hash )
		{
			if ( typeof params.time_left !== 'undefined' )
			sdTask.tasks[ i ].time_left = Math.max( sdTask.tasks[ i ].time_left, params.time_left );
		
			return;
		}
	
		let task = new sdTask( params );
		sdEntity.entities.push( task );
	}
	
	IsVisible( observer_entity )
	{
		return ( observer_entity === this._executer );
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_executer' ) return true;
		if ( prop === '_target' ) return true;
		
		return false;
	}
	
	constructor( params )
	{
		super( params );
		
		//if ( !sdWorld.is_server )
		//EnforceChangeLog( this, '_is_being_removed' );
		
		this._executer = params.executer || null; // Who is responsible for completion of this task. Make extra task for each alive character
		
		this._target = params.target || null;
		this.target_hitbox_y1 = this._target ? this._target._hitbox_y1 : 0;
		//this._target_title = sdWorld.ClassNameToProperName( this._target.GetClass(), this._target );
		
		this._similarity_hash = params.similarity_hash; // In some cases it can be used to prevent spawning of similar tasks. For example it can be called 'Destroy-1239123921'
		
		this.mission = params.mission || 0;
		
		let mission = sdTask.missions[ this.mission ];
		
		if ( mission )
		{
			try
			{
				this.title = mission.GetDefaultTitle( this );
				this.description = mission.GetDefaultDescription( this );
				this.time_left = mission.GetDefaultTimeLeft( this );
			}
			catch( e ) 
			{
				this.title = 'Error at title';
				this.description = 'Error at description';
				this.time_left = -1;
			}
		}
		
		if ( params.title !== undefined )
		this.title = params.title;
	
		if ( params.description !== undefined )
		this.description = params.description;
	
		if ( params.time_left !== undefined )
		this.time_left = params.time_left;
		
		
		if ( this._target )
		{
			this.target_x = this._target.x;
			this.target_y = this._target.y;
		}
		else
		{
			this.target_x = 0;
			this.target_y = 0;
		}
		
		this._anim_morph = 0;
		
		//this.appearance = params.appearance;
		
		sdTask.tasks.push( this );
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
	{ return 4; }
	
	
	onRemoveAsFakeEntity()
	{
		sdTask.tasks.splice( sdTask.tasks.indexOf( this ), 1 );
	}
	onBeforeRemove()
	{
		sdTask.tasks.splice( sdTask.tasks.indexOf( this ), 1 );
	}
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( !this._executer || this._executer._is_being_removed )
			{
				this.remove();
				return;
			}
		}
		else
		{
			this._executer = sdWorld.my_entity;
			
			if ( !this._executer )
			return;
		}
		
		this.x = this._executer.x;
		this.y = this._executer.y;
		
		
		let mission = sdTask.missions[ this.mission ];
		
		if ( mission )
		{
			if ( sdWorld.is_server )
			if ( mission.completion_condition( this ) )
			{
				if ( mission.onCompletion )
				mission.onCompletion( this );
				
				this.remove();
				return;
			}

			if ( this._target )
			{
				if ( this.target_x !== this._target.x || this.target_y !== this._target.y )
				{
					this.target_x = this._target.x;
					this.target_y = this._target.y;
					this._update_version++;
				}
			}
			
			if ( this.time_left > 0 )
			{
				let new_v = this.time_left - GSPEED;
				this.time_left = new_v;
				
				if ( Math.floor( this.time_left / 30 ) !== Math.floor( new_v  / 30 ) )
				this._update_version++;
					
				if ( new_v <= 0 )
				if ( mission.onTimeOut )
				mission.onTimeOut( this );
			}
		}
		
		if ( sdWorld.is_server )
		if ( this._executer._socket === null )
		{
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}
	
	/*Draw( ctx, attached )
	{
		ctx.fillStyle = '#00ff00';
		ctx.fillRect( -50, -50, 100, 100 );
	}*/
	
	DrawFG( ctx, attached )
	{
		let x = sdWorld.camera.x;
		let y = sdWorld.camera.y;
		
		ctx.translate( x - this.x, y - this.y );
		
		let dx = this.target_x - x;
		let dy = this.target_y - y;
		let di = sdWorld.Dist2D_Vector( dx, dy );
		
		let dxA = 0;
		let dyA = 0;
		//let anA = 0;
		
		let dxB = 0;
		let dyB = 0;
		//let anB = 0;
		
		let an;
		
		
        /*
            dxA * s * dxA * s + dyA * s * dyA * s = 200 * 200
            dyA * s = 100

            s = 100 / dyA

            dxA^2 * s^2 + dyA^2 * s^2 = 200 * 200

            s^2 = ( 200 * 200 ) / ( dxA^2 + dyA^2 )

            s = sqrt( ( 200 * 200 ) / ( dxA^2 + dyA^2 ) )
		*/
		
		let far_dist_horiz = 200;
		let far_dist_vert = far_dist_horiz / document.body.clientWidth * document.body.clientHeight;
		
		let far_dist_default = Math.sqrt( far_dist_horiz * far_dist_horiz + far_dist_vert * far_dist_vert );

		// When far
		dxA = dx / di * far_dist_default;
		dyA = dy / di * far_dist_default;
		//anA = Math.atan2( -dy, -dx );
	   
		let s = 1;
		
		if ( dyA > far_dist_vert )
		dyA = far_dist_vert;
		if ( dyA < -far_dist_vert )
		dyA = -far_dist_vert;
		if ( dxA > far_dist_horiz )
		dxA = far_dist_horiz;
		if ( dxA < -far_dist_horiz )
		dxA = -far_dist_horiz;
	
		s = Math.min( s, Math.sqrt( ( far_dist_default * far_dist_default ) / ( dxA * dxA + dyA * dyA ) ) );
		
		dxA *= s;
		dyA *= s;

		// When near
		dxB = dx;
		dyB = dy - 10 + this.target_hitbox_y1;
		//anB = -Math.PI / 2;
		
		if ( di > 200 )
		{
			this._anim_morph = Math.min( 1, this._anim_morph + 0.05 );
			//dx = dx / di * 200;
			//dy = dy / di * 200;
			
			//ctx.translate( dx, dy );
			//ctx.rotate( Math.atan2( -dy, -dx ) );
			an = Math.atan2( -dy, -dx );
		}
		else
		{
			this._anim_morph = Math.max( 0, this._anim_morph - 0.05 );
			
			//ctx.translate( dx, dy - 10 + this.target_hitbox_y1 );
			//ctx.rotate( -Math.PI / 2 );
			an = -Math.PI / 2;
		}
		
		ctx.translate(  dxA * this._anim_morph + dxB * ( 1 - this._anim_morph ),
						dyA * this._anim_morph + dyB * ( 1 - this._anim_morph ) );
			
		
		
		ctx.rotate( an );
		//ctx.rotate( anA * this._anim_morph + anB * ( 1 - this._anim_morph ) );

		ctx.translate( ( sdWorld.time % 1000 < 500 ) ? 1 : 0, 0 );
		
		let img = sdTask.img_red_arrow;
		
		let mission = sdTask.missions[ this.mission ];
		
		if ( mission )
		{
			if ( mission.appearance === sdTask.APPEARANCE_HINT_POINT )
			{
				ctx.filter = 'hue-rotate(71deg) saturate(20)';
			}
		}
		
		ctx.drawImageFilterCache( img, 
			- 16, 
			- 16, 
			32,32 
		);

		ctx.filter = 'none';
	}
	
	DrawTaskInterface( ctx, scale )
	{
		ctx.font = 11*scale + "px Verdana";
		
		const PutMultilineText = ( text, subtext=false )=>
		{
			let later_text = null;
			
			const break_each = 40;
			
			if ( text.length > break_each )
			{
				let parts = text.split(' ');
				let length = 0;
				for ( let p = 0; p < parts.length; p++ )
				{
					let word_size = parts[ p ].length;
					if ( p > 0 )
					if ( length + word_size > break_each )
					{
						text = parts.slice( 0, p ).join(' ');
						later_text = parts.slice( p ).join(' ');
						break;
					}
					length += word_size;
				}
			}
			
			ctx.fillText( text, subtext ? 5 * scale : 0, 0 );
			ctx.translate( 0, ( 11 + 5 ) * scale );
			
			if ( later_text !== null )
			PutMultilineText( later_text, subtext );
		};
		
		ctx.globalAlpha = 1;
		ctx.fillStyle = '#aaffaa';
		PutMultilineText( this.title );
		
		ctx.globalAlpha = 0.5;
		ctx.fillStyle = '#ffffff';
		PutMultilineText( this.description, true );
		
		if ( this.time_left !== -1 )
		{
			ctx.globalAlpha = 1;
			ctx.fillStyle = '#ffff00';
			
			let seconds = Math.floor( this.time_left / 30 * 1000 );
			
			PutMultilineText( Math.floor( seconds / 60 / 60 ) + ':' + ( Math.floor( seconds / 60 ) % 60 ) + ':' + ( seconds % 60 ), true );
		}
		
		ctx.globalAlpha = 1;
		ctx.translate( 0, ( 11 + 5 ) * scale );
	}
}
export default sdTask;