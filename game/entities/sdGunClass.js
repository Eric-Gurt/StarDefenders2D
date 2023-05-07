
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
						gun.sd_filter = sdWorld.CreateSDFilter();

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
	
			//
			/*custom_rifle_upgrades.push(
				{
					title: 'Customize main color...', 
					represents_category: 'customize_colors_main',
					category: 'customize_colors'
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Customize dark color...', 
					represents_category: 'customize_colors_dark',
					category: 'customize_colors'
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Customize bright color...', 
					represents_category: 'customize_colors_bright',
					category: 'customize_colors'
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Customize energy color...', 
					represents_category: 'customize_colors_energy',
					category: 'customize_colors'
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Customize laser color...', 
					represents_category: 'customize_colors_laser',
					category: 'customize_colors'
				} 
			);
			custom_rifle_upgrades.push(
				{
					title: 'Customize bullets color...', 
					represents_category: 'customize_colors_bullets',
					category: 'customize_colors'
				} 
			);*/
	
			custom_rifle_upgrades.push(
				{
					title: 'Randomize projectile color', 
					cost: 0, 
					category: 'customize_colors',
					action: ( gun, initiator=null )=> 
					{ 
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
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#ff0000', 0, 'laset', 'customize_colors' );
			AddRecolorsFromColorAndCost( custom_rifle_upgrades, '#9d822f', 0, 'magazine', 'customize_colors' );
			
			custom_rifle_upgrades.push(
				{
					title: 'Increase damage', 
					cost: 500, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
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
					title: 'Increase damage', 
					cost: 2, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						if ( gun.extra[ ID_DAMAGE_MULT ] < 2 )
						{
							gun.extra[ ID_DAMAGE_MULT ] += 0.05; // 5%
							//gun.extra[ ID_RECOIL_SCALE ] *= 0.95; // 5%
							//UpdateCusomizableGunProperties( gun );
						}
						else
						{
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
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
						if ( gun.extra[ ID_DAMAGE_MULT ] > 0 )
						{
							gun.extra[ ID_DAMAGE_MULT ] = Math.max( 0, gun.extra[ ID_DAMAGE_MULT ] - 0.05 ); // 5%
							//gun.extra[ ID_RECOIL_SCALE ] *= 1.05; // 5%
							//UpdateCusomizableGunProperties( gun );
						}
						else
						{
							if ( initiator )
							if ( initiator._socket )
							initiator._socket.SDServiceMessage( 'Limit has been reached.' );
						}
					} 
				} 
			);
			/*normal_rifle_upgrades.push(
				{
					title: 'Increase fire rate', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						gun.extra[ ID_FIRE_RATE ] = Math.max( 1, gun.extra[ ID_FIRE_RATE ] - 0.1 );
						//UpdateCusomizableGunProperties( gun );
					} 
				} 
			);
			normal_rifle_upgrades.push(
				{
					title: 'Decrease fire rate', 
					cost: 0, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
						gun.extra[ ID_FIRE_RATE ] = Math.min( 10, gun.extra[ ID_FIRE_RATE ] + 0.1 );
						//UpdateCusomizableGunProperties( gun );
					} 
				} 
			);*/
			normal_rifle_upgrades.push(
				{
					title: 'Improve recoil control', 
					cost: 1, 
					category: 'customize_properties',
					action: ( gun, initiator=null )=> 
					{ 
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
			reload_time: 3,
			muzzle_x: 4,
			ammo_capacity: 12,
			spread: 0.01,
			count: 1,
			fire_type: 2,
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties: { _damage: 1 }, // Set the damage value in onMade function ( gun.extra_ID_DAMAGE_VALUE )
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
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
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#ff0000', 15 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_SHOTGUN = 2 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shotgun' ),
			sound: 'gun_shotgun',
			title: 'Shotgun',
			slot: 3,
			reload_time: 20,
			muzzle_x: 9,
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
			sound: 'gun_railgun',
			title: 'Railgun',
			slot: 4,
			reload_time: 30,
			muzzle_x: 9,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 50,
			projectile_properties: { _damage:1 }, // Set properties inside projectile_properties_dynamic
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, _rail_circled: true, color: '#62c8f2' };
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
			muzzle_x: 7,
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
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#808000', 20 ) )
		};
		
		sdGun.classes[ sdGun.CLASS_MEDIKIT = 5 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'medikit' ),
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
			projectile_properties: { _damage: 1 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 10, model: 'ball', color:'#00ffff', _dirt_mult: 1 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 5; // Damage value of the projectile, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_BUILD_TOOL = 7 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'buildtool' ),
			sound: 'gun_buildtool',
			title: 'Build tool',
			slot: 9,
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
			image: sdWorld.CreateImageFromFile( 'crystal_shard' ),
			title: 'Crystal shard',
			hea: 5,
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				// 2 was too bad for case of randomly breaking crystals when digging
				if ( character.matter + gun.extra <= character.matter_max )
				{
					character.matter += gun.extra;
					gun.remove(); 
				}
				else
				if ( character.matter < character.matter_max - 1 )
				{
					gun.extra -= character.matter_max - character.matter;
					character.matter = character.matter_max;
					
					if ( gun.extra < 1 )
					gun.remove(); 
				}

				return false; 
			},
			onMade: ( gun )=>
			{
				const normal_ttl_seconds = 9;
				
				gun.ttl = 30 * normal_ttl_seconds * ( 0.7 + Math.random() * 0.3 ); // was 7 seconds, now 9
			}
		};
		
		
		
		
		
		
		sdGun.classes[ sdGun.CLASS_GRENADE_LAUNCHER = 9 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'grenade_launcher' ),
			sound: 'gun_grenade_launcher',
			title: 'Grenade launcher',
			slot: 5,
			reload_time: 20,
			muzzle_x: 7,
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
			matter_cost: 300,
			projectile_velocity: 16,
			spawnable: false,
			GetAmmoCost: ()=>
			{
				return 0;
			},
			projectile_properties: { time_left: 2, _damage: 1, color: 'transparent', _return_damage_to_owner:true, _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( target_entity.IsPlayerClass() )
					{
						//target_entity.AnnounceTooManyEffectsIfNeeded();
						//target_entity.stim_ef = 30 * 30;
						
						if ( bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_STIMPACK ].slot ] )
						bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_STIMPACK ].slot ].remove();
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
			muzzle_x: 7,
			ammo_capacity: -1,// 10, // 3
			count: 1,
			projectile_properties: { _rail: true, _damage: 15, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ }, // 70
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
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
										gun.extra[ ID_DAMAGE_VALUE ] = 15 * 1.2 }
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
					if ( target_entity.GetClass() !== 'sdBlock' || target_entity.material !== sdBlock.MATERIAL_GROUND )
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
			reload_time: 6,
			muzzle_x: 4,
			ammo_capacity: -1,
			count: 1,
			fire_type: 2,
			projectile_properties: { _rail: true, _damage: 25, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
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
					gun.extra[ ID_DAMAGE_VALUE ] = 25; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( 
				[
					{ 
						title: 'Upgrade to v2',
						cost: 300,
						action: ( gun, initiator=null )=>{ gun.class = sdGun.CLASS_RAIL_PISTOL2;
										gun.extra[ ID_DAMAGE_VALUE ] = 25 * 1.2 }
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
			title: 'Raygun C01y',
			slot: 3,
			reload_time: 60, // Might be inaccurate - not checked
			muzzle_x: 9,
			ammo_capacity: -1,
			count: 3,
			projectile_velocity: 14 * 2,
			spread: 0.11, // 0.15,
			projectile_properties: { _damage: 40, color: '#DDDDDD', penetrating: true }, // I nerfed it's damage from 45 to 40 but that's up to balancing decisions - Booraz149
			spawnable:false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#DDDDDD', penetrating: true, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
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
					gun.extra[ ID_DAMAGE_VALUE ] = 40; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
			muzzle_x: 6,
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
						cost: 300,
						action: ( gun, initiator=null )=>{ gun.class = sdGun.CLASS_RAIL_SHOTGUN2;
										gun.extra[ ID_DAMAGE_VALUE ] = 15 * 1.2 }
					}
				] ) )
		};		
		
		sdGun.classes[ sdGun.CLASS_RAIL_CANNON = 21 ] = { // sprite by Booraz149
			image: sdWorld.CreateImageFromFile( 'rail_cannon' ),
			sound: 'gun_railgun',
			sound_pitch: 0.5,
			title: 'Velox Rail Cannon',
			slot: 4,
			reload_time: 20,
			muzzle_x: 7,
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
				}
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				// 20 more levels, 20 * 45 more matter, 4 * 45 matter per shard
				
				//if ( character._upgrade_counters[ 'upgrade_energy' ] )
				//if ( character._upgrade_counters[ 'upgrade_energy' ] < 60 )
				if ( character._matter_capacity_boosters < character._matter_capacity_boosters_max ) // 20 * 45 )
				{
					character._matter_capacity_boosters = Math.min( character._matter_capacity_boosters + 4 * 45, character._matter_capacity_boosters_max );
					character.onScoreChange();
					
					//character._upgrade_counters[ 'upgrade_energy' ] = Math.min( 60, character._upgrade_counters[ 'upgrade_energy' ] + 4 );
					//character.matter_max = Math.round( 50 + character._upgrade_counters[ 'upgrade_energy' ] * 45 );
					
					
					if ( Math.random() > 0.5 )
					character.Say( "I can use this Cube shard to store matter inside it" );
					else
					character.Say( "Cube shard! These store matter pretty well" );
					gun.remove(); 
				}

				return false; 
			},
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_PISTOL_MK2 = 23 ] = { // sprite by Booraz149
			image: sdWorld.CreateImageFromFile( 'pistol_mk2' ),
			sound: 'gun_pistol',
			sound_pitch: 0.7,
			title: 'Pistol MK2',
			slot: 1,
			reload_time: 4.5,
			muzzle_x: 7,
			ammo_capacity: 8,
			spread: 0.01,
			count: 1,
			matter_cost: 90,
			min_build_tool_level: 1,
			fire_type: 2,
			projectile_properties: { _damage: 35, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 }; // Default value for _knock_scale
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
					gun.extra[ ID_DAMAGE_VALUE ] = 35; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
			upgrades: AddGunDefaultUpgrades()
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( !character._ai )
				{
					if ( gun.extra === -123 )
					{
						character.Say( "Score" );
						//character._score += 100000;
						character.GiveScore( sdEntity.SCORE_REWARD_ADMIN_CRATE, gun );
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					else
					if ( gun.extra === 0 )
					{
						if ( Math.random() > 0.5 )
						character.Say( "This will be useful" );
						else
						character.Say( "This is definitely gonna help me");
					
						character.GiveScore( sdEntity.SCORE_REWARD_TEDIOUS_TASK, gun );
						
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					else
					if ( gun.extra === 1 )
					{
						if ( Math.random() > 0.5 )
						character.Say( "This will be useful" );
						else
						character.Say( "This is definitely gonna help me");
					
						character.GiveScore( sdEntity.SCORE_REWARD_TEDIOUS_TASK, gun );
						
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
					}
					else
					if ( gun.extra === 2 )
					{
						if ( Math.random() > 0.5 )
						character.Say( "This will be useful" );
						else
						character.Say( "This is definitely gonna help me");
					
						character.GiveScore( sdEntity.SCORE_REWARD_TEDIOUS_TASK, gun );
						
						gun.remove(); 

						if ( character._socket )
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
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
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
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
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
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
						sdSound.PlaySound({ name:'reload', x:character.x, y:character.y, volume:0.25, pitch:0.5 }, [ character._socket ] );
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as armor
			{ 
				if ( character.ApplyArmor({ armor: 130, _armor_absorb_perc: 0.3, armor_speed_reduction: 0 }) )
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 190, _armor_absorb_perc: 0.4, armor_speed_reduction: 5 }) )
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 250, _armor_absorb_perc: 0.5, armor_speed_reduction: 10 }) )
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
			sound: 'gun_shotgun',
			title: 'Shotgun MK2',
			slot: 3,
			reload_time: 6,
			muzzle_x: 9,
			ammo_capacity: 15,
			count: 3,
			spread: 0.1,
			matter_cost: 90,
			burst: 3, // Burst fire count
			burst_reload: 30, // Burst fire reload, needed when giving burst fire
			min_build_tool_level: 6,
			projectile_properties: { _damage: 25 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 25; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
			title: 'SMG',
			slot: 1,
			reload_time: 3,
			muzzle_x: 5,
			ammo_capacity: 24,
			spread: 0.1,
			count: 1,
			burst: 3, // Burst fire count
			burst_reload: 10, // Burst fire reload, needed when giving burst fire
			min_build_tool_level: 7,
			matter_cost: 45,
			projectile_properties: { _damage: 18, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 18; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_SMG = 32 ] = { // Sprite made by Ghost581
			image: sdWorld.CreateImageFromFile( 'kvt_smg' ),
			sound: 'gun_pistol',
			title: 'KVT SMG "The Advocate"',
			slot: 1,
			reload_time: 3.2,
			muzzle_x: 6,
			ammo_capacity: 28,
			spread: 0.09,
			count: 1,
			min_build_tool_level: 12,
			matter_cost: 90,
			projectile_properties: { _damage: 22, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 22; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
			muzzle_x: 7,
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
			upgrades: AddGunDefaultUpgrades()
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
							color:'#ffff66' 
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 190, _armor_absorb_perc: 0.35, armor_speed_reduction: 0 }) )
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 280, _armor_absorb_perc: 0.45, armor_speed_reduction: 5 }) )
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 370, _armor_absorb_perc: 0.55, armor_speed_reduction: 10 }) )
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
			sound_pitch: 2.4,
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
				
				let obj = { color: '#92D0EC', _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 64; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_KVT_MMG_MK1 = 47 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'mmg_the_ripper_t2' ),
			sound: 'gun_the_ripper2',
			//sound_pitch: 0.7,
			sound_pitch: 1.6,
			//sound_volume: 1.75,
			title: 'KVT MMG P04 "The Ripper"',
			slot: 2,
			reload_time: 4,
			muzzle_x: 9,
			ammo_capacity: 48,
			spread: 0.03,
			count: 1,
			matter_cost: 140,
			spawnable: false,
			projectile_properties: { _damage: 42, color: '#FFEB00', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#FFEB00', _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 42; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_MMG_MK2 = 48 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'mmg_the_ripper_t3' ),
			sound: 'gun_the_ripper2',
			//sound_pitch: 1.6,
			sound_pitch: 0.7,
			//sound_volume: 1.65,
			title: 'KVT MMG "The Ripper" MK2',
			slot: 2,
			reload_time: 4.2,
			muzzle_x: 9,
			ammo_capacity: 56,
			spread: 0.02,
			count: 1,
			matter_cost: 190,
			spawnable: false,
			projectile_properties: { _damage: 48, color: '#FFEB00', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#FFEB00', _dirt_mult: -0.5 };
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
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_RAILCANNON = 49 ] = // sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'phasercannon_p03' ),
			image0: [ sdWorld.CreateImageFromFile( 'phasercannon_p03_reload1' ), sdWorld.CreateImageFromFile( 'phasercannon_p03_reload2' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'phasercannon_p03_reload1' ), sdWorld.CreateImageFromFile( 'phasercannon_p03_reload2' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'phasercannon_p03_reload1' ), sdWorld.CreateImageFromFile( 'phasercannon_p03_reload2' ) ],
			has_images: true,
			sound: 'gun_railgun_malicestorm_terrorphaser4',
			title: 'KVT Railcannon P03 "Stormbringer"',
			sound_pitch: 1.6, // re-added cause weapon sounds better with the sound pitch. - Ghost581
			sound_volume: 1.5,
            slot: 8,
            reload_time: 60,
            muzzle_x: null,
            ammo_capacity: -1,
            count: 1,
            matter_cost: 270,
            projectile_properties: { _rail: true, _damage: 98, color: '#62c8f2', explosion_radius: 20 },
            min_build_tool_level: 18,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = {  _rail: true, color: '#62c8f2', explosion_radius: 20 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 98; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.armor > 0 )
				{
					character._armor_repair_amount = 250;
					gun.remove(); 
				}

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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.armor > 0 )
				{
					character._armor_repair_amount = 500;
					gun.remove(); 
				}

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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.armor > 0 )
				{
					character._armor_repair_amount = 750;
					gun.remove(); 
				}

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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 300, _armor_absorb_perc: 0.4, armor_speed_reduction: 0 }) )
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 400, _armor_absorb_perc: 0.5, armor_speed_reduction: 5 }) )
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( character.ApplyArmor({ armor: 500, _armor_absorb_perc: 0.6, armor_speed_reduction: 10 }) )
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
				sdSound.PlaySound({ name:'block4', x:gun.x, y:gun.y, volume: 0.05, pitch:1 });
			
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
			projectile_properties: { _damage: 38,  color: '#00aaff', _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { color: '#00aaff', _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 38; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
			reload_time: 2.7,
			muzzle_x: 9,
			ammo_capacity: 8,
			count: 1,
			spawnable:false,
			projectile_velocity: 16,
			fire_type: 2,
			projectile_properties: { explosion_radius: 7, model: 'ball', _damage: 12, color:'#00aaff', _dirt_mult: 1 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 7, model: 'ball', color:'#00aaff', _dirt_mult: 1 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 12; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#37a3ff', 15, 'energy color' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_FMECH_MINIGUN = 62 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'fmech_lmg2' ),
			image_charging: sdWorld.CreateImageFromFile( 'fmech_lmg2' ),
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
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						//gun._held_by._auto_shoot_in = 15;
						//return; // hack
						gun._held_by._auto_shoot_in = 800 / 1000 * 30 / ( 1 + gun._combo / 60 );


						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'enemy_mech_charge', x:gun.x, y:gun.y, volume: 1.5 });
					}
					return false;
				}
				else
				{
					//sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					sdSound.PlaySound({ name:'enemy_mech_attack4', x:gun.x, y:gun.y, volume:1.5, pitch: 1 });
					
					if ( gun._held_by.matter >= 4 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( gun._held_by.stim_ef > 0 ) ? ( 1 / ( 1 + gun._combo / 90 ) ) : ( 2 / ( 1 + gun._combo / 90 ) ); // Faster rate of fire when shooting more
						gun._held_by.matter -= 4;
						gun._combo_timer = 30;
						if ( gun._combo < 60 )
						gun._combo++; // Speed up rate of fire, the longer it shoots
					}
				}
				return true;
			},
			projectile_properties: { _damage: 30, _dirt_mult: -0.5 }, // Combined with fire rate
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 30; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
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
			reload_time: 90,
			muzzle_x: 11,
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
    
		sdGun.classes[ sdGun.CLASS_GAUSS_RIFLE = 66 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'gauss_rifle' ),
			image_charging: sdWorld.CreateImageFromFile( 'gauss_rifle_charging' ),
			image0: [ sdWorld.CreateImageFromFile( 'gauss_rifle0' ), sdWorld.CreateImageFromFile( 'gauss_rifle1' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'gauss_rifle2' ), sdWorld.CreateImageFromFile( 'gauss_rifle3' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'gauss_rifle4' ), sdWorld.CreateImageFromFile( 'gauss_rifle5' ) ],
			has_images: true,
			title: 'Sarronian Gauss Cannon',
			slot: 8,
			reload_time: 30 * 3, // 225,
			muzzle_x: 9,
			ammo_capacity: -1,
			count: 1,
			// matter_cost: 1000,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 2,
			// min_workbench_level: 6,
			// min_build_tool_level: 5,
			GetAmmoCost: ( gun, shoot_from_scenario )=>
			{
				if ( shoot_from_scenario )
				return 0;
			
				if ( gun._held_by._auto_shoot_in > 0 )
				return 0;
				
				return 50;
			},
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( !shoot_from_scenario )
				{
					if ( gun._held_by )
					if ( gun._held_by._auto_shoot_in <= 0 )
					{
						
						gun._held_by._auto_shoot_in = 1500 / 1000 * 30;

						sdSound.PlaySound({ name: 'supercharge_combined2_part1', x:gun.x, y:gun.y, volume: 1.5, pitch: 0.5 });
					}
					return false;
				}
				else
				{
					sdSound.PlaySound({ name: 'gun_railgun_malicestorm_terrorphaser4', x:gun.x, y:gun.y, volume: 1.5, pitch: 2 });
					
				}
			},
			projectile_properties: { explosion_radius: 24, model: 'gauss_rifle_proj', _damage: 128, color:sdEffect.default_explosion_color },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 24, model: 'gauss_rifle_proj', color:sdEffect.default_explosion_color };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 128; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades ( AddRecolorsFromColorAndCost( [], '#00ff00', 15, 'main energy color' ) )
		};
		
		sdGun.classes[ sdGun.CLASS_VELOX_COMBAT_RIFLE = 67 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'combat_rifle' ),
			sound: 'gun_the_ripper2',
			sound_pitch: 2,
			title: 'Velox Combat Rifle',
			slot: 2,
			reload_time: 1.5,
			muzzle_x: 10,
			ammo_capacity: 30,
			burst: 3,
			burst_reload: 16,
			count: 1,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.3,
			projectile_properties: { _damage: 40, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 40; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_MISSLE_LAUNCHER = 68 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'missile_launcher_p07' ),
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
			min_build_tool_level: 9,
			min_workbench_level: 2,
			matter_cost: 240,
			projectile_properties: { time_left: 180, explosion_radius: 12, model: 'mini_missile_p241', _damage: 34, color:sdEffect.default_explosion_color, ac:0.01, _homing: true, _homing_mult: 0.3, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 180, explosion_radius: 12, model: 'mini_missile_p241', color:sdEffect.default_explosion_color, ac:0.01, _homing: true, _homing_mult: 0.3, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 38; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
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
			count: 1,
			spread: 0.05,
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
					
					if ( gun._held_by.matter >= 2 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( gun._held_by.stim_ef > 0 ) ? 1 : 2;
						gun._held_by.matter -= 2; // Was 3. It is not that strong to drain matter that fast
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
			image: sdWorld.CreateImageFromFile( 'council_pistol2' ),
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
			image: sdWorld.CreateImageFromFile( 'council_gun' ),
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
			sound: 'gun_defibrillator',
			title: 'Metal shard',
			sound_pitch: 1,
			slot: 7,
			reload_time: 30,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			projectile_velocity: 16,
			/*GetAmmoCost: ()=>
			{
				return 100;
			},*/
			projectile_properties: { time_left: 2, _damage: 1, color: 'transparent', _custom_target_reaction:( bullet, target_entity )=>
				{
					if ( target_entity.GetClass() === 'sdBlock' || target_entity.GetClass() === 'sdDoor' )
					{
						if ( target_entity.GetClass() === 'sdBlock' )
						if ( target_entity.material === sdBlock.MATERIAL_WALL || target_entity.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL1 || target_entity.material === sdBlock.MATERIAL_REINFORCED_WALL_LVL2 )
						{
							if ( target_entity._reinforced_level < target_entity._max_reinforced_level )
							{
							target_entity._reinforced_level += 0.5;
							target_entity.HandleReinforceUpdate();
							bullet.remove(); // Need this for some reason, otherwise it doubles the reinforced level for some reason ( +1 instead of +0.5 )
						
							if ( bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_METAL_SHARD ].slot ] )
							bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_METAL_SHARD ].slot ].remove();
							}
							else
							bullet._owner.Say( 'This wall cannot be reinforced further' );
						}
						if ( target_entity.GetClass() === 'sdDoor' )
						{
							if ( target_entity._reinforced_level < target_entity._max_reinforced_level )
							{
							target_entity._reinforced_level += 0.5;
							target_entity.HandleReinforceUpdate();
							bullet.remove(); // Need this for some reason, otherwise it doubles the reinforced level for some reason ( +1 instead of +0.5 )
						
							if ( bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_METAL_SHARD ].slot ] )
							bullet._owner._inventory[ sdGun.classes[ sdGun.CLASS_METAL_SHARD ].slot ].remove();
							}
							else
							bullet._owner.Say( 'This door cannot be reinforced further' );
						}
					}
					else
					bullet._owner.Say( 'I can use this to fortify walls and doors' );
				}
			}
		};

		sdGun.classes[ sdGun.CLASS_GRENADE_LAUNCHER_MK2 = 74 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'grenade_launcher_mk2' ), // Sprite by LazyRain
			sound: 'gun_grenade_launcher',
			title: 'Grenade launcher MK2',
			slot: 5,
			reload_time: 9,
			muzzle_x: 7,
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
			muzzle_x: 7,
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
			sound: 'cube_attack',
			sound_pitch: 0.4 * 0.8,
			sound_volume: 2,
			title: 'Cube-shotgun v2',
			slot: 3,
			reload_time: 20,
			muzzle_x: 6,
			ammo_capacity: -1,
			spread: 0.15,
			count: 5,
			projectile_properties: { _rail: true, _damage: 20 * 1.2, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2' };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 20 * 1.2; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AppendBasicCubeGunRecolorUpgrades( [] ) )
		};

		sdGun.classes[ sdGun.CLASS_KVT_AVRS = 77 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'kivortec_avrs_p09' ),
			image0: [ sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload1' ), sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload2' ) ],
			image1: [ sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload1' ), sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload2' ) ],
			image2: [ sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload1' ), sdWorld.CreateImageFromFile( 'kivortec_avrs_p09_reload2' ) ],
			has_images: true,
			sound: 'gun_railgun_malicestorm_terrorphaser4',
			sound_pitch: 0.7,
			title: 'KVT AVRS P09 "Incapacitator"',
			slot: 4,
			reload_time: 30 * 3,//140,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 1,
			matter_cost: 320,
			min_build_tool_level: 18,
			projectile_properties: { explosion_radius: 16, _rail: true, _damage: 125, _vehicle_mult: sdGun.default_vehicle_mult_bonus, color: '#91bfd7' }, // 3x more damage against vehicles
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 16, _rail: true, _vehicle_mult: sdGun.default_vehicle_mult_bonus, color: '#91bfd7' };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 125; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};
		
		sdGun.classes[ sdGun.CLASS_ALIEN_ENERGY_RIFLE = 78 ] = 
		{
			image: sdWorld.CreateImageFromFile ( 'alien_energygun' ),
			sound: 'gun_spark',
			sound_pitch: 0.5,
			title: 'Sarronian Energy Rifle',
			slot: 8,
			reload_time: 45,
			muzzle_x: 7,
			ammo_capacity: -1,
			count: 1,
			spawnable: false,
			projectile_properties: { model: 'ball_orange', color: '#ffc080', _damage: 32, explosion_radius: 12 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { model: 'ball_orange', color: '#ffc080', explosion_radius: 12 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 32; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades ( AddRecolorsFromColorAndCost( [], '#00ff00', 15, 'main energy color' ) )
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as armor
			{ 
				if ( character.ApplyArmor({ armor: 190, _armor_absorb_perc: 0.4, armor_speed_reduction: 5 }) )
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
				
				explosion_radius: 9, model: 'blaster_proj', _damage: 0, color:'#ff00aa',
			},
			
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
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
			}
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
			muzzle_x: 12,
			ammo_capacity: 20,
			count: 1,
			fire_type: 2,
			spawnable: false,
			projectile_velocity: sdGun.default_projectile_velocity * 1.7,
			projectile_properties: { _damage: 72, color: '#33ffff', penetrating: true, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { penetrating: true, _dirt_mult: -0.5 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 72; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
					color: '#aaaaaa'
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
			image: sdWorld.CreateImageFromFile( 'emergency_instructor' ),
			sound: 'gun_defibrillator',
			title: 'Combat instructor',
			sound_pitch: 0.5,
			slot: 7,
			reload_time: 30 * 3,
			muzzle_x: null,
			ammo_capacity: -1,
			count: 0,
			projectile_velocity: 16,
			spawnable: false,
			GetAmmoCost: ()=>
			{
				return 400;
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
			spread: 0.13,
			spawnable: false,
			projectile_velocity: 16,
			projectile_properties: { explosion_radius: 10, model: 'ball', _damage: 5, color:'#0000c8', _dirt_mult: 1 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { explosion_radius: 10, model: 'ball', color:'#0000c8', _dirt_mult: 1 };
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
			burst: 3,
			burst_reload: 45,
			spread: 0.05,
			projectile_velocity: 14,
			count: 1,
			spawnable: false,
			projectile_properties: { time_left: 30, explosion_radius: 19, model: 'rocket_proj', _damage: 16 * 3, color:sdEffect.default_explosion_color, ac:0.4, _homing: true, _homing_mult: 0.02, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { time_left: 30, explosion_radius: 19, model: 'rocket_proj', color:sdEffect.default_explosion_color, ac:0.4, _homing: true, _homing_mult: 0.02, _vehicle_mult:sdGun.default_vehicle_mult_bonus, _dirt_mult: 2 };
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
			onShootAttempt: ( gun, shoot_from_scenario )=>
			{
				if ( sdWorld.is_server )
				if ( gun._held_by )
				if ( gun._held_by.IsPlayerClass() )
				if ( gun._held_by.matter >= 30 )
				//if ( sdWorld.CheckLineOfSight( gun._held_by.x, gun._held_by.y, gun._held_by.look_x, gun._held_by.look_y, gun._held_by, sdCom.com_visibility_ignored_classes, null ) )
				//if ( !sdWorld.CheckWallExistsBox( gun._held_by.look_x - 16, gun._held_by.look_y - 16, gun._held_by.look_x + 16, gun._held_by.look_y + 16, gun._held_by, sdCom.com_visibility_ignored_classes, null, null ) )
				if ( sdWorld.CheckLineOfSight( gun._held_by.x, gun._held_by.y, gun._held_by.look_x, gun._held_by.look_y, gun._held_by, null, sdCom.com_vision_blocking_classes ) )
				if ( gun._held_by.CanMoveWithoutOverlap( gun._held_by.look_x, gun._held_by.look_y, -8 ) )
				if ( sdWorld.inDist2D_Boolean( gun._held_by.x, gun._held_by.y, gun._held_by.look_x, gun._held_by.look_y, 400 ) )
				{
					gun._held_by.x = gun._held_by.look_x;
					gun._held_by.y = gun._held_by.look_y;
					gun._held_by.sx = 0;
					gun._held_by.sy = 0;
					gun._held_by.ApplyServerSidePositionAndVelocity( true, 0, 0 );
					gun._held_by.matter -= 30;
					return true;
				}
				return false;
			},
			projectile_properties: { _rail: true, time_left: 0, _damage: 1, color: '#ffffff'}
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
	
									sdSound.PlaySound({ name:'water_entrance', x:gun.x, y:gun.y, volume: 0.1, pitch: 1 });
	
									bullet._custom_detonation_logic = null; // Prevent picking up water on same use
								}
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

										water_ent.remove();

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
			title_dynamic: ( gun )=> { return gun.extra[ ID_TITLE ]; },
			
			//slot: 2,
			slot_dynamic: ( gun )=> { return gun.extra[ ID_SLOT ]; },
			
			reload_time: 3,
			muzzle_x: 7,
			
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
						gun.extra[ ID_TITLE ] = 'Rifle';
						gun.title_censored = 0;
					}
				
					gun.extra[ ID_PROJECTILE_COLOR ] = '#';
					let str = '0123456789abcdef';
					for ( let i = 0; i < 6; i++ )
					gun.extra[ ID_PROJECTILE_COLOR ] += str.charAt( ~~( Math.random() * str.length ) );

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
			hea: 400,
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup as matter
			{ 
				if ( !gun._is_being_removed )
				if ( character._socket ) // Prevent AI from picking these up
				{
					character.GiveScore( sdEntity.SCORE_REWARD_SCORE_SHARD * gun.extra, gun, false );

					if ( character._socket )
					sdSound.PlaySound({ name:'powerup_or_exp_pickup', x:character.x, y:character.y, volume:0.4, pitch:0.5 }, [ character._socket ] );
				
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
			onPickupAttempt: ( character, gun )=> // Cancels pickup and removes itself if player can pickup
			{ 
				if ( character.armor > 0 )
				{
					character._armor_repair_amount = 1000;
					gun.remove(); 
				}

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
				if ( gun._held_by.matter >= 25 )
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

					/*if ( gun._held_by.x < gun._held_by.look_x )
					for ( let i = gun._held_by.x; i < gun._held_by.look_x; i += dx * 4 )
					{
						if ( gun._held_by.CanMoveWithoutOverlap( i, j , -4 ) )
						{
							last_x = i;
							last_y = j;

							rail_x = i;
							rail_y = j;
						}
						if ( !sdWorld.CheckLineOfSight( last_x, last_y, i, j, gun._held_by, null ) )
						if ( sdWorld.last_hit_entity )
						{
							let can_damage = true;
							let k;
							for( k = 0; k < hit_entities.length; k++ )
							{
								if ( sdWorld.last_hit_entity === hit_entities[ k ] ) // Make sure we didn't hit the target already
								can_damage = false;
							}
							if ( can_damage === true )
							{
								sdWorld.last_hit_entity.DamageWithEffect( damage_value, gun._held_by );
								hit_entities.push( sdWorld.last_hit_entity );
								landed_hit = true;
								sdSound.PlaySound({ name:'cube_teleport', x:i, y:j, volume:2, pitch: 1.5 });
								rail_x = i;
								rail_y = j;
							}
							let stop_attack = false;
							for( k = 0; k < sdCom.com_visibility_unignored_classes.length; k++ )
							if ( sdWorld.last_hit_entity.GetClass() === sdCom.com_visibility_unignored_classes[ k ] ) // Make sure we can pass through it
							stop_attack = true;

							if ( stop_attack === true )
							break;
							//if ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' || sdWorld.last_hit_entity.GetClass() === 'sdDoor' )
							//break;
						}

						j += dy * 4;
					}
					else // If character is looking to the left
					for ( let i = gun._held_by.x; i > gun._held_by.look_x; i += dx * 4 )
					{
						if ( gun._held_by.CanMoveWithoutOverlap( i, j , -4 ) )
						{
							last_x = i;
							last_y = j;

							rail_x = i;
							rail_y = j;
						}
						if ( !sdWorld.CheckLineOfSight( last_x, last_y, i, j, gun._held_by, null ) )
						if ( sdWorld.last_hit_entity )
						{
							let can_damage = true;
							let k;
							for( k = 0; k < hit_entities.length; k++ )
							{
								if ( sdWorld.last_hit_entity === hit_entities[ k ] ) // Make sure we didn't hit the target already
								can_damage = false;
							}
							if ( can_damage === true )
							{
								sdWorld.last_hit_entity.DamageWithEffect( damage_value, gun._held_by );
								hit_entities.push( sdWorld.last_hit_entity );
								landed_hit = true;
								sdSound.PlaySound({ name:'cube_teleport', x:i, y:j, volume:2, pitch: 1.5 });
								rail_x = i;
								rail_y = j;
							}
							let stop_attack = false;
							for( k = 0; k < sdCom.com_visibility_unignored_classes.length; k++ )
							if ( sdWorld.last_hit_entity.GetClass() === sdCom.com_visibility_unignored_classes[ k ] ) // Make sure we can pass through it
							stop_attack = true;

							if ( stop_attack === true )
							break;
						}

						j += dy * 4;
					}*/
					//sdWorld.SendEffect({ x:gun._held_by.x, y:gun._held_by.y, x2:rail_x, y2:rail_y, type:sdEffect.TYPE_BEAM, color:'#CCCCCC' });
					//gun._held_by.x = last_x;
					//gun._held_by.y = last_y;
					sdWorld.SendEffect({ x:gun._held_by.x, y:gun._held_by.y, x2:to_x, y2:to_y, type:sdEffect.TYPE_BEAM, color:'#CCCCCC' });
					gun._held_by.x = to_x;
					gun._held_by.y = to_y;
					gun._held_by.sx = dx * 2;
					gun._held_by.sy = dy * 2;
					gun._held_by.ApplyServerSidePositionAndVelocity( true, 0, 0 );

					if ( landed_hit === true )
					{
						gun._combo_timer = 45;
						gun._combo++;
					}
					else
					gun._combo = Math.max( 0, gun._combo - 1 );
					gun._held_by.matter -= landed_hit === true ? 6 : 25; // Keep in mind custom guns deal 250 damage for something like 7 matter per bullet
					gun._reload_time = 15 - Math.min( 7.5, gun._combo * 0.5 ); // Most efficient with timepack
					return true;			

				}
				return false;
			},
			projectile_properties: { _rail: true, time_left: 0, _damage: 1, color: 'transparent'},
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
			muzzle_x: 11,
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
			image: sdWorld.CreateImageFromFile( 'council_shotgun' ),
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
					
					if ( gun._held_by.matter >= 4 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( gun._held_by.stim_ef > 0 ) ? ( 7 / ( 1 + gun._combo / 10 ) ) : ( 14 / ( 1 + gun._combo / 10 ) ); // Faster rate of fire when shooting more
						gun._held_by.matter -= 4;
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

		sdGun.classes[ sdGun.CLASS_KVT_ASSAULT_RIFLE = 104 ] = // sprite made by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'kvt_ar' ),
			sound: 'gun_the_ripper2',
			sound_pitch: 1.3,
			title: 'KVT Assault Rifle P54 "CER54"',
			slot: 2,
			reload_time: 2,
			muzzle_x: 7,
			ammo_capacity: 44,
			burst: 4,
			burst_reload: 18,
			count: 1,
			matter_cost: 290,
			min_build_tool_level: 22,
			spawnable: true,
			projectile_velocity: sdGun.default_projectile_velocity * 1.1,
			projectile_properties: { _damage: 34, _dirt_mult: -0.5 },
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 }; // Default value for _knock_scale
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
					gun.extra[ ID_DAMAGE_VALUE ] = 34; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
		};

		sdGun.classes[ sdGun.CLASS_KVT_HANDCANNON = 105 ] = // sprite made by LordBored
		{
			image: sdWorld.CreateImageFromFile( 'handcannon_iron_bull' ),
			sound: 'gun_the_ripper2',
			sound_pitch: 0.3,
			title: 'KVT Handcannon P36 "Iron Bull"',
			slot: 1,
			reload_time: 22,
			muzzle_x: 8,
			ammo_capacity: 6,
			spread: 0,
			count: 1,
			matter_cost: 140,
			min_build_tool_level: 8,
			fire_type: 1,
			projectile_properties: { _damage: 65, _dirt_mult: -0.5 },
			projectile_velocity: sdGun.default_projectile_velocity * 1.5,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5 }; // Default value for _knock_scale
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
					gun.extra[ ID_DAMAGE_VALUE ] = 65; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades()
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

		sdGun.classes[ sdGun.CLASS_SARRONIAN_FOCUS_BEAM = 108 ] = // Sprite by Ghost581
		{
			image: sdWorld.CreateImageFromFile( 'sarronian_focus_beam' ),
			image_charging: sdWorld.CreateImageFromFile( 'sarronian_focus_beam2' ),
			//sound: 'supercharge_combined2',
			title: 'Sarronian Focus Beam',
			//sound_pitch: 0.5,
			slot: 8,
			reload_time: 0.3,
			muzzle_x: 7,
			ammo_capacity: -1,
			count: 1,
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
						gun._held_by._auto_shoot_in = 2000 / 1000 * 30 / ( 1 + gun._combo / 60 );


						//sdSound.PlaySound({ name: 'supercharge_combined2', x:gun.x, y:gun.y, volume: 1.5 });
						sdSound.PlaySound({ name: 'enemy_mech_charge', x:gun.x, y:gun.y, volume: 1.5, pitch: 0.3 });
					}
					return false;
				}
				else
				{
					//sdSound.PlaySound({ name: 'gun_pistol', x:gun.x, y:gun.y });
					sdSound.PlaySound({ name:'red_railgun', x:gun.x, y:gun.y, volume:1.2, pitch: 0.6 });
					
					if ( gun._held_by.matter >= 6 )
					if ( gun._held_by._key_states.GetKey( 'Mouse1' ) )
					{
						gun._held_by._auto_shoot_in = ( gun._held_by.stim_ef > 0 ) ? ( 1 / ( 1 + gun._combo / 60 ) ) : ( 2 / ( 1 + gun._combo / 60 ) ); // Faster rate of fire when shooting more
						gun._held_by.matter -= 6;
						gun._combo_timer = 90;
						if ( gun._combo < 45 )
						gun._combo++; // Speed up rate of fire, the longer it shoots
					}
				}
				return true;
			},
			projectile_properties: { _rail: true, _damage: 22, color: '#eb9d28', _dirt_mult: -0.2 }, // Combined with fire rate
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#eb9d28', _dirt_mult: -0.2 };
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
					gun.extra[ ID_DAMAGE_VALUE ] = 22; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
					//UpdateCusomizableGunProperties( gun );
				}
			},
			upgrades: AddGunDefaultUpgrades( AddRecolorsFromColorAndCost( [], '#00ff00', 15, 'main energy color' ) )
		};

		sdGun.classes[ sdGun.CLASS_RAIL_PISTOL2 = 109 ] = { // Original weapon idea, image & pull request by Booraz149 ( https://github.com/Booraz149 )
			image: sdWorld.CreateImageFromFile( 'rail_pistol2' ),
			sound: 'cube_attack',
			sound_pitch: 0.9,
			title: 'Cube-pistol v2',
			slot: 1,
			reload_time: 6,
			muzzle_x: 4,
			ammo_capacity: -1,
			count: 1,
			fire_type: 2,
			projectile_properties: { _rail: true, _damage: 25, color: '#62c8f2'/*, _knock_scale:0.01 * 8*/ },
			spawnable: false,
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _rail: true, color: '#62c8f2', _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
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
					gun.extra[ ID_DAMAGE_VALUE ] = 25 * 1.2; // Damage value of the bullet, needs to be set here so it can be seen in weapon bench stats
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
							color:'#ffffff' 
						});

						let nears = sdWorld.GetAnythingNear( bullet.x, bullet.y, 32 );

						for ( let i = 0; i < nears.length; i++ )
						{
							let e = nears[ i ];
							
							if ( e !== bullet._gun )
							if ( typeof e._time_amplification !== 'undefined' )
							{
								let t = 0;
								
								if ( e.is( sdGun ) )
								t = 30 * 2;
								else
								t = 30 * 60;
							
								e.ApplyStatusEffect({ type: sdStatusEffect.TYPE_TIME_AMPLIFICATION, t: t });
							}
						}
					}
				}
			},
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
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
					if ( target_entity.is_big )
					ent2.f = sdWorld.GetCrystalHue( target_entity.matter_max / 4 );
					else
					ent2.f = sdWorld.GetCrystalHue( target_entity.matter_max );

					ent2.t += ' ( ' + (~~(target_entity.matter)) + ' / ' + target_entity.matter_max + ' )';
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
			upgrades: AppendBasicCubeGunRecolorUpgrades( [] )
		};

		sdGun.classes[ sdGun.CLASS_SHURG_PISTOL = 112 ] = 
		{
			image: sdWorld.CreateImageFromFile( 'shurg_pistol' ),
			sound: 'tzyrg_fire',
			sound_pitch: 2,
			title: 'Shurg Pistol',
			slot: 1,
			reload_time: 7,
			muzzle_x: 6,
			ammo_capacity: 10,
			spread: 0.03,
			count: 2,
			fire_type: 1,
			spawnable: false,
			projectile_velocity_dynamic: ( gun )=> { return Math.min( 64, sdGun.default_projectile_velocity ) },
			projectile_properties: { _damage: 1 }, // Set the damage value in onMade function ( gun.extra_ID_DAMAGE_VALUE )
			projectile_properties_dynamic: ( gun )=>{ 
				
				let obj = { _dirt_mult: -0.5, _knock_scale: 0.01 * 8 * gun.extra[ ID_DAMAGE_MULT ] }; // Default value for _knock_scale
				obj._damage = gun.extra[ ID_DAMAGE_VALUE ]; // Damage value is set onMade
				obj._damage *= gun.extra[ ID_DAMAGE_MULT ];
				obj._knock_scale *= gun.extra[ ID_RECOIL_SCALE ];
				
				obj.color = '#004400';
				
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
