'use strict'

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'UserProfile',
    {
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        defaultValue: '',
        primaryKey: true,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      profileId: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        autoIncrement: true,
        unique: true
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      dateOfBirth: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      picture: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      gender: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      phoneNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      preferredLanguage: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      preferredCurrency: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      info: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      location: {
        type: DataTypes.STRING(100),
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
      stripeCusId: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      country: {
        type: DataTypes.INTEGER(4),
        allowNull: true,
        defaultValue: '1'
      },
      verificationCode: {
        type: DataTypes.INTEGER(5),
        allowNull: true
      },
      countryCode: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      customerId: {
        type: DataTypes.CHAR(36),
        allowNull: true
      },
      accountId: {
        type: DataTypes.CHAR(36),
        allowNull: true
      },
      userLocationId: {
        type: DataTypes.INTEGER(11),
        allowNull: true
      },
      profileType: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      companyName: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      companyId: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      contactJobRole: {
        type: DataTypes.STRING(45),
        allowNull: true
      }
    },
    {
      tableName: 'UserProfile'
    }
  )
}
