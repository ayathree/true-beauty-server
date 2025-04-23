const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
 require('dotenv').config();
 const port =process.env.PORT || 5000

 const app= express()

 const corsOptions = {
  origin : ['http://localhost:5173', 'http://localhost:5174' ,'https://true-beauty-2d58d.firebaseapp.com' ],
  credentials : true,
  optionSuccessStatus : 200,

 }

 

 app.use(cors(corsOptions))
 app.use(express.json())
 app.use(cookieParser())


 

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

    // jwt generate
    app.post('/jwt', async(req,res)=>{
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn : '365d',
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'?'none':'strict',
      }).send({success: true})
    })
    // clear token by logout
    app.get('/logout', (req,res)=>{
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production'?'none':'strict',
        maxAge:0,
      }).send({success: true})
    })

    // verify jwt middleware
    const verifyToken = (req,res,next)=>{
      const token = req.cookies?.token
      if(!token) return res.status(401).send({message:'unauthorized access'})
        if(token){
          jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
            if(err){
              console.log(err)
              return res.status(401).send({message:"unauthorized access"})
            }
            console.log(decoded)
            req.user=decoded
            next()
          })
        }
    }



    // save a product in database
    app.post('/products',verifyToken, async(req,res)=>{
      const productData = req.body
       // Convert price to number (float)
    if (productData.price) {
      productData.price = parseFloat(productData.price);
    }
      
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

    
    // get all product data save by admin
    app.get('/productsData/:email', verifyToken, async(req,res)=>{
      const tokenEmail = req.user.email
      const email = req.params.email
      if(tokenEmail!==email){
        return res.status(403).send({message:"forbidden access"})
      }
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
    app.put('/products/:id',verifyToken, async(req,res)=>{
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
    
    
    // save a order in database
    app.post('/order', async(req,res)=>{
      const orderData = req.body
      // check if the order is duplicate
      const query={
        customerEmail:orderData.customerEmail,
        orderedProductId:orderData.orderedProductId
      }
      const alreadyOrdered=await orderCollection.findOne(query)
      if(alreadyOrdered){
        return res.status(400).send('You have already ordered this product')
      }
      
      const result = await orderCollection.insertOne(orderData)
      res.send(result)
    })

    // get all order of a user from db
    app.get('/order/:email',verifyToken, async(req,res)=>{
      const tokenEmail = req.user.email
      const email = req.params.email
       if(tokenEmail!==email){
        return res.status(403).send({message:"forbidden access"})
      }
      const query = {customerEmail : email}
      const result =await orderCollection.find(query).toArray()
      res.send(result)
    })

    // get all order of a user for a admin from db
    app.get('/orderAdmin/:email', verifyToken, async(req,res)=>{
       const tokenEmail = req.user.email
      const email = req.params.email
      if(tokenEmail!==email){
        return res.status(403).send({message:"forbidden access"})
      }
      const query = {ownerEmail : email}
      const result =await orderCollection.find(query).toArray()
      res.send(result)
    })
    // get all single order data

    app.get('/orderData/:id', verifyToken, async(req,res)=>{
      const id= req.params.id
      const query = {_id: new ObjectId (id)}
      console.log(query)
      const result = await orderCollection.findOne(query)
      res.send(result)
    })
    //  update a order data 
    app.patch('/orderData/:id', verifyToken, async(req,res)=>{
      const id = req.params.id
      const { customerName, customerNumber, customerAddress } = req.body;
      const query = {_id: new ObjectId(id)}
      const updateDoc ={
        $set: {
          customerName: customerName,
          customerNumber: customerNumber,
          customerAddress: customerAddress
        }
      }
      const result = await orderCollection.updateOne(query, updateDoc)
      res.send(result)
      
    })

    // delete a order data from db
    app.delete('/orderData/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      
      const result =await orderCollection.deleteOne(query)
      res.send(result)
    })

    // update status
    app.patch('/order/:id', verifyToken, async (req,res)=>{
      const id=req.params.id
      const status = req.body
      const query = {_id: new ObjectId(id)}
      const updateDoc ={
        $set: status,
      }
      const result = await orderCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    // get all product data for pagination,filter
    app.get('/allData', async(req,res)=>{
      const size = parseInt(req.query.size)
      const page = parseInt(req.query.page) - 1
      const filter = req.query.filter
      const filterBrand = req.query.filterBrand
      const sort = req.query.sort
      const sortPrice = req.query.sortPrice
      const search = req.query.search
      console.log(size,page);
      let query={
        productName: {$regex: search, $options: 'i'}
        

      }
      if (filter) query.category = filter
      if(filterBrand) query.brand = filterBrand
      let sortOptions = {};
    
    // Handle both sorting criteria
    if (sortPrice === 'low' || sortPrice === 'high') {
      sortOptions.price = sortPrice === 'low' ? 1 : -1;
    }
    if (sort === 'asc' || sort === 'dsc') {
      sortOptions.deadline = sort === 'asc' ? 1 : -1;
    }
    
      const result = await productCollection.find(query).sort(sortOptions).skip(page * size).limit(size).toArray()

      res.send(result)
    })
    // get all product data count
    app.get('/dataCount', async(req,res)=>{
      const filter = req.query.filter
      const filterBrand = req.query.filterBrand
      const search = req.query.search

      let query={
        productName: {$regex: search, $options: 'i'}
        

      }
      if (filter) query.category = filter
      if(filterBrand) query.brand = filterBrand
      const count = await productCollection.countDocuments(query)

      res.send({count})
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
