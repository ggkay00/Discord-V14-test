const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { DateTime } = require('luxon');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Bir kullanıcıyı sunucudan atar.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Atılacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Atılma sebebi')),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const user_tz = 'Europe/Istanbul';

        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yeterli izniniz yok.', ephemeral: true });
        }

        const utcNow = DateTime.now().setZone('UTC');
        const kickTimeLocal = utcNow.setZone(user_tz);

        const embed = new EmbedBuilder()
            .setTitle('Kick Bilgisi')
            .setDescription(`**Sunucu:** ${interaction.guild.name}\n**Sebep:** ${reason}`)
            .addFields({ name: 'Atılma Zamanı', value: kickTimeLocal.toFormat('dd/MM/yyyy - HH:mm:ss') })
            .setColor(0xFFA500);

        try {
            await user.send({ embeds: [embed] });
        } catch (error) {
            interaction.reply({ content: `${user.tag} kişisine özel mesaj gönderilemedi.`, ephemeral: true });
        }

        await interaction.guild.members.kick(user, reason);
        interaction.reply({ embeds: [embed.setTitle('Kullanıcı Sunucudan Atıldı').setDescription(`${user.tag} başarıyla sunucudan atıldı.`)] });
    }
};
