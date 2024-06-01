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
          
        For example, if the object is a Golden Retriever, you should output the following text:
        {"description":"Golden Retriever, a loyal and friendly canine species, known for its intelligence and adaptability. Weighing between 10-20 kg and standing 50-60 cm tall, this dog is a perfect companion for families. With a balanced attack and defense, and a moderate speed, Golden Retrievers excel in tasks that require endurance and strength. Their golden coat and gentle demeanor make them easily recognizable and beloved by many.","object": "Golden Retriever", "species": "Dog", "approximateWeight": "10-20 kg", "approximateHeight": "50-60 cm", "hp": 50, "attack": 40, "defense": 40, "speed": 19, "type": "normal"}.

        Another example for a  {"description":"The Magpie, a sleek and intelligent avian species, renowned for its striking black and white plumage and its melodious calls. Weighing between 130 - 270 grams and standing 37-43 cm tall, this bird possesses remarkable agility and speed, making it a master of the skies. With moderate HP and attack stats, coupled with a slightly lower defense, Magpies rely on their swift movements and sharp beaks to outmaneuver and peck at their prey. Often found in urban and rural environments alike, these birds are both admired for their beauty and feared for their mischievous behavior","object": "Magpie", "species": "Bird", "approximateWeight": "130 - 270 g", "approximateHeight": "37-43 cm", "hp": 25, "attack": 20, "defense": 10, "speed": 32, "type": "Flying"}
         
        If you are given an object that is not a living creature, plant or lifeform, such as a coffee cup, output the same fields but with type: "Inanimate". 

        If you are given a description of a person or human, output "species": "Human" and "name": "Person' and "type": "Normal". 
        
        If you are not sure what the attributes are for things like height or speed, it is okay to guess.
       
        `, {"inlineData":{"data":imageData, "mimeType":"image/*"}}];

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
