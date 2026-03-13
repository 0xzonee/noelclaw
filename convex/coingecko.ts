"use node";

import { action } from "./_generated/server";

export const getTrendingAI = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.COINGECKO_API_KEY;

    const keyParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    // Fetch trending coins
    const trendRes = await fetch(`https://api.coingecko.com/api/v3/search/trending?${keyParam}`, { headers });
    if (!trendRes.ok) throw new Error(`CoinGecko trending error: ${trendRes.status}`);
    const trendData = await trendRes.json();

    const trendingCoins = (trendData.coins || []).slice(0, 7).map((item: any) => ({
      id: item.item.id,
      name: item.item.name,
      symbol: item.item.symbol,
      thumb: item.item.thumb,
      marketCapRank: item.item.market_cap_rank,
      priceChange24h: item.item.data?.price_change_percentage_24h?.usd ?? null,
      price: item.item.data?.price ?? null,
      sparkline: item.item.data?.sparkline ?? null,
    }));

    // Fetch AI-related tokens by category
    const aiRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=artificial-intelligence&order=market_cap_desc&per_page=12&page=1&sparkline=false&price_change_percentage=24h${keyParam}`,
      { headers }
    );
    if (!aiRes.ok) throw new Error(`CoinGecko AI markets error: ${aiRes.status}`);
    const aiData = await aiRes.json();

    const aiTokens = aiData.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      price: coin.current_price,
      marketCap: coin.market_cap,
      priceChange24h: coin.price_change_percentage_24h,
      volume24h: coin.total_volume,
      rank: coin.market_cap_rank,
    }));

    return {
      success: true,
      trending: trendingCoins,
      aiTokens,
      fetchedAt: Date.now(),
    };
  },
});

export const getTokenMarket = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.COINGECKO_API_KEY;
    const keyParam = apiKey ? `&x_cg_demo_api_key=${apiKey}` : "";
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    // Global market data
    const globalRes = await fetch(`https://api.coingecko.com/api/v3/global?${keyParam}`, { headers });
    if (!globalRes.ok) throw new Error(`CoinGecko global error: ${globalRes.status}`);
    const globalData = await globalRes.json();
    const g = globalData.data;

    return {
      success: true,
      totalMarketCap: g.total_market_cap?.usd ?? null,
      totalVolume: g.total_volume?.usd ?? null,
      btcDominance: g.market_cap_percentage?.btc ?? null,
      ethDominance: g.market_cap_percentage?.eth ?? null,
      marketCapChange24h: g.market_cap_change_percentage_24h_usd ?? null,
      activeCryptocurrencies: g.active_cryptocurrencies ?? null,
      fetchedAt: Date.now(),
    };
  },
});