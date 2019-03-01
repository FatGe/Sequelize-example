module.exports = (sequelize, DataTypes) => sequelize.define(
    'users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        tableName: 'users',
        // timestamps: false,
        underscored: true,
    }
)