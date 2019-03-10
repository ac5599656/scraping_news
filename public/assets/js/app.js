$(document).ready(function() {
  $(".save-btn").on("click", function(event) {
    let newSavedArticle = $(this).data();
    newSavedArticle.saved = true;
    console.log("saved was clicked");
    let id = $(this).attr("data-articleid");
    console.log(id);
    $.ajax("/saved/" + id, {
      type: "PUT",
      data: newSavedArticle
    }).then(function(data) {
      location.reload();
    });
  });

  // get new articles when the button is clicked
  $(".scrape-new").on("click", function(event) {
    event.preventDefault();
    $.get("/scrape", function(data) {
      windows.location.reload();
    });
  });
});

$(".unsave-btn").on("click", function(event) {
  let newUnsavedArticle = $(this).data();
  let id = $(this).attr("data-articleid");
  console.log("remove was clicked");
  newUnsavedArticle.saved = false;
  $.ajax("/article/" + id, {
    type: "DELETE"
  }).then(function(data) {
    location.reload();
  });
});
// generate the text inside the notes modal
function createModalHTML(data) {
  let modalText = data.title;
  $("#note-modal-title").text("Notes for article: " + data.title);
  let noteItem;
  let noteDeleteBtn;
  console.log("data notes length ", data.comments.length);
  for (var i = 0; i < data.comments.length; i++) {
    noteItem = $("<li>").text(data.comments[i].body);
    noteItem.addClass("note-item-list");
    noteItem.attr("id", data.comments[i]._id);
    //  noteItem.data("id", data.notes[i]._id);
    noteDeleteBtn = $("<button> Delete </button>").addClass(
      "btn btn-danger delete-note-modal"
    );
    noteDeleteBtn.attr("data-noteId", data.comments[i]._id);
    noteItem.prepend(noteDeleteBtn, " ");
    $(".notes-list").append(noteItem);
  }
}

// when the add note button is clicked on the saved articles page, show a modal. Empty the contents first.
$(".note-modal-btn").on("click", function(event) {
  var articleId = $(this).attr("data-articleId");
  $("#add-note-modal").attr("data-articleId", articleId);
  $("#note-modal-title").empty();
  $(".notes-list").empty();
  $("#note-body").val("");
  $.ajax("/articles/" + articleId, {
    type: "GET"
  }).then(function(data) {
    createModalHTML(data);
  });

  // show the modal
  $("#add-note-modal").modal("toggle");
});

// save a note into the database
// TODO: add better form validation
$(".note-save-btn").on("click", function(event) {
  event.preventDefault();
  var articleId = $("#add-note-modal").attr("data-articleId");
  var newNote = {
    body: $("#note-body")
      .val()
      .trim()
  };
  console.log(newNote);
  $.ajax("/submit/" + articleId, {
    type: "POST",
    data: newNote
  }).then(function(data) {});
});

// delete the note that was clicked and remove the whole <li> because the text and delete button are included
$(document).on("click", ".delete-note-modal", function(event) {
  var noteID = $(this).attr("data-noteId");

  $.ajax("/notes/" + noteID, {
    type: "GET"
  }).then(function(data) {
    $("#" + noteID).remove();
  });
});
