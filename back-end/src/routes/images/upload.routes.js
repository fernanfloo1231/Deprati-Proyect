const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/");
  },
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name; 
    const extension = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();

    // Crear nombre: nombre-original-timestamp.extensión
    const finalName = `${originalName}-${timestamp}${extension}`;

    console.log(" Guardando imagen como:", finalName);
    cb(null, finalName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

router.post("/upload", upload.single("imagen"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se subió ningún archivo",
      });
    }

    console.log(" Archivo recibido:", {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    //  RESPUESTA CONSISTENTE
    res.json({
      success: true,
      message: "Imagen subida exitosamente",
      filename: req.file.filename,
      originalname: req.file.originalname,
      url: `/img/${req.file.filename}`,
    });
  } catch (error) {
    console.error(" Error en upload:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
    });
  }
});

module.exports = router;
