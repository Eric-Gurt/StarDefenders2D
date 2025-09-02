/*

	Crystalized non-sdCrystal entities, as a result of being damaged by powerful weaponry, possibly ones that belong to bosses. 
	Most probably rescue teleports should not work in case of these unless updated to level 3 or something like that.

	Should be gold-colored, but quite possibly freezing effect can be achieved with these - for that case some private property can keep 
	JSON.stringify representation of original entity (with "save_as_much_as_possible"). I expect it to be working really bad with sockets & score reassigning though, 
	especially when socket disconnects in the middle of frozen state. Maybe such frozen state can be better if it will be achieved with actual sdCharacter's public 
	property like "frozen" which only applies filter and disables any animations (or maybe simply implements sdLost's onThink logic instead of current one)

*/
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdGun from './sdGun.js';
import sdAsp from './sdAsp.js';
import sdCrystal from './sdCrystal.js';
import sdJunk from './sdJunk.js';
import sdCharacter from './sdCharacter.js';
import sdCrystalCombiner from './sdCrystalCombiner.js';
import sdMatterAmplifier from './sdMatterAmplifier.js';
import sdSandWorm from './sdSandWorm.js';
import sdFaceCrab from './sdFaceCrab.js';
import sdCharacterRagdoll from './sdCharacterRagdoll.js';
import sdStorage from './sdStorage.js';
import sdEffect from './sdEffect.js';

