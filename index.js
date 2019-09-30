require("dotenv").config();

const express = require("express");
const app = express();
const passport = require("./passport");
const session = require("express-session");
//const knex = require("./knex/knex.js");
const flash = require("express-flash");
const nodemailer = require("nodemailer");
const path = require("path");
const tf = require("@tensorflow/tfjs");

const Auth = require("connect-ensure-login");

const { db, Stock, Sequelize, Users, pharmacists, stocks } = require("./db");

const Op = Sequelize.Op;

app.set("view engine", "hbs");

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);
app.use((req, res, next) => {
  res.locals.login = req.isAuthenticated();
  next();
});

app.use(flash());

let ans = 0;
let less = [];

app.use(
  session({
    secret: "averylongstring",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());

app.use(passport.session());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/", (req, res) => {
  stocks.findAll().then(el => console.log(el));
});
async function ML(test) {
  const model = tf.sequential();
  let arr1 = [];
  let arr2 = [];

  stocks.findAll().then(el => {
    for (let i = 0; i < 30; i++) {
      arr1.push(el[i].dataValues.month);
      arr1.push(el[i].dataValues.year);
      arr2.push(el[i].dataValues.qty);
    }
    //console.log(arr2);
    const xtrain = tf.tensor2d(arr1, [30, 2]);
    const ytrain = tf.tensor2d(arr2, [30, 1]);

    model.add(tf.layers.dense({ units: 1, inputShape: [2] }));

    const learningRate = 0.01;
    const opt = tf.train.adam(learningRate);

    model.compile({ loss: "meanSquaredError", optimizer: opt });

    model.fit(xtrain, ytrain, { epochs: 1000 }).then(() => {
      console.log("Model trained ...");
      ans = model.predict(tf.tensor2d(test, [1, 2])).dataSync();
      console.log(ans + "ans predicted !!!");
    });
  });
}

var dname = "";

app.post("/predict", (req, res) => {
  dname = req.body.dname;
  const mon = parseInt(req.body.mon);
  const yr = parseInt(req.body.yr);
  //console.log(mon + " " + yr);
  let x_test = [];
  x_test.push(mon);
  x_test.push(yr);
  ML(x_test).then(() => {
    res.redirect("/result");
  });
});

app.get("/result", (req, res) => {
  res.render("result", { dname, ans });
});

app.get("/adminlogin", (req, res) => {
  Stock.findAll({
    where: {
      Qty: {
        [Op.lte]: 30 //Threshold value is constant.
      }
    }
  }).then(stocks => {
    less = [];
    for (var i = 0; i < Object.keys(stocks).length; i++)
      less.push(stocks[i].dataValues.name);
    req.flash("error", `Some stocks are below threshold level. ${less} `);
    res.render("adminlogin");
  });
});

app.get("/predict", (req, res) => {
  req.flash("error", `Some stocks are below threshold level. ${less} `);
  res.render("predict");
});

app.get("/dashboard", Auth.ensureLoggedIn("/login"), (req, res) => {
  Users.findOne({
    where: {
      username: req.user.username
    }
  }).then(el => {
    res.render("dashboard", { el });
  });
});

app.get("/show", (req, res) => {
  Stock.findAll().then(el => {
    // console.log(el);
    res.render("show", { el });
  });
});

app.post("/dashboard", (req, res) => {
  const DName = req.body.name;
  const quantity = req.body.quantity;

  // let transport = new nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: process.env.EMAIL,
  //     pass: process.env.PASS
  //   }
  // });

  //let ma = req.user.email;
  //console.log(ma);
  //console.log(ans);

  //   let mail = {
  //     from: '"TeamMAIT" <sahilsbi98@gmail.com>',
  //     to: ma,
  //     subject: "Confirmation of your order.",
  //     text: `Your order is ${DName}.
  // with quantity of ${quantity}.`
  //   };

  //   transport.sendMail(mail, (err, data) => {
  //     if (err) console.log("error", err);
  //     else console.log("email sent");
  //   });

  Stock.findAll({
    where: {
      name: {
        [Op.eq]: DName // Finding the matching names
      }
    }
  })
    .then(stocks => {
      stocks[0].dataValues.Qty -= quantity;
      console.log("----------------------------" + Stock);
      const price = quantity * 30;
      res.render("confirm", { DName, quantity, price });
    })
    .catch(() => {
      res.redirect("/dashboard");
    });
});

app.get("/confirm", (req, res) => {
  res.render("confirm");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/stocks", (req, res) => {
  res.render("add");
});

app.post("/stocks", (req, res) => {
  const newitem = {
    id: req.body.id,
    name: req.body.name,
    batch: req.body.batch,
    expMonth: req.body.expMonth,
    expYear: req.body.expYear,
    Qty: req.body.Qty,
    Threshold: req.body.thres
  };

  if (
    newitem.id == "" ||
    newitem.name == "" ||
    newitem.batch == "" ||
    newitem.expMonth == "" ||
    newitem.expYear == "" ||
    newitem.Qty == "" ||
    newitem.Threshold == ""
  ) {
    req.flash("info");
  }

  Stock.create(newitem).then(() => {
    req.flash("successMessage", "Drug was added successfully!!!");
    console.log("added stock");
  });
  res.redirect("/stocks");
});

app.post("/signup", (req, res) => {
  const newuser = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.pass
  };

  Users.create(newuser)
    .then(el => {
      res.redirect("/login");
    })
    .catch(err => console.log(err));
  // .then(() => console.log('schema created'))
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successReturnToOrRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
  })
);

app.get("/bill", (req, res) => {
  ans = Math.round(ans);
  const price = ans * 30;
  const per_price = 30;
  res.render("bill", { dname, ans, price, per_price });
});

app.use(express.static(path.join(__dirname, "/public/styles")));

db.sync().then(() => {
  app.listen(5000, () => {
    console.log("listening to port 5000");
  });
});
