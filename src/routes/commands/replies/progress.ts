import { DUEL_PINK, actions, battleImage, missionsScene } from "$lib/components/home/scenes";
import { ago, chatUsers, type ChatEmbed } from "$lib/components/home/fluxer/types";
import { BLUE, GOLD, GREEN, ORANGE, PURPLE, RED, ash, bot, chat, confirmed, ok, picture, reply, type CommandPreview } from "./chat";

const ACHIEVEMENT_GOLD = "#ffd700";
const BRONZE = "#cd7f32";
const SILVER = "#c0c0c0";
const SLIME_STORE = "#000010";
const SLIME = "<:CrystallizedSlime:1566977393170583552>";
const avatar = { src: chatUsers.ash.avatar!, width: 128, height: 128 };

/** A Fluxer timestamp that renders as this many seconds from now. */
const later = (seconds: number) => `<t:${seconds}:R>`;

const challenge = (input: string, kind: string) =>
  reply(input, `<@misty> You have been challenged to a ${kind} by ash!`, confirmed);

const words = ["onix", "pikachu", "eevee", "psyduck", "ditto", "abra", "vulpix", "zubat"];
const hiddenWords = `The hidden words were: ${words.map((w) => `\`${w}\``).join(", ")}`;

const reel = {
  pikachu: "<:pikareel:1566977871640014851>",
  coin: "<:coinreel:1566977719676178434>",
  seven: "<:7reel:1566977235200512000>",
};

const missionBar = (filled: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const on = i < filled;
    if (i === 0) return on ? "<:bar1_2:1566977283300798464>" : "<:bar1e:1566977286530408450>";
    if (i === 9) return on ? "<:bar3_2:1566977318864289793>" : "<:bar3_3:1566977333372387328>";
    return on ? "<:bar2_2:1566977285557325825>" : "<:bar2e:1566977309490024448>";
  }).join("");

const missionLine = (name: string, progress: number, target: number) =>
  `- **${name}**: ${missionBar(Math.min(Math.floor((progress / target) * 10), 10))} ${progress}/${target}`;

interface Female {
  name: string;
  sprite: string;
  position: number;
  level: number;
  nature: string;
  ivs: [number, number, number, number, number, number];
}

const females: Female[] = [
  { name: "Eevee", sprite: "9270f23005ea0474d899e52ef2b7c969.png", position: 12, level: 34, nature: "Modest", ivs: [28, 19, 25, 31, 22, 30] },
  { name: "Vulpix", sprite: "7422bda67b6c8b588d7eb00351194d16.png", position: 47, level: 21, nature: "Timid", ivs: [31, 12, 20, 27, 29, 18] },
];

const femaleEmbed = ({ name, sprite, position, level, nature, ivs }: Female): ChatEmbed => {
  const [hp, atk, def, spatk, spdef, spd] = ivs;
  const total = ivs.reduce((a, b) => a + b, 0);
  return {
    color: PURPLE,
    title: `${name} ♀️`,
    description:
      `**Position** #${position} | **Level** ${level}\n` +
      `**IV Total** ${total}/186 (${((total / 186) * 100).toFixed(2)}%) | **Nature** ${nature}\n` +
      "**Breeding Stats:**\n" +
      `• HP: ${hp}/31 • ATK: ${atk}/31 • DEF: ${def}/31\n` +
      `• SP.ATK: ${spatk}/31 • SP.DEF: ${spdef}/31 • SPD: ${spd}/31\n` +
      "**Held Item** None",
    thumbnail: picture(sprite),
  };
};

const femalesPage = {
  text: `**Your Breeding Females** • Page 1/1 • ${females.length} Breeding Females`,
  embeds: females.map(femaleEmbed),
};

const achievementField = (name: string, current: string, last: string | null, next: string) => ({
  name,
  value: `**Current:** ${current}\n${last ? `**Last Milestone:** ${last}\n` : ""}**Next:** ${next}`,
  inline: true,
});

const voucherRequest = (id: string, status: string, pokemon: string, hours: number) => ({
  name: `Request #${id}`,
  value: `**Status:** ${status}\n**Pokemon:** ${pokemon}\n**Created:** ${ago(hours * 3600)}`,
});

