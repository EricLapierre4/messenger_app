const express = require("express");
const app = express();
let bParser = require("body-parser");
//let morgan = require("morgan");
let cors = require("cors");
app.use(bParser.raw({ type: "*/*" }));
//app.use(morgan("combined"));
app.use(cors());

app.get("/sourcecode", (req, res) => {
  res.send(
    require("fs")
      .readFileSync(__filename)
      .toString()
  );
});

app.listen(process.env.PORT || 3000);

let passwords = new Map();
let tokenMap = new Map();
let channels = new Map();
let channelMembers = new Map();
let channelBans = new Map();
let channelMessages = new Map();
let userToken = new Map();

// code to parse JSON from req body
// let parsed = JSON.parse(req.body);

//Good to go
app.post("/signup", (req, res) => {
  try {
    let parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  let parsed = JSON.parse(req.body);

  let success = { success: true };
  let failDupUser = { success: false, reason: "Username exists" };
  let failNoPass = { success: false, reason: "password field missing" };
  let failNoUser = { success: false, reason: "username field missing" };

  if (passwords.has(parsed.username)) {
    res.send(failDupUser);
    return;
  } else if (parsed.password == null) {
    res.send(failNoPass);
    return;
  } else if (parsed.username == null) {
    res.send(failNoUser);
    return;
  } else {
    passwords.set(parsed.username, parsed.password);
    res.send(success);
    return;
  }
});

//Good to go
app.post("/login", (req, res) => {
  try {
    let parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  let parsed = JSON.parse(req.body);

  let success = { success: true, token: "unique-token-" + Date.now() };
  let failNoUser = { success: false, reason: "User does not exist" };
  let failWrongPass = { success: false, reason: "Invalid password" };
  let failMissingPass = { success: false, reason: "password field missing" };
  let failMissingUser = { success: false, reason: "username field missing" };

  if (!parsed.password) {
    res.send(failMissingPass);
    return;
  }

  if (!parsed.username) {
    res.send(failMissingUser);
  }

  if (!passwords.has(parsed.username)) {
    res.send(failNoUser);
    return;
  }

  if (passwords.get(parsed.username) === parsed.password) {
    res.cookie("id", success.token);
    tokenMap.set(success.token, parsed.username);
    userToken.set(parsed.username, success.token);
    res.send(success);
    return;
  } else if (passwords.get(parsed.username) !== parsed.password) {
    res.send(failWrongPass);
    return;
  }
});

//Good to go
app.post("/create-channel", (req, res) => {
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  if (!parsed.channelName) {
    res.send({ success: false, reason: "channelName field missing" });
    return;
  }

  if (channels.has(parsed.channelName)) {
    res.send({ success: false, reason: "Channel already exists" });
    return;
  }

  if (tokenMap.has(token)) {
    channels.set(parsed.channelName, token);
    channelMembers.set(parsed.channelName, []);
    channelBans.set(parsed.channelName, []);
    channelMessages.set(parsed.channelName, []);
    res.send({ success: true });
  } else {
    res.send({ success: false, reason: "Invalid token" });
  }
});

//Good to go for now
app.post("/join-channel", (req, res) => {
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  if (!parsed.channelName) {
    res.send({ success: false, reason: "channelName field missing" });
    return;
  }
  if (!channels.has(parsed.channelName)) {
    res.send({ success: false, reason: "Channel does not exist" });
    return;
  }

  if (tokenMap.has(token)) {
    if (channels.has(parsed.channelName)) {
      let members = channelBans.get(parsed.channelName);

      for (let i = 0; i < members.length; i++) {
        if (members[i] === tokenMap.get(token)) {
          res.send({ success: false, reason: "User is banned" });
          return;
        }
      }

      members = channelMembers.get(parsed.channelName);

      for (let i = 0; i < members.length; i++) {
        if (members[i] === tokenMap.get(token)) {
          res.send({ success: false, reason: "User has already joined" });
          return;
        }
      }

      members.push(tokenMap.get(token));
      res.send({ success: true });
      return;
    }
  } else {
    res.send({ success: false, reason: "Invalid token" });
  }
});

//Good to go for now
app.post("/leave-channel", (req,res) => {
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  if (!parsed.channelName) {
    res.send({ success: false, reason: "channelName field missing" });
    return;
  }
  if (!channels.has(parsed.channelName)) {
    res.send({ success: false, reason: "Channel does not exist" });
    return;
  }
  
  if (tokenMap.has(token)) {
    if (channels.has(parsed.channelName)) {
      
      let members = channelMembers.get(parsed.channelName);
      
      for (let i = 0; i < members.length; i++) {
        if (members[i] === tokenMap.get(token)) {
          members.splice(i,1);
          res.send({"success":true});
          return;
        }
      }
      
      res.send({"success":false,"reason":"User is not part of this channel"});
      return;
    }
  } else {
    res.send({ success: false, reason: "Invalid token" });
    return;
  }
  
});


app.get("/joined", (req, res) => {
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = req.query.channelName;
  } catch (e) {
    res.send("No query parameter");
    return;
  }

  if (!channels.has(parsed)) {
    res.send({ success: false, reason: "Channel does not exist" });
    return;
  }

  if (tokenMap.has(token)) {
    if (channels.has(parsed)) {
      let members = channelMembers.get(parsed);
      if (members.includes(tokenMap.get(token))) {
        res.send({ success: true, joined: members });
      } else {
        res.send({success: false, reason: "User is not part of this channel"});
        return;
      }
    }
  } else {
    res.send({ success: false, reason: "Invalid token" });
    return;
  }
});

app.post("/delete", (req, res) => {
  
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  if (!parsed.channelName) {
    res.send({ success: false, reason: "channelName field missing" });
    return;
  }
  
  if (tokenMap.has(token)) {
    if (channels.has(parsed.channelName)) {
      if (channels.get(parsed.channelName) === token) {
        channels.delete(parsed.channelName);
        channelMembers.delete(parsed.channelName);
        channelBans.delete(parsed.channelName);
        channelMessages.delete(parsed.channelName);
        res.send({"success":true});
        return;
      } else {
        res.send({ success: false, reason: "Invalid token" });
        return;
      }
    }
  } else {
    res.send({ success: false, reason: "Invalid token" });
    return;
  }
  
  if (!channels.has(parsed.channelName)) {
    res.send({ success: false, reason: "Channel does not exist" });
    return;
  }
  
  
});


app.post("/kick", (req, res) => {
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  if (!parsed.channelName) {
    res.send({ success: false, reason: "channelName field missing" });
    return;
  }

  if (!parsed.target) {
    res.send({ success: false, reason: "target field missing" });
    return;
  }

  if (tokenMap.has(token)) {
    if (channels.has(parsed.channelName)) {
      if (channels.get(parsed.channelName) === token) {
        let members = channelMembers.get(parsed.channelName);

        if (members.includes(parsed.target)) {
          members.splice(members.indexOf(parsed.target));
          res.send({ success: true });
          return;
        }
      } else {
        res.send({ success: false, reason: "Channel not owned by user" });
        return;
      }
    }
  } else {
    res.send({ success: false, reason: "Invalid token" });
    return;
  }

  if (!channels.has(parsed.channelName)) {
    res.send({ success: false, reason: "Channel does not exist" });
    return;
  }
});


app.post("/ban", (req, res) => {
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  if (!parsed.channelName) {
    res.send({ success: false, reason: "channelName field missing" });
    return;
  }

  if (!parsed.target) {
    res.send({ success: false, reason: "target field missing" });
    return;
  }

  if (tokenMap.has(token)) {
    if (channels.has(parsed.channelName)) {
      if (channels.get(parsed.channelName) === token) {
        
        let members = channelBans.get(parsed.channelName);
        members.push(parsed.target);;
        res.send({ success: true });
        return;
        
      } else {
        res.send({ success: false, reason: "Channel not owned by user" });
        return;
      }
    }
  } else {
    res.send({ success: false, reason: "Invalid token" });
    return;
  }

  if (!channels.has(parsed.channelName)) {
    res.send({ success: false, reason: "Channel does not exist" });
    return;
  }

});

app.post("/message", (req, res) => {

  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = JSON.parse(req.body);
  } catch (e) {
    res.send("Not a JSON formatted Body");
    return;
  }

  if (!parsed.channelName) {
    res.send({ success: false, reason: "channelName field missing" });
    return;
  }
  
  if (!parsed.contents) {
    res.send({"success":false,"reason":"contents field missing"});
    return;
  }
  
  let user = tokenMap.get(token);
  let msg = parsed.contents;
  
  if (tokenMap.has(token)) {
    if (channels.has(parsed.channelName)) {
      if (channelMembers.get(parsed.channelName).includes(user) && !channelBans.get(parsed.channelName).includes(user)) {
        let arr = channelMessages.get(parsed.channelName);
        let newMsg = {"from":user, "contents":msg};
        arr.push(newMsg);
        res.send({"success":true});
        return;
      } else {
        res.send({"success":false,"reason":"User is not part of this channel"});
        return;
      }
    } else {
      res.send({"success":false,"reason":"User is not part of this channel"});
    } 
  } else {
    res.send({"success":false,"reason":"Invalid token"});
  }
   
  //res.send("What");
  
});

app.get("/messages", (req, res) => {
  let token;
  let parsed;

  try {
    token = req.headers.token;
  } catch (e) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  if (token === undefined) {
    res.send({ success: false, reason: "token field missing" });
    return;
  }

  try {
    parsed = req.query.channelName;
  } catch (e) {
    res.send("No query parameter");
    return;
  }

  if (parsed === undefined) {
    res.send({"success":false,"reason":"channelName field missing"});
  }
  
  if (!channels.has(parsed)) {
    res.send({ success: false, reason: "Channel does not exist" });
    return;
  }

  if (tokenMap.has(token)) {
    if (channels.has(parsed)) {
      let members = channelMembers.get(parsed);
      if (members.includes(tokenMap.get(token))) {
        res.send({ success: true, messages: channelMessages.get(parsed) });
      } else {
        res.send({success: false, reason: "User is not part of this channel"});
        return;
      }
    }
  } else {
    res.send({ success: false, reason: "Invalid token" });
    return;
  }
})