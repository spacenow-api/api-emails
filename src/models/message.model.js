'use strict'
module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'id'
      },
      listingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'listing_id'
      },
      hostId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'host_id'
      },
      guestId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'guest_id'
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_read'
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        field: 'updated_at'
      }
    },
    {
      tableName: 'message',
      indexes: [
        {
          unique: true,
          fields: ['listing_id']
        },
        {
          unique: true,
          fields: ['host_id']
        },
        {
          unique: true,
          fields: ['guest_id']
        },
        {
          unique: true,
          fields: ['is_read']
        }
      ]
    }
  )

  Message.associate = function(models) {
    Message.hasMany(models.MessageItem, { as: 'messageItems', foreignKey: 'messageId' })
  }

  return Message
}
