import { MongoClient } from "mongodb";

let db;

async function connectToDb(cb){
    const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@portfoliomongodb.tsqt3w4.mongodb.net/?retryWrites=true&w=majority`);
    await client.connect();

    db = client.db('blog-react-db');
    cb()
}

export {
    db, 
    connectToDb
}