const express = require("express");
const router = express.Router();
const controller = require("../../../src/controllers/cliente/clientes.controllers");
const auth = require("../../middleware/auth");
const passport = require("passport");

require("../../config/passport.config");

// Rutas públicas
router.post("/registrar", controller.registrar);
router.post("/login", controller.login);

// Rutas de autenticación social (públicas)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  controller.socialCallback
);

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
    session: false,
  })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  controller.socialCallback
);

// **Todas las rutas desde aquí requieren autenticación**
router.use(auth);

// Perfil del cliente
router.get("/perfil", controller.obtenerPerfil);
router.put("/perfil", controller.actualizarPerfil);

// Carrito del cliente (nuevas rutas)
router.get("/carrito", controller.obtenerCarritoCliente);
router.post("/carrito/sincronizar", controller.sincronizarCarrito);
router.post("/carrito/agregar", controller.agregarAlCarrito);
router.put("/carrito/actualizar", controller.actualizarCarrito);
router.delete("/carrito/eliminar/:id_producto", controller.eliminarDelCarrito);
router.delete("/carrito/vaciar", controller.vaciarCarrito);

module.exports = router;
