import express from 'express';
import graphqlHTTP from 'express-graphql';
import { graphql, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

// GraphQL related setup
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
});

graphql(schema, `
query Hello($what: String) {
    hello(what: $what)
}
`, null, null, { what: "Variable" }).then(response => console.log(JSON.stringify(response.data)));

// Express related setup
const route = '/graphql'
const port = process.env.PORT || 4000

const app = express();

app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}${route}`);
});

// Glue GraphQL and Express together
app.use(route, graphqlHTTP({
    schema,
    graphiql: true,
}));
