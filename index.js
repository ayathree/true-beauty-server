const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
 require('dotenv').config();
 const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
    const reviewCollection = client.db('trueBeauty').collection('reviews')
    const paymentCollection = client.db('trueBeauty').collection('payments')
    const contactCollection = client.db('trueBeauty').collection('contacts')



    // save a user in db
   app.post('/users', async (req, res) => {
  const user = req.body;
  
  // Check by email OR uid if available
  const query = { 
    $or: [
      { email: user.email },
      ...(user.uid ? [{ uid: user.uid }] : [])
    ]
  };

  const existingUser = await userCollection.findOne(query);
  
  if (existingUser) {
    // Update last login but preserve role
    await userCollection.updateOne(
      { _id: existingUser._id },
      { $set: { lastLogin: new Date() } }
    );
    return res.send({ 
      message: 'user exists', 
      user: existingUser 
    });
  }

  // New user with default role
  const userWithDefaults = {
    ...user,
    role: 'user',
    createdAt: new Date(),
    lastLogin: new Date()
  };

  const result = await userCollection.insertOne(userWithDefaults);
  res.send({
    message: 'new user created',
    user: { ...userWithDefaults, _id: result.insertedId }
  });
});

 app.get('/users', async(req,res)=>{
      const result = await userCollection.find().toArray()

      res.send(result)
    })
    // make an user an admin
     app.patch('/users/admin/:id', async (req,res)=>{
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
    

     // get the user role
  app.get('/users/admin/:email',  async(req,res)=>{
       const email = req.params.email;
       const query = {email: email};
       const user = await userCollection.findOne(query);
       let admin = false;
       if (user) {
         admin = user?.role=== 'admin';
         
       }
       res.send({ admin})
 
     })



    // save a product in database
    app.post('/products', async(req,res)=>{
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
    // get all product data by category name
    app.get('/productBrand/:category', async(req,res)=>{
      const category=decodeURIComponent (req.params.category)
     const query = { 
     category: { $regex: new RegExp(`^${category}$`, 'i') }
    };
      console.log(query)
      const result = await productCollection.find(query).toArray()
      res.send(result)
    })

    
    // get all product data save by admin
    app.get('/productsData/:email', async(req,res)=>{
      // const tokenEmail = req.user.email
      const email = req.params.email
      const query = {adminEmail : email}
      const result =await productCollection.find(query).toArray()
      res.send(result)
    })
    // delete a product data from db
    app.delete('/products/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result =await productCollection.deleteOne(query)
      res.send(result)
    })
    //  update a product data 
    app.put('/products/:id',async(req,res)=>{
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
    app.get('/order/:email',async(req,res)=>{
      const email = req.params.email
      const query = {'customerInfo.email' : email}
      const result =await orderCollection.find(query).toArray()
      res.send(result)
    })

    // get all order of a user for a admin from db
    app.get('/orderAdmin/:email',async(req,res)=>{
      const email = req.params.email
      const query = { 'products.owner' : email}
      const result =await orderCollection.find(query).toArray()
      res.send(result)
    })

    // get all single order data
    app.get('/orderData/:id', async(req,res)=>{
      const id= req.params.id
      const query = {_id: new ObjectId (id)}
      console.log(query)
      const result = await orderCollection.findOne(query)
      res.send(result)
    })
    //  update a order data 
    app.patch('/orderData/:id',async(req,res)=>{
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
    app.delete('/orderData/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result =await orderCollection.deleteOne(query)
      res.send(result)
    })

    // update status
    app.patch('/order/:id',async (req,res)=>{
      const id=req.params.id
      const { status } = req.body
      const query = {_id: new ObjectId(id)}
      const updateDoc ={
        $set: {
        'orderDetails.status': status,
        
      }
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

    // added a cart product in database
    app.post('/cart',async(req,res)=>{
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
    app.get('/cart/:email',async(req,res)=>{
      const email = req.params.email
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

     app.get('/cartData/:id', async(req,res)=>{
      const id= req.params.id
      const query = {_id: new ObjectId (id)}
      console.log(query)
      const result = await cartCollection.findOne(query)
      res.send(result)
    })

    // PATCH /cartData/:id - Update cart item quantity
app.patch('/cartData/:id', async (req, res) => {
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
app.get('/checkOutData/:email',async(req,res)=>{
  const email = req.params.email
  const query = {saverEmail : email}
  const result =await cartCollection.find(query).toArray()
  res.send(result)
})

// add a wish listed product in database
    app.post('/wish',async(req,res)=>{
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
    app.post('/wishData',async (req, res) => {

      try {
        // 1. Add to cart
        const cartItem = {
          ...req.body,
          addedAt: new Date()
        };
        const result = await cartCollection.insertOne(cartItem);
    
        // 2. Delete from wishlist (simple version)
        await wishCollection.deleteOne({
          _id: new ObjectId(req.body.savedProductId), 
          listerEmail: req.body.saverEmail // Matches cart item's saverEmail
        });
    
        res.send(result);
      } catch (error) {
        res.status(500).send('Error');
      }
    });

    // get all wish listed product of a user from db
    app.get('/wish/:email',async(req,res)=>{
      const email = req.params.email
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
    // add a review in database
    app.post('/review',async(req,res)=>{
      const reviewData = req.body
      // check if the review is duplicate
      const query={
        reviewerEmail:reviewData.reviewerEmail,
        reviewedProductId:reviewData.reviewedProductId
      }
      const alreadyReviewed=await reviewCollection.findOne(query)
      if(alreadyReviewed){
        return res.status(400).send('You have already added this product')
      }
      
      const result = await reviewCollection.insertOne(reviewData) 
      res.send(result)
    })
   
    // Get all reviews for a specific product by product ID
app.get('/products/:productId/reviews', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Find all reviews where reviewedProductId matches the product's _id
    const reviews = await reviewCollection.find({
      reviewedProductId: productId  // This matches the string ID from URL with reviewedProductId
    }).toArray();
    
    res.send(reviews);
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// payment intent
app.post('/create-payment-intent',async(req,res)=>{
  const{price}=req.body;
  const amount = parseInt(price*100);
  console.log(amount);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    payment_method_types: ['card']
  });
  res.send({
    clientSecret: paymentIntent.client_secret
  })
})
// save payment

app.post('/payments',async(req,res)=>{
  const payment=req.body
  const paymentResult=await paymentCollection.insertOne(payment)
  console.log(payment);
   
  res.send(paymentResult)
})

 // get all payment data of a user for a admin from db
    app.get('/payData/:email', async(req,res)=>{
      const email = req.params.email
     // Find payments where user is in the admin array
    const result = await paymentCollection.find({ 
      admin: { $in: [email] } 
    }).toArray();
    
    res.send(result);
    })

// delete payment data
app.delete('/payData/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      
      const result =await paymentCollection.deleteOne(query)
      res.send(result)
    })

    // get all  payment data for a user
    app.get('/paymentData/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email : email}
      const result =await paymentCollection.find(query).toArray()
      res.send(result)
    })
    // contact us add
 app.post('/contacts', async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact);
      res.send(result);
    });

    // get all contact data
    app.get('/contacts', async(req,res)=>{
      const result = await contactCollection.find().toArray()

      res.send(result)
    })

     // delete a contact data from db
    app.delete('/contacts/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      
      const result =await contactCollection.deleteOne(query)
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
