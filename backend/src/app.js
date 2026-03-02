const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const merchantRoutes = require('./routes/merchant');
const adminRoutes = require('./routes/admin');
const hotelRoutes = require('./routes/hotels');
const homeRoutes = require('./routes/home');
const tagRoutes = require('./routes/tags');

// Always load backend/.env regardless of current working directory.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/admin', adminRoutes);

// H5 public APIs
app.use('/api/h5/home', homeRoutes);
app.use('/api/h5/hotels', hotelRoutes);
app.use('/api/h5/tags', tagRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ code: 'ERROR', message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

