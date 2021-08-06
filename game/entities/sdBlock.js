
import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCrystal from './sdCrystal.js';
import sdVirus from './sdVirus.js';
import sdEffect from './sdEffect.js';
import sdWater from './sdWater.js';
import sdBG from './sdBG.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';

import sdRenderer from '../client/sdRenderer.js';

import sdSound from '../sdSound.js';

class sdBlock extends sdEntity
{
	static init_class()
	{
		sdBlock.img_wall22 = sdWorld.CreateImageFromFile( 'wall_2x2' );
		sdBlock.img_wall21 = sdWorld.CreateImageFromFile( 'wall_2x1' );
		sdBlock.img_wall12 = sdWorld.CreateImageFromFile( 'wall_1x2' );
		sdBlock.img_wall11 = sdWorld.CreateImageFromFile( 'wall_1x1' );
		sdBlock.img_wall05 = sdWorld.CreateImageFromFile( 'wall_half' );
		sdBlock.img_lvl1_wall22 = sdWorld.CreateImageFromFile( 'wall_lvl1_2x2' );//Reinforced walls, level 1
		sdBlock.img_lvl1_wall21 = sdWorld.CreateImageFromFile( 'wall_lvl1_2x1' );
		sdBlock.img_lvl1_wall12 = sdWorld.CreateImageFromFile( 'wall_lvl1_1x2' );
		sdBlock.img_lvl1_wall11 = sdWorld.CreateImageFromFile( 'wall_lvl1_1x1' );
		sdBlock.img_lvl1_wall05 = sdWorld.CreateImageFromFile( 'wall_lvl1_half' );
		
		sdBlock.trapshield_block_health_ratio = 1 / 2;
		sdBlock.trapshield_block_regen_ratio = 3;
		
		sdBlock.img_sharp = sdWorld.CreateImageFromFile( 'sharp2' );
		sdBlock.img_sharp_inactive = sdWorld.CreateImageFromFile( 'sharp2_inactive' );
		
		// Better to keep these same as in sdBG, so 3D effects will work as intended
		sdBlock.MATERIAL_WALL = 0;
		sdBlock.MATERIAL_GROUND = 1;
		sdBlock.MATERIAL_SHARP = 2;
		// 3 platforms bg colored
		sdBlock.MATERIAL_TRAPSHIELD = 4;
		sdBlock.MATERIAL_REINFORCED_WALL_LVL1 = 5;
		
		sdBlock.img_ground11 = sdWorld.CreateImageFromFile( 'ground_1x1' );
		
		sdBlock.img_trapshield11 = sdWorld.CreateImageFromFile( 'trapshield_1x1' );
		sdBlock.img_trapshield05 = sdWorld.CreateImageFromFile( 'trapshield_half' );
		sdBlock.img_trapshield50 = sdWorld.CreateImageFromFile( 'trapshield_half2' );
		
		sdBlock.cracks = [ 
			null,
			sdWorld.CreateImageFromFile( 'cracks1' ),
			sdWorld.CreateImageFromFile( 'cracks2' ),
			sdWorld.CreateImageFromFile( 'cracks3' )
		];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return this.material === sdBlock.MATERIAL_SHARP; }
	
