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
		
		sdTask.APPEARANCE_NOTHING = 0;
		sdTask.APPEARANCE_ATTACK_POINT = 1; // Attack something, like anti-crystal
		sdTask.APPEARANCE_STARRED = 2; // Players can star their base perhaps? Not sure yet
		sdTask.APPEARANCE_HINT_POINT = 3;
		sdTask.APPEARANCE_GET_ITEM = 4;
		
		sdTask.missions = [];
		
		let id = 0;
		sdTask.missions[ sdTask.MISSION_NO_MISSION = id++ ] = 
		{
			appearance: sdTask.APPEARANCE_STARRED,
	
			onTaskMade: ( task, params )=>
			{
				// Create extra properties here
			},
	
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
			},
			onLongRangeTeleportCalledForEntity: ( task, long_range_teleport, entity )=>
			{
				return false; // False means ignore entity
			},
			onLongRangeTeleportCalled: ( task, long_range_teleport )=> // Called after it gone through all entities
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
				return 'There is an unspecified urgency to destroy ' + ( task._target ? sdWorld.ClassNameToProperName( task._target.GetClass(), task._target ) : 'something' );
			},
			GetDefaultTimeLeft: ( task )=>
			{
				return -1;
			},
			onCompletion: ( task )=>
			{
				task._executer._task_reward_counter += task._difficulty; // Only workaround I can see since I can't make it put onComplete and work in task parameters - Booraz149
			},
			completion_condition: ( task )=>
			{
				if ( !task._target || task._target._is_being_removed )
				return true;
			
				return false;
			},
			onTimeOut: ( task )=>
			{
				task.remove();
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
		sdTask.reward_claim_task_amount = 0.5; // was 1
		sdTask.missions[ sdTask.MISSION_TASK_CLAIM_REWARD = id++ ] = 
		{
			appearance: sdTask.APPEARANCE_NOTHING,
	
			GetDefaultTitle: ( task )=>{
				return 'Claim rewards';
			},
			GetDefaultDescription: ( task )=>{
				return 'Your good performance has been noticed by the mothership. Claim rewards they are willing to send through a long range teleporter.';
			},
			GetDefaultTimeLeft: ( task )=>
			{
				return -1;
			},
			
			completion_condition: ( task )=>
			{
				if ( task._executer._task_reward_counter < sdTask.reward_claim_task_amount )
				return true;
				else
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
		sdTask.missions[ sdTask.MISSION_LRTP_EXTRACTION = id++ ] = 
		{
			appearance: sdTask.APPEARANCE_GET_ITEM,
	
			onTaskMade: ( task, params )=>
			{
				// Create extra properties here
				
				task._lrtp_ents_count = 0;
				task._lrtp_ents_needed = params.lrtp_ents_needed || 1; // For LRT delivery tasks
				
				task._lrtp_matter_capacity_current = 0;
				task._lrtp_matter_capacity_needed = params.lrtp_matter_capacity_needed || -1;
				
				if ( task._target )
				{
					task._lrtp_ents_needed = 1;
				}
				
				task._lrtp_class_proprty_value_array = params.lrtp_class_proprty_value_array || null; // [ Class, property, expected_value ] - should be enough to describe everything, especially if you will make "getters" on required entity.

				//task.extra = params.extra || 0; // For LRT delivery tasks, used to determine entity type ( sdCrystal, sdJunk )
				//task._type = params.type || 0; // "Public event task" or regular? If it's set to 1, task will be in active state regardless if player disconnected.
				
				if ( task._lrtp_matter_capacity_needed !== -1 )
				task.SetBasicProgress( task._lrtp_matter_capacity_current, task._lrtp_matter_capacity_needed );
				else
				task.SetBasicProgress( task._lrtp_ents_count, task._lrtp_ents_needed );
			},
	
			GetDefaultTitle: ( task )=>{
				return 'Extract an entity';
			},
			GetDefaultDescription: ( task )=>{
				return 'You really need to add a description here.';
			},
			GetDefaultTimeLeft: ( task )=>
			{
				return -1;
			},
			onCompletion: ( task )=>
			{
				task._executer._task_reward_counter += task._difficulty; // Only workaround I can see since I can't make it put onComplete and work in task parameters - Booraz149
			},
			completion_condition: ( task )=>
			{
				if ( task._lrtp_matter_capacity_needed !== -1 )
				{
					// Matter capacity-based
					if ( task._lrtp_matter_capacity_current >= task._lrtp_matter_capacity_needed )
					return true;
				}
				else
				{
					// Count-based
					if ( task._lrtp_ents_count >= task._lrtp_ents_needed )
					return true;
				}
				
				
				if ( task._lrtp_class_proprty_value_array )
				{
					// In case of not specific entity
				}
				else
				{
					// Specific entity
					if ( !task._target || task._target._is_being_removed ) // Am I doing something illegal here? Keep in mind on CC extraction tasks target is something like 'sdCrystal' or 'sdJunk', but not actual entity, while this is for actual entities which need extraction - Booraz149
					task.remove();
				}
			
				return false;
			},
			onTimeOut: ( task )=>
			{
				task.remove();
			},
			
			onLongRangeTeleportCalledForEntity: ( task, long_range_teleport, entity )=>
			{
				let matches_expectations = false;
				
				if ( task._lrtp_class_proprty_value_array )
				{
					if ( task._lrtp_ents_count < task._lrtp_ents_needed || // Do not take extra items so other tasks could pick them up instead
						 ( task._lrtp_matter_capacity_needed !== -1 && task._lrtp_matter_capacity_current < task._lrtp_matter_capacity_needed ) )
					if ( entity.GetClass() === task._lrtp_class_proprty_value_array[ 0 ] )
					{
						matches_expectations = true;

						for ( let i = 1; i < task._lrtp_class_proprty_value_array.length; i += 2 )
						{
							let prop = task._lrtp_class_proprty_value_array[ i ];
							let value = task._lrtp_class_proprty_value_array[ i + 1 ];

							if ( entity[ prop ] !== value )
							{
								matches_expectations = false;
								break;
							}
						}
					}
				}
				else
				{
					if ( entity === task._target )
					matches_expectations = true;
				}
				

				if ( matches_expectations )
				{
					if ( task._lrtp_matter_capacity_needed !== -1 )
					task._lrtp_matter_capacity_current += entity.matter_max || entity._matter_max || 0;
					
					task._lrtp_ents_count++;
					
					if ( task._lrtp_matter_capacity_needed !== -1 )
					task.SetBasicProgress( task._lrtp_matter_capacity_current, task._lrtp_matter_capacity_needed );
					else
					task.SetBasicProgress( task._lrtp_ents_count, task._lrtp_ents_needed );
					
					return true; // Correct entity
				}

				return false; // False means ignore entity
			}
		};
		
		sdTask.missions[ sdTask.MISSION_TIMED_NOTIFICATION = id++ ] = 
		{
			appearance: sdTask.APPEARANCE_NOTHING,
	
			completion_condition: ( task )=>
			{
				return false;
			},
			onTimeOut: ( task )=>
			{
				task.remove();
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
	
		let tasks = 0;
	
		for ( let i = 0; i < sdTask.tasks.length; i++ )
		if ( sdTask.tasks[ i ]._executer === params.executer )
		{
			if ( sdTask.tasks[ i ]._similarity_hash === params.similarity_hash )
			{
				if ( typeof params.time_left !== 'undefined' )
				sdTask.tasks[ i ].time_left = Math.max( sdTask.tasks[ i ].time_left, params.time_left );

				return false;
			}
			
			tasks++;
			
			if ( tasks > 32 )
			return false; // Too many tasks - prevent server issues this way
		}
	
		let task = new sdTask( params );
		sdEntity.entities.push( task );
		
		return true;
	}
	
	IsVisible( observer_entity )
	{
		return ( observer_entity === this._executer );
	}
	
	ExtraSerialzableFieldTest( prop )
	{
		if ( prop === '_executer' ) return true;
		if ( prop === '_target' ) return true;
		if ( prop === '_lrtp_class_proprty_value_array' ) return true;
		
		return false;
	}
	
	SetBasicProgress( current, total )
	{
		this.progress = '( ' + current + ' / ' + total + ' )';
		this._update_version++;
	}
	
	constructor( params )
	{
		super( params );
		
		// Note: Do not make extra properties here since these willl appear for all kinds of tasks, which means overcomplicating them. Use .onTaskMade as part of a specific mission

		this._executer = params.executer || null; // Who is responsible for completion of this task. Make extra task for each alive character
		this._is_global = params.is_global || false; // All players can execute it


		this._difficulty = params.difficulty || 0.1; // Task difficulty, decides how much percentage the player gets closer towards task rewards when completed ( 1 = 100%, 0.1 = 10%)
		
		this._target = params.target || null;
		this.target_hitbox_y1 = this._target ? this._target._hitbox_y1 : 0;
		//this._target_title = sdWorld.ClassNameToProperName( this._target.GetClass(), this._target );
		//this.extract_target = params.extract_target || 0; // For "Extract entity tasks" , like "Rescue / Arrest Star Defender" event
		
		this._similarity_hash = params.similarity_hash; // In some cases it can be used to prevent spawning of similar tasks. For example it can be called 'Destroy-1239123921'
		
		this.mission = params.mission || 0;
		
		let mission = sdTask.missions[ this.mission ];
	
		this.progress = '';
		
		if ( mission )
		{
			try
			{
				if ( mission.onTaskMade )
				mission.onTaskMade( this, params );
			
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
		let id = sdTask.tasks.indexOf( this );
		
		if ( id !== -1 )
		sdTask.tasks.splice( id, 1 );
		else
		console.warn( 'Warning: sdTask is removed... Twice?' );
	}
	onBeforeRemove()
	{
		this.onRemoveAsFakeEntity();
	}
	
	CameraDistanceScale3D( layer ) // so far layer is only FG (1), usually only used by chat messages
	{ return 0.85; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{
			if ( !this._is_global )
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
		//if ( this._executer._socket === null && this._type === 0 ) Let's just wake up updated tasks instead // task._type = 1 is for public events which all players can contribute towards, so it should disappear regardless if player disconnects. ( Example - sdWeather.EVENT_CRYSTALS_MATTER )
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
		
		if ( this.target_x !== 0 || this.target_y !== 0 ) // For target-less version of task like sdTask.MISSION_LRTP_EXTRACTION
		{

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


			if ( mission.appearance !== sdTask.APPEARANCE_NOTHING )//|| this.extract_target === 1 )
			ctx.drawImageFilterCache( img, 
				- 16, 
				- 16, 
				32,32 
			);

		}
		

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

		//if ( this.mission === sdTask.MISSION_LRTP_EXTRACTION )
		//{
			ctx.fillStyle = '#ffff00';
			PutMultilineText( this.progress, true );//'(' + this.lrtp_ents_count + '/' + this.lrtp_ents_needed + ')' , true );
		//}
		
		if ( this.time_left !== -1 )
		{
			ctx.globalAlpha = 1;
			ctx.fillStyle = '#ffff00';
			
			let seconds = Math.floor( this.time_left / 30 ); // Used to be "Math.floor( this.time_left / 30 * 1000 );" but seems to be inaccurate.
			
			function TwoDigits( n )
			{
				if ( n < 10 )
				return '0' + n;
			
				return n;
			}
			
			PutMultilineText( Math.floor( seconds / 60 / 60 ) + ':' + TwoDigits( Math.floor( seconds / 60 ) % 60 ) + ':' + TwoDigits( seconds % 60 ), true );
		}
		
		ctx.globalAlpha = 1;
		ctx.translate( 0, ( 11 + 5 ) * scale );
	}
}
export default sdTask;
