const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const express = require('express');
const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});
const prefix = ".";

app.get('/', (req, res) => res.send('Dormophors is online.'));
app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('Express ping server running.'))
  .on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('Port already in use, continuing with bot initialization...');
    } else {
      console.error('Express server error:', err);
    }
  });

// Initialize logging
const fs = require('fs');
const logFile = 'bot_logs.txt';

function logCommand(message, command, args) {
  const logEntry = `[${new Date().toISOString()}] ${message.author.tag} used ${command} ${args.join(' ')}\n`;
  fs.appendFileSync(logFile, logEntry);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  // Check if it's the specific server
  if (member.guild.id !== '1196854364611027106') return;

  try {
    // Add the specified role
    const role = member.guild.roles.cache.get('1235305933672808479');
    if (role) {
      await member.roles.add(role);
    }

    // Create a welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('🌟 Welcome to Our Amazing Community! 🌟')
      .setDescription(`
        Hey ${member}! We're thrilled to have you here! 🎉

        ✨ Feel free to introduce yourself and make yourself at home
        🤝 Meet new friends and join our conversations
        💫 Explore our channels and have fun!

        We hope you'll have an amazing time here! 🌈
      `)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage('https://i.gifer.com/origin/60/606dc4f509be21ae620b538570dc1417_w200.gif')
      .setTimestamp()
      .setFooter({ text: `Welcome to ${member.guild.name}!` });

    // Send the welcome message to specific channel
    const welcomeChannel = member.guild.channels.cache.get('1196854365084975170');
    if (welcomeChannel) {
      await welcomeChannel.send({ embeds: [welcomeEmbed] });
    }
  } catch (error) {
    console.error('Error in welcome message:', error);
  }
});

const snipes = new Map();
const afkUsers = new Map();

client.on('messageDelete', async (message) => {
  if (message.author.bot) return;
  snipes.set(message.channel.id, {
    content: message.content,
    author: message.author,
    timestamp: message.createdTimestamp
  });
});

