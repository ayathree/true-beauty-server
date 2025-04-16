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
    const orderCollection = client.db('trueBeauty').collection('orders')


    // save a product in database
    app.post('/products', async(req,res)=>{
      const productData = req.body
      
      const result = await productCollection.insertOne(productData)
      res.send(result)
    })



    // get all product data
    app.get('/products', async(req,res)=>{
      const result = await productCollection.find().toArray()

      res.send(result)
    })

    // get all single product data

    app.get('/products/:id', async(req,res)=>{
      const id= req.params.id
      const query = {_id: new ObjectId (id)}
      console.log(query)
      const result = await productCollection.findOne(query)
      res.send(result)
    })

    // save a order in database
    app.post('/order', async(req,res)=>{
      const orderData = req.body
      
      const result = await orderCollection.insertOne(orderData)
      res.send(result)
    })

    // get all product data save by admin
    app.get('/productsData/:email', async(req,res)=>{
      const email = req.params.email
      const query = {adminEmail : email}
      const result =await productCollection.find(query).toArray()
      res.send(result)
    })
    // delete a product data from db
    app.delete('/products/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      
      const result =await productCollection.deleteOne(query)
      res.send(result)
    })
    //  update a product data 
    app.put('/products/:id', async(req,res)=>{
      const id = req.params.id
      const productData = req.body
      const query = {_id : new ObjectId(id)}
      const options = {upsert: true}
      const updateDoc={
        $set:{
          ...productData,
        },
      }
      const result = await productCollection.updateOne(query,updateDoc,options)
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
