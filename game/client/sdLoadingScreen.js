
/*

	Loading screen shown between clicking "Play" and the world actually appearing (previously just a black canvas -
	sdWorld.GotoGame() shows the game canvas immediately, before any snapshot data has arrived).

	Cycles through a "card" for each known entity/gun, drawing its real in-game sprite (via a throwaway "fake" instance,
	same trick sdShop.js uses for its build-menu icons) alongside a tooltip pulled from loading_tips.json. Tips are
	optional per entry - entries with no tip just show their title.

*/

import sdWorld from '../sdWorld.js';
import sdRenderer from './sdRenderer.js';
import sdGun from '../entities/sdGun.js';
import sdSound from '../sdSound.js';

class sdLoadingScreen
{
	static init_class()
	{
		let canvas = document.createElement( 'canvas' );
		canvas.id = 'loading_screen_canvas';

		canvas.style.position = 'fixed';
		canvas.style.left = '0px';
		canvas.style.top = '0px';
		canvas.style.zIndex = '10000'; // Above sdRenderer.canvas (#SD2D) and the menu #page
		canvas.style.display = 'none';
		canvas.style.imageRendering = 'pixelated';
		canvas.style.cursor = 'none';

		document.body.appendChild( canvas );

		sdLoadingScreen.canvas = canvas;
		sdLoadingScreen.ctx = canvas.getContext( '2d' );

		sdLoadingScreen.showing = false;
		sdLoadingScreen.assets = null; // Built lazily on first Show() - entity classes aren't all registered yet at this point
		sdLoadingScreen.tips = null; // Fetched lazily too, may not have resolved by the time Show() is first called - that's fine, falls back to title-only

		sdLoadingScreen.current_index = 0;
		sdLoadingScreen.time_on_current = 0;
		sdLoadingScreen.last_frame_time = 0;

		sdLoadingScreen.raf_handle = null;
		sdLoadingScreen.hide_check_handle = null;
		sdLoadingScreen.hide_started_at = 0;

		sdLoadingScreen.ASSET_DURATION_MS = 4000;
		sdLoadingScreen.SAFETY_HIDE_MS = 20000; // In case sdWorld.my_entity never resolves for some reason, don't get stuck showing this forever

		sdLoadingScreen.ATTACK_PHASE_AFTER_MS = 2000; // "moving" entities show their idle/walk animation for this long, then we try to trigger their attack animation for the rest of their time on screen

		sdLoadingScreen.current_fake_ent = null; // Kept alive for as long as its asset is on screen (unlike MakeIcon's per-frame throwaway instances) so muzzle flash / walk-cycle / attack state can accumulate across frames
		sdLoadingScreen.current_fake_ent_index = -1;
		sdLoadingScreen.current_fake_ent_broken = false; // Set once onThink throws for this entity, so we stop retrying it every frame
		sdLoadingScreen.gun_shot_schedule = null; // Array of ms-since-shown timestamps still pending a shot, for the current asset if it's a gun
		sdLoadingScreen.attack_phase_started = false;

		window.addEventListener( 'resize', ()=>sdLoadingScreen.OnResize() );
		sdLoadingScreen.OnResize();

		fetch( 'loading_tips.json' )
			.then( ( r )=>r.json() )
			.then( ( data )=>{ sdLoadingScreen.tips = data; } )
			.catch( ()=>{ sdLoadingScreen.tips = null; } );
	}
	static OnResize()
	{
		if ( !sdLoadingScreen.canvas )
		return;

		sdLoadingScreen.canvas.width = window.innerWidth;
		sdLoadingScreen.canvas.height = window.innerHeight;
	}
	static CanBuild( class_name, params ) // Used only while building the asset list, to filter out entries that can't construct at all (bad params etc.) - does NOT tell us whether it can *draw* something visible yet, since sprite images load asynchronously (see MakeIcon)
	{
		let cls = sdWorld.entity_classes[ class_name ];

		if ( !cls )
		return false;

		let fake_ent = null;

		try
		{
			fake_ent = new cls( Object.assign( { x: 0, y: 0 }, params ) );
			fake_ent.UpdateHitbox();
		}
		catch ( e )
		{
			return false;
		}
		finally
		{
			if ( fake_ent )
			try { fake_ent.remove(); fake_ent._broken = false; fake_ent._remove(); } catch ( e2 ) {}
		}

		return true;
	}
	static ConstructFakeEnt( class_name, params )
	{
		let cls = sdWorld.entity_classes[ class_name ];

		if ( !cls )
		return null;

		try
		{
			let fake_ent = new cls( Object.assign( { x: 0, y: 0 }, params ) );
			fake_ent.UpdateHitbox();
			fake_ent.x = 0;
			fake_ent.y = 0;
			return fake_ent;
		}
		catch ( e )
		{
			return null;
		}
	}
	static DestroyFakeEnt( fake_ent )
	{
		if ( !fake_ent )
		return;

		try { fake_ent.remove(); fake_ent._broken = false; fake_ent._remove(); } catch ( e ) {}
	}
	static EnsureCurrentFakeEnt( asset_index, asset ) // (Re)creates the persistent fake entity when the displayed asset changes, and resets its per-asset animation state
	{
		if ( sdLoadingScreen.current_fake_ent_index === asset_index )
		if ( sdLoadingScreen.current_fake_ent )
		return sdLoadingScreen.current_fake_ent;

		sdLoadingScreen.DestroyFakeEnt( sdLoadingScreen.current_fake_ent );

		sdLoadingScreen.current_fake_ent = sdLoadingScreen.ConstructFakeEnt( asset.class_name, asset.params );
		sdLoadingScreen.current_fake_ent_index = asset_index;
		sdLoadingScreen.current_fake_ent_broken = false;
		sdLoadingScreen.attack_phase_started = false;

		if ( asset.class_name === 'sdGun' )
		sdLoadingScreen.gun_shot_schedule = [ 900, 1700, 2500 ]; // ms-since-shown - a few low-volume "shots" spread across the display window
		else
		sdLoadingScreen.gun_shot_schedule = null;

		return sdLoadingScreen.current_fake_ent;
	}
	static UpdateGun( fake_gun, time_on_current, GSPEED )
	{
		if ( sdLoadingScreen.gun_shot_schedule )
		for ( let i = 0; i < sdLoadingScreen.gun_shot_schedule.length; i++ )
		if ( time_on_current >= sdLoadingScreen.gun_shot_schedule[ i ] )
		{
			sdLoadingScreen.gun_shot_schedule.splice( i, 1 );
			i--;

			try
			{
				fake_gun.muzzle = 5;

				if ( fake_gun._sound )
				sdSound.PlaySound({
					name: fake_gun._sound,
					x: 0, y: 0,
					volume: 0.06, // "Very low sound" per the request - these fire repeatedly while cycling through ~150 assets, should be barely-there ambience, not a real gunshot
					pitch: fake_gun._sound_pitch || 1,
					_server_allowed: true // Required for sdSound.PlaySound to actually play anything when called from plain client-side code (no server round-trip before the world has even loaded)
				});
			}
			catch ( e ) {}
		}

		if ( fake_gun.muzzle > 0 )
		fake_gun.muzzle = Math.max( 0, fake_gun.muzzle - GSPEED * 0.15 );
	}
	static UpdateMovingEntity( fake_ent, time_on_current, GSPEED )
	{
		if ( sdLoadingScreen.current_fake_ent_broken )
		return;

		if ( !fake_ent.IsPhysicallyMovable() )
		return;

		if ( !sdLoadingScreen.attack_phase_started )
		if ( time_on_current > sdLoadingScreen.ATTACK_PHASE_AFTER_MS )
		{
			sdLoadingScreen.attack_phase_started = true;

			if ( '_current_target' in fake_ent ) // Common convention across ~30 creature AI classes - give it something in range to react to, so its own logic (not ours) decides how to show "attacking"
			fake_ent._current_target = {
				x: 24, y: 0,
				hea: 999, _hea: 999,
				_is_being_removed: false,
				biometry: 'loading_screen_dummy_target',
				GetClass: ()=>'sdCharacter',
				IsTargetable: ()=>true,
				IsInSafeArea: ()=>false,
				IsAdminEntity: ()=>false
			};
		}

		try
		{
			fake_ent.onThink( GSPEED );
		}
		catch ( e )
		{
			sdLoadingScreen.current_fake_ent_broken = true; // Give up on animating this one for the rest of its time on screen - it'll just show its construction-time pose, which is a safe fallback
		}

		// onThink may have actually moved it via physics - keep it pinned to the icon's center regardless, we only wanted the internal animation/AI state to progress, not real displacement
		fake_ent.x = 0;
		fake_ent.y = 0;
	}
	static MakeIcon( asset, asset_index, time_on_current ) // Builds a fresh offscreen bitmap EVERY call (see below for why), of the ONE persistent fake entity for the currently-displayed asset
	{                                                       // Sprite images load asynchronously (sdWorld.CreateImageFromFile) - a one-shot bake taken before the image finishes loading would be permanently blank, so this redraws each frame instead of caching, which self-heals once the image loads. Cheap since only ever done for the current asset, never all of them at once.
		let fake_ent = sdLoadingScreen.EnsureCurrentFakeEnt( asset_index, asset );

		if ( !fake_ent )
		return null;

		const GSPEED = 1; // Stand-in for a ~normal server tick's worth of time, used only to drive animation/muzzle-decay counters here, not real physics timing

		if ( asset.class_name === 'sdGun' )
		sdLoadingScreen.UpdateGun( fake_ent, time_on_current, GSPEED );
		else
		sdLoadingScreen.UpdateMovingEntity( fake_ent, time_on_current, GSPEED );

		const SIZE = 96;

		let icon_canvas = document.createElement( 'canvas' );
		icon_canvas.width = SIZE;
		icon_canvas.height = SIZE;

		let ctx2 = icon_canvas.getContext( '2d' );
		sdRenderer.AddCacheDrawMethod( ctx2 );
		ctx2.imageSmoothingEnabled = false;

		try
		{
			ctx2.translate(
				~~( SIZE / 2 - ( fake_ent._hitbox_x2 + fake_ent._hitbox_x1 ) / 2 ),
				~~( SIZE / 2 - ( fake_ent._hitbox_y2 + fake_ent._hitbox_y1 ) / 2 )
			);

			ctx2.save();
			fake_ent.DrawBG( ctx2, false );
			ctx2.restore();

			ctx2.save();
			fake_ent.Draw( ctx2, false );
			ctx2.restore();

			ctx2.save();
			fake_ent.DrawFG( ctx2, false );
			ctx2.restore();
		}
		catch ( e )
		{
			return null;
		}

		return icon_canvas;
	}
	static BuildAssetList()
	{
		if ( sdLoadingScreen.assets )
		return sdLoadingScreen.assets;

		let assets = [];
		let seen_keys = new Set();

		// Primary source for guns: sdGun.classes directly, NOT sdShop.options. sdShop.options is populated by a
		// 'SET sdShop.options' message sent by the server after connecting - it's still just placeholder stub
		// entries at the exact moment this list needs to build (sdWorld.GotoGame() fires synchronously, right
		// after emitting RESPAWN, with no wait for any server round-trip), so relying on it here would silently
		// show zero guns in the common case. sdGun.classes is populated locally at boot (sdGunClass.init_class()),
		// no server dependency.
		if ( sdGun.classes )
		for ( let class_id in sdGun.classes )
		{
			let gun_class_entry = sdGun.classes[ class_id ];

			if ( !gun_class_entry )
			continue;

			let dedupe_key = 'gun:' + class_id;

			if ( seen_keys.has( dedupe_key ) )
			continue;

			let params = { class: Number( class_id ) };

			if ( !sdLoadingScreen.CanBuild( 'sdGun', params ) )
			continue;

			seen_keys.add( dedupe_key );

			assets.push({
				class_name: 'sdGun',
				params,
				tip_key: 'guns.' + sdLoadingScreen.FindGunClassIdName( Number( class_id ) ),
				fallback_title: gun_class_entry.title || 'Gun'
			});
		}

		// Supplementary: every OTHER registered entity class not already covered above, best-effort (many will fail
		// to construct with no params and are silently skipped - that's fine, this is just extra visual variety)
		if ( sdWorld.entity_classes_array )
		for ( let i = 0; i < sdWorld.entity_classes_array.length; i++ )
		{
			let cls = sdWorld.entity_classes_array[ i ];

			if ( cls.name === 'sdGun' ) // Already fully covered above (154 distinct, properly-titled gun types) - a bare new sdGun({}) here would just be a generic, less useful duplicate
			continue;

			let dedupe_key = cls.name + ':::';

			if ( seen_keys.has( dedupe_key ) )
			continue;

			if ( !sdLoadingScreen.CanBuild( cls.name, {} ) )
			continue;

			seen_keys.add( dedupe_key );

			assets.push({
				class_name: cls.name,
				params: {},
				tip_key: 'entities.' + cls.name,
				fallback_title: cls.name
			});
		}

		sdLoadingScreen.assets = assets;

		return assets;
	}
	static FindGunClassIdName( numeric_id )
	{
		if ( sdLoadingScreen._gun_id_name_cache === undefined )
		{
			sdLoadingScreen._gun_id_name_cache = new Map();

			for ( let key in sdGun )
			if ( key.indexOf( 'CLASS_' ) === 0 )
			sdLoadingScreen._gun_id_name_cache.set( sdGun[ key ], key );
		}

		return sdLoadingScreen._gun_id_name_cache.get( numeric_id ) || null;
	}
	static GetTip( tip_key, fallback_title )
	{
		let title = fallback_title;
		let tip = '';

		if ( tip_key )
		if ( sdLoadingScreen.tips )
		{
			let parts = tip_key.split( '.' ); // ex. [ 'entities', 'sdBlock' ] or [ 'guns', 'CLASS_PISTOL' ]
			let group = sdLoadingScreen.tips[ parts[ 0 ] ];

			if ( group )
			if ( group[ parts[ 1 ] ] )
			{
				if ( group[ parts[ 1 ] ].title )
				title = group[ parts[ 1 ] ].title;

				if ( group[ parts[ 1 ] ].tip )
				tip = group[ parts[ 1 ] ].tip;
			}
		}

		return { title, tip };
	}
	static Show()
	{
		sdLoadingScreen.BuildAssetList();

		if ( sdLoadingScreen.assets.length === 0 )
		return; // Nothing could be built (ex. classes not loaded yet for some reason) - just skip, leaving the old black-screen behavior rather than showing an empty overlay

		sdLoadingScreen.showing = true;
		sdLoadingScreen.canvas.style.display = 'block';

		sdLoadingScreen.current_index = ~~( Math.random() * sdLoadingScreen.assets.length );
		sdLoadingScreen.time_on_current = 0;
		sdLoadingScreen.last_frame_time = Date.now();

		sdLoadingScreen.Loop();

		sdLoadingScreen.hide_started_at = Date.now();
		sdLoadingScreen.PollForHide();
	}
	static PollForHide()
	{
		if ( !sdLoadingScreen.showing )
		return;

		if ( sdWorld.my_entity || Date.now() - sdLoadingScreen.hide_started_at > sdLoadingScreen.SAFETY_HIDE_MS )
		{
			sdLoadingScreen.Hide();
			return;
		}

		sdLoadingScreen.hide_check_handle = setTimeout( ()=>sdLoadingScreen.PollForHide(), 200 );
	}
	static Hide()
	{
		sdLoadingScreen.showing = false;
		sdLoadingScreen.canvas.style.display = 'none';

		if ( sdLoadingScreen.raf_handle !== null )
		cancelAnimationFrame( sdLoadingScreen.raf_handle );
		sdLoadingScreen.raf_handle = null;

		if ( sdLoadingScreen.hide_check_handle !== null )
		clearTimeout( sdLoadingScreen.hide_check_handle );
		sdLoadingScreen.hide_check_handle = null;

		sdLoadingScreen.DestroyFakeEnt( sdLoadingScreen.current_fake_ent );
		sdLoadingScreen.current_fake_ent = null;
		sdLoadingScreen.current_fake_ent_index = -1;
	}
	static Loop()
	{
		if ( !sdLoadingScreen.showing )
		return;

		let now = Date.now();
		let dt = now - sdLoadingScreen.last_frame_time;
		sdLoadingScreen.last_frame_time = now;

		sdLoadingScreen.time_on_current += dt;

		if ( sdLoadingScreen.time_on_current > sdLoadingScreen.ASSET_DURATION_MS )
		{
			sdLoadingScreen.time_on_current = 0;
			sdLoadingScreen.current_index = ( sdLoadingScreen.current_index + 1 ) % sdLoadingScreen.assets.length;
		}

		sdLoadingScreen.Draw( now );

		sdLoadingScreen.raf_handle = requestAnimationFrame( ()=>sdLoadingScreen.Loop() );
	}
	static Draw( now )
	{
		let ctx = sdLoadingScreen.ctx;
		let w = sdLoadingScreen.canvas.width;
		let h = sdLoadingScreen.canvas.height;

		ctx.setTransform( 1, 0, 0, 1, 0, 0 );

		ctx.fillStyle = '#05070d';
		ctx.fillRect( 0, 0, w, h );

		let asset = sdLoadingScreen.assets[ sdLoadingScreen.current_index ];
		let { title, tip } = sdLoadingScreen.GetTip( asset.tip_key, asset.fallback_title );

		let icon = sdLoadingScreen.MakeIcon( asset, sdLoadingScreen.current_index, sdLoadingScreen.time_on_current ); // Rebuilt every frame - see MakeIcon for why (async sprite loading)

		const scale = Math.min( 2, Math.max( 1, Math.min( w, h ) / 700 ) );

		const card_width = 520 * scale;
		const card_height = 320 * scale;
		const card_x = ( w - card_width ) / 2;
		const card_y = ( h - card_height ) / 2;

		// Card background
		ctx.fillStyle = 'rgba(255,255,255,0.04)';
		ctx.fillRect( card_x, card_y, card_width, card_height );
		ctx.strokeStyle = 'rgba(255,255,255,0.15)';
		ctx.lineWidth = 2;
		ctx.strokeRect( card_x, card_y, card_width, card_height );

		// Icon - gently bobs up/down and pulses scale, so it doesn't feel like a static screenshot
		const bob = Math.sin( now / 600 ) * 6 * scale;
		const pulse = 1 + Math.sin( now / 900 ) * 0.04;

		const icon_draw_size = 128 * scale * pulse;
		const icon_cx = card_x + card_width / 2;
		const icon_cy = card_y + 110 * scale + bob;

		if ( icon )
		{
			ctx.save();
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage( icon, icon_cx - icon_draw_size / 2, icon_cy - icon_draw_size / 2, icon_draw_size, icon_draw_size );
			ctx.restore();
		}

		// Title
		ctx.textAlign = 'center';
		ctx.fillStyle = '#ffffaa';
		ctx.font = ( 22 * scale ) + 'px Verdana';
		ctx.fillText( title, icon_cx, card_y + 210 * scale );

		// Tip (word-wrapped to the card width), or a generic placeholder if this entry has no tip filled in yet
		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.font = ( 14 * scale ) + 'px Verdana';

		let tip_lines = sdLoadingScreen.WrapText( ctx, tip || 'Did you know? Every part of this world was built by players like you.', card_width - 40 * scale );

		for ( let i = 0; i < tip_lines.length; i++ )
		ctx.fillText( tip_lines[ i ], icon_cx, card_y + 245 * scale + i * 20 * scale );

		// Progress dots
		const DOT_COUNT = Math.min( 24, sdLoadingScreen.assets.length );
		const dot_spacing = 10 * scale;
		const dots_width = DOT_COUNT * dot_spacing;

		for ( let i = 0; i < DOT_COUNT; i++ )
		{
			let represents_current = ( sdLoadingScreen.current_index % DOT_COUNT ) === i;

			ctx.fillStyle = represents_current ? '#ffffaa' : 'rgba(255,255,255,0.25)';
			ctx.beginPath();
			ctx.arc( icon_cx - dots_width / 2 + i * dot_spacing + dot_spacing / 2, card_y + card_height - 20 * scale, 3 * scale, 0, Math.PI * 2 );
			ctx.fill();
		}

		// "Loading..." label with an animated ellipsis
		ctx.fillStyle = '#ffffff';
		ctx.font = ( 18 * scale ) + 'px Verdana';
		let dots = '.'.repeat( 1 + ( Math.floor( now / 400 ) % 3 ) );
		ctx.fillText( 'Loading' + dots, w / 2, card_y - 20 * scale );
	}
	static WrapText( ctx, text, max_width ) // Same pixel-accurate approach as sdTask's expanded-view wrap
	{
		let words = text.split( ' ' );
		let lines = [];
		let line = '';

		for ( let i = 0; i < words.length; i++ )
		{
			let candidate = line ? ( line + ' ' + words[ i ] ) : words[ i ];

			if ( line && ctx.measureText( candidate ).width > max_width )
			{
				lines.push( line );
				line = words[ i ];
			}
			else
			line = candidate;
		}

		if ( line )
		lines.push( line );

		return lines;
	}
}

export default sdLoadingScreen;
