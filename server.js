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
  count: Number,
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
  createAndSaveUser(req.body.username,
  function (err, data) {
    if (err) {
      return err;
    }
      res.send(data)
  })
})


/*app.post('/api/users/:_id/exercises', (req,res) => {
  console.log("posted")
  res.send({
    id: req.params._id,
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date,
  })
})*/

app.post('/api/users/:_id/exercises', (req,res) => {
  console.log(req.params._id)
  var a = req.params._id
  var id =  new mongoose.Types.ObjectId(a)
  console.log(id)
  User.findById(id, (err, user) => {
    if (err) return console.log(err)
    user.log.push({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date,
    })
    user.save((err,updatedUser) => {
      if(err) return console.log(err);
      res.send(updatedUser)
    })
  })
})

;


