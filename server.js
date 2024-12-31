const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.json').development;

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect
});

// Define models
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: DataTypes.STRING
});

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: DataTypes.STRING
});

const Technology = sequelize.define('Technology', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: DataTypes.STRING
});

// Define associations
User.belongsToMany(Technology, { through: 'UserTechnologies' });
Job.belongsToMany(Technology, { through: 'JobTechnologies' });
Technology.belongsToMany(User, { through: 'UserTechnologies' });
Technology.belongsToMany(Job, { through: 'JobTechnologies' });

const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to the Job Matching API!');
});

app.get('/match_jobs', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const user = await User.findByPk(userId, {
    include: Technology
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const technologyIds = user.Technologies.map(tech => tech.id);

  const jobs = await Job.findAll({
    include: [{
      model: Technology,
      where: { id: technologyIds }
    }]
  });

  if (!jobs.length) {
    return res.status(200).json({ message: 'No matching jobs found' });
  }

  res.status(200).json({ matching_jobs: jobs });
});

sequelize.sync().then(() => {
  app.listen(3001, () => {
    console.log('Server is running on port 3001');
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});
