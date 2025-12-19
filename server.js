import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Serve API routes from /api folder
app.use("/api", (await import("./api/xai.js")).default);

// Serve static frontend
app.use(express.static(path.join(process.cwd(), "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
