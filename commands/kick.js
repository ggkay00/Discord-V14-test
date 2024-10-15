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

        // Kick bilgileri için embed oluşturma
        const embed = new EmbedBuilder()
            .setTitle('Kick Bilgisi')
            .setDescription(`**Sunucu:** ${interaction.guild.name}\n**Sebep:** ${reason}`)
            .addFields({ name: 'Atılma Zamanı', value: kickTimeLocal.toFormat('dd/MM/yyyy - HH:mm:ss') })
            .setColor(0xFFA500);

        try {
            // Kullanıcıya özel mesaj gönderme
            await user.send({ embeds: [embed] });
        } catch (error) {
            interaction.reply({ content: `${user.tag} kişisine özel mesaj gönderilemedi.`, ephemeral: true });
        }

        // Kullanıcıyı sunucudan atma
        await interaction.guild.members.kick(user, reason);
        await interaction.reply({ embeds: [embed.setTitle('Kullanıcı Sunucudan Atıldı').setDescription(`${user.tag} başarıyla sunucudan atıldı.`)] });

        // Ban kaydını veritabanına ekleme
        const kickLog = {
            discord_id: user.id,
            reason: reason,
            kick_time: kickTimeLocal.toISO(),
            kicked_by: interaction.user.tag
        };

        db.run('INSERT INTO kick_logs (discord_id, reason, kick_time, kicked_by) VALUES (?, ?, ?, ?)', 
            [kickLog.discord_id, kickLog.reason, kickLog.kick_time, kickLog.kicked_by], 
            function(err) {
                if (err) {
                    console.error('Kick kaydı oluşturulamadı:', err.message);
                }
            }
        );
    }
};
