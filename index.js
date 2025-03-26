const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
 require('dotenv').config();
 const port =process.env.PORT || 5000

 const app= express()

 const corsOptions = {
  origin : ['http://localhost:5173', 'http://localhost:5174' ],
  credentials : true,
  optionSuccessStatus : 200,

 }

 

 app.use(cors(corsOptions))
 app.use(express.json())


 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ycbv1lf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    // database collections
    const productCollection = client.db('trueBeauty').collection('products')


    // get all product data
    app.get('/products', async(req,res)=>{
      const result = await productCollection.find().toArray()

      res.send(result)
    })

   //  await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   //  await client.close();
  }
}
run().catch(console.dir);


 app.get('/',(req,res)=>{
   res.send('hello from true beauty server...')
 })

 app.listen(port,()=>console.log(`server running on port ${port}`))
