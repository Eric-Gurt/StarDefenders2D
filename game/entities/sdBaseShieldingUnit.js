
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

import sdRenderer from '../client/sdRenderer.js';

class sdBaseShieldingUnit extends sdEntity
{
	static init_class()
	{
		sdBaseShieldingUnit.img_unit = sdWorld.CreateImageFromFile( 'shield_unit' );
		sdBaseShieldingUnit.img_unit_repair = sdWorld.CreateImageFromFile( 'shield_unit_repair' );

		sdBaseShieldingUnit.protect_distance = 275;
				
		sdBaseShieldingUnit.regen_matter_cost_per_1_hp = 0.01; // Much less than player's automatic regeneration
		
		sdBaseShieldingUnit.all_shield_units = [];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -8; }
	get hitbox_x2() { return 8; }
	get hitbox_y1() { return -8; }
	get hitbox_y2() { return 8; }
	
	get hard_collision() // For world geometry where players can walk
	{ return true; }

	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	
	//get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	//{ return true; }

	Impact( vel ) // fall damage basically
	{
		// No impact damage if has driver (because no headshot damage)
		if ( vel > 5 )
		{
			this.Damage( ( vel - 3 ) * 25 );
		}
	}
	RequireSpawnAlign() 
	{ return false; }

	constructor( params )
	{
		super( params );
		
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 500; // * 3 when enabled * construction hitpoints upgrades - Just enough so players don't accidentally destroy it when stimpacked and RTP'd
		this.hea = this.hmax;
		//this._hmax_old = this.hmax;
		this.regen_timeout = 0;
		//this._last_sync_matter = 0;
		this.matter_crystal_max = 2000000;
		this.matter_crystal = 0; // Named differently to prevent matter absorption from entities that emit matter
		this._protected_entities = [];
		this.enabled = false;
		this.attack_other_units = false;
		
		//this.filter = params.filter || 'none';

		//this._repair_timer = 0;
		this._attack_timer = 0;
		this.attack_anim = 0; //Animation

		this._target = null;
		// 1 slot
		
		sdBaseShieldingUnit.all_shield_units.push( this );
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_protected_entities' );
	}
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = Math.abs( dmg );
		
		if ( this.enabled )
		{
			dmg *= 0.333;
			sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
		}
		
		//let old_hea = this.hea;
		
		this.hea -= dmg;

		if ( this.hea <= 0 )
		this.remove();
	
		this.regen_timeout = 30;

		//console.log( this._protected_entities );

