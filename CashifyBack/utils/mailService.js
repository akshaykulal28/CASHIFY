const nodemailer = require('nodemailer');

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;

function createTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

const transporter = createTransporter();

function formatCurrency(value) {
  const amount = Number(value || 0);
  return amount.toFixed(2);
}

function buildEmailHtml(orders, sessionId, currency, total) {
  const rows = orders
    .map((order) => {
      const quantity = Number(order.quantity || 0);
      const price = Number(order.price || 0);
      const itemTotal = quantity * price;
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;">${order.name}</td>
        <td style="padding:8px;border:1px solid #ddd;">${quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;">${formatCurrency(price)} ${currency}</td>
        <td style="padding:8px;border:1px solid #ddd;">${formatCurrency(itemTotal)} ${currency}</td>
      </tr>`;
    })
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;">
      <h2>Order Confirmation</h2>
      <p>Your payment was successful and your order has been placed.</p>
      <p><strong>Payment Session:</strong> ${sessionId}</p>
      <table style="border-collapse:collapse;width:100%;margin-top:12px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Item</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Qty</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Unit Price</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:12px;"><strong>Grand Total:</strong> ${formatCurrency(total)} ${currency}</p>
      <p>Thank you for shopping with us.</p>
    </div>
  `;
}

async function sendOrderConfirmationEmail({ to, orders, sessionId, currency = 'INR', totalAmount = 0 }) {
  if (!transporter) {
    throw new Error('Email service is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS.');
  }

  if (!mailFrom) {
    throw new Error('MAIL_FROM is missing.');
  }

  const html = buildEmailHtml(orders, sessionId, currency, totalAmount);

  await transporter.sendMail({
    from: mailFrom,
    to,
    subject: 'Payment Successful - Order Confirmation',
    html,
  });
}

module.exports = {
  sendOrderConfirmationEmail,
};
