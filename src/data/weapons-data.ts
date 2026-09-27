/**
 * Armas atuais do Tibia/RubinOT, extraídas da TibiaWiki BR em 2026-09-27 (categorias Espadas,
 * Machados, Clavas, Bows, Crossbows, Armas de Arremesso, Wands, Rods, Punhos e Aljavas; sem as
 * "Armas Obsoletas"/removidas). Uma arma por linha, campos separados por "|":
 *
 *   nome|tipo|vocações|level|mãos|ataque|elemento|defesa|dano|alcance|skills|imbuements|tier máx|hit|título na wiki
 *
 * tipo: s=espada a=machado c=clava b=bow x=crossbow t=arremesso w=wand r=rod f=punho (monk) q=aljava
 * vocações: K P S D M (vazio = qualquer vocação pode usar). Campos vazios = a wiki não informa.
 * Parse/uso em src/lib/weapons.ts. Pra atualizar: refazer a extração da wiki (ver AGENTS.md).
 */
export const WEAPONS_TSV = `Abyss Hammer|c|K|60|2|47||21||||3|2
Alicorn Quiver|q|P|400|||||||ML +1
Amber Axe|a|K|330|1|0|46 Ice|32|||Axe +3|2|10
Amber Bludgeon|c|K|330|2|0|50 Death|34|||Club +3|2
Amber Bow|b|P|330|2|+7||||6|Distance +3|3|10|+6
Amber Crossbow|x|P|330|2|+8||||6|Distance +3|3|10|+7
Amber Cudgel|c|K|330|1|0|46 Fire|32|||Club +3|2
Amber Greataxe|a|K|330|2|0|50 Earth|34|||Axe +3|2|10
Amber Kusarigama|f|M|330|2|44||20|||Fist +4, ML +1|2|10
Amber Rod|r|D|330|||||106 Ice|5|ML +2, Ice ML +2|2|10
Amber Sabre|s|K|330|1|0|46 Energy|32|||Sword +3|2|10
Amber Slayer|s|K|330|2|0|50 Death|34|||Sword +3|2|10
Amber Staff|c||40|2|43||25||||3|2
Amber Wand|w|S|330||||||5|ML +2, Energy ML +2|2|10
Angelic Axe|a|K|45|2|44||24|||||2
Arbalest|x|P|75|2|+2||||6|||2|+2
Arcane Staff|c||75|2|50||30||||2|2
Assassin Dagger|s||40|1|40||12||||2|2
Assassin Star|t||80|1|65||0||4
Axe of Destruction|a|K|200|1|51||31||||2|2
Axe|a||0|1|12||6|||||1
Bambus Jo|f|M|150|2|40||19|||Fist +1|2|10
Banana Staff|c||0|1|25||15|||||2
Barbarian Axe|a||20|1|28||18||||2|1
Battle Axe|a|K|0|2|25||10|||||1
Battle Hammer|c||0|1|24||14|||||1
Beastslayer Axe|a||30|1|35||12||||2|2
Berserker|s|K|65|2|48||21||||3|2
Blacksteel Sword|s|K|35|2|42||22||||3|2
Blade of Corruption|s||82|1|48||29||||2|2
Blade of Destruction|s|K|200|1|50||33||||2|2
Blessed Sceptre|c||75|1|47||21||||2|2
Bloody Edge|s||55|1|43||21||||2|2
Blue Quiver|q|P|0
Bone Club|c||0|1|12||8|||||1
Bone Sword|s||0|1|13||10|||||1
Bonebreaker|c|K|55|2|46||15|||||2
Bow of Cataclysm|b|P|250|2|+6||||6|Distance +1|3|3|+4
Bow of Destruction|b|P|200|2|+5||||6||3|2|+5
Bow|b||0|2|||||6|||1
Bright Sword|s||30|1|36||30||||2|2
Broadsword|s|K|0|2|26||23||||3|1
Broken Iks Spear|t|||2|1||1
Broken Macuahuitl|s||0|1|1||1
Brutetamer's Staff|c||25|2|35||15|||||1
Butcher's Axe|a||45|1|41||24||||2|2
Candy-Coated Quiver|q|P|200
Carlin Sword|s||0|1|15||13|||||1
Chain Bolter|x|P|60|2|+4||||3||3|10
Chaos Mace|c||45|2|44||21|||||2
Chopper of Destruction|a|K|200|2|52||30||||3|2
Clerical Mace|c||20|1|28||15||||2|1
Club of the Fury|c||0|1|16||8|||||2
Club|c||0|1|7||7|||||1
Cobra Axe|a|K|220|1|8|44 Ice|29|||Axe +2|2|10
Cobra Bo|f|M|250|2|42||20|||Fist +4|2|10
Cobra Club|c|K|220|1|8|44 Fire|29|||Club +2|2|10
Cobra Crossbow|x|P|220|2|+7||||6|Distance +1|2|10|+6
Cobra Rod|r|D|220|||||90 Earth|5|ML +2|2|10
Cobra Sword|s|K|220|1|52||31|||Sword +3|2|10
Cobra Wand|w|S|270|||||95 Energy|4|ML +2|2|10
Combat Knife|s||0|1|8||6|||||1
Composite Hornbow|b|P|50|2|+2||||6||3|2|+2
Cowtana|s||25|1|34||19|||||2
Cranial Basher|c||60|1|44||20||||2|2
Crimson Sword|s||0|1|18||10|||||1||Crimson Sword (Rashid)
Crimson Sword|s||20|1|28||20||||2|1
Crossbow of Destruction|x|P|200|2|+6||||5||3|2|+5
Crossbow|x||0|2|||||5||3|1
Crowbar|c||0|1|5||6|||||1
Crude Umbral Axe|a|K|75|1|49||24|||||2
Crude Umbral Blade|s|K|75|1|48||26|||||2
Crude Umbral Bow|b|P|75|2|+2||||7|||2|+5
Crude Umbral Chopper|a|K|75|2|51||27|||||2
Crude Umbral Crossbow|x|P|75|2|+3||||5|||2|+1
Crude Umbral Hammer|c|K|75|2|51||27|||||2
Crude Umbral Katar|f|M|75|2|39||16|||Fist +1||2
Crude Umbral Mace|c|K|75|1|48||22|||||2
Crude Umbral Slayer|s|K|75|2|51||29|||||2
Crypt Bile|w|S|450||||||6|ML +4|2|10
Crypt Breaker|c|K|450|2|58||33|||Club +4|3|10
Crypt Jaw|r|D|450||||||6|ML +4|2|10
Crypt Slicer|s|K|450|2|58||33|||Sword +4|3|10
Crypt Spine|b|P|450|2|+8||||6|Distance +3|3|10
Crypt Splitter|a|K|450|2|58||33|||Axe +4|3|10
Crypt Strike|f|M|450|2|45||20|||Fist +4, ML +1|3|10
Crystal Crossbow|x|P|90|2|+4||||6|||2|+3
Crystal Mace|c||35|1|38||16||||2|2
Crystal Sword|s|K|25|2|35||26|||||1
Crystalline Axe|a||120|1|51||29||||1|2
Crystalline Sword|s||62|1|47||34|||||2
Dagger|s||0|1|8||6|||||1
Daramian Axe|a||0|1|17||8|||||10
Daramian Mace|c||0|1|21||12|||||1
Daramian Waraxe|a|K|25|2|39||15|||||2
Dark Trinity Mace|c||120|1|51||32|||||10
Deepling Axe|a||80|1|49||29|||||2
Deepling Ceremonial Dagger|w|SD|180|||||90 Ice|6|ML +1|2|3
Deepling Fork|w|SD|230|||||90 Ice|5|ML +2|2|3
Deepling Squelcher|c||48|1|42||28||||2|2
Deepling Staff|c||38|2|43||23|||||2
Demonbone|c||80|1|48||38||||2|3
Demonrage Sword|s|K|60|2|47||22||||3|2
Demonwing Axe|a|K|120|2|53||20||||2|3
Depth Claws|f|M|135|2|40||18|||Fist +2|2|10
Diamond Sceptre|c||25|1|34||18|||||2
Djinn Blade|s||35|1|38||22||||2|3
Double Axe|a|K|25|2|35||12|||||1
Drachaku|f|M|90|2|39||16||||2|2
Dragon Hammer|c||25|1|32||20|||||2
Dragon Lance|a||60|2|47||16||||3|2
Dragon Slayer|s|K|45|2|44||28||||3|2
Dragonbone Staff|c||30|1|35||18||||2|2
Draining Inferniarch Arbalest|x|P|300|2|+8||||6|Distance +2|2|10|+6
Draining Inferniarch Battleaxe|a|K|300|1|8|44 Fire|31|||Axe +3|1|10
Draining Inferniarch Blade|s|K|300|1|8|44 Fire|31|||Sword +3|1|10
Draining Inferniarch Bow|b|P|300|2|+7||||6|Distance +2|2|10|+5
Draining Inferniarch Claws|f|M|300|2|43||21|||Fist +4|1|10
Draining Inferniarch Flail|c|K|300|1|8|44 Death|31|||Club +3|1|10
Draining Inferniarch Greataxe|a|K|300|2|8|48 Fire|33|||Axe +4|1|10
Draining Inferniarch Rod|r|D|300|||||90-110 Earth|5|ML +3, Earth ML +1|1|10
Draining Inferniarch Slayer|s|K|300|2|8|48 Energy|33|||Sword +4|1|10
Draining Inferniarch Wand|w|S|300|||||95-115 Death|5|ML +3, Fire ML +1|1|10
Draining Inferniarch Warhammer|c|K|300|2|8|48 Ice|33|||Club +4|1|10
Drakinata|a||60|2|47||20||||3|2
Dreaded Cleaver|a||40|1|40||19||||2|2
Dream Blossom Staff|w|SD|80|||||70 Energy|5||2|2
Dwarven Axe|a||20|1|31||19||||2|2
Eldritch Bow|b|P|250|2|+6||||6|Distance +2, Holy ML +1|3|10|+6
Eldritch Claymore|s|K|270|2|6|50 Fire|33|||Sword +3|2|10
Eldritch Crescent Moon Spade|f|M|250|2|42||20|||Fist +2, ML +2|2|10
Eldritch Greataxe|a|K|270|2|56||33|||Axe +3|2|10
Eldritch Quiver|q|P|250
Eldritch Rod|r|D|250|||||85-105 Ice|4|ML +2, Healing ML +2|2|10
Eldritch Wand|w|S|250|||||85-105 Fire|4|ML +2, Fire ML +1|2|10
Eldritch Warmace|c|K|270|2|6|50 Fire|33|||Club +3|2|10
Elethriel's Elemental Bow|b|P|70|2|+7||||4|||10
Elvish Bow|b||0|2|||||6||3|2|+3
Emerald Sword|s||100|1|49||33||||2|3
Enchanted Spear|t||42|1|38||0||4
Energized Demonbone|c||80|1|46||40||||2|3
Energized Limb|w|SD|180|||||98 Fire|5|ML +1|2|3
Epee|s||30|1|37||23||||2|2
Execowtioner Axe|a||55|2|46||18|||||2
Executioner|a|K|85|2|51||20||||2|3
Falcon Battleaxe|a|K|300|2|10|47 Energy|33|||Axe +4|2|10
Falcon Bow|b|P|300|2|+6||||6|Distance +2|3|10|+5
Falcon Longsword|s|K|300|2|56||34|||Sword +4|2|10
Falcon Mace|c|K|300|1|11|41 Energy|33|||Club +3|2|10
Falcon Rod|r|D|300|||||90 Earth|5|ML +3|2|10
Falcon Sai|f|M|300|2|43||20|||Fist +4|2|10
Falcon Wand|w|S|300|||||100 Energy|5|ML +3|2|10
Farmer's Avenger|a||0|2|17||7|||||2
Ferumbras' Staff|c||100|1|20||30|||||||Ferumbras' Staff (Club)
Ferumbras' Staff|w|S|100|||||110 Energy|4|||||Ferumbras' Staff (Enchanted Wand)
Ferumbras' Staff|w|S|65|||||95 Energy|3|||||Ferumbras' Staff (Wand)
Fire Axe|a||35|1|27|11 Fire|16|||||2
Fire Sword|s||30|1|24|11 Fire|20|||||2
Fists of Enlightenment|f|M|20|2|23||14||||1|1
Furry Club|c||20|1|31||19|||||2
Giant Smithhammer|c||0|1|24||14|||||2
Giant Sword|s|K|55|2|46||22||||3|2
Gilded Eldritch Bow|b|P|250|2|+6||||6|Distance +2, Holy ML +1|3|10|+6
Gilded Eldritch Claymore|s|K|270|2|6|50 Fire|33|||Sword +3|2|10
Gilded Eldritch Crescent Moon Spade|f|M|250|2|42||20|||Fist +2, ML +2|2|10
Gilded Eldritch Greataxe|a|K|270|2|56||33|||Axe +3|2|10
Gilded Eldritch Rod|r|D|250|||||85-105 Ice|4|ML +2, Healing ML +2|2|10
Gilded Eldritch Wand|w|S|250|||||85-105 Fire|6|ML +2, Fire ML +1|2|10
Gilded Eldritch Warmace|c|K|270|2|6|50 Fire|33|||Club +3|2|10
Glacial Rod|r|D|65|||||85 Ice|4|ML +1||2
Glooth Axe|a|K|75|2|39|26 Earth|1
Glooth Blade|s|K|75|2|39|26 Earth|1
Glooth Club|c|K|75|2|39|26 Earth|1
Glooth Spear|t||60|1|55||0||3
Glooth Whip|c||25|1|33||19||||2|2
Glorious Axe|a|K|30|2|40||23|||||2
Glutton's Mace|c||0|1|16||10|||||2
Gnome Sword|s|K|250|1|10|42 Energy|29|||Sword +1|2|3
Golden Axe|a||0|2|10||5|||||1
Golden Magic Longsword|s||0|1|0||0
Golden Sickle|a||0|1|13||6|||||2
Golden Warlord Sword|s||0|1|0||0
Grand Sanguine Battleaxe|a|K|600|2|8|50 Death|35|||Axe +4|3|10
Grand Sanguine Blade|s|K|600|1|8|46 Fire|32|||Sword +4|2|10
Grand Sanguine Bludgeon|c|K|600|2|8|50 Earth|35|||Club +4|3|10
Grand Sanguine Bow|b|P|600|2|+9||||6|Distance +3|3|10|+6
Grand Sanguine Claws|f|M|600|2|45||21|||Fist +4, ML +2|3|10
Grand Sanguine Coil|w|S|600|||||114 Fire||ML +4, Fire ML +1, Energy ML +1|2|10
Grand Sanguine Crossbow|x|P|600|2|+10||||6|Distance +3|3|10|+7
Grand Sanguine Cudgel|c|K|600|1|8|46 Death|32|||Club +4|2|10
Grand Sanguine Hatchet|a|K|600|1|8|46 Fire|32|||Axe +4|2|10
Grand Sanguine Razor|s|K|600|2|8|50 Energy|35|||Sword +4|3|10
Grand Sanguine Rod|r|D|600|||||112 Earth||ML +4, Ice ML +1, Earth ML +1|2|10
Great Axe|a|K|95|2|52||22||||2|3
Guardian Axe|a||50|2|46||11|||||2
Guardian Halberd|a||55|2|46||15||||3|2
Hailstorm Rod|r|D|33|||||65 Ice|3|||1
Halberd|a||25|2|35||14|||||1
Hammer of Destruction|c|K|200|2|53||29||||3|2
Hammer of Prophecy|c|K|120|2|52||35|||||10
Hammer of Wrath|c|K|65|2|48||12||||3|2
Hand Axe|a||0|1|10||5|||||1
Hatchet|a||0|1|15||8|||||1
Haunted Blade|s|K|30|2|40||12||||3|2
Havoc Blade|s|K|70|2|49||34||||3|3
Headchopper|a|K|35|2|42||20||||3|2
Heavy Mace|c|K|70|2|49||15||||3|2
Heavy Machete|s||0|1|16||10|||||1
Heavy Trident|a||25|2|35||17|||||2
Hellforged Axe|a||110|1|51||28||||1|3
Heroic Axe|a||60|1|44||24||||2|2
Hive Bow|b|P|85|2|+2||||6||3|2|+5
Hive Scythe|a||70|1|46||24||||2|2
Hunting Spear|t||20|1|32||0||3
Ice Hatchet|a||0|1|4|11 Ice|8|||||2
Ice Rapier|s||0|1|42|18 Ice|1
Icicle Bow|b||0|2|+1||||6||3|2|+4
Impaler of the Igniter|s||150|1|25|26 Fire|31|||||10
Impaler|a||85|1|49||25||||2|3
Incredible Mumpiz Slayer|s||0|1|17||14|||||2
Inferniarch Arbalest|x|P|300|2|+8||||6|Distance +2|3|10|+6
Inferniarch Battleaxe|a|K|300|1|8|44 Fire|31|||Axe +3|2|10
Inferniarch Blade|s|K|300|1|8|44 Fire|31|||Sword +3|2|10
Inferniarch Bow|b|P|300|2|+7||||6|Distance +2|3|10|+5
Inferniarch Claws|f|M|300|2|43||21|||Fist +4|2|10
Inferniarch Flail|c|K|300|1|8|44 Death|31|||Club +3|2|10
Inferniarch Greataxe|a|K|300|2|8|48 Fire|33|||Axe +4|2|10
Inferniarch Rod|r|D|300|||||90-110 Earth|5|ML +3, Earth ML +1|2|10
Inferniarch Slayer|s|K|300|2|8|48 Energy|33|||Sword +4|2|10
Inferniarch Wand|w|S|300|||||95-115 Death|5|ML +3, Fire ML +1|2|10
Inferniarch Warhammer|c|K|300|2|8|48 Ice|33|||Club +4|2|10
Ink Sword|s||0|1|14||12||||2|1
Iron Hammer|c||0|1|18||10|||||1
Jade Hammer|c||70|1|46||20|||||2
Jagged Sword|s||0|1|21||14|||||1
Jo Staff|f|M|0|2|17||12|||Fist +1||1
Jungle Bow|b|P|150|2|+6||||6|Distance +1|2|10|+5
Jungle Flail|c|K|150|2|52||31||||2|10
Jungle Quiver|q|P|150
Jungle Rod|r|D|150|||||80-100 Ice|4|ML +1|2|10
Jungle Wand|w|S|150|||||80-100 Earth|4|ML +1|2|10
Katana|s||0|1|16||12|||||1
Knife|s||0|1|5||5|||||2
Knight Axe|a||25|1|33||21||||2|2
Leaf Star|t||60|1|48|2 Earth|0||5
Lich Staff|c||40|1|40||30|||||10
Life Preserver|c||15|1|27||19||||2|1
Light Jo Staff|f|M|0|2|10||6|||Fist +1
Light Mace|c||0|1|14||9|||||10
Lion Axe|a|K|270|1|8|44 Earth|31|||Axe +3|2|10
Lion Claws|f|M|270|2|43||19|||Fist +4|2|10
Lion Hammer|c|K|270|1|8|44 Earth|31|||Club +3|2|10
Lion Longbow|b|P|270|2|+6||||6|Distance +1|3|10|+6
Lion Longsword|s|K|270|1|8|44 Earth|31|||Sword +3|2|10
Lion Rod|r|D|270|||||85-105 Ice|5|ML +2|2|10
Lion Wand|w|S|220|||||89-109 Ice|5|ML +2|2|10
Living Vine Bow|b|P|220|2|+5||||6|Distance +1|3|3|+5
Longsword|s||0|1|17||14|||||1
Lunar Staff|c||30|2|40||25||||3|2
Mace of Destruction|c|K|200|1|50||32||||2|2
Mace|c||0|1|16||11|||||1
Machete|s||0|1|12||9|||||1
Magic Longsword|s|K|140|2|55||40|||||10
Magic Sword|s||80|1|48||35||||2|2
Maimer|c||150|1|51||32||||1|3
Mallet Handle|c||0|1|24||14
Mammoth Whopper|c||20|1|30||15|||||1
Mean Knight Sword|s||0|1|14||7
Mean Paladin Spear|t||0|1|15||0||3
Mercenary Sword|s|K|40|2|43||27|||||2
Metal Bat|c||55|1|44||20|||||2
Mino Lance|a||45|1|40||23|||||2
Modified Crossbow|x|P|45|2|||||5||3|2|+1
Moohtant Cudgel|c||60|2|47||21|||||2
Moonlight Rod|r|D|13|||||19 Ice|3|||1
Moonsilver Axe|a|K|1000|1|6|50 Earth|33|||Axe +6|2|10
Moonsilver Bow|b|P|1000|2|+10||||6|Distance +5|3|10|+7
Moonsilver Channeler|w|S|1000|1||||||ML +6, Death ML +1|2|10
Moonsilver Chopper|a|K|1000|2|6|54 Energy|36|||Axe +6|3|10
Moonsilver Claymore|s|K|1000|2|6|54 Fire|36|||Sword +6|3|10
Moonsilver Crossbow|x|P|1000|2|+11||||6|Distance +5|3|10|+8
Moonsilver Crusher|c|K|1000|1|6|50 Earth|33|||Club +6|2|10
Moonsilver Epee|s|K|1000|1|6|50 Earth|33|||Sword +6|2|10
Moonsilver Katar|f|M|1000|2|46||22|||Fist +6, ML +2|3|10
Moonsilver Mace|c|K|1000|2|6|54 Ice|36|||Club +6|3|10
Moonsilver Sceptre|r|D|1000|1|||||6|ML +6, Ice ML +1, Healing ML +2|2|10
Morning Star|c||0|1|25||11|||||1
Mortal Mace|c|K|220|1|8|44 Death|27||||2|3
Muck Rod|r|D|65|||||85 Earth|4|||2
Musician's Bow|b||0|2|||||4||3|2
Mycological Bow|b|P|105|2|+4||||6||3|2|+4
Mycological Mace|c||120|1|50||31|||Club +1|1|2
Mystic Blade|s||60|1|44||25||||2|2
Mythril Axe|a||80|1|48||28||||2|10
Naga Axe|a|K|300|1|8|44 Energy|31|||Axe +2|2|10
Naga Club|c|K|300|1|52||31|||Club +2|2|10
Naga Crossbow|x|P|300|2|+8||||6|Distance +1|3|10|+6
Naga Katar|f|M|300|2|43||21|||Fist +3, ML +1|2|10
Naga Quiver|q|P|250
Naga Rod|r|D|250|||||90-110 Ice|5|ML +2, Ice ML +1|2|10
Naga Sword|s|K|300|1|8|44 Ice|31|||Sword +2|2|10
Naga Wand|w|S|250|||||90-120 Energy|5|ML +2, Energy ML +1|2|10
Naginata|a||25|2|39||25|||||2
Necrotic Rod|r|D|19|||||30 Death|3|||1
Nightmare Blade|s||70|1|46||23||||2|2
Noble Axe|a||35|1|39||22||||2|2
Northern Star|c||50|1|42||15|||||2
Northwind Rod|r|D|22|||||30 Ice|3||2|1
Nunchaku of Destruction|f|M|200|2|40||17||||3|2
Nunchaku of Enlightenment|f|M|50|2|33||15||||1|1
Nunchaku|f|M|40|2|31||15|||Fist +1||1
Obsidian Lance|a||20|2|34||10|||||1
Obsidian Truncheon|c||100|1|50||30||||1|3
Ogre Choppa|a||25|2|39||23|||||2
Ogre Klubba|c||50|2|45||25|||||2
Ogre Scepta|r|D|37|||||65 Earth|3||2|2
One Hit Wonder|c||70|2|49||22|||||10
Onyx Flail|c||65|1|45||18||||2|2
Orcish Axe|a||0|1|23||12|||||1
Orcish Maul|c||35|2|42||18||||3|2
Ornamented Axe|a||50|1|42||22|||||2
Ornate Crossbow|x|P|50|2|+1||||6|||2|+2
Ornate Mace|c||90|1|49||24||||2|2
Pair of Iron Fists|f|M|80|2|38||15||||2|2
Pair of Monk Fists|f|M|10|2|21||14|||Fist +1||1
Phantasmal Axe|a|K|180|2|5|49 Fire|32|||Axe +2|2|3
Pharaoh Sword|s||45|1|41||23|||||3
Plague Bite|a||150|1|26|26 Earth|31|||||10
Poet's Fencing Quill|s||0|1|10||8|||||2
Pointed Rabbitslayer|s||0|1|16||8|||||2
Poison Dagger|s||0|1|16|2 Earth|8|||||1
Queen's Sceptre|c||55|1|43||19||||2|3
Quiver|q|P|0
Rapier|s||0|1|10||8|||||1
Ratana|s||15|1|27||19|||||1
Ravager's Axe|a|K|70|2|49||14||||3|3
Ravenwing|a||65|1|45||22|||||10
Reaper's Axe|a||70|1|46||25|||||3
Red Quiver|q|P|0
Refined Bow|b||0|2|||||6|chance to hit +1%||1
Relic Sword|s||50|1|42||24||||2|2
Rending Inferniarch Arbalest|x|P|300|2|+8||||6|Distance +2|2|10|+6
Rending Inferniarch Battleaxe|a|K|300|1|8|44 Fire|31|||Axe +3|1|10
Rending Inferniarch Blade|s|K|300|1|8|44 Fire|31|||Sword +3|1|10
Rending Inferniarch Bow|b|P|300|2|+7||||6|Distance +2|2|10|+5
Rending Inferniarch Claws|f|M|300|2|43||21|||Fist +4|1|10
Rending Inferniarch Flail|c|K|300|1|8|44 Death|31|||Club +3|1|10
Rending Inferniarch Greataxe|a|K|300|2|8|48 Fire|33|||Axe +4|1|10
Rending Inferniarch Rod|r|D|300|||||90-110 Earth|5|ML +3, Earth ML +1|1|10
Rending Inferniarch Slayer|s|K|300|2|8|48 Energy|33|||Sword +4|1|10
Rending Inferniarch Wand|w|S|300|||||95-115 Death|5|ML +3, Fire ML +1|1|10
Rending Inferniarch Warhammer|c|K|300|2|8|48 Ice|33|||Club +4|1|10
Resizer|c|K|230|2|11|45 Ice|33|||Club +1|2|3
Rift Bow|b|P|120|2|+5||||7||3|2|+3
Rift Crossbow|x|P|120|2|+5||||5||3|2|+4
Rift Lance|a||70|2|48||28||||3|2
Ripper Lance|a||0|2|28||7|||||2
Ritual Bone Knife|s||0|1|5||1||||0|1
Rod of Destruction|r|D|200|1||||88 Ice|4||2|2
Ron the Ripper's Sabre|s||0|1|12||10|||||3
Rotten Demonbone|c||80|1|46||40||||2|3
Royal Axe|a||75|1|47||25||||2|2
Royal Crossbow|x|P|130|2|+5||||6||3|3|+3
Royal Spear|t||25|1|35||0||3
Royal Star|t||120|1|64|2 Fire|0||5
Runed Sword|s||65|1|45||32||||2|2
Ruthless Axe|a|K|75|2|50||15||||2|2
Sabre|s||0|1|12||10|||||1
Sai of Enlightenment|f|M|100|2|40||16||||1|1
Sai|f|M|60|2|36||16|||Fist +1|1|1
Sanguine Battleaxe|a|K|600|2|8|50 Death|35|||Axe +4|3|10
Sanguine Blade|s|K|600|1|8|46 Fire|32|||Sword +4|2|10
Sanguine Bludgeon|c|K|600|2|8|50 Earth|35|||Club +4|3|10
Sanguine Bow|b|P|600|2|+9||||6|Distance +3|3|10|+6
Sanguine Claws|f|M|600|2|45||21|||Fist +4, ML +2|3|10
Sanguine Coil|w|S|600|||||114 Fire||ML +4, Fire ML +1, Energy ML +1|2|10
Sanguine Crossbow|x|P|600|2|+10||||6|Distance +3|3|10|+7
Sanguine Cudgel|c|K|600|1|8|46 Death|32|||Club +4|2|10
Sanguine Hatchet|a|K|600|1|8|46 Fire|32|||Axe +4|2|10
Sanguine Razor|s|K|600|2|8|50 Energy|35|||Sword +4|3|10
Sanguine Rod|r|D|600|||||112 Earth|6|ML +4, Ice ML +1, Earth ML +1|2|10
Sapphire Hammer|c||30|1|37||18||||2|2
Scimitar|s||0|1|19||13|||||1
Scythe of the Reaper|a||0|2|16||6|||||2
Scythe|c||0|2|8||3|||||1
Serpent Sword|s||0|1|18|8 Earth|15|||||1
Shadow Sceptre|c||35|1|39||17||||2|2
Shimmer Bow|b|P|40|2|+1||||6||||+7
Shimmer Rod|r|D|40||0|||65 Ice|4
Shimmer Sword|s||40|1|42||20
Shimmer Wand|w|S|40||0|||65 Energy|4
Shiny Blade|s||120|1|49||35|||Sword +1|1|2
Short Sword|s||0|1|11||11|||||1
Sickle|a||0|1|5||4|||||1
Silkweaver Bow|b|P|40|2|||||6||3|2|+3
Silver Dagger|s||0|1|9||7|||||1
Silver Mace|c||45|1|41||30||||2|3
Simple Jo Staff|f|M|0|2|12||8|||Fist +1||1
Siphoning Inferniarch Arbalest|x|P|300|2|+8||||6|Distance +2|2|10|+6
Siphoning Inferniarch Battleaxe|a|K|300|1|8|44 Fire|31|||Axe +3|1|10
Siphoning Inferniarch Blade|s|K|300|1|8|44 Fire|31|||Sword +3|1|10
Siphoning Inferniarch Bow|b|P|300|2|+7||||6|Distance +2|2|10|+5
Siphoning Inferniarch Claws|f|M|300|2|43||21|||Fist +4|1|10
Siphoning Inferniarch Flail|c|K|300|1|8|44 Death|31|||Club +3|1|10
Siphoning Inferniarch Greataxe|a|K|300|2|8|48 Fire|33|||Axe +4|1|10
Siphoning Inferniarch Rod|r|D|300|||||90-110 Earth|5|ML +3, Earth ML +1|1|10
Siphoning Inferniarch Slayer|s|K|300|2|8|48 Energy|33|||Sword +4|1|10
Siphoning Inferniarch Wand|w|S|300|||||95-115 Death|5|ML +3, Fire ML +1|1|10
Siphoning Inferniarch Warhammer|c|K|300|2|8|48 Ice|33|||Club +4|1|10
Skull Staff|c||30|1|36||12||||2|2
Skullcrusher|c|K|85|2|51||20||||2|3
Slayer of Destruction|s|K|200|2|52||30||||3|2
Small Stone|t||0|1|5||0||4
Snake God's Sceptre|c||82|1|48||29||||2|3
Snakebite Rod|r|D|6|||||13 Earth|3|||1
Snowball with Ice Shards|t||0|1|25||0
Snowball|t||0|1|0||0
Solar Axe|a||130|1|52||29||||1|10
Sorcerer and Druid Staff|w||0|||||25 Energy|3
Soulbiter|a|K|400|1|7|45 Death|32|||Axe +4|2|10
Soulbleeder|b|P|400|2|+8||||6|Distance +3|3|10|+5
Soulcrusher|c|K|400|1|6|46 Ice|33|||Club +5|2|10
Soulcutter|s|K|400|1|7|45 Death|32|||Sword +4|2|10
Souleater|a|K|400|2|10|47 Ice|34|||Axe +4|3|10||Souleater (Axe)
Soulhexer|r|D|400|||||98-118 Ice|6|ML +4|2|10
Soulkamas|f|M|400|2|44||21|||Fist +4, ML +1|3|10
Soulmaimer|c|K|400|2|10|47 Energy|35|||Club +4|3|10
Soulpiercer|x|P|400|2|+9||||6|Distance +3|3|10|+6
Soulshredder|s|K|400|2|10|47 Ice|35|||Sword +4|3|10
Soultainter|w|S|400|||||100-120 Death|6|ML +4|2|10
Spear|t||0|1|25||0||3
Spike Sword|s||0|1|24||21||||2|1
Spiked Squelcher|c|K|30|2|41||21||||3|2
Spiky Club|c||20|1|31||14|||||1
Springsprout Rod|r|D|37|||||65 Earth|3|||1
Staff|f||15|2|22||14|||||1
Stale Bread of Ancientness|c||0|1|18||8|||||2
Steel Axe|a||0|1|21||10|||||1
Stellar Moonsilver Axe|a|K|1000|1|6|50 Earth|33|||Axe +6|2|10
Stellar Moonsilver Bow|b|P|1000|2|+10||||6|Distance +5|3|10|+7
Stellar Moonsilver Channeler|w|S|1000|1|||||6|ML +6, Death ML +1|2|10
Stellar Moonsilver Chopper|a|K|1000|2|6|54 Energy|36|||Axe +6|3|10
Stellar Moonsilver Claymore|s|K|1000|2|6|54 Fire|36|||Sword +6|3|10
Stellar Moonsilver Crossbow|x|P|1000|2|+11||||6|Distance +5|3|10|+8
Stellar Moonsilver Crusher|c|K|1000|1|6|50 Earth|33|||Club +6|2|10
Stellar Moonsilver Epee|s|K|1000|1|6|50 Earth|33|||Sword +6|2|10
Stellar Moonsilver Katar|f|M|1000|2|46||22|||Fist +6, ML +2|3|10
Stellar Moonsilver Mace|c|K|1000|2|6|54 Ice|36|||Club +6|3|10
Stellar Moonsilver Sceptre|r|D|1000|1|||||6|ML +6, Ice ML +1, Healing ML +2|2|10
Stonecutter Axe|a||90|1|50||30||||1|2
Strange Mallet|c||0|1|18||9
Studded Club|c||0|1|9||8|||||1
Sulphurous Demonbone|c||80|1|46||40||||2|3
Summerblade|s|K|200|1|10|41 Fire|20||||2|3
Swampling Club|c||0|1|17||12|||||1
Sword|s||0|1|14||12||||2|1
Tagralt Blade|s|K|250|2|7|49 Earth|32|||Sword +3|2|2
Taurus Mace|c||20|2|30||18|||||1
Templar Scytheblade|s||0|1|23||15|||||1
Terra Rod|r|D|26|||||45 Earth|3|||1
Thaian Sword|s|K|50|2|45||29||||3|2
The Avenger|s|K|75|2|50||38||||2|2
The Calamity|s|K|100|2|51||35|||||3
The Chiller|r|D|0|||||6 Ice|4
The Devileye|x|P|100|2|+20||||6||3|10|-20
The Epiphany|s||120|1|50||35||||1|10
The Ironworker|x|P|80|2|+4||||5||3|2
The Justice Seeker|s||75|1|47||24|||||2
The Scorcher|w|S|0|||||4 Fire|3
The Stomper|c|K|100|2|51||20||||2|3
Thorn Spitter|x||150|2|+9||||6||3|3|+1
Throwing Axe|a|K|150|1|51||30|||Axe +2|1|10
Throwing Cake|t||0|1|0||0
Throwing Knife|t||0|1|25||0||4
Throwing Star of Sula|t||0|1|250||0
Throwing Star|t||0|1|30||0||4
Thunder Hammer|c||85|1|49||35||||2|10
Titan Axe|a|K|40|2|43||30|||||2
Traditional Sai|f|M|30|2|27||15||||2|2
Triple Bolt Crossbow|x|P|70|2|+3||||5||3|10|+2
Twiceslicer|s|K|58|2|47||30||||3|2
Twin Axe|a|K|50|2|45||24||||3|3
Twin Hooks|s|K|20|2|32||22||||3|1
Two Handed Sword|s|K|20|2|30||25|||||1
Umbral Axe|a|K|120|1|51||27||||1|3
Umbral Blade|s|K|120|1|50||29||||1|3
Umbral Bow|b|P|120|2|+4||||7||1|3|+5
Umbral Chopper|a|K|120|2|52||30||||1|3
Umbral Crossbow|x|P|120|2|+6||||5||1|3|+2
Umbral Hammer|c|K|120|2|53||30||||1|3
Umbral Katar|f|M|120|2|40||17|||Fist +2|1|3
Umbral Mace|c|K|120|1|50||26||||1|3
Umbral Master Axe|a|K|250|1|53||30|||Axe +1|1|10
Umbral Master Bow|b|P|250|2|+6||||7|Distance +3|2|10|+5
Umbral Master Chopper|a|K|250|2|54||34|||Axe +3|2|10
Umbral Master Crossbow|x|P|250|2|+9||||5|Distance +3|2|10|+4
Umbral Master Hammer|c|K|250|2|55||34|||Club +3|2|10
Umbral Master Katar|f|M|250|2|41||18|||Fist +3|2|10
Umbral Master Mace|c|K|250|1|52||30|||Club +1|1|10
Umbral Master Slayer|s|K|250|2|54||35|||Sword +3|2|10
Umbral Masterblade|s|K|250|1|52||31|||Sword +1|1|10
Umbral Slayer|s|K|120|2|52||31||||1|3
Underworld Rod|r|D|42|||||65 Death|3||2|1
Unliving Demonbone|c||80|1|46||40||||2|3
Vile Axe|a||55|1|43||19|||||2
Viper Star|t||0|1|28||0||4
Wand of Cosmic Energy|w|S|26||0|||45 Energy|3|||1
Wand of Darkness|w|S|41|||||85 Death|4|ML +2
Wand of Decay|w|S|19|||||30 Death|3|||1
Wand of Defiance|w|S|65|||||85 Energy|4|||2
Wand of Destruction|w|S|200|||||88 Energy|4||2|2
Wand of Dimensions|w|S|37|||||55 Energy|3|||10
Wand of Draconia|w|S|22|||||30 Fire|3||2|1
Wand of Dragonbreath|w|S|13|||||19 Fire|3||2|1
Wand of Everblazing|w|S|65|||||85 Fire|4|||2
Wand of Inferno|w|S|33|||||65 Fire|3|||1
Wand of Starstorm|w|S|37|||||65 Energy|3||2|1
Wand of Voodoo|w|S|42|||||65 Death|3||2|1
Wand of Vortex|w|S|6|||||13 Energy|3|||1
War Axe|a|K|65|2|48||10||||3|2
War Hammer|c|K|50|2|45||10||||3|1
Warlord Sword|s|K|120|2|53||38|||||10
Warrior's Axe|a||40|1|42||21||||2|2
Warsinger Bow|b|P|80|2|+3||||7||3|3|+5
Winterblade|s|K|200|1|10|40 Ice|22||||2|3
Wooden Sword|s||0|1|7||7
Wyvern Fang|s||25|1|32||19||||2|2
Yol's Bow|b|P|60|2|||||7|||10|+7
Zaoan Halberd|a||25|2|37||15||||3|1
Zaoan Sword|s||55|1|43||18||||2|2`;
