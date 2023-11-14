
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdTask from './sdTask.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';
import sdFactions from './sdFactions.js';
import sdFactionskin from './sdFactionskin.js';

class sdFactionTools extends sdEntity
{
	static init_class()
	{
		sdFactionTools.img_character_sd = sdWorld.CreateImageFromFile( 'helmets/helmet_star_defender' );
		sdFactionTools.img_character_falkok = sdWorld.CreateImageFromFile( 'helmets/helmet_falkok' );
		sdFactionTools.img_character_pfalkok = sdWorld.CreateImageFromFile( 'helmets/helmet_phfalkok' );
		sdFactionTools.img_character_erthal = sdWorld.CreateImageFromFile( 'helmets/helmet_dino' );
		sdFactionTools.img_character_council = sdWorld.CreateImageFromFile( 'helmets/helmet_council' );
		sdFactionTools.img_character_council2 = sdWorld.CreateImageFromFile( 'helmets/helmet_scion' );
		sdFactionTools.img_character_sarronian = sdWorld.CreateImageFromFile( 'helmets/helmet_biohazard' );
		sdFactionTools.img_character_velox = sdWorld.CreateImageFromFile( 'helmets/helmet_velox' );
		sdFactionTools.img_character_setr = sdWorld.CreateImageFromFile( 'helmets/helmet_eyes' );
		sdFactionTools.img_character_tzyrg = sdWorld.CreateImageFromFile( 'helmets/helmet_skeleton' );
		sdFactionTools.img_character_shurg = sdWorld.CreateImageFromFile( 'helmets/helmet_oxide' );
		sdFactionTools.img_character_fsb = sdWorld.CreateImageFromFile( 'helmets/helmet_omega' );
		sdFactionTools.img_character_ts = sdWorld.CreateImageFromFile( 'helmets/helmet_forge' );
		sdFactionTools.img_character_pilot = sdWorld.CreateImageFromFile( 'helmets/helmet_pilot' );
		sdFactionTools.img_character_zektaron = sdWorld.CreateImageFromFile( 'helmets/helmet_scope' );
		sdFactionTools.img_character_zektaron2 = sdWorld.CreateImageFromFile( 'helmets/helmet_overseer' );

		sdFactionTools.img_gun_sd1 = sdWorld.CreateImageFromFile( 'sniper' );
		sdFactionTools.img_gun_sd2 = sdWorld.CreateImageFromFile( 'shotgun' );
		sdFactionTools.img_gun_sd3 = sdWorld.CreateImageFromFile( 'lmg' );
		sdFactionTools.img_gun_sd4 = sdWorld.CreateImageFromFile( 'rifle' );
		sdFactionTools.img_gun_f1 = sdWorld.CreateImageFromFile( 'f_heavy_rifle' );
		sdFactionTools.img_gun_f2 = sdWorld.CreateImageFromFile( 'f_marksman' );
		sdFactionTools.img_gun_f3 = sdWorld.CreateImageFromFile( 'f_rifle' );
		sdFactionTools.img_gun_f4 = sdWorld.CreateImageFromFile( 'f_psicutter' );
		sdFactionTools.img_gun_f5 = sdWorld.CreateImageFromFile( 'raygun_c01y' );
		sdFactionTools.img_gun_sarronian1 = sdWorld.CreateImageFromFile( 'sarronian_energy_displacer' );
		sdFactionTools.img_gun_sarronian2 = sdWorld.CreateImageFromFile( 'sarronian_smg' );
		sdFactionTools.img_gun_velox1 = sdWorld.CreateImageFromFile( 'rail_cannon' );
		sdFactionTools.img_gun_velox2 = sdWorld.CreateImageFromFile( 'combat_rifle' );
		sdFactionTools.img_gun_velox3 = sdWorld.CreateImageFromFile( 'burst_pistol3' );
		sdFactionTools.img_gun_setr1 = sdWorld.CreateImageFromFile( 'setr_lmg' );
		sdFactionTools.img_gun_setr2 = sdWorld.CreateImageFromFile( 'setr_plasma_shotgun' );
		sdFactionTools.img_gun_tzyrg1 = sdWorld.CreateImageFromFile( 'tzyrg_shotgun' );
		sdFactionTools.img_gun_tzyrg2 = sdWorld.CreateImageFromFile( 'tzyrg_rifle' );
		sdFactionTools.img_gun_erthal1 = sdWorld.CreateImageFromFile( 'erthal_burst_rifle' );
		sdFactionTools.img_gun_erthal2 = sdWorld.CreateImageFromFile( 'erthal_plasma_pistol' );
		sdFactionTools.img_gun_shurg1 = sdWorld.CreateImageFromFile( 'shurg_sniper' );
		sdFactionTools.img_gun_shurg2 = sdWorld.CreateImageFromFile( 'shurg_pistol' );
		sdFactionTools.img_gun_council1 = sdWorld.CreateImageFromFile( 'council_shotgun2' );
		sdFactionTools.img_gun_council2 = sdWorld.CreateImageFromFile( 'council_gun2' );
		sdFactionTools.img_gun_council3 = sdWorld.CreateImageFromFile( 'council_pistol3' );
		sdFactionTools.img_gun_ts = sdWorld.CreateImageFromFile( 'time_shifter_sword' );
		sdFactionTools.img_gun_instructor1 = sdWorld.CreateImageFromFile( 'emergency_instructor' );
		sdFactionTools.img_gun_instructor2 = sdWorld.CreateImageFromFile( 'emergency_instructor2' );
		sdFactionTools.img_gun_pilot = sdWorld.CreateImageFromFile( 'smg' );
		sdFactionTools.img_gun_zektaron1 = sdWorld.CreateImageFromFile( 'zektaron_combat_rifle' );
		sdFactionTools.img_gun_zektaron2 = sdWorld.CreateImageFromFile( 'zektaron_railgun' );

		sdFactionTools.FT_SD_A = 1; // Star Defender Sniper
		sdFactionTools.FT_SD_B = 2; // Star Defender Shotgun
		sdFactionTools.FT_SD_C = 3; // Star Defender Light Machine Gunner
		sdFactionTools.FT_SD_D = 4; // Star Defender Assault Rifle
		sdFactionTools.FT_FALKOK_A = 5; // Falkok Heavy Rifle
		sdFactionTools.FT_FALKOK_B = 6; // Falkok Marksman
		sdFactionTools.FT_FALKOK_C = 7; // Falkok Assault Rifle
		sdFactionTools.FT_PFALKOK_A = 8; // Phoenix Falkok PSI Cutter
		sdFactionTools.FT_PFALKOK_B = 9; // Phoenix Falkok Ray Gun
		sdFactionTools.FT_SARRONIAN_A = 10; // Sarronian E6 Unit
		sdFactionTools.FT_SARRONIAN_B = 11; // Sarronian E3 Unit
		sdFactionTools.FT_VELOX_A = 12; // Velox Devastator
		sdFactionTools.FT_VELOX_B = 13; // Velox Soldier Combat Rifle Class
		sdFactionTools.FT_VELOX_C = 14; // Velox Soldier Burst Pistol Class
		sdFactionTools.FT_SETR_A = 15; // Setr Soldier Light Machine Gunner
		sdFactionTools.FT_SETR_B = 16; // Setr Soldier Shotgun
		sdFactionTools.FT_TZYRG_A = 17; // Tzyrg Shotgun
		sdFactionTools.FT_TZYRG_B = 18; // Tzyrg Assault Rifle
		sdFactionTools.FT_ERTHAL_A = 19; // Erthal Burst Rifle
		sdFactionTools.FT_ERTHAL_B = 20; // Erthal Plasma Pistol
		sdFactionTools.FT_SHURG_A = 21; // Shurg Commander
		sdFactionTools.FT_SHURG_B = 22; // Shurg
		sdFactionTools.FT_COUNCIL_A = 23; // Council Vanguard
		sdFactionTools.FT_COUNCIL_B = 24; // Council Acolyte Burst Rail Rifle
		sdFactionTools.FT_COUNCIL_C = 25; // Council Acolyte Pistol
		sdFactionTools.FT_FSB = 26; // Falkonian Sword Bot
		sdFactionTools.FT_SDR_A = 27; // Star Defender Sniper
		sdFactionTools.FT_SDR_B = 28; // Star Defender Shotgun
		sdFactionTools.FT_SDR_C = 29; // Star Defender Light Machine Gunner
		sdFactionTools.FT_SDR_D = 30; // Star Defender Assault Rifle
		sdFactionTools.FT_SDA_A = 31; // Criminal Star Defender Sniper
		sdFactionTools.FT_SDA_B = 32; // Criminal Star Defender Shotgun
		sdFactionTools.FT_SDA_C = 33; // Criminal Star Defender Light Machine Gunner
		sdFactionTools.FT_SDA_D = 34; // Criminal Star Defender Assault Rifle
		sdFactionTools.FT_TS = 35; // Time Shifter
		sdFactionTools.FT_IR_A = 36; // Instructor
		sdFactionTools.FT_IR_B = 37; // Combat Instructor
		sdFactionTools.FT_PILOT = 38; // Extraction Pilot
		sdFactionTools.FT_ZEKTARON_A = 39; // Zektaron Assault Unit
		sdFactionTools.FT_ZEKTARON_B = 40; // Zektaron Seeker Unit

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}
	get hitbox_x1() { return 0; }
	get hitbox_x2() { return 0; }
	get hitbox_y1() { return 0; }
	get hitbox_y2() { return 0; }

