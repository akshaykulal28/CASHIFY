const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');


const smtpHost = String(process.env.SMTP_HOST || '').trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = String(process.env.SMTP_USER || '').trim();
const smtpPass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
const mailFrom = String(process.env.MAIL_FROM || smtpUser || '').trim();

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





function getConfiguredGstRate() {
  const parsed = Number(process.env.GST_RATE_PERCENT);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }

  return 18;
}






function calculateInvoiceBreakdown(orders, fallbackTotal = 0, gstRatePercent = getConfiguredGstRate()) {
  const lineItems = orders.map((order) => {
    const quantity = Number(order.quantity || 0);
    const unitPrice = Number(order.price || 0);
    const lineTotal = quantity * unitPrice;
    return {
      name: order.name || 'Item',
      quantity,
      unitPrice,
      lineTotal,
    };
  });

  const computedGrandTotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const grandTotal = computedGrandTotal > 0 ? computedGrandTotal : Number(fallbackTotal || 0);
  const rate = Number(gstRatePercent || 0);
  const divisor = 1 + (rate / 100);

  const taxableAmount = divisor > 0 ? grandTotal / divisor : grandTotal;
  const gstAmount = grandTotal - taxableAmount;

  return {
    lineItems,
    grandTotal,
    taxableAmount,
    gstAmount,
    gstRatePercent: rate,
  };
}



function writeLabelValue(doc, label, value, y) {
  doc.font('Helvetica-Bold').fontSize(10).text(label, 40, y, { width: 220 });
  doc.font('Helvetica').fontSize(10).text(String(value || '-'), 260, y, { width: 290 });
}





function collectInvoiceDetails(orders, sessionId, currency, totalAmount) {
  const shippingAddress = orders.find((order) => order.shippingAddress)?.shippingAddress || null;
  const firstOrderDate = orders.find((order) => order.createdAt)?.createdAt || new Date();
  const createdAt = new Date(firstOrderDate);
  const invoiceDate = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;

  return {
    sessionId,
    currency: String(currency || 'INR').toUpperCase(),
    totalAmount: Number(totalAmount || 0),
    shippingAddress,
    customerEmail: orders.find((order) => order.customerEmail)?.customerEmail || '',
    invoiceDate,
  };
}



async function generateGstInvoiceAttachment({ orders, sessionId, currency = 'INR', totalAmount = 0 }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  if (!safeOrders.length) {
    throw new Error('Cannot generate invoice: no orders available.');
  }

  const details = collectInvoiceDetails(safeOrders, sessionId, currency, totalAmount);
  const breakdown = calculateInvoiceBreakdown(safeOrders, details.totalAmount);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', (err) => reject(err));
    doc.on('end', () => {
      const fileSafeSessionId = String(sessionId || 'session').replace(/[^a-zA-Z0-9_-]/g, '');
      resolve({
        filename: `gst-invoice-${fileSafeSessionId || 'session'}.pdf`,
        content: Buffer.concat(chunks),
        contentType: 'application/pdf',
      });
    });

    doc.font('Helvetica-Bold').fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(10).text('Cashify', { align: 'center' });
    doc.text('Payment Confirmation Invoice', { align: 'center' });
    doc.moveDown(1);

    const currencyCode = details.currency;
    const invoiceNumber = `INV-${String(details.sessionId || 'NA').slice(-10).toUpperCase()}`;
    writeLabelValue(doc, 'Invoice Number', invoiceNumber, 130);
    writeLabelValue(doc, 'Invoice Date', details.invoiceDate.toISOString().slice(0, 10), 146);
    
    writeLabelValue(doc, 'Customer Email', details.customerEmail || '-', 178);

    if (details.shippingAddress) {
      const addressLine = [
        details.shippingAddress.fullName,
        details.shippingAddress.street,
        [details.shippingAddress.city, details.shippingAddress.state].filter(Boolean).join(', '),
        [details.shippingAddress.postalCode, details.shippingAddress.country].filter(Boolean).join(', '),
      ].filter(Boolean).join(' | ');
      writeLabelValue(doc, 'Shipping Address', addressLine, 194);
    }

    let y = details.shippingAddress ? 225 : 210;
    doc.moveTo(40, y).lineTo(555, y).stroke('#d0d0d0');
    y += 12;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', 40, y, { width: 220 });
    doc.text('Qty', 265, y, { width: 50, align: 'right' });
    doc.text('Unit Price', 320, y, { width: 100, align: 'right' });
    doc.text('Total', 425, y, { width: 130, align: 'right' });
    y += 18;
    doc.moveTo(40, y).lineTo(555, y).stroke('#d0d0d0');
    y += 8;

    doc.font('Helvetica').fontSize(10);
    breakdown.lineItems.forEach((item) => {
      doc.text(String(item.name || 'Item'), 40, y, { width: 220 });
      doc.text(String(item.quantity), 265, y, { width: 50, align: 'right' });
      doc.text(`${formatCurrency(item.unitPrice)} ${currencyCode}`, 320, y, { width: 100, align: 'right' });
      doc.text(`${formatCurrency(item.lineTotal)} ${currencyCode}`, 425, y, { width: 130, align: 'right' });
      y += 18;
    });

    y += 6;
    doc.moveTo(40, y).lineTo(555, y).stroke('#d0d0d0');
    y += 10;

    doc.font('Helvetica').fontSize(10);
    doc.text(` Amount : ${formatCurrency(breakdown.taxableAmount)} ${currencyCode}`, 300, y, { width: 255, align: 'right' });
    y += 16;
    doc.text(`GST Total @ ${formatCurrency(breakdown.gstRatePercent)}%: ${formatCurrency(breakdown.gstAmount)} ${currencyCode}`, 300, y, { width: 255, align: 'right' });
    y += 16;
    doc.font('Helvetica-Bold').fontSize(11).text(`Grand Total: ${formatCurrency(breakdown.grandTotal)} ${currencyCode}`, 300, y, { width: 255, align: 'right' });

    y += 30;
    doc.font('Helvetica').fontSize(9).fillColor('#555555').text('This is a system-generated GST invoice.', 40, y, { width: 515, align: 'center' });

    doc.end();
  });
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

async function sendOrderConfirmationEmail({ to, orders, sessionId, currency = 'INR', totalAmount = 0, attachments = [] }) {
  ensureEmailConfig();

  const html = buildEmailHtml(orders, sessionId, currency, totalAmount);


  try {
    const info = await sendWithRetry({
      from: mailFrom,
      to,
      subject: 'Payment Successful - Order Confirmation',
      html,
      attachments,
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
  generateGstInvoiceAttachment,
  sendOrderConfirmationEmail,
  sendDeliveryStatusEmail,
};
