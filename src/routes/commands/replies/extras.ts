import type { ChatEmbed } from "$lib/components/home/fluxer/types";
import { OK, ash, bot, chat, dmChat, emoji, ok, pages, picture, reply, type CommandPreview } from "./chat";

const PINK = "#ffb6c1";
const LOOKUP = "#f699cd";

const bar = {
  start: "<:bar_e1:1566977326292414465>",
  middle: "<:bar_e2:1566977330432188417>",
  end: "<:bar_e3:1566977341735841793>",
  emptyStart: "<:bar1:1566977276690567168>",
  emptyMiddle: "<:bar2:1566977296970022912>",
  emptyEnd: "<:bar3:1566977303370534914>",
};

/** `ExtrasService.ProgressBar` drawn with the bot's bar emoji. */
const progressBar = (value: number, max: number, length = 10) => {
  const filled = Math.min(length, Math.floor((value / max) * length));
  return Array.from({ length }, (_, i) => {
    const full = i < filled;
    if (i === 0) return full ? bar.start : bar.emptyStart;
    if (i === length - 1) return full ? bar.end : bar.emptyEnd;
    return full ? bar.middle : bar.emptyMiddle;
  }).join("");
};

/** A preview whose reply is a single message. */
const one = (input: string, response: Parameters<typeof reply>[1], height: number): CommandPreview => ({
  scene: reply(input, response),
  height,
});

const helpCategories: [string, number][] = [
  ["Achievements", 6],
  ["Breeding", 5],
  ["Catch", 1],
  ["Duels", 5],
  ["Extras", 20],
  ["Fishing", 1],
  ["Games", 7],
  ["Gift", 5],
  ["Hatchery", 4],
  ["Help", 2],
  ["Items", 5],
  ["Market", 5],
  ["Missions", 5],
  ["Party", 10],
  ["Pokemon", 16],
  ["Server", 2],
  ["Shop", 12],
  ["Spawn", 10],
  ["Start", 2],
  ["Trade", 12],
  ["Trade Admin", 8],
  ["Vouchers", 5],
];

const balanceEmbed: ChatEmbed = {
  color: PINK,
  title: "ash - Trainer Information",
  fields: [
    { name: "Balances", value: "**Credits:** 184,350\n**Redeems:** 12\n**Mystery Tokens:** 3\n**Dittopia Rep.:** 0" },
    {
      name: "Game Progress",
      value: `**Energy:** ${progressBar(8, 10)} (8/10)\n**EV Points:** 510\n**Upvote Points:** 14\n**Vote Streak:** 6\n**Holding:** Good Rod\n**Region:** Original`,
    },
  ],
  footer: "💰 Main | 📦 Chests | 📋 Details | 🪙 Tokens",
};

const damageClass = { status: emoji.status, physical: emoji.physical, special: emoji.special };

/** The first page of Pikachu's learnable moves: class, name, power, accuracy and type. */
const movesetLines: [keyof typeof damageClass, string, string, string, string][] = [
  ["status", "Agility", "", "", "Psychic"],
  ["status", "Attract", "", "100", "Normal"],
  ["status", "Baby doll eyes", "", "100", "Fairy"],
  ["status", "Bestow", "", "", "Normal"],
  ["physical", "Bide", "", "", "Normal"],
  ["physical", "Body slam", "85", "100", "Normal"],
  ["physical", "Brick break", "75", "100", "Fighting"],
  ["status", "Calm mind", "", "", "Psychic"],
  ["status", "Captivate", "", "100", "Normal"],
  ["status", "Celebrate", "", "", "Normal"],
  ["status", "Charge", "", "", "Electric"],
  ["special", "Charge beam", "50", "90", "Electric"],
  ["status", "Charm", "", "100", "Fairy"],
  ["status", "Confide", "", "", "Normal"],
  ["physical", "Counter", "", "100", "Fighting"],
  ["physical", "Covet", "60", "100", "Normal"],
  ["status", "Curse", "", "", "Ghost"],
  ["status", "Defense curl", "", "", "Normal"],
  ["status", "Detect", "", "", "Fighting"],
  ["physical", "Dig", "80", "100", "Ground"],
];

