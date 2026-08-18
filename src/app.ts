import cors from "cors";
import express from "express";
import errorHandler from "./middleware/error.middleware.js";
import routes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
