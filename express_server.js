const express = require('express');
const app = express();
const PORT = 8080;
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['asdfdsf', 'key2']
}));

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
    password: "$2b$10$4Ve79F5wczm0nfSMzcoR8.3leFqUGuHKCESkSNY6JEqchUpsOy0cK"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "$2b$10$2wkYZRbPTGL9RdSLxxSrq.1.pt4IU.euC/W/dMRyg5bcW1NepqT2y"
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
  const userId = req.session.userId;
  if (!userId) {
    return res.redirect('/login');
  }
    
  res.render('urls_index', urlsForUser(userId)); 
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.redirect('/login');
  }
  res.render("urls_new", { userId });
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    userId: req.session.userId };

  res.render("urls_show", templateVars);
});

app.get('/register', (req, res) => {
  const userId = req.session.userId;
  res.render('register', { userId });
});

app.get('/login', (req, res) => {
  const userId = req.session.userId;
  res.render('login', { userId });
});

app.post("/urls", (req, res) => {
  let newLongURL = req.body.longURL;
  if (!newLongURL.includes('http://')) {
    newLongURL = 'http://' + newLongURL;
  }
  const newShortURL = generateId();
  urlDatabase[newShortURL] = { longURL: newLongURL, userID: req.session.userId };
  res.redirect('/urls');
});

app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('<h1>You must login first!</h1>');
  }
  const toDelete = req.params.shortURL;
  delete urlDatabase[toDelete];
  res.redirect('/urls');
});

app.post('/urls/:shortURL/edit', (req, res) => {
  const toEdit = req.params.shortURL;
  let longURL = req.body.url;
  if (!(longURL).includes('http://')) {
    longURL = 'http://' + longURL;
  }
  urlDatabase[toEdit].longURL = longURL;
  res.redirect('/urls');
});

app.post('/register', (req, res) => {
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

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      const newUser = {
        id: newUserId,
        email,
        password: hash
      };
      users[newUserId] = newUser;
      res.redirect('/login');
    });
  });
});

app.post('/login', (req, res) => {
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

  bcrypt.compare(password, foundUser.password, (err, result) => {
    if (!result) {
      return res.status(401).send('Incorrect Password. Try Again!');
    }
    console.log(password);
    console.log(foundUser.password);
    req.session.userId = foundUser.id;
    res.redirect('/urls');
  });
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});