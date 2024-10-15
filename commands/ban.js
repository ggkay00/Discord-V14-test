const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const { logAction } = require('../main');
const { DateTime } = require('luxon');

// Veritabanı bağlantısı
const db = new sqlite3.Database('bot_database.db', (err) => {
    if (err) {
        console.error(err.message);
    }
});

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
        const userTz = 'Europe/Istanbul';

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

        // Ban kaydını veritabanına ekleme
        const banLog = {
            discord_id: user.id,
            reason: reason,
            ban_time: banTimeLocal.toISO(), // Luxon ile ISO formatına çeviriyoruz
            banned_by: interaction.user.tag
        };

        db.run('INSERT INTO ban_logs (discord_id, reason, ban_time, banned_by) VALUES (?, ?, ?, ?)', 
            [banLog.discord_id, banLog.reason, banLog.ban_time, banLog.banned_by], 
            function(err) {
                if (err) {
                    console.error('Ban kaydı oluşturulamadı:', err.message);
                }
            }
        );
    }
};
