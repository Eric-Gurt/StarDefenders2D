
import sdWorld from '../sdWorld.js';
import sdSound from '../sdSound.js';
import sdEffect from './sdEffect.js';
import sdCharacter from './sdCharacter.js';
import sdBlock from './sdBlock.js';
import sdGun from './sdGun.js';
import sdLost from './sdLost.js';
import sdCable from './sdCable.js';
import sdEntity from './sdEntity.js';
import sdNode from './sdNode.js';
import sdBullet from './sdBullet.js';
import sdPortal from './sdPortal.js';
import sdJunk from './sdJunk.js';
import sdOverlord from './sdOverlord.js';
import sdCom from './sdCom.js';
import sdWater from './sdWater.js';
import sdBloodDecal from './sdBloodDecal.js';
import sdBG from './sdBG.js';
import sdCube from './sdCube.js';
import sdCrystal from './sdCrystal.js';
import sdStatusEffect from './sdStatusEffect.js';
import sdStorageTank from './sdStorageTank.js';
import sdEssenceExtractor from './sdEssenceExtractor.js';
import sdLandMine from './sdLandMine.js';
import sdDoor from './sdDoor.js';
import sdBaseShieldingUnit from './sdBaseShieldingUnit.js';
import sdArea from './sdArea.js';
//import sdSteeringWheel from './sdSteeringWheel.js';


/*

	Spritesheet suggestion:

	level1_idle		| level2_idle	| level3_idle	| level4_idle 
	attack1			| attack1		| attack1		| attack1 
	attack2			| attack2		| attack2		| attack2 
	attack3			| attack3		| attack3		| attack3 
	reload1			| reload1		| reload1		| reload1 
	reload2			| reload2		| reload2		| reload2 
	reload3			| reload3		| reload3		| reload3 
	reload4			| reload4		| reload4		| reload4 
	attachment1		| attachment2	| attachment3	| attachment4

*/

class sdGunClass
{
	static init_class()
	{
		function AddRecolorsFromColorAndCost( arr, from_color, cost, prefix='', category='' )
		{
			/*let colors = [
				'cyan', '#00fff6',
				'yellow', '#ffff00',
				'white', '#dddddd',
				'pink', '#ff00ff',
				
				'red', '#fb6464',
				'green', '#31ff6b',
				'blue', '#213eec',
				'dark', '#434447',
				'bright-pink', '#ffa2e1'
			];
			
			for ( let i = 0; i < colors.length; i += 2 )
			arr.push(
			{ 
				title: 'Make ' + ( prefix ? prefix + ' ' : '' ) + colors[ i ],
				cost: cost,
				category: category,
				hint_color: colors[ i + 1 ],
				action: ( gun, initiator=null )=>
				{ 
					if ( !gun.sd_filter )
					gun.sd_filter = sdWorld.CreateSDFilter();
				
					sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, from_color, colors[ i + 1 ] );
				}
			});*/
			
			arr.push(
			{ 
				title: 'Customize ' + ( prefix ? prefix + ' ' : '' ) + 'color',
				cost: cost,
				category: category,
				//hint_color: '#ff0000', // Should be guessed from gun
				color_picker_for: from_color,
				action: ( gun, initiator=null, hex_color=null )=> // action method is called with 3rd parameter only because .color_picker_for is causing sdWeaponBench to send extra parameters at .AddColorPickerContextOption . It does not send first parameter from "parameters_array" which is passed to .ExecuteContextCommand as it contains just upgrade ID, which is pointless here (yes, it converts array into function arguments)
				{ 
					if ( typeof hex_color === 'string' && hex_color.length === 7 ) // ReplaceColorInSDFilter_v2 does the type check but just in case
					{
						if ( !gun.sd_filter )
						gun.sd_filter = sdWorld.CreateSDFilter( true );

						// Pass custom hex colors to this function

						sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, from_color, hex_color );
						//sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, from_color, '#00ff00' );
					}
				}
			});
			
			for ( let i = 0; i < arr.length; i++ )
			if ( arr[ i ].title === 'Remove colors' )
			if ( arr[ i ].category === category )
			{
				arr.splice( i, 1 );
				i--;
				continue;
			}
			
			arr.push(
			{ 
				title: 'Remove colors',
				cost: cost,
				category: category,
				action: ( gun, initiator=null )=>
				{ 
					gun.sd_filter = null;
				}
			});
			
			return arr;
		}
		function AppendBasicCubeGunRecolorUpgrades( arr )
		{
			AddRecolorsFromColorAndCost( arr, '#00fff6', 100 );
			
			return arr;
		}
		function AddShotgunAmmoTypes( arr )
		{
			arr.push(
			{ 
				title: 'Convert ammo type to slug pellets',
				cost: 100,
				action: ( gun, initiator=null )=>
				{ 
					gun._spread = 0; // Perhaps it should take properties from sdGunClass, although it's the same?
				}
			});

			arr.push(
			{ 
				title: 'Add incediary ammo to shotgun',
				cost: 200,
				action: ( gun, initiator=null )=>
				{ 
					gun._temperature_addition = 800; // Perhaps it should take properties from sdGunClass, although it's the same?
				}
			});

			/*arr.push(
			{ 
				title: 'Add freezing ammo to shotgun',
				cost: 200,
				action: ( gun, initiator=null )=>
				{ 
					gun._temperature_addition = -800; // Perhaps it should take properties from sdGunClass, although it's the same?
				}
			});*/
			
			arr.push(
			{ 
				title: 'Revert projectile type to default',
				cost: 0,
				action: ( gun, initiator=null )=>
				{ 
					gun._spread = sdGun.classes[ gun.class ].spread; // Perhaps it should take properties from sdGunClass, although it's the same?
					gun._temperature_addition = 0; // Remove Dragon's breath aswell
				}
			});
			
			return arr;
		}
		

		let ID_BASE = 0;
		let ID_STOCK = 1;
		let ID_MAGAZINE = 2;
		let ID_BARREL = 3;
		let ID_UNDERBARREL = 4;
		let ID_MUZZLE = 5;
		let ID_SCOPE = 6;
		let ID_DAMAGE_MULT = 7;
		let ID_FIRE_RATE = 8;
		let ID_RECOIL_SCALE = 9;
		let ID_HAS_EXPLOSION = 10;
		let ID_TEMPERATURE_APPLIED = 11;
		let ID_HAS_SHOTGUN_EFFECT = 12;
		let ID_HAS_RAIL_EFFECT = 13;
		let ID_SLOT = 14;
		let ID_TITLE = 15;
		let ID_PROJECTILE_COLOR = 16;
		let ID_DAMAGE_VALUE = 17; // For non custom-guns so it can display damage properly.
		let ID_ALT_DAMAGE_VALUE = 18;
		let ID_HAS_EXALTED_CORE = 19; // Exalted core, final weapon damage multiplier by 25%
		let ID_HAS_CUBE_FUSION_CORE = 20; // Cube fusion core, final weapon matter cost reduction by 25%
		
		function UpdateCusomizableGunProperties( gun )
		{
			gun._count = gun.extra[ ID_HAS_SHOTGUN_EFFECT ] ? 5 : 1;
			gun._spread = gun.extra[ ID_HAS_SHOTGUN_EFFECT ] ? 0.2 : ( 0.1 * gun.extra[ ID_RECOIL_SCALE ] );
			gun._reload_time = ( gun.extra[ ID_HAS_RAIL_EFFECT ] ? 2 : 1 ) * ( gun.extra[ ID_HAS_SHOTGUN_EFFECT ] ? 5 : 1 ) * ( sdGun.classes[ gun.class ].reload_time / sdGun.classes[ gun.class ].parts_magazine[ gun.extra[ ID_MAGAZINE ] ].rate ) * gun.extra[ ID_FIRE_RATE ];
			
			gun._temperature_addition = gun.extra[ ID_TEMPERATURE_APPLIED ];
			
			if ( gun.extra[ ID_HAS_SHOTGUN_EFFECT ] )
			gun.extra[ ID_SLOT ] = 3;
			else
			if ( gun.extra[ ID_HAS_RAIL_EFFECT ] )
			gun.extra[ ID_SLOT ] = 4;
			else
			if ( gun.extra[ ID_HAS_EXPLOSION ] )
			gun.extra[ ID_SLOT ] = 5;
			else
			gun.extra[ ID_SLOT ] = 2;
		
			gun.ammo_left = Math.min( gun.ammo_left, gun.GetAmmoCapacity() );
		}
		
		function hasNoExtra( gun, initiator )
		{
			// Sometimes extra is 0, probably whenever taken from other server
			
			if ( gun.extra instanceof Object )
			{
				return false; // All fine
			}
			else
			{
				if ( initiator )
				if ( initiator._socket )
				initiator._socket.SDServiceMessage( 'This device does not support upgrades.' );

				return true;
			}
		}
					
		function AddGunEditorUpgrades( custom_rifle_upgrades=[] )
		{
			function AddCustomizationUpgrade( custom_rifle_upgrades, id, class_prop )
			{
				custom_rifle_upgrades.push(
						{
							title: 'Change ' + class_prop.split( 'parts_' ).join( '' ), 
							cost: 0, 
							//represents_category: '',
							category: 'customize_parts',
							action: ( gun, initiator=null )=> 
							{
								if ( hasNoExtra( gun, initiator ) )
								return false;

								if ( sdGun.classes[ gun.class ][ class_prop ].length > 0 )
								{
									gun.extra[ id ] = ( ( gun.extra[ id ] || 0 ) + 1 ) % sdGun.classes[ gun.class ][ class_prop ].length; 
									UpdateCusomizableGunProperties( gun );
								}
								else
								{
									if ( initiator )
									if ( initiator._socket )
									initiator._socket.SDServiceMessage( 'Gun class does not support '+class_prop.split( 'parts_' ).join( '' )+' altering.' );
								}
							} 
						} 
				);
		
				return custom_rifle_upgrades;
			}

			AddCustomizationUpgrade( custom_rifle_upgrades, ID_BASE, 'parts_base' );
			AddCustomizationUpgrade( custom_rifle_upgrades, ID_STOCK, 'parts_stock' );
			AddCustomizationUpgrade( custom_rifle_upgrades, ID_MAGAZINE, 'parts_magazine' );
			AddCustomizationUpgrade( custom_rifle_upgrades, ID_BARREL, 'parts_barrel' );
			AddCustomizationUpgrade( custom_rifle_upgrades, ID_UNDERBARREL, 'parts_underbarrel' );
			AddCustomizationUpgrade( custom_rifle_upgrades, ID_MUZZLE, 'parts_muzzle' );
			AddCustomizationUpgrade( custom_rifle_upgrades, ID_SCOPE, 'parts_scope' );
			
			custom_rifle_upgrades.push(
				{
					title: 'Customize parts...', 
					represents_category: 'customize_parts'
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Customize colors...', 
					represents_category: 'customize_colors'
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Customize properties...', 
					represents_category: 'customize_properties'
				} 
			);
	
		
	
			custom_rifle_upgrades.push(
				{
					title: 'Randomize projectile color', 
					cost: 0, 
					category: 'customize_colors',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_PROJECTILE_COLOR ] = '#';
						let str = '0123456789abcdef';
						for ( let i = 0; i < 6; i++ )
						gun.extra[ ID_PROJECTILE_COLOR ] += str.charAt( ~~( Math.random() * str.length ) );
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Randomize fire sound', 
					cost: 0, 
					category: 'customize_colors',
					action: ( gun, initiator=null )=> 
					{
						let options = [];
						for ( let i = 0; i < sdGun.classes.length; i++ )
						{
							if ( sdGun.classes[ i ] )
							if ( sdGun.classes[ i ].sound )
							if ( options.indexOf( sdGun.classes[ i ].sound ) === -1 )
							{
								options.push( sdGun.classes[ i ].sound );
							}
						}
						if ( options.length > 0 )
						{
							gun._sound = options[ ~~( Math.random() * options.length ) ];
						}
						gun._sound_pitch = 0.5 + Math.pow( Math.random(), 2 ) * 2;
					} 
				} 
			);
			/*AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#000000', 0, '', 'customize_colors_main' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#404040', 0, '', 'customize_colors_dark' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#808080', 0, '', 'customize_colors_bright' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#6ca2d0', 0, '', 'customize_colors_energy' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#ff0000', 0, '', 'customize_colors_laser' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#9d822f', 0, '', 'customize_colors_bullets' );*/
			
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#000000', 0, 'main', 'customize_colors' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#404040', 0, 'dark', 'customize_colors' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#808080', 0, 'bright', 'customize_colors' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#6ca2d0', 0, 'energy', 'customize_colors' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#ff0000', 0, 'laser', 'customize_colors' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#9d822f', 0, 'magazine', 'customize_colors' );
			
			custom_rifle_upgrades.push(
				{
					title: 'Increase damage', 
					cost: 500, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						if ( gun.extra[ ID_DAMAGE_MULT ] < 3 )
						{
							gun.extra[ ID_DAMAGE_MULT ] += 0.05; // 5%
							//gun.extra[ ID_RECOIL_SCALE ] *= 0.95; // 5%
							UpdateCusomizableGunProperties( gun );
						}
						else
						{
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
					
							return false; // Do not subtract matter
						}
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Decrease damage', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						if ( gun.extra[ ID_DAMAGE_MULT ] > 0 )
						{
							gun.extra[ ID_DAMAGE_MULT ] = Math.max( 0, gun.extra[ ID_DAMAGE_MULT ] - 0.05 ); // 5%
							//gun.extra[ ID_RECOIL_SCALE ] *= 1.05; // 5%
							UpdateCusomizableGunProperties( gun );
						}
						else
						{
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
					
							return false; // Do not subtract matter
						}
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Increase projectile temperature', 
					cost: 250, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						//if ( gun.extra[ ID_TEMPERATURE_APPLIED ] < 750 )
						if ( gun.extra[ ID_TEMPERATURE_APPLIED ] < 500 )
						{
							gun.extra[ ID_TEMPERATURE_APPLIED ] += 20;
							UpdateCusomizableGunProperties( gun );
						}
						else
						{
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
					
							return false; // Do not subtract matter
						}
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Decrease projectile temperature', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						//if ( gun.extra[ ID_TEMPERATURE_APPLIED ] > -750 )
						//if ( gun.extra[ ID_TEMPERATURE_APPLIED ] > -273.15 )
						if ( gun.extra[ ID_TEMPERATURE_APPLIED ] > 0 )
						{
							gun.extra[ ID_TEMPERATURE_APPLIED ] -= 20;
							UpdateCusomizableGunProperties( gun );
						}
						else
						{
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
					
							return false; // Do not subtract matter
						}
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Increase fire rate', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_FIRE_RATE ] = Math.max( 1, gun.extra[ ID_FIRE_RATE ] - 0.1 );
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Decrease fire rate', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_FIRE_RATE ] = Math.min( 10, gun.extra[ ID_FIRE_RATE ] + 0.1 );
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Improve recoil control', 
					cost: 250, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_RECOIL_SCALE ] *= 0.95; // 5%
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Worsen recoil control', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_RECOIL_SCALE ] = Math.min( 2, gun.extra[ ID_RECOIL_SCALE ] * 1.05 ); // Limit recoil decreasing so it doesn't crash server
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
	
			custom_rifle_upgrades.push(
				{
					title: 'Toggle rail mode', 
					cost: 500, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_HAS_RAIL_EFFECT ] = 1 - gun.extra[ ID_HAS_RAIL_EFFECT ];
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Toggle explosive mode', 
					cost: 500, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_HAS_EXPLOSION ] = 1 - gun.extra[ ID_HAS_EXPLOSION ];
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Toggle shotgun mode', 
					cost: 100, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_HAS_SHOTGUN_EFFECT ] = 1 - gun.extra[ ID_HAS_SHOTGUN_EFFECT ];
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Toggle biometry lock', 
					cost: 500, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{
						if ( initiator )
						{
							if ( gun.biometry_lock === -1 )
							gun.biometry_lock = initiator.biometry;
							else
							gun.biometry_lock = -1;
						}
						UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
	
			return custom_rifle_upgrades;
		}


		// Function below for regular non custom guns

