'use strict'

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ListingAccessHours', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    listingAccessDaysId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'ListingAccessDays',
        key: 'id'
      }
    },
    weekday: {
      type: DataTypes.CHAR(1),
      allowNull: false,
      defaultValue: '0'
    },
    openHour: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closeHour: {
      type: DataTypes.DATE,
      allowNull: true
    },
    allday: {
      type: DataTypes.INTEGER(1),
      allowNull: false,
      defaultValue: '0'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '0000-00-00 00:00:00'
    }
  }, {
    tableName: 'ListingAccessHours'
  });
};
