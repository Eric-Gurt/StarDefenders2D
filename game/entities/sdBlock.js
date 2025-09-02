
/* global FakeCanvasContext, Infinity */

import sdWorld from '../sdWorld.js';
import sdEntity from './sdEntity.js';
import sdCrystal from './sdCrystal.js';
import sdVirus from './sdVirus.js';
import sdEffect from './sdEffect.js';
import sdWater from './sdWater.js';
import sdBG from './sdBG.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdCharacter from './sdCharacter.js';
import sdSandWorm from './sdSandWorm.js';
import sdTimer from './sdTimer.js';
import sdCamera from './sdCamera.js';
import sdDoor from './sdDoor.js';
import sdFleshGrabber from './sdFleshGrabber.js';
import sdBot from './sdBot.js';
import sdStatusEffect from './sdStatusEffect.js';



import sdRenderer from '../client/sdRenderer.js';
import sdBitmap from '../client/sdBitmap.js';

import sdSound from '../sdSound.js';

class sdBlock extends sdEntity
{
	static init_class()
	{
		/*sdBlock.img_wall22 = sdWorld.CreateImageFromFile( 'wall_2x2' );
		sdBlock.img_wall21 = sdWorld.CreateImageFromFile( 'wall_2x1' );
		sdBlock.img_wall12 = sdWorld.CreateImageFromFile( 'wall_1x2' );
		sdBlock.img_wall11 = sdWorld.CreateImageFromFile( 'wall_1x1' );
		sdBlock.img_wall05 = sdWorld.CreateImageFromFile( 'wall_half' );*/
		sdBlock.img_lvl1_wall22 = sdWorld.CreateImageFromFile( 'wall_lvl1_2x2' );//Reinforced walls, level 1
		sdBlock.img_lvl1_wall21 = sdWorld.CreateImageFromFile( 'wall_lvl1_2x1' );
		sdBlock.img_lvl1_wall12 = sdWorld.CreateImageFromFile( 'wall_lvl1_1x2' );
		sdBlock.img_lvl1_wall11 = sdWorld.CreateImageFromFile( 'wall_lvl1_1x1' );
		sdBlock.img_lvl1_wall05 = sdWorld.CreateImageFromFile( 'wall_lvl1_half' );
		sdBlock.img_lvl2_wall22 = sdWorld.CreateImageFromFile( 'wall_lvl2_2x2' );//Reinforced walls, level 2
		sdBlock.img_lvl2_wall21 = sdWorld.CreateImageFromFile( 'wall_lvl2_2x1' );
		sdBlock.img_lvl2_wall12 = sdWorld.CreateImageFromFile( 'wall_lvl2_1x2' );
		sdBlock.img_lvl2_wall11 = sdWorld.CreateImageFromFile( 'wall_lvl2_1x1' );
		sdBlock.img_lvl2_wall05 = sdWorld.CreateImageFromFile( 'wall_lvl2_half' );		
		sdBlock.img_rock = sdWorld.CreateImageFromFile( 'wall_rock' );

		//sdBlock.img_sand = sdWorld.CreateImageFromFile( 'snow_wall' ); // Molis
		sdBlock.img_sand = sdWorld.CreateImageFromFile( 'wall_sand' ); // EG
		
		
		
		// Version 2, here we will create walls automatically, from Grid-9 sliceable sources (so we could make nearly infinite variety of walls that meet our needs)
		//sdBlock.img_wall = sdWorld.CreateImageFromFile( 'wall' );
		//sdBlock.img_wall_portal = sdWorld.CreateImageFromFile( 'wall_portal' );
		//sdBlock.img_wall_vertical_test = sdWorld.CreateImageFromFile( 'wall -> Grid9( 4, 8, 16 )' );//sdBitmap.ProduceGrid9BlockTexture( sdBlock.img_wall, 4, 8, 16 );
		//sdBlock.img_wall_vertical_test = sdWorld.CreateImageFromFile( 'wall -> Grid9( 4, 8, 8 )' );//sdBitmap.ProduceGrid9BlockTexture( sdBlock.img_wall, 4, 8, 16 );

		function SpawnSizes( texture_id, base_filename, corner_size )
		{
			let cases = [
				[ 32, 32 ],
				[ 32, 16 ],
				[ 16, 32 ],
				[ 16, 16 ],
				[ 16, 8 ],
				[ 8, 16 ],
				[ 8, 8 ],
				[ 32, 8 ],
				[ 8, 32 ],
				
				// Special ones for arena mode
				[ 24, 8 ],
				[ 8, 24 ],
				[ 24, 24 ],
				[ 16, 24 ],
				[ 24, 16 ],
				[ 24, 32 ],
				[ 32, 24 ]
			];
			
			sdBlock.textures[ texture_id ] = {};
			
			for ( let i = 0; i < cases.length; i++ )
			{
				let w = cases[i][0];
				let h = cases[i][1];
				
				let img = sdWorld.CreateImageFromFile( `${base_filename} -> Grid9( ${corner_size}, ${w}, ${h} )` );
				
				// Netbeans syntax highlight bug-fix
				//let e = eval;
				//e( evaluted_variable_name.split('...').join( w + 'x' + h ) + ` = img` );
				
				//sdBlock[ evaluted_variable_name.split('...').join( w + 'x' + h ).split( 'sdBlock.' ).join('') ] = img;
				sdBlock.textures[ texture_id ][ w + 'x' + h ] = img;
			}
		}
		
		sdBlock.textures = [];
		
		let tc = 0;
		SpawnSizes( sdBlock.TEXTURE_ID_WALL = tc++,					'wall',						4 );
		SpawnSizes( sdBlock.TEXTURE_ID_PORTAL = tc++,				'wall_portal',				5 );
		SpawnSizes( sdBlock.TEXTURE_ID_CAGE = tc++,					'wall_cage',				0 );
		SpawnSizes( sdBlock.TEXTURE_ID_GLASS = tc++,				'wall_glass',				1 );
		SpawnSizes( sdBlock.TEXTURE_ID_GREY = tc++,					'wall_grey',				2 );
		SpawnSizes( sdBlock.TEXTURE_ID_REINFORCED_LVL1 = tc++,		'wall_lvl1_2x2',			3 );
		SpawnSizes( sdBlock.TEXTURE_ID_REINFORCED_LVL2 = tc++,		'wall_lvl2_2x2',			3 );
		SpawnSizes( sdBlock.TEXTURE_ID_WHITE_BRICK = tc++,			'wall_white_brick',			0 );
		SpawnSizes( sdBlock.TEXTURE_ID_DARK_BRICK = tc++,			'wall_dark_brick',			0 );
		SpawnSizes( sdBlock.TEXTURE_ID_FULL_WHITE_BRICK = tc++,		'wall_full_bright_brick',	0 );
		SpawnSizes( sdBlock.TEXTURE_ID_TZYRG_WALL = tc++,			'wall_tzyrg',				0 );
		
		
		// TODO: Rework other walls like this. Also - important to standartise all reinforced blocks as well as extra reinforcements through items
		

		sdBlock.trapshield_block_health_ratio = 1 / 2;
		sdBlock.trapshield_block_regen_ratio = 3;
		
		sdBlock.img_sharp2 = sdWorld.CreateImageFromFile( 'sharp2' );
		sdBlock.img_sharp2_inactive = sdWorld.CreateImageFromFile( 'sharp2_inactive' );
		sdBlock.img_sharp3 = sdWorld.CreateImageFromFile( 'sharp3' );
		sdBlock.img_sharp3_inactive = sdWorld.CreateImageFromFile( 'sharp3_inactive' );
		
		// Better to keep these same as in sdBG, so 3D effects will work as intended
		sdBlock.MATERIAL_WALL = 0;
		sdBlock.MATERIAL_GROUND = 1;
		sdBlock.MATERIAL_SHARP = 2;
		// 3 platforms bg colored
		sdBlock.MATERIAL_TRAPSHIELD = 4;
		sdBlock.MATERIAL_REINFORCED_WALL_LVL1 = 5;
		sdBlock.MATERIAL_REINFORCED_WALL_LVL2 = 6;
		sdBlock.MATERIAL_CORRUPTION = 7;
		sdBlock.MATERIAL_CRYSTAL_SHARDS = 8;
		sdBlock.MATERIAL_FLESH = 9;
		//sdBlock.MATERIAL_ROCK = 10;
		//sdBlock.MATERIAL_SAND = 11;
		sdBlock.MATERIAL_ROCK = 10;
		sdBlock.MATERIAL_SAND = 11;
		sdBlock.MATERIAL_BUGGED_CHUNK = 12;
		sdBlock.MATERIAL_ANCIENT_WALL = 13;
		sdBlock.MATERIAL_SNOW = 14; // Same as sand just does not regenerate plants on itself
		sdBlock.MATERIAL_PRESET_SPECIAL_ANY_GROUND = 15; // Marks area within preset that won't be touched by preset logic, could be used to mark certain location as more or less suitable for preset spawn
		sdBlock.MATERIAL_PRESET_SPECIAL_FORCE_AIR = 16; // Forcefully removed air blocks for loaded presets
		
		//sdBlock.img_ground11 = sdWorld.CreateImageFromFile( 'ground_1x1' );
		//sdBlock.img_ground44 = sdWorld.CreateImageFromFile( 'ground_4x4' );
		sdBlock.img_ground88 = sdWorld.CreateImageFromFile( 'ground_8x8' );
		
		sdBlock.img_corruption = sdWorld.CreateImageFromFile( 'corruption' );
		sdBlock.img_crystal_shards = sdWorld.CreateImageFromFile( 'crystal_shards' );
		sdBlock.img_flesh = sdWorld.CreateImageFromFile( 'flesh5' );
		sdBlock.img_ancient_wall = sdWorld.CreateImageFromFile( 'wall_ancient' ); // These behave like dirt/flesh/etc... rather than a wall.
		
		sdBlock.img_trapshield11 = sdWorld.CreateImageFromFile( 'trapshield_1x1' );
		sdBlock.img_trapshield05 = sdWorld.CreateImageFromFile( 'trapshield_half' );
		sdBlock.img_trapshield50 = sdWorld.CreateImageFromFile( 'trapshield_half2' );
		
		sdBlock.img_preset_ground = sdWorld.CreateImageFromFile( 'preset_ground' );
		sdBlock.img_preset_air = sdWorld.CreateImageFromFile( 'preset_air' );
		
		sdBlock.cracks = [ 
			null,
			sdWorld.CreateImageFromFile( 'cracks1' ),
			sdWorld.CreateImageFromFile( 'cracks2' ),
			sdWorld.CreateImageFromFile( 'cracks3' )
		];

		/*sdBlock.metal_reinforces = [ 
			null,
			sdWorld.CreateImageFromFile( 'metal_reinforced1' ),
			sdWorld.CreateImageFromFile( 'metal_reinforced2' ),
			sdWorld.CreateImageFromFile( 'metal_reinforced3' ),
			sdWorld.CreateImageFromFile( 'metal_reinforced4' )
		];*/
		
		sdBlock.max_corruption_rank = 12; // 12
		sdBlock.max_flesh_rank = 6; // 6
		sdBlock.max_flesh_rank_asteroid = 12;
		
		sdBlock.natural_blocks_total = 0; // Inaccurate in open-world case
		
		sdBlock.as_class_list = [ 'sdBlock' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	
	DoesRegenerate()
	{
		return ( this._merged === false && ( 
				this.material === sdBlock.MATERIAL_GROUND || 
				this.material === sdBlock.MATERIAL_ROCK || 
				this.material === sdBlock.MATERIAL_SAND ||
				this.material === sdBlock.MATERIAL_CORRUPTION ||
				this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS ||
				this.material === sdBlock.MATERIAL_FLESH 
		) );
	}
	DoesRegenerateButDoesntDamage()
	{
		return ( this.DoesRegenerate() && this.material !== sdBlock.MATERIAL_CORRUPTION );
	}
	IsDefaultGround()
	{
		return ( 
				this.material === sdBlock.MATERIAL_GROUND || 
				this.material === sdBlock.MATERIAL_ROCK || 
				this.material === sdBlock.MATERIAL_SAND ||
				this.material === sdBlock.MATERIAL_SNOW ||
				this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS );
	}
	
	IsEarlyThreat() // Used during entity build & placement logic - basically turrets, barrels, bombs should have IsEarlyThreat as true or else players would be able to spawn turrets through closed doors & walls. Coms considered as threat as well because their spawn can cause damage to other players
	{ return this.material === sdBlock.MATERIAL_SHARP; }
	
	IsPartiallyTransparent()
	{
		if ( this.material === sdBlock.MATERIAL_SHARP || this.material === sdBlock.MATERIAL_TRAPSHIELD )
		return true;
	
		if ( this.DrawIn3D() === FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT )
		return true;
	
		if ( this.texture_id === sdBlock.TEXTURE_ID_CAGE )
		return true;

		return false;
	}
	IsLetsLiquidsThrough()
	{
		if ( this.material === sdBlock.MATERIAL_SHARP )
		return true;
	
		if ( this.texture_id === sdBlock.TEXTURE_ID_CAGE )
		return true;

		return false;
	}
	
	/*Install3DSupport()
	{
		this._box_cap_rethink_next = 0;
		this._box_cap_left = null;
		this._box_cap_right = null;
		this._box_cap_top = null;
		this._box_cap_bottom = null;
		
		return;
		
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
					
					if ( this.IsPartiallyTransparent() )
					return;

					let visible = true;
					
					if ( visible )
					{
						if ( !this._client_side_bg )
						{
							this._client_side_bg = Object.assign( {}, this );
							
							this._client_side_bg.texture_id = sdBG.TEXTURE_PLATFORMS;
							
							if ( this._client_side_bg.material === sdBlock.MATERIAL_GROUND )
							{
								// Keep color for grass/ground only
							}
							else
							this._client_side_bg.filter = 'none';
						}
						sdBG.prototype.DrawBG.call( this._client_side_bg, ctx, attached );
					}
				};
			}
		}
	}*/
	
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return this.width; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return this.height; }
	
	get title()
	{
		let mat = ( this.material || 0 );
		let tex = ( this.texture_id || 0 );
	
		if ( tex === sdBlock.TEXTURE_ID_GLASS )
		return 'Glass';
		
		if ( tex === sdBlock.TEXTURE_ID_CAGE )
		return 'Cage';
	
		if ( mat === sdBlock.MATERIAL_WALL )
		return 'Wall';
	
		if ( mat === sdBlock.MATERIAL_SHARP )
		return 'Trap';
	
		if ( mat === sdBlock.MATERIAL_TRAPSHIELD )
		return 'Shield';
	
		if ( mat === sdBlock.MATERIAL_ROCK )
		return 'Rock';
	
		if ( mat === sdBlock.MATERIAL_SAND )
		return 'Sand';
	
		if ( mat === sdBlock.MATERIAL_FLESH )
		return 'Flesh';
	
		if ( mat === sdBlock.MATERIAL_SNOW )
		return 'Snow';
	
		if ( mat === sdBlock.MATERIAL_CORRUPTION )
		return 'Corruption';
	
		return 'Ground';
	}
	
	DrawIn3D()
	{
		if ( this.material === sdBlock.MATERIAL_TRAPSHIELD || this.texture_id === sdBlock.TEXTURE_ID_GLASS )
		return FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT; 
		else
		return FakeCanvasContext.DRAW_IN_3D_BOX; 
	}
	
	ObjectOffset3D( layer ) // -1 for BG, 0 for normal, 1 for FG
	{
		// Glowing lines prevention
		//if ( sdRenderer._visual_settings === 3 )
		//return [ 0, 0, 0.002 * Math.abs( sdWorld.camera.y - ( this.y + this.height / 2 ) ) ];
	
		return null;
	}
	
	get hard_collision()
	{ return this.material !== sdBlock.MATERIAL_SHARP && this.material !== sdBlock.MATERIAL_PRESET_SPECIAL_FORCE_AIR; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return true; }
	
	//get mass() { return this.material === sdBlock.MATERIAL_GROUND ? 200 : this._reinforced_level > 0 ? 4000 : 400; }
	get mass() { return this.material === sdBlock.MATERIAL_GROUND ? 200 : 400; } // Better to override Impact method for sdBlock to not take damage in case of being reinforced. Or in else case too high mass occasional hits would just damage vehicles too heavily (in case of unintended impacts, like spawning sdHover on top of reinforced walls). Also there might end up being other entities that could damage walls with impact eventually
	
	Impact( vel, initiator=null ) // fall damage basically
	{
		/*if ( this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
		{
		}
		else*/
		if ( vel > 6 ) // For new mass-based model
		{
			this.DamageWithEffect( ( vel - 3 ) * 15, initiator );
		}
	}
	PrecieseHitDetection( x, y, bullet=null ) // Teleports use this to prevent bullets from hitting them like they do. Only ever used by bullets, as a second rule after box-like hit detection. It can make hitting entities past outer bounding box very inaccurate
	{
		if ( this.texture_id === sdBlock.TEXTURE_ID_CAGE )
		{
			x = sdWorld.limit( 0, x - this.x, this.width ) + this.x;
			y = sdWorld.limit( 0, y - this.y, this.height ) + this.y;
			
			let xx = ( x - this.x ) % 8;
			let yy = ( y - this.y ) % 8;
			return ( ( xx <= 1 + bullet._hitbox_x2 || xx >= 7 + bullet._hitbox_x1 ) && ( yy <= 1 + bullet._hitbox_y2 || yy >= 7 + bullet._hitbox_y1 ) );
		}
		
		return true;
	}
	Damage( dmg, initiator=null, headshot=false, affects_armor=true )
	{
		if ( !sdWorld.is_server )
		return;
	
		if ( this._merged )
		{
			if ( this.UnmergeBlocks().length > 0 ) // Unmerged blocks?
			return;
			
			// TODO: Deal damage to the block closest to initiator after unmerging
		}

		// Uses health scale instead now
		if ( affects_armor )
		dmg = Math.abs( dmg / ( 1 + this._reinforced_level ) ); // Reinforced blocks have damage reduction
		
		if ( this._contains_class === 'sdVirus' || this._contains_class === 'sdQuickie' || this._contains_class === 'sdFaceCrab' || this._contains_class === 'sdAsp' || this._contains_class === 'sdBiter' || this._contains_class === 'weak_ground' )
		dmg = this._hea + 1;
		
		if ( this._hea > 0 )
		{
			if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
			{
				if ( sdWorld.time > this._last_damage + 150 )
				{
					this._last_damage = sdWorld.time;
					sdSound.PlaySound({ name:'shield', x:this.x+this.width/2, y:this.y+this.height/2, volume:1 });
					
					//if ( initiator )
					//sdWorld.SendEffect({ x:initiator.x, y:initiator.y, type:sdEffect.TYPE_SHIELD });
				}
			}
			
			//if ( this._shielded === null || dmg === Infinity || this._shielded._is_being_removed || !this._shielded.enabled || !sdWorld.inDist2D_Boolean( this.x, this.y, this._shielded.x, this._shielded.y, sdBaseShieldingUnit.protect_distance_stretch ) )
			if ( dmg = sdBaseShieldingUnit.TestIfDamageShouldPass( this, dmg, initiator ) )
			{
				this._hea -= dmg;
			}
			/*else
			{
				this._shielded.ProtectedEntityAttacked( this, dmg, initiator );
			}*/

			this.HandleDestructionUpdate();
			
			if ( this.material === sdBlock.MATERIAL_TRAPSHIELD && ( !this._shielded || this._shielded._is_being_removed || !this._shielded.enabled ) ) // Instant regeneration, though shielded shields will have regeneration cooldown
			{
				this._regen_timeout = 0;
			}
			else
			{
				//if ( this.material === sdBlock.MATERIAL_GROUND || this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS )
				if ( this.DoesRegenerate() )
				this._regen_timeout = 120; // Longer so digging can be less accurate towards specific block
				else
				this._regen_timeout = 60;
			}

			if ( this._hea <= 0 )
			{
				if ( this.material === sdBlock.MATERIAL_CORRUPTION )
				{
					this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );
				}

				if ( this.material === sdBlock.MATERIAL_FLESH )
				{
					this.GiveScoreToLastAttacker( sdEntity.SCORE_REWARD_EASY_MOB );
				}

				if ( this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS )
				{
					if ( this._contains_class === 'sdCrystal' )
					{
						sdEntity.Create( sdCrystal, { x:this.x+this.width/2, y:this.y+this.height/2, type:sdCrystal.TYPE_CRYSTAL, matter_max:Math.pow( 2, this.p )*40 } );
						this._contains_class = null;
					}
					else
					{
						sdWorld.DropShards( this.x, this.y, 0, 0, 
							10,
							Math.pow( 2, this.p ),
							8
						); // Spawn some shards
					}
				}
				if ( this.material === sdBlock.MATERIAL_ANCIENT_WALL ) // Ancient walls chain explode, they explode for more than 200 damage
				{
					sdWorld.SendEffect({ 
					x:this.x + 8, 
					y:this.y + 8, 
					radius:16, // 80 was too much?
					damage_scale: 12,
					type:sdEffect.TYPE_EXPLOSION, 
					owner:this,
					color:'#3BD930' 
				});
				}
				
				{
					if ( this._contains_class && typeof this._contains_class === 'string' )
					{
						//this._contains_class = 'sdSandWorm'; // Hack
					
						let ent;
					
						if ( this._contains_class === 'sdSandWorm' || this._contains_class === 'sdSandWorm.corrupted' )
						{
							let map = {};
							let blocks_near = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, 16, null, [ 'sdBlock' ] );

							for ( let i = 0; i < blocks_near.length; i++ )
							if ( blocks_near[ i ]._natural || ( this.material === sdBlock.MATERIAL_CORRUPTION && this._contains_class === 'sdSandWorm.corrupted' && blocks_near[ i ].material === sdBlock.MATERIAL_CORRUPTION ) )
							if ( !blocks_near[ i ]._is_being_removed )
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
									let parts = this._contains_class.split( '.' );
									this._contains_class = parts[ 0 ];

									let sc = Math.min( 2, Math.max( 0.6, this._hmax / 440 ) );
									let params = { x: this.x + xx * 16 + 16, y: this.y + yy * 16 + 16, scale: sc, tag:( parts.length > 1 )?parts[1]:null };

									if ( this._contains_class_params )
									{
										for ( let i in this._contains_class_params )
										params[ i ] = this._contains_class_params[ i ];
									}
									ent = new sdWorld.entity_classes[ this._contains_class ]( params );
									if ( parts.length < 2 ) // If worm is not corrupted, etc, spawn regular worm types
									ent.kind = Math.random() < 0.15 ? 1 : 0; // 15% chance for the worm to be spiky
									sdEntity.entities.push( ent );
									sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs


									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ]._contains_class = null;

									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									
									//setTimeout(()=>{ent.DamageWithEffect( Infinity )}, 2000 ); // Hack

									break done;
								}
							}
						}
						else
						if ( Math.random() < 0.1 && ( this._contains_class === 'sdCrystal' || this._contains_class === 'sdCrystal.deep' || this._contains_class === 'sdCrystal.crab' || this._contains_class === 'sdCrystal.deep_crab') ) // Big crystals, I feel like I'm butchering the code at the moment - Booraz
						{
							let map = {};
							let blocks_near = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, 16, null, [ 'sdBlock' ] );

							for ( let i = 0; i < blocks_near.length; i++ )
							if ( blocks_near[ i ]._natural )
							if ( !blocks_near[ i ]._is_being_removed )
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
									let parts = this._contains_class.split( '.' );
									this._contains_class = parts[ 0 ];

									let params = { x: this.x + xx * 16 + 16, y: this.y + yy * 16 + 16, type: ( parts.length > 1 && parts[1].indexOf( 'crab' ) !== -1 ) ? sdCrystal.TYPE_CRYSTAL_CRAB_BIG : sdCrystal.TYPE_CRYSTAL_BIG, tag:( parts.length > 1 )?parts[1]:null };

									if ( this._contains_class_params )
									{
										for ( let i in this._contains_class_params )
										params[ i ] = this._contains_class_params[ i ];
									}

									ent = new sdWorld.entity_classes[ this._contains_class ]( params );
									sdEntity.entities.push( ent );
									sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs


									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ]._contains_class = null;

									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									
									//setTimeout(()=>{ent.DamageWithEffect( Infinity )}, 2000 ); // Hack

