const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const mailFrom = process.env.MAIL_FROM || smtpUser;

const DELIVERY_STATUS_MESSAGES = {
  delivered: 'Your order has been delivered! Thank you for shopping with us.',
  shipped: 'Your order is on the way! You can expect it soon.',
  pending: 'Your order is being prepared for shipment.',
};

function createTransporter() {
  const missing = [];
  if (!smtpHost) missing.push('SMTP_HOST');
  if (!smtpUser) missing.push('SMTP_USER');
  if (!smtpPass) missing.push('SMTP_PASS');

  if (missing.length) {
    console.warn(`[mail] SMTP transporter disabled. Missing env vars: ${missing.join(', ')}`);
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 20000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 15000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

function ensureEmailConfig() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Email service is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS.');
  }

  if (!mailFrom) {
    throw new Error('MAIL_FROM is missing.');
  }
}

function normalizeSendMailError(err, contextLabel) {
  const code = String(err?.code || '').toUpperCase();
  const rawMessage = String(err?.message || '');

  if (code === 'EAUTH') {
    return new Error(`${contextLabel}: SMTP authentication failed. Verify SMTP_USER and SMTP_PASS.`);
  }

  if (
    code === 'ETIMEDOUT' ||
    code === 'ECONNECTION' ||
    code === 'ESOCKET' ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    /unexpected socket close|socket hang up|connection closed|timed out/i.test(rawMessage)
  ) {
    return new Error(`${contextLabel}: SMTP connection failed. Verify SMTP_HOST, SMTP_PORT, SMTP_SECURE and provider network access.`);
  }

  return new Error(`${contextLabel}: ${rawMessage || 'unknown email send error'}`);
}

function isTransientMailError(err) {
  const code = String(err?.code || '').toUpperCase();
  const rawMessage = String(err?.message || '');
  return (
    code === 'ETIMEDOUT' ||
    code === 'ECONNECTION' ||
    code === 'ESOCKET' ||
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    /unexpected socket close|socket hang up|connection closed|timed out|temporary/i.test(rawMessage)
  );
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithRetry(mailOptions, contextLabel) {
  const maxAttempts = Number(process.env.SMTP_RETRY_ATTEMPTS || 3);
  const baseDelayMs = Number(process.env.SMTP_RETRY_BASE_DELAY_MS || 1200);

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const transporter = createTransporter();
      if (!transporter) {
        throw new Error('Email service is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS.');
      }
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (err) {
      lastError = err;
      const shouldRetry = attempt < maxAttempts && isTransientMailError(err);
      console.error(`[mail] ${contextLabel} attempt ${attempt}/${maxAttempts} failed:`, err?.message || err);
      if (!shouldRetry) {
        break;
      }

      const waitMs = baseDelayMs * attempt;
      await delay(waitMs);
    }
  }

  throw normalizeSendMailError(lastError, contextLabel);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

  const shippingAddress = orders.find((order) => order.shippingAddress)?.shippingAddress || null;
  const shippingAddressHtml = shippingAddress
    ? `
      <div style="margin-top:16px;padding:12px;border:1px solid #ddd;border-radius:8px;">
        <h3 style="margin:0 0 8px;">Shipping Address</h3>
        <p style="margin:0;">${shippingAddress.fullName || ''}</p>
        <p style="margin:0;">${shippingAddress.street || ''}</p>
        <p style="margin:0;">${[shippingAddress.city, shippingAddress.state, shippingAddress.postalCode].filter(Boolean).join(', ')}</p>
        <p style="margin:0;">${shippingAddress.country || ''}</p>
      </div>
    `
    : '';

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
      ${shippingAddressHtml}
      <p style="margin-top:12px;"><strong>Grand Total:</strong> ${formatCurrency(total)} ${currency}</p>
      <p>Thank you for shopping with us.</p>
    </div>
  `;
}

async function sendOrderConfirmationEmail({ to, orders, sessionId, currency = 'INR', totalAmount = 0 }) {
  ensureEmailConfig();

  const html = buildEmailHtml(orders, sessionId, currency, totalAmount);


  try {
    const info = await sendWithRetry({
      from: mailFrom,
      to,
      subject: 'Payment Successful - Order Confirmation',
      html,
    }, 'Unable to send order confirmation email');
    console.info(`[mail] Order confirmation sent. sessionId=${sessionId} to=${to} messageId=${info?.messageId || 'n/a'}`);
  } catch (err) {
    throw err;
  }
}

async function sendDeliveryStatusEmail({ to, orderName, deliveryStatus }) {
  ensureEmailConfig();

  const formattedStatus = capitalize(deliveryStatus);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;">
      <h2>Order Status Update</h2>
      <p>Dear Customer,</p>
      <p><strong>Item:</strong> ${orderName}</p>
      <p><strong>Status:</strong> <span style="color:#28a745;font-weight:bold;">${formattedStatus}</span></p>
      <p>${DELIVERY_STATUS_MESSAGES[deliveryStatus] || 'Your order status has been updated.'}</p>
      <p>Thank you for your patience!</p>
    </div>
  `;

  try {
    const info = await sendWithRetry({
      from: mailFrom,
      to,
      subject: `Order Status Update - ${formattedStatus}`,
      html,
    }, 'Unable to send delivery status email');
    console.info(`[mail] Delivery status email sent. status=${formattedStatus} to=${to} messageId=${info?.messageId || 'n/a'}`);
  } catch (err) {
    throw err;
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendDeliveryStatusEmail,
};
