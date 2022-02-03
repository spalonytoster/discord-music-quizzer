import { MessageCollector, VoiceChannel, TextChannel, Guild, DMChannel, VoiceConnection, StreamDispatcher, NewsChannel } from 'discord.js';
import ytdl from 'ytdl-core-discord'
import { QuizArgs } from 'quiz-args'
import { CommandoMessage } from 'discord.js-commando'
import Spotify from './spotify'
import Youtube from 'scrape-youtube'
import { Song } from 'song'
import internal from 'stream'
import TextUtil from "./utils/text-util";
const shuffle = require('shuffle-array')

const timeToGuess = 45;
const stopCommand = '!stop'
const skipCommand = '!skip'

export class MusicQuiz {
    guild: Guild
    textChannel: TextChannel | DMChannel | NewsChannel
    voiceChannel: VoiceChannel
    messageCollector: MessageCollector
    arguments: QuizArgs
    songs: Song[]
    currentSong: number = 0
    skippers: string[] = []
    connection: VoiceConnection
    scores: {[key: string]: number}
    artistGuessed: boolean
    titleGuessed: boolean
    musicStream: internal.Readable
    voiceStream: StreamDispatcher
    songTimeout: NodeJS.Timeout
    reactPermissionNotified: boolean = false

    constructor(message: CommandoMessage, args: QuizArgs) {
        this.guild = message.guild
        this.textChannel = message.channel
        this.voiceChannel = message.member.voice.channel
        this.arguments = args
    }

    async start() {
        await this.getSongList();

        if (!this.songs || this.songs.length === 0) {
            await this.textChannel.send('Coś jest nie teges z Twoją playlistą mordo')
            await this.finish()
            return
        }

        try {
            this.connection = await this.voiceChannel.join()
        } catch (e) {
            console.error('Error while trying to join channel and play intro', e)
            await this.textChannel.send('Nie moge na kanał wbić :/')
            await this.finish()
            return
        }

        this.currentSong = 0
        this.scores = {}

        await this.sendRulesMessageToChannel();
        await this.playIntroMusic();
        await this.startPlaying()
        this.setupMessageReactions();
    }

    private setupMessageReactions() {
        this.messageCollector = this.textChannel
            .createMessageCollector((message: CommandoMessage) => !message.author.bot)
            .on('collect', message => this.handleMessage(message))
    }

    private async getSongList() {
        this.songs = await this.getSongs(
            this.arguments.playlist,
            parseInt(this.arguments.songs, 10)
        )
    }

    private async sendRulesMessageToChannel() {
        await this.textChannel.send(`
            **JAKA TO MELODIAAAAAAA**! :headphones: :tada:
            **${this.songs.length}** pioseneczek zostało wytypowanych do dzisiejszej rozgrywki.
            Macie pół minuty by zgadnąć każdą.

            ${this.pointText()}

            Wpisz \`${stopCommand}\` by zagłosować za ominięciem piosen.
            Wpisz \`${skipCommand}\` żeby zdjąć program z anteny.

            - ZACZYNAMY :microphone:
        `.replace(/  +/g, ''))
    }

    async playIntroMusic() {
        const introYoutubeUrl = 'https://youtube.com/watch?v=Oeaqmn9ZKJo';

        try {
            const songStream = await ytdl(introYoutubeUrl);
            this.connection.play(songStream, {type: 'opus', volume: .5})
            await new Promise(r => setTimeout(r, 17000));
        } catch (e) {
            console.error('Error while trying to play intro from url: ', introYoutubeUrl)
        }
    }

    async startPlaying() {
        this.titleGuessed = false
        this.artistGuessed = false
        if (this.arguments.only.toLowerCase() === 'artist') {
            this.titleGuessed = true
        } else if (this.arguments.only.toLowerCase() === 'title') {
            this.artistGuessed = true
        }

        const song = this.songs[this.currentSong]
        const link = await this.findSong(song)
        if (!link) {
            await this.nextSong('Ups. Nie udało się znaleźć tej piosen na jutubie :( Biorę kolejną')
            return
        }

        try {
            this.musicStream = await ytdl(link)
        } catch (err) {
            await this.nextSong('Jutub się obraził i nie mogę zapuścić songa grrrr')
            console.error(err);
            return
        }

        this.songTimeout = setTimeout(() => {
            this.nextSong('Lamusy nikt nie zgadł XD')
        }, 1000 * timeToGuess);

        try {
            this.voiceStream = this.connection.play(this.musicStream, { type: 'opus', volume: .5 })

            this.voiceStream.on('error', (err: Error) => {
                this.textChannel.send('Coś się skurwiło, spróbuj jeszcze raz :x')
                    console.error(err)
                    this.finish()
                })
                
            this.voiceStream.on('finish', () => this.finish())
        } catch (e) {
            console.error(e);
            await this.textChannel.send('Coś się skurwiło, spróbuj jeszcze raz :x')
            await this.finish()
        }
    }

    async handleMessage(message: CommandoMessage) {
        const content = message.content.toLowerCase()
        if (content === stopCommand) {
            await this.printStatus('Koniec!')
            await this.finish()
            return
        }

        if (content === skipCommand) {
            await this.handleSkip(message.author.id)
            return
        }

        const song = this.songs[this.currentSong]
        let score = this.scores[message.author.id] || 0
        let correct = false

        if (!this.titleGuessed && content.includes(song.title.toLowerCase())) {
            score = score + 2
            this.titleGuessed = true
            correct = true
            await this.reactToMessage(message, '☑')
        }

        if (!this.artistGuessed && content.includes(song.artist.toLowerCase())) {
            score = score + 3
            this.artistGuessed = true
            correct = true
            await this.reactToMessage(message, '☑')
        }
        this.scores[message.author.id] = score

        if (this.titleGuessed && this.artistGuessed) {
            await this.nextSong('Brawko!')
        }

        if (!correct) {
            await this.reactToMessage(message, '❌')
        }
    }

