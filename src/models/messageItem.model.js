'use strict'
module.exports = (sequelize, DataTypes) => {
  const MessageItem = sequelize.define(
    'MessageItem',
    {
      id: {
        type: DataTypes.STRING(36),
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      messageId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        references: {
          model: 'Message',
          key: 'id'
        }
      },
      sentBy: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: {
          model: 'User',
          key: 'id'
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isRead: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: '0'
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
      tableName: 'MessageItem'
    }
  )

  MessageItem.associate = function(models) {
    MessageItem.belongsTo(models.Message, {
      as: 'message',
      foreignKey: 'id'
    })
  }

  return MessageItem
}
