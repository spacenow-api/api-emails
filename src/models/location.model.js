'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Location',
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      country: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      address1: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      address2: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      buildingName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      city: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      state: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      zipcode: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      lat: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      lng: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'Location'
    }
  )
}
