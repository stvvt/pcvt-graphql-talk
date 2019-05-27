import { ApolloServer, gql } from 'apollo-server';
import data from './data';

const typeDefs = gql`
    """ Demo app root query fields """
    type Query {
        """All users in database"""
        users: [User!]!

        """ All posts in database"""
        posts: [Post!]!

        """User by ID"""
        user("""User ID""" id: ID!): User!

        """Post by ID"""
        post(id: ID!): Post!
    }

    """Represents an user of the app"""
    type User {
        id: ID!
        name: String!
        email: String
        posts: [Post!]!
    }

    """Represents a blog post"""
    type Post {
        id: ID!
        title: String!
        body: String!
        authorId: String
        author: User
    }
`;

function getUserById(id) {
    return data.users.find(user => user.id == id)
}

function getPostById(id) {
    return data.posts.find(post => post.id == id)
}

function getPostsByAuthorId(authorId) {
    return data.posts.filter(post => post.authorId == authorId);
}

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

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});