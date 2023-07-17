const assert = require('chai').assert;
const helpers = require('../helpers');

describe('getUserByEmail', function() {
  const testUsers = {
    "userRandomID": {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
      id: "user2RandomID",
      email: "user2@example.com",
      password: "dishwasher-funk"
    }
  };

  it('should return a user with valid email', function() {
    const user = helpers.getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it('should return undefined for non-existent email', function() {
    const user = helpers.getUserByEmail("nonexistent@example.com", testUsers);
    assert.isUndefined(user);
  });
});
