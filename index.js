const dns = require('node:dns');
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const uri = process.env.MONGO_URI;
const app = express();
const PORT = process.env.PORT;
app.use(cors());
app.use(express.json());
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
 const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));
   
const verifyToken = async (req, res, next)=>{
const authHeader = req.headers.authorization
if(!authHeader){
  return res.status(401).json({message: "Unauthorized"})
}
const token = authHeader.split(" ")[1]
console.log(token)
if(!token){
  return res.status(401).json({message: "Unauthorized"})
}
 try{
const { payload } = await jwtVerify(token, JWKS)
console.log(payload)
next()
 } catch(error){
 return res.status(401).json({message: "Forbidden"})
 }
};
async function run() {
  try {
    const database = client.db("IdeasVault");
const ideasCollection = database.collection("ideas");
app.get("/ideaData", async (req, res) => {
    const result = await ideasCollection.find().toArray();
    res.json(result);
});
app.get("/featuredIdeas", async (req, res) => {
  const result = await ideasCollection
    .aggregate([
      {
        $limit: 6
      }
    ])
    .toArray();

  res.json(result);
});
app.get("/myIdeas",verifyToken, async (req, res) => {
  const result = await ideasCollection
    .find()
    .skip(3)
    .toArray();

  res.json(result);
});
app.post("/ideaData",verifyToken, async (req, res) => {
const idea = req.body;
console.log(idea);
const result = await ideasCollection.insertOne(idea);
res.json(result);
});
app.get(
  "/ideaData/:id",verifyToken, async (req, res) => {
    const { id } = req.params;
const result = await ideasCollection.findOne({
      _id: new ObjectId(id),
    });

    res.send(result);
  }
);
app.patch("/ideaData/:id",verifyToken, async (req, res) => {
   const {id} = req.params;
   const updateData = req.body
   const result = await ideasCollection.updateOne({_id: new ObjectId(id)},
   {$set: updateData})
   res.json(result);
});
app.delete("/ideaData/:id",verifyToken, async (req, res) => {
   const {id} = req.params;
   const result = await ideasCollection.deleteOne({_id: new ObjectId(id)})
   res.json(result);
});

const commentCollection = database.collection('comments');
app.get("/commentData",verifyToken, async (req, res) => {
    const result = await commentCollection.find().toArray();
    res.json(result);
});
app.post("/commentData",verifyToken, async (req, res) => {
const comment = req.body;
console.log(comment);
const result = await commentCollection.insertOne(comment);
res.json(result);
});
app.patch("/commentData/:id",verifyToken, async (req, res)=>{
  const {id} = req.params
  const updateComment = req.body
  const result = await commentCollection.updateOne({_id: new ObjectId(id)},
{$set: updateComment})
res.json(result);
});
app.delete("/commentData/:id",verifyToken, async (req, res) => {
   const {id} = req.params;
   const result = await commentCollection.deleteOne({_id: new ObjectId(id)})
   res.json(result);
});
    //await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Server Running");
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});