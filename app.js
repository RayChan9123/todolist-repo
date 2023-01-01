//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.set('strictQuery', true);

const url = "mongodb+srv://user1:ray123@cluster0.qbi3kki.mongodb.net/";
//connect to db
mongoose.connect(url + "toDoListDB");
//create schema object
const toDoListSchema = {
  name: {
    type : String,
  }
};

//create model base on schema
const Item = mongoose.model("item", toDoListSchema);

//create defaults items
const item1 = new Item ({
  name: "Welcome to your todolist"
});

const item2 = new Item ({
  name: "Hit the + sign to add an new item"
});

const item3 = new Item ({
  name: "<-- hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

//creat new schema
const listSchema = {
  name: String,
  item: [toDoListSchema]
}

//create new model for new schema
const List = new mongoose.model("List", listSchema);

//get request, the default response to user
app.get("/", function(req, res) {

  //find items' name in db and render
  Item.find({},(err, foundItems) => {

    //insert items if no item is in the db
    if(foundItems.length == 0)
    {
      //insert items into the db
      Item.insertMany(defaultItems, (err) => {
        if(err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items into the database");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.get("/:customListName", function(req, res) {

  const customeListName = _.capitalize(req.params.customListName);
  console.log("The custome list name is " + customeListName);
  //find if a list is existing in db
  List.findOne({name: customeListName}, function(err, foundList) {
    if(err) {
      console.log(err);
    }
    else
    {
      if (!foundList)
      {
        //create list
        const list = new List({
          name: customeListName,
          item: defaultItems
        });
        list.save();
        res.redirect("/" + customeListName);
      }
      else {
        //show list
        res.render("list", {listTitle: customeListName, newListItems: foundList.item});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  //create new item doc
  const item = new Item ({
    name: itemName
  });

  if(listName == "Today") {
    //save data to db
    item.save();
    res.redirect("/");
  }
  else {
    //add item into custom list
    List.findOne({name: listName}, function(err, foundList) {
      if(err) {
        console.log("Error in finding the list name in db" + err);
      }
      else {
        console.log(foundList);
        foundList.item.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today")
  {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully deleted one item in database");
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {item: { _id: checkedItemId}}},
      function(err, foundList) {
        if(!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log("Server started Successfully");
});
