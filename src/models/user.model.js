'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        defaultValue: '',
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      emailConfirmed: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
        defaultValue: '0'
      },
      type: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      userBanStatus: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
        defaultValue: '0'
      },
      role: {
        type: DataTypes.STRING(45),
        allowNull: true,
        defaultValue: 'user'
      },
      provider: {
        type: DataTypes.ENUM('spacenow', 'wework'),
        allowNull: true,
        defaultValue: 'spacenow'
      }
    },
    {
      tableName: 'User'
    }
  )
}
