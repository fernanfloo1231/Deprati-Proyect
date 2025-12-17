const express = require("express");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const app = express();
const generalRoutes = require("./src/routes/general.routes");
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);
app.use(express.json());

app.use("/rastreo", require("./src/routes/rastreo/rastreo.routes"));

app.use("/img", express.static(path.join(__dirname, "public", "img")));
app.use("/", generalRoutes);
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(" Servidor en http://localhost:3000");
  console.log(" Rutas disponibles bajo /api:");
  console.log("   PRODUCTOS:");
  console.log("     GET    http://localhost:3000/api/productos");
  console.log("     POST   http://localhost:3000/api/productos");
  console.log("   ADMIN:");
  console.log("     POST   http://localhost:3000/api/admin/login");
  console.log("   UPLOAD:");
  console.log("     POST   http://localhost:3000/api/api/upload");
  console.log("   HEALTH:");
  console.log("     GET    http://localhost:3000/api/health");
});
