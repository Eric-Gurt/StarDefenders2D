import sdShop from '../client/sdShop.js';
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdCom from './sdCom.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';
import sdGun from './sdGun.js';
import sdTask from './sdTask.js';
import sdFactions from './sdFactions.js';


import sdRenderer from '../client/sdRenderer.js';


class sdBeamProjector extends sdEntity
{
	static init_class()
	{
		sdBeamProjector.img_bp = sdWorld.CreateImageFromFile( 'sdBeamProjector' );

		/*
		sdBeamProjector.img_bp = sdWorld.CreateImageFromFile( 'beam_projector' );
		sdBeamProjector.img_bp_working = sdWorld.CreateImageFromFile( 'beam_projector_working' );
		sdBeamProjector.img_bp_blocked = sdWorld.CreateImageFromFile( 'beam_projector_blocked' );
		*/
		sdBeamProjector.img_crystal = sdWorld.CreateImageFromFile( 'crystal' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -12; }
	get hitbox_y2() { return 16; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		dmg = dmg / 2; // Damage shouldn't be too impactful so it doesn't deny progress that much during gunfire

		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			//this._update_version++;

			if ( this.hea <= 0 )
			{
				this.remove();
			}
			/*else
			{
				this._regen_timeout = 30 * 10;
			}*/
		}
	}
	constructor( params )
	{
		super( params );

		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 1000 * 4;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		this._cooldown = 0;
		this.has_anticrystal = false;
		this.has_players_nearby = false; // Once a second it checks if any players are close to it so it can progress. Incentivizes defending by standing near it.
		this.no_obstacles = false; // Does it have any obstacles above it which prevents beam going to sky?
		this._spawn_timer = 600;
		this._enemies_spawned = 0; 
		//this.matter_max = 5500;
		//this.matter = 100;
		
		this._armor_protection_level = 0;
		this._regen_mult = 1;
	}

	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	/*GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdGun', 'sdBullet', 'sdCharacter' ];
	}*/

	/*onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:1 });
	}*/

