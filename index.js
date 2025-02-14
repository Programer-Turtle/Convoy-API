// index.js
const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs')
const argon2 = require('argon2');
const { v4: uuidv4 } = require("uuid");
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send("<h1>Convoy Backend</h1><p>This is the backend server for Convoy. This is were location and account data is sent.</p>")
})

Data = {
}

async function hashPassword(password) {
  const hash = await argon2.hash(password);
  return hash
}

async function CheckToken(username, token) {
  if(Data["Accounts"][username]["Token"] == token){
    return true
  }
  else{
    return false
  }
}


app.post('/signup', async (req, res) => {
  let {username, password} = req.body
  try{
    if(Data["Accounts"][username]){
      res.status(409).json({error:"Account Already Exist"})
    }
    else{
      Data["Accounts"][username] = {
        "Password": await hashPassword(password),
        "Latitude":0,
        "Longitude":0,
        "Token":0,
        "Convoy":null
      }
      res.status(200)
    }
  }
  catch(error){
    res.status(500).json({error:error})
  }
});

app.post('/login', async (req, res) => {
  let {username, password} = req.body
  try{
    if(Data["Accounts"][username]){
      const isMatch = await argon2.verify(Data["Accounts"][username]["Password"], password);
      if(isMatch){
        Token = uuidv4()
        Data["Accounts"][username]["Token"] = Token
        res.status(200).json({Token:Token})
      }
      else{
        res.status(401).json({error:"Wrong Password."})
      }
    }
    else{
      res.status(404).json({error:"Account Not Found."})
    }
  }
  catch(error){
    res.status(500).json({error:error})
  }
});

app.post('/verify', async (req, res) => {
  let {username, token} = req.body
  try{
    if(await CheckToken(username, token)){
      res.status(200)
    }
    else{
      res.status(401).json({error:"Token is invalid."})
    }
  }
  catch(error){
    res.status(500).json({error:error})
  }
})

app.post('/createconvoy', async (req, res) => {
  let {username, token, convoypassword} = req.body
  try{
    if(await CheckToken(username, token)){
      if(Data["Accounts"][username]["Convoy"] == null){
        ConvoyID = Data["NOCM"]
        Data["NOCM"]++
        Data["Convoys"][ConvoyID] = {
          "Members":[username],
          "Password":convoypassword
        }
        Data["Accounts"][username]["Convoy"] = ConvoyID
        res.status(200)
      }
      else{
        res.status(401).json({error:"You're already in a convoy."})
      }
    }
    else{
      res.status(401).json({error:"Token is invalid."})
    }
  }
  catch(error){
    res.status(500).json({error:error})
  }
})

const port = 3000;

function saveDataToFile() {
  fs.writeFile('data.json', JSON.stringify(Data, null, 2), (err) => {
      if (err) {
          console.error('Error saving data:', err);
      } else {
          console.log('Data saved to data.json');
      }
  });
}

function loadDataFromFile() {
  try {
      if (fs.existsSync('data.json')) { // Check if the file exists
          const fileContent = fs.readFileSync('data.json', 'utf8'); // Read file synchronously
          Data = JSON.parse(fileContent); // Parse JSON and set to Data
          console.log('Data loaded from data.json:', Data);
      } else {
          console.log('data.json does not exist. Using default Data.');
      }
  } catch (error) {
      console.error('Error reading data.json:', error);
  }
}

async function StartServer(){
  loadDataFromFile()
  setInterval(saveDataToFile, 3000);
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
  if(!Data["Accounts"]){
    Data["Accounts"] = {}
  }
  if(!Data["Convoys"]){
    Data["Convoys"] = {}
  }
  if(!Data["NOCM"]){
    Data["NOCM"] = 0
  }
}

StartServer()