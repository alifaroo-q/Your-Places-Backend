
const User = require("../models/user");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");

const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (error) {
    return next(
      new HttpError("Fetching users failed, please try again later", 500)
    );
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Wrong user data provided. Please enter valid data", 422)
    );
  }

  const { name, email, password, places } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    return next(
      new HttpError("Signing up failed, please try again later", 500)
    );
  }

  if (existingUser) {
    return next("Users already exists, please use different email", 422);
  }

  const createdUser = new User({
    name,
    email,
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    password,
    places,
  });

  try {
    await createdUser.save();
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again.", 500));
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email });
  } catch (error) {
    return next(
      new HttpError("Logging up failed, please try again later", 500)
    );
  }

  if (!existingUser || existingUser.password !== password) {
    return next(new HttpError("Could not login, wrong email or password", 401));
  }

  res.json({ message: "Logged in!" });
};

module.exports = {
  getUsers,
  signup,
  login,
};
