import { DataSource } from "typeorm";

export const myDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgrespass",
  database: "db_boilerplate",
  synchronize: true,
  logging: false,
  entities: ["src/model/*.ts"],
  migrations: ["src/migrations/*.ts"],
});
