import { pgGenerate } from "drizzle-dbml-generator"; // Using Postgres for this example
import * as schema from "./schema";

const out = "./src/server/db/schema.dbml";
const relational = true;

pgGenerate({ schema, out, relational });
