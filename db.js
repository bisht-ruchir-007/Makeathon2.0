const Sequelize = require("sequelize");

const db = new Sequelize({
  dialect: "sqlite",
  storage: "User.db"
});

const Users = db.define("user", {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true
  }
});

const pharmacists = db.define("pharma", {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: true
  }
});

const Stock = db.define("stocks", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNULL: false
  },
  name: {
    type: Sequelize.STRING,
    allowNULL: false
  },
  batch: {
    type: Sequelize.STRING,
    allowNULL: false
  },

  expMonth: {
    type: Sequelize.INTEGER
  },

  expYear: {
    type: Sequelize.INTEGER
  },

  Qty: {
    type: Sequelize.INTEGER
  },
  Threshold: {
    type: Sequelize.INTEGER,
    allowNULL: false
  }
});

const stocks = db.define("sale3s", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNULL: false
  },
  month: {
    type: Sequelize.INTEGER
  },
  year: {
    type: Sequelize.INTEGER
  },
  qty: {
    type: Sequelize.INTEGER
  }
});

module.exports = {
  db,
  Sequelize,
  Users,
  pharmacists,
  Stock,
  stocks
};
