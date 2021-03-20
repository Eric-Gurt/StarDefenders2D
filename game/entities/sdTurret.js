
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdSound from '../sdSound.js';

import sdCharacter from './sdCharacter.js';
import sdVirus from './sdVirus.js';
import sdQuickie from './sdQuickie.js';
import sdOctopus from './sdOctopus.js';
import sdCube from './sdCube.js';
import sdBomb from './sdBomb.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';
import sdAsp from './sdAsp.js';
import sdSandWorm from './sdSandWorm.js';


class sdTurret extends sdEntity
{
	static init_class()
	{
		sdTurret.img_turret = sdWorld.CreateImageFromFile( 'turret' );
		sdTurret.img_turret_fire = sdWorld.CreateImageFromFile( 'turret_fire' );
		
		sdTurret.img_turret2 = sdWorld.CreateImageFromFile( 'turret2' );
		sdTurret.img_turret2_fire = sdWorld.CreateImageFromFile( 'turret2_fire' );
		
		sdTurret.targetable_classes = new WeakSet( [ sdCharacter, sdVirus, sdQuickie, sdOctopus, sdCube, sdBomb, sdAsp, sdSandWorm ] );
		
		sdTurret.KIND_LASER = 0;
		sdTurret.KIND_ROCKET = 1;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -this.GetSize(); }
	get hitbox_x2() { return this.GetSize(); }
	get hitbox_y1() { return -this.GetSize(); }
	get hitbox_y2() { return this.GetSize(); }
	
	get hard_collision()
	{ return true; }
	
	get title()
	{
		return 'Automatic turret';
	}
	
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
		
		this.kind = params.kind || 0;
		
		this._hmax = 100;
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		this._owner = params.owner || null;
		
		this.an = 0;
		
		this._seek_timer = Math.random() * 15;
		this.fire_timer = 0;
		this._target = null;
		
		//this._coms_near_cache = [];
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
				this._seek_timer = 10 + Math.random() * 10;

				this._target = null;
				
				const that = this;
				
				/*let coms_near = this._coms_near_cache;
				
				if ( coms_near.length === 0 || coms_near[ 0 ]._is_being_removed || !sdWorld.CheckLineOfSight( this.x, this.y, coms_near[ 0 ].x, coms_near[ 0 ].y, null, null, sdCom.com_visibility_unignored_classes ) )
				{
					this._coms_near_cache = coms_near = sdWorld.GetComsNear( this.x, this.y, null, null, true );
				}*/
				let coms_near = this.GetComsNearCache( this.x, this.y, null, null, true );
				
				//let class_cache = {};
				function RuleAllowedByNodes( c )
				{
					for ( var i = 0; i < coms_near.length; i++ )
					{
						if ( coms_near[ i ].subscribers.indexOf( c ) !== -1 )
						return false;
					}
					return true;
				}
				
				//let net_id_cache = {};
				/*function NetIDSearch( _net_id )
				{
					//if ( !net_id_cache[ _net_id ] )
					//net_id_cache[ _net_id ] = sdWorld.GetComsNear( that.x, that.y, null, _net_id, true ).length;
				
					return net_id_cache[ _net_id ];
				}*/
				
				//let coms_near_len = sdWorld.GetComsNear( this.x, this.y, null, null, true ).length;
				let coms_near_len = coms_near.length;
				
				const targetable_classes = sdTurret.targetable_classes;

