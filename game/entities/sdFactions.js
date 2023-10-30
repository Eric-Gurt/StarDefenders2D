
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEntity from './sdEntity.js';
import sdEffect from './sdEffect.js';
import sdGun from './sdGun.js';
import sdWater from './sdWater.js';
import sdCom from './sdCom.js';
import sdBullet from './sdBullet.js';
import sdCharacter from './sdCharacter.js';
import sdFactionskin from './sdFactionskin.js';

class sdFactions extends sdEntity
{
	static init_class()
	{
		sdFactions.FACTION_STAR_DEFENDERS = 0; // Star Defenders
		sdFactions.FACTION_FALKOK = 1; // Falkoks
		sdFactions.FACTION_ERTHAL = 2; // Erthals
		sdFactions.FACTION_COUNCIL = 3; // Council
		sdFactions.FACTION_SARRONIAN = 4; // Sarronians & Zektaron
		sdFactions.FACTION_VELOX = 5; // Velox
		sdFactions.FACTION_SETR = 6; // Setr
		sdFactions.FACTION_TZYRG = 7; // Tzyrg
		sdFactions.FACTION_SHURG = 8; // Shurg
		sdFactions.FACTION_FALKONIAN_SWORD_BOT = 9; // Falkonian Sword Bot ( Boss )
		sdFactions.FACTION_STAR_DEFENDERS_RESCUE = 10; // Rescue Star Defender
		sdFactions.FACTION_STAR_DEFENDERS_ARREST = 11; // Arrest Star Defender
		sdFactions.FACTION_TIME_SHIFTER = 12; // Time Shifter ( Boss )

		sdWorld.entity_classes[ this.name ] = this; // Register for object spawn
	}

	// This class is used to simplify humanoid faction storage, faction creation and their humanoid properties - Booraz149
	// Just use sdFactions.SetHumanoidProperties( character_entity, faction = faction number ). Factions are stated inside static init_class() to keep it simple and comprehensible.

