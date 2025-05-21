
import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

interface DepartmentAttributes {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Some attributes are optional in input (for creation)
export interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: string;
  public name!: string;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associate(models: any) {
    Department.hasMany(models.User, {
      foreignKey: 'departmentId',
      as: 'users',
    });
  }
}

export default function (sequelize: Sequelize): typeof Department {
  Department.init(
    {
      id: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
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
      tableName: 'departments',
      timestamps: true,
    }
  );
  return Department;
}