		function AddGunDefaultUpgrades( normal_rifle_upgrades=[] )
		{
			normal_rifle_upgrades.push(
				{
					title: 'Customize properties...', 
					represents_category: 'customize_properties'
				} 
			);
			normal_rifle_upgrades.push(
				{
					title: 'Randomize projectile color', 
					cost: 0, 
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_PROJECTILE_COLOR ] = '#';
						let str = '0123456789abcdef';
						for ( let i = 0; i < 6; i++ )
						gun.extra[ ID_PROJECTILE_COLOR ] += str.charAt( ~~( Math.random() * str.length ) );
					} 
				} 
			);

			normal_rifle_upgrades.push(
				{
					title: 'Increase damage', 
					cost: 2, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						if ( gun.extra[ ID_DAMAGE_MULT ] < 2 )
						{
							gun.extra[ ID_DAMAGE_MULT ] += 0.05; // 5%
						}
						else
						{
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
					
							return false; // Do not subtract matter
						}
					} 
				} 
			);
			normal_rifle_upgrades.push(
				{
					title: 'Decrease damage', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						if ( gun.extra[ ID_DAMAGE_MULT ] > 0 )
						{
							gun.extra[ ID_DAMAGE_MULT ] = Math.max( 0, gun.extra[ ID_DAMAGE_MULT ] - 0.05 ); // 5%
						}
						else
						{
							if ( initiator && initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
					
							return false; // Do not subtract matter
						}
					} 
				} 
			);
		
			normal_rifle_upgrades.push(
				{
					title: 'Improve recoil control', 
					cost: 1, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_RECOIL_SCALE ] *= 0.95; // 5%
						//UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			normal_rifle_upgrades.push(
				{
					title: 'Worsen recoil control', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( hasNoExtra( gun, initiator ) )
						return false;
					
						gun.extra[ ID_RECOIL_SCALE ] = Math.min( 2, gun.extra[ ID_RECOIL_SCALE ] * 1.05 ); // Limit recoil decreasing so it doesn't crash server
						//UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			/*normal_rifle_upgrades.push(
				{
					title: 'Toggle biometry lock', 
					cost: 500, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( initiator )
						{
							if ( gun.biometry_lock === -1 )
							gun.biometry_lock = initiator.biometry;
							else
							gun.biometry_lock = -1;
						}
						//UpdateCusomizableGunProperties( gun );
					} 
				} 
			);*/
			// Not sure if biometry lock is needed, since we can just turn it off in bench anyway
	
			return normal_rifle_upgrades;
		}
		/*
		
			Uses defined indices in order to optimize performance AND to keep gun classes compatible across different snapshots.
		
			Will also check for Index problems and tell you if any of changes that are done will cause server to crash eventually (cases like missing indices between few existing indices and index intersection)
		
			Variables prefixed as sdGun.CLASS_* are the indices, here they are assigned during gun class object creation and specify index at sdGun.classes array where bug class object will exist.
		
			You can execute this:
				sdWorld.entity_classes.sdGun.classes
			in devTools console in order to see how it will be stored in the end.
			
			Sure we could insert classes by doing something like sdGun.classes.push({ ... }); but that would not store index of class in array for later quick spawning of new guns.
			We could also do something like sdGun.classes[ sdGun.classes.length ] = { ... }; but that would not give us consistency across different versions of the game and also it seems 
				like sometimes whoever adds new classes seems to be addin them in the middle of the list. Don't do that - add them at the very end.
		
			Once sdGun-s are saved to snapshots only their ID is saved. It means that if IDs will be changed - it is quite possible to convert existing sdGun.CLASS_TRIPLE_RAIL into sdGun.FISTS which isn't event 
				a spawnable gun (only projectile properties are copied from it).
		
			Now press "Ctrl + Shift + -" if you are in NetBeans and go do the impressive!
		
		*/
		sdGun.classes[ sdGun.CLASS_PISTOL = 0 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'pistol' ),
			sound: 'gun_pistol',
			title: 'Pistol',
			slot: 1,
			reload_time: 5,
			muzzle_x: 3,
			ammo_capacity: 12,
			spread: 0.01,
			count: 1,
			fire_type: 2,
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties: { _damage: 1 }, // Set the damage value in onMade function ( gun.extra_ID_DAMAGE_VALUE )
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, _knock_scale: 0.03 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] ) // Custom projectile colors?
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				// Done inside sdGun now.
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades(AddRecolorsFromColorAndCost( [], '#808080', 5 ))
			//upgrades: AddRecolorsFromColorAndCost( [], '#808080', 5 )
		};
		
		sdGun.classes[ sdGun.CLASS_RIFLE = 1 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'rifle' ),
			sound: 'gun_rifle',
			title: 'Assault rifle',
			slot: 2,
			reload_time: 3,
			muzzle_x: 7,
			ammo_capacity: 30,
			spread: 0.01, // 0.03
			count: 1,
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties: { _damage: 1 }, // Set the damage value in onMade function ( gun.extra_ID_DAMAGE_VALUE )
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 25; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#ff0000', 15 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_SHOTGUN = 2 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shotgun' ),
			sound: 'gun_shotgun',
			sound_volume: 1,
			title: 'Shotgun',
			slot: 3,
			reload_time: 20,
			muzzle_x: 7,
			ammo_capacity: 8,
			count: 5,
			spread: 0.1,
			matter_cost: 40,
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties: { _damage: 1 }, // Set the damage value in onMade function ( gun.extra_ID_DAMAGE_VALUE )
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = {};
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades:AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddShotgunAmmoTypes([]), '#808080', 5 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_RAILGUN = 3 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'railgun' ),
			image0: [ sdWorld.CreateImageFromFile( 'railgun_reload0' ), sdWorld.CreateImageFromFile( 'railgun_reload1' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'railgun_reload0' ), sdWorld.CreateImageFromFile( 'railgun_reload1' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'railgun' ), sdWorld.CreateImageFromFile( 'railgun' ) ],
			has_images: true,
			sound: 'gun_railgun',
			title: 'Railgun',
			slot: 4,
			reload_time: 30,
			muzzle_x: 6,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 50,
			projectile_properties: { _damage:1, color: '#62c8f2' }, // Set properties inside projectile_properties_dynamic
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, _rail_circled: true, color: '#62c8f2' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 70; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#62c8f2', 20 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_ROCKET = 4 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'rocket' ),
			sound: 'gun_rocket',
			title: 'Rocket launcher',
			slot: 5,
			reload_time: 30,
			muzzle_x: 6,
			ammo_capacity: -1,
			spread: 0.05,
			projectile_velocity: 14,
			count: 1,
			matter_cost: 60,
			projectile_properties: { explosion_radius: 19, model: 'rocket_proj', _damage: 19 * 3, color:sdEffect.default_explosion_color, ac:1, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 },// Set properties inside projectile_properties_dynamic
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 19, model: 'rocket_proj', color:sdEffect.default_explosion_color, ac:1, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 19 * 3; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
					if ( gun.extra[ ID_PROJECTILE_COLOR ] )
					obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#808000', 20 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_MEDIKIT = 5 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'defibrillator' ),
			sound: 'gun_defibrillator',
			title: 'Defibrillator',
			slot: 6,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { _damage: 1 },
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties_dynamic: ( gun )=>{ 
				
				//let obj = { time_left: 2, color: 'transparent', _return_damage_to_owner:true };
				let obj = { time_left: 2, color: 'transparent' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				if ( gun._held_by.hea < gun._held_by.hmax )
				{
					gun._held_by.DamageWithEffect( gun.extra[ ID_DAMAGE_VALUE ] * gun.extra[ ID_DAMAGE_MULT ], null ); // Heal self if HP isn't max. However this healing is unaffected by damage mult and power pack
				}
				return true;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = -20; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_SPARK = 6 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'spark' ),
			sound: 'gun_spark',
			title: 'Spark',
			slot: 8,
			reload_time: 7,
			muzzle_x: 7,
			ammo_capacity: 16,
			count: 1,
			matter_cost: 60,
			projectile_velocity: 16,
			projectile_properties: { _damage: 1, color:'#00ffff' },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 10, model: 'ball', color:'#00ffff', _dirt_mult: 1, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 5; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_BUILD_TOOL = 7 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'buildtool' ),
			sound: 'gun_buildtool2',
			title: 'Build tool',
			slot: 9,
			has_description: [ 'Used for building. Press B to open build menu' ],
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			is_build_gun: true,
			allow_aim_assist: false,
			projectile_properties: { _damage: 0 }
		};
		
		sdGun.classes[ sdGun.CLASS_CRYSTAL_SHARD = 8 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'crystal_shard_variative' ),
			image_variative: true, // version depends on _net_id, can't be controlled manually
			
			title: 'Crystal shard',
			title_dynamic: ( gun )=>
			{
				return 'Crystal shard ( ' + (~~( gun.extra && gun.extra[0] || '?') ) + ' matter )';
			},
			hea: 5,
			//no_tilt: true,
			tilt_snap_sides: 1,
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			apply_shading: false,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( !( gun.extra && gun.extra[ 0 ] ) ) // Remove shards from old versions which will crash the server
				return gun.remove();
				
				if ( character.matter + gun.extra[ 0 ] <= character.matter_max )
				{
					character.matter += gun.extra[ 0 ];
					gun.remove(); 
				}
				else
				if ( character.matter < character.matter_max - 1 )
				{
					gun.extra[ 0 ] -= character.matter_max - character.matter;
					character.matter = character.matter_max;
					
					if ( gun.extra[ 0 ] < 1 )
					gun.remove(); 
				}

				return false; 
			},
			onMade: ( gun )=>
			{
				const normal_ttl_seconds = 9;
				
				gun.ttl = 30 * normal_ttl_seconds * ( 0.7 + Math.random() * 0.3 ); // was 7 seconds, now 9. Will be later extended in case of high tier
				
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ 0 ] = 1; // Matter
					gun.extra[ 1 ] = 0; // Speciality
				}
			}
		};

		sdGun.classes[ sdGun.CLASS_GRENADE_LAUNCHER = 9 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'grenade_launcher' ),
			sound: 'gun_grenade_launcher',
			title: 'Grenade launcher',
			slot: 5,
			reload_time: 20,
			muzzle_x: 6,
			ammo_capacity: -1,
			spread: 0.05,
			count: 1,
			projectile_velocity: 7,
			matter_cost: 60,
			projectile_properties: { damage:1 },
			projectile_velocity_dynamic: ( gun )=> { return 7 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 13, time_left: 30 * 3, model: 'grenade', color:sdEffect.default_explosion_color, is_grenade: true, _dirt_mult: 2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 13 * 2; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_NEEDLE = 10 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'needle' ),
			sound: 'gun_needle',
			sound_volume: 0.4,
			title: 'Needle',
			slot: 4,
			reload_time: 12,
			muzzle_x: null, // It is supposed to be supressed
			ammo_capacity: 10,
			count: 1,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			matter_cost: 60,
			projectile_properties: { _damage: 50, /*_knock_scale:0.01 * 8, */penetrating:true, _dirt_mult: -0.5 },
			projectile_velocity_dynamic: ( gun )=> { return sdGun.default_projectile_velocity * 1.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { penetrating:true, _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 50; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_SWORD = 11 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sword' ),
			//sound: 'gun_medikit',
			title: 'Sword',
			sound: 'sword_attack2',
			image_no_matter: sdWorld.CreateImageFromFile( 'sword_disabled' ),
			slot: 0,
			reload_time: 8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			projectile_velocity: 16 * 1.5,
			projectile_properties: { time_left: 1, _damage: 35, color: 'transparent', _knock_scale:0.025 * 8 },
			projectile_velocity_dynamic: ( gun )=> { return 16 * 1.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 1, color: 'transparent', _knock_scale:0.025 * 8 };
				//obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 35; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#ff0000', 20 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_STIMPACK = 12 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'stimpack' ),
			sound: 'gun_defibrillator',
			title: 'Stimpack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 2,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 250,
			projectile_velocity: 16,
			has_description: [ 'Increases melee attack and reload speed', 'Duration: 20 seconds' ],
			GetAmmoCost: ()=>
			{
				return 100;
			},
			projectile_properties: { time_left: 2, _damage: 30, color: 'transparent', _return_damage_to_owner:true, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( target_entity.IsPlayerClass() )
					{
						//Stimpack effect increases sword attack speed by 2x (excludes Cube Speargun and Time Shifter Blade) and reload speed by 25% of magazine weaponry.
						target_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STIMPACK_EFFECT, t: 30 * 20 }); // 20 seconds of stimpack effect
						//target_entity.AnnounceTooManyEffectsIfNeeded();
						//target_entity.stim_ef = 30 * 30;
						
						//if ( bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_STIMPACK ].slot ] )
						//bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_STIMPACK ].slot ].remove();
					}
				}
			}
		};
		
		sdGun.classes[ sdGun.CLASS_FALKOK_RIFLE = 13 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'f_rifle' ),
			sound: 'gun_f_rifle',
			title: 'Assault Rifle C-01r',
			slot: 2,
			reload_time: 3,
			muzzle_x: 7,
			ammo_capacity: 35,
			spread: 0.02,
			count: 1,
			projectile_properties: { _damage: 25, color:'#afdfff', _dirt_mult: -0.5 },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color:'#afdfff', _dirt_mult: -0.5, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 25; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( [], '#ff0000', 15, 'pointer' ), '#007bcc', 15, 'circles' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_TRIPLE_RAIL = 14 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'triple_rail' ),
			sound: 'cube_attack',
			title: 'Cube-gun',
			slot: 4,
			reload_time: 3,
			muzzle_x: 6,
			ammo_capacity: -1,// 10, // 3
			count: 1,
			projectile_properties: { _rail: true, _damage: 15, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ }, // 70
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 15; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades:
			AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( 
				[
					{ 
						title: 'Upgrade to v2',
						cost: 300,
						action: ( gun, initiator=null )=>{ gun.class = sdGun.CLASS_TRIPLE_RAIL2;
										gun.extra[ ID_DAMAGE_VALUE ] = 15 * 1.2;
										gun._max_dps = ( 30 / gun._reload_time ) * gun.extra[ 17 ] * gun._count;
										}
					}
				]
			) )
		};
		
		sdGun.classes[ sdGun.CLASS_FISTS = 15 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sword' ),
			//sound: 'gun_medikit',
			title: 'Fists',
			image_no_matter: sdWorld.CreateImageFromFile( 'sword_disabled' ),
			slot: 0,
			reload_time: 8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 16 * 1.2,
			spawnable: false,
			projectile_properties: { time_left: 1, _damage: 15, color: 'transparent', _soft:true, _knock_scale:0.4, _custom_target_reaction:( bullet, target_entity )=>
				{
					//debugger;
					//if ( sdCom.com_creature_attack_unignored_classes.indexOf( target_entity.GetClass() ) !== -1 )
					if ( target_entity.GetClass() !== 'sdCharacter' )
					if ( target_entity.is_static || target_entity.GetBleedEffect() === sdEffect.TYPE_WALL_HIT )
					if ( target_entity.GetClass() !== 'sdBlock' || 
						 ( 
							target_entity.material !== sdBlock.MATERIAL_GROUND &&
							target_entity.material !== sdBlock.MATERIAL_FLESH &&
							target_entity.material !== sdBlock.MATERIAL_SAND 
						)
					)
					//if ( target_entity.material !== ''
					{
						if ( !bullet._owner._is_being_removed )
						bullet._owner.DamageWithEffect( 5 );
					}
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					if ( !bullet._owner._is_being_removed )
					bullet._owner.DamageWithEffect( 5 );
				}
			}
		};
		
		sdGun.classes[ sdGun.CLASS_SABER = 16 ] = { // Original weapon idea & pull request by Booraz149 ( https://github.com/Booraz149 ), image editing & sound effects by Eric Gurt
			image: sdWorld.CreateImageFromFile( 'sword2b' ),
			sound: 'saber_attack',
			sound_volume: 1.5,
			title: 'Saber',
			image_no_matter: sdWorld.CreateImageFromFile( 'sword2b_disabled' ),
			slot: 0,
			reload_time: 10,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			matter_cost: 90, // Was 200, but I don't feel like this weapon is overpowered enough to have high cost like stimpack does /EG
			min_build_tool_level: 2, // Was available from start before, however MK2 shovel needs this aswell
			projectile_velocity: 20 * 1.5,
			projectile_properties: { time_left: 1, _damage: 60, color: 'transparent', _knock_scale:0.025 * 8, 
				_custom_target_reaction:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5 });
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5 });
				}
			},
			projectile_velocity_dynamic: ( gun )=> { return 20 * 1.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 1, color: 'transparent', _knock_scale:0.025 * 8, 
				_custom_target_reaction:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5 });
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5 });
				}
				};
				//obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 60; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( 
						AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( [], '#ffffff', 30 ), '#0000ff', 30 )
					)
		};
		
		sdGun.classes[ sdGun.CLASS_RAIL_PISTOL = 17 ] = { // Original weapon idea, image & pull request by Booraz149 ( https://github.com/Booraz149 )
			image: sdWorld.CreateImageFromFile( 'rail_pistol' ),
			sound: 'cube_attack',
			sound_pitch: 0.9,
			title: 'Cube-pistol',
			slot: 1,
			reload_time: 3,
			muzzle_x: 4,
			burst: 3,
			burst_reload: 10,
			ammo_capacity: -1,
			count: 1,
			fire_type: 2,
			projectile_properties: { _rail: true, _damage: 22, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 22; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( 
				[
					{ 
						title: 'Upgrade to v2',
						cost: 300,
						action: ( gun, initiator=null )=>{ gun.class = sdGun.CLASS_RAIL_PISTOL2;
										gun.extra[ ID_DAMAGE_VALUE ] = 22 * 1.2;
										gun._max_dps = ( 30 / ( gun._reload_time * sdGun.classes[ gun.class ].burst + sdGun.classes[ gun.class ].burst_reload ) ) * gun.extra[ 17 ] * gun._count * sdGun.classes[ gun.class ].burst;
										}
					}
				]
			) )
		};
		
		sdGun.classes[ sdGun.CLASS_RAYGUN = 18 ] = { // Original sprite and weapon balancing by The_Commander 
			image: sdWorld.CreateImageFromFile( 'raygun_c01y' ),
			image0: [ sdWorld.CreateImageFromFile( 'raygun_c01y0' ), sdWorld.CreateImageFromFile( 'raygun_c01y0b' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'raygun_c01y1' ), sdWorld.CreateImageFromFile( 'raygun_c01y1b' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'raygun_c01y2' ), sdWorld.CreateImageFromFile( 'raygun_c01y2b' ) ],
			has_images: true,
			sound: 'gun_raygun',
			title: 'Ray Gun C-01y',
			slot: 3,
			reload_time: 60, // Might be inaccurate - not checked
			muzzle_x: 9,
			ammo_capacity: -1,
			count: 3,
			projectile_velocity: 14 * 2,
			spread: 0.11, // 0.15,
			projectile_properties: { _damage: 50, color: '#dddddd', penetrating: true }, // I nerfed it's damage from 45 to 40 but that's up to balancing decisions - Booraz149
			spawnable:false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#dddddd', penetrating: true, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 50; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_FALKOK_PSI_CUTTER = 19 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'f_psicutter' ),
			sound: 'gun_psicutter',
			sound_volume: 1.5,
			title: 'Falkonian PSI-cutter',
			slot: 4,
			reload_time: 60,
			muzzle_x: 11,
			ammo_capacity: -1,
			spread: 0.01,
			count: 1,
			projectile_velocity: 10 * 2,  // Slower bullet velocity than sniper but ricochet projectiles
			projectile_properties: { _damage: 82, color:'#00ffff', model: 'f_psicutter_proj'/*, _knock_scale:0.01 * 8*/, penetrating: false, _bouncy: true },
			spawnable:false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color:'#00ffff', model: 'f_psicutter_proj', penetrating: false, _bouncy: true ,_knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 82; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_RAIL_SHOTGUN = 20 ] = { // Image by LazyRain
			image: sdWorld.CreateImageFromFile( 'rail_shotgun' ),
			sound: 'cube_attack',
			sound_pitch: 0.4,
			sound_volume: 2,
			title: 'Cube-shotgun',
			slot: 3,
			reload_time: 20,
			muzzle_x: 8,
			ammo_capacity: -1,
			spread: 0.15,
			count: 5,
			projectile_properties: { _rail: true, _damage: 20, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range, not sure if this should exist for rail shotguns
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				//Rails... not sure if they should have shotgun dirt multiplier since they're rails? - Booraz149
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( [
					{ 
						title: 'Upgrade to v2',
						cost: 1500,
						action: ( gun, initiator=null )=>
						{
							gun.class = sdGun.CLASS_RAIL_SHOTGUN2;
							gun.ResetInheritedGunClassProperties();
							//gun.extra[ ID_DAMAGE_VALUE ] = 20 * 2;
							//gun._max_dps = ( 30 / gun._reload_time ) * gun.extra[ 17 ] * gun._count;
						}
					}
				] ) )
		};		
		
		sdGun.classes[ sdGun.CLASS_RAIL_CANNON = 21 ] = { // sprite by Booraz149
			image: sdWorld.CreateImageFromFile( 'rail_cannon' ),
			image_charging: sdWorld.CreateImageFromFile( 'rail_cannon_charging' ),
			sound: 'gun_railgun',
			sound_pitch: 0.5,
			title: 'Velox Rail Cannon',
			slot: 4,
			reload_time: 18,
			muzzle_x: 10,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { _rail: true, _rail_circled: true, _damage: 62, color: '#FF0000'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, _rail_circled: true, _damage: 62, color: '#FF0000' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				obj._damage *= 1 + ( gun._combo / 45 ); // Scale damage with charging ("Combo" increases the longer player holds the trigger, up to a few seconds)
				
				if ( gun._combo >= 360 ) // Full charge?
				{
					obj.penetrating = true; // Allow penetration
				}
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 62; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
					gun._max_dps = ( gun.extra[ 17 ] * ( 1 + ( 360 / 45 ) ) / 3 ); // Optimal DPS is charging it up for 3 seconds
				}
			},
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				let mult = ( gun.extra[ 20 ] ) ? 0.75 : 1; // Cube fusion core merging reduces weapon matter cost by 25%
				
				return mult * sdGun.GetProjectileCost( gun.GetProjectileProperties(), gun._count, gun._temperature_addition ); // I kinda want it to keep it's matter cost as is
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					{
						if ( ( gun._held_by._key_states.GetKey( 'Mouse1' ) ) || gun._held_by._auto_shoot_in <= 0 ) // Build up damage when holding the Button
						{
							if ( gun._combo === 20 || ( gun._combo === 360 && gun._combo_timer < 5 ) ) // Started charging?
							sdSound.PlaySound({ name:'crystal_combiner_end', x:gun._held_by.x, y:gun._held_by.y, volume:1.25, pitch:2 });
							
							if ( gun._combo === 360 && gun._combo_timer < 5 ) // Case for charging shot after full charge, starts at 50% charge
							gun._combo = 180; // Previous full charge is rewarded by having next shot half-charged
							
							gun._held_by._auto_shoot_in = 2;
							if ( gun._combo < 360 ) // Does not scale infinitely, only to about 3 seconds
							{
								gun._combo++;
								if ( gun._combo === 360 ) // Max charge?
								{
									sdSound.PlaySound({ name:'crystal_combiner_start', x:gun._held_by.x, y:gun._held_by.y, volume:1.25, pitch:4 }); // Let the player know it's max charge
								}
							}
							gun._combo_timer = 10; // Lower value conflicts with max combo and next shot logic
						}
					}
					return false;
				}
				else
				{
					//sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					//sdSound.PlaySound({ name:'gun_railgun', x:gun.x, y:gun.y, pitch: 0.5 });
				
				
					let matter_cost = gun.GetBulletCost();
					
					if ( gun._held_by.matter >= matter_cost )
					if ( !gun._held_by._key_states.GetKey( 'Mouse1' ) ) // Attack on release
					{
						gun._held_by.matter -= matter_cost;
						if ( gun._combo !== 360 )
						gun._combo_timer = 1;
						else
						gun._combo_timer = 21; // This way combo is kept and next shot sets it to 180
					}
				}
				return true;
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#bf1d00', 30 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_CUBE_SHARD = 22 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cube_shard2' ),
			title: 'Cube shard',
			no_tilt: true,
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			apply_shading: false,
			has_description: [ 'Increases max matter capacity on pickup' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				// 20 more levels, 20 * 45 more matter, 4 * 45 matter per shard
				
				//if ( character._upgrade_counters[ 'upgrade_energy' ] )
				//if ( character._upgrade_counters[ 'upgrade_energy' ] < 60 )
				if ( character._matter_capacity_boosters < character._matter_capacity_boosters_max ) // 20 * 45 )
				{
					if ( character._socket )
					sdSound.PlaySound({ name:'cube_shard', x:character.x, y:character.y, volume:1, pitch:1 }, [ character._socket ] );
				
					character._matter_capacity_boosters = Math.min( character._matter_capacity_boosters + 4 * 45, character._matter_capacity_boosters_max );
					character.onScoreChange();
					
					
					//character._upgrade_counters[ 'upgrade_energy' ] = Math.min( 60, character._upgrade_counters[ 'upgrade_energy' ] + 4 );
					//character.matter_max = Math.round( 50 + character._upgrade_counters[ 'upgrade_energy' ] * 45 );
					
					
					/*if ( Math.random() > 0.5 )
					character.Say( "I can use this Cube shard to store matter inside it" );
					else
					character.Say( "Cube shard! These store matter pretty well" );*/
				
					character.Say( "Matter capacity has been upgraded" );
					
					gun.remove(); 
				}

				return false; 
			},
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_LASER_PISTOL = 23 ] = { // sprite by Booraz149, resprite by Gravel
			image: sdWorld.CreateImageFromFile( 'laser_pistol' ),
			sound: 'gun_pistol',
			sound_pitch: 0.7,
			title: 'Laser Pistol',
			slot: 1,
			reload_time: 6,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			muzzle_x: 4,
			ammo_capacity: -1,
			spread: 0.01,
			count: 1,
			spawnable: false,
			fire_type: 2,
			projectile_properties: { _damage: 43, _dirt_mult: -0.5, color: '#cd1e1e' },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, color: '#cd1e1e' }; // Default value for _knock_scale
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 43; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_LMG = 24 ] = { // sprite by LazyRain
			image: sdWorld.CreateImageFromFile( 'lmg' ),
			sound: 'gun_pistol',
			sound_pitch: 0.85,
			sound_volume: 1.2,
			title: 'Light Machine Gun',
			slot: 2,
			reload_time: 3.2,
			muzzle_x: 10,
			ammo_capacity: 50,
			spread: 0.02,
			count: 1,
			matter_cost: 90,
			min_build_tool_level: 4,
			projectile_properties: { _damage: 29, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 }; // Default value for _knock_scale
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 29; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#d50000', 15 ) )
		};

		sdGun.classes[ sdGun.CLASS_BUILDTOOL_UPG = 25 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'buildtool_upgrade2' ),
			image0: sdWorld.CreateImageFromFile( 'buildtool_upgrade' ),
			image1: sdWorld.CreateImageFromFile( 'buildtool_upgrade3' ),
			title: 'Build tool upgrade',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			has_description: [ 'Increases score on pickup' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( !character._ai )
				{
					if ( gun.extra === -123 )
					{
						//character.Say( "Score" );
						//character._score += 100000;
						character.GiveScore( sdEntity.SCORE_REWARD_ADMIN_CRATE, gun );
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload3', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					else
					if ( gun.extra === 0 )
					{
						/*if ( Math.random() > 0.5 )
						character.Say( "This will be useful" );
						else
						character.Say( "This is definitely gonna help me");*/
					
						character.GiveScore( sdEntity.SCORE_REWARD_TEDIOUS_TASK, gun );
						
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload3', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					else
					if ( gun.extra === 1 )
					{
						/*if ( Math.random() > 0.5 )
						character.Say( "This will be useful" );
						else
						character.Say( "This is definitely gonna help me");*/
					
						character.GiveScore( sdEntity.SCORE_REWARD_TEDIOUS_TASK, gun );
						
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload3', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					else
					if ( gun.extra === 2 )
					{
						/*if ( Math.random() > 0.5 )
						character.Say( "This will be useful" );
						else
						character.Say( "This is definitely gonna help me");*/
					
						character.GiveScore( sdEntity.SCORE_REWARD_TEDIOUS_TASK, gun );
						
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload3', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					
					/*if ( character._acquired_bt_mech === false && gun.extra === 0 ) // Has the player found this upgrade before?
					{
						character.build_tool_level++;
						character._acquired_bt_mech = true;
						if ( Math.random() > 0.5 )
						character.Say( "I can use this to expand my building arsenal" );
						else
						character.Say( "This is definitely gonna help me build new stuff");
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload3', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}

					if ( character._acquired_bt_rift === false && gun.extra === 1 ) // Has the player found this upgrade before?
					{
						character.build_tool_level++;
						character._acquired_bt_rift = true;
						if ( Math.random() > 0.5 )
						character.Say( "I can use this to expand my building arsenal" );
						else
						character.Say( "This is definitely gonna help me build new stuff");
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload3', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}

					if ( character._acquired_bt_projector === false && gun.extra === 2 ) // Has the player found this upgrade before?
					{
						character.build_tool_level++;
						character._acquired_bt_projector = true;
						if ( Math.random() > 0.5 )
						character.Say( "I can use this to expand my building arsenal" );
						else
						character.Say( "This is definitely gonna help me build new stuff");
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload3', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}*/
				}

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL1_LIGHT_ARMOR = 26 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_light' ),
			title: 'SD-01 Light Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 150,
			min_workbench_level: 1,
			armor_properties: { armor: 130, _armor_absorb_perc: 0.3, armor_speed_reduction: 0 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 130', 'Damage absorption: 30%', 'Movement speed reduction: 0%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as armor
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) ) // Huh, surprised it works - Booraz
				gun.remove();
				/*
				if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.3 ) * 130 )
				{
					character.armor = 130;
					character.armor_max = 130;
					character._armor_absorb_perc = 0.3; // 30% damage reduction
					character.armor_speed_reduction = 0; // Armor speed reduction, 0% for light armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL1_MEDIUM_ARMOR = 27 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_medium' ),
			title: 'SD-01 Duty Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 250,
			min_workbench_level: 1,
			armor_properties: { armor: 190, _armor_absorb_perc: 0.4, armor_speed_reduction: 5 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 190', 'Damage absorption: 40%', 'Movement speed reduction: 5%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) ) // Huh, surprised it works - Booraz
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.4 ) * 190 )
				{
					character.armor = 190;
					character.armor_max = 190;
					character._armor_absorb_perc = 0.4; // 40% damage reduction
					character.armor_speed_reduction = 5; // Armor speed reduction, 5% for medium armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL1_HEAVY_ARMOR = 28 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_heavy' ),
			title: 'SD-01 Combat Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 350,
			min_workbench_level: 1,
			armor_properties: { armor: 250, _armor_absorb_perc: 0.5, armor_speed_reduction: 10 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 250', 'Damage absorption: 50%', 'Movement speed reduction: 10%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) ) // Huh, surprised it works - Booraz
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.5 ) * 250 )
				{
					character.armor = 250;
					character.armor_max = 250;
					character._armor_absorb_perc = 0.5; // 50% damage reduction
					character.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_SHOTGUN_MK2 = 29 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shotgun_mk2' ),
			sound: 'gun_shotgun_mk2',
			sound_volume: 1,
			title: 'Shotgun MK2',
			slot: 3,
			reload_time: 6,
			muzzle_x: 9,
			ammo_capacity: 15,
			count: 3,
			spread: 0.1,
			matter_cost: 90,
			//burst: 3, // Burst fire count // EG: Having 2 cooldown (reload and burst cooldown) feels like a downgrade
			//burst_reload: 30, // Burst fire reload, needed when giving burst fire
			min_build_tool_level: 6,
			projectile_properties: { _damage: 14 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 14; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddShotgunAmmoTypes( [] ) )
		};

		sdGun.classes[ sdGun.CLASS_LASER_DRILL = 30 ] = { // Sprite made by Silk1 / AdibAdrian
			image: sdWorld.CreateImageFromFile( 'laser_drill' ),
			sound: 'saber_attack',
			sound_pitch: 0.6,
			sound_volume: 1,
			title: 'Laser Drill',
			slot: 0,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			matter_cost: 300,
			projectile_velocity: 1 * 1.5,
			min_workbench_level: 2,
			projectile_properties: { _rail: true, _damage: 32, color: '#ffb300', _knock_scale:0.1, _dirt_mult: 2 }, // Dirt mult was 2 but buffed to 5 since damage upgrade is gone for now
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#ffb300', _dirt_mult: 2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 32; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_SMG = 31 ] = { // Sprite made by LazyRain
			image: sdWorld.CreateImageFromFile( 'smg' ),
			sound: 'gun_pistol',
			title: 'Burst SMG',
			slot: 1,
			reload_time: 1.7,
			muzzle_x: 5,
			ammo_capacity: 24,
			spread: 0.03,
			count: 1,
			burst: 3, // Burst fire count
			burst_reload: 5, // Burst fire reload, needed when giving burst fire
			min_build_tool_level: 3,
			matter_cost: 45,
			projectile_properties: { _damage: 16, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 0.25; // 1.25x damage at effective range - makes sense for SMGs to have an advantage over rifles at close range imo - Ghost581
				obj._critical_hit_range = 80; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 112; // 7 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%

				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 16; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#1fff69', 15, 'laser point' ) )
		};

		sdGun.classes[ sdGun.CLASS_KVT_SMG = 32 ] = { // Sprite made by Ghost581
			image: sdWorld.CreateImageFromFile( 'kvt_smg' ),
			sound: 'gun_pistol',
			title: 'KVT SMG P49 "The Advocate"',
			slot: 1,
			reload_time: 1.9,
			muzzle_x: 6,
			ammo_capacity: 28,
			spread: 0.06,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 18, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 0.25; // 1.25x damage at effective range - makes sense for SMGs to have an advantage over rifles at close range imo - Ghost581
				obj._critical_hit_range = 80; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 112; // 7 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 18; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades ( AddRecolorsFromColorAndCost( [], '#0f1937', 15, 'marking' ) )
		};
		sdGun.classes[ sdGun.CLASS_ROCKET_MK2 = 33 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'rocket_mk2' ),
			sound: 'gun_rocket',
			title: 'Rocket launcher MK2',
			slot: 5,
			reload_time: 30,
			muzzle_x: 9,
			ammo_capacity: -1,
			spread: 0.05,
			projectile_velocity: 14,
			count: 1,
			min_build_tool_level: 18,
			matter_cost: 90,
			projectile_properties: { time_left: 60, explosion_radius: 19, model: 'rocket_proj', _damage: 19 * 3, color:sdEffect.default_explosion_color, ac:0.4, _homing: true, _homing_mult: 0.02, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 60, explosion_radius: 19, model: 'rocket_proj', color:sdEffect.default_explosion_color, ac:0.4, _homing: true, _homing_mult: 0.02, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 19*3; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( 
						AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( [], '#008080', 15 ), '#ff0000', 15 )
					)
		};

		sdGun.classes[ sdGun.CLASS_HEALING_RAY = 34 ] = { // Sprite made by LazyRain
			image: sdWorld.CreateImageFromFile( 'cube_healing_ray' ),
			sound: 'cube_attack',
			title: 'Cube-Medgun',
			slot: 6,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 1 * 3.5,
			spawnable: false,
			projectile_properties: { _rail: true, _damage: -15, color: '#ff00ff' },
			projectile_properties_dynamic: ( gun )=>{ 
				
				//let obj = { _rail: true, color: '#ff00ff',  _return_damage_to_owner:true };
				let obj = { _rail: true, color: '#ff00ff' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = -15; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				if ( gun._held_by.hea < gun._held_by.hmax )
				{
					gun._held_by.DamageWithEffect( gun.extra[ ID_DAMAGE_VALUE ] * gun.extra[ ID_DAMAGE_MULT ], null ); // Heal self if HP isn't max. However this healing is unaffected by damage mult and power pack
				}
				return true;
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( [] ) )
		};

		sdGun.classes[ sdGun.CLASS_SHOVEL = 35 ] = { // Sprite made by Silk
			image: sdWorld.CreateImageFromFile( 'shovel' ),
			//sound: 'gun_medikit',
			title: 'Shovel',
			sound: 'sword_attack2',
			image_no_matter: sdWorld.CreateImageFromFile( 'shovel' ),
			slot: 0,
			reload_time: 9,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			projectile_velocity: 16 * 1.5,
			projectile_properties: { time_left: 1, _damage: 19, color: 'transparent', _knock_scale:0.025 * 8, _dirt_mult: 2 }, // 3X ( 1 + 2 ) damage against dirt blocks
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 1, color: 'transparent', _knock_scale:0.025 * 8, _dirt_mult: 2 };
				obj._knock_scale = 0.025 * 8;
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 19; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};


		sdGun.classes[ sdGun.CLASS_SHOVEL_MK2 = 36 ] = { // Sprite made by LazyRain
			image: sdWorld.CreateImageFromFile( 'shovel_mk2' ),
			//sound: 'gun_medikit',
			title: 'Shovel MK2',
			sound: 'sword_attack2',
			sound_pitch: 1.5,
			image_no_matter: sdWorld.CreateImageFromFile( 'shovel_mk2' ),
			slot: 0,
			reload_time: 11,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			min_build_tool_level: 4,
			matter_cost: 90,
			projectile_velocity: 20 * 1.5,
			projectile_properties: { time_left: 1, _damage: 30, color: 'transparent', _dirt_mult: 2 , _knock_scale:0.025 * 8, 
				_custom_target_reaction:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5, pitch: 1.5 });
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5, pitch: 1.5 });
				}
			},
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 1, color: 'transparent', _dirt_mult: 2 , _knock_scale:0.025 * 8, 
					_custom_target_reaction:( bullet, target_entity )=>
					{
						sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5, pitch: 1.5 });
					},
					_custom_target_reaction_protected:( bullet, target_entity )=>
					{
						sdSound.PlaySound({ name:'saber_hit2', x:bullet.x, y:bullet.y, volume:1.5, pitch: 1.5 });
					}
				};
				obj._knock_scale = 0.025 * 8;
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 30; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_DECONSTRUCTOR_HAMMER = 37 ] = { // Sprite by LazyRain
			image: sdWorld.CreateImageFromFile( 'deconstructor_hammer' ),
			//sound: 'gun_medikit',
			title: 'Deconstructor Hammer',
			sound: 'sword_attack2',
			image_no_matter: sdWorld.CreateImageFromFile( 'deconstructor_hammer' ),
			slot: 0,
			reload_time: 8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			projectile_velocity: 16 * 1.5,
			spawnable: false,
			projectile_properties: { time_left: 1, _damage: 35, color: 'transparent', _knock_scale:0.025 * 8, _reinforced_level: 1 }
		};

		sdGun.classes[ sdGun.CLASS_ADMIN_REMOVER = 38 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shark' ),
			sound: 'gun_defibrillator',
			title: 'Admin tool for removing',
			sound_pitch: 2,
			slot: 4,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			projectile_properties: { _rail: true, time_left: 30, _damage: 1, color: '#ffffff', _reinforced_level:Infinity, _armor_penetration_level:Infinity, _admin_picker:true, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( bullet._owner )
					{
						if ( bullet._owner._god )
						{
							if ( target_entity.GetClass() === 'sdDeepSleep' )
							{
								// Never remove these
							}
							else
							{
								target_entity.DamageWithEffect( Infinity, bullet._owner, false, false );
								target_entity.remove();
							}
						}
						else
						if ( bullet._owner.IsPlayerClass() )
						{
							// Remove if used by non-admin
							if ( bullet._owner._inventory[ bullet._owner.gun_slot ] )
							if ( sdGun.classes[ bullet._owner._inventory[ bullet._owner.gun_slot ].class ].projectile_properties._admin_picker )
							bullet._owner._inventory[ bullet._owner.gun_slot ].remove();
						}
					}
				}
			},
			onMade: ( gun )=>
			{
				let remover_sd_filter = sdWorld.CreateSDFilter();
				sdWorld.ReplaceColorInSDFilter_v2( remover_sd_filter, '#abcbf4', '#ff9292' );
				
				gun.sd_filter = remover_sd_filter;
			}
		};

		sdGun.classes[ sdGun.CLASS_LOST_CONVERTER = 39 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cube_bng' ),
			image_charging: sdWorld.CreateImageFromFile( 'cube_bng_charging' ),
			//sound: 'supercharge_combined2',
			title: 'Cube overcharge cannon',
			//sound_pitch: 0.5,
			slot: 5,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 900;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						
						gun._held_by._auto_shoot_in = 2200 / 1000 * 30;

						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'supercharge_combined2_part2', x:gun.x, y:gun.y, volume: 1.5 });
					
					if ( gun._held_by.matter >= 900 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 15;
						gun._held_by.matter -= 900;
					}
				}
				return true;
			},
			projectile_properties: { 
				//explosion_radius: 10, 
				model: 'ball_charged', 
				_damage: 0, /*color:'#ffff66',*/ 
				time_left: 30, 
				_hittable_by_bullets: false,
				_custom_detonation_logic:( bullet )=>
				{
					if ( bullet._owner )
					{
						sdWorld.SendEffect({ 
							x:bullet.x, 
							y:bullet.y, 
							radius:30,
							damage_scale: 0, // Just a decoration effect
							type:sdEffect.TYPE_EXPLOSION, 
							owner:this,
							color:'#ffff66',
							no_smoke: true,
							shrapnel: true
						});

						let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 32 );

						for ( let i = 0; i < nears.length; i++ )
						{
							// Prevent yellow cubes from commiting not living
							if ( nears[ i ].is( sdCube ) && bullet._owner === nears[ i ] )
							{
							}
							else
							sdLost.ApplyAffection( nears[ i ], 300, bullet );
						}
					}
				}
			},
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};
		
		const cable_reaction_method = ( bullet, target_entity )=>
		{
			// Someone fired cable tool and then dropped it onto weaponbench?
			if ( !bullet._owner || !bullet._owner.IsPlayerClass() )
			return;
			
			if ( bullet._owner._current_built_entity )
			if ( !bullet._owner._current_built_entity.is( sdCable ) )
			bullet._owner._current_built_entity = null;
			
			if ( sdCable.attacheable_entities.indexOf( target_entity.GetClass() ) !== -1 )
			{
				if ( target_entity._shielded && !target_entity._shielded._is_being_removed && target_entity._shielded.protect_cables )
				{
					bullet._owner.Say( 'Protected by the base shielding unit' );
				}
				else
				if ( sdCable.one_cable_entities.indexOf( target_entity.GetClass() ) !== -1 && sdCable.GetConnectedEntities( target_entity, sdCable.TYPE_ANY ).length > 0 )
				{
					//bullet._owner.Say( ( target_entity.title || target_entity.GetClass() ) + ' has only one socket' );
					bullet._owner.Say( 'There is only one socket' );
				}
				else
				{
					if ( bullet._owner._current_built_entity && !bullet._owner._current_built_entity._is_being_removed )
					{
						if ( sdCable.one_cable_entities.indexOf( bullet._owner._current_built_entity.p.GetClass() ) !== -1 && sdCable.one_cable_entities.indexOf( target_entity.GetClass() ) !== -1 )
						{
							bullet._owner.Say( 'It seems pointless to connect devices when both have just one socket' );
						}
						else
						if ( sdCable.GetConnectedEntities( target_entity ).indexOf( bullet._owner._current_built_entity.p ) !== -1 )
						{
							bullet._owner.Say( ( bullet._owner._current_built_entity.p.title || bullet._owner._current_built_entity.p.GetClass() ) + ' and ' + 
									( target_entity.title || target_entity.GetClass() ) + ' are already connected' );
						}
						else
						if ( target_entity === bullet._owner._current_built_entity.p )
						{
							//bullet._owner.Say( 'Connecting cable end to same ' + ( target_entity.title || target_entity.GetClass() ) + ' does not make sense' );
							bullet._owner.Say( 'Connecting cable to same thing does not make sense' );
						}
						else
						{
							//bullet._owner._current_built_entity.SetChild( target_entity );
							bullet._owner._current_built_entity.c = target_entity;
							if ( target_entity.is( sdNode ) )
							{
								bullet._owner._current_built_entity.d[ 2 ] = 0;
								bullet._owner._current_built_entity.d[ 3 ] = 0;
							}
							else
							{
								bullet._owner._current_built_entity.d[ 2 ] = bullet.x - target_entity.x;
								bullet._owner._current_built_entity.d[ 3 ] = bullet.y - target_entity.y;
							}

							//bullet._owner.Say( 'End connected to ' + ( target_entity.title || target_entity.GetClass() ) );
							
							if ( bullet._owner._current_built_entity.t === sdCable.TYPE_WIRELESS )
							{
								if ( target_entity.is( sdNode ) && target_entity.type === sdNode.TYPE_SIGNAL_WIRELESS )
								{
									target_entity.variation = bullet._owner._current_built_entity.v;
									target_entity._update_version++;
								}
								else
								{
									bullet._owner._current_built_entity.t = sdCable.TYPE_MATTER;
								}
							}

							bullet._owner._current_built_entity._update_version++;

							bullet._owner._current_built_entity = null;
						}
					}
					else
					{
						let ent = new sdCable({ 
							x: bullet.x, 
							y: bullet.y, 
							parent: target_entity,
							child: bullet._owner,
							offsets: target_entity.is( sdNode ) ? [ 0,0, 0,0 ] : [ bullet.x - target_entity.x, bullet.y - target_entity.y, 0,0 ],
							type: ( target_entity.is( sdStorageTank ) || target_entity.is( sdEssenceExtractor ) ) ? sdCable.TYPE_LIQUID : sdCable.TYPE_MATTER
						});
						
						if ( target_entity.is( sdNode ) && target_entity.type === sdNode.TYPE_SIGNAL_WIRELESS )
						{
							ent.t = sdCable.TYPE_WIRELESS; // Type
							ent.v = target_entity.variation;
						}
					
						bullet._owner._current_built_entity = ent;
						//bullet._owner.Say( 'Start connected to ' + ( target_entity.title || target_entity.GetClass() ) );

						sdEntity.entities.push( ent );
					}
				}
				
				// Allow connection to sdJunk barrels/containers and insta-repair them as they will likely start losing health
				if ( target_entity.is( sdJunk ) )
				if ( target_entity.hea > target_entity.hmax - 5 )
				target_entity.hea = target_entity.hmax;
			}
			else
			if ( bullet._owner._current_built_entity && bullet._owner._current_built_entity.p && bullet._owner._current_built_entity.p.is( sdWorld.entity_classes.sdSteeringWheel ) && bullet._owner._current_built_entity.p.type === sdWorld.entity_classes.sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
			{
				bullet._owner._current_built_entity.p.ToggleSingleScanItem( target_entity, bullet._owner );
			}
			else
			{
				bullet._owner.Say( 'Cable can not be attached there' );
				//bullet._owner.Say( 'Cable can not be attached to ' + ( target_entity.title || target_entity.GetClass() ) );
			}
		};
		sdGun.classes[ sdGun.CLASS_CABLE_TOOL = 40 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cable_tool' ),
			sound: 'gun_defibrillator',
			title: 'Cable management tool',
			sound_pitch: 0.25,
			slot: 7,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 300,
			has_description: [ 'Used to wire base equipment together' ],
			projectile_velocity: 16,
			projectile_properties: { time_left: 2, _damage: 1, color: 'transparent', 
				_custom_target_reaction_protected: cable_reaction_method,
				_custom_target_reaction: cable_reaction_method
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				setTimeout( ()=>
				{
					if ( sdWorld.is_server )
					if ( gun._held_by )
					if ( ( gun._held_by._discovered[ 'first-cable' ] || 0 ) < 3 )
					{
						let line_id = ( gun._held_by._discovered[ 'first-cable' ] || 0 );
						
						let lines = [
							'This is a cable management tool',
							'Cable management tool can be used on some of base equipment',
							'Cables can be cut with a right click'
						];
						
						//if ( line_id < 3 )
						if ( sdCable.GetConnectedEntities( gun._held_by ).length === 0 )
						{
							gun._held_by.Say( lines[ line_id ] );
							
							line_id++;
							gun._held_by._discovered[ 'first-cable' ] = line_id;
						}
						
					}
					
				}, 50 );
			}
		};
		
		
		sdGun.classes[ sdGun.CLASS_POWER_PACK = 41 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'powerpack' ),
			sound: 'gun_defibrillator',
			title: 'Power pack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			min_build_tool_level: 2,
			spawnable: false,
			matter_cost: 300 / 2 * 2.5, // More DPS relative to stimpack
			projectile_velocity: 16,
			GetAmmoCost: ()=>
			{
				return 0; //100 / 2 * 2.5;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				{
					//gun._held_by.AnnounceTooManyEffectsIfNeeded();
					//gun._held_by.power_ef = 30 * 30;
					//gun._held_by.DamageWithEffect( 40 );
					
					if ( gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_PACK ].slot ] )
					gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_PACK ].slot ].remove();
				}
				return true;
			},
			projectile_properties: {}
		};
		
		sdGun.classes[ sdGun.CLASS_TIME_PACK = 42 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'timepack' ),
			sound: 'gun_defibrillator',
			title: 'Time pack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 500, // More DPS relative to stimpack
			projectile_velocity: 16,
			has_description: [ 'Slows down time for everything near', 'Duration: 30 seconds' ],
			GetAmmoCost: ()=>
			{
				return 750;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				{
					gun._held_by.AnnounceTooManyEffectsIfNeeded();
					gun._held_by.time_ef = 30 * 30;
					//gun._held_by.DamageWithEffect( 40 );
					
					//if ( gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_TIME_PACK ].slot ] )
					//gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_TIME_PACK ].slot ].remove();
				}
				return true;
			},
			projectile_properties: {}
		};
		
		sdGun.classes[ sdGun.CLASS_LVL2_LIGHT_ARMOR = 43 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_light_lvl2' ),
			title: 'SD-02 Light Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 275,
			min_workbench_level: 2,
			armor_properties: { armor: 190, _armor_absorb_perc: 0.35, armor_speed_reduction: 0 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 190', 'Damage absorption: 35%', 'Movement speed reduction: 0%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) ) // Huh, surprised it works - Booraz
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.35 ) * 190 )
				{
					character.armor = 190;
					character.armor_max = 190;
					character._armor_absorb_perc = 0.35; // 35% damage reduction
					character.armor_speed_reduction = 0; // Armor speed reduction, 0% for light armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL2_MEDIUM_ARMOR = 44 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_medium_lvl2' ),
			title: 'SD-02 Duty Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 375,
			min_workbench_level: 2,
			armor_properties: { armor: 280, _armor_absorb_perc: 0.45, armor_speed_reduction: 5 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 280', 'Damage absorption: 45%', 'Movement speed reduction: 5%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) ) // Huh, surprised it works - Booraz
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.45 ) * 280 )
				{
					character.armor = 280;
					character.armor_max = 280;
					character._armor_absorb_perc = 0.45; // 45% damage reduction
					character.armor_speed_reduction = 5; // Armor speed reduction, 5% for medium armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL2_HEAVY_ARMOR = 45 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_heavy_lvl2' ),
			title: 'SD-02 Combat Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 475,
			min_workbench_level: 2,
			armor_properties: { armor: 370, _armor_absorb_perc: 0.55, armor_speed_reduction: 10 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 370', 'Damage absorption: 55%', 'Movement speed reduction: 10%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) ) // Huh, surprised it works - Booraz
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.55 ) * 370 )
				{
					character.armor = 370;
					character.armor_max = 370;
					character._armor_absorb_perc = 0.55; // 55% damage reduction
					character.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_F_MARKSMAN = 46 ] =  // sprite made by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'f_marksman' ),
			sound: 'gun_f_rifle',
			sound_pitch: 2.2,
			title: 'Falkonian Marksman Rifle',
			slot: 2,
			reload_time: 18,
			muzzle_x: 10,
			ammo_capacity: 18,
			count: 1,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.6,
			projectile_properties: { _damage: 64, color: '#92D0EC', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#92d0ec', _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 64; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_KVT_MMG = 47 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'kvt_mmg' ),
			sound: 'gun_the_ripper2',
			//sound_pitch: 0.7,
			sound_pitch: 1.4,
			//sound_volume: 1.75,
			title: 'KVT MMG P04 "The Ripper"',
			slot: 2,
			reload_time: 4,
			muzzle_x: 9,
			ammo_capacity: 48,
			spread: 0.03,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 42, color: '#ffeb00', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#ffeb00', _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 42; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades([ { 
				title: 'Upgrade to Mark II',
				cost: 480,
				action: ( gun, initiator=null )=>{ gun.class = sdGun.CLASS_KVT_MMG_MK2;
				gun.extra[ ID_DAMAGE_VALUE ] = 48; }
				// gun.sound = 'gun_the_ripper2';
				// gun.sound_pitch = 0.7; // Upgraded guns don't seem to get all properties of the gun they turn into. Bug? - Ghost581
				// gun.spread = 0.03; // Spread and rate of fire are also unaffected
			} ])
		};

		sdGun.classes[ sdGun.CLASS_KVT_MMG_MK2 = 48 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'kvt_mmg_mk2' ),
			sound: 'gun_the_ripper2',
			//sound_pitch: 1.6,
			sound_pitch: 0.8,
			//sound_volume: 1.65,
			title: 'KVT MMG P04 "The Ripper" MK2',
			slot: 2,
			reload_time: 4.2,
			muzzle_x: 9,
			ammo_capacity: 56,
			spread: 0.02,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 48, color: '#ffeb00', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#ffeb00', _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 48; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_RAILCANNON = 49 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'kvt_railcannon' ),
			spritesheet:true,
			/*image: sdWorld.CreateImageFromFile( 'phasercannon_p03' ),
			image0: [ sdWorld.CreateImageFromFile( 'phasercannon_p03_reload1' ), sdWorld.CreateImageFromFile( 'phasercannon_p03_reload2' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'phasercannon_p03_reload1' ), sdWorld.CreateImageFromFile( 'phasercannon_p03_reload2' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'phasercannon_p03_reload1' ), sdWorld.CreateImageFromFile( 'phasercannon_p03_reload2' ) ],
			has_images: true,*/
			sound: 'gun_railgun_malicestorm_terrorphaser4',
			title: 'KVT Railcannon P03 "Stormbringer"',
			sound_pitch: 1.6, // re-added cause weapon sounds better with the sound pitch. - Ghost581
			sound_volume: 1.5,
            slot: 8,
            reload_time: 5,
			burst: 3,
			burst_reload: 60,
            muzzle_x: null,
            ammo_capacity: -1,
            count: 1,
			spawnable: false,
            projectile_properties: { _rail: true, _damage: 76, color: '#62c8f2', explosion_radius: 10, _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = {  _rail: true, color: '#62c8f2', explosion_radius: 10, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 76 // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_ADMIN_TELEPORTER = 50 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shark' ),
			sound: 'gun_defibrillator',
			title: 'Admin tool for teleporting',
			sound_pitch: 2,
			slot: 8,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			allow_aim_assist: false,
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( sdWorld.is_server )
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				if ( gun._held_by._god )
				{
					let dx = gun._held_by.look_x - gun._held_by.x;
					let dy = gun._held_by.look_y - gun._held_by.y;
					gun._held_by.x = gun._held_by.look_x;
					gun._held_by.y = gun._held_by.look_y;
					gun._held_by.sx = 0;
					gun._held_by.sy = 0;
					gun._held_by.ApplyServerSidePositionAndVelocity( true, 0, 0 );
						
					gun._held_by.PhysWakeUp();
				}
				return true;
			},
			projectile_properties: { _rail: true, time_left: 0, _damage: 1, color: '#ffffff', _admin_picker:true }
		};

		sdGun.classes[ sdGun.CLASS_POWER_STIMPACK = 51 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'power_stimpack' ),
			sound: 'gun_defibrillator',
			title: 'Power-Stimpack',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 10,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 900,
			min_workbench_level: 5,
			spawnable: false,
			projectile_velocity: 16,
			GetAmmoCost: ()=>
			{
				return 0 ; //( 100 / 2 * 2.5 + 100 ) * 2;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				{
					//gun._held_by.AnnounceTooManyEffectsIfNeeded();
					//gun._held_by.stim_ef = 30 * 30;
					//gun._held_by.power_ef = 30 * 30;
					//gun._held_by.DamageWithEffect( 40, null, false, false ); // Don't damage armor
					
					if ( gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_STIMPACK ].slot ] )
					gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_POWER_STIMPACK ].slot ].remove();
				}
				return true;
			},
			projectile_properties: {}
		};

		sdGun.classes[ sdGun.CLASS_LVL1_ARMOR_REGEN = 52 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_repair_module_lvl1' ),
			title: 'SD-11 Armor Repair Module',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 125,
			min_workbench_level: 3,
			has_description:[ 'Regeneration rate: 2.5 armor/sec' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.ApplyArmorRegen( 250 ) )
				gun.remove(); 

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL2_ARMOR_REGEN = 53 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_repair_module_lvl2' ),
			title: 'SD-12 Armor Repair Module',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 250,
			min_workbench_level: 4,
			has_description:[ 'Regeneration rate: 5 armor/sec' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.ApplyArmorRegen( 500 ) )
				gun.remove(); 

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_ARMOR_REGEN = 54 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_repair_module_lvl3' ),
			title: 'SD-13 Armor Repair Module',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 375,
			min_workbench_level: 7,
			has_description:[ 'Regeneration rate: 7.5 armor/sec' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.ApplyArmorRegen( 750 ) )
				gun.remove(); 

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_LIGHT_ARMOR = 55 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_light_lvl3' ),
			title: 'SD-03 Light Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 400,
			min_workbench_level: 6,
			armor_properties: { armor: 300, _armor_absorb_perc: 0.4, armor_speed_reduction: 0 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 300', 'Damage absorption: 40%', 'Movement speed reduction: 0%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) ) // Huh, surprised it works - Booraz
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.4 ) * 300 )
				{
					character.armor = 300;
					character.armor_max = 300;
					character._armor_absorb_perc = 0.4; // 40% damage reduction
					character.armor_speed_reduction = 0; // Armor speed reduction, 0% for light armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_MEDIUM_ARMOR = 56 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_medium_lvl3' ),
			title: 'SD-03 Duty Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 500,
			min_workbench_level: 6,
			armor_properties: { armor: 400, _armor_absorb_perc: 0.5, armor_speed_reduction: 5 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 400', 'Damage absorption: 50%', 'Movement speed reduction: 5%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) )
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.5 ) * 400 )
				{
					character.armor = 400;
					character.armor_max = 400;
					character._armor_absorb_perc = 0.5; // 50% damage reduction
					character.armor_speed_reduction = 5; // Armor speed reduction, 5% for medium armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_LVL3_HEAVY_ARMOR = 57 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_heavy_lvl3' ),
			title: 'SD-03 Combat Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 600,
			min_workbench_level: 6,
			armor_properties: { armor: 500, _armor_absorb_perc: 0.6, armor_speed_reduction: 10 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 500', 'Damage absorption: 60%', 'Movement speed reduction: 10%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) )
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.6 ) * 500 )
				{
					character.armor = 500;
					character.armor_max = 500;
					character._armor_absorb_perc = 0.6; // 60% damage reduction
					character.armor_speed_reduction = 10; // Armor speed reduction, 10% for heavy armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};
		
		sdGun.classes[ sdGun.CLASS_EMERGENCY_INSTRUCTOR = 58 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'emergency_instructor' ),
			sound: 'gun_defibrillator',
			title: 'Emergency instructor',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 200, // More DPS relative to stimpack
			projectile_velocity: 16,
			spawnable: false,
			has_description: [ 'Summons an Instructor to aid you', 'Duration: 60 seconds' ],
			GetAmmoCost: ()=>
			{
				return 300;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				let owner = gun._held_by;
				
				setTimeout(()=> // Out of loop spawn
				{
					if ( sdWorld.is_server )
					if ( owner )
					//if ( owner.is( sdCharacter ) )
					{
						let instructor_settings = {"hero_name":"Instructor","color_bright":"#7aadff","color_dark":"#25668e","color_bright3":"#7aadff","color_dark3":"#25668e","color_visor":"#ffffff","color_suit":"#000000","color_shoes":"#303954","color_skin":"#51709a","voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"color_suit2":"#000000","color_dark2":"#25668e"};

						let ent = new sdCharacter({ x: owner.x + 16 * owner._side, y: owner.y,
							_ai_enabled: sdCharacter.AI_MODEL_TEAMMATE, 
							_ai_gun_slot: 4,
							_ai_level: 10,
							_ai_team: owner.cc_id + 4141,
							sd_filter: sdWorld.ConvertPlayerDescriptionToSDFilter_v2( instructor_settings ), 
							_voice: sdWorld.ConvertPlayerDescriptionToVoice( instructor_settings ), 
							title: instructor_settings.hero_name,
							cc_id: owner.cc_id,
							_owner: owner
						});
						ent.gun_slot = 4;
						ent._matter_regeneration = 5;
						//ent._damage_mult = 1 + 3 / 3 * 1;
						sdEntity.entities.push( ent );

						let ent2 = new sdGun({ x: ent.x, y: ent.y,
							class: sdGun.CLASS_RAILGUN
						});
						sdEntity.entities.push( ent2 );

						sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });
						sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT });
						
						let side_set = false;
						const logic = ()=>
						{
							if ( ent._ai )
							{
								if ( !side_set )
								{
									ent._ai.direction = owner._side;
									side_set = false;
								}
								if ( ent.x > owner.x + 200 )
								ent._ai.direction = -1;
							
								if ( ent.x < owner.x - 200 )
								ent._ai.direction = 1;
							}
						};
						
						const MasterDamaged = ( victim, dmg, enemy )=>
						{
							if ( enemy && enemy.IsTargetable( ent ) )
							if ( dmg > 0 )
							if ( ent._ai )
							{
								if ( !ent._ai.target || Math.random() > 0.5 )
								ent._ai.target = enemy;
							}
						};
						
						owner.addEventListener( 'DAMAGE', MasterDamaged );
						
						setInterval( logic, 1000 );
						
						setTimeout(()=>
						{
							if ( ent.hea > 0 )
							if ( !ent._is_being_removed )
							{
								ent.Say( [ 
									'Was nice seeing you', 
									'I can\'t stay any longer', 
									'Thanks for the invite, ' + owner.title, 
									'Glad I didn\'t die here lol',
									'Until next time',
									'You can call be later',
									'My time is almost out',
									( ent._inventory[ 4 ] === ent2 ) ? 'You can take my railgun' : 'I\'ll miss my railgun',
									'Time for me to go'
								][ ~~( Math.random() * 9 ) ], false, false, false );
							}
						}, 60000 - 4000 );
						setTimeout(()=>
						{
							clearInterval( logic );
							
							owner.removeEventListener( 'DAMAGE', MasterDamaged );
							
							if ( !ent._is_being_removed )
							sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });

							ent.DropWeapons();
							ent.remove();
							//ent2.remove();

							ent._broken = false;
							//ent2._broken = false;

						}, 60000 );
					}
				}, 1 );
				
				return true;
			},
			projectile_properties: {}
		};
		
		sdGun.classes[ sdGun.CLASS_POPCORN = 59 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'popcorn' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'popcorn_disabled' ),
			title: 'Popcorn',
			slot: 7,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 10,
			projectile_velocity: 16,
			spawnable: true,
			category: 'Other',
			is_sword: true,
			GetAmmoCost: ()=>
			{
				return 0;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				sdSound.PlaySound({ name:'popcorn', x:gun.x, y:gun.y, volume:0.3 + Math.random() * 0.2, pitch:1 + Math.sin( gun._net_id ) * 0.2 });
				
				return true;
			},
			onThrownSwordReaction: ( gun, hit_entity, hit_entity_is_protected )=>
			{
				sdSound.PlaySound({ name:'blockB4', x:gun.x, y:gun.y, volume: 0.05, pitch:1 });
			
				for ( let i = 0; i < 6; i++ )
				{
					let a = Math.random() * 2 * Math.PI;
					let s = Math.random() * 4;

					let k = Math.random();

					let x = gun.x;
					let y = gun.y;

					sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_POPCORN, sx: gun.sx*k + Math.sin(a)*s, sy: gun.sy*k + Math.cos(a)*s });
				}
			},
			projectile_properties: { _damage: 0 }
		};

		sdGun.classes[ sdGun.CLASS_ERTHAL_BURST_RIFLE = 60 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'erthal_burst_rifle' ),
			image0: [ sdWorld.CreateImageFromFile( 'erthal_burst_rifle0' ), sdWorld.CreateImageFromFile( 'erthal_burst_rifle0b' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'erthal_burst_rifle1' ), sdWorld.CreateImageFromFile( 'erthal_burst_rifle1b' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'erthal_burst_rifle2' ), sdWorld.CreateImageFromFile( 'erthal_burst_rifle2b' ) ],
			has_images: true,
			sound: 'spider_attackC',
			sound_pitch: 6,
			title: 'Erthal Burst Rifle',
			slot: 2,
			reload_time: 2,
			muzzle_x: 8,
			ammo_capacity: 36,
			count: 1,
			spread: 0.01,
			spawnable: false,
			burst: 6, // Burst fire count
			burst_reload: 24, // Burst fire reload, needed when giving burst fire
			projectile_velocity: 18,
			projectile_properties: { _damage: 46,  color: '#00aaff', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#00aaff', _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 46; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#37a3ff', 15, 'energy color' ) )
		};

		sdGun.classes[ sdGun.CLASS_ERTHAL_PLASMA_PISTOL = 61 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'erthal_plasma_pistol' ),
			sound: 'spider_attackC',
			sound_pitch: 3,
			title: 'Erthal Plasma Pistol',
			slot: 1,
			reload_time: 5.4,
			muzzle_x: 8,
			ammo_capacity: 8,
			count: 1,
			spawnable:false,
			projectile_velocity: 16,
			fire_type: 2,
			projectile_properties: { explosion_radius: 7, model: 'ball', _damage: 12, color:'#00aaff', _dirt_mult: 1, _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 7, model: 'ball', color:'#00aaff', _dirt_mult: 1, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 12; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#37a3ff', 15, 'energy color' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_FMECH_MINIGUN = 62 ] = 
		{
			// Split gun sprite into 2 files for proper overheating filter on barrel
			image: sdWorld.CreateImageFromFile( 'fmech_lmg2_base' ),
			image_charging: sdWorld.CreateImageFromFile( 'fmech_lmg2_base' ),
			image_barrel: sdWorld.CreateImageFromFile( 'fmech_lmg2_barrel' ), // Used for overheating barrel filter
			//sound: 'supercharge_combined2',
			title: 'Velox Flying Mech Minigun',
			//sound_pitch: 0.5,
			slot: 2,
			reload_time: 0,
			muzzle_x: 10,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 16,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
			
				return 4;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun.overheat > 250 )
				if ( Math.random() < 0.2 )
				if ( !sdWorld.is_server || sdWorld.is_singleplayer )
				{
					let offset = 10;

					let xx = Math.sin ( gun._held_by.GetLookAngle() ) * offset;
					let yy = Math.cos ( gun._held_by.GetLookAngle() ) * offset;
	
					let e = new sdEffect({ type: sdEffect.TYPE_SMOKE, x:gun.x+xx, y:gun.y+yy, sx: -Math.random() + Math.random(), sy:-1 - Math.random() * 2.5, scale:1/3, radius:1/3, color: '#555555' });
					sdEntity.entities.push ( e );
				}

				if ( gun._overheat_cooldown )
				return false;

				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						gun._held_by._auto_shoot_in = 800 / 1000 * 30 / ( 1 + gun.overheat / 60 );


						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'enemy_mech_charge', x:gun.x, y:gun.y, volume: 1.5 });
					}
					return false;
				}
				else
				{
					//sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					sdSound.PlaySound({ name:'enemy_mech_attack4', x:gun.x, y:gun.y, volume:1.5, pitch: 1 });
					
					let matter_cost = gun.GetBulletCost();
					
					if ( gun._held_by.matter >= matter_cost )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( 2 / ( 1 + gun.overheat / 180 ) ); // Faster rate of fire when shooting more
						gun._held_by.matter -= matter_cost;
						
						if ( gun.overheat < 300 )
						gun.overheat += 3.33; // Speed up rate of fire, the longer it shoots
						else
						{
							gun._overheat_cooldown = 50;
							sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 1.5 });
						}
					}
				}
				return true;
			},
			ExtraDraw: ( gun, ctx, attached )=>
			{
				ctx.sd_color_mult_r = 1 + gun.overheat / 250;
				ctx.sd_color_mult_g = 1;
				ctx.sd_color_mult_b = 1;

				if ( gun.overheat > 50 )
				ctx.apply_shading = false;

				ctx.drawImageFilterCache( sdGun.classes[ gun.class ].image_barrel, -16, -16, 32, 32 );

				ctx.sd_color_mult_r = 1;
				ctx.sd_color_mult_g = 1;
				ctx.sd_color_mult_b = 1;
			},
			projectile_properties: { time_left: 60, _damage: 28, _dirt_mult: -0.5 }, // Combined with fire rate
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 60, _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._temperature_addition = gun.overheat > 250 ? gun.overheat / 3 : 0;
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 28; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					
					gun._max_dps = ( 30 / ( 2 / ( 1 + ( 60 / 90 ) ) ) ) * gun.extra[ ID_DAMAGE_VALUE ]; // Copied from _auto_shoot then multiplied with damage value.
					//UpdateCusomizableGunProperties( gun );
				}
			},
			OnThinkOwnerless: ( gun, GSPEED ) =>
			{
				return false; // No sleeping or else it might get stuck with overheat
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#a5e0ff', 30 ) )
		};

		sdGun.classes[ sdGun.CLASS_SNIPER = 63 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sniper' ),
			image0: [ sdWorld.CreateImageFromFile( 'sniper0' ), sdWorld.CreateImageFromFile( 'sniper0b' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'sniper1' ), sdWorld.CreateImageFromFile( 'sniper1b' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'sniper2' ), sdWorld.CreateImageFromFile( 'sniper2b' ) ],
			has_images: true,
			sound: 'gun_sniper',
			title: 'Sniper rifle',
			slot: 4,
			reload_time: 60,
			muzzle_x: 10,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: sdGun.default_projectile_velocity * 2,
			matter_cost: 120,
			min_build_tool_level: 9,
			projectile_properties: { _damage: 105, /*_knock_scale:0.01 * 8, */penetrating:true, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { penetrating:true, _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 105; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#85ffcc', 30 ) )
		};
    
		sdGun.classes[ sdGun.CLASS_DMR = 64 ] =  // sprite made by The Commander
		{
			image: sdWorld.CreateImageFromFile( 'dmr' ),
			sound: 'gun_dmr',
			sound_volume: 2.4,
			sound_pitch: 1.3,
			title: 'DMR',
			slot: 4,
			reload_time: 10.4,
			muzzle_x: 10,
			ammo_capacity: 8,
			count: 1,
			matter_cost: 160,
			min_build_tool_level: 8,
			fire_type: 2,
			projectile_velocity: sdGun.default_projectile_velocity * 1.7,
			projectile_properties: { _damage: 62, color: '#33ffff', penetrating: true, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#33ffff', penetrating:true, _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 62; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
    
		sdGun.classes[ sdGun.CLASS_VELOX_PISTOL = 65 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'burst_pistol3' ),
			image0: [ sdWorld.CreateImageFromFile( 'burst_pistol_reload3' ), sdWorld.CreateImageFromFile( 'burst_pistol3' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'burst_pistol_reload3' ), sdWorld.CreateImageFromFile( 'burst_pistol3' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'burst_pistol_reload3' ), sdWorld.CreateImageFromFile( 'burst_pistol3' ) ],
			sound: 'gun_f_rifle',
			sound_pitch: 1.5,
			title: 'Velox Burst Pistol',
			slot: 1,
			reload_time: 2,
			muzzle_x: 5,
			ammo_capacity: 12,
			count: 1,
			spread: 0.01,
			spawnable: false,
			burst: 3,
			burst_reload: 35,
			projectile_properties: { _damage: 33, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 33; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
    
		sdGun.classes[ sdGun.CLASS_SARRONIAN_GAUSS_RIFLE = 66 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sarronian_gauss_rifle' ),  // sprite by Gravel
			// image_charging: sdWorld.CreateImageFromFile( 'gauss_rifle_charging' ), // no charging animation for now
			// image0: [ sdWorld.CreateImageFromFile( 'gauss_rifle0' ), sdWorld.CreateImageFromFile( 'gauss_rifle1' ) ],
			// image1: [ sdWorld.CreateImageFromFile( 'gauss_rifle2' ), sdWorld.CreateImageFromFile( 'gauss_rifle3' ) ],
			// image2: [ sdWorld.CreateImageFromFile( 'gauss_rifle4' ), sdWorld.CreateImageFromFile( 'gauss_rifle5' ) ],
			// has_images: true,
			title: 'Sarronian Gauss Rifle',
			slot: 8,
			reload_time: 90, // 225,
			muzzle_x: 9,
			ammo_capacity: -1,
			count: 1,
			// matter_cost: 1000,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.7,
			// min_workbench_level: 6,
			// min_build_tool_level: 5,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 35;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						
						gun._held_by._auto_shoot_in = 75;

						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 0.5 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'gun_railgun_malicestorm_terrorphaser4', x:gun.x, y:gun.y, volume: 1.5, pitch: 2 });
				}
			},
			projectile_properties: { explosion_radius: 24, model: 'sarronian_bolt', _damage: 128, color: '#00c600', _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 24, model: 'sarronian_bolt', color: '#00c600', _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 128; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#00ff00', 15, 'main energy' ),
				'#00c600', 15, 'secondary energy' ),
				'#008700', 15, 'tertiary energy' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_VELOX_COMBAT_RIFLE = 67 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'combat_rifle' ),
			sound: 'gun_the_ripper2',
			sound_pitch: 2,
			title: 'Velox Combat Rifle',
			slot: 2,
			reload_time: 1.5,
			muzzle_x: 11,
			ammo_capacity: 30,
			burst: 3,
			burst_reload: 16,
			count: 1,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.3,
			projectile_properties: { _damage: 60, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 60; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_MISSILE_LAUNCHER = 68 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'kvt_missile_launcher' ),
			sound: 'gun_missile_launcher_p07',
			title: 'KVT Missile Launcher P07 "Hydra"',
			sound_volume: 2.4,
			slot: 5,
			reload_time: 6,
			muzzle_x: null,
			ammo_capacity: 6,
			spread: 0.06,
			projectile_velocity: 18,
			count: 1,
			burst: 2,
			burst_reload: 26, 
			spawnable: false,
			projectile_properties: { time_left: 180, explosion_radius: 12, model: 'mini_missile_p241', _damage: 34, color:sdEffect.default_explosion_color, ac:0.01, _homing: true, _homing_mult: 0.3, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 180, explosion_radius: 12, model: 'mini_missile_p241', color:sdEffect.default_explosion_color, ac:0.01, _homing: true, _homing_mult: 0.3, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 38; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#0f1937', 15, 'marking' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_F_HEAVY_RIFLE = 69 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'f_heavy_rifle' ),
			image_charging: sdWorld.CreateImageFromFile( 'f_heavy_rifle' ),
			title: 'Falkonian Heavy Rifle',
			slot: 2,
			reload_time: 0,
			muzzle_x: 12,
			ammo_capacity: -1,
			count: 2,
			spread: 0.05,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 2.5;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						gun._held_by._auto_shoot_in = 1000 / 1000 * 30;

						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 3 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'saber_hit2', x:gun.x, y:gun.y, volume: 2, pitch: 3 });
					let matter_cost = gun.GetBulletCost();
					if ( gun._held_by.matter >= matter_cost )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 4;
						gun._held_by.matter -= matter_cost; // Was 3. It is not that strong to drain matter that fast
					}
				}
				return true;
			},
			projectile_properties: { _damage: 28, color:'#afdfff', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color:'#afdfff', _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 28; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
					gun._max_dps = ( 30 / 2 ) * gun.extra[ ID_DAMAGE_VALUE ]; // Copied from _auto_shoot ( 2 ) then multiplied with damage value.
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_ZAPPER = 70 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'zapper' ),
			image0: [ sdWorld.CreateImageFromFile( 'zapper0' ), sdWorld.CreateImageFromFile( 'zapper1' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'zapper2' ), sdWorld.CreateImageFromFile( 'zapper2' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'zapper0' ), sdWorld.CreateImageFromFile( 'zapper1' ) ],
			has_images: true,
			title: 'Zapper',
			sound: 'cube_attack',
			sound_volume: 0.5,
			sound_pitch: 1.5,
			image_no_matter: sdWorld.CreateImageFromFile( 'zapper_disabled' ),
			slot: 0,
			reload_time: 10,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			spawnable: false,
			projectile_velocity: 37,
			GetAmmoCost: ()=>
			{
				return 4;
			},
			projectile_properties: { model:'transparent_proj', time_left: 1, _damage: 90, color: '#ffffff', _knock_scale:0.025 * 8, 
				_custom_target_reaction:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'cube_attack', x:bullet.x, y:bullet.y, volume:0.5, pitch: 2 });
				},
				_custom_target_reaction_protected:( bullet, target_entity )=>
				{
					sdSound.PlaySound({ name:'cube_attack', x:bullet.x, y:bullet.y, volume:0.5, pitch: 2 });
				}
			},
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { model:'transparent_proj', time_left: 1, color: '#ffffff', _knock_scale:0.025 * 8, 
					_custom_target_reaction:( bullet, target_entity )=>
					{
						sdSound.PlaySound({ name:'cube_attack', x:bullet.x, y:bullet.y, volume:0.5, pitch: 2 });
					},
					_custom_target_reaction_protected:( bullet, target_entity )=>
					{
						sdSound.PlaySound({ name:'cube_attack', x:bullet.x, y:bullet.y, volume:0.5, pitch: 2 });
					}
				};
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 90; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddRecolorsFromColorAndCost( 
				AddRecolorsFromColorAndCost( 
					AddGunDefaultUpgrades(), 
					'#d3d3d3', 100, 'inner', '' ), 
				'#ffffff', 100, 'outer', '' )
		};

		sdGun.classes[ sdGun.CLASS_COUNCIL_PISTOL = 71 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'council_pistol3' ),
			sound: 'cube_attack',
			sound_pitch: 1.5,
			title: 'Council Pistol',
			slot: 1,
			reload_time: 10,
			muzzle_x: 7,
			ammo_capacity: -1,
			spread: 0.01,
			count: 1,
			spawnable: false,
			//fire_type: 2,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			projectile_properties: { _damage: 30, color:'ffff00' },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color:'ffff00' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 30; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_COUNCIL_BURST_RAIL = 72 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'council_gun2' ),
			sound: 'cube_attack',
			sound_pitch: 1.5,
			title: 'Council Burst Rail',
			slot: 4,
			reload_time: 3,
			muzzle_x: 7,
			ammo_capacity: -1,// 10, // 3
			burst: 3,
			burst_reload: 45,
			count: 1,
			projectile_properties: { _rail: true, _damage: 28, color: '#ffff00'/*, _knock_scale:0.01 * 8*/ }, // 84 when all 3 bursts land
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#ffff00' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 28; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_METAL_SHARD = 73 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'metal_shard' ),
			image_variative: true,
			sound: 'gun_defibrillator',
			title: 'Alienic metal shard',
			sound_pitch: 1,
			slot: 7,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			ignore_slot: true,
			has_description: [ 'Can be used to upgrade workbench' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup, made to put in crates
			{ 
				return false; 
			}
		};

		sdGun.classes[ sdGun.CLASS_GRENADE_LAUNCHER_MK2 = 74 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'grenade_launcher_mk2' ), // Sprite by LazyRain
			sound: 'gun_grenade_launcher',
			title: 'Grenade launcher MK2',
			slot: 5,
			reload_time: 9,
			muzzle_x: 6,
			ammo_capacity: 6,
			spread: 0.05,
			count: 1,
			projectile_velocity: 9,
			fire_type: 2, // Semi auto
			matter_cost: 90,
			min_build_tool_level: 13,
			projectile_properties: { explosion_radius: 16, time_left: 30 * 3, model: 'grenade', _damage: 16 * 2, color:sdEffect.default_explosion_color, is_grenade: true, _dirt_mult: 2 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 16, time_left: 30 * 3, model: 'grenade', color:sdEffect.default_explosion_color, is_grenade: true, _dirt_mult: 2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 16 * 2; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_TRIPLE_RAIL2 = 75 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'triple_rail2' ),
			sound: 'cube_attack',
			sound_pitch: 0.8,
			title: 'Cube-gun v2',
			slot: 4,
			reload_time: 3,
			muzzle_x: 6,
			ammo_capacity: -1,// 10, // 3
			count: 1,
			projectile_properties: { _rail: true, _damage: 15 * 1.2, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ }, // 70
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2'};
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 15 * 1.2; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( [] ) )
		};
		
		sdGun.classes[ sdGun.CLASS_RAIL_SHOTGUN2 = 76 ] = { // Image by LazyRain
			image: sdWorld.CreateImageFromFile( 'rail_shotgun2' ),
			sound: 'cube_attackB',
			sound_pitch: 1,
			sound_volume: 2,
			title: 'Cube-shotgun v2',
			slot: 3,
			reload_time: 20,
			muzzle_x: 8,
			ammo_capacity: -1,
			spread: 0.1,
			count: 7,
			self_recoil_scale: 0.1,
			projectile_properties: { _rail: true, _damage: 20 * 1.2, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2' };
				obj._knock_scale = 0.7 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20 * 1.2; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( [] ) )
		};

		sdGun.classes[ sdGun.CLASS_KVT_AVRS = 77 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'kvt_avrs' ),
			spritesheet:true,
			/*image: sdWorld.CreateImageFromFile( 'kivortec_avrs_p09' ),
			image0: [ sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload1' ), sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload2' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload1' ), sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload2' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload1' ), sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload2' ) ],
			has_images: true,*/
			sound: 'gun_railgun_malicestorm_terrorphaser4',
			sound_pitch: 0.7,
			title: 'KVT AVRS P09 "Incapacitator"',
			slot: 4,
			reload_time: 30 * 3,//140,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			projectile_properties: { explosion_radius: 16, _rail: true, _damage: 125, _vehicle_mult: sdGun.default_vehicle_mult_bonus, color: '#91bfd7', _no_explosion_smoke: true }, // 3x more damage against vehicles
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 16, _rail: true, _vehicle_mult: sdGun.default_vehicle_mult_bonus, color: '#91bfd7', _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 125; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_SARRONIAN_ENERGY_RIFLE = 78 ] = 
		{
			image: sdWorld.CreateImageFromFile ( 'sarronian_energy_rifle' ),
			sound: 'gun_spark',
			sound_pitch: 0.5,
			title: 'Sarronian Energy Rifle',
			slot: 8,
			reload_time: 45,
			muzzle_x: 7,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			projectile_properties: { model: 'sarronian_ball', color: '#00c600', explosion_radius: 12, _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _damage: 32, model: 'sarronian_ball', color: '#00c600', explosion_radius: 12, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 32; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#00ff00', 15, 'main energy' ),
				'#00c600', 15, 'secondary energy' ),
				'#008700', 15, 'tertiary energy' ) )
		};


		sdGun.classes[ sdGun.CLASS_WYRMHIDE = 79 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'wyrmhide' ),
			title: 'Wyrmhide',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			spawnable: false,
			armor_properties: { armor: 190, _armor_absorb_perc: 0.4, armor_speed_reduction: 0 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 190', 'Damage absorption: 40%', 'Movement speed reduction: 0%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as armor
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) )
				gun.remove();
			
				/*if ( ( 1 - character._armor_absorb_perc ) * character.armor <= ( 1 - 0.4 ) * 190 )
				{
					character.armor = 190;
					character.armor_max = 190;
					character._armor_absorb_perc = 0.4; // 40% damage reduction
					character.armor_speed_reduction = 5; // Armor speed reduction, 5% for medium armor
					if ( character._socket ) 
						sdSound.PlaySound({ name:'armor_pickup', x:character.x, y:character.y, volume:1, pitch: 1.2 - character._armor_absorb_perc * 0.4 }, [ character._socket ] );
					gun.remove(); 
				}*/

				return false; 
			} 
		};
		
		
		sdGun.classes[ sdGun.CLASS_SNOWBALL = 80 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'snowball' ),
			sound: 'sword_attack2',
			title: 'Snowball',
			slot: 7,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: 5,
			spread: 0.05,
			count: 1,
			projectile_velocity: 8,
			spawnable: true,
			category: 'Other',
			matter_cost: 10,
			projectile_properties: { time_left: 30 * 3, model: 'snowball', _damage: 0, color:sdEffect.default_explosion_color, is_grenade: true,
				_custom_target_reaction: ( bullet, target_entity )=>
				{
					bullet.remove();
					
					if ( target_entity.IsPlayerClass() )
					{
						target_entity.DamageWithEffect( 1 );
						target_entity.DamageWithEffect( -1 );
					}
					
					for ( let i = 0; i < 6; i++ )
					{
						let a = Math.random() * 2 * Math.PI;
						let s = Math.random() * 4;

						let k = Math.random();

						let x = bullet.x;
						let y = bullet.y;

						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_POPCORN, sx: bullet.sx*k + Math.sin(a)*s, sy: bullet.sy*k + Math.cos(a)*s });
					}
				},
				_custom_target_reaction_protected: ( bullet, target_entity )=>
				{
					bullet.remove();
					
					if ( target_entity.IsPlayerClass() )
					{
						target_entity.DamageWithEffect( 1 );
						target_entity.DamageWithEffect( -1 );
					}
					
					for ( let i = 0; i < 6; i++ )
					{
						let a = Math.random() * 2 * Math.PI;
						let s = Math.random() * 4;

						let k = Math.random();

						let x = bullet.x;
						let y = bullet.y;

						sdWorld.SendEffect({ x: x, y: y, type:sdEffect.TYPE_POPCORN, sx: bullet.sx*k + Math.sin(a)*s, sy: bullet.sy*k + Math.cos(a)*s });
					}
				}
			}
		};
		
		
		sdGun.classes[ sdGun.CLASS_PORTAL = 81 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'portalgun' ),
			sound: 'gun_portal4',
			sound_volume: 4,
			title: 'ASHPD',
			slot: 7,
			reload_time: 15,
			muzzle_x: 7,
			ammo_capacity: -1,//16,
			count: 1,
			matter_cost: 500,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				return 30;
			},
			projectile_velocity: 16,
			projectile_properties: { model: 'ball', _damage: 0, color:'#00ffff',
				_custom_target_reaction_protected: ( bullet, target_entity )=>
				{
					if ( target_entity.is( sdBlock ) && target_entity.texture_id === sdBlock.TEXTURE_ID_PORTAL )
					{
						let portals_by_owner = [];
						
						for ( let i = 0; i < sdPortal.portals.length; i++ )
						{
							if ( sdPortal.portals[ i ]._owner === bullet._owner )
							portals_by_owner.push( sdPortal.portals[ i ] );
						}
						
						let options = [];
						
						for ( let x = 8; x < target_entity._hitbox_x2; x += 16 )
						{
							if ( bullet.y <= target_entity.y )
							options.push({
								x: x,
								y: 0,
								orientation: 0
							});
							if ( bullet.y >= target_entity.y + target_entity._hitbox_y2 )
							options.push({
								x: x,
								y: target_entity._hitbox_y2,
								orientation: 0
							});
						}
						
						for ( let y = 16; y <= target_entity._hitbox_y2 - 16; y += 16 )
						{
							if ( bullet.x <= target_entity.x )
							options.push({
								x: 0,
								y: y,
								orientation: 1
							});
							if ( bullet.x >= target_entity.x + target_entity._hitbox_x2 )
							options.push({
								x: target_entity._hitbox_x2,
								y: y,
								orientation: 1
							});
						}
						
						let best_di = Infinity;
						let best_i = -1;
						
						for ( let i = 0; i < options.length; i++ )
						{
							let di;
							
							//di = sdWorld.Dist2D( options[ i ].x, options[ i ].y, bullet.x - target_entity.x, bullet.y - target_entity.y );
							
							let lx = bullet.x - target_entity.x;
							let ly = bullet.y - target_entity.y;
							
							if ( options[ i ].orientation === 0 )
							{
								di = sdWorld.Dist2D( Math.max( options[ i ].x - 8, Math.min( lx, options[ i ].x + 8 ) ), options[ i ].y, lx, ly );
							}
							else
							di = sdWorld.Dist2D( options[ i ].x, Math.max( options[ i ].y - 16, Math.min( ly, options[ i ].y + 16 ) ), lx, ly );
							
							if ( di < best_di )
							{
								best_i = i;
								best_di = di;
							}
						}
						
						if ( best_i !== -1 )
						{
							let allow = true;

							for ( let p = 0; p < portals_by_owner.length; p++ )
							if ( portals_by_owner[ p ].attachment === target_entity )
							if ( portals_by_owner[ p ].attachment_x === options[ best_i ].x )
							if ( portals_by_owner[ p ].attachment_y === options[ best_i ].y )
							{
								allow = false;
								break;
							}

							if ( allow )
							{
								while ( portals_by_owner.length > 1 )
								portals_by_owner.shift().remove();

								let portal = new sdPortal({
									attachment: target_entity,
									owner: bullet._owner,
									attachment_x: options[ best_i ].x,
									attachment_y: options[ best_i ].y,
									orientation: options[ best_i ].orientation
								});
								sdEntity.entities.push( portal );

								if ( portals_by_owner.length > 0 )
								{
									portal._output = portals_by_owner[ 0 ];
									portals_by_owner[ 0 ]._output = portal;
								}
							}
						}
					}
				}
			}
		};
		
		
		
		sdGun.classes[ sdGun.CLASS_OVERLORD_BLASTER = 82 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'overlord_blaster' ),
			sound: 'overlord_cannon4',
			title: 'Overlord\'s blaster',
			slot: 8,
			reload_time: 5,
			//muzzle_x: 11,
			image_firing: sdWorld.CreateImageFromFile( 'overlord_blaster_fire' ),
			ammo_capacity: -1,
			count: 1,
			matter_cost: 60,
			spawnable: false,
			projectile_velocity: 12,
			projectile_properties: { 
				
				explosion_radius: 9, model: 'blaster_proj', _damage: 0, color:'#ff00aa', _no_explosion_smoke:true
			},
			projectile_properties_dynamic: ( gun )=>{
				
				let obj = { 
					explosion_radius: 9, model: 'blaster_proj', _damage: 0, color:'#ff00aa', _no_explosion_smoke:true
				};
				
				if ( gun._held_by )
				{
					let m = Math.min( 7, 1 + gun._held_by._score * 0.01 ); // Copy [ 1 / 2 ]
					obj.explosion_radius *= m;
					gun._reload_time = 7 * ( 1 + m ) / 2;
				}
				
				return obj;
			},
			onMade: ( gun, params )=>
			{
				gun.extra = 0;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				let m = Math.min( 7, 1 + gun._held_by._score * 0.01 ); // Copy [ 2 / 2 ]
				gun._sound_pitch = 1 / ( m * 0.2 + 1 * 0.8 );
				
				if ( gun.extra === 1 )
				return true;
			
				for ( let i = 0; i < sdOverlord.overlords.length; i++ )
				{
					if ( sdWorld.inDist2D_Boolean( gun.x, gun.y, sdOverlord.overlords[ i ].x, sdOverlord.overlords[ i ].y, 250 ) )
					return true;
				}
				
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				{
					gun._held_by.Say( 'This weapon does not shoot anymore' );
				}
				
				return false;
			},
			upgrades:
				[
					{ 
						title: 'Unlock overlord blaster',
						cost: 1000,
						action: ( gun, initiator=null )=>{ 
							//gun.class = sdGun.CLASS_TRIPLE_RAIL2;
							//gun.extra[ ID_DAMAGE_VALUE ] = 15 * 1.2;
							//gun._max_dps = ( 30 / gun._reload_time ) * gun.extra[ 17 ] * gun._count;
							if ( gun.extra === 0 )
							{
								gun.extra = 1;
								//initiator.Say( '' );
								return true;
							}
							
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Weapon is already unlocked.' );
					
							return false;
						}
					}
				]
		};

		sdGun.classes[ sdGun.CLASS_TOPS_DMR = 83 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'tops_dmr' ),
			sound: 'gun_dmr',
			sound_volume: 2.5,
			sound_pitch: 0.8,
			title: 'Task Ops DMR',
			slot: 4,
			reload_time: 9,
			muzzle_x: 14,
			ammo_capacity: 20,
			count: 1,
			fire_type: 2,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.7,
			projectile_properties: { _damage: 80, penetrating: true, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { penetrating: true, _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 80; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#ff0000', 15 ) )
		};
		sdGun.classes[ sdGun.CLASS_TOPS_SHOTGUN = 84 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'tops_shotgun' ),
			sound: 'gun_shotgun',
			sound_pitch: 1.2,
			sound_volume: 1.5,
			title: 'Task Ops Shotgun',
			slot: 3,
			reload_time: 8,
			muzzle_x: 10,
			ammo_capacity: 20,
			count: 3,
			spread: 0.13,
			spawnable: false,
			projectile_properties: { _damage: 25 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 25; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddShotgunAmmoTypes([]), '#ff0000', 15 ) )
		};
		
		
		// ID ranges 85...88 (including) are reserved by Basilix
		
		let spear_targer_reaction = ( bullet, target_entity )=>
		{
			let dmg_scale = 1;
			
			if ( bullet._owner )
			if ( bullet._owner.power_ef > 0 )
			dmg_scale *= 2.5;
			
			if ( target_entity.is( sdLost ) )
			{
				target_entity.DamageWithEffect( 33 * dmg_scale, bullet._owner );
			}
			else
			{
				sdWorld.SendEffect({ 
					x: bullet.x, 
					y: bullet.y, 
					radius: 16,
					damage_scale: 0, // Just a decoration effect
					type: sdEffect.TYPE_EXPLOSION, 
					owner: this,
					color: '#aaaaaa',
					no_smoke: true
				});

				sdLost.ApplyAffection( target_entity, 33 * dmg_scale, bullet, sdLost.FILTER_WHITE );
			}
		};
		sdGun.classes[ sdGun.CLASS_CUBE_SPEAR = 89 ] = 
        { 
			image: sdWorld.CreateImageFromFile( 'cube_spear2' ),
			image_charging: sdWorld.CreateImageFromFile( 'cube_spear2_charging' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'cube_spear2' ),
			sound: 'saber_attack',
			sound_volume: 1.5,
			title: 'Cube Empty Speargun',
			slot: 0,
			reload_time: 5,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 5,
			spread: 0.4,
			is_sword: true,
			projectile_velocity: 20,
            spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
			
				/*let dmg_scale = 1;

				if ( gun._held_by )
				if ( gun._held_by.power_ef > 0 )
				dmg_scale *= 2.5;*/
				
				return 250;// * dmg_scale;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						gun._held_by._auto_shoot_in = 2200 / 1000 * 30 / 2;


						//sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 2 });
						sdSound.PlaySound({ name: 'armor_pickup', x:gun.x, y:gun.y, volume: 1.5, pitch: 0.25 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'supercharge_combined2_part2', x:gun.x, y:gun.y, volume: 1.5, pitch: 2 });
					
					if ( gun._held_by.matter >= 250 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						//if ( gun._held_by.stim_ef > 0 )
						gun._held_by._auto_shoot_in = 7.5;
						//else
						//gun._held_by._auto_shoot_in = 15;


						/*let dmg_scale = 1;

						if ( gun._held_by )
						if ( gun._held_by.power_ef > 0 )
						dmg_scale *= 2.5;*/

						gun._held_by.matter -= 250;// * dmg_scale;
					}
				}
				return true;
			},
			projectile_properties: { 
                _rail: true,
				color:'#aaaaaa',
				_damage: 0, time_left: 30,
				_custom_target_reaction_protected:spear_targer_reaction,
				_custom_target_reaction:spear_targer_reaction
			},			
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_COMBAT_INSTRUCTOR = 90 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'emergency_instructor2' ),
			sound: 'gun_defibrillator',
			title: 'Combat instructor',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_velocity: 16,
			spawnable: false,
			has_description: [ 'Summons an Instructor to aid you', 'Lasts until death' ],
			GetAmmoCost: ()=>
			{
				return 800;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				let owner = gun._held_by;

				for( let i = 0; i < sdCharacter.characters.length; i++ )
				{
					let char = sdCharacter.characters[ i ]
					if ( char.title === 'Combat Instructor' ) // If instructor already exists for this user, remove him and spawn a new one
					if ( char._ai_stay_near_entity === owner )
					{
						sdSound.PlaySound({ name:'teleport', x:char.x, y:char.y, volume:0.5 });
						sdWorld.SendEffect({ x:char.x, y:char.y, type:sdEffect.TYPE_TELEPORT });
						char.remove();
						char._broken = false;
					}

				}
				
				setTimeout(()=> // Out of loop spawn
				{
					if ( sdWorld.is_server )
					if ( owner )
					//if ( owner.is( sdCharacter ) )
					{
						let instructor_settings = {"hero_name":"Combat Instructor","color_bright":"#7aadff","color_dark":"#25668e","color_bright3":"#7aadff","color_dark3":"#25668e","color_visor":"#ffffff","color_suit":"#000000","color_shoes":"#303954","color_skin":"#51709a","voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"color_suit2":"#000000","color_dark2":"#25668e"};

						let ent = new sdCharacter({ x: owner.x + 16 * owner._side, y: owner.y,
							hmax: 250,
							hea: 250,
							_ai_enabled: sdCharacter.AI_MODEL_TEAMMATE, 
							_ai_gun_slot: 2,
							_ai_level: 10,
							_ai_team: owner.cc_id + 4141,
							sd_filter: sdWorld.ConvertPlayerDescriptionToSDFilter_v2( instructor_settings ), 
							_voice: sdWorld.ConvertPlayerDescriptionToVoice( instructor_settings ), 
							title: instructor_settings.hero_name,
							cc_id: owner.cc_id,
							_owner: owner
						});
						ent.gun_slot = 2;
						ent._jetpack_allowed = true;
						ent.ApplyArmor({ armor: 370, _armor_absorb_perc: 0.55, armor_speed_reduction: 10 }) // Level 2 heavy armor
						ent._matter_regeneration = 5;
						ent._matter_regeneration_multiplier = 10;
						//ent._damage_mult = 1 + 3 / 3 * 1;
						sdEntity.entities.push( ent );

						let ent2 = new sdGun({ x: ent.x, y: ent.y,
							class: sdGun.CLASS_LMG
						}); // Even with LMG it seems weak compared to power-stimpack
						sdEntity.entities.push( ent2 );

						sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });
						sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT });

						ent._ai_stay_near_entity = owner;
						ent._ai_stay_distance = 96;
						
						/*let side_set = false;
						const logic = ()=>
						{
							if ( ent._ai )
							{
								if ( !side_set )
								{
									ent._ai.direction = owner._side;
									side_set = false;
								}
								if ( ent.x > owner.x + 100 )
								ent._ai.direction = -1;
							
								if ( ent.x < owner.x - 100 )
								ent._ai.direction = 1;
							} // Stay close to player
						};
						
						const MasterDamaged = ( victim, dmg, enemy )=>
						{
							if ( enemy && enemy.IsTargetable( ent ) )
							if ( dmg > 0 )
							if ( ent._ai )
							{
								if ( !ent._ai.target || Math.random() > 0.5 )
								ent._ai.target = enemy;
							}
						};
						
						owner.addEventListener( 'DAMAGE', MasterDamaged );
						
						setInterval( logic, 1000 );
						
						setTimeout(()=>
						{
							if ( ent.hea > 0 )
							if ( !ent._is_being_removed )
							{
								ent.Say( [ 
									'Was nice seeing you', 
									'I can\'t stay any longer', 
									'Thanks for the invite, ' + owner.title, 
									'Glad I didn\'t die here lol',
									'Until next time',
									'You can call be later',
									'My time is almost out',
									( ent._inventory[ 4 ] === ent2 ) ? 'You can take my assault rifle' : 'I\'ll miss my assault rifle',
									'Time for me to go'
								][ ~~( Math.random() * 9 ) ], false, false, false );
							}
						}, 60000 - 4000 );
						setTimeout(()=>
						{
							clearInterval( logic );
							
							owner.removeEventListener( 'DAMAGE', MasterDamaged );
							
							if ( !ent._is_being_removed )
							sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });

							ent.DropWeapons();
							ent.remove();
							//ent2.remove();

							ent._broken = false;
							//ent2._broken = false;

						}, 60000 );
						*/
					}
				}, 1 );
				
				return true;
			},
			projectile_properties: {}
		};
		sdGun.classes[ sdGun.CLASS_SETR_PLASMA_SHOTGUN = 91 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'setr_plasma_shotgun' ),
			sound: 'gun_spark',
			sound_pitch: 1.5,
			sound_volume: 1.5,
			title: 'Setr Plasma Shotgun',
			slot: 3,
			reload_time: 23,
			muzzle_x: 7,
			ammo_capacity: 10,
			count: 4,
			spread: 0.18,
			spawnable: false,
			projectile_velocity: 16,
			projectile_properties: { explosion_radius: 7, model: 'ball', _damage: 5, color:'#0000c8', _dirt_mult: 1, _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 10, model: 'ball', color:'#0000c8', _dirt_mult: 1, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 5; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		sdGun.classes[ sdGun.CLASS_SETR_ROCKET = 92 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'setr_homing_launcher' ),
			sound: 'gun_rocket',
			title: 'Setr Rocket Launcher',
			slot: 5,
			reload_time: 6,
			muzzle_x: 8,
			ammo_capacity: -1,
			burst: 6,
			burst_reload: 35,
			spread: 0.05,
			projectile_velocity: 14,
			count: 1,
			spawnable: false,
			projectile_properties: { time_left: 40, explosion_radius: 19, model: 'rocket_proj', _damage: 16 * 3, color:sdEffect.default_explosion_color, ac:0.4, _homing: true, _homing_mult: 0.02, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 40, explosion_radius: 19, model: 'rocket_proj', color:'#7acaff', ac:0.4, _homing: true, _homing_mult: 0.02, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 16 * 3; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_CUBE_TELEPORTER = 93 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cube_teleporter' ),
			sound: 'cube_teleport',
			title: 'Cube-teleporter',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 16,
			spawnable: false,
			allow_aim_assist: false,
			GetAmmoCost: ()=>
			{
				return 0;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( sdWorld.is_server )
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				{
					let off = gun._held_by.GetBulletSpawnOffset();
				
					if ( gun._held_by.matter >= 30 )
					//if ( sdWorld.CheckLineOfSight( gun._held_by.x, gun._held_by.y, gun._held_by.look_x, gun._held_by.look_y, gun._held_by, null, sdCom.com_vision_blocking_classes ) )
					if ( gun._held_by.CanMoveWithoutOverlap( gun._held_by.look_x, gun._held_by.look_y, -8 ) )
					if ( sdWorld.inDist2D_Boolean( gun._held_by.x, gun._held_by.y, gun._held_by.look_x, gun._held_by.look_y, 400 ) )
					if ( sdWorld.AccurateLineOfSightTest( gun._held_by.x + off.x, gun._held_by.y + off.y, gun._held_by.look_x, gun._held_by.look_y, sdCom.com_build_line_of_sight_filter_for_early_threats ) )
					{
						gun._held_by.x = gun._held_by.look_x;
						gun._held_by.y = gun._held_by.look_y;
						gun._held_by.sx = 0;
						gun._held_by.sy = 0;
						gun._held_by.ApplyServerSidePositionAndVelocity( true, 0, 0 );
						gun._held_by.matter -= 30;

						gun._held_by.PhysWakeUp();

						return true;
					}
				}
				return false;
			},
			projectile_properties: { _rail: true, time_left: 0, _damage: 1, color: '#ffffff'},
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_RAYRIFLE = 94 ] =
		{
			image: sdWorld.CreateImageFromFile( 'rayrifle_tcorr' ),
			sound: 'gun_rayrifle',
			//sound_volume: 1.2,
			//sound_pitch: 0.2,
			title: 'Ray Rifle TCoRR',
			slot: 2,
			reload_time: 2.8,
			muzzle_x: 7,
			ammo_capacity: 16,
			count: 1,
			spread: 0.01, // 0.03
			projectile_properties: { _damage: 34, color: '#afdfff', penetrating: true },
			spawnable:false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#afdfff', penetrating: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 34; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#ff0000', 20 ) )
		};
		
		const liquid_carrier_base_color = '#518ad1';
		const liquid_carrier_empty = '#424242';
		// sdWater.reference_colors
		sdGun.classes[ sdGun.CLASS_LIQUID_CARRIER = 95 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'liquid_carrier' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'liquid_carrier' ),
			sound: 'sword_attack2',
			title: 'Liquid carrier',
			slot: 7,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 50,
			projectile_velocity: 16 * 1.5,
			spawnable: true,
			category: 'Equipment',
			is_sword: false,
			GetAmmoCost: ()=>
			{
				return 5;
			},
			onMade: ( gun )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				gun.sd_filter = sdWorld.CreateSDFilter();
				
				sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, liquid_carrier_base_color, liquid_carrier_empty );
			},
			projectile_properties: { time_left: 1, _damage: 1, color: 'transparent', 
				_knock_scale: 0,
				_custom_target_reaction: ( bullet, target_entity ) =>
				{
					if ( target_entity._has_liquid_props )
					{
						let gun = bullet._gun;

						let liquid = ( target_entity.liquid || target_entity._liquid );

						if ( bullet._gun._held_item_snapshot )
						{
							let amount = gun._held_item_snapshot._volume * 100;
							let extra = ( gun._held_item_snapshot.extra || 0 );
	
							if ( target_entity.IsLiquidTypeAllowed( gun._held_item_snapshot.type ) )
							{
								if ( liquid.max - liquid.amount >= amount )
								{
									if ( liquid.type === -1 )
									liquid.type = gun._held_item_snapshot.type;
	
									liquid.amount += amount;
									liquid.extra += extra;
	
									bullet._gun._held_item_snapshot = null;
									sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, liquid_carrier_base_color, liquid_carrier_empty );
								}
								else
								{
									gun._held_item_snapshot._volume -= ( liquid.max - liquid.amount ) / 100;

									liquid.amount = liquid.max;
								}

								sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });

								bullet._custom_detonation_logic = null; // Prevent picking up water on same use
							}
						}
						else
						{
							if ( liquid.amount > 0 )
							{
								let water_ent = new sdWater({ x:0, y:0, type: liquid.type });
								sdEntity.entities.push( water_ent );
	
								water_ent._volume = Math.min( 100, liquid.amount ) / 100;
								let extra = liquid.extra / liquid.amount * water_ent._volume * 100;

								liquid.amount -= water_ent._volume * 100;
								liquid.extra -= extra;
	
								bullet._gun._held_item_snapshot = water_ent.GetSnapshot( GetFrame(), true );
	
								delete bullet._gun._held_item_snapshot._net_id; // Erase this just so snapshot logic won't think that it is a some kind of object that should exist somewhere

								bullet._gun._held_item_snapshot.extra = extra; // For transfer between containers
								
								sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, liquid_carrier_base_color, sdWater.reference_colors[ water_ent.type ] || '#ffffff' );
	
								water_ent.remove();
								
								sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });
	
								bullet._custom_detonation_logic = null; // Prevent placing water on same use
							}
						}
					}
				},
				_custom_detonation_logic:( bullet )=>
				{
					let gun = bullet._gun;
					
					if ( bullet._gun._held_item_snapshot )
					{
						let water_ent = sdWater.GetWaterObjectAt( bullet.x, bullet.y );
						if ( !water_ent )
						{
							bullet._gun._held_item_snapshot.x = Math.floor( bullet.x / 16 ) * 16;
							bullet._gun._held_item_snapshot.y = Math.floor( bullet.y / 16 ) * 16;
							
							let safe_bound = 1;
							
							if ( !sdWorld.CheckWallExistsBox( 
								bullet._gun._held_item_snapshot.x + safe_bound, 
								bullet._gun._held_item_snapshot.y + safe_bound, 
								bullet._gun._held_item_snapshot.x + 16 - safe_bound, 
								bullet._gun._held_item_snapshot.y + 16 - safe_bound, bullet, bullet.GetIgnoredEntityClasses(), bullet.GetNonIgnoredEntityClasses(), null ) )
							{
								water_ent = new sdWater( bullet._gun._held_item_snapshot );
								sdEntity.entities.push( water_ent );
								sdWorld.UpdateHashPosition( water_ent, false );
								
								bullet._gun._held_item_snapshot = null;
								sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, liquid_carrier_base_color, liquid_carrier_empty );
								
								sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });
							}
						}
						else
						{
							if ( water_ent.type === bullet._gun._held_item_snapshot.type )
							if ( bullet._gun._held_item_snapshot._volume < 1 )
							{
								if ( bullet._gun._held_item_snapshot._volume + water_ent._volume <= 1 )
								{
									gun._held_item_snapshot._volume += water_ent._volume;
								}
								else
								{
									let delta = 1 - bullet._gun._held_item_snapshot._volume;

									gun._held_item_snapshot._volume = 1;

									water_ent._volume -= delta;
									water_ent.v = Math.ceil( water_ent._volume * 100 );
									water_ent._update_version++;
									water_ent.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
								}

								water_ent.AwakeSelfAndNear();
								
								water_ent.remove();
								
								sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });
							}
						}
					}
					else
					{
						let water_ent = sdWater.GetWaterObjectAt( bullet.x, bullet.y );

						if ( water_ent )
						{
							let held_by = sdEntity.entities_by_net_id_cache_map.get( bullet._gun.held_by_net_id );

							let connected = null;

							if ( held_by && !held_by._is_being_removed )
							connected = sdCable.GetConnectedEntities( held_by, sdCable.TYPE_LIQUID );

							let can_transfer = false;

							if ( connected && connected.length > 0 )
							{
								for ( let i = 0; i < connected.length; i++ )
								if ( connected[ i ]._has_liquid_props && !connected[ i ]._is_being_removed )
								if ( connected[ i ].IsLiquidTypeAllowed( water_ent.type ) )
								{
									let liquid = ( connected[ i ].liquid || connected[ i ]._liquid );

									let amount = water_ent._volume * 100;
									//let extra = ( water_ent.extra || 0 );

									if ( liquid.max - liquid.amount >= amount )
									{
										if ( liquid.type === -1 )
										liquid.type = water_ent.type;
		
										liquid.amount += amount;
										//liquid.extra += extra;

										water_ent.AwakeSelfAndNear();
										
										water_ent.remove();

										can_transfer = true;
										break;
									}
									else
									{
										water_ent._volume -= ( liquid.max - liquid.amount ) / 100;
										water_ent.v = Math.ceil( water_ent._volume * 100 );
										water_ent._update_version++;
										water_ent.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
	
										liquid.amount = liquid.max;

										can_transfer = true;
										break;
									}
								}
							}

							if ( !can_transfer )
							{
								bullet._gun._held_item_snapshot = water_ent.GetSnapshot( GetFrame(), true );
								
								delete bullet._gun._held_item_snapshot._net_id; // Erase this just so snapshot logic won't think that it is a some kind of object that should exist somewhere
								
								sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, liquid_carrier_base_color, sdWater.reference_colors[ water_ent.type ] || '#ffffff' );
	
								water_ent.AwakeSelfAndNear();
								
								water_ent.remove();
								
								sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });
							}
						}
					}
				}
			}
		};

		sdGun.classes[ sdGun.CLASS_CUSTOM_RIFLE = 96 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'rifle_parts' ),
			
			image_offset_x: -2,
			image_offset_y: 0,
	
			sound: 'gun_rifle',
			
			//title: 'Rifle',
			title_dynamic: ( gun )=> { return gun.extra ? gun.extra[ ID_TITLE ] : 'title_dynamic?'; },
			
			//slot: 2,
			slot_dynamic: ( gun )=> { return gun.extra[ ID_SLOT ]; },
			
			reload_time: 3,
			muzzle_x: 7,
			min_workbench_level: 5,
			
			ammo_capacity: 30,
			ammo_capacity_dynamic: ( gun )=>
			{
				let capacity = sdGun.classes[ gun.class ].parts_magazine[ gun.extra[ ID_MAGAZINE ] ].capacity;
				
				if ( gun.extra[ ID_HAS_EXPLOSION ] )
				capacity /= 5;
				
				if ( gun.extra[ ID_HAS_SHOTGUN_EFFECT ] )
				capacity /= 2;
				
				if ( gun.extra[ ID_HAS_RAIL_EFFECT ] )
				capacity /= 2;
			
				return Math.ceil( capacity );
			},
			
			spread: 0,//0.02,
			//spread_dynamic: ( gun )=> { return 0.02 * gun.extra[ ID_RECOIL_SCALE ]; },
			
			//projectile_velocity: sdGun.default_projectile_velocity,
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity * Math.pow( gun.extra[ ID_DAMAGE_MULT ], 0.25 ) ) },
			
			count: 1,
			projectile_properties: { _damage: 1 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _damage: 25, _dirt_mult: -0.5, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				
				if ( gun.extra[ ID_HAS_SHOTGUN_EFFECT ] )
				{
					obj._dirt_mult = 0;
					//obj._damage /= 5;
					obj._damage /= 2;
					obj._knock_scale /= 2;
				}
				if ( gun.extra[ ID_HAS_EXPLOSION ] )
				{
					obj._dirt_mult = 1;
					obj.explosion_radius = gun.extra[ ID_HAS_SHOTGUN_EFFECT ] ? 13 : 19;
					//obj.explosion_radius = 19;
					obj.model = 'ball';
				}
				if ( gun.extra[ ID_HAS_RAIL_EFFECT ] )
				{
					obj._dirt_mult = 0;
					obj._rail = true;
					obj._rail_circled = true;
				}
				
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				return obj;
			},
			
			use_parts_rendering: true,
			
			parts_base: [
				// W is where stock would start, H is where magazine would start
				{ w:3, h:1, title:'Small' },
				{ w:5, h:2, title:'Bulky' },
				{ w:5, h:1, title:'Longer' },
				{ w:5, h:2, title:'Larger' }
			],
			parts_stock: [
				{ title:'Rifle' },
				{ title:'Longer' },
				{ title:'MP' },
				{ title:'Holey large' }
			],
			parts_magazine: [
				{ title:'Small', capacity: 18, rate: 1 },
				{ title:'Box', capacity: 22, rate: 0.75 },
				{ title:'Assault', capacity: 26, rate: 0.75 },
				{ title:'Chain', capacity: 50, rate: 0.5 },
				{ title:'Boxed chain', capacity: 100, rate: 0.5 }
			],
			parts_barrel: [
				// W offsets muzzle, H offsets under barrel part
				{ w:2, h:0, title:'Tiny' },
				{ w:4, h:1, title:'Bulky' },
				{ w:5, h:1, title:'Sniperish' },
				{ w:5, h:1, title:'Shotgunish' },
				{ w:5, h:2, title:'Grenade launcherish' },
				{ w:5, h:2, title:'Energy' },
				{ w:5, h:2, title:'Energy 2' },
				{ w:5, h:2, title:'Energy 3' },
				{ w:5, h:2, title:'Lasers' },
				{ w:5, h:2, title:'Energy 4' },
				{ w:5, h:2, title:'Holey' }
			],
			parts_underbarrel: [
				{ title:'Dot' },
				{ title:'Some mount thing' },
				{ title:'Knife' },
				{ title:'Laser' },
				{ title:'Grenade launcher' },
				{ title:'Some mount thing 2' },
				{ title:'Forward dot' }
			],
			parts_muzzle: [
				// W is offset for muzzle flash, H is vertical offset
				{ w: 2, h: 0, title:'L' },
				{ w: 1, h: 0, title:'Dot' },
				{ w: 3, h: 0, title:'Bulky silencer' },
				{ w: 3, h: 1, title:'Small silencer' },
				{ w: 3, h: 0, title:'Larger L' },
				{ w: 3, h: 0, title:'Mountable' },
				{ w: 3, h: 0, title:'Bulky' },
				{ w: 2, h: 1, title:'Energy shooter' },
				{ w: 2, h: 1, title:'Energy shooter 2' }
			],
			parts_scope: [
				{ title:'Reflex' },
				{ title:'Merged scope' },
				{ title:'Tiny scope' },
				{ title:'Sniper scope' }
			],
			
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					
					let offset = 0;
					
					function rand()
					{
						return sdWorld.SeededRandomNumberGenerator.random( Math.floor( sdWorld.time / 500 ), offset++ );
					}

					gun.extra[ ID_BASE ] = ~~( rand() * sdGun.classes[ gun.class ].parts_base.length );
					gun.extra[ ID_STOCK ] = ~~( rand() * sdGun.classes[ gun.class ].parts_stock.length );
					gun.extra[ ID_MAGAZINE ] = ~~( rand() * sdGun.classes[ gun.class ].parts_magazine.length );
					gun.extra[ ID_BARREL ] = ~~( rand() * sdGun.classes[ gun.class ].parts_barrel.length );
					gun.extra[ ID_UNDERBARREL ] = ~~( rand() * sdGun.classes[ gun.class ].parts_underbarrel.length );
					gun.extra[ ID_MUZZLE ] = ~~( rand() * sdGun.classes[ gun.class ].parts_muzzle.length );
					gun.extra[ ID_SCOPE ] = ~~( rand() * sdGun.classes[ gun.class ].parts_scope.length );
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					gun.extra[ ID_HAS_EXPLOSION ] = 0;
					gun.extra[ ID_TEMPERATURE_APPLIED ] = 0;
					gun.extra[ ID_HAS_SHOTGUN_EFFECT ] = 0;
					gun.extra[ ID_HAS_RAIL_EFFECT ] = 0;
					gun.extra[ ID_SLOT ] = 2;
					
					if ( params.initiator && params.initiator.IsPlayerClass() && params.initiator._socket )
					{
						gun.extra[ ID_TITLE ] = params.initiator.title + '\'s rifle';
						gun.title_censored = ( typeof sdModeration !== 'undefined' && sdModeration.IsPhraseBad( params.initiator.title, params.initiator._socket ) ) ? 1 : 0;
					}
					else
					{
						gun.extra[ ID_TITLE ] = 'Custom Rifle';
						gun.title_censored = 0;
					}
				
					gun.extra[ ID_PROJECTILE_COLOR ] = '#';
					let str = '0123456789abcdef';
					for ( let i = 0; i < 6; i++ )
					gun.extra[ ID_PROJECTILE_COLOR ] += str.charAt( ~~( Math.random() * str.length ) );
				
					gun._max_dps = 30 / 3 * 25; // Default damage + smallest mag = max DPS... Right?

					UpdateCusomizableGunProperties( gun );
				}
			},
			
			upgrades: AddGunEditorUpgrades()
		};
		
		
		/*let color_score_shard = '#0042ff';
		sdGun.score_shard_recolor_tiers = [
			null,
			null,//sdWorld.CreateSDFilter(),
			sdWorld.CreateSDFilter(),
			sdWorld.CreateSDFilter(),
			sdWorld.CreateSDFilter(),
			sdWorld.CreateSDFilter(),
			sdWorld.CreateSDFilter(),
			sdWorld.CreateSDFilter()
		];
		sdWorld.ReplaceColorInSDFilter_v2( sdGun.score_shard_recolor_tiers[ 2 ], color_score_shard, '#00bcff' );
		sdWorld.ReplaceColorInSDFilter_v2( sdGun.score_shard_recolor_tiers[ 3 ], color_score_shard, '#00ff20' );
		sdWorld.ReplaceColorInSDFilter_v2( sdGun.score_shard_recolor_tiers[ 4 ], color_score_shard, '#ff00d1' );
		sdWorld.ReplaceColorInSDFilter_v2( sdGun.score_shard_recolor_tiers[ 5 ], color_score_shard, '#ff3100' );
		sdWorld.ReplaceColorInSDFilter_v2( sdGun.score_shard_recolor_tiers[ 6 ], color_score_shard, '#fcff00' );
		sdWorld.ReplaceColorInSDFilter_v2( sdGun.score_shard_recolor_tiers[ 7 ], color_score_shard, '#00ffe2' );
		*/
		sdGun.classes[ sdGun.CLASS_SCORE_SHARD = 97 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'score' ),
			image_frames: 4,
			image_duration: 250,
			title: 'Score shard',
			title_dynamic: ( gun )=>
			{
				if ( gun.extra > 1 )
				return 'Score shard x'+gun.extra;
			
				return 'Score shard';
			},
			hea: 400,
			no_tilt: true,
			unhookable: true,
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			apply_shading: false,
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( !gun._is_being_removed )
				if ( character._socket ) // Prevent AI from picking these up
				{
					character.GiveScore( sdEntity.SCORE_REWARD_SCORE_SHARD * gun.extra, gun, false );

					if ( character._socket )
					{
						let power = Math.sqrt( gun.extra );
						sdSound.PlaySound({ name:'powerup_or_exp_pickup', x:character.x, y:character.y, volume:0.4 * ( ( power + 1 ) / 2 ), pitch:0.5 / ( ( power + 1 ) / 2 ) }, [ character._socket ] );
					}
				
					gun.remove();
				}

				return false; 
			},
			onMade: ( gun )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				gun.ttl = 30 * 60 * 1; // 1 minute
				
				gun.extra = 1;
			},
			onThinkOwnerless: ( gun, GSPEED )=>
			{
				if ( gun.follow )
				if ( !gun.follow._is_being_removed )
				{
					const magnet_time = 30 * 60 * 1 - 2 * 30;
					
					if ( gun.ttl < magnet_time ) // Start following after 5 seconds
					{
						let dx = gun.follow.x + ( gun.follow._hitbox_x1 + gun.follow._hitbox_x2 ) / 2 - gun.x;
						let dy = gun.follow.y + ( gun.follow._hitbox_y1 + gun.follow._hitbox_y2 ) / 2 - gun.y;

						if ( sdWorld.inDist2D_Boolean( dx,dy,0,0, 64 ) )
						{
							dx += ( gun.follow.sx - gun.sx ) * 0.3;
							dy += ( gun.follow.sy - gun.sy ) * 0.3;
							
							let intens = Math.min( -( gun.ttl - magnet_time ) / ( 30 * 5 ), 1 );

							gun.sx += dx * 0.02 * GSPEED * intens;
							gun.sy += dy * 0.02 * GSPEED * intens;
						}
					}
				}
		
				return false; // False denies hibernation, true would allow
			}
		};

		sdGun.classes[ sdGun.CLASS_LVL4_ARMOR_REGEN = 98 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'armor_repair_module_lvl4' ),
			title: 'Task Ops Armor Repair Module',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			spawnable: false,
			has_description:[ 'Regeneration rate: 10 armor/sec' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.ApplyArmorRegen( 1000 ) )
				gun.remove(); 

				return false; 
			} 
		};
		
		
		sdGun.classes[ sdGun.CLASS_ADMIN_DAMAGER = 99 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shark' ),
			sound: 'gun_defibrillator',
			title: 'Admin tool for damaging',
			sound_pitch: 2,
			slot: 2,
			reload_time: 2,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			projectile_properties: { _rail: true, time_left: 30, _damage: 1, color: '#ffffff', _reinforced_level:Infinity, _armor_penetration_level:Infinity, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( bullet._owner )
					{
						if ( bullet._owner._god )
						{
							let dmg = Math.max( 50, Math.min( 300, target_entity.hea || target_entity._hea || 0 ) );
							target_entity.DamageWithEffect( dmg, bullet._owner, false, false );
						}
						else
						if ( bullet._owner.IsPlayerClass() )
						{
							// Remove if used by non-admin
							if ( bullet._owner._inventory[ bullet._owner.gun_slot ] )
							if ( sdGun.classes[ bullet._owner._inventory[ bullet._owner.gun_slot ].class ].projectile_properties._admin_picker )
							bullet._owner._inventory[ bullet._owner.gun_slot ].remove();
						}
					}
				}
			},
			onMade: ( gun )=>
			{
				let remover_sd_filter = sdWorld.CreateSDFilter();
				sdWorld.ReplaceColorInSDFilter_v2( remover_sd_filter, '#abcbf4', '#ffaa00' );
				
				gun.sd_filter = remover_sd_filter;
			}
		};
		
		const mop_base_color = '#ffffff';
		const mop_base_color_border = '#cbcbcb';
		// sdWater.reference_colors
		sdGun.classes[ sdGun.CLASS_MOP = 100 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'mop' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'mop' ),
			sound: 'sword_attack2',
			title: 'Mop',
			slot: 7,
			reload_time: 10,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 50,
			projectile_velocity: 16 * 1.5,
			spawnable: true,
			category: 'Other',
			is_sword: false,
			has_description: [ 'Used to clean stains off walls'],
			GetAmmoCost: ()=>
			{
				return 1;
			},
			onMade: ( gun )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				gun.sd_filter = sdWorld.CreateSDFilter();
				
				//sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, liquid_carrier_base_color, liquid_carrier_empty );
			},
			projectile_properties: { time_left: 0.75, _damage: 1, color: 'transparent', 
				_knock_scale: 0,
				_custom_detonation_logic:( bullet )=>
				{
					let gun = bullet._gun;
					
					if ( gun.extra <= 30 )
					{
						let blood_decal_ent = sdBloodDecal.GetBloodDecalObjectAt( bullet.x, bullet.y );

						if ( blood_decal_ent )
						{
							gun.extra++;

							sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });

							blood_decal_ent.intensity -= 50;
							if ( blood_decal_ent.intensity < 33 )
							{
								blood_decal_ent.remove();
							}
							else
							{
								blood_decal_ent._update_version++;
							}
							
							if ( blood_decal_ent._bg )
							if ( blood_decal_ent._bg.material !== sdBG.MATERIAL_GROUND )
							if ( gun._held_by )
							{
								if ( Math.random() < 0.666 ) // Lower score reward rate by 33%
								sdWorld.GiveScoreToPlayerEntity( sdEntity.SCORE_REWARD_SCORE_MOP, blood_decal_ent, true, gun._held_by );
							}
						}
					}
					
					let water_ent = sdWater.GetWaterObjectAt( bullet.x, bullet.y );
					if ( water_ent )
					{
						sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });
						
						while ( gun.extra > 0 && water_ent.type === sdWater.TYPE_WATER )
						{
							gun.extra--;
							if ( Math.random() < 0.01 )
							{
								water_ent.type = sdWater.TYPE_ACID;
								water_ent._update_version++;
							}
						}
					}
					
					if ( gun.extra > 30 )
					{
						sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, mop_base_color, '#8c6a00' );
						sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, mop_base_color_border, '#6f5400' );
					}
					else
					if ( gun.extra > 15 )
					{
						sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, mop_base_color, '#cfc22e' );
						sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, mop_base_color_border, '#a59a25' );
					}
					else
					{
						sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, mop_base_color, mop_base_color );
						sdWorld.ReplaceColorInSDFilter_v2( gun.sd_filter, mop_base_color_border, mop_base_color_border );
					}
				}
			}
		};

		sdGun.classes[ sdGun.CLASS_TELEPORT_SWORD = 101 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'time_shifter_sword' ),
			//sound: 'gun_medikit',
			title: 'Time shifter blade',
			sound: 'sword_attack2',
			image_no_matter: sdWorld.CreateImageFromFile( 'time_shifter_sword' ),
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: true,
			projectile_velocity: 16 * 1.5,
           		spawnable: false,
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( sdWorld.is_server )
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				if ( gun._held_by.matter >= 35 )
				if ( sdWorld.inDist2D_Boolean( gun._held_by.x, gun._held_by.y, gun._held_by.look_x, gun._held_by.look_y, 400 ) )
				{
					let damage_value = 100 + Math.min( 200, 10 * gun._combo ); // Damage increases with combo so it can be efficient against higher health enemies
					//let dx = gun._held_by.look_x - gun._held_by.x;

					//if (dx === 0 ) // Could result in endless for loop
					//dx = gun._held_by._side;

					let dx = gun._held_by.look_x - gun._held_by.x;
					let dy = gun._held_by.look_y - gun._held_by.y;

					let landed_hit = false; // If char damages something, it costs less matter and can be used faster again

					/*let last_x = gun._held_by.x; // Last location player can teleport to
					let last_y = gun._held_by.y; // Last location player can teleport to

					let rail_x = gun._held_by.x; // Rail visual effect location
					let rail_y = gun._held_by.y;*/
							
					let from_x = gun._held_by.x;
					let from_y = gun._held_by.y;
							
					let to_x = from_x;
					let to_y = from_y;

					let di = sdWorld.Dist2D_Vector( dx, dy );

					if ( di > 1 )
					{
						dx /= di;
						dy /= di;
					}
					else
					{
						return true;
					}
					
					let j = gun._held_by.y;


					//let hit_entities = []; // Array for entities that have been hit so they can't be hit multiple times
					let hit_entities = new Set(); // Array for entities that have been hit so they can't be hit multiple times
					
					let pending_solid_wall_hit = null;
					
					let Damage = ( e )=>
					{
						if ( !hit_entities.has( e ) )
						{
							hit_entities.add( e );
							
							if ( e.IsTargetable( gun._held_by ) )
							{
								e.DamageWithEffect( damage_value, gun._held_by );
								
								if ( !landed_hit )
								{
									landed_hit = true;
									sdSound.PlaySound({ name:'cube_teleport', x:e.x, y:e.y, volume:2, pitch: 1.5 });
								}
							}
						}
						
						return false;
					};
					
					let custom_filtering_method = ( e )=>
					{
						if ( sdCom.com_visibility_unignored_classes.indexOf( e.GetClass() ) !== -1 )
						pending_solid_wall_hit = e;
						//return true; Make sure it collects all other possible hits before stopping completely
					
						return false;
					};
					
					let step_size = 8;
					let i = 0;
					let max_i = 0;
					// First cycle - we find position where player will stop
					while ( i <= di )
					{
						pending_solid_wall_hit = null;
						
						let xx = from_x + dx * i;
						let yy = from_y + dy * i;
						gun._held_by.CanMoveWithoutOverlap( xx, yy, 2, custom_filtering_method );
						
						if ( gun._held_by.CanMoveWithoutOverlap( xx, yy, 2 ) )
						{
							to_x = xx;
							to_y = yy;
							max_i = i;
						}
						else
						{
							if ( sdWorld.last_hit_entity )
							Damage( sdWorld.last_hit_entity );
						}
						
						if ( pending_solid_wall_hit )
						{
							//Damage( pending_solid_wall_hit );
							break;
						}
						
						if ( i < di )
						{
							i += step_size;
							if ( i >= di )
							i = di;
						}
						else
						break;
					}
					// Second loop - we deal damage until that point
					i = 0;
					while ( i <= max_i )
					{
						let xx = from_x + dx * i;
						let yy = from_y + dy * i;
						
						gun._held_by.CanMoveWithoutOverlap( xx, yy, 2, Damage );
						
						if ( i < max_i )
						{
							i += step_size;
							if ( i >= max_i )
							i = max_i;
						}
						else
						break;
					}


					sdWorld.SendEffect({ x:gun._held_by.x, y:gun._held_by.y, x2:to_x, y2:to_y, type:sdEffect.TYPE_BEAM, color:'#CCCCCC' });
					gun._held_by.x = to_x;
					gun._held_by.y = to_y;
					gun._held_by.sx = dx * 2;
					gun._held_by.sy = dy * 2;
					gun._held_by.ApplyServerSidePositionAndVelocity( true, 0, 0 );
						
					gun._held_by.PhysWakeUp();

					if ( landed_hit === true )
					{
						gun._combo_timer = 45;
						gun._combo++;
					}
					else
					gun._combo = Math.max( 0, gun._combo - 1 );
					gun._held_by.matter -= landed_hit === true ? 10 : 35;
					gun._reload_time = 15 - Math.min( 7.5, gun._combo * 0.5 ); // Most efficient with timepack
					return true;			

				}
				return false;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				gun._max_dps = ( 30 / 7.5 ) * 300; // Should be 1200 DPS on max combo. On par with upgraded FMMG, and upgraded Zektaron Focus Beam.
			},
			projectile_properties: { _rail: true, time_left: 0, _damage: 100, color: 'transparent'},
			upgrades: AddRecolorsFromColorAndCost( [], '#dcdcdc', 20 )
		};

		sdGun.classes[ sdGun.CLASS_TZYRG_SHOTGUN = 102 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'tzyrg_shotgun' ),
	
			//sound: 'gun_shotgun',
			//sound_pitch: 1.25,
			
			sound: 'tzyrg_fire',
			sound_pitch: 0.8,
			sound_volume: 2,
			
			title: 'Tzyrg Shotgun',
			slot: 3,
			reload_time: 18,
			muzzle_x: 8,
			ammo_capacity: 12,
			count: 5,
			spread: 0.12,
			spawnable: false,
			projectile_velocity: 20,
			projectile_properties: { _damage: 20 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = {};
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddShotgunAmmoTypes( [] ) )
		};

		sdGun.classes[ sdGun.CLASS_COUNCIL_SHOTGUN = 103 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'council_shotgun2' ),
			sound: 'cube_attack',
			sound_pitch: 1.2,
			sound_volume: 1.5,
			title: 'Council Shotgun',
			slot: 3,
			reload_time: 0,
			muzzle_x: 7,
			ammo_capacity: -1,
			spread: 0.03,
			count: 2,
			spawnable: false,
			//fire_type: 2,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 4;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						gun._held_by._auto_shoot_in = 2;
					}
					return false;
				}
				else
				{
					//sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					sdSound.PlaySound({ name:'enemy_mech_attack4', x:gun.x, y:gun.y, volume:1.5, pitch: 2 });
					let matter_cost = gun.GetBulletCost();
					if ( gun._held_by.matter >= matter_cost )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( 14 / ( 1 + gun._combo / 10 ) ); // Faster rate of fire when shooting more
						gun._held_by.matter -= matter_cost;
						gun._combo_timer = 16;
						if ( gun._combo < 10 )
						gun._combo++; // Speed up rate of fire, the longer it shoots
					}
				}
				return true;
			},
			projectile_properties: { _damage: 30, color:'ffff00' },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color:'ffff00' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 30; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
					gun._max_dps = ( 30 / ( 14 / ( 1 + ( 10 / 10 ) ) ) ) * gun.extra[ ID_DAMAGE_VALUE ] * 2; // Max ROF + damage + bullet count
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_RIFLE = 104 ] = // sprite made by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'kvt_rifle' ),
			sound: 'gun_the_ripper2',
			sound_pitch: 1.1,
			title: 'KVT Assault Rifle P54 "CER54"',
			slot: 2,
			reload_time: 2,
			muzzle_x: 7,
			ammo_capacity: 36,
			burst: 4,
			burst_reload: 18,
			count: 1,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.1,
			projectile_properties: { _damage: 42, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 }; // Default value for _knock_scale
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 42; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#0f1937', 15, 'marking' ) )
		};

		sdGun.classes[ sdGun.CLASS_KVT_HANDCANNON = 105 ] = // sprite made by LordBored
		{
			image: sdWorld.CreateImageFromFile( 'kvt_handcannon' ),
			sound: 'gun_the_ripper2',
			sound_pitch: 0.5,
			title: 'KVT Handcannon P36 "Iron Bull"',
			slot: 1,
			reload_time: 16,
			muzzle_x: 8,
			ammo_capacity: 6,
			spread: 0,
			count: 1,
			fire_type: 2,
			spawnable: false,
			projectile_properties: { _damage: 48, _dirt_mult: -0.5 }, // 63, lowered as it can now fullfill it's role - Ghost581
			projectile_velocity: sdGun.default_projectile_velocity * 2,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 }; // Default value for _knock_scale
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 0.75; // 1.75x damage at point blank range, execution tool.
				obj._critical_hit_range = 48; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 64; // 4 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 48; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#0f1937', 15, 'marking' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_THROWABLE_GRENADE = 106 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'grenade_launcher' ),
			sound: 'gun_grenade_launcher',
			title: 'Hand grenade',
			slot: 5,
			reload_time: 20,
			muzzle_x: 7,
			ammo_capacity: -1,
			spread: 0.05,
			count: 1,
			projectile_velocity: 5,
			matter_cost: 60,
			spawnable: false,
			projectile_properties: { 
				damage:1, 
				time_left: 30 * 3, 
				model: 'grenade2', 
				is_grenade: true,
				_custom_detonation_logic: ( bullet )=>
				{
					sdWorld.SendEffect({ 
						x:bullet.x, 
						y:bullet.y, 
						radius:30, // 70 was too much?
						damage_scale: 7, // 5 was too deadly on relatively far range
						type:sdEffect.TYPE_EXPLOSION, 
						owner:bullet._owner,
						can_hit_owner: true,
						color: sdEffect.default_explosion_color 
					});
				}
			},
		};

		sdGun.classes[ sdGun.CLASS_MINING_FOCUS_CUTTER = 107 ] = { // Sprite by Glek, edited by Ghost581
			image: sdWorld.CreateImageFromFile( 'mining_focus_cutter' ),
			sound: 'gun_psicutter_bounce',
			sound_pitch: 0.4,
			sound_volume: 1,
			title: 'Mining Focus Cutter',
			slot: 0,
			reload_time: 3.8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			matter_cost: 360,
			projectile_velocity: 1 * 3,
			min_workbench_level: 2,
			min_build_tool_level: 12,
			projectile_properties: { _rail: true, _damage: 14, color: '#73ff57', _knock_scale:0.1, _dirt_mult: 3 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#73ff57', _dirt_mult: 3 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 14; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_ZEKTARON_FOCUS_BEAM = 108 ] =
		{
			image: sdWorld.CreateImageFromFile( 'zektaron_focus_beam' ), // sprite by Gravel
			// image_charging: sdWorld.CreateImageFromFile( 'zektaron_focus_beam' ), // no animation for now
			//sound: 'supercharge_combined2',
			title: 'Zektaron Focus Beam',
			//sound_pitch: 0.5,
			slot: 8,
			is_long: true,
			reload_time: 0.6,
			spread: 0.03,
			muzzle_x: 13,
			ammo_capacity: -1,
			count: 3,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 6;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						gun._held_by._auto_shoot_in = 2200 / 1000 * 30 / ( 1 + gun._combo / 60 );


						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'enemy_mech_charge', x:gun.x, y:gun.y, volume: 0.9, pitch: 0.7 });
					}
					return false;
				}
				else
				{
					//sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					sdSound.PlaySound({ name: 'alien_laser1', x:gun.x, y:gun.y, volume: 0.7, pitch: 1.42 });
					
					if ( gun._held_by.matter >= 6 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( 5 / ( 1 + gun._combo / 40 ) ); // Faster rate of fire when shooting more
						gun._held_by.matter -= 6;
						gun._combo_timer = 75;
						if ( gun._combo < 75 )
						gun._combo++; // Speed up rate of fire, the longer it shoots
					}
				}
				return true;
			},
			projectile_properties: { _rail: true, _damage: 39 / 3, color: '#cd1e1e', _dirt_mult: -0.2, _temperature_addition: 120 / 3 }, // Combined with fire rate
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#cd1e1e', _dirt_mult: -0.2, _temperature_addition: 120 / 3 };
				obj._knock_scale = 0.01 * 4 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				obj._temperature_addition = gun.extra[ ID_TEMPERATURE_APPLIED ];
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 39 / 3; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					gun.extra[ ID_TEMPERATURE_APPLIED ] = 120 / 3;
					//UpdateCusomizableGunProperties( gun );
					gun._max_dps = ( 30 / ( 5 / ( 1 + (75 / 40 ) ) ) ) * gun.extra[ ID_DAMAGE_VALUE ] * 3; // Copied from _auto_shoot then multiplied with damage value and bullet count.
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'main energy' ),
				'#900000', 15, 'secondary energy' ),
				'#620000', 15, 'tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_RAIL_PISTOL2 = 109 ] = { // Original weapon idea, image & pull request by Booraz149 ( https://github.com/Booraz149 )
			image: sdWorld.CreateImageFromFile( 'rail_pistol2' ),
			sound: 'cube_attack',
			sound_pitch: 0.9,
			title: 'Cube-pistol v2',
			slot: 1,
			reload_time: 3,
			muzzle_x: 5,
			burst: 3,
			burst_reload: 10,
			ammo_capacity: -1,
			count: 1,
			fire_type: 2,
			projectile_properties: { _rail: true, _damage: 22, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 22 * 1.2; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( [] ) )
		};
		
		sdGun.classes[ sdGun.CLASS_AREA_AMPLIFIER = 110 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'area_amplifier' ),
			sound_pitch: 4,
			sound: 'supercharge_combined2_part2',
			title: 'Area amplifier',
			slot: 7,
			reload_time: 15,
			muzzle_x: 8,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 1000,
			projectile_velocity: 10,
			spawnable: false,
			has_description: [ 'Amplifies speed of entities hit by projectile', 'Duration: 2-3 seconds' ],
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				return 300;
			},
			
			projectile_properties: { 
				//explosion_radius: 10, 
				model: 'ball_circle', 
				_damage: 0, color:'#ffffff',
				time_left: 30, 
				_hittable_by_bullets: false,
				_custom_detonation_logic:( bullet )=>
				{
					if ( bullet._owner )
					{
						sdWorld.SendEffect({ 
							x:bullet.x, 
							y:bullet.y, 
							radius:30,
							damage_scale: 0, // Just a decoration effect
							type:sdEffect.TYPE_EXPLOSION, 
							owner:this,
							color:'#ffffff',
							no_smoke: true,
							shrapnel: true
						});

						let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 32 );

						for ( let i = 0; i < nears.length; i++ )
						{
							let e = nears[ i ];
							
							if ( e !== bullet._gun && !e.is( sdBaseShieldingUnit ) )
							if ( typeof e._time_amplification !== 'undefined' )
							{
								let t = 0;
								
								if ( e.is( sdGun ) )
								t = 30 * 3;
								else
								t = 30 * 60;
							
								e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TIME_AMPLIFICATION, t: t });
							}
						}
					}
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#6199ff', 15 ) )
		};
		
		const illusion_reaction = ( bullet, target_entity )=>
		{
			if ( target_entity )
			if ( bullet._owner )
			if ( !bullet._is_being_removed )
			{
				let owner = bullet._owner;
				
				bullet.remove();
				
				let ent2 = sdLost.CreateLostCopy( target_entity, target_entity.title || null, sdLost.FILTER_NONE );
				
				if ( target_entity.is( sdCrystal ) )
				{
					ent2.f = target_entity.GetFilterForIllusions();
					ent2.t = target_entity.GetTitleForIllusions();
					ent2._fake_matter_max = target_entity.matter_max;
				}
				
				if ( owner._side < 0 )
				ent2.x = owner.x + owner._hitbox_x1 - ent2._hitbox_x2;
				else
				ent2.x = owner.x + owner._hitbox_x2 - ent2._hitbox_x1;

				ent2.y = owner.y + owner._hitbox_y2 - ent2._hitbox_y2;
				
				ent2.s = false;
				ent2.m = 30;
			}
		};
		
		sdGun.classes[ sdGun.CLASS_ILLUSION_MAKER = 111 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'illusion_maker' ),
			sound_pitch: 6,
			sound: 'supercharge_combined2_part2',
			
			title: 'Illusion maker',
			slot: 7,
			reload_time: 90,
			muzzle_x: 8,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 1000,
			projectile_velocity: 10,
			spawnable: false,
			has_description: [ 'Creates illusions of objects hit' ],
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				return 600;
			},
			
			projectile_properties: { 
				//explosion_radius: 10, 
				model: 'ball_circle', 
				_damage: 0, 
				color:'#ffffff',
				time_left: 10, 
				_hittable_by_bullets: false,
				_custom_target_reaction: illusion_reaction,
				_custom_target_reaction_protected: illusion_reaction
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#ff0000', 15 ) )
		};

		sdGun.classes[ sdGun.CLASS_SHURG_PISTOL = 112 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shurg_pistol' ),
			sound: 'tzyrg_fire',
			sound_pitch: 2,
			title: 'Shurg Pistol',
			slot: 1,
			reload_time: 7,
			muzzle_x: 5,
			ammo_capacity: 10,
			spread: 0.03,
			count: 2,
			fire_type: 1,
			spawnable: false,
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties: { _damage: 1, color: '#004400' }, // Set the damage value in onMade function ( gun.extra_ID_DAMAGE_VALUE )
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._affected_by_gravity = true;
				obj.color = '#004400';
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 24; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_SETR_REPULSOR = 113 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'setr_repulsor' ),
			sound: 'gun_railgun',
			title: 'Setr Repulsor',
			sound_pitch: 5, volume: 0.33,
			slot: 1,
			reload_time: 38,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 1 }, // Set properties inside projectile_properties_dynamic
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 5, _rail: true, color: '#0000c8' };
				obj._knock_scale = 1.8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20;
					//UpdateCusomizableGunProperties( gun );
				}
			},
		};

		sdGun.classes[ sdGun.CLASS_COUNCIL_IMMOLATOR = 114 ] = // Sprite by Flora/Gravel
		{
			image: sdWorld.CreateImageFromFile( 'council_chargerail' ),
			//sound: 'supercharge_combined2',
			title: 'Council Immolator',
			//sound_pitch: 0.5,
			slot: 4,
			reload_time: 0.3,
			muzzle_x: 10,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 3.5;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						gun._held_by._auto_shoot_in = 750 / 1000 * 30;


						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'enemy_mech_charge', x:gun.x, y:gun.y, volume: 1.5, pitch: 0.7 });
					}
					return false;
				}
				else
				{
					//sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					sdSound.PlaySound({ name:'cube_attack', pitch: 4, x:gun.x, y:gun.y, volume:1.2 });
					let matter_cost = gun.GetBulletCost();
					if ( gun._held_by.matter >= matter_cost )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 3;
						gun._held_by.matter -= matter_cost; // Zektaron beam is at 6 or 7 while being 2x as strong
					}
				}
				return true;
			},
			projectile_properties: { _rail: true, _damage: 32, color: '#ffff00', _temperature_addition: 700 }, // Combined with fire rate
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, _rail_alt:true, _damage: 32, color: '#ffff00', _temperature_addition: 700 }; // High fire damage. Custom guns go to 500 temperature, so why not.
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				obj._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
				{
					let temp = sdStatusEffect.GetTemperature( target_entity ) || 0; // Check entity temperature
					if ( temp > 700 ) // On fire?
					obj._damage = obj._damage * 1.25; // 25% more damage on targets set on fire
				};
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 32; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
					
					gun._max_dps = ( 30 / ( 3 ) ) * gun.extra[ ID_DAMAGE_VALUE ]; // Copied from _auto_shoot then multiplied with damage value.
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_SHURG_SNIPER = 115 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shurg_sniper' ),
			sound: 'gun_sniper',
			sound_pitch: 1.7,
			title: 'Shurg sniper rifle',
			slot: 4,
			reload_time: 60,
			muzzle_x: 9,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: sdGun.default_projectile_velocity * 2,
			spawnable: false,
			projectile_properties: { _damage: 115, color: '#004400', /*_knock_scale:0.01 * 8, */penetrating:true, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { penetrating:true, _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._affected_by_gravity = true;
				obj.color = '#004400';
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 115; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_SETR_LMG = 116 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'setr_lmg' ),
			//sound: 'supercharge_combined2',
			title: 'Setr Light Machine Gun',
			//sound_pitch: 0.5,
			slot: 2,
			reload_time: 0,
			muzzle_x: 11,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 3;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				gun._held_by._key_states.SetKey( 'KeyA', 0 );
				gun._held_by._key_states.SetKey( 'KeyD', 0 );
				gun._held_by._key_states.SetKey( 'KeyW', 0 );
				gun._held_by._key_states.SetKey( 'KeyS', 1 ); // Make the user crouch when using this and cripple mobility. It is strong as Ripper after all
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						gun._held_by._auto_shoot_in = 1200 / 1000 * 30;

						sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1, pitch: 1.5 });
						sdSound.PlaySound({ name: 'enemy_mech_charge', x:gun.x, y:gun.y, volume: 1.5, pitch: 1.2 });
					}
					gun._held_by._key_states.SetKey( 'KeyA', 0 );
					gun._held_by._key_states.SetKey( 'KeyD', 0 );
					gun._held_by._key_states.SetKey( 'KeyW', 0 );
					gun._held_by._key_states.SetKey( 'KeyS', 0 ); // Make the user crouch after charge sequence
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y,volume:0.8, pitch: 1.2 });
					sdSound.PlaySound({ name:'enemy_mech_attack4', x:gun.x, y:gun.y, volume:1.5, pitch: 0.7 });
					let matter_cost = gun.GetBulletCost();
					if ( gun._held_by.matter >= matter_cost )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 4;
						gun._held_by.matter -= matter_cost;
					}
					else
					gun._held_by._key_states.SetKey( 'KeyS', 0 ); // Reset crouch state
				}
				return true;
			},
			projectile_properties: { _damage: 50, _dirt_mult: -0.5 }, // Combined with fire rate
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
				obj._knock_scale = 0.02 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 50; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
					gun._max_dps = ( 30 / ( 4 ) ) * gun.extra[ ID_DAMAGE_VALUE ]; // Copied from _auto_shoot then multiplied with damage value.
					
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};


		sdGun.classes[ sdGun.CLASS_CHAINSAW = 117 ] = {
			image: sdWorld.CreateImageFromFile( 'crystal_saw' ),
			image0: [ sdWorld.CreateImageFromFile( 'crystal_saw_a' ), sdWorld.CreateImageFromFile( 'crystal_saw' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'crystal_saw_a' ), sdWorld.CreateImageFromFile( 'crystal_saw' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'crystal_saw_a' ), sdWorld.CreateImageFromFile( 'crystal_saw' ) ],
			has_images: true,
			//spritesheet: true,
			sound: 'gun_saw',//'cut_droid_attack',
			sound_pitch: 1.2,
			sound_volume: 0.7,
			title: 'Crystal cutter',
			slot: 0,
			reload_time: 6,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			is_sword: false,
			projectile_velocity: 20,
			spawnable: false,
			has_description: [ 'Can be used to cut large crystals into 4 smaller ones' ],
			projectile_properties: 
			{ 
				time_left: 1, _damage: 64, color: 'transparent', _knock_scale:0.1, _dirt_mult: -2,
			},
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = {  time_left: 1, color: 'transparent', _dirt_mult: -2 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				obj._custom_target_reaction_before_damage_tests = ( bullet, target_entity )=>
				{
					if ( target_entity.is( sdCrystal ) )
					{
						target_entity._being_sawed_time = sdWorld.time;
					}
				};
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 64; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
				}
			},
			upgrades: AddGunDefaultUpgrades ( AddRecolorsFromColorAndCost( [], '#c0c0c0', 15, 'blade' ) )
		};

		sdGun.classes[ sdGun.CLASS_CRYOGUN = 118 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cryogun' ),
			sound: 'gun_spark',
			sound_pitch: 1.5,
			title: 'Cryogun',
			slot: 8,
			reload_time: 9,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_velocity: 16,
			spawnable: false,
			projectile_properties: { _damage: 1, model: 'ball', _temperature_addition: -1 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { model: 'ball', _temperature_addition: -1 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 1; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades ( AddRecolorsFromColorAndCost( [], '#0000ff', 15, 'lights' ) )
		};

		sdGun.classes[ sdGun.CLASS_TZYRG_RIFLE = 119 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'tzyrg_rifle' ),
			sound: 'gun_the_ripper2',
			sound_pitch: 3,
			title: 'Tzyrg Assault Rifle',
			slot: 2,
			reload_time: 1,
			muzzle_x: 10,
			ammo_capacity: 36,
			burst: 3,
			burst_reload: 10,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 34, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 34; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		let DrainProjectileBounceReaction = ( bullet, vel=0, hit_entity=null )=> // Also reacts to overlap
		{
			if ( hit_entity )
			{
				if ( hit_entity._is_bg_entity === bullet._is_bg_entity )
				if ( hit_entity._hard_collision )
				if ( bullet._owner !== hit_entity )
				if ( bullet._owner2 !== hit_entity )
				if ( !bullet.sticky_target )
				{
					bullet.sx = (hit_entity.sx||0);
					bullet.sy = (hit_entity.sy||0);

					bullet.sticky_target = hit_entity;
					bullet.sticky_relative_x = bullet.x - hit_entity.x;
					bullet.sticky_relative_y = bullet.y - hit_entity.y;
				}
			}
			else
			{
				// From impact, entity is unknown
				bullet.sx = 0;
				bullet.sy = 0;
			}
		};
		
		let DrainProjectileThink = ( bullet, GSPEED, range=64 )=>
		{
			let owner = ( bullet._owner || bullet._owner2 || null );

			//let range = 64;

			let nears = bullet.GetAnythingNearCache( bullet.x, bullet.y, range );
			let blocking_nears = [];
			for ( let i = 0; i < nears.length; i++ )
			{
				let e = nears[ i ];

				if ( e.is( sdBlock ) || e.is( sdDoor ) )
				blocking_nears.push( e );
			}

			let LOS = ( ignored_entity, x1, y1, x2, y2 )=>
			{
				for ( let i2 = 0; i2 < blocking_nears.length; i2++ )
				{
					let e = blocking_nears[ i2 ];

					if ( e === ignored_entity )
					continue;

					if ( !sdWorld.LineOfSightThroughEntity( e, x1, y1, x2, y2, ( e )=>true, true, true ) )
					return false;
				}
				return true;
			};

			for ( let i = 0; i < nears.length; i++ )
			{
				let e = nears[ i ];
				if ( !e._is_being_removed )
				if ( e !== bullet && e !== owner )
				if ( e._is_bg_entity === bullet._is_bg_entity )
				{
					if ( e.is( sdGun ) )
					{
						if ( e.class === sdGun.CLASS_CRYSTAL_SHARD )
						if ( sdWorld.inDist2D_Boolean( bullet.x, bullet.y, e.x, e.x, range ) )
						if ( LOS( e, bullet.x, bullet.y, e.x, e.y ) )
						e.remove();
					}
					else
					if ( e.IsTargetable( owner ) )
					if ( !e.is( sdBullet ) )
					{
						let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
						let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;

						if ( sdWorld.inDist2D_Boolean( bullet.x, bullet.y, xx, yy, range ) )
						if ( LOS( e, bullet.x, bullet.y, xx, yy ) )
						{
							e.DamageWithEffect( GSPEED * 4, owner, false, false );

							if ( typeof e.matter !== 'undefined' )
							e.matter = Math.max( 0, e.matter - GSPEED * 20 );
							else
							if ( typeof e._matter !== 'undefined' )
							e._matter = Math.max( 0, e._matter - GSPEED * 20 );

							if ( e.is( sdWorld.entity_classes.sdMatterAmplifier ) )
							{
								if ( e.shielded )
								e.ToggleShields();
							}
							else
							if ( e.is( sdBlock ) )
							{
								if ( e.material === sdBlock.MATERIAL_TRAPSHIELD )
								if ( !e._shielded || e._shielded._is_being_removed )
								e.remove();
							}
						}
					}
				}
			}
		};
		
		sdGun.classes[ sdGun.CLASS_DRAIN_RIFLE = 120 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'anti_rifle' ),
			image_firing: sdWorld.CreateImageFromFile( 'anti_rifle_firing' ),
			sound: 'gun_anti_rifle_fire',
			sound_volume: 2,
			title: 'Drain-rifle', // Drain rifle
			slot: 5,
			reload_time: 10,
			muzzle_x: 14,
			ammo_capacity: 8,
			count: 1,
			projectile_velocity: 15,
			matter_cost: 1500,
			min_build_tool_level: 15,
			
			min_workbench_level: 3,
			
			projectile_properties_dynamic: ( gun )=>
			{
				let cur_amount = gun._held_by ? sdLost.entities_and_affection.get( gun._held_by ) : 0;
				
				return { 
					_damage: 0,
					model: ( cur_amount > 0 ) ? 'anti_rifle_projectile_overcharged' : 'anti_rifle_projectile', 
					_hittable_by_bullets: false,
					is_grenade: true,
					time_left: 60,
					explosion_radius: ( cur_amount > 0 ) ? 60 : 30, 
					color: ( cur_amount > 0 ) ? '#fff59c' : '#6ac2ff',

					gravity_scale: 0,
					_detonate_on_impact: false,

					_custom_post_bounce_reaction: DrainProjectileBounceReaction,

					_custom_extra_think_logic: ( bullet, GSPEED )=>
					{
						return DrainProjectileThink( bullet, GSPEED * ( cur_amount > 0 ? 4 : 1 ) * gun.extra[ ID_DAMAGE_MULT ], 64 );
					},

					_custom_detonation_logic:( bullet )=>
					{
						sdSound.PlaySound({ name:'gun_anti_rifle_hit', x:bullet.x, y:bullet.y, volume:1, pitch:( cur_amount > 0 ) ? 0.5 : 1 });
					}
				};
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			
			upgrades: AddGunDefaultUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_SARRONIAN_SMG = 121 ] = {
			image: sdWorld.CreateImageFromFile( 'sarronian_smg' ), // sprite by Gravel
			sound: 'gun_spark',
			sound_pitch: 1.6,
			sound_volume: 0.6, // too loud
			title: 'Sarronian SMG',
			slot: 1,
			reload_time: 1.9,
			muzzle_x: 7,
			ammo_capacity: -1,
			spread: 0.08,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 8, _dirt_mult: -0.5, color: '#00c600' },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, color: '#00c600' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 0.25; // 1.25x damage at effective range - makes sense for SMGs to have some advantage over rifles at close range - Ghost581
				obj._critical_hit_range = 80; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 112; // 7 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%

				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 8; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#00ff00', 15, 'main energy' ),
				'#00c600', 15, 'secondary energy' ),
				'#008700', 15, 'tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_SARRONIAN_RAY = 122 ] = {
			image: sdWorld.CreateImageFromFile( 'sarronian_ray' ), // Sprite and gun concept by Gravel
			sound: 'gun_spark',
			sound_pitch: 3.2,
			sound_volume: 0.6, // too loud
			title: 'Sarronian Ray', // TODO: Add on-hit vampirism and on-kill armor, currently it's on shooting temporarily. - Ghost581
			slot: 1,
			reload_time: 2.3,
			muzzle_x: null,
			ammo_capacity: 42,
			spread: 0.01,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 12, _dirt_mult: -0.5, _rail: true, color: '#00c600' },
			projectile_properties_dynamic: ( gun )=>{ 
				let obj = { _dirt_mult: -0.5, time_left: 30, _rail: true, color: '#00c600' };

				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%

				return obj;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				if ( gun._held_by.hea < gun._held_by.hmax )
				{
					gun._held_by.DamageWithEffect( -4, null ); // Heal self if HP isn't max.
				}
				return true;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 12; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff9300', 15, 'main energy' ),
				'#e16b00', 15, 'secondary energy' ),
				'#974800', 15, 'tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_SARRONIAN_ENERGY_DISPLACER = 123 ] = {
			image: sdWorld.CreateImageFromFile( 'sarronian_energy_displacer' ), // Sprite and gun concept by Gravel
			sound: 'gun_spark',
			sound_pitch: 3.1,
			sound_volume: 1,
			title: 'Sarronian Energy Displacer',
			slot: 5,
			count: 2,
			reload_time: 16.8,
			burst_reload: 48,
			burst: 2,
			muzzle_x: 8,
			ammo_capacity: 12,
			spread: 0.12,
			spawnable: false,
			projectile_properties: { _dirt_mult: 1.25, model: 'sarronian_ball', color: '#00c600', _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: 1.25, model: 'sarronian_ball', color: '#00c600', explosion_radius: 10, _no_explosion_smoke: true,
				_custom_detonation_logic:( bullet )=>
				{
					sdSound.PlaySound({ name:'gun_anti_rifle_hit', x:bullet.x, y:bullet.y, volume:1, pitch: 0.5 });
			
					let bullet_obj1 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj1.sx = 1;
								bullet_obj1.sy = 1;
			
								bullet_obj1.explosion_radius = 5; 
								bullet_obj1.model = 'sarronian_bolt';
								bullet_obj1._damage = 8;
								bullet_obj1.color ='#e16b00';
								bullet_obj1._dirt_mult = 1;
								bullet_obj1._hittable_by_bullets = false;
								bullet_obj1._no_explosion_smoke = true;
								sdEntity.entities.push( bullet_obj1 );
			
					let bullet_obj2 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj2.sx = 1;
								bullet_obj2.sy = -1;
			
								bullet_obj2.explosion_radius = 5; 
								bullet_obj2.model = 'sarronian_bolt';
								bullet_obj2._damage = 8;
								bullet_obj2.color ='#00ff00';
								bullet_obj2._dirt_mult = 1;
								bullet_obj2._hittable_by_bullets = false;
								bullet_obj2._no_explosion_smoke = true;
								sdEntity.entities.push( bullet_obj2 );
			
					let bullet_obj3 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj3.sx = -1;
								bullet_obj3.sy = -1;
			
								bullet_obj3.explosion_radius = 5; 
								bullet_obj3.model = 'sarronian_bolt';
								bullet_obj3._damage = 8;
								bullet_obj3.color ='#00ff00';
								bullet_obj3._dirt_mult = 1;
								bullet_obj3._hittable_by_bullets = false;
								bullet_obj3._no_explosion_smoke = true;
								sdEntity.entities.push( bullet_obj3 );
			
					let bullet_obj4 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj4.sx = -1;
								bullet_obj4.sy = 1;
	
								bullet_obj4.explosion_radius = 5; 
								bullet_obj4.model = 'sarronian_bolt';
								bullet_obj4._damage = 8;
								bullet_obj4.color ='#00ff00';
								bullet_obj4._dirt_mult = 1;
								bullet_obj4._hittable_by_bullets = false;
								bullet_obj4._no_explosion_smoke = true;
								sdEntity.entities.push( bullet_obj4 );
				} };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#00ff00', 15, 'main energy' ),
				'#00c600', 15, 'secondary energy' ),
				'#008700', 15, 'tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_SARRONIAN_BIO_ENERGY_LAUNCHER = 124 ] = {
			image: sdWorld.CreateImageFromFile( 'sarronian_bio_energy_launcher' ), // Sprite and gun concept by Gravel
			sound: 'gun_spark',
			sound_pitch: 0.34,
			sound_volume: 1,
			title: 'Sarronian Bio-Energy Launcher',
			slot: 5,
			count: 1,
			projectile_velocity: 9,
			reload_time: 40,
			muzzle_x: null,
			ammo_capacity: -1,
			spread: 0.2,
			spawnable: false,
			projectile_properties: { _damage: 48, _dirt_mult: 1.4, model: 'sarronian_bio_blob', color: '#974800', explosion_radius: 52, _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				let obj = { _dirt_mult: 1.25, model: 'sarronian_bio_blob', color: '#974800', explosion_radius: 52, _no_explosion_smoke: true,
				_hittable_by_bullets: false,
				is_grenade: true,
				time_left: 75,
				gravity_scale: 0.5,
				_detonate_on_impact: false,

				_custom_post_bounce_reaction:( bullet, vel=0, hit_entity=null )=> // Also reacts to overlap
				{
					if ( hit_entity )
					{
						if ( hit_entity._is_bg_entity === bullet._is_bg_entity )
						if ( hit_entity._hard_collision )
						if ( bullet._owner !== hit_entity )
						if ( bullet._owner2 !== hit_entity )
						{
							bullet.sx = 0;
							bullet.sy = 0;
							bullet.gravity_scale = 0;
						}
					}
					else
					{
						// From impact, entity is unknown
						bullet.sx = 0;
						bullet.sy = 0;
						bullet.gravity_scale = 0;
					}
				},

				_custom_extra_think_logic:( bullet, GSPEED )=>
				{
					let owner = ( bullet._owner || bullet._owner2 || null );
				
					GSPEED *= gun.extra[ ID_DAMAGE_MULT ];

					let range = 48;

					let nears = bullet.GetAnythingNearCache( bullet.x, bullet.y, range );
					for ( let i = 0; i < nears.length; i++ )
					{
						let e = nears[ i ];
						if ( !e._is_being_removed )
						if ( e !== bullet && e !== owner )
						if ( e._is_bg_entity === bullet._is_bg_entity )
						if ( e.IsTargetable( owner ) )
						if ( !e.is( sdGun ) )
						if ( !e.is( sdBullet ) )
						if ( !e.is( sdBlock ) )
						if ( !e.is( sdCrystal ) ) // crashes upon breaking crystals apparently, temporary fix
						if ( !e.is( sdJunk ) ) // crashes upon breaking junk entities apparently, temporary fix
						{
							let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
							let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;

							if ( sdWorld.inDist2D_Boolean( bullet.x, bullet.y, xx, yy, range ) )
							if ( sdWorld.CheckLineOfSight( bullet.x, bullet.y, xx, yy, e, null, sdCom.com_creature_attack_unignored_classes ) )
							{
								e.DamageWithEffect( GSPEED * 4, owner, false, false );

								if ( e.is( sdBlock ) )
								{
									if ( e.material === sdBlock.MATERIAL_TRAPSHIELD )
									if ( !e._shielded || e._shielded._is_being_removed )
									e.remove();
								}
							}
						}
					}
				},
				
				_custom_detonation_logic:( bullet )=> // when the mine projectile detonates, releases an AoE and an initial explosion.
				{
					sdSound.PlaySound({ name:'gun_anti_rifle_hit', x:bullet.x, y:bullet.y, volume:1, pitch: 0.3 });
			
					let bullet_obj1 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj1.sx = 1;
								bullet_obj1.sy = 1;
			
								bullet_obj1.explosion_radius = 8; 
								bullet_obj1._rail = true;
								bullet_obj1._damage = 12;
								bullet_obj1.color ='#e16b00';
								bullet_obj1._dirt_mult = 1;
								bullet_obj1._hittable_by_bullets = false;
								bullet_obj1._no_explosion_smoke = true;

								sdEntity.entities.push( bullet_obj1 );
			
					let bullet_obj2 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj2.sx = 1;
								bullet_obj2.sy = -1;
			
								bullet_obj2.explosion_radius = 8; 
								bullet_obj2._rail = true;
								bullet_obj2._damage = 12;
								bullet_obj2.color ='#e16b00';
								bullet_obj2._dirt_mult = 1;
								bullet_obj2._hittable_by_bullets = false;
								bullet_obj2._no_explosion_smoke = true;

								sdEntity.entities.push( bullet_obj2 );
			
					let bullet_obj3 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj3.sx = -1;
								bullet_obj3.sy = -1;
			
								bullet_obj3.explosion_radius = 8; 
								bullet_obj3._rail = true;
								bullet_obj3._damage = 12;
								bullet_obj3.color ='#e16b00';
								bullet_obj3._dirt_mult = 1;
								bullet_obj3._hittable_by_bullets = false;
								bullet_obj3._no_explosion_smoke = true;

								sdEntity.entities.push( bullet_obj3 );
			
					let bullet_obj4 = new sdBullet({ x: bullet.x, y: bullet.y });
								bullet_obj4.sx = -1;
								bullet_obj4.sy = 1;
	
								bullet_obj4.explosion_radius = 8; 
								bullet_obj4._rail = true;
								bullet_obj4._damage = 12;
								bullet_obj4.color ='#e16b00';
								bullet_obj4._dirt_mult = 1;
								bullet_obj4._hittable_by_bullets = false,
								bullet_obj4._no_explosion_smoke = true;
								
								sdEntity.entities.push( bullet_obj4 );

					let bullet_obj5 = new sdBullet({ x: bullet.x, y: bullet.y }); // lingering damage over time AoE projectile
								bullet_obj5.sx = 0;
								bullet_obj5.sy = 0;

								bullet_obj5.explosion_radius = 16;
								bullet_obj5.model = 'sarronian_bio_gas';
								bullet_obj5.model_size = 3; // the bio gas is a 96 by 96 sprite, use this for 96 by 96 projectile sprites
								bullet_obj5._damage = 8;
								bullet_obj5.color ='#00ff00';
								bullet_obj5._dirt_mult = 1;
								bullet_obj5.projectile_velocity = 0;
								bullet_obj5.time_left = 90;
								bullet_obj5._hittable_by_bullets = false;
								bullet_obj5._detonate_on_impact = false;
								bullet_obj5._no_explosion_smoke = true;
								bullet_obj5._explosion_shrapnel = true;
								bullet_obj5.gravity_scale = 0;
								
								bullet_obj5._custom_extra_think_logic = ( bullet, GSPEED )=>
								{
									GSPEED *= gun.extra[ ID_DAMAGE_MULT ];
				
									let range = 64;
				
									let nears = bullet.GetAnythingNearCache( bullet.x, bullet.y, range );
									for ( let i = 0; i < nears.length; i++ )
									{
										let e = nears[ i ];
										if ( !e._is_being_removed )
										if ( e !== bullet )
										if ( e._is_bg_entity === bullet._is_bg_entity )
										if ( e.IsTargetable() )
										if ( !e.is( sdGun ) )
										if ( !e.is( sdBullet ) )
										if ( !e.is( sdBlock ) )
										if ( !e.is( sdCrystal ) ) // crashes upon breaking crystals apparently, temporary fix
										if ( !e.is( sdJunk ) ) // crashes upon breaking junk entities apparently, temporary fix
										{
											let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
											let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;
				
											if ( sdWorld.inDist2D_Boolean( bullet.x, bullet.y, xx, yy, range ) )
											if ( sdWorld.CheckLineOfSight( bullet.x, bullet.y, xx, yy, e, null, sdCom.com_creature_attack_unignored_classes ) )
											{
												e.DamageWithEffect( GSPEED * 3, false, false ); // deadly if you stay in it for too long, don't overstay.
											}
										}
									}
								}
								sdEntity.entities.push( bullet_obj5 );
				} };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 48; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff9300', 15, 'main energy' ),
				'#e16b00', 15, 'secondary energy' ),
				'#974800', 15, 'tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_SARRONIAN_PLASMA_SPEAR = 125 ] = // Sprite and gun concept by Gravel
		{
			image: sdWorld.CreateImageFromFile( 'sarronian_spear1' ), // sprites by Gravel
			image_alt: sdWorld.CreateImageFromFile( 'sarronian_spear2' ),
			image_charging: sdWorld.CreateImageFromFile( 'sarronian_spear1_charging' ),
			image_charging_alt: sdWorld.CreateImageFromFile( 'sarronian_spear2_charging' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'sarronian_spear_disabled' ),
			is_long: true,
			sound: 'saber_attack',
			sound_volume: 1,
			title: 'Sarronian Plasma Spear',
			slot: 0,
			time_left: 6,
			reload_time: 12,
			fire_mode: 1, // This gun has a special alternative fire mode
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spread: 0.09,
			is_sword: true,
			has_alt_fire_mode: true,
			spawnable: false,
			projectile_properties: { _damage: 1, _dirt_mult: 1, color: '#aaffaa', _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				if ( gun.fire_mode !== 2 )
				{ let obj = { explosion_radius: 28, model:'sarronian_energy_wave', color: '#00ff00', _dirt_mult: 1,
					projectile_velocity: 2, time_left: 75, _hittable_by_bullets: false, gravity_scale: 0,
					model_size: 2, _no_explosion_smoke: true, _explosion_shrapnel: true } // the slash wave is a 64 by 64 sprite, use this for 64 by 64 projectile sprites
				
					obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
					obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
					obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
					obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];

					return obj;
				}

				if ( gun.fire_mode === 2 )
				{ let obj2 = { color: '#00ff00', model:'sarronian_bolt', _dirt_mult: 1,
					time_left: 45, _hittable_by_bullets: false, gravity_scale: 0.66, explosion_radius: 4, projectile_velocity: 6, _no_explosion_smoke: true }
					
					obj2._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
					obj2._damage = gun.extra[ ID_ALT_DAMAGE_VALUE ]; // Damage value is set onMade
					obj2._damage *= gun.extra[ ID_DAMAGE_MULT ];
					obj2._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
					
					if ( gun.extra[ ID_PROJECTILE_COLOR ] )
					obj2.color = gun.extra[ ID_PROJECTILE_COLOR ];

					return obj2; 
				}
			},
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
			
				/*let dmg_scale = 1;

				if ( gun._held_by )
				if ( gun._held_by.power_ef > 0 )
				dmg_scale *= 2.5;*/
				if ( gun.fire_mode !== 1 )
				return 15;// * dmg_scale;
				else
				return 30;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						if ( gun.fire_mode !== 1 )
						{
							gun._held_by._auto_shoot_in = 30;
							gun._count = 4;
							sdSound.PlaySound({ name: 'alien_charge2', x:gun.x, y:gun.y, volume: 1, pitch: 0.9 });
						}
						else
						{
							gun._held_by._auto_shoot_in = 32.5;
							gun._count = 1;
							sdSound.PlaySound({ name: 'alien_energy_power_charge1_fast', x:gun.x, y:gun.y, volume: 1.2, pitch: 0.9 });
						}

						//sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 2 });
					}
					return false;
				}
				else
				{
					if ( gun.fire_mode !== 1 )
					if ( gun._held_by.matter >= 15 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 30
						sdSound.PlaySound({ name: 'alien_charge2', x:gun.x, y:gun.y, volume: 0.9, pitch: 0.9 });

						gun._held_by.matter -= 15;// * dmg_scale;
					}
					else
					if ( gun.fire_mode === 1 )
					if ( gun._held_by.matter >= 25 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						//if ( gun._held_by.stim_ef > 0 )
						gun._held_by._auto_shoot_in = 25;
						sdSound.PlaySound({ name: 'alien_energy_power_charge1_fast', x:gun.x, y:gun.y, volume: 1.1, pitch: 0.9 });
						//else
						//gun._held_by._auto_shoot_in = 15;


						/*let dmg_scale = 1;

						if ( gun._held_by )
						if ( gun._held_by.power_ef > 0 )
						dmg_scale *= 2.5;*/

						gun._held_by.matter -= 30;// * dmg_scale;
					}
				}
				return true;
			},
			onPickupAttempt: ( character, gun )=> // Hints at being able to switch firemodes.
			{ 
				if ( Math.random() > 0.7 )
				character.Say( "This weapon emits great power. Perhaps I can use it somehow?" );
				else
				character.Say( "I think there's a switch somewhere to change firemodes.." );

				return true;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 274; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					gun.extra[ ID_ALT_DAMAGE_VALUE ] = 33; // Damage value of the alternative firing mode bullet
					//UpdateCusomizableGunProperties( gun );
					gun._max_dps = ( 30 / ( 32.5 + 25 ) ) * 480; // Max damage was acquired by shooting an Erthal beacon - which was 480 in first fire mode. Depends on hitting angle.
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#00ff00', 15, 'main energy' ), // main form colors
				'#00c600', 15, 'secondary energy' ),
				'#008700', 15, 'tertiary energy' ),
				'#ff9300', 15, 'alt energy' ), // alt form colors
				'#e16b00', 15, 'alt secondary energy' ),
				'#974800', 15, 'alt tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_ZEKTARON_COMBAT_RIFLE = 126 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'zektaron_combat_rifle' ), // sprite by LordBored
			sound: 'alien_laser1',
			sound_pitch: 1.3,
			title: 'Zektaron Combat Rifle',
			slot: 2,
			reload_time: 1.4,
			muzzle_x: 10,
			ammo_capacity: 36,
			burst: 3,
			burst_reload: 18,
			count: 1,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			projectile_properties: { _dirt_mult: -0.5, color: '#cd1e1e' },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, color: '#cd1e1e' };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 39; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'main energy' ),
				'#900000', 15, 'secondary energy' ),
				'#620000', 15, 'tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_ZEKTARON_RAILGUN = 127 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'zektaron_railgun' ), // sprite by Gravel
			sound: 'alien_laser1',
			sound_pitch: 0.7,
			title: 'Zektaron Railgun',
			slot: 4,
			reload_time: 40,
			muzzle_x: 12,
			ammo_capacity: 4,
			count: 1,
			spawnable: false,
			projectile_properties: { _damage: 92, _dirt_mult: -0.5, color: '#cd1e1e', _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, _rail: true, color: '#cd1e1e', _rail_circled: true, explosion_radius: 4, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 92; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'main energy' ),
				'#900000', 15, 'secondary energy' ),
				'#620000', 15, 'tertiary energy' ) )
		};

		sdGun.classes[ sdGun.CLASS_ZEKTARON_PLASMA_CANNON = 128 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'zektaron_plasma_cannon' ), // sprite by Gravel
			sound: 'alien_laser1',
			sound_pitch: 0.4,
			title: 'Zektaron Plasma Cannon',
			slot: 3,
			reload_time: 60,
			muzzle_x: 8,
			ammo_capacity: -1,
			count: 5,
			spread: 0.09,
			spawnable: false,
			projectile_properties: { _damage: 27, _dirt_mult: -0.5, color: '#cd1e1e', _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
			
				let obj = { _dirt_mult: -0.5, model: 'ball_red', color: '#cd1e1e', explosion_radius: 8, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._critical_hit_mult = 1; // 2x damage at point blank range
				obj._critical_hit_range = 24; // guide: 16 = A dirt block
				obj._weak_critical_hit_range = 48; // 3 dirt blocks
				obj._dirt_mult = -0.25; // To not make it too strong vs dirt
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 27; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'main energy' ),
				'#900000', 15, 'secondary energy' ) )
		};
		sdGun.classes[ sdGun.CLASS_ZEKTARON_PLASMA_REPEATER = 129 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'zektaron_plasma_repeater' ), // sprite by Gravel
			sound: 'alien_laser1',
			sound_pitch: 1.7,
			title: 'Zektaron Plasma Repeater',
			slot: 8,
			reload_time: 22,
			burst: 2,
			burst_reload: 4,
			muzzle_x: 8,
			ammo_capacity: -1,
			count: 1,
			spread: 0.02,
			spawnable: false,
			projectile_properties: { _damage: 24, _dirt_mult: -0.5, color: '#cd1e1e', _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _damage: 24, _dirt_mult: -0.5, model: 'ball_red', color: '#cd1e1e', explosion_radius: 6, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 24; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'main energy' ),
				'#900000', 15, 'secondary energy' ) )
		};

		let spear_target_reaction_glassed = ( bullet, target_entity )=>
		{
			let dmg_scale = 1;
			
			if ( bullet._owner )
			if ( bullet._owner.power_ef > 0 )
			dmg_scale = gun.extra[ ID_DAMAGE_MULT ] ;
			
			if ( target_entity.is( sdLost ) )
			{
				target_entity.DamageWithEffect( 10 * dmg_scale, bullet._owner );
			}
			else
			{
				sdWorld.SendEffect({ 
					x: bullet.x, 
					y: bullet.y, 
					radius: 18,
					damage_scale: 0, // Just a decoration effect
					type: sdEffect.TYPE_EXPLOSION, 
					owner: this,
					color: '#900000',
					no_smoke: true,
					shrapnel: true
				});
				
				let e = target_entity; // Easier mob statues.
				if ( !e.IsPlayerClass() ) // Less damage to players
				sdLost.ApplyAffection( target_entity, 600 * dmg_scale, bullet, sdLost.FILTER_GLASSED );
				else
				sdLost.ApplyAffection( target_entity, 90 * dmg_scale, bullet, sdLost.FILTER_GLASSED );
			}
		};
		sdGun.classes[ sdGun.CLASS_ZEKTARON_HARDLIGHT_SPEAR = 130 ] = // Sprite and gun concept by Gravel
		{
			image: sdWorld.CreateImageFromFile( 'zektaron_spear1' ), // sprites by Gravel
			image_alt: sdWorld.CreateImageFromFile( 'zektaron_spear2' ),
			image_charging: sdWorld.CreateImageFromFile( 'zektaron_spear1_charging' ),
			image_charging_alt: sdWorld.CreateImageFromFile( 'zektaron_spear2_charging' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'zektaron_spear_disabled' ),
			is_long: true,
			sound: 'saber_attack',
			sound_volume: 1,
			title: 'Zektaron Hardlight Spear',
			slot: 0,
			time_left: 6,
			reload_time: 12,
			fire_mode: 1, // This gun has a special alternative fire mode
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spread: 0.09,
			is_sword: true,
			has_alt_fire_mode: true,
			spawnable: false,
			projectile_properties: { _damage: 1, _dirt_mult: -0.5, color: '#aaffaa', _no_explosion_smoke: true },
			projectile_properties_dynamic: ( gun )=>{ 
				
				if ( gun.fire_mode !== 2 )
				{ let obj = { explosion_radius: 12, color: '#ff0000', _dirt_mult: 1, _rail: true,
					_rail_circled: true, time_left: 75, _hittable_by_bullets: false, _no_explosion_smoke: true } // the slash wave is a 64 by 64 sprite, use this for 64 by 64 projectile sprites
				
					obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
					obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
					obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
					obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
					obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
					
					if ( gun.extra[ ID_PROJECTILE_COLOR ] )
					obj.color = gun.extra[ ID_PROJECTILE_COLOR ];

					return obj;
				}

				if ( gun.fire_mode === 2 )
				{ let obj = { color: '#ff0000', _dirt_mult: 1, _rail: true,
				_rail_circled: true, time_left: 75, _hittable_by_bullets: false, _no_explosion_smoke: true,
				_custom_target_reaction_protected:spear_target_reaction_glassed,
				_custom_target_reaction:spear_target_reaction_glassed }
			
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_ALT_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				

				return obj; }
					
			},
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
			
				/*let dmg_scale = 1;

				if ( gun._held_by )
				if ( gun._held_by.power_ef > 0 )
				dmg_scale *= 2.5;*/
				if ( gun.fire_mode !== 1 )
				return 280;// * dmg_scale;
				else
				return 45; //35
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						if ( gun.fire_mode !== 1 )
						{
							gun._held_by._auto_shoot_in = 50;
							gun._count = 2;
							sdSound.PlaySound({ name: 'alien_energy_power_charge2_fast2', x:gun.x, y:gun.y, volume: 1.3, pitch: 1.1 });
							
							// if ( Math.random() > 0.5 )
							// gun._held_by.Say( "Its powers are dormant." );
							// else
							// gun._held_by.Say( "Maybe I should try using this mode later." );
						}
						else
						{
							gun._held_by._auto_shoot_in = 20;
							gun._count = 3;
							sdSound.PlaySound({ name: 'evil_alien_charge1_fast1', x:gun.x, y:gun.y, volume: 1.1, pitch: 0.9 });
						}

						//sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 2 });
					}
					return false;
				}
				else
				{
					if ( gun.fire_mode !== 1 )
					if ( gun._held_by.matter >= 280 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 45;
						sdSound.PlaySound({ name: 'alien_energy_power_charge2_fast2', x:gun.x, y:gun.y, volume: 1.3, pitch: 1.1 });

						gun._held_by.matter -= 280;
					}
					else
					if ( gun.fire_mode === 1 )
					if ( gun._held_by.matter >= 35 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = 15;
						sdSound.PlaySound({ name: 'evil_alien_charge1_fast1', x:gun.x, y:gun.y, volume: 1.1, pitch: 0.9 });

						gun._held_by.matter -= 35;// * dmg_scale;
					}
				}
				return true;
			},
			onPickupAttempt: ( character, gun )=> // Hints at being able to switch firemodes.
			{ 
				if ( Math.random() > 0.7 )
				character.Say( "This weapon emits great power. Perhaps I can use it somehow?" );
				else
				character.Say( "I think there's a switch somewhere to change firemodes.." );

				return true; 
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 112; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					gun.extra[ ID_ALT_DAMAGE_VALUE ] = 1; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
					
					gun._max_dps = ( 30 / ( 20 + 15 ) * 601 ); // Max damage was calculated by shooting an Erthal beacon. Don't know how else I'd do it since explosions lol - Booraz149
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'main energy' ),
				'#900000', 15, 'secondary energy' ),
				'#bc0000', 15, 'alt energy' ),
				'#780000', 15, 'alt secondary energy' ) )
		};

		let ancient_cgun_target_reaction = ( bullet, target_entity )=>
		{
			if ( target_entity.is( sdLost ) )
			{
				target_entity.DamageWithEffect( 9, bullet._owner );
			}
			else
			{
				sdLost.ApplyAffection( target_entity, 9, bullet, sdLost.FILTER_GOLDEN );
			}
		};
		sdGun.classes[ sdGun.CLASS_ANCIENT_TRIPLE_RAIL = 131 ] = // Cube gun but deals lost damage. Cannot be upgraded. Obtainable only via Ancient cubes.
		{
			image: sdWorld.CreateImageFromFile( 'triple_rail3' ),
			sound: 'cube_attack',
			title: 'Ancient Cube-gun',
			slot: 4,
			reload_time: 3,
			muzzle_x: 7,
			ammo_capacity: -1,// 10, // 3
			count: 1,
			GetAmmoCost: ()=>
			{
				return 12;
			},
			projectile_properties: { _rail: true, _damage: 1, color: '#d6981e', _custom_target_reaction: ancient_cgun_target_reaction /*, _knock_scale:0.01 * 8*/ }, // 70
			spawnable: false,
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};
		
		sdGun.classes[ sdGun.CLASS_MERGER_CORE = 132 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'merger_core' ),
			sound: 'gun_defibrillator',
			title: 'Weapon merger core',
			sound_pitch: 1,
			slot: 0,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			ignore_slot: true,
			has_description: [ 'Needed for weapon merging in weapon merging bench' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup, made to put in crates or weapon merger
			{ 
				return false; 
			}
		};
		
		sdGun.classes[ sdGun.CLASS_TOPS_PLASMA_RIFLE = 133 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'tops_plasma_rifle' ),
			sound: 'gun_spark',
			title: 'Task Ops Plasma Rifle',
			slot: 8,
			reload_time: 3.5,
			muzzle_x: 10,
			ammo_capacity: 40,
			count: 1,
			spawnable: false,
			projectile_velocity: 16,
			projectile_properties: { _damage: 1 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 10, model: 'ball', color:'#00ffff', _dirt_mult: 1, _no_explosion_smoke: true };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ]; // Make sure guns have _knock_scale otherwise it breaks the game when fired
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				obj._explosion_mult = gun.extra[ ID_DAMAGE_MULT ] || 1;
				
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 15; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					gun.extra[ ID_PROJECTILE_COLOR ] = '#00ffff'; // Muzzle flash
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_ERTHAL_ENERGY_CELL = 134 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'erthal_energy_cell' ),
			title: 'Erthal energy cell',
			no_tilt: true,
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			spawnable: false,
			ignore_slot: true,
			apply_shading: false,
			has_description: [ 'Increases max matter capacity on pickup' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				// 20 more levels, 20 * 45 more matter, 4 * 45 matter per shard
				
				//if ( character._upgrade_counters[ 'upgrade_energy' ] )
				//if ( character._upgrade_counters[ 'upgrade_energy' ] < 60 )
				if ( character._matter_capacity_boosters < character._matter_capacity_boosters_max ) // 20 * 45 )
				{
					if ( character._socket )
					sdSound.PlaySound({ name:'cube_shard', x:character.x, y:character.y, volume:1, pitch:1 }, [ character._socket ] );
				
					character._matter_capacity_boosters = Math.min( character._matter_capacity_boosters + 4 * 45, character._matter_capacity_boosters_max );
					character.onScoreChange();
					
					//character._upgrade_counters[ 'upgrade_energy' ] = Math.min( 60, character._upgrade_counters[ 'upgrade_energy' ] + 4 );
					//character.matter_max = Math.round( 50 + character._upgrade_counters[ 'upgrade_energy' ] * 45 );
					
					
					if ( Math.random() > 0.5 )
					character.Say( "These Erthal energy cells are efficient at storing matter" );
					else
					character.Say( "One of these! Should help my matter capacity last longer" );
					gun.remove(); 
				}

				return false; 
			},
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};
		
		sdGun.classes[ sdGun.CLASS_ERTHAL_DMR = 135 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'erthal_dmr' ), // Sprite by Flora / Gravel
			sound: 'spider_deathC3',
			sound_pitch: 0.35,
			sound_volume: 1.5,
			title: 'Erthal Marksman Rifle',
			slot: 4,
			reload_time: 1,
			muzzle_x: 7,
			ammo_capacity: 10,
			count: 1,
			spawnable: false,
			burst: 2, // Burst fire count
			burst_reload: 24, // Burst fire reload, needed when giving burst fire
			projectile_velocity: sdGun.default_projectile_velocity * 1.7,
			projectile_properties: { _damage: 60,  color: '#00aaff', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#00aaff', _dirt_mult: -0.5 };
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				// if ( gun.extra[ ID_HAS_EXALTED_CORE ] ) // Has exalted core been infused?
				// obj._damage *= 1.25; // Increase damage further by 25%
				
				//obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 60; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#37a3ff', 15, 'energy color' ) )
		};
		
		// TODO: Could be nice to have same but for BSU management
		const weld_reaction_method = ( bullet, target_entity )=>
		{
			if ( bullet._owner._current_built_entity )
			if ( !bullet._owner._current_built_entity.is( sdWorld.entity_classes.sdSteeringWheel ) )
			bullet._owner._current_built_entity = null;
			
			if ( target_entity.is( sdWorld.entity_classes.sdSteeringWheel ) )
			{
				if ( target_entity.type === sdWorld.entity_classes.sdSteeringWheel.TYPE_ELEVATOR_MOTOR )
				bullet._owner.Say( 'Elevator motor selected. Let\'s pick parts to weld to it' );
				else
				bullet._owner.Say( 'Steering wheel selected. Let\'s pick parts to weld to it' );
			
				bullet._owner._current_built_entity = target_entity;
				return;
			}
			
			if ( bullet._owner._current_built_entity && !bullet._owner._current_built_entity._is_being_removed )
			{
				if ( !target_entity.is( sdWorld.entity_classes.sdSteeringWheel ) ) // Do no allow steering wheels to be weld to elevator motors as it may cause bugs
				bullet._owner._current_built_entity.ToggleSingleScanItem( target_entity, bullet._owner );
			}
			else
			bullet._owner.Say( 'Elevator motor or steering wheel is not yet selected' );
		};
		sdGun.classes[ sdGun.CLASS_WELD_TOOL = 136 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'weld_gun' ),
			image_firing: sdWorld.CreateImageFromFile( 'weld_gun_fire' ),
			sound: 'gun_spark',
			title: 'Elevator weld tool',
			sound_pitch: 1.5,
			sound_volume: 0.333,
			slot: 7,
			reload_time: 15,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 300,
			min_build_tool_level: 2,
			projectile_velocity: 16,
			projectile_properties: { time_left: 2, _damage: 1, color: 'transparent', 
				_custom_target_reaction_protected: weld_reaction_method,
				_custom_target_reaction: weld_reaction_method
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
			}
		};
		
		
		let deleter_previous_hits = [];
		sdGun.classes[ sdGun.CLASS_ADMIN_MASS_DELETER = 137 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shark' ),
			sound: 'gun_defibrillator',
			title: 'Admin tool for mass removing',
			sound_pitch: 2,
			slot: 5,
			reload_time: 20,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: Infinity,
			projectile_velocity: 16,
			spawnable: false,
			projectile_properties: { _rail: true, time_left: 30, _damage: 1, color: '#ffffff', _reinforced_level:Infinity, _armor_penetration_level:Infinity, _admin_picker:true, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( bullet._owner )
					{
						if ( bullet._owner._god )
						{
							if ( target_entity.GetClass() === 'sdDeepSleep' )
							{
								// Never remove these
							}
							else
							{
								// Delete
								let search_net_id = target_entity._net_id;
								
								let deletion_mode = false;
								
								for ( let i = 0; i < deleter_previous_hits.length; i++ )
								{
									if ( deleter_previous_hits[ i ].time > sdWorld.time - 1000 * 5 ) // 5 seconds just like steering wheel effect ping
									{
										if ( deleter_previous_hits[ i ].target_entity_net_id === target_entity._net_id )
										{
											deletion_mode = true;
											break;
										}
									}
									else
									{
										deleter_previous_hits.splice( i, 1 );
										i--;
										continue;
									}
								}
								
								let found = false;
								
								for ( let [ key, arr ] of sdWorld.recent_built_item_net_ids_by_hash )
								{
									let id = -1;
									
									for ( let i = 0; i < arr.length; i++ )
									if ( arr[ i ]._net_id === search_net_id )
									{
										id = i;
										break;
									}
													
									if ( id !== -1 )
									{
										if ( deletion_mode )
										bullet._owner.Say( 'Mass deleting...' );
										else
										{
											found = true;
											
											bullet._owner.Say( 'Those are made by player marked in /a command menu. Fire at the same object again to mass remove all build objects by them.' );
											
											for ( let i = 0; i < sdWorld.recent_players.length; i++ )
											sdWorld.recent_players[ i ].mark = ( sdWorld.recent_players[ i ].my_hash === key ) ? 'This user has made recently marked objects' : '';
										}
										
										deleter_previous_hits.push({
											
											time: sdWorld.time,
											target_entity_net_id: target_entity._net_id
											
										});
										
										for ( let i = 0; i < arr.length; i++ )
										{
											let e = sdEntity.entities_by_net_id_cache_map.get( arr[ i ]._net_id );
											if ( e && !e._is_being_removed )
											{
												if ( deletion_mode )
												{
													e.remove();
													e._broken = false;
												}
												else
												e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_STEERING_WHEEL_PING, c: [ 4,0,0 ], observer: bullet._owner });
											}
										}
										break;
									}
								}
								
								if ( !found )
								{
									for ( let i = 0; i < sdWorld.recent_players.length; i++ )
									sdWorld.recent_players[ i ].mark = '';
								}
							}
						}
						else
						if ( bullet._owner.IsPlayerClass() )
						{
							// Remove if used by non-admin
							if ( bullet._owner._inventory[ bullet._owner.gun_slot ] )
							if ( sdGun.classes[ bullet._owner._inventory[ bullet._owner.gun_slot ].class ].projectile_properties._admin_picker )
							bullet._owner._inventory[ bullet._owner.gun_slot ].remove();
						}
					}
				}
			},
			onMade: ( gun )=>
			{
				let remover_sd_filter = sdWorld.CreateSDFilter();
				sdWorld.ReplaceColorInSDFilter_v2( remover_sd_filter, '#abcbf4', '#222222' );
				
				gun.sd_filter = remover_sd_filter;
			}
		};
		sdGun.classes[ sdGun.CLASS_UPGRADE_STATION_CHIPSET = 138 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'upgrade_station_chipset' ),
			sound: 'gun_defibrillator',
			title: 'Upgrade station chipset',
			sound_pitch: 1,
			slot: 0,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			ignore_slot: true,
			has_description: [ 'Used for upgrading the Upgrade station' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup, made to put in crates or weapon merger
			{ 
				return false; 
			}
		};

		sdGun.classes[ sdGun.CLASS_EXALTED_CORE = 139 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'exalted_core' ),
			sound: 'gun_defibrillator',
			title: 'Exalted core',
			sound_pitch: 1,
			slot: 0,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			ignore_slot: true,
			has_description: [ 'Can be merged with weapons to increase their damage' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup, made to put in crates or weapon merger
			{ 
				return false; 
			}
		};
		
		sdGun.classes[ sdGun.CLASS_CUBE_FUSION_CORE = 140 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'cube_fusion_core' ),
			sound: 'gun_defibrillator',
			title: 'Cube fusion core',
			sound_pitch: 1,
			slot: 0,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			ignore_slot: true,
			has_description: [ 'Can be merged with weapons to reduce their matter cost' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup, made to put in crates or weapon merger
			{ 
				return false; 
			}
		};

		sdGun.classes[ sdGun.CLASS_DRINK = 141 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'can' ),
			image_no_matter: sdWorld.CreateImageFromFile( 'can_empty' ),
			image0: [ sdWorld.CreateImageFromFile( 'can_firing' ), sdWorld.CreateImageFromFile( 'can_firing' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'can_firing' ), sdWorld.CreateImageFromFile( 'can_firing' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'can_firing' ), sdWorld.CreateImageFromFile( 'can_firing' ) ],
			has_images: true,
			//image_firing: sdWorld.CreateImageFromFile( 'can_firing' ),
			//image_no_matter: sdWorld.CreateImageFromFile( 'can' ),
			title: 'Drink',
			slot: 7,
			reload_time: 75,
			muzzle_x: null,
			ammo_capacity: 1,
			count: 0,
			matter_cost: 10,
			projectile_velocity: 16,
			spawnable: true,
			category: 'Other',
			//is_sword: true,
			GetAmmoCost: ()=>
			{
				return 10;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				sdSound.PlaySound({ name:'can_drink', x:gun.x, y:gun.y, volume:1, pitch:1 });
				
				let owner = gun._held_by;
				
				setTimeout( ()=>
				{
					if ( gun._held_by )
					{
						if ( gun._held_by !== owner )
						return;
					}
					else
					{
						gun.x = owner.x;
						gun.y = owner.y;
					}
					
					if ( owner && !gun._is_being_removed )
					if ( owner.IsPlayerClass() )
					owner.Damage( -20, null );
				
				}, 1267 );
				
				setTimeout( ()=>
				{
					if ( gun._held_by )
					{
						if ( gun._held_by !== owner )
						return;
					}
					else
					{
						gun.x = owner.x;
						gun.y = owner.y;
					}
				
					if ( owner && !gun._is_being_removed )
					if ( owner.IsPlayerClass() )
					owner.Damage( -20, null );
					
				}, 2169 );
				
				/*setTimeout( ()=>
				{
					gun.remove();
				}, 2700 );*/
				
				
				return true;
			},
			projectile_properties: { _damage: 0 }
		};

		let void_target_reaction = ( bullet, target_entity )=>
		{	
			if ( target_entity.is( sdLost ) )
			{
				target_entity.DamageWithEffect( 0, bullet._owner );
			}
			else
			{
				sdWorld.SendEffect({ 
					x: bullet.x, 
					y: bullet.y, 
					radius: 16,
					damage_scale: 0, // Just a decoration effect
					type: sdEffect.TYPE_EXPLOSION_NON_ADDITIVE, 
					owner: this,
					color: '#000000',
					no_smoke: true,
					shrapnel: true
				});

				sdLost.ApplyAffection( target_entity, 60, bullet, sdLost.FILTER_VOID );
			}
		};

		sdGun.classes[ sdGun.CLASS_CUBE_VOID_CAPACITOR = 142 ] = 
        	{ 
			image: sdWorld.CreateImageFromFile( 'cube_void_capacitor' ),
			sound: 'cube_attack',
			sound_volume: 1.5,
			sound_pitch: 0.5,
			title: 'Cube void capacitor',
			slot: 4,
			reload_time: 8,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spread: 0,
			spawnable: false,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{	
				return 60;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					{
						gun._held_by.ApplyStatusEffect({ type: sdStatusEffect.TYPE_CUBE_BOSS_PROPERTIES, ttl: 30 * 6 });
					}
				}
			},
			projectile_properties: { _rail: true,_rail_circled: true,color:'#000000',_damage: 0, time_left: 30,_custom_target_reaction_protected:void_target_reaction,_custom_target_reaction:void_target_reaction },			
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_ARMOR_STARTER = 143 ] = // Sprite and concept by Booraz
		{
			image: sdWorld.CreateImageFromFile( 'armor_starter' ),
			title: 'SD-00 Starter Armor',
			slot: 0,
			reload_time: 25,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_properties: { _damage: 0 },
			ignore_slot: true,
			matter_cost: 100,
			armor_properties: { armor: 100, _armor_absorb_perc: 0.2, armor_speed_reduction: 0 }, // This way it's compatible with upgrade station checks
			has_description: [ 'Armor: 100', 'Damage absorption: 20%', 'Movement speed reduction: 0%' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as armor
			{ 
				if ( character.ApplyArmor( sdGun.classes[ gun.class ].armor_properties ) )
				gun.remove();

				return false; 
			} 
		};

		sdGun.classes[ sdGun.CLASS_BANANA = 144 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'banana' ),
			title: 'Banana',
			slot: 7,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 10,
			projectile_velocity: 16,
			spawnable: true,
			category: 'Other',
			GetAmmoCost: ()=>
			{
				return 0;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				sdSound.PlaySound({ name:'popcorn', x:gun.x, y:gun.y, volume:0.3 + Math.random() * 0.2, pitch:1.5 + Math.sin( gun._net_id ) * 0.2 });

				let peel = new sdLandMine({ x:gun.x, y:gun.y, variation:2 });

				if ( gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_BANANA ].slot ] )
				gun._held_by._inventory[ sdGun.classes[ sdGun.CLASS_BANANA ].slot ].remove();
				
				return true;
			},
			projectile_properties: { _damage: 0 }
		};
		
		sdGun.classes[ sdGun.CLASS_UNSTABLE_CORE = 145 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'unstable_core' ),
			sound: 'gun_defibrillator',
			title: 'Unstable core',
			sound_pitch: 1,
			slot: 0,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			ignore_slot: true,
			has_description: [ 'Can be merged with weapons to alter power', 'Power determined at weapon merging bench' ],
			onPickupAttempt: ( character, gun )=> // Cancels pickup, made to put in crates or weapon merger
			{ 
				return false; 
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				// Unstable core has randomized power/dps
					gun._max_dps = Math.max( 250, ( 100 + Math.random() * 500 ) * ( Math.random() < 0.8 ? 0.9 : 1 ) );
					// It can be merged with other unstable cores to raise power, reaching up to 600 DPS. (Still lose 5% on merging though)
					//console.log( gun._max_dps );
			}
		};
		
		sdGun.classes[ sdGun.CLASS_STALKER_CANNON = 146 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'stalker_cannon' ),
			image_alt: sdWorld.CreateImageFromFile( 'stalker_cannon2' ),
			image_charging: sdWorld.CreateImageFromFile( 'stalker_cannon_charging' ),
			image_charging_alt: sdWorld.CreateImageFromFile( 'stalker_cannon_charging' ),
			title: 'Stalker Annihilator',
			slot: 5,
			reload_time: 20,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			fire_mode: 1,
			has_alt_fire_mode: true,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				if ( gun.fire_mode === 1 )
				return 250;
			
				if ( gun.fire_mode === 2 )
				return 500; 
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						gun._held_by._auto_shoot_in = 35;
						
						if ( sdWorld.is_server )
						if ( gun.fire_mode === 2 )
						gun._held_by.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, ttl: 15 * 20 });

						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 0.75 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name:'alien_laser1', x:gun.x, y:gun.y, volume:1, pitch: 0.2 });
					//if ( gun.fire_mode === 2 )
					if ( gun._held_by )
					if ( !gun._held_by._is_being_removed )
					{
						let owner = gun._held_by;
						
						if ( owner._key_states.GetKey( 'Mouse3' ) ) // Right-click to boost forward
						if ( owner.look_x !== null && owner.look_y !== null ) // Prevent weird bugs
						{
							let an = ( Math.atan2( owner.look_x - owner.x, owner.look_y - owner.y ) )
							owner.sx += Math.sin ( an ) * 10;
							owner.sy += Math.cos ( an ) * 10;
						}
					}
				}
			},
			projectile_properties: { model: 'ball_large', _damage: 350, color: '#FF0000' },
			projectile_properties_dynamic: ( gun )=>
			{
				let obj =
				{ 
					model: gun.fire_mode === 2 ? 'ball_large_circled' : 'ball_large',
					_hittable_by_bullets: false,
					time_left: 60,
					color: '#FF0000',

					_custom_extra_think_logic:( bullet, GSPEED )=>
					{
						let owner = ( bullet._owner || bullet._owner2 || null );
					
						GSPEED *= gun.extra[ ID_DAMAGE_MULT ];

						let range = 64;

						let nears = bullet.GetAnythingNearCache( bullet.x, bullet.y, range );
						for ( let i = 0; i < nears.length; i++ )
						{
							let e = nears[ i ];
							if ( !e._is_being_removed )
							if ( e !== bullet && e !== owner )
							if ( e._is_bg_entity === bullet._is_bg_entity )
							if ( e.IsTargetable( owner ) )
							{
								let xx = e.x + ( e._hitbox_x1 + e._hitbox_x2 ) / 2;
								let yy = e.y + ( e._hitbox_y1 + e._hitbox_y2 ) / 2;

								if ( sdWorld.inDist2D_Boolean( bullet.x, bullet.y, xx, yy, range ) )
								if ( sdWorld.CheckLineOfSight( bullet.x, bullet.y, xx, yy, e, null, sdCom.com_creature_attack_unignored_classes ) )
								{
									if ( !e.is( sdGun ) )
									if ( !e.is( sdBullet ) )
									e.DamageWithEffect( GSPEED * 32, owner, false, false );
								
									if ( gun.fire_mode === 2 )
									{
										if ( typeof e.sx !== 'undefined' )
										if ( typeof e.sy !== 'undefined' )
										{
											if ( e.is( sdBullet ) )
											e._owner = owner;
										
											let an = ( Math.atan2( bullet.x - e.x, bullet.y - e.y ) ) // Pull enemies into the bullet to make it easier to hit
		
											e.sx += ( Math.sin ( an ) * 5 ) / ( e.mass * 0.05 );
											e.sy += ( Math.cos ( an ) * 5 ) / ( e.mass * 0.05 );
										}
									}
									
									if ( e.IsPlayerClass() )
									{
										if ( sdWorld.is_server )
										if ( gun.fire_mode === 2 )
										e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, ttl: 15 * 20 });
									}
								}
							}
						}
					},
					_custom_detonation_logic:( bullet )=>
					{
						if ( bullet._owner )
						{
							sdWorld.SendEffect({ 
								x:bullet.x, 
								y:bullet.y, 
								radius:48,
								damage_scale: 5,
								type:sdEffect.TYPE_EXPLOSION, 
								owner:bullet._owner,
								color:'#FF0000',
								shrapnel: true
							});
							
							if ( gun.fire_mode === 2 )
							{
								let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 48 );

								for ( let i = 0; i < nears.length; i++ )
								{
									if ( nears[ i ].IsPlayerClass() )
									{
										nears[ i ].ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, ttl: 15 * 20 });
									}
								}
							}
						}
					} 
				}
				obj._knock_scale = 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ];
				obj._damage = gun.fire_mode === 2 ? gun.extra[ ID_ALT_DAMAGE_VALUE ] : gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				
				return obj;
			},
			
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 350; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					gun.extra[ ID_ALT_DAMAGE_VALUE ] = 600; // Damage value of the alternative firing mode bullet
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'accelerator' ),
				'#00ffff', 15, 'core' ),
				'#008080', 15, 'glow' ),
				'#800000', 15, 'glow alt' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_STALKER_BEAM = 147 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'stalker_beam' ),
			image_alt: sdWorld.CreateImageFromFile( 'stalker_beam2' ),
			sound: 'cube_attack',
			title: 'Stalker Psychotic Beam',
			slot: 4,
			reload_time: 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { _rail: true, _rail_alt: true, _damage: 22, color: '#00FFFF' },
			spawnable: false,
			fire_mode: 1,
			has_alt_fire_mode: true,
			projectile_properties_dynamic: ( gun )=> { 
				
				let obj = { _rail: true, _rail_alt: true, color: '#00FFFF', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ], _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( target_entity.IsPlayerClass() )
					{
						let owner = gun._held_by;
						
						if ( owner && !owner._is_being_removed )
						target_entity.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, ttl: 15 * 20, owner: owner, controllable: gun.fire_mode === 2 });
					}
				} };
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ];
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 22; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'accelerator' ),
				'#00ffff', 15, 'core' ),
				'#008080', 15, 'glow' ),
				'#800000', 15, 'glow alt' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_STALKER_RIFLE = 148 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'stalker_clone_rifle' ),
			image_alt: sdWorld.CreateImageFromFile( 'stalker_clone_rifle2' ),
			sound: 'alien_laser1',
			title: 'Stalker Rapid Rifle',
			slot: 2,
			reload_time: 2,
			muzzle_x: 8,
			ammo_capacity: -1,
			spread: 0.01,
			count: 1,
			spawnable: false,
			fire_mode: 1,
			has_alt_fire_mode: true,
			projectile_properties: { color: '#00FFFF', _damage: 1 }, // Set the damage value in onMade function ( gun.extra_ID_DAMAGE_VALUE )
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#00FFFF', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				if ( gun.extra[ ID_PROJECTILE_COLOR ] )
				obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
			
				if ( gun.fire_mode === 2 )
				{
					obj._homing = true;
					obj._homing_mult = 0.1;
					obj.ac = 0.2;
				}
				
				return obj;
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 25; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'accelerator' ),
				'#00ffff', 15, 'core' ),
				'#008080', 15, 'glow' ),
				'#800000', 15, 'glow alt' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_STALKER_CLONER = 149 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'stalker_cloner' ),
			image_alt: sdWorld.CreateImageFromFile( 'stalker_cloner2' ),
			sound: 'gun_raygun',
			sound_pitch: 1.333,
			title: 'Stalker Clone Ray',
			slot: 7,
			reload_time: 96,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { _rail: true, _rail_alt: true, _damage: 1, color: '#00FFFF', time_left: 10 },
			spawnable: false,
			fire_mode: 1,
			has_alt_fire_mode: true,
			GetAmmoCost: ( gun )=>
			{
				if ( gun.fire_mode === 1 )
				return 300;
			
				if ( gun.fire_mode === 2 )
				return 200; 
			},
			projectile_properties_dynamic: ( gun )=> 
			{ 
				// if ( gun.fire_mode === 1 ) // Create clone
				{
					let obj = 
					{
						_rail: true, _rail_zap: true, color: '#00FFFF', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ], time_left: 10, _custom_target_reaction:( bullet, target_entity )=>
						{
							let owner = gun._held_by;
					
							if ( target_entity.is( sdCharacter ) && ( target_entity._voice.variant !== 'clone' ) ) // No clones of clones
							{
								if ( sdWorld.is_server )
								if ( owner )
								{
									let ent = new sdCharacter({ x: owner.x + 16 * owner._side, y: owner.y,
										_ai_enabled: sdCharacter.AI_MODEL_AGGRESSIVE, 
										_ai_gun_slot: 2,
										_ai_level: 10,
										sd_filter: target_entity.sd_filter,
										title: target_entity.title,
										_owner: owner
									});
									ent.gun_slot = 2;
									sdEntity.entities.push( ent );

									let ent2 = new sdGun({ x: ent.x, y: ent.y,
										class: sdGun.CLASS_STALKER_RIFLE
									}); 
									sdEntity.entities.push( ent2 );
									
									ent2.fire_mode = Math.random() > 0.5 ? 1 : 2;

									sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });
									sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT });
								
									ent.hea = 1000;
									ent.hmax = 1000;
									ent.helmet = target_entity.helmet;
									ent.body = target_entity.body;
									ent.legs = target_entity.legs;
									ent._voice = {
										wordgap: 0,
										pitch: 25,
										speed: 100,
										variant: 'clone',
										voice: 'en'
									};
									//ent._ai_stay_near_entity = owner;
									//ent._ai_stay_distance = 256;
									ent.sd_filter = target_entity.sd_filter;
									ent._matter_regeneration = 20;
									ent._jetpack_allowed = true;
									ent._jetpack_fuel_multiplier = 0.25;
									ent.matter = 600;
									ent.matter_max = 600;
									ent.s = target_entity.s;
								
									ent.ApplyStatusEffect({ type: sdStatusEffect.TYPE_PSYCHOSIS, owner: owner, controllable: true });
									
									if ( gun.fire_mode === 1 ) // Spawns a target drone for clones to follow and aim at. A more defensive mode.
									{
										let bullet_obj = new sdBullet({ x: gun.x, y: gun.y });
					
										bullet_obj._homing = true;
										bullet_obj._homing_mult = 0.1;
										bullet_obj.ac = 0.03;
										bullet_obj._bouncy = true;
										bullet_obj._owner = owner;
										bullet_obj._for_ai_target = ent;

										bullet_obj._damage = 1;
										bullet_obj.explosion_radius = 20;
										bullet_obj.model = 'stalker_target';
										bullet_obj.color = sdEffect.default_explosion_color;
										bullet_obj.time_left = Number.MAX_SAFE_INTEGER;
										bullet_obj._hea = 100;
								
										sdEntity.entities.push( bullet_obj );
									}
								
									setTimeout(()=>
									{
										if ( !ent._is_being_removed )
										{
											sdWorld.SendEffect({ x:ent.x, y:ent.y, type:sdEffect.TYPE_TELEPORT });
											sdSound.PlaySound({ name:'teleport', x:ent.x, y:ent.y, volume:0.5 });
											
											for( let i = 0; i < ent._inventory.length; i++ ) // Prevent loot from being stolen and disappearing
											{
												let item = ent._inventory[ i ];
												
												if ( i !== ent.gun_slot )
												ent.DropWeapon( i );
											}
									
											ent.remove();
										}
									}, 1000 * 20 );
								}
							}
						}
					};
					obj._damage = gun.extra[ ID_DAMAGE_VALUE ];
					obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
					obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
					if ( gun.extra[ ID_PROJECTILE_COLOR ] )
					obj.color = gun.extra[ ID_PROJECTILE_COLOR ];
				
					return obj;
				}
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 1; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost( AddRecolorsFromColorAndCost
				( [], '#ff0000', 15, 'accelerator' ),
				'#00ffff', 15, 'core' ),
				'#008080', 15, 'glow' ),
				'#800000', 15, 'glow alt' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_ACCESS_KEY = 150 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'access_key' ),
			sound: 'sd_beacon',
			sound_pitch: 1.5,
			//title: 'Access key',
			title_dynamic: ( gun )=>
			{
				return ( gun.extra && gun.extra[ ID_TITLE ] ? 'Access key' + ' ( ' + gun.extra[ ID_TITLE ] + ' ) ' : 'Access key' );
			},
			slot: 7,
			reload_time: 16,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			projectile_properties: { color: 'transparent', _soft: true, time_left: 2 },
			spawnable: true,
			category: 'Base equipment',
			GetAmmoCost: ( gun )=>
			{
				return 0; 
			},
			projectile_properties_dynamic: ( gun )=> 
			{ 
				let obj = 
				{
					_damage: 1, color:'transparent', _soft: true, time_left: 2, _custom_target_reaction:( bullet, target_entity )=> 
					{
						if ( target_entity.GetClass() === 'sdWeaponBench' && target_entity.type === 1  ) // sdWeaponBench.TYPE_DISPLAY
						{
							target_entity.LockLogic( gun._held_by, gun )
						}
					}
				};
				
				return obj;
			},
			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_TITLE ] = '';
				}
			},
		
			upgrades: AddRecolorsFromColorAndCost( [], '#00ff00', 15, 'key' )
		};
		
		sdGun.classes[ sdGun.CLASS_REPAIR_TOOL = 151 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'sd_repair_tool' ), // By Ghost581X
			sound: 'gun_defibrillator',
			sound_pitch: 0.75,
			sound_volume: 2,
			title: 'Vehicle repair tool',
			slot: 7,
			reload_time: 24,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 500,
			min_workbench_level: 1,
			projectile_properties: { color: '#00ffff', _rail: true, _soft: true, time_left: 3 },
			GetAmmoCost: ( gun )=>
			{
				return 32; 
			},
			projectile_properties_dynamic: ( gun )=> 
			{ 
				let obj = 
				{
					_damage: 1, color:'#00ffff', _rail: true, _soft: true, time_left: 3, _custom_target_reaction:( bullet, target_entity )=> 
					{
						let heal_ents = [ 'sdHover', 'sdQuadro', 'sdLifeBox', 'sdWorkbench', 'sdWeaponBench', 'sdUpgradeStation' ];
						
						if ( heal_ents.includes( target_entity.GetClass() ) )
						if ( ( target_entity.hea || target_entity._hea || 0 ) > 0 ) // Can't repair completely destroyed ones
                        {
                            let heal = Math.min( ( target_entity.hmax || target_entity._hmax || 0 ) - ( target_entity.hea || target_entity._hea || 0 ), 250 ); // Prevent overheal possibly?
                            if ( typeof target_entity.hea !== 'undefined' )
                            target_entity.hea += heal;
                            else
                            if ( typeof target_entity._hea !== 'undefined' )
                            target_entity._hea += heal;

                            sdSound.PlaySound({ name:'gun_buildtool', x:target_entity.x, y:target_entity.y, volume:1.25, pitch:1 });
                        }
					}
				};
				
				return obj;
			},
			upgrades: AddRecolorsFromColorAndCost( [], '#00ffff', 15 )
		};
		
		sdGun.classes[ sdGun.CLASS_TELEKINETICS = 152 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'gravity_gun' ),
			title: 'Gravity gun',
			slot: 7,
			reload_time: 0,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			matter_cost: 500,
			spawnable: false,
			projectile_properties: { },
			GetAmmoCost: ( gun )=>
			{
				return 1;
			},
			onShootAttempt: ( gun )=>
			{
				// Similar to sdPlayerDrone
				let owner = gun._held_by;
				
				let off = gun._held_by.GetBulletSpawnOffset ? gun._held_by.GetBulletSpawnOffset() : { x:0, y:0 };
				
				//let range = 24;
				//let nears = sdWorld.GetAnythingNear( owner.look_x, owner.look_y, range, null, null );
				if ( sdWorld.inDist2D_Boolean( owner.look_x, owner.look_y, gun.x, gun.y, 400 ) )
				//if ( owner._god || sdWorld.CheckLineOfSight( gun.x, gun.y, owner.look_x, owner.look_y, owner, null, [ 'sdBlock', 'sdDoor' ] ) )
				if ( owner._god || sdWorld.AccurateLineOfSightTest( owner.x + off.x, owner.y + off.y, owner.look_x, owner.look_y, sdCom.com_build_line_of_sight_filter_for_early_threats ) )
				if ( owner._god || sdArea.CheckPointDamageAllowed( owner.look_x, owner.look_y ) )
				{
					if ( Math.random() < 1 / 3 )
					{
						/*let xx = Math.sin ( owner.GetLookAngle() ) * 12;
						let yy = Math.cos ( owner.GetLookAngle() ) * 12;
						
						sdWorld.SendEffect({ type: sdEffect.TYPE_GLOW_ALT, x:gun.x + xx, y:gun.y + yy, sx:0, sy:0, scale:1, radius:1, color:'#80ff80' });*/
						sdWorld.SendEffect({ type: sdEffect.TYPE_GLOW_ALT, x:owner.look_x, y:owner.look_y, sx:0, sy:0, scale:1, radius:1, color:'#80ff80' });
						sdSound.PlaySound({ name:'gravity_gun', x:gun.x, y:gun.y, volume:0.75, pitch:1 });
					}
						
					let range = 24;
					let nears = sdWorld.GetAnythingNear( owner.look_x, owner.look_y, range, null, null );
						
					for ( let i = 0; i < nears.length; i++ )
					{
						let e = nears[ i ];
						if ( !e._is_being_removed )
						//if ( e !== gun && e !== owner )
						if ( e._is_bg_entity === gun._is_bg_entity )
						if ( e.IsTargetable( owner ) )
						{
							if ( typeof e.sx !== 'undefined' )
							if ( typeof e.sy !== 'undefined' )
							{
								e.PhysWakeUp();
								e.SetHiberState( sdEntity.HIBERSTATE_ACTIVE );
								e.HookAttempt();
	
								if ( e.is( sdBullet ) )
								e._owner = owner;

								/*if ( e.is( sdCharacter ) )
								if ( e._ai_enabled && e._ai_team !== 10 ) // Time shifter
								e.DropWeapon( e.gun_slot );*/

								let an = ( Math.atan2( owner.look_x - e.x, owner.look_y - e.y ) );

								let xx =  Math.sin ( an );
								let yy = Math.cos ( an );

								let s = 15;
								
								e.Impulse( xx * s, yy * s );
							}
						}
					}
				}
			},
			upgrades: AddRecolorsFromColorAndCost( [], '#80ff80', 15 )
		};
		
		
		sdGun.classes[ sdGun.CLASS_DRAIN_SHOTGUN = 153 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'drain_shotgun' ),
			image_firing: sdWorld.CreateImageFromFile( 'drain_shotgun_firing' ),
			sound: 'gun_anti_rifle_fireB',
			sound_volume: 2,
			title: 'Drain-shotgun', // Drain shotgun
			slot: 3,
			reload_time: 20,
			count: 5,
			spread: 0.12,
			muzzle_x: 14,
			ammo_capacity: 8,
			projectile_velocity: 15 * 1.5,
			matter_cost: 1500,
			min_build_tool_level: 25,
			
			min_workbench_level: 5,
			
			projectile_properties_dynamic: ( gun )=>
			{
				let cur_amount = gun._held_by ? sdLost.entities_and_affection.get( gun._held_by ) : 0;
				
				return { 
					_damage: 0,
					model: ( cur_amount > 0 ) ? 'drain_shotgun_projectile_overcharged' : 'drain_shotgun_projectile', 
					_hittable_by_bullets: false,
					is_grenade: true,
					time_left: 60 / 1.5,
					explosion_radius: ( cur_amount > 0 ) ? 30 : 15, 
					color: ( cur_amount > 0 ) ? '#fff59c' : '#6ac2ff',

					gravity_scale: 0,
					_detonate_on_impact: false,

					_custom_post_bounce_reaction: DrainProjectileBounceReaction,

					_custom_extra_think_logic: ( bullet, GSPEED )=>
					{
						return DrainProjectileThink( bullet, GSPEED * ( cur_amount > 0 ? 4 : 1 ) * gun.extra[ ID_DAMAGE_MULT ] * 0.5, 32 );
					},

					_custom_detonation_logic:( bullet )=>
					{
						sdSound.PlaySound({ name:'gun_anti_rifle_hit', x:bullet.x, y:bullet.y, volume:0.5, pitch:( ( cur_amount > 0 ) ? 0.5 : 1 ) * 1.5 });
					}
				};
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			
			upgrades: AddGunDefaultUpgrades( [] )
		};
		
		
		sdGun.classes[ sdGun.CLASS_DRAIN_SNIPER = 154 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'drain_sniper' ),
			image_firing: sdWorld.CreateImageFromFile( 'drain_sniper_firing' ),
			sound: 'gun_anti_rifle_fireC',
			sound_volume: 3,
			title: 'Drain-sniper-rifle', // Drain shotgun
			slot: 4,
			reload_time: 40,
			count: 1,
			spread: 0,
			muzzle_x: 14,
			ammo_capacity: -1,
			projectile_velocity: 15 * 2,
			matter_cost: 1500,
			min_build_tool_level: 35,
			
			min_workbench_level: 7,
			
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				return 40;
			},
			
			projectile_properties_dynamic: ( gun )=>
			{
				let cur_amount = gun._held_by ? sdLost.entities_and_affection.get( gun._held_by ) : 0;
				
				return { 
					_damage: 0,
					model: ( cur_amount > 0 ) ? 'drain_sniper_projectile_overcharged' : 'drain_sniper_projectile', 
					_hittable_by_bullets: false,
					is_grenade: true,
					time_left: 60 * 2,
					explosion_radius: ( cur_amount > 0 ) ? 120 : 60, 
					color: ( cur_amount > 0 ) ? '#fff59c' : '#6ac2ff',

					gravity_scale: 0,
					_detonate_on_impact: false,

					_custom_post_bounce_reaction: ( bullet, vel=0, hit_entity=null )=>
					{
						DrainProjectileBounceReaction( bullet, vel, hit_entity );
						
						if ( bullet.sticky_target )
						{
							if ( bullet.model === 'drain_sniper_projectile_overcharged' )
							bullet.model = 'anti_rifle_projectile_overcharged';
							else
							if ( bullet.model === 'drain_sniper_projectile' )
							bullet.model = 'anti_rifle_projectile';
						}
					},

					_custom_extra_think_logic: ( bullet, GSPEED )=>
					{
						return DrainProjectileThink( bullet, GSPEED * ( cur_amount > 0 ? 4 : 1 ) * gun.extra[ ID_DAMAGE_MULT ] * 1.5, 32 );
					},

					_custom_detonation_logic:( bullet )=>
					{
						sdSound.PlaySound({ name:'gun_anti_rifle_hit', x:bullet.x, y:bullet.y, volume:0.5, pitch:( ( cur_amount > 0 ) ? 0.5 : 1 ) * 2 });
					}
				};
			},

			onMade: ( gun, params )=> // Should not make new entities, assume gun might be instantly removed once made
			{
				if ( !gun.extra )
				{
					gun.extra = [];
					gun.extra[ ID_DAMAGE_MULT ] = 1;
					//gun.extra[ ID_FIRE_RATE ] = 1;
					gun.extra[ ID_RECOIL_SCALE ] = 1;
					//gun.extra[ ID_SLOT ] = 1;
					gun.extra[ ID_DAMAGE_VALUE ] = 20; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			
			upgrades: AddGunDefaultUpgrades( [] )
		};

		// Add new gun classes above this line //

		let index_to_const = [];
		for ( let s in sdGun )
		if ( s.indexOf( 'CLASS_' ) === 0 )
		{
			if ( typeof sdGun[ s ] !== 'number' )
			throw new Error( 'Check sdGunClass for a place where gun class index '+s+' is set - it has value '+sdGun[ s ]+' but should be a number in order to things work correctly' );
			if ( typeof sdGun.classes[ sdGun[ s ] ] !== 'object' )
			throw new Error( 'Check sdGunClass for a place where class '+s+' is defined. It looks like there is a non-object in sdGun.classes array at this slot' );
			if ( index_to_const[ sdGun[ s ] ] === undefined )
			index_to_const[ sdGun[ s ] ] = s;
			else
			throw new Error( 'Check sdGunClass for a place where index value is assigned - it looks like there is ID conflict for ID '+sdGun[ s ]+'. Both: '+s+' and '+index_to_const[ sdGun[ s ] ]+' point at the exact same ID. Not keeping IDs of different gun classes as unique will cause replacement of one class with another when it comes to spawning by ID.' );
		}
		for ( let i = 0; i < sdGun.classes.length; i++ )
		if ( typeof index_to_const[ i ] === 'undefined' )
		{
			sdGun.classes[ i ] = {
				image: sdWorld.CreateImageFromFile( 'present' ),
				sound: 'gun_defibrillator',
				title: 'Missing weapon',
				//slot: -1,
				reload_time: 25,
				muzzle_x: null,
				ammo_capacity: -1,
				count: 0,
				spawnable: false,
				//ignore_slot: true,
				projectile_properties: { time_left: 0, _damage: 0, color: 'transparent', _return_damage_to_owner:true }
			};
			//throw new Error( 'Check sdGunClass for a place where index values are assigned - there seems to be an ID number '+i+' skipped (assuming sdGun.classes.length is '+sdGun.classes.length+' and thus highest ID should be '+(sdGun.classes.length-1)+', with IDs starting at 0). Holes in ID list will cause server to crash when some parts of logic will try to loop through all classes. Currently defined IDs are following: ', index_to_const );
		}
	}
}

export default sdGunClass;
