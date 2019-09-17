'use strict'

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    bookingId: {
      type: DataTypes.STRING(36),
      allowNull: false
    },
    payerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payerId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    receiverEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    receiverId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '1'
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    transactionFee: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ipn_track_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paymentType: {
      type: DataTypes.ENUM('booking', 'cancellation', 'host'),
      allowNull: true,
      defaultValue: 'booking'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    paymentMethodId: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      defaultValue: '1'
    }
  }, {
    tableName: 'Transaction'
  });
};
