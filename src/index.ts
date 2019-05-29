import { ApolloServer, gql } from 'apollo-server';
import fs from 'fs';
import data from './data';

// Data access layer
function getUserById(id) {
    return data.users.find(user => user.id == id)
}

function getPostById(id) {
    return data.posts.find(post => post.id == id)
}

function getPostsByAuthorId(authorId) {
    return data.posts.filter(post => post.authorId == authorId);
}

// GraphQL related setup
const typeDefs = gql`${fs.readFileSync(__dirname + '/schema.graphql')}`;
const resolvers = {
    Query: {
        users: () => data.users,
        posts: () => data.posts,
        user: (_, { id }) => getUserById(id),
        post: (_, { id }) => getPostById(id),
    },
    User: {
        posts: (user) => getPostsByAuthorId(user.id)
    },
    Post: {
        author: (post) => getUserById(post.authorId)
    }
};

const server = new ApolloServer({ typeDefs, resolvers });

const port = process.env.PORT || 4000;
server.listen(port).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});