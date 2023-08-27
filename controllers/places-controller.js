const { validationResult } = require("express-validator");

const Place = require("../models/place");
const User = require("../models/user");
const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../utils/location");
const mongoose = require("mongoose");

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;

  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(
      new HttpError("Something went wrong, could not find places", 500)
    );
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError("Could not find places for the provided user id", 404)
    );
  }

  return res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const getPlaceById = async (req, res) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(
      new HttpError("Something went wrong, could not find place", 500)
    );
  }

  if (!place) {
    return next(
      new HttpError("Could not find a place for the provided place id", 404)
    );
  }

  return res.json({ place: place.toObject({ getters: true }) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Wrong place data provided. Please enter valid data", 422)
    );
  }

  const { title, description, address, creator } = req.body;
  const coordinates = getCoordsForAddress(address);

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      "https://images.unsplash.com/photo-1555109307-f7d9da25c244?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80",
    creator,
  });

  let user = null;

  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(new HttpError("Creating place failed, please try again", 500));
  }

  if (!user) {
    return next(new HttpError("Cannot find user for provided id", 404));
  }

  try {
    /* 
      creating a session for user and places,
      if something goes wrong revert the changes
      and throw error
    */
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session });
    user.places.push(createdPlace);
    await user.save({ session });
    await session.commitTransaction();
  } catch (err) {
    return next(new HttpError("Creating place failed, please try again", 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Wrong place data provided. Please enter valid data", 422)
    );
  }

  const placeId = req.params.pid;
  const { title, description } = req.body;

  let updatedPlace;

  try {
    updatedPlace = await Place.findById(placeId);

    updatedPlace.title = title;
    updatedPlace.description = description;

    await updatedPlace.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong, could not update place", 500)
    );
  }

  return res
    .status(200)
    .json({ place: updatedPlace.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  try {
    await Place.findByIdAndRemove(placeId);
  } catch (err) {
    return next(
      new HttpError("Something went wrong, cannot delete place", 500)
    );
  }

  return res.status(200).json({ placeId, message: "place deleted" });
};

module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
