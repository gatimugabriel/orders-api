import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {mailConfig} from '../config/mail.config';

dotenv.config();

// -- transport config -- //
const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const sendMail = async (to: string, subject: string, htmlBody: string) => {
    const mailOptions = {
        from: mailConfig.EMAIL_SENDER,
        to,
        subject,
        html: htmlBody,
    };

    try {
        return await transport.sendMail(mailOptions);
    } catch (error) {
        console.log('Error occurred', error);
        throw new Error('Failed to send email. Try again later');
    }
};






