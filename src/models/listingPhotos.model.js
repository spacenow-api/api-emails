'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'ListingPhotos',
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      listingId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        references: {
          model: 'Listing',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      isCover: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: '0'
      },
      bucket: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      region: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      key: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(255),
        allowNull: false
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
      tableName: 'ListingPhotos'
    }
  )
}
