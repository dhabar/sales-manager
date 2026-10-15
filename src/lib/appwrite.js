import { Client, TablesDB } from "appwrite";

const client = new Client();

client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("sales");

export const tablesDB = new TablesDB(client);

export const databaseId = "sales_manager";
export const customersTableId = "customers";
export const transactionsTableId = "transactions";