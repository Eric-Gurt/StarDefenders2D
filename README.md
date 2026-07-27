# Star Defenders 2D
This is the source code of my Star Defenders 2D game, which you can usually play here: https://www.gevanni.com:3000

Feel free to finish it (contact me on Twitter or Patreon - I have plenty of plans, features and bug-fix suggestions to share) or submit updates as pull requests if you'd like to.

The reason for that is the usual "I must go, my planet needs me". Once I'm done working on my primary project I may revisit this one. But do you really want to wait? Players of this game don't, and I wouldn't either.

https://twitter.com/Eric_Gurt

As for my part of the code, art and sound effects - this project can be used commercially (you are allowed to get revenue from it, be it ads, donations, subscriptions, or purchases of game access or in-game items). Once you're over $1,000 (USD) in total revenue, just support me via my Patreon (https://www.patreon.com/Eric_Gurt). The project uses GPL v3, so you can use it as a base for your other projects without needing to open source them.

As for other contributors - feel free to ask on our Discord server. If you're a contributor, you can list your own requirements here as well.

The project currently isn't restricted to specific people working on it - everyone is free to suggest pull requests, make branches, or even build separate games from it.

Development-related discussions so far happen here: https://discord.gg/rX4xEc2Y9E


# Installation

For Linux servers with systemd, download only the installer and run it:

```bash
curl -fsSL -o install-linux.sh https://raw.githubusercontent.com/Eric-Gurt/StarDefenders2D/main/install-linux.sh
sudo -E bash install-linux.sh
```

Run the installer from the Linux account that should own and run the server. `sudo -E` preserves that invoking user for the installer, so the default service owner matches the account you started from.

The installer can set up Node.js through nvm, clone or reuse the repository, install production dependencies, create systemd service/timer units, configure `sslconfig.json`, verify certificate/key permissions, add optional Let's Encrypt support, create world-data backups, and write per-service admin/uninstall helper files.

If you already have the game on the server, run the installer from that directory:

```bash
sudo -E bash install-linux.sh
```

For a real Git checkout, answer the interactive "How should the existing checkout be handled?" prompt:

- `keep`: leave the checkout exactly as-is; don't fetch or reset it now (auto-updates still apply later).
- `update`: fetch and hard-reset onto `origin/<branch>`, the same as a normal auto-update tick, without touching untracked files.
- `reset`: fetch, hard-reset onto `origin/<branch>`, and also remove untracked/leftover files inside the checkout (e.g. stray manually-copied files). World data, configs, secrets, and crash reports are preserved regardless of which mode you pick.

For unattended installs, set `CHECKOUT_MODE=keep|update|reset` in a `--config` file instead (the older `EXISTING_CHECKOUT_ONLY=yes|no` is still accepted as an alias for `keep`/`update`).

If the directory has game files but no `.git`, the installer offers:

- `git`: add Git metadata in place, after backing up the directory to `installerbackup`.
- `plain`: keep it as a non-Git install, after backing up the directory to `installerbackup`; GitHub auto-updates are disabled.
- `startfresh`: move the old directory contents aside and clone a fresh checkout.
- `abort`: stop without changing the directory.

Choosing `skip` for `sslconfig.json` leaves it unchanged, but the installer can still repair certificate/key permissions for the service user. The backup timer defaults to every two days and only backs up the selected world's snapshot/chunks data.

Installed services write crash-loop diagnostics to `crash_reports` inside the server directory. After repeated failed starts within the configured window, systemd pauses restarts until the owner fixes the cause and runs `systemctl reset-failed`. Timestamped crash reports are also pruned by count and age.

Each Linux install writes `<service-name>-admin-commands.txt` and `<service-name>-uninstall.sh` into the server directory. To remove only the generated service/timer files for one install, run:

```bash
sudo /path/to/StarDefenders2D/<service-name>-uninstall.sh
```

If an older install has the admin commands file but is missing the uninstall helper, regenerate it with:

```bash
sudo bash create-linux-uninstall-helper.sh /path/to/StarDefenders2D/<service-name>-admin-commands.txt
```

Before using Let's Encrypt, point a DNS name at the server and make sure TCP port 80 can reach it. Before exposing a world publicly, open the selected world-slot port in both the server firewall and any VPS/provider firewall.

For Windows/manual development, install Node.js from https://nodejs.org, install npm dependencies from the repository directory, and run the server directly. For debugging using Chromium browsers you can run it with command line (cmd.exe application):

```bash
node --inspect index.js
```
After that, a green cube icon will appear at the top-left of any open DevTools window.

# Start server

You'll need to update the SSL (HTTPS) info in `index.js`, or just get rid of SSL support entirely. On Windows, it will automatically fall back to running without SSL on localhost:3000.
Then do:
```
node index.js > stdout.txt 2> stderr.txt &
```
But there's a better way to start the server (it prevents the server from turning off, though there have still been cases where something sends it a termination signal):
```
nohup node index.js > stdout.txt 2> stderr.txt & disown
```
There's also an alternate guide from MrMcShroom:
https://docs.google.com/document/d/17ydIOjwjUKnHRcEVuYIYi35fBcIBid7k440I3X5fh9A/edit

# Admin commands

