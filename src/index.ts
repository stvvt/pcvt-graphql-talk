import express from 'express';
import graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';

const app = express();

const schema = buildSchema(`
    type Query {
        hello(what: String = "World"): String
    }
`);

app.use(graphqlHTTP({
    schema,
    rootValue: {
        hello: ({ what }: any) => {
            return what;
        }
    },
    graphiql: true
}));

app.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000/graphql');
})