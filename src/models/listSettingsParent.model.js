'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'ListSettingsParent',
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true
      },
      listSettingsParentId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: '0',
        references: {
          model: 'ListSettings',
          key: 'id'
        }
      },
      listSettingsChildId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: '0',
        references: {
          model: 'ListSettings',
          key: 'id'
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    {
      tableName: 'ListSettingsParent'
    }
  )
}
