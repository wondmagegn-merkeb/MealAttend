
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface UserAttributes {
  id: string;
  userId: string;
  fullName: string;
  departmentId: string | null;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'User';
  profileImageUrl: string | null;
  passwordChangeRequired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'departmentId' | 'profileImageUrl' | 'passwordChangeRequired' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public userId!: string;
  public fullName!: string;
  public departmentId!: string | null;
  public email!: string;
  public passwordHash!: string;
  public role!: 'Admin' | 'User';
  public profileImageUrl!: string | null;
  public passwordChangeRequired!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate(models: any) {
    User.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }
}

export default function (sequelize: Sequelize): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Formatted ADERA ID: ADERA/USR/YYYY/SERIAL',
      },
      fullName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      departmentId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Store hashed passwords only',
      },
      role: {
        type: DataTypes.ENUM('Admin', 'User'),
        allowNull: false,
        defaultValue: 'User',
      },
      profileImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      passwordChangeRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
    }
  );
  return User;
}
