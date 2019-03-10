let mongoose = require("mongoose");

let Schema = mongoose.Schema;

// This is similar to a Sequelize model
let ArticleSchema = new Schema({
    // `title` is required and of type String
    title: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    saved: {
        type: Boolean,
        default: false
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }
});

let Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;