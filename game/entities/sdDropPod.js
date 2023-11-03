// Should be standardized at some point to allow other factions and/or drop pod types to be made, might get around to it myself if I can. - Ghost581
import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';

import sdRenderer from '../client/sdRenderer.js';


class sdDropPod extends sdEntity
{
	static init_class()
	{
		sdDropPod.img_pod = sdWorld.CreateImageFromFile( 'kvt_weapons_pod_closed' );
		sdDropPod.img_pod_open = sdWorld.CreateImageFromFile( 'kvt_weapons_pod_open' );
		sdDropPod.img_pod_empty = sdWorld.CreateImageFromFile( 'kvt_weapons_pod_empty' );
		
		sdDropPod.pod_counter = 0;

		sdDropPod.ignored_classes_arr = [ 'sdGun', 'sdBullet', 'sdCharacter' ];
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -12; }
	get hitbox_x2() { return 12; }
	get hitbox_y1() { return -18; }
	get hitbox_y2() { return 12; }
	
	get hard_collision()
	{ return false; }
	
	get is_static() // Static world objects like walls, creation and destruction events are handled manually. Do this._update_version++ to update these
	{ return false; }
	
	Damage( dmg, initiator=null )
	{
		if ( !sdWorld.is_server )
		return;
	
		dmg = Math.abs( dmg );
		
		if ( this.hea > 0 )
		{
			this.hea -= dmg;
			
			//this._update_version++;

			if ( this.hea <= 0 )
			{
				sdDropPod.pod_counter--;
				this.remove();
			}
			else
			{
				this._regen_timeout = 30 * 10;
			}
		}
	}
	constructor( params )
	{
		super( params );
		this.sx = 0;
		this.sy = 0;
		
		this.hmax = 6000;
		this.hea = this.hmax;
		this._regen_timeout = 0;
		//this.matter_max = 5500;
		//this.matter = 100;
		//this.delay = 0;
		this.level = 0;
		this.metal_shards = 0;
		this.metal_shards_max = 7;
		
		this._armor_protection_level = 0;
		this.uses = 0;
		this.open = false;
		this.empty = false;

		sdDropPod.pod_counter++;
	}
	get mass()
	{
		return 750;
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdDropPod.ignored_classes_arr;
	}

