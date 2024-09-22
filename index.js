                                                                                    const {
                                                                                        Client,
                                                                                        GatewayIntentBits,
                                                                                        Collection,
                                                                                        REST,
                                                                                        Routes,
                                                                                        Events,
                                                                                    } = require("discord.js");
                                                                                    const fs = require("fs");
                                                                                    require("dotenv").config();
                                                                                    
                                                                                    const { DISCORD_TOKEN, APP_ID } = process.env;
                                                                                    
                                                                                    // Yeni bir Discord Client oluştur
                                                                                    const client = new Client({
                                                                                        intents: [
                                                                                            GatewayIntentBits.Guilds,
                                                                                            GatewayIntentBits.GuildMessages,
                                                                                            GatewayIntentBits.MessageContent,
                                                                                        ],
                                                                                    });
                                                                                    
                                                                                    // Komutlar koleksiyonu oluştur
                                                                                    client.commands = new Collection();
                                                                                    
                                                                                    // Komutları yüklemek için setup fonksiyonu
                                                                                    const setupCommands = async () => {
                                                                                            const commandFiles = fs
                                                                                                .readdirSync("./commands")
                                                                                            .filter((file) => file.endsWith(".js"));
                                                                                    
                                                                                        for (const file of commandFiles) {
                                                                                            const command = require(`./commands/${file}`);
                                                                                            client.commands.set(command.data.name, command);
                                                                                        }
                                                                                    
                                                                                        // Slash komutları Discord'a kaydetmek için
                                                                                        const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
                                                                                    
                                                                                        try {
                                                                                            console.log("Slash komutları senkronize ediliyor...");
                                                                                            const commands = client.commands.map((cmd) => cmd.data.toJSON());
                                                                                    
                                                                                            await rest.put(Routes.applicationCommands(APP_ID), { body: commands });
                                                                                            
                                                                                            console.log("Komutlar başarıyla senkronize edildi.");
                                                                                        } catch (error) {
                                                                                            console.error("Komut senkronizasyon hatası:", error);
                                                                                        }
                                                                                    };
                                                                                    
                                                                                    // Bot hazır olduğunda
                                                                                    client.once(Events.ClientReady, async () => {
                                                                                        console.log(`${client.user.tag} olarak giriş yapıldı!`);
                                                                                        await setupCommands();
                                                                                    });
                                                                                    
                                                                                    // Komutlar çağrıldığında çalıştır
                                                                                    client.on(Events.InteractionCreate, async (interaction) => {
                                                                                        if (!interaction.isCommand()) return;
                                                                                    
                                                                                        const command = client.commands.get(interaction.commandName);
                                                                                    
                                                                                        if (!command) return;
                                                                                    
                                                                                        try {
                                                                                            await command.execute(interaction);
                                                                                        } catch (error) {
                                                                                            console.error(error);
                                                                                            await interaction.reply({
                                                                                                content: "Komutu çalıştırırken bir hata oluştu.",
                                                                                                ephemeral: true,
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                    
                                                                                    // Botu başlat
                                                                                    client.login(DISCORD_TOKEN);
                                                                                    