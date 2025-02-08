import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {mailConfig} from '../config/mail.config';
import {PrismaClient} from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const Order = prisma.order;

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

const sendMail = async (to: string, subject: string, htmlBody: string) => {
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

export const sendResetPassword = async ({userName, email, token}: {
    userName: string;
    email: string;
    token: string
}) => {
    const htmlBody = `
        <div>
        <h1>Reset your Nouva-Vet Account Password</h1>
        <h2>Hello ${userName}</h2>
        <p>
        You are receiving this email because you (or someone else) has requested a password reset for your Nouva-Vet account.\nConfirm by clicking on the following link</p>\n
        <a href=${process.env.CLIENT_ORIGIN}/auth/reset-password/${token}> Click here to reset your password</a>\n
           If you did not request this, please ignore this email and your password will remain unchanged.
        </div>
    `;

    return sendMail(email, 'Password Reset Request', htmlBody);
};