class sdLost extends sdEntity
{
	static init_class()
	{
		sdLost.entities_and_affection = new Map();
		
		sdLost.filters = [
			'contrast(0.8) sepia(1) hue-rotate(10deg) saturate(16)',
			'saturate(0) brightness(2.5)',
			'none',
			'saturate(8) contrast(2) brightness(0.2) sepia(1) saturate(20) hue-rotate(-17deg) brightness(0.7)', // Glassed gives a red hue
			'saturate(8) contrast(0.6) brightness(0.2) sepia(1) saturate(8) hue-rotate(-20deg) brightness(0.8)',
			'saturate(0) brightness(0.5) contrast(2)'
		];
		
		sdLost.FILTER_GOLDEN = 0;
		sdLost.FILTER_WHITE = 1;
		sdLost.FILTER_NONE = 2;
		sdLost.FILTER_GLASSED = 3;
		sdLost.FILTER_RED = 4;
		sdLost.FILTER_VOID = 5;

		sdWorld.static_think_methods.push( sdLost.StaticThink );
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	static ApplyAffection( ent, amonut, bullet=null, f=sdLost.FILTER_GOLDEN )
	{
		let is_dead = ( ( ent.hea || ent._hea || 1 ) <= 0 );
		
		if ( ( ent._hard_collision && !ent.is( sdCrystal ) && !( ent.is( sdAsp ) && ( ent.tier === 2 || ent.tier === 3 ) ) && !ent.is( sdLost ) && ( !ent.is( sdJunk ) || ent.type !== 2 ) ) ||
			 ( !ent._hard_collision && ( ent.is( sdFaceCrab ) || ( ent.is( sdGun ) && ent.class !== sdGun.CLASS_CRYSTAL_SHARD && ent.class !== sdGun.CLASS_SCORE_SHARD ) || is_dead ) ) ) // Not for BG entities
		if ( ent._is_bg_entity === 0 ) // Not for BG entities
		if ( ent.IsTargetable() )
		//if ( !ent.is( sdCharacter ) || !ent._god ) Should be handled by impossibility of damage
		//if ( ent.IsTargetable() || is_dead )
		{
			/*if ( ( typeof ent._armor_protection_level === 'undefined' || bullet._armor_penetration_level >= ent._armor_protection_level ) &&
				 ( typeof ent._reinforced_level === 'undefined' || bullet._reinforced_level >= ent._reinforced_level ) )
			{
				
			}
			else
			return;*/
		
			let hea = ( ent._hea || ent.hea || 0 );
			
			ent.DamageWithEffect( 1, bullet ? bullet._owner : null );
			
			let hea2 = ( ent._hea || ent.hea || 0 );
			
			if ( ent._is_being_removed )
			return;
		
			let mult = hea - hea2;
			
			if ( mult <= 0 )
			return;
			
			//if ( mult > 1 ) PvP damage scaling would neglect armor protection like this... So lost effect from player to player is now scaled with PvP damage scale too
			//mult = 1;
		
			amonut *= mult;

			let cur_amount = sdLost.entities_and_affection.get( ent );

			if ( cur_amount === undefined )
			cur_amount = 0;

			cur_amount += amonut;

			if ( cur_amount > Math.max( ent._hea || ent.hea || 0, 50 ) )
			{
				if ( ent.is( sdCrystalCombiner ) )
				ent.DropCrystals();

				if ( ent.is( sdMatterAmplifier ) )
				ent.DropCrystal();
			
				if ( ent.is( sdAsp ) && ent.tier === 1 )
				{
					ent.remove();
					ent._broken = false;
					let new_asp = new sdAsp({
						x: ent.x,
						y: ent.y,
						_tier: 2,
						filter: sdLost.filters[ f ],
						crystal_worth: f === sdLost.FILTER_GOLDEN ? 640 : 0
					});
					sdEntity.entities.push( new_asp );
					return;
				}

				/*if ( ent.is( sdCharacter ) )
				{
					if ( !ent._ragdoll )
					{
						ent._ragdoll = new sdCharacterRagdoll( ent );

						if ( ent.hea > 0 )
						{
							ent._ragdoll.AliveUpdate();
						}
						else
						{
							ent._ragdoll.AliveUpdate();
							for ( let i = 0; i < 90; i++ )
							ent._ragdoll.Think( 1 );
						}
					}
				}*/
				
				
				sdLost.entities_and_affection.delete( ent );

				let title = ent.title || null;
				
				if ( title )
				{
					if ( ent.is( sdCharacter ) )
					{
						title += ' ( score: '+ ent._score +' )';
					}
				}
				
				let ent2 = sdLost.CreateLostCopy( ent, title, f );
				
				if ( ent.is( sdCharacter ) )
				{
					if ( ent.hea > 0 )
					{
						if ( sdWorld.server_config.onKill )
						sdWorld.server_config.onKill( ent, bullet ? bullet._owner : null );
					}
					
					/*if ( ent._ragdoll )
					{
						ent._ragdoll.Delete(); // Or lese crash if this happens at the same time when snapshot is saved
					}*/
				}
				
				
				if ( ent.is( sdSandWorm ) )
				{
					let e1 = ent.towards_head;
					let e2 = ent.towards_tail;

					ent.remove();
					ent._broken = false; // No debris
					
					if ( e1 )
					{
						if ( !e1._is_being_removed )
						sdLost.ApplyAffection( e1, Infinity, bullet, f );
					}
					
					if ( e2 )
					{
						if ( !e2._is_being_removed )
						sdLost.ApplyAffection( e2, Infinity, bullet, f );
					}
				}
				else
				{
					let remove = true;
					
					if ( ent.is( sdCharacter ) )
					if ( ent.AttemptTeleportOut( null, true ) )
					remove = false;
					
					
					if ( remove )
					{
						ent.remove();
						ent._broken = false; // No debris
					}
				}
			}
			else
			{
				sdLost.entities_and_affection.set( ent, cur_amount );
			}
		}
	}
	
	static CreateLostCopy( ent, title='', f=sdLost.FILTER_GOLDEN, time = -1 )
	{
		let ent2 = new sdLost({
			x: ent.x,
			y: ent.y,
			sx: ent.sx,
			sy: ent.sy,
			x1: ent.hitbox_x1,
			y1: ent.hitbox_y1,
			x2: ent.hitbox_x2,
			y2: ent.hitbox_y2,
			hea: ent.hea || ent._hea,
			d3d: ent.DrawIn3D(),
			mass: ent.mass,
			d: sdWorld.GetDrawOperations( ent ),
			matter_max: ent.matter || ent._matter || 1,
			s: ent.is_static,
			t: title,
			f: f,
			time_left: time,
			
			copy_of_class: ent.GetClass(),
			title_as_storage_item: ent.is( sdCrystal ) ? sdStorage.GetTitleForCrystal( ent ) : '?'
			//regen_rate: ent.is( sdCrystal ) ? ent.matter_regen : 0
			
		});
		sdEntity.entities.push( ent2 );
		sdWorld.UpdateHashPosition( ent2, false ); // Optional, but will make it visible as early as possible

		return ent2;
	}
	
	static StaticThink( GSPEED )
	{
		GSPEED *= 0.1;
		sdLost.entities_and_affection.forEach( ( cur_amount, ent )=>
		{
			cur_amount -= GSPEED;
			
			if ( cur_amount <= 0 || ent._is_being_removed )
			sdLost.entities_and_affection.delete( ent );
			else
			sdLost.entities_and_affection.set( ent, cur_amount );
		});
	}
	
	get hitbox_x1() { return this.x1; }
	get hitbox_x2() { return this.x2; }
	get hitbox_y1() { return this.y1; }
	get hitbox_y2() { return this.y2; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ 
		//return this.s; 
		return true;
	}
	
	DrawIn3D()
	{
		return this.d3d;
	}
	/* Causes client-side falling through unsynced ground, probably bad thing to do and it won't be complex entity after sdSnapPack is added
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }*/
		
	IsPhysicallyMovable()
	{
		return !this.s;
	}
	
	constructor( params )
	{
		super( params );
		
		// Carrying
		this.held_by = null;
		
		this.x1 = params.x1 || 0;
		this.y1 = params.y1 || 0;
		this.x2 = params.x2 || 0;
		this.y2 = params.y2 || 0;
		
		this.sx = params.sx || 0;
		this.sy = params.sy || 0;
		this._matter_max = 1;
		
		this.s = params.s || false;
		
		this._last_damage = 0; // Sound flood prevention
		
		if ( typeof params.matter_max !== 'undefined' )
		this._matter_max = params.matter_max;

		this._matter = this._matter_max;
		this._hea = Math.max( ( params.hea || 1 ) * 0.2, 60 );
		
		this.d3d = params.d3d || 0;
		
		this.m = params.mass || 1;
		
		this.d = params.d || [ 1, 'death1' ];
		
		this.t = params.t || null;
		this._title_as_storage_item = params.title_as_storage_item || '';
		this._copy_of_class = params.copy_of_class || '';
		this._time_left = params.time_left || -1;
		//this._regen_rate = params.regen_rate || 0;
		
		this.f = params.f || 0; // Filter ID
		
		this.awake = 1; // For client sync // Magic property name
		
		this._fake_matter_max = 0;
		
		//if ( this.s )
		{
			this._update_version = 0; // sdEntity constructor won't make this property during snapshot load since it is dynamic
			//this._update_version++;
		}
		
		//console.log( 'this._matter_max = ',this._matter_max );
	}
	ExtraSerialzableFieldTest( prop )
	{		
		if ( prop === 'd' || prop === '_title_as_storage_item' || prop === '_copy_of_class' ) return true;
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._copy_of_class === 'sdCrystal' )
		if ( this.held_by )
		if ( typeof this.held_by.DropCrystal !== 'undefined' )
		{
			this.held_by.DropCrystal( this, true );
		}
	
		dmg = Math.abs( dmg );
		
		let was_alive = ( this._hea > 0 );
		
		
		this._hea -= dmg;
		
		if ( this._hea <= 0 )
		{
			if ( was_alive )
			{
				if ( this.f === sdLost.FILTER_GOLDEN || this.f === sdLost.FILTER_GLASSED || this.f === sdLost.FILTER_VOID )
				sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.5 });
					
				if ( this.f === sdLost.FILTER_GOLDEN )
				{
					sdSound.PlaySound({ name:'glass12', x:this.x, y:this.y, volume:0.5 });

					sdWorld.DropShards( this.x + ( this.x2 + this.x1 ) / 2, this.y + ( this.y2 + this.y1 ) / 2, this.sx, this.sy, 
						Math.ceil( Math.min( 10, Math.max( 1, this._matter / sdWorld.crystal_shard_value ) ) ),
						//this._matter_max / 40,
						40 * 16 / 40,
						( this.x2 - this.x1 + this.y2 - this.y1 ) / 4
					);
				}
				else
				{
					sdWorld.BasicEntityBreakEffect( this, 3, undefined, undefined, 1.4 );
				}

				this.remove();
			}
		}
		else
		{
			if ( sdWorld.time > this._last_damage + 50 )
			{
				this._last_damage = sdWorld.time;
				
				if ( this.f === sdLost.FILTER_GOLDEN || this.f === sdLost.FILTER_GLASSED || this.f === sdLost.FILTER_VOID )
				sdSound.PlaySound({ name:'crystal2_short', x:this.x, y:this.y, volume:1 });
			}
		}
	}
	
	get mass() { return this.m; }
	Impulse( x, y )
	{
		if ( this.held_by )
		return;
	
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	getRequiredEntities( observer_character ) // Some static entities like sdCable do require connected entities to be synced or else pointers will never be resolved due to partial sync
	{
		if ( this.held_by )
		return [ this.held_by ]; 
	
		return [];
	}
	
	GetBleedEffect()
	{
		if ( this.f === sdLost.FILTER_VOID )
		return sdEffect.TYPE_BLOOD_GREEN;
	
		return sdEffect.TYPE_WALL_HIT;
	}

	GetBleedEffectFilter()
	{
		if ( this.f === sdLost.FILTER_VOID )
		return 'saturate(0) brightness(0)';

		return '';
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		this._update_version++;

		if ( this.f === sdLost.FILTER_VOID )
		{
			GSPEED *= 0.25;
		}

		if ( !this.s )
		{
			if ( sdWorld.is_server || this.awake )
			if ( !this.held_by )
			{
				this.sy += sdWorld.gravity * GSPEED;

				this.ApplyVelocityAndCollisions( GSPEED, 0, true );
			}

			//this._matter = Math.min( this._matter_max, this._matter + GSPEED * 0.001 * this._matter_max / 80 );
			//this.MatterGlow( 0.01, 30, GSPEED );
			if ( this._phys_sleep <= 0 && this._time_left === -1 && !this.held_by )
			{
				if ( sdWorld.is_server )
				{
					this.awake = 0;
				}
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
			}
			else
			{
				if ( sdWorld.is_server )
				{
					this.awake = 1;
					if ( this._time_left > 0 )
					this._time_left = Math.max( 0, this._time_left - GSPEED );
					if ( this._time_left === 0 )
					this.remove();
				}
			}
		}
		else
		{
			//this.awake = 0;
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
	}
	/*DrawHUD( ctx, attached ) // foreground layer
	{
		sdEntity.Tooltip( ctx, "Lost" );
	}*/
	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.t )
		{
			if ( this.f === sdLost.FILTER_GOLDEN )
			sdEntity.Tooltip( ctx, 'Lost ' + this.t );
			else
			if ( this.f === sdLost.FILTER_WHITE )
			sdEntity.Tooltip( ctx, 'Empty ' + this.t );
			else
			if ( this.f === sdLost.FILTER_GLASSED )
			sdEntity.Tooltip( ctx, 'Glassed ' + this.t );
			else
			if ( this.f === sdLost.FILTER_VOID )
			sdEntity.Tooltip( ctx, 'Void ' + this.t );

			else
			sdEntity.Tooltip( ctx, this.t );
		}
	}
	Draw( ctx, attached )
	{
		//ctx.apply_shading = false;

		if ( this.held_by === null || attached )
		{
			if ( typeof this.f === 'number' )
			ctx.filter = sdLost.filters[ this.f ];
			else
			ctx.filter = this.f;

			if ( this.f === 0 )
			ctx.globalAlpha = 0.8;
			else
			if ( this.f === 1 )
			ctx.globalAlpha = 1;
			else
			if ( this.f === 3 )
			ctx.globalAlpha = 1;
			sdWorld.ApplyDrawOperations( ctx, this.d );

			ctx.globalAlpha = 1;
			ctx.filter = 'none';
		}
	}
	onRemove() // Class-specific, if needed
	{
		/*if ( this._hea <= 0 ) // In else case it was just removed (not best way to check)
		{
			sdWorld.DropShards( this.x, this.y, this.sx, this.sy, 
				Math.ceil( Math.max( 5, this._matter / this._matter_max * 40 / sdWorld.crystal_shard_value * 0.5 ) ),
				this._matter_max / 40
			);
		}*/
	}
	MeasureMatterCost()
	{
		return 0; // Hack
		
		//return this._hmax * sdWorld.damage_to_matter + this._matter;
	}
}
//sdLost.init_class();

export default sdLost;
