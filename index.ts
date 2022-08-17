import {ActivityType, Client, IntentsBitField, Interaction, REST, Routes, SlashCommandBuilder} from "discord.js";
import {readdirSync, readFileSync, writeFileSync} from "fs";
import config from "./config.json"
import moment from "moment";

export {
    addPoll, removePoll, getPolls
}

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions
    ]
})

const commands: { data: SlashCommandBuilder, execute: (interaction: Interaction) => Promise<void> }[] = []

readdirSync("./commands").forEach(it => {
    commands.push(require(`./commands/${it}`).default)
})

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand() || !interaction.isChatInputCommand() || !interaction.inGuild() || !interaction.isRepliable()) return

    await commands.find(it => it.data.name == interaction.commandName)?.execute(interaction)
})

client.on("ready", async () => {
    await new REST().setToken(config["token"]).put(
        Routes.applicationCommands(client.user.id), {
            body: commands.map(command => command.data.toJSON())
        }
    )

    setInterval(async () => {
        const polls = getPolls()

        polls.filter(it => moment().valueOf() >= it.time).forEach((it) => {
            const channel = client.channels.resolve(config["channel"])

            if (channel?.isTextBased()) {
                const message = channel.messages.resolve(it.messageId)

                if (message) {
                    const yes = message.reactions.resolve(config["yes-emoji"]).count
                    const no = message.reactions.resolve(config["no-emoji"]).count
                    const result = yes > no ? `${config["yes-emoji"]} wins` : yes == no ? "Draw" : `${config["no-emoji"]} wins`

                    message.reply(`Poll ended. ${result}!`)
                    console.log(`Poll ended: ${it.messageId}. Yes: ${yes}. No: ${no}. Result: ${result}`)
                }

                removePoll(it.messageId)
            } else {
                throw Error(`Channel ${config["channel"]} not found`)
            }
        })
    }, 2000)

    client.user.setActivity(`${client.guilds.cache.size} Guilds`, {
        type: ActivityType.Watching
    })

    console.log(`Client Logged in ${client.user.tag}`)
})

client.login(config["token"]).then(() => {})

const getPolls: () => { title: string, description: string, messageId: string, time: number }[] = () => {
    return JSON.parse(readFileSync("./polls.json", { flag: "a+" }).toString())
}

const addPoll = (options: { title: string, description: string, messageId: string, time: number }) => {
    writeFileSync("./polls.json", JSON.stringify([...getPolls(), options]))
    console.log(`Poll created: ${options.messageId}. Title: ${options.title}. Description: ${options.description}. Time: ${options.time}`)
}

const removePoll = (id: string) => {
    writeFileSync("./polls.json", JSON.stringify([...getPolls().filter(it => it.messageId != id)]))
    console.log(`Poll removed: ${id}`)
}