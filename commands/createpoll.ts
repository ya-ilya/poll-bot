import {EmbedBuilder, Interaction, SlashCommandBuilder} from "discord.js";
import config from "../config.json"
import {addPoll} from "../index";
import moment from "moment";

export default {
    data: new SlashCommandBuilder()
        .setName("createpoll")
        .setDescription("Creates poll")
        .addStringOption(option => option
            .setName("title")
            .setDescription("Title")
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName("description")
            .setDescription("Description")
            .setRequired(true)
        )
        .addNumberOption(option => option
            .setName("seconds")
            .setDescription("Seconds"
            ))
        .addNumberOption(option => option
            .setName("minutes")
            .setDescription("Minutes")
        )
        .addNumberOption(option => option
            .setName("hours")
            .setDescription("Hours")
        )
        .addNumberOption(option => option
            .setName("days")
            .setDescription("Days")
        ),
    execute: async (interaction: Interaction) => {
        if (interaction.isChatInputCommand() && interaction.isRepliable()) {
            const title = interaction.options.getString("title")
            const description = interaction.options.getString("description")
            const seconds = interaction.options.getNumber("seconds")
            const minutes = interaction.options.getNumber("minutes")
            const hours = interaction.options.getNumber("hours")
            const days = interaction.options.getNumber("days")
            let time = moment()

            if (seconds) time.add(seconds, "seconds")
            if (minutes) time.add(minutes, "minutes")
            if (hours) time.add(hours, "hours")
            if (days) time.add(days, "days")

            const channel = interaction.client.channels.resolve(config["channel"])

            if (channel?.isTextBased()) {
                const message = await channel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(title)
                            .setDescription(description)
                            .setColor(config["embed-color"])
                            .setFooter({text: `Ends at: ${time.format("YYYY-MM-DD HH:mm:ss")}`})
                            .setAuthor({name: interaction.user.tag, iconURL: interaction.user.avatarURL()})
                    ]
                })

                await message.react(config["yes-emoji"])
                await message.react(config["no-emoji"])

                addPoll({
                    title: title,
                    description: description,
                    messageId: message.id,
                    time: time.valueOf()
                })

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Poll created")
                            .setColor(config["embed-color"])
                            .setDescription(`[Go to poll message](${message.url})`)
                    ]
                })
            } else {
                throw Error(`Channel ${config["channel"]} not found`)
            }
        }
    }
}