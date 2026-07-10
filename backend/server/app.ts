import express from "express";
import { createServer } from "http";
import cors from "cors";
import dotenv from "dotenv";
import { initSocketServer } from "./real/socket.js"; 
import { createClient } from "redis";
import "./listener.js"; 
import authRouter from "./modules/auth/auth.route.js";
import adminRouter from "./modules/admin/admin.router.js";
import bookingRouter from "./modules/bookingpicth/bookings.router.js";
import cupRouter from "./modules/cup/cup.router.js";
import matchRouter from "./modules/match/match.router.js";
import pkRouter from "./modules/pk/pk.router.js";
import teamRouter from "./modules/team/team.router.js";
dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  }),
);

app.use(express.json());
app.use('/api', authRouter);
app.use("/api/admin", adminRouter);
app.use('/api', bookingRouter);
app.use('/api/cup', cupRouter);
app.use('/api/match', matchRouter);
app.use('/api/pk', pkRouter);
app.use('/api',teamRouter);
const httpServer = createServer(app);
initSocketServer(httpServer);

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.log("disconect redis:", err));

const startServer = async () => {
  try {
    await redisClient.connect();
    console.log("conected redis server");

    const PORT = process.env.PORT || 8080;
    httpServer.listen(PORT, () => {
      console.log(`Server slice ${PORT}`);
    });
  } catch (error) {
    console.error("err start system", error);
  }
};

startServer();