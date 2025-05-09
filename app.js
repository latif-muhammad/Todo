const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const todoController = require("./controllers/todoController");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Set view engine
app.set("view engine", "ejs");



// Routes
app.use("/", todoController); // Connect controller routes

module.exports = app; // Export the app without starting the server