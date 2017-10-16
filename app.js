const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const sanitizer = require("sanitizer");
const cors = require("cors");

const port = process.env.PORT || 3000;
const apiPassword = process.env.PASSWORD || "password";
const adminPassword = process.env.ADMIN || "change-it-up";

const pollSchema = require("./PollResponse");
const PollResponse = pollSchema.PollResponse;
const clearPoll = pollSchema.clearPoll;
const dbFunctions = require("./dbFunctions");
const generateResults = dbFunctions.generateResults;
const addResponse = dbFunctions.addResponse;
const resetPoll = dbFunctions.resetPoll;
const getCurrentPoll = dbFunctions.getCurrentPoll;

const dburl = process.env.DBURL || "mongodb://localhost/poll";
mongoose.connect(dburl, { useMongoClient: true });

if (_.includes(process.argv, "--seed")) {
  resetPoll("What is your favorite food?");
}

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    response: "Yo."
  });
});

app.get("/poll", (req, res) => {
  getCurrentPoll()
    .then(response => {
      res.json({
        currentPoll: response.currentPoll
      });
    })
    .catch(error => {
      res.json({ error });
    });
});

app.get("/poll/results", (req, res) => {
  let limit = req.query.limit || 10;
  limit = parseInt(limit, 10);
  generateResults(limit)
    .then(results => {
      res.json({ results });
    })
    .catch(error => {
      console.log(error);
      res.json({ results: "error" });
    });
});

app.post("/poll", (req, res) => {
  const usrPassword = sanitizer.sanitize(req.body.password);
  const usrPollResponse = req.body.response;
  if (apiPassword != usrPassword) {
    res.json({
      error: "incorrect password"
    });
  } else if (!usrPollResponse) {
    res.json({
      error: "no response provided"
    });
  } else {
    addResponse(usrPollResponse)
      .then(result => {
        console.log(result.message);

        res.json({
          response: "response added"
        });
      })
      .catch(err => {
        console.log(err);
        if (err.profanity) {
          res.json({
            error: "profanity"
          });
        } else {
          res.json({
            error: "database error"
          });
        }
      });
  }
});

app.post("/poll/clear", (req, res) => {
  if (req.body.password === adminPassword) {
    clearPoll();
    res.json({
      message: "cleared database"
    });
  } else {
    res.json({
      message: "incorrect password"
    });
  }
});

app.post("/poll/change", (req, res) => {
  if (req.body.password === adminPassword) {
    clearPoll();
    if (req.body.newpoll) {
      resetPoll(req.body.newpoll)
        .then(response => {
          res.json(response);
        })
        .catch(error => {
          console.log(error);
          if (error.message) {
            res.json(error);
          }
        });
    }
  } else {
    res.json({
      error: "no new poll question passed"
    });
  }
});

app.get("/", (req, res) => {
  res.redirect("/poll");
});

app.listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on port ${port}`);
});
