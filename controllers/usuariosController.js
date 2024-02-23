const mongoose = require('mongoose')
const Usuarios = mongoose.model('Usuarios')
const multer = require('multer')
const shortid = require('shortid')



exports.subirImagen = (req, res, next) => {
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
            res.redirect('/administracion')
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
            next(null, __dirname+'/../public/uploads/perfiles/');
        },
    filename : (req, file, next) => {
            const extension = file.mimetype.split('/')[1];
            next(null, `${shortid.generate()}.${extension}`);
        }
    }), 
    fileFilter(req, file, next) {
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            //el formato es valido
            next(null, true);
        } else {
            // el formato no es valido
            next(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

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
        imagen: req.user.imagen
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

    if(req.file){
        usuario.imagen = req.file.filename
    }

    await usuario.save()

    req.flash("correcto", "Cambios Guardados Correctamente")
    // redirect
    res.redirect('/administracion')
}

// Sanitizar y validar el formulario de ediciòn de perfil
exports.validarPerfil = (req, res, next) => {
    // Sanitizar
    req.sanitizeBody('nombre').escape()
    req.sanitizeBody('email').escape()

    if(req.body.password){
        req.sanitizeBody('password').escape()
    }

    // Validar
    req.checkBody('nombre', 'El nombre no puede ir vacío').notEmpty()
    req.checkBody('email', 'El correo no puede ir vacío').notEmpty()

    const errores = req.validationErrors()

    if(errores){
        req.flash('error', errores.map(error => error.msg))
        return res.render('editar-perfil', {
            nombrePagina: 'Edita tu perfil en ProtoJobs',
            usuario: req.user.toObject(),
            cerrarSesion: true,
            nombre: req.user.nombre,
            imagen: req.user.imagen,
            mensajes: req.flash()
        })
    }
    next() // Todo bien, siguiente middleware
}

