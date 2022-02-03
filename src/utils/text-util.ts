const diacritics = require('diacritics')

export default class TextUtil {

    /**
     * Will remove all excess from the song names
     * Examples:
     * death bed (coffee for your head) (feat. beabadoobee) -> death bed
     * Dragostea Din Tei - DJ Ross Radio Remix -> Dragostea Din Tei
     *
     * @param name string
     */
    static stripSongName(name: string): string {
        return name.replace(/ \(.*\)/g, '')
            .replace(/ - .*$/, '')
    }

    static replaceInterpunction(name: string): string {
        return name.replace(/'/, '')
            .replace(/./, '')
            .replace(/,/, '');
    }

    static replaceDiacritics(song: string) {
        return diacritics.remove(song);
    }
}