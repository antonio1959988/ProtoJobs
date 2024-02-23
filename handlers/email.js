const emailConfig = require('../config/email')
const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const util = require('util')

var transport = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "ba291f2139372c",
      pass: "a1aa031f530c83"
    }
  });

// Utilizar templates de handlebar
transport.use('compile', hbs({
    viewEngine: 'handlebars',
    viewPath: __dirname+"/../views/email/",
    extName: '.handlebars'
}))

exports.enviar = async(opciones) => {
    const opcionesEmail = {
        from: 'ProtoJobs <noreply@protojobs.com>',
        to: opciones.usuario.email,
        subject: opciones.subject,
        template: opciones.archivo,
        context: {
            resetUrl: opciones.resetUrl
        }
    }

    const sendMail = util.promisify(transport.sendMail, transport)
    return sendMail.call(transport, opcionesEmail)
}