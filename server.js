
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.all("/api/roblox", async (req, res) => {
  try {
    const target = req.query.url;

    if (!target) {
      return res.status(400).json({ error: "缺少 Roblox API 網址" });
    }

    const url = new URL(target);

    const allowedHosts = [
      "users.roblox.com",
      "friends.roblox.com",
      "thumbnails.roblox.com"
    ];

    if (
      url.protocol !== "https:" ||
      !allowedHosts.includes(url.hostname)
    ) {
      return res.status(403).json({ error: "不允許的 API 網址" });
    }

    const options = {
      method: req.method === "POST" ? "POST" : "GET",
      headers: {
        Accept: "application/json"
      }
    };

    if (req.method === "POST") {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const text = await response.text();

    res.status(response.status);
    res.set("Content-Type", "application/json; charset=utf-8");

    try {
      JSON.parse(text);
      res.send(text);
    } catch {
      res.json({
        error: "Roblox API 回傳的不是 JSON",
        status: response.status,
        details: text.slice(0, 300)
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "代理伺服器錯誤",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`網站已啟動：http://localhost:${PORT}`);
});
