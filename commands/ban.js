const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { logAction } = require('../main'); // logAction doğru import edilmeli
const { DateTime } = require('luxon'); // Tarih/saat işlemleri için

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bir kullanıcıyı sunucudan banlar.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Banlanacak kullanıcı')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Ban süresi (örn: 1d, 3h)'))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('Ban sebebi')),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const userTz = 'Europe/Istanbul'; // Varsayılan saat dilimi

        // Ban yetkisi kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yeterli izniniz yok.', ephemeral: true });
        }

        const utcNow = DateTime.now().setZone('UTC');
        const banTimeLocal = utcNow.setZone(userTz);

        try {
            await interaction.guild.members.ban(user, { reason });
        } catch (error) {
            return interaction.reply({ content: 'Kullanıcı banlanamadı veya bulunamadı.', ephemeral: true });
        }

        // Kullanıcıya özel mesaj gönderme
        const embed = new EmbedBuilder()
            .setTitle('Ban Bilgisi')
            .setDescription(`**Sunucu:** ${interaction.guild.name}\n**Sebep:** ${reason}`)
            .addFields({ name: 'Ban Atılma Zamanı', value: banTimeLocal.toFormat('dd/MM/yyyy - HH:mm:ss') })
            .setColor(0xFF0000);

        try {
            await user.send({ embeds: [embed] });
        } catch (error) {
            await interaction.followUp({ content: `${user.tag} kişisine özel mesaj gönderilemedi.`, ephemeral: true });
        }

        // Sunucuya mesaj gönderme
        embed.setTitle('Kullanıcı Sunucudan Banlandı')
            .setDescription(`${user.tag} başarıyla sunucudan banlandı.`)
            .setFooter({ text: `Banlayan kişi: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        await interaction.reply({ embeds: [embed] });

        // Log işlemi
        logAction(interaction.client, interaction.guild, `${user.tag} kullanıcısı ${interaction.user.tag} tarafından banlandı.`);
    }
};
