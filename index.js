// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('users_dev', 'gyz', 'Geyizhongzui7==', {
//     host: '134.175.208.242',
//     port: 3306,
//     dialect: 'mysql',
//     operatorsAliases: false,
//     logging: false,

//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//     },
// });

// // sequelize
// //     .authenticate()
// //     .then(() => {
// //         console.log('Connection has been established successfully.');
// //     })
// //     .catch(err => {
// //         console.error('Unable to connect to the database:', err);
// //     });

// const User = sequelize.define('user', {
//     firstName: {
//         type: Sequelize.STRING
//     },
//     lastName: {
//         type: Sequelize.STRING
//     }
// });

// // force: true will drop the table if it already exists
// User.sync({
//     force: true
// }).then(() => {
//     // Table created
//     return User.create({
//         firstName: 'John',
//         lastName: 'Hancock'
//     });
// }).then(() => {
//     process.exit()
// })

if (process.env.NODE_ENV === 'production') {
    require('env2')('./.env.prod');
} else {
    require('env2')('./.env');
}

const {
    env
} = process;

console.log(env.DB_NAME)