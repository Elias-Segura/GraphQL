const { gql } = require('apollo-server');
const typeDefs = gql`
 type Usuario{
     id:ID
     nombre:String
     apellido: String
     email: String
     creado:String
 }
 type Producto{
   id:ID
   nombre: String
   existencia: Int
   precio: Float
   creado: String 
 }
 type Cliente{
    id:ID
    nombre:String
    apellido: String 
    empresa: String
    email: String
    telefono:String
    vendedor: ID
 } 
 type TopCliente{
    total: Float
    cliente:[Cliente]
 }
 type TopVendedor{
    total:Float
    vendedor:[Usuario]
 }
 type Pedido{
   id: ID
   pedido: [PedidoGrupo]
   total: Float
   cliente: Cliente
   vendedor:ID
   fecha:String
   estado: EstadoPedido

 }
 type PedidoGrupo{
    id:ID
    cantidad:Int,
    nombre:String, 
    precio: Float 
 }
 type Token {
    token:String
 }
 input UsuarioInput{
    nombre:String!, 
    apellido:String!,
    email:String!,
    password: String!


 }
 input ProductoInput{
    nombre: String!,
    existencia: Int!,
    precio: Float!
 }
 input ClienteInput{
    nombre: String!,
    apellido: String!,
    empresa: String!,
    email: String!,
    telefono: String
 }
 input PedidoProductoInput{
    id: ID!
    cantidad: Int,
    nombre:String, 
    precio: Float 
 }
 input PedidoInput{
    pedido:[PedidoProductoInput]
    total:Float
    cliente: ID
    estado: EstadoPedido
 }
 enum EstadoPedido{
    PENDIENTE
    COMPLETADO
    CANCELADO
 }
 input AutenticarInput{
    email: String!,
    password: String!

 }
  type Query {
    #usuarios

    obtenerUsuario: Usuario
   
    #productos 

    obtenerProductos:[Producto]
    obtenerProducto(id: ID!):Producto

    #Clientes

    obtenerClientes: [Cliente]
    obtenerClientesVendedor:[Cliente]
    obtenerCliente(id:ID!): Cliente

    #Pedidos
    obtenerPedidos: [Pedido]
    obtenerPedidosVendedor: [Pedido]
    obtenerPedido(id:ID!): Pedido
    obtenerPedidoEstado(estado: String!): [Pedido]

    #Busquedas avanzadas
    mejoresClientes: [TopCliente]
    mejoresVendedores: [TopVendedor]
    buscarProducto(texto: String!): [Producto]
   }
  type Mutation{
    #Usuarios
    nuevoUsuario(input: UsuarioInput):Usuario
    autenticarUsuario(input: AutenticarInput): Token 
    #Producto
    nuevoProducto(input: ProductoInput ): Producto
    actualizarProducto(id:ID!, input:ProductoInput): Producto
    eliminarProducto(id:ID!): String 

    #Cliente
    nuevoCliente(input: ClienteInput): Cliente
    actualizarCliente(id:ID!, input:ClienteInput): Cliente
    eliminarCliente(id:ID!): String 

    #Pedido
    nuevoPedido(input: PedidoInput): Pedido
    actualizarPedido(id:ID!, input: PedidoInput): Pedido
    eliminarPedido(id:ID!): String 
  }


`;
module.exports = typeDefs;