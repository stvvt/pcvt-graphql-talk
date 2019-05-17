import { ApolloServer, gql } from 'apollo-server';
import data from './data';
import Orm from './orm';

const orm = new Orm(data);

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
        author: User
    }
`;

const users = orm.models.users;
const posts = orm.models.posts;

const resolvers = {
    Query: {
        users: () => users.all(),
        posts: () => posts.all(),
        user: (_, { id }) => users.find('id', id),
        post: (_, { id }) => posts.find('id', id)
    },
    User: {
        posts: (user) => posts.filter('authorId', user.id)
    },
    Post: {
        author: (post) => users.find('id', post.authorId)
    }
};


const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});