import BattleImage, { type BattleImageProps } from "./fluxer/BattleImage.svelte";
import { ago, type ChatComponentImage, type ChatEmbed, type ChatMessage, type ChatScene } from "./fluxer/types";

const CDN = "https://cdn.mewdeko.tech/eevee";

/** Regular sprites hosted on the bot's CDN. */
export const sprites = {
  ditto: `${CDN}/c199897dbb443bb4f0f78216065ca29e.png`,
  larvesta: `${CDN}/9d27de830c350600649ea771bcbdf2bc.png`,
  eevee: `${CDN}/9270f23005ea0474d899e52ef2b7c969.png`,
  staryu: `${CDN}/81129b2e94541d01f55279d1fb160d10.png`,
};

const spriteImage = (src: string) => ({ src, width: 300, height: 300 });

/** The spawn embed SpawnService posts, with the image as a thumbnail when small images are on. */
export const spawnEmbed = (src: string, small: boolean, catchCommand: boolean): ChatEmbed => ({
  color: "#4fa3c7",
  title: "A wild Pokémon is waiting to be discovered!",
  description: "This Pokémon's name starts with d" + (catchCommand ? "\nCatch it with `catch <name>`!" : ""),
  ...(small ? { thumbnail: spriteImage(src) } : { image: spriteImage(src) }),
  footer: "Guess its name to catch it!",
});

/** The catch reply for a Ditto. */
export const caughtEmbed: ChatEmbed = {
  color: "#b0c95a",
  description: `Congratulations, you have caught a **ditto** \`(64.52% iv)\`!\n\`about\` (${ago(12)})`,
};

/** The landing page catch: a Ditto spawns and ash catches it. */
export const catchScene: ChatScene = {
  channel: "general",
  messages: [
    { author: "misty", time: "Today at 4:02 PM", text: "ash, you still owe me a bike" },
    { author: "ash", time: "Today at 4:03 PM", text: "i'll pay you back once i catch something good" },
    { author: "misty", time: "Today at 4:03 PM", text: "sure you will" },
    { author: "bot", time: "Today at 4:05 PM", embeds: [spawnEmbed(sprites.ditto, false, false)] },
    { author: "ash", time: "Today at 4:05 PM", text: ";catch ditto", reactions: [{ emoji: "✅", count: 1 }] },
    { author: "bot", time: "Today at 4:05 PM", embeds: [caughtEmbed] },
  ],
};

export interface SpawnPreviewSettings {
  smallImages: boolean;
  modalView: boolean;
  delete: boolean;
  pin: boolean;
}

/** A spawn as the bot posts it with these settings. */
export function spawnScene(settings: SpawnPreviewSettings): ChatScene {
  return {
    channel: "general",
    messages: [{ author: "bot", time: "Today at 4:05 PM", embeds: [spawnEmbed(sprites.ditto, settings.smallImages, settings.modalView)] }],
  };
}

/** The channel once someone catches that spawn: the bot edits, deletes or pins the spawn as SpawnService does. */
export function caughtScene(settings: SpawnPreviewSettings, prefix: string): ChatScene {
  const spawn = spawnEmbed(sprites.ditto, settings.smallImages, settings.modalView);
  const messages: ChatMessage[] = [];
  if (!settings.delete) {
    messages.push({
      author: "bot",
      time: "Today at 4:05 PM",
      embeds: [{ color: spawn.color, title: "Caught!", description: spawn.description }],
    });
  }
  messages.push(
    {
      author: "ash",
      time: "Today at 4:05 PM",
      text: settings.modalView ? `${prefix}catch ditto` : "ditto",
      reactions: [{ emoji: "✅", count: 1 }],
    },
    { author: "bot", time: "Today at 4:05 PM", embeds: [caughtEmbed] },
  );
  if (settings.pin && !settings.delete) messages.push({ kind: "pin", author: "bot", time: "Today at 4:05 PM" });
  return { channel: "general", messages };
}

/** `;start` and the starter list StartModule replies with. */
export const startScene: ChatScene = {
  channel: "general",
  messages: [
    { author: "ash", time: "Today at 3:58 PM", text: ";start" },
    {
      author: "bot",
      time: "Today at 3:58 PM",
      embeds: [
        {
          color: "#dd00dd",
          title: "Pick your starter!",
          description: "Use `;start <name>` to pick one, for example `;start Bulbasaur`.",
          fields: [
            { name: "🍃 Grass", value: "Bulbasaur, Chikorita, Treecko, Turtwig, Snivy, Chespin, Rowlet, Grookey, Sprigatito" },
            { name: "💧 Water", value: "Squirtle, Totodile, Mudkip, Piplup, Oshawott, Froakie, Popplio, Sobble, Quaxly" },
            { name: "🔥 Fire", value: "Charmander, Cyndaquil, Torchic, Chimchar, Tepig, Fennekin, Litten, Scorbunny, Fuecoco" },
          ],
        },
      ],
    },
  ],
};

