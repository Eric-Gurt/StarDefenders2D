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
```
curl -fsSL -o install-linux.sh https://raw.githubusercontent.com/Eric-Gurt/StarDefenders2D/main/install-linux.sh
sudo bash install-linux.sh
```

The installer needs a systemd-based Linux server with root/sudo access and internet access. It can install missing dependencies, install Node.js through nvm, clone/update this repository, install npm production dependencies, create a crash-restarting systemd service, enable optional GitHub auto-updates, configure `sslconfig.json`, verify SSL certificate/key file permissions for the service user, optionally install Let's Encrypt, create periodic world-data backups, write a service-specific admin command reference, and watch `server_config*.js` / `sslconfig.json` for edits then enact graceful restarts.

If the game is already cloned on the server and you only want to add or repair the systemd service, auto-update timer, and restart watcher around that existing checkout, run the installer from that checkout with:
```
sudo bash install-linux.sh --existing-checkout
```
This mode requires the selected install/repo directory to already be a Git checkout with an `origin` remote. It skips the initial clone/checkout/reset step, but the generated update timer will still deploy future updates from the selected branch.

Choosing `skip` for `sslconfig.json` leaves the file unchanged. If an existing `sslconfig.json` is present, the installer can still verify and repair certificate/key file permissions so the systemd service user can read the configured paths.

The generated maintenance backup timer defaults to every two days, can be changed during installation, and copies only the selected world's `star_defenders_snapshot*.v`, optional raw snapshot, and `chunks*` folder if present. Update-time backups use the same scope. Periodic backups keep the latest periodic copy by default, and all managed backup folders still purge entries older than the configured retention period.

Before using Let's Encrypt, point a DNS name at the server and make sure TCP port 80 can reach it. Before exposing a game world publicly, make sure the selected world-slot port, such as `3000` for slot `0` or `4002` for slot `1002`, is open in both the server firewall and any VPS/provider firewall.

For Windows/manual development, install Node.js from https://nodejs.org, install npm dependencies from the repository directory, and run the server directly. For debugging using Chromium browsers you can run it with command line (cmd.exe application):
```
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
