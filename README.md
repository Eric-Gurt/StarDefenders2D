# Star Defenders 2D
This is a source code of my Star Defenders 2D game which you can usually play here: https://www.gevanni.com:3000

Finish it (contact me on twitter or patreon for that, I have plenty of plans, features and suggestions for bug fixes) or suggest updates as pull requests if you want to. 

Reason for that is a usual "I must go, my planet needs me". But once I'm done after working on my primary project I may revisit this one. But do you really want to wait? Players of this game do not and I woudn't either.

https://twitter.com/Eric_Gurt

As for my part of code, art and sound effects - this project can be used commercially (you are allowed to get revenue from it - be it ads, donations, subscriptions or purchases of game access or in-game items). Once you are over $1 000 (USD) in total revenue - just support me via my Patreon (https://www.patreon.com/Eric_Gurt). Project uses GPL v3 so you can use it as a base for your other projects, without need to open source.

As for other contributors - feel free to ask at our Discord server. If you are contributor - you can specify your requirements here as well.

Currently project isn't like restricted to specific people to work on it - everyone is free to suggest pull requests or make branches and even separate games.

Development-related discussions so far happen here: https://discord.gg/rX4xEc2Y9E


# Installation

For Linux servers with systemd, download only the installer and run it:

```bash
curl -fsSL -o install-linux.sh https://raw.githubusercontent.com/Eric-Gurt/StarDefenders2D/main/install-linux.sh
sudo -E bash install-linux.sh
```

Run the installer from the Linux account that should own and run the server. `sudo -E` preserves that invoking user for the installer, so the default service owner matches the account you started from.

The installer can set up Node.js through nvm, clone or reuse the repository, install production dependencies, create systemd service/timer units, configure `sslconfig.json`, verify certificate/key permissions, add optional Let's Encrypt support, and create world-data backups.

If you already have the game on the server, run the installer from that directory. For a real Git checkout, use:

```bash
sudo -E bash install-linux.sh --existing-checkout
```

If the directory has game files but no `.git`, the installer offers:

- `git`: add Git metadata in place, after backing up the directory to `installerbackup`.
- `plain`: keep it as a non-Git install, after backing up the directory to `installerbackup`; GitHub auto-updates are disabled.
- `startfresh`: move the old directory contents aside and clone a fresh checkout.
- `abort`: stop without changing the directory.

Choosing `skip` for `sslconfig.json` leaves it unchanged, but the installer can still repair certificate/key permissions for the service user. The backup timer defaults to every two days and only backs up the selected world's snapshot/chunks data.

Installed services write crash-loop diagnostics to `crash_reports` inside the server directory. After repeated failed starts within the configured window, systemd pauses restarts until the owner fixes the cause and runs `systemctl reset-failed`. Timestamped crash reports are also pruned by count and age.

Before using Let's Encrypt, point a DNS name at the server and make sure TCP port 80 can reach it. Before exposing a world publicly, open the selected world-slot port in both the server firewall and any VPS/provider firewall.

For Windows/manual development, install Node.js from https://nodejs.org, install npm dependencies from the repository directory, and run the server directly. For debugging using Chromium browsers you can run it with command line (cmd.exe application):

```bash
node --inspect index.js
```
After you've done that, green cube icon will magically appear at top left of any open devtools window.

# Start server

You'll need to update SSL (https thing) info in index.js or just get rid of SSL support. It will automatically let it run on Windows without SSL on localhost:3000 .
Then do:
```
node index.js > stdout.txt 2> stderr.txt &
```
But there is a better way to start server (it will prevent server turning off, though there still been cases when something sends termination signal to server):
```
nohup node index.js > stdout.txt 2> stderr.txt & disown
```
There is also alternate guide from MrMcShroom:
https://docs.google.com/document/d/17ydIOjwjUKnHRcEVuYIYi35fBcIBid7k440I3X5fh9A/edit

# Admin commands

These might change so type /selfhost - it will hint you what to do next. Once you've got admin rights you can type /help for full list of commands you can execute.
