// Importar las dependencias necesarias
import {ApolloServer} from '@apollo/server';
import {createServer} from 'http';
import {expressMiddleware} from '@apollo/server/express4';
import {ApolloServerPluginDrainHttpServer} from '@apollo/server/plugin/drainHttpServer';
import bodyParser from 'body-parser';
import express from 'express';
import {WebSocketServer} from 'ws';
import {useServer} from 'graphql-ws/lib/use/ws';
import {PubSub} from 'graphql-subscriptions';
import {readFileSync} from 'fs';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {v4 as uuidv4} from 'uuid';
import cors from 'cors';

// |----------------------------------------------------------------------------------------------------------------|
// |                                                                                                                |
// |----------------------------------------------------------------------------------------------------------------|

function generateId() {
    return uuidv4().replace(/-/g, "").substring(0, 24);
}

// Puerto en el que se ejecutará el servidor
const port = 3000;

// Lee el esquema GraphQL desde un archivo externo
const typeDefs = readFileSync('./src/schemas/schema.graphql', 'utf8');

// Crear una instancia de PubSub
const pubsub = new PubSub();

// Arreglos de datos
let movies = [
    {
        id: '3faedc9b7e8104a5b623c129',
        title: 'Harry Potter and the Philosopher\'s Stone',
        description: 'Harry Potter has lived under the stairs at his aunt and uncle\'s house his whole life. But on his 11th birthday, he learns he\'s a powerful wizard -- with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry.',
        subscriptionPackage: 'BASICO',
        imageUrl: 'https://th.bing.com/th/id/OIP.eGj4A1QtOZ-xrhWhups6BwHaEK?rs=1&pid=ImgDetMain',
        trailerUrl: 'VyHV0BRtdxo',
        createdAt: "2024-05-07T16:54:52.212Z"
    },
    {
        id: '6d48b5fa07e3c9a2f1e48d53',
        title: 'Harry Potter and the Philosopher\'s Stone',
        description: 'Harry Potter has lived under the stairs at his aunt and uncle\'s house his whole life. But on his 11th birthday, he learns he\'s a powerful wizard -- with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry.',
        subscriptionPackage: 'BASICO',
        imageUrl: 'https://i.ebayimg.com/images/g/dEUAAOSwECtkD628/s-l1200.webp',
        trailerUrl: 'VyHV0BRtdxo',
        createdAt: "2024-05-07T16:54:52.212Z"
    },
    {
        id: 'e2f5a394d7b68e1c40b9a82f',
        title: 'Harry Potter and the Philosopher\'s Stone',
        description: 'Harry Potter has lived under the stairs at his aunt and uncle\'s house his whole life. But on his 11th birthday, he learns he\'s a powerful wizard -- with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry.',
        subscriptionPackage: 'BASICO',
        imageUrl: 'https://img.buzzfeed.com/buzzfeed-static/complex/images/gdv2pu6io6ekpg5r8mta/back-to-the-future.jpg?output-format=jpg&output-quality=auto',
        trailerUrl: 'VyHV0BRtdxo',
        createdAt: "2024-05-07T16:54:52.212Z"
    },
    {
        id: 'e2f5a394d7b48e1c40b9a82f',
        title: 'Harry Potter and the Philosopher\'s Stone',
        description: 'Harry Potter has lived under the stairs at his aunt and uncle\'s house his whole life. But on his 11th birthday, he learns he\'s a powerful wizard -- with a place waiting for him at the Hogwarts School of Witchcraft and Wizardry.',
        subscriptionPackage: 'BASICO',
        imageUrl: 'https://artofthemovies.co.uk/cdn/shop/files/IMG_4154_1-780453_de0cc110-550d-4448-a7ec-d3ff945c0739.jpg?v=1696169470',
        trailerUrl: 'VyHV0BRtdxo',
        createdAt: "2024-05-07T16:54:52.212Z"
    }
];

let users = [
    {
        id: 'b7d4e3a8f6c90e4b1f25d63a',
        name: 'John Doe',
        email: 'example1@example.com',
        password: '123456',
        subscriptionPackage: 'BASICO',
        createdAt: "2024-05-07T16:54:52.212Z"
    },
    {
        id: '8c5a1d9f7e4b36a0b2e7f5d8',
        name: 'John Doe',
        email: 'example2@example.com',
        password: '123456',
        subscriptionPackage: 'ESTANDAR',
        createdAt: "2024-05-07T16:54:52.212Z"
    },
    {
        id: '9a7b3e4f8c6d2e1b5f9a0c47',
        name: 'John Doe',
        email: 'example3@example.com',
        password: '123456',
        subscriptionPackage: 'PREMIUM',
        createdAt: "2024-05-07T16:54:52.212Z"
    }
];