	constructor( params )
	{
		super( params );

		this.type = params.type || 1;

		this.hmax = 100;
		this.hea = this.hmax;
	}
	Draw( ctx, attached )
	{
		ctx.apply_shading = false;
		
		if ( this.type === sdFactionTools.FT_SD_A || this.type === sdFactionTools.FT_SDR_A || this.type === sdFactionTools.FT_SDA_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sd, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_sd1, -8, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SD_B || this.type === sdFactionTools.FT_SDR_B || this.type === sdFactionTools.FT_SDA_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sd, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_sd2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SD_C || this.type === sdFactionTools.FT_SDR_C || this.type === sdFactionTools.FT_SDA_C )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sd, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_sd3, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SD_D || this.type === sdFactionTools.FT_SDR_D || this.type === sdFactionTools.FT_SDA_D )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sd, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_sd4, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_FALKOK_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_falkok, - 16, -16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_f1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_FALKOK_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_falkok, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_f2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_FALKOK_C )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_falkok, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_f3, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_PFALKOK_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_pfalkok, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_f4, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_PFALKOK_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_pfalkok, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_f5, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SARRONIAN_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sarronian, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_sarronian1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SARRONIAN_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sarronian, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_sarronian2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_VELOX_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_velox, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_velox1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_VELOX_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_velox, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_velox2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_VELOX_C )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_velox, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_velox3, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SETR_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_setr, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_setr1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SETR_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_setr, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_setr2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_TZYRG_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_tzyrg, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_tzyrg1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_TZYRG_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_tzyrg, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_tzyrg2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_ERTHAL_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_erthal, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_erthal1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_ERTHAL_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_erthal, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_erthal2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SHURG_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_shurg, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_shurg1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_SHURG_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_shurg, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_shurg2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_COUNCIL_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_council, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_council1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_COUNCIL_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_council2, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_council2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_COUNCIL_C )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_council2, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_council3, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_FSB )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_fsb, - 16, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_TS )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_ts, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_ts, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_IR_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sd, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_instructor1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_IR_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_sd, 0, 0, 32, 32, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_instructor2, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_PILOT )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_pilot, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_pilot, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_ZEKTARON_A )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_zektaron, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_zektaron1, -8, -16, 32,32 );
		}
		if ( this.type === sdFactionTools.FT_ZEKTARON_B )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_zektaron2, - 16, - 16, 32,32 );
			ctx.drawImageFilterCache( sdFactionTools.img_gun_zektaron2, -8, -16, 32,32 );
		}

		ctx.globalAlpha = 1;
		ctx.filter = 'none';
	}
	onThink( GSPEED ) // Class-specific, if needed
	{
		if ( !sdWorld.is_server )
		return;

		this.hea -= GSPEED;

		if ( this.hea < 95 )
		{
			if ( this.type === sdFactionTools.FT_SD_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SD_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SD_C )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SD_D )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_FALKOK_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_HEAVY_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_FALKOK_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_FALKOK_C )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_PFALKOK_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_PHOENIX_FALKOK );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_PFALKOK_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_PHOENIX_FALKOK );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_SARRONIAN_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_ENERGY_DISPLACER }) );
					character_entity._ai_gun_slot = 5;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SARRONIAN_HEAVY );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SARRONIAN_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_SMG }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SARRONIAN );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_ZEKTARON_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ZEKTARON_COMBAT_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ZEKTARON_ASSAULT );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_ZEKTARON_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(140deg)' });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ZEKTARON_RAILGUN }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ZEKTARON_SEEKER );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_VELOX_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAIL_CANNON }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX_DEVASTATOR );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_VELOX_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_COMBAT_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX_RIFLE );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_VELOX_C )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_SETR_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SETR );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_SETR_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_PLASMA_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SETR );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_TZYRG_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TZYRG );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_TZYRG_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TZYRG );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_ERTHAL_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_BURST_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ERTHAL );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_ERTHAL_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_PLASMA_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ERTHAL );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_SHURG_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SHURG_COMMANDER );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SHURG_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SHURG );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_COUNCIL_A )
			{
				sdSound.PlaySound({ name:'council_teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL_VANGUARD );

					const logic = ()=>
					{
					if ( character_entity.hea <= 0 )
					if ( !character_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
						sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170 });
						character_entity.remove();
					}
					};
					setInterval( logic, 1000 );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_COUNCIL_B )
			{
				sdSound.PlaySound({ name:'council_teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_BURST_RAIL }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL );

					const logic = ()=>
					{
					if ( character_entity.hea <= 0 )
					if ( !character_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
						sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170 });
						character_entity.remove();
					}
					};
					setInterval( logic, 1000 );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_COUNCIL_C )
			{
				sdSound.PlaySound({ name:'council_teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_PISTOL }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL );

					const logic = ()=>
					{
					if ( character_entity.hea <= 0 )
					if ( !character_entity._is_being_removed )
					{
						sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, pitch: 1, volume:1 });
						sdWorld.SendEffect({ x:character_entity.x, y:character_entity.y, type:sdEffect.TYPE_TELEPORT, hue:170 });
						character_entity.remove();
					}
					};
					setInterval( logic, 1000 );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_FSB )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				sdEntity.entities.push( character_entity );
				{
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKONIAN_SWORD_BOT );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_SDR_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SDR_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SDR_C )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SDR_D )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_SDA_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SDA_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }) );
					character_entity._ai_gun_slot = 3;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SDA_C )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_SDA_D )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_TS )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TELEPORT_SWORD }) );
					character_entity._ai_gun_slot = 0;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TIME_SHIFTER );
				}
			}

			if ( this.type === sdFactionTools.FT_IR_A )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAILGUN }) );
					character_entity._ai_gun_slot = 4;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_INSTRUCTOR );
				}
			}
			else
			if ( this.type === sdFactionTools.FT_IR_B )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }) );
					character_entity._ai_gun_slot = 2;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COMBAT_INSTRUCTOR );
				}
			}
			else

			if ( this.type === sdFactionTools.FT_PILOT )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_TEAMMATE });
				sdEntity.entities.push( character_entity );
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SMG }) );
					character_entity._ai_gun_slot = 1;
					sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_EXTRACTION_PILOT );
				}
			}

			this.remove();
		}
	}
	get title()
	{
		if ( this.type === sdFactionTools.FT_SD_A || this.type === sdFactionTools.FT_SD_B || this.type === sdFactionTools.FT_SD_C || this.type === sdFactionTools.FT_SD_D )
		return 'Star Defender';
		if ( this.type === sdFactionTools.FT_SDR_A || this.type === sdFactionTools.FT_SDR_B || this.type === sdFactionTools.FT_SDR_C || this.type === sdFactionTools.FT_SDR_D )
		return 'Extraction Star Defender';
		if ( this.type === sdFactionTools.FT_SDA_A || this.type === sdFactionTools.FT_SDA_B || this.type === sdFactionTools.FT_SDA_C || this.type === sdFactionTools.FT_SDA_D )
		return 'Criminal Star Defender';
		if ( this.type === sdFactionTools.FT_FALKOK_A || this.type === sdFactionTools.FT_FALKOK_B || this.type === sdFactionTools.FT_FALKOK_C )
		return 'Falkok';
		if ( this.type === sdFactionTools.FT_PFALKOK_A || this.type === sdFactionTools.FT_PFALKOK_B )
		return 'Phoenix Falkok';
		if ( this.type === sdFactionTools.FT_SARRONIAN_A )
		return 'Sarronian E6 Unit';
		if ( this.type === sdFactionTools.FT_SARRONIAN_B )
		return 'Sarronian E3 Unit';
		if ( this.type === sdFactionTools.FT_VELOX_A )
		return 'Velox Devastator';
		if ( this.type === sdFactionTools.FT_VELOX_B || this.type === sdFactionTools.FT_VELOX_C )
		return 'Velox Soldier';
		if ( this.type === sdFactionTools.FT_SETR_A || this.type === sdFactionTools.FT_SETR_B )
		return 'Setr Soldier';
		if ( this.type === sdFactionTools.FT_TZYRG_A || this.type === sdFactionTools.FT_TZYRG_B )
		return 'Tzyrg';
		if ( this.type === sdFactionTools.FT_ERTHAL_A || this.type === sdFactionTools.FT_ERTHAL_B )
		return 'Erthal';
		if ( this.type === sdFactionTools.FT_SHURG_A )
		return 'Shurg';
		if ( this.type === sdFactionTools.FT_SHURG_B )
		return 'Shurg Commander';
		if ( this.type === sdFactionTools.FT_COUNCIL_A )
		return 'Council Vanguard';
		if ( this.type === sdFactionTools.FT_COUNCIL_B || this.type === sdFactionTools.FT_COUNCIL_C )
		return 'Council Acolyte';
		if ( this.type === sdFactionTools.FT_FSB )
		return 'Falkonian Sword Bot';
		if ( this.type === sdFactionTools.FT_TS )
		return 'Time Shifter';
		if ( this.type === sdFactionTools.FT_IR_A )
		return 'Instructor';
		if ( this.type === sdFactionTools.FT_IR_B )
		return 'Combat Instructor';
		if ( this.type === sdFactionTools.FT_PILOT )
		return 'Extraction Pilot';
		if ( this.type === sdFactionTools.FT_ZEKTARON_A )
		return 'Zektaron Assault Unit';
		if ( this.type === sdFactionTools.FT_ZEKTARON_B )
		return 'Zektaron Seeker Unit';
	}
}

export default sdFactionTools;