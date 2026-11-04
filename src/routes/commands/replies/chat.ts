import { users } from "$lib/components/home/scenes";
import type { ChatEmbed, ChatReaction, ChatScene, ChatTextMessage } from "$lib/components/home/fluxer/types";

/** A command's reply as the bot sends it, with the frame height that fits it. */
export interface CommandPreview {
  scene: ChatScene;
  height: number;
  /** The DM the bot sends with the reply, shown in a second frame. */
  dm?: { scene: ChatScene; height: number };
}

export const TIME = "Today at 4:05 PM";
const CDN = "https://cdn.mewdeko.tech/eevee";

export const OK = "#43a047";
export const GREEN = "#2ecc71";
export const BLUE = "#3498db";
export const PURPLE = "#9b59b6";
export const GOLD = "#f1c40f";
export const ORANGE = "#e67e22";
export const RED = "#e74c3c";

/** The bot's custom emoji from `Emojis.cs`. */
export const emoji = {
  shiny: "<a:shiny:1566977266213191681>",
  radiant: "<:radiant_2:1566977935426990081>",
  shadow: "<:shadowicon4:1566977568651882496>",
  skin: "<:skin23:1566977581759082496>",
  mission: "<:mission:1566977482307932160>",
  star: "<:starrr:1566977999872462850>",
  blank: "<:blank:1566977702496309250>",
  physical: "<:phys1:1566977493351534592><:phys2:1566977502335741952>",
  special: "<:special1:1566977973259603970><:special2:1566977595101163521>",
  status: "<:status1:1566977608598433794><:status2:1566978019136901122>",
};

/** A file on the bot's CDN by its hashed name, as `cdn-url.sh` prints it. */
export const cdn = (file: string) => `${CDN}/${file}`;

/** A 300px sprite or bot image shown as an embed image or thumbnail. */
export const picture = (file: string, width = 300, height = 300) => ({ src: cdn(file), width, height });

type Content = ChatEmbed | string | { text?: string; embeds: ChatEmbed[] };

const message = (author: ChatTextMessage["author"], content: Content, reactions?: ChatReaction[]): ChatTextMessage => {
  const base = { author, time: TIME, ...(reactions ? { reactions } : {}) };
  if (typeof content === "string") return { ...base, text: content };
  if ("embeds" in content) return { ...base, ...content };
  return { ...base, embeds: [content] };
};

export const ash = (text: string, reactions?: ChatReaction[]) => message("ash", text, reactions);
export const misty = (text: string, reactions?: ChatReaction[]) => message("misty", text, reactions);
export const bot = (content: Content, reactions?: ChatReaction[]) => message("bot", content, reactions);

export const chat = (...messages: ChatTextMessage[]): ChatScene => ({ channel: "general", users, messages });

/** The user's DM with the bot. */
export const dmChat = (...messages: ChatTextMessage[]): ChatScene => ({
  channel: users.bot.name,
  dm: { name: users.bot.name, avatar: users.bot.avatar, bot: true },
  users,
  messages,
});

/** The 📬 the bot adds to the command after it sends the reply by DM. */
export const mailed: ChatReaction[] = [{ emoji: "📬", count: 1 }];

/** A command the bot answers by DM, with the frame heights that fit each part. */
export const dmReply = (input: string, response: Content, height: number, dmHeight: number): CommandPreview => ({
  scene: chat(ash(input, mailed)),
  height,
  dm: { scene: dmChat(bot(response)), height: dmHeight },
});

/** A command and the bot's single reply to it. */
export const reply = (input: string, response: Content, reactions?: ChatReaction[]) => chat(ash(input), bot(response, reactions));

/** The embed `ConfirmAsync` sends. */
export const ok = (description: string): ChatEmbed => ({ color: OK, description });

/** The green embed the spawn settings reply with. */
export const confirm = (description: string): ChatEmbed => ({ color: GREEN, description });

const react = (emojis: string[]): ChatReaction[] => emojis.map((e) => ({ emoji: e, count: 1 }));

/** The page controls `PaginateAsync` adds for this many pages. */
export const pages = (count: number) => react(count > 2 ? ["⏮️", "◀️", "▶️", "⏭️", "⏹️"] : ["◀️", "▶️", "⏹️"]);

/** ✅ and ❌ from `ConfirmAsync`, with the user's ✅ pressed. */
export const confirmed: ChatReaction[] = [
  { emoji: "✅", count: 2 },
  { emoji: "❌", count: 1 },
];

/** Reactions the bot added for a pick, with the user's press on one of them. */
export const picked = (emojis: string[], index: number): ChatReaction[] =>
  emojis.map((e, i) => ({ emoji: e, count: i === index ? 2 : 1 }));

/** A `PromptConfirmAsync` question answered with ✅, then the result. */
export const prompted = (input: string, question: Content, result: Content) => chat(ash(input), bot(question, confirmed), bot(result));