	get mass() { return this.has_anticrystal ? 130 : 100; } // Recommended to move with vehicles if blocked by something
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return 2000;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );

		if (!sdWorld.is_server)
		return;

		if ( this.hea === this.hmax && this.has_anticrystal )
		{
			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius:70, // 80 was too much?
				damage_scale: 0.01, // 5 was too deadly on relatively far range
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this,
				color:'#000000' 
			});

			let x = this.x;
			let y = this.y;
			//let sx = this.sx;
			//let sy = this.sy;

			setTimeout(()=>{ // Hacky, without this gun does not appear to be pickable or interactable...

			let gun;
			gun = new sdGun({ x:x, y:y, class:sdGun.CLASS_BUILDTOOL_UPG });
			gun.extra = 2;

			//gun.sx = sx;
			//gun.sy = sy;
			sdEntity.entities.push( gun );

			}, 500 );


			for( let i = 0; i < sdTask.tasks.length; i++ )
			{
				if ( sdTask.tasks[ i ].mission === sdTask.MISSION_TRACK_ENTITY )
				if ( sdTask.tasks[ i ]._target === this )
				{
					sdTask.tasks[ i ]._executer._task_reward_counter += 0.25;
				}
			}

			this.remove();
		}

		this._armor_protection_level = 0; // Never has protection
		if ( !this.has_anticrystal ) // Can't "charge" up if there's no anticrystal
		{
			this._regen_timeout = 150;
			if ( this.hea < 1000 )
			this.hea -= GSPEED; // Lose health when unattended
		}
		else
		{
			if ( this._spawn_timer > 0 )
			this._spawn_timer -= GSPEED;

			if ( this._spawn_timer <= 0 && this.no_obstacles && this.has_players_nearby )
			{
				this._spawn_timer = 300;
				let ais = 0;
				//let percent = 0;
				for ( var i = 0; i < sdCharacter.characters.length; i++ )
				{
					if ( sdCharacter.characters[ i ].hea > 0 )
					if ( !sdCharacter.characters[ i ]._is_being_removed )
					if ( sdCharacter.characters[ i ]._ai_team === 3 )
					{
						ais++;
						//console.log(ais);
					}
				}
				{

					let councils = 0;
					let councils_tot = Math.min( 4, Math.max( 2, 1 + sdWorld.GetPlayingPlayersCount() ) );

					let left_side = ( Math.random() < 0.5 );

					while ( councils < councils_tot )
					{

						let character_entity = new sdCharacter({ x:0, y:0, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });

						sdEntity.entities.push( character_entity );
						character_entity.s = 110;

						{
							let x,y;
							let tr = 1000;
							do
							{
								if ( left_side )
								{
									x = this.x + 16 + 16 * councils + ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * councils + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * councils - ( Math.random() * 192 );
								}
								else
								{
									x = this.x - 16 - 16 * councils - ( Math.random() * 192 );

									if (x < sdWorld.world_bounds.x1 + 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x1 + 32 + 16 + 16 * councils + ( Math.random() * 192 );

									if (x > sdWorld.world_bounds.x2 - 32 ) // Prevent out of bound spawns
									x = sdWorld.world_bounds.x2 - 32 - 16 - 16 * councils - ( Math.random() * 192 );
								}

								y = this.y + 192 - ( Math.random() * ( 384 ) );
								if ( y < sdWorld.world_bounds.y1 + 32 )
								y = sdWorld.world_bounds.y1 + 32 + 192 - ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( y > sdWorld.world_bounds.y2 - 32 )
								y = sdWorld.world_bounds.y1 - 32 - 192 + ( Math.random() * ( 192 ) ); // Prevent out of bound spawns

								if ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) )
								if ( sdWorld.CheckLineOfSight( x, y, this.x, this.y, character_entity, sdCom.com_visibility_ignored_classes, null ) )
								//if ( !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) )
								//if ( sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material === sdBlock.MATERIAL_GROUND ) ) // Only spawn on ground
								{
									character_entity.x = x;
									character_entity.y = y;

									sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_COUNCIL );

									const logic = ()=>
									{
										if ( character_entity._ai ) // AI moving so it stays close to the Beam projector
										{

											if ( character_entity.x > this.x + 32 )
											character_entity._ai.direction = -1;
							
											if ( character_entity.x < this.x - 32 )
											character_entity._ai.direction = 1;

											if ( character_entity.y < this.y - 32 )
											character_entity._key_states.SetKey( 'KeyW', 1 );

											//if ( character_entity._ai.target === null )
											//character_entity._ai.target = this;
										}
										if ( character_entity.hea <= 0 )
										if ( !character_entity._is_being_removed )
										{
											sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
											character_entity.remove();
										}
							
									};
						
							
									setInterval( logic, 1000 );
									setTimeout(()=>
									{
										clearInterval( logic );
							
							
										if ( !character_entity._is_being_removed )
										{
											sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
											sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170/*, filter:'hue-rotate(' + ~~( 170 ) + 'deg)'*/ });
											character_entity.remove();

											character_entity._broken = false;
										}
									}, 20000 ); // Despawn the Council Vanquishers if they are in world longer than intended

									break;
							}


							tr--;
							if ( tr < 0 )
							{
								character_entity.remove();
								character_entity._broken = false;
								break;
							}
						} while( true );
					}
					councils++;
					ais++;
					}
				}
			}
		}
		if ( this._regen_timeout > 0 )
		{
			this._regen_timeout -= GSPEED;
			if ( this.has_anticrystal ) 
			{
				if ( this._regen_timeout <= 30 && this.has_players_nearby )
				if ( Math.round( this._regen_timeout % 10 ) === 0 )
				{
					if ( sdWorld.CheckLineOfSight( this.x, this.y - 16, this.x, sdWorld.world_bounds.y1, this, sdCom.com_visibility_ignored_classes, null ) )
					{
						sdWorld.SendEffect({ x: this.x, y:this.y - 16, x2:this.x , y2:sdWorld.world_bounds.y1, type:sdEffect.TYPE_BEAM, color:'#333333' });
						this.no_obstacles = true;
						//this._update_version++;
					}
					else
					{
						sdWorld.SendEffect({ x: this.x, y:this.y - 16, x2:this.x , y2:sdWorld.last_hit_entity.y, type:sdEffect.TYPE_BEAM, color:'#333333' });
						this.no_obstacles = false;
						//this._update_version++;
					}
				}
			}
		}
		else
		{
			this._regen_timeout = 150; // So it doesn't spam GetAnythingNear when _regen_timeout is 0
			this.has_players_nearby = false;
			//this._update_version++;

			let players = sdWorld.GetAnythingNear( this.x, this.y, 256, null, [ 'sdCharacter' ] );
			for ( let i = 0; i < players.length; i++ )
			{
				if ( players[ i ].GetClass() === 'sdCharacter' && !players[ i ]._ai && players[ i ]._ai_team === 0  && players[ i ].hea > 0 )
				if ( players[ i ]._socket !== null )
				{
					sdTask.MakeSureCharacterHasTask({ 
						similarity_hash:'TRACK-'+this._net_id, 
						executer: players[ i ],
						target: this,
						mission: sdTask.MISSION_TRACK_ENTITY,
										
						title: 'Protect dark matter beam projector',
						description: 'Protect the dark matter beam projector so it can try to shrink parts of the expanding black hole! If it stops working, restart it!'
					});

					if ( sdWorld.CheckLineOfSight( this.x, this.y - 16, players[ i ].x, players[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) ) // Needs line of sight with players, otherwise it doesn't work
					{
						if ( this.hea < this.hmax )
						if ( this.no_obstacles ) // No progression if the beam can't go into the sky
						{
							this.hea = Math.min( this.hea + GSPEED * 120 * this._regen_mult, this.hmax );
							//if ( sdWorld.is_server )
							//this.hea = this.hmax; // Hack
							this._regen_timeout = 30;
							this.has_players_nearby = true;
							//this._update_version++;
							return;
						}
					}
				}
			}
		}
		
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdCrystal ) )
		if ( !from_entity._is_being_removed )
		if ( from_entity.matter_max === sdCrystal.anticrystal_value && from_entity.type === sdCrystal.TYPE_CRYSTAL && from_entity.held_by === null )
		if ( !this.has_anticrystal )
		{
			this.has_anticrystal = true;
			this.hmax = 30000;
			this.hea = 1000;
			from_entity.remove();
			//this._update_version++;
		}
		if ( from_entity.is(sdCharacter ) )
		if ( from_entity.hea > 0 )
		if ( !from_entity._ai )
		{
			this.has_players_nearby = true;
			this._regen_timeout = Math.min( this._regen_timeout, 30 );
		}
		
	}
	get title()
	{
		return 'Dark matter beam projector';
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		
		if ( !this.has_anticrystal )
		xx = 0;
		//ctx.drawImageFilterCache( sdBeamProjector.img_bp, -16, -16, 32, 32 );
		else
		{
			if ( this.no_obstacles === true && this.has_players_nearby === true )
			xx = 1;
			//ctx.drawImageFilterCache( sdBeamProjector.img_bp_working, -16, -16, 32, 32 );
			else
			xx = 2;
			//ctx.drawImageFilterCache( sdBeamProjector.img_bp_blocked, -16, -16, 32, 32 );
		}
		ctx.drawImageFilterCache( sdBeamProjector.img_bp, xx * 32, 0, 32,32, -16, -16, 32,32 );

		ctx.globalAlpha = 1;
		ctx.filter = sdWorld.GetCrystalHue( sdCrystal.anticrystal_value );
		ctx.filter += ' saturate(' + (Math.round(( 2 )*10)/10) + ') brightness(' + (Math.round(( 1 * 10 )*10)/10) + ')';

		if ( this.has_anticrystal )
		ctx.drawImageFilterCache( sdBeamProjector.img_crystal, -16, -30, 32, 32 );


		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( !this.has_anticrystal )
		sdEntity.Tooltip( ctx, "Dark matter beam projector (needs natural Anti-crystal) ", 0, -10 );
		else
		if ( this.has_players_nearby && this.no_obstacles )
		sdEntity.Tooltip( ctx, "Dark matter beam projector", 0, -10 );
		else
		sdEntity.Tooltip( ctx, "Dark matter beam projector ( disabled )", 0, -10 );

		let w = 40;
		if ( this.has_anticrystal )
		{
			ctx.fillStyle = '#000000';
			ctx.fillRect( 0 - w / 2, 0 - 23, w, 3 );

			ctx.fillStyle = '#FF0000';
			ctx.fillRect( 1 - w / 2, 1 - 23, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		}
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	}
	onRemoveAsFakeEntity()
	{
	}
}
//sdBeamProjector.init_class();

export default sdBeamProjector;
