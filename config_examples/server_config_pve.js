class sdServerConfigShort
{
	// This file should contain one object (for example class like this one), it will be interpreted using basic eval method and automatically assigned to global variable sdWorld.server_config

	// If this all looks scary and you are using NetBeans - use "Ctrl + -" and "Ctrl + *" to hide big methods.

	/*
		=====================================================================================
		 STAR DEFENDERS 2D - SERVER OWNER CONFIGURATION REFERENCE
		=====================================================================================

		HOW TO USE THIS FILE
		--------------------
		- The block below (class sdServerConfigShort) is copied VERBATIM into a fresh
		  server_config.js file the first time your server boots without one. That generated
		  server_config.js is YOUR file: game updates never overwrite it. Edit it, not this one.
		- sdServerConfig.js itself (this file, including sdServerConfigFull further down) IS
		  part of the game and WILL be overwritten when you pull game updates. Treat it as the
		  read-only reference. Never put passwords or IP addresses here.
		- Everything you might want to change is documented here as either an active default or
		  a commented-out example. To enable a commented example: copy the line(s) into your
		  server_config.js and remove the leading "//".
		- Any hook you see in sdServerConfigFull (GetAllowedWorldEvents, GetHitAllowed, etc.)
		  can be pasted into server_config.js to override it. Uncommented copies of the most
		  useful ones live in the "OPTIONAL OVERRIDES" section near the bottom of this class.

		WHEN YOU UPGRADE THE GAME:
		- Game updates overwrite sdServerConfig.js but NEVER your generated server_config.js. New
		  options added upstream will therefore NOT appear in your existing server_config.js by itself.
		- After updating, skim this file for new or changed options and manually copy the sections you
		  want into your server_config.js. Your existing settings are left untouched.

		EACH OPTION IS DOCUMENTED WITH: what it controls, its default, how to change it, and
		the gameplay/performance/security risk of changing it.
		=====================================================================================
	*/


	// =========================================================================
	//  1. ACCESS CONTROL & CONNECTION SECURITY
	// =========================================================================

	static password = ''; // Restrict connection access by asking players for password? Default: '' (no password, anyone can join). Set to a string to require it, e.g. 'letmein'. NOTE: put real passwords ONLY in your generated server_config.js, never in sdServerConfig.js (it is publicly readable).

	static make_server_public = ( this.password === '' ); // Default: public when no password is set. Public means the server sends its URL to www.gevanni.com to potentially be listed in a future public server list. The URL is reported by the first browser that successfully connects. Set to false to stay unlisted even without a password. (Declared right after 'password' on purpose - this initializer reads it.)

	static only_admins_can_spectate = true; // Default: true. Only admins may join as sdPlayerSpectator (free-fly camera). Set to false to let anyone spectate. Spectators are also excluded from the leaderboard.

	static allowed_s2s_protocol_ips = [ // Server-to-server (S2S) trusted IP allowlist for shared-database setups. DO NOT shrink below the 3 loopback entries (a startup guard throws if this length changes) - ADD your other servers' IPs instead. Only relevant if you run multiple linked servers or a remote database_server.
		'127.0.0.1',
		'::1',
		'::ffff:127.0.0.1'
	];

	static database_server = null; // Example: 'https://www.gevanni.com:3000'; // Remote database_server must allow current server's IP in list above. Set as null if this server should have its' own database. Default: null (self-hosted database). Risk: pointing at a remote DB shares private storage / accounts across servers.


	// =========================================================================
	//  2. SERVER IDENTITY & CLIENT PRESENTATION
	// =========================================================================

	static game_title = 'Star Defenders'; // Default: 'Star Defenders'. Shown as the browser tab / page title for players connecting to this server. Purely cosmetic.

	static supported_languages = [ 'en', 'ua', 'hr' ]; // Default: [ 'en', 'ua', 'hr' ]. Languages offered to players (English, Ukrainian, Croatian). Removing one hides it from the client language picker; it does not add translations.
	
	static allow_leaderboard_hiding = true; // Default: true. If disabled, it disallows players to hide from leaderboard rankings.

	// static backgroundColor = ''; // Default: '' (game default background). USED BY THE CLIENT (index.js) even though it is not active above. Set a CSS color string, e.g. '#000000' or 'rgb(10,10,25)', to tint the page background behind the game canvas. Cosmetic only.

	// static port = undefined; // Advanced (see sdServerConfigFull). Default: undefined -> auto-assigned to 3000 + world_slot. Uncomment and set a fixed number to pin the port.


	// =========================================================================
	//  3. WORLD GROWTH & PERSISTENCE
	// =========================================================================

	// Setting both 'enable_bounds_move' and 'aggressive_hibernation' to true enables full open-world support.
	static enable_bounds_move = true; // Default: true. Lets the playable area grow/shrink as players move toward the edges. Set to false to lock the world to its current bounds (fixed-size map). Risk: with open world enabled, disabling this mid-life freezes expansion.

	static aggressive_hibernation = true; // Default: true. Offscreen groups of entities (sometimes whole bases) are put to sleep until something accesses that area - this is what makes very large / infinite worlds performant. Set to false only for small fixed maps where you want everything simulated at all times (much higher CPU). Combined with enable_bounds_move=true this is the open-world mode.

	static forced_play_area = false; // Default: false. Force a play / no-oxygen boundary (like open-world support) even without open worlds enabled, using the open_world_max_distance_* coordinates. Set to true to fence players into that box on a non-open-world server.

	static backup_interval_seconds = 60 * 30; // Default: 30 minutes. How often the world is auto-saved to a snapshot when there are unsaved changes. Lower = safer against crashes but more frequent save-time hitches on large worlds; higher = fewer hitches but more progress lost on a hard crash. Example: 60 * 10 for 10-minute backups.


	// =========================================================================
	//  4. GAMEPLAY BASICS
	// =========================================================================

	static keep_favourite_weapon_on_death = false; // Default: false. When true, teleports one weapon from a dead player into mothership storage to be reclaimed later (softer death penalty). Risk: economy impact, players keep gear across deaths.

	static skip_arrival_sequence = false; // Default: false. Skipping the arrival/extraction-hover sequence basically prevents players from spawning together and removes the intro. Mostly useful during tests. Set true for fast-respawn / arena style servers.

	static apply_censorship = true; // Default: true. Applies chat censorship (the censorship word file is not included in the repo, so this is a no-op unless you provide one). Set to false to disable chat filtering entirely. See censorship_mute_duration below.

	// static censorship_mute_duration = 5000; // Default: 5000 (ms). USED BY sdModeration/index even though not active above. How long a player is muted after sending censored chat. Raise to punish spam harder, lower to be lenient. Only meaningful when apply_censorship is on and a censorship file exists.


	// =========================================================================
	//  5. EXPERIMENTAL TERRAIN MERGING (leave off unless testing)
	// =========================================================================

	static enable_block_merging = false; // Default: false. EXPERIMENTAL - merges blocks into a single vertical column for performance. Toggling on runs a one-time merge patch at load; toggling off unmerges. Risk: experimental, test on a backup first.
	static enable_background_merging = false; // Default: false. EXPERIMENTAL - merges backgrounds into a single vertical column. Same caveats as enable_block_merging.


	// =========================================================================
	//  6. SERVER-TO-SERVER (S2S) DEBUGGING
	// =========================================================================

	static notify_about_failed_s2s_attempts = true; // Default: true. Trying to figure out why messages aren't sent from server to server? Leave true to log failed S2S attempts. Only relevant with linked servers / remote database_server.
	static log_s2s_messages = false; // Default: false. Set true to log ALL server-to-server messages (verbose). Debugging aid for linked-server setups.


	/*
		=====================================================================================
		 OPTIONAL OVERRIDES  (advanced - copy into server_config.js and uncomment to use)
		=====================================================================================
		Everything below is COMMENTED OUT. The active game behavior for these lives in
		sdServerConfigFull (further down in sdServerConfig.js). To change one, uncomment it
		here in your server_config.js. Each is written to be syntactically valid once the
		leading "//" is removed.
		=====================================================================================
	*/


	// -------------------------------------------------------------------------
	//  A. PVP, ANTI-RAID & BASE PROTECTION
	// -------------------------------------------------------------------------

	static player_vs_player_damage_scale = 0; // Default: 3. Multiplier for player-vs-player damage. 1 = normal damage, 0 = effectively no PvP damage, higher = deadlier PvP. Set to 0 for a soft PvE-ish server (also see GetHitAllowed for a hard block).
	// 0 PvP damage multiplier, just in case hits are possible
	
	 static com_node_hack_success_rate = 0; // Default: 0.0015. Chance per attempt that a Communication Node hack succeeds (0 = never, 1 = always). Lower it to make bases harder to breach via com-node hacking (anti-raid), raise for chaos.

	// Hard-cancel damage between players/entities. Return false to block a hit. This is the strongest anti-grief / PvE lever. Copy the whole method to override:
	static GetHitAllowed( bullet_or_sword, target )
	{
	    // ( bullet_or_sword._owner || bullet_or_sword._dangerous_from ) is the possible attacker (can be null).
		
		// Socket checks prevents online hits, while hash checks prevents offline hits... Right? - Booraz
		// Though we can probably just check for hashes
		let attacker = ( bullet_or_sword._dangerous_from || bullet_or_sword._owner );
		if ( attacker && target !== attacker ) // Attacker exists?
		{
			if ( ( attacker.is( sdCharacter ) && ( attacker._socket || attacker._my_hash !== undefined ) ) || ( attacker.is( sdTurret ) && attacker._ai_team === 0 ) ) // Attacker is a player (or player/SD built turret)?
			{
				if ( target.is( sdCharacter ) && ( target._socket || target._my_hash !== undefined ) ) // Target is a player?
				{
					// Check first if object is bullet, and allow hits with positive damage (healing)
					let potential_bullet_damage = bullet_or_sword._damage || 0; // sdBullet contains _damage value, unlike sdGun. If value is negative, it heals players
					if ( potential_bullet_damage < 0 ) // If value is negative, it heals players so allow it
					return true;
						
					return false; // Otherwise prevent bullet, bomb or barrel damage
				}
				
				
				// Not a good idea, players will use alts + vehicles to block off base entrances
				// Disables damage to vehicle if a player is in vehicle
				/*if ( target.IsVehicle() ) // Target is a vehicle?
				{
					let driver_slots_total = target.GetDriverSlotsCount() || 0;
					// Check driver seats individually
					for ( var i = 0; i < driver_slots_total; i++ )
					{
						if ( target[ 'driver' + i ] !== null ) // Occupied?
						{
							let driver = target[ 'driver' + i ]; // Check for drivers
							if ( driver.is( sdCharacter ) && ( driver._socket || driver._my_hash !== undefined ) ) // Player?
							return false; // Prevents bullet, bomb or barrel damage
						}
					}
				}
				*/
				// Disables damage to entities protected by BSUs. Prevents slow raids with automated turrets.
				if ( target._shielded )
				return false;
				// Disables damage to base shielding units, or entities protected by BSUs. Prevents slow raids with automated turrets.
				//if ( target.is( sdBaseShieldingUnit ) || target._shielded )
				//return false;
			}
		}
		
	    return true;
	 }

	// Line-of-sight requirement for a player. Return false to disable LOS checks for someone (default: admins/spectators already skip). Copy to override:
	// static GetLineOfSightMode( character )
	// {
	//     if ( character._god || character.is( sdPlayerSpectator ) ) return false;
	//     return true;
	// }

	// static GetBSUDamageMultiplier() { return 1; } // Default returns 1. Damage multiplier applied when damaging blocks that are protected by a Base Shielding Unit. Return < 1 to make protected bases tankier (stronger anti-raid), > 1 to make raiding easier.

	// Reset a player's score on death? Default returns true. Return false for a persistent-score server:
	// static ResetScoreOnDeath( character_entity ) { return true; }


	// -------------------------------------------------------------------------
	//  B. BASE SHIELDING UNITS (BSUs)
	// -------------------------------------------------------------------------

	// static allowed_base_shielding_unit_types = null; // Default: null (all BSU types allowed). Restrict which BSUs can be bought/activated by listing type constants, or null for all. Types: sdBaseShieldingUnit.TYPE_CRYSTAL_CONSUMER (0, green), TYPE_MATTER (1, blue), TYPE_SCORE_TIMED (2, red - new-player timed shield), TYPE_DAMAGE_PERCENTAGE (3), TYPE_FACTION_SHIELD (4). Example limited-BSU: [ sdBaseShieldingUnit.TYPE_MATTER ]. Example no-BSU: [] (empty array disables all base shielding).

	// static bsu_passive_drain = true; // Default: true. When false, disables passive BSU value decrease over time. Set false for a low-maintenance / builder-friendly server (bases don't lose value over time).
	// static base_shielding_units_passive_drain_per_week_green = 0.01; // Default: 0.01. Percentage of stored value green BSUs (and matter amplifiers) passively drain per week. Raise toward 0.2 for faster decay (bases need active upkeep), lower toward 0 for near-permanent bases.
	// static base_shielding_units_passive_drain_per_week_blue = 0.01;  // Default: 0.01. Same as above for blue (matter) BSUs. Keep green and blue in sync unless you intend one type to be more durable.

	// static do_green_base_shielding_units_consume_essence = true; // Default: true. Allows green BSU essence consumption through cables (does not disable crystal consumption). Set false to stop green BSUs from draining essence.

	static base_degradation = false; // Default: true. When false, disables roach attacks and flesh-corruption removing block protection. Set false for a low-maintenance / builder-friendly server (bases don't rot). Big gameplay change.
	
	static allow_player_bsu_attacks = false; // Default: true. When false, it disables BSU raiding of other players' bases. Set to false only if you want non PvP gameplay.

	static max_cabled_base_shielding_units = -1; // Default: -1. Setting a value above 0 sets a cap to how many base shielding units can be cabled together to form a base, while -1 allows infinite cabling.
	static minimum_distance_between_uncabled_bsus = -1; // Default: -1. Setting a value above 0 sets a required distance between two uncabled base shielding units. Good for preventing area lockouts in PvE gameplay in conjunction with "max_cabled_base_shielding_units", but not much else.

	// -------------------------------------------------------------------------
	//  C. WORLD EVENTS & WEATHER
	// -------------------------------------------------------------------------

	// Allow-list of world events. Return undefined to allow all (default), or an array of sdWeather.EVENT_* ids to allow ONLY those. See sdWeather.js for the full EVENT_* list. Copy to override:
	// static GetAllowedWorldEvents() { return undefined; }

	// Deny-list of world events. Return [] for none (default). Higher priority than the allow-list, and the clean way to block newly-added events. Examples:
	// static GetDisallowedWorldEvents() { return []; }
	// No hostile invasions:        return [ sdWorld.entity_classes.sdWeather.EVENT_INVASION, sdWorld.entity_classes.sdWeather.EVENT_CUBES, sdWorld.entity_classes.sdWeather.EVENT_FALKOKS ];

	// static GetAllowedWorldEventCount() { return 15; } // Default: 15. Number of events allowed to occur during a planet day. Set 0 for a NO-RANDOM-EVENTS server, raise for a high-event / chaotic server.

	// static GetEventSpeed() { return 30 * 60 * 4; } // Default: 30*60*4. Max time (in steps) until the next event roll - larger = rarer events, smaller = more frequent. Pair with GetAllowedWorldEventCount.

	// static GetWeatherEventSpeed() { return 30 * 60 * 6; } // Default: 30*60*6. Max time (in steps) until the next weather-event roll (rain/snow/drought/etc). Weather events rotate their eligible pool every 20 minutes and are NOT consumed when they fire (unlike SD task events), so a frequent roll interval combined with a small pool is why one weather type (snow included) can feel like it keeps coming back the whole rotation. Raise this to make weather rolls rarer overall.

	// static GetAllowedWeatherEventCount() { return 1; } // Default: null (built-in ~0-3 random count, skewed toward 2-3 out of ~9 weather-event candidates). Return a number to force a fixed max count of weather events eligible per 20-minute rotation instead. Lower (e.g. 1) makes any single weather type noticeably rarer since it shares fewer "slots" - the direct lever if snow/rain/drought feels too frequent.

	// static ForceEarthquakesIfPossible() { return true; } // Default: true. Always enable earthquakes when possible. Return false to disable forced earthquakes.

	// static WaterEvaporationEnabled() { return true; } // Default: true. Naturally dries out sky-exposed, shallow, natural (rain-spawned) water/acid so it does not accumulate forever and pin the CPU. Player-placed water and deep seas are never touched. Set false to disable (e.g. to profile before/after, or if your map depends on rain puddles persisting).

	// Fine-tune evaporation and the drought/heatwave event from onAfterSnapshotLoad() if the defaults do not suit your map. Uncomment & adjust:
	//   sdWorld.entity_classes.sdWater.EVAP_MAX_DEPTH = 5;         // water columns deeper than this many cells are seas -> never evaporate; raise to protect shallow natural seas
	//   sdWorld.entity_classes.sdWater.EVAP_BASE_RATE = 0.02;      // volume dried per step at full sun; lower = slower drying
	//   sdWorld.entity_classes.sdWater.EVAP_BUDGET = 24;           // surface cells swept per frame (CPU cap); lower = cheaper/slower
	//   sdWorld.entity_classes.sdWater.EVAP_DROUGHT_BUDGET = 48;   // extra cells swept per frame at full drought
	//   sdWorld.entity_classes.sdWater.WAKE_CASCADE_MAX_DEPTH = 0; // 0 = original wake behavior; set e.g. 2 to tame wake-storms in huge pools (perf)

	// To exclude the drought/heatwave event entirely instead of tuning it, deny-list its id (see GetDisallowedWorldEvents above):
	// static GetDisallowedWorldEvents() { return [ sdWorld.entity_classes.sdWeather.EVENT_DROUGHT ]; }

	// static EnableForbiddenCubes() { return false; } // Default: false. Enable shield and invisibility cubes? Set true to allow these advanced/forbidden cube types.


	// -------------------------------------------------------------------------
	//  D. MOBS, ROACHES & TERRAIN SPAWNING
	// -------------------------------------------------------------------------

	// static roach_spawn_rate = 0.5; // Default: 0.5. How often roaches spawn from blood decals. 0 = no roaches, higher = more. (Also gated by base_degradation.)

	// static teleport_mobs_near_player_if_stuck = false; // Default: false. If true, teleports some mob types (cubes, drones, Erthal bots...) near players when they haven't attacked anything for a while, so enemies don't get stuck offscreen. Set true for a more aggressive / no-hiding server.

	// Chance a dug sdBlock contains anything (loot/mob/crystal). hp_mult scales with block hitpoints (depth). Copy to override:
	// static ShouldBlockContainAnything( x, y, hp_mult ) { return ( Math.random() > 0.85 / hp_mult ); }

	// When a block DOES contain something, chance it is a mob rather than a crystal. Copy to override:
	// static ShouldBlockContainMobRatherThanCrystal( x, y, hp_mult ) { return ( Math.random() < Math.min( 0.725, 0.3 * ( 0.75 + hp_mult * 0.25 ) ) ); }

	// Cap or alter properties of crystals dug from ground/trees (e.g. limit matter_max). See the commented body in sdServerConfigFull for a worked example:
	// static ModifyDugOutCrystalProperties( crystal, from_ground, from_tree ) { /* crystal.matter_max = Math.min( crystal.matter_max, 640 ); */ }
	// --- NOT CURRENTLY CONFIGURABLE VIA SERVER CONFIG (documented so you do not hunt for hidden option names) ---
	// These spawn frequencies are hard-coded in their source files and have NO server_config hook yet.
	// Do NOT add these keys expecting them to work - they are listed only as future-hook candidates:
	//   * dirt / liquid / cave / surface / deep terrain spawn frequency  -> devtests/game/sdWorld.js (terrain generation)
	//   * object-driven / event mob spawn frequency                      -> devtests/game/entities/sdWeather.js
	//   * remove_irrelevant_aggressive_hibernation_files                 -> devtests/game/entities/sdDeepSleep.js (referenced only inside a disabled code block; not wired up)
	// Enabling any of these would require a code change (a new hook) and is out of scope for config alone.


	// -------------------------------------------------------------------------
	//  E. OPEN-WORLD BOUNDS (only relevant with open world enabled)
	// -------------------------------------------------------------------------
	// WARNING: larger bounds work but invite lag and huge terrain generation. Only widen these if your hardware can take it.

	// static open_world_max_distance_from_zero_coordinates_x = 80000;        // Default: 80000. Max horizontal distance from origin players can push the world to.
	// static open_world_max_distance_from_zero_coordinates_y_min_soft = -3000; // Default: -3000. Soft upper (sky) limit.
	// static open_world_max_distance_from_zero_coordinates_y_min = -6000;      // Default: -6000. Hard upper (sky) limit.
	// static open_world_max_distance_from_zero_coordinates_y_max = 40000;      // Default: 40000. Max downward (underground) depth.


	// -------------------------------------------------------------------------
	//  F. PLAYERS, SPAWNING & RESCUE/STORAGE
	// -------------------------------------------------------------------------

	// static allowed_player_spawn_classes = undefined; // Default: undefined -> sdWorld.allowed_player_classes = [ 'sdCharacter', 'sdPlayerDrone', 'sdPlayerOverlord', 'sdPlayerSpectator' ]. Restrict which classes players may spawn as, e.g. [ 'sdCharacter' ] to force humanoids only.

	// static allow_rescue_teleports = true; // Default: true. Allow Rescue Teleporters (RTPs) at all. Set false to disable respawn-on-death tech (harder server).
	// static allowed_rescue_teleports = null; // Default: null (all types). Restrict RTP types: [ sdRescueTeleport.TYPE_INFINITE_RANGE (0), TYPE_SHORT_RANGE (1), TYPE_CLONER (2), TYPE_RESPAWN_POINT (3) ].

	// static allow_private_storage = true;        // Default: true. Private storage accessible via LRTPs. false makes the DATABASE reject access (affects all servers using this DB).
	// static allow_private_storage_access = true; // Default: true. Disable private storage on THIS server only (leaves other servers on a shared DB unaffected).

	// Give starter items on respawn is handled by GiveStarterRespawnItems in sdServerConfigFull (large method: starter guns, extraction hover, instructor). Copy that whole method from sdServerConfigFull if you want to customize starting loadout.


	// -------------------------------------------------------------------------
	//  G. PERFORMANCE, OFFSCREEN SIMULATION & STORAGE FORMAT
	// -------------------------------------------------------------------------

	// static offscreen_behavior = 'OFFSCREEN_BEHAVIOR_SIMULATE_X_STEPS_AT_ONCE'; // Default. Also: 'OFFSCREEN_BEHAVIOR_SIMULATE_PROPERLY' (accurate, slow) or 'OFFSCREEN_BEHAVIOR_SIMULATE_X_TIMES_SLOWER'. Dense worlds cheat offscreen for performance.
	// static offscreen_behavior_x_value = 30;      // Default: 30. How many steps-at-once / how much slower offscreen. ~30 can give 2x perf with STEPS_AT_ONCE.
	// static debug_offscreen_behavior = false;     // Default: false. Set true to visualize offscreen movement for debugging.

	// static crystal_matter_regen_decrease = true; // Default: true. When false, disables the crystal matter-regeneration-rate decrease (crystals regen faster forever). Economy impact.

	// static store_game_files_in_ram = false;      // Default: false. Keep game files in RAM to avoid disk I/O until reboot (except during backups). More RAM use; can help VPS with poor Disk I/O.
	// static save_raw_version_of_snapshot = false; // Default: false. Also write a human-readable .raw.v snapshot (never used by the server). Can slow snapshot generation. Debugging aid.


	// -------------------------------------------------------------------------
	//  H. ADMIN, NETWORK & SECURITY (advanced)
	// -------------------------------------------------------------------------

	// static port = undefined; // Default: undefined -> auto 3000 + world_slot. Set a fixed port number if needed.
	// static let_server_owner_run_eval_command = false; // Default: false. Lets the first admin run arbitrary JavaScript via /eval. DANGEROUS if an admin account is compromised. Leave false unless you fully trust admin security.
	// static let_non_full_access_level_admin_setup_long_range_teleports = false; // Default: false. Can connect to arbitrary LRTPs and may leak server IP if you use Cloudflare. Leave false for security.
	// static let_non_full_access_level_admins_save_presets = true; // Default: true. Lower-level admins may save presets (cannot override top-admin presets of the same name).
	// static allowed_non_full_access_level_admin_commands = [ 'commands', 'listadmins', 'announce', 'restart', 'save', 'restore', 'god', 'admin', 'a', 'adm', 'db', 'qs', 'quickstart', 'database', 'remove', 'topactive', 'scale', 'logentitycount' ]; // Whitelist of commands non-top admins may run. Trim to lock things down.
	// static AutoGodModeForAllPlayers() { return false; } // Default: false. TESTING ONLY - grants every player god mode (invincibility, admin build/removal/teleport/damage guns, fly/grenade/stability upgrades) automatically the instant they spawn, no admin row needed. Applied once per life (checks !_god first), so it will not re-spawn the admin guns on every reconnect. Never enable this on a real/public server - it removes all danger and hands every player admin-tier destructive tools.
	// static GetCommandsAllowedForAllPlayers() { return []; } // Default: none allowed. Whitelist of admin-only slash commands every connected player (even without any admin row) may run - e.g. return [ 'event', 'spawnevent', 'zoom' ] to let anyone trigger weather events or change their own zoom level. Commands not in this list still require a normal admin row as usual. Pairs well with AutoGodModeForAllPlayers on a private testing server.
	// static adsense_client = 'ca-pub-7381466440820611'; // Your AdSense client id for in-game ads (see Google ad-placement docs). Your server only shows your own ads. Replace with your own or leave default.


	/*
		=====================================================================================
		 SERVER MODE RECIPES  (combine the options above - copy the pieces you want)
		=====================================================================================

		--- PvE-ONLY (players cannot hurt each other) ---
		  static player_vs_player_damage_scale = 0;
		  static GetHitAllowed( bullet_or_sword, target ) {
		      let attacker = ( bullet_or_sword._dangerous_from || bullet_or_sword._owner );
		      if ( attacker && attacker.is( sdCharacter ) && attacker._socket && target.is( sdCharacter ) && target._socket ) return false;
		      return true;
		  }

		--- RESTRICTED-PvP / ARENA (no damage before the match starts) ---
		  static skip_arrival_sequence = true;
		  static GetHitAllowed( bullet_or_sword, target ) {
		      let attacker = ( bullet_or_sword._dangerous_from || bullet_or_sword._owner );
		      if ( !sdWorld.game_started && attacker && attacker.is( sdCharacter ) && attacker._ai_enabled === sdCharacter.AI_MODEL_NONE
		           && target.is( sdCharacter ) && target._ai_enabled === sdCharacter.AI_MODEL_NONE ) return false;
		      return true;
		  }

		--- NO-BSU SERVER (no base shielding at all) ---
		  static allowed_base_shielding_unit_types = [];

		--- LIMITED-BSU SERVER (blue/matter BSUs only) ---
		  static allowed_base_shielding_unit_types = [ sdBaseShieldingUnit.TYPE_MATTER ];

		--- NO-RANDOM-EVENTS SERVER ---
		  static GetAllowedWorldEventCount() { return 0; }

		--- LOW-EVENT SERVER ---
		  static GetAllowedWorldEventCount() { return 3; }
		  static GetEventSpeed() { return 30 * 60 * 8; }

		--- HIGH-EVENT / CHAOS SERVER ---
		  static GetAllowedWorldEventCount() { return 40; }
		  static GetEventSpeed() { return 30 * 60; }

		--- PRIVATE / ADMIN-TEST SERVER ---
		  static password = 'change-me';        // requires a password to join
		  static make_server_public = false;    // never listed publicly
		  static skip_arrival_sequence = true;  // fast iteration

		--- INFINITE / OPEN-WORLD SERVER (default is already open-world) ---
		  static enable_bounds_move = true;
		  static aggressive_hibernation = true;
		  // Optionally widen limits (WARNING: perf + terrain generation cost):
		  // static open_world_max_distance_from_zero_coordinates_x = 120000;

		--- FIXED / SMALL MAP (no growth) ---
		  static enable_bounds_move = false;
		  // Keep aggressive_hibernation = true unless the map is tiny and you want full simulation.

		--- FFA / ROUND-BASED helpers (advanced) ---
		  These live in sdServerConfigFull-style overrides; useful building blocks:
		  static Announce( message ) { for ( let i = 0; i < sdWorld.sockets.length; i++ ) sdWorld.sockets[ i ].emit( 'SERVICE_MESSAGE', message ); }
		  // RespawnEveryoneAndResetScore(): see config_examples/server_config4.js for a full round-reset implementation.
		=====================================================================================
	*/

	// Check the sdServerConfigFull class below in sdServerConfig.js for the full, active implementations of every hook mentioned above.
}
