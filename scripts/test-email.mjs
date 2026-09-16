import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  const { data, error } = await resend.emails.send({
    from: "MDScout <onboarding@resend.dev>",
    to: "ghafoorsajid72@gmail.com",
    subject: "MDScout Test Email",
    html: "<p>Yeh test email hai MDScout se — agar yeh mil gaya, matlab Resend sahi kaam kar raha hai!</p>",
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Email sent successfully!", data);
  }
}

sendTestEmail();