	static Install3DSupport()
	{
		if ( typeof window !== 'undefined' )
		{
			sdBlock.cracks[ 1 ].expand = true;
			sdBlock.cracks[ 2 ].expand = true;
			sdBlock.cracks[ 3 ].expand = true;

			if ( !sdRenderer.ctx )
			debugger; // Later operation won't work without this one
		
			const filter = [ 'sdBlock', 'sdBG' ];

			if ( typeof sdRenderer.ctx.FakeStart !== 'undefined' )
			{
				//sdBlock.prototype.DrawBG = sdBG.prototype.DrawBG;
				
				
				
				sdBlock.prototype.DrawBG = function( ctx, attached )
				{
					if ( this.material === sdBlock.MATERIAL_SHARP || this.material === sdBlock.MATERIAL_TRAPSHIELD )
					return;

					for ( var a = 0; a < this._affected_hash_arrays.length; a++ )
					{
						for ( var i = 0; i < this._affected_hash_arrays[ a ].length; i++ )
						{
							var e = this._affected_hash_arrays[ a ][ i ];
							if ( e instanceof sdBG )
							{
								if ( this.x + this._hitbox_x1 >= e.x + e._hitbox_x1 )
								if ( this.x + this._hitbox_x2 <= e.x + e._hitbox_x2 )
								if ( this.y + this._hitbox_y1 >= e.y + e._hitbox_y1 )
								if ( this.y + this._hitbox_y2 <= e.y + e._hitbox_y2 )
    							return;
	    					}
						}
					}
					
					let visible = false;
					
					if ( !visible )
					if ( sdWorld.camera.y < this.y )
					{
						if ( this._vis_block_top && this._vis_block_top._is_being_removed )
						this._vis_block_top = null;
						
						if ( !this._vis_block_top )
						{
							sdWorld.last_hit_entity = null;
							sdWorld.CheckWallExists( this.x + 8, this.y - 8, null, null, filter );
							if ( this.width > 16 && sdWorld.last_hit_entity )
							{
								sdWorld.last_hit_entity = null;
								sdWorld.CheckWallExists( this.x + 16 + 8, this.y - 8, null, null, filter );
							}
							this._vis_block_top = sdWorld.last_hit_entity;
						}
						
						if ( !this._vis_block_top )
						visible = true;
					}
			
					if ( !visible )
					if ( sdWorld.camera.y > this.y + this.height )
					{
						if ( this._vis_block_bottom && this._vis_block_bottom._is_being_removed )
						this._vis_block_bottom = null;
					
						if ( !this._vis_block_bottom )
						{
							sdWorld.last_hit_entity = null;
							sdWorld.CheckWallExists( this.x + 8, this.y + this.height + 8, null, null, filter );
							if ( this.width > 16 && sdWorld.last_hit_entity )
							{
								sdWorld.last_hit_entity = null;
								sdWorld.CheckWallExists( this.x + 16 + 8, this.y + this.height + 8, null, null, filter );
							}
							this._vis_block_bottom = sdWorld.last_hit_entity;
							/*
							if ( this.material === sdBlock.MATERIAL_WALL )
							{
								if ( this._vis_block_bottom )
								debugger;
							}*/
						}
						
						if ( !this._vis_block_bottom )
						visible = true;
					}
					
					if ( !visible )
					if ( sdWorld.camera.x < this.x )
					{
						if ( this._vis_block_left && this._vis_block_left._is_being_removed )
						this._vis_block_left = null;
					
						if ( !this._vis_block_left )
						{
							sdWorld.last_hit_entity = null;
							sdWorld.CheckWallExists( this.x - 8, this.y + Math.min( 8, this.height / 2 ), null, null, filter ); // Math.min is for half-block support
							if ( this.height > 16 && sdWorld.last_hit_entity )
							{
								sdWorld.last_hit_entity = null;
								sdWorld.CheckWallExists( this.x - 8, this.y + 16 + 8, null, null, filter );
							}
							this._vis_block_left = sdWorld.last_hit_entity;
						}
						
						if ( !this._vis_block_left )
						visible = true;
					}

					if ( !visible )
					if ( sdWorld.camera.x > this.x + this.width )
					{
						if ( this._vis_block_right && this._vis_block_right._is_being_removed )
						this._vis_block_right = null;
					
						if ( !this._vis_block_right )
						{
							sdWorld.last_hit_entity = null;
							sdWorld.CheckWallExists( this.x + this.width + 8, this.y + Math.min( 8, this.height / 2 ), null, null, filter );// Math.min is for half-block support
							if ( this.height > 16 && sdWorld.last_hit_entity )
							{
								sdWorld.last_hit_entity = null;
								sdWorld.CheckWallExists( this.x + this.width + 8, this.y + 16 + 8, null, null, filter );
							}
							this._vis_block_right = sdWorld.last_hit_entity;
						}
						
						if ( !this._vis_block_right )
						visible = true;
					}
					
					//this._vis_back = visible;
					
					if ( visible )
					sdBG.prototype.DrawBG.call( this, ctx, attached );
				};
			}
		}
	}
	
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.width; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.height; }
	
	DrawIn3D()
	{
		if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
		return FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT; 
		else
		return FakeCanvasContext.DRAW_IN_3D_BOX; 
	}
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{
		// Glowing lines prevention
		if ( sdRenderer._visual_settings === 3 )
		return [ 0, 0, 0.002 * Math.abs( sdWorld.camera.y - ( this.y + this.height / 2 ) ) ];
	
		return null;
	}
	
	get hard_collision()
	{ return this.material !== sdBlock.MATERIAL_SHARP; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	//get mass() { return this.material === sdBlock.MATERIAL_GROUND ? 200 : this._reinforced_level > 0 ? 4000 : 400; }
	get mass() { return this.material === sdBlock.MATERIAL_GROUND ? 200 : 400; } // Better to override Impact method for sdBlock to not take damage in case of being reinforced. Or in else case too high mass occasional hits would just damage vehicles too heavily (in case of unintended impacts, like spawning sdHover on top of reinforced walls). Also there might end up being other entities that could damage walls with impact eventually
	
	Impact( vel ) // fall damage basically
	{
		if ( this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 )
		{
		}
		else
		if ( vel > 6 ) // For new mass-based model
		{
			this.Damage( ( vel - 3 ) * 15 );
		}
	}
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;

		dmg = Math.abs( dmg / ( 1 + this._reinforced_level ) ); // Reinforced blocks have damage reduction
		
		if ( this._contains_class === 'sdVirus' || this._contains_class === 'sdQuickie' || this._contains_class === 'sdAsp' )
		dmg = this._hea + 1;
		
		if ( this._hea > 0 )
		{
			if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
			{
				sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:1 });
			}
			
			if ( this._shielded === null || dmg === Infinity || this._shielded._is_being_removed || !this._shielded.enabled || !sdWorld.inDist2D_Boolean( this.x, this.y, this._shielded.x, this._shielded.y, sdBaseShieldingUnit.protect_distance ) )
			this._hea -= dmg;
			else
			{
				if ( initiator )
				if ( initiator._socket )
				if ( initiator._last_damage_upg_complain < sdWorld.time - 1000 * 10 )
				{
					initiator._last_damage_upg_complain = sdWorld.time;
					if ( Math.random() < 0.5 )
					initiator.Say( 'This entity is protected by a base shielding unit' );
					else
					initiator.Say( 'A base shielding unit is protecting this' );
				}

				sdSound.PlaySound({ name:'shield', x:this.x, y:this.y, volume:0.2 });
				this._shielded.matter_crystal = Math.max( 0, this._shielded.matter_crystal - dmg * sdBaseShieldingUnit.regen_matter_cost_per_1_hp );

				if ( this._shielded.matter_crystal >= 50000 )
				{
					if ( initiator )
					{
						if ( !sdWorld.inDist2D_Boolean( initiator.x, initiator.y, this._shielded.x, this._shielded.y, sdBaseShieldingUnit.protect_distance - 64 ) ) // Check if it is far enough from the shield to prevent players in base take damage
						{
							initiator.Damage( 5 );
							sdWorld.SendEffect({ x:this._shielded.x, y:this._shielded.y, x2:this.x + ( this.hitbox_x2 / 2 ), y2:this.y + ( this.hitbox_y2 / 2 ), type:sdEffect.TYPE_BEAM, color:'#f9e853' });
							sdWorld.SendEffect({ x:this.x + ( this.hitbox_x2 / 2 ), y:this.y + ( this.hitbox_y2 / 2 ), x2:initiator.x, y2:initiator.y, type:sdEffect.TYPE_BEAM, color:'#f9e853' });
						}
					}
				}
			}

			this.HandleDestructionUpdate();
			
			if ( this.material === sdBlock.MATERIAL_TRAPSHIELD ) // Instant regeneration
			{
				this._regen_timeout = 0;
			}
			else
			{
				if ( this.material === sdBlock.MATERIAL_GROUND )
				this._regen_timeout = 120; // Longer so digging can be less accurate towards specific block
				else
				this._regen_timeout = 60;
			}

			if ( this._hea <= 0 )
			{
				{

					if ( this._contains_class )
					{
						if ( this._contains_class === 'sdSandWorm' )
						{
							let map = {};
							let blocks_near = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, 16, null, [ 'sdBlock' ] );

							for ( let i = 0; i < blocks_near.length; i++ )
							map[ ( blocks_near[ i ].x - this.x ) / 16 + ':' + ( blocks_near[ i ].y - this.y ) / 16 ] = blocks_near[ i ];

							done:
							for ( let xx = -1; xx <= 0; xx++ )
							for ( let yy = -1; yy <= 0; yy++ )
							{
								if ( map[ ( xx + 0 ) + ':' + ( yy + 0 ) ] )
								if ( map[ ( xx + 1 ) + ':' + ( yy + 0 ) ] )
								if ( map[ ( xx + 0 ) + ':' + ( yy + 1 ) ] )
								if ( map[ ( xx + 1 ) + ':' + ( yy + 1 ) ] )
								{
									let ent = new sdWorld.entity_classes[ this._contains_class ]({ x: this.x + xx * 16, y: this.y + yy * 16 });
									sdEntity.entities.push( ent );
									sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible


									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ]._contains_class = null;

									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ].Damage( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ].Damage( Infinity );
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ].Damage( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ].Damage( Infinity );

									break done;
								}
							}
						}
						else
						{
							let parts = this._contains_class.split( '.' );
							this._contains_class = parts[ 0 ];

							let params = { x: this.x + this.width / 2, y: this.y + this.height / 2, tag:( parts.length > 1 )?parts[1]:null };

							if ( this._contains_class_params )
							{
								for ( let i in this._contains_class_params )
								params[ i ] = this._contains_class_params[ i ];
							}

							let ent = new sdWorld.entity_classes[ this._contains_class ]( params );
							sdEntity.entities.push( ent );

							sdWorld.UpdateHashPosition( ent, false ); // Optional, but will make it visible as early as possible
						}
					}
					
				}
				this.remove();
			}
		}
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	constructor( params )
	{
		super( params );
		
		if ( !sdWorld.is_server )
		{
			// Debugging NaN x/y of broken particles
			this._stack_trace = globalThis.getStackTrace();
		}
		
		this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdBlock.MATERIAL_WALL;
		
		this._hmax = 550 * ( this.width / 32 * this.height / 32 ) * ( this.material === sdBlock.MATERIAL_GROUND ? 0.8 : 1 );
		
		if ( this.material === sdBlock.MATERIAL_TRAPSHIELD ) // Less health, but regeneration will have no delay
		{
			this._hmax *= sdBlock.trapshield_block_health_ratio;
		}
		
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		this._reinforced_level = params._reinforced_level || 0;
		this._shielded = null; // Is this entity protected by a base defense unit?
		
		this._contains_class = params.contains_class || null;
		this._contains_class_params = null; // Parameters that are passed to this._contains_class entity
		//this._hidden_crystal = params.hidden_crystal || false;
		//this._hidden_virus = params.hidden_virus || false;
		
		this.filter = params.filter || '';
		
		this._natural = params.natural === true;
		
		this._plants = params.plants || null; // Array of _net_id-s actually
		
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			this._owner = params.owner || null; // Useful in case of sharp trap
			this.spikes_ani = 0; // 30 when somebody near, 15...30 - visible spikes, 0...15 - not visible spikes
		}
		
		this.destruction_frame = 0;
		this.HandleDestructionUpdate();
		
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		
		/*if ( sdWorld.is_server )
		for ( var i = 0; i < sdEntity.entities.length; i++ )
		{
			if ( sdEntity.entities[ i ].x === params.x )
			if ( sdEntity.entities[ i ].y === params.y )
			{
				debugger;
				throw new Error('Double wall bug detected');
			}
		}*/
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_plants' || prop === '_contains_class_params' || prop === '_shielded' );
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter * (1 + ( 2 * this._reinforced_level ) ) * ( this.material === sdBlock.MATERIAL_TRAPSHIELD ? 4.5 : 1 ) + ( this.material === sdBlock.MATERIAL_SHARP ? 30 : 0 );
	}
	//RequireSpawnAlign() 
	//{ return true; }
	
	get spawn_align_x(){ return Math.min( this.width, 16 ); };
	get spawn_align_y(){ return Math.min( this.height, 16 ); };
	
	HandleDestructionUpdate()
	{
		let old_destruction_frame = this.destruction_frame;
		
		if ( this._hea > this._hmax / 4 * 3 )
		this.destruction_frame = 0;
		else
		if ( this._hea > this._hmax / 4 * 2 )
		this.destruction_frame = 1;
		else
		if ( this._hea > this._hmax / 4 * 1 )
		this.destruction_frame = 2;
		else
		this.destruction_frame = 3;
		
		if ( this.destruction_frame !== old_destruction_frame )
		this._update_version++;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		//if ( this._reinforced_level > 0 )
		//this._reinforced_level = 0;
		//if ( this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 )
		//this.material = sdBlock.MATERIAL_WALL;
		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
				this._hea = Math.min( this._hea + GSPEED * sdBlock.trapshield_block_regen_ratio, this._hmax );
				else
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
				
				this.HandleDestructionUpdate();
			}
		}
		
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			if ( this.spikes_ani > 0 )
			{
				this.spikes_ani = Math.max( 0, this.spikes_ani - GSPEED );
				this._update_version++;
			}
			else
			if ( this._hea === this._hmax )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
		else
		if ( this._hea === this._hmax )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		if ( this.material === sdBlock.MATERIAL_SHARP )
		if ( from_entity.IsBGEntity() === this.IsBGEntity() )
		if ( from_entity.GetClass() !== 'sdGun' || from_entity._held_by === null ) // Do not react to held guns
		if ( !from_entity.driver_of )
		{
			if ( this.spikes_ani === 0 )
			//if ( sdWorld.GetComsNear( this.x + this.width / 2, this.y + this.height / 2, null, from_entity._net_id, true ).length === 0 && sdWorld.GetComsNear( this.x + this.width / 2, this.y + this.height / 2, null, from_entity.GetClass(), true ).length === 0 )
			{
				this.spikes_ani = 30;
				this._update_version++;
				
				sdWorld.SendEffect({ x:from_entity.x, y:from_entity.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });
				
				if ( ( from_entity._reinforced_level || 0 ) === 0 )
				from_entity.Damage( 100, this._owner );
				
				this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			}
		}
	}
	Draw( ctx, attached )
	{
		var w = this.width;
		var h = this.height;
		
		ctx.filter = this.filter;//'hue-rotate(90deg)';
		
		let lumes = sdWorld.GetClientSideGlowReceived( this.x + w / 2, this.y + h / 2, this );
		if ( lumes > 0 )
		ctx.filter = ctx.filter + 'brightness('+(1+lumes)+')';

		
		
		//ctx.filter = 'hsl(120,100%,25%)';
		
		if ( this.material === sdBlock.MATERIAL_GROUND )
		{
			ctx.drawImageFilterCache( sdBlock.img_ground11, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_WALL )
		{
			if ( w === 32 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_wall22, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 32 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_wall21, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_wall12, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_wall11, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 8 )
			ctx.drawImageFilterCache( sdBlock.img_wall05, 0, 0, w,h, 0,0, w,h );
			else
			ctx.drawImageFilterCache( sdBlock.img_wall22, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 )
		{
			if ( w === 32 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_lvl1_wall22, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 32 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_lvl1_wall21, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_lvl1_wall12, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_lvl1_wall11, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 8 )
			ctx.drawImageFilterCache( sdBlock.img_lvl1_wall05, 0, 0, w,h, 0,0, w,h );
			else
			ctx.drawImageFilterCache( sdBlock.img_lvl1_wall22, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			ctx.drawImageFilterCache( ( this.spikes_ani < 15 ) ? sdBlock.img_sharp_inactive : sdBlock.img_sharp, 0, 0, w,h, 0,0, w,h );
		}
		else
		{
			if ( w === 16 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_trapshield11, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 8 )
			ctx.drawImageFilterCache( sdBlock.img_trapshield05, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 8 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_trapshield50, 0, 0, w,h, 0,0, w,h );
			else
			ctx.drawImageFilterCache( sdBlock.img_trapshield11, 0, 0, w,h, 0,0, w,h );
		}

		ctx.filter = 'none';
		
		if ( sdBlock.cracks[ this.destruction_frame ] !== null )
		ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], 0, 0, w,h, 0,0, w,h );
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( sdWorld.is_server )
		{

			let nears = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, Math.max( this.width, this.height ) / 2 + 16 );
			for ( let i = 0; i < nears.length; i++ )
			if ( nears[ i ] instanceof sdWater )
			{
				nears[ i ].AwakeSelfAndNear();
				//nears[ i ]._sleep_tim = sdWater.sleep_tim_max;
			}

			if ( this.material === sdBlock.MATERIAL_GROUND )
			{
				let new_bg = new sdBG({ x:this.x, y:this.y, width:this.width, height:this.height, material:sdBG.MATERIAL_GROUND, filter:this.filter + ' brightness(0.5)' });
				if ( new_bg.CanMoveWithoutOverlap( this.x, this.y, 1 ) )
				{
					sdEntity.entities.push( new_bg );
				}
				else
				{
					new_bg.remove();
					new_bg._remove();
				}
			}
			
			if ( this._plants )
			{
				for ( let i = 0; i < this._plants.length; i++ )
				{
					//let ent = sdEntity.entities_by_net_id_cache[ this._plants[ i ] ];
					let ent = sdEntity.entities_by_net_id_cache_map.get( this._plants[ i ] );
					
					if ( ent )
					ent.remove();
				}
				
				this._plants = null;
			}
		}
		else
		{
			if ( isNaN( this.x ) || isNaN( this.y ) )
            {
            	console.log( 'sdBlock with broken x/y coordinates was spawned here: ' + this._stack_trace );
            	debugger;
				return;
            
			}
			if ( this.material !== sdBlock.MATERIAL_TRAPSHIELD )
			if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
			if ( this._broken )
			{
				sdSound.PlaySound({ name:'block4', 
					x:this.x + this.width / 2, 
					y:this.y + this.height / 2, 
					volume:( this.width / 32 ) * ( this.height / 32 ), 
					pitch: ( this.material === sdBlock.MATERIAL_WALL || this.material === sdBlock.MATERIAL_SHARP ) ? 1 : 1.5,
					_server_allowed:true });

				let x,y,a,s;
				let step_size = 4;
				for ( x = step_size / 2; x < this.width; x += step_size )
				for ( y = step_size / 2; y < this.height; y += step_size )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;
					let ent = new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s });
					sdEntity.entities.push( ent );
				}
			}
		}
	}
}
//sdBlock.init_class();

export default sdBlock;