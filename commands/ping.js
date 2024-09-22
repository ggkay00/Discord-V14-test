const { SlashCommandBuilder } = require("discord.js");
const os = require("os"); // Sistem kaynaklarına erişmek için

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription(
            "Botun ping süresi, hafıza ve CPU kullanım bilgilerini gösterir.",
        ),

    async execute(interaction) {
        const latency = interaction.client.ws.ping;

        // Sistem bilgileri
        const memoryUsage =
            ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
        const totalMemory = os.totalmem() / 1024 ** 3; // GB cinsinden
        const cpuUsage = os.loadavg()[0]; // CPU yükü
        const cpuModel = os.cpus()[0].model; // İşlemci modeli

        await interaction.reply(
            `Botun ping süresi: ${latency.toFixed(2)} ms\n` +
                `Hafıza kullanımı: ${memoryUsage.toFixed(2)}%\n` +
                `CPU kullanımı: ${cpuUsage.toFixed(2)}\n` +
                `İşlemci modeli: ${cpuModel}\n` +
                `Toplam RAM: ${totalMemory.toFixed(2)} GB`,
        );
    },
};
