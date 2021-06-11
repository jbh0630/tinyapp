const { v4: uuidv4 } = require('uuid');

const getUserByEmail = function(email, database) {
  let user;
  for (const data in database) {
    if (database[data].email === email) {
      user = data;
    }
  }
  return user;
};

const urlsForUser = function(id, urlDatabase, users) {
  const foundURL = {};
  let userEmail;
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      foundURL[url] = { 
        longURL: urlDatabase[url].longURL
      };
    };
  }
  userEmail = users[id].email;
  return { foundURL, email: userEmail };
};

const generateId = () => {
  return uuidv4().split('-')[1];
};

module.exports = { getUserByEmail, urlsForUser, generateId };
