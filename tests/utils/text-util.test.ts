import {instance, mock, when} from "ts-mockito";
import {assert} from "chai";
import TextUtil from "../../src/utils/text-util";

describe('TextUtil module', () => {
    context('Given a list with unstripped song names from spotify', () => {
        const songList: string[] = [
            "death bed (coffee for your head) (feat. beabadoobee)",
            "Dragostea Din Tei - DJ Ross Radio Remix"
        ];

        it('Should have strings stripped to only contain song names', () => {
            const result = songList.map(name => TextUtil.stripSongName(name));

            assert.equal(result[0], 'death bed');
            assert.equal(result[1], 'Dragostea Din Tei');
        });
    });

    context('Given a song name with polish diacritics', () => {
        const songName: string = "zażółć gęślą jaźń";

        it('Should preprocess song names to not contain diacritics', () => {
            const result = TextUtil.replaceDiacritics(songName);

            assert.equal(result, 'zazolc gesla jazn');
        });
    });
});