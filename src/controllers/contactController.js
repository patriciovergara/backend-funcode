import { sendContactEmail } from "../config/mailer.js";

export async function submitContactForm(req, res) {
  try {
    const contact = req.validatedContact;

    await sendContactEmail(contact);

    return res.status(200).json({
      message: "Tu mensaje ha sido enviado correctamente.",
    });
  } catch (error) {
    console.error("Error al enviar el formulario de contacto:", error);

    if (error.message === "SMTP no configurado") {
      return res.status(503).json({
        message:
          "El correo corporativo aún no está configurado. Puedes escribir directamente a contacto@funcode.cl.",
      });
    }

    return res.status(500).json({
      message: "No pudimos enviar tu mensaje. Inténtalo nuevamente.",
    });
  }
}
