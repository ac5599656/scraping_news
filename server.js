let express = require("express");
let logger = require("morgan");
let mongoose = require("mongoose");
let cheerio = require("cheerio");
let axios = require("axios");
let path = require("path");
// Set Handlebars.
let exphbs = require("express-handlebars");

// let PORT = 3000;

// Initialize Express
let app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(express.json());

let MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

// serve the public directory
app.use(express.static("public"));
// Set Handlebars as the default templating engine.
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layout")
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));
// Connect to the Mongo DB
var db = require("./models");
// Routes

// Make an empty array for saving our scraped info

// Make request via axios to grab the HTML from `awwards's` clean website section
app.get("/scrape", function(req, res) {
  axios.get("https://www.gadgetsnow.com/tech-news").then(function(response) {
    // Load the HTML into cheerio
    let $ = cheerio.load(response.data);
    let results = [];
    $("ul.cvs_wdt li").each(function(i, element) {
      /* Cheerio's find method will "find" the first matching child element in a parent.
       *    We start at the current element, then "find" its first child a-tag.
       *    Then, we "find" the lone child img-tag in that a-tag.
       *    Then, .attr grabs the imgs srcset value.
       *    The srcset value is used instead of src in this case because of how they're displaying the images
       *    Visit the website and inspect the DOM if there's any confusion
       */
      let title = $(element)
        .find("span.w_tle")
        .children("a")
        .text();
      let link = $(element)
        .find("span.w_tle")
        .children("a")
        .attr("href");
      let summary = $(element)
        .find("span.w_desc")
        .text();
      // Push the image's URL (saved to the imgLink var) into the results array
      if (summary === "") {
        summary = "Summary unavailable!";
      }
      db.Article.create({
        title: title,
        link: link,
        summary: summary
      })
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
      results.push({
        title: title,
        link: link,
        summary: summary
      });
      if (i === 20) {
        return res.sendStatus(200);
      }
    });

    // After looping through each element found, log the results to the console
    // console.log(results);

    // res.render("tech", {
    //     news: results
    // });
  });
});
app.get("/", function(req, res) {
  // Go into the mongo collection, and find all docs where "read" is true
  db.Article.find(
    {
      saved: false
    },
    function(error, dbArticle) {
      // Show any errors
      if (error) {
        console.log(error);
      } else {
        // Otherwise, send the books we found to the browser as a json

        res.render("index", {
          news: dbArticle
        });
      }
    }
  );
});
app.get("/saved", function(req, res) {
  // Go into the mongo collection, and find all docs where "read" is true
  db.Article.find(
    {
      saved: true
    },
    function(error, dbArticle) {
      // Show any errors
      if (error) {
        res.json(error);
      } else {
        // Otherwise, send the books we found to the browser as a json

        res.render("tech", {
          news: dbArticle
        });
      }
    }
  );
});
app.put("/saved/:id", function(req, res) {
  db.Article.findByIdAndUpdate(
    req.params.id,
    {
      $set: req.body
    },
    {
      new: true
    }
  )
    .then(function(dbArticle) {
      res.render("tech", {
        articles: dbArticle
      });
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/article/:id", function(req, res) {
  console.log(req.body);
  db.Comment.create(req.body)
    .then(function(dbComment) {
      return db.Article.findByIdAndUpdate(
        {
          _id: req.params.id
        },
        {
          comment: dbComment._id
        },
        {
          new: true
        }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

// route to find a note by ID
app.get("/article/:id", function(req, res) {
  console.log("You hit the right route");

  db.Article.findOne({ _id: req.params.id })
    .populate("comment")
    .then(function(dbArticle) {
      console.log("this is what we are looking for", dbArticle.comment.body);
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// app.get("/notes/:id", function(req, res) {
//   db.Comment.findOneAndDelete({ _id: req.params.id }, function(error, data) {
//     if (error) {
//       console.log(error);
//     } else {
//     }
//     res.json(data);
//   });
//});
// app.get("/articles/:id", function (req, res) {
//     // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//     db.Article.findOne({
//             _id: req.params.id
//         })
//         // ..and populate all of the comments associated with it
//         .populate("comments")
//         .then(function (dbArticle) {
//             // If we were able to successfully find an Article with the given id, send it back to the client
//             res.json(dbArticle);
//         })
//         .catch(function (err) {
//             // If an error occurred, send it to the client
//             res.json(err);
//         });
// });
// app.post("/articles/:id", function (req, res) {
//     // Create a new note and pass the req.body to the entry
//     db.Comment.create(req.body)
//         .then(function (dbComment) {
//             // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
//             // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
//             // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
//             return db.Article.findOneAndUpdate({
//                 _id: req.params.id
//             }, {
//                 comment: dbComment._id
//             }, {
//                 new: true
//             });
//         })
//         .then(function (dbArticle) {
//             // If we were able to successfully update an Article, send it back to the client
//             res.json(dbArticle);
//         })
//         .catch(function (err) {
//             // If an error occurred, send it to the client
//             res.json(err);
//         });
// });

app.delete("/article/:id", function(req, res) {
  // Remove a note using the objectID
  db.Article.remove({
    _id: req.params.id
  })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(e) {
      console.log(e);
    });
});

// // Clear the DB
// app.get("/clearall", function (req, res) {
//     // Remove every note from the notes collection
//     db.article.remove({}, function (error, response) {
//         // Log any errors to the console
//         if (error) {
//             console.log(error);
//             res.send(error);
//         } else {
//             // Otherwise, send the mongojs response to the browser
//             // This will fire off the success function of the ajax request
//             console.log(response);
//             res.send(response);
//         }
//     });
// });

app.listen(process.env.PORT || 3000, function() {
  // console.log("App running on port " + PORT + "!");
});
