const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
 require('dotenv').config();
 const port =process.env.PORT || 5000

 const app= express()

 const corsOptions = {
  origin : ['http://localhost:5173', 'http://localhost:5174' ,'https://true-beauty-2d58d.web.app' ],
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
    const userCollection = client.db('trueBeauty').collection('users')
    const productCollection = client.db('trueBeauty').collection('products')
    const orderCollection = client.db('trueBeauty').collection('orders')
    const cartCollection = client.db('trueBeauty').collection('carts')
    const wishCollection = client.db('trueBeauty').collection('wishes')

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

    // Add admin verification middleware
    // const verifyAdmin = async (req, res, next) => {
    //   const requester = await userCollection.findOne({ _id: req.decoded.userId });
    //   if (!requester || requester.role !== 'admin') {
    //     return res.status(403).json({ message: 'Admin access required' });
    //   }
    //   next();
    // };


    // save a user in db
    app.post('/users', async (req, res) => {
      const user = req.body;
      
      // Check if user already exists
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null });
      }
    
      // Add role field with default value 'user'
      const userWithRole = {
        ...user,
        role: 'user' // Default role for new users
      };
    
      // Insert the new user with role
      const result = await userCollection.insertOne(userWithRole);
      res.send(result);
    });
    // get the user data
    app.get('/users',verifyToken, async(req,res)=>{
     
      const result = await userCollection.find().toArray();
      res.send(result) 
    });
    // make an user an admin
     app.patch('/users/admin/:id', verifyToken, async (req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set:{
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result)
    }) 
    // admin route
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      try {
        // 1. Get the requesting user's email from the verified token
        const requestingUserEmail = req.user.email; // From verifyToken middleware
        
        // 2. Get the target email from params
        const targetEmail = req.params.email;
    
        // 3. Find the requesting user in database
        const requestingUser = await userCollection.findOne({ email: requestingUserEmail });
        
        // 4. Authorization check - only allow if:
        //    a) User is checking their own status, OR
        //    b) User is an admin
        if (requestingUserEmail !== targetEmail && requestingUser?.role !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized access' });
        }
    
        // 5. Proceed with the admin check
        const targetUser = await userCollection.findOne({ email: targetEmail });
        res.json({ 
          admin: targetUser?.role === 'admin',
          email: targetEmail
        });
    
      } catch (err) {
        console.error('Admin check error:', err);
        res.status(500).json({ message: 'Server error' });
      }
    });



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
      const id = req.params.id
      const orderData = req.body
      // check if the order is duplicate
      const query={
        _id : new ObjectId(id),
       'customerInfo.email': orderData.customerInfo.email,   
      }
      const alreadyOrdered=await orderCollection.findOne(query)
      if(alreadyOrdered){
        return res.status(400).send('You have already ordered this product')
      }
      
      const result = await orderCollection.insertOne(orderData)
     // Update order count for each product
    await Promise.all(
      orderData.products.map(product => 
        productCollection.updateOne(
          { _id: new ObjectId(product.id) }, // Fix: Single ID per update
          { $inc: { totalOrder: 1 } }
        )
      )
    );

    // 6. Remove ordered items from cart
    const productIds = orderData.products.map(p => p.id);
    await cartCollection.deleteMany({
      'savedProductId': { $in: productIds },
      'saverEmail': orderData.customerInfo.email
    });
      res.send(result)
    })
    app.get('/order', async(req,res)=>{
      const result = await orderCollection.find().toArray()

      res.send(result)
    })

    // get all order of a user from db
    app.get('/order/:email',verifyToken, async(req,res)=>{
      const tokenEmail = req.user.email
      const email = req.params.email
       if(tokenEmail!==email){
        return res.status(403).send({message:"forbidden access"})
      }
      const query = {'customerInfo.email' : email}
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
      const query = { 'products.owner' : email}
      const result =await orderCollection.find(query).toArray()
      res.send(result)
    })
    // get all single order data

    app.get('/orderData/:id',  async(req,res)=>{
      const id= req.params.id
      const query = {_id: new ObjectId (id)}
      console.log(query)
      const result = await orderCollection.findOne(query)
      res.send(result)
    })
    //  update a order data 
    app.patch('/orderData/:id', async(req,res)=>{
      const id = req.params.id
      const { name, phone, address, city, zipCode } = req.body;
      const query = {_id: new ObjectId(id)}
      const updateDoc ={
        $set: {
         'customerInfo.name': name,
        'customerInfo.phone': phone,
        'customerInfo.address': address,
        'customerInfo.city': city,
        'customerInfo.zipCode': zipCode,
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
      const { status } = req.body
      const query = {_id: new ObjectId(id)}
      const updateDoc ={
        $set: {
        'orderDetails.status': status,
        
      }
      }
      const result = await orderCollection.updateOne(query, updateDoc)
    //   const order = await orderCollection.findOne(query);
    //   // 5. Delete cart items when status changes to specific values
    // if (['Shipped', 'Delivered'].includes(status)) {
    //   const productIds = order.products.map(p => p.id);
      
    //   await cartCollection.deleteMany({
    //     'savedProductId': { $in: productIds },
    //     'saverEmail': order.customerInfo.email
    //   });
    // }
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

    // added a cart product in database
    app.post('/cart',verifyToken, async(req,res)=>{
      const cartData = req.body
      // check if the order is duplicate
      const query={
        saverEmail:cartData.saverEmail,
        savedProductId:cartData.savedProductId
      }
      const alreadySaved=await cartCollection.findOne(query)
      if(alreadySaved){
        return res.status(400).send('You have already added this product')
      }
      
      const result = await cartCollection.insertOne(cartData) 
      res.send(result)
    })
    // get all cart product of a user from db
    app.get('/cart/:email',verifyToken, async(req,res)=>{
      const tokenEmail = req.user.email
      const email = req.params.email
       if(tokenEmail!==email){
        return res.status(403).send({message:"forbidden access"})
      }
      const query = {saverEmail : email}
      const result =await cartCollection.find(query).toArray()
      res.send(result)
    })
    // delete a cart data from db
    app.delete('/cartData/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      
      const result =await cartCollection.deleteOne(query)
      res.send(result)
    })
     // get all single cart data

     app.get('/cartData/:id', verifyToken, async(req,res)=>{
      const id= req.params.id
      const query = {_id: new ObjectId (id)}
      console.log(query)
      const result = await cartCollection.findOne(query)
      res.send(result)
    })
    // PATCH /cartData/:id - Update cart item quantity
app.patch('/cartData/:id', verifyToken, async (req, res) => {
  try {
      const id = req.params.id;
      const { quantity } = req.body;
      
      // Validate input
      if (!quantity || isNaN(quantity)) {
          return res.status(400).json({ error: 'Valid quantity is required' });
      }

      const result = await cartCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { quantity: parseInt(quantity), updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Cart item not found' });
      }

      res.json({ success: true });
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
  }
});
// get all cart data for checkout of a user from db
app.get('/checkOutData/:email',verifyToken, async(req,res)=>{
  const tokenEmail = req.user.email
  const email = req.params.email
   if(tokenEmail!==email){
    return res.status(403).send({message:"forbidden access"})
  }
  const query = {saverEmail : email}
  const result =await cartCollection.find(query).toArray()
  res.send(result)
})
// add a wish listed product in database
    app.post('/wish',verifyToken, async(req,res)=>{
      const wishData = req.body
      // check if the order is duplicate
      const query={
        listerEmail:wishData.listerEmail,
        listedProductId:wishData.listedProductId
      }
      const alreadyListed=await wishCollection.findOne(query)
      if(alreadyListed){
        return res.status(400).send('You have already added this product')
      }
      
      const result = await wishCollection.insertOne(wishData) 
      res.send(result)
    })
    // add a listed product in cart
    app.post('/wishData', verifyToken,async (req, res) => {

      try {
        // 1. Add to cart
        const cartItem = {
          ...req.body,
          addedAt: new Date()
        };
        const result = await cartCollection.insertOne(cartItem);
    
        // 2. Delete from wishlist (simple version)
        await wishCollection.deleteOne({
          _id: new ObjectId(req.body.savedProductId), // Assume frontend sends wishItemId
          listerEmail: req.body.saverEmail // Matches cart item's saverEmail
        });
    
        res.send(result);
      } catch (error) {
        res.status(500).send('Error');
      }
    });
    // get all wish listed product of a user from db
    app.get('/wish/:email',verifyToken, async(req,res)=>{
      const tokenEmail = req.user.email
      const email = req.params.email
       if(tokenEmail!==email){
        return res.status(403).send({message:"forbidden access"})
      }
      const query = {listerEmail : email}
      const result =await wishCollection.find(query).toArray()
      res.send(result)
    })
    // delete a wishListed  data from db
    app.delete('/wishData/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      
      const result =await wishCollection.deleteOne(query)
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
