
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdVirus from './sdVirus.js';
import sdQuickie from './sdQuickie.js';
import sdCrystal from './sdCrystal.js';
import sdBlock from './sdBlock.js';

class sdLifeBox extends sdEntity
{
	static init_class()
	{
		sdLifeBox.img_lifebox_open = sdWorld.CreateImageFromFile( 'life_box_open' );
		sdLifeBox.img_lifebox_closed = sdWorld.CreateImageFromFile( 'life_box_closed' );
		sdLifeBox.img_turret = sdWorld.CreateImageFromFile( 'life_box_turret' );
		sdLifeBox.img_turret_fire = sdWorld.CreateImageFromFile( 'life_box_turret_fire' );
		
		sdLifeBox.driver_slots = 1;
		
		sdLifeBox.slot_hints = [
			'Entered the life box: You should be safer inside.',

		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -15; }
	get hitbox_x2() { return 15; }
	get hitbox_y1() { return -20; }
	get hitbox_y2() { return 32; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return [ 'sdCharacter', 'sdCrystal' ];
	}
	
	IsVehicle()
	{
		return true;
	}
	
	Impact( vel ) // fall damage basically
	{
		if ( vel > 5 )
		{
			this.Damage( ( vel - 3 ) * 45 );
		}
	}
	RequireSpawnAlign() 
	{ return true; }

	constructor( params )
	{
		super( params );
		
		//this.sx = 0;
		//this.sy = 0;
		
		this.hmax = 4000;
		this.hea = this.hmax;
		
		this._regen_timeout = 0;
		
		this.filter = params.filter || 'none';

		this.attack_timer = 0;

		this._target = null;
		
		// 1 slot
		this.driver0 = null; // movement
	}
	AddDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
	
		var best_slot = -1;
		
		for ( var i = 0; i < sdLifeBox.driver_slots; i++ )
		//for ( var i = 2; i < sdLifeBox.driver_slots; i++ ) // Hack
		{
			if ( this[ 'driver' + i ] === null )
			{
				best_slot = i;
				break;
			}
		}
		
		if ( best_slot >= 0 )
		{
			this[ 'driver' + best_slot ] = c;
			
			c.driver_of = this;
			
			if ( c._socket )
			c._socket.emit('SERVICE_MESSAGE', sdLifeBox.slot_hints[ best_slot ] );
		
			if ( best_slot === 0 )
			sdSound.PlaySound({ name:'hover_start', x:this.x, y:this.y, volume:1 });
		}
		else
		{
			if ( c._socket )
			c._socket.emit('SERVICE_MESSAGE', 'All slots are occupied' );
		}
	}
	ExcludeDriver( c )
	{
		if ( !sdWorld.is_server )
		return;
		
		for ( var i = 0; i < sdLifeBox.driver_slots; i++ )
		{
			if ( this[ 'driver' + i ] === c )
			{
				this[ 'driver' + i ] = null;
				c.driver_of = null;
				
				c.x = this.x; //+ ( i / ( sdLifeBox.driver_slots - 1 ) ) * ( this.hitbox_x2 - this.hitbox_x1 ); -> commented out since 0/0 occurs in "i / ( sdLifeBox.driver_slots - 1 )"
				
				if ( c.CanMoveWithoutOverlap( c.x, this.y + this.hitbox_y1 - c.hitbox_y2, 1 ) )
				c.y = this.y + this.hitbox_y1 - c.hitbox_y2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this.hitbox_x1 - c.hitbox_x2, c.y, 1 ) )
				c.x = this.x + this.hitbox_x1 - c.hitbox_x2;
				else
				if ( c.CanMoveWithoutOverlap( this.x + this.hitbox_x2 - c.hitbox_x1, c.y, 1 ) )
				c.x = this.x + this.hitbox_x2 - c.hitbox_x1;
				
				if ( c._socket )
				c._socket.emit('SERVICE_MESSAGE', 'Leaving vehicle' );
		
				return;
			}
		}
		
		if ( c._socket )
		c._socket.emit('SERVICE_MESSAGE', 'Error: Attempted leaving vehicle in which character is not located.' );
	}
	Damage( dmg, initiator=null, hit_turret = false )
	{
		if ( !sdWorld.is_server )
		return;

		if ( this.driver0 && !hit_turret ) // If somebody is inside the life box it cannot be damaged without attacking the turret
		return;

	
		if ( initiator !== null )
		if ( this.driver0 )
		{
			this._target = initiator;
		}
		dmg = Math.abs( dmg );
		
		let old_hea = this.hea;
		
		this.hea -= dmg;

		if ( this.hea <= 0 )
		this.remove();
		else
		{
			if ( this.hea <= 100 && old_hea > 100 )
			sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1 });
		}
	
		this._regen_timeout = 30;
		
		sdSound.PlaySound({ name:'world_hit', x:this.x, y:this.y, pitch:0.5, volume:Math.min( 1, dmg / 200 ) });
	}
	
	get mass() { return 1000; }
	Impulse( x, y )
	{
		//this.sx = 0;
		//this.sy = 0;
		//this.sx += x * 0.01;
		//this.sy += y * 0.01;
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server)
		return;

		if ( this.attack_timer > 0 )
		this.attack_timer -= GSPEED;

		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{

			if ( this.hea > 0 )
			if ( this.hea < this.hmax )
			{
				if ( this.driver0 )
				this.hea = Math.min( this.hea + GSPEED * 2, this.hmax );
				else
				this.hea = Math.min( this.hea + GSPEED / 6, this.hmax );
			}
			else
			if ( this.hea >= this.hmax )
			this._target = null; // Reset target when HP is full
		}

		if ( this.attack_timer <= 0 && this.hea < this.hmax )
		if ( this.driver0 )
		if ( this._target !== null )
		if ( ( this._target.hea || this._target._hea || 0 ) > 0 )
		{
			let di = sdWorld.Dist2D( this.x, this.y, this._target.x, this._target.y );
			if ( di <= 450 )
			{
				let should_fire = true;
				if ( !sdWorld.CheckLineOfSight( this.x, this.y - 16, this._target.x, this._target.y, this, sdCom.com_visibility_ignored_classes, null ) )
				{
					if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && ( sdWorld.last_hit_entity.material === sdBlock.MATERIAL_TRAPSHIELD ) )
					this._target = sdWorld.last_hit_entity;
					else
					should_fire = false;
				}

				if ( should_fire )
				{
					let an = Math.atan2( this._target.y - ( this.y - 16 ), this._target.x - this.x );

					let bullet_obj = new sdBullet({ x: this.x, y: ( this.y - 16 ) });
					bullet_obj._owner = this;
					bullet_obj.sx = Math.cos( an );
					bullet_obj.sy = Math.sin( an );

					bullet_obj.sx *= 16;
					bullet_obj.sy *= 16;
						
					bullet_obj.time_left = 60;

					bullet_obj._rail = true;

					bullet_obj._damage = 15; // Needs to be strong enough to destroy shields in several seconds, although I'll implement relative damage mult against shield blocks later
					bullet_obj.color = '#ffffff';

					sdEntity.entities.push( bullet_obj );

					this.attack_timer = 3;

					//sdSound.PlaySound({ name:'gun_railgun', x:this.x, y:this.y - 16, volume:0.5 }); // I'm not sure what sound effect would fit here to be honest - Booraz149
				}
			}
		}
		
		
		//sdWorld.last_hit_entity = null;
		
		//this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	
	//get friction_remain()
	//{ return 0; }
	
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea <= 0 )
		return;
	
		sdEntity.Tooltip( ctx, "Life box", 0, -10 );
		
		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 30, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 30, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	Draw( ctx, attached )
	{
		ctx.filter = this.filter;
		
		ctx.drawImageFilterCache( ( this.driver0 /*&& ( this.driver0.act_x !== 0 || this.driver0.act_y !== 0 )*/ ) ? sdLifeBox.img_lifebox_closed : sdLifeBox.img_lifebox_open, - 16, - 32, 32, 64 );
		
		ctx.drawImageFilterCache( ( this.attack_timer > 0 ) ? sdLifeBox.img_turret_fire : sdLifeBox.img_turret, - 16, -32, 32, 32 );
		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );

			for ( var i = 0; i < sdLifeBox.driver_slots; i++ )
			if ( this[ 'driver' + i ] )
			this.ExcludeDriver( this[ 'driver' + i ] );
		}
		else
		{
			for ( var i = 0; i < sdLifeBox.driver_slots; i++ )
			if ( this[ 'driver' + i ] )
			{
				this[ 'driver' + i ].remove();
			}
		}
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return this.hmax * sdWorld.damage_to_matter + 1900;
	}
}
//sdLifeBox.init_class();

export default sdLifeBox;