Admin commands are typed into the in-game chat box, prefixed with `/` (handled by `sdModeration.CommandReceived` in `game/server/sdModeration.js`). This list can change as the code evolves - `/help` (or `/commands`, `/?`) always prints the exact set of commands available to you in-game.

## Becoming the first admin

There's no `/selfhost` command in the current code. Instead:

1. Join the server and spawn a character.
2. Type `/selfpromote` (no admin rights required, works only while there are zero admins). This generates a one-time password file called `superuser_pass.v` in the server directory (if it doesn't already exist).
3. Open `superuser_pass.v` in a text editor, copy its contents, and type `/selfpromote <paste the password here>` in chat.
4. You are now the first (full access, `access_level` 0) admin. The password stops working once any admin exists.

Once you're an admin, other players can be promoted/demoted through the `/admin` panel (see below).

## Access levels

- **Full admin** (`access_level` 0, the first admin and anyone they promote to level 0): can run every command below.
- **Sub-admin** (`access_level` > 0, promoted by another admin): restricted to the commands listed in the server config's `allowed_non_full_access_level_admin_commands` array. By default that's: `commands`, `listadmins`, `announce`, `restart`, `save`, `restore`, `god`, `admin`/`a`/`adm`, `db`/`database`, `qs`/`quickstart`, `remove`, `topactive`, `scale`, `logentitycount`.
- **Non-admin / anyone connected**: `help`/`?`/`commands`, `listadmins`, `selfpromote`, `connection`/`socket`, `kill`.

## Command reference

General:
- `/help`, `/commands`, `/?` - list the commands available to you.
- `/selfpromote <password>` - see "Becoming the first admin" above.
- `/retry` - retry loading the admin/moderation data file if it failed to load on startup.
- `/listadmins` - list all admins with their index (`#0`, `#1`, ...) and access level.
- `/announce <text>` - broadcast a message to every connected player.
- `/connection`, `/socket` - show your own update rate and dropped/sent packet counts.
- `/password <text>` - set (or, with no text, clear) an extra join password non-admins must supply. Admins never need it.

Server lifecycle:
- `/quit`, `/shutdown`, `/exit` - stop the server process immediately.
- `/restart`, `/reboot [nosave|0]` - restart the server process (saves a snapshot first unless `nosave`/`0` is passed).
- `/save` - save a "timewarp" restore point (does nothing if `aggressive_hibernation` is enabled in the config).
- `/restore`, `/load` - restore the world from the last timewarp restore point, then restarts without saving.
- `/fullreset`, `/wipe` - delete the world snapshot and deep-sleep files, then restart without saving. Destructive.

World/gameplay:
- `/god <0|1|2>` - toggle godmode for yourself; `1` grants admin tool guns and upgrades, `2` also enables debug/sensor-area display, `0` turns it off.
- `/chill`, `/peace`, `/peaceful`, `/stopevents`, `/pauseevents <0|1>` - `1` pauses weather/AI events and clears existing hostile AI/effects; `0` resumes them.
- `/spawnevent`, `/event <number|sdWeather.PROPERTY>` - force-trigger a specific weather/world event, by numeric ID or by a named `sdWeather` constant (e.g. `/event sdWeather.EVENT_QUAKE`).
- `/remove <class|*>`, `/break <class|*>` - despawn all active entities of a given class (or `*` for all non-global entities). `/remove` also clears their "broken" flag so they won't be treated as destroyed; `/break` leaves that flag as-is.
- `/scale <10-1000>` - set your character's visual size percentage (defaults to 100 if omitted/invalid).
- `/zoom <10-1000>` - set your camera zoom as a percentage (defaults to 100).
- `/kill` - kill your own character and trigger the respawn sequence.
- `/boundsmove <x> <y> [fast|wipe]` - shift the world bounds by x,y (rounded to nearest 32; positive Y is downward). With `fast`/`wipe`, the world is collapsed to a point and re-expanded at the new location instead of sliding, effectively wiping the area.
- `/worldresize <x1|y1|x2|y2> <value>` - move one edge of the world bounds by `value` (rounded to nearest 32).

Diagnostics:
- `/topactive` - log the 10 most common active entity classes by count, once a second for 30 seconds.
- `/distinct <class>` - break down active entities of a class by type/tier/material/etc. and show the top 10 combinations by count.
- `/deepsleepinfo`, `/cells`, `/deepsleep`, `/ds` - show deep-sleep cell counts (unspawned, hibernated, scheduled-to-hibernate, do-not-hibernate).
- `/logentitycount` - log a count of all entities by class to the server console.
- `/updatecache` - force-refresh the server's global file cache.
- `/disablecache` - disable the global file cache.

Interfaces:
- `/admin`, `/a`, `/adm` - open the admin panel UI (promote/demote players, and other moderation tools not exposed as chat commands).
- `/database`, `/db` - open the database editor UI.

Dangerous/first-admin-only:
- `/eval <js code>` - run arbitrary JavaScript on the server. Only usable by the first admin (`access_level` 0), and only if `let_server_owner_run_eval_command` is enabled in the server config (disabled by default).
- `/quickstart`, `/qs` - instantly max out your own character's level, matter, and all shop upgrades. Intended for testing.
