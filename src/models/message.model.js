'use strict'
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      listingId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      hostId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      guestId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    },
    {
      tableName: 'Message'
    }
  )

  Message.associate = function(models) {
    Message.hasMany(models.MessageItem, { as: 'messageItems', foreignKey: 'messageId' })
  }

  return Message
}
