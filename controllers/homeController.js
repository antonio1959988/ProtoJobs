const mongoose = require('mongoose')
const Vacante = mongoose.model('Vacante')

exports.mostrarTrabajos = async(req, res, next) => {

    const vacantes = await Vacante.find().lean()

    if(!vacantes) return next()

    let barra = true
    let admin = false
    
    if(req.user){
        barra = false,
        admin = true
    }

    res.render('home', {
        nombrePagina: 'ProtoJobs',
        tagline: 'Encuentra y publica trabajos',
        barra,
        nombre : false,
        boton: true,
        vacantes,
        admin
    })
}