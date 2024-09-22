const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogchannel")
        .setDescription("Sunucu için log kanalını ayarla.")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("Logların gönderileceği kanal")
                .setRequired(true),
        ),

    // Log kanalı JSON dosyasını okuma
    getLogChannel(guildId) {
        const filePath = path.join(__dirname, "..", "log_channels.json");

        try {
            const data = fs.readFileSync(filePath, "utf8");
            const jsonData = JSON.parse(data);
            return jsonData[guildId] || null;
        } catch (error) {
            console.error("Log kanalı dosyası okunamadı:", error);
            return null;
        }
    },

    // Log kanalı JSON dosyasına yazma
    setLogChannel(guildId, channelId) {
        const filePath = path.join(__dirname, "..", "log_channels.json");
        let data = {};

        try {
            // Dosyayı oku
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, "utf8");
                data = JSON.parse(fileData);
            }
        } catch (error) {
            console.error("Log kanalı dosyası okunamadı:", error);
        }

        // Sunucunun log kanalını kaydet
        data[guildId] = channelId;

        try {
            // Dosyayı yaz
            fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        } catch (error) {
            console.error("Log kanalı dosyası yazılamadı:", error);
        }
    },

    async execute(interaction) {
        // Kullanıcının iznini kontrol et
        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.ManageGuild,
            )
        ) {
            return interaction.reply({
                content: "Bu komutu kullanmak için yeterli izniniz yok.",
                ephemeral: true,
            });
        }

        // Seçilen kanal
        const channel = interaction.options.getChannel("channel");

        // Log kanalını ayarla
        this.setLogChannel(interaction.guild.id, channel.id);

        // Yanıt gönder
        await interaction.reply(`Log kanalı ${channel} olarak ayarlandı.`);
    },
};
