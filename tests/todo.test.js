const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const Todo = require("../models/todo");
require("dotenv").config();

beforeAll(async () => {
  // Connect to a test database
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  // Clean up the database and close the connection
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe("Todo API", () => {
  let todoId;

  // Test creating a new todo
  it("should create a new todo", async () => {
    const response = await request(app)
      .post("/todos")
      .send({ task: "Test Todo" });
    expect(response.statusCode).toBe(302); // Redirect after creation
    const todo = await Todo.findOne({ task: "Test Todo" });
    expect(todo).not.toBeNull();
    expect(todo.task).toBe("Test Todo");
    todoId = todo._id; // Save the ID for later tests
  });

  // Test marking a todo as done
  it("should mark a todo as done", async () => {
    const response = await request(app).put(`/todos/${todoId}`).send();
    expect(response.statusCode).toBe(302); // Redirect after update
    const todo = await Todo.findById(todoId);
    expect(todo.done).toBe(true);
  });

  // Test marking a todo as undone
  it("should mark a todo as undone", async () => {
    const response = await request(app).put(`/todos/${todoId}`).send();
    expect(response.statusCode).toBe(302); // Redirect after update
    const todo = await Todo.findById(todoId);
    expect(todo.done).toBe(false);
  });

  // Test deleting a todo
  it("should delete a todo", async () => {
    const response = await request(app).delete(`/todos/${todoId}`).send();
    expect(response.statusCode).toBe(302); // Redirect after deletion
    const todo = await Todo.findById(todoId);
    expect(todo).toBeNull();
  });
});