/** The colour of the bot's duel embeds. */
export const DUEL_PINK = "#ffb6c1";

/** Lines of a duel turn field, as DuelReactions.ActionsField writes them for a full-PP single battle. */
export const actions = (moves: [string, number][]) =>
  [...moves.map(([move, pp], i) => `${["1️⃣", "2️⃣", "3️⃣", "4️⃣"][i]} ${move} | ${pp}pp`), "🏳️ forfeit"].join("\n");

/** The battle image for an Eevee against a Staryu. */
export const battleImage: ChatComponentImage<BattleImageProps> = {
  component: BattleImage,
  width: 800,
  height: 450,
  props: {
    background: `${CDN}/9833bee9cb23b65d0d4306114387c8c0.png`,
    challenger: { name: "Eevee", level: 32, hp: 83, maxHp: 83, sprite: sprites.eevee },
    opponent: { name: "Staryu", level: 30, hp: 64, maxHp: 64, sprite: sprites.staryu },
  },
};

/** `;duel single` as the bot plays it, from the challenge to the first turn result. */
export function duelScene(): ChatScene {
  return {
    channel: "general",
    messages: [
      { author: "ash", time: "Today at 6:12 PM", text: ";duel single <@misty>" },
      {
        author: "bot",
        time: "Today at 6:12 PM",
        text: "<@misty> You have been challenged to a 1v1 duel by ash!",
        reactions: [
          { emoji: "✅", count: 2 },
          { emoji: "❌", count: 1 },
        ],
      },
      { author: "bot", time: "Today at 6:12 PM", embeds: [{ color: DUEL_PINK, description: "misty sent out Staryu!\nash sent out Eevee!" }] },
      {
        author: "bot",
        time: "Today at 6:12 PM",
        embeds: [
          {
            color: DUEL_PINK,
            title: "Battle between ash and misty",
            fields: [
              { name: "ash: Eevee", value: actions([["Quick attack", 30], ["Bite", 25], ["Swift", 20], ["Sand attack", 15]]), inline: true },
              { name: "misty: Staryu", value: actions([["Water gun", 25], ["Rapid spin", 40], ["Swift", 20], ["Harden", 30]]), inline: true },
            ],
            image: battleImage,
            footer: "React or type a move number or name, swap, mega or forfeit",
          },
        ],
        reactions: [
          { emoji: "1️⃣", count: 2, me: true },
          { emoji: "2️⃣", count: 1 },
          { emoji: "3️⃣", count: 1 },
          { emoji: "4️⃣", count: 1 },
          { emoji: "🏳️", count: 1 },
        ],
      },
      { author: "misty", time: "Today at 6:13 PM", text: "water gun" },
      {
        author: "bot",
        time: "Today at 6:13 PM",
        embeds: [
          {
            color: DUEL_PINK,
            description: "Eevee used Quick attack!\nStaryu took 19 damage!\n\nStaryu used Water gun!\nEevee took 18 damage!",
          },
        ],
      },
    ],
  };
}

/** The hatch notice HatcheryService posts when a chat message finishes an egg. */
export const hatchScene: ChatScene = {
  channel: "general",
  messages: [
    { author: "ash", time: "Today at 5:20 PM", text: "still saving up for that bike" },
    { author: "bot", time: "Today at 5:20 PM", embeds: [{ color: "#ff49e6", description: "Congratulations!\nYour Larvesta Egg has hatched!" }] },
  ],
};

/** `spawn enable` sent in a channel and the reply SpawnService.UpdateChannelSetting gives. */
export function spawnEnableScene(prefix: string, channel: string): ChatScene {
  return {
    channel,
    messages: [
      { author: "ash", time: "Today at 3:40 PM", text: `${prefix}spawn enable` },
      { author: "bot", time: "Today at 3:40 PM", embeds: [{ color: "#2ecc71", description: `Enabled spawns in <#${channel}>` }] },
    ],
  };
}

const missionEmoji ="<:mission:1566977482307932160>";

/** The missions list command with today's real missions. */
export const missionsScene: ChatScene = {
  channel: "general",
  messages: [
    { author: "misty", time: "Today at 7:02 PM", text: ";missions list" },
    {
      author: "bot",
      time: "Today at 7:02 PM",
      embeds: [
        {
          color: "#ffb6c1",
          title: "Today's missions",
          fields: [
            { name: "Hatch those eggs! (10)", value: `4/10 ${missionEmoji}` },
            { name: "Catch-those-pokemon! (100)", value:`37/100 ${missionEmoji}` },
            { name: "Create a party (1)", value: `1/1 ${missionEmoji}` },
            { name: "Duel the bots NPC trainer! (20)", value: `6/20 ${missionEmoji}` },
          ],
          footer: "Missions reset daily",
        },
      ],
    },
  ],
};
