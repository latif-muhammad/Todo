const express = require('express');
const router = express.Router();
const Todo = require('../models/todo');

// Index route - Show all todos
router.get('/', async (req, res) => {
    const todos = await Todo.find();
    res.render('index', { todos });
});

// Create a new todo
router.post('/todos', async (req, res) => {
    const todo = new Todo({
        task: req.body.task
    });
    await todo.save();
    res.redirect('/');
});

// Update a todo's status (Done/Undone)
router.put('/todos/:id', async (req, res) => {
    const todo = await Todo.findById(req.params.id);
    todo.done = !todo.done;
    await todo.save();
    res.redirect('/');
});

// Delete a todo
router.delete('/todos/:id', async (req, res) => {
    await Todo.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

module.exports = router;