/** Previews for the Extras commands, fishing, items and help. */
export const extrasPreviews: Record<string, CommandPreview> = {
  bag: {
    ...one(";bag", ok("I sent your bag to your DMs."), 255),
    dm: {
      scene: dmChat(
        bot({
          color: "#5d3fd3",
          title: "Your Current Bag",
          description: "Fire stone : 1x\nLeaf stone : 3x\nRare candy : 5x\nWater stone : 2x",
        }),
      ),
      height: 270,
    },
  },
  bal: { scene: reply(";bal", balanceEmbed, ["💰", "📦", "📋", "🪙"].map((e) => ({ emoji: e, count: 1 }))), height: 565 },
  "equip rod": one(";equip rod good", ok("You have successfully equipped Good rod."), 255),
  hunt: one(
    ";hunt koffing",
    {
      color: PINK,
      title: "Shadow Hunt",
      description: "Successfully changed shadow hunt selection to **Koffing**.",
      image: picture("fc95d4e9191edd7f9335711ba72a8da8.png"),
    },
    595,
  ),
  "lookup ability": {
    scene: chat(
      ash(";lookup ability drizzle"),
      bot({ color: LOOKUP, title: "Drizzle", fields: [{ name: "Effect", value: "Effect information is stored in the database" }] }),
      bot({ color: LOOKUP, title: "Pokemon with Drizzle", description: "Politoed\nPelipper\nKyogre", footer: "Page 1/1" }),
    ),
    height: 460,
  },
  "lookup move": one(
    ";lookup move thunderbolt",
    {
      color: "#f7cf41",
      title: "Thunderbolt",
      description: "**Damage Class:** `Special` | **Power:** `90`\n**Accuracy:** `100` | **Type:** `Electric` | **PP:** `24` ",
      fields: [{ name: "Effect", value: "Effect chance: 10%" }],
    },
    355,
  ),
  "lookup type": one(
    ";lookup type fire",
    {
      color: LOOKUP,
      title: "Fire",
      description: [
        "**x2 damage from:** `Ground, Rock, Water`",
        "**x1 damage from:** `Normal, Fighting, Flying, Poison, Ghost, Electric, Psychic, Dragon, Dark`",
        "**x1/2 damage from:** `Bug, Steel, Fire, Grass, Ice, Fairy`",
        "",
        "**x2 damage to:** `Bug, Steel, Grass, Ice`",
        "**x1 damage to:** `Normal, Fighting, Flying, Poison, Ground, Ghost, Electric, Psychic, Dark, Fairy`",
        "**x1/2 damage to:** `Rock, Fire, Water, Dragon`",
      ].join("\n"),
    },
    445,
  ),
  "poke addevs": one(";poke addevs 252 speed", ok("You have successfully added 252 EVs to the speed Stat of your Selected Pokemon!"), 270),
  "poke learn": one(";poke learn 1 thunderbolt", ok("You have successfully learned thunderbolt as your slot 1 move"), 270),
  "poke moves": one(
    ";poke moves",
    {
      color: PINK,
      title: "Moves",
      fields: ["thunderbolt", "quick-attack", "iron-tail", "electro-ball"].map((move, i) => ({ name: `**Move ${i + 1}**:`, value: move })),
      footer: "See available moves with ;poke moveset",
    },
    475,
  ),
  "poke learn_all": one(
    ";poke learn_all thunderbolt quick-attack iron-tail volt-tackle",
    ok(
      "Your __**(Pikachu)**__ successfully learned the following moves:\n> __**Thunderbolt**__, __**Quick-Attack**__, __**Iron-Tail**__, and __**Volt-Tackle**__",
    ),
    310,
  ),
  "poke moveset": {
    scene: reply(
      ";poke moveset",
      {
        color: PINK,
        title: "Learnable Move List",
        description: movesetLines
          .map(([cls, name, power, acc, type]) => `**${damageClass[cls]} ${name}** - Power:\`${power}\` Acc:\`${acc}\` Type:\`${type}\``)
          .join("\n"),
        footer: "Page 1/7",
      },
      pages(7),
    ),
    height: 750,
  },
  "spread honey": one(";spread honey", ok("You have successfully spread some of your honey!\n> 🕐**Lasts for:** <t:3600:R> 🕐"), 290),
  "spread server": one(
    ";spread server",
    {
      color: "#ffbc61",
      title: "Server Stats",
      description: "**Honey** active in:\n<#general> -> `Expires:` <t:2520:R>\n\n**Honey** active in:\n<#trades> -> `Expires:` <t:900:R>",
    },
    355,
  ),
  region: one(";region alola", ok("Your region has been set to **Alola**."), 255),
  "set nature": one(";set nature adamant", ok("You have successfully changed your selected Pokemon's nature to Adamant"), 270),
  "set nick": one(";set nick Sparky", ok("Successfully changed Pokemon nickname to Sparky."), 255),
  trainernick: one(";trainernick AshK", ok("Successfully Changed Trainer Nick"), 255),
  "visible bal": one(";visible bal", ok("Toggled trainer card visibility!"), 255),
  "visible donations": one(";visible donations true", ok("Your donations total will now show on your balance."), 255),
  "fish cast": one(
    ";fish cast",
    {
      color: "#00ff00",
      title: "You fished up a... ```p▫️yd▫️ck```",
      description:
        "You have 18 seconds to guess the Pokemon's name to catch it!\nYour Good Rod gave you 2 extra seconds!\nMention <@PokeFlux> with the name to catch it!",
      image: picture("23fd0df6dee4b62826c19d16502302fd.gif", 329, 328),
    },
    680,
  ),
  "items apply": one(";items apply thunder stone", "Your thunder-stone was consumed!", 230),
  "items drop": one(";items drop", "Successfully Dropped the everstone", 230),
  "items equip": one(";items equip lucky egg", "You have successfully given your selected Pokemon a lucky-egg", 250),
  "items transfer": one(";items transfer 12", "You have successfully transfered the lucky-egg from your Pikachu to your Psyduck!", 250),
  "items unequip": one(";items unequip", "Successfully unequipped a everstone from selected Pokemon", 250),
  help: one(
    ";help",
    {
      color: OK,
      author: "PokeFlux Help",
      description: "Use `;help <category>` to see a category's commands, or `;help <command>` for how to use one.",
      fields: helpCategories.map(([name, count]) => ({ name, value: `${count} commands`, inline: true })),
    },
    675,
  ),
};
