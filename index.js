import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder
} from 'discord.js';
import { generateWheelGIF } from './wheel-generator.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('spin')
    .setDescription('Spin the Jacket Sparrow Compass')
    .addStringOption(opt =>
      opt
        .setName('choice')
        .setDescription('Comma-separated choices, e.g. Alice, Bob, Charlie, Nitro')
        .setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Commands registered successfully!');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
})();

client.once('ready', () => {
  console.log(`Jacket Sparrow Compass is online as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'spin') return;

  await interaction.deferReply();

  const raw = interaction.options.getString('choice');
  const choices = raw
    .split(/[,;|]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);

  if (choices.length < 2) {
    return interaction.editReply('You need at least 2 choices!');
  }

  if (choices.length > 8) {
    return interaction.editReply('Too many choices (maximum 8).');
  }

  try {
    const result = await generateWheelGIF(choices, {
      duration: 4500,
      fps: 22,
      spinRevolutions: 5.5
    });

    const gifBuffer = result.buffer;
    const winner = result.winner;

    const attachment = new AttachmentBuilder(gifBuffer, { name: 'wheel.gif' });

    const embed = new EmbedBuilder()
      .setTitle('Jacket Sparrow Compass')
      .setDescription(`**what you truly want is** ${winner}`)
      .setImage('attachment://wheel.gif')
      .setColor(0x6C60D7)
      .setFooter({ text: `${choices.length} choices` })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
      files: [attachment]
    });
  } catch (err) {
    console.error(err);
    await interaction.editReply('Failed to generate the wheel. Please try again.');
  }
});

client.login(process.env.DISCORD_TOKEN);