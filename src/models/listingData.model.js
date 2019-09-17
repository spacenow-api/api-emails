'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'ListingData',
    {
      id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      listingId: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        references: {
          model: 'Listing',
          key: 'id'
        },
        unique: true
      },
      listId: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      bookingNoticeTime: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      checkInStart: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Flexible'
      },
      checkInEnd: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Flexible'
      },
      minNight: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      maxNight: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      priceMode: {
        type: DataTypes.INTEGER(1),
        allowNull: true
      },
      basePrice: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      maxPrice: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      currency: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      hostingFrequency: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      weeklyDiscount: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      monthlyDiscount: {
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
      cleaningPrice: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      maxDaysNotice: {
        type: DataTypes.ENUM(
          'unavailable',
          '3months',
          '6months',
          '9months',
          '12months',
          'available'
        ),
        allowNull: false,
        defaultValue: 'unavailable'
      },
      cancellationPolicy: {
        type: DataTypes.INTEGER(11),
        allowNull: true,
        defaultValue: '1'
      },
      minTerm: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      maxTerm: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isAbsorvedFee: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: '0'
      },
      capacity: {
        type: DataTypes.INTEGER(5),
        allowNull: true
      },
      size: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: '0'
      },
      meetingRooms: {
        type: DataTypes.INTEGER(3),
        allowNull: true
      },
      isFurnished: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: '0'
      },
      carSpace: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      ListingDatacol: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      sizeOfVehicle: {
        type: DataTypes.ENUM('Small', 'Medium', 'Large'),
        allowNull: true
      },
      maxEntranceHeight: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      spaceType: {
        type: DataTypes.ENUM('Covered', 'Uncovered'),
        allowNull: true
      },
      bookingType: {
        type: DataTypes.ENUM('request', 'instant'),
        allowNull: true,
        defaultValue: 'instant'
      },
      accessType: {
        type: DataTypes.STRING(45),
        allowNull: true
      }
    },
    {
      tableName: 'ListingData'
    }
  )
}
