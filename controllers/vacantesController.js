const mongoose = require('mongoose')
const vacantes = require('../models/vacantes')
const Vacante = mongoose.model('Vacante')


exports.formularioNuevaVacante = (req, res) => {
    
    res.render('nueva-vacante', {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante'
    })
}

// Agregar las vacantes a la base de datos
exports.agregarVacante = async (req, res) => {

    const vacante = new Vacante(req.body)

    // Crear arreglo de skills
    vacante.skills = req.body.skills.split(',')
    
    // Almacenarlo en la base de datos
    const nuevaVacante = await vacante.save()

    // Redireccionar
    res.redirect(`/vacantes/${nuevaVacante.url}`)
}

// Muestra una vacante
exports.mostrarVacante = async (req, res, next) => {

    const vacante = await Vacante.findOne({url: req.params.url}).lean()

    // Si no hay resultados
    if(!vacante) return next()

    res.render('vacante', {
        vacante,
        nombrePagina: vacante.titulo,
        barra: true
    })
}

exports.formEditarVacante = async (req, res, next) => {
    const vacante = await Vacante.findOne({url: req.params.url}).lean();

    if(!vacante) return next()

    res.render('editar-vacante', {
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`
    })
}

exports.editarVacante = async (req, res) => {
    const vacanteActualizada = req.body
    vacanteActualizada.skills = req.body.skills.split(',')

    const vacante = await Vacante.findOneAndUpdate({url: req.params.url}, vacanteActualizada, {
        new: true,
        runValidators: true
    })

    res.redirect(`/vacantes/${vacante.url}`)
}