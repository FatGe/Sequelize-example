require('env2')('./.env');

const {
    env
} = process;

module.exports = {
    "development": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    },
    "production": {
        "username": env.DB_USERNAME,
        "password": env.DB_PASSWORD,
        "database": env.DB_NAME_PROD,
        "host": env.DB_HOST,
        "port": env.DB_PORT,
        "dialect": "mysql",
        "operatorsAliases": false,
    }
}