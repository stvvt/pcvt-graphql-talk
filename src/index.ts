import express from 'express';
import graphqlHTTP from 'express-graphql';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

const QueryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        hello: {
            type: GraphQLString,
            args: {
                what: {
                    type: GraphQLString,
                    defaultValue: 'World'
                }
            },
            resolve: function (root, args) {
                return 'Hello ' + args.what;
            }
        }
    }
});

const schema = new GraphQLSchema({
    query: QueryType
})

const app = express();

app.use(graphqlHTTP({
    schema,
    graphiql: true
}));

app.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000/graphql');
})