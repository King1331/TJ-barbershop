// app/api/reset-password/route.js
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/firebase-admin";

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

    const resetLink = await adminAuth.generatePasswordResetLink(email);

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "TJ's Cuts", email: "maikelandres2134@gmail.com" },
        to: [{ email }],
        subject: "Restablecer contraseña — TJ's Cuts",
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid #222;">
    
    <!-- HEADER -->
    <div style="background: #111; padding: 32px 40px; text-align: center; border-bottom: 1px solid #222;">
    <img src="https://i.postimg.cc/qvdLcdqM/Captura-de-pantalla-2026-03-16-024929.png" alt="TJ's Cuts" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 16px;" />
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">TJ's Cuts Barbershop</h1>
      <p style="color: #666; margin: 4px 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">San José, Costa Rica</p>
    </div>

    <!-- BODY -->
    <div style="padding: 40px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-block; background: #1a1a1a; border: 1px solid #333; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 28px; margin-bottom: 16px;">✂️</div>
        <h2 style="color: #ffffff; margin: 0 0 8px; font-size: 20px;">Restablecer contraseña</h2>
        <p style="color: #888; margin: 0; font-size: 14px; line-height: 1.6;">
          Recibimos una solicitud para restablecer la contraseña<br/>de tu cuenta en el panel de administración.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${resetLink}" style="display: inline-block; background: #ffffff; color: #000000; padding: 14px 36px; border-radius: 50px; font-weight: 800; text-decoration: none; font-size: 15px; letter-spacing: 0.5px;">
          Restablecer contraseña
        </a>
      </div>

      <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #666; margin: 0; font-size: 12px; line-height: 1.6; text-align: center;">
          ⚠️ Este link expira en <strong style="color: #aaa;">24 horas</strong>.<br/>
          Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #1a1a1a; margin-bottom: 24px;" />

      <p style="color: #444; font-size: 12px; text-align: center; margin: 0; line-height: 1.8;">
        TJ's Cuts Barbershop · San José, Costa Rica<br/>
        <a href="https://wa.me/50685654169" style="color: #555; text-decoration: none;">WhatsApp: +506 8565-4169</a>
      </p>
    </div>

  </div>
`
        ,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Brevo error:", err);
      return NextResponse.json({ error: "Error enviando correo" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}