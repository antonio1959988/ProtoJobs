const passport = require('passport')
const mongoose = require('mongoose')
const Vacante = mongoose.model('Vacante')

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