
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';

class sdVirus extends sdEntity
{
	static init_class()
	{
		sdVirus.img_virus = sdWorld.CreateImageFromFile( 'virus' );
		sdVirus.img_virus_walk = sdWorld.CreateImageFromFile( 'virus_walk' );
		
		sdVirus.death_imgs = [
			sdWorld.CreateImageFromFile( 'virus_death1' ),
			sdWorld.CreateImageFromFile( 'virus_death2' ),
			sdWorld.CreateImageFromFile( 'virus_death3' ),
			sdWorld.CreateImageFromFile( 'virus_death4' ),
			sdWorld.CreateImageFromFile( 'virus_death5' )
		];
		sdVirus.death_duration = 10;
		sdVirus.post_death_ttl = 90;
		
		sdVirus.max_seek_range = 1000;
		
		let that = this; setTimeout( ()=>{ sdWorld.entity_classes[ that.name ] = that; }, 1 ); // Register for object spawn
	}
	get hitbox_x1() { return -6; }
	get hitbox_x2() { return 6; }
	get hitbox_y1() { return ( this.death_anim === 0 ) ? -5 : 1; }
	get hitbox_y2() { return 4; }
	
	get hard_collision() // For world geometry where players can walk
	{ return this.death_anim === 0; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this._hmax = 80;
		this._hea = this._hmax;
		
		this.death_anim = 0;
		
		this._current_target = null;
		
		//this._last_stand_on = null;
		this._last_jump = sdWorld.time;
		this._last_bite = sdWorld.time;
		
		this.side = 1;
		
		this.filter = 'hue-rotate(' + ~~( Math.random() * 360 ) + 'deg)';
	}
	SyncedToPlayer( character ) // Shortcut for enemies to react to players
	{
		if ( !character.ghosting )
		if ( character.hea > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, character.x, character.y ); 
			if ( di < sdVirus.max_seek_range )
			if ( this._current_target === null || 
				 this._current_target.hea <= 0 || 
				 di < sdWorld.Dist2D(this._current_target.x,this._current_target.y,this.x,this.y) )
			{
				this._current_target = character;

				sdSound.PlaySound({ name:'virus_alert', x:this.x, y:this.y, volume: 0.5 });
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
		
		let was_alive = this._hea > 0;
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 && was_alive )
		{
			sdSound.PlaySound({ name:'block4', x:this.x, y:this.y, volume: 0.25, pitch:4 });

			if ( initiator )
			if ( initiator._socket )
			initiator._socket.score += 1;
		}
		
		if ( this._hea < -100 )
		this.remove();
	}
	Impulse( x, y )
	{
		this.sx += x * 0.1;
		this.sy += y * 0.1;
	}
	Impact( vel ) // fall damage basically
	{
		// less fall damage
		if ( vel > 10 )
		{
			this.Damage( ( vel - 4 ) * 15 );
		}
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._hea <= 0 )
		{
			if ( this.death_anim < sdVirus.death_duration + sdVirus.post_death_ttl )
			this.death_anim += GSPEED;
			else
			this.remove();
		}
		else
		if ( this._current_target )
		{
			if ( this._current_target._is_being_removed || this._current_target.ghosting || sdWorld.Dist2D( this.x, this.y, this._current_target.x, this._current_target.y ) > sdVirus.max_seek_range + 32 )
			this._current_target = null;
			else
			{
				this.side = ( this._current_target.x > this.x ) ? 1 : -1;
			
				if ( this._last_jump < sdWorld.time - 100 );
				//if ( this._last_stand_on )
				if ( !this.CanMoveWithoutOverlap( this.x, this.y, -3 ) )
				{
					this._last_jump = sdWorld.time;
					
					let dx = ( this._current_target.x - this.x ) * 0.1;
					let dy = ( this._current_target.y - this.y ) * 0.1;
					
					dy -= Math.abs( dx ) * 0.5;
					
					let di = sdWorld.Dist2D_Vector( dx, dy );
					if ( di > 7 )
					{
						dx /= di;
						dy /= di;
						
						dx *= 7;
						dy *= 7;
					}
					
					this.sx = dx;
					this.sy = dy;

					
					//this._last_stand_on = null; // wait for next collision
				}
			}
		}
		
		let in_water = sdWorld.CheckWallExists( this.x, this.y, null, null, sdWater.water_class_array );
		
		if ( in_water )
		{
			this.sx = sdWorld.MorphWithTimeScale( this.sx, 0, 0.87, GSPEED );
			this.sy = sdWorld.MorphWithTimeScale( this.sy, 0, 0.87, GSPEED );
		}
		//else
		//{
			this.sy += sdWorld.gravity * GSPEED;
		//}
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
		if ( this.death_anim === 0 )
		if ( this._last_bite < sdWorld.time - 1000 )
		{
			let nears = sdWorld.GetAnythingNear( this.x, this.y, 8 );
			let from_entity;
			
			for ( var i = 0; i < nears.length; i++ )
			{
				from_entity = nears[ i ];
				if ( from_entity.GetClass() === 'sdCharacter' )
				{
					this._last_bite = sdWorld.time;
					from_entity.Damage( 30 );
					
					this._hea = Math.min( this._hmax, this._hea + 15 );

					sdWorld.SendEffect({ x:from_entity.x, y:from_entity.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
					
					break;
				}
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.death_anim === 0 )
		sdEntity.Tooltip( ctx, "Virus" );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.scale( this.side, 1 );
		
		if ( this.death_anim > 0 )
		{
			if ( this.death_anim > sdVirus.death_duration + sdVirus.post_death_ttl - 30 )
			{
				ctx.globalAlpha = 0.5;
			}
			
			let frame = Math.min( sdVirus.death_imgs.length - 1, ~~( ( this.death_anim / sdVirus.death_duration ) * sdVirus.death_imgs.length ) );
			ctx.drawImageFilterCache( sdVirus.death_imgs[ frame ], - 16, - 16, 32,32 );
		}
		else
		ctx.drawImageFilterCache( ( sdWorld.time % 400 < 200 ) ? sdVirus.img_virus : sdVirus.img_virus_walk, - 16, - 16, 32,32 );
		
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	/*onMovementInRange( from_entity )
	{
		//this._last_stand_on = from_entity;
	}*/
	onRemove() // Class-specific, if needed
	{
		//sdSound.PlaySound({ name:'crystal', x:this.x, y:this.y, volume:1 });
		
		if ( sdWorld.is_server )
		if ( this.death_anim < sdVirus.death_duration + sdVirus.post_death_ttl ) // not gone by time
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
				
				sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_GIB_GREEN, sx: this.sx*k + Math.sin(a)*s, sy: this.sy*k + Math.cos(a)*s, filter:this.GetBleedEffectFilter() });
			}
		}
	}
}
//sdVirus.init_class();

export default sdVirus;