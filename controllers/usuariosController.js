const mongoose = require('mongoose')
const Usuarios = mongoose.model('Usuarios')

exports.formCrearCuenta = (req, res) => {
    res.render('crear-cuenta', {
        nombrePagina: 'Crea tu cuenta en ProtoJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta'
    })
}

exports.validarRegistro = (req, res, next) => {

    // Sanitizar
    req.sanitizeBody('nombre').escape()
    req.sanitizeBody('email').escape()
    req.sanitizeBody('password').escape()
    req.sanitizeBody('confirmar').escape()

    // Validar
    req.checkBody('nombre', 'El nombre es obligatorio').notEmpty()
    req.checkBody('email', 'El email debe ser válido').isEmail()
    req.checkBody('password', 'El password no puede ir vacío')
    req.checkBody('confirmar', 'Confirmar password no puede ir vacío')
    req.checkBody('confirmar', 'El password es diferente').equals(req.body.password)

    const errores = req.validationErrors()

    if(errores){
        // Si hay errores
    }

    // Si toda la validación es correcta
    next()
}

exports.crearUsuario = async (req, res) => {
    // Crear el usuario
    const usuario = new Usuarios(req.body)

    const nuevoUsuario = await usuario.save()

    if(!nuevoUsuario) return next()

    res.redirect('/iniciar-sesion')
}