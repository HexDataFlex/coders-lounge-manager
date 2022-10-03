const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  InteractionType,
  TextInputStyle,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Database = require("./db.js");
const BotSchema = require("./models/Bot.js");
const { token } = require("./config.json");

const db = new Database();
db.connect();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId === "addbot") {
    const modal = new ModalBuilder()
      .setCustomId("addBotModal")
      .setTitle("Add your bot!")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("botNameInput")
            .setLabel("What's your bot's name?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Carl-bot")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("botPrefixInput")
            .setLabel("What's your bot's prefix?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("?")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("botClientIDInput")
            .setLabel("What's your bot's Client ID?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("1234567890")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("botCommandsInput")
            .setLabel("What does your bot do?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

    interaction.showModal(modal);

    // console.log(interaction);
  } else if (interaction.customId.startsWith("approve_")) {
    const botClientId = interaction.customId.split("_")[1];

    BotSchema.findOne({ clientId: botClientId }, async (err, values) => {
      if (err) {
        console.log(err);
        interaction.followUp({
          content: "Something went wrong. Please try again later.",
          ephemeral: true,
        });
      }

      if (values) {
        const submissionsEmbed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("Submission")
          .addFields(
            {
              name: "Name",
              value: "`" + values.name + "`",
            },
            {
              name: "Prefix",
              value: "`" + values.prefix + "`",
            },
            {
              name: "Client ID",
              value:
                "`" +
                values.clientId +
                "`\n[Invite](https://discord.com/api/oauth2/authorize?client_id=" +
                values.clientId +
                "&permissions=1069551046209&scope=bot%20applications.commands)",
            },
            {
              name: "Owner",
              value: `<@${interaction.user.id}> (${interaction.user.id})`,
            },
            {
              name: "Status",
              value: "Approved",
            }
          );

        values.status = "2";
        client.channels.cache.get("1026138856862531607").send({
          content: `<@${values.ownerId}>`,
          embeds: [submissionsEmbed],
        });
        interaction.reply("Bot approved.");
      } else {
        interaction.followUp({
          content: "This bot does not exist in our database.",
          ephemeral: true,
        });
      }

      values.save((err) => {
        if (err) {
          interaction.followUp({
            content: "Something went wrong. Please try again later.",
            ephemeral: true,
          });
          console.log(err);
        }
      });
    });
  } else if (interaction.customId.startsWith("checking_")) {
    const botClientId = interaction.customId.split("_")[1];

    BotSchema.findOne({ clientId: botClientId }, async (err, values) => {
      if (err) {
        console.log(err);
        interaction.followUp({
          content: "Something went wrong. Please try again later.",
          ephemeral: true,
        });
      }

      if (values) {
        const submissionsEmbed = new EmbedBuilder()
          .setColor("#00ffff")
          .setTitle("Submission")
          .addFields(
            {
              name: "Name",
              value: "`" + values.name + "`",
            },
            {
              name: "Prefix",
              value: "`" + values.prefix + "`",
            },
            {
              name: "Client ID",
              value:
                "`" +
                values.clientId +
                "`\n[Invite](https://discord.com/api/oauth2/authorize?client_id=" +
                values.clientId +
                "&permissions=1069551046209&scope=bot%20applications.commands)",
            },
            {
              name: "Owner",
              value: `<@${interaction.user.id}> (${interaction.user.id})`,
            },
            {
              name: "Status",
              value: "Checking",
            }
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("approve_" + values.clientId)
            .setLabel("Approve")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("decline_" + values.clientId)
            .setLabel("Decline")
            .setStyle(ButtonStyle.Danger)
        );

        values.status = "1";
        interaction.message.delete();
        interaction.channel.send({
          embeds: [submissionsEmbed],
          components: [row],
        });
      } else {
        interaction.followUp({
          content: "This bot does not exist in our database.",
          ephemeral: true,
        });
      }

      values.save((err) => {
        if (err) {
          interaction.followUp({
            content: "Something went wrong. Please try again later.",
            ephemeral: true,
          });
          console.log(err);
        }
      });
    });
  } else if (interaction.customId.startsWith("decline_")) {
    const botClientId = interaction.customId.split("_")[1];

    BotSchema.findOne({ clientId: botClientId }, async (err, values) => {
      if (err) {
        console.log(err);
        interaction.followUp({
          content: "Something went wrong. Please try again later.",
          ephemeral: true,
        });
      }

      if (values) {
        const submissionsEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("Submission")
          .addFields(
            {
              name: "Name",
              value: "`" + values.name + "`",
            },
            {
              name: "Prefix",
              value: "`" + values.prefix + "`",
            },
            {
              name: "Client ID",
              value:
                "`" +
                values.clientId +
                "`\n[Invite](https://discord.com/api/oauth2/authorize?client_id=" +
                values.clientId +
                "&permissions=1069551046209&scope=bot%20applications.commands)",
            },
            {
              name: "Owner",
              value: `<@${interaction.user.id}> (${interaction.user.id})`,
            },
            {
              name: "Status",
              value: "Denied",
            }
          );

        values.status = "1";
        client.channels.cache.get("1026138856862531607").send({
          content: `<@${values.ownerId}>`,
          embeds: [submissionsEmbed],
        });
        interaction.message.delete();
        interaction.reply({
          embeds: [submissionsEmbed],
        });
      } else {
        interaction.followUp({
          content: "This bot does not exist in our database.",
          ephemeral: true,
        });
      }

      values.save((err) => {
        if (err) {
          interaction.followUp({
            content: "Something went wrong. Please try again later.",
            ephemeral: true,
          });
          console.log(err);
        }
      });
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.type === InteractionType.ModalSubmit) return;

  if (interaction.customId === "addBotModal") {
    await interaction.deferReply({ ephemeral: true });

    const botName = interaction.fields.getTextInputValue("botNameInput");
    const botPrefix = interaction.fields.getTextInputValue("botPrefixInput");
    const botClientId =
      interaction.fields.getTextInputValue("botClientIDInput");
    const botCommands =
      interaction.fields.getTextInputValue("botCommandsInput");

    const submissionsEmbed = new EmbedBuilder()
      .setColor("#5555ff")
      .setTitle("New submission")
      .addFields(
        {
          name: "Name",
          value: "`" + botName + "`",
        },
        {
          name: "Prefix",
          value: "`" + botPrefix + "`",
        },
        {
          name: "Client ID",
          value:
            "`" +
            botClientId +
            "`\n[Invite](https://discord.com/api/oauth2/authorize?client_id=" +
            botClientId +
            "&permissions=1069551046209&scope=bot%20applications.commands)",
        },
        {
          name: "Commands",
          value: "```\n" + botCommands + "\n```",
        },
        {
          name: "Owner",
          value: `<@${interaction.user.id}> (${interaction.user.id})`,
        },
        {
          name: "Status",
          value: "Submitted",
        }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("approve_" + botClientId)
        .setLabel("Approve")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("checking_" + botClientId)
        .setLabel("Checking")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("decline_" + botClientId)
        .setLabel("Decline")
        .setStyle(ButtonStyle.Danger)
    );

    if (isNaN(botClientId)) {
      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor("#cf4848")
            .setDescription("Client ID must be a number. Please try again."),
        ],
        ephemeral: true,
      });
    } else {
      BotSchema.findOne({ clientId: botClientId }, async (err, settings) => {
        if (err) {
          console.log(err);
          interaction.followUp({
            content: "Something went wrong. Please try again later.",
            ephemeral: true,
          });
        }

        if (!settings) {
          settings = new BotSchema({
            name: botName,
            prefix: botPrefix,
            clientId: botClientId,
            ownerId: interaction.user.id,
            status: 0,
          });

          await interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setColor("#43d15d")
                .setDescription("Your bot has been submitted!"),
            ],
            ephemeral: true,
          });

          client.channels.cache
            .get("1026096727956140072")
            .send({ embeds: [submissionsEmbed], components: [row] });
        } else {
          interaction.followUp({
            content: "This bot is already submitted.",
            ephemeral: true,
          });
        }

        settings.save((err) => {
          if (err) {
            console.log(err);
            interaction.followUp({
              content: "Something went wrong. Please try again later.",
              ephemeral: true,
            });
          }
        });
      });
    }

    // 1069551046209

    // if(isNaN(botName)) {
    //     return interaction.modal.followUp({embeds: [new MessageEmbed().setColor("RED").se]})
    // }
  }
});

client.login(token);
