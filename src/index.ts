import express from 'express';
import graphqlHTTP from 'express-graphql';
import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import data from './data';

// GraphQL related setup
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: {
            type: new GraphQLNonNull(GraphQLID)
        },
        name: {
            type: new GraphQLNonNull(GraphQLString)
        },
        email: {
            type: GraphQLString
        },
        posts: {
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PostType))),
            resolve: (user) => getPostsByAuthorId(user.id)
        }
    })
});

const PostType = new GraphQLObjectType({
    name: 'Post',
    fields: {
        id: {
            type: new GraphQLNonNull(GraphQLID)
        },
        title: {
            type: new GraphQLNonNull(GraphQLString)
        },
        body: {
            type: GraphQLString
        },
        authorId: {
            type: GraphQLID
        },
        author: {
            type: UserType,
            resolve: (post) => getUserById(post.authorId)
        },
    }
});

const QueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Demo app root query fields',
    fields: {
        users: {
            description: 'All users in database',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
            resolve: () => data.users
        },
        user: {
            description: 'User by ID',
            type: UserType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLID),
                    description: 'User ID'
                }
            },
            resolve: (_, { id }) => getUserById(id)
        },
        posts: {
            description: 'All posts in database',
            type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PostType))),
            resolve: () => data.posts
        },
        post: {
            description: 'Post by ID',
            type: PostType,
            args: {
                id: {
                    type: new GraphQLNonNull(GraphQLID),
                    description: 'Post ID'
                }
            },
            resolve: (_, { id }) => getPostById(id)
        },

    }
});

const schema = new GraphQLSchema({
    query: QueryType
});

function getUserById(id) {
    return data.users.find(user => user.id == id)
}

function getPostById(id) {
    return data.posts.find(post => post.id == id)
}

function getPostsByAuthorId(authorId) {
    return data.posts.filter(post => post.authorId == authorId);
}

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
