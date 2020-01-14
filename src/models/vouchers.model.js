module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    'Vouchers',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('percentual', 'zerofee', 'value'),
        allowNull: false,
        defaultValue: 'value'
      },
      value: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: '0'
      },
      usageCount: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: '0'
      },
      usageLimit: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: '1'
      },
      status: {
        type: DataTypes.ENUM('active', 'disabled'),
        allowNull: false,
        defaultValue: 'active'
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
      tableName: 'Vouchers'
    }
  )
}
