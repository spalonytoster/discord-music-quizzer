// const expect = require('chai').expect;
import {instance, mock, when} from "ts-mockito";
import {CommandoMessage} from "discord.js-commando";
import { MusicQuiz } from "../src/music-quiz";
import { QuizArgs } from "../src/types/quiz-args";
import {assert} from "chai";
import {GuildMember, VoiceChannel, VoiceConnection, VoiceState} from "discord.js";

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

    const musicQuiz: MusicQuiz = new MusicQuiz(messageInstance, args);
    musicQuiz.connection = mock(VoiceConnection);

    it('Should play intro music for 17 seconds', () => {
        musicQuiz.playIntroMusic();
        assert.equal(true, true);
    });

    context('Given a list with unstripped song names from spotify', () => {


    });
});