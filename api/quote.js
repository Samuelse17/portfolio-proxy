// Vercel serverless function – proxies Yahoo Finance, adds CORS headers
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { ticker } = req.query;
  if (!ticker) { res.status(400).json({ error: 'ticker required' }); return; }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d&includePrePost=false`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com'
      }
    });
    if (!r.ok) throw new Error('YF HTTP ' + r.status);
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error('no price');

    const price     = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose || price;
    const change    = price - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    res.status(200).json({ price, change, changePct, prevClose, ticker });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
