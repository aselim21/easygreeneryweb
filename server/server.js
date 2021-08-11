const { ObjectID } = require('bson');
const { MongoClient } = require('mongodb');
const { resourceLimits } = require('worker_threads');
const express = require('express');
const mqtt = require('mqtt');
var path = require('path');
const app = express();
app.use(express.json());
app.use(express.static("src"));
const MongodbURI = "mongodb+srv://green-server-admin:green1234@cluster0.c4akl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
const mongoClient = new MongoClient(MongodbURI);
const water_me_collection = 'water_me';
const sensor_plant_data_collection = 'sensor_plant_data';
const save_plant_collection = 'save_plant';
maximumNumberOfResults = Number.MAX_SAFE_INTEGER;

let save_plant = {
    "plantNR": "1",
    "nickname": "Plant",
    "plant_art": "tomato",
    "moisture_min": 300,
    "moisture_max": 900
}
let plant_art = save_plant.plant_art;

//topics
const PubTopic_water_me = "water_me";
const SubTopic_water_me_result = "water_me_result";
const PubTopic_sensor_plant_data = "sensor_plant_data";
const SubTopic_sensor_plant_data_result = "sensor_plant_data_result";

const mqttOptions = {
    host: 'broker.hivemq.com',
    port: 1883,
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/history', (req, res) => {
    try {
        mongoClient.connect().then(()=>{
            findWaterMe_ByPlant_art(plant_art).then((results)=>{
                console.log('sent history:');
                let data = {"water_me_results": results} 
                res.send(data);
                mongoClient.close();
            });
        });
    } catch (e) {
        console.error(e);
    } 
});

app.get('/home', (req,res)=>{
    res.sendFile(path.join(__dirname, '../src', 'index.html'));
})
app.get('/my_garden', (req,res)=>{
    res.sendFile(path.join(__dirname, '../src', 'my_garden.html'));
})

app.post('/sensor_plant_data', (req, res) => {
    const data = req.body.sensor_plant_data;
    mqttPublish(PubTopic_sensor_plant_data, data, mqttClient);
});

app.post('/save_plant', (req, res) => {

    let moisture_min;
    let moisture_max;
    if (req.body.plant_art == "cactus") {
        moisture_min = 0;
        moisture_max = 300;
    }
    if (req.body.plant_art == "tomato") {
        moisture_min = 300;
        moisture_max = 100;
    }
    if (req.body.plant_art == "lily") {
        moisture_min = 1000;
        moisture_max = 2000;
    }
    const data = {
        "plantNR": "1",
        "nickname": req.body.nickname,
        "plant_art": req.body.plant_art,
        "moisture_min": moisture_min,
        "moisture_max": moisture_max
    };
    createRowinDB(data, save_plant_collection).catch(console.error);
    save_plant = data;
    plant_art = req.body.plant_art;
});

app.post('/water_me', (req, res) => {
    const data = req.body.water_me;
    mqttPublish(PubTopic_water_me, data, mqttClient);
});

app.get('/nickname', (req, res) => {
    res.send(save_plant.nickname);
});

app.post('/plants', (req, res) => {
    createRowinDB(req.body, sensor_data_collection).catch(console.error);
});

//mqtt
const mqttClient = mqtt.connect(mqttOptions);
mqttClient.on('connect', function () { // Check you have a connection
    console.log("Connection with MQQT Broker is stable.");
    mqttClient.subscribe(SubTopic_water_me_result);
    mqttClient.subscribe(SubTopic_sensor_plant_data_result);

    mqttClient.on('message', function (topic, message, packet) {
        console.log("Message received.");
        console.log("Topic " + topic);
        console.log("Message ", message.toString());
        const timeNow = getCurrentTime();
        let data;
        let collection;

        if (topic.localeCompare(SubTopic_water_me_result) == 0) {
            data = {
                "plantNR": "1",
                'plant_art': plant_art,
                'date': timeNow,
                'info': message.toString()
            }
            collection = water_me_collection;

        } else if (topic.localeCompare(SubTopic_sensor_plant_data_result) == 0) {
            const sensor_index = message.toString().split(';');
            let info;
            if (sensor_index[0] <= save_plant.moisture_min) {
                info = "TOO DRY!";
            } else if (sensor_index[0] > save_plant.moisture_min && sensor_index[0] < save_plant.moisture_max) {
                info = "Normal";
            } else if (sensor_index[0] >= save_plant.moisture_max) {
                info = "TOO WET!";
            }
            data = {
                "plantNR": "1",
                'plant_art': plant_art,
                'date': timeNow,
                'moisture': sensor_index[0],
                'water_level': sensor_index[1],
                'info': info
            }
            collection = sensor_plant_data_collection;
        }
        createRowinDB(data, collection).catch(console.error);

    });
    mqttClient.on('offline', () => {
        mqttClient.end(true, () => {
            console.log("Reconnecting with MQTT Broker...");
            mqtt.connect(mqttOptions);
        });
    });
});

function getCurrentTime() {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 1;
    let day = now.getDate();
    let hour = now.getHours();
    let minute = now.getMinutes();
    let second = now.getSeconds();
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }
    if (second.toString().length == 1) {
        second = '0' + second;
    }
    const dateTime = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
    return dateTime;
}

function mqttPublish(topic, mqttMessage, mqttClient) {
    mqttClient.publish(topic, mqttMessage, function () {
        console.log("Message posted.");
        console.log(topic);
        console.log(mqttMessage);
    });
}

//db
async function createRowinDB(data, selected_collection) {
    try {
        await mongoClient.close();
        await mongoClient.connect();
        await createRow(data, selected_collection);
    } catch (e) {
        console.error(e);
    }
}

async function createRow(data, selected_collection) {

    try {
        const result = await mongoClient.db("easygreenery_plants").collection(selected_collection).insertOne(data);
        console.log(`Inserted new row in DB easygreenery_plants -> ${selected_collection} with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    }
}

async function findWaterMe_ByPlant_art(the_plant_art) {
    const cursor_water_me = await mongoClient.db("easygreenery_plants").collection("water_me").find({ plant_art: the_plant_art });;
    const results_water_me = await cursor_water_me.toArray();
    const cursor_sensor_plant_data = await mongoClient.db("easygreenery_plants").collection("sensor_plant_data").find({ plant_art: the_plant_art });;
    const results_sensor_plant_data = await cursor_sensor_plant_data.toArray();
    const results = results_water_me.concat(results_sensor_plant_data);
    results.sort(function(a,b){
        return new Date(b.date) - new Date(a.date);
      });
    if (results.length > 0) {
        console.log(`Found a listing in the collection with the plant_art '${the_plant_art}':`);
        return results;
    } else {
        console.log(`No listings found with the plant_art '${the_plant_art}'`);
        return 0;
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));