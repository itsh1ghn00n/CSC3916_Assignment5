require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Movie = require('./Movies');
const Review = require('./Reviews');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

const router = express.Router();

router.post('/signup', async (req, res) => { // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({ success: false, msg: 'Please include both username and password to signup.' }); // 400 Bad Request
  }

  try {
    const user = new User({ // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res.status(201).json({ success: true, msg: 'Successfully created new user.' }); // 201 Created
  } catch (err) {
    if (err.code === 11000) { // Strict equality check (===)
      return res.status(409).json({ success: false, message: 'A user with that username already exists.' }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
    }
  }
});


router.post('/signin', async (req, res) => { // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select('name username password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Authentication failed. User not found.' }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, { expiresIn: '1h' }); // Add expiry to the token (e.g., 1 hour)
      res.json({ success: true, token: 'JWT ' + token });
    } else {
      res.status(401).json({ success: false, msg: 'Authentication failed. Incorrect password.' }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again later.' }); // 500 Internal Server Error
  }
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, async (req, res) => {
      try {
          const aggregate = [
            {
              $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'movieId',
                as: 'movieReviews'
              }
            },
            {
              $addFields: {
                avgRating: { $round: [{ $avg: '$movieReviews.rating' }, 1] }
              }
            },
            {
              $sort: { avgRating: -1 }
            }
          ];

          const movies = await Movie.aggregate(aggregate);
          res.json(movies);
      } catch (err) {
          console.error(err);
          res.status(500).json({ success: false, message: 'Error retrieving movies' });
      }
    })
    .post(authJwtController.isAuthenticated, async (req, res) => {
      try {
          if (!req.body.title || !req.body.actors) {
              return res.status(400).json({ success: false, message: 'Missing required fields' });
          }
          const existingMovie = await Movie.findOne({ title: req.body.title });

          if (existingMovie) {
            return res.status(409).json({ success: false, message: 'Movie already exists' });
          }

          const movie = new Movie(req.body);
          await movie.save();

          res.json(movie);
      } catch (err) {
          console.error(err);
          res.status(500).json({ success: false, message: 'Error saving movie' });
      }
    });

router.get('/movies/:id([0-9a-fA-F]{24})', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const aggregate = [
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.id) }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'movieId',
          as: 'movieReviews'
        }
      },
      {
        $addFields: {
          avgRating: { $round: [{ $avg: '$movieReviews.rating' }, 1] }
        }
      }
    ];

    const movies = await Movie.aggregate(aggregate);
    if (movies.length === 0) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    res.json(movies[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving movie' });
  }
});

router.post('/movies/search', authJwtController.isAuthenticated, async (req, res) => {
  const { query } = req.body;

  try {
    const aggregate = [
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { 'actors.actorName': { $regex: query, $options: 'i' } }
          ]
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'movieId',
          as: 'movieReviews'
        }
      },
      {
        $addFields: {
          avgRating: { $round: [{ $avg: '$movieReviews.rating' }, 1] }
        }
      }
    ];

    const movies = await Movie.aggregate(aggregate);
    res.json(movies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/movies/:title', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const movie = await Movie.findOne({ title: req.params.title });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    if (req.query.reviews === 'true') {
      const reviews = await Review.find({ movieId: movie._id });

      return res.json({
        movie,
        reviews
      });
    }

    res.json(movie);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving movie' });
  }
});

router.delete('/movies/:title', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const result = await Movie.deleteOne({ title: req.params.title });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    res.json({ success: true, message: 'Movie deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

router.put('/movies/:title', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const updated = await Movie.findOneAndUpdate(
      { title: req.params.title },
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

router.put('/movies/:id', authJwtController.isAuthenticated, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }

    const updated = await Movie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(updated);

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

router.get('/reviews', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const reviews = await Review.find();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving reviews' });
  }
});

router.post('/reviews', authJwtController.isAuthenticated, async (req, res) => {
  try {
    const { movieId, review, rating } = req.body;
    const username = req.user.username;

    if (!movieId || !review || rating === undefined) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const newReview = new Review({ movieId, username, review, rating });
    await newReview.save();

    res.json({ success: true, message: 'Review created!', review: newReview });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating review' });
  }
});
app.use('/', router);

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only