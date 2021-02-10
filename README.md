# Star Defenders 2D
This is a source code of my Star Defenders 2D game which you can usually play here: https://www.gevanni.com:3000

Finish it (contact me on twitter or patreon for that, I have plenty of plans, features and suggestions for bug fixes) or suggest updates as pull requests if you want to. 

Reason for that is a usual "I must go, my planet needs me". But once I'm done after working on my primary project I may revisit this one. But do you really want to wait? Players of this game do not and I woudn't either.

https://twitter.com/Eric_Gurt

https://www.patreon.com/Eric_Gurt

Discussion so far happens at Plazma Burst 2 discord server (besides game itself), but that isn't easy place to get into if you don't play Plazma Burst 2 though.


# Installation

In command line (linux, CentOS):

apt update

apt install nodejs

apt install npm

*pick directory*

npm init

npm install express --save

npm install jade --save

PS: You'll probably need latest Node.JS version. If something does not work - you can contact me or discuss it at #sd-discussion at PB2's discord server.
PSS: It is all pretty much same for Windows, just download Node.JS from their official website ( https://nodejs.org ), then follow the instructions towards running simple express application. Eventually just put game files instead that index.js file and run it. For debugging using Chromium browsers you can run it with line:

node --inspect index.js

After you've done that, green cube icon will magically appear at top left of any open devtools window.

# Start server

You'll need to update SSL (https thing) info in index.js or just get rid of SSL support. It will automatically let it run on Windows without SSL on localhost:3000
Then do:

node index.js > stdout.txt 2> stderr.txt &
