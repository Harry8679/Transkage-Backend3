import nodemailer from 'nodemailer';
import path from 'path';
import hbs from 'nodemailer-express-handlebars';
import nodemailerSendgrid from 'nodemailer-sendgrid';
import { create } from 'express-handlebars';

const sendMail = async (
  subject: string, 
  send_to: string, 
  sent_from: string, 
  reply_to: string, 
  template: string, 
  firstName: string, 
  lastName: string, 
  link: string
) => {
    const transporter = nodemailer.createTransport(
        nodemailerSendgrid({
            apiKey: process.env.SENDGRID_KEY!,
        })
    );

    const viewEngine = create({
        extname: '.handlebars',
        layoutsDir: path.resolve('./views/layouts'),
        defaultLayout: '',
        partialsDir: path.resolve('./views/partials'),
    });

    const handlebarOptions = {
        viewEngine,
        viewPath: path.resolve('./views'),
        extName: '.handlebars',
    };

    transporter.use('compile', hbs(handlebarOptions));

    const options = {
        from: sent_from,
        to: send_to,
        replyTo: reply_to,
        subject,
        template,
        context: {
            firstName,
            lastName,
            link
        }
    };

    // Envoi de l'email
    try {
        const info = await transporter.sendMail(options);
        console.log('Email envoyé avec succès:', info.response);
    } catch (err: any) {
        console.log('Erreur lors de l\'envoi de l\'email:', err.message);
    }
};

export default sendMail;
