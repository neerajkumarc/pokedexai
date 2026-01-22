require("dotenv").config();
const express = require("express");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "100mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.post("/pokedexit", async (req, res) => {
  let { imageData } = req.body;
  try {
    // imageData is expected to be a data URL (data:image/...;base64,...)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const dataUrl =
      imageData && imageData.startsWith("data:")
        ? imageData
        : `data:image/jpeg;base64,${base64Data}`;

    // System prompt for consistent JSON output
    const systemPrompt = `You are a Pokedex designed to output JSON. Given an image you should output the following JSON object exactly (no extra text): {"description","object", "species", "approximateWeight", "approximateHeight", "hp", "attack", "defense", "speed", "type"}. Use reasonable guesses where necessary. If the object is not a living thing, set "type":"Inanimate".`;

    const body = {
      model: "openai",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image and return only a single JSON object (or a ```json``` block) containing the fields requested.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 1000,
    };

    const resp = await fetch(
      "https://gen.pollinations.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Pollinations error:", resp.status, errText);
      return res.status(500).json({ error: "Vision API request failed" });
    }

    const data = await resp.json();

    // Extract text from common response shapes
    let text = "";
    if (data.choices && data.choices[0]) {
      const message = data.choices[0].message;
      if (message) {
        if (Array.isArray(message.content)) {
          const textPart = message.content.find(
            (c) => c.type === "text" && c.text,
          );
          text = textPart ? textPart.text : "";
        } else if (typeof message.content === "string") {
          text = message.content;
        }
      }
    } else if (data.output && Array.isArray(data.output)) {
      // fallback for other shapes
      const out = data.output[0];
      if (out && out.content) {
        text = out.content.map((c) => c.text || c).join("\n");
      }
    } else {
      text = JSON.stringify(data);
    }

    const jsonString = (text || "").replace(/^```json\s*|```$/g, "").trim();
    try {
      const parsed = JSON.parse(jsonString);
      res.json(parsed);
    } catch (parseErr) {
      console.error("JSON parse error, returning raw text:", parseErr);
      res
        .status(500)
        .json({ error: "Could not parse model output as JSON", raw: text });
    }
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "Sorry, request can't be processed at the moment." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
