
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface AttendanceRecordAttributes {
  id: string;
  studentInternalId: string;
  recordDate: string; // Using string for DATEONLY representation
  mealType: 'Breakfast' | 'Lunch' | 'Dinner';
  scannedAtTimestamp: Date | null;
  status: 'Present' | 'Absent';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AttendanceRecordCreationAttributes extends Optional<AttendanceRecordAttributes, 'id' | 'scannedAtTimestamp' | 'createdAt' | 'updatedAt'> {}

class AttendanceRecord extends Model<AttendanceRecordAttributes, AttendanceRecordCreationAttributes> implements AttendanceRecordAttributes {
  public id!: string;
  public studentInternalId!: string;
  public recordDate!: string;
  public mealType!: 'Breakfast' | 'Lunch' | 'Dinner';
  public scannedAtTimestamp!: Date | null;
  public status!: 'Present' | 'Absent';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate(models: any) {
    AttendanceRecord.belongsTo(models.Student, {
      foreignKey: 'studentInternalId',
      as: 'student',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

export default function (sequelize: Sequelize): typeof AttendanceRecord {
  AttendanceRecord.init(
    {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      studentInternalId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: 'students', // Name of the table
          key: 'id',
        },
        comment: 'References students.id',
      },
      recordDate: {
        type: DataTypes.DATEONLY, // Stores YYYY-MM-DD
        allowNull: false,
      },
      mealType: {
        type: DataTypes.ENUM('Breakfast', 'Lunch', 'Dinner'),
        allowNull: false,
      },
      scannedAtTimestamp: {
        type: DataTypes.DATE, // Full DATETIME
        allowNull: true,
        comment: 'Full timestamp of scan',
      },
      status: {
        type: DataTypes.ENUM('Present', 'Absent'),
        allowNull: false,
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
      tableName: 'attendance_records',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['studentInternalId', 'recordDate', 'mealType'],
          name: 'unique_attendance_constraint', // Naming the constraint
        },
      ],
    }
  );
  return AttendanceRecord;
}
