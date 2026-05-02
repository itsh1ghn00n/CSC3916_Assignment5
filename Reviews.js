const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  username: String,
  review: String,
  rating: { type: Number, min: 0, max: 5 },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
