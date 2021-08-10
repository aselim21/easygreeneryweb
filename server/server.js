const { ObjectID } = require('bson');
const { MongoClient } = require('mongodb');
const { resourceLimits } = require('worker_threads');
const express = require('express');
const mqtt = require('mqtt');
const app = express();
app.use(express.json());
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


app.get('/history', (req, res) => {
    try {
        mongoClient.connect().then(()=>{
            findWaterMe_ByPlant_art(plant_art).then((results)=>{
                console.log('sent history:');
                let data = {"water_me_results": results} 
                console.log(data);
                res.send(data);
                mongoClient.close();
            });
        });
    } catch (e) {
        console.error(e);
    } 
});
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
    //findByPlantNR('1');
    save_plant = data;
    plant_art = req.body.plant_art;
    // console.log(plant_art);
});

app.post('/water_me', (req, res) => {

    const data = req.body.water_me;
    mqttPublish(PubTopic_water_me, data, mqttClient);
    //mqttSubscribe(SubTopic_water_me_result);

});
app.get('/nickname', (req, res) => {
    
    res.send(save_plant.nickname);
});


app.post('/plants', (req, res) => {
    console.log(req.body);

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
        // LOGIC DATENBANK
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
                info = "NORMAL";
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
    // const mqttClient = mqtt.connect(mqttUrl, mqttOptions);
    mqttClient.publish(topic, mqttMessage, function () {
        console.log("Message posted.");
        console.log(topic);
        console.log(mqttMessage);
        // Close the connection after publish
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
async function askDB() {
    try {
        await mongoClient.close();
        await mongoClient.connect();
        await findByPlantNR('1');
    } catch (e) {
        console.error(e);
    }
}



async function listDatabasess(mongoClient) {
    const databasesList = await mongoClient.db().admin().listDatabases();
    console.log("Databases:");

    databasesList.databases.forEach(db => {
        console.log(db.name);
    });
}

async function createRow(data, selected_collection) {

    try {
        const result = await mongoClient.db("easygreenery_plants").collection(selected_collection).insertOne(data);
        console.log(`Inserted new row in DB easygreenery_plants -> ${selected_collection} with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    }
}

async function findByNickname(the_nickname) {
    const cursor = await mongoClient.db("easygreenery_plants").collection("plants").find({ nickname: the_nickname });;
    const results = await cursor.toArray();
    if (results.length > 0) {
        console.log(`Found a listing in the collection with the nickname '${the_nickname}':`);
        // results.forEach((result) => {
        //     console.log(result);
        // });
        console.log(results[result.length])
        return results;
    } else {
        console.log(`No listings found with the nickname '${the_nickname}'`);
        return 0;
    }
}

async function findByPlantNR(the_plantNR) {
    const cursor = await mongoClient.db("easygreenery_plants").collection("save_plant").find({ plantNR: the_plantNR });;
    const results = await cursor.toArray();
    if (results.length > 0) {
        console.log(`Found a listing in the collection with the plantNR '${the_plantNR}':`);
        const result = results[results.length - 1];
        console.log(result);
        save_plant = result;
        plant_art = result.plant_art;
        console.log(plant_art);
        return result;
    } else {
        console.log(`No listings found with the plantNR '${the_plantNR}'`);
        return 0;
    }
}
async function findByPlantNR_One(the_plantNR) {
    const result = await mongoClient.db("easygreenery_plants").collection("save_plant").findOne({ plantNR: the_plantNR });
    if (result) {
        //     console.log(`Found a listing in the collection with the plantNR '${the_plantNR}':`);
        // results.forEach((result) => {
        //     console.log(result);
        // });
        console.log(result)

        return result;
    } else {
        console.log(`No listings found with the plantNR '${the_plantNR}'`);
        return 0;
    }
}

async function findById(mongoClient, the_id) {
    const result = await mongoClient.db("easygreenery_plants").collection("plants").findOne({ _id: ObjectID(`${the_id}`) });

    if (result) {
        console.log(`Found a listing in the collection with the id '${the_id}':`);
        console.log(result);
    } else {
        console.log(`No listings found with the id '${the_id}'`);
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

// function mqttSubscribe(topic) {
//     // const mqttClient = mqtt.connect(mqttUrl, mqttOptions);

//     mqttClient.on('connect', function () { // Check you have a connection
//         console.log("Connection with MQQT Broker is stable.");
//         mqttClient.subscribe(topic);
//         mqttClient.on('message', function (topic, message) {
//             console.log("Message received.");
//             console.log("Message:" + message);
//             console.log("Topic:" + topic);
//             mqttClient.end();
//         });

//         });
//     });
// }

// async function main(){

//     try {
//         await client.connect();
//         await listDatabasess(client);
//         // await createRow(client, {
//         //     nickname: "Markus",
//         //     name_plant: "Rose",
//         //     day_length: 0,
//         //     day_light_strength: "low",
//         //     wattering_frequency: "everyday",
//         //     wattering_amount: 1 
//         // });
//         await findByNickname(client, "Markus");
//         await findById(client,"60fd7ec35d665fa1a98e7a62" );
//     }catch(e) {
//         console.error(e);
//     } finally {
//         await client.close();
//     }
// }

// main().catch(console.error);


    //validate
    // const schema = Joi.object({
    //     "username": Joi.string().min(3).required(),
    //     "age": Joi.number().required().greater(16).less(40),
    //     "interests": Joi.array().min(5).max(15).required()
    // });

    //  const schema_result = schema.validate(req.body)
    // if (schema_result.error) {
    //     res.status(400).send(schema_result.error.details[0].message)
    //     return
    // }

    //     let presentUser = 0;
    // for (let u in users) {
    //     if(presentUser < users[u].id)
    //     presentUser = users[u].id;
    // }
    //create

    // const mqttClient = mqtt.connect(mqttOptions);
// mqttClient.on('message', function (topic, message) {
//     //Called each time a message is received
//     console.log('Received message:', topic, message.toString());
// });
// const mqttUrl = "mqtt://mqtt.dioty.co:1883";
// const mqttClient = mqtt.connect(mqttUrl, mqttOptions);

//const mqttClient = mqtt.connect(mqttOptions);
// mqttClient.on('connect', function () {
//     console.log('Connected to MQTT Broker');
// });
// mqttClient.on('connect', function () { // Check you have a connection

//     // Subscribe to a Topic
//     // mqttClient.subscribe('/achelia200@gmail.com/watering');
//     mqttClient.subscribe('/easygreenery/watering');
//     mqttClient.on('message', function (topic, message) {
//         console.log("message is " + message);
//         console.log("topic is " + topic);
//     });
//     //handle errors
//     mqttClient.on("error", function (error) {
//         console.log("Can't connect" + error);
//         process.exit(1)
//     });

//     // Publish a message to a Topic
//     mqttClient.publish('/achelia200@gmail.com/watering', 'water_me', function () {
//         console.log("Message posted...");
//         // Close the connection after publish
//     });

//     mqttClient.on('offline', () => {
//         mqttClient.end(true, () => {
//             mqtt.connect(mqttUrl, options);
//         });
//     });
// });

//MQTT
// const mqttOptions = {
//     username: "achelia200@gmail.com",
//     password: "e92e6d17"
// };