import Queue from 'bull';
import {sendMail} from '../utils/mailer.util';

const emailWorker = new Queue('email-queue', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    }
});

// Process email queue
emailWorker.process(async (job: any) => {
    const {email, subject, htmlBody} = job.data;
    await sendMail(email, subject, htmlBody);
}).then(() => {
    console.log('Email queue processed successfully');
});

export const queueOrderConfirmationEmail = async (orderDetails: any) => {
    const subject = 'Order Confirmation';
    const htmlBody = `
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #333;
          }
          p {
            color: #666;
          }
        </style>

      <body>
        <div class="container">
          <h1>Order Confirmation</h1>
          <p>Thank you for your order!</p>
          <p>Order ID: ${orderDetails.id}</p>
          <p>Total Amount: $${orderDetails.totalPrice}</p>
          <p>Status: ${orderDetails.status}</p>
        </div>
      </body>
  `;

    await emailWorker.add({
        email: orderDetails.user.email,
        subject,
        htmlBody
    });
};

