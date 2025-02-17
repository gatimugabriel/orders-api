import Queue from 'bull';
import {sendMail} from '../utils/mailer.util';
import {styleOrderDetails} from "../views/order_body_template";

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
    const {subject, htmlBody} = styleOrderDetails(orderDetails)

    await emailWorker.add({
        email: orderDetails.user.email,
        subject,
        htmlBody
    });
};

