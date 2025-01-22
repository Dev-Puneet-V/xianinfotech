import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
const app = express();
import route from "./routes/index.js";
import dbConfig from "./config/db.js";
dotenv.config();
app.use(express.json());
dbConfig();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use("/api", route);
app.use(express.static(path.join(process.cwd(), "build")));
app.listen(process.env.PORT || 3001, () => {
  console.log("Listening at port 3001");
});
