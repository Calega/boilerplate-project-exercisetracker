const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
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
  description: String,
  duration: Number,
  date: { type: Date, default: Date.now }
});

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

// Post exercices
app.post("/api/exercise/add", function(req,res) {
  var userId = req.body.userId;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date;
  
  // TODO : Format the date to the same format used on the FCC template
  
  if ( !userId || !description || !duration ) {
     res.send('UserId, Description and Duration are required fields to log a exercise');
     return; 
  }
  
  // Find by Id
  User.findById(userId, function(err, user) {
    
    user.description = description;
    user.duration = duration;
    user.date = date ? date : Date.now;
    
    // Saving
    user.save();
    
    // Returning
    res.json({
      "username" : user.username,
      "description" : user.description,
      "duration" : user.duration,
      "date" : user.date,
      "_id" : user._id
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
