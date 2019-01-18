const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);

const cors = require('cors')

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Creating Schema to Store the Usernames
var userSchema = new mongoose.Schema({
  username: String,
  counter: { type: Number, default: 0 },
  log: [{
    description : String,
    duration : Number,
    date : Date  
  }]
},{
    versionKey: false
});

// userSchema.plugin(AutoIncrement, {inc_field: 'counter'} );

// Create user schema
var User = mongoose.model('User', userSchema);

// Post new user
app.post("/api/exercise/new-user", function(req,res) {
  var username = req.body.username;
  console.log(req.body);
  
  // Checking if a username already exists
  User.findOne( { username: username }, function(err, doc) {
     if (doc) {
        res.send('username already taken');
     } else {
        var newUsername = new User({
          username: username
        });

        // Saving shortened url
        newUsername.save();
        res.json({
          "username" : newUsername.username,
          "_id" : newUsername._id
        });
     }
  });
});

// Get all users
app.get("/api/exercise/users", function(req,res) {
  
  // Checking if a username already exists
  User.find({}, function(err, users) {
    var userMap = [];

    users.forEach(function(user) {
      // userMap[user._id] = user;
      userMap.push( { "username" : user.username, "_id" : user._id } );
    });

    res.send(userMap);  
  });
});

// Get exercise list
app.get("/api/exercise/log/", function(req,res) {
  console.log(req.query);
  var userId = req.query.userId;
  var from = req.query.from;
  var to = req.query.to;
  var limit = req.query.limit;
  
  // TODO : Filter by date
  // TODO : Limit query
  
  console.log(userId);
  User.find( { "_id" : userId }, function(err, doc) {
    res.json(doc);
  });
});

// Post exercices
app.post("/api/exercise/add", function(req,res) {
  var userId = req.body.userId;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date ? req.body.date : Date.now();
    
  if ( !userId || !description || !duration ) {
     res.send('UserId, Description and Duration are required fields to log an exercise');
     return; 
  }
  
  var log = {
      description: description,
      duration: duration,
      date: date
    };
  
  // Pushing exercise to collection and incrementing counter by one.
  User.findByIdAndUpdate(userId, { $push: { log: log }, $inc: { counter: 1 } }, { "new": true }, function(err, user) {
    if ( err ) res.send('something went wrong');
    res.json({ 
      "username": user.username,
      "_id" : user._id,
      "description": description,
      "duration" : duration,
      "date" : date
    });
  });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
