const express = require('express');
const router = express.Router();
const Todo = require('../models/todo');
const { upload } = require('../app'); // Import upload

// Index route - Show all todos
router.get('/', async (req, res) => {
    const todos = await Todo.find();
    res.render('index', { todos });
});

// Create a new todo
router.post('/todos', upload.single('image'), async (req, res) => {
    const { task, description, reminder } = req.body;
    const newTodo = new Todo({
        task,
        description,
        reminder,
        imageFilename: req.file ? req.file.filename : null,
        done: false // Default value for done
    });
    await newTodo.save();
    res.redirect('/');
});

// Update a todo
router.put('/todos/:id', upload.single('image'), async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) {
            return res.status(404).send('Todo not found');
        }

        todo.task = req.body.task !== undefined ? req.body.task : todo.task;
        todo.description = req.body.description !== undefined ? req.body.description : todo.description;
        todo.reminder = req.body.reminder !== undefined ? req.body.reminder : todo.reminder;
        
        // Handle 'done' status - expecting 'true' or 'false' string from form
        if (req.body.done !== undefined) {
            todo.done = req.body.done === 'true';
        }

        if (req.file) {
            // TODO: Optionally delete the old image if todo.imageFilename exists
            todo.imageFilename = req.file.filename;
        }

        await todo.save();
        res.redirect('/');
    } catch (error) {
        console.error("Error updating todo:", error);
        res.status(500).send("Error updating todo");
    }
});

// Delete a todo
router.delete('/todos/:id', async (req, res) => {
    await Todo.findByIdAndDelete(req.params.id);
    res.redirect('/');
});

module.exports = router;