	onBuilt()
	{
		sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:0.8 });
	}
	MeasureMatterCost()
	{
		return 0; // Hack
	}
	Progress()
	{
		this.metal_shards = 0;
		this.metal_shards_max += 9;

		this.level++;
		
		//this._update_version++;
		
		sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5, pitch:0.33 });
	}
	Open()
	{
		this.uses = Math.random() > 0.8 ? 4 : 3 // 20% chance to get 1 additional item
		this.open = true;
	}
	Loot()
	{

		if ( Math.random() < 0.4 ) // Random power weapon given to Star Defenders
		{ // 40%
			if ( Math.random() <= 0.125 ) // 12.5%
			{
				sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_AVRS }) );
			}
			else
			if ( Math.random() <= 0.25 ) // 12.5%
			{
				sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_RAILCANNON }) );
			}
			else // 15%
			{
				sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_MMG }) );
			}
		}
		else // Random regular weapon given to Star Defenders
		{ // 60%
			if ( Math.random() <= 0.525 ) // 12.5%
			{
				sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_HANDCANNON }) );
			}
			else if ( Math.random() <= 0.625 ) // 12.5%
			{
				sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_MISSILE_LAUNCHER }) );
			}
			else if ( Math.random() <= 0.75 ) // 20%
			{
				sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_RIFLE }) );
			}
			else // 20%
			{
				sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_SMG }) );
			}
		}
		
		//this._update_version++;
		this.uses --;
		sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:7 });

		if ( this.uses <= 0 )
		{
			this.empty = true;
		}
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		//this._armor_protection_level = 0; // Never has protection unless full health reached

		if ( this._regen_timeout > 0 )
		this._regen_timeout -= GSPEED;
		else
		{
			if ( this.hea < this.hmax )
			{
				this.hea = Math.min( this.hea + GSPEED, this.hmax );
				
				//if ( sdWorld.is_server )
				//this.hea = this.hmax; // Hack
				
				//this._update_version++;
			}
			/*else
			{
				this.SetHiberState( sdEntity.HIBERSTATE_HIBERNATED, false );
			}*/
		}

		this.sy += sdWorld.gravity * GSPEED;
		this.ApplyVelocityAndCollisions( GSPEED, 0, true );
	}
	IsVehicle()
	{
		return true;
	}
	AddDriver( c )
	{
		//if ( !sdWorld.is_server )
		return;
	}
	onMovementInRange( from_entity )
	{
		if ( this.level < 2 )
		if ( from_entity.is( sdGun ) )
		if ( from_entity.class === sdGun.CLASS_METAL_SHARD )
		if ( this.metal_shards < this.metal_shards_max )
		{
			this.metal_shards++;
			//this._update_version++;
			from_entity.remove();
		}
	}
	get title()
	{
		return 'KIVORTEC Weapons Pod';
	}
	get description()
	{
		return `Contains KIVORTEC weaponry. Has to be unlocked first before being able to get weapons.`;
	}
	Draw( ctx, attached )
	{
		if ( this.open === false )
		{
			ctx.drawImageFilterCache( sdDropPod.img_pod, -16, -58, 32, 72 );
		}
		else if ( this.empty === false )
		{
			ctx.drawImageFilterCache( sdDropPod.img_pod_open, -16, -58, 32, 72 );
		}
		else
		{
			ctx.drawImageFilterCache( sdDropPod.img_pod_empty, -16, -58, 32, 72 );
		}
	}
	DrawHUD( ctx, attached ) // foreground layer
	{	
		if (this.level < 2 )
		{
			sdEntity.TooltipUntranslated( ctx, T("KIVORTEC Weapons Pod") + " ( " + ~~(this.metal_shards) + " / " + ~~(this.metal_shards_max) + " )", 0, -10 );
			sdEntity.Tooltip( ctx, T("Lock progress") + " " + this.level + " / 2", 0, -2, '#66ff66' );
		}
		else
		{
			sdEntity.TooltipUntranslated( ctx, T("KIVORTEC Weapons Pod"), 0, -10 );
			sdEntity.Tooltip( ctx, T("UNLOCKED"), 0, -2, '#66ff66' );
		}

		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 23, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 23, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this._broken )
		sdWorld.BasicEntityBreakEffect( this, 25, 3, 0.75, 0.75 );
	}
	onRemoveAsFakeEntity()
	{
	}
	ExecuteContextCommand( command_name, parameters_array, exectuter_character, executer_socket ) // New way of right click execution. command_name and parameters_array can be anything! Pay attention to typeof checks to avoid cheating & hacking here. Check if current entity still exists as well (this._is_being_removed). exectuter_character can be null, socket can't be null
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		{
			
			if ( command_name === 'PROGRESS' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 * 1.25 ) )
				{
					if ( this.metal_shards === this.metal_shards_max )
					{	
						if ( this.level === 0 ? Math.random() > 0.175 : Math.random() > 0.225 )// 17.5% chance to fail, 22.5% on level 2.
						{
							this.Progress();
							sdSound.PlaySound({ name:'gun_buildtool', x:this.x, y:this.y, volume:0.5 });

							if ( this.level === 2 )
							{
								if ( Math.random() > 0.8 )
								exectuter_character.Say( 'Open sesame!' );
								else if ( Math.random() > 0.6 )
								exectuter_character.Say( 'I hope it\'s not rigged..' );
								else if ( Math.random() > 0.2 )
								exectuter_character.Say( 'Let\'s see what we\'ve got here...' );
								else
								exectuter_character.Say( 'I hope they don\'t send someone after me..' );
							}
						}
						else
						{
							this.metal_shards = 0;
							if ( this.level === 0 )
							this.metal_shards_max += 2; // Failing makes it a bit harder to get in. Gets harder if failed on higher levels.
							else
							this.metal_shards_max += 3; // Failing makes it a bit harder to get in. More punishing on higher levels.
							sdSound.PlaySound({ name:'hover_lowhp', x:this.x, y:this.y, volume:1, pitch:0.44 });

							if ( Math.random() > 0.8 )
							exectuter_character.Say( '"This is some advanced tech.. I failed."' );
							else if ( Math.random() > 0.5 )
							exectuter_character.Say( 'Ow! That clipped my hand. That didn\'t go well.' );
							else if ( Math.random() > 0.2 )
							exectuter_character.Say( 'You\'ve got to be kidding me. Bypass failed.' );
							else if ( Math.random() > 0.75 )
							exectuter_character.Say( 'What is this thing made out of anyway? Looks like that didn\'t work.' );
							else
							exectuter_character.Say( '...Bastard. Bypass failed' );
						}
					}
					else
					{
						if ( Math.random() > 0.7 )
						exectuter_character.Say( 'I don\'t have enough resources to try bypassing the security.' );
						else
						exectuter_character.Say( 'I\'m gonna need more than my wits to get this thing open.' );
					}
				}
				else
				{
					executer_socket.SDServiceMessage( 'Weapon pod is too far' );
					return;
				}
			}

			if ( command_name === 'OPEN' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 * 1.25 ) )
				{	
					this.Open();
				}
				else
				{
					executer_socket.SDServiceMessage( 'Weapon pod is too far' );
					return;
				}
			}

			if ( command_name === 'LOOT' )
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 * 1.25 ) )
				{	
					if ( this.uses > 0 )
					{
						this.Loot();
					}
					else
					{
						if ( Math.random() > 0.7 )
						exectuter_character.Say( "It seems to have been looted already." );
						else if ( Math.random() > 0.33 )
						exectuter_character.Say( "Either someone got here earlier than me, or there is a criminal among us." );
						else
						exectuter_character.Say( "A weapons pod with no weapons in it? What a cruel joke." );
					}
				}
				else
				{
					executer_socket.SDServiceMessage( 'Weapon pod is too far' );
					return;
				}
			}
		}
	}
	PopulateContextOptions( exectuter_character ) // This method only executed on client-side and should tell game what should be sent to server + show some captions. Use sdWorld.my_entity to reference current player
	{
		if ( !this._is_being_removed )
		if ( this.hea > 0 )
		if ( exectuter_character )
		if ( exectuter_character.hea > 0 )
		if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 * 1.5 ) )
		{
			if ( this.level < 2 )
			this.AddContextOption( 'Attempt to bypass the locking mechanisms (Requires metal shards)', 'PROGRESS', [] );
			// this.AddContextOption( 'Brute force the lock (SPECIAL ITEM)', 'FORCEPROGRESS', [] ); // - idea for later
			if ( this.open === false && this.level >= 2 )
			this.AddContextOption( 'Open the pod', 'OPEN', [] );
			if ( this.open === true )
			this.AddContextOption( 'Loot the pod (Loot left: '+ ~~(this.uses) + ')', 'LOOT', [] );
		}
	}
}
//sdWorkbench.init_class();

export default sdDropPod;
