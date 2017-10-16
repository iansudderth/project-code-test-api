const mongoose = require("mongoose");
const bluebird = require("bluebird");

const Schema = mongoose.Schema;
mongoose.Promise = bluebird;

const currentPollSchema = {
  text: String
};

const CurrentPoll = mongoose.model("CurrentPoll", currentPollSchema);

module.exports = CurrentPoll;
