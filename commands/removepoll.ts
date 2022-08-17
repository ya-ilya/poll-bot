import {Interaction, SlashCommandBuilder} from "discord.js";
import {getPolls, removePoll} from "../index";
import config from "../config.json";

export default {
    data: new SlashCommandBuilder()
        .setName("removepoll")
        .setDescription("Removes poll")
        .addStringOption(option => option
            .setName("id")
            .setDescription("Poll Message Id")
            .setRequired(true)
        ),
    execute: async (interaction: Interaction) => {
        if (interaction.isChatInputCommand() && interaction.isRepliable()) {
            const poll = getPolls().find(it => it.messageId == interaction.options.getString("id"))

            if (!poll) {
                return await interaction.reply("Poll not found")
            }

            removePoll(poll.messageId)

            const channel = interaction.client.channels.resolve(config["channel"])

            if (channel?.isTextBased()) {
                channel.messages.delete(poll.messageId)
            } else {
                throw Error(`Channel ${config["channel"]} not found`)
            }

            await interaction.reply("Poll deleted")
        }
    }
}