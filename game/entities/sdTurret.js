
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdSound from '../sdSound.js';


class sdTurret extends sdEntity
{
	static init_class()
	{
		sdTurret.img_turret = sdWorld.CreateImageFromFile( 'turret' );
		sdTurret.img_turret_fire = sdWorld.CreateImageFromFile( 'turret_fire' );
		
		let that = this; setTimeout( ()=>{ sdWorld.entity_classes[ that.name ] = that; }, 1 ); // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return -3; }
	get hitbox_y2() { return 3; }
	
	get hard_collision()
	{ return true; }
	
	get title()
	{
		return 'Automatic turret';
	}
	
	Damage( dmg, initiator=null )
	{
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
		
		this._hmax = 100;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._owner = params.owner || null;
		
		this.an = 0;
		
		this._seek_timer = Math.random() * 15;
		this.fire_timer = 0;
		this._target = null;
	}
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		if ( this._hea < this._hmax )
		this._hea = Math.min( this._hea + GSPEED, this._hmax );
		
		if ( sdWorld.is_server )
		{
			if ( this._seek_timer <= 0 )
			{
				this._seek_timer = 15;

				this._target = null;

				for ( var x = this.x - 300; x < this.x + 300; x += 32 )
				for ( var y = this.y - 300; y < this.y + 300; y += 32 )
				{
					var arr = sdWorld.RequireHashPosition( x, y );
					for ( var i2 = 0; i2 < arr.length; i2++ )
					{
						var e = arr[ i2 ];
						
						if ( ( e.hea || e._hea ) > 0 )
						if ( e.IsVisible( this._owner ) )
						{
							if ( e !== this._owner || sdWorld.GetComsNear( this.x, this.y ).length > 0 )
							if ( ( e.GetClass() === 'sdCharacter' && sdWorld.GetComsNear( this.x, this.y, null, e._net_id ).length === 0 ) || 
								 e.GetClass() === 'sdVirus' || e.GetClass() === 'sdQuickie' )
							{
								if ( sdWorld.CheckLineOfSight( this.x, this.y, e.x, e.y, this, null, [ 'sdBlock', 'sdDoor', 'sdMatterContainer' ] ) )
								{
									this._target = e;
									break;
								}
							}
						}
					}
				}
			}
			else
			this._seek_timer -= GSPEED;
	
			if ( this._target !== null )
			{
				let di = sdWorld.Dist2D( this.x, this.y, this._target.x, this._target.y );
				
				this.an = Math.atan2( this._target.y + this._target.sy * di / 15 - this.y, this._target.x + this._target.sx * di / 15 - this.x ) * 100;
				
				if ( this.fire_timer <= 0 )
				{
					this.fire_timer = 10;
					
					sdSound.PlaySound({ name:'turret', x:this.x, y:this.y, volume:1 });
					
					let bullet_obj = new sdBullet({ x: this.x, y: this.y });
					bullet_obj._owner = this._owner;
					bullet_obj.sx = Math.cos( this.an / 100 );
					bullet_obj.sy = Math.sin( this.an / 100 );
					bullet_obj.x += bullet_obj.sx * 5;
					bullet_obj.y += bullet_obj.sy * 5;
					
					bullet_obj.sx *= 15;
					bullet_obj.sy *= 15;
					
					bullet_obj._damage = 15;
					bullet_obj.color = '#ff0000';
					
					sdEntity.entities.push( bullet_obj );
				}
				else
				this.fire_timer = Math.max( 0, this.fire_timer - GSPEED );
			}
			else
			{
				this.fire_timer = Math.max( 0, this.fire_timer - GSPEED );
			}
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, this.title );
		
		this.DrawConnections( ctx );
	}
	DrawConnections( ctx )
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;

		for ( var i = 0; i < sdEntity.entities.length; i++ )
		if ( sdEntity.entities[ i ].GetClass() === 'sdCom' )
		if ( sdWorld.Dist2D( sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this.x, this.y ) < sdCom.retransmit_range )
		if ( sdWorld.CheckLineOfSight( this.x, this.y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) )
		{
			ctx.beginPath();
			ctx.moveTo( sdEntity.entities[ i ].x - this.x, sdEntity.entities[ i ].y - this.y );
			ctx.lineTo( 0,0 );
			ctx.stroke();
		}

		ctx.beginPath();
		ctx.arc( 0,0, sdTurret.retransmit_range, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}
	Draw( ctx, attached )
	{
		ctx.rotate( this.an / 100 );
		
		ctx.drawImage( ( this.fire_timer < 2.5 ) ? sdTurret.img_turret : sdTurret.img_turret_fire, -16, -16, 32,32 );
	}
	MeasureMatterCost()
	{
		return ~~( 100 * sdWorld.damage_to_matter + 150 );
	}
	RequireSpawnAlign()
	{ return false; }
}
//sdTurret.init_class();

export default sdTurret;