const MOVIE_ADDED = 'MOVIE_ADDED';
const USER_ADDED = 'USER_ADDED';
const BASIC_MOVIE_ADDED = 'BASIC_MOVIE_ADDED';
const STANDARD_MOVIE_ADDED = 'STANDARD_MOVIE_ADDED';
const PREMIUM_MOVIE_ADDED = 'PREMIUM_MOVIE_ADDED';

const resolvers = {
    Query: {
        // GET ALL
        getAllMoviesBySubscription: (root, args) => {
            // Si el argumento subscriptionPackage no es 'BASICO', 'ESTANDAR, 'PREMIUM', retornar un arreglo vacío
            if (!['BASICO', 'ESTANDAR', 'PREMIUM'].includes(args.subscriptionPackage)) return [];

            // Retornar una copia profunda de las películas que coincidan con el subscriptionPackage
            return JSON.parse(JSON.stringify(movies.filter(movie => movie.subscriptionPackage === args.subscriptionPackage)));
        },
        getAllUsers: () => {
            // Retornar una copia profunda de todos los usuarios
            return JSON.parse(JSON.stringify(users));
        },
        // GET BY ID
        getMovieById: (root, args) => {
            // Buscar y retornar una copia profunda de la película que coincida con él id
            return JSON.parse(JSON.stringify(movies.find(movie => movie.id === args.id)));
        },
        getUserById: (root, args) => {
            // Buscar y retornar una copia profunda del usuario que coincida con él id
            return JSON.parse(JSON.stringify(users.find(user => user.id === args.id)));
        }
    },
    Mutation: {
        // CREATE
        createMovie: (root, args) => {
            // Verificar que la suscripción proporcionada sea 'BASICO', 'ESTANDAR' o 'PREMIUM'
            if (!['BASICO', 'ESTANDAR', 'PREMIUM'].includes(args.subscriptionPackage)) return 'El paquete de suscripción debe ser BASICO, ESTANDAR o PREMIUM';
            // Crear un nuevo objeto de tipo película
            const newMovie = {
                id: generateId(),
                title: args.title,
                description: args.description,
                subscriptionPackage: args.subscriptionPackage,
                imageUrl: args.imageUrl,
                trailerUrl: args.trailerUrl,
                createdAt: new Date().toISOString()
            };
            // Agregar la nueva película al arreglo de películas
            movies.push(newMovie);
            // Publicar la película creada dependiendo del paquete de suscripción
            switch (newMovie.subscriptionPackage) {
                case 'BASICO':
                    pubsub.publish(BASIC_MOVIE_ADDED, {basicMovieAdded: newMovie});
                    break;
                case 'ESTANDAR':
                    pubsub.publish(STANDARD_MOVIE_ADDED, {standardMovieAdded: newMovie});
                    break;
                case 'PREMIUM':
                    pubsub.publish(PREMIUM_MOVIE_ADDED, {premiumMovieAdded: newMovie});
                    break;
            }
            // Sin importar el paquete de suscripción, publicar la película creada por defecto
            pubsub.publish(MOVIE_ADDED, {movieAdded: newMovie});
            // Retornar un mensaje de éxito
            return 'Película creada con éxito';
        },
        createUser: (root, args) => {
            // Verificar que la suscripción proporcionada sea 'BASICO', 'ESTANDAR' o 'PREMIUM'
            if (!['BASICO', 'ESTANDAR', 'PREMIUM'].includes(args.subscriptionPackage)) return 'El paquete de suscripción debe ser BASICO, ESTANDAR o PREMIUM';
            // Crear un nuevo objeto de tipo usuario
            const newUser = {
                id: generateId(),
                name: args.name,
                email: args.email,
                password: args.password,
                subscriptionPackage: args.subscriptionPackage,
                createdAt: new Date().toISOString()
            };
            // Agregar el nuevo usuario al arreglo de usuarios
            users.push(newUser);
            // Publicar el usuario creado
            pubsub.publish(USER_ADDED, {userAdded: newUser});
            // Retornar un mensaje de éxito
            return 'Usuario creado con éxito';
        },
        // DELETE
        deleteMovie: (root, args) => {
            // Buscar el índice de la película que coincida con él id, si no existe retornar un mensaje de error
            const index = movies.findIndex(movie => movie.id === args.id);
            if (index === -1) return 'La película no existe';
            // Filtrar todas las películas a excepción de la que se quiere eliminar, y actualizar la lista de películas
            movies = JSON.parse(JSON.stringify(movies.filter(movie => movie.id !== args.id)));
            // Retornar un mensaje de éxito
            return 'Película eliminada con éxito';
        },
        deleteUser: (root, args) => {
            // Buscar el índice del usuario que coincida con él id, si no existe retornar un mensaje de error
            const index = users.findIndex(user => user.id === args.id);
            if (index === -1) return 'El usuario no existe';
            // Filtrar todos los usuarios a excepción del que se quiere eliminar, y actualizar la lista de usuarios
            users = JSON.parse(JSON.stringify(users.filter(user => user.id !== args.id)));
            // Retornar un mensaje de éxito
            return 'Usuario eliminado con éxito';
        },
        // UPDATE
        updateMovie: (root, args) => {
            // Buscar el índice de la película que coincida con él id, si no existe retornar un mensaje de error
            const index = movies.findIndex(movie => movie.id === args.id);
            if (index === -1) return 'La película no existe';
            // Obtener la información de los argumentos
            const {title, description, subscriptionPackage, imageUrl, trailerUrl} = args;
            // Actualizar la información de la película
            movies[index] = {
                ...movies[index],
                title: title || movies[index].title,
                description: description || movies[index].description,
                subscriptionPackage: subscriptionPackage || movies[index].subscriptionPackage,
                imageUrl: imageUrl || movies[index].imageUrl,
                trailerUrl: trailerUrl || movies[index].trailerUrl
            };
            // Retornar un mensaje de éxito
            return 'Película actualizada con éxito';
        },
        updateUser: (root, args) => {
            // Buscar el índice del usuario que coincida con él id, si no existe retornar un mensaje de error
            const index = users.findIndex(user => user.id === args.id);
            if (index === -1) return 'El usuario no existe';
            // Obtener la información de los argumentos
            const {name, email, password, subscriptionPackage} = args;
            // Actualizar la información del usuario
            users[index] = {
                ...users[index],
                name: name || users[index].name,
                email: email || users[index].email,
                password: password || users[index].password,
                subscriptionPackage: subscriptionPackage || users[index].subscriptionPackage
            };
            // Retornar un mensaje de éxito
            return 'Usuario actualizado con éxito';
        },
        // LOGIN
        login: (root, args) => {
            // Buscar un usuario que coincida con el email y la contraseña proporcionados
            const user = users.find(user => user.email === args.email && user.password === args.password);
            // Si no se encuentra un usuario, retornar un mensaje de error
            if (!user) return 'Credenciales incorrectas';
            // Retornar el usuario encontrado
            return user;
        }
    },
    Subscription: {
        movieAdded: {
            subscribe: () => pubsub.asyncIterator([MOVIE_ADDED]),
            resolve: (payload) => {
                // Retornar la película que acaba de ser creada
                return payload.movieAdded;
            }
        },
        basicMovieAdded: {
            subscribe: () => pubsub.asyncIterator([BASIC_MOVIE_ADDED]),
            resolve: (payload) => {
                // Retornar la película que acaba de ser creada, si el paquete de suscripción es 'BASICO'
                return payload.basicMovieAdded;
            }
        },
        standardMovieAdded:{
            subscribe: () => pubsub.asyncIterator([STANDARD_MOVIE_ADDED]),
            resolve: (payload) => {
                // Retornar la película que acaba de ser creada, si el paquete de suscripción es 'ESTANDAR'
                return payload.standardMovieAdded;
            }
        },
        premiumMovieAdded:{
            subscribe: () => pubsub.asyncIterator([PREMIUM_MOVIE_ADDED]),
            resolve: (payload) => {
                // Retornar la película que acaba de ser creada, si el paquete de suscripción es 'PREMIUM'
                return payload.premiumMovieAdded;
            }
        },
        userAdded: {
            subscribe: () => pubsub.asyncIterator([USER_ADDED]),
            resolve: (payload) => {
                // Retornar el usuario que acaba de ser creado
                return payload.userAdded;
            }
        }
    },
}

const schema = makeExecutableSchema({typeDefs, resolvers});

const app = express();
const httpServer = createServer(app);
app.use(cors());

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
});

const wsServerCleanup = useServer({schema}, wsServer);

const apolloServer = new ApolloServer({
    schema,
    plugins: [
        // Proper shutdown for the HTTP server.
        ApolloServerPluginDrainHttpServer({httpServer}),

        // Proper shutdown for the WebSocket server.
        {
            async serverWillStart() {
                return {
                    async drainServer() {
                        await wsServerCleanup.dispose();
                    }
                }
            }
        }
    ]
});

await apolloServer.start();

app.use('/graphql', bodyParser.json(), expressMiddleware(apolloServer));

httpServer.listen(port, () => {
    console.log(`🚀 Query endpoint ready at http://localhost:${port}/graphql`);
    console.log(`🚀 Subscription endpoint ready at ws://localhost:${port}/graphql`);
});

