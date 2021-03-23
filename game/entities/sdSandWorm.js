
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdWater from './sdWater.js';
import sdBlock from './sdBlock.js';
import sdCube from './sdCube.js';
import sdCrystal from './sdCrystal.js';
import sdBG from './sdBG.js';
import sdCharacter from './sdCharacter.js';


class sdSandWorm extends sdEntity
{
	static init_class()
	{
		sdSandWorm.img_worm_head_idle = sdWorld.CreateImageFromFile( 'worm_head_idle' );
		sdSandWorm.img_worm_head_attack = sdWorld.CreateImageFromFile( 'worm_head_attack' );
		sdSandWorm.img_worm_body = sdWorld.CreateImageFromFile( 'worm_body' );
		
		sdSandWorm.post_death_ttl = 30 * 6;
		
		sdSandWorm.max_seek_range = 1000;
		
		sdSandWorm.segment_dist = 18;
		
		sdSandWorm.head_bounds_health = 200;
		
		
		
		sdSandWorm.worms_tot = 0;
		
		
		sdSandWorm.travel_in = [ 'sdBlock', 'sdWater' ];
		
		sdSandWorm.ignoring = [ 'sdWater', 'sdSandWorm' ];
		sdSandWorm.ignoring_dead = [ 'sdSandWorm' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	// 8 as max dimension so it can fit into one block
	get hitbox_x1() { return -11 * this.scale; }
	get hitbox_x2() { return 11 * this.scale; }
	get hitbox_y1() { return -11 * this.scale; }
	get hitbox_y2() { return 11 * this.scale; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 700;
		this._hea = this._hmax;
		
		this._current_target = null;
		
		this.death_anim = 0;
		
		this.towards_head = null;
		this.towards_tail = null;
		
		this.model = 0;
		
		this._an = 0;
		this.forced_x = 0; // Attacks turn head using this var
		this.forced_y = 0; // Attacks turn head using this var
		
		this._hp_main_max = this._hmax * 7;
		this._hp_main = this._hp_main_max; // Actual hitpoints
		
		this._in_surface = false;
		this._in_water = false;
		
		this._last_attack = sdWorld.time;
		
		this.scale = 1;
		
		sdSandWorm.worms_tot++;
		
		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg) saturate(0.5)';
	}
	GetHeadEntity()
	{
		var ptr = this;
		while ( true )
		{
			if ( ptr.towards_head && !ptr.towards_head._is_being_removed )
			ptr = ptr.towards_head;
			else
			break;
		}
		
		if ( ptr.model !== 2 )
		return ptr;
		else
		return { // Pseudo=entity for case of loaded snapshot
			towards_tail: ptr,
			_hp_main: 0,
			_hea: 0,
			_is_being_removed: true
		};
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( this._hea > 0 )
		if ( character.IsVisible() )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdSandWorm.max_seek_range )
			if ( this._current_target === null || 
				 !this._current_target.is( sdCharacter ) ||
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				//sdSound.PlaySound({ name:'quickie_alert', x:this.x, y:this.y, volume: 0.5, pitch: 2 });
			}
		}
	}
	GetBleedEffect()
	{
		return sdEffect.TYPE_BLOOD_GREEN;
	}
	GetBleedEffectFilter()
	{
		return this.filter;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		let head_entity = this.GetHeadEntity();
		
		if ( initiator )
		//if ( !initiator.is( sdSandWorm ) )
		if ( !initiator.is( sdCube ) )
		head_entity._current_target = initiator;
		
		let this_was_alive = this._hea > 0;
		let was_alive = head_entity._hp_main > 0;
		
		let old_hp_main = head_entity._hp_main;
		
		this._hea -= dmg;
		head_entity._hp_main -= dmg;
		
		if ( this._hea <= sdSandWorm.head_bounds_health && this === head_entity )
		head_entity._hp_main = 0;
		
		if ( this._hea <= 0 && this_was_alive )
		{
			if ( this === head_entity || this.towards_head === head_entity ) // No flying head case
			head_entity._hp_main = 0;
			else
			{
				// Deactivate all parts past this one
				let ptr = this;
				while ( ptr )
				{
					if ( ptr._hea > 0 )
					{
						head_entity._hp_main -= ptr._hea; // Remaining hp damage bonus
					}
				
					head_entity._hp_main -= 300; // Break bonus
					
					ptr.death_anim = 1;

					if ( ptr.towards_tail && ptr.towards_tail._is_being_removed )
					ptr = null;
					else
					ptr = ptr.towards_tail;
				}
			}
		}
		
		if ( head_entity._hp_main <= 0 && was_alive )
		{
			if ( initiator )
			if ( typeof initiator._score !== 'undefined' )
			initiator._score += 60;
	
			sdSound.PlaySound({ name:'octopus_alert', x:head_entity.x, y:head_entity.y, pitch:0.25, volume:4 });
	
			let ptr = head_entity;
			while ( ptr )
			{
				ptr.death_anim = 1;
				
				ptr = ptr.towards_tail;
			}
		}
		
		let shake_am = Math.max( 0, Math.min( 200, old_hp_main - head_entity._hp_main ) );
		
		let ptr = head_entity;
		while ( ptr && ptr._hea > 0 && !ptr._is_being_removed )
		{
			if ( ptr.towards_tail )
			{
				let an = Math.random() * Math.PI * 2;
				
				ptr.sx += Math.sin( an ) * shake_am / 50;
				ptr.sy += Math.cos( an ) * shake_am / 50;
				
				ptr.towards_tail.sx -= Math.sin( an ) * shake_am / 50;
				ptr.towards_tail.sy -= Math.cos( an ) * shake_am / 50;
			}

			ptr = ptr.towards_tail;
		}
		
		
		
		if ( this._hea <= 0 )
		{
			this.remove();
		}
	}
	get mass() { return 300; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}
	/*Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}*/
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return ( this.death_anim === 0 ) ? sdSandWorm.ignoring : sdSandWorm.ignoring_dead;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		sdWorld.last_hit_entity = null;
		
		//let in_surface = sdWorld.CheckWallExists( this.x, this.y, null, null, sdSandWorm.travel_in );
		let in_surface = sdWorld.CheckWallExistsBox( this.x + this.hitbox_x1, this.y + this.hitbox_y1, this.x + this.hitbox_x2, this.y + this.hitbox_y2, null, null, sdSandWorm.travel_in );
		
		//if ( sdWorld.last_hit_entity.is( sdBlock )
		
		let in_water = sdWorld.last_hit_entity && sdWorld.last_hit_entity.is( sdWater );
		
		if ( in_surface )
		if ( this.death_anim === 0 )
		{
			if ( sdWorld.is_server )
			{
				if ( Math.random() < 0.003 )
				{
					sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, pitch: 0.2, volume: 0.25 });
				}	
			}
			else
			{
				//if ( this._in_surface !== in_surface )
				//if ( Math.random() < 0.1 )
				if ( sdWorld.last_hit_entity )
				if ( sdWorld.last_hit_entity.is( sdBlock ) )
				if ( !sdWorld.CheckWallExists( this.x, this.y, null, null, sdSandWorm.travel_in ) )
				{
					let x = this.hitbox_x1 + ( this.hitbox_x2 - this.hitbox_x1 ) * Math.random();
					let y = this.hitbox_y1 + ( this.hitbox_y2 - this.hitbox_y1 ) * Math.random();
					let a = Math.random() * 2 * Math.PI;
					let s = Math.random() * 4;
					let ent = new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_ROCK, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s });
					sdEntity.entities.push( ent );
				}
			}
		}
		
		this._in_surface = in_surface;
		this._in_water = in_water;
		
		if ( !this.towards_tail )
		if ( !this.towards_head )
		if ( sdWorld.is_server )
		if ( this.model !== 2 ) // For snapshot loading case
		if ( this._hp_main > 0 ) // For snapshot loading case
		{
			let arr = [ this ];
			
			let offset = 0;// this.scale * sdSandWorm.segment_dist
			
			for ( let i = 1; i < 7; i++ )
			{
				let ent_scale = 1 - Math.pow( i / 7, 2 ) * 0.5;
				
				offset += ( this.scale + ent_scale ) * sdSandWorm.segment_dist / 2;
				
				//let ent = new sdSandWorm({ x: this.x + offset, y: this.y });
				let ent = new sdSandWorm({ x: this.x + Math.random() - 0.5, y: this.y + Math.random() - 0.5 });
				
				ent.filter = this.filter;
				
				ent.scale = ent_scale;
				
				ent.model = 2;
				
				ent.towards_head = arr[ i - 1 ];
				arr[ i - 1 ].towards_tail = ent;
				sdEntity.entities.push( ent );
				
				arr[ i ] = ent;
			}
			
			this._hea += sdSandWorm.head_bounds_health;
			this._hmax += sdSandWorm.head_bounds_health;
		}
		
		let an_x = 0;
		let an_y = 0;
		
		
		if ( this.towards_head )
		if ( !this.towards_head._is_being_removed )
		{
			an_x += this.towards_head.x - this.x;
			an_y += this.towards_head.y - this.y;
		}
		
		if ( this.towards_tail )
		if ( !this.towards_tail._is_being_removed )
		{
			an_x -= this.towards_tail.x - this.x;
			an_y -= this.towards_tail.y - this.y;
			
			for ( let s = 0; s < 2; s++ )
			{
				//let target_di = ( s === 0 ) ? sdSandWorm.segment_dist : ( sdSandWorm.segment_dist * 2 );
				let another_ent = ( s === 0 ) ? this.towards_tail : ( this.towards_tail.towards_tail );
				
				if ( another_ent === null )
				continue;
			
				let force = ( s === 0 ) ? 5 : ( 0.7 );
				
				let target_di = ( s === 0 ) ? 
									( ( this.scale + this.towards_tail.scale ) * sdSandWorm.segment_dist / 2 ) : 
									( ( this.scale + this.towards_tail.scale ) * sdSandWorm.segment_dist / 2 + ( this.towards_tail.scale + another_ent.scale ) * sdSandWorm.segment_dist / 2 );
				
				//console.log( 'target_di = ' + target_di );
				
				let dx = this.x - another_ent.x;
				let dy = this.y - another_ent.y;

				let di = sdWorld.Dist2D_Vector( dx, dy );

				if ( di > 1 ) // sdSandWorm.segment_dist )
				{
					dx = dx / di * ( di - target_di ) / target_di * force;
					dy = dy / di * ( di - target_di ) / target_di * force;

					this.sx -= dx * GSPEED;
					this.sy -= dy * GSPEED;

					another_ent.sx += dx * GSPEED;
					another_ent.sy += dy * GSPEED;

					if ( this.CanMoveWithoutOverlap( this.x - dx * GSPEED, this.y - dy * GSPEED, 0, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null ) )
					{
						this.x -= dx * GSPEED;
						this.y -= dy * GSPEED;
					}
					if ( another_ent.CanMoveWithoutOverlap( another_ent.x + dx * GSPEED, another_ent.y + dy * GSPEED, 0, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null ) )
					{
						another_ent.x += dx * GSPEED;
						another_ent.y += dy * GSPEED;
					}
				}
			}
		}

		an_x += this.forced_x;
		an_y += this.forced_y;
		
		this.forced_x = sdWorld.MorphWithTimeScale( this.forced_x, 0, 0.7, GSPEED );
		this.forced_y = sdWorld.MorphWithTimeScale( this.forced_y, 0, 0.7, GSPEED );
		
		if ( an_x !== 0 || an_y !== 0 )
		this._an = -Math.atan2( an_x, an_y ) - Math.PI / 2;
		
		//if ( !this.towards_head ) // Is head
		if ( this.model !== 2 ) // For client-side
		{
			if ( this._hp_main <= 0 )
			{
			}
			else
			{
				if ( sdWorld.is_server )
				{
					//if ( in_surface )
					//{
						//this._last_attack = sdWorld.time - 700;
						//this.model = 0;
					//}
					//console.log( [ this.model, sdWorld.time - this._last_attack ] );
					if ( sdWorld.time > this._last_attack + 1000 )
					{
						if ( this.model === 0 )
						{
							//console.log('SOUND!');
							//console.log( this._last_attack - sdWorld.time  );
							sdSound.PlaySound({ name:'octopus_death', x:this.x, y:this.y, pitch: 0.5, volume: 0.5 });
							this.model = 1;
						}
					}
				}
			
				if ( this._current_target )
				{
					if ( this._current_target._is_being_removed || !this._current_target.IsVisible() /*|| sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdSandWorm.max_seek_range + 32*/ )
					this._current_target = null;
					else
					{
						let dx = ( this._current_target.x - this.x ) + Math.sin( sdWorld.time / 600 ) * 40;
						let dy = ( this._current_target.y - this.y ) + Math.sin( sdWorld.time / 400 ) * 40;

						//let power = 1;

						let arr = [];

						let ptr = this;
						while ( ptr && !ptr._is_being_removed )
						{
							if ( ptr._in_surface || !ptr.towards_head )
							arr.push( ptr );
							//power++;

							ptr = ptr.towards_tail;
						}

						let di = sdWorld.Dist2D( dx,dy,0,0 );

						if ( di > 1 )
						{
							for ( let i = 0; i < arr.length; i++ )
							{
								let vel_scale = arr[ i ]._in_water ? 0.05 : 1;
								
								let dx2 = 0;
								let dy2 = 0;

								if ( !arr[ i ].towards_head )
								{
									if ( arr[ i ]._in_surface )
									{
										arr[ i ].sx += dx / di * 1 * vel_scale;
										arr[ i ].sy += dy / di * 1 * vel_scale;
									}
									else
									{
										arr[ i ].sx += dx / di * 0.5 * vel_scale;
										arr[ i ].sy += dy / di * 0.5 * vel_scale;
									}

									//if ( arr[ i ].towards_tail )
									//{
										dx2 = -( arr[ i ].towards_tail.x - arr[ i ].x );
										dy2 = -( arr[ i ].towards_tail.y - arr[ i ].y );
									//}
								}
								else
								{
									dx2 = arr[ i ].towards_head.x - arr[ i ].x;
									dy2 = arr[ i ].towards_head.y - arr[ i ].y;
								}

								if ( arr[ i ]._in_surface )
								{
									let di2 = sdWorld.Dist2D_Vector( dx2, dy2 );

									if ( di2 > 1 )
									{
										arr[ i ].sx += dx2 / di2 * 0.7 * vel_scale;
										arr[ i ].sy += dy2 / di2 * 0.7 * vel_scale;
									}
								}

							}
						}
						
						// Reset target from time to time if in seek mode
						if ( Math.random() < 0.0001 )
						if ( !this._current_target.is( sdCharacter ) )
						{
							this._current_target = null;
						}
					}
				}
				else
				{
					// No target
					if ( sdWorld.is_server )
					{
						/*let closest = null;
						let closest_di = Infinity;
						for ( let i = 0; i < sdWorld.sockets.length; i++ )
						{
							if ( sdWorld.sockets[ i ].character )
							if ( sdWorld.sockets[ i ].character.hea > 0 )
							if ( !sdWorld.sockets[ i ].character._is_being_removed )
							if ( sdWorld.sockets[ i ].character.IsVisible() )
							{
								let di = sdWorld.Dist2D_Vector_pow2( sdWorld.sockets[ i ].character.x - this.x, sdWorld.sockets[ i ].character.y - this.y );
								if ( di < closest_di )
								{
									closest_di = di;
									closest = sdWorld.sockets[ i ].character;
								}
							}
						}
						this._current_target = closest;*/
						
						if ( sdEntity.active_entities.length > 0 ) // Opposite probably can't happen
						this._current_target = sdEntity.active_entities[ Math.floor( Math.random() * sdEntity.active_entities.length ) ];
					}
				}
			}
		}
		
		if ( in_surface && !in_water )
		{
			//this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			//this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.7, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.7, GSPEED );
		}
		else
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.99, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.99, GSPEED );
			
			if ( !in_water )
			this.sy += sdWorld.gravity * GSPEED;
		}
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true, 1, ( this.death_anim === 0 ) ? this.CustomGroundFiltering : null );
	}
	CustomGroundFiltering( hit_entity )
	{
		if ( hit_entity.is( sdBlock ) )
		{
			if ( hit_entity.material === sdBlock.MATERIAL_WALL )
			return true;

			return false;
		}
		return true;

	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 && ( !this._in_surface || this._in_water ) )
		sdEntity.Tooltip( ctx, "Worm" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		if ( this.death_anim === 1 )
		ctx.filter += ' brightness(0.5)';
		
		ctx.rotate( this._an );
		
		ctx.scale( this.scale, this.scale );
		
		if ( this.model === 1 /*|| ( this.model === 0 && this._in_surface )*/ )
		ctx.drawImageFilterCache( sdSandWorm.img_worm_head_attack, - 16, - 16, 32,32 );
		else
		if ( this.model === 0 )
		ctx.drawImageFilterCache( sdSandWorm.img_worm_head_idle, - 16, - 16, 32,32 );
		else
		ctx.drawImageFilterCache( sdSandWorm.img_worm_body, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onMovementInRange( from_entity )
	{
		if ( from_entity.is( sdSandWorm ) )
		return;
	
		if ( from_entity.IsBGEntity() )
		return;
		
		if ( !from_entity.hard_collision )
		return;
	
		if ( !from_entity.IsTargetable() )
		return;
	
		this._in_surface = true;
		
		if ( sdWorld.is_server )
		if ( this.death_anim === 0 )
		if ( sdWorld.time > this._last_attack + ( !this.towards_head ? 1500 : 500 ) )
		{
			//if ( from_entity.is( sdBG ) )
			//return;
				
			if ( from_entity.is( sdBlock ) )
			if ( from_entity.material === sdBlock.MATERIAL_GROUND )
			return;
			
			this._last_attack = sdWorld.time;

			if ( !this.towards_head ) // Is head
			{
				from_entity.Damage( 300, this );
				
				this.model = 0;
				
				this.forced_x = ( from_entity.x + ( from_entity.hitbox_x1 + from_entity.hitbox_x2 ) / 2 - this.x ) * 10;
				this.forced_y = ( from_entity.y + ( from_entity.hitbox_y1 + from_entity.hitbox_y2 ) / 2 - this.y ) * 10;
				
				//this._hea = Math.min( this._hmax, this._hea + 25 );
				sdWorld.SendEffect({ x:from_entity.x + ( from_entity.hitbox_x1 + from_entity.hitbox_x2 ) / 2, y:from_entity.y + ( from_entity.hitbox_y1 + from_entity.hitbox_y2 ) / 2, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
				
				let ptr = this;
				while ( ptr && ptr._hea > 0 && !ptr._is_being_removed )
				{
					ptr._hea = Math.min( ptr._hmax, ptr._hea + 25 );
					this._hp_main = Math.min( this._hp_main_max, this._hp_main + 25 );
			
					ptr = ptr.towards_tail;
				}
			}
			else
			{
				from_entity.Damage( 20, this );
			}
		}
	}
	onRemove() // Class-specific, if needed
	{
		sdSandWorm.worms_tot--;
		
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		//if ( this.death_anim < sdSandWorm.death_duration + sdSandWorm.post_death_ttl ) // not gone by time
		{
			let a,s,x,y,k;
			
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:2 }); // 3 was fine
			
			for ( let i = 0; i < 6; i++ )
			{
				a = Math.random() * 2 * Math.PI;
				s = Math.random() * 4;
				
				k = Math.random();
				
				x = this.x + this.hitbox_x1 + Math.random() * ( this.hitbox_x2 - this.hitbox_x1 );
				y = this.y + this.hitbox_y1 + Math.random() * ( this.hitbox_y2 - this.hitbox_y1 );
				
				//console.warn( { x: this.x, y: this.y, type:sdEffect.TYPE_GIB, sx: this.sx + Math.sin(a)*s, sy: this.sy + Math.cos(a)*s } )
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_BLOOD_GREEN, filter:this.GetBleedEffectFilter() });
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter() });
			}
			
			// High price shards
			sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
				1 + ~~( Math.random() * 4 ),
				( 40 * 128 ) / 40
			);
			
			/*if ( Math.random() < 0.9 ) Improper placement, no use
			{
				let ent = new sdCrystal({ x: this.x, y: this.y });
				sdEntity.entities.push( ent );
				sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible
			}*/
		}
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
}
//sdSandWorm.init_class();

export default sdSandWorm;