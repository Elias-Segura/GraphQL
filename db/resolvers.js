const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const bcryptjs = require('bcryptjs');
const jwt  = require('jsonwebtoken');
require('dotenv').config({path : 'variables.env' });
const crearToken = (usuario, palabrasecreta, expiresIn) => {
console.log(usuario);
const {id, email, nombre, apellido} = usuario
 return jwt.sign({id, email, nombre, apellido}, palabrasecreta, {expiresIn})

} 
const resolvers =  {

    Query: {
        obtenerUsuario: async (_,{}, ctx) => {
           return ctx.usuario
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos; 
            } catch (error) {
                
            }
        },
        obtenerProducto: async (_,{id}) =>{
            const producto = await Producto.findById(id);
            console.log(producto)
            if(!producto){
                throw new Error('Producto no existe');
            }
            return producto 
          
        }, 
        obtenerClientes: async () => {

            try {
                const clientes =  await Cliente.find({});
                return clientes
            } catch (error) {
                
            }
        },
        obtenerClientesVendedor : async (_, {}, ctx) =>{


            const clientesVendedor = await Cliente.find({vendedor: ctx.usuario.id.toString()});
            return clientesVendedor;
        },
        obtenerCliente: async (_, {id}, ctx)=>{
            const cliente  = await Cliente.findById(id)
            if(!cliente){
                throw new Error('El cliente no existe')

            }
            if(cliente.vendedor.toString()!== ctx.usuario.id){
                throw new Error('No tiene los credenciales')
            }
            return cliente

        },
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({})
                return pedidos
            } catch (error) {
                
            }

        },
        obtenerPedidosVendedor: async (_,{}, ctx)=>{
            const pedidos = await Pedido.find({vendedor: ctx.usuario.id.toString()}).populate('cliente')
            console.log(pedidos)
            return pedidos;
        },
        obtenerPedido: async(_, {id}, ctx)=>{
            const pedido = await Pedido.findById(id)
            if(!pedido){
                throw new Error('El pedido no existe')
        
        }
        if(pedido.vendedor.toString() !== ctx.usuario.id){
            throw new Error('No tienes los credenciales')
        }
          return pedido
        },
        obtenerPedidoEstado: async (_,{estado}, ctx)=>{
            const pedidos= await Pedido.find({vendedor: ctx.usuario.id.toString(), estado:estado})
            return pedidos
        },
        mejoresClientes: async() =>{
            const clientes = await Pedido.aggregate([
                {
                    $match: {estado: "COMPLETADO"}
                },
                {   $group:
                     {
                         _id: "$cliente",
                         total:{$sum: "$total"}
                     }
                },
                {
                    $lookup:
                    {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: "_id",
                        as: "cliente"
                    }
                },
                {
                    $sort : { total : -1}
                }
            ])
            return clientes
        }, 
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                {$match: {estado: "COMPLETADO"}},
                {$group:{_id:"$vendedor", total:{$sum: '$total'}}},
                {$lookup: {from: 'usuarios', localField: '_id', foreignField: '_id', as:"vendedor"}},
                {$limit:10},
                {$sort: {total: - 1}}
               
            ])
            return vendedores
        },
        buscarProducto: async(_,{texto})=>{
            const productos = await Producto.find({$text:{$search:texto} })
            return productos
        }
    }
    ,
    Mutation: {

        nuevoUsuario: async (_, {input}) => {
            const {email, password} = input;
            //Revisar si el usuario existe
            
            const existeUsuario = await Usuario.findOne({email});
            console.log(existeUsuario);

            if(existeUsuario){
                throw new Error('Usuario ya esta registrado')
            }
            //hashear password 
            const salt = await bcryptjs.genSalt(10);

            input.password = await bcryptjs.hash(password, salt); 
            
            try {
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;
            } catch (error) {
                console.log(error)
            }


        },
        autenticarUsuario: async (_, {input}) =>  {
            // si existe
            const {email, password}  = input 

            const existeUsuario = await Usuario.findOne({email})
            if(!existeUsuario){
                throw new Error('Usuario no existe')
            }

            // revisar password
            const passwordCorrecto = await bcryptjs.compare(password, existeUsuario.password)
            if(!passwordCorrecto){
                throw new Error('password incorrecto')
            }

            return {
                token:crearToken(existeUsuario,process.env.SECRETA, '24h' )

            }


            //crear token 

        },
         nuevoProducto: async (_, {input}) =>{
            try {
                const producto = new Producto(input); 
                const resultado = await producto.save();
                console.log(resultado)
                return resultado; 
            } catch (error) {
                
            }

         },
         actualizarProducto: async(_,{id, input}) =>{
            let producto = await Producto.findById(id);
            console.log(producto)
            if(!producto){
                throw new Error('Producto no existe');
            }

            //guardamos en bd

            producto = await Producto.findOneAndUpdate({_id: id}, input,{new: true});


            return producto 
         },
         eliminarProducto: async (_, {id}) => {
            let producto = await Producto.findById(id);
            console.log(producto)
            if(!producto){
                throw new Error('Producto no existe');
            }
            await Producto.findOneAndDelete({_id : id});

            return "Eliminado con exito"
         },
         nuevoCliente: async(_, {input},ctx)=>{
             console.log(ctx)
            const {email}= input;
            const existeCliente = await Cliente.findOne({email});
            console.log(existeCliente);

            if(existeCliente){
                throw new Error('Usuario existe')
            }
                const cliente = new Cliente(input);
                cliente.vendedor = ctx.usuario.id;
                const resultado = await cliente.save();
                console.log(resultado)
                return resultado
         },
         actualizarCliente: async(_,{id, input},ctx) =>{
            const {email} = input
            let clienteEmail = await Cliente.findOne({email})
            
            let cliente = await Cliente.findById(id);
           
           
            if(!cliente){
                throw new Error('El cliente no existe')
            }
          
            if(cliente.email !== clienteEmail.email && clienteEmail){
                throw new Error(` Ya existe un cliente con el email ${clienteEmail.email}`   )
            }


          
            
           
            
            if(cliente.vendedor.toString()!== ctx.usuario.id){
                throw new Error('No tienes los credenciales')
            }
            cliente = await Cliente.findOneAndUpdate({_id: id}, input, {new: true});
            return cliente 
         },
         eliminarCliente: async (_, {id}, ctx) =>{
             const cliente = await Cliente.findById(id);
             console.log(cliente)
             if(!cliente){
                 throw new Error('El cliente no existe')
             }
             if(cliente.vendedor.toString() !== ctx.usuario.id){
                 throw new Error('No tienes los credenciales')
             }

             await Cliente.findOneAndDelete({_id: id});
             return "Eliminado con exito"
         },
         nuevoPedido: async (_, {input}, ctx)=>{

            const {cliente} = input
            
          
            //verificar si cliente existe
            let clienteExiste = await Cliente.findById(cliente);
            console.log(clienteExiste);
            if(!clienteExiste){
                throw new Error('El cliente no existe')
            }
            //verificar si el cliente es del vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id){
                throw new Error('No tienes los credenciales')
            }
            //revisar si el stock ests disponible
            for await(const articulo of input.pedido) {
                const {id} = articulo
                const producto = await Producto.findById(id)

                if(!producto){
                    throw new Error('Producto no existe')
                }
                if(articulo.cantidad > producto.existencia){
                    throw new Error(`El producto ${producto.nombre} excede la cantidad disponible a la seleccionada.`)
                }else{
                    producto.existencia = producto.existencia - articulo.cantidad
                    producto.save();
                }
            }
            //asignar un vendedor
            const pedido = new Pedido(input);
            pedido.vendedor = ctx.usuario.id
            const resultado = await pedido.save()

            return resultado
            //guardar
            
         },
         actualizarPedido: async (_, {id, input}, ctx)=>{
             const {cliente} = input
             const pedido = await Pedido.findById(id)
             const existeCliente = await Cliente.findById(cliente)
             if(!pedido){
                 throw new Error('El pedido no existe')
             }
             if(!existeCliente){
                 throw new Error('El cliente no existe')
             }
             if(existeCliente.vendedor.toString()!== ctx.usuario.id){
                 throw new Error('No tienes los credenciales')
             }
             if(input.pedido){
                for await(const articulo of input.pedido) {
                    const {id} = articulo
                    const producto = await Producto.findById(id)
    
                    if(!producto){
                        throw new Error('Producto no existe')
                    }
                    if(articulo.cantidad > producto.existencia){
                        throw new Error('Excede la cantidad disponible')
                    }else{
                        producto.existencia = producto.existencia - articulo.cantidad
                        producto.save();
                    }
                }
             }
            
          const resultado = await Pedido.findOneAndUpdate({_id: id}, input, {new:true})
            return resultado

            },
         eliminarPedido: async(_,{id}, ctx)=>{
            const pedido = await Pedido.findById(id)
            if(!pedido){
                throw new Error('El pedido no existe')
            }
            if(pedido.vendedor.toString() ==! ctx.usuario.id){
                throw new Error('No tienes los credenciales')
            } 
            await Pedido.findOneAndDelete({_id:id})
            return "Pedido eliminado"
         }
    }
}

module.exports = resolvers;