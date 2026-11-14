import { createTransport } from "nodemailer";

const contactEmail = process.env.CONTACT_EMAIL ?? "contacto@funcode.cl";
const smtpHost = process.env.SMTP_HOST;
const smtpUser = process.env.SMTP_USER ?? process.env.CONTACT_EMAIL;
const smtpPass = process.env.SMTP_PASS;
const smtpPort = Number(process.env.SMTP_PORT ?? 465);
const smtpSecure = String(process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false";

let transporter = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendContactEmail({ name, email, phone, message }) {
  if (!transporter) {
    throw new Error("SMTP no configurado");
  }

  const subject = `Nuevo contacto Funcode: ${name}`;
  const text = [
    `Nombre: ${name}`,
    `Email: ${email}`,
    phone ? `Teléfono: ${phone}` : "Teléfono: No indicado",
    "",
    "Mensaje:",
    message,
  ].join("\n");

  await transporter.sendMail({
    from: `"Funcode Contacto" <${smtpUser}>`,
    to: contactEmail,
    replyTo: email,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="margin: 0 0 16px;">Nuevo contacto desde Funcode</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone || "No indicado"}</p>
        <p><strong>Mensaje:</strong></p>
        <div style="padding: 12px 16px; background: #f3f4f6; border-radius: 8px;">${message.replace(/\n/g, "<br />")}</div>
      </div>
    `,
  });
}

export async function sendVerificationEmail({ email, code }) {
  if (!transporter) {
    throw new Error("SMTP no configurado");
  }

  const result = await transporter.sendMail({
    from: `"Funcode" <${smtpUser}>`,
    to: email,
    subject: "Tu código de verificación de Funcode",
    text: `Tu código de verificación es: ${code}\n\nCaduca en 10 minutos. Si no solicitaste esta cuenta, ignora este correo.`,
  });

  if (!result.accepted?.length) {
    throw new Error("El servidor de correo no aceptó el destinatario");
  }
}
