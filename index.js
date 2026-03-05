const express = require("express");
const fetch = require("node-fetch");
const app = express();

app.use(express.json());

function extractMarketHashName(steamUrl) {
  const parts = steamUrl.split("/market/listings/730/");
  if (parts.length < 2) return null;
  return decodeURIComponent(parts[1]);
}

/* REMOVE ANY WEAR FROM SKIN NAME */
function normalizeSkinName(name) {
  return name.replace(/\s*\([^)]*\)/, "").trim().toLowerCase();
}

const items = require("./Data/items.json");

/* BUILD IMAGE LOOKUP MAP */
const imageMap = {};
items.forEach(function (i) {
  if (i.market_hash_name && i.image_url) {
    const key = normalizeSkinName(i.market_hash_name);
    imageMap[key] = i.image_url;
  }
});

/* VALIDATE ITEM */
app.get("/validate-item", async function (req, res) {
  const steam_url = req.query.steam_url;
  if (!steam_url) return res.status(400).json({ error: "missing steam_url" });

  const market_hash_name = extractMarketHashName(steam_url);
  if (!market_hash_name)
    return res.status(400).json({ error: "invalid steam url" });

  const key = normalizeSkinName(market_hash_name);

  try {
    const steamApiUrl =
      "https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=" +
      encodeURIComponent(market_hash_name);

    const response = await fetch(steamApiUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const data = await response.json();

    res.json({
      market_hash_name: market_hash_name,
      image_url: imageMap[key] || null,
      price: data.lowest_price || data.median_price || null,
    });
  } catch (err) {
    console.log("STEAM ERROR:", err);
    res.status(500).json({ error: "steam fetch failed" });
  }
});

/* IMAGE REDIRECT */
app.get("/item-image", function (req, res) {
  const steam_url = req.query.steam_url;
  if (!steam_url) return res.status(400).send("missing steam_url");

  const market_hash_name = extractMarketHashName(steam_url);
  if (!market_hash_name)
    return res.status(400).send("invalid steam url");

  const key = normalizeSkinName(market_hash_name);
  const image_url = imageMap[key];

  if (!image_url) return res.status(404).send("image not found");

  res.redirect(image_url);
});

app.listen(3000, function () {
  console.log("Server running on port 3000");
});
