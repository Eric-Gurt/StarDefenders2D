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

Upload files somewhere, remove node_modules as it might appear outdated (yet should be fine as long as server is not accessible from Internet, even if your server config has password)

In command line (linux, CentOS):
```
apt update

apt install nodejs

apt install npm
```
*pick directory*
```
npm init

npm install express --save

npm install socket.io --save

npm install socket.io-client --save
```
PS: You'll probably need latest Node.JS version. If something does not work - you can contact me or discuss it at #sd-discussion at PB2's discord server.

PSS: It is all pretty much same for Windows, just download Node.JS from their official website ( https://nodejs.org ), then follow the instructions towards running simple express application. Eventually just put game files instead of that index.js file and run it. For debugging using Chromium browsers you can run it with command line (cmd.exe application):
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
