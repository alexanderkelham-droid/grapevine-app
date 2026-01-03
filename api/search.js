export default async function handler(req, res) {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
        // Handle SoundCloud URLs
        if (q.includes('soundcloud.com/') || q.includes('on.soundcloud.com/')) {
            const scRes = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(q)}&format=json`);
            if (scRes.ok) {
                const scData = await scRes.json();
                // Standardize the response format for the client
                return res.status(200).json({
                    results: [{
                        soundcloud_data: true,
                        trackId: `sc-${Date.now()}`,
                        trackName: scData.title,
                        artistName: scData.author_name || 'SoundCloud Artist',
                        artworkUrl100: scData.thumbnail_url || '',
                        soundcloudUrl: q
                    }]
                });
            }
        }

        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=20`);
        const data = await response.json();

        // Add CORS headers just in case
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error) {
        console.error("API Search Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
