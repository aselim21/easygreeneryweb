const { ObjectID } = require('bson');
const { MongoClient } = require('mongodb');
const { resourceLimits } = require('worker_threads');
const express = require('express');
const app = express();
app.use(express.json());
const MongodbURI = "mongodb+srv://green-server-admin:green1234@cluster0.c4akl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const client = new MongoClient(MongodbURI);

const plant_art1={
    "name":"cactus",
    "moisture_min":0,
    "moisture_max":200
}
const plant_art2={
    "name":"tomato",
    "moisture_min":300,
    "moisture_max":900
}
const plant_art3={
    "name":"lily",
    "moisture_min":1000,
    "moisture_max":2000
}

async function main(){
    await communicateWithDB(plant_art1).catch(console.error);
    await communicateWithDB(plant_art2).catch(console.error);
    await communicateWithDB(plant_art3).catch(console.error);
}

main();

async function communicateWithDB(data) {
    try {
        await client.connect();
        await createRow(data);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
async function createRow(data) {

    try {
        const result = await client.db("easygreenery_plants").collection("plant_arts").insertOne(data);
        console.log(`Inserted new row in easygreenery_plant -> plants with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    }
}