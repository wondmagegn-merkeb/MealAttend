
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface UserActivityLogAttributes {
  id: string;
  userIdentifier: string;
  activityTimestamp: Date;
  action: string;
  details: string | null;
  createdAt?: Date;
}

export interface UserActivityLogCreationAttributes extends Optional<UserActivityLogAttributes, 'id' | 'details' | 'createdAt'> {}

class UserActivityLog extends Model<UserActivityLogAttributes, UserActivityLogCreationAttributes> implements UserActivityLogAttributes {
  public id!: string;
  public userIdentifier!: string;
  public activityTimestamp!: Date;
  public action!: string;
  public details!: string | null;

  public readonly createdAt!: Date;
  // No updatedAt for activity logs usually
}

export default function (sequelize: Sequelize): typeof UserActivityLog {
  UserActivityLog.init(
    {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      userIdentifier: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Can be ADERA User ID or special values like system/unknown_user',
      },
      activityTimestamp: {
        type: DataTypes.DATE, // Using DATE for full timestamp
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'user_activity_logs',
      timestamps: true, // This will manage createdAt
      updatedAt: false, // No updatedAt for activity logs
    }
  );
  return UserActivityLog;
}
