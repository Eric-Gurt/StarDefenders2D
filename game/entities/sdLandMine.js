
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdBullet from './sdBullet.js';
import sdEffect from './sdEffect.js';
import sdTurret from './sdTurret.js';

class sdLandMine extends sdEntity
{
	static init_class()
	{
		sdLandMine.img_landmine = sdWorld.CreateImageFromFile( 'sdLandMine' ); // Sprite by Gashadokuro

		sdLandMine.VARIATION_BASIC = 0;
		sdLandMine.VARIATION_JUMPER = 1;
		sdLandMine.VARIATION_BANANA = 2;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 3; }
	get hitbox_y1() { return -1; }
	get hitbox_y2() { return 1; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hea = 40;
		this.filter = params.filter || 'none';
		this.variation = params.variation || 0;
		this._owner = null;
		this.activated = false;
		
		this._color = params.color || sdEffect.default_explosion_color;
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.DamageWithEffect( ( vel - 4 ) );
		}
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		let old_hp = this.hea;
	
		this.hea -= dmg;
		
		if ( this.hea <= 0 )
		if ( old_hp > 0 )
		{
			this.remove();
		}
	}
	GetIgnoredEntityClasses()
	{
		return ( this.activated || this.variation === sdLandMine.VARIATION_BANANA ) ? [ 'sdCharacter' ] : [ ];
	}
	IsVisible( observer_character ) // Can be used to hide guns that are held, they will not be synced this way
	{
		if ( observer_character === this._owner )
		return true;

		if ( this.variation === sdLandMine.VARIATION_BANANA )
		return true;

		if ( observer_character )
		{
			let di = sdWorld.Dist2D( observer_character.x, observer_character.y, this.x, this.y )
			if ( di < 64 )
			return true;
		}

		return false;
	}
	Impulse( x, y )
	{
		this.sx += x * 0.03;
		this.sy += y * 0.03;
	}
	onMovementInRange( from_entity )
	{
		let ent_sx = from_entity.sx || 0;
		let ent_sy = from_entity.sy || 0;
		if ( !this.activated )
		if ( ent_sx + ent_sy > 0.1 )
		if ( from_entity.GetClass() !== 'sdBullet' )
		if ( from_entity.mass > 25 )
		if ( from_entity.y <= this.y )
		{
			if ( this.variation === sdLandMine.VARIATION_BASIC || this.variation === sdLandMine.VARIATION_JUMPER )
			{
				this.activated = true;

				sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.5, pitch: ( this.variation === sdLandMine.VARIATION_JUMPER ) ? 0.5 : 1.5 });
				setTimeout(()=>{
				this.Damage( this.hea + 1 );
				}, ( this.variation === sdLandMine.VARIATION_JUMPER ) ? 350 : 150 );

				if ( this.variation === sdLandMine.VARIATION_JUMPER )
				{
				this.sy -= 6;
				}
			}
			if ( this.variation === sdLandMine.VARIATION_BANANA )
			{
				if ( from_entity.IsPlayerClass() )
				{
					this.activated = true;
					from_entity.DamageStability( 1000 );
					setTimeout(()=>{
					this.Damage( this.hea + 1 );
					}, 1000 );
				}	
			}
		}
	}
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		this.sy += sdWorld.gravity * GSPEED;
		
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		
	}
	get title()
	{
		return 'Land mine';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.variation !== sdLandMine.VARIATION_BANANA )
		if ( this.hea > 0 )
		sdEntity.Tooltip( ctx, this.title );
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		let yy = 0;

		if ( this.activated )
		xx = 1;

		if ( this.variation === sdLandMine.VARIATION_BASIC )
		yy = 0;

		if ( this.variation === sdLandMine.VARIATION_JUMPER )
		yy = 1;

		if ( this.variation === sdLandMine.VARIATION_BANANA )
		yy = 2;

		ctx.filter = this.filter;
		ctx.drawImageFilterCache( sdLandMine.img_landmine, 32 * xx, 32 * yy, 32,32, -16, -16, 32,32 );
		ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._owner )
		if ( this._owner._is_being_removed )
		this._owner = null;
		
		// Explosion
		if ( this.variation !== sdLandMine.VARIATION_BANANA )
		if ( this._broken )
		{
			sdWorld.SendEffect({ 
				x:this.x, 
				y:this.y, 
				radius: ( this.variation === sdLandMine.VARIATION_JUMPER ) ? 35 : 30, // 70 was too much?
				damage_scale: 7, // 5 was too deadly on relatively far range
				type:sdEffect.TYPE_EXPLOSION, 
				owner:this._owner,
				can_hit_owner: true,
				armor_penetration_level: ( this._owner && this.variation >= 3 ) ? this._owner._upgrade_counters[ 'upgrade_damage' ] : undefined, // No-owner barrels can damage workbenches, also white barrels can too
				color: this._color 
			});

			if ( this.variation === sdLandMine.VARIATION_JUMPER && sdWorld.is_server )
			{
				let initial_rand = -Math.PI / 2;
				let steps = 12;
				let an;
				let bullet_obj;
						
				for ( let s = 0; s < steps; s++ )
				{
					an = s / steps * Math.PI ;
				
					bullet_obj = new sdBullet({ 
						x: this.x + Math.sin( an + initial_rand ) * 1, 
						y: this.y + Math.cos( an + initial_rand ) * 1 
					});	
			
					bullet_obj.sx = Math.sin( an + initial_rand ) * 16;
					bullet_obj.sy = Math.cos( an + initial_rand ) * 16;
					bullet_obj.time_left = 32;
												
					bullet_obj._damage = 96;

					bullet_obj._affected_by_gravity = true;
					bullet_obj.gravity_scale = 2;
				
					bullet_obj._can_hit_owner = false;
					bullet_obj.color = '#ffff00';

					sdEntity.entities.push( bullet_obj );
				}
			}
		}
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		return 150;
		//return this.hmax * sdWorld.damage_to_matter + 50;
	}
}
//sdLandMine.init_class();

export default sdLandMine;
