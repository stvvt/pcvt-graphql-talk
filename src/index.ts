import express from 'express';
import graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';
import data from './data';

const app = express();

const schema = buildSchema(`
    """Demo app root query fields"""
    type Query {
        """All users in database"""
        users: [User!]!

        """All posts in database"""
        posts: [Post!]!

        """User by ID"""
        user("""User ID""" id: ID!): User!

        """Post by ID"""
        post("""Post ID""" id: ID!): Post!
    }

    type User {
        id: ID!
        name: String!
        email: String
        posts: [Post!]!
    }

    type Post {
        id: ID!
        title: String!
        body: String!
        author: User
    }
`);

function getUserById(id) {
    return data.users.find(user => user.id == id)
}

function getPostById(id) {
    return data.posts.find(post => post.id == id)
}

data.users = data.users.map(user => {
    return {
        ...user,
        posts: () => data.posts.filter(post => post.authorId == user.id)
    }
});

data.posts = data.posts.map(post => {
    return {
        ...post,
        author: () => {
            console.log(getUserById(post.authorId));
            return getUserById(post.authorId);
        }
    }
});

app.use(graphqlHTTP({
    schema,
    rootValue: {
        users: data.users,
        posts: data.posts,
        post: ({ id }) => getPostById(id),
        user: ({ id }) => getUserById(id),
    },
    graphiql: true
}));

app.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000/graphql');
})