require("dotenv").config();
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require("fs")
const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
app.use(express.json({ limit: '100mb' }))
app.use(express.static(path.join(__dirname, 'public')));
app.post('/pokedexit', async (req, res) => {
    let { imageData } = req.body
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = [`You are a Pokedex designed to output text. 
        Given an image you should output the follwoing text:
        {"description","object", "species", "approximateWeight", "approximateHeight", "hp", "attack", "defense", "speed", "type"}. 
          
        For example, if the object is a Cat, you should output the following text:
        {"description":"The domestic cat, a beloved feline companion known for its independent nature and playful antics. Weighing between 4-5 kg and standing approximately 23-25 cm tall, this furry friend brings joy to households worldwide. With sharp claws for attack and agility for defense, cats are predators by nature. Their speed and agility make them excellent hunters, while their purrs and cuddles provide comfort and companionship.","object": "Cat", "species": "Cat", "approximateWeight": "4-5 kg", "approximateHeight": "23-25 cm", "hp": 30, "attack": 35, "defense": 20, "speed": 40, "type": "normal"}.

        Another example for a  {
            "description": "The rose plant, a symbol of beauty and love, known for its fragrant blooms and thorny stems. Typically reaching a height of 1-2 meters, this elegant plant adds charm to gardens worldwide. With sharp thorns for protection and vibrant petals to attract pollinators, roses are both resilient and enchanting. Their robust structure and stunning appearance make them a favorite among gardeners, while their fragrance and color provide aesthetic and sensory pleasure.",
            "object": "Rose Plant",
            "species": "Rosa",
            "approximateWeight": "2-3 kg",
            "approximateHeight": "1-2 meters",
            "hp": 25,
            "attack": 15,
            "defense": 30,
            "speed": 0,
            "type": "plant"
          }
          
         
        If you are given an object that is not a living creature, plant or lifeform, such as a rock, output the same fields but with type: "Inanimate". 

        If you are given a description of a person or human, output "species": "Human" and "name": "Person' and "type": "Normal". 
        
        If you are not sure what the attributes are for things like height or speed, it is okay to guess.
       
        `, { "inlineData": { "data": imageData, "mimeType": "image/*" } }];

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonString = text.replace(/^```json\s*|```$/g, '')
        res.json(JSON.parse(jsonString));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Sorry, request can't be processed at the moment." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