/** Previews for the duel and progress modules along with the minigames. */
export const progressPreviews: Record<string, CommandPreview> = {
  "duel challenge": { scene: challenge(";duel challenge <@misty>", "normal battle"), height: 285 },
  "duel party": { scene: challenge(";duel party <@misty>", "6v6 party duel"), height: 285 },
  "duel inverse": { scene: challenge(";duel inverse <@misty>", "6v6 inverse battle"), height: 285 },
  "duel npc": {
    scene: chat(
      ash(";duel npc"),
      bot({ color: DUEL_PINK, description: "Trainer John sent out Staryu!\nash sent out Eevee!" }),
      bot(
        {
          color: DUEL_PINK,
          title: "Battle between ash and Trainer John",
          fields: [{ name: "ash: Eevee", value: actions([["Quick attack", 30], ["Bite", 25], ["Swift", 20], ["Sand attack", 15]]), inline: true }],
          image: battleImage,
          footer: "React or type a move number or name, swap, mega or forfeit",
        },
        ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "🏳️"].map((e) => ({ emoji: e, count: 1 })),
      ),
    ),
    height: 750,
  },

  "achievements view": {
    scene: reply(";achievements view breeding", {
      color: ACHIEVEMENT_GOLD,
      title: "🏆 ash's Achievements",
      description: "**Category:** Breeding",
      thumbnail: avatar,
      fields: [
        achievementField("Successful Breeds", "212", "150", "300"),
        achievementField("4IV Breeds", "38", "10", "50"),
        achievementField("Shiny Breeds", "6", "5", "10"),
        achievementField("5IV Breeds", "4", "1", "5"),
        achievementField("Perfect IV Breeds", "1", "1", "5"),
        achievementField("Shadow Breeds", "0", null, "1"),
        achievementField("Titan Breeds", "0", null, "1"),
        { name: "📊 Summary", value: "Total Milestones: 14\nLoyalty Points: 6,800\nDaily Streak: 5 days" },
      ],
    }),
    height: 710,
  },
  "achievements progress": {
    scene: reply(";achievements progress pokemon caught", {
      color: BRONZE,
      title: "📈 Pokemon Caught Progress",
      thumbnail: avatar,
      fields: [
        {
          name: "Current Progress",
          value: "**Value:** 1,284\n**Last Milestone:** 1,000\n**Next Milestone:** 1,500\n`[████████░░]` 85.6%",
        },
        { name: "✅ Completed Milestones (5)", value: "`10`, `50`, `100`, `500`, `1,000`" },
        { name: "🎯 Upcoming Milestones", value: "`1,500`, `2,000`, `2,500`, `3,000`, `3,500`" },
      ],
    }),
    height: 460,
  },
  "achievements loyalty": {
    scene: reply(";achievements loyalty", {
      color: SILVER,
      title: "💎 ash's Loyalty Status",
      thumbnail: avatar,
      fields: [
        { name: "🏅 Current Tier", value: "**Silver Expert**\nPoints: 6,800\nXP Multiplier: 1.5x\nShop Discount: 10%", inline: true },
        { name: "🔥 Daily Streak", value: "**5 days**\nNext bonus at: 7 days", inline: true },
        { name: "🎯 Next Tier", value: "**Gold Champion**\nPoints needed: 3,200\nBonus: 25,000 monthly Coins" },
      ],
      footer: "Earn loyalty points by completing achievements!",
    }),
    height: 510,
  },
  "achievements leaderboard": {
    scene: reply(";achievements leaderboard pokemon caught", {
      color: ACHIEVEMENT_GOLD,
      title: "🏆 Pokemon Caught Leaderboard",
      description: [
        "🥇 **misty**: 18,402",
        "🥈 **ash**: 15,977",
        "🥉 *Hidden trainer*: 12,310",
        "`#4` **brock**: 9,845",
        "`#5` **gary**: 8,120",
        "`#6` **dawn**: 6,532",
        "`#7` *Hidden trainer*: 5,904",
        "`#8` **cynthia**: 4,771",
        "`#9` **serena**: 3,968",
        "`#10` **iris**: 3,215",
      ].join("\n"),
    }),
    height: 460,
  },

  "breeding setfemales": {
    scene: chat(ash(";breeding setfemales 12 47"), bot(ok("Your female Pokémon list has been updated with valid IDs: 12, 47")), bot(femalesPage)),
    height: 750,
  },
  "breeding showfemales": { scene: reply(";breeding showfemales", femalesPage), height: 670 },
  "breeding breed": {
    scene: reply(
      ";breeding breed 5",
      {
        color: RED,
        title: "Breeding Attempt Failed!",
        description: `Breeding attempt failed\nYou can breed again: ${later(50)}\n\nReact ✅ to redo the breed, or 🔄 to redo it until it succeeds.`,
        footer: "Chance of success: 4.17%",
      },
      [
        { emoji: "✅", count: 1 },
        { emoji: "🔄", count: 1 },
      ],
    ),
    height: 420,
  },
  "breeding cancel": { scene: reply(";breeding cancel", ok("I will no longer automatically attempt to breed these pokes.")), height: 270 },
  "breeding clear": { scene: reply(";breeding clear", ok("Cleared your female list.")), height: 255 },

  "game guess": {
    scene: reply(";game guess zubat", {
      color: GREEN,
      title: "Word Search Game - Complete",
      description: `Congratulations! You found all the words!\n\nWords found: 8/8\n${hiddenWords}`,
    }),
    height: 355,
  },
  "game quit": {
    scene: reply(";game quit", {
      color: ORANGE,
      title: "Word Search Game - Quit",
      description: `Game ended early. You found 3 out of 8 words.\n\n${hiddenWords}`,
    }),
    height: 340,
  },
  "game slots": {
    scene: reply(";game slots", {
      color: GOLD,
      title: "🎰 Pokemon Slot Machine 🎰",
      description: `🎉 **LUCKY SEVEN!!!** 🎉\n${reel.pikachu} ${reel.seven} ${reel.coin}`,
      fields: [{ name: "🎉 Congratulations!", value: "Win Type: LUCKY_SEVEN\nPayout Multiplier: 10x" }],
    }),
    height: 380,
  },
  "game slotinfo": {
    scene: reply(";game slotinfo", {
      color: PURPLE,
      title: "🎰 Slot Machine Information",
      description: "**Win Combinations and Payouts:**",
      fields: [
        { name: "💰 **Jackpot Wins**", value: "🔥 Triple Seven: 1000x (Jackpot!)\n⭐ Triple Star: 500x\n🪙 Triple Coin: 250x", inline: true },
        { name: "🎯 **Good Wins**", value: "🍒 Triple Cherry: 100x\n⚡ Triple Pikachu: 75x\n🎁 Triple Present: 50x\n🟣 Triple Purple: 25x", inline: true },
        { name: "✨ **Special Wins**", value: "🍀 Lucky Seven: 10x (Any seven)\n🎲 Triple Match: 5x (Any three)", inline: true },
        {
          name: "📊 **Win Probabilities** (Top 5)",
          value: "Triple Cherry: 0.019%\nTriple Pikachu: 0.063%\nTriple Present: 0.149%\nTriple Purple: 0.292%\nTriple Coin: 0.504%",
        },
      ],
      footer: "Good luck spinning! 🎰",
    }),
    height: 620,
  },

  "missions list": { scene: missionsScene, height: 485 },
  "missions progress": {
    scene: reply(
      ";missions progress",
      [
        "**ash's Mission Progress:**",
        missionLine("Hatch those eggs!", 4, 10),
        missionLine("Catch-those-pokemon!", 37, 100),
        missionLine("Create a party", 1, 1),
        missionLine("Duel the bots NPC trainer!", 6, 20),
      ].join("\n"),
    ),
    height: 440,
  },
  "missions store": {
    scene: reply(";missions store", {
      color: SLIME_STORE,
      title: "Crystal Slime Exchange",
      description: [
        "### Exchange your Crystallized Slime for Credits!",
        `- 150 ${SLIME} for 100,000 credits.`,
        "### Friendship Stone: Increases friendship/happiness instantly!",
        `- 10 ${SLIME}`,
        "### Shadow Essence: Increase your shadow-chain instantly!",
        `- 100 ${SLIME} for random chance: +15-75 Shadow Chain`,
        "### Meowth Tickets: Try Your Luck!",
        `- 75 ${SLIME} for 1 Ticket`,
        "### VIP Tokens: Get exclusive benefits!",
        `- 1000 ${SLIME} for 1 VIP Token`,
        `- 2500 ${SLIME} for 3 VIP Tokens (x3)`,
        "",
        "**How Meowth Tickets Work:**",
        "Each Meowth Ticket hides a secret amount of credits ranging from a tiny sum to a whopping 150,000.",
        "- Upon buying a Meowth Ticket, you'll be presented with 9 choices, each concealing different amounts of credits.",
        "- Make your first choice to uncover what's hidden beneath. But that's not all! You'll then face a tantalizing decision: keep your initial winnings or risk your first pick for potentially more!",
        "**You decide!**",
        "### Buy",
        ...[
          ["Friendship Stone", 10],
          ["100000 Credits", 150],
          ["Shadow Essence", 100],
          ["Meowth Ticket", 75],
          ["VIP Token", 1000],
          ["VIP Token x3", 2500],
        ].map(([name, cost]) => `- \`;missions buy ${name}\`: ${cost} ${SLIME}`),
      ].join("\n"),
      footer: "When you buy a Meowth Ticket, you have 180 seconds before the game ends, no refunds!",
    }),
    height: 1135,
  },
  "missions buy": {
    scene: reply(";missions buy Friendship Stone", ok("You bought a Friendship Stone! Use it with `;apply friendship-stone`.")),
    height: 270,
  },

  "voucher request": {
    scene: reply(";voucher request", {
      color: ORANGE,
      title: "🎫 Voucher Request Form",
      description:
        "Fill in every field, separated by `|`:\n`;voucher request <pokemon> | <appearance> | <payment> [| <artist>]`\n\nFor example: `;voucher request Pikachu | Wearing a red scarf, sitting | Credits`",
      fields: [
        { name: "🎯 Pokemon", value: "What Pokemon would you like?" },
        { name: "🎨 Appearance", value: "How do you want the Pokemon to look? Describe the appearance, pose, style, etc." },
        { name: "💰 Payment", value: "What is your method of payment? e.g., Credits, PayPal, Commission trade" },
        { name: "👨‍🎨 Artist", value: "Optional. Mention the artist you have in mind, or give their user ID." },
      ],
    }),
    height: 625,
  },
  "voucher status": {
    scene: reply(";voucher status", {
      color: BLUE,
      title: "📋 Your Voucher Requests",
      description: "You have 2 voucher request(s):",
      fields: [
        voucherRequest("1567221934521352192", "Accepted, Assigned", "Sylveon", 20),
        voucherRequest("1567498210377662464", "Created", "Shiny Umbreon", 3),
      ],
    }),
    height: 455,
  },
};
