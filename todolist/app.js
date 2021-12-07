//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name : String
}

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name: 'Welcome to the todolist'
})

const item2 = new Item({
  name: 'Press + to add new item'
})

const item3 = new Item({
  name: '<-- Press this button to delete me'
})

const defaultItems = [item1,item2,item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {

  Item.find({}, (err,foundItems) => {
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, (err) =>{
        if(err){
          console.log(err)
        }
        else{
          console.log("Successfully saved default items to the DB.")
        }
      })
      res.redirect('/')
    }
    else{
      if(err){
        console.log(err);
      }
      else{
        res.render("list", {listTitle: 'Today', newListItems: foundItems});
      }
    }
  })


});

app.post("/", function(req, res){

  const itemName = req.body.newItem
  const listName = req.body.list
  const newItem = new Item({
    name: itemName
  })
  if(listName === "Today"){
    newItem.save();
    res.redirect("/")
  }
  else{
    List.findOne({name: listName}, (err,foundList)=>{
      foundList.items.push(newItem)
      foundList.save();
      res.redirect("/"+foundList.name)
    })
  }
});


app.post('/delete', (req,res) =>{
  const checkItemId = req.body.checkbox
  const listName = req.body.listName

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemId, (err)=>{
      if(err){
        console.log(err)
      }
      else{
        console.log("Item sucessfully removed")
        res.redirect('/')
      }
    })
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull:{items:{_id:checkItemId}}},(err,foundList)=>{
      if(!err){
        res.redirect("/" + listName)
      }
    })
  }
})

app.get("/:customListName", (req,res) =>{ 
  const customListName = _.capitalize(req.params.customListName)
  List.findOne({name: customListName}, (err, foundList) =>{
    if(!err){
      if(!foundList){
        const list = new List ({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/"+customListName)
      }
      else{
        res.render("list", {listTitle: customListName, newListItems: foundList.items})
      }
    }
  })
})


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
