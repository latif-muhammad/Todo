const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    task: String,
    done: { type: Boolean, default: false },
    description: String,
    imageFilename: String, // To store the name of the uploaded image file
    reminder: Date
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;
