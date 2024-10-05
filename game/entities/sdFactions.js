
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
			let gun;
			if ( Math.random() < 0.5 ) // Random gun given to Star Defender
			{
				if ( Math.random() < 0.2 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 4;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 3;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			else
			{ 
				if ( Math.random() < 0.1 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER );
		}
		if ( faction === sdFactions.FACTION_FALKOK ) // Falkoks
		{
			let gun;
			if ( Math.random() < 0.14 )
			{
				if ( Math.random() < 0.2 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_PSI_CUTTER }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 4;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAYGUN });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 3;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			else
			{ 
				if ( Math.random() < 0.1 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_F_MARKSMAN }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_FALKOK_RIFLE });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			if ( character_entity._ai_gun_slot === 2 ) // Falkok
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_FALKOK );

			if ( character_entity._ai_gun_slot === 3 || character_entity._ai_gun_slot === 4 ) // Phoenix Falkok
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_PHOENIX_FALKOK );
		}

		if ( faction === sdFactions.FACTION_ERTHAL ) // Erthals
		{
			let gun;
			if ( Math.random() < 0.3 )
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_BURST_RIFLE }); // Works better for vehicle scenarios
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 2;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			else
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ERTHAL_PLASMA_PISTOL });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 1;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_ERTHAL );
		}

		if ( faction === sdFactions.FACTION_COUNCIL )
		{
			let gun;
			if ( Math.random() < 0.2 )
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_SHOTGUN });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 3;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			else
			if ( Math.random() < 0.5 )
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_BURST_RAIL });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 4;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			else
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_COUNCIL_PISTOL });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 1;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			if ( character_entity._ai_gun_slot === 1 || character_entity._ai_gun_slot === 4 ) // Council Acolyte
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL );

			if ( character_entity._ai_gun_slot === 3 ) // Council Vanguard
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_COUNCIL_VANGUARD );
		}

		if ( faction === sdFactions.FACTION_SARRONIAN ) // Sarronians & Zektaron
		{
			let gun;
			if ( Math.random() < 0.4 )
			{
				if ( Math.random() < 0.2 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_ENERGY_DISPLACER });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 5;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_ZEKTARON_RAILGUN });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 4;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			else
			if ( Math.random() < 0.65 )
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_ZEKTARON_COMBAT_RIFLE });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 2;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			else
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SARRONIAN_SMG });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 1;
				gun.onMovementInRange( character_entity ); // Force pickup
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
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RAIL_CANNON });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 4;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_COMBAT_RIFLE });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			else
			{ 
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_VELOX_PISTOL });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 1;
					gun.onMovementInRange( character_entity ); // Force pickup
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
			let gun;
			if ( Math.random() < 0.2 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_LMG });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SETR_PLASMA_SHOTGUN });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 3;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_SETR );
		}

		if ( faction === sdFactions.FACTION_TZYRG ) // Tzyrg
		{
			let gun;
			if ( Math.random() < 0.5 )
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_SHOTGUN });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 3;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			else
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_TZYRG_RIFLE });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 2;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_TZYRG );
		}

		if ( faction === sdFactions.FACTION_SHURG ) // Shurg
		{
			let gun;
			if ( Math.random() < 0.2 )
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_SNIPER });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 4;
				gun.onMovementInRange( character_entity ); // Force pickup
			}
			else
			{
				gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHURG_PISTOL });
				sdEntity.entities.push( gun );
					
				character_entity._ai_gun_slot = 1;
				gun.onMovementInRange( character_entity ); // Force pickup
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
			let gun;
			if ( Math.random() < 0.5 ) // Random gun given to Star Defender
			{
				if ( Math.random() < 0.2 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 4;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 3;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			else
			{ 
				if ( Math.random() < 0.1 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_RESCUE );
		}
		if ( faction === sdFactions.FACTION_STAR_DEFENDERS_ARREST ) // Arrest Star Defenders
		{
			let gun;
			if ( Math.random() < 0.5 ) // Random gun given to Star Defender
			{
				if ( Math.random() < 0.2 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SNIPER }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 4;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_SHOTGUN }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 3;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			else
			{ 
				if ( Math.random() < 0.1 )
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_LMG }); // Works better for vehicle scenarios
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
				else
				{
					gun = new sdGun({ x:character_entity.x, y:character_entity.y, class:sdGun.CLASS_RIFLE });
					sdEntity.entities.push( gun );
					
					character_entity._ai_gun_slot = 2;
					gun.onMovementInRange( character_entity ); // Force pickup
				}
			}
			sdFactionskin.SetHumanoidSkinClass( character_entity, sdFactionskin.SKIN_STAR_DEFENDER_ARREST );
		}
		if ( faction === sdFactions.FACTION_TIME_SHIFTER ) // Time Shifter
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
