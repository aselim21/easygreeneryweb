const { ObjectID } = require('bson');
const { MongoClient } = require('mongodb');
const { resourceLimits } = require('worker_threads');
const express = require('express');
const app = express();
app.use(express.json());

maximumNumberOfResults = Number.MAX_SAFE_INTEGER;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  
app.post('/plants', (req, res) => {
    console.log(req.body);
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
    const UpdatedPlantInfo = {
        "nickname": req.body.nickname,
        "plantname": req.body.plantname,
        "day_length": req.body.day_length,
        "light_strength": req.body.light_strength,
        "watering_frequency": req.body.watering_frequency,
        "watering_amount": req.body.watering_amount
    };
    //createRow(UpdatedPlantInfo);
    console.log(UpdatedPlantInfo);

    // res.location(`/users/${parseInt(presentUser) + 1}`);
    // res.send(newUser);
});


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

// async function listDatabasess(client){
//     const databasesList = await client.db().admin().listDatabases();
//     console.log("Databases:");

//     databasesList.databases.forEach(db => {
//         console.log(db.name);
//     });
// }

async function createRow(newRow) {
    const uri = "mongodb+srv://easy-greenery-admin-a:0889928273@cluster0.c4akl.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const result = await client.db("easygreenery_plants").collection("plants").insertOne(newRow);
        console.log(`Inserted new row in easygreenery_plant -> plants with id ${result.insertedId}`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
    
}
async function findByNickname(client, the_nickname) {
    const cursor = await client.db("easygreenery_plants").collection("plants").find({ nickname: the_nickname });;
    const results = await cursor.toArray();
    if (results.length > 0) {
        console.log(`Found a listing in the collection with the nickname '${the_nickname}':`);
        results.forEach((result) => {
            console.log(result);
        });
        return results;
    } else {
        console.log(`No listings found with the nickname '${the_nickname}'`);
        return 0;
    }
}

async function findById(client, the_id) {
    const result = await client.db("easygreenery_plants").collection("plants").findOne({ _id: ObjectID(`${the_id}`) });

    if (result) {
        console.log(`Found a listing in the collection with the id '${the_id}':`);
        console.log(result);
    } else {
        console.log(`No listings found with the id '${the_id}'`);
    }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));