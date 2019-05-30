## GraphQL Server

<small>
<ul>
<li>
Defines Schema using GraphQL Schema Definition Language (SDL)

```GQL
type User {
    id: ID!
    name: String!
    email: String
    posts: [Post!]! # -> function userPostsResolver(user) { /* Fetch users's posts somehow */ return posts; }
}

type Post {
    id: ID!
    title: String!
    body: String!
    authorId: String
    author: User  # -> function postAuthorResolver(post) { /* Fetch post's author somehow */ return author; }
}

# Root query type - MANDATORY
type Query {
    users: [User!]! # -> function queryUsersResolver() { /* Fetch users from somewhere */ return users; }
    posts: [Post!]! # -> function queryPostsResolver() { ... return posts; }
    user(id: ID!): User! # -> function queryUserResolver(root, { id }) { ... return user; }
    post(id: ID!): Post! # -> function queryPostResolver(root, { id }) { ... return post; }
}
```

</li>
<li>
    Implements <strong>Field Resolvers</strong> -
    a function, associated with every field, that calculates its value
</li>
</ul>
</small>


