import  express  from "express";
import fs from 'fs';
import admin from 'firebase-admin';
import { db, connectToDb } from "./db.js";

const credentials = JSON.parse(
    fs.readFileSync('./credentials.json')
);

admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
    const { authtoken } = req.headers;
    if(authtoken){
        try{
            req.user = await admin.auth().verifyIdToken(authtoken);
        } catch (e){
            return res.sendStatus(400);
        }
    }

    //providing a default value if an auth token was not included
    req.user = req.user || {};
    next();
});

app.get('/api/projects/:name', async (req, res) =>{
    const { name } = req.params;
    const { uid } = req.user;

    const project = await db.collection('projects').findOne({ name });

    if(project){
        const upvoteIds = project.upvoteIds || [];
        project.canUpvote  = uid && !upvoteIds.includes(uid);
        res.json(project);
    }
    else{
        res.sendStatus(404);
    }
});

app.get('/api/articles/:name', async (req, res) =>{
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });

    if(article){
        const upvoteIds = article.upvoteIds || [];
        article.canUpvote  = uid && !upvoteIds.includes(uid);
        res.json(article);
    }
    else{
        res.sendStatus(404);
    }
});


app.put('/api/projects/:name/upvote', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const project = await db.collection('projects').findOne({ name });

    if(project){
        const upvoteIds = project.upvoteIds || [];
        const canUpvote  = uid && !upvoteIds.includes(uid);
        if(canUpvote){
            await db.collection('projects').updateOne({ name }, {
                $inc: { upvotes: 1 },
                $push: {upvoteIds: uid}
            });
        }

        const updatedProject = await db.collection('projects').findOne({ name });
        res.json(updatedProject);
    } else
        res.send('The project dosn\'t exist');
});

app.put('/api/articles/:name/upvote', async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    const article = await db.collection('articles').findOne({ name });

    if(article){
        const upvoteIds = article.upvoteIds || [];
        const canUpvote  = uid && !upvoteIds.includes(uid);
        if(canUpvote){
            await db.collection('articles').updateOne({ name }, {
                $inc: { upvotes: 1 },
                $push: {upvoteIds: uid}
            });
        }

        const updatedArticle = await db.collection('articles').findOne({ name });
        res.json(updatedArticle);
    } else
        res.send('The article dosn\'t exist');
});

app.use((req, res, next) => {
    if(req.user){
        next();
    } else{
        res.sendStatus(401);
    }
});

app.post('/api/projects/:name/comments', async (req, res) => {
    const { name } = req.params;
    const { text } = req.body;
    const { email } = req.user;

    await db.collection('projects').updateOne({ name }, {
        $push: { comments: { postedBy: email, text }},
    });

    const project = await db.collection('projects').findOne({ name });

    if(project) {
        res.json(project);
    } else
        res.send('The project dosn\'t exist');
});

app.post('/api/articles/:name/comments', async (req, res) => {
    const { name } = req.params;
    const { text } = req.body;
    const { email } = req.user;

    await db.collection('articles').updateOne({ name }, {
        $push: { comments: { postedBy: email, text }},
    });

    const article = await db.collection('articles').findOne({ name });

    if(article) {
        res.json(article);
    } else
        res.send('The article dosn\'t exist');
});

connectToDb(() => {
    console.log("Successfully connected to database!");
    app.listen(8000, ()=>{
        console.log("Server is listening on port 8000")
    })
});

