
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
		// Two plain DOM layers behind the canvas, replicating #page_background / #bg_stars from the main menu (style.css)
		// so the loading screen sits on the same nebula backdrop + blended starfield instead of a flat placeholder color.
		// Kept as real elements (not drawn into the canvas) so mix-blend-mode:screen on the stars layer works correctly -
		// that blend mode blends the element against whatever's behind IT, which would fall apart if it were baked into
		// the same canvas as the card/text content sitting on top of it.
		let bg = document.createElement( 'div' );
		bg.id = 'loading_screen_bg';
		bg.style.position = 'fixed';
		bg.style.left = '0px';
		bg.style.top = '0px';
		bg.style.width = '100%';
		bg.style.height = '100%';
		bg.style.zIndex = '9998';
		bg.style.display = 'none';
		bg.style.background = 'url(assets/bg_menu.jpg)';
		bg.style.backgroundSize = 'cover';
		bg.style.backgroundPosition = 'bottom center';
		bg.style.filter = 'blur(0.2vh)';
		document.body.appendChild( bg );

		let stars = document.createElement( 'div' );
		stars.id = 'loading_screen_stars';
		stars.style.position = 'fixed';
		stars.style.left = '50%';
		stars.style.top = '0px';
		stars.style.transform = 'translate(-50%,-50%)';
		stars.style.width = '100vw';
		stars.style.height = '100vw';
		stars.style.zIndex = '9999';
		stars.style.display = 'none';
		stars.style.background = 'url(assets/bg_stars.gif)';
		stars.style.mixBlendMode = 'screen';
		stars.style.imageRendering = 'pixelated';
		document.body.appendChild( stars );

		sdLoadingScreen.bg_el = bg;
		sdLoadingScreen.stars_el = stars;

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

		sdLoadingScreen.PRELOAD_COUNT = 12; // Restrict the carousel to this many assets (half guns, half other entities, randomly sampled fresh each time - see BuildAssetList), all warmed up front in Show() - trades the ~300-asset variety for a guarantee that whichever card is showing already has its sprite loaded, instead of a freshly-randomly-picked one sometimes showing blank for however long its image takes to fetch. This game is served over plain HTTP (no TLS, so no HTTP/2 multiplexing) - Chrome caps concurrent connections per host at ~6, so the last few of these 12 may still be mid-fetch the first time their card comes up early in the rotation

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

		// Guns' hitbox is a tiny fixed pickup-collision box (~8x6px) totally unrelated to their actual sprite size
		// (multi-part weapons can draw 100+ px wide) - scaling off of it was blowing guns up far past the icon
		// canvas and clipping most of the sprite off. Draw at native scale into a generously-oversized scratch
		// canvas first, then measure the ACTUAL opaque pixel bounds and scale/center based on that instead, which
		// works correctly regardless of which of this game's several different sprite-drawing paths a given
		// entity/gun uses.
		const SCRATCH_SIZE = 400;

		let scratch = document.createElement( 'canvas' );
		scratch.width = SCRATCH_SIZE;
		scratch.height = SCRATCH_SIZE;

		let sctx = scratch.getContext( '2d' );
		sdRenderer.AddCacheDrawMethod( sctx );
		sctx.imageSmoothingEnabled = false;

		try
		{
			sctx.translate(
				~~( SCRATCH_SIZE / 2 - ( fake_ent._hitbox_x2 + fake_ent._hitbox_x1 ) / 2 ),
				~~( SCRATCH_SIZE / 2 - ( fake_ent._hitbox_y2 + fake_ent._hitbox_y1 ) / 2 )
			);

			sctx.save();
			fake_ent.DrawBG( sctx, false );
			sctx.restore();

			sctx.save();
			fake_ent.Draw( sctx, false );
			sctx.restore();

			sctx.save();
			fake_ent.DrawFG( sctx, false );
			sctx.restore();
		}
		catch ( e )
		{
			return null;
		}

		let bounds = sdLoadingScreen.MeasureOpaqueBounds( sctx, SCRATCH_SIZE, SCRATCH_SIZE );

		if ( !bounds )
		return null; // Nothing drawn yet (ex. sprite image still loading) - callers already handle a null return gracefully

		let sprite_w = bounds.x2 - bounds.x1;
		let sprite_h = bounds.y2 - bounds.y1;
		let largest_dim = Math.max( sprite_w, sprite_h, 4 );

		const TARGET_FILL = 0.7; // Sprites scale up to occupy roughly this fraction of the icon canvas along their longest edge
		const MAX_SAFE_FILL = 0.92; // Hard ceiling so a scaled sprite can never exceed the icon canvas bounds (small margin for the alpha threshold in MeasureOpaqueBounds slightly undercounting soft/antialiased edges)

		let fill_scale = ( SIZE * TARGET_FILL ) / largest_dim;
		let safe_cap = ( SIZE * MAX_SAFE_FILL ) / largest_dim;

		let sprite_scale = Math.min( safe_cap, Math.max( 1, fill_scale ) ); // Never shrink below native size, except in the rare case a sprite is so large even native size would clip - then shrink just enough to fit

		if ( asset.class_name === 'sdGun' ) // Guns read as small/thin even after the general proportional scale-up above, so give them an extra boost (still bounded by the same clip-safety ceiling)
		sprite_scale = Math.min( safe_cap, sprite_scale * 2 );

		let icon_canvas = document.createElement( 'canvas' );
		icon_canvas.width = SIZE;
		icon_canvas.height = SIZE;

		let ctx2 = icon_canvas.getContext( '2d' );
		ctx2.imageSmoothingEnabled = false;

		let draw_w = sprite_w * sprite_scale;
		let draw_h = sprite_h * sprite_scale;

		ctx2.drawImage( scratch, bounds.x1, bounds.y1, sprite_w, sprite_h, ( SIZE - draw_w ) / 2, ( SIZE - draw_h ) / 2, draw_w, draw_h );

		return icon_canvas;
	}
	static MeasureOpaqueBounds( ctx, w, h ) // Scans for the bounding box of non-transparent pixels drawn so far - used to find a sprite's true visual extent when the entity's hitbox doesn't represent it (see MakeIcon)
	{
		let data;

		try { data = ctx.getImageData( 0, 0, w, h ).data; }
		catch ( e ) { return null; }

		let min_x = w, min_y = h, max_x = -1, max_y = -1;

		for ( let y = 0; y < h; y++ )
		for ( let x = 0; x < w; x++ )
		{
			let alpha = data[ ( y * w + x ) * 4 + 3 ];

			if ( alpha > 10 )
			{
				if ( x < min_x ) min_x = x;
				if ( x > max_x ) max_x = x;
				if ( y < min_y ) min_y = y;
				if ( y > max_y ) max_y = y;
			}
		}

		if ( max_x < 0 )
		return null;

		return { x1: min_x, y1: min_y, x2: max_x + 1, y2: max_y + 1 };
	}
	static PickRandomSample( pool, count ) // Up to `count` distinct random entries from pool, in shuffled order - partial Fisher-Yates, only shuffles as many slots as needed rather than the whole pool
	{
		let copy = pool.slice();
		let picked = [];

		for ( let i = 0; i < count && copy.length > 0; i++ )
		{
			let idx = ~~( Math.random() * copy.length );
			picked.push( copy[ idx ] );
			copy.splice( idx, 1 );
		}

		return picked;
	}
	static BuildAssetList()
	{
		if ( sdLoadingScreen.assets )
		return sdLoadingScreen.assets;

		let assets = [];
		let seen_keys = new Set();

		// Pure admin/dev-utility entity classes (world-editing, protection-zone markers, dev test spawner) - never
		// something a normal player builds or encounters as a recognizable "thing", so not interesting for a
		// gameplay-preview carousel. Small, explicit list rather than pattern-matching, since most classes referenced
		// from sdShop.js's "Development tests" category (sdSandWorm, sdDrone, sdWorkbench, etc.) ARE real creatures/
		// items players normally encounter in the world - that category is just a convenient admin spawn shortcut for
		// them, not evidence the class itself is admin-only.
		const ADMIN_ONLY_ENTITY_CLASSES = new Set([ 'sdArea', 'sdPresetEditor', 'sdVirus', 'sdFactionSpawner' ]);

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

			if ( gun_class_entry.matter_cost === Infinity ) // Same signal sdShop.js itself relies on ("Cost of Infinity is what actually prevents items here from being accessible to non-in-godmode-admins") - covers the admin remover/teleporter/damager/mass-deleter guns
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

		let guns_count = assets.length; // Where the gun entries end and entity entries begin, for BuildAssetList's curated sample below

		// Supplementary: every OTHER registered entity class not already covered above, best-effort (many will fail
		// to construct with no params and are silently skipped - that's fine, this is just extra visual variety)
		if ( sdWorld.entity_classes_array )
		for ( let i = 0; i < sdWorld.entity_classes_array.length; i++ )
		{
			let cls = sdWorld.entity_classes_array[ i ];

			if ( cls.name === 'sdGun' ) // Already fully covered above (154 distinct, properly-titled gun types) - a bare new sdGun({}) here would just be a generic, less useful duplicate
			continue;

			if ( ADMIN_ONLY_ENTITY_CLASSES.has( cls.name ) )
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

		// Curated sample rather than the full ~300 - half guns, half other entities, randomly picked fresh
		// each time BuildAssetList runs (once per page load - see the cache check at the top of this method)
		// rather than always the same first few in discovery order. See PRELOAD_COUNT.
		if ( assets.length > sdLoadingScreen.PRELOAD_COUNT )
		{
			let half = Math.ceil( sdLoadingScreen.PRELOAD_COUNT / 2 );
			let guns = sdLoadingScreen.PickRandomSample( assets.slice( 0, guns_count ), half );
			let others = sdLoadingScreen.PickRandomSample( assets.slice( guns_count ), sdLoadingScreen.PRELOAD_COUNT - guns.length );

			let curated = guns.concat( others );

			// If one side came up short (ex. fewer than half guns available), top back up from the other side's remainder
			if ( curated.length < sdLoadingScreen.PRELOAD_COUNT )
			{
				let picked = new Set( curated );
				let leftover_pool = assets.filter( a=>!picked.has( a ) );
				curated = curated.concat( sdLoadingScreen.PickRandomSample( leftover_pool, sdLoadingScreen.PRELOAD_COUNT - curated.length ) );
			}

			assets = curated;
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

		// Warm every curated asset's sprite(s) right now, in one burst, instead of only ever loading
		// the currently-displayed one - by the time the 2nd/3rd/etc. card comes up a few seconds from
		// now, its image should already be cached rather than starting cold at the moment it's shown.
		// MakeIcon's return value is unused here - only the side effect (triggering the image fetch via
		// Draw() -> ctx.drawImageFilterCache -> img.RequiredNow()) matters. Wrapped per-asset so one
		// misbehaving entry can't stop the rest from warming.
		for ( let i = 0; i < sdLoadingScreen.assets.length; i++ )
		try { sdLoadingScreen.MakeIcon( sdLoadingScreen.assets[ i ], i, 0 ); } catch ( e ) {}

		sdLoadingScreen.showing = true;
		sdLoadingScreen.canvas.style.display = 'block';
		sdLoadingScreen.bg_el.style.display = 'block';
		sdLoadingScreen.stars_el.style.display = 'block';

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
		sdLoadingScreen.bg_el.style.display = 'none';
		sdLoadingScreen.stars_el.style.display = 'none';

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
	static PickNextRandomIndex() // Random rather than sequential, so repeat viewings of the loading screen don't always start the same cycle through the same ~300 assets in the same order
	{
		if ( sdLoadingScreen.assets.length <= 1 )
		return 0;

		let next_index = sdLoadingScreen.current_index;

		while ( next_index === sdLoadingScreen.current_index ) // Avoid picking the same asset twice in a row
		next_index = ~~( Math.random() * sdLoadingScreen.assets.length );

		return next_index;
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
			sdLoadingScreen.current_index = sdLoadingScreen.PickNextRandomIndex();
		}

		sdLoadingScreen.Draw( now );

		sdLoadingScreen.raf_handle = requestAnimationFrame( ()=>sdLoadingScreen.Loop() );
	}
	static RoundedRectPath( ctx, x, y, w, h, r )
	{
		ctx.beginPath();
		ctx.moveTo( x + r, y );
		ctx.arcTo( x + w, y, x + w, y + h, r );
		ctx.arcTo( x + w, y + h, x, y + h, r );
		ctx.arcTo( x, y + h, x, y, r );
		ctx.arcTo( x, y, x + w, y, r );
		ctx.closePath();
	}
	static Draw( now )
	{
		let ctx = sdLoadingScreen.ctx;
		let w = sdLoadingScreen.canvas.width;
		let h = sdLoadingScreen.canvas.height;

		ctx.setTransform( 1, 0, 0, 1, 0, 0 );
		ctx.clearRect( 0, 0, w, h ); // No solid fill anymore - #loading_screen_bg / #loading_screen_stars (behind the canvas) provide the same nebula + starfield backdrop as the main menu

		let asset = sdLoadingScreen.assets[ sdLoadingScreen.current_index ];
		let { title, tip } = sdLoadingScreen.GetTip( asset.tip_key, asset.fallback_title );

		let icon = sdLoadingScreen.MakeIcon( asset, sdLoadingScreen.current_index, sdLoadingScreen.time_on_current ); // Rebuilt every frame - see MakeIcon for why (async sprite loading)

		const scale = Math.min( 2, Math.max( 1, Math.min( w, h ) / 700 ) );

		const card_width = 520 * scale;
		const card_height = 320 * scale;
		const card_x = ( w - card_width ) / 2;
		const card_y = ( h - card_height ) / 2;
		const card_radius = 8 * scale;

		// Card background - same dark-panel/thin-border convention as .menu_rect / menu_button / settings panels
		sdLoadingScreen.RoundedRectPath( ctx, card_x, card_y, card_width, card_height, card_radius );
		ctx.fillStyle = 'rgba(20,20,20,0.45)';
		ctx.fill();
		ctx.strokeStyle = 'rgba(255,255,255,0.09)';
		ctx.lineWidth = 2 * scale;
		ctx.stroke();

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
		ctx.fillStyle = '#ffffff';
		ctx.font = ( 22 * scale ) + "px 'ui_font2', Verdana, sans-serif";
		ctx.fillText( title, icon_cx, card_y + 210 * scale );

		// Tip (word-wrapped to the card width), or a generic placeholder if this entry has no tip filled in yet
		ctx.fillStyle = 'rgba(255,255,255,0.7)';
		ctx.font = ( 14 * scale ) + "px 'ui_font2', Verdana, sans-serif";

		let tip_lines = sdLoadingScreen.WrapText( ctx, tip || 'Did you know? Every part of this world was built by players like you.', card_width - 40 * scale );

		for ( let i = 0; i < tip_lines.length; i++ )
		ctx.fillText( tip_lines[ i ], icon_cx, card_y + 245 * scale + i * 20 * scale );

		// Activity dots - a simple animated wave rather than a literal position-in-list indicator, since assets now
		// cycle in random order (PickNextRandomIndex) rather than sequentially, so there's no real "progress" to show
		const DOT_COUNT = 7;
		const dot_spacing = 10 * scale;
		const dots_width = DOT_COUNT * dot_spacing;

		for ( let i = 0; i < DOT_COUNT; i++ )
		{
			let wave = ( Math.sin( now / 250 - i * 0.8 ) + 1 ) / 2; // 0..1

			ctx.fillStyle = `rgba(139,255,99,${ 0.25 + wave * 0.75 })`; // Same green accent as "Connected to... / playing / online" on the main menu
			ctx.beginPath();
			ctx.arc( icon_cx - dots_width / 2 + i * dot_spacing + dot_spacing / 2, card_y + card_height - 20 * scale, ( 2 + wave * 1.5 ) * scale, 0, Math.PI * 2 );
			ctx.fill();
		}

		// "Loading..." label with an animated ellipsis
		ctx.fillStyle = '#8bff63';
		ctx.font = ( 18 * scale ) + "px 'ui_font2', Verdana, sans-serif";
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
