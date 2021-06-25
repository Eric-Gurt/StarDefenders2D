class sdServerConfig
{
	// This file should contain one object (for example class like this one), it will be interpreted using basic eval method and automatically assigned to global variable sdWorld.server_config
			
	// If this all looks scary and you are using NetBeans - use "Ctrl + -" and "Ctrl + *" to hide big methods.
	
	static game_title = 'Star Defenders: Combat arena';
	
	static backgroundColor = '#818794';
	
	static onBeforeSnapshotLoad()
	{
		// Do something before shapshot is loaded. It is earliest available stage of logic - you can edit or alter shop contents here
		
		// [ min players, max players, map xml ]
		sdWorld.maps_available = [
			// railwars1
			[ 0, 4, `<player uid="#player*1" x="-830" y="-529" tox="0" toy="0" hea="130" hmax="130" team="1" side="1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*2" x="830" y="-529" tox="0" toy="0" hea="130" hmax="130" team="2" side="-1" char="8" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*7" x="-770" y="-529" tox="0" toy="0" hea="130" hmax="130" team="1" side="1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*4" x="770" y="-529" tox="0" toy="0" hea="130" hmax="130" team="2" side="-1" char="8" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*9" x="-630" y="-529" tox="0" toy="0" hea="130" hmax="130" team="1" side="1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*8" x="630" y="-529" tox="0" toy="0" hea="130" hmax="130" team="2" side="-1" char="8" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="-570" y="-529" tox="0" toy="0" hea="130" hmax="130" team="1" side="1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*3" x="570" y="-529" tox="0" toy="0" hea="130" hmax="130" team="2" side="-1" char="8" incar="-1" botaction="0" ondeath="-1" /><pushf uid="#pushf*1" x="-990" y="-600" w="100" h="400" tox="0" toy="-0.45" stab="0" damage="0" /><pushf uid="#pushf*2" x="890" y="-600" w="100" h="400" tox="0" toy="-0.45" stab="0" damage="0" /><pushf uid="#pushf*4" x="1100" y="-2100" w="700" h="1200" tox="-2" toy="0" stab="100" damage="0" /><pushf uid="#pushf" x="-1800" y="-2100" w="700" h="1200" tox="2" toy="0" stab="100" damage="0" /><bg x="-1100" y="-900" w="2300" h="1200" m="2" /><box x="200" y="-50" w="1040" h="450" m="3" /><box x="-1240" y="-50" w="1040" h="450" m="3" /><box x="600" y="-100" w="640" h="270" m="3" /><box x="-1240" y="-100" w="640" h="270" m="3" /><box x="-1240" y="-200" w="440" h="270" m="3" /><box x="-1800" y="-900" w="800" h="1300" m="3" /><box x="1000" y="-900" w="800" h="1300" m="3" /><box x="800" y="-200" w="440" h="270" m="3" /><box x="300" y="-120" w="40" h="120" m="3" /><box x="-340" y="-120" w="40" h="120" m="3" /><box x="-540" y="-150" w="40" h="250" m="3" /><box x="500" y="-150" w="40" h="250" m="3" /><box x="810" y="-250" w="40" h="150" m="3" /><box x="-850" y="-250" w="40" h="150" m="3" /><box x="-600" y="0" w="1200" h="400" m="3" /><box x="-500" y="-800" w="100" h="300" m="3" /><box x="400" y="-800" w="100" h="300" m="3" /><box x="470" y="-530" w="180" h="230" m="0" /><box x="-650" y="-530" w="180" h="230" m="0" /><box x="-850" y="-530" w="100" h="50" m="0" /><box x="750" y="-530" w="100" h="50" m="0" /><box x="680" y="-170" w="40" h="120" m="3" /><box x="-720" y="-170" w="40" h="120" m="3" /><box x="600" y="-330" w="100" h="30" m="0" /><box x="-700" y="-330" w="100" h="30" m="0" /><box x="540" y="-330" w="60" h="60" m="0" /><box x="-600" y="-330" w="60" h="60" m="0" /><box x="-100" y="-700" w="200" h="30" m="0" /><decor uid="#decor*1" model="antigravity" at="-1" x="-940" y="-200" addx="0" addy="0" /><decor uid="#decor" model="antigravity" at="-1" x="940" y="-200" addx="0" addy="0" /><gun uid="#gun*1" x="-830" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*2" x="830" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*3" x="-830" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*4" x="830" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*7" x="770" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*6" x="770" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*8" x="-770" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*5" x="-770" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*12" x="630" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*9" x="630" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*14" x="-630" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*13" x="-630" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*18" x="570" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*11" x="570" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*15" x="-570" y="-560" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun" x="-570" y="-540" model="gun_defibrillator" command="-1" upg="0" /><lamp uid="#light*9" x="530" y="-290" power="0.4" flare="false" /><lamp uid="#light*7" x="-530" y="-290" power="0.4" flare="false" /><lamp uid="#light*10" x="-420" y="-490" power="0.4" flare="false" /><lamp uid="#light" x="420" y="-490" power="0.4" flare="false" />`],
			
			// spidertraps
			[ 0, 6, `<player uid="#player*4" x="600" y="-390" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*1" x="-490" y="-390" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*6" x="650" y="-390" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*2" x="-540" y="-390" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*7" x="700" y="-390" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*3" x="-590" y="-390" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*9" x="750" y="-390" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*5" x="-640" y="-390" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><pushf uid="#pushf*1" x="-1700" y="-1800" w="1400" h="700" tox="2" toy="0" stab="100" damage="0" /><pushf uid="#pushf*2" x="400" y="-1800" w="1400" h="700" tox="-2" toy="0" stab="100" damage="0" /><bg x="-1100" y="-1100" w="1150" h="1500" m="11" c="0" /><bg x="50" y="-1100" w="1150" h="1500" m="11" c="0" /><bg x="-20" y="-270" w="140" h="140" m="10" c="0" /><bg x="-30" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="-20" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="-10" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="0" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="10" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="20" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="30" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="40" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="50" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="60" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="70" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="80" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="90" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="100" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="110" y="-280" w="10" h="10" m="11" c="#AAAA66" /><bg x="120" y="-280" w="10" h="10" m="11" c="#000000" /><bg x="-30" y="-270" w="10" h="10" m="11" c="#000000" /><bg x="-30" y="-260" w="10" h="10" m="11" c="#AAAA66" /><bg x="-30" y="-250" w="10" h="10" m="11" c="#000000" /><bg x="-30" y="-240" w="10" h="10" m="11" c="#AAAA66" /><bg x="-30" y="-230" w="10" h="10" m="11" c="#000000" /><bg x="-30" y="-220" w="10" h="10" m="11" c="#AAAA66" /><bg x="-30" y="-210" w="10" h="10" m="11" c="#000000" /><bg x="-30" y="-200" w="10" h="10" m="11" c="#AAAA66" /><bg x="-30" y="-190" w="10" h="10" m="11" c="#000000" /><bg x="120" y="-270" w="10" h="10" m="11" c="#AAAA66" /><bg x="120" y="-260" w="10" h="10" m="11" c="#000000" /><bg x="120" y="-250" w="10" h="10" m="11" c="#AAAA66" /><bg x="120" y="-240" w="10" h="10" m="11" c="#000000" /><bg x="120" y="-230" w="10" h="10" m="11" c="#AAAA66" /><bg x="120" y="-220" w="10" h="10" m="11" c="#000000" /><bg x="120" y="-210" w="10" h="10" m="11" c="#AAAA66" /><bg x="120" y="-200" w="10" h="10" m="11" c="#000000" /><bg x="-180" y="-20" w="460" h="320" m="10" c="" /><bg x="120" y="-190" w="10" h="10" m="11" c="#AAAA66" /><bg x="-120" y="-50" w="20" h="20" m="10" c="" /><bg x="200" y="-50" w="20" h="20" m="10" c="" /><bg x="290" y="10" w="20" h="20" m="10" c="" /><bg x="290" y="140" w="20" h="20" m="10" c="" /><bg x="-210" y="140" w="20" h="20" m="10" c="" /><bg x="-210" y="10" w="20" h="20" m="10" c="" /><bg x="-90" y="-40" w="10" h="10" m="10" c="" /><bg x="-120" y="-70" w="10" h="10" m="10" c="" /><bg x="210" y="-70" w="10" h="10" m="10" c="" /><bg x="180" y="-40" w="10" h="10" m="10" c="" /><bg x="290" y="40" w="10" h="10" m="10" c="" /><bg x="290" y="120" w="10" h="10" m="10" c="" /><bg x="-200" y="40" w="10" h="10" m="10" c="" /><bg x="-200" y="120" w="10" h="10" m="10" c="" /><bg x="-60" y="-650" w="20" h="20" m="11" c="#886666" /><bg x="-80" y="-640" w="10" h="10" m="11" c="#886666" /><bg x="-30" y="-640" w="10" h="10" m="11" c="#886666" /><bg x="140" y="-650" w="20" h="20" m="11" c="#886666" /><bg x="120" y="-640" w="10" h="10" m="11" c="#886666" /><bg x="170" y="-640" w="10" h="10" m="11" c="#886666" /><bg x="-60" y="-590" w="20" h="20" m="11" c="#886666" /><bg x="-80" y="-590" w="10" h="10" m="11" c="#886666" /><bg x="-30" y="-590" w="10" h="10" m="11" c="#886666" /><bg x="140" y="-590" w="20" h="20" m="11" c="#886666" /><bg x="120" y="-590" w="10" h="10" m="11" c="#886666" /><bg x="170" y="-590" w="10" h="10" m="11" c="#886666" /><bg x="40" y="-460" w="20" h="20" m="11" c="#886666" /><bg x="20" y="-460" w="10" h="10" m="11" c="#886666" /><bg x="70" y="-460" w="10" h="10" m="11" c="#886666" /><bg x="40" y="-570" w="20" h="20" m="11" c="#886666" /><bg x="20" y="-560" w="10" h="10" m="11" c="#886666" /><bg x="70" y="-560" w="10" h="10" m="11" c="#886666" /><water x="-180" y="210" w="180" h="90" damage="1" /><water x="100" y="210" w="180" h="90" damage="1" /><water x="0" y="240" w="100" h="60" damage="1" /><box x="-100" y="-180" w="100" h="40" m="4" /><box x="-400" y="-50" w="250" h="50" m="4" /><box x="-900" y="-410" w="200" h="110" m="4" /><box x="-1700" y="-1100" w="690" h="1200" m="4" /><box x="-720" y="50" w="40" h="50" m="4" /><box x="-450" y="-40" w="140" h="40" m="4" /><box x="-800" y="200" w="600" h="500" m="4" /><box x="-300" y="300" w="700" h="400" m="4" /><box x="-100" y="0" w="40" h="20" m="4" /><box x="-220" y="170" w="40" h="230" m="4" /><box x="-560" y="140" w="80" h="160" m="4" /><box x="-210" y="-70" w="80" h="50" m="4" /><box x="-50" y="-170" w="50" h="70" m="4" /><box x="-440" y="-410" w="80" h="110" m="4" /><box x="-260" y="-40" w="40" h="60" m="4" /><box x="-100" y="-620" w="30" h="20" m="4" /><box x="-440" y="-1000" w="80" h="400" m="4" /><box x="-900" y="-1100" w="500" h="450" m="4" /><box x="-1200" y="-1100" w="500" h="500" m="4" /><box x="-520" y="170" w="80" h="130" m="4" /><box x="-1700" y="50" w="800" h="650" m="4" /><box x="-1000" y="230" w="300" h="470" m="4" /><box x="-890" y="-150" w="170" h="30" m="4" /><box x="-920" y="-360" w="140" h="80" m="4" /><box x="-1700" y="-1100" w="900" h="620" m="4" /><box x="-1100" y="-50" w="150" h="150" m="4" /><box x="-760" y="60" w="20" h="20" m="4" /><box x="-800" y="60" w="20" h="20" m="4" /><box x="-840" y="60" w="20" h="20" m="4" /><box x="-1000" y="180" w="140" h="120" m="4" /><box x="-740" y="-340" w="340" h="30" m="4" /><box x="-750" y="-150" w="50" h="50" m="4" /><box x="-900" y="-160" w="30" h="40" m="4" /><box x="-110" y="-320" w="30" h="20" m="4" /><box x="-500" y="-380" w="100" h="60" m="4" /><box x="-740" y="-380" w="100" h="60" m="4" /><box x="-630" y="-370" w="20" h="20" m="4" /><box x="-530" y="-370" w="20" h="20" m="4" /><box x="-590" y="-380" w="40" h="20" m="4" /><box x="-600" y="-370" w="60" h="20" m="4" /><box x="-400" y="-1100" w="100" h="300" m="4" /><box x="100" y="-180" w="100" h="40" m="4" /><box x="250" y="-50" w="250" h="50" m="4" /><box x="800" y="-410" w="200" h="110" m="4" /><box x="1110" y="-1100" w="690" h="1200" m="4" /><box x="780" y="50" w="40" h="50" m="4" /><box x="410" y="-40" w="140" h="40" m="4" /><box x="300" y="200" w="600" h="500" m="4" /><box x="160" y="0" w="40" h="20" m="4" /><box x="280" y="170" w="40" h="230" m="4" /><box x="580" y="140" w="80" h="160" m="4" /><box x="230" y="-70" w="80" h="50" m="4" /><box x="100" y="-170" w="50" h="70" m="4" /><box x="460" y="-410" w="80" h="110" m="4" /><box x="320" y="-40" w="40" h="60" m="4" /><box x="460" y="-1000" w="80" h="400" m="4" /><box x="500" y="-1100" w="500" h="450" m="4" /><box x="800" y="-1100" w="500" h="500" m="4" /><box x="540" y="170" w="80" h="130" m="4" /><box x="1000" y="50" w="800" h="650" m="4" /><box x="800" y="230" w="300" h="470" m="4" /><box x="820" y="-150" w="170" h="30" m="4" /><box x="880" y="-360" w="140" h="80" m="4" /><box x="900" y="-1100" w="900" h="620" m="4" /><box x="1050" y="-50" w="150" h="150" m="4" /><box x="840" y="60" w="20" h="20" m="4" /><box x="880" y="60" w="20" h="20" m="4" /><box x="920" y="60" w="20" h="20" m="4" /><box x="960" y="180" w="140" h="120" m="4" /><box x="500" y="-340" w="340" h="30" m="4" /><box x="800" y="-150" w="50" h="50" m="4" /><box x="970" y="-160" w="30" h="40" m="4" /><box x="500" y="-380" w="100" h="60" m="4" /><box x="740" y="-380" w="100" h="60" m="4" /><box x="710" y="-370" w="20" h="20" m="4" /><box x="610" y="-370" w="20" h="20" m="4" /><box x="650" y="-380" w="40" h="20" m="4" /><box x="640" y="-370" w="60" h="20" m="4" /><box x="400" y="-1100" w="100" h="300" m="4" /><box x="-30" y="-160" w="160" h="40" m="4" /><box x="0" y="200" w="100" h="40" m="4" /><box x="180" y="-320" w="30" h="20" m="4" /><box x="1090" y="-230" w="140" h="80" m="4" /><box x="-1130" y="-230" w="140" h="80" m="4" /><box x="-30" y="-620" w="20" h="20" m="4" /><box x="110" y="-620" w="20" h="20" m="4" /><box x="170" y="-620" w="30" h="20" m="4" /><box x="10" y="-540" w="20" h="70" m="4" /><box x="70" y="-540" w="20" h="70" m="4" /><box x="-30" y="-520" w="40" h="50" m="4" /><box x="90" y="-520" w="40" h="50" m="4" /><box x="410" y="-700" w="20" h="20" m="4" /><box x="-330" y="-700" w="20" h="20" m="4" /><door uid="#door*1" x="-650" y="-370" w="160" h="50" moving="false" tarx="0" tary="0" maxspeed="10" vis="false" /><door uid="#door*2" x="590" y="-370" w="160" h="50" moving="false" tarx="0" tary="0" maxspeed="10" vis="false" /><gun uid="#gun*1" x="-490" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*2" x="-490" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*5" x="-540" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*6" x="-540" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*11" x="-590" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*12" x="-590" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*13" x="-640" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*17" x="-640" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*16" x="600" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*14" x="600" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*22" x="650" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*24" x="650" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*25" x="700" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*30" x="700" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*34" x="750" y="-400" model="gun_gl" command="-1" upg="0" /><gun uid="#gun*26" x="750" y="-420" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*3" x="50" y="-200" model="gun_minigun" command="-1" upg="0" /><lamp uid="#light*4" x="50" y="-400" power="0.4" flare="false" /><lamp uid="#light*5" x="-200" y="-80" power="0.4" flare="false" /><lamp uid="#light*7" x="300" y="-80" power="0.4" flare="false" /><lamp uid="#light*8" x="510" y="-50" power="0.4" flare="false" /><lamp uid="#light*6" x="-410" y="-50" power="0.4" flare="false" /><lamp uid="#light*11" x="-760" y="-110" power="0.4" flare="false" /><lamp uid="#light*9" x="860" y="-110" power="0.4" flare="false" /><lamp uid="#light*14" x="930" y="200" power="0.4" flare="false" /><lamp uid="#light*10" x="-830" y="200" power="0.4" flare="false" /><lamp uid="#light*2" x="-790" y="-590" power="0.4" flare="false" /><lamp uid="#light*3" x="890" y="-590" power="0.4" flare="false" /><lamp uid="#light*12" x="50" y="100" power="0.4" flare="false" /><region uid="#region*1" x="-20" y="-270" w="140" h="140" use_target="#trigger*2" use_on="4" /><trigger uid="#trigger*1" x="0" y="-300" enabled="true" maxcalls="-1" actions_1_type="15" actions_1_targetA="#gun*3" actions_1_targetB="#region*1" actions_2_type="62" actions_2_targetA="#gun*3" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="#pushf*3" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger*2" x="140" y="-280" enabled="true" maxcalls="-1" actions_1_type="19" actions_1_targetA="#trigger*1" actions_1_targetB="0" actions_2_type="44" actions_2_targetA="#timer*2" actions_2_targetB="0" actions_3_type="25" actions_3_targetA="#timer*2" actions_3_targetB="0" actions_4_type="62" actions_4_targetA="#gun*3" actions_4_targetB="1" actions_5_type="-1" actions_5_targetA="#pushf*3" actions_5_targetB="-1" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger*3" x="140" y="-220" enabled="true" maxcalls="-1" actions_1_type="26" actions_1_targetA="#timer*2" actions_1_targetB="0" actions_2_type="20" actions_2_targetA="#trigger*1" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="10" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger*6" x="-60" y="-200" enabled="true" maxcalls="1" actions_1_type="170" actions_1_targetA="#gun*3" actions_1_targetB="2" actions_2_type="172" actions_2_targetA="#gun*3" actions_2_targetB="0" actions_3_type="175" actions_3_targetA="#gun*3" actions_3_targetB="23" actions_4_type="64" actions_4_targetA="#gun*3" actions_4_targetB="2" actions_5_type="100" actions_5_targetA="spin" actions_5_targetB="0" actions_6_type="81" actions_6_targetA="#gun*3" actions_6_targetB="#trigger*4" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger*4" x="-260" y="-200" enabled="true" maxcalls="-1" actions_1_type="102" actions_1_targetA="spin" actions_1_targetB="0.1" actions_2_type="114" actions_2_targetA="spin" actions_2_targetB="2" actions_3_type="100" actions_3_targetA="spin" actions_3_targetB="2" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger*9" x="-300" y="-160" enabled="true" maxcalls="-1" actions_1_type="-1" actions_1_targetA="SPIN = spin" actions_1_targetB="0" actions_2_type="171" actions_2_targetA="#gun*3" actions_2_targetB="spin" actions_3_type="103" actions_3_targetA="spin" actions_3_targetB="0.9" actions_4_type="115" actions_4_targetA="spin" actions_4_targetB="0.1" actions_5_type="100" actions_5_targetA="spin" actions_5_targetB="0.1" actions_6_type="103" actions_6_targetA="spin" actions_6_targetB="1" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><timer uid="#timer*1" x="0" y="-330" enabled="true" maxcalls="-1" target="#trigger*1" delay="0" /><timer uid="#timer*2" x="140" y="-250" enabled="false" maxcalls="-1" target="#trigger*3" delay="3" /><timer uid="#timer*4" x="-90" y="-200" enabled="true" maxcalls="1" target="#trigger*6" delay="0" /><timer uid="#timer*3" x="-300" y="-200" enabled="true" maxcalls="-1" target="#trigger*9" delay="5" /><inf x="120" y="-1320" mark="port_nades_count" forteam="4" /><inf x="-70" y="-1440" mark="sky" forteam="7" /><inf x="-40" y="-1350" mark="dm_slots_on_spawn" forteam="5,6" /><inf x="-70" y="-1340" mark="dm_max_guns_on_spawn" forteam="2" />` ],
			
			// deadsimple
			//[ 0, Infinity, `<player uid="#player45*4" x="1680" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*1" x="-1680" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*6" x="1620" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*2" x="-1620" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*7" x="1560" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*3" x="-1560" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*8" x="1500" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*5" x="-1500" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*11" x="1920" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*9" x="-1920" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*13" x="1860" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*12" x="-1860" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*15" x="1800" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*10" x="-1800" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*16" x="1740" y="0" tox="0" toy="0" hea="150" hmax="150" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player45*14" x="-1740" y="0" tox="0" toy="0" hea="150" hmax="150" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><pushf uid="#pushf22*1" x="-4000" y="350" w="1530" h="270" tox="0" toy="0" stab="0" damage="10000" /><pushf uid="#pushf23*1" x="-4580" y="-650" w="950" h="540" tox="0" toy="0" stab="0" damage="0" /><pushf uid="#pushf23*2" x="3630" y="-670" w="950" h="540" tox="0" toy="0" stab="0" damage="0" /><pushf uid="#pushf22*2" x="2450" y="350" w="1530" h="270" tox="0" toy="0" stab="0" damage="10000" /><bg x="-1400" y="-310" w="600" h="400" m="10" /><bg x="-70" y="-180" w="140" h="240" m="9" /><bg x="800" y="-310" w="600" h="400" m="10" /><bg x="-610" y="-100" w="220" h="200" m="4" /><bg x="390" y="-100" w="220" h="200" m="4" /><bg x="2000" y="-400" w="800" h="200" m="10" /><bg x="3700" y="-400" w="800" h="200" m="10" /><bg x="-4500" y="-400" w="800" h="200" m="10" /><bg x="-2800" y="-400" w="800" h="200" m="10" /><bg x="2700" y="-260" w="1100" h="910" m="1" /><bg x="-3800" y="-260" w="1100" h="840" m="1" /><box x="-2200" y="0" w="4400" h="670" m="1" /><box x="-1390" y="-20" w="580" h="120" m="4" /><box x="-1380" y="-30" w="560" h="120" m="4" /><box x="-1370" y="-40" w="540" h="120" m="4" /><box x="-1330" y="-310" w="480" h="40" m="4" /><box x="-600" y="-100" w="200" h="200" m="4" /><box x="-1400" y="-310" w="100" h="80" m="4" /><box x="-900" y="-310" w="100" h="80" m="4" /><box x="-2800" y="-300" w="800" h="970" m="0" /><box x="-100" y="-60" w="200" h="160" m="4" /><box x="810" y="-20" w="580" h="120" m="4" /><box x="820" y="-30" w="560" h="120" m="4" /><box x="830" y="-40" w="540" h="120" m="4" /><box x="850" y="-310" w="480" h="40" m="4" /><box x="400" y="-100" w="200" h="200" m="4" /><box x="1300" y="-310" w="100" h="80" m="4" /><box x="800" y="-310" w="100" h="80" m="4" /><box x="2000" y="-300" w="800" h="970" m="0" /><box x="-4500" y="400" w="9000" h="400" m="2" /><box x="3700" y="-300" w="800" h="980" m="0" /><box x="-4500" y="-300" w="800" h="950" m="0" /><box x="800" y="-10" w="600" h="110" m="4" /><box x="-1400" y="-10" w="600" h="110" m="4" /><box x="-60" y="-170" w="120" h="270" m="-1" /><box x="4490" y="-600" w="10" h="400" m="-1" /><gun uid="#gun103*1" x="-1680" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*2" x="-1620" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*3" x="-1560" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*5" x="-1500" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*9" x="-2150" y="-310" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*10" x="-2350" y="-310" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*11" x="2160" y="-310" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*13" x="2350" y="-310" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*14" x="550" y="-110" model="gun_plasmagun" command="-1" upg="3" /><gun uid="#gun103*12" x="-450" y="-110" model="gun_plasmagun" command="-1" upg="3" /><gun uid="#gun103*17" x="0" y="-180" model="gun_bfg" command="-1" upg="3" /><gun uid="#gun103*15" x="-550" y="-110" model="gun_plasmagun" command="-1" upg="3" /><gun uid="#gun103*16" x="450" y="-110" model="gun_plasmagun" command="-1" upg="3" /><gun uid="#gun103*18" x="0" y="-180" model="gun_bfg" command="-1" upg="3" /><gun uid="#gun103*22" x="-1500" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*27" x="-1560" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*24" x="-1620" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*26" x="-1680" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*25" x="-1500" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*28" x="-1560" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*31" x="-1620" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*30" x="-1680" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*40" x="-1920" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*33" x="-1860" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*43" x="-1800" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*36" x="-1740" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*47" x="-1740" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*39" x="-1800" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*38" x="-1860" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*34" x="-1920" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*41" x="-1740" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*45" x="-1800" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*42" x="-1860" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*48" x="-1920" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*4" x="1680" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*8" x="1620" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*7" x="1560" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*6" x="1500" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*23" x="1500" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*29" x="1560" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*50" x="1620" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*32" x="1680" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*35" x="1500" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*37" x="1560" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*44" x="1620" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*46" x="1680" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*49" x="1920" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*55" x="1860" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*51" x="1800" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*52" x="1740" y="-10" model="gun_rl" command="-1" upg="3" /><gun uid="#gun103*54" x="1740" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*56" x="1800" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*59" x="1860" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*53" x="1920" y="-20" model="gun_pistol2" command="-1" upg="3" /><gun uid="#gun103*58" x="1740" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*61" x="1800" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*66" x="1860" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun103*57" x="1920" y="-30" model="gun_defibrillator" command="-1" upg="3" /><gun uid="#gun173*2" x="1150" y="-320" model="gun_minigun" command="-1" upg="0" /><gun uid="#gun173*3" x="1050" y="-320" model="gun_minigun" command="-1" upg="0" /><gun uid="#gun173*4" x="-1050" y="-320" model="gun_minigun" command="-1" upg="0" /><gun uid="#gun173*5" x="-1150" y="-320" model="gun_minigun" command="-1" upg="0" /><region uid="#region11*1" x="3250" y="-1200" w="300" h="900" use_target="#trigger26*2" use_on="6" /><region uid="#region11*2" x="2950" y="-1200" w="300" h="900" use_target="-1" use_on="0" /><region uid="#region11*3" x="-3250" y="-1200" w="300" h="900" use_target="-1" use_on="0" /><region uid="#region11*4" x="-3550" y="-1200" w="300" h="900" use_target="#trigger26*1" use_on="6" /><trigger uid="#trigger26*1" x="-3200" y="-1290" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="#region11*4" actions_1_targetB="#region11*2" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger26*2" x="3310" y="-1330" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="#region11*1" actions_1_targetB="#region11*3" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><inf x="20" y="-400" mark="sky" forteam="6" /><inf x="-50" y="-390" mark="he_nades_count" forteam="6" />` ],
			
			// level1_mp
			[ 4, Infinity, `<player uid="#player*6" x="-5130" y="700" tox="0" toy="0" hea="150" hmax="150" team="12" side="1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*3" x="-270" y="330" tox="0" toy="0" hea="150" hmax="150" team="13" side="-1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*8" x="-5060" y="700" tox="0" toy="0" hea="150" hmax="150" team="12" side="1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*4" x="-200" y="330" tox="0" toy="0" hea="150" hmax="150" team="13" side="-1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*10" x="-4950" y="620" tox="0" toy="0" hea="150" hmax="150" team="12" side="1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*5" x="-130" y="330" tox="0" toy="0" hea="150" hmax="150" team="13" side="-1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*9" x="-4880" y="620" tox="0" toy="0" hea="150" hmax="150" team="12" side="1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*7" x="-30" y="330" tox="0" toy="0" hea="150" hmax="150" team="13" side="-1" char="73" incar="-1" botaction="0" ondeath="-1" /><pushf uid="#pushf*1" x="-6300" y="-2400" w="1000" h="2400" tox="1" toy="0" stab="100" damage="0" /><pushf uid="#pushf*2" x="790" y="-2400" w="830" h="2070" tox="-1" toy="0" stab="100" damage="0" /><pushf uid="#pushf" x="740" y="160" w="960" h="420" tox="0" toy="0" stab="0" damage="1" /><bg x="-2720" y="280" w="1330" h="790" m="1" /><bg x="-1390" y="60" w="2100" h="540" m="1" /><bg x="-5600" y="430" w="2880" h="410" m="1" /><bg x="-2640" y="50" w="40" h="150" m="0" /><bg x="710" y="160" w="910" h="440" m="2" /><bg x="-1140" y="10" w="180" h="50" m="1" /><bg x="-2600" y="-150" w="210" h="40" m="0" /><bg x="-1980" y="-150" w="210" h="40" m="0" /><bg x="-3300" y="210" w="360" h="220" m="1" /><bg x="-2600" y="-110" w="830" h="310" m="0" /><bg x="-900" y="-100" w="100" h="80" m="0" /><water x="-5500" y="740" w="200" h="60" damage="0" /><box x="-1800" y="-190" w="40" h="130" m="0" /><box x="-1970" y="-160" w="190" h="80" m="0" /><box x="-1990" y="-190" w="40" h="140" m="0" /><box x="-2980" y="240" w="330" h="210" m="1" /><box x="-6300" y="0" w="1000" h="500" m="1" /><box x="-2610" y="30" w="40" h="40" m="0" /><box x="-2020" y="-120" w="70" h="40" m="0" /><box x="-2420" y="-190" w="40" h="140" m="0" /><box x="-2590" y="-160" w="190" h="80" m="0" /><box x="-2610" y="-190" w="40" h="130" m="0" /><box x="-2220" y="-150" w="40" h="90" m="0" /><box x="600" y="470" w="200" h="730" m="0" /><box x="600" y="110" w="200" h="180" m="0" /><box x="690" y="510" w="930" h="690" m="0" /><box x="790" y="-330" w="830" h="480" m="0" /><box x="-100" y="40" w="40" h="140" m="0" /><box x="-500" y="0" w="200" h="180" m="0" /><box x="-3310" y="410" w="200" h="90" m="2" /><box x="-3650" y="310" w="410" h="310" m="1" /><box x="-3870" y="560" w="330" h="110" m="1" /><box x="-3930" y="520" w="110" h="110" m="2" /><box x="-4310" y="630" w="140" h="290" m="2" /><box x="-4840" y="730" w="720" h="190" m="2" /><box x="-4270" y="690" w="120" h="140" m="2" /><box x="-6300" y="800" w="4800" h="400" m="2" /><box x="-4800" y="400" w="600" h="100" m="1" /><box x="-6300" y="320" w="800" h="690" m="2" /><box x="-4970" y="620" w="190" h="250" m="2" /><box x="-5260" y="700" w="330" h="250" m="2" /><box x="-5010" y="670" w="80" h="80" m="2" /><box x="-5300" y="730" w="80" h="110" m="2" /><box x="-3080" y="720" w="110" h="190" m="2" /><box x="-4580" y="460" w="150" h="80" m="2" /><box x="690" y="80" w="930" h="140" m="0" /><box x="60" y="500" w="640" h="700" m="2" /><box x="-2630" y="-120" w="50" h="40" m="0" /><box x="-600" y="50" w="520" h="70" m="1" /><box x="-1570" y="480" w="800" h="720" m="2" /><box x="-1570" y="270" w="380" h="100" m="0" /><box x="-900" y="250" w="100" h="110" m="0" /><box x="-1700" y="240" w="400" h="70" m="0" /><box x="-1730" y="210" w="330" h="100" m="0" /><box x="-1730" y="180" w="230" h="100" m="0" /><box x="-1400" y="0" w="300" h="100" m="1" /><box x="-2890" y="50" w="300" h="340" m="1" /><box x="-1000" y="0" w="300" h="100" m="1" /><box x="-3360" y="530" w="80" h="130" m="1" /><box x="-3430" y="180" w="260" h="160" m="1" /><box x="-2250" y="-120" w="100" h="40" m="0" /><box x="-2410" y="-120" w="70" h="40" m="0" /><box x="-1850" y="500" w="110" h="40" m="2" /><box x="-2220" y="50" w="40" h="80" m="0" /><box x="-4840" y="640" w="610" h="140" m="2" /><box x="-700" y="330" w="230" h="50" m="2" /><box x="400" y="40" w="450" h="100" m="1" /><box x="-900" y="-40" w="100" h="170" m="0" /><box x="-4400" y="340" w="100" h="100" m="0" /><box x="-4700" y="340" w="100" h="100" m="0" /><box x="-500" y="300" w="40" h="80" m="0" /><box x="-340" y="300" w="40" h="120" m="0" /><box x="-100" y="300" w="40" h="120" m="0" /><box x="60" y="300" w="40" h="80" m="0" /><box x="80" y="50" w="230" h="70" m="1" /><box x="60" y="0" w="40" h="180" m="0" /><box x="500" y="0" w="350" h="140" m="1" /><box x="240" y="430" w="100" h="120" m="0" /><box x="-3050" y="200" w="250" h="100" m="1" /><box x="-3030" y="540" w="200" h="90" m="2" /><box x="-4020" y="760" w="170" h="170" m="2" /><box x="-3410" y="750" w="180" h="160" m="2" /><box x="-1840" y="120" w="140" h="110" m="0" /><box x="-1830" y="150" w="230" h="170" m="0" /><box x="-1360" y="-160" w="140" h="30" m="0" /><box x="560" y="-50" w="40" h="110" m="0" /><box x="230" y="230" w="110" h="40" m="0" /><box x="-1140" y="420" w="160" h="110" m="2" /><box x="-3010" y="750" w="360" h="210" m="2" /><box x="-2920" y="580" w="520" h="40" m="2" /><box x="-2480" y="550" w="450" h="130" m="2" /><box x="-2700" y="100" w="940" h="260" m="0" /><box x="-2200" y="320" w="220" h="80" m="2" /><box x="-2400" y="500" w="170" h="80" m="2" /><box x="-1920" y="670" w="420" h="210" m="2" /><box x="-1310" y="-150" w="40" h="220" m="0" /><box x="-900" y="-110" w="100" h="30" m="0" /><box x="-5380" y="400" w="280" h="70" m="1" /><box x="-5170" y="360" w="40" h="80" m="0" /><box x="-850" y="520" w="1010" h="680" m="2" /><box x="-500" y="500" w="40" h="80" m="0" /><box x="-330" y="330" w="490" h="50" m="2" /><box x="-3430" y="740" w="40" h="170" m="2" /><box x="-3250" y="740" w="30" h="170" m="2" /><box x="-3100" y="700" w="40" h="210" m="2" /><box x="-3870" y="400" w="370" h="250" m="1" /><box x="-4060" y="500" w="240" h="50" m="2" /><box x="-3990" y="520" w="90" h="60" m="2" /><door uid="#door*1" x="670" y="220" w="90" h="330" moving="false" tarx="0" tary="0" maxspeed="4" vis="true" /><door uid="#door*2" x="-3010" y="120" w="140" h="100" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><door uid="#door*3" x="-3720" y="360" w="90" h="60" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><door uid="#door*6" x="-2980" y="90" w="120" h="130" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><door uid="#door*4" x="-3000" y="100" w="140" h="100" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><door uid="#door*7" x="-3700" y="340" w="100" h="60" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><door uid="#door*11" x="-3520" y="200" w="120" h="130" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><door uid="#door*5" x="-3540" y="210" w="140" h="100" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><door uid="#door" x="-3550" y="230" w="140" h="100" moving="false" tarx="0" tary="0" maxspeed="1" vis="false" /><decor uid="#decor*1" model="stone" at="-1" x="-2950" y="140" addx="0" addy="0" /><decor uid="#decor*2" model="stone2" at="-1" x="-3680" y="370" addx="0" addy="0" /><decor uid="#decor" model="stone" at="-1" x="-3490" y="250" addx="0" addy="0" /><gun uid="#gun*1" x="-270" y="290" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*2" x="-270" y="310" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*4" x="-270" y="300" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*8" x="-270" y="270" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*14" x="-270" y="320" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*16" x="-270" y="280" model="gun_rl" command="-1" upg="0" /><gun uid="#gun*3" x="-200" y="290" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*6" x="-200" y="310" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*5" x="-200" y="300" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*9" x="-200" y="270" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*15" x="-200" y="320" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*17" x="-200" y="280" model="gun_rl" command="-1" upg="0" /><gun uid="#gun*19" x="-130" y="290" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*7" x="-130" y="310" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*10" x="-130" y="300" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*11" x="-130" y="270" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*18" x="-130" y="320" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*20" x="-130" y="280" model="gun_rl" command="-1" upg="0" /><gun uid="#gun*23" x="-30" y="290" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*21" x="-30" y="310" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*13" x="-30" y="300" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*12" x="-30" y="270" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*22" x="-30" y="320" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*25" x="-30" y="280" model="gun_rl" command="-1" upg="0" /><gun uid="#gun*27" x="-5130" y="660" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*28" x="-5130" y="680" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*26" x="-5130" y="670" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*37" x="-5130" y="640" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*24" x="-5130" y="690" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*30" x="-5130" y="650" model="gun_rl" command="-1" upg="0" /><gun uid="#gun*32" x="-5060" y="660" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*31" x="-5060" y="680" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*29" x="-5060" y="670" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*39" x="-5060" y="640" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*33" x="-5060" y="690" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*36" x="-5060" y="650" model="gun_rl" command="-1" upg="0" /><gun uid="#gun*34" x="-4950" y="580" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*38" x="-4950" y="600" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*45" x="-4950" y="590" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*42" x="-4950" y="560" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*41" x="-4950" y="610" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*44" x="-4950" y="570" model="gun_rl" command="-1" upg="0" /><gun uid="#gun*35" x="-4880" y="580" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*40" x="-4880" y="600" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*46" x="-4880" y="590" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*51" x="-4880" y="560" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*48" x="-4880" y="610" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun*47" x="-4880" y="570" model="gun_rl" command="-1" upg="0" /><gun uid="#gun43*1" x="-850" y="-120" model="gun_arifle2" command="-1" upg="0" /><gun uid="#gun43*2" x="-1790" y="490" model="gun_arifle2" command="-1" upg="0" /><gun uid="#gun43*3" x="-3140" y="400" model="gun_arifle2" command="-1" upg="0" /><gun uid="#gun43*4" x="-2490" y="-170" model="gun_real_rifle" command="-1" upg="0" /><gun uid="#gun43*5" x="-1870" y="-170" model="gun_real_rifle" command="-1" upg="0" /><gun uid="#gun43*6" x="-2040" y="90" model="gun_pistol2" command="-1" upg="0" /><gun uid="#gun43*7" x="-2240" y="790" model="gun_arifle" command="-1" upg="0" /><gun uid="#gun43*8" x="-3170" y="790" model="gun_apistol" command="-1" upg="0" /><gun uid="#gun43*9" x="250" y="40" model="gun_apistol" command="-1" upg="0" /><gun uid="#gun43*10" x="-1350" y="-10" model="gun_rl" command="-1" upg="0" /><gun uid="#gun43*11" x="-3790" y="390" model="gun_rl" command="-1" upg="0" /><gun uid="#gun43*12" x="-4500" y="390" model="gun_apistol" command="-1" upg="0" /><gun uid="#gun43*15" x="-3800" y="790" model="gun_apistol" command="-1" upg="0" /><lamp uid="#light*1" x="-1500" y="-300" power="1" flare="0" /><lamp uid="#light*2" x="-2800" y="-200" power="1" flare="0" /><lamp uid="#light*3" x="360" y="0" power="1" flare="0" /><lamp uid="#light*4" x="-4260" y="260" power="0.5" flare="0" /><lamp uid="#light*6" x="-4770" y="300" power="0.3" flare="0" /><lamp uid="#light*5" x="-5040" y="300" power="0.3" flare="0" /><lamp uid="#light*8" x="-3990" y="260" power="0.5" flare="0" /><lamp uid="#light*9" x="-3100" y="510" power="0.4" flare="1" /><lamp uid="#light*7" x="-1050" y="-300" power="1" flare="0" /><lamp uid="#light*12" x="-590" y="-300" power="1" flare="0" /><lamp uid="#light*11" x="-2300" y="-500" power="1" flare="0" /><lamp uid="#light*14" x="-2070" y="-500" power="1" flare="0" /><lamp uid="#light*17" x="550" y="220" power="0.4" flare="1" /><lamp uid="#light*13" x="-3100" y="100" power="1" flare="0" /><lamp uid="#light*15" x="-200" y="130" power="0.4" flare="1" /><lamp uid="#light*22" x="-1680" y="340" power="0.4" flare="1" /><lamp uid="#light*24" x="-1940" y="380" power="0.4" flare="1" /><lamp uid="#light*18" x="-2530" y="380" power="0.4" flare="1" /><lamp uid="#light" x="-2510" y="640" power="0.4" flare="1" />`],
			
			// dm0
			[ 3, Infinity, `<player uid="#player" x="600" y="-210" tox="0" toy="0" hea="150" hmax="150" team="1" side="-1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="-600" y="-210" tox="0" toy="0" hea="150" hmax="150" team="2" side="1" char="8" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="540" y="-210" tox="0" toy="0" hea="150" hmax="150" team="1" side="-1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="-540" y="-210" tox="0" toy="0" hea="150" hmax="150" team="2" side="1" char="8" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="820" y="-500" tox="0" toy="0" hea="150" hmax="150" team="1" side="-1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="-820" y="-500" tox="0" toy="0" hea="150" hmax="150" team="2" side="1" char="8" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="770" y="-409" tox="0" toy="0" hea="150" hmax="150" team="1" side="-1" char="2" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="-760" y="-409" tox="0" toy="0" hea="150" hmax="150" team="2" side="1" char="8" incar="-1" botaction="0" ondeath="-1" /><pushf uid="#pushf" x="1300" y="-2300" w="500" h="1400" tox="-2" toy="0" stab="100" damage="0" /><pushf uid="#pushf" x="-1800" y="-2300" w="500" h="1400" tox="2" toy="0" stab="100" damage="0" /><pushf uid="#pushf" x="-900" y="380" w="100" h="60" tox="1" toy="-1" stab="0" damage="0" /><pushf uid="#pushf" x="-900" y="-230" w="100" h="40" tox="1" toy="-1" stab="0" damage="0" /><pushf uid="#pushf" x="800" y="-230" w="100" h="40" tox="-1" toy="-1" stab="0" damage="0" /><pushf uid="#pushf" x="800" y="380" w="100" h="60" tox="-1" toy="-1" stab="0" damage="0" /><pushf uid="#pushf" x="40" y="-220" w="20" h="160" tox="-1" toy="1" stab="0" damage="0" /><pushf uid="#pushf" x="-1800" y="-2300" w="3600" h="500" tox="0" toy="2" stab="100" damage="0" /><pushf uid="#pushf" x="-60" y="-220" w="20" h="160" tox="1" toy="1" stab="0" damage="0" /><pushf uid="#pushf" x="-300" y="570" w="600" h="10" tox="0" toy="0" stab="100" damage="-1000" /><bg x="-1200" y="-880" w="2400" h="1930" m="0" /><bg x="-1200" y="-900" w="2400" h="20" m="1" /><water x="-200" y="810" w="130" h="40" damage="6" /><water x="-580" y="-20" w="140" h="100" damage="0" /><water x="440" y="-20" w="140" h="100" damage="0" /><water x="-440" y="10" w="880" h="70" damage="0" /><water x="-220" y="-20" w="440" h="30" damage="0" /><water x="70" y="810" w="130" h="40" damage="6" /><box x="-400" y="540" w="100" h="130" m="0" /><box x="-800" y="400" w="300" h="250" m="0" /><box x="500" y="400" w="300" h="250" m="0" /><box x="-600" y="80" w="1200" h="40" m="0" /><box x="-1000" y="-190" w="260" h="440" m="0" /><box x="-440" y="-60" w="220" h="70" m="0" /><box x="220" y="-60" w="220" h="70" m="true" /><box x="-100" y="520" w="200" h="40" m="0" /><box x="-40" y="500" w="80" h="60" m="0" /><box x="-160" y="270" w="50" h="30" m="0" /><box x="110" y="270" w="50" h="30" m="0" /><box x="-800" y="-210" w="220" h="480" m="0" /><box x="-620" y="-210" w="100" h="70" m="0" /><box x="520" y="-210" w="100" h="70" m="0" /><box x="580" y="-210" w="220" h="480" m="0" /><box x="-140" y="-260" w="280" h="40" m="0" /><box x="740" y="-190" w="260" h="440" m="0" /><box x="-230" y="520" w="70" h="40" m="true" /><box x="160" y="520" w="70" h="40" m="0" /><box x="-160" y="-290" w="30" h="100" m="0" /><box x="130" y="-290" w="30" h="100" m="0" /><box x="-360" y="420" w="50" h="30" m="0" /><box x="310" y="420" w="50" h="30" m="0" /><box x="310" y="240" w="140" h="40" m="0" /><box x="-450" y="240" w="140" h="40" m="0" /><box x="-140" y="250" w="280" h="30" m="0" /><box x="-1800" y="-700" w="900" h="2000" m="0" /><box x="900" y="-700" w="900" h="2000" m="0" /><box x="-100" y="-230" w="40" h="200" m="0" /><box x="60" y="-230" w="40" h="200" m="0" /><box x="-400" y="-300" w="100" h="80" m="0" /><box x="300" y="-300" w="100" h="80" m="0" /><box x="-80" y="-60" w="40" h="30" m="0" /><box x="40" y="-60" w="40" h="30" m="0" /><box x="-800" y="-410" w="60" h="60" m="0" /><box x="-630" y="-440" w="90" h="100" m="0" /><box x="740" y="-410" w="60" h="60" m="0" /><box x="540" y="-430" w="90" h="90" m="true" /><box x="-160" y="-530" w="50" h="60" m="0" /><box x="110" y="-530" w="50" h="60" m="0" /><box x="-140" y="-540" w="280" h="40" m="0" /><box x="780" y="-500" w="140" h="140" m="0" /><box x="-920" y="-500" w="140" h="140" m="0" /><box x="300" y="540" w="100" h="130" m="0" /><box x="-400" y="-460" w="100" h="40" m="0" /><box x="300" y="-460" w="100" h="40" m="0" /><box x="520" y="-450" w="30" h="110" m="true" /><box x="-550" y="-460" w="30" h="120" m="0" /><box x="-1000" y="420" w="250" h="480" m="0" /><box x="750" y="420" w="250" h="480" m="0" /><box x="-300" y="-670" w="170" h="50" m="0" /><box x="130" y="-670" w="170" h="50" m="0" /><box x="-310" y="-110" w="70" h="80" m="0" /><box x="240" y="-110" w="70" h="80" m="true" /><box x="-420" y="-700" w="60" h="50" m="0" /><box x="360" y="-700" w="60" h="50" m="0" /><box x="-40" y="-740" w="80" h="50" m="0" /><box x="-100" y="-580" w="50" h="80" m="0" /><box x="50" y="-580" w="50" h="80" m="0" /><box x="-660" y="-800" w="60" h="50" m="0" /><box x="600" y="-800" w="60" h="50" m="true" /><box x="-1800" y="-900" w="700" h="300" m="1" /><box x="1100" y="-900" w="700" h="300" m="1" /><box x="-730" y="-250" w="70" h="60" m="0" /><box x="660" y="-250" w="70" h="60" m="0" /><box x="620" y="-230" w="70" h="40" m="0" /><box x="-690" y="-230" w="70" h="40" m="0" /><box x="-30" y="370" w="60" h="20" m="true" /><box x="-140" y="280" w="10" h="80" m="0" /><box x="-150" y="350" w="30" h="30" m="0" /><box x="130" y="280" w="10" h="80" m="0" /><box x="120" y="350" w="30" h="30" m="0" /><box x="-150" y="-810" w="60" h="30" m="0" /><box x="90" y="-810" w="60" h="30" m="0" /><box x="-1000" y="800" w="800" h="500" m="0" /><box x="200" y="800" w="800" h="500" m="0" /><box x="-300" y="850" w="600" h="450" m="0" /><box x="450" y="410" w="70" h="50" m="0" /><box x="-520" y="410" w="70" h="50" m="0" /><box x="-40" y="-290" w="80" h="70" m="0" /><box x="-50" y="-270" w="100" h="50" m="0" /><box x="120" y="-270" w="30" h="40" m="0" /><box x="-150" y="-270" w="30" h="40" m="0" /><box x="-640" y="-770" w="20" h="70" m="0" /><box x="620" y="-770" w="20" h="70" m="0" /><box x="130" y="-890" w="30" h="130" m="0" /><box x="-160" y="-890" w="30" h="130" m="0" /><box x="-620" y="750" w="40" h="150" m="0" /><box x="580" y="750" w="40" h="150" m="0" /><box x="240" y="770" w="360" h="130" m="0" /><box x="-600" y="770" w="360" h="130" m="0" /><box x="-10" y="550" w="20" h="40" m="0" /><box x="-70" y="750" w="140" h="150" m="0" /><decor uid="#decor" model="teleport2" at="-1" x="0" y="-210" addx="0" addy="0" /><decor uid="#decor" model="teleport" at="-1" x="-850" y="410" addx="0" addy="0" /><decor uid="#decor" model="teleport2" at="-1" x="-850" y="260" addx="0" addy="0" /><decor uid="#decor" model="teleport2" at="-1" x="-380" y="130" addx="0" addy="0" /><decor uid="#decor" model="teleport" at="-1" x="-380" y="230" addx="0" addy="0" /><decor uid="#decor" model="teleport2" at="-1" x="380" y="130" addx="0" addy="0" /><decor uid="#decor" model="teleport" at="-1" x="380" y="230" addx="0" addy="0" /><decor uid="#decor" model="teleport2" at="-1" x="850" y="260" addx="0" addy="0" /><decor uid="#decor" model="teleport" at="-1" x="850" y="410" addx="0" addy="0" /><decor uid="#decor" model="teleport2" at="-1" x="-850" y="-350" addx="0" addy="0" /><decor uid="#decor" model="teleport" at="-1" x="-850" y="-200" addx="0" addy="0" /><decor uid="#decor" model="teleport2" at="-1" x="850" y="-350" addx="0" addy="0" /><decor uid="#decor" model="teleport" at="-1" x="850" y="-200" addx="0" addy="0" /><decor uid="#decor" model="teleport" at="-1" x="0" y="-750" addx="0" addy="0" /><decor uid="#decor" model="ray_left" at="-1" x="-300" y="570" addx="0" addy="0" /><decor uid="#decor" model="ray_right" at="-1" x="300" y="570" addx="0" addy="0" /><decor uid="#decor" model="ray_left" at="-1" x="10" y="570" addx="0" addy="0" /><decor uid="#decor" model="ray_right" at="-1" x="-10" y="570" addx="0" addy="0" /><gun uid="#gun" x="-640" y="390" model="gun_rl" command="-1" upg="0" /><gun uid="#gun" x="-50" y="240" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun" x="-350" y="-310" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun" x="-570" y="-450" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun" x="-630" y="-810" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun" x="0" y="360" model="gun_bfg" command="-1" upg="0" /><gun uid="#gun" x="-30" y="-550" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun" x="-80" y="-270" model="gun_railgun2" command="-1" upg="0" /><gun uid="#gun" x="-540" y="-260" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun" x="-820" y="-550" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun" x="820" y="-550" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun" x="540" y="-260" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun" x="600" y="-260" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun" x="-600" y="-260" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun" x="390" y="-710" model="gun_gl" command="-1" upg="0" /><gun uid="#gun" x="-390" y="-710" model="gun_gl" command="-1" upg="0" /><gun uid="#gun" x="0" y="490" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun" x="350" y="-310" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun" x="590" y="-440" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun" x="630" y="-810" model="gun_raygun" command="-1" upg="0" /><gun uid="#gun" x="630" y="390" model="gun_rl" command="-1" upg="0" /><gun uid="#gun" x="-760" y="-460" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun" x="760" y="-460" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*1" x="-760" y="-450" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*2" x="-820" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*3" x="-540" y="-250" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*5" x="820" y="-540" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*4" x="760" y="-450" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*7" x="540" y="-250" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*8" x="600" y="-250" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*9" x="-600" y="-250" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*10" x="80" y="-270" model="gun_railgun2" command="-1" upg="0" /><gun uid="#gun*14" x="30" y="-550" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*12" x="170" y="-680" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*13" x="-170" y="-680" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*6" x="350" y="-470" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*11" x="-350" y="-470" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*16" x="-1050" y="-710" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*19" x="1050" y="-710" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*17" x="50" y="240" model="gun_railgun" command="-1" upg="0" /><lamp uid="#light" x="-1000" y="-1000" power="1" flare="0" /><lamp uid="#light" x="-300" y="-1100" power="1" flare="0" /><lamp uid="#light" x="0" y="-1200" power="2" flare="0" /><lamp uid="#light" x="-100" y="130" power="0.2" flare="1" /><lamp uid="#light" x="100" y="130" power="0.2" flare="1" /><lamp uid="#light" x="-300" y="430" power="0.2" flare="1" /><lamp uid="#light" x="300" y="430" power="0.2" flare="1" /><lamp uid="#light" x="-850" y="-350" power="0.2" flare="1" /><lamp uid="#light" x="-850" y="-200" power="0.2" flare="1" /><lamp uid="#light" x="-850" y="260" power="0.2" flare="1" /><lamp uid="#light" x="-850" y="410" power="0.2" flare="1" /><lamp uid="#light" x="850" y="-350" power="0.2" flare="1" /><lamp uid="#light" x="850" y="-200" power="0.2" flare="1" /><lamp uid="#light" x="850" y="260" power="0.2" flare="1" /><lamp uid="#light" x="850" y="410" power="0.2" flare="1" /><lamp uid="#light" x="0" y="-210" power="0.4" flare="1" /><lamp uid="#light" x="0" y="-750" power="0.2" flare="1" /><lamp uid="#light" x="-380" y="130" power="0.4" flare="1" /><lamp uid="#light" x="-380" y="230" power="0.4" flare="1" /><lamp uid="#light" x="380" y="230" power="0.4" flare="1" /><lamp uid="#light" x="380" y="130" power="0.4" flare="1" /><lamp uid="#light" x="-600" y="-1100" power="1" flare="0" /><lamp uid="#light" x="300" y="-1100" power="1" flare="0" /><lamp uid="#light" x="600" y="-1100" power="1" flare="0" /><lamp uid="#light" x="1000" y="-1000" power="1" flare="0" /><lamp uid="#light" x="0" y="-490" power="0.4" flare="1" /><lamp uid="#light" x="-290" y="570" power="0.2" flare="0" /><lamp uid="#light" x="290" y="570" power="0.2" flare="0" /><lamp uid="#light" x="-20" y="570" power="0.2" flare="0" /><lamp uid="#light" x="20" y="570" power="0.2" flare="0" /><region uid="#region" x="-900" y="230" w="100" h="210" use_target="2" use_on="6" /><region uid="#region" x="-900" y="-380" w="100" h="210" use_target="3" use_on="6" /><region uid="#region" x="760" y="280" w="30" h="110" use_target="-1" use_on="0" /><region uid="#region" x="760" y="-330" w="30" h="110" use_target="-1" use_on="0" /><region uid="#region" x="-790" y="-330" w="30" h="110" use_target="-1" use_on="0" /><region uid="#region" x="-790" y="280" w="30" h="110" use_target="-1" use_on="0" /><region uid="#region" x="-40" y="-190" w="80" h="160" use_target="4" use_on="6" /><region uid="#region" x="-20" y="-820" w="40" h="60" use_target="-1" use_on="4" /><region uid="#region" x="800" y="-380" w="100" h="210" use_target="1" use_on="6" /><region uid="#region" x="-430" y="130" w="50" h="120" use_target="5" use_on="4" /><region uid="#region" x="380" y="130" w="50" h="120" use_target="6" use_on="4" /><region uid="#region" x="-490" y="130" w="40" h="100" use_target="-1" use_on="4" /><region uid="#region" x="450" y="130" w="40" h="100" use_target="-1" use_on="4" /><region uid="#region" x="800" y="230" w="100" h="180" use_target="0" use_on="6" /><region uid="#region" x="-380" y="130" w="50" h="120" use_target="8" use_on="4" /><region uid="#region" x="330" y="130" w="50" h="120" use_target="7" use_on="4" /><region uid="#region" x="-310" y="130" w="40" h="100" use_target="-1" use_on="4" /><region uid="#region" x="270" y="130" w="40" h="100" use_target="-1" use_on="4" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="13" actions_1_targetB="4" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="8" actions_1_targetB="5" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="0" actions_1_targetB="3" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="1" actions_1_targetB="2" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="6" actions_1_targetB="7" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="9" actions_1_targetB="12" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="10" actions_1_targetB="11" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="15" actions_1_targetB="16" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><trigger uid="#trigger" x="0" y="0" enabled="true" maxcalls="-1" actions_1_type="30" actions_1_targetA="14" actions_1_targetB="17" actions_2_type="-1" actions_2_targetA="0" actions_2_targetB="0" actions_3_type="-1" actions_3_targetA="0" actions_3_targetB="0" actions_4_type="-1" actions_4_targetA="0" actions_4_targetB="0" actions_5_type="-1" actions_5_targetA="0" actions_5_targetB="0" actions_6_type="-1" actions_6_targetA="0" actions_6_targetB="0" actions_7_type="-1" actions_7_targetA="0" actions_7_targetB="0" actions_8_type="-1" actions_8_targetA="0" actions_8_targetB="0" actions_9_type="-1" actions_9_targetA="0" actions_9_targetB="0" actions_10_type="-1" actions_10_targetA="0" actions_10_targetB="0" /><inf x="-1240" y="-1780" mark="port_nades_count" forteam="2" /><inf x="-1200" y="-1780" mark="he_nades_count" forteam="2" />`],
			
			// high
			[ 4, Infinity, `<player uid="#player*2" x="2280" y="421" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*1" x="-120" y="-99" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*4" x="2350" y="421" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*3" x="-50" y="-99" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*5" x="2420" y="421" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*7" x="20" y="-99" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><player uid="#player" x="2490" y="421" tox="0" toy="0" hea="130" hmax="130" team="12" side="-1" char="74" incar="-1" botaction="0" ondeath="-1" /><player uid="#player*6" x="90" y="-99" tox="0" toy="0" hea="130" hmax="130" team="13" side="1" char="73" incar="-1" botaction="0" ondeath="-1" /><pushf uid="#pushf*1" x="-1800" y="700" w="7780" h="700" tox="0" toy="0" stab="0" damage="1000" /><pushf uid="#pushf" x="2030" y="200" w="120" h="260" tox="0" toy="-1" stab="0" damage="0" /><bg x="300" y="-180" w="530" h="680" m="0" /><bg x="1340" y="-300" w="460" h="900" m="0" /><bg x="1800" y="-570" w="320" h="1170" m="0" /><bg x="300" y="-230" w="500" h="50" m="0" /><bg x="0" y="-90" w="300" h="490" m="0" /><bg x="830" y="-150" w="510" h="750" m="0" /><bg x="1470" y="-520" w="60" h="220" m="4" /><bg x="2120" y="-140" w="680" h="740" m="0" /><bg x="2800" y="120" w="260" h="480" m="0" /><bg x="3590" y="-30" w="160" h="130" m="4" /><bg x="1530" y="-570" w="270" h="270" m="0" /><bg x="2120" y="-410" w="590" h="270" m="0" /><box x="310" y="60" w="90" h="80" m="0" /><box x="670" y="0" w="830" h="170" m="0" /><box x="300" y="-230" w="500" h="70" m="0" /><box x="330" y="-300" w="70" h="120" m="0" /><box x="900" y="-30" w="400" h="80" m="0" /><box x="-100" y="-100" w="300" h="150" m="0" /><box x="130" y="-50" w="140" h="100" m="0" /><box x="1100" y="-170" w="100" h="220" m="0" /><box x="1380" y="-330" w="220" h="60" m="0" /><box x="1340" y="-300" w="460" h="60" m="0" /><box x="1460" y="-260" w="80" h="130" m="0" /><box x="1500" y="400" w="200" h="1000" m="0" /><box x="2020" y="-200" w="300" h="150" m="0" /><box x="1900" y="-130" w="130" h="40" m="0" /><box x="760" y="-180" w="70" h="60" m="0" /><box x="1670" y="-30" w="130" h="120" m="0" /><box x="-200" y="-150" w="30" h="90" m="0" /><box x="1460" y="-590" w="80" h="80" m="0" /><box x="3360" y="50" w="480" h="1350" m="0" /><box x="3580" y="-100" w="160" h="130" m="0" /><box x="2540" y="-160" w="280" h="80" m="0" /><box x="530" y="120" w="210" h="50" m="0" /><box x="3060" y="0" w="30" h="90" m="0" /><box x="3350" y="0" w="30" h="90" m="0" /><box x="2200" y="-240" w="540" h="140" m="0" /><box x="2700" y="50" w="380" h="150" m="0" /><box x="1740" y="50" w="300" h="50" m="0" /><box x="2440" y="170" w="110" h="30" m="0" /><box x="2400" y="120" w="70" h="140" m="0" /><box x="2150" y="200" w="80" h="300" m="0" /><box x="1150" y="50" w="750" h="150" m="0" /><box x="2600" y="-200" w="180" h="90" m="0" /><box x="2500" y="-420" w="200" h="40" m="0" /><box x="2200" y="-420" w="200" h="40" m="0" /><box x="2170" y="-430" w="80" h="80" m="0" /><box x="2650" y="-430" w="80" h="80" m="0" /><box x="1510" y="-580" w="240" h="40" m="0" /><box x="1850" y="-580" w="240" h="40" m="0" /><box x="2060" y="-590" w="80" h="80" m="0" /><box x="1320" y="-590" w="80" h="80" m="0" /><box x="1330" y="-650" w="20" h="80" m="0" /><box x="2110" y="-650" w="20" h="80" m="0" /><box x="2700" y="-490" w="20" h="80" m="0" /><box x="2120" y="-580" w="80" h="20" m="0" /><box x="550" y="-260" w="220" h="60" m="0" /><box x="3130" y="340" w="40" h="20" m="0" /><box x="3230" y="240" w="40" h="20" m="0" /><box x="2660" y="340" w="240" h="160" m="0" /><box x="2600" y="370" w="180" h="130" m="0" /><box x="2440" y="230" w="150" h="30" m="0" /><box x="2440" y="100" w="60" h="160" m="0" /><box x="300" y="300" w="300" h="1100" m="0" /><box x="500" y="360" w="300" h="1040" m="0" /><box x="700" y="470" w="900" h="930" m="0" /><box x="1100" y="80" w="100" h="220" m="0" /><box x="0" y="330" w="400" h="1070" m="0" /><box x="-190" y="-100" w="290" h="1500" m="0" /><box x="500" y="330" w="200" h="150" m="0" /><box x="700" y="390" w="200" h="210" m="0" /><box x="1600" y="500" w="300" h="900" m="0" /><box x="2630" y="400" w="450" h="1000" m="0" /><box x="1800" y="460" w="430" h="940" m="0" /><box x="2180" y="420" w="500" h="980" m="0" /><box x="1740" y="50" w="240" h="100" m="0" /><box x="2000" y="-200" w="40" h="180" m="0" /><box x="2200" y="210" w="220" h="30" m="0" /><box x="3130" y="140" w="40" h="20" m="0" /><box x="3830" y="10" w="30" h="90" m="0" /><box x="3710" y="-180" w="50" h="210" m="0" /><box x="1900" y="400" w="130" h="140" m="0" /><box x="1700" y="150" w="100" h="120" m="0" /><box x="1400" y="150" w="100" h="120" m="0" /><box x="1300" y="440" w="100" h="120" m="0" /><box x="610" y="60" w="100" h="90" m="0" /><box x="1070" y="140" w="220" h="80" m="0" /><box x="1310" y="190" w="280" h="30" m="0" /><box x="1610" y="190" w="120" h="30" m="0" /><box x="0" y="0" w="350" h="100" m="0" /><box x="2610" y="50" w="140" h="50" m="0" /><box x="380" y="120" w="50" h="50" m="0" /><door uid="#door*1" x="1470" y="-520" w="60" h="200" moving="false" tarx="0" tary="0" maxspeed="5" vis="true" /><door uid="#door*2" x="2010" y="-10" w="20" h="20" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door*3" x="2010" y="20" w="20" h="20" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door*6" x="3140" y="350" w="10" h="80" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door*4" x="3070" y="420" w="80" h="10" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door*5" x="3140" y="150" w="10" h="30" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door*7" x="3070" y="170" w="80" h="10" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door*12" x="3240" y="250" w="10" h="30" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door*8" x="3240" y="270" w="130" h="10" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><door uid="#door" x="2900" y="-30" w="80" h="120" moving="false" tarx="0" tary="0" maxspeed="1" vis="true" /><decor uid="#decor" model="antigravity" at="-1" x="2090" y="460" addx="0" addy="0" /><gun uid="#gun*1" x="-120" y="-130" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*2" x="-50" y="-130" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*4" x="20" y="-130" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*3" x="90" y="-130" model="gun_rifle" command="-1" upg="0" /><gun uid="#gun*6" x="-120" y="-120" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*7" x="-50" y="-120" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*11" x="20" y="-120" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*8" x="90" y="-120" model="gun_pistol" command="-1" upg="0" /><gun uid="#gun*10" x="2280" y="390" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*5" x="2280" y="400" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*14" x="2350" y="390" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*12" x="2420" y="390" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*16" x="2490" y="390" model="gun_rifle_b" command="-1" upg="0" /><gun uid="#gun*13" x="2350" y="400" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*9" x="2420" y="400" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*15" x="2490" y="400" model="gun_pistol_b" command="-1" upg="0" /><gun uid="#gun*20" x="-120" y="-110" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*19" x="-50" y="-110" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*23" x="20" y="-110" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*18" x="90" y="-110" model="gun_shotgun_b" command="-1" upg="0" /><gun uid="#gun*27" x="2280" y="410" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*22" x="2350" y="410" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*21" x="2420" y="410" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*33" x="2490" y="410" model="gun_shotgun" command="-1" upg="0" /><gun uid="#gun*26" x="2280" y="370" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*24" x="2350" y="370" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*25" x="2420" y="370" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*31" x="2490" y="370" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*34" x="2280" y="360" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*17" x="2350" y="360" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*28" x="2420" y="360" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*36" x="2490" y="360" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*35" x="-120" y="-150" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*45" x="-120" y="-160" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*38" x="-50" y="-150" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*42" x="20" y="-150" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*29" x="90" y="-150" model="gun_plasmagun" command="-1" upg="0" /><gun uid="#gun*43" x="-50" y="-160" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*40" x="20" y="-160" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*32" x="90" y="-160" model="gun_railgun" command="-1" upg="0" /><gun uid="#gun*49" x="-120" y="-140" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*37" x="-50" y="-140" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*47" x="20" y="-140" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*52" x="90" y="-140" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*46" x="2280" y="380" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*63" x="2350" y="380" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun*44" x="2420" y="380" model="gun_defibrillator" command="-1" upg="0" /><gun uid="#gun" x="2490" y="380" model="gun_defibrillator" command="-1" upg="0" /><lamp uid="#light*24" x="2090" y="450" power="0.4" flare="0" /><lamp uid="#light*22" x="1600" y="210" power="0.4" flare="1" /><lamp uid="#light*11" x="1300" y="210" power="0.4" flare="1" /><lamp uid="#light*14" x="200" y="110" power="0.4" flare="1" /><lamp uid="#light*30" x="3200" y="200" power="1" flare="0" /><lamp uid="#light" x="3200" y="300" power="1" flare="0" /><inf x="-250" y="-330" mark="sky" forteam="2" /><inf x="-170" y="-330" mark="he_nades_count" forteam="2" /><inf x="-130" y="-330" mark="port_nades_count" forteam="2" />`]
		];
		
		sdShop.options = [];
		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, _category:'root' });
		sdShop.options.push({ _class: 'sdBlock', width: 16, height: 16, material:sdBlock.MATERIAL_SHARP, _category:'root' });
		sdShop.options.push({ _class: 'sdVirus', _spawn_with_full_hp: true, _category:'root' });
		sdShop.options.push({ _class: 'sdOctopus', _spawn_with_full_hp: true, _category:'root' });
		sdShop.options.push({ _class: 'sdCrystal', _spawn_with_full_hp: true, _category:'root' });
		sdShop.options.push({ _class: 'sdBomb', _category:'root' });
		sdShop.options.push({ _class: 'sdGun', _spawn_with_full_hp: true, class: sdGun.CLASS_PISTOL, _category:'root' });
		sdShop.options.push({ _class: 'sdWater', type:2, _category:'root' }); // Lava
		
		
		let instructor_settings = {"hero_name":"Instructor","color_bright":"#7aadff","color_dark":"#25668e","color_bright3":"#7aadff","color_dark3":"#25668e","color_visor":"#ffffff","color_suit":"#000000","color_shoes":"#303954","color_skin":"#51709a","voice1":true,"voice2":false,"voice3":false,"voice4":false,"voice5":false,"color_suit2":"#000000","color_dark2":"#25668e"};

				
		sdShop.options.push({ _class: 'sdCharacter', 
			_ai_enabled: sdCharacter.AI_MODEL_FALKOK, 
			_ai_gun_slot: 1,
			_ai_level: 10,
			sd_filter:sdWorld.ConvertPlayerDescriptionToSDFilter_v2( instructor_settings ), 
			_voice:sdWorld.ConvertPlayerDescriptionToVoice( instructor_settings ), 
			title:instructor_settings.hero_name, 
			_spawn_with_full_hp: true,
			_category:'root' });
		sdShop.options.push({ _class: null, matter_cost: 30, upgrade_name: 'upgrade_jetpack', _category:'root' });
		sdShop.options.push({ _class: null, matter_cost: 30, upgrade_name: 'upgrade_invisibility', _category:'root' });
			
		sdBlock.prototype.MeasureMatterCost = ()=>{ return 10; };
		sdVirus.prototype.MeasureMatterCost = ()=>{ return 10; };
		sdOctopus.prototype.MeasureMatterCost = ()=>{ return 75; };
		sdCrystal.prototype.MeasureMatterCost = ()=>{ return 75; };
		sdBomb.prototype.MeasureMatterCost = ()=>{ return 50; };
		sdWater.prototype.MeasureMatterCost = ()=>{ return 10; };
		sdCharacter.prototype.MeasureMatterCost = ()=>{ return 30; };
		sdGun.prototype.MeasureMatterCost = ()=>{ return 10; };
		
		sdBomb.prototype.Damage = function Damage( dmg, initiator=null )
		{
			if ( !sdWorld.is_server )
			return;
		
			//debugger;

			//let old_hp = this.hea;

			//this.hea -= dmg;
			
			//this.detonation_in = 0;

			//if ( this.hea <= 0 )
			//if ( old_hp > 0 )
			//{
				if ( this.detonation_in > 30 )
				this.detonation_in = 30;
			//}
		};
		
		sdWorld.map_current = 0;
		
		sdWorld.tracked_creatures = [];
				
		sdWorld.push_fields = [];
		sdGun.disowned_guns_ttl = 30 * 20;
		
		sdWorld.game_started = false;
		sdWorld.scoring_allowed = false;
		
		sdWorld.score_by_hash = {
			// Score will be kept here rather than on sdCharacter or socket which can reconnect
		};
		
		/*for ( let i = 0; i < sdGun.classes.length; i++ )
		{
			if ( sdGun.classes[ i ].projectile_properties._admin_picker )
			{
				if ( sdGun.classes[ i ].matter_cost === Infinity )
				sdGun.classes[ i ].matter_cost = 100;
			
				sdGun.classes[ i ].reload_time = Math.max( sdGun.classes[ i ].reload_time, 30 );
				
				
				if ( sdGun.classes[ i ].onShootAttempt )
				sdGun.classes[ i ].onShootAttempt = eval( sdGun.classes[ i ].onShootAttempt.toString().split( '_god' ).join( '_god || true' ) );
				
				if ( sdGun.classes[ i ].projectile_properties._custom_target_reaction )
				sdGun.classes[ i ].projectile_properties._custom_target_reaction = eval( sdGun.classes[ i ].projectile_properties._custom_target_reaction.toString().split( '_god' ).join( '_god || true' ) );
			}
			else
			{
				sdGun.classes.splice( i, 1 );
				i--;
				continue;
			}
		}*/
		
		let match_starting_in = -1;
		
		//let time_left = 60 * 5;
		
		let time_left = -1;
		let winner_msg = '?';
		
		let sudden_victory = -1; // if everone left it becomes 7
		
		setInterval( ()=>
		{
			let players_tot = sdWorld.GetPlayingPlayersCount( true );
				
			if ( sdWorld.game_started )
			{
				if ( time_left > 0 )
				{
					let m = ( Math.floor( time_left / 60 ) ) + '';
					let s = ( time_left % 60 ) + '';
					
					if ( s.length < 2 )
					s = '0' + s;
					
					if ( players_tot > 1 )
					{
						sdServerConfig.Announce( m + ':' + s, time_left > 5 ? -1 : 0 );
						sudden_victory = -1;
					}
					else
					{
						if ( sudden_victory === -1 )
						sudden_victory = 15;

						sudden_victory--;
						
						if ( sudden_victory <= 1 )
						{
							if ( sdWorld.leaders.length > 0 && sdWorld.leaders[ 0 ].score === 0 )
							sdServerConfig.Announce( 'O_o ?' );
							else
							if ( sdWorld.leaders.length > 0 && sdWorld.leaders[ 0 ].score <= 3 )
							sdServerConfig.Announce( 'That was quick!' );
							else
							sdServerConfig.Announce( 'That was harsh!' );
						}
						else
						{
							sdServerConfig.Announce( 'Waiting for a few seconds...' );
						}
						
						if ( sudden_victory === 0 )
						{
							time_left = Math.min( time_left, 1 );
						}

					}
				}
				else
				{
					sdWorld.scoring_allowed = false;
					if ( time_left === 0 )
					{
						if ( sdWorld.leaders.length === 1 )
						winner_msg = 'Match canceled...';
						else
						if ( sdWorld.leaders.length > 1 && sdWorld.leaders[ 0 ].score > sdWorld.leaders[ 1 ].score )
						winner_msg = sdWorld.leaders[ 0 ].name + ' is a winner!';
						else
						if ( sdWorld.leaders.length > 1 && sdWorld.leaders[ 0 ].score === sdWorld.leaders[ 1 ].score )
						{
							winner_msg = 'Tie!';
							time_left += 10;
							sdWorld.scoring_allowed = true;
						}
					}
					sdServerConfig.Announce( winner_msg, time_left === 0 ? 4 : -1 );
				}
				
				time_left--;
				
				if ( time_left < -6 )
				{
					sdWorld.game_started = false;
					sdServerConfig.RespawnEveryoneAndResetScore( true );
				}
			}
			else
			{
				if ( players_tot < 2 )
				{
					sdServerConfig.Announce( 'Match hasn\'t started yet. Waiting for 1 more player...' );
					match_starting_in = -1;
				}
				else
				{
					if ( match_starting_in === 0 )
					{
						sdServerConfig.RespawnEveryoneAndResetScore();
						
						sdServerConfig.Announce( 'Fight!', 3 );
						sdWorld.game_started = true;
						sdWorld.scoring_allowed = true;
						sudden_victory = -1;
						time_left = 60 * 5;
						
						for ( let i = 0; i < sdEntity.entities.length; i++ )
						if ( typeof sdEntity.entities[ i ]._armor_protection_level !== 'undefined' )
						sdEntity.entities[ i ]._armor_protection_level = 0;
					}
					else
					{
						if ( match_starting_in === -1 )
						match_starting_in = 5;

						sdServerConfig.Announce( 'Match starting in ' + match_starting_in, 1 );
					}
					
					match_starting_in--;
				}
			}
			
		}, 1000 );
	}
	static RespawnEveryoneAndResetScore( switch_map=false )
	{
		for ( let i = 0; i < sdCharacter.characters.length; i++ )
		{
			sdCharacter.characters[ i ].death_anim = sdCharacter.disowned_body_ttl + 1000; // Silent
			sdCharacter.characters[ i ].remove();
			sdCharacter.characters[ i ]._broken = false;
		}
		
		for ( let i = 0; i < sdWorld.tracked_creatures.length; i++ )
		{
			sdWorld.tracked_creatures[ i ].remove();
			sdWorld.tracked_creatures[ i ]._broken = false;
		}
		sdWorld.tracked_creatures.length = 0;
		
		if ( switch_map )
		{
			for ( let i = 0; i < sdEntity.entities.length; i++ )
			if ( !sdEntity.entities[ i ].IsGlobalEntity() )
			{
				sdEntity.entities[ i ].remove();
				sdEntity.entities[ i ]._broken = false;
			}
	
			// Will prevent particles from being spawned
			sdWorld.world_bounds.x1 = 0;
			sdWorld.world_bounds.y1 = 0;
			sdWorld.world_bounds.x2 = 0;
			sdWorld.world_bounds.y2 = 0;
	
			setTimeout( ()=>
			{
				sdServerConfig.LoadNextMap();
			}, 1000 );
		}
		else
		{
			for ( let i = 0; i < sdEntity.entities.length; i++ )
			if ( sdEntity.entities[ i ].is( sdGun ) || sdEntity.entities[ i ].is( sdBullet ) )
			{
				sdEntity.entities[ i ].remove();
				sdEntity.entities[ i ]._broken = false;
			}
		}
		
		// No manual respawn for a while
		for ( var i = 0; i < sdWorld.sockets.length; i++ )
		{
			sdWorld.sockets[ i ].respawn_block_until = sdWorld.time + 2000;
		}
		
		sdWorld.score_by_hash = {}; // Reset everone's score
		
		// Make sure map loaded... Bad way
		setTimeout( ()=>
		{
			for ( var i = 0; i < sdWorld.sockets.length; i++ )
			if ( sdWorld.sockets[ i ].character )
			{
				let socket = sdWorld.sockets[ i ];

				//socket.score = 0;

				if ( socket.last_player_settings )
				{
					socket.last_player_settings.full_reset = true;
					socket.Respawn( socket.last_player_settings, true );
				}
			}
		}, switch_map ? 2000 : 0 );
	}
	static Announce( message, sound=-1 )
	{
		let x = 0;
		let y = 0;
		if ( sound === 0 )
		{
			// time running out (round end)
			sdSound.PlaySound({ name:'cube_hurt', x:x, y:y, pitch:0.2, volume:1.75 });
		}
		if ( sound === 1 )
		{
			// warmup time running out
			sdSound.PlaySound({ name:'turret', x:x, y:y, pitch:0.4, volume:0.5 });
		}
		if ( sound === 2 )
		{
			// round end
			sdSound.PlaySound({ name:'sd_beacon_disarm', x:x, y:y, pitch:0.1, volume:1.25 });
		}
		if ( sound === 3 )
		{
			// match start
			sdSound.PlaySound({ name:'cube_hurt', x:x, y:y, pitch:1.5, volume:1 });
		}
		if ( sound === 4 )
		{
			// match end
			sdSound.PlaySound({ name:'cube_hurt', x:x, y:y, pitch:1.3, volume:1 });
		}
	
		for ( var i = 0; i < sdWorld.sockets.length; i++ )
		sdWorld.sockets[ i ].emit( 'SERVICE_MESSAGE', message );
	}
	
	static GetHitAllowed( bullet_or_sword, target )
	{
		// Cancel damage from bullet towards target. bullet._owner is a possible owner (or null)
		let attacker = ( bullet_or_sword._dangerous_from || bullet_or_sword._owner );
		
		if ( !sdWorld.game_started )
		{
			if ( attacker && attacker.is( sdCharacter ) && attacker._ai_enabled === sdCharacter.AI_MODEL_NONE )
			if ( target.is( sdCharacter ) && target._ai_enabled === sdCharacter.AI_MODEL_NONE )
			{
				return false;
			}
		}
		
		return true;
	}
	
	static onDamage( target, initiator, dmg, headshot )
	{
		// Player (initiator) damaged another player (target)
		
		//sdServerConfig.Announce( 'Damage' );
		
		if ( initiator )
		{
			target._last_damage_from = initiator;
			target._last_damage_when = sdWorld.time;
		}
		
	}
	
	static GetSocketScore( socket )
	{
		// Alternates return value of socket.GetScore() which is used for leaderboard
		
		return socket.last_player_settings ? ( sdWorld.score_by_hash[ socket.last_player_settings.my_hash ] || 0 ) : 0;
	}
	static AddSocketScore( socket, v )
	{
		if ( socket.last_player_settings )
		sdWorld.score_by_hash[ socket.last_player_settings.my_hash ] = ( sdWorld.score_by_hash[ socket.last_player_settings.my_hash ] || 0 ) + v;
	}
	static onKill( target, initiator )
	{
		// Player (initiator) killed another player (target)
		
		target.matter = 0;
		
		if ( target._ai_enabled === sdCharacter.AI_MODEL_NONE )
		{
			target._ai_enabled = sdCharacter.AI_MODEL_DUMMY_UNREVIVABLE_ENEMY; // Prevent healing for score farming

			if ( sdWorld.scoring_allowed )
			{
				if ( !initiator )
				if ( sdWorld.time < target._last_damage_when + 7000 )
				{
					initiator = target._last_damage_from;

				}

				if ( initiator && initiator.GetClass() === 'sdCharacter' )
				{
					if ( initiator._socket )
					sdServerConfig.AddSocketScore( initiator._socket, 1 );
					//initiator._socket.score++;
				}
				else
				{
					if ( target._socket )
					sdServerConfig.AddSocketScore( target._socket, -1 );
					//target._socket.score--;
				}
			}

			let socket = target._socket;
			if ( socket )
			setTimeout( ()=>
			{
				if ( socket.character && ( socket.character._is_being_removed || socket.character.hea <= 0 ) )
				{
					socket.last_player_settings.full_reset = true;
					socket.Respawn( socket.last_player_settings, true );
				}

			}, 2000 );
		}
	}
	static GetAllowedWorldEvents()
	{
		return []; // Return array of allowed event IDs or "undefined" to allow them all
	}
	static onExtraWorldLogic( GSPEED )
	{
		sdWeather.only_instance._asteroid_timer = 0;
		
		sdWeather.only_instance.day_time = ( 30 * 60 * 24 ) / 2;
		
		for ( let i = 0; i < sdWorld.sockets.length; i++ )
		{
			if ( sdWorld.sockets[ i ].character )
			if ( !sdWorld.sockets[ i ].character._is_being_removed )
			if ( sdWorld.sockets[ i ].character.hea > 0 )
			{
				if ( sdWorld.sockets[ i ].character.y + sdWorld.sockets[ i ].character._hitbox_y2 > sdWorld.world_bounds.y2 - 8 )
				sdWorld.sockets[ i ].character.Damage( sdWorld.sockets[ i ].character.hea + 1 );
				else
				sdWorld.sockets[ i ].character.matter = Math.min( sdWorld.sockets[ i ].character.matter + 0.1 * GSPEED, sdWorld.sockets[ i ].character.matter_max );
			}
		}

		for ( let i = 0; i < sdWorld.push_fields.length; i++ )
		{
			for ( let s = 0; s < sdWorld.sockets.length; s++ )
			{
				if ( sdWorld.sockets[ s ].character )
				if ( !sdWorld.sockets[ s ].character._is_being_removed )
				{
					if ( sdWorld.sockets[ s ].character.x > sdWorld.push_fields[ i ].x )
					if ( sdWorld.sockets[ s ].character.x < sdWorld.push_fields[ i ].x + sdWorld.push_fields[ i ].w )
					if ( sdWorld.sockets[ s ].character.y > sdWorld.push_fields[ i ].y )
					if ( sdWorld.sockets[ s ].character.y < sdWorld.push_fields[ i ].y + sdWorld.push_fields[ i ].h )
					{
						sdWorld.sockets[ s ].character.Impulse( sdWorld.push_fields[ i ].tox * sdWorld.sockets[ s ].character.mass * GSPEED, sdWorld.push_fields[ i ].toy * sdWorld.sockets[ s ].character.mass * GSPEED );
						
						if ( sdWorld.push_fields[ i ].damage !== 0 )
						{
							if ( sdWorld.sockets[ s ].character > 0 || sdWorld.push_fields[ i ].damage < 0 )
							{
								sdWorld.sockets[ s ].character.Damage( Math.abs( sdWorld.push_fields[ i ].damage ) * GSPEED );
							}
						}
					}
				}
			}
		}
		
		if ( !sdWorld.game_started )
		{
			for ( let i = 0; i < sdWorld.tracked_creatures.length; i++ )
			{
				let ent = sdWorld.tracked_creatures[ i ];
				if ( ent._is_being_removed || ( ent._hea || ent.hea ) <= 0 )
				{
					//let value_mult = 16;
					let value_mult = ( ent._rank === 1 ) ? 2 : 4;
					
					sdWorld.DropShards( ent.x,ent.y,ent.sx,ent.sy, 3, value_mult, 3 );
					
					sdWorld.tracked_creatures.splice( i, 1 );
					i--;
					continue;
				}
			}
			
			if ( sdWorld.tracked_creatures.length < 15 )
			if ( Math.random() < 0.025 )
			{
				//let ent = new sdVirus({ x:0,y:0 });
				let ent = new sdAsp({ x:0,y:0 });
				//let ent = new sdCube({ x:0,y:0 });
		

				//sdVirus.prototype.onThink = sdAsp.prototype.onThink;
				//sdShark.prototype.SyncedToPlayer = sdAsp.prototype.SyncedToPlayer;
				//sdOctopus.prototype.Damage = sdAsp.prototype.Damage;
				
				//ent._last_jump = sdWorld.time;
				//ent._last_attack = sdWorld.time;
				//ent._current_target = null;
				
				sdServerConfig.PlayerSpawnPointSeeker( ent, null );
				sdEntity.entities.push( ent );
				
				sdWorld.tracked_creatures.push( ent );

				/*let r = 0.5 + Math.random() * 0.5;
				ent.hmax *= r;
				ent._hea *= r;*/
				
				let rank = 1;
				
				if ( Math.random() < 0.2 )
				{
					rank = 20;
					ent.filter = 'invert(1) sepia(1) saturate(100) hue-rotate(270deg) opacity(0.45)';
				}
				else
				{
					ent.filter = 'invert(1) sepia(1) saturate(100) hue-rotate(110deg) opacity(0.45)';
				}
				
				ent._hmax = 80 / 10 * rank;
				ent._hea = 80 / 10 * rank;
				
				ent._rank = rank;
			}
		}
	}
	static ResetScoreOnDeath( character_entity )
	{
		return false;
	}
	static onDisconnect( character_entity, reason ) // reason can be either 'disconnected' (connection lost) or 'manual' (player right clicked on himself or pressed Space while dead)
	{
		// Player lost control over sdCharacter (does not include full death case). Note that in case of reason being 'manual' player will get damage equal to his .hea (health) value.
		
	}
	static onReconnect( character_entity, player_settings )
	{
		// Player was reconnected. Alternatively onRespawn can be called
		
	}
			
	static onRespawn( character_entity, player_settings )
	{
		// Player just fully respawned. Best moment to give him guns for example. Alternatively onReconnect can be called
		
		// Spawn starter items based off what player wants to spawn with
		
		let i = -1;
		
		//while ( i === -1 || i === sdGun.CLASS_BUILD_TOOL || i === sdGun.CLASS_CRYSTAL_SHARD || i === sdGun.CLASS_FISTS )
		//while ( i === -1 || sdGun.classes[ i ].ignore_slot === true || i === sdGun.CLASS_BUILD_TOOL || i === sdGun.CLASS_CRYSTAL_SHARD || i === sdGun.CLASS_FISTS || sdGun.classes[ i ].projectile_properties._admin_picker )
		while ( i === -1 || sdGun.classes[ i ].ignore_slot === true || i === sdGun.CLASS_CRYSTAL_SHARD || i === sdGun.CLASS_FISTS || sdGun.classes[ i ].projectile_properties._admin_picker )
		{
			i = ~~( Math.random() * sdGun.classes.length );
			
			//i = sdGun.CLASS_BUILD_TOOL; // hack
		}

		let gun = new sdGun({ x:character_entity.x, y:character_entity.y, class: i });
		sdEntity.entities.push( gun );
		
		character_entity.gun_slot = sdGun.classes[ i ].slot;
		character_entity._backup_slot = 0;
		
		character_entity._hook_allowed = true;
		
		character_entity._last_damage_from = null;
		character_entity._last_damage_when = 0;
		
		character_entity.matter_max = 150;
		character_entity.matter = 150;
		
		sdSound.PlaySound({ name:'teleport', x:character_entity.x, y:character_entity.y, volume:0.5 });
	}
	static EntitySaveAllowedTest( entity )
	{
		// This method should return false in cases when specific entities should never be saved in snapshots (for example during reboot). Can be used to not save players for FFA servers especially if reboots are frequent
		
		return false;
		
		//return entity.GetClass() !== 'sdCharacter';
	}
	static onAfterSnapshotLoad()
	{
		// World exists and players are ready to connect
		
		sdServerConfig.LoadNextMap();
	}
	
	static LoadNextMap()
	{
		let suitable_maps = [];
		
		let players_tot = sdWorld.GetPlayingPlayersCount( true );
		
		for ( let i = 0; i < sdWorld.maps_available.length; i++ )
		if ( players_tot >= sdWorld.maps_available[ i ][ 0 ] )
		if ( players_tot <= sdWorld.maps_available[ i ][ 1 ] )
		suitable_maps.push( i );
		
		sdWorld.map_current = suitable_maps[ ~~( Math.random() * suitable_maps.length ) ];
		
		let map = sdWorld.maps_available[ sdWorld.map_current ][ 2 ];
	
		// In case of new server these will be 0. This will define initial world bounds:
		/*if ( sdWorld.world_bounds.x1 === 0 )
		if ( sdWorld.world_bounds.x2 === 0 )
		if ( sdWorld.world_bounds.y1 === 0 )
		if ( sdWorld.world_bounds.y2 === 0 )*/
		{
			//console.log( 'Reinitializing world bounds' );
			//sdWorld.ChangeWorldBounds( -16 * 10, -16 * 10, 16 * 10, 16 * 10 );
			
			// Bad way of ignoring syntax error in NetBeans
			//eval(` import('xml2json') `).then( ( xml_parser ) => {
			
			import('xml2json').then( ( xml_parser ) => {
				
				// For some reason it is required on Linux but not on PC
				if ( xml_parser.default )
				xml_parser = xml_parser.default;
				
				//console.log( 'xml_parser: ', xml_parser );
			
				// For hit detection to work
				sdWorld.world_bounds.x1 = -10000;
				sdWorld.world_bounds.x2 = 10000;
				sdWorld.world_bounds.y1 = -10000;
				sdWorld.world_bounds.y2 = 10000;
				
				sdWorld.push_fields = [];

				let world_bounds = {x1:0,y1:0,x2:0,y2:0};

				/*request.get('http://www.whatever.com/my.csv', function (error, response, body) {
					if (!error && response.statusCode == 200) {
						var csv = body;
						// Continue with your processing here.
					}
				});*/
				
				let json = JSON.parse( xml_parser.toJson( '<r>' + map + '</r>' ) ).r;
				
				let scale = 1 / 80 * 28;
				
				//console.log( json );
				
				for ( let tag in json )
				{
					let instances = json[ tag ];
					
					if ( !( instances instanceof Array ) )
					instances = [ instances ];
					
					for ( let i = 0; i < instances.length; i++ )
					{
						let instance = instances[ i ];
						
						if ( tag === 'gun' || tag === 'player' || tag === 'trigger' || tag === 'timer' || tag === 'region' )
						{
						}
						else
						if ( tag === 'decor' )
						{
							instance.x = Number( instance.x );
							instance.y = Number( instance.y );

							instance.x = Math.round( instance.x * scale / 8 ) * 8;
							instance.y = Math.round( instance.y * scale / 8 ) * 8;
							
							if ( instance.model === 'antigravity' )
							{
								let ent = new sdAntigravity({ 
									x: instance.x, 
									y: instance.y
								});
								sdEntity.entities.push( ent );
							}
							else
							if ( instance.model === 'teleport2' )
							{
								let ent = new sdTeleport({ 
									x: instance.x, 
									y: instance.y + 16
								});
								sdEntity.entities.push( ent );
							}
							//else
							//{
							//	console.log( 'instance.model: ' + instance.model );
							//}
						}
						else
						if ( tag === 'pushf' )
						{
							instance.x = Number( instance.x );
							instance.y = Number( instance.y );
							instance.w = Number( instance.w );
							instance.h = Number( instance.h );
							
							instance.x2 = Math.round( ( instance.x + instance.w ) * scale / 8 ) * 8;
							instance.y2 = Math.round( ( instance.y + instance.h ) * scale / 8 ) * 8;
							
							instance.x = Math.round( instance.x * scale / 8 ) * 8;
							instance.y = Math.round( instance.y * scale / 8 ) * 8;
							
							instance.w = Math.max( 8, instance.x2 - instance.x );
							instance.h = Math.max( 8, instance.y2 - instance.y );
							
							let x = instance.x;
							let y = instance.y;
							let w = instance.w;
							let h = instance.h;
							let tox = Number( instance.tox );
							let toy = Number( instance.toy );
							let stab = Number( instance.stab );
							let damage = 0;//Number( instance.damage );

							if ( damage === 0 && stab === 0 && sdWorld.Dist2D_Vector( tox, toy ) <= 0.5 )
							{
								// Ignore antigravity fields
							}
							else
							sdWorld.push_fields.push({
								x,
								y,
								w,
								h,
								tox,
								toy,
								stab,
								damage
							});
						}
						else
						if ( tag === 'lamp' )
						{
							if ( instance.flare === 'true' || instance.flare === '1' )
							{
								instance.x = Number( instance.x );
								instance.y = Number( instance.y );

								instance.x = Math.round( instance.x * scale / 8 ) * 8;
								instance.y = Math.round( instance.y * scale / 8 ) * 8;

								let ent = new sdLamp({ 
									x: instance.x, 
									y: instance.y
								});
								sdEntity.entities.push( ent );
							}
						}
						else
						if ( tag === 'box' || tag === 'door' || tag === 'bg' || tag === 'water' )
						{
							//console.log( tag, instance );
							
							let ignored_classes = [ tag === 'water' ? 'sdWater' : ( ( tag === 'box' || tag === 'door' ) ? 'sdBlock' : 'sdBG' ) ];
							
							instance.x = Number( instance.x );
							instance.y = Number( instance.y );
							instance.w = Number( instance.w );
							instance.h = Number( instance.h );
							
							instance.x2 = Math.round( ( instance.x + instance.w ) * scale / 8 ) * 8;
							instance.y2 = Math.round( ( instance.y + instance.h ) * scale / 8 ) * 8;
							
							instance.x = Math.round( instance.x * scale / 8 ) * 8;
							instance.y = Math.round( instance.y * scale / 8 ) * 8;
							
							instance.w = Math.max( 8, instance.x2 - instance.x );
							instance.h = Math.max( 8, instance.y2 - instance.y );
							
							let maxx = instance.w;
							let maxy = instance.h;
							
							let normal_size = 16;
							
							if ( tag === 'box' || tag === 'door' )
							if ( instance.m !== '1' ) // not grass
							if ( instance.m !== '2' ) // nor sand
							normal_size = 32;
				
							if ( tag === 'bg' )
							if ( instance.m !== '1' )
							normal_size = 32;
				
							
							for ( let x = 0; x < maxx; x += normal_size )
							for ( let y = 0; y < maxy; y += normal_size )
							{
								let ww = ( x + normal_size < maxx ) ? normal_size : ( maxx - x );
								let hh = ( y + normal_size < maxy ) ? normal_size : ( maxy - y );
							
								if ( !sdWorld.CheckWallExists( instance.x + x + 1, instance.y + y + 1, null, null, ignored_classes ) ||
									 !sdWorld.CheckWallExists( instance.x + x + ww - 1, instance.y + y + 1, null, null, ignored_classes ) || 
									 !sdWorld.CheckWallExists( instance.x + x + ww - 1, instance.y + y + hh - 1, null, null, ignored_classes ) ||
									 !sdWorld.CheckWallExists( instance.x + x + 1, instance.y + y + hh - 1, null, null, ignored_classes ) )
								{
									let ENT_CLASS;
									let filter = '';
									let material;
									let plants = null;
									
									if ( tag === 'water' )
									{
										ENT_CLASS = sdWater;
									}
									else
									if ( tag === 'box' || tag === 'door' )
									{
										ENT_CLASS = sdBlock;
										
										material = sdBlock.MATERIAL_WALL;
										
										if ( tag === 'door' )
										filter = 'saturate(0)contrast(.2)brightness(.1)';
										else
										{
											if ( instance.m === '1' ) // grass
											{
												material = sdBlock.MATERIAL_GROUND;
												//filter = 'hue-rotate(90deg)brightness(.5)';
												filter = 'hue-rotate(90deg)brightness(.25)';
												
												if ( y === 0 )
												{
													let grass = new sdGrass({ x:instance.x + x + ww - 16, y:instance.y + y - 16, filter:'hue-rotate(90deg)brightness(.5)' });
													sdEntity.entities.push( grass );

													if ( plants === null )
													plants = [];

													plants.push( grass._net_id );
												}
											}
											else
											if ( instance.m === '2' ) // sand
											{
												material = sdBlock.MATERIAL_GROUND;
												filter = 'hue-rotate(45deg)saturate(2)brightness(.6)';
											}
											else
											filter = 'saturate(0)contrast(.2)brightness(.3)';
										}
										
									}
									else
									{
										ENT_CLASS = sdBG;
										filter = 'contrast(.8)brightness(.6)';
										material = sdBG.MATERIAL_PLATFORMS;
										
										if ( instance.m === '2' ) // usurp
										{
											material = sdBG.MATERIAL_PLATFORMS_COLORED;
											filter = 'hue-rotate(180deg)saturate(40)';
										}
										else
										if ( instance.m === '1' ) // ground
										{
											filter = 'hue-rotate(45deg)saturate(2)brightness(.4)';
											material = sdBG.MATERIAL_GROUND;
										}
									}
									
									let ent = new ENT_CLASS({ 
										x: instance.x + x, 
										y: instance.y + y, 
										width: ww, 
										height: hh,
										material: material,
										filter: filter,
										natural: true,
										plants: plants
									});
									sdEntity.entities.push( ent );

									sdWorld.UpdateHashPosition( ent, false ); // Prevent inersection with other ones
								}
							}
							
							world_bounds.x1 = Math.min( world_bounds.x1, instance.x );
							world_bounds.x2 = Math.max( world_bounds.x2, instance.x + instance.w );
							world_bounds.y1 = Math.min( world_bounds.y1, instance.y );
							world_bounds.y2 = Math.max( world_bounds.y2, instance.y + instance.h );
						}
						//else
						//console.log( 'unknown instance: '+tag, instance );
					}
				}
				
				sdWorld.world_bounds = world_bounds;
				
				sdWorld.world_bounds.y1 -= 1000;
				
				sdWorld.world_bounds.x1 -= 500;
				
				sdWorld.world_bounds.x2 += 500;
				
				//sdWorld.base_ground_level = sdWorld.world_bounds.y1 + 32;
				//sdWorld.ChangeWorldBounds( sdWorld.world_bounds.x1, sdWorld.world_bounds.y1, sdWorld.world_bounds.x2, sdWorld.world_bounds.y2 + 500 );
				//sdWorld.ChangeWorldBounds( sdWorld.world_bounds.x1 - 500, sdWorld.world_bounds.y1, sdWorld.world_bounds.x2 + 500, sdWorld.world_bounds.y2 );

				/*
				var xml = "<foo attr=\"value\">bar</foo>";
				console.log("input -> %s", xml)

				// xml to json
				var json = parser.toJson(xml);
				console.log("to json -> %s", json);

				// json to xml
				var xml = parser.toXml(json);
				console.log("back to xml -> %s", xml)*/
						
				for ( let i = 0; i < sdEntity.entities.length; i++ )
				if ( typeof sdEntity.entities[ i ]._armor_protection_level !== 'undefined' )
				sdEntity.entities[ i ]._armor_protection_level = 1;

			});

		}
	}
	static PlayerSpawnPointSeeker( character_entity, socket )
	{
		let x,y,bad_areas_near,i;
		let tr = 0;
		let max_tr = 10000;
		do
		{
			x = sdWorld.world_bounds.x1 + Math.random() * ( sdWorld.world_bounds.x2 - sdWorld.world_bounds.x1 );
			y = sdWorld.world_bounds.y1 + Math.random() * ( sdWorld.world_bounds.y2 - sdWorld.world_bounds.y1 );

			bad_areas_near = false;

			if ( y < sdWorld.world_bounds.y2 - 64 )
			if ( tr > max_tr * 0.8 || ( character_entity.CanMoveWithoutOverlap( x, y, 0 ) && !character_entity.CanMoveWithoutOverlap( x, y + 32, 0 ) ) )
			if ( tr > max_tr * 0.4 || sdWorld.last_hit_entity === null || ( sdWorld.last_hit_entity.GetClass() === 'sdBlock' && sdWorld.last_hit_entity.material !== sdBlock.MATERIAL_SHARP ) ) // Only spawn on ground
			{
				for ( i = 0; i < sdWorld.push_fields.length; i++ )
				{
					if ( x > sdWorld.push_fields[ i ].x - 32 )
					if ( x < sdWorld.push_fields[ i ].x + sdWorld.push_fields[ i ].w + 32 )
					if ( y > sdWorld.push_fields[ i ].y - 32 )
					if ( y < sdWorld.push_fields[ i ].y + sdWorld.push_fields[ i ].h + 32 )
					{
						bad_areas_near = true;
						break;
					}
				}
				
				if ( !bad_areas_near )
				for ( i = 0; i < sdWorld.sockets.length; i++ )
				if ( sdWorld.sockets[ i ].character )
				if ( !sdWorld.sockets[ i ].character._is_being_removed )
				if ( sdWorld.sockets[ i ].character.hea > 0 )
				if ( sdWorld.inDist2D_Boolean( sdWorld.sockets[ i ].character.x, sdWorld.sockets[ i ].character.y, x, y, 64 ) )
				{
					bad_areas_near = true;
					break;
				}

				if ( tr > max_tr * 0.8 || !bad_areas_near )
				{
					character_entity.x = x;
					character_entity.y = y;

					break;
				}
			}

			tr++;
			if ( tr > max_tr )
			{
				character_entity.x = x;
				character_entity.y = y;
				break;
			}
		} while( true );
	}
}