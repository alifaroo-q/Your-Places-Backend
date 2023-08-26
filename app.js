const express = require("express");
const bodyParser = require("body-parser");
require("dotenv/config");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/user-routes");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.json());

app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find provided route", 404);
  return next(error);
});

app.use((err, req, res, next) => {
  if (res.headerSent) {
    return next(err);
  }

  res
    .status(err.code || 500)
    .json({ message: err.message || "An unknown error occurred!" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.info("Connected to database");
  })
  .then(() => {
    app.listen(5000, () => {
      console.log("server running at http://localhost:5000");
    });
  })
  .catch((error) => {
    console.error(error);
  });
