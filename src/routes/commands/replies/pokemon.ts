import { sprites } from "$lib/components/home/scenes";
import type { ChatEmbed } from "$lib/components/home/fluxer/types";
import { BLUE, GOLD, GREEN, OK, ORANGE, PURPLE, RED, ash, bot, chat, ok, pages, prompted, reply, type CommandPreview } from "./chat";

const PARTY = "#dd00dd";
const normal = "<:normal:1566977857513598977>";
const numbers = [
  "<:num1:1566977174957723648>",
  "<:num2:1566977183316979712>",
  "<:num3:1566977191986606080>",
  "<:num4:1566977198907195392>",
  "<:num5:1566977204762447872>",
  "<:num6:1566977210479288320>",
];
const beam = { start: "<:beamstart2:1566977365580455936>", middle: "<:beambar2:1566977689510744064>" };
const saved = "<:save:1566977939801645059>";
const missing = "<:delete:1566977403505356800>";

/** The embed `FormsModule.CongratulateAsync` sends, addressed to the user when `addressed` is set. */
const congrats = (title: string, color: string, message: string, addressed: boolean): ChatEmbed => ({
  color,
  title,
  description: addressed ? `ash, ${message}` : message,
});

const team = ["Eevee [12]", "Lucario [41]", "Staryu [7]", "None", "None", "None"];

/** `PartyService.GetPartyViewEmbed` for the loaded party, or a saved one by name. */
const partyView = (name = ""): ChatEmbed => ({
  color: "#eee647",
  title: `Party Info: ${name}`,
  fields: team.map((value, i) => ({ name: `Slot ${i + 1} Pokemon`, value })),
  footer: `Use ';party load ${name}' and then ';party add <slot_number>' to add a Pokemon`,
});

/** The detailed `pokemon list` card for one Pokémon. */
const listCard = (title: string, number: number, level: number, iv: string, nature: string): ChatEmbed => ({
  color: BLUE,
  title,
  description: `**No.** ${number} | **Level** ${level}\n**IV%** ${iv} | **Nature** ${nature}\n**Held Item** None\n**Type** ${normal}`,
  thumbnail: { src: sprites.eevee, width: 300, height: 300 },
});

const pokedex = [
  ["Bulbasaur", true],
  ["Ivysaur", true],
  ["Venusaur", false],
  ["Charmander", true],
  ["Charmeleon", false],
  ["Charizard", false],
  ["Squirtle", true],
  ["Wartortle", true],
  ["Blastoise", false],
  ["Caterpie", true],
  ["Metapod", true],
  ["Butterfree", true],
  ["Weedle", true],
  ["Kakuna", false],
  ["Beedrill", false],
  ["Pidgey", true],
  ["Pidgeotto", true],
  ["Pidgeot", false],
  ["Rattata", true],
  ["Raticate", true],
] as const;

const slot = (n: number, egg: string, steps: number) => `**__Slot ${n}__** - **Steps:** \`${steps}\`\n\`${egg}\``;

