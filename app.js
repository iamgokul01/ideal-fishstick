const express = require("express");
const app = express();
app.use(express.json());
let sqlite3 = require("sqlite3");
let { open } = require("sqlite");
let path = require("path");
let dbPath = path.join(__dirname, "/userData.db");
let db = null;
let bcrypt = require("bcrypt");
const initServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Started"));
  } catch (e) {
    console.log(e.message);
  }
};

initServer();
const checkChar = (pwd) => {
  return pwd.length > 5;
};
app.post("/register", async (request, response) => {
  let data = request.body;
  let { username, name, password, gender, location } = data;

  if (checkChar(password) === false) {
    response.status(400);
    response.send("Password is too short");
  }
  let encrypted = await bcrypt.hash(password, 5);
  let user = null;
  let userValidateQuery = `select * from user where username = '${username}';`;

  let isExsistingUser = await db.get(userValidateQuery);
  console.log(isExsistingUser);

  if (isExsistingUser === undefined) {
    if (checkChar(password) === true) {
      let hashedPassword = await bcrypt.hash(password, 5);
      let addUserQuery = `
        insert into user values('${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}')
        `;
      let added = await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  let data = request.body;
  let { username, password } = data;
  let checkUserQuery = `select * from user where username = '${username}';`;
  let checkUser = await db.get(checkUserQuery);
  if (checkUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    console.log(checkUser);
    let res = await bcrypt.compare(password, checkUser.password);
    if (res) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.post("/change-password", async (request, response) => {
  let data = request.body;
  let { username, oldPassword, newPassword } = data;
  console.log(data);
  let validatePasswordQuery = `select * from user where username = '${username}';`;
  let validatePassword = await db.get(validatePasswordQuery);
  let checkPass = await bcrypt.compare(oldPassword, validatePassword.password);
  if (checkPass) {
    if (newPassword.length > 5) {
      let newPassHash = await bcrypt.hash(newPassword, 15);
      console.log(await bcrypt.compare(newPassHash, newPassword));
      let passUpdateQuery = `update user set password = '${newPassHash}' 
      where username = '${username}';`;
      await db.run(passUpdateQuery);
      response.send("Password updated");
      response.status(200);
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("Invalid current Password");
  }
});

module.exports = app;
