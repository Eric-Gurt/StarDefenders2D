// Should be standardized at some point to allow other factions and/or drop pod types to be made, might get around to it myself if I can. - Ghost581
import sdShop from '../client/sdShop.js';

import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdGun from './sdGun.js';
import sdTask from './sdTask.js';

import sdRenderer from '../client/sdRenderer.js';


class sdDropPod extends sdEntity
{
	static init_class()
	{
		sdDropPod.img_pod_kvt = sdWorld.CreateImageFromFile( 'sdDropPod_kvt' ); // Might be better to use sprite sheets for future purposes - Booraz149
		sdDropPod.img_pod_sd = sdWorld.CreateImageFromFile( 'sdDropPod_sd' );
		
		sdDropPod.kvt_pod_counter = 0;
		sdDropPod.sd_pod_counter = 0;

		sdDropPod.ignored_classes_arr = [ 'sdGun', 'sdBullet', 'sdCharacter' ];
		
		sdDropPod.TYPE_KVT = 0; // First pod type is KVT
		sdDropPod.TYPE_SD = 1; // Star Defenders pod type
		
		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return -12; }
	get hitbox_x2() { return 12; }
	get hitbox_y1() { return -15; }
	get hitbox_y2() { return 15; }
	
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
				//sdDropPod.pod_counter--; 
				//Better to put that under onRemove function
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
		
		this.type = params.type || sdDropPod.TYPE_KVT; // Default to KVT Pod if no parameters gave it other properties
		
		this.hmax = 2000; // was 6000, then 4000
		this.hea = this.hmax;
		this._regen_timeout = 0;
		//this.matter_max = 5500;
		//this.matter = 100;
		//this.delay = 0;
		this.level = ( this.type === sdDropPod.TYPE_SD ) ? 2 : 0;
		this.metal_shards = 0;
		this.metal_shards_max = 7;
		
		this._armor_protection_level = 0;
		this.uses = 0;
		this.open = false;
		this.empty = false;
		
		// SD pod stuff
		this._greet_player = false; // Did it welcome player?
		this._greet_timer = 5; // Timer which checks for nearby players to greet, once every 2 seconds
		
		this._speak_id = -1; // Required by speak effects // last voice message
		this._say_allowed_in = 0;
		
		/*this._voice = {
			wordgap: 0,
			pitch: 50,
			speed: 150,
			variant: 'klatt',
			voice: 'en'
		};
		*/
		
		if ( this.type === sdDropPod.TYPE_KVT )
		sdDropPod.kvt_pod_counter++;
	
