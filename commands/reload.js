const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
require("dotenv").config(); // .env dosyasından verileri çekmek için

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Komutları yeniden yükler.")
    .setDefaultMemberPermissions(0), // Sadece bot sahibi tarafından kullanılabilir

  async execute(interaction) {
    // Sadece bot sahibi komutu kullanabilir
    if (interaction.user.id !== process.env.BOT_OWNER_ID) {
      return interaction.reply({
        content: "Bu komutu kullanma izniniz yok.",
        ephemeral: true,
      });
    }

    try {
      // Komutları yeniden yükleme
      const commandFiles = fs
        .readdirSync("./commands")
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const commandName = `./commands/${file}`;
        delete require.cache[require.resolve(commandName)]; // Cache temizleme
        const command = require(commandName);
        interaction.client.commands.set(command.data.name, command);
      }

      await interaction.reply("Komutlar başarıyla yeniden yüklendi!");
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: `Komutları yüklerken bir hata oluştu: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
