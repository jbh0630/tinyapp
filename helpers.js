const getUserByEmail = function(email, database) {
  let user;
  for (const data in database) {
    if (database[data].email === email) {
      user = data;
    }
  }
  return user;
};

module.exports = { getUserByEmail };