	static SetHumanoidProperties( character_entity, faction = -1 ) // This automatically generates a humanoid based off a faction we selected. Must specify character_entity.
	{
		let character_settings;
		if ( faction === sdFactions.FACTION_STAR_DEFENDERS ) // Star Defenders
		{
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
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
		}
		if ( faction === sdFactions.FACTION_FALKOK ) // Falkoks
		{
			if ( Math.random() < 0.14 )
			{
				if ( Math.random() < 0.2 )
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }) );
					character_entity._ai_gun_slot = 4;
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN }) );
					character_entity._ai_gun_slot = 3;
				}
			}
			else
			{ 
				if ( Math.random() < 0.1 )
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }) );
					character_entity._ai_gun_slot = 2;
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE }) );
					character_entity._ai_gun_slot = 2;
				}
			}
			if ( character_entity._ai_gun_slot === 2 ) // Falkok
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );

			if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // Phoenix Falkok
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_PHOENIX_FALKOK );
		}

		if ( faction === sdFactions.FACTION_ERTHAL ) // Erthals
		{
			if ( Math.random() < 0.3 )
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_BURST_RIFLE }) );
				character_entity._ai_gun_slot = 2;
			}
			else
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_PLASMA_PISTOL }) );
				character_entity._ai_gun_slot = 1;
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ERTHAL );
		}

		if ( faction === sdFactions.FACTION_COUNCIL )
		{
			if ( Math.random() < 0.2 )
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_SHOTGUN }) );
				character_entity._ai_gun_slot = 3;
			}
			else
			if ( Math.random() < 0.5 )
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_BURST_RAIL }) );
				character_entity._ai_gun_slot = 4;
			}
			else
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_PISTOL }) );
				character_entity._ai_gun_slot = 1;
			}
			if ( character_entity._ai_gun_slot === 1 || character_entity._ai_gun_slot === 4 ) // Council Acolyte
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL );

			if ( character_entity._ai_gun_slot === 3 ) // Council Vanguard
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL_VANGUARD );
		}

		if ( faction === sdFactions.FACTION_SARRONIAN ) // Sarronians & Zektaron
		{
			if ( Math.random() < 0.4 )
			{
				if ( Math.random() < 0.2 )
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_ENERGY_DISPLACER }) );
					character_entity._ai_gun_slot = 5;
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ZEKTARON_RAILGUN }) );
					character_entity._ai_gun_slot = 4;
				}
			}
			else
			if ( Math.random() < 0.65 )
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ZEKTARON_COMBAT_RIFLE }) );
				character_entity._ai_gun_slot = 2;
			}
			else
			{
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_SMG }) );
				character_entity._ai_gun_slot = 1;
			}

			if ( character_entity._ai_gun_slot === 1 )
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SARRONIAN );
			else
			if ( character_entity._ai_gun_slot === 5 )
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SARRONIAN_HEAVY );
			else
			if ( character_entity._ai_gun_slot === 2 )
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ZEKTARON_ASSAULT );
			else
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ZEKTARON_SEEKER );
		}

		if ( faction === sdFactions.FACTION_VELOX ) // Velox
		{
			if ( Math.random() < 0.35 )
			{
				if ( Math.random() < 0.25 )
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAIL_CANNON }) );
					character_entity._ai_gun_slot = 4;
				}
				else
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_COMBAT_RIFLE }) );
					character_entity._ai_gun_slot = 2;
				}
			}
			else
			{ 
				{
					sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_PISTOL }) );
					character_entity._ai_gun_slot = 1;
				}
			}
			if ( character_entity._ai_gun_slot === 1 ) // Velox Combat Pistol Class
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX );

			if ( character_entity._ai_gun_slot === 2 ) // Velox Combat Rifle Class
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX_RIFLE );

			if ( character_entity._ai_gun_slot === 4 ) // Velox Devastator
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_VELOX_DEVASTATOR );

		}

		if ( faction === sdFactions.FACTION_SETR ) // Setr
		{
			if ( Math.random() < 0.2 )
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_LMG }) );
				character_entity._ai_gun_slot = 2;
			}
			else
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_PLASMA_SHOTGUN }) );
				character_entity._ai_gun_slot = 3;
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SETR );
		}

		if ( faction === sdFactions.FACTION_TZYRG ) // Tzyrg
		{
			if ( Math.random() < 0.5 )
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_SHOTGUN }) );
				character_entity._ai_gun_slot = 3;
			}
			else
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_RIFLE }) );
				character_entity._ai_gun_slot = 2;
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TZYRG );
		}

		if ( faction === sdFactions.FACTION_SHURG ) // Shurg
		{
			if ( Math.random() < 0.2 )
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_SNIPER }) );
				character_entity._ai_gun_slot = 4;
			}
			else
			{ 
				sdEntity.entities.push( new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_PISTOL }) );
				character_entity._ai_gun_slot = 1;
			}

			if ( character_entity._ai_gun_slot === 1 ) // Shurg
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SHURG );

			if ( character_entity._ai_gun_slot === 4 ) // Shurg Commander
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SHURG_COMMANDER );
		}
		if ( faction === sdFactions.FACTION_FALKONIAN_SWORD_BOT ) // Falkonian Sword Bot
		{
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKONIAN_SWORD_BOT );
		}
		if ( faction === sdFactions.FACTION_STAR_DEFENDERS_RESCUE ) // Rescue Star Defenders
		{
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
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
		}
		if ( faction === sdFactions.FACTION_STAR_DEFENDERS_ARREST ) // Arrest Star Defenders
		{
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
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
		}
		if ( faction === sdFactions.FACTION_TIME_SHIFTER) // Time Shifter
		{
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TIME_SHIFTER );
		}

		/*if ( faction !== -1 )
		return true;
		else
		return false;*/
	}
}
//sdFactions.init_class();

export default sdFactions;
