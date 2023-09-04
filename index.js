const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");


app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173', // Replace with the actual origin of your frontend application
  optionsSuccessStatus: 200, // Some legacy browsers (IE11) may not understand 204
};

app.use(cors(corsOptions));


const mongodbURI =
  "mongodb+srv://srivatsan:gL2PeXtFCsLXbIfC@cluster0.xd31wsk.mongodb.net/kanban?retryWrites=true&w=majority";

mongoose
  .connect(mongodbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("successfully connected to database");
  })
  .catch((err) => console.log(err));

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  desc: {
    type: String,
    trim: true,
  },
});

const boardSchema = new mongoose.Schema({
  todo: [taskSchema],
  doing: [taskSchema],
  done: [taskSchema],
});

const Task = mongoose.model("task", taskSchema);
const Board = mongoose.model("Board", boardSchema);

app.get("/api/getData", (req, res) => {
  Board.find()
    .then((found) => res.json(found))
    .catch((err) => console.log(err));
});

app.post("/api/post", async (req, res) => {
  try {
    const newTask = new Task({title : req.body.title, desc:""});
    const board = await Board.findOne();
    board[req.body.section.toLowerCase()].push(newTask);
    await board.save();
    res.status(201).json({ message: "Task created and added to 'todo' successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/board/:cardName", async (req, res) => {
  try {
    // Extract the cardName and taskName from the request body
    const { cardName } = req.params;
    const { taskName } = req.body;
    console.log(cardName, taskName)

    // Find the board (assuming you have a Board model)
    const board = await Board.findOne();

    // Find and remove the task from the specified card in the board
    const updatedCard = board[cardName.toLowerCase()].filter(task => task.title !== taskName);
    board[cardName.toLowerCase()] = updatedCard;

    // Save the updated board
    await board.save();

    // Respond with a success message or any other data you need
    res.status(200).json({ message: "Task deleted from board successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/edit/:cardName/:taskName", async (req, res) => {
  try {
    // Extract the cardName and taskName from the URL parameters
    const { cardName, taskName } = req.params;
    console.log(cardName, taskName, req.body)

    // Extract the updated task data from the request body
    const updatedTaskData = req.body;

    // Find the board (assuming you have a Board model)
    const board = await Board.findOne();

    // Find the task within the specified card in the board
    const card = board[cardName.toLowerCase()];
    const taskIndex = card.findIndex(task => task.title === taskName);

    if (taskIndex === -1) {
      // Task not found in the specified card, handle this case as needed
      return res.status(404).json({ error: "Task not found in the specified card" });
    }

    // Update the task's properties within the card
    card[taskIndex] = { ...card[taskIndex], ...updatedTaskData };

    // Save the updated board
    await board.save();

    // Respond with the updated task or a success message
    res.status(200).json({ updatedTask: card[taskIndex] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.listen(process.env.PORT || 30001, () => {
  console.log("server listening at port 3000");
});
