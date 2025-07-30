
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdEffect from './sdEffect.js';

class sdBomb extends sdEntity
{
	static init_class()
	{
		sdBomb.img_beacon = sdWorld.CreateImageFromFile( 'sdBomb' );
		/*
		sdBomb.img_beacon = sdWorld.CreateImageFromFile( 'strike_beacon' );
		sdBomb.img_beacon2 = sdWorld.CreateImageFromFile( 'strike_beacon2' );
		sdBomb.img_beacon3 = sdWorld.CreateImageFromFile( 'strike_beacon3' );
		*/
	   
		sdBomb.TYPE_BASIC = 0;
		sdBomb.TYPE_ANTI_BASE = 1;
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -3; }
	get hitbox_x2() { return 4; }
	get hitbox_y1() { return -4; }
	get hitbox_y2() { return 2; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		// Carrying
		this.held_by = null;
		
		this.type = params.type || 0;
		
		this.detonation_in = 30 * 25; // 25 seconds, was 45
		
		if ( this.type === sdBomb.TYPE_ANTI_BASE )
		this.detonation_in = 30 * 60;
	
		//this.detonation_in = 30 * 5; // Hack
		
		this.hea = 100 * 2;
		
		this._rate = 60;
		
		this._owner = null;
		
		this._time_amplification = 0;
	}
	Impact( vel ) // fall damage basically
	{
		if ( vel > 7 )
		{
			this.DamageWithEffect( ( vel - 4 ) * 5 );
		}
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		let old_hp = this.hea;
	
		this.hea -= Math.abs( dmg );
		
		if ( this.hea <= 0 )
		if ( old_hp > 0 )
		sdSound.PlaySound({ name:'sd_beacon_disarm', x:this.x, y:this.y, volume:1 });
		
		if ( this.hea <= -100 )
		{
			this.remove();
		}
	}
	Impulse( x, y )
	{
		if ( this.held_by )
		return;
	
		this.sx += x * 0.03;
		this.sy += y * 0.03;
	}
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.held_by )
		return [ this.held_by ]; 
	
		return [];
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return true; }
	
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !this.held_by )
		{
			this.sy += sdWorld.gravity * GSPEED;
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}
		
		let GSPEED_scaled = sdGun.HandleTimeAmplification( this, GSPEED );
		
		if ( this.hea > 0 )
		{
			let old = this.detonation_in;

			this.detonation_in -= GSPEED_scaled;

			let rate = 60;

			if ( this.detonation_in < 30 * 3 )
			rate = 7.5;
			else
			if ( this.detonation_in < 30 * 5 )
			rate = 15;
			else
			if ( this.detonation_in < 30 * 10 )
			rate = 30;

			this._rate = rate;

			if ( old % rate >= rate / 2 )
			if ( this.detonation_in % rate < rate / 2 )
			{
				// Beep
				if ( this.type === sdBomb.TYPE_ANTI_BASE )
				sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.25, pitch: 0.8 });
				else
				sdSound.PlaySound({ name:'sd_beacon', x:this.x, y:this.y, volume:0.25 });
			}

			if ( this.detonation_in <= 0 )
			{
				// Explosion
				
				sdWorld.SendEffect({ 
					x:this.x, 
					y:this.y, 
					radius:( this.type === sdBomb.TYPE_ANTI_BASE ) ? 100 : 70, // 80 was too much?
					//damage_scale: ( ( this.type === sdBomb.TYPE_ANTI_BASE ) ? 600 : 25 ) * 3, // 5 was too deadly on relatively far range
					damage_scale: 25 * 3, // 5 was too deadly on relatively far range
					type:sdEffect.TYPE_EXPLOSION, 
					//owner: ( this.type === sdBomb.TYPE_ANTI_BASE ) ? null : this._owner,
					owner: this._owner,
					can_hit_owner: true,
					color:sdEffect.default_explosion_color,
					shrapnel: true,
					
					anti_shield: ( this.type === sdBomb.TYPE_ANTI_BASE )
				});
				
				

				this.remove();
			}
		}
		else
		{
			this.DamageWithEffect( GSPEED );
		}
	}
	get title()
	{
		if ( this.type === sdBomb.TYPE_ANTI_BASE )
		return 'Anti-base shield bomb';
			
		return 'Bomb';
	}
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea > 0 )
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + " ( " + Math.ceil( this.detonation_in / 30 ) + "s )" );
		else
		sdEntity.TooltipUntranslated( ctx, T( this.title ) + " ( " + T("disarmed") + " )" );
	
		this.BasicCarryTooltip( ctx, 8 );
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		if ( this.held_by === null || attached )
		{
			let xx = 0;

			if ( this.hea <= 0 )
			{
				if ( this.hea < -70 )
				ctx.globalAlpha = 0.5;

				xx = 1;

				ctx.globalAlpha = 1;
			}
			else
			if ( this.detonation_in < 30 )
			xx = 2;
			else
			{
				if ( this.detonation_in % this._rate < this._rate / 2 )
				xx = 0;
				else
				xx = 1;
			}
			ctx.drawImageFilterCache( sdBomb.img_beacon, xx * 32, this.type * 32, 32,32, -16, -16, 32,32 );
		}
	}
	onRemove() // Class-specific, if needed
	{
	}
	MeasureMatterCost()
	{
		if ( this.type === sdBomb.TYPE_ANTI_BASE )
		return 1850;
	
		return 200; // 300
	}
}
//sdBomb.init_class();

export default sdBomb;