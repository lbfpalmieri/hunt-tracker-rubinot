/**
 * Itens de loot da TibiaWiki (tibia.fandom.com, extraídos em 2026-11-25) pra dar um preço de NPC
 * padrão e uma categoria a cada item da sessão. Um por linha, campos separados por "|":
 *
 *   nome|preço de NPC (0 = NPC não compra / sem dado)|categorias
 *
 * categorias (letras juntas): p = Creature Products, v = Valuables (gemas e joias), t = item de task
 * (categoria "Task Items" da wiki: Weekly/Delivery Task), i = material de imbuement (tabela da página
 * "Imbuing"). Equipamentos e moedas NÃO estão aqui: vêm de equipment-data/weapons-data e de
 * loot-value.ts. Item novo do jogo = refazer a extração. Lido por src/lib/item-info.ts.
 */
export const ITEM_INFO_TSV = `Abacus (Replica)|0|v
Abomination's Eye|650000|p
Abomination's Tail|700000|p
Abomination's Tongue|950000|p
Abridged Promotion Scroll|0|v
Abyssador's Lash|0|p
Acorn|10|p
Advanced Promotion Scroll|0|v
Afflicted Strider Head|900|pt
Afflicted Strider Worms|500|pt
Albino Dragon Leather|0|p
Alloy Legs|11000|t
Almost a Treasure|1200|p
Alptramun's Toothbrush|270000|p
Amber (Item)|20000|v
Amber Souvenir|850|pt
Amber with a Bug|41000|v
Amber with a Dragonfly|56000|v
Ancient Belt Buckle|260|pt
Ancient Coin|350|v
Ancient Crypt Rune|0|p
Ancient Eye Stalk|3500000|p
Ancient Liche Bone|28000|p
Ancient Scales|400000|p
Ancient Stone|200|pt
Ancient Watch|0|p
Angel Figurine|36000|v
Angelic Axe|5000|t
Antlers|50|p
Ape Fur|120|p
Apron|1300|pt
Arbaziloth Shoulder Piece|450000|p
Arcane Staff (Unknown)|0|v
Arena Badge|0|v
Arena Badge Replica|0|v
Assassin Doll (Replica)|0|v
Astral Glyph|0|p
Astral Source|0|p
Atab's Mitmah Helmet|580|p
Auric Moon Sigil|0|v
Axe of Sir Leonard|49000|p
Babel Swimmer|0|v
Badger Boots|7500|t
Badger Fur|15|p
Bag of Oriental Spices (Replica)|0|v
Bag You Covet|0|v
Bag You Desire|0|v
Bakragore's Amalgamation|2000000|p
Bamboo Stick|30|p
Banana Sash|55|pt
Bar of Gold|10000|v
Basalt Core|5800|pt
Basalt Crumbs|3000|pt
Basalt Fetish|210|pt
Basalt Figurine|160|pt
Bashmu Fang|600|pt
Bashmu Feather|350|pt
Bashmu Tongue|400|pt
Basic Promotion Scroll|0|v
Bat Decoration|2000|p
Bat Wing|50|p
Battle Shield|95|t
Battle Stone|290|ip
Battle Tactics|0|v
Bear Paw|100|p
Beast's Nightmare-Cushion|630000|p
Beaver of Wisdom (Replica)|0|v
Bed of Nails|500|p
Beetle Carapace|200|p
Behemoth Claw|2000|p
Beijinho|2780|p
Black Hood|190|p
Black Pearl|280|v
Black Shield|800|t
Black Wool|300|p
Blazing Bone|610|ip
Blemished Spawn Abdomen|550|pt
Blemished Spawn Head|800|pt
Blemished Spawn Tail|1000|pt
Bloated Maggot|5200|pt
Blood Amulet|1230|pt
Blood Coin|0|v
Blood Crown|116000|p
Blood Goblet|10000|v
Blood Hood|1550|pt
Blood Onyx|12200|p
Blood Onyx Core|64000|p
Blood Preservation|320|pt
Blood Sceptre|178000|p
Blood Tincture in a Vial|360|pt
Blooded Worm|4700|pt
Bloodshot Giant Eye|1820|pt
Bloodstained Scythe|4200|p
Bloody Dwarven Beard|110|p
Bloody Pincers|100|ip
Bloody Tears|70000|p
Blue Crystal Shard|1500|v
Blue Crystal Splinter|400|v
Blue Gem|5000|v
Blue Glass Plate|60|v
Blue Goanna Scale|230|pt
Blue Piece of Cloth|200|p
Boar Man Hoof|600|pt
Boggy Dreads|200|pt
Bola|35|pt
Bolfrim's Golden Bug Trophy|0|v
Bone Club|5|t
Bone Fetish|150|pt
Bone Fibula|580|pt
Bone Rattle|790|pt
Bone Shoulderplate|150|pt
Bone Spikes|1500000|p
Bone Toothpick|150|pt
Bonebreaker|10000|t
Bonecarving Knife|190|pt
Bonelord Eye|80|p
Bonelord Tome (Replica)|0|v
Bones of Zorvorax|10000|p
Bony Tail|210|pt
Book of Faith|0|pt
Book of Necromantic Rituals|180|pt
Book of Prayers|120|p
Book Page|640|pt
Book with a Dragon|1800|pt
Book with an Hourglass|1450|pt
Bookworm Doll (Replica)|0|v
Bottled Dragon Breath|0|p
Bowl of Terror Sweat|500|pt
Bracelet of Strengthening|0|v
Brain Head's Brain|0|p
Brain Head's Giant Neuron|100000|p
Brain Head's Left Hemisphere|90000|p
Brain Head's Right Hemisphere|50000|p
Brainstealer's Brain|300000|p
Brainstealer's Brainwave|440000|p
Brainstealer's Tissue|240000|p
Brigadeiro|2640|pt
Bright Bell|220|p
Brimstone Fangs|380|ip
Brimstone Shell|210|ip
Brinebrute Claw|2600|pt
Broadsword|500|t
Broken Arrow|0|pt
Broken Blood Onyx Amulet|214000|p
Broken Crossbow|30|p
Broken Draken Mail|340|pt
Broken Gladiator Shield|190|pt
Broken Gullet Lenses|3750|p
Broken Halberd|100|pt
Broken Helmet|20|p
Broken Iks Cuirass|640|p
Broken Iks Faulds|530|p
Broken Iks Headpiece|560|p
Broken Iks Sandals|440|p
Broken Key Ring|8000|p
Broken Longbow|130|p
Broken Macuahuitl|1000|p
Broken Mitmah Chestplate|85000|p
Broken Mitmah Necklace|210|pt
Broken Ring of Ending|4000|p
Broken Shamanic Staff|35|ip
Broken Slicer|120|pt
Broken Staff of Mind Control|1250000|p
Broken Throwing Axe|230|pt
Broken Visor|1900|p
Brooch of Embracement|14000|v
Broodrider Saddle|2800|pt
Brown Crystal Splinter|400|v
Brown Piece of Cloth|100|p
Brutus Bloodbeard's Hat|0|p
Buckle|7000|t
Bulltaur Armor Scrap|480|pt
Bulltaur Hoof|540|pt
Bulltaur Horn|385|pt
Bunch of Troll Hair|30|p
Bundle of Cursed Straw|800|pt
Burnt Out Devourer Core|0|p
Bursa Obscura|0|v
Capricious Heart|2100|pt
Capricious Robe|1200|pt
Carniphila Seeds|50|p
Carnisylvan Bark|230|pt
Carnisylvan Finger|250|pt
Carnivostrich Feather|630|pt
Carrion Worm Fang|35|p
Cat's Paw|2000|pt
Catnip|580|p
Cave Chimera Head|1200|pt
Cave Chimera Leg|650|pt
Cave Devourer Eyes|550|pt
Cave Devourer Legs|350|pt
Cave Devourer Maw|600|pt
Cavebear Skull|550|p
Centipede Leg|28|pt
Ceremonial Bowl|0|pt
Cerulean Abyss|0|v
Chagorz Igneous Obsidian|1100000|p
Chain Leash|970|pt
Chaos Mace|9000|t
Chasm Spawn Abdomen|240|pt
Chasm Spawn Head|850|pt
Chasm Spawn Tail|120|pt
Cheese Cutter|50|pt
Cheese of Pestilence|15000|p
Cheese of Plague|15000|p
Cheese of Rot|15000|p
Cheesy Figurine|150|pt
Cheesy Membership Card|120000|p
Chicken Feather|30|p
Chitinous Mouth (Baron from Below)|10000|p
Chitinous Mouth (Count of the Core)|10000|p
Christmas Present Bag|0|p
Christmas Token|0|pv
Churro Heart|2680|p
Citizen Doll (Replica)|0|v
Claw of 'The Noxious Spawn'|15000|p
Cliff Strider Claw|800|p
Closed Pocket Sundial|5000|p
Cloud Familiar|0|pt
Cluster of Crystallized Death|9000|pt
Cluster of Solace|0|p
CM Token (15th Anniversary)|0|v
Coal|20|p
Coal Eyes|0|p
Cobalt Ridge|0|v
Cobra Crest|650|pt
Cobra Tongue|15|p
Cockroach Leg|0|p
Colourful Feather|110|pt
Colourful Feathers|400|p
Colourful Quill|110000|p
Colourful Snail Shell|250|pt
Combat Knife|1|t
Compass|45|ip
Compound Eye|150|pt
Condensed Energy|260|p
Condensed Greed|4000|p
Cookbook|0|t
Cookbook (Creature Product)|870|p
Copper Token|0|v
Coral Branch|360|pt
Coral Brooch|750|v
Corrupt Naga Scales|570|p
Corrupted Flag|700|p
Countess Sorrow's Frozen Tear|50000|pv
Cow Bell|120|p
Cowbell|210|pt
Crab Man Claws|550|pt
Crab Pincers|35|p
Cracked Alabaster Vase|180|pt
Crackling Egg|0|v
Crawler Head Plating|210|ip
Crawler's Essence|3700|pt
Crimson Doll (Replica)|0|v
Crown (Plant)|2700|pt
Cruelty's Chest|720000|p
Cruelty's Claw|640000|p
Crunor Idol|30000|v
Cry-Stal|3200|pt
Cryptic Fossil|0|p
Crystal Bone|250|pt
Crystal Coin|10000|v
Crystal Crossbow|35000|t
Crystal Mace|12000|t
Crystal of Balance|1000|v
Crystal of Focus|2000|v
Crystal of Power|3000|v
Crystal of the Mitmah|280|pt
Crystal Sword|600|t
Crystal Wand|10000|v
Crystalline Armor|16000|t
Crystalline Spikes|440|pt
Crystalline Sword|0|t
Crystallised Blood|270000|p
Crystallized Anger|400|ip
Crystallized Death|3000|pt
Cuirass Plate|1000|pt
Cultish Mask|280|ip
Cultish Robe|150|ip
Cultish Symbol|500|p
Cup of Molten Gold|0|v
Curious Matter|430|pt
Curl of Hair|320000|p
Cursed Bone|6000|p
Cursed Gold|0|v
Cursed Shoulder Spikes|320|pt
Cursed Wood|0|v
Cyan Crystal Fragment|800|v
Cyclops Toe|55|ip
Damaged Armor Plates|280|pt
Damaged Worm Head|8000|p
Damselfly Eye|25|pt
Damselfly Wing|20|ip
Dandelion Seeds|200|pt
Dangerous Proto Matter|300|pt
Dark Bell|250|p
Dark Bell (Silver)|310000|p
Dark Chocolate Coin|0|v
Dark Obsidian Splinter|4400|pt
Dark Rosary|48|pt
Dark Shield|400|t
Darklight Basalt Chunk|3800|pt
Darklight Core (Object)|4100|pt
Darklight Figurine|3400000|p
Darklight Geode|0|v
Darklight Heart|0|p
Darklight Matter (Object)|5500|pt
Dead Weight|450|pt
Deadeye Devious' Eye Patch|0|p
Deadly Fangs|5500|pt
Deathly Crypt Rune|0|p
Deathstrike's Snippet|0|p
Decayed Finger Bone|5100|pt
Deepling Breaktime Snack|90|pt
Deepling Claw|430|pt
Deepling Guard Belt Buckle|230|pt
Deepling Ridge|360|pt
Deepling Scales|80|pt
Deepling Warts|180|ip
Deeptags|290|pt
Deepworm Jaws|500|pt
Deepworm Spike Roots|650|pt
Deepworm Spikes|800|pt
Delany's Golden Bug Trophy|0|v
Demon Claws|0|p
Demon Dust|300|p
Demon Horn|1000|ip
Demon in a Golden Box|0|v
Demon in a Green Box|0|v
Demon in a Red Box|0|v
Demon Root|950|pt
Demon Skull|0|p
Demonic Core Essence|0|p
Demonic Essence|1000|p
Demonic Finger|1000|p
Demonic Matter|0|pt
Demonic Skeletal Hand|80|ip
Devourer Core|0|p
Dewberry Palm Leaf|0|p
Diabolic Skull|19000|v
Diamond|15000|v
Diamond Sceptre|3000|t
Diremaw Brainpan|350|pt
Diremaw Legs|270|pt
Dirty Turban|120|pt
Distorted Heart|2100|pt
Distorted Robe|1200|pt
Doll of Durin The Almighty (Replica)|0|v
Double Axe|260|t
Downy Feather|20|p
Dowser|35|pt
Dracola's Eye|50000|p
Dracoyle Statue|5000|p
Dracoyle Statue (Enchanted)|5000|p
Dragolisk Eye|690|pt
Dragolisk Poison Gland|475|pt
Dragon Blood|700|p
Dragon Claw|8000|p
Dragon Claw (Green)|0|p
Dragon Crown|0|p
Dragon Eye (Replica)|0|v
Dragon Figurine|45000|v
Dragon Goblet (Replica)|0|v
Dragon Hammer|2000|t
Dragon Priest's Wandtip|175|pt
Dragon Slayer|15000|t
Dragon Tongue|550|pt
Dragon's Tail|100|pt
Draken Doll (Replica)|0|v
Draken Sulphur|550|ip
Draken Wristbands|430|pt
Draptor Scales|800|p
Dream Essence Egg|205|pt
Dream Matter|0|p
Dream Warden Claw|0|p
Dream Warden Mask|0|p
Drome Cube|0|v
Dubious Piece of Cloth|0|p
Dung Ball|130|pt
Dwarven Beard|0|p
Earflap|40|pt
Egg of The Many|15000|p
Elder Bonelord Tentacle|150|pt
Eldritch Casket|0|v
Eldritch Crystal|48000|v
Elemental Spikes|0|p
Elven Astral Observer|90|pt
Elven Hoof|115|ip
Elven Scouting Glass|50|ip
Elvish Talisman|45|ip
Emblem (Replica)|0|v
Emerald Bangle|800|v
Emerald Tortoise Shell|2150|pt
Empty Honey Glass|270|pt
Enchanted Chicken Wing|20000|p
Encrypted Notes|620|pt
Encyclopedia (Replica)|0|v
Energy Ball|300|pt
Energy Soil|2000|p
Energy Vein|270|ip
Ensouled Essence|820|pt
Essence of a Bad Dream|360|pt
Eternal Flames|5000|p
Exalted Core|0|t
Exalted Seal|190000|p
Execowtioner Mask|240|pt
Extended Promotion Scroll|0|v
Eye of a Deepling|150|pt
Eye of a Weeper|650|pt
Eye of Corruption|390|pt
Eye of Greed|600|p
Eye of the Chasm|0|v
Eye Patch|0|p
Eye-Embroidered Veil|0|v
Eyeless Devourer Legs|650|pt
Eyeless Devourer Maw|420|pt
Eyeless Devourer Tongue|900|pt
Fafnar Symbol|950|pt
Fairy Wings|200|ip
Falcon Crest|650|pt
Ferumbras' Hat|10000|p
Ferumbras' Mana Keg|0|pv
Ferumbras' Mana Keg (Used)|0|v
Fetid Heart|0|p
Fiery Crypt Rune|0|p
Fiery Heart|375|ip
Fiery Horseshoe|0|v
Fiery Tear|1070000|v
Fig Leaf|200|pt
Figurine of Bakragore|5400000|p
Figurine of Cruelty|3100000|p
Figurine of Greed|2900000|p
Figurine of Hatred|2700000|p
Figurine of Maior Domus|3400000|p
Figurine of Malice|2800000|p
Figurine of Megalomania|5000000|p
Figurine of Mimar Haffar|2800000|p
Figurine of Phosphorus|5700000|p
Figurine of Spite|3000000|p
Fir Cone|25|pt
Fire Axe|8000|t
Firefighting Axe|0|v
Fireworks Capsule|0|p
Fish Eye|500000|p
Fish Fin|150|p
Flames of the Percht Queen|0|p
Flask of Demonic Blood|0|pt
Flask of Embalming Fluid|30|ip
Flask of Warrior's Sweat|10000|p
Flawless Ice Crystal|5000|p
Flintstone|800|p
Flotsam|330|pt
Foam Stalker Spume|0|p
Focus Cape|6000|t
Forbidden Fruit|0|p
Forbidden Tome|0|p
Fox Paw|100|pt
Frazzle Skin|400|ip
Frazzle Tongue|700|pt
Friendship Amulet (Replica)|0|v
Frost Giant Pelt|160|p
Frosty Ear of a Troll|30|p
Frosty Heart|280|ip
Frozen Chain|0|p
Frozen Claw|0|p
Frozen Claw (Ice Horror)|900000|p
Frozen Crapace|500000|p
Frozen Heart (Replica)|0|v
Frozen Lightning|270|pt
Frozen Peacock Feather|110000|p
Frozen Time|0|p
Fungal Blister|0|p
Fur Armor|5000|t
Fur Shred|200|p
Gauze Bandage|90|pt
Gear Crystal|200|p
Gear Wheel|500|p
Gemmed Figurine|3500|v
Geomancer's Robe|80|p
Geomancer's Staff|120|p
Ghastly Dragon Head|700|pt
Ghostly Tissue|90|p
Ghoul Snack|60|p
Giant Amethyst|60000|v
Giant Crab Pincer|950|p
Giant Emerald|90000|v
Giant Eye|380|p
Giant Pacifier|170|pt
Giant Ruby|70000|v
Giant Sapphire|50000|v
Giant Shimmering Pearl|3000|v
Giant Shimmering Pearl (Brown)|3000|v
Giant Shimmering Pearl (Green)|3000|v
Giant Tentacle|10000|p
Giant Topaz|80000|v
Giant Tusk|6000|pt
Gilded Bell|0|p
Girlish Hair Decoration|30|pt
Girtablilu Warrior Carapace|520|pt
Glacier Mask|2500|t
Glacier Robe|11000|t
Glacier Shoes|2500|t
Gland|500|p
Glimmering Soil|2000|p
Glistening Bone|250|p
Glob of Acid Slime|25|pt
Glob of Glooth|125|pt
Glob of Mercury|20|p
Glob of Tar|30|pt
Gloom Wolf Fur|70|ip
Glooth Axe|1500|t
Glooth Bag|0|v
Glooth Blade|1500|t
Glooth Cape|7000|t
Glooth Club|1500|t
Glooth Glider Blueprint|0|v
Glooth Glider Casing|0|v
Glooth Glider Crank|0|v
Glooth Glider Gear Wheel|0|v
Glooth Glider Hinge|0|v
Glooth Glider Tubes and Wires|0|v
Glooth Injection Tube|350|pt
Glorious Axe|3000|t
Glowing Carrot|0|p
Glowing Rune|350|pt
Gnomevil's Hat|0|p
Gnomish Supply Package|0|v
Goanna Claw|260|pt
Goanna Meat|190|pt
Goblet of Gloom|12000|v
Goblin Ear|20|p
Gold Coin|1|v
Gold Ingot|5000|v
Gold Nugget|850|v
Gold Token|0|v
Gold Tooth|120|pt
Gold-Brocaded Cloth|175|ip
Gold-Scaled Sentinel|380000|p
Golden Bell|0|p
Golden Belt|0|pt
Golden Bijou|0|v
Golden Brush|250|p
Golden Cheese Wedge|6000|v
Golden Claw|250000|p
Golden Cotton Reel|0|p
Golden Dustbin|7000|v
Golden Fafnar Trophy|10000|v
Golden Falcon (Replica)|0|v
Golden Horseshoe|0|v
Golden Legs|30000|t
Golden Lotus Brooch|270|ptv
Golden Newspaper (Replica)|0|v
Golden Raid Token|0|v
Golden Rune Emblem (Animate Dead)|0|v
Golden Rune Emblem (Avalanche)|0|v
Golden Rune Emblem (Chameleon)|0|v
Golden Rune Emblem (Destroy Field)|0|v
Golden Rune Emblem (Disintegrate)|0|v
Golden Rune Emblem (Energy Bomb)|0|v
Golden Rune Emblem (Energy Wall)|0|v
Golden Rune Emblem (Explosion)|0|v
Golden Rune Emblem (Fire Field)|0|v
Golden Rune Emblem (Fireball)|0|v
Golden Rune Emblem (Firebomb)|0|v
Golden Rune Emblem (Great Fireball)|0|v
Golden Rune Emblem (Heavy Magic Missile)|0|v
Golden Rune Emblem (Holy Missile)|0|v
Golden Rune Emblem (Icicle)|0|v
Golden Rune Emblem (Light Magic Missile)|0|v
Golden Rune Emblem (Magic Wall)|0|v
Golden Rune Emblem (Paralyze)|0|v
Golden Rune Emblem (Poison Bomb)|0|v
Golden Rune Emblem (Soulfire)|0|v
Golden Rune Emblem (Sudden Death)|0|v
Golden Rune Emblem (Thunderstorm)|0|v
Golden Rune Emblem (Ultimate Healing)|0|v
Golden Rune Emblem (Wild Growth)|0|v
Golden Sickle|1000|t
Golden Skull|9000|v
Golden Sun Coin|11000|pt
Golden Talon|0|p
Golden Tiger Coin|11000|p
Gooey Mass|0|v
Goosebump Leather|650|ip
Gore Horn (Item)|2900|pt
Gorerilla Mane|2750|pt
Gorerilla Tail|2650|pt
Gorger Antlers|2250|pt
Goromaphone (Replica)|0|v
Grant of Arms|950|p
Grappling Hook|150|pt
Greasy Wool|0|p
Greater Fragment|2500|v
Greater Guardian Gem|10000|v
Greater Marksman Gem|10000|v
Greater Mystic Gem|10000|v
Greater Proficiency Catalyst|0|v
Greater Sage Gem|10000|v
Greater Spiritualist Gem|10000|v
Greed Gland|800|p
Greed's Arm|950000|p
Greedkings Claw|150000|p
Greedkings Crown|300000|p
Green Bandage|180|pt
Green Crystal Fragment|800|v
Green Crystal Shard|1500|v
Green Crystal Splinter|400|v
Green Dragon Leather|100|ip
Green Dragon Scale|100|ip
Green Gem|5000|v
Green Glass Plate|180|v
Green Piece of Cloth|200|p
Grimace|120000|p
Gruesome Fan|15000|v
Guardian Gem|5000|v
Guardian Shield|2000|t
Guidebook|200|p
Gullet Moonstone Splinter|3100|p
Gummy Rotworm|0|p
Hair of a Banshee|350|p
Halberd|400|t
Half-Digested Piece of Meat|55|p
Half-Digested Stones|40|pt
Half-Eaten Brain|85|pt
Hand|1450|pt
Hand Puppets (Replica)|0|v
Hard-Boiled Hydra Egg|0|p
Hardened Bone|70|p
Harpoon of a Giant Snail|15000|p
Harpy Feathers|730|pt
Hatched Rorc Egg|30|p
Haunted Piece of Wood|115|p
Hazardous Heart|5000|p
Hazardous Robe|3000|p
Head (Brachiodemon)|3500|pt
Head (Many Faces)|3200|pt
Headpecker Beak|2800|pt
Headpecker Feather|1300|pt
Heart Amphora|930|pt
Heaven Blossom|50|p
Heavily Rusted Armor|0|v
Heavily Rusted Helmet|0|v
Heavily Rusted Legs|0|v
Heavily Rusted Shield|0|v
Heavy Machete|90|t
Heavy Trident|2000|t
Hellhound Slobber|500|pt
Hellhunter Eye|2950|p
Hellspawn Tail|475|ip
Helmet of Sir Leonard|46000|p
Hemp Rope|350|pt
Heralds Insignia|0|v
Heralds Wings|0|v
Hexagonal Ruby|30000|v
Hibiscus Dress|3000|t
Hideous Chunk|510|pt
High Guard Flag|550|pt
High Guard Shoulderplates|130|pt
Hoarder Claw|600|p
Hollow Stampor Hoof|400|p
Holy Ash|160|pt
Holy Orchid|90|p
Holy Scarab|0|v
Honeycomb|40|p
Hook|0|p
Horn of Kalyassa|10000|p
Horoscope|40|pt
Horseshoe|0|p
Huge Chunk of Crude Iron|15000|p
Huge Shell|15000|p
Huge Spiky Snail Shell|8000|p
Human Teeth|2000|pt
Humongous Chunk|540|pt
Hunter's Quiver|80|p
Hydra Egg|500|p
Hydra Head|600|pt
Hydra Tongue|0|p
Hydrophytes|220|pt
Ice Flower (Item)|370|pt
Ice Flower Seeds|0|p
Ice Shard|500|v
Iced Soil|2000|p
Ichgahal's Fungal Infestation|900000|p
Icicle (Percht)|0|p
Icy Crypt Rune|0|p
Icy Horns|250000|p
Icy Scales|250000|p
Idol of the Forge|950|pt
Idol of Tukh|0|v
Imortus (Replica)|0|v
Incantation Notes|90|p
Infernal Heart|2100|pt
Infernal Robe|1200|pt
Infernoid Ember|160|pt
Inkwell (Black)|720|pt
Insectoid Cocoon (Item)|0|p
Instable Proto Matter|300|pt
Iron Ore|500|p
Iron Token|0|v
Ivory Carving|300|pt
Ivory Comb|8000|p
Izcandar's Snow Globe|180000|p
Izcandar's Sundial|225000|p
Jade Amulet (Replica)|0|v
Jagged Sickle|150000|p
Jaul's Pearl|0|p
Jaws|3900|pt
Jewelled Belt|180|p
Jungle Moa Claw|160|p
Jungle Moa Egg|250|p
Jungle Moa Feather|140|p
Katex' Blood|210|p
Key of Numerous Locks (Replica)|0|v
Key to Knowledge|0|p
Key to the Drowned Library|330|pt
Knife|1|t
Knight Axe|2000|t
Knight Legs|5000|t
Kollos Shell|420|p
Kongra's Shoulderpad|100|pt
Lamassu Hoof|330|pt
Lamassu Horn|240|pt
Lancer Beetle Shell|80|pt
Lancet|90|pt
Lavafungus Head|900|pt
Lavafungus Ring|390|pt
Lavaworm Jaws|1100|pt
Lavaworm Spike Roots|600|pt
Lavaworm Spikes|750|pt
Legionnaire Flags|500|p
Lesser Fragment|500|v
Lesser Guardian Gem|2500|v
Lesser Marksman Gem|2500|v
Lesser Mystic Gem|2500|v
Lesser Proficiency Catalyst|0|v
Lesser Sage Gem|2500|v
Lesser Spiritualist Gem|2500|v
Lightning Boots|2500|t
Lightning Headband|2500|t
Lightning Robe|11000|t
Lime Tart|1870|pt
Liodile Fang|480|pt
Lion Cloak Patch|190|pt
Lion Crest|270|pt
Lion Figurine|10000|v
Lion Seal|210|p
Lion's Mane|60|ip
Little Adventurer Doll (Replica)|0|v
Little Bowl of Myrrh|500|ip
Lizard Essence|300|p
Lizard Heart|530|p
Lizard Leather|150|p
Lizard Scale|120|p
Lizard Tail|95|pt
Longing Eyes|8000|p
Loose Prayer Beads|0|pt
Loremaster Doll (Replica)|0|v
Lost Basher's Spike|280|pt
Lost Bracers|140|pt
Lost Husher's Staff|250|p
Lost Soul (Item)|120|p
Lucky Clover Amulet (Replica)|0|v
Lucky Pig|0|p
Ludicrous Piece of Cloth|0|p
Luminous Orb|1000|pt
Luminous Piece of Cloth|0|p
Lump of Dirt|10|p
Lump of Earth|130|pt
Lunar Ascension Orb|0|v
Mad Froth|80|pt
Magic Sulphur|8000|p
Magma Boots|2500|t
Magma Clump|570|pt
Magma Coat|11000|t
Magma Monocle|2500|t
Major Crystalline Token|0|v
Makara Fin|350|pt
Makara Tongue|320|pt
Malice's Horn|620000|p
Malice's Spine|850000|p
Malofur's Lunchbox|240000|p
Mammoth Tusk|100|pt
Mammoth Whopper|300|t
Mantassin Tail|280|ip
Manticore Ear|310|pt
Manticore Tail|220|pt
Mantosaurus Jaw|2800|pt
Marksman Gem|5000|v
Marsh Stalker Beak|65|p
Marsh Stalker Feather|50|p
Masterpiece of a Gozzler|0|v
Masterpiece of a Muse|0|v
Mathmaster Shield (Replica)|0|v
Maxilla|250|p
Maxxenius Head|500000|p
Meat Hammer|60|p
Medal of Valiance|410000|p
Medusa Skull (Replica)|0|v
Mega Dragon Heart|1100|pt
Megalomania's Essence|1900000|p
Megalomania's Skull|1500000|p
Menacing Egg|0|v
Mercenary Sword|12000|t
Mercurial Wing|2500|pt
Metal Bat|9000|t
Metal Jaw|260|pt
Metal Spats|2000|t
Metal Spike|320|ip
Metal Toe|430|p
Miasmic Pustule|400|p
Mighty Demonic Core Essence|0|p
Milk Chocolate Coin|0|v
Milk Churn|100|p
Miniature House|0|v
Mino Lance|7000|t
Mino Shield|3000|t
Minor Crystalline Token|0|v
Minotaur Horn|75|p
Minotaur Leather|80|p
Miraculum|60|p
Molten Dragon Essence|840|pt
Mooh'tah Shell|110|ip
Moohtant Horn|140|ip
Moon Compass|5000|p
Moon Melon Slice|0|p
Moon Pin|18000|p
Moonlight Crystals|0|v
Moonspawn Headpiece|900|pt
Moonspawn Tentacle|670|pt
Moonstone|13000|v
Morgaroth's Heart|15000|p
Morshabaal's Brain|5000000|p
Morshabaal's Extract|3250000|p
Mother Soil|5000|p
Mould Heart|2100|pt
Mould Robe|1200|pt
Mouldy Powder|200|pt
Mr. Punish's Handcuffs|50000|p
Mucus Plug|500|v
Mummified Demon Finger|0|pt
Murcion's Mycelium|950000|p
Music Box (Replica)|0|v
Mutated Bat Ear|420|pt
Mutated Flesh|50|pt
Mutated Rat Tail|150|pt
Mysterious Remains|0|pv
Mysterious Scroll|0|v
Mystic Gem|5000|v
Mystical Hourglass|700|ip
Naga Archer Scales|340|pt
Naga Armring|390|pt
Naga Earring|380|pt
Naga Warrior Scales|340|pt
Natural Soil|2000|p
Necromantic Core|10000|pt
Necromantic Crypt Rune|0|p
Necromantic Robe|250|p
Necromantic Rust|390|pt
Nettle Blossom|75|p
Nettle Spit|25|p
Neutral Matter|5000|p
Night Harpy Beak|10000|p
Night Harpy Feathers|5000|pt
Nighthunter Wing|2000|pt
Nimmersatt's Seal|520|pt
Noble Amulet|430000|p
Noble Cape|425000|p
Noble Sword (Replica)|0|v
Noble Turban|430|p
Norcferatu Talisman|670|p
Norseman Doll (Replica)|0|v
Nose Ring|2000|p
Obujos' Shell|0|p
Obvious Piece of Cloth|0|p
Odd Organ|410|pt
Ogre Ear Stud|180|pt
Ogre Nose Ring|210|ip
Old Girtablilu Carapace|570|pt
Old Radio (Replica)|0|v
Old Royal Diary|220000|p
Omega Seal|12700|p
Ominous Piece of Cloth|0|p
One of Timira's Many Heads|215000|p
Onyx Chip|500|v
Onyx Turmaline|68000|v
Opal|500|v
Orc Leather|30|p
Orc Tooth|150|ip
Orc Tusk|700|p
Orc's Jaw Shredder (Replica)|0|v
Orcish Axe|350|t
Orcish Gear|85|pt
Orcish Toothbrush|750|pt
Orichalcum Pearl|40|v
Ornate Crossbow|12000|t
Ornate Locket|18000|v
Orshabaal's Brain|12000|p
Pact of Greed|8000|p
Painting of a Gozzler|0|v
Painting of a Muse|0|v
Pair of Hellflayer Horns|1300|pt
Pale Worm's Scalp|489000|p
Panther Head|750|p
Panther Paw|300|p
Paper Boat|800|pt
Paper Plane|480|pt
Parder Fur|150|p
Parder Tooth|150|p
Pastry Dragon|7500|p
Patch of Fine Cloth|1350|p
Peacock Feather Fan|350|ip
Peg Leg|0|p
Pegasus Feather|0|v
Pelvis Bone|30|p
Percht Broom|0|p
Percht Handkerchief|0|p
Percht Horns|0|p
Percht Queen's Frozen Heart|0|p
Percht Skull|0|p
Perfect Behemoth Fang|250|p
Pet Pig|1500|v
Petrified Leaf|0|v
Petrified Scream|250|ip
Phantasmal Hair|500|p
Phoenix Statue (Replica)|0|v
Piece of Archer Armor|20|p
Piece of Corrupted Moonstone|15000|v
Piece of Crocodile Leather|15|p
Piece of Dead Brain|420|ip
Piece of Draconian Steel|3000|pt
Piece of Frozen Night|680|pt
Piece of Hell Steel|500|pt
Piece of Hellfire Armor|550|p
Piece of Massacre's Shell|50000|p
Piece of Red Gullet Metal|1600|p
Piece of Royal Steel|10000|p
Piece of Scarab Shell|45|ip
Piece of Swampling Wood|30|ip
Piece of Timira's Sensors|150000|p
Piece of Warrior Armor|50|pt
Pieces of Magic Chalk|210|p
Pig Foot|10|p
Pigeon Trophy (Replica)|0|v
Pile of Grave Earth|25|ip
Pirat's Tail|180|pt
Pirate Coin|110|pt
Pirate's Surprise|0|v
Plagueroot Offshoot|280000|p
Plasma Pearls|250|pt
Plasmatic Lightning|270|pt
Plate Legs|115|t
Platinum Coin|100|v
Platinum Token|0|v
Poison Gland|210|p
Poison Spider Shell|10|p
Poisoned Fang|130|pt
Poisonous Slime|50|ip
Polar Bear Paw|30|ip
Pool of Chitinous Glue|480|pt
Portable Flame|0|v
Pot of Orcish Warpaint|1150|pt
Prehemoth Claw|2300|pt
Prehemoth Horns|3000|pt
Preserved Dark Seed|0|p
Preserved Light Blue Seed|0|p
Preserved Pink Seed|0|p
Preserved Purple Seed|0|p
Preserved Red Seed|0|p
Preserved Violet Seed|0|p
Preserved Yellow Seed|0|p
Pressed Flower|570|pt
Prismatic Quartz|450|v
Pristine Worm Head|15000|p
Proficiency Catalyst|0|v
Protective Charm|60|ip
Pulverized Ore|400|pt
Purified Soul (Netherworld)|260|p
Purple Robe|110|p
Putrefactive Figurine|3200000|p
Pyrophyte Seed Pod|720|pt
Quara Bone|500|pt
Quara Eye|350|pt
Quara Pincers|410|pt
Quara Tentacle|140|pt
Quill|1100|ip
Rabbit's Foot|50|p
Rainbow Opal|0|v
Rainbow Quartz|500|v
Rare Earth|80|p
Rat Ears|350|p
Rat Family Painting|3500|p
Rat Tail|250|p
Rat Teeth|150|p
Ratana|500|t
Ratmiral's Hat|150000|p
Ravenous Circlet|220000|p
Raw Meat|0|pt
Raw Watermelon Tourmaline|0|v
Reality Splinter|5000|p
Red Crystal Fragment|800|v
Red Dragon Leather|200|p
Red Dragon Scale|200|p
Red Gem|1000|v
Red Goanna Scale|270|pt
Red Hair Dye|40|pt
Red Lantern|250|p
Red Piece of Cloth|300|p
Relic Sword|25000|t
Resin Parasite|1450|pt
Resinous Fish Fin|1250|pt
Revised Promotion Scroll|0|v
Rhindeer Antlers|680|pt
Rhino Hide|175|p
Rhino Horn|265|p
Rhino Horn Carving|300|p
Ripper Lance|500|t
Ripptor Claw|2600|pt
Ripptor Scales|1200|pt
Ritual Bone Knife|820|pt
Ritual Tooth|135|pt
Rod (Creature Product)|2200|pt
Rogue Naga Scales|570|p
Roll of Covering|0|v
Root Tentacle|300000|p
Roots|1200|pt
Rope Belt|66|ip
Rorc Egg|120|p
Rorc Feather|70|ip
Rotrender Claw|0|p
Rotrender Scalp|0|p
Rotten Feather|120|pt
Rotten Heart|74000|p
Rotten Piece of Cloth|30|pt
Rotten Roots|3800|pt
Rotten Vermin Ichor|4500|pt
Royal Almandine|460000|v
Rubber Cap|11000|t
Rusted Armor|0|v
Rusted Helmet|0|v
Rusted Legs|0|v
Rusted Shield|0|v
Rusty Boots (Common)|0|v
Rusty Boots (Rare)|0|v
Rusty Boots (Semi-Rare)|0|v
Rusty Weapon (Common)|0|v
Rusty Weapon (Rare)|0|v
Rusty Weapon (Semi-Rare)|0|v
Sabretooth|400|ip
Sabretooth Fur|2500|pt
Safety Pin|120|p
Sage Gem|5000|v
Sailor's Burn Cure|0|p
Sandcrawler Shell|20|pt
Santa Music Box|0|v
Scale of Corruption|680|pt
Scale of Gelidrazah|10000|p
Scarab Coin|100|v
Scarab Pincers|280|pt
Scimitar|150|t
Scorpion Charm|620|pt
Scorpion Tail|25|p
Scroll of Ascension|0|v
Scroll of Ascension (Used)|0|v
Scroll of Heroic Deeds|230|pt
Scrubbing Brush|0|v
Scythe Leg|450|pt
Sea Horse Figurine|42000|v
Sea Serpent Scale|520|p
Sea Serpent Trophy|10000|p
Seacrest Hair|260|ip
Seacrest Pearl|400|pv
Seacrest Scale|150|p
Sealing Wax|620|pt
Seeds|150|p
Shadow Mask|0|p
Shadow Paint|0|p
Shaggy Ogre Bag|0|v
Shaggy Tail|25|pt
Shamanic Hood|45|p
Shamanic Talisman|200|pt
Shard|2000|p
Shark Fins|250|pt
Shield of Destiny (Replica)|0|v
Shield of Endless Search (Replica)|0|v
Shimmering Beetles|150|pt
Shiny Stone|500|pt
Shrunken Head|250000|p
Sight of Surrender's Eye|3000|p
Signet Ring|480000|p
Silencer Claws|390|ip
Silencer Resonating Chamber|600|pt
Silken Bookmark|1300|pt
Silky Fur|35|p
Silver Brooch|150|v
Silver Fafnar Trophy|1000|v
Silver Foxmouse Coin|11000|p
Silver Moon Coin|11000|pt
Silver Poniard|2000|pt
Silver Raid Token|0|v
Silver Rune Emblem (Animate Dead)|0|v
Silver Rune Emblem (Avalanche)|0|v
Silver Rune Emblem (Chameleon)|0|v
Silver Rune Emblem (Destroy Field)|0|v
Silver Rune Emblem (Disintegrate)|0|v
Silver Rune Emblem (Energy Bomb)|0|v
Silver Rune Emblem (Energy Wall)|0|v
Silver Rune Emblem (Explosion)|5000|v
Silver Rune Emblem (Fire Field)|0|v
Silver Rune Emblem (Fireball)|0|v
Silver Rune Emblem (Firebomb)|0|v
Silver Rune Emblem (Great Fireball)|0|v
Silver Rune Emblem (Heavy Magic Missile)|5000|v
Silver Rune Emblem (Holy Missile)|0|v
Silver Rune Emblem (Icicle)|0|v
Silver Rune Emblem (Light Magic Missile)|0|v
Silver Rune Emblem (Magic Wall)|0|v
Silver Rune Emblem (Paralyze)|0|v
Silver Rune Emblem (Poison Bomb)|0|v
Silver Rune Emblem (Soulfire)|0|v
Silver Rune Emblem (Sudden Death)|5000|v
Silver Rune Emblem (Thunderstorm)|0|v
Silver Rune Emblem (Ultimate Healing)|5000|v
Silver Rune Emblem (Wild Growth)|0|v
Silver Token|0|v
Sineater Wing|2100|pt
Single Human Eye|1000|pt
Siramal's Golden Bug Trophy|0|v
Skeleton Decoration|3000|p
Skin of Gralvalon|0|p
Skin of Malvaroth|0|p
Skin of Twisterror|0|p
Skull Belt|80|p
Skull Fetish|250|pt
Skull Shatterer|170|p
Skull Tendril|650000|p
Skullcracker Armor|18000|t
Skunk Tail|50|p
Slightly Rusted Armor|0|v
Slightly Rusted Helmet|0|v
Slightly Rusted Legs|0|v
Slightly Rusted Shield|0|v
Slime Heart|160|ip
Slime Mould|175|p
Slimy Leaf Tentacle|320|pt
Slimy Leg|4500|p
Sliver|0|t
Small Amethyst|200|v
Small Diamond|300|v
Small Emerald|250|v
Small Enchanted Amethyst|200|v
Small Enchanted Emerald|250|v
Small Enchanted Ruby|250|v
Small Enchanted Sapphire|250|v
Small Energy Ball|250|p
Small Flask of Eyedrops|95|pt
Small Ladybug|0|p
Small Notebook|480|pt
Small Oil Lamp|150|p
Small Pitchfork|70|p
Small Ruby|250|v
Small Sapphire|250|v
Small Topaz|200|v
Small Treasure Chest|500|pt
Small Tropical Fish|380|pt
Smoldering Eye|470000|p
Snake Skin|400|ip
Sniper Gloves|2000|p
Snow Globe|0|v
Soap|0|v
Solid Rage|310|v
Some Grimeleech Wings|1200|ip
Soul Stone|6000|p
Soul Trap|250000|p
Spark Sphere|350|pt
Sparkion Claw|290|pt
Sparkion Legs|310|pt
Sparkion Stings|280|pt
Sparkion Tail|300|pt
Spectral Gold Nugget|500|pv
Spectral Horse Tack|0|v
Spectral Horseshoe|0|v
Spectral Saddle|0|v
Spectral Scrap of Cloth|0|v
Spectral Silver Nugget|250|pv
Spellbook of Mind Control|13000|t
Spellreaper Staff Totem|3100|p
Spellsinger's Seal|280|pt
Spellweaver's Robe|12000|t
Sphinx Feather|470|p
Sphinx Tiara|360|pt
Spider Fangs|10|p
Spider Silk|100|p
Spiderweb Clouds Shreds|0|p
Spidris Mandible|450|p
Spiked Bracers|1360|pt
Spiked Gorget|850|pt
Spiked Iron Ball|100|pt
Spiky Club|300|t
Spirit Container|40000|p
Spirited Soil|2000|p
Spiritual Horseshoe|0|v
Spiritualist Gem|5000|v
Spite's Spirit|840000|p
Spitter Nose|340|pt
Splintered Mitmah Gem|225000|p
Spooky Blue Eye|95|p
Spool of Yarn|1000|p
Srezz' Eye|300|p
Staff Piece|560|pt
Stag Parchment|3000|pt
Stalking Seeds|1800|pt
Stampor Horn|280|p
Stampor Talons|150|pt
Star Herb|15|p
Star Ink|1250|pt
Statue of Devovorga|1500|v
Steel Spider Silk|0|p
Stone Herb|20|p
Stone Nose|590|p
Stone Wing|120|pt
Stonerefiner's Skull|100|pt
Strand of Medusa Hair|600|ip
Strange Helmet|500|t
Strange Inedible Fruit|0|v
Strange Proto Matter|300|p
Strange Substance|810|pt
Strange Symbol|200|p
Streaked Devourer Eyes|500|pt
Streaked Devourer Legs|600|pt
Streaked Devourer Maw|400|pt
Striped Fur|50|pt
Sulphider Shell|2200|pt
Sulphur Powder|1900|pt
Sulphurous Stone|100|pt
Sun Brooch|18000|p
Sun Medal|0|v
Sunray Emblem|0|v
Surprise Cube|0|v
Surprise Jar|0|v
Swamp Grass|20|ip
Swampling Club|40|t
Swampling Moss|20|p
Swarmer Antenna|130|pt
Sweet Present|0|v
Tagralt-Inlaid Scabbard|0|v
Tail of Corruption|240|pt
Tainted Heart|0|p
Taiyaki Ice Cream|6750|p
Tanjis' Sight|0|p
Tarantula Egg|80|ip
Tarnished Rhino Figurine|320|p
Tattered Piece of Robe|120|p
Tatty Robe|0|pt
Taurus Mace|500|t
Technomancer Beard|0|p
Telescope Eye|1600|pt
Tender Venison|0|p
Tentacle of Tentugly|27000|p
Tentacle Piece|5000|p
Tentugly's Eye|52000|p
Tentugly's Jaws|80000|p
Terra Boots|2500|t
Terra Hood|2500|t
Terra Mantle|11000|t
Terramite Eggs|50|p
Terramite Legs|60|pt
Terramite Shell|170|p
Terrorbird Beak|95|p
The Crown of the Percht Queen (Fire)|0|p
The Crown of the Percht Queen (Ice)|0|p
The Handmaiden's Protector|50000|p
The Imperor's Trident|50000|p
The Lethal Lissy's Shirt|0|p
The Mexcalibur (Replica)|0|v
The Plasmother's Remains|50000|p
The Skull of a Beast|0|v
The Vampire Count's Medal|0|pv
Thick Fur|150|ip
Thorn|100|pt
Thorn Seed|0|p
Tiara|11000|v
Tibia Coin (Item)|0|v
Tibia Coins|0|v
Tibiapedia (Replica)|0|v
Tibiora's Box (Replica)|0|v
Tiger Eye|350|v
Tiny Bat Coffin|0|p
Titan Axe|4000|t
Titanium Token|0|v
Toe Nails|4500|pt
Token of Love|440000|p
Tooth File|60|pt
Tooth of Tazhadur|10000|p
Torn Page|340|pt
Torn Shirt|250|p
Toy Ball|0|v
Trapped Bad Dream Monster|900|pt
Tremendous Tyrant Head|930|pt
Tremendous Tyrant Shell|740|pt
Trollroot|50|p
Tunnel Tyrant Head|500|pt
Tunnel Tyrant Shell|700|pt
Turtle Shell|90|p
Tusk|100|p
Twig Arms|0|p
Twisted Marionette|125000|p
Two-Headed Turtle Heads|460|pt
Ulcer Probe|0|p
Undead Heart|200|p
Undertaker Fangs|2700|pt
Unholy Bone|480|pt
Unicorn Figurine|50000|v
Unrealized Dream|0|v
Urmahlullu's Mane|490000|p
Urmahlullu's Paw|245000|p
Urmahlullu's Tail|210000|p
Utua's Poison|230|p
Vampire Dust|100|p
Vampire Lord Token|0|pv
Vampire Teeth|275|ip
Vampire's Cape Chain|150|ptv
Vampire's Signet Ring|0|v
Varnished Diremaw Brainpan|750|pt
Varnished Diremaw Legs|670|pt
Vein of Ore|330|pt
Vemiath's Infused Basalt|1000000|p
Venison|55|pt
Versicolour Fireworks Powder|0|p
Vexclaw Talon|1100|ip
Vial of Hatred|737000|p
Vibrant Egg|0|v
Vibrant Heart|2100|pt
Vibrant Robe|1200|pt
Vile Axe|30000|t
Violet Crystal Shard|1500|v
Violet Gem|10000|v
Violet Glass Plate|2150|v
Virulent Pustule|1500|p
Volatile Proto Matter|300|pt
Voluminous Piece of Cloth|0|p
Wad of Fairy Floss|2910|p
Wafer Paper Flower|2350|p
War Axe|12000|t
War Backpack (Replica)|0|v
War Crystal|460|ip
War Wolf Skin|0|p
Wardragon Claw|550|pt
Wardragon Tooth|730|pt
Warmaster's Wristguards|200|ip
Warwolf Fur|30|p
Waspoid Claw|320|pt
Waspoid Wing|190|ip
Watermelon Tourmaline (Pear)|230000|v
Watermelon Tourmaline (Slice)|30000|v
Weapon Matrix Crystal|0|v
Weaver's Wandtip|250|pt
Wedding Outfit Box|0|v
Werebadger Claws|160|pt
Werebadger Skull|185|pt
Werebear Fur|185|pt
Werebear Skull|195|pt
Wereboar Hooves|175|ip
Wereboar Loincloth|1500|t
Wereboar Tusks|165|pt
Werecrocodile Tongue|570|pt
Werefox Tail|200|pt
Werehyaena Nose|220|pt
Werehyaena Talisman|350|pt
Werepanther Claw|280|pt
Weretiger Tooth|490|pt
Werewolf Fangs|180|p
Werewolf Fur|380|pt
Wheel of Cheese|75000|p
White Deer Antlers|400|p
White Deer Skin|245|p
White Gem|12000|v
White Pearl|160|v
White Piece of Cloth|100|p
White Silk Flower|9000|v
Wicked Witch (Replica)|0|v
Widow's Mandibles|110|pt
Wild Flowers|120|pt
Wimp Tooth Chain|120|pt
Wind-Up Key|0|v
Wind-Up Loco|0|v
Winged Tail|800|pt
Winter Wolf Fur|20|ip
Witch Broom|60|pt
Withered Pauldrons|850|p
Withered Scalp|900|p
Wolf Paw|70|p
Wood|50|p
Wood Cape|5000|t
Wooden Spellbook|12000|t
Wool|15|p
Worm|0|p
Worm Sponge|4200|pt
Worn Guide Book|250000|p
Writhing Brain|370000|p
Writhing Heart|185000|p
Wyrm Scale|400|ip
Wyvern Talisman|265|ip
Yapunac Dagger|240|pt
Yellow Gem|1000|v
Yellow Piece of Cloth|150|p
Yielocks|600|p
Yielowax|600|p
Yirkas' Egg|280|p
Young Lich Worm|25000|p
Zaoan Armor|14000|t
Zaoan Robe|12000|t
Zaoan Shoes|5000|t
Zaogun Flag|600|pt
Zaogun Shoulderplates|150|pt`;
