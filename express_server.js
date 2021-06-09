const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid');


app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send('Hello!');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const username = req.cookies["username"];
  res.render("urls_new", { username });
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const vars = {
    username: req.cookies["username"],
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render('urls_show', vars);
});

app.post("/urls", (req, res) => {
  const newLongURL = req.body.longURL;
  const newShortURL = uuidv4().split('-')[1];
  urlDatabase[newShortURL] = newLongURL;
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const toDelete = req.params.shortURL;
  delete urlDatabase[toDelete];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const toEdit = req.params.shortURL;
  urlDatabase[toEdit] = req.body.url;
  res.redirect('/urls');
});

app.post('/urls/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post('/urls/logout', (req, res) => {
  const username = req.body.username;
  res.clearCookie('username', username);
  res.redirect('/urls');
});

app.post('/urls/error', (req, res) => {
  res.send('<h1>You should login first!<h1>');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});