				for ( var x = this.x - 300; x < this.x + 300; x += 32 )
				for ( var y = this.y - 300; y < this.y + 300; y += 32 )
				{
					var arr = sdWorld.RequireHashPosition( x, y );
					for ( var i2 = 0; i2 < arr.length; i2++ )
					{
						var e = arr[ i2 ];
						
						if ( targetable_classes.has( e.constructor ) )
						//if ( e.is( sdCharacter ) || e.is( sdVirus ) || e.is( sdQuickie ) || e.is( sdOctopus ) || e.is( sdCube ) || e.is( sdBomb ) )
						if ( ( e.hea || e._hea ) > 0 && ( !e.is( sdSandWorm ) || e.death_anim === 0 ) )
						if ( e.IsVisible( this._owner ) || ( e.driver_of && e.driver_of.IsVisible( this._owner ) ) )
						{
							if ( e !== this._owner || coms_near_len > 0 )
							//if ( e.GetClass() === 'sdCharacter' || e.GetClass() === 'sdVirus' || e.GetClass() === 'sdQuickie' || e.GetClass() === 'sdOctopus' || e.GetClass() === 'sdCube' )
							//if ( e instanceof sdCharacter || e instanceof sdVirus || e instanceof sdQuickie || e instanceof sdOctopus || e instanceof sdCube )
							//if ( NetIDSearch( e._net_id ) === 0 && ClassSearch( e.GetClass() ) === 0 )
							if ( RuleAllowedByNodes( e._net_id ) && RuleAllowedByNodes( e.GetClass() ) )
							{
								if ( sdWorld.CheckLineOfSight( this.x, this.y, e.x, e.y, this, null, [ 'sdBlock', 'sdDoor', 'sdMatterContainer', 'sdCommandCentre' ] ) )
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
				
				let vel = 15;
				
				if ( this.kind === sdTurret.KIND_ROCKET )
				vel = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_velocity;
				
				this.an = Math.atan2( this._target.y + this._target.sy * di / vel - this.y, this._target.x + this._target.sx * di / vel - this.x ) * 100;
				
				if ( this.fire_timer <= 0 )
				{
					if ( this.kind === sdTurret.KIND_LASER )
					sdSound.PlaySound({ name:'turret', x:this.x, y:this.y, volume:1 });
					if ( this.kind === sdTurret.KIND_ROCKET )
					sdSound.PlaySound({ name:sdGun.classes[ sdGun.CLASS_ROCKET ].sound, x:this.x, y:this.y, volume:1 });
					
					let bullet_obj = new sdBullet({ x: this.x, y: this.y });
					
					bullet_obj._owner = this;
					
					bullet_obj.sx = Math.cos( this.an / 100 );
					bullet_obj.sy = Math.sin( this.an / 100 );
					
					//bullet_obj.x += bullet_obj.sx * 5;
					//bullet_obj.y += bullet_obj.sy * 5;
					
					bullet_obj.sx *= vel;
					bullet_obj.sy *= vel;
					
					this.fire_timer = this.GetReloadTime();
						
					if ( this.kind === sdTurret.KIND_LASER )
					{
						bullet_obj._damage = 15;
						bullet_obj.color = '#ff0000';
					}
					if ( this.kind === sdTurret.KIND_ROCKET )
					{
						bullet_obj._damage = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties._damage;
						
						bullet_obj._explosion_radius = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties._explosion_radius;
						bullet_obj.model = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.model;
						
						bullet_obj.color = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.color;
						
						bullet_obj.ac = sdGun.classes[ sdGun.CLASS_ROCKET ].projectile_properties.ac;
						
						if ( bullet_obj.ac > 0 )
						{
							bullet_obj.acx = Math.cos( this.an / 100 );
							bullet_obj.acy = Math.sin( this.an / 100 );
						}
					}	
					
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
	GetReloadTime()
	{
		if ( this.kind === sdTurret.KIND_LASER )
		return 10;
		if ( this.kind === sdTurret.KIND_ROCKET )
		return sdGun.classes[ sdGun.CLASS_ROCKET ].reload_time;
	}
	GetSize()
	{
		if ( this.kind === sdTurret.KIND_LASER )
		return 3;
		if ( this.kind === sdTurret.KIND_ROCKET )
		return 6;
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
		//if ( sdWorld.CheckLineOfSight( this.x, this.y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, sdCom.com_visibility_ignored_classes, null ) )
		if ( sdWorld.CheckLineOfSight( this.x, this.y, sdEntity.entities[ i ].x, sdEntity.entities[ i ].y, this, null, sdCom.com_visibility_unignored_classes ) )
		{
			ctx.beginPath();
			ctx.moveTo( sdEntity.entities[ i ].x - this.x, sdEntity.entities[ i ].y - this.y );
			ctx.lineTo( 0,0 );
			ctx.stroke();
		}

		ctx.beginPath();
		ctx.arc( 0,0, sdCom.retransmit_range, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}
	Draw( ctx, attached )
	{
		ctx.rotate( this.an / 100 );
		
		if ( this.kind === sdTurret.KIND_LASER )
		ctx.drawImage( ( this.fire_timer < this.GetReloadTime() - 2.5 ) ? sdTurret.img_turret : sdTurret.img_turret_fire, -16, -16, 32,32 );
	
		if ( this.kind === sdTurret.KIND_ROCKET )
		ctx.drawImage( ( this.fire_timer < this.GetReloadTime() - 2.5 ) ? sdTurret.img_turret2 : sdTurret.img_turret2_fire, -16, -16, 32,32 );
	}
	MeasureMatterCost()
	{
		if ( this.kind === sdTurret.KIND_LASER )
		return ~~( 100 * sdWorld.damage_to_matter + 150 );
		
		if ( this.kind === sdTurret.KIND_ROCKET )
		return ~~( 100 * sdWorld.damage_to_matter + 300 );
	}
	onRemove()
	{
		sdWorld.BasicEntityBreakEffect( this, 3 );
	}
	RequireSpawnAlign()
	{ return false; }
}
//sdTurret.init_class();

export default sdTurret;