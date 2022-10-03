const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageButton,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Displays the add bot panel!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    interaction.reply({ content: "Panel sent", ephemeral: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("addbot")
        .setLabel("Add bot")
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("Add your bot")
      .setDescription(
        "Hello there! If you are here, you probably want to add your own bot to test it here. Your bot must follow the rules in <#1025860442372972595>. Click this button, fill out the form and just wait."
      );

    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });
  },
};
