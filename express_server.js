const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { users, urlDatabase } = require('./database'); 
const { getUserUrls, getUserByEmail, generateRandomString } = require('./helpers'); 

// Configure cookie session middleware
app.use(cookieSession({
  name: 'session',
  keys: ['your-secret-key'],
}));

// Set up body parser middleware
app.use(express.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set("view engine", "ejs");

// Display the root path
app.get("/", (req, res) => {
  const userId = req.session.user_id;
  if (userId && users[userId]) {
    // If the user is logged in, redirect to the "/urls" page
    return res.redirect("/urls");
  } else {
    // If the user is not logged in, redirect to the "/login" page
    return res.redirect("/login");
  }
});

// app.get("/", (req, res) => {
//   res.send("Hello!");
// 
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// Display the URLs page for the logged-in user
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    return res.send("<h1>Please log in or register to view your URLs.</h1>");
  }
  const user = users[userId];

  if (!user) {
    return res.send("<h1>Please log in or register to view your URLs.</h1>");
  }

  const userUrls = getUserUrls(userId);

  const templateVars = { urls: userUrls, user: user };
  res.render("urls_index", templateVars);
});

// Create a new shortened URL
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.status(401).send("You need to be logged in to shorten URLs.");
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();

  console.log("New URL:", longURL, "Shortened URL:", shortURL);

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId,
  };
  console.log("URL Database:", urlDatabase); // Log the updated database
  
  res.redirect("/urls");
});

// Display the new URL creation page
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.redirect("/login");
  }
  res.render("urls_new", { user });
});

// Display a specific URL page
app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!user) {
    return res.redirect("/login");
  }

  if (!url || url.userID !== userId) {
    return res.status(404).send("<h1>URL Not Found or Access Denied</h1>");
  }

  const templateVars = { shortURL, longURL: url.longURL, user };
  res.render("urls_show", templateVars);
});

// Redirect to the long URL when accessing a short URL
app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url) {
    return res.status(404).send("<h1>URL Not Found</h1>");
  }
  res.redirect(url.longURL);
});

// Delete the URL if it belongs to the logged-in user
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  if (!user) {
    return res.redirect("/login");
  }
  if (!url) {
    return res.status(404).send("<h1>URL Not Found</h1>");
  }
  if (url.userID !== userId) {
    return res.status(403).send("<h1>Access Denied</h1>");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Display the form for editing the long URL
app.get("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!user) {
    return res.redirect("/login");
  }

  if (!url || url.userID !== userId) {
    return res.status(404).send("<h1>URL Not Found or Access Denied</h1>");
  }

  const templateVars = { shortURL, longURL: url.longURL, user };
  res.render("urls_show", templateVars);
});

// Handle the form submission to edit the long URL
app.post("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!user) {
    return res.redirect("/login");
  }

  if (!url || url.userID !== userId) {
    return res.status(404).send("<h1>URL Not Found or Access Denied</h1>");
  }

  // Update the long URL with the value from the form submission
  url.longURL = req.body.longURL;

  res.redirect(`/urls/${shortURL}`);
});

// Display the registration page
app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  res.render("register", { user: user });
});

// Register a new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }

  const existingUser = getUserByEmail(email, users);
  if (existingUser) {
    res.status(400).send("Email already registered");
    return;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    email: email,
    password: hashedPassword,
  };

  users[userId] = newUser;

  req.session.user_id = userId;
  res.redirect("/urls");
});

// Handle the login form submission
app.post("/login", (req, res) => {

  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.status(403).send("User not found");
    return;
  }
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    res.status(403).send("Incorrect password");
    return;
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

// Handle the logout request
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Display the login page
app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  res.render("login", { user: user });
});

// Listen on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
