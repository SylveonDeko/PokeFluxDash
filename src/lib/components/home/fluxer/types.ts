// SPDX-License-Identifier: AGPL-3.0-or-later. Portions adapted from Fluxer (https://github.com/fluxerapp/fluxer).
import type { Component } from "svelte";

/** A chat author, keyed into `chatUsers`. */
export type ChatAuthor = "ash" | "misty" | "bot";

export interface ChatImage {
  src: string;
  width: number;
  height: number;
}

/** An embed image drawn by a component, sized like an attachment of `width` by `height`. */
export interface ChatComponentImage<Props extends Record<string, unknown> = Record<string, unknown>> {
  component: Component<Props>;
  props: Props;
  width: number;
  height: number;
}

export interface ChatEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/** A rich embed. Text parts take the markdown subset that `parseMarkup` reads. */
export interface ChatEmbed {
  color: string;
  author?: string;
  title?: string;
  description?: string;
  fields?: ChatEmbedField[];
  image?: ChatImage | ChatComponentImage<any>;
  thumbnail?: ChatImage;
  footer?: string;
  timestamp?: string;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  me?: boolean;
}

export interface ChatTextMessage {
  kind?: "message";
  author: ChatAuthor;
  time: string;
  text?: string;
  embeds?: ChatEmbed[];
  reactions?: ChatReaction[];
}

/** The system line Fluxer posts when someone pins a message. */
export interface ChatPinMessage {
  kind: "pin";
  author: ChatAuthor;
  time: string;
}

export type ChatMessage = ChatTextMessage | ChatPinMessage;

/** The other user of a DM, shown in the header. */
export interface ChatRecipient {
  name: string;
  avatar?: string;
  bot?: boolean;
}

export interface ChatScene {
  channel: string;
  /** Makes the scene a DM with this user. */
  dm?: ChatRecipient;
  messages: ChatMessage[];
}

export const chatUsers: Record<ChatAuthor, { name: string; avatar?: string; color?: string; bot?: boolean }> = {
  bot: { name: "PokeFlux", avatar: "/img/pokeflux.png", bot: true },
  misty: { name: "misty", avatar: "https://cdn.mewdeko.tech/eevee/46ab822699d701249dc7e7f7ecc3e8ac.png", color: "#00bba7" },
  ash: { name: "ash", avatar: "https://cdn.mewdeko.tech/eevee/8877d7c106dc8ed788a4d8723d413dd4.png", color: "#d63c3c" },
};

/** Writes a Fluxer relative timestamp that renders as this many seconds ago. */
export const ago = (seconds: number) => `<t:-${seconds}:R>`;
