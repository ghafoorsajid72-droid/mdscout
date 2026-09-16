import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  let medicationEmailsSent = 0;
  let appointmentEmailsSent = 0;

  try {
    // === Part 1: Medication reminders ===
    const { data: meds } = await supabase
      .from("health_records")
      .select("id, user_id, medication_name, medication_time")
      .eq("record_type", "medication")
      .eq("reminder_active", true)
      .or(`last_reminder_sent.is.null,last_reminder_sent.neq.${today}`);

    if (meds && meds.length > 0) {
      const userIds = [...new Set(meds.map((m) => m.user_id))];
      const { data: users } = await supabase.auth.admin.listUsers();
      const emailMap = new Map(users?.users.map((u) => [u.id, u.email]) || []);

      const medsByUser = new Map<string, typeof meds>();
      for (const med of meds) {
        if (!medsByUser.has(med.user_id)) medsByUser.set(med.user_id, []);
        medsByUser.get(med.user_id)!.push(med);
      }

      for (const [userId, userMeds] of medsByUser.entries()) {
        const email = emailMap.get(userId);
        if (!email) continue;

        const medList = userMeds
          .map((m) => `<li>${m.medication_name} — ${m.medication_time}</li>`)
          .join("");

        await resend.emails.send({
          from: "MDScout <onboarding@resend.dev>",
          to: email,
          subject: "Your Medication Reminders — MDScout",
          html: `<h2>Today's Medication Schedule</h2><ul>${medList}</ul><p>— MDScout Health Tracker</p>`,
        });

        for (const med of userMeds) {
          await supabase
            .from("health_records")
            .update({ last_reminder_sent: today })
            .eq("id", med.id);
        }

        medicationEmailsSent++;
      }
    }

    // === Part 2: Appointment reminders (1 day before) ===
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const { data: appts } = await supabase
      .from("doctor_appointments")
      .select("id, user_id, doctor_name, appointment_date, appointment_time")
      .eq("appointment_date", tomorrowStr)
      .eq("reminder_sent", false);

    if (appts && appts.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const emailMap = new Map(users?.users.map((u) => [u.id, u.email]) || []);

      for (const appt of appts) {
        const email = emailMap.get(appt.user_id);
        if (!email) continue;

        await resend.emails.send({
          from: "MDScout <onboarding@resend.dev>",
          to: email,
          subject: "Appointment Reminder — MDScout",
          html: `<h2>Upcoming Appointment Tomorrow</h2><p>You have an appointment with <strong>${appt.doctor_name}</strong> tomorrow (${appt.appointment_date})${appt.appointment_time ? ` at ${appt.appointment_time}` : ""}.</p><p>— MDScout</p>`,
        });

        await supabase
          .from("doctor_appointments")
          .update({ reminder_sent: true })
          .eq("id", appt.id);

        appointmentEmailsSent++;
      }
    }

    return NextResponse.json({
      success: true,
      medicationEmailsSent,
      appointmentEmailsSent,
    });
  } catch (err: any) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}