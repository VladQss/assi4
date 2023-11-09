const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const axios = require('axios');
const app = express();
const _ = require("lodash");

app.use((req, res, next) => {
    console.log('Time: ', Date.now());
    next();
});
app.use('/request-type', (req, res, next) => {
    console.log('Request type: ', req.method);
    next();
});
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://ayazhan_kundak:7y0nI9xSosmdCNAr@cluster0.dnbvudc.mongodb.net/",
    {useNewUrlParser: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to to do list"
});
const item2 = new Item({
    name: "Welcome to to do list2"
});
const item3 = new Item({
    name: "Welcome to to do list3"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    res.render("pages/home");
});

app.get("/todo", function (req, res) {
    Item.find({}, function (err, results) {
        if (results.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log("error");
                } else {
                    console.log("Succesfully added to collection");
                }
            });
        }
        res.render("pages/list", {listTitle: "Today", newListItems: results});
    });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const itemNew = new Item({
        name: itemName
    });
    if (listName === "Today") {
        itemNew.save();
        res.redirect("/todo");
    } else {
        List.findOne({name: listName}, function (err, foundList) {
            foundList.items.push(itemNew);
            foundList.save();
            res.redirect("/todo" + listName);
        });
    }
});

app.post("/generateTask", function (req, res) {
    axios.get("http://www.boredapi.com/api/activity/")
        .then(function (response) {
            console.log(response.data)
            // const itemName = req.body.newItem;
            // const listName = req.body.list;
            // const itemNew = new Item({
            //     name: itemName
            // });
            //
            //
            // if (listName === "Today") {
            //     itemNew.save();
            //     res.redirect("/todo");
            // } else {
            //     List.findOne({name: listName}, function (err, foundList) {
            //         foundList.items.push(itemNew);
            //         foundList.save();
            //         res.redirect("/todo" + listName);
            //     });
            // }
        })
        .catch(function (error) {
            console.error("API request error:", error);
            res.status(500).send("Error fetching data from the API");
        });


});


app.post("/delete", function (req, res) {
    const checkedid = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove(checkedid, function (err) {
            if (err) {
                console.log("error");
            } else {
                console.log("deleted checked item");
                res.redirect("/todo");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedid}}},
            function (err, foundList) {
                if (!err) {
                    res.redirect("/todo" + listName);
                }
            });
    }
});


app.get("/about", function (req, res) {
    res.render("pages/about");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}


app.listen(port, function () {
    console.log("Server started at port ", port);
});

module.exports = app