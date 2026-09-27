/**
 * Equipamentos atuais do Tibia/RubinOT, extraídos da TibiaWiki BR em 2026-09-27 (categorias
 * Capacetes, Armaduras, Calças, Botas, Escudos, Spellbooks, Amuletos e Colares, Anéis, Munição e
 * Extra Slot; sem os de "Removido na versão ..." / "Antigos Amuletos e Colares"). Um por linha,
 * campos separados por "|":
 *
 *   nome|slot|vocações|level|armor|defesa|skills|resistências|imbuements|tier máx|ataque|título na wiki
 *
 * slot: h=capacete a=armadura l=calça b=bota s=escudo/aljava k=spellbook n=amuleto r=anel
 *       m=munição e=extra slot (item decorativo/talismã que vai no slot da munição)
 * vocações: K P S D M (vazio = qualquer vocação pode usar). Campos vazios = a wiki não informa.
 * Parse/uso em src/lib/equipment.ts. Pra atualizar: refazer a extração da wiki (ver AGENTS.md).
 */
export const EQUIPMENT_TSV = `Adamant Shield|s
Albino Plate|a|||11||||2|3
Alchemist's Boots|b|S|250|2||Magic Level +1|Physical +2%|1|10
Alchemist's Notepad|k|S|250||32|Magic Level +2, Fire Magic Level +3, Energy Magic Level +3|Death +5%|1
Alicorn Headguard|h|P|400|11||Distance Fighting +3|Physical +5%, Fire +5%, Earth +5%, Energy +5%, Ice +5%, Holy +5%, Death +5%|2|10
Alicorn Quiver|s|P|400|||Magic Level +1
Alicorn Ring|r|P|400|0||Holy Magic Level +1|Fire +4%, Earth +4%, Energy +4%, Ice +4%
Alloy Legs|l||60|6||Speed +10|||2
Amazon Armor|a|P|60|13||Distance Fighting +3||2|10
Amazon Helmet|h|||7||||2|10
Amazon Shield|s||||42|||1
Amethyst Necklace|n|||0
Amulet of Loss|n|||0
Amulet of Theurgy|n|SD|220|0
Ancient Amulet|n|||0
Ancient Shield|s||||36
Ancient Tiara|h|||0||||2
Antler-Horn Helmet|h|K|250|9||Sword Fighting +1, Axe Fighting +1, Club Fighting +1|Physical +3%, Ice +7%|2|10
Arboreal Crown|h|D|400|9||Magic Level +3|Physical +2%, Ice +9%|2|10
Arboreal Ring|r|D|400|0||Healing Magic Level +2|Fire +4%, Earth +4%, Energy +4%, Ice +4%
Arboreal Tome|k|D|400||36|Magic Level +5, Ice Magic Level +1, Healing Magic Level +1|Physical +4%, Energy +6%|1
Arcane Dragon Robe|a|S|300|15||Magic Level +3, Energy Magic Level +1|Ice +12%, Fire -6%|1|10
Arcanomancer Folio|k|S|400||36|Magic Level +5, Fire Magic Level +1, Energy Magic Level +1|Physical +3%, Fire +8%|1
Arcanomancer Regalia|h|S|400|9||Magic Level +3|Physical +3%, Earth +7%|2|10
Arcanomancer Sigil|r|S|400|0||Fire Magic Level +1, Energy Magic Level +1|Fire +4%, Earth +4%, Energy +4%, Ice +4%
Armillary Sphere|e
Arrow|m||0|||||||25
Asuri Talisman|e
Aurora's Collection|s
Axe Ring|r||0|0||Axe Fighting +4
Aylie|s
Baby Munster|e
Badger Boots|b||60|2||Speed +10||1|2
Ball Gown|a|||0
Bandana|h|||1|||||1
Bast Legs|l|P|150|8||Distance Fighting +2|Energy +4%||10
Bast Skirt|l|||0
Battle Shield|s||||30
Batwing Hat|h|SD|50|3||Magic Level +1||1|2
Bear Skin|a|D|230|16||Magic Level +4|Earth +11%, Fire -2%|1|3
Beetle Necklace|n|||0||Speed +2
Belted Cape|a|P||10|||||1
Biscuit Barrier|s|K|200||47|Shielding +2|Physical +3%, Fire +5%|1
Black Candle|e
Black Pit Demon|e
Black Shield|s||||24
Black Skull (Item)|e
Blessed Shield|s||||52
Blister Ring|r||220|0
Blue Legs|l|||8|||||2
Blue Pit Demon|e
Blue Quiver|s|P|0
Blue Robe|a|||11||||2|2
Blue Spectacles|h
Blue Sphere|e
Bolt|m||0|||||||30
Bone Fiddle|e|||0|||Life Drain +5%
Bone Shield|s||||26
Bonelord Helmet|h|||7||||2|2
Bonelord Shield|s||||37|||1
Bonfire Amulet|n||80|0|||Physical +60%, Fire +40%
Book of Lies|k|SD|150||29|Magic Level +4||1
Boots of Enlightenment|b|M|8|1||Fist Fighting +1||1|1
Boots of Haste|b|||0||Speed +20||1|2
Boots of Homecoming|b||100|2
Boots of Waterwalking|b||||||||10
Bounty Talisman|e
Brain in a Jar|k|SD|180||31|Magic Level +3|Earth +7%|1
Brass Armor|a|||8|||||1
Brass Helmet|h|||3|||||1
Brass Legs|l|||5|||||1
Brass Shield|s||||21
Bridal Wreath|h|||0
Broken Amulet|n|||0
Broken Iks Cuirass|a||0|1
Broken Iks Faulds|l|||1
Broken Iks Headpiece|h|||1
Broken Iks Sandals|b|||1
Broken Ring of Ending|r||0|0
Broken Visor|h|||1
Broken Wedding Ring|r||0|0
Broken Wooden Shield|s||||15
Bronze Amulet|n|||0|||Mana Drain +20%
Bronze Necklace|n|||0
Brown Pit Demon|e
Buckle|a|||12|||||2
Bunnyslippers|b|||0||||1|10
Burial Shroud|a|||0|||Death +5%
Burst Arrow|m||0|||||||27 Physical
Butterfly Ring|r||50|2|||Death +3%
Calopteryx Cape|a|SD|80|12||Magic Level +1|Ice +5%||2
Canary Feather|e
Candlestick|e
Candy Necklace|n||220|2|||Physical +3%, Energy +6%, Earth -5%
Candy-Coated Quiver|s|P|200||||Fire +2%
Cape|a|||1|||||1
Carapace Shield|s||||47|||1
Castle Shield|s||||37|||1
Celestial Torch|e|||0||Speed +25
Ceremonial Mask|h|||9|||||10
Chain Armor|a|||6||||2|1
Chain Helmet|h|||2|||||1
Chain Legs|l|||3|||||1
Charged Alicorn Ring|r|P|400|0||Distance Fighting +3, Magic Level +1, Holy Magic Level +1|Fire +4%, Earth +4%, Energy +4%, Ice +4%, Holy +4%, Death +4%
Charged Arboreal Ring|r|D|400|0||Magic Level +2, Healing Magic Level +2|Fire +4%, Earth +4%, Energy +4%, Ice +4%
Charged Arcanomancer Sigil|r|S|400|0||Magic Level +2, Fire Magic Level +1, Energy Magic Level +1|Fire +4%, Earth +4%, Energy +4%, Ice +4%
Charged Ethereal Ring|r|M|400|0||Fist Fighting +3, Magic Level +2, Life Leech +2%|Physical +4%, Fire +4% Earth +4%, Energy +4%, Ice +4%
Charged Spiritthorn Ring|r|K|400|2||Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +8%, Fire +4%, Earth +4%, Energy +4%, Ice +4%
Charmer's Tiara|h|||2|||||1
Charred Mask|h|||0|||Fire +2%||2
Chocolatey Dragon Scale Legs|l|||2|||||1
Claw of 'The Noxious Spawn'|r||100|0
Club Ring|r||0|0||Club Fighting +4
Coat|a|||1|||||1
Cobra Boots|b|K|220|3||Speed +10|Physical +6%|1|10
Cobra Crown|h|SD||3||Magic Level +2|Earth +5%, Fire -5%||2
Cobra Hood|h|K|270|9||Sword Fighting +1, Club Fighting +1, Axe Fighting +1|Physical +5%|2|10
Cocoa Grimoire|k|S|200||31|Magic Level +3, Fire Magic Level +1, Magic Shield Capacity +150 e +3%|Physical +2%, Energy +5%|1
Coconut Shoes|b|||0||||1|1
Collar of Blue Plasma|n|P|150|0||Distance Fighting +4, Magic Level +2
Collar of Green Plasma|n|SD|150|0||Magic Level +3
Collar of Orange Plasma|n|M|150|0||Fist Fighting +4, Magic Level +2
Collar of Red Plasma|n|K|150|0||Sword Fighting +4, Club Fighting +4, Axe Fighting +4|Physical +5%
Conch Shell Horn|e|||0|||Ice +2%
Coned Hat of Enlightenment|h|M|70|4||Fist Fighting +1||1|1
Copper Shield|s||||25
Creamy Grimoire|k|D|200||31|Magic Level +3, Healing Magic Level +1, Magic Shield Capacity +150 e +3%|Physical +2%, Fire +5%|1
Crest of the Deep Seas|h||80|7||Speed +5|Ice +5%||2
Crocodile Boots|b|||1||||1|2
Crown|h|||0
Crown Armor|a|KP||13||||1|2
Crown Helmet|h|||7||||2|2
Crown Legs|l|KP||8|||||2
Crown Shield|s||||42|||1
Crude Umbral Spellbook|k|SD|75||23|Magic Level +1|Earth +2%, Energy +2%, Fire +2%, Ice +2%
Crusader Helmet|h|||8||||2|2
Crystal Boots|b|KP|70|3|||Ice +3%, Energy -3%|1|10
Crystal Lamp|e
Crystal Necklace|n|||0
Crystal Ring|r||0|0
Crystalline Armor|a|KP|60|13|||Ice +3%, Energy -3%||2
Crystalline Arrow|m||90|||||||65
Cursed Coin|e|||0|||Physical -20%, critical hit chance 1%
Damaged Helmet|h|||5
Dark Armor|a|||10|||||1
Dark Helmet|h|||6|||||1
Dark Lord's Cape|a|S|65|11|||Death +8%, Holy -8%||10
Dark Shield|s||||33
Dark Vision Bandana|h|M|180|5||Fist Fighting +2|Energy +4%|2|3
Dark Whispers|h|P|180|7||Distance Fighting +2|Ice +3%|2|3
Dauntless Dragon Scale Armor|a|K|300|18||Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +8%|2|10
Dawnfire Pantaloons|l|S|300|8||Magic Level +2|Physical +3%||10
Dawnfire Sherwani|a|S|270|16||Magic Level +4|Fire +10%, Earth -2%|1|10
Death Gaze|s||200||50|||1
Death Oyoroi|a|M|230|9||Fist Fighting +4, Magic Level +1|Death +5%|1|3
Death Ring|r||0|1||Shielding -10|Death +5%
Demon Armor|a|||16||||2|2
Demon Helmet|h|||10||||2|2
Demon Legs|l|||9|||||10
Demon Mengu|h|M|300|6||Fist Fighting +2, Magic Level +1|Physical +2%, Death +6%|2|10
Demon Powered Shield|s||||50|||||5
Demon Shield|s||||46|||1
Demonbone Amulet|n|||0
Demonfang Mask|h|D|300|8||Magic Level +2, Healing Magic Level +1|Physical +2%, Death +5%|2|10
Depth Calcei|b|K|150|3||Speed -5|Physical +5%|1|3
Depth Galea|h||150|8||Speed +300 *|Drowning +100%
Depth Lorica|a|P|150|16||Distance Fighting +3|Death +5%|2|2
Depth Ocrea|l|SD|130|8|||Mana Drain +15%||2
Depth Scutum|k|SD|120||33|Magic Level +2||1
Devil Helmet|h|||7|||||2
Diamond Arrow|m||150|||||||37
Diamond Necklace|n|||0
Divine Plate|a|P|75|13|||Death +10%, Holy -10%||2
Doublet|a|||2|||||1
Dracoyle Statue|e
Dragon Necklace|n|||0|||Fire +8%
Dragon Robe|a|S|75|12|||Fire +12%, Ice -12%||2
Dragon Scale Boots|b|KP|70|3|||Fire +3%, Ice -3%|1|10
Dragon Scale Helmet|h|||9|||||3
Dragon Scale Legs|l|||10|||||10
Dragon Scale Mail|a|KP||15||||1|2
Dragon Shield|s||||41|||1
Draken Boots|b|KP|80|3||Speed +15||1|2
Dreadfire Headpiece|h|S|300|8||Magic Level +2|Physical +2%, Death +6%|2|10
Dream Shroud|a|SD|180|12||Magic Level +3|Energy +10%|1|3
Drill Bolt|m||70|||||||56
Dwarven Armor|a|||10|||Physical +5%|2|3
Dwarven Helmet|h|||6|||Physical +2%|2|3
Dwarven Legs|l|||7|||Physical +3%||3
Dwarven Ring|r||0|0
Dwarven Shield|s||||34
Eagle Shield|s||||42
Earth Arrow|m||20|||||||14 Physical
Earthborn Titan Armor|a|K|100|15||Axe Fighting +2|Earth +5%, Fire -5%||10
Earthheart Cuirass|a|K|200|18||Sword Fighting +4|Earth +8%, Fire -8%||2
Earthheart Hauberk|a|K|200|18||Axe Fighting +4|Earth +8%, Fire -8%||2
Earthheart Platemail|a|K|200|18||Club Fighting +4|Earth +8%, Fire -8%||2
Earthmind Raiment|a|SD|200|15||Magic Level +4|Earth +8%, Fire -8%||2
Earthsoul Tabard|a|P|200|18||Distance Fighting +4|Earth +8%, Fire -8%||2
Ectoplasmic Shield|s|K|180||49|Axe Fighting +3, Club Fighting +3|Ice +7%, Fire -3%|1
Eerie Song Book|s||||0
Eldritch Breeches|l|P|250|9||Distance Fighting +2|Physical +2%, Holy +7%||10
Eldritch Cowl|h|S|250|7||Magic Level +2|Ice +7%|2|10
Eldritch Cuirass|a|K|250|16|||Physical +10%|2|10
Eldritch Folio|k|S|300||34|Magic Level +4, Death Magic Level +1|Earth +6%|1
Eldritch Hood|h|D|250|7||Magic Level +2|Earth +7%|2|10
Eldritch Monk Boots|b|M|300|2||Fist Fighting +2, Magic Level +1|Energy +5%|1|10
Eldritch Quiver|s|P|250
Eldritch Shield|s|K|270||51||Physical +4%|1
Eldritch Tome|k|D|300||34|Magic Level +4, Earth Magic Level +1|Fire +6%|1
Elite Draken Helmet|h|P|100|9||Distance Fighting +1|Death +3%|1|3
Elite Draken Mail|a|KP|100|15||Speed +10||2|2
Elven Amulet|n|||0|||Physical +5%, Fire +5%, Earth +5%, Energy +5%, Ice +5%, Holy +5%, Death +5%
Elven Legs|l|||4|||||3
Elven Mail|a|||9||||3|3
Embrace of Nature|a|P|220|16||Distance Fighting +4|Ice +11%, Energy -3%|1|3
Emerald Necklace|n|||0
Enchanted Blister Ring|r||220|0|||Fire +6%
Enchanted Flamingo Amulet of Destruction|n|S|270|3||Magic Level +3, Energy Magic Level +1|Physical +3%, Fire +11%
Enchanted Flamingo Amulet of Nature|n|D|270|3||Magic Level +3, Ice Magic Level +1|Physical +3%, Fire +11%
Enchanted Flamingo Amulet of Precision|n|P|270|4||Distance Fighting +4, Holy Magic Level +1|Physical +5%, Fire +14%
Enchanted Flamingo Amulet of Valor|n|K|270|4||Sword Fighting +4, Axe Fighting +4, Club Fighting +4, Shielding +1|Physical +7%, Fire +12%
Enchanted Merudri Brooch|n|M|220|0||Fist Fighting +3, Magic Level +1|Physical +4%, Fire +15%
Enchanted Pendulet|n|P|180|2||Distance Fighting +3|Energy +18%, Physical +5%
Enchanted Ring of Souls|r||200|0|||Physical +2%, Life Drain +10%
Enchanted Sleep Shawl|n|P|180|3||Distance Fighting +3|Earth +24%, Physical +7%
Enchanted Swan Amulet of Balance|n|M|270|0||Fist Fighting +4, Magic Level +2|Physical +4%, Ice +12%
Enchanted Theurgic Amulet|n|SD|220|2||Magic Level +3|Physical +3%, Earth +14%
Enchanted Turtle Amulet|n|K|200|3||Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +7%, Ice +15%
Enchanted Werewolf Amulet|n|||3|||Physical +6%
Enchanted Werewolf Helmet (Axe)|h|K|100|9||Axe Fighting +1|Physical +4%
Enchanted Werewolf Helmet (Club)|h|K|100|9||Club Fighting +1|Physical +4%
Enchanted Werewolf Helmet (Distance)|h|P|100|9||Distance Fighting +1|Physical +4%
Enchanted Werewolf Helmet (Fist)|h|M|100|9||Fist Fighting +1|Physical +4%
Enchanted Werewolf Helmet (Magic)|h|SD|100|9||Magic Level +1|Physical +4%
Enchanted Werewolf Helmet (Sword)|h|K|100|9||Sword Fighting +1|Physical +4%
Energy Ring|r|KPM|0|0
Energy Robe|a|M|200|9||Fist Fighting +4|Energy +8%, Earth -8%||2
Engraved Wedding Ring|r||0|0
Envenomed Arrow|m||70|||||||27 Physical
Ethereal Coned Hat|h|M|400|7||Fist Fighting +3, Magic Level +2|Physical +4%, Fire +8%|2|12
Ethereal Ring|r|M|400|0|||Physical 1%, Fire +4%, Earth +4%, Energy +4%, Ice +4%
Ethno Coat|a|SD||7||Magic Level +1|||1
Exotic Amulet|n||180|0|||Physical +4%, Earth +5%
Exotic Legs|l|K|130|8|||Physical +4%||10
Eye Of The Storm|e
Fabulous Legs|l|KP|225|9||Distance Fighting +2, Sword Fighting +2, Club Fighting +2, Axe Fighting +2|Physical +4%, Fire +2%||3
Falcon Circlet|h|SD|300|8||Magic Level +2|Fire +9%|2|10
Falcon Circlet (Extra Slot)|e|||0
Falcon Coif|h|KP|300|10||Distance Fighting +2, Shielding +2|Physical +3%, Fire +10%|2|10
Falcon Escutcheon|s|KP|300||52||Physical +7%, Fire +15%|1
Falcon Greaves|l|KP|300|10||Distance Fighting +3, Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +7%, Ice +7%||10
Falcon Plate|a|K|300|18||Shielding +4|Physical +12%|2|10
Falcon Shield|s|KP|300||51||Physical +6%, Fire +10%|1
Family Signet Ring|r||0|0
Feather Headdress|h|||2|||||1
Ferumbras' Amulet|n||100|3
Ferumbras' Candy Hat|h|||1|||||1
Ferumbras' Hat|h|||1|||||10
Feverbloom Boots|b|P|270|2||Distance Fighting +1, Speed +15|Ice +7%|1|10
Fiery Rainbow Shield|s|K|100||47|Shielding +3
Filthy Bunnyslippers|b|||0|||||1
Fireborn Giant Armor|a|K|100|15||Sword Fighting +2|Fire +5%, Ice -5%||2
Fireheart Cuirass|a|K|200|18||Sword Fighting +4|Fire +8%, Ice -8%||2
Fireheart Hauberk|a|K|200|18||Axe Fighting +4|Fire +8%, Ice -8%||2
Fireheart Platemail|a|K|200|18||Club Fighting +4|Fire +8%, Ice -8%||2
Firemind Raiment|a|SD|200|15||Magic Level +4|Fire +8%, Ice -8%||2
Firesoul Tabard|a|P|200|18||Distance Fighting +4|Fire +8%, Ice -8%||2
Firestorm Arrow|m||125|||||||21
Firewalker Boots|b||130|2|||Fire Field 90%
Flaming Arrow|m||20|||||||14 Physical
Flamingo Amulet of Destruction|n|S|270
Flamingo Amulet of Nature|n|D|270
Flamingo Amulet of Precision|n|P|270
Flamingo Amulet of Valor|n|K|270
Flash Arrow|m||20|||||||14 Physical
Flower Dress|a|||0
Flower Wreath|h|||0|||||1
Focus Cape|a|SD||9||Magic Level +1|||2
Foxtail Amulet|n||100|2|||Physical +5%
Frostflower Boots|b|K|270|3|||Physical +5%, Ice +5%|1|10
Frostheart Cuirass|a|K|200|18||Sword Fighting +4|Ice +8%, Energy -8%||2
Frostheart Hauberk|a|K|200|18||Axe Fighting +4|Ice +8%, Energy -8%||2
Frostheart Platemail|a|K|200|18||Club Fighting +4|Ice +8%, Energy -8%||2
Frostmind Raiment|a|SD|200|15||Magic Level +4|Ice +8%, Energy -8%||2
Frostsoul Tabard|a|P|200|18||Distance Fighting +4|Ice +8%, Energy -8%||2
Froststorm Arrow|m||125|||||||21
Frozen Claw|r||0|0
Frozen Plate|a|P|75|13|||Ice +7%, Energy -7%||2
Frozen Starlight|e
Full Helmet of the Ancients|h|||11
Fur Armor|a||50|11|||Earth +5%, Ice +5%||2
Fur Boots|b|||2||Speed -6||1|2
Fur Cap|h|||3||||2|3
Furious Frock|a|SD|130|12||Magic Level +2|Fire +5%||10
Galea Mortis|h|S|220|7||Magic Level +2|Death +6%, Holy -3%|2|3
Garlic Necklace|n|||0|||Life Drain +20%
Garnet Necklace|n|||0
Gearwheel Chain|n||75|3
Ghazbaran Oyoroi|a|M|75|8||Fist Fighting +1, Magic Level +1|Energy +7%, Ice -7%||10
Ghost Chestplate|a|P|230|17||Distance Fighting +2|Physical +3%|2|3
Ghostsilver Lantern|e
Gill Coat|a|SD|150|12||Magic Level +1|Earth +10%, Fire -10%||2
Gill Gugel|h|SD|150|5||Magic Level +2|Earth +6%, Fire -6%||2
Gill Legs|l|SD|150|7||Magic Level +1|Earth +8%, Fire -8%||2
Gill Necklace|n||150|0|||Physical +15%, Earth +10%
Girl's Dress|a|||0
Glacier Amulet|n||60|0|||Ice +20%, Energy -10%
Glacier Kilt|l|SD|40|8|||Ice +6%, Energy -6%||2
Glacier Mask|h|SD||5|||Ice +4%, Energy -5%||2
Glacier Robe|a|SD|50|11|||Ice +8%, Energy -8%||2
Glacier Shoes|b|SD|35|2|||Ice +5%, Energy -5%|1|2
Glass of Goo|e
Glooth Amulet|n|SD|75|0|||Physical +10%, Fire +10%, Earth +10%, Energy +10%, Ice +10%, Holy +10%, e Death +10%
Glooth Cape|a|SD|40|9|||Earth +5%, Fire -5%||2
Glowing Mushroom|e
Gnome Armor|a|P|200|17||Distance Fighting +3|Physical +4%, Energy +8%, Ice -2%|2|3
Gnome Helmet|h|SD|200|8||Magic Level +2|Physical +3%, Energy +8%, Ice -2%|2|3
Gnome Legs|l|SD|200|9||Magic Level +2|Energy +7%, Ice -2%||3
Gnome Shield|s|KP|200||50|Shielding +2|Physical +6%, Energy +8%, Ice -2%|1
Gnomish Cuirass|a|M|150|8||Fist Fighting +3|Physical +2%|1|2
Gnomish Footwraps|b|M|150|1||Fist Fighting +2|Physical +2%, Earth +3%|1|3
Gold Ring|r||0|0
Golden Amulet|n|||0
Golden Armor|a|KP||14||||2|2
Golden Bell|e
Golden Blessed Shield|s
Golden Boots|b|||4||||1|3
Golden Crown|h|||0
Golden Fafnar Trophy|e
Golden Helmet|h|||12||||2|10
Golden Horned Helmet|h|||0
Golden Hyaena Pendant|n|||0
Golden Legs|l|KP||9|||||2
Golden Scorpion Pendant|n|||0
Goo Shell|a|||12|||Earth +2%, Fire -2%||3
Grasshopper Legs|l||75|7||Speed +10|||2
Great Shield|s||||50|||1
Greater Garlic Necklace|n|||0|||Life Drain +50%
Green Demon Armor|a|||16||||2|2
Green Demon Helmet|h|||10||||2|2
Green Demon Legs|l|||9|||||10
Green Demon Slippers|b|||0||||1|10
Green Light|e
Green Pit Demon|e
Green Tunic|a|||1|||||1
Greenwood Coat|a|D|75|12|||Earth +12%, Fire -12%||2
Griffin Shield|s||||38|||1
Gryphon Mask|h
Guardian Boots|b|KP|70|3|||Physical +2%, Holy -2%|1|2
Guardian Ring|r||0|1
Guardian Shield|s||||39
Harmony Amulet|n|M||2||Fist Fighting +1
Hat of the Mad|h|SD||3||Magic Level +1||1|2
Haunted Mirror Piece|s||||45|||1
Heat Core|a|||12||||2|2
Heavy Metal T-Shirt|a|||6||||2|2
Hellstalker Visor|h|P|300|10||Distance Fighting +2|Physical +3%, Death +6%|2|10
Helmet of Nature|h|||3||||2|2
Helmet of the Ancients|h|||8
Helmet of the Deep|h|||2||Speed +300 *|Drowning +100%
Helmet of The Lost|h|||7||||2|2
Helmet of Ultimate Terror|h|||3||||2|2
Hibiscus Dress|a|||0
Horn (Ring)|r||0|1
Horned Helmet|h|||11|||||10
Horseman Helmet|h|||6|||||1
Ice Robe|a|M|200|9||Fist Fighting +4|Ice +8%, Energy -8%||2
Icy Culottes|l|SD||8|||Ice +8%||10
Icy Rainbow Shield|s|K|100||51
Iks Footwraps|b|M|250|2||Fist Fighting +2|Fire +4%|1|10
Incandescent Crown|h|||0
Infernal Bolt|m||110|||||||72
Ink Blade|e|K||0|||Energy +2%
Ink Brush|e|M||0|||Energy +2%
Ink Claw|e|S||0|||Energy +2%
Ink Quill|e|P||0|||Energy +2%
Ink Vine|e|D||0|||Energy +2%
Iron Crown|h|||0
Iron Helmet|h|||5|||||1
Ivory Mask|h
Jacket|a|||1|||||1
Jade Conical Hat|h|M|110|5||Fist Fighting +2|Ice +4%|1|2
Jade Hat|h|SD|60|4||Magic Level +1||1|2
Jade Legs|l|M|210|5||Fist Fighting +1 , Magic Level +1|Ice +4%||3
Jade Zaoan Bishop|e
Jade Zaoan King|e
Jade Zaoan Knight|e
Jade Zaoan Pawn|e
Jade Zaoan Queen|e
Jade Zaoan Rook|e
Jerom's Family Necklace|n|||0
Jester Hat|h|||1|||||2
Journal Shield|s
Jungle Quiver|s|P|150
Jungle Survivor Legs|l|M|130|5||Fist Fighting +1|Fire +4%||10
Knight Armor|a|KP||12||||2|2
Knight Legs|l|KP||8|||||1
Koshei's Ancient Amulet|n|||0|||Death +8%, Holy -50%
Krimhorn Helmet|h|||6|||||1
Lamp|e
Laurel Wreath|h|||0
Lavos Armor|a|KP|60|13|||Fire +3%, Ice -3%||2
Leaf Crown|h|||0
Leaf Legs|l|||0|||||1
Leaf Robe|a|M|200|9||Fist Fighting +4|Earth +8%, Fire -8%||2
Leather Armor|a|||4|||||1
Leather Boots|b|||1||||1|1
Leather Harness|a|||9|||||1
Leather Helmet|h|||1|||||1
Leather Legs|l|||1|||||1
Lederhosen|l|||0
Legion Helmet|h|||4|||||2
Legs of Enlightenment|l|M|40|4||Fist Fighting +1|Earth +3%||1
Legs of Wisdom|l|M|80|4||Fist Fighting +1|Energy +3%||2
Leopard Armor|a|||9||||2|2
Leviathan's Amulet|n||80|0|||Physical +60%, Ice +40%
Life Ring|r||0|0
Light Bandana|h|M||3||Fist Fighting +1|||1
Lightning Boots|b|SD|35|2|||Energy +5%, Earth -5%|1|2
Lightning Headband|h|SD||5|||Energy +4%, Earth -5%||2
Lightning Legs|l|SD|40|8|||Energy +6%, Earth -6%||2
Lightning Pendant|n||60|0|||Energy +20%, Earth -10%
Lightning Robe|a|SD|50|11|||Energy +8%, Earth -8%||2
Lion Amulet|n||230|3|||Physical +3%, Ice +7%
Lion Plate|a|K|270|17||Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +6%|2|10
Lion Ring|r||0
Lion Shield|s|K|250||51||Physical +7%, Earth +10%|1
Lion Spangenhelm|h|P|230|7||Distance Fighting +2|Physical +3%, Earth +5%|2|10
Lion Spellbook|k|SD|220||32|Magic Level +4|Physical +3%, Ice +7%|1
Lit Torch|e|||0|||Holy +2%
Living Armor|a|SD|180|13||Magic Level +2|Earth +12%, Fire -5%|1|3
Mage Hat|h|SD||3||||2|1
Mage's Cap|h|SD||3|||Fire +4%||10
Magic Light Wand|e
Magic Plate Armor|a|KP||17||||2|2
Magical Torch|e|||||Speed +25
Magician Hat|h|||1||||2|3
Magician's Robe|a|SD||6|||||1
Magma Amulet|n||60|0|||Fire +20%, Ice -10%
Magma Boots|b|SD|35|2|||Fire +5%, Ice -5%|1|2
Magma Coat|a|SD|50|11|||Fire +8%, Ice -8%||2
Magma Legs|l|SD|40|8|||Fire +6%, Ice -6%||2
Magma Monocle|h|SD||5|||Fire +4%, Ice -5%.||2
Magma Robe|a|M|200|9||Fist Fighting +4|Fire +8%, Ice -8%||2
Make-do Boots|b|D|150|2||Magic Level +1|Ice +6%|1|10
Makeshift Boots|b|S|150|2||Magic Level +1|Fire +6%|1|10
Maliceforged Helmet|h|K|300|10||Sword Fighting +2, Axe Fighting +2, Club Fighting +2|Physical +3%, Death +6%|2|10
Mammoth Fur Cape|a|||10||||2|2
Mammoth Fur Shorts|l|||0|||||2
Mariner's Anchor|e|||0|||hard drinking
Master Archer's Armor|a|P|100|15||Distance Fighting +3||1|3
Mastermind Shield|s||||49|||1
Mathmaster Shield|s
Meat Shield|s||||13|||1
Medusa Shield|s||||43|||1
Mercenary Shield|s||||24
Merudri Battle Mail|a|M|300|10||Fist Fighting +4, Magic Level +1|Earth +10%, Energy -5%|2|10
Merudri Brooch|n|M|220|0
Merudri Nanbando|a|M|125|7||Fist Fighting +3||1|2
Merudri Scale Mail|a|M|100|7||Fist Fighting +2|Fire +4%||3
Metal Spats|b|KP|50|1|||Physical +1%|1|2
Midnight Panther Doll|e
Midnight Sarong|l|D|250|8||Magic Level +2|Ice +7%||10
Midnight Tunic|a|D|300|16||Magic Level +4|Physical +3%|1|10
Might Ring|r||0|0|||Physical +20%, Fire +20%, Earth +20%, Energy +20%, Ice +20%, Holy +20%, Death +20%
Mighty Helm of Green Sparks|h|||6|||||2
Mining Helmet|h|||1|||||1
Mining Helmet (Budrik)|h|||0
Mino Shield|s||||41
Mirror Mask|h
Molten Plate|a|P|75|13|||Fire +7%, Ice -7%||10
Monk Robe|a|M||7||Fist Fighting +1|||1
Mooh'tah Plate|a|KP||12||||2|2
Moon Mirror|e|||0|||Death +5%
Moonlight Ipomea's Stamen|e
Moonsilver Battle Visor|h|K|800|14||Sword Fighting +4, Club Fighting +4, Axe Fighting +4, Magic Level +1|Physical +8%, Fire +10%|2|10
Moonsilver Nimbus Hat|h|S|800|10||Magic Level +4|Physical +3%, Ice +8%|2|10
Moonsilver Spirit Mask|h|D|800|10||Magic Level +4|Physical +3%, Energy +8%|2|10
Moonsilver Strike Helm|h|M|800|8||Fist Fighting +4, Magic Level +3|Physical +5%, Earth +8%|2|10
Moonsilver Trail Hood|h|P|800|12||Distance Fighting +4, Holy Magic Level +2|Physical +6%, Earth +10%|2|10
Morshabaal's Extract|e
Morshabaal's Mask|s||150||0|Fire Magic Level +1, Ice Magic Level +1, Earth Magic Level +1, Energy Magic Level +1||0
Mutant Bone Boots|b|D|250|2||Magic Level +1|Death +3%|1|10
Mutant Bone Kilt|l|D|300|8||Magic Level +2|Physical +3%||10
Mutant Hide Trousers|l|M|300|6||Fist Fighting +2 , Magic Level +1|Physical +2%, Earth +5%||10
Mutated Skin Armor|a|P|270|17||Distance Fighting +3|Physical +3%, Earth +8%|2|10
Mutated Skin Legs|l|P|270|9||Distance Fighting +2|Physical +4%, Earth +4%||10
Mystic Turban|h|||1|||||1
Mystical Dragon Robe|a|D|300|15||Magic Level +3, Earth Magic Level +1|Fire +12%, Ice -6%|1|10
Naga Quiver|s|P|250||||Ice +2%
Naga Tanko|a|M|270|10||Fist Fighting +3, Magic Level +2|Physical +2%, Fire +6%|2|10
Native Armor|a|||7|||||10
Necklace of the Deep|n||120|0|||Life Drain +50%
Necromancer Shield|s||||49|||1
Nightmare Shield|s||||49|||1
Noble Armor|a|||11||||2|1
Norcferatu Bloodhide|a|S|270|16||Energy Magic Level +6, Fire Magic Level +3|Earth +8%|1|10
Norcferatu Bloodstrider|l|D|270|8||Magic Level +2|Death +4%||10
Norcferatu Bonecloak|a|D|270|16||Earth Magic Level +6, Healing Magic Level +3|Ice +8%|1|10
Norcferatu Bonehood|h|M|230|5||Fist Fighting +2|Physical +2%, Ice +5%|2|10
Norcferatu Fangstompers|b|S|270|2||Magic Level +1|Death +3%|1|10
Norcferatu Fleshguards|l|M|230|5||Fist Fighting +2|Death +4%||10
Norcferatu Goretrampers|b|K|270|3||Speed +15|Physical +5%, Earth +5%|1|10
Norcferatu Skullguard|h|P|270|9||Distance Fighting +2|Physical +3%, Ice +6%|2|10
Norcferatu Thornwraps|l|P|270|9||Distance Fighting +2|Physical +4%, Death +4%||10
Norcferatu Tuskplate|a|K|270|22||Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +4%||10
Norse Shield|s||||37|||1
Obsidian Zaoan Bishop|e
Obsidian Zaoan King|e
Obsidian Zaoan Knight|e
Obsidian Zaoan Pawn|e
Obsidian Zaoan Queen|e
Obsidian Zaoan Rook|e
Oceanborn Leviathan Armor|a|K|100|15||Shielding +1|Ice +5%, Energy -5%||10
Odd Hat|h|||5||||2|2
Old Cape|a|||1|||||3
Onyx Arrow|m||40|||||||38
Onyx Pendant|n||60|2|||Death +2%
Oriental Shoes|b|SD|80|2||Speed +15||1|2
Ornamented Brooch|n|||2
Ornamented Shield|s||||29|||1
Ornate Chestplate|a|K|200|16||Shielding +3|Physical +8%|2|2
Ornate Legs|l|K|185|8|||Physical +5%||2
Ornate Shield|s|K|130||47||Physical +5%|1
Painted Gourd Rattle|s
Pair of Dreamwalkers|b|SD|180|2||Magic Level +1|Earth +8%|1|3
Pair of Earmuffs|h|||0|||Ice +2%||2
Pair of Nightmare Boots|b|SD|140|2||Magic Level +1|Energy +6%|1|3
Pair of Old Bracers|a|||1
Pair of Soft Boots|b
Pair of Soulstalkers|b|P|400|3||Distance Fighting +1, Speed +20|Physical +5%|1|10
Pair of Soulwalkers|b|K|400|4||Sword Fighting +1, Club Fighting +1, Axe Fighting +1, Speed +15|Physical +7%, Fire +5%|1|10
Paladin Armor|a|P||12||Distance Fighting +2||1|2
Party Hat|h|||1|||||1
Patched Boots|b|||2||||1|10
Paw Amulet|n|||0
Pendulet|n|P|180|0
Percht-Warding Torch|e
Phoenix Shield|s||||45|||1
Piercing Bolt|m||30|||||||33
Pirate Boots|b|||2||||1|1
Pirate Hat|h|||3|||||1
Pirate Knee Breeches|l|||1|||||1
Pirate Shirt|a|||3|||||1
Plain Monk Robe|a|M||6||Fist Fighting +1|||1
Plate Armor|a|||10|||||1
Plate Legs|l|||7|||||1
Plate Shield|s||||23
Platinum Amulet|n|||2
Poison Arrow|m||0|||||||23
Porcelain Mask|h|||1|||Mana Drain +10%||2
Post Officer's Hat|h|||1|||||1
Power Arrow|m
Power Bolt|m||55|||||||40
Power Ring|r||0|0||Fist Fighting +6
Prismatic Armor|a|KP|120|15||Speed +15|Physical +5%|1|2
Prismatic Bolt|m||90|||||||66
Prismatic Boots|b|P|150|3||Speed +15|Death +3%|1|2
Prismatic Helmet|h|K|150|9||Shielding +1|Physical +5%||2
Prismatic Legs|l|P|150|8||Distance Fighting +2|Physical +3%||2
Prismatic Necklace|n||150|0|||Physical +10%, Energy +15%
Prismatic Ring|r||120|0|||Physical +10%, Energy +8%
Prismatic Shield|s|K|150||49|Shielding +2|Physical +4%
Protection Amulet|n|||0|||Physical +6%
Pumpkinhead|e
Quiver|s|P|0
Ragnir Helmet|h|||6|||||1
Rainbow Necklace|n||220|2|||Physical +3%, Fire +6%, Ice -5%
Rainbow Shield|s|K|100||39
Rainbow Torch|e
Ranger Legs|l|P||4|||||1
Ranger's Cloak|a|P||7|||||1
Red Pit Demon|e
Red Quiver|s|P|0
Red Robe|a|||1|||||1
Red Tunic|a|||2
Refined Stag Shield|s|K|350||54|Axe Fighting +2, Club Fighting +2, Sword Fighting +2|Physical +5%, Ice +12%|1
Reflecting Crown|h|||0
Rerun's Ring|r
Rhodolith Necklace|n|||0
Rift Shield|s||||49|||1
Ring of Blue Plasma|r|P|100|0||Distance Fighting +3, Magic Level +1
Ring of Ending|r||200|0
Ring of Green Plasma|r|SD|100|0||Magic Level +2
Ring of Healing|r||0|0
Ring of Orange Plasma|r|M|100|0||Fist Fighting +3, Magic Level +1|Physical +2%
Ring of Red Plasma|r|K|100|0||Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +3%
Ring of Secret Thoughts|r
Ring of Secret Thoughts (Charged)|r
Ring of Souls|r||200|0
Ring of Temptation|r||100|0|||Mana Drain +30%
Ring of the Sky|r||0|0
Ring of Wishes|r||0|0
Robe of Enlightenment|a|M|150|8||Fist Fighting +3|Ice +4%|1|1
Robe of the Ice Queen|a|D|75|12|||Ice +12%, Energy -12%||10
Robe of the Underworld|a|S|100|12|||Death +12%, Holy -12%||2
Rose Shield|s||||36
Royal Draken Mail|a|K|100|16||Shielding +3|Physical +5%||3
Royal Helmet|h|||9||||2|2
Royal Scale Robe|a|SD|100|12||Magic Level +2|Fire +5%||3
Rubber Cap|h|SD|70|5||Magic Level +1|Earth +3%, Fire -3%||2
Ruby Necklace|n|||0
Runic Ice Shield|s||||41|||1
Rusty Winged Helmet|h|||2|||||1
Sacred Tree Amulet|n||80|0|||Physical +60%, Earth +40%
Salamander Shield|s||||34
Sandals|b|||0||||1|1
Sanguine Boots|b|S|500|3||Magic Level +2, Speed +10, Death Magic Level +1|Physical +2%, Ice +8%|1|10
Sanguine Galoshes|b|D|500|3||Magic Level +2, Speed +10, Healing Magic Level +1|Protection Physical +2%, Fire +8%|1|10
Sanguine Greaves|l|P|500|11||Distance Fighting +4, Holy Magic Level +1|Protection Physical +7%, Energy +9%||10
Sanguine Legs|l|K|500|12||Sword Fighting +4, Axe Fighting +4, Club Fighting +4|Protection Physical +9%, Death +6%||10
Sanguine Trousers|l|M|500|6||Fist Fighting +4, Magic Level +2|Physical +4%, Energy +8%||10
Santa Hat|h|||1|||||1
Sapphire Amulet|n|||0
Sapphire Necklace|n|||0
Scale Armor|a|||9|||||1
Scarab Amulet|n|||0
Scarab Ocarina|e|||0|||Earth +2%
Scarab Shield|s||||33
Scarf|n|||1
Sedge Hat|h|||2|||||1
Sensing Crown|h|||0
Sentinel Shield|s||||29|||1
Shamanic Mask|h|||4||||2|2
Shapeshifter Ring|r||0|1
Shatterstorm Arrow|m||50|||||||27
Shield of Care|s||||11|||1
Shield of Corruption|s|K|80||47|Sword Fighting +3||1
Shield of Destiny|s
Shield of Endless Search|s
Shield of Honour|s||||43
Shield of the White Knight|s||||11|||1
Shimmer Glower|e
Shiver Arrow|m||20|||||||14 Physical
Shockwave Amulet|n||80|0|||Physical +60%, Energy +40%
Shoulder Plate|k|SD|180||34|Magic Level +3|Earth +6%, Physical +2%|1
Shroud of Despair|h||150|7|||Death +3%||10
Shrunken Head Necklace|n||150|0||Speed +10
Silver Amulet|n|||0|||Earth +10%
Silver Fafnar Trophy|e
Silver Mask|h
Silver Necklace|n|||0
Simple Arrow|m||0|||||||20
Simple Dress|a|||0
Skull (Item)|e
Skull Candle|e
Skull Helmet|h|||9||||2|2
Skullcracker Armor|a|K|85|14|||Death +5%, Holy -5%||2
Sleep Shawl|n|P|180|0
Small Lamp|e
Snake God's Wristguard|k|SD|100||23|Magic Level +3
Sniper Arrow|m||20|||||||28
Snow Globe|e
Soldier Helmet|h|||5|||||1
Soulbastion|s|K|400||55||Physical +10%, Death +10%|1
Soulforged Lantern|e
Soulful Legs|l|SD|180|8||Magic Level +1|Holy +8%||3
Soulgarb|a|M|400|11||Fist Fighting +4 , Magic Level +2|Physical +4%, Ice +8%|2|10
Soulmantle|a|S|400|17||Magic Level +4|Physical +4%|2|10
Soulshanks|l|S|400|10||Magic Level +3|Death +10%||10
Soulshell|a|P|400|18||Distance Fighting +4|Physical +3%, Fire +15%|2|10
Soulshroud|a|D|400|17||Magic Level +4|Death +10%|2|10
Soulsoles|b|M|400|2||Fist Fighting +3, Speed +20|Physical +3%, Ice +6%|1|10
Soulstrider|l|D|400|10||Magic Level +3|Fire +10%||10
Sparking Rainbow Shield|s|K|100||47|Speed +10
Spectral Bolt|m||150|||||||78
Spectral Dress|a
Spellbook|k|SD|0||23|||1
Spellbook of Ancient Arcana|k|SD|150||31|Magic Level +4|Death +5%
Spellbook of Dark Mysteries|k|SD|80||26|Magic Level +3
Spellbook of Enlightenment|k|SD|30||29|Magic Level +1||1
Spellbook of Lost Souls|k|SD|60||32|Magic Level +2
Spellbook of Mind Control|k|SD|50||26|Magic Level +2
Spellbook of the Novice|k|SD|||13
Spellbook of Vigilance|k|SD|130||32|Magic Level +3|Earth +3%, Fire -3%
Spellbook of Warding|k|SD|40||36|Magic Level +1||1
Spellscroll of Prophecies|k|SD|70||20|Magic Level +3
Spellweaver's Robe|a|SD|60|11|||Energy +10%, Earth -10%||2
Sphinx Tiara|h|||0
Spike Shield|s||||37
Spirit Bind|a|M|75|8||Fist Fighting +2|Energy +5%, Ice -5%||2
Spirit Cloak|a|SD||8||Magic Level +1|||1
Spirit Guide|k|SD|180||28|Magic Level +4|Energy +6%|1
Spiritthorn Armor|a|K|400|20||Sword Fighting +4, Club Fighting +4, Axe Fighting +4|Physical +13%|2|10
Spiritthorn Helmet|h|K|400|12||Sword Fighting +3, Club Fighting +3, Axe Fighting +3|Physical +6%, Energy +10%|2|10
Spiritthorn Ring|r|K|400|0|||Physical +2%, Fire +4%, Earth +4%, Energy +4%, Ice +4%
Spooky Hood|h
Stag Boots|b|D|350|2||Earth Magic Level +1, Magic Level +1|Energy +8%|1|10
Stag Footwraps|b|M|350|2||Fist Fighting +2|Physical +2%, Death +3%|1|10
Stag Helmet|h|S|350|8||Magic Level +2, Fire Magic Level +2|Physical 2%, Energy +8%|2|10
Stag Legs|l|K|350|10||Axe Fighting +3, Club Fighting +3, Sword Fighting +3, Shielding +2|Physical +7%, Fire +7%||10
Stag Plate|a|P|350|17||Distance Fighting +3, Shielding +3|Physical +3%, Ice +8%|2|10
Stag Robe|a|M|350|10||Fist Fighting +4|Physical +4%|2|10
Stag Scrolls|k|D|350||34|Magic Level +5|Physical +2%, Death +5%|1
Stag Shield|s|K|350||52||Physical +5%, Ice +10%|1
Stag Shinguards|b|P|350|2||Speed + 10, Distance Fighting +1|Physical +2%, Energy +5%|1|10
Stag Spellbook|k|S|350||34|Magic Level +5|Physical +2%, Energy +6%|1
Star Amulet|n|||0
Star Ring|r||0|0
Starlight Vial|e|||0|||Mana Drain +5%
Statue of Devovorga|e
Stealth Ring|r||0|0
Steel Boots|b|||3||||1|2
Steel Helmet|h|||6|||||1
Steel Shield|s||||28|||1
Stitched Mutant Hide Legs|l|K|270|9||Sword Fighting +2, Axe Fighting +2, Club Fighting +2|Physical +5%, Earth +5%||10
Stoic Iks Boots|b|P|250|2||Distance Fighting +1, Speed + 15|Fire +5%|1|10
Stoic Iks Casque|h|P|250|8||Distance Fighting +2|Physical +3%, Energy + 6%|2|10
Stoic Iks Chestplate|a|K|250|16||Shielding +3|Physical +8%|2|10
Stoic Iks Cuirass|a|D|250|15||Magic Level +4|Death +5%|1|10
Stoic Iks Culet|l|K|250|9||Sword Fighting +2, Axe Fighting +2, Club Fighting +2|Physical +4%, Energy + 2%||10
Stoic Iks Faulds|l|S|250|8||Magic Level +2|Fire +6%||10
Stoic Iks Headpiece|h|D|250|8||Magic Level +2|Death +3%|2|10
Stoic Iks Robe|a|M|250|9||Fist Fighting +4|Physical +2%, Energy +5%|2|10
Stoic Iks Sandals|b|S|250|2||Magic Level +1|Ice +6%|1|10
Stone of Insight|e
Stone of Wisdom|e
Stone Skin Amulet|n|||0|||Physical +80%, Death +80%
Strange Good Night Songs|s||||0
Strange Helmet|h|||6|||||1
Strange Talisman|n|||0|||Energy +10%
Studded Armor|a|||5|||||1
Studded Helmet|h|||2|||||1
Studded Legs|l|||2|||||1
Studded Shield|s||||20
Summer Dress|a|||0|||Death +5%
Sun Catcher|e|||0|||Fire +5%
Sun Mirror|e
Suspicious Signet Ring|r||0|0
Swamplair Armor|a|KP|60|13|||Earth +3%, Fire -3%||2
Swan Amulet of Balance|n|M|270
Swan Feather Cloak|a||60|12||Speed +10|Earth +12%, Energy +12%||2
Sweetheart Ring|r||0|0
Sword Ring|r||0|0||Sword Fighting +4
Tarsal Arrow|m||30|||||||33
Tatty Dragon Scale Legs|l|||2|||||1
Tempest Shield|s||||47|||1
Terra Amulet|n||60|0|||Earth +20%, Fire -10%
Terra Boots|b|SD|35|2|||Earth +5%, Fire -5%|1|2
Terra Helmet|h|K|230|9||Sword Fighting +2, Club Fighting +2, Axe Fighting +2|Physical +5%, Earth +5%|1|3
Terra Hood|h|SD||5|||Earth +4%, Fire -5%||2
Terra Legs|l|SD|40|8|||Earth +6%, Fire -6%||2
Terra Mantle|a|SD|50|11|||Earth +8%, Fire -8%||2
Terran Rainbow Shield|s|K|100||49
Terrastorm Arrow|m||125|||||||21
The Broken Sword of Eldoran Etzel|e|||0
The Cobra Amulet|n||250|4|||Death +9%
The Crown of the Percht Queen (Fire)|h
The Crown of the Percht Queen (Ice)|h
The Dragon Spirit|s
The Epic Wisdom|h
The Eye of Suon|n
The Lion's Heart|n
The Mariner's Compass from the Antoinette|e|||0
The Rain Coat|a|||1
The Shield Nevermourn|s||||33
Thunderheart Cuirass|a|K|200|18||Sword Fighting +4|Energy +8%, Earth -8%||2
Thunderheart Hauberk|a|K|200|18||Axe Fighting +4|Energy +8%, Earth -8%||2
Thunderheart Platemail|a|K|200|18||Club Fighting +4|Energy +8%, Earth -8%||2
Thundermind Raiment|a|SD|200|15||Magic Level +4|Energy +8%, Earth -8%||2
Thundersoul Tabard|a|P|200|18||Distance Fighting +4|Energy +8%, Earth -8%||2
Thunderstorm Arrow|m||125|||||||21
Tiara of Power|h|SD|100|7||Speed +20|Energy +8%
Time Ring|r||0|0||Speed +30
Toga Mortis|a|S|220|16||Magic Level +4|Death +6%|1|3
Torch|e
Tortoise Shield|s||||34
Tower Shield|s||||42|||1
Traditional Gamsbart Hat|h|||0
Traditional Leather Shoes|b|||0
Traditional Neckerchief|n
Traditional Shirt|a|||0
Trapped Lightning|e
Treader of Torment|b|||4||||1|10
Tribal Mask|h|||2|||||1
Trousers of the Ancients|l|||2|||||2
Tunic|a|||0
Turtle Amulet|n|K|200|0
Tusk Shield|s||||36
Umbral Master Spellbook|k|SD|250||32|Magic Level +4|Earth +5%, Energy +5%, Fire +5%, Ice +5%|1
Umbral Spellbook|k|SD|150||26|Magic Level +2|Earth +3%, Energy +3%, Fire +3%, Ice +3%|1
Unerring Dragon Scale Armor|a|P|300|17||Distance Fighting +3, Holy Magic Level +1|Energy +10%, Earth -5%|2|10
Unstable Ring of Ending|r||0|0
Vampire Shield|s||||45|||1
Vampire Silk Slippers|b|||0||||1|10
Vampire's Signet Ring|r||0|0
Velvet Mantle|a|S|75|12|||Energy +12%, Earth -12%||2
Viking Helmet|h|||4|||||1
Viking Shield|s||||29|||1
Visage of the End Days|h|||10||||2|10
Void Boots|b||150|2||Speed +30|Energy +10%
Voltage Armor|a|KP|60|13|||Energy +3%, Earth -3%||2
Vortex Bolt|m||40|||||||36
Wailing Widow's Necklace|n|||0
Warrior Helmet|h|||8||||2|2
Warrior's Shield|s||||43|||1
Wedding Ring|r||0|0
Wereboar Loincloth|l|||6|||||2
Werewolf Amulet|n|||0
Werewolf Helmet|h||100|9||Speed +15
White Dress|a|||0
Windborn Colossus Armor|a|K|100|15||Club Fighting +2|Energy +5%, Earth -5%||2
Winged Boots|b|P|220|2||Distance Fighting +1, Speed +15|Earth +7%|1|3
Winged Helmet|h|||10|||||10
Witch Hat|h|SD||3|||Mana Drain +5%|1|2
Witchhunter's Coat|a||50|11|||Death +2%, Holy -2%
Wolf Tooth Chain|n|||0
Wolf Tooth Chain (Quest)|n|||0
Wood Cape|h|P||3||Distance Fighting +1|Earth +4%||2
Wooden Shield|s||||19
Wooden Spellbook|k|SD|80||26|Magic Level +2|Earth +5%|1
Worn Firewalker Boots|b||130|0
Worn Soft Boots|b
Yalahari Armor|a|K|80|16|||Death +3%||2
Yalahari Footwraps|b|M|80|1||Fist Fighting +2|Death +3%|1|10
Yalahari Leg Piece|l|P|80|8||Distance Fighting +2|Death +5%||2
Yalahari Mask|h|SD|80|5||Magic Level +2||1|2
Yetislippers|b|||0|||||2
Zaoan Armor|a|KP|50|13||Speed +10|||2
Zaoan Helmet|h|KP||9|||Physical +5%|1|2
Zaoan Legs|l|||8|||Physical +2%||2
Zaoan Monk Robe|a|M|50|7||Fist Fighting +1|||2
Zaoan Robe|a|SD|60|11|||Fire +10%, Ice -10%||2
Zaoan Shoes|b|||1||Speed +5||1|2`;