client.on('messageCreate', async (message) => {
  // Check if mentioned user is AFK
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(mentionedUser => {
      if (afkUsers.has(mentionedUser.id)) {
        const afkInfo = afkUsers.get(mentionedUser.id);
        message.reply(`${mentionedUser.tag} is AFK: ${afkInfo.reason} (Since: <t:${Math.floor(afkInfo.timestamp / 1000)}:R>)`);
      }
    });
  }

  // Remove AFK status if user sends a message
  if (afkUsers.has(message.author.id)) {
    afkUsers.delete(message.author.id);
    message.reply("Welcome back! I've removed your AFK status.");
  }

  // React with heart when developer is tagged
  if (message.mentions.users.has('1074336035783331841')) {
    await message.react('❤️');
  }

  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  logCommand(message, command, args);
  const embed = new EmbedBuilder()
    .setColor("DarkButNotBlack")
    .setFooter({ text: "Coded with ❤️ by aron.ww" })
    .setThumbnail("https://i.gifer.com/origin/60/606dc4f509be21ae620b538570dc1417_w200.gif");

  // Moderation
  if (command === 'mute') {
    const member = message.mentions.members.first();
    if (member) {
      await member.timeout(10 * 60 * 1000);
      embed.setTitle("User Muted").setDescription(`${member} has been muted.`);
      const dmEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("You've been muted!")
        .setDescription(`You have been muted in ${message.guild.name} for 10 minutes.`)
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'unmute') {
    const member = message.mentions.members.first();
    if (member) {
      await member.timeout(null);
      embed.setTitle("User Unmuted").setDescription(`${member} has been unmuted.`);
      const dmEmbed = new EmbedBuilder()
        .setColor("Green")
        .setTitle("You've been unmuted!")
        .setDescription(`You have been unmuted in ${message.guild.name}.`)
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'ban') {
    const member = message.mentions.members.first();
    if (member) {
      const dmEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("You've been banned!")
        .setDescription(`You have been banned from ${message.guild.name}.`)
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
      await member.ban();
      embed.setTitle("User Banned").setDescription(`${member} has been banned.`);
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'unban') {
    const userId = args[0];
    if (!userId) {
      embed.setTitle("Error").setDescription("Please provide a user ID to unban.");
      return message.channel.send({ embeds: [embed] });
    }
    try {
      await message.guild.members.unban(userId);
      embed.setTitle("User Unbanned").setDescription(`User with ID ${userId} has been unbanned.`);
    } catch (error) {
      embed.setTitle("Error").setDescription("Failed to unban user. Make sure the ID is valid.");
    }
    message.channel.send({ embeds: [embed] });
  } else if (command === 'kick') {
    const member = message.mentions.members.first();
    if (member) {
      const dmEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("You've been kicked!")
        .setDescription(`You have been kicked from ${message.guild.name}.`)
        .setTimestamp();
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
      await member.kick();
      embed.setTitle("User Kicked").setDescription(`${member} has been kicked.`);
    } else embed.setTitle("Error").setDescription("Mention a valid user.");
    message.channel.send({ embeds: [embed] });
  } else if (command === 'purge') {
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount)) return;
    const msgs = await message.channel.bulkDelete(amount);
    embed.setTitle("Messages Purged").setDescription(`Deleted ${msgs.size} messages.`);
    message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete(), 3000));
  } else if (command === 'purgebots') {
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const botMsgs = messages.filter(m => m.author.bot);
    await message.channel.bulkDelete(botMsgs);
    embed.setTitle("Bot Messages Purged").setDescription(`Deleted ${botMsgs.size} bot messages.`);
    message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete(), 3000));
  }

  // Utility
  else if (command === 'av') {
    const user = message.mentions.users.first() || message.author;
    embed.setTitle("Avatar").setImage(user.displayAvatarURL({ dynamic: true }));
    message.channel.send({ embeds: [embed] });
  } else if (command === 'banner') {
    const user = message.mentions.users.first() || message.author;
    const fetchedUser = await client.users.fetch(user.id, { force: true });
    if (fetchedUser.banner) {
      embed.setTitle("Banner").setImage(fetchedUser.bannerURL({ dynamic: true, size: 4096 }));
    } else {
      embed.setTitle("No Banner").setDescription("This user has no banner.");
    }
    message.channel.send({ embeds: [embed] });
  } else if (command === 'ui') {
    const member = message.mentions.members.first() || message.member;
    const roles = member.roles.cache.map(role => role.name).join(', ');
    const status = member.presence?.status || 'offline';

    embed.setTitle("User Information")
      .setImage(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👤 Username', value: member.user.tag, inline: true },
        { name: '🆔 ID', value: member.id, inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: '🎭 Roles', value: roles || 'No roles', inline: false },
        { name: '🔵 Status', value: status.charAt(0).toUpperCase() + status.slice(1), inline: true },
        { name: '🤖 Bot', value: member.user.bot ? 'Yes' : 'No', inline: true }
      );
    message.channel.send({ embeds: [embed] });
  } else if (command === 'serverinfo') {
    embed.setTitle("Server Info")
      .addFields(
        { name: 'Server Name', value: message.guild.name },
        { name: 'Members', value: `${message.guild.memberCount}` },
        { name: 'Created On', value: message.guild.createdAt.toDateString() }
      );
    message.channel.send({ embeds: [embed] });
  }

  // Basics
  else if (command === 'ping') {
    embed.setTitle("Pong!").setDescription(`Latency: ${Date.now() - message.createdTimestamp}ms`);
    message.channel.send({ embeds: [embed] });
  } else if (command === 'announce') {
    if (!message.member.permissions.has('Administrator') && message.author.id !== '1074336035783331841') {
      embed.setTitle("Error").setDescription("You need Administrator permission to use this command!");
      return message.channel.send({ embeds: [embed] });
    }

    const announcement = args.join(' ');
    if (!announcement) {
      embed.setTitle("Error").setDescription("Please provide an announcement message!");
      return message.channel.send({ embeds: [embed] });
    }

    embed.setTitle("📢 Server Announcement")
      .setDescription(announcement)
      .setTimestamp();
    message.channel.send({ content: "@everyone", embeds: [embed] });
  } else if (command === 'snipe') {
    const snipe = snipes.get(message.channel.id);
    if (!snipe) {
      embed.setTitle("No Message to Snipe")
        .setDescription("There are no recently deleted messages in this channel.");
      return message.channel.send({ embeds: [embed] });
    }

    embed.setTitle("Sniped Message")
      .setDescription(snipe.content)
      .addFields(
        { name: 'Author', value: snipe.author.tag },
        { name: 'Deleted', value: `<t:${Math.floor(snipe.timestamp / 1000)}:R>` }
      )
      .setThumbnail(snipe.author.displayAvatarURL({ dynamic: true }));
    message.channel.send({ embeds: [embed] });
  } else if (command === 'help') {
    embed.setTitle("Dormophors Bot Help").setDescription(`Prefix: \`${prefix}\``)
      .addFields(
        { name: 'Moderation', value: 'mute, unmute, ban, kick, purge, purgebots, announce' },
        { name: 'Utility', value: 'av, banner, ui, serverinfo' },
        { name: 'Basics', value: 'help, ping, dev, snipe, stealemoji, afk' }
      );
    message.channel.send({ embeds: [embed] });
  } else if (command === 'steal') {
    let targetMessage = message;
    if (message.reference) {
      targetMessage = await message.channel.messages.fetch(message.reference.messageId);
    }

    let emojiToSteal;
    let isSticker = false;

    // Check for stickers first
    if (targetMessage.stickers && targetMessage.stickers.size > 0) {
      const sticker = targetMessage.stickers.first();
      emojiToSteal = {
        name: sticker.name,
        url: sticker.url
      };
      isSticker = true;
    } 
    // Check for emoji in message content
    else if (args[0]) {
      const emojiRegex = /<(?:a)?:([a-zA-Z0-9_]+):(\d+)>/;
      const match = args[0].match(emojiRegex);
      if (match) {
        emojiToSteal = {
          name: match[1],
          url: `https://cdn.discordapp.com/emojis/${match[2]}`
        };
      }
    }

    if (!emojiToSteal) {
      embed.setTitle("Error")
        .setDescription("Please provide a valid emoji or reply to a message with a sticker!");
      return message.channel.send({ embeds: [embed] });
    }

    try {
      const newEmoji = await message.guild.emojis.create({
        attachment: emojiToSteal.url,
        name: emojiToSteal.name
      });

      embed.setTitle(isSticker ? "Sticker Converted to Emoji!" : "Emoji Stolen!")
        .setDescription(`Successfully added ${newEmoji} as :${newEmoji.name}:`)
        .setThumbnail(emojiToSteal.url);
      message.channel.send({ embeds: [embed] });
    } catch (error) {
      embed.setTitle("Error")
        .setDescription("Failed to add emoji. Make sure I have permission to manage emojis!");
      message.channel.send({ embeds: [embed] });
    }

    logCommand(message, command, args);
  } else if (command === 'afk') {
    const reason = args.join(' ') || 'No reason provided';
    afkUsers.set(message.author.id, {
      reason: reason,
      timestamp: Date.now()
    });
    embed.setTitle("AFK Status Set")
      .setDescription(`I've set your AFK status: ${reason}`);
    message.channel.send({ embeds: [embed] });
  } else if (command === 'dev') {
    embed.setTitle("Bot Developer")
      .setDescription("Meet the developer behind Dormophors!")
      .addFields(
        { name: '👨‍💻 Developer', value: 'aron.ww', inline: true },
        { name: '🌐 Discord', value: '@aron.ww', inline: true },
        { name: '📅 Bot Created', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '🤖 Version', value: '1.0.0', inline: true }
      )
      .setImage('https://i.gifer.com/origin/60/606dc4f509be21ae620b538570dc1417_w200.gif');
    message.channel.send({ embeds: [embed] });
  } else {
    embed.setTitle("Unknown Command")
      .setDescription(`Command not recognized. Use \`${prefix}help\` to see available commands.`);
    message.channel.send({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);