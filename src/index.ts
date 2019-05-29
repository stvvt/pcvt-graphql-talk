import { ApolloServer, gql } from 'apollo-server';
import fs from 'fs';
import { Resolvers } from './generated/graphql';
import SofiaTrafficApi from './lib/sofiatrafficapi';

const api = new SofiaTrafficApi();

const typeDefs = gql`${fs.readFileSync(__dirname + '/schema.graphql')}`;
const resolvers: Resolvers = {
    Query: {
        stop: (_, { code }) => api.stop(code),
        stops: async (_, { nameFilter, limit, skip }) => {
            const matching = await api.stops(nameFilter);
            return matching.slice(skip, skip + limit);
        }
    },
    Stop: {
        lines: (stop) => api.lines(stop)
    }
};

const server = new ApolloServer({ typeDefs, resolvers });

const port = process.env.PORT || 4000;
server.listen(port).then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});