import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend('re_Y6mcpAP5_7BujQeTWVNaVvj4Bev6Afgz1');

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // Resend standard testing domain
      to: ['siteget1234@gmail.com'],
      replyTo: email,
      subject: `New Contact Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
