
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEffect from './sdEffect.js';
import sdBlock from './sdBlock.js';
import sdGib from './sdGib.js';
import sdLost from './sdLost.js';
import sdCable from './sdCable.js';
import sdEntity from './sdEntity.js';
import sdNode from './sdNode.js';
import sdBullet from './sdBullet.js';
import sdPortal from './sdPortal.js';
import sdOverlord from './sdOverlord.js';
import sdCom from './sdCom.js';
import sdWater from './sdWater.js';
import sdBloodDecal from './sdBloodDecal.js';
import sdBG from './sdBG.js';


class sdGibClass
{
	static init_class()
	{
		/*
		
			Uses defined indices in order to optimize performance AND to keep gun classes compatible across different snapshots.
		
			Will also check for Index problems and tell you if any of changes that are done will cause server to crash eventually (cases like missing indices between few existing indices and index intersection)
		
			Variables prefixed as sdGib.CLASS_* are the indices, here they are assigned during gib class object creation and specify index at sdGib.classes array where bug class object will exist.
		
			You can execute this:
				sdWorld.entity_classes.sdGib.classes
			in devTools console in order to see how it will be stored in the end.
			
			Sure we could insert classes by doing something like sdGib.classes.push({ ... }); but that would not store index of class in array for later quick spawning of new guns.
			We could also do something like sdGib.classes[ sdGib.classes.length ] = { ... }; but that would not give us consistency across different versions of the game and also it seems 
				like sometimes whoever adds new classes seems to be addin them in the middle of the list. Don't do that - add them at the very end.
		
			Once sdGib-s are saved to snapshots only their ID is saved. It means that if IDs will be changed - it is quite possible to convert existing sdGib.CLASS_TRIPLE_RAIL into sdGib.FISTS which isn't event 
				a spawnable gun (only projectile properties are copied from it).
		
			Now press "Ctrl + Shift + -" if you are in NetBeans and go do the impressive!
		
		*/
		sdGib.classes[ sdGib.CLASS_VELOX_MECH_HEAD = 0 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'gibs/velox_mech_head' ), // Make sure your gib image is in /gibs folder
			hitbox_x1: -12,
			hitbox_x2: 12,
			hitbox_y1: -10,
			hitbox_y2: 10,
			mass: 100,
			health: 300,
			blood: 0 // 0 = wall_hit effect
			
		};

		sdGib.classes[ sdGib.CLASS_CUBE_GIB = 1 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'gibs/cube_gib' ), // Make sure your gib image is in /gibs folder
			hitbox_x1: -3,
			hitbox_x2: 3,
			hitbox_y1: -3,
			hitbox_y2: 3,
			mass: 15,
			health: 100,
			blood: 0, // 0 = wall_hit effect
			effect_when_removed: false // Entity break effect when the gib is removed?
			
		};

		sdGib.classes[ sdGib.CLASS_QUICKIE_LIMB = 2 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'gibs/quickie_limb' ), // Make sure your gib image is in /gibs folder
			hitbox_x1: -2,
			hitbox_x2: 2,
			hitbox_y1: -2,
			hitbox_y2: 2,
			mass: 10,
			health: 50,
			blood: 1 // 1 = green blood. Hue determined from parameters in sdWorld.SpawnGib
			
		};

		sdGib.classes[ sdGib.CLASS_ASP_GIBS = 3 ] = 
		{	// This one is a spritesheet. Make sure spritesheets are horizontal only.
			image: sdWorld.CreateImageFromFile( 'gibs/asp_gibs' ), // Make sure your gib image is in /gibs folder
			hitbox_x1: -3,
			hitbox_x2: 3,
			hitbox_y1: -3,
			hitbox_y2: 3,
			mass: 10,
			health: 50,
			blood: 1 // 1 = green blood
		};
		sdGib.classes[ sdGib.CLASS_BITER_GIBS = 4 ] = 
		{	// This one is a spritesheet. Make sure spritesheets are horizontal only.
			image: sdWorld.CreateImageFromFile( 'gibs/biter_gibs' ), // Make sure your gib image is in /gibs folder
			hitbox_x1: -2,
			hitbox_x2: 2,
			hitbox_y1: -2,
			hitbox_y2: 2,
			mass: 8,
			health: 40,
			blood: 1 // 1 = green blood
		};
		sdGib.classes[ sdGib.CLASS_FALKOK_DRONE_PARTS = 5 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'gibs/drone_falkok_parts' ), // Make sure your gib image is in /gibs folder
			hitbox_x1: -4,
			hitbox_x2: 4,
			hitbox_y1: -4,
			hitbox_y2: 4,
			mass: 20,
			health: 100,
			blood: 0 // 0 = wall_hit effect
			
		};
		// Add new gib classes above this line //
		
		let index_to_const = [];
		for ( let s in sdGib )
		if ( s.indexOf( 'CLASS_' ) === 0 )
		{
			if ( typeof sdGib[ s ] !== 'number' )
			throw new Error( 'Check sdGibClass for a place where gun class index '+s+' is set - it has value '+sdGib[ s ]+' but should be a number in order to things work correctly' );
			if ( typeof sdGib.classes[ sdGib[ s ] ] !== 'object' )
			throw new Error( 'Check sdGibClass for a place where class '+s+' is defined. It looks like there is a non-object in sdGib.classes array at this slot' );
			if ( index_to_const[ sdGib[ s ] ] === undefined )
			index_to_const[ sdGib[ s ] ] = s;
			else
			throw new Error( 'Check sdGibClass for a place where index value is assigned - it looks like there is ID conflict for ID '+sdGib[ s ]+'. Both: '+s+' and '+index_to_const[ sdGib[ s ] ]+' point at the exact same ID. Not keeping IDs of different gun classes as unique will cause replacement of one class with another when it comes to spawning by ID.' );
		}
	}
}

export default sdGibClass;
