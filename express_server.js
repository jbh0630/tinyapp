const express = require('express');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan('dev'));
app.set("view engine", "ejs");

const generateId = () => {
  return uuidv4().split('-')[1];
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = { 
  "userRandomID": {
    id: "aJ48lW", 
    email: "user@example.com", 
    password: "1234"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "123"
  }
}

const urlsForUser = function(id) {
  let foundURL = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      foundURL[url] = { 
        longURL: urlDatabase[url].longURL
      };
    };
  }
  console.log({ foundURL, userId: id });
  return { foundURL, userId: id };
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
  const userId = req.cookies["userId"];
  if (!userId) {
    return res.redirect('/login');
  }
    
  res.render('urls_index', urlsForUser(userId)); 
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["userId"];
  if (!userId) {
    return res.render('login');
  }
  res.render("urls_new", { userId });
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    userId: req.cookies["userId"] };

  res.render("urls_show", templateVars);
});

app.get('/register', (req, res) => {
  const userId = req.cookies["userId"];
  res.render('register', { userId });
});

app.get('/login', (req, res) => {
  const userId = req.cookies["userId"];
  res.render('login', { userId });
});

app.post("/urls", (req, res) => {
  const newLongURL = req.body.longURL;
  const newShortURL = generateId();
  urlDatabase[newShortURL] = { longURL: newLongURL, userID: req.cookies["userId"] };
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.cookies["userId"]) {
    return res.status(401).send('<h1>You must login first!</h1>');
  }
  const toDelete = req.params.shortURL;
  delete urlDatabase[toDelete];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const toEdit = req.params.shortURL;
  urlDatabase[toEdit] = req.body.url;
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  const userId = req.cookies["userId"];
  res.clearCookie('userId', userId);
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
  console.log(req.body.email);
  const email = req.body.email;
  const password = req.body.password;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return res.status(401).send('Email already exist');
    } else if (!email || !password) {
      return res.status(401).send('You must enter an email AND a password');
    }
  }
  
  const newUserId = generateId();
  const newUser = {
    id: newUserId,
    email,
    password
  };

  users[newUserId] = newUser;
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  console.log(req.body.email);
  const email = req.body.email;
  const password = req.body.password;

  let foundUser;

  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
    }
  }

  if (!foundUser) {
    return res.status(401).send('You entered invalid Email or Password! Try Again!');
  }

  if (foundUser.password !== password) {
    return res.status(401).send('Incorrect Password. Try Again!');
  }

  res.cookie('userId', foundUser.id);
  res.redirect('/urls');

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});