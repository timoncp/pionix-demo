const jwt = require('jsonwebtoken');
const Sessions = require('../models/sessions');
const config = require('../config');

const verifyToken = (token, cb) => {
  jwt.verify(token, config.jwtsecret, (err, decoded) => {
    if (err) cb(err);

    cb(null, decoded);
  });
};

const createToken = (user) => jwt.sign(user, config.jwtsecret);

const tokenMiddleware = (req, res, next) => {
  let token = req.headers.authorization || req.body.token || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Please provide a valid token'
    });
  }

  if (~token.indexOf('Bearer')) {
    token = token.replace('Bearer ', '');
  }

  verifyToken(token, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token invalid'
      });
    }

    req.user = user;
    req.token = token;

    Sessions.find(user.username, (err, result) => {
      if (err || !result) {
        return res.status(403).json({
          message: 'Session expired. Please log in again',
          success: false
        });
      }

      next();
    });
  });
};

module.exports = {
  createToken,
  verifyToken,
  tokenMiddleware
};
