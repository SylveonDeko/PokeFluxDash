import { caughtEmbed, spawnEmbed, sprites, startScene } from "$lib/components/home/scenes";
import { BLUE, GOLD, GREEN, OK, PURPLE, TIME, confirm, reply, type CommandPreview } from "./replies/chat";
import { extrasPreviews } from "./replies/extras";
import { pokemonPreviews } from "./replies/pokemon";
import { progressPreviews } from "./replies/progress";
import { tradingPreviews } from "./replies/trading";

export type { CommandPreview } from "./replies/chat";

/** Previews keyed by command name, with the bot's real reply for each. */
export const previews: Record<string, CommandPreview> = {
  start: { scene: startScene, height: 505 },
  catch: {
    scene: {
      channel: "general",
      messages: [
        { author: "bot", time: TIME, embeds: [spawnEmbed(sprites.ditto, true, false)] },
        { author: "ash", time: TIME, text: ";catch ditto", reactions: [{ emoji: "✅", count: 1 }] },
        { author: "bot", time: TIME, embeds: [caughtEmbed] },
      ],
    },
    height: 485,
  },
  "duel single": {
    scene: reply(";duel single <@misty>", "<@misty> You have been challenged to a 1v1 duel by ash!"),
    height: 250,
  },
  prefix: { scene: reply(";prefix", { color: OK, description: "The prefix here is `;`." }), height: 260 },
  "spawn enable": { scene: reply(";spawn enable", confirm("Enabled spawns in <#general>")), height: 260 },
  "spawn disable": { scene: reply(";spawn disable <#off-topic>", confirm("Disabled spawns in <#off-topic>")), height: 260 },
  "spawn redirect": {
    scene: reply(";spawn redirect add <#trades>", confirm("Successfully added <#trades> to redirect channels.")),
    height: 260,
  },
  "spawn speed": {
    scene: reply(";spawn speed 15", { color: GREEN, title: "Spawn Speed Updated", description: "⚡ Very fast spawns activated!\nSpeed set to: 15" }),
    height: 305,
  },
  "spawn smallimages": { scene: reply(";spawn smallimages on", confirm("Successfully updated small to true")), height: 260 },
  "spawn modalview": { scene: reply(";spawn modalview on", confirm("Successfully updated modal to true")), height: 260 },
  "spawn settings": { scene: reply(";spawn settings pin true", confirm("Successfully updated pin to true")), height: 260 },
  "game list": {
    scene: reply(";game list", {
      color: BLUE,
      title: "🎮 Available Mini-Games",
      description: "Here are all the fun games you can play to earn rewards!",
      fields: [
        { name: "🔍 **Word Search**", value: "Find hidden Pokemon names in a letter grid!\nTime limit: 200 seconds\nCommand: `;game wordsearch`" },
        { name: "🎰 **Slot Machine**", value: "Spin the Pokemon-themed slot machine for big wins!\nVarious symbols with different payouts\nCommand: `;game slots`" },      ],
      footer: "Have fun and good luck! 🍀",
    }),
    height: 485,
  },
  "game help": {
    scene: reply(";game help", {
      color: GREEN,
      title: "🎮 Games Help",
      description: "Welcome to the mini-games system! Here's how to get started:",
      fields: [
        {
          name: "🎯 **How to Play**",
          value: "• Use `;game list` to see all available games\n• Each game has different rules and rewards\n• Some games are single-player, others multiplayer\n• Read each game's description before playing!",
        },
        {
          name: "🏆 **Rewards**",
          value: "• Earn credits for winning games\n• Get special items from certain games\n• Unlock achievements for game milestones\n• Compete on leaderboards!",
        },
        {
          name: "⚡ **Tips**",
          value: "• Practice makes perfect!\n• Some games have time limits\n• Pay attention to game instructions\n• Don't be afraid to try different strategies",
        },
        {
          name: "🆘 **Need More Help?**",
          value: "• Join our support server\n• Ask questions in community channels\n• Check out the full guide online\n• Contact staff for technical issues",
        },
      ],
      footer: "Have fun gaming! 🎮",
    }),
    height: 740,
  },
  tradehelp: {
    scene: reply(";tradehelp", {
      color: BLUE,
      title: "🔄 Trading Help",
      description: "Learn how to trade with other users!",
      fields: [
        {
          name: "**Starting a Trade**",
          value:
            "Use `;trade @user` to request a trade with another user. They must react with ✅ before the trade begins.\nUse `;quicktrade @user <position>` to start a trade with a Pokemon already offered.",
        },
        {
          name: "**Adding Items**",
          value:
            "• **Pokemon**: `;trade add <positions>` (e.g. `;trade add 5` or `;trade add 2 5 10`)\n• **Credits**: `;trade credits <amount>` (supports `k` and `m` for thousands/millions)\n• **Tokens**: `;trade tokens <type> <amount>`",
        },
        { name: "**Removing Items**", value: "• **Pokemon**: `;trade remove <positions>`\n• **Tokens**: `;trade untokens <type> <amount>`" },
        {
          name: "**Completing the Trade**",
          value:
            "Once both users have added items, use `;trade confirm`. Both users must confirm before the trade executes. Changing the trade resets both confirmations.\nUse `;trade cancel` to cancel.",
        },
        { name: "**Trade Evolution**", value: "Some Pokemon evolve when traded! The bot will automatically check and evolve eligible Pokemon." },
        {
          name: "**Important Notes**",
          value:
            "• You cannot trade your #1 Pokemon\n• You cannot trade eggs or favorited Pokemon\n• Pokemon on the market cannot be traded\n• Trade sessions expire after 6 minutes of inactivity",
        },
      ],
      footer: "Use ;gift commands to give items without expecting anything in return!",
    }),
    height: 880,
  },
  "gift help": {
    scene: reply(";gift help", {
      color: GOLD,
      title: "🎁 Gifting Help",
      description: "Learn how to gift items to other users!",
      fields: [
        { name: "**Gift Credits**", value: "Use `;gift credits @user amount` to give Coins to another user.\nExample: `;gift credits @friend 10000`" },
        { name: "**Gift Redeems**", value: "Use `;gift redeems @user amount` to give redeems to another user.\nExample: `;gift redeems @friend 3`" },
        {
          name: "**Gift Pokemon**",
          value:
            "Use `;gift pokemon @user position` to give a Pokemon to another user.\nExample: `;gift pokemon @friend 5`\n⚠️ You cannot gift your #1 Pokemon, eggs, or favorited Pokemon",
        },
        {
          name: "**Gift Tokens**",
          value:
            "Use `;gift tokens @user type amount` to give radiant tokens.\nExample: `;gift tokens @friend Fire 5`\nAvailable types: Dark, Bug, Ground, Fighting, Steel, Electric, Grass, Fairy, Water, Rock, Flying, Psychic, Normal, Dragon, Fire, Ghost, Ice, Poison",
        },
        {
          name: "**Important Notes**",
          value:
            "• All gifts require confirmation before sending\n• Gifts cannot be undone once sent\n• Both users must have started (`;start`) to gift\n• Trade-locked users cannot send or receive gifts\n• All gifts are logged for security",
        },
      ],
      footer: "Use ;trade to exchange items with another user!",
      timestamp: TIME,
    }),
    height: 870,
  },
  "voucher info": {
    scene: reply(";voucher info", {
      color: PURPLE,
      title: "🎫 Voucher Request System",
      description: "Welcome to the voucher request system! Here's everything you need to know:",
      fields: [
        {
          name: "🎯 **What are Vouchers?**",
          value: "Vouchers are special currency that can be redeemed for custom Pokemon artwork.\nThey're earned through various activities and events in the bot.",
        },
        {
          name: "🎨 **How to Use Vouchers**",
          value:
            "1. Use `;voucher request` to see the request form\n2. Fill it in with your Pokemon and appearance details\n3. Specify your payment method and artist preferences\n4. Submit your request and wait for processing",
        },
        {
          name: "📋 **Request Process**",
          value:
            "• Your request will be reviewed by staff\n• Artists will be assigned based on availability\n• You'll be notified of status updates\n• Completed artwork will be delivered to you",
        },
        {
          name: "⚠️ **Important Notes**",
          value:
            "• You can have multiple active requests\n• Requests cannot be cancelled once submitted\n• Processing time varies based on complexity\n• Follow community guidelines for requests",
        },
        {
          name: "🔧 **Commands**",
          value: "`;voucher request` - Submit a new request\n`;voucher status` - View your request status\n`;voucher info` - Show this information",
        },
      ],
      footer: "Happy requesting! 🎨",
    }),
    height: 835,
  },
  ...extrasPreviews,
  ...pokemonPreviews,
  ...tradingPreviews,
  ...progressPreviews,
};
