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
    req.checkBody('password', 'El password no puede ir vacío').notEmpty()
    req.checkBody('confirmar', 'Confirmar password no puede ir vacío').notEmpty()
    req.checkBody('confirmar', 'El password es diferente').equals(req.body.password)

    const errores = req.validationErrors()

    if(errores){
        // Si hay errores
        req.flash('error', errores.map(error => error.msg))

        res.render('crear-cuenta', {
            nombrePagina: 'Crea tu cuenta en ProtoJobs',
            tagline: 'Comienza a publicar tus vacantes gratis, sol debes crear una cuenta',
            mensajes: req.flash(),
        })
        return;
    }

    // Si toda la validación es correcta
    next()
}

exports.crearUsuario = async (req, res) => {
    // Crear el usuario
    const usuario = new Usuarios(req.body)

    try {
        await usuario.save()
        res.redirect('/iniciar-sesion')
    } catch (error) {
        req.flash('error', error)
        res.redirect('/crear-cuenta')
    }

    
}

exports.formIniciarSesion = async (req, res) => {
        res.render('iniciar-sesion', {
            nombrePagina: 'Iniciar Sesión ProtoJobs'
        })
    }

exports.formEditarPerfil = (req, res) => {
    res.render('editar-perfil', {
        nombrePagina: 'Edita tu perfil en ProtoJobs',
        usuario: req.user.toObject(),
        cerrarSesion: true,
        nombre: req.user.nombre,
    })
}

// Guardar cambios editar perfil
exports.editarPerfil = async (req, res) => {
    const usuario = await Usuarios.findById(req.user._id)

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email

    if(req.body.password){
        usuario.password = req.body.password
    }

    await usuario.save()

    req.flash("correcto", "Cambios Guardados Correctamente")
    // redirect
    res.redirect('/administracion')
}