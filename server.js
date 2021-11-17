const express = require("express");
const app = express();
const db = require("./db.js");

const multer = require("multer");
const uidSafe = require("uid-safe");
const path = require("path");
const s3 = require("./s3");

const diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, path.join(__dirname, "upload"));
    },
    filename: function (req, file, callback) {
        uidSafe(24).then(function (uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    },
});

const uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152,
    },
});

app.use(express.static("./public"));
app.use(express.json());

app.get("/images.json", (req, res) => {
    console.log("request to images was made");
    db.getImages()
        .then((images) => {
            console.log(images.rows);
            res.json(images.rows);
        })
        .catch((err) => {
            console.log(err);
            res.sendStatus(500);
        });
});

// When user clicks the submit button, a POST request containing all of the data should be made.
app.post("/upload", uploader.single("file"), s3.upload, (req, res) => {
    console.log("*****************");
    console.log(req.body);
    console.log("our file will be reachable at its bucket's url");
    const aws = "https://s3.amazonaws.com/";
    const bucket = "spicedling/";
    const filename = req.file.filename;
    const url = `${aws}${bucket}${filename}`;

    db.uploadImages(
        url,
        req.body.username,
        req.body.title,
        req.body.description
    )
        .then((results) => {
            res.json(results);
        })
        .catch((err) => {
            console.log("error in uploading images:", err);
            res.sendStatus(500);
        });
});

app.get("*", (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.listen(8080, () => console.log(`I'm listening.`));
