import SpotifyApi from 'spotify-web-api-node'

export default class Spotify {
    client = new SpotifyApi({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    })

    async authorize() {
        const response = await this.client.clientCredentialsGrant()

        this.client.setAccessToken(response.body.access_token)

    }

    async getPlaylist(id: string) {
        const totalSongs: Number = await (await this.client.getPlaylistTracks(id, { fields: 'total' })).body.total
        console.log(`totalSongs: ${totalSongs}`)

        let result: SpotifyApi.PlaylistTrackObject[] = [];
        if (totalSongs <= 100) {
            result = (await this.client.getPlaylistTracks(id)).body.items
        } else {
            for (let i = 0; i < totalSongs; i+=100) {
                console.log(`retrieving 100 songs starting from index: ${i}`);
                
                result = result.concat((await this.client.getPlaylistTracks(id, { offset: i })).body.items)
            }
        }

        // result.map(({ track }) => track.name).forEach(el => console.log(el))
        
        return result.map(({ track }) => track)
    }
}
