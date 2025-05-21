
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface StudentAttributes {
  id: string;
  studentId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other' | '' | null;
  class: string | null;
  profileImageUrl: string | null;
  qrCodeData: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentCreationAttributes extends Optional<StudentAttributes, 'id' | 'gender' | 'class' | 'profileImageUrl' | 'createdAt' | 'updatedAt'> {}

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public id!: string;
  public studentId!: string;
  public name!: string;
  public gender!: 'Male' | 'Female' | 'Other' | '' | null;
  public class!: string | null;
  public profileImageUrl!: string | null;
  public qrCodeData!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associate(models: any) {
    Student.hasMany(models.AttendanceRecord, {
      foreignKey: 'studentInternalId',
      as: 'attendanceRecords',
    });
  }
}

export default function (sequelize: Sequelize): typeof Student {
  Student.init(
    {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
        comment: 'Internal unique ID, also used as qr_code_data',
      },
      studentId: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Formatted ADERA ID: ADERA/STU/YYYY/NNNNN',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other', ''),
        allowNull: true,
        defaultValue: '',
      },
      class: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      profileImageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      qrCodeData: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true, // Assuming id is used for qrCodeData and id is unique
        comment: 'Should be the same as internal id for consistency',
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
      tableName: 'students',
      timestamps: true,
    }
  );
  return Student;
}
