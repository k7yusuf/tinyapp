const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const helpers = require('./helpers');

app.use(cookieSession({
  name: 'session',
  keys: ['your-secret-key'],
}));
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "$2a$10$ddG2QnQP6hOAqjHq0E35UeWCl8foV0935Wv/2OQzbn/RelkELzE/y",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "b@b.com",
    password: "$2a$10$ddG2QnQP6hOAqjHq0E35UeWCl8foV0935Wv/2OQzbn/RelkELzE/y",
  },
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// app.get("/", (req, res) => {
//   res.send("Hello!");
// 
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

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
function getUserUrls(userId) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userId) {
      userUrls[shortURL] = {
        shortURL,
        userId,
        longURL: urlDatabase[shortURL].longURL
      }
    }
  }
  return userUrls;
}

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

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.status(401).send("You need to be logged in to shorten URLs.");
  }
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userId,
  };
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    return res.redirect("/login");
  }
  res.render("urls_new", { user });
});

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

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (!url) {
    return res.status(404).send("<h1>URL Not Found</h1>");
  }
  res.redirect(url.longURL);
});

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

app.get("/register", (req, res) => {
  const userId = req.session.user_id;
  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  res.render("register", { user: user });
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty");
    return;
  }

  const existingUser = helpers.getUserByEmail(email, users);
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

app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  res.send("Ok"); // Respond with 'Ok' (we will replace this)
});

app.post("/login", (req, res) => {

  const { email, password } = req.body;
  const user = helpers.getUserByEmail(email, users);
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

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  const userId = req.session.user_id;
  if (userId && users[userId]) {
    return res.redirect("/urls");
  }
  const user = users[userId];
  res.render("login", { user: user });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
