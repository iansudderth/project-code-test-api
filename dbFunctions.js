const _ = require("lodash");
const Promise = require("bluebird");
const sanitizer = require("sanitizer");
const mongoSanitizer = require("mongo-sanitize");
const swearjar = require("swearjar");

const pollSchema = require("./PollResponse");
const PollResponse = pollSchema.PollResponse;
const CurrentPoll = require("./CurrentPoll");

const sanitizeEntry = entry => {
  let response = sanitizer.escape(entry);
  response = mongoSanitizer(response);
  return response;
};

const safeLanguage = entry => !swearjar.profane(entry);

const generateResults = (limit = 10) => {
  return PollResponse.find({})
    .sort({ count: "desc" })
    .limit(limit)
    .select({ _id: false, __v: false });
};

const addResponse = response =>
  new Promise((resolve, reject) => {
    if (safeLanguage(response)) {
      const sanitizedResponse = sanitizeEntry(response);
      PollResponse.findOne({ response: sanitizedResponse })
        .then(found => {
          console.log(found);
          if (found) {
            found.count = found.count + 1;
            found
              .save()
              .then(() => {
                resolve({
                  message: "duplicate found and incremented"
                });
              })
              .catch(err => {
                reject(err);
              });
          } else {
            const newResponse = new PollResponse({
              response,
              count: 1
            });
            newResponse
              .save()
              .then(savedResponse => {
                resolve({
                  message: "response created"
                });
              })
              .catch(error => {
                reject(error);
              });
          }
        })
        .catch(error => {
          reject(error);
        });
    } else {
      reject({
        profanity: true,
        error: "did not pass profanity filter"
      });
    }
  });

const resetPoll = newPollText => {
  let sanitizedText = sanitizer.sanitize(newPollText);
  sanitizedText = mongoSanitizer(sanitizedText);
  return new Promise((resolve, reject) => {
    CurrentPoll.remove({})
      .then(() => {
        console.log("poll cleared");
        const newPoll = new CurrentPoll();
        newPoll.text = sanitizedText;
        newPoll
          .save()
          .then(response => {
            resolve({
              message: "poll set to new value"
            });
          })
          .catch(err => {
            console.log(err);
            reject({
              message: "database error"
            });
          });
      })
      .error(err => {
        console.log(err);
        reject({
          message: "database error"
        });
      });
  });
};

const getCurrentPoll = () => {
  return new Promise((resolve, reject) => {
    CurrentPoll.findOne({})
      .then(response => {
        console.log(response);
        if (response) {
          resolve({
            currentPoll: response.text
          });
        } else {
          reject({
            error: "no current poll set"
          });
        }
      })
      .catch(err => {
        console.log(err);
        reject({
          error: "database error"
        });
      });
  });
};

module.exports.generateResults = generateResults;
module.exports.addResponse = addResponse;
module.exports.resetPoll = resetPoll;
module.exports.getCurrentPoll = getCurrentPoll;
