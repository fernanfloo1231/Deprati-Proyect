const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Enviar notificación de estado de pedido al cliente
 */
exports.enviarFacturaPedido = async ({
  email,
  nombre,
  pedido,
  productos,
  codigo_rastreo,
  estado = "Pendiente",
}) => {
  try {
    // Validación de correo
    if (!email) {
      console.error(" ERROR: No se recibió un correo válido.");
      throw new Error("Correo del cliente no disponible.");
    }

    // Generar HTML de productos
    const listaProductosHTML =
      productos && productos.length > 0
        ? productos
            .map(
              (p) => `
            <li>
              <strong>${p.nombre}</strong> (x${p.cantidad}) - $${Number(
                p.precio_unitario
              ).toFixed(2)}
            </li>
          `
            )
            .join("")
        : "<li>No se encontraron productos</li>";

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Hola ${nombre}, ¡gracias por tu compra!</h2>

        <p><strong>Actualización de tu pedido</strong></p>

        <p>
          El estado actual de tu pedido es:
          <span style="
            display:inline-block;
            padding:6px 12px;
            border-radius:6px;
            background:#00b4d8;
            color:#fff;
            font-weight:bold;
          ">
            ${estado}
          </span>
        </p>

        <h3>Detalles del pedido</h3>
        <p><strong>Código de pedido:</strong> ${pedido.id_pedido}</p>
        <p><strong>Método de pago:</strong> ${pedido.metodo_pago}</p>
        <p><strong>Dirección de entrega:</strong> ${
          pedido.direccion_entrega
        }</p>

        <h3>Productos</h3>
        <ul>${listaProductosHTML}</ul>

        <h3>Total pagado: $${Number(pedido.total).toFixed(2)}</h3>

        <p><strong>Código de rastreo:</strong></p>
        <h2>${codigo_rastreo}</h2>

        <br>
        <p>Gracias por comprar en Deprati</p>
      </div>
    `;

    // Enviar correo
    await transporter.sendMail({
      from: `"Deprati - Notificaciones" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Actualización de pedido #${pedido.id_pedido} - ${estado}`,
      html,
    });

    console.log(" Correo de actualización enviado a:", email);
  } catch (error) {
    console.error(" Error enviando correo:", error);
    throw new Error("No se pudo enviar el correo de actualización");
  }
};
