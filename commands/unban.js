const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
} = require("discord.js");
const { DateTime } = require("luxon"); // Tarih/saat işlemleri için

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Bir kullanıcının banını kaldırır.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Banı kaldırılacak kullanıcı")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("Ban kaldırma sebebi"),
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const reason =
            interaction.options.getString("reason") || "Sebep belirtilmedi.";
        const userTz = "Europe/Istanbul"; // Varsayılan saat dilimi

        // Ban kaldırma yetkisi kontrolü
        if (
            !interaction.member.permissions.has(PermissionFlagsBits.BanMembers)
        ) {
            return interaction.reply({
                content: "Bu komutu kullanmak için yeterli izniniz yok.",
                ephemeral: true,
            });
        }

        const utcNow = DateTime.now().setZone("UTC");
        const unbanTimeLocal = utcNow.setZone(userTz);

        try {
            await interaction.guild.members.unban(user, reason);
        } catch (error) {
            return interaction.reply({
                content: "Kullanıcı banlı değil veya bulunamadı.",
                ephemeral: true,
            });
        }

        // Kullanıcıya özel mesaj gönderme
        const embed = new EmbedBuilder()
            .setTitle("Ban Kaldırma Bilgisi")
            .setDescription(
                `**Sunucu:** ${interaction.guild.name}\n**Sebep:** ${reason}`,
            )
            .addFields({
                name: "Ban Kaldırılma Zamanı",
                value: unbanTimeLocal.toFormat("dd/MM/yyyy - HH:mm:ss"),
            })
            .setColor(0x00ff00);

        try {
            await user.send({ embeds: [embed] });
        } catch (error) {
            interaction.reply({
                content: `${user.tag} kişisine özel mesaj gönderilemedi.`,
                ephemeral: true,
            });
        }

        // Sunucuya mesaj gönderme
        embed
            .setTitle("Kullanıcının Banı Kaldırıldı")
            .setDescription(`${user.tag} başarıyla sunucudan banı kaldırıldı.`)
            .setFooter({
                text: `Banı kaldıran kişi: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await interaction.reply({ embeds: [embed] });
    },
};
