import { ApolloServer, gql } from 'apollo-server';
import fs from 'fs';
import { Resolvers } from './generated/graphql';
import SofiaTrafficApi from './lib/sofiatrafficapi';

const api = new SofiaTrafficApi();

const typeDefs = gql`${fs.readFileSync(__dirname + '/schema.graphql')}`;
const resolvers: Resolvers = {
    Query: {
        stop: (_, { code }) => api.stop(code)
    },
    Stop: {
        lines: (stop) => api.lines(stop)
    }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});