// server.js
const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

mongoose.connect("mongodb+srv://muhammadlatifadd199:admin@cluster0.36ouufb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
.then(() => {
  console.log("Mongo Connected")
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch((err) => console.error('MongoDB connection error:', err));
