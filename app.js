// Core Module
const path = require('path');

// External Modules
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const multer = require('multer');

// MongoDB URI
const DB_PATH = "mongodb+srv://Ravitariya:riyariya@cluster0.tp1hyif.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Local Modules
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// 📦 Multer setup
const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const multerOptions = { storage, fileFilter };

// 📂 Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(multer(multerOptions).single('photo'));
app.use(express.static(path.join(rootDir, 'public')));
app.use("/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/host/uploads", express.static(path.join(rootDir, 'uploads')));
app.use("/homes/uploads", express.static(path.join(rootDir, 'uploads')));

// 🔐 Session Setup (connect-mongo)
app.use(session({
  secret: "KnowledgeGate AI with Complete Coding",
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: DB_PATH,
    dbName: 'airbnb',
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// 🔐 LoggedIn Middleware
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn;
  next();
});

// Routers
app.use(authRouter);
app.use(storeRouter);
app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});
app.use("/host", hostRouter);

// 404 Handler
app.use(errorsController.pageNotFound);

// 🌐 Connect to Mongo & Start Server
const PORT = 3003;
mongoose.connect(DB_PATH)
  .then(() => {
    console.log('✅ Connected to Mongo');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log('❌ Error while connecting to Mongo:', err);
  });
