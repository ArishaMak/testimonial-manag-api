//для счетчика решила создать отдельную коллекцию, тем самым немного отошла от заявленной в тз диррект
const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    _id: String,
    seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', CounterSchema);