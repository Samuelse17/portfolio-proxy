// Vercel serverless function – proxies Yahoo Finance, adds CORS headers
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { ticker } = req.query;
  if (!ticker) { res.status(400).json({ error: 'ticker required' }); return; }

  try {
    // Use v7 quote API which gives regularMarketChangePercent directly
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com'
      }
    });
    if (!r.ok) throw new Error('YF HTTP ' + r.status);
    const data = await r.json();
    const q = data?.quoteResponse?.result?.[0];
    if (!q || !q.regularMarketPrice) throw new Error('no data for ' + ticker);

    res.status(200).json({
      price:      q.regularMarketPrice,
      change:     q.regularMarketChange,
      changePct:  q.regularMarketChangePercent,   // official exchange value
      prevClose:  q.regularMarketPreviousClose,
      ticker
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
