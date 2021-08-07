
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdCharacter from './sdCharacter.js';
import sdDoor from './sdDoor.js';


import sdRenderer from '../client/sdRenderer.js';


class sdAntigravity extends sdEntity
{
	static init_class()
	{
		sdAntigravity.img_antigravity = sdWorld.CreateImageFromFile( 'antigravity' );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -16; }
	get hitbox_x2() { return 16; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 0; }
	
	get hard_collision()
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
		
		if ( this._hea > 0 )
		{
			this._hea -= dmg;
			this._regen_timeout = 60;

			if ( this._hea <= 0 )
			this.remove();
		}
	}
	constructor( params )
	{
		super( params );
		
		this._hmax = 200;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		
		this.power = 1;
		
		//this._update_version++
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter + 50;
	}
	
	get spawn_align_x(){ return 8; };
	get spawn_align_y(){ return 8; };
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			this._hea = Math.min( this._hea + GSPEED, this._hmax );
		}
		
		var non_recursive = new WeakSet();
		
		for ( var t = 0; t < 2; t++ )
		{
			var x1 = this.x + this._hitbox_x1 + ( this._hitbox_x2 - this._hitbox_x1 ) / 2 * t;
			var y1 = this.y - 16;
			
			var x2 = x1 + ( this._hitbox_x2 - this._hitbox_x1 ) / 2;
			var y2 = y1 + 16;
			
			var max_h = this.power === -1 ? 3 : 16;
		
			//var non_recursive = new Map();
			
			//var worked_out_arrs = [];
		
			//progress_loop:
			for ( var s = 0; s < max_h; s++ )
			{
				//if ( Math.random() < 0.01 )
				//sdWorld.SendEffect({ x:x1+(x2-x1)*Math.random(), y:y1+(y2-y1)*Math.random(), type:sdEffect.TYPE_WALL_HIT });
								
				//var arr = sdWorld.RequireHashPosition( x, y );
				
				/*var xx_from = ~~( x1 / 32 ); // Overshoot no longer needed, due to big entities now taking all needed hash arrays
				var yy_from = ~~( y1 / 32 );
				var xx_to = ~~( x2 / 32 );
				var yy_to = ~~( y2 / 32 );*/
				
				/*var xx_from = Math.floor( x1 / 32 ); // Overshoot no longer needed, due to big entities now taking all needed hash arrays
				var yy_from = Math.floor( y1 / 32 );
				var xx_to = Math.floor( x2 / 32 );
				var yy_to = Math.floor( y2 / 32 );*/
				

				let xx_from = sdWorld.FastFloor( x1 / 32 );
				let yy_from = sdWorld.FastFloor( y1 / 32 );
				let xx_to = sdWorld.FastCeil( x2 / 32 );
				let yy_to = sdWorld.FastCeil( y2 / 32 );
				
				//for ( var xx = xx_from; xx <= xx_to; xx++ )
				//for ( var yy = yy_from; yy <= yy_to; yy++ )
				for ( var xx = xx_from; xx < xx_to; xx++ )
				for ( var yy = yy_from; yy < yy_to; yy++ )
				{
					var arr = sdWorld.RequireHashPosition( xx * 32, yy * 32 );
					
					//if ( worked_out_arrs.indexOf( arr ) === -1 )
					{
						//worked_out_arrs.push( arr );

						for ( var i = 0; i < arr.length; i++ )
						//if ( !arr[ i ].is_static || arr[ i ] instanceof sdBlock || arr[ i ] instanceof sdDoor )
						//if ( !arr[ i ].is_static || arr[ i ].is( sdBlock ) || arr[ i ].is( sdDoor ) )
						if ( arr[ i ].IsBGEntity() === 0 && ( typeof arr[ i ].sy !== 'undefined' || arr[ i ].is( sdBlock ) || arr[ i ].is( sdDoor ) ) ) // Faster?
						//if ( !non_recursive.has( arr[ i ]._net_id ) )
						if ( !non_recursive.has( arr[ i ] ) )
						{
							if ( x2 > arr[ i ].x + arr[ i ]._hitbox_x1 )
							if ( x1 < arr[ i ].x + arr[ i ]._hitbox_x2 )
							if ( y2 > arr[ i ].y + arr[ i ]._hitbox_y1 )
							if ( y1 < arr[ i ].y + arr[ i ]._hitbox_y2 )
							{
								//if ( arr[ i ] instanceof sdBlock || arr[ i ] instanceof sdDoor )
								if ( arr[ i ].is( sdBlock ) || arr[ i ].is( sdDoor ) )
								{
									max_h = 0; // Stop elevation

									//if ( Math.random() < 0.01 )
									//sdWorld.SendEffect({ x:x1+(x2-x1)*Math.round(Math.random()), y:y1+(y2-y1)*Math.round(Math.random()), type:sdEffect.TYPE_WALL_HIT });
								}
								else
								{
									//non_recursive.set( arr[ i ]._net_id, 1 );
									non_recursive.add( arr[ i ] );

									if ( Math.abs( arr[ i ].x - this.x ) < 16 )
									{
										//arr[ i ].sy -= GSPEED * sdWorld.gravity * 0.9;

										//if ( arr[ i ].GetClass() === 'sdCharacter' )
										//if ( arr[ i ] instanceof sdCharacter )
										if ( arr[ i ].is( sdCharacter ) )
										{
											if ( sdWorld.is_server )
											{
												let old_sy = arr[ i ].sy;
												
												if ( this.power === -1 )
												arr[ i ].sy = sdWorld.MorphWithTimeScale( arr[ i ].sy, 0, 0.75, GSPEED );
												else
												arr[ i ].sy -= GSPEED * sdWorld.gravity * 0.9 * this.power;

												if ( arr[ i ].hea > 0 )
												{
													if ( this.power !== -1 )
													arr[ i ].sy += GSPEED * arr[ i ].act_y * 0.1;

													arr[ i ].ApplyServerSidePositionAndVelocity( false, 0, arr[ i ].sy - old_sy );
												}
											}
										}
										else
										{
											if ( this.power === -1 )
											arr[ i ].sy = sdWorld.MorphWithTimeScale( arr[ i ].sy, 0, 0.75, GSPEED );
											else
											arr[ i ].sy -= GSPEED * sdWorld.gravity * 0.9 * this.power;
										}
									}
								}
							}
						}
					}
				}
				
				y1 -= 16;
				y2 -= 16;
			}
		}
		
		
		
		/*
		var x = this.x;
		var y = this.y;
		let non_recursive = [];
		for ( var xx = -2; xx <= 2; xx++ )
		for ( var yy = -12; yy <= 2; yy++ )
		{
			var arr = sdWorld.RequireHashPosition( x + xx * 32, y + yy * 32 );
			for ( var i = 0; i < arr.length; i++ )
			if ( arr[ i ] !== this )
			if ( Math.abs( arr[ i ].x - this.x ) < 16 )
			if ( arr[ i ].y < this.y )
			if ( !arr[ i ].is_static )
			{
				if ( non_recursive.indexOf( arr[ i ] ) === -1 )
				{
					non_recursive.push( arr[ i ] );
					if ( sdWorld.CheckLineOfSight( this.x, this.y, arr[ i ].x, arr[ i ].y, this, null, [ 'sdBlock' ] ) )
					{
						//if ( sdWorld.inDist2D( arr[ i ].x, arr[ i ].y, x, y, 30 ) >= 0 )
						{
							arr[ i ].sy -= GSPEED * sdWorld.gravity * 0.9;

							if ( arr[ i ].GetClass() === 'sdCharacter' )
							{
								if ( arr[ i ].hea > 0 )
								arr[ i ].sy += GSPEED * arr[ i ].act_y * 0.1;
							}
						}
					}
				}
			}
		}*/
	}
	get title()
	{
		return 'Antigravity field';
	}
	Draw( ctx, attached )
	{
		ctx.drawImageFilterCache( sdAntigravity.img_antigravity, -16, -16, 32,32 );

        let repeat = 400;
		
		for ( let i = 0; i < 3; i++ )
		{
			let prog;
			
			if ( this.power >= 0 )
			prog = ( ( sdWorld.time * this.power + i * repeat / 3 ) % repeat ) / repeat;
			else
			prog = 1 - ( ( sdWorld.time * 0.1 + i * repeat / 3 ) % repeat ) / repeat;

			prog *= prog;

			prog = Math.round( prog * 40 ) / 40;

			ctx.globalAlpha = ( 1 - prog ) * 0.4 * Math.abs( this.power );
			ctx.fillStyle = '#ffffff';
			ctx.fillRect( -10 + prog * 2, -5 - prog * 20, 20 - prog * 4, 1 );
		}

        ctx.globalAlpha = 1;
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
	}
	onRemove() // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
		if ( this._broken )
		{
			sdSound.PlaySound({ name:'block4', 
				x:this.x + 32 / 2, 
				y:this.y + 32 / 2, 
				volume:( 32 / 32 ) * ( 16 / 32 ), 
				pitch: ( this.material === sdAntigravity.MATERIAL_WALL ) ? 1 : 1.5,
				_server_allowed:true });
			
			let x,a,s;
			
			let y = 0;
			
			let step_size = 4;
			for ( x = step_size / 2; x < 32; x += step_size )
			//for ( y = step_size / 2; y < 32; y += step_size )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				let ent = new sdEffect({ x: this.x + x - 16, y: this.y + y - 16, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
				sdEntity.entities.push( ent );
			}
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
				if ( command_name === 'SETPOWER' )
				{
					let velocities = [ -1, 0, 1, 2, 5, 10, 20 ];
				
					let i = velocities.indexOf( parameters_array[ 0 ] );
					
					if ( i !== -1 )
					{
						i = velocities[ i ];
						this.power = i;
						this._update_version++;
					}
				}
			}
			else
			executer_socket.SDServiceMessage( 'Antigravity is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this._hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			if ( sdWorld.my_entity )
			{
				let velocities = [ -1, 0, 1, 2, 5, 10, 20 ];
				
				for ( let i = 0; i < velocities.length; i++ )
				this.AddContextOption( 'Set intensity to ' + ( i === 0 ? 'impact prevention' : velocities[ i ] ), 'SETPOWER', [ velocities[ i ] ] );
			}
		}
	}
}
//sdAntigravity.init_class();

export default sdAntigravity;