    async handleSkip(userID: string) {
        if (this.skippers.includes(userID)) {
            return
        }

        this.skippers.push(userID)

        const members = this.voiceChannel.members
            .filter(member => !member.user.bot)
        if (this.skippers.length === members.size) {
            await this.nextSong('Chujowa piosenka, zgadzam się.')
            return
        }

        await this.textChannel.send(`**(${this.skippers.length}/${members.size})** do ominięcia piosenki`)
    }

    async finish() {
        if (this.songTimeout) clearTimeout(this.songTimeout)
        if (this.messageCollector) this.messageCollector.stop()
        if (this.voiceStream) this.voiceStream.destroy()
        if (this.musicStream) this.musicStream.destroy()

        if (this.guild.quiz) this.guild.quiz = null
        this.voiceChannel.leave()
    }

    async nextSong(status: string) {
        if (this.songTimeout) clearTimeout(this.songTimeout)
        await this.printStatus(status)

        if (this.currentSong + 1 === this.songs.length) {
            return this.finish()
        }

        this.currentSong++
        this.skippers = []
        if (this.musicStream) this.musicStream.destroy()
        if (this.voiceStream) this.voiceStream.destroy()
        await this.startPlaying()
    }

    async printStatus(message: string) {
        const song = this.songs[this.currentSong]
        await this.textChannel.send(`
            **(${this.currentSong + 1}/${this.songs.length})** ${message}
            > **${song.title}** by **${song.artist}**
            > Link: || ${song.link} ||

            **__WYNIKI__**
            ${this.getScores()}
        `.replace(/  +/g, ''))
    }

    getScores(): string {
        return this.voiceChannel.members
            .filter(member => !member.user.bot)
            .array()
            .sort((first, second) => (this.scores[first.id] || 0) < (this.scores[second.id] || 0) ? 1 : -1)
            .map((member, index) => {
                let position = `**${index + 1}.** `
                if (index === 0) {
                    position = ':first_place:'
                } else if (index === 1) {
                    position = ':second_place:'
                } else if (index === 2) {
                    position = ':third_place:'
                }

                return `${position} <@!${member.id}> ${this.scores[member.id] || 0} pktów`
            })
            .join('\n')
    }

    async reactToMessage(message: CommandoMessage, emoji: string) {
        try {
            await message.react(emoji)
        } catch (e) {
            if (this.reactPermissionNotified) {
                return
            }

            this.reactPermissionNotified = true
            await this.textChannel.send(`
                Nie mam mocy.
                Popraw permissiony dodając mnie ponownie do serwera.
                https://discordapp.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=3147840
            `.replace(/  +/g, ''))
        }
    }

    async getSongs(playlist: string, amount: number): Promise<Song[]> {
        const spotify = new Spotify()
        await spotify.authorize()
        if (playlist.includes('spotify.com/playlist')) {
            playlist = playlist.match(/playlist\/([^?]+)/)[1] || playlist
        }

        try {
            const spotifySongs: SpotifyApi.TrackObjectFull[] = shuffle((await spotify.getPlaylist(playlist)));
            // console.log('whole playlist:');
            // console.log(spotifySongs.map(song => song.name));

            const songlist: Song[] = spotifySongs
                .sort(() => Math.random() > 0.5 ? 1 : -1)
                .filter((song: SpotifyApi.TrackObjectFull, index: any) => index < amount)
                .map((song: SpotifyApi.TrackObjectFull) => ({
                    link: `https://open.spotify.com/track/${song.id}`,
                    previewUrl: song.preview_url,
                    title: TextUtil.stripSongName(song.name),
                    artist: (song.artists[0] || {}).name
                }));

            console.log(songlist.map(song => `${song.artist} - ${song.title}`));
                
            return songlist;

        } catch (err) {
            await this.textChannel.send('Nie mogę ogarnąć tej playlisty. Upewnij się, że to id ze spotify i playlista jest publiczna.')
            console.error(err);
            
            return null
        }
    }

    async findSong(song: Song): Promise<string> {
        try {
            console.log(`searching youtube: '${song.title} ${song.artist}'`);
            const ytSearchResult = await Youtube.searchOne(`${song.title} ${song.artist}`)
            return ytSearchResult?.link ?? null
        } catch (e) {
            await this.textChannel.send('Problem podczas streamowania muzyczki z jutuba')
            await this.finish()
            throw e
        }
    }

    pointText(): string {
        if (this.arguments.only === 'artist') {
            return 'Zgadnij nazwę wykonawcy. Jak zgadniesz to dostajesz **3 pkty**.'
        }

        if (this.arguments.only === 'title') {
            return 'Zgadnij tytuł piosenki. Jak zgadniesz to dostajesz **2 pkty**.'
        }

        return `
            Zgadnij tytuł i wykonawcę. Pkty przyznawane są następująco:
            > Wykonawca - **3 pkty**
            > Tytuł - **2 pkty**
            > Wykonawca + tytuł - **5 pktów**
        `.replace(/  +/g, '')
    }
}
