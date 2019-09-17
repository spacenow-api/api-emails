'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'ListSettings',
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      typeId: {
        type: DataTypes.INTEGER(11),
        allowNull: false
      },
      itemName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      otherItemName: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      maximum: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      minimum: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      startValue: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      endValue: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      step: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isEnable: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: '1'
      },
      photo: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      photoType: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      isSpecification: {
        type: DataTypes.INTEGER(1),
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      specData: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'ListSettings'
    }
  )
}