export const pokemonPreviews: Record<string, CommandPreview> = {
  "pokemon select": { scene: reply(";select 12", ok("You have selected your Eevee")), height: 255 },
  "pokemon info": {
    scene: reply(
      ";info",
      {
        color: "#c06a2b",
        title: "♂️ Eevee",
        fields: [
          {
            name: "Pokemon Information",
            value: `**Level**: \`32\`\n**Ability**: \`Run Away\`\n**Types**: ${normal}\n**Nature**: \`Hardy\`\n**Original Trainer**: \`ash\`\n**Caught on**: \`Nov 1, 2026\``,
          },
          { name: "Moves", value: "• `Quick Attack`\n• `Bite`\n• `Swift`\n• `Sand Attack`" },
          {
            name: "Stats (IV | EV | Total) - 64.52% IV",
            value:
              "`HP:` `20/31` | `0/252` | `83`\n`ATK:` `18/31` | `0/252` | `45`\n`DEF:` `24/31` | `0/252` | `44`\n`SPATK:` `9/31` | `0/252` | `36`\n`SPDEF:` `31/31` | `0/252` | `56`\n`SPEED:` `18/31` | `0/252` | `45`",
          },
          { name: "Experience", value: "`1,240` / `3,300` (`37.6%` to next level)" },
        ],
        image: { src: sprites.eevee, width: 300, height: 300 },
        footer: "Number 12/58 | Global ID#: 48213377",
      },
      ["⏮️", "◀️", "▶️", "⏭️", "ℹ️", "⏹️"].map((e) => ({ emoji: e, count: 1 })),
    ),
    height: 1060,
  },
  "pokemon list": {
    scene: reply(";p eevee", {
      text: "**Your Pokemon - Search: `eevee`**\nDetailed View • Page 1/1 • 2 Pokémon",
      embeds: [listCard("🔍 Eevee ♂️", 12, 32, "64.52%", "Hardy"), listCard("⭐ Eevee ♀️", 37, 18, "71.51%", "Modest")],
    }),
    height: 535,
  },
  "pokemon pokedex": {
    scene: reply(
      ";pokemon pokedex",
      {
        color: BLUE,
        title: "National Pokedex (214/1025)",
        description: pokedex.map(([name, owned]) => `**${name}** - ${owned ? saved : missing}`).join("\n"),
        footer: "Page 1/52",
      },
      pages(52),
    ),
    height: 750,
  },
  "pokemon release": {
    scene: prompted(
      ";pokemon release 23",
      { color: RED, title: "Confirm Release", description: "Are you sure you want to release your Pidgey (41.94%)?", footer: "This action cannot be undone!" },
      ok("You have successfully released your Pidgey!"),
    ),
    height: 400,
  },
  "pokemon sacrifice": {
    scene: prompted(
      ";pokemon sacrifice 24",
      { color: RED, title: "Confirm Sacrifice", description: "Are you sure you want to sacrifice your Rattata (53.23%)?", footer: "This action cannot be undone!" },
      {
        color: PURPLE,
        title: "Pokemon Sacrificed",
        description: `You sacrificed your Rattata (53.23%)\nSoul Gauge increased by 0.17\nCurrent Gauge: ${beam.middle.repeat(3)}${beam.start}`,
      },
    ),
    height: 490,
  },
  "pokemon resurrect": {
    scene: chat(
      ash(";pokemon resurrect"),
      bot("Checking for dead Pokémon... and performing necromancy."),
      bot({
        color: PURPLE,
        description: [
          ["48102311", "Pidgey", "41.94"],
          ["48102398", "Caterpie", "38.71"],
          ["48107725", "Rattata", "56.45"],
        ]
          .map(([id, name, iv]) => `✅ **ID: \`${id}\` | Name: \`${name}\` | IV%: \`${iv}\`%**`)
          .join("\n"),
      }),
    ),
    height: 355,
  },
  "pokemon forms form": {
    scene: reply(";pokemon forms form wash", congrats("Congratulations!!!", BLUE, "Your Rotom has transformed into Rotom-wash!", true)),
    height: 285,
  },
  "pokemon forms deform": { scene: reply(";pokemon forms deform", ok("Your Pokemon has successfully reset to its base form.")), height: 255 },
  "pokemon forms fuse": {
    scene: reply(";pokemon forms fuse white 87", congrats("Fusion Complete!", PURPLE, "You have fused your Kyurem with your Reshiram Level 70!", false)),
    height: 305,
  },
  "pokemon forms lunarize": {
    scene: reply(";pokemon forms lunarize 64", congrats("Fusion Complete!", GOLD, "You have fused your Necrozma with your Lunala!", false)),
    height: 285,
  },
  "pokemon forms solarize": {
    scene: reply(";pokemon forms solarize 65", congrats("Fusion Complete!", ORANGE, "You have fused your Necrozma with your Solgaleo Level 68!", false)),
    height: 305,
  },
  "pokemon forms mega": {
    scene: reply(";pokemon forms mega", congrats("Congratulations!!!", RED, "Your Lucario has mega evolved into Lucario-mega!", true)),
    height: 285,
  },
  "pokemon forms megax": {
    scene: reply(";pokemon forms megax", congrats("Congratulations!!!", RED, "Your Charizard has mega evolved into Charizard-mega-x!", true)),
    height: 305,
  },
  "pokemon forms megay": {
    scene: reply(";pokemon forms megay", congrats("Congratulations!!!", RED, "Your Charizard has mega evolved into Charizard-mega-y!", true)),
    height: 305,
  },
  "pokemon forms unmega": {
    scene: reply(";pokemon forms unmega", congrats("Devolution Complete!", GREEN, "Your Lucario-mega has devolved back to Lucario!", true)),
    height: 285,
  },
  hatchery: {
    scene: reply(
      ";hatchery",
      {
        color: "#ff0060",
        title: "ash's Hatchery (Group #1)",
        description: [
          slot(1, "Larvesta [212]", 1840),
          slot(2, "Eevee [215]", 2655),
          slot(3, "Ralts [219]", 3920),
          slot(4, "Empty []", 0),
          slot(5, "Empty []", 0),
          slot(6, "Empty []", 0),
        ].join("\n\n"),
        fields: [{ name: "Max Egg Slots", value: "6" }],
        footer: "Group 1 | Full Steps Counted",
      },
      pages(3),
    ),
    height: 690,
  },
  "hatchery set": {
    scene: reply(";hatchery set 1 212 - 219", {
      color: OK,
      title: "Eggs Added to Hatchery",
      fields: [{ name: "Group 1", value: "Eggs added to slots: 1, 3" }],
    }),
    height: 315,
  },
  "hatchery remove": { scene: reply(";hatchery remove 1 3", ok("Removed egg from slot 3 in group 1.")), height: 255 },
  "hatchery swap": {
    scene: reply(";hatchery swap 48213390 48213402", ok("Eggs 48213390 and 48213402 have been swapped.")),
    height: 255,
  },
  party: { scene: reply(";party", partyView()), height: 585 },
  "party view": { scene: reply(";party view duels", partyView("duels")), height: 585 },
  "party add": { scene: reply(";party add 2 41", ok("Your Lucario is now on your party, Slot number 2")), height: 255 },
  "party remove": {
    scene: reply(";party remove 3", ok("You have successfully removed Staryu from Pokemon Number 3 In your Party!")),
    height: 270,
  },
  "party register": { scene: reply(";party register duels", ok("Successfully created a new party save.")), height: 255 },
  "party deregister": {
    scene: prompted(
      ";party deregister breeding",
      ok("Are you sure you want to deregister party `breeding`?"),
      ok("Successfully deregistered party `breeding`."),
    ),
    height: 345,
  },
  "party load": { scene: reply(";party load duels", ok("Successfully, updated current party from saved data.")), height: 255 },
  "party list": {
    scene: reply(";party list", { color: PARTY, title: "Your Saved Parties", description: "duels\nbreeding\nmain" }),
    height: 320,
  },
  "party setup": {
    scene: reply(";party setup duels 2 41", {
      color: PARTY,
      title: "Slot 2 Updated!",
      description:
        [`${numbers[0]} **Eevee** \`#12\``, `${numbers[1]} **Lucario** \`#41\``, ...numbers.slice(2).map((n) => `${n} None`)].join("\n") +
        "\n\nUse `;party setup duels <slot> <pokemon number>` to set a Pokémon to a slot in this party.",
      footer: "Party: duels",
    }),
    height: 470,
  },
};
