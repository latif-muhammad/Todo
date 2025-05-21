const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const todoController = require("./controllers/todoController");
require("dotenv").config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Multer configuration
const uploadDir = path.join(__dirname, "public", "uploads", "images");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept image files only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static('public')); // Serve static files from 'public'

// Set view engine
app.set("view engine", "ejs");

// Routes
app.use("/", todoController); // Connect controller routes

module.exports = { app, upload }; // Export the app and upload middleware