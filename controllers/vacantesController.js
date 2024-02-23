const mongoose = require('mongoose')
const vacantes = require('../models/vacantes')
const Vacante = mongoose.model('Vacante')
const multer = require('multer')
const shortid = require('shortid')


exports.formularioNuevaVacante = (req, res) => {
    
    res.render('nueva-vacante', {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

// Agregar las vacantes a la base de datos
exports.agregarVacante = async (req, res) => {

    const vacante = new Vacante(req.body)

    // Usuario autor de la vacante
    vacante.autor = req.user._id

    // Crear arreglo de skills
    vacante.skills = req.body.skills.split(',')
    
    // Almacenarlo en la base de datos
    const nuevaVacante = await vacante.save()

    // Redireccionar
    res.redirect(`/vacantes/${nuevaVacante.url}`)
}

// Muestra una vacante
exports.mostrarVacante = async (req, res, next) => {

    const vacante = await Vacante.findOne({url: req.params.url}).populate('autor').lean()

    console.log(vacante)
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
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
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

// Validar y sanitizar los campos de las nuevas vacantes
exports.validarVacante = (req, res, next) => {
    // Sanitizar los campos
    req.sanitizeBody('titulo').escape()
    req.sanitizeBody('empresa').escape()
    req.sanitizeBody('ubicacion').escape()
    req.sanitizeBody('salario').escape()
    req.sanitizeBody('contrato').escape()
    req.sanitizeBody('skills').escape()

    // validar
    req.checkBody('titulo', 'Agrega un titulo a la Vacante').notEmpty()
    req.checkBody('empresa', 'Agrega una empresa').notEmpty()
    req.checkBody('ubicacion', 'Agrega una ubicación').notEmpty()
    req.checkBody('contrato', 'Selecciona el tipo de contrato').notEmpty()
    req.checkBody('skills', 'Agrega al menos una habilidad').notEmpty()

    const errores = req.validationErrors()

    if(errores){
        // Recargar la vista con los errores
        req.flash('error', errores.map(error => error.msg))

        return res.render('nueva-vacante', {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
    }

    next() // Siguiente middleware
}

exports.eliminarVacante = async (req, res) => {
    const { id } = req.params;
 
    try {
        const vacante = await Vacante.findById(id);
 
        if (!vacante) {
            return res.status(404).send('Vacante no encontrada');
        }
 
        if (verificarAutor(vacante, req.user)) {
            // Si este es el usuario, se puede eliminar
            await vacante.deleteOne();
            return res.status(200).send('Vacante eliminada correctamente');
            
        } else {
            // No permitido
            return res.status(403).send('No tienes permiso para eliminar esta vacante');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error interno del servidor');
    }
};

const verificarAutor = (vacante = {}, usuario = {}) =>{
    if(!vacante.autor.equals(usuario._id)){
        return false
    }
    return true
}

// Subir archivos en PDF
exports.subirCV = (req, res, next) => {
    upload(req, res, function(error){
        if(error){
            if(error instanceof multer.MulterError){
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', 'El archivo es muy grande: Máximo 100kb')
                } else {
                    req.flash('error', error.message)
                }
            } else{
                 req.flash('error', error.message)
            }
            res.redirect('back')
            return
        } else {
            return next()
        }
    })
    
 
}


// Opciones de multer
const configuracionMulter = {
    limits : { fileSize : 100000 },
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, next) => {
            next(null, __dirname+'/../public/uploads/cv/');
        },
    filename : (req, file, next) => {
            const extension = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extension}`);
        }
    }), 
    fileFilter(req, file, next) {
        if(file.mimetype === 'application/pdf') {
            //el formato es valido
            next(null, true);
        } else {
            // el formato no es valido
            next(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('cv');

// Almacenar los candidatos en la BD
exports.contactar = async (req, res, next) => {
    const vacante = await Vacante.findOne({url: req.params.url})

    // Sino existe la vacante
    if(!vacante) return next()

    // Todo bien, construir el nuevo objeto
    const nuevoCandidato = {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }

    // Almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save()

    // Mensaje flash y redirecciòn
    req.flash('correcto', 'Se envió tu CV correctamente')
    res.redirect('/')
}

exports.mostrarCandidatos = async(req, res, next) => {
    const vacante = await Vacante.findById(req.params.id).lean()



    if(vacante.autor.toString() != req.user._id.toString()){
        return next()
    } 

    if(!vacante) return next()
    
    res.render('candidatos', {
        nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos
    })
}

// Bucador de bacantes
exports.buscarVacantes = async(req, res) => {
    const vacantes = await Vacante.find({
        $text: {
            $search: req.body.q
        }
    }).lean()

    // Mostrar las vacantes
    res.render('home', {
        nombrePagina: `Resultados para la búsqueda: ${req.body.q}`,
        barra: true,
        vacantes
    })
}