		//this._update_version++; // Just in case
	}
	SetShieldState( enable=false )
	{
		if ( enable === this.enabled )
		{
			return;
		}
		
		this.enabled = enable;
		if ( !this.enabled ) // Disabled protected blocks and doors
		{
			/*let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, [ 'sdBlock', 'sdDoor' ] );
			for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
			{
				if ( blocks[ i ].GetClass() === 'sdBlock' )
				{
					if ( blocks[ i ].material === sdBlock.MATERIAL_WALL || blocks[ i ].material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ) // Only walls, no trap or shield blocks
					if ( blocks[ i ]._shielded === this._net_id )
					{
						blocks[ i ]._shielded = null;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#855805' });
						//this._protected_entities.push( blocks[ i ]._net_id );
					}
				}
			
				if ( blocks[ i ].GetClass() === 'sdDoor' )
				{
					if ( blocks[ i ]._shielded === this._net_id )
					{
						blocks[ i ]._shielded = null;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#855805' });
						//this._protected_entities.push( blocks[ i ]._net_id );
					}
				}
			}*/
			let obj;
			for ( let j = 0; j < this._protected_entities.length; j++ )
			{
				obj = sdEntity.entities_by_net_id_cache_map.get( this._protected_entities[ j ] );
				//if ( ( sdWorld.Dist2D( this.x, this.y, this._protected_entities[ j ].x, this._protected_entities[ j ].y ) > sdBaseShieldingUnit.protect_distance ) || ( !this.enabled ) ) // If an entity is too far away, let players know it's not protected anymore
				//if ( obj._shielded === this._net_id )
				if ( obj ) // If not - admin removed it. Or world border
				if ( obj._shielded === this )
				{
					obj._shielded = null;
					sdWorld.SendEffect({ x:this.x, y:this.y, x2:obj.x + ( obj.hitbox_x2 / 2 ), y2:obj.y + ( obj.hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#855805' });
				}
			}
			this._protected_entities = [];
		}

		if ( this.enabled ) // Scan unprotected blocks and fortify them
		{
			//this.sx = 0; // Without this, players can "launch/catapult" shield units by running into them and disabling them
			//this.sy = 0;
			

			let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, [ 'sdBlock', 'sdDoor' ] );
			for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
			{
				if ( blocks[ i ].GetClass() === 'sdBlock' )
				{
					if ( blocks[ i ].material === sdBlock.MATERIAL_WALL || blocks[ i ].material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ) // Only walls, no trap or shield blocks
					if ( blocks[ i ]._shielded === null )
					{
						blocks[ i ]._shielded = this;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
						this._protected_entities.push( blocks[ i ]._net_id ); // Since for some reason arrays don't save _net_id's in this entity, this is obsolete
					}
				}
				else
				if ( blocks[ i ].GetClass() === 'sdDoor' )
				{
					if ( blocks[ i ]._shielded === null )
					{
						blocks[ i ]._shielded = this;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
						this._protected_entities.push( blocks[ i ]._net_id );
					}
				}
			}
		}
	}
	SetAttackState()
	{
		if ( this.enabled )
		this.attack_other_units = !this.attack_other_units;
	}
	get mass() { return ( this.enabled ) ? 500 : 35; }
	Impulse( x, y )
	{
		this.sx += x / this.mass;
		this.sy += y / this.mass;
		//this.sx += x * 0.1;
		//this.sy += y * 0.1;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( this.enabled )
		{
			this.sx = 0;
			this.sy = 0;
		}
		else
		{
			this.sy += sdWorld.gravity * GSPEED;
		
			this.ApplyVelocityAndCollisions( GSPEED, 0, true );
		}

		if ( !sdWorld.is_server)
		return;

		//if ( this._repair_timer > 0 )
		//this._repair_timer -= GSPEED;

		if ( this._attack_timer > 0 )
		this._attack_timer -= GSPEED;


		if ( this.attack_anim > 0 )
		this.attack_anim -= GSPEED;

		if ( this.regen_timeout > 0 )
		this.regen_timeout -= GSPEED;

		if ( this.matter_crystal < 800 )
		this.SetShieldState( false ); // Shut down if no matter
		else
		{
			if ( this.hea > 0 )
			if ( this.hea < this.hmax )
			{
				let heal = Math.min( this.hea + 2 * ( GSPEED ), this.hmax ) - this.hea;
				
				this.hea += heal;
				
				this.matter_crystal -= heal * sdBaseShieldingUnit.regen_matter_cost_per_1_hp * 3; // 3 for shield effect
			}
		}

		if ( this.attack_other_units )
		if ( this._attack_timer <= 0 )
		{
			//let units = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance + 64, null, [ 'sdBaseShieldingUnit' ] );
			
			const units = sdBaseShieldingUnit.all_shield_units;
			
			for ( let i = 0; i < units.length; i++ ) // Protect nearby entities inside base unit's radius
			{
				if ( units[ i ] !== this )
				if ( units[ i ].enabled === true )
				{
					if ( units[ i ].matter_crystal > 350 ) // Not really needed since the units turn off below 800 matter
					{
						units[ i ].matter_crystal -= 350;
						this.matter_crystal -= 350;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:units[ i ].x, y2:units[ i ].y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
						this._attack_timer = 30;
						this.attack_anim = 20;
					}
				}
			}
		}
		/*if ( this._repair_timer <= 0 ) // Realtime fortifying replaced with turning unit on/off since now it is static when it is turned on
		{
			{
				for ( let j = 0; j < this._protected_entities.length; j++ )
				{
					if ( ( sdWorld.Dist2D( this.x, this.y, this._protected_entities[ j ].x, this._protected_entities[ j ].y ) > sdBaseShieldingUnit.protect_distance ) || ( !this.enabled ) ) // If an entity is too far away, let players know it's not protected anymore
					if ( this._protected_entities[ j ]._shielded === this )
					{
						this._protected_entities[ j ]._shielded = null;
						sdWorld.SendEffect({ x:this.x, y:this.y, x2:this._protected_entities[ j ].x + ( this._protected_entities[ j ].hitbox_x2 / 2 ), y2:this._protected_entities[ j ].y + ( this._protected_entities[ j ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#855805' });
					}
				}
				this._repair_timer = 210; // 7 seconds
				if ( this.enabled )
				{
					let blocks = sdWorld.GetAnythingNear( this.x, this.y, sdBaseShieldingUnit.protect_distance, null, [ 'sdBlock', 'sdDoor' ] );
					for ( let i = 0; i < blocks.length; i++ ) // Protect nearby entities inside base unit's radius
					{
						if ( blocks[ i ].GetClass() === 'sdBlock' )
						{
							if ( blocks[ i ].material === sdBlock.MATERIAL_WALL || blocks[ i ].material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 ) // Only walls, no trap or shield blocks
							if ( blocks[ i ]._shielded === null )
							{
								blocks[ i ]._shielded = this;
								sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
								this._protected_entities.push( blocks[ i ] );
							}
						}
						
						if ( blocks[ i ].GetClass() === 'sdDoor' )
						{
							if ( blocks[ i ]._shielded === null )
							{
								blocks[ i ]._shielded = this;
								sdWorld.SendEffect({ x:this.x, y:this.y, x2:blocks[ i ].x + ( blocks[ i ].hitbox_x2 / 2 ), y2:blocks[ i ].y + ( blocks[ i ].hitbox_y2 / 2 ) , type:sdEffect.TYPE_BEAM, color:'#0ACC0A' });
								this._protected_entities.push( blocks[ i ] );
							}
						}
					}
				}
			}
		}*/
		
		/*if ( Math.abs( this._last_sync_matter - this.matter ) > this.matter_max * 0.01 || this._last_x !== this.x || this._last_y !== this.y )
		{
			this._last_sync_matter = this.matter;
			this._update_version++;
		}*/
		//sdWorld.last_hit_entity = null;
		
		//this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	onMovementInRange( from_entity )
	{
		if ( !sdWorld.is_server )
		return;

		if ( from_entity.is( sdCrystal ) )
		if ( this.matter_crystal < this.matter_crystal_max )
		{
			if ( !from_entity._is_being_removed ) // One per sdRift, also prevent occasional sound flood
			{
				sdSound.PlaySound({ name:'rift_feed3', x:this.x, y:this.y, volume:2, pitch:2 });

				this.matter_crystal = Math.min( this.matter_crystal_max, this.matter_crystal + from_entity.matter_max); // Drain the crystal for it's max value and destroy it
				//this._update_version++;
				from_entity.remove();
			}
		}
	}

	DrawHUD( ctx, attached ) // foreground layer
	{
		if ( this.hea <= 0 )
		return;
	
		sdEntity.Tooltip( ctx,  "Base shielding unit ( " + ~~(this.matter_crystal) + " / " + ~~(this.matter_crystal_max) + " )" );

		let w = 30;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 20, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 20, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
		
		this.DrawConnections( ctx );
	}

	DrawConnections( ctx )
	{
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#ffffff';
		ctx.setLineDash([2, 2]);
		ctx.lineDashOffset = ( sdWorld.time % 1000 ) / 250 * 2;
/*
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
*/
		ctx.beginPath();
		ctx.arc( 0,0, sdBaseShieldingUnit.protect_distance, 0, Math.PI*2 );
		ctx.stroke();
		
		ctx.lineDashOffset = 0;
		ctx.setLineDash([]);
	}

	Draw( ctx, attached )
	{
		//ctx.filter = this.filter;
		
		ctx.drawImageFilterCache( ( this.enabled ) ? sdBaseShieldingUnit.img_unit_repair : sdBaseShieldingUnit.img_unit, - 16, -16, 32, 32 );
		ctx.globalAlpha = 1;
		//ctx.filter = 'none';
	}
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		{
			sdWorld.BasicEntityBreakEffect( this, 10 );
		}
		
		this.onRemoveAsFakeEntity();
	}
	onRemoveAsFakeEntity()
	{
		this.SetShieldState( false );
		
		let id = sdBaseShieldingUnit.all_shield_units.indexOf( this );
		if ( id !== -1 )
		sdBaseShieldingUnit.all_shield_units.splice( id, 1 );
	}
	MeasureMatterCost()
	{
		//return 0; // Hack
		
		return sdWorld.damage_to_matter + 600;
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
			{
				if ( command_name === 'SHIELD_ON' )
				{
					//if ( this.enabled === false )
					{
						if ( this.matter_crystal >= 800 )
						this.SetShieldState( true );
						else
						executer_socket.SDServiceMessage( 'Base shield unit needs at least 800 matter' );
					}
					//else
					//this.SetShieldState();
				}
				if ( command_name === 'SHIELD_OFF' )
				{
					if ( this.enabled === true )
					this.SetShieldState();
				}
				if ( command_name === 'ATTACK' )
				{
					if ( this.enabled )
					{
						this.SetAttackState();
					}
					else
					executer_socket.SDServiceMessage( 'Base shield unit needs to be enabled' );
				}
			}
			else
			executer_socket.SDServiceMessage( 'Base shielding unit is too far' );
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 64 ) )
		{
			if ( sdWorld.my_entity )
			{
				if ( this.enabled === false )
				this.AddContextOption( 'Scan nearby unprotected entities ( 800 matter )', 'SHIELD_ON', [] );
				else
				{
					//this.AddContextOption( 'Refresh scanning entities', 'SHIELD_ON', [] ); // Best to just turn it off then on
					this.AddContextOption( 'Turn the shields off', 'SHIELD_OFF', [] );
					if ( !this.attack_other_units )
					this.AddContextOption( 'Attack nearby shield units', 'ATTACK', [] );
					else
					this.AddContextOption( 'Stop attacking nearby shield units', 'ATTACK', [] );
				}
			}
		}
	}
}
//sdBaseShieldingUnit.init_class();

export default sdBaseShieldingUnit;
