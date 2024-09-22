const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Minecraft sunucusunun bilgilerini gösterir.")
        .addStringOption((option) =>
            option
                .setName("server_ip")
                .setDescription("Sunucunun IP adresi")
                .setRequired(true),
        ),

    async execute(interaction) {
        const serverIp = interaction.options.getString("server_ip");
        const url = `https://mcapi.us/server/status?ip=${serverIp}`;

        try {
            const response = await axios.get(url);
            const data = response.data;

            if (data.online) {
                const embed = new EmbedBuilder()
                    .setTitle("Sunucu Bilgileri")
                    .addFields(
                        {
                            name: "Aktif Oyuncu Sayısı",
                            value: data.players.now.toString(),
                            inline: false,
                        },
                        {
                            name: "Maksimum Oyuncu Sayısı",
                            value: data.players.max.toString(),
                            inline: false,
                        },
                        {
                            name: "Versiyon",
                            value: data.version || "Bilinmiyor",
                            inline: false,
                        },
                        {
                            name: "MotD",
                            value: data.motd || "Bilinmiyor",
                            inline: false,
                        },
                    )
                    .setColor(0x0099ff);

                if (data.icon) {
                    embed.setThumbnail(data.icon);
                }

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply(
                    "Sunucu çevrimdışı veya sunucu bilgileri alınamadı.",
                );
            }
        } catch (error) {
            await interaction.reply(
                `Sunucu bilgileri alınırken bir hata oluştu: ${error.message}`,
            );
        }
    },
};
