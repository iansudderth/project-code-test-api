const mongoose = require("mongoose");
const bluebird = require("bluebird");

const Schema = mongoose.Schema;
mongoose.Promise = bluebird;

const pollResponseSchema = {
  response: String,
  count: Number
};

const PollResponse = mongoose.model("PollResponse", pollResponseSchema);

const clearPoll = () => {
  return PollResponse.remove({})
    .then(res => {
      console.log("polls removed");
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports.PollResponse = PollResponse;
module.exports.clearPoll = clearPoll;
