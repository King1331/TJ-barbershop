import { Resend } from "resend";
import { getAuth } from "@/lib/firebase/firebase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { email } = await req.json();

  try {
    const link = await getAuth().generatePasswordResetLink(email);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Restablecer contraseña - TJ's Cuts",
      html: `
        <h2>Restablecer contraseña - TJ's Cuts</h2>
        <p>Haz click en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${link}" style="background:black;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">
          Restablecer contraseña
        </a>
        <p>Este enlace expira en 1 hora.</p>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("ERROR DETALLADO:", error.code, error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}