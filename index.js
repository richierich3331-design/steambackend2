const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require("express");
const app = express();

app.use(express.json());

function extractMarketHashName(steamUrl) {
  const parts = steamUrl.split("/market/listings/730/");
  if (parts.length < 2) return null;
  return decodeURIComponent(parts[1]);
}

const items = require("./Data/items.json");

const imageMap = {};
items.forEach(i => {
  imageMap[i.market_hash_name] = i.image_url;
});

/* POST endpoint (kept, optional) */
app.get("/validate-item", async (req, res) => {
  const steam_url = req.query.steam_url;
  if (!steam_url) return res.status(400).json({ error: "missing steam_url" });

  const market_hash_name = extractMarketHashName(steam_url);
  if (!market_hash_name) return res.status(400).json({ error: "invalid steam url" });

  try {
    const steamApiUrl = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(market_hash_name)}`;

    const response = await fetch(steamApiUrl);
    const data = await response.json();
console.log("Steam response:", data);

    res.json({
      res.json({
  market_hash_name,
  image_url: imageMap[market_hash_name] || null,
  price: data.lowest_price || data.median_price || null,
  steam_raw: data
});
    

  } catch (err) {
    res.status(500).json({ error: "steam fetch failed" });
  }
});/* IMAGE REDIRECT ENDPOINT (NO API CONNECTOR NEEDED) */
app.get("/item-image", (req, res) => {
  const steam_url = req.query.steam_url;
  if (!steam_url) return res.status(400).send("missing steam_url");

  const market_hash_name = extractMarketHashName(steam_url);
  if (!market_hash_name) return res.status(400).send("invalid steam url");

  const image_url = imageMap[market_hash_name];
  if (!image_url) return res.status(404).send("image not found");

  res.redirect(image_url);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
