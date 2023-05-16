
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
import sdStatusEffect from './sdStatusEffect.js';

class sdFactionTools extends sdEntity
{
	static init_class()
	{
		sdFactionTools.img_character_spawner = sdWorld.CreateImageFromFile( 'helmets/helmet_falkok' );
		sdFactionTools.img_character_spawner2 = sdWorld.CreateImageFromFile( 'helmets/helmet_dino' );
		sdFactionTools.img_character_spawner3 = sdWorld.CreateImageFromFile( 'helmets/helmet_council' );
		sdFactionTools.img_character_spawner4 = sdWorld.CreateImageFromFile( 'helmets/helmet_mythic' );
		sdFactionTools.img_character_spawner5 = sdWorld.CreateImageFromFile( 'helmets/helmet_velox' );
		sdFactionTools.img_character_spawner6 = sdWorld.CreateImageFromFile( 'helmets/helmet_eyes' );
		sdFactionTools.img_character_spawner7 = sdWorld.CreateImageFromFile( 'helmets/helmet_skeleton' );
		sdFactionTools.img_character_spawner8 = sdWorld.CreateImageFromFile( 'helmets/helmet_oxide' );

		sdFactionTools.FACTIONTOOL_FALKOK = 1; // Falkoks
		sdFactionTools.FACTIONTOOL_ERTHAL = 2; // Erthals
		sdFactionTools.FACTIONTOOL_COUNCIL = 3; // Council
		sdFactionTools.FACTIONTOOL_SARRORIAN = 4; // Sarrorian
		sdFactionTools.FACTIONTOOL_VELOX = 5; // Velox
		sdFactionTools.FACTIONTOOL_SETR = 6; // Setr
		sdFactionTools.FACTIONTOOL_TZYRG = 7; // Tzyrg
		sdFactionTools.FACTIONTOOL_SHURG = 8; // Shurg

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
		
		if ( this.type === sdFactionTools.FACTIONTOOL_FALKOK ) // Falkok
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner, - 16, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FACTIONTOOL_SARRORIAN )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner4, - 16, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FACTIONTOOL_VELOX )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner5, - 16, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FACTIONTOOL_SETR )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner6, - 16, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FACTIONTOOL_TZYRG )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner7, - 16, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FACTIONTOOL_ERTHAL )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner2, - 32, - 32, 64,64 );
		}
		if ( this.type === sdFactionTools.FACTIONTOOL_SHURG )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner8, - 16, - 16, 32,32 );
		}
		if ( this.type === sdFactionTools.FACTIONTOOL_COUNCIL )
		{
			ctx.drawImageFilterCache( sdFactionTools.img_character_spawner3, - 16, - 16, 32,32 );
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
			if ( this.type === sdFactionTools.FACTIONTOOL_FALKOK ) // Falkok spawner
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_FALKOK );
				}
			}
			else
			if ( this.type === sdFactionTools.FACTIONTOOL_SARRORIAN )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_SARRORIAN );
				}
			}
			else
			if ( this.type === sdFactionTools.FACTIONTOOL_VELOX )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_VELOX );
				}
			}
			else
			if ( this.type === sdFactionTools.FACTIONTOOL_SETR )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_SETR );
				}
			}
			else
			if ( this.type === sdFactionTools.FACTIONTOOL_TZYRG )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_TZYRG );
				}
			}
			else
			if ( this.type === sdFactionTools.FACTIONTOOL_ERTHAL )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_ERTHAL );
				}
			}
			else
			if ( this.type === sdFactionTools.FACTIONTOOL_SHURG )
			{
				sdSound.PlaySound({ name:'teleport', x:this.x, y:this.y, pitch: 1, volume:1 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_FALKOK });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_SHURG );
				}
			}
			else
			if ( this.type === sdFactionTools.FACTIONTOOL_COUNCIL )
			{
				sdSound.PlaySound({ name:'council_teleport', x:this.x, y:this.y, volume:0.5 });
				sdWorld.SendEffect({ x:this.x, y:this.y, type:sdEffect.TYPE_TELEPORT, filter:'hue-rotate(' + ~~( 170 ) + 'deg)' });

				let character_entity = new sdCharacter({ x:this.x, y:this.y, _ai_enabled:sdCharacter.AI_MODEL_AGGRESSIVE });
				sdEntity.entities.push( character_entity );
				{
					sdFactions.SetHumanoidProperties( character_entity, sdFactions.FACTION_COUNCIL );

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

			this.remove();
		}
	}
}

export default sdFactionTools;