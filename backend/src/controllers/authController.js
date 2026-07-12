const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Role and status will take default values from the schema
    const user = await User.create({
      name,
      email,
      password,
    });

    const token = generateToken(user._id);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token,
    };

    res.status(201).json(new ApiResponse(201, userData, 'User registered successfully'));
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status !== 'Active') {
      throw new ApiError(401, 'User account is not active');
    }

    const token = generateToken(user._id);

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token,
    };

    res.status(200).json(new ApiResponse(200, userData, 'User logged in successfully'));
  } catch (error) {
    next(error);
  }
};

const profile = async (req, res, next) => {
  try {
    // req.user is set by authMiddleware
    res.status(200).json(new ApiResponse(200, req.user, 'User profile fetched successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  profile,
};
