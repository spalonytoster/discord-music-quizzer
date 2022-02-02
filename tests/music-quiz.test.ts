// const expect = require('chai').expect;
import {instance, mock, when} from "ts-mockito";
import {CommandoMessage} from "discord.js-commando";
import { MusicQuiz } from "../src/music-quiz";
import { QuizArgs } from "../src/types/quiz-args";
import {assert} from "chai";
import { GuildMember, VoiceChannel, VoiceState } from "discord.js";

describe('MusicQuiz module', () => {
    let channel: VoiceChannel = mock(VoiceChannel);
    let voice: VoiceState = mock(VoiceState);
    when(voice.channel).thenReturn(channel);
    let voiceInstance = instance(voice)
    let member: GuildMember = mock(GuildMember);
    when(member.voice).thenReturn(voiceInstance);
    let memberInstance = instance(member);
    let message: CommandoMessage = mock(CommandoMessage);
    when(message.member).thenReturn(memberInstance);
    let messageInstance = instance(message);

    let args: QuizArgs = mock<QuizArgs>();

    const sut: MusicQuiz = new MusicQuiz(messageInstance, args);

    context('Given a list with song names (spotify song names))', () => {
        const songList: string[] = [
            "death bed (coffee for your head) (feat. beabadoobee)",
            "Dragostea Din Tei - DJ Ross Radio Remix"
        ];

        it('Should return strings stripped to only contain song names', () => {
            const result = songList.map(name => sut.stripSongName(name));

            assert.equal(result[0], 'death bed');
            assert.equal(result[1], 'Dragostea Din Tei');
        });
    });
});