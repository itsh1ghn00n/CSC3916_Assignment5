Assignment Five
Purpose Links to an external site.

The objective of this assignment is to create a React Single Page Application that interacts with your previously developed API. The application will enable users to search for movies, display information about a selected movie, view stored ratings, and submit a new rating for a movie.
Pre-Requirements Links to an external site.

    Completion and deployment of Assignment 3 (React app supporting SignUp and Logon)
    Completion and deployment of Assignment 4 (API supporting reviews)
    Source code from REACT Links to an external site. from earlier assignment3 
    Clone - https://github.com/AliceNN-ucdenver/CSC3916_Assignment5 Links to an external site. 

Detailed Steps Links to an external site.
1. Updating API to Include Movie Images Links to an external site.

    Expand your MongoDB movie collection by adding a new attribute to store the URL of a movie’s image.
    Update your Movie schema in Mongoose accordingly:

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  releaseDate: { type: Number, min: [1900, 'Must be greater than 1899'], max: [2100, 'Must be less than 2100']},
  genre: { type: String, enum: genres },
  actors: [ActorSchema],
  imageUrl: String,
  // rest of your fields
});

2. Securing All Endpoints with JWT Links to an external site.

    For this assignment, make sure all your API endpoints are protected with JWT authentication.

3. Implementing User Interfaces Links to an external site.

    User SignUp and Logon Interface
        Utilize your User MongoDB collection to facilitate the storage of new users.
        Your React application should provide interfaces for users to sign up (with name, username, password) and log in (with username, password).

    Main Screen
        Display the top-rated movies on the main screen of your React application.
        Your GET /movies endpoint should sort the results by average rating (server-side).
            Update your /movies (with reviews=true) endpoint to sort by average rating in descending order.
            Implement this feature in your API and consume this API in your React application to show the sorted movies.

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
      avgRating: { $avg: '$movieReviews.rating' }
    }
  },
  {
    $sort: { avgRating: -1 }
  }
];
Movie.aggregate(aggregate).exec(function(err, docs) { ... });

    Movie Detail Screen
        Design a movie detail screen that shows the Movie, Image, Actors in the movie, and the aggregated rating for the movie.
        Use MongoDB’s aggregation framework to compute the average rating of reviews.
        A grid should display the reviews (username, rating, review).
        When a movie is selected from the main screen, the movie detail screen should be shown.

const aggregate = [
  {
    $match: { _id: movieId }
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
      avgRating: { $avg: '$movieReviews.rating' }
    }
  }
];
Movie.aggregate(aggregate).exec(function(err, doc) { ... });

    Extra Credit (7 points)
        Implement a movie search feature that displays results in a grid or accordion.
        For this, add a Search API (HTTP POST) to the API that can accept partial movie names or partial actor names.
        Beginning MERN Stack: Build and Deploy a Full Stack MongoDB, Express, React, Node.js App Links to an external site.

Step 4: Deployment Links to an external site.

    Deploy your React application on a platform like Heroku, Render, Vercel, or Netlify.
    Make sure the deployed application is able to communicate with your API.

Step 5: Submission Links to an external site.

    User is able to sign-up (name, username, password).
    User is able to log in to the application (username, password).
    User is able to see a list of movies and select a movie to see the detail screen (top-rated movies displayed).
    User is able to enter a review on the detail page (enter a rating and comment) – the logged-in user’s username will be associated with the review (as captured from the JSON Web Token).

Rubric Links to an external site.

    -3 Not able to add comments
    -2 Not aggregating rating (average rating)
    -3 if not pointed to the correct endpoint (e.g., HW4 endpoint)
    -5 if you don’t have a React website deployed

Resources Links to an external site.

    Create React App Links to an external site.
    React Buildpack Links to an external site.
    Mongoose Aggregate 