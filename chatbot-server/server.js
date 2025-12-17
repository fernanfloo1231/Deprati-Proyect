import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 Contexto fijo de la tienda
const tiendaContexto = `
Eres un asistente virtual de la tienda web DePrati. 
Ayudas a los clientes con información sobre productos y categorías: Hombres, Mujeres, Tecnología, Hogar y Belleza.
Responde de manera cordial y recomienda productos o promociones cuando sea posible.
`;

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: tiendaContexto },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    //  Depuración
    console.log(
      " RESPUESTA COMPLETA:",
      JSON.stringify(response.data, null, 2)
    );

    //  Extraer la respuesta real del modelo
    let botReply = "";
    if (response.data?.output && response.data.output.length > 0) {
      response.data.output.forEach((item) => {
        if (item.content) {
          item.content.forEach((c) => {
            if (c.type === "output_text") {
              botReply += c.text;
            }
          });
        }
      });
    }

    if (!botReply)
      botReply = "Lo siento, no pude generar una respuesta sobre DePrati.";

    res.json({ reply: botReply });
  } catch (error) {
    console.error(" Error OpenAI:", error.response?.data || error.message);
    res.status(500).json({
      error: "Error procesando la respuesta del chatbot",
    });
  }
});

const PORT = 3001;
app.listen(PORT, () =>
  console.log(` Chatbot server running at http://localhost:${PORT}`)
);
