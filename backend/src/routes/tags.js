const express = require('express');
const { getH5Tags } = require('../controllers/tagController');

const router = express.Router();

// H5 tags
router.get('/', getH5Tags);

module.exports = router;

