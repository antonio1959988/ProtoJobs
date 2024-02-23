const passport = require('passport')
const mongoose = require('mongoose')
const Vacante = mongoose.model('Vacante')
const Usuarios = mongoose.model('Usuarios')
const crypto = require('crypto')
const enviarEmail = require('../handlers/email')

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios'
})

// Revisar si el usuario está autenticado o no
exports.verificarUsuario = (req, res, next) => {
    // Revisar el usuario
    if(req.isAuthenticated()){
        return next() // Estan autenticados
    }

    // redireccionar
    res.redirect('/iniciar-sesion')
}

exports.mostrarPanel =async(req, res) => {

    // Consultar el usuario autenticado
    const vacantes = await Vacante.find({autor: req.user._id}).lean()
    res.render('administracion', {
        nombrePagina: 'Panel de Administración',
        tagLine: 'Crea y administra tus vacantes desde aqui',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        vacantes
    })
}

exports.cerrarSesion = (req, res, next) => {
    req.logout(function(err){
        if(err) {
            return next(err);
        }
        req.flash('correcto', 'Cerraste Sesión Correctamente')
        return res.redirect('/iniciar-sesion')
    });
 
    
}

// Formulario para reiniciar el password
exports.formReestablecerPassword = (req, res) => {
    res.render('reestablecer-password', {
        nombrePagina: 'Reestablece tu Password',
        tagline: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email'
    })
}

// Genera el token en la tabla del usuario
exports.enviarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({email: req.body.email})

    if(!usuario){
        req.flash('error', 'No existe esa cuenta')
        return res.redirect('/iniciar-sesion')
    }

    // El usuario existe, generar token
    usuario.token = crypto.randomBytes(20).toString('hex')
    usuario.expira = Date.now() + 3600000

    // Guardar el usuario 
    await usuario.save()

    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`

    console.log(resetUrl)

   // Enviar notificacion de email
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'reset'
    })

    // Todo correcto
    req.flash('correcto', 'Revisa tu email para las indicaciones')
    res.redirect('/iniciar-sesion')

}

// Valida si el token es valido y el usuario existe, muestra la vista
exports.reestablecerPassword = async(req, res) => {
    const usuario = await Usuarios.findOne(
        {
            token: req.params.token,
            expira: {
                $gt: Date.now()
            }
        }
    )

    if(!usuario){
        req.flash('error', 'El formulario ya no es válido, intenta de nuevo')
        res.redirect('/iniciar-sesion')
    }

    // Todo bien, mostrar el formulario
    res.render('nuevo-password', {
        nombrePagina: 'Nuevo Password'
    })
}

// Almacena el nuevo password en la bd
exports.guardarPassword = async(req, res) => {
    const usuario = await Usuarios.findOne(
        {
            token: req.params.token,
            expira: {
                $gt: Date.now()
            }
        }
    )

    // // No existe el usuario o el token ya expiro
    // if(!usuario){
    //     req.flash('error', 'El formulario ya no es válido, intenta de nuevo')
    //     res.redirect('/iniciar-sesion')
    // }

    // Asignar nuevo password, limpiar valores previos
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    // Agregar y eliminar valores del objeto
    await usuario.save();

    // Redirigir
    req.flash('correcto', 'Password Modificado Correctamente')
    res.redirect('iniciar-sesion')



}