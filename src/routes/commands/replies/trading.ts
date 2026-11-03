import type { ChatEmbed } from "$lib/components/home/fluxer/types";
import {
  BLUE,
  GOLD,
  GREEN,
  ORANGE,
  PURPLE,
  TIME,
  ash,
  bot,
  chat,
  confirmed,
  dmChat,
  dmReply,
  ok,
  picture,
  prompted,
  reply,
  type CommandPreview,
} from "./chat";

const fire = "<:fire:1566977808809340928>";
const gible = "4d731f6ffed5203a7eb735f82ec469d9.png";

const tradeRequest = (kind: string, description: string): ChatEmbed => ({
  color: BLUE,
  title: `🔄 ${kind} Request`,
  description,
  footer: "Waiting for misty to accept... React with ✅ to accept or ❌ to decline.",
  timestamp: TIME,
});

const giftConfirm = (question: string): ChatEmbed => ({
  color: ORANGE,
  title: "🎁 Confirm Gift",
  description: question,
  footer: "This action cannot be undone.",
});

const gifted = (input: string, question: string, success: string) =>
  prompted(input, giftConfirm(question), { color: GREEN, title: "🎉 Gift Successful!", description: success, timestamp: TIME });

const ivBar = (percent: number) => {
  const filled = Math.round((percent / 100) * 30);
  return `\`${"█".repeat(filled)}${"░".repeat(30 - filled)}\``;
};

const listing = (level: number, iv: number, price: string, id: number): ChatEmbed => ({
  color: GREEN,
  title: "Gible ♂️",
  description: `Level: ${level}\nIV: ${ivBar(iv)} ${iv}%\n💰 **${price}** coins\nID: \`${id}\``,
  thumbnail: picture(gible),
});

