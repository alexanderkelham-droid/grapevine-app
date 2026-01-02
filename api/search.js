export default async function handler(req, res) {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=20`);
        const data = await response.json();

        // Add CORS headers just in case
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
