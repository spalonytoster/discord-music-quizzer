// const expect = require('chai').expect;
import {mock} from "ts-mockito";
import {CommandoMessage} from "discord.js-commando";
import { MusicQuiz } from "../src/music-quiz";
import { QuizArgs } from "../src/types/quiz-args";
import {assert} from "chai";

describe('MusicQuiz module', () => {
    const sut: MusicQuiz = new MusicQuiz(mock(CommandoMessage), mock<QuizArgs>());

    context('Given a list with song names (youtube video names))', () => {
        const songList: string[] = [
            "death bed (coffee for your head) (feat. beabadoobee)",
            "Dragostea Din Tei - DJ Ross Radio Remix"
        ];

        it('Should return strings stripped to only contain song names', () => {
            const result = songList.map(name => sut.stripSongName(name));

            assert(false, 'dupa');
        });
    });
});