export const tradingPreviews: Record<string, CommandPreview> = {
  trade: {
    scene: reply(
      ";trade <@misty>",
      { text: "<@misty>", embeds: [tradeRequest("Trade", "<@ash> has requested a trade with <@misty>!")] },
      confirmed,
    ),
    height: 390,
  },
  quicktrade: {
    scene: reply(
      ";quicktrade <@misty> 12",
      { text: "<@misty>", embeds: [tradeRequest("Quick Trade", "<@ash> wants to trade their Pokemon at position **12** with <@misty>!")] },
      confirmed,
    ),
    height: 405,
  },
  "trade add": { scene: reply(";trade add 5 12", ok("Added Pokemon at position 5\nAdded Pokemon at position 12")), height: 270 },
  "trade remove": { scene: reply(";trade remove 12", ok("Removed Pokemon at position 12")), height: 255 },
  "trade credits": { scene: reply(";trade credits 50k", ok("Added 50,000 credits to the trade.")), height: 255 },
  "trade tokens": { scene: reply(";trade tokens fire 3", ok("Added 3 Fire tokens to the trade.")), height: 255 },
  "trade untokens": { scene: reply(";trade untokens fire 1", ok("Removed 1 Fire tokens from the trade.")), height: 255 },
  "trade confirm": {
    scene: reply(";trade confirm", {
      color: ORANGE,
      title: "✅ Trade Confirmed",
      description: "You have confirmed the trade. Waiting for <@misty> to confirm...",
      footer: "The trade will execute once both players confirm.",
    }),
    height: 325,
  },
  "trade cancel": { scene: reply(";trade cancel", ok("Trade cancelled successfully! All trade locks have been removed.")), height: 270 },
  mytrades: { scene: reply(";mytrades", ok("You are currently in an active trade session.")), height: 255 },
  canceltrades: { scene: reply(";canceltrades", ok("All your trade sessions have been cancelled and trade locks cleared.")), height: 270 },

  "gift credits": {
    scene: gifted(
      ";gift credits <@misty> 10000",
      "Are you sure you want to give **10,000** credits to <@misty>?",
      "<@ash> has gifted **10,000** credits to <@misty>!",
    ),
    height: 460,
  },
  "gift redeems": {
    scene: gifted(";gift redeems <@misty> 3", "Are you sure you want to give **3** redeems to <@misty>?", "<@ash> has gifted **3** redeems to <@misty>!"),
    height: 460,
  },
  "gift pokemon": {
    scene: gifted(
      ";gift pokemon <@misty> 5",
      "Are you sure you want to give your Pokemon at position **5** to <@misty>?",
      "<@ash> has gifted a **Gible** to <@misty>!",
    ),
    height: 475,
  },
  "gift tokens": {
    scene: gifted(
      ";gift tokens <@misty> fire 5",
      `Are you sure you want to give **5** ${fire} **Fire** tokens to <@misty>?`,
      `<@ash> has gifted **5** ${fire} **Fire** tokens to <@misty>!`,
    ),
    height: 480,
  },

  "market add": {
    scene: reply(";market add 12 25000", {
      color: GREEN,
      title: "🏪 Pokemon Listed on Market",
      description: "You have added your Gible to the market! It is market listing #48213.",
      footer: "Listing ID: 48213",
    }),
    height: 325,
  },
  "market buy": {
    scene: prompted(
      ";market buy 48213",
      { color: ORANGE, title: "Confirm Purchase", description: "Are you sure you want to buy a level 32 Gible for 25000 credits?" },
      ok("You have Successfully Bought A Gible for 25000 credits."),
    ),
    height: 395,
    dm: { scene: dmChat(bot("You have Successfully Bought A Gible for 25000 credits.")), height: 185 },
  },
  "market remove": {
    scene: reply(";market remove 48213", {
      color: ORANGE,
      title: "🏪 Pokemon Removed from Market",
      description: "You have removed your Gible from the market",
    }),
    height: 285,
  },
  "market info": {
    scene: reply(";market info 48213", {
      color: BLUE,
      title: "Market Listing #48213",
      description: "**Gible** (Level 32)",
      fields: [
        { name: "Price", value: "25,000 coins", inline: true },
        { name: "Gender", value: "-m", inline: true },
        { name: "Nature", value: "Jolly", inline: true },
        { name: "IVs", value: "HP: 24 | ATK: 31 | DEF: 18\nSPATK: 9 | SPDEF: 22 | SPD: 29" },
        { name: "Shiny", value: "No", inline: true },
        { name: "Radiant", value: "No", inline: true },
        { name: "Moves", value: "dragon-rage, sand-attack, bite, tackle" },
      ],
      image: picture(gible),
      footer: "Use ;market buy 48213 to purchase this Pokemon",
    }),
    height: 830,
  },
  "market list": {
    scene: chat(
      ash(";market list gible"),
      bot({
        text: "🏪 **Pokemon Market** • Sort: Recently Listed • Filter: all • Search: gible\nPage 1/1 • 3 Pokemon listed • Use `;market info <id>` for details",
        embeds: [listing(32, 72, "25,000", 48213), listing(18, 54, "9,500", 48177), listing(41, 81, "60,000", 47902)],
      }),
    ),
    height: 780,
  },

  shop: {
    scene: reply(";shop", {
      color: GOLD,
      title: "🛍️ Welcome to the Unified Shop!",
      description:
        "Your one-stop destination for all Pokemon needs!\n\n**Available Categories:**\n• 🛒 **General Items** - Basic items, vitamins, daycare, and everyday supplies\n• ✨ **Radiant Shop** - Exclusive radiant Pokemon and rare collectibles\n• 🔮 **Crystal Slime Exchange** - Exchange crystallized slime for special rewards\n\nUse `;shop <general|radiant|crystal> [page]` to start shopping!",
      fields: [
        { name: "💰 Your Credits", value: "🪙 184,250", inline: true },
        { name: "🎯 Access Level", value: "✅ Radiant Shop Unlocked", inline: true },
      ],
      footer: "Tip: Use ;shop search to find exactly what you're looking for!",
    }),
    height: 575,
  },
  "shop balance": dmReply(
    ";shop balance",
    {
      color: GOLD,
      title: "💰 Credit Balance",
      description: "**Current Balance:** 🪙 184,250 credits",
      fields: [
        {
          name: "💡 How to Earn Credits",
          value: "• Complete daily missions\n• Win Pokemon battles\n• Participate in events\n• Trade with other trainers\n• Find rare Pokemon",
        },
        { name: "🏆 High Roller", value: "You have enough credits to purchase rare items in the radiant shop!" },
      ],
      footer: "Credits are used to purchase items in the shop",
    },
    190,
    435,
  ),
  "shop stats": dmReply(
    ";shop stats",
    {
      color: PURPLE,
      title: "📊 Shop Statistics",
      description: "Current shop status and popular items",
      fields: [
        {
          name: "🏪 **Shop Overview**",
          value: "• Total Items: 15\n• Radiant Pokemon: 0\n• Categories: 4\n• Average Price: 🪙 219,000",
          inline: true,
        },
        {
          name: "💰 **Price Ranges**",
          value: "• Cheapest: 🪙 10,000\n• Most Expensive: 🪙 400,000\n• You can afford: 5 items",
          inline: true,
        },
        { name: "📂 **Top Categories**", value: "• Radiant: 12 items\n• Pokeball: 1 items\n• Charm: 1 items\n• Boost: 1 items", inline: true },
        {
          name: "✅ **Affordable for You**",
          value: "• Master Ball - 🪙 10,000\n• Shiny Charm - 🪙 25,000\n• Radiant Boost - 🪙 50,000\n• Radiant Eevee - 🪙 150,000\n• Radiant Gible - 🪙 175,000",
        },
      ],
      footer: "Your balance: 🪙 184,250 credits",
    },
    190,
    540,
  ),
  "shop search": {
    scene: reply(";shop search boost", {
      color: BLUE,
      title: '🔍 Search Results for "boost"',
      description: "Found 1 item(s) matching your search:",
      fields: [
        {
          name: "✅  Radiant Boost",
          value: "Increases your radiant Pokemon encounter rate\n**Price:** 🪙 50,000 | **Stock:** ∞ | **Category:** Boost",
        },
      ],
    }),
    height: 360,
  },
  "shop info": {
    scene: reply(";shop info", {
      color: GREEN,
      title: "🛍️ Unified Shop Information",
      description: "Your comprehensive shopping destination for all Pokemon needs!",
      fields: [
        {
          name: "🎯 **What is the Unified Shop?**",
          value:
            "The unified shop combines all purchasing systems into one place. Browse general items, exclusive radiant collectibles, and crystal slime exchanges by category.",
        },
        { name: "🔓 **Access Requirements**", value: "• Minimum 50 Pokemon in your collection\n• Available credits for purchases\n• Active trainer status" },
        {
          name: "📂 **Shop Categories**",
          value:
            "• **🛒 General Items** - Basic items, vitamins, daycare spaces, evolution stones, berries\n• **✨ Radiant Shop** - Exclusive radiant Pokemon, rare boosts, and legendary collectibles\n• **🔮 Crystal Slime Exchange** - Trade crystallized slime for credits, friendship stones, VIP tokens",
        },
        {
          name: "💰 **Payment & Credits**",
          value:
            "All purchases are made with credits earned through:\n• Daily missions and achievements\n• Pokemon battles and tournaments\n• Trading with other trainers\n• Special events and competitions",
        },
        {
          name: "🛍️ **How to Shop**",
          value:
            "1. Use `;shop` to see the categories\n2. Use `;shop <category> [page]` to list a category's items\n3. Use `;shop search <query>` to find specific items\n4. Use `;shop buy <item> [amount]` to buy an item\n5. Items are added to your inventory automatically",
        },
        {
          name: "🔧 **Commands**",
          value:
            "`;shop <category> [page]` - Browse a category\n`;shop search <query>` - Search for specific items\n`;shop buy <item> [amount]` - Buy an item\n`;shop balance` - Check your credit balance\n`;shop stats` - View shop statistics\n`;shop info` - Show this information",
        },
        {
          name: "⚠️ **Important Notes**",
          value:
            "• All sales are final - no refunds\n• Stock is limited for many items\n• Prices may change based on availability\n• Some items are seasonal or event-exclusive",
        },
      ],
      footer: "Happy shopping! 🛍️",
    }),
    height: 1160,
  },
  "shop buy": {
    scene: reply(";shop buy fire stone", "You have successfully bought a fire-stone! Use it with `;items apply fire-stone`."),
    height: 250,
  },
  "shop buy candy": { scene: reply(";shop buy candy 5", "Your Eevee has successfully leveled up to Level 37."), height: 230 },
  "shop buy daycare": { scene: reply(";shop buy daycare 2", "You have successfully bought 2 daycare spaces!"), height: 230 },
  "shop buy vitamins": { scene: reply(";shop buy vitamins protein 5", "You have successfully bought 5 protein for your Eevee"), height: 230 },
  "shop buy redeems": { scene: reply(";shop buy redeems 5", "You have successfully bought 5 redeems for 300000 credits!"), height: 250 },
  "shop buy chest": {
    scene: prompted(
      ";shop buy chest rare credits",
      ok("Are you sure you want to buy a rare chest with credits?"),
      "You have successfully bought a rare chest for 300000 credits!\nYou can open it with `;open rare`.",
    ),
    height: 370,
  },
};