									break done;
								}
							}
						}
						else
						if ( this._contains_class === 'sdAbomination' ) // Abomination spawn
						{
							let map = {};
							let blocks_near = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, 16, null, [ 'sdBlock' ] );

							for ( let i = 0; i < blocks_near.length; i++ )
							if ( blocks_near[ i ].material === sdBlock.MATERIAL_FLESH )
							if ( !blocks_near[ i ]._is_being_removed )
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
									let parts = this._contains_class.split( '.' );
									this._contains_class = parts[ 0 ];

									let params = { x: this.x + xx * 16 + 16, y: this.y + yy * 16 + 16 };

									if ( this._contains_class_params )
									{
										for ( let i in this._contains_class_params )
										params[ i ] = this._contains_class_params[ i ];
									}

									ent = new sdWorld.entity_classes[ this._contains_class ]( params );
									sdEntity.entities.push( ent );
									sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs


									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ]._contains_class = null;

									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									
									//setTimeout(()=>{ent.DamageWithEffect( Infinity )}, 2000 ); // Hack

									break done;
								}
							}
						}
						else
						if ( this._contains_class === 'sdBiter.TYPE_LARGE' ) // Infectious biter and some other things in future, maybe?
						{
							let map = {};
							let blocks_near = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, 16, null, [ 'sdBlock' ] );

							for ( let i = 0; i < blocks_near.length; i++ )
							if ( !blocks_near[ i ]._is_being_removed )
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
									let parts = this._contains_class.split( '.' );
									this._contains_class = parts[ 0 ];

									let params = { x: this.x + xx * 16 + 16, y: this.y + yy * 16 + 16, tag:( parts.length > 1 )?parts[1]:null };

									if ( this._contains_class_params )
									{
										for ( let i in this._contains_class_params )
										params[ i ] = this._contains_class_params[ i ];
									}

									ent = new sdWorld.entity_classes[ this._contains_class ]( params );
									sdEntity.entities.push( ent );
									sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs


									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ]._contains_class = null;
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ]._contains_class = null;
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ]._contains_class = null;

									map[ ( xx + 0 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 0 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 0 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									map[ ( xx + 1 ) + ':' + ( yy + 1 ) ].DamageWithEffect( Infinity );
									
									//setTimeout(()=>{ent.DamageWithEffect( Infinity )}, 2000 ); // Hack

									break done;
								}
							}
						}
						else
						{
							if ( this._contains_class === 'weak_ground' )
							{
							}
							else
							{
								let parts = this._contains_class.split( '.' );
								this._contains_class = parts[ 0 ];

								let params = { x: this.x + this.width / 2, y: this.y + this.height / 2, tag:( parts.length > 1 )?parts[1]:null, from_ground:this };

								if ( this._contains_class_params )
								{
									for ( let i in this._contains_class_params )
									params[ i ] = this._contains_class_params[ i ];
								}

								ent = new sdWorld.entity_classes[ this._contains_class ]( params );
								sdEntity.entities.push( ent );

								sdWorld.UpdateHashPosition( ent, false ); // Important! Prevents memory leaks and hash tree bugs
							}
						}
						
						if ( ent && !ent._is_being_removed )
						if ( initiator )
						if ( initiator.is( sdBot ) )
						{
							ent.SyncedToPlayer( initiator ); // Attempt attacking digging bots
						}
					}
					
				}
				this.remove();
			}
		}
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	}
	onSnapshotApplied() // To override
	{
		// Update version where hue is a separate property
		if ( this.filter.indexOf( 'hue-rotate' ) !== -1 || this.filter.indexOf( 'brightness' ) !== -1 )
		{
			[ this.hue, this.br, this.filter ] = sdWorld.ExtractHueRotate( this.hue, this.br, this.filter );
		}
		
		if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
		if ( !this._last_damage )
		this._last_damage = 0;
	
		if ( sdWorld.is_server )
		{
			if ( sdWorld.server_config.enable_block_merging )
			{
				if ( this._hea === this._hmax )
				if ( this._merged === false && this.SupportsMerging() ) // SupportsMerging does not work in constructor
				{
					this._hea = this._hmax - 0.1;
					this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE ); // Does not attmpt merge without this
				}
			}
			else
			if ( this._merged )
			{
				if ( this.UnmergeBlocks().length > 0 ) // Unmerged successfully?
				{
					
				}
				else
				{
					this.remove(); // Otherwise remove faulty block
					this._broken = false;
				}
			}
		}

		// Copy [ 2 / 2 ]
		if ( this._natural )
		sdBlock.natural_blocks_total++;
	}
	onBuilt()
	{
		this.onSnapshotApplied();
	}
	constructor( params )
	{
		super( params );
		
		/*if ( !sdWorld.is_server )
		{
			// Debugging NaN x/y of broken particles
			this._stack_trace = globalThis.getStackTrace();
		}*/
		
		//this._client_side_bg = null;
		
		this.width = params.width || 32;
		this.height = params.height || 32;
		
		this.material = params.material || sdBlock.MATERIAL_WALL;
		
		this.texture_id = params.texture_id || 0; // Only changes texture, but keeps meaning
		
		this._natural = ( params.natural === true ); // Strictly to distinguish player-build entities
		
		// Copy [ 1 / 2 ]
		if ( this._natural )
		sdBlock.natural_blocks_total++;
		
		this._hmax = 550 * ( this.width / 32 * this.height / 32 ) * ( this.material === sdBlock.MATERIAL_GROUND ? 0.8 : 1 );
		
		if ( !this._natural )
		this._hmax *= 4;
		
		if ( this.material === sdBlock.MATERIAL_TRAPSHIELD ) // Less health, but regeneration will have no delay
		{
			this._hmax *= sdBlock.trapshield_block_health_ratio;
		}
		
		if ( this.material === sdBlock.MATERIAL_ANCIENT_WALL ) // Less health, explodes when destroyed, but emits matter
		{
			this._hmax = 200;
		}
		this._last_damage = 0; // Used by MATERIAL_TRAPSHIELD so far only
		
		this._armor_protection_level = 0; // Armor level defines lowest damage upgrade projectile that is able to damage this entity
		this._reinforced_level = params._reinforced_level || 0;
		this._max_reinforced_level = this._reinforced_level + 2;
		this._shielded = null; // Is this entity protected by a base defense unit?
	
		/*if ( this._reinforced_level > 0 )
		{
			this._hmax *= 1 + this._reinforced_level;
		}*/
		
		this._hea = this._hmax;
		this._regen_timeout = 0;
		
		
		this._contains_class = params.contains_class || null;
		this._contains_class_params = params.contains_class_params || null; // Parameters that are passed to this._contains_class entity
		//this._hidden_crystal = params.hidden_crystal || false;
		//this._hidden_virus = params.hidden_virus || false;
		
		this.hue = params.hue || 0;
		this.br = params.br || 100;
		this.filter = params.filter || '';
		
		this._plants = params.plants || null; // Array of _net_id-s actually
		
		this._owner = null; // Only used by sharp so far
		this.p = 0; // Material property value. In case of spike it is an animation, in case of corruption it is a rank
		this._next_attack = 0; // Only used by Corruption
		this._next_spread = -1; // Only used by Corruption
		
		this._merged = false; // Has this block merged with any other blocks?

		this._ai_team === params._ai_team || 0; // For faction outposts, so AI doesn't attack their own bases
		
		this._additional_properties = params.additional_properties || null; // Used in storing health for merged blocks
		
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			this._owner = params.owner || null; // Useful in case of sharp trap
			this.p = 0; // 30 when somebody near, 15...30 - visible spikes, 0...15 - not visible spikes
			
			if ( this.texture_id > 0 )
			{
				this._hmax *= 2;
				this._hea *= 2;
			}
		}
		
		if ( this.material === sdBlock.MATERIAL_CORRUPTION )
		{
			//this.blood = 0;
			this._next_attack = 0;
			this._next_spread = sdWorld.time + 5000 + Math.random() * 10000;
			this.p = ( params.rank === undefined ) ? sdBlock.max_corruption_rank : params.rank;
		}

		if ( this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS )
		{
			this.p = ( params.rank === undefined ) ? 0 : params.rank;
		}

		if ( this.material === sdBlock.MATERIAL_FLESH )
		{
			//this.blood = 0;
			this._next_attack = 0;
			this._next_spread = sdWorld.time + 5000; // + Math.random() * 10000;
			this.p = ( params.rank === undefined ) ? sdBlock.max_flesh_rank : params.rank;
		}
		
		if ( this.material === sdBlock.MATERIAL_ANCIENT_WALL )
		{
			this.ApplyStatusEffect({ type: sdStatusEffect.TYPE_ANCIENT_WALL_PROPERTIES }); // Give ancient blocks matter emmission
		}
		
		/*if ( sdWorld.server_config.enable_block_merging )
		{
			if ( this._hea === this._hmax )
			if ( this._merged === false )
			{
				this._hea = this._hmax - 0.1;
			}
		}
		else
		if ( this._merged )
		{
			if ( this.UnmergeBlocks().length > 0 ) // Unmerged successfully?
			{
				
			}
			else
			{
				this.remove(); // Otherwise remove faulty block
				this._broken = false;
			}
		}*/
		// Not sure if the merging stuff above is checked properly since it's in the constructor...
		// Should be working inside sdServerConfig.js now
		
		this.destruction_frame = 0;
		this.HandleDestructionUpdate();
		//this.reinforced_frame = 0;
		//this.HandleReinforceUpdate();
		
		if ( params.skip_hiberstate_and_hash_update )
		{
		}
		else
		if ( this.material !== sdBlock.MATERIAL_CORRUPTION && 
			 this.material !== sdBlock.MATERIAL_FLESH && 
			 this._hea >= this._hmax )
		this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED, false ); // 2nd parameter is important as it will prevent temporary entities from reacting to world entities around it (which can happen for example during item price measure - something like sdBlock can kill player-initiator and cause server crash)
		
		this.InstallBoxCapVisibilitySupport();
		
		this.onSnapshotApplied();
	}
	ExtraSerialzableFieldTest( prop )
	{
		return ( prop === '_plants' || prop === '_contains_class_params' || prop === '_shielded' || prop === '_owner' || prop === '_contains_class' || prop === '_additional_properties' );
	}
	ValidatePlants( must_include=null ) // foliage / grass
	{
		if ( !this._plants )
		{
			if ( must_include )
			this._plants = [ must_include._net_id ];
		}
		else
		{
			for ( let i = 0; i < this._plants.length; i++ )
			{
				let plant = sdEntity.entities_by_net_id_cache_map.get( this._plants[ i ] );
				if ( !plant )
				{
					this._plants.splice( i, 1 );
					i--;
					continue;
				}
			}
			
			if ( must_include )
			{
				if ( this._plants.indexOf( must_include._net_id ) === -1 )
				this._plants.push( must_include._net_id );
			}
		}
	}
	MeasureMatterCost()
	{
		return this._hmax * sdWorld.damage_to_matter * (1 + ( 2 * this._reinforced_level ) ) * ( this.material === sdBlock.MATERIAL_TRAPSHIELD ? 4.5 : 1 ) + ( this.material === sdBlock.MATERIAL_SHARP ? ( this.texture_id > 0 ? 30 * 4 : 30 ) : 0 );
	}
	Corrupt( from=null )
	{
		if ( this.IsInSafeArea() )
		return null;
	
		let ent2 = sdEntity.Create( sdBlock, { 
			x: this.x, 
			y: this.y,
			width:this.width, 
			height:this.height, 
			material:sdBlock.MATERIAL_CORRUPTION, 
			hue:this.hue,
			br:this.br,
			filter:this.filter, 
			rank: from ? Math.max( 0, from.p - 1 - Math.floor( Math.random(), 3 ) ) : undefined,
			natural: true 
		});

		this.remove();
		this._broken = false;

		if ( this._contains_class === 'sdSandWorm' ) // Is there a worm spawn inside this block?
		ent2._contains_class = 'sdSandWorm.corrupted'; // Corrupt the worm aswell

		if ( this._contains_class === 'sdCrystal' ) // Is there a worm spawn inside this block?
		ent2._contains_class = 'sdCrystal.corrupted'; // Corrupt the worm aswell

		if ( this._contains_class === 'sdCrystal.deep' ) // Is there a worm spawn inside this block?
		ent2._contains_class = 'sdCrystal.deep_corrupted'; // Corrupt the worm aswell

		//sdEntity.entities.push( ent2 );

		ent2._hmax = this._hmax;
		ent2._hea = this._hea;
		
		return ent2;
	}
	Crystalize( from=null )
	{
		if ( this.IsInSafeArea() )
		return null;
	
		let ent2 = sdEntity.Create( sdBlock, { x: this.x, y: this.y, width:this.width, height:this.height, material:sdBlock.MATERIAL_CRYSTAL_SHARDS, natural:true, 
			hue:this.hue,br:this.br,filter:this.filter,
			//rank: Math.round( Math.random() * 6 ) 
			rank: 1 + Math.floor( Math.pow( Math.random(), 1.5 ) * 11 )
		});
		// Don't allow orange and anticrystal shards due to their glow effect overriding the block.

		this.remove();
		this._broken = false;
		
		
		if ( Math.random() < 0.9 || ent2.width < 16 || ent2.height < 16 )
		{
		}
		else
		ent2._contains_class = 'sdCrystal'; // For Guanakos

		//if ( this._contains_class === 'sdSandWorm' ) // Is there a worm spawn inside this block?
		//ent2._contains_class = 'sdSandWorm.crystallized'; // Potential crystal worm later?

		//sdEntity.entities.push( ent2 );
		
		ent2._hmax = this._hmax * 0.5;
		ent2._hea = this._hea * 0.5;
		
		return ent2;
	}
	Fleshify( from=null, force_initial_rank=undefined ) // Fleshify is reused in sdDoor, using pointer
	{
		if ( this.IsInSafeArea() )
		return null;
	
		if ( !sdWorld.server_config.base_degradation )
		{
			if ( this._shielded && !this._shielded._is_being_removed )
			return null;
		}
		
		// 
	
		let bri = 100 - ( Math.random() * 100 / 5 );
		let ent2 = sdEntity.Create( sdBlock, { 
			x: this.x + this._hitbox_x1, 
			y: this.y + this._hitbox_y1, 
			width: this._hitbox_x2 - this._hitbox_x1, 
			height: this._hitbox_y2 - this._hitbox_y1, 
			material:sdBlock.MATERIAL_FLESH, 
			br:bri, 
			rank: from ? Math.max( 0, from.p - 1 - Math.floor( Math.random(), 2 ) ) : force_initial_rank,
			natural: true
		});

		this.remove();
		this._broken = false;

		if ( this._contains_class === 'sdOctopus' || Math.random() < 0.05 ) // Octopus spawn gets replaced by abomination, or RNG puts abomination inside the flesh
		ent2._contains_class = 'sdAbomination'; // Turn it into an abomination

		if ( Math.random() < 0.5 ) // It usually doesn't hit a proper side so it removes the grabber anyway, making it sort of rare enough.
		{
			let side = Math.round( Math.random() * 3 );
			let spawn_x = this.x + ( this.width / 2 );
			let spawn_y = this.y + ( this.height / 2 );
			if ( side === 0 )
			spawn_y -= 1 + this.height / 2;
			if ( side === 1 )
			spawn_x -= 1 + this.width / 2;
			if ( side === 2 )
			spawn_y += 1 + this.height / 2;
			if ( side === 3 )
			spawn_x += 1 + this.width / 2;
			let grabber = sdEntity.Create( sdFleshGrabber, { 
				x: spawn_x, 
				y: spawn_y, 
				_attached_to: ent2,
				side: side
			});
		}


		if ( this._contains_class === 'sdSlug' || Math.random() < 0.07 ) // Octopus spawn gets replaced with mimic, or RNG puts abomination inside the flesh
		{
			ent2._contains_class = 'sdMimic'; // Turn it into an mimic
			
			sdTimer.ExecuteWithDelay( ( timer )=>{

				if ( !ent2._is_being_removed )
				if ( ent2._contains_class === 'sdMimic' )
				ent2.Damage( ent2._hea + 1 );

			}, 5000 + Math.random() * 30000 );
		}

		//sdEntity.entities.push( ent2 );
		
		ent2._hmax = 480; // Fixed health values regardless how deep it is
		ent2._hea = 480;
		
		if ( this._shielded )
		{
			let bsu = this._shielded;
			
			let cameras = bsu.GetConnectedCameras();
			for ( let i = 0; i < cameras.length; i++ )
			cameras[ i ].Trigger( sdCamera.DETECT_BSU_DEACTIVATION, 'Block is losing protection due to corruption spreading nearby' );
			
			this._shielded = null;
			sdSound.PlaySound({ name:'overlord_cannon3', x:this.x+this.width/2, y:this.y+this.height/2, volume:2, pitch:0.5 });
		}
		
		return ent2;
	}
	GetBleedEffect()
	{
		if ( this.material === sdBlock.MATERIAL_FLESH )
		return sdEffect.TYPE_BLOOD;
	
		if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
		return sdEffect.TYPE_SHIELD;
	
		if ( this.material === sdBlock.MATERIAL_SAND || 
			 this.material === sdBlock.MATERIAL_GROUND || 
			 this.material === sdBlock.MATERIAL_ROCK ||
			 this.material === sdBlock.MATERIAL_CORRUPTION || 
			 this.material === sdBlock.MATERIAL_SNOW ||
			 this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS )
		return sdEffect.TYPE_DIRT_HIT;
	
		return sdEffect.TYPE_WALL_HIT;
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
	/*HandleReinforceUpdate()
	{
		let old_reinforced_frame = this.reinforced_frame;
		
		if ( this._reinforced_level === this._max_reinforced_level - 2 )
		this.reinforced_frame = 0;
		else
		if ( this._reinforced_level === this._max_reinforced_level - 1.5 )
		this.reinforced_frame = 1;
		else
		if ( this._reinforced_level === this._max_reinforced_level - 1 )
		this.reinforced_frame = 2;
		else
		if ( this._reinforced_level === this._max_reinforced_level - 0.5 )
		this.reinforced_frame = 3;
		else
		if ( this._reinforced_level === this._max_reinforced_level )
		this.reinforced_frame = 4;
		
		if ( this.reinforced_frame !== old_reinforced_frame )
		this._update_version++;
	}*/
	UnmergeBlocks()
	{
		if ( !sdWorld.is_server )
		return [];
	
		if ( !this._merged )
		return [];
	
	
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		// Have to recreate all blocks so bullets behave properly - Booraz
		
		// Seems like I also need to return an array of the newly created blocks so bullets 100% don't hit the blocks in the back.
		
		let blocks = [];
		
		for ( let i = 0; i < Math.round( this.height / 16 ); i++ )
		{
			let xx = this.x;
			let yy = this.y;
			yy += 16 * i;
		
			let contained_class = null;
			let contained_params = null;
			
			if ( this._contains_class )
			{
				if ( typeof this._contains_class !== 'string' && this._contains_class[ i ] ) // Not a string?
				{
					contained_class = this._contains_class[ i ];
				}
			}
			if ( this._contains_class_params )
			{
				if ( this._contains_class_params[ i ] ) // Not a string?
				{
					contained_params = this._contains_class_params[ i ];
				}
			}
		
			let ent = sdEntity.Create( sdBlock, { 
				x: xx, 
				y: yy,
				width:16, 
				height:16, 
				material:this.material, 
				hue:this.hue,
				br:this.br,
				filter:this.filter, 
				natural: this._natural,
				contains_class: contained_class,
				contains_class_params: contained_params
			});
			ent._regen_timeout = 60;
			if ( this._additional_properties )
			if ( this._additional_properties[ i ] )
			ent._hmax = this._additional_properties[ i ];
			else
			ent._hmax = this._hmax;
		
			ent._hea = ent._hmax - 0.1;
		
			blocks.push( ent );
		}
		//this._regen_timeout = 60; // Without regen timeout they will attempt to re-apply merging
		//if ( this._hea === this._hmax )
		//this._hea = this._hmax - 0.1;
		//this._merged = false;
		this.remove();
		this._broken = false;
	
	
		//this._update_version++;
		return blocks;
	}
	SupportsMerging()
	{
		//console.log( this.material );
		//console.log( sdBlock.MATERIAL_GROUND + ',' + sdBlock.MATERIAL_ROCK + ',' + sdBlock.MATERIAL_SAND + ',' + sdBlock.MATERIAL_SNOW );
		if ( this.width !== 16 ) // Maybe let's keep vertical lines only for now.
		return false;
			
		if ( this.height < 16 || this.height % 16 !== 0 ) // Merge only blocks that can be divided by 16, and are at least 16 units
		return false;
		
		if ( this.material === sdBlock.MATERIAL_GROUND || this.material === sdBlock.MATERIAL_ROCK ||
		this.material === sdBlock.MATERIAL_SAND || this.material === sdBlock.MATERIAL_SNOW )
		return true;
		
		return false;
	}
	AttemptBlockMerging()
	{
		if ( this._merged )
		return false;
	
		if ( this._is_being_removed || !this )
		return false;
	
		let ents_to_merge_above = [];
		let ents_to_merge_below = [];
		
		/* Currently how merging works:
			We check for blocks above and below which are suitable for merging,
			after that we merge the above ones first - and shift the block on top
			after that, we merge the below ones - done this way so unmerging is consistent
			and merging always catches both top and bottom scenarios
		*/
		
		this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
		
		let i = 1;
		let ent;
		
		function IsCompatible( ent, ent2 )
		{
			if ( !ent || ent._is_being_removed || !ent2 || ent2._is_being_removed )
			return false;
		
			if ( ent._hea <= ent._hmax - 1 || ent2._hea <= ent2._hmax - 1 ) // Make sure all are (near) maxed HP. Though even destruction_frame === 0 could work too.
			return false;
			
			//if ( ent._natural !== ent2._natural )
			//return false;
			
			//if ( ent._merged || ent2._merged )
			//return false;
		
			if ( ( ent._plants === null && ent2._plants === null ) && ( ent.SupportsMerging() ) )
			{
				if ( ent.material === ent2.material && ent.filter === ent2.filter && ent.hue === ent2.hue && ent.br === ent2.br )
				return true;
				else
				return false;
				
			}
			else
			return false;
		}
		
		if ( !IsCompatible( this, this ) )
		return false;
		
		
		// Attempt vertical merging - go down ( check below )
		while( true ){
			ent = sdBlock.GetGroundObjectAt( this.x + 8, this.y + 8 + ( 16 * i ), false );
			
			if ( IsCompatible( ent, this ) )
			{
				// Limit to 16 entity merges.
				if ( ( this.height + ( 16 * i ) + ( ent.height - 16 ) ) <= 256 )
				ents_to_merge_below.push( ent );
				else
				break;
			}
			else
			break;
			
			if ( ent ) // Just in case
			i += Math.round( ent.height / 16 );
			else
			break;
		}
		i = 1;
		
		// Attempt vertical merging - go up ( check above )
		while( true ){
			ent = sdBlock.GetGroundObjectAt( this.x + 8, this.y + 8 - ( 16 * i ), false );
			
			if ( IsCompatible( ent, this ) )
			{
				// Limit to 16 entity merges.
				if ( ( this.height + ( 16 * i ) + ( ent.height - 16 ) ) <= 256 )
				ents_to_merge_above.push( ent );
				else
				break;
			}
			else
			break;
			
			if ( ent ) // Just in case
			i += Math.round( ent.height / 16 );
			else
			break;
		}
		//console.log( "Above: " + ents_to_merge_above.length );
		//console.log( "Below: " + ents_to_merge_below.length );
		
		if ( ents_to_merge_above.length > 0 || ents_to_merge_below.length > 0 ) // Any merge possible?
		{
			let contained_classes = []; // contains class
			
			let contained_params = []; // contans class params
			
			let additional_props = []; // Contains only block health for now.
			//this.width = 16;
			//this.height = 16 + ( 16 * ents_to_merge.length );
			
			
			let height_increase = 0;
			if ( ents_to_merge_above.length > 0 )
			for( i = 0; i < ents_to_merge_above.length; i++ )
			{
				
				if ( typeof ents_to_merge_above[ i ]._contains_class === 'string' ) // String?
				contained_classes.push( ents_to_merge_above[ i ]._contains_class ); // Just add into the array
				else
				if ( ents_to_merge_above[ i ]._contains_class ) // Make sure we have something in there. It's probably an array.
				{
					for ( let j = 0; j < ents_to_merge_above[ i ]._contains_class.length; j++ )
					contained_classes.push( ents_to_merge_above[ i ]._contains_class[ j ] ); // Add individually into the array
				}
				else // Null? Probably still needed for unmerging.
				contained_classes.push( ents_to_merge_above[ i ]._contains_class ); // Just add into the array
				
				contained_params.concat( ents_to_merge_above[ i ]._contains_class_params );
				
				// We need to check if params are an array
				if ( ents_to_merge_above[ i ]._contains_class_params instanceof Array ) // Make sure we have something in there. It's probably an array.
				{
					//contained_params.push( ...ents_to_merge_above[ i ]._contains_class_params ); // Not sure if this would work... Maybe better manually?
					for ( let j = 0; j < ents_to_merge_above[ i ]._contains_class_params.length; j++ )
					contained_params.push( ents_to_merge_above[ i ]._contains_class_params[ j ] ); // Add individually into the array
				}
				else // Object or null? Probably still needed for unmerging.
				contained_params.push( ents_to_merge_above[ i ]._contains_class_params ); // Just add into the array
				
				additional_props.push( ents_to_merge_above[ i ]._hmax );
					
			
				height_increase += ents_to_merge_above[ i ].height;
				//if ( from_above ) // Are we merging from above?
				//this.y -= ents_to_merge[ i ].height; // Move merged block up
				
				ents_to_merge_above[ i ].remove();
				ents_to_merge_above[ i ]._broken = false;
				
			}
			
			this.height += height_increase; // Increase height by total height of merged blocks
			this.y -= height_increase; // Move merged block up
			
			contained_classes.push( this._contains_class ); // Make sure we merge contained classes properly
			contained_params.push( this._contains_class_params );
			additional_props.push( this._hmax );
			
			height_increase = 0; // Reset height increase
			
			if ( ents_to_merge_below.length > 0 )
			for( i = 0; i < ents_to_merge_below.length; i++ )
			{
				
				if ( typeof ents_to_merge_below[ i ]._contains_class === 'string' ) // String?
					contained_classes.push( ents_to_merge_below[ i ]._contains_class ); // Just add into the array
				else
				if ( ents_to_merge_below[ i ]._contains_class ) // Make sure we have something in there. It's probably an array.
				{
					for ( let j = 0; j < ents_to_merge_below[ i ]._contains_class.length; j++ )
					contained_classes.push( ents_to_merge_below[ i ]._contains_class[ j ] ); // Add individually into the array
				}
				else // Null? Probably still needed for unmerging.
				contained_classes.push( ents_to_merge_below[ i ]._contains_class ); // Just add into the array
				
				
				// We need to check if params are an array
				if ( ents_to_merge_below[ i ]._contains_class_params instanceof Array ) // Make sure we have something in there. It's probably an array.
				{
					//contained_params.push( ...ents_to_merge_below[ i ]._contains_class_params ); // Not sure if this would work... Maybe better manually?
					for ( let j = 0; j < ents_to_merge_below[ i ]._contains_class_params.length; j++ )
					contained_params.push( ents_to_merge_below[ i ]._contains_class_params[ j ] ); // Add individually into the array
				}
				else // Object or null? Probably still needed for unmerging.
				contained_params.push( ents_to_merge_below[ i ]._contains_class_params ); // Just add into the array
				
				additional_props.push( ents_to_merge_below[ i ]._hmax );
			
				height_increase += ents_to_merge_below[ i ].height;
				//if ( from_above ) // Are we merging from above?
				//this.y -= ents_to_merge[ i ].height; // Move merged block up
				
				ents_to_merge_below[ i ].remove();
				ents_to_merge_below[ i ]._broken = false;
				
			}
			this.height += height_increase; // Increase height by total height of merged blocks
			// No Y change since we just merged below the block
			
			this._merged = true;
			this._contains_class = contained_classes;
			this._contains_class_params = contained_params;
			this._additional_properties = additional_props;
			
			this._update_version++;
			
			sdWorld.UpdateHashPosition( this, true ); // Bullets pass through walls higher than 64 without this?
			
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			
			
			//console.log( 'Block: ' + this.x + ',' + this.y + ', width:' + this.width + ', height:' + this.height );
			//console.log( this._contains_class );
			//console.log( this._contains_class_params );
			//console.log( 'Health of blocks:' + this._additional_properties );
			
			//this._hmax = 1;
			//this._hea = 1;
			return true;
		}
		
		// Old 2x2 merge
		/*for ( i = 0; i < 3; i++ ) // Right -> bottom right scenario
		{
			if ( i === 0 )
			ent = sdBlock.GetGroundObjectAt( this.x + 16, this.y );
			if ( i === 1 )
			ent = sdBlock.GetGroundObjectAt( this.x, this.y + 16 );
			if ( i === 2 )
			ent = sdBlock.GetGroundObjectAt( this.x + 16, this.y + 16 );
		
			if ( IsCompatible( ent, this ) )
			ents_to_merge.push( ent );
			else
			{
				can_merge = false;
				break;
			}
		}
		if ( !can_merge ) // Attempt left side scenario
		{
			ents_to_merge = [];
			from_left = true;
			can_merge = true;
			for ( i = 0; i < 3; i++ ) // Left -> bottom left scenario
			{
				if ( i === 0 )
				ent = sdBlock.GetGroundObjectAt( this.x - 16, this.y );
				if ( i === 1 )
				ent = sdBlock.GetGroundObjectAt( this.x, this.y + 16 );
				if ( i === 2 )
				ent = sdBlock.GetGroundObjectAt( this.x - 16, this.y + 16 );
			
				if ( IsCompatible( ent, this ) )
				ents_to_merge.push( ent );
				else
				{
					can_merge = false;
					break;
				}
			}
		}
		if ( !can_merge ) // Attempt top scenario
		{
			ents_to_merge = [];
			from_left = false;
			can_merge = true;
			from_above = true;
			for ( i = 0; i < 3; i++ ) // Right -> top right scenario
			{
				if ( i === 0 )
				ent = sdBlock.GetGroundObjectAt( this.x + 16, this.y );
				if ( i === 1 )
				ent = sdBlock.GetGroundObjectAt( this.x, this.y - 16 );
				if ( i === 2 )
				ent = sdBlock.GetGroundObjectAt( this.x + 16, this.y - 16 );
			
				if ( IsCompatible( ent, this ) )
				ents_to_merge.push( ent );
				else
				{
					can_merge = false;
					break;
				}
			}
		}
		if ( !can_merge ) // Attempt left side scenario
		{
			ents_to_merge = [];
			from_left = true;
			can_merge = true;
			for ( i = 0; i < 3; i++ ) // Left -> top left scenario
			{
				if ( i === 0 )
				ent = sdBlock.GetGroundObjectAt( this.x - 16, this.y );
				if ( i === 1 )
				ent = sdBlock.GetGroundObjectAt( this.x, this.y - 16 );
				if ( i === 2 )
				ent = sdBlock.GetGroundObjectAt( this.x - 16, this.y - 16 );
			
				if ( IsCompatible( ent, this ) )
				ents_to_merge.push( ent );
				else
				{
					can_merge = false;
					break;
				}
			}
		}
		//console.log( can_merge );
		if ( can_merge )
		{
			let contained_classes = [];
			contained_classes.push( this._contains_class );
			this.width = 32;
			this.height = 32;
			
			if ( from_left )
			this.x = this.x - 16;
		
			if ( from_above )
			this.y = this.y - 16;
			
			this._update_version++;
			
			for( i = 0; i < 3; i++ )
			{
				contained_classes.push( ents_to_merge[ i ]._contains_class );
				ents_to_merge[ i ].remove();
				ents_to_merge[ i ]._broken = false;
			}
			
			this._merged = true;
			this._contains_class = contained_classes;
			console.log( this.x + ',' + this.y );
			console.log( this._contains_class );
			
			//this._hmax = 1;
			//this._hea = 1;
			return true;
		}
		*/
		return false;
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		//Reset reinforced levels
		if ( this._reinforced_level > 0 )
		this._reinforced_level = 0;
		if ( this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
		this.material = sdBlock.MATERIAL_WALL;

		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this._hea < this._hmax )
			{
				if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
				this._hea = Math.min( this._hea + GSPEED * sdBlock.trapshield_block_regen_ratio, this._hmax );
				else
				if ( this.material === sdBlock.MATERIAL_SHARP )
				this._hea = Math.min( this._hea + GSPEED * 0.005 * this._hmax, this._hmax );
				else
				this._hea = Math.min( this._hea + GSPEED, this._hmax );
				
				this.HandleDestructionUpdate();
			}
		}
		
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			if ( this.p > 0 )
			{
				this.p = Math.max( 0, this.p - GSPEED );
				this._update_version++;
			}
			else
			if ( this._hea === this._hmax )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
		}
		else
		if ( this.material === sdBlock.MATERIAL_CORRUPTION )
		{
			if ( !sdWorld.is_server )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			else
			if ( sdWorld.time > this._next_spread )
			{
				this._next_spread = sdWorld.time + 5000 + Math.random() * 10000;
				
				let dir = ~~( Math.random() * 4 );
				
				let corrupt_done = false;
				
				for ( let d = 0; d < 4; d++, dir = ( dir + 1 ) % 4 )
				{
					let ent = null;
					
					if ( dir === 0 )
					ent = sdBlock.GetGroundObjectAt( this.x + 16, this.y );
					
					if ( dir === 1 )
					ent = sdBlock.GetGroundObjectAt( this.x - 16, this.y );
					
					if ( dir === 2 )
					ent = sdBlock.GetGroundObjectAt( this.x, this.y + 16 );
					
					if ( dir === 3 )
					ent = sdBlock.GetGroundObjectAt( this.x, this.y - 16 );
				
					if ( ent )
					{
						//if ( ent.material === sdBlock.MATERIAL_GROUND && this.p >= 1 )
						if ( ent._natural && ent.material !== sdBlock.MATERIAL_CORRUPTION && this.p >= 1 )
						{
							if ( ent._merged === false )
							{
								ent.Corrupt( this );
								corrupt_done = true;
								break;
							}
							else
							{
								ent.UnmergeBlocks(); // Unmerge blocks
								ent = null; // Begin again
								// Not ideal, but if it works...
								if ( dir === 0 )
								ent = sdBlock.GetGroundObjectAt( this.x + 16, this.y );
					
								if ( dir === 1 )
								ent = sdBlock.GetGroundObjectAt( this.x - 16, this.y );
					
								if ( dir === 2 )
								ent = sdBlock.GetGroundObjectAt( this.x, this.y + 16 );
					
								if ( dir === 3 )
								ent = sdBlock.GetGroundObjectAt( this.x, this.y - 16 );
							
								if ( ent )
								{
									ent.Corrupt( this );
									corrupt_done = true;
									break;
								}
							}
							//if ( ent._merged === false )
						}
						/*else
						{
							if ( ent.material !== sdBlock.MATERIAL_CORRUPTION )
							this.CorruptAttack( ent );
						}
						break;*/
					}
				}
				if ( !corrupt_done )
				{
					this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
				}
			}
		}
		else
		if ( this.material === sdBlock.MATERIAL_FLESH )
		{
			if ( !sdWorld.is_server )
			this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			else
			if ( sdWorld.time > this._next_spread )
			{
				this._next_spread = sdWorld.time + 30000 + Math.random() * 10000; // More time to spread
				
				let dir = ~~( Math.random() * 4 );
				
				let corrupt_done = false;
				
				if ( this.p >= 1 )
				for ( let d = 0; d < 4; d++, dir = ( dir + 1 ) % 4 )
				{
					let ent = null;
					
					let xx = 0;
					let yy = 0;
					
					if ( dir === 0 )
					xx = 1;
					//ent = sdBlock.GetGroundObjectAt( this.x + 16, this.y );
					
					if ( dir === 1 )
					xx = -1;
					//ent = sdBlock.GetGroundObjectAt( this.x - 16, this.y );
					
					if ( dir === 2 )
					yy = 1;
					//ent = sdBlock.GetGroundObjectAt( this.x, this.y + 16 );
					
					if ( dir === 3 )
					yy = -1;
					//ent = sdBlock.GetGroundObjectAt( this.x, this.y - 16 );
				
					sdWorld.last_hit_entity = null;
					sdWorld.CheckWallExistsBox( 
							this.x + xx * 16, 
							this.y + yy * 16, 
							this.x + this._hitbox_x2 + xx * 16, 
							this.y + this._hitbox_y2 + yy * 16, 
							null, 
							null, 
							null, 
							( e )=>
							{
								return (
										( e.is( sdBlock ) && ( e.IsDefaultGround() || !e._natural ) ) ||
										e.is( sdDoor )
								);
							}
					);
					
					ent = sdWorld.last_hit_entity;
					
					if ( ent )
					{
						//if ( this.p >= 1 )
						//if ( ent.material !== sdBlock.MATERIAL_FLESH )
						//{
							if ( ( ent.is( sdBlock ) && ent._merged === false ) || ent.is( sdDoor ) )
							{
								if ( ent._shielded )
								{
									if ( ent._shielded.onFleshifyAttempted( ent ) )
									ent.Fleshify( this );
								}
								else
								{
									ent.Fleshify( this );
								}
								corrupt_done = true;
								break;
							}
							else
							{
								ent.UnmergeBlocks(); // Unmerge and re-do
								sdWorld.last_hit_entity = null;
								sdWorld.CheckWallExistsBox( 
										this.x + xx * 16, 
										this.y + yy * 16, 
										this.x + this._hitbox_x2 + xx * 16, 
										this.y + this._hitbox_y2 + yy * 16, 
										null, 
										null, 
										null, 
										( e )=>
										{
											return (
													( e.is( sdBlock ) && ( e.IsDefaultGround() || !e._natural ) ) ||
													e.is( sdDoor )
											);
										}
								);
								ent = sdWorld.last_hit_entity;
								if ( ent )
								{
									ent.Fleshify( this );
									corrupt_done = true;
									break;
								}
							}
						//}
					}
				}
				if ( !corrupt_done )
				{
					this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED );
				}
			}
		}
		else
		if ( this._hea === this._hmax )
		{
			if ( sdWorld.is_server )
			{
				if ( sdWorld.server_config.enable_block_merging === true && this._merged === false && this.AttemptBlockMerging() && this._regen_timeout <= 0 )
				{
					this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP ); // Enter hibernation either way
				}
				else
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED_NO_COLLISION_WAKEUP );
			}
		}
	}
	
	static GetGroundObjectAt( nx, ny, strict = true ) // for corruption
	{
		if ( nx >= sdWorld.world_bounds.x2 || nx <= sdWorld.world_bounds.x1 || 
			 ny >= sdWorld.world_bounds.y2 || ny <= sdWorld.world_bounds.y1 )
		return null;
	
		let arr_under = sdWorld.RequireHashPosition( nx, ny ).arr;
		
		if ( strict )
		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ] instanceof sdBlock )
			if ( arr_under[ i ].x === nx && arr_under[ i ].y === ny )
			if ( !arr_under[ i ]._is_being_removed )
			return arr_under[ i ];
		}
		else
		for ( var i = 0; i < arr_under.length; i++ )
		{
			if ( arr_under[ i ] instanceof sdBlock )
			if ( nx >= arr_under[ i ].x && ny >= arr_under[ i ].y && nx <= ( arr_under[ i ].x + arr_under[ i ].width ) && ny <= ( arr_under[ i ].y + arr_under[ i ].height ) )
			if ( !arr_under[ i ]._is_being_removed )
			return arr_under[ i ];
		}
		
		return null;
	}
	onMovementInRange( from_entity )
	{
		if ( sdWorld.is_server )
		{
			if ( this.material === sdBlock.MATERIAL_CORRUPTION || this.material === sdBlock.MATERIAL_SHARP )
			if ( from_entity._is_bg_entity === this._is_bg_entity )
			if ( from_entity.GetClass() !== 'sdGun' || from_entity._held_by === null ) // Do not react to held guns, also ignore client-side bones and client-side effects
			if ( from_entity.GetClass() !== 'sdBone' && from_entity.GetClass() !== 'sdEffect' )
			if ( !from_entity.IsPlayerClass() || !from_entity.driver_of )
			{
				if ( this.material === sdBlock.MATERIAL_SHARP )
				{
					if ( this.p === 0 )
					{
						this.p = 30;
						this._update_version++;

						sdSound.PlaySound({ name:'trap', x:this.x+this.width/2, y:this.y+this.height/2, volume:1 });
						from_entity.PlayDamageEffect( from_entity.x, from_entity.y );
						//sdWorld.SendEffect({ x:from_entity.x, y:from_entity.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });

						if ( ( from_entity._reinforced_level || 0 ) === 0 )
						{
							if ( this.texture_id > 0 )
							from_entity.DamageWithEffect( 200, this._owner );
							else
							from_entity.DamageWithEffect( 100, this._owner );
						}

						this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
					}
				}
				else
				if ( this.material === sdBlock.MATERIAL_CORRUPTION )
				{
					if ( from_entity.GetClass() !== 'sdSandWorm' && from_entity.GetClass() !== 'sdCrystal' ) // If we were to have more corrupted entities we should probably filter them out with a function.
					this.CorruptAttack( from_entity );
					else
					{
						if ( from_entity.GetClass() === 'sdSandWorm' )
						if ( from_entity.kind !== sdSandWorm.KIND_CORRUPTED_WORM && from_entity.kind !== sdSandWorm.KIND_CRYSTAL_HUNTING_WORM )
						this.CorruptAttack( from_entity );

						if ( from_entity.GetClass() === 'sdCrystal' )
						if ( from_entity.type !== sdCrystal.TYPE_CRYSTAL_CORRUPTED )
						this.CorruptAttack( from_entity );
					}
				}
			}
		}
	}
	CorruptAttack( from_entity )
	{
		if ( sdWorld.time > this._next_attack )
		{
			// Outdated block version, just remove. Remove this logic after June 2022
			if ( this._next_spread === -1 )
			{
				this.remove();
				this._broken = false;
			}
			
			this._next_attack = sdWorld.time + 100;

			from_entity.PlayDamageEffect( from_entity.x, from_entity.y );
			//sdWorld.SendEffect({ x:from_entity.x, y:from_entity.y, type:from_entity.GetBleedEffect(), filter:from_entity.GetBleedEffectFilter() });

			//if ( ( from_entity.hea || from_entity._hea ) >= 0 )
			//this.blood += 10;
			
			this._update_version++;
			this.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
			
			if ( from_entity.is( sdCharacter ) )
			{
				//from_entity._sickness += 30;
				from_entity._sickness = Math.max( from_entity._sickness, 30 * 30 );
				from_entity._last_sickness_from_ent = this;
			}
			else
			{
				from_entity.DamageWithEffect( 10, this );
			}
		}
	}
	get description()
	{
		if ( this.material === sdBlock.MATERIAL_TRAPSHIELD )
		return `High regeneration rate walls that are also happen to be shot through by entities that are close enough (such as turrets, Star Defenders).`;
	
		if ( this.texture_id === sdBlock.TEXTURE_ID_CAGE )
		return `Nothing can go through these except for most projectiles.`;
	
		if ( this.material === sdBlock.MATERIAL_SHARP )
		return `Entities can move through this trap wall, but they will take damage form it when they do so.`;
	
		return `All walls have same amount of hitpoints no matter how they look like. You can use base shielding units to apply additional protection to them.`;
	}
	
	Draw( ctx, attached )
	{
		var w = this.width;
		var h = this.height;
		
		ctx.filter = this.filter;

		let old_volumetric_mode = ctx.volumetric_mode;
		
		if ( this.hue !== 0 )
		{
			// Less cache usage by making .hue as something GPU understands, so we don't have as many versions of same images
			if ( sdRenderer.visual_settings === 4 )
			ctx.sd_hue_rotation = this.hue;
			else
			ctx.filter = 'hue-rotate('+this.hue+'deg)' + ctx.filter;
		}
		
		if ( this.br / 100 !== 1 )
		{
			if ( sdRenderer.visual_settings === 4 )
			{
				ctx.sd_color_mult_r = this.br / 100;
				ctx.sd_color_mult_g = this.br / 100;
				ctx.sd_color_mult_b = this.br / 100;
			}
			else
			{
				ctx.filter = 'brightness('+this.br+'%)';
			}
		}
		
		/*let lumes = sdWorld.GetClientSideGlowReceived( this.x + w / 2, this.y + h / 2, this );
		if ( lumes > 0 )
		{
			if ( sdRenderer.visual_settings === 4 )
			{
				ctx.sd_color_mult_r *= (1+lumes);
				ctx.sd_color_mult_g *= (1+lumes);
				ctx.sd_color_mult_b *= (1+lumes);
			}
			else
			ctx.filter = ctx.filter + 'brightness('+(1+lumes)+')';
		}*/

		
		
		//ctx.filter = 'hsl(120,100%,25%)';
		
		if ( this.material === sdBlock.MATERIAL_GROUND ||
			 this.material === sdBlock.MATERIAL_ROCK ||
			 this.material === sdBlock.MATERIAL_SAND ||
			 this.material === sdBlock.MATERIAL_SNOW ||
			 this.material === sdBlock.MATERIAL_CORRUPTION || 
			 this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS ||
			 this.material === sdBlock.MATERIAL_ANCIENT_WALL )
		{
			let texture = sdBlock.img_ground88;
			let texture_size = 256;
			
			if ( this.material === sdBlock.MATERIAL_ROCK )
			{
				texture = sdBlock.img_rock;
				texture_size = 32;
			}

			if ( this.material === sdBlock.MATERIAL_SAND || this.material === sdBlock.MATERIAL_SNOW )
			{
				texture = sdBlock.img_sand;
				texture_size = 128;
			}
			if ( this.material === sdBlock.MATERIAL_ANCIENT_WALL )
			{
				texture = sdBlock.img_ancient_wall;
				texture_size = 128;
			}
			/*if ( w === 32 && h === 32 ) // Merged blocks scenario
			{
				ctx.drawImageFilterCache( texture, this.x - Math.floor( this.x / texture_size ) * texture_size, this.y - Math.floor( this.y / texture_size ) * texture_size, w/2,h/2, 0,0, w/2,h/2 );
				ctx.translate( 16, 0 );
				ctx.drawImageFilterCache( texture, ( this.x + 16 ) - Math.floor( ( this.x + 16 ) / texture_size ) * texture_size, this.y - Math.floor( this.y / texture_size ) * texture_size, w/2,h/2, 0,0, w/2,h/2 );
				ctx.translate( -16, 16 );
				ctx.drawImageFilterCache( texture, this.x - Math.floor( this.x / texture_size ) * texture_size, ( this.y + 16 ) - Math.floor( ( this.y + 16 ) / texture_size ) * texture_size, w/2,h/2, 0,0, w/2,h/2 );
				ctx.translate( 16, 0 );
				ctx.drawImageFilterCache( texture, ( this.x + 16 ) - Math.floor( ( this.x + 16 ) / texture_size ) * texture_size, ( this.y + 16 ) - Math.floor( ( this.y + 16 ) / texture_size ) * texture_size, w/2,h/2, 0,0, w/2,h/2 );
				ctx.translate( -16, -16 );
			}*/
			if ( h > 16 ) // Vertical merged blocks scenario
			{
				ctx.save();
				for ( let i = 0; i < Math.round( h / 16 ); i++ )
				{
					ctx.drawImageFilterCache( texture, this.x - Math.floor( this.x / texture_size ) * texture_size, ( this.y + 16 * i ) - Math.floor( ( this.y + 16 * i ) / texture_size ) * texture_size, 16,16, 0,0, 16,16 );
					ctx.translate( 0, 16 );
				}
				ctx.restore();
			}
			else
			ctx.drawImageFilterCache( texture, this.x - Math.floor( this.x / texture_size ) * texture_size, this.y - Math.floor( this.y / texture_size ) * texture_size, w,h, 0,0, w,h );
			
			ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX_DECAL;
			
			if ( this.material === sdBlock.MATERIAL_CORRUPTION )
			{
				if ( sdRenderer.visual_settings === 4 )
				{
					ctx.filter = 'saturate('+(this.p/ sdBlock.max_corruption_rank * 0.75 + 0.25)+')';
					ctx.sd_hue_rotation = ( this.p - sdBlock.max_corruption_rank )*(15);
					ctx.sd_color_mult_r = (this.p / sdBlock.max_corruption_rank * 0.75 + 0.25);
					ctx.sd_color_mult_g = (this.p / sdBlock.max_corruption_rank * 0.75 + 0.25);
					ctx.sd_color_mult_b = (this.p / sdBlock.max_corruption_rank * 0.75 + 0.25);
				}
				else
				ctx.filter = 'hue-rotate('+( this.p - sdBlock.max_corruption_rank )*(15)+'deg) saturate('+(this.p/ sdBlock.max_corruption_rank * 0.75 + 0.25)+') brightness('+(this.p / sdBlock.max_corruption_rank * 0.75 + 0.25)+')';
			
				ctx.drawImageFilterCache( sdBlock.img_corruption, this.x - Math.floor( this.x / 128 ) * 128, this.y - Math.floor( this.y / 128 ) * 128, w,h, 0,0, w,h );
			}
			if ( this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS )
			{
				ctx.apply_shading = false;
				
				ctx.sd_hue_rotation = 0;
				ctx.sd_color_mult_r = 1;
				ctx.sd_color_mult_g = 1;
				ctx.sd_color_mult_b = 1;
				
				ctx.filter = sdWorld.GetCrystalHue( 40 * Math.pow( 2, this.p ), 0.2 );

				let old_scale = ctx.camera_relative_world_scale;
				ctx.camera_relative_world_scale *= 0.999;
				{
					let old_mode = ctx.volumetric_mode;
					ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX_TRANSPARENT;
					{
						ctx.drawImageFilterCache( sdBlock.img_crystal_shards, this.x - Math.floor( this.x / 128 ) * 128, this.y - Math.floor( this.y / 128 ) * 128, w,h, 0,0, w,h );
					}
					ctx.volumetric_mode = old_mode;
				}
				ctx.camera_relative_world_scale = old_scale;
			}
		}
		else
		if ( this.material === sdBlock.MATERIAL_FLESH )
		{
			//ctx.drawImageFilterCache( sdBlock.img_flesh, this.x - Math.floor( this.x / 128 ) * 128, this.y - Math.floor( this.y / 128 ) * 128, w,h, 0,0, w,h );
			
			for ( let xx = 0; xx < w; xx += 16 )
			for ( let yy = 0; yy < h; yy += 16 )
			{
				let w2 = Math.min( 16, w - xx );
				let h2 = Math.min( 16, h - yy );
				ctx.drawImageFilterCache( sdBlock.img_flesh, this.x+xx - Math.floor( (this.x+xx) / 128 ) * 128, this.y+yy - Math.floor( (this.y+yy) / 128 ) * 128, w2,h2, xx,yy, w2,h2 );
			}
		}
		else
		if ( this.material === sdBlock.MATERIAL_WALL ||
			 this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || // We probably no longer need 2 kinds of these if we could just switch texture
			 this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
		{
			let img = sdBlock.textures[ this.texture_id ][ w + 'x' + h ];
			if ( img )
			ctx.drawImageFilterCache( img, 0, 0, w,h, 0,0, w,h );
			else
			{
				ctx.fillStyle = '#ff0000';
				ctx.fillRect( 0,0,w,h );
			}
			//ctx.drawImageFilterCache( sdBlock.img_wall_2x2, 0, 0, w,h, 0,0, w,h );
			
			/*if ( w === 32 && h === 32 )
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
			if ( w === 8 && h === 16 )
			{
				//ctx.drawImageFilterCache( sdBlock.img_wall_vertical_test, 0, 0, w,h, 0,0, w,h );
				ctx.drawImageFilterCache( sdBlock.img_wall_vertical_test, 0, 0, 8,8, 0,0, 8,8 );
			}
			else
			ctx.drawImageFilterCache( sdBlock.img_wall22, 0, 0, w,h, 0,0, w,h );*/
		
		
		}
		/*else
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
		if ( this.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
		{
			if ( w === 32 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_lvl2_wall22, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 32 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_lvl2_wall21, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 32 )
			ctx.drawImageFilterCache( sdBlock.img_lvl2_wall12, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 16 )
			ctx.drawImageFilterCache( sdBlock.img_lvl2_wall11, 0, 0, w,h, 0,0, w,h );
			else
			if ( w === 16 && h === 8 )
			ctx.drawImageFilterCache( sdBlock.img_lvl2_wall05, 0, 0, w,h, 0,0, w,h );
			else
			ctx.drawImageFilterCache( sdBlock.img_lvl2_wall22, 0, 0, w,h, 0,0, w,h );
		}*/
		else
		if ( this.material === sdBlock.MATERIAL_SHARP )
		{
			if ( this.texture_id === 0 )
			ctx.drawImageFilterCache( ( this.p < 15 ) ? sdBlock.img_sharp2_inactive : sdBlock.img_sharp2, 0, 0, w,h, 0,0, w,h );
			else
			//if ( this.texture_id === 1 )
			ctx.drawImageFilterCache( ( this.p < 15 ) ? sdBlock.img_sharp3_inactive : sdBlock.img_sharp3, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_PRESET_SPECIAL_ANY_GROUND )
		{
			ctx.drawImageFilterCache( sdBlock.img_preset_ground, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_PRESET_SPECIAL_FORCE_AIR )
		{
			ctx.drawImageFilterCache( sdBlock.img_preset_air, 0, 0, w,h, 0,0, w,h );
		}
		else
		if ( this.material === sdBlock.MATERIAL_BUGGED_CHUNK )
		{
			ctx.apply_shading = false;
			
			if ( sdWorld.time % 2000 < 1000 )
			ctx.fillStyle = ( ( this.x + this.y ) % 32 === 0 ) ? '#ff0000' : '#aa0000';
			else
			ctx.fillStyle = ( ( this.x + this.y ) % 32 === 0 ) ? '#aa0000' : '#660000';
		
			ctx.fillRect( 0,0,w,h );
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
		
	
		ctx.volumetric_mode = FakeCanvasContext.DRAW_IN_3D_BOX_DECAL;
		
			
		//if ( sdBlock.metal_reinforces[ this.reinforced_frame ] !== null )
		//ctx.drawImageFilterCache( sdBlock.metal_reinforces[ this.reinforced_frame ], 0, 0, w,h, 0,0, w,h );
	
		ctx.filter = 'none';
		ctx.sd_hue_rotation = 0;
		ctx.sd_color_mult_r = 1;
		ctx.sd_color_mult_g = 1;
		ctx.sd_color_mult_b = 1;
		
		if ( sdBlock.cracks[ this.destruction_frame ] !== null )
		{
			ctx.drawImageFilterCache( sdBlock.cracks[ this.destruction_frame ], 0, 0, w,h, 0,0, w,h );
		}
		
		ctx.volumetric_mode = old_volumetric_mode;
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this._natural )
		{
			sdBlock.natural_blocks_total--;
			if ( sdBlock.natural_blocks_total < 0 ) // Well, this isn't right...
			sdBlock.natural_blocks_total = 0;
		}
	
		if ( sdWorld.is_server )
		{
			if ( this._broken ) // Prevent this logic in shop
			{
				let nears = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, Math.max( this.width, this.height ) / 2 + 16 );
				for ( let i = 0; i < nears.length; i++ )
				if ( nears[ i ] instanceof sdWater )
				{
					nears[ i ].AwakeSelfAndNear();
					//nears[ i ]._sleep_tim = sdWater.sleep_tim_max;
				}

				//if ( this.material === sdBlock.MATERIAL_GROUND || this.material === sdBlock.MATERIAL_CORRUPTION || this.material === sdBlock.MATERIAL_CRYSTAL_SHARDS )
				if ( this._natural )
				{
					//let new_bg = new sdBG({ x:this.x, y:this.y, width:this.width, height:this.height, material:sdBG.MATERIAL_GROUND, hue:this.hue, br:this.br, filter:this.filter + ' brightness(0.5)' });
					let new_bg = new sdBG({ x:this.x, y:this.y, width:this.width, height:this.height, material:sdBG.MATERIAL_GROUND, hue:this.hue, br:this.br * 0.5, filter:this.filter, natural:this._natural });
					if ( new_bg.CanMoveWithoutOverlap( this.x, this.y, 1 ) )
					{
						sdEntity.entities.push( new_bg );
						sdWorld.UpdateHashPosition( new_bg, false, true );
					}
					else
					{
						new_bg.remove();
						new_bg._remove();
					}
				}

				// Recursively turn these into default ground
				if ( this.material === sdBlock.MATERIAL_BUGGED_CHUNK )
				{
					sdTimer.ExecuteWithDelay( ( timer )=>{
						
						let nears = sdWorld.GetAnythingNear( this.x + this.width / 2, this.y + this.height / 2, 16 );
						for ( let i = 0; i < nears.length; i++ )
						{
							let e = nears[ i ];
							if ( e instanceof sdBlock )
							if ( e.material === sdBlock.MATERIAL_BUGGED_CHUNK )
							{
								e.remove();
							}
						}
					
					}, 400 + Math.random() * 200 );
					
					let block = sdWorld.AttemptWorldBlockSpawn( this.x, this.y, false );

					if ( block )
					sdWorld.UpdateHashPosition( block, false, true );
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
		if ( !sdWorld.is_server || sdWorld.is_singleplayer )
		{
			if ( isNaN( this.x ) || isNaN( this.y ) )
            {
            	console.log( 'sdBlock with broken x/y coordinates was spawned here: ' + this._stack_trace );
            	debugger;
				return;
            
			}
			if ( this.material !== sdBlock.MATERIAL_TRAPSHIELD )
			if ( this.material !== sdBlock.MATERIAL_BUGGED_CHUNK )
			if ( this._net_id !== undefined ) // Was ever synced rather than just temporarily object for shop
			if ( this._broken )
			{
				if ( this.texture_id === sdBlock.TEXTURE_ID_GLASS )
				sdSound.PlaySound({ name:'glass12', x:this.x+this.width/2, y:this.y+this.height/2, volume:0.25, pitch: 0.6, _server_allowed:true });
				else
				sdSound.PlaySound({ name:'blockB4', 
					x:this.x + this.width / 2, 
					y:this.y + this.height / 2, 
					volume:( this.width / 32 ) * ( this.height / 32 ), 
					pitch: ( this.material === sdBlock.MATERIAL_FLESH ) ? 4 : ( this.material === sdBlock.MATERIAL_CORRUPTION ) ? 0.4 : ( this.material === sdBlock.MATERIAL_WALL || this.material === sdBlock.MATERIAL_SHARP ) ? 1 : 1.5,
					_server_allowed:true });

				let x,y,a,s;
				let step_size = 4;
				for ( x = step_size / 2; x < this.width; x += step_size )
				for ( y = step_size / 2; y < this.height; y += step_size )
				{
					a = Math.random() * 2 * Math.PI;
					s = Math.random() * 4;
					
					
					if ( this.material === sdBlock.MATERIAL_SNOW )
					sdEntity.entities.push( new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_ROCK, filter:'brightness(0) invert(1)', sx: Math.sin(a)*s, sy: Math.cos(a)*s }) );
					else
					if ( this.material === sdBlock.MATERIAL_FLESH )
					sdEntity.entities.push( new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_GIB, sx: Math.sin(a)*s, sy: Math.cos(a)*s }) );
					else
					if ( this.texture_id === sdBlock.TEXTURE_ID_GLASS )
					sdEntity.entities.push( new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_GLASS, sx: Math.sin(a)*s*1.5, sy: Math.cos(a)*s*1.5 }) );
					else
					sdEntity.entities.push( new sdEffect({ x: this.x + x, y: this.y + y, type:sdEffect.TYPE_ROCK, sx: Math.sin(a)*s, sy: Math.cos(a)*s }) );
				}
			}
		}
	}
}
//sdBlock.init_class();

export default sdBlock;
