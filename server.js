const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var mongoose = require("mongoose")


const bodyParser = require("body-parser");
const router = express.Router();


app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use(cors())
app.use(express.static('public'))

//model setup
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true })
.catch(err=> {
  console.error(err.stack)
  process.exit(1)
})
.then(
  app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + (process.env.PORT || 3000))
}))

const userSchema = new mongoose.Schema({
  username: String,
  count: { type: Number, default: 0},
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
}
)

var User = mongoose.model('User', userSchema);

var createAndSaveUser = function(username, done) {
  var u = new User({username: username});

  u.save(function(err, data) {
    if (err) return console.error(err);
    done(null, data)
  });
};




//apis
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/test', (req, res) => {
  res.send("success")
}
)

app.post('/api/users', (req,res) => {

  User.findOne({username: req.body.username}, (err, userFound) => {
    console.log(userFound)
    if (err) return console.log(err)
    if (userFound) {
      return res.send("username taken up")
    } else {
      createAndSaveUser(req.body.username,
        function (err, data) {
          if (err) {return err}
        res.send(data)
        })
      }
    })
  })
          



app.get('/api/users', (req,res) => {
  console.log("api")
  User.find({}, function(err, users) {
    var userMap = [];

    users.forEach(function(user) {
      userMap.push(
        {
          username:user.username,
          _id:user._id.toString()
        }
      )
    });

    res.send(userMap);  
  });
})

app.post('/api/users/:_id/exercises', (req,res) => {
  var id =  new mongoose.Types.ObjectId(req.params._id)
  User.findById(id, (err, user) => {
    if (err) return console.log(err)

    var date = new Date(req.body.date)
    if (date.getTime() !== date.getTime()) {
      return res.send("Invalid Date")
    }
    
    if (typeof req.body.duration !== "number") {
      return res.send("Duration should be a number")
    }

    user.log.push({
      description: req.body.description,
      duration: req.body.duration,
      date: date.toDateString(),
    })

    user.count = user.log.length

    user.save((err,updatedUser) => {
      if(err) return console.log(err);
      var exercise = updatedUser.log[updatedUser.log.length-1]
      console.log(exercise)
      var result = {
        username: updatedUser.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date,
        _id: updatedUser._id.toString()
      }
      res.send(result)
    })
  })
});

app.get('/api/users/:_id/logs', (req,res) => {
  var id =  new mongoose.Types.ObjectId(req.params._id)
  var from = req.query.from
  var to = req.query.to
  var limit = req.query.limit
  User.findById(id, (err, user) => {
    if (err) return console.log(err)
    var newlogs = [...user.log]
    if (from) {
      var dateFrom = new Date(from)
      newlogs = newlogs.filter((x) => (
        x.date > dateFrom
      ))
    }

    if (to) {
      var dateTo = new Date(to)
      newlogs = newlogs.filter((x) => {
        x.date > dateTo
      })
    }
    newlogs = newlogs.sort((a,b) => a.date > b.date).map(x => ({
      description: x.description,
      duration: x.duration,
      date: x.date
    }))
    var count = newlogs.length
    if (newlogs.length > limit) {
      newlogs.length = limit
    }



    res.json({
      _id:id,
      username:user.username,
      count: count,
      log: newlogs
    })
})
})


