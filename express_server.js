const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser')

app.use(cookieParser());
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});
app.get("/urls/:id", (req, res) => {
  const { id } = req.params
  const templateVars = { id, longURL: urlDatabase[id] };
  res.render("urls_show", templateVars);
});
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  res.redirect(longURL);
});
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id
  console.log(shortURL)
  res.redirect("/urls");
});
// Define generateRandomString function
function generateRandomString() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 6;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Define getUserByEmail function
function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  res.render("register", { user: user });
});
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Check if email or password is empty
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }

  // Check if email is already registered
  if (getUserByEmail(email)) {
    res.status(400).send("Email already registered");
    return;
  }

  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email: email,
    password: password,
  };

  users[userId] = newUser;

  res.cookie("user_id", userId);
  res.redirect("/urls");
});
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
  if (!user) {
    res.status(403).send("User not found");
    return;
  }
  if (user.password !== password) {
    res.status(403).send("Incorrect password");
    return;
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  res.render("login", { user: user });
});
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
