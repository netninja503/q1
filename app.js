const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3070;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/csquiz123', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  correctAnswersCount: { type: Number, default: 0 },
  skippedCount: { type: Number, default: 0 },
  wrongAnswersCount: { type: Number, default: 0 }
});

const User = mongoose.model("student123", userSchema);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fetch questions from `questions.json`
// Fetch and return 20 random questions
app.get('/questions', (req, res) => {
  fs.readFile(path.join(__dirname, 'questions.json'), 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error reading questions file." });
    }

    const questions = JSON.parse(data);
    const shuffledQuestions = questions.sort(() => 0.5 - Math.random()); // Shuffle the questions
    const selectedQuestions = shuffledQuestions.slice(0, 20); // Take the first 20 questions

    res.json(selectedQuestions);
  });
});


// User signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    res.json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error during signup", error });
  }
});

// User login (anyone can log in)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // If the user does not exist, create a new one
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username, password });
      await user.save();
    }

    // Allow login without validating password
    res.json({ 
      message: "Login successful", 
      user: { 
        username: user.username, 
        correctAnswersCount: user.correctAnswersCount, 
        skippedCount: user.skippedCount, 
        wrongAnswersCount: user.wrongAnswersCount 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Error during login", error });
  }
});

// Submit quiz results
// Submit quiz results
app.post('/submit-quiz', async (req, res) => {
  const { username, correctAnswersCount, skippedCount, wrongAnswersCount } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.correctAnswersCount = correctAnswersCount;
    user.skippedCount = skippedCount;
    user.wrongAnswersCount = wrongAnswersCount;
    await user.save();

    res.json({ message: "Quiz results saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving quiz results", error });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
