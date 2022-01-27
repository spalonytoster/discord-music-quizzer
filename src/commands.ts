import { MusicQuiz } from './music-quiz';
import { QuizArgs } from './types/quiz-args';
import { Command, CommandoClient, CommandoMessage } from "discord.js-commando"
import { Message } from "discord.js"

export class MusicQuizCommand extends Command {
    constructor(client: CommandoClient) {
        super(client, {
            name: 'jakatomelodia',
            memberName: 'music-quizzer',
            group: 'music',
            description: 'Jaka to melodiaaaaaaaaAAAAAA! TU TU! TYRYRYRY! TY TYRYRY RY!',
            guildOnly: true,
            throttling: {usages: 1, duration: 10},
            args: [
                {
                    key: 'playlist',
                    prompt: 'Dej id playlisty na spotify',
                    type: 'string',
                    default: '4AZqmvSu69hCY9wAVV1Zp2'
                },
                {
                    key: 'songs',
                    prompt: 'Ile chcesz piosen?',
                    type: 'string',
                    default: 10
                }
                ,{
                    key: 'only',
                    prompt: 'Only this answer is required; artist, title or both',
                    type: 'string',
                    oneOf: ['artist', 'title', 'both'],
                    default: 'both'
                }
            ]
        })
    }

    async run(message: CommandoMessage, args: QuizArgs, fromPattern: boolean): Promise<Message | Message[]> {
        if (message.guild.quiz) {
            return message.say('Pajacu już na wizji jesteśmy')
        }

        if (message.member.voice.channel === null) {
            return message.say('Ale wejdź najpierw na voice channel daunie')
        }

        message.guild.quiz = new MusicQuiz(message, args)

        try {
            await message.guild.quiz.start()
        } catch (e) {
            console.log("Process ded");
        }
    }
}
