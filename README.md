# True Beauty

This website is an e-commerce site for cosmetics with an interactive AI-powered voice command assistant allowing for hands-free navigation, where a customer can find many cosmetics from different kinds and categories.

---

## 🚀 Live Demo

👉 [Click here to view the live project](https://true-beauty-2d58d.web.app)

---

## 🛠️ Tech Stack

- **Frontend:** React.js / HTML / CSS / Tailwind 
- **Backend:** Node.js / Express / Firebase
- **Database:** MongoDB
- **Hosting:** Firebase / Vercel 
- **Voice Interface:** Web Speech API (SpeechSynthesisUtterance, SpeechRecognition)
- **Other Tools:**  React Router / Stripe / Axios / tanstack query / date-fns / react-datepicker / react-hot-toast / react-icons / react-rating-stars-component / react-slick / react-tabs / sweetalert2 / swiper / cors / cookie-parser / dotenv / lodash

---

## ✨ Features

### 🧑‍💼 User Features

- 🔐 **Authentication System** – Secure Signup/Login(Forget Password System) with protected routes
- 🎤 **Voice Command Assistant** - Navigate the site hands-free using voice commands (e.g., "Cart", "Shop").
- 🔊 **Audio Feedback** - The assistant provides clear audio confirmation (e.g., "Opening your cart page") for each action, enhancing user interaction.
- 🛍️ **Shop Page with Advanced Filtering** – Filter by name, category, brand, price.
- 🛒 **Cart System (MyCart)** – Add, remove, and update(increase/decrease) product quantities
- ❤️ **Wishlist** – Save favorite products to view or buy later
- 📦 **My Orders** – View order history with statuses
- 💳 **My Transactions** – Secure transaction history and details
- 💳 **Check Out** - Secure transaction with stripe
- ✅ **Mobile-Responsive Design** – Seamless on all devices

---

### 🛠️ Admin Features
- 📊 **Admin Dashboard** – Check all the transactions of customers  
- 📦 **Manage Products** – Full CRUD operations: add, edit, delete, and view products  
- 📑 **Manage Orders** – Update and monitor order statuses  
- 👥 **Manage Users** – View users, change roles, and control access  
- 💬 **All Messages Page** – Review and respond to customer inquiries or feedback

---

### ⚙️ System Features
- 🌐 **Protected Routes** – Role-based route protection for User and Admin 
- 🗣️ **Voice-Enabled Interaction** -  Built-in support for speech synthesis and recognition for an accessible user experience. 
- 📤 **Image Uploading** – For product listings and user profiles  
- 💬 **Review System** - Customer can rate and give review for a product
- 🧩 **Reusable Components** – Clean architecture and modular React components    
- 🚀 **Performance Optimizations** – Lazy loading, efficient state management, and smooth UI  
- 🧪 **User-Friendly Interface** – Intuitive layout for seamless interaction

---

### 🎤 Voice Command Assistant
An interactive AI-powered voice command assistant is integrated into the site, providing a hands-free and accessible navigation experience for all logged-in users.
- **How to Use:**
- Click the microphone assistant button on the screen.
- When prompted, speak a navigation command clearly.
- The assistant will provide audio confirmation (e.g., "Opening your cart page") and redirect you.
- **Available Commands:**
- "Shop"; "Collection"; "Store"; "Open Shop Page"; "Open Cart Page"
- **Technology** 
- This feature is built using the modern Web Speech API, including **Audio**, **SpeechSynthesisUtterance**, **window.speechSynthesis**, and cross-browser compatible **SpeechRecognition**.



## 🧰 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ayathree/true-beauty-client.git

```
### 2. Install dependencies

```bash
cd project-name
npm install

```
### 3. Run the development server

```bash
npm start

```
### 4.Set Up MongoDB

- Install MongoDB locally
  👉 Download MongoDB

- Or use MongoDB Atlas for cloud database
  👉 https://www.mongodb.com/cloud/atlas

- Add your MongoDB URI to a .env file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/your-db-name
```
### 5.Set Up Firebase(in client-site)

- Go to Firebase Console

- Create a project and get your config keys

- Add to .env:
```env
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```
### 6.Stripe Setup

- Create a Stripe account: https://dashboard.stripe.com

- Add this to your .env file:

```env
STRIPE_SECRET_KEY=your_stripe_secret_key
```
### 7.Run the App

- If the frontend and backend are in the same folder:

 ```bash
 npm run dev
 ```
- If they are in separate folders (e.g., /client and /server):

```bash
# Frontend
cd client
npm start

# Backend
cd ../server
nodemon index.js
```

### 8.Additional Notes

- Some useful scripts:

```bash
npm run build       # Production build
npm run lint        # Check lint issues
npm run format      # Format code with Prettier
```

- This app uses
   -- cors and cookie-parser on the server
   -- dotenv for secure environment configuration


---


## 📄 Environment Variables Template (.env.example)

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_uri

# Firebase(frontend .env)
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key

```
---

## 👨‍💻 Author

### My Profile

🔗 [LinkedIn](https://www.linkedin.com/in/nobanitaayathree)

🐱 [GitHub](https://github.com/ayathree)

🌐 [Portfolio](https://nobanitaayathree.netlify.app)




