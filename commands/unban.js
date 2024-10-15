const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const { DateTime } = require('luxon');

// Veritabanı bağlantısı
const db = new sqlite3.Database('bot_database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Bir kullanıcının banını kaldırır.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Banı kaldırılacak kullanıcı')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Ban kaldırma sebebi')),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Sebep belirtilmedi.';
        const userTz = 'Europe/Istanbul';

        // Ban kaldırma yetkisi kontrolü
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: 'Bu komutu kullanmak için yeterli izniniz yok.',
                ephemeral: true,
            });
        }

        const utcNow = DateTime.now().setZone('UTC');
        const unbanTimeLocal = utcNow.setZone(userTz);

        try {
            await interaction.guild.members.unban(user, reason);
        } catch (error) {
            return interaction.reply({
                content: 'Kullanıcı banlı değil veya bulunamadı.',
                ephemeral: true,
            });
        }

        // Kullanıcıya özel mesaj gönderme
        const embed = new EmbedBuilder()
            .setTitle('Ban Kaldırma Bilgisi')
            .setDescription(`**Sunucu:** ${interaction.guild.name}\n**Sebep:** ${reason}`)
            .addFields({
                name: 'Ban Kaldırılma Zamanı',
                value: unbanTimeLocal.toFormat('dd/MM/yyyy - HH:mm:ss'),
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
            .setTitle('Kullanıcının Banı Kaldırıldı')
            .setDescription(`${user.tag} başarıyla sunucudan banı kaldırıldı.`)
            .setFooter({
                text: `Banı kaldıran kişi: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await interaction.reply({ embeds: [embed] });

        // Ban kaldırma kaydını veritabanına ekleme
        const unbanLog = {
            discord_id: user.id,
            reason: reason,
            unban_time: unbanTimeLocal.toISO(),
            unbanned_by: interaction.user.tag
        };

        db.run('INSERT INTO unban_logs (discord_id, reason, unban_time, unbanned_by) VALUES (?, ?, ?, ?)', 
            [unbanLog.discord_id, unbanLog.reason, unbanLog.unban_time, unbanLog.unbanned_by], 
            function(err) {
                if (err) {
                    console.error('Ban kaldırma kaydı oluşturulamadı:', err.message);
                }
            }
        );
    }
};
