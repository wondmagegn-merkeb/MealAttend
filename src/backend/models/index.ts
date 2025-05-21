
import { Sequelize, Dialect } from 'sequelize';
import defineDepartmentModel from './department';
import defineUserModel from './user';
import defineStudentModel from './student';
import defineAttendanceRecordModel from './attendanceRecord';
import defineUserActivityLogModel from './userActivityLog';

// It's highly recommended to use environment variables for sensitive data
const dbName = process.env.DB_NAME || 'meal_attend_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || 'password'; // Ensure this is secure
const dbHost = process.env.DB_HOST || 'localhost';
const dbDialect = (process.env.DB_DIALECT as Dialect) || 'mysql';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  dialect: dbDialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL in dev
  pool: { // Optional: configure connection pooling
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const db = {
  sequelize,
  Sequelize, // Capital S Sequelize constructor
  Department: defineDepartmentModel(sequelize),
  User: defineUserModel(sequelize),
  Student: defineStudentModel(sequelize),
  AttendanceRecord: defineAttendanceRecordModel(sequelize),
  UserActivityLog: defineUserActivityLogModel(sequelize),
};

// Define associations
// The associate method is defined within each model file
Object.values(db).forEach((model: any) => {
  if (model.associate) {
    model.associate(db);
  }
});

export default db;
