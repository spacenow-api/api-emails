'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Listing',
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      locationId: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: 'Location',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      listSettingsParentId: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: 'ListSettingsParent',
          key: 'id'
        }
      },
      bookingPeriod: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      roomType: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      houseType: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      residenceType: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      bedrooms: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      buildingSize: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      bedType: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      beds: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      personCapacity: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      bathrooms: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      bathroomType: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      country: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      street: {
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
      isMapTouched: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
        defaultValue: '0'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      coverPhoto: {
        type: DataTypes.INTEGER(10),
        allowNull: true
      },
      bookingType: {
        type: DataTypes.ENUM('request', 'instant'),
        allowNull: false,
        defaultValue: 'instant'
      },
      isPublished: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: '0'
      },
      isReady: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: '0'
      },
      coverPhotoId: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      quantity: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('active', 'deleted'),
        allowNull: true,
        defaultValue: 'active'
      }
    },
    {
      tableName: 'Listing'
    }
  )
}
