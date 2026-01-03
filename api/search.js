export default async function handler(req, res) {
    // Add CORS headers to allow requests from localhost during development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
        // Handle SoundCloud URLs
        if (q.includes('soundcloud.com/') || q.includes('on.soundcloud.com/')) {
            console.log('Processing SoundCloud URL:', q);
            
            const scRes = await fetch(`https://soundcloud.com/oembed?url=${encodeURIComponent(q)}&format=json`);
            if (scRes.ok) {
                const scData = await scRes.json();
                
                // Extract the full URL from the oEmbed response
                // The oEmbed returns an iframe HTML with the full URL
                let fullUrl = q;
                if (scData.html && q.includes('on.soundcloud.com/')) {
                    // Extract URL from iframe src like: src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/..."
                    const match = scData.html.match(/url=([^&"]+)/);
                    if (match) {
                        fullUrl = decodeURIComponent(match[1]);
                        console.log('Extracted full URL from oEmbed:', fullUrl);
                    }
                }
                
                // Standardize the response format for the client
                const result = {
                    results: [{
                        soundcloud_data: true,
                        trackId: `sc-${Date.now()}`,
                        trackName: scData.title,
                        artistName: scData.author_name || 'SoundCloud Artist',
                        artworkUrl100: scData.thumbnail_url || '',
                        soundcloudUrl: fullUrl // Use the extracted full URL
                    }]
                };
                console.log('Returning SoundCloud result:', JSON.stringify(result, null, 2));
                return res.status(200).json(result);
            }
        }

        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=20`);
        const data = await response.json();

        // CORS headers already set at the top
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error) {
        console.error("API Search Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
