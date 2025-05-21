const request = require("supertest");
const mongoose = require("mongoose");
const { app } = require("../app"); // Changed import
const Todo = require("../models/todo");
require("dotenv").config(); // Ensure this is at the top
const fs = require("fs");
const path = require("path");

// Define the path for the dummy image and uploads directory
const dummyImagePath = path.join(__dirname, "test-image.png");
const uploadsDir = path.join(__dirname, "..", "public", "uploads", "images");

beforeAll(async () => {
  // Connect to a test database using MONGODB_URI from .env
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set. Please ensure you have a .env file with it defined.");
  }
  await mongoose.connect(process.env.MONGODB_URI);

  // Ensure uploads directory exists for multer
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  // Create dummy image if it doesn't exist (it should have been created in a previous step)
  if (!fs.existsSync(dummyImagePath)) {
    fs.writeFileSync(dummyImagePath, "This is a dummy image file for testing uploads.");
  }
});

afterAll(async () => {
  // Clean up the database
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();

  // Clean up uploaded test files
  const files = fs.readdirSync(uploadsDir);
  for (const file of files) {
    // Potentially add more specific checks if other files might exist
    if (file.startsWith("test-") || file.includes("Test Todo")) { // Heuristic to remove test files
        fs.unlinkSync(path.join(uploadsDir, file));
    }
  }
  // Remove dummy image from tests directory if created by this script (optional, good for CI)
  // if (fs.existsSync(dummyImagePath)) {
  //   fs.unlinkSync(dummyImagePath);
  // }
});

// Clear todos and uploaded files after each test to ensure test independence
afterEach(async () => {
    await Todo.deleteMany({});
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
        // A more robust check might be needed if many tests run concurrently and generate similar names
        // For now, this targets files that likely came from tests.
        if (file.includes("Test") || file.includes("dummy") || file.match(/^\d{13}-test-image\.png$/)) {
             try {
                fs.unlinkSync(path.join(uploadsDir, file));
            } catch (err) {
                console.error("Error deleting test file:", err.message);
            }
        }
    }
});


describe("Todo API", () => {
  const testReminderDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now

  // Test creating a new todo with all fields including image
  it("should create a new todo with task, description, reminder, and image", async () => {
    const response = await request(app)
      .post("/todos")
      .field("task", "Test Todo with details")
      .field("description", "This is a test description")
      .field("reminder", testReminderDate.toISOString())
      .attach("image", dummyImagePath); // Use path to the dummy image

    expect(response.statusCode).toBe(302); // Redirect after creation

    const todo = await Todo.findOne({ task: "Test Todo with details" });
    expect(todo).not.toBeNull();
    expect(todo.task).toBe("Test Todo with details");
    expect(todo.description).toBe("This is a test description");
    // Reminder check: Compare dates (momentjs or similar could be more robust for timezones/formats)
    expect(new Date(todo.reminder).toDateString()).toBe(testReminderDate.toDateString());
    expect(todo.imageFilename).toEqual(expect.stringContaining("test-image.png")); // Check if filename is stored
    expect(fs.existsSync(path.join(uploadsDir, todo.imageFilename))).toBe(true); // Check if file was uploaded
  });

  // Test creating a new todo without an image
  it("should create a new todo without an image", async () => {
    const response = await request(app)
      .post("/todos")
      .field("task", "Test Todo no image")
      .field("description", "Description for no image todo")
      .field("reminder", testReminderDate.toISOString());

    expect(response.statusCode).toBe(302);

    const todo = await Todo.findOne({ task: "Test Todo no image" });
    expect(todo).not.toBeNull();
    expect(todo.task).toBe("Test Todo no image");
    expect(todo.description).toBe("Description for no image todo");
    expect(todo.imageFilename).toBeNull();
  });

  // Test updating a todo's details, including status, description, image, and reminder
  it("should update a todo's details, including status, description, image, and reminder", async () => {
    // 1. Create an initial todo
    let initialTodo = new Todo({
      task: "Initial Task for Update",
      description: "Initial Description",
      done: false,
    });
    await initialTodo.save();
    const todoId = initialTodo._id;

    const updatedReminderDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now

    // 2. Send PUT request to update the todo
    const response = await request(app)
      .put(`/todos/${todoId}`)
      .field("task", "Updated Task")
      .field("description", "Updated Description")
      .field("reminder", updatedReminderDate.toISOString())
      .field("done", "true") // Send 'true' as a string, as forms would
      .attach("image", dummyImagePath); // Attach a new image

    expect(response.statusCode).toBe(302); // Redirect after update

    // 3. Assert changes in the database
    const updatedTodo = await Todo.findById(todoId);
    expect(updatedTodo).not.toBeNull();
    expect(updatedTodo.task).toBe("Updated Task");
    expect(updatedTodo.description).toBe("Updated Description");
    expect(updatedTodo.done).toBe(true);
    expect(new Date(updatedTodo.reminder).toDateString()).toBe(updatedReminderDate.toDateString());
    expect(updatedTodo.imageFilename).toEqual(expect.stringContaining("test-image.png"));
    expect(fs.existsSync(path.join(uploadsDir, updatedTodo.imageFilename))).toBe(true);
    
    // Ensure old image (if any from initialTodo) would be handled (though initialTodo had no image)
    // If initialTodo had an image, we might want to check if it's deleted or replaced.
    // For this test, initialTodo.imageFilename was null, so no old file to check.
  });

  // Test deleting a todo (remains largely the same, but good to keep)
  it("should delete a todo", async () => {
    // Create a todo to delete
    const todoToDelete = new Todo({ task: "Todo to delete" });
    await todoToDelete.save();
    const todoId = todoToDelete._id;

    const response = await request(app).delete(`/todos/${todoId}`);
    expect(response.statusCode).toBe(302); // Redirect after deletion

    const todo = await Todo.findById(todoId);
    expect(todo).toBeNull();
  });
});
