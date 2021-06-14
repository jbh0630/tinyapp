//Required libraries
const express = require('express');
const app = express();
const PORT = 8080;
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { urlsForUser, generateId } = require('./helpers');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['asdfdsf', 'key2']
}));

//dummy database
const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = { 
  "aJ48lW": {
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

//default page
app.get("/", (req, res) => {
  const email = req.session.email;
  if (!email) {
    return res.status(401).send('<h1>You must login first!</h1><a href="/login">Go to login page</a>');
  } 
  res.redirect('/urls');
});

//if user logged in, find the data from database that matches with logged in users data
app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send('<h1>You must login first!</h1><a href="/login">Go to login page</a>');
  }
    
  res.render('urls_index', urlsForUser(userId, urlDatabase, users)); 
});

//if user logged in, go to create url page
app.get("/urls/new", (req, res) => {
  const email = req.session.email;

  if (!email) {
    return res.status(401).send('<h1>You must login first!</h1><a href="/login">Go to login page</a>');
  }
  res.render("urls_new", { email });
});

//if user logged in, go to long url page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.status(404).send(`<h1>You do not have such "${shortURL}", Try others!</h1><a href="/urls">Go to main page</a>`);
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;

  const email = req.session.email;

  if (!email) {
    return res.status(401).send('<h1>You must login first!</h1><a href="/login">Go to login page</a>');
  }
  res.redirect(longURL);
});

//if user logged in, go to url edit page
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    return res.status(404).send(`<h1>You do not have such "${shortURL}", Try others!</h1><a href="/urls">Go to main page</a>`);
  }
  const email = req.session.email;
  if (!email) {
    return res.status(401).send('<h1>You must login first!</h1><a href="/login">Go to login page</a>');
  }
  const templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL].longURL,
    userId: req.session.userId, 
    email : req.session.email
  };

  res.render("urls_show", templateVars);
});

//go to register page
app.get('/register', (req, res) => {
  const email = req.session.email;
  res.render('register', { email });
});

//go to login page
app.get('/login', (req, res) => {
  const email = req.session.email;
  res.render('login', { email });
});

//go to main page
app.post("/urls", (req, res) => {
  const newShortURL = generateId();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.userId };
  res.redirect('/urls');
});

//if user logged in and click edit button, post delete url
app.post('/urls/:shortURL/delete', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('<h1>You must login first!</h1><a href="/login">Go to login page</a>');
  }
  const toDelete = req.params.shortURL;
  delete urlDatabase[toDelete];
  res.redirect('/urls');
});

//if user logged in and click delete button, post edit url
app.post('/urls/:shortURL/edit', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).send('<h1>You must login first!</h1><a href="/login">Go to login page</a>');
  }
  const toEdit = req.params.shortURL;
  const longURL = req.body.url;
  
  urlDatabase[toEdit].longURL = longURL;
  res.redirect('/urls');
});

//handling register page
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
      req.session.userId = newUserId;
      req.session.email = email;
      return res.redirect('/urls');
    });
  });
});

//handling login page
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
    req.session.email = foundUser.email;
    req.session.userId = foundUser.id;
    res.redirect('/urls');
  });
});

//if user click logout button, set the session as null
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//check the port that app running on 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});