		if ( this.type === sdDropPod.TYPE_SD )
		sdDropPod.sd_pod_counter++;
	}
	get mass()
	{
		return 750;
	}
	GetIgnoredEntityClasses() // Null or array, will be used during motion if one is done by CanMoveWithoutOverlap or ApplyVelocityAndCollisions
	{
		return sdDropPod.ignored_classes_arr;
	}
	
	Say( t, force_say=true )
	{
		//if ( ( this.state_hp === 0 && this.sentence_to_speak.length === 0 ) || force_say )
		{
			
			let params = { 
				x:this.x, 
				y:this.y - 20, 
				type:sdEffect.TYPE_CHAT, 
				attachment:this, 
				attachment_x: 0,
				attachment_y: -20,
				text:t,
				text_censored: ( typeof sdModeration === 'undefined' ) ? 0 : sdModeration.IsPhraseBad( t, this._socket ),
				voice: { 
				 wordgap: 0,
				 pitch: 10,
				 speed: 150,
				 variant: 'klatt3',
				 voice: 'en'
				}
			};
			
			if ( sdWorld.is_server )
			{
				if ( sdWorld.time > this._say_allowed_in )
				{
					this._say_allowed_in = sdWorld.time + t.length * 50;
					
					sdWorld.SendEffect( params );
				}
			}
		}
	}

	onBuilt()
	{
		//sdSound.PlaySound({ name:'command_centre', x:this.x, y:this.y, volume:0.8 });
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
		let potential_uses = 3; // Just in case value isn't specified
		if ( this.type === sdDropPod.TYPE_KVT )
		potential_uses = Math.random() > 0.8 ? 4 : 3; // 20% chance to get 1 additional item
	
		if ( this.type === sdDropPod.TYPE_SD )
		{
			if ( Math.random() < 0.9 )
			potential_uses = 3 +  ~~( Math.random() * 3 ); // Between 3 and 6 items, 90% chance it has items
			else // 10% chance a green SD soldier will hide in it and ask for extraction
			{
				let ais = 0;
				let hostile = 0;

				let instances = 0;
				let instances_tot = 1;
			
				for ( var i = 0; i < sdCharacter.characters.length; i++ )
				if ( !sdCharacter.characters[ i ]._is_being_removed )
				if ( sdCharacter.characters[ i ]._ai )
				if ( ( sdCharacter.characters[ i ]._ai_team === 0 || sdCharacter.characters[ i ]._ai_team === 6 ) && sdCharacter.characters[ i ]._voice.variant !== 'clone' )
				{
					if ( sdCharacter.characters[ i ].title === 'Star Defender' || sdCharacter.characters[ i ].title === 'Criminal Star Defender' )
					ais++;
				}

				//let left_side = ( Math.random() < 0.5 );

				while ( instances < instances_tot && ais < 4 ) // Only 4 of these task types are available at once
				{
					let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled: hostile ? sdCharacter.AI_MODEL_FALKOK : sdCharacter.AI_MODEL_TEAMMATE });

					sdEntity.entities.push( character_entity );
					sdWorld.UpdateHashPosition( character_entity, false );
					if ( Math.random() < 0.5 ) // Random gun given to Star Defender
					{
						if ( Math.random() < 0.2 )
						{
							sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
							character_entity._ai_gun_slot = 4;
						}
						else
						{
							sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
							character_entity._ai_gun_slot = 3;
						}
					}
					else
					{ 
						if ( Math.random() < 0.1 )
						{
							sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
							character_entity._ai_gun_slot = 2;
						}
						else
						{
							sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
							character_entity._ai_gun_slot = 2;
						}
					}
					let sd_settings;
					sd_settings = {"hero_name":"Star Defender","color_bright":"#c0c0c0","color_dark":"#808080","color_bright3":"#c0c0c0","color_dark3":"#808080","color_visor":"#ff0000","color_suit":"#008000","color_suit2":"#008000","color_dark2":"#808080","color_shoes":"#000000","color_skin":"#808000","helmet1":true,"helmet2":false,"voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"voice6":false};
					character_entity.sd_filter = sdWorld.ConvertPlayerDescriptionToSDFilter_v2( sd_settings );
					character_entity._voice = sdWorld.ConvertPlayerDescriptionToVoice( sd_settings );
					character_entity.helmet = sdWorld.ConvertPlayerDescriptionToHelmet( sd_settings );
					character_entity.title = sd_settings.hero_name;
					character_entity.matter = 185;
					character_entity.matter_max = 185;

					character_entity.hea = 250; // It is a star defender after all
					character_entity.hmax = 250;

					character_entity.armor = 500;
					character_entity.armor_max = 500;
					character_entity._armor_absorb_perc = 0.6; // 60% damage reduction
					character_entity.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor
	
					character_entity._ai = { direction: ( character_entity.x > ( sdWorld.world_bounds.x1 + sdWorld.world_bounds.x2 ) / 2 ) ? -1 : 1 };
										
					character_entity._ai_level = 5;
										
					character_entity._matter_regeneration = 5; // At least some ammo regen
					character_entity._jetpack_allowed = true; // Jetpack
					//character_entity._recoil_mult = 1 - ( 0.0055 * 5 ) ; // Recoil reduction
					character_entity._jetpack_fuel_multiplier = 0.25; // Less fuel usage when jetpacking
					character_entity._ai_team = hostile ? 6 : 0; // AI team 6 is for Hostile Star Defenders, 0 is for normal Star Defenders
					character_entity._allow_despawn = false;
					character_entity._matter_regeneration_multiplier = 4; // Their matter regenerates 4 times faster than normal, unupgraded players
					character_entity._ai.next_action = 90; // Make him stand so he can talk a little
					
					
					let potential_dialogue = sdWorld.AnyOf( [ 
						'Finally, someone familiar! Please get me out of here, this planet sucks.',
						'My legs are clenched from crouching, you have to get me back to the Mothership. Please!',
						'Hey, can you help me? I need to get back to the Mothership, I value my life more than exploration.',
						'You gotta help me! Those weird aliens are trying to kill me. I never asked for this.',
						'Finally someone came! I kept sending the distress signal but nobody responded for the past hour.',
						'What a coincidence, I was about to go insane inside this pod. Can you escort me to the nearest LRTP?',
						'Alright, I admit! Instructor was right, I am not built to survive this planet. Just help me get to safety!'
					] );
					setTimeout(()=>{ // Slight delay when the SD leaves the pod
						if ( character_entity && !character_entity._is_being_removed )
						character_entity.Say( potential_dialogue, false, false, false );
					}, 500 );

					instances++;
					ais++;
					for ( let i = 0; i < sdWorld.sockets.length; i++ ) // Let players know that it needs to be rescued, although they can be teleported when dead, but not destroyed body.
					{
						sdTask.MakeSureCharacterHasTask({ 
							similarity_hash:'EXTRACT-'+character_entity._net_id, 
							executer: sdWorld.sockets[ i ].character,
							target: character_entity,
							//extract_target: 1, // This let's the game know that it needs to draw arrow towards target. Use only when actual entity, and not class ( Like in CC tasks) needs to be LRTP extracted.
							mission: sdTask.MISSION_LRTP_EXTRACTION,
							difficulty: 0.40,
							//lrtp_ents_needed: 1,
							title: 'Rescue Star Defender',
							description: 'It seems that one of our soldiers is nearby and needs help. You should rescue the soldier and extract him to the mothership!'
						});
					}
				}
				if ( instances === 0 ) // If SD can't spawn because there's already enough of them on the map
				potential_uses = 3 +  ~~( Math.random() * 3 ); // Put items back instead
				else
				potential_uses = 0; // The SD removed (or took?) items inside pod so he can hide
			}
		}
	
		this.uses = potential_uses;
		this.open = true;
		
		if ( this.uses <= 0 )
		{
			this.empty = true;
			this.hea = Math.min( this.hea, 100 );
		}
	}
	Loot()
	{
		if ( this.type === sdDropPod.TYPE_KVT ) // KVT pod Loot pool
		{
			if ( Math.random() < 0.4 ) // Random power weapon given to Star Defenders, 40% chance
			{
				let rng = Math.random(); // Value between 0 and 1 at the moment.
				if ( rng < 0.3 ) // 30%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_AVRS }) );
				}
				else
				if ( rng < 0.55 ) // 25%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_RAILCANNON }) );
				}
				else // 45%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_MMG }) );
				}
			}
			else // Random regular weapon given to Star Defenders, 60% chance
			{
				let rng = Math.random(); // Value between 0 and 1 at the moment.
				if ( rng < 0.15 ) // 15%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_HANDCANNON }) );
				}
				else if ( rng < 0.40 ) // 25%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_MISSILE_LAUNCHER }) );
				}
				else if ( rng < 0.75 ) // 35%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_RIFLE }) );
				}
				else // 25%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_KVT_SMG }) );
				}
			}
		}
		
		if ( this.type === sdDropPod.TYPE_SD ) // SD pod Loot pool
		{
			if ( Math.random() < 0.01 ) // 1% chance for some task reward loot
			{
				let rng = Math.random(); // Value between 0 and 1 at the moment.
				if ( rng < 0.2 ) // 20%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_MERGER_CORE }) );
				}
				else
				if ( rng < 0.4 ) // 20%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LVL4_ARMOR_REGEN }) );
				}
				else
				if ( rng < 0.6 ) // 20%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_ZAPPER }) );
				}
				else
				if ( rng < 0.8 ) // 20%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_COMBAT_INSTRUCTOR }) );
				}
				else // 20%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_ILLUSION_MAKER }) );
				}
			}
			else // Random other loot, like workbench and build tool items
			{
				// Maybe due to item count, switch case could be better here. - Booraz149
				let rng = Math.random(); // Value between 0 and 1 at the moment.
				if ( rng < 0.05 ) // 5% chance for level 3 heavy armor
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LVL3_HEAVY_ARMOR }) );
				}
				else
				if ( rng < 0.15 ) // 10%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_ROCKET_MK2 }) );
				}
				else
				if ( rng < 0.25 ) // 10% chance for laser drill
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LASER_DRILL }) );
				}
				else
				if ( rng < 0.35 ) // 10%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_SNIPER }) );
				}
				else
				if ( rng < 0.45 ) // 10%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LASER_PISTOL }) );
				}
				else
				if ( rng < 0.55 ) // 10%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LMG }) );
				}
				else
				if ( rng < 0.60 ) // 5%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LVL2_ARMOR_REGEN }) );
				}
				else
				if ( rng < 0.625 ) // 2.5%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_MINING_FOCUS_CUTTER }) );
				}
				else
				if ( rng < 0.65 ) // 2.5%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_DRAIN_RIFLE }) );
				}
				else
				if ( rng < 0.75 ) // 10%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_GRENADE_LAUNCHER_MK2 }) );
				}
				else
				if ( rng < 0.80 ) // 5%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_CUSTOM_RIFLE }) );
				}
				else
				if ( rng < 0.90 ) // 10%
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_SHOTGUN_MK2 }) );
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:this.x, y:this.y, class:sdGun.CLASS_LVL2_MEDIUM_ARMOR }) );
				}
			}
		}
		
		//this._update_version++;
		this.uses--;
		sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:7 });

		if ( this.uses <= 0 )
		{
			this.empty = true;
			this.hea = Math.min( this.hea, 100 );
		}
	}

	onThink( GSPEED ) // Class-specific, if needed
	{
		//this._armor_protection_level = 0; // Never has protection unless full health reached
		if ( sdWorld.is_server )
		{
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
			if ( this.type === sdDropPod.TYPE_SD )
			{
				if ( this._greet_timer > 0 )
				this._greet_timer -= GSPEED;
				else
				if ( !this._greet_player ) // If no player was greeted
				{
					this._greet_timer = 600;
					let player_to_greet = null;
					let potential_dialogue;
					for ( let i = 0; i < sdWorld.sockets.length; i++ )
					{
						if ( sdWorld.sockets[ i ].character )
						if ( sdWorld.sockets[ i ].character.is( sdCharacter ) )
						if ( sdWorld.Dist2D( this.x, this.y, sdWorld.sockets[ i ].character.x , sdWorld.sockets[ i ].character.y ) < 300 ) // If close enough
						{
							player_to_greet = sdWorld.sockets[ i ].character;
						}
					}
					if ( player_to_greet ) // greet the player
					{
						potential_dialogue = sdWorld.AnyOf( [ 
							'Hello, ' + player_to_greet.title +'! You can get some useful armaments from this pod. It is unlocked for Star Defenders!',
							'Hello, ' + player_to_greet.title +'. This is one of the storage excesses from the Mothership. We figured you might need it.',
							'Hi, ' + player_to_greet.title +'. This pod is open for Star Defenders. Enjoy!',
							'Greetings, ' + player_to_greet.title +'. The pod is now unlocked, take what is inside.'
							] );
						//console.log( potential_dialogue );
						this.Say( potential_dialogue );
						this._greet_player = true;
					}
					else
					if ( Math.random() < 0.01 ) // 1% chance
					{	
						potential_dialogue = sdWorld.AnyOf( [ 
							'Hello, any Star Defenders around here?', 
							'Nobody seems interested in loot.', 
							'Fresh loot here, come and get it!', 
							'They really had to name the pod after a joke...',
							'LRTP is more efficient than pods...'
							] );
						this.Say( potential_dialogue );
					}
				}
			}
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
			
			sdSound.PlaySound({ name:'reload3', x:this.x, y:this.y, volume:0.25, pitch:5 });
			
			//this._update_version++;
			from_entity.remove();
		}
	}
	get title()
	{
		let title = 'Drop pod';
		if ( this.type === sdDropPod.TYPE_KVT )
		title = 'KVT weapons pod';
		if ( this.type === sdDropPod.TYPE_SD )
		title = 'SD-ZNTS item pod';
		return title;
	}
	get description()
	{
		return `An item pod.`;
	}
	Draw( ctx, attached )
	{
		let xx = 0;
		let img;
		
		if ( this.open && this.empty === false ) // Is this pod open (and not empty) ?
		xx = 1;
		else
		if ( this.open ) // Is this pod empty? 
		xx = 2;
	
	
		if ( this.type === sdDropPod.TYPE_KVT ) //Draw KVT pod
		img = sdDropPod.img_pod_kvt;
		if ( this.type === sdDropPod.TYPE_SD ) //Draw SD pod
		img = sdDropPod.img_pod_sd;
		
		ctx.drawImageFilterCache( img, xx * 32, 0, 32,32, - 16, - 16, 32, 32 );
	}
	DrawHUD( ctx, attached ) // foreground layer
	{	
		if ( this.type === sdDropPod.TYPE_KVT )
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
		}
		
		if ( this.type === sdDropPod.TYPE_SD )
		{		
			if (this.level < 2 )
			{
				sdEntity.TooltipUntranslated( ctx, T("SD-ZNTS Item Pod") + " ( " + ~~(this.metal_shards) + " / " + ~~(this.metal_shards_max) + " )", 0, -10 );
				sdEntity.Tooltip( ctx, T("Lock progress") + " " + this.level + " / 2", 0, -2, '#66ff66' );
			}
			else
			{
				sdEntity.TooltipUntranslated( ctx, T("SD-ZNTS Item Pod"), 0, -10 );
				sdEntity.Tooltip( ctx, T("UNLOCKED"), 0, -2, '#66ff66' );
			}
		}

		let w = 40;
	
		ctx.fillStyle = '#000000';
		ctx.fillRect( 0 - w / 2, 0 - 23, w, 3 );

		ctx.fillStyle = '#FF0000';
		ctx.fillRect( 1 - w / 2, 1 - 23, ( w - 2 ) * Math.max( 0, this.hea / this.hmax ), 1 );
	}
	
	onRemove() // Class-specific, if needed
	{
		if ( this.type === sdDropPod.TYPE_KVT )
		sdDropPod.kvt_pod_counter--;
	
		if ( this.type === sdDropPod.TYPE_SD )
		sdDropPod.sd_pod_counter--;
		
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
			if ( (this.type === sdDropPod.TYPE_KVT ) && command_name === 'PROGRESS' ) // All types which need unlocking should have this context option
			{
				if ( sdWorld.inDist2D_Boolean( this.x, this.y, exectuter_character.x, exectuter_character.y, 32 * 1.25 ) )
				{
					if ( this.metal_shards === this.metal_shards_max )
					{	
						if ( this.level === 0 ? Math.random() > 0.15 : Math.random() > 0.2 )// 15% chance to fail, 20% on level 2.
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
							this.metal_shards_max -= 3; // Failing makes it a bit easier to get in.
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
			if ( this.level < 2 && ( this.type === sdDropPod.TYPE_KVT ) )
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
