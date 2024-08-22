import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
